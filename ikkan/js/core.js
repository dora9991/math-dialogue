/* ikkan：板書型ワークシートの紙面をつくる道具（画面を持たない。ブラウザでも node の検査でも読める）。
   ワークシートの形：日付・名前 → めあて → 学習課題・例題（1〜3問）。問題の下は、図・グラフ以外は空欄（板書を写す）。
   「解答を表示」で、空欄に教師が板書する内容と、問題文・図の中の空欄（数字）が赤で出る。
   文字の中：{{答え}}＝空欄、[[1/2]]＝分数、x^2＝累乗、**太字**、\\m＝立体にしない文字、√{12}＝根号。
   図のきまり（ws.css と同じ）：長さの字は '{{3}}cm' のように書くと、数字だけ空欄になる。 */
(function () {
  'use strict';
  const IK = (window.IK = window.IK || {});
  IK.units = IK.units || [];
  IK.lessons = IK.lessons || {};
  IK.order = IK.order || [];

  /* ---------------- 小道具 ---------------- */
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = (v, d) => { const n = parseFloat(String(v == null ? '' : v).replace(/[−–]/g, '-')); return isFinite(n) ? n : d; };
  const f2 = n => String(Math.round(n * 100) / 100);
  // 字の幅のめやす（全角＝1、数字＝0.65 …）
  const emOf = t => { let n = 0; for (const ch of String(t).replace(/\[\[|\]\]|\*\*|\^|\{\{|\}\}/g, '')) n += /[A-Z]/.test(ch) ? 0.75 : /[0-9]/.test(ch) ? 0.65 : /[\x20-\x7e]/.test(ch) ? 0.56 : 1; return n; };

  /* ---------------- 文字の中 ---------------- */
  // 1〜3文字の小文字（x, l, ax …）は数式らしく斜体に。cm・kg などの単位と、\ をつけた文字は立体のまま
  const UNITS = new Set(['cm', 'mm', 'km', 'kg', 'mg', 'ml', 'dl', 'kl', 'ha', 'min', 'sec', 'cc']);
  const VAR_RE = /(^|[^A-Za-z&#;\u0001])([a-z]{1,3})(?![A-Za-z])/g;
  const italic = (t, open, close) => t.replace(VAR_RE, (m, pre, w) => (w.length > 1 && UNITS.has(w) ? m : pre + open + w + close));
  const plain = t => italic(esc(String(t).replace(/\\([A-Za-z])/g, '\u0001$1')), '<i class="v">', '</i>').replace(/\n/g, '<br>').replace(/\u0001/g, '');
  function inl(s) {
    s = String(s == null ? '' : s);
    const re = /\{\{([\s\S]*?)\}\}|\[\[([^\]\/]*)\/([^\]]*)\]\]|\*\*([\s\S]+?)\*\*|\^\{([^}]*)\}|\^([0-9]+|[A-Za-z])|√\{([^{}]*)\}/g;
    let out = '', last = 0, m;
    while ((m = re.exec(s))) {
      out += plain(s.slice(last, m.index));
      if (m[1] !== undefined) out += `<span class="bl" style="width:${Math.max(2.4, emOf(m[1]) + 1).toFixed(1)}em"><span class="ansx">${inl(m[1])}</span></span>`;
      else if (m[2] !== undefined) out += `<span class="fr"><span>${inl(m[2])}</span><span>${inl(m[3])}</span></span>`;
      else if (m[4] !== undefined) out += `<b>${inl(m[4])}</b>`;
      else if (m[5] !== undefined) out += `<sup>${inl(m[5])}</sup>`;
      else if (m[7] !== undefined) out += `<span class="sq">√<span>${inl(m[7])}</span></span>`;
      else out += `<sup>${plain(m[6])}</sup>`;
      last = re.lastIndex;
    }
    return out + plain(s.slice(last));
  }

  /* ---------------- 図（SVG・単位は mm） ---------------- */
  const ln = (x1, y1, x2, y2, c, w, extra) => `<line x1="${f2(x1)}" y1="${f2(y1)}" x2="${f2(x2)}" y2="${f2(y2)}" stroke="${c}" stroke-width="${w}"${extra || ''}/>`;
  const tx = (x, y, s, size, anchor, extra) => `<text x="${f2(x)}" y="${f2(y)}" font-size="${size}" text-anchor="${anchor || 'middle'}"${extra || ''}>${s}</text>`;
  const svgMath = s => italic(esc(String(s).replace(/\\([A-Za-z])/g, '\u0001$1')), '<tspan class="sv">', '</tspan>').replace(/\u0001/g, '');
  const plab = n => esc(String(n).replace(/_.*$/, '').replace(/'/g, '′'));
  const pol = (cx, cy, r, deg) => [cx + r * Math.cos(deg * Math.PI / 180), cy - r * Math.sin(deg * Math.PI / 180)];   // 画面の座標（y が下向き）で、数学の向き（反時計まわり）の角度

  // 図の中の字。{{3}}cm のように書くと、「3」のところが空欄（下線）になり、解答を表示すると赤で出る
  function rich(x, y, s, size, anchor, extra) {
    s = String(s == null ? '' : s);
    if (!/\{\{/.test(s)) return tx(x, y, svgMath(s), size, anchor, extra);
    const parts = s.split(/(\{\{[^}]*\}\})/).filter(p => p !== '');
    const isBlank = p => /^\{\{/.test(p);
    const wOf = p => (isBlank(p) ? Math.max(5.2, emOf(p.slice(2, -2)) * size * 0.62 + 3.2) : emOf(p.replace(/\\/g, '')) * size * 0.62);
    const total = parts.reduce((a, p) => a + wOf(p), 0);
    let cur = anchor === 'start' ? x : anchor === 'end' ? x - total : x - total / 2, out = '';
    parts.forEach(p => {
      const w = wOf(p);
      if (isBlank(p)) {
        out += ln(cur + 0.4, y + 0.9, cur + w - 0.4, y + 0.9, '#333', 0.25);
        out += tx(cur + w / 2, y - 0.1, svgMath(p.slice(2, -2)), size, 'middle', ' class="ansx"');
      } else out += tx(cur, y, svgMath(p), size, 'start');
      cur += w;
    });
    return out;
  }

  /* ---- 立体の見取図（角柱・角錐・直方体・円柱・円錐・球）。f.dims は 'r 4cm\nl 10cm' のように、1行に1つ ---- */
  function figSolid(f, W, H) {
    const shape = f.shape || 'cube', K = 0.5, PH = 35 * Math.PI / 180, kc = K * Math.cos(PH), ks = K * Math.sin(PH);
    const VIEW = [-kc, 1, -ks], P2 = p => [p[0] + kc * p[1], p[2] + ks * p[1]];
    const a = Math.max(0.1, num(f.a, 4)), b = Math.max(0.1, num(f.b, a)), c = Math.max(0.1, num(f.c, a));
    const n = Math.max(3, Math.min(10, Math.round(num(f.n, shape === 'pyramid' ? 4 : 3))));
    const lt = String(f.labels || '').trim(), labels = !lt ? [] : /\s/.test(lt) ? lt.split(/\s+/) : Array.from(lt);
    const segs = [], curves = [], extra = [];
    let V2 = [], idx = {};
    const dimLines = String(f.dims || '').split('\n').map(t => t.trim()).filter(Boolean).map(t => { const m = t.split(/[\s　]+/); return { key: m[0], text: m.slice(1).join(' ') }; });
    const sub = (p, q) => [p[0] - q[0], p[1] - q[1], p[2] - q[2]], dot3 = (p, q) => p[0] * q[0] + p[1] * q[1] + p[2] * q[2];
    if (['cube', 'cuboid', 'prism', 'pyramid'].includes(shape)) {
      let V = [], F = [];
      if (shape === 'cube' || shape === 'cuboid') {
        const w = a, d = shape === 'cube' ? a : b, h = shape === 'cube' ? a : c;
        V = [[0, 0, h], [w, 0, h], [w, d, h], [0, d, h], [0, 0, 0], [w, 0, 0], [w, d, 0], [0, d, 0]];
        F = [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]];
      } else {
        const R = a / (2 * Math.sin(Math.PI / n)), base = [];
        for (let k = 0; k < n; k++) { const t = (-90 - 180 / n + k * 360 / n) * Math.PI / 180; base.push([R * Math.cos(t), R * Math.sin(t)]); }
        if (shape === 'prism') {
          V = [...base.map(p => [p[0], p[1], c]), ...base.map(p => [p[0], p[1], 0])];
          F = [base.map((_, k) => k), base.map((_, k) => n + k)];
          for (let k = 0; k < n; k++) F.push([k, (k + 1) % n, n + (k + 1) % n, n + k]);
        } else {
          V = [[0, 0, c], ...base.map(p => [p[0], p[1], 0])];
          F = [base.map((_, k) => k + 1)];
          for (let k = 0; k < n; k++) F.push([0, 1 + k, 1 + (k + 1) % n]);
        }
      }
      const cen = V.reduce((s, p) => [s[0] + p[0] / V.length, s[1] + p[1] / V.length, s[2] + p[2] / V.length], [0, 0, 0]);
      const vis = F.map(face => {
        const Q = face.map(i => V[i]); let nx = 0, ny = 0, nz = 0;
        Q.forEach((p, k) => { const q = Q[(k + 1) % Q.length]; nx += (p[1] - q[1]) * (p[2] + q[2]); ny += (p[2] - q[2]) * (p[0] + q[0]); nz += (p[0] - q[0]) * (p[1] + q[1]); });
        const fc = Q.reduce((s, p) => [s[0] + p[0] / Q.length, s[1] + p[1] / Q.length, s[2] + p[2] / Q.length], [0, 0, 0]);
        let nn = [nx, ny, nz]; if (dot3(nn, sub(fc, cen)) < 0) nn = nn.map(v => -v);
        return dot3(nn, VIEW) < 0;
      });
      const E = new Map();
      F.forEach((face, fi) => face.forEach((v, k) => { const w = face[(k + 1) % face.length], key = Math.min(v, w) + '-' + Math.max(v, w); if (!E.has(key)) E.set(key, { i: Math.min(v, w), j: Math.max(v, w), f: [] }); E.get(key).f.push(fi); }));
      V2 = V.map(P2);
      E.forEach(e => segs.push({ a: V2[e.i], b: V2[e.j], hidden: !e.f.some(fi => vis[fi]) }));
      if (shape === 'pyramid' && labels.length > V2.length) V2.push(P2([0, 0, 0]));
      labels.forEach((nm, k) => { if (k < V2.length) idx[nm] = k; });
      if (shape === 'pyramid') { const h0 = P2([0, 0, 0]); dimLines.filter(d => d.key === 'h').forEach(d => { extra.push({ seg: [V2[0], h0], dash: true }); extra.push({ text: d.text, at: [(V2[0][0] + h0[0]) / 2, (V2[0][1] + h0[1]) / 2], dx: 1.2, anchor: 'start' }); }); }
    } else {
      // 円柱・円錐：底面・上面は、軸が水平な、ふつうの横長のだ円（斜めの投影はつかわない）。q＝だ円のつぶれぐあい（縦÷横）
      const r = a, h = c, q = Math.min(0.5, Math.max(0.15, num(f.q, 0.3)));
      const S = (t, z) => [r * Math.cos(t), z + q * r * Math.sin(t)];
      const arc = (t0, t1, z, hidden) => { const pts = []; for (let k = 0; k <= 60; k++) pts.push(S(t0 + (t1 - t0) * k / 60, z)); curves.push({ pts, hidden }); };
      if (shape === 'cylinder') {
        arc(0, 2 * Math.PI, h, false);          // 上のだ円
        arc(Math.PI, 2 * Math.PI, 0, false);    // 下のだ円の手前（実線）
        arc(0, Math.PI, 0, true);               // 下のだ円の向こう（点線）
        segs.push({ a: [-r, 0], b: [-r, h], hidden: false }, { a: [r, 0], b: [r, h], hidden: false });
        V2 = [[0, h], [0, 0]];
        dimLines.forEach(d => {
          // 半径 r：上の面の中心から右はしまで。字は、右はしの外がわ
          if (d.key === 'r') { extra.push({ seg: [[0, h], S(0, h)], thin: true }); extra.push({ text: d.text, at: S(0, h), dx: 1.8, anchor: 'start' }); }
          if (d.key === 'h') extra.push({ text: d.text, at: [r, h / 2], dx: 1.6, anchor: 'start' });
        });
      } else if (shape === 'cone') {
        const A2 = [0, h], t1 = Math.asin(Math.min(0.98, q * r / h));   // 頂点から底面のだ円にひいた接線の、接点の角
        arc(Math.PI - t1, 2 * Math.PI + t1, 0, false);                  // 底面の手前（実線）
        arc(t1, Math.PI - t1, 0, true);                                 // 底面の向こう（点線）
        const PR = S(t1, 0), PL = S(Math.PI - t1, 0);
        segs.push({ a: A2, b: PR, hidden: false }, { a: A2, b: PL, hidden: false });
        V2 = [A2, [0, 0]];
        dimLines.forEach(d => {
          // 半径 r：底面の中心から右はしまでの点線。字は、点線をのばした先（底面の右はしの外がわ）に書く
          if (d.key === 'r') { extra.push({ seg: [[0, 0], S(0, 0)], dash: true }); extra.push({ text: d.text, at: S(0, 0), dx: 1.8, anchor: 'start' }); }
          if (d.key === 'h') { extra.push({ seg: [A2, [0, 0]], dash: true }); extra.push({ text: d.text, at: [0, h / 2], dx: 1.2, anchor: 'start' }); }
          // 母線 l：右の母線の外がわ（f.lside が 'left' なら左の母線の外がわ）に書く
          if (d.key === 'l') {
            const left = f.lside === 'left', P = left ? PL : PR;
            extra.push({ text: d.text, at: [(A2[0] + P[0]) / 2, (A2[1] + P[1]) / 2], dx: left ? -1.6 : 1.6, anchor: left ? 'end' : 'start' });
          }
        });
      } else {   // 球・半球
        const circ = (t0, t1, hidden) => { const pts = []; for (let k = 0; k <= 60; k++) { const t = t0 + (t1 - t0) * k / 60; pts.push([r * Math.cos(t), r * Math.sin(t)]); } curves.push({ pts, hidden }); };
        const ell = (t0, t1, hidden) => { const pts = []; for (let k = 0; k <= 60; k++) { const t = t0 + (t1 - t0) * k / 60; pts.push([r * Math.cos(t), 0.28 * r * Math.sin(t)]); } curves.push({ pts, hidden }); };
        if (shape === 'hemisphere') circ(0, Math.PI, false); else circ(0, 2 * Math.PI, false);
        ell(Math.PI, 2 * Math.PI, false); ell(0, Math.PI, true);
        V2 = [[0, 0]];
        dimLines.forEach(d => { if (d.key === 'r') { extra.push({ seg: [[0, 0], [r, 0]], thin: true, dot0: true }); extra.push({ text: d.text, at: [r / 2, 0], dy: -1.4, anchor: 'middle' }); } });
      }
    }
    // 縮尺をきめる
    const all = [...segs.flatMap(s => [s.a, s.b]), ...curves.flatMap(cv => cv.pts), ...V2], real = all.slice();
    const bx0 = Math.min(...all.map(p => p[0])), bx1 = Math.max(...all.map(p => p[0])), by0 = Math.min(...all.map(p => p[1])), by1 = Math.max(...all.map(p => p[1]));
    const cap = f.caption ? 4.2 : 0, pad = num(f.pad, 6.5), ah = H - 2 * 6.5 - cap;
    let padR = pad, aw, s, ox;
    for (let k = 0; k < 3; k++) {   // 右はしに出る字が図からはみ出すときは、右の余白を広げる
      aw = W - pad - padR; s = Math.min(aw / Math.max(bx1 - bx0, 1e-6), ah / Math.max(by1 - by0, 1e-6)); ox = pad + (aw - (bx1 - bx0) * s) / 2 - bx0 * s;
      const over = Math.max(0, ...extra.filter(e => e.text && e.anchor === 'start').map(e => ox + e.at[0] * s + (e.dx || 0) + emOf(String(e.text).replace(/\\/g, '')) * 2.9 * 0.62 + 4 - W));
      if (over < 0.05) break;
      padR += over;
    }
    const oy = 6.5 + cap + (ah - (by1 - by0) * s) / 2 + by1 * s;
    const X = p => ox + p[0] * s, Y = p => oy - p[1] * s;
    const cx = X([(Math.min(...real.map(p => p[0])) + Math.max(...real.map(p => p[0]))) / 2, 0]), cy = Y([0, (Math.min(...real.map(p => p[1])) + Math.max(...real.map(p => p[1]))) / 2]);
    const showHidden = f.hidden !== 'none';
    let out = `<rect x="0" y="0" width="${f2(W)}" height="${f2(H)}" fill="#fff"/>`;
    if (f.caption) out += tx(0.6, 3.5, svgMath(f.caption), 3, 'start', ' class="cap"');
    const dash = ' stroke-dasharray="1.2 0.9"';
    segs.forEach(sg => { if (sg.hidden && !showHidden) return; out += ln(X(sg.a), Y(sg.a), X(sg.b), Y(sg.b), '#222', sg.hidden ? 0.22 : 0.32, sg.hidden ? dash : ' stroke-linecap="round"'); });
    curves.forEach(cv => { if (cv.hidden && !showHidden) return; out += `<polyline points="${cv.pts.map(p => f2(X(p)) + ',' + f2(Y(p))).join(' ')}" fill="none" stroke="#222" stroke-width="${cv.hidden ? 0.22 : 0.32}"${cv.hidden ? dash : ''}/>`; });
    extra.forEach(e => {
      if (e.seg) out += ln(X(e.seg[0]), Y(e.seg[0]), X(e.seg[1]), Y(e.seg[1]), '#222', 0.22, e.dash ? dash : '') + (e.dot0 ? `<circle cx="${f2(X(e.seg[0]))}" cy="${f2(Y(e.seg[0]))}" r="0.5" fill="#222"/>` : '');
      if (e.text) out += rich(X(e.at) + (e.dx || 0), Y(e.at) + (e.dy || 0) + 1, e.text, 2.9, e.anchor || 'middle');
    });
    // 辺の長さ（AB 5cm）
    dimLines.forEach(d => {
      const m = /^(\S+?)(\S+?)$/.exec(d.key); if (!m || !(m[1] in idx) || !(m[2] in idx)) return;
      const p = V2[idx[m[1]]], q = V2[idx[m[2]]], mx = (X(p) + X(q)) / 2, my = (Y(p) + Y(q)) / 2;
      let nx = -(Y(q) - Y(p)), ny = X(q) - X(p); const L = Math.hypot(nx, ny) || 1; nx /= L; ny /= L;
      if (nx * (mx - cx) + ny * (my - cy) < 0) { nx = -nx; ny = -ny; }
      out += rich(mx + nx * 3, my + ny * 3 + 1, d.text, 2.9, Math.abs(nx) < 0.4 ? 'middle' : nx > 0 ? 'start' : 'end');
    });
    // 頂点の名前
    Object.keys(idx).forEach(nm => {
      const p = V2[idx[nm]], x = X(p), y = Y(p); let dx = x - cx, dy = y - cy; const L = Math.hypot(dx, dy) || 1; dx /= L; dy /= L;
      out += tx(x + dx * 2.6, y + dy * 2.6 + 1.1, plab(nm), 3.1, Math.abs(dx) < 0.3 ? 'middle' : dx > 0 ? 'start' : 'end', ' class="pl"');
    });
    return out;
  }

  /* ---- 円錐の展開図（おうぎ形＋円）。f.R＝母線、f.r＝底面の半径（図の形をきめる数。字ではない）。
          字：f.lR（母線の長さの字）、f.lr（半径の字）、f.ansAngle（中心角。解答のみ赤）、f.ansArc（弧の長さ。解答のみ赤） ---- */
  function figConeNet(f, W, H) {
    const R = num(f.R, 10), r = num(f.r, 4), th = Math.min(340, 360 * r / R), h2 = th / 2;
    const arcPts = n => { const o = []; for (let k = 0; k <= n; k++) o.push(pol(0, 0, R, -90 - h2 + th * k / n)); return o; };
    const A1 = pol(0, 0, R, -90 - h2), A2 = pol(0, 0, R, -90 + h2), C = [0, R + r];   // 画面の座標（y が下向き）：頂点が原点、円は弧の中心の下
    const pts = [[0, 0], ...arcPts(60), [C[0] - r, C[1]], [C[0] + r, C[1]], [0, C[1] + r]];
    const x0 = Math.min(...pts.map(p => p[0])), x1 = Math.max(...pts.map(p => p[0])), y0 = Math.min(...pts.map(p => p[1])), y1 = Math.max(...pts.map(p => p[1]));
    const cap = f.caption ? 4.2 : 0, padL = num(f.padL, 3), padR = num(f.padR, 3), padT = 6.5 + cap, padB = 3;
    const s = Math.min((W - padL - padR) / (x1 - x0), (H - padT - padB) / (y1 - y0));
    const ox = padL + ((W - padL - padR) - (x1 - x0) * s) / 2 - x0 * s, oy = padT + ((H - padT - padB) - (y1 - y0) * s) / 2 - y0 * s;
    const X = p => ox + p[0] * s, Y = p => oy + p[1] * s;
    let out = `<rect x="0" y="0" width="${f2(W)}" height="${f2(H)}" fill="#fff"/>`;
    if (f.caption) out += tx(0.6, 3.5, svgMath(f.caption), 3, 'start', ' class="cap"');
    // おうぎ形
    out += `<polygon points="${[[0, 0], ...arcPts(80)].map(p => f2(X(p)) + ',' + f2(Y(p))).join(' ')}" fill="none" stroke="#222" stroke-width="0.32" stroke-linejoin="round"/>`;
    // 底面の円（弧の中点で接する）と、半径
    out += `<circle cx="${f2(X(C))}" cy="${f2(Y(C))}" r="${f2(r * s)}" fill="none" stroke="#222" stroke-width="0.32"/>`;
    out += ln(X(C), Y(C), X(C) + r * s, Y(C), '#222', 0.22, ' stroke-dasharray="1.2 0.9"') + `<circle cx="${f2(X(C))}" cy="${f2(Y(C))}" r="0.5" fill="#222"/>`;
    if (f.lr) out += rich(X(C) + r * s / 2, Y(C) - 1.2, f.lr, 2.9, 'middle');
    // 母線（左のふちの外がわ＝辺から上へはなして）
    if (f.lR) {
      const m = [A1[0] / 2, A1[1] / 2];
      let nx = A1[1], ny = -A1[0]; if (ny > 0) { nx = -nx; ny = -ny; }   // 辺に垂直で、上向きの側
      const L = Math.hypot(nx, ny) || 1;
      out += rich(X(m) + nx / L * 3.4, Y(m) + ny / L * 3.4 + 1, f.lR, 2.9, 'middle');
    }
    // 解答：弧（赤い太線）と、その長さ、中心角
    let ans = '';
    if (f.ansArc) {
      ans += `<polyline points="${arcPts(60).map(p => f2(X(p)) + ',' + f2(Y(p))).join(' ')}" fill="none" stroke="#d62828" stroke-width="0.8" stroke-linecap="round"/>`;
      const q = [0, 0.74 * R];
      ans += tx(X(q), Y(q) + 0.9, svgMath(f.ansArc), 2.9, 'middle');
    }
    if (f.ansAngle) {
      const ra = 0.2 * R, ap = []; for (let k = 0; k <= 30; k++) ap.push(pol(0, 0, ra, -90 - h2 + th * k / 30));
      ans += `<polyline points="${ap.map(p => f2(X(p)) + ',' + f2(Y(p))).join(' ')}" fill="none" stroke="#d62828" stroke-width="0.35"/>`;
      ans += tx(X([0, 0.42 * R]), Y([0, 0.42 * R]) + 0.9, svgMath(f.ansAngle), 3, 'middle');
    }
    if (ans) out += `<g class="ansx">${ans}</g>`;
    return out;
  }

  // 自由な図：f.svg に、SVG の中身（単位は mm）か、(W, H, h) => 文字列 を渡す。h は小道具（ln・tx・rich・f2・pol）
  const figCustom = (f, W, H) => (typeof f.svg === 'function' ? f.svg(W, H, { ln, tx, rich, f2, pol, svgMath, ans: s => `<g class="ansx">${s}</g>` }) : String(f.svg || ''));

  function figSVG(f, W, H) {
    let inner = '';
    try {
      inner = f.kind === 'solid' ? figSolid(f, W, H) : f.kind === 'conenet' ? figConeNet(f, W, H) : f.kind === 'svg' ? figCustom(f, W, H) : '';
    } catch (e) { inner = `<text x="2" y="6" font-size="3" fill="#d62828">図のエラー：${esc(e.message)}</text>`; }
    return `<svg class="fsvg" viewBox="0 0 ${f2(W)} ${f2(H)}" width="${f2(W)}mm" height="${f2(H)}mm" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
  }

  /* ---------------- ブロック ---------------- */
  const PAPER = { A4: { w: 210, h: 297, mx: 12, top: 23, bottom: 9 }, B5: { w: 182, h: 257, mx: 11, top: 21, bottom: 8 } };
  const COL_GAP = 6, FIG_GAP = 4;
  const tag = (cls, label) => (label ? `<span class="tag ${cls}">${esc(label)}</span>` : '');
  const rowsOf = b => Math.max(1, Math.round(num(b.rows, 1)));

  function blockHTML(b, W, g) {
    if (b.type === 'meate' || b.type === 'kadai') {
      const label = b.type === 'meate' ? (b.label || 'めあて') : (b.label == null ? '学習課題' : b.label);
      return `<div class="wb wb-t${b.type === 'kadai' ? ' box' : ''}" style="height:${rowsOf(b) * g.pitch}mm">${tag('t-' + b.type, label)}<div class="tx">${inl(b.text)}</div></div>`;
    }
    if (b.type === 'board') {   // 板書の写し：ふだんは罫線だけ。解答を表示すると、教師の板書が赤で出る
      const an = b.answer ? `<div class="tx">${inl(b.answer)}</div>` : '';
      return `<div class="wb wb-b" style="height:${rowsOf(b) * g.pitch}mm">${an}</div>`;
    }
    if (b.type === 'gap') return `<div class="wb wb-gap" style="height:${rowsOf(b) * g.pitch}mm"></div>`;
    if (b.type === 'figure') {
      const figs = b.figs || [], H = rowsOf(b) * g.pitch;
      const ws = figs.map(f => Math.max(0.2, num(f.w, 1))), sum = ws.reduce((a, c) => a + c, 0), avail = W - FIG_GAP * (figs.length - 1);
      return `<div class="wb wb-fig" style="height:${H}mm">${figs.map((f, i) => { const fw = avail * ws[i] / sum; return `<div class="fg" style="width:${f2(fw)}mm">${figSVG(f, fw, H)}</div>`; }).join('')}</div>`;
    }
    if (b.type === 'cols') {
      const r = String(b.ratio || '1:1').split(':').map(x => Math.max(1, num(x, 1)));
      const n = b.cols.length, sum = b.cols.reduce((a, c, i) => a + (r[i] || 1), 0);
      const widths = b.cols.map((c, i) => (W - COL_GAP * (n - 1)) * (r[i] || 1) / sum);
      return `<div class="wb wb-cols" style="grid-template-columns:${widths.map(w => f2(w) + 'mm').join(' ')}">${b.cols.map((c, i) => `<div class="wcol">${c.blocks.map(x => blockHTML(x, widths[i], g)).join('')}</div>`).join('')}</div>`;
    }
    return '';
  }

  // 罫線とドット（印刷でもくっきり出るよう、模様を使わず1本ずつ線で描く）
  function ruleSVG(g, dots) {
    const W = g.cw, H = g.rows * g.pitch, p = g.pitch, off = (W % p) / 2;
    let s = '';
    for (let i = 0; i <= g.rows; i++) {
      const y = f2(i * p);
      s += `<line x1="0" y1="${y}" x2="${f2(W)}" y2="${y}" stroke="#a3b6c8" stroke-width="${i === 0 ? 0.28 : 0.2}"/>`;
      if (dots) s += `<line x1="${f2(off)}" y1="${y}" x2="${f2(W)}" y2="${y}" stroke="#58748e" stroke-width="0.6" stroke-linecap="round" stroke-dasharray="0 ${p}"/>`;
    }
    return `<svg class="wsp-rule" viewBox="0 0 ${f2(W)} ${f2(H)}" width="${f2(W)}mm" height="${f2(H)}mm" overflow="visible" aria-hidden="true">${s}</svg>`;
  }

  const geo = sheet => { const P = PAPER[sheet.paper] || PAPER.A4, pitch = sheet.pitch || 7; return { P, pitch, rows: Math.floor((P.h - P.top - P.bottom) / pitch + 1e-6), cw: P.w - 2 * P.mx }; };
  // ブロックの高さ（行）。2段組は、高い列
  const heightOf = b => (b.type === 'cols' ? Math.max(...b.cols.map(c => c.blocks.reduce((a, x) => a + heightOf(x), 0))) : rowsOf(b));
  const splitPages = blocks => { const pages = [[]]; blocks.forEach(b => { if (b.type === 'break') pages.push([]); else pages[pages.length - 1].push(b); }); return pages; };

  function pagesHTML(sheet) {
    const g = geo(sheet), P = g.P, pages = splitPages(sheet.blocks), hd = sheet.head != null ? sheet.head : '';
    return pages.map((bl, pi) => `<div class="wsp" style="width:${P.w}mm;height:${P.h}mm;--pitch:${g.pitch}mm">
      <div class="wsp-head" style="left:${P.mx}mm;right:${P.mx}mm;top:${P.top - 12}mm">
        <div class="wh-date"><span class="u w2"></span>月<span class="u w2"></span>日（<span class="u w1"></span>）</div>
        <div class="wh-mid">${esc(hd)}${pages.length > 1 ? `　${pi + 1}／${pages.length}` : ''}</div>
        <div class="wh-name"><span class="u w1"></span>年<span class="u w1"></span>組<span class="u w1"></span>号　氏名<span class="u w6"></span></div>
      </div>
      <div class="wsp-body" style="left:${P.mx}mm;top:${P.top}mm;width:${g.cw}mm;height:${g.rows * g.pitch}mm">
        ${ruleSVG(g, sheet.dots !== false)}
        <div class="wsp-flow">${bl.map(b => blockHTML(b, g.cw, g)).join('')}</div>
      </div>
    </div>`).join('');
  }

  /* ---------------- 授業の登録 ---------------- */
  const O = (o, extra) => Object.assign(o, extra || {});
  IK.unit = u => { IK.units.push(u); };
  IK.add = (id, meta, blocks) => {
    IK.lessons[id] = Object.assign({ id, paper: 'A4', pitch: 7, dots: true }, meta, { blocks });
    if (IK.order.indexOf(id) < 0) IK.order.push(id);
  };
  // ワークシートを書くときの道具（data/ws_<単元>.js で使う）
  IK.b = {
    M: (text, o) => O({ type: 'meate', text, rows: 1 }, o),                                        // めあて
    K: (label, text, rows, o) => O({ type: 'kadai', label, text, rows: rows || 2 }, o),            // 学習課題・例題（枠つき。字は最初から印刷する。数字の空欄は {{3}} と書く）
    B: (rows, answer, o) => O({ type: 'board', rows: rows || 3, answer: answer || '' }, o),        // 板書の写し（空欄の罫）。answer は解答を表示したときだけ赤で出る。1行＝\n で区切る
    G: rows => ({ type: 'gap', rows: rows || 1 }),                                                 // すき間
    F: (rows, ...figs) => ({ type: 'figure', rows, figs }),                                        // 図（印刷する。横に並べられる）
    C2: (left, right, ratio) => ({ type: 'cols', ratio: ratio || '3:2', cols: [{ blocks: left }, { blocks: right }] }),   // 2段組（左に問題と板書、右に図）
    BR: () => ({ type: 'break' }),                                                                 // 改ページ
    SO: o => O({ kind: 'solid' }, o),                                                              // 立体の見取図
    NET: o => O({ kind: 'conenet' }, o),                                                           // 円錐の展開図
    SVG: (svg, o) => O({ kind: 'svg', svg }, o)                                                    // 自由な図
  };
  IK.render = { pagesHTML, geo, heightOf, inl, emOf, blockHTML };
})();
