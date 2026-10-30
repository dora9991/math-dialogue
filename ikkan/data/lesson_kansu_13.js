/* 関数 y＝ax²（新しい形） 第13時：図形の中を動く点がつくる面積を調べよう。
   元：授業ナビ標準版 kansu-13（活）。長方形 ABCD の中を動く点 P、Q がつくる △APQ の面積を「今日の問い」と①②に、表とグラフ（y＝x²）を「例題」に、
   「Q が D で止まったあと、P が BC 上を進むと面積はどうなるか」を考えよう（演習プリント（7））にした。応用の「着いたら止まる点で式が変わる」問題は、使ってみる（3）〜（6）に、
   入試レベルの長方形の問題は、チャレンジ★★（8）に、数値を新しくした。
   ・ワークシートは A4 1枚：問いは1つ（動く点がつくる面積は、どのように変わるか）。個人3分（表・式・グラフなどを自分で選ぶ）→ ペア3分 → ことば → 例題（y＝x² の表とグラフ）。
   ・演習プリントは表裏：表＝確かめる 2問・使ってみる 4問（（3）〜（6）は、点が着いたら止まる場合で、変域に分けて式を立てる）／裏＝ひろげる（考えよう・答えなし）・チャレンジ★★（ヒントカードつき）。
   ・動点の問題は、点の動く辺・速さ・着く時刻を問題文に全部書き、式が変わる場合は、変域の境目（0≦x≦3 と 3≦x≦8 のように）を問題文で決めた。
   ・図形・グラフは IK.b.SVG の自作（shape・gxy。グラフは、横と縦で目もりの大きさがちがう）。数値は新しく作り、答えは checks で別の式（座標から面積を出す）から出しなおした。
   検算：node tools/verify.cjs kansu-13　／　見た目：node tools/check.cjs <出力先> kansu-13 */
(function () {
  const { M, K, B, G, F, C2, T, HD, BR, WD, MA, TB, SVG } = IK.b;
  const RED = '#d62828';
  const HALO = ' stroke="#fff" stroke-width="0.7" stroke-linejoin="round" paint-order="stroke"';   // 字が方眼の線にかさなっても読めるように、白いふちをつける

  // 図形：o＝{ cap, poly（外の形。座標は cm）, fill（うすく塗る形）, segs（[x1, y1, x2, y2, 点線か]）, dots（[x, y]）, names（{ t, x, y, dx, dy }：点の名前。dx・dy は mm でずらす）, texts（長さの字）, heads（[x, y, 向き（度）]：矢じり）}
  const shape = o => SVG((W, H, h) => {
    const xs = o.poly.map(p => p[0]), ys = o.poly.map(p => p[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const ml = o.ml != null ? o.ml : 10, mr = o.mr != null ? o.mr : 12, mt = o.mt != null ? o.mt : 8, mb = o.mb != null ? o.mb : 8;
    const s = Math.min((W - ml - mr) / (x1 - x0), (H - mt - mb) / (y1 - y0));
    const ox = ml + (W - ml - mr - s * (x1 - x0)) / 2, oy = mt + (H - mt - mb - s * (y1 - y0)) / 2;
    const X = x => ox + (x - x0) * s, Y = y => oy + (y1 - y) * s;
    const P = p => h.f2(X(p[0])) + ',' + h.f2(Y(p[1]));
    let out = '';
    if (o.cap) out += h.tx(1, 4.2, o.cap, 3, 'start', ' class="cap"');
    if (o.fill) out += `<polygon points="${o.fill.map(P).join(' ')}" fill="#e3e9f0" stroke="none"/>`;
    out += `<polygon points="${o.poly.map(P).join(' ')}" fill="none" stroke="#222" stroke-width="0.32" stroke-linejoin="round"/>`;
    (o.segs || []).forEach(g => { out += h.ln(X(g[0]), Y(g[1]), X(g[2]), Y(g[3]), '#222', 0.32, g[4] ? ' stroke-dasharray="1.2 0.9"' : ''); });
    (o.heads || []).forEach(g => {   // 矢じり：先が (x, y)、向きが g[2]（度。数学の向き）
      const a = g[2] * Math.PI / 180, px = X(g[0]), py = Y(g[1]), q = d => [px - 1.9 * Math.cos(a + d), py + 1.9 * Math.sin(a + d)];
      const b1 = q(0.45), b2 = q(-0.45);
      out += `<polygon points="${h.f2(px)},${h.f2(py)} ${h.f2(b1[0])},${h.f2(b1[1])} ${h.f2(b2[0])},${h.f2(b2[1])}" fill="#222"/>`;
    });
    (o.dots || []).forEach(p => { out += `<circle cx="${h.f2(X(p[0]))}" cy="${h.f2(Y(p[1]))}" r="0.85" fill="#222"/>`; });
    (o.names || []).forEach(n => { out += h.tx(X(n.x) + n.dx, Y(n.y) + n.dy, n.t, 3.2, n.a || 'middle', ' class="pl"'); });
    (o.texts || []).forEach(n => { out += h.tx(X(n.x) + (n.dx || 0), Y(n.y) + (n.dy || 0), n.t, 2.9, n.a || 'middle'); });
    // 直角のしるし：[x, y, 辺の向き 1（度）, 辺の向き 2（度）]
    (o.rt || []).forEach(g => {
      const d1 = [Math.cos(g[2] * Math.PI / 180), -Math.sin(g[2] * Math.PI / 180)], d2 = [Math.cos(g[3] * Math.PI / 180), -Math.sin(g[3] * Math.PI / 180)], px = X(g[0]), py = Y(g[1]), m = 2;
      out += `<polyline points="${h.f2(px + d1[0] * m)},${h.f2(py + d1[1] * m)} ${h.f2(px + (d1[0] + d2[0]) * m)},${h.f2(py + (d1[1] + d2[1]) * m)} ${h.f2(px + d2[0] * m)},${h.f2(py + d2[1] * m)}" fill="none" stroke="#222" stroke-width="0.22"/>`;
    });
    return out;
  });

  // 長方形 ABCD（A が左上、B が左下、C が右下、D が右上）。AB＝ab（縦）、AD＝ad（横）。P は AB 上、Q は AD 上にある
  const rectSnap = (ab, ad, p, q, cap, dimL, dimB) => shape({
    cap, poly: [[0, ab], [0, 0], [ad, 0], [ad, ab]], fill: [[0, ab], [0, ab - p], [q, ab]], segs: [[0, ab - p, q, ab]], dots: [[0, ab - p], [q, ab]],
    names: [{ t: 'A', x: 0, y: ab, dx: -2.4, dy: -1.4 }, { t: 'B', x: 0, y: 0, dx: -2.4, dy: 3.8 }, { t: 'C', x: ad, y: 0, dx: 2.4, dy: 3.8 }, { t: 'D', x: ad, y: ab, dx: 2.4, dy: -1.4 },
      { t: 'P', x: 0, y: ab - p, dx: -2.6, dy: 1.2 }, { t: 'Q', x: q, y: ab, dx: 0, dy: -2 }],
    texts: [{ t: dimB, x: ad / 2, y: 0, dy: 4 }, { t: dimL, x: ad, y: ab / 2, dx: 2.4, dy: 1, a: 'start' }]
  });
  // 直角三角形 ABC（B が直角。A が上、B が左下、C が右下）。P は BA 上（BP＝p）、Q は BC 上（BQ＝q）
  const triSnap = (ab, bc, p, q, cap) => shape({
    cap, poly: [[0, ab], [0, 0], [bc, 0]], fill: [[0, 0], [0, p], [q, 0]], segs: [[0, p, q, 0]], dots: [[0, p], [q, 0]], rt: [[0, 0, 90, 0]],
    names: [{ t: 'A', x: 0, y: ab, dx: -2.4, dy: -1 }, { t: 'B', x: 0, y: 0, dx: -2.4, dy: 3.8 }, { t: 'C', x: bc, y: 0, dx: 2.4, dy: 3.8 }, { t: 'P', x: 0, y: p, dx: -2.6, dy: 1.2 }, { t: 'Q', x: q, y: 0, dx: 0, dy: 3.8 }],
    texts: [{ t: ab + 'cm', x: 0, y: ab * 0.62, dx: -3.2, dy: 1, a: 'end' }, { t: bc + 'cm', x: bc * 0.78, y: 0, dy: 4 }]
  });

  // グラフ：横＝x、縦＝y（目もりの大きさは、横と縦でちがう）。
  //   o：{ cap, xmax, xlab, xgrid, ymax, ylab, ygrid, xname, yname, padL, given（黒）, ans（解答のときだけ赤）｝　given・ans：{ curves: [{ f, from, to }], pts: [{ x, y, open }], texts: [{ t, x, y, a }] }
  const gxy = o => SVG((W, H, h) => {
    const padL = o.padL || 12, padR = 12, padT = 8, padB = 10;
    const pw = W - padL - padR, ph = H - padT - padB;
    const X = v => padL + v / o.xmax * pw, Y = v => padT + ph - v / o.ymax * ph;
    const fmt = v => String(Math.round(v * 100) / 100);
    const on = (v, st) => Math.abs(v / st - Math.round(v / st)) < 1e-9;
    let s = '';
    if (o.cap) s += h.tx(W - 1, 3.6, o.cap, 3, 'end', ' class="cap"');
    const nx = Math.round(o.xmax / o.xgrid), ny = Math.round(o.ymax / o.ygrid);
    for (let i = 0; i <= nx; i++) { const v = i * o.xgrid, big = on(v, o.xlab); s += h.ln(X(v), Y(0), X(v), Y(o.ymax), big ? '#b4bdc8' : '#dde3ea', big ? 0.2 : 0.12); }
    for (let i = 0; i <= ny; i++) { const v = i * o.ygrid, big = on(v, o.ylab); s += h.ln(X(0), Y(v), X(o.xmax), Y(v), big ? '#b4bdc8' : '#dde3ea', big ? 0.2 : 0.12); }
    s += h.ln(X(0), Y(0), X(o.xmax) + 2.6, Y(0), '#222', 0.32) + `<polygon points="${h.f2(X(o.xmax) + 4.2)},${h.f2(Y(0))} ${h.f2(X(o.xmax) + 2.4)},${h.f2(Y(0) - 0.9)} ${h.f2(X(o.xmax) + 2.4)},${h.f2(Y(0) + 0.9)}" fill="#222"/>`;
    s += h.ln(X(0), Y(0), X(0), Y(o.ymax) - 2.6, '#222', 0.32) + `<polygon points="${h.f2(X(0))},${h.f2(Y(o.ymax) - 4.2)} ${h.f2(X(0) - 0.9)},${h.f2(Y(o.ymax) - 2.4)} ${h.f2(X(0) + 0.9)},${h.f2(Y(o.ymax) - 2.4)}" fill="#222"/>`;
    for (let i = 1; i <= nx; i++) { const v = i * o.xgrid; if (on(v, o.xlab)) s += h.tx(X(v), Y(0) + 3.7, fmt(v), 2.7, 'middle'); }
    for (let i = 1; i <= ny; i++) { const v = i * o.ygrid; if (on(v, o.ylab)) s += h.tx(X(0) - 1.2, Y(v) + 0.9, fmt(v), 2.7, 'end'); }
    s += h.tx(X(0) - 1.2, Y(0) + 3.7, 'O', 2.7, 'end') + h.tx(W - 1, Y(0) + 7.6, o.xname, 2.8, 'end') + h.tx(X(0) + 1.5, padT - 4.4, o.yname, 2.8, 'start');
    const draw = (it, col) => {
      let d = '';
      (it.curves || []).forEach(c => {
        const pts = []; for (let i = 0; i <= 80; i++) { const x = c.from + (c.to - c.from) * i / 80; pts.push(h.f2(X(x)) + ',' + h.f2(Y(c.f(x)))); }
        d += `<polyline points="${pts.join(' ')}" fill="none" stroke="${col}" stroke-width="0.55" stroke-linecap="round" stroke-linejoin="round"/>`;
      });
      (it.pts || []).forEach(p => { d += `<circle cx="${h.f2(X(p.x))}" cy="${h.f2(Y(p.y))}" r="0.95" fill="${p.open ? '#fff' : col}" stroke="${col}" stroke-width="0.4"/>`; });
      (it.texts || []).forEach(t => { d += h.tx(X(t.x), Y(t.y), t.t, 2.9, t.a || 'start', HALO); });
      return d;
    };
    s += draw(o.given || {}, '#1f2328');
    const an = draw(o.ans || {}, RED);
    return s + (an ? h.ans(an) : '');
  });

  const sq = x => x * x;
  // ワークシート：図1〜図3（x＝1、2、3 のときの P、Q の位置）。長方形 AB＝4cm、AD＝8cm。AP＝x、AQ＝2x
  const snaps = [1, 2, 3].map(x => rectSnap(4, 8, x, 2 * x, 'x＝' + x + ' のとき', '4cm', '8cm'));
  // ワークシート 例題：y＝x²（0≦x≦4）をかく方眼（解答のとき、グラフが赤で出る）
  const exG = gxy({ xmax: 5, xlab: 1, xgrid: 1, ymax: 18, ylab: 4, ygrid: 2, xname: 'x（秒）', yname: 'y（cm²）', padL: 12, ans: { curves: [{ f: sq, from: 0, to: 4 }], pts: [0, 1, 2, 3, 4].map(x => ({ x, y: sq(x) })) } });
  // 演習プリント：図1（正方形 1辺 10cm。x＝4 のとき）・図2（直角三角形。x＝1.5 のとき BP＝1.5、BQ＝6）
  const fig1 = shape({
    cap: '図1', poly: [[0, 10], [0, 0], [10, 0], [10, 10]], fill: [[0, 10], [0, 6], [4, 10]], segs: [[0, 6, 4, 10]], dots: [[0, 6], [4, 10]],
    names: [{ t: 'A', x: 0, y: 10, dx: -2.4, dy: -1.4 }, { t: 'B', x: 0, y: 0, dx: -2.4, dy: 3.8 }, { t: 'C', x: 10, y: 0, dx: 2.4, dy: 3.8 }, { t: 'D', x: 10, y: 10, dx: 2.4, dy: -1.4 }, { t: 'P', x: 0, y: 6, dx: -2.6, dy: 1.2 }, { t: 'Q', x: 4, y: 10, dx: 0, dy: -2 }],
    texts: [{ t: '10cm', x: 5, y: 0, dy: 4 }]
  });
  const fig2 = triSnap(8, 12, 1.5, 6, '図2');
  // （7）：長方形 AB＝4cm、AD＝8cm。P の道すじ（A→B→C）、Q の道すじ（A→D）を矢じりで示す
  const route = shape({
    poly: [[0, 4], [0, 0], [8, 0], [8, 4]], heads: [[0, 1.8, -90], [3.8, 0, 0], [3.8, 4, 0]],
    names: [{ t: 'A', x: 0, y: 4, dx: -2.4, dy: -1.4 }, { t: 'B', x: 0, y: 0, dx: -2.4, dy: 3.8 }, { t: 'C', x: 8, y: 0, dx: 2.4, dy: 3.8 }, { t: 'D', x: 8, y: 4, dx: 2.4, dy: -1.4 }],
    texts: [{ t: '4cm', x: 0, y: 2, dx: -3, dy: 1, a: 'end' }, { t: '8cm', x: 4, y: 0, dy: 4.2 }], ml: 14, mr: 10
  });
  // （7）：x＝0〜4 のグラフ（印刷）。続きを、x＝12 までかく
  const backG = gxy({ xmax: 12, xlab: 2, xgrid: 1, ymax: 20, ylab: 4, ygrid: 2, xname: 'x（秒）', yname: 'y（cm²）', padL: 12, given: { curves: [{ f: sq, from: 0, to: 4 }], pts: [{ x: 4, y: 16 }] } });
  // 小テスト：図（正方形 1辺 8cm。x＝3 のとき）
  const qfig = shape({
    poly: [[0, 8], [0, 0], [8, 0], [8, 8]], fill: [[0, 8], [0, 5], [3, 8]], segs: [[0, 5, 3, 8]], dots: [[0, 5], [3, 8]],
    names: [{ t: 'A', x: 0, y: 8, dx: -2.4, dy: -1.4 }, { t: 'B', x: 0, y: 0, dx: -2.4, dy: 3.8 }, { t: 'C', x: 8, y: 0, dx: 2.4, dy: 3.8 }, { t: 'D', x: 8, y: 8, dx: 2.4, dy: -1.4 }, { t: 'P', x: 0, y: 5, dx: -2.6, dy: 1.2 }, { t: 'Q', x: 3, y: 8, dx: 0, dy: -2 }],
    texts: [{ t: '8cm', x: 4, y: 0, dy: 4 }], mt: 6, mb: 7
  });

  IK.lesson('kansu-13', {
    unit: 'kansu', unitName: '関数 y＝ax²', form: 'new', no: '第13時', title: '図形の中を動く点がつくる面積を調べよう',
    summary: '長方形の中を動く 2点 P、Q がつくる三角形の面積を、時間 x 秒の関数 y＝x² として、式・表・グラフに表す。x の変域をおさえ、点が着いて止まると式が変わるときは、変域に分けて考える。',
    head: '関数 y＝ax²　第13時',
    pitch: 8, dots: true,
    checks: [
      // 今日の問い：A を原点に、P＝(0, −x)、Q＝(2x, 0)。△APQ の面積（外積）＝x²。P は 4÷1＝4秒後に B、Q は 8÷2＝4秒後に D に着く
      '(tri => [0, 1, 2, 3, 4].map(x => tri([0, 0], [0, -x], [2 * x, 0])).join() === "0,1,4,9,16" && near(4 / 1, 8 / 2))((a, b, c) => Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])) / 2)',
      // 例題：長方形 4×8＝32、その [[1/4]] は 8。y＝8 は、表の 4（x＝2）と 9（x＝3）のあいだ。x²＝8 → x＝2√2（約 2.83）。0≦x≦4 にふくまれる
      'near(4 * 8 / 4, 8) && 4 < 8 && 8 < 9 && near(Math.sqrt(8), 2 * Math.sqrt(2)) && Math.sqrt(8) > 2 && Math.sqrt(8) < 3 && Math.sqrt(8) <= 4',
      // （1）（2）正方形 10cm、P＝(0, −x)、Q＝(x, 0)：y＝[[1/2]]x²。x＝6 → 18、y＝32 → x＝8（0≦x≦10）。10÷1＝10秒後に B、D に着く
      '(tri => [0, 2, 4, 6, 10].every(x => near(tri([0, 0], [0, -x], [x, 0]), x * x / 2)) && near(tri([0, 0], [0, -6], [6, 0]), 18) && near(tri([0, 0], [0, -8], [8, 0]), 32) && 8 <= 10 && near(10 / 1, 10))((a, b, c) => Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])) / 2)',
      // （3）直角三角形 B(0,0)、A(0,8)、C(12,0)。P＝(0, x)（BA 上）、Q＝(min(4x, 12), 0)（BC 上）。Q は 12÷4＝3秒後に C、P は 8÷1＝8秒後に A に着く。0≦x≦3：2x²、3≦x≦8：6x
      '(tri => near(12 / 4, 3) && near(8 / 1, 8) && [0, 0.5, 1, 2, 3].every(x => near(tri([0, 0], [0, x], [4 * x, 0]), 2 * x * x)) && [3, 4, 5, 6.5, 8].every(x => near(tri([0, 0], [0, x], [12, 0]), 6 * x)) && near(2 * 9, 6 * 3))((a, b, c) => Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])) / 2)',
      // （4）x＝1 → 2×1²＝2、x＝7 → 6×7＝42　（5）y＝4.5：0≦x≦3 で 2x²＝4.5 → x＝1.5（3≦x≦8 の 6x は 18 以上で 4.5 にならない）　（6）y＝30：0≦x≦3 の y は 18 以下 → 3≦x≦8 で 6x＝30 → x＝5
      'near(2 * 1, 2) && near(6 * 7, 42) && near(2 * 1.5 * 1.5, 4.5) && 1.5 >= 0 && 1.5 <= 3 && 6 * 3 === 18 && 18 > 4.5 && 2 * 3 * 3 === 18 && 18 < 30 && near(6 * 5, 30) && 5 >= 3 && 5 <= 8',
      // （7）考えよう（答えは紙面に載せない）：4≦x≦12。A＝(0,0)、P＝(x−4, −4)（BC 上）、Q＝D＝(8, 0)。面積はいつも 16（底辺 AD＝8、高さ AB＝4）
      '(tri => [4, 5, 6, 8, 10, 12].every(x => near(tri([0, 0], [x - 4, -4], [8, 0]), 16)) && near(4 + 8 / 1, 12))((a, b, c) => Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])) / 2)',
      // （8）長方形 AB＝6、AD＝12。P＝(4x, 0)（AD 上）、Q＝(0, −2x)（AB 上）。12÷4＝6÷2＝3秒後に D、B に着く。y＝4x²（0≦x≦3）。長方形 72 の [[1/3]]＝24 → x²＝6 → x＝√6（約 2.45。3 より小さい）
      '(tri => near(12 / 4, 3) && near(6 / 2, 3) && [0, 1, 2, 3].every(x => near(tri([0, 0], [4 * x, 0], [0, -2 * x]), 4 * x * x)) && near(72 / 3, 24) && near(4 * 6, 24) && Math.sqrt(6) < 3 && near(tri([0, 0], [12, 0], [0, -6]), 36))((a, b, c) => Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])) / 2)',
      // 小テスト：正方形 8cm、y＝[[1/2]]x²（0≦x≦8）。x＝4 → 8、y＝18 → x＝6、x＝8 のとき 32＝64÷2。チャレンジ：64÷4＝16、x²＝32 → x＝4√2（約 5.66。8 より小さい）
      'near(4 * 4 / 2, 8) && near(6 * 6 / 2, 18) && near(8 * 8 / 2, 32) && near(64 / 32, 2) && near(32 / 2, 16) && near(Math.sqrt(32), 4 * Math.sqrt(2)) && Math.sqrt(32) < 8 && near(64 / 4, 16)'
    ],

    /* ================= ワークシート（A4 1枚・約12分） ================= */
    ws: [
      M('図形の中を動く点がつくる面積を、調べよう'),
      K('今日の問い', '長方形 ABCD で、AB＝4cm、AD＝8cm。点 P は A から B まで毎秒 1cm、点 Q は A から D まで毎秒 2cm で、同時に出発して動く。どちらも 4秒後に着く。x 秒後（0≦x≦4）の △APQ の面積を y cm^2 とすると、y は、どのように変わっていくだろう。', 4),
      F(5, snaps[0], snaps[1], snaps[2]),
      T('①', '自分の考え（3分）　表・式・グラフなど、自分で選んで調べよう。', 1),
      B(4, '（例）AP＝x、AQ＝2x だから　y＝[[1/2]]×x×2x＝x^2\nx＝1、2、3、4 のとき、y＝1、4、9、16\n時間が 2倍、3倍になると、面積は 4倍、9倍になる。'),
      T('②', 'ペアの考え（3分）　自分とちがう調べ方を書こう。', 1),
      B(3, ''),
      G(1),
      WD('点が進む長さ ＝（{{速さ}}）×（時間）\nx のとる値の範囲を、x の{{変域}}という。\ny＝x^2 のグラフは{{放物線}}で、変域のぶんだけかく。', 3, { label: 'ことば（教科書で調べよう）' }),
      G(1),
      K('例題', 'y＝{{x^2}}（0≦x≦4）として、表をうめ、グラフに表そう。', 1),
      C2([
        TB('x（秒）', ['0', '1', '2', '3', '4'], [['y（cm²）', ['{{0}}', '{{1}}', '{{4}}', '{{9}}', '{{16}}']]], { hw: 20 }),
        T('', '【面積が長方形の [[1/4]]】何秒後だろう。グラフから見当をつけ、式でも求めよう。', 3),
        B(3, '32÷4＝8　y＝8 とすると\nx^2＝8　0≦x≦4 だから\nx＝2√{2}（秒後）')
      ], [
        F(8, exG)
      ], '1:1')
    ],

    /* ================= 演習プリント（A4 表裏） ================= */
    dr: [
      HD('確かめる', 'ことばと、基本をたしかめよう。'),
      WD('① 点が進む長さは、（{{速さ}}）×（時間）で表せる。\n② y が x の式で表されるとき、x のとる値の範囲を x の{{変域}}という。\n③ 点が動く辺が変わると、y を表す{{式}}も変わる。\n④ y＝ax^2 のグラフは{{放物線}}の形になる。', 4, { label: 'ことば' }),
      T('図1', '1辺 10cm の正方形 ABCD で、点 P は A から B まで、点 Q は A から D まで、どちらも毎秒 1cm で、同時に出発して動く。x 秒後の △APQ の面積を y cm^2 とする。', 2),
      F(6, fig1, fig2),
      C2([
        T('（1）', 'y を x の式で表し、x の変域を書こう。', 2),
        B(2, 'AP＝AQ＝x　y＝[[1/2]]x^2\n0≦x≦10')
      ], [
        T('（2）', 'x＝6 のときの y の値と、y＝32 になる x の値を求めよう。', 2),
        B(2, 'x＝6 のとき y＝18\nx^2＝64　x＝8')
      ], '1:1'),
      MA('【説明】面積が x の2乗に比例するわけを、隣の人に説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      HD('使ってみる', '点が着いたときの、式の変わり方を調べよう。'),
      T('図2', '直角三角形 ABC（∠B＝90°、AB＝8cm、BC＝12cm）で、点 P は B から A まで毎秒 1cm、点 Q は B から C まで毎秒 4cm で、同時に出発して動く。Q は C に着いたら止まる。x 秒後の △PBQ の面積を y cm^2 とする。', 3),
      C2([
        T('（3）', '0≦x≦3 と 3≦x≦8 に分けて、y を x の式で表そう。', 2),
        B(3, 'Q が C に着くのは 3秒後\n0≦x≦3　y＝2x^2\n3≦x≦8　y＝6x')
      ], [
        T('（4）', 'x＝1 と x＝7 のときの y の値を求めよう。', 2),
        B(3, 'x＝1 は 0≦x≦3 の式\ny＝2×1^2＝2\nx＝7 のとき y＝6×7＝42')
      ], '1:1'),
      C2([
        T('（5）', 'y＝4.5 になるのは、何秒後だろう。', 1),
        B(3, '2x^2＝4.5　x^2＝2.25\n0≦x≦3 だから x＝1.5\n1.5秒後')
      ], [
        T('（6）', 'y＝30 になるのは、何秒後だろう。', 1),
        B(3, '0≦x≦3 では y は 18 以下\n3≦x≦8 の式で　6x＝30\nx＝5　5秒後')
      ], '1:1'),
      T('', '★ ここまでできたら、今日の合格！　　合格 ☐', 1),
      BR(),

      HD('ひろげる', '考えよう：点が着いたあとの面積を、調べよう。'),
      T('（7）', '長方形 ABCD（AB＝4cm、AD＝8cm）で、点 P は A から B、C へと毎秒 1cm、点 Q は A から D まで毎秒 2cm で、同時に出発して動く。Q は D に着いたら止まり、P は C まで進む。x 秒後の △APQ の面積を y cm^2 とする。図のグラフは 0≦x≦4 の部分。4≦x≦12 のとき、y は、どのように変わるだろう。', 4),
      F(6, Object.assign({}, route, { w: 1 }), Object.assign({}, backG, { w: 1.7 })),
      C2([
        T('', 'グラフの続きを図にかき、y のようすを書こう', 2),
        B(4, '')
      ], [
        T('', 'そうなるわけを、図をかいて説明しよう', 2),
        B(4, '')
      ], '1:1'),
      G(1),
      HD('チャレンジ★★', '入試にも出る問題。ヒントカードを見てもOK。'),
      C2([
        T('（8）', '長方形 ABCD（AB＝6cm、AD＝12cm）で、点 P は A から D まで毎秒 4cm、点 Q は A から B まで毎秒 2cm で、同時に出発して動く。x 秒後の △APQ の面積を y cm^2 とする。\n① y を x の式で表し、x の変域を書こう。\n② y が長方形の面積の [[1/3]] になるのは、何秒後か。', 7),
        B(6, '① AP＝4x、AQ＝2x\n　 y＝[[1/2]]×4x×2x＝4x^2\n　 12÷4＝3 だから 0≦x≦3\n② 72÷3＝24　4x^2＝24\n　 x^2＝6　0≦x≦3 だから\n　 x＝√{6}（秒後）')
      ], [
        MA('① AP、AQ の長さを、x で表せるかな。\n② 長方形の面積の [[1/3]] を y に入れると、どんな方程式になるかな。', 8, { label: 'ヒントカード' })
      ], '3:2')
    ],

    /* ================= 小テスト（A4 1枚・5分・10点満点） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      T('（1）', '1辺 8cm の正方形 ABCD で、点 P は A から B まで、点 Q は A から D まで、どちらも毎秒 1cm で、同時に出発して動く。x 秒後の △APQ の面積を y cm^2 とする。y を x の式で表し、x の変域を書こう。（3点）', 4),
      F(4, qfig),
      B(2, 'AP＝x、AQ＝x だから　y＝[[1/2]]x^2\n点は 8秒後に着くから　0≦x≦8'),
      T('（2）', 'x＝4 のときの y の値を求めよう。（2点）', 1),
      B(1, '[[1/2]]×4^2＝8'),
      T('（3）', 'y＝18 になるのは、何秒後か求めよう。（2点）', 1),
      B(2, '[[1/2]]x^2＝18　x^2＝36\n0≦x≦8 だから　x＝6　6秒後'),
      T('（4）', '点 P が B に着いたとき、△APQ の面積は、正方形 ABCD の面積の、何分のいくつか。（3点）', 2),
      B(2, 'x＝8 のとき y＝32。正方形は 64cm^2\n32÷64＝[[1/2]]'),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      T('（5）', '△APQ の面積が、正方形 ABCD の面積の [[1/4]] になるのは、何秒後か求めよう。', 2),
      B(4, '64÷4＝16　y＝16 とすると\n[[1/2]]x^2＝16　x^2＝32\n0≦x≦8 だから　x＝4√{2}\n4√{2} 秒後')
    ]
  });
})();
