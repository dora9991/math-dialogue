// 使い方: node tools/make-units.mjs <公開中アプリの assets フォルダ> [出力ファイル（既定 ../units.json）] [--file summary-XXXX.js]
//   例: node tools/make-units.mjs /path/to/gh-pages/assets
// assets に古いビルドの summary-*.js が残っているときは、solo/index.html（assets の一つ上）が読んでいるものを使う。--file で指定もできる。
// 公開中のアプリ（ビルド済み JS）が持っている単元の一覧を、Chromium で import して取り出し、units.json にする。
// 取り出すもの（出力名はビルドごとに変わるので、名前ではなく「形」で見つける）：
//   ・学年の名前   { E1:"小1", … H3:"高3" }
//   ・章の一覧     { J1:[{name, units:[{id,name,…}]}], … }   （小・中。高は章なし）
//   ・単元の一覧   [{id, grade, name, maxLevel, …}]            （全学年）
// 単元の id は、生徒の学習記録（log）の u と同じ形（例 J1-u1）。
import { createServer } from "node:http";
import { readFileSync, readdirSync, writeFileSync, existsSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, extname, resolve } from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const here = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const fi = argv.indexOf("--file"); const fileArg = fi >= 0 ? argv.splice(fi, 2)[1] : null;
const assets = resolve(argv[0] || "");
const out = resolve(argv[1] || join(here, "..", "units.json"));
if (!argv[0] || !existsSync(assets) || !statSync(assets).isDirectory()) { console.error("assets フォルダを指定してください（summary-*.js があるところ）"); process.exit(1); }
// 単元の一覧をもつファイルをさがす（summary-*.js。なければ「maxLevel」と「小1」をふくむ js）
const files = readdirSync(assets).filter((f) => f.endsWith(".js"));
let cand = files.filter((f) => /^summary-/.test(f));
if (fileArg) cand = [fileArg];
else if (cand.length > 1) {   // 公開中のページが読んでいるものを先に
  const used = new Set();
  for (const h of ["solo/index.html", "index.html"]) { const fp = join(assets, "..", h); if (existsSync(fp)) for (const m of readFileSync(fp, "utf8").matchAll(/summary-[\w-]+\.js/g)) used.add(m[0]); }
  cand = [...cand.filter((f) => used.has(f)), ...cand.filter((f) => !used.has(f)).sort((a, b) => statSync(join(assets, b)).mtimeMs - statSync(join(assets, a)).mtimeMs)];
}
if (!cand.length) cand = files.filter((f) => { const t = readFileSync(join(assets, f), "utf8"); return t.includes("maxLevel") && t.includes("小1"); });
if (!cand.length) { console.error("単元の一覧をもつ js が見つかりません"); process.exit(1); }
const MIME = { ".js": "text/javascript", ".html": "text/html", ".json": "application/json" };
const srv = createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p === "/") { res.writeHead(200, { "Content-Type": "text/html" }); res.end("<!doctype html><title>x</title>"); return; }
  const fp = join(assets, p);
  if (!fp.startsWith(assets) || !existsSync(fp)) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, { "Content-Type": MIME[extname(fp)] || "application/octet-stream" }); res.end(readFileSync(fp));
});
await new Promise((r) => srv.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${srv.address().port}`;
const b = await chromium.launch();
const page = await b.newPage();
const errs = [];
page.on("pageerror", (e) => errs.push(String(e)));
await page.goto(base + "/");
let raw = null, used = null;
for (const f of cand) {
  raw = await page.evaluate(async (url) => {
    const m = await import(url);
    let names = null, chapters = null, units = null;
    for (const [k, v] of Object.entries(m)) {
      if (v && typeof v === "object" && !Array.isArray(v)) {
        const keys = Object.keys(v);
        if (!names && v.E1 === "小1" && v.J1 === "中1") names = v;
        else if (!chapters && keys.includes("J1") && Array.isArray(v.J1) && v.J1[0] && Array.isArray(v.J1[0].units)) chapters = v;
      } else if (Array.isArray(v) && !units && v.length > 50 && v[0] && typeof v[0].id === "string" && typeof v[0].grade === "string" && "maxLevel" in v[0]) units = v;
    }
    if (!names || !units) return null;
    const slim = (u) => ({ id: u.id, name: u.name, grade: u.grade, chapter: u.chapterName || "", area: u.area || "" });
    return { names, chapters: chapters ? Object.fromEntries(Object.entries(chapters).map(([g, a]) => [g, a.map((c) => ({ name: c.name || "", units: c.units.map(slim) }))])) : {}, units: units.map(slim) };
  }, `${base}/${f}`);
  if (raw) { used = f; break; }
}
await b.close(); srv.close();
if (!raw) { console.error("エクスポートから学年・単元の形が見つかりませんでした", errs); process.exit(1); }

const order = Object.keys(raw.names);                  // E1…E6, J1…J3, H1…H3
const byGrade = {}; for (const u of raw.units) (byGrade[u.grade] ||= []).push(u);
const grades = [];
for (const g of order) {
  const all = byGrade[g] || [];
  let chapters;
  if (raw.chapters[g] && raw.chapters[g].length) {       // 章の順（中学）
    chapters = raw.chapters[g].map((c) => ({ name: c.name, units: c.units.map(({ id, name }) => ({ id, name })) }));
    const seen = new Set(chapters.flatMap((c) => c.units.map((u) => u.id)));
    const rest = all.filter((u) => !seen.has(u.id));
    if (rest.length) chapters.push({ name: "そのほか", units: rest.map(({ id, name }) => ({ id, name })) });
  } else {
    chapters = [{ name: "", units: all.map(({ id, name }) => ({ id, name })) }];
  }
  if (chapters.some((c) => c.units.length)) grades.push({ id: g, name: raw.names[g], chapters: chapters.filter((c) => c.units.length) });
}
const total = grades.reduce((s, g) => s + g.chapters.reduce((t, c) => t + c.units.length, 0), 0);
const dup = new Set(), ids = new Set();
for (const g of grades) for (const c of g.chapters) for (const u of c.units) { if (ids.has(u.id)) dup.add(u.id); ids.add(u.id); }
if (dup.size) { console.error("単元の id が重なっています：", [...dup]); process.exit(1); }
if (total !== raw.units.length) { console.error(`単元の数が合いません（${total} / ${raw.units.length}）`); process.exit(1); }
writeFileSync(out, JSON.stringify({ version: 1, source: used, grades }) + "\n");
console.log(`${out}：${grades.length}学年・${total}単元（元：${used}）`);
for (const g of grades) console.log(`  ${g.id} ${g.name}：章${g.chapters.length}・単元${g.chapters.reduce((t, c) => t + c.units.length, 0)}`);
