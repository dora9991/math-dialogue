/* アドリブ・ラボ：再生（スケジューラ）。拍の上の音符 → AudioContext の時刻に直して、少し先まで予約していく。
   ・スウィング：8分音符の裏拍を後ろにずらす（3連符の位置はそのまま）
   ・ループ：何コーラスでも／無限／範囲（小節 a〜b）のくり返し
   ・テンポ・スウィングは演奏中に変えられる
   ・書き出し：OfflineAudioContext に同じ予約をして WAV にする
   plan（再生の設計図）：
     { bpb, chorusBeats, chorus(k) → { comp:[{t,dur,midi,vel}], bass:[…], drums:[{t,kind,vel}], solo:[{t,dur,midi,vel,tie,stac}] },
       tempo(), swing()（演奏中に読みなおす）, metronome }   t はコーラスの頭からの拍 */
(function () {
  'use strict';
  const root = typeof window !== 'undefined' ? window : globalThis;
  const AL = (root.AL = root.AL || {});
  const Au = (AL.Au = AL.Au || {});

  /* ---------------- スウィングの時間のゆがみ ---------------- */
  const isTriplet = f => { const x = f * 3; return Math.abs(x - Math.round(x)) < 1e-3 && Math.round(x) % 3 !== 0; };
  // 拍 b（音符の位置）→ スウィング後の拍。整数の拍は動かない
  function swingMap(b, r) {
    const fl = Math.floor(b + 1e-9), f = b - fl;
    if (f < 1e-6 || Math.abs(r - 0.5) < 1e-4 || isTriplet(f)) return b;
    return f < 0.5 ? fl + f * 2 * r : fl + r + (f - 0.5) * 2 * (1 - r);
  }
  function unswing(sb, r) {
    const fl = Math.floor(sb + 1e-9), g = sb - fl;
    if (Math.abs(r - 0.5) < 1e-4) return sb;
    return g < r ? fl + g / (2 * r) : fl + 0.5 + (g - r) / (2 * (1 - r));
  }

  // 16分音符のある拍は、スウィングさせず、そのまま等間隔で鳴らす（16分のランが、不ぞろいに聞こえるため）。
  // 拍のなかの 1/4・3/4 の位置から始まる音がある拍の音に、straight = true をつける
  function markStraight(evs) {
    const beats = new Set();
    evs.forEach(e => { const f = e.t - Math.floor(e.t + 1e-6); if (Math.abs(f - 0.25) < 0.02 || Math.abs(f - 0.75) < 0.02) beats.add(Math.floor(e.t + 1e-6)); });
    evs.forEach(e => { e.straight = beats.has(Math.floor(e.t + 1e-6)); });
    return evs;
  }

  // タイで結ばれた音をつなげる
  function mergeTies(evs) {
    const out = [];
    for (let i = 0; i < evs.length; i++) {
      const e = Object.assign({}, evs[i]);
      let j = i;
      while (evs[j].tie && j + 1 < evs.length && evs[j + 1].midi === e.midi) { e.dur = evs[j + 1].t + evs[j + 1].dur - e.t; j++; }
      i = j;
      out.push(e);
    }
    return out;
  }

  // 音符1つを鳴らす（部品ごとの長さの調整つき）
  function playNote(E, part, evt, tStart, tEnd) {
    let dur = tEnd - tStart;
    if (part === 'solo') {
      dur *= evt.stac ? 0.45 : (evt.dur <= 0.5 ? 0.86 : 0.93);
      dur = Math.max(0.06, dur);
    }
    E.play(part, tStart, evt.midi, dur, evt.vel);
  }

  class Player {
    constructor(engine) { this.E = engine; this.ctx = engine.ctx; this.running = false; this.timer = null; this.listeners = {}; }
    on(name, fn) { this.listeners[name] = fn; return this; }
    emit(name, a) { if (this.listeners[name]) this.listeners[name](a); }

    // opts：{ fromBar, toBar（範囲くり返し）, startBar（途中の小節から始める。そのあとは頭にもどって、全体か範囲をくり返す）, loops（Infinity も可）, countIn（小節）, solo: true/false }
    start(plan, opts) {
      opts = opts || {};
      this.stop(true);
      const ctx = this.ctx, E = this.E;
      this.plan = plan; this.opts = opts;
      this.bpb = plan.bpb;
      this.rangeMode = opts.toBar != null && opts.fromBar != null;
      this.a = this.rangeMode ? opts.fromBar * plan.bpb : (opts.fromBar || 0) * plan.bpb;
      this.b = this.rangeMode ? opts.toBar * plan.bpb : plan.chorusBeats;
      this.cycleBeats = this.b - this.a;
      this.cycle0 = this.rangeMode ? 0 : 0;
      this.loops = opts.loops == null ? Infinity : opts.loops;
      this.countIn = (opts.countIn || 0) * plan.bpb;
      // 途中から始めるときの、最初の音の位置（タイムライン u：範囲の頭が 0）
      this.skipBefore = 0;
      if (opts.startBar != null) { const x = opts.startBar * plan.bpb; if (x >= this.a - 1e-9 && x < this.b - 1e-9) this.skipBefore = x - this.a; }
      this.soloOn = opts.solo !== false;
      this.soloCache = {};
      this.cache = {};
      E.startSession();
      const r = plan.swing(), bpm = plan.tempo();
      this.spb = 60 / bpm;
      this.startU = this.skipBefore - this.countIn;
      this.anchor = { time: ctx.currentTime + 0.15, sbeat: swingMap(this.startU, r) };
      this.nextU = this.startU;
      this.endU = this.loops === Infinity ? Infinity : this.loops * this.cycleBeats;
      this.running = true;
      this.finished = false;
      this.tick();
      this.timer = setInterval(() => this.tick(), 40);
    }
    stop(silent) {
      if (this.timer) { clearInterval(this.timer); this.timer = null; }
      const was = this.running;
      this.running = false;
      this.E.stopSession(0.05);
      if (was && !silent) this.emit('stop');
    }
    setTempo(bpm) {
      if (!this.running) return;
      const now = this.ctx.currentTime;
      this.anchor = { time: now, sbeat: this.anchor.sbeat + (now - this.anchor.time) / this.spb };
      this.spb = 60 / bpm;
    }
    // 音符の位置 u（タイムラインの拍）→ AudioContext の時刻
    timeOf(u, r) { return this.anchor.time + (swingMap(u, r) - this.anchor.sbeat) * this.spb; }
    // スウィングさせない時刻（拍の頭は同じ。拍のなかを等間隔で）
    timeOfStraight(u) { return this.anchor.time + (u - this.anchor.sbeat) * this.spb; }
    // いまの位置（拍）。count-in 中は負
    position() {
      if (!this.running) return null;
      const r = this.plan.swing();
      const sb = this.anchor.sbeat + (this.ctx.currentTime - this.anchor.time) / this.spb;
      const u = unswing(sb, r);
      if (u < (this.skipBefore || 0) - 1e-9) return { u, countIn: true, ci: Math.max(0, Math.floor(u - this.startU + 1e-9)), beat: 0, bar: 0, cycle: 0, chorus: 0 };
      const cycle = Math.floor(u / this.cycleBeats), x = this.a + (u - cycle * this.cycleBeats);
      return { u, cycle, chorus: this.rangeMode ? 0 : this.cycle0 + cycle, beat: x, bar: Math.floor(x / this.bpb + 1e-9), beatInBar: x - Math.floor(x / this.bpb + 1e-9) * this.bpb, countIn: false };
    }
    tick() {
      if (!this.running) return;
      const ctx = this.ctx, plan = this.plan, r = plan.swing();
      const look = (typeof document !== 'undefined' && document.hidden) ? 2.6 : 0.45;
      const horizonSb = this.anchor.sbeat + (ctx.currentTime + look - this.anchor.time) / this.spb;
      let uH = unswing(horizonSb, r);
      if (uH > this.endU) uH = this.endU;
      if (uH > this.nextU) { this.schedule(this.nextU, uH, r); this.nextU = uH; }
      if (this.endU !== Infinity && this.nextU >= this.endU && !this.finished) {
        this.finished = true;
        const endT = this.timeOf(this.endU, r) + 1.8 - ctx.currentTime;
        setTimeout(() => { if (this.running && this.finished) { this.stop(true); this.emit('end'); } }, Math.max(0, endT * 1000));
      }
    }
    chorusEvents(k) {
      if (!this.cache[k]) this.cache[k] = this.plan.chorus(k);
      return this.cache[k];
    }
    soloEvents(k) {
      if (!this.soloCache[k]) {
        const c = this.chorusEvents(k);
        this.soloCache[k] = c.solo ? markStraight(mergeTies(c.solo)) : [];
      }
      return this.soloCache[k];
    }
    // u0 以上 u1 未満の音符を予約する
    schedule(u0, u1, r) {
      const E = this.E, plan = this.plan;
      // count-in とメトロノーム
      const skip = this.skipBefore || 0;
      for (let u = Math.ceil(u0 - 1e-9); u < u1 - 1e-9; u++) {
        if (u < skip) E.click(this.timeOf(u, r), (u - (skip - this.countIn)) % this.bpb === 0);
        else if (plan.metronome) E.click(this.timeOf(u, r), (u + this.a) % this.bpb === 0);
      }
      if (u1 <= skip) return;
      const lo = Math.max(skip, u0), cStart = Math.floor(lo / this.cycleBeats), cEnd = Math.floor((u1 - 1e-9) / this.cycleBeats);
      for (let c = cStart; c <= cEnd; c++) {
        const k = this.rangeMode ? 0 : c;
        const ch = this.chorusEvents(k), base = c * this.cycleBeats - this.a;
        const inWin = e => { const u = base + e.t; return u >= lo - 1e-9 && u < u1 - 1e-9 && e.t >= this.a - 1e-9 && e.t < this.b - 1e-9; };
        for (const part of ['comp', 'bass']) {
          for (const e of (ch[part] || [])) {
            if (!inWin(e)) continue;
            const u = base + e.t;
            playNote(E, part, e, this.timeOf(u, r), this.timeOf(u + e.dur, r));
          }
        }
        for (const d of (ch.drums || [])) { if (inWin(d)) E.drum(d.kind, this.timeOf(base + d.t, r), d.vel); }
        if (this.soloOn) {
          for (const e of this.soloEvents(k)) {
            if (!inWin(e)) continue;
            const u = base + e.t;
            if (e.straight) playNote(E, 'solo', e, this.timeOfStraight(u), this.timeOfStraight(u + e.dur));
            else playNote(E, 'solo', e, this.timeOf(u, r), this.timeOf(u + e.dur, r));
          }
        }
      }
    }
  }

  /* ---------------- 書き出し（OfflineAudioContext → WAV） ---------------- */
  // plan と opts（{loops, solo, sampleRate, tail}）から、AudioBuffer をつくる。Engine の設定（楽器・音量）は src から引きつぐ
  async function renderOffline(plan, srcEngine, opts) {
    opts = opts || {};
    const OAC = root.OfflineAudioContext || root.webkitOfflineAudioContext;
    const sr = opts.sampleRate || 44100, loops = opts.loops || 1;
    const r = plan.swing(), spb = 60 / plan.tempo();
    const totalBeats = loops * plan.chorusBeats;
    const secs = swingMap(totalBeats, r) * spb + (opts.tail == null ? 2.2 : opts.tail) + 0.2;
    const ctx = new OAC(2, Math.ceil(sr * secs), sr);
    const E = new Au.Engine(ctx);
    if (srcEngine) { Object.assign(E.mix, srcEngine.mix); Object.assign(E.reverb, srcEngine.reverb); Object.assign(E.muted, srcEngine.muted); Object.assign(E.inst, srcEngine.inst); E.master.gain.value = E.mix.master; }
    E.startSession();
    const pl = new Player(E);
    Object.assign(pl, { plan, bpb: plan.bpb, rangeMode: false, a: 0, b: plan.chorusBeats, cycleBeats: plan.chorusBeats, soloOn: opts.solo !== false, soloCache: {}, cache: {}, spb, countIn: 0 });
    pl.anchor = { time: 0.05, sbeat: 0 };
    pl.schedule(0, totalBeats, r);
    return ctx.startRendering();
  }
  function encodeWav(buf) {
    const nCh = buf.numberOfChannels, len = buf.length, sr = buf.sampleRate;
    const out = new ArrayBuffer(44 + len * nCh * 2), dv = new DataView(out);
    const w = (o, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i)); };
    w(0, 'RIFF'); dv.setUint32(4, 36 + len * nCh * 2, true); w(8, 'WAVE'); w(12, 'fmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, nCh, true);
    dv.setUint32(24, sr, true); dv.setUint32(28, sr * nCh * 2, true); dv.setUint16(32, nCh * 2, true); dv.setUint16(34, 16, true); w(36, 'data'); dv.setUint32(40, len * nCh * 2, true);
    const chs = []; for (let c = 0; c < nCh; c++) chs.push(buf.getChannelData(c));
    let o = 44;
    for (let i = 0; i < len; i++) for (let c = 0; c < nCh; c++) { const s = Math.max(-1, Math.min(1, chs[c][i])); dv.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true); o += 2; }
    return new Blob([out], { type: 'audio/wav' });
  }

  Object.assign(Au, { Player, swingMap, unswing, renderOffline, encodeWav, mergeTies, markStraight });
  if (typeof module !== 'undefined' && module.exports) module.exports = AL;
})();
