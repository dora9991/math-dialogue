/* player.js の検査：スケジュールの時刻（ブラウザなしで、偽のエンジンに記録させて確かめる）
   ・8分シャッフル：8分音符の裏拍がずれる／3連符は動かない／16分音符のある拍は等間隔のまま
   ・付点8分＋16分だけの拍は、16分がシャッフルの裏拍の位置で鳴る（3:1 のまま硬く鳴らない）
   ・16分シャッフル：16分音符の裏だけがずれる（8分音符・3連符は動かない）
   ・伴奏（コード・ベース・ドラム）も同じノリでずれる
   使い方：node adlib/test/player.js */
const assert = require('assert');
require('../js/player.js');
const { Au } = globalThis.AL;
let n = 0;
const near = (a, b, msg) => { assert.ok(Math.abs(a - b) < 1e-3, `${msg}：${a} ≠ ${b}`); n++; };

// feel：数（8分シャッフルの強さ。古い形）か { div, r }。戻り値：鳴る位置（ノリを入れたあとの拍）と長さ
function run(parts, feel, bpm, planKey) {
  const rec = [];
  const E = { ctx: { currentTime: 0 }, play: (part, t, midi, dur) => rec.push({ part, t, midi, dur }), click() {}, drum: (kind, t) => rec.push({ part: 'drums', t, kind }) };
  const pl = new Au.Player(E), spb = 60 / (bpm || 120);
  const plan = { bpb: 4, chorusBeats: 8, chorus: () => ({ comp: parts.comp || [], bass: parts.bass || [], drums: parts.drums || [], solo: (parts.solo || []).map(e => Object.assign({ vel: 80 }, e)) }), tempo: () => bpm || 120, metronome: false };
  if (planKey === 'feel') plan.feel = () => feel; else plan.swing = () => feel;
  Object.assign(pl, { plan, bpb: 4, rangeMode: false, a: 0, b: 8, cycleBeats: 8, soloOn: true, soloCache: {}, cache: {}, spb, countIn: 0, skipBefore: 0 });
  pl.anchor = { time: 0, sbeat: 0 };
  pl.schedule(0, 8, feel);
  return rec.map(x => Object.assign({}, x, { b: x.t / spb, len: x.dur == null ? null : x.dur / spb }));
}
const beatsOf = (solo, feel, bpm) => run({ solo }, feel, bpm).filter(x => x.part === 'solo').map(x => x.b);
const ev = (...ts) => ts.map((t, i) => ({ t, dur: ts[i + 1] != null ? ts[i + 1] - t : 0.5, midi: 60 + i }));
const S8 = r => ({ div: 2, r }), S16 = r => ({ div: 4, r });

/* ---- 8分シャッフル ---- */
// 8分音符：裏拍が後ろへ（0.667）。数だけ渡す古い形でも、{div:2} でも同じ
let b = beatsOf(ev(0, 0.5, 1, 1.5, 2), 0.667);
[0, 0.667, 1, 1.667, 2].forEach((x, i) => near(b[i], x, '8分のシャッフル（古い形） ' + i));
b = beatsOf(ev(0, 0.5, 1, 1.5, 2), S8(0.667));
[0, 0.667, 1, 1.667, 2].forEach((x, i) => near(b[i], x, '8分のシャッフル ' + i));
// 強さを変える：0.58（かるい）・0.75（付点）
b = beatsOf(ev(0, 0.5, 1), S8(0.58)); near(b[1], 0.58, 'かるいシャッフル');
b = beatsOf(ev(0, 0.5, 1), S8(0.75)); near(b[1], 0.75, '付点の強さ');
// 3連符：動かない
b = beatsOf(ev(0, 1 / 3, 2 / 3, 1), S8(0.667));
[0, 1 / 3, 2 / 3, 1].forEach((x, i) => near(b[i], x, '3連符 ' + i));
// 16分の拍：等間隔。つぎの拍の8分は、ふつうにシャッフル
b = beatsOf(ev(0, 0.25, 0.5, 0.75, 1, 1.5, 2), S8(0.667));
[0, 0.25, 0.5, 0.75, 1, 1.667, 2].forEach((x, i) => near(b[i], x, '16分の拍は等間隔 ' + i));
// 8分＋16分2つ（タ・タタ）も、16分のある拍なので等間隔
b = beatsOf(ev(0, 0.5, 0.75, 1), S8(0.667));
[0, 0.5, 0.75, 1].forEach((x, i) => near(b[i], x, '8分＋16分2つ ' + i));
// 付点8分＋16分だけの拍：16分は、シャッフルの裏拍の位置で鳴る（0.75 のまま硬く鳴らない）。付点8分の長さも、そこまで
{
  const solo = [{ t: 0, dur: 0.75, midi: 60 }, { t: 0.75, dur: 0.25, midi: 62 }, { t: 1, dur: 0.5, midi: 64 }, { t: 1.5, dur: 0.5, midi: 65 }];
  for (const r of [0.6, 0.667, 0.72]) {
    const rec = run({ solo }, S8(r)).filter(x => x.part === 'solo');
    [0, r, 1, 1 + r].forEach((x, i) => near(rec[i].b, x, `付点8分＋16分（強さ ${r}） ` + i));
    // 鳴っている長さ（アーティキュレーションの係数をのぞく）：付点8分は r 拍ぶん、16分は 1 − r 拍ぶんに対応する
    assert.ok(rec[0].len < r + 1e-6 && rec[0].len > r * 0.8, '付点8分の長さ ' + rec[0].len); n++;
    assert.ok(rec[1].len < 1 - r + 1e-6 && rec[1].len > (1 - r) * 0.8, '16分の長さ ' + rec[1].len); n++;
  }
  // 強さ 0.75 なら、書いたとおり（付点8分＋16分）
  near(run({ solo }, S8(0.75)).filter(x => x.part === 'solo')[1].b, 0.75, '付点の強さでは書いたとおり');
}
// 16分のアウフタクト（拍の 3/4 から次の拍へ）も、シャッフルの裏拍の位置から入る
b = beatsOf([{ t: 0.75, dur: 0.25, midi: 60 }, { t: 1, dur: 1, midi: 62 }], S8(0.667));
[0.667, 1].forEach((x, i) => near(b[i], x, '16分のアウフタクト ' + i));
// ストレート（0.5）：すべてそのまま
b = beatsOf(ev(0, 0.25, 0.5, 0.75, 1, 1.5), S8(0.5));
[0, 0.25, 0.5, 0.75, 1, 1.5].forEach((x, i) => near(b[i], x, 'ストレート ' + i));
b = beatsOf([{ t: 0, dur: 0.75, midi: 60 }, { t: 0.75, dur: 0.25, midi: 62 }], S8(0.5));
[0, 0.75].forEach((x, i) => near(b[i], x, 'ストレートの付点8分＋16分 ' + i));
// テンポが違っても、拍で見れば同じ
b = beatsOf(ev(0, 0.25, 0.5, 0.75, 1, 1.5), S8(0.667), 200);
[0, 0.25, 0.5, 0.75, 1, 1.667].forEach((x, i) => near(b[i], x, '速いテンポ ' + i));

/* ---- 16分シャッフル ---- */
// 16分音符の裏（1/4・3/4）だけがずれる。8分音符（1/2）は動かない
b = beatsOf(ev(0, 0.25, 0.5, 0.75, 1, 1.5, 2), S16(0.667));
[0, 0.3333, 0.5, 0.8333, 1, 1.5, 2].forEach((x, i) => near(b[i], x, '16分シャッフル ' + i));
b = beatsOf(ev(0, 0.25, 0.5, 0.75, 1), S16(0.6));
[0, 0.3, 0.5, 0.8, 1].forEach((x, i) => near(b[i], x, '16分シャッフル（かるい） ' + i));
// 3連符は動かない
b = beatsOf(ev(0, 1 / 3, 2 / 3, 1), S16(0.667));
[0, 1 / 3, 2 / 3, 1].forEach((x, i) => near(b[i], x, '16分シャッフルの3連符 ' + i));
// 付点8分＋16分：16分は、16分の裏の位置（0.5 + 0.5r）
b = beatsOf([{ t: 0, dur: 0.75, midi: 60 }, { t: 0.75, dur: 0.25, midi: 62 }, { t: 1, dur: 1, midi: 64 }], S16(0.667));
[0, 0.8333, 1].forEach((x, i) => near(b[i], x, '16分シャッフルの付点8分＋16分 ' + i));

/* ---- 伴奏も同じノリで ---- */
{
  const parts = {
    comp: [{ t: 0, dur: 0.5, midi: 60, vel: 70 }, { t: 0.5, dur: 0.5, midi: 60, vel: 70 }, { t: 0.75, dur: 0.25, midi: 60, vel: 70 }],
    bass: [{ t: 1.5, dur: 0.5, midi: 40, vel: 80 }, { t: 2.25, dur: 0.25, midi: 40, vel: 80 }],
    drums: [{ t: 0.25, kind: 'hhClosed', vel: 60 }, { t: 0.5, kind: 'hhClosed', vel: 60 }, { t: 3.5, kind: 'snare', vel: 60 }, { t: 3.75, kind: 'snare', vel: 60 }],
  };
  let rec = run(parts, S8(0.667), 120, 'feel');
  near(rec.filter(x => x.part === 'comp')[1].b, 0.667, 'コードの裏拍（8分シャッフル）');
  near(rec.filter(x => x.part === 'bass')[0].b, 1.667, 'ベースの裏拍（8分シャッフル）');
  near(rec.filter(x => x.part === 'drums')[1].b, 0.667, 'ドラムの裏拍（8分シャッフル）');
  rec = run(parts, S16(0.667), 120, 'feel');
  near(rec.filter(x => x.part === 'comp')[1].b, 0.5, 'コードの8分（16分シャッフルでは動かない）');
  near(rec.filter(x => x.part === 'comp')[2].b, 0.8333, 'コードの16分の裏（16分シャッフル）');
  near(rec.filter(x => x.part === 'bass')[1].b, 2.3333, 'ベースの16分の裏（16分シャッフル）');
  near(rec.filter(x => x.part === 'drums')[0].b, 0.3333, 'ドラムの16分の裏（16分シャッフル）');
  near(rec.filter(x => x.part === 'drums')[3].b, 3.8333, 'ドラムの16分の裏（4拍目）');
  rec = run(parts, S8(0.5), 120, 'feel');
  near(rec.filter(x => x.part === 'drums')[0].b, 0.25, 'ストレートのドラム');
}

/* ---- 行きと帰り（位置の表示に使う）：feelUnmap(feelMap(b)) = b ---- */
for (const feel of [S8(0.6), S8(0.667), S8(0.75), S16(0.58), S16(0.667), S8(0.5)]) {
  for (const x of [0, 0.1, 0.25, 0.4, 0.5, 0.6, 0.75, 0.9, 1, 1.25, 2.5, 3.75, 7.99]) near(Au.feelUnmap(Au.feelMap(x, feel), feel), x, `行きと帰り div${feel.div} r${feel.r} x${x}`);
  // 順番は入れかわらない（3連符の位置は動かさないので、3連符でない位置だけで見る）
  let prev = -1;
  for (let k = 0; k <= 32; k++) { const y = Au.feelMap(k / 8, feel); assert.ok(y > prev - 1e-9, '順番が入れかわった'); prev = y; n++; }
}

/* ---- markFeel：拍ごとの印 ---- */
{
  const m = Au.markFeel(ev(0, 0.25, 0.5, 1, 1.5, 2.75, 3, 3.5, 3.75));
  assert.deepStrictEqual(m.map(e => e.sm), ['s', 's', 's', 'n', 'n', 'd', 's', 's', 's']); n++;
  assert.deepStrictEqual(m.map(e => e.straight), [true, true, true, false, false, false, true, true, true]); n++;
  // 終わりの位置の印：1.5 から 2.75 までのびる音は、終わりが「付点の拍」にある
  assert.strictEqual(m[4].em, 'd'); n++;
  // 3連符は印に関係しない
  assert.deepStrictEqual(Au.markFeel(ev(0, 1 / 3, 2 / 3, 1)).map(e => e.sm), ['n', 'n', 'n', 'n']); n++;
}
console.log(`player: OK（${n}件）`);
