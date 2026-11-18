/* デモサイト（public/conference-demo/）の「黄色い見た目と動き」の検査。
   使い方：NODE_PATH=$(npm root -g) node conference-editor/test/demo-look.js [スクリーンショットの保存先]
   環境変数：DEMO_DIR（デモのフォルダ。既定は ../../public/conference-demo）／EDITOR_DIR（編集ツールのフォルダ。既定はこのファイルの親）
   デモのフォルダが無ければ、検査を飛ばす（デモがまだこのブランチに無いとき）。
   確かめること：開いたときの動きが付いている／スクロールで現れる（JS が動くときだけ隠れ、動かないときは最初から全部見える）／
                 動きを減らす設定では動きなしで全部見える／IntersectionObserver が無くても全部見える／
                 「サンプル」の帯は動かず最初から見える／文字が消えていない／横にはみ出さない */
const fs = require("fs"), path = require("path"), http = require("http"), os = require("os");
const { chromium } = require("playwright");

const EDITOR_DIR = path.resolve(process.env.EDITOR_DIR || path.join(__dirname, ".."));
const DEMO_DIR = path.resolve(process.env.DEMO_DIR || path.join(__dirname, "..", "..", "public", "conference-demo"));
if (!fs.existsSync(path.join(DEMO_DIR, "index.html"))) { console.log("demo-look: デモのフォルダが見つからないので飛ばします（" + DEMO_DIR + "）"); process.exit(0); }

let bad = 0;
const ok = (c, m) => { if (!c) { bad++; console.log("✗", m); } else if (process.env.VERBOSE) console.log("✓", m); };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), m + "  期待 " + JSON.stringify(b) + " 実際 " + JSON.stringify(a));

const ROOT = fs.mkdtempSync(path.join(os.tmpdir(), "demo-look-"));
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

const LOCAL_CONFIG = 'window.CONF_EDITOR_CONFIG={BACKEND:"local",SUPABASE_URL:"",SUPABASE_ANON_KEY:""};';
async function newCtx(browser, opts) {
  const ctx = await browser.newContext(opts);
  // 保存先には繋がず、index.html に書いてある元の内容を表示する。外部フォントも読まない
  await ctx.route("**/conference-editor/config.js", (r) => r.fulfill({ contentType: "text/javascript", body: LOCAL_CONFIG }));
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  return ctx;
}
const SECTIONS = ["news", "overview", "schedule", "sessions", "entry", "archive", "area", "past", "about", "contact"];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 見えている度合い：自分と、ページの上までの親の opacity をかけ合わせる
const VISIBLE = `(sel) => {
  const el = document.querySelector(sel); let o = 1;
  for (let n = el; n && n.nodeType === 1; n = n.parentElement) o *= parseFloat(getComputedStyle(n).opacity);
  return o;
}`;

(async () => {
  const { srv, base } = await serve();
  const URL = base + "/conference-demo/";
  const shots = process.argv[2];
  const browser = await chromium.launch();
  try {
    // ---- 1. 通常（JS あり）：開いたときの動きと、スクロールで現れる動き
    {
      const ctx = await newCtx(browser, { viewport: { width: 1280, height: 800 } });
      const p = await ctx.newPage();
      const errs = []; p.on("pageerror", (e) => errs.push(e.message));
      await p.goto(URL, { waitUntil: "domcontentloaded" });
      // 開いた直後（最初の描画のころ）に、サンプルの帯が、動きなしで、見えている
      const banner = await p.evaluate(`(() => {
        const el = document.querySelector(".sample"); const r = el.getBoundingClientRect();
        let o = 1; for (let n = el; n && n.nodeType === 1; n = n.parentElement) o *= parseFloat(getComputedStyle(n).opacity);
        return { top: Math.round(r.top), h: r.height, text: el.textContent, anims: el.getAnimations({ subtree: true }).length, opacity: o, role: el.getAttribute("role") };
      })()`);
      eq(banner.top, 0, "「サンプル」の帯が、いちばん上にある");
      ok(banner.h > 0, "「サンプル」の帯に高さがある");
      eq(banner.anims, 0, "「サンプル」の帯は、動かさない");
      eq(banner.opacity, 1, "「サンプル」の帯は、最初から完全に見えている");
      ok(banner.text.indexOf("これはサンプルです。実際の研究大会とは関係ありません。") >= 0, "「サンプル」の帯の文言が変わっていない");
      eq(banner.role, "note", "「サンプル」の帯に role=note");

      const js = await p.evaluate(() => document.documentElement.classList.contains("js"));
      ok(js, "JS が動いているときは <html class=js> になる");

      // 開いたときの動き（名前が付いている）
      const names = await p.evaluate(`(() => {
        const n = (sel, pseudo) => getComputedStyle(document.querySelector(sel), pseudo || null).animationName;
        return { lead: n(".hero .lead"), btns: n(".hero .btns"), vtmain: n(".hero .vt-main"), vtsub: n(".hero .vt-sub"),
                 fact: n(".hero .facts div"), sun: n(".hero", "::after"), waves: n(".hero", "::before"), bar: n(".bar"),
                 sample: n(".sample") };
      })()`);
      ok(/rise/.test(names.lead), "リード文に入場の動き  実際 " + names.lead);
      ok(/rise/.test(names.btns), "ボタンに入場の動き  実際 " + names.btns);
      ok(/vtIn/.test(names.vtmain), "縦書きタイトルに入場の動き  実際 " + names.vtmain);
      ok(/subIn/.test(names.vtsub), "縦書きの小さいタイトルに入場の動き  実際 " + names.vtsub);
      ok(/rise/.test(names.fact), "開催情報に入場の動き  実際 " + names.fact);
      ok(/sun/.test(names.sun), "背後の光に動き  実際 " + names.sun);
      ok(/waves/.test(names.waves), "背景の波模様に動き  実際 " + names.waves);
      ok(/drop/.test(names.bar), "ヘッダーに入場の動き  実際 " + names.bar);
      eq(names.sample, "none", "「サンプル」の帯に animation が付いていない");

      // 黄色であること：ヒーローの背景が黄色系（R が大きく、B が小さい）で、文字は紺色
      const colors = await p.evaluate(`(() => {
        const bg = getComputedStyle(document.querySelector(".hero")).backgroundImage;
        const lead = getComputedStyle(document.querySelector(".hero .lead")).color;
        const body = getComputedStyle(document.body).backgroundColor;
        return { bg, lead, body };
      })()`);
      ok(/gradient/.test(colors.bg) && /255, 224, 102|246, 201, 69|240, 180, 0/.test(colors.bg), "ヒーローが山吹色のグラデーション  実際 " + colors.bg);
      eq(colors.lead, "rgb(20, 42, 82)", "ヒーローの文字は紺色");
      eq(colors.body, "rgb(255, 250, 232)", "ページの地はうすいクリーム");

      // スクロールで現れる：10 のセクションが reveal で、フッターは reveal でない
      const rv = await p.evaluate(`(() => ({
        n: document.querySelectorAll(".reveal").length,
        ids: Array.from(document.querySelectorAll(".reveal")).map((e) => (e.closest("section") || { id: "?" }).id),
        footer: document.querySelectorAll("footer .reveal").length,
        sampleReveal: document.querySelectorAll(".sample .reveal, .bar .reveal, .hero .reveal").length
      }))()`);
      eq(rv.n, SECTIONS.length, "reveal は " + SECTIONS.length + " か所");
      eq(rv.ids, SECTIONS, "reveal はセクションの本文だけ");
      eq(rv.footer, 0, "フッターは reveal でない");
      eq(rv.sampleReveal, 0, "帯・ヘッダー・hero は reveal でない");

      // 画面の外の、いちばん下のセクションは、まだ隠れている
      await sleep(1900); // 開いたときの動きが終わるのを待つ
      const before = await p.evaluate(`(${VISIBLE})("#contact .wrap")`);
      const inBefore = await p.evaluate(() => document.querySelector("#contact .wrap").classList.contains("in"));
      ok(before < 0.05 && !inBefore, "画面の外のセクションは、まだ隠れている  opacity " + before);
      // 画面に入る位置まで動かすと、現れる
      await p.evaluate(() => document.querySelector("#contact").scrollIntoView({ behavior: "instant", block: "center" }));
      await p.waitForFunction(() => document.querySelector("#contact .wrap").classList.contains("in"), null, { timeout: 3000 });
      await sleep(1100);
      const after = await p.evaluate(`(${VISIBLE})("#contact .wrap")`);
      ok(after > 0.99, "画面に入ったセクションは、現れて完全に見える  opacity " + after);
      // 現れたあとの見出しの線
      const bar = await p.evaluate(() => parseFloat(getComputedStyle(document.querySelector("#contact h2"), "::after").width));
      ok(bar > 40, "現れた見出しの下に、山吹色の線が出ている  幅 " + bar);

      // 日程カードが、順にずれて出る（遅延が段階的）
      const delays = await p.evaluate(() => {
        const wrap = document.querySelector("#schedule .wrap");
        wrap.classList.add("in");
        return Array.from(document.querySelectorAll("#schedule .day")).map((d) => getComputedStyle(d).transitionDelay.split(",")[0].trim());
      });
      eq(delays, ["0s", "0.12s", "0.24s"], "日程カードの現れる順に、時間差がある");

      eq(errs, [], "ページにエラーが出ていない");
      if (shots) {
        for (const id of SECTIONS) await p.evaluate((i) => document.querySelector("#" + i + " .wrap").classList.add("in"), id);
        await sleep(1200);
        await p.screenshot({ path: path.join(shots, "look-desktop.png"), fullPage: true });
      }
      await ctx.close();
    }

    // ---- 2. JS が動かないとき：最初から全部見える
    {
      const ctx = await newCtx(browser, { viewport: { width: 1280, height: 800 }, javaScriptEnabled: false });
      const p = await ctx.newPage();
      await p.goto(URL, { waitUntil: "load" });
      // JS が動かない設定でも、Playwright からの evaluate は動く（ページの script だけが止まっている）
      const st = await p.evaluate(`(() => ({
        js: document.documentElement.classList.contains("js"),
        ops: Array.from(document.querySelectorAll(".reveal")).map((e) => parseFloat(getComputedStyle(e).opacity)),
        tr: Array.from(document.querySelectorAll(".reveal")).map((e) => getComputedStyle(e).translate),
        days: Array.from(document.querySelectorAll(".day")).map((e) => parseFloat(getComputedStyle(e).opacity)),
        bar: parseFloat(getComputedStyle(document.querySelector("#contact h2"), "::after").width)
      }))()`);
      ok(!st.js, "JS なしでは html に js が付かない");
      ok(st.ops.length === SECTIONS.length && st.ops.every((o) => o === 1), "JS なしで、全セクションが最初から見える  " + st.ops.join(","));
      ok(st.tr.every((t) => t === "none"), "JS なしで、セクションがずれていない  " + st.tr.join("|"));
      ok(st.days.length >= 3 && st.days.every((o) => o === 1), "JS なしで、日程カードが見える  " + st.days.join(","));
      ok(st.bar > 40, "JS なしで、見出しの線が出ている  幅 " + st.bar);
      await ctx.close();
    }

    // ---- 3. 動きを減らす設定：動きなしで全部すぐ見える
    {
      const ctx = await newCtx(browser, { viewport: { width: 1280, height: 800 }, reducedMotion: "reduce" });
      const p = await ctx.newPage();
      await p.goto(URL, { waitUntil: "domcontentloaded" });
      const st = await p.evaluate(`(() => {
        const sel = ".hero .lead, .hero .btns, .hero .vt-main, .hero .facts div, .bar";
        const anims = document.getAnimations().filter((a) => a.playState === "running" || a.playState === "pending").length;
        return {
          anims,
          names: Array.from(document.querySelectorAll(sel)).map((e) => getComputedStyle(e).animationName),
          pseudos: [getComputedStyle(document.querySelector(".hero"), "::after").animationName, getComputedStyle(document.querySelector(".hero"), "::before").animationName],
          ops: Array.from(document.querySelectorAll(".reveal")).map((e) => parseFloat(getComputedStyle(e).opacity)),
          days: Array.from(document.querySelectorAll(".day")).map((e) => parseFloat(getComputedStyle(e).opacity)),
          tr: Array.from(document.querySelectorAll(".reveal")).map((e) => getComputedStyle(e).translate),
          bar: parseFloat(getComputedStyle(document.querySelector("#contact h2"), "::after").width)
        };
      })()`);
      eq(st.anims, 0, "動きを減らす設定では、動いているアニメーションが 0");
      ok(st.names.every((n) => n === "none"), "動きを減らす設定では、入場の動きが無い  " + st.names.join("|"));
      ok(st.pseudos.every((n) => n === "none"), "動きを減らす設定では、光と波が止まっている  " + st.pseudos.join("|"));
      ok(st.ops.length === SECTIONS.length && st.ops.every((o) => o === 1), "動きを減らす設定では、全セクションが最初から見える  " + st.ops.join(","));
      ok(st.tr.every((t) => t === "none"), "動きを減らす設定では、セクションがずれていない  " + st.tr.join("|"));
      ok(st.days.length >= 3 && st.days.every((o) => o === 1), "動きを減らす設定では、日程カードが最初から見える");
      ok(st.bar > 40, "動きを減らす設定では、見出しの線が最初から出ている  幅 " + st.bar);
      await ctx.close();
    }

    // ---- 4. IntersectionObserver が無い環境：全部見える
    {
      const ctx = await newCtx(browser, { viewport: { width: 1280, height: 800 } });
      await ctx.addInitScript(() => { delete window.IntersectionObserver; });
      const p = await ctx.newPage();
      await p.goto(URL, { waitUntil: "load" });
      const st = await p.evaluate(() => Array.from(document.querySelectorAll(".reveal")).map((e) => e.classList.contains("in")));
      ok(st.length === SECTIONS.length && st.every(Boolean), "IntersectionObserver が無くても、全セクションが表示される  " + st.join(","));
      await ctx.close();
    }

    // ---- 5. IntersectionObserver が壊れていても、全部見える
    {
      const ctx = await newCtx(browser, { viewport: { width: 1280, height: 800 } });
      await ctx.addInitScript(() => { window.IntersectionObserver = function () { throw new Error("broken"); }; });
      const p = await ctx.newPage();
      await p.goto(URL, { waitUntil: "load" });
      const st = await p.evaluate(() => Array.from(document.querySelectorAll(".reveal")).map((e) => e.classList.contains("in")));
      ok(st.length === SECTIONS.length && st.every(Boolean), "IntersectionObserver が例外を出しても、全セクションが表示される  " + st.join(","));
      await ctx.close();
    }

    // ---- 6. スマホ幅：横にはみ出さない／文字が消えていない
    for (const w of [360, 390, 768, 1280]) {
      const ctx = await newCtx(browser, { viewport: { width: w, height: 800 } });
      const p = await ctx.newPage();
      await p.goto(URL, { waitUntil: "load" });
      await p.evaluate(() => document.querySelectorAll(".reveal").forEach((e) => e.classList.add("in")));
      await sleep(1000);
      const over = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      ok(over <= 0, "幅 " + w + " で横にはみ出さない（" + over + "px）");
      if (w === 390 && shots) await p.screenshot({ path: path.join(shots, "look-mobile.png"), fullPage: true });
      if (w === 1280) {
        const text = await p.evaluate(() => document.body.innerText);
        [
          "これはサンプルです。実際の研究大会とは関係ありません。", "歴史教育の実践が、ここに集まります。", "お知らせ", "大会概要", "日程と流れ",
          "分科会", "参加申込", "アーカイブ配信", "開催地の歴史にふれる", "過去の研究大会", "お問い合わせ", "サンプル歴史教育研究会について", "3,000円"
        ].forEach((t) => ok(text.indexOf(t) >= 0, "文字が残っている：" + t));
      }
      await ctx.close();
    }
  } finally {
    await browser.close();
    srv.close();
    fs.rmSync(ROOT, { recursive: true, force: true });
  }
  console.log(bad ? "\n" + bad + " 件失敗" : "demo-look: すべて通りました");
  process.exit(bad ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
