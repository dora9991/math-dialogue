/* 練習用サンプル（conference-editor/sample/）の検査。
   使い方：NODE_PATH=$(npm root -g) node conference-editor/test/sample.js [スクリーンショットの保存先]
   環境変数：DEMO_DIR（サンプルサイトのフォルダ。既定は ../../public/conference-demo）
   サンプルサイトが無ければ、「サンプルサイトに反映される」部分だけ飛ばす（サンプルサイトがまだこのブランチに無いとき）。
   確かめること：
     ・開くと、サンプルの内容が下書きに入っている（お知らせ3・大会概要9・日程3日）／最初は未公開
     ・「サンプル」の帯と案内が出る／ログイン欄が出ない／本物の保存先（Supabase）には、通信も接続の部品もない
     ・書き換えて保存・公開した内容が、再読み込みしても残る（最初の内容で上書きされない）
     ・公開した内容が、サンプルサイトに ?local を付けて開いたときだけ出る（付けなければ出ない）
     ・「最初の状態に戻す」で、書き換え・公開が消える（未保存の変更があっても、離れる確認が出ない）
     ・編集画面の部品（id）が、サンプルの画面にそろっている／スマホ幅で横にはみ出さない */
const fs = require("fs"), path = require("path"), http = require("http"), os = require("os");
const { chromium } = require("playwright");

const EDITOR_DIR = path.resolve(__dirname, "..");
const DEMO_DIR = path.resolve(process.env.DEMO_DIR || path.join(__dirname, "..", "..", "public", "conference-demo"));
const HAS_DEMO = fs.existsSync(path.join(DEMO_DIR, "index.html"));

let bad = 0;
const ok = (c, m) => { if (!c) { bad++; console.log("✗", m); } else if (process.env.VERBOSE) console.log("✓", m); };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), m + "  期待 " + JSON.stringify(b) + " 実際 " + JSON.stringify(a));

// ---- 静的な検査（ブラウザなし）----
const SAMPLE_DIR = path.join(EDITOR_DIR, "sample");
const html = fs.readFileSync(path.join(SAMPLE_DIR, "index.html"), "utf-8");
const editorJs = fs.readFileSync(path.join(EDITOR_DIR, "js", "editor.js"), "utf-8");
const need = Array.from(new Set((editorJs.match(/\$\("(ce-[a-z-]+)"\)/g) || []).map((s) => s.slice(3, -2))));
need.forEach((id) => ok(html.indexOf('id="' + id + '"') >= 0, "サンプルの画面に、編集画面が使う部品 #" + id + " がある"));
const scripts = Array.from(html.matchAll(/<script[^>]*\ssrc="([^"]+)"/g)).map((m) => m[1]);
ok(scripts.length > 0 && !scripts.some((s) => /store-supabase/.test(s)), "サンプルは store-supabase.js を読み込まない  " + scripts.join(","));
fs.readdirSync(SAMPLE_DIR).forEach((f) => {
  const t = fs.readFileSync(path.join(SAMPLE_DIR, f), "utf-8");
  ok(!/supabase\.co|sb_publishable_|SUPABASE_URL|SUPABASE_ANON_KEY/.test(t), "sample/" + f + " に、Supabase の接続先・キーが書かれていない");
});
const SAMPLE_DATA = (() => { const w = {}; new Function("window", fs.readFileSync(path.join(SAMPLE_DIR, "sample-data.js"), "utf-8"))(w); return w.CONF_SAMPLE_DATA; })();
eq([SAMPLE_DATA.news.length, SAMPLE_DATA.overview.length, SAMPLE_DATA.program.length], [3, 9, 3], "サンプルの最初の内容の件数（お知らせ・概要・日数）");

// ---- 並べて配信（公開先と同じ並び：/conference-editor/sample/ と /conference-demo/）----
const ROOT = fs.mkdtempSync(path.join(os.tmpdir(), "sample-"));
function copy(src, dst, skip) {
  fs.mkdirSync(dst, { recursive: true });
  fs.readdirSync(src, { withFileTypes: true }).forEach((e) => {
    if (skip && skip.indexOf(e.name) >= 0) return;
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    if (e.isDirectory()) copy(s, d, skip); else fs.copyFileSync(s, d);
  });
}
copy(EDITOR_DIR, path.join(ROOT, "conference-editor"), ["test", "supabase", "README.md", "package.json", "node_modules"]);
if (HAS_DEMO) copy(DEMO_DIR, path.join(ROOT, "conference-demo"));

const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8" };
function serve() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      let u = decodeURIComponent(req.url.split("?")[0]);
      if (u.endsWith("/")) u += "index.html";
      const p = path.join(ROOT, u);
      if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end("nf"); }
      res.writeHead(200, { "content-type": MIME[path.extname(p)] || "application/octet-stream" });
      res.end(fs.readFileSync(p));
    }).listen(0, "127.0.0.1", () => resolve({ srv, base: "http://127.0.0.1:" + srv.address().port }));
  });
}

const FAKE_SB = 'window.CONF_EDITOR_CONFIG={BACKEND:"supabase",SUPABASE_URL:"https://fake.supabase.test",SUPABASE_ANON_KEY:"sb_publishable_fake"};';

(async () => {
  const { srv, base } = await serve();
  const shots = process.argv[2] ? path.resolve(process.argv[2]) : null;
  if (shots) fs.mkdirSync(shots, { recursive: true });
  const browser = await chromium.launch();
  const errs = [];
  const track = (page, label) => {
    page.on("pageerror", (e) => errs.push(label + " pageerror: " + e.message));
    page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errs.push(label + " console: " + m.text()); });
  };
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    // サンプルサイトの通常表示は本物の設定（Supabase）を読む。検査では偽の接続先にして、通信は必ず失敗させる
    await ctx.route("**/conference-editor/config.js", (r) => r.fulfill({ contentType: "text/javascript", body: FAKE_SB }));
    await ctx.route("https://fake.supabase.test/**", (r) => r.abort());
    await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());

    const page = await ctx.newPage();
    track(page, "sample");
    const dialogs = [];
    page.on("dialog", (d) => { dialogs.push({ type: d.type(), message: d.message() }); d.accept(); });
    const EDITOR_URL = base + "/conference-editor/sample/";
    const open = async () => { await page.goto(EDITOR_URL); await page.waitForSelector("#ce-app:not([hidden])"); };
    const first = () => page.locator(".ce-item").nth(0).locator('[data-f="text"]');
    const tab = (label) => page.locator(".ce-tab", { hasText: label }).click();

    // ================= 最初に開く =================
    await open();
    ok(/これは練習用のサンプルです。実際の研究大会とは関係ありません。/.test(await page.locator(".sm-banner").textContent()), "「サンプル」の帯が出る");
    ok(await page.locator(".sm-banner").evaluate((e) => e.getBoundingClientRect().top) === 0, "帯がいちばん上にある");
    ok(/【サンプル】/.test(await page.title()), "ページのタイトルに【サンプル】");
    ok(/ためしてみてください/.test(await page.locator(".sm-guide").textContent()), "使い方の案内が出る");
    ok(/ローカルモード/.test(await page.locator("#ce-mode").textContent()), "ローカルモード（このブラウザだけに保存）の表示");
    ok(await page.locator("#ce-login").isHidden(), "ログイン欄は出ない");
    eq(await page.evaluate(() => [typeof window.ConfStoreSupabase, window.CONF_EDITOR_CONFIG.BACKEND]), ["undefined", "local"], "Supabase に接続する部品がなく、保存先は local");
    eq(await page.locator("meta[name=robots]").getAttribute("content"), "noindex,nofollow", "検索に出さない（noindex）");

    eq(await page.locator(".ce-item").count(), 3, "お知らせ：サンプルの3件が入っている");
    ok(/このサイトは、研究大会の案内サイトの作り方を見せるためのサンプルです/.test(await first().inputValue()), "お知らせ：1件目の本文");
    ok(/このサイトは、研究大会の案内サイトの作り方を見せるためのサンプルです/.test(await page.locator("#ce-preview").textContent()), "プレビューにも出ている");
    ok(/まだ公開していません/.test(await page.locator("#ce-status").textContent()), "最初は未公開");
    await tab("大会概要");
    eq(await page.locator(".ce-item").count(), 9, "大会概要：サンプルの9行が入っている");
    ok((await page.locator("#ce-preview .tbd").count()) === 2, "大会概要：【調整中】が札になる（2つ）");
    await tab("日程と流れ");
    eq(await page.locator(".ce-item").count(), 3, "日程と流れ：サンプルの3日間が入っている");
    await tab("お知らせ");
    eq(await page.locator("#ce-where-link").evaluate((a) => a.href), base + "/conference-demo/?local#news", "「サイトのこの部分を開く」は、?local つきのサンプルサイトを指す");
    eq(await page.locator(".sm-primary").evaluate((a) => a.href), base + "/conference-demo/?local", "「サンプルサイトを開く」は、?local つき");
    const raw0 = await page.evaluate(() => JSON.parse(localStorage.getItem("conferenceEditor.v1")));
    eq(["news", "overview", "program"].map((k) => [raw0[k].draft.length, raw0[k].published_at]), [[3, null], [9, null], [3, null]], "保存先：下書きだけが入っていて、公開済みは無い");
    if (shots) await page.screenshot({ path: path.join(shots, "sample-editor.png"), fullPage: true });

    // ================= 書き換えて、保存して、公開する =================
    await first().fill("練習で書き換えたお知らせ");
    await page.locator("#ce-save").click();
    await page.waitForFunction(() => /保存しました/.test(document.getElementById("ce-banner").textContent));
    await page.locator("#ce-publish").click();
    await page.waitForFunction(() => /公開しました/.test(document.getElementById("ce-banner").textContent));
    ok(dialogs.some((d) => d.type === "confirm" && /お知らせ/.test(d.message)), "公開：確認ダイアログが出る");

    // 再読み込みしても、書き換えた内容が残る（最初の内容で上書きされない）
    await open();
    eq(await first().inputValue(), "練習で書き換えたお知らせ", "再読み込み：書き換えた内容が残る");
    ok(/公開中/.test(await page.locator("#ce-status").textContent()), "再読み込み：公開中の状態が残る");

    // ================= サンプルサイトへの反映 =================
    if (HAS_DEMO) {
      const site = await ctx.newPage();
      track(site, "site-local");
      await site.goto(base + "/conference-demo/?local");
      await site.waitForFunction(() => /練習で書き換えたお知らせ/.test(document.querySelector('[data-content="news"]').textContent), null, { timeout: 4000 });
      eq(await site.locator('[data-content="news"] li').count(), 3, "サンプルサイト(?local)：お知らせは3件のまま");
      eq((await site.locator('[data-content="news"] li p').first().textContent()).trim(), "練習で書き換えたお知らせ", "サンプルサイト(?local)：書き換えた内容が出る");
      ok(/2099年3月6日/.test(await site.locator('[data-content="news"] li time').first().textContent()), "サンプルサイト(?local)：日付も出る");
      ok(/サンプル大学/.test(await site.locator('[data-content="overview"]').textContent()), "サンプルサイト(?local)：公開していない大会概要は元の内容のまま");
      eq(await site.locator(".local-chip").count(), 1, "サンプルサイト(?local)：「練習用の内容を表示中」の目印が出る");
      eq(await site.locator(".local-chip a").getAttribute("href"), "./", "目印に「ふつうの表示にする」リンクがある");
      ok(/(?:^|\s)sample(?:\s|$)/.test(await site.locator(".sample").getAttribute("class")) && /これはサンプルです/.test(await site.locator(".sample").textContent()), "サンプルサイト(?local)：「サンプルです」の帯はそのまま");
      await site.close();

      const normal = await ctx.newPage();
      track(normal, "site-normal");
      await normal.goto(base + "/conference-demo/");
      await normal.waitForTimeout(500);
      ok(!/練習で書き換えたお知らせ/.test(await normal.locator('[data-content="news"]').textContent()), "サンプルサイト（通常）：練習の内容は出ない");
      eq(await normal.locator(".local-chip").count(), 0, "サンプルサイト（通常）：目印は出ない");
      await normal.close();
    } else {
      console.log("sample: サンプルサイトのフォルダが見つからないので、反映の検査は飛ばします（" + DEMO_DIR + "）");
    }

    // ================= 最初の状態に戻す（未保存の変更があっても、離れる確認は出ない）=================
    await first().fill("未保存の書きかけ");
    dialogs.length = 0;
    await page.locator("#sm-reset").click();
    await page.waitForSelector("#ce-app:not([hidden])");
    await page.waitForFunction(() => /このサイトは、研究大会の案内サイトの作り方/.test(document.querySelector('.ce-item [data-f="text"]').value));
    eq(dialogs.map((d) => d.type), ["confirm"], "戻す：確認は1回だけ（「変更が保存されていません」は出ない）");
    ok(/最初の状態に戻します/.test((dialogs[0] || {}).message || ""), "戻す：確認の文言");
    ok(/このサイトは、研究大会の案内サイトの作り方を見せるためのサンプルです/.test(await first().inputValue()), "戻す：最初の内容に戻る");
    ok(/まだ公開していません/.test(await page.locator("#ce-status").textContent()), "戻す：公開も消えて未公開に戻る");
    const raw1 = await page.evaluate(() => JSON.parse(localStorage.getItem("conferenceEditor.v1")));
    eq(["news", "overview", "program"].map((k) => [raw1[k].draft.length, raw1[k].published_at]), [[3, null], [9, null], [3, null]], "戻す：保存先も最初の状態");
    if (HAS_DEMO) {
      const site = await ctx.newPage();
      track(site, "site-local2");
      await site.goto(base + "/conference-demo/?local");
      await site.waitForTimeout(500);
      ok(!/練習で書き換えたお知らせ/.test(await site.locator('[data-content="news"]').textContent()), "戻す：サンプルサイトからも練習の内容が消える");
      await site.close();
    }

    // 確認でキャンセルしたら、何も消えない
    await first().fill("消さないで");
    await page.locator("#ce-save").click();
    await page.waitForFunction(() => /保存しました/.test(document.getElementById("ce-banner").textContent));
    page.removeAllListeners("dialog");
    page.on("dialog", (d) => d.dismiss());
    await page.locator("#sm-reset").click();
    await page.waitForTimeout(300);
    eq(await first().inputValue(), "消さないで", "戻す：キャンセルしたら、そのまま");
    page.removeAllListeners("dialog");
    page.on("dialog", (d) => d.accept());

    // ================= 通信先・エラー（サンプルサイトは外部フォントを読むので、見るのは編集画面だけ）=================
    // サンプルの編集画面そのものは、偽の接続先（本物の Supabase の代わり）にも通信しない
    const samplePage = await ctx.newPage();
    const sampleHosts = new Set();
    samplePage.on("request", (r) => { try { sampleHosts.add(new URL(r.url()).host); } catch (e) { /* 無視 */ } });
    await samplePage.goto(EDITOR_URL);
    await samplePage.waitForSelector("#ce-app:not([hidden])");
    await samplePage.locator(".ce-tab", { hasText: "日程と流れ" }).click();
    await samplePage.waitForTimeout(300);
    eq(Array.from(sampleHosts).filter((h) => !/^127\.0\.0\.1:/.test(h)), [], "サンプルの編集画面は、このサーバー以外には何も通信しない");
    await samplePage.close();

    // ================= スマホ幅 =================
    for (const w of [360, 390, 768]) {
      const c2 = await browser.newContext({ viewport: { width: w, height: 800 } });
      const p2 = await c2.newPage();
      await p2.goto(EDITOR_URL);
      await p2.waitForSelector("#ce-app:not([hidden])");
      const over = await p2.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      ok(over <= 0, "幅 " + w + " で横にはみ出さない（" + over + "px）");
      if (w === 390 && shots) await p2.screenshot({ path: path.join(shots, "sample-editor-mobile.png"), fullPage: true });
      await c2.close();
    }

    eq(errs, [], "ページにエラーが出ていない");
  } finally {
    await browser.close();
    srv.close();
    fs.rmSync(ROOT, { recursive: true, force: true });
  }
  console.log(bad ? "\n" + bad + " 件失敗" : "sample: すべて通過");
  process.exit(bad ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
