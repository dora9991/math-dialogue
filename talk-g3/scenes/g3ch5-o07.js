/* 中3 5章 相似な図形　応用7「三角形と比」。自作問題。
   △ABC（AB＝10、BC＝15、CA＝20）の辺 AB、AC 上に D、E、DE∥BC。AD＝6、DB＝4、AE＝12、BC＝15。AD：DB＝AE：EC → EC＝8。AD：AB＝DE：BC＝6：10 → DE＝9。△ADE の周 27cm → △ABC の周 45cm（相似比 3：5）。
   図：B(0,0) C(15,0) A(−2.5,9.6825) D(−1,3.873) E(8,3.873)（python で、DE∥BC、AB＝10・AC＝20、AD：AB＝AE：AC＝DE：BC＝3：5、周 27 と 45 を確認）。
   誤答：AD：AE の対応（AC と書く）／足し算（10）／比を逆に（18）／AD：DB を DE：BC に使う（22.5）／半分（7.5）／相似比の取りちがい（18、39、54）。 */
(function () {
  const { T, B, Q, FIG } = KL;
  const P = {"A": [-2.5, 9.6825], "B": [0, 0], "C": [15, 0], "D": [-1, 3.873], "E": [8, 3.873]};
  const W = 1180, H = 600, VIEW = [-7.416, -3.371, 21.616, 11.39];
  const U = Math.min(W / (VIEW[2] - VIEW[0]), H / (VIEW[3] - VIEW[1]));   // 1単位が何pxか
  const mk = id => FIG(id, VIEW, W, H, [], { col: 1 });
  const G = (id, ...i) => ({ fig: id, items: i.flat(3) });
  // ---- 図の部品（この台本の中だけで使う） ----
  const sg = (a, b, c, o) => Object.assign({ k: 'seg', a, b, c: c || 'w', wd: 3.4, d: 0.5 }, o || {});
  const tx = (x, y, text, c, o) => Object.assign({ k: 'label', at: [x, y], text, c: c || 'w', size: 27, d: 0.3 }, o || {});
  const nm = (name, p, dir, c) => ({ k: 'pt', at: p, name, dir, off: 28, c: c || 'y', r: 6, d: 0.25 });
  const nrm = (a, b) => { const l = Math.hypot(b[0] - a[0], b[1] - a[1]); return [(b[0] - a[0]) / l, (b[1] - a[1]) / l]; };
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  // 等しい長さの印：辺の真ん中に、辺と直角の短い線を n 本
  const tick = (a, b, n, c) => { const u = nrm(a, b), v = [-u[1], u[0]], m = mid(a, b), h = 12 / U, g = 8 / U, o = []; for (let i = 0; i < n; i++) { const s = (i - (n - 1) / 2) * g, p = [m[0] + u[0] * s, m[1] + u[1] * s]; o.push(sg([p[0] - v[0] * h, p[1] - v[1] * h], [p[0] + v[0] * h, p[1] + v[1] * h], c, { wd: 3, d: 0.2 })); } return o; };
  // 平行の印：辺の a から t の位置に、a→b の向きの「＞」を n 個（t を省くと真ん中）
  const par = (a, b, n, c, t) => { const u = nrm(a, b), v = [-u[1], u[0]], f = t == null ? 0.5 : t, m = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f], h = 11 / U, g = 17 / U, o = []; for (let i = 0; i < n; i++) { const s = (i - (n - 1) / 2) * g, p = [m[0] + u[0] * s, m[1] + u[1] * s], tip = [p[0] + u[0] * h * 0.7, p[1] + u[1] * h * 0.7]; o.push(sg([p[0] - u[0] * h * 0.7 + v[0] * h, p[1] - u[1] * h * 0.7 + v[1] * h], tip, c, { wd: 2.6, d: 0.2 }), sg([p[0] - u[0] * h * 0.7 - v[0] * h, p[1] - u[1] * h * 0.7 - v[1] * h], tip, c, { wd: 2.6, d: 0.2 })); } return o; };
  const deg = (o, p) => (Math.atan2(p[1] - o[1], p[0] - o[0]) * 180 / Math.PI + 360) % 360;
  const at = (p, r, d) => [p[0] + r * Math.cos(d * Math.PI / 180), p[1] + r * Math.sin(d * Math.PI / 180)];
  // 角の印：点 o を頂点に、半直線 o→p と o→q ではさまれた角（小さいほう）に、半径 r px の弧を n 本かく
  const span = (o, p, q) => { let a1 = deg(o, p), a2 = deg(o, q); if ((a2 - a1 + 360) % 360 > 180) { const t = a1; a1 = a2; a2 = t; } return [a1, a1 + (a2 - a1 + 360) % 360]; };
  const an = (o, p, q, r, c, n) => { const s = span(o, p, q), k = n || 1, out = []; for (let i = 0; i < k; i++) { const rr = (r + i * 7) / U; out.push({ k: 'ell', o, rx: rr, ry: rr, a1: s[0], a2: s[1], c, wd: 3.2, d: 0.4 }); } return out; };
  const anLab = (o, p, q, r, text, c, opt) => { const s = span(o, p, q), m = at(o, r / U, (s[0] + s[1]) / 2); return tx(m[0], m[1] , text, c, Object.assign({ size: 25 }, opt || {})); };
  const pol = (pts, c, fill, o) => Object.assign({ k: 'poly', pts, close: true, c, wd: 3.4, fill, alpha: 0.14, d: 0.6 }, o || {});
  // 直角の印：頂点 o で、o→p と o→q が直角
  const rtm = (o, p, q, c) => ({ k: 'right', at: o, u: nrm(o, p), v: nrm(o, q), s: 17, c: c || 'w' });
  // 辺 a→b の長さの文字：真ん中から、左側(offpx>0)か右側(offpx<0)に offpx だけはなす
  const sl = (a, b, text, offpx, c, o) => { const u = nrm(a, b), m = mid(a, b), k = offpx / U; return tx(m[0] - u[1] * k, m[1] + u[0] * k , text, c, o); };
  const dots = (list, c) => ({ k: 'pts', list, c: c || 'y', r: 6, d: 0.25 });
  // 三角形などの外がわに置く、辺の長さの文字：重心 cen から遠ざかる向きに offpx だけはなす
  const sk = (a, b, cen, text, offpx, c, o) => { const u = nrm(a, b), m = mid(a, b); let n = [-u[1], u[0]]; if ((m[0] - cen[0]) * n[0] + (m[1] - cen[1]) * n[1] < 0) n = [-n[0], -n[1]]; const k = offpx / U; return tx(m[0] + n[0] * k, m[1] + n[1] * k, text, c, o); };
  const cen3 = (a, b, c) => [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3];
  // 寸法線：辺 a→b を、重心 cen と反対がわへ px だけ平行にずらした線（両はしに短い印）と、長さの文字（text が null なら文字なし）
  const dim = (a, b, cen, px, c, text, o) => { const u = nrm(a, b), m = mid(a, b); let n = [-u[1], u[0]]; if ((m[0] - cen[0]) * n[0] + (m[1] - cen[1]) * n[1] < 0) n = [-n[0], -n[1]]; const k = px / U, h = 7 / U, p = [a[0] + n[0] * k, a[1] + n[1] * k], q = [b[0] + n[0] * k, b[1] + n[1] * k], out = [sg(p, q, c, { wd: 3.2 }), sg([p[0] - n[0] * h, p[1] - n[1] * h], [p[0] + n[0] * h, p[1] + n[1] * h], c, { wd: 3, d: 0.2 }), sg([q[0] - n[0] * h, q[1] - n[1] * h], [q[0] + n[0] * h, q[1] + n[1] * h], c, { wd: 3, d: 0.2 })]; if (text) { const ax = n[0] > 0.4 ? 'start' : n[0] < -0.4 ? 'end' : 'middle', kk = (px + (ax === 'middle' ? 24 : 12)) / U; out.push(tx(m[0] + n[0] * kk, m[1] + n[1] * kk, text, c, Object.assign({ anchor: ax }, o || {}))); } return out; };
  const f1 = mk('g1'), f2 = mk('g2'), f3 = mk('g3');
  const { A, B: Bp, C, D, E } = P;
  const cen = cen3(A, Bp, C);
  // ---- 図 ----
  const fig = [pol([A, Bp, C], 'w'), sg(D, E, 'w'), nm('A', A, [0, 1]), nm('B', Bp, [-0.7, -0.7]), nm('C', C, [0.7, -0.7]), nm('D', D, [0.9, -0.6]), nm('E', E, [-0.5, -0.9]),
    par(D, E, 1, 'b', 0.5), par(Bp, C, 1, 'b', 0.5)];
  const small = [pol([A, D, E], 'y', 'y')];
  const lens = [dim(A, D, cen, 22, 'w', '6cm'), dim(D, Bp, cen, 22, 'w', '4cm'), dim(A, E, cen, 22, 'w', '12cm'), dim(E, C, cen, 22, 'w', 'x cm'), dim(Bp, C, cen, 30, 'w', '15cm'), tx(3.5, 2.7, 'y cm', 'w')];
  const partR = [dim(A, D, cen, 22, 'p', null), dim(D, Bp, cen, 22, 'g', null), dim(A, E, cen, 22, 'p', null), dim(E, C, cen, 22, 'g', null)];
  const wholeR = [dim(A, D, cen, 22, 'p', null), dim(A, Bp, cen, 122, 'b', null), tx(3.5, 2.7, 'y cm', 'p'), dim(Bp, C, cen, 30, 'b', null)];
  const done = [dim(E, C, cen, 68, 'y', 'EC＝8cm').map(i => Object.assign(i, { temp: true })), tx(3.5, 4.9, '9cm', 'y', { temp: true })];

  KL.lesson({ id: 'g3ch5-o07', unit: '中3　相似な図形', kick: '3年5章　応用7', title: '三角形と比', card: '三角形と比', sub: 'ホー先生とポンタと いっしょに ゆっくり解説', cols: [0.34, 0.66], steps: [
    T('みなさん、こんにちは。今日は、三角形と比の性質を使って、線分の長さを、求めます。', { title: true, point: false, ft: 'happy' }),
    B('DE と BC は、平行でしょ？ だったら、DE は、BC の、半分くらいだよ！ 目分量で、バッチリ！', { say: 'ディーイー と ビーシー は、へいこうでしょ？ だったら、ディーイー は、ビーシー の、半分くらいだよ！ 目分量で、バッチリ！', title: true, fb: 'proud', up: true }),
    T('目分量では、決まりません。平行線が作る、辺の比を、使って、計算で求めます。', { say: '目分量では、決まりません。へいこう線が作る、辺の比を、使って、計算で求めます。', title: true, point: false, ft: 'sigh', fx: { t: 'sweat' } }),

    T('問題です。△ABC の辺 AB、AC 上に、点D、Eを、DE∥BC となるように、とります。', { say: '問題です。さんかく エービーシー の辺 エービー、エーシー 上に、点ディー、イーを、ディーイー へいこう ビーシー となるように、とります。', part: '問題を読もう', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'めあて', text: '三角形と比の性質で\n長さを求めよう', t: 3.5 }, { col: 0, type: 'box', color: 'p', size: 'xs', label: '問題', text: 'DE∥BC\nAD＝6cm　DB＝4cm\nAE＝12cm　BC＝15cm', t: 5.0 }, Object.assign(f1, { prims: [] })],
      draw: [G('g1', fig, lens)] }),
    T('EC を x cm、DE を y cm として、2つの長さを、求めましょう。まず、EC から、考えます。', { say: 'イーシー を エックス センチ、ディーイー を ワイ センチ として、2つの長さを、求めましょう。まず、イーシー から、考えます。', ft: 'normal', point: false, draw: [G('g1', small)] }),
    T('DE∥BC なので、AB 上の分け方と、AC 上の分け方は、同じ比になります。AD：DB と、等しい比を、探しましょう。', { say: 'ディーイー へいこう ビーシー なので、エービー 上の分け方と、エーシー 上の分け方は、同じ比になります。エーディー たい ディービー と、等しい比を、探しましょう。', ft: 'normal', point: false }),

    /* ---------- 問1：どの比が等しいか ---------- */
    Q('q1', T('問題です。AD：DB＝AE：□ の □ に入る、線分は、どれでしょう。', { say: '問題です。エーディー たい ディービー イコール エーイー たい □ の □ に入る、線分は、どれでしょう。', ft: 'normal' }),
      [{ t: 'DE' }, { t: 'EC', ok: true }, { t: 'AC' }, { t: 'BC' }],
      { 0: [T('DE は、平行線の上の、線分です。AB を、AD と DB に分けたのと、同じ分け方を、AC でしたのが、AE と EC です。', { say: 'ディーイー は、へいこう線の上の、線分です。エービー を、エーディー と ディービー に分けたのと、同じ分け方を、エーシー でしたのが、エーイー と イーシー です。', ft: 'normal' })],
        2: [B('AD の相手は、AB で、AE の相手は、AC でしょ？ 同じ直線だから、AC だよ！', { say: 'エーディー の相手は、エービー で、エーイー の相手は、エーシー でしょ？ 同じ直線だから、エーシー だよ！', fb: 'happy', up: true }), T('AD：AB なら、AE：AC です。でも、左は AD：DB と、部分：部分 です。右も、部分：部分で、AE：EC と、そろえます。', { say: 'エーディー たい エービー なら、エーイー たい エーシー です。でも、左は エーディー たい ディービー と、部分 たい 部分 です。右も、部分 たい 部分で、エーイー たい イーシー と、そろえます。', ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        ok: [T('正解！ AD：DB＝AE：EC です。AB を AD と DB に分けた比と、AC を AE と EC に分けた比は、等しくなります。', { say: '正解！ エーディー たい ディービー イコール エーイー たい イーシー です。エービー を エーディー と ディービー に分けた比と、エーシー を エーイー と イーシー に分けた比は、等しくなります。', ft: 'happy' }), B('部分：部分で、そろえるんだね！', { say: '部分 たい 部分で、そろえるんだね！', fb: 'star', up: true })],
        wrong: [T('BC は、底辺で、DE と、対になる線分です。AC 上の分け方は、AE：EC です。AD：DB＝AE：EC と、そろえます。', { say: 'ビーシー は、ていへんで、ディーイー と、対になる線分です。エーシー 上の分け方は、エーイー たい イーシー です。エーディー たい ディービー イコール エーイー たい イーシー と、そろえます。', ft: 'normal' })] }),

    /* ---------- 2ページ目：EC と DE ---------- */
    T('AD：DB＝AE：EC を使って、EC を求めます。AD＝6cm、DB＝4cm、AE＝12cm です。', { say: 'エーディー たい ディービー イコール エーイー たい イーシー を使って、イーシー を求めます。エーディー イコール 6センチ、ディービー イコール 4センチ、エーイー イコール 12センチ です。', clear: true, cols: [0.34, 0.66], part: '比を使って求める', ft: 'normal',
      add: [{ col: 0, type: 'text', size: 'xs', label: '比例式', text: 'AD：DB＝AE：EC\n6：4＝12：x', t: 4.0 }, Object.assign(f2, { prims: [] })], draw: [G('g2', fig, small, lens, partR)] }),

    /* ---------- 問2：EC ---------- */
    Q('q2', T('問題です。EC の長さ x は、何cmでしょう。', { say: '問題です。イーシー の長さ エックス は、何センチでしょう。', ft: 'normal' }),
      [{ t: '8cm', ok: true }, { t: '10cm' }, { t: '18cm' }, { t: '20cm' }],
      { 1: [B('6 から 4 は、2へってるでしょ？ だから、12 から 2 を引いて、10cm！', { say: '6 から 4 は、2へってるでしょ？ だから、12 から 2 を引いて、10センチ！', fb: 'happy', up: true }), T('引き算では、ありません。AD：DB＝6：4＝3：2 です。AE：EC も 3：2 なので、EC は、12 の [[2/3]] の、8cm です。', { say: '引き算では、ありません。エーディー たい ディービー イコール 6たい4 イコール 3たい2 です。エーイー たい イーシー も 3たい2 なので、イーシー は、12 の 3分の2 の、8センチ です。', ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        2: [T('18cm は、6：4＝x：12 と、逆に立てた答えです。AD は DB より長いので、AE も EC より長く、EC は 12cm より、短くなります。', { say: '18センチ は、6たい4 イコール エックス たい 12 と、逆に立てた答えです。エーディー は ディービー より長いので、エーイー も イーシー より長く、イーシー は 12センチ より、短くなります。', ft: 'normal' })],
        ok: [T('正解！ 6：4＝12：x から、6x＝48、x＝8。EC は 8cm です。', { say: '正解！ 6たい4 イコール 12 たい エックス から、6エックス イコール 48、エックス イコール 8。イーシー は 8センチ です。', ft: 'happy', draw: [G('g2', done[0])] }), B('AD が DB の 1.5倍なら、AE も EC の 1.5倍なんだね！', { say: 'エーディー が ディービー の 1.5倍なら、エーイー も イーシー の 1.5倍なんだね！', fb: 'star', up: true })],
        wrong: [T('20cm は、AC の長さです。AC＝AE＋EC＝12＋8＝20cm で、EC は 8cm です。', { say: '20センチ は、エーシー の長さです。エーシー イコール エーイー たす イーシー イコール 12 たす 8 イコール 20センチ で、イーシー は 8センチ です。', ft: 'normal' })] }),
    T('次は、DE です。DE と BC の比は、AD と、AB の比に、等しくなります。AB は、AD＋DB で、10cm です。', { say: '次は、ディーイー です。ディーイー と ビーシー の比は、エーディー と、エービー の比に、等しくなります。エービー は、エーディー たす ディービー で、10センチ です。', ft: 'normal', point: false, draw: [G('g2', wholeR)],
      add: [{ col: 0, type: 'text', size: 'xs', label: '全体との比', text: 'AD：AB＝DE：BC\n6：10＝y：15', t: 4.0 }] }),

    /* ---------- 問3：DE ---------- */
    Q('q3', T('問題です。DE の長さ y は、何cmでしょう。', { say: '問題です。ディーイー の長さ ワイ は、何センチでしょう。', ft: 'normal' }),
      [{ t: '6cm' }, { t: '7.5cm' }, { t: '9cm', ok: true }, { t: '22.5cm' }],
      { 1: [B('DE は、BC と平行だから、ちょうど、半分の、7.5cm！', { say: 'ディーイー は、ビーシー とへいこうだから、ちょうど、半分の、7.5センチ！', fb: 'happy', up: true }), T('半分では、ありません。AD：AB＝6：10＝3：5 なので、DE は、BC の [[3/5]] で、9cm です。', { say: '半分では、ありません。エーディー たい エービー イコール 6たい10 イコール 3たい5 なので、ディーイー は、ビーシー の 5分の3 で、9センチ です。', ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        3: [B('AD：DB＝DE：BC で、6：4＝y：15 だから、y＝22.5cm！', { say: 'エーディー たい ディービー イコール ディーイー たい ビーシー で、6たい4 イコール ワイ たい 15 だから、ワイ イコール 22.5センチ！', fb: 'happy', up: true }), T('AD：DB は、部分：部分の比です。DE：BC と等しいのは、全体との比、AD：AB です。6：10＝y：15 から、y＝9 です。', { say: 'エーディー たい ディービー は、部分 たい 部分の比です。ディーイー たい ビーシー と等しいのは、全体との比、エーディー たい エービー です。6たい10 イコール ワイ たい 15 から、ワイ イコール 9 です。', ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        ok: [T('正解！ 6：10＝y：15 から、10y＝90、y＝9。DE は 9cm です。BC より、短くなっています。', { say: '正解！ 6たい10 イコール ワイ たい 15 から、10ワイ イコール 90、ワイ イコール 9。ディーイー は 9センチ です。ビーシー より、短くなっています。', ft: 'happy', draw: [G('g2', done[1])] }), B('DE は、BC の [[3/5]] だったんだね！', { say: 'ディーイー は、ビーシー の 5分の3 だったんだね！', fb: 'star', up: true })],
        wrong: [T('6cm は、AD の長さです。DE と AD は、別の線分です。DE：BC＝AD：AB＝3：5 から、DE＝9cm です。', { say: '6センチ は、エーディー の長さです。ディーイー と エーディー は、別の線分です。ディーイー たい ビーシー イコール エーディー たい エービー イコール 3たい5 から、ディーイー イコール 9センチ です。', ft: 'normal' })] }),

    /* ---------- 3ページ目：周の長さ ---------- */
    T('最後は、周の長さです。△ADE は、AD＝6cm、DE＝9cm、AE＝12cm なので、周は、27cm です。', { say: '最後は、周の長さです。さんかく エーディーイー は、エーディー イコール 6センチ、ディーイー イコール 9センチ、エーイー イコール 12センチ なので、周は、27センチ です。', clear: true, cols: [0.34, 0.66], part: '周の長さ', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '相似比', text: '△ADE：△ABC\n＝AD：AB＝3：5', t: 3.5 }, { col: 0, type: 'text', size: 'xs', label: '周', text: '△ADE は 27cm', t: 3.0 }, Object.assign(f3, { prims: [] })],
      draw: [G('g3', fig, small, lens)] }),

    /* ---------- 問4：周 ---------- */
    Q('q4', T('問題です。△ABC の周の長さは、何cmでしょう。', { say: '問題です。さんかく エービーシー の周の長さは、何センチでしょう。', ft: 'happy' }),
      [{ t: '18cm' }, { t: '39cm' }, { t: '45cm', ok: true }, { t: '54cm' }],
      { 0: [B('AD：DB＝3：2 だから、△ADE が 3 なら、△ABC は 2。27 の [[2/3]] で、18cm！', { say: 'エーディー たい ディービー イコール 3たい2 だから、さんかく エーディーイー が 3 なら、さんかく エービーシー は 2。27 の 3分の2 で、18センチ！', fb: 'happy', up: true }), T('3：2 は、AD と DB の比で、相似比では、ありません。△ABC は、△ADE より大きいので、周も、27cm より、長くなります。相似比は、AD：AB＝3：5 です。', { say: '3たい2 は、エーディー と ディービー の比で、そうじ比では、ありません。さんかく エービーシー は、さんかく エーディーイー より大きいので、周も、27センチ より、長くなります。そうじ比は、エーディー たい エービー イコール 3たい5 です。', ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        1: [T('39 は、27 に、DB と EC だけを、足した数です。BC と DE の差、15−9＝6 も、足りません。', { say: '39 は、27 に、ディービー と イーシー だけを、足した数です。ビーシー と ディーイー の差、15 ひく 9 イコール 6 も、足りません。', ft: 'normal' })],
        ok: [T('正解！ AB＝10cm、AC＝20cm、BC＝15cm で、周は 45cm です。相似比 3：5 から、27×[[5/3]]＝45cm とも、たしかめられます。', { say: '正解！ エービー イコール 10センチ、エーシー イコール 20センチ、ビーシー イコール 15センチ で、周は 45センチ です。そうじ比 3たい5 から、27 かける 3分の5 イコール 45センチ とも、たしかめられます。', ft: 'happy' }), B('周の比も、相似比と同じ 3：5 だね！', { say: '周の比も、そうじ比と同じ 3たい5 だね！', fb: 'star', up: true })],
        wrong: [T('54 は、27 の2倍です。相似比は 3：5 なので、27 の [[5/3]] 倍の、45cm です。', { say: '54 は、27 の2倍です。そうじ比は 3たい5 なので、27 の 3分の5 倍の、45センチ です。', ft: 'normal' })] }),
    T('まとめです。DE∥BC のとき、AD：DB＝AE：EC は、部分：部分の比です。AD：AB＝DE：BC は、部分：全体の比です。', { say: 'まとめです。ディーイー へいこう ビーシー のとき、エーディー たい ディービー イコール エーイー たい イーシー は、部分 たい 部分の比です。エーディー たい エービー イコール ディーイー たい ビーシー は、部分 たい 全体の比です。', ft: 'normal', point: false,
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'ポイント', text: 'AD：DB＝AE：EC\n（部分：部分）\nAD：AB＝AE：AC＝DE：BC\n（部分：全体）', t: 6.5 }] }),
    B('部分と全体を、ごちゃまぜに、しなければ、いいんだね！', { fb: 'happy', up: true, fx: { b: 'e' } }),
    T('お疲れさまでした。成績は、こちらです。', { ft: 'happy', point: false, result: true })
  ] });
})();
