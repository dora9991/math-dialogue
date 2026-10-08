/* 中3 6章 円　第6時「円の外の点から、接線を作図しよう」（活）。自作。円の性質の利用（接線の作図）。
   円 O(5.0,3.0) 半径2.16、P(8.6,3.0)（OP＝3.6）。OP の中点 M(6.8,3.0)、円Mの半径1.8。交点 T1(6.296,4.728)、T2(6.296,1.272)：
   ∠OT1P＝∠OT2P＝90°（半円の弧に対する円周角）→ PT1、PT2 は円Oの接線。垂直二等分線の作図：O、P を中心に半径2.8の弧 → U(6.8,5.145)、V(6.8,0.855)。 */
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
  const O = [5.0, 3.0], r = 2.16, P = [8.6, 3.0], M = [6.8, 3.0], rM = 1.8;
  const T1 = [O[0] + r * 0.6, O[1] + r * 0.8], T2 = [O[0] + r * 0.6, O[1] - r * 0.8];
  const hU = Math.sqrt(2.8 * 2.8 - 1.8 * 1.8), U = [6.8, 3.0 + hU], V = [6.8, 3.0 - hU];
  const f1 = mkFig('f1'), f2 = mkFig('f2'), f3 = mkFig('f3');
  const G1 = GF('f1'), G2 = GF('f2'), G3 = GF('f3');
  const basic = [circ(O, r, 'w'), dot(O, 'O', [-1, 0.2], 'w', { off: 24, r: 4.5 }), dot(P, 'P', [1, 0.5], 'p')];
  const opLine = [ln(O, P, 'd', { dash: true, wd: 3 })];
  const arcs = [arcO(O, 2.8, -62, 62, 'b', { wd: 2.6, d: 0.7 }), arcO(P, 2.8, 118, 242, 'b', { wd: 2.6, d: 0.7 }), dots([U, V], 'b'), ln(U, V, 'b', { wd: 3 })];
  const mpt = [dot(M, 'M', [0.3, -1], 'g')];
  const circM = [circ(M, rM, 'g', { wd: 3.2 })];
  const tpts = [dot(T1, 'T', [0, 1], 'y'), dot(T2, 'T′', [0, -1], 'y')];
  const tang = [ln(P, T1, 'y', { wd: 4 }), ln(P, T2, 'y', { wd: 4 })];
  const radii = [ln(O, T1, 'b', { wd: 3 }), ln(O, T2, 'b', { wd: 3 }), rt(T1, O, P, 'p'), rt(T2, O, P, 'p')];

  KL.lesson({ id: 'g3u6-06', unit: '中3　円', kick: '3年6章　第6時', title: '円の外の点から、接線を作図しよう', card: '円の外の点から、接線を作図しよう', sub: 'ホー先生とポンタと いっしょに ゆっくり解説', cols: [0.34, 0.66], steps: [
    T('みなさん、こんにちは。今日は、円の外の点から、円に接する直線を、作図します。', { title: true, point: false, ft: 'happy' }),
    B('接線って、セッセと引く線のこと？ ぼく、定規で、えいって、引いちゃうよ！', { title: true, fb: 'happy', up: true }),
    T('セッセと引く線では、ありませんよ。円に1点だけ触れる直線のことです。目分量ではなく、作図で、正確に引きましょう。', { title: true, point: false, ft: 'sigh', fx: { t: 'sweat' } }),

    T('問題です。円い池Oの外に、ベンチPがあります。Pを通って、池のふちに、ちょうど1点で触れる直線を、作図しましょう。', { part: '問題を読もう', ft: 'normal',
      add: [memo('めあて', '円の外の点Pから\n円Oの接線を作図', 'y'), Object.assign(f1, { prims: [] })],
      draw: [G1(basic, opLine)] }),
    T('円に触れる点を、接点Tとします。接線は、接点を通る半径に、垂直です。だから、OTと、PTは、垂直になります。', { ft: 'normal', point: false,
      add: [note('接線⊥半径\nOT⊥PT', '接線の性質')] }),

    /* ---------- 問1：接線と半径 ---------- */
    Q('q1', T('問題です。接点Tで、OTとPTがつくる角∠OTPは、何度でしょう。', { ft: 'normal' }),
      [{ t: '45°' }, { t: '60°' }, { t: '90°', ok: true }, { t: '180°' }],
      { 3: [B('接線は、一直線だから、180°でしょ？', { fb: 'happy', up: true }), T('一直線になるのは、PTだけです。OTとPTは、垂直に交わるので、∠OTPは90°です。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        0: [T('45°では、ありません。接線は、接点を通る半径と垂直に交わるので、∠OTPは90°です。', { ft: 'normal' })],
        ok: [T('正解！ 接線は、接点を通る半径に垂直なので、∠OTP＝90°です。', { ft: 'happy' }), B('接点では、直角になるんだね！', { fb: 'star', up: true })],
        wrong: [T('60°では、ありません。接線と半径は、垂直なので、∠OTP＝90°です。', { ft: 'normal' })] }),

    T('90°の角といえば、半円の弧に対する円周角でした。OPを直径とする円をかけば、その円周上の点からは、OPが90°に見えます。', { ft: 'normal', point: false }),

    T('そこで、次の手順で作図します。まず、OPの中点Mを、求めます。O、Pを中心に、同じ半径の円をかいて、交点を結びます。', { clear: true, cols: [0.34, 0.66], part: '作図の手順', ft: 'normal',
      add: [note('①OPの中点Mを求める', '手順'), Object.assign(f2, { prims: [] })],
      draw: [G2(basic, opLine, arcs)] }),

    /* ---------- 問2：中点 ---------- */
    Q('q2', T('問題です。OPの中点Mを求めるために、作図する線は、どれでしょう。', { ft: 'normal' }),
      [{ t: '∠OPTの二等分線' }, { t: 'OPの垂直二等分線', ok: true }, { t: 'OPに平行な直線' }, { t: 'Oを通る円の接線' }],
      { 0: [T('∠OPTは、まだ点Tがわからないので、かけません。中点は、OPの垂直二等分線と、OPの交点です。', { ft: 'normal' })],
        2: [B('平行な線を引けば、OPと、同じ長さに、なるでしょ？', { fb: 'happy', up: true }), T('平行な線は、OPの中点を、教えてくれません。中点は、垂直二等分線で、求めます。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        ok: [T('正解！ 垂直二等分線は、OPを、2等分する直線です。OPとの交点が、中点Mです。', { ft: 'happy', draw: [G2(mpt)] }), B('同じ半径の円で、まん中が見つかるんだね！', { fb: 'star', up: true })],
        wrong: [T('円の接線は、いま作図したい線です。中点は、OPの垂直二等分線で、求めます。', { ft: 'normal', draw: [G2(mpt)] })] }),

    T('つぎに、Mを中心に、MOを半径とする円を、かきます。MOとMPは、等しいので、この円は、Pも通ります。', { ft: 'normal', point: false, draw: [G2(circM)],
      add: [note('②Mを中心に\nMPを半径とする円', '手順')] }),

    /* ---------- 問3：半径 ---------- */
    Q('q3', T('問題です。Mを中心にかく円の、半径は、どれでしょう。OPが、直径になる円です。', { ft: 'normal' }),
      [{ t: 'OP' }, { t: '円Oの半径' }, { t: 'PT' }, { t: 'MP（MOと同じ）', ok: true }],
      { 0: [B('OPを半径にしたら、大きな円ができて、迫力があるよ！', { fb: 'happy', up: true }), T('OPを半径にすると、OPは、直径の半分です。OPが直径になる円の半径は、OPの半分、MPです。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        1: [T('円Oの半径では、OPを直径とする円に、なりません。半径は、OPの半分の、MPです。', { ft: 'normal' })],
        ok: [T('正解！ OPを直径とするには、半径をOPの半分、MP（＝MO）にします。', { ft: 'happy' }), B('直径の半分が、半径なんだね！', { fb: 'star', up: true })],
        wrong: [T('PTは、まだ作図していない線です。半径は、OPの半分の、MPです。', { ft: 'normal' })] }),

    T('この円と、円Oは、2点で交わります。交点を、T、T′とします。最後に、PとT、PとT′を、結びます。', { clear: true, cols: [0.34, 0.66], part: '接線をひく', ft: 'normal',
      add: [note('①OPの中点M\n②Mを中心にMPを半径とする円\n③交点T、T′とPを結ぶ', '手順'), Object.assign(f3, { prims: [] })],
      draw: [G3(basic, opLine, mpt, circM, tpts, tang)] }),

    /* ---------- 問4：90°の理由 ---------- */
    Q('q4', T('問題です。∠OTPが90°になる理由は、どれでしょう。', { ft: 'normal' }),
      [{ t: '半円の弧の円周角だから', ok: true }, { t: '対頂角は等しいから' }, { t: '内角の和は180°だから' }, { t: '同位角は等しいから' }],
      { 1: [T('対頂角は、交わる2直線の、向かい合う角です。ここでは、OPが円Mの直径で、Tが円M上にあるので、半円の弧の円周角です。', { ft: 'normal' })],
        2: [B('三角形OTPの内角の和が、180°だから、直角でしょ？', { fb: 'happy', up: true }), T('内角の和が180°でも、1つの角が90°とは、言えません。OPは円Mの直径なので、半円の弧の円周角で、90°です。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        ok: [T('正解！ OPは円Mの直径、Tは円M上の点です。半円の弧に対する円周角なので、∠OTP＝90°です。', { ft: 'happy', draw: [G3(radii)] }), B('半円の直角が、ここで、役に立つんだね！', { fb: 'star', up: true })],
        wrong: [T('同位角は、平行線の性質です。ここでは、半円の弧に対する円周角が、90°になる性質を、使います。', { ft: 'normal', draw: [G3(radii)] })] }),

    T('∠OTP＝90°なので、PTは、円Oの半径OTに垂直です。Tは円O上の点なので、PTは、円Oの接線です。T′についても、同じです。', { ft: 'normal', point: false }),

    /* ---------- 問5：本数 ---------- */
    Q('q5', T('最後の問題です。円の外の点Pから、円Oに引ける、接線は、何本でしょう。', { ft: 'happy' }),
      [{ t: '0本' }, { t: '1本' }, { t: '2本', ok: true }, { t: '3本' }],
      { 1: [B('Tだけで、1本じゃないの？ T′は、おまけでしょ？', { fb: 'confused', up: true }), T('おまけでは、ありません。円Mと円Oは、2点で交わるので、接点はTとT′の2つ。接線は、2本です。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        0: [T('0本は、点Pが、円の内側にあるときです。円の外の点からは、接線が、2本引けます。', { ft: 'normal' })],
        ok: [T('正解！ 交点がTとT′の2つあるので、接線は、2本引けます。', { ft: 'happy' }), B('池の右と左を、かすめる2本だね！', { fb: 'star', up: true })],
        wrong: [T('3本には、なりません。円Mと円Oの交点が2つなので、接線は、2本です。', { ft: 'normal' })] }),

    T('ちなみに、点Pが円周上なら、接線は1本です。円の内側なら、接線は、1本も引けません。', { ft: 'normal', point: false }),
    T('まとめます。円の外の点から接線を作図するには、OPを直径とする円をかいて、円Oとの交点を、求めます。', { clear: true, cols: [0.34, 0.66], part: 'まとめ', ft: 'normal', point: false,
      add: [memo('ポイント', 'OPの中点Mを求める\nOPを直径とする円をかく\n交点とPを結ぶ→接線2本', 'y'), memo('わけ', '半円の弧の円周角＝90°\n接線⊥半径', 'p')] }),
    B('ベンチから、池を2本の線ではさんで、ばっちり、決まったね！', { fb: 'happy', up: true, fx: { b: 'e' } }),
    T('お疲れさまでした。成績は、こちらです。', { ft: 'happy', point: false, result: true })
  ] });
})();
