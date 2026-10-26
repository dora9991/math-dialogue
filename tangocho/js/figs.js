/* 図（SVG）。面積・体積の問題に添える小さな図。ひとつの図は 150×70 の枠に入る。
   長さは図に書きこむ（図は目安で、縮尺どおりではない）。線と字は currentColor なので、画面の明るい・暗いに合う。 */
(function () {
  'use strict';
  const TG = window.TG;
  const F = (TG.figs = {});

  const W = 150, H = 70;
  const n1 = v => (Math.round(v * 10) / 10).toString();
  const pts = a => a.map(p => n1(p[0]) + ',' + n1(p[1])).join(' ');
  const svg = body => `<svg class="fig" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">${body}</svg>`;
  const poly = a => `<polygon points="${pts(a)}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>`;
  const seg = (a, b, dash) => `<line x1="${n1(a[0])}" y1="${n1(a[1])}" x2="${n1(b[0])}" y2="${n1(b[1])}" stroke="currentColor" stroke-width="${dash ? 1.2 : 1.6}" stroke-linecap="round"${dash ? ' stroke-dasharray="4 3"' : ''}/>`;
  const tx = (x, y, s, anchor) => `<text x="${n1(x)}" y="${n1(y)}" text-anchor="${anchor || 'middle'}" font-size="12">${s}</text>`;
  // 直角の印（角 c に、x方向 sx・y方向 sy の向きで）
  const rt = (c, sx, sy) => `<polyline points="${n1(c[0] + 6 * sx)},${n1(c[1])} ${n1(c[0] + 6 * sx)},${n1(c[1] + 6 * sy)} ${n1(c[0])},${n1(c[1] + 6 * sy)}" fill="none" stroke="currentColor" stroke-width="1"/>`;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  // 寸法の比をなるべく保って、枠 (mw×mh) に入れる。細くなりすぎないように下限をつける
  const fit = (w, h, mw, mh, lw, lh) => { const k = Math.min(mw / w, mh / h); return [clamp(w * k, lw || 24, mw), clamp(h * k, lh || 18, mh)]; };

  /* ---------------- 平面 ---------------- */
  F.rect = (w, h, u) => {
    const [rw, rh] = fit(w, h, 100, 40), x = 14, y = 6;
    return svg(poly([[x, y], [x + rw, y], [x + rw, y + rh], [x, y + rh]]) + tx(x + rw / 2, y + rh + 14, `${w}${u}`) + tx(x + rw + 6, y + rh / 2 + 4, `${h}${u}`, 'start'));
  };
  F.square = (a, u) => {
    const s = 38, x = 24, y = 6;
    return svg(poly([[x, y], [x + s, y], [x + s, y + s], [x, y + s]]) + tx(x + s / 2, y + s + 14, `${a}${u}`) + tx(x + s + 6, y + s / 2 + 4, `${a}${u}`, 'start'));
  };
  // 三角形：kind='right'（直角三角形）か 'acute'（高さを点線で示す）。apex は頂点の位置（0.3〜0.7）
  F.triangle = (b, h, u, kind, apex) => {
    const [bw, th] = fit(b, h, 100, 40, kind === 'right' ? 24 : 56), x = 14, y = 6, base = y + th;
    if (kind === 'right') {
      return svg(poly([[x, base], [x + bw, base], [x + bw, y]]) + rt([x + bw, base], -1, -1) + tx(x + bw / 2, base + 14, `${b}${u}`) + tx(x + bw + 6, y + th / 2 + 4, `${h}${u}`, 'start'));
    }
    // 高さの字は、点線のそばの、広いほうに置く（頂点が左寄りなら右、右寄りなら左、まん中なら点線の上）
    const ax = x + bw * apex, hy = base - th * 0.45 + 4;
    const lab = apex < 0.5 ? tx(ax - 4, hy, `${h}${u}`, 'start') : apex > 0.5 ? tx(ax + 4, hy, `${h}${u}`, 'end') : tx(ax, hy, `${h}${u}`);
    return svg(poly([[x, base], [x + bw, base], [ax, y]]) + seg([ax, y], [ax, base], true) + rt([ax, base], 1, -1) + tx(x + bw / 2, base + 14, `${b}${u}`) + lab);
  };
  F.parallelogram = (b, h, u) => {
    const k = Math.min(80 / b, 40 / h), bw = clamp(b * k, 28, 80), rh = clamp(h * k, 20, 40), s = Math.min(bw * 0.3, 22), x = 14, y = 6, base = y + rh;
    return svg(poly([[x + s, y], [x + s + bw, y], [x + bw, base], [x, base]]) + seg([x + s, y], [x + s, base], true) + rt([x + s, base], 1, -1) + tx(x + bw / 2, base + 14, `${b}${u}`) + tx(x + s + 4, y + rh / 2 + 4, `${h}${u}`, 'start'));
  };
  F.trapezoid = (a, b, h, u) => {
    const k = Math.min(100 / b, 34 / h), bw = clamp(b * k, 40, 100), tw = clamp(a * k, 20, bw - 12), rh = clamp(h * k, 20, 34), x = 14, y = 16, base = y + rh, off = (bw - tw) * 0.25;
    return svg(poly([[x + off, y], [x + off + tw, y], [x + bw, base], [x, base]]) + seg([x + off, y], [x + off, base], true) + rt([x + off, base], 1, -1)
      + tx(x + off + tw / 2, y - 4, `${a}${u}`) + tx(x + bw / 2, base + 14, `${b}${u}`) + tx(x + off + 4, y + rh / 2 + 4, `${h}${u}`, 'start'));
  };
  F.circle = (r, u) => {
    const cx = 44, cy = 35, R = 28;
    return svg(`<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="currentColor" stroke-width="1.6"/>` + seg([cx, cy], [cx + R, cy]) + `<circle cx="${cx}" cy="${cy}" r="1.8" fill="currentColor"/>` + tx(cx + R + 6, cy + 4, `半径 ${r}${u}`, 'start'));
  };

  F.semicircle = (r, u) => {
    const cx = 44, cy = 50, R = 30;
    return svg(`<path d="M${cx - R},${cy} A${R},${R} 0 0 1 ${cx + R},${cy} Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>`
      + seg([cx, cy], [cx + R, cy]) + `<circle cx="${cx}" cy="${cy}" r="1.8" fill="currentColor"/>` + tx(cx + R + 6, cy + 4, `半径 ${r}${u}`, 'start'));
  };

  /* ---------------- 立体（斜めから見た図）。見えない辺は点線 ---------------- */
  // 点 p が凸多角形 poly の内側か
  const inside = (p, poly_) => {
    let s = 0;
    for (let i = 0; i < poly_.length; i++) {
      const a = poly_[i], b = poly_[(i + 1) % poly_.length], c = (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
      if (c !== 0) { if (s && Math.sign(c) !== s) return false; s = Math.sign(c); }
    }
    return true;
  };
  // 手前の面が front（多角形）で、奥へ (dx, -dy) ずらした柱。見えない辺を点線にする
  const prismOblique = (front, dx, dy) => {
    const back = front.map(p => [p[0] + dx, p[1] - dy]);
    const hid = back.map(p => inside(p, front));
    let out = poly(front);
    front.forEach((p, i) => {
      const j = (i + 1) % front.length;
      out += seg(p, back[i], hid[i]) + seg(back[i], back[j], hid[i] || hid[j]);
    });
    return out;
  };

  F.cuboid = (a, b, c, u) => {
    const x = 30, dx = 16, dy = 14, fw = 38 + 26 * a / Math.max(a, b, c), fh = 18 + 10 * c / Math.max(a, b, c), yt = 8 + dy, yb = yt + fh;
    const front = [[x, yt], [x + fw, yt], [x + fw, yb], [x, yb]];
    return svg(prismOblique(front, dx, dy) + tx(x + fw / 2, yb + 13, `${a}${u}`) + tx(x - 4, (yt + yb) / 2 + 4, `${c}${u}`, 'end') + tx(x + fw + dx / 2 + 4, yb - dy / 2 + 12, `${b}${u}`, 'start'));
  };
  F.cube = (a, u) => {
    const x = 40, s = 34, dx = 14, dy = 12, yt = 8 + dy, yb = yt + s;
    return svg(prismOblique([[x, yt], [x + s, yt], [x + s, yb], [x, yb]], dx, dy) + tx(x + s / 2, yb + 13, `一辺 ${a}${u}`));
  };
  // 三角柱：手前の面が直角三角形（底辺 b・高さ h）、奥行きが柱の高さ L
  F.triPrism = (b, h, L, u) => {
    const x = 30, dx = 18, dy = 14, fw = 52, fh = 32, yb = 8 + dy + fh;
    return svg(prismOblique([[x, yb], [x + fw, yb], [x, yb - fh]], dx, dy) + rt([x, yb], 1, -1) + tx(x + fw / 2, yb + 13, `${b}${u}`) + tx(x - 4, yb - fh / 2 + 4, `${h}${u}`, 'end') + tx(x + fw + dx / 2 + 4, yb - dy / 2 + 12, `${L}${u}`, 'start'));
  };
  // 台形柱：手前の面が台形（上底 a・下底 b・高さ h）、奥行きが柱の高さ L
  F.trapPrism = (a, b, h, L, u) => {
    const x = 26, dx = 14, dy = 9, bw = 58, tw = 34, fh = 38, off = 8, yt = 6 + dy, yb = yt + fh;
    return svg(prismOblique([[x + off, yt], [x + off + tw, yt], [x + bw, yb], [x, yb]], dx, dy)
      + seg([x + off, yt], [x + off, yb], true) + rt([x + off, yb], 1, -1)
      + tx(x + off + tw / 2, yt + 12, `${a}${u}`) + tx(x + off + 5, yt + 31, `${h}${u}`, 'start') + tx(x + bw / 2, yb + 13, `${b}${u}`)
      + tx(x + bw + dx / 2 + 4, yb - dy / 2 + 12, `${L}${u}`, 'start'));
  };
  // 底面積がわかっている柱（底面は六角形で描く）
  F.prismBase = (S, H, u) => {
    const cx = 58, by = 56, R = 34, ry = 11, hp = 26;
    const base = [0, 1, 2, 3, 4, 5].map(i => [cx + R * Math.cos(i * Math.PI / 3), by + ry * Math.sin(i * Math.PI / 3)]);
    const top = base.map(p => [p[0], p[1] - hp]);
    let out = poly(top);
    for (let i = 0; i < 6; i++) {
      const front = i <= 3;   // i=0〜3 が手前側（0 と 3 が左右のはし）
      out += seg(top[i], base[i], !front);
      const j = (i + 1) % 6;
      out += seg(base[i], base[j], !(i <= 2));
    }
    return svg(out + tx(cx, by - hp - ry - 5, `底面積 ${S}${u}²`) + tx(cx + R + 6, by - hp / 2 + 4, `高さ ${H}${u}`, 'start'));
  };
  // diam が true なら、半径ではなく直径を図に書く（r は半径。書く長さは 2r）
  const rlabel = (r, u, diam) => (diam ? `直径 ${2 * r}${u}` : `半径 ${r}${u}`);
  F.cylinder = (r, h, u, diam) => {
    const cx = 44, rx = 26, ry = 8, ty = 14, by = 52;
    return svg(`<ellipse cx="${cx}" cy="${ty}" rx="${rx}" ry="${ry}" fill="none" stroke="currentColor" stroke-width="1.6"/>`
      + seg([cx - rx, ty], [cx - rx, by]) + seg([cx + rx, ty], [cx + rx, by])
      + `<path d="M${cx - rx},${by} A${rx},${ry} 0 0 0 ${cx + rx},${by}" fill="none" stroke="currentColor" stroke-width="1.6"/>`
      + `<path d="M${cx - rx},${by} A${rx},${ry} 0 0 1 ${cx + rx},${by}" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="4 3"/>`
      + seg(diam ? [cx - rx, ty] : [cx, ty], [cx + rx, ty]) + `<circle cx="${cx}" cy="${ty}" r="1.8" fill="currentColor"/>`
      + tx(cx + rx + 6, ty + 4, rlabel(r, u, diam), 'start') + tx(cx + rx + 6, (ty + by) / 2 + 8, `高さ ${h}${u}`, 'start'));
  };
  F.cone = (r, h, u, diam) => {
    const cx = 44, rx = 26, ry = 8, ay = 6, by = 52;
    return svg(seg([cx, ay], [cx - rx, by]) + seg([cx, ay], [cx + rx, by])
      + `<path d="M${cx - rx},${by} A${rx},${ry} 0 0 0 ${cx + rx},${by}" fill="none" stroke="currentColor" stroke-width="1.6"/>`
      + `<path d="M${cx - rx},${by} A${rx},${ry} 0 0 1 ${cx + rx},${by}" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="4 3"/>`
      + seg([cx, ay], [cx, by], true) + seg(diam ? [cx - rx, by] : [cx, by], [cx + rx, by]) + `<circle cx="${cx}" cy="${by}" r="1.8" fill="currentColor"/>`
      + tx(cx + rx + 6, by + 4, rlabel(r, u, diam), 'start') + tx(cx + rx + 6, (ay + by) / 2 + 2, `高さ ${h}${u}`, 'start'));
  };
  // 四角すい（底面 a×b の長方形）
  F.pyramid = (a, b, h, u) => {
    const x = 16, bw = 46, sk = 16, by = 46, ry = 9, ay = 4;
    const BL = [x, by + ry], BR = [x + bw, by + ry], TR = [x + bw + sk, by - ry], TL = [x + sk, by - ry], ctr = [x + bw / 2 + sk / 2, by], A = [ctr[0], ay];
    return svg(seg(A, BL) + seg(A, BR) + seg(A, TR) + seg(A, TL, true) + seg(BL, BR) + seg(BR, TR) + seg(BL, TL, true) + seg(TL, TR, true) + seg(A, ctr, true)
      + tx(x + bw / 2, by + ry + 12, `${a}${u}`) + tx(BR[0] + sk / 2 + 5, by + 6, `${b}${u}`, 'start') + tx(TR[0] + 8, (ay + by) / 2 + 2, `高さ ${h}${u}`, 'start'));
  };
})();
