/* 円（新しい形） 第3時：円周角の定理を使って、角の大きさを求めよう（半円の弧）。
   元：授業ナビ標準版 en-03（例）。例題1の3つの図（中心角の半分・同じ弧・直径）のうち、直径を見つける（半円の弧に対する円周角は 90°）を「今日の問い」（P を動かして ∠APB をはかり、わけを考える）に、
   3つの図で ∠x を求める例題1を「例題」（表の空欄）に、「円形のおぼんの中心を、直角のかどで見つける」を考えよう（演習プリント（7））にした。
   ・ワークシートは A4 1枚：問いは1つ（直径 AB の円で、P を動かしたときの ∠APB）。個人3分 → ペア3分 → ことば → 例題（ア〜ウの図と表の空欄）。
   ・演習プリントは表裏：表＝確かめる 2問・使ってみる 4問（直径・同じ弧・弦の交点・二等辺三角形・面積）／裏＝ひろげる（考えよう・答えなし）・チャレンジ★★（4つの角。ヒントカードつき）。
   ・円周上の点は、中心・半径 1・向き（度）で決め、角の大きさ（内積）・弦の交点・長さを座標から計算しなおして checks にした。図の角の字は、座標から計算した値。
     今日の問いの図は、印刷そのままの大きさ（半径 18mm）で、分度器ではかれる。はかった値を書く線は、図のよこにある（解答のとき赤）。
   ・授業ナビの考えよう（直角のかどで円の中心を見つける）の答え（90° の円周角に対する弦は直径）は、どこにも書かない。ワークシート・演習プリントは、「直径ならば 90°」の向きだけにした。
   検算：node tools/verify.cjs en-03　／　見た目：node tools/check.cjs <出力先> en-03 */
(function () {
  const { M, K, B, G, F, C2, T, HD, BR, WD, MA, TB, SVG } = IK.b;
  /* ---------------- 円の図の道具（このファイルの中だけで使う） ----------------
     CIRC({ pts, seg, dot, vl, ang, rt, arc, txt, free, cap, R, sx, sy, pad, a: { 解答のとき赤で出すもの（同じ書き方） } })
     円の中心 O は [0, 0]、半径は 1。点は、円周上なら「中心から見た向き（度。右が 0、上が 90、反時計まわり）」、そうでなければ [x, y]（半径を 1 とした座標。y が上）。
     R … 半径（mm。枠に入らないときは縮む）　cap … 図の見出し（図1 など）　sx・sy … 円の中心を、枠の中心から動かす（mm）　pad … まわりの余白（mm）
     seg … [点, 点, { dash: 1, w }]　dot … 点（●）　vl … { 点: 字 } か { 点: [字, 向き（度）, きょり（mm）] }（円周上の点の字は、外がわ 3.6mm が既定）
     ang … { at, a, b, t, r, lr, ld }：at を頂点に、半直線 at→a と at→b のあいだ（小さいほう）に弧。t＝'auto' なら座標から計算した度数。r＝弧の半径（mm）、lr・ld＝字までのきょり（mm）・向き（度）
     rt … [頂点, 点, 点]（直角のしるし）　arc … { a0, a1, w }（円周の一部を太くする。a0 → a1 は反時計まわり）　txt … { p, t, dx, dy, size, anchor }　free … (h) => SVG の文字列（枠の mm 座標） */
  const INK = '#222', RED = '#d62828', D2R = Math.PI / 180, J = JSON.stringify;
  // 円周を n等分する点（names の順に、a0 度から時計まわり）→ { A: 90, B: 30, … }
  const divPts = (n, names, a0) => { const o = {}; [...names].forEach((c, i) => { o[c] = ((a0 - 360 / n * i) % 360 + 360) % 360; }); return o; };
  const CIRC = o => SVG((W, H, h) => {
    const f2 = h.f2, top = o.cap ? 4.4 : 0, pad = o.pad == null ? 6 : o.pad;
    const R = Math.min(o.R || 999, (W - 2 * pad) / 2, (H - top - 2 * pad) / 2);
    const cx = W / 2 + (o.sx || 0), cy = (H + top) / 2 + (o.sy || 0), P = o.pts || {};
    const pt = k => (Array.isArray(k) ? k : k === 'O' ? [0, 0] : Array.isArray(P[k]) ? P[k] : [Math.cos(P[k] * D2R), Math.sin(P[k] * D2R)]);
    const X = p => cx + p[0] * R, Y = p => cy - p[1] * R;
    const gdeg = (V, A, E) => { const v = pt(V), a = pt(A), b = pt(E), u = [a[0] - v[0], a[1] - v[1]], w = [b[0] - v[0], b[1] - v[1]]; return Math.acos((u[0] * w[0] + u[1] * w[1]) / Math.hypot(u[0], u[1]) / Math.hypot(w[0], w[1])) / D2R; };
    const lab = d => (Math.abs(d - Math.round(d)) < 0.05 ? Math.round(d) : Math.round(d * 10) / 10) + '°';
    const draw = (g, c) => {
      let s = '';
      (g.arc || []).forEach(a => { const p0 = [Math.cos(a.a0 * D2R), Math.sin(a.a0 * D2R)], p1 = [Math.cos(a.a1 * D2R), Math.sin(a.a1 * D2R)]; s += `<path d="M${f2(X(p0))} ${f2(Y(p0))}A${f2(R)} ${f2(R)} 0 ${a.a1 - a.a0 > 180 ? 1 : 0} 0 ${f2(X(p1))} ${f2(Y(p1))}" fill="none" stroke="${c}" stroke-width="${a.w || 0.9}" stroke-linecap="round"/>`; });
      (g.seg || []).forEach(([a, b, op]) => { op = op || {}; const p = pt(a), q = pt(b); s += h.ln(X(p), Y(p), X(q), Y(q), c, op.w || 0.32, (op.dash ? ' stroke-dasharray="1.4 1"' : '') + ' stroke-linecap="round"'); });
      (g.ang || []).forEach(a => {
        const V = pt(a.at), A = pt(a.a), E = pt(a.b), ta = Math.atan2(A[1] - V[1], A[0] - V[0]), tb = Math.atan2(E[1] - V[1], E[0] - V[0]);
        let d = ((tb - ta) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI), st = ta; if (d > Math.PI) { st = tb; d = 2 * Math.PI - d; }
        const r = a.r || 5, vx = X(V), vy = Y(V), en = st + d;
        s += `<path d="M${f2(vx + r * Math.cos(st))} ${f2(vy - r * Math.sin(st))}A${r} ${r} 0 0 0 ${f2(vx + r * Math.cos(en))} ${f2(vy - r * Math.sin(en))}" fill="none" stroke="${c}" stroke-width="0.28"/>`;
        if (a.t) { const t = a.t === 'auto' ? lab(gdeg(a.at, a.a, a.b)) : a.t, m = a.ld != null ? a.ld * D2R : st + d / 2, rl = a.lr || r + 4; s += h.rich(vx + rl * Math.cos(m), vy - rl * Math.sin(m) + 1.1, t, 3.1, 'middle'); }
      });
      (g.rt || []).forEach(([v, a, b, m0]) => {
        const V = pt(v), A = pt(a), E = pt(b), m = m0 || 2.6, dir = q => { const dx = X(q) - X(V), dy = Y(q) - Y(V), L = Math.hypot(dx, dy) || 1; return [dx / L, dy / L]; }, u = dir(A), w = dir(E), vx = X(V), vy = Y(V);
        s += `<polyline points="${f2(vx + u[0] * m)},${f2(vy + u[1] * m)} ${f2(vx + (u[0] + w[0]) * m)},${f2(vy + (u[1] + w[1]) * m)} ${f2(vx + w[0] * m)},${f2(vy + w[1] * m)}" fill="none" stroke="${c}" stroke-width="0.28"/>`;
      });
      (g.dot || []).forEach(n => { const p = pt(n); s += `<circle cx="${f2(X(p))}" cy="${f2(Y(p))}" r="0.7" fill="${c}"/>`; });
      Object.keys(g.vl || {}).forEach(n => {
        const v = g.vl[n], t = typeof v === 'string' ? v : v[0], p = pt(n), d = typeof v === 'string' || v[1] == null ? Math.atan2(p[1], p[0]) / D2R : v[1], k = typeof v === 'string' || v[2] == null ? 3.6 : v[2];
        s += h.rich(X(p) + k * Math.cos(d * D2R), Y(p) - k * Math.sin(d * D2R) + 1.1, t, 3.2, 'middle');
      });
      (g.txt || []).forEach(t => { const p = pt(t.p || [0, 0]), sz = t.size || 3.1; s += h.rich(X(p) + (t.dx || 0), Y(p) + (t.dy || 0) + sz * 0.34, t.t, sz, t.anchor || 'middle'); });
      if (g.free) s += g.free(h);
      return s;
    };
    let out = o.cap ? h.tx(0.6, 3.5, o.cap, 3, 'start', ' class="cap"') : '';
    out += `<circle cx="${f2(cx)}" cy="${f2(cy)}" r="${f2(R)}" fill="none" stroke="${INK}" stroke-width="0.36"/>`;
    out += draw(o, INK);
    if (o.a) out += h.ans(draw(o.a, RED));
    return out;
  });
  // 図のよこの記入らん：items＝[[字, 答え], …]（「∠APB＝＿＿°」の形）。ans＝true なら、答えだけ（解答のとき赤）。x0・y0・dy＝枠の mm 座標
  const recs = (items, x0, y0, dy, ans) => h => items.map(([t, a], i) => {
    const y = y0 + i * dy;
    return ans ? h.tx(x0 + 24, y - 0.9, a, 3.4, 'middle') : h.tx(x0, y, t, 3.4, 'start') + h.ln(x0 + 17, y + 0.6, x0 + 31, y + 0.6, INK, 0.25) + h.tx(x0 + 32, y, '°', 3.4, 'start');
  }).join('');
  // 検算の道具（checks の式の先頭にそえる）。S＝点の向き（度）。g(頂点, 点, 点)＝その角の大きさ（度）、len(点, 点)＝長さ（半径＝1）
  const LIB = 'const R=Math.PI/180, p=n=>n==="O"?[0,0]:(Array.isArray(S[n])?S[n]:[Math.cos(S[n]*R),Math.sin(S[n]*R)]), g=(V,A,B)=>{const a=p(V),b=p(A),c=p(B),u=[b[0]-a[0],b[1]-a[1]],w=[c[0]-a[0],c[1]-a[1]];return Math.acos((u[0]*w[0]+u[1]*w[1])/Math.hypot(u[0],u[1])/Math.hypot(w[0],w[1]))/R;}, len=(A,B)=>Math.hypot(p(A)[0]-p(B)[0],p(A)[1]-p(B)[1]);';
  const chk = (S, body) => `(() => { ${LIB} const S=${J(S)}; return ${body}; })()`;

  // 2直線 AB と CD の交点（座標は、半径を 1 とする）
  const crossPt = (P, A, Bp, C, D) => {
    const pt = k => { const v = P[k]; return Array.isArray(v) ? v : [Math.cos(v * D2R), Math.sin(v * D2R)]; };
    const [x1, y1] = pt(A), [x2, y2] = pt(Bp), [x3, y3] = pt(C), [x4, y4] = pt(D);
    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / ((x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4));
    return [x1 + t * (x2 - x1), y1 + t * (y2 - y1)];
  };

  // ---- 図の点（中心 O、半径 1。向きは度）----
  const S1 = { A: 180, B: 0, P: 60, Q: 120 };               // 今日の問い：AB が直径。P、Q は上の半円の上
  const SEA = { A: 215, B: 325, P: 90 };                    // 例題 ア：中心角 110°（円周角 55°）
  const SEI = { A: 206, B: 334, P: 90, Q: 350 };            // 例題 イ：同じ弧 AB の円周角 64°
  const SEU = { A: 180, B: 0, P: 100 };                     // 例題 ウ：AB が直径、∠PAB＝50°（∠ABP＝40°）
  const SD1 = { A: 180, B: 0, P: 76 };                      // 図1：AB が直径、∠PAB＝38°
  const SD2 = { A: 224, B: 316, P: 90, Q: 350 };            // 図2：∠AQB＝46°（中心角 92°）
  const SD3 = { B: 180, D: 0, A: 56, C: 300 };              // 図3：BD が直径、∠ABD＝28°、∠ACB＝∠ADB＝62°
  const SD4 = { C: 20, D: 74, A: 190, B: 262 };             // 図4：弦 AC と BD が E で交わる。∠ACB＝36°、∠CBD＝27°
  SD4.E = crossPt(SD4, 'A', 'C', 'B', 'D');
  const SD8 = { A: 180, C: 0, B: 248, D: 76 };              // （8）：AC が直径、∠ACB＝34°、∠CAD＝38°
  const SQA = { A: 205, B: 335, P: 90 };                    // 小テスト ア：中心角 130°
  const SQI = { A: 218, B: 322, P: 90, Q: 20 };             // イ：円周角 52°
  const SQU = { A: 180, B: 0, P: 112 };                     // ウ：AB が直径、∠PAB＝56°
  const SQ5 = { A: 90, B: 215, C: 325 };                    // チャレンジ：∠BAC＝55°
  const P6 = 2 * Math.acos(0.6) / D2R;                      // （6）：AB＝10、AP＝6、BP＝8 の P の向き（度）
  const P3 = 2 * Math.acos(5 / 13) / D2R;                   // 小テスト（3）：AB＝13、AP＝5、BP＝12 の P の向き（度）

  const pl = (S, d) => Object.assign({}, ...Object.keys(S).filter(k => !Array.isArray(S[k])).map(k => ({ [k]: k })), d || {});
  const small = (cap, S, seg, vl, ang, dot) => CIRC({ cap, pts: S, seg, dot: dot || ['O'], vl, ang, pad: 5.5 });

  // 今日の問い：AB（直径）、PA、PB、QA、QB。解答は、図のよこの線に、はかった値（赤）
  const figMain = CIRC({
    pts: S1, R: 18, sx: -48, pad: 5,
    seg: [['A', 'B'], ['P', 'A'], ['P', 'B'], ['Q', 'A'], ['Q', 'B']], dot: ['O', 'A', 'B', 'P', 'Q'],
    vl: pl(S1, { O: ['O', 270, 3.6] }),
    ang: [{ at: 'P', a: 'A', b: 'B', r: 5 }, { at: 'Q', a: 'A', b: 'B', r: 5 }],
    free: recs([['∠APB＝'], ['∠AQB＝']], 100, 20, 10),
    a: { free: recs([['', '90'], ['', '90']], 100, 20, 10, true) }
  });
  // 例題 ア・イ・ウ
  const exA = small('ア', SEA, [['O', 'A'], ['O', 'B'], ['P', 'A'], ['P', 'B']], pl(SEA, { O: ['O', 90, 3.2] }),
    [{ at: 'O', a: 'A', b: 'B', t: 'auto', r: 3.4, lr: 6.6 }, { at: 'P', a: 'A', b: 'B', t: 'x', r: 4.4, lr: 8.4 }]);
  const exI = small('イ', SEI, [['P', 'A'], ['P', 'B'], ['Q', 'A'], ['Q', 'B']], pl(SEI),
    [{ at: 'P', a: 'A', b: 'B', t: 'auto', r: 4.4, lr: 8 }, { at: 'Q', a: 'A', b: 'B', t: 'x', r: 4.4, lr: 5.6 }], []);
  const exU = small('ウ', SEU, [['A', 'B'], ['P', 'A'], ['P', 'B']], pl(SEU, { O: ['O', 270, 3.4] }),
    [{ at: 'A', a: 'B', b: 'P', t: 'auto', r: 4.4, lr: 8.6 }, { at: 'B', a: 'A', b: 'P', t: 'x', r: 4.4, lr: 7 }]);
  // 演習プリントの図
  const fig1 = small('図1', SD1, [['A', 'B'], ['P', 'A'], ['P', 'B']], pl(SD1, { O: ['O', 270, 3.4] }), [{ at: 'A', a: 'B', b: 'P', r: 4.4 }]);
  const fig2 = small('図2', SD2, [['O', 'A'], ['O', 'B'], ['P', 'A'], ['P', 'B'], ['Q', 'A'], ['Q', 'B']], pl(SD2, { O: ['O', 90, 3.2] }),
    [{ at: 'Q', a: 'A', b: 'B', r: 4.4 }, { at: 'P', a: 'A', b: 'B', r: 5 }, { at: 'O', a: 'A', b: 'B', r: 3.6 }]);
  const fig3 = small('図3', SD3, [['B', 'D'], ['A', 'B'], ['A', 'D'], ['C', 'A'], ['C', 'B']], pl(SD3, { O: ['O', 90, 3.2] }),
    [{ at: 'B', a: 'A', b: 'D', r: 4.4 }]);
  const fig4 = small('図4', SD4, [['A', 'C'], ['B', 'D'], ['B', 'C']], pl(SD4, { E: ['E', 136, 3.4] }),
    [{ at: 'C', a: 'A', b: 'B', r: 4.4 }, { at: 'B', a: 'C', b: 'D', r: 4.4 }], ['E']);
  // （7）：中心をかいていない円と、三角定規
  const tray = CIRC({
    pts: {}, R: 15, sx: -55, pad: 5,
    free: h => {
      const x0 = 118, y0 = 33, a = 36, b = 22;
      return h.ln(x0, y0, x0 + a, y0, INK, 0.4) + h.ln(x0, y0, x0, y0 - b, INK, 0.4) + h.ln(x0 + a, y0, x0, y0 - b, INK, 0.4)
        + `<polyline points="${x0 + 3},${y0} ${x0 + 3},${y0 - 3} ${x0},${y0 - 3}" fill="none" stroke="${INK}" stroke-width="0.28"/>`
        + h.tx(x0 + a / 2, y0 + 5.2, '三角定規', 3, 'middle');
    }
  });
  // （8）：4点 A、B、C、D。AC が直径
  const fig8 = CIRC({
    pts: SD8, pad: 6, seg: [['A', 'C'], ['A', 'B'], ['B', 'C'], ['A', 'D'], ['C', 'D'], ['B', 'D']], dot: [],
    vl: pl(SD8), ang: [{ at: 'C', a: 'A', b: 'B', r: 4.4 }, { at: 'A', a: 'C', b: 'D', r: 4.4 }]
  });
  // 小テストの図
  const qa = small('ア', SQA, [['O', 'A'], ['O', 'B'], ['P', 'A'], ['P', 'B']], pl(SQA, { O: ['O', 90, 3.2] }),
    [{ at: 'O', a: 'A', b: 'B', t: 'auto', r: 3.4, lr: 6.6 }, { at: 'P', a: 'A', b: 'B', t: 'x', r: 4.4, lr: 8.4 }]);
  const qi = small('イ', SQI, [['P', 'A'], ['P', 'B'], ['Q', 'A'], ['Q', 'B']], pl(SQI),
    [{ at: 'P', a: 'A', b: 'B', t: 'auto', r: 4.4, lr: 8.4 }, { at: 'Q', a: 'A', b: 'B', t: 'x', r: 4.4, lr: 7 }], []);
  const qu = small('ウ', SQU, [['A', 'B'], ['P', 'A'], ['P', 'B']], pl(SQU, { O: ['O', 270, 3.4] }),
    [{ at: 'A', a: 'B', b: 'P', t: 'auto', r: 4.4, lr: 8.6 }, { at: 'B', a: 'A', b: 'P', t: 'x', r: 4.4, lr: 7 }]);
  const q5 = CIRC({
    pts: SQ5, pad: 6, seg: [['A', 'B'], ['B', 'C'], ['C', 'A']], dot: ['O'],
    vl: pl(SQ5, { O: ['O', 270, 3.2] }), ang: [{ at: 'A', a: 'B', b: 'C', t: '55°', r: 4.4, lr: 8.6 }]
  });

  // 検算の道具（弦の交点）
  const LIBX = 'const X=(a,b,c,d)=>{const [x1,y1]=p(a),[x2,y2]=p(b),[x3,y3]=p(c),[x4,y4]=p(d);const t=((x1-x3)*(y3-y4)-(y1-y3)*(x3-x4))/((x1-x2)*(y3-y4)-(y1-y2)*(x3-x4));return [x1+t*(x2-x1),y1+t*(y2-y1)];}, ga=(V,A,B)=>{const u=[A[0]-V[0],A[1]-V[1]],w=[B[0]-V[0],B[1]-V[1]];return Math.acos((u[0]*w[0]+u[1]*w[1])/Math.hypot(u[0],u[1])/Math.hypot(w[0],w[1]))/R;};';
  // 直角のかどを円周上の P にあて、2辺が円と交わる 2点 A、B を結ぶと直径か（（7）の確かめ。答えは紙面に載せない）
  const LIBT = 'const R=Math.PI/180, pt=a=>[Math.cos(a*R),Math.sin(a*R)], hit=(P,d)=>{const u=[Math.cos(d*R),Math.sin(d*R)],t=-2*(P[0]*u[0]+P[1]*u[1]);return [P[0]+t*u[0],P[1]+t*u[1]];};';

  IK.lesson('en-03', {
    unit: 'en', unitName: '円', form: 'new', no: '第3時', title: '円周角の定理を使って、角の大きさを求めよう',
    summary: '直径 AB の円で P を動かして ∠APB をはかり、半円の弧に対する円周角が 90° になるわけを、円周角の定理で説明する。中心角の半分・同じ弧・直径の 3つの見方で、角の大きさを求める。',
    head: '円　第3時',
    pitch: 8, dots: true,
    checks: [
      // 今日の問い：A(180°)、B(0°) は直径の両はし（AB＝2）。中心角 ∠AOB＝180°。P(60°)、Q(120°) は半円の上で、∠APB＝∠AQB＝90°（中心角の半分）。内積 0
      chk(S1, `near(len('A','B'),2) && near(g('O','A','B'),180) && near(g('P','A','B'),90) && near(g('Q','A','B'),90) && near(g('P','A','B'),g('O','A','B')/2) && near((p('A')[0]-p('P')[0])*(p('B')[0]-p('P')[0])+(p('A')[1]-p('P')[1])*(p('B')[1]-p('P')[1]),0)`),
      // 例題 ア：中心角 110° → ∠x＝55°　イ：同じ弧 AB の円周角 ∠APB＝∠AQB＝64°　ウ：AB が直径、∠PAB＝50° → ∠APB＝90°、∠x＝∠ABP＝40°
      chk(SEA, `near(g('O','A','B'),110) && near(g('P','A','B'),55)`),
      chk(SEI, `near(g('P','A','B'),64) && near(g('Q','A','B'),64)`),
      chk(SEU, `near(len('A','B'),2) && near(g('A','B','P'),50) && near(g('P','A','B'),90) && near(g('B','A','P'),40) && near(50+90+40,180)`),
      // 図1（1）：AB が直径、∠PAB＝38° → ∠APB＝90°、∠PBA＝52°
      chk(SD1, `near(len('A','B'),2) && near(g('A','B','P'),38) && near(g('P','A','B'),90) && near(g('B','A','P'),52) && near(180-90-38,52)`),
      // 図2（2）：同じ弧 AB の円周角 ∠AQB＝∠APB＝46°、中心角 ∠AOB＝92°
      chk(SD2, `near(g('Q','A','B'),46) && near(g('P','A','B'),46) && near(g('O','A','B'),92) && near(46*2,92)`),
      // 図3（3）：BD が直径、∠ABD＝28° → ∠BAD＝90°、∠ADB＝62°、同じ弧 AB の円周角 ∠ACB＝62°
      chk(SD3, `near(len('B','D'),2) && near(g('B','A','D'),28) && near(g('A','B','D'),90) && near(g('D','A','B'),62) && near(g('C','A','B'),62) && near(180-90-28,62)`),
      // 図4（4）：弦 AC と BD が E で交わる。∠ACB＝36°、∠CBD＝27°、∠AEB＝63°（△EBC の外角＝36°＋27°）。E は弦 AC・BD の内側にある
      `(() => { ${LIB} const S=${J(SD4)}; ${LIBX} const E=X('A','C','B','D'); const inSeg=(P,Q)=>{const t=((E[0]-p(P)[0])*(p(Q)[0]-p(P)[0])+(E[1]-p(P)[1])*(p(Q)[1]-p(P)[1]))/((p(Q)[0]-p(P)[0])**2+(p(Q)[1]-p(P)[1])**2); return t>0&&t<1;}; return near(g('C','A','B'),36) && near(g('B','C','D'),27) && near(ga(E,p('A'),p('B')),63) && near(36+27,63) && inSeg('A','C') && inSeg('B','D'); })()`,
      // （5）∠BAC＝62° → ∠BOC＝124°、△OBC は二等辺三角形で ∠OBC＝28°（A(90°)、B(208°)、C(332°)）
      chk({ A: 90, B: 208, C: 332 }, `near(g('A','B','C'),62) && near(g('O','B','C'),124) && near(g('B','O','C'),28) && near(len('O','B'),len('O','C')) && near((180-124)/2,28)`),
      // （6）AB＝10（半径 5）、AP＝6、BP＝8 の P：∠APB＝90°、△ABP の面積＝[[1/2]]×6×8＝24（半径 1 の円で AB＝2、AP＝1.2、BP＝1.6 を 5 倍）
      chk({ A: 180, B: 0, P: P6 }, `near(len('A','B')*5,10) && near(len('A','P')*5,6) && near(len('B','P')*5,8) && near(g('P','A','B'),90) && near(0.5*len('A','P')*5*len('B','P')*5,24) && near(0.5*6*8,24)`),
      // （7）考えよう（答えは紙面に載せない）：直角のかどを円周上の点 P にあて、2辺が円と交わる点 A、B を結ぶと直径（O を通る）。かどの位置・向きを変えた 2本の直径（P＝70°・向き 200° と、P＝160°・向き 290°）の交点が中心 O
      `(() => { ${LIBT} const diam=(a,d)=>{const P=pt(a),A=hit(P,d),Bq=hit(P,d+90); return {A,Bq,through:Math.abs(A[0]*Bq[1]-A[1]*Bq[0])<1e-9 && near(Math.hypot(A[0]-Bq[0],A[1]-Bq[1]),2)};}; const d1=diam(70,200), d2=diam(160,290); const cr=(a,b,c,d)=>{const t=((a[0]-c[0])*(c[1]-d[1])-(a[1]-c[1])*(c[0]-d[0]))/((a[0]-b[0])*(c[1]-d[1])-(a[1]-b[1])*(c[0]-d[0]));return [a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])];}; const O=cr(d1.A,d1.Bq,d2.A,d2.Bq); return d1.through && d2.through && Math.abs(O[0])<1e-9 && Math.abs(O[1])<1e-9; })()`,
      // （8）AC が直径（A(180°)、C(0°)）、B(248°)、D(76°)：∠ABC＝90°、∠BAC＝56°、∠ADB＝∠ACB＝34°、∠ADC＝90°、∠ACD＝52°
      chk(SD8, `near(len('A','C'),2) && near(g('C','A','B'),34) && near(g('A','C','D'),38) && near(g('B','A','C'),90) && near(g('A','B','C'),56) && near(g('D','A','B'),34) && near(g('D','A','C'),90) && near(g('C','A','D'),52) && near(180-90-34,56) && near(180-90-38,52)`),
      // 小テスト（1）ア：中心角 130° → 65°　イ：同じ弧の円周角 52°　ウ：AB が直径、∠PAB＝56° → ∠ABP＝34°
      chk(SQA, `near(g('O','A','B'),130) && near(g('P','A','B'),65)`),
      chk(SQI, `near(g('Q','A','B'),52) && near(g('P','A','B'),52)`),
      chk(SQU, `near(len('A','B'),2) && near(g('A','B','P'),56) && near(g('P','A','B'),90) && near(g('B','A','P'),34) && near(180-90-56,34)`),
      // 小テスト（3）：AB＝13、AP＝5、BP＝12 の P：∠APB＝90°、△ABP＝[[1/2]]×5×12＝30
      chk({ A: 180, B: 0, P: P3 }, `near(len('A','B')*6.5,13) && near(len('A','P')*6.5,5) && near(len('B','P')*6.5,12) && near(g('P','A','B'),90) && near(0.5*len('A','P')*6.5*len('B','P')*6.5,30) && near(0.5*5*12,30)`),
      // 小テスト（4）：∠BAC＝48° → ∠BOC＝96°（A(90°)、B(222°)、C(318°)）
      chk({ A: 90, B: 222, C: 318 }, `near(g('A','B','C'),48) && near(g('O','B','C'),96) && near(48*2,96)`),
      // 小テスト（5）チャレンジ：∠BAC＝55° → ∠BOC＝110°、∠OBC＝35°
      chk(SQ5, `near(g('A','B','C'),55) && near(g('O','B','C'),110) && near(g('B','O','C'),35) && near((180-110)/2,35)`)
    ],

    /* ================= ワークシート（A4 1枚・約12分） ================= */
    ws: [
      M('円周角の定理を使って、角の大きさを求めよう'),
      K('今日の問い', '線分 AB は円 O の直径で、点 P は円周上を動く。P を動かすと、∠APB は、どうなるだろう。図の P、Q ではかって、そのわけも考えよう。', 3),
      F(6, figMain),
      T('①', '自分の考え（3分）　はかった結果と、わけを書こう。', 1),
      B(3, '（例）∠APB＝90°、∠AQB＝90°。P を動かしても、90° のまま。\nAB は直径だから、中心角 ∠AOB＝180°。\n円周角は、その半分だから、90°。'),
      T('②', 'ペアの考え（3分）　自分とちがう考え・気づきを書こう。', 1),
      B(2, ''),
      G(1),
      WD('半円の弧に対する円周角は{{90°}}である。\n円周角は、中心角の{{半分}}。\n同じ弧に対する円周角は{{等しい}}。\nAB が直径のとき、△APB は{{直角}}三角形。', 4, { label: 'ことば（教科書で調べよう）' }),
      G(1),
      K('例題', 'ア〜ウの図で、∠x の大きさを求めよう。使う性質も書こう。', 1),
      F(6, exA, exI, exU),
      TB('', ['ア', 'イ', 'ウ'], [
        ['使う性質', ['{{中心角の半分}}', '{{同じ弧の円周角}}', '{{半円の弧は 90°}}']],
        ['∠x の大きさ', ['{{55°}}', '{{64°}}', '{{40°}}']]
      ], { hw: 30 })
    ],

    /* ================= 演習プリント（A4 表裏） ================= */
    dr: [
      HD('確かめる', 'ことばと、基本をたしかめよう。'),
      WD('① 半円の弧に対する円周角は{{90°}}である。\n② 同じ弧に対する円周角は{{等しい}}。円周角は、中心角の{{半分}}である。\n③ AB が直径のとき、円周上の点 P について、△APB は{{直角}}三角形である。', 3, { label: 'ことば' }),
      F(6, fig1, fig2, fig3, fig4),
      C2([
        T('（1）', '図1で、AB は直径である。∠PAB＝38° のとき、∠APB と ∠PBA を求めよう。', 3),
        B(2, '∠APB＝90°（半円の弧）\n∠PBA＝180°−90°−38°＝52°')
      ], [
        T('（2）', '図2で、∠AQB＝46° のとき、∠APB と ∠AOB の大きさを求めよう。', 3),
        B(2, '∠APB＝46°（同じ弧）\n∠AOB＝46°×2＝92°')
      ], '1:1'),
      MA('【説明】AB が直径のとき、∠APB が 90° になるわけを、隣の人に説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      HD('使ってみる', '円周角の定理を使って、角の大きさを求めよう。'),
      C2([
        T('（3）', '図3で、BD は円 O の直径である。∠ABD＝28° のとき、∠ACB の大きさを求めよう。', 3),
        B(3, '∠BAD＝90°\n∠ADB＝90°−28°＝62°\n∠ACB＝∠ADB＝62°')
      ], [
        T('（4）', '図4で、弦 AC と BD は点 E で交わる。∠ACB＝36°、∠CBD＝27° のとき、∠AEB の大きさを求めよう。', 3),
        B(2, '△EBC の外角だから\n∠AEB＝36°+27°＝63°')
      ], '1:1'),
      C2([
        T('（5）', '円 O の周上に 3点 A、B、C があり、∠BAC＝62° である。∠OBC の大きさを求めよう。', 4),
        B(3, '∠BOC＝62°×2＝124°\n底角＝(180°−124°)÷2\n＝28°')
      ], [
        T('（6）', '線分 AB は、半径 5cm の円 O の直径である。円周上の点 P について、AP＝6cm、BP＝8cm のとき、△ABP の面積を求めよう。', 4),
        B(3, '∠APB＝90°（半円の弧）\n[[1/2]]×6×8＝24(cm^2)')
      ], '1:1'),
      T('', '★ ここまでできたら、今日の合格！　　合格 ☐', 1),
      BR(),

      HD('ひろげる', '考えよう：直角を使って、円の中心を見つけよう。'),
      T('（7）', '円形のおぼんの中心を、見つけたい。使えるのは、直角のかどのある三角定規と、えんぴつだけである。どうすれば、中心が見つかるだろう。', 3),
      F(5, tray),
      C2([
        T('', '見つけ方（図にかいてもよい）', 1),
        B(7, '')
      ], [
        T('', 'そうすれば見つかるわけ', 1),
        B(7, '')
      ], '1:1'),
      G(1),
      HD('チャレンジ★★', '入試にも出る問題。ヒントカードを見てもOK。'),
      C2([
        T('（8）', '右の図で、AC は円 O の直径である。∠ACB＝34°、∠CAD＝38° のとき、①∠ABC　②∠BAC　③∠ADB　④∠ACD の大きさを求めよう。', 4),
        B(6, '① AC は直径だから 90°\n② 180°−90°−34°＝56°\n③ 弧 AB に対する円周角\n　 だから ∠ACB と同じ 34°\n④ ∠ADC＝90° だから\n　 180°−90°−38°＝52°')
      ], [
        F(5, fig8),
        MA('① 直径を見つけたら、どんな角ができるかな。\n② ∠ADB は、どの弧に対する円周角かな。', 5, { label: 'ヒントカード' })
      ], '1:1')
    ],

    /* ================= 小テスト（A4 1枚・5分・10点満点） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      T('（1）', '次の図で、∠x の大きさを求めよう。ア〜ウは、1点ずつ。（3点）', 1),
      F(6, qa, qi, qu),
      B(1, 'ア 65°　　イ 52°　　ウ 34°'),
      T('（2）', '半円の弧に対する円周角は、何度か。（2点）', 1),
      B(1, '90°'),
      T('（3）', '線分 AB は円 O の直径で、AB＝13cm である。円周上の点 P について、AP＝5cm、BP＝12cm のとき、△ABP の面積を求めよう。（3点）', 3),
      B(2, '∠APB＝90°（半円の弧）\n[[1/2]]×5×12＝30(cm^2)'),
      T('（4）', '円 O の周上に 3点 A、B、C があり、∠BAC＝48° である。∠BOC の大きさを求めよう。（2点）', 2),
      B(1, '48°×2＝96°'),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      C2([
        T('（5）', '円 O の周上に 3点 A、B、C があり、∠BAC＝55° である。∠OBC の大きさを求めよう。', 4),
        B(4, '∠BOC＝55°×2＝110°\n△OBC は二等辺三角形だから\n∠OBC＝(180°−110°)÷2\n＝35°')
      ], [
        F(5, q5)
      ], '1:1')
    ]
  });
})();
