/* 数学C 第2章 平面上の曲線と複素数平面 複素数平面 ②：極形式と積・商
   例はすべて自作。答え・誤答の値は python3（sympy）で検算ずみ。
   −3+√3 i＝2√3(cos5π/6＋i sin5π/6)（tan だけで決めると −π/6）
   z₁=1+i＝√2(cosπ/4＋i sinπ/4)、z₂=√3+i＝2(cosπ/6＋i sinπ/6)、z₁z₂＝2√2(cos5π/12＋i sin5π/12)＝(√3−1)+(√3+1)i → cos5π/12＝(√6−√2)/4
   i(3+i)＝−1+3i／2+3i を −π/2 回転＝−i(2+3i)＝3−2i（i をかけると −3+2i）
   (−3+√3 i)/(√3+i)＝√3(cos2π/3＋i sin2π/3)＝−√3/2＋(3/2)i */
(function () {
  const POINTS = [
    '$z=a+bi$ は、$r=|z|$ と偏角 $\\theta=\\arg z$ を使って **極形式** $z=r(\\cos\\theta+i\\sin\\theta)$ で表せる。$\\theta$ は $\\cos\\theta=\\dfrac ar,\\ \\sin\\theta=\\dfrac br$ の **両方** から決める',
    '**積**：$|z_1z_2|=|z_1||z_2|$、$\\arg(z_1z_2)=\\arg z_1+\\arg z_2$（絶対値はかけ、偏角はたす）。**商**：絶対値はわり、偏角はひく',
    '$r(\\cos\\theta+i\\sin\\theta)$ をかける ＝ 原点のまわりに $\\theta$ 回転して $r$ 倍。$i$ をかけると $\\dfrac{\\pi}{2}$ 回転、$-i$ をかけると $-\\dfrac{\\pi}{2}$ 回転'
  ];
  const R3 = Math.sqrt(3), D = Math.PI / 180;
  const IM = n => Array.isArray(n) ? n : [n, (n === 1 ? '' : n === -1 ? '−' : String(n).replace('-', '−')) + 'i'];
  const plane = (tx, ty) => ({ k: 'axes', tx, ty: ty.map(IM), xl: '実軸', yl: '虚軸', grid: true });
  const P0 = [3 * Math.cos(36 * D), 3 * Math.sin(36 * D)];   // 極形式の説明の点（r＝3、θ＝36°）

  HB.lesson({
    id: 'mc2-02', field: '数学C　平面上の曲線と複素数平面', title: '極形式と積・商', level: '複素数平面', time: '目安 8分', noDec: true,
    problem: { label: '例題', lead: 'この時間の例題',
      parts: ['(1)　$z=-3+\\sqrt3\\,i$ を極形式で表す（$0\\le\\theta<2\\pi$）', '(2)　$z_1=1+i,\\ z_2=\\sqrt3+i$ のとき、$z_1z_2$ を極形式で表し、$\\cos\\dfrac{5}{12}\\pi$ の値を求める',
        '(3)　点 $2+3i$ を原点のまわりに $-\\dfrac{\\pi}{2}$ 回転した点', '(4)　$\\dfrac{-3+\\sqrt3\\,i}{\\sqrt3+i}$ を極形式で表す'] },
    points: POINTS,
    cols: [0.54, 0.46],
    steps: [
      { part: 'めあて', say: '前の時間は、複素数を平面の点として見ました。この時間は、点を「原点からの **距離**」と「**向き（角）**」で表し、かけ算が図で何を意味するかを調べます。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '複素数を **極形式** で表せる\n積・商の絶対値と偏角を求め、**回転** として説明できる' }] },

      // ---------- 極形式 ----------
      { clear: true, part: '極形式', say: '点 $z=a+bi$ の、原点からの距離を $r$、実軸の正の向きから測った角を $\\theta$ とします。数学Ⅱの三角関数の定義から、$a=r\\cos\\theta,\\ b=r\\sin\\theta$ です。',
        add: [{ t: 'h', text: '極形式' },
          { t: 'm', tex: 'r=|z|=\\sqrt{a^2+b^2}' },
          { t: 'm', tex: 'a=r\\cos\\theta,\\qquad b=r\\sin\\theta' },
          { t: 'fig', id: 'q1', col: 1, view: [-0.7, -0.7, 4.0, 3.0], w: 580, h: 457, items: [{ k: 'axes', xl: '実軸', yl: '虚軸' },
            { k: 'seg', a: [0, 0], b: P0, c: 'y', wd: 4 },
            { k: 'seg', a: P0, b: [P0[0], 0], c: 'p', dash: true }, { k: 'seg', a: [0, 0], b: [P0[0], 0], c: 'b', wd: 5 },
            { k: 'angle', o: [0, 0], a: [1, 0], b: P0, rp: 46, label: 'θ', size: 26, c: 'g' },
            { k: 'label', at: [P0[0] / 2, P0[1] / 2], text: 'r', c: 'y', size: 28, dx: -16, dy: -18 },
            { k: 'label', at: [P0[0] / 2, 0], text: 'a', c: 'b', size: 28, dy: 26 },
            { k: 'label', at: [P0[0], P0[1] / 2], text: 'b', c: 'p', size: 28, dx: 18 },
            { k: 'pt', at: P0, name: 'z=a+bi', dir: 'ne', c: 'y' }] }] },
      { say: 'だから $z=r\\cos\\theta+(r\\sin\\theta)i=r(\\cos\\theta+i\\sin\\theta)$。これを **極形式** といい、$\\theta$ を **偏角**（$\\arg z$）といいます。',
        add: [{ t: 'box', c: 'y', label: '極形式', text: '$z=r(\\cos\\theta+i\\sin\\theta)$\n$r=|z|$，　$\\theta=\\arg z$（偏角）' },
          { t: 'p', size: 'xs', text: '偏角は $2\\pi$ の整数倍のちがいがある。ふつうは $0\\le\\theta<2\\pi$ などで1つに決める' }] },

      // ---------- 例 ----------
      { clear: true, part: '極形式に直す', say: '$z=-3+\\sqrt3\\,i$ を極形式に直します。まず $r=2\\sqrt3$。次に、$\\cos\\theta$ と $\\sin\\theta$ の値を **両方** 求めます。',
        add: [{ t: 'h', text: '$z=-3+\\sqrt3\\,i$ を極形式に' },
          { t: 'm', tex: 'r=\\sqrt{(-3)^2+(\\sqrt3)^2}=\\sqrt{12}=2\\sqrt3' },
          { t: 'm', tex: '\\cos\\theta=\\frac{-3}{2\\sqrt3}=-\\frac{\\sqrt3}{2},\\qquad \\sin\\theta=\\frac{\\sqrt3}{2\\sqrt3}=\\frac12' },
          { t: 'fig', id: 'q2', col: 1, view: [-3.9, -0.9, 1.5, 2.6], w: 640, h: 415, items: [plane([[-3, '−3'], -2, -1, 1], [[R3, '√3i']]),
            { k: 'seg', a: [0, 0], b: [-3, R3], c: 'y', wd: 4 }, { k: 'seg', a: [-3, R3], b: [-3, 0], c: 'p', dash: true },
            { k: 'right', o: [-3, 0], a: [0, 0], b: [-3, R3], s: 14 },
            { k: 'label', at: [-1.5, R3 / 2], text: '2√3', c: 'y', dx: 10, dy: -22 },
            { k: 'pt', at: [-3, R3], name: '−3+√3i', dir: 'ne', c: 'y' }] }] },
      { ask: { type: 'choice', q: '$z=-3+\\sqrt3\\,i$ の偏角 $\\theta$ は？（$0\\le\\theta<2\\pi$）',
        opts: ['$\\dfrac{\\pi}{6}$', '$\\dfrac{5}{6}\\pi$', '$-\\dfrac{\\pi}{6}$', '$\\dfrac{7}{6}\\pi$'], ok: 1,
        why: { 0: '$\\cos\\theta<0$ なので、点は左側（第2象限）。$\\dfrac{\\pi}{6}$ は右上の向きです。', 2: '$\\tan\\theta=-\\dfrac{1}{\\sqrt3}$ だけで決めた角です。$\\sin\\theta>0$ なので点は上半分。', 3: '$\\dfrac76\\pi$ は左下の向き。$\\sin\\theta=\\dfrac12>0$ なので上半分です。' },
        good: '$\\cos\\theta=-\\dfrac{\\sqrt3}{2},\\ \\sin\\theta=\\dfrac12$ をともに満たすのは $\\theta=\\dfrac56\\pi$。',
        add: [{ t: 'ans', label: '答', tex: 'z=2\\sqrt3\\left(\\cos\\frac56\\pi+i\\sin\\frac56\\pi\\right)' }],
        draw: [{ fig: 'q2', items: [
          { k: 'angle', o: [0, 0], a: [1, 0], b: [-3, R3], rp: 34, c: 'g' }, { k: 'label', at: [0.55, 0.42], text: '5π/6', c: 'g', size: 24 }] }] } },

      // ---------- 積 ----------
      { clear: true, cols: [1], part: '積', say: '2つの極形式をかけます。展開して $i^2=-1$ を使い、数学Ⅱの **加法定理** でまとめると、きれいな形になります。',
        add: [{ t: 'h', text: '積の極形式' },
          { t: 'm', size: 'sm', tex: 'z_1=r_1(\\cos\\theta_1+i\\sin\\theta_1),\\quad z_2=r_2(\\cos\\theta_2+i\\sin\\theta_2)' },
          { t: 'm', size: 'sm', tex: '\\begin{aligned}z_1z_2&=r_1r_2\\{(\\cos\\theta_1\\cos\\theta_2-\\sin\\theta_1\\sin\\theta_2)+i(\\sin\\theta_1\\cos\\theta_2+\\cos\\theta_1\\sin\\theta_2)\\}\\\\ &=r_1r_2\\{\\cos(\\hy{\\theta_1+\\theta_2})+i\\sin(\\hy{\\theta_1+\\theta_2})\\}\\end{aligned}' }] },
      { say: '絶対値は $r_1r_2$、偏角は $\\theta_1+\\theta_2$。つまり、積は「**絶対値はかけ、偏角はたす**」です。',
        add: [{ t: 'box', c: 'p', label: '積', text: '$|z_1z_2|=|z_1||z_2|$，　$\\arg(z_1z_2)=\\arg z_1+\\arg z_2$\n絶対値は **かけ**、偏角は **たす**' }] },

      // ---------- 積の例 ----------
      { clear: true, cols: [0.6, 0.4], part: '積の例', say: '$z_1=1+i$ と $z_2=\\sqrt3+i$ を極形式にすると、こうなります。図で、$z_1$ と $z_2$ の向きを確かめましょう。',
        add: [{ t: 'h', text: '$z_1=1+i,\\ z_2=\\sqrt3+i$ の積' },
          { t: 'm', tex: 'z_1=\\sqrt2\\left(\\cos\\frac{\\pi}{4}+i\\sin\\frac{\\pi}{4}\\right)' },
          { t: 'm', tex: 'z_2=2\\left(\\cos\\frac{\\pi}{6}+i\\sin\\frac{\\pi}{6}\\right)' },
          { t: 'fig', id: 'q3', col: 1, view: [-0.5, -0.4, 2.4, 3.05], w: 395, h: 470, items: [plane([1, 2], [1, 2]),
            { k: 'vec', a: [0, 0], b: [1, 1], c: 'b' }, { k: 'vec', a: [0, 0], b: [R3, 1], c: 'g' },
            { k: 'pt', at: [1, 1], name: 'z₁', dir: 'nw', c: 'b' }, { k: 'pt', at: [R3, 1], name: 'z₂', dir: 'e', c: 'g' }] }] },
      { ask: { type: 'choice', q: '$z_1z_2$ の絶対値 $r$ と偏角 $\\theta$ の組（$r$, $\\theta$）は？',
        opts: ['$2+\\sqrt2,\\ \\ \\dfrac{5}{12}\\pi$', '$2\\sqrt2,\\ \\ \\dfrac{\\pi}{12}$', '$2\\sqrt2,\\ \\ \\dfrac{\\pi^2}{24}$', '$2\\sqrt2,\\ \\ \\dfrac{5}{12}\\pi$'], ok: 3,
        why: { 0: '絶対値は **かけます**。$\\sqrt2\\times2=2\\sqrt2$。', 1: '偏角は **たします**。ひくのは商のときです。', 2: '偏角どうしはかけません。$\\dfrac{\\pi}{4}+\\dfrac{\\pi}{6}$ とたします。' },
        good: '$r=\\sqrt2\\cdot2=2\\sqrt2$、$\\theta=\\dfrac{\\pi}{4}+\\dfrac{\\pi}{6}=\\dfrac{5}{12}\\pi$。',
        add: [{ t: 'm', tex: 'z_1z_2=2\\sqrt2\\left(\\cos\\frac{5}{12}\\pi+i\\sin\\frac{5}{12}\\pi\\right)' }],
        draw: [{ fig: 'q3', items: [
          { k: 'arc', o: [0, 0], rp: 54, a1: 0, a2: 45, c: 'b', label: 'π/4', lr: 24, size: 20 },
          { k: 'arc', o: [0, 0], rp: 92, a1: 45, a2: 75, c: 'g', label: 'π/6', lr: 30, size: 20 },
          { k: 'vec', a: [0, 0], b: [R3 - 1, R3 + 1], c: 'y' }, { k: 'pt', at: [R3 - 1, R3 + 1], name: 'z₁z₂', dir: 'ne', c: 'y' }] }] } },
      { ask: { type: 'think', q: '$z_1z_2=(1+i)(\\sqrt3+i)$ を直接展開して、上の極形式とくらべ、$\\cos\\dfrac{5}{12}\\pi$ の値を求めよう。',
        hint: '$(1+i)(\\sqrt3+i)=(\\sqrt3-1)+(\\sqrt3+1)i$。実部どうしをくらべると $2\\sqrt2\\cos\\dfrac{5}{12}\\pi=\\sqrt3-1$。',
        ans: '$\\cos\\dfrac{5}{12}\\pi=\\dfrac{\\sqrt3-1}{2\\sqrt2}=\\dfrac{\\sqrt6-\\sqrt2}{4}$',
        after: '虚部どうしをくらべると $\\sin\\dfrac{5}{12}\\pi=\\dfrac{\\sqrt6+\\sqrt2}{4}$ も出ます。加法定理で求めた値と同じです。',
        add: [{ t: 'm', size: 'sm', tex: '(1+i)(\\sqrt3+i)=(\\sqrt3-1)+(\\sqrt3+1)i' },
          { t: 'm', size: 'sm', tex: '\\cos\\frac{5}{12}\\pi=\\frac{\\sqrt3-1}{2\\sqrt2}=\\ans{\\frac{\\sqrt6-\\sqrt2}{4}}' }] } },

      // ---------- 回転 ----------
      { clear: true, part: '回転', say: '$\\cos\\theta+i\\sin\\theta$ は絶対値が 1。これをかけても絶対値は変わらず、偏角だけが $\\theta$ ふえます。つまり、原点のまわりの **$\\theta$ 回転** です。',
        add: [{ t: 'h', text: 'かけ算と回転' },
          { t: 'box', c: 'b', size: 'sm', label: '回転', text: '$z$ に $\\cos\\theta+i\\sin\\theta$ をかける\n→ 点 $z$ を原点のまわりに $\\theta$ 回転\n$r(\\cos\\theta+i\\sin\\theta)$ なら、さらに $r$ 倍' },
          { t: 'm', tex: 'i=\\cos\\frac{\\pi}{2}+i\\sin\\frac{\\pi}{2}', note: '$i$ をかける\n＝ $\\dfrac{\\pi}{2}$ 回転' },
          { t: 'm', tex: 'i(3+i)=3i+i^2=-1+3i' },
          { t: 'fig', id: 'q4', col: 1, view: [-1.9, -0.8, 3.9, 3.6], w: 600, h: 455, items: [plane([-1, 1, 2, 3], [1, 2, 3]),
            { k: 'vec', a: [0, 0], b: [3, 1], c: 'b' }, { k: 'vec', a: [0, 0], b: [-1, 3], c: 'p' },
            { k: 'right', o: [0, 0], a: [3, 1], b: [-1, 3], s: 18 },
            { k: 'arc', o: [0, 0], rp: 120, a1: 18.43, a2: 108.43, c: 'y', dash: true, label: '90°', lr: 22, size: 22 },
            { k: 'pt', at: [3, 1], name: '3+i', dir: 'e', c: 'b' }, { k: 'pt', at: [-1, 3], name: '−1+3i', dir: 'ne', c: 'p' }] }] },
      { ask: { type: 'choice', q: '点 $2+3i$ を、原点のまわりに $-\\dfrac{\\pi}{2}$ 回転した点は？',
        opts: ['$-3+2i$', '$3-2i$', '$-2-3i$', '$2-3i$'], ok: 1,
        why: { 0: 'それは $i$ をかけた、$+\\dfrac{\\pi}{2}$ 回転の点です。', 2: 'それは $-1$ をかけた、$\\pi$ 回転の点です。', 3: 'それは共役な複素数（実軸に関して対称な点）です。' },
        good: '$-\\dfrac{\\pi}{2}$ 回転は $\\cos\\left(-\\dfrac{\\pi}{2}\\right)+i\\sin\\left(-\\dfrac{\\pi}{2}\\right)=-i$ をかける。$-i(2+3i)=3-2i$。',
        add: [{ t: 'm', size: 'sm', tex: '-i(2+3i)=-2i-3i^2=\\ans{3-2i}' }] } },

      // ---------- 商 ----------
      { clear: true, cols: [0.52, 0.48], part: '商', say: '商 $\\dfrac{z_1}{z_2}$ に $z_2$ をかけると $z_1$。偏角は「たして $\\theta_1$」になるので、商の偏角は $\\theta_1-\\theta_2$。絶対値は $\\dfrac{r_1}{r_2}$ です。',
        add: [{ t: 'h', text: '商の極形式' },
          { t: 'm', tex: '\\frac{z_1}{z_2}=\\frac{r_1}{r_2}\\{\\cos(\\theta_1-\\theta_2)+i\\sin(\\theta_1-\\theta_2)\\}' },
          { t: 'box', c: 'p', label: '商', text: '$\\left|\\dfrac{z_1}{z_2}\\right|=\\dfrac{|z_1|}{|z_2|}$，　$\\arg\\dfrac{z_1}{z_2}=\\arg z_1-\\arg z_2$\n絶対値は **わり**、偏角は **ひく**' },
          { t: 'h', col: 1, text: '例' },
          { t: 'm', col: 1, size: 'sm', tex: 'z_1=-3+\\sqrt3\\,i=2\\sqrt3\\left(\\cos\\frac56\\pi+i\\sin\\frac56\\pi\\right)' },
          { t: 'm', col: 1, size: 'sm', tex: 'z_2=\\sqrt3+i=2\\left(\\cos\\frac{\\pi}{6}+i\\sin\\frac{\\pi}{6}\\right)' }] },
      { ask: { type: 'choice', q: '上の例で、$\\dfrac{z_1}{z_2}$ の絶対値 $r$ と偏角 $\\theta$ の組（$r$, $\\theta$）は？',
        opts: ['$4\\sqrt3,\\ \\ \\pi$', '$2\\sqrt3-2,\\ \\ \\dfrac23\\pi$', '$\\sqrt3,\\ \\ \\dfrac23\\pi$', '$\\sqrt3,\\ \\ -\\dfrac23\\pi$'], ok: 2,
        why: { 0: 'それは積 $z_1z_2$。商は、絶対値をわり、偏角をひきます。', 1: '絶対値はひかずに **わります**。$\\dfrac{2\\sqrt3}{2}=\\sqrt3$。', 3: '偏角は「分子の偏角 $-$ 分母の偏角」の順にひきます。' },
        good: '$r=\\dfrac{2\\sqrt3}{2}=\\sqrt3$、$\\theta=\\dfrac56\\pi-\\dfrac{\\pi}{6}=\\dfrac23\\pi$。',
        add: [{ t: 'm', col: 1, tex: '\\begin{aligned}\\frac{z_1}{z_2}&=\\sqrt3\\left(\\cos\\frac23\\pi+i\\sin\\frac23\\pi\\right)\\\\ &=\\ans{-\\frac{\\sqrt3}{2}+\\frac32i}\\end{aligned}' },
          { t: 'p', col: 1, size: 'xs', text: '（分母の共役 $\\sqrt3-i$ をかけて計算しても同じ）' }] } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。次の時間は、同じ数を何回もかける $z^n$ を、極形式で計算します（ド・モアブルの定理）。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
