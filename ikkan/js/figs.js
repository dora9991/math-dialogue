/* ikkan：ワークシートの図（数直線・座標平面・ヒストグラム・おうぎ形・てんびん・長方形）。
   どれも「(W, H, h) => SVG の中身（単位 mm）」を返す。h は core.js の小道具。
   解答を表示したときだけ出る赤いもの（矢印・グラフの線・強調）は、h.ans(…) でかこむ。
   図の中の字に {{3}}cm と書くと、数字だけが空欄になる（core.js の rich）。
   使い方（data/ws_*.js）： IK.b.NL({ … })、CO、HIST、SEC、BAL、RECT を、F(行数, 図…) の中に書く。 */
(function () {
  'use strict';
  const IK = window.IK, B = IK.b;
  const RED = '#d62828';
  const f2 = n => String(Math.round(n * 100) / 100);
  const mn = v => (v < 0 ? '−' : '') + Math.abs(Math.round(v * 1000) / 1000);   // 負の数は −（U+2212）
  // 矢じり：先が (x, y)、進む向きが ang（画面の座標でのラジアン）
  const head = (x, y, ang, c, s) => {
    s = s || 1.7;
    const a1 = ang + Math.PI * 0.85, a2 = ang - Math.PI * 0.85;
    return `<polygon points="${f2(x)},${f2(y)} ${f2(x + s * Math.cos(a1))},${f2(y + s * Math.sin(a1))} ${f2(x + s * Math.cos(a2))},${f2(y + s * Math.sin(a2))}" fill="${c}"/>`;
  };

  /* ---- 数直線。{ min, max, arrows:[{ from, to, text }], marks:[{ at }] }
          arrows（動きの矢印）と marks（答えの位置）は、解答を表示したときだけ赤で出る。矢印は上にえがき、2本目からは高くなる（7・13・19mm）。字は弧の内側 ---- */
  const numline = o => (W, H, h) => {
    const min = o.min != null ? o.min : -6, max = o.max != null ? o.max : 6, padL = 7, padR = 7;
    const u = (W - padL - padR) / (max - min), X = v => padL + (v - min) * u, y0 = o.y != null ? o.y : H - 8;
    let out = h.ln(X(min) - 2.5, y0, X(max) + 2.5, y0, '#222', 0.32) + head(X(max) + 3.6, y0, 0, '#222') + head(X(min) - 3.6, y0, Math.PI, '#222');
    for (let v = min; v <= max + 1e-9; v += 1) {
      out += h.ln(X(v), y0 - 1.3, X(v), y0 + 1.3, '#222', 0.28);
      out += h.tx(X(v), y0 + 5.3, mn(v), 2.9, 'middle');
    }
    const an = [];
    (o.arrows || []).forEach((a, i) => {
      const x1 = X(a.from), x2 = X(a.to), mx = (x1 + x2) / 2, hh = a.h || 7 + 6 * i, cy = y0 - 2 * hh;
      an.push(`<path d="M${f2(x1)},${f2(y0)} Q${f2(mx)},${f2(cy)} ${f2(x2)},${f2(y0)}" fill="none" stroke="${RED}" stroke-width="0.5"/>`);
      an.push(head(x2, y0, Math.atan2(y0 - cy, x2 - mx), RED, 2));
      if (a.text) an.push(h.tx(mx, y0 - hh + 3.7, a.text, 3, 'middle'));   // 字は弧の内側（頂点のすぐ下）。外がわにかく別の矢印とぶつからない
    });
    (o.marks || []).forEach(m => {   // 答えの位置：点と、目もりの数字をかこむ輪
      an.push(`<circle cx="${f2(X(m.at))}" cy="${f2(y0)}" r="0.9" fill="${RED}"/>`);
      an.push(`<ellipse cx="${f2(X(m.at))}" cy="${f2(y0 + 4.4)}" rx="${f2(m.at < 0 ? 4.2 : 3.3)}" ry="3.3" fill="none" stroke="${RED}" stroke-width="0.4"/>`);
    });
    return out + (an.length ? h.ans(an.join('')) : '');
  };

  /* ---- 座標平面。{ xmin, xmax, ymin, ymax, lines:[{ a, b, from, to, text, at:[x, y], anchor }], points:[{ x, y }] }
          lines（y＝ax+b の線分）と points は、解答を表示したときだけ赤で出る ---- */
  const coord = o => (W, H, h) => {
    const x0 = o.xmin != null ? o.xmin : -4, x1 = o.xmax != null ? o.xmax : 4, y0 = o.ymin != null ? o.ymin : -4, y1 = o.ymax != null ? o.ymax : 4;
    const padL = 6, padR = 7, padT = 7, padB = 6;
    const u = Math.min((W - padL - padR) / (x1 - x0), (H - padT - padB) / (y1 - y0));
    const ox = padL + (W - padL - padR - u * (x1 - x0)) / 2, oy = padT + (H - padT - padB - u * (y1 - y0)) / 2;
    const X = x => ox + (x - x0) * u, Y = y => oy + (y1 - y) * u;
    let out = '';
    for (let x = x0; x <= x1; x++) out += h.ln(X(x), Y(y0), X(x), Y(y1), '#c9d1da', 0.15);
    for (let y = y0; y <= y1; y++) out += h.ln(X(x0), Y(y), X(x1), Y(y), '#c9d1da', 0.15);
    out += h.ln(X(x0) - 1, Y(0), X(x1) + 2.4, Y(0), '#222', 0.3) + head(X(x1) + 3.4, Y(0), 0, '#222', 1.6);
    out += h.ln(X(0), Y(y0) + 1, X(0), Y(y1) - 2.4, '#222', 0.3) + head(X(0), Y(y1) - 3.4, -Math.PI / 2, '#222', 1.6);
    const fs = Math.min(2.5, u * 0.6);
    for (let x = x0; x <= x1; x++) if (x !== 0) out += h.tx(X(x), Y(0) + 3, mn(x), fs, 'middle');
    for (let y = y0; y <= y1; y++) if (y !== 0) out += h.tx(X(0) - 1, Y(y) + fs * 0.35, mn(y), fs, 'end');
    out += h.tx(X(0) - 1.3, Y(0) - 1.0, 'O', 2.6, 'end', ' class="pl"') + h.tx(X(x1) + 2.6, Y(0) + 4.6, 'x', 3, 'middle', ' class="pl"') + h.tx(X(0) - 2.4, Y(y1) - 2.4, 'y', 3, 'end', ' class="pl"');
    const an = [];
    (o.lines || []).forEach(l => {
      const fr = l.from != null ? l.from : x0, to = l.to != null ? l.to : x1, b = l.b || 0;
      an.push(h.ln(X(fr), Y(l.a * fr + b), X(to), Y(l.a * to + b), RED, 0.5, ' stroke-linecap="round"'));
      if (l.text && l.at) an.push(h.rich(X(l.at[0]), Y(l.at[1]), l.text, 3, l.anchor || 'start'));
    });
    (o.points || []).forEach(p => an.push(`<circle cx="${f2(X(p.x))}" cy="${f2(Y(p.y))}" r="0.85" fill="${RED}"/>`));
    return out + (an.length ? h.ans(an.join('')) : '');
  };

  /* ---- ヒストグラム。{ edges:[階級のさかい…], counts:[度数…], ymax, ystep, xname, yname, hl:[強調する階級の番号], show:true なら度数を棒の上に書く }
          hl は、解答を表示したときだけ赤い枠で出る ---- */
  const hist = o => (W, H, h) => {
    const e = o.edges, c = o.counts, n = c.length, ymax = o.ymax, ys = o.ystep || 1;
    const padL = 9, padR = 13, padT = 8, padB = 8;
    const bw = (W - padL - padR) / n, yu = (H - padT - padB) / ymax, X = i => padL + i * bw, Y = v => H - padB - v * yu;
    let out = '';
    for (let v = ys; v <= ymax; v += ys) out += h.ln(X(0), Y(v), X(n), Y(v), '#d3d9e0', 0.15);
    c.forEach((v, i) => { out += `<rect x="${f2(X(i))}" y="${f2(Y(v))}" width="${f2(bw)}" height="${f2(v * yu)}" fill="#eef1f5" stroke="#222" stroke-width="0.3"/>`; if (o.show) out += h.tx(X(i) + bw / 2, Y(v) - 1.2, String(v), 2.6, 'middle'); });
    out += h.ln(X(0), Y(0), X(n) + 2, Y(0), '#222', 0.32) + h.ln(X(0), Y(0), X(0), Y(ymax) - 2, '#222', 0.32);
    for (let v = 0; v <= ymax; v += ys) out += h.tx(X(0) - 1.6, Y(v) + 1, String(v), 2.6, 'end');
    e.forEach((v, i) => { out += h.tx(X(i), Y(0) + 4.2, String(v), 2.6, 'middle'); });
    if (o.yname) out += h.tx(X(0) - 1.6, Y(ymax) - 3.6, o.yname, 2.6, 'end');
    if (o.xname) out += h.tx(X(n) + 4.6, Y(0) + 4.2, o.xname, 2.6, 'start');
    const an = (o.hl || []).map(i => `<rect x="${f2(X(i))}" y="${f2(Y(c[i]))}" width="${f2(bw)}" height="${f2(c[i] * yu)}" fill="none" stroke="${RED}" stroke-width="0.7"/>`);
    return out + (an.length ? h.ans(an.join('')) : '');
  };

  /* ---- おうぎ形。{ R, th（中心角）, start（はじめの半径の向き。度。0＝右）, lr（半径の字）, la（中心角の字）, larc（弧の字）} ---- */
  const sector = o => (W, H, h) => {
    const R = o.R, th = o.th, a0 = o.start || 0, rad = d => d * Math.PI / 180;
    const arc = []; for (let k = 0; k <= 60; k++) arc.push([R * Math.cos(rad(a0 + th * k / 60)), R * Math.sin(rad(a0 + th * k / 60))]);
    const pts = [[0, 0], ...arc], bx0 = Math.min(...pts.map(p => p[0])), bx1 = Math.max(...pts.map(p => p[0])), by0 = Math.min(...pts.map(p => p[1])), by1 = Math.max(...pts.map(p => p[1]));
    const ml = 5, mr = o.larc ? 16 : 7, mt = 6, mb = o.lr ? 9 : 4;
    const s = Math.min((W - ml - mr) / (bx1 - bx0), (H - mt - mb) / (by1 - by0));
    const ox = ml + (W - ml - mr - (bx1 - bx0) * s) / 2 - bx0 * s, oy = mt + (H - mt - mb - (by1 - by0) * s) / 2 + by1 * s;
    const X = x => ox + x * s, Y = y => oy - y * s;
    let out = `<polygon points="${pts.map(p => f2(X(p[0])) + ',' + f2(Y(p[1]))).join(' ')}" fill="none" stroke="#222" stroke-width="0.32" stroke-linejoin="round"/>`;
    const ar = 0.2 * R, ap = []; for (let k = 0; k <= 30; k++) ap.push([ar * Math.cos(rad(a0 + th * k / 30)), ar * Math.sin(rad(a0 + th * k / 30))]);
    out += `<polyline points="${ap.map(p => f2(X(p[0])) + ',' + f2(Y(p[1]))).join(' ')}" fill="none" stroke="#222" stroke-width="0.25"/>`;
    const bis = rad(a0 + th / 2);
    if (o.lr) { const q = [R / 2 * Math.cos(rad(a0)), R / 2 * Math.sin(rad(a0))]; out += h.rich(X(q[0]), Y(q[1]) + 4.6, o.lr, 2.9, 'middle'); }
    if (o.la) out += h.rich(X(0.46 * R * Math.cos(bis)), Y(0.46 * R * Math.sin(bis)) + 1, o.la, 2.9, 'middle');
    if (o.larc) { const q = [(R + 2.8 / s) * Math.cos(bis), (R + 2.8 / s) * Math.sin(bis)]; out += h.rich(X(q[0]), Y(q[1]) + 1, o.larc, 2.9, Math.cos(bis) > 0.3 ? 'start' : Math.cos(bis) < -0.3 ? 'end' : 'middle'); }
    return out;
  };

  /* ---- てんびん（つり合っている）。{ left:[おもり…], right:[おもり…] }。おもり：{ box:'x' }＝重さのわからない箱、{ w:'5g' }＝おもり ---- */
  const balance = o => (W, H, h) => {
    const items = side => side.map(it => (it.box != null ? { kind: 'box', w: 8, text: it.box } : { kind: 'w', w: 10, text: it.w }));
    const L = items(o.left || []), R = items(o.right || []), tw = a => a.reduce((s, it) => s + it.w, 0) + Math.max(0, a.length - 1) * 1;
    const hwOf = a => Math.max(11, (tw(a) / 2 + 1.2) / 0.62), hwL = hwOf(L), hwR = hwOf(R);   // 皿の幅：おもりの高さのところで、紐よりも内がわにおさまるように
    const span = Math.min(W - hwL - hwR - 6, 60), cx = W / 2;   // 支点から、はりの左右のはしまで ＝ span / 2
    const beamY = 9, D = Math.min(24, H * 0.5), panY = beamY + D, by = Math.min(H - 2, panY + 12);
    let out = h.ln(cx - 9, by, cx + 9, by, '#222', 0.45) + h.ln(cx, beamY, cx, by, '#222', 0.7);   // 支点は細い柱（皿とかさならない）
    out += h.ln(cx - span / 2, beamY, cx + span / 2, beamY, '#222', 0.55) + `<circle cx="${f2(cx)}" cy="${f2(beamY)}" r="0.9" fill="#222"/>`;
    [[-1, L, hwL], [1, R, hwR]].forEach(([sg, a, hw]) => {
      const px = cx + sg * span / 2;
      out += h.ln(px, beamY, px - hw, panY, '#222', 0.25) + h.ln(px, beamY, px + hw, panY, '#222', 0.25) + h.ln(px - hw, panY, px + hw, panY, '#222', 0.7, ' stroke-linecap="round"');
      let x = px - tw(a) / 2;
      a.forEach(it => {
        if (it.kind === 'box') out += `<rect x="${f2(x)}" y="${f2(panY - 0.4 - 8)}" width="8" height="8" fill="#fff" stroke="#222" stroke-width="0.35"/>` + h.rich(x + 4, panY - 0.4 - 2.6, it.text, 3.2, 'middle');
        else out += `<rect x="${f2(x)}" y="${f2(panY - 0.4 - 6)}" width="10" height="6" rx="1" fill="#e9edf2" stroke="#222" stroke-width="0.3"/>` + h.rich(x + 5, panY - 0.4 - 1.8, it.text, 2.7, 'middle');
        x += it.w + 1;
      });
    });
    return out;
  };

  /* ---- 長方形。{ w, h（図の形をきめる数）, top（横の字）, side（縦の字）} ---- */
  const rect = o => (W, H, h) => {
    const w = o.w || 5, hh = o.h || 3, s = Math.min((W - 24) / w, (H - 16) / hh), rw = w * s, rh = hh * s, x0 = (W - rw) / 2, y0 = (H - rh) / 2;
    let out = `<rect x="${f2(x0)}" y="${f2(y0)}" width="${f2(rw)}" height="${f2(rh)}" fill="none" stroke="#222" stroke-width="0.32"/>`;
    const m = 2.2;   // 直角のしるし
    [[x0, y0, 1, 1], [x0 + rw, y0, -1, 1], [x0, y0 + rh, 1, -1], [x0 + rw, y0 + rh, -1, -1]].forEach(([x, y, dx, dy]) => { out += `<polyline points="${f2(x + dx * m)},${f2(y)} ${f2(x + dx * m)},${f2(y + dy * m)} ${f2(x)},${f2(y + dy * m)}" fill="none" stroke="#222" stroke-width="0.22"/>`; });
    if (o.top) out += h.rich(W / 2, y0 - 2.2, o.top, 2.9, 'middle');
    if (o.side) out += h.rich(x0 - 3.6, H / 2 + 1, o.side, 2.9, 'end');
    return out;
  };

  const reg = (name, f) => { B[name] = (o, fo) => B.SVG(f(o), fo); };
  reg('NL', numline); reg('CO', coord); reg('HIST', hist); reg('SEC', sector); reg('BAL', balance); reg('RECT', rect);
})();
