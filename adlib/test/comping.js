/* comping.js の検査：ボイシング・ベースライン・ドラムが音楽的に破綻していないか
   使い方：node adlib/test/comping.js */
const assert = require('assert');
['theory', 'chart', 'comping', 'synth', 'export'].forEach(f => require('../js/' + f + '.js'));
const { T, C, B, Au, X } = globalThis.AL;
// 打楽器の名前：音づくり（synth.js）と、MIDI 書き出し（export.js）の両方にあること
const KINDS = new Set(Object.keys(Au.DRUMS).filter(k => X.GM_DRUM[k] != null));
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
  // 各コードの頭（0.7拍以内）に音がある（アンティシペーションを除く）。
  // レゲエの裏打ち・ソウルのギターの2・4拍のように、わざと頭を空けるスタイルは別（下で確かめる）
  const offbeatOnly = kind !== 'pad' && (style === 'reggae' || (style === 'soul' && kind === 'guitar'));
  if (!offbeatOnly) for (const s of slots) ok(out.comp.some(e => e.t >= s.t0 - 0.3 && e.t < s.t0 + 0.7), `${style}/${kind}: コード${s.src}の頭に音がない t0=${s.t0}`);
  else ok(!out.comp.some(e => { const f = e.t - Math.floor(e.t / 4 + 1e-6) * 4; return f < 0.3 || (f > 1.9 && f < 2.3); }), `${style}/${kind}: 1・3拍目の頭に和音が鳴っている`);
  ok(out.bass.length > 0, `${style}: ベース`);
  ok(out.bass.every(b => b.midi >= 28 && b.midi <= 55 && b.dur > 0 && isFinite(b.t) && b.t >= 0 && b.t < out.total), `${style}: ベースの音域・時間`);
  ok(out.drums.length > 0, `${style}: ドラム`);
  ok(out.drums.every(d => d.t >= 0 && d.t < out.total), `${style}: ドラム t`);
  ok(out.drums.every(d => KINDS.has(d.kind)), `${style}: 知らない打楽器 ` + out.drums.filter(d => !KINDS.has(d.kind)).map(d => d.kind)[0]);
}
/* ---- スタイルの表：楽器・ノリ・見出しがそろっている ---- */
{
  const groups = new Set(B.STYLE_GROUPS.map(g => g.id));
  for (const [id, sd] of Object.entries(B.STYLES)) {
    ok(sd.id === id && groups.has(sd.group) && sd.jp && sd.en && sd.note, `${id}: 表の項目が足りない`);
    ok(sd.tempo[1] <= sd.tempo[0] && sd.tempo[0] <= sd.tempo[2], `${id}: テンポの範囲`);
    ok(sd.swing >= 0.5 && sd.swing <= 0.75, `${id}: ハネの強さ`);
    ok(sd.inst && sd.inst.comp && sd.inst.bass && sd.inst.drums, `${id}: おすすめの楽器`);
  }
  eq(B.feelKindOf(B.STYLES.swing), 's8'); eq(B.feelKindOf(B.STYLES.shuffle), 's8'); eq(B.feelKindOf(B.STYLES.hiphop), 's16'); eq(B.feelKindOf(B.STYLES.rock8), 'even'); eq(B.feelKindOf(B.STYLES.bossa), 'even');
  ok(Object.keys(B.STYLES).length >= 16, 'スタイルの数 ' + Object.keys(B.STYLES).length);
}
/* ---- ジャズ以外のスタイル：それぞれの「らしさ」 ---- */
{
  const at = (list, t) => list.filter(e => Math.abs(e.t - t) < 0.02);
  const kindsAt = (out, t) => at(out.drums, t).map(d => d.kind);
  const TEXT = '| C7 | % | F7 | % | G7 | F7 | C7 | G7 |';
  // ロック：ハイハットの8分、スネアは2・4拍、キックは1拍目。ベースは根音の8分
  {
    const { out } = gen(TEXT, 'rock8');
    for (let bar = 0; bar < 8; bar++) {
      const d = out.drums.filter(e => e.t >= bar * 4 && e.t < bar * 4 + 4);
      ok(kindsAt(out, bar * 4).includes('kick'), 'ロック：1拍目のキック（' + bar + '小節目）');
      if (!d.some(e => e.kind.startsWith('tom'))) { ok(kindsAt(out, bar * 4 + 1).includes('snare') && kindsAt(out, bar * 4 + 3).includes('snare'), 'ロック：2・4拍のスネア'); eq(d.filter(e => e.kind === 'hhClosed').length, 8, 'ロック：ハイハットの8分'); }
    }
    const b0 = out.bass.filter(b => b.t < 4);
    eq(b0.map(b => b.t), [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5], 'ロック：ベースの8分');
    ok(b0.slice(0, 7).every(b => mod(b.midi, 12) === 0), 'ロック：ベースは根音');
  }
  // シャッフル：ベースは同じ音を2つずつ（長・短）で、根音・3度・5度・6度
  {
    const { out } = gen(TEXT, 'shuffle');
    const b0 = out.bass.filter(b => b.t < 4);
    eq(b0.map(b => b.t), [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5], 'シャッフル：ベースは8分（鳴らすときにハネる）');
    eq(b0.map(b => mod(b.midi, 12)), [0, 0, 4, 4, 7, 7, 9, 9], 'シャッフル：根音・3度・5度・6度を2つずつ');
    const b1 = out.bass.filter(b => b.t >= 4 && b.t < 8);
    eq(b1.map(b => mod(b.midi, 12)), [10, 10, 9, 9, 7, 7, 4, 4], 'シャッフル：同じコードの2小節目は ♭7 から降りる');
    ok(b0.every((b, i) => i % 2 === 0 || b.dur < b0[i - 1].dur), 'シャッフル：裏の音は短い');
    eq(B.STYLES.shuffle.swing, 2 / 3, 'シャッフルの標準は3連符のハネ');
  }
  // スロー・ブルース（12/8）：ハイハットが3連符の位置
  {
    const { out } = gen(TEXT, 'slowblues');
    const hh = out.drums.filter(e => e.kind === 'hhClosed' && e.t < 4);
    ok(hh.length >= 9 && hh.some(e => Math.abs(e.t - 1 / 3) < 1e-6) && hh.some(e => Math.abs(e.t - 2 / 3) < 1e-6), '12/8：ハイハットの3連符');
    ok(out.bass.filter(b => b.t < 4).slice(0, 4).map(b => mod(b.midi, 12)).join() === '0,4,7,9', '12/8：ベースは4分音符のブギー');
  }
  // ソウル：スネアの4つ打ちとタンバリン
  {
    const { out } = gen(TEXT, 'soul');
    ok([0, 1, 2].every(t => kindsAt(out, t).includes('snare')), 'ソウル：スネアの4つ打ち');
    ok(out.drums.some(d => d.kind === 'tambourine'), 'ソウル：タンバリン');
  }
  // ヒップホップ：16分のハイハット、スネアは2・4拍。標準のノリは16分シャッフル
  {
    const { out } = gen(TEXT, 'hiphop');
    eq(out.drums.filter(e => e.kind === 'hhClosed' && e.t < 4).length, 16, 'ヒップホップ：16分のハイハット');
    ok(kindsAt(out, 1).includes('snare') && kindsAt(out, 3).includes('snare') && kindsAt(out, 1).includes('clap'), 'ヒップホップ：2・4拍のスネアと手拍子');
    eq(B.STYLES.hiphop.sdiv, 4);
  }
  // ディスコ：キックの4つ打ち、裏拍のオープン・ハイハット、ベースはオクターブ
  {
    const { out } = gen(TEXT, 'disco');
    ok([0, 1, 2, 3, 4, 5, 6, 7].every(t => kindsAt(out, t).includes('kick')), 'ディスコ：キックの4つ打ち');
    ok([0.5, 1.5, 2.5].every(t => kindsAt(out, t).includes('hhOpen')), 'ディスコ：裏拍のオープン・ハイハット');
    const b0 = out.bass.filter(b => b.t < 3.4);
    ok(b0.every((b, i) => i === 0 || Math.abs(b.midi - b0[i - 1].midi) === 12), 'ディスコ：ベースはオクターブ ' + b0.map(b => b.midi));
  }
  // レゲエ：ドラムは3拍目にだけ落ちる（1拍目は空）。和音は2・4拍
  {
    const { out } = gen(TEXT, 'reggae');
    ok(out.drums.filter(d => d.kind === 'kick').every(d => Math.abs(d.t % 4 - 2) < 0.02), 'レゲエ：キックは3拍目だけ');
    ok(!out.comp.some(e => e.t % 4 < 0.3), 'レゲエ：1拍目に和音が鳴っている');
    ok(out.comp.some(e => Math.abs(e.t % 4 - 1) < 0.1) && out.comp.some(e => Math.abs(e.t % 4 - 3) < 0.1), 'レゲエ：2・4拍の裏打ち');
  }
  // サンバ：ベースは 根音・5度｜5度・次の根音
  {
    const { out } = gen('| C7 | F7 | C7 | F7 |', 'samba');
    const b0 = out.bass.filter(b => b.t < 4);
    eq(b0.map(b => b.t), [0, 1.5, 2, 3.5], 'サンバ：ベースの位置');
    eq(b0.map(b => mod(b.midi, 12)), [0, 7, 7, 5], 'サンバ：根音・5度・5度・次の根音');
    ok(out.drums.some(d => d.kind === 'shaker'), 'サンバ：シェイカー');
  }
  // サルサ：2-3 のクラーベ。ベースは2拍目の裏に5度、4拍目に次の小節の根音を先取り
  {
    const { out } = gen('| C7 | F7 | C7 | F7 |', 'salsa');
    const clave = out.drums.filter(d => d.kind === 'clave' && d.t < 8).map(d => d.t);
    eq(clave, [1, 2, 4, 5.5, 7], 'サルサ：2-3 のクラーベ');
    ok(out.drums.some(d => d.kind === 'cowbell') && out.drums.some(d => d.kind === 'congaLo'), 'サルサ：カウベルとコンガ');
    const b0 = out.bass.filter(b => b.t < 4);
    eq(b0.map(b => b.t), [0, 1.5, 3], 'サルサ：ベースの位置（曲の頭だけ1拍目）');
    eq(b0.map(b => mod(b.midi, 12)), [0, 7, 5], 'サルサ：根音・5度・次の小節の根音（先取り）');
    eq(out.bass.filter(b => b.t >= 4 && b.t < 8).map(b => b.t), [5.5, 7], 'サルサ：2小節目からは1拍目を弾かない');
  }
  // ポップ・バラード：サイドスティックが2・4拍
  {
    const { out } = gen(TEXT, 'popballad');
    ok(kindsAt(out, 1).includes('sidestick') && kindsAt(out, 3).includes('sidestick'), 'ポップ・バラード：2・4拍のリム');
  }
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
/* ---- 点検で見つかったもの ---- */
{
  // サンバ：1小節に2つコードがあるとき、2つ目のコードも、そのコードの根音から始まる（5度から始めない）
  const { out } = gen('| Dm7 G7 | Cmaj7 A7 |', 'samba');
  const at = t => out.bass.find(b => Math.abs(b.t - t) < 1e-6);
  eq([0, 2, 4, 6].map(t => at(t) && mod(at(t).midi, 12)), [2, 7, 0, 9], 'サンバ：2拍ずつのコードの頭は、どれも根音');
  eq([1.5, 3.5, 5.5].map(t => at(t) && mod(at(t).midi, 12)), [7, 0, 9], 'サンバ：裏で、次のコードの根音へ');
  // スロー・ブルース：ベースの音どうしが重ならない（4拍目の音と、3連符3つ目の接近音）
  const sb = gen('| C7 | F7 | C7 | G7 |', 'slowblues').out.bass;
  let overlap = 0;
  for (let i = 1; i < sb.length; i++) if (sb[i].t < sb[i - 1].t + sb[i - 1].dur - 1e-6) overlap++;
  eq(overlap, 0, 'スロー・ブルース：ベースの音が重なる');
  ok(sb.some(b => Math.abs(b.t % 1 - 2 / 3) < 1e-6), 'スロー・ブルース：3連符3つ目の接近音がある');
  // 伴奏の音の位置（t）は、楽譜どおりの拍の位置。ロールやゆらぎは off に分けてある
  //   （t に混ぜると、3連符の位置の音がシャッフルの式でずらされて、ハイハットと合わなくなる）
  const Au = require('../js/player.js').Au;
  for (const style of Object.keys(B.STYLES)) for (const kind of ['piano', 'guitar', 'organ']) {
    const o = gen('| C7 | F7 | Dm7 G7 | C7 |', style, { comp: kind }).out;
    const onGrid = t => Math.abs(t * 12 - Math.round(t * 12)) < 1e-6;
    ok(o.comp.every(e => onGrid(e.t)) && o.bass.every(e => onGrid(e.t)), `${style}/${kind}：コード・ベースの t が拍の位置（1/12 拍の刻み）にない`);
    ok(o.comp.concat(o.bass).every(e => e.off == null || (Math.abs(e.off) < 0.2 && e.t + e.off >= -1e-9)), `${style}/${kind}：off が大きすぎる／0 より前に出る`);
  }
  {
    // スロー・ブルース（3連符のノリ）：コードの3連符の位置は、ノリを入れても動かない（ハイハットと同じ位置で鳴る）
    const o = gen('| C7 | F7 | C7 | G7 |', 'slowblues').out, feel = { div: 2, r: 2 / 3 };
    const trip = o.comp.filter(e => { const f = e.t % 1; return Math.abs(f - 1 / 3) < 1e-6 || Math.abs(f - 2 / 3) < 1e-6; });
    ok(trip.length > 20, 'スロー・ブルース：コードに3連符の刻みがある：' + trip.length);
    ok(trip.every(e => Math.abs(Au.feelMap(e.t, feel) - e.t) < 1e-9), 'スロー・ブルース：コードの3連符が、ノリでずれる');
    ok(o.comp.some(e => e.off), 'ゆらぎ（off）がついている');
  }
}
console.log(`comping: OK（${n}件）`);
