'use strict';
/* ============================================================
   audio.js — WebAudioで作るファミコン風の効果音とBGM（音源ファイルなし）
   矩形波(12.5/25/50%) + 三角波 + ノイズ だけで鳴らす。
   ============================================================ */
const NOTE_IDX = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function noteFreq(tok) {
  const m = /^([A-G])(#|b)?(-?\d)$/.exec(tok);
  if (!m) return 0;
  const n = NOTE_IDX[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (+m[3] + 1) * 12;
  return 440 * Math.pow(2, (n - 69) / 12);
}
/* "E5 . . G5" のような文字列 → [{s:開始ステップ, f:周波数, n:長さ(ステップ)}] */
function parseTrack(bars) {
  const out = [];
  bars.forEach((bar, bi) => {
    const toks = bar.trim().split(/\s+/);
    let cur = null;
    toks.forEach((t, i) => {
      const step = bi * 16 + i;
      if (t === '.') { if (cur) cur.n++; return; }
      if (t === '-') { cur = null; return; }
      cur = { s: step, f: noteFreq(t), n: 1 };
      out.push(cur);
    });
  });
  return out;
}
const CHORD_TONES = {
  Dmaj: ['D4', 'F#4', 'A4'], Amaj: ['A3', 'C#4', 'E4'], Bm: ['B3', 'D4', 'F#4'], Gmaj: ['G3', 'B3', 'D4'],
  Emaj: ['E4', 'G#4', 'B4'], 'F#m': ['F#4', 'A4', 'C#5'],
  Cmaj: ['C4', 'E4', 'G4'], Am: ['A3', 'C4', 'E4'], Fmaj: ['F3', 'A3', 'C4'],
};
function arpBars(chords, every) {
  return chords.map((ch) => {
    const t = CHORD_TONES[ch], pat = [0, 1, 2, 1];
    const toks = [];
    for (let i = 0; i < 16; i++) toks.push(i % every === 0 ? t[pat[((i / every) | 0) % 4]] : '.');
    return toks.join(' ');
  });
}
/* ベース：8分で刻んで、小節の終わりに5度で次へ駆け上がる */
const BASS_DRIVE = (r, o, f) => `${r} . ${r} . ${o} . ${r} . ${r} . ${r} . ${o} . ${r} ${f}`;
const BASS_EIGHT = (r, o) => `${r} . ${r} . ${o} . ${r} . ${r} . ${r} . ${o} . ${r} .`;

const BGM_DATA = {
  /* 戦い1：Dメジャー・テンポ176。明るく駆け抜ける */
  fightA: {
    bpm: 176, bars: 8,
    lead: parseTrack([
      'D6 . . D6 . E6 F#6 . A6 . . F#6 . E6 . D6', 'E6 . . E6 . F#6 A6 . B6 . . A6 . F#6 . E6',
      'D6 . . D6 . F#6 B6 . A6 . . F#6 . D6 . B5', 'B5 . . D6 . G6 B6 . A6 . . G6 . D6 . B5',
      'F#5 . A5 . D6 . A5 . F#5 . A5 . D6 . E6 .', 'E6 . F#6 . A6 . F#6 . E6 . C#6 . E6 . A5 .',
      'D6 . G6 . B6 . G6 . D6 . B5 . D6 . G6 .', 'E6 F#6 A6 B6 C#7 . B6 A6 F#6 . E6 . C#6 . E6 .',
    ]),
    arp: parseTrack(arpBars(['Dmaj', 'Amaj', 'Bm', 'Gmaj', 'Dmaj', 'Amaj', 'Gmaj', 'Amaj'], 1)),
    bass: parseTrack([BASS_DRIVE('D2', 'D3', 'A2'), BASS_DRIVE('A2', 'A3', 'E3'), BASS_DRIVE('B2', 'B3', 'F#3'), BASS_DRIVE('G2', 'G3', 'D3'),
      BASS_DRIVE('D2', 'D3', 'A2'), BASS_DRIVE('A2', 'A3', 'E3'), BASS_DRIVE('G2', 'G3', 'D3'), BASS_DRIVE('A2', 'A3', 'C#3')]),
    kick: [0, 4, 8, 12], snare: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14], open: [2, 6, 10, 14], hat16: [1, 3, 5, 7, 9, 11, 13, 15],
    fill: { 3: [12, 13, 14, 15], 7: [8, 10, 12, 13, 14, 15] }, crash: true,
    leadDuty: 0.25, arpDuty: 0.125,
  },
  /* 戦い2：Aメジャー・テンポ168。もう少し跳ねる */
  fightB: {
    bpm: 168, bars: 8,
    lead: parseTrack([
      'E6 . . E6 . F#6 A6 . C#7 . . A6 . F#6 . E6', 'B5 . . B5 . C#6 E6 . G#6 . . E6 . C#6 . B5',
      'A5 . . A5 . C#6 F#6 . E6 . . C#6 . A5 . F#5', 'D6 . . D6 . F#6 A6 . F#6 . . D6 . A5 . F#5',
      'A5 . C#6 . E6 . A6 . E6 . C#6 . E6 . A6 .', 'G#6 . B6 . E7 . B6 . G#6 . E6 . B5 . E6 .',
      'F#6 . A6 . D7 . A6 . F#6 . D6 . A5 . D6 .', 'E6 F#6 G#6 B6 E7 . B6 G#6 E6 . B5 . G#5 . B5 .',
    ]),
    arp: parseTrack(arpBars(['Amaj', 'Emaj', 'F#m', 'Dmaj', 'Amaj', 'Emaj', 'Dmaj', 'Emaj'], 1)),
    bass: parseTrack([BASS_DRIVE('A2', 'A3', 'E3'), BASS_DRIVE('E2', 'E3', 'B2'), BASS_DRIVE('F#2', 'F#3', 'C#3'), BASS_DRIVE('D2', 'D3', 'A2'),
      BASS_DRIVE('A2', 'A3', 'E3'), BASS_DRIVE('E2', 'E3', 'B2'), BASS_DRIVE('D2', 'D3', 'A2'), BASS_DRIVE('E2', 'E3', 'G#2')]),
    kick: [0, 4, 8, 12], snare: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14], open: [2, 6, 10, 14], hat16: [1, 3, 5, 7, 9, 11, 13, 15],
    fill: { 3: [12, 13, 14, 15], 7: [8, 10, 12, 13, 14, 15] }, crash: true,
    leadDuty: 0.5, arpDuty: 0.125,
  },
  /* タイトル／選択：Cメジャー・テンポ150。わくわくする入り */
  title: {
    bpm: 150, bars: 8,
    lead: parseTrack([
      'E5 . . . G5 . . . C6 . . . B5 . G5 .', 'D5 . . . G5 . . . B5 . . . A5 . G5 .',
      'E5 . . . A5 . . . C6 . . . B5 . A5 .', 'F5 . . . A5 . . . C6 . . . A5 . F5 .',
      'G5 . E5 . G5 . C6 . E6 . D6 . C6 . G5 .', 'B5 . G5 . B5 . D6 . G6 . F#6 . D6 . B5 .',
      'A5 . F5 . A5 . C6 . F6 . E6 . C6 . A5 .', 'D6 . G6 . B6 . . . A6 . G6 . D6 . B5 .',
    ]),
    arp: parseTrack(arpBars(['Cmaj', 'Gmaj', 'Am', 'Fmaj', 'Cmaj', 'Gmaj', 'Fmaj', 'Gmaj'], 2)),
    bass: parseTrack([BASS_EIGHT('C2', 'C3'), BASS_EIGHT('G2', 'G3'), BASS_EIGHT('A2', 'A3'), BASS_EIGHT('F2', 'F3'),
      BASS_EIGHT('C2', 'C3'), BASS_EIGHT('G2', 'G3'), BASS_EIGHT('F2', 'F3'), BASS_EIGHT('G2', 'G3')]),
    kick: [0, 8], snare: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14], open: [], hat16: [],
    fill: { 7: [12, 13, 14, 15] }, crash: false,
    leadDuty: 0.25, arpDuty: 0.125,
  },
};

const Sound = {
  ctx: null, master: null, sfxBus: null, bgmBus: null, noiseBuf: null, waves: {},
  on: true, bgmName: null, timer: null, step: 0, nextT: 0, track: null,

  init() {
    try { const v = localStorage.getItem('mecha.sound'); if (v === '0') this.on = false; } catch (e) { /* 保存できない環境 */ }
  },
  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.setup(new AC());
      if (this.bgmName) { const n = this.bgmName; this.bgmName = null; this.bgm(n); }
    } catch (e) { this.ctx = null; }
  },
  setup(c) {
    this.ctx = c;
    this.master = c.createGain(); this.master.gain.value = this.on ? 0.9 : 0; this.master.connect(c.destination);
    this.sfxBus = c.createGain(); this.sfxBus.gain.value = 1.0; this.sfxBus.connect(this.master);
    this.bgmBus = c.createGain(); this.bgmBus.gain.value = 0.4; this.bgmBus.connect(this.master);
    const len = c.sampleRate, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.noiseBuf = buf;
    [0.125, 0.25, 0.5].forEach((duty) => {
      const N = 40, re = new Float32Array(N), im = new Float32Array(N);
      for (let n = 1; n < N; n++) { re[n] = Math.sin(2 * Math.PI * n * duty) / (Math.PI * n); im[n] = (1 - Math.cos(2 * Math.PI * n * duty)) / (Math.PI * n); }
      this.waves[duty] = c.createPeriodicWave(re, im);
    });
  },
  setOn(v) {
    this.on = v;
    try { localStorage.setItem('mecha.sound', v ? '1' : '0'); } catch (e) { /* 保存できない環境 */ }
    if (this.master) this.master.gain.value = v ? 0.9 : 0;
  },
  toggle() { this.unlock(); this.setOn(!this.on); return this.on; },

  /* ---- 音のもと ---- */
  tone(f, dur, o) {
    const c = this.ctx; if (!c || !this.on) return;
    o = o || {};
    const t0 = c.currentTime + (o.delay || 0);
    const osc = c.createOscillator();
    if (o.wave === 'tri') osc.type = 'triangle'; else if (o.wave === 'saw') osc.type = 'sawtooth'; else if (o.wave === 'sine') osc.type = 'sine';
    else osc.setPeriodicWave(this.waves[o.duty || 0.5]);
    osc.frequency.setValueAtTime(f, t0);
    if (o.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.slide), t0 + dur);
    const g = c.createGain(), v = o.vol === undefined ? 0.2 : o.vol;
    g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(v, t0 + 0.003);
    if (o.hold) g.gain.setValueAtTime(v, t0 + dur * o.hold);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g); g.connect(o.bus || this.sfxBus);
    osc.start(t0); osc.stop(t0 + dur + 0.03);
  },
  noise(dur, o) {
    const c = this.ctx; if (!c || !this.on) return;
    o = o || {};
    const t0 = c.currentTime + (o.delay || 0);
    const src = c.createBufferSource(); src.buffer = this.noiseBuf; src.loop = true;
    const fl = c.createBiquadFilter(); fl.type = o.type || 'lowpass';
    fl.frequency.setValueAtTime(o.f || 3000, t0); if (o.slide) fl.frequency.exponentialRampToValueAtTime(Math.max(40, o.slide), t0 + dur);
    fl.Q.value = o.q || 0.7;
    const g = c.createGain(), v = o.vol === undefined ? 0.2 : o.vol;
    g.gain.setValueAtTime(v, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(fl); fl.connect(g); g.connect(o.bus || this.sfxBus);
    src.start(t0, Math.random() * 0.5); src.stop(t0 + dur + 0.03);
  },

  /* ---- 効果音 ---- */
  sfx(name) {
    if (!this.ctx || !this.on) return;
    const f = SFX[name];
    if (f) f(this);
  },

  /* ---- BGM ---- */
  bgm(name) {
    if (this.bgmName === name) return;
    this.stopBgm();
    this.bgmName = name;
    if (!this.ctx || !name) return;
    const tr = BGM_DATA[name]; if (!tr) return;
    this.track = tr; this.step = 0; this.nextT = this.ctx.currentTime + 0.08;
    this.bgmBus.gain.cancelScheduledValues(this.ctx.currentTime); this.bgmBus.gain.setValueAtTime(0.4, this.ctx.currentTime);
    this.timer = setInterval(() => this.pump(), 25);
  },
  stopBgm() {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    this.bgmName = this.ctx ? null : this.bgmName;
    if (this.ctx && this.bgmBus) { try { const t = this.ctx.currentTime; this.bgmBus.gain.cancelScheduledValues(t); this.bgmBus.gain.setValueAtTime(this.bgmBus.gain.value, t); this.bgmBus.gain.linearRampToValueAtTime(0.0001, t + 0.15); } catch (e) { /* 無視 */ } }
  },
  pump() {
    const c = this.ctx, tr = this.track;
    if (!c || !tr) return;
    const spb = 60 / tr.bpm / 4, total = tr.bars * 16;
    while (this.nextT < c.currentTime + 0.14) {
      const s = this.step % total, t = this.nextT - c.currentTime;
      const hit = (arr, fn) => { for (const n of arr) if (n.s === s) fn(n); };
      hit(tr.lead, (n) => this.tone(n.f, Math.max(0.06, n.n * spb * 0.92), { duty: tr.leadDuty, vol: 0.16, delay: t, bus: this.bgmBus, hold: 0.7 }));
      hit(tr.arp, (n) => this.tone(n.f, n.n * spb * 0.8, { duty: tr.arpDuty, vol: 0.07, delay: t, bus: this.bgmBus }));
      hit(tr.bass, (n) => this.tone(n.f, Math.max(0.08, n.n * spb * 0.95), { wave: 'tri', vol: 0.34, delay: t, bus: this.bgmBus, hold: 0.8 }));
      const bs = s % 16, bar = (s / 16) | 0, fill = tr.fill && tr.fill[bar];
      const inFill = fill && bs >= fill[0];
      if (tr.crash && bs === 0 && bar === 0) this.noise(0.5, { type: 'highpass', f: 5000, vol: 0.12, delay: t, bus: this.bgmBus });
      if (tr.kick.includes(bs) && !inFill) this.tone(150, 0.1, { wave: 'tri', slide: 45, vol: 0.42, delay: t, bus: this.bgmBus });
      if (tr.snare.includes(bs) && !inFill) this.noise(0.1, { type: 'highpass', f: 1800, vol: 0.2, delay: t, bus: this.bgmBus });
      if (fill && fill.includes(bs)) this.noise(0.07, { type: 'highpass', f: 1800 + (bs - fill[0]) * 250, vol: 0.14 + (bs - fill[0]) * 0.01, delay: t, bus: this.bgmBus });
      if (tr.hat.includes(bs)) this.noise(0.03, { type: 'highpass', f: 7000, vol: 0.07, delay: t, bus: this.bgmBus });
      if (tr.open.includes(bs)) this.noise(0.09, { type: 'highpass', f: 6000, vol: 0.06, delay: t, bus: this.bgmBus });
      if (tr.hat16.includes(bs)) this.noise(0.02, { type: 'highpass', f: 8000, vol: 0.03, delay: t, bus: this.bgmBus });
      this.nextT += spb; this.step++;
    }
  },
  jingle(notes, o) {
    if (!this.ctx || !this.on) return;
    o = o || {};
    notes.forEach((n, i) => this.tone(noteFreq(n), o.len || 0.14, { duty: 0.25, vol: 0.2, delay: i * (o.gap || 0.11) }));
  },
};

const SFX = {
  swing: (S) => S.noise(0.07, { type: 'bandpass', f: 2600, slide: 900, vol: 0.16, q: 1.2 }),
  whoosh: (S) => S.noise(0.2, { type: 'bandpass', f: 700, slide: 2400, vol: 0.2, q: 0.9 }),
  hit0: (S) => { S.noise(0.07, { f: 3200, slide: 600, vol: 0.28 }); S.tone(220, 0.06, { duty: 0.5, slide: 90, vol: 0.2 }); },
  hit1: (S) => { S.noise(0.11, { f: 2600, slide: 400, vol: 0.34 }); S.tone(170, 0.1, { duty: 0.5, slide: 60, vol: 0.26 }); },
  hit2: (S) => { S.noise(0.2, { f: 2000, slide: 200, vol: 0.4 }); S.tone(120, 0.2, { wave: 'tri', slide: 40, vol: 0.4 }); S.tone(260, 0.12, { duty: 0.25, slide: 70, vol: 0.2 }); },
  block: (S) => { S.tone(1000, 0.04, { duty: 0.125, vol: 0.2 }); S.tone(640, 0.05, { duty: 0.125, vol: 0.18, delay: 0.035 }); S.noise(0.04, { type: 'highpass', f: 4000, vol: 0.1 }); },
  jump: (S) => S.tone(250, 0.13, { duty: 0.5, slide: 620, vol: 0.14 }),
  land: (S) => S.noise(0.05, { f: 600, vol: 0.24 }),
  down: (S) => { S.tone(110, 0.15, { wave: 'tri', slide: 45, vol: 0.34 }); S.noise(0.1, { f: 500, vol: 0.2 }); },
  shoot: (S) => { S.tone(760, 0.14, { duty: 0.25, slide: 280, vol: 0.18 }); S.noise(0.05, { type: 'highpass', f: 3000, vol: 0.06 }); },
  rocket: (S) => { S.noise(0.28, { type: 'bandpass', f: 500, slide: 2000, vol: 0.2, q: 1 }); S.tone(300, 0.2, { duty: 0.5, slide: 900, vol: 0.12 }); },
  fire: (S) => { S.noise(0.25, { type: 'bandpass', f: 1200, slide: 500, vol: 0.18, q: 0.8 }); S.tone(520, 0.12, { duty: 0.125, slide: 260, vol: 0.12 }); },
  beam: (S) => { S.tone(420, 0.34, { wave: 'saw', slide: 1500, vol: 0.14 }); S.tone(430, 0.34, { duty: 0.5, slide: 1480, vol: 0.1, delay: 0.01 }); },
  quake: (S) => { S.tone(90, 0.3, { wave: 'tri', slide: 40, vol: 0.4 }); S.noise(0.3, { f: 400, slide: 100, vol: 0.28 }); },
  slam: (S) => { S.tone(100, 0.25, { wave: 'tri', slide: 38, vol: 0.45 }); S.noise(0.18, { f: 900, slide: 150, vol: 0.34 }); },
  rumble: (S) => S.noise(0.4, { f: 300, slide: 120, vol: 0.28 }),
  pillar: (S) => { S.noise(0.3, { f: 1800, slide: 300, vol: 0.3 }); S.tone(200, 0.3, { wave: 'saw', slide: 600, vol: 0.14 }); },
  counter: (S) => { S.tone(880, 0.16, { duty: 0.25, vol: 0.22 }); S.tone(1320, 0.2, { duty: 0.25, vol: 0.2, delay: 0.06 }); S.noise(0.1, { type: 'highpass', f: 3000, vol: 0.14 }); },
  warp: (S) => S.tone(1400, 0.22, { duty: 0.125, slide: 200, vol: 0.18 }),
  warp2: (S) => S.tone(200, 0.2, { duty: 0.125, slide: 1500, vol: 0.18 }),
  bolt0: (S) => S.noise(0.35, { type: 'highpass', f: 4500, vol: 0.06 }),
  bolt: (S) => { S.noise(0.28, { type: 'bandpass', f: 3000, slide: 600, vol: 0.4, q: 0.6 }); S.tone(1800, 0.14, { wave: 'saw', slide: 120, vol: 0.2 }); },
  zap: (S) => { S.noise(0.2, { type: 'bandpass', f: 4000, vol: 0.22, q: 2 }); S.tone(100, 0.2, { wave: 'saw', vol: 0.2 }); },
  chord: (S) => { [196, 247, 294].forEach((f, i) => S.tone(f, 0.16, { wave: 'saw', vol: 0.08, delay: i * 0.012 })); },
  wave: (S) => { S.tone(520, 0.3, { duty: 0.5, slide: 420, vol: 0.16 }); S.tone(780, 0.3, { duty: 0.25, slide: 640, vol: 0.1 }); },
  burst: (S) => { S.noise(0.22, { f: 1800, slide: 200, vol: 0.34 }); S.tone(160, 0.2, { wave: 'tri', slide: 50, vol: 0.3 }); },
  pop: (S) => S.tone(600, 0.06, { duty: 0.125, slide: 200, vol: 0.14 }),
  clash: (S) => { S.tone(1200, 0.07, { duty: 0.125, slide: 400, vol: 0.18 }); S.noise(0.06, { type: 'highpass', f: 5000, vol: 0.12 }); },
  reflect: (S) => { S.tone(700, 0.08, { duty: 0.25, vol: 0.2 }); S.tone(1400, 0.12, { duty: 0.25, vol: 0.18, delay: 0.06 }); },
  ko: (S) => { S.noise(0.5, { f: 3000, slide: 100, vol: 0.4 }); S.tone(700, 0.7, { duty: 0.5, slide: 50, vol: 0.28 }); S.tone(120, 0.6, { wave: 'tri', slide: 30, vol: 0.4 }); },
  select: (S) => S.tone(880, 0.05, { duty: 0.25, vol: 0.16 }),
  confirm: (S) => { S.tone(660, 0.07, { duty: 0.25, vol: 0.2 }); S.tone(990, 0.1, { duty: 0.25, vol: 0.2, delay: 0.06 }); },
  cancel: (S) => { S.tone(500, 0.07, { duty: 0.25, vol: 0.18 }); S.tone(330, 0.1, { duty: 0.25, vol: 0.18, delay: 0.06 }); },
  round: (S) => S.jingle(['C5', 'E5', 'G5'], { gap: 0.1, len: 0.12 }),
  fight: (S) => { S.jingle(['G5', 'C6'], { gap: 0.07, len: 0.2 }); S.noise(0.15, { type: 'highpass', f: 2500, vol: 0.14 }); },
  win: (S) => S.jingle(['C5', 'E5', 'G5', 'C6', 'G5', 'C6'], { gap: 0.11, len: 0.18 }),
  lose: (S) => S.jingle(['E5', 'D5', 'C5', 'A4'], { gap: 0.16, len: 0.26 }),
  throw: (S) => { S.noise(0.06, { type: 'bandpass', f: 3200, slide: 1400, vol: 0.14, q: 1.4 }); S.tone(900, 0.05, { duty: 0.125, slide: 500, vol: 0.07 }); },
  chomp: (S) => { S.noise(0.05, { type: 'highpass', f: 3500, vol: 0.14 }); S.tone(170, 0.09, { wave: 'tri', slide: 70, vol: 0.32 }); S.tone(150, 0.09, { wave: 'tri', slide: 60, vol: 0.32, delay: 0.08 }); },
  roar: (S) => { S.tone(170, 0.5, { wave: 'saw', slide: 80, vol: 0.2 }); S.noise(0.42, { type: 'bandpass', f: 700, slide: 220, vol: 0.2, q: 0.8 }); },
  splash: (S) => { S.noise(0.2, { type: 'bandpass', f: 1800, slide: 500, vol: 0.22, q: 0.8 }); S.tone(500, 0.16, { wave: 'sine', slide: 1200, vol: 0.1 }); },
  ice: (S) => { S.tone(1900, 0.12, { duty: 0.125, slide: 900, vol: 0.12 }); S.tone(2500, 0.1, { duty: 0.125, slide: 1300, vol: 0.1, delay: 0.05 }); S.noise(0.1, { type: 'highpass', f: 6000, vol: 0.08 }); },
  spring: (S) => { S.tone(200, 0.2, { wave: 'sine', slide: 900, vol: 0.2 }); S.tone(1200, 0.07, { duty: 0.25, vol: 0.14, delay: 0.14 }); },
  steam: (S) => S.noise(0.38, { type: 'highpass', f: 3200, slide: 1400, vol: 0.16 }),
  wish: (S) => { [880, 1175, 1480, 1760].forEach((f, i) => S.tone(f, 0.14, { duty: 0.25, vol: 0.13, delay: i * 0.08 })); },
  pause: (S) => { S.tone(900, 0.05, { duty: 0.5, vol: 0.16 }); S.tone(600, 0.06, { duty: 0.5, vol: 0.16, delay: 0.05 }); },
};
