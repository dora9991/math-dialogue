/* ikkan：立体（多面体）の見取図の部品 POLY。かくれた辺は点線。凸の多面体なら、頂点を書くだけで描ける（面は自動で求める）。
   core.js と figs.js のあとに読む。使い方（data/lesson_*.js）：  const { POLY } = IK.b;   F(行数, POLY({ … }, { … }))
   POLY({
     solid: 'cuboid' | 'prism' | 'pyramid' | 'tetra' | 'cube' | 'octa' | 'dodeca' | 'icosa',   // 形のひな形。V を直接書いてもよい
     w, d, h:   cuboid の 幅・奥行き・高さ（いまの図の形をきめる数）　　n, a, h:  prism・pyramid の 底面の正n角形の1辺の数・1辺の長さ・高さ
     V: [[x,y,z], …],   // 頂点（solid のかわりに書く。凸の多面体）　　F: [[頂点の番号…], …]（ふつうは書かない。自動）
     proj: 'oblique'（ななめ投影。cuboid・prism・pyramid の初期値。手前の面がゆがまない）| 'ortho'（それ以外の初期値）　　az, el: ortho のときの見る向き（度）
     labels: 'ABCDEFGH'（頂点の番号の順に、字をつける）　　caption: '正十二面体'
     edges: [{ e: 'AB', c: '#1d5fbf', w: 0.7 }, …]   // 色をつける辺（かくれていれば点線）
     planes: [{ v: 'ABCD', c: '#1d5fbf', a: 0.16 }, …]   // 面に色をぬる（頂点の字か番号の並び）
     ansEdges, ansPlanes:  解答を表示したときだけ出る赤い辺・面（形は edges・planes と同じ）
     pts: [{ at: [x, y, z], t: 'M' }, …]   // 点（辺の中点など）と字
     pad: 余白（mm）
   })
   cuboid の頂点の番号：A(0,0,0) B(w,0,0) C(w,d,0) D(0,d,0) E(0,0,h) F(w,0,h) G(w,d,h) H(0,d,h)（底面 ABCD の真上に EFGH。手前の面が ABFE）
   prism：下の底面 0〜n−1、上の底面 n〜2n−1。pyramid：底面 0〜n−1、頂点 n。 */
(function () {
  'use strict';
  const IK = window.IK, B = IK.b;
  const f2 = n => String(Math.round(n * 100) / 100);
  const dot = (p, q) => p[0] * q[0] + p[1] * q[1] + p[2] * q[2];
  const sub = (p, q) => [p[0] - q[0], p[1] - q[1], p[2] - q[2]];
  const cross = (p, q) => [p[1] * q[2] - p[2] * q[1], p[2] * q[0] - p[0] * q[2], p[0] * q[1] - p[1] * q[0]];
  const len = p => Math.hypot(p[0], p[1], p[2]);
  const nz = v => (v == null ? undefined : v);

  /* ---- 形のひな形 ---- */
  const PHI = (1 + Math.sqrt(5)) / 2;
  const regPoly = (n, a) => { const R = a / (2 * Math.sin(Math.PI / n)); return Array.from({ length: n }, (_, k) => { const t = (-90 - 180 / n + k * 360 / n) * Math.PI / 180; return [R * Math.cos(t), R * Math.sin(t)]; }); };
  const solids = {
    cuboid: o => { const w = nz(o.w) || 4, d = nz(o.d) || 3, h = nz(o.h) || 3; return [[0, 0, 0], [w, 0, 0], [w, d, 0], [0, d, 0], [0, 0, h], [w, 0, h], [w, d, h], [0, d, h]]; },
    prism: o => { const n = o.n || 3, a = o.a || 2, h = nz(o.h) || 3, b = regPoly(n, a); return [...b.map(p => [p[0], p[1], 0]), ...b.map(p => [p[0], p[1], h])]; },
    pyramid: o => { const n = o.n || 4, a = o.a || 2.6, h = nz(o.h) || 3, b = regPoly(n, a); return [...b.map(p => [p[0], p[1], 0]), [0, 0, h]]; },
    tetra: () => { const a = 2, R = a / Math.sqrt(3), h = a * Math.sqrt(2 / 3); return [[0, 0, h], ...[0, 1, 2].map(k => { const t = (-90 + k * 120) * Math.PI / 180; return [R * Math.cos(t), R * Math.sin(t), 0]; })]; },
    cube: () => { const V = []; for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) V.push([x, y, z]); return V; },
    octa: () => [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]],
    icosa: () => { const V = []; for (const s of [-1, 1]) for (const t of [-1, 1]) V.push([0, s, t * PHI], [s, t * PHI, 0], [t * PHI, 0, s]); return V; },
    dodeca: () => { const V = [], q = 1 / PHI; for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) V.push([x, y, z]); for (const s of [-1, 1]) for (const t of [-1, 1]) V.push([0, s * q, t * PHI], [s * q, t * PHI, 0], [t * PHI, 0, s * q]); return V; }
  };

  /* ---- 凸の多面体の面を、頂点から求める（頂点が全部、片側にある平面が、面） ---- */
  function hullFaces(V) {
    const eps = 1e-6, faces = [], seen = new Set(), n = V.length;
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) for (let k = j + 1; k < n; k++) {
      let nn = cross(sub(V[j], V[i]), sub(V[k], V[i])); const L = len(nn); if (L < eps) continue; nn = nn.map(v => v / L);
      const d = dot(nn, V[i]); let pos = 0, neg = 0; const idx = [];
      for (let m = 0; m < n; m++) { const s = dot(nn, V[m]) - d; if (s > eps) pos++; else if (s < -eps) neg++; else idx.push(m); }
      if (pos && neg) continue;
      const key = idx.join(','); if (seen.has(key)) continue; seen.add(key);
      if (pos) nn = nn.map(v => -v);   // 外向きにそろえる
      const c = idx.reduce((s, m) => [s[0] + V[m][0] / idx.length, s[1] + V[m][1] / idx.length, s[2] + V[m][2] / idx.length], [0, 0, 0]);
      const u0 = sub(V[idx[0]], c), uL = len(u0), u = u0.map(v => v / uL), w = cross(nn, u);
      idx.sort((p, q) => Math.atan2(dot(sub(V[p], c), w), dot(sub(V[p], c), u)) - Math.atan2(dot(sub(V[q], c), w), dot(sub(V[q], c), u)));
      faces.push({ idx, n: nn });
    }
    return faces;
  }

  const poly = o => (W, H, h) => {
    const V = (o.V || (solids[o.solid || 'cuboid'] || solids.cuboid)(o)).map(p => [p[0], p[1], p[2]]);
    const faces = o.F ? o.F.map(fi => { const Q = fi.map(i => V[i]); let nn = cross(sub(Q[1], Q[0]), sub(Q[2], Q[0])); const L = len(nn) || 1; nn = nn.map(v => v / L); const cen = V.reduce((s, p) => [s[0] + p[0] / V.length, s[1] + p[1] / V.length, s[2] + p[2] / V.length], [0, 0, 0]); if (dot(nn, sub(Q[0], cen)) < 0) nn = nn.map(v => -v); return { idx: fi, n: nn }; }) : hullFaces(V);
    const mode = o.proj || (['cuboid', 'prism', 'pyramid'].includes(o.solid || (o.V ? '' : 'cuboid')) ? 'oblique' : 'ortho');
    let proj, toV;
    if (mode === 'oblique') {
      const K = 0.5, PH = 35 * Math.PI / 180, kc = K * Math.cos(PH), ks = K * Math.sin(PH);
      proj = p => [p[0] + kc * p[1], p[2] + ks * p[1]]; toV = [kc, -1, ks];
    } else {
      const az = (nz(o.az) != null ? o.az : 28) * Math.PI / 180, el = (nz(o.el) != null ? o.el : 22) * Math.PI / 180;
      toV = [Math.cos(el) * Math.sin(az), -Math.cos(el) * Math.cos(az), Math.sin(el)];
      const R = [Math.cos(az), Math.sin(az), 0], U = cross(toV, R);
      proj = p => [dot(p, R), dot(p, U)];
    }
    const S = V.map(proj);
    // 辺：面のふちから集める。かくれている辺は、となりの 2つの面がどちらも見えない辺
    const E = new Map();
    faces.forEach((f, fi) => f.idx.forEach((v, k) => { const w = f.idx[(k + 1) % f.idx.length], key = Math.min(v, w) + '-' + Math.max(v, w); if (!E.has(key)) E.set(key, { i: Math.min(v, w), j: Math.max(v, w), f: [] }); E.get(key).f.push(fi); }));
    const front = faces.map(f => dot(f.n, toV) > 1e-9);
    const edges = [...E.values()].map(e => ({ i: e.i, j: e.j, hidden: !e.f.some(fi => front[fi]) }));
    // 字（頂点の字）
    const lt = o.labels == null ? [] : Array.isArray(o.labels) ? o.labels : Array.from(String(o.labels));
    const at = nm => lt.indexOf(nm);
    const idxOf = x => (typeof x === 'number' ? x : at(x));
    // 図をおさめる
    const cap = o.caption ? 4.6 : 0, pad = nz(o.pad) != null ? o.pad : (lt.length ? 5 : 3);
    const pts = S.concat((o.pts || []).map(p => proj(p.at)));
    const xs = pts.map(p => p[0]), ys = pts.map(p => -p[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const k = Math.min((W - 2 * pad) / (x1 - x0 || 1), (H - 2 * pad - cap) / (y1 - y0 || 1));
    const ox = (W - (x1 - x0) * k) / 2 - x0 * k, oy = cap + (H - cap - (y1 - y0) * k) / 2 - y0 * k;
    const X = p => ox + p[0] * k, Y = p => oy - p[1] * k;
    const cx = X([S.reduce((s, p) => s + p[0], 0) / S.length, 0]), cy = Y([0, S.reduce((s, p) => s + p[1], 0) / S.length]);
    const edgeOf = x => { const ij = typeof x === 'string' ? [at(x[0]), at(x[1])] : x; const a = Math.min(ij[0], ij[1]), b = Math.max(ij[0], ij[1]); return edges.find(e => e.i === a && e.j === b) || { i: a, j: b, hidden: false }; };
    const polyOf = (v, c, a) => { const ids = (typeof v === 'string' ? Array.from(v) : v).map(idxOf); return `<polygon points="${ids.map(i => f2(X(S[i])) + ',' + f2(Y(S[i]))).join(' ')}" fill="${c || '#1d5fbf'}" fill-opacity="${a == null ? 0.16 : a}" stroke="none"/>`; };
    const edgeSvg = (list, defc) => (list || []).map(it => { const e = edgeOf(it.e), c = it.c || defc, wd = it.w || 0.75; return h.ln(X(S[e.i]), Y(S[e.i]), X(S[e.j]), Y(S[e.j]), c, wd, (e.hidden ? ' stroke-dasharray="1.4 1"' : '') + ' stroke-linecap="round"'); }).join('');
    let out = '';
    if (o.caption) out += h.tx(W / 2, 3.5, h.svgMath(o.caption), 3, 'middle', ' class="cap"');
    (o.planes || []).forEach(p => { out += polyOf(p.v, p.c, p.a); });
    edges.filter(e => e.hidden).forEach(e => { out += h.ln(X(S[e.i]), Y(S[e.i]), X(S[e.j]), Y(S[e.j]), '#555', 0.22, ' stroke-dasharray="1.2 0.9"'); });
    edges.filter(e => !e.hidden).forEach(e => { out += h.ln(X(S[e.i]), Y(S[e.i]), X(S[e.j]), Y(S[e.j]), '#222', 0.34, ' stroke-linecap="round"'); });
    out += edgeSvg(o.edges, '#1d5fbf');
    (o.pts || []).forEach(p => { const q = proj(p.at); out += `<circle cx="${f2(X(q))}" cy="${f2(Y(q))}" r="0.6" fill="#222"/>`; if (p.t) out += h.tx(X(q) + 1.4, Y(q) - 1.4, h.svgMath(p.t), 3, 'start'); });
    lt.forEach((nm, i) => {   // 字は、その頂点に集まる辺と辺のあいだの、いちばん広いすき間の向きに置く
      if (i >= V.length) return;
      const angs = edges.filter(e => e.i === i || e.j === i).map(e => { const q = e.i === i ? e.j : e.i; return Math.atan2(S[q][1] - S[i][1], S[q][0] - S[i][0]); }).sort((a, b) => a - b);
      let best = 0, bd = 0;
      if (angs.length < 2) { const dx = X(S[i]) - cx, dy = Y(S[i]) - cy; best = Math.atan2(-dy, dx); }
      else angs.forEach((a, m) => { const nx = m + 1 < angs.length ? angs[m + 1] : angs[0] + 2 * Math.PI, gap = nx - a; if (gap > bd) { bd = gap; best = a + gap / 2; } });
      out += h.tx(X(S[i]) + Math.cos(best) * 3.2, Y(S[i]) - Math.sin(best) * 3.2 + 1.0, h.svgMath(nm), 3.1, 'middle');
    });
    let ans = '';
    (o.ansPlanes || []).forEach(p => { ans += polyOf(p.v, p.c || '#d62828', p.a == null ? 0.18 : p.a); });
    ans += edgeSvg(o.ansEdges, '#d62828');
    if (ans) out += h.ans(ans);
    return out;
  };

  B.POLY = (o, fo) => B.SVG(poly(o || {}), fo);
  IK.solidV = solids;   // 頂点のひな形（自分で V を組むときの出発点）
})();
