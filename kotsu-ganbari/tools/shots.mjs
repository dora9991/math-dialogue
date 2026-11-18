// 使い方: node tools/shots.mjs 9 [27 …] [--out 出力フォルダ] [--w 1000] [--h 1000]
// 各コマの最後の姿をPNGにして、1枚の一覧（sheet）にもする。エラーも表示する。
import { createServer } from "node:http";
import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, extname } from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const here = dirname(fileURLToPath(import.meta.url)), root = join(here, "..");
const args = process.argv.slice(2), nums = [];
let out = join(root, "..", ".shots"), W = 1000, Hh = 1100;
for (let i = 0; i < args.length; i++) { if (args[i] === "--out") out = args[++i]; else if (args[i] === "--w") W = +args[++i]; else if (args[i] === "--h") Hh = +args[++i]; else if (+args[i]) nums.push(+args[i]); }
mkdirSync(out, { recursive: true });
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json" };
const srv = createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]); if (p === "/") p = "/index.html";
  const fp = join(root, p);
  if (!fp.startsWith(root) || !existsSync(fp)) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, { "Content-Type": MIME[extname(fp)] || "application/octet-stream", "Cache-Control": "no-store" }); res.end(readFileSync(fp));
});
await new Promise((r) => srv.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${srv.address().port}`;
const b = await chromium.launch();
let bad = 0;
for (const n of nums) {
  const ctx = await b.newContext({ viewport: { width: W, height: Hh }, deviceScaleFactor: 1 });
  const p = await ctx.newPage(); const errs = [];
  p.on("pageerror", (e) => errs.push(String(e))); p.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  await p.goto(`${base}/?still#${n}`, { waitUntil: "networkidle" });
  await p.waitForFunction(() => window.__player, null, { timeout: 8000 }).catch(() => errs.push("プレイヤーが開きません（q/q" + String(n).padStart(2, "0") + ".js と manifest.json を確認）"));
  const count = await p.evaluate(() => (window.__player ? window.__player.count : 0));
  const files = [];
  for (let i = 0; i < count; i++) {
    try { await p.evaluate((i) => window.__player.show(i, false), i); } catch (e) { errs.push(`コマ${i}：${e.message}`); }
    const f = join(out, `q${String(n).padStart(2, "0")}-s${String(i).padStart(2, "0")}.png`);
    await p.locator(".ov-body").screenshot({ path: f }); files.push(f);
  }
  if (files.length) execFileSync("python3", [join(here, "sheet.py"), join(out, `q${String(n).padStart(2, "0")}-sheet.png`), ...files]);
  console.log(`問${n}：${count}コマ → ${join(out, `q${String(n).padStart(2, "0")}-sheet.png`)}${errs.length ? "\n  ✖ " + [...new Set(errs)].join("\n  ✖ ") : ""}`);
  if (errs.length) bad++;
  await ctx.close();
}
await b.close(); srv.close();
process.exit(bad ? 1 : 0);
