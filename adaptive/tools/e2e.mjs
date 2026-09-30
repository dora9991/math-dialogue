// ============================================================
// tools/e2e.mjs — ブラウザで通しの動作確認（Playwright）
//
//   node tools/e2e.mjs [--out 出力フォルダ] [--seed 11]
//
//  ・adaptive/ を小さな静的サーバーで配り、実際のブラウザ（Chromium）で画面を操作する
//  ・診断 → レポート → マップ → 練習 → 気になる → データ（書き出し・読み込み・消去）を一通り
//  ・答えは画面の入力欄に打ち込む（正解の答えは、ページの中のアプリの状態から取り出す）
//  ・コンソールのエラー／未処理の例外が 1 つでもあれば失敗。スクリーンショットは --out に保存
//  ※ Playwright と Chromium が必要（無ければ、動作確認はスキップされたと表示して終了コード 2）
// ============================================================
import fs from "node:fs";
import path from "node:path";
import { ROOT, startServer, launchBrowser } from "./_browser.mjs";

const args = process.argv.slice(2);
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const OUT = path.resolve(opt("--out", path.join(ROOT, ".e2e-out")));
const SEED = opt("--seed", "11");
fs.mkdirSync(OUT, { recursive: true });

const browser = await launchBrowser();
if (!browser) {
  console.log("Playwright / Chromium が見つからないため、ブラウザでの動作確認をスキップしました。");
  process.exit(2);
}
const { base: BASE, close: closeServer } = await startServer();

const problems = [];
const check = (cond, msg) => {
  if (!cond) problems.push(msg);
  console.log(`${cond ? "  ✓" : "  ✗"} ${msg}`);
};

async function newPage(viewport) {
  const ctx = await browser.newContext({ viewport, acceptDownloads: true });
  const pg = await ctx.newPage();
  pg.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning") problems.push(`console.${m.type()}: ${m.text()}`);
  });
  pg.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
  return { ctx, pg };
}

/** いま出ている問題に、正しい(または誤った)答えを画面から入力して「答える」 */
async function answerCurrent(pg, { correct = true, skip = false } = {}) {
  const info = await pg.evaluate(async () => {
    const { correctResponse } = await import("/js/core/items.js");
    const it = window.tsumazukiApp.session.current.item;
    return { kind: it.kind, uid: it.uid, resp: correctResponse(it), nChoices: it.choices?.length || 0, fields: it.fields?.map((f) => f.id) || [] };
  });
  if (skip) {
    await pg.click("text=わからない");
  } else {
    if (info.kind === "choice") {
      const want = correct ? info.resp.index : (info.resp.index + 1) % info.nChoices;
      await pg.locator(".choice").nth(want).click();
    } else if (info.kind === "num") {
      await pg.locator(".in").first().fill(correct ? info.resp.text : "7777");
    } else {
      for (const id of info.fields) await pg.locator(`.in[data-fid="${id}"]`).fill(correct ? info.resp.values[id] : "9999");
    }
    await pg.getByRole("button", { name: "答える" }).click();
  }
  await pg.waitForSelector(".feedback");
  return info;
}

/** いくつかの要素のうち、どれかが出るまで待つ（Playwright の "a, text=b" は使えないので or で束ねる） */
const waitAny = (pg, ...sels) => sels.map((q) => pg.locator(q)).reduce((a, b) => a.or(b)).first().waitFor();

const shot = (pg, name) => pg.screenshot({ path: path.join(OUT, name), fullPage: true });

try {
  // ═════ デスクトップ ═════
  console.log("■ デスクトップ（1000px）");
  let { ctx, pg } = await newPage({ width: 1000, height: 900 });
  await pg.goto(`${BASE}/?seed=${SEED}`);
  await pg.waitForSelector(".hero");
  check(await pg.locator("text=つまずきを、源流までさかのぼる").count() > 0, "ホーム画面が出る");
  await shot(pg, "01-home.png");

  await pg.selectOption("#grade", "8");
  await pg.fill("#nick", "テスト");
  await pg.getByRole("button", { name: "診断をはじめる" }).click();
  await pg.waitForSelector(".qcard");
  check(true, "診断の 1 問目が出る");

  // 答えの形が不正なときは、記録されずに促される
  let firstInfo = await pg.evaluate(() => window.tsumazukiApp.session.current.item.kind);
  let guard = 0;
  while (firstInfo === "choice" && guard++ < 8) {
    await answerCurrent(pg, { correct: true });
    await pg.getByRole("button", { name: "次の問題へ" }).click();
    await pg.waitForSelector(".qcard");
    firstInfo = await pg.evaluate(() => window.tsumazukiApp.session.current.item.kind);
  }
  if (firstInfo !== "choice") {
    const before = await pg.evaluate(() => window.tsumazukiApp.store.log.length);
    await pg.locator(".in").first().fill("abc");
    await pg.getByRole("button", { name: "答える" }).click();
    await pg.waitForTimeout(200);
    const after = await pg.evaluate(() => window.tsumazukiApp.store.log.length);
    check(before === after && (await pg.locator(".feedback").count()) === 0, "答えの形が不正なときは記録されない");
    await pg.locator(".in").first().fill("");
  }

  // 診断：正解率 65％ ほど（3 回に 1 回はまちがい、10 回に 1 回は「わからない」）
  let n = 0;
  let done = false;
  for (let i = 0; i < 40 && !done; i++) {
    const wrong = i % 3 === 1;
    const skip = i % 10 === 4;
    await answerCurrent(pg, { correct: !wrong, skip });
    n++;
    if (i === 3) await shot(pg, "02-feedback.png");
    const nextLabel = (await pg.getByRole("button", { name: "次の問題へ" }).count()) ? "次の問題へ" : null;
    if (!nextLabel) break;
    await pg.getByRole("button", { name: "次の問題へ" }).click();
    await waitAny(pg, ".qcard", "text=診断おつかれさまでした");
    done = (await pg.locator("text=診断おつかれさまでした").count()) > 0;
  }
  check(done, `診断が終了する（${n} 問）`);
  check(n >= 12 && n <= 31, "診断の問題数が 12〜30 の範囲");
  await shot(pg, "03-diag-done.png");

  // レポート
  await pg.getByRole("button", { name: "レポートを見る" }).click();
  await pg.waitForSelector("text=つまずきレポート");
  check((await pg.locator(".strand-row").count()) === 7, "レポート：7 つの領域が並ぶ");
  check((await pg.locator("text=つまずきの源流").count()) > 0, "レポート：つまずきの源流の節がある");
  await shot(pg, "04-report.png");
  const dl = pg.waitForEvent("download");
  await pg.getByRole("button", { name: "単元ごとの見立てを CSV で保存" }).click();
  const csv = fs.readFileSync(await (await dl).path(), "utf8");
  check(csv.split("\n").length >= 149, "レポート：CSV に全単元が入る");

  // マップ
  await pg.locator(".nav a", { hasText: "マップ" }).click();
  await pg.waitForSelector(".map-grid");
  check((await pg.locator(".chip-skill").count()) === 148, "マップ：148 の単元が並ぶ");
  await pg.locator(".chip-skill").nth(40).click();
  await pg.waitForSelector(".detail .detail-head");
  check(true, "マップ：単元をクリックすると詳細が出る");
  await shot(pg, "05-map.png");

  // 練習（この単元を練習 → 数問）
  await pg.getByRole("button", { name: "この単元を練習する" }).click();
  await pg.waitForSelector(".qcard");
  const firstPractice = await pg.evaluate(() => window.tsumazukiApp.session.current.item.skillId);
  check(true, `練習が始まる（最初の単元: ${firstPractice}）`);
  for (let i = 0; i < 14; i++) {
    await answerCurrent(pg, { correct: i % 4 !== 3 });
    if (i === 2) await shot(pg, "06-practice.png");
    await pg.getByRole("button", { name: "次へ" }).click();
    await waitAny(pg, ".qcard", "text=今回の練習のふりかえり");
    if ((await pg.locator("text=今回の練習のふりかえり").count()) > 0) break;
  }
  const nPractice = await pg.evaluate(() => window.tsumazukiApp.store.log.filter((e) => e.mode === "practice").length);
  check(nPractice >= 10, `練習の解答が記録される（${nPractice} 問）`);

  // 練習を終える → ふりかえり → つづけて練習（ハッシュが同じでも画面が更新される）
  if ((await pg.locator("text=今回の練習のふりかえり").count()) === 0) {
    await pg.getByRole("button", { name: "練習を終える" }).click();
    await pg.waitForSelector("text=今回の練習のふりかえり");
  }
  await shot(pg, "06b-practice-done.png");
  check(true, "練習のふりかえり画面が出る");
  await pg.getByRole("button", { name: "つづけて練習" }).click();
  await pg.waitForSelector(".qcard");
  check(true, "「つづけて練習」で次の練習が始まる");

  // 気になる
  await pg.waitForSelector(".qcard");
  await pg.getByRole("button", { name: "気になる" }).first().click();
  await pg.waitForSelector("dialog[open]");
  await pg.locator("dialog input[type=checkbox]").first().check();
  await pg.locator("dialog textarea").fill("テスト用のメモです");
  await shot(pg, "07-concern-dialog.png");
  await pg.getByRole("button", { name: "保存する" }).click();
  await pg.waitForSelector("dialog[open]", { state: "detached" });
  await pg.locator(".nav a", { hasText: "気になる" }).click();
  await pg.waitForSelector(".concern");
  check((await pg.locator(".concern").count()) === 1, "気になる：1 件保存される");
  await pg.getByRole("button", { name: "問題を再現して見る" }).click();
  await pg.waitForSelector(".repro-body");
  check((await pg.locator(".repro-body .q").innerText()).length > 3, "気になる：問題を再現できる");
  await shot(pg, "08-concerns.png");

  // データ：書き出し → 消去 → 読み込み
  await pg.locator(".nav a", { hasText: "データ" }).click();
  await pg.waitForSelector("text=記録の書き出し・読み込み");
  const dl2 = pg.waitForEvent("download");
  await pg.getByRole("button", { name: "書き出す（JSON）" }).click();
  const exportPath = await (await dl2).path();
  const exported = JSON.parse(fs.readFileSync(exportPath, "utf8"));
  check(exported.log.length > 20 && exported.concerns.length === 1, `データ：書き出し（記録 ${exported.log.length} 件）`);
  pg.once("dialog", (d) => d.accept());
  await pg.getByRole("button", { name: "すべて消す" }).click();
  await pg.waitForSelector(".hero");
  check((await pg.evaluate(() => window.tsumazukiApp.store.log.length)) === 0, "データ：すべて消すと空になる");
  await pg.locator(".nav a", { hasText: "データ" }).click();
  await pg.waitForSelector("text=記録の書き出し・読み込み");
  await pg.locator("input[type=file]").setInputFiles(exportPath);
  await pg.waitForSelector("text=テストさんの学習");
  check((await pg.evaluate(() => window.tsumazukiApp.store.log.length)) === exported.log.length, "データ：読み込みで元にもどる");
  // 再読み込みしても残る（localStorage）
  await pg.reload();
  await pg.waitForSelector("text=テストさんの学習");
  check(true, "再読み込みしても記録が残る");
  await shot(pg, "09-home-after.png");
  await ctx.close();

  // ═════ 診断の途中で再読み込み → 続きから ═════
  console.log("■ 診断の途中で再読み込み");
  ({ ctx, pg } = await newPage({ width: 1000, height: 900 }));
  await pg.goto(`${BASE}/?seed=${SEED}`);
  await pg.waitForSelector(".hero");
  await pg.getByRole("button", { name: "診断をはじめる" }).click();
  await pg.waitForSelector(".qcard");
  for (let i = 0; i < 5; i++) {
    await answerCurrent(pg, { correct: true });
    await pg.getByRole("button", { name: "次の問題へ" }).click();
    await pg.waitForSelector(".qcard");
  }
  await pg.reload();
  await pg.waitForSelector(".qcard");
  const qno = await pg.locator(".qno").innerText();
  const label = await pg.locator(".prog-label").innerText();
  check(qno.startsWith("6"), `再読み込みのあと、6 問目から続く（${qno}）`);
  check(label.includes("5 問"), "進みぐあいが引きつがれる");
  await ctx.close();

  // ═════ ダークモード ═════
  console.log("■ ダークモード");
  {
    const c = await browser.newContext({ viewport: { width: 1000, height: 900 }, colorScheme: "dark" });
    const p2 = await c.newPage();
    p2.on("console", (m) => {
      if (m.type() === "error" || m.type() === "warning") problems.push(`console.${m.type()}: ${m.text()}`);
    });
    p2.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
    await p2.goto(`${BASE}/?seed=${SEED}`);
    await p2.waitForSelector(".hero");
    await p2.getByRole("button", { name: "診断をはじめる" }).click();
    await p2.waitForSelector(".qcard");
    for (let i = 0; i < 9; i++) {
      await answerCurrent(p2, { correct: i % 3 !== 1 });
      if (i === 1) await shot(p2, "14-dark-feedback.png");
      await p2.getByRole("button", { name: "次の問題へ" }).click();
      await p2.waitForSelector(".qcard");
    }
    await p2.goto(`${BASE}/#/map`);
    await p2.waitForSelector(".map-grid");
    await shot(p2, "15-dark-map.png");
    await p2.goto(`${BASE}/#/report`);
    await p2.waitForSelector("text=つまずきレポート");
    await shot(p2, "16-dark-report.png");
    const bg = await p2.evaluate(() => getComputedStyle(document.body).backgroundColor);
    check(bg !== "rgb(244, 246, 249)", `ダークモードで背景色が切りかわる（${bg}）`);
    await c.close();
  }

  // ═════ スマホ ═════
  console.log("■ スマホ（375px）");
  ({ ctx, pg } = await newPage({ width: 375, height: 760 }));
  await pg.goto(`${BASE}/?seed=${SEED}`);
  await pg.waitForSelector(".hero");
  await pg.getByRole("button", { name: "診断をはじめる" }).click();
  await pg.waitForSelector(".qcard");
  let sawFields = false;
  let sawChoice = false;
  for (let i = 0; i < 18; i++) {
    const kind = await pg.evaluate(() => window.tsumazukiApp.session.current.item.kind);
    if (kind === "fields" && !sawFields) {
      sawFields = true;
      await shot(pg, "10-mobile-fields.png");
    }
    if (kind === "choice" && !sawChoice) {
      sawChoice = true;
      await shot(pg, "11-mobile-choice.png");
    }
    // 画面が横にはみ出していない
    const over = await pg.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (over > 2) problems.push(`スマホ幅で横にはみ出した（${over}px）: ${await pg.evaluate(() => window.tsumazukiApp.session.current.item.uid)}`);
    await answerCurrent(pg, { correct: i % 3 !== 1 });
    await pg.getByRole("button", { name: "次の問題へ" }).click();
    await waitAny(pg, ".qcard", "text=診断おつかれさまでした");
    if ((await pg.locator("text=診断おつかれさまでした").count()) > 0) break;
  }
  check(true, "スマホ幅で診断を進められる（横にはみ出さない）");
  await pg.goto(`${BASE}/#/map`);
  await pg.waitForSelector(".map-grid");
  await shot(pg, "12-mobile-map.png");
  await pg.goto(`${BASE}/#/report`);
  await pg.waitForSelector("text=つまずきレポート");
  await shot(pg, "13-mobile-report.png");
  await ctx.close();
} catch (e) {
  problems.push(`テストが途中で止まりました: ${e.message}`);
  console.error(e);
} finally {
  await browser.close();
  closeServer();
}

console.log("");
if (problems.length) {
  console.log(`✗ 問題あり: ${problems.length} 件`);
  for (const p of problems) console.log("  - " + p);
  process.exit(1);
}
console.log(`✓ ブラウザでの通し動作確認 OK（スクリーンショット: ${OUT}）`);
