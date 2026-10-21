/* 中2 4章 平行と合同　第9時「三角形は、何がわかれば1つに決まるだろう」（探）。自作。三角形の合同条件（3つ）。
   図1：AB＝DE＝4cm，AC＝DF＝5cm で ∠A＝40°，∠D＝80°（第3辺 BC≒3.2cm，EF≒5.8cm で形がちがう）。図2：BC＝6，AB＝4，AC＝5 のコンパス作図。
   図3：SAS（BA＝5，BC＝6，∠B＝50°）と ASA（EF＝6，∠E＝50°，∠F＝60°）。図4：BC＝6，CA＝4，∠B＝30° → A は2か所（BA≒2.55cm と BA′≒7.84cm）。
   図5：∠50°・60°・70° の三角形を、底辺 2.4 と 3.8 の2つの大きさで。 */
(function () {
  const { T, B, Q } = KL;
  const f1 = KL.FIG('g', [0, 0, 11.8, 6.0], 1180, 600, [], { col: 1 });
  const f2 = KL.FIG('h', [0, 0, 11.8, 6.0], 1180, 600, [], { col: 1 });
  const f3 = KL.FIG('k', [0, 0, 11.8, 6.0], 1180, 600, [], { col: 1 });
  const f4 = KL.FIG('m', [0, 0, 11.8, 6.0], 1180, 600, [], { col: 1 });
  const f5 = KL.FIG('n', [0, 0, 11.8, 6.0], 1180, 600, [], { col: 1 });
  const G = (...i) => ({ fig: 'g', items: i.flat(3) });
  const H = (...i) => ({ fig: 'h', items: i.flat(3) });
  const K = (...i) => ({ fig: 'k', items: i.flat(3) });
  const M = (...i) => ({ fig: 'm', items: i.flat(3) });
  const N = (...i) => ({ fig: 'n', items: i.flat(3) });

  /* ---- 図の部品（自分の台本の中で定義） ---- */
  const cen = ps => [ps.reduce((s, p) => s + p[0], 0) / ps.length, ps.reduce((s, p) => s + p[1], 0) / ps.length];
  const unit = (a, b) => { const d = Math.hypot(b[0] - a[0], b[1] - a[1]); return [(b[0] - a[0]) / d, (b[1] - a[1]) / d]; };
  const tri = (ps, fill) => ({ k: 'poly', pts: ps, close: true, c: 'w', wd: 3.4, fill, alpha: 0.12 });
  const names = (ps, nm, c) => ps.map((p, i) => ({ k: 'pt', at: p, name: nm[i], dir: unit(cen(ps), p), off: 30, c: c || 'w', r: 5 }));
  const sideLab = (a, b, ps, text, c) => { const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], u = unit(cen(ps), m); return { k: 'label', at: [m[0] + u[0] * 0.4, m[1] + u[1] * 0.4], text, c: c || 'w', size: 28 }; };
  const tick = (a, b, n, c) => {   // 等しい辺の印：辺の中点に、辺に垂直な短い線を n 本
    const u = unit(a, b), nv = [-u[1], u[0]], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], out = [];
    for (let i = 0; i < n; i++) { const o = (i - (n - 1) / 2) * 0.11, q = [m[0] + u[0] * o, m[1] + u[1] * o]; out.push({ k: 'seg', a: [q[0] - nv[0] * 0.16, q[1] - nv[1] * 0.16], b: [q[0] + nv[0] * 0.16, q[1] + nv[1] * 0.16], c, wd: 3.2 }); }
    return out;
  };
  const angArc = (v, p, q, r, n, c) => {   // 頂点 v の内角（p と q のあいだ）に、弧を n 本
    const a1 = Math.atan2(p[1] - v[1], p[0] - v[0]) * 180 / Math.PI, a2 = Math.atan2(q[1] - v[1], q[0] - v[0]) * 180 / Math.PI;
    let d = ((a2 - a1) % 360 + 360) % 360, s = a1;
    if (d > 180) { s = a2; d = 360 - d; }
    const out = [];
    for (let i = 0; i < n; i++) out.push({ k: 'ell', o: v, rx: r + 0.12 * i, ry: r + 0.12 * i, a1: s, a2: s + d, c, wd: 3 });
    return out;
  };
  const angLab = (v, p, q, r, text, c) => { const u = unit(v, p), w = unit(v, q), s = unit([0, 0], [u[0] + w[0], u[1] + w[1]]); return { k: 'label', at: [v[0] + s[0] * (r + 0.45), v[1] + s[1] * (r + 0.45)], text, c, size: 26 }; };
  const lab = (at, text, c, size) => ({ k: 'label', at, text, c: c || 'w', size: size || 28 });
  const circ = (o, r, a1, a2, c) => ({ k: 'ell', o, rx: r, ry: r, a1, a2, c, wd: 3, dash: true });

  /* ---- 図1：辺が4cm と5cm の三角形（間の角が 40° と 80°）。0.75 単位／cm ---- */
  const a1 = [1.0, 1.3], b1 = [3.3, 3.23], c1 = [4.75, 1.3], d1 = [6.6, 1.3], e1 = [7.12, 4.25], f1p = [10.35, 1.3];
  const t1 = [a1, b1, c1], t1b = [d1, e1, f1p];
  const fig1 = [tri(t1, 'y'), tri(t1b, 'b'), names(t1, ['A', 'B', 'C']), names(t1b, ['D', 'E', 'F']),
    sideLab(a1, b1, t1, '4cm'), sideLab(a1, c1, t1, '5cm'), sideLab(d1, e1, t1b, '4cm'), sideLab(d1, f1p, t1b, '5cm'),
    tick(a1, b1, 1, 'y'), tick(d1, e1, 1, 'y'), tick(a1, c1, 2, 'p'), tick(d1, f1p, 2, 'p'),
    angArc(a1, c1, b1, 0.6, 1, 'g'), angLab(a1, c1, b1, 0.6, '40°', 'g'), angArc(d1, f1p, e1, 0.6, 1, 'g'), angLab(d1, f1p, e1, 0.6, '80°', 'g')];
  const third1 = [lab([4.35, 2.45], '？', 'y', 34), lab([9.2, 2.9], '？', 'y', 34)];

  /* ---- 図2：3辺 4cm，5cm，6cm（0.9 単位／cm）。B から半径 3.6，C から半径 4.5 の円 ---- */
  const b2 = [2.2, 1.2], c2 = [7.6, 1.2], a2 = [4.22, 4.18], t2 = [a2, b2, c2];
  const base2 = [{ k: 'seg', a: b2, b: c2, c: 'w', wd: 3.4 }, { k: 'pts', list: [b2, c2], c: 'w', r: 5 },
    { k: 'pt', at: b2, name: 'B', dir: [-0.7, -0.7], off: 30, c: 'w', r: 5 }, { k: 'pt', at: c2, name: 'C', dir: [0.7, -0.7], off: 30, c: 'w', r: 5 }, lab([4.9, 0.6], '6cm')];
  const arcs2 = [circ(b2, 3.6, 41.8, 69.8, 'y'), circ(c2, 4.5, 124.6, 152.6, 'p'), tri(t2, 'y'), { k: 'pt', at: a2, name: 'A', dir: [0, 1], off: 30, c: 'w', r: 5 },
    sideLab(a2, b2, t2, '4cm', 'y'), sideLab(a2, c2, t2, '5cm', 'p')];

  /* ---- 図3：左は 2辺とその間の角（0.7 単位／cm）、右は 1辺とその両端の角 ---- */
  const a3 = [3.45, 3.78], b3 = [1.2, 1.1], c3 = [5.4, 1.1], d3 = [9.09, 4.07], e3 = [6.6, 1.1], f3p = [10.8, 1.1];
  const t3 = [a3, b3, c3], t3b = [d3, e3, f3p];
  const sas = [tri(t3, 'y'), names(t3, ['A', 'B', 'C']), sideLab(b3, a3, t3, '5cm', 'y'), sideLab(b3, c3, t3, '6cm', 'p'), angArc(b3, c3, a3, 0.6, 1, 'g'), angLab(b3, c3, a3, 0.6, '50°', 'g')];
  const asaBase = [{ k: 'seg', a: e3, b: f3p, c: 'w', wd: 3.4 }, { k: 'pt', at: e3, name: 'E', dir: [-0.7, -0.7], off: 30, c: 'w', r: 5 }, { k: 'pt', at: f3p, name: 'F', dir: [0.7, -0.7], off: 30, c: 'w', r: 5 },
    lab([8.7, 0.55], '6cm', 'p'), angArc(e3, f3p, d3, 0.6, 1, 'g'), angLab(e3, f3p, d3, 0.6, '50°', 'g'), angArc(f3p, e3, d3, 0.6, 2, 'b'), angLab(f3p, e3, d3, 0.6, '60°', 'b')];
  const asaRays = [{ k: 'seg', a: e3, b: [9.26, 4.28], c: 'w', wd: 3, dash: true }, { k: 'seg', a: f3p, b: [8.97, 4.28], c: 'w', wd: 3, dash: true }];
  const asaTri = [tri(t3b, 'b'), { k: 'pt', at: d3, name: 'D', dir: [0, 1], off: 30, c: 'w', r: 5 }];

  /* ---- 図4：BC＝6cm，CA＝4cm，∠B＝30°（0.8 単位／cm）。A は2か所 ---- */
  const b4 = [2.0, 1.1], c4 = [6.8, 1.1], a4 = [3.77, 2.12], a4b = [7.43, 4.24];
  const base4 = [{ k: 'seg', a: b4, b: c4, c: 'w', wd: 3.4 }, { k: 'seg', a: b4, b: [7.82, 4.46], c: 'w', wd: 3, dash: true },
    { k: 'pt', at: b4, name: 'B', dir: [-0.7, -0.7], off: 30, c: 'w', r: 5 }, { k: 'pt', at: c4, name: 'C', dir: [0.7, -0.7], off: 30, c: 'w', r: 5 }, lab([4.4, 0.55], '6cm', 'p'),
    angArc(b4, c4, [7.82, 4.46], 0.7, 1, 'g'), angLab(b4, c4, [7.82, 4.46], 0.7, '30°', 'g'), lab([9.4, 1.1], 'CA＝4cm', 'y', 30)];
  const two4 = [circ(c4, 3.2, 78.6, 161.4, 'y'), tri([a4, b4, c4], 'y'), tri([a4b, b4, c4], 'b'),
    { k: 'pt', at: a4, name: 'A', dir: [-0.7, 0.7], off: 30, c: 'w', r: 5 }, { k: 'pt', at: a4b, name: 'A′', dir: [0.7, 0.7], off: 30, c: 'w', r: 5 },
    tick(c4, a4, 1, 'y'), tick(c4, a4b, 1, 'y')];

  /* ---- 図5：3つの角が 50°，60°，70° で、大きさがちがう2つの三角形 ---- */
  const a5 = [2.8, 3.36], b5 = [0.9, 1.1], c5 = [4.1, 1.1], d5 = [8.74, 4.49], e5 = [5.9, 1.1], f5p = [10.7, 1.1];
  const t5 = [a5, b5, c5], t5b = [d5, e5, f5p];
  const fig5 = [tri(t5, 'y'), tri(t5b, 'b'), names(t5, ['A', 'B', 'C']), names(t5b, ['D', 'E', 'F']),
    angArc(b5, c5, a5, 0.55, 1, 'g'), angLab(b5, c5, a5, 0.55, '50°', 'g'), angArc(e5, f5p, d5, 0.55, 1, 'g'), angLab(e5, f5p, d5, 0.55, '50°', 'g'),
    angArc(c5, b5, a5, 0.55, 2, 'p'), angLab(c5, b5, a5, 0.55, '60°', 'p'), angArc(f5p, e5, d5, 0.55, 2, 'p'), angLab(f5p, e5, d5, 0.55, '60°', 'p'),
    angArc(a5, b5, c5, 0.55, 3, 'y'), angLab(a5, b5, c5, 0.55, '70°', 'y'), angArc(d5, e5, f5p, 0.55, 3, 'y'), angLab(d5, e5, f5p, 0.55, '70°', 'y')];

  KL.lesson({ id: 'g2u4-09', unit: '中2　平行と合同', kick: '2年4章　第9時', title: '三角形は、何がわかれば1つに決まるだろう', card: '三角形は、何がわかれば1つに決まるだろう', sub: 'ホー先生とポンタと いっしょに ゆっくり解説', cols: [0.34, 0.66], steps: [
    T('みなさん、こんにちは。今日は、三角形が1つに決まるには、何がわかればよいのか、探します。', { title: true, point: false, ft: 'happy' }),
    B('電話で、「とがった三角形だよ」って言えば、友だちが、そっくり作れるよね！', { title: true, fb: 'happy', up: true }),
    T('それだけでは、そっくりには、なりません。何を伝えればよいか、探していきましょう。', { title: true, point: false, ft: 'sigh', fx: { t: 'sweat' } }),

    T('問題です。ポンタは、友だちに、三角形の型紙を、電話で伝えます。ぴったり重なる三角形を、作ってもらうには、何を伝えればよいでしょう。', { part: '問題を読もう', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'めあて', text: '何がわかれば\n三角形は1つに\n決まるだろう', t: 4.5 }] }),
    T('まず、辺を、2本だけ伝えます。4cm と5cm の辺を、ストローで作り、間の角を、40°と80°にしてみます。', { ft: 'normal', point: false,
      say: 'まず、辺を、2本だけ伝えます。4センチと5センチの辺を、ストローで作り、間の角を、40度と80度にしてみます。',
      add: [Object.assign(f1, { prims: [] })], draw: [G(fig1, third1)] }),

    /* ---------- 問1 ---------- */
    Q('q1', T('問題です。4cm と5cm の、2辺だけを決めます。ぴったり重なる三角形は、1つに決まるでしょうか。', { ft: 'normal',
      say: '問題です。4センチと5センチの、2辺だけを決めます。ぴったり重なる三角形は、1つに決まるでしょうか。' }),
      [{ t: 'かならず1つに決まる' }, { t: '2種類に決まる' }, { t: 'いくつも作れる', ok: true }, { t: '作れない' }],
      { 0: [B('ストローが2本なら、あとは気合で、決まるよ！', { fb: 'happy', up: true }),
            T('角を変えると、3本目の辺の長さが変わります。図の2つも、形がちがいます。2辺だけでは、決まりません。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        1: [T('2種類だけでは、ありません。間の角を、40°、80°、…と変えれば、いくらでも作れます。', { ft: 'normal' })],
        ok: [T('正解！ 間の角を変えると、形が変わります。2辺だけでは、決まりません。', { ft: 'happy' }), B('もっと、教えてあげないと、だめだね！', { fb: 'star', up: true })],
        wrong: [T('図の2つは、辺が4cm と5cm で同じですが、形がちがいます。作れないことは、ありません。', { ft: 'normal',
              say: '図の2つは、辺が4センチと5センチで同じですが、形がちがいます。作れないことは、ありません。' })] }),

    T('では、辺を、3本とも伝えます。4cm、5cm、6cm です。まず、6cm の辺 BC を、かきます。', { clear: true, cols: [0.34, 0.66], part: '3本の辺を伝える', ft: 'normal',
      say: 'では、辺を、3本とも伝えます。4センチ、5センチ、6センチです。まず、6センチの辺 ビーシー を、かきます。',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '3本の辺', text: '4cm　5cm　6cm', t: 3.5 }, Object.assign(f2, { prims: [] })], draw: [H(base2)] }),
    T('B から4cm、C から5cm の所を、コンパスで探します。2つの円が交わった点が、A です。', { ft: 'normal', point: false,
      say: 'ビー から4センチ、シー から5センチの所を、コンパスで探します。2つの円が交わった点が、エー です。',
      draw: [H(arcs2)] }),

    /* ---------- 問2 ---------- */
    Q('q2', T('問題です。ぴったり重なる三角形は、同じ形と数えます。3つの辺が4cm、5cm、6cm の三角形は、何種類できるでしょう。', { ft: 'normal',
      say: '問題です。ぴったり重なる三角形は、同じ形と数えます。3つの辺が4センチ、5センチ、6センチの三角形は、何種類できるでしょう。' }),
      [{ t: '1種類だけ', ok: true }, { t: '2種類' }, { t: '3種類' }, { t: 'いくつもできる' }],
      { 3: [B('辺の長さが同じでも、角度は、いろいろ変えられるでしょ？', { fb: 'happy', up: true }),
            T('3つの辺が決まると、角度も決まります。コンパスで探した点 A は、ほかには、ありません。', { say: '3つの辺が決まると、角度も決まります。コンパスで探した点 エー は、ほかには、ありません。', ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        1: [T('A は、BC の下側にも、できます。でも、裏返せば、ぴったり重なるので、同じ形と数えます。', { say: 'エー は、ビーシー の下側にも、できます。でも、裏返せば、ぴったり重なるので、同じ形と数えます。', ft: 'normal' })],
        ok: [T('正解！ 3つの辺の長さが決まれば、三角形は、1つに決まります。', { ft: 'happy' }), B('ストローが3本なら、ぐらぐら、動かないね！', { fb: 'star', up: true })],
        wrong: [T('3つの辺の長さが決まると、形は1つに決まります。種類は、ふえません。', { ft: 'normal' })] }),

    T('3つの辺の長さが決まれば、三角形は、1つに決まります。これが、1つ目の条件です。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'box', color: 'p', size: 'xs', label: '条件①', text: '3組の辺が\nそれぞれ等しい', t: 4.5 }] }),

    T('次は、2つの辺と、その間の角です。5cm と6cm の辺の間の角を、50°にします。', { clear: true, cols: [0.34, 0.66], part: '2辺とその間の角', ft: 'normal',
      say: '次は、2つの辺と、その間の角です。5センチと6センチの辺の間の角を、50度にします。',
      add: [Object.assign(f3, { prims: [] })], draw: [K(sas)] }),
    T('辺 BC をかき、B から50°の向きに、5cm の辺をかきます。A が決まるので、1つに決まります。', { ft: 'normal', point: false,
      say: '辺 ビーシー をかき、ビー から50度の向きに、5センチの辺をかきます。エー が決まるので、1つに決まります。',
      add: [{ col: 0, type: 'box', color: 'p', size: 'xs', label: '条件②', text: '2組の辺と\nその間の角が\nそれぞれ等しい', t: 5.0 }] }),
    T('もう1つ。1つの辺と、その両端の角です。6cm の辺 EF の、両端の角を、50°と60°にします。', { ft: 'normal', point: false,
      say: 'もう1つ。1つの辺と、その両端の角です。6センチの辺 イーエフ の、両端の角を、50度と60度にします。',
      draw: [K(asaBase, asaRays)] }),
    T('E と F から、線をのばします。交わった点が D で、これも、1つに決まります。', { ft: 'normal', point: false,
      say: 'イー と エフ から、線をのばします。交わった点が ディー で、これも、1つに決まります。',
      draw: [K(asaTri)],
      add: [{ col: 0, type: 'box', color: 'p', size: 'xs', label: '条件③', text: '1組の辺と\nその両端の角が\nそれぞれ等しい', t: 5.0 }] }),

    T('では、間ではない角を、使うと、どうでしょう。BC＝6cm、CA＝4cm、∠B＝30°です。', { clear: true, cols: [0.34, 0.66], part: '間ではない角', ft: 'normal',
      say: 'では、間ではない角を、使うと、どうでしょう。ビーシー イコール 6センチ、シーエー イコール 4センチ、かく ビー イコール 30度です。',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '注目', text: '∠B は CA の\n向かい側の角', t: 4.0 }, Object.assign(f4, { prims: [] })], draw: [M(base4)] }),

    /* ---------- 問3 ---------- */
    Q('q3', T('問題です。この3つがわかったとき、頂点 A は、何か所に決まるでしょう。', { ft: 'normal',
      say: '問題です。この3つがわかったとき、頂点 エー は、何か所に決まるでしょう。' }),
      [{ t: 'かならず1か所' }, { t: '1か所もない' }, { t: 'いくらでもできる' }, { t: '2か所できる', ok: true }],
      { 0: [B('角が1つ、わかれば、A は1か所に、決まるでしょ？', { say: '角が1つ、わかれば、エー は1か所に、決まるでしょ？', fb: 'happy', up: true }),
            T('決まるとは、かぎりません。このあと、図で確かめましょう。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        1: [T('A が、1か所もないことは、ありません。このあと、図で確かめましょう。', { say: 'エー が、1か所もないことは、ありません。このあと、図で確かめましょう。', ft: 'normal' })],
        ok: [T('正解！ 2か所できます。図で、確かめましょう。', { ft: 'happy' }), B('同じ条件で、2つもできるの？', { fb: 'surprised', up: true })],
        wrong: [T('いくらでも、ではありません。このあと、図で確かめましょう。', { ft: 'normal' })] }),

    T('C を中心に、半径4cm の円をかくと、半直線と、2か所で交わります。A は、2つ決まります。', { ft: 'normal', point: false,
      say: 'シー を中心に、半径4センチの円をかくと、半直線と、2か所で交わります。エー は、2つ決まります。',
      draw: [M(two4)] }),
    T('形のちがう三角形が、2つできました。2辺と、その間ではない角では、1つに決まりません。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'box', color: 'p', size: 'xs', label: '注意', text: '間の角でないと\n1つに決まらない', t: 4.5 }] }),

    T('最後に、3つの角だけを、伝えてみます。50°、60°、70°です。', { clear: true, cols: [0.34, 0.66], part: '3つの角だけ', ft: 'normal',
      say: '最後に、3つの角だけを、伝えてみます。50度、60度、70度です。',
      add: [Object.assign(f5, { prims: [] })], draw: [N(fig5)] }),

    /* ---------- 問4 ---------- */
    Q('q4', T('問題です。3つの角が、50°、60°、70°の三角形は、1つに決まるでしょうか。', { ft: 'normal',
      say: '問題です。3つの角が、50度、60度、70度の三角形は、1つに決まるでしょうか。' }),
      [{ t: '1つに決まる' }, { t: '大きさのちがう形が、作れる', ok: true }, { t: '作れない' }, { t: 'かならず直角三角形になる' }],
      { 0: [B('角が3つも、決まっているよ！ これだけ、わかれば、決まるでしょ？', { fb: 'happy', up: true }),
            T('図のように、形は同じで、大きさがちがう三角形が、できます。ぴったり重なりません。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        2: [T('作れます。50°＋60°＋70°＝180°で、三角形の内角の和と、合っています。', { ft: 'normal',
              say: '作れます。50度、たす、60度、たす、70度、イコール、180度で、三角形の内角の和と、合っています。' })],
        ok: [T('正解！ 角だけでは、大きさが決まりません。辺の長さが、1本は必要です。', { ft: 'happy' }), B('大きいのも、小さいのも、できるんだね！', { fb: 'star', up: true })],
        wrong: [T('3つの角が同じでも、大きさがちがう三角形が、できます。直角は、ありません。', { ft: 'normal' })] }),

    T('まとめです。三角形が1つに決まる条件は、この3つです。これを、三角形の合同条件といいます。', { clear: true, cols: [0.34, 0.66], part: '三角形の合同条件', ft: 'normal',
      say: 'まとめです。三角形が1つに決まる条件は、この3つです。これを、三角形の、合同条件といいます。',
      add: [{ col: 1, type: 'box', color: 'y', size: 'sm', label: '三角形の合同条件', text: '①　3組の辺が、それぞれ等しい\n②　2組の辺と、その間の角が、\n　　それぞれ等しい\n③　1組の辺と、その両端の角が、\n　　それぞれ等しい', t: 7.0 }] }),
    B('ストローが3本なら、動かないけど、角度が3つだと、ぐにゃぐにゃだ！', { fb: 'star', up: true, fx: { b: 'e' } }),
    T('お疲れさまでした。成績は、こちらです。', { ft: 'happy', point: false, result: true })
  ] });
})();
