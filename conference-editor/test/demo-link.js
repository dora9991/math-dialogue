/* デモサイト（public/conference-demo/）が、編集ツールで公開した内容を表示するかの検査。
   「デモ」と「編集ツール」の両方が要るので、2つを並べた一時フォルダ（../conference-demo と ../conference-editor）を作って配信する。
   使い方：NODE_PATH=$(npm root -g) node conference-editor/test/demo-link.js [スクリーンショットの保存先]
   環境変数：DEMO_DIR（デモのフォルダ。既定は ../../public/conference-demo）／EDITOR_DIR（編集ツールのフォルダ。既定はこのファイルの親）
   デモのフォルダが無ければ、検査を飛ばす（デモがまだこのブランチに無いとき）。
   確かめること：元の内容が残る／ローカルで公開した内容が出る／Supabase の公開済みを anon キーだけで読んで出る／
                 一部だけ公開したら残りは元のまま／読み込みに失敗しても元のまま／危険な文字が実行されない／「サンプル」の帯が変わらない */
const fs = require("fs"), path = require("path"), http = require("http"), os = require("os");
const { chromium } = require("playwright");
const { createFake, ANON } = require("./fake-supabase.js");

const EDITOR_DIR = path.resolve(process.env.EDITOR_DIR || path.join(__dirname, ".."));
const DEMO_DIR = path.resolve(process.env.DEMO_DIR || path.join(__dirname, "..", "..", "public", "conference-demo"));
if (!fs.existsSync(path.join(DEMO_DIR, "index.html"))) { console.log("demo-link: デモのフォルダが見つからないので飛ばします（" + DEMO_DIR + "）"); process.exit(0); }

let bad = 0;
const ok = (c, m) => { if (!c) { bad++; console.log("✗", m); } else if (process.env.VERBOSE) console.log("✓", m); };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), m + "  期待 " + JSON.stringify(b) + " 実際 " + JSON.stringify(a));

// 2つを並べた一時フォルダ（公開先と同じ並び）
const ROOT = fs.mkdtempSync(path.join(os.tmpdir(), "demo-link-"));
function copy(src, dst, skip) {
  fs.mkdirSync(dst, { recursive: true });
  fs.readdirSync(src, { withFileTypes: true }).forEach((e) => {
    if (skip && skip.indexOf(e.name) >= 0) return;
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    if (e.isDirectory()) copy(s, d, skip); else fs.copyFileSync(s, d);
  });
}
copy(DEMO_DIR, path.join(ROOT, "conference-demo"));
copy(EDITOR_DIR, path.join(ROOT, "conference-editor"), ["test", "supabase", "README.md", "package.json", "node_modules"]);

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

const SB_CONFIG = 'window.CONF_EDITOR_CONFIG={BACKEND:"supabase",SUPABASE_URL:"https://fake.supabase.test",SUPABASE_ANON_KEY:"' + ANON + '"};';
async function routeSupabase(ctx, fake, seen) {
  await ctx.route("**/conference-editor/config.js", (r) => r.fulfill({ contentType: "text/javascript", body: SB_CONFIG }));
  await ctx.route("https://fake.supabase.test/**", async (route) => {
    const req = route.request();
    const cors = { "access-control-allow-origin": "*", "access-control-allow-headers": "authorization, apikey, content-type, prefer", "access-control-allow-methods": "GET,POST,PATCH,OPTIONS" };
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: cors });
    if (seen) seen.push({ method: req.method(), url: req.url(), auth: req.headers()["authorization"] });
    const res = fake.handle({ method: req.method(), url: req.url(), headers: req.headers(), body: req.postData() || undefined });
    return route.fulfill({ status: res.status, headers: Object.assign({ "content-type": "application/json" }, cors), body: res.json === null ? "" : JSON.stringify(res.json) });
  });
}
const PUBLISHED = {
  news: [{ date: "2099-05-01", text: "編集ツールで公開したお知らせ", url: "" }, { date: "2099-04-01", text: "リンクつき", url: "https://example.com/n" }],
  overview: [{ k: "会場", v: "【調整中】" }, { k: "主催", v: "編集ツールで書いた主催" }],
  program: [{ label: "1日目", sub: "ひとこと", items: [{ time: "9:30", text: "受付" }, { time: "", text: "開会" }] }]
};

(async () => {
  const shots = process.argv[2] ? path.resolve(process.argv[2]) : null;
  if (shots) fs.mkdirSync(shots, { recursive: true });
  const { srv, base } = await serve();
  const browser = await chromium.launch();
  const errors = [];
  const track = (page, label) => {
    page.on("pageerror", (e) => errors.push(label + " pageerror: " + e.message));
    page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource|ERR_|CORS|net::/.test(m.text())) errors.push(label + " console: " + m.text()); });
  };
  const url = base + "/conference-demo/";
  const staticCounts = { news: 3, overview: 9, program: 3 };
  const counts = async (page) => ({
    news: await page.locator('[data-content="news"] > li').count(),
    overview: await page.locator('[data-content="overview"] > div').count(),
    program: await page.locator('[data-content="program"] > li').count()
  });
  const bannerOk = async (page, label) => ok((await page.locator(".sample").innerText()).includes("これはサンプルです。実際の研究大会とは関係ありません。"), label + "：「サンプル」の帯が変わらない");

  // ---- A. 何も公開していない（ローカル・空）：元の内容のまま ----
  {
    const ctx = await browser.newContext({ viewport: { width: 1000, height: 900 } });
    const page = await ctx.newPage(); track(page, "A");
    await page.goto(url); await page.waitForTimeout(250);
    eq(await page.locator("[data-content]").count(), 3, "A：流し込む場所（data-content）が3つある");
    eq(await counts(page), staticCounts, "A：何も公開していなければ、元の内容のまま");
    await bannerOk(page, "A");
    await ctx.close();
  }

  // ---- B. ローカルで公開した内容が出る／一部だけ公開したら残りは元のまま ----
  {
    const ctx = await browser.newContext({ viewport: { width: 1000, height: 900 } });
    const page = await ctx.newPage(); track(page, "B");
    await page.goto(url);
    await page.evaluate((pub) => {
      const mk = (key, val, published) => ({ draft: val, published: published ? val : [], published_at: published ? new Date().toISOString() : null, version: 2, updated_at: new Date().toISOString(), updated_by: "t" });
      localStorage.setItem("conferenceEditor.v1", JSON.stringify({ news: mk("news", pub.news, true), overview: mk("overview", pub.overview, false), program: mk("program", pub.program, false) }));
    }, PUBLISHED);
    await page.reload(); await page.waitForTimeout(250);
    eq(await counts(page), { news: 2, overview: staticCounts.overview, program: staticCounts.program }, "B：お知らせだけ公開 → お知らせは2件に、概要と日程は元のまま");
    eq(await page.locator('[data-content="news"] li').first().locator("p").textContent(), "編集ツールで公開したお知らせ", "B：公開した本文が出る");
    eq(await page.locator('[data-content="news"] li').first().locator("time").textContent(), "2099年5月1日", "B：日付が日本語で出る");
    eq(await page.locator('[data-content="news"] a').getAttribute("href"), "https://example.com/n", "B：リンクが付く");
    // 全部公開
    await page.evaluate((pub) => {
      const all = JSON.parse(localStorage.getItem("conferenceEditor.v1"));
      ["overview", "program"].forEach((k) => { all[k].published = pub[k]; all[k].published_at = new Date().toISOString(); });
      localStorage.setItem("conferenceEditor.v1", JSON.stringify(all));
    }, PUBLISHED);
    await page.reload(); await page.waitForTimeout(250);
    eq(await counts(page), { news: 2, overview: 2, program: 1 }, "B：3つとも公開 → 3つとも編集ツールの内容");
    eq(await page.locator('[data-content="overview"] .tbd').count(), 1, "B：【調整中】が札になる");
    eq(await page.locator('[data-content="program"] .day li').count(), 2, "B：日程の項目が出る");
    eq(await page.locator('[data-content="program"] .day li span').allTextContents(), ["9:30"], "B：時刻がある項目だけ時刻が出る");
    await bannerOk(page, "B");
    if (shots) await page.screenshot({ path: path.join(shots, "demo-linked-local.png"), fullPage: true });
    await ctx.close();
  }

  // ---- C. Supabase：公開済みを anon キーだけで読んで出す ----
  {
    const fake = createFake();
    ["news", "overview", "program"].forEach((k) => { fake.state.rows[k].draft = PUBLISHED[k]; fake.state.rows[k].published = PUBLISHED[k]; fake.state.rows[k].published_at = new Date().toISOString(); });
    fake.state.rows.news.draft = [{ date: "", text: "まだ公開していない下書き", url: "" }]; // 下書きは出てはいけない
    const seen = [];
    const ctx = await browser.newContext({ viewport: { width: 1000, height: 900 } });
    await routeSupabase(ctx, fake, seen);
    const page = await ctx.newPage(); track(page, "C");
    await page.goto(url);
    await page.waitForFunction(() => document.querySelectorAll('[data-content="news"] > li').length === 2);
    eq(await counts(page), { news: 2, overview: 2, program: 1 }, "C：Supabase の公開済みの内容が出る");
    ok(!/まだ公開していない下書き/.test(await page.locator("body").innerText()), "C：下書きは出ない");
    const reads = seen.filter((r) => r.method === "GET" && /\/rest\/v1\/conf_content/.test(r.url));
    ok(reads.length >= 1, "C：公開済みを読みに行った");
    ok(reads.every((r) => r.auth === "Bearer " + ANON), "C：読むときは anon キーだけ（ログインのトークンは使わない）");
    ok(reads.every((r) => /select=key,published,published_at/.test(decodeURIComponent(r.url))), "C：読む列は key / published / published_at だけ");
    ok(seen.every((r) => r.method === "GET"), "C：公開側は読むだけ（書き込みをしない）");
    await bannerOk(page, "C");
    await ctx.close();
  }

  // ---- D. Supabase が壊れている／届かない：元の内容のまま、エラーも出ない ----
  for (const [label, handler] of [
    ["500 エラー", (r) => r.fulfill({ status: 500, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: '{"message":"boom"}' })],
    ["404（表がまだ無い）", (r) => r.fulfill({ status: 404, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: '{"code":"42P01"}' })],
    ["通信できない", (r) => r.abort()]
  ]) {
    const ctx = await browser.newContext({ viewport: { width: 1000, height: 900 } });
    await ctx.route("**/conference-editor/config.js", (r) => r.fulfill({ contentType: "text/javascript", body: SB_CONFIG }));
    await ctx.route("https://fake.supabase.test/**", (r) => (r.request().method() === "OPTIONS" ? r.fulfill({ status: 204, headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "authorization, apikey, content-type" } }) : handler(r)));
    const page = await ctx.newPage(); track(page, "D:" + label);
    await page.goto(url); await page.waitForTimeout(400);
    eq(await counts(page), staticCounts, "D：Supabase が " + label + " でも、元の内容のまま");
    await bannerOk(page, "D:" + label);
    await ctx.close();
  }

  // ---- E. 編集ツールの設定ファイルが読めない：元の内容のまま、エラーも出ない ----
  {
    const ctx = await browser.newContext({ viewport: { width: 1000, height: 900 } });
    await ctx.route("**/conference-editor/**", (r) => r.fulfill({ status: 404, body: "nf" }));
    const page = await ctx.newPage(); track(page, "E");
    await page.goto(url); await page.waitForTimeout(250);
    eq(await counts(page), staticCounts, "E：編集ツールのファイルが無くても、元の内容のまま");
    await bannerOk(page, "E");
    await ctx.close();
  }

  // ---- F. 危険な文字は実行されない（公開側） ----
  {
    const fake = createFake();
    const evil = '<img src=x onerror="window.__xss=1"><script>window.__xss=2</script>';
    fake.state.rows.news.published = [{ date: "2099-01-01", text: evil, url: "javascript:window.__xss=3" }];
    fake.state.rows.news.published_at = new Date().toISOString();
    const ctx = await browser.newContext({ viewport: { width: 1000, height: 900 } });
    await routeSupabase(ctx, fake);
    const page = await ctx.newPage(); track(page, "F");
    await page.goto(url);
    await page.waitForFunction(() => document.querySelectorAll('[data-content="news"] > li').length === 1);
    eq(await page.locator('[data-content="news"] img, [data-content="news"] script, [data-content="news"] a').count(), 0, "F：img・script・リンクが作られない（javascript: のリンクは無効）");
    eq(await page.evaluate(() => window.__xss), undefined, "F：スクリプトが実行されない");
    ok(/<img src=x/.test(await page.locator('[data-content="news"]').textContent()), "F：文字としてそのまま表示される");
    await ctx.close();
  }

  // ---- G. 編集画面（ローカル）で公開 → デモに出る（同じブラウザ） ----
  {
    const ctx = await browser.newContext({ viewport: { width: 1000, height: 900 } });
    const ed = await ctx.newPage(); track(ed, "G:editor");
    ed.on("dialog", (d) => d.accept());
    await ed.goto(base + "/conference-editor/index.html");
    await ed.waitForSelector("#ce-app:not([hidden])");
    await ed.getByRole("button", { name: "お知らせを追加" }).click();
    await ed.locator(".ce-item").nth(0).locator('[data-f="date"]').fill("2099-06-01");
    await ed.locator(".ce-item").nth(0).locator('[data-f="text"]').fill("編集画面から公開したお知らせ");
    await ed.click("#ce-publish");
    await ed.waitForFunction(() => /公開しました/.test(document.getElementById("ce-banner").textContent));
    const demo = await ctx.newPage(); track(demo, "G:demo");
    await demo.goto(url);
    await demo.waitForFunction(() => document.querySelectorAll('[data-content="news"] > li').length === 1);
    eq(await demo.locator('[data-content="news"] li p').textContent(), "編集画面から公開したお知らせ", "G：編集画面で「公開する」→ デモのお知らせに出る");
    eq(await counts(demo), { news: 1, overview: staticCounts.overview, program: staticCounts.program }, "G：公開していない項目は元のまま");
    await ctx.close();
  }

  await browser.close(); srv.close();
  fs.rmSync(ROOT, { recursive: true, force: true });
  errors.forEach((e) => { bad++; console.log("✗", e); });
  console.log(bad ? "\n失敗 " + bad + " 件" : "demo-link: すべて通過");
  process.exit(bad ? 1 : 0);
})().catch((e) => { console.error("検査が異常終了:", e); try { fs.rmSync(ROOT, { recursive: true, force: true }); } catch (x) {} process.exit(2); });
