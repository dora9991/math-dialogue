/* ブラウザでの総合検査：ヘッドレス Chromium で編集画面を開き、画面操作をひと通り行う。
   使い方：NODE_PATH=$(npm root -g) node conference-editor/test/e2e.js [スクリーンショットの保存先フォルダ]
   確かめること：
     ローカルモード … 追加・並べ替え・削除・保存・点検・公開・公開側の表示・「調整中」の札・元に戻す・不正な文字が実行されないこと
     共同編集モード … 偽の Supabase に対して、ログイン（コード）・保存・衝突・公開・公開側（anon）の表示・編集者でない人の拒否・ログアウト */
const fs = require("fs"), path = require("path"), http = require("http");
const { chromium } = require("playwright");
const { createFake, ANON } = require("./fake-supabase.js");
let bad = 0;
const ok = (c, m) => { if (!c) { bad++; console.log("✗", m); } else if (process.env.VERBOSE) console.log("✓", m); };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), m + "  期待 " + JSON.stringify(b) + " 実際 " + JSON.stringify(a));

const LOCAL_CONFIG = 'window.CONF_EDITOR_CONFIG={BACKEND:"local",SUPABASE_URL:"",SUPABASE_ANON_KEY:"",SITE_URL:"../conference-demo/"};';
const ROOT = path.resolve(__dirname, "..");
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8" };
function serve() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      const p = path.join(ROOT, decodeURIComponent(req.url.split("?")[0]).replace(/\/+$/, "") || "/index.html");
      if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end("not found"); }
      res.writeHead(200, { "content-type": MIME[path.extname(p)] || "application/octet-stream" });
      res.end(fs.readFileSync(p));
    }).listen(0, "127.0.0.1", () => resolve({ srv, base: "http://127.0.0.1:" + srv.address().port }));
  });
}

(async () => {
  const shots = process.argv[2] ? path.resolve(process.argv[2]) : null;
  if (shots) fs.mkdirSync(shots, { recursive: true });
  const { srv, base } = await serve();
  const browser = await chromium.launch();
  const errors = [];
  const snap = async (page, name) => { if (shots) await page.screenshot({ path: path.join(shots, name + ".png"), fullPage: true }); };
  const track = (page, label) => {
    page.on("pageerror", (e) => errors.push(label + " pageerror: " + e.message));
    page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(label + " console: " + m.text()); });
  };
  const banner = async (page) => ((await page.locator("#ce-banner").textContent()) || "").trim();
  const tab = (page, label) => page.locator(".ce-tab", { hasText: label }).click();

  // =================================================================
  // ローカルモード
  // =================================================================
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await ctx.route("**/config.js", (r) => r.fulfill({ contentType: "text/javascript", body: LOCAL_CONFIG })); // 設定の既定は supabase なので、ローカルの検査は設定を明示
    const page = await ctx.newPage();
    track(page, "local");
    const dialogs = [];
    page.on("dialog", (d) => { dialogs.push(d.message()); d.accept(); });

    await page.goto(base + "/index.html");
    await page.waitForSelector("#ce-app:not([hidden])");
    ok(/ローカルモード/.test(await page.locator("#ce-mode").textContent()), "ローカル：モード表示");
    ok(await page.locator("#ce-login").isHidden(), "ローカル：ログイン欄は出ない");
    ok(await page.locator("#ce-save").isDisabled(), "ローカル：最初は保存ボタンが無効");
    eq(await page.locator("#ce-publish").isEnabled(), true, "ローカル：未公開なら公開ボタンは有効");

    // ---- お知らせ ----
    await page.getByRole("button", { name: "お知らせを追加" }).click();
    await page.locator('.ce-item').nth(0).locator('[data-f="date"]').fill("2027-04-01");
    await page.locator('.ce-item').nth(0).locator('[data-f="text"]').fill("最初のお知らせ【調整中】詳細は後日");
    await page.getByRole("button", { name: "お知らせを追加" }).click();
    await page.locator('.ce-item').nth(1).locator('[data-f="date"]').fill("2027-05-10");
    await page.locator('.ce-item').nth(1).locator('[data-f="text"]').fill("新しいお知らせ");
    await page.locator('.ce-item').nth(1).locator('[data-f="url"]').fill("https://example.com/news");
    eq(await page.locator("#ce-preview .news li").count(), 2, "お知らせ：プレビューに2件");
    eq(await page.locator("#ce-preview .news li").nth(0).locator("time").textContent(), "2027年4月1日", "お知らせ：日付を日本語で表示");
    ok(await page.locator(".ce-tab[aria-selected='true'] .ce-dot").count() === 1, "お知らせ：未保存の印が出る");
    ok(await page.locator("#ce-save").isEnabled(), "お知らせ：保存ボタンが有効になる");

    eq(await page.locator("#ce-preview .news li").nth(0).locator("p").textContent(), "最初のお知らせ調整中詳細は後日", "お知らせ：入力した順（4/1が先頭）。【調整中】は札の文字「調整中」になる");
    await page.getByRole("button", { name: "日付の新しい順に並べ替え" }).click();
    eq(await page.locator("#ce-preview .news li").nth(0).locator("p").textContent(), "新しいお知らせ", "お知らせ：並べ替えで新しい日付（5/10）が先頭");
    ok(await page.locator("#ce-preview .news li a").count() === 1, "お知らせ：リンクがあれば本文がリンクになる");
    await page.locator('.ce-item').nth(0).locator('[data-op="down"]').click();
    eq(await page.locator("#ce-preview .news li").nth(0).locator("p").textContent(), "最初のお知らせ調整中詳細は後日", "お知らせ：↓で順番が入れ替わる");
    eq(await page.locator("#ce-preview .news .tbd").count(), 1, "お知らせ：【調整中】は札になる（.tbd が1つ）");

    // ---- 見取り図・「いま編集しているところ」・光る行 ----
    eq(await page.locator("#ce-tabs .ce-tab").count(), 3, "見取り図：編集できる場所が3つ");
    eq(await page.locator("#ce-tabs .ce-tab-fixed").count(), 2, "見取り図：編集しない部分（ページの上・そのほか）も薄く出る");
    eq(await page.locator(".ce-tab[aria-selected='true'] .ce-tab-now").textContent(), "編集中", "見取り図：いま編集している場所に「編集中」の札");
    eq(await page.locator("#ce-where-title").textContent(), "お知らせ", "「いま編集しているところ」の見出し");
    eq(await page.locator("#ce-where-link").getAttribute("href"), "../conference-demo/#news", "「サイトのこの部分を開く」のリンク（お知らせ）");
    ok(await page.locator(".ce-hint").count() >= 3, "入力欄に、サイトのどこに出るかの説明がある");
    ok(await page.locator('[data-f="text"]').first().getAttribute("placeholder") !== null, "入力欄に、書き方の例（プレースホルダー）がある");
    // 入力欄に触ると、プレビューの該当する行が光る
    await page.locator(".ce-item").nth(1).locator('[data-f="text"]').click();
    ok(await page.locator(".ce-item").nth(1).evaluate((n) => n.classList.contains("ce-active")), "光る行：触った入力欄のカードが「編集中」になる");
    eq(await page.locator("#ce-preview .ce-hl").getAttribute("data-i"), "1", "光る行：プレビューの2番目の行が光る");
    eq(await page.locator("#ce-preview .ce-hl").count(), 1, "光る行：光るのは1行だけ");
    ok(/編集中/.test(await page.locator(".ce-item").nth(1).locator(".ce-now").innerText()), "光る行：カードに「編集中」の札が見える");
    await page.locator(".ce-item").nth(0).locator('[data-f="text"]').click();
    eq(await page.locator("#ce-preview .ce-hl").getAttribute("data-i"), "0", "光る行：別の入力欄に移ると、光る行も移る");
    // カードの見出しに、中身の要約が出る
    ok(/最初のお知らせ/.test(await page.locator(".ce-item").nth(0).locator(".ce-sum").textContent()), "カードの見出しに、中身の要約が出る");
    await page.locator(".ce-item").nth(0).locator('[data-f="text"]').fill("最初のお知らせ【調整中】詳細は後日");
    // プレビューの行を押すと、その入力欄に移る
    await page.locator("#ce-preview li[data-i='1']").click();
    eq(await page.evaluate(() => document.activeElement.closest(".ce-item").getAttribute("data-i")), "1", "プレビューの行を押すと、その入力欄に移る");
    // 書き終えていない行は、プレビューで点線の薄い行になる（公開するとサイトには出ない）
    await page.getByRole("button", { name: "お知らせを追加" }).click();
    eq(await page.locator("#ce-preview .ce-blank").count(), 1, "空のカードは、プレビューで点線の薄い行になる");
    ok(/書いてください/.test(await page.locator("#ce-preview .ce-blank").textContent()), "空の行に「書いてください」の案内が出る");
    eq(await page.locator("#ce-preview .ce-hl").getAttribute("data-i"), "2", "追加した行が、すぐ光る（どこを書くのか分かる）");
    await page.locator(".ce-item").nth(2).locator('[data-op="del"]').click();   // 追加した空のカードを消す
    eq(await page.locator("#ce-preview .ce-blank").count(), 0, "空のカードを消すと、点線の行も消える");
    eq(await page.locator(".ce-item").count(), 2, "お知らせは2件に戻る");
    dialogs.length = 0;   // ここまでの確認ダイアログは、次の検査に数えない

    // ---- 点検：不正なURLは公開できない（リンクを付けた5/10の項目 = 2番目のカード） ----
    const second = page.locator(".ce-item").nth(1);
    await second.locator('[data-f="url"]').fill("javascript:alert(1)");
    ok(/http/.test(await page.locator("#ce-problems").textContent()), "点検：不正なURLの警告が出る");
    await page.locator("#ce-publish").click();
    ok(/赤い項目/.test(await banner(page)), "点検：エラーがあると公開できない");
    eq(dialogs.length, 0, "点検：エラーのときは確認ダイアログも出ない");
    await second.locator('[data-f="url"]').fill("https://example.com/news");

    // ---- 保存 ----
    await page.locator("#ce-save").click();
    await page.waitForFunction(() => /保存しました/.test(document.getElementById("ce-banner").textContent));
    ok(/保存済み/.test(await page.locator("#ce-status").textContent()), "保存：状態が「保存済み」");
    eq(await page.locator(".ce-tab .ce-dot").count(), 0, "保存：未保存の印が消える");
    ok(await page.locator("#ce-save").isDisabled(), "保存：保存ボタンが無効に戻る");

    // ---- 公開前：公開側は元のHTMLのまま ----
    const pub = await ctx.newPage();
    track(pub, "demo");
    await pub.goto(base + "/demo.html");
    await pub.waitForTimeout(150);
    ok(/元の内容/.test(await pub.locator('[data-content="news"]').textContent()), "公開前：公開側は元の内容のまま");

    // ---- 公開 ----
    await page.locator("#ce-publish").click();
    await page.waitForFunction(() => /公開しました/.test(document.getElementById("ce-banner").textContent));
    ok(dialogs.some((d) => /お知らせ/.test(d) && /公開します/.test(d)), "公開：確認ダイアログが出る");
    ok(/公開中（下書きと同じ内容）/.test(await page.locator("#ce-status").textContent()), "公開：状態が「公開中」");
    ok(await page.locator("#ce-publish").isDisabled(), "公開：変更がなければ公開ボタンは無効");
    await pub.reload();
    await pub.waitForFunction(() => document.querySelectorAll('[data-content="news"] li').length === 2);
    eq(await pub.locator('[data-content="news"] li').count(), 2, "公開後：公開側にお知らせ2件");
    ok(/元の内容/.test(await pub.locator('[data-content="program"]').textContent()), "公開後：未公開の項目（プログラム）は元の内容のまま");
    eq(await pub.locator('[data-content="news"] a').getAttribute("href"), "https://example.com/news", "公開後：リンクのURL");
    eq(await pub.locator('[data-content="news"] .tbd').count(), 1, "公開後：公開側でも【調整中】は札");
    await snap(pub, "demo-news");

    // ---- 公開後に下書きを変えると「未公開の変更」 → 元に戻す ----
    await page.locator('.ce-item').nth(0).locator('[data-f="text"]').fill("書きかけ");
    await page.locator("#ce-save").click();
    await page.waitForFunction(() => /保存しました/.test(document.getElementById("ce-banner").textContent));
    ok(/まだ公開していない変更/.test(await page.locator("#ce-status").textContent()), "下書き変更：未公開の変更があると表示");
    await pub.reload(); await pub.waitForTimeout(150);
    ok(!/書きかけ/.test(await pub.locator('[data-content="news"]').textContent()), "下書き変更：公開側には出ない");
    await page.locator("#ce-discard").click();
    await page.waitForFunction(() => /戻しました/.test(document.getElementById("ce-banner").textContent));
    eq(await page.locator('.ce-item [data-f="text"]').first().inputValue(), "最初のお知らせ【調整中】詳細は後日", "元に戻す：書きかけが消えて、公開中の内容に戻る");
    ok(/保存済み/.test(await page.locator("#ce-status").textContent()) && /下書きと同じ内容/.test(await page.locator("#ce-status").textContent()), "元に戻す：下書きは公開中と同じ内容に戻る");

    // ---- 不正な文字は実行されない ----
    await page.locator('.ce-item').nth(0).locator('[data-f="text"]').fill('<img src=x onerror="window.__xss=1"><script>window.__xss=2</script>');
    await page.locator("#ce-publish").click();
    await page.waitForFunction(() => /公開しました/.test(document.getElementById("ce-banner").textContent));
    await pub.reload(); await pub.waitForTimeout(200);
    eq(await pub.locator('[data-content="news"] img, [data-content="news"] script').count(), 0, "安全：HTMLとして解釈されない（img/script が出ない）");
    eq(await pub.evaluate(() => window.__xss), undefined, "安全：公開側でスクリプトが実行されない");
    ok(/<img src=x/.test(await pub.locator('[data-content="news"]').textContent()), "安全：文字としてそのまま表示される");
    eq(await page.evaluate(() => window.__xss), undefined, "安全：編集画面でもスクリプトが実行されない");

    // ---- 大会概要 ----
    await tab(page, "大会概要");
    await page.getByRole("button", { name: "標準の項目を入れる" }).click();
    eq(await page.locator("#ce-panel .ce-item").count(), 5, "概要：標準の項目が5つ入る");
    await page.locator(".ce-item").nth(2).locator('[data-f="v"]').fill("佐賀市内の会場");
    await page.locator(".ce-item").nth(1).getByRole("button", { name: "【調整中】を入れる" }).click();
    eq(await page.locator("#ce-preview .spec > div:not(.ce-blank)").count(), 2, "概要：プレビューで、内容のある行は2つ（開催日程の札＋会場）");
    eq(await page.locator("#ce-preview .spec > div.ce-blank").count(), 3, "概要：書いていない3行は、点線の薄い行で出る（公開するとサイトには出ない）");
    ok(await page.locator("#ce-preview .spec .tbd").count() === 1, "概要：札が1つ");
    ok(/内容が空/.test(await page.locator("#ce-problems").textContent()), "概要：内容が空の項目は注意が出る");
    await page.locator("#ce-publish").click();
    await page.waitForFunction(() => /公開しました/.test(document.getElementById("ce-banner").textContent));
    await snap(page, "editor-overview");

    // ---- プログラム ----
    await tab(page, "日程と流れ");
    await page.getByRole("button", { name: "日を追加" }).click();
    await page.locator(".ce-item").nth(0).locator('[data-f="sub"]').fill("総会と分科会");
    await page.getByRole("button", { name: "この日に項目を追加" }).click();
    await page.locator(".ce-sub").nth(0).locator('[data-f="time"]').fill("9:30");
    await page.locator(".ce-sub").nth(0).locator('[data-f="text"]').fill("受付");
    await page.getByRole("button", { name: "この日に項目を追加" }).click();
    await page.locator(".ce-sub").nth(1).locator('[data-f="text"]').fill("総会");
    await page.getByRole("button", { name: "日を追加" }).click();
    eq(await page.locator(".ce-item").nth(1).locator('[data-f="label"]').inputValue(), "2日目", "プログラム：日の見出しは自動で「2日目」");
    eq(await page.locator("#ce-where-title").textContent(), "日程と流れ", "「いま編集しているところ」の見出しが、場所に合わせて変わる");
    eq(await page.locator("#ce-where-link").getAttribute("href"), "../conference-demo/#schedule", "「サイトのこの部分を開く」のリンク（日程と流れ）");
    eq(await page.locator(".ce-tab[aria-selected='true']").getAttribute("data-key"), "program", "見取り図：「日程と流れ」が選ばれている");
    await page.locator(".ce-sub").nth(0).locator('[data-f="text"]').click();
    eq(await page.locator(".ce-sub.ce-active").count(), 1, "光る行：触った項目のカードが「編集中」になる");
    eq(await page.locator("#ce-preview .day.ce-hl").count(), 1, "光る行：その日のカードが光る");
    ok(/受付/.test(await page.locator("#ce-preview li.ce-hl2").textContent()), "光る行：その項目の行が、さらに光る");
    eq(await page.locator("#ce-preview .day").count(), 2, "プログラム：プレビューに2日");
    eq(await page.locator("#ce-preview .day").nth(0).locator("li").count(), 2, "プログラム：1日目に2項目");
    await page.locator(".ce-sub").nth(1).locator('[data-op="up"]').click();
    eq(await page.locator("#ce-preview .day").nth(0).locator("li").first().textContent(), "総会", "プログラム：項目の並べ替え");
    await page.locator(".ce-sub").nth(0).locator('[data-op="del"]').click();
    eq(await page.locator("#ce-preview .day").nth(0).locator("li").count(), 1, "プログラム：項目の削除（内容があるので確認ダイアログ→OK）");
    ok(dialogs.some((d) => /削除します/.test(d)), "プログラム：削除の確認ダイアログが出た");
    await page.locator("#ce-publish").click();
    await page.waitForFunction(() => /公開しました/.test(document.getElementById("ce-banner").textContent));
    await pub.reload();
    await pub.waitForFunction(() => document.querySelectorAll('[data-content="program"] .day').length === 2);
    eq(await pub.locator('[data-content="program"] .day').count(), 2, "公開後：公開側にプログラム2日");
    eq(await pub.locator('[data-content="overview"] dt').allTextContents(), ["開催日程", "会場"], "公開後：公開側の大会概要は内容のある行だけ");
    await snap(pub, "demo-all");

    // ---- 再読み込みしても残る／タブ移動で内容が混ざらない ----
    await page.reload();
    await page.waitForSelector("#ce-app:not([hidden])");
    await tab(page, "お知らせ");
    ok(/<img src=x/.test(await page.locator('.ce-item [data-f="text"]').first().inputValue()), "再読み込み：下書きが残っている");
    await snap(page, "editor-news");

    // ---- 未保存のまま離れようとすると警告 ----
    await page.locator('.ce-item').nth(0).locator('[data-f="text"]').fill("未保存の変更");
    const guarded = await page.evaluate(() => { const e = new Event("beforeunload", { cancelable: true }); window.dispatchEvent(e); return e.defaultPrevented; });
    eq(guarded, true, "離脱：未保存の変更があると警告する");

    // ---- スマホ幅 ----
    await page.setViewportSize({ width: 390, height: 800 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    eq(overflow <= 0, true, "スマホ幅：横スクロールなし");
    await snap(page, "editor-mobile");
    await ctx.close();
  }

  // =================================================================
  // 共同編集モード（偽の Supabase）
  // =================================================================
  {
    const fake = createFake({ users: ["editor@example.com", "stranger@example.com"], editors: ["editor@example.com"] });
    const ctx = await browser.newContext({ viewport: { width: 1000, height: 900 } });
    await ctx.route("**/config.js", (r) => r.fulfill({ contentType: "text/javascript", body: 'window.CONF_EDITOR_CONFIG={BACKEND:"supabase",SUPABASE_URL:"https://fake.supabase.test",SUPABASE_ANON_KEY:"' + ANON + '"};' }));
    await ctx.route("https://fake.supabase.test/**", async (route) => {
      const req = route.request();
      const cors = { "access-control-allow-origin": "*", "access-control-allow-headers": "authorization, apikey, content-type, prefer, x-client-info", "access-control-allow-methods": "GET,POST,PATCH,OPTIONS" };
      if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: cors });
      const res = fake.handle({ method: req.method(), url: req.url(), headers: req.headers(), body: req.postData() || undefined });
      return route.fulfill({ status: res.status, headers: Object.assign({ "content-type": "application/json" }, cors), body: res.json === null ? "" : JSON.stringify(res.json) });
    });
    const page = await ctx.newPage();
    track(page, "supabase");
    const dialogs = [];
    page.on("dialog", (d) => { dialogs.push(d.message()); d.accept(); });

    await page.goto(base + "/index.html");
    await page.waitForSelector("#ce-login:not([hidden])");
    ok(await page.locator("#ce-app").isHidden(), "共同：最初はログイン画面だけ");
    ok(await page.locator("#ce-code-box").isHidden(), "共同：コード欄は最初は隠れている");
    await snap(page, "login");

    // 招待されていないメール
    await page.fill("#ce-email", "nobody@example.com");
    await page.click("#ce-send");
    await page.waitForFunction(() => /送れませんでした/.test(document.getElementById("ce-banner").textContent));
    ok(await page.locator("#ce-code-box").isHidden(), "共同：送れなければコード欄は出ない");

    // 編集者でない人（ログインはできるが、中身は読めない）
    await page.fill("#ce-email", "stranger@example.com");
    await page.click("#ce-send");
    await page.waitForSelector("#ce-code-box:not([hidden])");
    await page.fill("#ce-code", "123456");
    await page.click("#ce-verify");
    await page.waitForFunction(() => /編集者として登録されていない/.test(document.getElementById("ce-banner").textContent));
    ok(await page.locator("#ce-app").isHidden() && await page.locator("#ce-login").isVisible(), "共同：編集者でない人は編集画面に入れない（ログイン画面に戻る）");
    eq(await page.evaluate(() => localStorage.getItem("conferenceEditor.session")), null, "共同：入れなかった人のログイン情報は残らない");

    // 編集者：コードが違う → 正しいコード
    await page.fill("#ce-email", "editor@example.com");
    await page.click("#ce-send");
    await page.waitForSelector("#ce-code-box:not([hidden])");
    await page.fill("#ce-code", "000000");
    await page.click("#ce-verify");
    await page.waitForFunction(() => /コードが違う/.test(document.getElementById("ce-banner").textContent));
    await page.fill("#ce-code", "123456");
    await page.click("#ce-verify");
    await page.waitForSelector("#ce-app:not([hidden])");
    ok(/editor@example.com/.test(await page.locator("#ce-mode").textContent()), "共同：ログイン中のメールを表示");
    ok(await page.locator("#ce-logout").isVisible(), "共同：ログアウトが出る");

    // 編集 → 保存
    await page.getByRole("button", { name: "お知らせを追加" }).click();
    await page.locator(".ce-item").nth(0).locator('[data-f="date"]').fill("2027-06-01");
    await page.locator(".ce-item").nth(0).locator('[data-f="text"]').fill("共同編集のお知らせ");
    await page.click("#ce-save");
    await page.waitForFunction(() => /保存しました/.test(document.getElementById("ce-banner").textContent));
    eq(fake.state.rows.news.draft.length, 1, "共同：サーバーに下書きが保存された");
    eq(fake.state.rows.news.draft[0].text, "共同編集のお知らせ", "共同：保存された本文");
    eq(fake.state.rows.news.published_at, null, "共同：保存しただけでは公開されない");
    ok(/editor@example.com/.test(await page.locator("#ce-status").textContent()), "共同：最終更新者を表示");

    // 公開側（anon）：未公開のうちは見えない
    const pub = await ctx.newPage();
    track(pub, "supabase-demo");
    await pub.goto(base + "/demo.html");
    await pub.waitForTimeout(200);
    ok(/元の内容/.test(await pub.locator('[data-content="news"]').textContent()), "共同：公開前は公開側に出ない（元の内容のまま）");

    // 衝突：他の人が先に更新した
    fake.state.rows.news.version += 1;
    await page.locator(".ce-item").nth(0).locator('[data-f="text"]').fill("衝突するはずの変更");
    await page.click("#ce-save");
    await page.waitForFunction(() => /他の人が先に更新/.test(document.getElementById("ce-banner").textContent));
    ok(await page.locator("#ce-banner button").isVisible(), "共同：衝突のときは「最新を読み込む」が出る");
    eq(fake.state.rows.news.draft[0].text, "共同編集のお知らせ", "共同：衝突したときは上書きされない");
    await page.locator("#ce-banner button").click();
    await page.waitForFunction(() => document.querySelector('.ce-item [data-f="text"]') && document.querySelector('.ce-item [data-f="text"]').value === "共同編集のお知らせ");
    ok(true, "共同：最新を読み込むとサーバーの内容に戻る");

    // 公開
    await page.click("#ce-publish");
    await page.waitForFunction(() => /公開しました/.test(document.getElementById("ce-banner").textContent));
    ok(!!fake.state.rows.news.published_at, "共同：公開するとサーバーの published_at が入る");
    eq(fake.state.rows.news.published[0].text, "共同編集のお知らせ", "共同：公開内容はサーバー側で下書きからコピーされる");
    await pub.reload();
    await pub.waitForFunction(() => document.querySelectorAll('[data-content="news"] li').length === 1 && /共同編集/.test(document.querySelector('[data-content="news"]').textContent));
    ok(true, "共同：公開後は、ログインしていない公開側にも表示される");
    ok(/元の内容/.test(await pub.locator('[data-content="program"]').textContent()), "共同：未公開のプログラムは元の内容のまま");

    // 公開後に続けて保存できる（公開で版番号が進んでも、画面側が追従している）
    await page.locator(".ce-item").nth(0).locator('[data-f="text"]').fill("公開後に直した下書き");
    await page.click("#ce-save");
    await page.waitForFunction(() => /保存しました/.test(document.getElementById("ce-banner").textContent));
    eq(fake.state.rows.news.draft[0].text, "公開後に直した下書き", "共同：公開のあとも続けて保存できる");
    eq(fake.state.rows.news.published[0].text, "共同編集のお知らせ", "共同：公開中の内容は下書きの保存では変わらない");

    // 再読み込みしてもログインが残る
    await page.reload();
    await page.waitForSelector("#ce-app:not([hidden])");
    ok(/公開後に直した下書き/.test(await page.locator('.ce-item [data-f="text"]').first().inputValue()), "共同：再読み込みしてもログインと下書きが残る");

    // ログアウト
    await page.click("#ce-logout");
    await page.waitForSelector("#ce-login:not([hidden])");
    eq(await page.evaluate(() => localStorage.getItem("conferenceEditor.session")), null, "共同：ログアウトでログイン情報が消える");
    ok(fake.state.log.some((l) => l === "POST /auth/v1/logout"), "共同：サーバーにもログアウトを伝える");

    // パスワードでログイン（会員サイトのアカウントを想定）
    await page.fill("#ce-email", "editor@example.com");
    await page.fill("#ce-password", "wrong-password");
    await page.click("#ce-signin");
    await page.waitForFunction(() => /パスワードが違います/.test(document.getElementById("ce-banner").textContent));
    ok(await page.locator("#ce-app").isHidden(), "共同：パスワードが違えば入れない");
    await page.fill("#ce-password", "correct-horse");
    await page.press("#ce-password", "Enter");
    await page.waitForSelector("#ce-app:not([hidden])");
    ok(/editor@example.com/.test(await page.locator("#ce-mode").textContent()), "共同：パスワード（Enterキー）でログインできる");
    ok(/公開後に直した下書き/.test(await page.locator('.ce-item [data-f="text"]').first().inputValue()), "共同：パスワードでログインしても、同じ中身が出る");
    eq(await page.inputValue("#ce-password"), "", "共同：ログイン後、パスワード欄は空に戻る");
    await snap(page, "editor-after-password-login");
    // 編集者でない人は、パスワードが合っていても入れない
    await page.click("#ce-logout");
    await page.waitForSelector("#ce-login:not([hidden])");
    await page.fill("#ce-email", "stranger@example.com");
    await page.fill("#ce-password", "correct-horse");
    await page.click("#ce-signin");
    await page.waitForFunction(() => /編集者として登録されていない/.test(document.getElementById("ce-banner").textContent));
    ok(await page.locator("#ce-app").isHidden(), "共同：編集者でない人は、パスワードが合っていても編集画面に入れない");
    eq(await page.evaluate(() => localStorage.getItem("conferenceEditor.session")), null, "共同：入れなかった人のログイン情報は残らない（パスワード）");
    await snap(page, "login-password");
    await ctx.close();
  }

  await browser.close();
  srv.close();
  errors.forEach((e) => { bad++; console.log("✗", e); });
  console.log(bad ? "\n失敗 " + bad + " 件" : "e2e: すべて通過");
  process.exit(bad ? 1 : 0);
})().catch((e) => { console.error("検査が異常終了:", e); process.exit(2); });
