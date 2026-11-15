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
      const opts = { seed, level, density: seed % 3, rest: (seed + level) % 3, bpb: 4 };   // 音の多さ・ブレイクの多さを、ひととおり回す
      const solo = S.generate(b.hs, b.an, opts);
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
        const again = S.generate(b.hs, b.an, opts);
        eq(again.events.map(e => [e.t, e.dur, e.midi]), ev.map(e => [e.t, e.dur, e.midi]), `${name}: 同じ種で結果が変わる`);
      }
      // realize は、同じ decisions から何度作っても同じ音になる（息継ぎで短く切った最後の音もふくめて）
      if (seed % 5 === 0) {
        const re = S.realize(b.hs, b.an, solo);
        eq(re.events.map(e => [e.t, e.dur, e.midi]), ev.map(e => [e.t, e.dur, e.midi]), `${name} seed${seed}: realize しなおすと音が変わる`);
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
/* ---------------- 音の動きの形：階段ばかりにならない。跳ぶ・ジグザグが混ざる ---------------- */
// ソロの音を、1拍以上の休みで区切った「ひと続き」ごとに見て、音程と向きを数える
function contour(soloOpts) {
  let iv = 0, step = 0, leap = 0, turns = 0, moves = 0, notes = 0, stairNotes = 0;
  let sound = 0, total = 0, rests = 0, barRests = 0, bars = 0, longest = 0, runSum = 0, runN = 0;
  let decs = 0, pattern = 0, dupSig = 0, trimmed = 0;
  for (const text of Object.values(CHARTS)) {
    const b = build(text);
    for (let seed = 1; seed <= 12; seed++) {
      const solo = S.generate(b.hs, b.an, Object.assign({ seed, bpb: 4 }, soloOpts));
      const ev = solo.events;
      total += b.total; bars += b.total / 4; notes += ev.length;
      const seen = new Set();
      solo.decisions.forEach(d => { decs++; if (d.kind === 'pattern') pattern++; if (d.trim) trimmed++; const g = S.sigOf(L.byId[d.id]); if (seen.has(g)) dupSig++; seen.add(g); });
      let run = 1, prevDir = 0, start = ev[0].t, end = ev[0].t;
      const closeRun = () => { if (run >= 5) stairNotes += run; };
      const closePhrase = () => { const len = end - start; longest = Math.max(longest, len); runSum += len; runN++; };
      const gapSeen = g => { if (g >= 1 - 1e-6) { rests++; if (g >= 4 - 1e-6) barRests++; } };
      gapSeen(ev[0].t);
      ev.forEach((e, i) => {
        sound += e.dur;
        if (i > 0) {
          const gap = e.t - end;
          if (gap >= 1 - 1e-6) { gapSeen(gap); closeRun(); closePhrase(); run = 1; prevDir = 0; start = e.t; }
          else {
            const d = e.midi - ev[i - 1].midi, a = Math.abs(d), dir = Math.sign(d);
            iv++; if (a >= 1 && a <= 2) step++; if (a >= 5) leap++;
            if (dir && prevDir) { moves++; if (dir !== prevDir) turns++; }
            if (a >= 1 && a <= 2 && dir === prevDir) run++; else { closeRun(); run = a >= 1 && a <= 2 ? 2 : 1; }
            if (dir) prevDir = dir;
          }
        }
        end = Math.max(end, e.t + e.dur);
      });
      closeRun(); closePhrase(); gapSeen(b.total - end);
    }
  }
  return { leap: leap / iv, step: step / iv, turn: turns / moves, stair: stairNotes / notes, sound: sound / total, rests4: rests / bars * 4, barRests4: barRests / bars * 4,
    longest, avgRun: runSum / runN, pattern: pattern / decs, dupSig: dupSig / decs, trimmed };
}
const fmt = x => Object.entries(x).map(([k, v]) => `${k} ${typeof v === 'number' && v % 1 ? v.toFixed(3) : v}`).join('  ');
{
  // 形を数える道具そのもの
  const byName = (ctx, re) => L.byCtx[ctx].find(l => re.test(l.name));
  eq(S.shapeOf(L.add({ ctx: 'maj7', ref: 'Cmaj7', segs: [4], name: '検査用：階段', notes: 'C4 D4 E4 F4 G4 A4 B4 C5', desc: 'x', tags: [], lvl: 1 })).kind, 'stairs', '音階を順に上がるだけのリックは「階段」');
  L.all.pop(); L.byCtx.maj7.pop();
  eq(S.shapeOf(byName('maj7', /^1→5→オクターブ上へ跳んで/)).kind, 'leap');
  eq(S.shapeOf(byName('maj7', /^3度のジグザグで上がる/)).kind, 'zig');
  eq(S.sigOf(byName('maj7', /^1→5→オクターブ上へ跳んで/)), S.sigOf(byName('min7', /^1→5→オクターブ上へ跳んで/)), '同じ型は、コードがちがっても同じ目印になる');
  // 辞典：どのコード・スケールにも、跳ぶリックとジグザグのリックがある
  for (const ctx of ['dom7', 'dom7alt', 'dom7#11', 'dom7sus', 'blues7', 'maj7', 'maj7#11', 'min7', 'min6', 'minmaj7', 'm7b5', 'dim7']) {
    const kinds = L.byCtx[ctx].map(l => S.shapeOf(l).kind);
    const nLeap = kinds.filter(k => k === 'leap').length, nZig = kinds.filter(k => k === 'zig').length;
    ok(nLeap >= 4, `${ctx}：跳ぶリックが少ない`);
    ok(nLeap + nZig >= 6, `${ctx}：跳ぶ・ジグザグのリックが少ない`);   // sus のジグザグは4度のとびになるので、合わせて数える
    ok(L.byCtx[ctx].filter(l => l.tags.indexOf('leap') >= 0).length >= 3 && L.byCtx[ctx].filter(l => l.tags.indexOf('zigzag') >= 0).length >= 3, `${ctx}：leap／zigzag のタグのリックが少ない`);
  }
  // ソロ全体：とび（4度より広い音程）が1割以上、向きの変わり目が4割以上。5音以上つづく階段にいる音は少し
  //   （形を見ないで選んでいたころの実測は、とび 6%・向きの変わり目 35%・階段 14%。いまの実測は 15%・46%・3%）
  const c1 = contour({ level: 1 }), c2 = contour({ level: 2 }), c3 = contour({ level: 3 });
  if (verbose) { console.log('形 Lv1', fmt(c1)); console.log('形 Lv2', fmt(c2)); console.log('形 Lv3', fmt(c3)); }
  ok(c2.leap > 0.11, 'ふつう（2）で、とびが少ない：' + c2.leap);
  ok(c2.turn > 0.40, 'ふつう（2）で、向きの変わり目が少ない（ジグザグしていない）：' + c2.turn);
  ok(c2.stair < 0.06, 'ふつう（2）で、階段が多い：' + c2.stair);
  ok(c2.step < 0.47, 'ふつう（2）で、順次進行ばかり：' + c2.step);
  ok(c1.leap > 0.09 && c3.leap > 0.10, 'やさしい・むずかしいで、とびが少ない：' + c1.leap + ' / ' + c3.leap);
  ok(c1.stair < 0.08 && c3.stair < 0.07, 'やさしい・むずかしいで、階段が多い：' + c1.stair + ' / ' + c3.stair);
  // 同じ型（同じリズム・同じ動き）を、1コーラスのなかでくり返さない（型を見ないで選ぶと、1〜1.5% はくり返しになる）
  ok(c1.dupSig < 0.005 && c2.dupSig < 0.005 && c3.dupSig < 0.005, '同じ型のくり返しが多い：' + [c1, c2, c3].map(c => c.dupSig).join(' / '));
  // かたまり（ii–V–I など）のリックも、使われつづけている
  ok(c1.pattern > 0.18 && c2.pattern > 0.06, 'かたまりのリックが使われていない：' + c1.pattern + ' / ' + c2.pattern);

  /* ---------------- ブレイク（間）：ひとフレーズ弾いたら休む ---------------- */
  //   （息継ぎを入れるまえの実測は、鳴っている拍 87%・弾きつづける長さ 平均 14拍・最長 64拍）
  const r0 = contour({ level: 2, rest: 0 }), r1 = contour({ level: 2, rest: 1 }), r2 = contour({ level: 2, rest: 2 });
  if (verbose) { console.log('間 少なめ', fmt(r0)); console.log('間 ふつう', fmt(r1)); console.log('間 たっぷり', fmt(r2)); }
  eq(r1.sound, c2.sound, 'rest を書かないときは「ふつう」と同じ');
  ok(r1.sound > 0.62 && r1.sound < 0.80, 'ふつう：鳴っている拍の割合が、ねらい（7割前後）から外れている：' + r1.sound);
  ok(r0.sound > r1.sound + 0.07 && r1.sound > r2.sound + 0.06, 'ブレイクの多さの順に、鳴っている拍が減っていない：' + [r0, r1, r2].map(r => r.sound.toFixed(3)).join(' > '));
  ok(r1.rests4 > 1.15, 'ふつう：1拍以上の休みが、4小節に1回ほどしかない：' + r1.rests4);
  ok(r1.avgRun < 8.5 && r1.longest <= 20, 'ふつう：弾きつづけが長い（平均 ' + r1.avgRun + ' 拍・最長 ' + r1.longest + ' 拍）');
  ok(r0.longest <= 28, '少なめ：弾きつづけが長すぎる（最長 ' + r0.longest + ' 拍）');
  ok(r2.barRests4 > r0.barRests4 + 0.3, 'たっぷり：1小節ぶんの大きなブレイクが増えていない：' + r0.barRests4 + ' → ' + r2.barRests4);
  ok(r1.trimmed > 10, '最後の長い音を短く切る息継ぎが、使われていない：' + r1.trimmed);
}
// 息継ぎで最後の音を短く切ったとき：1拍は残る。切ったぶんは1拍。そのあとは1拍以上あく
{
  let trimmed = 0;
  for (const name of ['251', 'autumn', 'blues', 'tritone', 'minor251']) {
    const b = build(CHARTS[name]);
    for (let seed = 1; seed <= 10; seed++) {
      const solo = S.generate(b.hs, b.an, { seed, level: 1 + seed % 2, bpb: 4 });
      const full = S.realize(b.hs, b.an, Object.assign({}, solo, { decisions: solo.decisions.map(d => Object.assign({}, d, { trim: 0 })) }));
      solo.decisions.forEach((d, di) => {
        if (!d.trim) return;
        trimmed++;
        const last = solo.events.filter(e => e.dec === di).pop(), was = full.events.filter(e => e.dec === di).pop();
        ok(last.dur >= 1 - 1e-6, `${name} seed${seed}: 切ったあとの音が1拍より短い`);
        ok(Math.abs(was.dur - last.dur - d.trim) < 1e-6, `${name} seed${seed}: 切った長さが trim と合わない`);
        const next = solo.events.find(e => e.t > last.t + 1e-6);
        ok(!next || next.t - (last.t + last.dur) >= 1 - 1e-6, `${name} seed${seed}: 短く切ったのに、すぐ次の音が来る`);
      });
    }
  }
  ok(trimmed >= 15, '短く切る場面が少ない：' + trimmed);
}
// 差しかえ：どの候補に入れかえても、音が重ならず、コーラスをはみ出さない（同じコードの次のリックに食いこまない）
{
  let tried = 0, shared = 0;
  for (const name of ['modal', 'long-ii', 'blues', 'autumn', '251', 'sus-alt']) {
    const b = build(CHARTS[name]);
    for (let seed = 1; seed <= 6; seed++) {
      const solo = S.generate(b.hs, b.an, { seed, level: 2, bpb: 4, rest: seed % 3 });
      solo.decisions.forEach((d, di) => {
        const next = solo.decisions[di + 1];
        if (d.kind === 'single' && next && next.t < b.hs[d.i0].t0 + b.hs[d.i0].dur - 1e-6) shared++;
        S.candidates(b.hs, b.an, solo, di).forEach(l => {
          const sw = S.swap(b.hs, b.an, solo, di, l.id);
          let end = 0, bad = 0;
          for (const e of sw.events) { if (e.t < end - 1e-6 || !(e.dur >= 0.2)) bad++; end = Math.max(end, e.t + e.dur); }   // 重なり・短すぎる音（短く切った最後の音が、0 以下にならない）
          tried++;
          if (bad || end > b.total + 1e-6 || sw.decisions[di].id !== l.id) assert.fail(`${name} seed${seed}: ${d.id} → ${l.id} に差しかえると、音が重なる／はみ出す（重なり ${bad}、終わり ${end}）`);
        });
      });
    }
  }
  n += tried;
  ok(shared >= 10, '同じコードにリックが2本ある場面が出ていない（この検査の意味がなくなる）：' + shared);
  if (verbose) console.log(`差しかえ：${tried} 通り（同じコードに次のリックがある場面 ${shared}）`);
}
// とても長い1コード（16小節・32小節）：最後まで弾く（リックの本数の上限で、後ろが無音にならない）
{
  for (const bars of [16, 32]) {
    const b = build('| Dm7 |' + ' % |'.repeat(bars - 1));
    let worst = 0;
    for (let seed = 1; seed <= 10; seed++) for (const rest of [0, 1, 2]) for (const density of [0, 2]) {
      const solo = S.generate(b.hs, b.an, { seed, level: 2, rest, density, bpb: 4 });
      const end = Math.max.apply(null, solo.events.map(e => e.t + e.dur));
      worst = Math.max(worst, b.total - end);
    }
    ok(worst <= 8 + 1e-6, `${bars}小節つづく1コード：後ろが ${worst} 拍も無音になる`);
  }
}
// かたまりの最初のコードが長いとき（V7 が何小節も続いてから I へ）：手前を埋めたあとに決めた息継ぎが、取り消されない
{
  for (const text of ['| G7 | % | Cmaj7 | % |', '| G7 | % | % | % | Cmaj7 | % | % | % |']) {
    const b = build(text);
    for (const [rest, limit] of [[0, 26], [1, 18], [2, 16]]) {
      let longest = 0;
      for (let seed = 1; seed <= 40; seed++) for (const density of [0, 1, 2]) {
        const ev = S.generate(b.hs, b.an, { seed, level: 2, rest, density, bpb: 4 }).events;
        let start = ev[0].t, end = ev[0].t + ev[0].dur;
        for (const e of ev) { if (e.t - end >= 1 - 1e-6) { longest = Math.max(longest, end - start); start = e.t; } end = Math.max(end, e.t + e.dur); }
        longest = Math.max(longest, end - start);
      }
      ok(longest <= limit, `${text} ブレイク${rest}：${longest} 拍も弾きつづける（上限 ${limit}）`);
    }
  }
}
if (verbose) {
  const b = build(CHARTS['251']);
  const solo = S.generate(b.hs, b.an, { seed: 4, level: 2 });
  console.log(solo.decisions.map(d => `${d.kind}:${d.id}@${d.t}`).join('\n'));
  console.log(solo.events.map(e => `${e.t}:${T.pitchStr(e.p)}`).join(' '));
}
console.log(`solo: OK（${n}件）`);
