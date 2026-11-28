// 動画を見た時間が、学習時間（daily.sec）に入ることの確認（時計を進めて）
import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, extname } from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json" };
const srv = createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]); if (p.endsWith("/")) p += "index.html";
  const fp = join(root, p);
  if (!fp.startsWith(root) || !existsSync(fp)) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, { "Content-Type": MIME[extname(fp)] || "application/octet-stream", "Cache-Control": "no-store" }); res.end(readFileSync(fp));
});
await new Promise((r) => srv.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${srv.address().port}`;
const b = await chromium.launch();
const DAY = "2026-11-20";
const state = { v: 1, profile: { name: "テスト", grade: "J1", goal: { tier: "std" } }, units: {}, daily: { [DAY]: { n: 3, c: 2, xp: 30, sec: 100 } }, totals: { n: 3, c: 2, xp: 30, hi3: 0, hi4: 0 }, log: [] };
let pass = 0, fail = 0;
const ok = (c, m) => { c ? pass++ : fail++; console.log(`${c ? "PASS" : "FAIL"}  ${m}`); };

async function setup({ credit = null, withState = true } = {}) {
  const ctx = await b.newContext({ viewport: { width: 1000, height: 900 }, timezoneId: "Asia/Tokyo" });
  const p = await ctx.newPage(); const errs = [];
  p.on("pageerror", (e) => errs.push(String(e)));
  await p.clock.install({ time: new Date(`${DAY}T10:00:00+09:00`) });
  await p.addInitScript(([st, cr, ws]) => { if (sessionStorage.getItem("i")) return; sessionStorage.setItem("i", "1"); if (ws) localStorage.setItem("mathlab-solo-v1", JSON.stringify(st)); if (cr) localStorage.setItem("kotsu-time-credit-v1", JSON.stringify(cr)); }, [state, credit, withState]);
  await p.goto(`${base}/`, { waitUntil: "networkidle" });
  return { ctx, p, errs };
}
const read = (p) => p.evaluate((D) => ({ sec: (JSON.parse(localStorage.getItem("mathlab-solo-v1") || "null") || {}).daily?.[D]?.sec, n: (JSON.parse(localStorage.getItem("mathlab-solo-v1") || "null") || {}).daily?.[D]?.n, cr: JSON.parse(localStorage.getItem("kotsu-time-credit-v1") || "null") }), DAY);

{ // 1) 再生して最後まで見る → 動画の長さぶん（約51秒）が入る。問題数は変わらない
  const { ctx, p, errs } = await setup();
  await p.locator('.card[data-n="9"]').click(); await p.waitForSelector(".pl-root .fig");
  await p.clock.runFor(70000);
  await p.locator("#ov-close").click(); await p.clock.runFor(2000);
  const r = await read(p);
  ok(r.sec >= 100 + 45 && r.sec <= 100 + 60, `最後まで見る：学習時間が 100 → ${r.sec}（+45〜60秒）`);
  ok(r.n === 3, `解いた問題数は変わらない（${r.n}）`);
  ok(r.cr && r.cr.d === DAY && r.cr.s.vid >= 45 && r.cr.s.vid <= 60 && r.cr.v["9"] === r.cr.s.vid, `上限の入れ物に vid=${r.cr && r.cr.s.vid}、問9=${r.cr && r.cr.v["9"]}`);
  ok(errs.length === 0, `エラーなし ${errs.join("|")}`);
  // 2) くり返して見ても、問9は 2×長さ（約102秒）まで
  await p.locator('.card[data-n="9"]').click(); await p.waitForSelector(".pl-root .fig");
  for (let i = 0; i < 4; i++) { await p.clock.runFor(70000); if (await p.locator("#ov-next-box button", { hasText: "もういちど" }).count()) await p.locator("#ov-next-box button", { hasText: "もういちど" }).click(); }
  await p.locator("#ov-close").click(); await p.clock.runFor(2000);
  const r2 = await read(p);
  ok(r2.cr.v["9"] <= 103 && r2.cr.v["9"] >= 95, `くり返しても問9は上限まで（${r2.cr.v["9"]}秒 ≦ 約102）`);
  ok(r2.sec - 100 <= 103, `学習時間の増分も上限どおり（+${r2.sec - 100}）`);
  await ctx.close();
}
{ // 3) 全体の上限（90分）：ほかで 5380秒 使っていたら、動画は 20秒ぶんまで
  const { ctx, p } = await setup({ credit: { d: DAY, s: { nav: 3000, les: 2380 }, at: 0 } });
  await p.locator('.card[data-n="27"]').click(); await p.waitForSelector(".pl-root .fig");
  await p.clock.runFor(100000);
  await p.locator("#ov-close").click(); await p.clock.runFor(2000);
  const r = await read(p);
  ok(r.cr.s.vid <= 21 && r.cr.s.vid >= 18, `全体の上限：vid=${r.cr.s.vid}（残り20秒）`);
  await ctx.close();
}
{ // 4) 画面が見えていない間は数えない。一時停止して放置→45秒まで
  const { ctx, p } = await setup();
  await p.locator('.card[data-n="9"]').click(); await p.waitForSelector(".pl-root .fig");
  await p.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, get: () => true }); document.dispatchEvent(new Event("visibilitychange")); });
  await p.clock.runFor(30000);
  let r = await read(p);
  ok((r.cr ? r.cr.s.vid || 0 : 0) <= 3, `非表示の30秒は数えない（vid=${r.cr ? r.cr.s.vid || 0 : 0}）`);
  await p.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, get: () => false }); document.dispatchEvent(new Event("visibilitychange")); });
  await p.locator(".cbtn.play").click();  // 一時停止
  await p.clock.runFor(120000);
  await p.locator("#ov-close").click(); await p.clock.runFor(2000);
  r = await read(p);
  ok(r.cr.s.vid >= 40 && r.cr.s.vid <= 52, `一時停止して放置→最後の操作から45秒まで（vid=${r.cr.s.vid}）`);
  await ctx.close();
}
{ // 5) 学習の記録が無い（ログインなし）：何も書かない・エラーなし
  const { ctx, p, errs } = await setup({ withState: false });
  await p.locator('.card[data-n="9"]').click(); await p.waitForSelector(".pl-root .fig");
  await p.clock.runFor(60000);
  await p.locator("#ov-close").click(); await p.clock.runFor(2000);
  const st = await p.evaluate(() => localStorage.getItem("mathlab-solo-v1"));
  ok(st === null, "記録が無いときは、記録を作らない");
  ok(errs.length === 0, `エラーなし ${errs.join("|")}`);
  ok(await p.locator("#today").isHidden(), "「今日 ○分」は出ない");
  await ctx.close();
}
await b.close(); srv.close();
console.log(`\n${pass} PASS / ${fail} FAIL`);
process.exit(fail ? 1 : 0);
