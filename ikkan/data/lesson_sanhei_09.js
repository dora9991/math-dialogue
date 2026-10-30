/* 三平方の定理 第9時：円錐や角錐の高さと体積を、直角三角形で求めよう。
   元：授業ナビ標準版 sanhei-09（例）。円錐の高さ（例題1）を「今日の問い」に、正四角錐の高さ・体積（例題2）を「例題」に、
   「母線の長さが同じ円錐で、底面の半径を変えると体積はどうなるか」を考えよう（演習プリント（7））にした。
   （元の考える問い「正四角錐の表面積」は、答えが小テストのチャレンジで出るので、考えようにしなかった。）
   ・ワークシートは A4 1枚：問いは1つ（円錐の体積に足りない高さを、どう求めるか）。個人3分 → ペア3分 → ことば → 例題（正四角錐の高さと体積）。
   ・演習プリントは表裏：表＝確かめる 2問・使ってみる 4問／裏＝ひろげる（考えよう・答えなし）・チャレンジ★★（正四面体の高さと体積。ヒントカードつき）。
   ・数値は新しく作り、答えは checks で、座標（hypot）と、四面体の体積の行列式・円錐の積分から出しなおした。
   検算：node tools/verify.cjs sanhei-09　／　見た目：node tools/check.cjs <出力先> sanhei-09 */
(function () {
  const { M, K, B, G, F, C2, T, HD, BR, WD, MA, TB, SVG } = IK.b;
  const RED = '#d62828';
  const dashA = ' stroke-dasharray="1.2 0.9"';

  /* 円錐の見取図：頂点 A、底面の中心 O、円周上の点 B（母線 AB が右のふち）。
     o.r・o.h：図の形をきめる本当の長さ　o.dim：{ r, l, h } 長さの字　o.ansH：解答のときだけ出す（直角三角形 AOB を赤く、直角のしるし、高さの字） */
  const coneAOB = o => SVG((W, H, h) => {
    const r = o.r, ht = o.h, q = 0.3, t1 = Math.asin(q * r / ht);
    const padL = 12, padR = 22, padT = 8, padB = 6;
    const s = Math.min((W - padL - padR) / (2 * r), (H - padT - padB) / (ht + q * r));
    const cx = padL + (W - padL - padR) / 2, cy0 = H - padB - q * r * s;
    const E = (t, z) => [cx + r * Math.cos(t) * s, cy0 - (z + q * r * Math.sin(t)) * s];
    const arc = (t0, t1b, dash) => { const p = []; for (let k = 0; k <= 60; k++) p.push(E(t0 + (t1b - t0) * k / 60, 0)); return `<polyline points="${p.map(a => h.f2(a[0]) + ',' + h.f2(a[1])).join(' ')}" fill="none" stroke="#222" stroke-width="${dash ? 0.22 : 0.32}"${dash ? dashA : ''}/>`; };
    const A = [cx, cy0 - ht * s], O = [cx, cy0], PR = E(t1, 0), PL = E(Math.PI - t1, 0);
    let out = arc(Math.PI - t1, 2 * Math.PI + t1, false) + arc(t1, Math.PI - t1, true);
    out += h.ln(A[0], A[1], PR[0], PR[1], '#222', 0.32, ' stroke-linecap="round"') + h.ln(A[0], A[1], PL[0], PL[1], '#222', 0.32, ' stroke-linecap="round"');
    out += h.ln(A[0], A[1], O[0], O[1], '#222', 0.22, dashA) + h.ln(O[0], O[1], PR[0], PR[1], '#222', 0.22, dashA);
    [A, O, PR].forEach(p => { out += `<circle cx="${h.f2(p[0])}" cy="${h.f2(p[1])}" r="0.55" fill="#222"/>`; });
    out += h.tx(A[0], A[1] - 2.4, 'A', 3.1, 'middle', ' class="pl"') + h.tx(O[0] - 3.4, O[1] + 3.4, 'O', 3.1, 'middle', ' class="pl"') + h.tx(PR[0] + 2.4, PR[1] + 3.4, 'B', 3.1, 'start', ' class="pl"');
    const d = o.dim || {};
    if (d.l) out += h.rich((A[0] + PR[0]) / 2 + 2.2, (A[1] + PR[1]) / 2 + 0.6, d.l, 2.9, 'start');
    if (d.r) out += h.rich((O[0] + PR[0]) / 2, O[1] - 1.8, d.r, 2.9, 'middle');
    if (d.h) out += h.rich(A[0] - 1.8, (A[1] + O[1]) / 2 + 1, d.h, 2.9, 'end');
    if (o.ansH) {
      let a = `<polygon points="${[A, O, PR].map(p => h.f2(p[0]) + ',' + h.f2(p[1])).join(' ')}" fill="none" stroke="${RED}" stroke-width="0.55" stroke-linejoin="round"/>`;
      a += `<polyline points="${h.f2(O[0])},${h.f2(O[1] - 2.6)} ${h.f2(O[0] + 2.6)},${h.f2(O[1] - 2.6)} ${h.f2(O[0] + 2.6)},${h.f2(O[1])}" fill="none" stroke="${RED}" stroke-width="0.3"/>`;
      a += h.tx(A[0] + 1.8, (A[1] + O[1]) / 2 + 1, o.ansH, 2.9, 'start');
      out += h.ans(a);
    }
    return out;
  });

  /* 立体の見取図（ななめ投影。手前の面がゆがまない）。凸の立体。かくれた辺は点線。
     V：頂点 [x,y,z]（y が奥行き、z が高さ）／ F：面（頂点の番号）／ nm：頂点の字（V と同じ順）／ nd：{ 字: [dx, dy] }（字を置く向き。画面で、y は下向き）
     dims：[{ a, b, t, n }] 辺 a-b の長さの字／ segs：[{ p, q, dash, c, w }]／ txt：[{ p, t, dx, dy, anchor }]（p は3次元の点）／ dots：[{ p, t, d }]
     ans：{ segs, txt }（解答のときだけ出る赤）／ pad：余白 mm */
  const obl = (o, fo) => SVG((W, H, h) => {
    const ph = 35 * Math.PI / 180, kc = 0.5 * Math.cos(ph), ks = 0.5 * Math.sin(ph);
    const P = p => [p[0] + kc * p[1], p[2] + ks * p[1]];
    const dot = (p, q) => p[0] * q[0] + p[1] * q[1] + p[2] * q[2], sub = (p, q) => [p[0] - q[0], p[1] - q[1], p[2] - q[2]];
    const cross = (p, q) => [p[1] * q[2] - p[2] * q[1], p[2] * q[0] - p[0] * q[2], p[0] * q[1] - p[1] * q[0]];
    const mean = A => A.reduce((s, p) => [s[0] + p[0] / A.length, s[1] + p[1] / A.length, s[2] + p[2] / A.length], [0, 0, 0]);
    const V = o.V, S = V.map(P), cen = mean(V), toV = [kc, -1, ks];
    const front = o.F.map(f => { const Q = f.map(i => V[i]); let n = cross(sub(Q[1], Q[0]), sub(Q[2], Q[0])); if (dot(n, sub(mean(Q), cen)) < 0) n = n.map(v => -v); return dot(n, toV) > 1e-9; });
    const E = new Map();
    o.F.forEach((f, fi) => f.forEach((v, k) => { const w = f[(k + 1) % f.length], key = Math.min(v, w) + '-' + Math.max(v, w); if (!E.has(key)) E.set(key, { i: Math.min(v, w), j: Math.max(v, w), f: [] }); E.get(key).f.push(fi); }));
    const edges = [...E.values()].map(e => Object.assign(e, { hidden: !e.f.some(fi => front[fi]) }));
    const sg = l => (l || []).map(s => ({ a: P(s.p), b: P(s.q), dash: s.dash, c: s.c, w: s.w }));
    const segs = sg(o.segs), asegs = sg((o.ans || {}).segs);
    const all = [...S, ...segs.flatMap(s => [s.a, s.b]), ...asegs.flatMap(s => [s.a, s.b]), ...(o.dots || []).map(d => P(d.p))];
    const x0 = Math.min(...all.map(p => p[0])), x1 = Math.max(...all.map(p => p[0])), y0 = Math.min(...all.map(p => p[1])), y1 = Math.max(...all.map(p => p[1]));
    const pd = Array.isArray(o.pad) ? o.pad : [o.pad || 8, o.pad || 8, o.pad || 8, o.pad || 8];
    const k = Math.min((W - pd[0] - pd[2]) / (x1 - x0), (H - pd[1] - pd[3]) / (y1 - y0));
    const ox = pd[0] + (W - pd[0] - pd[2] - (x1 - x0) * k) / 2 - x0 * k, oy = pd[1] + (H - pd[1] - pd[3] - (y1 - y0) * k) / 2 + y1 * k;
    const X = p => ox + p[0] * k, Y = p => oy - p[1] * k, cs = [X(mean(S)), Y(mean(S))];
    let out = '';
    edges.filter(e => e.hidden).forEach(e => { out += h.ln(X(S[e.i]), Y(S[e.i]), X(S[e.j]), Y(S[e.j]), '#555', 0.22, dashA); });
    edges.filter(e => !e.hidden).forEach(e => { out += h.ln(X(S[e.i]), Y(S[e.i]), X(S[e.j]), Y(S[e.j]), '#222', 0.34, ' stroke-linecap="round"'); });
    segs.forEach(s => { out += h.ln(X(s.a), Y(s.a), X(s.b), Y(s.b), s.c || '#222', s.w || 0.22, s.dash ? dashA : ' stroke-linecap="round"'); });
    (o.dots || []).forEach(d => {
      const p = P(d.p); out += `<circle cx="${h.f2(X(p))}" cy="${h.f2(Y(p))}" r="0.65" fill="#222"/>`;
      if (d.t) { const n = d.d || [1, 1], L = Math.hypot(n[0], n[1]); out += h.tx(X(p) + n[0] / L * 2.8, Y(p) + n[1] / L * 2.8 + 1.1, d.t, 3.1, Math.abs(n[0] / L) < 0.3 ? 'middle' : n[0] > 0 ? 'start' : 'end', ' class="pl"'); }
    });
    (o.nm || []).forEach((nm, i) => {   // 頂点の字：図の中心から外がわへ
      let n = (o.nd && o.nd[nm]) || [X(S[i]) - cs[0], Y(S[i]) - cs[1]]; const L = Math.hypot(n[0], n[1]) || 1; n = [n[0] / L, n[1] / L];
      out += h.tx(X(S[i]) + n[0] * 3, Y(S[i]) + n[1] * 3 + 1.1, nm, 3.1, Math.abs(n[0]) < 0.3 ? 'middle' : n[0] > 0 ? 'start' : 'end', ' class="pl"');
    });
    (o.dims || []).forEach(d => {
      const p = S[d.a], q = S[d.b], mx = (X(p) + X(q)) / 2, my = (Y(p) + Y(q)) / 2;
      let n = d.n;
      if (!n) { n = [-(Y(q) - Y(p)), X(q) - X(p)]; const L = Math.hypot(n[0], n[1]) || 1; n = [n[0] / L, n[1] / L]; if (n[0] * (mx - cs[0]) + n[1] * (my - cs[1]) < 0) n = [-n[0], -n[1]]; }
      out += h.rich(mx + n[0] * 3, my + n[1] * 3 + 1, d.t, 2.9, Math.abs(n[0]) < 0.4 ? 'middle' : n[0] > 0 ? 'start' : 'end');
    });
    const tx = l => (l || []).map(t => { const p = P(t.p); return h.rich(X(p) + (t.dx || 0), Y(p) + (t.dy || 0) + 1, t.t, 2.9, t.anchor || 'middle'); }).join('');
    out += tx(o.txt);
    const an = (o.ans || {});
    if (asegs.length || (an.txt || []).length) out += h.ans(asegs.map(s => h.ln(X(s.a), Y(s.a), X(s.b), Y(s.b), RED, s.w || 0.5, s.dash ? dashA : ' stroke-linecap="round"')).join('') + tx(an.txt));
    return out;
  }, fo);

  // 正四角錐 O−ABCD（底面の1辺 a、高さ ht）の頂点の座標・面
  const pyr = (a, ht) => ({ V: [[0, 0, 0], [a, 0, 0], [a, a, 0], [0, a, 0], [a / 2, a / 2, ht]], F: [[0, 1, 2, 3], [0, 1, 4], [1, 2, 4], [2, 3, 4], [3, 0, 4]], nm: ['A', 'B', 'C', 'D', 'O'] });

  // 例題の図：正四角錐 O−ABCD（底面 6cm、OA＝9cm、高さ OH＝3√7）。解答では、AH（対角線の半分）を赤くかく
  const pyr1 = (() => {
    const a = 6, ht = 3 * Math.sqrt(7), p = pyr(a, ht);
    return obl(Object.assign(p, {
      nd: { O: [0, -1], A: [-1, 0.6], B: [1, 0.6], C: [1, -0.5], D: [-0.6, -1] }, pad: [12, 8, 10, 8],
      segs: [{ p: [a / 2, a / 2, ht], q: [a / 2, a / 2, 0], dash: true }], dots: [{ p: [a / 2, a / 2, 0], t: 'H', d: [0.8, 1] }],
      dims: [{ a: 0, b: 1, t: '{{6}}cm' }, { a: 0, b: 4, t: '{{9}}cm', n: [-1, 0] }],
      txt: [{ p: [a / 2, a / 2, ht / 2], t: 'h', dx: 2.2, anchor: 'start' }],
      ans: { segs: [{ p: [0, 0, 0], q: [a / 2, a / 2, 0], w: 0.6 }], txt: [{ p: [a / 4, a / 4, 0], t: '3√2cm', dx: -1, dy: 5.5, anchor: 'middle' }, { p: [a / 2, a / 2, ht * 0.28], t: '3√7cm', dx: 2.2, anchor: 'start' }] }
    }));
  })();

  // チャレンジ（8）の図：1辺 6cm の正四面体 O−ABC。H は O から底面にひいた垂線の足
  const tetra = (() => {
    const a = 6, c = [3, Math.sqrt(3), 0], ht = 2 * Math.sqrt(6);
    return obl({
      V: [[0, 0, 0], [a, 0, 0], [a / 2, a * Math.sqrt(3) / 2, 0], [a / 2, Math.sqrt(3), ht]], F: [[0, 1, 2], [0, 1, 3], [1, 2, 3], [2, 0, 3]], nm: ['A', 'B', 'C', 'O'],
      nd: { A: [-1, 0.6], B: [1, 0.6], C: [0.8, -0.6], O: [0, -1] }, pad: [12, 10, 12, 8],
      segs: [{ p: [a / 2, Math.sqrt(3), ht], q: c, dash: true }], dots: [{ p: c, t: 'H', d: [1, 1] }]
    });
  })();

  // 検算の道具（checks の式の先頭にそえる）：hyp＝2点の間のきょり、tet＝4点でできる四面体の体積（行列式）、tri＝三角形の面積（外積）、coneV＝円錐の体積（シンプソンの公式）
  const LIB = 'const sub=(p,q)=>p.map((v,i)=>v-q[i]), hyp=(p,q)=>Math.hypot(...sub(p,q)), cr=(u,w)=>[u[1]*w[2]-u[2]*w[1],u[2]*w[0]-u[0]*w[2],u[0]*w[1]-u[1]*w[0]], det3=(u,v,w)=>u[0]*(v[1]*w[2]-v[2]*w[1])-u[1]*(v[0]*w[2]-v[2]*w[0])+u[2]*(v[0]*w[1]-v[1]*w[0]), tet=(a,b,c,d)=>Math.abs(det3(sub(b,a),sub(c,a),sub(d,a)))/6, tri=(a,b,c)=>Math.hypot(...cr(sub(b,a),sub(c,a)))/2, coneV=(r,h,n=200)=>{ let s=0; for(let i=0;i<=n;i++){ const z=h*i/n, rr=r*(1-z/h), w=(i===0||i===n)?1:(i%2?4:2); s+=w*Math.PI*rr*rr; } return s*(h/n)/3; }, sq=Math.sqrt, pyrV=(O,A,B,C,D)=>tet(O,A,B,C)+tet(O,A,C,D);';
  const C = body => `(() => { ${LIB} ${body} })()`;

  IK.lesson('sanhei-09', {
    unit: 'sanhei', unitName: '三平方の定理', form: 'new', no: '第9時', title: '円錐や角錐の高さと体積を、直角三角形で求めよう',
    summary: '円錐の高さは、母線・半径・高さがつくる直角三角形で、正四角錐の高さは、頂点の真下が底面の対角線の交点であることから、三平方の定理で求める。高さがわかれば、体積が求められる。',
    head: '三平方の定理　第9時',
    pitch: 8, dots: true,
    checks: [
      // 今日の問い：円錐（頂点 A(0,0,2√10)、底面の円周上の点 B(3,0,0)）。AB＝7（母線）、体積 [[1/3]]π×3^2×2√10＝6√10π（シンプソンの公式でも）
      C('const A=[0,0,2*sq(10)], B=[3,0,0]; return near(hyp(A,B),7) && near(hyp(A,[0,0,0]),2*sq(10)) && near(coneV(3,A[2]),6*sq(10)*PI);'),
      // 例題：正四角錐 O−ABCD（底面 1辺 6、O(3,3,3√7)）。OA＝OB＝OC＝OD＝9、AC＝6√2、AH＝3√2、体積 36√7（四面体2つの体積の和でも）
      C('const a=6, A=[0,0,0], B=[a,0,0], C=[a,a,0], D=[0,a,0], H=[3,3,0], O=[3,3,3*sq(7)]; return [A,B,C,D].every(p=>near(hyp(O,p),9)) && near(hyp(A,C),6*sq(2)) && near(hyp(A,H),3*sq(2)) && near(pyrV(O,A,B,C,D),36*sq(7));'),
      // 確かめる（1）母線 13・半径 5 → 高さ 12　（2）1辺 8 の正方形の対角線 8√2、その半分 4√2
      C('return near(hyp([0,0,12],[5,0,0]),13) && near(hyp([0,0,0],[8,8,0]),8*sq(2)) && near(hyp([0,0,0],[4,4,0]),4*sq(2));'),
      // （3）半径 3・母線 6 → 高さ 3√3、体積 9√3π　（4）半径 4・高さ 6 → 母線 2√13、体積 32π
      C('return near(hyp([0,0,3*sq(3)],[3,0,0]),6) && near(coneV(3,3*sq(3)),9*sq(3)*PI) && near(hyp([0,0,6],[4,0,0]),2*sq(13)) && near(coneV(4,6),32*PI);'),
      // （5）底面 8・高さ 6：OA＝2√17、体積 128　（6）底面 10・OA＝15：高さ 5√7、体積 500√7/3
      C('const A=[0,0,0], B=[8,0,0], C=[8,8,0], D=[0,8,0], O=[4,4,6]; return near(hyp(O,A),2*sq(17)) && near(pyrV(O,A,B,C,D),128);'),
      C('const A=[0,0,0], B=[10,0,0], C=[10,10,0], D=[0,10,0], O=[5,5,5*sq(7)]; return [A,B,C,D].every(p=>near(hyp(O,p),15)) && near(pyrV(O,A,B,C,D),500*sq(7)/3);'),
      // （7）考えよう（答えは紙面に載せない）：母線 25 の円錐で、半径 7・15・20・24 の高さは 24・20・15・7（整数）、体積÷π は 392・1500・2000・1344。半径が大きいほど体積が大きいとは限らない（最大は半径 25√(2/3)＝20.4… のあたり）
      C('const t=[[7,24],[15,20],[20,15],[24,7]]; const best=Array.from({length:2500},(_,i)=>0.01*(i+1)).map(r=>[r*r*sq(625-r*r)/3,r]).sort((p,q)=>q[0]-p[0])[0]; return t.every(([r,h])=>near(hyp([0,0,h],[r,0,0]),25)) && t.map(([r,h])=>Math.round(coneV(r,h)/PI)).join()==="392,1500,2000,1344" && Math.abs(best[1]-25*sq(2/3))<0.02 && best[0]>2000 && 2000>1500 && 1500>1344 && 392<1344;'),
      // （8）1辺 6 の正四面体：A(0,0,0) B(6,0,0) C(3,3√3,0) O(3,√3,2√6)。辺はすべて 6、AH＝2√3（H は底面の重心）、高さ 2√6、体積 18√2
      C('const A=[0,0,0], B=[6,0,0], Cc=[3,3*sq(3),0], H=[3,sq(3),0], O=[3,sq(3),2*sq(6)]; return [[A,B],[B,Cc],[Cc,A],[O,A],[O,B],[O,Cc]].every(([p,q])=>near(hyp(p,q),6)) && near(hyp(A,H),2*sq(3)) && near(hyp(B,H),2*sq(3)) && near(hyp(Cc,H),2*sq(3)) && near(hyp(O,H),2*sq(6)) && near(tet(O,A,B,Cc),18*sq(2));'),
      // 小テスト（1）半径 4・母線 5 → 高さ 3、体積 16π　（2）1辺 6 の正方形の対角線 6√2、その半分 3√2　（4）半径 6・高さ 8 → 母線 10
      C('return near(hyp([0,0,3],[4,0,0]),5) && near(coneV(4,3),16*PI) && near(hyp([0,0,0],[6,6,0]),6*sq(2)) && near(hyp([0,0,0],[3,3,0]),3*sq(2)) && near(hyp([0,0,8],[6,0,0]),10);'),
      // 小テスト（3）底面 6・OA＝6：高さ 3√2、体積 36√2　（5）チャレンジ：底面 6・OA＝7：側面の三角形の高さ 2√10、表面積 36+24√10（4つの三角形の面積を外積で）
      C('const A=[0,0,0], B=[6,0,0], Cc=[6,6,0], D=[0,6,0], O=[3,3,3*sq(2)]; return [A,B,Cc,D].every(p=>near(hyp(O,p),6)) && near(pyrV(O,A,B,Cc,D),36*sq(2));'),
      C('const A=[0,0,0], B=[6,0,0], Cc=[6,6,0], D=[0,6,0], O=[3,3,sq(31)]; return [A,B,Cc,D].every(p=>near(hyp(O,p),7)) && near(hyp(O,[3,0,0]),2*sq(10)) && near(36+tri(O,A,B)+tri(O,B,Cc)+tri(O,Cc,D)+tri(O,D,A),36+24*sq(10));')
    ],

    /* ================= ワークシート（A4 1枚・約12分） ================= */
    ws: [
      M('円錐や角錐の高さを求めて、体積を求めよう'),
      C2([
        K('今日の問い', '底面の半径が 3cm、母線の長さが 7cm の円錐がある。体積を求めるために足りない長さを、どうすれば求められるだろう。', 4),
        T('①', '自分の考え（3分）　足りない長さと、その求め方を書こう。', 2),
        B(5, '（例）体積＝[[1/3]]×底面積×高さ\n足りないのは高さ AO。\n△AOB は、∠AOB＝90° の直角三角形\n（斜辺は母線 AB）。AO^2＝7^2−3^2＝40\nAO＝2√{10}　体積 6√{10}π（cm^3）')
      ], [
        F(10, coneAOB({ r: 3, h: 2 * Math.sqrt(10), dim: { r: '3cm', l: '7cm', h: 'h' }, ansH: '2√10cm' }))
      ], '1:1'),
      T('②', 'ペアの考え（3分）　自分とちがう考えを書こう。', 1),
      B(2, ''),
      G(1),
      WD('円錐の高さ … 母線が斜辺の{{直角三角形}}で求める\n正四角錐の頂点の真下 … 底面の{{対角線}}の交点\n錐体の体積＝[[1/3]]×{{底面積}}×{{高さ}}\n1辺 a の正方形の対角線 … {{√{2} }}a', 4, { label: 'ことば（教科書で調べよう）' }),
      G(1),
      C2([
        K('例題', '底面が 1辺 {{6}}cm の正方形で、OA、OB、OC、OD が {{9}}cm の正四角錐 O−ABCD の、高さと体積を求めよう。', 4),
        T('', '【高さのくふう】頂点 O の真下の点 H は、底面のどこか。', 2),
        B(5, '底面の対角線の交点が H。\nAC＝6√{2}　AH＝3√{2}\n△OAH で　OH^2＝9^2−(3√{2})^2＝63\nOH＝3√{7}\n体積 [[1/3]]×6^2×3√{7}＝36√{7}')
      ], [
        F(11, pyr1)
      ], '3:2')
    ],

    /* ================= 演習プリント（A4 表裏） ================= */
    dr: [
      HD('確かめる', 'ことばと、基本をたしかめよう。'),
      WD('① 円錐の高さは、母線を斜辺とする{{直角三角形}}で求める。\n② 正四角錐の頂点の真下の点は、底面の{{対角線}}の交点である。\n③ 角錐・円錐の体積＝[[1/3]]×{{底面積}}×{{高さ}}\n④ 1辺 a の正方形の対角線の長さは {{√{2} }}a である。', 4, { label: 'ことば' }),
      C2([
        T('（1）', '底面の半径が 5cm、母線の長さが 13cm の円錐の高さを求めよう。', 3),
        B(3, 'h^2＝13^2−5^2＝144\nh＝12（cm）')
      ], [
        T('（2）', '1辺が 8cm の正方形の、対角線の長さと、その半分の長さを求めよう。', 3),
        B(3, '対角線　8√{2}cm\n半分　4√{2}cm')
      ], '1:1'),
      MA('【説明】円錐の高さを求めるとき、どの三角形のどの辺を使うか、隣の人に説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      G(1),
      HD('使ってみる', '直角三角形を見つけて、高さと体積を求めよう。'),
      C2([
        T('（3）', '底面の半径が 3cm、母線の長さが 6cm の円錐の、高さと体積を求めよう。', 3),
        B(4, 'h^2＝6^2−3^2＝27\nh＝3√{3}（cm）\n体積 [[1/3]]×π×3^2×3√{3}\n＝9√{3}π（cm^3）')
      ], [
        T('（4）', '底面の半径が 4cm、高さが 6cm の円錐の、母線の長さと体積を求めよう。', 3),
        B(4, 'l^2＝4^2+6^2＝52\nl＝2√{13}（cm）\n体積 [[1/3]]×π×4^2×6\n＝32π（cm^3）')
      ], '1:1'),
      C2([
        T('（5）', '底面が 1辺 8cm の正方形で、高さが 6cm の正四角錐 O−ABCD の、辺 OA の長さと体積を求めよう。', 4),
        B(5, 'AH＝4√{2}\nOA^2＝(4√{2})^2+6^2＝68\nOA＝2√{17}（cm）\n体積 [[1/3]]×8^2×6\n＝128（cm^3）')
      ], [
        T('（6）', '底面が 1辺 10cm の正方形で、OA＝OB＝OC＝OD＝15cm の正四角錐 O−ABCD の、高さと体積を求めよう。', 4),
        B(5, 'AH＝5√{2}\nOH^2＝15^2−(5√{2})^2＝175\nOH＝5√{7}（cm）\n体積 [[1/3]]×10^2×5√{7}\n＝[[500√{7}/3]]（cm^3）')
      ], '1:1'),
      G(1),
      T('', '★ ここまでできたら、今日の合格！　　合格 ☐', 1),
      BR(),

      HD('ひろげる', '考えよう：母線の長さが同じ円錐で、体積をくらべよう。'),
      T('（7）', '母線の長さが 25cm の円錐で、底面の半径 r を変えると、高さ h と体積はどうなるだろう。表を完成させて、気づいたことを書こう。', 3),
      TB('底面の半径 r（cm）', ['7', '15', '20', '24'], [
        ['高さ h（cm）', ['', '', '', '']],
        ['体積÷π（cm^3）', ['', '', '', '']]
      ], { hw: 46 }),
      C2([
        T('', '気づいたこと', 1),
        B(7, '')
      ], [
        T('', '体積がいちばん大きくなりそうな半径を、予想しよう。', 2),
        B(6, '')
      ], '1:1'),
      G(1),
      HD('チャレンジ★★', '入試にも出る問題。ヒントカードを見てもOK。'),
      C2([
        T('（8）', '1辺が 6cm の正四面体 O−ABC がある。頂点 O から底面 ABC にひいた垂線を OH とする。\n① AH の長さを求めよう。\n② 高さ OH と、体積を求めよう。', 6),
        B(8, '① 底面の正三角形の高さは 3√{3}\nH は、その高さを頂点から 2：1\nAH＝3√{3}×[[2/3]]＝2√{3}（cm）\n② OH^2＝6^2−(2√{3})^2＝24\nOH＝2√{6}（cm）\n体積 [[1/3]]×9√{3}×2√{6}\n＝18√{2}（cm^3）')
      ], [
        F(5, tetra),
        MA('① 底面の正三角形の 3つの頂点から、H までの長さは、どうなっているかな。\n② H は、底面のどこにあるか、図にかいて考えよう。', 7, { label: 'ヒントカード' })
      ], '1:1')
    ],

    /* ================= 小テスト（A4 1枚・5分・10点満点） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      T('（1）', '底面の半径が 4cm、母線の長さが 5cm の円錐の、高さと体積を求めよう。（3点）', 2),
      B(3, '高さ　√{5^2−4^2}＝3（cm）\n体積　[[1/3]]×π×4^2×3＝16π（cm^3）'),
      T('（2）', '1辺が 6cm の正方形の、対角線の長さと、その半分の長さを求めよう。（2点）', 2),
      B(2, '対角線　6√{2}cm　　半分　3√{2}cm'),
      T('（3）', '底面が 1辺 6cm の正方形で、OA＝OB＝OC＝OD＝6cm の正四角錐 O−ABCD の、高さと体積を求めよう。（3点）', 2),
      B(4, 'AH＝3√{2}　OH^2＝6^2−(3√{2})^2＝18\n高さ OH＝3√{2}（cm）\n体積 [[1/3]]×6^2×3√{2}＝36√{2}（cm^3）'),
      T('（4）', '底面の半径が 6cm、高さが 8cm の円錐の、母線の長さを求めよう。（2点）', 2),
      B(2, 'l^2＝6^2+8^2＝100　　l＝10（cm）'),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      T('（5）', '底面が 1辺 6cm の正方形で、OA＝OB＝OC＝OD＝7cm の正四角錐 O−ABCD の、表面積を求めよう。', 2),
      B(5, '側面の三角形の高さ　√{7^2−3^2}＝2√{10}\n側面 1つ　[[1/2]]×6×2√{10}＝6√{10}\n側面 4つで　24√{10}　　底面　6×6＝36\n表面積　36+24√{10}（cm^2）')
    ]
  });
})();
