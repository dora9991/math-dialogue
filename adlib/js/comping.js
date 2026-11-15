/* アドリブ・ラボ：伴奏の作曲係（画面を持たない。ここでは「音の並び」を作るだけで、鳴らすのは synth.js）。
   コードの並び（C.slotsOf）から、スタイルごとに次の3パートの音符を作る：
     comp  … ピアノ／ギター／オルガンなどのコード（コンピング）。ボイスリーディングがなめらかな 3rd・7th 中心のボイシング
     bass  … ベース（ウォーキング、2ビート、ボサノバ、8分のルート弾き、シャッフル、トゥンバオ …）
     drums … ドラム・打楽器（ライド、ハイハット、スネア、クラーベ、カウベル、コンガ …）
   時間はすべて「拍」（4分音符=1）で、シャッフルのずれは入れない（鳴らすときに player が入れる）。
   3連符の位置（1/3・2/3 拍）は、鳴らすときも動かない。 */
(function () {
  'use strict';
  const root = typeof window !== 'undefined' ? window : globalThis;
  const AL = (root.AL = root.AL || {});
  const T = AL.T;
  const B = (AL.B = AL.B || {});
  const mod = T.mod;

  /* ---------------- スタイル ---------------- */
  // tempo：[標準, 最小, 最大]
  // swing：ハネる音符の前半の長さの割合（0.5 = イーブン、0.667 = 3連のハネ）。sdiv：2 = 8分がハネる（標準）、4 = 16分がハネる
  // en：楽譜の左上に出す名前。inst：このスタイルに合う楽器（スタイルを変えたとき、前のスタイルのおすすめのままなら入れかえる）
  // vocab／avoid：ソロのリック選びで、選びやすくする／選びにくくする特徴タグ。fast：1拍が速い書き方なので、ソロに16分音符を使わない
  const JAZZ_INST = { comp: 'piano', bass: 'upright', drums: 'jazz' };
  const STYLES = {
    swing: { id: 'swing', group: 'jazz', jp: 'スウィング（4ビート）', en: 'Swing', bpb: 4, tempo: [140, 60, 320], swing: 0.64, note: 'ライドとウォーキングベースの定番ジャズ' },
    swing2: { id: 'swing2', group: 'jazz', jp: '2ビート・スウィング', en: '2-Beat Swing', bpb: 4, tempo: [120, 60, 240], swing: 0.62, note: 'ベースが2分音符で刻む、ゆったりしたスウィング' },
    ballad: { id: 'ballad', group: 'jazz', jp: 'バラード', en: 'Ballad', bpb: 4, tempo: [64, 40, 100], swing: 0.57, note: 'ブラシと、ゆったりした和音' },
    waltz: { id: 'waltz', group: 'jazz', jp: 'ジャズワルツ（3/4）', en: 'Jazz Waltz', bpb: 3, tempo: [150, 90, 230], swing: 0.62, note: '3拍子のジャズ。ブン・チャ・チャ' },
    rock8: { id: 'rock8', group: 'rock', jp: 'ロック（8ビート）', en: 'Rock', bpb: 4, tempo: [120, 70, 200], swing: 0.5, note: 'イーブンの8分音符。ハイハットの8分、スネアは2・4拍、ベースは8分のルート弾き',
      inst: { comp: 'piano', bass: 'ebass', drums: 'rock' }, vocab: ['pent', 'blues', 'leap', 'zigzag'], avoid: ['bebop'] },
    popballad: { id: 'popballad', group: 'rock', jp: 'ポップ・バラード（8ビート）', en: 'Pop Ballad', bpb: 4, tempo: [72, 50, 104], swing: 0.5, note: 'ゆっくりの8ビート。リムの音と、のばした和音',
      inst: { comp: 'piano', bass: 'ebass', drums: 'jazz' }, vocab: ['pent', 'leap', 'arp', 'syncopation'], avoid: ['bebop'] },
    shuffle: { id: 'shuffle', group: 'blues', jp: 'ブルース・シャッフル', en: 'Shuffle', bpb: 4, tempo: [112, 70, 180], swing: 2 / 3, note: '8分音符が3連符でハネるシャッフル。ブルース、ロックンロール。ベースは同じ音を2つずつ',
      inst: { comp: 'piano', bass: 'ebass', drums: 'rock' }, vocab: ['blues', 'pent', 'triplet'] },
    slowblues: { id: 'slowblues', group: 'blues', jp: 'スロー・ブルース（12/8）', en: 'Slow Blues 12/8', bpb: 4, tempo: [60, 40, 90], swing: 2 / 3, note: '1拍を3つに割る、ゆっくりの 12/8。ハイハットとピアノの3連符',
      inst: { comp: 'piano', bass: 'ebass', drums: 'jazz' }, vocab: ['blues', 'pent', 'triplet'] },
    soul: { id: 'soul', group: 'blues', jp: 'ソウル／モータウン', en: 'Soul', bpb: 4, tempo: [116, 80, 150], swing: 0.5, note: 'スネアの4つ打ちとタンバリン。よく動くベース',
      inst: { comp: 'piano', bass: 'ebass', drums: 'rock' }, vocab: ['pent', 'blues', 'syncopation'], avoid: ['bebop'] },
    funk: { id: 'funk', group: 'dance', jp: 'ファンク（16ビート）', en: 'Funk', bpb: 4, tempo: [100, 70, 150], swing: 0.5, note: 'イーブン16分のグルーヴ',
      inst: { comp: 'ep', bass: 'ebass', drums: 'rock' }, vocab: ['pent', 'blues', 'syncopation', 'sixteenth'] },
    hiphop: { id: 'hiphop', group: 'dance', jp: 'ヒップホップ（16分シャッフル）', en: 'Hip Hop', bpb: 4, tempo: [90, 70, 115], swing: 0.62, sdiv: 4, note: '16分音符がハネる、重いビート（ブーンバップ、ニュージャック・スウィング、ハーフタイム・シャッフル）',
      inst: { comp: 'ep', bass: 'synbass', drums: 'rock' }, vocab: ['pent', 'blues', 'syncopation', 'sixteenth'], avoid: ['bebop'] },
    disco: { id: 'disco', group: 'dance', jp: 'ディスコ（4つ打ち）', en: 'Disco', bpb: 4, tempo: [120, 100, 140], swing: 0.5, note: 'キックの4つ打ち、裏拍のオープン・ハイハット、オクターブで動くベース',
      inst: { comp: 'ep', bass: 'ebass', drums: 'rock' }, vocab: ['pent', 'syncopation', 'leap'], avoid: ['bebop'] },
    bossa: { id: 'bossa', group: 'latin', jp: 'ボサノバ', en: 'Bossa Nova', bpb: 4, tempo: [128, 80, 180], swing: 0.5, note: 'イーブン8分のブラジルのリズム' },
    samba: { id: 'samba', group: 'latin', jp: 'サンバ', en: 'Samba', bpb: 4, tempo: [190, 150, 240], swing: 0.5, fast: true, note: '速い2拍子のブラジルのリズム（1小節＝4拍で書くので、テンポの数字は大きい）',
      inst: { comp: 'piano', bass: 'upright', drums: 'jazz' }, vocab: ['syncopation', 'arp', 'leap'] },
    salsa: { id: 'salsa', group: 'latin', jp: 'サルサ（ラテン）', en: 'Salsa', bpb: 4, tempo: [180, 140, 220], swing: 0.5, fast: true, note: '2-3 のクラーベ、ピアノのモントゥーノ、次の小節を先取りするベース（トゥンバオ）',
      inst: { comp: 'piano', bass: 'upright', drums: 'jazz' }, vocab: ['syncopation', 'arp', 'leap'] },
    reggae: { id: 'reggae', group: 'latin', jp: 'レゲエ（ワンドロップ）', en: 'Reggae', bpb: 4, tempo: [140, 110, 170], swing: 0.56, note: '2・4拍の裏打ち（スカンク）と、3拍目に落ちるドラム。1拍目は空ける',
      inst: { comp: 'organ', bass: 'ebass', drums: 'jazz' }, vocab: ['pent', 'syncopation', 'rhythm'], avoid: ['bebop'] },
  };
  Object.keys(STYLES).forEach(k => { if (!STYLES[k].inst) STYLES[k].inst = JAZZ_INST; });
  B.STYLES = STYLES;
  // 画面の選択肢の見出し
  B.STYLE_GROUPS = [
    { id: 'jazz', jp: 'ジャズ' }, { id: 'rock', jp: 'ロック・ポップス' }, { id: 'blues', jp: 'ブルース・ソウル' },
    { id: 'dance', jp: 'ファンク・ダンス' }, { id: 'latin', jp: 'ラテン・レゲエ' },
  ];
  // スタイルの標準のノリ：'even' ストレート／'s8' 8分シャッフル（スウィング）／'s16' 16分シャッフル
  B.feelKindOf = sd => (sd && sd.swing > 0.505 ? (sd.sdiv === 4 ? 's16' : 's8') : 'even');

  function rng(seed) {
    let a = seed >>> 0;
    return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  const wchoice = (list, rand, avoid) => {
    const w = list.map((p, i) => (p === avoid ? p.w * 0.25 : p.w));
    const sum = w.reduce((a, b) => a + b, 0);
    let r = rand() * sum;
    for (let i = 0; i < list.length; i++) { r -= w[i]; if (r <= 0) return list[i]; }
    return list[0];
  };

  /* ---------------- ボイシング ---------------- */
  // コードから「ルートからの半音」のリスト（鳴らす音）。重要な音（3度・7度）が先頭に来る
  function voicingSemis(chord, thin) {
    const e = chord.ext, has = (n, a) => e[n] && e[n].indexOf(a) >= 0;
    let v;
    switch (chord.cls) {
      case 'maj':
        if (chord.seventh === '7') v = has(11, 1) ? [4, 11, 6, 2] : [4, 11, 7, 2];
        else if (chord.six) v = [4, 9, 7, 2];
        else v = [4, 7, 0];
        break;
      case 'min':
        if (chord.seventh === 'b7') v = has(11, 0) ? [3, 10, 5, 7] : [3, 10, 7, 2];
        else if (chord.six) v = [3, 9, 7, 2];
        else v = [3, 7, 0];
        break;
      case 'minmaj': v = [3, 11, 7, 2]; break;
      case 'dom': {
        const alts = [];
        if (has(9, -1)) alts.push(1);
        if (has(9, 1)) alts.push(3);
        if (has(11, 1) || chord.fifth === -1) alts.push(6);
        if (has(13, -1) || chord.fifth === 1) alts.push(8);
        if (chord.alt) v = [4, 10, 3, 8];   // 7alt：3rd・♭7・♯9・♭13（ピアニストの定番）
        else if (alts.length >= 2) v = [4, 10, alts[0], alts[1]];
        else if (alts.length === 1) v = [4, 10, alts[0], alts[0] === 1 || alts[0] === 3 ? 9 : 2];
        else v = [4, 10, 2, 9];
        break;
      }
      case 'sus': v = chord.seventh ? [5, 10, 2, 7] : [5, 7, 0]; break;
      case 'hdim': v = [3, 6, 10, 5]; break;
      case 'dim': v = [3, 6, 9, 0]; break;
      case 'aug': v = chord.seventh ? [4, 8, 10, 2] : [4, 8, 0]; break;
      case 'pow': v = [7, 0]; break;
      default: v = [4, 7, 0];
    }
    if (chord.bass && chord.bassPc !== chord.rootPc && v.indexOf(0) < 0) { v = v.slice(0, 3); v.push(0); }   // スラッシュコードは根音も鳴らす
    return thin ? v.slice(0, 3) : v;
  }
  // 前の和音になめらかにつながる、音域内の並びを探す
  function voice(chord, prev, range, thin) {
    const semis = voicingSemis(chord, thin);
    const [lo, hi] = range, center = (lo + hi) / 2;
    const opts = semis.map(s => { const pc = mod(chord.rootPc + s, 12), a = []; for (let m = lo; m <= hi; m++) if (mod(m, 12) === pc) a.push(m); return a; });
    if (opts.some(a => !a.length)) return prev || [60];
    let best = null;
    const rec = (i, cur) => {
      if (i === opts.length) {
        const v = cur.slice().sort((a, b) => a - b);
        const span = v[v.length - 1] - v[0];
        if (span > 15) return;
        let cost = 0;
        // 半音でぶつかる並び（9th と♭3rd など）は、Type B のボイシングでも使うので禁止はせず、少し避ける
        for (let k = 1; k < v.length; k++) if (v[k] - v[k - 1] < 2 && chord.cls !== 'dim') cost += k === 1 ? 2.5 : 1.8;
        if (prev && prev.length) { const n = Math.min(prev.length, v.length); for (let k = 0; k < n; k++) cost += Math.abs(v[v.length - 1 - k] - prev[prev.length - 1 - k]); cost += Math.abs(prev.length - v.length) * 3; }
        const mean = v.reduce((a, b) => a + b, 0) / v.length;
        cost += Math.abs(mean - center) * 0.6 + Math.max(0, span - 9) * 0.4;
        if (!best || cost < best.cost) best = { cost, v };
        return;
      }
      for (const m of opts[i]) { cur.push(m); rec(i + 1, cur); cur.pop(); }
    };
    rec(0, []);
    return best ? best.v : (prev || [60]);
  }

  /* ---------------- コンピングのリズム（拍の単位：[はじまり, 長さ, 強さ]） ---------------- */
  const SW = [
    { w: 3, hits: [[0, 1.5, 1], [1.5, 0.5, 0.9]] },                 // チャールストン
    { w: 2, hits: [[1.5, 1, 1], [3.5, 0.5, 0.8]] },
    { w: 2, hits: [[0.5, 0.5, 0.9], [2, 1.5, 1]] },
    { w: 2, hits: [[0, 0.5, 1], [1.5, 0.5, 0.9], [3, 1, 1]] },
    { w: 2, hits: [[1, 1, 1], [2.5, 0.5, 0.9]] },
    { w: 2, hits: [[0, 1, 1], [2.5, 1.5, 0.9]] },
    { w: 1, hits: [[1, 0.5, 0.9], [3, 0.5, 0.9]] },
    { w: 1, hits: [[0, 3, 1]] },
    { w: 2, hits: [[2, 1.5, 1], [3.5, 0.5, 0.8]] },
    { w: 1, hits: [[0.5, 0.5, 0.9], [1.5, 0.5, 0.9], [3, 1, 1]] },
  ];
  const BALLAD = [
    { w: 3, hits: [[0, 4, 1]] }, { w: 2, hits: [[0, 2, 1], [2, 2, 0.8]] }, { w: 2, hits: [[0, 2.5, 1], [2.5, 1.5, 0.7]] }, { w: 1, hits: [[0, 1.5, 1], [1.5, 0.5, 0.7], [2.5, 1.5, 0.9]] },
  ];
  // ボサノバは2小節でひとまとまり（クラーベ 3-2）
  const BOSSA = [
    [{ w: 1, hits: [[0, 1.5, 1], [1.5, 1.5, 0.9], [3, 1, 1]] }],
    [{ w: 1, hits: [[1, 1, 0.9], [2, 1.5, 1]] }, { w: 1, hits: [[1, 1, 0.9], [2, 1, 1], [3.5, 0.5, 0.8]] }],
  ];
  const WALTZ = [
    { w: 3, hits: [[1, 1, 1], [2, 1, 0.9]] }, { w: 2, hits: [[0, 1.5, 1], [2, 1, 0.9]] }, { w: 2, hits: [[1, 0.5, 0.9], [1.5, 0.5, 0.8], [2, 1, 1]] }, { w: 1, hits: [[0, 3, 1]] },
  ];
  const FUNK = [
    { w: 3, hits: [[0, 0.5, 1], [0.75, 0.25, 0.7], [1.5, 0.5, 0.9], [2, 0.5, 1], [2.75, 0.25, 0.7], [3.5, 0.5, 0.9]] },
    { w: 3, hits: [[0.5, 0.25, 0.8], [1, 0.5, 1], [1.75, 0.25, 0.7], [2.5, 0.5, 1], [3.25, 0.25, 0.7], [3.5, 0.5, 0.9]] },
    { w: 2, hits: [[0, 1.5, 1], [1.5, 0.5, 0.8], [2.5, 1.5, 1]] },
  ];
  // ギター（フレディ・グリーン風）：毎拍の短いストローク
  const GREEN = [{ w: 1, hits: [[0, 1, 1], [1, 1, 0.85], [2, 1, 1], [3, 1, 0.85]] }];
  const GREEN3 = [{ w: 1, hits: [[0, 1, 1], [1, 1, 0.85], [2, 1, 0.85]] }];
  // 8分音符を全部きざむ（強さだけ変える）
  const eighths = (a, b, len) => { const h = []; for (let k = 0; k < 8; k++) h.push([k * 0.5, len || 0.5, k % 2 ? b : a]); return h; };
  // ロック：1拍目と「2拍目の裏」「4拍目の裏」に食いこむ型と、8分のきざみ
  const ROCK = [
    { w: 3, hits: [[0, 1.5, 1], [1.5, 2, 0.95], [3.5, 0.5, 0.8]] },
    { w: 3, hits: [[0, 1, 1], [1.5, 0.5, 0.8], [2, 1.5, 1], [3.5, 0.5, 0.8]] },
    { w: 2, hits: [[0, 2, 1], [2, 1.5, 0.95], [3.5, 0.5, 0.8]] },
    { w: 2, hits: eighths(1, 0.72) },
  ];
  const ROCK_GTR = [{ w: 3, hits: eighths(1, 0.7) }, { w: 1, hits: [[0, 1.5, 1], [1.5, 0.5, 0.8], [2, 1.5, 1], [3.5, 0.5, 0.8]] }];
  // ポップ・バラード：4分音符の和音と、のばす和音
  const POPB = [
    { w: 3, hits: [[0, 1, 1], [1, 1, 0.8], [2, 1, 0.9], [3, 1, 0.8]] },
    { w: 2, hits: [[0, 2, 1], [2, 2, 0.85]] },
    { w: 2, hits: [[0, 1.5, 1], [1.5, 0.5, 0.7], [2, 1.5, 0.9], [3.5, 0.5, 0.7]] },
  ];
  // シャッフル：ハネた8分のきざみ（チャンカ・チャンカ）と、裏拍のくい
  const SHUF = [
    { w: 3, hits: eighths(1, 0.68) },
    { w: 2, hits: [[0, 1, 1], [1.5, 0.5, 0.8], [2, 1, 1], [3.5, 0.5, 0.8]] },
    { w: 2, hits: [[0, 0.5, 1], [0.5, 0.5, 0.75], [1, 1, 1], [2.5, 0.5, 0.8], [3, 1, 1]] },
  ];
  // スロー・ブルース（12/8）：3連符の和音
  const TRIP = (() => { const h = []; for (let b = 0; b < 4; b++) { h.push([b, 1 / 3, b % 2 ? 0.9 : 1], [b + 1 / 3, 1 / 3, 0.58], [b + 2 / 3, 1 / 3, 0.68]); } return h; })();
  const SLOW12 = [
    { w: 3, hits: TRIP },
    { w: 2, hits: [[0, 1, 1], [1, 2 / 3, 0.8], [1 + 2 / 3, 1 / 3, 0.7], [2, 1, 1], [3, 2 / 3, 0.8], [3 + 2 / 3, 1 / 3, 0.7]] },
    { w: 1, hits: [[0, 2, 1], [2, 1 + 2 / 3, 0.9], [3 + 2 / 3, 1 / 3, 0.7]] },
  ];
  // ソウル：4分のきざみ（2・4拍を強く）と、8分のくい
  const SOUL = [
    { w: 3, hits: [[0, 0.5, 0.85], [1, 0.5, 1], [2, 0.5, 0.85], [3, 0.5, 1]] },
    { w: 2, hits: [[0, 1, 1], [1, 0.5, 0.9], [1.5, 0.5, 0.7], [2, 1, 1], [3, 0.5, 0.9], [3.5, 0.5, 0.7]] },
    { w: 2, hits: [[0, 1.5, 1], [1.5, 0.5, 0.8], [2.5, 0.5, 0.9], [3, 0.5, 1]] },
  ];
  const SOUL_GTR = [{ w: 1, hits: [[1, 0.4, 1], [3, 0.4, 1]] }];   // ギターは2・4拍の「チャッ」
  // ヒップホップ：のばす和音と、16分のくい
  const HIPHOP = [
    { w: 3, hits: [[0, 3.5, 1]] },
    { w: 2, hits: [[0, 1.5, 1], [1.75, 0.25, 0.6], [2.5, 1.5, 0.9]] },
    { w: 2, hits: [[0, 0.5, 1], [0.75, 0.25, 0.7], [1.5, 1, 0.9], [3.25, 0.25, 0.7]] },
  ];
  // ディスコ：16分のカッティングと、裏拍の和音
  const DISCO = [
    { w: 3, hits: [[0, 0.5, 1], [0.75, 0.25, 0.7], [1.5, 0.5, 0.9], [2, 0.5, 1], [2.75, 0.25, 0.7], [3.5, 0.5, 0.9]] },
    { w: 3, hits: [[0.5, 0.4, 0.9], [1.5, 0.4, 0.9], [2.5, 0.4, 0.9], [3.5, 0.4, 0.9]] },
    { w: 2, hits: [[0, 1.5, 1], [1.5, 2, 0.9], [3.5, 0.5, 0.8]] },
  ];
  // レゲエ：2・4拍の短い裏打ち（スカンク）。1拍目は弾かない
  const REGGAE = [
    { w: 3, hits: [[1, 0.35, 1], [3, 0.35, 1]] },
    { w: 2, hits: [[0.5, 0.2, 0.5], [1, 0.35, 1], [1.5, 0.2, 0.5], [2.5, 0.2, 0.5], [3, 0.35, 1], [3.5, 0.2, 0.5]] },   // オルガンの「バブル」
  ];
  // サンバ：2小節でひとまとまり
  const SAMBA = [
    [{ w: 1, hits: [[0, 0.9, 1], [1, 0.9, 0.85], [2.5, 0.9, 1], [3.5, 0.5, 0.9]] }],
    [{ w: 1, hits: [[0.5, 0.9, 0.9], [1.5, 0.9, 1], [2.5, 1.4, 0.9]] }],
  ];
  // サルサ：ピアノのモントゥーノ（2-3 のクラーベに合わせる。2小節でひとまとまり）
  const SALSA = [
    [{ w: 1, hits: [[0, 0.5, 1], [1, 0.5, 0.9], [1.5, 0.5, 1], [2.5, 0.5, 0.9], [3.5, 0.5, 1]] }],
    [{ w: 1, hits: [[0.5, 0.5, 0.9], [1.5, 0.5, 1], [2.5, 0.5, 0.9], [3.5, 0.5, 1]] }],
  ];

  // 長さの係数（音符の長さ × この係数が実際の鳴る長さ）
  const ARTIC = { piano: 0.78, ep: 0.8, guitar: 0.6, organ: 0.95, vibes: 0.9, pad: 1.0 };

  // 戻り値：{ list | alt（2小節交代）| fixed, roll（和音を少しばらして弾く）, noHead（コードの頭を無理に打たない）, artic（長さの係数をさらにかける） }
  function patternsFor(style, kind, bpb) {
    if (kind === 'pad') return { fixed: [{ w: 1, hits: [[0, bpb, 1]] }] };
    switch (style) {
      case 'swing': case 'swing2':
        if (kind === 'guitar') return { list: bpb === 3 ? GREEN3 : (style === 'swing2' ? [{ w: 1, hits: [[0, 2, 1], [2, 2, 0.9]] }] : GREEN) };
        if (kind === 'organ') return { list: SW.map(p => ({ w: p.w, hits: p.hits.map(h => [h[0], h[1] * 1.4, h[2]]) })) };
        return { list: SW };
      case 'ballad': return { list: BALLAD, roll: kind !== 'organ' };
      case 'bossa': return { alt: BOSSA };
      case 'waltz': return { list: WALTZ };
      case 'funk': return { list: FUNK };
      case 'rock8': return { list: kind === 'guitar' ? ROCK_GTR : ROCK };
      case 'popballad': return { list: POPB, roll: kind !== 'organ' };
      case 'shuffle': return { list: SHUF };
      case 'slowblues': return { list: SLOW12 };
      case 'soul': return { list: kind === 'guitar' ? SOUL_GTR : SOUL, noHead: kind === 'guitar' };
      case 'hiphop': return { list: HIPHOP };
      case 'disco': return { list: DISCO };
      case 'reggae': return { list: REGGAE, noHead: true, artic: 0.8 };
      case 'samba': return { alt: SAMBA };
      case 'salsa': return { alt: SALSA, artic: 0.9 };
      default: return { list: SW };
    }
  }

  /* ---------------- ベース ---------------- */
  const BASS_LO = 28, BASS_HI = 52;
  const nearestMidi = (pc, around, lo, hi) => {
    let best = null;
    for (let m = lo; m <= hi; m++) if (mod(m, 12) === mod(pc, 12) && (best == null || Math.abs(m - around) < Math.abs(best - around))) best = m;
    return best == null ? around : best;
  };
  const bassPc = c => (c.bass && c.bassPc >= 0 ? c.bassPc : c.rootPc);
  function chordToneSet(c) {
    const r = c.rootPc, s = new Set([r]);
    [c.guide3, c.guide7].forEach(x => { if (x >= 0) s.add(x); });
    s.add(mod(r + (c.fifth == null ? 7 : 7 + c.fifth), 12));
    return Array.from(s);
  }
  // コードの音（根音からの半音）：3度・5度・「6度か♭7」・上の折り返し（オクターブか♭7）。ブギーやソウルのベースの型に使う
  function bassTones(c) {
    const third = c.cls === 'sus' ? 5 : (c.guide3 >= 0 ? mod(c.guide3 - c.rootPc, 12) : 4);
    const fifth = c.cls === 'hdim' || c.cls === 'dim' ? 6 : 7 + (c.fifth || 0);
    const minor = third === 3;
    let color, top;
    if (c.cls === 'dim') { color = 9; top = 12; }
    else if (c.cls === 'dom') { color = 9; top = 10; }
    else if (minor) { color = c.six ? 9 : 10; top = 12; }
    else { color = 9; top = 12; }
    return { third, fifth, color, top, minor };
  }
  // 1つのコード（拍数 N）のウォーキング。nextPc：次の最初の音のピッチクラス。prev：直前の音（MIDI）
  function walkChunk(c, N, nextPc, prev, rand, prevLine) {
    const first = nearestMidi(bassPc(c), prev == null ? 38 : prev, BASS_LO, BASS_HI);
    if (N <= 1) return [first];
    const cts = chordToneSet(c);
    const sc = T.scalePcs(c.rootPc, (T.defaultScales(c)[0]) || 'mixolydian');
    const target = nextPc == null ? null : nextPc;
    let best = [];
    for (let trial = 0; trial < 70; trial++) {
      const line = [first]; let cur = first, cost = 0;
      for (let i = 1; i < N; i++) {
        const last = i === N - 1;
        let m;
        if (last && target != null) {
          // 次のコードのルートへ、半音（または全音）で入る
          const tm = nearestMidi(target, cur, BASS_LO, BASS_HI);
          const cand = [tm - 1, tm + 1, tm - 2, tm + 2].filter(x => x >= BASS_LO && x <= BASS_HI);
          const r = rand();
          m = cand[Math.floor(r * r * cand.length)];
          if (c.rootPc === target && N >= 3 && rand() < 0.4) m = nearestMidi(mod(c.rootPc + 7, 12), cur, BASS_LO, BASS_HI);   // 同じコードが続くなら5度でもよい
        } else {
          const strong = i === 2 || i === 0;
          const pool = strong ? cts : cts.concat(sc);
          const pc = pool[Math.floor(rand() * pool.length)];
          m = nearestMidi(pc, cur + (rand() < 0.5 ? -3 : 3), BASS_LO, BASS_HI);
        }
        const d = Math.abs(m - cur);
        cost += d === 0 ? 6 : d <= 2 ? 0 : d <= 4 ? 0.8 : d <= 7 ? 2.5 : 7;
        if (i === 2 && cts.indexOf(mod(m, 12)) < 0) cost += 1.5;
        if (prevLine && prevLine[i] === m) cost += 1.2;
        line.push(m); cur = m;
      }
      if (target != null) { const e = Math.abs(line[N - 1] - nearestMidi(target, line[N - 1], BASS_LO, BASS_HI)); cost += e === 1 ? -1.5 : e === 2 ? -0.5 : 3; }
      const mean = line.reduce((a, b) => a + b, 0) / N;
      cost += Math.abs(mean - 40) * 0.12;
      for (let i = 2; i < N; i++) if ((line[i] - line[i - 1]) * (line[i - 1] - line[i - 2]) > 0) cost -= 0.4;   // 同じ向きに続くラインを少し好む
      cost += rand() * 1.2;
      if (!best.length || cost < best.cost) { best = line; best.cost = cost; }
    }
    return best;
  }
  const BASS_STYLE = {
    swing: 'walk', waltz: 'walk', swing2: 'two', ballad: 'two', bossa: 'bossa', funk: 'funk',
    rock8: 'rock', popballad: 'pop', shuffle: 'boogie', slowblues: 'slow12', soul: 'soul', hiphop: 'hiphop', disco: 'octave',
    reggae: 'reggae', samba: 'samba', salsa: 'tumbao',
  };

  /* ---------------- ドラム ---------------- */
  function drumsForBar(style, barIdx, bpb, rand, opts) {
    let ev = [];
    const add = (t, k, v) => ev.push({ t, kind: k, vel: Math.max(8, Math.min(127, Math.round(v * 127 * (0.92 + rand() * 0.16)))) });
    const fill = opts.fill, odd = barIdx % 2 === 1;
    switch (style) {
      case 'swing': case 'swing2': {
        const two = style === 'swing2', g = two ? 0.82 : 1;
        if (bpb === 3) { [0, 1, 2].forEach(b => add(b, 'ride', (b === 0 ? 0.62 : 0.75) * g)); add(1.5, 'ride', 0.42 * g); add(1, 'hhPedal', 0.5); add(2, 'hhPedal', 0.5); break; }
        [0, 1, 2, 3].forEach(b => add(b, 'ride', (b % 2 ? 0.8 : 0.66) * g));
        add(1.5, 'ride', 0.46 * g); add(3.5, 'ride', 0.46 * g);
        add(1, 'hhPedal', 0.62); add(3, 'hhPedal', 0.62);
        (two ? [0, 2] : [0, 1, 2, 3]).forEach(b => { if (rand() < 0.75) add(b, 'kick', two ? 0.3 : 0.2); });
        const r = rand();
        if (!fill) { if (r < 0.22) add(2.5, 'snare', 0.28); else if (r < 0.34) add(3.5, 'snare', 0.3); else if (r < 0.42) { add(0.5, 'snare', 0.24); add(2.5, 'snare', 0.28); } }
        break;
      }
      case 'ballad': {
        if (bpb === 3) { [0, 1, 2].forEach(b => add(b, 'brush', 0.5)); break; }
        [0, 1, 2, 3].forEach(b => add(b, 'brush', b % 2 ? 0.58 : 0.48));
        add(1, 'hhPedal', 0.4); add(3, 'hhPedal', 0.4);
        if (rand() < 0.7) add(0, 'kick', 0.25);
        break;
      }
      case 'bossa': {
        for (let k = 0; k < 8; k++) add(k * 0.5, 'hhClosed', k % 2 ? 0.28 : 0.42);
        (barIdx % 2 === 0 ? [0, 1.5, 3] : [1, 2]).forEach(b => add(b, 'sidestick', 0.5));
        [0, 1.5, 2, 3.5].forEach((b, i) => add(b, 'kick', i % 2 ? 0.3 : 0.5));
        break;
      }
      case 'waltz': {
        add(0, 'ride', 0.62); add(1, 'ride', 0.78); add(1.5, 'ride', 0.42); add(2, 'ride', 0.72);
        add(1, 'hhPedal', 0.5); add(2, 'hhPedal', 0.5);
        if (rand() < 0.8) add(0, 'kick', 0.32);
        break;
      }
      case 'funk': {
        for (let k = 0; k < 16; k++) add(k * 0.25, 'hhClosed', [0.55, 0.28, 0.42, 0.28][k % 4]);
        add(3.5, 'hhOpen', 0.3);
        add(1, 'snare', 0.85); add(3, 'snare', 0.85);
        add(0.75, 'snare', 0.25); add(2.75, 'snare', 0.22);
        [0, 1.75, 2.5, 3.25].forEach((b, i) => add(b, 'kick', i === 0 ? 0.85 : 0.6));
        break;
      }
      case 'rock8': {
        for (let k = 0; k < 8; k++) add(k * 0.5, 'hhClosed', k % 2 ? 0.3 : 0.5);
        add(1, 'snare', 0.9); add(3, 'snare', 0.9);
        (odd ? [0, 1.5, 2] : [0, 2, 2.5]).forEach((b, i) => add(b, 'kick', i === 0 ? 0.9 : 0.72));
        if (barIdx % 8 === 0 || opts.afterFill) add(0, 'crash', 0.5);
        break;
      }
      case 'popballad': {
        for (let k = 0; k < 8; k++) add(k * 0.5, 'hhClosed', k % 2 ? 0.2 : 0.32);
        add(1, 'sidestick', 0.5); add(3, 'sidestick', 0.5);
        add(0, 'kick', 0.6); add(2, 'kick', 0.5); add(odd ? 1.5 : 2.5, 'kick', 0.35);
        break;
      }
      case 'shuffle': {
        for (let k = 0; k < 8; k++) add(k * 0.5, 'hhClosed', k % 2 ? 0.3 : 0.52);   // 8分はすべて書く。鳴らすときにハネる
        add(1, 'snare', 0.85); add(3, 'snare', 0.85);
        add(0, 'kick', 0.8); add(2, 'kick', 0.7); if (odd) add(3.5, 'kick', 0.45);
        if (opts.afterFill) add(0, 'crash', 0.45);
        break;
      }
      case 'slowblues': {
        for (let b = 0; b < 4; b++) { add(b, 'hhClosed', 0.5); add(b + 1 / 3, 'hhClosed', 0.22); add(b + 2 / 3, 'hhClosed', 0.32); }
        add(1, 'snare', 0.8); add(3, 'snare', 0.8);
        add(0, 'kick', 0.75); add(2, 'kick', 0.65); add(odd ? 3 + 2 / 3 : 1 + 2 / 3, 'kick', 0.4);
        break;
      }
      case 'soul': {
        for (let k = 0; k < 8; k++) add(k * 0.5, 'tambourine', k % 2 ? 0.25 : 0.42);
        [0, 1, 2, 3].forEach(b => add(b, 'snare', b % 2 ? 0.8 : 0.42));   // スネアの4つ打ち（2・4拍を強く）
        (odd ? [0, 2, 2.5] : [0, 1.5, 2]).forEach((b, i) => add(b, 'kick', i === 0 ? 0.8 : 0.6));
        break;
      }
      case 'hiphop': {
        for (let k = 0; k < 16; k++) add(k * 0.25, 'hhClosed', [0.5, 0.16, 0.34, 0.2][k % 4]);   // 16分。鳴らすときに16分の裏がハネる
        add(1, 'snare', 0.88); add(3, 'snare', 0.88); add(1, 'clap', 0.45); add(3, 'clap', 0.45);
        (odd ? [[0, 0.95], [2.5, 0.8], [3.75, 0.5]] : [[0, 0.95], [1.75, 0.55], [2.5, 0.8]]).forEach(([b, v]) => add(b, 'kick', v));
        if (barIdx % 4 === 3) add(3.5, 'hhOpen', 0.3);
        break;
      }
      case 'disco': {
        [0, 1, 2, 3].forEach(b => { add(b, 'kick', 0.88); add(b, 'hhClosed', 0.3); add(b + 0.25, 'hhClosed', 0.16); add(b + 0.5, 'hhOpen', 0.36); add(b + 0.75, 'hhClosed', 0.18); });
        add(1, 'snare', 0.75); add(3, 'snare', 0.75); add(1, 'clap', 0.5); add(3, 'clap', 0.5);
        if (opts.afterFill) add(0, 'crash', 0.45);
        break;
      }
      case 'reggae': {
        for (let k = 0; k < 8; k++) add(k * 0.5, 'hhClosed', k % 2 ? 0.42 : 0.26);
        add(2, 'kick', 0.9); add(2, 'sidestick', 0.7);   // ワンドロップ：3拍目にだけ落とす
        if (barIdx % 4 === 3) add(3.5, 'tomHigh', 0.4);
        break;
      }
      case 'samba': {
        for (let k = 0; k < 8; k++) add(k * 0.5, 'shaker', k % 2 ? 0.42 : 0.26);
        [[0, 0.5], [1.5, 0.38], [2, 0.62], [3.5, 0.38]].forEach(([b, v]) => add(b, 'kick', v));
        add(1, 'hhPedal', 0.4); add(3, 'hhPedal', 0.4);
        (odd ? [0.5, 1.5, 2.5, 3] : [0, 1, 2, 2.5, 3.5]).forEach(b => add(b, 'sidestick', 0.48));   // タンボリンの型（2小節）
        break;
      }
      case 'salsa': {
        (odd ? [0, 1.5, 3] : [1, 2]).forEach(b => add(b, 'clave', 0.62));   // 2-3 のソン・クラーベ
        [[0, 0.6], [1, 0.36], [1.5, 0.3], [2, 0.6], [3, 0.36], [3.5, 0.3]].forEach(([b, v]) => add(b, 'cowbell', v));
        add(1, 'congaHi', 0.4); add(3, 'congaLo', 0.55); add(3.5, 'congaLo', 0.5);   // コンガのトゥンバオ（2拍目のスラップ、4拍目のオープン2つ）
        for (let k = 0; k < 8; k++) add(k * 0.5, 'shaker', k % 2 ? 0.2 : 0.3);
        add(1.5, 'kick', 0.3); add(3, 'kick', 0.34);
        break;
      }
    }
    if (fill) {
      // フィルイン：4拍目を置きかえる（もとの4拍目のスネア・ハイハットは抜く）
      const clear4 = () => { ev = ev.filter(e => e.t < 3 - 1e-6 || e.kind === 'kick' || e.kind === 'crash'); };
      if (style === 'funk') { [3, 3.25, 3.5, 3.75].forEach((b, i) => add(b, ['tomHigh', 'tomMid', 'tomLow', 'snare'][i], 0.5 + i * 0.08)); }
      else if (style === 'rock8' || style === 'disco' || style === 'soul') { clear4(); [3, 3.25, 3.5, 3.75].forEach((b, i) => add(b, ['snare', 'snare', 'tomMid', 'tomLow'][i], 0.55 + i * 0.1)); }
      else if (style === 'shuffle' || style === 'slowblues') { clear4(); [3, 3 + 1 / 3, 3 + 2 / 3].forEach((b, i) => add(b, 'snare', 0.5 + i * 0.14)); }
      else if (style === 'swing' || style === 'swing2' || style === 'ballad') { if (bpb === 4) { add(2.5, 'snare', 0.4); add(3, 'snare', 0.46); add(3.5, 'snare', 0.55); if (style !== 'ballad') add(3.5, 'kick', 0.4); } }
    }
    return ev;
  }
  const FILL_STYLES = { swing: 1, swing2: 1, ballad: 1, funk: 1, rock8: 1, disco: 1, soul: 1, shuffle: 1, slowblues: 1 };

  /* ---------------- 本体 ---------------- */
  // slots：C.slotsOf の結果。opts：{style, kind(ピアノ=piano/ギター=guitar/オルガン=organ/エレピ=ep/ビブラフォン=vibes/パッド=pad), seed, bpb, thin}
  function generate(slots, opts) {
    opts = opts || {};
    const style = STYLES[opts.style] ? opts.style : 'swing';
    const bpb = opts.bpb || STYLES[style].bpb;
    const kind = opts.kind || 'piano';
    const rand = rng((opts.seed || 1) * 2246822519 >>> 0);
    const total = slots.length ? slots[slots.length - 1].t0 + slots[slots.length - 1].dur : 0;
    const bars = Math.round(total / bpb);
    const out = { comp: [], bass: [], drums: [], total, bars, style, bpb };
    if (!bars) return out;
    const at = t => { for (let k = slots.length - 1; k >= 0; k--) if (t >= slots[k].t0 - 1e-6) return slots[k]; return slots[0]; };
    const range = kind === 'guitar' ? [48, 68] : kind === 'organ' ? [47, 69] : kind === 'vibes' ? [53, 77] : [52, 75];
    const thin = kind === 'guitar' && style !== 'bossa' ? true : !!opts.thin;
    const pat = patternsFor(style, kind, bpb);
    const artic = (ARTIC[kind] || 0.8) * (pat.artic || 1);
    const jazzy = style === 'swing' || style === 'swing2';
    let prevV = opts.prevVoicing || null;
    const voicings = new Map();
    const voiceOf = (slot) => {
      if (voicings.has(slot.i)) return voicings.get(slot.i);
      const v = slot.chord.nc ? null : voice(slot.chord, prevV, range, thin);
      if (v) prevV = v;
      voicings.set(slot.i, v);
      return v;
    };

    /* ---- コンピング ---- */
    let lastPat = null;
    for (let b = 0; b < bars; b++) {
      const b0 = b * bpb;
      const here = slots.filter(s => s.t0 < b0 + bpb - 1e-6 && s.t0 + s.dur > b0 + 1e-6);
      let hits;
      if (pat.fixed) hits = pat.fixed[0].hits;
      else if (pat.alt) { hits = wchoice(pat.alt[b % 2], rand).hits; }
      else { const p = wchoice(pat.list, rand, lastPat); lastPat = p; hits = p.hits; }
      hits = hits.filter(h => h[0] < bpb - 1e-6).map(h => h.slice());
      // 各コードの頭には必ず1つ打つ（コードが変わるのが聞こえるように）。レゲエの裏打ちなど、頭を空けるスタイルではしない
      if (!pat.noHead) {
        for (const s of here) {
          const rel = Math.max(0, s.t0 - b0);
          if (s.t0 < b0 - 1e-6) continue;
          if (!hits.some(h => h[0] >= rel - 1e-6 && h[0] < rel + 0.6)) hits.push([rel, Math.min(1, s.dur), 0.95]);
        }
      }
      hits.sort((a, c) => a[0] - c[0]);
      // 次の小節でコードが変わるとき、4拍目の裏で先に鳴らす（アンティシペーション）
      const nextSlot = slots.find(s => Math.abs(s.t0 - (b0 + bpb)) < 1e-6);
      const antic = !pat.fixed && !pat.alt && !pat.noHead && nextSlot && here.length === 1 && !hits.some(h => h[0] + h[1] > bpb - 0.6) && rand() < (jazzy ? 0.4 : 0.15) && kind !== 'guitar' && kind !== 'pad';
      hits.forEach((h, k) => {
        const slot = at(b0 + h[0] + 0.01);
        if (!slot || slot.chord.nc) return;
        const v = voiceOf(slot);
        if (!v) return;
        // 長さ：次の打鍵・コードの変わり目・小節の終わりまで
        const next = hits[k + 1] ? b0 + hits[k + 1][0] : b0 + bpb;
        const endOfChord = slot.t0 + slot.dur;
        let len = Math.min(h[1], next - (b0 + h[0]), endOfChord - (b0 + h[0]));
        len = Math.max(0.2, len) * artic;
        v.forEach((m, i) => {
          const roll = (pat.roll || kind === 'guitar') ? i * (kind === 'guitar' ? 0.014 : 0.03) : 0;
          // t は拍の位置（楽譜どおり）。off は、ロール（ばらして弾く）と小さなゆらぎ（拍）。ノリ（シャッフル）は t にかけて、off はそのあとに足す
          //   （t に混ぜると、3連符の位置の音が「3連符でない」と見なされて、シャッフルの式でずらされてしまう）
          const pos = b0 + h[0];
          out.comp.push({ t: pos, off: Math.max(-pos, roll + (rand() - 0.5) * 0.012), dur: len, midi: m, vel: Math.round((58 + rand() * 8) * h[2] + (kind === 'guitar' ? -4 : 0)) });
        });
      });
      if (antic) {
        const slot = nextSlot, v = voiceOf(slot);
        if (v && !slot.chord.nc) v.forEach(m => out.comp.push({ t: b0 + bpb - 0.5, dur: 0.42, midi: m, vel: 60 + Math.round(rand() * 8) }));
      }
    }

    /* ---- ベース ---- */
    if (opts.bass !== false) {
      const chunks = [];   // {slot, t0, n}
      slots.forEach(s => {
        if (s.chord.nc) { chunks.push({ slot: s, t0: s.t0, n: Math.max(1, Math.round(s.dur)), nc: true }); return; }
        // 小節ごとに分ける
        let t = s.t0;
        while (t < s.t0 + s.dur - 1e-6) {
          const barEnd = (Math.floor(t / bpb + 1e-6) + 1) * bpb;
          const e = Math.min(barEnd, s.t0 + s.dur);
          chunks.push({ slot: s, t0: t, n: Math.max(1, Math.round(e - t)) });
          t = e;
        }
      });
      let prev = null, prevLine = null, lastChord = '', lastUp = false;
      const chordKey = c => c.rootPc + '|' + (c.suffix || '') + '|' + bassPc(c);
      const bassStyle = BASS_STYLE[style] || 'walk';
      chunks.forEach((ch, ci) => {
        const c = ch.slot.chord;
        if (ch.nc) return;
        const nx = chunks[(ci + 1) % chunks.length];
        const nextPc = nx && !nx.nc ? bassPc(nx.slot.chord) : null;
        const vel = 78 + Math.round(rand() * 10);
        const barOdd = Math.floor(ch.t0 / bpb + 1e-6) % 2 === 1;
        const rel = ch.t0 - Math.floor(ch.t0 / bpb + 1e-6) * bpb;   // 小節の中での、このコードのはじまり
        const push = (p, dur, midi, v) => { if (p < ch.n - 1e-6) out.bass.push({ t: ch.t0 + p, dur, midi: Math.max(BASS_LO, Math.min(BASS_HI + 3, midi)), vel: Math.max(30, Math.min(120, v)) }); };
        // 次のコードの根音へ、1〜2半音で近づく音
        const approach = (from, lo, hi) => {
          if (nextPc == null) return from;
          const tm = nearestMidi(nextPc, from, lo, hi);
          if (tm === from) return from + (rand() < 0.5 ? -2 : 2);
          return tm + (tm > from ? -1 : 1) * (rand() < 0.5 ? 1 : 2);
        };
        if (bassStyle === 'walk') {
          const line = walkChunk(c, ch.n, nextPc, prev, rand, prevLine);
          line.forEach((m, i) => out.bass.push({ t: ch.t0 + i, off: Math.max(-(ch.t0 + i), (rand() - 0.5) * 0.01), dur: 0.92, midi: m, vel: vel + (i === 0 ? 6 : 0) - (i === ch.n - 1 ? 4 : 0) }));
          prev = line[line.length - 1]; prevLine = line;
        } else if (bassStyle === 'two') {
          const r = nearestMidi(bassPc(c), prev == null ? 38 : prev, BASS_LO, BASS_HI);
          const fifth = nearestMidi(mod(c.rootPc + 7, 12), r, BASS_LO, BASS_HI);
          const long = style === 'ballad' ? 1.9 : 1.75;
          if (ch.n >= 2 || bpb === 4) {
            out.bass.push({ t: ch.t0, dur: Math.min(long, ch.n * 0.95), midi: r, vel });
            if (ch.n >= 3) {
              let m2 = fifth;
              if (nextPc != null && rand() < 0.4) { const tm = nearestMidi(nextPc, r, BASS_LO, BASS_HI); m2 = tm + (rand() < 0.5 ? -1 : 1); }
              out.bass.push({ t: ch.t0 + 2, dur: Math.min(long, (ch.n - 2) * 0.95), midi: m2, vel: vel - 6 });
              prev = m2;
            } else prev = r;
          } else out.bass.push({ t: ch.t0, dur: 0.95, midi: r, vel });
        } else if (bassStyle === 'bossa') {
          const r = nearestMidi(bassPc(c), prev == null ? 38 : prev, 30, 50);
          // 2拍ごとに R(付点4分) 5th(8分) 。コードが2拍で変わるときは、そのコードの根音で。
          const parts = ch.n >= 4 ? [0, 2] : [0];
          parts.forEach(p => {
            const sl = at(ch.t0 + p + 0.01), cc = sl.chord, rr = nearestMidi(bassPc(cc), r, 30, 50), ff = nearestMidi(mod(cc.rootPc + 7, 12), rr, 30, 52);
            out.bass.push({ t: ch.t0 + p, dur: 1.3, midi: rr, vel });
            if (ch.n - p >= 2) out.bass.push({ t: ch.t0 + p + 1.5, dur: 0.45, midi: ff, vel: vel - 10 });
          });
          prev = r;
        } else if (bassStyle === 'funk') {
          const r = nearestMidi(bassPc(c), prev == null ? 38 : prev, 28, 48), o = r + 12 <= 52 ? r + 12 : r;
          const f = nearestMidi(mod(c.rootPc + 7, 12), r, 28, 52), b7 = nearestMidi(mod(c.rootPc + (c.seventh === '7' ? 11 : 10), 12), r, 28, 52);
          [[0, r, 0.45], [0.75, o, 0.2], [1.5, r, 0.4], [2.25, f, 0.2], [2.5, r, 0.45], [3.25, b7, 0.2], [3.5, o, 0.4]].forEach(([p, m, d]) => { if (p < ch.n) out.bass.push({ t: ch.t0 + p, dur: d, midi: m, vel: vel - (p % 1 ? 8 : 0) }); });
          prev = r;
        } else if (bassStyle === 'rock' || bassStyle === 'octave') {
          // ロック：根音の8分きざみ。ディスコ：根音とオクターブ上を交互に。コードの最後の8分は、次の根音へ近づくこともある
          const r = nearestMidi(bassPc(c), prev == null ? 36 : prev, 28, bassStyle === 'octave' ? 40 : 45), steps = Math.round(ch.n * 2);
          for (let i = 0; i < steps; i++) {
            let m = bassStyle === 'octave' && i % 2 ? r + 12 : r;
            if (i === steps - 1 && steps >= 4 && nextPc != null && mod(nextPc - bassPc(c), 12) !== 0 && rand() < 0.4) m = approach(r, 28, 50);
            push(i * 0.5, bassStyle === 'octave' ? 0.36 : 0.42, m, vel + (i % 2 ? -10 : 0) + (i === 0 ? 4 : 0));
          }
          prev = r;
        } else if (bassStyle === 'pop') {
          const r = nearestMidi(bassPc(c), prev == null ? 38 : prev, 28, 47), f = nearestMidi(mod(c.rootPc + 7, 12), r, 28, 52);
          push(0, Math.min(1.9, ch.n * 0.95), r, vel);
          if (ch.n >= 4) {
            push(2, 1.4, rand() < 0.55 ? r : f, vel - 6);
            if (nextPc != null && rand() < 0.55) push(3.5, 0.45, approach(r, 28, 50), vel - 10);
          }
          prev = r;
        } else if (bassStyle === 'boogie' || bassStyle === 'slow12') {
          // ブギーの型：根音・3度・5度・6度（7thコード）と上がり、同じコードが続けば ♭7・6度・5度・3度と降りる
          const bt = bassTones(c), r = nearestMidi(bassPc(c), prev == null ? 34 : prev, 28, 40);
          const same = lastChord === chordKey(c) && ch.n >= 4;
          const down = same && lastUp;
          const degs = ch.n >= 4 ? (down ? [bt.top, bt.color, bt.fifth, bt.third] : [0, bt.third, bt.fifth, bt.color]) : ch.n >= 2 ? [0, bt.fifth] : [0];
          lastUp = ch.n >= 4 && !down;
          const slash = bassPc(c) !== c.rootPc;
          const ms = degs.map((d, i) => (slash && i > 0 ? nearestMidi(mod(c.rootPc + d, 12), r + 6, 28, 52) : r + d));
          const appr = bassStyle === 'slow12' && ch.n >= 2 && nextPc != null;   // 3連符の3つ目で、次のコードへ向かう音を足すか
          ms.forEach((m, i) => {
            if (bassStyle === 'boogie') { push(i, 0.55, m, vel + (i === 0 ? 4 : 0)); push(i + 0.5, 0.4, m, vel - 14); }   // 同じ音を2つずつ（長・短）
            else push(i, appr && i === ch.n - 1 ? 0.6 : 0.9, m, vel + (i === 0 ? 4 : 0));   // 接近音の前の音は短く（重ねない）
          });
          if (appr) push(ch.n - 1 / 3, 0.3, approach(ms[Math.min(ms.length, ch.n) - 1], 28, 52), vel - 10);
          prev = r;
        } else if (bassStyle === 'soul') {
          const bt = bassTones(c), r = nearestMidi(bassPc(c), prev == null ? 36 : prev, 28, 40), o = r + 12, f = r + bt.fifth, six = r + bt.color;
          const pat2 = barOdd
            ? [[0, r, 0.7], [0.75, r, 0.2], [1.5, f, 0.45], [2, o, 0.45], [2.5, six, 0.45], [3, f, 0.45], [3.5, null, 0.45]]
            : [[0, r, 1.4], [1.5, f, 0.45], [2, o, 0.9], [3, six, 0.45], [3.5, f, 0.45]];
          pat2.forEach(([p, m, d]) => push(p, d, m == null ? approach(f, 28, 52) : m, vel - (p % 1 ? 8 : 0)));
          prev = r;
        } else if (bassStyle === 'hiphop') {
          const r = nearestMidi(bassPc(c), prev == null ? 36 : prev, 28, 43), f = nearestMidi(mod(c.rootPc + 7, 12), r - 5, 28, 50);
          (barOdd ? [[0, r, 1.5], [2.5, f, 0.45], [3, r, 0.45], [3.75, null, 0.22]] : [[0, r, 1.5], [1.75, r, 0.22], [2.5, r, 1.0]])
            .forEach(([p, m, d]) => push(p, d, m == null ? approach(r, 28, 48) : m, vel - (p % 1 ? 6 : 0)));
          prev = r;
        } else if (bassStyle === 'reggae') {
          const bt = bassTones(c), r = nearestMidi(bassPc(c), prev == null ? 36 : prev, 28, 43), f = nearestMidi(mod(c.rootPc + bt.fifth, 12), r - 3, 28, 50);
          (barOdd ? [[0.5, r, 0.45], [1, r, 0.9], [2.5, f, 0.45], [3, r, 0.9]] : [[0, r, 1.4], [1.5, r, 0.45], [2, f, 0.9], [3, r + bt.third, 0.9]])
            .forEach(([p, m, d]) => push(p, d, m, vel + 2));
          prev = r;
        } else if (bassStyle === 'samba') {
          // 根音（付点4分）・5度（8分）｜5度（付点4分）・次の根音（8分）
          const r = nearestMidi(bassPc(c), prev == null ? 38 : prev, 30, 48), f = nearestMidi(mod(c.rootPc + 7 + (c.fifth || 0), 12), r - 5, 28, 50);
          const nr = nextPc == null ? r : nearestMidi(nextPc, r, 28, 50);
          // 1小節つづくコードは上の型。小節の途中で変わるコード（2拍ずつなど）は、そのコードの根音から始めて、裏で次の根音へ
          const pat = ch.n >= 4 ? [[0, r, 1.3], [1.5, f, 0.45], [2, f, 1.3], [3.5, nr, 0.45]] : ch.n >= 2 ? [[0, r, 1.3], [ch.n - 0.5, nr, 0.45]] : [[0, r, 0.9]];
          pat.forEach(([p, m, d]) => push(p, d, m, vel - (p % 1 ? 8 : 0)));
          prev = r;
        } else {   // tumbao（サルサ）：2拍目の裏に5度、4拍目に「次の小節の根音」を先取りしてのばす。曲の頭だけ1拍目に根音
          const r = nearestMidi(bassPc(c), prev == null ? 38 : prev, 30, 48), f = nearestMidi(mod(c.rootPc + 7 + (c.fifth || 0), 12), r, 30, 52);
          const nr = nextPc == null ? r : nearestMidi(nextPc, r, 28, 50);
          if (ci === 0) push(0, 1.3, r, vel);
          [[1.5, f, 1.4], [3, nr, 2.3]].forEach(([p, m, d]) => { const q = p - rel; if (q >= -1e-6) push(q, d, m, vel - 2); });
          prev = nr;
        }
        lastChord = chordKey(c);
      });
    }

    /* ---- ドラム ---- */
    if (opts.drums !== false) {
      let lastFill = false;
      for (let b = 0; b < bars; b++) {
        const fill = b % 4 === 3 && b !== 0 && !!FILL_STYLES[style] && rand() < 0.35;
        const evs = drumsForBar(style, b, bpb, rand, { fill, afterFill: lastFill });
        evs.forEach(e => { if (e.t < bpb - 1e-6) out.drums.push({ t: b * bpb + e.t, kind: e.kind, vel: e.vel }); });
        lastFill = fill;
      }
    }
    out.comp.sort((a, b) => a.t - b.t); out.bass.sort((a, b) => a.t - b.t); out.drums.sort((a, b) => a.t - b.t);
    out.lastVoicing = prevV;
    return out;
  }

  Object.assign(B, { generate, voice, voicingSemis, walkChunk, rng });
  if (typeof module !== 'undefined' && module.exports) module.exports = AL;
})();
