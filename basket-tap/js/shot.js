/* バスケ タップ記録 — シュートの場所の、コートの図（ハーフコートの SVG・押した所の読み取り・印）
   図の座標はメートル（幅 15・奥行き 14。ゴールが上）。場所は 0〜1 に直して記録する（形と決まりは core.js の BT.COURT）。
   SVG にしたのは、どの大きさでも線がくっきりし、押した所を getScreenCTM でそのまま読めるから。 */
(function (root) {
  'use strict';
  const BT = root.BT;
  const NS = 'http://www.w3.org/2000/svg';
  const C = BT.COURT;
  const PAD = 0.25;          // 外の線が切れないよう、まわりに少しすき間（メートル）

  function el(tag, attrs) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs || {}) e.setAttribute(k, attrs[k]);
    return e;
  }
  const line = (cls, d) => el('path', { class: cls, d, 'vector-effect': 'non-scaling-stroke' });

  /* ハーフコートの図。opt：{ court: 'std' | 'mini', shots: [{ x, y, made, color }], onTap(x, y), label } */
  function court(opt) {
    const o = opt || {};
    const svg = el('svg', { class: 'court' + (o.onTap ? ' tappable' : ''), viewBox: `${-PAD} ${-PAD} ${C.W + 2 * PAD} ${C.D + 2 * PAD}`, role: o.onTap ? 'button' : 'img', 'aria-label': o.label || 'ハーフコート（ゴールが上）' });
    svg.dataset.court = o.court === 'mini' ? 'mini' : 'std';
    const half = C.pw / 2, L = C.bx - half, R = C.bx + half;
    svg.append(
      el('rect', { class: 'cf', x: 0, y: 0, width: C.W, height: C.D }),
      el('rect', { class: 'cpaint', x: L, y: 0, width: C.pw, height: C.pd }),
      line('cl', `M0 0H${C.W}V${C.D}H0Z`),                                          // ベースライン・サイドライン・センターライン
      line('cl', `M${L} 0V${C.pd}H${R}V0`),                                         // ペイント
      line('cl', `M${C.bx - C.ftR} ${C.pd}A${C.ftR} ${C.ftR} 0 0 0 ${C.bx + C.ftR} ${C.pd}`),     // フリースローサークル（外の半分）
      line('cl dash', `M${C.bx - C.ftR} ${C.pd}A${C.ftR} ${C.ftR} 0 0 1 ${C.bx + C.ftR} ${C.pd}`),
      line('cl', `M${C.bx - C.ftR} ${C.D}A${C.ftR} ${C.ftR} 0 0 1 ${C.bx + C.ftR} ${C.D}`),       // センターサークル（半分）
      line('cl', `M${C.bx - C.ncR} 1.2V${C.by}A${C.ncR} ${C.ncR} 0 0 0 ${C.bx + C.ncR} ${C.by}V1.2`)  // ノーチャージの半円
    );
    if (o.court !== 'mini') {
      const xl = C.c3, xr = C.W - C.c3;
      svg.append(line('cl c3', `M${xl} 0V${C.y3}A${C.r3} ${C.r3} 0 0 0 ${xr} ${C.y3}V0`));
    }
    svg.append(
      line('cl board', `M${C.bx - 0.9} 1.2H${C.bx + 0.9}`),                          // ボード（ベースラインから 1.2 m）
      el('circle', { class: 'ring', cx: C.bx, cy: C.by, r: 0.225, 'vector-effect': 'non-scaling-stroke' }));
    const marks = el('g', { class: 'marks' });
    svg.append(marks);
    svg.__marks = marks;
    if (o.shots) setMarks(svg, o.shots);
    if (o.onTap) svg.addEventListener('click', (e) => { const p = pos(svg, e.clientX, e.clientY); if (p) o.onTap(p.x, p.y); });
    return svg;
  }

  /* 印：入った（made）は、チームの色の丸に濃いふち（白いユニフォームでも見えるように）・外れは ×（濃い色の下地の上にチームの色）。
     暗い画面では、まわりに白い輪（halo）も付ける（黒・紺のユニフォームが、暗い床に沈まないように） */
  function setMarks(svg, shots) {
    const g = svg.__marks;
    while (g.firstChild) g.firstChild.remove();
    (shots || []).forEach((s) => {
      const cx = s.x * C.W, cy = s.y * C.D, col = s.color || '#888';
      if (s.made !== false) {
        g.append(el('circle', { class: 'mk halo', cx, cy, r: 0.44 }), el('circle', { class: 'mk made', cx, cy, r: 0.34, fill: col, 'vector-effect': 'non-scaling-stroke' }));
      } else {
        const k = 0.28, d = `M${cx - k} ${cy - k}L${cx + k} ${cy + k}M${cx + k} ${cy - k}L${cx - k} ${cy + k}`;
        g.append(el('path', { class: 'mk missu', d, 'vector-effect': 'non-scaling-stroke' }), el('path', { class: 'mk miss', d, stroke: col, 'vector-effect': 'non-scaling-stroke' }));
      }
    });
  }

  /* 画面の位置（clientX・clientY）→ 場所（0〜1・0.001 まで。コートの外は、いちばん近いコートの端） */
  function pos(svg, cx, cy) {
    let mx, my;
    const m = svg.getScreenCTM && svg.getScreenCTM();
    if (m && svg.createSVGPoint) {
      const p = svg.createSVGPoint();
      p.x = cx; p.y = cy;
      const q = p.matrixTransform(m.inverse());
      mx = q.x; my = q.y;
    } else {
      const r = svg.getBoundingClientRect();
      if (!r.width || !r.height) return null;
      mx = (cx - r.left) / r.width * (C.W + 2 * PAD) - PAD;
      my = (cy - r.top) / r.height * (C.D + 2 * PAD) - PAD;
    }
    return { x: BT.locRound(mx / C.W), y: BT.locRound(my / C.D) };
  }
  /* 場所（0〜1）→ 画面の位置（テストと、印の確かめ用） */
  function client(svg, x, y) {
    const m = svg.getScreenCTM();
    const p = svg.createSVGPoint();
    p.x = x * C.W; p.y = y * C.D;
    const q = p.matrixTransform(m);
    return { x: q.x, y: q.y };
  }

  BT.shot = {
    WAIT: 6000,          // 試合を見ながら記録するとき：これだけ押さなければ、場所の小窓を自動で閉じる（ミリ秒）
    court, setMarks, pos, client
  };
})(typeof window !== 'undefined' ? window : globalThis);
