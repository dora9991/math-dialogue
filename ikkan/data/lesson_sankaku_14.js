/* 図形と証明（三角形と四角形） 第14時：形を変えても面積が変わらないのは、どんなときだろう。
   元：授業ナビ標準版 sankaku-14（探：平行線と面積）。課題（ℓ∥BC のとき、△ABC と △PBC の面積をくらべる）を「今日の問い」に、台形の中の面積が等しい三角形（例題1）を「例題」に、
   「底辺が BC で、ℓ 上の点 P をとって、二等辺三角形 PBC をつくる」ことを、考えよう（演習プリント（7））にした。
   ・ワークシートは A4 1枚：問いは1つ（ℓ∥BC。BC＝5cm、ℓ と BC のあいだ 3cm の、印刷そのままの大きさの図）。個人3分 → ペア3分 → ことば → 例題（台形 ABCD の、面積が等しい三角形）。
   ・演習プリントは表裏：表＝確かめる 2問・使ってみる 4問（面積の計算・逆）／裏＝ひろげる（考えよう・答えなし）・チャレンジ★★（平行線を3回使う、等積変形の連鎖。ヒントカードつき）。
   ・図は、座標から描いた（今日の問い・（7）は、印刷そのままの大きさで、定規ではかれる）。面積・個数・面積の比は、checks で、座標（外積）から出しなおした。
   ・（7）の答え（二等辺三角形になる P は5個）は、紙面に載せていない（checks で確かめただけ）。
   検算：node tools/verify.cjs sankaku-14　／　見た目：node tools/check.cjs <出力先> sankaku-14 */
(function () {
  const { M, K, B, G, F, C2, T, HD, BR, WD, MA, TB, SVG, GEO } = IK.b;
  const J = JSON.stringify;
  const RAD = Math.PI / 180;

  const cap = (fig, text) => SVG((W, H, h) => h.tx(W / 2, 3.5, text, 3, 'middle', ' class="cap"') + `<g transform="translate(0 4.4)">${fig.svg(W, H - 4.4, h)}</g>`);
  const VL4 = { A: ['A', 135], B: ['B', 225], C: ['C', 315], D: ['D', 45] };

  // ---- 今日の問い：印刷そのままの大きさ（1cm＝10mm）。B(0,0)、C(5,0)、A(1.8,3)、P(9,3)（cm）。ℓ は y＝3 ----
  const TODAY = { B: [0, 0], C: [5, 0], A: [1.8, 3], P: [9, 3] };
  const todayFig = SVG((W, H, h) => {
    const bx = 36, by = H - 7, X = c => bx + c * 10, Y = c => by - c * 10;
    const pl = (x, y, t) => h.rich(x, y, t, 3.1, 'middle');
    let s = h.ln(8, Y(3), W - 8, Y(3), '#222', 0.3, ' stroke-linecap="round"') + h.rich(W - 8, Y(3) - 1.6, 'ℓ', 3.2, 'end');
    s += h.ln(X(0), Y(0), X(5), Y(0), '#222', 0.4, ' stroke-linecap="round"');
    s += h.ln(X(0), Y(0), X(1.8), Y(3), '#222', 0.4, ' stroke-linecap="round"') + h.ln(X(5), Y(0), X(1.8), Y(3), '#222', 0.4, ' stroke-linecap="round"');
    s += h.ln(X(0), Y(0), X(9), Y(3), '#222', 0.35, ' stroke-dasharray="1.6 1.1" stroke-linecap="round"') + h.ln(X(5), Y(0), X(9), Y(3), '#222', 0.35, ' stroke-dasharray="1.6 1.1" stroke-linecap="round"');
    [[0, 0, 'B', -3.2, 3.4], [5, 0, 'C', 3.2, 3.4], [1.8, 3, 'A', 0, -2.2], [9, 3, 'P', 0, -2.2]].forEach(([cx, cy, n, dx, dy]) => { s += `<circle cx="${h.f2(X(cx))}" cy="${h.f2(Y(cy))}" r="0.7" fill="#222"/>` + pl(X(cx) + dx, Y(cy) + dy + 1, n); });
    // BC＝5cm、ℓ と BC のあいだ＝3cm
    s += pl(X(2.5), Y(0) + 5.4, 'BC＝5cm');
    s += h.ln(X(-1.4), Y(0), X(-1.4), Y(3), '#222', 0.25) + h.ln(X(-1.4) - 1, Y(0), X(-1.4) + 1, Y(0), '#222', 0.25) + h.ln(X(-1.4) - 1, Y(3), X(-1.4) + 1, Y(3), '#222', 0.25);
    s += h.rich(X(-1.4) - 2.2, (Y(0) + Y(3)) / 2 + 1, '3cm', 3.1, 'end');
    return s;
  });

  // ---- 例題：台形 ABCD（AD∥BC）。O は対角線の交点 ----
  const T1 = { A: [1.2, 2.6], B: [0, 0], C: [4.8, 0], D: [3.6, 2.6] };
  const isect = (P, Q, R, S) => { const d = [Q[0] - P[0], Q[1] - P[1]], e = [S[0] - R[0], S[1] - R[1]], t = ((R[0] - P[0]) * e[1] - (R[1] - P[1]) * e[0]) / (d[0] * e[1] - d[1] * e[0]); return [P[0] + t * d[0], P[1] + t * d[1]]; };
  T1.O = isect(T1.A, T1.C, T1.B, T1.D);
  const trap = (P, o) => GEO(Object.assign({ pts: P, poly: 'ABCD', segs: ['AC', 'BD'], par: [['A', 'D', 1, 0.5], ['B', 'C', 1, 0.5]], vl: Object.assign({ O: ['O', 90, 3] }, VL4), pad: 6 }, o || {}));
  const trapFig = trap(T1);

  // ---- 図1（確かめる）：ℓ∥m。ℓ 上に A、P、Q、m 上に B、C ----
  const F1 = { A: [0.8, 2.6], P: [2.9, 2.6], Q: [5, 2.6], B: [1.2, 0], C: [4.2, 0], L0: [-0.2, 2.6], L1: [5.8, 2.6], M0: [-0.2, 0], M1: [5.8, 0] };
  const fig1 = cap(GEO({
    pts: F1, segs: [['L0', 'L1'], ['M0', 'M1'], 'AB', 'AC', 'BC', ['P', 'B', { dash: 1 }], ['P', 'C', { dash: 1 }], ['Q', 'B', { dash: 1 }], ['Q', 'C', { dash: 1 }]], dots: ['A', 'P', 'Q', 'B', 'C'], pad: 6,
    vl: { A: ['A', 90, 3.2], P: ['P', 90, 3.2], Q: ['Q', 90, 3.2], B: ['B', 270, 3.2], C: ['C', 270, 3.2] },
    txt: [{ p: 'L1', t: 'ℓ', dx: 3, dy: -1.5 }, { p: 'M1', t: 'm', dx: 3, dy: -1.5 }]
  }), '図1');
  // ---- 図2（確かめる・使ってみる）：台形 ABCD（AD＝2、BC＝5、高さ 2.4）。O は対角線の交点 ----
  const T2 = { A: [0.8, 2.4], B: [0, 0], C: [5, 0], D: [2.8, 2.4] };
  T2.O = isect(T2.A, T2.C, T2.B, T2.D);
  const fig2 = cap(trap(T2, { pad: 6 }), '図2');
  // ---- 図3：▱ABCD。辺 AD 上に点 P ----
  const T3 = { B: [0, 0], C: [4.4, 0], A: [1.1, 2.4] }; T3.D = [T3.A[0] + 4.4, T3.A[1]]; T3.P = [2.4, 2.4];
  const fig3 = cap(GEO({
    pts: T3, poly: 'ABCD', segs: ['PB', 'PC'], dots: ['P'], pad: 6,
    vl: { A: ['A', 135], B: ['B', 225], C: ['C', 315], D: ['D', 45], P: ['P', 90, 3.2] }
  }), '図3');

  // ---- （7）：印刷そのままの大きさ。B(0,0)、C(5,0)、ℓ は y＝3（cm）。答えは図にかかない ----
  const fig7 = SVG((W, H, h) => {
    const bx = 50, by = H - 7, X = c => bx + c * 10, Y = c => by - c * 10;
    const pl = (x, y, t) => h.rich(x, y, t, 3.1, 'middle');
    let s = h.ln(6, Y(3), W - 6, Y(3), '#222', 0.3, ' stroke-linecap="round"') + h.rich(W - 6, Y(3) - 1.6, 'ℓ', 3.2, 'end');
    s += h.ln(6, Y(0), W - 6, Y(0), '#222', 0.3, ' stroke-linecap="round"') + h.rich(W - 6, Y(0) - 1.6, 'BC を通る直線', 3.1, 'end');
    [[0, 'B', -3.2], [5, 'C', 3.2]].forEach(([cx, n, dx]) => { s += `<circle cx="${h.f2(X(cx))}" cy="${h.f2(Y(0))}" r="0.8" fill="#222"/>` + pl(X(cx) + dx, Y(0) + 5, n); });
    s += pl(X(2.5), Y(0) + 5.2, '5cm');
    s += h.ln(X(-4.6), Y(0), X(-4.6), Y(3), '#222', 0.25) + h.ln(X(-4.6) - 1, Y(0), X(-4.6) + 1, Y(0), '#222', 0.25) + h.ln(X(-4.6) - 1, Y(3), X(-4.6) + 1, Y(3), '#222', 0.25);
    s += h.rich(X(-4.6) + 2.2, (Y(0) + Y(3)) / 2 + 1, '3cm', 3.1, 'start');
    return s;
  });

  // ---- チャレンジ（8）：▱ABCD。E は BC 上、F は CD 上で、EF∥BD（CE：CB＝CF：CD＝2：5）----
  const T8 = { B: [0, 0], C: [4.6, 0] }; T8.A = [2.8 * Math.cos(68 * RAD), 2.8 * Math.sin(68 * RAD)]; T8.D = [T8.A[0] + 4.6, T8.A[1]];
  T8.E = [4.6 * 0.6, 0]; T8.F = [T8.C[0] + 0.4 * (T8.D[0] - T8.C[0]), 0.4 * T8.D[1]];
  const fig8 = GEO({
    pts: T8, poly: 'ABCD', segs: ['BD', 'AE', 'AF', 'DE', 'BF', 'EF'], dots: ['E', 'F'], pad: 6,
    vl: { A: ['A', 135], B: ['B', 225], C: ['C', 315], D: ['D', 45], E: ['E', 270, 3.2], F: ['F', 0, 3.2] },
    par: [['B', 'D', 1, 0.15], ['E', 'F', 1, 0.5]]
  });

  // 小テストの図：台形 ABCD（AD∥BC）。O は対角線の交点
  const TQ = { A: [1, 2.6], B: [0, 0], C: [4.6, 0], D: [3.2, 2.6] }; TQ.O = isect(TQ.A, TQ.C, TQ.B, TQ.D);
  const figQ = trap(TQ);

  /* ---- 検算の道具 ---- */
  const LIB = 'const v=(P,Q)=>[Q[0]-P[0],Q[1]-P[1]], cr=(u,w)=>u[0]*w[1]-u[1]*w[0], dot=(u,w)=>u[0]*w[0]+u[1]*w[1], len=(P,Q)=>Math.hypot(Q[0]-P[0],Q[1]-P[1]), z=x=>Math.abs(x)<1e-9, ar=(P,Q,R)=>Math.abs(cr(v(P,Q),v(P,R)))/2, '
    + 'ix=(P,Q,R,S)=>{ const d=v(P,Q),e=v(R,S),t=cr(v(P,R),e)/cr(d,e); return [P[0]+t*d[0],P[1]+t*d[1]]; }, '
    // 点の集まり Pt の中の、面積が target と等しい三角形（頂点の名前の組）をすべて出す
    + 'tri=(Pt,target)=>{ const n=Object.keys(Pt), out=[]; for(let i=0;i<n.length;i++)for(let j=i+1;j<n.length;j++)for(let k=j+1;k<n.length;k++){ const a=ar(Pt[n[i]],Pt[n[j]],Pt[n[k]]); if(a>1e-9&&Math.abs(a-target)<1e-9) out.push([n[i],n[j],n[k]].sort().join("")); } return out.sort().join(); };';

  IK.lesson('sankaku-14', {
    unit: 'sankaku', unitName: '図形と証明（三角形と四角形）', form: 'new', no: '第14時', title: '形を変えても面積が変わらないのは、どんなときだろう',
    summary: '辺 BC に平行な直線上で頂点を動かしても、三角形の面積が変わらないことを見つけ、理由を底辺と高さで説明する。台形・平行四辺形の中の、面積が等しい三角形を見つける。',
    head: '図形と証明　第14時',
    pitch: 8, dots: true,
    checks: [
      // 今日の問い：B(0,0)・C(5,0)・A(1.8,3)・P(9,3)（cm。ℓ は y＝3）。ℓ∥BC、△ABC と △PBC の面積は どちらも 5×3÷2＝7.5（外積で出しなおす）
      `(() => { ${LIB} const P=${J(TODAY)}; return near(ar(P.A,P.B,P.C),7.5) && near(ar(P.P,P.B,P.C),7.5) && z(cr(v(P.A,P.P),v(P.B,P.C))) && near(5*3/2,7.5); })()`,
      // 例題：台形 ABCD（AD∥BC）で △ABC＝△DBC、△ABO＝△DCO、△ABD＝△ACD。ほかに、△ABC と面積が等しい三角形は △BCD だけ、△ABO と等しい三角形は △CDO だけ
      `(() => { ${LIB} const P=${J(T1)}; return z(cr(v(P.A,P.D),v(P.B,P.C))) && near(ar(P.A,P.B,P.C),ar(P.D,P.B,P.C)) && near(ar(P.A,P.B,P.O),ar(P.D,P.C,P.O)) && near(ar(P.A,P.B,P.D),ar(P.A,P.C,P.D)) && tri(P,ar(P.A,P.B,P.C))==="ABC,BCD" && tri(P,ar(P.A,P.B,P.O))==="ABO,CDO"; })()`,
      // 例題 くふう：△ABC−△OBC＝△DBC−△OBC（共通の △OBC をひく）
      `(() => { ${LIB} const P=${J(T1)}; return near(ar(P.A,P.B,P.C)-ar(P.O,P.B,P.C), ar(P.A,P.B,P.O)) && near(ar(P.D,P.B,P.C)-ar(P.O,P.B,P.C), ar(P.D,P.C,P.O)); })()`,
      // （1）図1：ℓ∥m。△ABC と面積が等しい三角形は、△PBC と △QBC だけ
      `(() => { ${LIB} const P=${J(F1)}; const Pt={A:P.A,P:P.P,Q:P.Q,B:P.B,C:P.C}; return z(cr(v(P.A,P.Q),v(P.B,P.C))) && tri(Pt,ar(P.A,P.B,P.C))==="ABC,BCP,BCQ"; })()`,
      // （2）図2：台形（AD＝2、BC＝5）。△ABD と等しい三角形は △ACD だけ、△DCO と等しい三角形は △ABO だけ
      `(() => { ${LIB} const P=${J(T2)}; return z(cr(v(P.A,P.D),v(P.B,P.C))) && tri(P,ar(P.A,P.B,P.D))==="ABD,ACD" && tri(P,ar(P.D,P.C,P.O))==="ABO,CDO"; })()`,
      // （3）（4）図3：▱ABCD（面積 48）の AD 上の点 P で △PBC は半分の 24、△PAB＋△PCD も 24。△PAB＝9 のとき △PCD＝15（P を動かしても、いつも）
      `(() => { ${LIB} const P=${J(T3)}; const S=2*ar(P.A,P.B,P.C), k=48/S; return near(ar(P.P,P.B,P.C)*k,24) && near((ar(P.P,P.A,P.B)+ar(P.P,P.C,P.D))*k,24) && near(24-9,15) && [0.1,0.3,0.5,0.8].every(t=>{ const Q=[P.A[0]+t*(P.D[0]-P.A[0]),P.A[1]]; return near(ar(Q,P.B,P.C)*k,24) && near((ar(Q,P.A,P.B)+ar(Q,P.C,P.D))*k,24); }); })()`,
      // （5）図2：△ABO＝6、△OBC＝15（AO：OC＝AD：BC＝2：5 と同じ比）→ △ABC＝21＝△DBC、△DCO＝△DBC−△OBC＝6
      `(() => { ${LIB} const P=${J(T2)}, k=6/ar(P.A,P.B,P.O); return near(ar(P.O,P.B,P.C)*k,15) && near(ar(P.A,P.B,P.C)*k,21) && near(ar(P.D,P.B,P.C)*k,21) && near(ar(P.D,P.C,P.O)*k,6) && near(21-15,6); })()`,
      // （6）逆：BC を共通の底辺とし、A、D が BC の同じ側にあって △ABC＝△DBC ならば、AD∥BC（A、D の高さが等しい）
      `(() => { ${LIB} const B=[0,0],C=[6,0]; return [[1,3,7,3],[2,5,9,5],[-3,2,4,2]].every(([ax,ay,dx,dy])=>{ const A=[ax,ay],D=[dx,dy]; return near(ar(A,B,C),ar(D,B,C)) && z(cr(v(A,D),v(B,C))); }); })()`,
      // （7）考えよう（答えは紙面に載せない）：BC＝5、ℓ と BC のあいだ 3。ℓ 上で △PBC が二等辺三角形になる P は 5個（x＝−4、1、2.5、4、9）で、面積はどれも 7.5
      `(() => { ${LIB} const B=[0,0],C=[5,0],xs=[]; for(let i=-200;i<=300;i++){ const x=i/20, P=[x,3], a=len(P,B), b=len(P,C), c=5; if([Math.abs(a-b),Math.abs(a-c),Math.abs(b-c)].some(d=>d<1e-9)) xs.push(x); } return xs.join()==="-4,1,2.5,4,9" && xs.every(x=>near(ar([x,3],B,C),7.5)); })()`,
      // （8）図8：▱ABCD で EF∥BD。△ABE と面積が等しい三角形は、△BDE・△BDF・△ADF の3つだけ（AD∥BC、EF∥BD、AB∥DC を1つずつ使う）
      `(() => { ${LIB} const P=${J(T8)}; return z(cr(v(P.E,P.F),v(P.B,P.D))) && z(cr(v(P.A,P.D),v(P.B,P.C))) && z(cr(v(P.A,P.B),v(P.D,P.C))) && tri(P,ar(P.A,P.B,P.E))==="ABE,ADF,BDE,BDF" && near(ar(P.A,P.B,P.E),ar(P.B,P.D,P.E)) && near(ar(P.B,P.D,P.E),ar(P.B,P.D,P.F)) && near(ar(P.B,P.D,P.F),ar(P.A,P.D,P.F)); })()`,
      // 小テスト（1）〜（3）：台形 ABCD（AD∥BC）。△ABC＝△DBC、△ABD＝△ACD、△ABO＝△DCO（チャレンジ）　（4）BC＝6、高さ 4 の △PBC は 6×4÷2＝12
      `(() => { ${LIB} const P=${J(TQ)}; return z(cr(v(P.A,P.D),v(P.B,P.C))) && tri(P,ar(P.A,P.B,P.C))==="ABC,BCD" && tri(P,ar(P.A,P.B,P.D))==="ABD,ACD" && near(ar(P.A,P.B,P.O),ar(P.D,P.C,P.O)) && near(ar([0,0],[6,0],[3,4]),12); })()`
    ],

    /* ================= ワークシート（A4 1枚・約12分） ================= */
    ws: [
      M('平行線と面積の関係を、見つけよう'),
      K('今日の問い', '図の ℓ は、辺 BC と平行である。頂点 A を、ℓ 上の点 P まで動かして、△PBC をつくる。△ABC と △PBC の面積を、くらべよう。', 2),
      F(6, todayFig),
      T('①', '自分の考え（3分）　面積をくらべて、わかったことを書こう。', 1),
      B(3, '（例）どちらも、底辺は BC＝5cm、高さは 3cm\n面積は 5×3÷2＝7.5（cm^2）で、等しい。\nℓ∥BC だから、A も P も、BC までのきょりが同じ。'),
      T('②', 'ペアの考え（3分）　P を ℓ 上のほかの場所にとっても、同じだろうか。', 1),
      B(3, ''),
      G(1),
      WD('平行線の間のきょりは、どこでも{{等しい}}。\n△ABC＝△PBC は、{{面積}}が等しいことを表す。\n面積を変えずに形を変えることを{{等積変形}}という。\nℓ∥BC ならば、△ABC＝△{{PBC}}（底辺が共通）', 4, { label: 'ことば（教科書で調べよう）' }),
      G(1),
      C2([
        K('例題', '台形 ABCD は AD∥BC で、O は対角線の交点である。\n（1）△ABC と面積が等しい三角形は、△{{DBC}}\n（2）△ABO と面積が等しい三角形は、△{{DCO}}', 5)
      ], [
        F(5, trapFig)
      ], '2:1'),
      T('', '【考え方のくふう】△ABO と △DCO は、底辺も高さも同じではない。どう考えよう。', 2),
      B(3, '△ABC＝△DBC の両方から、共通の △OBC をひくと\n△ABC−△OBC＝△DBC−△OBC\nしたがって　△ABO＝△DCO')
    ],

    /* ================= 演習プリント（A4 表裏） ================= */
    dr: [
      HD('確かめる', 'ことばと、基本をたしかめよう。'),
      WD('① 平行線の間のきょりは、どこでも{{等しい}}。\n② 底辺が共通で、頂点が底辺に{{平行}}な直線上の三角形は、{{面積}}が等しい。\n③ 面積を変えずに形を変えることを{{等積変形}}という。\n④ 三角形の面積は、{{底辺}}×{{高さ}}÷2 で求める。', 4, { label: 'ことば' }),
      F(5, fig1, fig2, fig3),
      C2([
        T('（1）', '図1で、ℓ∥m である。△ABC と面積が等しい三角形を、すべて答えよう。', 2),
        B(2, '△PBC、△QBC')
      ], [
        T('（2）', '図2の台形 ABCD は AD∥BC である。△ABD と △DCO に面積が等しい三角形を、それぞれ答えよう。', 3),
        B(2, '△ABD … △ACD\n△DCO … △ABO')
      ], '1:1'),
      MA('【説明】△ABC と △PBC の面積が等しいわけを、隣の人に説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      G(1),
      HD('使ってみる', '面積が等しい三角形を使って、面積を求めよう。'),
      C2([
        T('（3）', '図3の ▱ABCD の面積は 48cm^2 である。△PBC の面積を求めよう。', 2),
        B(3, '△PBC＝△ABC（AD∥BC）\n△ABC は ▱ABCD の半分だから\n48÷2＝24（cm^2）')
      ], [
        T('（4）', '図3で、△PAB の面積が 9cm^2 のとき、△PCD の面積を求めよう。', 2),
        B(3, '△PAB＋△PCD は、▱ABCD から △PBC をひいた残り\n48−24−9＝15（cm^2）')
      ], '1:1'),
      C2([
        T('（5）', '図2で、△ABO＝6cm^2、△OBC＝15cm^2 のとき、△DBC と △DCO の面積を求めよう。', 3),
        B(2, '△DBC＝6+15＝21（cm^2）\n△DCO＝21−15＝6（cm^2）')
      ], [
        T('（6）', '△ABC と △DBC は底辺 BC が共通で、面積が等しい。A、D は BC の同じ側にある。AD と BC は、どんな関係か。', 4),
        B(2, 'AD∥BC\n高さが等しく、同じ側にあるから')
      ], '1:1'),
      G(1),
      T('', '★ ここまでできたら、今日の合格！　　合格 ☐', 1),
      BR(),

      HD('ひろげる', '考えよう：ℓ 上の点 P を、いろいろな場所にとってみよう。'),
      T('（7）', '図の ℓ∥BC である（BC＝5cm、ℓ と BC のあいだは 3cm）。ℓ 上に点 P をとって、△PBC が二等辺三角形になるようにしたい。P を、できるだけ多く見つけて、図にかきこもう。（コンパスを使ってよい）', 3),
      F(6, fig7),
      C2([
        T('', '見つけた P の数と、△PBC の面積', 1),
        B(6, '')
      ], [
        T('', '気づいたこと', 1),
        B(6, '')
      ], '1:1'),
      G(1),
      HD('チャレンジ★★', '入試にも出る問題。ヒントカードを見てもOK。'),
      C2([
        T('（8）', '図の ▱ABCD で、辺 BC、CD 上の点 E、F は EF∥BD である。△ABE と面積が等しい三角形を、すべて答えよう。使った平行線も書こう。', 5),
        B(6, '△BDE … AD∥BC（底辺 BE が共通）\n△BDF … EF∥BD（底辺 BD が共通）\n△ADF … AB∥DC（底辺 DF が共通）')
      ], [
        F(6, fig8),
        MA('① △ABE と △BDE は、どの辺が共通かな。\n② 面積が等しい三角形を、順につないでいこう。', 5, { label: 'ヒントカード' })
      ], '1:1')
    ],

    /* ================= 小テスト（A4 1枚・5分・10点満点） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      C2([
        T('（1）', '右の図の台形 ABCD は AD∥BC で、O は対角線の交点である。△ABC と面積が等しい三角形を答えよう。（2点）', 4),
        B(1, '△DBC'),
        T('（2）', '△ABD と面積が等しい三角形を答えよう。（2点）', 2),
        B(1, '△ACD'),
        T('（3）', '（1）で、面積が等しいといえるわけを書こう。（3点）', 2),
        B(3, '底辺 BC が共通で、AD∥BC だから、高さが等しい。')
      ], [
        F(8, figQ)
      ], '3:2'),
      T('（4）', '底辺 BC＝6cm の △ABC がある。A を通り BC に平行な直線 ℓ 上に点 P をとる。ℓ と BC のあいだが 4cm のとき、△PBC の面積を求めよう。（3点）', 3),
      B(2, '底辺 6cm、高さ 4cm だから　6×4÷2＝12（cm^2）'),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      T('（5）', '上の台形で、△ABO と △DCO の面積が等しいわけを説明しよう。', 2),
      B(4, '△ABC＝△DBC の両方から、共通の △OBC をひくと\n△ABC−△OBC＝△DBC−△OBC\nだから　△ABO＝△DCO')
    ]
  });
})();
