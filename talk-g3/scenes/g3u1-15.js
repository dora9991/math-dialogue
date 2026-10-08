/* 中3 1章 式の展開と因数分解　第15時「道の面積を、式を使って説明しよう」（活）。自作。
   長方形の畑（縦p・横q）のまわりに、はばaの道をぐるりとつける。道の面積 S、道のまん中を通る線の長さ L として S＝aL を示す。
   数値例：畑 縦20・横30・はば2 → 外側 24×34＝816、畑 600、S＝216；点線 22×32 → L＝2×（22＋32）＝108、a×L＝216。
   一般：S＝（p＋2a）（q＋2a）−pq＝2ap＋2aq＋4a²；L＝2（p＋a）＋2（q＋a）＝2p＋2q＋4a；aL＝2ap＋2aq＋4a²。
   図：view［0,0,11.8,5.4］＝1180×540（100px＝1）。畑 W×H＝5.4×3.6（縦：横＝2：3）、道のはば A＝0.45（わかりやすく少し太い略図）。 */
(function () {
  const { T, B, Q, FIG, lbl, rect, seg } = KL;
  // ---- 読み（say）を作る小さな道具（この台本の中だけで使う） ----
  // 字幕の {{ }} ** を取り、英字・記号・累乗を、かなまじりの読みに直す。ふつうの文は、そのまま。
  const LET = { a: 'エー', b: 'ビー', c: 'シー', d: 'ディー', e: 'イー', f: 'エフ', g: 'ジー', h: 'エイチ', k: 'ケー', l: 'エル', m: 'エム', n: 'エヌ', p: 'ピー', q: 'キュー', r: 'アール', s: 'エス', t: 'ティー', x: 'エックス', y: 'ワイ', z: 'ゼット' };
  const NUM = { '①': 'いち、', '②': 'に、', '③': 'さん、', '④': 'よん、' };
  const plain = s => String(s).replace(/\{\{|\}\}|\*\*/g, '');
  const yomi = s => {
    const u = plain(s).replace(/式の値/g, 'しきのあたい').replace(/和から積/g, 'わ、から、せき').replace(/積から和/g, 'せき、から、わ').replace(/(?<![面体])積/g, 'せき').replace(/和/g, 'わ')
      .replace(/\^([0-9]+)/g, 'の$1乗').replace(/²/g, 'の2乗').replace(/³/g, 'の3乗');
    let o = '', v = false;                       // v：直前が「数・文字・閉じかっこ」なら true（− を「ひく」と読む目印）
    for (let i = 0; i < u.length; i++) {
      const c = u[i];
      if (/[0-9]/.test(c)) { o += c; v = true; }
      else if (/[A-Za-z]/.test(c)) { o += LET[c.toLowerCase()]; v = true; }
      else if (c === '乗') { o += c; v = true; }
      else if (c === '−' || c === '-') { o += v ? 'ひく' : 'マイナス'; v = false; }
      else if (c === '＋' || c === '+') { o += v ? 'たす' : 'プラス'; v = false; }
      else if (c === '×') { o += 'かける'; v = false; }
      else if (c === '÷') { o += 'わる'; v = false; }
      else if (c === '＝' || c === '=') { o += 'イコール'; v = false; }
      else if (c === '（' || c === '(') { o += '、かっこ、'; v = false; }
      else if (c === '）' || c === ')') { o += '、かっことじ' + (/^の[0-9]+乗/.test(u.slice(i + 1, i + 6)) ? '' : '、'); v = true; }
      else if (c === '，') { o += '、'; v = false; }
      else if (c === '→') { o += '、'; v = false; }
      else if (NUM[c]) { o += NUM[c]; v = false; }
      else { o += c; v = false; }
    }
    return o.replace(/、{2,}/g, '、').replace(/^、/, '').replace(/、([。！？])/g, '$1').replace(/([。！？])(\s*)、/g, '$1$2').replace(/、$/, '');
  };
  const withSay = (s, o) => { if (o.say != null) return o; const y = yomi(s); return y === plain(s) ? o : Object.assign({}, o, { say: y }); };
  const t = (s, o = {}) => T(s, withSay(s, o));
  const b = (s, o = {}) => B(s, withSay(s, Object.assign({ up: true }, o)));
  // ---- 黒板の部品 ----
  const qbox = (label, text) => ({ col: 0, type: 'box', color: 'y', size: 'xs', label, text, t: 3.5 });
  const memo = (label, text) => ({ col: 0, type: 'text', size: 'xs', label, text, t: 4.0 });
  const bad = { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } };
  // ---- 図（畑と道） ----
  const A = 0.45, W = 5.4, H = 3.6, X0 = 2.75, Y0 = 0.45;            // 道のはば A、畑 W×H、外側の左下 (X0, Y0)
  const XI = X0 + A, YI = Y0 + A, XO = X0 + W + 2 * A, YO = Y0 + H + 2 * A;  // 畑の左下 (XI, YI)、外側の右上 (XO, YO)
  const fig = () => Object.assign(FIG('g', [0, 0, 11.8, 5.4], 1180, 540, [], { col: 1 }), { prims: [] });
  const G = (...i) => ({ fig: 'g', items: i.flat(3) });
  const RD = { c: 'y', wd: 2, fill: 'y', alpha: 0.38, d: 0.2 };
  const land = [rect(X0, Y0, XO, YI, RD), rect(X0, YI + H, XO, YO, RD), rect(X0, YI, XI, YI + H, RD), rect(XI + W, YI, XO, YI + H, RD),   // 道（4つの長方形）
    rect(XI, YI, XI + W, YI + H, { c: 'w', wd: 3, fill: 'g', alpha: 0.2, d: 0.3 }), rect(X0, Y0, XO, YO, { c: 'w', wd: 3, d: 0.3 })];       // 畑、外側の線
  const names = (p, q, a) => [lbl(XI + W / 2, YI + H / 2 + 0.2, '畑', { c: 'g', size: 40, d: 0.3 }), lbl(XI + 0.9, YI + H / 2 - 0.2, p, { c: 'w', size: 30, d: 0.3 }),
    lbl(XI + W / 2, YI + 0.4, q, { c: 'w', size: 30, d: 0.3 }), lbl(X0 - 0.15, YI + H / 2, a, { c: 'y', size: 28, anchor: 'end', d: 0.3 })];
  const LABN = names('縦 20m', '横 30m', 'はば 2m'), LABL = names('縦 p', '横 q', 'はば a');
  const D = { c: 'p', wd: 3.4, dash: true, d: 0.3 }, MX0 = X0 + A / 2, MY0 = Y0 + A / 2, MX1 = XO - A / 2, MY1 = YO - A / 2;
  const mid = [seg([MX0, MY0], [MX1, MY0], D), seg([MX1, MY0], [MX1, MY1], D), seg([MX1, MY1], [MX0, MY1], D), seg([MX0, MY1], [MX0, MY0], D), lbl(XO - 0.1, YO + 0.22, '点線の長さ L', { c: 'p', size: 28, anchor: 'end', d: 0.3 })];
  const CR = { c: 'p', wd: 2, fill: 'p', alpha: 0.55, d: 0.2 };
  const corners = [rect(X0, Y0, XI, YI, CR), rect(XI + W, Y0, XO, YI, CR), rect(X0, YI + H, XI, YO, CR), rect(XI + W, YI + H, XO, YO, CR)];

  KL.lesson({ id: 'g3u1-15', unit: '中3　式の展開と因数分解', kick: '3年1章　第15時', title: '道の面積を、式を使って説明しよう', card: '道の面積を、式を使って説明しよう', sub: 'ホー先生とポンタと いっしょに ゆっくり解説', cols: [0.34, 0.66], steps: [
    t('みなさん、こんにちは。今日は、畑のまわりの道の面積を、式を使って、説明します。', { title: true, point: false, ft: 'happy' }),
    b('ぼく、道草を食うのが、だいすき！ 道ばたの草って、おいしいよね！', { title: true, fb: 'happy' }),
    t('道草を食うは、寄り道をする、という意味です。今日は、道の面積の、お話です。', { title: true, point: false, ft: 'sigh', fx: { t: 'sweat' } }),

    t('問題です。縦20メートル、横30メートルの、長方形の畑の、まわりに、はば2メートルの道を、ぐるりと、つくります。道の面積を、考えましょう。', { part: '問題を読もう', ft: 'normal',
      add: [qbox('問題', '縦20m　横30m\n道のはば　2m\n道の面積は？'), fig()], draw: [G(land, LABN)] }),
    b('黄色い所が、道だね！ 外側の長方形から、畑をひけば、いいのかな？', { fb: 'think' }),

    /* ---------- Q1：外側−畑（正解は2番目） ---------- */
    Q('q1', t('そうです、ポンタ。その方法で、道の面積は、何平方メートルでしょう。', { ft: 'normal' }),
      [{ t: '200' }, { t: '216', ok: true }, { t: '600' }, { t: '816' }],
      { 0: [b('上と下の道が 30×2 を2つ、左と右の道が 20×2 を2つ。足して、200！', { fb: 'happy' }), t('四つの角の、2×2 の正方形が、ぬけています。2×2＝4 が4つで、16。200＋16＝216 です。', Object.assign({ draw: [G(corners)] }, bad))],
        3: [t('816 は、外側の長方形ぜんぶの面積です。中の畑の 600 を、ひく必要があります。816−600＝216 です。', { ft: 'normal' })],
        ok: [t('正解！ 外側は、24×34＝816。畑は、20×30＝600。ひいて、816−600＝216 平方メートルです。', { ft: 'happy' }), b('黄色い道が、216 平方メートルか！', { fb: 'star' })],
        wrong: [t('600 は、畑の面積です。道の面積は、外側の 816 から、畑の 600 を、ひいて、216 です。', { ft: 'normal' })] }),
    t('外側の縦は、20＋2＋2＝24、横は、30＋2＋2＝34 です。道は、畑の両側にあるので、はばを、2回、足します。', { ft: 'normal', point: false,
      add: [memo('道の面積', '外側　24×34＝816\n畑　　20×30＝600\n道　　816−600＝216')] }),

    /* ---------- Q2：まん中の点線の長さ（正解は3番目） ---------- */
    Q('q2', t('つぎに、道のまん中を通る、点線を考えます。点線の長さを L とします。L は、何メートルでしょう。', { clear: true, cols: [0.34, 0.66], part: '道のまん中の線', ft: 'normal',
      add: [qbox('問題', '点線の長さ L は\n何メートル？'), fig()], draw: [G(land, LABN, mid)] }),
      [{ t: '54' }, { t: '100' }, { t: '108', ok: true }, { t: '116' }],
      { 1: [b('畑のまわりの長さでしょ！ 2×（20＋30）で、100！', { fb: 'happy' }), t('点線は、道のまん中を通ります。畑より、ひとまわり大きく、縦は22、横は32です。', bad)],
        3: [t('116 は、道の外側を、一周した長さです。点線は、それより内側で、縦22、横32。2×（22＋32）＝108 です。', { ft: 'normal' })],
        ok: [t('正解！ 点線の長方形は、縦22、横32。一周は、2×（22＋32）＝108 メートルです。', { ft: 'happy' }), b('L は、108 メートルだね！', { fb: 'star' })],
        wrong: [t('54 は、縦と横の和で、半周の長さです。ぐるりと一周するので、2倍して、108 です。', { ft: 'normal' })] }),
    t('ここで、おもしろい発見です。道のはば2 と、L＝108 を、かけると、2×108＝216。道の面積と、同じです。', { ft: 'proud', point: false,
      add: [memo('はば×L', '2×108\n＝216')] }),
    b('ほんとだ！ ぐうぜんかな？ それとも、いつでも、そうなるのかな？', { fb: 'surprised' }),

    /* ---------- Q3：外側の面積を文字で（正解は1番目） ---------- */
    Q('q3', t('いつでも成り立つか、文字で確かめます。畑の縦を p、横を q、道のはばを a とします。外側の長方形の面積は、どれでしょう。', { clear: true, cols: [0.34, 0.66], part: '文字で表す', ft: 'normal',
      add: [qbox('文字で表す', 'p，q，a とおく'), fig()], draw: [G(land, LABL)] }),
      [{ t: '（p＋2a）（q＋2a）', ok: true }, { t: '（p＋a）（q＋a）' }, { t: 'pq＋4a²' }, { t: '（p＋2a）＋（q＋2a）' }],
      { 2: [b('外側は、畑の pq に、四つの角の a² を足して、pq＋4a²！', { fb: 'happy' }), t('道は、角だけでは ありません。上下左右にも あります。縦は p＋2a、横は q＋2a で、かけます。', bad)],
        1: [t('道は、畑の両側にあります。縦にも横にも、a が2回ずつ足されて、p＋2a、q＋2a です。', { ft: 'normal' })],
        ok: [t('正解！ 外側の縦は p＋2a、横は q＋2a です。面積は、（p＋2a）（q＋2a）です。', { ft: 'happy' }), b('数のときと、同じ考え方だね！', { fb: 'proud' })],
        wrong: [t('面積は、縦と横の、かけ算です。足し算では ありません。縦 p＋2a と、横 q＋2a を、かけます。', { ft: 'normal' })] }),

    /* ---------- Q4：S を展開（正解は4番目） ---------- */
    Q('q4', t('道の面積を S とします。S は、外側から畑 pq を、ひいて求めます。S を、展開して整理すると、どれでしょう。', { ft: 'normal',
      add: [memo('道の面積 S', '（p＋2a）（q＋2a）−pq')] }),
      [{ t: '4a²' }, { t: '2ap＋2aq＋2a²' }, { t: 'ap＋aq＋4a²' }, { t: '2ap＋2aq＋4a²', ok: true }],
      { 1: [b('2a×2a は、2a² でしょ！', { fb: 'happy' }), t('2a×2a は、2×2×a×a で、4a² です。係数どうしも、かけます。', bad)],
        2: [t('（p＋2a）（q＋2a）の、p×2a と 2a×q は、2ap と 2aq です。係数の2が、必要です。', { ft: 'normal' })],
        ok: [t('正解！ （p＋2a）（q＋2a）は、pq＋2ap＋2aq＋4a²。pq をひいて、2ap＋2aq＋4a² です。', { ft: 'happy' }), b('pq が、消えるんだね！', { fb: 'star' })],
        wrong: [t('4a² は、四つの角だけです。上下左右の道の分、2ap と 2aq も、あります。', { ft: 'normal' })] }),
    t('pq が消えて、2ap＋2aq＋4a² が、のこります。これが、道の面積 S です。', { ft: 'normal', point: false,
      add: [memo('展開', '＝pq＋2ap＋2aq＋4a²−pq\n＝2ap＋2aq＋4a²')] }),

    /* ---------- Q5：L を展開（正解は1番目） ---------- */
    Q('q5', t('つぎは、点線の長さ L です。点線は、縦が p＋a、横が q＋a の長方形です。L を、展開して整理すると、どれでしょう。', { clear: true, cols: [0.34, 0.66], part: '点線の長さ L', ft: 'happy',
      add: [qbox('点線の長さ L', '縦 p＋a　横 q＋a'), fig()], draw: [G(land, LABL, mid)] }),
      [{ t: '2p＋2q＋4a', ok: true }, { t: '2p＋2q＋2a' }, { t: '2p＋2q＋8a' }, { t: '2p＋2q' }],
      { 2: [b('道の外側を、ぐるっと回る長さでしょ！ 2p＋2q＋8a！', { fb: 'happy' }), t('点線は、道のまん中です。外側ではなく、縦 p＋a、横 q＋a の長方形です。', bad)],
        3: [t('2p＋2q は、畑のまわりの長さです。点線は、畑より、ひとまわり大きいので、a が足されます。', { ft: 'normal' })],
        ok: [t('正解！ L＝2（p＋a）＋2（q＋a）＝2p＋2q＋4a です。a が、4つ足されます。', { ft: 'happy' }), b('縦に2つ、横に2つで、4つだね！', { fb: 'star' })],
        wrong: [t('縦も横も、a が1つずつ足されて、p＋a、q＋a です。2倍すると、a は4つで、4a です。', { ft: 'normal' })] }),

    t('a×L を計算します。a（2p＋2q＋4a）は、2ap＋2aq＋4a² です。S と同じです。だから、道の面積 S は、はば a と、点線の長さ L の積に、等しいのです。', { clear: true, cols: [0.34, 0.66], part: '証明の完成', ft: 'proud', point: false,
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'ポイント', text: 'S＝aL\nはば×まん中の線', t: 5.0 }, memo('証明', 'S＝2ap＋2aq＋4a²\nL＝2p＋2q＋4a\naL＝a（2p＋2q＋4a）\n　＝2ap＋2aq＋4a²\nよって　S＝aL'), fig()], draw: [G(land, LABL, mid)] }),
    b('ぼくが道草を食べた面積も、これで計算できるね！ はばかける、長さ！', { fb: 'star', fx: { b: 'e' } }),
    t('お疲れさまでした。成績は、こちらです。', { ft: 'happy', point: false, result: true })
  ] });
})();
