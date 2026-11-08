/* 図の部品（円の面積の単元で使う）。授業ファイルの figs から FL.○○(F, …) で呼ぶ。
   角度は「度」。SVG は下向きが y＋なので、0°＝右、90°＝下、180°＝左、270°＝上。 */
(function () {
  const rad = d => d * Math.PI / 180, cos = Math.cos, sin = Math.sin;
  const f = v => Math.round(v * 100) / 100;
  const COL = { line: '#5a3a22', red: '#ef4f4f', blue: '#3d9df2', green: '#2fae5c', pink: '#ff5d8f', or: '#ff8c2e', ye: '#ffd23f', fill: '#ffe9a8', fill2: '#cdeaff', pu: '#9b6cf2' };
  const arcD = (cx, cy, r, a1, a2) => { const large = Math.abs(a2 - a1) > 180 ? 1 : 0; return `M${f(cx + r * cos(rad(a1)))} ${f(cy + r * sin(rad(a1)))}A${r} ${r} 0 ${large} 1 ${f(cx + r * cos(rad(a2)))} ${f(cy + r * sin(rad(a2)))}`; };
  const sectorD = (cx, cy, r, a1, a2) => Math.abs(a2 - a1) >= 359.99 ? `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z` : `M${cx} ${cy}L${f(cx + r * cos(rad(a1)))} ${f(cy + r * sin(rad(a1)))}` + arcD(cx, cy, r, a1, a2).replace(/^M[^A]+/, '') + 'Z';

  /* 寸法の線（両はしに矢印）＋ラベル */
  function dim(F, x1, y1, x2, y2, text, o) {
    o = o || {}; const c = o.color || COL.blue, g = F.g({ opacity: o.hide ? 0 : 1 });
    const L = F.line(x1, y1, x2, y2, { stroke: c, 'stroke-width': o.w || 4, 'stroke-dasharray': o.dash ? '8 7' : null }, g);
    const ang = Math.atan2(y2 - y1, x2 - x1), hd = (x, y, a) => F.path(`M${f(x - 13 * cos(a) + 7 * sin(a))} ${f(y - 13 * sin(a) - 7 * cos(a))}L${f(x)} ${f(y)}L${f(x - 13 * cos(a) - 7 * sin(a))} ${f(y - 13 * sin(a) + 7 * cos(a))}`, { fill: 'none', stroke: c, 'stroke-width': 4 }, g);
    if (o.arrow !== false) { hd(x2, y2, ang); if (o.both !== false) hd(x1, y1, ang + Math.PI); }
    const off = o.off || [0, -26], lb = text ? F.label((x1 + x2) / 2 + off[0], (y1 + y2) / 2 + off[1], text, { color: c, cls: o.cls, hide: true, align: o.align }) : null;
    return {
      g, label: lb,
      async show() { g.style.opacity = 1; await F.draw(L, 0.5); if (lb) await F.show(lb); },
      hideNow() { g.style.opacity = 0; if (lb) lb.style.opacity = 0; }
    };
  }

  /* 円：中心の点・半径・直径などをあとから出す */
  function circle(F, o) {
    const { cx, cy, r } = o, g = F.g();
    const body = F.circle(cx, cy, r, { fill: o.fill || COL.fill, stroke: o.stroke || COL.line, 'stroke-width': o.sw || 4, opacity: o.hide ? 0 : 1 }, g);
    const ctr = F.circle(cx, cy, 5.5, { fill: COL.line, opacity: o.hide ? 0 : 1 }, g);
    return {
      g, body, ctr, cx, cy, r,
      async show() { body.style.opacity = 1; ctr.style.opacity = 1; await F.show(body, 'pop', 0.5); },
      radius(ang, text, o2) { o2 = o2 || {}; const x2 = cx + r * cos(rad(ang)), y2 = cy + r * sin(rad(ang)); return dim(F, cx, cy, x2, y2, text, Object.assign({ both: false, color: o2.color || COL.red, off: o2.off || [0, -24] }, o2)); },
      diameter(ang, text, o2) { o2 = o2 || {}; const a = rad(ang); return dim(F, cx - r * cos(a), cy - r * sin(a), cx + r * cos(a), cy + r * sin(a), text, Object.assign({ color: o2.color || COL.blue, off: o2.off || [0, -24] }, o2)); }
    };
  }

  /* おうぎ形・半円（a1→a2 度） */
  function sector(F, cx, cy, r, a1, a2, a) { return F.path(sectorD(cx, cy, r, a1, a2), Object.assign({ fill: COL.fill, stroke: COL.line, 'stroke-width': 4 }, a || {})); }

  /* 方眼（左上 x,y・cols×rows・1ます cell） */
  function grid(F, x, y, cols, rows, cell, a) {
    const g = F.g(Object.assign({ stroke: '#9cc3e2', 'stroke-width': 1.2 }, a || {}));
    for (let i = 0; i <= cols; i++) F.line(x + i * cell, y, x + i * cell, y + rows * cell, {}, g);
    for (let j = 0; j <= rows; j++) F.line(x, y + j * cell, x + cols * cell, y + j * cell, {}, g);
    return g;
  }

  /* 円を n 等分したピース。cut(n)＝切る・arrange()＝ならべかえる（上下の半分をくしの形にして、かみ合わせる）・toCircle()＝円にもどす
     o: { cx, cy, r, rx（ならべた形の中心の x）, yc（ならべた形の中心の y）, gap（くしの形のときの上下のすきま） } */
  function pieces(F, o) {
    const r = o.r, G = F.g();
    const whole = F.circle(o.cx, o.cy, r, { fill: '#ffc97a', stroke: '#9a5a1c', 'stroke-width': 3 }, G);
    const ctr = F.circle(o.cx, o.cy, 5, { fill: '#5a3a22' }, G);
    let P = [], n = 1, mode = 'circle', crustOn = false;
    const set = p => p.g.setAttribute('transform', `translate(${f(p.x)} ${f(p.y)}) rotate(${f(p.a * 180 / Math.PI)})`);
    const norm = a => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
    function build(nn) {
      P.forEach(p => p.g.remove()); P = []; n = nn; const st = 2 * Math.PI / n, sw = n > 40 ? 0.7 : n > 20 ? 1.2 : 2;
      for (let i = 0; i < n; i++) {
        const a1 = i * st, a2 = (i + 1) * st, th = (a1 + a2) / 2, top = th > Math.PI, alt = i % 2;
        const g = F.g({}, G);
        F.path(`M0 0L${f(r * cos(a1))} ${f(r * sin(a1))}A${r} ${r} 0 0 1 ${f(r * cos(a2))} ${f(r * sin(a2))}Z`, { fill: top ? (alt ? '#ffb35c' : '#ffc684') : (alt ? '#ffdd6e' : '#ffe9a0'), stroke: '#9a5a1c', 'stroke-width': sw }, g);
        const arc = F.path(`M${f(r * cos(a1))} ${f(r * sin(a1))}A${r} ${r} 0 0 1 ${f(r * cos(a2))} ${f(r * sin(a2))}`, { fill: 'none', stroke: top ? COL.blue : COL.red, 'stroke-width': 7, 'stroke-linecap': 'butt' }, g);
        arc.style.opacity = crustOn ? 1 : 0;
        const p = { g, th, top, arc, x: o.cx, y: o.cy, a: 0 }; set(p); P.push(p);
      }
      whole.style.opacity = 0; ctr.style.opacity = 0;
    }
    function layout(m) {
      const st = 2 * Math.PI / n, c = 2 * r * sin(st / 2), h = r * cos(st / 2), W = n / 2 * c + c / 2;
      const x0 = (o.rx !== undefined ? o.rx : o.cx) - W / 2, Y0 = o.yc - h / 2, gap = o.gap !== undefined ? o.gap : r * 0.7;
      const bot = P.filter(p => !p.top).sort((a, b) => b.th - a.th), top = P.filter(p => p.top).sort((a, b) => a.th - b.th);
      const T = new Map();
      bot.forEach((p, j) => T.set(p, { x: x0 + c / 2 + j * c, y: Y0 + (m === 'comb' ? gap / 2 : 0), a: norm(Math.PI / 2 - p.th), k: j / Math.max(1, bot.length - 1) }));
      top.forEach((p, j) => T.set(p, { x: x0 + c + j * c, y: Y0 + h - (m === 'comb' ? gap / 2 : 0), a: norm(-Math.PI / 2 - p.th), k: j / Math.max(1, top.length - 1) }));
      return { T, x0, Y0, h, c, W };
    }
    function moveAll(targetOf, dur, stagger) {
      const from = P.map(p => ({ x: p.x, y: p.y, a: p.a })), S = stagger || 0;
      return F.tween(dur, u => P.forEach((p, i) => {
        const t = targetOf(p); if (!t) return; const k = t.k || 0, v = Math.max(0, Math.min(1, u * (1 + S) - k * S)), e = F.ease(v);
        p.x = from[i].x + (t.x - from[i].x) * e; p.y = from[i].y + (t.y - from[i].y) * e; p.a = from[i].a + (t.a - from[i].a) * e; set(p);
      }), x => x);
    }
    const api = {
      async show() { await F.show(whole, 'pop', 0.5); },
      async toCircle() {
        if (mode === 'circle') return;
        await moveAll(() => ({ x: o.cx, y: o.cy, a: 0 }), 0.9); mode = 'circle';
      },
      async cut(nn) {
        if (mode !== 'circle') await api.toCircle();
        const st = 360 / nn, lines = F.g({}, G);
        const ls = []; for (let i = 0; i < nn; i++) ls.push(F.line(o.cx, o.cy, o.cx + r * cos(rad(i * st)), o.cy + r * sin(rad(i * st)), { stroke: '#7a3f10', 'stroke-width': nn > 40 ? 1.2 : 2.5, opacity: 0 }, lines));
        if (!F.instant) { const every = Math.max(1, Math.round(nn / 8)); for (let i = 0; i < nn; i++) { F.draw(ls[i], 0.25); if (i % every === 0) F.sfx('cut'); await F.wait(Math.min(0.08, 1.2 / nn)); } await F.wait(0.3); }
        lines.remove(); build(nn);
      },
      async arrange() {
        const L1 = layout('comb'), L2 = layout('rect'), sp = o.gap !== undefined ? o.gap / 2 : r * 0.35;
        // ① 上と下の半分にわける
        await moveAll(p => ({ x: o.cx, y: o.cy + (p.top ? -sp : sp), a: 0 }), 0.5);
        F.sfx('whoosh');
        // ② それぞれ、くしの形にひらく
        await moveAll(p => L1.T.get(p), 1.5, 0.8);
        // ③ かみ合わせる
        await moveAll(p => L2.T.get(p), 0.7); mode = 'rect'; F.sfx('pop');
      },
      async crust(on) { crustOn = on !== false; await Promise.all(P.map(p => F.tween(0.4, u => { p.arc.style.opacity = crustOn ? u : 1 - u; }))); },
      geom() { return layout('rect'); },
      get n() { return n; }
    };
    return api;
  }
  /* ---------- 小さい学年むけの絵（数えるもの）。FL.icon(F, 名前, 中心x, 中心y, 大きさ, 親) → <g> ----------
     名前：apple りんご／orange みかん／strawberry いちご／candy あめ／cookie クッキー／flower はな／star ほし／fish さかな／
           car くるま／pencil えんぴつ／ball ボール／egg たまご／dango だんご／block ブロック（青）／blockR ブロック（赤）／coin おかね（円玉） */
  const ICON = {
    apple: '<path d="M0-8C-3-14-15-14-16-3s5 21 13 19c2-1 4-1 6 0 8 2 14-9 13-19S3-14 0-8z" fill="#ef4444" stroke="#9b1c1c" stroke-width="2"/><path d="M0-8q1-7 4-10" stroke="#6b3e1d" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M3-14q8-6 12-1q-7 4-12 1z" fill="#4caf50" stroke="#2e7d32" stroke-width="1.5"/><ellipse cx="-8" cy="-3" rx="3" ry="5" fill="#fff" opacity=".45"/>',
    orange: '<circle r="15" fill="#ffa62b" stroke="#c46a00" stroke-width="2"/><circle cx="-5" cy="-5" r="3" fill="#fff" opacity=".5"/><path d="M0-15q2-5 7-5q-2 5-7 5z" fill="#4caf50" stroke="#2e7d32" stroke-width="1.5"/>',
    strawberry: '<path d="M0 17C-12 10-16-2-13-8c3-5 23-5 26 0 3 6-1 18-13 25z" fill="#f43f5e" stroke="#9f1239" stroke-width="2"/><path d="M-11-8l4-7 4 5 3-6 3 6 4-5 4 7z" fill="#4caf50" stroke="#2e7d32" stroke-width="1.5"/><g fill="#ffe08a"><circle cx="-5" cy="-1" r="1.3"/><circle cx="4" cy="0" r="1.3"/><circle cx="-1" cy="6" r="1.3"/><circle cx="6" cy="8" r="1.3"/><circle cx="-6" cy="8" r="1.3"/></g>',
    candy: '<path d="M-10 0l-9-8v16zM10 0l9-8v16z" fill="#fda4af" stroke="#be185d" stroke-width="2" stroke-linejoin="round"/><circle r="11" fill="#f472b6" stroke="#be185d" stroke-width="2"/><path d="M-7-4q7-6 14 0M-8 3q8-6 16 0" stroke="#fff" stroke-width="2.5" fill="none"/>',
    cookie: '<circle r="15" fill="#e0a75e" stroke="#9a6326" stroke-width="2"/><g fill="#6b3e1d"><circle cx="-6" cy="-5" r="2.5"/><circle cx="5" cy="-7" r="2"/><circle cx="7" cy="4" r="2.5"/><circle cx="-4" cy="6" r="2"/><circle cx="1" cy="0" r="1.6"/></g>',
    flower: '<g fill="#ff8fb8" stroke="#d94a82" stroke-width="1.5"><circle cy="-9" r="7"/><circle cx="8.5" cy="-3" r="7"/><circle cx="5.3" cy="7.5" r="7"/><circle cx="-5.3" cy="7.5" r="7"/><circle cx="-8.5" cy="-3" r="7"/></g><circle r="5.5" fill="#ffd23f" stroke="#e0a400" stroke-width="1.5"/>',
    star: '<path d="M0-16l4.7 9.6 10.5 1.5-7.6 7.4 1.8 10.5L0 8l-9.4 5 1.8-10.5-7.6-7.4 10.5-1.5z" fill="#ffd23f" stroke="#e0a400" stroke-width="2" stroke-linejoin="round"/>',
    fish: '<path d="M-14 0q10-12 24 0q-14 12-24 0z" fill="#60a5fa" stroke="#1d4ed8" stroke-width="2"/><path d="M10 0l8-8v16z" fill="#93c5fd" stroke="#1d4ed8" stroke-width="2" stroke-linejoin="round"/><circle cx="-7" cy="-2" r="2" fill="#1e293b"/>',
    car: '<rect x="-17" y="-4" width="34" height="12" rx="4" fill="#f87171" stroke="#991b1b" stroke-width="2"/><path d="M-10-4l4-8h12l5 8z" fill="#fecaca" stroke="#991b1b" stroke-width="2" stroke-linejoin="round"/><circle cx="-9" cy="9" r="4.5" fill="#334155"/><circle cx="9" cy="9" r="4.5" fill="#334155"/>',
    pencil: '<g transform="rotate(-35)"><rect x="-17" y="-5" width="26" height="10" fill="#facc15" stroke="#a16207" stroke-width="2"/><path d="M9-5l10 5-10 5z" fill="#fde68a" stroke="#a16207" stroke-width="2" stroke-linejoin="round"/><path d="M16-1.5l3 1.5-3 1.5z" fill="#334155"/><rect x="-21" y="-5" width="5" height="10" fill="#f9a8d4" stroke="#a16207" stroke-width="2"/></g>',
    ball: '<circle r="15" fill="#fff" stroke="#334155" stroke-width="2"/><path d="M-15 0h30M0-15q-9 15 0 30M0-15q9 15 0 30" stroke="#ef4444" stroke-width="2.5" fill="none"/>',
    egg: '<path d="M0-17C-10-17-14 0-14 5c0 8 6 12 14 12s14-4 14-12C14 0 10-17 0-17z" fill="#fff8e7" stroke="#c9a77a" stroke-width="2"/><ellipse cx="-5" cy="-5" rx="3" ry="5" fill="#fff" opacity=".8"/>',
    dango: '<path d="M0-22v44" stroke="#c08a4a" stroke-width="3"/><circle cy="-11" r="8" fill="#fbcfe8" stroke="#db2777" stroke-width="1.5"/><circle r="8" fill="#fff" stroke="#9ca3af" stroke-width="1.5"/><circle cy="11" r="8" fill="#bbf7d0" stroke="#16a34a" stroke-width="1.5"/>',
    block: '<rect x="-14" y="-14" width="28" height="28" rx="5" fill="#4dabf7" stroke="#1971c2" stroke-width="2.5"/><rect x="-10" y="-10" width="10" height="6" rx="3" fill="#fff" opacity=".45"/>',
    blockR: '<rect x="-14" y="-14" width="28" height="28" rx="5" fill="#ff8787" stroke="#c92a2a" stroke-width="2.5"/><rect x="-10" y="-10" width="10" height="6" rx="3" fill="#fff" opacity=".45"/>',
    coin: '<circle r="15" fill="#e8e8e8" stroke="#8a8a8a" stroke-width="2"/><circle r="10" fill="none" stroke="#a3a3a3" stroke-width="1.5"/><text y="5" font-size="13" font-weight="900" text-anchor="middle" fill="#6b6b6b" font-family="sans-serif">1</text>'
  };
  function icon(F, name, x, y, size, parent) {
    const g = F.g({ transform: `translate(${f(x)} ${f(y)}) scale(${f((size || 34) / 34)})` }, parent);
    g.innerHTML = ICON[name] || ICON.star; return g;
  }
  /* 10のわく（2だん×5れつ）。左上(x,y)・1ます cell。cells[0..9] に、ものの置き場の中心 [cx, cy] */
  function tenFrame(F, x, y, cell, a) {
    const g = F.g(a || {}), cells = [];
    F.rect(x, y, cell * 5, cell * 2, { rx: 10, fill: '#fff', stroke: '#7a5a3a', 'stroke-width': 4 }, g);
    for (let i = 1; i < 5; i++) F.line(x + i * cell, y, x + i * cell, y + cell * 2, { stroke: '#b89a78', 'stroke-width': 2.5 }, g);
    F.line(x, y + cell, x + cell * 5, y + cell, { stroke: '#b89a78', 'stroke-width': 2.5 }, g);
    for (let r = 0; r < 2; r++) for (let c = 0; c < 5; c++) cells.push([x + c * cell + cell / 2, y + r * cell + cell / 2]);
    return { g, cells };
  }
  /* 立方体を積んだ形（5年の体積）。ななめに見た図（右へ i・おくへ j・上へ k）。1こ s px。
     FL.cube(F, ox, oy, s, i, j, k, 色, 親) → <g>（前の面・上の面・右の面）。並べる順は、おく→手前、下→上 にする */
  function cube(F, ox, oy, s, i, j, k, col, parent) {
    const d = s * 0.5, x = ox + i * s + j * d, y = oy - k * s - j * d, c = col || ['#74c0fc', '#a5d8ff', '#4dabf7'];
    const g = F.g({}, parent);
    F.path(`M${f(x)} ${f(y)}h${s}v${-s}h${-s}z`, { fill: c[0], stroke: '#1c4f7a', 'stroke-width': 1.6 }, g);
    F.path(`M${f(x)} ${f(y - s)}l${d} ${-d}h${s}l${-d} ${d}z`, { fill: c[1], stroke: '#1c4f7a', 'stroke-width': 1.6 }, g);
    F.path(`M${f(x + s)} ${f(y)}l${d} ${-d}v${-s}l${-d} ${d}z`, { fill: c[2], stroke: '#1c4f7a', 'stroke-width': 1.6 }, g);
    return g;
  }
  function cubes(F, o) {   // o: { ox, oy, s, nx, ny, nz, col } → { g, list:[{ g, i, j, k }] }（おく→手前、下→上の順）
    const g = F.g(), list = [];
    for (let k = 0; k < o.nz; k++) for (let j = o.ny - 1; j >= 0; j--) for (let i = 0; i < o.nx; i++) list.push({ g: cube(F, o.ox, o.oy, o.s, i, j, k, o.col, g), i, j, k });
    return { g, list };
  }
  /* 分度器（4年）。中心(cx,cy)・半径 r。外がわの目もり＝右から0°、内がわ＝左から0°。rot で回せる（度）。fs で数字の大きさ（倍） */
  function protractor(F, cx, cy, r, o) {
    o = o || {}; const g = F.g({ transform: `rotate(${o.rot || 0} ${cx} ${cy})` });
    F.path(`M${cx - r} ${cy}A${r} ${r} 0 0 1 ${cx + r} ${cy}Z`, { fill: 'rgba(200,235,255,.55)', stroke: '#2b6cb0', 'stroke-width': 2.5 }, g);
    F.path(`M${cx - r * 0.62} ${cy}A${r * 0.62} ${r * 0.62} 0 0 1 ${cx + r * 0.62} ${cy}`, { fill: 'none', stroke: '#2b6cb0', 'stroke-width': 1.2 }, g);
    for (let a = 0; a <= 180; a++) {
      const L = a % 10 === 0 ? 0.12 : a % 5 === 0 ? 0.08 : 0.045, t = Math.PI - a * Math.PI / 180, c = Math.cos(t), sn = Math.sin(t);
      F.line(cx + r * c, cy - r * sn, cx + r * (1 - L) * c, cy - r * (1 - L) * sn, { stroke: '#2b6cb0', 'stroke-width': a % 10 === 0 ? 1.6 : 0.9 }, g);
      if (a % 10 === 0) {
        F.text(cx + r * 0.8 * Math.cos(a * Math.PI / 180), cy - r * 0.8 * Math.sin(a * Math.PI / 180), String(a), { 'font-size': r * 0.075 * (o.fs || 1), fill: '#1e4e8c', 'font-weight': 700 }, g);
        F.text(cx + r * 0.69 * Math.cos(Math.PI - a * Math.PI / 180), cy - r * 0.69 * Math.sin(Math.PI - a * Math.PI / 180), String(a), { 'font-size': r * 0.062 * (o.fs || 1), fill: '#d6336c', 'font-weight': 700 }, g);
      }
    }
    F.line(cx - r, cy, cx + r, cy, { stroke: '#2b6cb0', 'stroke-width': 2 }, g);
    F.circle(cx, cy, 3.5, { fill: '#d6336c' }, g);
    return g;
  }
  /* 角のしるし（cx,cy を頂点に、a1→a2 度。SVG の向き：0°＝右、反時計まわりを＋にするなら a を負に） */
  function angleMark(F, cx, cy, r, a1, a2, a) {
    const p = (ang) => [cx + r * Math.cos(rad(ang)), cy + r * Math.sin(rad(ang))], [x1, y1] = p(a1), [x2, y2] = p(a2), large = Math.abs(a2 - a1) > 180 ? 1 : 0, sw = a2 > a1 ? 1 : 0;
    return F.path(`M${f(x1)} ${f(y1)}A${r} ${r} 0 ${large} ${sw} ${f(x2)} ${f(y2)}`, Object.assign({ fill: 'none', stroke: COL.pink, 'stroke-width': 4 }, a || {}));
  }
  /* ---------- 5・6年むけの共通の部品（数直線・テープ図・分数の面積図・座標・グラフ） ---------- */
  const INK = '#3b2a1e';
  /* 積み上げた分数（SVG）。FL.frac(F, 中心x, 中心y, 分子, 分母, { size, color }, 親)。整数は分母 1 にせず、ふつうの文字で */
  function frac(F, x, y, n, d, o, parent) {
    o = o || {}; const sz = o.size || 30, c = o.color || INK, g = F.g({}, parent), w = Math.max(String(n).length, String(d).length) * sz * 0.62 + 10;
    F.text(x, y - sz * 0.62, String(n), { 'font-size': sz, fill: c }, g);
    F.line(x - w / 2, y, x + w / 2, y, { stroke: c, 'stroke-width': Math.max(2.5, sz / 11) }, g);
    F.text(x, y + sz * 0.68, String(d), { 'font-size': sz, fill: c }, g);
    return g;
  }
  /* 波かっこ（上向き up:true なら ふくらみが上）。FL.brace(F, x1, x2, y, { up, h, color }, 親) */
  function brace(F, x1, x2, y, o, parent) {
    o = o || {}; const h = o.h || 14, u = o.up ? -1 : 1, m = (x1 + x2) / 2, c = o.color || '#c0392b';
    return F.path(`M${x1} ${y}q0 ${u * h} ${h} ${u * h}H${m - h}q${h} 0 ${h} ${u * h}q0 ${-u * h} ${h} ${-u * h}H${x2 - h}q${h} 0 ${h} ${-u * h}`, { fill: 'none', stroke: c, 'stroke-width': 3.5 }, parent);
  }
  /* 数直線。FL.numberLine(F, { x0, x1, y, min, max, step, labelEvery, fmt(v)→文字 か {n,d}（分数）, fs, color, parent })
     → { g, X(値→x), dot(v, { color, label, dy }), jump(a, b, 文字, { color, up })（弧の矢印）, tick(v) } */
  function numberLine(F, o) {
    const g = F.g({}, o.parent), y = o.y, c = o.color || '#5a3a22', X = v => o.x0 + (v - o.min) * (o.x1 - o.x0) / (o.max - o.min);
    F.line(o.x0 - 16, y, o.x1 + 24, y, { stroke: c, 'stroke-width': 4 }, g); F.path(`M${o.x1 + 26} ${y}l-14 -8v16z`, { fill: c }, g);
    const n = Math.round((o.max - o.min) / o.step + 1e-9), every = o.labelEvery || 1, fs = o.fs || 24;
    for (let i = 0; i <= n; i++) {
      const v = o.min + i * o.step, x = X(v), big = i % every === 0;
      F.line(x, y - (big ? 12 : 7), x, y + (big ? 12 : 7), { stroke: c, 'stroke-width': big ? 3 : 2 }, g);
      if (big && o.fmt !== false) { const t = o.fmt ? o.fmt(v) : String(+v.toFixed(6)); if (t && typeof t === 'object') frac(F, x, y + 44, t.n, t.d, { size: fs * 0.85 }, g); else F.text(x, y + 34, String(t), { 'font-size': fs, fill: INK }, g); }
    }
    return {
      g, X,
      dot(v, d) { d = d || {}; const e = F.g({}, g); F.circle(X(v), y, 9, { fill: d.color || '#ef4f4f', stroke: '#fff', 'stroke-width': 2 }, e); if (d.label) F.text(X(v), y - 30 + (d.dy || 0), d.label, { 'font-size': fs, fill: d.color || '#ef4f4f' }, e); return e; },
      jump(a, b, t, d) { d = d || {}; const e = F.g({}, g), x1 = X(a), x2 = X(b), up = d.up !== false ? -1 : 1, cy = y + up * (36 + Math.abs(x2 - x1) * 0.12), col = d.color || '#2f9e44';
        F.path(`M${x1} ${y + up * 8}Q${(x1 + x2) / 2} ${cy} ${x2} ${y + up * 8}`, { fill: 'none', stroke: col, 'stroke-width': 4 }, e); F.path(`M${x2} ${y + up * 8}l${x2 > x1 ? -5 : 5} ${up * -14}l${x2 > x1 ? -9 : 9} ${up * 6}z`, { fill: col }, e);
        if (t) F.text((x1 + x2) / 2, cy + up * 20, t, { 'font-size': fs, fill: col }, e); return e; },
      tick(v, col) { return F.line(X(v), y - 16, X(v), y + 16, { stroke: col || '#ef4f4f', 'stroke-width': 5 }, g); }
    };
  }
  /* テープ図。FL.tape(F, { x, y, w, h, parts:[{ v（長さの割合）, label, color }], parent })
     → { g, rects（各部分）, xs（各部分の左はし）, X(0〜1の位置→x) }。ふりがなの要らない短い文字を中に書く（長い文は F.label を別に） */
  function tape(F, o) {
    const g = F.g({}, o.parent), tot = o.parts.reduce((a, p) => a + p.v, 0), rects = [], xs = []; let x = o.x;
    o.parts.forEach(p => { const w = o.w * p.v / tot; xs.push(x); rects.push(F.rect(x, o.y, w, o.h, { fill: p.color || '#cde9ff', stroke: '#2b6cb0', 'stroke-width': 3 }, g)); if (p.label) F.text(x + w / 2, o.y + o.h / 2, p.label, { 'font-size': o.fs || 26, fill: INK }, g); x += w; });
    return { g, rects, xs, X: t => o.x + o.w * t };
  }
  /* 分数の面積図。長方形を たて cols・よこ rows に分け、a: 横の帯（列 c0〜c1）、b: 縦の帯（行 r0〜r1）をぬる。かさなりは こい色。
     FL.fracRect(F, { x, y, w, h, cols, rows, parent }) → { g, band(列0, 列1, color) / row(行0, 行1, color) → 要素（F.show で出す）, cell(i, j) } */
  function fracRect(F, o) {
    const g = F.g({}, o.parent), cw = o.w / o.cols, ch = o.h / o.rows;
    F.rect(o.x, o.y, o.w, o.h, { fill: '#fff', stroke: '#5a3a22', 'stroke-width': 4 }, g);
    const layer = F.g({}, g);
    for (let i = 1; i < o.cols; i++) F.line(o.x + i * cw, o.y, o.x + i * cw, o.y + o.h, { stroke: '#9aa7b3', 'stroke-width': 1.5, 'stroke-dasharray': '5 4' }, g);
    for (let j = 1; j < o.rows; j++) F.line(o.x, o.y + j * ch, o.x + o.w, o.y + j * ch, { stroke: '#9aa7b3', 'stroke-width': 1.5, 'stroke-dasharray': '5 4' }, g);
    const fill = (x, y, w, h, c, a) => { const e = F.rect(x, y, w, h, { fill: c, 'fill-opacity': a, opacity: 0 }, layer); return e; };
    return {
      g, cw, ch,
      band(c0, c1, col) { return fill(o.x + c0 * cw, o.y, (c1 - c0) * cw, o.h, col || '#ff9f43', 0.45); },
      row(r0, r1, col) { return fill(o.x, o.y + r0 * ch, o.w, (r1 - r0) * ch, col || '#4dabf7', 0.45); },
      cell(i, j, col) { return fill(o.x + i * cw, o.y + j * ch, cw, ch, col || '#ef4f4f', 0.55); }
    };
  }
  /* 座標平面。FL.plane(F, { ox, oy（原点のx,y）, sx, sy（1めもりのpx）, xmax, ymax, xmin=0, ymin=0, step=1, labelEvery=1, xlabel, ylabel, grid:true, parent })
     → { g, P(x,y)→[px,py], point(x,y,{color,label}), seg(x1,y1,x2,y2,color), curve(fn,x0,x1,color) } */
  function plane(F, o) {
    const g = F.g({}, o.parent), xmin = o.xmin || 0, ymin = o.ymin || 0, st = o.step || 1, le = o.labelEvery || 1, P = (x, y) => [o.ox + x * o.sx, o.oy - y * o.sy], fs = o.fs || 20;
    if (o.grid !== false) { for (let x = Math.ceil(xmin / st) * st; x <= o.xmax + 1e-9; x += st) F.line(P(x, 0)[0], P(0, ymin)[1], P(x, 0)[0], P(0, o.ymax)[1], { stroke: '#c4dcf0', 'stroke-width': 1.3 }, g);
      for (let y = Math.ceil(ymin / st) * st; y <= o.ymax + 1e-9; y += st) F.line(P(xmin, 0)[0], P(0, y)[1], P(o.xmax, 0)[0], P(0, y)[1], { stroke: '#c4dcf0', 'stroke-width': 1.3 }, g); }
    F.line(P(xmin, 0)[0] - 8, o.oy, P(o.xmax, 0)[0] + 22, o.oy, { stroke: INK, 'stroke-width': 3.5 }, g); F.path(`M${P(o.xmax, 0)[0] + 26} ${o.oy}l-13 -7v14z`, { fill: INK }, g);
    F.line(o.ox, P(0, ymin)[1] + 8, o.ox, P(0, o.ymax)[1] - 22, { stroke: INK, 'stroke-width': 3.5 }, g); F.path(`M${o.ox} ${P(0, o.ymax)[1] - 26}l-7 13h14z`, { fill: INK }, g);
    for (let x = Math.ceil(xmin / st) * st; x <= o.xmax + 1e-9; x += st) if (Math.round((x - xmin) / st) % le === 0) F.text(P(x, 0)[0], o.oy + 22, String(+x.toFixed(6)), { 'font-size': fs, fill: INK }, g);
    for (let y = Math.ceil(ymin / st) * st; y <= o.ymax + 1e-9; y += st) if (y !== 0 && Math.round((y - ymin) / st) % le === 0) F.text(o.ox - 16, P(0, y)[1], String(+y.toFixed(6)), { 'font-size': fs, fill: INK, 'text-anchor': 'end' }, g);
    if (o.xlabel) F.text(P(o.xmax, 0)[0] + 24, o.oy + 24, o.xlabel, { 'font-size': fs + 4, fill: INK }, g);
    if (o.ylabel) F.text(o.ox + 4, P(0, o.ymax)[1] - 40, o.ylabel, { 'font-size': fs + 4, fill: INK }, g);
    return {
      g, P,
      point(x, y, d) { d = d || {}; const [px, py] = P(x, y), e = F.g({}, g); F.circle(px, py, d.r || 8, { fill: d.color || '#ef4f4f', stroke: '#fff', 'stroke-width': 2 }, e); if (d.label) F.text(px + (d.dx || 0), py - 22 + (d.dy || 0), d.label, { 'font-size': fs, fill: d.color || '#ef4f4f' }, e); return e; },
      seg(x1, y1, x2, y2, col, w) { const [a, b] = P(x1, y1), [c, d] = P(x2, y2); return F.line(a, b, c, d, { stroke: col || '#2f9e44', 'stroke-width': w || 4.5 }, g); },
      curve(fn, x0, x1, col, n) { n = n || 60; const pts = []; for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n; pts.push(P(x, fn(x)).map(f).join(',')); } return F.path('M' + pts.join('L'), { fill: 'none', stroke: col || '#2f9e44', 'stroke-width': 4.5 }, g); }
    };
  }
  /* 棒グラフ・柱状グラフ。FL.bars(F, { x, y（底）, w, h（最大の高さpx）, data:[{ label, v }], max, yStep, gap=0.25（柱状グラフは 0）, colors, fs, parent })
     → { g, rects, top(i)→[x,y] } */
  function bars(F, o) {
    const g = F.g({}, o.parent), n = o.data.length, bw = o.w / n, gap = o.gap === undefined ? 0.25 : o.gap, fs = o.fs || 20, rects = [], Y = v => o.y - v * o.h / o.max;
    for (let v = 0; v <= o.max + 1e-9; v += (o.yStep || 1)) { F.line(o.x, Y(v), o.x + o.w, Y(v), { stroke: '#d5e3ef', 'stroke-width': 1.3 }, g); F.text(o.x - 12, Y(v), String(v), { 'font-size': fs, fill: INK, 'text-anchor': 'end' }, g); }
    o.data.forEach((d, i) => { const x = o.x + i * bw + bw * gap / 2, w = bw * (1 - gap); rects.push(F.rect(x, Y(d.v), w, o.y - Y(d.v), { fill: (o.colors && o.colors[i % o.colors.length]) || '#74c0fc', stroke: '#1c4f7a', 'stroke-width': 2.2 }, g)); if (d.label !== undefined) F.text(o.x + i * bw + bw / 2, o.y + 22, String(d.label), { 'font-size': fs, fill: INK }, g); });
    F.line(o.x, o.y, o.x + o.w, o.y, { stroke: INK, 'stroke-width': 3 }, g); F.line(o.x, o.y, o.x, Y(o.max) - 6, { stroke: INK, 'stroke-width': 3 }, g);
    return { g, rects, top: i => [o.x + i * bw + bw / 2, Y(o.data[i].v)] };
  }
  /* ドットプロット。FL.dots(F, { x, y（数直線の高さ）, w, min, max, step=1, data:[値…], r, parent }) → { g, dots（円の配列。データの順）, X(値) } */
  function dots(F, o) {
    const g = F.g({}, o.parent), st = o.step || 1, r = o.r || 11, X = v => o.x + (v - o.min) * o.w / (o.max - o.min), cnt = {}, ds = [];
    F.line(o.x - 10, o.y, o.x + o.w + 14, o.y, { stroke: INK, 'stroke-width': 3.5 }, g);
    for (let v = o.min; v <= o.max + 1e-9; v += st) { F.line(X(v), o.y - 6, X(v), o.y + 8, { stroke: INK, 'stroke-width': 2.5 }, g); F.text(X(v), o.y + 28, String(+v.toFixed(6)), { 'font-size': o.fs || 20, fill: INK }, g); }
    o.data.forEach(v => { const k = cnt[v] = (cnt[v] || 0) + 1; ds.push(F.circle(X(v), o.y - r - 4 - (k - 1) * (r * 2 + 3), r, { fill: '#ff8c2e', stroke: '#c96512', 'stroke-width': 2 }, g)); });
    return { g, dots: ds, X };
  }
  /* ---------- 1年むけの部品：とけい・100の表・10の棒・立体・平面の形 ---------- */
  /* とけい。FL.clock(F, cx, cy, r, 時, 分, { parent }) → { g, set(時, 分)（針を その時刻にする）, hourHand, minuteHand, cx, cy, r }。
     長い針（分）は青・短い針（時）は赤。針を指でうごかす ACT は、hourHand / minuteHand を F.draggable でなく、自分で pointer から角度を出して set() する */
  function clock(F, cx, cy, r, h, m, o) {
    o = o || {}; const g = F.g({}, o.parent);
    F.circle(cx, cy, r, { fill: '#fff', stroke: '#5a3a22', 'stroke-width': 6 }, g);
    for (let i = 0; i < 60; i++) { const a = (i * 6 - 90) * Math.PI / 180, L = i % 5 === 0 ? 0.1 : 0.05; F.line(cx + r * (0.96 - L) * Math.cos(a), cy + r * (0.96 - L) * Math.sin(a), cx + r * 0.96 * Math.cos(a), cy + r * 0.96 * Math.sin(a), { stroke: '#5a3a22', 'stroke-width': i % 5 === 0 ? 3 : 1.4 }, g); }
    for (let i = 1; i <= 12; i++) { const a = (i * 30 - 90) * Math.PI / 180; F.text(cx + r * 0.75 * Math.cos(a), cy + r * 0.75 * Math.sin(a), String(i), { 'font-size': r * 0.22, fill: INK }, g); }
    const hh = F.line(cx, cy, cx, cy - r * 0.46, { stroke: '#d6336c', 'stroke-width': r * 0.09 }, g), mh = F.line(cx, cy, cx, cy - r * 0.68, { stroke: '#1c7ed6', 'stroke-width': r * 0.06 }, g);
    F.circle(cx, cy, r * 0.065, { fill: '#5a3a22' }, g);
    const set = (hh_, mm_) => { mh.setAttribute('transform', `rotate(${mm_ * 6} ${cx} ${cy})`); hh.setAttribute('transform', `rotate(${(hh_ % 12) * 30 + mm_ * 0.5} ${cx} ${cy})`); };
    set(h, m); return { g, set, hourHand: hh, minuteHand: mh, cx, cy, r };
  }
  /* 100の表（1〜100）。FL.hundred(F, x, y, 1ますの大きさ, { tint(n)→true で うすい色, fs, parent }) → { g, XY(n)→[中心x, 中心y], mark(n, 色)（わくを つける）, cells } */
  function hundred(F, x, y, cell, o) {
    o = o || {}; const g = F.g({}, o.parent), fs = o.fs || cell * 0.42, cells = [];
    for (let i = 0; i < 100; i++) { const c = i % 10, r = Math.floor(i / 10), n = i + 1; cells.push(F.rect(x + c * cell, y + r * cell, cell, cell, { fill: o.tint && o.tint(n) ? '#fff0a6' : '#fff', stroke: '#9aa7b3', 'stroke-width': 1.5 }, g)); F.text(x + c * cell + cell / 2, y + r * cell + cell / 2, String(n), { 'font-size': fs, fill: INK }, g); }
    const XY = n => [x + ((n - 1) % 10) * cell + cell / 2, y + Math.floor((n - 1) / 10) * cell + cell / 2];
    return { g, XY, cells, mark(n, col) { const [cx, cy] = XY(n); return F.rect(cx - cell / 2 + 2, cy - cell / 2 + 2, cell - 4, cell - 4, { rx: 6, fill: col || 'rgba(255,140,46,.35)', stroke: '#ff8c2e', 'stroke-width': 3 }, g); } };
  }
  /* 10の棒と ばら。FL.tens(F, x, y, 十のくらい, 一のくらい, { s（1こ＝s px）, horizontal:true（よこ長）, parent }) → { g, rods（10の棒の g の配列）, ones（ばらの g の配列）, width }。10のまとまりを見せる */
  function tens(F, x, y, nT, nO, o) {
    o = o || {}; const s = o.s || 18, g = F.g({}, o.parent), rods = [], ones = [];
    if (o.horizontal) {   // よこ長：10の棒が よこに ならび、上から 下へ つむ。ばらは 右がわ
      for (let t = 0; t < nT; t++) { const rg = F.g({ transform: `translate(${x} ${y + t * (s + 8)})` }, g); for (let k = 0; k < 10; k++) F.rect(k * s, 0, s, s, { fill: '#4dabf7', stroke: '#1971c2', 'stroke-width': 1.6 }, rg); rods.push(rg); }
      const ox = x + 10 * s + 24;
      for (let k = 0; k < nO; k++) { const cg = F.g({ transform: `translate(${ox + (k % 5) * (s + 4)} ${y + Math.floor(k / 5) * (s + 4)})` }, g); F.rect(0, 0, s, s, { rx: 3, fill: '#ff8787', stroke: '#c92a2a', 'stroke-width': 1.6 }, cg); ones.push(cg); }
      return { g, rods, ones, width: (ox - x) + Math.min(nO, 5) * (s + 4) };
    }
    for (let t = 0; t < nT; t++) { const rg = F.g({ transform: `translate(${x + t * (s + 8)} ${y})` }, g); for (let k = 0; k < 10; k++) F.rect(0, k * s, s, s, { fill: '#4dabf7', stroke: '#1971c2', 'stroke-width': 1.6 }, rg); rods.push(rg); }
    const ox = x + nT * (s + 8) + 14;
    for (let k = 0; k < nO; k++) { const cg = F.g({ transform: `translate(${ox + (k % 5) * (s + 4)} ${y + Math.floor(k / 5) * (s + 4)})` }, g); F.rect(0, 0, s, s, { rx: 3, fill: '#ff8787', stroke: '#c92a2a', 'stroke-width': 1.6 }, cg); ones.push(cg); }
    return { g, rods, ones, width: (ox - x) + Math.min(nO, 5) * (s + 4) };
  }
  /* 立体。FL.solid(F, 'box'|'cube'|'tube'|'ball', 中心x, 中心y, 大きさ, 色, parent)（はこ・さいころ・つつ・たま）→ g */
  function solid(F, kind, cx, cy, s, col, parent) {
    const g = F.g({}, parent), c = col || '#ffb866', dk = '#a8641a';
    if (kind === 'ball') { F.circle(cx, cy, s * 0.5, { fill: c, stroke: dk, 'stroke-width': 3 }, g); F.circle(cx - s * 0.15, cy - s * 0.18, s * 0.11, { fill: '#fff', opacity: 0.55 }, g); }
    else if (kind === 'tube') { const rx = s * 0.4, ry = s * 0.13, h = s * 0.78; F.path(`M${cx - rx} ${cy - h / 2}v${h}a${rx} ${ry} 0 0 0 ${2 * rx} 0v${-h}`, { fill: c, stroke: dk, 'stroke-width': 3 }, g); F.el('ellipse', { cx, cy: cy - h / 2, rx, ry, fill: '#ffe3b8', stroke: dk, 'stroke-width': 3 }, g); }
    else { const w = kind === 'box' ? s * 0.9 : s * 0.68, h = kind === 'box' ? s * 0.55 : s * 0.68, d = s * 0.26, x = cx - w / 2 - d / 2, y = cy - h / 2 + d / 2; F.rect(x, y, w, h, { fill: c, stroke: dk, 'stroke-width': 3 }, g); F.path(`M${x} ${y}l${d} ${-d}h${w}l${-d} ${d}z`, { fill: '#ffe3b8', stroke: dk, 'stroke-width': 3 }, g); F.path(`M${x + w} ${y}l${d} ${-d}v${h}l${-d} ${d}z`, { fill: '#e69a4d', stroke: dk, 'stroke-width': 3 }, g); }
    return g;
  }
  /* 平面の形。FL.shape(F, 'circle'|'triangle'|'square'|'rect', 中心x, 中心y, 大きさ, 色, parent)（まる・さんかく・ましかく・ながしかく）→ 要素 */
  function shape(F, kind, cx, cy, s, col, parent) {
    const o = { fill: col || '#ffd43b', stroke: '#7a5a1c', 'stroke-width': 3.5 };
    if (kind === 'square') return F.rect(cx - s / 2, cy - s / 2, s, s, Object.assign({ rx: 4 }, o), parent);
    if (kind === 'rect') return F.rect(cx - s * 0.7, cy - s * 0.42, s * 1.4, s * 0.84, Object.assign({ rx: 4 }, o), parent);
    if (kind === 'triangle') return F.poly([[cx, cy - s * 0.55], [cx + s * 0.6, cy + s * 0.45], [cx - s * 0.6, cy + s * 0.45]], o, parent);
    return F.circle(cx, cy, s / 2, o, parent);
  }
  /* ---------- 2年むけの部品：ひっ算・ものさし・はかりカップ ---------- */
  /* ひっ算。FL.hissan(F, x, y, { a, b, op:'+'|'-', cell（けたの はば・既定 56）, fs, parent })
     → { g, X(c)（c=0:一の くらい, 1:十, 2:百, 3:千 の 中心 x）, Y(r)（r=0:くり上がりの らん, 1:上の 数, 2:下の 数, 3:答え の 中心 y）,
          put(r, c, 文字, 色) → 文字の要素（F.show で 1つずつ 出す）, line（ひっ算の 横線）, sign（＋/－）}。
     くらいを たてに そろえて かく。a・b の けたは そのまま ならぶ。答えは put(3, c, '5') で 1けたずつ 書く */
  function hissan(F, x, y, o) {
    const cell = o.cell || 56, fs = o.fs || cell * 0.9, g = F.g({}, o.parent), nc = Math.max(String(o.a).length, String(o.b).length, 2) + (o.cols || 1);
    const X = c => x + (nc - 1 - c) * cell + cell / 2, Y = r => y + r * cell * 1.05 + cell / 2;
    const put = (r, c, t, col) => F.text(X(c), Y(r), String(t), { 'font-size': r === 0 ? fs * 0.5 : fs, fill: col || INK, 'font-family': 'Hiragino Maru Gothic ProN, sans-serif' }, g);
    String(o.a).split('').reverse().forEach((d, c) => put(1, c, d)); String(o.b).split('').reverse().forEach((d, c) => put(2, c, d));
    const sign = F.text(x + cell * 0.2, Y(2), o.op === '-' ? '−' : (o.op === '×' || o.op === 'x') ? '×' : '＋', { 'font-size': fs * 0.8, fill: INK }, g);
    const lineAt = r => F.line(x, Y(r) + cell * 0.55, x + nc * cell + 4, Y(r) + cell * 0.55, { stroke: INK, 'stroke-width': 4 }, g);   // r行目の下に線（かけ算の2本目の線＝部分の積のあと）
    const line = lineAt(2);
    return { g, X, Y, put, line, lineAt, sign, cell, nc };
  }
  /* ものさし。FL.ruler(F, x, y, はば(px), cm, { mm:true（めもりを 1mm ごと）, fs }) → { g, X(mm) → x, mm(px 1mmの はば) }。左はしが 0。上に めもり、下に 数字 */
  function ruler(F, x, y, w, cm, o) {
    o = o || {}; const g = F.g({}, o.parent), pm = w / (cm * 10), fs = o.fs || 20;
    F.rect(x - 16, y, w + 32, 56, { rx: 6, fill: '#fff3bf', stroke: '#c9a227', 'stroke-width': 3 }, g);   // 左右に よゆう（はしの 数字が はみ出さない）
    for (let i = 0; i <= cm * 10; i++) { const L = i % 10 === 0 ? 26 : i % 5 === 0 ? 18 : 11; if (o.mm !== false || i % 10 === 0) F.line(x + i * pm, y, x + i * pm, y + L, { stroke: '#5a3a22', 'stroke-width': i % 10 === 0 ? 2.5 : 1.5 }, g); }
    for (let c = 0; c <= cm; c++) F.text(x + c * 10 * pm, y + 42, String(c), { 'font-size': fs, fill: INK }, g);
    return { g, X: mm => x + mm * pm, mm: pm };
  }
  /* はかりカップ。FL.cup(F, x, y（左上）, はば, たかさ, 水の たかさ(0〜1), { max:'1L'などのラベル, lines:めもりの 本数 }) → { g, setLevel(0〜1), water }。コップの 絵と めもり。水を F.tween で setLevel */
  function cup(F, x, y, w, h, lv, o) {
    o = o || {}; const g = F.g({}, o.parent);
    const water = F.rect(x + 3, y + h - h * lv, w - 6, h * lv, { fill: 'rgba(77,171,247,.65)' }, g);
    F.path(`M${x} ${y}L${x + w * 0.06} ${y + h}H${x + w * 0.94}L${x + w} ${y}`, { fill: 'rgba(255,255,255,.35)', stroke: '#2b6cb0', 'stroke-width': 4 }, g);
    const n = o.lines || 5; for (let i = 1; i < n; i++) { const yy = y + h - h * i / n; F.line(x + w * 0.04, yy, x + w * (i % 2 ? 0.28 : 0.4), yy, { stroke: '#2b6cb0', 'stroke-width': 2.5 }, g); }
    if (o.max) F.text(x + w + 18, y + 4, o.max, { 'font-size': 22, fill: '#2b6cb0', 'text-anchor': 'start' }, g);
    return { g, water, setLevel(v) { water.setAttribute('y', y + h - h * v); water.setAttribute('height', h * v); } };
  }
  /* わり算の筆算（4年）。FL.hissanDiv(F, x, y, { a:わられる数, b:わる数, cell, fs, parent }) → { g, X, Y, put, lineAt, cell, nd }
     行0＝商（わられる数の くらいの 真上に書く）・行1＝わられる数・行2以降＝「ひく数」「ひいた あまり／おろした数」を 1行ずつ。
     put(行, 列, 文字, 色)：列は 左から 0,1,2…（わられる数の いちばん左の くらいが 0）。lineAt(行, 列はじ, 列おわり)：その行の 下に ひく線。 */
  function hissanDiv(F, x, y, o) {
    const cell = o.cell || 52, fs = o.fs || cell * 0.9, bs = String(o.b), as = String(o.a), nd = as.length, g = F.g({}, o.parent);
    const x0 = x + bs.length * cell + cell * 0.45;
    const X = c => x0 + cell * 0.1 + c * cell + cell / 2, Y = r => y + r * cell * 1.05 + cell / 2;
    const put = (r, c, t, col) => F.text(X(c), Y(r), String(t), { 'font-size': fs, fill: col || INK, 'font-family': 'Hiragino Maru Gothic ProN, sans-serif' }, g);
    bs.split('').forEach((d, i) => F.text(x + i * cell + cell / 2, Y(1), d, { 'font-size': fs, fill: INK, 'font-family': 'Hiragino Maru Gothic ProN, sans-serif' }, g));
    as.split('').forEach((d, c) => put(1, c, d));
    const top = Y(1) - cell * 0.55;
    F.path(`M${x0 + cell * 0.12} ${top}Q${x0 - cell * 0.08} ${Y(1)} ${x0 + cell * 0.12} ${Y(1) + cell * 0.55}`, { fill: 'none', stroke: INK, 'stroke-width': 4 }, g);
    F.line(x0 + cell * 0.12, top, x0 + cell * 0.2 + nd * cell, top, { stroke: INK, 'stroke-width': 4 }, g);
    const lineAt = (r, c0, c1) => F.line(X(c0) - cell * 0.5, Y(r) + cell * 0.55, X(c1 == null ? c0 : c1) + cell * 0.5, Y(r) + cell * 0.55, { stroke: INK, 'stroke-width': 4 }, g);
    return { g, X, Y, put, lineAt, cell, nd };
  }
  window.FL = { hissan, hissanDiv, ruler, cup, clock, hundred, tens, solid, shape, dim, circle, sector, sectorD, arcD, grid, pieces, icon, ICON, tenFrame, cube, cubes, protractor, angleMark, frac, brace, numberLine, tape, fracRect, plane, bars, dots, COL, rad };
})();
