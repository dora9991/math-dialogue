/* アドリブ・ラボ：MIDI で外の音源（Kontakt など）へ送る（Web MIDI）。
   ・チェックしたパートは、ブラウザでは鳴らさず、音の「合図」（ノートオン・オフ）を MIDI で送る。音は受けた側（Kontakt など）が出す。
   ・チャンネルは MIDI の書き出しと同じ：コード 1・ベース 2・ソロ 3・ドラム 10（ドラムは GM の並び：キック 36・スネア 38…）。
   ・再生は、音を少し先まで予約して鳴らしている（player.js）。MIDI も「この時刻に」と時刻つきで送るので、ノリ（シャッフル）はそのまま出る。
   ・Chrome・Edge で使える（Safari・iPhone は Web MIDI がない）。
   画面からは App.setMidi、音の予約からは Engine.play／drum（synth.js）が呼ぶ。 */
(function () {
  'use strict';
  const root = typeof window !== 'undefined' ? window : globalThis;
  const AL = (root.AL = root.AL || {});
  const MO = (AL.MO = AL.MO || {});

  // パートごとの MIDI チャンネル（0 始まり）
  MO.CH = { comp: 0, bass: 1, solo: 2, drums: 9 };
  MO.PARTS = ['comp', 'bass', 'solo', 'drums'];
  const S = (MO.state = { access: null, out: null, outName: '', on: false, parts: { comp: true, bass: true, solo: true, drums: true }, offsetMs: 0, sent: 0, error: '' });
  MO.now = () => (root.performance && root.performance.now ? root.performance.now() : Date.now());   // 検査では差しかえる
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

  MO.supported = () => typeof navigator !== 'undefined' && typeof navigator.requestMIDIAccess === 'function';

  // 設定をうつす（{ on, out（送り先の名前）, parts, offset（ms） }）
  MO.configure = function (cfg) {
    cfg = cfg || {};
    S.on = !!cfg.on;
    S.outName = typeof cfg.out === 'string' ? cfg.out : S.outName;
    if (cfg.parts) MO.PARTS.forEach(p => { S.parts[p] = cfg.parts[p] !== false; });
    S.offsetMs = clamp(+cfg.offset || 0, -150, 150);
    pickOut();
  };
  // MIDI を使う許可をもらい、送り先の一覧を作る（はじめての時は、Chrome が「MIDI デバイスの使用を許可しますか」と聞く）
  MO.connect = function () {
    if (!MO.supported()) return Promise.reject(new Error('このブラウザは MIDI の送り出しに対応していません'));
    if (S.access) { pickOut(); return Promise.resolve(MO.outputs()); }
    return navigator.requestMIDIAccess({ sysex: false }).then(acc => {
      S.access = acc; S.error = '';
      acc.onstatechange = () => { pickOut(); if (MO.onchange) MO.onchange(); };   // IAC ドライバをオンにした、などで一覧が変わったとき
      pickOut();
      return MO.outputs();
    }, e => { S.error = (e && e.message) || String(e); throw e; });
  };
  MO.outputs = () => (S.access ? Array.from(S.access.outputs.values()).map(o => ({ id: o.id, name: o.name })) : []);
  // 送り先を名前で選ぶ（id は起動しなおすと変わることがあるので、名前で覚える）。名前がなければ、最初の1つ
  function pickOut() {
    const outs = S.access ? Array.from(S.access.outputs.values()) : [];
    S.out = outs.find(o => o.name === S.outName) || (S.outName ? null : outs[0] || null);
    if (S.out && !S.outName) S.outName = S.out.name;
  }
  MO.select = function (name) { S.outName = name || ''; pickOut(); };
  MO.outName = () => (S.out ? S.out.name : '');
  MO.active = () => S.on && !!S.out;
  MO.takes = part => MO.active() && !!S.parts[part];

  // AudioContext の時刻 t（秒）→ MIDI を送る時刻（performance.now() の ms）。
  // ブラウザの音が実際に聞こえる時刻にそろえる（getOutputTimestamp）。ずれ合わせ（offsetMs）を足す
  MO.toPerf = function (ctx, t) {
    let ms = null;
    if (ctx && typeof ctx.getOutputTimestamp === 'function') {
      const ts = ctx.getOutputTimestamp();
      if (ts && ts.performanceTime > 0) ms = ts.performanceTime + (t - ts.contextTime) * 1000;
    }
    if (ms == null) ms = MO.now() + (t - (ctx ? ctx.currentTime : 0)) * 1000;
    return ms + S.offsetMs;
  };
  function send(bytes, ms) {
    if (!S.out) return;
    try { S.out.send(bytes, Math.max(MO.now(), ms)); S.sent++; } catch (e) { S.error = (e && e.message) || String(e); }
  }
  // 音を1つ（t0〜t1 は AudioContext の時刻）。ノートオフは 2ms 早めて、次の同じ高さの音のオンより先に届くようにする
  MO.note = function (ctx, part, midi, vel, t0, t1) {
    const ch = MO.CH[part];
    if (ch == null) return;
    const m = clamp(Math.round(midi), 0, 127), v = clamp(Math.round(vel), 1, 127);
    const on = MO.toPerf(ctx, t0), off = Math.max(on + 5, MO.toPerf(ctx, t1) - 2);
    send([0x90 | ch, m, v], on);
    send([0x80 | ch, m, 0], off);
  };
  // ドラム（kind：kick・snare・hhClosed…）。GM の音番号は export.js の表を使う
  MO.drum = function (ctx, kind, vel, t) {
    const map = (AL.X && AL.X.GM_DRUM) || {};
    const n = map[kind];
    if (n == null) return;
    const v = clamp(Math.round(vel), 1, 127), on = MO.toPerf(ctx, t);
    send([0x99, n, v], on);
    send([0x89, n, 0], on + 80);
  };
  // 止めたとき：受けた側で鳴っている音を、すべて止める（CC123 オール・ノート・オフ）。
  // 予約ずみでまだ届いていない合図は、取り消せるブラウザなら取り消す（できなければ、最大0.5秒ほど鳴ってから止まる）
  MO.panic = function () {
    if (!S.out) return;
    try { if (typeof S.out.clear === 'function') S.out.clear(); } catch (e) { /* 取り消せないブラウザ */ }
    const now = MO.now();
    MO.PARTS.forEach(p => send([0xb0 | MO.CH[p], 123, 0], now));
  };
  // テスト音：チェックしたパートごとに、短く鳴らす（コード＝C の和音、ベース＝C、ソロ＝G、ドラム＝キック・スネア・ハイハット）
  MO.test = function () {
    if (!S.out) return [];
    const t = MO.now() + 30, done = [];
    const play = (ch, m, at, len) => { send([0x90 | ch, m, 96], t + at); send([0x80 | ch, m, 0], t + at + len); };
    if (S.parts.comp) { [60, 64, 67].forEach(m => play(MO.CH.comp, m, 0, 700)); done.push('comp'); }
    if (S.parts.bass) { play(MO.CH.bass, 36, 0, 700); done.push('bass'); }
    if (S.parts.solo) { play(MO.CH.solo, 79, 150, 500); done.push('solo'); }
    if (S.parts.drums) { play(MO.CH.drums, 36, 0, 80); play(MO.CH.drums, 42, 250, 80); play(MO.CH.drums, 38, 500, 80); done.push('drums'); }
    return done;
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = AL;
})();
