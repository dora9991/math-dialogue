/* 空間図形（新しい形） 第4時：直線と平面、平面と平面の位置関係を調べよう。 kukan-04 と同じ内容の授業を、新しい形に組みかえた（見本 lesson_kukan_new_01.js）。
   ・ワークシートは A4 1枚（約12分）：問いは1つ（面 ABCD と、12本の辺の仲間分け）。個人3分 → ペア3分 → ことば → 例題（面 ABFE）。
   ・演習プリントは表裏：表＝確かめる 2問・使ってみる 4問（図1・図2を、表のはじめに並べて印刷）／裏＝ひろげる 1問（考えよう：垂直を確かめるのに、何本の直線を調べるか。答えは載せない）・チャレンジ★★ 1問（ヒントカードつき）。 2:4:1:1 の8問。
   ・直方体の頂点は、A(0,0,0) B(w,0,0) C(w,d,0) D(0,d,0)、E〜H はその真上（底面 ABCD、手前の面 ABFE、右の面 BCGF、奥の面 DCGH、左の面 AEHD、上の面 EFGH）。
   ・小テストは kukan-04 と同じ（チャレンジ（5）の答えは、ひろげる（7）の答えと同じ内容。次の時間のはじめの自己採点でわかる設計。元のまま）。
   ・検算：辺と面の位置関係・きょりの答えは、座標から計算して確かめている（checks の mk）。　node tools/verify.cjs kukan_new-04　／　見た目：node tools/check.cjs <出力先> kukan_new-04 */
(function () {
  const { M, K, B, G, F, C2, T, HD, BR, WD, MA, TB, POLY } = IK.b;

  const CUB = o => POLY(Object.assign({ solid: 'cuboid', w: 4, d: 2.4, h: 2.6, labels: 'ABCDEFGH' }, o));   // 直方体の見取図
  // 底面が ∠B＝90° の直角三角形の三角柱：A(0,0,0) B(3,0,0) C(3,2,0)、D・E・F はその真上
  const RPRISM = o => POLY(Object.assign({ V: [[0, 0, 0], [3, 0, 0], [3, 2, 0], [0, 0, 2.4], [3, 0, 2.4], [3, 2, 2.4]], proj: 'oblique', labels: 'ABCDEF' }, o));

  /* ---- 検算の道具（座標から、辺・面の位置関係ときょりを計算する）。checks の文字列に、そのまま入れる ---- */
  const mk = (P, E, Fs) => {
    const sub = (p, q) => [p[0] - q[0], p[1] - q[1], p[2] - q[2]];
    const cr = (p, q) => [p[1] * q[2] - p[2] * q[1], p[2] * q[0] - p[0] * q[2], p[0] * q[1] - p[1] * q[0]];
    const dt = (p, q) => p[0] * q[0] + p[1] * q[1] + p[2] * q[2];
    const z = v => Math.hypot(v[0], v[1], v[2]) < 1e-9;
    const nm = s => s.split('').sort().join('');
    const dir = e => sub(P[e[1]], P[e[0]]);
    const nor = f => cr(sub(P[f[1]], P[f[0]]), sub(P[f[2]], P[f[0]]));
    const same = (list, str) => list.map(nm).sort().join(',') === str.split(',').map(nm).sort().join(',');
    const lrel = (a, b) => { const n = cr(dir(a), dir(b)); if (z(n)) return 'par'; return Math.abs(dt(sub(P[b[0]], P[a[0]]), n)) < 1e-9 ? 'cross' : 'skew'; };
    const lp = (e, f) => { const n = nor(f); if (z(cr(dir(e), n))) return 'perp'; if (Math.abs(dt(dir(e), n)) < 1e-9) return Math.abs(dt(sub(P[e[0]], P[f[0]]), n)) < 1e-9 ? 'in' : 'par'; return 'cross'; };
    const pp = (f, g) => { const a = nor(f), b = nor(g); if (z(cr(a, b))) return 'par'; return Math.abs(dt(a, b)) < 1e-9 ? 'perp' : 'cross'; };
    return {
      same, lrel, lp, pp,
      edgesOf: (f, r) => E.filter(e => lp(e, f) === r),                                              // 面 f と、平面上にある(in)・交わる(cross)・平行(par)・垂直(perp) の辺
      facesOf: (f, r) => Fs.filter(g => nm(g) !== nm(f) && pp(f, g) === r),                           // 面 f と、交わる(cross)・平行(par)・垂直(perp) の面
      dist: (p, f) => { const n = nor(f); return Math.abs(dt(sub(P[p], P[f[0]]), n)) / Math.hypot(n[0], n[1], n[2]); }
    };
  };
  const cuboidP = (w, d, h) => `{ A: [0, 0, 0], B: [${w}, 0, 0], C: [${w}, ${d}, 0], D: [0, ${d}, 0], E: [0, 0, ${h}], F: [${w}, 0, ${h}], G: [${w}, ${d}, ${h}], H: [0, ${d}, ${h}] }`;
  const CE = "['AB', 'BC', 'CD', 'DA', 'EF', 'FG', 'GH', 'HE', 'AE', 'BF', 'CG', 'DH']";
  const CF = "['ABCD', 'EFGH', 'ABFE', 'BCGF', 'CDHG', 'DAEH']";
  const geo = (P, E, Fs, body) => `(() => { const mk = ${mk}; const g = mk(${P}, ${E}, ${Fs}); return ${body}; })()`;

  IK.lesson('kukan_new-04', {
    unit: 'kukan_new', unitName: '空間図形（新しい形）', form: 'new', no: '第4時', title: '直線と平面、平面と平面の位置関係を調べよう',
    summary: '直方体で、直線と平面・2つの平面の位置関係（平行・垂直・交わる）と、点と平面のきょりを調べる。三角定規を使って、直線が平面に垂直であることの確かめ方を考える。',
    head: '空間図形　第4時',
    pitch: 8, dots: true,
    checks: [
      // ワークシート：今日の問い（面 ABCD）。直方体 AB＝4・AD＝3・AE＝2
      geo(cuboidP(4, 3, 2), CE, CF, "g.same(g.edgesOf('ABCD', 'in'), 'AB,BC,CD,DA') && g.same(g.edgesOf('ABCD', 'perp'), 'AE,BF,CG,DH') && g.same(g.edgesOf('ABCD', 'par'), 'EF,FG,GH,HE')"),
      // 例題（面 ABFE）：平行な辺・垂直な辺・平行な面、点 D と面 ABFE のきょり 3cm（＝AD）
      geo(cuboidP(4, 3, 2), CE, CF, "g.same(g.edgesOf('ABFE', 'par'), 'DC,CG,GH,HD') && g.same(g.edgesOf('ABFE', 'perp'), 'AD,BC,EH,FG') && g.same(g.facesOf('ABFE', 'par'), 'DCGH') && g.same(g.facesOf('ABFE', 'perp'), 'ABCD,EFGH,BCGF,DAEH') && Math.abs(g.dist('D', 'ABFE') - 3) < 1e-9"),
      // 演習プリント（1）〜（3）面 BFGC（AB＝5・AD＝3・AE＝4）、（4）きょり、（6）辺 CG をふくみ面 ABCD に垂直な面
      geo(cuboidP(5, 3, 4), CE, CF, "g.same(g.edgesOf('BFGC', 'par'), 'AD,AE,DH,EH') && g.same(g.edgesOf('BFGC', 'perp'), 'AB,DC,EF,HG') && g.same(g.facesOf('BFGC', 'par'), 'AEHD') && g.same(g.facesOf('BFGC', 'perp'), 'ABCD,EFGH,ABFE,DCGH') && Math.abs(g.dist('B', 'AEHD') - 5) < 1e-9 && Math.abs(g.dist('A', 'EFGH') - 4) < 1e-9 && g.same(['ABCD', 'EFGH', 'ABFE', 'BCGF', 'CDHG', 'DAEH'].filter(f => f.includes('C') && f.includes('G') && g.pp('ABCD', f) === 'perp'), 'BCGF,CDHG')"),
      // （5）底面が ∠B＝90° の三角柱：面 ABC と垂直な辺、面 ABED と垂直な面
      "(() => { const mk = " + mk + "; const P = { A: [0, 0, 0], B: [3, 0, 0], C: [3, 2, 0], D: [0, 0, 2], E: [3, 0, 2], F: [3, 2, 2] }, Fs = ['ABC', 'DEF', 'ABED', 'BCFE', 'CADF']; const g = mk(P, ['AB', 'BC', 'CA', 'DE', 'EF', 'FD', 'AD', 'BE', 'CF'], Fs); return g.same(g.edgesOf('ABC', 'perp'), 'AD,BE,CF') && g.same(g.facesOf('ABED', 'perp'), 'ABC,DEF,BCFE'); })()",
      // （8）いつも成り立つ：イの反例（面 ABCD に平行な辺 EF・EH は E で交わる）、エの反例（辺 AB に平行な面 EFGH・DCGH は交わる）、ア（面 ABCD・EFGH は、辺 AE に垂直で平行）、ウ（辺 AE・BF は、面 ABCD に垂直で平行）
      geo(cuboidP(3, 3, 3), CE, CF, "g.lp('EF', 'ABCD') === 'par' && g.lp('EH', 'ABCD') === 'par' && g.lrel('EF', 'EH') === 'cross' && g.lp('AB', 'EFGH') === 'par' && g.lp('AB', 'DCGH') === 'par' && g.pp('EFGH', 'DCGH') !== 'par' && g.pp('ABCD', 'EFGH') === 'par' && g.lp('AE', 'ABCD') === 'perp' && g.lp('AE', 'EFGH') === 'perp' && g.lp('BF', 'ABCD') === 'perp' && g.lrel('AE', 'BF') === 'par'"),
      // 小テスト：面 DCGH（AB＝4・AD＝5・AE＝3）と垂直な辺・平行な辺、点 A と面 DCGH のきょり 5、面 ABCD と面 EFGH のきょり 3　／　チャレンジ：AE は AB・AD と垂直で、AB と AD は A で交わる
      geo(cuboidP(4, 5, 3), CE, CF, "g.same(g.edgesOf('DCGH', 'perp'), 'AD,BC,EH,FG') && g.same(g.edgesOf('DCGH', 'par'), 'AB,EF,AE,BF') && Math.abs(g.dist('A', 'DCGH') - 5) < 1e-9 && Math.abs(g.dist('A', 'EFGH') - 3) < 1e-9 && g.lp('AE', 'ABCD') === 'perp' && g.lrel('AB', 'AD') === 'cross' && g.lrel('AE', 'AB') === 'cross' && g.lrel('AE', 'AD') === 'cross'")
    ],

    /* ================= ワークシート（A4 1枚・約12分） ================= */
    ws: [
      M('直線と平面、平面と平面の位置関係を調べよう'),
      K('今日の問い', '直方体で、面 ABCD と、12本の辺との関係を調べて、仲間分けしよう。', 2),
      F(5, CUB({ planes: [{ v: 'ABCD' }] })),
      T('①', '自分の考え（3分）　どこに目をつけたかも書こう。', 1),
      B(3, '（例）面の上にある … AB、BC、CD、DA\n1点で交わる … AE、BF、CG、DH\n交わらない … EF、FG、GH、HE'),
      T('②', 'ペアの考え（3分）　自分とちがう分け方を書こう。', 1),
      B(2, ''),
      G(1),
      WD('直線と平面 … 平面上に{{ある}}・1点で{{交わる}}・{{平行}}\n2つの平面 … {{交わる}}・{{平行}}\n直線 ℓ が、平面 P との交点を通る P 上の\nすべての直線と垂直なとき、ℓ と P は{{垂直}}。\n点 A から P にひいた{{垂線}}の長さが、A と P の{{きょり}}。', 5, { label: 'ことば（教科書で調べよう）' }),
      G(1),
      K('例題', '直方体で、AB＝{{4}}cm、AD＝{{3}}cm、AE＝{{2}}cm とする。面 ABFE について、表を完成させよう。', 2),
      C2([
        TB('', null, [
          ['平行な辺', ['{{DC、CG、GH、HD}}']],
          ['垂直な辺', ['{{AD、BC、EH、FG}}']],
          ['平行な面', ['{{面 DCGH}}']],
          ['点 D とのきょり', ['{{3}}cm']]
        ], { hw: 38 })
      ], [
        F(5, CUB({ planes: [{ v: 'ABFE' }] }))
      ], '3:2'),
      T('', '【きょりのまとめ】点と平面のきょりは、どこの長さか。', 1),
      B(2, '点と平面のきょりは、点から平面にひいた垂線の長さ。\n（例）点 D と面 ABFE … 辺 AD は、面 ABFE に垂直。')
    ],

    /* ================= 演習プリント（A4 表裏） ================= */
    dr: [
      HD('確かめる', 'ことばを確かめて、図1・図2で、基本をたしかめよう。'),
      WD('① 直線と平面 … 平面上に{{ある}}・1点で{{交わる}}・{{平行}}である\n② 2つの平面 … {{交わる}}・{{平行}}である\n③ 直線 ℓ が、平面 P との交点を通る P 上の\n　 すべての直線と垂直なとき、ℓ と P は{{垂直}}である。\n④ 点 A から P にひいた{{垂線}}の長さを、A と P との{{きょり}}という。', 5, { label: 'ことば' }),
      F(5,
        CUB({ w: 5, d: 3, h: 4, planes: [{ v: 'BCGF' }], caption: '図1　AB＝5cm、AD＝3cm、AE＝4cm' }),
        RPRISM({ caption: '図2' })),
      C2([
        T('（1）', '面 BFGC と平行な辺を、すべて答えよう。', 2),
        B(1, 'AD、AE、DH、EH')
      ], [
        T('（2）', '面 BFGC と垂直な辺を、すべて答えよう。', 2),
        B(1, 'AB、DC、EF、HG')
      ], '1:1'),
      MA('【説明】直線と平面の 3つの位置関係を、直方体の辺と面で説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      HD('使ってみる', '面や辺の関係と、きょりを調べよう。'),
      C2([
        T('（3）', '面 BFGC と平行な面と、垂直な面を、すべて答えよう。', 3),
        B(3, '平行 … 面 AEHD\n垂直 … 面 ABCD、面 EFGH、\n　面 ABFE、面 DCGH')
      ], [
        T('（4）', '次のきょりを答えよう。\n① 点 B と面 AEHD\n② 面 ABCD と面 EFGH', 3),
        B(2, '① 5cm（辺 AB の長さ）\n② 4cm（辺 AE の長さ）')
      ], '1:1'),
      C2([
        T('（5）', '図2の三角柱（∠B＝90°）で、\n① 面 ABC と垂直な辺\n② 面 ABED と垂直な面', 4),
        B(3, '① AD、BE、CF\n② 面 ABC、面 DEF、\n　面 BCFE')
      ], [
        T('（6）', '辺 CG をふくみ、面 ABCD と垂直な面を、すべて答えよう。', 4),
        B(1, '面 BFGC、面 DCGH')
      ], '1:1'),
      G(1),
      T('', '★ ここまでできたら、今日の合格！　　合格 ☐', 1),
      BR(),

      HD('ひろげる', '考えよう：直線が平面に垂直であることの、確かめ方を考えよう。'),
      T('（7）', '直線 ℓ が平面 P に垂直であることを確かめるには、P 上の直線のうち、何本と垂直であることを調べればよいだろう。三角定規と下じきで、確かめよう。', 3),
      C2([
        T('', '予想（何本？　理由もひとこと）', 1),
        B(6, '')
      ], [
        T('', '確かめてわかったこと・理由', 1),
        B(6, '')
      ], '1:1'),
      G(1),
      HD('チャレンジ★★', '入試にも出る問題。ヒントカードを見てもOK。'),
      C2([
        T('（8）', '空間で、いつも成り立つものを、すべて選ぼう。\nア 1つの直線に垂直な 2つの平面は、平行である。\nイ 1つの平面に平行な 2つの直線は、平行である。\nウ 1つの平面に垂直な 2つの直線は、平行である。\nエ 1つの直線に平行な 2つの平面は、平行である。', 10),
        B(6, 'ア、ウ\nイ … 面 ABCD に平行な\n　辺 EF、EH は E で交わる\nエ … 辺 AB に平行な\n　面 EFGH、DCGH は\n　GH で交わる')
      ], [
        MA('① 成り立たないと思うものは、直方体の辺や面を使って、反例を探してみよう。\n② 成り立つと思うものは、ほかの例でも試して、理由を考えよう。', 6, { label: 'ヒントカード' })
      ], '1:1')
    ],

    /* ================= 小テスト（kukan-04 と同じ） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      T('（1）', '直線と平面の位置関係を、3つ答えよう。（3点）', 1),
      B(2, '平面上にある、1点で交わる、平行である'),
      C2([
        T('（2）', '右の直方体で、面 DCGH と垂直な辺を、すべて答えよう。（2点）', 2),
        B(1, 'AD、BC、EH、FG'),
        T('（3）', '面 DCGH と平行な辺を、すべて答えよう。（2点）', 2),
        B(1, 'AB、EF、AE、BF')
      ], [F(6, CUB({ planes: [{ v: 'DCGH' }] }))], '2:1'),
      T('（4）', '上の直方体で、AB＝4cm、AD＝5cm、AE＝3cm のとき、次のきょりを答えよう。（3点）\n① 点 A と面 DCGH　　② 面 ABCD と面 EFGH', 3),
      B(2, '① 5cm　　② 3cm'),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      T('（5）', '上の直方体で、辺 AE が面 ABCD に垂直であるといえる理由を、「交わる」という言葉を使って説明しよう。', 2),
      B(5, 'AE は、面 ABCD 上の辺 AB、AD と垂直である。\nAB と AD は、点 A で交わる 2直線である。\n交わる 2直線に垂直だから、AE は面 ABCD に垂直。')
    ]
  });
})();
