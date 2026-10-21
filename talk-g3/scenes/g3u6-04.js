/* 中3 6章 円　第4時「弧の長さと円周角の関係を調べよう」（例）。自作。弧と円周角。
   図1・2：時計の文字盤（円 O(5.9,3.0) 半径2.25 を12等分、12時＝90°、1時＝60°…、9時＝180°）。P＝9時。1目もりの弧の中心角30°、円周角15°。
   表：弧の目もり1〜4 → 中心角30°〜120°、円周角15°〜60°。6目もり（半円）→ 90°。
   図2：A＝12時、B＝2時、C＝4時、D＝6時（弧AB＝弧CD＝60°）→ ∠APB＝∠CPD＝30°。
   図3：P＝270°、A＝160°、B＝80°、C＝320°（弧AB＝80°、弧BC＝120°）→ ∠APB＝40°、∠BPC＝60°（弧の比2：3、円周角の比2：3）。
   図4：半径6cm、弧AB（A＝210°、B＝330°）＝2π×6×[[1/3]]＝4πcm、中心角120°、P＝90° → ∠APB＝60°。 */
(function () {
  const { T: T0, B: B0, Q, FIG, tbl } = KL;
  /* ---- 読み上げ（say）：記号・英字・読みにくい語を、かなにする。字幕と読みがちがう行にだけ say がつく ---- */
  const plainS = s => String(s).replace(/\{\{|\}\}|\*\*/g, '');
  const KA = { A: 'エー', B: 'ビー', C: 'シー', D: 'ディー', E: 'イー', F: 'エフ', G: 'ジー', H: 'エイチ', I: 'アイ', J: 'ジェー', K: 'ケー', L: 'エル', M: 'エム', N: 'エヌ', O: 'オー', P: 'ピー', Q: 'キュー', R: 'アール', S: 'エス', T: 'ティー', U: 'ユー', V: 'ブイ', W: 'ダブリュー', X: 'エックス', Y: 'ワイ', Z: 'ゼット' };
  const KS = { a: 'エー', b: 'ビー', c: 'シー', d: 'ディー', e: 'イー', f: 'エフ', g: 'ジー', h: 'エイチ', i: 'アイ', j: 'ジェー', k: 'ケー', l: 'エル', m: 'エム', n: 'エヌ', o: 'オー', p: 'ピー', q: 'キュー', r: 'アール', s: 'エス', t: 'ティー', u: 'ユー', v: 'ブイ', w: 'ダブリュー', x: 'エックス', y: 'ワイ', z: 'ゼット' };
  const WD = [['円周角', 'えんしゅうかく'], ['中心角', 'ちゅうしんかく'], ['弦', 'げん'], ['接線', 'せっせん'], ['接点', 'せってん'], ['作図', 'さくず'], ['無作為', 'むさくい'], ['抽出', 'ちゅうしゅつ'], ['母集団', 'ぼしゅうだん'], ['標識', 'ひょうしき'], ['全数調査', 'ぜんすうちょうさ'], ['推定', 'すいてい'], ['偏', 'かたよ'], ['対頂角', 'たいちょうかく'], ['錯角', 'さっかく'], ['同位角', 'どういかく'], ['鯉', 'こい'], ['印', 'しるし'], ['周上', 'しゅうじょう']];
  const CN = ['いち', 'に', 'さん', 'よん', 'ご', 'ろく'];
  const rd = s => plainS(s)
    .replace(/\[\[(\d+)\/(\d+)\]\]/g, '$2分の$1').replace(/角∠/g, '角、∠')
    .replace(/[①-⑥]+/g, m => m.length === 1 ? 'まる' + CN['①②③④⑤⑥'.indexOf(m)] + '、' : [...m].map(c => CN['①②③④⑤⑥'.indexOf(c)]).join('、') + '、')
    .replace(/△/g, 'さんかく ').replace(/∠/g, 'かく ').replace(/≡/g, ' 合同 ').replace(/∽/g, ' そうじ ').replace(/∥/g, ' へいこう ').replace(/⊥/g, ' 垂直 ')
    .replace(/°/g, '度').replace(/＝/g, ' イコール ').replace(/≠/g, ' イコールではない ').replace(/≒/g, ' ほぼ ').replace(/：/g, ' たい ')
    .replace(/＜/g, ' より小さい ').replace(/＞/g, ' より大きい ').replace(/%/g, 'パーセント').replace(/π/g, 'パイ').replace(/′/g, 'ダッシュ')
    .replace(/(?<=[0-9度A-Za-z）)π])−/g, 'ひく').replace(/−/g, 'マイナス').replace(/÷/g, 'わる').replace(/×/g, 'かける').replace(/＋/g, 'たす')
    .replace(/[(（]/g, 'かっこ、').replace(/[)）]/g, '、かっことじ、')
    .replace(/cm²/g, 'へいほうセンチメートル').replace(/cm/g, 'センチメートル').replace(/²/g, 'の2乗')
    .replace(/[A-Z]+/g, m => [...m].map(c => KA[c] || c).join(''))
    .replace(/(?<![A-Za-z])[a-z](?![A-Za-z])/g, m => KS[m] || m)
    .replace(/、、+/g, '、').replace(/ {2,}/g, ' ').trim();
  const rdw = s => { let r = rd(s); for (const [a, b] of WD) r = r.split(a).join(b); return r; };
  const wrap = f => (s, o = {}) => { const r = rdw(s); return f(s, r === plainS(s) ? o : Object.assign({ say: r }, o)); };
  const T = wrap(T0), B = wrap(B0);
  const sad = { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } };      // ポンタのまちがいを、先生がやさしく直す
  const memo = (label, text, color) => ({ col: 0, type: 'box', color: color || 'y', size: 'xs', label, text, t: 4.5 });
  const note = (text, label) => ({ col: 0, type: 'text', size: 'xs', label, text, t: 3.5 });
  /* ---- 図の部品（座標は数学の座標・y が上。1目もり＝100px の図 11.8×6.0） ---- */
  const R2D = 180 / Math.PI, D2R = Math.PI / 180;
  const view = [0, 0, 11.8, 6.0];
  const mkFig = id => FIG(id, view, 1180, 600, [], { col: 1 });
  const GF = id => (...i) => ({ fig: id, items: i.flat(3) });
  const cpt = (O, r, deg) => [O[0] + r * Math.cos(deg * D2R), O[1] + r * Math.sin(deg * D2R)];   // 円周上の点（中心・半径・角度）
  const away = (p, O) => { const d = [p[0] - O[0], p[1] - O[1]], l = Math.hypot(d[0], d[1]); return [d[0] / l, d[1] / l]; };
  const dirOf = (V, P) => Math.atan2(P[1] - V[1], P[0] - V[0]) * R2D;
  const sweep = (V, P, Q2) => { let a1 = dirOf(V, P), a2 = dirOf(V, Q2); let d = ((a2 - a1) % 360 + 360) % 360; if (d > 180) { const t = a1; a1 = a2; a2 = t; d = 360 - d; } return [a1, a1 + d]; };
  const mark = (V, P, Q2, r, c, o) => { const s = sweep(V, P, Q2); return Object.assign({ k: 'ell', o: V, rx: r, ry: r, a1: s[0], a2: s[1], c, wd: 3.4, d: 0.3 }, o || {}); };
  const num = (V, P, Q2, r, text, c, o) => { const s = sweep(V, P, Q2), m = (s[0] + s[1]) / 2 * D2R; return Object.assign({ k: 'label', at: [V[0] + r * Math.cos(m), V[1] + r * Math.sin(m)], text, c, size: 27, d: 0.2 }, o || {}); };
  const lab = (x, y, text, c, o) => Object.assign({ k: 'label', at: [x, y], text, c: c || 'w', size: 28, d: 0.2 }, o || {});
  const ln = (a, b, c, o) => Object.assign({ k: 'seg', a, b, c: c || 'w', wd: 3.4, d: 0.6 }, o || {});
  const dot = (at, name, dir, c, o) => Object.assign({ k: 'pt', at, name, dir, off: 26, c: c || 'y', r: 6, d: 0.15 }, o || {});
  const dots = (list, c) => ({ k: 'pts', list, c: c || 'y', r: 6, d: 0.15 });
  const circ = (O, r, c, o) => Object.assign({ k: 'ell', o: O, rx: r, ry: r, c: c || 'w', wd: 3.4, d: 1.0 }, o || {});
  const arcO = (O, r, a1, a2, c, o) => Object.assign({ k: 'ell', o: O, rx: r, ry: r, a1, a2, c, wd: 5, d: 0.6 }, o || {});
  const tri = (pts, c, fill, o) => Object.assign({ k: 'poly', pts, close: true, c: c || 'w', wd: 3.2, d: 0.7 }, fill ? { fill, alpha: 0.16 } : {}, o || {});
  const rt = (v, p, q, c) => { const u = x => { const l = Math.hypot(x[0] - v[0], x[1] - v[1]); return [(x[0] - v[0]) / l, (x[1] - v[1]) / l]; }; return { k: 'right', at: v, u: u(p), v: u(q), s: 15, c: c || 'w', d: 0.2 }; };
  const tick = (a, b, n, c) => { const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, l = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / l, uy = (b[1] - a[1]) / l, h = 0.17, g = 0.13, out = []; for (let i = 0; i < n; i++) { const o = (i - (n - 1) / 2) * g, cx = mx + ux * o, cy = my + uy * o; out.push({ k: 'seg', a: [cx - uy * h, cy + ux * h], b: [cx + uy * h, cy - ux * h], c, wd: 3, d: 0.1 }); } return out; };
/* ==== ここまで共通の部品 ==== */
  const O = [5.9, 3.0], r = 2.25;
  const f1 = mkFig('f1'), f2 = mkFig('f2'), f3 = mkFig('f3'), f4 = mkFig('f4');
  const G1 = GF('f1'), G2 = GF('f2'), G3 = GF('f3'), G4 = GF('f4');
  const nm = (p, n, c) => dot(p, n, away(p, O), c || 'y');
  const hourAng = h => 90 - 30 * (h % 12);
  const H = h => cpt(O, r, hourAng(h));
  const clock = (names) => [circ(O, r, 'w'), dots(Array.from({ length: 12 }, (_, i) => H(i)), 'd'),
    Array.from({ length: 12 }, (_, i) => lab(...cpt(O, r - 0.42, hourAng(i)), String(i === 0 ? 12 : i), 'd', { size: 22 })), names];
  const P9 = H(9);
  const pname = dot(P9, 'P', [-1, 0], 'p');
  /* 図1 */
  const A1 = H(0), B1 = H(1);
  const fig1 = clock([nm(A1, 'A'), nm(B1, 'B'), pname]);
  const lines1 = [ln(P9, A1, 'p'), ln(P9, B1, 'p')];
  const arc1 = [arcO(O, r, hourAng(1), hourAng(0), 'g')];
  const ang1 = [mark(P9, A1, B1, 0.9, 'p'), num(P9, A1, B1, 1.4, '15°', 'p', { size: 25 })];
  const cen1 = [ln(O, A1, 'b'), ln(O, B1, 'b'), mark(O, A1, B1, 0.6, 'b'), num(O, A1, B1, 0.95, '30°', 'b', { size: 24 })];
  /* 図2 */
  const A2 = H(0), B2 = H(2), C2 = H(4), D2 = H(6);
  const fig2 = clock([nm(A2, 'A'), nm(B2, 'B'), nm(C2, 'C', 'b'), nm(D2, 'D', 'b'), pname]);
  const lines2 = [ln(P9, A2, 'p'), ln(P9, B2, 'p'), ln(P9, C2, 'b'), ln(P9, D2, 'b')];
  const arcs2 = [arcO(O, r, hourAng(2), hourAng(0), 'g'), arcO(O, r, hourAng(6), hourAng(4), 'g')];
  /* 図3 */
  const P3 = cpt(O, 2.4, 270), A3 = cpt(O, 2.4, 160), B3 = cpt(O, 2.4, 80), C3 = cpt(O, 2.4, 320);
  const fig3 = [circ(O, 2.4, 'w'), nm(A3, 'A'), nm(B3, 'B'), nm(C3, 'C'), nm(P3, 'P', 'p'), ln(P3, A3, 'p'), ln(P3, B3, 'p'), ln(P3, C3, 'p')];
  const arcs3 = [arcO(O, 2.4, 80, 160, 'g'), lab(4.35, 5.4, '弧AB', 'g', { size: 24 }), arcO(O, 2.4, 320 - 360, 80, 'y'), lab(8.95, 4.1, '弧BC', 'y', { size: 24 })];
  const ang3 = [mark(P3, A3, B3, 0.9, 'g'), num(P3, A3, B3, 1.35, 'x', 'g'), mark(P3, B3, C3, 1.3, 'y'), num(P3, B3, C3, 1.75, '60°', 'y', { size: 24 })];
  /* 図4 */
  const A4 = cpt(O, 2.4, 210), B4 = cpt(O, 2.4, 330), P4 = cpt(O, 2.4, 90);
  const fig4 = [circ(O, 2.4, 'w'), nm(A4, 'A'), nm(B4, 'B'), nm(P4, 'P', 'p'), dot(O, 'O', [0, 1], 'w', { off: 24, r: 4.5 }), ln(P4, A4, 'p'), ln(P4, B4, 'p'), ln(O, A4, 'b'),
    arcO(O, 2.4, 210, 330, 'g'), lab(5.9, 0.35, '弧AB＝4πcm', 'g', { size: 26 }), lab(5.2, 1.95, '6cm', 'b', { size: 24 }), mark(P4, A4, B4, 0.8, 'p'), num(P4, A4, B4, 1.3, 'x', 'p')];

  const tb1 = tbl([['弧（目もり）', '1', '2', '3', '4', '5', '6'], ['中心角', '30°', '60°', '90°', '120°', '150°', '180°'], ['円周角', '15°', '30°', '45°', '60°', '{{？}}', '{{？}}']], { style: 'font-size:30px; align-self:center; margin-top:20px', t: 1.0 });

  KL.lesson({ id: 'g3u6-04', unit: '中3　円', kick: '3年6章　第4時', title: '弧の長さと円周角の関係を調べよう', card: '弧の長さと円周角の関係を調べよう', sub: 'ホー先生とポンタと いっしょに ゆっくり解説', cols: [0.34, 0.66], steps: [
    T('みなさん、こんにちは。今日は、弧の長さと、円周角の大きさに、どんな関係があるかを、調べます。', { title: true, point: false, ft: 'happy' }),
    B('ぼく、時計は読めるよ！ 短い針が3にきたら、おやつの時間だよね！', { title: true, fb: 'happy', up: true }),
    T('よく知っていますね。その時計の文字盤を、円として、考えてみましょう。', { title: true, point: false, ft: 'sigh', fx: { t: 'sweat' } }),

    T('問題です。時計の文字盤のように、円周を12等分する点があります。9時の点Pから、12時の点Aと、1時の点Bを見ます。∠APBは、何度でしょう。', { part: '1目もりの弧', ft: 'normal',
      add: [memo('めあて', '弧の長さと\n円周角の関係', 'y'), note('∠APB＝？', '問題'), Object.assign(f1, { prims: [] })],
      draw: [G1(fig1, lines1)] }),
    T('弧ABは、円周の12分の1、1目もり分です。中心角は、360°÷12＝30°です。', { ft: 'normal', point: false, draw: [G1(arc1, cen1)] }),

    /* ---------- 問1 ---------- */
    Q('q1', T('問題です。弧ABに対する円周角∠APBは、何度でしょう。', { ft: 'normal' }),
      [{ t: '15°', ok: true }, { t: '30°' }, { t: '45°' }, { t: '60°' }],
      { 1: [B('弧が円周の12分の1だから、中心角と同じ、30°でしょ？', { fb: 'happy', up: true }), T('30°は、中心角の大きさです。円周角は、その半分なので、30°÷2＝15°です。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        2: [T('45°は、弧が3目もり分のときの、円周角です。1目もり分は、中心角30°の半分で、15°です。', { ft: 'normal' })],
        ok: [T('正解！ 円周角は、中心角30°の半分で、15°です。', { ft: 'happy', draw: [G1(ang1)] }), B('1目もりの弧は、15°なんだね！', { fb: 'star', up: true })],
        wrong: [T('60°では、ありません。円周角は、中心角30°の半分の、15°です。', { ft: 'normal', draw: [G1(ang1)] })] }),

    T('弧が、2目もり、3目もりと、長くなると、円周角は、どう変わるでしょう。表にして、調べます。', { clear: true, cols: [0.34, 0.66], part: '弧の長さと円周角', ft: 'normal',
      add: [memo('調べること', '弧が長くなると\n円周角は？', 'y'), tb1] }),

    /* ---------- 問2 ---------- */
    Q('q2', T('問題です。表で、弧が6目もり分、つまり半円のとき、円周角は何度でしょう。', { ft: 'normal' }),
      [{ t: '45°' }, { t: '60°' }, { t: '90°', ok: true }, { t: '180°' }],
      { 0: [T('45°は、3目もり分の円周角です。6目もり分は、1目もりの6倍で、15°×6＝90°です。', { ft: 'normal' })],
        3: [B('6目もりは、中心角が180°だから、円周角も、180°でしょ？', { fb: 'happy', up: true }), T('円周角は、中心角の半分です。180°の半分で、90°です。半円の弧に対する、円周角ですね。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        ok: [T('正解！ 15°×6＝90°。半円の弧に対する円周角と、同じ90°です。', { ft: 'happy', add: [note('6目もり　90°', '確かめ')] }), B('半円の直角と、つながったね！', { fb: 'star', up: true })],
        wrong: [T('60°は、4目もり分の円周角です。6目もり分は、15°×6＝90°です。', { ft: 'normal', add: [note('6目もり　90°', '確かめ')] })] }),

    T('表を見ると、弧が2倍、3倍になると、円周角も2倍、3倍になっています。円周角は、弧の長さに比例します。', { ft: 'normal', point: false,
      add: [memo('弧と円周角', '円周角は、弧の長さに\n比例する', 'p')] }),

    T('つぎは、弧の長さが、等しいときです。12時のA、2時のB、4時のC、6時のDをとります。弧ABと、弧CDは、どちらも2目もり分です。', { clear: true, cols: [0.34, 0.66], part: '等しい弧', ft: 'normal',
      add: [note('弧AB＝弧CD\n∠APB と ∠CPD を\n比べる', '問題'), Object.assign(f2, { prims: [] })],
      draw: [G2(fig2, lines2, arcs2)] }),

    /* ---------- 問3 ---------- */
    Q('q3', T('問題です。弧ABと弧CDが等しいとき、∠APBと∠CPDの大きさは、どうなるでしょう。', { ft: 'normal' }),
      [{ t: '比べられない' }, { t: '∠APBのほうが大きい' }, { t: '∠CPDのほうが大きい' }, { t: '2つは等しい', ok: true }],
      { 1: [B('Aは12時で、高いところにあるから、∠APBのほうが、大きいよ！', { fb: 'happy', up: true }), T('場所が高いか低いかは、関係ありません。弧の長さが同じなら、円周角も同じです。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        0: [T('比べられます。円周角は、弧の長さで決まります。弧が等しいので、円周角も等しくなります。', { ft: 'normal' })],
        ok: [T('正解！ 等しい弧に対する円周角は、等しくなります。どちらも30°です。', { ft: 'happy' }), B('弧が同じ長さなら、角も同じなんだね！', { fb: 'star', up: true })],
        wrong: [T('弧CDは、弧ABと同じ長さです。だから、∠CPDも、∠APBと同じ30°です。', { ft: 'normal' })] }),

    T('逆も言えます。円周角が等しければ、その弧の長さも、等しくなります。ここまでを、まとめます。', { ft: 'normal', point: false,
      add: [memo('弧と円周角', '等しい弧→円周角は等しい\n円周角が等しい→弧も等しい', 'y')] }),

    T('では、弧の長さの比から、角を求めます。弧ABと弧BCの長さの比は、2：3です。∠BPCは、60°です。', { clear: true, cols: [0.34, 0.66], part: '長さの比を使う', ft: 'normal',
      add: [note('弧AB：弧BC＝2：3\n∠BPC＝60°\n∠APB＝x', '問題'), Object.assign(f3, { prims: [] })],
      draw: [G3(fig3, arcs3, ang3)] }),

    /* ---------- 問4：比 ---------- */
    Q('q4', T('問題です。∠APBは、何度でしょう。円周角の比は、弧の長さの比と、同じです。', { ft: 'normal' }),
      [{ t: '40°', ok: true }, { t: '60°' }, { t: '90°' }, { t: '120°' }],
      { 1: [T('60°は、∠BPCの大きさです。弧ABは、弧BCより短いので、∠APBは、60°より小さくなります。', { ft: 'normal' })],
        2: [B('2：3だから、60°に、[[3/2]]をかけて、90°だよ！', { fb: 'confused', up: true }), T('比を逆にしています。∠APBは、60°より小さい角です。x：60＝2：3 だから、x＝40です。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        ok: [T('正解！ x：60＝2：3 より、3x＝120、x＝40。∠APBは40°です。', { ft: 'happy', add: [note('x：60＝2：3\n3x＝120　x＝40', '比例式')] }), B('比のとおりに、小さくなるんだね！', { fb: 'star', up: true })],
        wrong: [T('120°は、60°の2倍です。弧の比は2：3なので、∠APB＝60°×[[2/3]]＝40°です。', { ft: 'normal', add: [note('x：60＝2：3\n3x＝120　x＝40', '比例式')] })] }),

    T('最後は、弧の長さが、cmで、わかっている問題です。半径6cmの円で、弧ABの長さは、4πcmです。', { clear: true, cols: [0.34, 0.66], part: '弧の長さから角度へ', ft: 'normal',
      add: [note('半径6cm\n弧ABの長さ4πcm\n∠APB＝x', '問題'), Object.assign(f4, { prims: [] })],
      draw: [G4(fig4)] }),
    B('4πって、パイが4つ分？ ぼく、アップルパイがいいな！', { fb: 'star', up: true }),
    T('πは円周率で、食べるパイとは、別ものです。まず、円周の長さを求めます。2π×6＝12πcmです。', { ft: 'sigh', fx: { t: 'sweat' }, point: false,
      add: [note('円周＝2π×6＝12πcm', '円周')] }),

    /* ---------- 問5：弧の長さ→円周角 ---------- */
    Q('q5', T('最後の問題です。円周角∠APBは、何度でしょう。弧ABが、円周の何分の1かを、考えます。', { ft: 'happy' }),
      [{ t: '30°' }, { t: '60°', ok: true }, { t: '120°' }, { t: '240°' }],
      { 2: [B('弧は円周の[[1/3]]だから、中心角は120°。それが答えでしょ？', { fb: 'happy', up: true }), T('120°は、弧ABに対する中心角です。円周角は、その半分で、60°です。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        0: [T('30°は、円周角を、さらに半分にした数です。中心角120°の半分は、60°です。', { ft: 'normal' })],
        ok: [T('正解！ 4π÷12π＝[[1/3]]。中心角は360°×[[1/3]]＝120°、円周角は、その半分の60°です。', { ft: 'happy' }), B('弧の長さから、中心角、円周角と、順にわかったよ！', { fb: 'star', up: true })],
        wrong: [T('240°ではありません。弧は円周の[[1/3]]で、中心角120°、円周角は60°です。', { ft: 'normal' })] }),

    T('まとめます。1つの円で、円周角は、弧の長さに比例します。等しい弧に対する円周角は、等しくなります。', { clear: true, cols: [0.34, 0.66], part: 'まとめ', ft: 'normal', point: false,
      add: [memo('ポイント', '円周角は弧の長さに比例\n等しい弧→円周角は等しい\n円周角が等しい→弧も等しい', 'y')] }),
    B('時計の針が3時にきたら、円周角も考えながら、おやつを食べるよ！', { fb: 'happy', up: true, fx: { b: 'e' } }),
    T('お疲れさまでした。成績は、こちらです。', { ft: 'happy', point: false, result: true })
  ] });
})();
