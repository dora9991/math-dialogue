/* 平行と合同 第7時「補助線をひいて、角度のなぞを解こう」：授業計画・ワークシート・演習プリント・小テスト（新しい形）。
   授業ナビ 標準版（hyojun-navi）の第7時（補助線パズル）をもとに、50分の流れ（ペア学習3＋小テスト7＋解説・発問12＋演習23＋振り返り・回収5）に合わせて、新しく書き直した。
   型は「遊（ゲーム・活動）」。第1〜6時（平行線の性質・内角の和・外角の性質・多角形の角）をまとめて使い、「補助線をどこにひくと求められるか」を、いろいろな形の角度のなぞで考える。
   ・学習課題＝ℓ∥m の間の折れ線（35°と50°）。補助線をひく前の図だけを印刷し、補助線は解答を表示したときだけ赤い点線で出る（全部印刷）。
     ことば＝補助線と、使う道具（平行線の性質・内角の和・外角の性質）の確認。「補助線のねらい」は、考えようで見つけさせるので書かない。
     例題＝ブーメラン形（∠BAC・∠ABD・∠ACD から ∠BDC）。BD をのばして AC との交点 E をとる。空欄あり。
   ・考えよう＝「ア（ℓ∥m の間の、2回折れる線）・イ（ブーメラン形。求めるのは ∠ABD）・ウ（45°の三角定規を ℓ∥m にのせた図）の ∠x を求めよう。補助線のひき方をいくつも見つけて、うまくいく補助線の共通点をことばにしよう」。
     答えは、ワークシートにも教卓の解答にも載せない（図にも、補助線を出さない）。ちがうひき方で求めて、答えが同じになることが、自分で答えを確かめる手がかりになる。
     発展＝例題のブーメラン形が「∠x＝∠A+∠B+∠C」になるわけを、別の補助線のひき方でも確かめる。
   ・演習プリント＝基礎（折れ線×2・ブーメラン）／標準（コの字形・正三角形）／応用（3回折れる線・リボン形）／入試レベル（正五角形・星形）。補助線の入った答えの図は、赤い点線で出る。
   ・図は、角度から座標を出して描いたので、角の大きさと図が一致している。checks では、すべての図について、座標から角を測り直して、図の字・答えと合うか、平行線・等しい辺のしるしが本当に平行・等しいかを確かめた。
   ・見本（空間図形 第1時）との違い：図は平面図形の GEO（js/geo.js）。補助線を、解答だけの赤い点線で出す。
   検算：node tools/verify.cjs　／　見た目：node tools/check.cjs */
(function () {
  const { M, K, B, G, F, C2, BR, T, HD, WD, MA, GEO } = IK.b;
  const J = JSON.stringify;

  /* ---------------- 角度から座標をつくる道具 ----------------
     mv：点 p から、向き d（度。右が 0、上が 90）に r 進んだ点　toY：p から向き d に進んで、高さ y に着く点　meet：2本の直線（p・向き dp／q・向き dq）の交点
     dirTo：p から q へ向かう向き（度）　cap：図の左上に見出し（ア・イ…）をつける */
  const rad = d => d * Math.PI / 180;
  const mv = (p, d, r) => [p[0] + r * Math.cos(rad(d)), p[1] + r * Math.sin(rad(d))];
  const toY = (p, d, y) => mv(p, d, (y - p[1]) / Math.sin(rad(d)));
  const meet = (p, dp, q, dq) => {
    const u = [Math.cos(rad(dp)), Math.sin(rad(dp))], v = [Math.cos(rad(dq)), Math.sin(rad(dq))], w = [q[0] - p[0], q[1] - p[1]];
    return mv(p, dp, (w[0] * v[1] - w[1] * v[0]) / (u[0] * v[1] - u[1] * v[0]));
  };
  const dirTo = (p, q) => Math.atan2(q[1] - p[1], q[0] - p[0]) * 180 / Math.PI;
  // 平行線（点線）が頂点を通るとき、その角の字は、点線にかさならないように、点線で分かれた 2つの角のうち、ひろいほうの中にかく
  const sideTxt = (p, d1, d2, H, text, rr) => {
    const nrm = d => ((d % 360) + 540) % 360 - 180, a1 = nrm(d1 - H), a2 = nrm(d2 - H), beta = H + (Math.abs(a1) >= Math.abs(a2) ? a1 : a2) / 2;
    return { p, t: text, dx: (rr || 8.5) * Math.cos(rad(beta)), dy: -(rr || 8.5) * Math.sin(rad(beta)) };
  };
  const LS = IK.labelScale || 1;   // スライドの図を書き出すときだけ、図の字を LS 倍にする（tools/slide-src.cjs）。紙に印刷するときは 1
  // 図の見出し（ア・イ・ウ・①…）：pos＝'tl'（図の左上。頂点の字や線から離す）／'bl'（左下）
  const cap = (spec, text, pos) => {
    const ps = Object.values(spec.pts), x = Math.min(...ps.map(p => p[0])), y = Math.max(...ps.map(p => p[1])), y0 = Math.min(...ps.map(p => p[1]));
    spec.pts.CAP = pos === 'bl' ? [x - 0.1, y0 - 0.4] : [x - 0.1, y + 0.45];
    spec.txt = (spec.txt || []).concat([{ p: 'CAP', t: text, anchor: 'start', size: 3.4 * LS, dy: pos === 'bl' ? 2.5 * LS : -4.5 * LS + (LS - 1) * 1.2 }]);
    return spec;
  };

  /* ---------------- スライド用の、角の字の置き場所（labelScale＞1 のときだけ。紙に印刷するときは、何もしない） ----------------
     スライドでは、図の字が 1.8倍になる。GEO は、角の字どうしが重なるのは、少しずらすが、字が線にかかるのは直せない。
     そこで、ワークシートの図（ws）だけ、図の枠（W×H mm）から GEO と同じ縮尺を求め、角の字を、線や、ほかの字にかからない場所に置きなおす。
     まず、角の内がわ（二等分線の上）をさがし、せまくて入らないときは、角の外がわにおく（頂点のすぐ外。弧のそば）。 */
  const fit = (spec0, frame) => {
    if (!(LS > 1)) return spec0;
    const o = JSON.parse(JSON.stringify(spec0)), P = o.pts, W = frame[0], H = frame[1], srcs = [o, o.a || {}];
    const pt = k => (Array.isArray(k) ? k : P[k]);
    const polyList = src => (src.poly == null ? [] : Array.isArray(src.poly) ? src.poly : [src.poly]);
    const edges = src => {
      const out = [];
      polyList(src).forEach(pl => { const n = [...pl]; n.forEach((_, i) => out.push([pt(n[i]), pt(n[(i + 1) % n.length])])); });
      (src.segs || []).forEach(sg => { if (typeof sg === 'string') { const n = [...sg]; out.push([pt(n[0]), pt(n[1])]); } else out.push([pt(sg[0]), pt(sg[1])]); });
      return out;
    };
    const all = Object.values(P).slice();
    srcs.forEach(src => edges(src).forEach(e => all.push(e[0], e[1])));
    srcs.forEach(src => (src.txt || []).forEach(t => { if (t.p) all.push(pt(t.p)); }));
    const xs = all.map(p => p[0]), ys = all.map(p => p[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const SZ0 = o.size || 3;
    let SZ = SZ0 * LS, GROW = SZ - SZ0;
    const pad = (o.pad == null ? 7 : o.pad) + GROW, bw = Math.max(x1 - x0, 1e-6), bh = Math.max(y1 - y0, 1e-6);
    const s = o.scale || Math.min((W - 2 * pad) / bw, (H - 2 * pad) / bh), ox = (W - bw * s) / 2 - x0 * s, oy = (H - bh * s) / 2 + y1 * s;
    const X = x => ox + x * s, Y = y => oy - y * s;
    const polys = polyList(o);
    if (polys.length) {
      let minSide = Infinity;
      polys.forEach(pl => { const n = [...pl]; n.forEach((_, i) => { const a = pt(n[i]), b = pt(n[(i + 1) % n.length]); minSide = Math.min(minSide, Math.hypot((a[0] - b[0]) * s, (a[1] - b[1]) * s)); }); });
      if (isFinite(minSide)) { SZ = Math.max(SZ0, Math.min(SZ, 0.2 * minSide)); GROW = SZ - SZ0; }
    }
    const cenNames = polys.length ? [...polys.join('')] : Object.keys(P), cps = cenNames.map(n => P[n]).filter(Boolean);
    const cen = [cps.reduce((a, p) => a + p[0], 0) / cps.length, cps.reduce((a, p) => a + p[1], 0) / cps.length];
    const boxOf = (cx, cy, text, fs) => { const body = String(text).replace(/\{\{|\}\}/g, ''), blank = /\{\{/.test(String(text)); const w = [...body].reduce((a, c) => a + (c.charCodeAt(0) > 0x2e80 ? 1.0 : 0.58) * fs, 0) + (blank ? 2.4 : 0); return { cx, cy, w: w + 0.6, h: fs * 0.95 + (blank ? 1.4 : 0) }; };
    const segs = [], boxes = [], placed = [];
    srcs.forEach(src => {
      edges(src).forEach(e => segs.push([[X(e[0][0]), Y(e[0][1])], [X(e[1][0]), Y(e[1][1])]]));
      (src.segs || []).forEach(sg => {
        const op = typeof sg === 'string' ? {} : (sg[2] || {});
        if (!(op.lab || op.lab0)) return;
        const a = pt(sg[0]), b = pt(sg[1]), ex = X(b[0]) - X(a[0]), ey = Y(b[1]) - Y(a[1]), L = Math.hypot(ex, ey) || 1, d = 3.6 + GROW * 0.6;
        if (op.lab) boxes.push(boxOf(X(b[0]) + ex / L * d, Y(b[1]) + ey / L * d, op.lab, SZ));
        if (op.lab0) boxes.push(boxOf(X(a[0]) - ex / L * d, Y(a[1]) - ey / L * d, op.lab0, SZ));
      });
      let vl = src.vl; if (typeof vl === 'string') { const o2 = {}; [...vl].forEach(c => { o2[c] = c; }); vl = o2; }
      Object.keys(vl || {}).forEach(n => {
        let v = vl[n], t = n, d = null, k = 3.4 + GROW * 0.6;
        if (typeof v === 'string') t = v; else if (Array.isArray(v)) { t = v[0]; d = v[1]; if (v[2] != null) k = v[2] + GROW * 0.6; } else if (v) { t = v.t != null ? v.t : n; d = v.d != null ? v.d : null; if (v.k != null) k = v.k + GROW * 0.6; }
        const p = P[n];
        if (d == null) { const dx = p[0] - cen[0], dy = p[1] - cen[1]; d = (Math.abs(dx) + Math.abs(dy) < 1e-9) ? 90 : Math.atan2(dy, dx) * 180 / Math.PI; }
        boxes.push(boxOf(X(p[0]) + k * Math.cos(d * Math.PI / 180), Y(p[1]) - k * Math.sin(d * Math.PI / 180), t, SZ));
      });
      (src.txt || []).forEach(t => {
        const p = pt(t.p), fs = t.size || SZ, bx = boxOf(X(p[0]) + (t.dx || 0), Y(p[1]) + (t.dy || 0), t.t, fs);
        if (t.anchor === 'start') bx.cx += bx.w / 2; else if (t.anchor === 'end') bx.cx -= bx.w / 2;
        boxes.push(bx);
      });
    });
    // 角の弧（どの角のも）。字がかからないように、点にして、おぼえておく
    const arcPts = [];
    srcs.forEach(src => (src.ang || []).forEach(an => {
      if (an.right) return;
      const V = pt(an.at), A = pt(an.a), C = pt(an.b), vx = X(V[0]), vy = Y(V[1]), ta = Math.atan2(-(Y(A[1]) - vy), X(A[0]) - vx), tb = Math.atan2(-(Y(C[1]) - vy), X(C[0]) - vx);
      let d = ((tb - ta) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI), st = ta, sw = d; if (d > Math.PI) { st = tb; sw = 2 * Math.PI - d; }
      for (let k = 0; k < (an.n || 1); k++) for (let i = 0; i <= 12; i++) { const q = st + sw * i / 12, rr = (an.r || 5) + k * 1.3; arcPts.push([vx + rr * Math.cos(q), vy - rr * Math.sin(q)]); }
    }));
    const clear = (b, vx, vy, r) => {   // 箱 b が、線・弧・ほかの字・この角の弧（半径 r）にかからない
      const hw = b.w / 2 + 0.7, hh = b.h / 2 + 0.7;
      for (const sg of segs) {
        const n = Math.max(2, Math.ceil(Math.hypot(sg[1][0] - sg[0][0], sg[1][1] - sg[0][1]) / 0.4));
        for (let i = 0; i <= n; i++) { const x = sg[0][0] + (sg[1][0] - sg[0][0]) * i / n, y = sg[0][1] + (sg[1][1] - sg[0][1]) * i / n; if (Math.abs(x - b.cx) < hw && Math.abs(y - b.cy) < hh) return false; }
      }
      for (const q of arcPts) if (Math.abs(q[0] - b.cx) < hw && Math.abs(q[1] - b.cy) < hh) return false;
      for (const c of boxes.concat(placed)) if (Math.abs(b.cx - c.cx) < (b.w + c.w) / 2 + 0.4 && Math.abs(b.cy - c.cy) < (b.h + c.h) / 2 + 0.4) return false;
      const ddx = Math.max(Math.abs(vx - b.cx) - b.w / 2, 0), ddy = Math.max(Math.abs(vy - b.cy) - b.h / 2, 0);
      return Math.hypot(ddx, ddy) >= r + 0.9;
    };
    const todo = [];
    srcs.forEach(src => (src.ang || []).forEach(an => { if (!(an.right || an.t == null || an.t === '')) todo.push({ src, an }); }));
    const wedge = e => { const V = pt(e.an.at), A = pt(e.an.a), C = pt(e.an.b), a1 = Math.atan2(A[1] - V[1], A[0] - V[0]), a2 = Math.atan2(C[1] - V[1], C[0] - V[0]); let d = Math.abs(a1 - a2); return d > Math.PI ? 2 * Math.PI - d : d; };
    todo.sort((p, q) => wedge(p) - wedge(q));   // せまい角の字を、先に置く
    // 頂点の位置（字の候補が、ほかの頂点のほうに近いと、まちがえやすい）
    const verts = {};
    srcs.forEach(src => { let vl = src.vl; if (typeof vl === 'string') { const o2 = {}; [...vl].forEach(c => { o2[c] = c; }); vl = o2; } Object.keys(vl || {}).forEach(n => { if (P[n]) verts[n] = [X(P[n][0]), Y(P[n][1])]; }); });
    todo.forEach(({ src, an }) => {
      const V = pt(an.at), A = pt(an.a), C = pt(an.b), vx = X(V[0]), vy = Y(V[1]), r = an.r || 5;
      const ua = [X(A[0]) - vx, Y(A[1]) - vy], uc = [X(C[0]) - vx, Y(C[1]) - vy], la = Math.hypot(...ua), lc = Math.hypot(...uc);
      let bxv = ua[0] / la + uc[0] / lc, byv = ua[1] / la + uc[1] / lc; const bl = Math.hypot(bxv, byv) || 1; bxv /= bl; byv /= bl;
      const half = Math.acos(Math.max(-1, Math.min(1, (ua[0] * uc[0] + ua[1] * uc[1]) / (la * lc)))) / 2, bAng = Math.atan2(byv, bxv);
      const text = String(an.t), arcMid = [vx + r * bxv, vy + r * byv];
      let best = null;
      for (const f of [1, 0.88, 0.78]) {   // 字の大きさ（SZ の何倍か）。大きいほうを先に
        const fs = SZ * f;
        for (let th = 0; th < 360; th += 10) {
          const ang = th * Math.PI / 180, dx = Math.cos(ang), dy = Math.sin(ang);
          let dd = Math.abs(((ang - bAng) % (2 * Math.PI) + 3 * Math.PI) % (2 * Math.PI) - Math.PI);   // bisector からのずれ
          const inside = dd <= half * 0.9;
          for (let rho = r + 2.0; rho <= r + 22; rho += 0.5) {
            const b = boxOf(vx + rho * dx, vy + rho * dy, text, fs);
            if (b.cx - b.w / 2 < 1.5 || b.cx + b.w / 2 > W - 1.5 || b.cy - b.h / 2 < 1.5 || b.cy + b.h / 2 > H - 1.5) continue;
            if (!clear(b, vx, vy, r)) continue;
            if (Object.keys(verts).some(n => Math.hypot(verts[n][0] - vx, verts[n][1] - vy) > 0.5 && Math.hypot(verts[n][0] - b.cx, verts[n][1] - b.cy) < rho * 0.95)) continue;   // ほかの頂点のほうが近い
            const sc = Math.hypot(b.cx - arcMid[0], b.cy - arcMid[1]) + (inside ? 0 : 3.5);
            if (!best || sc < best.sc - 1e-9 || (f < best.f && sc < best.sc + 0)) best = { sc, f, fs, rho, dx, dy, th, b, inside, dd };
            break;   // この向きでは、いちばん近いところで十分
          }
        }
        if (best && best.sc <= 14) break;   // 十分近くにおけたら、小さい字にしない
      }
      if (!best) return;
      placed.push(best.b);
      if (best.f === 1 && best.inside && best.dd < 0.12) an.lr = Math.round((best.rho - 0.7 * GROW) * 100) / 100;
      else { src.txt = (src.txt || []).concat([{ p: V, t: text, dx: best.rho * best.dx, dy: best.rho * best.dy, size: Math.round(best.fs * 100) / 100 }]); delete an.t; }
    });
    return o;
  };

  /* ---------------- 図の部品 ----------------
     平行線 ℓ（上。y＝HL）と m（下。y＝0）、x は x0〜x1。平行のしるし（＞）は、右はしに 1つずつ */
  const lines2 = (HL, x0, x1) => ({ L1: [x0, HL], L2: [x1, HL], M1: [x0, 0], M2: [x1, 0] });
  const parMarks = (HL, x1) => [[[x1 - 1.7, HL], [x1 - 0.6, HL], 1], [[x1 - 1.7, 0], [x1 - 0.6, 0], 1]];
  const LM = [['L1', 'L2', { lab: 'ℓ' }], ['M1', 'M2', { lab: 'm' }]];
  const FIGS = [];   // 検算（checks）に渡す、すべての図
  const reg = (name, spec) => { spec.name = name; FIGS.push(spec); return spec; };
  const ON = [['A', 'L1', 'L2'], ['C', 'M1', 'M2']];   // 点 A が ℓ 上、点 C が m 上にあること（検算用）

  // 折れ線（1回）：ℓ上の A、m上の C、間の E。∠A＝a、∠C＝c、∠AEC＝a+c（A も C も E より左）。lab＝{ A, E, C } の字。解答では、E を通る平行線（赤い点線）
  const zig1 = (name, a, c, lab, xv) => {
    const HL = 4.2, E = [5.4, 1.8], A = toY(E, 180 - a, HL), C = toY(E, 180 + c, 0), x0 = Math.min(A[0], C[0]) - 1.5, x1 = E[0] + 2.6;
    const pts = Object.assign({ A, E, C, D1: [E[0] - 3.1, E[1]], D2: [E[0] + 2.4, E[1]] }, lines2(HL, x0, x1));
    return reg(name, {
      pts, segs: [['A', 'E'], ['E', 'C']].concat(LM), par: parMarks(HL, x1), on: ON,
      vl: { A: ['A', 135], E: ['E', 35, 3.8], C: ['C', 225] },
      ang: [{ at: 'A', a: 'L2', b: 'E', t: lab.A }, { at: 'C', a: 'M2', b: 'E', t: lab.C }, LS > 1 ? { at: 'E', a: 'A', b: 'C', t: lab.E } : { at: 'E', a: 'A', b: 'C', v: lab.E }],
      txt: LS > 1 ? [] : [sideTxt('E', 180 - a, 180 + c, 180, lab.E)],
      a: { segs: [['D1', 'D2', { dash: 1 }]], ang: [{ at: 'E', a: 'D1', b: 'A', t: a + '°', r: LS > 1 ? 8 : 12, lr: 19 }, { at: 'E', a: 'D1', b: 'C', t: c + '°', r: LS > 1 ? 8 : 12, lr: 19 }] },
      xv: xv == null ? a + c : xv
    });
  };
  // ブーメラン形 A-B-D-C（D がへこんだ頂点）：∠BAC＝A0、∠ABD＝b、∠ACD＝c、∠BDC＝A0+b+c。解答では、BD をのばして AC との交点 E（赤い点線）
  const dart = (name, A0, b, c, lab, xv, lrC) => {
    const A = [0, 6], B = mv(A, -90 - A0 / 2, 6.2), C = mv(A, -90 + A0 / 2, 5.8);
    const dBD = dirTo(B, A) - b, dCD = dirTo(C, A) + c, D = meet(B, dBD, C, dCD), E = meet(B, dBD, A, dirTo(A, C));
    return reg(name, {
      pts: { A, B, C, D, E }, segs: [['A', 'B'], ['A', 'C'], ['B', 'D'], ['D', 'C']],
      vl: { A: ['A', 90], B: ['B', 200], C: ['C', 340], D: ['D', 115, 3.8] },
      ang: [{ at: 'A', a: 'B', b: 'C', t: lab.A, lr: Math.round(560 / A0) }, { at: 'B', a: 'A', b: 'D', t: lab.B, r: 6, lr: 11 }, { at: 'C', a: 'A', b: 'D', t: lab.C, r: 6, lr: lrC || 11 }, { at: 'D', a: 'B', b: 'C', t: lab.D, lr: 9 }],
      a: { segs: [['D', 'E', { dash: 1 }]], vl: { E: ['E', 40] }, ang: [{ at: 'E', a: 'D', b: 'C', r: 6, v: (A0 + b) + '°' }], txt: [{ p: 'E', t: (A0 + b) + '°', dx: 8, dy: 3.5 }] },
      xv
    });
  };
  // 折れ線（2回）：A（ℓ上）→E→F→C（m上）。∠A＝a、∠AEF＝e、∠C＝c、∠EFC＝e+c−a（N の字）
  const zig2 = (name, a, e, c, lab) => {
    const HL = 5, A = [2, HL], E = toY(A, -a, 3.7), F = toY(E, 180 - a + e, 1.7), C = toY(F, -c, 0), x0 = 0.3, x1 = Math.max(E[0], C[0]) + 2.2;
    return reg(name, {
      pts: Object.assign({ A, E, F, C }, lines2(HL, x0, x1)), segs: [['A', 'E'], ['E', 'F'], ['F', 'C']].concat(LM), par: parMarks(HL, x1), on: ON,
      vl: { A: ['A', 135], E: ['E', 0], F: ['F', 180], C: ['C', 270] },
      ang: [{ at: 'A', a: 'L2', b: 'E', t: lab.A }, { at: 'E', a: 'A', b: 'F', t: lab.E }, { at: 'F', a: 'E', b: 'C', t: lab.F }, { at: 'C', a: 'M1', b: 'F', t: lab.C }],
      xv: e + c - a
    });
  };
  // 折れ線（2回・コの字）：A→E→F→C。∠A＝a、∠AEF＝e、∠EFC＝f、∠C＝c。e+f＝a+c+180。F は、E の真下（e＝a+90 のとき）。解答では、E・F を通る平行線
  const kou = (name, a, e, f, lab) => {
    const HL = 6.2, A = [2, HL], E = toY(A, -a, 4.6), F = toY(E, 180 - a + e, 2.0), C = toY(F, e - a + f, 0), x0 = 0.3, x1 = Math.max(E[0], F[0]) + 3.4;
    const pts = Object.assign({ A, E, F, C, E1: [E[0] - 3, E[1]], E2: [E[0] + 2.2, E[1]], F1: [F[0] - 3, F[1]], F2: [F[0] + 2.2, F[1]] }, lines2(HL, x0, x1));
    return reg(name, {
      pts, segs: [['A', 'E'], ['E', 'F'], ['F', 'C']].concat(LM), par: parMarks(HL, x1), on: ON,
      vl: { A: ['A', 135], E: ['E', 35, 3.8], F: ['F', 325, 3.8], C: ['C', 270] },
      ang: [{ at: 'A', a: 'L2', b: 'E', t: lab.A }, { at: 'E', a: 'A', b: 'F', t: lab.E }, { at: 'F', a: 'E', b: 'C', t: lab.F }, { at: 'C', a: 'M2', b: 'F', t: lab.C }],
      a: { segs: [['E1', 'E2', { dash: 1 }], ['F1', 'F2', { dash: 1 }]], ang: [{ at: 'E', a: 'E1', b: 'A', t: a + '°', r: 8, lr: 15 }, { at: 'E', a: 'E1', b: 'F', v: (e - a) + '°', r: 8 }, { at: 'F', a: 'F1', b: 'E', v: (180 - e + a) + '°', r: 8 }, { at: 'F', a: 'F1', b: 'C', t: (f - 180 + e - a) + '°', r: 8, lr: 15 }] },
      xv: f
    });
  };
  // 折れ線（3回）：A→E→F→G→C。∠A＝a、∠AEF＝e、∠EFG＝f、∠FGC＝g、∠C＝c。a+f+c＝e+g
  const zig3 = (name, a, e, f, g, lab) => {
    const HL = 5.4, A = [1.6, HL], E = toY(A, -a, 4.2), F = toY(E, 180 - a + e, 2.8), G = toY(F, e - a - f, 1.2), C = toY(G, e - a - f + 180 + g, 0), x0 = 0.2, x1 = Math.max(E[0], G[0]) + 3.2;
    const pts = Object.assign({ A, E, F, G, C, E1: [E[0] - 3, E[1]], E2: [E[0] + 2.2, E[1]], F1: [F[0] - 3, F[1]], F2: [F[0] + 2.2, F[1]], G1: [G[0] - 3, G[1]], G2: [G[0] + 2.2, G[1]] }, lines2(HL, x0, x1));
    return reg(name, {
      pts, segs: [['A', 'E'], ['E', 'F'], ['F', 'G'], ['G', 'C']].concat(LM), par: parMarks(HL, x1), on: ON,
      vl: { A: ['A', 135], E: ['E', 35, 3.8], F: ['F', 145, 3.8], G: ['G', 325, 3.8], C: ['C', 270] },
      ang: [{ at: 'A', a: 'L2', b: 'E', t: lab.A }, { at: 'E', a: 'A', b: 'F', v: lab.E }, { at: 'F', a: 'E', b: 'G', v: lab.F }, { at: 'G', a: 'F', b: 'C', v: lab.G }, { at: 'C', a: 'M2', b: 'G', t: lab.C }],
      txt: [sideTxt('E', 180 - a, 180 - a + e, 180, lab.E), sideTxt('F', e - a, e - a - f, 0, lab.F), sideTxt('G', e - a - f + 180, e - a - f + 180 + g, 180, lab.G)],
      a: { segs: [['E1', 'E2', { dash: 1 }], ['F1', 'F2', { dash: 1 }], ['G1', 'G2', { dash: 1 }]] },
      xv: f
    });
  };
  // 45°の三角定規 ABC（∠C＝90°、∠A＝∠B＝45°）：A が ℓ上、C が m上。ℓ と AB のなす角が p のとき、m と CB のなす角は 45−p。解答では、B を通る平行線
  const ruler = (name, p, lab) => {
    const HL = 4.2, A = [1.2, HL], len = HL / Math.sin(rad(p + 45)), C = mv(A, -(p + 45), len), Bp = mv(A, -p, len * Math.SQRT2), x1 = Bp[0] + 2.6;
    const pts = Object.assign({ A, B: Bp, C, N1: [Bp[0] - 3.2, Bp[1]], N2: [Bp[0] + 2.2, Bp[1]] }, lines2(HL, 0.2, x1));
    return reg(name, {
      pts, segs: [['A', 'B'], ['A', 'C'], ['C', 'B']].concat(LM), par: parMarks(HL, x1), on: ON,
      vl: { A: ['A', 135], B: ['B', 35, 3.8], C: ['C', 270] },
      ang: [{ at: 'A', a: 'L2', b: 'B', t: p + '°', r: 9 }, { at: 'A', a: 'B', b: 'C', t: '45°', r: 5, lr: 10 }, { at: 'B', a: 'A', b: 'C', t: '45°', r: 5 }, { at: 'C', a: 'A', b: 'B', right: true }, { at: 'C', a: 'M2', b: 'B', t: lab.C, r: 6, lr: 11 }],
      a: { segs: [['N1', 'N2', { dash: 1 }]], ang: [{ at: 'B', a: 'N1', b: 'A', t: p + '°', r: 7, lr: 14 }, { at: 'B', a: 'N1', b: 'C', t: (45 - p) + '°', r: 7, lr: 14 }] },
      xv: 45 - p
    });
  };
  // 正三角形 ABC：B が ℓ上、C が m上。ℓ と BA のなす角が a のとき、m と CA のなす角は 60−a。解答では、A を通る平行線
  const eqtri = (name, a, lab) => {
    const HL = 4.4, Bp = [1.4, HL], s = HL / Math.sin(rad(a + 60)), C = mv(Bp, -(a + 60), s), A = mv(Bp, -a, s), x1 = A[0] + 2.6;
    const pts = Object.assign({ A, B: Bp, C, N1: [A[0] - 3.2, A[1]], N2: [A[0] + 2.2, A[1]] }, lines2(HL, 0.2, x1));
    return reg(name, {
      pts, poly: 'ABC', segs: LM, par: parMarks(HL, x1), tick: [['A', 'B', 1], ['B', 'C', 1], ['C', 'A', 1]], on: [['B', 'L1', 'L2'], ['C', 'M1', 'M2']],
      vl: { A: ['A', 35, 3.8], B: ['B', 135], C: ['C', 270] },
      ang: [{ at: 'B', a: 'L2', b: 'A', t: a + '°', r: 8 }, { at: 'C', a: 'M2', b: 'A', t: lab.C, r: 6, lr: 10 }],
      a: { segs: [['N1', 'N2', { dash: 1 }]], ang: [{ at: 'A', a: 'N1', b: 'B', t: a + '°', r: 7, lr: 14 }, { at: 'A', a: 'N1', b: 'C', t: (60 - a) + '°', r: 7, lr: 14 }] },
      xv: 60 - a
    });
  };
  // リボン形：AD と BC が O で交わる。∠A＝α、∠B＝β、∠C＝γ、∠D＝α+β−γ
  const ribbon = (name, al, be, ga, lab) => {
    const de = al + be - ga, ao = 180 - al - be, O = [0, 0], OB = 3.2, OA = OB * Math.sin(rad(be)) / Math.sin(rad(al)), OD = 2.3, OC = OD * Math.sin(rad(de)) / Math.sin(rad(ga));
    const A = mv(O, 145, OA), Bp = mv(O, 145 + ao, OB), C = mv(O, 145 + ao - 180, OC), D = mv(O, 325, OD);
    return reg(name, {
      pts: { A, B: Bp, C, D, O }, segs: [['A', 'D'], ['B', 'C'], ['A', 'B'], ['C', 'D']],
      vl: { A: ['A', 135], B: ['B', 225], C: ['C', 45], D: ['D', 315], O: ['O', 90, 3] },
      ang: [{ at: 'A', a: 'O', b: 'B', t: lab.A, r: 6, lr: 11 }, { at: 'B', a: 'O', b: 'A', t: lab.B, r: 6, lr: 11 }, { at: 'C', a: 'O', b: 'D', t: lab.C, r: 6, lr: 11 }, { at: 'D', a: 'O', b: 'C', t: lab.D, r: 6, lr: 11 }],
      xv: de
    });
  };
  // 正五角形 ABCDE：A が ℓ上、C が m上。m と CB のなす角が c のとき、ℓ と AE のなす角は c−36。解答では、B を通る平行線
  const pent = (name, c, lab) => {
    const a = 108 - c, s = 3, V = [[0, 0]];
    for (let k = 0; k < 4; k++) V.push(mv(V[k], -a - 72 * k, s));
    const [A, Bp, Cp, D, E] = V, x0 = Math.min(A[0], E[0], D[0]) - 2.2, x1 = Math.max(A[0], Bp[0], Cp[0]) + 3.2;
    const pts = { A, B: Bp, C: Cp, D, E, N1: [Bp[0] - 3.4, Bp[1]], N2: [Bp[0] + 2.2, Bp[1]], L1: [x0, A[1]], L2: [x1, A[1]], M1: [x0, Cp[1]], M2: [x1, Cp[1]] };
    return reg(name, {
      pts, poly: 'ABCDE', segs: LM, par: [[[x1 - 1.7, A[1]], [x1 - 0.6, A[1]], 1], [[x1 - 1.7, Cp[1]], [x1 - 0.6, Cp[1]], 1]], tick: [['A', 'B', 1], ['B', 'C', 1], ['C', 'D', 1], ['D', 'E', 1], ['E', 'A', 1]], on: ON,
      vl: { A: ['A', 60], B: ['B', 35, 3.8], C: ['C', 315], D: ['D', 195], E: ['E', 180] },
      ang: [{ at: 'C', a: 'M2', b: 'B', t: c + '°', r: 7 }, { at: 'A', a: 'L1', b: 'E', t: lab.A, r: 7, lr: 11 }],
      a: { segs: [['N1', 'N2', { dash: 1 }]], ang: [{ at: 'B', a: 'N1', b: 'A', t: a + '°', r: 7, lr: 14 }, { at: 'B', a: 'N1', b: 'C', t: c + '°', r: 7, lr: 14 }] },
      xv: c - 36
    });
  };
  // 星形：先の角（A〜E）の和は 180°。星の線は A→C→E→B→D→A の 1本の道。x は、字が 'x' の先の角（xv）
  const star = (name, tips, lab) => {
    const order = ['A', 'C', 'E', 'B', 'D'], ang0 = order.map(k => tips[k]);
    const dirs = [0]; for (let k = 1; k < 5; k++) dirs.push(dirs[k - 1] + 180 - ang0[k]);
    const u = d => [Math.cos(rad(d)), Math.sin(rad(d))];
    let V = null;
    for (const s2 of [1, 1.2, 0.8, 1.4, 0.6, 1.6]) {   // 辺の長さ s0＝1、s1＝1.1、s2、のこり 2辺は、閉じるように決める
      const s = [1, 1.1, s2], r = [0, 1].map(i => -(s[0] * u(dirs[0])[i] + s[1] * u(dirs[1])[i] + s[2] * u(dirs[2])[i])), u3 = u(dirs[3]), u4 = u(dirs[4]), det = u3[0] * u4[1] - u4[0] * u3[1];
      const s3 = (r[0] * u4[1] - u4[0] * r[1]) / det, s4 = (u3[0] * r[1] - r[0] * u3[1]) / det;
      if (s3 > 0.4 && s4 > 0.4) { s.push(s3, s4); V = [[0, 0]]; for (let k = 0; k < 5; k++) V.push(mv(V[k], dirs[k], s[k])); break; }
    }
    const P = {}; order.forEach((k, i) => { P[k] = V[i]; });
    const cx = Object.values(P).reduce((a, p) => a + p[0], 0) / 5, cy = Object.values(P).reduce((a, p) => a + p[1], 0) / 5, rot = 90 - dirTo([cx, cy], P.A);   // A が真上に来るように回す
    Object.keys(P).forEach(k => { const d = Math.hypot(P[k][0] - cx, P[k][1] - cy), t = dirTo([cx, cy], P[k]) + rot; P[k] = [cx + d * Math.cos(rad(t)), cy + d * Math.sin(rad(t))]; });
    // 先の角は、先がせまいので、角の値は先の外がわに書く（弧は先にかく）。字（A〜E）は、そのさらに外がわ
    const outDir = k => dirTo([cx, cy], P[k]), txt = [], vl = {};
    const angs = ['A', 'B', 'C', 'D', 'E'].map(k => {
      const i = order.indexOf(k), nb = [order[(i + 1) % 5], order[(i + 4) % 5]], d = outDir(k);
      txt.push({ p: k, t: lab[k], dx: 4.8 * Math.cos(rad(d)), dy: -4.8 * Math.sin(rad(d)) });
      vl[k] = [k, d, 9.6];
      return { at: k, a: nb[0], b: nb[1], v: lab[k], r: 5 };
    });
    return reg(name, { pts: P, pad: 13, segs: ['AC', 'CE', 'EB', 'BD', 'DA'], vl, txt, ang: angs, xv: 180 - Object.keys(lab).filter(k => lab[k] !== 'x').reduce((a, k) => a + tips[k], 0), tips });
  };

  /* ---------------- 問題の図 ---------------- */
  const Z_T = zig1('学習課題', 35, 50, { A: '35°', E: 'x', C: '50°' });                        // ∠x＝85°
  const Z_E = dart('例題', 40, 35, 30, { A: '{{40°}}', B: '{{35°}}', C: '{{30°}}', D: 'x' }, 105);   // ∠BDC＝105°
  const Z_TA = cap(zig2('考えよう ア', 35, 80, 25, { A: '35°', E: '80°', F: 'x', C: '25°' }), 'ア');          // ∠x＝70°
  const Z_TI = cap(dart('考えよう イ', 50, 40, 35, { A: '50°', B: 'x', C: '35°', D: '125°' }, 40), 'イ');       // ∠ABD＝40°
  const Z_TU = cap(ruler('考えよう ウ', 25, { C: 'x' }), 'ウ', 'bl');                                             // ∠x＝20°
  for (const z of [Z_TI, Z_TU, Z_TA]) delete z.a;   // 考えようの図には、答え（補助線）を出さない
  const Z_EX = dart('発展', 40, 35, 30, { A: '40°', B: '35°', C: '30°', D: 'x' }, 105); delete Z_EX.a;
  const Z_D1 = zig1('基礎（1）①', 40, 30, { A: '40°', E: 'x', C: '30°' });                    // 70°
  const Z_D2 = zig1('基礎（1）②', 55, 40, { A: '55°', E: '95°', C: 'x' }, 40);                // 40°
  const Z_D3 = dart('基礎（1）③', 50, 35, 40, { A: '50°', B: '35°', C: '40°', D: 'x' }, 125, 16);  // 125°
  const Z_D4 = kou('標準（2）', 35, 125, 120, { A: '35°', E: '125°', F: 'x', C: '30°' });      // 120°
  const Z_D5 = eqtri('標準（3）', 24, { C: 'x' });                                             // 36°
  const Z_D6 = zig3('応用（4）', 35, 80, 100, 95, { A: '35°', E: '80°', F: 'x', G: '95°', C: '40°' });   // 100°
  const Z_D7 = ribbon('応用（5）', 65, 45, 30, { A: '65°', B: '45°', C: '30°', D: 'x' });       // 80°
  const Z_D8 = pent('入試（6）', 58, { A: 'x' });                                              // 22°
  const Z_D9 = star('入試（7）', { A: 34, B: 41, C: 27, D: 46, E: 32 }, { A: '34°', B: '41°', C: '27°', D: '46°', E: 'x' });   // 32°
  const Z_Q1 = zig1('小テスト（1）', 28, 47, { A: '28°', E: 'x', C: '47°' });                 // 75°
  const Z_Q2 = dart('小テスト（2）', 60, 25, 30, { A: '60°', B: '25°', C: '30°', D: 'x' }, 115);   // 115°
  const Z_Q3 = zig1('小テスト（3）', 45, 65, { A: 'x', E: '110°', C: '65°' }, 45);             // 45°
  const Z_QC = zig2('小テスト チャレンジ', 28, 95, 21, { A: '28°', E: '95°', F: 'x', C: '21°' });   // 88°
  for (const z of [Z_Q1, Z_Q2, Z_Q3, Z_QC]) delete z.a;

  /* ---------------- 答えの文（画面にも検算にも、同じ文字列を使う） ---------------- */
  const T_W = 'E を通り、ℓ に平行な直線をひく。\n平行線の錯角は等しいから、35° の錯角と 50° の錯角ができる。\n∠x＝35°+50°＝85°';
  const T_E = 'BD を延長して、AC との交点を E とする。\n△ABE の外角だから　∠DEC＝40°+35°＝75°\n△DEC の外角だから　∠x＝75°+30°＝105°\n（∠x＝∠BAC+∠ABD+∠ACD）';
  const T_D1 = '① 40°+30°＝70°　（E を通り ℓ に平行な直線をひく）\n② 55°+∠x＝95°　　∠x＝95°−55°＝40°\n③ 50°+35°+40°＝125°　（BD をのばして AC と交わらせる）';
  const T_D3 = 'E、F を通り ℓ に平行な直線をひく。\nE では　125°−35°＝90°（35° は ∠A の錯角）\nF では　180°−90°＝90°、また 30° は ∠C の錯角\n∠x＝90°+30°＝120°';
  const T_D4 = 'A を通り ℓ に平行な直線をひく。\n錯角から　∠BAC＝24°+∠x\n正三角形の 1つの内角は 60° だから　24°+∠x＝60°\n∠x＝60°−24°＝36°';
  const T_D5 = 'E、F、G を通り ℓ に平行な直線をひくと、錯角から\n35°+∠x+40°＝80°+95°\n∠x＝175°−75°＝100°';
  const T_D6 = '△AOB で　∠AOB＝180°−65°−45°＝70°\n対頂角だから　∠COD＝70°\n△COD で　∠x＝180°−70°−30°＝80°\n② ∠A+∠B＝180°−∠AOB、∠C+∠D＝180°−∠COD で、∠AOB＝∠COD だから、等しい';
  const T_D7 = 'B を通り ℓ に平行な直線をひく。\n錯角から　∠ABC＝∠a+58°（∠a は ℓ と AB のなす角）\n正五角形の内角は 108° だから　∠a＝108°−58°＝50°\n∠x＝180°−108°−50°＝22°';
  const T_D8 = 'AB を結び、AC と BE の交点を P とする。\n△PCE と △ABP の外角から　∠PAB+∠PBA＝∠C+∠E\n△ABD の内角の和から　∠A+∠B+∠D+∠C+∠E＝180°\n（5つの先の角の和は 180°）\n∠x＝180°−(34°+41°+27°+46°)＝32°';
  const T_Q1 = 'E を通り ℓ に平行な直線をひく。\n∠x＝28°+47°＝75°';
  const T_Q2 = 'BD を延長して AC と交わらせる（または AD を延長する）。\n∠x＝60°+25°+30°＝115°';
  const T_Q3 = 'E を通り ℓ に平行な直線をひく。\n∠x+65°＝110°　　∠x＝110°−65°＝45°';
  const T_QC = 'E、F を通り ℓ に平行な直線をひくと\n28°+∠x＝95°+21°\n∠x＝116°−28°＝88°';

  /* ---------------- 検算の道具（checks の式の中に、そのまま埋めこむ） ----------------
     figCheck：すべての図で、角を座標から測り直して、図の字（35° など）・x の答え・平行・等しい辺・点が線の上にあることを確かめる
     arith：答えの文の中の、数だけの式（35°+50°＝85° など）が計算として合うか */
  const figCheck = F => {
    const ang = (P, Q, R) => { const a = Math.atan2(P[1] - Q[1], P[0] - Q[0]), b = Math.atan2(R[1] - Q[1], R[0] - Q[0]); const d = Math.abs(a - b) * 180 / Math.PI; return d > 180 ? 360 - d : d; };
    const cr = (p, q, r, s) => (q[0] - p[0]) * (s[1] - r[1]) - (q[1] - p[1]) * (s[0] - r[0]);
    return F.length > 15 && F.every(f => {
      const P = f.pts, pt = k => (typeof k === 'string' ? P[k] : k), len = (a, b) => Math.hypot(P[a][0] - P[b][0], P[a][1] - P[b][1]);
      const angOK = L => (L || []).every(an => {
        const m = ang(pt(an.a), P[an.at], pt(an.b));
        if (an.right) return Math.abs(m - 90) < 0.05;
        const t = String(an.t != null ? an.t : an.v != null ? an.v : '').replace(/[{}]/g, '');
        if (t === 'x') return Math.abs(m - f.xv) < 0.05;
        const v = parseFloat(t);
        return isNaN(v) || Math.abs(m - v) < 0.05;
      });
      const par = (f.par || []).every(p => Math.abs(cr(pt(p[0]), pt(p[1]), pt(f.par[0][0]), pt(f.par[0][1]))) < 1e-9);
      const on = (f.on || []).every(o => Math.abs(cr(P[o[1]], P[o[2]], P[o[1]], P[o[0]])) < 1e-9);
      const tk = f.tick || [], tickOK = tk.every(t => Math.abs(len(t[0], t[1]) - len(tk[0][0], tk[0][1])) < 1e-9);
      const xs = (f.ang || []).filter(an => an.t === 'x').length;
      return angOK(f.ang) && angOK(f.a && f.a.ang) && xs <= 1 && par && on && tickOK && Number.isFinite(f.xv);
    });
  };
  const arith = t => String(t).split('\n').every(line => {
    const s = line.replace(/°/g, '').replace(/−/g, '-'), re = /[0-9+\-＝().]+/g;
    let m, ok = true;
    while ((m = re.exec(s))) {
      let r = m[0];
      if (/^[+\-]/.test(r) || /[+\-]$/.test(r)) continue;   // 文字（x や ∠A）のとなりの、とちゅうの式は、とばす
      if (r[0] === '＝') r = r.slice(1);
      const parts = r.split('＝').filter(z => z !== '');
      if (parts.length < 2 || r.split('(').length !== r.split(')').length || /^[).]|[(.]$/.test(r)) continue;
      const v = parts.map(z => { try { return new Function('return ' + z)(); } catch (e) { return NaN; } });
      if (!v.every(w => Math.abs(w - v[0]) < 1e-9)) ok = false;
    }
    return ok;
  });
  const FIGCHK = '/* 平行と合同 第7時：すべての図で、角を座標から測り直して、図の字・答え・平行・等しい辺・点の位置が合うか */ (' + figCheck + ')(' + J(FIGS) + ')';
  const ARITH = '/* 答えの文の中の、数だけの式（35°+50°＝85° など）が合うか */ (() => { const arith = ' + arith + '; return ' + J([T_W, T_E, T_D1, T_D3, T_D4, T_D5, T_D6, T_D7, T_D8, T_Q1, T_Q2, T_Q3, T_QC]) + '.every(arith); })()';

  IK.lesson('heikou-07', {
    unit: 'heikou', unitName: '平行と合同', no: '第7時', title: '補助線をひいて、角度のなぞを解こう',
    summary: '平行線の間の折れ線・ブーメラン形・三角定規・星形など、角度のなぞを、補助線をひいて解く。補助線のひき方を何通りも見つけ、うまくいく補助線の共通点をことばにする。',
    head: '平行と合同　第7時',
    checks: [
      FIGCHK,
      // 学習課題 35°+50°＝85°、例題 40°+35°+30°＝105°（外角 75°）
      'near(35 + 50, 85) && near(40 + 35, 75) && near(75 + 30, 105) && near(40 + 35 + 30, 105)',
      // 考えよう（答えは載せない。ここで確かめるだけ）：ア e+c−a＝80+25−35＝70、イ 125−50−35＝40、ウ 45−25＝20
      'near(80 + 25 - 35, 70) && near(125 - 50 - 35, 40) && near(45 - 25, 20) && near(25 + 20, 45)',
      // 発展：BD をのばさずに、△ABC の内角の和と △DBC で確かめる（∠A+∠B+∠C＝∠x）。A を通る BD の延長でも同じ
      '[[40, 35, 30], [50, 45, 25], [70, 20, 10]].every(([a, b, c]) => near((180 - a - b - c) + (a + b + c), 180) && near(180 - (180 - a - b - c), a + b + c))',
      // 基礎 ①70 ②40 ③125　標準（2）e+f＝a+c+180：125+120＝35+30+180　（3）60−24＝36
      'near(40 + 30, 70) && near(95 - 55, 40) && near(50 + 35 + 40, 125) && near(125 + 120, 35 + 30 + 180) && near(125 - 35, 90) && near(180 - 90, 90) && near(90 + 30, 120) && near(60 - 24, 36)',
      // 応用（4）a+f+c＝e+g：35+100+40＝80+95　（5）リボン形 65+45＝30+80、∠AOB＝70
      'near(35 + 100 + 40, 80 + 95) && near(175 - 75, 100) && near(180 - 65 - 45, 70) && near(180 - 70 - 30, 80) && near(65 + 45, 30 + 80)',
      // 入試（6）正五角形の内角 180×3÷5＝108、a＝108−58＝50、x＝180−108−50＝22　（7）星形 180−148＝32
      'near(180 * 3 / 5, 108) && near(108 - 58, 50) && near(180 - 108 - 50, 22) && near(58 - 36, 22) && near(34 + 41 + 27 + 46 + 32, 180) && near(180 - (34 + 41 + 27 + 46), 32)',
      // 小テスト 28+47＝75、45+30+35＝110、110−65＝45、チャレンジ 95+21−28＝88
      'near(28 + 47, 75) && near(60 + 25 + 30, 115) && near(110 - 65, 45) && near(95 + 21 - 28, 88)',
      ARITH
    ],

    /* ================= 授業計画 ================= */
    plan: {
      type: '遊（ゲーム・活動）',
      aim: '補助線をひいて、平行線の性質・内角の和・外角の性質が使える形にして、角の大きさを求め、どの性質を使ったか説明できる。',
      flow: [
        { g: '導入', m: 3, scene: 'ペア学習', do: '前時の重要語句（外角・外角の和）を、ペアで1人1問ずつ出題し合う。', st: '言葉の意味を、自分の言葉で言う。', note: '静かに、時間を切って。緊張感をつくる。' },
        { g: '小テスト', m: 7, scene: '小テスト', do: '前時分の小テスト。自己採点と回収まで。', st: '静かに取り組む。', note: '5分＋答え合わせ・回収 2分。10点満点。チャレンジは別枠（正解で満点）。' },
        { g: '解説', m: 4, scene: '学習課題', do: 'めあてを書く。ℓ∥m の折れ線で、∠x を求めるには、どこに補助線をひくか。図にかきこみ、個人→ペア。', q: ['35° と 50° は、∠x とつながっているだろうか。どこに線をひくと、つながるだろう。'], st: '折れ目 E を通る平行線をひく。錯角が等しいので 35°+50°＝85°。', note: 'ひき方は 1つとは限らない。出た案は、ほめて板書。' },
        { g: '解説', m: 3, scene: 'ことば', do: '補助線と、使う道具（平行線の性質・内角の和・外角の性質）を押さえる。空欄は、先生が言ってから書かせる。', st: '空欄に書き込む。', note: '補助線の「ねらい」は、ここでは言わない（考えようで見つける）。' },
        { g: '解説', m: 5, scene: '例題', do: 'ブーメラン形で ∠x（∠BDC）を求める。BD をのばして AC と交わらせ、外角の性質を 2回使う。', q: ['この図には、平行線がない。どんな補助線がひけるだろう。'], st: 'BD をのばして三角形をつくる。75° → 105°。', note: '数字は、先生が言ってから書かせる。' },
        { g: '演習', m: 2, scene: '演習① ルールの提示', do: 'ゴールは、考えよう（ワークシート裏）のア〜ウを解き、ひき方を友達に説明できること。ひき方を 1つ見つけたら 1点、説明できたら＋1点（ペア）。立ち歩きOK、解答は教卓。', st: '', note: '答えが同じになることが、確かめる手がかり。' },
        { g: '演習', m: 5, scene: '演習② 基礎', do: '基礎（個人）。解いたら、教卓の解答で答え合わせ。早く終わったら、考えようへ。', st: '基礎 →（終わった人から）考えようへ。', note: '解答は教卓。セルフチェック。' },
        { g: '演習', m: 14, scene: '演習③ 考えよう＋標準（学び合い）', do: '立ち歩きで、補助線のひき方を見せ合い、使った性質を説明し合う。先生は回って、ちがうひき方を拾い、必要なら短く全体に戻す。', st: '補助線をひく → 求める → ちがうひき方で確かめる → 共通点をことばにする。', note: '判断：ひけない→共有／ヒント1／止まる→ヒント2・3／残り5分→指名。答えは言わない。' },
        { g: '演習', m: 2, scene: '演習④ 方向性', do: '答えは示さず、方向性だけを一言で伝える（下の枠）。', st: '', note: '' },
        { g: '振り返り', m: 5, scene: '振り返り・回収', do: '今日わかったことを、ペアで1つずつ言い合う。ワークシートと演習プリントを回収（未完成でも出す）。', st: '今日わかったことを、口で言う。', note: '' }
      ],
      words: ['補助線', '平行線の性質', '内角の和', '外角の性質'],
      think: {
        q: '次のア〜ウの図で、∠x の大きさを求めよう。補助線を、できるだけいろいろなひき方で見つけよう。うまくいく補助線には、どんな共通点があるだろう。',
        views: [
          '補助線をひくと、求める角が、わかっている角とつながる。ひき方は何通りもあり、答えは同じになる。',
          'ア・ウは、折れ目を通る平行線（錯角）か、線をのばした三角形（外角）。イは、BD や AD をのばす（外角）か、B と C を結ぶ（内角の和）。',
          '補助線は、「平行線をつくる」か「三角形をつくる」ことをねらってひく。どちらも、知っている性質が使える形になる。'
        ],
        hints: [
          '図に、わかっている角を書きこんで、求める角とつながりそうな角をさがす。',
          '折れ目（頂点）を通る線や、辺をのばした線を、図にかきこんでみる。',
          '新しい線と、もとの線がつくる角を、知っている性質で結びつける。'
        ],
        direction: '「補助線のひき方は、1つではなかったね。ひくときに、何をねらってひいたのか、自分のことばで言えるようにしておこう。」'
      },
      manabi: [
        { kind: '説明', text: '基礎のあと：（1）①の補助線と、使った性質を、隣の人に説明する。' },
        { kind: '比べる', text: '標準のあと：（2）（3）の補助線のひき方を、友達と比べる。' },
        { kind: '教える', text: '最後：解けなかった問題を、できた人に聞く。問題と人の名前を書く。' }
      ],
      see: [
        ['思考・判断・表現', '補助線を工夫し、使った性質を明らかにして、角を求める方法を説明しているか（考えよう）。'],
        ['知識・技能', '平行線の性質・内角の和・外角の性質を使って、角の大きさを求められるか。'],
        ['学び合い', 'ひき方を見せ合い、ちがいを説明するために動いているか。']
      ],
      tips: [
        ['補助線を、あてずっぽうにひく', '「平行線がほしい」「三角形がほしい」のどちらをねらうか、先に言わせる。'],
        ['錯角と同位角を、とりちがえる', '2直線と交わる直線を、色ペンでなぞって、位置を確かめさせる。'],
        ['答えは出たが、使った性質が言えない', '式の1つ1つに、「平行線」「内角の和」「外角」と書きこませる。']
      ],
      prep: ['図を大きくかいた掲示用の紙（折れ線・ブーメラン形）、色ペン', '小テスト（前時分）／今日の小テストは、次時のはじめ用', '教卓：3点セットの解答（考えようの答えは載せない）']
    },

    /* ================= ワークシート（両面） ================= */
    ws: [
      // ---- 表 ----
      M('補助線をひいて、角度のなぞを解こう'),
      K('学習課題', '下の図で、ℓ∥m である。∠x の大きさを求めたい。\n図に補助線をかきこんで、∠x を求めよう。どこに補助線をひくと、求められるだろう。', 3),
      C2([
        T('', '【補助線と求め方】', 1),
        B(10, T_W)
      ], [
        F(11, GEO(fit(Z_T, [72, 77])))
      ], '3:2'),
      G(1),
      WD('図形の中や外に、角を求めるためにかき入れる線を{{補助線}}という。\n平行な 2直線に 1つの直線が交わるとき、{{同位角}}も{{錯角}}も等しい。\n三角形の内角の和は{{180}}°。三角形の外角は、となりあわない 2つの{{内角}}の和に等しい。', 4),
      G(1),
      K('例題', '右の図で、∠BAC＝{{40}}°、∠ABD＝{{35}}°、∠ACD＝{{30}}° である。\n補助線をひいて、∠x（∠BDC）の大きさを求めよう。', 3),
      C2([
        T('', '【補助線と求め方】', 1),
        B(12, T_E)
      ], [
        F(13, GEO(fit(Z_E, [72, 91])))
      ], '3:2'),
      BR(),

      // ---- 裏：考えよう ----
      K('考えよう', '次のア〜ウの図で、∠x の大きさを求めよう。（ア・ウは ℓ∥m）\n補助線を、できるだけいろいろなひき方で見つけよう。うまくいく補助線には、どんな共通点があるだろう。', 3),
      F(8, GEO(fit(Z_TA, [59.3, 56])), GEO(fit(Z_TI, [59.3, 56])), GEO(fit(Z_TU, [59.3, 56]))),
      T('①', 'ア〜ウの ∠x の大きさを求めよう。補助線を、図にかきこもう。', 1),
      B(6, ''),
      T('②', '補助線の、ほかのひき方を見つけよう。ちがう色のペンで図にかきこんで、同じ答えになるか確かめよう。', 2),
      B(4, ''),
      T('③', 'うまくいった補助線には、どんな共通点があるだろう。', 1),
      B(4, ''),
      C2([
        T('発展', '演習まで解き終わった人は、考えてみよう！\n例題のブーメラン形が ∠x＝∠A+∠B+∠C になることを、例題とはちがう補助線のひき方でも、確かめられるだろうか。', 5),
        B(3, '')
      ], [
        F(8, GEO(fit(Z_EX, [72, 56])))
      ], '3:2')
    ],

    /* ================= 演習プリント（両面） ================= */
    dr: [
      HD('演習', 'ことばを使って、補助線のひき方を説明しよう。'),
      WD('① 角を求めるために、図にかき入れる線を{{補助線}}という。\n② 平行な 2直線に 1つの直線が交わるとき、{{同位角}}も{{錯角}}も等しい。\n③ 三角形の内角の和は{{180}}°。外角は、となりあわない 2つの{{内角}}の和に等しい。', 3, { label: 'ことば確認' }),
      HD('基礎', '下の図で、∠x の大きさを求めよう。（①、② は ℓ∥m）'),
      T('（1）', '補助線を、図にかきこんで考えよう。', 1),
      F(7, GEO(cap(Z_D1, '①')), GEO(cap(Z_D2, '②')), GEO(cap(Z_D3, '③'))),
      B(3, T_D1),
      MA('【説明】（1）①の補助線を、どこにひいたか、どの性質を使ったか、隣の人に説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 3),
      HD('標準', '次の問いに答えよう。'),
      C2([
        T('（2）', '右の図で、ℓ∥m のとき、∠x の大きさを求めよう。', 2),
        B(5, T_D3)
      ], [
        F(7, GEO(Z_D4))
      ], '3:2'),
      C2([
        T('（3）', '右の図で、ℓ∥m で、△ABC は正三角形である。∠x の大きさを求めよう。', 3),
        B(4, T_D4)
      ], [
        F(7, GEO(Z_D5))
      ], '3:2'),
      MA('【比べる】（2）（3）の補助線のひき方を、友達と比べよう。ちがうひき方を 1つ書こう。', 2),
      BR(),

      HD('応用', '補助線を使って、角の大きさを求めよう。'),
      C2([
        T('（4）', '右の図で、ℓ∥m のとき、∠x の大きさを求めよう。', 2),
        B(5, T_D5)
      ], [
        F(7, GEO(Z_D6))
      ], '3:2'),
      C2([
        T('（5）', '右の図で、線分 AD と BC は点 O で交わっている。\n① ∠x の大きさを求めよう。\n② ∠A+∠B＝∠C+∠D になるわけを説明しよう。', 3),
        B(5, T_D6)
      ], [
        F(8, GEO(Z_D7))
      ], '3:2'),
      HD('入試レベル', '図形の性質を使って、角の大きさを求めよう。'),
      C2([
        T('（6）', '右の図で、ℓ∥m で、ABCDE は正五角形である。∠x の大きさを求めよう。', 2),
        B(5, T_D7)
      ], [
        F(7, GEO(Z_D8))
      ], '3:2'),
      C2([
        T('（7）', '右の星形で、∠x の大きさを求めよう。（外角の性質を使って、5つの先の角を、1つの三角形に集めて考えよう）', 3),
        B(6, T_D8)
      ], [
        F(9, GEO(Z_D9))
      ], '3:2'),
      MA('【教える】解けなかった問題を、できた人に聞こう。\n教えてもらった問題（　　　）　教えてくれた人（　　　　　　）', 2),
      T('メモ', '気づいたこと・先生に聞きたいこと', 1),
      B(1, '')
    ],

    /* ================= 小テスト（A4 片面・5分。この時間の内容。次の時間のはじめに使う） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      C2([
        T('（1）', '右の図で、ℓ∥m のとき、∠x を求めよう。（3点）', 2),
        B(3, T_Q1)
      ], [
        F(7, GEO(Z_Q1))
      ], '3:2'),
      C2([
        T('（2）', '右の図で、∠x の大きさを求めよう。（3点）', 2),
        B(3, T_Q2)
      ], [
        F(7, GEO(Z_Q2))
      ], '3:2'),
      C2([
        T('（3）', '右の図で、ℓ∥m のとき、∠x を求めよう。（2点）', 2),
        B(3, T_Q3)
      ], [
        F(7, GEO(Z_Q3))
      ], '3:2'),
      T('（4）', '角を求めるために、図にかき入れる線を何というか。また、平行な 2直線に 1つの直線が交わるとき、等しくなる角を、2つ答えよう。（2点）', 2),
      B(2, '補助線　　同位角、錯角'),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      C2([
        T('（5）', '右の図で、ℓ∥m のとき、∠x の大きさを求めよう。', 2),
        B(4, T_QC)
      ], [
        F(8, GEO(Z_QC))
      ], '3:2')
    ]
  });
})();
