/* ============================================================
   授業ライブ — 図（SVG）。色は CSS のクラスで決める（ダークモード対応）
   .fg-grid 方眼 / .fg-ink 線 / .fg-sub 補助 / .fg-acc 強調 / .fg-txt 文字
   ============================================================ */
(function (root) {
  "use strict";
  const LM = root.LM;
  const num = a => (typeof a === "number" ? a : LM.evalAST(LM.parse(String(a)), {}));
  const t = (x, y, s, cls, extra) => `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" class="${cls || "fg-txt"}" ${extra || ""}>${s}</text>`;

  /* 座標平面（方眼）。opts: axes(既定true), labels(目もり数字) */
  function grid(R, opts) {
    opts = opts || {};
    const S = 400, M = 24, U = (S - 2 * M) / (2 * R), C = S / 2;
    const X = gx => C + gx * U, Y = gy => C - gy * U;
    let g = "";
    for (let i = -R; i <= R; i++) {
      g += `<line class="fg-grid" x1="${X(i)}" y1="${Y(-R)}" x2="${X(i)}" y2="${Y(R)}"/>`;
      g += `<line class="fg-grid" x1="${X(-R)}" y1="${Y(i)}" x2="${X(R)}" y2="${Y(i)}"/>`;
    }
    if (opts.axes !== false) {
      g += `<line class="fg-ink" x1="${X(-R) - 6}" y1="${C}" x2="${X(R) + 8}" y2="${C}" marker-end="url(#arr)"/>`;
      g += `<line class="fg-ink" x1="${C}" y1="${Y(-R) + 6}" x2="${C}" y2="${Y(R) - 8}" marker-end="url(#arr)"/>`;
      g += t(X(R) + 4, C + 16, "x", "fg-txt it");
      g += t(C + 8, Y(R) - 4, "y", "fg-txt it");
      g += t(C - 14, C + 15, "O", "fg-txt it");
      const step = R <= 6 ? 1 : 2;
      for (let v = step; v <= R; v += step) {
        if (v === R && R > 6) continue;
        g += t(X(v) - 3, C + 14, String(v), "fg-num");
        g += t(X(-v) - 8, C + 14, "−" + v, "fg-num");
        g += t(C + 5, Y(v) + 4, String(v), "fg-num");
        g += t(C + 5, Y(-v) + 4, "−" + v, "fg-num");
      }
    }
    const defs = `<defs><marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 z" class="fg-inkfill"/></marker></defs>`;
    return { S, M, U, C, X, Y, R, body: g, defs };
  }
  function linePath(a, R, X, Y, cls) {
    let x1 = -R, y1 = a * x1, x2 = R, y2 = a * x2;
    if (Math.abs(y1) > R) { y1 = Math.sign(y1) * R; x1 = y1 / a; }
    if (Math.abs(y2) > R) { y2 = Math.sign(y2) * R; x2 = y2 / a; }
    return `<line class="${cls || "fg-acc"}" x1="${X(x1)}" y1="${Y(y1)}" x2="${X(x2)}" y2="${Y(y2)}"/>`;
  }
  function hyperPath(a, R, X, Y, cls) {
    let out = "";
    for (const s of [1, -1]) {
      const pts = [];
      const x0 = Math.abs(a) / R;
      for (let i = 0; i <= 160; i++) {
        const x = s * (x0 + (R - x0) * i / 160);
        const y = a / x;
        if (Math.abs(y) <= R + 1e-6) pts.push(`${X(x).toFixed(1)},${Y(y).toFixed(1)}`);
      }
      if (pts.length > 1) out += `<polyline class="${cls || "fg-acc"}" fill="none" points="${pts.join(" ")}"/>`;
    }
    return out;
  }
  function dot(X, Y, x, y, cls, r) { return `<circle class="${cls || "fg-dot"}" cx="${X(x)}" cy="${Y(y)}" r="${r || 4.5}"/>`; }
  function wrap(w, h, body, cls, defs) {
    return `<svg class="fig ${cls || ""}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" role="img">${defs || ""}${body}</svg>`;
  }

  const FIG = {
    grid(f) {
      const G = grid(f.R, f);
      let b = G.body;
      (f.lines || []).forEach(([a, lab]) => {
        const v = num(a);
        b += linePath(v, f.R, G.X, G.Y);
        let x = f.R, y = v * x;
        if (Math.abs(y) > f.R) { y = Math.sign(y) * f.R; x = y / v; }
        b += t(G.X(x) + (x > 0 ? -18 : 6), G.Y(y) + (y > 0 ? 16 : -6), lab, "fg-lab");
      });
      (f.hypers || []).forEach(([a, lab]) => {
        b += hyperPath(a, f.R, G.X, G.Y);
        const x = a > 0 ? f.R * 0.62 : f.R * 0.62, y = a / x;
        b += t(G.X(x) + 6, G.Y(y) + (a > 0 ? -8 : 18), lab, "fg-lab");
        b += t(G.X(-x) - 20, G.Y(-y) + (a > 0 ? 18 : -8), lab, "fg-lab");
      });
      (f.pts || []).forEach(([lab, x, y]) => {
        b += dot(G.X, G.Y, x, y, "fg-dot", 4);
        b += t(G.X(x) + 6, G.Y(y) - 7, lab, "fg-lab");
      });
      return wrap(G.S, G.S, b, "sq", G.defs);
    },

    numline(f) {
      const W = 560, H = 86, L = 30, Rr = W - 30, y0 = 54;
      const X = v => L + (v - f.min) / (f.max - f.min) * (Rr - L);
      let b = `<line class="fg-ink" x1="${L - 14}" y1="${y0}" x2="${Rr + 16}" y2="${y0}" marker-end="url(#arr2)"/>`;
      const minor = f.minor || 0;
      if (minor) for (let v = f.min; v <= f.max + 1e-9; v += minor) b += `<line class="fg-sub" x1="${X(v)}" y1="${y0 - 5}" x2="${X(v)}" y2="${y0 + 5}"/>`;
      for (let v = f.min; v <= f.max; v++) {
        b += `<line class="fg-ink" x1="${X(v)}" y1="${y0 - 9}" x2="${X(v)}" y2="${y0 + 9}"/>`;
        b += t(X(v) - (v < 0 ? 9 : 4), y0 + 26, v < 0 ? "−" + (-v) : String(v), "fg-num");
      }
      (f.pts || []).forEach(([lab, v]) => {
        b += `<circle class="fg-dot" cx="${X(v)}" cy="${y0}" r="5"/>`;
        b += t(X(v) - 5, y0 - 16, lab, "fg-lab");
      });
      const defs = `<defs><marker id="arr2" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 z" class="fg-inkfill"/></marker></defs>`;
      return wrap(W, H, b, "wide", defs);
    },

    squares(f) {
      const s = 34, gap = 30;
      let x = 16, b = "";
      const W = f.n.reduce((acc, n) => acc + n * s + gap, 16), H = s + 44;
      f.n.forEach(n => {
        for (let i = 0; i <= n; i++) b += `<line class="fg-stick" x1="${x + i * s}" y1="12" x2="${x + i * s}" y2="${12 + s}"/>`;
        b += `<line class="fg-stick" x1="${x}" y1="12" x2="${x + n * s}" y2="12"/>`;
        b += `<line class="fg-stick" x1="${x}" y1="${12 + s}" x2="${x + n * s}" y2="${12 + s}"/>`;
        b += t(x + n * s / 2 - 16, 12 + s + 22, `${n}個`, "fg-num");
        x += n * s + gap;
      });
      return wrap(W, H, b, "wide");
    },

    stones(f) {
      const n = f.n, side = 150, ox = 20, oy = 170;
      const A = [ox, oy], B = [ox + side, oy], Cc = [ox + side / 2, oy - side * Math.sqrt(3) / 2];
      const pts = [];
      const add = p => { if (!pts.some(q => Math.hypot(q[0] - p[0], q[1] - p[1]) < 1)) pts.push(p); };
      [[A, B], [B, Cc], [Cc, A]].forEach(([P, Q]) => {
        for (let i = 0; i < n; i++) add([P[0] + (Q[0] - P[0]) * i / (n - 1), P[1] + (Q[1] - P[1]) * i / (n - 1)]);
      });
      let b = `<polygon class="fg-sub" fill="none" points="${[A, B, Cc].map(p => p.join(",")).join(" ")}"/>`;
      pts.forEach(p => { b += `<circle class="fg-stone" cx="${p[0]}" cy="${p[1]}" r="9"/>`; });
      b += t(ox + side + 26, oy - 60, `1 辺に ${n} 個`, "fg-num");
      return wrap(ox + side + 130, oy + 20, b);
    },

    moves() {
      const G = grid(6, { axes: false });
      const tris = [
        ["ア", [[1, 1], [4, 1], [1, 3]]],
        ["イ", [[2, -5], [5, -5], [2, -3]]],
        ["ウ", [[-1, -1], [-4, -1], [-1, -3]]],
        ["エ", [[-1, 1], [-4, 1], [-1, 3]]],
      ];
      let b = G.body;
      b += `<line class="fg-acc2" x1="${G.X(0)}" y1="${G.Y(6)}" x2="${G.X(0)}" y2="${G.Y(-6)}"/>`;
      b += t(G.X(0) + 5, G.Y(6) + 16, "ℓ", "fg-lab it");
      tris.forEach(([lab, p], i) => {
        b += `<polygon class="${i === 0 ? "fg-tri0" : "fg-tri"}" points="${p.map(([x, y]) => `${G.X(x)},${G.Y(y)}`).join(" ")}"/>`;
        const cx = (p[0][0] + p[1][0] + p[2][0]) / 3, cy = (p[0][1] + p[1][1] + p[2][1]) / 3;
        b += t(G.X(cx) - 7, G.Y(cy) + 5, lab, "fg-lab");
      });
      b += `<circle class="fg-dot" cx="${G.X(0)}" cy="${G.Y(0)}" r="4.5"/>` + t(G.X(0) + 7, G.Y(0) + 17, "O", "fg-lab it");
      return wrap(G.S, G.S, b, "sq");
    },

    sector(f) {
      const cx = 40, cy = 150, r = 120, deg = f.deg || 60, a = deg * Math.PI / 180;
      const x2 = cx + r * Math.cos(-a), y2 = cy + r * Math.sin(-a);
      let b = `<path class="fg-sector" d="M${cx} ${cy} L${cx + r} ${cy} A${r} ${r} 0 ${deg > 180 ? 1 : 0} 0 ${x2.toFixed(1)} ${y2.toFixed(1)} Z"/>`;
      const ar = 26, ax = cx + ar * Math.cos(-a), ay = cy + ar * Math.sin(-a);
      b += `<path class="fg-sub" fill="none" d="M${cx + ar} ${cy} A${ar} ${ar} 0 0 0 ${ax.toFixed(1)} ${ay.toFixed(1)}"/>`;
      b += t(cx + 30, cy - 10, "中心角", "fg-num");
      b += t(cx + r / 2 - 8, cy + 18, "半径", "fg-num");
      b += t(cx + r * Math.cos(-a / 2) + 6, cy + r * Math.sin(-a / 2), "弧", "fg-lab");
      return wrap(200, 170, b);
    },

    cuboid() {
      const W = 170, Hh = 95, dx = 62, dy = 44, ox = 22, oy = 160;
      const P = (x, y, z) => [ox + x * W + y * dx, oy - z * Hh - y * dy];
      const V = { A: P(0, 0, 1), B: P(1, 0, 1), C: P(1, 1, 1), D: P(0, 1, 1), E: P(0, 0, 0), F: P(1, 0, 0), G: P(1, 1, 0), H: P(0, 1, 0) };
      const seg = (a, c, hid) => `<line class="${hid ? "fg-hid" : "fg-ink"}" x1="${V[a][0]}" y1="${V[a][1]}" x2="${V[c][0]}" y2="${V[c][1]}"/>`;
      let b = "";
      [["A", "B"], ["B", "C"], ["C", "D"], ["D", "A"], ["A", "E"], ["B", "F"], ["C", "G"], ["E", "F"], ["F", "G"]].forEach(([a, c]) => { b += seg(a, c); });
      [["D", "H"], ["E", "H"], ["G", "H"]].forEach(([a, c]) => { b += seg(a, c, true); });
      const off = { A: [-16, -4], B: [4, -6], C: [5, -4], D: [-16, -6], E: [-16, 14], F: [4, 16], G: [6, 12], H: [-18, 6] };
      for (const k in V) b += t(V[k][0] + off[k][0], V[k][1] + off[k][1], k, "fg-lab");
      return wrap(W + dx + 50, Hh + dy + 60, b);
    },

    views(f) {
      const w = 180, h = 220, mid = 110;
      let b = `<line class="fg-sub" x1="10" y1="${mid}" x2="${w - 10}" y2="${mid}"/>`;
      const cx = w / 2;
      if (f.elev === "tri") b += `<polygon class="fg-shape" points="${cx},18 ${cx - 50},96 ${cx + 50},96"/>`;
      if (f.elev === "rect") b += `<rect class="fg-shape" x="${cx - 50}" y="22" width="100" height="74"/><line class="fg-ink" x1="${cx + 12}" y1="22" x2="${cx + 12}" y2="96"/>`;
      if (f.plan === "circle") b += `<circle class="fg-shape" cx="${cx}" cy="${mid + 55}" r="45"/><circle class="fg-dot" cx="${cx}" cy="${mid + 55}" r="3"/>`;
      if (f.plan === "tri") b += `<polygon class="fg-shape" points="${cx - 50},${mid + 18} ${cx + 50},${mid + 18} ${cx + 12},${mid + 94}"/>`;
      if (f.plan === "square") b += `<rect class="fg-shape" x="${cx - 45}" y="${mid + 12}" width="90" height="90"/><line class="fg-ink" x1="${cx - 45}" y1="${mid + 12}" x2="${cx + 45}" y2="${mid + 102}"/><line class="fg-ink" x1="${cx + 45}" y1="${mid + 12}" x2="${cx - 45}" y2="${mid + 102}"/>`;
      b += t(6, 16, "立面図", "fg-num") + t(6, mid + 16, "平面図", "fg-num");
      return wrap(w, h, b, "small");
    },

    hist(f) {
      const W = 420, H = 250, L = 44, B = 210, T = 16, Rr = W - 20;
      const e = f.edges, fr = f.freq, maxF = Math.max(...fr) + 1;
      const wUnit = (e[e.length - 1] - e[0] + (e[1] - e[0]) * 2);
      const X = v => L + (v - (e[0] - (e[1] - e[0]))) / wUnit * (Rr - L);
      const Y = v => B - v / maxF * (B - T);
      let b = "";
      for (let v = 0; v <= maxF; v++) {
        b += `<line class="fg-grid" x1="${L}" y1="${Y(v)}" x2="${Rr}" y2="${Y(v)}"/>`;
        b += t(L - 16, Y(v) + 4, String(v), "fg-num");
      }
      fr.forEach((c, i) => { b += `<rect class="fg-bar" x="${X(e[i])}" y="${Y(c)}" width="${X(e[i + 1]) - X(e[i])}" height="${B - Y(c)}"/>`; });
      if (f.poly) {
        const w = e[1] - e[0];
        const pts = [[e[0] - w / 2, 0]].concat(fr.map((c, i) => [(e[i] + e[i + 1]) / 2, c])).concat([[e[e.length - 1] + w / 2, 0]]);
        b += `<polyline class="fg-acc" fill="none" points="${pts.map(([x, y]) => `${X(x)},${Y(y)}`).join(" ")}"/>`;
        pts.forEach(([x, y]) => { b += `<circle class="fg-dot" cx="${X(x)}" cy="${Y(y)}" r="3"/>`; });
      }
      b += `<line class="fg-ink" x1="${L}" y1="${B}" x2="${Rr}" y2="${B}"/><line class="fg-ink" x1="${L}" y1="${B}" x2="${L}" y2="${T - 6}"/>`;
      e.forEach(v => { b += t(X(v) - 7, B + 16, String(v), "fg-num"); });
      b += t(Rr - 14, B + 32, `(${f.xl || ""})`, "fg-num") + t(L - 30, T - 2, `(${f.yl || ""})`, "fg-num");
      return wrap(W, H + 10, b, "wide");
    },
  };

  function render(spec) {
    if (!spec || !FIG[spec.t]) return "";
    try { return FIG[spec.t](spec); } catch (e) { return ""; }
  }

  root.LF = { render, grid, linePath, hyperPath, dot, wrap, num };
})(typeof window !== "undefined" ? window : globalThis);
