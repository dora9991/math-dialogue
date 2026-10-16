/* comping.js の検査：ボイシング・ベースライン・ドラムが音楽的に破綻していないか
   使い方：node adlib/test/comping.js */
const assert = require('assert');
['theory', 'chart', 'comping'].forEach(f => require('../js/' + f + '.js'));
const { T, C, B } = globalThis.AL;
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepStrictEqual(a, b, m); n++; };
const mod = T.mod;

/* ---- ボイシング：3度と7度を含む／音域内／前と近い ---- */
{
  const R = [52, 75];
  const cases = { 'Cmaj7': [4, 11], 'Dm7': [3, 10], 'G7': [4, 10], 'Bm7b5': [3, 10], 'F#m7b5': [3, 10], 'C6': [4, 9], 'G7b9': [4, 10], 'G7alt': [4, 10], 'C7sus4': [5, 10], 'Cdim7': [3, 9], 'Cm(maj7)': [3, 11], 'Cm6': [3, 9], 'Bb7#11': [4, 10], 'A7b13': [4, 10], 'Ebmaj7#11': [4, 11] };
  for (const [sym, need] of Object.entries(cases)) {
    const c = T.parseChord(sym);
    const v = B.voice(c, null, R, false);
    ok(v.length >= 3, `${sym}: 音が少ない`);
    ok(v.every(m => m >= R[0] && m <= R[1]), `${sym}: 音域外 ${v}`);
    const pcs = v.map(m => mod(m - c.rootPc, 12));
    need.forEach(s => ok(pcs.includes(s), `${sym}: 半音${s}の音がない ${pcs}`));
    ok(v.every((m, i) => i === 0 || m > v[i - 1]), `${sym}: 昇順でない`);
  }
  // alt は #9 / b13 を含み、natural 5th は含まない
  const alt = T.parseChord('G7alt'), va = B.voice(alt, null, R, false).map(m => mod(m - alt.rootPc, 12));
  ok(va.includes(3) && va.includes(8) && !va.includes(7), 'G7alt のボイシング ' + va);
  // 3-5-♭7-9 の滑らかな進行（Dm7 → G7 → Cmaj7）：声部の動きの合計が小さい
  let prev = null, total = 0;
  for (const s of ['Dm7', 'G7', 'Cmaj7', 'Am7', 'D7', 'Gmaj7']) {
    const v = B.voice(T.parseChord(s), prev, R, false);
    if (prev) total += v.reduce((a, m, i) => a + Math.abs(m - prev[i]), 0);
    prev = v;
  }
  ok(total <= 20, 'ボイスリーディングが大きく動きすぎ：' + total);
  // スラッシュコードは根音も鳴る
  const sl = T.parseChord('C/E'), vs = B.voice(sl, null, R, false).map(m => mod(m, 12));
  ok(vs.includes(0), 'C/E に根音');
}

const gen = (text, style, extra) => {
  const ch = C.parse(text, { beatsPerBar: (extra && extra.bpb) || (B.STYLES[style].bpb) });
  assert.deepStrictEqual(ch.errors, []);
  const slots = C.slotsOf(ch);
  return { ch, slots, out: B.generate(slots, Object.assign({ style, seed: 3 }, extra || {})) };
};

/* ---- スウィング：ベースは4分音符、拍頭がルート、次のルートへ半音で入る ---- */
{
  const { slots, out } = gen('| Dm7 | G7 | Cmaj7 | % |', 'swing');
  eq(out.bass.length, 16, 'ベースは4分音符 4×4小節');
  // 各小節の1拍目が、そのコードのルート
  const rootAt = t => { const s = slots.slice().reverse().find(x => t >= x.t0 - 1e-6); return s.chord.rootPc; };
  out.bass.filter(b => b.t % 4 < 1e-6).forEach(b => eq(mod(b.midi, 12), rootAt(b.t), '小節頭はルート t=' + b.t));
  // 小節の最後の音が、次のコードのルートに近い（半音か全音）
  let app = 0, tot = 0;
  for (let bar = 0; bar < 3; bar++) {
    const last = out.bass.find(b => Math.abs(b.t - (bar * 4 + 3)) < 0.05), nxt = out.bass.find(b => Math.abs(b.t - ((bar + 1) * 4)) < 0.05);
    tot++; if (Math.abs(last.midi - nxt.midi) <= 2) app++;
    if (nxt.midi === last.midi) ok(false, '同じ音で連続');
  }
  ok(app >= 2, '次のルートへの接近音が少ない ' + app + '/' + tot);
  ok(out.bass.every(b => b.midi >= 28 && b.midi <= 52), 'ベースの音域');
  ok(out.drums.some(d => d.kind === 'ride') && out.drums.some(d => d.kind === 'hhPedal'), 'ドラムにライドとハイハット');
  // 2コード/小節でも、各コードの頭にベースがある
  const two = gen('| Dm7 G7 | Cmaj7 | Em7 A7 | Dm7 G7 |', 'swing');
  const b2 = two.out.bass.find(b => Math.abs(b.t - 2) < 0.05);
  eq(b2 && mod(b2.midi, 12), 7, '3拍目から始まるコード G7 のルート');
  eq(two.out.bass.length, 16);
}
/* ---- コンピング：各コードの頭で鳴る／時間はコーラスの内側 ---- */
for (const style of Object.keys(B.STYLES)) for (const kind of ['piano', 'guitar', 'organ', 'pad', 'ep', 'vibes']) {
  const bpb = B.STYLES[style].bpb;
  const text = bpb === 3 ? '| Dm7 | G7 | Cmaj7 | % |' : '| Dm7 G7 | Cmaj7 | Am7 | D7b9 | Gmaj7 | C#m7b5 F#7 | Bm7 | % |';
  const { slots, out } = gen(text, style, { kind });
  ok(out.comp.length > 0, `${style}/${kind}: コンピングが空`);
  ok(out.comp.every(e => e.t >= -0.05 && e.t < out.total + 0.01), `${style}/${kind}: 範囲外 t`);
  ok(out.comp.every(e => e.dur > 0 && e.vel > 20 && e.vel < 127), `${style}/${kind}: dur/vel`);
  // 各コードの頭（0.7拍以内）に音がある（アンティシペーションを除く）
  for (const s of slots) ok(out.comp.some(e => e.t >= s.t0 - 0.3 && e.t < s.t0 + 0.7), `${style}/${kind}: コード${s.src}の頭に音がない t0=${s.t0}`);
  ok(out.bass.length > 0, `${style}: ベース`);
  ok(out.drums.length > 0, `${style}: ドラム`);
  ok(out.drums.every(d => d.t >= 0 && d.t < out.total), `${style}: ドラム t`);
}
/* ---- ボサノバのベース：ルート・5度 ---- */
{
  const { out } = gen('| Dm7 | G7 | Cmaj7 | % |', 'bossa');
  const b0 = out.bass.filter(b => b.t < 4);
  eq(b0.map(b => b.t), [0, 1.5, 2, 3.5]);
  eq(mod(b0[1].midi - b0[0].midi, 12), 7, '5度');
}
/* ---- N.C. は伴奏が止まる ---- */
{
  const { out } = gen('| Dm7 | N.C. | Cmaj7 |', 'swing');
  ok(!out.comp.some(e => e.t >= 4 && e.t < 7.9 && e.t < 8), 'N.C. で和音が鳴っている');
  ok(!out.bass.some(e => e.t >= 4 && e.t < 8), 'N.C. でベースが鳴っている');
}
/* ---- 同じ種は同じ結果／違う種は違う結果 ---- */
{
  const a = gen('| Dm7 | G7 | Cmaj7 | % |', 'swing', { seed: 5 }).out, b = gen('| Dm7 | G7 | Cmaj7 | % |', 'swing', { seed: 5 }).out, c = gen('| Dm7 | G7 | Cmaj7 | % |', 'swing', { seed: 6 }).out;
  eq(a.bass, b.bass); eq(a.comp, b.comp);
  ok(JSON.stringify(a.comp) !== JSON.stringify(c.comp), '種を変えても同じ');
}
console.log(`comping: OK（${n}件）`);
