/* 数学Ⅲ 第2章 微分法 ①：微分可能性と積・商の導関数
   例はすべて自作。導関数・誤答・極限は python3（sympy）で検算ずみ。 */
(function () {
  const POINTS = [
    '$x=a$ で **微分可能なら連続**。逆は成り立たない（$y=|x|$ は $x=0$ で連続だが、右と左の傾きが $1$ と $-1$ で微分可能でない）',
    "積の導関数　$\\{f(x)g(x)\\}'=f'(x)g(x)+f(x)g'(x)$（**2つの項の和**。$f'g'$ ではない）",
    "商の導関数　$\\left\\{\\dfrac{f(x)}{g(x)}\\right\\}'=\\dfrac{f'(x)g(x)-f(x)g'(x)}{\\{g(x)\\}^2}$、$\\left\\{\\dfrac{1}{g(x)}\\right\\}'=-\\dfrac{g'(x)}{\\{g(x)\\}^2}$"
  ];
  // y=|x| と y=x|x| のグラフ（縦横の目もりを同じに）
  const absFig = (id, items) => ({ t: 'fig', id, col: 1, view: [-2.6, -1.4, 2.6, 2.8], w: 500, h: 404, items: [
    { k: 'axes', tx: [-2, -1, 1, 2], ty: [1, 2] }].concat(items || []) });
  const ABS = [{ k: 'fn', f: 'x', a: 0, b: 2.6, c: 'y', label: 'y=|x|', lat: [1.45, 2.45], la: 'end' }, { k: 'fn', f: '-x', a: -2.6, b: 0, c: 'b' }];

  HB.lesson({
    id: 'm3b-01', field: '数学Ⅲ　微分法', title: '微分可能性と積・商の導関数', level: '導関数', time: '目安 7分',
    problem: { label: '例題', lead: '次の問いに答えよ。',
      parts: ['(1)　$f(x)=|x|$ は $x=0$ で連続か。微分可能か', '(2)　$y=(2x^2-1)(x^3+4)$ を微分せよ', '(3)　$y=\\dfrac{1}{x^2+2}$ を微分せよ', '(4)　$y=\\dfrac{2x-1}{x+3}$ を微分せよ', '(5)　$y=\\dfrac{x+4}{x^2+1}$ を微分せよ', '(6)　$f(x)=x|x|$ は $x=0$ で微分可能か'] },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: 'めあて', say: '数学Ⅱでは、整式の関数を微分しました。第1章で極限と連続を学んだので、ここから **いろいろな関数の微分** に進みます。まず「微分可能」の意味と、積・商の微分です。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '**微分可能** と **連続** の関係がわかる\n**積・商の導関数** の公式を使って微分できる' }] },

      // ---------- 微分可能 ----------
      { clear: true, part: '微分可能', say: "極限 $\\displaystyle\\lim_{h\\to0}\\frac{f(a+h)-f(a)}{h}$ が **ある値に収束する** とき、$f(x)$ は $x=a$ で **微分可能** といいます。その値が微分係数 $f'(a)$ です。",
        add: [{ t: 'h', text: '微分可能とは' },
          { t: 'box', c: 'y', label: '定義', text: "$\\displaystyle f'(a)=\\lim_{h\\to0}\\frac{f(a+h)-f(a)}{h}$ が存在する\n→ $x=a$ で **微分可能**" },
          { t: 'p', size: 'sm', text: 'ある区間のすべての $x$ で微分可能なとき、その区間で微分可能という' }] },
      { say: "微分可能なら、$f(a+h)-f(a)$ を「$\\dfrac{f(a+h)-f(a)}{h}\\times h$」と見ます。$h\\to0$ で $f'(a)\\times0=0$ になるので、$f(x)$ は $x=a$ で **連続** です。",
        add: [{ t: 'm', size: 'sm', tex: "\\begin{aligned}\\lim_{h\\to0}\\{f(a+h)-f(a)\\}&=\\lim_{h\\to0}\\frac{f(a+h)-f(a)}{h}\\cdot h\\\\ &=f'(a)\\cdot0=0\\end{aligned}" },
          { t: 'box', c: 'p', label: '性質', text: '$x=a$ で微分可能　⇒　$x=a$ で連続' }] },

      // ---------- |x| ----------
      { clear: true, part: '逆は？', say: '逆はどうでしょう。$f(x)=|x|$ は、$x=0$ でグラフがつながっているので連続です。$h$ を右（$h>0$）と左（$h<0$）から $0$ に近づけてみます。',
        add: [{ t: 'h', text: '$f(x)=|x|$ の $x=0$' },
          { t: 'm', tex: '\\lim_{h\\to+0}\\frac{|h|-0}{h}=\\lim_{h\\to+0}\\frac{h}{h}=\\hy{1}' },
          { t: 'm', tex: '\\lim_{h\\to-0}\\frac{|h|-0}{h}=\\lim_{h\\to-0}\\frac{-h}{h}=\\hb{-1}' },
          absFig('fa', ABS.concat([
            { k: 'label', at: [1.75, 0.95], text: '傾き 1', c: 'y', size: 22 },
            { k: 'label', at: [-1.75, 0.95], text: '傾き −1', c: 'b', size: 22 },
            { k: 'pt', at: [0, 0], c: 'p' }]))] },
      { ask: { type: 'choice', q: '$f(x)=|x|$ は、$x=0$ でどうなっている？',
        opts: ['微分可能で、連続', '微分可能だが、連続でない', '連続だが、微分可能でない', '連続でも、微分可能でもない'], ok: 2,
        why: { 0: '右からの極限 $1$ と左からの極限 $-1$ が一致しないので、極限は存在しません。', 1: '微分可能なら必ず連続です（さっき示しました）。', 3: '$\\displaystyle\\lim_{x\\to0}|x|=0=f(0)$ なので、連続です。' },
        good: '連続ですが、グラフが $x=0$ で折れていて、1つの接線が決まりません。微分可能でない例です。',
        add: [{ t: 'box', c: 'b', size: 'sm', label: '逆は成り立たない', text: '$|x|$ は $x=0$ で **連続だが微分可能でない**' }] } },
      { ask: { type: 'think', q: '$f(x)=x|x|$ は、$x=0$ で微分可能だろうか。',
        hint: '$\\dfrac{f(0+h)-f(0)}{h}=\\dfrac{h|h|}{h}$ を約分して、$h\\to0$ とします。',
        ans: '$\\displaystyle\\lim_{h\\to0}\\frac{h|h|}{h}=\\lim_{h\\to0}|h|=0$。極限があるので **微分可能** で、$f\'(0)=0$',
        after: '$x\\ge0$ では $x^2$、$x<0$ では $-x^2$。$|x|$ の「角」が、$x$ をかけるとなめらかになります。',
        add: [],
        draw: [{ fig: 'fa', items: [{ k: 'fn', f: 'x*abs(x)', a: -1.65, b: 1.65, c: 'g', label: 'y=x|x|', lat: [-1.6, -1.15], la: 'end' }] }] } },

      // ---------- 積 ----------
      { clear: true, part: '積の導関数', say: '$f(x)g(x)$ の増え方を、2つに分けて考えます。真ん中に $f(x)g(x+h)$ を引いて足すのがコツです。',
        add: [{ t: 'h', text: '積の導関数' },
          { t: 'm', size: 'sm', tex: '\\begin{aligned}&f(x+h)g(x+h)-f(x)g(x)\\\\ &=\\hy{\\{f(x+h)-f(x)\\}}g(x+h)+f(x)\\hb{\\{g(x+h)-g(x)\\}}\\end{aligned}' }] },
      { say: "$h$ で割って $h\\to0$ とします。$g(x)$ は微分可能なので連続、つまり $g(x+h)\\to g(x)$。ここで、さっきの性質が使われます。",
        add: [{ t: 'box', c: 'y', label: '積の導関数', text: "$\\{f(x)g(x)\\}'=\\hy{f'(x)}g(x)+f(x)\\hb{g'(x)}$" },
          { t: 'm', size: 'sm', tex: "\\begin{aligned}&\\{(2x^2-1)(x^3+4)\\}'\\\\ &=4x(x^3+4)+(2x^2-1)\\cdot3x^2\\\\ &=10x^4-3x^2+16x\\end{aligned}", note: '展開して微分\nしても同じ' }] },
      { ask: { type: 'choice', q: '$y=(x^2+3)(4x-1)$ を、積の導関数の公式で微分すると？',
        opts: ['$8x$', '$12x^2-2x+12$', '$8x^2-2x$', '$12x^2+2x+12$'], ok: 1,
        why: { 0: "$\\{f(x)g(x)\\}'=f'(x)g'(x)$ ではありません。$2x\\times4$ だけでは足りません。", 2: '$f(x)g\'(x)=(x^2+3)\\cdot4$ の項を足し忘れています。', 3: '$2x(4x-1)=8x^2-2x$。$-1$ をかけた符号に注意。' },
        good: '$2x(4x-1)+(x^2+3)\\cdot4=8x^2-2x+4x^2+12=12x^2-2x+12$。',
        add: [{ t: 'm', col: 1, size: 'sm', tex: "y'=2x(4x-1)+(x^2+3)\\cdot4" }, { t: 'm', col: 1, size: 'sm', tex: '=12x^2-2x+12' }] } },

      // ---------- 商 ----------
      { clear: true, part: '商の導関数', say: "まず $\\dfrac{1}{g(x)}$ から。通分すると、分子に $g(x+h)-g(x)$ が出てきます。$h\\to0$ で、$g'(x)$ と $\\{g(x)\\}^2$ が残ります。",
        add: [{ t: 'h', text: '商の導関数' },
          { t: 'm', size: 'sm', tex: '\\frac1h\\left\\{\\frac{1}{g(x+h)}-\\frac{1}{g(x)}\\right\\}=-\\frac{g(x+h)-g(x)}{h}\\cdot\\frac{1}{g(x+h)g(x)}' },
          { t: 'box', c: 'y', label: '公式', text: "$\\left\\{\\dfrac{1}{g(x)}\\right\\}'=-\\dfrac{g'(x)}{\\{g(x)\\}^2}$" }] },
      { say: "$\\dfrac{f(x)}{g(x)}=f(x)\\cdot\\dfrac{1}{g(x)}$ と見て積の公式を使い、通分すると、商の公式になります。分子の **ひく順** に注意します。",
        add: [{ t: 'box', c: 'p', label: '公式', text: "$\\left\\{\\dfrac{f(x)}{g(x)}\\right\\}'=\\dfrac{f'(x)g(x)-f(x)g'(x)}{\\{g(x)\\}^2}$" },
          { t: 'p', size: 'sm', text: '分子は「**分子の微分×分母**」から「分子×分母の微分」をひく\n分母は **2乗** する' }] },
      { say: '例で確かめます。$\\dfrac{1}{x^2+2}$ は上の公式、$\\dfrac{2x-1}{x+3}$ は商の公式です。分子の $2x$ どうしが消えます。',
        add: [{ t: 'm', col: 1, size: 'sm', tex: "\\left(\\frac{1}{x^2+2}\\right)'=-\\frac{2x}{(x^2+2)^2}" },
          { t: 'm', col: 1, size: 'sm', tex: "\\begin{aligned}\\left(\\frac{2x-1}{x+3}\\right)'&=\\frac{2(x+3)-(2x-1)\\cdot1}{(x+3)^2}\\\\ &=\\frac{7}{(x+3)^2}\\end{aligned}" }] },
      { ask: { type: 'choice', q: '$y=\\dfrac{x+4}{x^2+1}$ を微分すると？',
        opts: ['$\\dfrac{x^2+8x-1}{(x^2+1)^2}$', '$\\dfrac{1}{2x}$', '$\\dfrac{-x^2-8x+1}{x^2+1}$', '$\\dfrac{-x^2-8x+1}{(x^2+1)^2}$'], ok: 3,
        why: { 0: "分子のひく順が逆です。$f'g-fg'$ の順にひきます。", 1: '分子の微分÷分母の微分、ではありません。', 2: '分母は $(x^2+1)^2$。2乗を忘れています。' },
        good: '分子は $1\\cdot(x^2+1)-(x+4)\\cdot2x=-x^2-8x+1$、分母は $(x^2+1)^2$。',
        add: [{ t: 'm', col: 1, size: 'sm', tex: "\\begin{aligned}\\left(\\frac{x+4}{x^2+1}\\right)'&=\\frac{(x^2+1)-(x+4)\\cdot2x}{(x^2+1)^2}\\\\ &=\\frac{-x^2-8x+1}{(x^2+1)^2}\\end{aligned}" }] } },

      // ---------- x^n（n は負の整数） ----------
      { clear: true, part: '負の整数の指数', say: "$\\dfrac{1}{x^n}=x^{-n}$ も、$\\left\\{\\dfrac{1}{g(x)}\\right\\}'$ の公式で微分できます。結果は $-nx^{-n-1}$。つまり $(x^n)'=nx^{n-1}$ は、**$n$ が負の整数でも** 成り立ちます。",
        add: [{ t: 'h', text: '$(x^n)\'=nx^{n-1}$ は負の整数でも' },
          { t: 'm', tex: "\\left(\\frac{1}{x^n}\\right)'=-\\frac{nx^{n-1}}{x^{2n}}=-nx^{-n-1}" },
          { t: 'box', c: 'b', label: '例', text: "$\\left(\\dfrac1x\\right)'=(x^{-1})'=-x^{-2}=-\\dfrac{1}{x^2}$" }] },
      { ask: { type: 'choice', q: '$\\left(\\dfrac{1}{x^3}\\right)\'$ は？',
        opts: ['$-\\dfrac{3}{x^4}$', '$\\dfrac{1}{3x^2}$', '$-\\dfrac{3}{x^2}$', '$\\dfrac{3}{x^4}$'], ok: 0,
        why: { 1: '分母だけを微分してはいけません。$x^{-3}$ と見て公式を使います。', 2: '$x^{-3}$ の指数を 1 へらすと $-4$ です。$-2$ ではありません。', 3: "$-\\dfrac{g'}{g^2}$ の $-$ を忘れています。" },
        good: '$(x^{-3})\'=-3x^{-4}=-\\dfrac{3}{x^4}$。',
        add: [{ t: 'm', tex: "\\left(\\frac{1}{x^3}\\right)'=(x^{-3})'=-3x^{-4}=-\\frac{3}{x^4}" }] } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。次の時間は、**合成関数** と **逆関数** の微分を学び、$\\sqrt{x}$ のような関数も微分できるようにします。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
