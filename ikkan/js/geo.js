/* ikkan：平面図形の図（角・平行線・三角形・多角形・合同）。GEO({ … })
   点を数学の座標（y が上）で与えると、図の枠（W×H mm）におさまるように、縦横比をそのままに拡大・縮小して描く。
   使い方：  F(9, GEO({ pts: { A: [0, 0], B: [6, 0], C: [2, 4] }, poly: 'ABC', vl: 'ABC', ang: [{ at: 'A', a: 'B', b: 'C', t: '{{50°}}' }] }))

   pts   … { 名前: [x, y] }。名前は1文字（A・B・O・P…）か、A' のような短い文字。
   poly  … 'ABC' ＝ A→B→C→A の閉じた多角形（辺は実線）。poly: ['ABC', 'DEF'] で、2つ。
   segs  … 線分・直線。'AB'、['A','C']、['A','C',{ dash:1, ext:[0.3,0.3] }]。点の名前のかわりに [x,y] も書ける。
            ext＝[A の外がわにのばす長さ, B の外がわにのばす長さ]（線分の長さに対する比。直線ℓ・m を、点の外までのばすときに使う）。
            dash＝点線（補助線）。w＝線の太さ（既定 0.32）。lab・lab0＝直線の名前（ℓ・m）を、B のがわ・A のがわのはしの外に書く。
   vl    … 頂点の字。'ABC'（それぞれ自分の名前）、または { A: 'A', B: ['B', 225], O: { t: 'O', d: 300, k: 4 } }。
            d＝字をおく向き（度。0＝右、90＝上、180＝左、270＝下）。省略すると、図の中心から外へ。k＝点から字までの距離（mm。既定 3.4）。
   ang   … 角のしるし。{ at:'B', a:'A', b:'C', t:'x', n:1, r:5 }＝∠ABC（B が頂点、半直線 B→A と B→C のあいだの小さいほう）。
            t＝角の字（'x'・'65°'・'{{65°}}'＝空欄（解答で赤））。n＝弧の本数（1〜3。等しい角のしるし）。r＝弧の半径（mm。既定 5）。
            right:true＝直角のしるし（小さな□）。reflex:true＝大きいほう（180°より大きい角）。lr＝字の置き場所（頂点からの距離 mm）、tin:true＝字を弧の内がわに。
   tick  … 等しい辺のしるし。['A','B',1]（本数）。4つ目の数 pos（0〜1）で、A から B へ、どのあたりに付けるか（既定 0.5＝まん中）。
   par   … 平行のしるし（＞）。['A','B',1]（本数。向きは、A→B）。tick と同じ辺に付けるときは、pos（0〜1）でずらす：['A','B',1,0.3]。
   dots  … 点（●）をうつ名前の配列。['A','B']
   txt   … 好きな字。{ p:[x,y]（座標。または名前）, t:'ℓ', dx:0, dy:0（mm）, anchor:'middle', size:3 }
   a     … 解答を表示したときだけ、赤で出すもの。{ segs, ang, tick, par, vl, txt, dots }（中身の書き方は同じ）。点（pts）は共通。
   pad   … まわりの余白（mm。既定 7）。size … 字の大きさ（mm。既定 3.0）。scale … 1 目もりあたりの mm（指定すると、拡大縮小しない）。 */
(function () {
  const IK = window.IK, B = IK.b;
  const RED = '#d62828', INK = '#222';
  const f2 = n => String(Math.round(n * 100) / 100);
  const TAU = 2 * Math.PI;

  const geo = o => (W, H, h) => {
    const P = o.pts || {}, SZ = o.size || 3.0;
    const pt = k => { if (Array.isArray(k)) return k; if (!P[k]) throw new Error('GEO：点 ' + k + ' がありません'); return P[k]; };
    const polys = (v => (v == null ? [] : Array.isArray(v) ? v : [v]))(o.poly);
    const segList = (src) => {
      const out = [];
      (typeof src.poly === 'string' || Array.isArray(src.poly) ? (Array.isArray(src.poly) ? src.poly : [src.poly]) : []).forEach(pl => {
        const n = [...pl]; for (let i = 0; i < n.length; i++) out.push([n[i], n[(i + 1) % n.length], {}]);
      });
      (src.segs || []).forEach(s => {
        if (typeof s === 'string') { const n = [...s]; out.push([n[0], n[1], {}]); } else out.push([s[0], s[1], s[2] || {}]);
      });
      return out.map(([a, b, op]) => {
        const A = pt(a), Bp = pt(b), dx = Bp[0] - A[0], dy = Bp[1] - A[1], e = op.ext || [0, 0];
        return { A: [A[0] - dx * e[0], A[1] - dy * e[0]], B: [Bp[0] + dx * e[1], Bp[1] + dy * e[1]], P0: A, P1: Bp, op };
      });
    };
    // 図全体の座標の範囲（解答の分もふくめる）
    const all = [...Object.values(P)];
    [o, o.a || {}].forEach(src => segList(src).forEach(s => { all.push(s.A, s.B); }));
    [o, o.a || {}].forEach(src => (src.txt || []).forEach(t => { if (t.p) all.push(pt(t.p)); }));
    const xs = all.map(p => p[0]), ys = all.map(p => p[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const pad = o.pad == null ? 7 : o.pad, bw = Math.max(x1 - x0, 1e-6), bh = Math.max(y1 - y0, 1e-6);
    const s = o.scale || Math.min((W - 2 * pad) / bw, (H - 2 * pad) / bh);
    const ox = (W - bw * s) / 2 - x0 * s, oy = (H - bh * s) / 2 + y1 * s;
    const X = x => ox + x * s, Y = y => oy - y * s;
    const SX = p => X(pt(p)[0]), SY = p => Y(pt(p)[1]);
    const cen = (() => {   // 字をおく向きの基準：図形（poly）の中心。なければ、全部の点の中心
      const names = polys.length ? [...polys.join('')] : Object.keys(P);
      const ps = names.map(n => P[n]).filter(Boolean);
      return [ps.reduce((a, p) => a + p[0], 0) / ps.length, ps.reduce((a, p) => a + p[1], 0) / ps.length];
    })();

    const render = (src, red) => {
      const stroke = red ? RED : INK;
      let out = '';
      // 線分
      segList(src).forEach(sg => {
        const w = sg.op.w || 0.32;
        out += h.ln(X(sg.A[0]), Y(sg.A[1]), X(sg.B[0]), Y(sg.B[1]), stroke, w, (sg.op.dash ? ' stroke-dasharray="1.4 1"' : '') + ' stroke-linecap="round"');
        // 直線の名前（ℓ・m）：lab＝B のがわのはし、lab0＝A のがわのはし（はしの外がわ 3.4mm に、字をおく）
        const ex = X(sg.B[0]) - X(sg.A[0]), ey = Y(sg.B[1]) - Y(sg.A[1]), eL = Math.hypot(ex, ey) || 1;
        if (sg.op.lab) out += h.rich(X(sg.B[0]) + ex / eL * 3.6, Y(sg.B[1]) + ey / eL * 3.6 + SZ * 0.34, sg.op.lab, SZ, 'middle');
        if (sg.op.lab0) out += h.rich(X(sg.A[0]) - ex / eL * 3.6, Y(sg.A[1]) - ey / eL * 3.6 + SZ * 0.34, sg.op.lab0, SZ, 'middle');
      });
      // 角のしるし
      (src.ang || []).forEach(a => {
        const V = pt(a.at), A = pt(a.a), C = pt(a.b), r = a.r || 5, n = a.n || 1;
        const ta = Math.atan2(A[1] - V[1], A[0] - V[0]), tb = Math.atan2(C[1] - V[1], C[0] - V[0]);
        let d = ((tb - ta) % TAU + TAU) % TAU;            // ta から tb へ、反時計まわり
        let start = ta, sweep = d;
        if (d > Math.PI) { start = tb; sweep = TAU - d; }   // 小さいほうの角
        if (a.reflex) { start = start + sweep; sweep = TAU - sweep; }
        const vx = X(V[0]), vy = Y(V[1]);
        const pp = (rr, t) => [vx + rr * Math.cos(t), vy - rr * Math.sin(t)];
        if (a.right) {
          const m = (a.r || 3.6) * 0.8, u = [Math.cos(start), Math.sin(start)], v2 = [Math.cos(start + sweep), Math.sin(start + sweep)];
          const q0 = [vx + u[0] * m, vy - u[1] * m], q1 = [vx + (u[0] + v2[0]) * m, vy - (u[1] + v2[1]) * m], q2 = [vx + v2[0] * m, vy - v2[1] * m];
          out += `<polyline points="${f2(q0[0])},${f2(q0[1])} ${f2(q1[0])},${f2(q1[1])} ${f2(q2[0])},${f2(q2[1])}" fill="none" stroke="${stroke}" stroke-width="0.28"/>`;
        } else {
          for (let k = 0; k < n; k++) {
            const rr = r + k * 1.3, pts = [], N = Math.max(8, Math.round(sweep * 18));
            for (let i = 0; i <= N; i++) { const q = pp(rr, start + sweep * i / N); pts.push(f2(q[0]) + ',' + f2(q[1])); }
            out += `<polyline points="${pts.join(' ')}" fill="none" stroke="${stroke}" stroke-width="0.28"/>`;
          }
        }
        if (a.t != null && a.t !== '') {
          const txt = String(a.t), len = txt.replace(/\{\{|\}\}/g, '').length;
          const mid = start + sweep / 2;
          const rl = a.lr != null ? a.lr : (a.tin ? Math.max(2.2, r * 0.62) : r + (n - 1) * 1.3 + 1.6 + (len > 2 ? 3.8 : len > 1 ? 3.0 : 2.3));
          const q = pp(rl, mid);
          out += h.rich(q[0], q[1] + SZ * 0.34, txt, SZ, 'middle');
        }
      });
      // 等しい辺のしるし・平行のしるし
      const mark = (list, kind) => (list || []).forEach(([a, b, nn, pos]) => {
        const Ax = SX(a), Ay = SY(a), Bx = SX(b), By = SY(b), L = Math.hypot(Bx - Ax, By - Ay) || 1, u = [(Bx - Ax) / L, (By - Ay) / L], v = [-u[1], u[0]];
        const n = nn || 1, gap = 1.3, q = pos == null ? 0.5 : pos, cx = Ax + (Bx - Ax) * q, cy = Ay + (By - Ay) * q;
        for (let k = 0; k < n; k++) {
          const t = (k - (n - 1) / 2) * gap, px = cx + u[0] * t, py = cy + u[1] * t;
          if (kind === 'tick') out += h.ln(px - v[0] * 1.3, py - v[1] * 1.3, px + v[0] * 1.3, py + v[1] * 1.3, stroke, 0.36);
          else {   // ＞（A→B の向き）
            const tip = [px + u[0] * 0.9, py + u[1] * 0.9];
            out += `<polyline points="${f2(px - u[0] * 0.9 + v[0] * 1.3)},${f2(py - u[1] * 0.9 + v[1] * 1.3)} ${f2(tip[0])},${f2(tip[1])} ${f2(px - u[0] * 0.9 - v[0] * 1.3)},${f2(py - u[1] * 0.9 - v[1] * 1.3)}" fill="none" stroke="${stroke}" stroke-width="0.34" stroke-linejoin="round" stroke-linecap="round"/>`;
          }
        }
      });
      mark(src.tick, 'tick'); mark(src.par, 'par');
      // 点
      (src.dots || []).forEach(n => { out += `<circle cx="${f2(SX(n))}" cy="${f2(SY(n))}" r="0.6" fill="${stroke}"/>`; });
      // 頂点の字
      let vl = src.vl; if (typeof vl === 'string') { const o2 = {}; [...vl].forEach(c => { o2[c] = c; }); vl = o2; }
      Object.keys(vl || {}).forEach(n => {
        let v = vl[n], t = n, d = null, k = 3.4;
        if (typeof v === 'string') t = v; else if (Array.isArray(v)) { t = v[0]; d = v[1]; if (v[2] != null) k = v[2]; } else if (v) { t = v.t != null ? v.t : n; d = v.d != null ? v.d : null; if (v.k != null) k = v.k; }
        const p = pt(n);
        if (d == null) { const dx = p[0] - cen[0], dy = p[1] - cen[1]; d = (Math.abs(dx) + Math.abs(dy) < 1e-9) ? 90 : Math.atan2(dy, dx) * 180 / Math.PI; }
        const th = d * Math.PI / 180, q = [X(p[0]) + k * Math.cos(th), Y(p[1]) - k * Math.sin(th)];
        out += h.rich(q[0], q[1] + SZ * 0.34, t, SZ, 'middle');
      });
      // 好きな字
      (src.txt || []).forEach(t => {
        const p = pt(t.p); out += h.rich(X(p[0]) + (t.dx || 0), Y(p[1]) + (t.dy || 0) + (t.size || SZ) * 0.34, t.t, t.size || SZ, t.anchor || 'middle');
      });
      return out;
    };
    let out = render(o, false);
    if (o.a) out += h.ans(render(o.a, true));
    return out;
  };

  B.GEO = (o, fo) => B.SVG(geo(o), fo);
})();
