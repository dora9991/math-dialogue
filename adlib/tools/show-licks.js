#!/usr/bin/env node
/* リックを「拍ごとの度数つき」で一覧にして、つなぎ目（小節をまたぐ音のとび）も調べる。書いたリックの確認用。
   使い方：  node adlib/tools/show-licks.js ii-V-I [id の一部]
   表示：小節ごとに  音名(度数)  を並べる。末尾に「小節をまたぐとびが 6 半音を超えた所」の注意が出る。 */
const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, '../js');
['theory', 'chart', 'analysis', 'licks'].forEach(f => require(path.join(dir, f + '.js')));
fs.readdirSync(dir).filter(f => /^licks-.*\.js$/.test(f)).sort().forEach(f => require(path.join(dir, f)));
const { T, L } = globalThis.AL;
const ctx = process.argv[2], filt = process.argv[3];
const list = (L.byCtx[ctx] || []).filter(l => !filt || l.id.includes(filt) || l.name.includes(filt));
for (const l of list) {
  console.log(`${l.id} 「${l.name}」 lvl${l.lvl} [${l.tags.join(',')}]`);
  const bl = l.bpb, bars = [];
  console.log('   ' + l.ref.map(c => T.chordText(c)).join(' | ') + '   (segs ' + l.segs.join('+') + ')');
  let line = '', lastBar = -1;
  l.events.forEach(e => {
    const bar = Math.floor((e.t + 1e-9) / bl);
    if (bar !== lastBar) { if (line) bars.push(line); line = ''; lastBar = bar; }
    line += e.rest ? ` r(${e.dur})` : ` ${T.pitchStr(e.p)}${e.dur !== 0.5 ? ':' + (+e.dur.toFixed(2)) : ''}[${e.deg}]`;
  });
  if (line) bars.push(line);
  bars.forEach((b, k) => console.log(`   小節${k + 1}:${b}`));
  const r = L.lint(l);
  if (r.errors.length) console.log('   ✗ ' + r.errors.join(' / '));
  if (r.warns.length && process.argv.includes('-w')) console.log('   △ ' + r.warns.join(' / '));
}
console.log(`\n${list.length} 本`);
