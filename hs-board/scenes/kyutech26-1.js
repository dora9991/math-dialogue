/* 九工大型 数学：2026年度 九州工業大学 前期 第1問の類題（自作問題・元の問題ではない）
   問題：0<a<π、f_a(x)=sin(ax)/sin a（曲線 C_a は a によらず (0,0) と (1,1) を通る）
   答え（python3・sympy で検算ずみ）：
     (1) lim_{a→+0} f_a(x) = x
     (2) I(a) = (1−cos a)/(a sin a)　(3) lim I(a) = lim sin a/{a(1+cos a)} = 1/2
     (4) V(a) = π(2a − sin 2a)/(4a sin²a)
     (5) 0<a<1 で 4a³/3 − 4a⁵/15 ≦ 2a − sin 2a ≦ 4a³/3、a − a³/6 ≦ sin a < a
         → π(1/3 − a²/15) ≦ V(a) ≦ π/{3(1 − a²/6)²} → lim V(a) = π/3（a=0.05, 0.3, 0.8 で数値でも確認） */
(function () {
  const fa = a => `sin(${a}*x)/sin(${a})`;
  const AX = { k: 'axes', tx: [[1, '1']], ty: [[1, '1']] };
  const curves = (id, items, h) => ({ t: 'fig', id, col: 1, view: [-0.16, -0.22, 1.62, 1.86], w: 500, h: h || 470, items: [AX,
    { k: 'line', x: 1, c: 'd', wd: 1.5, dash: true },
    { k: 'fn', f: 'x', a: 0, b: 1.06, c: 'w', wd: 2.5, dash: true },
    { k: 'fn', f: fa(2.4), a: 0, b: 1, c: 'p', wd: 3 },
    { k: 'fn', f: fa(2), a: 0, b: 1, c: 'y', wd: 3 },
    { k: 'fn', f: fa(1), a: 0, b: 1, c: 'b', wd: 3 },
    { k: 'label', at: [1.1, 1.72], text: 'a = 2.4', c: 'p', size: 20, anchor: 'start' },
    { k: 'label', at: [1.1, 1.52], text: 'a = 2', c: 'y', size: 20, anchor: 'start' },
    { k: 'label', at: [1.1, 1.32], text: 'a = 1', c: 'b', size: 20, anchor: 'start' },
    { k: 'label', at: [1.1, 1.06], text: 'y = x', c: 'w', size: 20, anchor: 'start' },
    { k: 'pt', at: [1, 1], name: '(1, 1)', dir: 'se', size: 20 }].concat(items || []) });
  // 回転体（a = 2 の曲線を x 軸のまわりに回す）
  const solid = (id, items) => ({ t: 'fig', id, col: 1, view: [-0.2, -1.32, 1.4, 1.42], w: 440, h: 470, items: [
    { k: 'axes', tx: [[1, '1']], ty: [], yl: 'y' },
    { k: 'area', f: fa(2), a: 0, b: 1, c: 'y', alpha: 0.35 },
    { k: 'fn', f: fa(2), a: 0, b: 1, c: 'y', wd: 3, label: 'C', lat: [0.42, 1.18] },
    { k: 'fn', f: '-(' + fa(2) + ')', a: 0, b: 1, c: 'y', wd: 2, dash: true },
    { k: 'param', x: '1+0.16*cos(t)', y: 'sin(t)', a: 0, b: 2 * Math.PI, c: 'b', wd: 2.5 },
    { k: 'param', x: '0.6+0.16*cos(t)', y: (Math.sin(1.2) / Math.sin(2)).toFixed(4) + '*sin(t)', a: 0, b: 2 * Math.PI, c: 'b', wd: 2, dash: true },
    { k: 'label', at: [0.6, -1.12], text: '断面は円', c: 'b', size: 20, plain: true }].concat(items || []) });
  const POINTS = [
    '$a\\to+0$ の極限は、$\\dfrac{\\sin\\theta}{\\theta}\\to1$ の形を作るのが基本。$1-\\cos a$ は $1+\\cos a$ をかけて $\\sin^2a$ に直す',
    '回転体の体積は $\\pi\\displaystyle\\int y^2dx$。$\\sin^2ax=\\dfrac{1-\\cos2ax}{2}$（半角の公式）で次数を下げてから積分する',
    'はさみうちは「分母の次数（ここでは $a^3$）」まで正確な不等式を使う。上からの評価・下からの評価で、どちらの不等式を使うかを確かめる'
  ];

  HB.lesson({
    id: 'kyutech26-1', field: '九工大型　数学', title: '2026 九工大 第1問の類題 ― 両はしを固定した正弦曲線と回転体の体積の極限', level: '2026年度 九州工業大学 前期 第1問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '$0<a<\\pi$ とし、$f_a(x)=\\dfrac{\\sin ax}{\\sin a}$ とおく。曲線 $C_a:\\ y=f_a(x)\\ (0\\le x\\le1)$ は、$a$ の値によらず 2 点 $(0,\\,0)$，$(1,\\,1)$ を通る。',
      parts: [
        '(1)　$0<x\\le1$ をみたす $x$ を固定するとき、$\\displaystyle\\lim_{a\\to+0}f_a(x)$ を求めよ。',
        '(2)　$I(a)=\\displaystyle\\int_0^1f_a(x)\\,dx$ を求めよ。',
        '(3)　$\\displaystyle\\lim_{a\\to+0}I(a)$ を求めよ。',
        '(4)　$C_a$、$x$ 軸、直線 $x=1$ で囲まれた部分を $x$ 軸のまわりに 1 回転してできる立体の体積 $V(a)$ を求めよ。',
        '(5)　$x\\ge0$ のとき $x-\\dfrac{x^3}{6}\\le\\sin x\\le x-\\dfrac{x^3}{6}+\\dfrac{x^5}{120}$ が成り立つことを用いて、$\\displaystyle\\lim_{a\\to+0}V(a)$ を求めよ。'
      ],
      src: '※ 2026年度 九州工業大学 前期 第1問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: '問題', say: '数学Ⅲの極限と積分の問題です。パラメータ $a$ を 0 に近づけたとき、面積や体積がどうなるかを調べます。まず問題文を読みましょう（Q キーでいつでも見られます）。',
        add: [{ t: 'prob' }] },

      // ---------- 読みかえ ----------
      { clear: true, part: '読みかえ', say: 'まず $C_a$ をかいてみます。どの曲線も $(0,\\,0)$ と $(1,\\,1)$ を通り、$a$ を小さくすると、点線の直線 $y=x$ に近づいていくように見えます。',
        add: [{ t: 'h', text: '問題の読みかえ' },
          { t: 'p', size: 'sm', text: '・$C_a$ は両はしが $(0,\\,0)$，$(1,\\,1)$ に固定された「正弦曲線の一部」\n・(1)(3)(5) は、どれも $a\\to+0$ の極限' },
          curves('g1', [], 420)] },
      { ask: { type: 'choice', q: '$C_a$ が $y=x$ に近づくなら、(4) の立体は何に近づくと予想できる？（半径・高さはどれも 1）',
        opts: ['円柱（体積 $\\pi$）', '円すい（体積 $\\frac{\\pi}{3}$）', '半球（体積 $\\frac{2\\pi}{3}$）', '球（体積 $\\frac{4\\pi}{3}$）'], ok: 1,
        why: { 0: '$y=x$ の下は直角三角形。回すと円柱ではなく円すいです。', 2: '回すのは三角形なので、丸い立体にはなりません。', 3: '回すのは三角形なので、丸い立体にはなりません。' },
        good: '直角三角形を回すと円すい。(5) は $\\dfrac{\\pi}{3}$、(3) は三角形の面積 $\\dfrac12$ と予想できます。',
        add: [{ t: 'box', c: 'y', size: 'sm', label: '予想', text: '(3)：$I(a)\\to\\dfrac12$（三角形の面積）\n(5)：$V(a)\\to\\dfrac{\\pi}{3}$（円すいの体積）' }] } },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '(1) です。$a\\to+0$ のとき、分子 $\\sin ax$ も分母 $\\sin a$ も 0 に近づきます。$\\dfrac{\\sin\\theta}{\\theta}\\to1$ が使える形に分けましょう。',
        add: [{ t: 'h', text: '(1)　x を固定して a → +0' },
          { t: 'box', c: 'b', size: 'sm', label: '基本の極限', text: '$\\displaystyle\\lim_{\\theta\\to0}\\frac{\\sin\\theta}{\\theta}=1$' },
          { t: 'm', tex: 'f_a(x)=\\frac{\\sin ax}{ax}\\cdot\\frac{a}{\\sin a}\\cdot x', note: '$ax$ と $a$ で\n割ってかける' },
          curves('g2', [{ k: 'line', x: 0.6, c: 'g', wd: 2, dash: true }, { k: 'pt', at: [0.6, 0.6], c: 'g' }], 430)] },
      { ask: { type: 'choice', q: '$x$ を固定して $a\\to+0$ とすると、$f_a(x)$ はどうなる？',
        opts: ['$0$ に近づく', '$1$ に近づく', '$x$ に近づく', '$\\dfrac{1}{x}$ に近づく'], ok: 2,
        why: { 0: '分子だけを 0 にしています。分母 $\\sin a$ も 0 に近づくので、比を見ます。', 1: 'どちらも 0 に近づいても、比が 1 とは限りません。$\\sin ax\\approx ax$、$\\sin a\\approx a$ なので比は $x$ です。', 3: '$\\dfrac{a}{\\sin a}\\to1$ で、残るのは分子にある $x$ です。' },
        good: '$ax\\to0$ なので $\\dfrac{\\sin ax}{ax}\\to1$、また $\\dfrac{a}{\\sin a}\\to1$。だから $f_a(x)\\to x$。緑の縦線の上で、点が $(0.6,\\,0.6)$ に近づくようすです。',
        add: [{ t: 'ans', label: '(1) 答', tex: '\\lim_{a\\to+0}f_a(x)=1\\cdot1\\cdot x=x' }] } },

      // ---------- (2) ----------
      { clear: true, part: '(2)', say: '(2) です。$\\dfrac{1}{\\sin a}$ は $x$ をふくまない定数なので、積分の外に出します。残りは $\\sin ax$ の積分です。',
        add: [{ t: 'h', text: '(2)　I(a) を求める' },
          { t: 'm', tex: 'I(a)=\\frac{1}{\\sin a}\\int_0^1\\sin ax\\,dx' },
          curves('g3', [{ k: 'area', f: fa(2), a: 0, b: 1, c: 'y', alpha: 0.3 }, { k: 'label', at: [0.62, 0.42], text: 'I(2)', c: 'y', size: 22 }])] },
      { ask: { type: 'choice', q: '$\\displaystyle\\int_0^1\\sin ax\\,dx$ はどれ？',
        opts: ['$\\dfrac{1-\\cos a}{a}$', '$\\dfrac{\\cos a-1}{a}$', '$a(1-\\cos a)$', '$1-\\cos a$'], ok: 0,
        why: { 1: '$\\sin ax$ の原始関数は $-\\dfrac{\\cos ax}{a}$。マイナスを忘れています。', 2: '合成関数の積分では $a$ で「割る」。かけてはいけません。', 3: '$-\\dfrac{\\cos ax}{a}$ の $\\dfrac1a$ を忘れています。' },
        good: '$\\Big[-\\dfrac{\\cos ax}{a}\\Big]_0^1=\\dfrac{-\\cos a+1}{a}$。微分して $\\sin ax$ にもどるかで確かめられます。',
        add: [{ t: 'ans', label: '(2) 答', tex: 'I(a)=\\frac{1-\\cos a}{a\\sin a}' }] } },

      // ---------- (3) ----------
      { clear: true, cols: [0.6, 0.4], part: '(3)', say: '(3) です。$a\\to+0$ では分子 $1-\\cos a$ も分母 $a\\sin a$ も 0 に近づく、$\\dfrac00$ の形です。このままでは値が決まりません。',
        add: [{ t: 'h', text: '(3)　a → +0 のときの I(a)' },
          { t: 'm', tex: 'I(a)=\\frac{1-\\cos a}{a\\sin a}\\quad\\longrightarrow\\ \\frac{0}{0}\\ \\text{の形}' },
          { t: 'box', c: 'b', size: 'sm', label: '定石', text: '$1-\\cos a$ は、$1+\\cos a$ をかけると\n$(1-\\cos a)(1+\\cos a)=\\sin^2a$' }] },
      { ask: { type: 'think', q: '分母・分子に $1+\\cos a$ をかけて、$\\displaystyle\\lim_{a\\to+0}I(a)$ を求めよう。',
        hint: '分子は $\\sin^2a$。分母の $\\sin a$ と約分すると、$\\dfrac{\\sin a}{a}$ が出てくる。',
        ans: '$I(a)=\\dfrac{\\sin^2a}{a\\sin a(1+\\cos a)}=\\dfrac{\\sin a}{a}\\cdot\\dfrac{1}{1+\\cos a}\\to1\\cdot\\dfrac12=\\dfrac12$',
        after: '予想どおり、三角形の面積 $\\dfrac12$ になりました。予想と合うと安心して次へ進めます。',
        add: [{ t: 'm', size: 'sm', tex: 'I(a)=\\frac{\\sin^2a}{a\\sin a(1+\\cos a)}=\\frac{\\sin a}{a}\\cdot\\frac{1}{1+\\cos a}' },
          { t: 'ans', label: '(3) 答', tex: '\\lim_{a\\to+0}I(a)=1\\cdot\\frac{1}{1+1}=\\frac12' }] } },

      // ---------- (4) ----------
      { clear: true, cols: [0.56, 0.44], part: '(4)', say: '(4) です。$x$ 軸のまわりに回すと、$x$ での断面は半径 $f_a(x)$ の円。だから体積は $\\pi\\displaystyle\\int_0^1\\{f_a(x)\\}^2dx$ です。',
        add: [{ t: 'h', text: '(4)　回転体の体積 V(a)' },
          { t: 'm', tex: 'V(a)=\\pi\\int_0^1\\frac{\\sin^2ax}{\\sin^2a}\\,dx' },
          solid('s1')] },
      { ask: { type: 'choice', q: '$\\sin^2ax$ を、次数を下げた形に直すと？（半角の公式）',
        opts: ['$\\dfrac{1+\\cos2ax}{2}$', '$\\dfrac{1-\\cos ax}{2}$', '$1-\\cos^2ax$', '$\\dfrac{1-\\cos2ax}{2}$'], ok: 3,
        why: { 0: 'それは $\\cos^2ax$ の式。$\\sin^2$ はマイナスです。', 1: '角は 2 倍になります。$\\sin^2\\theta=\\dfrac{1-\\cos2\\theta}{2}$ で $\\theta=ax$。', 2: '正しい式ですが、$\\cos^2ax$ の積分がまた必要になり、次数が下がっていません。' },
        good: '$\\cos2\\theta=1-2\\sin^2\\theta$ から $\\sin^2\\theta=\\dfrac{1-\\cos2\\theta}{2}$。1 次の $\\cos$ なら、すぐ積分できます。',
        add: [{ t: 'm', size: 'sm', tex: '\\int_0^1\\sin^2ax\\,dx=\\int_0^1\\frac{1-\\cos2ax}{2}\\,dx' }] } },
      { say: '$\\cos2ax$ の原始関数は $\\dfrac{\\sin2ax}{2a}$（中が $2ax$ なので $2a$ で割る）。これで $\\sin^2ax$ の積分が出ます。',
        add: [{ t: 'm', size: 'sm', tex: '\\int_0^1\\sin^2ax\\,dx=\\Big[\\frac x2-\\frac{\\sin2ax}{4a}\\Big]_0^1=\\frac{2a-\\sin2a}{4a}' }] },
      { say: '$\\dfrac{\\pi}{\\sin^2a}$ をかけて (4) の答えです。分母・分子を (5) で使いやすい形にまとめておきます。',
        add: [{ t: 'ans', label: '(4) 答', tex: 'V(a)=\\frac{\\pi(2a-\\sin2a)}{4a\\sin^2a}' }] },

      // ---------- (5) 方針 ----------
      { clear: true, cols: [0.6, 0.4], part: '(5)', say: '(5) です。$a\\to+0$ では分子 $2a-\\sin2a$ も分母 $4a\\sin^2a$ も 0 に近づきます。分母は $a^3$ くらいの小ささなので、分子も $a^3$ の項まで正確に知る必要があります。',
        add: [{ t: 'h', text: '(5)　V(a) の極限（はさみうち）' },
          { t: 'm', tex: 'V(a)=\\frac{\\pi(2a-\\sin2a)}{4a\\sin^2a}', note: '分母 $\\approx4a^3$' },
          { t: 'box', c: 'b', size: 'sm', label: '使ってよい不等式（x ≧ 0）', text: '$x-\\dfrac{x^3}{6}\\le\\sin x\\le x-\\dfrac{x^3}{6}+\\dfrac{x^5}{120}$' }] },
      { ask: { type: 'choice', q: '分子 $2a-\\sin2a$ を **上から**（$\\le$ の形で）おさえるには、枠のどちらの不等式を $x=2a$ で使う？',
        opts: ['左の不等式', '右の不等式', '$\\sin x\\le1$', 'どちらでもよい'], ok: 0,
        why: { 1: '$-\\sin2a$ とマイナスがつくので、$\\sin2a$ の上からの評価は、分子の「下から」の評価になります。', 2: '$2a-\\sin2a\\ge2a-1$ の形になり、向きも逆で役に立ちません。', 3: '$-\\sin2a$ で向きが入れかわるので、使う不等式は決まります。' },
        good: '$\\sin2a\\ge2a-\\dfrac{(2a)^3}{6}$ から $2a-\\sin2a\\le\\dfrac43a^3$。下からは右の不等式です。',
        add: [{ t: 'm', size: 'sm', tex: '\\frac43a^3-\\frac{4}{15}a^5\\le2a-\\sin2a\\le\\frac43a^3', note: '右・左の不等式で\n$x=2a$' }] } },
      { say: '分母の $\\sin a$ もおさえます。$0<a<1$ で考えると、左の不等式から $\\sin a\\ge a-\\dfrac{a^3}{6}>0$。右の不等式からは $\\sin a<a$ も出ます（$\\dfrac{a^5}{120}<\\dfrac{a^3}{6}$ だから）。',
        add: [{ t: 'm', size: 'sm', tex: '0<a-\\frac{a^3}{6}\\le\\sin a<a\\quad(0<a<1)', note: '2 乗しても\n向きはそのまま' }] },

      // ---------- (5) 答案 ----------
      { clear: true, cols: [0.62, 0.38], part: '(5) 答案', say: '分子を小さく・分母を大きくすると $V(a)$ は小さくなり、逆にすると大きくなります。こうして、$V(a)$ を両側からはさみます。',
        add: [{ t: 'h', text: '(5)　答案：両側からはさむ' },
          { t: 'm', size: 'sm', tex: 'V(a)\\ge\\frac{\\pi\\left(\\frac43a^3-\\frac4{15}a^5\\right)}{4a\\cdot a^2}=\\pi\\Big(\\frac13-\\frac{a^2}{15}\\Big)' },
          { t: 'm', size: 'sm', tex: 'V(a)\\le\\frac{\\pi\\cdot\\frac43a^3}{4a\\left(a-\\frac{a^3}{6}\\right)^2}=\\frac{\\pi}{3\\left(1-\\frac{a^2}{6}\\right)^2}' }] },
      { ask: { type: 'choice', q: '$a\\to+0$ のとき、$V(a)$ の極限は？',
        opts: ['$\\dfrac{\\pi}{2}$', '$\\dfrac{2\\pi}{3}$', '$\\dfrac{\\pi}{12}$', '$\\dfrac{\\pi}{3}$'], ok: 3,
        why: { 0: '$\\pi\\int_0^1x\\,dx$ の値です。回転体は $y^2$ を積分するので、2 乗を忘れています。', 1: '$2a-\\sin2a\\approx\\dfrac{(2a)^3}{6}$ の $\\dfrac16$ を $\\dfrac13$ にしています。', 2: '分子の $(2a)^3=8a^3$ を $2a^3$ にしています。' },
        good: '両側とも $\\dfrac{\\pi}{3}$ に近づくので、はさみうちの原理から $\\dfrac{\\pi}{3}$。予想した円すいの体積と一致しました。',
        add: [{ t: 'ans', label: '(5) 答', text: '両側が $\\dfrac{\\pi}{3}$ に近づくので、はさみうちの原理より\n$\\displaystyle\\lim_{a\\to+0}V(a)=\\frac{\\pi}{3}$' }] } },
      { ask: { type: 'think', q: 'もし $\\sin x\\le x$ だけ（$x^5$ の項のない不等式）で分子を下からおさえると、どうなる？',
        hint: '$\\sin2a\\le2a$ から、$2a-\\sin2a\\ge$ いくつ？',
        ans: '$2a-\\sin2a\\ge0$ となり、$V(a)\\ge0$ しか言えない。下からの評価が $\\dfrac{\\pi}{3}$ に近づかず、はさめない',
        after: '分母が $a^3$ の小ささなので、分子の評価も $a^3$ の係数まで合っていないと使えません。これが「分母の次数が高い」ことの意味です。' } },

      // ---------- 答案のポイント ----------
      { clear: true, cols: [1], part: '答案のポイント', say: '記述の答案では、次の3つを書いておくと安心です。とくに不等式の向きと、$0<a<1$ と範囲をしぼったことは、採点で見られる所です。',
        add: [{ t: 'h', text: '採点されるポイント' },
          { t: 'box', c: 'y', size: 'sm', label: '範囲', text: '$a\\to+0$ を考えるので $0<a<1$ としてよい。このとき $a-\\dfrac{a^3}{6}>0$（2 乗してよい理由）' },
          { t: 'box', c: 'p', size: 'sm', label: '向き', text: '分子の下からの評価には右の不等式、上からの評価には左の不等式（$-\\sin2a$ で向きが入れかわる）' },
          { t: 'box', c: 'b', size: 'sm', label: '結論', text: '「両側が $\\dfrac{\\pi}{3}$ に近づくので、はさみうちの原理より」と言葉で書く。予想（円すい）とも合う' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。極限は「基本の形を作る」、積分は「次数を下げる」、はさみうちは「分母の次数まで正確に」がポイントでした。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、答案を自分でノートに書いてみましょう。' }
    ]
  });
})();
