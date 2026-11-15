/* midiout.js の検査：MIDI で外の音源へ送る合図（ノートオン・オフ・ドラム・止める）と、その時刻
   使い方：node adlib/test/midiout.js */
const assert = require('assert');
require('../js/theory.js');
require('../js/export.js');
require('../js/synth.js');
require('../js/midiout.js');
const { MO, Au, X } = globalThis.AL;
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };
const eq = (a, b, m) => { assert.deepStrictEqual(a, b, m); n++; };

// にせの MIDI 出力と、にせの時計
let now = 1000;
MO.now = () => now;
const sent = [];
const out = { id: 'o1', name: 'IAC Driver Bus 1', send: (data, ts) => sent.push({ data: Array.from(data), ts }) };
const out2 = { id: 'o2', name: 'Other', send: () => { throw new Error('送ってはいけない'); } };
const outputs = new Map([['o1', out], ['o2', out2]]);
// node 21 以降は navigator がはじめからある（書きかえできない）ので、定義しなおす
Object.defineProperty(globalThis, 'navigator', { value: { requestMIDIAccess: () => Promise.resolve({ outputs, onstatechange: null }) }, configurable: true, writable: true });
// AudioContext の時刻 2.0 秒が、performance の 1500ms に聞こえる
const ctx = { currentTime: 2.0, getOutputTimestamp: () => ({ contextTime: 2.0, performanceTime: 1500 }) };

(async () => {
  ok(MO.supported(), 'navigator.requestMIDIAccess があれば使える');
  MO.configure({ on: true, out: 'IAC Driver Bus 1', parts: { comp: true, bass: true, solo: true, drums: true }, offset: 0 });
  ok(!MO.active(), '許可をもらう前は送らない');
  await MO.connect();
  eq(MO.outputs().map(o => o.name), ['IAC Driver Bus 1', 'Other']);
  ok(MO.active() && MO.outName() === 'IAC Driver Bus 1', '名前で送り先を選ぶ');

  // 時刻：AudioContext の 2.5 秒 → 1500 + 500 = 2000ms
  eq(MO.toPerf(ctx, 2.5), 2000);
  // getOutputTimestamp がないとき：いまの時刻から数える
  eq(MO.toPerf({ currentTime: 2.0 }, 2.5), 1500);

  // 音：チャンネル（コード 1・ベース 2・ソロ 3 → 0・1・2）、ノートオフは 2ms 早める
  sent.length = 0;
  MO.note(ctx, 'comp', 60, 70, 2.5, 3.0);
  MO.note(ctx, 'bass', 36.2, 200, 2.5, 3.0);
  MO.note(ctx, 'solo', 72, 0, 2.5, 2.5005);
  eq(sent[0], { data: [0x90, 60, 70], ts: 2000 });
  eq(sent[1], { data: [0x80, 60, 0], ts: 2498 });
  eq(sent[2].data, [0x91, 36, 127], 'ベースは 2ch。音の高さは整数、強さは 127 まで');
  eq(sent[4].data, [0x92, 72, 1], 'ソロは 3ch。強さは 1 以上');
  ok(sent[5].ts >= sent[4].ts + 5, 'とても短い音でも、オフはオンの 5ms あと以降');
  // 同じ高さの音が続くとき：前の音のオフが、次の音のオンより先
  sent.length = 0;
  MO.note(ctx, 'comp', 64, 80, 2.5, 3.0); MO.note(ctx, 'comp', 64, 80, 3.0, 3.5);
  ok(sent[1].ts < sent[2].ts, '前のノートオフ < 次のノートオン');

  // ドラム：10ch（0x99）、GM の音番号
  sent.length = 0;
  MO.drum(ctx, 'kick', 100, 2.5); MO.drum(ctx, 'snare', 90, 2.5); MO.drum(ctx, 'hhClosed', 60, 2.5); MO.drum(ctx, 'unknown-kind', 60, 2.5);
  eq(sent.filter(s => s.data[0] === 0x99).map(s => s.data[1]), [X.GM_DRUM.kick, X.GM_DRUM.snare, X.GM_DRUM.hhClosed]);
  eq(sent.length, 6, '知らない打楽器は送らない');

  // 過去の時刻は「いま」に
  sent.length = 0; now = 5000;
  MO.note(ctx, 'comp', 60, 80, 2.5, 3.0);
  ok(sent.every(s => s.ts >= 5000), '過去の時刻は送らない');
  now = 1000;

  // ずれ合わせ
  MO.configure({ on: true, out: 'IAC Driver Bus 1', offset: -40 });
  eq(MO.toPerf(ctx, 2.5), 1960);
  MO.configure({ on: true, out: 'IAC Driver Bus 1', offset: 999 });
  eq(MO.toPerf(ctx, 2.5), 2150, 'ずれ合わせは ±150ms まで');
  MO.configure({ on: true, out: 'IAC Driver Bus 1', offset: 0 });

  // 止める：4つのチャンネルにオール・ノート・オフ（CC123）
  sent.length = 0;
  MO.panic();
  eq(sent.map(s => s.data).sort(), [[0xb0, 123, 0], [0xb1, 123, 0], [0xb2, 123, 0], [0xb9, 123, 0]].sort());

  // パートの選択：チェックを外したパートは、ブラウザで鳴らす（takes が false）
  MO.configure({ on: true, out: 'IAC Driver Bus 1', parts: { comp: true, bass: false, solo: true, drums: false } });
  ok(MO.takes('comp') && MO.takes('solo') && !MO.takes('bass') && !MO.takes('drums'));
  MO.configure({ on: false, out: 'IAC Driver Bus 1', parts: { comp: true, bass: true, solo: true, drums: true } });
  ok(!MO.takes('comp') && !MO.active(), 'オフのときは何も送らない');
  // 見つからない送り先の名前：送らない（ほかの出力に勝手に送らない）
  MO.configure({ on: true, out: 'もうない装置' });
  ok(!MO.active(), '見つからない送り先には送らない');
  MO.configure({ on: true, out: 'IAC Driver Bus 1', parts: { comp: true, bass: true, solo: true, drums: true } });

  // テスト音
  sent.length = 0;
  eq(MO.test(), ['comp', 'bass', 'solo', 'drums']);
  ok(sent.some(s => s.data[0] === 0x90) && sent.some(s => s.data[0] === 0x99), 'テスト音は、コードとドラムのチャンネルにも出る');

  // 音を鳴らす部品（Engine）：MIDI で送るパートは、ブラウザでは鳴らさず、合図だけ送る。消してあるパートは送らない
  const calls = [];
  const fakeMO = { takes: p => p !== 'bass', active: () => true, note: (c, p, m) => calls.push(['note', p, m]), drum: (c, k) => calls.push(['drum', k]), panic: () => calls.push(['panic']) };
  const E = { midiOut: fakeMO, muted: { solo: true }, ctx, inst: {}, dest: () => { throw new Error('ブラウザで鳴らしてはいけない'); } };
  Au.Engine.prototype.play.call(E, 'comp', 2.5, 60, 0.5, 80);
  Au.Engine.prototype.play.call(E, 'solo', 2.5, 72, 0.5, 80);
  Au.Engine.prototype.drum.call(E, 'kick', 2.5, 100);
  eq(calls, [['note', 'comp', 60], ['drum', 'kick']], 'コード・ドラムは送る。消してあるソロは送らない');
  let synthCalled = false;
  const E2 = Object.assign({}, E, { dest: () => { synthCalled = true; return {}; } });
  try { Au.Engine.prototype.play.call(E2, 'bass', 2.5, 36, 0.5, 80); } catch (e) { /* にせの dest なので、合成の途中で止まってよい */ }
  ok(synthCalled, '送らないパート（ベース）は、ブラウザで鳴らす');
  Au.Engine.prototype.stopSession.call({ midiOut: fakeMO, session: null }, 0.05);
  eq(calls[calls.length - 1], ['panic'], '止めたとき、送り先の音も止める');

  console.log(`midiout: OK（${n}件）`);
})().catch(e => { console.error(e); process.exit(1); });
