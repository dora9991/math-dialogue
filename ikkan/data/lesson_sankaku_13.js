/* 図形と証明（三角形と四角形） 第13時：条件カードで、四角形を仲間分けしよう。
   元：授業ナビ標準版 sankaku-13（遊：条件カードの分類ゲーム）。性質カードで仲間分けする活動を「今日の問い」と①②に、条件カード（平行四辺形に条件を加えると何になるか）を「例題」に、
   四角形どうしの関係を1つの図に表すことを、考えよう（演習プリント（7））にした。
   ・ワークシートは A4 1枚：問いは1つ（ア〜オの性質を「かならず」もつ四角形を選ぶ）。個人3分 → ペア3分 → ことば（4つの定義）→ 例題（条件カードの表）。
   ・演習プリントは表裏：表＝確かめる 2問・使ってみる 4問／裏＝ひろげる（考えよう・答えなし）・チャレンジ★★（証明。ヒントカードつき）。
   ・四角形の図は、座標から描いた。性質の○×・条件で決まる四角形・角の大きさは、checks で、座標（長さ・内積・外積・角）から出しなおした。
   ・チャレンジ（8）の証明は、4つの角の二等分線が交わる点の座標を式で出して、PQRS が長方形になること、証明に使う角の関係が成り立つことを確かめた。
   検算：node tools/verify.cjs sankaku-13　／　見た目：node tools/check.cjs <出力先> sankaku-13 */
(function () {
  const { M, K, B, G, F, C2, T, HD, BR, WD, MA, TB, SVG, GEO } = IK.b;
  const J = JSON.stringify;
  const RAD = Math.PI / 180;

  // 図に、見出しをつける（SVG・GEO の図は、見出しを自分でかかない）
  const cap = (fig, text) => SVG((W, H, h) => h.tx(W / 2, 3.5, text, 3, 'middle', ' class="cap"') + `<g transform="translate(0 4.4)">${fig.svg(W, H - 4.4, h)}</g>`);
  const VL = { A: ['A', 135], B: ['B', 225], C: ['C', 315], D: ['D', 45] };

  // ---- 4つの四角形（A が左上、B が左下、C が右下、D が右上）----
  const pol = (b, a) => [b * Math.cos(a * RAD), b * Math.sin(a * RAD)];
  const rhomA = pol(3, 65);
  const Q = {
    para: { A: [1.1, 2.4], B: [0, 0], C: [4.4, 0], D: [5.5, 2.4] },
    rect: { A: [0, 2.4], B: [0, 0], C: [4.4, 0], D: [4.4, 2.4] },
    rhom: { A: [rhomA[0], rhomA[1]], B: [0, 0], C: [3, 0], D: [3 + rhomA[0], rhomA[1]] },
    sq: { A: [0, 2.6], B: [0, 0], C: [2.6, 0], D: [2.6, 2.6] }
  };
  const quad = (name, P) => cap(GEO({ pts: P, poly: 'ABCD', segs: ['AC', 'BD'], vl: VL, pad: 6 }), name);

  // 図1：ひし形 ABCD（∠ABC＝80°、1辺 3）。∠x＝∠BAC
  const F1 = (() => { const a = pol(3, 80); return { A: [a[0], a[1]], B: [0, 0], C: [3, 0], D: [3 + a[0], a[1]] }; })();
  const fig1 = cap(GEO({
    pts: F1, poly: 'ABCD', segs: ['AC'], vl: VL, pad: 5,
    ang: [{ at: 'B', a: 'A', b: 'C', t: '80°', r: 6 }, { at: 'A', a: 'B', b: 'C', t: 'x', r: 6 }]
  }), '図1');
  // 図2：長方形 ABCD（BC＝4、∠ACB＝32°）。対角線の交点 O。∠x＝∠AOB
  const F2 = { A: [0, 4 * Math.tan(32 * RAD)], B: [0, 0], C: [4, 0], D: [4, 4 * Math.tan(32 * RAD)], O: [2, 2 * Math.tan(32 * RAD)] };
  const fig2 = cap(GEO({
    pts: F2, poly: 'ABCD', segs: ['AC', 'BD'], vl: Object.assign({ O: ['O', 90, 3] }, VL), pad: 5,
    ang: [{ at: 'C', a: 'A', b: 'B', t: '32°', r: 9 }, { at: 'O', a: 'A', b: 'B', t: 'x', r: 5 }]
  }), '図2');

  // 図3（チャレンジ）：▱ABCD（∠B＝60°、AB＝3、BC＝5）の4つの角の二等分線
  const PB = { B: [0, 0], C: [5, 0] }; PB.A = pol(3, 60); PB.D = [PB.A[0] + 5, PB.A[1]];
  // 角の二等分線：頂点 V から、辺 V→X と V→Y のあいだの角の向き（度）
  const bis = (V, X, Y) => { const a = Math.atan2(X[1] - V[1], X[0] - V[0]), b = Math.atan2(Y[1] - V[1], Y[0] - V[0]); let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return (a + d / 2) / RAD; };
  const cross2 = (P1, a1, P2, a2) => {   // 2直線（点と向き）の交点
    const u = [Math.cos(a1 * RAD), Math.sin(a1 * RAD)], w = [Math.cos(a2 * RAD), Math.sin(a2 * RAD)], d = [P2[0] - P1[0], P2[1] - P1[1]];
    const t = (d[0] * w[1] - d[1] * w[0]) / (u[0] * w[1] - u[1] * w[0]);
    return [P1[0] + t * u[0], P1[1] + t * u[1]];
  };
  const bA = bis(PB.A, PB.B, PB.D), bB = bis(PB.B, PB.A, PB.C), bC = bis(PB.C, PB.B, PB.D), bD = bis(PB.D, PB.C, PB.A);
  const PP = cross2(PB.A, bA, PB.B, bB), QQ = cross2(PB.B, bB, PB.C, bC), RR = cross2(PB.C, bC, PB.D, bD), SS = cross2(PB.D, bD, PB.A, bA);
  const R3 = p => [p[0], p[1]];
  const F3 = { A: R3(PB.A), B: R3(PB.B), C: R3(PB.C), D: R3(PB.D), P: R3(PP), Q: R3(QQ), R: R3(RR), S: R3(SS) };
  const fig3 = GEO({
    pts: F3, poly: 'ABCD', segs: ['AS', 'BQ', 'CQ', 'DS'], dots: ['P', 'Q', 'R', 'S'], pad: 7,
    vl: { A: ['A', 135], B: ['B', 225], C: ['C', 315], D: ['D', 45], P: ['P', 165, 3.2], Q: ['Q', 75, 3.2], R: ['R', 345, 3.2], S: ['S', 205, 3.4] }
  });

  /* ---- 検算の道具（checks の式の先頭にそえる）---- */
  const LIB = 'const v=(P,Q)=>[Q[0]-P[0],Q[1]-P[1]], dot=(u,w)=>u[0]*w[0]+u[1]*w[1], cr=(u,w)=>u[0]*w[1]-u[1]*w[0], len=(P,Q)=>Math.hypot(Q[0]-P[0],Q[1]-P[1]), z=x=>Math.abs(x)<1e-6, deg=(P,Q,R)=>Math.acos(dot(v(Q,P),v(Q,R))/(len(Q,P)*len(Q,R)))*180/PI, mid=(P,Q)=>[(P[0]+Q[0])/2,(P[1]+Q[1])/2], '
    // 四角形 ABCD の性質：ア 2組の対辺が平行　イ 4辺が等しい　ウ 4つの角が等しい　エ 対角線の長さが等しい　オ 対角線が垂直
    + 'pr=(P)=>({ a: z(cr(v(P.A,P.B),v(P.D,P.C)))&&z(cr(v(P.A,P.D),v(P.B,P.C))), i: [len(P.A,P.B),len(P.B,P.C),len(P.C,P.D),len(P.D,P.A)].every(s=>z(s-len(P.A,P.B))), u: [deg(P.D,P.A,P.B),deg(P.A,P.B,P.C),deg(P.B,P.C,P.D),deg(P.C,P.D,P.A)].every(s=>z(s-deg(P.D,P.A,P.B))), e: z(len(P.A,P.C)-len(P.B,P.D)), o: z(dot(v(P.A,P.C),v(P.B,P.D))) }), '
    // 平行四辺形（B が原点、BC＝a、BA＝b、∠B＝th 度）
    + 'pg=(a,b,th)=>{ const A=[b*Math.cos(th*PI/180),b*Math.sin(th*PI/180)]; return { A, B:[0,0], C:[a,0], D:[A[0]+a,A[1]] }; };';

  IK.lesson('sankaku-13', {
    unit: 'sankaku', unitName: '図形と証明（三角形と四角形）', form: 'new', no: '第13時', title: '条件カードで、四角形を仲間分けしよう',
    summary: '性質カードを使って、平行四辺形・長方形・ひし形・正方形を仲間分けし、四角形どうしの関係をとらえる。平行四辺形に条件を加えると何になるかを、理由をつけて判断する。',
    head: '図形と証明　第13時',
    pitch: 8, dots: true,
    checks: [
      // 今日の問い：ア〜オの性質をもつ四角形（座標から調べる）。ア＝4つとも、イ＝ひし形・正方形、ウ＝長方形・正方形、エ＝長方形・正方形、オ＝ひし形・正方形
      `(() => { ${LIB} const Q=${J(Q)}; const who=k=>Object.keys(Q).filter(n=>pr(Q[n])[k]).join(); return who('a')==='para,rect,rhom,sq' && who('i')==='rhom,sq' && who('u')==='rect,sq' && who('e')==='rect,sq' && who('o')==='rhom,sq'; })()`,
      // 例題（条件カード）：▱に ∠A＝90° → 4つの角が等しく、辺は等しくない（長方形）。AB＝BC → 4辺が等しく、角は等しくない（ひし形）
      `(() => { ${LIB} const r=pr(pg(4.4,2.4,90)), h=pr(pg(3,3,65)); return r.u && !r.i && h.i && !h.u && r.a && h.a; })()`,
      // 例題：▱で AC＝BD になるのは ∠B＝90° のときだけ（長方形）、AC⊥BD になるのは 4辺が等しいときだけ（ひし形）。角度・辺の長さをかえて確かめる
      `(() => { ${LIB} const T=[[50,4,3],[70,4,3],[90,4,3],[110,4,3],[60,3,3],[90,3,3],[120,3,3],[80,5,2]]; return T.every(([th,a,b])=>{ const p=pr(pg(a,b,th)); return p.e===(th===90) && p.o===(a===b); }); })()`,
      // 例題 くふう：AC＝BD ならば △ABC≡△DCB（3組の辺）で ∠B＝∠C、AB∥DC より ∠B+∠C＝180° だから、どちらも 90°
      `(() => { ${LIB} const P=pg(4.4,2.4,90); return z(len(P.A,P.B)-len(P.D,P.C)) && z(len(P.A,P.C)-len(P.D,P.B)) && z(deg(P.A,P.B,P.C)-deg(P.D,P.C,P.B)) && z(deg(P.A,P.B,P.C)+deg(P.D,P.C,P.B)-180) && z(deg(P.A,P.B,P.C)-90); })()`,
      // （1）▱で ∠B＝90° → 長方形、BC＝CD → ひし形　（2）∠A＝∠B → ∠A＋∠B＝180° より 90°（長方形）、AB＝AD かつ ∠A＝90° → 正方形
      `(() => { ${LIB} const a=pr(pg(4,2.5,90)), b=pr(pg(3,3,70)), c=pr(pg(3,3,90)); return a.u&&!a.i && b.i&&!b.u && c.u&&c.i && near(180/2,90); })()`,
      // （3）対角線：ア 長方形は垂直に交わる（×）　イ ひし形は中点で交わる（○）　ウ 平行四辺形は長さが等しい（×）　エ 正方形は長さが等しい（○）
      `(() => { ${LIB} const Q=${J(Q)}, m=P=>z(len(mid(P.A,P.C),mid(P.B,P.D))); return !pr(Q.rect).o && m(Q.rhom) && !pr(Q.para).e && pr(Q.sq).e; })()`,
      // （4）長方形で AC＝12 → BD＝12、対角線の交点 O は中点だから OA＝OB＝OC＝OD＝6
      `(() => { ${LIB} const P=pg(Math.sqrt(144-25),5,90), O=mid(P.A,P.C); return near(len(P.A,P.C),12) && near(len(P.B,P.D),12) && near(len(O,P.A),6) && near(len(O,P.B),6) && near(len(O,P.C),6) && near(len(O,P.D),6); })()`,
      // （5）図1：ひし形 ∠ABC＝80° → ∠BAC＝50°　（6）図2：長方形 ∠ACB＝32° → ∠AOB＝64°（座標から）
      `(() => { ${LIB} const P=${J(F1)}; return near(deg(P.A,P.B,P.C),80) && near(deg(P.B,P.A,P.C),50) && near(180-80>>1,50); })()`,
      `(() => { ${LIB} const P=${J(F2)}; return near(deg(P.A,P.C,P.B),32) && near(deg(P.A,P.O,P.B),64) && near(32*2,64) && z(len(P.O,P.A)-len(P.O,P.B)); })()`,
      // （8）▱ABCD（∠B＝60°）の4つの角の二等分線 → PQRS は長方形。∠APB＝90°（∠DAB＋∠ABC＝180° の半分が 90°）、∠SPQ＝∠APB（対頂角）
      `(() => { ${LIB} const P=${J(F3)}; const ang4=[deg(P.S,P.P,P.Q),deg(P.P,P.Q,P.R),deg(P.Q,P.R,P.S),deg(P.R,P.S,P.P)]; return ang4.every(a=>near(a,90)) && near(deg(P.A,P.P,P.B),90) && near(deg(P.D,P.A,P.B)+deg(P.A,P.B,P.C),180) && near(deg(P.A,P.B,P.C)/2+deg(P.D,P.A,P.B)/2,90) && z(cr(v(P.A,P.P),v(P.P,P.S))) && z(cr(v(P.B,P.P),v(P.P,P.Q))); })()`,
      // （8）4本の二等分線の上の並び：A―P―S、B―P―Q、C―R―Q、D―R―S（図と証明の「対頂角」「同じ角」の使い方のもと）
      `(() => { ${LIB} const P=${J(F3)}; const bt=(X,Y,W)=>z(cr(v(X,Y),v(Y,W)))&&dot(v(X,Y),v(Y,W))>0; return bt(P.A,P.P,P.S)&&bt(P.B,P.P,P.Q)&&bt(P.C,P.R,P.Q)&&bt(P.D,P.R,P.S) && near(deg(P.P,P.Q,P.R),deg(P.B,P.Q,P.C)) && near(deg(P.Q,P.R,P.S),deg(P.C,P.R,P.D)) && near(deg(P.R,P.S,P.P),deg(P.D,P.S,P.A)); })()`,
      // 小テスト（1）ウ AC⊥BD → ひし形　（2）AB＝BC かつ ∠A＝90° → 正方形　（3）長方形で AC＝10 → BD＝10
      `(() => { ${LIB} const a=pr(pg(4.4,2.4,90)), b=pr(pg(3,3,65)), c=pr(pg(3,3,90)), P=pg(8,6,90); return a.u&&!a.i && b.i&&b.o&&!b.u && c.i&&c.u && near(len(P.A,P.C),10) && near(len(P.B,P.D),10); })()`,
      // 小テスト（4）ア 正方形は平行四辺形（○）　イ 平行四辺形は長方形（×）　ウ ひし形は平行四辺形（○）　エ 長方形はひし形（×）
      `(() => { ${LIB} const Q=${J(Q)}; const isRect=P=>pr(P).a&&pr(P).u, isRhom=P=>pr(P).a&&pr(P).i, isPara=P=>pr(P).a; return isPara(Q.sq) && !isRect(Q.para) && isPara(Q.rhom) && !isRhom(Q.rect); })()`
    ],

    /* ================= ワークシート（A4 1枚・約12分） ================= */
    ws: [
      M('四角形を、性質で仲間分けしよう'),
      K('今日の問い', '平行四辺形・長方形・ひし形・正方形を、ア〜オの性質で仲間分けしよう。「かならず」あてはまるものだけを選ぼう。', 2),
      T('', 'ア 2組の対辺が平行　イ 4つの辺が等しい　ウ 4つの角が等しい\nエ 対角線の長さが等しい　オ 対角線が垂直に交わる', 2),
      F(4, quad('平行四辺形', Q.para), quad('長方形', Q.rect), quad('ひし形', Q.rhom), quad('正方形', Q.sq)),
      T('①', '自分の考え（3分）　カードごとに、あてはまる四角形を書こう。', 1),
      B(5, '（例）ア … 4つとも\nイ … ひし形・正方形\nウ … 長方形・正方形\nエ … 長方形・正方形\nオ … ひし形・正方形'),
      T('②', 'ペアの考え（3分）　自分とちがうところを確かめ、気づいたことを書こう。', 1),
      B(2, ''),
      G(1),
      WD('2組の対辺が平行な四角形 … {{平行四辺形}}\n4つの角が等しい四角形 … {{長方形}}\n4つの辺が等しい四角形 … {{ひし形}}\n4つの角も辺も等しい四角形 … {{正方形}}', 4, { label: 'ことば（教科書で調べよう）' }),
      G(1),
      K('例題', '平行四辺形 ABCD に、次の条件を加えると、何になるか。表を完成させよう。（ア は見本）', 2),
      TB('条件', ['ア ∠A＝90°', 'イ AB＝BC', 'ウ AC＝BD', 'エ AC⊥BD'], [
        ['何の条件か', ['角', '{{辺}}', '{{対角線}}', '{{対角線}}']],
        ['できる四角形', ['長方形', '{{ひし形}}', '{{長方形}}', '{{ひし形}}']]
      ], { hw: 30 }),
      T('', '【理由のくふう】ウ の条件で、長方形になるわけを考えよう。', 1),
      B(3, '△ABC と △DCB で　AB＝DC、AC＝DB、BC は共通\n3組の辺が等しいから　△ABC≡△DCB　∠B＝∠C\nAB∥DC より　∠B＋∠C＝180° だから　∠B＝90°')
    ],

    /* ================= 演習プリント（A4 表裏） ================= */
    dr: [
      HD('確かめる', 'ことばと、基本をたしかめよう。'),
      WD('① 2組の対辺が、それぞれ平行な四角形を{{平行四辺形}}という。\n② 4つの角が等しい四角形を{{長方形}}という。\n③ 4つの辺が等しい四角形を{{ひし形}}という。\n④ 4つの角も辺も等しい四角形を{{正方形}}という。', 4, { label: 'ことば' }),
      F(6, fig1, fig2),
      T('', '▱ABCD に、次の条件を加えると、何になるだろう。', 1),
      C2([
        T('（1）', 'ア ∠B＝90°\nイ BC＝CD', 2),
        B(1, 'ア 長方形　　イ ひし形')
      ], [
        T('（2）', 'ア ∠A＝∠B\nイ AB＝AD、∠A＝90°', 2),
        B(1, 'ア 長方形　　イ 正方形')
      ], '1:1'),
      MA('【説明】▱に ∠A＝90° を加えると長方形になるわけを、隣の人に説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      G(1),
      HD('使ってみる', '性質を使って、四角形を見分けよう。'),
      C2([
        T('（3）', '対角線について、正しいものを、すべて選ぼう。\nア 長方形は、垂直に交わる。\nイ ひし形は、中点で交わる。\nウ 平行四辺形は、長さが等しい。\nエ 正方形は、長さが等しい。', 6),
        B(1, 'イ、エ')
      ], [
        T('（4）', '長方形 ABCD の対角線 AC は 12cm である。対角線 BD の長さと、交点 O から頂点 A までの長さを求めよう。', 3),
        B(2, 'BD＝12cm\nOA＝12÷2＝6（cm）')
      ], '1:1'),
      C2([
        T('（5）', '図1のひし形 ABCD で、∠x の大きさを求めよう。', 2),
        B(3, '4つの辺が等しいから　AB＝BC\n∠x＝(180°−80°)÷2＝50°')
      ], [
        T('（6）', '図2の長方形 ABCD で、∠x の大きさを求めよう。', 2),
        B(3, 'OB＝OC だから　∠OBC＝32°\n∠x＝32°+32°＝64°')
      ], '1:1'),
      G(1),
      T('', '★ ここまでできたら、今日の合格！　　合格 ☐', 1),
      BR(),

      HD('ひろげる', '考えよう：四角形どうしの関係を、図に表そう。'),
      T('（7）', '平行四辺形・長方形・ひし形・正方形の関係がわかるように、1つの図にかこう。（輪をかさねる、など、かき方は自由）', 3),
      C2([
        T('', '図にかこう', 1),
        B(9, '')
      ], [
        T('', '図から、気づいたこと', 1),
        B(9, '')
      ], '1:1'),
      G(1),
      HD('チャレンジ★★', '入試にも出る問題。ヒントカードを見てもOK。'),
      C2([
        T('（8）', '右の図で、▱ABCD の4つの角の二等分線が、P、Q、R、S で交わっている。四角形 PQRS が長方形になることを証明しよう。', 3)
      ], [
        F(5, fig3)
      ], '3:2'),
      B(9, '（仮定）▱ABCD で、∠A、∠B、∠C、∠D の二等分線が P、Q、R、S で交わる\n（結論）四角形 PQRS は長方形\n（証明）AD∥BC より　∠DAB＋∠ABC＝180°\nAP、BP は ∠DAB、∠ABC の二等分線だから\n∠PAB＋∠PBA＝180°÷2＝90°\n△PAB の内角の和は 180° だから　∠APB＝90°\n対頂角は等しいから　∠SPQ＝∠APB＝90°\n同じようにして　∠PQR＝∠QRS＝∠RSP＝90°\n4つの角が等しいから、四角形 PQRS は長方形である。'),
      MA('① AD∥BC のとき、∠DAB と ∠ABC の和は何度かな。AP、BP は、その角をどうしているかな。\n② ∠SPQ は、どの角と対頂角かな。', 3, { label: 'ヒントカード' })
    ],

    /* ================= 小テスト（A4 1枚・5分・10点満点） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      T('（1）', '▱ABCD に、次の条件を加えると、何になるか。（3点）\nア ∠A＝90°　　イ AB＝BC　　ウ AC⊥BD', 2),
      B(2, 'ア 長方形　　イ ひし形　　ウ ひし形'),
      T('（2）', '▱ABCD に、AB＝BC と ∠A＝90° の2つの条件を加えると、何になるか。（2点）', 2),
      B(2, '正方形'),
      T('（3）', '長方形 ABCD の対角線 AC は 10cm である。対角線 BD の長さを求めよう。（2点）', 2),
      B(2, '10cm\n（長方形の対角線は、長さが等しい）'),
      T('（4）', '正しいものを、すべて選ぼう。（3点）\nア 正方形は、平行四辺形である。　　イ 平行四辺形は、長方形である。\nウ ひし形は、平行四辺形である。　　エ 長方形は、ひし形である。', 3),
      B(2, 'ア、ウ'),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      T('（5）', '「正方形は、ひし形である」は、正しいだろうか。理由も書こう。', 2),
      B(4, '正しい。\n正方形は、4つの辺が等しいから、\nひし形の定義にあてはまる。')
    ]
  });
})();
