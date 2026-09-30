// ============================================================
// tools/e2e-artifact.mjs — 「枠の中」（Artifact 形式の 1 枚版）での動作確認（Playwright）
//
//   node tools/e2e-artifact.mjs [--out 出力フォルダ]
//
//  claude.ai の Artifact のように、次のことができない枠の中でも一通り使えるかを確かめる。
//   ・ファイルのダウンロード（動いたら失敗＝コピー用ダイアログに切りかわっていない）
//   ・window.print() / confirm() / alert() / prompt()（confirm は常に false を返す）
//  さらに、外枠(<html>/<head>/<body>)を置き場所側が付ける想定で、断片だけを外枠に入れて開く。
//  診断の途中 → レポート → 気になる（追加・削除）→ データ（コピーして書き出し・消去・貼りつけて読み込み）
//  → 暗い配色・ページ側の配色指定 → スマホ幅で横にはみ出さない、までを見る。
//  ※ Playwright と Chromium が必要（無ければ終了コード 2）
// ============================================================
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { ROOT, startServer, launchBrowser } from "./_browser.mjs";

const args = process.argv.slice(2);
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const OUT = path.resolve(opt("--out", path.join(ROOT, ".e2e-out")));
fs.mkdirSync(OUT, { recursive: true });

const browser = await launchBrowser();
if (!browser) {
  console.log("Playwright / Chromium が見つからないため、ブラウザでの動作確認をスキップしました。");
  process.exit(2);
}

// 断片を作って、置き場所側の外枠（最小限の下地）に入れる
const work = fs.mkdtempSync(path.join(os.tmpdir(), "tsumazuki-artifact-"));
const fragment = path.join(work, "fragment.html");
execFileSync("node", [path.join(ROOT, "tools/build-single.mjs"), "--artifact", "--out", fragment], { stdio: "pipe" });
const frag = fs.readFileSync(fragment, "utf8");
const frame = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui,sans-serif;background:#fafaf8}img{max-width:100%}[hidden]{display:none!important}</style></head><body>${frag}</body></html>`;
fs.writeFileSync(path.join(work, "index.html"), frame);
const { base: BASE, close: closeServer } = await startServer(work);

const problems = [];
const check = (cond, msg) => {
  if (!cond) problems.push(msg);
  console.log(`${cond ? "  ✓" : "  ✗"} ${msg}`);
};
const shot = (pg, name) => pg.screenshot({ path: path.join(OUT, name), fullPage: true });
const overflowX = (pg) => pg.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

try {
  console.log("■ 枠の中（Artifact 形式・スマホ 390px）");
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: false, permissions: ["clipboard-read", "clipboard-write"] });
  // 枠の中では効かない機能を、効かない形にしておく
  await ctx.addInitScript(() => {
    window.confirm = () => false;
    window.alert = () => {};
    window.prompt = () => null;
    window.print = () => {
      window.__printed = true;
    };
  });
  const pg = await ctx.newPage();
  let downloads = 0;
  pg.on("download", () => downloads++);
  pg.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning") problems.push(`console.${m.type()}: ${m.text()}`);
  });
  pg.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));

  await pg.goto(`${BASE}/`);
  await pg.waitForSelector(".hero");
  check((await pg.title()) === "つまずきナビ", "タイトルが「つまずきナビ」");
  check((await pg.evaluate(() => document.documentElement.lang)) === "ja", "lang が ja に設定される");
  check((await pg.evaluate(() => globalThis.TSUMAZUKI_SANDBOX)) === true, "枠の中用の旗が立っている");
  check((await overflowX(pg)) <= 0, "ホーム：横にはみ出さない");
  await shot(pg, "artifact-01-home.png");

  // 診断を途中まで（「わからない」で進める）
  await pg.selectOption("#grade", "8");
  await pg.fill("#nick", "テスト");
  await pg.getByRole("button", { name: "診断をはじめる" }).click();
  await pg.waitForSelector(".qcard");
  for (let i = 0; i < 6; i++) {
    await pg.getByRole("button", { name: "わからない", exact: true }).click();
    await pg.waitForSelector(".feedback");
    await pg.getByRole("button", { name: "次の問題へ" }).click();
    await pg.waitForSelector(".qcard");
  }
  check((await pg.evaluate(() => window.tsumazukiApp.store.log.filter((e) => e.type === "answer").length)) === 6, "診断：6 問ぶんの解答が記録される");

  // レポート：印刷ボタンは出さない。CSV は「コピーして保存」に切りかわる
  await pg.locator(".nav a", { hasText: "レポート" }).click();
  await pg.waitForSelector("text=つまずきレポート");
  check((await pg.getByRole("button", { name: "印刷する" }).count()) === 0, "レポート：印刷ボタンが出ない");
  check((await overflowX(pg)) <= 0, "レポート：横にはみ出さない");
  await pg.getByRole("button", { name: "単元ごとの見立てを CSV で保存" }).click();
  await pg.waitForSelector("dialog[open] textarea");
  const csv = await pg.locator("dialog[open] textarea").inputValue();
  check(csv.startsWith("\"単元ID\"") && csv.split("\n").length >= 149, "レポート：CSV の中身がダイアログに出る（BOM なし・全単元）");
  await pg.locator("dialog[open]").getByRole("button", { name: "コピー" }).click();
  await pg.waitForSelector("dialog[open] >> text=コピーしました");
  // ※ textarea の値は改行が LF にそろえられる（CSV の区切りは CRLF）ので、改行をそろえて比べる
  const clip = await pg.evaluate(() => navigator.clipboard.readText());
  check(clip.replace(/\r\n/g, "\n") === csv.replace(/\r\n/g, "\n") && clip.length > 1000, "レポート：コピーで、クリップボードに CSV が入る");
  await shot(pg, "artifact-02-copy-dialog.png");
  await pg.locator("dialog[open]").getByRole("button", { name: "閉じる" }).click();
  await pg.waitForSelector("dialog[open]", { state: "detached" });

  // 気になる：追加 → 削除（画面内の確認。confirm() は false なので、それに頼ると削除できない）
  await pg.locator(".nav a", { hasText: "気になる" }).click();
  await pg.getByRole("button", { name: "メモを追加" }).click();
  await pg.waitForSelector("dialog[open]");
  await pg.locator("dialog input[type=checkbox]").first().check();
  await pg.locator("dialog textarea").fill("枠の中でのテスト");
  await pg.getByRole("button", { name: "保存する" }).click();
  await pg.waitForSelector("dialog[open]", { state: "detached" });
  check((await pg.evaluate(() => window.tsumazukiApp.store.concerns.length)) === 1, "気になる：1 件保存される");
  await pg.getByRole("button", { name: "削除", exact: true }).click();
  await pg.waitForSelector("dialog[open]");
  await pg.locator("dialog[open]").getByRole("button", { name: "やめる" }).click();
  check((await pg.evaluate(() => window.tsumazukiApp.store.concerns.length)) === 1, "気になる：削除を「やめる」と残る");
  await pg.getByRole("button", { name: "削除", exact: true }).click();
  await pg.locator("dialog[open]").getByRole("button", { name: "削除する" }).click();
  await pg.waitForSelector("dialog[open]", { state: "detached" });
  check((await pg.evaluate(() => window.tsumazukiApp.store.concerns.length)) === 0, "気になる：確認のあと削除できる");
  // 書き出し用に 1 件戻しておく
  await pg.getByRole("button", { name: "メモを追加" }).click();
  await pg.locator("dialog textarea").fill("書き出し用");
  await pg.getByRole("button", { name: "保存する" }).click();
  await pg.waitForSelector("dialog[open]", { state: "detached" });
  await pg.getByRole("button", { name: "JSON で書き出し" }).click();
  await pg.waitForSelector("dialog[open] textarea");
  check(Array.isArray(JSON.parse(await pg.locator("dialog[open] textarea").inputValue())), "気になる：JSON もコピー用ダイアログに出る");
  await pg.locator("dialog[open]").getByRole("button", { name: "閉じる" }).click();

  // データ：書き出し（コピー）→ すべて消す → 貼りつけて読み込む
  await pg.locator(".nav a", { hasText: "データ" }).click();
  await pg.waitForSelector("text=記録の書き出し・読み込み");
  await pg.getByRole("button", { name: "書き出す（JSON）" }).click();
  await pg.waitForSelector("dialog[open] textarea");
  const exportedText = await pg.locator("dialog[open] textarea").inputValue();
  const exported = JSON.parse(exportedText);
  const nAns = exported.log.filter((e) => e.type === "answer").length;
  check(nAns === 6 && exported.concerns.length === 1, `データ：書き出しの中身（解答 ${nAns} 件・気になる ${exported.concerns.length} 件）`);
  await pg.locator("dialog[open]").getByRole("button", { name: "閉じる" }).click();

  await pg.getByRole("button", { name: "すべて消す" }).click();
  await pg.waitForSelector("dialog[open]");
  await pg.locator("dialog[open]").getByRole("button", { name: "やめる" }).click();
  check((await pg.evaluate(() => window.tsumazukiApp.store.log.length)) > 0, "データ：「やめる」なら消えない");
  await pg.getByRole("button", { name: "すべて消す" }).click();
  await pg.locator("dialog[open]").getByRole("button", { name: "消す", exact: true }).click();
  await pg.waitForSelector(".hero");
  check((await pg.evaluate(() => window.tsumazukiApp.store.log.length)) === 0, "データ：確認のあと、すべて消せる");

  await pg.locator(".nav a", { hasText: "データ" }).click();
  await pg.waitForSelector("text=記録の書き出し・読み込み");
  await pg.locator("details.fine summary").click();
  await pg.fill("#paste-json", "{ これはJSONではありません");
  await pg.click("#paste-load");
  await pg.waitForSelector("text=読み込めませんでした");
  check((await pg.evaluate(() => window.tsumazukiApp.store.log.length)) === 0, "データ：壊れたテキストは読み込まれず、理由が出る");
  await pg.fill("#paste-json", exportedText);
  await pg.click("#paste-load");
  await pg.waitForSelector("text=テストさんの学習");
  check((await pg.evaluate(() => window.tsumazukiApp.store.log.length)) === exported.log.length, "データ：貼りつけて読み込むと元にもどる");

  // 記録があるときの読み込みは、置きかえの確認が出る
  await pg.locator(".nav a", { hasText: "データ" }).click();
  await pg.waitForSelector("text=記録の書き出し・読み込み");
  await pg.locator("details.fine summary").click();
  await pg.fill("#paste-json", exportedText);
  await pg.click("#paste-load");
  await pg.waitForSelector("dialog[open]");
  await pg.locator("dialog[open]").getByRole("button", { name: "置きかえて読み込む" }).click();
  await pg.waitForSelector("text=テストさんの学習");
  check(true, "データ：記録があるときは確認のあと読み込める");
  check(downloads === 0, "ダウンロードは一度も起きていない");
  check(!(await pg.evaluate(() => window.__printed)), "印刷は呼ばれていない");

  // マップ・ホームでもはみ出さない
  await pg.locator(".nav a", { hasText: "マップ" }).click();
  await pg.waitForSelector(".map-grid");
  check((await overflowX(pg)) <= 0, "マップ：ページ全体は横にはみ出さない（表は枠の中でスクロール）");

  // 配色：端末が暗い設定／ページ側が明るい指定
  await pg.emulateMedia({ colorScheme: "dark" });
  await pg.locator(".nav a", { hasText: "ホーム" }).click();
  const bgDark = await pg.evaluate(() => getComputedStyle(document.body).backgroundColor);
  check(bgDark === "rgb(18, 22, 29)", `暗い設定の端末では暗い配色（${bgDark}）`);
  const scheme = await pg.evaluate(() => getComputedStyle(document.documentElement).colorScheme);
  check(scheme === "dark", `暗い配色では color-scheme も dark（${scheme}）`);
  await shot(pg, "artifact-03-dark.png");
  await pg.evaluate(() => (document.documentElement.dataset.theme = "light"));
  const bgLight = await pg.evaluate(() => getComputedStyle(document.body).backgroundColor);
  check(bgLight === "rgb(244, 246, 249)", `ページ側が明るい指定なら、端末が暗くても明るい配色（${bgLight}）`);
  await pg.evaluate(() => (document.documentElement.dataset.theme = "dark"));
  await pg.emulateMedia({ colorScheme: "light" });
  const bgForced = await pg.evaluate(() => getComputedStyle(document.body).backgroundColor);
  check(bgForced === "rgb(18, 22, 29)", `ページ側が暗い指定なら、端末が明るくても暗い配色（${bgForced}）`);
  await ctx.close();
} catch (e) {
  problems.push(`例外: ${e.stack || e.message}`);
} finally {
  await browser.close();
  closeServer();
  fs.rmSync(work, { recursive: true, force: true });
}

console.log("");
if (problems.length) {
  console.log(`✗ 問題 ${problems.length} 件`);
  for (const p of problems) console.log("  - " + p);
  process.exit(1);
}
console.log(`✓ 枠の中（Artifact 形式）での動作確認 OK（スクリーンショット: ${OUT}）`);
