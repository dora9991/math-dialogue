// talk-g2/arith-check.mjs — 台本の中の「数だけの等式」（2×7＝14、3×3−4＝9−4＝5 など）を全部計算して、合わないものを出す。
//  文字を含む式・分数 [[a/b]] は見ない（それは各担当が sympy で検算）。ポンタ（B）の行は、まちがいを言うので見ない。
//  使い方: node arith-check.mjs [<ID>...]   （ID なしなら scenes/ 全部）
import fs from 'node:fs'; import path from 'node:path'; import vm from 'node:vm'; import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ids = process.argv.slice(2).length ? process.argv.slice(2) : fs.readdirSync(path.join(HERE, 'scenes')).filter(f => f.endsWith('.js')).map(f => f.replace(/\.js$/, ''));
const mk = n => (...a) => ({ k: n, a });
const KL = { T: (t, o = {}) => ({ who: 'T', text: t, ...o }), B: (t, o = {}) => ({ who: 'B', text: t, ...o }), Q: (id, q, ch, br = {}) => ({ type: 'Q', id, q, ch, br }), FIG: () => ({}), tbl: rows => ({ type: 'table', rows }), lesson: d => { KL.out = d; }, cells: () => [], S3: new Proxy({}, { get: () => () => [] }) };
for (const n of ['lbl', 'rect', 'poly', 'seg', 'arc', 'pt', 'circle', 'sector', 'arrow', 'hist']) KL[n] = mk(n);
const strip = s => String(s).replace(/\{\{|\}\}|\*\*/g, '');
const RUN = /[0-9.＋+−\-×÷()（）＝=]+/g;   // 空白・改行・全角空白で区切る（表の行ラベルや別の行をつなげない）
function evalExpr(s) { const e = s.replace(/＋/g, '+').replace(/−/g, '-').replace(/×/g, '*').replace(/÷/g, '/').replace(/[（]/g, '(').replace(/[）]/g, ')').replace(/\s+/g, ''); if (!/^[0-9.+\-*/()]+$/.test(e)) return NaN; try { return Function('"use strict";return (' + e + ')')(); } catch { return NaN; } }
function checkText(id, where, raw, bad) {
  const t = strip(raw).replace(/\[\[[^\]]*\]\]/g, '§');
  let m; RUN.lastIndex = 0;
  while ((m = RUN.exec(t))) {
    const run = m[0], i = m.index, end = i + run.length;
    if (!/[＝=]/.test(run)) continue;
    const before = t[i - 1] || '', after = t[end] || '';
    // 文字・累乗・分数・単位つきの式の一部を見てしまわない
    if (/[A-Za-zａ-ｚＡ-Ｚ²³§π]/.test(before) || /[A-Za-zａ-ｚＡ-Ｚ²³§π%％/]/.test(after)) continue;
    const parts = run.split(/[＝=]/).map(p => p.trim());
    if (parts.length < 2 || parts.some(p => !p)) continue;
    if (parts.some(p => !/[0-9]/.test(p))) continue;
    const vals = parts.map(evalExpr);
    if (vals.some(v => Number.isNaN(v))) continue;
    // 2つ以上の数・演算をふくむ式だけ（「x＝5」のような単独の数は見ない）
    if (parts.every(p => /^-?[0-9.]+$/.test(p))) continue;
    if (vals.some(v => Math.abs(v - vals[0]) > 1e-9)) bad.push(`${id} ${where}: 「${run.trim()}」→ ${vals.map(v => +v.toFixed(6)).join(' / ')}`);
  }
}
let nEq = 0, bad = [];
for (const id of ids) {
  const out = {}; KL.out = null;
  try { vm.runInNewContext(fs.readFileSync(path.join(HERE, 'scenes', id + '.js'), 'utf8'), { KL, Math, console, String, Array, Object, Number, JSON }, { timeout: 5000 }); } catch (e) { bad.push(`${id}: 実行できない ${e.message}`); continue; }
  const L = KL.out; if (!L) continue;
  const lines = []; const addEl = (w, el) => { if (!el) return; if (el.text) lines.push([w + '/' + (el.label || el.type), el.text]); if (el.rows) el.rows.flat().forEach(c => lines.push([w + '/表', c])); };
  // まちがいの選択肢は、わざと合わない式を書くので見ない（正解の選択肢だけ見る）
  const addStep = (w, st) => { if (!st || st.who === 'B') return; lines.push([w, st.text]); (st.add || []).forEach(e => addEl(w, e)); };
  L.steps.forEach((st, i) => {
    if (st.type === 'Q') { addStep(`step${i + 1}問`, st.q); st.ch.forEach((c, j) => { if (c.ok) lines.push([`step${i + 1}正解の選択肢${j}`, c.t]); }); for (const [k, arr] of Object.entries(st.br)) (arr || []).forEach((s, j) => addStep(`step${i + 1}.${k}[${j}]`, s)); }
    else addStep(`step${i + 1}`, st);
  });
  for (const [w, s] of lines) { const before = bad.length; checkText(id, w, s, bad); nEq++; }
}
console.log(`${ids.length}本・${nEq}か所の文を見た。合わない等式：${bad.length}件`);
bad.forEach(b => console.log('  ✗ ' + b));
process.exit(bad.length ? 1 : 0);
