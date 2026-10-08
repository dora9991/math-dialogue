/* 中3 6章 円　第3時「円周角の定理を使って、角の大きさを求めよう」（例）。自作。円周角の定理の利用・半円の弧。
   図1：円 O(5.9,3.0) 半径2.4。A＝215°、B＝325°（弧AB＝110°）、C＝80°、D＝165° → ∠ACB＝∠ADB＝55°、∠AOB＝110°。
   図2：AB が直径（A＝180°、B＝0°）、C＝76° → ∠CAB＝38°、∠ACB＝90°、∠ABC＝52°。
   図3：図2に D＝250°（AB の反対側）→ ∠ADB＝90°、∠CDB＝∠CAB＝38°、∠ADC＝90°−38°＝52°（＝∠ABC：同じ弧ACの円周角）。 */
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
    .replace(/(?<=[0-9度A-Za-z）)])−/g, 'ひく').replace(/−/g, 'マイナス').replace(/÷/g, 'わる').replace(/×/g, 'かける').replace(/＋/g, 'たす')
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
  const cen = dot(O, 'O', [0, 1], 'w', { off: 24, r: 4.5 });
  /* 図1 */
  const A1 = cpt(O, r, 215), B1 = cpt(O, r, 325), C1 = cpt(O, r, 80), D1 = cpt(O, r, 165);
  const fig1 = [circ(O, r, 'w'), nm(A1, 'A'), nm(B1, 'B'), nm(C1, 'C'), nm(D1, 'D', 'p'), ln(C1, A1, 'y'), ln(C1, B1, 'y')];
  const markC = [mark(C1, A1, B1, 0.9, 'y'), num(C1, A1, B1, 1.35, '55°', 'y')];
  const lineD = [ln(D1, A1, 'p'), ln(D1, B1, 'p')];
  const markD = [mark(D1, A1, B1, 0.7, 'p'), num(D1, A1, B1, 1.05, 'x', 'p')];
  const centre1 = [cen, ln(O, A1, 'b'), ln(O, B1, 'b'), mark(O, A1, B1, 0.6, 'b'), num(O, A1, B1, 1.0, 'y', 'b')];
  /* 図2 */
  const A2 = cpt(O, r, 180), B2 = cpt(O, r, 0), C2 = cpt(O, r, 76);
  const fig2 = [circ(O, r, 'w'), nm(A2, 'A'), nm(B2, 'B'), nm(C2, 'C'), cen, ln(A2, B2, 'w'), ln(A2, C2, 'y'), ln(B2, C2, 'y')];
  const mA2 = [mark(A2, B2, C2, 0.8, 'p'), num(A2, B2, C2, 1.25, '38°', 'p', { size: 25 })];
  const rC2 = [rt(C2, A2, B2, 'g'), num(C2, A2, B2, 1.2, '90°', 'g', { size: 25 })];
  const mB2 = [mark(B2, A2, C2, 0.8, 'b'), num(B2, A2, C2, 1.3, 'y', 'b')];
  const half2 = [arcO(O, r, 180, 360, 'g', { wd: 4.4 }), lab(3.4, 1.3, '半円の弧', 'g', { size: 24 })];
  /* 図3 */
  const D3 = cpt(O, r, 250);
  const lineD3 = [nm(D3, 'D', 'p'), ln(D3, A2, 'p'), ln(D3, B2, 'p'), ln(D3, C2, 'p', { wd: 3 })];
  const m3 = [rt(D3, A2, B2, 'g'), mark(D3, C2, B2, 1.3, 'p'), num(D3, C2, B2, 1.75, '38°', 'p', { size: 24 }), mark(D3, A2, C2, 1.7, 'y'), num(D3, A2, C2, 1.2, 'x', 'y')];

  KL.lesson({ id: 'g3u6-03', unit: '中3　円', kick: '3年6章　第3時', title: '円周角の定理を使って、角の大きさを求めよう', card: '円周角の定理を使って、角の大きさを求めよう', sub: 'ホー先生とポンタと いっしょに ゆっくり解説', cols: [0.34, 0.66], steps: [
    T('みなさん、こんにちは。今日は、円周角の定理を使って、いろいろな角の大きさを、求めます。', { title: true, point: false, ft: 'happy' }),
    B('ぼく、スイカを半分に切るのは、とくいだよ！ まん丸のスイカが、きれいな半円になるんだ！', { title: true, fb: 'happy', up: true }),
    T('半円も、今日の主役です。半円の弧に対する円周角には、おもしろい性質があります。まずは、前の時間の復習からです。', { title: true, point: false, ft: 'sigh', fx: { t: 'sweat' } }),

    T('問題です。円周上に、4点A、B、C、Dがあります。∠ACB＝55°のとき、∠ADBと、中心角∠AOBを求めます。', { part: '同じ弧の円周角', ft: 'normal',
      add: [memo('円周角の定理', '①同じ弧に対する円周角は\n　等しい\n②円周角＝中心角の[[1/2]]', 'y'), note('∠ACB＝55°\n∠ADB＝x\n∠AOB＝y', '問題'), Object.assign(f1, { prims: [] })],
      draw: [G1(fig1, markC)] }),
    B('Dは、Cとちがう場所だから、∠ADBは、∠ACBと、ちがう大きさだよ！', { fb: 'happy', up: true }),
    T('場所はちがいますが、見ている弧は、どちらも弧ABです。点Dから、AとBを結びます。', { ft: 'normal', point: false, draw: [G1(lineD)] }),

    /* ---------- 問1：同じ弧 ---------- */
    Q('q1', T('問題です。∠ADBは、何度でしょう。', { ft: 'normal' }),
      [{ t: '55°', ok: true }, { t: '90°' }, { t: '110°' }, { t: '125°' }],
      { 1: [T('90°は、半円の弧に対する円周角です。ここでは、弧ABは半円ではありません。同じ弧の円周角で、55°です。', { ft: 'normal' })],
        2: [B('円周角が55°なら、その2倍の、110°でしょ？', { fb: 'happy', up: true }), T('110°は、中心角の大きさです。∠ADBは円周角で、同じ弧の円周角は、等しいので、55°です。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        ok: [T('正解！ 弧ABに対する円周角は、どれも等しいので、∠ADB＝55°です。', { ft: 'happy', draw: [G1(markD)] }), B('Dが、どこにあっても、55°なんだね！', { fb: 'star', up: true })],
        wrong: [T('125°は、180°−55°の数です。同じ弧に対する円周角は、等しいので、∠ADB＝55°です。', { ft: 'normal', draw: [G1(markD)] })] }),

    T('つぎは、中心角です。中心Oと、A、Bを結びます。円周角は、中心角の半分なので、中心角は、円周角の2倍です。', { ft: 'normal', point: false, draw: [G1(centre1)] }),

    /* ---------- 問2：中心角 ---------- */
    Q('q2', T('問題です。中心角∠AOBは、何度でしょう。', { ft: 'normal' }),
      [{ t: '55°' }, { t: '90°' }, { t: '110°', ok: true }, { t: '125°' }],
      { 0: [T('55°は、円周角の大きさです。中心角は、円周角の2倍なので、55°×2＝110°です。', { ft: 'normal' })],
        3: [B('円周上の角と、中心の角を、合わせて、180°でしょ？', { fb: 'happy', up: true }), T('合わせて180°には、なりません。中心角は、円周角の2倍で、55°×2＝110°です。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        ok: [T('正解！ 円周角の2倍。55°×2＝110°です。', { ft: 'happy' }), B('2倍にするだけなんだね！', { fb: 'star', up: true })],
        wrong: [T('90°ではありません。中心角は、円周角55°の2倍で、110°です。', { ft: 'normal' })] }),

    T('つぎは、ABが円の直径のときです。直径ABで分けた弧は、半円です。', { clear: true, cols: [0.34, 0.66], part: '半円の弧', ft: 'normal',
      add: [memo('半円の弧', '直径ABに対する弧は\n半円', 'y'), Object.assign(f2, { prims: [] })],
      draw: [G2(fig2, half2)] }),
    T('半円の弧に対する中心角は、一直線の180°です。円周角は、その半分なので、何度になるでしょう。', { ft: 'normal', point: false }),

    /* ---------- 問3：半円の弧 ---------- */
    Q('q3', T('問題です。半円の弧に対する円周角∠ACBは、何度でしょう。', { ft: 'normal' }),
      [{ t: '45°' }, { t: '90°', ok: true }, { t: '135°' }, { t: '180°' }],
      { 3: [B('中心角が180°だから、円周角も、180°でしょ？', { fb: 'happy', up: true }), T('円周角は、中心角の半分です。180°÷2＝90°です。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        0: [T('45°は、90°の半分です。半分にするのは、180°のほうで、180°÷2＝90°です。', { ft: 'normal' })],
        ok: [T('正解！ 180°÷2＝90°。半円の弧に対する円周角は、直角です。', { ft: 'happy', draw: [G2(rC2)] }), B('スイカの半円は、角が直角なんだね！', { fb: 'star', up: true })],
        wrong: [T('135°ではありません。中心角180°の半分で、90°です。', { ft: 'normal', draw: [G2(rC2)] })] }),

    T('これを、半円の弧に対する円周角は90°、といいます。直径の両はしと、円周上のどの点を結んでも、直角になります。', { ft: 'normal', point: false,
      add: [memo('半円の弧', '半円の弧に対する円周角は\n90°', 'p')] }),
    T('では、使ってみます。ABが直径で、∠CAB＝38°のとき、∠ABCを求めます。', { ft: 'normal', point: false, draw: [G2(mA2, mB2)],
      add: [note('∠CAB＝38°\n∠ABC＝y', '問題')] }),

    /* ---------- 問4：半円＋内角の和 ---------- */
    Q('q4', T('問題です。∠ABCは、何度でしょう。△ABCの内角の和を、使います。', { ft: 'normal' }),
      [{ t: '38°' }, { t: '52°', ok: true }, { t: '90°' }, { t: '142°' }],
      { 0: [B('△ABCは、二等辺三角形みたいだから、∠ABCも、38°でしょ？', { fb: 'happy', up: true }), T('二等辺三角形とは、かぎりません。∠ACB＝90°なので、∠ABC＝180°−90°−38°＝52°です。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        3: [T('142°は、180°−38°の数です。∠ACBの90°も、ひきます。180°−90°−38°＝52°です。', { ft: 'normal' })],
        ok: [T('正解！ ∠ACB＝90°なので、∠ABC＝180°−90°−38°＝52°です。', { ft: 'happy' }), B('直角が、かくれていたんだね！', { fb: 'star', up: true })],
        wrong: [T('90°は、∠ACBの大きさです。∠ABCは、180°−90°−38°＝52°です。', { ft: 'normal' })] }),

    T('最後に、ABの反対側の円周上に、点Dをとります。∠CDBは、弧CBに対する円周角なので、∠CABと同じ、38°です。', { clear: true, cols: [0.34, 0.66], part: 'つなげて考えよう', ft: 'normal',
      add: [memo('わかっていること', '∠CAB＝38°\nABは直径', 'y'), note('∠ADC＝x', '問題'), Object.assign(f3, { prims: [] })],
      draw: [G3(fig2, mA2, lineD3)] }),
    B('DからもBからも、直角がつくれるのかな？ 直角がいっぱいで、目が回るよ！', { fb: 'confused', up: true }),

    /* ---------- 問5：総合 ---------- */
    Q('q5', T('最後の問題です。ABは直径です。∠ADCは、何度でしょう。', { ft: 'happy' }),
      [{ t: '52°', ok: true }, { t: '90°' }, { t: '128°' }, { t: '142°' }],
      { 1: [T('90°は、∠ADBの大きさです。∠ADCは、∠ADBの一部で、∠CDBの38°を、ひいた残りの、52°です。', { ft: 'normal', draw: [G3(m3)] })],
        2: [B('∠ADCは、180°から、52°をひいて、128°だよ！', { fb: 'happy', up: true }), T('180°をひく理由は、ありません。∠ADCは、∠ADB＝90°から、∠CDB＝38°を、ひいた角で、52°です。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' }, draw: [G3(m3)] })],
        ok: [T('正解！ ∠ADB＝90°、∠CDB＝38°なので、∠ADC＝90°−38°＝52°です。', { ft: 'happy', draw: [G3(m3)] }), B('半円の直角から、ひき算で、求まったよ！', { fb: 'star', up: true })],
        wrong: [T('142°は、180°−38°の数です。∠ADC＝∠ADB−∠CDB＝90°−38°＝52°です。', { ft: 'normal', draw: [G3(m3)] })] }),

    T('確かめます。∠ADCは、弧ACに対する円周角です。∠ABCも、同じ弧ACの円周角で、52°でした。2つの答えが、一致しました。', { ft: 'normal', point: false }),
    T('まとめます。角を求めるときは、同じ弧の円周角、中心角の半分、半円の弧の90°を、使い分けます。', { clear: true, cols: [0.34, 0.66], part: 'まとめ', ft: 'normal', point: false,
      add: [memo('ポイント', '同じ弧→円周角は等しい\n中心角の[[1/2]]が円周角\n半円の弧→円周角は90°', 'y')] }),
    B('スイカを半分に切ったら、直角が見つかったよ！ おいしい数学だね！', { fb: 'happy', up: true, fx: { b: 'e' } }),
    T('お疲れさまでした。成績は、こちらです。', { ft: 'happy', point: false, result: true })
  ] });
})();
