/* 数学Ⅰ 第4章 図形と計量 三角比 ③：三角比の利用 ― 高さや距離を求める
   場面・数値はすべて自作（校舎 15 m・仰角 30°・目の高さ 1.5 m／がけ 30 m・俯角 25°／坂道 8°・200 m・高さ 50 m）。
   答え・誤答・図の座標（三角形の頂点）は python3（math）で検算ずみ。表の値は小数第5位を四捨五入。 */
(function () {
  const POINTS = [
    '**仰角**＝水平の向きから見上げた角、**俯角**＝水平の向きから見下ろした角。どちらも **水平線** から測る',
    '図の中に直角三角形を見つけ、わかっている辺と求める辺が、角から見て何かで三角比を選ぶ（対辺＝隣辺×tan、対辺＝斜辺×sin、隣辺＝斜辺×cos）',
    '目の高さを足しわすれない。俯角は、平行線の **錯角** で三角形の中の角に移す。近似値の四捨五入は最後に1回'
  ];
  const S3 = Math.sqrt(3), TOP = 1.5 + 15 / S3;   // 校舎の高さ（目の高さ 1.5 m ＋ 15 tan30°）
  const DS = 30 / Math.tan(25 * Math.PI / 180);    // がけの真下から船まで（30 ÷ tan25°）
  const C8 = 200 * Math.cos(8 * Math.PI / 180), S8 = 200 * Math.sin(8 * Math.PI / 180);

  HB.lesson({
    id: 'm1d-03', field: '数学Ⅰ　図形と計量', title: '三角比の利用 ― 高さや距離を求める', level: '三角比', time: '目安 8分',
    problem: { label: '例題', lead: '答えは小数第1位まで。三角比の表の値（小数第4位まで）と $\\sqrt3=1.732$ を使う。',
      parts: ['(1)　校舎から 15 m はなれた所で、屋上のはしを見上げた仰角が $30^\\circ$。目の高さが 1.5 m のとき、校舎の高さ', '(2)　海面から高さ 30 m のがけの上から、船を見下ろした俯角が $25^\\circ$。がけの真下から船までの距離', '(3)　傾き $8^\\circ$ の坂道を 200 m 進んだときの、水平方向の距離と高さ', '(4)　(3) の坂道で、高さ 50 m まで登るときに進む道のり'] },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: 'めあて', say: '前の時間までに、三角比の値と表の使い方を学びました。この時間は、直接はかれない **高さや距離** を、三角比で求めます。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '仰角・俯角の意味がわかり、図に直角三角形を見つけて\n高さや距離を三角比で求められる' }] },

      // ---------- 仰角と俯角 ----------
      { clear: true, part: '仰角と俯角', say: '物を見上げるとき、**水平の向き** と見る向きがつくる角を **仰角**、見下ろすときの角を **俯角** といいます。どちらも水平線から測ります。',
        add: [{ t: 'h', text: '仰角と俯角' },
          { t: 'p', size: 'sm', text: '[[y:**仰角**]]：水平の向きから、**見上げた** 角\n[[b:**俯角**]]：水平の向きから、**見下ろした** 角' },
          { t: 'fig', id: 'fa', col: 1, view: [-1.3, -2.9, 7.3, 3.1], w: 580, h: 405, items: [
            { k: 'seg', a: [0, 0], b: [6.8, 0], dash: true, c: 'd' },
            { k: 'label', at: [6.8, 0], text: '水平', size: 22, anchor: 'end', dy: -20, c: 'd' },
            { k: 'seg', a: [0, 0], b: [5.4, 2.5], c: 'y', arrow: true },
            { k: 'seg', a: [0, 0], b: [5.4, -2.1], c: 'b', arrow: true },
            { k: 'angle', o: [0, 0], a: [6, 0], b: [5.4, 2.5], rp: 92, label: '仰角', lr: 44, c: 'y', size: 24 },
            { k: 'angle', o: [0, 0], a: [6, 0], b: [5.4, -2.1], rp: 92, label: '俯角', lr: 44, c: 'b', size: 24 },
            { k: 'label', at: [5.4, 2.5], text: '見上げる', size: 22, c: 'y', anchor: 'end', dx: -6, dy: -26 },
            { k: 'label', at: [5.4, -2.1], text: '見下ろす', size: 22, c: 'b', anchor: 'end', dx: -6, dy: 26 },
            { k: 'pt', at: [0, 0], name: '目', dir: 'w', r: 6 }] }] },
      { ask: { type: 'choice', q: 'ビルの屋上から、地上の車を見下ろします。**俯角が大きい** のは、車がビルに近いとき？遠いとき？',
        opts: ['近いとき', '遠いとき', '距離に関係なく同じ'], ok: 0,
        why: { 1: '遠くの車ほど、水平に近い向きに見えます。俯角は小さくなります。', 2: '車の位置で見下ろす向きが変わるので、俯角も変わります。' },
        good: '近いほど真下に近い向きに見下ろすので、俯角は大きくなります（真下なら $90^\\circ$）。' } },

      // ---------- 例題1 ----------
      { clear: true, part: '例題1　高さ', say: '例題1。校舎から 15 m はなれた所に立って、屋上のはし T を見上げると、仰角が $30^\\circ$ でした。目の高さは 1.5 m。校舎の高さを求めます。',
        add: [{ t: 'h', text: '例題1　校舎の高さ' },
          { t: 'p', size: 'sm', text: '目 E から水平に引いた線と、校舎の交点を H とする\n直角三角形 ETH で　$EH=15$、$\\angle TEH=30^\\circ$' },
          { t: 'fig', id: 'fb', col: 1, view: [-3.4, -2.6, 20.2, 12.2], w: 600, h: 376, items: [
            { k: 'seg', a: [-2, 0], b: [19.8, 0], c: 'd', wd: 2.5 },
            { k: 'poly', pts: [[15, 0], [18.2, 0], [18.2, TOP], [15, TOP]], close: true, fill: 'w', alpha: 0.08 },
            { k: 'seg', a: [0, 0], b: [0, 1.5], wd: 5 },
            { k: 'seg', a: [0, 1.5], b: [15, 1.5], dash: true, c: 'b' },
            { k: 'seg', a: [0, 1.5], b: [15, TOP], c: 'y' },
            { k: 'seg', a: [15, 1.5], b: [15, TOP], c: 'p', wd: 5 },
            { k: 'right', o: [15, 1.5], a: [0, 1.5], b: [15, TOP], s: 18 },
            { k: 'angle', o: [0, 1.5], a: [15, 1.5], b: [15, TOP], rp: 74, label: '30°', lr: 30, size: 24, c: 'y' },
            { k: 'dim', a: [0, 0], b: [15, 0], dy: 26 }, { k: 'label', at: [7.5, 0], text: '15 m', size: 22, dy: 48, plain: true },
            { k: 'label', at: [0, 0.75], text: '1.5 m', size: 22, anchor: 'end', dx: -12, plain: true },
            { k: 'pt', at: [0, 1.5], name: 'E', dir: 'nw', r: 5 }, { k: 'pt', at: [15, TOP], name: 'T', dir: 'nw', r: 5 }, { k: 'pt', at: [15, 1.5], name: 'H', dir: 'se', r: 4 }] }] },
      { ask: { type: 'choice', q: '$TH$ を求めるのに使う三角比は？',
        opts: ['$\\sin30^\\circ$', '$\\cos30^\\circ$', '$\\tan30^\\circ$', '三角比では求められない'], ok: 2,
        why: { 0: 'sin は対辺と **斜辺** の比。斜辺 ET の長さはわかっていません。', 1: 'cos は隣辺と斜辺の比。TH が出てきません。', 3: '直角三角形 ETH の1辺と1つの鋭角がわかれば、ほかの辺は求められます。' },
        good: 'E から見て、TH は対辺、EH＝15 は隣辺。対辺と隣辺の比は $\\tan$ です。',
        add: [{ t: 'm', tex: '\\tan30^\\circ=\\frac{TH}{EH}=\\frac{TH}{15}', note: '対辺 ÷ 隣辺' }] } },
      { say: '$TH=15\\tan30^\\circ=15\\times\\dfrac{1}{\\sqrt3}=5\\sqrt3$。これは **目の高さより上** の部分です。校舎の高さは、目の高さ 1.5 m を足します。',
        add: [{ t: 'm', style: 'margin-top:8px', tex: 'TH=15\\tan30^\\circ=\\frac{15}{\\sqrt3}=5\\sqrt3' }] },
      { ask: { type: 'choice', q: '校舎の高さは、小数第1位までで何 m？（$\\sqrt3=1.732$）',
        opts: ['$8.7$ m', '$10.2$ m', '$9.0$ m', '$27.5$ m'], ok: 1,
        why: { 0: 'それは $TH=5\\sqrt3\\fallingdotseq8.66$ だけ。目の高さ 1.5 m を足します。', 2: '$15\\sin30^\\circ+1.5$ です。15 m は斜辺ではなく隣辺。', 3: '$15\\tan60^\\circ+1.5$ です。E の角は $30^\\circ$。' },
        good: '$5\\sqrt3+1.5=8.660+1.5=10.160$ より、およそ 10.2 m。',
        add: [{ t: 'm', style: 'margin-top:8px', tex: '5\\sqrt3+1.5=8.660+1.5\\fallingdotseq\\ans{10.2}\\ \\text{(m)}' }] } },

      // ---------- 例題2 ----------
      { clear: true, part: '例題2　俯角', say: '例題2。海面から高さ 30 m のがけの上 P から、沖の船 S を見下ろすと、俯角が $25^\\circ$ でした。がけの真下 F から船までの距離 FS を求めます。',
        add: [{ t: 'h', text: '例題2　がけの下から船までの距離' },
          { t: 'p', size: 'sm', text: '直角三角形 PFS で　$PF=30$、$\\angle F=90^\\circ$\n俯角 $25^\\circ$ は、三角形の **外** の角' },
          { t: 'fig', id: 'fc', col: 1, view: [-11, -8, 75, 38], w: 600, h: 321, items: [
            { k: 'poly', pts: [[-10, 0], [0, 0], [0, 30], [-10, 30]], close: true, fill: 'w', alpha: 0.08, noStroke: true },
            { k: 'seg', a: [-10, 30], b: [0, 30], wd: 2.5 }, { k: 'seg', a: [0, 0], b: [0, 30] },
            { k: 'seg', a: [0, 0], b: [74, 0], c: 'b', wd: 2.5 },
            { k: 'seg', a: [0, 30], b: [66, 30], dash: true, c: 'd' },
            { k: 'label', at: [66, 30], text: '水平', size: 22, anchor: 'end', dy: -20, c: 'd' },
            { k: 'seg', a: [0, 30], b: [DS, 0], c: 'y' },
            { k: 'right', o: [0, 0], a: [0, 30], b: [DS, 0], s: 18 },
            { k: 'angle', o: [0, 30], a: [40, 30], b: [DS, 0], rp: 82, label: '25°', lr: 30, size: 24, c: 'b' },
            { k: 'label', at: [0, 15], text: '30 m', size: 24, anchor: 'start', dx: 12, plain: true },
            { k: 'pt', at: [0, 30], name: 'P', dir: 'nw', r: 5 }, { k: 'pt', at: [0, 0], name: 'F', dir: 's', off: 26, r: 4 }, { k: 'pt', at: [DS, 0], name: 'S（船）', dir: 's', off: 26, r: 6 }] }] },
      { ask: { type: 'choice', q: '三角形 PFS の、**角 S（$\\angle PSF$）** の大きさは？',
        opts: ['$65^\\circ$', '$25^\\circ$', '$90^\\circ$', 'これだけではわからない'], ok: 1,
        why: { 0: '$65^\\circ$ は角 P（$\\angle FPS=90^\\circ-25^\\circ$）です。', 2: '直角は F の角です。', 3: '水平線と海面は平行なので、錯角を使って決まります。' },
        good: '水平線と海面は **平行**。俯角 $25^\\circ$ と $\\angle PSF$ は錯角なので等しく、$25^\\circ$。',
        draw: [{ fig: 'fc', items: [{ k: 'angle', o: [DS, 0], a: [0, 30], b: [0, 0], rp: 82, label: '25°', lr: 30, size: 24, c: 'p' }] }],
        add: [{ t: 'p', size: 'sm', text: '錯角で　$\\angle PSF=25^\\circ$' }] } },
      { say: 'S から見ると、$PF=30$ は **対辺**、FS は **隣辺**。tan の式をつくって、FS について解きます。わる計算になることに注意。',
        add: [{ t: 'm', tex: '\\tan25^\\circ=\\frac{PF}{FS}=\\frac{30}{FS}' },
          { t: 'm', style: 'margin-top:8px', tex: 'FS=\\frac{30}{\\tan25^\\circ}=\\frac{30}{0.4663}\\fallingdotseq\\ans{64.3}\\ \\text{(m)}' },
          { t: 'p', size: 'xs', text: '別解：$\\angle P=65^\\circ$ から　$FS=30\\tan65^\\circ=30\\times2.1445\\fallingdotseq64.3$' }] },

      // ---------- 例題3 ----------
      { clear: true, cols: [0.45, 0.55], part: '例題3　坂道', say: '例題3。傾きが $8^\\circ$ のまっすぐな坂道を、200 m 進みます。水平方向に何 m 進み、何 m 高くなるでしょう。坂道が **斜辺** になります。',
        add: [{ t: 'h', text: '例題3　坂道の水平距離と高さ' },
          { t: 'tbl', cls: 'rowh', size: 'sm', rows: [['$\\theta$', '$\\sin\\theta$', '$\\cos\\theta$', '$\\tan\\theta$'], ['$8^\\circ$', '0.1392', '0.9903', '0.1405']] },
          { t: 'fig', id: 'fd', col: 1, view: [-16, -18, 226, 48], w: 780, h: 213, items: [
            { k: 'poly', pts: [[0, 0], [C8, 0], [C8, S8]], close: true, fill: 'w', alpha: 0.06 },
            { k: 'seg', a: [0, 0], b: [C8, S8], c: 'y', wd: 4 },
            { k: 'right', o: [C8, 0], a: [0, 0], b: [C8, S8], s: 16 },
            { k: 'angle', o: [0, 0], a: [C8, 0], b: [C8, S8], rp: 130, label: '8°', lr: 26, size: 24, c: 'y' },
            { k: 'label', at: [C8 / 2, S8 / 2], text: '200 m', c: 'y', size: 24, dy: -26, plain: true },
            { k: 'label', at: [C8 / 2 + 30, 0], text: '水平の距離', c: 'b', size: 22, dy: 26 },
            { k: 'label', at: [C8, S8 / 2], text: '高さ', c: 'p', size: 22, anchor: 'start', dx: 12 }] }] },
      { ask: { type: 'think', q: '傾き $8^\\circ$ の坂道を 200 m 進むと、水平方向に何 m 進み、何 m 高くなる？（小数第1位まで）',
        hint: '坂道 200 m が斜辺。水平の距離は隣辺（cos）、高さは対辺（sin）。',
        ans: '水平の距離 $200\\cos8^\\circ=200\\times0.9903=198.06$ より約 198.1 m、高さ $200\\sin8^\\circ=200\\times0.1392=27.84$ より約 27.8 m',
        after: '斜辺がわかっているときは、隣辺＝斜辺×cos、対辺＝斜辺×sin。',
        add: [{ t: 'm', size: 'sm', tex: '\\text{水平}\\ 200\\cos8^\\circ=198.06\\fallingdotseq\\ans{198.1}\\ \\text{(m)}' },
          { t: 'm', size: 'sm', tex: '\\text{高さ}\\ 200\\sin8^\\circ=27.84\\fallingdotseq\\ans{27.8}\\ \\text{(m)}' }] } },
      { ask: { type: 'choice', q: '同じ坂道を、**高さ 50 m** まで登るには、坂道を何 m 進む？（小数第1位まで）',
        opts: ['$7.0$ m', '$50.5$ m', '$355.9$ m', '$359.2$ m'], ok: 3,
        why: { 0: '$50\\sin8^\\circ$ と、かけています。斜辺を求めるので、$50\\div\\sin8^\\circ$。', 1: '$50\\div\\cos8^\\circ$ です。高さは対辺なので sin を使います。', 2: '$50\\div\\tan8^\\circ$ は、水平の距離です。' },
        good: '$\\sin8^\\circ=\\dfrac{50}{x}$ より $x=\\dfrac{50}{0.1392}=359.19\\cdots$、およそ 359.2 m。',
        add: [{ t: 'm', size: 'sm', tex: '\\sin8^\\circ=\\frac{50}{x}\\ \\Rightarrow\\ x=\\frac{50}{0.1392}\\fallingdotseq\\ans{359.2}\\ \\text{(m)}' }] } },

      // ---------- 使い分け ----------
      { clear: true, part: '使い分け', say: 'どの三角比を使うかは、**わかっている辺** と **求める辺** が、角から見て何かで決まります。求める辺が分母にくるときは、わり算になります。',
        add: [{ t: 'h', text: 'どの三角比を使う？（角 $\\theta$ から見て）' },
          { t: 'tbl', cls: 'rowh', rows: [['わかっている辺', '求める辺', '式'], ['隣辺', '対辺', '隣辺 $\\times\\tan\\theta$'], ['斜辺', '対辺', '斜辺 $\\times\\sin\\theta$'], ['斜辺', '隣辺', '斜辺 $\\times\\cos\\theta$'], ['対辺', '斜辺', '対辺 $\\div\\sin\\theta$']] },
          { t: 'fig', id: 'fe', col: 1, view: [-1.1, -1.1, 7.1, 4.1], w: 560, h: 355, items: [
            { k: 'poly', pts: [[0, 0], [5, 0], [5, 3]], close: true, fill: 'w', alpha: 0.05, noStroke: true },
            { k: 'seg', a: [0, 0], b: [5, 3], c: 'y', wd: 4 }, { k: 'seg', a: [5, 3], b: [5, 0], c: 'p', wd: 4 }, { k: 'seg', a: [5, 0], b: [0, 0], c: 'b', wd: 4 },
            { k: 'right', o: [5, 0], a: [0, 0], b: [5, 3], s: 20 },
            { k: 'angle', o: [0, 0], a: [5, 0], b: [5, 3], rp: 46, label: 'θ', size: 26 },
            { k: 'label', at: [2.5 - 0.28, 1.5 + 0.47], text: '斜辺', c: 'y', size: 26 },
            { k: 'label', at: [5, 1.5], text: '対辺', c: 'p', size: 26, anchor: 'start', dx: 18 },
            { k: 'label', at: [2.5, 0], text: '隣辺', c: 'b', size: 26, dy: 30 }] }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。次の時間は、$\\sin\\theta,\\ \\cos\\theta,\\ \\tan\\theta$ の間に成り立つ関係（相互関係）を調べます。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
