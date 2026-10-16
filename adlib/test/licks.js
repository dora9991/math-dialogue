/* リック辞典の検査：すべてのリックを読みこみ、書き間違い（長さ・音名・スケール外・とび）がないか調べる
   使い方：node adlib/test/licks.js [-v]   （-v で注意（warn）も全部表示）  */
const fs = require('fs'), path = require('path');
require('../js/theory.js');
require('../js/chart.js');
require('../js/analysis.js');
require('../js/licks.js');
const files = fs.readdirSync(path.join(__dirname, '../js')).filter(f => /^licks-.*\.js$/.test(f)).sort();
files.forEach(f => require('../js/' + f));
const { T, L } = globalThis.AL;
const verbose = process.argv.includes('-v');
let bad = 0;
L.errors.forEach(e => { console.log('登録エラー：', e); bad++; });
const warnCount = {};
const srcSeen = {};
for (const l of L.all) {
  const r = L.lint(l);
  const key = l.ctx + '|' + l.src.replace(/\s+/g, ' ');
  if (srcSeen[key]) { console.log(`重複：${l.id} と ${srcSeen[key]}`); bad++; } else srcSeen[key] = l.id;
  if (r.errors.length) { bad++; console.log(`✗ ${l.id} 「${l.name}」\n    ${l.src}\n    ${r.errors.join('\n    ')}`); }
  if (r.warns.length) { warnCount[l.ctx] = (warnCount[l.ctx] || 0) + 1; if (verbose) console.log(`△ ${l.id} 「${l.name}」 ${r.warns.join(' / ')}`); }
}
const by = {};
L.all.forEach(l => { by[l.ctx] = (by[l.ctx] || 0) + 1; });
console.log('--- ctx ごとの数 ---');
Object.keys(L.CTX).forEach(c => console.log(c.padEnd(12), String(by[c] || 0).padStart(4), warnCount[c] ? `（注意つき ${warnCount[c]}）` : ''));
console.log('合計', L.all.length, '本 / ファイル', files.join(', '));

/* ---- 12のキーに置いたときの綴り：音は、そのコードの根音を基準に綴られているか／二重の♯♭が出ないか ----
   （辞典と同じ方法でキーを選び、各コードの記号が E7（F♭7 の異名）のような綴りでも、次のコードの音が崩れないことを確かめる） */
{
  const modeOf = l => { const c = l.ref[l.ref.length - 1]; return c.cls === 'min' || c.cls === 'minmaj' || c.cls === 'hdim' ? 'minor' : 'major'; };
  const LPC = [0, 2, 4, 5, 7, 9, 11];
  let notes = 0, miss = 0, dbl = 0;
  for (const l of L.all) {
    const mode = modeOf(l), src = l.events.filter(e => !e.rest);
    for (let K = 0; K < 12; K++) {
      const ctx = { tonicPc: K, fifths: T.keyFifths(T.keySpell(K, mode), mode) };
      const chords = l.refSrc.map(s => T.parseChord(K ? T.transposeChordStr(s, K, ctx) : s));
      const out = L.realize(l, chords, { t0: 0, lo: 55, hi: 84 }).events.filter(e => !e.rest);
      if (out.length !== src.length) { bad++; console.log(`✗ ${l.id} キー${K}：音の数が合わない`); continue; }
      out.forEach((e, i) => {
        notes++;
        if (Math.abs(e.p.a) > 1) dbl++;
        const o = src[i], k = o.seg;
        // 理想の綴り：文字は「コードの根音の文字 ＋ 元の音の（根音からの）文字のへだたり」。♯♭が1つまでで書けるなら、それになっているはず
        const li = T.mod(chords[k].root.l + o.p.l - l.ref[k].root.l, 7);
        const a = T.mod(T.mod(e.midi, 12) - LPC[li] + 6, 12) - 6;
        if (Math.abs(a) <= 1 && (e.p.l !== li || e.p.a !== a)) { miss++; if (miss <= 5) console.log(`✗ ${l.id} キー${K} ${chords.map(c => T.chordText(c)).join(' | ')}：${T.pitchStr(o.p)} → ${T.pitchStr(e.p)}（理想 ${'CDEFGAB'[li]}${a > 0 ? '#' : a < 0 ? 'b' : ''}）`); }
      });
    }
  }
  if (dbl) { bad++; console.log(`✗ 二重の♯♭が ${dbl} 個出た`); }
  if (miss) { bad++; console.log(`✗ コードの根音を基準にしていない綴りが ${miss} 個`); }
  console.log(`綴りの検査：${L.all.length}本 × 12キー、音 ${notes} 個`);
}
if (bad) { console.log(`\n${bad} 件の問題`); process.exit(1); }
console.log('licks: OK');
