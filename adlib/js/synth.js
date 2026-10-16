/* アドリブ・ラボ：音づくり（WebAudio）。サンプル音源は使わず、すべてその場で合成する。
   ・Engine … ミキサー（コンピング／ベース／ドラム／ソロ／クリックのバス）、リバーブ、マスターのコンプレッサー
   ・楽器 … ピアノ、エレピ、オルガン、ギター（弦をはじく物理モデル）、ビブラフォン、ストリングス、
            ベース（ウッド／エレキ／シンセ）、サックス（アルト／テナー）、トランペット、フルート、クラリネット、トロンボーン
   ・ドラム … キック、スネア、サイドスティック、ハイハット、ライド、クラッシュ、タム、ブラシ
   ブラウザの AudioContext でも、書き出し用の OfflineAudioContext でも同じように鳴る。 */
(function () {
  'use strict';
  const root = typeof window !== 'undefined' ? window : globalThis;
  const AL = (root.AL = root.AL || {});
  const Au = (AL.Au = AL.Au || {});
  const freq = m => 440 * Math.pow(2, (m - 69) / 12);
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

  // 楽器の一覧（画面の選択肢にも使う）
  Au.INSTRUMENTS = {
    comp: [
      { id: 'piano', jp: 'ピアノ' }, { id: 'ep', jp: 'エレピ' }, { id: 'guitar', jp: 'ジャズギター' }, { id: 'organ', jp: 'オルガン' },
      { id: 'vibes', jp: 'ビブラフォン' }, { id: 'pad', jp: 'ストリングス' },
    ],
    bass: [{ id: 'upright', jp: 'ウッドベース' }, { id: 'ebass', jp: 'エレキベース' }, { id: 'synbass', jp: 'シンセベース' }],
    solo: [
      { id: 'altosax', jp: 'アルトサックス', transpose: 9, clef: 'treble' }, { id: 'tenorsax', jp: 'テナーサックス', transpose: 14, clef: 'treble' },
      { id: 'trumpet', jp: 'トランペット', transpose: 2, clef: 'treble' }, { id: 'flute', jp: 'フルート', transpose: 0, clef: 'treble' },
      { id: 'clarinet', jp: 'クラリネット', transpose: 2, clef: 'treble' }, { id: 'trombone', jp: 'トロンボーン', transpose: 0, clef: 'bass' },
      { id: 'guitar', jp: 'ギター', transpose: 12, clef: 'treble' }, { id: 'piano', jp: 'ピアノ', transpose: 0, clef: 'treble' },
      { id: 'vibes', jp: 'ビブラフォン', transpose: 0, clef: 'treble' }, { id: 'ep', jp: 'エレピ', transpose: 0, clef: 'treble' },
    ],
    drums: [{ id: 'jazz', jp: 'ジャズ・キット' }, { id: 'brush', jp: 'ブラシ' }, { id: 'rock', jp: 'ロック・キット' }],
  };

  /* ---------------- 小道具 ---------------- */
  function lcg(seed) { let s = seed >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 2147483648 - 1; }; }
  // アタック → 減衰 → 余韻（release）。戻り値：止めてよい時刻
  function adsr(param, t, dur, a, peak, dTau, sus, rTau) {
    const end = Math.max(t + a + 0.002, t + dur);
    param.setValueAtTime(0.0001, t);
    param.linearRampToValueAtTime(Math.max(0.0002, peak), t + a);
    if (dTau > 0) param.setTargetAtTime(Math.max(0.0002, peak * sus), t + a, dTau);
    param.setTargetAtTime(0.0001, end, rTau);
    return end + rTau * 7 + 0.02;
  }
  const lowpass = (ctx, f, q) => { const b = ctx.createBiquadFilter(); b.type = 'lowpass'; b.frequency.value = f; b.Q.value = q == null ? 0.7 : q; return b; };

  /* ---------------- エンジン ---------------- */
  class Engine {
    constructor(ctx) {
      this.ctx = ctx; this.sr = ctx.sampleRate;
      this.cache = { waves: {}, ks: {}, noise: null };
      this.mix = { comp: 0.8, bass: 0.8, drums: 0.9, solo: 0.9, click: 0.5, master: 0.8 };
      this.reverb = { comp: 0.16, bass: 0.02, drums: 0.12, solo: 0.2, click: 0 };
      this.muted = {};
      this.inst = { comp: 'piano', bass: 'upright', solo: 'altosax', drums: 'jazz' };
      this.masterIn = ctx.createGain();
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -16; comp.knee.value = 12; comp.ratio.value = 3.2; comp.attack.value = 0.004; comp.release.value = 0.14;
      const shaper = ctx.createWaveShaper();
      const curve = new Float32Array(2049);
      for (let i = 0; i < curve.length; i++) { const x = (i / 1024) - 1; curve[i] = Math.tanh(x * 1.25) / Math.tanh(1.25); }
      shaper.curve = curve;
      this.master = ctx.createGain(); this.master.gain.value = this.mix.master;
      this.masterIn.connect(comp); comp.connect(shaper); shaper.connect(this.master); this.master.connect(ctx.destination);
      this.convolver = ctx.createConvolver(); this.convolver.buffer = this.makeIR(1.9, 3.4);
      const rv = ctx.createGain(); rv.gain.value = 0.9;
      this.convolver.connect(rv); rv.connect(this.masterIn);
      this.session = null;
    }
    makeIR(seconds, decay) {
      const ctx = this.ctx, len = Math.floor(this.sr * seconds), buf = ctx.createBuffer(2, len, this.sr);
      for (let ch = 0; ch < 2; ch++) {
        const d = buf.getChannelData(ch), r = lcg(7001 + ch * 31); let lp = 0;
        for (let i = 0; i < len; i++) { const e = Math.pow(1 - i / len, decay); lp += (r() - lp) * (0.55 - 0.4 * i / len); d[i] = lp * e * 1.6; }
      }
      return buf;
    }
    get noiseBuf() {
      if (!this.cache.noise) {
        const len = this.sr * 2, buf = this.ctx.createBuffer(1, len, this.sr), d = buf.getChannelData(0), r = lcg(424242);
        for (let i = 0; i < len; i++) d[i] = r();
        this.cache.noise = buf;
      }
      return this.cache.noise;
    }
    wave(name, amps) {
      if (!this.cache.waves[name]) {
        const real = new Float32Array(amps.length + 1), imag = new Float32Array(amps.length + 1);
        amps.forEach((a, i) => { imag[i + 1] = a; });
        this.cache.waves[name] = this.ctx.createPeriodicWave(real, imag);
      }
      return this.cache.waves[name];
    }
    /* ---- セッション（再生ごとのバス。止めるとき、まだ未来に予約した音もまとめて消せる） ---- */
    startSession() {
      this.stopSession(0.02);
      const ctx = this.ctx, s = { buses: {}, sends: {} };
      ['comp', 'bass', 'drums', 'solo', 'click'].forEach(p => {
        const g = ctx.createGain(); g.gain.value = this.muted[p] ? 0 : this.mix[p];
        const send = ctx.createGain(); send.gain.value = this.reverb[p];
        g.connect(this.masterIn); g.connect(send); send.connect(this.convolver);
        s.buses[p] = g; s.sends[p] = send;
      });
      this.session = s;
      return s;
    }
    stopSession(fade) {
      const s = this.session; if (!s) return;
      this.session = null;
      const t = this.ctx.currentTime, f = fade == null ? 0.06 : fade;
      Object.keys(s.buses).forEach(p => {
        try { s.buses[p].gain.cancelScheduledValues(t); s.buses[p].gain.setTargetAtTime(0, t, f / 3); } catch (e) { /* ignore */ }
      });
      const kill = () => Object.keys(s.buses).forEach(p => { try { s.buses[p].disconnect(); s.sends[p].disconnect(); } catch (e) { /* ignore */ } });
      if (this.ctx.constructor.name === 'OfflineAudioContext') return;
      setTimeout(kill, 400);
    }
    setVolume(part, v) {
      this.mix[part] = v;
      if (part === 'master') { this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.02); return; }
      if (this.session && !this.muted[part]) this.session.buses[part].gain.setTargetAtTime(v, this.ctx.currentTime, 0.02);
    }
    setMute(part, m) {
      this.muted[part] = !!m;
      if (this.session) this.session.buses[part].gain.setTargetAtTime(m ? 0 : this.mix[part], this.ctx.currentTime, 0.02);
    }
    dest(part) { if (!this.session) this.startSession(); return this.session.buses[part]; }

    /* ---- 音を鳴らす ---- */
    play(part, t, midi, dur, vel, instId) {
      const id = instId || this.inst[part];
      const fn = VOICES[id] || VOICES.piano;
      let dest = this.dest(part);
      if (part === 'solo' && SOLO_BOOST[id]) { const b = this.ctx.createGain(); b.gain.value = SOLO_BOOST[id]; b.connect(dest); dest = b; }   // 単音で弾くので、和音用の音量を持ち上げる
      fn(this, dest, t, midi, Math.max(0.03, dur), clamp(vel, 1, 127), part);
    }
    drum(kind, t, vel) {
      const fn = DRUMS[kind];
      if (fn) fn(this, this.dest('drums'), t, clamp(vel, 1, 127) / 127, this.inst.drums);
    }
    click(t, accent) {
      const ctx = this.ctx, o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = accent ? 2100 : 1500;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(accent ? 0.7 : 0.45, t + 0.002); g.gain.setTargetAtTime(0.0001, t + 0.004, 0.012);
      o.connect(g); g.connect(this.dest('click')); o.start(t); o.stop(t + 0.09);
    }
    noise(dest, t, dur, o) {
      const ctx = this.ctx, src = ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      let node = src;
      if (o.hp) { const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = o.hp; f.Q.value = 0.7; node.connect(f); node = f; }
      if (o.bp) { const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = o.bp; f.Q.value = o.q || 1; node.connect(f); node = f; }
      if (o.lp) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; f.Q.value = 0.7; node.connect(f); node = f; }
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(o.gain, t + (o.attack || 0.001));
      g.gain.setTargetAtTime(0.0001, t + (o.attack || 0.001) + (o.hold || 0), o.decay);
      node.connect(g); g.connect(dest);
      this._nzc = ((this._nzc || 0) + 0.2113) % 1.6;
      src.start(t, this._nzc); src.stop(t + (o.attack || 0.001) + (o.hold || 0) + o.decay * 7 + 0.02);
      return g;
    }
    // 弦をはじく物理モデル（カープラス・ストロング）のバッファ。音ごとに作って使いまわす
    ks(midi, kind) {
      const key = kind + midi;
      if (this.cache.ks[key]) return this.cache.ks[key];
      const sr = this.sr, f = freq(midi), N = Math.floor(sr * (kind === 'guitar' ? 2.6 : 1.8));
      const buf = this.ctx.createBuffer(1, N, sr), d = buf.getChannelData(0);
      const D = sr / f - 0.5, L = Math.max(2, Math.floor(D - 0.1)), frac = D - L, c = (1 - frac) / (1 + frac);
      const ring = new Float32Array(L), r = lcg(900 + midi * 13);
      let prev = 0;
      for (let i = 0; i < L; i++) { const x = r(); prev = prev * (kind === 'guitar' ? 0.72 : 0.5) + x * (kind === 'guitar' ? 0.28 : 0.5); ring[i] = prev; }
      // ピックの位置（くし形）で少しおだやかに
      const pick = Math.max(1, Math.floor(L * 0.18)); for (let i = L - 1; i >= pick; i--) ring[i] -= ring[i - pick] * 0.45;
      const decay = kind === 'guitar' ? clamp(0.9965 - f / 220000, 0.992, 0.9975) : 0.995;
      let idx = 0, ap = 0, apPrev = 0, peak = 0;
      for (let n = 0; n < N; n++) {
        const cur = ring[idx], nxt = ring[(idx + 1) % L];
        let y = 0.5 * (cur + nxt) * decay;
        const z = c * (y - ap) + apPrev; apPrev = y; ap = z; y = z;
        ring[idx] = y; d[n] = cur; idx = (idx + 1) % L;
        if (Math.abs(cur) > peak) peak = Math.abs(cur);
      }
      const norm = peak > 0 ? 0.9 / peak : 1;
      for (let n = 0; n < N; n++) d[n] *= norm;
      this.cache.ks[key] = buf;
      return buf;
    }
  }

  /* ---------------- 楽器 ---------------- */
  const VOICES = {};
  const SOLO_BOOST = { piano: 1.9, ep: 1.9, organ: 1.9, guitar: 1.6, vibes: 1.9, pad: 2 };
  const WAVES = {
    piano: [1, 0.72, 0.46, 0.28, 0.18, 0.11, 0.07, 0.045, 0.03, 0.02],
    sax: [1, 0.78, 0.6, 0.4, 0.33, 0.21, 0.16, 0.1, 0.08, 0.05, 0.03],
    trumpet: [1, 0.95, 0.8, 0.6, 0.45, 0.32, 0.22, 0.15, 0.1, 0.06, 0.04],
    flute: [1, 0.24, 0.07, 0.02],
    clarinet: [1, 0.03, 0.55, 0.02, 0.28, 0.02, 0.15, 0.01, 0.07],
    trombone: [1, 0.8, 0.5, 0.35, 0.25, 0.15, 0.1, 0.06],
    organ: [0.9, 0.8, 0.5, 0.4, 0.25, 0.12, 0.08],
  };
  const tone = (E, name) => E.wave(name, WAVES[name]);

  VOICES.piano = (E, dest, t, m, dur, vel) => {
    const ctx = E.ctx, f = freq(m), v = vel / 127;
    const g = ctx.createGain(), lp = lowpass(ctx, 1000, 0.6), w = tone(E, 'piano');
    const o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), g2 = ctx.createGain();
    o1.setPeriodicWave(w); o2.setPeriodicWave(w); o1.frequency.value = f; o2.frequency.value = f; o2.detune.value = 6; g2.gain.value = 0.5;
    o1.connect(g); o2.connect(g2); g2.connect(g); g.connect(lp); lp.connect(dest);
    const top = Math.min(11000, f * 8 + v * 3500), bot = Math.max(f * 2.4, 500);
    lp.frequency.setValueAtTime(top, t); lp.frequency.setTargetAtTime(bot, t + 0.01, 0.35);
    const tau = clamp(1.0 * Math.pow(261 / f, 0.5), 0.3, 2.4);
    const stop = adsr(g.gain, t, dur, 0.003, 0.19 * Math.pow(v, 1.3), tau, 0.0005, 0.1);
    o1.start(t); o2.start(t); o1.stop(stop); o2.stop(stop);
    E.noise(dest, t, 0.03, { bp: Math.min(5000, f * 3.5), q: 1.2, gain: 0.05 * v, decay: 0.012 });   // ハンマーの音
  };
  VOICES.ep = (E, dest, t, m, dur, vel) => {
    const ctx = E.ctx, f = freq(m), v = vel / 127;
    const car = ctx.createOscillator(), mod = ctx.createOscillator(), mg = ctx.createGain(), tine = ctx.createOscillator(), tg = ctx.createGain(), g = ctx.createGain();
    car.type = 'sine'; mod.type = 'sine'; tine.type = 'sine';
    car.frequency.value = f; mod.frequency.value = f; tine.frequency.value = f * 14;
    mg.gain.setValueAtTime(f * (1.1 + 2.0 * v), t); mg.gain.setTargetAtTime(f * 0.3, t, 0.3);
    tg.gain.setValueAtTime(f * 0.5 * v, t); tg.gain.setTargetAtTime(0, t, 0.04);
    mod.connect(mg); mg.connect(car.frequency); tine.connect(tg); tg.connect(car.frequency);
    car.connect(g); g.connect(dest);
    const tau = clamp(1.4 * Math.pow(261 / f, 0.4), 0.4, 2.8);
    const stop = adsr(g.gain, t, dur, 0.003, 0.17 * Math.pow(v, 1.2), tau, 0.0005, 0.13);
    [car, mod, tine].forEach(o => { o.start(t); o.stop(stop); });
  };
  VOICES.organ = (E, dest, t, m, dur, vel) => {
    const ctx = E.ctx, f = freq(m), v = vel / 127;
    const o = ctx.createOscillator(), sub = ctx.createOscillator(), sg = ctx.createGain(), g = ctx.createGain(), lp = lowpass(ctx, 5200, 0.5);
    o.setPeriodicWave(tone(E, 'organ')); o.frequency.value = f; sub.type = 'sine'; sub.frequency.value = f / 2; sg.gain.value = 0.16;
    const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 6.3; lg.gain.value = 5; lfo.connect(lg); lg.connect(o.detune);
    o.connect(g); sub.connect(sg); sg.connect(g); g.connect(lp); lp.connect(dest);
    const stop = adsr(g.gain, t, dur, 0.008, 0.09 * Math.pow(v, 0.9), 0, 1, 0.05);
    [o, sub, lfo].forEach(x => { x.start(t); x.stop(stop); });
    E.noise(dest, t, 0.02, { hp: 2500, gain: 0.015 * v, decay: 0.006 });   // キークリック
  };
  VOICES.guitar = (E, dest, t, m, dur, vel, part) => {
    const ctx = E.ctx, v = vel / 127, src = ctx.createBufferSource(), g = ctx.createGain(), lp = lowpass(ctx, part === 'solo' ? 3600 : 2600, 0.5);
    src.buffer = E.ks(m, 'guitar');
    const hold = part === 'solo' ? Math.max(dur, 0.12) : dur;
    g.gain.setValueAtTime(0.34 * Math.pow(v, 1.1), t);
    g.gain.setTargetAtTime(0.0001, t + hold, part === 'solo' ? 0.09 : 0.05);
    src.connect(lp); lp.connect(g); g.connect(dest);
    src.start(t); src.stop(t + hold + 0.5);
  };
  VOICES.vibes = (E, dest, t, m, dur, vel) => {
    const ctx = E.ctx, f = freq(m), v = vel / 127, g = ctx.createGain();
    const parts = [[1, 1, 1], [4, 0.28, 0.45], [10, 0.06, 0.15]];
    const tau = clamp(2.0 * Math.pow(261 / f, 0.4), 0.5, 3.2);
    const stop = adsr(g.gain, t, dur, 0.0015, 0.19 * Math.pow(v, 1.2), tau, 0.0005, 0.35);
    parts.forEach(([r, a, dm]) => {
      const o = ctx.createOscillator(), pg = ctx.createGain();
      o.type = 'sine'; o.frequency.value = f * r * (r === 4 ? 0.9975 : 1); pg.gain.setValueAtTime(a, t); pg.gain.setTargetAtTime(a * 0.25, t, tau * dm);
      o.connect(pg); pg.connect(g); o.start(t); o.stop(stop);
    });
    // モーターのトレモロ
    const lfo = ctx.createOscillator(), lg = ctx.createGain(), tr = ctx.createGain();
    lfo.frequency.value = 4.8; lg.gain.value = 0.18; tr.gain.value = 0.82; lfo.connect(lg); lg.connect(tr.gain);
    g.connect(tr); tr.connect(dest); lfo.start(t); lfo.stop(stop);
    E.noise(dest, t, 0.02, { hp: 3500, gain: 0.03 * v, decay: 0.01 });
  };
  VOICES.pad = (E, dest, t, m, dur, vel) => {
    const ctx = E.ctx, f = freq(m), v = vel / 127, g = ctx.createGain(), lp = lowpass(ctx, 1200 + v * 1400, 0.4);
    const stop = adsr(g.gain, t, dur, 0.3, 0.07 * Math.pow(v, 0.9), 0, 1, 0.45);
    [-9, 0, 9].forEach(d => { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = d; o.connect(g); o.start(t); o.stop(stop); });
    g.connect(lp); lp.connect(dest);
  };
  /* ---- ベース ---- */
  VOICES.upright = (E, dest, t, m, dur, vel) => {
    const ctx = E.ctx, f = freq(m), v = vel / 127, g = ctx.createGain(), lp = lowpass(ctx, 900, 0.9);
    const o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), g2 = ctx.createGain(), o3 = ctx.createOscillator(), g3 = ctx.createGain();
    o1.type = 'sine'; o1.frequency.value = f; o2.type = 'triangle'; o2.frequency.value = f; g2.gain.value = 0.55; o3.type = 'sine'; o3.frequency.value = f * 2; g3.gain.value = 0.22;
    o1.connect(g); o2.connect(g2); g2.connect(g); o3.connect(g3); g3.connect(g); g.connect(lp); lp.connect(dest);
    lp.frequency.setValueAtTime(Math.min(2600, f * 14), t); lp.frequency.setTargetAtTime(Math.max(300, f * 4), t + 0.01, 0.09);
    const stop = adsr(g.gain, t, dur, 0.006, 0.185 * Math.pow(v, 1.15), 0.34, 0.12, 0.07);
    [o1, o2, o3].forEach(o => { o.start(t); o.stop(stop); });
    E.noise(dest, t, 0.03, { lp: 900, gain: 0.07 * v, decay: 0.02 });   // 指が弦をはじく音
  };
  VOICES.ebass = (E, dest, t, m, dur, vel) => {
    const ctx = E.ctx, f = freq(m), v = vel / 127, g = ctx.createGain(), lp = lowpass(ctx, 1200, 1.1);
    const o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), g2 = ctx.createGain();
    o1.type = 'sawtooth'; o1.frequency.value = f; o2.type = 'square'; o2.frequency.value = f; o2.detune.value = 4; g2.gain.value = 0.4;
    o1.connect(g); o2.connect(g2); g2.connect(g); g.connect(lp); lp.connect(dest);
    lp.frequency.setValueAtTime(Math.min(3200, f * 16), t); lp.frequency.setTargetAtTime(Math.max(380, f * 5), t + 0.01, 0.15);
    const stop = adsr(g.gain, t, dur, 0.004, 0.14 * Math.pow(v, 1.1), 0.5, 0.35, 0.06);
    o1.start(t); o2.start(t); o1.stop(stop); o2.stop(stop);
  };
  VOICES.synbass = (E, dest, t, m, dur, vel) => {
    const ctx = E.ctx, f = freq(m), v = vel / 127, g = ctx.createGain(), lp = lowpass(ctx, 1800, 6);
    const o1 = ctx.createOscillator(), o2 = ctx.createOscillator();
    o1.type = 'sawtooth'; o1.frequency.value = f; o2.type = 'sine'; o2.frequency.value = f / 2; const sg = ctx.createGain(); sg.gain.value = 0.2;
    o1.connect(g); o2.connect(sg); sg.connect(g); g.connect(lp); lp.connect(dest);
    lp.frequency.setValueAtTime(f * 12 + 1200 * v, t); lp.frequency.setTargetAtTime(f * 2.5, t + 0.005, 0.12);
    const stop = adsr(g.gain, t, dur, 0.004, 0.12 * Math.pow(v, 1.0), 0.4, 0.5, 0.05);
    o1.start(t); o2.start(t); o1.stop(stop); o2.stop(stop);
  };
  /* ---- 管楽器 ---- */
  function wind(E, dest, t, m, dur, vel, p) {
    const ctx = E.ctx, f = freq(m), v = vel / 127;
    const o = ctx.createOscillator(), g = ctx.createGain(), lp = lowpass(ctx, 3000, p.q || 1);
    o.setPeriodicWave(tone(E, p.wave)); o.frequency.value = f;
    o.connect(lp);
    let last = lp;
    if (p.peak) { const pk = ctx.createBiquadFilter(); pk.type = 'peaking'; pk.frequency.value = p.peak[0]; pk.gain.value = p.peak[1]; pk.Q.value = 1.1; last.connect(pk); last = pk; }
    last.connect(g); g.connect(dest);
    const open = clamp(f * p.open, 600, 9000), settle = clamp(f * p.settle, 500, 7000);
    lp.frequency.setValueAtTime(clamp(f * p.start, 400, 6000), t); lp.frequency.linearRampToValueAtTime(open * (0.6 + 0.6 * v), t + p.att + 0.03); lp.frequency.setTargetAtTime(settle * (0.7 + 0.5 * v), t + p.att + 0.03, 0.12);
    const stop = adsr(g.gain, t, dur, p.att, p.gain * Math.pow(v, 0.85), 0.15, 0.78, p.rel);
    // ビブラート（少し遅れて深くなる。短い音にはかけない）
    const nodes = [o];
    if (dur > 0.32 && p.vib) {
      const lfo = ctx.createOscillator(), lg = ctx.createGain();
      lfo.frequency.value = p.vibRate || 5.3; lg.gain.setValueAtTime(0, t); lg.gain.setValueAtTime(0, t + 0.16); lg.gain.linearRampToValueAtTime(p.vib, t + 0.5);
      lfo.connect(lg); lg.connect(o.detune); lfo.start(t); lfo.stop(stop); nodes.push(lfo);
    }
    o.start(t); o.stop(stop);
    // 息のノイズ
    if (p.breath) E.noise(dest, t, dur, { bp: clamp(f * 3, 800, 7000), q: 0.9, gain: p.breath * v, attack: 0.01, hold: Math.min(0.06, dur * 0.4), decay: 0.07 });
  }
  VOICES.altosax = (E, d, t, m, du, ve) => wind(E, d, t, m, du, ve, { wave: 'sax', start: 3, open: 7, settle: 5, att: 0.022, rel: 0.07, gain: 0.17, vib: 7, breath: 0.007, peak: [1250, 3.5], q: 1.1 });
  VOICES.tenorsax = (E, d, t, m, du, ve) => wind(E, d, t, m, du, ve, { wave: 'sax', start: 2.6, open: 5.6, settle: 4, att: 0.03, rel: 0.08, gain: 0.19, vib: 6, breath: 0.01, peak: [760, 3.5], q: 1.0 });
  VOICES.trumpet = (E, d, t, m, du, ve) => wind(E, d, t, m, du, ve, { wave: 'trumpet', start: 2.2, open: 10, settle: 6.5, att: 0.016, rel: 0.06, gain: 0.17, vib: 6, breath: 0.005, peak: [1500, 3], q: 1.3, vibRate: 5.6 });
  VOICES.flute = (E, d, t, m, du, ve) => wind(E, d, t, m, du, ve, { wave: 'flute', start: 5, open: 7, settle: 5.5, att: 0.045, rel: 0.09, gain: 0.19, vib: 9, breath: 0.016, q: 0.5, vibRate: 5.0 });
  VOICES.clarinet = (E, d, t, m, du, ve) => wind(E, d, t, m, du, ve, { wave: 'clarinet', start: 5, open: 9, settle: 6, att: 0.026, rel: 0.07, gain: 0.17, vib: 4, breath: 0.006, q: 0.8 });
  VOICES.trombone = (E, d, t, m, du, ve) => wind(E, d, t, m, du, ve, { wave: 'trombone', start: 2, open: 7, settle: 5, att: 0.04, rel: 0.08, gain: 0.17, vib: 6, breath: 0.006, peak: [520, 3], q: 1.0 });

  /* ---------------- ドラム ---------------- */
  const DRUMS = {};
  DRUMS.kick = (E, dest, t, v, kit) => {
    const ctx = E.ctx, o = ctx.createOscillator(), g = ctx.createGain(), rock = kit === 'rock';
    o.type = 'sine';
    o.frequency.setValueAtTime(rock ? 150 : 110, t); o.frequency.exponentialRampToValueAtTime(rock ? 48 : 52, t + (rock ? 0.07 : 0.1));
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime((rock ? 0.85 : 0.85) * Math.pow(v, 1.3), t + 0.003); g.gain.setTargetAtTime(0.0001, t + 0.01, rock ? 0.09 : 0.075);
    o.connect(g); g.connect(dest); o.start(t); o.stop(t + 0.6);
    E.noise(dest, t, 0.01, { hp: 1500, gain: 0.12 * v, decay: 0.006 });
  };
  DRUMS.snare = (E, dest, t, v, kit) => {
    const ctx = E.ctx;
    if (kit === 'brush') { E.noise(dest, t, 0.2, { bp: 3600, q: 0.5, gain: 0.34 * v, attack: 0.012, decay: 0.07 }); return; }
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'triangle'; o.frequency.setValueAtTime(kit === 'rock' ? 210 : 185, t); o.frequency.exponentialRampToValueAtTime(150, t + 0.05);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.32 * v, t + 0.002); g.gain.setTargetAtTime(0.0001, t + 0.004, 0.035);
    o.connect(g); g.connect(dest); o.start(t); o.stop(t + 0.3);
    E.noise(dest, t, 0.2, { bp: 2000, q: 0.7, hp: 500, gain: (kit === 'rock' ? 0.48 : 0.42) * v, decay: kit === 'rock' ? 0.07 : 0.055 });
  };
  DRUMS.sidestick = (E, dest, t, v) => {
    const ctx = E.ctx, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = 460; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.3 * v, t + 0.001); g.gain.setTargetAtTime(0.0001, t + 0.002, 0.012);
    o.connect(g); g.connect(dest); o.start(t); o.stop(t + 0.1);
    E.noise(dest, t, 0.05, { bp: 2400, q: 3, gain: 0.5 * v, decay: 0.012 });
  };
  DRUMS.hhClosed = (E, dest, t, v) => E.noise(dest, t, 0.08, { hp: 7500, gain: 0.2 * v, decay: 0.022 });
  DRUMS.hhOpen = (E, dest, t, v) => E.noise(dest, t, 0.4, { hp: 6500, gain: 0.28 * v, decay: 0.16 });
  DRUMS.hhPedal = (E, dest, t, v) => { E.noise(dest, t, 0.08, { hp: 4500, bp: 5500, q: 0.6, gain: 0.4 * v, decay: 0.03 }); };
  DRUMS.ride = (E, dest, t, v, kit) => {
    const ctx = E.ctx, g = ctx.createGain();
    // 金属的な倍音（ピン）と、シャリシャリした広がり
    [[3140, 0.06], [4780, 0.05], [6350, 0.04], [8210, 0.03]].forEach(([f, a]) => {
      const o = ctx.createOscillator(), og = ctx.createGain(); o.type = 'sine'; o.frequency.value = f;
      og.gain.setValueAtTime(0.0001, t); og.gain.linearRampToValueAtTime(a * v, t + 0.001); og.gain.setTargetAtTime(0.0001, t + 0.002, 0.14);
      o.connect(og); og.connect(dest); o.start(t); o.stop(t + 1.2);
    });
    E.noise(dest, t, 0.6, { hp: 6000, gain: 0.16 * v, decay: kit === 'brush' ? 0.12 : 0.23 });
    E.noise(dest, t, 0.05, { bp: 4800, q: 1.2, gain: 0.1 * v, decay: 0.03 });
  };
  DRUMS.crash = (E, dest, t, v) => E.noise(dest, t, 1.6, { hp: 3800, gain: 0.3 * v, attack: 0.002, decay: 0.55 });
  const tom = (f0, f1, len) => (E, dest, t, v) => {
    const ctx = E.ctx, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + 0.12);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.55 * v, t + 0.003); g.gain.setTargetAtTime(0.0001, t + 0.01, len);
    o.connect(g); g.connect(dest); o.start(t); o.stop(t + 0.7);
    E.noise(dest, t, 0.03, { bp: 1500, q: 1, gain: 0.1 * v, decay: 0.012 });
  };
  DRUMS.tomHigh = tom(240, 160, 0.09); DRUMS.tomMid = tom(180, 115, 0.11); DRUMS.tomLow = tom(130, 80, 0.14);
  DRUMS.brush = (E, dest, t, v) => E.noise(dest, t, 0.4, { bp: 4200, q: 0.4, hp: 1500, gain: 0.3 * v, attack: 0.07, decay: 0.12 });

  Au.Engine = Engine; Au.VOICES = VOICES; Au.DRUMS = DRUMS; Au.adsr = adsr;
  if (typeof module !== 'undefined' && module.exports) module.exports = AL;
})();
