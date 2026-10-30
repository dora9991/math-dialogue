/* 空間図形（新しい形） 第3時：空間にある2つの直線は、どんな位置関係になるだろう。 kukan-03 と同じ内容の授業を、新しい形に組みかえた（見本 lesson_kukan_new_01.js）。
   ・ワークシートは A4 1枚（約12分）：問いは1つ（辺 AB と、ほかの 11本の辺の仲間分け）。個人3分 → ペア3分 → ことば → 例題（辺 BC）。
   ・演習プリントは表裏：表＝確かめる 2問・使ってみる 4問（図1〜図3を、表のはじめに並べて印刷）／裏＝ひろげる 1問（考えよう：教室の中のねじれの位置。答えは載せない）・チャレンジ★★ 1問（ヒントカードつき）。 2:4:1:1 の8問。
   ・直方体の頂点は、A(0,0,0) B(w,0,0) C(w,d,0) D(0,d,0)、E〜H はその真上（底面 ABCD、手前の面 ABFE）。
   ・小テストは kukan-03 と同じ。
   ・検算：辺の位置関係の答えは、座標から計算して確かめている（checks の mk）。　node tools/verify.cjs kukan_new-03　／　見た目：node tools/check.cjs <出力先> kukan_new-03 */
(function () {
  const { M, K, B, G, F, C2, T, HD, BR, WD, MA, TB, POLY } = IK.b;

  const CUB = o => POLY(Object.assign({ solid: 'cuboid', w: 4, d: 2.4, h: 2.6, labels: 'ABCDEFGH' }, o));   // 直方体の見取図
  const PRISM3 = o => POLY(Object.assign({ solid: 'prism', n: 3, a: 2.6, h: 3.2, labels: 'ABCDEF', proj: 'ortho', az: 45, el: 20 }, o));  // 三角柱 ABC−DEF
  const PYR4 = o => POLY(Object.assign({ solid: 'pyramid', n: 4, a: 2.6, h: 3, labels: 'ABCDO' }, o));      // 四角錐 O−ABCD

  /* ---- 検算の道具（座標から、辺の位置関係を計算する）。checks の文字列に、そのまま入れる ---- */
  const mk = (P, E) => {
    const sub = (p, q) => [p[0] - q[0], p[1] - q[1], p[2] - q[2]];
    const cr = (p, q) => [p[1] * q[2] - p[2] * q[1], p[2] * q[0] - p[0] * q[2], p[0] * q[1] - p[1] * q[0]];
    const dt = (p, q) => p[0] * q[0] + p[1] * q[1] + p[2] * q[2];
    const nm = s => s.split('').sort().join('');
    const dir = e => sub(P[e[1]], P[e[0]]);
    const rel = (a, b) => { const n = cr(dir(a), dir(b)); if (Math.hypot(n[0], n[1], n[2]) < 1e-9) return 'par'; return Math.abs(dt(sub(P[b[0]], P[a[0]]), n)) < 1e-9 ? 'cross' : 'skew'; };
    const same = (list, str) => list.map(nm).sort().join(',') === str.split(',').map(nm).sort().join(',');
    return {
      rel, same,
      of: (a, r) => E.filter(e => nm(e) !== nm(a) && rel(a, e) === r),                                                           // 辺 a と、交わる(cross)・平行(par)・ねじれ(skew) の辺
      perp: a => E.filter(e => nm(e) !== nm(a) && rel(a, e) === 'cross' && Math.abs(dt(dir(a), dir(e))) < 1e-9)                    // 辺 a と、垂直に交わる辺
    };
  };
  const cuboidP = (w, d, h) => `{ A: [0, 0, 0], B: [${w}, 0, 0], C: [${w}, ${d}, 0], D: [0, ${d}, 0], E: [0, 0, ${h}], F: [${w}, 0, ${h}], G: [${w}, ${d}, ${h}], H: [0, ${d}, ${h}] }`;
  const CE = "['AB', 'BC', 'CD', 'DA', 'EF', 'FG', 'GH', 'HE', 'AE', 'BF', 'CG', 'DH']";
  const geo = (P, E, body) => `(() => { const mk = ${mk}; const g = mk(${P}, ${E}); return ${body}; })()`;

  IK.lesson('kukan_new-03', {
    unit: 'kukan_new', unitName: '空間図形（新しい形）', form: 'new', no: '第3時', title: '空間にある2つの直線は、どんな位置関係になるだろう',
    summary: '直方体の辺を仲間分けして、空間の2直線の位置関係（交わる・平行・ねじれの位置）をとらえる。教室の中から、ねじれの位置の例を探して、同じ平面上にない理由を考える。',
    head: '空間図形　第3時',
    pitch: 8, dots: true,
    checks: [
      // ワークシート：今日の問い（辺 AB）と例題（辺 BC）。直方体 AB＝4・AD＝3・AE＝2 で、座標から計算
      geo(cuboidP(4, 3, 2), CE, "g.same(g.of('AB', 'cross'), 'AD,AE,BC,BF') && g.same(g.of('AB', 'par'), 'DC,EF,HG') && g.same(g.of('AB', 'skew'), 'DH,CG,EH,FG') && g.same(g.of('BC', 'par'), 'AD,EH,FG') && g.same(g.perp('BC'), 'AB,DC,BF,CG') && g.same(g.of('BC', 'skew'), 'AE,DH,EF,HG')"),
      // 演習プリント（1）〜（3）立方体（図1）で、辺 AD
      geo(cuboidP(3, 3, 3), CE, "g.same(g.of('AD', 'par'), 'BC,EH,FG') && g.same(g.perp('AD'), 'AB,DC,AE,DH') && g.same(g.of('AD', 'skew'), 'BF,CG,EF,HG')"),
      // （4）三角柱 ABC−DEF（正三角形の底面）で、辺 BE とねじれの位置の辺　（5）四角錐 O−ABCD で、辺 OA とねじれの位置の辺
      "(() => { const mk = " + mk + "; const t = [0, 1, 2].map(k => { const a = (-150 + 120 * k) * Math.PI / 180; return [Math.cos(a), Math.sin(a)]; }), P = {}; 'ABC'.split('').forEach((c, i) => { P[c] = [t[i][0], t[i][1], 0]; P['DEF'[i]] = [t[i][0], t[i][1], 2]; }); const g = mk(P, ['AB', 'BC', 'CA', 'DE', 'EF', 'FD', 'AD', 'BE', 'CF']); return g.same(g.of('BE', 'skew'), 'AC,DF') && g.same(g.of('BE', 'par'), 'AD,CF'); })()",
      "(() => { const mk = " + mk + "; const q = [0, 1, 2, 3].map(k => { const a = (-135 + 90 * k) * Math.PI / 180; return [Math.cos(a), Math.sin(a)]; }), P = { O: [0, 0, 2] }; 'ABCD'.split('').forEach((c, i) => { P[c] = [q[i][0], q[i][1], 0]; }); const g = mk(P, ['AB', 'BC', 'CD', 'DA', 'OA', 'OB', 'OC', 'OD']); return g.same(g.of('OA', 'skew'), 'BC,CD') && g.same(g.of('OA', 'cross'), 'AB,AD,OB,OC,OD'); })()",
      // （6）ねじれの位置になる組：AB と EH、AE と BC。平行：AB と DC、AD と FG、BF と CG
      geo(cuboidP(3, 3, 3), CE, "g.rel('AB', 'EH') === 'skew' && g.rel('AB', 'DC') === 'par' && g.rel('AE', 'BC') === 'skew' && g.rel('AD', 'FG') === 'par' && g.rel('BF', 'CG') === 'par'"),
      // （8）立方体の辺 12本から 2本：ねじれの位置は 12×4÷2＝24組（交わる 24・平行 18・ねじれ 24 で、合計 66＝12×11÷2）
      geo(cuboidP(3, 3, 3), CE, "(() => { const E = " + CE + "; const c = { cross: 0, par: 0, skew: 0 }; for (let i = 0; i < 12; i++) for (let j = i + 1; j < 12; j++) c[g.rel(E[i], E[j])]++; return c.skew === 24 && c.skew === 12 * 4 / 2 && c.cross === 24 && c.par === 18 && c.cross + c.par + c.skew === 12 * 11 / 2 && E.every(e => g.of(e, 'skew').length === 4); })()"),
      // 小テスト：辺 EH と平行・垂直に交わる・ねじれの位置　／　チャレンジ：AB ともねじれ、EH ともねじれの位置にある辺は CG だけ
      geo(cuboidP(4, 3, 2), CE, "g.same(g.of('EH', 'par'), 'AD,BC,FG') && g.same(g.perp('EH'), 'AE,EF,DH,GH') && g.same(g.of('EH', 'skew'), 'AB,DC,BF,CG') && g.same(g.of('AB', 'skew').filter(e => g.of('EH', 'skew').map(x => x.split('').sort().join('')).includes(e.split('').sort().join(''))), 'CG')")
    ],

    /* ================= ワークシート（A4 1枚・約12分） ================= */
    ws: [
      M('空間にある2つの直線は、どんな位置関係になるだろう'),
      K('今日の問い', '直方体で、辺 AB と、ほかの 11本の辺との関係を調べて、仲間分けしよう。', 2),
      F(7, CUB({ edges: [{ e: 'AB' }], ansEdges: [{ e: 'DH' }, { e: 'CG' }, { e: 'EH' }, { e: 'FG' }] })),
      T('①', '自分の考え（3分）　どこに目をつけたかも書こう。', 1),
      B(4, '（例）交わる … AD、AE、BC、BF\n平行 … DC、EF、HG\n交わらず、平行でもない … DH、CG、EH、FG'),
      T('②', 'ペアの考え（3分）　自分とちがう分け方を書こう。', 1),
      B(3, ''),
      G(1),
      WD('空間にある 2直線の位置関係は、\n{{交わる}}・{{平行}}・{{ねじれの位置}}の 3つ。\n平行でなく、交わらない 2直線は、{{ねじれの位置}}にある。\nねじれの位置にある 2直線は、同じ{{平面}}上に{{ない}}。', 4, { label: 'ことば（教科書で調べよう）' }),
      G(1),
      K('例題', '上の直方体で、辺 {{BC}} について、次の辺をすべて答えよう。', 1),
      TB('辺 BC と', ['平行な辺', '垂直に交わる辺', 'ねじれの位置の辺'], [
        ['答え', ['{{AD、EH、FG}}', '{{AB、DC、BF、CG}}', '{{AE、DH、EF、HG}}']]
      ], { hw: 28 }),
      T('', '【見つけ方のくふう】ねじれの位置の辺を、もれなく見つける方法を書こう。', 1),
      B(3, '12本から、「交わる」「平行」の辺を消して、のこりを見つける。\n見取図の上で交わって見えても、空間では交わらないことがある。')
    ],

    /* ================= 演習プリント（A4 表裏） ================= */
    dr: [
      HD('確かめる', 'ことばと、基本をたしかめよう。'),
      WD('① 空間にある 2直線の位置関係は、{{交わる}}・{{平行}}・{{ねじれの位置}}の 3つ。\n② 平行でなく、交わらない 2直線を、{{ねじれの位置}}にあるという。\n③ ねじれの位置にある 2直線は、同じ{{平面}}上に{{ない}}。\n④ 2直線が交わって、直角になるとき、{{垂直}}に交わるという。', 4, { label: 'ことば' }),
      F(5,
        CUB({ w: 3, d: 3, h: 3, edges: [{ e: 'AD' }], caption: '図1' }),
        PRISM3({ edges: [{ e: 'BE' }], caption: '図2' }),
        PYR4({ edges: [{ e: 'OA' }], caption: '図3' })),
      C2([
        T('（1）', '図1の立方体で、辺 AD と平行な辺を、すべて答えよう。', 3),
        B(1, 'BC、EH、FG')
      ], [
        T('（2）', '図1で、辺 AD と垂直に交わる辺を、すべて答えよう。', 3),
        B(1, 'AB、DC、AE、DH')
      ], '1:1'),
      MA('【説明】ねじれの位置を、「交わらない」を使って、隣の人に説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      G(1),
      HD('使ってみる', '図を見て、ねじれの位置にある辺を見つけよう。'),
      C2([
        T('（3）', '図1で、辺 AD とねじれの位置にある辺を、すべて答えよう。', 3),
        B(1, 'BF、CG、EF、HG')
      ], [
        T('（4）', '図2の三角柱で、辺 BE とねじれの位置にある辺を、すべて答えよう。', 3),
        B(1, 'AC、DF')
      ], '1:1'),
      C2([
        T('（5）', '図3の四角錐で、辺 OA とねじれの位置にある辺を、すべて答えよう。', 3),
        B(1, 'BC、CD')
      ], [
        T('（6）', '図1で、次のうち、ねじれの位置にある組を、すべて選ぼう。\nア AB と EH　イ AB と DC\nウ AE と BC　エ AD と FG\nオ BF と CG', 5),
        B(1, 'ア、ウ')
      ], '1:1'),
      G(1),
      T('', '★ ここまでできたら、今日の合格！　　合格 ☐', 1),
      BR(),

      HD('ひろげる', '考えよう：教室の中から、ねじれの位置を見つけよう。'),
      T('（7）', '教室の中から、「ねじれの位置にある2直線」の例を見つけよう。また、ねじれの位置にある2直線が、同じ平面上にないといえるのは、なぜだろう。', 3),
      C2([
        T('', '見つけた例（できるだけ多く）', 1),
        B(10, '')
      ], [
        T('', '同じ平面上にないといえるわけ', 1),
        B(10, '')
      ], '1:1'),
      G(1),
      HD('チャレンジ★★', '入試にも出る問題。ヒントカードを見てもOK。'),
      C2([
        T('（8）', '立方体の 12本の辺から 2本を選ぶとき、ねじれの位置にある 2本の選び方は、何通りあるか。', 4),
        B(6, '1本の辺と、ねじれの位置\nにある辺は 4本。\n12×4＝48 は、同じ組を\n2回ずつ数えている。\n48÷2＝24（通り）')
      ], [
        MA('① 1本の辺とねじれの位置にある辺は、何本あるだろう。\n② 12本の辺それぞれで同じように数えると、同じ組を何回ずつ数えているだろう。', 6, { label: 'ヒントカード' })
      ], '1:1')
    ],

    /* ================= 小テスト（kukan-03 と同じ） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      T('（1）', '空間にある 2つの直線の位置関係を、3つ答えよう。（3点）', 1),
      B(2, '交わる、平行、ねじれの位置'),
      C2([
        T('（2）', '辺 EH と平行な辺を、すべて答えよう。\n（2点）', 2),
        B(1, 'AD、BC、FG'),
        T('（3）', '辺 EH と垂直に交わる辺を、すべて答えよう。（2点）', 2),
        B(1, 'AE、EF、DH、GH'),
        T('（4）', '辺 EH とねじれの位置にある辺を、すべて答えよう。\n（3点）', 3),
        B(2, 'AB、DC、BF、CG')
      ], [F(9, CUB({ edges: [{ e: 'EH' }] }))], '2:1'),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      T('（5）', '上の直方体で、辺 AB ともねじれの位置にあり、辺 EH ともねじれの位置にある辺を、すべて答えよう。', 2),
      B(6, '辺 AB とねじれの位置 … CG、DH、FG、EH\n辺 EH とねじれの位置 … AB、DC、BF、CG\nどちらにもあてはまる辺 … CG')
    ]
  });
})();
