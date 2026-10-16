/* 数学Ⅱ 第3章 三角関数 ①：一般角
   動径・始線、正の角・負の角、α+360°×n、第何象限の角。例はすべて自作。
   角の計算（1000°・−500°・560°・−250°・−270°・130° の同じ動径）は python3 で検算ずみ。 */
(function () {
  const POINTS = [
    '点 O のまわりを回る半直線 OP を **動径**、はじめの位置の半直線 OX を **始線** という。反時計まわりが正の向き、時計まわりが負の向きで、回転の量として $360^\\circ$ をこえる角・負の角も考える',
    '動径 OP と始線 OX のなす角の1つを $\\alpha$ とすると、OP の表す角は　$\\theta=\\alpha+360^\\circ\\times n$（$n$ は整数）。これを **一般角** という',
    '$360^\\circ$ を足したり引いたりして $0^\\circ\\le\\alpha<360^\\circ$ にそろえ、動径のある象限で **第何象限の角** かを決める（動径が軸の上なら、どの象限の角でもない）'
  ];
  const D = Math.PI / 180, at = (deg, r) => [+(r * Math.cos(deg * D)).toFixed(4), +(r * Math.sin(deg * D)).toFixed(4)];
  // 回転の矢印（a1 → a2 度）。半径 r0 から、1回転で dr ずつ外へ広がるうずまき
  const turn = (a1, a2, r0, c, o) => {
    o = o || {}; const span = Math.abs(a2 - a1), n = Math.max(16, Math.ceil(span / 4)), dr = (o.dr != null ? o.dr : 0.13) * span / 360, pts = [];
    for (let i = 0; i <= n; i++) pts.push(at(a1 + (a2 - a1) * i / n, r0 + dr * i / n));
    const sg = a2 > a1 ? 1 : -1, bk = Math.min(16, span / 3), pre = at(a2 - sg * bk, r0 + dr * (1 - bk / span));
    return [{ k: 'poly', pts, c, wd: 3, dash: o.dash }, { k: 'seg', a: pre, b: pts[n], c, wd: 3, arrow: true }];
  };
  const ray = (deg, c, o) => { o = o || {}; const p = at(deg, o.r || 1.2); return [{ k: 'seg', a: [0, 0], b: p, c: c || 'b', wd: 4, dash: o.dash }, { k: 'pt', at: p, name: o.name, dir: o.dir || 'ne', c: c || 'b', r: 6, size: 24 }]; };
  // 始線だけの図（座標軸なし）
  const start = (id, items) => ({ t: 'fig', id, col: 1, view: [-1.5, -1.35, 1.5, 1.35], w: 540, h: 486, items: [
    { k: 'seg', a: [0, 0], b: [1.42, 0], c: 'y', wd: 4 }, { k: 'label', at: [1.42, 0], text: 'X', c: 'y', size: 24, dx: 4, dy: 24 },
    { k: 'pt', at: [0, 0], name: 'O', dir: 'sw', r: 5 }].concat(items) });
  // 座標平面（x 軸の正の部分が始線）
  const plane = (id, items) => ({ t: 'fig', id, col: 1, view: [-1.5, -1.35, 1.5, 1.35], w: 540, h: 486, items: [{ k: 'axes', tx: [], ty: [] }].concat(items) });
  const quad = [
    { k: 'label', at: [0.78, 0.98], text: '第1象限', c: 'd', size: 22 }, { k: 'label', at: [-0.78, 0.98], text: '第2象限', c: 'd', size: 22 },
    { k: 'label', at: [-0.78, -1.0], text: '第3象限', c: 'd', size: 22 }, { k: 'label', at: [0.78, -1.0], text: '第4象限', c: 'd', size: 22 }];

  HB.lesson({
    id: 'm2c-01', field: '数学Ⅱ　三角関数', title: '一般角', level: '三角関数', time: '目安 7分', noDec: true,
    problem: { label: '例題', lead: 'この時間の例題',
      parts: ['(1)　$-300^\\circ$ の動径と同じ位置にくる、$0^\\circ$ 以上 $360^\\circ$ 未満の角', '(2)　$1000^\\circ$ を $\\alpha+360^\\circ\\times n$（$0^\\circ\\le\\alpha<360^\\circ$、$n$ は整数）の形で表せ', '(3)　$-500^\\circ$、$560^\\circ$、$-250^\\circ$、$-270^\\circ$ は、それぞれ第何象限の角か', '(4)　$-720^\\circ\\le\\theta<720^\\circ$ で、動径が $130^\\circ$ の動径と同じ位置にくる角'] },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: 'めあて', say: '数学Ⅰの三角比では、角は $0^\\circ$ から $180^\\circ$ まででした。三角関数の章のはじめに、角を **回転の量** と考えて、$360^\\circ$ をこえる角や負の角まで広げます。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '回転の向きと量で角を考え、$360^\\circ$ をこえる角・負の角（**一般角**）を表せる\n動径の位置から、第何象限の角かがわかる' }] },

      // ---------- 動径と始線 ----------
      { clear: true, part: '動径と始線', say: '点 O のまわりに半直線 OP を回転させます。回転する半直線 OP を **動径**、回転のはじめの位置にある半直線 OX を **始線** といいます。',
        add: [{ t: 'h', text: '動径と始線' },
          { t: 'p', size: 'sm', text: '・**始線** … はじめの位置の半直線 OX\n・**動径** … O のまわりを回る半直線 OP' },
          start('f1', ray(60, 'b', { name: 'P' }).concat(turn(0, 60, 0.4, 'g'), [{ k: 'label', at: at(30, 0.56), text: '60°', c: 'g', size: 24 }]))] },
      { say: '反時計まわりを **正の向き**、時計まわりを **負の向き** といいます。正の向きに回った角は正の角、負の向きに $60^\\circ$ 回った角は $-60^\\circ$ と、負の角で表します。',
        add: [{ t: 'box', c: 'b', label: '回転の向き', text: '反時計まわり（正の向き）→ 正の角\n時計まわり（負の向き）　→ 負の角' }],
        draw: [{ fig: 'f1', items: ray(-60, 'p', { name: 'P′', dir: 'se' }).concat(turn(0, -60, 0.4, 'p'), [{ k: 'label', at: at(-30, 0.6), text: '−60°', c: 'p', size: 24 }]) }] },

      // ---------- 360° をこえる角 ----------
      { clear: true, part: '360° をこえる角', say: '1回転は $360^\\circ$ です。$420^\\circ$ は、1回転して さらに $60^\\circ$ 回った角。だから、$420^\\circ$ の動径は $60^\\circ$ の動径と同じ位置にきます。',
        add: [{ t: 'h', text: '$360^\\circ$ をこえる角' },
          { t: 'm', tex: '420^\\circ=60^\\circ+360^\\circ', note: '1回転して、\nさらに $60^\\circ$' },
          start('f2', ray(60, 'b', { name: 'P' }).concat(turn(0, 420, 0.24, 'g'), [{ k: 'label', at: at(110, 0.46), text: '420°', c: 'g', size: 24 }]))] },
      { ask: { type: 'choice', q: '$-300^\\circ$ の動径は、どの角の動径と同じ位置にくる？',
        opts: ['$60^\\circ$', '$300^\\circ$', '$-60^\\circ$', '$120^\\circ$'], ok: 0,
        why: { 1: '$-300^\\circ$ は時計まわりに $300^\\circ$。反時計まわりの $300^\\circ$ とは、回る向きが反対です。', 2: '$-60^\\circ$ は時計まわりに $60^\\circ$ だけ。$300^\\circ$ 回ると、1回転まであと $60^\\circ$ の位置です。', 3: '$-300^\\circ+360^\\circ=60^\\circ$ です。$120^\\circ$ にはなりません。' },
        good: '時計まわりに $300^\\circ$ 回ると、1回転まであと $60^\\circ$。$-300^\\circ+360^\\circ=60^\\circ$ と同じ位置です。',
        add: [{ t: 'm', tex: '-300^\\circ=60^\\circ-360^\\circ', note: '時計まわりに $300^\\circ$' }],
        draw: [{ fig: 'f2', items: turn(0, -300, 0.62, 'p', { dr: 0.06 }).concat([{ k: 'label', at: at(-148, 0.98), text: '−300°', c: 'p', size: 24 }]) }] } },

      // ---------- 一般角 ----------
      { clear: true, part: '一般角', say: '$60^\\circ$、$420^\\circ$、$-300^\\circ$ の動径は、どれも同じ位置でした。動径の位置が同じ角は、$360^\\circ$ の整数倍ずつちがいます。',
        add: [{ t: 'h', text: '一般角' },
          { t: 'm', size: 'sm', tex: '\\cdots,\\ -660^\\circ,\\ -300^\\circ,\\ \\hy{60^\\circ},\\ 420^\\circ,\\ 780^\\circ,\\ \\cdots', note: '$360^\\circ$ ずつ\nちがう' },
          start('f3', ray(40, 'b', { name: 'P' }).concat(turn(0, 40, 0.3, 'y'), turn(0, 400, 0.52, 'g', { dash: true, dr: 0.1 }),
            [{ k: 'label', at: at(18, 0.42), text: 'α', c: 'y', size: 26 }, { k: 'label', at: at(135, 0.98), text: 'α+360°', c: 'g', size: 22 }]))] },
      { say: '動径 OP と始線 OX のなす角の1つを $\\alpha$ とすると、OP の表す角は $\\alpha+360^\\circ\\times n$（$n$ は整数）。これを、動径 OP の表す **一般角** といいます。',
        add: [{ t: 'box', c: 'y', size: 'sm', label: '一般角', text: '動径 OP と始線 OX のなす角の1つを $\\alpha$ として\n$\\theta=\\alpha+360^\\circ\\times n$　（$n$ は整数）' }] },
      { ask: { type: 'choice', q: '$1000^\\circ$ を $\\alpha+360^\\circ\\times n$（$0^\\circ\\le\\alpha<360^\\circ$、$n$ は整数）の形で表すと？',
        opts: ['$640^\\circ+360^\\circ\\times1$', '$-80^\\circ+360^\\circ\\times3$', '$280^\\circ+360^\\circ\\times3$', '$280^\\circ+360^\\circ\\times2$'], ok: 3,
        why: { 0: '$640^\\circ$ は $360^\\circ$ 以上です。もう1回 $360^\\circ$ を引けます。', 1: '式は正しいのですが、$\\alpha=-80^\\circ$ は $0^\\circ\\le\\alpha<360^\\circ$ に入りません。', 2: '$280^\\circ+1080^\\circ=1360^\\circ$ です。$n$ の数えまちがい。' },
        good: '$1000^\\circ-360^\\circ\\times2=280^\\circ$。だから $1000^\\circ=280^\\circ+360^\\circ\\times2$ です。',
        add: [{ t: 'm', tex: '1000^\\circ=\\ans{280^\\circ}+360^\\circ\\times2', note: '$360^\\circ$ を2回引く' }] } },

      // ---------- 第何象限の角 ----------
      { clear: true, part: '第何象限の角', say: '座標平面で、原点を O、x 軸の正の部分を始線にします。動径が第1象限にあれば **第1象限の角**、第3象限にあれば **第3象限の角** といいます。',
        add: [{ t: 'h', text: '第何象限の角' },
          { t: 'p', size: 'sm', text: '原点が O、**x 軸の正の部分** が始線\n動径が第3象限にある → **第3象限の角**' },
          { t: 'p', size: 'xs', text: '$0^\\circ\\le\\alpha<360^\\circ$ の角に直すと、わかりやすい\n動径が軸の上にあるときは、どの象限の角でもない' },
          plane('f4', quad)] },
      { ask: { type: 'choice', q: '$-500^\\circ$ は第何象限の角？',
        opts: ['第1象限', '第2象限', '第3象限', '第4象限'], ok: 2,
        why: { 0: '時計まわりに $500^\\circ$（1回転と $140^\\circ$）回ります。第1象限には止まりません。', 1: '$500^\\circ-360^\\circ=140^\\circ$ と、負の符号をわすれています。', 3: '$-140^\\circ$ は時計まわりに $90^\\circ$ をこえるので、第4象限を通りすぎて第3象限です。' },
        good: '$-500^\\circ+360^\\circ\\times2=220^\\circ$。$220^\\circ$ は $180^\\circ$ と $270^\\circ$ の間なので、第3象限の角です。',
        add: [{ t: 'm', tex: '-500^\\circ=\\ans{220^\\circ}+360^\\circ\\times(-2)' }],
        draw: [{ fig: 'f4', items: ray(220, 'b', { name: 'P', dir: 'sw' }).concat(turn(0, -500, 0.4, 'p', { dr: 0.16 }), [{ k: 'label', at: at(-38, 0.86), text: '−500°', c: 'p', size: 24 }]) }] } },
      { ask: { type: 'think', q: '次の角は第何象限の角？　(1) $560^\\circ$　(2) $-250^\\circ$',
        hint: '$360^\\circ$ を足したり引いたりして、$0^\\circ\\le\\alpha<360^\\circ$ の角に直してから考える。',
        ans: '(1) $560^\\circ=200^\\circ+360^\\circ$ より **第3象限**　(2) $-250^\\circ=110^\\circ-360^\\circ$ より **第2象限**',
        after: '負の角は、$360^\\circ$ を足して正の角に直すと、位置がつかみやすくなります。',
        add: [{ t: 'm', size: 'sm', tex: '560^\\circ=200^\\circ+360^\\circ', note: '第3象限' }, { t: 'm', size: 'sm', tex: '-250^\\circ=110^\\circ-360^\\circ', note: '第2象限' }] } },
      { ask: { type: 'choice', q: '$-270^\\circ$ は第何象限の角？',
        opts: ['第1象限', '第4象限', '第3象限', 'どの象限の角でもない'], ok: 3,
        why: { 0: '$-270^\\circ+360^\\circ=90^\\circ$。動径は y 軸の正の部分の上で、第1象限の中ではありません。', 1: '時計まわりに $270^\\circ$ 回ると、第4・第3・第2象限を通りすぎて y 軸の上にきます。', 2: '$-270^\\circ$ は $-180^\\circ$ より先まで回っています。$90^\\circ$ と同じ位置です。' },
        good: '$-270^\\circ+360^\\circ=90^\\circ$。動径は y 軸の上にあるので、どの象限の角でもありません。' } },

      // ---------- 練習 ----------
      { clear: true, part: '練習', add: [{ t: 'h', text: '練習　同じ位置の動径' },
          { t: 'p', size: 'sm', text: '$130^\\circ+360^\\circ\\times n$ の $n$ に、\n整数を順に入れていく' },
          plane('f5', ray(130, 'b', { name: '130°', dir: 'nw' }))],
        ask: { type: 'think', q: '$-720^\\circ\\le\\theta<720^\\circ$ の範囲で、動径が $130^\\circ$ の動径と同じ位置にくる角 $\\theta$ をすべて求めよう。',
          hint: '$\\theta=130^\\circ+360^\\circ\\times n$。$n=0,\\ 1,\\ -1,\\ -2,\\ \\cdots$ と入れて、範囲に入るものをさがす。',
          ans: '$\\theta=-590^\\circ,\\ -230^\\circ,\\ 130^\\circ,\\ 490^\\circ$',
          after: '$n=2$ だと $850^\\circ$、$n=-3$ だと $-950^\\circ$ で、範囲の外です。',
          add: [{ t: 'm', size: 'sm', tex: 'n=-2,\\ -1,\\ 0,\\ 1\\ \\text{のとき}' },
            { t: 'ans', label: '答', tex: '\\theta=-590^\\circ,\\ -230^\\circ,\\ 130^\\circ,\\ 490^\\circ' }] } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。次の時間は、角を半径と弧の長さの比で表す **弧度法** を学びます。三角関数では、こちらの表し方が基本になります。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
