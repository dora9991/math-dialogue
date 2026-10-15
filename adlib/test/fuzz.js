/* ランダムなコード譜を大量に作って、読みこみ → 解析 → ソロ → 伴奏 → 楽譜（SVG）→ MusicXML / MIDI まで落ちないか確かめる
   使い方：node adlib/test/fuzz.js [件数] [種] */
const fs = require('fs'), path = require('path');
const D = path.join(__dirname, '../js/');
['theory', 'chart', 'analysis', 'licks'].forEach(f => require(D + f + '.js'));
fs.readdirSync(D).filter(f => /^licks-.*\.js$/.test(f)).sort().forEach(f => require(D + f));
['solo', 'comping', 'glyphs', 'notation', 'presets', 'player', 'export'].forEach(f => require(D + f + '.js'));
const { T, C, A, S, B, L, N, X, Au } = AL;
const { checkMusicXml } = require('./xmlcheck.js');
const COUNT = +process.argv[2] || 300, SEED = +process.argv[3] || 12345;
let bad = 0, n = 0;
const fail = (m, ctx) => { bad++; if (bad <= 12) console.log('✗', m, ctx ? '\n   ' + ctx.replace(/\n/g, ' / ') : ''); };
function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const R = rng(SEED);
const pick = a => a[Math.floor(R() * a.length)];
const ROOTS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B', 'C#', 'G#'];
const QUALS = ['', 'm', '7', 'maj7', 'm7', 'm7b5', 'o7', '6', 'm6', 'm(maj7)', '7b9', '7#9', '7#11', '7b13', '7alt', '7sus4', 'maj9', 'm9', '9', '13', 'maj7#11', 'sus4', 'aug', '69', 'dim', 'maj7(#5)', '7(b9)', 'm11', '5'];
const chord = () => { const r = pick(ROOTS), q = pick(QUALS); let s = r + q; if (R() < 0.08) s += '/' + pick(ROOTS); return s; };
function chart(bpb) {
  const lines = [], bars = 2 + Math.floor(R() * 16);
  let out = '', repeatOpen = false;
  if (R() < 0.3) out += '*A\n';
  for (let b = 0; b < bars; b++) {
    const r = R();
    let cell;
    if (r < 0.1 && b > 0) cell = '%';
    else if (r < 0.14) cell = 'N.C.';
    else {
      const k = 1 + Math.floor(R() * Math.min(bpb, 4));
      const parts = []; for (let i = 0; i < k; i++) parts.push(chord());
      cell = parts.join(' ');
      if (R() < 0.05) cell = chord() + ' . . .';
      if (R() < 0.03) cell += ' Xyz';
    }
    let pre = '|';
    if (!repeatOpen && R() < 0.08) { pre = '|:'; repeatOpen = true; }
    out += pre + ' ' + cell + ' ';
    if (repeatOpen && R() < 0.25) { out += ':| '; repeatOpen = false; }
    if (b % 4 === 3) out += '|\n';
  }
  return out + '|';
}
const INSTS = [{ transpose: 0, clef: 'treble' }, { transpose: 9, clef: 'treble' }, { transpose: 14, clef: 'treble' }, { transpose: 2, clef: 'treble' }, { transpose: 12, clef: 'treble' }, { transpose: 0, clef: 'bass' }];
const RANGES = [[55, 84], [52, 77], [46, 72], [57, 82], [52, 74], [43, 67]];
const t0 = Date.now();
for (let i = 0; i < COUNT; i++) {
  const style = pick(Object.keys(B.STYLES)), bpb = B.STYLES[style].bpb;
  const text = chart(bpb);
  const ctxStr = style + ' ' + text;
  try {
    const ch = C.parse(text, { beatsPerBar: bpb });
    const slots = C.slotsOf(ch), hs = C.harmonicSlots(slots), an = A.analyze(hs, { beatsPerBar: bpb });
    if (!ch.chorusBars) continue;
    n++;
    const ii = Math.floor(R() * INSTS.length), inst = INSTS[ii], rg = RANGES[ii];
    const solo = S.generate(hs, an, { seed: 1 + Math.floor(R() * 9999), level: 1 + Math.floor(R() * 3), density: Math.floor(R() * 3), lo: rg[0], hi: rg[1], bpb });
    // 音の検査
    for (const e of solo.events) {
      if (!(e.dur > 0) || !isFinite(e.t) || e.t < -1e-9) fail('ソロの時間が変', ctxStr);
      if (e.midi < rg[0] - 14 || e.midi > rg[1] + 14) fail('音域外 ' + e.midi, ctxStr);
    }
    for (let k = 1; k < solo.events.length; k++) if (solo.events[k].t < solo.events[k - 1].t - 1e-9) fail('ソロが時間順でない', ctxStr);
    // 差しかえ
    if (solo.decisions.length) {
      const di = Math.floor(R() * solo.decisions.length), cand = S.candidates(hs, an, solo, di);
      if (cand.length) { const s2 = S.swap(hs, an, solo, di, pick(cand).id); if (!s2.events.length && solo.events.length) fail('差しかえで音が消えた', ctxStr); }
      S.reroll(hs, an, solo, di, 7);
    }
    // 伴奏
    const gen = B.generate(slots, { style, kind: pick(['piano', 'guitar', 'organ', 'ep', 'vibes', 'pad']), seed: 1 + Math.floor(R() * 999), bpb });
    for (const e of gen.comp.concat(gen.bass)) if (!(e.dur > 0) || e.t < 0 || e.midi < 20 || e.midi > 108) fail('伴奏の音が変 ' + JSON.stringify(e), ctxStr);
    // 楽譜
    const score = N.scoreFromEvents({ events: solo.events.map((e, k) => Object.assign({}, e, { id: k })), slots, bpb, bars: ch.chorusBars, keySpell: an.key.spell, keyMode: an.key.mode, inst, feel: 'X', marks: solo.decisions.map((d, k) => ({ t0: d.t, t1: d.t + (d.cut || L.byId[d.id].total), label: k % 2 ? 'ii–V–I' : '', tone: k })) });
    for (const w of [320, 700]) {
      const r = N.render(score, { width: w, ss: w < 400 ? 6 : 8, barsPerSystem: w < 400 ? 2 : 4 });
      if (!r.svg || /NaN|undefined|Infinity/.test(r.svg)) fail('SVG に NaN/undefined（幅' + w + '）', ctxStr);
      if (!(r.height > 50)) fail('SVG の高さが変', ctxStr);
      // 密な小節でも、右端で切れない（決めた幅に入らないときは、SVG 自身が広がる）
      const svgW = +/<svg[^>]* width="([\d.]+)"/.exec(r.svg)[1], maxX1 = Math.max.apply(null, r.layout.bars.map(b => b.x1));
      if (svgW < w - 0.5) fail('SVG の幅が、頼んだ幅より狭い（幅' + w + '）', ctxStr);
      if (maxX1 > svgW - 7.5) fail('SVG の右端で小節が切れる（幅' + w + '、小節の右端 ' + maxX1.toFixed(0) + ' ／ SVG ' + svgW + '）', ctxStr);
      // カーソル用の座標が全小節にある
      for (let b = 0; b < ch.chorusBars; b++) { const lb = r.layout.bars[b]; if (!lb || !isFinite(lb.timeToX(0)) || !isFinite(lb.timeToX(bpb - 0.1))) fail('layout.bars[' + b + '] が変', ctxStr); }
    }
    // MusicXML：小節の長さ・音符の形・3連符のかたまり
    const xml = X.buildMusicXml({ title: 't', tempo: 120, score, mode: an.key.mode, inst: Object.assign({ id: 'piano', jp: 'x' }, inst), feel: 'x' });
    checkMusicXml(xml, bpb).forEach(m => fail('MusicXML ' + m, ctxStr));
    // MIDI
    const plan = { bpb, chorusBeats: ch.chorusBeats, chorus: () => ({ comp: gen.comp, bass: gen.bass, drums: gen.drums, solo: solo.events }), tempo: () => 120, swing: () => 0.6 };
    const col = X.collect(plan, 2);
    const mid = X.buildMidi({ tempo: 120, bpb, timeMap: b => Au.swingMap(b, 0.6), tracks: [{ name: 'a', channel: 0, program: 0, events: col.comp }, { name: 's', channel: 2, program: 65, events: col.solo }], drums: { events: col.drums } });
    if (mid.length < 100) fail('MIDI が短すぎる', ctxStr);
    // 解析の整合
    an.chords.forEach((c, k) => { if (!c) fail('an.chords の欠け', ctxStr); else if (!hs[k].chord.nc && !hs[k].chord.bad && (!c.roles.length || !c.chips.length && !hs[k].chord.nc)) fail('役割が空 ' + hs[k].src, ctxStr); });
  } catch (e) {
    fail('例外：' + (e && e.stack ? e.stack.split('\n').slice(0, 3).join(' | ') : e), ctxStr);
  }
}
console.log(`fuzz：${n}譜（${COUNT}回中）、${Date.now() - t0}ms`);
if (bad) { console.log(bad + ' 件の問題'); process.exit(1); }
console.log('fuzz: OK');
