/* 音の検査：ヘッドレス Chromium で OfflineAudioContext に書き出して、波形を解析する
   使い方：NODE_PATH=$(npm root -g) node adlib/test/audio.js [WAV を保存するフォルダ]
   調べること：①全楽器が鳴る・NaN なし・音割れなし　②音程が合っている　③ミックスの音量　④スウィングの時間のゆがみ */
const path = require('path'), fs = require('fs');
const { chromium } = require('playwright');
const JS = path.join(__dirname, '../js');
const FILES = ['theory', 'chart', 'analysis', 'licks', ...fs.readdirSync(JS).filter(f => /^licks-.*\.js$/.test(f)).map(f => f.replace(/\.js$/, '')).sort(), 'solo', 'comping', 'synth', 'player'];
let bad = 0;
const check = (cond, msg) => { if (!cond) { bad++; console.log('✗', msg); } };

(async () => {
  const outDir = process.argv[2] ? path.resolve(process.argv[2]) : null;
  if (outDir) fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('about:blank');
  for (const f of FILES) await page.addScriptTag({ path: path.join(JS, f + '.js') });

  // 1) 楽器ごとに A3 (220Hz) を1.5秒鳴らして解析
  const report = await page.evaluate(async () => {
    const { Au, T } = AL;
    const out = {};
    const insts = { comp: Au.INSTRUMENTS.comp.map(i => i.id), bass: Au.INSTRUMENTS.bass.map(i => i.id), solo: Au.INSTRUMENTS.solo.map(i => i.id) };
    const all = Array.from(new Set([].concat(insts.comp, insts.bass, insts.solo)));
    for (const id of all) {
      const midi = insts.bass.includes(id) ? 45 : 57;   // ベースは A2(110Hz)、ほかは A3(220Hz)
      const ctx = new OfflineAudioContext(1, 44100 * 2, 44100);
      const E = new Au.Engine(ctx); E.startSession();
      E.reverb.comp = 0; E.reverb.bass = 0; E.reverb.solo = 0;
      const part = insts.bass.includes(id) ? 'bass' : insts.solo.includes(id) && !insts.comp.includes(id) ? 'solo' : 'comp';
      E.play(part, 0.1, midi, 1.2, 96, id);
      const buf = await ctx.startRendering();
      const d = buf.getChannelData(0);
      let peak = 0, sum = 0, nan = 0;
      for (let i = 0; i < d.length; i++) { const x = d[i]; if (x !== x) nan++; const a = Math.abs(x); if (a > peak) peak = a; sum += x * x; }
      // 0.3〜0.9秒の部分で自己相関から基本周波数を推定
      const s = Math.floor(0.3 * 44100), n = 8192, f0 = T.midiToFreq(midi);
      let best = 0, bestLag = 0;
      const minLag = Math.floor(44100 / (f0 * 1.9)), maxLag = Math.floor(44100 / (f0 * 0.52));
      const energy0 = (() => { let e = 0; for (let i = 0; i < n; i++) e += d[s + i] * d[s + i]; return e; })();
      for (let lag = minLag; lag <= maxLag; lag++) { let c = 0; for (let i = 0; i < n; i++) c += d[s + i] * d[s + i + lag]; if (c > best) { best = c; bestLag = lag; } }
      // 放物線補間
      let lagF = bestLag;
      { const c0 = (() => { let c = 0; for (let i = 0; i < n; i++) c += d[s + i] * d[s + i + bestLag - 1]; return c; })(), c1 = best, c2 = (() => { let c = 0; for (let i = 0; i < n; i++) c += d[s + i] * d[s + i + bestLag + 1]; return c; })(); const den = c0 - 2 * c1 + c2; if (den !== 0) lagF = bestLag + 0.5 * (c0 - c2) / den; }
      const est = 44100 / lagF;
      out[id] = { part, peak, rms: Math.sqrt(sum / d.length), nan, est, f0, cents: 1200 * Math.log2(est / f0), clarity: energy0 > 0 ? best / energy0 : 0 };
    }
    return out;
  });
  console.log('--- 楽器ごとの音（A3/A2 を1音） ---');
  for (const [id, r] of Object.entries(report)) {
    const dB = 20 * Math.log10(r.rms + 1e-9);
    console.log(id.padEnd(9), r.part.padEnd(5), 'peak', r.peak.toFixed(2), 'rms', dB.toFixed(1) + 'dB', ' 推定', r.est.toFixed(1) + 'Hz', '(' + r.cents.toFixed(0) + '¢)', 'clarity', r.clarity.toFixed(2));
    check(r.nan === 0, id + ': NaN');
    check(r.peak > 0.02, id + ': 音が小さすぎる/鳴らない');
    check(r.peak < 1.0, id + ': 音割れ');
    check(Math.abs(r.cents) < 30 || r.clarity < 0.3, id + ': 音程がずれている ' + r.cents.toFixed(0) + '¢');
  }

  // 2) ミックス全体：スウィング／ボサノバ／バラード／ワルツ／ファンク
  const mixes = await page.evaluate(async () => {
    const { T, C, A, S, B, Au } = AL;
    const res = {};
    const songs = {
      swing: ['| Dm7 | G7 | Cmaj7 | A7 |', 'swing'], swing2: ['| Cm7 | F7 | Bbmaj7 | Ebmaj7 |', 'swing2'], ballad: ['| Fmaj7 | Em7b5 A7b9 | Dm7 | G7 |', 'ballad'],
      bossa: ['| Am7 | D7 | Gmaj7 | Cmaj7 |', 'bossa'], waltz: ['| Dm7 | G7 | Cmaj7 | % |', 'waltz'], funk: ['| Cm7 | % | Fm7 | % |', 'funk'],
    };
    for (const [name, [text, style]] of Object.entries(songs)) {
      const st = B.STYLES[style];
      const ch = C.parse(text, { beatsPerBar: st.bpb });
      const slots = C.slotsOf(ch), hs = C.harmonicSlots(slots), an = A.analyze(hs, {});
      const solo = S.generate(hs, an, { seed: 4, level: 2, bpb: st.bpb });
      const gen = B.generate(slots, { style, seed: 2, kind: 'piano', bpb: st.bpb });
      const plan = { bpb: st.bpb, chorusBeats: ch.chorusBeats, chorus: () => ({ comp: gen.comp, bass: gen.bass, drums: gen.drums, solo: solo.events }), tempo: () => st.tempo[0], swing: () => st.swing, metronome: false };
      const t0 = performance.now();
      const buf = await Au.renderOffline(plan, null, { loops: 1, tail: 1.5 });
      const dt = performance.now() - t0;
      const L = buf.getChannelData(0), R = buf.getChannelData(1);
      let peak = 0, sum = 0, nan = 0, diff = 0;
      for (let i = 0; i < L.length; i++) { const a = Math.abs(L[i]), b = Math.abs(R[i]); if (L[i] !== L[i]) nan++; if (a > peak) peak = a; if (b > peak) peak = b; sum += L[i] * L[i]; diff += Math.abs(L[i] - R[i]); }
      // 1拍ごとの音量の波形（拍の頭にアタックがあるか）
      const spb = 60 / st.tempo[0], env = [];
      for (let beat = 0; beat < ch.chorusBeats; beat++) { let e = 0; const s0 = Math.floor((0.05 + beat * spb) * buf.sampleRate), n = Math.floor(0.03 * buf.sampleRate); for (let i = 0; i < n; i++) e += L[s0 + i] * L[s0 + i]; env.push(Math.sqrt(e / n)); }
      res[name] = { dur: buf.duration, peak, rms: Math.sqrt(sum / L.length), nan, stereo: diff / L.length, ms: dt, env: env.slice(0, 8), wav: Au.encodeWav(buf).size, notes: { comp: gen.comp.length, bass: gen.bass.length, drums: gen.drums.length, solo: solo.events.length } };
      if (window.__keep) window.__keep[name] = Array.from(L.slice(0, 1));
    }
    return res;
  });
  console.log('--- ミックス ---');
  for (const [name, r] of Object.entries(mixes)) {
    console.log(name.padEnd(7), '長さ', r.dur.toFixed(1) + 's', 'peak', r.peak.toFixed(2), 'rms', (20 * Math.log10(r.rms + 1e-9)).toFixed(1) + 'dB', 'ステレオ差', r.stereo.toFixed(4), '描画', Math.round(r.ms) + 'ms', 'WAV', Math.round(r.wav / 1024) + 'KB', JSON.stringify(r.notes));
    check(r.nan === 0, name + ': NaN');
    check(r.peak < 1.0 && r.peak > 0.15, name + ': ピーク ' + r.peak.toFixed(2));
    const dB = 20 * Math.log10(r.rms + 1e-9);
    check(dB > -32 && dB < -12, name + ': 平均音量 ' + dB.toFixed(1) + 'dB');
    check(r.stereo > 1e-5, name + ': ステレオ感なし（リバーブが効いていない）');
  }

  // 3) スウィングのゆがみ
  const sw = await page.evaluate(() => {
    const { Au } = AL;
    return { a: Au.swingMap(0.5, 0.667), b: Au.swingMap(1.5, 0.64), c: Au.swingMap(1, 0.64), d: Au.swingMap(0.3333333, 0.667), e: Au.unswing(Au.swingMap(2.5, 0.62), 0.62), f: Au.swingMap(0.5, 0.5), g: Au.swingMap(0.25, 0.667) };
  });
  check(Math.abs(sw.a - 0.667) < 1e-6, 'swingMap 0.5→0.667 : ' + sw.a);
  check(Math.abs(sw.b - 1.64) < 1e-6, 'swingMap 1.5→1.64 : ' + sw.b);
  check(sw.c === 1, '整数の拍は動かない');
  check(Math.abs(sw.d - 0.3333333) < 1e-6, '3連符は動かない');
  check(Math.abs(sw.e - 2.5) < 1e-9, 'unswing の逆変換');
  check(sw.f === 0.5, 'swing=0.5 はそのまま');
  check(sw.g > 0.25 && sw.g < 0.5, '16分も少しずれる ' + sw.g);

  console.log('ブラウザのエラー：', errors.length ? errors.join('\n') : 'なし');
  check(errors.length === 0, 'ブラウザ内でエラー');
  await browser.close();
  if (bad) { console.log(`\n${bad} 件の問題`); process.exit(1); }
  console.log('audio: OK');
})().catch(e => { console.error(e); process.exit(1); });
