/* 2025 広島大 理系 第5問の類題（自作）：数学B 数列・数学C 複素数平面 ― 2乗して回る複素数の列と、一直線上の3点
   元の問題はうつしていない（「ある複素数 α を引いて2乗し定数倍して α を足す型の漸化式」「z−α を極形式にし、絶対値の対数と偏角が
   それぞれ2倍型の漸化式をみたすことから一般項」「決まった番号の3点が一直線上にあることを偏角の比較で示す」というねらいと形式だけを合わせた
   自作問題。漸化式は展開した形で与え、α を係数比較で見つけるところから始める。定数は i/4、α=1+i、z₁=1+√3、3点は z₁, z₃, z₂₀₂₅）。
   答え（python3・sympy で検算ずみ。z₁〜z₆ を漸化式で直接計算し、一般項と一致）：
   (1) −(i/2)α=(1−i)/2 より α=1+i（定数項 (i/4)α²+α=1/2+i も一致）。w₁=√3−i=2{cos(−π/6)+i sin(−π/6)}
   (2) |w_{n+1}|=(1/4)|w_n|²、a_{n+1}=2a_n−2、a₁=1 → a_n=2−2^{n−1}（|w_n|=2^{2−2^{n−1}}：2, 1, 1/4, 1/64, …）
   (3) θ_{n+1}=2θ_n+π/2、θ₁=−π/6 → θ_n=2^{n−1}π/3−π/2。z_n=1+i+2^{2−2^{n−1}}{cos θ_n+i sin θ_n}
   (4) θ₁=−π/6、θ₃=5π/6。2^{2024}=4^{1012}≡4 (mod 6) より θ₂₀₂₅≡4π/3−π/2=5π/6 (mod 2π)。
       u=cos(5π/6)+i sin(5π/6) とすると w₁=−2u、w₃=u/4、w₂₀₂₅=2^{2−2^{2024}}u（実数倍）→ 3点は α を通り u の向きの直線上
       別解：θ_{n+2}−θ_n=3(θ_n+π/2)=2^{n−1}π は n≧2 で 2π の倍数 → θ₃≡θ₅≡…≡θ₂₀₂₅ */
(function () {
  const r3 = Math.sqrt(3), AL = [1, 1], Z1 = [1 + r3, 0], Z2 = [1 + r3 / 2, 1.5], Z3 = [1 - r3 / 8, 1.125];
  const POINTS = [
    '$z_{n+1}-\\alpha=c(z_n-\\alpha)^2$ の形に直す α は **係数比較** で。$w_n=z_n-\\alpha$ とおけば $w_{n+1}=cw_n^2$ のシンプルな形',
    '2乗すると **絶対値は2乗・偏角は2倍**（ド・モアブル）。$\\log_2|w_n|$ も偏角も「2倍して足す」型 → $a_{n+1}-2=2(a_n-2)$ のように変形',
    '一直線上は「$\\alpha$ からの向きが同じか反対」⇔ 偏角の差が $\\pi$ の整数倍。$2^{2024}\\pi/3$ は $2^{2024}$ を 6 で割った余りで決まる'
  ];
  const plane = (id, items, h) => ({ t: 'fig', id, col: 1, view: [-0.25, -0.55, 3.25, 1.95], w: Math.round((h || 400) * 3.5 / 2.5), h: h || 400, items: [
    { k: 'axes', tx: [[1, '1']], ty: [[1, '1']], xl: '実軸', yl: '虚軸' },
    { k: 'pt', at: AL, name: 'α', dir: 'ne', c: 'w', size: 24 }].concat(items || []) });
  const Z1p = { k: 'pt', at: Z1, name: 'z₁', dir: 's', c: 'p', size: 22 };
  const W1 = { k: 'vec', a: AL, b: Z1, c: 'p', wd: 3 };
  const LINE = { k: 'line', p1: AL, p2: Z1, c: 'y', wd: 2.5, dash: true };

  HB.lesson({
    id: 'hiro25-5', field: '広島大型　数学（理系）', title: '2025 広島大 理系 第5問の類題 ― 2乗して回る複素数の列と一直線上の3点', level: '2025年度 広島大学 理系 第5問の類題（自作）', time: '目安 20〜25分',
    noDec: true,
    problem: {
      label: '類題',
      lead: '$i$ を虚数単位とする。複素数の列 $\\{z_n\\}$ を\n$z_1=1+\\sqrt3,\\qquad z_{n+1}=\\dfrac{i}{4}z_n^{\\,2}+\\dfrac{1-i}{2}z_n+\\dfrac12+i\\quad(n=1,\\ 2,\\ 3,\\ \\cdots)$\nで定める。',
      parts: [
        '(1)　すべての複素数 $z$ について $\\dfrac{i}{4}z^2+\\dfrac{1-i}{2}z+\\dfrac12+i=\\dfrac{i}{4}(z-\\alpha)^2+\\alpha$ が成り立つような複素数 $\\alpha$ を求めよ。また、$w_n=z_n-\\alpha$ とおくとき、$w_1$ を極形式で表せ。ただし、偏角 $\\theta$ は $-\\pi<\\theta\\leqq\\pi$ とする。',
        '(2)　$a_n=\\log_2|w_n|$ とおく。$a_{n+1}$ を $a_n$ を用いて表し、$a_n$ を $n$ の式で表せ。',
        '(3)　$z_n$ を $n$ の式で表せ。',
        '(4)　複素数平面上の3点 $z_1,\\ z_3,\\ z_{2025}$ は一直線上にあることを示せ。'
      ],
      src: '※ 2025年度 広島大学 前期 理系 第5問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { cols: [1], part: '問題', say: '複素数の列の漸化式です。2乗が入った漸化式は、そのままでは解けません。うまく「ずらして」、極形式で考えるのがポイントです。まず問題文を読みましょう。',
        add: [{ t: 'prob' }] },

      // ---------- 読みかえ ----------
      { clear: true, cols: [1], part: '読みかえ', say: '(1) の α が見つかれば、$w_n=z_n-\\alpha$ は $w_{n+1}=\\frac i4w_n^{\\,2}$ をみたします。2乗の漸化式は、極形式にすると「絶対値」と「偏角」の2本の漸化式に分かれます。',
        add: [{ t: 'h', text: '方針：ずらして、極形式に分ける' },
          { t: 'm', tex: 'z_{n+1}-\\alpha=\\frac i4(z_n-\\alpha)^2\\quad\\Longrightarrow\\quad w_{n+1}=\\frac i4\\,w_n^{\\,2}' },
          { t: 'tbl', cls: 'rowh', rows: [['', '1回で', '漸化式'], ['絶対値 $|w_n|$', '2乗して $\\frac14$ 倍', '$\\log_2$ をとると $a_{n+1}=2a_n-2$'], ['偏角 $\\theta_n$', '2倍して $\\frac\\pi2$ 回す', '$\\theta_{n+1}=2\\theta_n+\\frac\\pi2$']] },
          { t: 'box', c: 'b', size: 'sm', label: 'なぜ ずらす？', text: '$z_n$ のままだと $z_n^{\\,2}$ と $z_n$ がまざり、絶対値も偏角も計算できない。\n$w_n$ にすると「2乗して定数倍」だけになり、ド・モアブルの定理がそのまま使える。' }] },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '(1) です。右辺を展開して、左辺と係数を比べます。$z^2$ の係数はどちらも $\\frac i4$。$z$ の係数を比べると α が決まります。',
        add: [{ t: 'h', text: '(1)　α と w₁ の極形式' },
          { t: 'm', size: 'sm', tex: '\\frac i4(z-\\alpha)^2+\\alpha=\\frac i4z^2-\\frac{i\\alpha}{2}z+\\frac{i\\alpha^2}{4}+\\alpha' },
          { t: 'm', tex: '-\\frac{i\\alpha}{2}=\\frac{1-i}{2}', note: '$z$ の係数' }] },
      { ask: { type: 'choice', q: '$-\\dfrac{i\\alpha}{2}=\\dfrac{1-i}{2}$ をみたす α は？',
        opts: ['$1-i$', '$-1-i$', '$1+i$', '$i-1$'], ok: 2,
        why: { 0: '$i\\alpha=-(1-i)=-1+i$。両辺を $i$ で割ると、$\\frac{-1+i}{i}=1+i$ です。', 1: '$-i$ で割るところを $i$ で割っています。', 3: 'それは $i\\alpha$ の値。最後に $i$ で割ります（$\\frac1i=-i$）。' },
        good: '$i\\alpha=-1+i$ より $\\alpha=\\frac{-1+i}{i}=(-1+i)(-i)=1+i$。',
        add: [{ t: 'm', tex: '\\alpha=1+i' },
          { t: 'p', size: 'sm', text: '定数項も確かめ：$\\frac i4(1+i)^2+(1+i)=\\frac i4\\cdot2i+1+i=\\frac12+i$ ✓' }] } },
      { ask: { type: 'choice', q: '$w_1=z_1-\\alpha=\\sqrt3-i$ を $r(\\cos\\theta+i\\sin\\theta)$ と表すとき、$(r,\\ \\theta)$ は？',
        opts: ['$r=2,\\ \\theta=-\\frac\\pi6$', '$r=2,\\ \\theta=\\frac\\pi6$', '$r=2,\\ \\theta=-\\frac\\pi3$', '$r=4,\\ \\theta=-\\frac\\pi6$'], ok: 0,
        why: { 1: '虚部が $-1$ なので、点は実軸より下。偏角は負です。', 2: '$\\cos\\theta=\\frac{\\sqrt3}{2},\\ \\sin\\theta=-\\frac12$ なので $-\\frac\\pi6$。', 3: '$|w_1|=\\sqrt{3+1}=2$。ルートをとり忘れています。' },
        good: '$|w_1|=2$、$\\cos\\theta=\\frac{\\sqrt3}2,\\ \\sin\\theta=-\\frac12$ より $\\theta=-\\frac\\pi6$。',
        add: [{ t: 'ans', label: '(1) 答', tex: '\\begin{aligned}&\\alpha=1+i\\\\&w_1=2\\Big\\{\\cos\\Big(-\\frac\\pi6\\Big)+i\\sin\\Big(-\\frac\\pi6\\Big)\\Big\\}\\end{aligned}' },
          plane('p1', [W1, Z1p, { k: 'label', at: [2.0, 0.66], text: 'w₁', c: 'p', size: 22 }, { k: 'arc', o: AL, rp: 40, a1: -30, a2: 0, c: 'y', label: '−π/6', lr: 30 }, { k: 'seg', a: AL, b: [2.2, 1], c: 'd', dash: true, wd: 1.5 }], 340)] } },

      // ---------- (2) ----------
      { clear: true, part: '(2)', say: '(2) です。$w_{n+1}=\\frac i4w_n^{\\,2}$ の絶対値をとると $|w_{n+1}|=\\frac14|w_n|^2$。$|w_1|=2$ なので、帰納法で $|w_n|>0$（$w_n\\neq0$）も言えます。',
        add: [{ t: 'h', text: '(2)　絶対値の対数 aₙ' },
          { t: 'm', tex: '|w_{n+1}|=\\Big|\\frac i4\\Big||w_n|^2=\\frac14|w_n|^2', note: '$|i|=1$' },
          { t: 'p', size: 'sm', text: '$|w_1|=2>0$ と合わせて、すべての $n$ で $|w_n|>0$' }] },
      { ask: { type: 'choice', q: '両辺の $\\log_2$ をとると、$a_{n+1}=\\log_2|w_{n+1}|$ は？',
        opts: ['$a_n^{\\,2}-2$', '$2a_n+2$', '$2a_n-\\frac14$', '$2a_n-2$'], ok: 3,
        why: { 0: '$\\log_2(x^2)=2\\log_2x$。2乗は「2倍」になります。', 1: '$\\log_2\\frac14=-2$。符号が逆です。', 2: '$\\frac14$ にも $\\log_2$ をとります。' },
        good: '$\\log_2\\frac14|w_n|^2=\\log_2\\frac14+2\\log_2|w_n|=-2+2a_n$。',
        add: [{ t: 'm', tex: 'a_{n+1}=2a_n-2,\\qquad a_1=\\log_22=1' }] } },
      { say: '$\\beta=2\\beta-2$ の解 $\\beta=2$ を使って $a_{n+1}-2=2(a_n-2)$。$a_n-2$ は初項 $-1$、公比 2 の等比数列です。',
        add: [{ t: 'm', tex: 'a_n-2=(1-2)\\cdot2^{n-1}=-2^{n-1}' },
          { t: 'ans', label: '(2) 答', tex: 'a_{n+1}=2a_n-2,\\qquad a_n=2-2^{n-1}' },
          { t: 'p', size: 'sm', text: 'つまり　$|w_n|=2^{\\,2-2^{n-1}}$：$2,\\ 1,\\ \\frac14,\\ \\frac1{64},\\ \\cdots$' }] },
      { ask: { type: 'think', q: '確かめ：漸化式から $w_2$ と $w_3$ を直接計算し、$|w_2|=1,\\ |w_3|=\\frac14$ を確かめよう。',
        hint: '$w_2=\\frac i4(\\sqrt3-i)^2$。$(\\sqrt3-i)^2=2-2\\sqrt3\\,i$。',
        ans: '$w_2=\\dfrac{\\sqrt3+i}{2}$（$|w_2|=1$），$w_3=\\dfrac i4\\cdot\\dfrac{2+2\\sqrt3\\,i}{4}=\\dfrac{-\\sqrt3+i}{8}$（$|w_3|=\\frac14$）',
        after: '$w_n$ はどんどん小さくなり、$z_n$ は α に近づいていきます。偏角は (3) で一般に求めます。' } },

      // ---------- (3) ----------
      { clear: true, part: '(3)', say: '(3) です。偏角を $\\theta_1=-\\frac\\pi6,\\ \\theta_{n+1}=2\\theta_n+\\frac\\pi2$ と決めると、ド・モアブルの定理より、帰納法で $w_n=|w_n|(\\cos\\theta_n+i\\sin\\theta_n)$ が言えます。',
        add: [{ t: 'h', text: '(3)　偏角と一般項' },
          { t: 'm', size: 'sm', tex: 'w_n^{\\,2}=|w_n|^2(\\cos2\\theta_n+i\\sin2\\theta_n)', note: 'ド・モアブル' },
          { t: 'm', size: 'sm', tex: '\\frac i4=\\frac14\\Big(\\cos\\frac\\pi2+i\\sin\\frac\\pi2\\Big)', note: 'かけると偏角は\n$2\\theta_n+\\frac\\pi2$' },
          { t: 'm', tex: '\\theta_{n+1}+\\frac\\pi2=2\\Big(\\theta_n+\\frac\\pi2\\Big)' }] },
      { ask: { type: 'choice', q: '$\\theta_n$ は？',
        opts: ['$-\\dfrac{2^{n-1}}{6}\\pi$', '$\\dfrac{2^{n-1}}{3}\\pi-\\dfrac\\pi2$', '$\\dfrac{2^{n-1}}{3}\\pi+\\dfrac\\pi2$', '$\\dfrac{2^{n}}{3}\\pi-\\dfrac\\pi2$'], ok: 1,
        why: { 0: '$i$ をかけて $\\frac\\pi2$ 回る分を忘れています。', 2: '$\\theta_n+\\frac\\pi2=\\cdots$ から $\\theta_n$ を出すときは、$\\frac\\pi2$ を引きます。', 3: '初項は $n=1$ なので、2 は $n-1$ 回かけます。' },
        good: '$\\theta_1+\\frac\\pi2=\\frac\\pi3$ なので $\\theta_n+\\frac\\pi2=\\frac\\pi3\\cdot2^{n-1}$。',
        add: [{ t: 'm', tex: '\\theta_n=\\frac{2^{n-1}}{3}\\pi-\\frac\\pi2' }] } },
      { say: '絶対値と偏角がそろったので、$z_n=\\alpha+w_n$ です。$\\cos\\left(x-\\frac\\pi2\\right)=\\sin x$、$\\sin\\left(x-\\frac\\pi2\\right)=-\\cos x$ を使うと、少しすっきりします。',
        add: [{ t: 'ans', label: '(3) 答', tex: '\\begin{aligned}z_n&=1+i+2^{\\,2-2^{n-1}}\\big(\\cos\\theta_n+i\\sin\\theta_n\\big)\\\\&=1+i+2^{\\,2-2^{n-1}}\\Big(\\sin\\frac{2^{n-1}\\pi}{3}-i\\cos\\frac{2^{n-1}\\pi}{3}\\Big)\\end{aligned}' },
          { t: 'p', size: 'sm', text: 'ただし　$\\theta_n=\\dfrac{2^{n-1}}{3}\\pi-\\dfrac\\pi2$' }] },

      // ---------- (4) ----------
      { clear: true, part: '(4)', say: '(4) です。3点がどれも「α を通る1本の直線」上にあれば、一直線上です。それには $w_1,\\ w_3,\\ w_{2025}$ の偏角が、等しいか $\\pi$ ちがえばよいのです。',
        add: [{ t: 'h', text: '(4)　3点 z₁, z₃, z₂₀₂₅ が一直線上' },
          { t: 'm', size: 'sm', tex: '\\theta_1=-\\frac\\pi6,\\qquad \\theta_3=\\frac43\\pi-\\frac\\pi2=\\frac56\\pi' },
          { t: 'p', size: 'sm', text: '$\\theta_3-\\theta_1=\\pi$ → $z_1$ と $z_3$ は α をはさんで反対側' },
          plane('p4', [LINE, W1, Z1p, { k: 'vec', a: AL, b: Z3, c: 'b', wd: 3 }, { k: 'pt', at: Z3, name: 'z₃', dir: 'sw', c: 'b', size: 22 }])] },
      { ask: { type: 'choice', q: '$\\theta_{2025}=\\dfrac{2^{2024}}{3}\\pi-\\dfrac\\pi2$。$2^{2024}=4^{1012}$ を 6 で割った余りが 4 であることを使うと、$\\theta_{2025}$ は $2\\pi$ の整数倍を除いてどれと等しい？',
        opts: ['$-\\dfrac\\pi6$', '$\\dfrac\\pi6$', '$\\dfrac56\\pi$', '$\\dfrac\\pi2$'], ok: 2,
        why: { 0: 'それは余りが 1 のとき（$\\frac\\pi3-\\frac\\pi2$）。$4^k$ を 6 で割った余りは、いつも 4 です。', 1: 'それは余りが 2 のとき（$\\frac23\\pi-\\frac\\pi2$）。$n$ が偶数の点の偏角です。', 3: '$\\frac{2^{2024}}{3}\\pi$ は $\\pi$ の整数倍ではありません（$2^{2024}$ は 3 で割り切れない）。' },
        good: '$2^{2024}=6q+4$ とおくと $\\frac{2^{2024}}{3}\\pi=2q\\pi+\\frac43\\pi$。だから $\\theta_{2025}\\equiv\\frac43\\pi-\\frac\\pi2=\\frac56\\pi$（$\\theta_3$ と同じ）。',
        add: [{ t: 'm', size: 'sm', tex: '\\theta_{2025}=2q\\pi+\\frac43\\pi-\\frac\\pi2=2q\\pi+\\frac56\\pi' }] } },
      { say: '$u=\\cos\\frac56\\pi+i\\sin\\frac56\\pi$ とおくと、3つとも $u$ の **実数倍**。だから3点は、α を通り $u$ の向きの直線（黄色の点線）の上にあります。',
        add: [{ t: 'm', size: 'sm', tex: 'w_1=-2u,\\quad w_3=\\frac14u,\\quad w_{2025}=2^{\\,2-2^{2024}}u' },
          { t: 'ans', label: '(4)', text: '$z_k=\\alpha+t_k u$（$t_k$ は実数）の形なので、\n3点 $z_1,\\ z_3,\\ z_{2025}$ は α を通る1つの直線上にある。' }] },
      { ask: { type: 'think', q: '別の見方：$\\theta_{n+2}-\\theta_n$ を計算して、$n\\geqq2$ なら $2\\pi$ の整数倍になることを示そう。何が分かる？',
        hint: '$\\theta_{n+2}+\\frac\\pi2=4\\left(\\theta_n+\\frac\\pi2\\right)$ なので、$\\theta_{n+2}-\\theta_n=3\\left(\\theta_n+\\frac\\pi2\\right)$。',
        ans: '$\\theta_{n+2}-\\theta_n=3\\cdot\\dfrac{2^{n-1}}{3}\\pi=2^{n-1}\\pi$。$n\\geqq2$ なら $2\\pi$ の整数倍。だから $\\theta_3\\equiv\\theta_5\\equiv\\cdots\\equiv\\theta_{2025}$（$z_3$ 以降の奇数番目はすべて同じ半直線上）',
        after: '$n=1$ だけは $2^0\\pi=\\pi$ で、$z_1$ は反対側。偶数番目の点は偏角 $\\frac\\pi6$ の向き（緑の半直線）に集まります。',
        draw: [{ fig: 'p4', items: [{ k: 'seg', a: AL, b: [1 + 1.3 * r3 / 2, 1.65], c: 'g', wd: 2.5, dash: true }, { k: 'vec', a: AL, b: Z2, c: 'g', wd: 3 }, { k: 'pt', at: Z2, name: 'z₂', dir: 'nw', c: 'g', size: 22 }] }] } },

      // ---------- 答案のポイント ----------
      { clear: true, cols: [1], part: '答案', say: '記述式では、$w_n\\neq0$（極形式にできる理由）、偏角を漸化式で「決める」こと、$2^{2024}$ の余りの根拠を、きちんと書きます。',
        add: [{ t: 'h', text: '答案の書き方のポイント' },
          { t: 'box', c: 'b', size: 'sm', label: '(2)', text: '「$|w_1|=2\\neq0$ と $|w_{n+1}|=\\frac14|w_n|^2$ から、帰納法ですべての $n$ で $|w_n|>0$」と書いてから $\\log_2$ をとる。' },
          { t: 'box', c: 'y', size: 'sm', label: '(3)', text: '「$\\theta_1=-\\frac\\pi6,\\ \\theta_{n+1}=2\\theta_n+\\frac\\pi2$ で $\\theta_n$ を定めると、$w_n=|w_n|(\\cos\\theta_n+i\\sin\\theta_n)$（帰納法・ド・モアブルの定理）」。偏角は一般角のままでよい。' },
          { t: 'box', c: 'p', size: 'sm', label: '(4)', text: '「$4^k$ を 6 で割った余りは 4（$4\\cdot4=16=6\\cdot2+4$ のくり返し）」と根拠を書き、最後は「$\\alpha$ からのベクトルが同じ $u$ の実数倍」で結ぶ。' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。ずらして極形式にすれば、2乗の漸化式も、絶対値と偏角の2本の1次の漸化式になります。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で答案を書いてみましょう。' }
    ]
  });
})();
