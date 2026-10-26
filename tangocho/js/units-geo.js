/* 単元：面積・体積（図つき）。meta に寸法を残す（tools/verify.cjs が、meta から面積・体積を別に計算して答えと見比べる）。
   各 STEP は 前半（gen／mix）＋ 後半（gen2／mix2＝同じ STEP の中で少しだけむずかしい。name2 がその説明）。
   図つきの単元は、1セット（20問）を「前半カード・後半カード」の2枚に分けて印刷する。 */
(function () {
  'use strict';
  const TG = window.TG;
  const F = TG.figs;
  // 図がつり合う比（細長すぎる図を作らない）
  const ok = (a, b, max) => Math.max(a, b) / Math.min(a, b) <= max;
  const unit = r => (r.chance(0.8) ? 'cm' : 'm');

  /* ---------- 面積 ---------- */
  const area = (shape, dims, u, fig, ans) => ({ pre: '面積', eq: true, ans: String(ans), post: `${u}²`, fig, meta: { kind: 'area', shape, dims, u } });

  const rect = r => {
    const u = unit(r), w = r.int(2, 12), h = r.int(2, 12);
    return w !== h && ok(w, h, 2.5) && w * h <= 100 ? area('rect', [w, h], u, F.rect(w, h, u), w * h) : null;
  };
  const rectBig = r => {   // 一辺が10〜15
    const u = unit(r), w = r.int(10, 15), h = r.int(3, 9);
    return w * h <= 120 ? area('rect', [w, h], u, F.rect(w, h, u), w * h) : null;
  };
  const square = r => { const u = unit(r), a = r.int(2, 10); return area('square', [a], u, F.square(a, u), a * a); };
  const triangle = r => {
    const u = unit(r), b = r.int(2, 12), h = r.int(2, 12);
    return ok(b, h, 2.5) && (b * h) % 2 === 0 && b * h <= 120 ? area('triangle', [b, h], u, F.triangle(b, h, u, r.chance(0.5) ? 'right' : 'acute', r.pick([0.3, 0.5, 0.7])), b * h / 2) : null;
  };
  const triangleBig = r => {
    const u = unit(r), b = r.int(8, 16), h = r.int(4, 14);
    return ok(b, h, 2.5) && (b * h) % 2 === 0 && b * h / 2 <= 90 ? area('triangle', [b, h], u, F.triangle(b, h, u, r.chance(0.5) ? 'right' : 'acute', r.pick([0.3, 0.5, 0.7])), b * h / 2) : null;
  };
  const parallelogram = r => {
    const u = unit(r), b = r.int(2, 12), h = r.int(2, 12);
    return ok(b, h, 2.5) && b * h <= 100 ? area('parallelogram', [b, h], u, F.parallelogram(b, h, u), b * h) : null;
  };
  const parallelogramBig = r => {
    const u = unit(r), b = r.int(8, 16), h = r.int(4, 12);
    return ok(b, h, 2.5) && b * h <= 150 ? area('parallelogram', [b, h], u, F.parallelogram(b, h, u), b * h) : null;
  };
  const trapezoid = r => {
    const u = unit(r), a = r.int(2, 10), b = r.int(a + 1, 12), h = r.int(2, 10);
    return (a + b) * h % 2 === 0 && ok(b, h, 3) && (a + b) * h / 2 <= 90 ? area('trapezoid', [a, b, h], u, F.trapezoid(a, b, h, u), (a + b) * h / 2) : null;
  };
  const trapezoidBig = r => {
    const u = unit(r), a = r.int(3, 12), b = r.int(a + 1, 16), h = r.int(4, 12);
    return (a + b) * h % 2 === 0 && ok(b, h, 3) && (a + b) * h / 2 <= 120 ? area('trapezoid', [a, b, h], u, F.trapezoid(a, b, h, u), (a + b) * h / 2) : null;
  };
  const circle = r => { const u = unit(r), rr = r.int(2, 10); return area('circle', [rr], u, F.circle(rr, u), `${rr * rr}π`); };
  const circleBig = r => { const u = unit(r), rr = r.int(6, 12); return area('circle', [rr], u, F.circle(rr, u), `${rr * rr}π`); };
  const semicircle = r => { const u = unit(r), rr = r.pick([2, 4, 6, 8, 10]); return area('semicircle', [rr], u, F.semicircle(rr, u), `${rr * rr / 2}π`); };

  TG.addUnit({
    id: 'area', cat: 'other', layout: 'fig', name: '面積', note: '長方形・三角形・平行四辺形・台形・円', n: 20, goal: [6, 5, 4],
    steps: [
      { name: '長方形・正方形', mix: [[7, rect], [3, square]], name2: '一辺が10〜15', gen2: rectBig },
      { name: '三角形・平行四辺形', mix: [[55, triangle], [45, parallelogram]], name2: '大きい数', mix2: [[1, triangleBig], [1, parallelogramBig]] },
      { name: '台形・円・ミックス', mix: [[45, trapezoid], [20, circle], [20, triangle], [15, parallelogram]], name2: '半円・大きい台形・円', mix2: [[1, trapezoidBig], [1, circleBig], [1, semicircle]] },
    ],
  });

  /* ---------- 体積 ---------- */
  const vol = (shape, dims, fig, ans) => ({ pre: '体積', eq: true, ans: String(ans), post: 'cm³', fig, meta: { kind: 'vol', shape, dims, u: 'cm' } });
  const U = 'cm';

  const cuboid = r => {
    const a = r.int(2, 6), b = r.int(2, 6), c = r.int(2, 6);
    return !(a === b && b === c) && a * b * c <= 120 ? vol('cuboid', [a, b, c], F.cuboid(a, b, c, U), a * b * c) : null;
  };
  const cuboidBig = r => {   // どれかが10。あとは小さい数
    const a = r.int(2, 10), b = r.int(2, 10), c = r.int(2, 10);
    return !(a === b && b === c) && Math.max(a, b, c) >= 8 && a * b * c <= 240 && a * b * c >= 100 ? vol('cuboid', [a, b, c], F.cuboid(a, b, c, U), a * b * c) : null;
  };
  const cube = r => { const a = r.int(2, 5); return vol('cube', [a], F.cube(a, U), a ** 3); };
  const cubeBig = r => { const a = r.pick([6, 10]); return vol('cube', [a], F.cube(a, U), a ** 3); };
  const triPrism = r => {
    const b = r.int(2, 8), h = r.int(2, 8), L = r.int(2, 8);
    return (b * h) % 2 === 0 && (b * h / 2) * L <= 120 ? vol('triPrism', [b, h, L], F.triPrism(b, h, L, U), (b * h / 2) * L) : null;
  };
  const triPrismBig = r => {
    const b = r.int(4, 10), h = r.int(4, 10), L = r.int(3, 10);
    return (b * h) % 2 === 0 && (b * h / 2) * L <= 250 ? vol('triPrism', [b, h, L], F.triPrism(b, h, L, U), (b * h / 2) * L) : null;
  };
  const prismBase = r => {
    const S = r.pick([6, 8, 9, 10, 12, 15, 16, 18, 20, 24, 25, 30]), H = r.int(2, 8);
    return S * H <= 200 ? vol('prismBase', [S, H], F.prismBase(S, H, U), S * H) : null;
  };
  const trapPrism = r => {
    const a = r.int(2, 6), b = r.int(a + 1, 8), h = r.int(2, 6), L = r.int(2, 8);
    return (a + b) * h % 2 === 0 && (a + b) * h / 2 * L <= 200 ? vol('trapPrism', [a, b, h, L], F.trapPrism(a, b, h, L, U), (a + b) * h / 2 * L) : null;
  };
  const cylinder = r => { const rr = r.int(2, 5), h = r.int(2, 9); return vol('cylinder', [rr, h], F.cylinder(rr, h, U), `${rr * rr * h}π`); };
  const cylinderD = r => { const rr = r.int(2, 5), h = r.int(2, 9); return vol('cylinderD', [2 * rr, h], F.cylinder(rr, h, U, true), `${rr * rr * h}π`); };
  const cone = r => {
    const rr = r.int(2, 6), h = r.int(2, 9);
    return (rr * rr * h) % 3 === 0 ? vol('cone', [rr, h], F.cone(rr, h, U), `${rr * rr * h / 3}π`) : null;
  };
  const coneD = r => {
    const rr = r.int(2, 6), h = r.int(2, 12);
    return (rr * rr * h) % 3 === 0 ? vol('coneD', [2 * rr, h], F.cone(rr, h, U, true), `${rr * rr * h / 3}π`) : null;
  };
  const pyramid = r => {
    const a = r.int(2, 8), b = r.chance(0.7) ? a : r.int(2, 8), h = r.int(2, 9);
    return (a * b * h) % 3 === 0 && a * b * h / 3 <= 150 ? vol('pyramid', [a, b, h], F.pyramid(a, b, h, U), a * b * h / 3) : null;
  };
  const pyramidBig = r => {
    const a = r.int(4, 10), b = r.chance(0.6) ? a : r.int(4, 10), h = r.int(3, 12);
    return (a * b * h) % 3 === 0 && a * b * h / 3 <= 250 ? vol('pyramid', [a, b, h], F.pyramid(a, b, h, U), a * b * h / 3) : null;
  };

  TG.addUnit({
    id: 'volume', cat: 'other', layout: 'fig', name: '体積', note: '直方体・角柱・円柱・すい体', n: 20, goal: [5, 4, 3],
    steps: [
      { name: '直方体・立方体', mix: [[7, cuboid], [3, cube]], name2: '大きい直方体', mix2: [[8, cuboidBig], [2, cubeBig]] },
      { name: '角柱（底面積×高さ）', mix: [[1, triPrism], [1, prismBase]], name2: '台形の柱・大きい三角柱', mix2: [[1, trapPrism], [1, triPrismBig]] },
      { name: '円柱・角すい・円すい', mix: [[35, cylinder], [30, cone], [35, pyramid]], name2: '直径で出る・大きいすい体', mix2: [[1, cylinderD], [1, coneD], [1, pyramidBig]] },
    ],
  });
})();
