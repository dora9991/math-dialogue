/* 作戦図：コートと人と動きを SVG で描く。データの形は js/core.js の「作戦図」。
   BC.court(el, diagram) で el の中に図を入れ、場面（frames）を ◀ ▶ で切りかえる（人は動いて移る）。
   単位は m（1 = 1m）。ゴールが上（y = 0 がエンドライン）。 */
(function () {
  const BC = window.BC;
  const NS = 'http://www.w3.org/2000/svg';
  const R = 0.46; // 人の丸の半径
  let uid = 0;

  // コートの線（half：y 0〜14、full：y 0〜28）
  function courtSVG(full) {
    const H = full ? 28 : 14;
    const arc3 = 1.575 + Math.sqrt(6.75 * 6.75 - 6.6 * 6.6); // コーナーの直線と弧のつなぎ目
    const end = (top) => {
      // top = true：上のゴール（y=0 側）、false：下のゴール（y=28 側）
      const s = top ? 1 : -1, b = top ? 0 : 28, y = (v) => b + s * v;
      const sw = top ? 0 : 1; // 弧の向き
      return `
        <rect class="cv-paint" x="-2.45" y="${Math.min(y(0), y(5.8))}" width="4.9" height="5.8"/>
        <path class="cv-line" d="M-6.6 ${y(0)} L-6.6 ${y(arc3)} A6.75 6.75 0 0 ${sw} 6.6 ${y(arc3)} L6.6 ${y(0)}"/>
        <path class="cv-line" d="M-1.8 ${y(5.8)} A1.8 1.8 0 0 ${sw} 1.8 ${y(5.8)}"/>
        <path class="cv-line cv-dash" d="M-1.8 ${y(5.8)} A1.8 1.8 0 0 ${1 - sw} 1.8 ${y(5.8)}"/>
        <path class="cv-line" d="M-1.25 ${y(1.575)} A1.25 1.25 0 0 ${sw} 1.25 ${y(1.575)}"/>
        <line class="cv-board" x1="-0.9" y1="${y(1.2)}" x2="0.9" y2="${y(1.2)}"/>
        <circle class="cv-rim" cx="0" cy="${y(1.575)}" r="0.23"/>`;
    };
    return `
      <rect class="cv-out" x="-9" y="-1.6" width="18" height="${H + 3.2}"/>
      <rect class="cv-floor" x="-7.5" y="0" width="15" height="${H}"/>
      ${end(true)}
      ${full ? end(false) : ''}
      <line class="cv-line" x1="-7.5" y1="14" x2="7.5" y2="14"/>
      ${full ? '<circle class="cv-line cv-none" cx="0" cy="14" r="1.8"/>' : '<path class="cv-line" d="M-1.8 14 A1.8 1.8 0 0 1 1.8 14"/>'}
      <rect class="cv-line cv-none" x="-7.5" y="0" width="15" height="${H}"/>`;
  }

  // 動きの線（from → to。via があれば曲げる）。人の丸にかからないよう、両はしを少し縮める
  function movePath(m) {
    const [x1, y1] = m.from, [x2, y2] = m.to;
    if (m.via) {
      const [vx, vy] = m.via;
      const cx = 2 * vx - (x1 + x2) / 2, cy = 2 * vy - (y1 + y2) / 2;
      const a = shrink([x1, y1], [cx, cy], R + 0.08), b = shrink([x2, y2], [cx, cy], m.t === 'screen' ? R + 0.15 : R + 0.12);
      return { d: `M${f(a[0])} ${f(a[1])} Q${f(cx)} ${f(cy)} ${f(b[0])} ${f(b[1])}`, end: b, dir: unit([b[0] - cx, b[1] - cy]), pts: bez([a, [cx, cy], b]) };
    }
    const a = shrink([x1, y1], [x2, y2], R + 0.08), b = shrink([x2, y2], [x1, y1], m.t === 'screen' ? 0.05 : R + 0.12);
    return { d: `M${f(a[0])} ${f(a[1])} L${f(b[0])} ${f(b[1])}`, end: b, dir: unit([b[0] - a[0], b[1] - a[1]]), pts: [a, b] };
  }
  const f = (n) => Math.round(n * 1000) / 1000;
  const unit = ([x, y]) => { const l = Math.hypot(x, y) || 1; return [x / l, y / l]; };
  function shrink(p, toward, d) {
    const [ux, uy] = unit([toward[0] - p[0], toward[1] - p[1]]);
    const len = Math.hypot(toward[0] - p[0], toward[1] - p[1]);
    const k = Math.min(d, len * 0.4);
    return [p[0] + ux * k, p[1] + uy * k];
  }
  function bez([a, c, b], n = 24) {
    const out = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, u = 1 - t;
      out.push([u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]);
    }
    return out;
  }
  // ドリブルの波線（線にそってジグザグ）
  function zigzag(pts) {
    const flat = [];
    for (let i = 1; i < pts.length; i++) {
      const [x1, y1] = pts[i - 1], [x2, y2] = pts[i];
      const L = Math.hypot(x2 - x1, y2 - y1), n = Math.max(1, Math.round(L / 0.1));
      for (let k = 0; k < n; k++) flat.push([x1 + ((x2 - x1) * k) / n, y1 + ((y2 - y1) * k) / n]);
    }
    flat.push(pts[pts.length - 1]);
    let s = 0, d = '';
    const amp = 0.18, wave = 0.55;
    for (let i = 0; i < flat.length; i++) {
      const p = flat[i];
      if (i) s += Math.hypot(p[0] - flat[i - 1][0], p[1] - flat[i - 1][1]);
      const q = flat[Math.min(flat.length - 1, i + 1)], r = flat[Math.max(0, i - 1)];
      const [ux, uy] = unit([q[0] - r[0], q[1] - r[1]]);
      const total = s;
      const fade = i > flat.length - 4 ? 0 : 1; // 矢印の手前はまっすぐ
      const o = Math.sin((total / wave) * Math.PI * 2) * amp * fade;
      d += (i ? ' L' : 'M') + f(p[0] - uy * o) + ' ' + f(p[1] + ux * o);
    }
    return d;
  }

  function movesSVG(frame, id) {
    return frame.moves.filter((m) => m.from && m.to).map((m) => {
      const p = movePath(m);
      const cls = 'cv-mv cv-' + m.t + (m.def ? ' cv-def' : '');
      const mk = m.def ? `url(#ah-x-${id})` : `url(#ah-o-${id})`;
      if (m.t === 'screen') {
        const [ex, ey] = p.end, [ux, uy] = p.dir, w = 0.42;
        return `<path class="${cls}" d="${p.d}"/><line class="${cls}" x1="${f(ex - uy * w)}" y1="${f(ey + ux * w)}" x2="${f(ex + uy * w)}" y2="${f(ey - ux * w)}"/>`;
      }
      if (m.t === 'dribble' || m.t === 'handoff') {
        let extra = '';
        if (m.t === 'handoff') {
          const [ex, ey] = p.end, [ux, uy] = p.dir, w = 0.32;
          for (const k of [0.25, 0.5]) extra += `<line class="${cls}" x1="${f(ex - ux * k - uy * w)}" y1="${f(ey - uy * k + ux * w)}" x2="${f(ex - ux * k + uy * w)}" y2="${f(ey - uy * k - ux * w)}"/>`;
        }
        return `<path class="${cls}" d="${zigzag(p.pts)}" marker-end="${m.t === 'dribble' ? mk : ''}"/>${extra}`;
      }
      return `<path class="${cls}" d="${p.d}" marker-end="${mk}"/>`;
    }).join('');
  }

  const place = (g, p) => {
    if (!p) { g.style.opacity = '0'; return; }
    g.style.opacity = '1';
    g.style.transform = `translate(${f(p[0])}px, ${f(p[1])}px)`;
  };

  // el の中に図を入れる。返り値：{ go(i) }
  BC.court = function (el, diagram, opt = {}) {
    const frames = BC.frames(diagram);
    if (!frames.length) return null;
    const id = ++uid;
    const full = frames[0].court === 'full';
    const H = full ? 28 : 14;
    // 人がいる範囲だけを見せる（full でも、上半分だけで足りるときは切る）
    let maxY = full ? H + 1.6 : 14.8;
    const minY = -1.6;
    const vb = `-9 ${minY} 18 ${f(maxY - minY)}`;
    const players = [];
    for (let i = 0; i < 5; i++) players.push(`<g class="cv-p cv-o" data-p="o${i + 1}"><circle r="${R}"/><text y="0.02">${i + 1}</text></g>`);
    for (let i = 0; i < 5; i++) players.push(`<g class="cv-p cv-x" data-p="x${i + 1}"><path d="M-0.32 -0.32 L0.32 0.32 M0.32 -0.32 L-0.32 0.32"/><text x="0.42" y="0.42">${i + 1}</text></g>`);
    el.classList.add('cv');
    el.innerHTML = `
      <div class="cv-stage${full ? ' cv-full' : ''}">
        <svg viewBox="${vb}" xmlns="${NS}" role="img" aria-label="${opt.label ? opt.label.replace(/"/g, '') + 'の' : ''}作戦図">
          <defs>
            <marker id="ah-o-${id}" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path class="cv-ah" d="M0 0 L10 5 L0 10 z"/></marker>
            <marker id="ah-x-${id}" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path class="cv-ah cv-ah-x" d="M0 0 L10 5 L0 10 z"/></marker>
          </defs>
          ${courtSVG(full)}
          <g class="cv-cones"></g>
          <g class="cv-moves"></g>
          <g class="cv-people">${players.join('')}<circle class="cv-ball" r="0.2"/></g>
        </svg>
      </div>
      <div class="cv-bar">
        ${frames.length > 1 ? `<button type="button" class="cv-btn" data-cv="prev" aria-label="前の場面">◀</button><span class="cv-count"></span><button type="button" class="cv-btn" data-cv="next" aria-label="次の場面">▶</button>` : ''}
        <p class="cv-note"></p>
      </div>
      <p class="cv-legend"><span><i class="lg-o"></i>攻め</span><span><i class="lg-x"></i>守り</span><span><i class="lg-cut"></i>走る</span><span><i class="lg-pass"></i>パス</span><span><i class="lg-drb"></i>ドリブル</span><span><i class="lg-scr"></i>スクリーン</span></p>`;
    const svg = el.querySelector('svg');
    const movesG = svg.querySelector('.cv-moves');
    const conesG = svg.querySelector('.cv-cones');
    const ball = svg.querySelector('.cv-ball');
    const note = el.querySelector('.cv-note');
    const count = el.querySelector('.cv-count');
    const nodes = {};
    svg.querySelectorAll('.cv-p').forEach((g) => { nodes[g.dataset.p] = g; });
    let cur = 0;
    function go(i) {
      cur = (i + frames.length) % frames.length;
      const fr = frames[cur];
      for (let k = 0; k < 5; k++) { place(nodes['o' + (k + 1)], fr.o[k]); place(nodes['x' + (k + 1)], fr.x[k]); }
      const bp = fr.ballAt;
      const held = typeof fr.ball === 'number';
      if (bp) { ball.style.opacity = '1'; ball.style.transform = held ? `translate(${f(bp[0] + 0.38)}px, ${f(bp[1] - 0.38)}px)` : `translate(${f(bp[0])}px, ${f(bp[1])}px)`; } else ball.style.opacity = '0';
      movesG.innerHTML = movesSVG(fr, id);
      conesG.innerHTML = (fr.cones || []).map((p) => `<path class="cv-cone" d="M${f(p[0])} ${f(p[1] - 0.32)} L${f(p[0] + 0.28)} ${f(p[1] + 0.22)} L${f(p[0] - 0.28)} ${f(p[1] + 0.22)} Z"/>`).join('');
      note.textContent = fr.note || '';
      note.hidden = !fr.note;
      if (count) count.textContent = `${cur + 1} / ${frames.length}`;
    }
    el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-cv]');
      if (!b) return;
      go(cur + (b.dataset.cv === 'next' ? 1 : -1));
    });
    // はじめは動かさずに置く
    svg.classList.add('cv-still');
    go(0);
    requestAnimationFrame(() => requestAnimationFrame(() => svg.classList.remove('cv-still')));
    return { go, frames };
  };

  // 一覧用の小さな図（最初の場面だけ。動きなし・番号なし）
  BC.courtThumb = function (diagram) {
    const fr = BC.frames(diagram)[0];
    if (!fr) return '';
    const full = fr.court === 'full';
    const H = full ? 28 : 14;
    const ps = fr.o.filter(Boolean).map((p) => `<circle class="cvt-o" cx="${f(p[0])}" cy="${f(p[1])}" r="0.75"/>`).join('') +
      fr.x.filter(Boolean).map((p) => `<path class="cvt-x" d="M${f(p[0] - 0.5)} ${f(p[1] - 0.5)} l1 1 m0 -1 l-1 1"/>`).join('') +
      (fr.cones || []).map((p) => `<path class="cv-cone" d="M${f(p[0])} ${f(p[1] - 0.45)} l0.4 0.75 l-0.8 0 Z"/>`).join('');
    return `<svg class="cvt" viewBox="-8 -1 16 ${H + 2}" aria-hidden="true">${courtSVG(full)}${ps}</svg>`;
  };
})();
