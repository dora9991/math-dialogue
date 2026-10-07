/* 中2 4章 平行と合同　応用10「合同条件の判断」。自作問題。
   図1：3組の辺（印1・2・3）。図2：2組の辺（印1・2）とその間の角B・E。図3：1組の辺BC・EFとその両端の角（B・E に1本、C・F に2本）。
   図4：AB＝DE＝7cm、AC＝DF＝5cm、∠B＝∠E＝40° だが、合同でない2つ（∠C＝64.1°と∠F＝115.9°、BC≠EF）。図5：3組の角が等しいが大きさのちがう2つ（合同条件でない）。
   誤答：2組の辺と1組の角（間でない角）／3組の角／印の数の数えちがい。ポンタは「3つ等しければ何でも合同」と思う。 */
(function () {
  const { T, B, Q, FIG } = KL;
  // ---- 図の小さな部品（この台本の中で定義。座標は数学の座標で、y が上） ----
  const R2D = 180 / Math.PI, D2R = Math.PI / 180;
  const dirOf = (V, P) => Math.atan2(P[1] - V[1], P[0] - V[0]) * R2D;
  const sweep = (V, P, Q) => { let a1 = dirOf(V, P), a2 = dirOf(V, Q); let d = ((a2 - a1) % 360 + 360) % 360; if (d > 180) { const t = a1; a1 = a2; a2 = t; d = 360 - d; } return [a1, a1 + d]; };
  const mark = (V, P, Q, r, c, o) => { const s = sweep(V, P, Q); return Object.assign({ k: 'ell', o: V, rx: r, ry: r, a1: s[0], a2: s[1], c, wd: 3.4, d: 0.3 }, o || {}); };
  const num = (V, P, Q, r, text, c, o) => { const s = sweep(V, P, Q), m = (s[0] + s[1]) / 2 * D2R; return Object.assign({ k: 'label', at: [V[0] + r * Math.cos(m), V[1] + r * Math.sin(m)], text, c, size: 27, d: 0.2 }, o || {}); };
  const lab = (x, y, text, c, o) => Object.assign({ k: 'label', at: [x, y], text, c, size: 28, d: 0.2 }, o || {});
  const ln = (a, b, c, o) => Object.assign({ k: 'seg', a, b, c, wd: 3.6, d: 0.6 }, o || {});
  const dot = (at, name, dir, c, o) => Object.assign({ k: 'pt', at, name, dir, off: 26, c, r: 6, d: 0.15 }, o || {});
  const tri = (A, B, C, c, o) => Object.assign({ k: 'poly', pts: [A, B, C], close: true, c, wd: 3.6, d: 0.8 }, o || {});
  const tick = (a, b, n, c) => { const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, l = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / l, uy = (b[1] - a[1]) / l, h = 0.17, g = 0.13, out = []; for (let i = 0; i < n; i++) { const o = (i - (n - 1) / 2) * g, cx = mx + ux * o, cy = my + uy * o; out.push({ k: 'seg', a: [cx - uy * h, cy + ux * h], b: [cx + uy * h, cy - ux * h], c, wd: 3, d: 0.1 }); } return out; };
  const chev = (a, b, s, n, c) => { const l = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / l, uy = (b[1] - a[1]) / l, h = 0.2, w = 0.15, out = []; for (let i = 0; i < n; i++) { const px = a[0] + (b[0] - a[0]) * s + ux * i * 0.22, py = a[1] + (b[1] - a[1]) * s + uy * i * 0.22; out.push({ k: 'poly', pts: [[px - ux * h - uy * w, py - uy * h + ux * w], [px, py], [px - ux * h + uy * w, py - uy * h - ux * w]], c, wd: 3, d: 0.1 }); } return out; };
  const view = [0, 0, 11.8, 6.0];
  const f1 = FIG('f1', view, 1180, 600, [], { col: 1 });
  const f2 = FIG('f2', view, 1180, 600, [], { col: 1 });
  const f3 = FIG('f3', view, 1180, 600, [], { col: 1 });
  const f4 = FIG('f4', view, 1180, 600, [], { col: 1 });
  const f5 = FIG('f5', view, 1180, 600, [], { col: 1 });
  const G = (id) => (...i) => ({ fig: id, items: i.flat(3) });
  const G1 = G('f1'), G2 = G('f2'), G3 = G('f3'), G4 = G('f4'), G5 = G('f5');
  /* 合同な2つ（python で計算）：△ABC は ∠A＝70°、∠B＝50°、∠C＝60°、BC＝3.6。△DEF は右へ5.8 ずらした同じ形 */
  const A = [3.233, 4.042], Bp = [1.1, 1.5], C = [4.7, 1.5], D = [9.033, 4.042], E = [6.9, 1.5], F = [10.5, 1.5];
  /* 図4：AB＝DE＝7cm（3.9）、AC＝DF＝5cm（2.786）、∠B＝∠E＝40°。C は鋭角、F は鈍角の2通り */
  const A4 = [3.988, 3.707], B4 = [1, 1.2], C4 = [5.203, 1.2], D4 = [9.588, 3.707], E4 = [6.6, 1.2], F4 = [8.372, 1.2];
  /* 図5：同じ角の小さい三角形と大きい三角形（∠A＝70°、∠B＝50°、∠C＝60°） */
  const A5 = [2.659, 3.177], B5 = [1, 1.2], C5 = [3.8, 1.2], D5 = [8.525, 4.448], E5 = [5.8, 1.2], F5 = [10.4, 1.2];
  const cenOf = (a, b, c) => [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3];
  const away = (p, c) => { const d = [p[0] - c[0], p[1] - c[1]], l = Math.hypot(d[0], d[1]); return [d[0] / l, d[1] / l]; };
  const names3 = (a, b, c, n) => [a, b, c].map((p, i) => dot(p, n[i], away(p, cenOf(a, b, c)), 'y'));
  const pair = (a, b, c, d, e, f) => [tri(a, b, c, 'w'), tri(d, e, f, 'w'), names3(a, b, c, 'ABC'), names3(d, e, f, 'DEF')];
  const arcN = (V, P, Q2, n, c) => Array.from({ length: n }, (_, i) => mark(V, P, Q2, 0.5 + 0.15 * i, c));
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const sideLab = (a, b, text, c, cen) => { const m = mid(a, b), d = away(m, cen); return lab(m[0] + d[0] * 0.6, m[1] + d[1] * 0.6, text, c, { size: 26 }); };
  const fig1 = [pair(A, Bp, C, D, E, F), tick(A, Bp, 1, 'y'), tick(Bp, C, 2, 'p'), tick(C, A, 3, 'b'), tick(D, E, 1, 'y'), tick(E, F, 2, 'p'), tick(F, D, 3, 'b')];
  const fig2 = [pair(A, Bp, C, D, E, F), tick(A, Bp, 1, 'y'), tick(Bp, C, 2, 'p'), tick(D, E, 1, 'y'), tick(E, F, 2, 'p'), arcN(Bp, A, C, 1, 'g'), arcN(E, D, F, 1, 'g')];
  const fig3 = [pair(A, Bp, C, D, E, F), tick(Bp, C, 1, 'y'), tick(E, F, 1, 'y'), arcN(Bp, A, C, 1, 'g'), arcN(E, D, F, 1, 'g'), arcN(C, A, Bp, 2, 'p'), arcN(F, D, E, 2, 'p')];
  const fig4 = [pair(A4, B4, C4, D4, E4, F4), tick(A4, B4, 1, 'y'), tick(A4, C4, 2, 'p'), tick(D4, E4, 1, 'y'), tick(D4, F4, 2, 'p'),
    arcN(B4, A4, C4, 1, 'g'), arcN(E4, D4, F4, 1, 'g'), num(B4, A4, C4, 1.15, '40°', 'g', { size: 26 }), num(E4, D4, F4, 1.15, '40°', 'g', { size: 26 }),
    sideLab(A4, B4, '7cm', 'y', cenOf(A4, B4, C4)), sideLab(A4, C4, '5cm', 'p', cenOf(A4, B4, C4)), sideLab(D4, E4, '7cm', 'y', cenOf(D4, E4, F4)), sideLab(D4, F4, '5cm', 'p', cenOf(D4, E4, F4))];
  const fig5 = [pair(A5, B5, C5, D5, E5, F5), arcN(A5, B5, C5, 1, 'y'), arcN(D5, E5, F5, 1, 'y'), arcN(B5, A5, C5, 2, 'p'), arcN(E5, D5, F5, 2, 'p'), arcN(C5, A5, B5, 3, 'b'), arcN(F5, D5, E5, 3, 'b')];
  const hiAngC = (o) => [mark(C4, A4, B4, 0.45, 'p', o), lab(C4[0] + 0.1, 0.5, '∠C＝64°', 'p', Object.assign({ size: 26 }, o))];
  const hiAngF = (o) => [mark(F4, D4, E4, 0.45, 'p', o), lab(F4[0] + 0.1, 0.5, '∠F＝116°', 'p', Object.assign({ size: 26 }, o))];

  KL.lesson({ id: 'g2ch4-o10', unit: '中2　平行と合同', kick: '2年4章　応用10', title: '合同条件の判断', card: '合同条件の判断', sub: 'ホー先生とポンタと いっしょに ゆっくり解説', cols: [0.34, 0.66], steps: [
    T('みなさん、こんにちは。今日は、2つの三角形が、合同といえる条件を、確かめます。合同条件は、3つあります。', { title: true, point: false, ft: 'happy' }),
    B('3つ等しければ、何でも、合同でしょ？ 角でも、辺でも、いいよね！ 簡単だよ！', { title: true, fb: 'proud', up: true }),
    T('それは、あとで、確かめましょう。実は、3つ等しくても、合同といえない場合も、あります。', { title: true, point: false, ft: 'sigh', fx: { t: 'sweat' } }),

    T('まず、図1です。2つの三角形で、同じ印の辺は、等しい長さです。どの合同条件が、使えるでしょう。', { part: '図1', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'めあて', text: '合同条件を\n見分けよう', t: 4.0 }, Object.assign(f1, { prims: [] })],
      draw: [G1(fig1)] }),

    /* ---------- 問1：3組の辺 ---------- */
    Q('q1', T('問題です。図1の2つの三角形が、合同だといえる、合同条件は、どれでしょう。', { ft: 'normal' }),
      [{ t: '2組の辺とその間の角がそれぞれ等しい' }, { t: '3組の角がそれぞれ等しい' }, { t: '1組の辺とその両端の角がそれぞれ等しい' }, { t: '3組の辺がそれぞれ等しい', ok: true }],
      { 0: [T('図1には、角の印が、ありません。辺の印だけが、3組あります。', { ft: 'normal' })],
        1: [B('三角形には、角が3つあるから、角が3組、等しければ、いいでしょ？', { fb: 'happy', up: true }), T('3組の角が、等しいだけでは、合同条件では、ありません。大きさが、ちがうことが、あるからです。図1には、角の印も、ありません。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        2: [T('図1には、角の印が、ありません。辺の印が、3組あるので、3組の辺が、それぞれ等しい、です。', { ft: 'normal' })],
        ok: [T('正解！ 3組の辺が、それぞれ等しいので、△ABC≡△DEF です。', { say: '正解！3組の辺が、それぞれ等しいので、さんかく エービーシー ごうどう さんかく ディーイーエフ です。', ft: 'happy' }), B('辺が3組そろえば、合同なんだね！', { fb: 'star', up: true })],
        wrong: [T('図1は、辺の印が3組です。3組の辺が、それぞれ等しい、が合同条件です。', { ft: 'normal' })] }),

    /* ---------- 図2：2組の辺とその間の角 ---------- */
    T('次は、図2です。辺の印が2組と、角の印が1組あります。角は、2つの辺の、間にあります。', { clear: true, cols: [0.34, 0.66], part: '図2', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '図2', text: '辺の印2組\n角の印1組', t: 3.5 }, Object.assign(f2, { prims: [] })],
      draw: [G2(fig2)] }),
    Q('q2', T('問題です。図2の2つの三角形が、合同だといえる、合同条件は、どれでしょう。', { ft: 'normal' }),
      [{ t: '3組の辺がそれぞれ等しい' }, { t: '3組の角がそれぞれ等しい' }, { t: '2組の辺とその間の角がそれぞれ等しい', ok: true }, { t: '1組の辺とその両端の角がそれぞれ等しい' }],
      { 0: [T('辺の印は、2組だけです。3組目の辺には、印が、ありません。', { ft: 'normal' })],
        1: [T('角の印は、1組だけです。3組の角が、等しいとは、わかっていません。', { ft: 'normal' })],
        3: [T('1組の辺と、その両端の角、では、ありません。図2は、辺の印が2組で、角は、2つの辺の間にあります。', { ft: 'normal' })],
        ok: [T('正解！ AB＝DE、BC＝EF、∠B＝∠E。角は、2つの辺の、間にあります。2組の辺とその間の角が、それぞれ等しい、です。', { say: '正解！エービー イコール ディーイー、ビーシー イコール イーエフ、かく ビー イコール かく イー。角は、2つの辺の、間にあります。2組の辺とその間の角が、それぞれ等しい、です。', ft: 'happy' }), B('間の角、というのが、大事なんだね！', { fb: 'star', up: true })],
        wrong: [T('2組の辺と、その間の角が、それぞれ等しいので、合同です。', { ft: 'normal' })] }),

    /* ---------- 図3：1組の辺とその両端の角 ---------- */
    T('次は、図3です。辺の印が1組と、角の印が2組あります。角は、その辺の、両はしにあります。', { clear: true, cols: [0.34, 0.66], part: '図3', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '図3', text: '辺の印1組\n角の印2組', t: 3.5 }, Object.assign(f3, { prims: [] })],
      draw: [G3(fig3)] }),
    Q('q3', T('問題です。図3の2つの三角形が、合同だといえる、合同条件は、どれでしょう。', { ft: 'normal' }),
      [{ t: '1組の辺とその両端の角がそれぞれ等しい', ok: true }, { t: '3組の辺がそれぞれ等しい' }, { t: '2組の辺とその間の角がそれぞれ等しい' }, { t: '3組の角がそれぞれ等しい' }],
      { 1: [T('辺の印は、1組だけです。3組では、ありません。', { ft: 'normal' })],
        2: [T('辺の印は、1組だけです。2組の辺では、ありません。', { ft: 'normal' })],
        3: [B('角の印が2つあれば、3つ目の角も、等しくなるでしょ？ 3組だよ！', { fb: 'happy', up: true }), T('3つ目の角も、等しくなりますが、それは、合同条件では、ありません。1組の辺と、その両端の角が、等しいことが、条件です。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        ok: [T('正解！ BC＝EF、∠B＝∠E、∠C＝∠F。角は、辺 BC の、両はしにあります。1組の辺とその両端の角が、それぞれ等しい、です。', { say: '正解！ビーシー イコール イーエフ、かく ビー イコール かく イー、かく シー イコール かく エフ。角は、辺 ビーシー の、両はしにあります。1組の辺とその両端の角が、それぞれ等しい、です。', ft: 'happy' }), B('辺の、両はしの角、なんだね！', { fb: 'star', up: true })],
        wrong: [T('1組の辺と、その両端の角が、それぞれ等しいので、合同です。', { ft: 'normal' })] }),

    /* ---------- 図4：2組の辺と間でない角 ---------- */
    T('図4です。AB＝DE、AC＝DF、∠B＝∠E です。2組の辺と、1組の角が、それぞれ等しい、2つの三角形です。', { say: '図4です。エービー イコール ディーイー、エーシー イコール ディーエフ、かく ビー イコール かく イー です。2組の辺と、1組の角が、それぞれ等しい、2つの三角形です。', clear: true, cols: [0.34, 0.66], part: '図4', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '図4', text: 'AB＝DE　AC＝DF\n∠B＝∠E', t: 4.0 }, Object.assign(f4, { prims: [] })],
      draw: [G4(fig4)] }),
    B('2組の辺と、1組の角が、等しいんだから、合同でしょ？ 条件、3つそろってるよ！', { fb: 'happy', up: true }),
    T('そう思いますよね。でも、図を、よく見てください。2つの三角形は、形が、ちがいます。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' }, point: false, draw: [G4(hiAngC({}), hiAngF({}))] }),

    /* ---------- 問4：間でない角 ---------- */
    Q('q4', T('問題です。2組の辺と、1組の角が、等しいのに、合同といえません。それは、なぜでしょう。', { ft: 'normal' }),
      [{ t: '等しい角が、2辺の間に、ないから', ok: true }, { t: '辺が、短すぎるから' }, { t: '角が、大きすぎるから' }, { t: '三角形が、2つあるから' }],
      { 1: [T('辺の長さは、どちらも、等しいと、わかっています。問題は、角の位置です。', { ft: 'normal' })],
        2: [T('角の大きさも、どちらも、等しいと、わかっています。問題は、角の位置です。', { ft: 'normal' })],
        3: [B('2つあるから、ちがう三角形に、なっちゃうんでしょ？', { fb: 'happy', up: true }), T('合同な図形は、2つあるのが、ふつうです。問題は、等しい角が、2辺の間に、ないことです。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        ok: [T('正解！ ∠B は、辺 AB と AC の、間の角では、ありません。間の角でないと、形が、決まりません。', { say: '正解！かく ビー は、辺 エービー と エーシー の、間の角では、ありません。間の角でないと、形が、決まりません。', ft: 'happy' }), B('「その間の」が、とても、大切なんだね！', { fb: 'star', up: true })],
        wrong: [T('等しい角が、等しい2辺の、間にないと、形が決まりません。だから、合同条件では、ありません。', { ft: 'normal' })] }),

    /* ---------- 図5：3組の角 ---------- */
    T('最後に、図5です。2つの三角形は、3組の角が、それぞれ等しいです。でも、大きさは、ちがいます。', { clear: true, cols: [0.34, 0.66], part: '図5', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '図5', text: '角の印3組\n辺の印なし', t: 3.5 }, Object.assign(f5, { prims: [] })],
      draw: [G5(fig5)] }),

    /* ---------- 問5：合同条件でないもの ---------- */
    Q('q5', T('最後の問題です。次の中で、三角形の合同条件では、ないものは、どれでしょう。', { ft: 'happy' }),
      [{ t: '3組の辺がそれぞれ等しい' }, { t: '2組の辺とその間の角がそれぞれ等しい' }, { t: '1組の辺とその両端の角がそれぞれ等しい' }, { t: '3組の角がそれぞれ等しい', ok: true }],
      { 0: [T('それは、合同条件です。図1のように、辺が3組、等しければ、合同です。', { ft: 'normal' })],
        1: [T('それは、合同条件です。図2のように、2辺と、その間の角が、等しければ、合同です。', { ft: 'normal' })],
        2: [B('辺の両はしの角、なんて、ややこしいよ！ 条件じゃ、ないでしょ？', { fb: 'happy', up: true }), T('それも、合同条件です。図3のように、1組の辺と、その両端の角が、等しければ、合同です。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        ok: [T('正解！ 3組の角が、等しいだけでは、大きさが、ちがうことが、あります。合同条件では、ありません。', { ft: 'happy' }), B('3つ等しければ、何でもいい、わけじゃなかったんだね！', { fb: 'star', up: true })],
        wrong: [T('3組の角が、それぞれ等しいだけでは、合同条件では、ありません。', { ft: 'normal' })] }),

    T('合同条件は、3つです。どれも、辺の長さが、関係しています。3組の角だけでは、合同条件に、なりません。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'ポイント', text: '合同条件は3つだけ\n角だけ3組はだめ\n間でない角もだめ', t: 6.0 }] }),
    B('3つ等しければ、何でも合同、じゃなくて、等しい3つの、選び方が、大事なんだね！', { fb: 'happy', up: true, fx: { b: 'e' } }),
    T('お疲れさまでした。成績は、こちらです。', { ft: 'happy', point: false, result: true })
  ] });
})();
