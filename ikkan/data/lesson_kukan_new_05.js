/* 空間図形（新しい形） 第5時：線や面を動かして、立体をつくろう。 kukan-05 と同じ内容の授業を、新しい形に組みかえた（見本 lesson_kukan_new_01.js）。
   ・ワークシートは A4 1枚（約12分）：問いは1つ（コインの積み重ねと、長方形の回転。どんな立体ができるか）。個人3分 → ペア3分 → ことば → 例題（4つの図形を回す）。
   ・演習プリントは表裏：表＝確かめる 2問・使ってみる 4問／裏＝ひろげる 1問（考えよう：直角三角形を斜辺を軸に回す。答えは載せない）・チャレンジ★★ 1問（軸からはなれた長方形を回す。ヒントカードつき）。 2:4:1:1 の8問。
   ・回転体の図（軸 ℓ の点線つき）は、このファイルの rot() で描く（kukan-05 と同じ）。
   ・小テストは kukan-05 と同じ。
   検算：node tools/verify.cjs kukan_new-05　／　見た目：node tools/check.cjs <出力先> kukan_new-05 */
(function () {
  const { M, K, B, G, F, C2, T, HD, BR, WD, MA, TB, SVG } = IK.b;
  const f2 = n => String(Math.round(n * 100) / 100);
  const INK = '#222';
  const pts2 = a => a.map(p => f2(p[0]) + ',' + f2(p[1])).join(' ');
  const head = (x, y, ang, s) => {   // 矢じり：先が (x, y)、進む向きが ang（画面の座標でのラジアン）
    s = s || 1.8; const a1 = ang + Math.PI * 0.85, a2 = ang - Math.PI * 0.85;
    return `<polygon points="${f2(x)},${f2(y)} ${f2(x + s * Math.cos(a1))},${f2(y + s * Math.sin(a1))} ${f2(x + s * Math.cos(a2))},${f2(y + s * Math.sin(a2))}" fill="${INK}"/>`;
  };

  /* 回転させる平面図形（軸 ℓ は縦の点線）。
     o.pts：図形の頂点 [x, y]（x＝軸からの横、y＝上向き）　o.semi：半円の半径（直径は軸の上）　o.dims：長さの字 [{ x, y, t, a, dx, dy }]（{{ }} で空欄）　o.cap：見出し */
  const rot = o => SVG((W, H, h) => {
    const xs = o.pts ? o.pts.map(p => p[0]) : [0, o.semi], ys = o.pts ? o.pts.map(p => p[1]) : [0, 2 * o.semi];
    const xmax = Math.max(...xs), ymax = Math.max(...ys), cap = o.cap ? 5 : 0;
    const padL = o.padL || 9, padR = o.padR || 9, padT = 5 + cap, padB = 7;
    const k = Math.min((W - padL - padR) / xmax, (H - padT - padB) / (ymax + 0.9));
    const X0 = padL + ((W - padL - padR) - xmax * k) / 2, X = x => X0 + x * k, Y = y => H - padB - (y + 0.3) * k;
    let out = '';
    if (o.cap) out += h.tx(W / 2, 3.6, h.svgMath(o.cap), 3, 'middle', ' class="cap"');
    out += h.ln(X0, Y(-0.3), X0, Y(ymax + 0.6), INK, 0.25, ' stroke-dasharray="1.2 0.9"');
    out += h.tx(X0 - 1.6, Y(ymax + 0.6) + 2.2, 'ℓ', 3.4, 'end', ' class="pl"');
    if (o.pts) out += `<polygon points="${pts2(o.pts.map(p => [X(p[0]), Y(p[1])]))}" fill="none" stroke="${INK}" stroke-width="0.32" stroke-linejoin="round"/>`;
    else out += `<path d="M${f2(X0)},${f2(Y(0))} A${f2(o.semi * k)},${f2(o.semi * k)} 0 0 0 ${f2(X0)},${f2(Y(2 * o.semi))} Z" fill="none" stroke="${INK}" stroke-width="0.32" stroke-linejoin="round"/>`;
    if (o.draw) out += o.draw(X, Y, k, h);
    (o.dims || []).forEach(d => { out += h.rich(X(d.x) + (d.dx || 0), Y(d.y) + (d.dy || 0), d.t, 2.9, d.a || 'middle'); });
    return out;
  });
  const radius = (x0, y0, x1, y1, X, Y) => `<line x1="${f2(X(x0))}" y1="${f2(Y(y0))}" x2="${f2(X(x1))}" y2="${f2(Y(y1))}" stroke="${INK}" stroke-width="0.22" stroke-dasharray="1.2 0.9"/>`;

  // 例題・演習・小テストで使う回転させる図形
  const fRect = (cap, w, ht, wt, st) => rot({ cap, pts: [[0, 0], [w, 0], [w, ht], [0, ht]], dims: [{ x: w / 2, y: 0, t: wt, dy: 4.6 }, { x: w, y: ht / 2, t: st, a: 'start', dx: 1.8, dy: 1 }] });
  const fTri = (cap, w, ht, wt, ht2, sl) => rot({ cap, pts: [[0, 0], [w, 0], [0, ht]], dims: [{ x: w / 2, y: 0, t: wt, dy: 4.6 }, { x: 0, y: ht / 2, t: ht2, a: 'end', dx: -1.8, dy: 1 }, { x: w / 2, y: ht / 2, t: sl, a: 'start', dx: 1.6, dy: -0.4 }] });
  const fSemi = (cap, r, t) => rot({ cap, semi: r, padL: 7, draw: (X, Y, k) => radius(0, r, r, r, X, Y), dims: [{ x: r / 2, y: r, t: t, dy: -1.6 }] });
  const fTrap = (cap, wl, wu, ht, tl, tu, th) => rot({ cap, pts: [[0, 0], [wl, 0], [wu, ht], [0, ht]], dims: [{ x: wl / 2, y: 0, t: tl, dy: 4.6 }, { x: wu / 2, y: ht, t: tu, dx: 3, dy: -1.8 }, { x: 0, y: ht / 2, t: th, a: 'end', dx: -1.8, dy: 1 }] });

  // 今日の問いの図：コインを積み重ねる／長方形を回す
  const coins = () => SVG((W, H, h) => {
    const n = 5, rx = 10, ry = 3.1, t = 3.8, cx = W * 0.42, yB = H - 7 - ry;
    let out = h.tx(W / 2, 3.6, '① コインを、まっすぐ上に積み重ねる', 3, 'middle', ' class="cap"');
    for (let k = 0; k < n; k++) {
      const yb = yB - k * t, yt = yb - t;
      out += `<path d="M${f2(cx - rx)},${f2(yt)} L${f2(cx - rx)},${f2(yb)} A${rx},${ry} 0 0 0 ${f2(cx + rx)},${f2(yb)} L${f2(cx + rx)},${f2(yt)} Z" fill="#fff" stroke="${INK}" stroke-width="0.32" stroke-linejoin="round"/>`;
      out += `<ellipse cx="${f2(cx)}" cy="${f2(yt)}" rx="${rx}" ry="${ry}" fill="#fff" stroke="${INK}" stroke-width="0.32"/>`;
    }
    const ax = cx + rx + 9, y1 = yB, y2 = yB - n * t - 2;
    out += h.ln(ax, y1, ax, y2 + 1, INK, 0.4) + head(ax, y2, -Math.PI / 2, 2.2);
    return out;
  });
  const spin = () => SVG((W, H, h) => {
    const ax = W * 0.36, rw = 13, rh = 21, yb = H - 6, yt = yb - rh, ry = rw * 0.3;
    let out = h.tx(W / 2, 3.6, '② 長方形を、軸のまわりに1回転させる', 3, 'middle', ' class="cap"');
    out += h.ln(ax, yb + 3, ax, yt - 6, INK, 0.25, ' stroke-dasharray="1.2 0.9"');
    out += h.tx(ax + 1.6, yt - 6.4, 'ℓ', 3.4, 'start', ' class="pl"');
    out += `<ellipse cx="${f2(ax)}" cy="${f2(yt)}" rx="${rw}" ry="${f2(ry)}" fill="none" stroke="${INK}" stroke-width="0.25" stroke-dasharray="1.2 0.9"/>`;
    out += `<polygon points="${pts2([[ax, yt], [ax + rw, yt], [ax + rw, yb], [ax, yb]])}" fill="none" stroke="${INK}" stroke-width="0.32" stroke-linejoin="round"/>`;
    const th = 70 * Math.PI / 180, px = ax + rw * Math.cos(th), py = yt + ry * Math.sin(th);   // 回る向きの矢じり
    out += head(px, py, Math.atan2(ry * Math.cos(th), -rw * Math.sin(th)), 2.2);
    return out;
  });

  // 考えようの図：直角三角形 ABC（AC＝3cm、BC＝4cm、AB＝5cm、斜辺 AB が軸 ℓ の上）と、見取図をかく枠
  const triFig = () => SVG((W, H, h) => {
    const C = [2.4, 1.8], k = 8.2, X0 = 30, Y = y => H - 8 - y * k, X = x => X0 + x * k;
    let out = h.ln(X0, Y(-0.5), X0, Y(5.6), INK, 0.25, ' stroke-dasharray="1.2 0.9"');
    out += h.tx(X0 + 1.6, Y(5.6) + 2.4, 'ℓ', 3.4, 'start', ' class="pl"');
    out += `<polygon points="${pts2([[X(0), Y(0)], [X(0), Y(5)], [X(C[0]), Y(C[1])]])}" fill="none" stroke="${INK}" stroke-width="0.32" stroke-linejoin="round"/>`;
    const m = 2.4, ux = [(X(0) - X(C[0])), (Y(0) - Y(C[1]))], vx = [(X(0) - X(C[0])), (Y(5) - Y(C[1]))];   // 直角のしるし（C）
    const nu = Math.hypot(...ux), nv = Math.hypot(...vx), a = [X(C[0]) + ux[0] / nu * m, Y(C[1]) + ux[1] / nu * m], b = [X(C[0]) + vx[0] / nv * m, Y(C[1]) + vx[1] / nv * m], c = [a[0] + b[0] - X(C[0]), a[1] + b[1] - Y(C[1])];
    out += `<polyline points="${pts2([a, c, b])}" fill="none" stroke="${INK}" stroke-width="0.22"/>`;
    out += h.tx(X(0) - 2, Y(0) + 3, 'A', 3.1, 'end', ' class="pl"') + h.tx(X(0) - 2, Y(5) + 1, 'B', 3.1, 'end', ' class="pl"') + h.tx(X(C[0]) + 2.2, Y(C[1]) + 1.2, 'C', 3.1, 'start', ' class="pl"');
    out += h.tx(X(1.2) + 1.8, Y(0.9) + 3.4, '3cm', 2.9, 'start') + h.tx(X(1.2) + 2.4, Y(3.4) - 0.8, '4cm', 2.9, 'start') + h.tx(X0 - 2, Y(2.5) + 1, '5cm', 2.9, 'end');
    // 見取図をかく枠（軸 ℓ だけ点線でかいてある）
    const fx0 = 78, fx1 = W - 3, fy0 = 4, fy1 = H - 3, ax = (fx0 + fx1) / 2;
    out += `<rect x="${fx0}" y="${fy0}" width="${f2(fx1 - fx0)}" height="${f2(fy1 - fy0)}" rx="2" fill="none" stroke="#8b96a3" stroke-width="0.3" stroke-dasharray="1.2 0.9"/>`;
    out += h.ln(ax, fy0 + 3, ax, fy1 - 3, INK, 0.25, ' stroke-dasharray="1.2 0.9"');
    out += h.tx(ax + 1.6, fy0 + 6, 'ℓ', 3.4, 'start', ' class="pl"') + h.tx(fx0 + 3, fy0 + 5, '見取図', 2.9, 'start');
    return out;
  });

  IK.lesson('kukan_new-05', {
    unit: 'kukan_new', unitName: '空間図形（新しい形）', form: 'new', no: '第5時', title: '線や面を動かして、立体をつくろう',
    summary: '円を垂直に動かす見方と、長方形を回す見方で、円柱をとらえる。回転体・回転の軸・母線を知り、直角三角形を斜辺で回す立体を考えようで考える。',
    head: '空間図形　第5時',
    pitch: 8, dots: true,
    checks: [
      // 例題の図：直角三角形 3・4・5、半円の半径、台形の上底・下底
      'near(3 ** 2 + 4 ** 2, 5 ** 2) && near(2, 2) && near(1, 2 - 1)',
      // 考えよう（図の確かめ）：A(0,0) B(0,5) C(2.4,1.8)。AC＝3、BC＝4、∠C＝90°
      'near(Math.hypot(2.4, 1.8), 3) && near(Math.hypot(2.4, 5 - 1.8), 4) && near(2.4 * 2.4 + 1.8 * (1.8 - 5), 0)',
      // 演習プリント（4）4cm の辺が軸：円錐 半径 3・高さ 4・母線 5　（5）3cm の辺が軸：半径 4・高さ 3、底面積 16π ＞ 9π
      'near(3 ** 2 + 4 ** 2, 5 ** 2) && near(PI * 4 ** 2, 16 * PI) && near(PI * 3 ** 2, 9 * PI) && PI * 4 ** 2 > PI * 3 ** 2',
      // （6）横 6cm → 半径 3cm、高さ 8cm、切り口の面積 6×8＝48
      'near(6 / 2, 3) && near(6 * 8, 48)',
      // （8）外の円の半径 2+3＝5、内の円の半径 2：π×5^2−π×2^2＝21π、軸をふくむ切り口 3×5×2＝30
      'near(2 + 3, 5) && near(PI * 5 ** 2 - PI * 2 ** 2, 21 * PI) && near(3 * 5 * 2, 30)',
      // 小テスト（4）3cm の辺が軸：底面の半径 4cm　（5）チャレンジ：外の円の半径 1+3＝4、内の円の半径 1、π×4^2−π×1^2＝15π
      'near(4, 4) && near(1 + 3, 4) && near(PI * 4 ** 2 - PI * 1 ** 2, 15 * PI)'
    ],

    /* ================= ワークシート（A4 1枚・約12分） ================= */
    ws: [
      M('線や面を動かして、立体をつくろう'),
      K('今日の問い', 'コインを積み重ねるとき、長方形を回すとき、どんな立体ができるだろう。', 1),
      F(5, coins(), spin()),
      T('①', '自分の考え（3分）　2つをくらべて、気づいたことも書こう。', 1),
      B(3, '（例）積み重ねる … 円柱（円を、その面に垂直な方向に動かしたあと）\n回転させる … 円柱（長方形が動いたあと）\n動かし方がちがっても、同じ立体ができる'),
      T('②', 'ペアの考え（3分）　自分とちがう見方を書こう。', 1),
      B(2, ''),
      G(1),
      WD('底面を面に{{垂直}}に動かすと … 角柱・円柱\n直線を軸に平面図形を回してできる立体 … {{回転体}}\n回転体で、軸にした直線 … {{回転の軸}}\n円柱・円錐の側面をつくる線分 … {{母線}}', 4, { label: 'ことば（教科書で調べよう）' }),
      G(1),
      K('例題', '次の図形を、直線 ℓ（点線）を軸に1回転させる。立体の名前と、その立体にある円の半径を答えよう。（球は、球の半径）', 2),
      F(5,
        fRect('（1）', 2, 3, '{{2}}cm', '3cm'), fTri('（2）', 3, 4, '{{3}}cm', '4cm', '5cm'),
        fSemi('（3）', 2, '2cm'), fTrap('（4）', 2, 1, 3, '2cm', '1cm', '3cm')),
      TB('', ['（1）', '（2）', '（3）', '（4）'], [
        ['立体の名前', ['{{円柱}}', '{{円錐}}', '{{球}}', '{{円錐台}}']],
        ['円の半径', ['{{2}}cm', '{{3}}cm', '{{2}}cm', '{{1}}cm と {{2}}cm']]
      ], { hw: 28 }),
      T('', '【気づき】軸に垂直な辺・平行な辺・ななめの辺は、回ると何になるか。', 1),
      B(2, '軸に垂直な辺 → 底面の円\n軸に平行な辺・ななめの辺 → 側面をつくる線分（母線）')
    ],

    /* ================= 演習プリント（A4 表裏） ================= */
    dr: [
      HD('確かめる', 'ことばと、基本をたしかめよう。'),
      WD('① 底面を、その面に{{垂直}}に動かすと、角柱や円柱ができる。\n② 平面図形を、直線を軸に1回転させた立体を{{回転体}}という。\n③ 回転体で、軸にした直線を{{回転の軸}}という。\n④ 円柱や円錐の側面をつくる線分を{{母線}}という。', 4, { label: 'ことば' }),
      F(5,
        rot({ cap: 'ア', pts: [[0, 0], [1.6, 0], [1.6, 3], [0, 3]] }), rot({ cap: 'イ', pts: [[0, 0], [2, 0], [0, 3]] }),
        rot({ cap: 'ウ', semi: 1.5, padL: 7 })),
      C2([
        T('（1）', '上のア〜ウを、直線 ℓ（点線）を軸に1回転させる。できる立体は？', 2),
        B(2, 'ア 円柱　イ 円錐　ウ 球')
      ], [
        T('（2）', '回転体をすべて選ぼう。\nア 円柱　イ 三角柱\nウ 球　エ 円錐　オ 立方体', 3),
        B(1, 'ア、ウ、エ')
      ], '1:1'),
      MA('【説明】円柱を、円を動かす見方と、長方形を回す見方で説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      G(1),
      HD('使ってみる', '回転体の切り口と、長さを調べよう。'),
      C2([
        T('（3）', '円錐を、軸をふくむ平面と、軸に垂直な平面で切る。切り口の形は？', 3),
        B(2, '軸をふくむ … 二等辺三角形\n軸に垂直 … 円')
      ], [
        T('（4）', '3辺が 3cm、4cm、5cm の直角三角形を、4cm の辺を軸に1回転させる。立体の名前と、底面の半径・高さ・母線は？', 4),
        B(2, '円錐　半径 3cm、\n高さ 4cm、母線 5cm')
      ], '1:1'),
      C2([
        T('（5）', '同じ三角形を、3cm の辺を軸に1回転させる。底面の半径と、高さを答えよう。', 3),
        B(2, '半径 4cm、高さ 3cm')
      ], [
        T('（6）', '高さ 8cm の円柱を、軸をふくむ平面で切ると、切り口は、横 6cm の長方形になった。底面の半径と、切り口の面積は？', 4),
        B(2, '半径 6÷2＝3（cm）\n面積 6×8＝48（cm^2）')
      ], '1:1'),
      G(1),
      T('', '★ ここまでできたら、今日の合格！　　合格 ☐', 1),
      BR(),

      HD('ひろげる', '考えよう：直角三角形を、斜辺を軸にして回してみよう。'),
      T('（7）', '3辺が 3cm、4cm、5cm の直角三角形 ABC を、斜辺 AB を軸として1回転させると、どんな立体ができるだろう。見取図をかいて、説明しよう。', 2),
      F(7, triFig()),
      C2([
        T('', 'どうして、その立体になるのか。理由を説明しよう。', 2),
        B(4, '')
      ], [
        T('', 'ほかの辺（3cm や 4cm）を軸にしたら、どうなるだろう。', 2),
        B(4, '')
      ], '1:1'),
      G(1),
      HD('チャレンジ★★', '入試にも出る問題。ヒントカードを見てもOK。'),
      C2([
        T('（8）', '右の長方形を、直線 ℓ を軸に1回転させる。\n① できる立体は？\n② 軸に垂直な平面で切ったときの、切り口の面積は？\n③ 軸をふくむ平面で切ったときの、切り口の面積は？', 7),
        B(7, '① くりぬいた円柱\n　 （パイプの形）\n② 外の円の半径 2+3＝5cm\n　 中の円の半径 2cm\n　 π×5^2−π×2^2＝21π（cm^2）\n③ 3×5 の長方形が 2つ\n　 3×5×2＝30（cm^2）')
      ], [
        F(6, rot({ pts: [[2, 0], [5, 0], [5, 5], [2, 5]], dims: [{ x: 1, y: 0, t: '2cm', dy: 4.6 }, { x: 3.5, y: 0, t: '3cm', dy: 4.6 }, { x: 5, y: 2.5, t: '5cm', a: 'start', dx: 1.8, dy: 1 }] })),
        MA('① 軸と長方形は、はなれているね。回してできる立体のまん中は、どうなるだろう。\n② 軸に垂直に切ったとき、切り口はどんな形になるだろう。半径に目をつけよう。', 6, { label: 'ヒントカード' })
      ], '1:1')
    ],

    /* ================= 小テスト（kukan-05 と同じ） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      T('（1）', '次の図形を、直線 ℓ を軸として1回転させてできる立体の名前を答えよう。（3点）', 1),
      F(5, rot({ cap: 'ア 長方形', pts: [[0, 0], [1.6, 0], [1.6, 3], [0, 3]] }), rot({ cap: 'イ 直角三角形', pts: [[0, 0], [2, 0], [0, 3]] }), rot({ cap: 'ウ 半円', semi: 1.5, padL: 7 })),
      B(2, 'ア 円柱　　イ 円錐　　ウ 球'),
      T('（2）', 'ア 平面図形を、1つの直線を軸として1回転させてできる立体を、何というか。\nイ 円柱や円錐の側面をつくる線分を、何というか。（2点）', 2),
      B(2, 'ア 回転体　　イ 母線'),
      T('（3）', '円錐を、ア 回転の軸に垂直な平面で、イ 回転の軸をふくむ平面で、切ったときの切り口の形を、それぞれ答えよう。（2点）', 2),
      B(2, 'ア 円　　イ 二等辺三角形'),
      T('（4）', '3辺が 3cm、4cm、5cm の直角三角形を、3cm の辺を軸として1回転させた。できる立体の名前と、底面の半径を答えよう。（3点）', 2),
      B(3, '円錐　　底面の半径 4cm\n（軸が 3cm。軸に垂直な 4cm の辺が、底面の半径になる）'),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      C2([
        T('（5）', '右の長方形を、直線 ℓ を軸として1回転させる。ℓ から長方形までは 1cm はなれている。軸に垂直な平面で、上下の底面のあいだで切ったとき、切り口の面積を求めよう。', 4),
        B(4, '外の円の半径 1+3＝4cm、中の円の半径 1cm\nπ×4^2−π×1^2＝16π−π＝15π（cm^2）')
      ], [
        F(8, rot({ pts: [[1, 0], [4, 0], [4, 4], [1, 4]], dims: [{ x: 0.5, y: 0, t: '1cm', dy: 4.6 }, { x: 2.5, y: 0, t: '3cm', dy: 4.6 }, { x: 4, y: 2, t: '4cm', a: 'start', dx: 1.8, dy: 1 }] }))
      ], '3:2')
    ]
  });
})();
