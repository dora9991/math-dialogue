/* アドリブ・ラボ：リック辞典のしくみ（記法の読みとり・検査・移調・検索）。リックの中身（データ）は licks-*.js。
   ■ リックの書き方
   リックは「C の調で、楽譜を読むように音名で」書く。読みこむとき、コードのルートとの関係（度数）に自動で直すので、
   どの調にも移調できる（綴りは崩れない：G7 の ♭9 は A♭、♯9 は A♯ などが正しく出る）。
     C5 B4 Bb4 A4 G4 F4 E4 D4      … 音名＋オクターブ（C4 = 真ん中のド）。何も書かなければ8分音符
     C5:q  E4:h  G4:q.  D5:e.      … 長さ：w 全 h 2分 q 4分 e 8分 s 16分 t 3連の8分 T 3連の4分、 . は付点
     r  r:q                        … 休符
     @s  @e                        … これ以降の標準の長さを変える（16分の連続などに）
     |                             … 小節線（拍の数が合っているかの確認用。置いた位置が小節の頭でないと検査で落ちる）
     <                             … これより前は「前の小節から入るアウフタクト（食い）」
     /                             … ここでフレーズを切ってもよい（コードが短いときは、ここまでを使う）
     C5>  C5^  C5~                 … アクセント、スタッカート、次の同じ音にタイ
   ■ 登録：L.pack({ ctx, ref, segs, tags, lvl }, [ [名前, 音, 解説, 追加指定], … ])
     ctx：どんなコードに使えるか（'dom7' 単体、'ii-V-I' のように複数コードなど）
     ref：音を書いたときのコード（'C7' や ['Dm7','G7','Cmaj7']）。segs：各コードの拍数。 */
(function () {
  'use strict';
  const root = typeof window !== 'undefined' ? window : globalThis;
  const AL = (root.AL = root.AL || {});
  const T = AL.T;
  const L = (AL.L = AL.L || {});
  const mod = T.mod;
  const LPC = [0, 2, 4, 5, 7, 9, 11];   // C D E F G A B の高さ（半音）
  L.all = []; L.byId = {}; L.byCtx = {}; L.errors = [];
  const TPB = 12;   // 1拍 = 12 ティック（2・3・4 分割がすべて割りきれる）

  /* ---------------- 種類（ctx）の一覧：画面の分類にも使う ---------------- */
  L.CTX = {
    // ---- コード単体 ----
    'dom7': { group: 'single', jp: 'ドミナント7th（ミクソリディアン）', ref: 'C7', note: 'G7・C7・F7 などの7thコード全般。ブルース、解決しない7thにも' },
    'dom7alt': { group: 'single', jp: 'オルタード・ドミナント（♭9 ♯9 ♭13）', ref: 'C7alt', note: 'マイナーへ解決するV7、7(♭9)・7(♯9)・7alt などの緊張したドミナント' },
    'dom7#11': { group: 'single', jp: 'リディアン♭7（7♯11・裏コード）', ref: 'C7#11', note: '♭II7（裏コード）、7(♯11)、解決しない浮遊したドミナント' },
    'dom7sus': { group: 'single', jp: '7sus4', ref: 'C7sus4', note: '7sus4・sus4・11 のコード。ペンタトニックや4度の積み重ねが合う' },
    'blues7': { group: 'single', jp: 'ブルースのドミナント', ref: 'C7', note: '12小節ブルースの I7・IV7・V7。ブルース・スケールの語り口' },
    'maj7': { group: 'single', jp: 'メジャー7th（トニック）', ref: 'Cmaj7', note: 'Imaj7・IVmaj7・6・69 など長調のコード' },
    'maj7#11': { group: 'single', jp: 'リディアン（maj7♯11）', ref: 'Cmaj7#11', note: 'IVmaj7・♭VImaj7・♭IIImaj7 などの浮遊感のある maj7' },
    'min7': { group: 'single', jp: 'マイナー7th（ドリアン）', ref: 'Cm7', note: 'IIm7・IIIm7・VIm7・Im7 など、m7 全般' },
    'min6': { group: 'single', jp: 'マイナー6th（ドリアン／メロディックマイナー）', ref: 'Cm6', note: 'm6 のトニック・マイナー' },
    'minmaj7': { group: 'single', jp: 'マイナー・メジャー7th', ref: 'Cm(maj7)', note: 'm(maj7) とマイナー・クリシェ' },
    'm7b5': { group: 'single', jp: 'ハーフディミニッシュ（m7♭5）', ref: 'Cm7b5', note: 'IIm7♭5・VIIm7♭5。ロクリアン♯2' },
    'dim7': { group: 'single', jp: 'ディミニッシュ7th', ref: 'Cdim7', note: '経過のディミニッシュ。全・半のスケール、短3度で動く' },
    // ---- 2コード ----
    'V-I': { group: 'two', jp: 'V7 → Imaj7（メジャーへ解決）', ref: ['G7', 'Cmaj7'], note: '5度下行の解決。V7 から I の 3rd や 5th へ' },
    'V-i': { group: 'two', jp: 'V7 → Im7（マイナーへ解決）', ref: ['G7alt', 'Cm7'], note: 'オルタードやフリジアン・ドミナントでマイナーへ' },
    'ii-V': { group: 'two', jp: 'IIm7 → V7（ツーファイブ）', ref: ['Dm7', 'G7'], note: '2-5。解決先がなくても使える ii–V（次の I は別のフレーズで）' },
    'iio-V': { group: 'two', jp: 'IIm7♭5 → V7（マイナーのツーファイブ）', ref: ['Dm7b5', 'G7alt'], note: 'マイナーの ii–V（解決先がなくても）' },
    'bII-I': { group: 'two', jp: '♭II7 → Imaj7（裏コードの解決）', ref: ['Db7', 'Cmaj7'], note: '半音下からの解決。リディアン♭7' },
    'bII-i': { group: 'two', jp: '♭II7 → Im7（裏コードからマイナーへ）', ref: ['Db7', 'Cm7'], note: '半音下からマイナーへ' },
    'bVII-I': { group: 'two', jp: '♭VII7 → Imaj7（バックドア）', ref: ['Bb7', 'Cmaj7'], note: '全音下から入る裏口の解決' },
    'V-I7': { group: 'two', jp: 'V7 → I7（ドミナントの連鎖・ブルースの I7→IV7）', ref: ['C7', 'F7'], note: 'ドミナント7th が5度下行でつながる。ブルースの I7→IV7' },
    'IV7-I7': { group: 'two', jp: 'IV7 → I7（ブルースの下属→主）', ref: ['F7', 'C7'], note: 'ブルースの IV7→I7' },
    // ---- 3コード ----
    'ii-V-I': { group: 'three', jp: 'ii–V–I（ツーファイブワン・メジャー）', ref: ['Dm7', 'G7', 'Cmaj7'], note: '2-5-1。ジャズの基本。ii の準備 → V の緊張 → I の着地' },
    'ii-V-i': { group: 'three', jp: 'ii–V–i（ツーファイブワン・マイナー）', ref: ['Dm7b5', 'G7alt', 'Cm7'], note: 'マイナーの 2-5-1。♭9・♭13 のオルタード系' },
    'ii-bII-I': { group: 'three', jp: 'ii–♭II7–I（裏コードのツーファイブ）', ref: ['Dm7', 'Db7', 'Cmaj7'], note: 'V7 を裏コードにした ii–V–I。ルートが半音ずつ下がる' },
    'iv-bVII-I': { group: 'three', jp: 'バックドア ii–V（IVm7–♭VII7–I）', ref: ['Fm7', 'Bb7', 'Cmaj7'], note: 'サブドミナント・マイナーから入る裏口の ii–V' },
    // ---- 4コード（ターンアラウンド） ----
    'I-vi-ii-V': { group: 'four', jp: 'ターンアラウンド I–vi–ii–V', ref: ['Cmaj7', 'Am7', 'Dm7', 'G7'], note: 'イチロクニゴー。1小節を2コードずつなどで次々に' },
    'I-VI-ii-V': { group: 'four', jp: 'ターンアラウンド I–VI7–ii–V', ref: ['Cmaj7', 'A7', 'Dm7', 'G7'], note: 'リズムチェンジのAセクション前半など' },
    'iii-vi-ii-V': { group: 'four', jp: 'ターンアラウンド iii–VI7–ii–V', ref: ['Em7', 'A7', 'Dm7', 'G7'], note: '5度下行でつながる定番の4コード' },
    'I-#Io-ii-V': { group: 'four', jp: 'ターンアラウンド I–♯Io7–ii–V', ref: ['Cmaj7', 'C#dim7', 'Dm7', 'G7'], note: '経過のディミニッシュで半音上がる' },
  };
  L.GROUPS = [
    { id: 'three', jp: '3つのコードのかたまり（ii–V–I 系）' },
    { id: 'two', jp: '2つのコードのかたまり（V→I・ii–V など）' },
    { id: 'four', jp: 'ターンアラウンド（4つのコード）' },
    { id: 'single', jp: 'コード1つに使えるリック' },
  ];

  /* ---------------- 音の読みとり ---------------- */
  const BASE = { w: 48, h: 24, q: 12, e: 6, s: 3, t: 4, T: 8 };
  function ticksOf(code) {
    const dotted = code.endsWith('.'), b = BASE[code[0]];
    if (b == null) return null;
    if (!dotted) return b;
    return b % 2 === 0 ? b * 3 / 2 : null;
  }
  const NOTE_RE = /^([A-G](?:##|bb|#|b)?-?\d)(?::([whqestT]\.?))?([>^~]*)$/;

  function parseNotes(text) {
    const toks = String(text == null ? '' : text).trim().split(/\s+/).filter(Boolean);
    const out = { events: [], bars: [], cuts: [], errors: [], pickup: 0 };
    let def = BASE.e, tick = 0, pick = null;
    for (const tk of toks) {
      let m;
      if (tk === '|') { out.bars.push(tick); continue; }
      if (tk === '/') { out.cuts.push(tick); continue; }
      if (tk === '<') { pick = tick; continue; }
      if ((m = /^@([whqestT]\.?)$/.exec(tk))) { const d = ticksOf(m[1]); if (d == null) out.errors.push('長さが読めない：' + tk); else def = d; continue; }
      if ((m = /^r(?::([whqestT]\.?))?$/.exec(tk))) {
        const d = m[1] ? ticksOf(m[1]) : def;
        if (d == null) { out.errors.push('長さが読めない：' + tk); continue; }
        out.events.push({ t12: tick, d12: d, rest: true }); tick += d; continue;
      }
      if ((m = NOTE_RE.exec(tk))) {
        const d = m[2] ? ticksOf(m[2]) : def;
        const p = T.parsePitch(m[1]);
        if (d == null || !p) { out.errors.push('読めない：' + tk); continue; }
        out.events.push({ t12: tick, d12: d, rest: false, p, midi: T.pitchMidi(p), tie: m[3].includes('~'), accent: m[3].includes('>'), stac: m[3].includes('^') });
        tick += d; continue;
      }
      out.errors.push('読めない：' + tk);
    }
    out.total12 = tick;
    if (pick != null) {
      for (const e of out.events) e.t12 -= pick;
      out.bars = out.bars.map(b => b - pick); out.cuts = out.cuts.map(c => c - pick);
      out.pickup = pick; out.total12 = tick - pick;
    }
    return out;
  }

  /* ---------------- 検査用：その場面で使ってよい音 ---------------- */
  function allowedPcs(refChord, lick) {
    const sets = [];
    const add = ids => ids.forEach(id => sets.push(T.scalePcs(refChord.rootPc, id)));
    const alt = lick.tags.indexOf('alt') >= 0;
    switch (refChord.cls) {
      case 'maj': add(['ionian', 'lydian', 'bebopMaj', 'majPent']); if (lick.tags.indexOf('blues') >= 0) add(['majBlues']); break;
      case 'min':
        if (refChord.six) add(['dorian', 'melodicMinor', 'bebopDorian']); else add(['dorian', 'aeolian', 'bebopDorian', 'minPent']);
        if (lick.tags.indexOf('blues') >= 0) add(['blues']);
        break;
      case 'minmaj': add(['melodicMinor', 'harmonicMinor']); break;
      case 'dom':
        if (refChord.hasAlt || alt || lick.ctx === 'dom7alt') add(['altered', 'dimHW', 'wholeTone', 'phrygianDom', 'mixob6']);
        else add(['mixolydian', 'bebopDom']);
        if (lick.tags.indexOf('blues') >= 0) add(['blues', 'majBlues']);
        if (lick.tags.indexOf('lydian') >= 0 || lick.ctx === 'dom7#11' || lick.ctx === 'bII-I' || lick.ctx === 'bII-i' || lick.ctx === 'ii-bII-I') add(['lydianDom']);
        if (lick.ctx === 'dom7alt' || /^(ii-V-i|iio-V|V-i|bII-i)$/.test(lick.ctx) || alt) add(['mixolydian']);
        if (lick.ctx !== 'dom7alt' && (/^(ii-V|V-I|bII-I|ii-bII-I|iv-bVII-I|bVII-I|I-vi-ii-V|I-VI-ii-V|iii-vi-ii-V|I-#Io-ii-V|ii-V-I)$/.test(lick.ctx))) add(['altered', 'dimHW']);
        break;
      case 'hdim': add(['locrian2', 'locrian']); break;
      case 'dim': add(['dimWH', 'dimHW']); break;
      case 'sus': add(['mixolydian', 'dorian', 'minPent']); break;
      case 'aug': add(['wholeTone', 'lydianAug']); break;
      default: add(['ionian']);
    }
    const set = new Set();
    sets.forEach(a => a.forEach(pc => set.add(pc)));
    if (lick.ctx === 'blues7' || lick.tags.indexOf('blues') >= 0) T.scalePcs(refChord.rootPc, 'blues').forEach(pc => set.add(pc));
    refChord.pcs.forEach(pc => set.add(pc));
    return set;
  }

  /* ---------------- 組み立て ---------------- */
  const counters = {};
  function compile(spec) {
    const errs = [];
    const refSrc = [].concat(spec.ref);
    const ref = refSrc.map(s => T.parseChord(s));
    if (ref.some(c => !c)) errs.push('ref のコードが読めない：' + refSrc.join(' '));
    const segs = spec.segs ? spec.segs.slice() : ref.map(() => 4);
    if (segs.length !== ref.length) errs.push('segs と ref の数が合わない');
    const pr = parseNotes(spec.notes);
    pr.errors.forEach(e => errs.push(e));
    const lick = {
      id: spec.id, ctx: spec.ctx, name: spec.name, desc: spec.desc || '', tags: (spec.tags || []).slice(), lvl: spec.lvl || 1,
      ref, refSrc, segs, bpb: spec.bpb || 4, src: spec.notes, errors: errs,
      total: pr.total12 / TPB, pickup: pr.pickup / TPB, cuts: pr.cuts.map(c => c / TPB), bars12: pr.bars, total12: pr.total12, events: [],
    };
    if (errs.length) return lick;
    const cum = [0]; segs.forEach(s => cum.push(cum[cum.length - 1] + Math.round(s * TPB)));
    let min = 999, max = -1, first = null, last = null;
    for (const e of pr.events) {
      const ev = { t: e.t12 / TPB, dur: e.d12 / TPB, t12: e.t12, d12: e.d12, rest: e.rest };
      let seg = 0; for (let k = 0; k < segs.length; k++) if (e.t12 >= cum[k]) seg = k;
      ev.seg = seg;
      if (!e.rest) {
        Object.assign(ev, { p: e.p, midi: e.midi, tie: e.tie, accent: e.accent, stac: e.stac });
        ev.rel = mod(e.midi - ref[seg].rootPc, 12);
        ev.deg = T.semisToDegreeName(ev.rel, ref[seg].cls, ref[seg]);
        if (e.midi < min) min = e.midi; if (e.midi > max) max = e.midi;
        if (first == null) first = e.midi; last = e.midi;
      }
      lick.events.push(ev);
    }
    lick.midi = { min, max, first, last };
    // 最後のコードが「トニック」の解決のとき、7th（♭7・△7）を使っていなければ、ドミナント7th の I7 にも使える
    const lastSeg = segs.length - 1;
    lick.anyTonic = lick.events.every(ev => ev.rest || ev.seg !== lastSeg || (ev.rel !== 10 && ev.rel !== 11) || (ev.dur < 1 && ev.t12 % TPB !== 0));
    return lick;
  }

  /* ---------------- 検査（lint） ---------------- */
  // 戻り値 {errors:[…], warns:[…]}。errors が出たら書き間違いの可能性が高い
  function lint(lick) {
    const errors = lick.errors.slice(), warns = [];
    if (errors.length) return { errors, warns };
    const sumSegs = lick.segs.reduce((a, b) => a + b, 0);
    const lastEnd = lick.events.length ? Math.max.apply(null, lick.events.map(e => e.t12 + e.d12)) : 0;
    if (lastEnd !== Math.round(sumSegs * TPB)) errors.push(`長さが合わない：音は ${lastEnd / TPB} 拍ぶん、コードは ${sumSegs} 拍ぶん`);
    const barLen = lick.bpb * TPB;
    lick.bars12.forEach(b => { if (b < 0 || b % barLen !== 0) errors.push(`小節線の位置が小節の頭でない（${b / TPB} 拍目）`); });
    lick.cuts.forEach(c => { const c12 = Math.round(c * TPB); if (c12 % (TPB / 2) !== 0) errors.push(`カット位置が拍の途中（${c} 拍目）`); });
    const notes = lick.events.filter(e => !e.rest);
    if (!notes.length) { errors.push('音がない'); return { errors, warns }; }
    if (lick.midi.min < 52) errors.push('低すぎる（' + T.pitchStr(T.pitchFromMidi(lick.midi.min)) + '）');
    if (lick.midi.max > 88) errors.push('高すぎる（' + T.pitchStr(T.pitchFromMidi(lick.midi.max)) + '）');
    const span = lick.midi.max - lick.midi.min;
    if (span > 21) errors.push('音域が広すぎる（' + span + '半音）');
    // コードの切り替わりでの音のとび（小節をまたぐ・コードをまたぐ所で大きく跳ぶと、つながって聞こえない）
    {
      const segEnd = []; let acc = 0;
      lick.segs.forEach(sg => { acc += Math.round(sg * TPB); segEnd.push(acc); });
      for (let k = 0; k < segEnd.length - 1; k++) {
        const before = lick.events.filter(e => e.t12 + e.d12 === segEnd[k]).pop();
        const after = lick.events.find(e => e.t12 === segEnd[k]);
        if (before && after && !before.rest && !after.rest && Math.abs(after.midi - before.midi) > 7) {
          errors.push(`コードの切り替わりで音が大きく跳ぶ（${T.pitchStr(before.p)}→${T.pitchStr(after.p)}、${Math.abs(after.midi - before.midi)}半音）`);
        }
      }
    }
    // コードの音か、その色（テンション）の音か
    const chordish = (e) => {
      const ref = lick.ref[e.seg], pc = mod(e.midi, 12), rel = mod(pc - ref.rootPc, 12);
      if (ref.pcs.indexOf(pc) >= 0) return true;
      if (ref.cls === 'dom' || ref.cls === 'sus') return [2, 9, 6, 3, 8, 1].indexOf(rel) >= 0;   // 9・13・♯11・♯9・♭13・♭9
      if (ref.cls === 'maj') return [2, 6, 9].indexOf(rel) >= 0;
      if (ref.cls === 'min') return [2, 5, 9].indexOf(rel) >= 0;
      return [2].indexOf(rel) >= 0;
    };
    // 隣りあう音のとびと、スケールの外の音
    const allowed = lick.ref.map(c => allowedPcs(c, lick));
    let weakNon = 0, strong = 0, strongCT = 0;
    for (let i = 0; i < lick.events.length; i++) {
      const e = lick.events[i];
      if (e.rest) continue;
      const prev = (() => { for (let k = i - 1; k >= 0; k--) { if (lick.events[k].rest) return null; return lick.events[k]; } return null; })();
      const next = (() => { for (let k = i + 1; k < lick.events.length; k++) { if (lick.events[k].rest) return null; return lick.events[k]; } return null; })();
      if (prev) {
        const leap = Math.abs(e.midi - prev.midi);
        if (leap > 12) errors.push(`音のとびが大きすぎる（${leap}半音：${T.pitchStr(prev.p)}→${T.pitchStr(e.p)}）`);
        else if (leap > 9) warns.push(`大きなとび ${leap}半音（${T.pitchStr(prev.p)}→${T.pitchStr(e.p)}）`);
      }
      const pc = e.midi % 12, ok = allowed[e.seg].has(mod(e.midi, 12));
      const onBeat = e.t12 % TPB === 0;
      if (!ok) {
        // 半音で入る／半音で出る 経過音・装飾音ならよい（短く、あとが今のスケールの音）
        const nbIn = (n) => n && Math.abs(n.midi - e.midi) <= 1 && allowed[n.seg].has(mod(n.midi, 12));
        const short = e.dur <= 0.5 + 1e-9;
        if (!(short && (nbIn(next) || nbIn(prev)))) errors.push(`スケール外の音 ${T.pitchStr(e.p)}（${e.t} 拍目、${T.semisToDegreeName(e.rel, lick.ref[e.seg].cls, lick.ref[e.seg])}）`);
        else if (onBeat) warns.push(`拍頭の半音アプローチ ${T.pitchStr(e.p)}（${e.t} 拍目）`);
        weakNon++;
      }
      if (onBeat && !e.rest) { strong++; if (chordish(e)) strongCT++; }
    }
    if (!chordish(notes[0]) && lick.pickup === 0) warns.push('はじまりの音がコードの音（色も含む）でない');
    if (!chordish(notes[notes.length - 1])) warns.push('終わりの音がコードの音（色も含む）でない：' + T.pitchStr(notes[notes.length - 1].p));
    if (strong >= 3 && strongCT / strong < 0.5) warns.push(`拍頭のコードトーンが少ない（${strongCT}/${strong}）`);
    return { errors, warns };
  }

  /* ---------------- 登録 ---------------- */
  function add(spec) {
    counters[spec.ctx] = (counters[spec.ctx] || 0) + 1;
    spec.id = spec.id || `${spec.ctx}-${String(counters[spec.ctx]).padStart(3, '0')}`;
    const lick = compile(spec);
    if (lick.errors.length) { L.errors.push(`${spec.id} ${spec.name || ''}：${lick.errors.join(' / ')}`); return null; }
    if (!L.CTX[spec.ctx]) { L.errors.push(`${spec.id}：知らない ctx（${spec.ctx}）`); return null; }
    if (L.byId[lick.id]) { L.errors.push(`${lick.id}：id がかぶっている`); return null; }
    L.all.push(lick); L.byId[lick.id] = lick;
    (L.byCtx[spec.ctx] = L.byCtx[spec.ctx] || []).push(lick);
    return lick;
  }
  // base：{ctx, ref, segs, tags, lvl, bpb}。rows：[名前, 音, 解説, {tags, lvl, …}]
  function pack(base, rows) {
    rows.forEach(r => {
      const extra = r[3] || {};
      add(Object.assign({}, base, {
        name: r[0], notes: Array.isArray(r[1]) ? r[1].join(' | ') : r[1], desc: r[2] || '',
        tags: (base.tags || []).concat(extra.tags || []), lvl: extra.lvl || base.lvl || 1,
        segs: extra.segs || base.segs, ref: extra.ref || base.ref, bpb: extra.bpb || base.bpb,
      }));
    });
  }

  /* ---------------- 検索 ---------------- */
  const EPS = 1e-6;
  // コードの長さ durs（拍）に置けるか。置けるなら { lead, tail, len, cut }：
  //   lead … 最初のコードが長いときの手前のあき（その前に別のリックを置く）
  //   tail … 最後のコードが長いときのあと（あとで別のリックを置く）
  //   len … このリックが使う拍数。1コードだけのリックは、cut（途中で切れる位置）まででも置ける
  // 途中のコードの長さは、リックの書いた長さと一致していること
  function fit(lick, durs) {
    const n = lick.segs.length;
    if (durs.length !== n) return null;
    for (let k = 1; k < n - 1; k++) if (Math.abs(durs[k] - lick.segs[k]) > EPS) return null;
    if (n === 1) {
      if (durs[0] >= lick.segs[0] - EPS) return { lead: 0, tail: durs[0] - lick.segs[0], len: lick.total, cut: null };
      const cut = lick.cuts.filter(c => c <= durs[0] + EPS).pop();
      if (cut && cut >= 1.5) return { lead: 0, tail: durs[0] - cut, len: cut, cut };
      return null;
    }
    if (durs[0] < lick.segs[0] - EPS || durs[n - 1] < lick.segs[n - 1] - EPS) return null;
    return { lead: durs[0] - lick.segs[0], tail: durs[n - 1] - lick.segs[n - 1], len: lick.total, cut: null };
  }
  const fitLength = (lick, durs) => { const f = fit(lick, durs); return f ? f.len : null; };
  // 実際のコードの7thの種類と、リックの最後のコードでの7thの使い方が衝突していないか（拍頭か長い音だけ見る）
  function seventhConflict(lick, segIdx, chord) {
    if (!chord || chord.nc) return false;
    const forb = [];
    if (chord.seventh === 'b7') forb.push(11);
    else if (chord.seventh === '7') forb.push(10);
    else if (chord.six) forb.push(10);
    if (!forb.length) return false;
    return lick.events.some(e => !e.rest && e.seg === segIdx && forb.indexOf(e.rel) >= 0 && (e.t12 % TPB === 0 || e.dur >= 1));
  }
  // 拍子：4拍のリックは、3拍子などでは「1つのコード用」だけを切って使う
  const bpbOK = (l, bpb) => l.bpb === bpb || (bpb !== 4 && l.bpb === 4 && l.segs.length === 1);
  function find(ctx, opts) {
    opts = opts || {};
    const list = L.byCtx[ctx] || [];
    return list.filter(l => {
      if (opts.lvlMax && l.lvl > opts.lvlMax) return false;
      if (opts.tags && opts.tags.length && !opts.tags.some(t => l.tags.indexOf(t) >= 0)) return false;
      if (opts.exclude && opts.exclude.has && opts.exclude.has(l.id)) return false;
      if (opts.bpb && !bpbOK(l, opts.bpb)) return false;
      if (opts.anyTonic && !l.anyTonic) return false;
      if (opts.durs && fit(l, opts.durs) == null) return false;
      if (opts.chords) {
        for (let k = 0; k < l.segs.length; k++) if (seventhConflict(l, k, opts.chords[k])) return false;
      }
      return true;
    });
  }
  // このパターンのリックが1つでもあるか（フレーズの区切りを決めるときの判定）
  function has(ctx, durs, bpb) { return find(ctx, { durs, bpb: bpb || 4 }).length > 0; }

  /* ---------------- 移調して楽譜の音にする ---------------- */
  // chords：リックの各コードに対応する、実際のコード（parseChord の結果）の配列
  // opts：{t0, lo, hi, prev（直前の音 MIDI）, center, octave（強制）, limit（拍：ここまででカット）, preferFlat}
  function realize(lick, chords, opts) {
    opts = opts || {};
    const ref0 = lick.ref[0], tgt0 = chords[0];
    const ds0 = mod(tgt0.rootPc - ref0.rootPc, 12);
    // 文字のずれ（上へ何文字か）：半音のずれ ds0 と矛盾しないほうを選ぶ（C♯ → C は、0 文字でなく 7 文字で 11 半音）
    const stepsFor = (refL, dl0) => {
      let best = dl0, bestD = 99;
      for (const S of [dl0 - 7, dl0, dl0 + 7]) {
        const abs = refL + S, nat = 12 * Math.floor(abs / 7) + LPC[mod(abs, 7)] - LPC[refL];
        if (Math.abs(ds0 - nat) < bestD) { bestD = Math.abs(ds0 - nat); best = S; }
      }
      return best;
    };
    const dl = stepsFor(ref0.root.l, mod(tgt0.root.l - ref0.root.l, 7));
    // 綴りの文字のずれはコードごとに求める。コード記号が E7（F♭7 の異名）のように綴られていても、
    // 次のコードの音は、そのコードの根音を基準に綴る（最初のコードのずれを全部に当てると D♯・F𝄪 のようになる）
    const dls = lick.ref.map((r, k) => {
      const t = chords[k];
      return t && !t.nc && t.root && mod(t.rootPc - r.rootPc, 12) === ds0 ? stepsFor(r.root.l, mod(t.root.l - r.root.l, 7)) : dl;
    });
    const lo = opts.lo == null ? 55 : opts.lo, hi = opts.hi == null ? 84 : opts.hi, center = opts.center == null ? (lo + hi) / 2 : opts.center;
    let best = null;
    for (let k = -3; k <= 3; k++) {
      const sh = ds0 + 12 * k, mn = lick.midi.min + sh, mx = lick.midi.max + sh;
      let cost = Math.max(0, lo - mn) * 4 + Math.max(0, mx - hi) * 4;
      if (opts.prev != null) cost += Math.abs(lick.midi.first + sh - opts.prev) * 0.5 + Math.abs((mn + mx) / 2 - center) * 0.42;
      else cost += Math.abs((mn + mx) / 2 - center) * 0.4;
      if (opts.octave != null) cost = Math.abs(k - opts.octave) * 1000;
      if (!best || cost < best.cost) best = { k, sh, cost };
    }
    const preferFlat = opts.preferFlat != null ? opts.preferFlat : T.keyPrefersFlat(tgt0.root, 'major');
    const limit = opts.limit == null ? Infinity : opts.limit;
    const t0 = opts.t0 || 0, evs = [];
    for (const e of lick.events) {
      if (e.t >= limit - EPS) break;
      const dur = Math.min(e.dur, limit - e.t);
      if (e.rest) { evs.push({ t: t0 + e.t, dur, rest: true, seg: e.seg }); continue; }
      let p = T.shiftPitch(e.p, dls[e.seg] + 7 * best.k, best.sh);
      if (!p || Math.abs(p.a) > 1) p = T.pitchFromMidi(e.midi + best.sh, preferFlat);   // 二重の♯♭（E𝄫・F𝄪）は読みにくいので、ふつうの綴りに
      evs.push({ t: t0 + e.t, dur, p, midi: e.midi + best.sh, seg: e.seg, tie: e.tie && dur === e.dur, accent: e.accent, stac: e.stac, rel: e.rel, deg: e.deg });
    }
    return { events: evs, shift: best.sh, k: best.k, lo: lick.midi.min + best.sh, hi: lick.midi.max + best.sh, first: lick.midi.first + best.sh, last: lick.midi.last + best.sh };
  }

  // 1小節ごとの部品（セル）から、まとめてリックを組み立てる。
  // cells：{ 部品名: [音, 説明の短いことば], … }（部品名は 'a1' のようなキー）、
  // bars：コードごとの部品の置き場 [ {…}, {…}, … ]、combos：[[各コードの部品名…, lvl, [tags], 'リックの名前'?], …]
  function assemble(base, bars, combos) {
    combos.forEach(c => {
      const n = bars.length, keys = c.slice(0, n), lvl = c[n], tags = c[n + 1] || [], custom = c[n + 2];
      const parts = keys.map((k, i) => {
        const cell = bars[i][k];
        if (!cell) throw new Error('部品がない：' + base.ctx + ' ' + i + ' ' + k);
        return cell;
      });
      const name = custom || parts.map(p => p[1]).join(' → ');
      const desc = '部品の組み合わせ：' + keys.join(' + ');
      // 小節線は、拍子（4拍）の区切りにだけ置く（2拍のコードのあいだには置かない）
      const bpb = base.bpb || 4, segs = base.segs || [];
      let text = '', acc = 0;
      parts.forEach((p, i) => {
        text += (i ? ' ' : '') + p[0];
        acc += segs[i] != null ? segs[i] : bpb;
        if (i < parts.length - 1 && acc % bpb === 0) text += ' |';
      });
      add(Object.assign({}, base, { name, notes: text, desc: c[n + 3] || desc, tags: (base.tags || []).concat(tags), lvl: lvl || base.lvl || 1 }));
    });
  }

  Object.assign(L, { parseNotes, compile, lint, add, pack, assemble, find, has, fit, fitLength, realize, allowedPcs, seventhConflict, TPB });
  if (typeof module !== 'undefined' && module.exports) module.exports = AL;
})();
