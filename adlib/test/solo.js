/* solo.js の検査：いろいろな進行・乱数の種で、ソロが「破綻なく」作れるか
   使い方：node adlib/test/solo.js [-v] */
const assert = require('assert'), fs = require('fs'), path = require('path');
['theory', 'chart', 'analysis', 'licks'].forEach(f => require('../js/' + f + '.js'));
fs.readdirSync(path.join(__dirname, '../js')).filter(f => /^licks-.*\.js$/.test(f)).sort().forEach(f => require('../js/' + f));
require('../js/solo.js');
const { T, C, A, L, S } = globalThis.AL;
const verbose = process.argv.includes('-v');
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepStrictEqual(a, b, m); n++; };

const CHARTS = {
  '251': '| Dm7 | G7 | Cmaj7 | % |',
  '251-2beat': '| Dm7 G7 | Cmaj7 | % | % |',
  'minor251': '| Dm7b5 | G7b9 | Cm7 | % |',
  'blues': '| F7 | Bb7 | F7 | F7 | Bb7 | Bb7 | F7 | D7 | Gm7 | C7 | F7 D7 | Gm7 C7 |',
  'parker-blues': '| Fmaj7 | Em7b5 A7 | Dm7 G7 | Cm7 F7 | Bb7 | Bdim7 | Fmaj7 D7 | Gm7 | C7 | Cm7 F7 | Fmaj7 D7 | Gm7 C7 |',
  'minor-blues': '| Cm7 | Cm7 | Cm7 | Cm7 | Fm7 | Fm7 | Cm7 | Cm7 | Dm7b5 | G7b9 | Cm7 | G7alt |',
  'autumn': '| Cm7 | F7 | Bbmaj7 | Ebmaj7 | Am7b5 | D7b9 | Gm7 | % | Am7b5 | D7b9 | Gm7 | % | Cm7 | F7 | Bbmaj7 | Ebmaj7 |',
  'rhythm-A': '| Bbmaj7 G7 | Cm7 F7 | Dm7 G7 | Cm7 F7 | Fm7 Bb7 | Ebmaj7 Edim7 | Dm7 G7 | Cm7 F7 | Bbmaj7 |',
  'turn': '| Cmaj7 Am7 | Dm7 G7 | Em7 A7 | Dm7 G7 | Cmaj7 |',
  'tritone': '| Dm7 | Db7 | Cmaj7 | % | Fm7 | Bb7 | Cmaj7 | % |',
  'modal': '| Dm7 | % | % | % | Ebm7 | % | % | % |',
  'long-ii': '| Dm7 | % | G7 | Cmaj7 | % |',
  'sus-alt': '| C7sus4 | % | C7alt | % | Cmaj7#11 | Cm6 | Cm(maj7) | Cdim7 |',
  'nc': '| Dm7 | N.C. | Cmaj7 | % |',
};

function build(text, bpb) {
  const ch = C.parse(text, { beatsPerBar: bpb || 4 });
  assert.deepStrictEqual(ch.errors, [], text);
  const slots = C.slotsOf(ch), hs = C.harmonicSlots(slots);
  const an = A.analyze(hs, { beatsPerBar: ch.beatsPerBar });
  return { ch, slots, hs, an, total: ch.chorusBeats };
}

let totalNotes = 0, bigLeaps = 0, outRange = 0;
for (const [name, text] of Object.entries(CHARTS)) {
  const b = build(text);
  for (let seed = 1; seed <= 25; seed++) {
    for (const level of [1, 3]) {
      const solo = S.generate(b.hs, b.an, { seed, level, density: seed % 3, bpb: 4 });
      const ev = solo.events;
      ok(ev.length > 0, `${name} seed${seed}: 音がない`);
      let end = 0, prevM = null;
      for (const e of ev) {
        ok(e.t >= end - 1e-6, `${name} seed${seed}: 音が重なっている t=${e.t} end=${end}`);
        ok(e.dur > 0, 'dur>0');
        end = e.t + e.dur;
        ok(end <= b.total + 1e-6, `${name} seed${seed}: コーラスをはみ出す ${end}>${b.total}`);
        if (e.midi < solo.opts.lo - 2 || e.midi > solo.opts.hi + 2) outRange++;
        if (prevM != null && Math.abs(e.midi - prevM) > 14) bigLeaps++;
        prevM = e.midi; totalNotes++;
        ok(T.pitchMidi(e.p) === e.midi, '音高と綴りの食い違い');
      }
      // 各決定が、そのコードの範囲内に収まっている
      for (const d of solo.decisions) {
        const lick = L.byId[d.id];
        const f0 = b.hs[d.i0], f1 = b.hs[d.i0 + d.n - 1];
        const len = d.cut || lick.total;
        ok(d.t >= f0.t0 - 1e-6 && d.t + len <= f1.t0 + f1.dur + 1e-6, `${name} seed${seed}: ${d.id} がコードの範囲を出る`);
      }
      // 同じ乱数の種なら同じソロ
      if (seed === 3 && level === 1) {
        const again = S.generate(b.hs, b.an, { seed, level, density: seed % 3, bpb: 4 });
        eq(again.events.map(e => [e.t, e.midi]), ev.map(e => [e.t, e.midi]), `${name}: 同じ種で結果が変わる`);
      }
    }
  }
}
console.log(`ソロ生成：${Object.keys(CHARTS).length}曲 × 25種 × 2レベル。音 ${totalNotes} 個、音域外 ${outRange}、大きなとび(>14) ${bigLeaps}`);
ok(outRange / totalNotes < 0.02, '音域外が多すぎる');
ok(bigLeaps / totalNotes < 0.01, '大きなとびが多すぎる');

// 入れ替え
{
  const b = build(CHARTS['251']);
  const solo = S.generate(b.hs, b.an, { seed: 7, level: 2 });
  const di = 0;
  const cands = S.candidates(b.hs, b.an, solo, di);
  ok(cands.length >= 3, '候補が少ない：' + cands.length);
  const other = cands.find(l => l.id !== solo.decisions[di].id);
  const sw = S.swap(b.hs, b.an, solo, di, other.id);
  eq(sw.decisions[di].id, other.id);
  ok(sw.events.length > 0);
  const re = S.reroll(b.hs, b.an, solo, di, 5);
  ok(re.events.length > 0);
}
// 3/4 拍子でも落ちない
{
  const b = build('| Dm7 | G7 | Cmaj7 | % |', 3);
  const solo = S.generate(b.hs, b.an, { seed: 2, bpb: 3 });
  ok(solo.events.length > 0, '3/4 でソロがない');
}
// ピアノのレンジで、ずっと同じ高さに張りつかない（極端な偏りがない）
{
  const b = build(CHARTS['autumn']);
  const solo = S.generate(b.hs, b.an, { seed: 11, level: 2 });
  const ms = solo.events.map(e => e.midi);
  const avg = ms.reduce((a, c) => a + c, 0) / ms.length;
  ok(avg > 58 && avg < 78, '平均の高さが偏っている：' + avg);
}
// リズムの変化：難しさが上がるほど、16分音符・3連符が出る。ふつう（2）でも、8分音符だけにならない
//   （しきい値は、いまの実測の7〜8割。リックのリズム加点・かたまりの分解のどちらか一方を消しても、下回るようにしてある）
{
  const share = (level, density = 1) => {
    let all = 0, s16 = 0, trip = 0, rhythmicLicks = 0, licks = 0;
    for (const text of Object.values(CHARTS)) {
      const b = build(text);
      for (let seed = 1; seed <= 12; seed++) {
        const solo = S.generate(b.hs, b.an, { seed, level, density, bpb: 4 });
        solo.events.forEach(e => { const d = Math.round(e.dur * 12); all++; if (d === 3) s16++; else if (d === 4 || d === 8) trip++; });
        solo.decisions.forEach(d => { licks++; if (S.rhythmOf(L.byId[d.id]).n) rhythmicLicks++; });
      }
    }
    return { s16: s16 / all, trip: trip / all, mix: (s16 + trip) / all, rhythmic: rhythmicLicks / licks };
  };
  const a = share(1), b2 = share(2), c = share(3);
  if (verbose) console.log('リズム（16分・3連・リズムのあるリックの割合）', [a, b2, c].map(x => [x.s16, x.trip, x.rhythmic].map(v => v.toFixed(3)).join('/')).join('  '));
  ok(a.mix < 0.1, 'やさしい（1）は、8分音符が中心のまま：' + a.mix);
  ok(b2.mix > 0.36, 'ふつう（2）で、16分・3連符が少ない：' + b2.mix);
  ok(b2.rhythmic > 0.55, 'ふつう（2）で、リズムのあるリックが少ない：' + b2.rhythmic);
  ok(c.s16 > 0.38, 'むずかしい（3）で、16分音符が少ない：' + c.s16);
  ok(c.mix > b2.mix && b2.mix > a.mix, '難しさとリズムの濃さが、順になっていない');
  // 音の多さ：まばらなほど16分は控えめ、多いほど出やすい
  const d0 = share(2, 0), d2 = share(2, 2);
  if (verbose) console.log('音の多さと16分（まばら／多い）', d0.s16.toFixed(3), d2.s16.toFixed(3));
  ok(d2.s16 > d0.s16 + 0.03, '音の多さを上げても、16分音符が増えない：' + d0.s16 + ' → ' + d2.s16);
}
if (verbose) {
  const b = build(CHARTS['251']);
  const solo = S.generate(b.hs, b.an, { seed: 4, level: 2 });
  console.log(solo.decisions.map(d => `${d.kind}:${d.id}@${d.t}`).join('\n'));
  console.log(solo.events.map(e => `${e.t}:${T.pitchStr(e.p)}`).join(' '));
}
console.log(`solo: OK（${n}件）`);
