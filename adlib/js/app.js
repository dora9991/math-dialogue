/* アドリブ・ラボ：アプリの中心。
   ・状態（コード譜・スタイル・テンポ・楽器…）の保存と復元
   ・コード譜 → 小節 → 解析 → ソロ の再計算
   ・再生の設計図（伴奏＋ソロ）づくりと、Player との接続（再生・停止・試聴・範囲くり返し）
   ・画面の下の再生バー、タブの切りかえ、共有リンク
   各タブの中身は ui-chart.js / ui-solo.js / ui-dict.js / ui-sound.js が、App.on('init'…) などで受けとって作る。 */
(function () {
  'use strict';
  const AL = (window.AL = window.AL || {});
  const { T, C, A, L, S, B, Au, N, P, U } = AL;
  const h = U.h;
  const App = (AL.App = AL.App || {});
  App.ui = App.ui || {};
  const mod = T.mod;

  /* ---------------- イベント ---------------- */
  const subs = {};
  App.on = (name, fn) => { (subs[name] = subs[name] || []).push(fn); return App; };
  App.emit = (name, arg) => { (subs[name] || []).slice().forEach(fn => { try { fn(arg); } catch (e) { console.error('[' + name + ']', e); } }); };

  /* ---------------- 状態 ---------------- */
  const FEEL = { swing: 'Swing', swing2: '2-Beat Swing', ballad: 'Ballad', bossa: 'Bossa Nova', waltz: 'Jazz Waltz', funk: 'Funk' };
  const MIX_DEF = { comp: 0.8, bass: 0.8, drums: 0.9, solo: 0.9, click: 0.5, master: 0.8 };
  const REV_DEF = { comp: 0.16, bass: 0.02, drums: 0.12, solo: 0.2 };
  const LOOP_CHOICES = [1, 2, 3, 4, 6, 8, 12, 0];   // 0 = 無限
  App.FEEL = FEEL;

  function defaults() {
    const p = P.byId[P.DEFAULT_ID];
    return {
      v: 1, presetId: p.id, title: p.title, text: p.text, style: p.style, tempo: p.tempo, swing: null,
      loops: 4, countIn: 1, click: false,
      comp: 'piano', bass: 'upright', drums: 'jazz', soloInst: 'altosax',
      mix: Object.assign({}, MIX_DEF), reverb: Object.assign({}, REV_DEF), muted: {},
      seed: 1, soloSeed: 3, level: 2, density: 1, soloMode: 'same', concert: true,
      keyOverride: null, perRow: 4, range: null, tab: 'chart', dictKey: 0,
    };
  }
  const inList = (list, v, def) => (list.indexOf(v) >= 0 ? v : def);
  const num = (v, a, b, def) => (typeof v === 'number' && isFinite(v) ? U.clamp(v, a, b) : def);
  function sanitize(s) {
    const d = defaults(), o = Object.assign({}, d, s && typeof s === 'object' ? s : {});
    o.text = typeof o.text === 'string' && o.text.trim() ? o.text.slice(0, 6000) : d.text;
    o.title = typeof o.title === 'string' ? o.title.slice(0, 80) : d.title;
    o.presetId = typeof o.presetId === 'string' ? o.presetId : '';
    o.style = B.STYLES[o.style] ? o.style : d.style;
    o.tempo = Math.round(num(o.tempo, 40, 320, B.STYLES[o.style].tempo[0]));
    o.swing = o.swing == null ? null : num(o.swing, 0.5, 0.75, null);
    o.loops = inList(LOOP_CHOICES, o.loops, 4);
    o.countIn = inList([0, 1, 2], o.countIn, 1);
    o.click = !!o.click;
    o.comp = inList(Au.INSTRUMENTS.comp.map(i => i.id), o.comp, d.comp);
    o.bass = inList(Au.INSTRUMENTS.bass.map(i => i.id), o.bass, d.bass);
    o.drums = inList(Au.INSTRUMENTS.drums.map(i => i.id), o.drums, d.drums);
    o.soloInst = inList(Au.INSTRUMENTS.solo.map(i => i.id), o.soloInst, d.soloInst);
    o.mix = Object.assign({}, MIX_DEF, o.mix && typeof o.mix === 'object' ? o.mix : {});
    Object.keys(o.mix).forEach(k => { o.mix[k] = num(o.mix[k], 0, 1.5, MIX_DEF[k]); });
    o.reverb = Object.assign({}, REV_DEF, o.reverb && typeof o.reverb === 'object' ? o.reverb : {});
    Object.keys(o.reverb).forEach(k => { o.reverb[k] = num(o.reverb[k], 0, 1, REV_DEF[k] == null ? 0 : REV_DEF[k]); });
    o.muted = o.muted && typeof o.muted === 'object' ? o.muted : {};
    o.seed = Math.round(num(o.seed, 1, 99999, 1));
    o.soloSeed = Math.round(num(o.soloSeed, 1, 99999, 3));
    o.level = inList([1, 2, 3], o.level, 2);
    o.density = inList([0, 1, 2], o.density, 1);
    o.soloMode = inList(['off', 'same', 'fresh'], o.soloMode, 'same');
    o.concert = !!o.concert;
    o.keyOverride = o.keyOverride && typeof o.keyOverride.tonicPc === 'number' && (o.keyOverride.mode === 'major' || o.keyOverride.mode === 'minor') ? { tonicPc: mod(o.keyOverride.tonicPc | 0, 12), mode: o.keyOverride.mode } : null;
    o.perRow = inList([2, 3, 4, 6, 8], o.perRow, 4);
    o.range = o.range && typeof o.range.a === 'number' && typeof o.range.b === 'number' ? { a: Math.max(0, o.range.a | 0), b: Math.max(0, o.range.b | 0) } : null;
    o.tab = inList(['chart', 'solo', 'dict', 'sound'], o.tab, 'chart');
    o.dictKey = Math.round(num(o.dictKey, 0, 11, 0));
    return o;
  }
  let st = defaults();
  App.st = st;
  const save = U.debounce(() => { U.store.set('state', st); }, 300);
  App.save = save;

  /* ---------------- 派生データ（コード譜 → 解析 → ソロ） ---------------- */
  App.swing = () => (st.swing != null ? st.swing : B.STYLES[st.style].swing);
  App.styleDef = () => B.STYLES[st.style];
  App.soloInstDef = () => Au.INSTRUMENTS.solo.find(i => i.id === st.soloInst) || Au.INSTRUMENTS.solo[0];
  App.keyLabel = key => key.name;

  // パターンの id を見やすい文字に（'ii-V-I' → 'ii–V–I'、'bII-I' → '♭II–I'）
  App.patLabel = id => String(id).replace(/#/g, '♯').replace(/\bb(?=[IV])/g, '♭').replace(/-/g, '–');

  App.derive = function () {
    const style = B.STYLES[st.style], bpb = style.bpb;
    App.bpb = bpb;
    App.chart = C.parse(st.text, { beatsPerBar: bpb });
    App.slots = C.slotsOf(App.chart);
    App.hs = C.harmonicSlots(App.slots);
    App.slot2hs = [];
    App.hs.forEach((hh, k) => hh.parts.forEach(si => { App.slot2hs[si] = k; }));
    App.an = A.analyze(App.hs, { beatsPerBar: bpb, key: st.keyOverride || undefined });
    // 譜面の小節・コードの枠 → 最初に現れる slot の番号
    App.cellSlot = App.chart.bars.map(b => b.chords.map(() => -1));
    App.slots.forEach(s => {
      const b = App.chart.bars[s.srcBar];
      const k = b.chords.findIndex(c => Math.abs(c.beat - s.beat) < 1e-6);
      if (k >= 0 && App.cellSlot[s.srcBar][k] < 0) App.cellSlot[s.srcBar][k] = s.i;
    });
    // フレーズの色分け（パターンに入っているコードに同じ色の下線を）
    App.phraseOf = [];
    let ci = 0;
    App.an.phrases.forEach((ph, pi) => {
      for (let k = 0; k < ph.n; k++) App.phraseOf[ph.from + k] = { idx: pi, match: ph.match, first: k === 0, last: k === ph.n - 1, color: ph.match ? ci % 4 : -1 };
      if (ph.match) ci++;
    });
    App._backing = {};
    App._fresh = {};
    App.hasChords = App.hs.some(x => !x.chord.nc && !x.chord.bad);
    App.makeSolo();
  };
  App.soloOpts = function () {
    const rg = S.RANGES[st.soloInst] || S.RANGES.default;
    return { seed: st.soloSeed, level: st.level, density: st.density, lo: rg[0], hi: rg[1], bpb: App.bpb };
  };
  App.makeSolo = function () {
    App.solo = S.generate(App.hs, App.an, App.soloOpts());
    App._fresh = {};
  };
  // 楽器だけ変えたとき：リックの選びはそのままで、音域に合わせて置きなおす
  App.refitSolo = function () {
    const o = Object.assign({}, App.solo.opts, { lo: App.soloOpts().lo, hi: App.soloOpts().hi });
    App.solo = S.realize(App.hs, App.an, Object.assign({}, App.solo, { opts: o }));
    App._fresh = {};
  };
  // k コーラス目のソロ（'fresh' のときは、毎回あたらしく作る）
  App.soloFor = function (k) {
    if (k === 0 || st.soloMode !== 'fresh') return App.solo;
    if (!App._fresh[k]) App._fresh[k] = S.generate(App.hs, App.an, Object.assign(App.soloOpts(), { seed: (st.soloSeed * 101 + k * 977) % 99991 + 1 }));
    return App._fresh[k];
  };
  App.backing = function (k) {
    if (!App._backing[k]) App._backing[k] = B.generate(App.slots, { style: st.style, kind: st.comp, seed: st.seed * 31 + k * 7919, bpb: App.bpb });
    return App._backing[k];
  };

  /* ---------------- 変更の窓口 ---------------- */
  function afterChartChange() {
    App.stop();
    App.sel = { hs: null, dec: null, bar: null };
    App.derive();
    if (st.range) { const n = App.chart.bars.length; if (st.range.a >= n) st.range = null; else st.range.b = Math.min(st.range.b, n - 1); }
    save();
    App.emit('chart');
    App.emit('solo');
  }
  App.sel = { hs: null, dec: null, bar: null };

  App.setText = function (text, opts) {
    st.text = text;
    if (!(opts && opts.keepPreset)) st.presetId = '';
    afterChartChange();
  };
  App.loadPreset = function (id) {
    const p = P.byId[id];
    if (!p) return;
    st.presetId = id; st.title = p.title; st.text = p.text; st.style = p.style;
    st.tempo = p.tempo; st.swing = null; st.keyOverride = null; st.range = null;
    afterChartChange();
    App.emit('settings');
  };
  App.setStyle = function (id) {
    if (!B.STYLES[id]) return;
    const nw = B.STYLES[id];
    st.style = id;
    if (st.tempo < nw.tempo[1] || st.tempo > nw.tempo[2]) st.tempo = nw.tempo[0];
    st.swing = null;
    afterChartChange();
    App.emit('settings');
  };
  App.setKeyOverride = function (k) {
    st.keyOverride = k;
    afterChartChange();
  };
  // キーを semis 半音ずらして、コード譜の文字を書きかえる
  App.transposeBy = function (semis) {
    semis = ((semis % 12) + 12) % 12;
    if (semis > 6) semis -= 12;
    if (!semis) return;
    const key = App.an.key, pc = mod(key.tonicPc + semis, 12), sp = T.keySpell(pc, key.mode);
    const ctx = { tonicPc: pc, fifths: T.keyFifths(sp, key.mode) };
    st.text = C.transposeText(st.text, semis, ctx);
    if (st.keyOverride) st.keyOverride = { tonicPc: mod(st.keyOverride.tonicPc + semis, 12), mode: st.keyOverride.mode };
    afterChartChange();
  };
  App.transposeTo = function (pc) { App.transposeBy(mod(pc - App.an.key.tonicPc, 12)); };

  App.setSoloParams = function (patch) {
    const instChanged = patch.soloInst != null && patch.soloInst !== st.soloInst;
    const regen = ['level', 'density', 'soloSeed'].some(k => patch[k] != null && patch[k] !== st[k]);
    Object.assign(st, patch);
    st.soloInst = inList(Au.INSTRUMENTS.solo.map(i => i.id), st.soloInst, 'altosax');
    if (regen) App.makeSolo(); else if (instChanged) App.refitSolo();
    if (App.engine) App.engine.inst.solo = st.soloInst;
    App.sel.dec = null;
    save();
    App.emit('solo');
  };
  App.newSolo = function () { App.setSoloParams({ soloSeed: (st.soloSeed * 7 + 13 + Math.floor(Math.random() * 1000)) % 99991 + 1 }); };
  App.swapLick = function (di, lickId) {
    App.solo = S.swap(App.hs, App.an, App.solo, di, lickId);
    App._fresh = {};
    App.emit('solo');
  };
  App.rerollDecision = function (di) {
    App.solo = S.reroll(App.hs, App.an, App.solo, di, Math.floor(Math.random() * 1e9));
    App._fresh = {};
    App.emit('solo');
  };
  App.set = function (patch, evt) { Object.assign(st, patch); save(); App.emit(evt || 'settings'); };
  App.setBacking = function (patch) {
    Object.assign(st, patch);
    App._backing = {};
    if (App.engine) { App.engine.inst.comp = st.comp; App.engine.inst.bass = st.bass; App.engine.inst.drums = st.drums; }
    save();
    App.emit('settings');
  };
  App.select = function (patch) { Object.assign(App.sel, patch); App.emit('sel'); };
  App.setRange = function (r) { st.range = r; save(); App.emit('range'); };

  /* ---------------- オーディオ ---------------- */
  App.playKind = null;   // 'main'（コード譜の再生）| 'preview'（リック・スケールの試聴）| null
  App.previewId = null;
  function setPlayKind(kind, id) { App.playKind = kind; App.previewId = id || null; App.emit('playstate', kind); }

  App.ensureAudio = function () {
    if (!App.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) throw new Error('このブラウザは音の合成（Web Audio）に対応していません');
      // iPhone の消音スイッチがオンでも鳴らす（Safari 16.4 以降）
      try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* 対応していないブラウザ */ }
      App.ctx = new AC({ latencyHint: 'interactive' });
      App.engine = new Au.Engine(App.ctx);
      App.player = new Au.Player(App.engine);
      App.player.on('stop', () => { stopFrames(); setPlayKind(null); }).on('end', () => { stopFrames(); setPlayKind(null); });
    }
    if (App.ctx.state !== 'running') { const p = App.ctx.resume(); if (p && p.catch) p.catch(() => {}); }
    App.applyAudio();
    return App.engine;
  };
  App.applyAudio = function () {
    const E = App.engine;
    if (!E) return;
    E.inst.comp = st.comp; E.inst.bass = st.bass; E.inst.drums = st.drums; E.inst.solo = st.soloInst;
    Object.keys(st.mix).forEach(k => { if (E.mix[k] !== st.mix[k]) E.setVolume(k, st.mix[k]); });
    Object.keys(st.reverb).forEach(k => App.setReverb(k, st.reverb[k]));
    ['comp', 'bass', 'drums', 'solo'].forEach(p => E.setMute(p, !!st.muted[p]));
  };
  App.setReverb = function (part, v) {
    const E = App.engine;
    st.reverb[part] = v;
    if (!E) return;
    E.reverb[part] = v;
    if (E.session && E.session.sends[part]) E.session.sends[part].gain.setTargetAtTime(v, E.ctx.currentTime, 0.03);
  };

  /* ---------------- 再生の設計図 ---------------- */
  App.makePlan = function () {
    return {
      bpb: App.bpb,
      chorusBeats: App.chart.chorusBeats,
      chorus: k => {
        const g = App.backing(k);
        return { comp: g.comp, bass: g.bass, drums: g.drums, solo: st.soloMode === 'off' ? [] : App.soloFor(k).events };
      },
      tempo: () => st.tempo,
      swing: () => App.swing(),
      get metronome() { return st.click; },
    };
  };
  // 範囲くり返し：選んだ小節（書いてある順）→ 演奏順の小節の範囲
  App.rangeBars = function () {
    const r = st.range;
    if (!r || !App.chart.order.length) return null;
    const a = Math.min(r.a, r.b), b = Math.max(r.a, r.b), order = App.chart.order;
    const from = order.indexOf(a);
    let to = -1;
    order.forEach((bi, p) => { if (bi === b) to = p; });
    if (from < 0 || to < 0 || to < from) return null;
    return { fromBar: from, toBar: to + 1 };
  };

  App.play = function (opts) {
    opts = opts || {};
    if (!App.hasChords) { U.toast('先に、コード譜にコードを入力してください'); return; }
    try { App.ensureAudio(); } catch (e) { U.toast(e.message); return; }
    const plan = App.makePlan();
    const rb = opts.fromBar != null ? { fromBar: opts.fromBar, toBar: opts.toBar } : App.rangeBars();
    const o = { loops: st.loops === 0 ? Infinity : st.loops, countIn: opts.countIn != null ? opts.countIn : st.countIn, solo: st.soloMode !== 'off' };
    if (opts.loops != null) o.loops = opts.loops;
    if (rb) Object.assign(o, rb);
    App.lastPlay = { range: rb };
    App.player.start(plan, o);
    setPlayKind('main');
    startFrames();
  };
  App.playFromBar = function (srcBar) {
    // 書いてある小節 → 演奏順の最初に現れる位置から、最後まで
    const p = App.chart.order.indexOf(srcBar);
    if (p < 0) return;
    App.play({ fromBar: p, toBar: App.chart.order.length });
  };
  App.stop = function () {
    if (App.player && App.playKind) { App.player.stop(); }
    stopFrames();
    if (App.playKind) setPlayKind(null);
  };
  App.toggle = function () { if (App.playKind === 'main') App.stop(); else App.play(); };
  App.setTempo = function (bpm) {
    st.tempo = Math.round(U.clamp(bpm, 40, 320));
    if (App.player && App.playKind) App.player.setTempo(st.tempo);
    save();
    App.emit('tempo');
  };

  // 試聴：chords [{src, dur}]（実際のコード）と、そのうえで鳴らすソロの音。1回だけ鳴らす
  App.playPreview = function (spec) {
    try { App.ensureAudio(); } catch (e) { U.toast(e.message); return; }
    const bpb = spec.bpb || 4;
    const slots = []; let t = 0;
    spec.chords.forEach((c, i) => {
      slots.push({ i, chord: T.parseChord(c.src), src: c.src, t0: t, dur: c.dur, bar: Math.floor(t / bpb), beat: t % bpb });
      t += c.dur;
    });
    const total = Math.max(bpb, Math.ceil(t / bpb - 1e-6) * bpb);
    const gen = B.generate(slots, { style: spec.style || 'swing', kind: st.comp, seed: 11, bpb, drums: false });
    const solo = spec.solo || [];
    const plan = {
      bpb, chorusBeats: total,
      chorus: () => ({ comp: spec.noComp ? [] : gen.comp, bass: spec.noComp ? [] : gen.bass, drums: [], solo }),
      tempo: () => spec.tempo || U.clamp(st.tempo, 70, 200), swing: () => spec.swing != null ? spec.swing : App.swing(), metronome: false,
    };
    App.emit('pos', null);   // 本再生の小節ハイライトを消す
    App.player.start(plan, { loops: 1, countIn: 0, solo: true });
    setPlayKind('preview', spec.id || null);
    startFrames();
  };

  /* ---------------- 再生中の画面更新（アニメーションフレーム） ---------------- */
  let raf = 0, lastPos = null;
  function frame() {
    raf = requestAnimationFrame(frame);
    if (!App.player || !App.playKind) return;
    const pos = App.player.position();
    if (App.playKind === 'main') {
      if (pos && !pos.countIn && lastPos && lastPos.chorus !== pos.chorus) App.emit('chorus', pos.chorus);
      lastPos = pos;
      App.emit('pos', pos);
    }
  }
  function startFrames() { lastPos = null; if (!raf) raf = requestAnimationFrame(frame); }
  function stopFrames() {
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    lastPos = null;
    App.emit('pos', null);
  }

  /* ---------------- 共有リンク ---------------- */
  App.shareHash = function () {
    const data = { t: st.text, s: st.style, p: st.tempo, ti: st.title, k: st.keyOverride };
    const json = JSON.stringify(data);
    const b64 = btoa(unescape(encodeURIComponent(json))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return '#s=' + b64;
  };
  App.shareUrl = () => location.href.split('#')[0] + App.shareHash();
  function readShare() {
    const m = /^#s=([A-Za-z0-9_-]+)$/.exec(location.hash || '');
    if (!m) return null;
    try {
      const b64 = m[1].replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(escape(atob(b64 + '==='.slice((b64.length + 3) % 4))));
      const d = JSON.parse(json);
      return { text: d.t, style: d.s, tempo: d.p, title: d.ti, keyOverride: d.k, presetId: '' };
    } catch (e) { return null; }
  }

  /* ---------------- タブ ---------------- */
  App.tab = 'chart';
  App.showTab = function (name) {
    App.tab = name; st.tab = name;
    U.$$('#tabs button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === name)));
    U.$$('main > .tab').forEach(s => { s.hidden = s.dataset.tab !== name; });
    save();
    App.emit('tab', name);
    window.scrollTo({ top: 0 });
  };

  /* ---------------- 再生バー ---------------- */
  const ICON_PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5z"/></svg>';
  const ICON_STOP = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>';
  function buildTransport() {
    const root = U.$('#transport');
    U.clear(root);
    const playBtn = h('button', { type: 'button', class: 'play', id: 'playBtn', 'aria-label': '再生', title: '再生／停止（スペースキー）', onclick: () => { if (App.playKind) App.stop(); else App.play(); } });
    playBtn.innerHTML = ICON_PLAY;
    const pos = h('div', { class: 'pos', id: 'posText', 'aria-live': 'off' }, h('b', null, '停止中'), h('span', null, ''));
    const tempoNum = h('input', { type: 'number', class: 'num', id: 'tempoNum', min: 40, max: 320, step: 1, value: st.tempo, 'aria-label': 'テンポ（1分あたりの拍数）', oninput: () => { const v = parseInt(tempoNum.value, 10); if (v >= 40 && v <= 320) App.setTempo(v); } });
    const tempoRange = h('input', { type: 'range', class: 'rng', id: 'tempoRange', min: 40, max: 320, step: 1, value: st.tempo, 'aria-label': 'テンポ', oninput: () => App.setTempo(+tempoRange.value) });
    const mkStep = (d, label) => h('button', { type: 'button', class: 'step', 'aria-label': 'テンポを' + label, onclick: () => App.setTempo(st.tempo + d) }, d > 0 ? '＋' : '－');
    const tempo = h('div', { class: 'tempo' }, h('span', { class: 'lab' }, '♩＝'), mkStep(-1, '1下げる'), tempoNum, mkStep(1, '1上げる'), tempoRange);
    const loopSel = U.select(LOOP_CHOICES.map(n => [n, n === 0 ? '∞（ずっと）' : n + '回']), st.loops, v => { st.loops = +v; save(); }, { id: 'loopSel', 'aria-label': 'くり返す回数' });
    const loops = h('label', { class: 'mini' }, h('span', { class: 'lab' }, 'くり返し'), loopSel);
    const soloSel = U.select([['same', 'ソロあり'], ['fresh', '毎回あたらしいソロ'], ['off', 'ソロなし（伴奏のみ）']], st.soloMode, v => { st.soloMode = v; if (App.player) App.player.soloOn = v !== 'off'; save(); App.emit('solo-mode'); }, { id: 'soloModeSel', 'aria-label': 'ソロの再生' });
    const soloLab = h('label', { class: 'mini' }, h('span', { class: 'lab' }, 'ソロ'), soloSel);
    root.appendChild(h('div', { class: 'transport-in' }, playBtn, pos, tempo, loops, soloLab));
    App.ui.playBtn = playBtn; App.ui.pos = pos; App.ui.tempoNum = tempoNum; App.ui.tempoRange = tempoRange; App.ui.loopSel = loopSel; App.ui.soloSel = soloSel;
  }
  function refreshTransport() {
    const playing = !!App.playKind;
    App.ui.playBtn.innerHTML = playing ? ICON_STOP : ICON_PLAY;
    App.ui.playBtn.setAttribute('aria-label', playing ? '停止' : '再生');
    App.ui.playBtn.classList.toggle('on', playing);
    if (document.activeElement !== App.ui.tempoNum) App.ui.tempoNum.value = st.tempo;
    App.ui.tempoRange.value = st.tempo;
    const sd = B.STYLES[st.style];
    App.ui.tempoRange.min = Math.min(40, sd.tempo[1]); App.ui.tempoRange.max = Math.max(320, sd.tempo[2]);
    App.ui.loopSel.value = String(st.loops);
    App.ui.soloSel.value = st.soloMode;
    if (!playing) setPosText('停止中', App.hasChords ? 'スペースキーで再生' : 'コードを入力してください');
    else if (App.playKind === 'preview') setPosText('試聴中', '■で止まります');
  }
  function setPosText(a, b) {
    const el = App.ui.pos; if (!el) return;
    el.firstChild.textContent = a; el.lastChild.textContent = b || '';
  }
  App.on('playstate', () => refreshTransport());
  App.on('tempo', () => { if (App.ui.tempoNum && document.activeElement !== App.ui.tempoNum) App.ui.tempoNum.value = st.tempo; if (App.ui.tempoRange) App.ui.tempoRange.value = st.tempo; });
  App.on('pos', pos => {
    if (App.playKind !== 'main' || !pos) return;
    if (pos.countIn) { const n = Math.floor(pos.u + st.countIn * App.bpb + 1e-9) + 1; setPosText('カウントイン', String(U.clamp(n, 1, 99))); return; }
    const total = st.loops === 0 ? '∞' : st.loops;
    setPosText('コーラス ' + (pos.chorus + 1) + ' / ' + total, '小節 ' + (pos.bar + 1) + '・' + (Math.floor(pos.beatInBar + 1e-9) + 1) + '拍');
  });
  App.on('chart', () => refreshTransport());
  App.on('settings', () => refreshTransport());
  App.on('solo-mode', () => refreshTransport());

  /* ---------------- 起動 ---------------- */
  App.init = function () {
    const saved = U.store.get('state', null);
    const shared = readShare();
    let ns = sanitize(saved);
    if (shared) ns = sanitize(Object.assign({}, ns, shared));
    Object.assign(st, ns);   // st の入れ物は同じまま、中身だけ入れかえる（ほかのファイルが持っている参照を保つ）
    App.derive();
    buildTransport();
    refreshTransport();
    App.emit('init');
    U.$$('#tabs button').forEach(b => b.addEventListener('click', () => App.showTab(b.dataset.tab)));
    App.showTab(shared ? 'chart' : st.tab);
    App.emit('chart');
    App.emit('solo');
    document.addEventListener('keydown', e => {
      if (e.code !== 'Space' || e.repeat) return;
      const tg = e.target;
      if (tg && (/^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(tg.tagName) || tg.isContentEditable)) return;
      e.preventDefault();
      App.toggle();
    });
    window.addEventListener('pagehide', () => { if (App.player) App.player.stop(true); U.store.set('state', st); });
    if (shared) U.toast('共有リンクのコード譜を開きました');
  };
  App.defaults = defaults;
  App.sanitize = sanitize;
  App.LOOP_CHOICES = LOOP_CHOICES;
})();
