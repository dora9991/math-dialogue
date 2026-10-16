/* アドリブ・ラボ：コード譜の文字 → 小節・コードの並び（画面を持たない）。
   書き方（iReal Pro に似せたもの）：
     | Dm7 | G7 | Cmaj7 | % |        … 縦線で小節を区切る。% は前の小節をくり返す
     | Dm7 G7 | Cmaj7 . . . |        … 1小節に複数のコード（均等に分ける）。. は「前のコードを1拍のばす」
     |: A :| / [1 … :| [2 …          … くり返し記号、1番・2番かっこ
     *A *B  /  [A] [B]               … セクション記号（表示用）
     N.C.   C/E   Dm7/G              … ノーコード、スラッシュコード（分数コード）
     // メモ   # メモ                 … 行末までコメント
   縦線がまったく無いときは、1語を1小節とみなす。 */
(function () {
  'use strict';
  const root = typeof window !== 'undefined' ? window : globalThis;
  const AL = (root.AL = root.AL || {});
  const T = AL.T;
  const C = (AL.C = AL.C || {});

  /* ---------------- 字句に分ける ---------------- */
  // 戻り値：[{t:'word'|'bar'|'dbar'|'rstart'|'rend'|'end'|'ending'|'section'|'repeat', s, n, i, j}]
  function tokenize(text) {
    const toks = [], len = text.length;
    let i = 0;
    while (i < len) {
      const ch = text[i];
      if (ch === '\n') { i++; continue; }
      if (/\s/.test(ch)) { i++; continue; }
      if (ch === '/' && text[i + 1] === '/') { while (i < len && text[i] !== '\n') i++; continue; }
      if (ch === '#') { while (i < len && text[i] !== '\n') i++; continue; }   // 語の頭の # はコメント（C#m7 の # は語の途中なので別）
      const st = i;
      if (ch === '|') {
        if (text[i + 1] === '|') { toks.push({ t: 'dbar', i: st, j: st + 2 }); i += 2; }
        else if (text[i + 1] === ':') { toks.push({ t: 'rstart', i: st, j: st + 2 }); i += 2; }
        else if (text[i + 1] === ']') { toks.push({ t: 'end', i: st, j: st + 2 }); i += 2; }
        else { toks.push({ t: 'bar', i: st, j: st + 1 }); i++; }
        continue;
      }
      if (ch === ':' && text[i + 1] === '|') { toks.push({ t: 'rend', i: st, j: st + 2 }); i += 2; continue; }
      if (ch === '[' && /\d/.test(text[i + 1] || '')) {
        let j = i + 1; while (j < len && /\d/.test(text[j])) j++;
        const n = parseInt(text.slice(i + 1, j), 10);
        if (text[j] === ']' || text[j] === '.') j++;
        toks.push({ t: 'ending', n, i: st, j }); i = j; continue;
      }
      if (ch === '[' && /[A-Za-z]/.test(text[i + 1] || '')) {
        let j = i + 1; while (j < len && text[j] !== ']' && text[j] !== '\n') j++;
        toks.push({ t: 'section', s: text.slice(i + 1, j).trim(), i: st, j: Math.min(len, j + 1) }); i = Math.min(len, j + 1); continue;
      }
      if (ch === '*' && /[A-Za-z0-9]/.test(text[i + 1] || '')) {
        let j = i + 1; while (j < len && /[A-Za-z0-9]/.test(text[j])) j++;
        toks.push({ t: 'section', s: text.slice(i + 1, j), i: st, j }); i = j; continue;
      }
      if (ch === '%') { toks.push({ t: 'repeat', i: st, j: st + 1 }); i++; continue; }
      let j = i;
      while (j < len && !/\s/.test(text[j]) && text[j] !== '|' && !(text[j] === ':' && text[j + 1] === '|')) j++;
      if (j === i) { i++; continue; }
      toks.push({ t: 'word', s: text.slice(i, j), i: st, j }); i = j;
    }
    return toks;
  }

  /* ---------------- 小節を組み立てる ---------------- */
  function badChord(src) {
    return { src, nc: true, bad: true, cls: 'nc', root: null, rootPc: -1, bass: null, bassPc: -1, suffix: '', tones: [], pcs: [] };
  }
  function buildBar(cells, bpb, prevBars, errors, barNo) {
    if (cells.length === 1 && cells[0].t === 'repeat') {
      if (!prevBars.length) { errors.push({ bar: barNo, i: cells[0].i, j: cells[0].j, word: '%', msg: '% の前に小節がありません' }); return null; }
      const p = prevBars[prevBars.length - 1];
      return { chords: p.chords.map(c => Object.assign({}, c)), copy: true };
    }
    const words = [];
    for (const tk of cells) {
      if (tk.t === 'repeat') { errors.push({ bar: barNo, i: tk.i, j: tk.j, word: '%', msg: '% は小節に1つだけ書きます' }); continue; }
      if (tk.s === '.' || tk.s === '·' || tk.s === '／') { words.push({ hold: true }); continue; }
      const chord = T.parseChord(tk.s);
      if (!chord) errors.push({ bar: barNo, i: tk.i, j: tk.j, word: tk.s, msg: `「${tk.s}」はコードとして読めません` });
      words.push({ src: tk.s, chord: chord || badChord(tk.s), i: tk.i, j: tk.j });
    }
    const chords = [];
    if (words.some(w => w.hold)) {
      // 1語＝1拍。. は前のコードを1拍のばす
      const marks = [];
      words.forEach((w, k) => { if (!w.hold) marks.push({ w, beat: k }); });
      if (words.length > bpb) errors.push({ bar: barNo, i: cells[0].i, j: cells[cells.length - 1].j, word: '', msg: `${barNo}小節目：拍の数（${bpb}）より多く書いてあります` });
      marks.forEach((m, k) => {
        if (m.beat >= bpb) return;
        const next = k + 1 < marks.length ? Math.min(marks[k + 1].beat, bpb) : bpb;
        chords.push({ src: m.w.src, chord: m.w.chord, beat: m.beat, dur: next - m.beat, i: m.w.i, j: m.w.j });
      });
    } else {
      const n = words.length;
      if (!n) return null;
      if (n >= bpb) {
        const d = bpb / n;
        words.forEach((w, k) => chords.push({ src: w.src, chord: w.chord, beat: k * d, dur: d, i: w.i, j: w.j }));
      } else {
        const base = Math.floor(bpb / n), extra = bpb - base * n;
        let at = 0;
        words.forEach((w, k) => {
          const d = base + (k < extra ? 1 : 0);
          chords.push({ src: w.src, chord: w.chord, beat: at, dur: d, i: w.i, j: w.j });
          at += d;
        });
      }
    }
    if (!chords.length) return null;
    return { chords };
  }

  /* ---------------- 解析本体 ---------------- */
  function parse(text, opts) {
    opts = opts || {};
    const bpb = opts.beatsPerBar || 4;
    text = String(text == null ? '' : text);
    let toks = tokenize(text);
    const errors = [];
    // 縦線がなければ、1語＝1小節
    if (!toks.some(t => t.t === 'bar' || t.t === 'dbar' || t.t === 'rstart' || t.t === 'rend' || t.t === 'end')) {
      const out = [];
      toks.forEach(tk => { out.push(tk); if (tk.t === 'word' || tk.t === 'repeat') out.push({ t: 'bar', i: tk.j, j: tk.j }); });
      toks = out;
    }
    const bars = [];
    let cells = [], repeatStart = false, section = null, curEnding = null;
    const flush = (repeatEnd) => {
      if (!cells.length) {
        if (repeatEnd && bars.length) { bars[bars.length - 1].repeatEnd = true; if (bars[bars.length - 1].ending === 1) curEnding = null; }
        return;
      }
      const b = buildBar(cells, bpb, bars, errors, bars.length + 1);
      const first = cells[0].i, last = cells[cells.length - 1].j;
      cells = [];
      if (!b) return;
      b.idx = bars.length; b.i = first; b.j = last;
      b.repeatStart = repeatStart; repeatStart = false;
      b.section = section; section = null;
      b.ending = curEnding;
      b.repeatEnd = !!repeatEnd;
      if (repeatEnd && curEnding === 1) curEnding = null;
      bars.push(b);
    };
    for (const tk of toks) {
      switch (tk.t) {
        case 'bar': case 'dbar': case 'end': flush(false); break;
        case 'rstart': flush(false); repeatStart = true; curEnding = null; break;
        case 'rend': flush(true); break;
        case 'ending': flush(false); curEnding = tk.n; break;
        case 'section': flush(false); section = tk.s; curEnding = null; break;
        default: cells.push(tk);
      }
    }
    flush(false);

    const order = playOrder(bars);
    return { bars, errors, beatsPerBar: bpb, order, chorusBars: order.length, chorusBeats: order.length * bpb, text };
  }

  // 1コーラスぶんの演奏順（くり返し記号・かっこを展開）。小節の番号の並びを返す
  function playOrder(bars) {
    const order = [];
    let pass = 1, rs = 0, i = 0, guard = 0, jumpedTo = -1;
    while (i < bars.length && guard++ < 5000) {
      const b = bars[i];
      if (b.repeatStart && jumpedTo !== i) { rs = i; pass = 1; }
      jumpedTo = -1;
      if (b.ending && b.ending !== pass) { i++; continue; }
      order.push(i);
      if (b.repeatEnd) {
        if (pass === 1) { pass = 2; jumpedTo = rs; i = rs; continue; }
        pass = 1;
      }
      i++;
    }
    return order;
  }

  /* ---------------- 拍の上でのコードの並び ---------------- */
  // 1コーラスぶんの「コードの枠」：[{i, chord, src, t0（コーラス先頭からの拍）, dur, bar（演奏順の小節番号）, srcBar（書いた小節）, beat（小節内の拍）}]
  function slotsOf(chart) {
    const slots = [];
    const bpb = chart.beatsPerBar;
    chart.order.forEach((bi, p) => {
      const b = chart.bars[bi];
      for (const c of b.chords) {
        slots.push({ i: slots.length, chord: c.chord, src: c.src, t0: p * bpb + c.beat, dur: c.dur, bar: p, srcBar: bi, beat: c.beat });
      }
    });
    return slots;
  }
  const sameChord = (a, b) => a.chord && b.chord && !a.chord.nc && !b.chord.nc
    && a.chord.rootPc === b.chord.rootPc && a.chord.bassPc === b.chord.bassPc && a.chord.suffix === b.chord.suffix;
  // 同じコードがつづくところを1つにまとめた「和声の区間」（リックを置く単位）
  function harmonicSlots(slots) {
    const out = [];
    for (const s of slots) {
      const last = out[out.length - 1];
      if (last && sameChord(last, s) && Math.abs(last.t0 + last.dur - s.t0) < 1e-6) { last.dur += s.dur; last.parts.push(s.i); continue; }
      out.push({ i: out.length, chord: s.chord, src: s.src, t0: s.t0, dur: s.dur, bar: s.bar, beat: s.beat, parts: [s.i] });
    }
    return out;
  }
  // 拍 t にひびいているコードの枠
  function slotAt(slots, t) {
    for (let k = slots.length - 1; k >= 0; k--) if (t >= slots[k].t0 - 1e-6) return slots[k];
    return slots[0] || null;
  }

  /* ---------------- 文字に書きもどす／移調 ---------------- */
  function barText(b, prev, bpb) {
    if (prev && prev.chords.length === b.chords.length && b.chords.every((c, k) => c.src === prev.chords[k].src && c.beat === prev.chords[k].beat && c.dur === prev.chords[k].dur)) return '%';
    const evenDur = b.chords.every(c => Math.abs(c.dur - b.chords[0].dur) < 1e-6) && Math.abs(b.chords[0].dur * b.chords.length - bpb) < 1e-6;
    if (evenDur || b.chords.some(c => c.beat % 1 !== 0 || c.dur % 1 !== 0)) return b.chords.map(c => c.src).join(' ');
    const cells = [];
    for (let k = 0; k < bpb; k++) cells.push('.');
    for (const c of b.chords) cells[c.beat] = c.src;
    return cells.join(' ');
  }
  // 整った文字にする（1行に perRow 小節）
  function formatText(chart, perRow) {
    perRow = perRow || 4;
    const bars = chart.bars, lines = [];
    let line = '', n = 0, prevEnding = null;
    const closeLine = last => { line += last.repeatEnd ? ' :|' : ' |'; lines.push(line); line = ''; n = 0; };
    bars.forEach((b, k) => {
      const prev = k ? bars[k - 1] : null;
      if (b.section) { if (line) closeLine(prev); lines.push('*' + b.section); }
      if (!line) line = b.repeatStart ? '|:' : '|';
      else line += prev.repeatEnd ? (b.repeatStart ? ' :| |:' : ' :|') : (b.repeatStart ? ' |:' : ' |');
      if (b.ending && b.ending !== prevEnding) line += ' [' + b.ending;
      prevEnding = b.ending;
      line += ' ' + barText(b, prev, chart.beatsPerBar);
      n++;
      if (n >= perRow || k === bars.length - 1 || bars[k + 1].section) closeLine(b);
    });
    return lines.join('\n');
  }

  // 文字のなかのコードを semis だけ移調して、ほかはそのまま返す（ctx は T.spellInKey と同じ）
  function transposeText(text, semis, ctx) {
    const toks = tokenize(String(text));
    let out = String(text);
    for (let k = toks.length - 1; k >= 0; k--) {
      const tk = toks[k];
      if (tk.t !== 'word' || tk.s === '.') continue;
      const nw = T.transposeChordStr(tk.s, semis, ctx);
      if (nw !== tk.s) out = out.slice(0, tk.i) + nw + out.slice(tk.j);
    }
    return out;
  }

  // 拍子ごとの小節の長さ
  const METERS = { '4/4': 4, '3/4': 3, '2/4': 2, '5/4': 5, '6/4': 6 };

  Object.assign(C, { tokenize, parse, playOrder, slotsOf, harmonicSlots, slotAt, formatText, transposeText, sameChord, METERS });
  if (typeof module !== 'undefined' && module.exports) module.exports = AL;
})();
