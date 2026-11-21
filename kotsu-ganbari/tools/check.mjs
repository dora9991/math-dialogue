// 使い方: node tools/check.mjs [問番号 …]   （省略すると q/ の全部）
// 場面ファイル q/qNN.js の形と、点の参照・座標を調べる。エラーがあれば終了コード 1。
import { readdirSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import { stepDur } from "../player.js";

const here = dirname(fileURLToPath(import.meta.url)), qdir = join(here, "..", "q");
const want = process.argv.slice(2).map(Number).filter(Boolean);
const files = readdirSync(qdir).filter((f) => /^q\d\d\.js$/.test(f)).filter((f) => !want.length || want.includes(+f.slice(1, 3))).sort();
const TYPES = new Set(["pt", "dot", "seg", "line", "arrow", "poly", "path", "arc", "ell", "ang", "rt", "txt"]);
let errors = 0, warns = 0;
const E = (n, m) => { errors++; console.log(`  ✖ 問${n}: ${m}`); };
const W = (n, m) => { warns++; console.log(`  △ 問${n}: ${m}`); };

for (const file of files) {
  const n = +file.slice(1, 3);
  let sc;
  try { sc = (await import(pathToFileURL(join(qdir, file)).href)).default; } catch (e) { E(n, `読みこめません：${e.message}`); continue; }
  const bad = errors;
  if (sc.n !== n) E(n, `n が ${sc.n}（ファイル名と同じにしてください）`);
  for (const k of ["title", "problem", "answer"]) if (typeof sc[k] !== "string" || !sc[k].trim()) E(n, `${k} がありません`);
  if (!Array.isArray(sc.view) || sc.view.length !== 4 || sc.view.some((v) => typeof v !== "number")) { E(n, "view は [x, y, 幅, 高さ]"); continue; }
  if (!Array.isArray(sc.steps) || sc.steps.length < 4) { E(n, "steps が少なすぎます（4つ以上）"); continue; }
  if (sc.steps.length > 40) W(n, `steps が多い（${sc.steps.length}）`);
  const [vx, vy, vw, vh] = sc.view;
  const defAt = new Map(), ids = new Map();
  sc.steps.forEach((st, j) => (st.add || []).forEach((el) => { if (el.t === "pt" && !defAt.has(el.id)) defAt.set(el.id, j); if (el.id) ids.set(el.id, j); }));
  let total = 0;
  sc.steps.forEach((st, j) => {
    if (!st.cap || typeof st.cap !== "string") E(n, `steps[${j}] に cap（字幕）がありません`);
    else if (st.cap.length > 110) W(n, `steps[${j}] の字幕が長い（${st.cap.length}字）。2つに分けましょう`);
    total += stepDur(st);
    for (const el of st.add || []) {
      if (!TYPES.has(el.t)) { E(n, `steps[${j}] 知らない要素 ${el.t}`); continue; }
      if (el.t === "pt" && !el.id) E(n, `steps[${j}] pt に id がありません`);
      const refs = [];
      if (el.t === "seg" || el.t === "line" || el.t === "arrow") refs.push(el.a, el.b);
      if (el.t === "poly") refs.push(...el.pts);
      if (el.t === "arc" || el.t === "ell") refs.push(el.ctr);
      if (el.t === "ang" || el.t === "rt") refs.push(el.at, el.from, el.to);
      for (const r of refs) {
        if (typeof r === "string") { if (!defAt.has(r)) E(n, `steps[${j}] 点 ${r} が定義されていません`); else if (defAt.get(r) > j) E(n, `steps[${j}] 点 ${r} が、まだ出てきていません（steps[${defAt.get(r)}] で出る）`); }
        else if (!Array.isArray(r) || r.length !== 2 || r.some((v) => typeof v !== "number" || !isFinite(v))) E(n, `steps[${j}] ${el.t} の座標がおかしい：${JSON.stringify(r)}`);
      }
      const xy = el.t === "pt" || el.t === "dot" || el.t === "txt" ? [[el.x, el.y]] : [];
      for (const [x, y] of xy) {
        if (typeof x !== "number" || typeof y !== "number" || !isFinite(x + y)) E(n, `steps[${j}] ${el.t} ${el.id || el.s || ""} の座標がおかしい`);
        else if (x < vx - 2 || x > vx + vw + 2 || y < vy - 2 || y > vy + vh + 2) W(n, `steps[${j}] ${el.t} ${el.id || el.s || ""} が view の外（${x}, ${y}）`);
      }
    }
    for (const id of st.hl || []) if (!ids.has(id)) E(n, `steps[${j}] hl の ${id} がありません`);
    for (const id of st.hide || []) if (!ids.has(id)) E(n, `steps[${j}] hide の ${id} がありません`);
    for (const raw of st.eq || []) if (typeof raw !== "string") E(n, `steps[${j}] eq は文字列の配列`);
  });
  const sec = Math.round(total / 1000);
  if (sec < 25) W(n, `全体が短い（約${sec}秒）`);
  if (sec > 260) W(n, `全体が長い（約${sec}秒）`);
  console.log(`${errors === bad ? "✔" : "✖"} 問${n} ${sc.title}（${sc.steps.length}コマ・約${sec}秒）`);
}
if (!files.length) console.log("（場面ファイルがありません）");
console.log(`\nエラー ${errors}・注意 ${warns}`);
process.exit(errors ? 1 : 0);
