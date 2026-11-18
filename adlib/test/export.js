/* 書き出しの検査：MIDI を読みなおして音の数・長さ・テンポを確かめる／MusicXML は小節ごとの長さが合っているか */
const fs = require('fs'), path = require('path');
const D = path.join(__dirname, '../js/');
['theory', 'chart', 'analysis', 'licks'].forEach(f => require(D + f + '.js'));
fs.readdirSync(D).filter(f => /^licks-.*\.js$/.test(f)).sort().forEach(f => require(D + f));
['solo', 'comping', 'glyphs', 'notation', 'presets', 'player', 'export'].forEach(f => require(D + f + '.js'));
const { T, C, A, S, B, N, X, P, Au } = AL;
let bad = 0;
const ok = (c, m) => { if (!c) { bad++; console.log('✗', m); } };

// --- 簡易 MIDI リーダ ---
function readMidi(u8) {
  let p = 0;
  const rd = n => { let v = 0; for (let i = 0; i < n; i++) v = v * 256 + u8[p++]; return v; };
  const str = n => { const s = Buffer.from(u8.slice(p, p + n)).toString('utf8'); p += n; return s; };
  ok(str(4) === 'MThd', 'MThd'); rd(4);
  const fmt = rd(2), n = rd(2), ppq = rd(2);
  const tracks = [];
  for (let t = 0; t < n; t++) {
    ok(str(4) === 'MTrk', 'MTrk'); const len = rd(4), end = p + len;
    const ev = []; let tick = 0, run = 0;
    const vl = () => { let v = 0, b; do { b = u8[p++]; v = (v << 7) | (b & 0x7f); } while (b & 0x80); return v; };
    while (p < end) {
      tick += vl();
      let st = u8[p];
      if (st === 0xff) { p++; const type = u8[p++], l = vl(); const data = u8.slice(p, p + l); p += l; ev.push({ tick, meta: type, data }); continue; }
      if (st & 0x80) { p++; run = st; } else st = run;
      const hi = st & 0xf0, ch = st & 0x0f;
      if (hi === 0xc0 || hi === 0xd0) { ev.push({ tick, st: hi, ch, a: u8[p++] }); }
      else { ev.push({ tick, st: hi, ch, a: u8[p++], b: u8[p++] }); }
    }
    ok(p === end, 'トラック長が合う');
    tracks.push(ev);
  }
  return { fmt, ppq, tracks };
}

function build(text, style, loops) {
  const st = B.STYLES[style], bpb = st.bpb;
  const ch = C.parse(text, { beatsPerBar: bpb }), slots = C.slotsOf(ch), hs = C.harmonicSlots(slots), an = A.analyze(hs, { beatsPerBar: bpb });
  const solo = S.generate(hs, an, { seed: 5, level: 2, bpb });
  const gen = B.generate(slots, { style, seed: 3, bpb });
  const plan = { bpb, chorusBeats: ch.chorusBeats, chorus: () => ({ comp: gen.comp, bass: gen.bass, drums: gen.drums, solo: solo.events }), tempo: () => st.tempo[0], swing: () => st.swing, metronome: false };
  return { ch, slots, hs, an, solo, gen, plan, st, bpb };
}

// 1) MIDI
for (const [name, style] of [['autumn', 'swing'], ['waltz', 'waltz'], ['bossa', 'bossa']]) {
  const pr = P.byId[name], b = build(pr.text, style, 2);
  const col = X.collect(b.plan, 2);
  const sw = b.st.swing;
  const midi = X.buildMidi({
    title: pr.title, bpb: b.bpb, tempo: 120, timeMap: beat => Au.swingMap(beat, sw), keyFifths: -1, keyMinor: true,
    markers: b.slots.map(s => ({ t: s.t0, text: s.src })),
    tracks: [
      { name: 'ピアノ', channel: 0, program: X.GM_PROGRAM.piano, events: col.comp },
      { name: 'ベース', channel: 1, program: X.GM_PROGRAM.upright, events: col.bass },
      { name: 'ソロ', channel: 2, program: X.GM_PROGRAM.altosax, events: col.solo },
    ],
    drums: { name: 'ドラム', events: col.drums },
  });
  const m = readMidi(midi);
  ok(m.fmt === 1 && m.ppq === 480, name + ': ヘッダ');
  ok(m.tracks.length === 5, name + ': トラック数 ' + m.tracks.length);
  const tempo = m.tracks[0].find(e => e.meta === 0x51);
  ok(tempo && (tempo.data[0] << 16 | tempo.data[1] << 8 | tempo.data[2]) === 500000, name + ': テンポ');
  const ts = m.tracks[0].find(e => e.meta === 0x58);
  ok(ts && ts.data[0] === b.bpb, name + ': 拍子');
  const noteCount = tr => tr.filter(e => e.st === 0x90).length;
  ok(noteCount(m.tracks[1]) === col.comp.length, name + ': コードの音数');
  ok(noteCount(m.tracks[2]) === col.bass.length, name + ': ベースの音数');
  ok(noteCount(m.tracks[3]) === col.solo.length, name + ': ソロの音数');
  ok(m.tracks[4].filter(e => e.st === 0x90 && e.ch === 9).length === col.drums.length, name + ': ドラムの音数');
  // オンとオフが対になっている
  for (const tr of m.tracks.slice(1, 4)) {
    const on = {}; let okPairs = true;
    tr.forEach(e => { if (e.st === 0x90) on[e.a] = (on[e.a] || 0) + 1; if (e.st === 0x80) on[e.a] = (on[e.a] || 0) - 1; });
    Object.values(on).forEach(v => { if (v !== 0) okPairs = false; });
    ok(okPairs, name + ': ノートオンとオフが合わない');
  }
  const lastTick = Math.max(...m.tracks[3].map(e => e.tick));
  ok(lastTick <= 2 * b.ch.chorusBeats * 480 + 480, name + ': ソロが長すぎる ' + lastTick);
  const sm = m.tracks[0].filter(e => e.meta === 0x06).length;
  ok(sm === b.slots.length, name + ': コード記号のマーカー ' + sm);
  console.log('MIDI', name.padEnd(8), 'バイト', midi.length, '音', col.comp.length, col.bass.length, col.solo.length, col.drums.length);
}
// スウィングで裏拍が後ろにずれる
{
  const midi = X.buildMidi({ tempo: 120, bpb: 4, timeMap: beat => Au.swingMap(beat, 2 / 3), tracks: [{ name: 'x', channel: 0, program: 0, events: [{ t: 0.5, dur: 0.5, midi: 60, vel: 80 }] }] });
  const m = readMidi(midi);
  const on = m.tracks[1].find(e => e.st === 0x90), off = m.tracks[1].find(e => e.st === 0x80);
  ok(on.tick === 320, 'スウィングの裏拍：' + on.tick);
  ok(off.tick === 480, 'スウィングの終わり：' + off.tick);
}
// ノリ（feel）を渡しても同じ：8分シャッフルは裏拍、16分シャッフルは16分の裏だけがずれる
{
  const evs = [{ t: 0.5, dur: 0.5, midi: 60, vel: 80 }, { t: 1.25, dur: 0.25, midi: 62, vel: 80 }, { t: 1.5, dur: 0.25, midi: 64, vel: 80 }, { t: 1.75, dur: 0.25, midi: 65, vel: 80 }];
  const onsOf = feel => readMidi(X.buildMidi({ tempo: 120, bpb: 4, feel, tracks: [{ name: 'x', channel: 0, program: 0, events: evs }] })).tracks[1].filter(e => e.st === 0x90).map(e => e.tick);
  ok(JSON.stringify(onsOf({ div: 2, r: 2 / 3 })) === JSON.stringify([320, 640, 800, 880]), '8分シャッフル（伴奏）：' + onsOf({ div: 2, r: 2 / 3 }));
  ok(JSON.stringify(onsOf({ div: 4, r: 2 / 3 })) === JSON.stringify([240, 640, 720, 880]), '16分シャッフル（伴奏）：' + onsOf({ div: 4, r: 2 / 3 }));
  ok(JSON.stringify(onsOf({ div: 2, r: 0.5 })) === JSON.stringify([240, 600, 720, 840]), 'ストレート：' + onsOf({ div: 2, r: 0.5 }));
}
// ソロは、MIDI でも再生・WAV と同じ時間で書く：16分音符のある拍はずらさない／付点8分＋16分はシャッフルの裏拍の位置
{
  const pr = P.byId.autumn, b = build(pr.text, 'swing', 1);
  for (const feel of [{ div: 2, r: 2 / 3 }, { div: 2, r: 0.6 }, { div: 4, r: 0.62 }, { div: 2, r: 0.5 }]) {
    let nStraight = 0, nDot = 0, n16 = 0, wrong16 = 0, wrongDot = 0, mism = 0;
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const solo = S.generate(b.hs, b.an, { seed, level: 3, density: 2, bpb: b.bpb });
      const plan = Object.assign({}, b.plan, { chorus: () => ({ comp: [], bass: [], drums: [], solo: solo.events }) });
      const col = X.collect(plan, 1);
      const midi = X.buildMidi({ tempo: 120, bpb: b.bpb, feel, tracks: [{ name: 'ソロ', channel: 2, program: 0, events: col.solo }] });
      const m = readMidi(midi);
      const ons = m.tracks[1].filter(e => e.st === 0x90).map(e => e.tick).sort((x, y) => x - y);
      // 再生（player.js）と同じ式で出した位置と、1つ残らず同じ
      const want = col.solo.map(e => Math.round(Au.feelPos(e.t, feel, e.sm) * 480)).sort((x, y) => x - y);
      if (JSON.stringify(ons) !== JSON.stringify(want)) mism++;
      col.solo.forEach(e => {
        const fl = Math.floor(e.t + 1e-6), f = e.t - fl, q = Math.abs(f - 0.25) < 0.02 || Math.abs(f - 0.75) < 0.02;
        if (e.sm === 's') { nStraight++; if (q && feel.div === 2) { n16++; if (!ons.includes(Math.round(e.t * 480))) wrong16++; } }
        // 付点の拍の16分：シャッフルなら裏拍の位置（fl + r）、ストレート（r = 0.5）なら書いたとおり（fl + 0.75）
        if (e.sm === 'd' && q && feel.div === 2) { nDot++; if (!ons.includes(Math.round((fl + (feel.r > 0.505 ? feel.r : 0.75)) * 480))) wrongDot++; }
      });
    }
    const tag = `MIDI（div${feel.div} r${feel.r.toFixed(2)}）`;
    ok(nStraight > 0, tag + '：難しさ3のソロに、16分音符のある拍がない');
    ok(mism === 0, tag + '：ソロの音の時間が、再生と合わない（' + mism + '本）');
    if (feel.div === 2) {
      ok(n16 > 0 && wrong16 === 0, tag + '：16分の音が拍を4等分した位置にない ' + wrong16 + '/' + n16);
      ok(nDot > 0 && wrongDot === 0, tag + '：付点8分＋16分の16分が、シャッフルの裏拍の位置にない ' + wrongDot + '/' + nDot);
    }
  }
}

// 2) MusicXML
for (const [name, style, inst] of [['autumn', 'swing', { id: 'altosax', jp: 'アルトサックス', transpose: 9, clef: 'treble' }], ['blues-jazz', 'swing', { id: 'trombone', jp: 'トロンボーン', transpose: 0, clef: 'bass' }], ['waltz', 'waltz', { id: 'guitar', jp: 'ギター', transpose: 12, clef: 'treble' }], ['rhythm', 'swing', { id: 'tenorsax', jp: 'テナーサックス', transpose: 14, clef: 'treble' }]]) {
  const pr = P.byId[name], b = build(pr.text, style);
  for (const seed of [1, 2, 3, 4, 5, 6]) {
    const solo = S.generate(b.hs, b.an, { seed, level: 2 + (seed % 2), density: seed % 3, bpb: b.bpb, lo: 52, hi: 80 });
    const score = N.scoreFromEvents({ events: solo.events.map((e, i) => Object.assign({}, e, { id: i })), slots: b.slots, bpb: b.bpb, bars: b.ch.chorusBars, keySpell: b.an.key.spell, keyMode: b.an.key.mode, inst, feel: 'Swing' });
    const xml = X.buildMusicXml({ title: pr.title, tempo: 140, score, mode: b.an.key.mode, inst, feel: 'Swing' });
    const measures = xml.split('<measure ').slice(1);
    ok(measures.length === b.ch.chorusBars, name + ': 小節数');
    measures.forEach((ms, k) => {
      const body = ms.replace(/<harmony>[\s\S]*?<\/harmony>/g, '');
      let sum = 0;
      (body.match(/<note>[\s\S]*?<\/note>/g) || []).forEach(nt => { sum += +/<duration>(\d+)<\/duration>/.exec(nt)[1]; });
      ok(sum === b.bpb * 12, `${name} seed${seed} ${k + 1}小節目の長さ ${sum}`);
    });
    // タグの対応（簡易）
    const opens = (xml.match(/<(?!\/|\?|!)[A-Za-z][^>]*[^\/]>/g) || []).length, closes = (xml.match(/<\/[A-Za-z][^>]*>/g) || []).length;
    ok(opens === closes, `${name} seed${seed}: タグの数 ${opens}/${closes}`);
    ok((xml.match(/<tuplet type="start"/g) || []).length === (xml.match(/<tuplet type="stop"/g) || []).length, name + ': 3連符の開始と終了');
    ok((xml.match(/<tie type="start"\/>/g) || []).length === (xml.match(/<tie type="stop"\/>/g) || []).length, name + ': タイの開始と終了');
    if (seed === 1) { fs.mkdirSync(process.env.ADLIB_OUT || '/tmp', { recursive: true }); fs.writeFileSync((process.env.ADLIB_OUT || '/tmp') + '/adlib-test-' + name + '.musicxml', xml); }
  }
}
// コード記号
{
  const cases = { 'Cmaj7': 'major-seventh', 'Dm7': 'minor-seventh', 'G7': 'dominant', 'G7b9': 'dominant', 'Bm7b5': 'half-diminished', 'Bo7': 'diminished-seventh', 'C6': 'major-sixth', 'Cm6': 'minor-sixth', 'Cm(maj7)': 'major-minor', 'G7sus4': 'suspended-fourth', 'C9': 'dominant-ninth', 'C13': 'dominant-13th', 'Bbmaj7': 'major-seventh', 'C/E': 'major' };
  for (const [src, kind] of Object.entries(cases)) {
    const h = X.harmonyXml(src, 0);
    ok(h.includes('>' + kind + '</kind>'), `harmony ${src}: ${h}`);
  }
  ok(/<root-alter>-1<\/root-alter>/.test(X.harmonyXml('Bbmaj7', 0)), 'B♭ の root-alter');
  ok(/<degree-alter>-1<\/degree-alter>/.test(X.harmonyXml('G7b9', 0)), '7♭9 の degree');
  ok(/<bass-step>E<\/bass-step>/.test(X.harmonyXml('C/E', 0)), 'スラッシュコードの bass');
}
if (bad) { console.log(bad + ' 件の問題'); process.exit(1); }
console.log('export: OK');
