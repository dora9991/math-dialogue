// ============================================================
// solo-verify.mjs — 数学ラボ ソロの問題データ検査
//
//   node scripts/solo-verify.mjs                 … 全データを検査（＋前提単元のつながり・循環）
//   node scripts/solo-verify.mjs src/solo/content/elem/e3.js   … そのファイルだけ検査
//
// 各テンプレートを何百回も生成して、
//   ・問題文/答え/選択肢/ヒント/解説がそろっているか
//   ・4択に正解が1つだけ入っているか、重複がないか
//   ・入力式の答えが「数値 or 約分済みの分数」か、小数の誤差がないか
//   ・$...$ の数式が KaTeX で正しく描けるか
//   ・NaN / undefined / Infinity が紛れていないか
// を確かめる。エラーが1つでもあれば終了コード1。
// ============================================================
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import katex from "katex";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT = path.join(ROOT, "src/solo/content");
const RUNS = Number(process.env.RUNS || 300);

const GRADES = ["E1", "E2", "E3", "E4", "E5", "E6", "J1", "J2", "J3", "H1", "H2", "H3"];
const AREAS = ["num", "geo", "func", "data"];

const errors = [];
const warns = [];
const err = (where, msg) => errors.push(`✗ ${where}: ${msg}`);
const warn = (where, msg) => warns.push(`△ ${where}: ${msg}`);

const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

/** $...$ の中身を KaTeX で検査 */
function checkTex(where, s) {
  if (typeof s !== "string") return;
  const parts = s.split("$");
  if (parts.length % 2 === 0) { err(where, `$ の数が奇数: ${s}`); return; }
  for (let i = 1; i < parts.length; i += 2) {
    const seg = parts[i];
    if (seg.trim() === "") { err(where, `空の $$: ${s}`); continue; }
    try {
      katex.renderToString(seg, {
        throwOnError: true,
        strict: (code, msg) => { throw new Error(`${code}: ${msg}`); },
      });
    } catch (e) {
      err(where, `KaTeX エラー「${seg}」→ ${String(e.message).split("\n")[0]}`);
    }
  }
}

const BAD = /NaN|undefined|Infinity|\[object/;
const isFracStr = (s) => typeof s === "string" && /^-?\d+\/\d+$/.test(s);
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };

function checkProblem(where, p) {
  if (!p || typeof p !== "object") { err(where, "build が object を返していない"); return; }
  if (p.skip) return;
  if (typeof p.q !== "string" || !p.q.trim()) err(where, "q（問題文）がない");
  if (p.ans === undefined || p.ans === null || p.ans === "") err(where, "ans（答え）がない");
  if (typeof p.hint !== "string" || !p.hint.trim()) err(where, "hint がない");
  if (!Array.isArray(p.steps) || p.steps.length === 0) err(where, "steps（解説）がない");
  const texts = [p.q, p.hint, ...(p.steps || []), ...(p.choices || []).map(String), String(p.ans)];
  for (const s of texts) {
    if (typeof s === "string" && BAD.test(s)) { err(where, `NaN/undefined が混入: ${s}`); break; }
  }
  checkTex(where + " q", p.q);
  checkTex(where + " hint", p.hint);
  (p.steps || []).forEach((s, i) => {
    if (typeof s !== "string") err(where, `steps[${i}] が文字列でない`);
    else checkTex(where + ` steps[${i}]`, s);
  });

  if (p.choices) {
    if (!Array.isArray(p.choices)) { err(where, "choices が配列でない"); return; }
    if (p.choices.length < 3 || p.choices.length > 5) err(where, `choices が ${p.choices.length} 個（3〜5個に）: ${JSON.stringify(p.choices)}`);
    const keys = p.choices.map((c) => String(c).replace(/\s/g, ""));
    if (new Set(keys).size !== keys.length) err(where, `choices に重複: ${JSON.stringify(p.choices)}`);
    const hit = keys.filter((k) => k === String(p.ans).replace(/\s/g, "")).length;
    if (hit !== 1) err(where, `choices に正解がちょうど1つ入っていない（${hit}個）: ans=${p.ans} choices=${JSON.stringify(p.choices)}`);
    p.choices.forEach((c) => {
      if (typeof c === "number" && !Number.isFinite(c)) err(where, `choices に非数: ${c}`);
      if (typeof c === "number" && Number(c.toFixed(6)) !== c) err(where, `choices に小数誤差（round() を使う）: ${c}`);
      checkTex(where + " choice", String(c));
    });
  } else {
    // 入力式
    if (typeof p.ans === "number") {
      if (!Number.isFinite(p.ans)) err(where, `ans が有限の数でない: ${p.ans}`);
      else if (Number(p.ans.toFixed(6)) !== p.ans) err(where, `ans に小数の誤差（round() を使う）: ${p.ans}`);
    } else if (isFracStr(p.ans)) {
      const [n, d] = p.ans.split("/").map(Number);
      if (d <= 1) err(where, `分数の分母が1以下: ${p.ans}（整数は数値で）`);
      if (gcd(n, d) !== 1) err(where, `分数が約分されていない: ${p.ans}（fracAns を使う）`);
    } else {
      err(where, `入力式の ans は数値か "a/b" のみ（それ以外は choices を付ける）: ${JSON.stringify(p.ans)}`);
    }
    if (p.unit != null && typeof p.unit !== "string") err(where, "unit は文字列");
  }
}

function checkUnit(u, file) {
  const W = `${path.basename(file)} ${u.id || "(id なし)"}`;
  if (!u.id || typeof u.id !== "string") err(W, "id がない");
  if (!GRADES.includes(u.grade)) err(W, `grade が不正: ${u.grade}`);
  if (!AREAS.includes(u.area)) err(W, `area が不正: ${u.area}`);
  if (!u.name) err(W, "name がない");
  if (!u.desc) warn(W, "desc がない");
  if (!Array.isArray(u.prereqs)) err(W, "prereqs が配列でない");
  if (!Array.isArray(u.points) || u.points.length < 2) err(W, "points（要点）は2行以上");
  (u.points || []).forEach((s, i) => checkTex(`${W} points[${i}]`, s));
  const lv = u.levels || {};
  const need = u.grade.startsWith("H") ? [1, 2, 3, 4] : [1, 2, 3];
  for (const L of need) if (!Array.isArray(lv[L]) || lv[L].length === 0) err(W, `レベル${L} のテンプレートがない`);
  for (const L of Object.keys(lv)) {
    if (!["1", "2", "3", "4"].includes(String(L))) err(W, `levels のキーは 1〜4: ${L}`);
    const ids = new Set();
    for (const tpl of lv[L] || []) {
      const TW = `${W} L${L} ${tpl?.id}`;
      if (!tpl || typeof tpl.build !== "function") { err(TW, "t(id, build) の形でない"); continue; }
      if (ids.has(tpl.id)) err(TW, "テンプレート id が重複");
      ids.add(tpl.id);
      let skips = 0;
      const qs = new Set();
      for (let i = 0; i < RUNS; i++) {
        let p;
        try { p = tpl.build(rnd); } catch (e) { err(TW, `例外: ${e.message}`); break; }
        if (p && p.skip) { skips++; continue; }
        const before = errors.length;
        checkProblem(TW, p);
        if (p) qs.add(p.q);
        if (errors.length > before) break; // 同じテンプレのエラーは1回分だけ表示
      }
      if (skips > RUNS * 0.9) err(TW, `skip が多すぎる（${skips}/${RUNS}）`);
      else if (skips > RUNS * 0.5) warn(TW, `skip が多い（${skips}/${RUNS}）。条件を見直すと速くなる`);
      if (qs.size < 3 && !tpl.fixed) warn(TW, `問題のバリエーションが少ない（${qs.size}通り）`);
    }
  }
}

async function loadFile(file) {
  const mod = await import(pathToFileURL(file).href);
  if (!Array.isArray(mod.UNITS)) { err(path.basename(file), "export const UNITS = [...] がない"); return []; }
  return mod.UNITS.map((u) => ({ ...u, __file: file }));
}

function listContentFiles() {
  const out = [];
  for (const dir of ["elem", "jhs", "high"]) {
    const d = path.join(CONTENT, dir);
    if (!fs.existsSync(d)) continue;
    for (const f of fs.readdirSync(d).sort()) {
      if (f.endsWith(".js") && !f.startsWith("_")) out.push(path.join(d, f));
    }
  }
  return out;
}

const args = process.argv.slice(2).map((a) => path.resolve(a));
const allFiles = listContentFiles();
const targetFiles = args.length ? args : allFiles;

const all = [];
for (const f of allFiles) {
  try { all.push(...(await loadFile(f))); } catch (e) { if (targetFiles.includes(f)) err(path.basename(f), `読み込みエラー: ${e.message}`); }
}
const targets = [];
for (const f of targetFiles) {
  if (!allFiles.includes(f)) { try { targets.push(...(await loadFile(f))); } catch (e) { err(path.basename(f), `読み込みエラー: ${e.message}`); } }
  else targets.push(...all.filter((u) => u.__file === f));
}

for (const u of targets) checkUnit(u, u.__file);

// つながりの検査
const ids = new Map();
for (const u of all) {
  if (ids.has(u.id)) err(u.id, `単元 id が重複（${path.basename(ids.get(u.id))} と ${path.basename(u.__file)}）`);
  ids.set(u.id, u.__file);
}
for (const u of targets) {
  for (const p of u.prereqs || []) {
    if (!ids.has(p)) (args.length ? warn : err)(u.id, `前提単元 ${p} が見つからない`);
  }
}
if (!args.length) {
  // 循環チェック
  const byId = new Map(all.map((u) => [u.id, u]));
  const state = new Map();
  const visit = (id, stack) => {
    if (state.get(id) === 2) return;
    if (state.get(id) === 1) { err(id, `前提が循環している: ${[...stack, id].join(" → ")}`); return; }
    state.set(id, 1);
    for (const p of byId.get(id)?.prereqs || []) if (byId.has(p)) visit(p, [...stack, id]);
    state.set(id, 2);
  };
  for (const u of all) visit(u.id, []);
}

// 講義（ホー先生の解説）の検査：単元があるか・数式が描けるか・理解チェックに正解が入っているか
const LECT = path.join(ROOT, "src/solo/lectures");
let nLect = 0;
if (!args.length && fs.existsSync(LECT)) {
  for (const f of fs.readdirSync(LECT).sort()) {
    if (!f.endsWith(".js") || f === "index.js") continue;
    const W = `lectures/${f}`;
    let L;
    try { L = (await import(pathToFileURL(path.join(LECT, f)).href)).default; } catch (e) { err(W, `読み込みエラー: ${e.message}`); continue; }
    nLect++;
    if (!L || !ids.has(L.unitId)) err(W, `unitId ${L?.unitId} の単元がない`);
    if (!L?.title) err(W, "title がない");
    if (!Array.isArray(L?.slides) || !L.slides.length) { err(W, "slides がない"); continue; }
    L.slides.forEach((sl, i) => {
      const SW = `${W} slide${i + 1}`;
      if (!sl.say && !sl.board && !sl.point && !sl.example && !sl.check && !sl.yt) err(SW, "中身がない");
      checkTex(SW, sl.say);
      checkTex(SW, sl.point);
      (sl.board || []).forEach((b) => checkTex(SW + " board", b));
      if (sl.example) {
        checkTex(SW + " example", sl.example.q);
        checkTex(SW + " example", sl.example.ans);
        (sl.example.steps || []).forEach((b) => checkTex(SW + " example", b));
        if (!sl.example.steps?.length) err(SW, "example.steps がない");
      }
      if (sl.check) {
        const c = sl.check;
        [c.q, c.ok, c.ng, ...(c.choices || [])].forEach((b) => checkTex(SW + " check", b));
        if (!(c.choices || []).some((x) => String(x) === String(c.ans))) err(SW, `check の choices に ans がない: ${c.ans}`);
      }
    });
  }
}

const nTpl = targets.reduce((s, u) => s + Object.values(u.levels || {}).reduce((a, l) => a + (l?.length || 0), 0), 0);
console.log(`検査: ${targets.length} 単元 / ${nTpl} テンプレート × ${RUNS} 回生成${nLect ? ` / 講義 ${nLect} 本` : ""}`);
if (warns.length) console.log(warns.slice(0, 60).join("\n") + (warns.length > 60 ? `\n…ほか ${warns.length - 60} 件の注意` : ""));
if (errors.length) {
  console.log(errors.slice(0, 80).join("\n") + (errors.length > 80 ? `\n…ほか ${errors.length - 80} 件のエラー` : ""));
  console.log(`\nエラー ${errors.length} 件`);
  process.exit(1);
}
console.log("OK（エラーなし）");
