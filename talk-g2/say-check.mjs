// talk-g2/say-check.mjs — 字幕（text）と、読み上げ用 say: に出てくる「数」が合っているかを調べる（数のずれ・消し忘れ・直し忘れを拾う）。
//  数字の並び（整数・小数）を、順番をこえて数えて比べる。分数の語順・「イコール」などの言いかえは問題にしない。
//  say をかなで書いた所（「2元1次方程式」→にげんいちじ…）や、ポンタの「3.30」を「3.3」と読ませる所は、意図した差として出る（2026-10-07 時点で 6件）。
//  使い方: node say-check.mjs [<ID>...]
import fs from 'node:fs'; import path from 'node:path'; import vm from 'node:vm'; import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ids = process.argv.slice(2).length ? process.argv.slice(2) : fs.readdirSync(path.join(HERE, 'scenes')).filter(f => f.endsWith('.js')).map(f => f.replace(/\.js$/, ''));
const KL = { T: (t, o = {}) => ({ who: 'T', text: t, ...o }), B: (t, o = {}) => ({ who: 'B', text: t, ...o }), Q: (id, q, ch, br = {}) => ({ type: 'Q', id, q, ch, br }), FIG: () => ({}), tbl: r => ({ rows: r }), lesson: d => { KL.out = d; }, cells: () => [], S3: new Proxy({}, { get: () => () => [] }) };
for (const n of ['lbl', 'rect', 'poly', 'seg', 'arc', 'pt', 'circle', 'sector', 'arrow', 'hist']) KL[n] = () => ({});
const nums = s => (String(s).replace(/\{\{|\}\}|\*\*/g, '').replace(/²/g, ' 2').replace(/³/g, ' 3').replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0)).replace(/\[\[|\]\]/g, ' ').match(/[0-9]+(?:\.[0-9]+)?/g) || []).sort();
let nLines = 0, nSay = 0; const bad = [];
const chk = (id, w, st) => { if (!st || !st.who) return; nLines++; if (st.say == null) return; nSay++; const a = nums(st.text), b = nums(st.say); if (JSON.stringify(a) !== JSON.stringify(b)) bad.push(`${id} ${w}: 字幕[${a.join(' ')}] ≠ say[${b.join(' ')}]  「${String(st.text).slice(0, 36)}…」`); };
for (const id of ids) {
  KL.out = null; try { vm.runInNewContext(fs.readFileSync(path.join(HERE, 'scenes', id + '.js'), 'utf8'), { KL, Math, console, String, Array, Object, Number, JSON }, { timeout: 5000 }); } catch (e) { bad.push(`${id}: 実行できない ${e.message}`); continue; }
  KL.out.steps.forEach((st, i) => { if (st.type === 'Q') { chk(id, `step${i + 1}問`, st.q); for (const [k, arr] of Object.entries(st.br)) (arr || []).forEach((s, j) => chk(id, `step${i + 1}.${k}[${j}]`, s)); } else chk(id, `step${i + 1}`, st); });
}
console.log(`${ids.length}本・${nLines}行（say つき ${nSay}行）。字幕と say の数がちがう行：${bad.length}`);
bad.forEach(b => console.log('  ✗ ' + b));
process.exit(bad.length ? 1 : 0);
