// ============================================================
// verify.mjs — ikkan の空間図形の問題を、コツコツくんの問題テンプレートに移したもの（kotsu/content/）の検査
//
//   node ikkan/kotsu/verify.mjs                       … 全部を検査
//   node ikkan/kotsu/verify.mjs ikkan/kotsu/content/kukan-03.js    … そのファイルだけ
//   RUNS=1000 node ikkan/kotsu/verify.mjs             … 1つのテンプレートを生成する回数（既定 300）
//
// コツコツくん（src/solo）の scripts/solo-verify.mjs と同じ検査に、次を足してある：
//   ① 問題IDのきまり：テンプレート id は「<授業の番号 2けた><d|q|w|x><番号 2けた><a〜z（あれば）>」（例 03d04、03q02b）
//        d＝演習プリント、q＝小テスト、w＝ワークシートの学習課題・例題（K ブロックの順）、x＝ikkan にない補い問題
//   ② ikkan の問題（演習プリント・小テストの（1）（2）…）が、1問のこらず、「移した」か「移さなかった理由つき（SKIPPED）」のどちらかになっているか
//   ③ 移したテンプレートの、元の問題が、ikkan に実在するか
//   ④ ヒントに、答えそのものが書かれていないか（目安。2けた以上の数・文字の答えだけ）
//   ⑤ 4択の正解が、選択肢のいちばん前に固定されていないか（並びがかたよらないか）
// 答えの正しさ（解き直し）は、この検査では確かめられない。別の人（別の目）で解き直して突き合わせること。
// ============================================================
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const IKKAN = path.resolve(HERE, "..");
const CONTENT = path.join(HERE, "content");
const RUNS = Number(process.env.RUNS || 300);

let katex = null;
try {
  const { createRequire } = await import("node:module");
  katex = createRequire(import.meta.url)("katex");   // CommonJS の読み方なら、NODE_PATH も効く
} catch (e) {
  try { katex = (await import("katex")).default; } catch (e2) { /* なければ、数式の検査は省略 */ }
}

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
    if (/[぀-ヿ一-鿿]/.test(seg)) { err(where, `$ の中に日本語がある: ${seg}`); continue; }
    if (!katex) continue;
    try {
      katex.renderToString(seg, { throwOnError: true, strict: (code, msg) => { throw new Error(`${code}: ${msg}`); } });
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
  // ④ ヒントに、答えそのものが書かれていないか
  const a = String(p.ans).replace(/\s/g, "");
  if (typeof p.hint === "string" && a.length >= 2 && !/^-?\d+\/\d+$/.test(a)) {
    const h = p.hint.replace(/\s/g, "").replace(/\$/g, "");
    if (new RegExp("(^|[^0-9.])" + a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "($|[^0-9.])").test(h) && !p.choices) warn(where, `ヒントに答え（${a}）が書いてあるかも: ${p.hint}`);
  }

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

/** ikkan の授業データを読む（tools/verify.cjs と同じ読み方）。問題の一覧 IK.rec.catalog をつかう */
function loadIkkan() {
  const ctx = { console };
  ctx.window = ctx;
  vm.createContext(ctx);
  const dataDir = fs.readdirSync(path.join(IKKAN, "data"));
  const files = ["js/vendor/qrcode.js", "js/core.js", "js/qr.js", "js/figs.js", "js/figs3d.js", "js/plan.js", "js/rec.js", "js/plansheet.js", "data/lessons.js",
    ...dataDir.filter((f) => /^ws_.*\.js$/.test(f)).sort().map((f) => "data/" + f),
    ...dataDir.filter((f) => /^lesson_.*\.js$/.test(f)).sort().map((f) => "data/" + f)];
  for (const f of files) vm.runInContext(fs.readFileSync(path.join(IKKAN, f), "utf8"), ctx, { filename: f });
  return ctx.IK;
}

const ID_RE = /^(\d{2})([dqwx])(\d{2})([a-z]?)$/;
const KIND = { d: "dr", q: "qz" };
const external = (id) => /^(E[1-6]|J[1-3]|H[1-3])-/.test(id);   // コツコツくんの既存の単元（ここでは中身を持たない）

function checkUnit(u, file, IK) {
  const W = `${path.basename(file)} ${u.id || "(id なし)"}`;
  if (!u.id || typeof u.id !== "string") err(W, "id がない");
  if (u.grade !== "J1") err(W, `grade が不正: ${u.grade}（中1 の J1）`);
  if (u.area !== "geo") err(W, `area が不正: ${u.area}（geo）`);
  if (!u.name) err(W, "name がない");
  if (!u.desc) warn(W, "desc がない");
  if (!Array.isArray(u.prereqs)) err(W, "prereqs が配列でない");
  if (!Array.isArray(u.points) || u.points.length < 2) err(W, "points（要点）は2行以上");
  (u.points || []).forEach((s, i) => checkTex(`${W} points[${i}]`, s));
  const lv = u.levels || {};
  for (const L of [1, 2, 3]) if (!Array.isArray(lv[L]) || lv[L].length === 0) err(W, `レベル${L} のテンプレートがない`);
  const lessonNo = u.ikkan && u.ikkan.lesson ? u.ikkan.lesson : null;
  if (!lessonNo || !IK.lessons[lessonNo]) err(W, `ikkan.lesson（${lessonNo}）が、ikkan の授業にない`);
  const num = lessonNo ? lessonNo.replace(/^kukan-/, "") : "";
  for (const L of Object.keys(lv)) {
    if (!["1", "2", "3", "4"].includes(String(L))) err(W, `levels のキーは 1〜4: ${L}`);
    const ids = new Set();
    for (const tpl of lv[L] || []) {
      const TW = `${W} L${L} ${tpl?.id}`;
      if (!tpl || typeof tpl.build !== "function") { err(TW, "t(id, build) の形でない"); continue; }
      const m = ID_RE.exec(tpl.id || "");
      if (!m) err(TW, "テンプレート id は「授業の番号2けた＋d|q|w|x＋番号2けた＋a〜z」（例 03d04）");
      else if (m[1] !== num) err(TW, `テンプレート id の授業の番号 ${m[1]} が、この単元（${num}）とちがう`);
      if (ids.has(tpl.id)) err(TW, "テンプレート id が重複");
      ids.add(tpl.id);
      let skips = 0, firstPos = 0, nChoice = 0;
      const qs = new Set();
      for (let i = 0; i < RUNS; i++) {
        let p;
        try { p = tpl.build(rnd); } catch (e) { err(TW, `例外: ${e.message}`); break; }
        if (p && p.skip) { skips++; continue; }
        const before = errors.length;
        checkProblem(TW, p);
        if (p) qs.add(p.q + JSON.stringify(p.choices ? [...p.choices].sort() : ""));   // 4択は、選択肢のちがいも、バリエーションとして数える
        if (p && p.choices) { nChoice++; if (String(p.choices[0]) === String(p.ans)) firstPos++; }
        if (errors.length > before) break;
      }
      if (skips > RUNS * 0.9) err(TW, `skip が多すぎる（${skips}/${RUNS}）`);
      else if (skips > RUNS * 0.5) warn(TW, `skip が多い（${skips}/${RUNS}）。条件を見直すと速くなる`);
      if (qs.size < 3 && !tpl.fixed) warn(TW, `問題のバリエーションが少ない（${qs.size}通り）。いつも同じ問題なら、fixed(id, build) で作る`);
      if (nChoice >= 50 && firstPos / nChoice > 0.6) err(TW, `4択の正解が、いつも先頭に来ている（${firstPos}/${nChoice}）。choices4 でシャッフルする`);
    }
  }
}

// ② ③ ikkan の問題との対応
function checkCoverage(units, skippedByFile, IK) {
  const cat = IK.rec.catalog("kukan");
  const have = new Set(cat.map((c) => c.id));
  const done = new Map();   // ikkan の問題ID → 移したテンプレート
  const ws = {};            // 授業ごとの K ブロックの数
  for (const u of units) {
    const no = u.ikkan && u.ikkan.lesson ? u.ikkan.lesson.replace(/^kukan-/, "") : "";
    for (const L of Object.keys(u.levels || {})) {
      for (const tpl of u.levels[L]) {
        const m = ID_RE.exec(tpl.id || "");
        if (!m || m[2] === "x") continue;
        const lesson = `kukan-${m[1]}`;
        if (m[2] === "w") {
          if (!ws[lesson]) { const fl = []; const walk = (bl) => bl.forEach((b) => { if (b.type === "cols") b.cols.forEach((c) => walk(c.blocks)); else fl.push(b); }); walk(IK.lessons[lesson].blocks); ws[lesson] = fl.filter((b) => b.type === "kadai").length; }
          if (+m[3] < 1 || +m[3] > ws[lesson]) err(`${u.id} ${tpl.id}`, `ワークシートに ${m[3]} 番目の学習課題・例題がない（全 ${ws[lesson]}）`);
          continue;
        }
        const qid = `${lesson}.${KIND[m[2]]}.${+m[3]}`;
        if (!have.has(qid)) err(`${u.id} ${tpl.id}`, `元の問題 ${qid} が、ikkan にない`);
        if (!done.has(qid)) done.set(qid, []);
        done.get(qid).push(tpl.id);
      }
    }
  }
  const skipped = new Map();
  for (const [file, list] of Object.entries(skippedByFile)) {
    for (const [qid, why] of list) {
      if (!have.has(qid)) err(path.basename(file), `SKIPPED の ${qid} が、ikkan にない`);
      if (!why || String(why).length < 4) err(path.basename(file), `SKIPPED の ${qid} に、理由がない`);
      if (done.has(qid)) err(path.basename(file), `${qid} は、移してもいるし、SKIPPED にも入っている`);
      skipped.set(qid, why);
    }
  }
  const lessonsDone = new Set(units.map((u) => u.ikkan && u.ikkan.lesson));
  const missing = cat.filter((c) => lessonsDone.has(c.lesson) && !done.has(c.id) && !skipped.has(c.id));
  missing.forEach((c) => err(c.id, `移していないし、SKIPPED にもない（${c.text.replace(/\n/g, " ").slice(0, 30)}…）`));
  return { total: cat.filter((c) => lessonsDone.has(c.lesson)).length, moved: [...done.keys()].length, skipped: skipped.size };
}

const args = process.argv.slice(2).map((a) => path.resolve(a));
const allFiles = fs.existsSync(CONTENT) ? fs.readdirSync(CONTENT).filter((f) => f.endsWith(".js")).sort().map((f) => path.join(CONTENT, f)) : [];
const targetFiles = args.length ? args : allFiles;
const IK = loadIkkan();

const all = [], skippedByFile = {};
for (const f of allFiles) {
  try {
    const mod = await import(pathToFileURL(f).href);
    if (!Array.isArray(mod.UNITS)) { err(path.basename(f), "export const UNITS = [...] がない"); continue; }
    mod.UNITS.forEach((u) => all.push({ ...u, __file: f }));
    skippedByFile[f] = Array.isArray(mod.SKIPPED) ? mod.SKIPPED : [];
  } catch (e) { if (targetFiles.includes(f)) err(path.basename(f), `読み込みエラー: ${e.stack ? e.stack.split("\n").slice(0, 3).join(" / ") : e.message}`); }
}
const targets = all.filter((u) => targetFiles.includes(u.__file));
for (const u of targets) checkUnit(u, u.__file, IK);

const ids = new Map();
for (const u of all) {
  if (ids.has(u.id)) err(u.id, `単元 id が重複（${path.basename(ids.get(u.id))} と ${path.basename(u.__file)}）`);
  ids.set(u.id, u.__file);
}
for (const u of targets) for (const p of u.prereqs || []) if (!ids.has(p) && !external(p)) err(u.id, `前提単元 ${p} が見つからない`);

const cov = checkCoverage(targets, Object.fromEntries(Object.entries(skippedByFile).filter(([f]) => targetFiles.includes(f))), IK);
const nTpl = targets.reduce((s, u) => s + Object.values(u.levels || {}).reduce((a, l) => a + (l?.length || 0), 0), 0);
console.log(`検査: ${targets.length} 単元 / ${nTpl} テンプレート × ${RUNS} 回生成${katex ? "" : "（katex がないので、数式の検査は省略）"}`);
console.log(`ikkan の問題 ${cov.total} 問：移した ${cov.moved} 問／移さなかった ${cov.skipped} 問（理由つき）`);
if (warns.length) console.log(warns.slice(0, 60).join("\n") + (warns.length > 60 ? `\n…ほか ${warns.length - 60} 件の注意` : ""));
if (errors.length) {
  console.log(errors.slice(0, 100).join("\n") + (errors.length > 100 ? `\n…ほか ${errors.length - 100} 件のエラー` : ""));
  console.log(`\nエラー ${errors.length} 件`);
  process.exit(1);
}
console.log("OK（エラーなし）");
