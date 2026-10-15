/* アドリブ・ラボ：楽譜の描画（SVG の文字列をつくる。DOM に依存しない）。
   単旋律のジャズのライン向け：五線・音部記号・調号・拍子・コード記号・8分音符の連桁・3連符・16分・タイ・休符・臨時記号。
   使い方：
     const score = N.scoreFromEvents({ events, slots, bpb, bars, keySpell, keyMode, inst, sections, marks, feel })
        … 実音の音符 → 楽譜のデータ（移調楽器・音部記号つき。events は { t, dur, p:{l,a,oct}, tie, accent, stac, id } の並び）
     const r = N.render(score, { width: 760, ss: 8, barsPerSystem: 4 })       … { svg, height, layout }
   layout は、再生カーソルや「どの音が鳴っているか」の表示に使う（拍 → x座標）。 */
(function () {
  'use strict';
  const root = typeof window !== 'undefined' ? window : globalThis;
  const AL = (root.AL = root.AL || {});
  const T = AL.T, G = AL.Glyphs;
  const N = (AL.N = AL.N || {});
  const mod = T.mod;
  const EPS = 1e-6;
  const f2 = n => Math.round(n * 100) / 100;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------------- 五線の幾何 ---------------- */
  // d：音の高さの通し番号（オクターブ*7 + 文字 0〜6、C0=0）。bottomD は下第1線、topD は上第5線、mid は第3線
  const CLEFS = {
    treble: { glyph: 'gClef', line: 3, bottomD: 30, topD: 38, mid: 34, sharps: [38, 35, 39, 36, 33, 37, 34], flats: [34, 37, 33, 36, 32, 35, 31] },
    bass: { glyph: 'fClef', line: 1, bottomD: 18, topD: 26, mid: 22, sharps: [24, 21, 25, 22, 19, 23, 20], flats: [20, 23, 19, 22, 18, 21, 17] },
  };
  const dOf = p => p.oct * 7 + p.l;
  const ACC = { 1: 'accSharp', '-1': 'accFlat', 0: 'accNatural', 2: 'accDoubleSharp', '-2': 'accDoubleFlat' };

  /* ---------------- リズムの正規化 ---------------- */
  const isOn = (x, q) => Math.abs(x / q - Math.round(x / q)) < 1e-4;
  const isTripletPos = x => { const fr = x - Math.floor(x + 1e-9); return fr > 1e-4 && isOn(fr, 1 / 3) && !isOn(fr, 0.25); };

  // t から長さ L の音符を書いてよいか（4/4 または 3/4。小節の真ん中をまたぐ長い音や、拍の中途半端な位置の大きな音符は分ける）
  function canWrite(t, L, bpb) {
    const end = t + L;
    if (end > bpb + EPS) return false;
    const onBeat = Math.abs(t - Math.round(t)) < EPS;
    switch (L) {
      case 4: return Math.abs(t) < EPS;
      case 3: return Math.abs(t) < EPS;
      case 2: return onBeat;                                           // 2分音符は、拍の頭ならどこでも（2拍目からの2分もジャズでは普通）
      case 1.5: return onBeat || (isOn(t, 0.5) && Math.abs(end - Math.round(end)) < EPS);
      case 1: return isOn(t, 0.5);
      case 0.75: return onBeat;
      case 0.5: return isOn(t, 0.5);
      case 0.25: return isOn(t, 0.25);
      default: return false;
    }
  }
  // 1つの音（開始 t・長さ d）を、書ける長さの列に分ける（分けた間はタイでつなぐ）
  function splitDur(t, d, bpb) {
    const pieces = [];
    let cur = t, rem = d, guard = 0;
    while (rem > EPS && guard++ < 24) {
      let chosen = 0.25;
      for (const L of [4, 3, 2, 1.5, 1, 0.75, 0.5, 0.25]) if (L <= rem + EPS && canWrite(cur, L, bpb)) { chosen = L; break; }
      pieces.push({ t: cur, dur: chosen });
      cur += chosen; rem -= chosen;
    }
    return pieces;
  }
  function splitRest(t, d, bpb) {
    const out = [];
    let cur = t, rem = d, guard = 0;
    while (rem > EPS && guard++ < 24) {
      const frac = cur - Math.floor(cur + EPS);
      let L;
      if (Math.abs(frac) < EPS) {
        if (rem >= 4 - EPS && Math.abs(cur) < EPS) L = 4;
        else if (rem >= 2 - EPS && bpb === 4 && Math.abs(cur % 2) < EPS) L = 2;
        else if (rem >= 1 - EPS) L = 1;
        else if (rem >= 0.5 - EPS) L = 0.5;
        else L = 0.25;
      } else {
        L = Math.min(rem, 1 - frac);
        L = L >= 0.5 - EPS ? 0.5 : 0.25;
      }
      out.push({ t: cur, dur: L });
      cur += L; rem -= L;
    }
    return out;
  }
  function typeOf(dur) {
    const near = (a, b) => Math.abs(a - b) < 1e-4;
    if (near(dur, 4)) return { base: 'whole', dots: 0, flags: 0, head: 'whole' };
    if (near(dur, 3)) return { base: 'half', dots: 1, flags: 0, head: 'half' };
    if (near(dur, 2)) return { base: 'half', dots: 0, flags: 0, head: 'half' };
    if (near(dur, 1.5)) return { base: 'quarter', dots: 1, flags: 0, head: 'black' };
    if (near(dur, 1) || near(dur, 2 / 3)) return { base: 'quarter', dots: 0, flags: 0, head: 'black' };
    if (near(dur, 0.75)) return { base: 'eighth', dots: 1, flags: 1, head: 'black' };
    if (near(dur, 0.5) || near(dur, 1 / 3)) return { base: 'eighth', dots: 0, flags: 1, head: 'black' };
    return { base: '16th', dots: 0, flags: 2, head: 'black' };
  }

  // 小節の音（t：小節内の拍、dur）を、並べた項目（音符・休符）にする
  function prepBar(bar, bpb) {
    const evs = (bar.events || []).slice().sort((a, b) => a.t - b.t);
    const seq = [];
    let cur = 0;
    for (const e of evs) {
      const t = Math.max(e.t, cur), d = Math.min(e.dur - (t - e.t), bpb - t);
      if (d <= EPS) continue;
      if (t > cur + EPS) seq.push({ t: cur, dur: t - cur, rest: true });
      seq.push({ t, dur: d, rest: false, ev: e });
      cur = t + d;
    }
    if (cur < bpb - EPS) seq.push({ t: cur, dur: bpb - cur, rest: true });
    if (!seq.length) seq.push({ t: 0, dur: bpb, rest: true });
    // 3連符の拍（1/3・2/3 の位置から始まる音がある拍）
    const tripBeats = new Set();
    seq.forEach(it => { if (isTripletPos(it.t) || (!it.rest && !isOn(it.dur, 0.25) && isOn(it.dur, 1 / 3))) tripBeats.add(Math.floor(it.t + 1e-4)); });
    // 3連符の拍にかかる休符は、拍の境目で切る（3連符の休符として書くため。そうしないと 1/3 拍が 16分休符2つになってしまう）
    const seq2 = [];
    for (const it of seq) {
      if (!it.rest) { seq2.push(it); continue; }
      const b0 = Math.floor(it.t + 1e-4), b1 = Math.floor(it.t + it.dur - 1e-4);
      let touches = false;
      for (let b = b0; b <= b1; b++) if (tripBeats.has(b)) touches = true;
      if (!touches) { seq2.push(it); continue; }
      let cur = it.t; const end = it.t + it.dur;
      while (cur < end - EPS) {
        const beat = Math.floor(cur + 1e-4);
        let nb = beat + 1;
        if (!tripBeats.has(beat)) while (nb < end - EPS && !tripBeats.has(nb)) nb++;   // 3連符でない拍がつづくあいだは、ひとまとめ
        const cut = Math.min(end, nb);
        seq2.push({ t: cur, dur: cut - cur, rest: true });
        cur = cut;
      }
    }
    const items = [];
    for (const it of seq2) {
      const beat = Math.floor(it.t + 1e-4);
      if (tripBeats.has(beat) && isOn(it.t - beat, 1 / 3) && isOn(it.dur, 1 / 3) && it.t + it.dur <= beat + 1 + EPS) {
        items.push({ t: it.t, dur: it.dur, rest: it.rest, ev: it.ev, trip: beat, tiePrev: !it.rest && it.ev && it.ev.first === false && Math.abs(it.t) < EPS, tieNext: !it.rest && !!(it.ev && it.ev.tie) });
        continue;
      }
      if (it.rest) {
        if (Math.abs(it.t) < EPS && Math.abs(it.dur - bpb) < EPS) items.push({ t: 0, dur: bpb, rest: true, whole: true });
        else splitRest(it.t, it.dur, bpb).forEach(p => items.push({ t: p.t, dur: p.dur, rest: true }));
        continue;
      }
      const pcs = splitDur(it.t, it.dur, bpb);
      pcs.forEach((p, k) => items.push({ t: p.t, dur: p.dur, rest: false, ev: it.ev, tiePrev: k > 0 || (it.ev.first === false && Math.abs(it.t) < EPS), tieNext: k < pcs.length - 1 || !!it.ev.tie }));
    }
    return items;
  }

  /* ---------------- 楽譜データづくり（実音のソロ → 楽器の譜面） ---------------- */
  const STEPS_OF_SEMIS = { 0: 0, 2: 1, 3: 2, 5: 3, 7: 4, 9: 5, 11: 6, 12: 7, 14: 8 };
  // opts：{ events, slots, bpb, bars, inst:{transpose, clef}, keySpell, keyMode, sections:[小節ごとの記号], marks:[{t0,t1,label,tone}], feel, firstBar }
  function scoreFromEvents(o) {
    const bpb = o.bpb || 4, nBars = o.bars;
    const semis = (o.inst && o.inst.transpose) || 0, steps = STEPS_OF_SEMIS[semis] != null ? STEPS_OF_SEMIS[semis] : 0;
    const clef = (o.inst && o.inst.clef) || 'treble';
    // 調号：主音を移調して、できるだけ♯♭の少ない綴りに
    const tonic = o.keySpell || T.parseSpell('C'), mode = o.keyMode || 'major';
    let wTonic = tonic;
    if (semis) {
      const q = T.shiftPitch({ l: tonic.l, a: tonic.a, oct: 4 }, steps, semis);
      wTonic = q ? { l: q.l, a: q.a } : T.spellFromPc(T.spellPc(tonic) + semis, true);
    }
    let fifths = T.keyFifths(wTonic, mode);
    if (Math.abs(fifths) > 7) { wTonic = T.keySpell(T.spellPc(wTonic), mode); fifths = T.keyFifths(wTonic, mode); }
    const ctxKey = { tonicPc: T.spellPc(wTonic), fifths };
    const bars = [];
    for (let b = 0; b < nBars; b++) bars.push({ chords: [], events: [], section: (o.sections && o.sections[b]) || null });
    // コード記号も音符と同じ移調規則（文字の数え方＋半音）で綴る。♯♭が合わないときだけ調号にあわせて綴りなおす
    const shiftRoot = sp => {
      const q = T.shiftPitch({ l: sp.l, a: sp.a, oct: 4 }, steps, semis);
      return q ? { l: q.l, a: q.a } : T.spellInKey(T.spellPc(sp) + semis, ctxKey);
    };
    const shiftChordText = (src, ch) => {
      const pm = /^([A-G][#b♭♯＃]?)(.*?)(?:\/([A-G][#b♭♯＃]?))?$/.exec(String(src).replace(/\s+/g, ''));
      if (!pm || !ch || !ch.root) return T.transposeChordStr(src, semis, ctxKey);
      let out = T.spellStr(shiftRoot(ch.root), false) + ch.suffix;
      if (ch.bass) out += '/' + T.spellStr(shiftRoot(ch.bass), false);
      return out;
    };
    const shift = p => {
      if (!semis) return p;
      const q = T.shiftPitch(p, steps, semis);
      return q || T.pitchFromMidi(T.pitchMidi(p) + semis, fifths <= 0);
    };
    (o.events || []).forEach((e, idx) => {
      let t = e.t, rem = e.dur;
      const p = shift(e.p);
      while (rem > EPS) {
        const b = Math.floor(t / bpb + EPS);
        if (b >= nBars) break;
        const tb = t - b * bpb, d = Math.min(rem, bpb - tb), last = rem - d <= EPS;
        bars[b].events.push({ t: tb, dur: d, p, id: e.id != null ? e.id : idx, tie: !last || !!e.tie, accent: !!e.accent, stac: !!e.stac, first: Math.abs(t - e.t) < EPS });
        t += d; rem -= d;
      }
    });
    (o.slots || []).forEach(s => {
      const b = Math.floor(s.t0 / bpb + EPS);
      if (b < 0 || b >= nBars) return;
      const ch = s.chord;
      const text = !ch || ch.nc ? (ch && ch.bad ? s.src : 'N.C.') : (semis ? shiftChordText(s.src, ch) : s.src);
      bars[b].chords.push({ t: s.t0 - b * bpb, text, nc: !ch || ch.nc, bad: !!(ch && ch.bad) });
    });
    return { bpb, clef, fifths, bars, marks: o.marks || [], feel: o.feel || '', firstBar: o.firstBar || 1, timeSig: [bpb, bpb === 6 ? 8 : 4] };
  }

  /* ---------------- レイアウト ---------------- */
  const advOf = d => d >= 4 - EPS ? 5.6 : d >= 3 - EPS ? 5.2 : d >= 2 - EPS ? 4.6 : d >= 1.5 - EPS ? 3.9 : d >= 1 - EPS ? 3.5 : d >= 0.75 - EPS ? 3.0 : d >= 0.5 - EPS ? 2.55 : d >= 0.33 - EPS ? 2.35 : 1.9;
  function chordWidth(text, fs) {
    const m = /^([A-G][#b♭♯]?)(.*)$/.exec(text);
    if (!m) return text.length * fs * 0.6;
    return (m[1].replace(/[#b♭♯]/, '').length * 0.66 + (/[#b♭♯]/.test(m[1]) ? 0.4 : 0) + m[2].length * 0.5 * 0.7) * fs;
  }
  function chordMarkup(text, x, y, fs, cls) {
    // 'Bbm7b5/E' → B♭ m7♭5 / E 。種類は小さく少し上に
    const m = /^([A-G])([#b♭♯]?)(.*?)(?:\/([A-G][#b♭♯]?))?$/.exec(text);
    if (!m) return `<text class="${cls}" x="${f2(x)}" y="${f2(y)}" font-size="${f2(fs)}">${esc(text)}</text>`;
    const acc = m[2] ? (m[2] === '#' || m[2] === '♯' ? '♯' : '♭') : '';
    const suf = T.prettyAcc(m[3] || '');
    let s = `<text class="${cls}" x="${f2(x)}" y="${f2(y)}" font-size="${f2(fs)}">${m[1]}`;
    if (acc) s += `<tspan font-size="${f2(fs * 0.7)}" dy="${f2(-fs * 0.22)}">${acc}</tspan><tspan dy="${f2(fs * 0.22)}"></tspan>`;
    if (suf) s += `<tspan font-size="${f2(fs * 0.68)}" dy="${f2(-fs * 0.3)}">${esc(suf)}</tspan><tspan dy="${f2(fs * 0.3)}"></tspan>`;
    if (m[4]) s += `<tspan font-size="${f2(fs * 0.85)}">/${esc(m[4].replace('b', '♭').replace('#', '♯'))}</tspan>`;
    return s + '</text>';
  }

  function layoutBar(bar, bpb, ss, keyAccs, clefName) {
    const items = prepBar(bar, bpb);
    // 臨時記号：小節の中で、同じ高さの音には、変化がないかぎり付けない
    const state = {};
    items.forEach(it => {
      if (it.rest) return;
      const p = it.ev.p, key = p.oct + ':' + p.l, cur = state[key] != null ? state[key] : keyAccs[p.l];
      it.d = dOf(p);
      it.acc = !it.tiePrev && p.a !== cur ? p.a : null;
      state[key] = p.a;
    });
    // 連桁のグループ（4/4 は2拍ずつ、3/4 は1拍ずつ。休符・4分音符以上で切れる。3連符は拍ごと）
    const half = bpb === 4 ? 2 : 1;
    const groups = [];
    let cur = null;
    items.forEach((it, i) => {
      const beamable = !it.rest && it.dur <= 0.75 + EPS && typeOf(it.dur).flags > 0;
      if (!beamable) { cur = null; return; }
      const key = it.trip != null ? 'T' + it.trip : 'H' + Math.floor((it.t + 1e-4) / half);
      const prev = items[i - 1];
      if (cur && cur.key === key && prev && !prev.rest && prev.t + prev.dur >= it.t - EPS) cur.items.push(it);
      else { cur = { key, items: [it] }; groups.push(cur); }
    });
    groups.forEach(g => g.items.forEach(it => { it.group = g; }));
    const cols = items.map(it => ({ it, pre: it.acc != null ? 1.15 : 0, adv: advOf(it.dur) + typeOf(it.dur).dots * 0.55 }));
    const padL = 1.5, padR = 1.1;
    let natural = 0;
    cols.forEach(c => { natural += c.pre + c.adv; });
    let minW = (padL + padR + natural) * ss;
    // コード記号どうしがぶつからない幅
    const fs = 2.35 * ss, chords = bar.chords || [];
    for (let j = 0; j + 1 < chords.length; j++) {
      const gap = chordWidth(chords[j].text, fs) + 0.9 * ss, span = Math.max(0.5, chords[j + 1].t - chords[j].t);
      minW = Math.max(minW, gap * bpb / span + 1.5 * ss);
    }
    if (chords.length) { const last = chords[chords.length - 1]; minW = Math.max(minW, chordWidth(last.text, fs) * bpb / Math.max(0.5, bpb - last.t) + 1.2 * ss); }
    return { items, cols, groups, padL, padR, minW, bar };
  }

  /* ---------------- 描画 ---------------- */
  function glyph(name, x, y, ss, cls) {
    const g = G[name];
    if (!g) return '';
    return `<path class="${cls || 'g'}" transform="translate(${f2(x)} ${f2(y)}) scale(${(ss / 250).toFixed(5)})" d="${g.d}"/>`;
  }
  const gw = (name, ss) => G[name].w * ss / 250;
  const line = (cls, x1, y1, x2, y2, sw) => `<line class="${cls}" x1="${f2(x1)}" x2="${f2(x2)}" y1="${f2(y1)}" y2="${f2(y2)}" stroke-width="${f2(sw)}"/>`;

  function render(score, opts) {
    opts = opts || {};
    const ss = opts.ss || 8, W = opts.width || 760, bpb = score.bpb;
    const clefName = score.clef === 'bass' ? 'bass' : 'treble', clef = CLEFS[clefName];
    const keyAccs = T.keySigAccs(score.fifths);
    const marginL = 8, marginR = 8, headW = 1.18 * ss, stemW = 0.12 * ss;
    const keyW = Math.abs(score.fifths) * 1.15 * ss + (score.fifths ? 0.9 * ss : 0.2 * ss);
    const leftOther = marginL + gw(clef.glyph, ss) + 1.3 * ss + keyW;
    const leftFirst = leftOther + 3.2 * ss;
    const bars = score.bars.map(b => layoutBar(b, bpb, ss, keyAccs, clefName));
    const perMax = opts.barsPerSystem || 4;
    const systems = [];
    for (let i = 0; i < bars.length;) {
      const left = systems.length === 0 ? leftFirst : leftOther, avail = W - left - marginR;
      let n = Math.min(perMax, bars.length - i);
      while (n > 1 && bars.slice(i, i + n).reduce((a, b) => a + b.minW, 0) > avail) n--;
      systems.push({ bars: bars.slice(i, i + n), from: i, left, avail });
      i += n;
    }
    const hasMarks = !!(score.marks && score.marks.length);
    let y = 0.6 * ss;
    const out = [], layout = { systems: [], bars: [], ss, width: W, bpb, headW };
    const noteMap = [];
    systems.forEach((sys, si) => {
      // 音（符頭・臨時記号・連桁）が五線の上下にはみ出す量に合わせて、コード記号の段と下の括弧の段をひろげる（単位は ss）
      let up = 0, down = 0;
      sys.bars.forEach(b => {
        b.items.forEach(it => {
          if (it.rest) return;
          up = Math.max(up, (it.d - clef.topD) / 2 + (it.acc != null ? 1.9 : 0.8));
          down = Math.max(down, (clef.bottomD - it.d) / 2 + (it.acc != null ? 1.3 : 0.8));
        });
        b.groups.forEach(g => {
          if (g.items.length < 2) return;
          if (groupDirOf(g, clef) === 'up') up = Math.max(up, (Math.max(...g.items.map(it => it.d)) + 7 - clef.topD) / 2 + 0.3);
          else down = Math.max(down, (clef.bottomD - (Math.min(...g.items.map(it => it.d)) - 7)) / 2 + 0.3);
        });
      });
      const extraTop = Math.max(0, up - 1.5) * ss, extraBot = Math.max(0, down - 1.5) * ss;
      const chordBase = y + 3.6 * ss + (si === 0 && score.feel ? 2.0 * ss : 0);
      const sTop = chordBase + 1.5 * ss + extraTop, sBot = sTop + 4 * ss;
      const sumMin = sys.bars.reduce((a, b) => a + b.minW, 0);
      let extra = sys.avail - sumMin;
      if (si === systems.length - 1 && sys.bars.length < perMax) extra = Math.min(extra, sys.bars.length * 16 * ss);
      extra = Math.max(0, extra);
      const sysEnd = sys.left + sumMin + extra;
      const lineY = k => sTop + k * ss;
      const yOf = d => sTop + (clef.topD - d) * ss / 2;
      for (let k = 0; k < 5; k++) out.push(line('staff', marginL, lineY(k), sysEnd, lineY(k), 0.13 * ss));
      out.push(line('bar', marginL, sTop, marginL, sBot, 0.16 * ss));
      out.push(glyph(clef.glyph, marginL + 0.4 * ss, lineY(clef.line), ss, 'g'));
      let kx = marginL + gw(clef.glyph, ss) + 1.3 * ss;
      const list = score.fifths > 0 ? clef.sharps : clef.flats;
      for (let k = 0; k < Math.abs(score.fifths); k++) { out.push(glyph(score.fifths > 0 ? 'accSharp' : 'accFlat', kx, yOf(list[k]), ss, 'g')); kx += 1.15 * ss; }
      if (si === 0) {
        const tx = kx + 0.9 * ss, ts = score.timeSig;
        out.push(glyph('tsig' + ts[0], tx, lineY(1), ss, 'g'), glyph('tsig' + ts[1], tx, lineY(3), ss, 'g'));
        if (score.feel) out.push(`<text class="feel" x="${f2(marginL + 2.2 * ss)}" y="${f2(chordBase - 3.0 * ss)}" font-size="${f2(1.6 * ss)}">${esc(score.feel)}</text>`);
      }
      const sysLayout = { index: si, top: sTop, bottom: sBot, chordBase, bars: [] };
      let x = sys.left;
      sys.bars.forEach((bl, bi) => {
        const barIdx = sys.from + bi, w = bl.minW + extra / sys.bars.length, x0 = x, x1 = x + w;
        let cx = x0 + bl.padL * ss;
        const ex = w - bl.minW;
        bl.cols.forEach(c => { cx += c.pre * ss; c.x = cx; cx += c.adv * ss + ex * (c.it.dur / bpb); });
        const lastBar = si === systems.length - 1 && bi === sys.bars.length - 1;
        if (lastBar) out.push(line('bar', x1 - 0.6 * ss, sTop, x1 - 0.6 * ss, sBot, 0.16 * ss), line('bar', x1 - 0.2 * ss, sTop, x1 - 0.2 * ss, sBot, 0.5 * ss));
        else out.push(line('bar', x1, sTop, x1, sBot, 0.16 * ss));
        if (bi === 0) out.push(`<text class="barno" x="${f2(marginL)}" y="${f2(chordBase - 0.4 * ss)}" font-size="${f2(1.2 * ss)}">${barIdx + score.firstBar}</text>`);
        if (bl.bar.section) out.push(`<g class="rehearsal"><rect x="${f2(x0 + 0.3 * ss)}" y="${f2(chordBase - 4.1 * ss)}" width="${f2(2 * ss)}" height="${f2(1.8 * ss)}" rx="${f2(0.2 * ss)}" stroke-width="${f2(0.14 * ss)}"/><text x="${f2(x0 + 1.3 * ss)}" y="${f2(chordBase - 2.65 * ss)}" font-size="${f2(1.5 * ss)}" text-anchor="middle">${esc(bl.bar.section)}</text></g>`);
        // 拍 → x（カーソル・コード記号の位置）。音の頭の x から次の音までを線形に
        const timeToX = t => {
          const cols = bl.cols;
          for (let k = 0; k < cols.length; k++) {
            const c = cols[k], c0 = c.it.t, c1 = c0 + c.it.dur, nx = k + 1 < cols.length ? cols[k + 1].x - cols[k + 1].pre * ss : x1 - bl.padR * ss;
            if (t < c1 - EPS || k === cols.length - 1) return c.x + (nx - c.x) * Math.min(1, Math.max(0, (t - c0) / Math.max(EPS, c1 - c0)));
          }
          return x0;
        };
        const fs = 2.35 * ss;
        (bl.bar.chords || []).forEach(c => out.push(chordMarkup(c.text, c.t < EPS ? x0 + 0.45 * ss : timeToX(c.t) - 0.15 * ss, chordBase, fs, c.bad ? 'chord bad' : c.nc ? 'chord nc' : 'chord')));
        drawBar(out, bl, { ss, sTop, clef, headW, stemW, bpb, noteMap, barIdx, x0, x1, yOf });
        sysLayout.bars.push({ index: barIdx, x0, x1 });
        layout.bars[barIdx] = { sys: si, x0, x1, timeToX, top: sTop, bottom: sBot, cols: bl.cols.map(c => ({ t: c.it.t, x: c.x })) };
        x = x1;
      });
      layout.systems.push(sysLayout);
      // 下に引く括弧（リックの範囲）
      if (hasMarks) {
        const b0 = sys.from, b1 = sys.from + sys.bars.length;
        score.marks.forEach((m, mi) => {
          const bs = Math.floor(m.t0 / bpb + EPS), be = Math.floor((m.t1 - EPS) / bpb);
          if (be < b0 || bs >= b1) return;
          const xa = bs >= b0 ? layout.bars[bs].timeToX(m.t0 - bs * bpb) - 0.4 * ss : sys.left - 0.5 * ss;
          const xb = be < b1 ? Math.min(layout.bars[be].x1 - 0.3 * ss, layout.bars[be].timeToX(m.t1 - be * bpb - 0.02) + 1.5 * ss) : sysEnd - 0.4 * ss;
          const yy = sBot + extraBot + 2.1 * ss;
          out.push(`<g class="mark m${(m.tone || 0) % 4}" data-mark="${mi}"><path class="hit" d="M${f2(xa)} ${f2(yy - 0.3 * ss)} H${f2(xb)}" fill="none" stroke="#000" stroke-opacity="0" pointer-events="stroke" stroke-width="${f2(2 * ss)}"/><path d="M${f2(xa)} ${f2(yy - 0.55 * ss)} V${f2(yy)} H${f2(xb)} V${f2(yy - 0.55 * ss)}" fill="none" stroke-width="${f2(0.14 * ss)}"/>${bs >= b0 ? `<text x="${f2(xa + 0.2 * ss)}" y="${f2(yy + 1.35 * ss)}" font-size="${f2(1.15 * ss)}">${esc(m.label)}</text>` : ''}</g>`);
        });
      }
      y = sBot + extraBot + 3.2 * ss + (hasMarks ? 2.4 * ss : 0);
    });
    layout.height = y;
    layout.noteMap = noteMap;
    const svg = `<svg class="ntn" xmlns="http://www.w3.org/2000/svg" width="${W}" height="${f2(y)}" viewBox="0 0 ${W} ${f2(y)}" role="img" aria-label="譜面">${out.join('')}</svg>`;
    return { svg, height: y, layout };
  }

  // 連桁の符幹の向き：音の平均が中央線より上なら下向き
  const groupDirOf = (g, clef) => (g.items.reduce((a, it) => a + (it.d - clef.mid), 0) >= 0 ? 'down' : 'up');

  function drawBar(out, bl, c) {
    const { ss, sTop, clef, headW, stemW, bpb, noteMap, barIdx, yOf } = c;
    const midY = sTop + 2 * ss;
    const groupDir = g => groupDirOf(g, clef);
    bl.items.forEach((it, i) => { it.x = bl.cols[i].x; });
    // 休符
    bl.items.forEach(it => {
      if (!it.rest) return;
      const ty = typeOf(it.dur);
      if (it.whole) { out.push(glyph('restWhole', (c.x0 + c.x1) / 2 - 0.6 * ss, sTop + ss, ss, 'g rest')); return; }
      if (ty.base === 'whole') { out.push(glyph('restWhole', it.x, sTop + ss, ss, 'g rest')); return; }
      if (ty.base === 'half') { out.push(glyph('restHalf', it.x, sTop + 2 * ss, ss, 'g rest')); if (ty.dots) out.push(glyph('dot', it.x + 1.7 * ss, sTop + 1.5 * ss, ss, 'g')); return; }
      out.push(glyph(ty.base === 'quarter' ? 'restQuarter' : ty.base === 'eighth' ? 'rest8th' : 'rest16th', it.x, sTop + 2 * ss, ss, 'g rest'));
      if (ty.dots) out.push(glyph('dot', it.x + 1.45 * ss, sTop + 1.5 * ss, ss, 'g'));
    });
    const noteItems = bl.items.filter(it => !it.rest);
    noteItems.forEach(it => {
      it.y = yOf(it.d); it.ty = typeOf(it.dur);
      it.dir = it.group ? groupDir(it.group) : (it.d >= clef.mid ? 'down' : 'up');
    });
    // 連桁：線の傾きを抑えて、符幹が短くなりすぎないように持ち上げる
    const beamed = [];
    bl.groups.forEach(g => {
      const its = g.items;
      if (its.length < 2) return;
      const dir = groupDir(g), dsgn = dir === 'up' ? -1 : 1;
      const xs = its.map(it => dir === 'up' ? it.x + headW - stemW / 2 : it.x + stemW / 2);
      const tips = its.map(it => it.y + dsgn * 3.5 * ss);
      const dx = xs[xs.length - 1] - xs[0];
      let slope = dx > 0 ? (tips[tips.length - 1] - tips[0]) / dx : 0;
      const maxSlope = Math.min(0.22, 1.4 * ss / Math.max(dx, 1));
      slope = Math.max(-maxSlope, Math.min(maxSlope, slope));
      const xm = (xs[0] + xs[xs.length - 1]) / 2, ym = (tips[0] + tips[tips.length - 1]) / 2;
      const lineAt = x => ym + slope * (x - xm);
      let shift = 0;
      its.forEach((it, k) => {
        const need = dir === 'up' ? (lineAt(xs[k]) - (it.y - 2.9 * ss)) : ((it.y + 2.9 * ss) - lineAt(xs[k]));
        if (need > shift) shift = need;
      });
      const sh = dsgn * shift;
      its.forEach((it, k) => { it.stemX = xs[k]; it.tipY = lineAt(xs[k]) + sh; });
      beamed.push({ dir, xs, its, lineAt: x => lineAt(x) + sh });
    });
    // 符頭・加線・臨時記号・符幹・符尾・付点・アーティキュレーション
    noteItems.forEach(it => {
      const ty = it.ty, dir = it.dir, dsgn = dir === 'up' ? -1 : 1;
      const evAttr = it.ev && it.ev.id != null ? ` data-ev="${it.ev.id}"` : '';
      const grp = [];
      for (let ld = clef.bottomD - 2; ld >= it.d; ld -= 2) grp.push(line('ledger', it.x - 0.45 * ss, yOf(ld), it.x + headW + 0.45 * ss, yOf(ld), 0.16 * ss));
      for (let ld = clef.topD + 2; ld <= it.d; ld += 2) grp.push(line('ledger', it.x - 0.45 * ss, yOf(ld), it.x + headW + 0.45 * ss, yOf(ld), 0.16 * ss));
      if (it.acc != null) grp.push(glyph(ACC[it.acc], it.x - gw(ACC[it.acc], ss) - 0.3 * ss, it.y, ss, 'g acc'));
      grp.push(glyph(ty.head === 'whole' ? 'noteheadWhole' : ty.head === 'half' ? 'noteheadHalf' : 'noteheadBlack', it.x, it.y, ss, 'g head'));
      if (ty.head !== 'whole') {
        let sx, tip;
        if (it.stemX != null) { sx = it.stemX; tip = it.tipY; }
        else {
          sx = dir === 'up' ? it.x + headW - stemW / 2 : it.x + stemW / 2;
          tip = it.y + dsgn * 3.5 * ss;
          tip = dir === 'up' ? Math.min(tip, midY) : Math.max(tip, midY);
        }
        const y0 = dir === 'up' ? it.y - 0.168 * ss : it.y + 0.168 * ss;
        grp.push(line('stem', sx, y0, sx, tip, stemW));
        it.sx = sx; it.tip = tip;
        if (ty.flags > 0 && it.stemX == null) grp.push(glyph(ty.flags === 1 ? (dir === 'up' ? 'flag8thUp' : 'flag8thDown') : (dir === 'up' ? 'flag16thUp' : 'flag16thDown'), sx - stemW / 2, tip, ss, 'g flag'));
      } else { it.sx = it.x + headW / 2; it.tip = it.y; }
      for (let k = 0; k < ty.dots; k++) grp.push(glyph('dot', it.x + headW + (0.45 + k * 0.5) * ss, (it.d - clef.bottomD) % 2 === 0 ? it.y - 0.5 * ss : it.y, ss, 'g'));
      if (it.ev && it.ev.accent && !it.tiePrev) grp.push(glyph('accent', it.x + 0.1 * ss, it.y + (dir === 'up' ? 1.9 : -1.9) * ss, ss, 'g art'));
      if (it.ev && it.ev.stac) grp.push(glyph('dot', it.x + headW / 2 - 0.1 * ss, it.y + (dir === 'up' ? 1.2 : -1.2) * ss, ss, 'g art'));
      out.push(`<g class="note"${evAttr}>${grp.join('')}</g>`);
      noteMap.push({ bar: barIdx, t: it.t, ev: it.ev && it.ev.id, x: it.x, y: it.y });
    });
    // 連桁の本体と、16分の2本目、3連符の数字
    beamed.forEach(b => {
      const { its, dir, xs, lineAt } = b;
      const th = 0.5 * ss, sign = dir === 'up' ? 1 : -1;
      const poly = (xa, xb, off) => {
        const ya = lineAt(xa) + sign * off, yb = lineAt(xb) + sign * off;
        return `<polygon class="beam" points="${f2(xa)},${f2(ya)} ${f2(xb)},${f2(yb)} ${f2(xb)},${f2(yb + sign * th)} ${f2(xa)},${f2(ya + sign * th)}"/>`;
      };
      out.push(poly(xs[0] - stemW / 2, xs[xs.length - 1] + stemW / 2, 0));
      its.forEach((it, k) => {
        if (it.ty.flags < 2) return;
        const prev = its[k - 1], next = its[k + 1], pS = prev && prev.ty.flags >= 2, nS = next && next.ty.flags >= 2;
        if (nS) out.push(poly(xs[k] - stemW / 2, xs[k + 1] + stemW / 2, 0.75 * ss));
        else if (pS) return;
        else if (prev) out.push(poly(xs[k] - 1.2 * ss, xs[k] + stemW / 2, 0.75 * ss));
        else out.push(poly(xs[k] - stemW / 2, xs[k] + 1.2 * ss, 0.75 * ss));
      });
      if (its[0].trip != null && its.length >= 2) {
        const xm = (xs[0] + xs[xs.length - 1]) / 2, ym = lineAt(xm) - sign * 0.9 * ss;
        out.push(`<text class="tup" x="${f2(xm)}" y="${f2(ym + (dir === 'up' ? 0 : 0.9 * ss))}" font-size="${f2(1.4 * ss)}" text-anchor="middle">3</text>`);
      }
    });
    // 休符をふくむ3連符（連桁にならないもの）
    const trips = {};
    bl.items.forEach(it => { if (it.trip != null) (trips[it.trip] = trips[it.trip] || []).push(it); });
    Object.values(trips).forEach(arr => {
      if (arr.some(it => it.group && it.group.items.length >= 2)) return;
      const xa = arr[0].x - 0.2 * ss, xb = arr[arr.length - 1].x + headW + 0.2 * ss;
      const yy = Math.min(sTop - 0.8 * ss, ...arr.filter(it => !it.rest).map(it => (it.tip != null ? Math.min(it.y, it.tip) : it.y) - 0.8 * ss));
      out.push(`<path class="tupb" d="M${f2(xa)} ${f2(yy + 0.6 * ss)} V${f2(yy)} H${f2(xb)} V${f2(yy + 0.6 * ss)}" fill="none" stroke-width="${f2(0.12 * ss)}"/><text class="tup" x="${f2((xa + xb) / 2)}" y="${f2(yy - 0.2 * ss)}" font-size="${f2(1.4 * ss)}" text-anchor="middle">3</text>`);
    });
    // タイ（同じ高さの音どうし。小節をまたぐものは、出だしと終わりの短い弧）
    const tie = (xa, xb, y, dir, mid) => {
      const h = dir * (0.55 + Math.min(0.5, Math.abs(xb - xa) / (ss * 14))) * ss, yy = y + dir * 0.55 * ss;
      out.push(`<path class="tie" d="M${f2(xa)} ${f2(yy)} C${f2(xa + (xb - xa) * 0.28)} ${f2(yy + h)} ${f2(xa + (xb - xa) * 0.72)} ${f2(yy + h)} ${f2(xb)} ${f2(yy)}" fill="none" stroke-width="${f2(0.17 * ss)}"/>`);
    };
    for (let k = 0; k < noteItems.length; k++) {
      const a = noteItems[k], b = noteItems[k + 1];
      const dir = a.dir === 'up' ? 1 : -1;
      if (a.tieNext && b && b.tiePrev && b.d === a.d) tie(a.x + headW * 0.9, b.x + headW * 0.1, a.y, dir);
      else if (a.tieNext && (!b || !b.tiePrev) && a.t + a.dur >= bpb - EPS) tie(a.x + headW * 0.9, c.x1 - 0.2 * ss, a.y, dir);
      if (k === 0 && a.tiePrev && (a.t < EPS)) tie(c.x0 + 0.2 * ss, a.x + headW * 0.1, a.y, a.dir === 'up' ? 1 : -1);
    }
  }

  /* ---------------- 小さなプレビュー（リック辞典用） ---------------- */
  // events：実音のイベント（L.realize の結果から作った { t, dur, p, ... }）、chordSrcs・chordBeats：各コードの記号と拍数
  function preview(events, chordSrcs, chordBeats, opts) {
    opts = opts || {};
    const bpb = opts.bpb || 4;
    const total = chordBeats.reduce((a, b) => a + b, 0), bars = Math.max(1, Math.ceil(total / bpb - EPS));
    const slots = []; let t = 0;
    chordSrcs.forEach((src, i) => { slots.push({ t0: t, dur: chordBeats[i], src, chord: T.parseChord(src) }); t += chordBeats[i]; });
    const score = scoreFromEvents({ events, slots, bpb, bars, keySpell: opts.keySpell, keyMode: opts.keyMode, inst: opts.inst });
    return render(score, { width: opts.width || 520, ss: opts.ss || 6.2, barsPerSystem: opts.barsPerSystem || Math.min(bars, 4) });
  }

  Object.assign(N, { scoreFromEvents, render, preview, prepBar, splitDur, splitRest, typeOf, canWrite, STEPS_OF_SEMIS });
  if (typeof module !== 'undefined' && module.exports) module.exports = AL;
})();
