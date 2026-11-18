// 使い方: node tools/test.mjs [画像の出力フォルダ]     （Playwright・Chromium が要る。公開はしない）
// 模擬のサーバー（tools/mock-server.mjs）に対して、画面を動かして確かめる。
// ページと模擬のサーバーは別々のポートで動かす（本番と同じく、別のオリジンへの RPC ＝ CORS も確かめる）。
import { createServer } from "node:http";
import { readFileSync, existsSync, mkdirSync, readdirSync, mkdtempSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, extname } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
import { createMock, seedDemo, seedHomework, IDS, uuid } from "./mock-server.mjs";
import { progress, ymdJST } from "./progress.mjs";

const here = dirname(fileURLToPath(import.meta.url)), root = join(here, "..");
const OUT = process.argv[2] || join(tmpdir(), "kotsu-hw-shots");
mkdirSync(OUT, { recursive: true });
const NOW = Date.parse("2026-11-18T12:00:00+09:00");   // 画面も模擬のサーバーも、この「いま」で動かす
const DAY = 86400000, TODAY = ymdJST(NOW), day = (n) => ymdJST(NOW + n * DAY);
const vectors = JSON.parse(readFileSync(join(here, "vectors.json"), "utf8"));

// ── 結果の集計 ──
let pass = 0, fail = 0; const fails = [];
const ok = (cond, name, detail = "") => { if (cond) { pass++; console.log(`  ✓ ${name}`); } else { fail++; fails.push(name); console.log(`  ✗ ${name}${detail ? "  → " + detail : ""}`); } };
const eq = (a, b, name) => ok(JSON.stringify(a) === JSON.stringify(b), name, `実際 ${JSON.stringify(a)} ／ 期待 ${JSON.stringify(b)}`);
const section = async (name, fn) => { console.log(`\n■ ${name}`); try { await fn(); } catch (e) { fail++; fails.push(`${name}：例外`); console.log(`  ✗ 例外：${e && e.stack ? e.stack.split("\n").slice(0, 4).join("\n    ") : e}`); } };

// ── 静的ファイルのサーバー（ページ用）──
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8" };
const pageSrv = createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]); if (p === "/") p = "/index.html";
  const fp = join(root, p);
  if (!fp.startsWith(root) || p.startsWith("/tools") || !existsSync(fp)) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, { "Content-Type": MIME[extname(fp)] || "application/octet-stream", "Cache-Control": "no-store" }); res.end(readFileSync(fp));
});
await new Promise((r) => pageSrv.listen(0, "127.0.0.1", r));
const PAGE = `http://127.0.0.1:${pageSrv.address().port}`;
const browser = await chromium.launch();
const allErrors = [];

// ── 環境（模擬のサーバー）と、ページの開きかた ──
async function makeEnv({ homework = false, demo = true } = {}) {
  const mock = createMock({ now: () => NOW });
  if (demo) seedDemo(mock);
  if (homework) seedHomework(mock, NOW);
  const srv = await mock.listen(0);
  return { mock, srv, port: srv.port, close: () => srv.close() };
}
const LOGINS = {
  t1: { token: "tok-t1", user: { id: uuid(901), login: "tanaka", nick: "田中先生", role: "teacher" }, org: { code: "MOCK01", name: "模擬中学校" } },
  t2: { token: "tok-t2", user: { id: uuid(902), login: "suzuki", nick: "鈴木先生", role: "teacher" }, org: { code: "MOCK01", name: "模擬中学校" } },
  admin: { token: "tok-admin", user: { id: uuid(903), login: "admin", nick: "管理者", role: "admin" }, org: { code: "MOCK01", name: "模擬中学校" } },
  expired: { token: "tok-expired", user: { id: "x", login: "old", nick: "期限切れ", role: "teacher" }, org: { code: "MOCK01", name: "模擬中学校" } },
  student: { token: "tok-t1", user: { id: "s", login: "kid", nick: "せいと", role: "student" }, org: { code: "MOCK01", name: "模擬中学校" } },
};
async function openPage(env, { login = "t1", store = "local", w = 1280, h = 900, hash = "", now = NOW, serverField = null, allow = [] } = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, locale: "ja-JP", timezoneId: "Asia/Tokyo" });
  const url = `http://127.0.0.1:${env.port}`;
  if (login) {
    const v = JSON.stringify({ ...LOGINS[login], keep: store === "local", server: serverField || url });
    await ctx.addInitScript(([st, key, val]) => { try { if (!window.name.includes("seeded")) { (st === "local" ? localStorage : sessionStorage).setItem(key, val); } } catch { /* 無視 */ } }, [store, "kotsu-staff-v1", v]);
  }
  const page = await ctx.newPage();
  page.errs = []; page.reqs = [];
  page.on("pageerror", (e) => page.errs.push("pageerror: " + e));
  page.on("console", (m) => { if (m.type() === "error" && !allow.some((re) => re.test(m.text()))) page.errs.push("console: " + m.text()); });
  page.on("request", (r) => { if (r.url().includes("/rpc/")) page.reqs.push({ url: r.url(), headers: r.headers(), body: r.postData() }); });
  await page.clock.setFixedTime(new Date(now));
  await page.goto(`${PAGE}/index.html?server=mock:${env.port}${hash}`);
  page.ctxx = ctx;
  return page;
}
const closePage = async (page) => { allErrors.push(...page.errs.map((e) => `${e}`)); await page.ctxx.close(); };
const noErrs = (page, name) => ok(page.errs.length === 0, `コンソールのエラーなし：${name}`, page.errs.join(" / "));
const ready = (page) => page.waitForSelector(".k-tabs", { timeout: 8000 });
const text = (page, sel) => page.locator(sel).first().innerText();
const hashOf = (page) => page.evaluate(() => location.hash);
async function waitHash(page, re) { await page.waitForFunction((s) => new RegExp(s).test(location.hash), re.source, { timeout: 8000 }); }

// はみ出し・重なりの点検（画面の中で実行）
const overflowCheck = (page) => page.evaluate(() => {
  const W = document.documentElement.clientWidth, bad = [];
  if (document.documentElement.scrollWidth > W + 1) bad.push(`ページが横にスクロールする（${document.documentElement.scrollWidth} > ${W}）`);
  const skip = (el) => el.closest(".gw") || el.closest(".k-toast");
  for (const el of document.querySelectorAll("body *")) {
    if (skip(el)) continue;
    const cs = getComputedStyle(el); if (cs.display === "none" || cs.visibility === "hidden") continue;
    const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue;
    if (r.right > W + 1 || r.left < -1) bad.push(`画面の外へ：${el.tagName.toLowerCase()}.${String(el.className).slice(0, 30)} (${Math.round(r.left)}〜${Math.round(r.right)})`);
    if (cs.display !== "inline" && cs.overflowX === "visible" && el.scrollWidth > el.clientWidth + 1 && el.children.length === 0 && el.textContent.trim()) bad.push(`文字がはみ出す：${el.tagName.toLowerCase()}.${String(el.className).slice(0, 30)} "${el.textContent.trim().slice(0, 16)}"`);
  }
  return bad.slice(0, 8);
});
const shot = async (page, name, full = true) => { await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(150); await page.screenshot({ path: join(OUT, `${name}.png`), fullPage: full }); };

// ══════════════════ 0. 基準の実装と、検算データ ══════════════════
await section("基準の実装（progress.mjs）が、検算データ全件で期待どおり", async () => {
  let n = 0;
  for (const v of vectors) {
    const r = progress(v.hw, v.state, v.nowMs);
    const e = v.expect;
    const same = r.count === e.count && r.correct === e.correct && r.sec === e.sec && Math.abs(r.pct - e.pct) < 0.0005 && r.done === e.done && r.doneAt === e.doneAt && r.status === e.status && r.phase === e.phase;
    if (same) n++; else console.log("   不一致:", v.name, r, e);
  }
  ok(n === vectors.length, `検算データ ${n}/${vectors.length} 件が一致`);
});

// ══════════════════ 1. ログイン ══════════════════
await section("ログイン：なし／期限切れ／生徒／別のサーバー／sessionStorage／ログインずみ", async () => {
  const env = await makeEnv();
  // ログインなし
  let p = await openPage(env, { login: null });
  await p.waitForSelector("#login-guide");
  ok((await text(p, "#login-guide h1")).includes("先生の画面でログインしてください"), "ログインなし：案内が出る");
  const href = await p.locator("#login-link").evaluate((a) => a.href);
  eq(href, new URL("../", p.url()).href, "ログインなし：リンクは先生の画面（../）");
  ok(env.mock.calls.length === 0, "ログインなし：サーバーを呼ばない");
  await shot(p, "login-none-pc", false); noErrs(p, "ログインなし"); await closePage(p);
  // 期限切れ（トークンがサーバーで無効）
  p = await openPage(env, { login: "expired" });
  await p.waitForSelector("#login-guide");
  ok((await text(p, "#login-guide h1")).includes("期限が切れました"), "期限切れ：案内が出る（{error:'auth'}）");
  ok((await p.locator("#login-link").getAttribute("href")) === "../", "期限切れ：リンク ../");
  noErrs(p, "期限切れ"); await closePage(p);
  // 生徒のトークンは、使わない
  let n0 = env.mock.calls.length;
  p = await openPage(env, { login: "student" });
  await p.waitForSelector("#login-guide"); ok(env.mock.calls.length === n0, "生徒のログイン：使わない（サーバーを呼ばない）"); await closePage(p);
  // server がちがう保存は、使わない（先生の画面と同じ）
  p = await openPage(env, { login: "t1", serverField: "https://mtzhbiadzqjhvhzzdsbn.supabase.co/rest/v1" });
  await p.waitForSelector("#login-guide"); ok(env.mock.calls.length === n0, "server がちがう保存：使わない（サーバーを呼ばない）"); await closePage(p);
  // sessionStorage だけ（「ログインしたままにする」を外したとき）
  p = await openPage(env, { login: "t1", store: "session" });
  await ready(p); ok((await text(p, "#org")).includes("模擬中学校"), "sessionStorage のログインでも入れる"); await closePage(p);
  // ログインずみ
  const before = env.mock.calls.length;
  p = await openPage(env, { login: "t1" });
  await ready(p);
  ok((await text(p, "#org")).includes("模擬中学校") && (await text(p, "#org")).includes("MOCK01"), "ログインずみ：学校の名前と組織コード");
  ok((await text(p, "#who")).includes("田中先生"), "ログインずみ：先生のニックネーム");
  ok((await text(p, "#srvnote")).includes("模擬"), "模擬のサーバーのときは、その帯が出る");
  eq(env.mock.calls.slice(before, before + 1).map((c) => c.name), ["t_home"], "最初に t_home を呼ぶ");
  const html = await p.content();
  ok(!html.includes("tok-t1") && !p.url().includes("tok-t1"), "トークンが、画面にも URL にも出ない");
  // 画面から出る RPC のヘッダ（本番と同じ）
  const rq = p.reqs[0];
  ok(rq && rq.headers["content-profile"] === "kotsu" && rq.headers["content-type"].includes("json") && rq.headers.apikey && rq.headers.authorization.startsWith("Bearer "), "RPC のヘッダ：Content-Profile・apikey・Authorization");
  noErrs(p, "ログインずみ");
  // つかっているあいだに期限が切れた
  env.mock.expire("tok-t1");
  await p.click("#tab-list"); await p.locator("#l-reload").click().catch(() => {});
  await p.waitForSelector("#login-guide", { timeout: 6000 });
  ok((await text(p, "#login-guide h1")).includes("期限が切れました"), "つかっている途中の期限切れ：案内にかわる");
  noErrs(p, "途中の期限切れ"); await closePage(p);
  // 先生の画面でログインしなおしたら、「読みこみなおす」で入れる
  const env2 = await makeEnv();
  p = await openPage(env2, { login: "t1" }); await ready(p);
  env2.mock.expire("tok-t1"); await p.reload(); await p.waitForSelector("#login-guide");
  env2.mock.addStaff("tok-t1", { id: uuid(901), login: "tanaka", nick: "田中先生", role: "teacher", classIds: [IDS.classA, IDS.classB] });
  await p.click("#login-retry"); await ready(p);
  ok(true, "ログインしなおしたあと「読みこみなおす」で入れる"); await closePage(p);
  await env2.close(); await env.close();
});

// ══════════════════ 2. 空の状態・担当クラスなし・権限 ══════════════════
await section("空の状態（宿題なし）・担当クラスなし・読みこみ中・エラー", async () => {
  const env = await makeEnv();
  env.mock.latency = 400;
  const p = await openPage(env);
  await p.waitForSelector(".k-load", { timeout: 3000 }); ok(true, "読みこみ中の表示が出る");
  await ready(p); env.mock.latency = 0;
  await p.waitForSelector("#empty-list");
  ok((await text(p, "#empty-list")).includes("まだ宿題がありません"), "宿題なし：いまの宿題が空の案内");
  await p.click("#empty-list a.k-btn"); await p.waitForSelector("#hwform"); ok((await hashOf(p)) === "#new", "空の案内から「宿題を出す」へ");
  await p.click("#tab-grid"); await p.waitForSelector("#empty-grid"); ok(true, "宿題なし：マス目も空の案内");
  await shot(p, "empty-grid-pc", false);
  // エラー表示（サーバーが落ちたふり）
  env.mock.fail("hw_t_list", { __http: 500, body: { code: "XX000", message: "boom" } }, 1);
  await p.click("#tab-list"); await p.waitForSelector("#view-err"); ok((await text(p, "#view-err")).includes("うまくいきませんでした"), "サーバーのエラー：やさしい文で出る");
  await p.click("#view-retry"); await p.waitForSelector("#empty-list"); ok(true, "「もう一度よみこむ」で直る");
  await shot(p, "error-pc", false);
  allErrors.push(...p.errs.filter((e) => !/500/.test(e))); ok(p.errs.every((e) => /500/.test(e)), "コンソールのエラーは、わざと起こした 500 だけ", p.errs.join("/")); await p.ctxx.close();
  // 担当のクラスがない先生
  env.mock.addStaff("tok-none", { id: uuid(950), login: "none", nick: "担当なし先生", role: "teacher", classIds: [] });
  LOGINS.none = { token: "tok-none", user: { id: uuid(950), login: "none", nick: "担当なし先生", role: "teacher" }, org: { code: "MOCK01", name: "模擬中学校" } };
  const q = await openPage(env, { login: "none" }); await ready(q);
  await q.click("#tab-new"); await q.waitForSelector("#no-class"); ok(true, "担当クラスなし：宿題を出す画面に案内");
  await q.click("#tab-grid"); await q.waitForSelector("#no-class"); ok(true, "担当クラスなし：マス目にも案内"); noErrs(q, "担当クラスなし"); await closePage(q);
  await env.close();
});

// ══════════════════ 3. 宿題を出す ══════════════════
await section("宿題を出す：クラス宛て（N問のみ・M分のみ・両方）／個人宛て／ひとこと／検索", async () => {
  const env = await makeEnv();
  const p = await openPage(env, { hash: "#new" }); await p.waitForSelector("#hwform");
  const lastCall = () => env.mock.calls.filter((c) => c.name === "hw_t_create").at(-1);
  const KEYS = ["p_token", "p_class", "p_users", "p_title", "p_unit", "p_n", "p_min", "p_start", "p_due", "p_note"];
  const ensureNew = async () => { if ((await hashOf(p)) !== "#new") { await p.click("#tab-new"); await p.waitForSelector("#hwform"); } };

  // 既定の期間：今日〜あさって
  eq([await p.inputValue("#f-start"), await p.inputValue("#f-due")], [TODAY, day(2)], "既定の期間は、きょう〜あさって");
  ok((await p.inputValue("#f-class")) === IDS.classA, "クラスは、先頭の担当クラス");
  ok(await p.locator("#f-n").isDisabled(), "単元なしでは、N問は入れられない（欄が無効）");

  // 学年→章→単元
  await p.click('#up-grades button[data-g="J1"]');
  await p.selectOption("#f-chapter", "正の数と負の数");
  ok((await p.locator("#up-list button[data-u]").count()) === 6, "中1・正の数と負の数：6単元");
  await p.click('#up-list button[data-u="J1-u1"]');
  ok((await text(p, "#up-sel")).includes("正負の意味・大小"), "単元をえらぶと、えらんだ単元が出る");
  ok(!(await p.locator("#f-n").isDisabled()) && (await p.inputValue("#f-n")) === "10", "単元をえらぶと N問が入れられる（既定 10）");
  ok((await text(p, "#f-preview")).includes("中1 A組") && (await text(p, "#f-preview")).includes("正負の意味・大小 10問"), "確認の文：クラスと内容");
  await p.click("#f-submit"); await waitHash(p, /#list/);
  let c = lastCall();
  eq(Object.keys(c.args), KEYS, "hw_t_create：引数の名前が契約どおり（10個）");
  eq([c.args.p_class, c.args.p_users, c.args.p_unit, c.args.p_n, c.args.p_min, c.args.p_start, c.args.p_due, c.args.p_title, c.args.p_note], [IDS.classA, null, "J1-u1", 10, null, TODAY, day(2), "正負の意味・大小 10問", null], "N問だけ（クラス宛て）：引数");
  await p.waitForSelector("#flash-bar"); ok((await text(p, "#flash-bar")).includes("出しました"), "出したあと：「出しました」の知らせ");
  ok((await p.locator("#hw-list .hw").filter({ hasText: "正負の意味・大小 10問" }).count()) === 1, "いまの宿題の一覧に出る");

  // M分のみ
  await ensureNew();
  await p.fill("#f-min", "20"); await p.click("#f-submit"); await waitHash(p, /#list/);
  c = lastCall();
  eq([c.args.p_unit, c.args.p_n, c.args.p_min, c.args.p_title], [null, null, 20, "20分 学習"], "M分だけ：引数と自動の題");
  // 両方（全角の数字でも入る）
  await ensureNew();
  await p.click('#up-grades button[data-g="J1"]'); await p.selectOption("#f-chapter", ""); await p.click('#up-list button[data-u="J1-u2"]');
  await p.fill("#f-n", "５"); await p.fill("#f-min", "１５"); await p.fill("#f-note", "ゆっくりで、だいじょうぶ");
  await p.click("#f-submit"); await waitHash(p, /#list/);
  c = lastCall();
  eq([c.args.p_unit, c.args.p_n, c.args.p_min, c.args.p_title, c.args.p_note], ["J1-u2", 5, 15, "加法（足し算） 5問・15分", "ゆっくりで、だいじょうぶ"], "N問とM分の両方（全角の数字もOK）・ひとこと");
  // 題を入れる・期間をかえる・クラスB
  await ensureNew();
  await p.selectOption("#f-class", IDS.classB);
  await p.fill("#f-title", "冬休みの宿題 ①"); await p.fill("#f-min", "30");
  await p.click('#qd button[data-d="7"]');
  await p.fill("#f-start", day(1)); await p.click("#f-submit"); await waitHash(p, /#list/);
  c = lastCall();
  eq([c.args.p_class, c.args.p_title, c.args.p_min, c.args.p_start, c.args.p_due], [IDS.classB, "冬休みの宿題 ①", 30, day(1), day(7)], "別のクラス・題・期間（開始あす〜1週間後）");
  // 検索（全学年から）
  await ensureNew();
  await p.fill("#f-search", "因数分解");
  const hits = await p.locator("#up-list button[data-u]").count();
  ok(hits >= 2, `検索「因数分解」：${hits}件（中3・高1…をまたぐ）`);
  ok((await p.locator("#up-list button small").first().innerText()).length > 0, "検索結果に学年・章が出る");
  await p.locator("#up-list button[data-u]").first().click();
  ok((await text(p, "#up-sel")).includes("因数分解") || (await text(p, "#up-sel")).includes("乗法公式"), "検索結果から単元をえらべる");
  await p.fill("#f-search", ""); await p.click("#up-clear");
  ok((await p.locator("#f-n").isDisabled()) && (await p.inputValue("#f-n")) === "", "単元をはずすと、N問は空・無効にもどる");
  // 個人宛て
  await p.selectOption("#f-class", IDS.classA);
  await p.click('#f-target button[data-v="students"]'); await p.waitForSelector("#who-list");
  ok((await p.locator("#who-list input").count()) === 32, "生徒をえらぶ：クラス A の 32人が出る（出席番号つき）");
  ok((await p.locator("#who-list .no").first().innerText()) === "1", "生徒の一覧に出席番号が出る");
  await p.fill("#f-min", "10");
  await p.locator("#who-list input").nth(0).check(); await p.locator("#who-list input").nth(2).check();
  await p.selectOption("#f-class", IDS.classA);   // クラスを変えると選びなおし
  ok((await p.locator("#who-list input:checked").count()) === 0, "クラスをかえると、えらんだ生徒はリセット");
  await p.locator("#who-list input").nth(0).check(); await p.locator("#who-list input").nth(2).check();
  ok((await text(p, "#f-preview")).includes("2人"), "確認の文：個人宛て 2人");
  await p.click("#f-submit"); await waitHash(p, /#list/);
  c = lastCall();
  const aIds = [...env.mock.db.classes.get(IDS.classA).studentIds];
  eq([c.args.p_class, c.args.p_users, c.args.p_min], [null, [aIds[0], aIds[2]], 10], "個人宛て：class null・users 2人");
  await p.waitForSelector("#hw-list");
  ok((await p.locator("#hw-list .hw").filter({ hasText: "個人宛て" }).count()) >= 1, "一覧に「個人宛て」と出る");
  eq([...env.mock.db.hws.values()].length, 5, "ここまでで 5件 出した");
  noErrs(p, "宿題を出す"); await closePage(p); await env.close();
});

await section("宿題を出す：入力のエラー（サーバーを呼ばずに止める）／サーバーのエラー", async () => {
  const env = await makeEnv();
  const p = await openPage(env, { hash: "#new" }); await p.waitForSelector("#hwform");
  const creates = () => env.mock.calls.filter((c) => c.name === "hw_t_create").length;
  const errsText = async () => ((await p.locator("#f-errs").isVisible()) ? await text(p, "#f-errs") : "");
  const submit = async () => { await p.click("#f-submit"); await p.waitForTimeout(120); };
  // どちらも入れない
  await submit(); let t = await errsText();
  ok(t.includes("どちらか") && creates() === 0, "N問も M分も無い：止まる");
  await shot(p, "new-errors-pc", false);
  // 単元だけ（N問を消す）
  await p.click('#up-grades button[data-g="J1"]'); await p.click('#up-list button[data-u="J1-u1"]'); await p.fill("#f-n", ""); await submit();
  t = await errsText(); ok(t.includes("問題数（N問）も入れて") && creates() === 0, "単元だけで N問が空：止まる");
  for (const [v, label] of [["0", "0問"], ["201", "201問"], ["abc", "文字"], ["1.5", "小数"]]) { await p.fill("#f-n", v); await submit(); t = await errsText(); ok(t.includes("1〜 200") || t.includes("1〜200"), `N問 ${label}：1〜200 の案内`); }
  ok(creates() === 0, "範囲外の N問は、サーバーに送らない");
  await p.fill("#f-n", "200"); await p.fill("#f-min", "241"); await submit(); t = await errsText(); ok(t.includes("1〜240"), "M分 241：1〜240 の案内");
  await p.fill("#f-min", "0"); await submit(); t = await errsText(); ok(t.includes("1〜240"), "M分 0：止まる");
  await p.fill("#f-min", "240"); await p.fill("#f-n", "1");
  // 期間
  await p.fill("#f-due", day(-1)); await submit(); t = await errsText(); ok(t.includes("開始日と同じ日か") || t.includes("きょうより前"), "期限が開始日より前：止まる");
  await p.fill("#f-start", day(-5)); await p.fill("#f-due", day(-1)); await submit(); t = await errsText(); ok(t.includes("きょうより前"), "期限がきょうより前：止まる");
  await p.fill("#f-start", TODAY); await p.fill("#f-due", day(400)); await submit(); t = await errsText(); ok(t.includes("長すぎ"), "期間が1年より長い：止まる");
  await p.fill("#f-due", ""); await submit(); t = await errsText(); ok(t.includes("期限"), "期限が空：止まる");
  await p.fill("#f-due", day(1));
  await p.fill("#f-title", "あ".repeat(61)); ok((await p.inputValue("#f-title")).length === 60, "題：入力欄は60字までしか入らない");
  const setRaw = (sel, v) => p.evaluate(([s, v]) => { const e = document.querySelector(s); e.value = v; e.dispatchEvent(new Event("input", { bubbles: true })); }, [sel, v]);
  await setRaw("#f-title", "あ".repeat(61)); await submit(); t = await errsText(); ok(t.includes("60字"), "題が61字（貼りつけなど）：止まる"); await setRaw("#f-title", "");
  await p.fill("#f-note", "い".repeat(201)); ok((await p.inputValue("#f-note")).length === 200, "ひとこと：入力欄は200字までしか入らない");
  await setRaw("#f-note", "い".repeat(201)); await submit(); t = await errsText(); ok(t.includes("200字"), "ひとことが201字（貼りつけなど）：止まる");
  ok((await text(p, "#note-count")).includes("201/200"), "ひとことの文字数が見える");
  await setRaw("#f-note", "");
  // 個人宛てで生徒なし
  await p.click('#f-target button[data-v="students"]'); await p.waitForSelector("#who-list"); await submit(); t = await errsText(); ok(t.includes("生徒を1人以上"), "個人宛てで生徒が0人：止まる");
  ok(creates() === 0, "ここまで、ひとつもサーバーに送っていない");
  await closePage(p);
  // サーバーのエラー（新しい画面で）
  const p2 = await openPage(env, { hash: "#new", allow: [/404/] }); await p2.waitForSelector("#hwform");
  await p2.fill("#f-min", "20");
  env.mock.revokeClass("tok-t1", IDS.classA);    // 担当をはずされた（画面は古いまま）
  await p2.click("#f-submit"); await p2.waitForSelector("#f-errs:not([hidden])");
  ok((await text(p2, "#f-errs")).includes("できません") && (await p2.locator("#hwform").count()) === 1, "担当外のクラス：forbidden → わかりやすい文で、入力は残る");
  env.mock.fail("hw_t_create", { error: "bad_args" });
  await p2.click("#f-submit"); await p2.waitForTimeout(200); ok((await text(p2, "#f-errs")).includes("まちがい"), "bad_args：わかりやすい文");
  env.mock.fail("hw_t_create", { __http: 404, body: { code: "PGRST202", message: "Could not find the function" } });
  await p2.click("#f-submit"); await p2.waitForTimeout(200); ok((await text(p2, "#f-errs")).includes("まだ入っていません"), "関数がまだ無い（404/PGRST202）：運営の設定待ちと案内");
  env.mock.fail("hw_t_create", { error: "auth" });
  await p2.click("#f-submit"); await p2.waitForSelector("#login-guide"); ok(true, "送るとき auth：ログインの案内にかわる");
  allErrors.push(...p2.errs.filter((e) => !/404/.test(e))); ok(p2.errs.every((e) => /404/.test(e)), "コンソールのエラーは、わざと起こした 404 だけ", p2.errs.join("/")); await p2.ctxx.close();
  await env.close();
});

// ══════════════════ 4. 一覧 → 詳細 → マス目（色）══════════════════
const expectKind = (hw, student, now = NOW) => { const r = progress(hw, student.state, now); return r.phase === "upcoming" ? "upcoming" : r.status; };
await section("一覧・詳細・マス目：人数・進み・色が progress.mjs と同じ", async () => {
  const env = await makeEnv({ homework: true });
  const { mock } = env;
  const p = await openPage(env); await ready(p);
  await p.waitForSelector("#hw-list .hw");
  const cards = await p.locator("#hw-list .hw").count();
  ok(cards === 5, `いまの宿題（出している）：5件（${cards}）`);
  // 並び：期限が近い順（出している宿題は due 昇順）
  const dues = await p.locator("#hw-list .hw").evaluateAll((els) => els.map((e) => e.querySelector(".meta .k-chip:nth-child(2)").textContent));
  ok(dues.length === 5, "各カードに期間が出る");
  const titles = await p.locator("#hw-list .hw .tt").allInnerTexts();
  eq(titles[0], "正負の意味・大小 20問", "期限が近い順：きょう期限の宿題が先頭");
  await p.selectOption("#l-sort", "new"); const t2 = await p.locator("#hw-list .hw .tt").allInnerTexts();
  ok(t2[0].startsWith("個人宛て") && t2.length === 5, "新しい順：いちばん新しく出したものが先頭");
  await p.selectOption("#l-sort", "due");
  // 達成・一部・まだの人数が、基準の計算と一致する
  for (const hw of [...mock.db.hws.values()].filter((h) => !h.closed && h.due_date >= TODAY)) {
    const ts = [...(hw.class_id ? mock.db.classes.get(hw.class_id).studentIds.map((i) => mock.db.students.get(i)) : hw.user_ids.map((i) => mock.db.students.get(i)))];
    const st = ts.map((s) => progress(hw, s.state, NOW).status);
    const want = { d: st.filter((x) => x === "done").length, p: st.filter((x) => x === "partial").length, n: st.filter((x) => x === "none").length };
    const card = p.locator("#hw-list .hw", { hasText: hw.title }).first();
    const got = await card.locator(".counts b").allInnerTexts();
    eq(got.slice(0, 3).map(Number), [want.d, want.p, want.n], `人数（達成・一部・まだ）が計算と同じ：${hw.title}`);
  }
  await shot(p, "list-pc");
  // 期限切れ・締めた
  await p.click('#l-show button[data-show="ended"]'); ok((await p.locator("#hw-list .hw").count()) === 1, "「期限切れ」：1件");
  const endedCard = p.locator("#hw-list .hw").first();
  const ec = await endedCard.locator(".counts").innerText(); ok(ec.includes("期限切れ"), "期限をすぎた宿題：未達成（まったく取り組まず）は「期限切れ○人」に入る");
  await p.click('#l-show button[data-show="closed"]'); ok((await p.locator("#hw-list .hw.closed").count()) === 1, "「締めた」：1件（うすく表示）");
  await p.click('#l-show button[data-show="open"]');
  // 詳細
  await p.locator("#hw-list .hw", { hasText: "加法（足し算） 15問" }).click(); await p.waitForSelector("#d-rows");
  const hw2 = [...mock.db.hws.values()].find((h) => h.title === "加法（足し算） 15問");
  const rows = await p.locator("#d-rows .srow:not(.hd)").count(); eq(rows, 32, "詳細：生徒 32人の行");
  const kinds = await p.locator("#d-rows .srow:not(.hd)").evaluateAll((els) => els.map((e) => e.dataset.kind));
  const stu = mock.db.classes.get(hw2.class_id).studentIds.map((i) => mock.db.students.get(i));
  eq(kinds, stu.map((s) => expectKind(hw2, s)), "詳細：各生徒の ○/△/× が、基準の計算と同じ");
  const firstDone = stu.findIndex((s) => progress(hw2, s.state, NOW).done);
  const rowEl = p.locator("#d-rows .srow:not(.hd)").nth(firstDone);
  const rp = progress(hw2, stu[firstDone].state, NOW);
  ok((await rowEl.innerText()).includes("達成") && (await rowEl.innerText()).includes(`${rp.count}/15問`), "詳細：達成の行に「達成」の しるしと、解いた問・正解");
  ok((await rowEl.innerText()).includes(`${Number(rp.doneAt.slice(5, 7))}/${Number(rp.doneAt.slice(8, 10))}`), "詳細：達成日（日本時間）");
  ok((await text(p, "#d-tiles")).includes("達成"), "詳細：達成・一部・まだ・達成率のタイル");
  await p.selectOption("#d-sort", "low"); const pcts = await p.locator("#d-rows .srow:not(.hd) .pg b").allInnerTexts(); const nums = pcts.map((x) => parseInt(x)); ok(nums.every((v, i) => i === 0 || nums[i - 1] <= v), "詳細：進みの少ない順に並べかえられる");
  await p.selectOption("#d-sort", "no");
  await shot(p, "detail-pc");
  await p.click("#back"); await p.waitForSelector("#hw-list");
  // マス目
  await p.click("#tab-grid"); await p.waitForSelector("#grid-table");
  const hwsA = [...mock.db.hws.values()].filter((h) => !h.closed && (h.class_id === IDS.classA || (!h.class_id && h.user_ids.some((i) => mock.db.students.get(i).classId === IDS.classA)))).sort((a, b) => (a.start_date > b.start_date ? 1 : a.start_date < b.start_date ? -1 : a.created_at > b.created_at ? 1 : -1));
  eq(await p.locator("#grid-table thead tr.r1 .hh").count(), hwsA.length, `マス目：宿題の列（${hwsA.length}列・古い順）`);
  const heads = await p.locator(".hh").evaluateAll((els) => els.map((e) => e.title));
  ok(heads.length === hwsA.length && heads.every((h, i) => h.startsWith(hwsA[i].title + "（")), "マス目：列の順は 開始日の古い順", heads.join(" | "));
  const stA = mock.db.classes.get(IDS.classA).studentIds.map((i) => mock.db.students.get(i));
  eq(await p.locator("#grid-table tbody tr").count(), 32, "マス目：生徒 32行");
  const nos = await p.locator("#grid-table tbody tr .sc1").allInnerTexts(); eq(nos.map(Number), stA.map((s) => s.no), "マス目：出席番号の順");
  // 全マスの色
  const cellsDom = await p.locator("#grid-table tbody tr").evaluateAll((trs) => trs.map((tr) => [...tr.querySelectorAll("td.cc")].map((td) => { const b = td.querySelector("button.cell"); return b ? b.dataset.kind : "na"; })));
  const wantCells = stA.map((s) => hwsA.map((h) => (h.class_id || h.user_ids.includes(s.id) ? expectKind(h, s) : "na")));
  eq(cellsDom, wantCells, `マス目：全${cellsDom.flat().length}マスの色が、基準の計算と同じ（達成・一部・まだ・期間前・対象外）`);
  const flat = new Set(cellsDom.flat()); ok(["done", "partial", "none", "upcoming", "na"].every((k) => flat.has(k)), "マス目：5種類の色が、すべて出ている");
  const colors = await p.evaluate(() => Object.fromEntries(["done", "partial", "none", "upcoming"].map((k) => [k, getComputedStyle(document.querySelector(`button.cell.s-${k}`)).backgroundColor])));
  ok(colors.done !== colors.partial && colors.partial !== colors.none && colors.upcoming === "rgb(255, 255, 255)", "色：達成（緑）・一部（黄）・まだ（赤）・期間前（白）", JSON.stringify(colors));
  const g = colors.done.match(/\d+/g).map(Number); const y = colors.partial.match(/\d+/g).map(Number); const r = colors.none.match(/\d+/g).map(Number);
  ok(g[1] > g[0] && y[0] > 200 && y[1] > 180 && y[2] < 180 && r[0] > r[1] + 40, "色の見た目：緑っぽい・黄っぽい・赤っぽい");
  // 達成率（列・行）
  const colRates = await p.locator("tr.r2 th.hc").allInnerTexts();
  const wantCol = hwsA.map((h) => { const ts = stA.filter((s) => h.class_id || h.user_ids.includes(s.id)); if (h.start_date > TODAY) return "―"; const d = ts.filter((s) => progress(h, s.state, NOW).done).length; return `${Math.round((d / ts.length) * 100)}%`; });
  eq(colRates, wantCol, "達成率（列ごと）が計算と同じ（期間前は ―）");
  const rowRates = await p.locator("#grid-table tbody tr td.rt").allInnerTexts();
  const wantRow = stA.map((s) => { let d = 0, a = 0; for (const h of hwsA) { if (!(h.class_id || h.user_ids.includes(s.id)) || h.start_date > TODAY) continue; a++; if (progress(h, s.state, NOW).done) d++; } return a ? `${Math.round((d / a) * 100)}%` : "―"; });
  eq(rowRates, wantRow, "達成率（行ごと）が計算と同じ");
  ok((await text(p, "#legend")).includes("達成") && (await text(p, "#legend")).includes("期間前"), "凡例が出る");
  // マスをタップ → その生徒の詳細
  const firstDoneCell = p.locator('button.cell[data-kind="done"]').first();
  await firstDoneCell.click(); await p.waitForSelector(".k-modal #cm-detail dl");
  const mt = await text(p, ".k-modal");
  ok(/解いた問題/.test(mt) && /学習時間/.test(mt) && /達成日/.test(mt) && /\d+問/.test(mt), "マスをタップ：○問・○分・達成日の詳細");
  await shot(p, "grid-cell-modal-pc", false);
  await p.keyboard.press("Escape"); await p.waitForSelector(".k-modal", { state: "detached" }); ok(true, "Escape で とじる");
  // 列の見出し → その宿題の詳細へ
  await p.locator(".hh").nth(1).click(); await waitHash(p, /#hw\//); ok(true, "列の見出しをタップ：その宿題の詳細へ");
  // 新しい宿題が、列として増える（画面から出す）
  await p.click("#tab-new"); await p.waitForSelector("#hwform"); await p.fill("#f-min", "5"); await p.click("#f-submit"); await waitHash(p, /#list/);
  await p.click("#tab-grid"); await p.waitForSelector("#grid-table");
  eq(await p.locator("#grid-table thead tr.r1 .hh").count(), hwsA.length + 1, "画面から出した宿題が、マス目に 1列ふえる");
  noErrs(p, "一覧・詳細・マス目"); await closePage(p);
  await env.close();
});

// ══════════════════ 5. 締める・再開・削除 ══════════════════
await section("締める・再開・削除（確認ダイアログ・取り消し・消せない場合）", async () => {
  const env = await makeEnv({ homework: true });
  const { mock } = env;
  const target = [...mock.db.hws.values()].find((h) => h.title === "20分 学習");
  const p = await openPage(env, { hash: `#hw/${target.id}` }); await p.waitForSelector("#d-rows");
  // やめる
  await p.click("#d-close"); await p.waitForSelector(".k-modal"); ok((await text(p, ".k-modal")).includes("生徒の画面から消えます"), "締める：確認のダイアログ");
  await p.locator(".k-modal [data-m-btn]").first().click(); await p.waitForSelector(".k-modal", { state: "detached" });
  ok(!mock.calls.some((c) => c.name === "hw_t_close") && !target.closed, "「やめる」：何も変わらない");
  // 締める
  await p.click("#d-close"); await p.locator(".k-modal [data-m-btn]").last().click();
  await p.waitForFunction(() => document.querySelector("#d-close") && document.querySelector("#d-close").textContent.includes("再開"));
  const cc = mock.calls.filter((c) => c.name === "hw_t_close").at(-1);
  eq([cc.args.p_id, cc.args.p_closed, Object.keys(cc.args)], [target.id, true, ["p_token", "p_id", "p_closed"]], "hw_t_close(p_closed=true)");
  ok(target.closed && (await text(p, "#d-title")).includes("締めた"), "締めた：詳細に「締めた」と出る");
  await p.click("#back"); await p.waitForSelector("#hw-list");
  ok((await p.locator("#hw-list .hw", { hasText: "20分 学習" }).count()) === 0, "締めた宿題は、「出している」から消える");
  await p.click('#l-show button[data-show="closed"]'); ok((await p.locator("#hw-list .hw.closed").count()) === 2, "「締めた」に 2件");
  // 再開
  await p.locator("#hw-list .hw", { hasText: "20分 学習" }).click(); await p.waitForSelector("#d-rows");
  await p.click("#d-close"); await p.locator(".k-modal [data-m-btn]").last().click();
  await p.waitForFunction(() => document.querySelector("#d-close").textContent.includes("締める"));
  ok(!target.closed && mock.calls.filter((c) => c.name === "hw_t_close").at(-1).args.p_closed === false, "再開：hw_t_close(p_closed=false)・元にもどる");
  // 消す：出したばかり（1日以内）→ 消せる
  const fresh = [...mock.db.hws.values()].find((h) => h.title === "個人宛て：正負の意味・大小 5問");
  await p.goto(p.url().split("#")[0] + `#hw/${fresh.id}`); await p.waitForSelector("#d-rows");
  await p.click("#d-del"); await p.waitForSelector(".k-modal"); ok((await text(p, ".k-modal")).includes("元にもどせません"), "消す：確認のダイアログ");
  await p.locator(".k-modal [data-m-btn]").last().click(); await waitHash(p, /#list/);
  ok(!mock.db.hws.has(fresh.id), "消した（hw_t_delete）：出したばかりの宿題は消せる");
  // 消せない（古くて、取り組みがある）
  const old = [...mock.db.hws.values()].find((h) => h.title === "正負の意味・大小 10問");
  await p.goto(p.url().split("#")[0] + `#hw/${old.id}`); await p.waitForSelector("#d-rows");
  await p.click("#d-del"); await p.locator(".k-modal [data-m-btn]").last().click();
  await p.waitForSelector("#act-err:not([hidden])"); ok((await text(p, "#act-err")).includes("もう消せません") && mock.db.hws.has(old.id), "古くて取り組みのある宿題：消せない → 「締める」を案内");
  // 権限：担当外の宿題・存在しない宿題
  await p.goto(p.url().split("#")[0] + `#hw/${uuid(777777)}`); await p.waitForSelector("#view-err"); ok((await text(p, "#view-err")).includes("見つかりません"), "存在しない宿題：「見つかりません」");
  noErrs(p, "締める・再開・削除"); await closePage(p);
  // 別の先生（t2：クラスCだけ）は、A・Bの宿題を見られない
  const q = await openPage(env, { login: "t2", hash: `#hw/${target.id}` }); await q.waitForSelector("#view-err");
  ok((await text(q, "#view-err")).includes("できません"), "担当外の宿題を直接ひらく：forbidden の案内"); noErrs(q, "担当外"); await closePage(q);
  await env.close();
});

// ══════════════════ 6. クラスの切りかえ・権限（サーバー側）══════════════════
await section("クラスの切りかえ（一覧・マス目）・権限", async () => {
  const env = await makeEnv({ homework: true });
  const p = await openPage(env, { login: "admin" }); await ready(p);
  await p.waitForSelector("#hw-list .hw");
  const n0 = await p.locator("#hw-list .hw").count();
  await p.selectOption("#l-class", IDS.classB); await p.waitForFunction((n) => document.querySelectorAll("#hw-list .hw").length !== n, n0);
  const onlyB = await p.locator("#hw-list .hw .meta .k-chip:first-child").allInnerTexts(); ok(onlyB.length >= 1 && onlyB.every((t) => t.includes("中1 B組")), "一覧：クラス B だけにしぼれる");
  ok(env.mock.calls.filter((c) => c.name === "hw_t_list").at(-1).args.p_class === IDS.classB, "一覧：hw_t_list に p_class を渡す");
  await p.selectOption("#l-class", ""); await p.click("#tab-grid"); await p.waitForSelector("#grid-table");
  eq(await p.locator("#grid-table tbody tr").count(), 32, "マス目：最初のクラスは A（32人）");
  const opts = await p.locator("#g-class option").allInnerTexts(); ok(opts.length === 3 && opts.includes("中2 A組"), "管理者：学校のクラス 3つが選べる（ほかの学校は出ない）");
  await p.selectOption("#g-class", IDS.classB); await p.waitForFunction(() => document.querySelectorAll("#grid-table tbody tr").length === 40);
  ok((await hashOf(p)).includes(IDS.classB), "クラスをかえる：URL のハッシュに入る（共有できる）");
  const hB = await p.locator(".hh").count(); ok(hB === 1, `クラス B のマス目：${hB}列（締めた宿題は、マス目に出さない）`);
  await p.click("#tab-list"); await p.click("#tab-grid"); await p.waitForSelector("#grid-table");
  eq(await p.locator("#grid-table tbody tr").count(), 40, "タブをもどっても、えらんだクラスをおぼえている");
  await p.selectOption("#g-class", IDS.classC); await p.waitForSelector("#empty-grid"); ok(true, "宿題のないクラス C：空の案内");
  noErrs(p, "クラスの切りかえ"); await closePage(p);
  // 先生 t1 は、ほかの学校のクラス・担当外クラスの RPC が forbidden
  const call = async (name, args) => (await (await fetch(`http://127.0.0.1:${env.port}/rpc/${name}`, { method: "POST", headers: { "Content-Type": "application/json", "Content-Profile": "kotsu", apikey: "k", Authorization: "Bearer k" }, body: JSON.stringify(args) })).json());
  eq((await call("hw_t_grid", { p_token: "tok-t1", p_class: IDS.classX })).error, "forbidden", "権限：ほかの学校のクラス → forbidden（grid）");
  eq((await call("hw_t_grid", { p_token: "tok-t1", p_class: IDS.classC })).error, "forbidden", "権限：担当外のクラス → forbidden（grid）");
  eq((await call("hw_t_list", { p_token: "tok-t1", p_class: IDS.classC })).error, "forbidden", "権限：担当外のクラス → forbidden（list）");
  eq((await call("hw_t_create", { p_token: "tok-t1", p_class: IDS.classX, p_users: null, p_title: "x", p_unit: null, p_n: null, p_min: 5, p_start: TODAY, p_due: TODAY, p_note: null })).error, "forbidden", "権限：ほかの学校のクラスには出せない（create）");
  eq((await call("hw_t_create", { p_token: "tok-admin", p_class: IDS.classC, p_users: null, p_title: "x", p_unit: null, p_n: null, p_min: 5, p_start: TODAY, p_due: TODAY, p_note: null })).ok, true, "権限：管理者は、学校のどのクラスにも出せる");
  eq((await call("hw_t_list", { p_token: "bad" })).error, "auth", "権限：トークンが無効 → auth");
  // 契約の bad_args（サーバー側の検証）
  const base = { p_token: "tok-t1", p_class: IDS.classA, p_users: null, p_title: "", p_unit: null, p_n: null, p_min: 5, p_start: TODAY, p_due: TODAY, p_note: null };
  for (const [name, patch] of [["単元なしの N問", { p_n: 5 }], ["単元ありで N なし", { p_unit: "J1-u1" }], ["N も M も無い", { p_min: null }], ["N が 201", { p_unit: "J1-u1", p_n: 201 }], ["M が 241", { p_min: 241 }], ["期限が開始より前", { p_due: day(-3) }], ["クラスも個人も無い", { p_class: null }]])
    eq((await call("hw_t_create", { ...base, ...patch })).error, "bad_args", `契約：${name} → bad_args（模擬）`);
  await env.close();
});

// ══════════════════ 7. 検算データ全件を、画面で確かめる ══════════════════
await section("検算データ（vectors.json）全件：画面の進み具合が expect と同じ", async () => {
  for (const [i, v] of vectors.entries()) {
    const env = await makeEnv({ demo: false });
    const { mock } = env; mock.setNow(v.nowMs);
    mock.addStaff("tok-t1", { id: uuid(901), login: "tanaka", nick: "田中先生", classIds: [IDS.classA] });
    mock.addClass({ id: IDS.classA, name: "検算クラス" });
    const s = mock.addStudent({ classId: IDS.classA, no: 1, nick: "けんさん", state: JSON.parse(JSON.stringify(v.state)) });
    const hw = mock.addHomework({ class_id: IDS.classA, title: `検算${i + 1}`, ...v.hw, created_at: new Date(v.nowMs).toISOString() });
    const p = await openPage(env, { hash: `#hw/${hw.id}`, now: v.nowMs }); await p.waitForSelector("#d-rows .srow:not(.hd)");
    const row = p.locator("#d-rows .srow:not(.hd)").first(); const e = v.expect;
    const kind = e.phase === "upcoming" ? "upcoming" : e.status;
    const got = { kind: await row.getAttribute("data-kind"), pct: parseInt(await row.locator(".pg b").innerText()), q: await row.locator(".q").innerText(), tm: await row.locator(".tm").innerText(), dn: await row.locator(".dn").innerText() };
    const wantQ = v.hw.n != null ? `${e.count}/${v.hw.n}問` : v.hw.unit_id ? `${e.count}問` : "―";
    const wantTm = v.hw.min != null ? `${Math.round(e.sec / 60)}/${v.hw.min}分` : `${Math.round(e.sec / 60)}分`;
    const wantDn = e.doneAt ? `${Number(e.doneAt.slice(5, 7))}/${Number(e.doneAt.slice(8, 10))}` : "―";
    const good = got.kind === kind && got.pct === Math.round(e.pct * 100) && got.q.includes(wantQ) && got.tm.includes(wantTm) && got.dn.includes(wantDn);
    ok(good, `検算 ${i + 1}/${vectors.length}：${v.name}`, JSON.stringify({ got, kind, pct: Math.round(e.pct * 100), wantQ, wantTm, wantDn }));
    noErrs(p, `検算${i + 1}`); await closePage(p); await env.close();
  }
});

// ══════════════════ 8. 40人×30件のマス目：速さ・スマホでのスクロール ══════════════════
await section("40人 × 30件のマス目：表示の速さ・スマホ幅でのスクロール・固定の列", async () => {
  const env = await makeEnv({ homework: false });
  const { mock } = env;
  const cid = uuid(5000); mock.addClass({ id: cid, name: "大きいクラス" }); mock.db.staff.get("tok-t1").classIds.push(cid);
  for (let i = 0; i < 40; i++) mock.addStudent({ classId: cid, no: i + 1, nick: i === 6 ? "ながいニックネームのこ" : `せいと${i + 1}` });
  const units = ["J1-u1", "J1-u2", "J1-u3", "J1-v1", "J1-v2", "J1-e1"];
  for (let k = 0; k < 30; k++) {
    const st = -60 + k * 2, due = st + 3;
    const withUnit = k % 3 !== 2;
    mock.addHomework({ class_id: cid, title: withUnit ? `${["正負の数", "加法", "減法", "文字式", "代入", "方程式"][k % 6]}の練習 ${10 + (k % 4) * 5}問` : `${10 + (k % 3) * 5}分 学習`, unit_id: withUnit ? units[k % 6] : null, n: withUnit ? 10 + (k % 4) * 5 : null, min: withUnit ? null : 10 + (k % 3) * 5, start_date: day(st), due_date: day(due), created_at: new Date(NOW + st * DAY).toISOString() }, { outcome: (s, i, r) => { const x = r(); return x < 0.5 ? "done" : x < 0.75 ? "partial" : "none"; }, seed: 100 + k });
  }
  // 画面から見て、いちばん新しい 3件は、これから
  mock.addHomework({ class_id: cid, title: "これからの宿題", unit_id: "J1-u1", n: 10, start_date: day(5), due_date: day(8), created_at: new Date(NOW).toISOString() }, { outcome: "skip" });
  const p = await openPage(env, { w: 360, h: 740, hash: `#grid/${cid}` });
  const t0 = Date.now(); await p.waitForSelector("#grid-table"); const dt = Date.now() - t0;
  const cells = await p.locator("button.cell").count(); eq(cells, 40 * 31, "マス目：40人 × 31列 = 1240マス");
  ok(dt < 3000, `表示まで ${dt}ms（3秒以内）`);
  const perf = await p.evaluate(() => new Promise((res) => { const t = performance.now(); document.querySelector("#tab-list").click(); setTimeout(() => { const t1 = performance.now(); document.querySelector("#tab-grid").click(); const ob = new MutationObserver(() => { if (document.querySelector("#grid-table") && document.querySelectorAll("button.cell").length > 1000) { ob.disconnect(); res(Math.round(performance.now() - t1)); } }); ob.observe(document.body, { childList: true, subtree: true }); }, 800); }));
  ok(perf < 2500, `タブを切りかえて、マス目が出るまで ${perf}ms`);
  await p.waitForSelector("#grid-table");
  const m = await p.evaluate(() => { const g = document.querySelector("#gw"); return { sw: g.scrollWidth, cw: g.clientWidth, sh: g.scrollHeight, ch: g.clientHeight, pageSW: document.documentElement.scrollWidth, W: document.documentElement.clientWidth }; });
  ok(m.sw > m.cw * 2, `スマホ幅（360）：表は横に長く、横スクロールできる（${m.sw}px / 窓 ${m.cw}px）`);
  ok(m.pageSW <= m.W, "スマホ幅：ページ全体は横にスクロールしない（表の中だけ）");
  ok(m.sh > m.ch, "縦にもスクロールできる（見出しは動かない）");
  // 固定の列（番号・ニックネーム）と、見出しの行
  const pos = async () => p.evaluate(() => { const g = document.querySelector("#gw").getBoundingClientRect(); const sc2 = document.querySelector("tbody tr:nth-child(10) .sc2").getBoundingClientRect(); const sc1 = document.querySelector("tbody tr:nth-child(10) .sc1").getBoundingClientRect(); const th = document.querySelector("thead tr.r1 .hh").getBoundingClientRect(); return { g: [g.left, g.top], sc1: sc1.left, sc2: sc2.left, th: th.top }; });
  const a = await pos();
  await p.evaluate(() => { const g = document.querySelector("#gw"); g.scrollLeft = 600; g.scrollTop = 200; }); await p.waitForTimeout(150);
  const b = await pos();
  ok(Math.abs(b.sc1 - a.sc1) < 1.5 && Math.abs(b.sc2 - a.sc2) < 1.5, "横にスクロールしても、番号とニックネームの列は動かない（固定）");
  ok(b.th >= b.g[1] - 1 && b.th <= b.g[1] + 4, "縦にスクロールしても、見出しの行は動かない（固定）");
  await shot(p, "grid-big-phone-scrolled", false);
  const ov = await overflowCheck(p); ok(ov.length === 0, "スマホ幅：はみ出し・重なりなし（マス目）", ov.join(" / "));
  // 先頭にもどして画像
  await p.evaluate(() => { const g = document.querySelector("#gw"); g.scrollLeft = 0; g.scrollTop = 0; }); await shot(p, "grid-big-phone", false);
  // 長いニックネームが、はみ出さない
  const longNick = await p.evaluate(() => { const el = document.querySelector("tbody tr:nth-child(7) .sc2"); const r = el.getBoundingClientRect(); return { w: r.width, sw: el.scrollWidth, cw: el.clientWidth }; });
  ok(longNick.w <= 80, "長いニックネームは「…」で切れる（列がのびない）", JSON.stringify(longNick));
  // マスをタップ（スマホ：下から出るシート）
  await p.evaluate(() => { document.querySelector("#gw").scrollLeft = 400; });
  await p.locator('button.cell[data-kind="done"]').nth(5).click(); await p.waitForSelector("#cm-detail dl");
  const sheet = await p.evaluate(() => { const r = document.querySelector(".k-modal").getBoundingClientRect(); return { l: r.left, r: r.right, b: r.bottom, H: innerHeight, W: innerWidth }; });
  ok(sheet.l >= -1 && sheet.r <= sheet.W + 1 && sheet.b <= sheet.H + 1, "スマホ：マスの詳細（シート）が画面に収まる");
  await shot(p, "grid-cell-sheet-phone", false);
  noErrs(p, "大きなマス目"); await closePage(p);
  // PC 幅
  const q = await openPage(env, { w: 1280, h: 900, hash: `#grid/${cid}` }); await q.waitForSelector("#grid-table");
  const pm = await q.evaluate(() => { const g = document.querySelector("#gw"); return { sw: g.scrollWidth, cw: g.clientWidth }; });
  ok(pm.sw > pm.cw, `PC 幅（1280）：30列は横にスクロール（${pm.sw}px / ${pm.cw}px）`);
  await shot(q, "grid-big-pc", false); noErrs(q, "大きなマス目PC"); await closePage(q);
  await env.close();
});

// ══════════════════ 8b. 文字のエスケープ（ニックネーム・題・ひとことに、HTML を入れられても動かない）══════════════════
await section("サーバーから来る文字は、HTML として動かない（XSS）", async () => {
  const env = await makeEnv();
  const bad = `<img src=x onerror="window.__xss=1">`;
  env.mock.addStudent({ classId: IDS.classA, no: 99, nick: bad, login: "evil" });
  const hw = env.mock.addHomework({ class_id: IDS.classA, title: `${bad}"'&amp;`, min: 5, start_date: day(-1), due_date: day(1), note: `<script>window.__xss=2</script>${bad}` }, { outcome: "done" });
  const p = await openPage(env); await p.waitForSelector("#hw-list .hw");
  await p.locator("#hw-list .hw").first().click(); await p.waitForSelector("#d-rows");
  await p.click("#tab-grid"); await p.waitForSelector("#grid-table");
  await p.locator('button.cell').last().click().catch(() => {});
  await p.waitForTimeout(300);
  await p.keyboard.press("Escape");
  await p.click("#tab-new"); await p.waitForSelector("#hwform"); await p.click('#f-target button[data-v="students"]'); await p.waitForSelector("#who-list");
  const xss = await p.evaluate(() => ({ flag: window.__xss, imgs: document.querySelectorAll('img[src="x"]').length, scripts: document.querySelectorAll("main script").length }));
  eq(xss, { flag: undefined, imgs: 0, scripts: 0 }, "HTML は動かない（img・script が入らない）");
  ok((await p.locator("#who-list").innerText()).includes("<img"), "ニックネームは、文字としてそのまま見える");
  await p.goto(`${PAGE}/index.html?server=mock:${env.port}#hw/${hw.id}`); await p.waitForSelector("#d-rows");
  ok((await text(p, "#d-title")).includes("<img") && (await text(p, "#d-note")).includes("<script>"), "題とひとことも、文字として見える");
  noErrs(p, "エスケープ"); await closePage(p); await env.close();
});

// ══════════════════ 9. 画面の画像（PC・スマホ幅）・はみ出し点検 ══════════════════
await section("画面の画像（PC 1280・スマホ 360）とはみ出し・重なりの点検", async () => {
  const env = await makeEnv({ homework: true });
  for (const [name, w, h] of [["pc", 1280, 900], ["phone", 360, 740]]) {
    const p = await openPage(env, { w, h, login: "t1" }); await p.waitForSelector("#hw-list .hw");
    const check = async (label) => { const ov = await overflowCheck(p); ok(ov.length === 0, `${name}：はみ出し・重なりなし（${label}）`, ov.join(" / ")); };
    await shot(p, `list-${name}`); await check("いまの宿題");
    await p.locator("#hw-list .hw").first().click(); await p.waitForSelector("#d-rows"); await shot(p, `detail-${name}`); await check("詳細");
    await p.click("#tab-grid"); await p.waitForSelector("#grid-table"); await shot(p, `grid-${name}`, false); await check("マス目");
    await p.locator('button.cell[data-kind="partial"]').first().click(); await p.waitForSelector("#cm-detail dl"); await shot(p, `cell-modal-${name}`, false); await check("マスの詳細"); await p.keyboard.press("Escape");
    await p.click("#tab-new"); await p.waitForSelector("#hwform");
    await p.click('#up-grades button[data-g="J1"]'); await p.click('#up-list button[data-u="J1-u2"]'); await p.fill("#f-min", "15"); await p.fill("#f-note", "ゆっくりでいいよ。まずは解説から。");
    await p.click('#f-target button[data-v="students"]'); await p.waitForSelector("#who-list"); await p.locator("#who-list input").nth(1).check(); await p.locator("#who-list input").nth(4).check();
    await shot(p, `new-filled-${name}`); await check("宿題を出す（入力ずみ）");
    await p.click('#f-target button[data-v="class"]'); await p.fill("#f-n", "0"); await p.click("#f-submit"); await p.waitForSelector("#f-errs:not([hidden])"); await shot(p, `new-errors-${name}`); await check("宿題を出す（入力エラー）");
    // 確認ダイアログ
    await p.goto(`${PAGE}/index.html?server=mock:${env.port}#hw/${[...env.mock.db.hws.values()][0].id}`); await p.waitForSelector("#d-rows");
    await p.click("#d-close"); await p.waitForSelector(".k-modal"); await shot(p, `confirm-${name}`, false); await check("確認ダイアログ"); await p.keyboard.press("Escape");
    noErrs(p, `画像 ${name}`); await closePage(p);
  }
  // ログインの案内（スマホ）
  const p = await openPage(env, { w: 360, h: 740, login: null }); await p.waitForSelector("#login-guide"); await shot(p, "login-none-phone", false);
  const ov = await overflowCheck(p); ok(ov.length === 0, "phone：はみ出しなし（ログインの案内）", ov.join(" / ")); await closePage(p);
  await env.close();
});

// ══════════════════ 10. 公開用コピー ══════════════════
await section("deploy.mjs：公開に必要なファイルだけをコピーする", async () => {
  const dest = join(mkdtempSync(join(tmpdir(), "hwdeploy-")), "homework");
  execFileSync("node", [join(here, "deploy.mjs"), dest], { stdio: "pipe" });
  const files = readdirSync(dest).sort();
  ok(["index.html", "style.css", "app.js", "api.js", "units.json"].every((f) => files.includes(f)), "index.html・style.css・app.js・api.js・units.json を含む", files.join(","));
  ok(!files.includes("README.md") && !files.includes("tools") && !files.includes("package.json"), "README.md・tools・package.json は含まない");
  // コピーしたものだけで動く（読みこまれる js・json が、全部ある）
  const need = new Set(); for (const f of files.filter((x) => /\.(js|html)$/.test(x))) for (const m of readFileSync(join(dest, f), "utf8").matchAll(/(?:from\s+|src=|href=|fetch\()\s*["']\.?\/?([\w.-]+\.(?:js|css|json))["']/g)) need.add(m[1]);
  ok([...need].every((f) => files.includes(f)), `読みこまれるファイルが全部そろっている（${[...need].join("・")}）`);
  // 公開のとおりの場所にコピーしたものを、模擬のサーバーにつないで動かす
  const env = await makeEnv({ homework: true });
  const srv2 = createServer((req, res) => { let p = decodeURIComponent(req.url.split("?")[0]); if (p === "/") p = "/index.html"; const fp = join(dest, p); if (!fp.startsWith(dest) || !existsSync(fp)) { res.writeHead(404); return res.end("no"); } res.writeHead(200, { "Content-Type": MIME[extname(fp)] || "application/octet-stream" }); res.end(readFileSync(fp)); });
  await new Promise((r) => srv2.listen(0, "127.0.0.1", r));
  const ctx = await browser.newContext({ viewport: { width: 1000, height: 800 } });
  await ctx.addInitScript(([k, v]) => localStorage.setItem(k, v), ["kotsu-staff-v1", JSON.stringify({ ...LOGINS.t1, keep: true, server: `http://127.0.0.1:${env.port}` })]);
  const pg = await ctx.newPage(); const errs = []; pg.on("pageerror", (e) => errs.push(String(e))); pg.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  await pg.goto(`http://127.0.0.1:${srv2.address().port}/index.html?server=mock:${env.port}`);
  await pg.waitForSelector("#hw-list .hw", { timeout: 8000 }); ok(errs.length === 0, "コピーしたものだけで、一覧まで動く（コンソールのエラーなし）", errs.join("/"));
  await ctx.close(); srv2.close(); await env.close();
});

// ══════════════════ まとめ ══════════════════
ok(allErrors.length === 0, "全部の画面で、コンソールのエラー（予期しないもの）はゼロ", allErrors.slice(0, 5).join(" / "));
await browser.close(); pageSrv.close();
console.log(`\n結果：${pass} 件 OK ／ ${fail} 件 NG　（画像：${OUT}）`);
if (fail) { console.log("NG の一覧：\n  - " + fails.join("\n  - ")); process.exit(1); }
