/* アドリブ・ラボ：書き出し（MIDI・MusicXML）。画面を持たない純粋な関数だけ。
   ・MIDI：伴奏とソロを別トラックにした標準 MIDI ファイル（フォーマット1）。スウィングは時間をずらして書く
   ・MusicXML：ソロの譜面（コード記号つき）。MuseScore・Finale・Sibelius・Dorico などで開ける */
(function () {
  'use strict';
  const root = typeof window !== 'undefined' ? window : globalThis;
  const AL = (root.AL = root.AL || {});
  const T = AL.T, N = AL.N;
  const X = (AL.X = AL.X || {});
  const EPS = 1e-6;

  /* ---------------- 共通：コーラスをならべて、時間を足す ---------------- */
  // タイでつながった音を1つにする（player.js の mergeTies と同じ）
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
  // plan（player.js の設計図）から、loops コーラスぶんを1本の時間にならべる
  function collect(plan, loops, opts) {
    opts = opts || {};
    const out = { comp: [], bass: [], drums: [], solo: [] };
    for (let k = 0; k < loops; k++) {
      const ch = plan.chorus(k), off = k * plan.chorusBeats;
      (ch.comp || []).forEach(e => out.comp.push(Object.assign({}, e, { t: e.t + off })));
      (ch.bass || []).forEach(e => out.bass.push(Object.assign({}, e, { t: e.t + off })));
      (ch.drums || []).forEach(e => out.drums.push(Object.assign({}, e, { t: e.t + off })));
      if (opts.solo !== false) mergeTies(ch.solo || []).forEach(e => out.solo.push(Object.assign({}, e, { t: e.t + off })));
    }
    return out;
  }

  /* ---------------- MIDI ---------------- */
  const PPQ = 480;
  // General MIDI の音色番号
  const GM_PROGRAM = {
    piano: 0, ep: 4, guitar: 26, organ: 16, vibes: 11, pad: 48,
    upright: 32, ebass: 33, synbass: 38,
    altosax: 65, tenorsax: 66, trumpet: 56, flute: 73, clarinet: 71, trombone: 57,
  };
  // ドラムのパーツ → General MIDI のパーカッション番号
  const GM_DRUM = { kick: 36, snare: 38, sidestick: 37, hhClosed: 42, hhPedal: 44, hhOpen: 46, ride: 51, crash: 49, tomHigh: 50, tomMid: 47, tomLow: 43, brush: 40 };

  const vlq = n => { n = Math.max(0, Math.round(n)); const b = [n & 0x7f]; while ((n >>= 7)) b.unshift((n & 0x7f) | 0x80); return b; };
  const u16 = n => [(n >> 8) & 0xff, n & 0xff];
  const u32 = n => [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff];
  const utf8 = s => Array.from(new TextEncoder().encode(String(s == null ? '' : s)));
  const meta = (type, data) => [0xff, type].concat(vlq(data.length), data);

  // events：[{tick, order, bytes}]（order：同じ時刻のとき小さいほうが先。ノートオフ→プログラム→ノートオン）
  function trackBytes(events) {
    events.sort((a, b) => a.tick - b.tick || a.order - b.order);
    const out = [];
    let last = 0;
    for (const e of events) { out.push.apply(out, vlq(e.tick - last)); out.push.apply(out, e.bytes); last = e.tick; }
    out.push(0, 0xff, 0x2f, 0);
    return [0x4d, 0x54, 0x72, 0x6b].concat(u32(out.length), out);
  }

  // opts：{ title, bpb, tempo, timeMap(拍→拍)、keyFifths, keyMinor, markers:[{t,text}],
  //         tracks:[{ name, channel, program, events:[{t,dur,midi,vel}] }], drums:{ name, events:[{t,kind,vel}] } }
  function buildMidi(opts) {
    const tm = opts.timeMap || (b => b);
    const tick = b => Math.round(tm(b) * PPQ);
    const bpb = opts.bpb || 4;
    const tracks = [];
    // 0番：テンポ・拍子・調・コード記号（マーカー）
    const t0 = [];
    t0.push({ tick: 0, order: 0, bytes: meta(0x03, utf8(opts.title || 'アドリブ・ラボ')) });
    t0.push({ tick: 0, order: 1, bytes: meta(0x51, [(Math.round(60000000 / (opts.tempo || 120)) >> 16) & 0xff, (Math.round(60000000 / (opts.tempo || 120)) >> 8) & 0xff, Math.round(60000000 / (opts.tempo || 120)) & 0xff]) });
    t0.push({ tick: 0, order: 2, bytes: meta(0x58, [bpb, 2, 24, 8]) });
    if (opts.keyFifths != null) t0.push({ tick: 0, order: 3, bytes: meta(0x59, [(opts.keyFifths + 256) & 0xff, opts.keyMinor ? 1 : 0]) });
    (opts.markers || []).forEach(m => t0.push({ tick: tick(m.t), order: 5, bytes: meta(0x06, utf8(m.text)) }));
    tracks.push(trackBytes(t0));
    // 各パート
    (opts.tracks || []).forEach(tr => {
      const ev = [];
      const ch = tr.channel & 0x0f;
      ev.push({ tick: 0, order: 0, bytes: meta(0x03, utf8(tr.name || '')) });
      ev.push({ tick: 0, order: 1, bytes: [0xc0 | ch, tr.program | 0] });
      ev.push({ tick: 0, order: 1, bytes: [0xb0 | ch, 7, tr.volume == null ? 100 : tr.volume] });
      (tr.events || []).forEach(e => {
        if (e.midi < 0 || e.midi > 127) return;
        const a = tick(e.t);
        let b = tick(e.t + e.dur);
        if (b <= a) b = a + 1;
        const vel = Math.max(1, Math.min(127, Math.round(e.vel || 80)));
        ev.push({ tick: a, order: 3, bytes: [0x90 | ch, e.midi, vel] });
        ev.push({ tick: b, order: 2, bytes: [0x80 | ch, e.midi, 0] });
      });
      tracks.push(trackBytes(ev));
    });
    if (opts.drums) {
      const ev = [];
      ev.push({ tick: 0, order: 0, bytes: meta(0x03, utf8(opts.drums.name || 'ドラム')) });
      ev.push({ tick: 0, order: 1, bytes: [0xb9, 7, 100] });
      (opts.drums.events || []).forEach(e => {
        const n = GM_DRUM[e.kind];
        if (n == null) return;
        const a = tick(e.t), vel = Math.max(1, Math.min(127, Math.round(e.vel || 80)));
        ev.push({ tick: a, order: 3, bytes: [0x99, n, vel] });
        ev.push({ tick: a + 60, order: 2, bytes: [0x89, n, 0] });
      });
      tracks.push(trackBytes(ev));
    }
    const head = [0x4d, 0x54, 0x68, 0x64].concat(u32(6), u16(1), u16(tracks.length), u16(PPQ));
    let all = head;
    tracks.forEach(t => { all = all.concat(t); });
    return Uint8Array.from(all);
  }

  /* ---------------- MusicXML ---------------- */
  const xe = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const LETTERS = 'CDEFGAB';
  const DIV = 12;

  // コード記号 → <harmony>
  function harmonyXml(text, offsetDiv) {
    const c = T.parseChord(text);
    if (!c || c.nc || !c.root) return '';
    const s = c.suffix || '';
    let kind = 'major';
    const degs = [];
    const has = re => re.test(s);
    switch (c.cls) {
      case 'maj':
        kind = has(/maj13|M13/) ? 'major-13th' : has(/maj9|M9/) ? 'major-ninth' : has(/maj7|M7|△/) ? 'major-seventh' : has(/^69|6\/9/) ? 'major-sixth' : has(/^6/) ? 'major-sixth' : 'major';
        if (/69|6\/9/.test(s)) degs.push([9, 0, 'add']);
        break;
      case 'min':
        kind = has(/^m13|^-13/) ? 'minor-13th' : has(/^m11|^-11/) ? 'minor-11th' : has(/^m9|^-9/) ? 'minor-ninth' : has(/^m6|^-6/) ? 'minor-sixth' : has(/7/) ? 'minor-seventh' : 'minor';
        break;
      case 'minmaj': kind = 'major-minor'; break;
      case 'hdim': kind = 'half-diminished'; break;
      case 'dim': kind = has(/7/) ? 'diminished-seventh' : 'diminished'; break;
      case 'aug': kind = has(/7/) ? 'augmented-seventh' : 'augmented'; break;
      case 'sus': kind = has(/sus2/) ? 'suspended-second' : 'suspended-fourth'; break;
      case 'dom':
        kind = has(/13/) ? 'dominant-13th' : has(/11/) ? 'dominant-11th' : has(/9/) && !has(/b9|#9|♭9|♯9/) ? 'dominant-ninth' : 'dominant';
        break;
      default: kind = 'other';
    }
    if (c.cls === 'dom' || c.cls === 'sus' || c.cls === 'aug') {
      const re = /([b#♭♯])(5|9|11|13)/g;
      let m;
      while ((m = re.exec(s))) degs.push([+m[2], /[b♭]/.test(m[1]) ? -1 : 1, 'alter']);
      if (/alt/.test(s)) { degs.push([9, -1, 'alter'], [9, 1, 'add'], [13, -1, 'alter']); }
    } else if (c.cls === 'hdim' || c.cls === 'min' || c.cls === 'maj') {
      const re = /([b#♭♯])(5|9|11|13)/g;
      let m;
      while ((m = re.exec(s))) { if (c.cls === 'hdim' && +m[2] === 5) continue; degs.push([+m[2], /[b♭]/.test(m[1]) ? -1 : 1, 'alter']); }
    }
    const rootAlter = c.root.a ? `<root-alter>${c.root.a}</root-alter>` : '';
    let h = '<harmony>' +
      `<root><root-step>${LETTERS[c.root.l]}</root-step>${rootAlter}</root>` +
      `<kind text="${xe(T.prettyAcc(s))}">${kind}</kind>`;
    if (c.bass) h += `<bass><bass-step>${LETTERS[c.bass.l]}</bass-step>${c.bass.a ? `<bass-alter>${c.bass.a}</bass-alter>` : ''}</bass>`;
    degs.forEach(d => { h += `<degree><degree-value>${d[0]}</degree-value><degree-alter>${d[1]}</degree-alter><degree-type>${d[2]}</degree-type></degree>`; });
    if (offsetDiv > 0) h += `<offset>${offsetDiv}</offset>`;
    return h + '</harmony>';
  }

  // 移調楽器の指定（書く音 → 実音）
  function transposeXml(semis) {
    if (!semis) return '';
    const steps = N.STEPS_OF_SEMIS[semis] != null ? N.STEPS_OF_SEMIS[semis] : 0;
    const octs = Math.floor(semis / 12);
    return `<transpose><diatonic>${-(steps % 7)}</diatonic><chromatic>${-(semis % 12)}</chromatic>${octs ? `<octave-change>${-octs}</octave-change>` : ''}</transpose>`;
  }

  // opts：{ title, tempo, bpb, score（N.scoreFromEvents の結果）, mode('major'|'minor'), inst:{ id, jp, transpose, clef }, feel, composer }
  function buildMusicXml(opts) {
    const score = opts.score, bpb = score.bpb, inst = opts.inst || { id: 'piano', jp: 'ピアノ', transpose: 0, clef: 'treble' };
    const clefXml = score.clef === 'bass' ? '<clef><sign>F</sign><line>4</line></clef>' : '<clef><sign>G</sign><line>2</line></clef>';
    const out = [];
    out.push('<?xml version="1.0" encoding="UTF-8"?>');
    out.push('<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">');
    out.push('<score-partwise version="3.1">');
    out.push(`<work><work-title>${xe(opts.title || 'アドリブ・ソロ')}</work-title></work>`);
    out.push(`<identification>${opts.composer ? `<creator type="composer">${xe(opts.composer)}</creator>` : ''}<encoding><software>アドリブ・ラボ</software></encoding></identification>`);
    out.push(`<part-list><score-part id="P1"><part-name>${xe(inst.jp)}</part-name><score-instrument id="P1-I1"><instrument-name>${xe(inst.jp)}</instrument-name></score-instrument><midi-instrument id="P1-I1"><midi-channel>1</midi-channel><midi-program>${(GM_PROGRAM[inst.id] || 0) + 1}</midi-program></midi-instrument></score-part></part-list>`);
    out.push('<part id="P1">');
    score.bars.forEach((bar, bi) => {
      const items = N.prepBar(bar, bpb);
      out.push(`<measure number="${bi + 1}">`);
      if (bi === 0) {
        out.push(`<attributes><divisions>${DIV}</divisions><key><fifths>${score.fifths}</fifths><mode>${opts.mode === 'minor' ? 'minor' : 'major'}</mode></key><time><beats>${bpb}</beats><beat-type>${score.timeSig[1]}</beat-type></time>${clefXml}${transposeXml(inst.transpose)}</attributes>`);
        if (opts.feel) out.push(`<direction placement="above"><direction-type><words font-style="italic">${xe(opts.feel)}</words></direction-type></direction>`);
        out.push(`<direction placement="above"><direction-type><metronome><beat-unit>quarter</beat-unit><per-minute>${Math.round(opts.tempo || 120)}</per-minute></metronome></direction-type><sound tempo="${Math.round(opts.tempo || 120)}"/></direction>`);
      }
      // フレーズの名前（リックの種類）を小節の頭に
      (score.marks || []).forEach(m => {
        if (!m.label) return;
        const mb = Math.floor(m.t0 / bpb + EPS);
        if (mb === bi) out.push(`<direction placement="below"><direction-type><words font-size="8">${xe(m.label)}</words></direction-type></direction>`);
      });
      // コード記号の置き場所：その時刻にかかる最初の項目の前（途中なら offset）
      const chords = (bar.chords || []).slice().sort((a, b) => a.t - b.t);
      const placed = new Array(items.length).fill(null).map(() => []);
      chords.forEach(c => {
        if (c.nc || c.bad) return;
        let k = items.findIndex(it => c.t < it.t + it.dur - EPS);
        if (k < 0) k = items.length - 1;
        placed[k].push({ c, off: Math.max(0, Math.round((c.t - items[k].t) * DIV)) });
      });
      // 3連符のまとまり
      const tripGroups = {};
      items.forEach((it, k) => { if (it.trip != null) (tripGroups[it.trip] = tripGroups[it.trip] || []).push(k); });
      items.forEach((it, k) => {
        placed[k].forEach(p => { out.push(harmonyXml(p.c.text, p.off)); });
        const dur = Math.round(it.dur * DIV);
        let s = '<note>';
        if (it.rest) {
          s += it.whole ? '<rest measure="yes"/>' : '<rest/>';
        } else {
          const p = it.ev.p;
          s += `<pitch><step>${LETTERS[p.l]}</step>${p.a ? `<alter>${p.a}</alter>` : ''}<octave>${p.oct}</octave></pitch>`;
        }
        s += `<duration>${it.whole ? bpb * DIV : dur}</duration>`;
        if (!it.rest && it.tiePrev) s += '<tie type="stop"/>';
        if (!it.rest && it.tieNext) s += '<tie type="start"/>';
        if (!it.whole) {
          const ty = N.typeOf(it.dur);
          s += `<type>${ty.base}</type>`;
          for (let d = 0; d < ty.dots; d++) s += '<dot/>';
          if (it.trip != null) s += '<time-modification><actual-notes>3</actual-notes><normal-notes>2</normal-notes></time-modification>';
        }
        let nots = '';
        if (it.trip != null) {
          const g = tripGroups[it.trip];
          if (g[0] === k) nots += '<tuplet type="start" number="1" bracket="yes"/>';
          if (g[g.length - 1] === k) nots += '<tuplet type="stop" number="1"/>';
        }
        if (!it.rest && it.tiePrev) nots += '<tied type="stop"/>';
        if (!it.rest && it.tieNext) nots += '<tied type="start"/>';
        if (!it.rest && it.ev) {
          let art = '';
          if (it.ev.accent && !it.tiePrev) art += '<accent/>';
          if (it.ev.stac) art += '<staccato/>';
          if (art) nots += `<articulations>${art}</articulations>`;
        }
        if (nots) s += `<notations>${nots}</notations>`;
        s += '</note>';
        out.push(s);
      });
      if (bi === score.bars.length - 1) out.push('<barline location="right"><bar-style>light-heavy</bar-style></barline>');
      out.push('</measure>');
    });
    out.push('</part>');
    out.push('</score-partwise>');
    return out.join('\n');
  }

  Object.assign(X, { collect, mergeTies, buildMidi, buildMusicXml, harmonyXml, GM_PROGRAM, GM_DRUM, PPQ });
  if (typeof module !== 'undefined' && module.exports) module.exports = AL;
})();
