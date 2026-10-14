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
if (bad) { console.log(`\n${bad} 件の問題`); process.exit(1); }
console.log('licks: OK');
