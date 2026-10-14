/* アドリブ・ラボ：音楽理論の土台（画面を持たない。ブラウザでも node の検査でも読める）。
   ・音名の綴り（C, D♭, F♯ …）と、音程の数え方（度数 b7, #11 …）
   ・コード記号の読みとり（Dm7b5, G7(b9,#13), C/E, Cmaj7#11 …）
   ・スケール辞典、ローマ数字、調号、移調
   使い方のきまり：音は「綴り {l:文字0〜6, a:変化記号-2〜2}」と「音高 {l,a,oct}」で持つ（C4 = 60）。
   リックはコードの度数（b7, #11 …）で数えるので、移調しても D♯ と E♭ のような綴りがくずれない。 */
(function () {
  'use strict';
  const root = typeof window !== 'undefined' ? window : globalThis;
  const AL = (root.AL = root.AL || {});
  const T = (AL.T = AL.T || {});

  const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const LETTER_PC = [0, 2, 4, 5, 7, 9, 11];
  const MAJOR = [0, 2, 4, 5, 7, 9, 11];
  const mod = (n, m) => ((n % m) + m) % m;
  const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

  /* ---------------- 音名（綴り） ---------------- */
  function parseSpell(s) {
    const m = /^([A-G])(##|bb|x|[#b♯♭])?$/.exec(String(s == null ? '' : s).trim());
    if (!m) return null;
    const a = m[2] ? { '#': 1, '♯': 1, '##': 2, x: 2, b: -1, '♭': -1, bb: -2 }[m[2]] : 0;
    return { l: LETTERS.indexOf(m[1]), a };
  }
  const spellPc = sp => mod(LETTER_PC[sp.l] + sp.a, 12);
  function spellStr(sp, uni) {
    const acc = sp.a === 0 ? '' : sp.a > 0 ? (uni ? '♯' : '#').repeat(sp.a) : (uni ? '♭' : 'b').repeat(-sp.a);
    return LETTERS[sp.l] + acc;
  }
  const spellFromPc = (pc, preferFlat) => parseSpell((preferFlat ? FLAT_NAMES : SHARP_NAMES)[mod(pc, 12)]);
  const sameSpell = (a, b) => a && b && a.l === b.l && a.a === b.a;

  /* ---------------- 音高（綴り＋オクターブ。C4 = MIDI 60） ---------------- */
  const pitchMidi = p => 12 * (p.oct + 1) + LETTER_PC[p.l] + p.a;
  function pitchFromMidi(m, preferFlat) {
    const sp = spellFromPc(m, preferFlat);
    return { l: sp.l, a: sp.a, oct: Math.floor((m - sp.a - LETTER_PC[sp.l]) / 12) - 1 };
  }
  function parsePitch(s) {
    const m = /^([A-G])(##|bb|x|[#b♯♭])?(-?\d)$/.exec(String(s).trim());
    if (!m) return null;
    const sp = parseSpell(m[1] + (m[2] || ''));
    return { l: sp.l, a: sp.a, oct: parseInt(m[3], 10) };
  }
  const pitchStr = (p, uni) => spellStr(p, uni) + p.oct;
  // 文字（度数）で steps、半音で semis だけ上へ（負なら下へ）動かす。綴れないとき（三重♯など）は null
  function shiftPitch(p, steps, semis) {
    const abs = p.oct * 7 + p.l + steps;
    const oct = Math.floor(abs / 7), l = mod(abs, 7);
    const a = pitchMidi(p) + semis - (12 * (oct + 1) + LETTER_PC[l]);
    if (a < -2 || a > 2) return null;
    return { l, a, oct };
  }

  /* ---------------- 度数（1, b3, #4, b7, 9, #11, b13 …） ---------------- */
  function parseDegree(str) {
    const m = /^(bb|b|##|#|♭|♯)?(\d{1,2})$/.exec(String(str));
    if (!m) return null;
    const n = parseInt(m[2], 10);
    if (n < 1) return null;
    const alt = !m[1] ? 0 : { b: -1, bb: -2, '#': 1, '##': 2, '♭': -1, '♯': 1 }[m[1]];
    const steps = n - 1;
    return { n, alt, steps, semis: MAJOR[steps % 7] + 12 * Math.floor(steps / 7) + alt };
  }
  // ルートの綴りと度数から、その音の綴り（オクターブなし）
  function degreeSpell(rootSp, deg) {
    const d = typeof deg === 'string' ? parseDegree(deg) : deg;
    if (!d) return null;
    const l = mod(rootSp.l + d.steps, 7);
    const pc = mod(spellPc(rootSp) + d.semis, 12);
    const a = mod(pc - LETTER_PC[l] + 6, 12) - 6;
    if (a < -2 || a > 2) return null;
    return { l, a };
  }
  // 音高（綴り＋オクターブ）→ ルートからの度数（文字上の距離 steps と半音 semis）
  function intervalFromRoot(rootSp, p) {
    const steps = mod(p.l - rootSp.l, 7);
    const semis = mod(pitchMidi(p) - spellPc(rootSp), 12);
    return { steps, semis };
  }
  const DEG_NAMES = { 0: '1', 1: 'b9', 2: '9', 3: '#9', 4: '3', 5: '11', 6: '#11', 7: '5', 8: 'b13', 9: '13', 10: 'b7', 11: '7' };
  // 半音数（0〜11）→ ジャズ式の度数名。コードの種類 cls を渡すと、その種類らしい呼び名になる（短調系の 3 半音は b3 など）
  function semisToDegreeName(semis, cls) {
    const s = mod(semis, 12);
    const minorish = cls === 'min' || cls === 'minmaj' || cls === 'hdim' || cls === 'dim';
    if (minorish) {
      const m = { 3: 'b3', 6: 'b5', 8: 'b6', 9: cls === 'dim' ? 'bb7' : '6' };
      if (m[s]) return m[s];
    } else if (cls === 'maj') {
      const m = { 3: 'b3', 8: 'b6' };
      if (m[s]) return m[s];
    }
    return DEG_NAMES[s];
  }

  /* ---------------- 調号 ---------------- */
  const SHARP_ORDER = [3, 0, 4, 1, 5, 2, 6]; // F C G D A E B
  const FLAT_ORDER = [6, 2, 5, 1, 4, 0, 3];  // B E A D G C F
  // fifths（-7〜+7）→ 文字ごとの変化記号 [C,D,E,F,G,A,B]
  function keySigAccs(fifths) {
    const acc = [0, 0, 0, 0, 0, 0, 0];
    const n = Math.max(-7, Math.min(7, fifths | 0));
    for (let i = 0; i < Math.abs(n); i++) acc[(n > 0 ? SHARP_ORDER : FLAT_ORDER)[i]] += n > 0 ? 1 : -1;
    return acc;
  }
  const FIFTHS_OF_LETTER = [0, 2, 4, -1, 1, 3, 5]; // C D E F G A B のメジャーキー
  function keyFifths(tonicSp, mode) {
    return FIFTHS_OF_LETTER[tonicSp.l] + 7 * tonicSp.a - (mode === 'minor' ? 3 : 0);
  }
  // 12の主音それぞれの「ふつうの綴り」（ジャズの譜面でよく見る調）
  const MAJOR_KEY_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
  const MINOR_KEY_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];
  const keySpell = (pc, mode) => parseSpell((mode === 'minor' ? MINOR_KEY_NAMES : MAJOR_KEY_NAMES)[mod(pc, 12)]);
  // 調（主音の音階）のなかでの「#系か♭系か」。C は♭系にしておく（Eb・Ab・Bb が多いため）
  const keyPrefersFlat = (tonicSp, mode) => keyFifths(tonicSp, mode) <= 0;

  /* ---------------- コード記号 ---------------- */
  // ♭♯の表示（入力の b/# を ♭/♯ に。度数の前の b/# だけが対象）
  function prettyAcc(s) {
    return String(s == null ? '' : s).replace(/b(?=\d)/g, '♭').replace(/#(?=\d)/g, '♯').replace(/^b/, '♭').replace(/^#/, '♯');
  }
  const PARTS_RE = /^([A-G])([#b♭♯＃]?)(.*?)(?:\/([A-G][#b♭♯＃]?))?$/;

  // 'G7b9' → {root:G, cls:'dom', tones:[…]} 。読めないときは {error:'…'} ではなく null
  function parseChord(srcIn) {
    const src = String(srcIn == null ? '' : srcIn).trim();
    if (!src) return null;
    if (/^N\.?C\.?$/i.test(src)) {
      return { src, nc: true, cls: 'nc', root: null, rootPc: -1, bass: null, bassPc: -1, suffix: '', tones: [], pcs: [] };
    }
    const pm = PARTS_RE.exec(src.replace(/\s+/g, ''));
    if (!pm) return null;
    const rootSp = parseSpell(pm[1] + pm[2].replace('♭', 'b').replace(/[♯＃]/, '#'));
    if (!rootSp) return null;
    let suffixRaw = pm[3];
    const bassSp = pm[4] ? parseSpell(pm[4].replace('♭', 'b').replace(/[♯＃]/, '#')) : null;

    // 読みやすい形にそろえる（ø → m7b5 など）
    let q = suffixRaw.replace(/♭/g, 'b').replace(/[♯＃]/g, '#').replace(/[−–﹣－]/g, '-')
      .replace(/[øØ]7?/g, 'm7b5').replace(/6\/9/g, '69').replace(/[()[\]]/g, ',');
    const parts = q.split(',').filter(Boolean);
    if (!parts.length) parts.push('');

    const st = { third: 'M', fifth: 0, seventh: null, six: false, ext: { 9: [], 11: [], 13: [] }, omit3: false, omit5: false, alt: false };
    const addExt = (n, alt) => {
      const arr = st.ext[n];
      if (alt !== 0) { const i = arr.indexOf(0); if (i >= 0) arr.splice(i, 1); }
      if (alt === 0 && arr.some(a => a !== 0)) return;
      if (arr.indexOf(alt) < 0) arr.push(alt);
    };
    let bad = null;

    // ---- 基本形（頭の部分） ----
    let head = parts[0], m;
    const take = re => { const mm = re.exec(head); if (mm) head = head.slice(mm[0].length); return mm; };
    if (take(/^(maj|Maj|MAJ|ma|Ma|Δ|∆|△|▵|\^|M(?![a-z]))/)) {
      st.third = 'M'; st.seventh = '7';              // ジャズでは Cmaj / CΔ は maj7 の意味
      if (take(/^69/)) { st.seventh = null; st.six = true; addExt(9, 0); }
      else if (take(/^6/)) { st.seventh = null; st.six = true; }
      else if (take(/^7/)) { /* maj7 */ }
      else if (take(/^9/)) addExt(9, 0);
      else if (take(/^11/)) { addExt(9, 0); addExt(11, 0); }
      else if (take(/^13/)) { addExt(9, 0); addExt(13, 0); }
    } else if (take(/^(min|Min|MIN|mi|Mi|m|-)/)) {
      st.third = 'm';
      if (take(/^(maj|Maj|MAJ|M|Δ|△|\^)/)) {
        st.seventh = '7';
        if (take(/^9/)) addExt(9, 0); else take(/^7/);
      }
      else if (take(/^69/)) { st.six = true; addExt(9, 0); }
      else if (take(/^6/)) st.six = true;
      else if (take(/^7/)) st.seventh = 'b7';
      else if (take(/^9/)) { st.seventh = 'b7'; addExt(9, 0); }
      else if (take(/^11/)) { st.seventh = 'b7'; addExt(9, 0); addExt(11, 0); }
      else if (take(/^13/)) { st.seventh = 'b7'; addExt(9, 0); addExt(13, 0); }
    } else if (take(/^(dim|Dim|o|°|º)/)) {
      st.third = 'm'; st.fifth = -1;
      if (take(/^7/)) st.seventh = 'bb7';
    } else if (take(/^(aug|Aug|\+)/)) {
      st.fifth = 1;
      if (take(/^7/)) st.seventh = 'b7';
      else if (take(/^9/)) { st.seventh = 'b7'; addExt(9, 0); }
      else if (take(/^13/)) { st.seventh = 'b7'; addExt(9, 0); addExt(13, 0); }
    } else if ((m = take(/^sus(4|2)?/))) {
      st.third = m[1] === '2' ? 'sus2' : 'sus4';
      if (take(/^7/)) st.seventh = 'b7';
      else if (take(/^9/)) { st.seventh = 'b7'; addExt(9, 0); }
      else if (take(/^13/)) { st.seventh = 'b7'; addExt(9, 0); addExt(13, 0); }
    } else if (take(/^alt/)) {
      st.seventh = 'b7'; st.alt = true;
    } else if (take(/^(13|11|9|7|69|6|5|4|2)/)) {
      const d = parts[0].slice(0, parts[0].length - head.length);
      if (d === '7') st.seventh = 'b7';
      else if (d === '9') { st.seventh = 'b7'; addExt(9, 0); }
      else if (d === '11') { st.seventh = 'b7'; addExt(9, 0); addExt(11, 0); st.third = 'sus4'; }
      else if (d === '13') { st.seventh = 'b7'; addExt(9, 0); addExt(13, 0); }
      else if (d === '6') st.six = true;
      else if (d === '69') { st.six = true; addExt(9, 0); }
      else if (d === '5') { st.third = null; }
      else if (d === '4') st.third = 'sus4';
      else if (d === '2') st.third = 'sus2';
    }
    // ---- 追加の指定（b9, #11, add9, sus4, omit3 …） ----
    const rest = [head].concat(parts.slice(1));
    outer: for (let str of rest) {
      while (str.length) {
        let mm;
        if ((mm = /^(maj7|Maj7|M7|Δ7|△7|Δ|△)/.exec(str))) { st.seventh = '7'; str = str.slice(mm[0].length); continue; }
        if ((mm = /^sus(4|2)?/.exec(str))) { st.third = mm[1] === '2' ? 'sus2' : 'sus4'; str = str.slice(mm[0].length); continue; }
        if ((mm = /^add(\d+)/.exec(str))) {
          const n = +mm[1];
          if (n === 9 || n === 2) addExt(9, 0); else if (n === 11 || n === 4) addExt(11, 0); else if (n === 13 || n === 6) { if (st.seventh) addExt(13, 0); else st.six = true; }
          else { bad = str; break outer; }
          str = str.slice(mm[0].length); continue;
        }
        if ((mm = /^(omit|no)(\d+)/.exec(str))) {
          if (mm[2] === '3') st.omit3 = true; else if (mm[2] === '5') st.omit5 = true; else { bad = str; break outer; }
          str = str.slice(mm[0].length); continue;
        }
        if ((mm = /^alt/.exec(str))) { st.alt = true; if (!st.seventh) st.seventh = 'b7'; str = str.slice(3); continue; }
        if ((mm = /^\+(?!\d)/.exec(str))) { st.fifth = 1; str = str.slice(1); continue; }   // 7+ = 7(#5)
        if ((mm = /^([#b+\-]?)(13|11|9|7|6|5)/.exec(str))) {
          const sign = mm[1] === '#' || mm[1] === '+' ? 1 : mm[1] === 'b' || mm[1] === '-' ? -1 : 0;
          const n = +mm[2];
          if (n === 5) { if (sign) st.fifth = sign; }
          else if (n === 9) addExt(9, sign);
          else if (n === 11) addExt(11, sign > 0 ? 1 : 0);
          else if (n === 13) addExt(13, sign < 0 ? -1 : 0);
          else if (n === 6) { if (!st.seventh) st.six = true; else addExt(13, 0); }
          else if (n === 7) { if (!st.seventh) st.seventh = 'b7'; }
          str = str.slice(mm[0].length); continue;
        }
        if ((mm = /^[\/.]/.exec(str))) { str = str.slice(1); continue; }
        bad = str; break outer;
      }
    }
    if (bad) return null;

    if (st.omit3) st.third = null;
    // ---- 構成音 ----
    const tones = [{ n: 1, alt: 0 }];
    if (st.third === 'M') tones.push({ n: 3, alt: 0 });
    else if (st.third === 'm') tones.push({ n: 3, alt: -1 });
    else if (st.third === 'sus4') tones.push({ n: 4, alt: 0 });
    else if (st.third === 'sus2') tones.push({ n: 2, alt: 0 });
    if (st.alt) {
      // オルタード：5度は持たず、♭9 ♯9 ♯11(♭5) ♭13 を足す。指定があればそれを優先する
      if (!st.ext[9].length) { addExt(9, -1); addExt(9, 1); }
      if (!st.ext[11].length) addExt(11, 1);
      if (!st.ext[13].length) addExt(13, -1);
    } else if (!st.omit5) tones.push({ n: 5, alt: st.fifth });
    if (st.seventh) tones.push({ n: 7, alt: st.seventh === 'b7' ? -1 : st.seventh === '7' ? 0 : -2 });
    if (st.six) tones.push({ n: 6, alt: 0 });
    for (const n of [9, 11, 13]) for (const a of st.ext[n].slice().sort()) {
      if (n === 11 && a === 0 && st.third === 'sus4') continue;   // sus4 と 11th は同じ音
      tones.push({ n, alt: a });
    }

    let cls;
    if (st.third === 'M') cls = st.seventh === 'b7' ? 'dom' : (st.fifth === 1 && !st.seventh && !st.six ? 'aug' : 'maj');
    else if (st.third === 'm') {
      if (st.fifth === -1) cls = st.seventh === 'b7' ? 'hdim' : 'dim';
      else cls = st.seventh === '7' ? 'minmaj' : 'min';
    } else if (st.third === 'sus4' || st.third === 'sus2') cls = 'sus';
    else cls = 'pow';

    const out = {
      src, nc: false, root: rootSp, rootPc: spellPc(rootSp), bass: bassSp, bassPc: bassSp ? spellPc(bassSp) : -1,
      suffix: suffixRaw.replace(/♭/g, 'b').replace(/[♯＃]/g, '#'),
      cls, third: st.third, fifth: st.omit5 ? null : st.fifth, seventh: st.seventh, six: st.six,
      ext: st.ext, alt: st.alt, omit5: st.omit5,
      tones: [],
    };
    for (const t of tones) {
      const d = { n: t.n, alt: t.alt, steps: t.n - 1, semis: MAJOR[(t.n - 1) % 7] + 12 * Math.floor((t.n - 1) / 7) + t.alt };
      const sp = degreeSpell(rootSp, d) || spellFromPc(rootSp ? spellPc(rootSp) + d.semis : 0, false);
      out.tones.push({ n: t.n, alt: t.alt, semis: d.semis, pc: mod(out.rootPc + d.semis, 12), sp, name: (t.alt < 0 ? 'b'.repeat(-t.alt) : '#'.repeat(t.alt)) + t.n });
    }
    out.pcs = Array.from(new Set(out.tones.map(t => t.pc))).sort((a, b) => a - b);
    out.hasAlt = !!(st.alt || st.fifth !== 0 || [9, 11, 13].some(n => st.ext[n].some(a => a !== 0)));
    out.dim7 = cls === 'dim' && st.seventh === 'bb7';
    // 3度・7度（ガイドトーン）
    const third = out.tones.find(t => t.n === 3 || t.n === 4 || t.n === 2), seventh = out.tones.find(t => t.n === 7 || t.n === 6);
    out.guide3 = st.third === 'M' || st.third === 'm' ? mod(out.rootPc + (st.third === 'M' ? 4 : 3), 12) : (third ? third.pc : -1);
    out.guide7 = st.seventh ? mod(out.rootPc + (st.seventh === 'b7' ? 10 : st.seventh === '7' ? 11 : 9), 12) : (seventh ? seventh.pc : -1);
    return out;
  }

  // 表示用に（ルート・種類・ベース）に分けたもの。♭♯は記号に
  function chordParts(chord) {
    if (!chord || chord.nc) return { root: 'N.C.', suffix: '', bass: '' };
    return {
      root: spellStr(chord.root, true),
      suffix: prettyAcc(chord.suffix),
      bass: chord.bass ? spellStr(chord.bass, true) : '',
    };
  }
  function chordText(chord, uni) {
    if (!chord || chord.nc) return 'N.C.';
    const suf = uni ? prettyAcc(chord.suffix) : chord.suffix;
    return spellStr(chord.root, uni) + suf + (chord.bass ? '/' + spellStr(chord.bass, uni) : '');
  }

  // 種類の日本語名
  const CLASS_JP = {
    maj: 'メジャー系（maj7・6 など）', min: 'マイナー系（m7・m6 など）', dom: 'ドミナント7th系',
    hdim: 'ハーフディミニッシュ（m7♭5）', dim: 'ディミニッシュ', sus: 'サス（sus4）系', aug: 'オーギュメント', minmaj: 'マイナー・メジャー7th', pow: 'パワーコード', nc: 'ノーコード',
  };

  /* ---------------- 移調 ---------------- */
  // 根音の綴りを「半音 semis だけ上げた」ものにする。調号に合わせて♯か♭かを選ぶ
  function transposeRoot(sp, semis, ctx) {
    const pc = mod(spellPc(sp) + semis, 12);
    return spellInKey(pc, ctx || {});
  }
  // pc を、調（ctx.tonicPc, ctx.fifths）に合わせた綴りで。♯系の調なら♯、♭系の調なら♭。
  // C メジャー／A マイナー（変化記号なし）のときだけ、コードの種類で C♯/D♭ のような迷いを決める
  function spellInKey(pc, ctx) {
    pc = mod(pc, 12);
    const f = ctx.fifths == null ? 0 : ctx.fifths;
    if (f > 0) return spellFromPc(pc, false);
    if (f < 0) return spellFromPc(pc, true);
    const tonic = ctx.tonicPc == null ? 0 : ctx.tonicPc;
    const d = mod(pc - tonic, 12), cls = ctx.cls || 'maj';
    const minorish = cls === 'min' || cls === 'hdim' || cls === 'minmaj';
    if (cls === 'dim') return spellFromPc(pc, false);          // 経過のディミニッシュは #I° #II° #IV° …
    if (d === 1 || d === 6) return spellFromPc(pc, !minorish); // m7 系は C♯m・F♯m7♭5、ドミナントやmaj7は D♭・G♭
    return spellFromPc(pc, true);
  }
  // コード文字列を semis だけ移調（接尾辞はそのまま）。ctx は spellInKey と同じ
  function transposeChordStr(src, semis, ctx) {
    const s = String(src);
    const pm = PARTS_RE.exec(s.replace(/\s+/g, ''));
    if (!pm) return s;
    const chord = parseChord(s);
    if (!chord || chord.nc) return s;
    const c2 = Object.assign({}, ctx || {}, { cls: chord.cls });
    const nr = spellInKey(chord.rootPc + semis, c2);
    let out = spellStr(nr, false) + chord.suffix;
    if (chord.bass) out += '/' + spellStr(spellInKey(chord.bassPc + semis, Object.assign({}, c2, { cls: 'maj' })), false);
    return out;
  }

  /* ---------------- スケール辞典 ---------------- */
  // f：度数の並び（綴りは度数から決まる）。jp：日本語名。use：どんなときに使うか
  const SCALES = {
    ionian: { jp: 'アイオニアン（メジャー）', en: 'Ionian', f: '1 2 3 4 5 6 7', use: 'トニックの maj7・6。アヴォイドは4度' },
    dorian: { jp: 'ドリアン', en: 'Dorian', f: '1 2 b3 4 5 6 b7', use: 'm7 の定番。ii、モーダルな m7' },
    phrygian: { jp: 'フリジアン', en: 'Phrygian', f: '1 b2 b3 4 5 b6 b7', use: 'iii の m7（スペイン風）' },
    lydian: { jp: 'リディアン', en: 'Lydian', f: '1 2 3 #4 5 6 7', use: 'IV の maj7、浮遊感のある maj7（#11）' },
    mixolydian: { jp: 'ミクソリディアン', en: 'Mixolydian', f: '1 2 3 4 5 6 b7', use: 'ドミナント7th の基本。ブルースの I7 も' },
    aeolian: { jp: 'エオリアン（ナチュラルマイナー）', en: 'Aeolian', f: '1 2 b3 4 5 b6 b7', use: 'vi の m7、マイナーのトニック' },
    locrian: { jp: 'ロクリアン', en: 'Locrian', f: '1 b2 b3 4 b5 b6 b7', use: 'm7♭5 の基本形' },
    locrian2: { jp: 'ロクリアン♯2', en: 'Locrian #2', f: '1 2 b3 4 b5 b6 b7', use: 'm7♭5（ii ø）に使いやすい（9thが自然）' },
    melodicMinor: { jp: 'メロディックマイナー（ジャズ・マイナー）', en: 'Melodic Minor', f: '1 2 b3 4 5 6 7', use: 'm6、m(maj7) のトニックマイナー' },
    dorianb2: { jp: 'ドリアン♭2', en: 'Dorian b2', f: '1 b2 b3 4 5 6 b7', use: 'sus4(♭9) 系' },
    lydianAug: { jp: 'リディアン・オーグメンテッド', en: 'Lydian Augmented', f: '1 2 3 #4 #5 6 7', use: 'maj7(#5)' },
    lydianDom: { jp: 'リディアン♭7（リディアン・ドミナント）', en: 'Lydian b7', f: '1 2 3 #4 5 6 b7', use: '裏コード（♭II7）、7(#11)。ドミナントなのに解決しない所' },
    mixob6: { jp: 'ミクソリディアン♭6', en: 'Mixolydian b6', f: '1 2 3 4 5 b6 b7', use: 'マイナーに解決するV7（♭13）' },
    altered: { jp: 'オルタード（スーパーロクリアン）', en: 'Altered', f: '1 b2 #2 3 b5 b6 b7', use: 'V7 → 解決（特にマイナーへ）。♭9 ♯9 ♭5 ♭13 の緊張' },
    harmonicMinor: { jp: 'ハーモニックマイナー', en: 'Harmonic Minor', f: '1 2 b3 4 5 b6 7', use: 'マイナーのトニック（m(maj7)）' },
    phrygianDom: { jp: 'フリジアン・ドミナント', en: 'Phrygian Dominant', f: '1 b2 3 4 5 b6 b7', use: 'マイナーに解決する V7（♭9 ♭13）' },
    dimWH: { jp: 'ディミニッシュ（全・半）', en: 'Whole-Half Diminished', f: '1 2 b3 4 b5 b6 6 7', use: 'dim7 コード' },
    dimHW: { jp: 'コンビネーション・オブ・ディミニッシュ（半・全）', en: 'Half-Whole Diminished', f: '1 b2 #2 3 #4 5 6 b7', use: 'V7(♭9) ほか。コンディミ' },
    wholeTone: { jp: 'ホールトーン', en: 'Whole Tone', f: '1 2 3 #4 #5 b7', use: '7(♯5)、7(♭5)、オーギュメント' },
    bebopDom: { jp: 'ビバップ・ドミナント', en: 'Bebop Dominant', f: '1 2 3 4 5 6 b7 7', use: 'ドミナント7th。下降すると1・3・5・♭7 が拍の頭に来る' },
    bebopMaj: { jp: 'ビバップ・メジャー', en: 'Bebop Major', f: '1 2 3 4 5 b6 6 7', use: 'maj7・6。下降すると和音の音が拍の頭に来る' },
    bebopDorian: { jp: 'ビバップ・ドリアン', en: 'Bebop Dorian', f: '1 2 b3 3 4 5 6 b7', use: 'm7。♭3 と 3 を行き来する' },
    majPent: { jp: 'メジャー・ペンタトニック', en: 'Major Pentatonic', f: '1 2 3 5 6', use: 'maj7・6・ドミナントのシンプルなライン' },
    minPent: { jp: 'マイナー・ペンタトニック', en: 'Minor Pentatonic', f: '1 b3 4 5 b7', use: 'm7、ブルース。モダンな4度のライン' },
    blues: { jp: 'ブルース・スケール', en: 'Blues', f: '1 b3 4 b5 5 b7', use: 'ブルース。ドミナントにも m にも' },
    majBlues: { jp: 'メジャー・ブルース', en: 'Major Blues', f: '1 2 b3 3 5 6', use: 'ブルースの I7、明るいブルース' },
  };
  function scaleNotes(rootSp, id) {
    const sc = SCALES[id];
    if (!sc) return [];
    return sc.f.split(' ').map(d => degreeSpell(rootSp, d) || spellFromPc(spellPc(rootSp) + parseDegree(d).semis, false));
  }
  const scalePcs = (rootPc, id) => SCALES[id].f.split(' ').map(d => mod(rootPc + parseDegree(d).semis, 12));

  // コードだけから決まる、いちばん素直なスケール候補（文脈による選びなおしは analysis.js）
  function defaultScales(chord) {
    if (!chord || chord.nc) return [];
    const e = chord.ext;
    const has = (n, a) => e[n] && e[n].indexOf(a) >= 0;
    switch (chord.cls) {
      case 'maj':
        if (chord.third === 'M' && has(11, 1)) return ['lydian', 'ionian'];
        if (chord.seventh === '7' && chord.fifth === 1) return ['lydianAug'];
        return ['ionian', 'lydian', 'bebopMaj'];
      case 'min':
        if (chord.six) return ['dorian', 'melodicMinor'];
        return ['dorian', 'aeolian', 'bebopDorian', 'minPent'];
      case 'minmaj': return ['melodicMinor', 'harmonicMinor'];
      case 'dom':
        if (chord.alt || has(9, -1) || has(9, 1) || chord.fifth !== 0 || has(13, -1)) {
          if (has(9, -1) && has(9, 1)) return ['altered', 'dimHW'];
          if (has(9, -1) && has(13, -1)) return ['phrygianDom', 'altered', 'dimHW'];
          if (has(9, -1)) return ['dimHW', 'altered', 'phrygianDom'];
          if (chord.fifth === 1 && !has(9, 1)) return ['wholeTone', 'altered'];
          return ['altered', 'dimHW', 'wholeTone'];
        }
        if (has(11, 1)) return ['lydianDom', 'mixolydian'];
        return ['mixolydian', 'bebopDom', 'blues'];
      case 'hdim': return ['locrian2', 'locrian'];
      case 'dim': return ['dimWH'];
      case 'sus': return ['mixolydian', 'minPent', 'dorian'];
      case 'aug': return ['wholeTone', 'lydianAug'];
      default: return ['ionian'];
    }
  }

  /* ---------------- ローマ数字 ---------------- */
  const ROMAN = ['I', '♭II', 'II', '♭III', 'III', 'IV', '♯IV', 'V', '♭VI', 'VI', '♭VII', 'VII'];
  const SHARP_ROMAN = [null, '♯I', null, '♯II', null, null, '♯IV', null, '♯V', null, '♯VI', null];
  // 日本のジャズ理論の書き方：大文字のローマ数字＋コードの種類（IIm7, V7, Imaj7, ♭VII7 …）
  function romanLabel(chord, tonicPc) {
    if (!chord || chord.nc) return 'N.C.';
    const d = mod(chord.rootPc - tonicPc, 12);
    let r = ROMAN[d];
    if (d === 6 && (chord.cls === 'dom' || chord.cls === 'maj' || chord.cls === 'sus')) r = '♭V';
    // ディミニッシュは、解決先の半音下から入る＝♯で数える（♯Io7, ♯IIo7 …）。m7(♭5)・m7 も 1 と 6 は♯（♯IVm7♭5）
    if (chord.cls === 'dim' && SHARP_ROMAN[d]) r = SHARP_ROMAN[d];
    else if ((chord.cls === 'hdim' || chord.cls === 'min') && (d === 1 || d === 6)) r = chord.root && chord.root.a < 0 ? (d === 1 ? '♭II' : '♭V') : SHARP_ROMAN[d];   // 根音がフラットで書かれていれば ♭IIm7、そうでなければ ♯Im7・♯IVm7♭5
    let out = r + prettyAcc(chord.suffix);
    if (chord.bass && chord.bassPc !== chord.rootPc) out += '/' + ROMAN[mod(chord.bassPc - tonicPc, 12)];
    return out;
  }
  const romanDeg = (rootPc, tonicPc) => ROMAN[mod(rootPc - tonicPc, 12)];

  /* ---------------- 周波数 ---------------- */
  const midiToFreq = m => 440 * Math.pow(2, (m - 69) / 12);

  Object.assign(T, {
    LETTERS, LETTER_PC, MAJOR, SHARP_NAMES, FLAT_NAMES, mod,
    parseSpell, spellPc, spellStr, spellFromPc, sameSpell,
    pitchMidi, pitchFromMidi, parsePitch, pitchStr, shiftPitch,
    parseDegree, degreeSpell, intervalFromRoot, semisToDegreeName,
    keySigAccs, keyFifths, keySpell, keyPrefersFlat, MAJOR_KEY_NAMES, MINOR_KEY_NAMES,
    prettyAcc, parseChord, chordParts, chordText, CLASS_JP,
    transposeRoot, spellInKey, transposeChordStr,
    SCALES, scaleNotes, scalePcs, defaultScales,
    ROMAN, romanLabel, romanDeg, midiToFreq,
  });
  if (typeof module !== 'undefined' && module.exports) module.exports = AL;
})();
