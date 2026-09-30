// ============================================================
// tpl/hs_func1.js — 高校 2次関数（数I）
//   quad_vertex / quad_maxmin / quad_determine
//
//  すべて自作の数値・言い回し。答えは別の方法（値の代入・格子点での全数チェック）でも確かめている。
// ============================================================
import { num, choice, fields } from "../../core/items.js";
import { Q, add, sub, mul, div, neg, eq, cmp, num as qnum } from "../../core/rational.js";
import { tq, ts } from "../../core/tex.js";
import { P } from "../../core/poly.js";
import { t, until, assert } from "./util.js";

const $ = (s) => `$${s}$`;
const sgn = (n) => (n >= 0 ? `+${n}` : `${n}`);
const px = (p, order = ["x"]) => p.toTeX({ order });
const C = (cs, v = "x") => P.coeffs(cs, v);
const toQ_ = (x) => (typeof x === "number" ? Q(x) : x);

/** 係数 a の TeX（1 は省き、-1 は "-"） */
function coefTex(a) {
  const A = toQ_(a);
  if (A.n === 1 && A.d === 1) return "";
  if (A.n === -1 && A.d === 1) return "-";
  return tq(A);
}

/** y の右辺 a(x − p)² + q の TeX（a, p, q は数または Q） */
function vertexTex(a, p, q) {
  p = toQ_(p);
  q = toQ_(q);
  const inner = p.n === 0 ? "x" : `(x${p.n < 0 ? "+" : "-"}${tq(Q(Math.abs(p.n), p.d))})`;
  const head = p.n === 0 ? `${coefTex(a)}x^{2}` : `${coefTex(a)}${inner}^{2}`;
  return `${head}${q.n === 0 ? "" : ts(q)}`;
}

/** y の右辺 a(x − α)(x − β) の TeX */
function interceptTex(a, al, be) {
  const f = (v) => (v === 0 ? "x" : `(x${v < 0 ? "+" : "-"}${Math.abs(v)})`);
  return `${coefTex(a)}${f(al)}${f(be)}`;
}

/** a(x − p)² + q を展開した係数 [c, b, a]（Q） */
function expandVertex(a, p, q) {
  const A = toQ_(a);
  return [add(mul(A, mul(p, p)), q), mul(mul(A, Q(-2)), p), A];
}

/** レベルごとに放物線 (a, p, q) をつくる。b, c が整数になるようにする */
function pickParabola(r, lv) {
  if (lv === 1) return { a: 1, p: Q(r.nz(-5, 5)), q: Q(r.int(-9, 9)) };
  if (lv === 2) return { a: r.pick([2, 3, -1, -2]), p: Q(r.nz(-4, 4)), q: Q(r.int(-8, 8)) };
  // 頂点の x 座標が分数（b が偶数でない）
  const a = r.pick([1, 1, 2, -1, -2]);
  const p = Q(r.pick([1, 3, 5, -1, -3, -5]), 2);
  const c = r.int(-6, 6);
  return { a, p, q: sub(Q(c), mul(Q(a), mul(p, p))) };
}

/** 頂点 (p, q) の検算：f(p)=q、かつ p の近くの点より小さい(大きい) */
function checkVertex(a, b, c, p, q) {
  const f = (x) => add(add(mul(Q(a), mul(x, x)), mul(Q(b), x)), Q(c));
  assert(eq(f(p), q), "頂点の y 座標の検算");
  const d = Q(1, 8);
  const ok = a > 0 ? cmp(f(add(p, d)), q) > 0 && cmp(f(sub(p, d)), q) > 0 : cmp(f(add(p, d)), q) < 0 && cmp(f(sub(p, d)), q) < 0;
  assert(ok, "頂点が最小(最大)になっている");
}

/** 誤答候補 [TeX, mc] を重複なしで選択肢にする */
function labels(list, correct) {
  const seen = new Set([correct]);
  const out = [];
  for (const [w, mc] of list) {
    if (seen.has(w)) continue;
    seen.add(w);
    out.push([$(w), mc]);
  }
  return out;
}

export default {
  // ── 2次関数のグラフ（平方完成・頂点） ─────────────
  quad_vertex: [
    t("fields", (r, lv) => {
      const { a, p, q } = pickParabola(r, lv);
      const [c, b] = expandVertex(a, p, q);
      assert(b.d === 1 && c.d === 1, "b, c が整数");
      checkVertex(a, b.n, c.n, p, q);
      const wrongs = [
        { values: { p: neg(p), q }, mc: "MC-VERTEX-SIGN" },
        { values: { p, q: c }, mc: "MC-VERTEX-COMPLETE-SQ" },
        { values: { p: neg(b), q }, mc: "MC-VERTEX-COEF" },
        { values: { p, q: neg(q) }, mc: "MC-SLIP" },
      ];
      if (a !== 1) wrongs.push({ values: { p: div(neg(b), Q(2)), q }, mc: "MC-VERTEX-LEADING" });
      return fields({
        q: `2次関数 $y=${px(C([c.n, b.n, a]))}$ のグラフの頂点の座標を求めなさい。`,
        fields: [
          { id: "p", value: p, pre: "$($" },
          { id: "q", value: q, pre: "$,$", post: "$)$" },
        ],
        wrongs,
        explain: `平方完成します。${a === 1 ? "" : `$x^2$ の係数 $${a}$ でまず $x$ の項までをくくり、`}$y=${vertexTex(a, p, q)}$ となります（$x$ の係数の半分を使って $(x-p)^2$ の形にし、余りを定数項に回す）。$y=a(x-p)^2+q$ の頂点は $(p,\\ q)$ なので、頂点は $(${tq(p)},\\ ${tq(q)})$。（確かめ：$x=${tq(p)}$ を代入すると $y=${tq(q)}$）`,
      });
    }),
    t(
      "choice",
      (r, lv) => {
        // 平方完成した形はどれか
        const { a, p, q } = pickParabola(r, lv);
        const [c, b] = expandVertex(a, p, q);
        const correct = vertexTex(a, p, q);
        const wrong = [
          [vertexTex(a, neg(p), q), "MC-VERTEX-SIGN"],
          [vertexTex(a, p, c), "MC-VERTEX-COMPLETE-SQ"],
          [vertexTex(a, p, neg(q)), "MC-SLIP"],
          [vertexTex(a === 1 ? 2 : 1, p, q), "MC-VERTEX-LEADING"],
          [vertexTex(a, div(b, Q(2)), q), "MC-VERTEX-COEF"],
          [vertexTex(a, p, add(q, Q(1))), "MC-SLIP"],
        ].map(([w, mc]) => [`y=${w}`, mc]);
        return choice({
          q: `2次関数 $y=${px(C([c.n, b.n, a]))}$ を $y=a(x-p)^2+q$ の形に変形したものはどれですか。`,
          correct: $(`y=${correct}`),
          wrongs: labels(wrong, `y=${correct}`),
          explain: `平方完成：${a === 1 ? "" : `$${a}$ でくくって、`}$x$ の係数の半分を使って $(x${p.n < 0 ? "+" : "-"}${tq(Q(Math.abs(p.n), p.d))})^2$ をつくり、増えた（減った）分を定数項で調整します。結果は $y=${correct}$。（右辺を展開し直して、もとの式にもどるか確かめられます）`,
        });
      },
      { id: "b", db: -0.1 },
    ),
    t(
      "choice",
      (r, lv) => {
        // グラフの平行移動：f(x) を x 軸方向に m、y 軸方向に n
        const m = r.nz(-4, 4);
        const n = r.nz(-5, 5);
        const [a, b, c] = lv === 1 ? [1, 0, 0] : lv === 2 ? [r.pick([2, 3, -1, -2]), 0, 0] : [1, r.nz(-4, 4), r.int(-5, 5)];
        const f = C([c, b, a]);
        // f(x − mm) + nn
        const moved = (mm, nn) => {
          const X = P.lin(1, -mm);
          return X.pow(2).scale(a).add(X.scale(b)).add(P.c(c + nn));
        };
        const g = moved(m, n);
        for (const x of [-2, -1, 0, 1, 3]) assert(eq(g.eval({ x }), add(f.eval({ x: x - m }), Q(n))), "平行移動の検算");
        const fmt = (mm, nn) => (lv <= 2 ? `y=${vertexTex(a, mm, nn)}` : `y=${px(moved(mm, nn))}`);
        const correct = fmt(m, n);
        const cand = [
          [fmt(-m, n), "MC-TRANSLATE-SIGN"],
          [fmt(m, -n), "MC-TRANSLATE-SIGN"],
          [fmt(-m, -n), "MC-TRANSLATE-SIGN"],
          [fmt(n, m), "MC-TRANSLATE-SWAP"],
        ];
        return choice({
          q: `放物線 $y=${px(f)}$ を、$x$ 軸方向に $${m}$、$y$ 軸方向に $${n}$ だけ平行移動したグラフの式はどれですか。`,
          correct: $(correct),
          wrongs: labels(cand, correct),
          explain: `$x$ 軸方向に $${m}$ 移動するときは $x$ を $x-(${m})$ に、$y$ 軸方向に $${n}$ 移動するときは式全体に $+(${n})$ を加えます。$y=f(x-(${m}))+(${n})$ より $${correct}$。（頂点の移動で確かめる：頂点が右に $${m}$、上に $${n}$ 動く）`,
        });
      },
      { id: "c", db: 0.1 },
    ),
  ],

  // ── 2次関数の最大・最小 ───────────────────────
  quad_maxmin: [
    t("num", (r, lv) => {
      const { a, p, q } = pickParabola(r, lv);
      const [c, b] = expandVertex(a, p, q);
      checkVertex(a, b.n, c.n, p, q);
      const isMax = a < 0;
      return num({
        q: `2次関数 $y=${px(C([c.n, b.n, a]))}$ の${isMax ? "最大値" : "最小値"}を求めなさい。`,
        ans: q,
        wrongs: [[c, "MC-QMAX-INTERCEPT"], [p, "MC-QMAX-XVALUE"], [neg(q), "MC-SLIP"], [neg(p), "MC-QMAX-XVALUE"]],
        reduced: true,
        explain: `平方完成すると $y=${vertexTex(a, p, q)}$。$x^2$ の係数が${a > 0 ? "正" : "負"}なので、グラフは${a > 0 ? "下" : "上"}に凸で、頂点 $(${tq(p)},\\ ${tq(q)})$ で${isMax ? "最大" : "最小"}になります。${isMax ? "最大値" : "最小値"}は頂点の $y$ 座標 $${tq(q)}$（$x$ 座標 $${tq(p)}$ ではありません）。`,
      });
    }),
    t(
      "num",
      (r, lv) => {
        // 定義域つきの最大・最小
        const { a, p, q } = pickParabola(r, lv);
        const [c, b] = expandVertex(a, p, q);
        assert(b.d === 1 && c.d === 1, "b, c が整数");
        // 定義域 [m, n]（整数）：L1 は頂点が内側、L2 は外側、L3 はどちらでも
        const [m, n] = until(
          () => {
            const lo = r.int(-6, 3);
            return [lo, lo + r.int(2, 6)];
          },
          ([lo, hi]) => (lv === 1 ? lo < qnum(p) && qnum(p) < hi : lv === 2 ? qnum(p) < lo || qnum(p) > hi : true),
        );
        const f = (x) => add(mul(Q(a), mul(sub(x, p), sub(x, p))), q);
        // 格子点(1/2 きざみ)での全数チェック。頂点も端も格子点上にある
        const vals = [];
        for (let x2 = 2 * m; x2 <= 2 * n; x2++) vals.push(f(Q(x2, 2)));
        const mx = vals.reduce((u, v) => (cmp(u, v) >= 0 ? u : v));
        const mn = vals.reduce((u, v) => (cmp(u, v) <= 0 ? u : v));
        const wantMax = r.chance(0.5);
        const ans = wantMax ? mx : mn;
        const vertexIn = qnum(p) >= m && qnum(p) <= n;
        return num({
          q: `$${m}\\le x\\le ${n}$ のとき、2次関数 $y=${px(C([c.n, b.n, a]))}$ の${wantMax ? "最大値" : "最小値"}を求めなさい。`,
          ans,
          wrongs: [[q, "MC-QMAX-DOMAIN"], [wantMax ? mn : mx, "MC-QMAX-CONVEX"], [f(Q(m)), "MC-QMAX-DOMAIN"], [f(Q(n)), "MC-QMAX-DOMAIN"]],
          reduced: true,
          explain: `平方完成すると $y=${vertexTex(a, p, q)}$。頂点は $(${tq(p)},\\ ${tq(q)})$ で、定義域 $${m}\\le x\\le ${n}$ に${vertexIn ? "入っています" : "入っていません"}。端の値は $x=${m}$ で $y=${tq(f(Q(m)))}$、$x=${n}$ で $y=${tq(f(Q(n)))}$${vertexIn ? `、頂点で $y=${tq(q)}$` : ""}。${vertexIn ? "これらを比べて" : "頂点が範囲外なので、端の値を比べて"}${wantMax ? "最大値" : "最小値"}は $${tq(ans)}$。（定義域があるときは、頂点の値だけで決めてはいけません）`,
        });
      },
      { id: "b", db: 0.25 },
    ),
    t(
      "num",
      (r, lv) => {
        // 文章題：面積・売上・高さの最大値。L3 は変数の範囲に制限がつく（頂点が範囲の外）
        const limited = lv === 3;
        const kind = lv === 1 ? r.pick(["rect", "ball"]) : lv === 2 ? r.pick(["wall", "sales"]) : r.pick(["rect", "wall", "sales", "ball"]);
        let story; // 問題文（最大値をたずねる直前まで）
        let f; // 変数 x の関数
        let xs; // 頂点の x
        let unit;
        let hiNat; // x の自然な上限
        let explainCore;
        if (kind === "rect") {
          const h = r.pick([6, 8, 10, 12, 14, 16, 20]);
          xs = h / 2;
          hiNat = h;
          f = (x) => x * (h - x);
          unit = "m²";
          story = `周の長さが $${2 * h}\\,\\mathrm{m}$ の長方形があります。縦の長さを $x\\,\\mathrm{m}$ とすると、横の長さは $(${h}-x)\\,\\mathrm{m}$ です。面積 $y\\,\\mathrm{m}^2$`;
          explainCore = `$y=x(${h}-x)=-x^2+${h}x=-(x-${xs})^2+${xs * xs}$`;
        } else if (kind === "wall") {
          const T = r.pick([8, 12, 16, 20, 24, 28, 32]);
          xs = T / 4;
          hiNat = T / 2;
          f = (x) => x * (T - 2 * x);
          unit = "m²";
          story = `長さ $${T}\\,\\mathrm{m}$ のロープで、壁を1辺として3辺をかこむ長方形の花壇をつくります。壁に垂直な辺の長さを $x\\,\\mathrm{m}$ とすると、壁に平行な辺は $(${T}-2x)\\,\\mathrm{m}$ です。面積 $y\\,\\mathrm{m}^2$`;
          explainCore = `$y=x(${T}-2x)=-2x^2+${T}x=-2(x-${xs})^2+${2 * xs * xs}$`;
        } else if (kind === "sales") {
          const k = r.pick([1, 2, 4]);
          xs = r.pick([20, 30, 40, 50, 60]);
          const N = 2 * k * xs;
          hiNat = N / k;
          f = (x) => x * (N - k * x);
          unit = "円";
          story = `1個 $x$ 円で売ると、1日に $(${N}-${k === 1 ? "" : k}x)$ 個売れる商品があります。1日の売上高 $y$ 円（$y=x\\times$ 売れる個数）`;
          explainCore = `$y=x(${N}-${k === 1 ? "" : k}x)=-${k === 1 ? "" : k}x^2+${N}x=-${k === 1 ? "" : k}(x-${xs})^2+${k * xs * xs}$`;
        } else {
          const a2 = r.pick([1, 2, 5]);
          xs = r.pick(limited ? [2, 3] : [1, 2, 3]);
          const c0 = r.pick([0, 1, 2, 3]);
          hiNat = 2 * xs + 2;
          const b2 = 2 * a2 * xs;
          f = (x) => -a2 * x * x + b2 * x + c0;
          unit = "m";
          story = `地面から $${c0}\\,\\mathrm{m}$ の高さで、ボールを真上に投げ上げました。$t$ 秒後の高さは $y=-${a2 === 1 ? "" : a2}t^2+${b2}t${c0 === 0 ? "" : `+${c0}`}$（m）で表されます。ここでは $t$ を $x$ とみて、高さ $y\\,\\mathrm{m}$`;
          explainCore = `$y=-${a2 === 1 ? "" : a2}x^2+${b2}x${c0 === 0 ? "" : `+${c0}`}=-${a2 === 1 ? "" : a2}(x-${xs})^2+${a2 * xs * xs + c0}$`;
        }
        // 制限：L3 は 0 < x ≤ L（L は頂点より左）
        const L = limited ? r.int(1, xs - 1) : null;
        const hi = limited ? L : hiNat;
        let best = -Infinity;
        for (let x2 = 0; x2 <= 2 * hi; x2++) best = Math.max(best, f(x2 / 2));
        const vertexVal = f(xs);
        const ans = limited ? f(L) : vertexVal;
        assert(best === ans, "文章題の最大値の検算");
        assert(limited ? L < xs : Number.isInteger(xs), "頂点の位置");
        const wrongs = [[xs, "MC-QMAX-XVALUE"], [ans + 1, "MC-SLIP"], [ans - 1, "MC-SLIP"]];
        if (limited) wrongs.push([vertexVal, "MC-QMAX-DOMAIN"]);
        else if (f(0) !== 0) wrongs.push([f(0), "MC-QMAX-INTERCEPT"]);
        else wrongs.push([f(xs - 1), "MC-SLIP"]);
        return num({
          q: `${story}の最大値を求めなさい。${limited ? `ただし $0\\le x\\le ${L}$ とします。` : ""}`,
          ans,
          post: unit,
          wrongs: wrongs.filter(([v]) => Number.isInteger(v)),
          explain: `${explainCore}。頂点は $x=${xs}$ のとき $y=${vertexVal}$。${limited ? `ただし $x\\le ${L}$ で頂点 $x=${xs}$ は範囲の外です。グラフは $x<${xs}$ の範囲で増加しているので、範囲の右端 $x=${L}$ で最大になり、$y=${ans}$。` : `最大値は $${vertexVal}$（$x$ の値 $${xs}$ ではなく、$y$ の値）。`}`,
        });
      },
      { id: "c", db: 0.3 },
    ),
  ],

  // ── 2次関数の決定 ─────────────────────────────
  quad_determine: [
    t("fields", (r, lv) => {
      if (lv === 1) {
        // 頂点 (p, q) と通る点から y = ax² + bx + c
        const a = r.pick([1, 2, 3, -1, -2, -3]);
        const p = r.nz(-3, 3);
        const q = r.nz(-5, 5);
        const dx = r.pick([1, 2, 3, -1, -2]);
        const x0 = p + dx;
        const y0 = a * dx * dx + q;
        const [c, b] = expandVertex(a, Q(p), Q(q));
        // 検算：3つの条件をみたす
        assert(eq(add(add(Q(a * x0 * x0), mul(b, Q(x0))), c), Q(y0)), "通る点の検算");
        const alt = (pp) => {
          // p の符号をまちがえたとき
          const aa = div(Q(y0 - q), Q((x0 - pp) ** 2));
          const [cc, bb] = expandVertex(aa, Q(pp), Q(q));
          return { a: aa, b: bb, c: cc };
        };
        const w1 = x0 + p !== 0 ? alt(-p) : null; // x0 = −p のときは 0 でわることになるので使わない
        return fields({
          q: `頂点が点 $(${p},\\ ${q})$ で、点 $(${x0},\\ ${y0})$ を通る放物線を $y=ax^2+bx+c$ と表すとき、$a$、$b$、$c$ の値を答えなさい。`,
          fields: [
            { id: "a", value: a, pre: "$a=$" },
            { id: "b", value: b, pre: "$b=$" },
            { id: "c", value: c, pre: "$c=$" },
          ],
          wrongs: [
            ...(w1 ? [{ values: { a: w1.a, b: w1.b, c: w1.c }, mc: "MC-VERTEX-SIGN" }] : []),
            { values: { a: a, b: neg(b), c }, mc: "MC-QDET-SIGN" },
            { values: { a: a, b: Q(-2 * a * q), c: Q(a * p * p + q) }, mc: "MC-QDET-SIGN" },
          ],
          explain: `頂点がわかっているので $y=a(x-p)^2+q$ とおきます。$y=a(x${sgn(-p)})^2${sgn(q)}$。点 $(${x0},\\ ${y0})$ を通るので $${y0}=a(${x0}${sgn(-p)})^2${sgn(q)}=${dx * dx}a${sgn(q)}$、$a=${a}$。展開すると $y=${px(C([c.n, b.n, a]))}$ なので $a=${a}$、$b=${b.n}$、$c=${c.n}$。`,
        });
      }
      if (lv === 2) {
        // 3点を通る放物線
        const a = r.nz(-3, 3);
        const b = r.nz(-6, 6);
        const c = r.nz(-6, 6);
        const xs3 = until(() => [r.int(-3, 3), r.int(-3, 3), r.int(-3, 3)], (v) => new Set(v).size === 3);
        const pts = xs3.map((x) => [x, a * x * x + b * x + c]);
        // 独立な検算：連立方程式を消去法で解いて (a, b, c) にもどる
        const [[x1, y1], [x2, y2], [x3, y3]] = pts;
        // (y1−y2)/(x1−x2) = a(x1+x2) + b、(y2−y3)/(x2−x3) = a(x2+x3) + b
        const s12 = Q(y1 - y2, x1 - x2);
        const s23 = Q(y2 - y3, x2 - x3);
        const aa = div(sub(s12, s23), Q(x1 - x3));
        const bb = sub(s12, mul(aa, Q(x1 + x2)));
        const cc = sub(Q(y1), add(mul(aa, Q(x1 * x1)), mul(bb, Q(x1))));
        assert(eq(aa, Q(a)) && eq(bb, Q(b)) && eq(cc, Q(c)), "3点から求めた係数の検算");
        const pTex = pts.map(([x, y]) => `$(${x},\\ ${y})$`).join("、");
        return fields({
          q: `放物線 $y=ax^2+bx+c$ が3点 ${pTex} を通るとき、$a$、$b$、$c$ の値を答えなさい。`,
          fields: [
            { id: "a", value: a, pre: "$a=$" },
            { id: "b", value: b, pre: "$b=$" },
            { id: "c", value: c, pre: "$c=$" },
          ],
          wrongs: [
            { values: { a: -a, b, c }, mc: "MC-QDET-SYSTEM" },
            { values: { a, b: -b, c }, mc: "MC-QDET-SYSTEM" },
            { values: { a, b, c: Q(pts[0][1]) }, mc: "MC-QDET-SYSTEM" },
          ],
          explain: `3つの点の座標を $y=ax^2+bx+c$ に代入して、$a$、$b$、$c$ の連立方程式にします。${pts.map(([x, y]) => `$${y}=${x * x}a${sgn(x)}b+c$`).join("、")}。ここから $c$ を消すように2式ずつひいていくと $a=${a}$、$b=${b}$、$c=${c}$ が求まります。（$x=0$ を通るなら、$c$ はその点の $y$ 座標そのもの）`,
        });
      }
      // x軸との交点 (α, 0), (β, 0) と、通る点：y = a(x−α)(x−β)
      const [al, be] = until(() => [r.int(-4, 3), r.int(-3, 5)], ([u, v]) => u < v);
      const a = r.pick([1, 2, -1, -2, 3]);
      const x0 = until(() => r.int(-4, 5), (v) => v !== al && v !== be);
      const y0 = a * (x0 - al) * (x0 - be);
      const b = -a * (al + be);
      const c = a * al * be;
      assert(eq(add(add(Q(a * x0 * x0), Q(b * x0)), Q(c)), Q(y0)), "通る点の検算");
      const altSign = () => {
        const den = (x0 + al) * (x0 + be);
        if (den === 0) return null;
        const aa = Q(y0, den);
        return { a: aa, b: mul(aa, Q(al + be)), c: mul(aa, Q(al * be)) };
      };
      const w = altSign();
      return fields({
        q: `放物線 $y=ax^2+bx+c$ が $x$ 軸と $x=${al}$、$x=${be}$ で交わり、点 $(${x0},\\ ${y0})$ を通るとき、$a$、$b$、$c$ の値を答えなさい。`,
        fields: [
          { id: "a", value: a, pre: "$a=$" },
          { id: "b", value: b, pre: "$b=$" },
          { id: "c", value: c, pre: "$c=$" },
        ],
        wrongs: [
          ...(w ? [{ values: { a: w.a, b: w.b, c: w.c }, mc: "MC-QDET-INTERCEPT-SIGN" }] : []),
          { values: { a, b: -b, c }, mc: "MC-QDET-SIGN" },
          { values: { a: Q(1), b: Q(-(al + be)), c: Q(al * be) }, mc: "MC-QDET-A-FORGOT" },
        ],
        explain: `$x$ 軸との交点が $x=${al}$、$${be}$ なので $y=a(x-(${al}))(x-${be})$ とおけます。点 $(${x0},\\ ${y0})$ を通るので $${y0}=a(${x0 - al})(${x0 - be})=${(x0 - al) * (x0 - be)}a$、$a=${a}$。展開して $y=${px(C([c, b, a]))}$ なので $a=${a}$、$b=${b}$、$c=${c}$。`,
      });
    }),
    t(
      "choice",
      (r, lv) => {
        // 式の形を選ぶ：L1 頂点＋点／L2 x軸との交点＋点／L3 軸＋2点
        if (lv === 1) {
          const a = r.pick([1, 2, 3, -1, -2, -3]);
          const p = r.nz(-4, 4);
          const q = r.nz(-6, 6);
          const dx = r.pick([1, 2, -1, -2]);
          const x0 = p + dx;
          const y0 = a * dx * dx + q;
          const correct = `y=${vertexTex(a, p, q)}`;
          const aWrong = Q(y0 - q, dx); // 2乗を忘れて (y0−q)/(x0−p)
          const cand = [
            [`y=${vertexTex(a, -p, q)}`, "MC-VERTEX-SIGN"],
            [`y=${vertexTex(aWrong, p, q)}`, "MC-QDET-A-SQUARE"],
            [`y=${vertexTex(a, p, -q)}`, "MC-QDET-SIGN"],
            [`y=${vertexTex(-a, p, q)}`, "MC-QDET-SIGN"],
            [`y=${vertexTex(a, p, y0)}`, "MC-QDET-A-FORGOT"],
          ];
          return choice({
            q: `頂点が点 $(${p},\\ ${q})$ で、点 $(${x0},\\ ${y0})$ を通る放物線の式はどれですか。`,
            correct: $(correct),
            wrongs: labels(cand, correct),
            explain: `頂点 $(p,\\ q)$ がわかっているときは $y=a(x-p)^2+q$。$p=${p}$、$q=${q}$ を入れて $y=a(x${sgn(-p)})^2${sgn(q)}$。点 $(${x0},\\ ${y0})$ を通るので $${y0}=a(${dx})^2${sgn(q)}$、$a=${a}$。よって $${correct}$。`,
          });
        }
        if (lv === 2) {
          const [al, be] = until(() => [r.int(-4, 2), r.int(-2, 5)], ([u, v]) => u < v);
          const a = r.pick([1, 2, -1, -2]);
          const x0 = until(() => r.int(-4, 5), (v) => v !== al && v !== be);
          const y0 = a * (x0 - al) * (x0 - be);
          const correct = `y=${interceptTex(a, al, be)}`;
          const den2 = (x0 + al) * (x0 + be);
          const cand = [
            [`y=${interceptTex(a, -al, -be)}`, "MC-QDET-INTERCEPT-SIGN"],
            [`y=${interceptTex(-a, al, be)}`, "MC-QDET-SIGN"],
            [`y=${interceptTex(1, al, be)}`, "MC-QDET-A-FORGOT"],
            ...(den2 !== 0 ? [[`y=${interceptTex(Q(y0, den2), -al, -be)}`, "MC-QDET-INTERCEPT-SIGN"]] : []),
            [`y=${interceptTex(a + 1 === 0 ? 3 : a + 1, al, be)}`, "MC-SLIP"],
          ];
          return choice({
            q: `$x$ 軸と $x=${al}$、$x=${be}$ で交わり、点 $(${x0},\\ ${y0})$ を通る放物線の式はどれですか。`,
            correct: $(correct),
            wrongs: labels(cand, correct),
            explain: `$x$ 軸との交点が $x=\\alpha,\\ \\beta$ のときは $y=a(x-\\alpha)(x-\\beta)$。$y=a(x${sgn(-al)})(x${sgn(-be)})$ に点 $(${x0},\\ ${y0})$ を代入すると $${y0}=a(${x0 - al})(${x0 - be})=${(x0 - al) * (x0 - be)}a$ で $a=${a}$。よって $${correct}$。（交点の符号は、式の中では逆）`,
          });
        }
        // 軸 x = p と2点：y = a(x−p)² + q
        const a = r.pick([1, 2, -1, -2]);
        const p = r.nz(-3, 3);
        const q = r.int(-5, 5);
        const [d1, d2] = until(() => [r.int(-3, 3), r.int(-3, 3)], ([u, v]) => u !== v && u !== -v && u !== 0 && v !== 0);
        const P1 = [p + d1, a * d1 * d1 + q];
        const P2 = [p + d2, a * d2 * d2 + q];
        // 検算：2点から a, q を求め直す
        const aa = div(Q(P1[1] - P2[1]), Q(d1 * d1 - d2 * d2));
        const qq = sub(Q(P1[1]), mul(aa, Q(d1 * d1)));
        assert(eq(aa, Q(a)) && eq(qq, Q(q)), "軸と2点の検算");
        const correct = `y=${vertexTex(a, p, q)}`;
        const cand = [
          [`y=${vertexTex(a, -p, q)}`, "MC-VERTEX-SIGN"],
          [`y=${vertexTex(a, p, -q)}`, "MC-QDET-SIGN"],
          [`y=${vertexTex(-a, p, q)}`, "MC-QDET-SIGN"],
          [`y=${vertexTex(a, p, q + 1)}`, "MC-SLIP"],
          [`y=${vertexTex(a === 1 ? 2 : 1, p, q)}`, "MC-SLIP"],
        ];
        return choice({
          q: `軸が直線 $x=${p}$ で、2点 $(${P1[0]},\\ ${P1[1]})$、$(${P2[0]},\\ ${P2[1]})$ を通る放物線の式はどれですか。`,
          correct: $(correct),
          wrongs: labels(cand, correct),
          explain: `軸が $x=${p}$ なので $y=a(x${sgn(-p)})^2+q$ とおけます。2点を代入して $${P1[1]}=${d1 * d1}a+q$、$${P2[1]}=${d2 * d2}a+q$。2式をひくと $${P1[1] - P2[1]}=${d1 * d1 - d2 * d2}a$ より $a=${a}$、$q=${q}$。よって $${correct}$。`,
        });
      },
      { id: "b", db: 0.2 },
    ),
  ],
};
