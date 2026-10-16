/* サンプル進行の検査：全部が読めて、解析・ソロ生成まで通ること */
const fs = require('fs'), path = require('path');
const D = path.join(__dirname, '../js/');
['theory', 'chart', 'analysis', 'licks'].forEach(f => require(D + f + '.js'));
fs.readdirSync(D).filter(f => /^licks-.*\.js$/.test(f)).sort().forEach(f => require(D + f));
['solo', 'comping', 'presets'].forEach(f => require(D + f + '.js'));
const { C, A, S, B, P, L } = AL;
let bad = 0;
const ok = (c, m) => { if (!c) { bad++; console.log('✗', m); } };
const ids = new Set();
const cats = new Set(P.CATS.map(c => c.id));
for (const p of P.LIST) {
  ok(!ids.has(p.id), 'id がかぶっている ' + p.id); ids.add(p.id);
  ok(cats.has(p.cat), p.id + ': 知らない分類 ' + p.cat);
  const st = B.STYLES[p.style];
  ok(!!st, p.id + ': 知らないスタイル ' + p.style);
  if (!st) continue;
  ok(p.tempo >= st.tempo[1] && p.tempo <= st.tempo[2], `${p.id}: テンポ ${p.tempo} が ${p.style} の範囲外`);
  ok(p.title && p.desc && p.text, p.id + ': 項目が足りない');
  const ch = C.parse(p.text, { beatsPerBar: st.bpb });
  ok(ch.errors.length === 0, p.id + ': 読めない ' + JSON.stringify(ch.errors));
  const slots = C.slotsOf(ch), hs = C.harmonicSlots(slots);
  const an = A.analyze(hs, { beatsPerBar: st.bpb });
  const matched = an.phrases.filter(f => f.match).length;
  const solo = S.generate(hs, an, { seed: 3, level: 2, bpb: st.bpb });
  ok(solo.events.length > 0, p.id + ': ソロが空');
  const gen = B.generate(slots, { style: p.style, seed: 1, bpb: st.bpb });
  ok(gen.comp.length > 0 && gen.bass.length > 0 && gen.drums.length > 0, p.id + ': 伴奏が空');
  console.log(p.id.padEnd(14), String(ch.chorusBars).padStart(2) + '小節', an.key.name.padEnd(8), 'パターン', matched, '/', an.phrases.length, 'ソロ音数', solo.events.length, p.title);
}
if (bad) { console.log(bad + ' 件の問題'); process.exit(1); }
console.log('presets: OK（' + P.LIST.length + '曲）');
