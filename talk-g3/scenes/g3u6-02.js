/* 中3 6章 円　第2時「円周角が中心角の半分になるわけを説明しよう」（探）。自作。円周角の定理の証明。
   場合①（中心が辺PB上）：円 O(5.9,3.0) 半径2.4。P＝160°、B＝340°（PB は直径）、A＝60°。弧AB＝80° → ∠AOB＝80°、∠APB＝∠OPA＝∠OAP＝40°。△OAP：OA＝OP（半径）、外角 ∠AOB＝∠OPA＋∠OAP。
   場合②（中心が角の内側）：P＝270°、A＝140°、B＝20°、直径 PQ（Q＝90°）。∠APQ＝25°、∠QPB＝35°、∠APB＝60°。∠AOQ＝50°、∠QOB＝70°、∠AOB＝120°。 */
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
  const O = [5.9, 3.0], r = 2.4;
  const f1 = mkFig('f1'), f2 = mkFig('f2'), f3 = mkFig('f3');
  const G1 = GF('f1'), G2 = GF('f2'), G3 = GF('f3');
  const nm = (p, n, c) => dot(p, n, away(p, O), c || 'y');
  const cen = dot(O, 'O', [0, -1], 'w', { off: 24, r: 4.5 }), cen2 = dot(O, 'O', [-1, -0.3], 'w', { off: 24, r: 4.5 });
  /* 場合①：O が PB 上 */
  const P1 = cpt(O, r, 160), B1 = cpt(O, r, 340), A1 = cpt(O, r, 60);
  const fig1 = [circ(O, r, 'w'), nm(A1, 'A'), nm(B1, 'B'), nm(P1, 'P'), cen, ln(P1, B1, 'w'), ln(P1, A1, 'y'), ln(O, A1, 'y')];
  const tri1 = tri([O, A1, P1], 'y', 'y', { temp: true });
  const marks1 = [mark(P1, A1, B1, 0.9, 'p'), num(P1, A1, B1, 1.3, 'x', 'p'), mark(A1, O, P1, 0.7, 'p'), num(A1, O, P1, 1.1, 'x', 'p')];
  const ext1 = [mark(O, A1, B1, 0.6, 'g'), num(O, A1, B1, 1.0, '2x', 'g', { size: 28 })];
  /* 場合②：O が角の内側。直径 PQ */
  const P2 = cpt(O, r, 270), A2 = cpt(O, r, 140), B2 = cpt(O, r, 20), Q2 = cpt(O, r, 90);
  const fig2 = [circ(O, r, 'w'), nm(A2, 'A'), nm(B2, 'B'), nm(P2, 'P'), nm(Q2, 'Q', 'b'), cen2, ln(P2, A2, 'y'), ln(P2, B2, 'y')];
  const dia2 = [ln(P2, Q2, 'b'), ln(O, A2, 'g', { wd: 3 }), ln(O, B2, 'g', { wd: 3 })];
  const marks2 = [mark(P2, A2, Q2, 1.1, 'p'), mark(P2, Q2, B2, 1.1, 'b')];
  const nums2 = [num(P2, A2, Q2, 1.55, '25°', 'p', { size: 25 }), num(P2, Q2, B2, 1.55, '35°', 'b', { size: 25 })];
  const cmarks2 = [mark(O, A2, Q2, 0.6, 'p'), mark(O, Q2, B2, 0.6, 'b')];
  const cnums2 = [num(O, A2, Q2, 0.95, '50°', 'p', { size: 25 }), num(O, Q2, B2, 0.95, '70°', 'b', { size: 25 })];

  KL.lesson({ id: 'g3u6-02', unit: '中3　円', kick: '3年6章　第2時', title: '円周角が中心角の半分になるわけを説明しよう', card: '円周角が中心角の半分になるわけを説明しよう', sub: 'ホー先生とポンタと いっしょに ゆっくり解説', cols: [0.34, 0.66], steps: [
    T('みなさん、こんにちは。今日は、円周角が、中心角の半分になる理由を、説明します。', { title: true, point: false, ft: 'happy' }),
    B('半分になるなら、ぼくは、ピザを半分こにするよ！ 角も、ナイフで切れば、半分でしょ？', { title: true, fb: 'happy', up: true }),
    T('角は、ナイフでは切れませんよ。でも、言葉で順に説明すれば、どんな場合も、半分になると言えます。', { title: true, point: false, ft: 'sigh', fx: { t: 'sweat' } }),

    T('問題です。円Oの周上に、3点A、B、Pがあります。弧ABに対する円周角∠APBが、中心角∠AOBの半分になることを、説明します。', { part: '問題を読もう', ft: 'normal',
      add: [memo('めあて', '∠APB＝[[1/2]]∠AOB\nになるわけ', 'y'), note('場合①\n中心Oが、辺PB上', '考える場合'), Object.assign(f1, { prims: [] })],
      draw: [G1(fig1)] }),
    B('分度器で測ったら、40°と80°で、ちゃんと半分だったよ！ これで説明は、おしまい？', { fb: 'proud', up: true }),
    T('おしまいではありません。測ったのは、この図だけです。どんな円、どんな位置でも言えるように、理由を説明します。', { ft: 'sigh', fx: { t: 'sweat' }, point: false }),
    T('まず、△OAPに注目します。OAとOPは、どちらも円の半径です。', { ft: 'normal', point: false, draw: [G1(tri1)] }),

    /* ---------- 問1：OA＝OP ---------- */
    Q('q1', T('問題です。OA＝OPと言える理由は、どれでしょう。', { ft: 'normal' }),
      [{ t: '円の半径だから', ok: true }, { t: '二等辺三角形の底角だから' }, { t: '対頂角は等しいから' }, { t: '平行線の錯角は等しいから' }],
      { 1: [T('二等辺三角形の底角は、角の性質で、あとで使います。OA＝OPは長さの話で、円の半径だから、等しいのです。', { ft: 'normal' })],
        ok: [T('正解！ OAもOPも、中心Oから円周までの長さ、つまり半径です。', { ft: 'happy' }), B('中心から円周までは、どこも同じ長さなんだね！', { fb: 'star', up: true })],
        wrong: [T('対頂角も錯角も、角の性質です。OAとOPは長さなので、円の半径だから、等しいと言います。', { ft: 'normal' })] }),

    T('OA＝OPなので、△OAPは二等辺三角形です。二等辺三角形の底角は等しいので、∠OPA＝∠OAPです。この大きさを、xとおきます。', { clear: true, cols: [0.34, 0.66], part: '場合①の証明', ft: 'normal',
      add: [note('△OAPにおいて\nOA＝OP（半径）…①\n①より底角は等しい\n∠OPA＝∠OAP＝x …②', '証明'), Object.assign(f2, { prims: [] })],
      draw: [G2(fig1, marks1)] }),
    T('つぎに、中心角の∠AOBに注目します。PBは直径なので、点Oは、PB上にあります。∠AOBは、△OAPの外角です。', { ft: 'normal', point: false, draw: [G2(tri1)] }),

    /* ---------- 問2：外角 ---------- */
    Q('q2', T('問題です。△OAPの外角∠AOBは、どう表せるでしょう。', { ft: 'normal' }),
      [{ t: '∠OPA' }, { t: '∠OPA−∠OAP' }, { t: '180°−∠OPA' }, { t: '∠OPA＋∠OAP', ok: true }],
      { 2: [B('外角だから、180°から、ひくんでしょ？', { fb: 'happy', up: true }), T('180°から、2つの内角をひくと、残りの内角∠AOPになります。外角は、となり合わない2つの内角の和です。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        ok: [T('正解！ 三角形の外角は、それととなり合わない、2つの内角の和に、等しいです。', { ft: 'happy' }), B('外角の性質が、ここで、使えるんだね！', { fb: 'star', up: true })],
        wrong: [T('外角は、となり合わない2つの内角の、和です。∠OPAだけでも、差でもありません。', { ft: 'normal' })] }),

    T('∠OPA＝∠OAP＝xですから、∠AOB＝x＋x＝2xです。', { ft: 'normal', point: false, draw: [G2(ext1)],
      add: [note('∠AOBは△OAPの外角\n∠AOB＝∠OPA＋∠OAP\n　　　＝x＋x＝2x …③')] }),
    T('xは∠APBのことです。だから、∠AOB＝2∠APB。つまり、円周角∠APBは、中心角∠AOBの半分です。', { ft: 'normal', point: false,
      add: [note('②③より\n∠APB＝[[1/2]]∠AOB')] }),
    B('外角で、角が2つ分になったんだね！ 測らなくても、半分って、わかったよ！', { fb: 'star', up: true }),

    /* ---------- 場合② ---------- */
    T('つぎは、中心Oが、∠APBの内側にある場合です。このときは、Pから、Oを通る直径PQを引きます。', { clear: true, cols: [0.34, 0.66], part: '場合②：中心が角の内側', ft: 'normal',
      add: [note('場合②\n中心Oが、∠APBの内側', '考える場合'), Object.assign(f3, { prims: [] })],
      draw: [G3(fig2, dia2)] }),
    T('PQは直径で、Oを通ります。だから、さっきの場合①が、∠APQと∠BPQの、それぞれに使えます。', { ft: 'normal', point: false, draw: [G3(marks2, nums2)],
      add: [note('場合①より\n∠AOQ＝2∠APQ\n∠BOQ＝2∠BPQ', '使う')] }),

    /* ---------- 問3：足し算 ---------- */
    Q('q3', T('問題です。∠APQが25°、∠BPQが35°のとき、∠APBは何度でしょう。', { ft: 'normal' }),
      [{ t: '10°' }, { t: '35°' }, { t: '60°', ok: true }, { t: '120°' }],
      { 0: [B('大きいほうから、小さいほうを、ひいて、35−25で10°だよ！', { fb: 'happy', up: true }), T('直径PQは、∠APBの内側にあります。∠APBは、∠APQと∠BPQを、合わせた角なので、たし算です。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        3: [T('120°は、中心角∠AOBの大きさです。円周角∠APBは、25°＋35°＝60°です。', { ft: 'normal' })],
        ok: [T('正解！ ∠APB＝∠APQ＋∠BPQ＝25°＋35°＝60°です。', { ft: 'happy' }), B('2つの角を、合わせればいいんだね！', { fb: 'star', up: true })],
        wrong: [T('35°は、∠BPQだけの大きさです。∠APBは、25°と35°を合わせた、60°です。', { ft: 'normal' })] }),

    T('中心角も、同じように、足し算です。∠AOB＝∠AOQ＋∠QOB＝2×25°＋2×35°＝120°。円周角60°の、ちょうど2倍です。', { ft: 'normal', point: false, draw: [G3(cmarks2, cnums2)],
      add: [note('∠AOB＝∠AOQ＋∠QOB\n＝2×25°＋2×35°＝120°', '中心角')] }),
    T('文字で書くと、∠APQ＝x、∠BPQ＝yのとき、∠AOB＝2x＋2y＝2（x＋y）です。∠APB＝x＋yなので、やはり、∠AOB＝2∠APBです。', { ft: 'normal', point: false }),

    /* ---------- 問4：逆向きの利用 ---------- */
    Q('q4', T('問題です。弧ABに対する中心角が130°のとき、円周角は何度でしょう。', { ft: 'normal' }),
      [{ t: '50°' }, { t: '65°', ok: true }, { t: '130°' }, { t: '260°' }],
      { 0: [T('50°は、180°から130°をひいた数です。円周角は、中心角の半分なので、130°÷2＝65°です。', { ft: 'normal' })],
        2: [B('円周角も、中心角も、同じ弧の角だから、同じ130°でしょ？', { fb: 'happy', up: true }), T('同じ弧の角でも、円周角は、中心角の半分です。130°÷2＝65°です。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        3: [T('260°は、中心角を2倍にした数です。円周角は、中心角の半分なので、130°÷2＝65°です。', { ft: 'normal' })],
        ok: [T('正解！ 円周角は、中心角の半分。130°÷2＝65°です。', { ft: 'happy' }), B('中心角がわかれば、円周角もわかるね！', { fb: 'star', up: true })],
        wrong: [T('円周角＝中心角÷2です。130°÷2＝65°です。', { ft: 'normal' })] }),

    T('中心Oが、∠APBの外側にある場合も、直径PQを引いて、こんどは、ひき算で、同じことが言えます。', { clear: true, cols: [0.34, 0.66], part: 'まとめ', ft: 'normal', point: false }),
    T('まとめます。どの場合でも、円周角は、同じ弧に対する中心角の半分です。これを、円周角の定理といいます。', { ft: 'normal', point: false,
      add: [memo('円周角の定理', '円周角は、同じ弧に対する\n中心角の[[1/2]]', 'y'), memo('説明のコツ', '半径は等しい\n直径PQを引く\n場合に分ける', 'p')] }),
    B('ピザを切るより、角を考えるほうが、頭を使うね！ でも、切らなくても、半分って、わかったよ！', { fb: 'happy', up: true, fx: { b: 'e' } }),
    T('お疲れさまでした。成績は、こちらです。', { ft: 'happy', point: false, result: true })
  ] });
})();
