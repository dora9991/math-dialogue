/* 空間図形（新しい形） 第6時：立体を、正面と真上から見た図で表そう。 kukan-06 と同じ内容の授業を、新しい形に組みかえた（見本 lesson_kukan_new_01.js）。
   ・ワークシートは A4 1枚（約12分）：問いは1つ（円柱と円錐を、正面・真上から見た形を予想してかく）。個人3分 → ペア3分 → ことば → 例題（投影図から立体を読み取る）。考えようは、演習プリントの裏へ。
   ・演習プリントは表裏：表＝確かめる 2問・使ってみる 4問（ここまでできたら今日の合格）／裏＝ひろげる 1問（考えよう：立面図も平面図も長方形になる立体。答えは載せない）・チャレンジ★★ 1問（円錐台の投影図。ヒントカードつき）。 2:4:1:1 の8問。
   ・投影図（立面図を上、平面図を下に、基線をはさんで、横の幅をそろえる）は、このファイルの toei() で描く。
   ・小テストは kukan-06 と同じ。
   検算：node tools/verify.cjs kukan_new-06　／　見た目：node tools/check.cjs <出力先> kukan_new-06 */
(function () {
  const { M, K, B, G, F, C2, T, HD, BR, WD, MA, TB, SO, SVG } = IK.b;
  const f2 = n => String(Math.round(n * 100) / 100);
  const INK = '#222', RED = '#d62828', DASH = ' stroke-dasharray="1.2 0.9"';
  const pts2 = a => a.map(p => f2(p[0]) + ',' + f2(p[1])).join(' ');

  /* ---- 投影図の部品 ----
     形（item）：['r', x0, y0, x1, y1] 長方形／['p', [[x, y]…]] 多角形／['l', x0, y0, x1, y1] 線分／['c', cx, cy, r] 円／['d', x, y] 点
                 最後に 'dash' をつけると点線
     立面図の座標 (x, z)：左下が原点・上が z。平面図の座標 (x, d)：左上が原点・下が d（手前が下）。単位は cm。 */
  const drawItems = (items, P, k, c) => (items || []).map(it => {
    const t = it[0], dash = it[it.length - 1] === 'dash', st = `stroke="${c}" stroke-width="${dash ? 0.22 : 0.32}"${dash ? DASH : ''}`;
    if (t === 'r') return `<polygon points="${pts2([P(it[1], it[2]), P(it[3], it[2]), P(it[3], it[4]), P(it[1], it[4])])}" fill="none" ${st} stroke-linejoin="round"/>`;
    if (t === 'p') return `<polygon points="${pts2(it[1].map(q => P(q[0], q[1])))}" fill="none" ${st} stroke-linejoin="round"/>`;
    if (t === 'l') { const a = P(it[1], it[2]), b = P(it[3], it[4]); return `<line x1="${f2(a[0])}" y1="${f2(a[1])}" x2="${f2(b[0])}" y2="${f2(b[1])}" ${st}/>`; }
    if (t === 'c') { const q = P(it[1], it[2]); return `<circle cx="${f2(q[0])}" cy="${f2(q[1])}" r="${f2(it[3] * k)}" fill="none" ${st}/>`; }
    if (t === 'd') { const q = P(it[1], it[2]); return `<circle cx="${f2(q[0])}" cy="${f2(q[1])}" r="0.75" fill="${c}"/>`; }
    return '';
  }).join('');
  /* o.w, o.h, o.d：立面図の横・立面図の高さ・平面図の奥行き（cm）　o.up, o.dn：立面図・平面図の形　o.aup, o.adn：解答を表示したときだけ出る赤い形
     o.k：1cm の長さ（mm）。きめたときは、その大きさでかく　o.cap：見出し　o.lab：「立面図」「平面図」の字　o.dims：長さの字 [{ v:'u'|'d', x, y, t, a, dx, dy }] */
  const toeiBody = (o, W, H, h) => {
    const cap = o.cap ? 5 : 0, lab = o.lab ? 14 : 0, gap = 2.6, padX = 4, padY = o.frame ? 2.5 : 1, pT = o.top || 0, pB = o.bottom || 0, pR = o.padR || 0;   // top・bottom・padR：長さの字のための余白
    const k = o.k || Math.min((W - 2 * padX - lab - pR) / o.w, (H - cap - 2 * padY - pT - pB - 2 * gap) / (o.h + o.d));
    const x0 = padX + lab + ((W - 2 * padX - lab - pR) - o.w * k) / 2, total = (o.h + o.d) * k + 2 * gap, top = cap + padY + pT + ((H - cap - 2 * padY - pT - pB) - total) / 2;
    const yU = top + o.h * k, yBase = yU + gap, yD = yBase + gap;
    const PU = (x, z) => [x0 + x * k, yU - z * k], PD = (x, d) => [x0 + x * k, yD + d * k];
    let out = '';
    if (o.frame) out += `<rect x="1.5" y="${f2(cap)}" width="${f2(W - 3)}" height="${f2(H - cap - 1.5)}" rx="2" fill="none" stroke="#8b96a3" stroke-width="0.3" stroke-dasharray="1.2 0.9"/>`;
    if (o.cap) out += h.tx(W / 2, 3.6, h.svgMath(o.cap), 3, 'middle', ' class="cap"');
    out += h.ln(x0 - 3, yBase, x0 + o.w * k + 3, yBase, INK, 0.22);
    if (o.lab) out += h.tx(x0 - 4, yU - o.h * k / 2 + 1, '立面図', 2.8, 'end') + h.tx(x0 - 4, yD + o.d * k / 2 + 1, '平面図', 2.8, 'end');
    out += drawItems(o.up, PU, k, INK) + drawItems(o.dn, PD, k, INK);
    const ans = drawItems(o.aup, PU, k, RED) + drawItems(o.adn, PD, k, RED);
    if (ans) out += h.ans(ans);
    (o.dims || []).forEach(d => { const q = (d.v === 'd' ? PD : PU)(d.x, d.y); out += h.rich(q[0] + (d.dx || 0), q[1] + (d.dy || 0), d.t, 2.9, d.a || 'middle'); });
    return out;
  };
  const toei = o => SVG((W, H, h) => toeiBody(o, W, H, h));

  // よく使う立体の投影図（立てて置いた形）
  const SOL = {
    cyl: (r, ht) => ({ w: 2 * r, h: ht, d: 2 * r, up: [['r', 0, 0, 2 * r, ht]], dn: [['c', r, r, r]] }),
    cone: (r, ht) => ({ w: 2 * r, h: ht, d: 2 * r, up: [['p', [[0, 0], [2 * r, 0], [r, ht]]]], dn: [['c', r, r, r], ['d', r, r]] }),
    pyr4: (a, ht) => ({ w: a, h: ht, d: a, up: [['p', [[0, 0], [a, 0], [a / 2, ht]]]], dn: [['r', 0, 0, a, a], ['l', 0, 0, a, a], ['l', a, 0, 0, a]] }),
    pyr3: (a, ht) => { const s = a * Math.sqrt(3) / 2, g = 2 * s / 3; return { w: a, h: ht, d: s, up: [['p', [[0, 0], [a, 0], [a / 2, ht]]], ['l', a / 2, 0, a / 2, ht, 'dash']], dn: [['p', [[0, s], [a, s], [a / 2, 0]]], ['l', a / 2, g, 0, s], ['l', a / 2, g, a, s], ['l', a / 2, g, a / 2, 0]] }; },
    prism3: (a, b, ht) => ({ w: a, h: ht, d: b, up: [['r', 0, 0, a, ht], ['l', a / 2, 0, a / 2, ht, 'dash']], dn: [['p', [[0, b], [a, b], [a / 2, 0]]]] }),
    box: (a, b, ht) => ({ w: a, h: ht, d: b, up: [['r', 0, 0, a, ht]], dn: [['r', 0, 0, a, b]] }),
    sphere: r => ({ w: 2 * r, h: 2 * r, d: 2 * r, up: [['c', r, r, r]], dn: [['c', r, r, r]] }),
    pentagon: ht => {   // 正五角柱（1つの側面が手前）。横の幅を 2 にそろえる。手前の面の両はしの縦線は見える、うしろの頂点の縦線は点線
      const v = [90, 162, 234, 306, 18].map(a => [Math.cos(a * Math.PI / 180), Math.sin(a * Math.PI / 180)]), s70 = Math.sin(72 * Math.PI / 180), sc = 2 / (2 * s70);
      const X = x => (x + s70) * sc, D = y => (1 - y) * sc, vv = v.map(p => [X(p[0]), D(p[1])]);
      return { w: 2, h: ht, d: D(v[2][1]), up: [['r', 0, 0, 2, ht], ['l', X(v[2][0]), 0, X(v[2][0]), ht], ['l', X(v[3][0]), 0, X(v[3][0]), ht], ['l', X(0), 0, X(0), ht, 'dash']], dn: [['p', vv]] };
    },
    hexagon: ht => {   // 正六角柱（1つの側面が手前）。外接円の半径 1.5cm
      const R = 1.5, s = R * Math.sqrt(3) / 2;
      return { w: 2 * R, h: ht, d: 2 * s, up: [['r', 0, 0, 2 * R, ht], ['l', R / 2, 0, R / 2, ht], ['l', 1.5 * R, 0, 1.5 * R, ht]], dn: [['p', [[0, s], [R / 2, 0], [1.5 * R, 0], [2 * R, s], [1.5 * R, 2 * s], [R / 2, 2 * s]]]] };
    }
  };
  const sol = (name, args, cap) => toei(Object.assign({ cap }, SOL[name](...args)));

  // 学習課題：正面・真上から見た形をかく枠（解答を表示すると、赤い形が出る）
  const vbox = (cap, kind) => SVG((W, H, h) => {
    const y0 = 7, y1 = H - 3, cx = W / 2, cy = (y0 + y1) / 2 + 0.5;
    let out = h.tx(W / 2, 4.3, cap, 2.9, 'middle', ' class="cap"') + `<rect x="3" y="${y0}" width="${f2(W - 6)}" height="${f2(y1 - y0)}" rx="1.5" fill="none" stroke="#8b96a3" stroke-width="0.3" stroke-dasharray="1.2 0.9"/>`;
    const a = kind === 'cylF' ? `<polygon points="${pts2([[cx - 6.5, cy - 9], [cx + 6.5, cy - 9], [cx + 6.5, cy + 9], [cx - 6.5, cy + 9]])}" fill="none" stroke="${RED}" stroke-width="0.4"/>`
      : kind === 'coneF' ? `<polygon points="${pts2([[cx - 6.5, cy + 9], [cx + 6.5, cy + 9], [cx, cy - 9]])}" fill="none" stroke="${RED}" stroke-width="0.4"/>`
      : `<circle cx="${f2(cx)}" cy="${f2(cy)}" r="6.5" fill="none" stroke="${RED}" stroke-width="0.4"/>` + (kind === 'coneT' ? `<circle cx="${f2(cx)}" cy="${f2(cy)}" r="0.8" fill="${RED}"/>` : '');
    return out + h.ans(a);
  });

  // 考えようの図：立面図・平面図（どちらも 横 4cm、縦 2cm の長方形）と、見つけた立体をかく2つの枠
  const kangae = SVG((W, H, h) => {
    const w1 = 80;
    let out = toeiBody({ w: 4, h: 2, d: 2, lab: true, top: 4.5, padR: 12, up: [['r', 0, 0, 4, 2]], dn: [['r', 0, 0, 4, 2]], dims: [{ v: 'u', x: 2, y: 2, t: '4cm', dy: -1.8 }, { v: 'u', x: 4, y: 1, t: '2cm', a: 'start', dx: 1.8, dy: 1 }, { v: 'd', x: 4, y: 1, t: '2cm', a: 'start', dx: 1.8, dy: 1 }] }, w1, H, h);
    [['見つけた立体 ①', 84], ['見つけた立体 ②', 84 + (W - 84 - 3 + 3) / 2]].forEach(([t, fx], i) => {
      const fw = (W - 84 - 3 - 3) / 2;
      out += `<rect x="${f2(fx)}" y="3" width="${f2(fw)}" height="${f2(H - 6)}" rx="2" fill="none" stroke="#8b96a3" stroke-width="0.3" stroke-dasharray="1.2 0.9"/>` + h.tx(fx + 3, 8, t, 2.9, 'start');
    });
    return out;
  });

  IK.lesson('kukan_new-06', {
    unit: 'kukan_new', unitName: '空間図形（新しい形）', form: 'new', no: '第6時', title: '立体を、正面と真上から見た図で表そう',
    summary: '立面図・平面図・投影図の意味を知り、投影図から立体を読み取る。立面図も平面図も長方形になる立体を探して、見る向きの大切さを学び合う。',
    head: '空間図形　第6時',
    pitch: 8, dots: true,
    checks: [
      // 演習プリント（2）円柱：平面図の円の直径＝立面図の横 4cm → 半径 2cm、高さ 5cm　（4）円錐：底辺 6cm → 半径 3cm
      'near(4 / 2, 2) && near(6 / 2, 3)',
      // （8）円錐台：下底 6cm・上底 2cm → 下の円の半径 3cm、上の円の半径 1cm
      'near(6 / 2, 3) && near(2 / 2, 1)',
      // 小テスト（3）立面図が底辺 8cm の二等辺三角形、平面図が円 → 円錐 底面の半径 4cm
      'near(8 / 2, 4)',
      // 小テスト（5）チャレンジ：六角柱 面 6+2＝8、辺 3×6＝18、頂点 2×6＝12（頂点−辺+面＝2）
      'near(6 + 2, 8) && near(3 * 6, 18) && near(2 * 6, 12) && near(12 - 18 + 8, 2)'
    ],

    /* ================= ワークシート（A4 1枚・約12分） ================= */
    ws: [
      M('立体を、正面と真上から見た図で表そう'),
      K('今日の問い', '円柱と円錐を、正面と真上から見た形を、予想して枠にかこう。', 1),
      F(5,
        SO({ shape: 'cylinder', a: 1.3, c: 3, caption: '円柱' }), vbox('正面から', 'cylF'), vbox('真上から', 'cylT'),
        SO({ shape: 'cone', a: 1.4, c: 3, caption: '円錐' }), vbox('正面から', 'coneF'), vbox('真上から', 'coneT')),
      T('①', '自分の考え（3分）　見る向きで、見え方はどうちがうかな。', 1),
      B(3, '（例）見る向きがちがうと、見える形がちがう。\n円柱 … 正面は長方形、真上は円。\n円錐 … 正面は三角形、真上は円。'),
      T('②', 'ペアの考え（3分）　自分とちがう気づきを書こう。', 1),
      B(2, ''),
      G(1),
      WD('正面から見た図 … {{立面図}}\n真上から見た図 … {{平面図}}\n2つを組にした図 … {{投影図}}\n見えない線は{{点線}}、上下の{{横の幅}}はそろえる', 4, { label: 'ことば（教科書で調べよう）' }),
      G(1),
      K('例題', '上が立面図、下が平面図。立体の名前と、底面の形を答えよう。', 1),
      F(5, sol('cyl', [1, 3], 'ア'), sol('cone', [1, 3], 'イ'), sol('pyr4', [2, 3], 'ウ'), sol('prism3', [2, 2, 3], 'エ')),
      TB('', ['ア', 'イ', 'ウ', 'エ'], [
        ['立体の名前', ['{{円柱}}', '{{円錐}}', '{{正四角錐}}', '{{三角柱}}']],
        ['底面の形', ['{{円}}', '{{円}}', '{{正方形}}', '{{三角形}}']]
      ], { hw: 28 }),
      T('', '【判断のしかた】立面図と平面図の、何を見ればよいか。', 1),
      B(2, '立面図が長方形なら柱、三角形なら錐。平面図は、底面の形。\n見えない辺は、点線。')
    ],

    /* ================= 演習プリント（A4 表裏） ================= */
    dr: [
      HD('確かめる', 'ことばと、基本をたしかめよう。'),
      WD('① 立体を正面から見た図を{{立面図}}、真上から見た図を{{平面図}}という。\n② 立面図と平面図を組にして表した図を{{投影図}}という。\n③ 投影図で、見えない線は{{点線}}でかく。\n④ 投影図では、立面図と平面図の{{横の幅}}をそろえてかく。', 4, { label: 'ことば' }),
      F(5, sol('pyr3', [2, 3], 'ア'), sol('box', [2, 2, 3], 'イ'), sol('sphere', [1], 'ウ'), sol('pentagon', [3], 'エ')),
      C2([
        T('（1）', '上の投影図は、どんな立体を表しているか。ア〜エの名前を答えよう。', 2),
        B(2, 'ア 三角錐　　イ 四角柱\nウ 球　　　エ 五角柱')
      ], [
        T('（2）', '立面図が縦 5cm、横 4cm の長方形、平面図が円。立体の名前と、底面の半径、高さを答えよう。', 3),
        B(2, '円柱　半径 2cm　高さ 5cm\n（円の直径＝横の長さ 4cm）')
      ], '1:1'),
      MA('【説明】立面図と平面図から、何がわかるか。隣の人に説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      G(1),
      HD('使ってみる', '見る向きを考えて、形を答えよう。'),
      C2([
        T('（3）', '底面を下にして置く。立面図、平面図の順に、形を答えよう。\nア 円錐　イ 正四角錐　ウ 三角柱', 3),
        B(3, 'ア 三角形、円（中心に点）\nイ 三角形、正方形と対角線\nウ 長方形、三角形')
      ], [
        T('（4）', '立面図が底辺 6cm、高さ 4cm の二等辺三角形、平面図が円の立体の、名前と底面の半径は？', 3),
        B(2, '円錐　底面の半径 3cm\n（円の直径＝底辺 6cm）')
      ], '1:1'),
      C2([
        T('（5）', '底面を下にして置く。立面図が三角形になる立体を、すべて選ぼう。\nア 円柱　イ 円錐\nウ 正四角錐　エ 三角柱', 4),
        B(1, 'イ、ウ')
      ], [
        T('（6）', '正四角錐を、頂点を下にして置く。立面図と平面図は、どんな形か。', 3),
        B(2, '立面図 … 頂点が下の三角形\n平面図 … 正方形と点線の対角線')
      ], '1:1'),
      G(1),
      T('', '★ ここまでできたら、今日の合格！　　合格 ☐', 1),
      BR(),

      HD('ひろげる', '考えよう：同じ投影図になる立体を、さがそう。'),
      T('（7）', '立面図も平面図も、図のような長方形になる立体は、直方体だけだろうか。ほかの立体を 2つ見つけて、見取図と置き方を、枠にかこう。', 2),
      F(7, kangae),
      C2([
        T('', '見つけた立体が、図と同じ投影図になるのは、なぜだろう。', 2),
        B(6, '')
      ], [
        T('', '立面図と平面図だけで、立体が 1つに決まらないことはあるだろうか。', 2),
        B(6, '')
      ], '1:1'),
      G(1),
      HD('チャレンジ★★', '入試にも出る問題。ヒントカードを見てもOK。'),
      C2([
        T('（8）', '右の投影図で表される立体について、答えよう。\n① 立体の名前\n② 上の面と、下の面の円の半径\n③ 1回転させるともとになる、平面図形の名前', 6),
        B(5, '① 円錐台\n② 上の面 1cm、下の面 3cm\n③ 直角台形\n　 （立面図の台形を半分にした形）')
      ], [
        F(7, toei({ w: 6, h: 3, d: 6, lab: true, top: 4.5, bottom: 5, padR: 12, up: [['p', [[0, 0], [6, 0], [4, 3], [2, 3]]]], dn: [['c', 3, 3, 3], ['c', 3, 3, 1]], dims: [{ v: 'u', x: 3, y: 3, t: '2cm', dy: 4.0 }, { v: 'u', x: 3, y: 1.5, t: '高さ3cm', a: 'middle', dx: 0, dy: 1 }, { v: 'd', x: 3, y: 6, t: '6cm', dy: 4.2 }] })),
        MA('① 平面図の 2つの円は、立体のどの部分かな。\n② 立面図の台形に、回転の軸を引くと、どんな形が見えるかな。', 5, { label: 'ヒントカード' })
      ], '1:1')
    ],

    /* ================= 小テスト（kukan-06 と同じ） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      T('（1）', '次の投影図は、どんな立体を表しているか。ア〜ウ の名前を答えよう。（3点）', 1),
      F(6, sol('pyr4', [2, 3], 'ア'), sol('cyl', [1, 3], 'イ'), sol('prism3', [2, 2, 3], 'ウ')),
      B(2, 'ア 正四角錐　　イ 円柱　　ウ 三角柱'),
      T('（2）', '立体を正面から見た図を、何というか。また、真上から見た図を、何というか。（2点）', 2),
      B(2, '正面から … 立面図　　真上から … 平面図'),
      T('（3）', '立面図が、底辺 8cm、高さ 5cm の二等辺三角形で、平面図が円である立体の、名前と、底面の半径を答えよう。（3点）', 2),
      B(3, '円錐　　底面の半径 4cm\n（円の直径が、三角形の底辺 8cm にあたる）'),
      T('（4）', '投影図で、見えない線は、どのようにかくか。（2点）', 1),
      B(2, '点線でかく'),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      C2([
        T('（5）', '右の投影図で表される立体の名前と、面の数・辺の数・頂点の数を答えよう。', 3),
        B(5, '平面図が正六角形で、立面図が長方形だから、六角柱\n面 6+2＝8、辺 3×6＝18、頂点 2×6＝12\n確かめ　12−18+8＝2')
      ], [
        F(8, toei(Object.assign(SOL.hexagon(3), { lab: true })))
      ], '3:2')
    ]
  });
})();
