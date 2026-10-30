/* 円（新しい形） 第2時：円周角が中心角の半分になるわけを説明しよう（円周角の定理の証明）。
   元：授業ナビ標準版 en-02（探）。円周角の定理の証明（中心 O が辺 PB 上にある場合）を「今日の問い」に、中心 O が内部にある場合（直径 PK をひく）を「例題」（空欄）に、
   「なぜ中心 O の位置で場合を分けるのか」を考えよう（演習プリント（7））にした。授業構想の水準にそろえ、外部の場合の証明は求めない（（7）で、はかって調べるだけ）。
   ・ワークシートは A4 1枚：問いは1つ（PB が直径のとき ∠APB＝[[1/2]]∠AOB のわけ）。個人3分 → ペア3分 → ことば → 例題（証明の空欄）。証明の答え（B）は「（仮定）…／（結論）…／（証明）…」。
   ・演習プリントは表裏：表＝確かめる 2問・使ってみる 4問（数・説明・まちがい直し）／裏＝ひろげる（考えよう・答えなし）・チャレンジ★★（a、b で表す。ヒントカードつき）。
   ・円周上の点は、中心・半径 1・向き（度）で決め、角の大きさ（内積）と「OP＝OA」「外角＝となり合わない2つの内角の和」「∠APB＝∠APK＋∠BPK」を座標から確かめて checks にした。
   検算：node tools/verify.cjs en-02　／　見た目：node tools/check.cjs <出力先> en-02 */
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

  // ---- 図の点（中心 O、半径 1。向きは度）----
  const S1 = { P: 150, B: 330, A: 260 };                    // 今日の問い：PB が直径、∠AOB＝70°
  const SIN = { P: 90, K: 270, A: 214, B: 334 };            // 例題：O が ∠APB の内部。PK が直径。∠AOK＝56°、∠BOK＝64°
  const SD1 = { P: 150, B: 330, A: 262 };                   // 図1：∠APB＝34°
  const SD2 = { P: 100, K: 280, A: 236, B: 342 };           // 図2：∠APK＝22°、∠BPK＝31°
  const SD3 = { P: 90, A: 222, B: 336 };                    // 図3：∠OAP＝24°、∠OBP＝33°
  const SD4 = { P: 90, K: 270, A: 200, B: 316 };            // 図4：∠AOB＝116°、∠APK＝35°
  const S7A = { P: 90, B: 270, A: 200 };                    // （7）ア：O が辺 PB 上
  const S7I = { P: 90, A: 215, B: 335 };                    // （7）イ：O が内部
  const S7U = { P: 90, A: 200, B: 260 };                    // （7）ウ：O が外部
  const S8 = { P: 90, A: 214, B: 334 };                     // （8）：∠OAP＝28°、∠OBP＝32°
  const SQ1 = { P: 120, B: 300, A: 240 };                   // 小テスト（1）：∠AOB＝60°
  const SQ4 = { P: 90, A: 216, B: 346 };                    // 小テスト チャレンジ：∠OAP＝27°、∠OBP＝38°

  // 図：点の名前と、角のしるし（値は、本文にある）
  const pl = (S, d) => Object.assign({}, ...Object.keys(S).map(k => ({ [k]: k })), d || {});
  // 今日の問い：PB（直径）・PA・OA。∠APB と ∠AOB にしるし
  const figMain = CIRC({
    pts: S1, R: 15, pad: 6,
    seg: [['P', 'B'], ['P', 'A'], ['O', 'A']], dot: ['O', 'A', 'B', 'P'],
    vl: pl(S1, { O: ['O', 60, 3.4] }),
    ang: [{ at: 'P', a: 'B', b: 'A', r: 6 }, { at: 'O', a: 'A', b: 'B', r: 4.4 }]
  });
  // 例題：直径 PK（点線）、PA、PB、OA、OB
  const figIn = CIRC({
    pts: SIN, R: 22, pad: 6,
    seg: [['P', 'A'], ['P', 'B'], ['P', 'K', { dash: 1 }], ['O', 'A'], ['O', 'B']], dot: ['O', 'A', 'B', 'P', 'K'],
    vl: pl(SIN, { O: ['O', 20, 3.4] }),
    ang: [{ at: 'P', a: 'A', b: 'K', r: 7 }, { at: 'P', a: 'K', b: 'B', r: 7 }, { at: 'O', a: 'A', b: 'K', r: 5 }, { at: 'O', a: 'K', b: 'B', r: 5 }]
  });
  // 演習プリントの図
  const big = (cap, S, seg, vl, ang) => CIRC({ cap, pts: S, seg, dot: ['O'], vl, ang, pad: 5.5 });
  const fig1 = big('図1', SD1, [['P', 'B'], ['P', 'A'], ['O', 'A']], pl(SD1, { O: ['O', 60, 3.2] }),
    [{ at: 'P', a: 'B', b: 'A', r: 5 }, { at: 'A', a: 'O', b: 'P', r: 4 }, { at: 'O', a: 'A', b: 'B', r: 4 }]);
  const fig2 = big('図2', SD2, [['P', 'A'], ['P', 'B'], ['P', 'K'], ['O', 'A'], ['O', 'B']], pl(SD2, { O: ['O', 20, 3.2] }),
    [{ at: 'P', a: 'A', b: 'K', r: 6 }, { at: 'P', a: 'K', b: 'B', r: 6 }]);
  const fig3 = big('図3', SD3, [['P', 'A'], ['P', 'B'], ['O', 'A'], ['O', 'B']], pl(SD3, { O: ['O', 0, 3.2] }),
    [{ at: 'A', a: 'O', b: 'P', r: 4.4 }, { at: 'B', a: 'O', b: 'P', r: 4.4 }]);
  const fig4 = big('図4', SD4, [['P', 'A'], ['P', 'B'], ['P', 'K'], ['O', 'A'], ['O', 'B']], pl(SD4, { O: ['O', 20, 3.2] }),
    [{ at: 'P', a: 'A', b: 'K', r: 6 }, { at: 'O', a: 'A', b: 'B', r: 4 }]);
  // （7）ア・イ・ウ：中心 O が、∠APB の辺の上・内部・外部にある図
  const f7 = (cap, S, seg, vl) => CIRC({ cap, pts: S, seg, dot: ['O'], vl, pad: 5.5, ang: [{ at: 'P', a: 'A', b: 'B', r: 5 }, { at: 'O', a: 'A', b: 'B', r: 3.6 }] });
  const fig7a = f7('ア', S7A, [['P', 'B'], ['P', 'A'], ['O', 'A']], pl(S7A, { O: ['O', 0, 3.2] }));
  const fig7i = f7('イ', S7I, [['P', 'A'], ['P', 'B'], ['O', 'A'], ['O', 'B']], pl(S7I, { O: ['O', 90, 3.2] }));
  const fig7u = f7('ウ', S7U, [['P', 'A'], ['P', 'B'], ['O', 'A'], ['O', 'B']], pl(S7U, { O: ['O', 50, 3.2] }));
  // （8）：O は ∠APB の内部。∠OAP、∠OBP にしるし
  const fig8 = CIRC({
    pts: S8, pad: 6, seg: [['P', 'A'], ['P', 'B'], ['O', 'A'], ['O', 'B']], dot: ['O'],
    vl: pl(S8, { O: ['O', 0, 3.2] }), ang: [{ at: 'A', a: 'O', b: 'P', r: 4.4 }, { at: 'B', a: 'O', b: 'P', r: 4.4 }]
  });
  // 小テスト：（1）の図、チャレンジの図
  const q1 = CIRC({
    pts: SQ1, pad: 6, R: 18, seg: [['P', 'B'], ['P', 'A'], ['O', 'A']], dot: ['O'],
    vl: pl(SQ1, { O: ['O', 60, 3.4] }), ang: [{ at: 'P', a: 'B', b: 'A', r: 6 }, { at: 'O', a: 'A', b: 'B', r: 4.4 }]
  });
  const q4 = CIRC({
    pts: SQ4, pad: 6, seg: [['P', 'A'], ['P', 'B'], ['O', 'A'], ['O', 'B']], dot: ['O'],
    vl: pl(SQ4, { O: ['O', 20, 3.2] }), ang: [{ at: 'A', a: 'O', b: 'P', r: 4.4 }, { at: 'B', a: 'O', b: 'P', r: 4.4 }]
  });

  IK.lesson('en-02', {
    unit: 'en', unitName: '円', form: 'new', no: '第2時', title: '円周角が中心角の半分になるわけを説明しよう',
    summary: '円周角が中心角の半分になるわけを、半径が等しいこと（二等辺三角形）と、三角形の外角の性質を使って説明する。中心が角の辺上にある場合の証明から、内部にある場合の証明へ。',
    head: '円　第2時',
    pitch: 8, dots: true,
    checks: [
      // 今日の問い：P(150°)、B(330°) は直径の両はし（PB＝2）。A(260°) で OP＝OA（半径）、∠OPA＝∠OAP（二等辺三角形の底角）、∠AOB は △OPA の外角＝∠OPA＋∠OAP、∠AOB＝2∠OPA、∠APB＝∠OPA（O が PB 上）
      chk(S1, `near(len('P','B'),2) && near(len('O','P'),len('O','A')) && near(g('P','O','A'),g('A','O','P')) && near(g('O','A','B'),g('P','O','A')+g('A','O','P')) && near(g('O','A','B'),2*g('P','O','A')) && near(g('P','A','B'),g('P','O','A')) && near(g('O','A','B'),70) && near(g('P','A','B'),35)`),
      // 例題：P(90°)、K(270°) は直径の両はし。∠APK＝[[1/2]]∠AOK（28°＝56°÷2）、∠BPK＝[[1/2]]∠BOK（32°＝64°÷2）、∠APB＝∠APK＋∠BPK＝[[1/2]](∠AOK＋∠BOK)＝[[1/2]]∠AOB（60°＝120°÷2）。K は ∠APB の内部にある（O も内部）
      chk(SIN, `near(len('P','K'),2) && near(g('P','A','K'),g('O','A','K')/2) && near(g('P','B','K'),g('O','B','K')/2) && near(g('P','A','B'),g('P','A','K')+g('P','B','K')) && near(g('O','A','K')+g('O','K','B'),g('O','A','B')) && near(g('P','A','B'),g('O','A','B')/2) && near(g('O','A','K'),56) && near(g('O','B','K'),64) && near(g('P','A','B'),60)`),
      // 図1（1）：PB が直径、∠APB＝34° → ∠OAP＝34°、∠AOB＝68°（外角）
      chk(SD1, `near(len('P','B'),2) && near(g('P','A','B'),34) && near(g('A','O','P'),34) && near(g('O','A','B'),68) && near(34+34,68)`),
      // 図2（2）：PK が直径、∠APK＝22°、∠BPK＝31° → ∠AOK＝44°、∠BOK＝62°、∠AOB＝106°、∠APB＝53°（O、K は ∠APB の内部）
      chk(SD2, `near(len('P','K'),2) && near(g('P','A','K'),22) && near(g('P','B','K'),31) && near(g('O','A','K'),44) && near(g('O','B','K'),62) && near(g('O','A','B'),106) && near(g('P','A','B'),53) && near(22*2+31*2,106) && near(22+31,53)`),
      // 図3（3）：∠OAP＝24°、∠OBP＝33° → OP をひくと ∠OPA＝24°、∠OPB＝33°、∠APB＝57°、∠AOB＝114°（OP＝OA＝OB）
      chk(SD3, `near(g('A','O','P'),24) && near(g('B','O','P'),33) && near(g('P','A','B'),57) && near(g('O','A','B'),114) && near(len('O','P'),len('O','A')) && near(len('O','P'),len('O','B')) && near(24+33,57)`),
      // 図4（4）：∠AOB＝116°、PK が直径、∠APK＝35° → ∠APB＝58°、∠BPK＝23°、∠AOK＝70°、∠BOK＝46°
      chk(SD4, `near(len('P','K'),2) && near(g('O','A','B'),116) && near(g('P','A','K'),35) && near(g('P','A','B'),58) && near(g('P','B','K'),23) && near(g('O','A','K'),70) && near(g('O','B','K'),46) && near(116/2,58) && near(58-35,23) && near(116-70,46)`),
      // （5）同じ弧 AB の円周角 ∠APB、∠AQB はどちらも [[1/2]]∠AOB（A(200°)、B(320°) で ∠AOB＝120°、P(90°)・Q(40°) で 60°）
      chk({ A: 200, B: 320, P: 90, Q: 40 }, `near(g('P','A','B'),g('O','A','B')/2) && near(g('Q','A','B'),g('O','A','B')/2) && near(g('P','A','B'),g('Q','A','B'))`),
      // （6）まちがい直し：△OPA（O が PB 上）の内角のうち O のところは ∠POA＝180°−∠AOB。∠AOB は、その外角
      chk(S1, `near(g('O','P','A'),180-g('O','A','B')) && near(g('O','A','B'),g('P','O','A')+g('A','O','P')) && near(g('O','P','A')+g('P','O','A')+g('A','O','P'),180)`),
      // （7）考えよう（答えは紙面に載せない）：ア（O が辺上）・イ（内部）・ウ（外部）のどれも ∠APB＝[[1/2]]∠AOB（35°・60°・30°）。ウは O が ∠APB の外にある（A、B が直線 PO の同じがわ）
      chk(S7A, `near(g('P','A','B'),35) && near(g('O','A','B'),70)`),
      chk(S7I, `near(g('P','A','B'),60) && near(g('O','A','B'),120)`),
      chk(S7U, `near(g('P','A','B'),30) && near(g('O','A','B'),60) && p('A')[0]<0 && p('B')[0]<0`),
      // （8）A、B は P(90°) から見て O の左右：∠OAP＝a、∠OBP＝b なら ∠AOB＝2(a＋b)（a＋b＜90°のいくつかの組と、a＝28、b＝32 で 120°）
      chk(S8, `near(g('A','O','P'),28) && near(g('B','O','P'),32) && near(g('O','A','B'),120) && near(2*(28+32),120)`),
      `[[10, 20], [28, 32], [15, 40], [33, 25], [5, 60]].every(([a, b]) => { const S={P:90,A:90+(180-2*a),B:90-(180-2*b)}; ${LIB} return near(g('A','O','P'),a) && near(g('B','O','P'),b) && near(g('O','A','B'),2*(a+b)) && near(g('P','A','B'),a+b); })`,
      // 小テスト（1）：PB が直径、∠AOB＝60°、∠APB＝30°
      chk(SQ1, `near(len('P','B'),2) && near(g('O','A','B'),60) && near(g('P','A','B'),30) && near(g('A','O','P'),g('P','O','A'))`),
      // 小テスト（2）：PK が直径、∠APK＝26°、∠BPK＝29° → ∠APB＝55°、∠AOB＝110°（A(218°)、B(328°)）
      chk({ P: 90, K: 270, A: 218, B: 328 }, `near(g('P','A','K'),26) && near(g('P','B','K'),29) && near(g('P','A','B'),55) && near(g('O','A','B'),110) && near(26+29,55) && near(55*2,110)`),
      // 小テスト チャレンジ（4）：∠OAP＝27°、∠OBP＝38° → ∠APB＝65°、∠AOB＝130°
      chk(SQ4, `near(g('A','O','P'),27) && near(g('B','O','P'),38) && near(g('P','A','B'),65) && near(g('O','A','B'),130) && near(2*(27+38),130)`)
    ],

    /* ================= ワークシート（A4 1枚・約12分） ================= */
    ws: [
      M('円周角が中心角の半分になるわけを、説明しよう'),
      C2([
        K('今日の問い', 'PB が円 O の直径のとき、∠APB は ∠AOB の半分になる。そのわけを、説明しよう。', 4)
      ], [
        F(5, figMain)
      ], '1:1'),
      T('①', '自分の考え（3分）　わけを、順に書こう。', 1),
      B(7, '（仮定）PB は円 O の直径\n（結論）∠APB＝[[1/2]]∠AOB\n（証明）OP＝OA（円の半径）だから、△OPA は二等辺三角形で\n　　　　∠OPA＝∠OAP …①\n∠AOB は △OPA の外角だから　∠AOB＝∠OPA+∠OAP …②\n①、② より　∠AOB＝2∠OPA\nよって　∠APB＝[[1/2]]∠AOB'),
      T('②', 'ペアの考え（3分）　自分とちがう考え・気づきを書こう。', 1),
      B(2, ''),
      G(1),
      WD('円の半径は{{等しい}}。\n二等辺三角形の{{底角}}は等しい。\n三角形の{{外角}}は、となり合わない 2つの内角の和に等しい。', 4, { label: 'ことば（教科書で調べよう）' }),
      G(1),
      C2([
        K('例題', '中心 O が ∠APB の内部にあるとき、∠APB＝[[1/2]]∠AOB を証明しよう。直径 PK をひいて、今日の問いの結果を使う。□ をうめよう。\n∠APK＝[[1/2]]{{∠AOK}} …①\n∠BPK＝[[1/2]]{{∠BOK}} …②\n①、② より　∠APB＝∠APK+∠BPK\n＝[[1/2]]({{∠AOK+∠BOK}})＝[[1/2]]∠AOB', 10)
      ], [
        F(10, figIn)
      ], '3:2')
    ],

    /* ================= 演習プリント（A4 表裏） ================= */
    dr: [
      HD('確かめる', 'ことばと、基本をたしかめよう。'),
      WD('① 円の半径は{{等しい}}ので、O と円周上の 2点を結んでできる三角形は{{二等辺三角形}}である。\n② 三角形の{{外角}}は、となり合わない 2つの内角の和に等しい。\n③ 二等辺三角形の{{底角}}は等しい。', 4, { label: 'ことば' }),
      F(5, fig1, fig2, fig3, fig4),
      C2([
        T('（1）', '図1で、PB は円 O の直径である。∠APB＝34° のとき、∠OAP と ∠AOB の大きさを求めよう。', 3),
        B(2, '△OPA は二等辺三角形\n∠OAP＝34°　∠AOB＝68°')
      ], [
        T('（2）', '図2で、PK は円 O の直径である。∠APK＝22°、∠BPK＝31° のとき、∠AOK、∠BOK、∠AOB、∠APB を求めよう。', 4),
        B(2, '∠AOK＝44°、∠BOK＝62°\n∠AOB＝106°、∠APB＝53°')
      ], '1:1'),
      MA('【説明】△OPA が二等辺三角形になるわけを、隣の人に説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      HD('使ってみる', '証明で使った考えを、数や説明で使ってみよう。'),
      C2([
        T('（3）', '図3で、∠OAP＝24°、∠OBP＝33° である。OP をひいて、∠APB と ∠AOB の大きさを求めよう。', 3),
        B(3, '△OPA、△OPB は二等辺三角形\n∠APB＝24°+33°＝57°\n∠AOB＝57°×2＝114°')
      ], [
        T('（4）', '図4で、∠AOB＝116° である。PK は直径、∠APK＝35° のとき、∠APB、∠BPK、∠BOK の大きさを求めよう。', 3),
        B(3, '∠APB＝116°÷2＝58°\n∠BPK＝58°−35°＝23°\n∠BOK＝23°×2＝46°')
      ], '1:1'),
      C2([
        T('（5）', '円 O で、弧 AB に対する円周角 ∠APB と ∠AQB が等しくなるわけを、円周角の定理を使って説明しよう。', 5),
        B(2, 'どちらも、中心角 ∠AOB の\n半分だから、等しい。')
      ], [
        T('（6）', '「∠AOB は △OPA の内角だから、∠AOB＝∠OPA+∠OAP」と書いた。まちがいを直そう。', 3),
        B(2, '内角ではなく、外角。\n△OPA の外角が ∠AOB。')
      ], '1:1'),
      T('', '★ ここまでできたら、今日の合格！　　合格 ☐', 1),
      BR(),

      HD('ひろげる', '考えよう：中心 O の位置で、場合を分けるわけを考えよう。'),
      T('（7）', '点 P の位置によって、中心 O は ∠APB の辺の上（ア）・内部（イ）・外部（ウ）の 3通りになる。ウの図で、∠APB と ∠AOB をはかって、調べよう。', 2),
      F(6, fig7a, fig7i, fig7u),
      C2([
        T('', 'ウの図で、気づいたこと', 1),
        B(6, '')
      ], [
        T('', 'なぜ、場合を分けて考えるのだろう', 2),
        B(5, '')
      ], '1:1'),
      G(1),
      HD('チャレンジ★★', '入試にも出る問題。ヒントカードを見てもOK。'),
      C2([
        T('（8）', '円 O の周上に 3点 A、B、P があり、O は ∠APB の内部にある。∠OAP＝a°、∠OBP＝b° のとき、∠AOB を a、b で表そう。また、a＝28、b＝32 のとき、∠AOB は何度か。', 5),
        B(6, '∠OPA＝a°、∠OPB＝b°\n∠APB＝(a+b)°\n∠AOB＝2(a+b)°\na＝28、b＝32 のとき\n2×(28+32)＝120°')
      ], [
        F(5, fig8),
        MA('① OP をひくと、どんな三角形ができるかな。\n② ∠APB は、∠OPA と ∠OPB で表せるかな。', 5, { label: 'ヒントカード' })
      ], '1:1')
    ],

    /* ================= 小テスト（A4 1枚・5分・10点満点） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      C2([
        T('（1）', '右の図で、PB は円 O の直径である。∠APB＝[[1/2]]∠AOB の証明を、完成させよう。（5点）\nOP＝OA だから、△OPA は{{二等辺三角形}}で\n∠OPA＝∠OAP …①\n∠AOB は △OPA の{{外角}}だから\n∠AOB＝∠OPA+{{∠OAP}} …②\n①、② より　∠AOB＝{{2}}∠OPA\nよって　∠APB＝[[1/2]]∠AOB', 9)
      ], [
        F(9, q1)
      ], '3:2'),
      B(1, '二等辺三角形　外角　∠OAP　2'),
      T('（2）', '円 O の周上に 3点 A、B、P があり、直径 PK をひくと、∠APK＝26°、∠BPK＝29° になった。K が ∠APB の内部にあるとき、∠APB と ∠AOB の大きさを求めよう。（3点）', 3),
      B(2, '∠APB＝26°+29°＝55°\n∠AOB＝55°×2＝110°'),
      T('（3）', '（1）の証明で、△OPA が二等辺三角形になるのは、どの 2つの辺が等しいからか。（2点）', 2),
      B(1, 'OP＝OA（どちらも円の半径）'),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      C2([
        T('（4）', '円 O の周上に 3点 A、B、P があり、O は ∠APB の内部にある。∠OAP＝27°、∠OBP＝38° のとき、∠AOB の大きさを求めよう。', 5),
        B(4, '∠OPA＝27°、∠OPB＝38°\n∠APB＝27°+38°＝65°\n∠AOB＝65°×2＝130°')
      ], [
        F(5, q4)
      ], '1:1')
    ]
  });
})();
