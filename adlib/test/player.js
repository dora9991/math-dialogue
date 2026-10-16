/* player.js の検査：スケジュールの時刻（ブラウザなしで、偽のエンジンに記録させて確かめる）
   ・8分音符の裏拍はスウィングでずれる／3連符は動かない
   ・16分音符のある拍は、スウィングさせず、等間隔のまま（16分のランが不ぞろいにならない）
   使い方：node adlib/test/player.js */
const assert = require('assert');
require('../js/player.js');
const { Au } = globalThis.AL;
let n = 0;
const near = (a, b, msg) => { assert.ok(Math.abs(a - b) < 1e-3, `${msg}：${a} ≠ ${b}`); n++; };

// solo：[{ t, dur, midi }]  →  鳴る拍（スウィング後）の並び
function beatsOf(solo, r, bpm) {
  const rec = [];
  const E = { ctx: { currentTime: 0 }, play: (part, t, midi, dur) => rec.push({ part, t, midi, dur }), click() {}, drum() {} };
  const pl = new Au.Player(E), spb = 60 / (bpm || 120);
  const plan = { bpb: 4, chorusBeats: 8, chorus: () => ({ comp: [], bass: [], drums: [], solo: solo.map(e => Object.assign({ vel: 80 }, e)) }), tempo: () => bpm || 120, swing: () => r, metronome: false };
  Object.assign(pl, { plan, bpb: 4, rangeMode: false, a: 0, b: 8, cycleBeats: 8, soloOn: true, soloCache: {}, cache: {}, spb, countIn: 0, skipBefore: 0 });
  pl.anchor = { time: 0, sbeat: 0 };
  pl.schedule(0, 8, r);
  return rec.filter(x => x.part === 'solo').map(x => x.t / spb);
}
const ev = (...ts) => ts.map((t, i) => ({ t, dur: ts[i + 1] != null ? ts[i + 1] - t : 0.5, midi: 60 + i }));

// 8分音符：裏拍が後ろへ（0.667）
let b = beatsOf(ev(0, 0.5, 1, 1.5, 2), 0.667);
[0, 0.667, 1, 1.667, 2].forEach((x, i) => near(b[i], x, '8分のスウィング ' + i));
// 3連符：動かない
b = beatsOf(ev(0, 1 / 3, 2 / 3, 1), 0.667);
[0, 1 / 3, 2 / 3, 1].forEach((x, i) => near(b[i], x, '3連符 ' + i));
// 16分の拍：等間隔。つぎの拍の8分は、ふつうにスウィング
b = beatsOf(ev(0, 0.25, 0.5, 0.75, 1, 1.5, 2), 0.667);
[0, 0.25, 0.5, 0.75, 1, 1.667, 2].forEach((x, i) => near(b[i], x, '16分の拍は等間隔 ' + i));
// 付点8分＋16分も、等間隔（長短がはっきり出る）
b = beatsOf([{ t: 0, dur: 0.75, midi: 60 }, { t: 0.75, dur: 0.25, midi: 62 }, { t: 1, dur: 0.5, midi: 64 }, { t: 1.5, dur: 0.5, midi: 65 }], 0.667);
[0, 0.75, 1, 1.667].forEach((x, i) => near(b[i], x, '付点8分＋16分 ' + i));
// スウィングなし（0.5）：すべてそのまま
b = beatsOf(ev(0, 0.25, 0.5, 0.75, 1, 1.5), 0.5);
[0, 0.25, 0.5, 0.75, 1, 1.5].forEach((x, i) => near(b[i], x, 'スウィングなし ' + i));
// テンポが違っても、拍で見れば同じ
b = beatsOf(ev(0, 0.25, 0.5, 0.75, 1, 1.5), 0.667, 200);
[0, 0.25, 0.5, 0.75, 1, 1.667].forEach((x, i) => near(b[i], x, '速いテンポ ' + i));
// markStraight：拍ごとに、16分があるかで決まる
const m = Au.markStraight(ev(0, 0.25, 0.5, 1, 1.5, 2.75, 3));
assert.deepStrictEqual(m.map(e => e.straight), [true, true, true, false, false, true, false]); n++;
console.log(`player: OK（${n}件）`);
