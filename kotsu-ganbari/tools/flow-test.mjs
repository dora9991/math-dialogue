// 動画ページ全体の動作確認：一覧→動画→最後まで再生→「つぎ」。時計を進めて確かめる。
import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, extname } from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = process.argv[2] || "/tmp";
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
const res = {};
for (const [name, vp] of [["pc", { width: 1100, height: 900 }], ["phone", { width: 390, height: 800 }]]) {
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 1 });
  const p = await ctx.newPage(); const errs = [];
  p.on("pageerror", (e) => errs.push(String(e))); p.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  await p.clock.install();
  await p.goto(`${base}/`, { waitUntil: "networkidle" });
  const cards = await p.locator(".card").count(), waits = await p.locator(".card.wait").count();
  await p.screenshot({ path: `${out}/flow-${name}-list.png`, fullPage: false });
  await p.locator('.card[data-n="9"]').click();
  await p.waitForSelector(".pl-root .fig");
  const t0 = await p.evaluate(() => ({ title: document.getElementById("ov-title").textContent, dots: document.querySelectorAll(".dt").length, hash: location.hash }));
  await p.clock.runFor(20000);
  const mid = await p.evaluate(() => ({ on: [...document.querySelectorAll(".dt")].findIndex((d) => d.classList.contains("on")) }));
  await p.screenshot({ path: `${out}/flow-${name}-mid.png`, fullPage: false });
  await p.clock.runFor(120000);
  const end = await p.evaluate(() => ({ on: [...document.querySelectorAll(".dt")].findIndex((d) => d.classList.contains("on")), nextBox: !document.getElementById("ov-next-box").hidden, ans: !document.querySelector(".ans").hidden, seen: localStorage.getItem("ganbari-seen-v1") }));
  await p.screenshot({ path: `${out}/flow-${name}-end.png`, fullPage: false });
  await p.getByText(/つぎ：問/).click();
  await p.waitForFunction(() => document.getElementById("ov-title").textContent.startsWith("問10"));
  const nxt = await p.evaluate(() => document.getElementById("ov-title").textContent);
  await p.locator("#ov-close").click();
  await p.waitForFunction(() => document.getElementById("overlay").hidden);
  const seenCards = await p.locator(".card.seen").count();
  res[name] = { cards, waits, t0, mid, end, nxt, seenCards, errs };
  await ctx.close();
}
await b.close(); srv.close();
console.log(JSON.stringify(res, null, 1));
