/* 数学Ⅰ 第2章 集合と命題 ⑦：逆・裏・対偶
   例はすべて自作。真偽・反例は python3（数値で大量に試す・sympy）で検算ずみ。 */
(function () {
  const POINTS = [
    '$p\\Rightarrow q$ に対して　**逆** $q\\Rightarrow p$、**裏** $\\overline{p}\\Rightarrow\\overline{q}$、**対偶** $\\overline{q}\\Rightarrow\\overline{p}$',
    'もとの命題と **対偶** は、真偽が一致する（逆と裏も一致する）。逆は、真とはかぎらない',
    '対偶を作るときは、条件の否定（等号のありなし・「かつ」と「または」）に注意する'
  ];
  // 逆・裏・対偶の図。命題の上の線（否定）は seg で引く
  const prop = (cx, cy, a, b, barA, barB, c) => {
    const out = [{ k: 'label', at: [cx - 0.85, cy], text: a, size: 32, c }, { k: 'label', at: [cx, cy], text: '⇒', size: 30, plain: true, c }, { k: 'label', at: [cx + 0.85, cy], text: b, size: 32, c }];
    if (barA) out.push({ k: 'seg', a: [cx - 1.0, cy + 0.3], b: [cx - 0.7, cy + 0.3], c, wd: 2.5 });
    if (barB) out.push({ k: 'seg', a: [cx + 0.7, cy + 0.3], b: [cx + 1.0, cy + 0.3], c, wd: 2.5 });
    return out;
  };
  const REL = (id, col) => ({ t: 'fig', id, col, view: [0, 0, 12, 6.4], w: 780, h: 416, items: [].concat(
    prop(2.2, 5.4, 'p', 'q', false, false, 'y'), prop(9.8, 5.4, 'q', 'p', false, false),
    prop(2.2, 1.0, 'p', 'q', true, true), prop(9.8, 1.0, 'q', 'p', true, true),
    [{ k: 'label', at: [2.2, 4.65], text: 'もとの命題', size: 20, c: 'y' }, { k: 'label', at: [9.8, 4.65], text: '逆', size: 20 },
      { k: 'label', at: [2.2, 0.25], text: '裏', size: 20 }, { k: 'label', at: [9.8, 0.25], text: '対偶', size: 20 },
      { k: 'dim', a: [3.7, 5.4], b: [8.3, 5.4], dy: 0, label: '逆', c: 'b', size: 26 },
      { k: 'dim', a: [3.7, 1.0], b: [8.3, 1.0], dy: 0, label: '逆', c: 'b', size: 26 },
      { k: 'dim', a: [2.2, 4.25], b: [2.2, 1.75], dy: 0, c: 'g' }, { k: 'label', at: [1.55, 3.0], text: '裏', size: 26, c: 'g' },
      { k: 'dim', a: [9.8, 4.25], b: [9.8, 1.75], dy: 0, c: 'g' }, { k: 'label', at: [10.45, 3.0], text: '裏', size: 26, c: 'g' },
      { k: 'dim', a: [3.5, 4.3], b: [8.5, 1.7], dy: 0, c: 'p' }, { k: 'dim', a: [8.5, 4.3], b: [3.5, 1.7], dy: 0, c: 'p' },
      { k: 'label', at: [6, 3.75], text: '対偶', size: 26, c: 'p' }, { k: 'label', at: [6, 2.25], text: '対偶', size: 26, c: 'p' }]) });
  const NL = (id, col) => ({ t: 'fig', id, col, view: [-1.5, -0.6, 7.5, 1.4], w: 680, h: 151, items: [{ k: 'numline', ticks: [-1, 0, 1, 2, 3, 4, 5, 6, 7] }] });
  // P⊂Q のベン図（A＝P、B＝Q）
  const PA = { o: [5.6, 3], r: 1.3 }, QB = { o: [5, 3], r: 2.6 };

  HB.lesson({
    id: 'm1b-07', field: '数学Ⅰ　集合と命題', title: '逆・裏・対偶', level: '命題と論証', time: '目安 8分', noDec: true,
    problem: { label: '例題', lead: 'この時間の例題（$x,\\ y$ は実数、$n$ は自然数とする）',
      parts: ['(1)　命題「$x>5\\Rightarrow x>2$」の逆・裏・対偶を作り、それぞれの真偽を調べる',
        '(2)　命題「$n$ が 9 の倍数 $\\Rightarrow$ $n$ は 3 の倍数」の対偶と逆の真偽',
        '(3)　命題「$x+y>4\\Rightarrow$（$x>2$ または $y>2$）」の対偶を作り、もとの命題の真偽を調べる',
        '(4)　命題「$x^2\\ne9\\Rightarrow x\\ne3$」の真偽を、対偶を使って調べる。逆の真偽も'] },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: 'めあて', say: '命題 $p\\Rightarrow q$ から、仮定と結論を入れかえたり否定したりして、新しい命題を作ります。前の時間の **否定** を使います。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '**逆・裏・対偶** を作れる\nもとの命題と対偶の真偽が一致することを確かめる' },
          { t: 'p', size: 'sm', text: '前の時間：条件の否定 $\\overline{p}$（等号・かつ／または に注意）' }] },

      // ---------- 定義 ----------
      { clear: true, cols: [0.44, 0.56], part: '定義', say: '$p\\Rightarrow q$ に対して、向きを入れかえた $q\\Rightarrow p$ を **逆**、両方を否定した $\\overline{p}\\Rightarrow\\overline{q}$ を **裏**、逆にして否定した $\\overline{q}\\Rightarrow\\overline{p}$ を **対偶** といいます。',
        add: [{ t: 'h', text: '逆・裏・対偶' },
          { t: 'box', c: 'b', label: '定義', text: '命題 $p\\Rightarrow q$ に対して\n**逆**　　$q\\Rightarrow p$\n**裏**　　$\\overline{p}\\Rightarrow\\overline{q}$\n**対偶**　$\\overline{q}\\Rightarrow\\overline{p}$' },
          { t: 'p', size: 'sm', text: '逆：向きを入れかえる\n裏：両方を否定する\n対偶：入れかえて、否定する' }] },
      { say: '図にすると、こうなります。横が逆、たてが裏、ななめが対偶。4つの命題は、たがいに逆・裏・対偶の関係です。',
        add: [REL('rel', 1)] },
      { ask: { type: 'choice', q: '$p\\Rightarrow q$ の **対偶** は？',
        opts: ['$q\\Rightarrow p$', '$\\overline{p}\\Rightarrow\\overline{q}$', '$\\overline{q}\\Rightarrow\\overline{p}$', '$\\overline{p}\\Rightarrow q$'], ok: 2,
        why: { 0: 'それは逆。対偶は「入れかえて、両方を否定」です。', 1: 'それは裏。対偶は向きも入れかえます。', 3: '否定するのは両方。そして向きも入れかえます。' },
        good: '向きを入れかえて（逆）、両方を否定した（裏）もの。$\\overline{q}\\Rightarrow\\overline{p}$ です。' } },

      // ---------- 真偽の関係 ----------
      { clear: true, cols: [0.54, 0.46], part: '真偽の関係', say: '例で確かめます。「$x>5\\Rightarrow x>2$」は、$x>5$ の範囲が $x>2$ の範囲にふくまれるので **真** です。',
        add: [{ t: 'h', text: '例：$x>5\\Rightarrow x>2$' },
          { t: 'm', tex: '\\hy{\\text{命題}}\\ \\ x>5\\Rightarrow x>2', note: '真' },
          NL('n1', 1)],
        draw: [{ fig: 'n1', items: [{ k: 'range', from: 2, to: null, fromIn: false, c: 'b', h: 72, label: 'x>2' }, { k: 'range', from: 5, to: null, fromIn: false, c: 'y', h: 38, label: 'x>5', dx: 20 }] }] },
      { say: '逆は「$x>2\\Rightarrow x>5$」。$x=3$ が反例なので **偽** です。',
        add: [{ t: 'm', tex: '\\hb{\\text{逆}}\\ \\ x>2\\Rightarrow x>5', note: '偽（反例 $x=3$）' }],
        draw: [{ fig: 'n1', items: [{ k: 'pt', at: [3, 0], c: 'p', r: 7 }] }] },
      { ask: { type: 'choice', q: '裏は、両方を否定した「$x\\le5\\Rightarrow x\\le2$」。真偽は？',
        opts: ['真', '偽（反例 $x=3$）', '偽（反例 $x=1$）', '偽（反例 $x=6$）'], ok: 1,
        why: { 0: '$x=3$ は $x\\le5$ を満たすのに、$x\\le2$ を満たしません。', 2: '$x=1$ は結論 $x\\le2$ を満たすので、反例になりません。', 3: '$x=6$ は仮定 $x\\le5$ を満たしません。' },
        good: '$x=3$ が反例で偽。逆と同じ反例です。',
        add: [{ t: 'm', tex: '\\hg{\\text{裏}}\\ \\ x\\le5\\Rightarrow x\\le2', note: '偽（反例 $x=3$）' }] } },
      { say: '対偶は「$x\\le2\\Rightarrow x\\le5$」。2 以下の数は必ず 5 以下なので **真**。もとの命題と同じです。',
        add: [{ t: 'm', tex: '\\ans{\\text{対偶}}\\ \\ x\\le2\\Rightarrow x\\le5', note: '真' }] },
      { say: 'もとの命題と対偶は真偽が **一致**、逆と裏も一致しています。これは、どんな命題でも成り立ちます。',
        add: [{ t: 'box', c: 'y', label: '性質', text: 'もとの命題と **対偶** の真偽は一致する\n（逆と裏の真偽も一致する）' }] },

      // ---------- わけ ----------
      { clear: true, part: 'わけ', say: 'わけをベン図で見ます。$P\\subset Q$ なら、$Q$ の外側 $\\overline{Q}$ は、$P$ の外側 $\\overline{P}$ にすっぽり入ります。',
        add: [{ t: 'h', text: '対偶の真偽が一致するわけ' },
          { t: 'm', tex: 'p\\Rightarrow q\\ \\text{が真}\\iff P\\subset Q' },
          { t: 'm', tex: '\\iff \\overline{Q}\\subset\\overline{P}', note: '$Q$ の外は、$P$ の外にふくまれる' },
          { t: 'm', tex: '\\iff \\overline{q}\\Rightarrow\\overline{p}\\ \\text{が真}' },
          { t: 'fig', id: 'pq', col: 1, view: [0, 0, 10, 6], w: 600, h: 360, items: [
            { k: 'venn', A: PA, B: QB, names: ['U', 'P', 'Q'], shade: ['aB', 'ab'], fc: 'b', alpha: 0.22 },
            { k: 'venn', A: PA, B: QB, U: false, names: ['U', 'P', 'Q'], shade: ['ab'], fc: 'p', alpha: 0.4 },
            { k: 'label', at: [8.6, 0.6], text: 'Q の外', size: 22, c: 'p' }, { k: 'label', at: [3.3, 3.0], text: 'P の外', size: 22, c: 'b' }] },
          { t: 'p', col: 1, size: 'xs', text: '青：$\\overline{P}$（P の外）　桃：$\\overline{Q}$（Q の外）', style: 'align-self:center' }] },

      // ---------- 整数 ----------
      { clear: true, cols: [1], part: '整数', say: '自然数 $n$ の命題「$n$ が 9 の倍数 ⇒ $n$ は 3 の倍数」は真です（$9k=3\\cdot3k$）。この対偶と逆を考えます。',
        add: [{ t: 'h', text: '整数の命題（$n$ は自然数）' },
          { t: 'm', tex: '\\hy{\\text{命題}}\\ \\ n\\text{ が 9 の倍数}\\ \\Rightarrow\\ n\\text{ は 3 の倍数}', note: '真（$9k=3\\cdot3k$）' }] },
      { ask: { type: 'choice', q: '対偶「$n$ が 3 の倍数でない ⇒ $n$ は 9 の倍数でない」と、逆の真偽の組み合わせは？',
        opts: ['対偶 真・逆 真', '対偶 真・逆 偽', '対偶 偽・逆 真', '対偶 偽・逆 偽'], ok: 1,
        why: { 0: '逆「3 の倍数 ⇒ 9 の倍数」は、$n=3$ が反例で偽です。', 2: '対偶は、もとの命題（真）と真偽が一致します。', 3: '対偶は、もとの命題と真偽が一致するので真です。' },
        good: '対偶はもとの命題と同じく **真**。逆は $n=3$ が反例で **偽**。',
        add: [{ t: 'm', size: 'sm', tex: '\\ans{\\text{対偶}}\\ \\ n\\text{ が 3 の倍数でない}\\ \\Rightarrow\\ n\\text{ は 9 の倍数でない}', note: '真' },
          { t: 'm', size: 'sm', tex: '\\hb{\\text{逆}}\\ \\ n\\text{ が 3 の倍数}\\ \\Rightarrow\\ n\\text{ は 9 の倍数}', note: '偽（反例 $n=3$）' },
          { t: 'p', size: 'sm', text: '→ 逆が偽でも、もとの命題は真。「**逆は、真とはかぎらない**」' }] } },

      // ---------- かつ・または ----------
      { clear: true, cols: [0.6, 0.4], part: '対偶で調べる', say: '「$x+y>4\\Rightarrow x>2$ または $y>2$」。このままでは真偽が見えにくい命題です。対偶を作ります。「または」の否定に注意。',
        add: [{ t: 'h', text: '対偶を作って調べる（$x,\\ y$ は実数）' },
          { t: 'm', tex: '\\hy{\\text{命題}}\\ \\ x+y>4\\ \\Rightarrow\\ x>2\\ \\text{または}\\ y>2' },
          { t: 'fig', id: 'xy', col: 1, view: [-1.5, -1.5, 5.5, 5.5], w: 440, h: 440, items: [
            { k: 'poly', pts: [[-1.5, -1.5], [5.5, -1.5], [-1.5, 5.5]], close: true, fill: 'b', alpha: 0.13, noStroke: true },
            { k: 'axes', tx: [2, 4], ty: [2, 4] },
            { k: 'line', m: -1, n: 4, a: -1.5, b: 5.5, c: 'b', label: 'x+y=4', lat: [3.3, 1.35] },
            { k: 'label', at: [2.75, 0.55], text: 'x+y≦4', size: 22, c: 'b' }] }] },
      { ask: { type: 'choice', q: '対偶「□ $\\Rightarrow\\ x+y\\le4$」の □ に入るのは？',
        opts: ['$x\\le2$ かつ $y\\le2$', '$x\\le2$ または $y\\le2$', '$x<2$ かつ $y<2$', '$x>2$ かつ $y>2$'], ok: 0,
        why: { 1: '「または」の否定は「かつ」（ド・モルガンの法則）。', 2: '$x>2$ の否定は $x\\le2$（2 もふくむ）。', 3: '結論は否定します。$x>2$ の否定は $x\\le2$。' },
        good: '「$x>2$ または $y>2$」の否定は「$x\\le2$ かつ $y\\le2$」。',
        add: [{ t: 'm', tex: '\\ans{\\text{対偶}}\\ \\ x\\le2\\ \\text{かつ}\\ y\\le2\\ \\Rightarrow\\ x+y\\le4' }] } },
      { say: '対偶は明らかに真。$x\\le2$ と $y\\le2$ を足せば $x+y\\le4$ です。だから、もとの命題も **真**。次の時間は、この方法を **証明** に使います。',
        draw: [{ fig: 'xy', items: [
          { k: 'poly', pts: [[-1.5, -1.5], [2, -1.5], [2, 2], [-1.5, 2]], close: true, fill: 'p', alpha: 0.3, noStroke: true },
          { k: 'seg', a: [2, -1.5], b: [2, 2], c: 'p', wd: 3 }, { k: 'seg', a: [-1.5, 2], b: [2, 2], c: 'p', wd: 3 },
          { k: 'label', at: [2.35, 2.75], text: 'x≦2 かつ y≦2', size: 20, c: 'p', anchor: 'start' }] }],
        add: [{ t: 'm', tex: 'x\\le2,\\ y\\le2\\ \\text{を足すと}\\ \\ x+y\\le4', note: '対偶は真' },
          { t: 'ans', label: '答', text: '対偶が真なので、もとの命題も **真**' }] },

      // ---------- もう1問 ----------
      { clear: true, cols: [1], part: 'もう1問', say: '「$\\ne$」をふくむ命題は、そのままだと考えにくいことがあります。対偶にすると「$=$」になります。',
        add: [{ t: 'h', text: 'もう1問' },
          { t: 'm', tex: '\\hy{\\text{命題}}\\ \\ x^2\\ne9\\ \\Rightarrow\\ x\\ne3' }] },
      { ask: { type: 'think', q: '命題「$x^2\\ne9\\Rightarrow x\\ne3$」の真偽を、対偶を使って調べよう。また、逆の真偽は？',
        hint: '対偶は「$x=3\\Rightarrow x^2=9$」。逆は「$x\\ne3\\Rightarrow x^2\\ne9$」。',
        ans: '対偶「$x=3\\Rightarrow x^2=9$」は真なので、もとの命題も **真**\n逆「$x\\ne3\\Rightarrow x^2\\ne9$」は **偽**（反例 $x=-3$）',
        after: '「$\\ne$」の命題は、対偶にすると「$=$」になって調べやすくなります。',
        add: [{ t: 'm', tex: '\\ans{\\text{対偶}}\\ \\ x=3\\ \\Rightarrow\\ x^2=9', note: '真 → もとの命題も真' },
          { t: 'm', tex: '\\hb{\\text{逆}}\\ \\ x\\ne3\\ \\Rightarrow\\ x^2\\ne9', note: '偽（反例 $x=-3$）' }] } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。次の時間は、対偶を使った証明と、**背理法** による証明を学びます。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
