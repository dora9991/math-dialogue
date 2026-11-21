// 使い方: node check.mjs out/<担当名>.json [--lessons=m2a-01,m2a-02,...]
// 構造・件数・書き方を機械で確かめる（正解の正しさは、別に計算で確かめる）。エラー 0 なら終了コード 0。
import fs from 'node:fs';
const file = process.argv[2];
const lessonsArg = (process.argv.find(a => a.startsWith('--lessons=')) || '').slice(10);
if (!file) { console.error('使い方: node check.mjs out/<担当名>.json'); process.exit(2); }
let items;
try { items = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { console.error('JSON が読めません:', e.message); process.exit(1); }
if (!Array.isArray(items)) { console.error('配列ではありません'); process.exit(1); }
const errs = [], warns = [];
const E = (id, m) => errs.push(`${id}: ${m}`), W = (id, m) => warns.push(`${id}: ${m}`);
const norm = (s) => String(s).replace(/\$/g, '').replace(/[\s　]/g, '').replace(/＝/g, '=').replace(/－|−/g, '-').replace(/＋/g, '+').replace(/\\left|\\right/g, '').replace(/\\dfrac/g, '\\frac');
const seenId = new Set(), seenQ = new Map(), perLesson = {};
for (const it of items) {
  const id = it && it.id || '(idなし)';
  const m = /^(m2[a-e]|mb[1-3])-(\d\d)-L([1-4])-0([1-5])$/.exec(id);
  if (!m) { E(id, 'id の形がちがう（例 m2a-03-L2-04）'); continue; }
  if (seenId.has(id)) E(id, 'id が重なっている'); seenId.add(id);
  const [, ch, ll, dd] = m; const CODE = { m2a: 'A', m2b: 'B', m2c: 'C', m2d: 'D', m2e: 'E', mb1: 'F', mb2: 'G', mb3: 'H' }[ch];
  if (it.u !== `H2-T${CODE}`) E(id, `u は H2-T${CODE}`);
  if (it.s !== `H2-T${CODE}-${ll}`) E(id, `s は H2-T${CODE}-${ll}`);
  if (it.l !== `${ch}-${ll}`) E(id, `l は ${ch}-${ll}`);
  if (it.d !== Number(dd)) E(id, `d は ${dd}（数）`);
  for (const k of ['q', 'e', 'h']) if (typeof it[k] !== 'string' || !it[k].trim()) E(id, `${k} が空`);
  const extra = Object.keys(it).filter(k => !['id', 'u', 's', 'l', 'd', 'q', 'c', 'e', 'h'].includes(k)); if (extra.length) E(id, `余分な項目: ${extra}`);
  const lk = it.l; (perLesson[lk] ||= { 1: 0, 2: 0, 3: 0, 4: 0, pos: [0, 0, 0, 0] })[it.d]++;
  if (!Array.isArray(it.c) || it.c.length !== 4) { E(id, '選択肢は4つ'); continue; }
  const ks = it.c.filter(x => x && x.k === 1); if (ks.length !== 1) E(id, `正解（k:1）が ${ks.length} つ`);
  const ci = it.c.findIndex(x => x && x.k === 1); if (ci >= 0) perLesson[lk].pos[ci]++;
  const texts = it.c.map(x => norm(x && x.t)); if (new Set(texts).size !== 4) E(id, '選択肢が重なっている');
  for (const x of it.c) {
    if (!x || typeof x.t !== 'string' || !x.t.trim()) E(id, '選択肢の t が空');
    const bad = Object.keys(x || {}).filter(k => !['t', 'k', 'w'].includes(k)); if (bad.length) E(id, `選択肢の余分な項目: ${bad}`);
    if (x && x.k === 1 && x.w) E(id, '正解に w が付いている');
    if (x && x.k !== undefined && x.k !== 1) E(id, 'k は 1 だけ');
  }
  const wn = it.c.filter(x => x && x.k !== 1 && x.w).length; if (wn < 2) W(id, `w（まちがえ方）が ${wn} つ（2つ以上が基本）`);
  const all = [it.q, it.e, it.h, ...it.c.map(x => x.t), ...it.c.map(x => x.w || '')].join('\n');
  const dollars = [it.q, it.e, it.h, ...it.c.map(x => x.t)].some(s => ((s || '').match(/\$/g) || []).length % 2 === 1); if (dollars) E(id, '$ の数が奇数');
  if (/図(の|に|で|を|から|より)|右の図|下の図|上の図|左の図|次の図/.test(it.q)) E(id, '図を指す言い方（図は出せない。条件を文で書く）');
  if (/\\\\/.test(JSON.stringify(it).replace(/\\\\/g, '')) ) { /* JSON 上の \\ は1つの \ になるので、ここは見ない */ }
  if (/[²³√]/.test([it.q, ...it.c.map(x => x.t)].join('')) && /\$/.test(it.q)) W(id, '数式に ² ³ √ の記号が混じっている（TeX の ^{2} \\sqrt{} にそろえる）');
  const ans = it.c[ci] && it.c[ci].t; const an = norm(ans || '');
  if (an.length >= 3 && norm(it.h).includes(an)) W(id, 'ヒントに正解がそのまま出ている');
  const lines = String(it.e || '').split('\n').filter(Boolean); if (lines.length < 2) W(id, 'e が1行だけ（途中の式を書く）'); if (lines.length > 8) W(id, 'e が長い（8行まで）');
  if (String(it.q).length > 260) W(id, '問題文が長い（260字まで）');
  const qk = norm(it.q) + '|' + texts.slice().sort().join('|'); if (seenQ.has(qk)) E(id, `${seenQ.get(qk)} と同じ問題・同じ選択肢`); seenQ.set(qk, id);
  const qq = norm(it.q); for (const [k2, v2] of seenQ) { /* 問題文だけが同じもの */ }
}
const qOnly = new Map(); for (const it of items) { const k = norm(it.q || ''); if (qOnly.has(k) && k.length > 8) W(it.id, `問題文が ${qOnly.get(k)} と同じ（選択肢はちがう）`); else qOnly.set(k, it.id); }
const want = lessonsArg ? lessonsArg.split(',').filter(Boolean) : null;
if (want) { for (const l of want) if (!perLesson[l]) E(l, '問題が1つも無い'); for (const l of Object.keys(perLesson)) if (!want.includes(l)) E(l, '担当外の授業が入っている'); }
for (const [l, c] of Object.entries(perLesson)) {
  for (const d of [1, 2, 3, 4]) if (c[d] !== 5) E(l, `段階${d}が ${c[d]} 問（5問ずつ）`);
  const tot = c.pos.reduce((a, b) => a + b, 0); if (tot && Math.max(...c.pos) > Math.ceil(tot * 0.4)) W(l, `正解の位置が偏っている ${c.pos}`);
}
console.log(`授業 ${Object.keys(perLesson).length} 本・問題 ${items.length} 問`);
for (const [l, c] of Object.entries(perLesson).sort()) console.log(`  ${l}: ${c[1]}/${c[2]}/${c[3]}/${c[4]}  正解位置 ${c.pos}`);
if (warns.length) { console.log(`\n警告 ${warns.length} 件`); warns.slice(0, 60).forEach(w => console.log('  △ ' + w)); if (warns.length > 60) console.log(`  …ほか ${warns.length - 60} 件`); }
if (errs.length) { console.log(`\nエラー ${errs.length} 件`); errs.slice(0, 80).forEach(e => console.log('  ✗ ' + e)); if (errs.length > 80) console.log(`  …ほか ${errs.length - 80} 件`); process.exit(1); }
console.log('\nエラー 0');
