/* アドリブ・ラボ：ハーモニー解析（画面を持たない）。
   コードの並び（和声の区間）を読んで、
     ・キーを推定する
     ・ii–V–I などの「かたまり（パターン）」を見つける
     ・コードごとに「役割」を、複数つける（キー内での働き／パターンの一員／セカンダリー・ドミナント／裏コード／借用和音 …）
     ・役割に合うスケールを提案する
     ・ソロを置く「フレーズの区切り」を決める
   のが仕事。リック辞典（licks.js）は、ここで決めた pattern の id（'ii-V-I' など）で引く。 */
(function () {
  'use strict';
  const root = typeof window !== 'undefined' ? window : globalThis;
  const AL = (root.AL = root.AL || {});
  const T = AL.T;
  const A = (AL.A = AL.A || {});
  const mod = T.mod;

  /* ---------------- コードの種類の述語 ---------------- */
  const P = {
    maj: c => c.cls === 'maj',
    min: c => c.cls === 'min',
    min7: c => c.cls === 'min' && c.seventh === 'b7',
    minI: c => c.cls === 'min' || c.cls === 'minmaj',
    hdim: c => c.cls === 'hdim',
    dom: c => c.cls === 'dom',
    domLike: c => c.cls === 'dom' || (c.cls === 'sus' && c.seventh === 'b7'),
    dim: c => c.cls === 'dim',
    majOrDom: c => c.cls === 'maj' || c.cls === 'dom',
    minOrDom: c => c.cls === 'min' || c.cls === 'dom',
  };

  /* ---------------- パターン辞書 ----------------
     preds：各コードの条件　moves：次のコードへのルートの動き（半音、12で割った余り。5＝4度上＝5度下）
     names：その位置の呼び名　tones：t=トニック sd=サブドミナント d=ドミナント x=その他
     keyAt/keyOff：この区間の「主音」＝ keyAt番目のルート + keyOff
     score：フレーズを区切るときの優先度（長いほど強い） */
  const PATTERNS = [
    { id: 'I-vi-ii-V', jp: 'ターンアラウンド I–vi–ii–V（イチロクニゴー）', short: 'Imaj7–VIm7–IIm7–V7', preds: [P.maj, P.min7, P.min7, P.domLike], moves: [9, 5, 5], names: ['I', 'vi', 'ii', 'V'], tones: ['t', 't', 'sd', 'd'], keyAt: 0, keyOff: 0, mode: 'major', score: 9 },
    { id: 'I-VI-ii-V', jp: 'ターンアラウンド I–VI7–ii–V', short: 'Imaj7–VI7–IIm7–V7', preds: [P.maj, P.dom, P.min7, P.domLike], moves: [9, 5, 5], names: ['I', 'VI7', 'ii', 'V'], tones: ['t', 'd', 'sd', 'd'], keyAt: 0, keyOff: 0, mode: 'major', score: 9 },
    { id: 'iii-vi-ii-V', jp: 'ターンアラウンド iii–vi–ii–V（サンロクニゴー）', short: 'IIIm7–VI7–IIm7–V7', preds: [P.min7, P.minOrDom, P.min7, P.domLike], moves: [5, 5, 5], names: ['iii', 'vi', 'ii', 'V'], tones: ['t', 'd', 'sd', 'd'], keyAt: 3, keyOff: 5, mode: 'major', score: 9 },
    { id: 'I-#Io-ii-V', jp: 'ターンアラウンド I–♯Io7–IIm7–V7（半音で上がるディミニッシュ）', short: 'Imaj7–♯Io7–IIm7–V7', preds: [P.maj, P.dim, P.min7, P.domLike], moves: [1, 1, 5], names: ['I', '♯Io7', 'ii', 'V'], tones: ['t', 'x', 'sd', 'd'], keyAt: 0, keyOff: 0, mode: 'major', score: 9 },
    { id: 'I-bIII-bVI-bII', jp: 'ターンアラウンド I–♭III–♭VI–♭II（大三度循環系）', short: 'Imaj7–♭IIImaj7–♭VImaj7–♭IImaj7', preds: [P.majOrDom, P.majOrDom, P.majOrDom, P.majOrDom], moves: [3, 5, 5], names: ['I', '♭III', '♭VI', '♭II'], tones: ['t', 'x', 'x', 'x'], keyAt: 0, keyOff: 0, mode: 'major', score: 8 },
    { id: 'ii-V-I', jp: 'ii–V–I（ツーファイブワン・メジャー）', short: 'IIm7–V7–Imaj7', preds: [P.min7, P.domLike, P.maj], moves: [5, 5], names: ['ii', 'V', 'I'], tones: ['sd', 'd', 't'], keyAt: 2, keyOff: 0, mode: 'major', score: 10 },
    { id: 'ii-V-I7', jp: 'ii–V–I7（ブルースの終止）', short: 'IIm7–V7–I7', preds: [P.min7, P.domLike, P.dom], moves: [5, 5], names: ['ii', 'V', 'I7'], tones: ['sd', 'd', 't'], keyAt: 2, keyOff: 0, mode: 'major', score: 9, ctxAlias: 'ii-V-I', anyTonic: true },
    { id: 'ii-V-i', jp: 'ii–V–i（ツーファイブワン・マイナー）', short: 'IIm7♭5–V7(♭9)–Im7', preds: [P.hdim, P.domLike, P.minI], moves: [5, 5], names: ['iiø', 'V', 'i'], tones: ['sd', 'd', 't'], keyAt: 2, keyOff: 0, mode: 'minor', score: 10 },
    { id: 'ii-bII-I', jp: 'ii–♭II7–I（裏コードのツーファイブ）', short: 'IIm7–♭II7–Imaj7', preds: [P.min7, P.dom, P.maj], moves: [11, 11], names: ['ii', '♭II7', 'I'], tones: ['sd', 'd', 't'], keyAt: 2, keyOff: 0, mode: 'major', score: 10 },
    { id: 'iv-bVII-I', jp: 'バックドア ii–V（IVm7–♭VII7–I）', short: 'IVm7–♭VII7–Imaj7', preds: [P.min7, P.dom, P.maj], moves: [5, 2], names: ['iv', '♭VII7', 'I'], tones: ['sd', 'd', 't'], keyAt: 2, keyOff: 0, mode: 'major', score: 10 },
    { id: 'min-cliche', jp: 'マイナー・クリシェ（Im–Im(maj7)–Im7–Im6）', short: 'Im–Im(maj7)–Im7–Im6', preds: [P.minI, P.minI, P.minI, P.minI], moves: [0, 0, 0], names: ['i', 'i(maj7)', 'i7', 'i6'], tones: ['t', 't', 't', 't'], keyAt: 0, keyOff: 0, mode: 'minor', score: 8, test: cs => cs[1].cls === 'minmaj' },
    { id: 'ii-V', jp: 'ii–V（ツーファイブ）', short: 'IIm7–V7', preds: [P.min7, P.domLike], moves: [5], names: ['ii', 'V'], tones: ['sd', 'd'], keyAt: 1, keyOff: 5, mode: 'major', score: 6 },
    { id: 'iio-V', jp: 'iiø–V（マイナーのツーファイブ）', short: 'IIm7♭5–V7(♭9)', preds: [P.hdim, P.domLike], moves: [5], names: ['iiø', 'V'], tones: ['sd', 'd'], keyAt: 1, keyOff: 5, mode: 'minor', score: 6 },
    { id: 'V-I', jp: 'V7→I（ドミナント・モーションでメジャーへ）', short: 'V7–Imaj7', preds: [P.domLike, P.maj], moves: [5], names: ['V', 'I'], tones: ['d', 't'], keyAt: 1, keyOff: 0, mode: 'major', score: 5 },
    { id: 'V-i', jp: 'V7→i（マイナーへ解決）', short: 'V7(♭9)–Im7', preds: [P.domLike, P.minI], moves: [5], names: ['V', 'i'], tones: ['d', 't'], keyAt: 1, keyOff: 0, mode: 'minor', score: 5 },
    { id: 'bII-I', jp: '裏コードの解決（♭II7→I）', short: '♭II7–Imaj7', preds: [P.dom, P.maj], moves: [11], names: ['♭II7', 'I'], tones: ['d', 't'], keyAt: 1, keyOff: 0, mode: 'major', score: 5 },
    { id: 'bII-i', jp: '裏コードの解決（♭II7→i）', short: '♭II7–Im7', preds: [P.dom, P.minI], moves: [11], names: ['♭II7', 'i'], tones: ['d', 't'], keyAt: 1, keyOff: 0, mode: 'minor', score: 5 },
    { id: 'bVII-I', jp: 'バックドア・ドミナント（♭VII7→I）', short: '♭VII7–Imaj7', preds: [P.dom, P.maj], moves: [2], names: ['♭VII7', 'I'], tones: ['d', 't'], keyAt: 1, keyOff: 0, mode: 'major', score: 5 },
    { id: 'V-I7', jp: 'ドミナントの連鎖（V7→I7。ブルースの I7→IV7 など）', short: 'C7–F7', preds: [P.dom, P.dom], moves: [5], names: ['V7', 'I7'], tones: ['d', 'd'], keyAt: 1, keyOff: 0, mode: 'major', score: 4 },
    { id: 'IV7-I7', jp: 'IV7→I7（ブルースの下属→主）', short: 'F7–C7', preds: [P.dom, P.dom], moves: [7], names: ['IV7', 'I7'], tones: ['sd', 't'], keyAt: 1, keyOff: 0, mode: 'major', score: 4 },
  ];
  const PAT_BY_ID = {};
  PATTERNS.forEach(p => { PAT_BY_ID[p.id] = p; p.n = p.preds.length; });

  /* ---------------- キーの推定 ---------------- */
  // 度数（主音からの半音）ごとの [主な種類, 副次的な種類]。主な種類は2点、副次は1.2点（ブルースの I7・IV7、短調の ♭VII7 など）
  const MAJ_DEG = { 0: [['maj'], ['dom']], 2: [['min'], []], 4: [['min'], []], 5: [['maj'], ['dom']], 7: [['dom', 'sus'], ['maj']], 9: [['min'], []], 11: [['hdim'], ['dim']] };
  const MIN_DEG = { 0: [['min', 'minmaj'], []], 2: [['hdim'], ['dim', 'min']], 3: [['maj'], []], 5: [['min'], ['dom']], 7: [['dom', 'sus'], ['min']], 8: [['maj'], []], 10: [['maj'], ['dom']], 11: [['dim'], []] };
  function fit(c, d, mode) {
    const ent = (mode === 'major' ? MAJ_DEG : MIN_DEG)[d];
    if (ent) {
      if (ent[0].indexOf(c.cls) >= 0) return 2;
      if (ent[1].indexOf(c.cls) >= 0) return 1.2;
      return 0.6;
    }
    return -0.3;
  }
  const isTonicOf = (c, d, mode) => d === 0 && (mode === 'major' ? c.cls === 'maj' || c.cls === 'dom' : c.cls === 'min' || c.cls === 'minmaj');
  function estimateKey(hs, bpb) {
    const cs = hs.filter(h => !h.chord.nc);
    if (!cs.length) return { tonicPc: 0, mode: 'major', score: 0, list: [] };
    const total = cs.reduce((a, h) => a + h.dur, 0);
    const distinct = new Set(cs.map(h => h.chord.rootPc + ':' + h.chord.cls));
    if (distinct.size === 1) {
      const c = cs[0].chord;
      const mode = c.cls === 'min' || c.cls === 'minmaj' || c.cls === 'hdim' ? 'minor' : 'major';
      return { tonicPc: c.rootPc, mode, score: 1, list: [] };
    }
    const L = cs.length;
    const chordAt = k => cs[((k % L) + L) % L].chord;
    // 直後に4度上のドミナントが来る m7 は、トニックではなく「ii」として働いている
    const iiLike = k => {
      const c = chordAt(k), n = chordAt(k + 1), mv = mod(n.rootPc - c.rootPc, 12);
      return (P.min(c) || P.hdim(c)) && ((P.domLike(n) && mv === 5) || (P.dom(n) && mv === 11));   // 裏コード(♭II7)へ進む ii も
    };
    const lastIdx = L - 1;
    // 解決先（I）が書かれていない ii–V や iii–vi–ii–V は、「この調の中の動き」という手がかり。次のコードがその主音なら、終止の得点（下）で数えるのでここでは足さない
    const implied = {}, IMPLY = ['ii-V', 'iio-V', 'iii-vi-ii-V', 'I-vi-ii-V', 'I-VI-ii-V', 'I-#Io-ii-V'];
    findMatches(cs).forEach(m => {
      const p = m.pattern;
      if (IMPLY.indexOf(p.id) < 0 || cs[(m.at + m.n) % L].chord.rootPc === m.tonicPc) return;
      implied[m.tonicPc + ':' + m.mode] = (implied[m.tonicPc + ':' + m.mode] || 0) + p.score * 0.45;
    });
    const results = [];
    for (let t = 0; t < 12; t++) for (const mode of ['major', 'minor']) {
      let s = implied[t + ':' + mode] || 0, tonicTime = 0;
      // 12小節ブルースの型（I7・IV7・V7 が主役の曲）は、その調のものと見なす
      if (bpb) { const f = detectForm(hs, { tonicPc: t }, bpb); if (f && f.minor === (mode === 'minor')) s += 7; }
      cs.forEach((h, k) => {
        const c = h.chord, d = mod(c.rootPc - t, 12), w = Math.min(h.dur, 8) / 4;
        s += w * fit(c, d, mode);
        if (isTonicOf(c, d, mode) && !iiLike(k)) tonicTime += h.dur;
      });
      s += 6 * (tonicTime / total);
      // 終止（V7→I）と ii–V–I。ループ演奏では最後→最初のつなぎ目も本物の終止なので、少し軽く数える
      for (let k = 0; k < L; k++) {
        const wrap = k + 1 >= L, a = chordAt(k), b = chordAt(k + 1);
        if (L < 2 || (wrap && L < 3)) continue;
        const mv = mod(b.rootPc - a.rootPc, 12), toTonic = b.rootPc === t && isTonicOf(b, 0, mode) && !iiLike((k + 1) % L);
        if (toTonic && P.domLike(a) && mv === 5) s += wrap ? 2 : 3;
        else if (toTonic && P.dom(a) && mv === 11) s += wrap ? 1.5 : 2.5;   // 裏コード（♭II7→I）
        else if (toTonic && P.dom(a) && mv === 2 && mod(a.rootPc - t, 12) === 10) s += wrap ? 1.2 : 2;   // バックドア（♭VII7→I）
      }
      for (let k = 0; k < L; k++) {
        const w = k + 2 >= L, a = chordAt(k), b = chordAt(k + 1), c = chordAt(k + 2);
        if (L < 3 || (w && L < 4)) continue;
        if ((P.min7(a) || P.hdim(a)) && P.domLike(b) && mod(b.rootPc - a.rootPc, 12) === 5 && mod(c.rootPc - b.rootPc, 12) === 5 && c.rootPc === t && isTonicOf(c, 0, mode)) s += w ? 1.2 : 2;
        else if (P.min7(a) && P.dom(b) && mod(b.rootPc - a.rootPc, 12) === 11 && mod(c.rootPc - b.rootPc, 12) === 11 && c.rootPc === t && isTonicOf(c, 0, mode)) s += w ? 1 : 2;
      }
      const lastC = chordAt(lastIdx), firstC = chordAt(0);
      if (isTonicOf(lastC, mod(lastC.rootPc - t, 12), mode) && !iiLike(lastIdx)) s += 2;
      else if (P.domLike(lastC) && mod(firstC.rootPc - lastC.rootPc, 12) === 5 && firstC.rootPc === t && isTonicOf(firstC, 0, mode)) s += 1.5;   // 最後が V7 でぐるっと頭へ
      if (isTonicOf(firstC, mod(firstC.rootPc - t, 12), mode) && !iiLike(0)) s += 1.5;
      if (mode === 'minor') s -= 0.05;   // 同点なら長調を選ぶ
      results.push({ tonicPc: t, mode, score: s });
    }
    const lastRoot = chordAt(lastIdx).rootPc;
    results.sort((a, b) => b.score - a.score || (b.tonicPc === lastRoot) - (a.tonicPc === lastRoot));
    return { tonicPc: results[0].tonicPc, mode: results[0].mode, score: results[0].score, list: results.slice(0, 4) };
  }
  function keyInfo(tonicPc, mode, hs) {
    // 綴りは、コードの根音の綴りに合わせる（G7 があって主音が C なら C）
    let sp = null;
    for (const h of hs) if (!h.chord.nc && h.chord.rootPc === tonicPc) { sp = h.chord.root; break; }
    if (!sp) sp = T.keySpell(tonicPc, mode);
    const fifths = T.keyFifths(sp, mode);
    if (Math.abs(fifths) > 7) { sp = T.keySpell(tonicPc, mode); }
    return { tonicPc, mode, spell: sp, fifths: T.keyFifths(sp, mode), name: T.spellStr(sp, true) + (mode === 'minor' ? ' マイナー' : ' メジャー'), short: T.spellStr(sp, true) + (mode === 'minor' ? 'm' : '') };
  }

  /* ---------------- パターンを見つける ---------------- */
  function findMatches(hs) {
    const out = [];
    for (let i = 0; i < hs.length; i++) {
      for (const p of PATTERNS) {
        if (i + p.n > hs.length) continue;
        const cs = hs.slice(i, i + p.n).map(h => h.chord);
        if (cs.some(c => c.nc || c.bad)) continue;
        let ok = true;
        for (let k = 0; k < p.n && ok; k++) if (!p.preds[k](cs[k])) ok = false;
        for (let k = 0; k + 1 < p.n && ok; k++) if (mod(cs[k + 1].rootPc - cs[k].rootPc, 12) !== p.moves[k]) ok = false;
        if (ok && p.test && !p.test(cs)) ok = false;
        if (!ok) continue;
        const tonicPc = mod(cs[p.keyAt].rootPc + p.keyOff, 12);
        out.push({ id: p.id, pattern: p, at: i, n: p.n, tonicPc, mode: p.mode, tonicSpell: tonicSpellFor(cs[p.keyAt], p.keyOff, tonicPc) });
      }
    }
    return out;
  }
  function tonicSpellFor(chord, off, pc) {
    if (off === 0) return chord.root;
    return T.spellFromPc(pc, T.keyPrefersFlat(chord.root, 'major'));
  }

  /* ---------------- 役割の文言 ---------------- */
  const rn = (pc, tonic) => T.romanDeg(pc, tonic);
  const ctext = h => T.chordText(h.chord, true);
  const FN_JP = { T: 'トニック（T）', SD: 'サブドミナント（SD）', D: 'ドミナント（D）', X: '経過・借用' };
  const TONE_OF = { T: 't', SD: 'sd', D: 'd', X: 'x' };

  // キー内での働き（ダイアトニック）
  function diatonicRole(c, key) {
    const d = mod(c.rootPc - key.tonicPc, 12), mode = key.mode;
    const lab = T.romanLabel(c, key.tonicPc);
    const mk = (fn, title, text, scales) => ({ kind: 'func', fn, tone: TONE_OF[fn], label: lab, title, text, scales, diatonic: true });
    if (mode === 'major') {
      if (d === 0 && c.cls === 'maj') return mk('T', 'トニック（T）', 'キーの中心の和音。落ち着く着地点なので、フレーズの終わりに向いている。', ['ionian', 'bebopMaj', 'majPent', 'lydian']);
      if (d === 2 && c.cls === 'min') return mk('SD', 'サブドミナント（SD）：ii', 'ドリアンで弾ける m7。次の V7 へ進んで「ii–V」になることが多い。', ['dorian', 'bebopDorian', 'minPent']);
      if (d === 4 && c.cls === 'min') return mk('T', 'トニック代理（T）：iii', 'トニックの仲間の m7。フリジアン（またはドリアン）で弾ける。VI7 へ進む形（iii–VI7–ii–V）が定番。', ['phrygian', 'dorian', 'minPent']);
      if (d === 5 && c.cls === 'maj') return mk('SD', 'サブドミナント（SD）：IV', 'リディアン（#11）の浮遊感がよく合う maj7。', ['lydian', 'ionian', 'majPent']);
      if (d === 7 && (c.cls === 'dom' || c.cls === 'sus' || c.cls === 'maj')) return mk('D', 'ドミナント（D）：V', 'トニックへ解決したくなる緊張の和音。ミクソリディアンが基本で、オルタードなどで緊張を足せる。', T.defaultScales(c).concat(['altered']).filter((v, i, a) => a.indexOf(v) === i));
      if (d === 9 && c.cls === 'min') return mk('T', 'トニック代理（T）：vi', 'トニックの仲間の m7。エオリアン（ナチュラルマイナー）で弾ける。ii–V の前の VI7 に置き換わることも。', ['aeolian', 'dorian', 'minPent']);
      if (d === 11 && (c.cls === 'hdim' || c.cls === 'dim')) return mk('D', 'ドミナント代理（D）：vii', 'V7(9) のルートを抜いた形と同じ響き。ロクリアンで弾ける。', ['locrian2', 'locrian']);
      if (c.cls === 'dom' && (d === 0 || d === 5)) return mk(d === 0 ? 'T' : 'SD', d === 0 ? 'ブルースのトニック（I7）' : 'ブルースの下属（IV7）', 'ブルースでは I と IV もドミナント7th にする。ミクソリディアンとブルース・スケールが合う。', ['mixolydian', 'blues', 'bebopDom', 'majBlues']);
    } else {
      if (d === 0 && (c.cls === 'min' || c.cls === 'minmaj')) return mk('T', 'トニック（T）：マイナーの i', 'マイナー・キーの中心。m7 や m6 ならドリアン、m(maj7) ならメロディックマイナー。', c.cls === 'minmaj' ? ['melodicMinor', 'harmonicMinor'] : ['dorian', 'aeolian', 'melodicMinor', 'minPent']);
      if (d === 2 && (c.cls === 'hdim' || c.cls === 'dim')) return mk('SD', 'サブドミナント（SD）：iiø', 'マイナーの ii。ロクリアン♯2 で弾く。次の V7(♭9) へ進む。', ['locrian2', 'locrian']);
      if (d === 3 && c.cls === 'maj') return mk('T', 'トニック代理（T）：♭III', '平行調（メジャー）のトニック。リディアン/アイオニアン。', ['ionian', 'lydian', 'majPent']);
      if (d === 5 && (c.cls === 'min' || c.cls === 'dom')) return mk('SD', 'サブドミナント（SD）：iv', 'マイナーの IV。ドリアンで弾ける（IV7 ならミクソリディアン）。', c.cls === 'dom' ? ['mixolydian', 'bebopDom'] : ['dorian', 'aeolian']);
      if (d === 7 && (c.cls === 'dom' || c.cls === 'sus')) return mk('D', 'ドミナント（D）：V', 'マイナーのトニックへ解決する V7。♭9・♭13 のオルタード系（フリジアン・ドミナント／オルタード）が合う。', ['phrygianDom', 'altered', 'dimHW']);
      if (d === 7 && c.cls === 'min') return mk('D', 'ドミナント（D）：v', 'ナチュラルマイナーの v。エオリアン/ドリアン。', ['aeolian', 'dorian']);
      if (d === 8 && c.cls === 'maj') return mk('SD', 'サブドミナント（SD）：♭VI', 'マイナーの ♭VI。リディアン（#11）がきれい。', ['lydian', 'ionian']);
      if (d === 10 && (c.cls === 'dom' || c.cls === 'maj')) return mk('D', 'サブトニック：♭VII', '♭VII7 は、ミクソリディアンで弾ける。♭III（平行調）へ向かうことも多い。', ['mixolydian', 'bebopDom']);
      if (d === 11 && c.cls === 'dim') return mk('D', 'ドミナント代理（D）：vii°7', 'V7(♭9) のルートを抜いた形と同じ。ディミニッシュ（全・半）で弾く。', ['dimWH']);
    }
    return null;
  }

  // 借用和音（メジャー・キーに、同主短調から借りた和音）
  function borrowRole(c, key) {
    if (key.mode !== 'major') return null;
    const d = mod(c.rootPc - key.tonicPc, 12), lab = T.romanLabel(c, key.tonicPc);
    const mk = (title, text, scales) => ({ kind: 'borrow', fn: 'X', tone: 'x', label: lab, title, text, scales });
    if (d === 5 && c.cls === 'min') return mk('借用和音：IVm（サブドミナント・マイナー）', '同主短調から借りた IVm7。IVmaj7 の代わりに入れて切ない色をつける。ドリアンで弾ける。', ['dorian', 'aeolian']);
    if (d === 3 && (c.cls === 'maj' || c.cls === 'dom')) return mk('借用和音：♭III', '同主短調から借りた ♭IIImaj7。ふわっとした明るさ。リディアン/アイオニアン。', ['lydian', 'ionian']);
    if (d === 8 && (c.cls === 'maj' || c.cls === 'dom')) return mk('借用和音：♭VI', '同主短調から借りた ♭VImaj7。リディアン（#11）がよく合う。', ['lydian', 'ionian']);
    if (d === 10 && c.cls === 'maj') return mk('借用和音：♭VII', '同主短調から借りた ♭VIImaj7。ミクソリディアン風の明るさ。', ['lydian', 'ionian']);
    if (d === 2 && c.cls === 'hdim') return mk('借用和音：IIm7♭5', '同主短調の iiø。V7(♭9) へ進んでマイナーの ii–V 風になる。ロクリアン♯2。', ['locrian2']);
    if (d === 7 && c.cls === 'min') return mk('借用和音：Vm7', 'ナチュラルマイナー由来の v。ドリアン/エオリアンで弾ける。', ['dorian', 'aeolian']);
    if (d === 1 && c.cls === 'maj') return mk('ナポリの和音（♭II）', '♭IImaj7。リディアンで弾く、ドラマティックな色。', ['lydian']);
    return null;
  }

  /* ---------------- 本体 ---------------- */
  // パターン内の位置の呼び名 → 合うスケール
  function scalesForName(nm, mode) {
    switch (nm) {
      case 'ii': case 'iv': return ['dorian', 'bebopDorian', 'minPent'];
      case 'iii': return ['phrygian', 'dorian', 'minPent'];
      case 'vi': return ['aeolian', 'dorian', 'minPent'];
      case 'iiø': return ['locrian2', 'locrian'];
      case 'I': return ['ionian', 'bebopMaj', 'majPent', 'lydian'];
      case 'i': case 'i(maj7)': case 'i7': case 'i6': return ['dorian', 'aeolian', 'melodicMinor', 'minPent'];
      case 'V': return mode === 'minor' ? ['phrygianDom', 'altered', 'dimHW'] : ['mixolydian', 'bebopDom', 'altered', 'dimHW'];
      case '♭II7': return ['lydianDom', 'mixolydian'];
      case '♭VII7': return ['mixolydian', 'lydianDom', 'bebopDom'];
      case 'VI7': return ['mixolydian', 'altered', 'dimHW'];
      case 'V7': case 'I7': case 'IV7': return ['mixolydian', 'bebopDom', 'blues'];
      case '♯Io7': return ['dimWH'];
      case '♭III': case '♭VI': case '♭II': return ['ionian', 'lydian'];
      default: return [];
    }
  }

  function analyze(hs, opts) {
    opts = opts || {};
    const bpb = opts.beatsPerBar || 4;
    const est = estimateKey(hs, bpb);
    const key = opts.key ? keyInfo(opts.key.tonicPc, opts.key.mode, hs) : keyInfo(est.tonicPc, est.mode, hs);
    key.auto = !opts.key;
    key.candidates = est.list.map(r => keyInfo(r.tonicPc, r.mode, hs));

    const matches = findMatches(hs);
    const phrases = segment(hs, matches, opts);
    const primaryAt = {};
    phrases.forEach(ph => { if (ph.match) for (let k = 0; k < ph.n; k++) primaryAt[ph.from + k] = ph.match; });
    const form = detectForm(hs, key, bpb);
    const n = hs.length;
    const chords = hs.map((h, i) => ({ i, h, chord: h.chord, roles: [], chips: [], scales: [], roman: h.chord.nc ? 'N.C.' : T.romanLabel(h.chord, key.tonicPc), fn: 'X', diatonic: false }));
    const next = i => { const j = i + 1 < n ? i + 1 : (opts.cyclic === false ? -1 : 0); return j < 0 ? null : hs[j]; };

    for (let i = 0; i < n; i++) {
      const h = hs[i], c = h.chord, roles = chords[i].roles;
      if (c.nc) { roles.push({ kind: 'info', tone: 'x', label: 'N.C.', title: 'ノーコード', text: '和音のない小節。休符として扱う。', scales: [] }); chords[i].chips = [{ label: 'N.C.', tone: 'x' }]; continue; }
      if (c.bad) continue;

      // 1) パターンの一員。実際に使う区切り（primary）を先頭に。ほかのパターンは補足
      const covering = matches.filter(m => i >= m.at && i < m.at + m.n).sort((a, b) => b.n - a.n || b.pattern.score - a.pattern.score);
      const prim = primaryAt[i];
      const patRoles = covering.map(m => {
        const p = m.pattern, k = i - m.at;
        const keyName = T.spellStr(m.tonicSpell, true) + (m.mode === 'minor' ? 'm' : '');
        return {
          kind: 'pattern', primary: m === prim, tone: p.tones[k], label: p.names[k], pat: m.id, patAt: m.at, patIndex: k, patName: p.jp,
          title: `${p.jp.replace(/（.*$/, '')}の ${p.names[k]}`,
          text: patternText(p, k, m, hs, keyName), scales: scalesForName(p.names[k], m.mode),
        };
      });
      patRoles.filter(r => r.primary).forEach(r => roles.push(r));

      // 2) キー内での働き
      const dr = diatonicRole(c, key);
      if (dr) { roles.push(dr); chords[i].fn = dr.fn; chords[i].diatonic = true; }
      // 3) 借用和音
      const br = borrowRole(c, key);
      if (br && !dr) { roles.push(br); }

      // 4) ドミナントの働き（セカンダリー・ドミナント／裏コード／バックドア／連鎖）
      const nx = next(i);
      if (P.domLike(c) && nx && !nx.chord.nc && !nx.chord.bad) {
        const nc = nx.chord, mv = mod(nc.rootPc - c.rootPc, 12), dT = mod(nc.rootPc - key.tonicPc, 12);
        const wrap = nx === hs[0] && i === n - 1;
        const tgt = ctext(nx) + (wrap ? '（次のコーラスの頭）' : '');
        const minorTgt = nc.cls === 'min' || nc.cls === 'minmaj';
        if (mv === 5) {
          if (dT !== 0) {
            const relMajor = key.mode === 'minor' && dT === 3;
            roles.push({ kind: 'sec', fn: 'X', tone: 'd', label: relMajor ? 'V7/♭III' : 'V7/' + rn(nc.rootPc, key.tonicPc), title: relMajor ? `平行調（${ctext(nx)}）へのドミナント` : `セカンダリー・ドミナント（V7/${rn(nc.rootPc, key.tonicPc)}）`, text: relMajor ? `${tgt} に向かう V7。マイナー・キーの平行調（メジャー）のトニックへ解決する。` : `${tgt} に向かうドミナント7th。${ctext(nx)} を一時的なトニックと見立てて弾く。`, scales: minorTgt ? ['phrygianDom', 'altered', 'dimHW'] : ['mixolydian', 'altered', 'dimHW'] });
          } else if (P.dom(nc)) {
            roles.push({ kind: 'sec', fn: 'X', tone: 'd', label: 'V7→I7', title: 'ドミナントの連鎖', text: `${tgt} に向かうドミナント7th どうしのつながり（ブルースの I7→IV7 など）。`, scales: ['mixolydian', 'bebopDom', 'blues'] });
          } else {
            roles.push({ kind: 'sec', fn: 'D', tone: 'd', label: 'V→' + (minorTgt ? 'i' : 'I'), title: `ドミナント・モーション（${tgt} へ解決）`, text: `5度下（4度上）の ${tgt} へ解決する。解決先が${minorTgt ? 'マイナーなので、♭9・♭13 のオルタード系が合う' : 'メジャーなので、ミクソリディアンでもオルタードでもよい'}。`, scales: minorTgt ? ['phrygianDom', 'altered', 'dimHW'] : ['mixolydian', 'altered', 'dimHW'] });
          }
        } else if (mv === 11 && P.dom(c)) {
          const sub = T.chordText(T.parseChord(T.spellStr(T.spellFromPc(nc.rootPc + 7, T.keyPrefersFlat(nc.root, 'major'))) + '7'), true);
          roles.push({ kind: 'sub', fn: 'X', tone: 'd', label: dT === 0 ? '♭II7（裏）' : 'subV7/' + rn(nc.rootPc, key.tonicPc), title: `裏コード（トライトーン・サブスティテューション）${dT === 0 ? '：♭II7' : ''}`, text: `${tgt} に半音下から解決する。${sub} の代わりに使える裏コード（ルートが三全音ちがう）。リディアン♭7 で弾くと色が出る。`, scales: ['lydianDom', 'mixolydian', 'altered'] });
        } else if (mv === 2 && P.dom(c) && dT === 0) {
          roles.push({ kind: 'sub', fn: 'X', tone: 'd', label: '♭VII7（バックドア）', title: 'バックドア・ドミナント（♭VII7→I）', text: `${tgt} に全音下から入る「裏口」の解決。IVm7–♭VII7–I の形でよく出る。ミクソリディアン（またはリディアン♭7）で弾く。`, scales: ['mixolydian', 'lydianDom', 'bebopDom'] });
        } else if (mv === 2 && mod(c.rootPc - key.tonicPc, 12) === 7 && key.mode === 'major') {
          roles.push({ kind: 'sec', fn: 'D', tone: 'd', label: '偽終止', title: '偽終止（V7→VIm）', text: 'V7 が I ではなく VIm7 へ進む「だまし」の終止。', scales: ['mixolydian', 'altered'] });
        }
      }
      // 5) ディミニッシュ
      if (c.cls === 'dim' && nx && !nx.chord.nc) {
        const mv = mod(nx.chord.rootPc - c.rootPc, 12);
        if (mv === 1) roles.push({ kind: 'dim', fn: 'X', tone: 'x', label: '経過の°7', title: '経過のディミニッシュ（半音上へ解決）', text: `${ctext(nx)} の半音下から入る dim7。V7(♭9) のルートを抜いた形と同じ働きで、${ctext(nx)} への「通り道」。`, scales: ['dimWH', 'dimHW'] });
        else if (mv === 11) roles.push({ kind: 'dim', fn: 'X', tone: 'x', label: '下行の°7', title: '下行のディミニッシュ', text: `半音下の ${ctext(nx)} へ降りていく途中の dim7。`, scales: ['dimWH'] });
        else roles.push({ kind: 'dim', fn: 'X', tone: 'x', label: 'dim7', title: 'ディミニッシュ7th', text: 'dim7 は4つの音が短3度で並ぶ対称な和音。どの音から数えても同じ形になる。全・半のディミニッシュ・スケールで弾く。', scales: ['dimWH'] });
      }
      // 6) モーダル（長く続く1つのコード）
      const endOfTonic = matches.some(m => i === m.at + m.n - 1 && m.pattern.tones[m.n - 1] === 't');
      if (h.dur >= 2 * bpb - 1e-6 && !endOfTonic && !prim && (c.cls === 'min' || c.cls === 'dom' || c.cls === 'maj' || c.cls === 'sus')) {
        const sc = T.defaultScales(c);
        roles.push({ kind: 'modal', fn: 'X', tone: 'x', label: 'モーダル', title: '長く続く1コード（モーダルな扱い）', text: `${ctext(h)} が長く続くので、コードの動きにこだわらず「${T.SCALES[sc[0]].jp}」の1つの音階でじっくり弾ける。`, scales: sc });
      }
      // 7) ブルース形式
      if (form) {
        const bar = Math.floor(h.t0 / bpb + 1e-6), d = mod(c.rootPc - key.tonicPc, 12);
        const nm = d === 0 ? 'I' : d === 5 ? 'IV' : d === 7 ? 'V' : null;
        if (nm && (c.cls === 'dom' || c.cls === 'min' || c.cls === 'sus')) roles.push({ kind: 'blues', fn: 'X', tone: d === 0 ? 't' : d === 5 ? 'sd' : 'd', label: 'ブルース ' + nm, title: `${form.minor ? 'マイナー・' : ''}ブルースの ${nm}（${bar + 1} 小節目）`, text: `12小節ブルースの${nm}。ブルース・スケールとミクソリディアンを行き来して弾ける。`, scales: form.minor ? ['minPent', 'blues', 'dorian'] : ['blues', 'mixolydian', 'majBlues', 'bebopDom'] });
      }
      // 8) どの役割もなければ
      if (!roles.length) {
        roles.push({ kind: 'other', fn: 'X', tone: 'x', label: T.romanLabel(c, key.tonicPc), title: 'キーの外のコード', text: 'このキーのダイアトニック・コードではない。前後のつながりを見て、コードトーンを手がかりに弾く。', scales: T.defaultScales(c) });
      }
      // 補足：ほかのパターンの一員としても見られる
      patRoles.filter(r => !r.primary).forEach(r => { r.chip = false; roles.push(r); });

      // スケールの候補（役割の順に重複なし）。コードに指定のテンションがあれば、その指定が優先
      const seen = [];
      for (const r of roles) for (const sc of (r.scales || [])) if (seen.indexOf(sc) < 0) seen.push(sc);
      if (!seen.length) T.defaultScales(c).forEach(sc => seen.push(sc));
      if (c.hasAlt && c.cls === 'dom') T.defaultScales(c).slice().reverse().forEach(sc => { const k = seen.indexOf(sc); if (k >= 0) seen.splice(k, 1); seen.unshift(sc); });
      chords[i].scales = seen.slice(0, 5);
      chords[i].pools = poolsFor(h, chords[i], key, matches, form, nx);

      // 画面に出す札（最大3つ）：①キーの中のローマ数字　②区切りのパターン　③特別な働き
      const chips = [];
      const fnRole = roles.find(r => r.kind === 'func') || roles.find(r => r.kind === 'borrow') || roles.find(r => r.kind === 'other');
      if (fnRole) chips.push({ label: chords[i].roman, tone: fnRole.tone || 'x', kind: 'roman', fn: fnRole.fn });
      const pr = roles.find(r => r.kind === 'pattern' && r.primary);
      if (pr) chips.push({ label: pr.label, sub: pr.patName.replace(/（.*$/, ''), tone: pr.tone, kind: 'pattern' });
      const sp = roles.find(r => ['sec', 'sub', 'dim', 'borrow', 'modal', 'blues'].indexOf(r.kind) >= 0 && r !== fnRole);
      if (sp) chips.push({ label: sp.label, tone: sp.tone || 'x', kind: sp.kind });
      chords[i].chips = chips;
    }
    return { key, matches, chords, phrases, form, bpb };
  }

  function patternText(p, k, m, hs, keyName) {
    const nm = p.names[k], who = T.chordText(hs[m.at + k].chord, true);
    const key = `${keyName}`;
    switch (p.id) {
      case 'ii-V-I': return k === 0 ? `${who} は ${key} の ii。V7 へ進む「準備」の和音で、ドリアンで弾く。` : k === 1 ? `${who} は ${key} の V。次の I へ解決するための緊張の和音。` : `${who} は ${key} の I。ii–V–I のゴール（着地点）。`;
      case 'ii-V-I7': return k === 0 ? `${who} は ii。V7 を経て I7（ブルースの主和音）へ向かう。` : k === 1 ? `${who} は V。I7 へ解決するドミナント。` : `${who} は I7。ブルースの着地点（ドミナント7th のまま落ち着く）。`;
      case 'ii-V-i': return k === 0 ? `${who} は ${key} マイナーの iiø。ロクリアン♯2 で弾く。` : k === 1 ? `${who} は ${key} マイナーの V。♭9・♭13 のオルタード系で強く解決へ向かう。` : `${who} は ${key} マイナーの i。ゴール。`;
      case 'ii-V': return k === 0 ? `${who} は ii。つづく V7 とセットの「ツーファイブ」。` : `${who} は V。解決先（${key}）へ向かう。`;
      case 'iio-V': return k === 0 ? `${who} は iiø。マイナーのツーファイブの前半。` : `${who} は V。${key} へ向かうオルタード系のドミナント。`;
      case 'V-I': case 'V-i': return k === 0 ? `${who} は ${key} へ解決する V7。` : `${who} は V7 の解決先（${key}）。`;
      case 'I-vi-ii-V': case 'I-VI-ii-V': case 'iii-vi-ii-V': case 'I-#Io-ii-V': return `${who} は ${key} のターンアラウンドの ${nm}。I に戻るための 4 コードのつながり。`;
      case 'ii-bII-I': return `${who} は ${nm}。ii–V の V を裏コードにした形。ルートが半音ずつ下がってなめらかに I へ。`;
      case 'iv-bVII-I': return `${who} は ${nm}。ii–V の代わりにサブドミナント・マイナーから入る「バックドア」。`;
      case 'bII-I': case 'bII-i': return `${who} は ${nm}。半音下から解決する裏コード。`;
      case 'bVII-I': return `${who} は ${nm}。全音下から I に入る裏口の解決。`;
      case 'V-I7': return `${who} は ${nm}。ドミナント7th どうしが 5度下行でつながる。`;
      case 'IV7-I7': return `${who} は ${nm}。ブルースで IV7 から I7 に戻る動き。`;
      case 'min-cliche': return `${who}：同じルートで内声が半音ずつ下がるクリシェ。`;
      default: return `${who} は ${nm}。`;
    }
  }

  /* ---------------- ブルース形式 ---------------- */
  function detectForm(hs, key, bpb) {
    const total = hs.reduce((a, h) => a + h.dur, 0);
    if (Math.abs(total / bpb - 12) > 1e-6) return null;
    const at = b => { const t = b * bpb + 1e-6; for (const h of hs) if (h.t0 <= t && t < h.t0 + h.dur) return h.chord; return null; };
    const rel = b => { const c = at(b); return !c || c.nc ? -1 : mod(c.rootPc - key.tonicPc, 12); };
    let s = 0;
    if (rel(0) === 0) s++;
    if (rel(1) === 5 || rel(1) === 0) s++;
    if (rel(4) === 5) s++;
    if (rel(6) === 0) s++;
    if (rel(8) === 7 || rel(8) === 2) s++;
    if (rel(10) === 0) s++;
    if (s < 5) return null;
    const c0 = at(0), c4 = at(4);
    const dom = c => c && (c.cls === 'dom' || c.cls === 'sus');
    const minor = c0 && c0.cls === 'min' && c4 && (c4.cls === 'min' || c4.cls === 'dom');
    if (!(dom(c0) || minor)) return null;
    return { type: minor ? 'minor-blues' : 'blues', minor: !!minor, name: minor ? 'マイナー・ブルース（12小節）' : 'ブルース（12小節）' };
  }

  /* ---------------- ソロの「プール」（単独のコードに使うリックの種類） ---------------- */
  function poolsFor(h, info, key, matches, form, nx) {
    const c = h.chord, out = [];
    const push = (ctx, w) => out.push({ ctx, w });
    const toMinor = nx && !nx.chord.nc && (nx.chord.cls === 'min' || nx.chord.cls === 'minmaj') && mod(nx.chord.rootPc - c.rootPc, 12) === 5;
    const lyd = info.roles.some(r => r.kind === 'sub') || info.roles.some(r => r.fn === 'SD' && r.diatonic && c.cls === 'maj');
    const has = (n, a) => c.ext[n] && c.ext[n].indexOf(a) >= 0;
    switch (c.cls) {
      case 'maj':
        push('maj7', 3);
        if (lyd || has(11, 1)) push('maj7#11', 2);
        break;
      case 'min': if (c.six) { push('min6', 3); push('min7', 1); } else push('min7', 3); break;
      case 'minmaj': push('minmaj7', 3); push('min6', 1); break;
      case 'hdim': push('m7b5', 3); break;
      case 'dim': push('dim7', 3); break;
      case 'aug': push('dom7alt', 3); break;
      case 'sus': push('dom7sus', 3); push('dom7', 1); break;
      case 'dom': {
        const hardAlt = c.alt || has(9, -1) || has(9, 1) || has(13, -1) || c.fifth !== 0;
        const sharp11 = has(11, 1) && !hardAlt;
        if (hardAlt) { push('dom7alt', 4); }
        else if (sharp11) { push('dom7#11', 4); push('dom7', 1); }
        else if (info.roles.some(r => r.kind === 'sub')) { push('dom7#11', 3); push('dom7', 2); }
        else if (toMinor) { push('dom7alt', 3); push('dom7', 2); }
        else if (form && !form.minor) { push('blues7', 3); push('dom7', 2); }
        else { push('dom7', 4); push('dom7alt', 1); }
        break;
      }
      default: push('maj7', 1);
    }
    return out;
  }

  /* ---------------- フレーズに区切る ---------------- */
  // 最も得点の高い「パターンの敷きつめ」を選ぶ（長いパターンほど優先。重ならない）
  // 戻り値：[{from, n, pat（パターンのid or null）, match}]
  function segment(hs, matches, opts) {
    opts = opts || {};
    const n = hs.length;
    const best = new Array(n + 1).fill(-Infinity); best[n] = 0;
    const take = new Array(n + 1).fill(null);
    const byStart = {};
    matches.forEach(m => { (byStart[m.at] = byStart[m.at] || []).push(m); });
    const skip = opts.skip || {};
    for (let i = n - 1; i >= 0; i--) {
      best[i] = 1 + best[i + 1]; take[i] = null;
      for (const m of (byStart[i] || [])) {
        if (skip[m.id]) continue;
        if (opts.canUse && !opts.canUse(m)) continue;
        const sc = m.pattern.score * (opts.preferShort ? 0.5 : 1) + best[i + m.n];
        if (sc > best[i]) { best[i] = sc; take[i] = m; }
      }
    }
    const out = [];
    for (let i = 0; i < n;) {
      const m = take[i];
      if (m) { out.push({ from: i, n: m.n, pat: m.id, match: m }); i += m.n; }
      else { out.push({ from: i, n: 1, pat: null, match: null }); i++; }
    }
    return out;
  }

  Object.assign(A, { PATTERNS, PAT_BY_ID, P, analyze, estimateKey, findMatches, detectForm, segment, poolsFor, FN_JP });
  if (typeof module !== 'undefined' && module.exports) module.exports = AL;
})();
