// ============================================================
// tpl/hs_extC.js — 高校 数学C の追加単元
//   vector_pos / vector_space（ベクトル）
//   conic / param_polar / complex_plane（平面上の曲線と複素数平面）
//
//  すべて自作の数値・言い回し・図。答えは、座標での計算・曲線上の点での確かめ・
//  複素数の直接のかけ算など、別の方法でも計算し直して確かめている。
// ============================================================
import { num, choice, fields } from "../../core/items.js";
import { Q, toQ, add, sub, mul, div, neg, eq, num as qnum } from "../../core/rational.js";
import { tq, tp } from "../../core/tex.js";
import { t, until, assert, gcd } from "./util.js";
import { nearly, isqrt } from "./hs_util.js";
import { coordPlane } from "./fig.js";
import { radTex } from "./hs_trig.js";

const $ = (s) => `$${s}$`;
const sgn = (n) => (n >= 0 ? `+${n}` : `${n}`);
const va = "\\vec{a}";
const vb = "\\vec{b}";
/** s·a + t·b の TeX（係数は有理数、0 の項は書かない） */
function comb(s, t_, a = va, b = vb) {
  const term = (c, v, first) => {
    const q = typeof c === "number" ? Q(c) : c;
    if (q.n === 0) return "";
    const neg_ = q.n < 0;
    const abs = Q(Math.abs(q.n), q.d);
    const coef = abs.n === 1 && abs.d === 1 ? "" : tq(abs);
    return `${neg_ ? "-" : first ? "" : "+"}${coef}${v}`;
  };
  const out = `${term(s, a, true)}${term(t_, b, !term(s, a, true))}`;
  return out || "\\vec{0}";
}
/** 3次元のベクトル */
const v3 = (p) => `(${p[0]},\\ ${p[1]},\\ ${p[2]})`;
const dot3 = (u, v) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
/** 大きさが整数になる3次元ベクトル（ピタゴラスの4つ組） */
const QUAD = [[1, 2, 2, 3], [2, 3, 6, 7], [1, 4, 8, 9], [4, 4, 7, 9], [2, 6, 9, 11], [6, 6, 7, 11], [3, 4, 12, 13], [2, 5, 14, 15], [2, 10, 11, 15], [1, 12, 12, 17], [8, 9, 12, 17]];

// ── 2次曲線・極座標・複素数平面で使う小道具 ─────────────────
/** p²＋q²＝h² をみたす整数の組（楕円・双曲線の a, b, c や、絶対値が整数になる複素数を作る） */
const TRIPLES = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [12, 16, 20], [7, 24, 25]];
/** 係数つきの項（1 は省き、−1 は − だけ） */
const cv = (k, v) => (k === 1 ? v : k === -1 ? `-${v}` : `${k}${v}`);
/** v²/n の TeX（n＝1 なら v² だけ） */
const sqOver = (v, n) => (n === 1 ? `${v}^2` : `\\dfrac{${v}^2}{${n}}`);
/** x−p の形（かっこつき。p＝0 なら x のまま） */
const shifted = (v, p) => (p === 0 ? v : `(${v}${sgn(-p)})`);
/** 度 → ラジアン */
const toRad = (deg) => (deg * Math.PI) / 180;
/** 0°〜360° の角の「基準の角」（第1象限に折り返した角） */
const refDeg = (deg) => (deg <= 90 ? deg : deg <= 180 ? 180 - deg : deg <= 270 ? deg - 180 : 360 - deg);
/** 0 以上 360 未満にそろえる */
const mod360 = (deg) => ((deg % 360) + 360) % 360;
/** 象限（軸の上なら 0） */
const quadrant = (deg) => (deg % 90 === 0 ? 0 : Math.floor(mod360(deg) / 90) + 1);

/** 30°・45° の倍数の角の cos・sin を「有理数 q × √rad」で表す（例：cos 150° → q＝−1/2, rad＝3） */
function trigParts(deg) {
  const d = mod360(deg);
  const base = { 0: [[1, 1], [0, 1]], 30: [[Q(1, 2), 3], [Q(1, 2), 1]], 45: [[Q(1, 2), 2], [Q(1, 2), 2]], 60: [[Q(1, 2), 1], [Q(1, 2), 3]], 90: [[0, 1], [1, 1]] }[refDeg(d)];
  if (!base) throw new Error(`trigParts: ${deg}° は 30°・45° の倍数でない`);
  const cs = d > 90 && d < 270 ? -1 : 1;
  const ss = d > 180 ? -1 : 1;
  const out = { c: { q: mul(base[0][0], cs), rad: base[0][1] }, s: { q: mul(base[1][0], ss), rad: base[1][1] } };
  nearly(rootVal(out.c), Math.cos(toRad(d)), "cos の表の検算", 1e-12);
  nearly(rootVal(out.s), Math.sin(toRad(d)), "sin の表の検算", 1e-12);
  return out;
}
/** q√rad の値（浮動小数） */
const rootVal = (p) => qnum(p.q) * Math.sqrt(p.rad);
/** q√rad を k 倍 */
const rootMul = (p, k) => ({ q: mul(p.q, k), rad: p.rad });
/** q√rad の TeX（q は有理数。例：−3/2 と 3 → −\frac{3\sqrt{3}}{2}） */
function rootTex(p) {
  const q = typeof p.q === "number" ? Q(p.q) : p.q;
  if (p.rad === 1 || q.n === 0) return tq(q);
  const sign = q.n < 0 ? "-" : "";
  const n = Math.abs(q.n);
  const top = `${n === 1 ? "" : n}\\sqrt{${p.rad}}`;
  return q.d === 1 ? `${sign}${top}` : `${sign}\\frac{${top}}{${q.d}}`;
}
/** (q√rad)² の値（有理数） */
const rootSq = (p) => mul(mul(p.q, p.q), p.rad);
/** 点 (x, y) の TeX（成分は q√rad） */
const ptTex = (x, y) => `\\left(${rootTex(x)},\\ ${rootTex(y)}\\right)`;
/** 複素数 x＋yi の TeX（成分は q√rad） */
function cRootTex(x, y) {
  const xs = toQ(x.q).n === 0 ? "" : rootTex(x);
  const yq = toQ(y.q);
  if (yq.n === 0) return xs || "0";
  const ay = { q: Q(Math.abs(yq.n), yq.d), rad: y.rad };
  const ys = ay.rad === 1 && ay.q.n === 1 && ay.q.d === 1 ? "i" : `${rootTex(ay)}${ay.rad === 1 ? "" : "\\,"}i`;
  return `${xs}${yq.n < 0 ? "-" : xs ? "+" : ""}${ys}`;
}
/** 整数の複素数 a＋bi の TeX */
const cInt = (a, b) => cRootTex({ q: Q(a), rad: 1 }, { q: Q(b), rad: 1 });
/** 浮動小数の複素数のかけ算・わり算（検算用） */
const cmulF = (z, w) => [z[0] * w[0] - z[1] * w[1], z[0] * w[1] + z[1] * w[0]];
const cdivF = (z, w) => {
  const d = w[0] * w[0] + w[1] * w[1];
  return [(z[0] * w[0] + z[1] * w[1]) / d, (z[1] * w[0] - z[0] * w[1]) / d];
};

/** 範囲の広い座標平面を、幅・高さ 300px 前後におさめてかく（目もりと方眼は 5 や 10 ごと） */
function planeFit(o) {
  const w = o.x[1] - o.x[0];
  const h = o.y[1] - o.y[0];
  const cell = Math.max(5, Math.min(26, Math.floor(300 / Math.max(w, h))));
  const tick = cell >= 18 ? 1 : cell >= 9 ? 5 : 10;
  return coordPlane({ ...o, cell, tick, grid: tick });
}
/** 符号つきの項（+3x、−x など。係数 0 なら空） */
const term = (c, v) => (c === 0 ? "" : `${c < 0 ? "-" : "+"}${Math.abs(c) === 1 ? "" : Math.abs(c)}${v}`);
/** 符号つきの定数項（0 なら空） */
const cst = (c) => (c === 0 ? "" : sgn(c));
/** 項を並べた式（先頭の + はとる。すべて空なら 0） */
function sumTex(...parts) {
  const s = parts.join("");
  return s === "" ? "0" : s.startsWith("+") ? s.slice(1) : s;
}
/** a cosθ ＋ b sinθ（v＝"r" なら a r cosθ ＋ b r sinθ） */
const trigLin = (ca, cb, v = "") => sumTex(term(ca, `${v}\\cos\\theta`), term(cb, `${v}\\sin\\theta`));

export default {
  // ── 位置ベクトルと図形 ─────────────────────────────
  vector_pos: [
    t("fields", (r, lv) => {
      const head = `$\\overrightarrow{OA}=${va}$、$\\overrightarrow{OB}=${vb}$ とします。`;
      const fl = (s, t_) => [
        { id: "s", value: s, pre: "$s=$" },
        { id: "t", value: t_, pre: "$t=$" },
      ];
      if (lv === 1) {
        const [m, n] = until(() => [r.int(1, 5), r.int(1, 5)], ([u, v]) => u !== v && gcd(u, v) === 1);
        const s = Q(n, m + n);
        const t_ = Q(m, m + n);
        // 検算：具体的なベクトルで、P が AB を m:n に分けること
        const A = [2.3, -1.1];
        const B = [-0.7, 3.4];
        const Pt = [qnum(s) * A[0] + qnum(t_) * B[0], qnum(s) * A[1] + qnum(t_) * B[1]];
        nearly(Math.hypot(Pt[0] - A[0], Pt[1] - A[1]) / Math.hypot(B[0] - Pt[0], B[1] - Pt[1]), m / n, "内分点の検算", 1e-9);
        return fields({
          q: `${head}線分 AB を $${m}:${n}$ に内分する点 P について、$\\overrightarrow{OP}=s${va}+t${vb}$ と表すとき、$s$、$t$ の値を求めなさい。`,
          fields: fl(s, t_),
          layout: "lines",
          wrongs: [{ values: { s: t_, t: s }, mc: "MC-DIVIDE-RATIO-SWAP" }, { values: { s: Q(m, m + n), t: Q(n, m + n) }, mc: "MC-DIVIDE-RATIO-SWAP" }],
          explain: `$m:n$ に内分する点は $\\dfrac{n${va}+m${vb}}{m+n}$（遠い方の点に、近い方の比をかける）。$\\overrightarrow{OP}=\\dfrac{${comb(n, m)}}{${m + n}}=${comb(s, t_)}$。`,
        });
      }
      if (lv === 2) {
        const [m, n] = until(() => [r.int(1, 5), r.int(1, 5)], ([u, v]) => u !== v && gcd(u, v) === 1);
        const s = Q(-n, m - n);
        const t_ = Q(m, m - n);
        const A = [2.3, -1.1];
        const B = [-0.7, 3.4];
        const Pt = [qnum(s) * A[0] + qnum(t_) * B[0], qnum(s) * A[1] + qnum(t_) * B[1]];
        nearly(Math.hypot(Pt[0] - A[0], Pt[1] - A[1]) / Math.hypot(Pt[0] - B[0], Pt[1] - B[1]), m / n, "外分点の検算", 1e-9);
        return fields({
          q: `${head}線分 AB を $${m}:${n}$ に外分する点 Q について、$\\overrightarrow{OQ}=s${va}+t${vb}$ と表すとき、$s$、$t$ の値を求めなさい。`,
          fields: fl(s, t_),
          layout: "lines",
          wrongs: [{ values: { s: Q(n, m + n), t: Q(m, m + n) }, mc: "MC-DIVIDE-EXTERNAL" }, { values: { s: t_, t: s }, mc: "MC-DIVIDE-RATIO-SWAP" }, { values: { s: neg(s), t: neg(t_) }, mc: "MC-DIVIDE-EXTERNAL" }],
          explain: `$m:n$ に外分する点は、内分の式の $n$ を $-n$ にかえて $\\dfrac{-n${va}+m${vb}}{m-n}$。$\\overrightarrow{OQ}=\\dfrac{${comb(-n, m)}}{${m}-${n}}=${comb(s, t_)}$。`,
        });
      }
      // 内分点 P をさらに O から k:l に内分する点 R
      const [m, n] = until(() => [r.int(1, 4), r.int(1, 4)], ([u, v]) => u !== v && gcd(u, v) === 1);
      const [k, l] = until(() => [r.int(1, 4), r.int(1, 4)], ([u, v]) => gcd(u, v) === 1);
      const f = Q(k, k + l);
      const s = mul(f, Q(n, m + n));
      const t_ = mul(f, Q(m, m + n));
      return fields({
        q: `${head}線分 AB を $${m}:${n}$ に内分する点を P とし、線分 OP を $${k}:${l}$ に内分する点を R とします。$\\overrightarrow{OR}=s${va}+t${vb}$ と表すとき、$s$、$t$ の値を求めなさい。`,
        fields: fl(s, t_),
        layout: "lines",
        wrongs: [{ values: { s: Q(n, m + n), t: Q(m, m + n) }, mc: "MC-DIVIDE-RATIO-SWAP" }, { values: { s: mul(Q(l, k + l), Q(n, m + n)), t: mul(Q(l, k + l), Q(m, m + n)) }, mc: "MC-DIVIDE-RATIO-SWAP" }],
        explain: `$\\overrightarrow{OP}=\\dfrac{${comb(n, m)}}{${m + n}}$。R は OP を $${k}:${l}$ に内分するので $\\overrightarrow{OR}=\\dfrac{${k}}{${k + l}}\\overrightarrow{OP}=${comb(s, t_)}$。`,
      });
    }),
    t(
      "fields",
      (r, lv) => {
        // △OAB で OA 上の点 C、OB 上の点 D。AD と BC の交点 P（a = (1,0), b = (0,1) の座標で有理数のまま解く）
        const pick = () => until(() => [r.int(1, 4), r.int(1, 4)], ([u, v]) => gcd(u, v) === 1 && !(u === 1 && v === 1));
        // 基本：片方は中点（どちらが中点かも入れかえる）。標準以上：両方とも比で分ける
        const midFirst = r.chance(0.5);
        const [m, n] = lv === 1 && midFirst ? [1, 1] : pick();
        const [p, q] = lv === 1 && !midFirst ? [1, 1] : pick();
        const c = Q(m, m + n); // OC = c·a
        const d = Q(p, p + q); // OD = d·b
        // P = A + u(D − A) = (1 − u, u d)、P = B + w(C − B) = (w c, 1 − w)
        // 1 − u = w c、u d = 1 − w → u d = 1 − (1 − u)/c → u (d − 1/c) = 1 − 1/c
        const u = div(sub(1, div(1, c)), sub(d, div(1, c)));
        const s = sub(1, u);
        const t_ = mul(u, d);
        const w = div(s, c);
        assert(eq(t_, sub(1, w)), "交点の検算（2通りの表し方が一致）");
        // 具体的なベクトルでも交点を計算して確かめる
        const A = [3.1, 0.4];
        const B = [0.9, 2.7];
        const C = [qnum(c) * A[0], qnum(c) * A[1]];
        const D = [qnum(d) * B[0], qnum(d) * B[1]];
        const den = (A[0] - D[0]) * (B[1] - C[1]) - (A[1] - D[1]) * (B[0] - C[0]);
        const aa = A[0] * D[1] - A[1] * D[0];
        const bb = B[0] * C[1] - B[1] * C[0];
        const Pt = [(aa * (B[0] - C[0]) - (A[0] - D[0]) * bb) / den, (aa * (B[1] - C[1]) - (A[1] - D[1]) * bb) / den];
        nearly(Pt[0], qnum(s) * A[0] + qnum(t_) * B[0], "交点の数値検算 x", 1e-9);
        nearly(Pt[1], qnum(s) * A[1] + qnum(t_) * B[1], "交点の数値検算 y", 1e-9);
        const cDesc = m === n ? "辺 OA の中点" : `辺 OA を $${m}:${n}$ に内分する点`;
        const dDesc = p === q ? "辺 OB の中点" : `辺 OB を $${p}:${q}$ に内分する点`;
        const head = `△OAB で、$\\overrightarrow{OA}=${va}$、$\\overrightarrow{OB}=${vb}$ とします。${cDesc}を C、${dDesc}を D とし、線分 AD と線分 BC の交点を P とします。`;
        if (lv <= 2) {
          return fields({
            q: `${head}$\\overrightarrow{OP}=s${va}+t${vb}$ と表すとき、$s$、$t$ の値を求めなさい。`,
            fields: [
              { id: "s", value: s, pre: "$s=$" },
              { id: "t", value: t_, pre: "$t=$" },
            ],
            layout: "lines",
            wrongs: [{ values: { s: t_, t: s }, mc: "MC-DIVIDE-RATIO-SWAP" }, { values: { s: mul(c, Q(1, 2)), t: mul(d, Q(1, 2)) }, mc: "MC-VECTOR-INTERSECT" }],
            explain: `P は AD 上にあるので $\\overrightarrow{OP}=(1-u)${va}+${tq(d) === "1" ? "" : tq(d)}u${vb}$、BC 上にもあるので $\\overrightarrow{OP}=${tq(c)}w${va}+(1-w)${vb}$ と2通りに表せます。$${va}$、$${vb}$ は平行でない（1次独立）ので係数を比べて、$1-u=${tq(c)}w$、$${tq(d)}u=1-w$。これを解くと $u=${tq(u)}$ で、$\\overrightarrow{OP}=${comb(s, t_)}$。`,
          });
        }
        // 直線 OP と辺 AB の交点 Q：OQ = OP/(s+t)
        const k = add(s, t_);
        const s2 = div(s, k);
        const t2 = div(t_, k);
        return fields({
          q: `${head}直線 OP と辺 AB の交点を Q とするとき、$\\overrightarrow{OQ}=x${va}+y${vb}$ と表します。$x$、$y$ の値を求めなさい。`,
          fields: [
            { id: "x", value: s2, pre: "$x=$" },
            { id: "y", value: t2, pre: "$y=$" },
          ],
          layout: "lines",
          wrongs: [{ values: { x: s, y: t_ }, mc: "MC-VECTOR-INTERSECT" }, { values: { x: t2, y: s2 }, mc: "MC-DIVIDE-RATIO-SWAP" }],
          explain: `まず $\\overrightarrow{OP}=${comb(s, t_)}$（AD と BC の交点として求める）。Q は直線 OP 上なので $\\overrightarrow{OQ}=k\\overrightarrow{OP}$、また辺 AB 上なので係数の和が $1$。$k(${tq(s)}+${tq(t_)})=1$ より $k=${tq(div(1, k))}$、$\\overrightarrow{OQ}=${comb(s2, t2)}$。`,
        });
      },
      { id: "b" },
    ),
    t(
      "num",
      (r, lv) => {
        // 内積の性質
        const [pa, pb] = until(() => [r.int(1, 5), r.int(1, 5)], ([u, v]) => u * v >= 2);
        const ab = until(() => r.int(-pa * pb + 1, pa * pb - 1), (v) => v !== 0);
        if (lv === 1) {
          const [k, l] = [r.pick([1, 2, 3]), r.pick([1, -1, 2, -2])];
          const ans = k * k * pa * pa + 2 * k * l * ab + l * l * pb * pb;
          // 検算：具体的なベクトルを作って計算
          const th = Math.acos(ab / (pa * pb));
          const A = [pa, 0];
          const B = [pb * Math.cos(th), pb * Math.sin(th)];
          nearly((k * A[0] + l * B[0]) ** 2 + (k * A[1] + l * B[1]) ** 2, ans, "|ka+lb|² の検算", 1e-9);
          const expr = comb(k, l);
          return num({
            q: `$|${va}|=${pa}$、$|${vb}|=${pb}$、$${va}\\cdot${vb}=${ab}$ のとき、$|${expr}|^2$ の値を求めなさい。`,
            ans,
            wrongs: [[k * k * pa * pa + l * l * pb * pb, "MC-SQUARE-CROSS-TERM"], [k * k * pa * pa + k * l * ab + l * l * pb * pb, "MC-SQUARE-CROSS-TERM"], [k * pa * pa + 2 * k * l * ab + l * pb * pb, "MC-VEC-NORM-COEF"]],
            explain: `$|${expr}|^2=(${expr})\\cdot(${expr})=${k * k === 1 ? "" : k * k}|${va}|^2${sgn(2 * k * l)}\\,${va}\\cdot${vb}+${l * l === 1 ? "" : l * l}|${vb}|^2=${k * k * pa * pa}${sgn(2 * k * l * ab)}+${l * l * pb * pb}=${ans}$。`,
          });
        }
        if (lv === 2) {
          const s2 = pa * pa + pb * pb - 2 * ab; // |a − b|²
          const plus = r.chance(0.5);
          const known = plus ? pa * pa + pb * pb + 2 * ab : s2;
          const sq = isqrt(known);
          const knownTex = sq !== null ? `|${plus ? `${va}+${vb}` : `${va}-${vb}`}|=${sq}` : `|${plus ? `${va}+${vb}` : `${va}-${vb}`}|=\\sqrt{${known}}`;
          return num({
            q: `$|${va}|=${pa}$、$|${vb}|=${pb}$、$${knownTex}$ のとき、内積 $${va}\\cdot${vb}$ の値を求めなさい。`,
            ans: ab,
            wrongs: [[-ab, "MC-VECTOR-SIGN"], [2 * ab, "MC-SQUARE-CROSS-TERM"], [known - pa * pa - pb * pb, "MC-SQUARE-CROSS-TERM"]],
            explain: `$${plus ? `|${va}+${vb}|^2=|${va}|^2+2${va}\\cdot${vb}+|${vb}|^2` : `|${va}-${vb}|^2=|${va}|^2-2${va}\\cdot${vb}+|${vb}|^2`}$ に代入すると $${known}=${pa * pa}${plus ? "+" : "-"}2${va}\\cdot${vb}+${pb * pb}$。よって $${va}\\cdot${vb}=${ab}$。`,
          });
        }
        // |a + t b| を最小にする t
        const tStar = Q(-ab, pb * pb);
        const minSq = sub(Q(pa * pa), Q(ab * ab, pb * pb));
        // 検算：t を細かく動かして最小
        let best = Infinity;
        let bestT = 0;
        for (let i = -40000; i <= 40000; i++) {
          const tt = i / 10000;
          const v = pa * pa + 2 * tt * ab + tt * tt * pb * pb;
          if (v < best) [best, bestT] = [v, tt];
        }
        nearly(bestT, qnum(tStar), "最小にする t の検算", 2e-4);
        nearly(best, qnum(minSq), "最小値の検算", 1e-6);
        return num({
          q: `$|${va}|=${pa}$、$|${vb}|=${pb}$、$${va}\\cdot${vb}=${ab}$ です。実数 $t$ を変化させるとき、$|${va}+t${vb}|$ を最小にする $t$ の値を求めなさい。`,
          ans: tStar,
          wrongs: [[Q(ab, pb * pb), "MC-VERTEX-SIGN"], [Q(-ab, pb), "MC-VEC-NORM-COEF"], [Q(-ab, 2 * pb * pb), "MC-SQUARE-CROSS-TERM"]],
          explain: `$|${va}+t${vb}|^2=${pb * pb}t^2${sgn(2 * ab)}t+${pa * pa}$ は $t$ の2次式。平方完成すると、$t=-\\dfrac{${2 * ab}}{2\\times ${pb * pb}}=${tq(tStar)}$ のとき最小（最小値は $\\sqrt{${tq(minSq)}}$）。`,
        });
      },
      { id: "c" },
    ),
  ],

  // ── 空間の座標とベクトル ────────────────────────────
  vector_space: [
    t("num", (r, lv) => {
      const perm = (v) => r.shuffle(v.slice(0, 3)).map((x) => x * r.sign());
      if (lv === 1) {
        const q = r.pick(QUAD);
        const d = perm(q);
        const A = [r.int(-4, 4), r.int(-4, 4), r.int(-4, 4)];
        const B = A.map((x, i) => x + d[i]);
        nearly(Math.hypot(...d), q[3], "距離の検算", 1e-12);
        return num({
          q: `2点 $A${v3(A)}$、$B${v3(B)}$ の間の距離を求めなさい。`,
          ans: q[3],
          wrongs: [
            [q[3] * q[3], "MC-VECTOR-NORM"],
            // z 成分を落とした「平面の距離」（整数になるときだけ誤答として登録）
            ...(isqrt(d[0] * d[0] + d[1] * d[1]) !== null ? [[isqrt(d[0] * d[0] + d[1] * d[1]), "MC-SPACE-COMPONENT"]] : []),
          ],
          explain: `各成分の差は $x$：$${B[0]}-${tp(A[0])}=${d[0]}$、$y$：$${B[1]}-${tp(A[1])}=${d[1]}$、$z$：$${B[2]}-${tp(A[2])}=${d[2]}$。$AB=\\sqrt{${d[0] * d[0]}+${d[1] * d[1]}+${d[2] * d[2]}}=\\sqrt{${q[3] * q[3]}}=${q[3]}$。`,
        });
      }
      if (lv === 2) {
        // cos θ（大きさが整数のベクトルどうし）
        const [u, w] = until(() => [perm(r.pick(QUAD)), perm(r.pick(QUAD))], ([x, y]) => dot3(x, y) !== 0 && Math.abs(dot3(x, y)) < Math.hypot(...x) * Math.hypot(...y) - 1e-9);
        const nu = Math.round(Math.hypot(...u));
        const nw = Math.round(Math.hypot(...w));
        const ans = Q(dot3(u, w), nu * nw);
        nearly(Math.cos(Math.acos(dot3(u, w) / (Math.hypot(...u) * Math.hypot(...w)))), qnum(ans), "cos の検算", 1e-12);
        return num({
          q: `$\\vec{a}=${v3(u)}$、$\\vec{b}=${v3(w)}$ のなす角を $\\theta$ とするとき、$\\cos\\theta$ の値を求めなさい。（分数で答えます）`,
          ans,
          reduced: true,
          wrongs: [[Q(dot3(u, w), nu * nu * nw * nw), "MC-VECTOR-NORM"], [Q(dot3(u, w)), "MC-VECTOR-COS"], [neg(ans), "MC-VECTOR-DOT-SIGN"]],
          explain: `$\\vec a\\cdot\\vec b=${u.map((x, i) => `${tp(x)}\\times${tp(w[i])}`).join("+")}=${dot3(u, w)}$、$|\\vec a|=${nu}$、$|\\vec b|=${nw}$。$\\cos\\theta=\\dfrac{\\vec a\\cdot\\vec b}{|\\vec a||\\vec b|}=\\dfrac{${dot3(u, w)}}{${nu * nw}}${gcd(Math.abs(dot3(u, w)), nu * nw) === 1 ? "" : `=${tq(ans)}`}$。`,
        });
      }
      // 垂直になる t：a ⊥ (b + t c)
      const [a, b, c] = until(() => [perm([r.int(1, 3), r.int(0, 3), r.int(1, 3)]), perm([r.int(0, 4), r.int(1, 4), r.int(0, 4)]), perm([r.int(1, 3), r.int(0, 2), r.int(1, 3)])], ([x, y, z]) => dot3(x, z) !== 0 && dot3(x, y) !== 0);
      const tt = Q(-dot3(a, b), dot3(a, c));
      const vec = b.map((x, i) => add(x, mul(tt, c[i])));
      assert(eq(vec.reduce((s, v, i) => add(s, mul(v, a[i])), Q(0)), Q(0)), "垂直の検算");
      return num({
        q: `$\\vec{a}=${v3(a)}$、$\\vec{b}=${v3(b)}$、$\\vec{c}=${v3(c)}$ とします。$\\vec{a}$ と $\\vec{b}+t\\vec{c}$ が垂直になるような実数 $t$ の値を求めなさい。`,
        ans: tt,
        wrongs: [[neg(tt), "MC-EQ-TRANSPOSE"], [Q(-dot3(a, c), dot3(a, b)), "MC-EQ-DIV"]],
        explain: `$\\vec{a}\\cdot(\\vec b+t\\vec c)=\\vec a\\cdot\\vec b+t\\,\\vec a\\cdot\\vec c=0$。$\\vec a\\cdot\\vec b=${dot3(a, b)}$、$\\vec a\\cdot\\vec c=${dot3(a, c)}$ なので、$${dot3(a, b)}${sgn(dot3(a, c))}t=0$、$t=${tq(tt)}$。`,
      });
    }),
    t(
      "fields",
      (r, lv) => {
        const P = [r.nz(-5, 5), r.nz(-5, 5), r.nz(-5, 5)];
        const fl = (v) => [
          { id: "x", value: v[0], pre: "$($" },
          { id: "y", value: v[1], pre: "$,$" },
          { id: "z", value: v[2], pre: "$,$", post: "$)$" },
        ];
        if (lv === 1) {
          const k = r.pick([
            ["$xy$ 平面", [1, 1, -1]],
            ["$yz$ 平面", [-1, 1, 1]],
            ["$zx$ 平面", [1, -1, 1]],
            ["$x$ 軸", [1, -1, -1]],
            ["$y$ 軸", [-1, 1, -1]],
            ["$z$ 軸", [-1, -1, 1]],
            ["原点", [-1, -1, -1]],
          ]);
          const ans = P.map((x, i) => x * k[1][i]);
          const flipAll = P.map((x) => -x);
          return fields({
            q: `点 $P${v3(P)}$ と、${k[0]}に関して対称な点の座標を求めなさい。`,
            fields: fl(ans),
            wrongs: [{ values: { x: flipAll[0], y: flipAll[1], z: flipAll[2] }, mc: "MC-SPACE-SYMMETRY" }, { values: { x: P[0] * -k[1][0], y: P[1] * -k[1][1], z: P[2] * -k[1][2] }, mc: "MC-SPACE-SYMMETRY" }],
            explain: `${k[0]}に関して対称な点は、${k[0].includes("平面") ? "その平面にふくまれない座標軸の成分だけ" : k[0] === "原点" ? "すべての成分の" : "その軸の成分以外の"}符号が変わります。答えは $${v3(ans)}$。`,
          });
        }
        const Q2 = [r.nz(-5, 5), r.nz(-5, 5), r.nz(-5, 5)];
        const [m, n] = until(() => [r.int(1, 4), r.int(1, 4)], ([u, v]) => u !== v && gcd(u, v) === 1);
        if (lv === 2) {
          const ans = P.map((x, i) => Q(n * x + m * Q2[i], m + n));
          return fields({
            q: `2点 $A${v3(P)}$、$B${v3(Q2)}$ を結ぶ線分 AB を $${m}:${n}$ に内分する点の座標を求めなさい。`,
            fields: fl(ans),
            wrongs: [{ values: { x: Q(m * P[0] + n * Q2[0], m + n), y: Q(m * P[1] + n * Q2[1], m + n), z: Q(m * P[2] + n * Q2[2], m + n) }, mc: "MC-DIVIDE-RATIO-SWAP" }],
            explain: `内分点は $\\dfrac{n\\,A+m\\,B}{m+n}$ を成分ごとに計算します。$x=\\dfrac{${n}\\times${tp(P[0])}+${m}\\times${tp(Q2[0])}}{${m + n}}=${tq(ans[0])}$、同じように $y=${tq(ans[1])}$、$z=${tq(ans[2])}$。`,
          });
        }
        // 2つのベクトルの両方に垂直な (x, y, 1)
        const [a, b] = until(
          () => [[r.int(-3, 3), r.int(-3, 3), r.int(-3, 3)], [r.int(-3, 3), r.int(-3, 3), r.int(-3, 3)]],
          ([u, w]) => u[0] * w[1] - u[1] * w[0] !== 0,
        );
        // a·(x, y, 1) = 0、b·(x, y, 1) = 0 を解く
        const det = a[0] * b[1] - a[1] * b[0];
        const x = Q(-a[2] * b[1] + a[1] * b[2], det);
        const y = Q(-a[0] * b[2] + a[2] * b[0], det);
        const nv = [x, y, Q(1)];
        assert(eq(add(add(mul(a[0], x), mul(a[1], y)), Q(a[2])), Q(0)) && eq(add(add(mul(b[0], x), mul(b[1], y)), Q(b[2])), Q(0)), "垂直ベクトルの検算");
        return fields({
          q: `$\\vec{a}=${v3(a)}$、$\\vec{b}=${v3(b)}$ の両方に垂直なベクトルを $\\vec{n}=(x,\\ y,\\ 1)$ の形で求めなさい。`,
          fields: [
            { id: "x", value: x, pre: "$($" },
            { id: "y", value: y, pre: "$,$", post: "$,\\ 1)$" },
          ],
          wrongs: [{ values: { x: neg(x), y: neg(y) }, mc: "MC-EQ-TRANSPOSE" }, { values: { x: y, y: x }, mc: "MC-COORD-XY-SWAP" }],
          explain: `$\\vec a\\cdot\\vec n=0$ より $${sumTex(term(a[0], "x"), term(a[1], "y"), cst(a[2]))}=0$、$\\vec b\\cdot\\vec n=0$ より $${sumTex(term(b[0], "x"), term(b[1], "y"), cst(b[2]))}=0$。この連立方程式を解いて $x=${tq(x)}$、$y=${tq(y)}$。$\\vec n=\\left(${tq(nv[0])},\\ ${tq(nv[1])},\\ 1\\right)$。`,
        });
      },
      { id: "b" },
    ),
  ],
  // ── 2次曲線（放物線・楕円・双曲線） ──────────────────────
  conic: [
    t("fields", (r, lv) => {
      const pt = (x, y) => [
        { id: "x", value: x, pre: "焦点 $($" },
        { id: "y", value: y, pre: "$,$", post: "$)$" },
      ];
      if (lv === 1) {
        const k = r.pick([1, 2, 3, 4, 5, 6, 8, 10, 12]) * r.sign();
        const p = Q(k, 4);
        const yForm = r.chance(0.5); // y²＝kx（焦点は x 軸上）／x²＝ky（焦点は y 軸上）
        const eqTex = yForm ? `y^2=${cv(k, "x")}` : `x^2=${cv(k, "y")}`;
        // 検算：曲線上の点で「焦点までの距離＝準線までの距離」
        for (const s of [0.6, 1.7, -2.3]) {
          const P = yForm ? [(s * s) / k, s] : [s, (s * s) / k];
          const F = yForm ? [k / 4, 0] : [0, k / 4];
          nearly(Math.hypot(P[0] - F[0], P[1] - F[1]), Math.abs((yForm ? P[0] : P[1]) + k / 4), "放物線の焦点と準線の検算", 1e-9);
        }
        const u = yForm ? "x" : "y"; // 焦点がのる軸
        const form = yForm ? "y^2=4px" : "x^2=4py";
        const focusForm = yForm ? "(p,\\ 0)" : "(0,\\ p)";
        if (r.chance(0.35)) {
          return fields({
            q: `放物線 $${eqTex}$ の準線の方程式を求めなさい。`,
            fields: [{ id: "d", value: neg(p), pre: `$${u}=$` }],
            wrongs: [{ values: { d: p }, mc: "MC-CONIC-DIRECTRIX" }, { values: { d: -k }, mc: "MC-CONIC-PARABOLA-P" }, { values: { d: Q(-k, 2) }, mc: "MC-CONIC-PARABOLA-P" }],
            explain: `$${form}$ の形と見ると $4p=${k}$ なので $p=${tq(p)}$。焦点は $${focusForm}$、準線は $${u}=-p$ なので、$${u}=${tq(neg(p))}$。`,
          });
        }
        const at = (w) => (yForm ? { x: w, y: 0 } : { x: 0, y: w });
        const F = at(p);
        return fields({
          q: `放物線 $${eqTex}$ の焦点の座標を求めなさい。`,
          fields: pt(F.x, F.y),
          wrongs: [
            { values: at(k), mc: "MC-CONIC-PARABOLA-P" },
            { values: at(Q(k, 2)), mc: "MC-CONIC-PARABOLA-P" },
            { values: yForm ? { x: 0, y: p } : { x: p, y: 0 }, mc: "MC-CONIC-AXIS" },
            { values: at(neg(p)), mc: "MC-CONIC-DIRECTRIX" },
          ],
          explain: `$${form}$ の形と見ると $4p=${k}$ なので $p=${tq(p)}$。焦点は $${focusForm}$ なので $${yForm ? `(${tq(p)},\\ 0)` : `(0,\\ ${tq(p)})`}$（準線は $${u}=${tq(neg(p))}$）。`,
        });
      }
      if (lv === 2) {
        // 楕円（a＞b。a²＝b²＋c²）
        const [p0, q0, a] = r.pick(TRIPLES);
        const [b, c] = r.chance(0.5) ? [p0, q0] : [q0, p0];
        const horiz = r.chance(0.5); // 横長（焦点は x 軸上）／縦長（焦点は y 軸上）
        const [X2, Y2] = horiz ? [a * a, b * b] : [b * b, a * a];
        const F = horiz ? [c, 0] : [0, c];
        // 検算：楕円上の点で、2つの焦点からの距離の和＝長軸の長さ 2a
        for (const th of [0.3, 1.1, 2.5, 4]) {
          const P = [Math.sqrt(X2) * Math.cos(th), Math.sqrt(Y2) * Math.sin(th)];
          nearly(Math.hypot(P[0] - F[0], P[1] - F[1]) + Math.hypot(P[0] + F[0], P[1] + F[1]), 2 * a, "楕円の焦点の検算", 1e-9);
        }
        const g = gcd(X2, Y2);
        const expanded = (X2 * Y2) / g <= 2500 && r.chance(0.45); // 分母をはらった形で出す
        const std = `${sqOver("x", X2)}+${sqOver("y", Y2)}=1`;
        const eqTex = expanded ? `${cv(Y2 / g, "x^2")}+${cv(X2 / g, "y^2")}=${(X2 * Y2) / g}` : std;
        const at = (w) => (horiz ? { x: w, y: 0 } : { x: 0, y: w });
        const hyp = isqrt(a * a + b * b);
        return fields({
          q: `楕円 $${eqTex}$ の2つの焦点のうち、$x$ 座標と $y$ 座標がどちらも $0$ 以上である方の座標を求めなさい。`,
          fields: pt(F[0], F[1]),
          wrongs: [
            { values: horiz ? { x: 0, y: c } : { x: c, y: 0 }, mc: "MC-CONIC-AXIS" },
            { values: at(a), mc: "MC-CONIC-VERTEX-FOCUS" },
            { values: at(c * c), mc: "MC-PYTH-NOSQRT" },
            ...(hyp !== null ? [{ values: at(hyp), mc: "MC-CONIC-ELLIPSE-HYPER" }] : []),
          ],
          explain: `${expanded ? `両辺を $${(X2 * Y2) / g}$ でわると $${std}$。` : ""}分母の大きい方（$${a * a}$）が $${horiz ? "x" : "y"}^2$ の方なので${horiz ? "横" : "縦"}長の楕円で、焦点は $${horiz ? "x" : "y"}$ 軸上にあります。楕円では $c=\\sqrt{${a * a}-${b * b}}=\\sqrt{${c * c}}=${c}$（大きい方から小さい方をひく）なので、焦点は $${horiz ? `(\\pm ${c},\\ 0)` : `(0,\\ \\pm ${c})`}$。答えは $${horiz ? `(${c},\\ 0)` : `(0,\\ ${c})`}$。`,
        });
      }
      // 双曲線（c²＝a²＋b²）の焦点と漸近線
      const [p0, q0, c] = r.pick(TRIPLES);
      const [a, b] = r.chance(0.5) ? [p0, q0] : [q0, p0];
      const horiz = r.chance(0.6); // 右辺が 1（焦点は x 軸上）／−1（焦点は y 軸上）
      const eqTex = `${sqOver("x", a * a)}-${sqOver("y", b * b)}=${horiz ? 1 : -1}`;
      const F = horiz ? [c, 0] : [0, c];
      // 検算：双曲線上の点で、2つの焦点からの距離の差が一定（横なら 2a、縦なら 2b）。遠くでは傾き b/a の直線に近づく
      for (const u of [0.4, 1.3, -0.9]) {
        const P = horiz ? [a * Math.cosh(u), b * Math.sinh(u)] : [a * Math.sinh(u), b * Math.cosh(u)];
        nearly(Math.abs(Math.hypot(P[0] - F[0], P[1] - F[1]) - Math.hypot(P[0] + F[0], P[1] + F[1])), 2 * (horiz ? a : b), "双曲線の焦点の検算", 1e-9);
      }
      const far = horiz ? [a * Math.cosh(12), b * Math.sinh(12)] : [a * Math.sinh(12), b * Math.cosh(12)];
      nearly(far[1] / far[0], b / a, "漸近線の検算", 1e-8);
      const m = Q(b, a);
      const at = (w, mm) => (horiz ? { x: w, y: 0, m: mm } : { x: 0, y: w, m: mm });
      const ell = isqrt(Math.abs(a * a - b * b));
      return fields({
        q: `双曲線 $${eqTex}$ について、2つの焦点のうち $x$ 座標と $y$ 座標がどちらも $0$ 以上である方の座標と、漸近線を $y=\\pm mx$（$m>0$）と表すときの $m$ の値を求めなさい。`,
        fields: [...pt(F[0], F[1]), { id: "m", value: m, pre: "$m=$" }],
        wrongs: [
          { values: at(c, Q(a, b)), mc: "MC-CONIC-ASYMPTOTE" },
          { values: horiz ? { x: 0, y: c, m } : { x: c, y: 0, m }, mc: "MC-CONIC-AXIS" },
          { values: at(c * c, m), mc: "MC-PYTH-NOSQRT" },
          ...(ell ? [{ values: at(ell, m), mc: "MC-CONIC-ELLIPSE-HYPER" }] : []),
          { values: at(horiz ? a : b, m), mc: "MC-CONIC-VERTEX-FOCUS" },
        ],
        explain: `右辺が $${horiz ? 1 : -1}$ なので、焦点は $${horiz ? "x" : "y"}$ 軸上にあります。双曲線では $c=\\sqrt{${a * a}+${b * b}}=\\sqrt{${c * c}}=${c}$（楕円とちがって、たし算）。焦点は $${horiz ? `(\\pm ${c},\\ 0)` : `(0,\\ \\pm ${c})`}$ で、答えは $${horiz ? `(${c},\\ 0)` : `(0,\\ ${c})`}$。漸近線は左辺を $0$ とおいた $${sqOver("x", a * a)}-${sqOver("y", b * b)}=0$ より $y=\\pm${tq(m)}x$ なので、$m=${tq(m)}$。`,
      });
    }),
    t(
      "choice",
      (r, lv) => {
        const conicTex = (xd, yd, op, rhs = 1) => `$${sqOver("x", xd)}${op}${sqOver("y", yd)}=${rhs}$`;
        if (lv === 1) {
          // 焦点と準線から放物線の方程式
          const p = r.nz(-5, 5);
          const yForm = r.chance(0.5);
          const u = yForm ? "x" : "y";
          const eqP = (k, onX = yForm) => `$${onX ? `y^2=${cv(k, "x")}` : `x^2=${cv(k, "y")}`}$`;
          for (const s of [0.7, -1.9]) {
            const P = yForm ? [(s * s) / (4 * p), s] : [s, (s * s) / (4 * p)];
            const Fp = yForm ? [p, 0] : [0, p];
            nearly(Math.hypot(P[0] - Fp[0], P[1] - Fp[1]), Math.abs((yForm ? P[0] : P[1]) + p), "放物線の検算", 1e-9);
          }
          return choice({
            q: `焦点が $${yForm ? `(${p},\\ 0)` : `(0,\\ ${p})`}$、準線が $${u}=${-p}$ である放物線の方程式を選びなさい。`,
            correct: eqP(4 * p),
            wrongs: [
              [eqP(p), "MC-CONIC-PARABOLA-P"],
              [eqP(2 * p), "MC-CONIC-PARABOLA-P"],
              [eqP(4 * p, !yForm), "MC-CONIC-AXIS"],
              [eqP(-4 * p), "MC-CONIC-DIRECTRIX"],
            ],
            explain: `放物線上の点 $(x,\\ y)$ は「焦点までの距離＝準線までの距離」なので $${yForm ? `\\sqrt{(x${sgn(-p)})^2+y^2}=|x${sgn(p)}|` : `\\sqrt{x^2+(y${sgn(-p)})^2}=|y${sgn(p)}|`}$。両辺を2乗して整理すると ${eqP(4 * p)}。（焦点 ${yForm ? "$(p,\\ 0)$、準線 $x=-p$ の放物線は $y^2=4px$" : "$(0,\\ p)$、準線 $y=-p$ の放物線は $x^2=4py$"}）`,
          });
        }
        const [p0, q0, h] = r.pick(TRIPLES);
        const horiz = r.chance(0.5);
        const put = (major, minor) => (horiz ? [major, minor] : [minor, major]);
        const fpt = (v) => (horiz ? `(${v},\\ 0)` : `(0,\\ ${v})`);
        const focusPair = (c) => `$F${fpt(c)}$、$F'${fpt(-c)}$`;
        if (lv === 2) {
          // 2焦点からの距離の和が一定 → 楕円
          const a = h;
          const [b, c] = r.chance(0.5) ? [p0, q0] : [q0, p0];
          for (const th of [0.4, 2.2]) {
            const P = horiz ? [a * Math.cos(th), b * Math.sin(th)] : [b * Math.cos(th), a * Math.sin(th)];
            const F = horiz ? [c, 0] : [0, c];
            nearly(Math.hypot(P[0] - F[0], P[1] - F[1]) + Math.hypot(P[0] + F[0], P[1] + F[1]), 2 * a, "楕円の検算", 1e-9);
          }
          return choice({
            q: `2点 ${focusPair(c)} からの距離の和が $${2 * a}$ である点 P の軌跡（楕円）の方程式を選びなさい。`,
            correct: conicTex(...put(a * a, b * b), "+"),
            wrongs: [
              [conicTex(...put(a * a, a * a + c * c), "+"), "MC-CONIC-ELLIPSE-HYPER"],
              [conicTex(...put(a * a, b * b), "-", horiz ? 1 : -1), "MC-CONIC-ELLIPSE-HYPER"],
              [conicTex(...put(4 * a * a, 4 * a * a - c * c), "+"), "MC-CONIC-2A"],
              [conicTex(...put(b * b, a * a), "+"), "MC-CONIC-AXIS"],
            ],
            explain: `距離の和 $2a=${2 * a}$ より $a=${a}$。焦点が $${horiz ? "x" : "y"}$ 軸上の $\\pm ${c}$ にあるので $c=${c}$、楕円では $b^2=a^2-c^2=${a * a}-${c * c}=${b * b}$。${horiz ? "横" : "縦"}長の楕円なので ${conicTex(...put(a * a, b * b), "+")}。`,
          });
        }
        // 2焦点からの距離の差が一定 → 双曲線
        const c = h;
        const [a, b] = r.chance(0.5) ? [p0, q0] : [q0, p0];
        for (const u of [0.5, -1.2]) {
          const P = horiz ? [a * Math.cosh(u), b * Math.sinh(u)] : [b * Math.sinh(u), a * Math.cosh(u)];
          const F = horiz ? [c, 0] : [0, c];
          nearly(Math.abs(Math.hypot(P[0] - F[0], P[1] - F[1]) - Math.hypot(P[0] + F[0], P[1] + F[1])), 2 * a, "双曲線の検算", 1e-9);
        }
        const rhs = horiz ? 1 : -1;
        return choice({
          q: `2点 ${focusPair(c)} からの距離の差が $${2 * a}$ である点 P の軌跡（双曲線）の方程式を選びなさい。`,
          correct: conicTex(...put(a * a, b * b), "-", rhs),
          wrongs: [
            [conicTex(...put(a * a, a * a + c * c), "-", rhs), "MC-CONIC-ELLIPSE-HYPER"],
            [conicTex(...put(a * a, b * b), "+"), "MC-CONIC-ELLIPSE-HYPER"],
            [conicTex(...put(4 * a * a, b * b), "-", rhs), "MC-CONIC-2A"],
            [conicTex(...put(a * a, b * b), "-", -rhs), "MC-CONIC-AXIS"],
          ],
          explain: `距離の差 $2a=${2 * a}$ より $a=${a}$。焦点が $${horiz ? "x" : "y"}$ 軸上の $\\pm ${c}$ にあるので $c=${c}$、双曲線では $b^2=c^2-a^2=${c * c}-${a * a}=${b * b}$。焦点が $${horiz ? "x" : "y"}$ 軸上なので、右辺は $${rhs}$ で ${conicTex(...put(a * a, b * b), "-", rhs)}。`,
        });
      },
      { id: "b" },
    ),
    t(
      "num",
      (r, lv) => {
        if (lv === 1) {
          // 放物線：焦点までの距離＝準線までの距離
          const p = r.int(1, 4);
          const s = r.pick(p >= 3 ? [1, 2] : [1, 2, 3]) * r.sign();
          const P = [p * s * s, 2 * p * s];
          const ans = P[0] + p;
          nearly(Math.hypot(P[0] - p, P[1]), ans, "放物線の焦点までの距離の検算", 1e-12);
          const X = Math.ceil(P[0] + 1);
          const Y = Math.ceil(Math.abs(P[1]) + 1);
          const fig = planeFit({
            x: [-p - 1, X],
            y: [-Y, Y],
            params: [{ x: (tt) => p * tt * tt, y: (tt) => 2 * p * tt, t0: -4, t1: 4 }],
            segments: [[-p, -Y, -p, Y, { dash: "5 4", color: "#888" }], [P[0], P[1], p, 0, { dash: "4 3" }]],
            points: [{ x: p, y: 0, label: "F" }, { x: P[0], y: P[1], label: "P" }],
          });
          return num({
            q: `放物線 $y^2=${4 * p}x$ 上の点 $P(${P[0]},\\ ${P[1]})$ と、この放物線の焦点 F との距離 PF を求めなさい。`,
            ans,
            wrongs: [[P[0], "MC-CONIC-DIRECTRIX"], [P[0] + 4 * p, "MC-CONIC-PARABOLA-P"], ...(P[0] !== p ? [[Math.abs(P[0] - p), "MC-CONIC-DIRECTRIX"]] : [])],
            explain: `$y^2=4px$ の形で $4p=${4 * p}$、$p=${p}$。焦点は $F(${p},\\ 0)$、準線は $x=-${p}$（図の点線）。放物線上の点は「焦点までの距離＝準線までの距離」なので、$PF=${P[0]}-(-${p})=${ans}$。（2点間の距離の公式で計算しても同じ）`,
            fig,
          });
        }
        if (lv === 2) {
          // 楕円：PF＋PF′＝2a
          const [p0, q0, a] = r.pick(TRIPLES.filter((tr) => tr[2] <= 17));
          const [b, c] = r.chance(0.5) ? [p0, q0] : [q0, p0];
          const d = until(() => r.int(a - c + 1, a + c - 1), (v) => v !== a);
          const ans = 2 * a - d;
          // F(c, 0) からの距離が d になる楕円上の点（PF＝a−(c/a)x）
          const px = (a * (a - d)) / c;
          const py = b * Math.sqrt(1 - (px * px) / (a * a));
          nearly(Math.hypot(px - c, py), d, "PF の検算", 1e-9);
          nearly(Math.hypot(px + c, py), ans, "PF′ の検算", 1e-9);
          const fig = planeFit({
            x: [-a - 1, a + 1],
            y: [-b - 1, b + 1],
            params: [{ x: (tt) => a * Math.cos(tt), y: (tt) => b * Math.sin(tt), t0: 0, t1: 2 * Math.PI }],
            segments: [[px, py, c, 0, { dash: "4 3" }], [px, py, -c, 0, { dash: "4 3" }]],
            points: [{ x: c, y: 0, label: "F" }, { x: -c, y: 0, label: "F′" }, { x: px, y: py, label: "P" }],
          });
          return num({
            q: `楕円 $\\dfrac{x^2}{${a * a}}+\\dfrac{y^2}{${b * b}}=1$ の2つの焦点を F、F′ とします（F は $x$ 座標が正の方）。この楕円上の点 P について $PF=${d}$ のとき、$PF'$ の長さを求めなさい。`,
            ans,
            wrongs: [
              ...(a - d > 0 ? [[a - d, "MC-CONIC-2A"]] : []),
              ...(2 * b - d > 0 ? [[2 * b - d, "MC-CONIC-AXIS"]] : []),
              ...(2 * c - d > 0 ? [[2 * c - d, "MC-CONIC-VERTEX-FOCUS"]] : []),
            ],
            explain: `楕円上の点は、2つの焦点からの距離の和が一定で、長軸の長さ $2a$ に等しくなります。$a^2=${a * a}$ より $a=${a}$ なので $PF+PF'=${2 * a}$。よって $PF'=${2 * a}-${d}=${ans}$。`,
            fig,
          });
        }
        // 双曲線：|PF′−PF|＝2a（P は F に近い側の枝）
        const [p0, q0, c] = r.pick(TRIPLES.filter((tr) => tr[2] <= 17));
        const [a, b] = r.chance(0.5) ? [p0, q0] : [q0, p0];
        const d = r.int(c - a + 1, c - a + 8);
        const ans = d + 2 * a;
        // x＞0 の枝では PF＝(c/a)x−a
        const px = (a * (d + a)) / c;
        const py = b * Math.sqrt((px * px) / (a * a) - 1) * (r.chance(0.5) ? 1 : -1);
        nearly(Math.hypot(px - c, py), d, "PF の検算", 1e-9);
        nearly(Math.hypot(px + c, py), ans, "PF′ の検算", 1e-9);
        const X = Math.ceil(Math.max(px, c) + 1);
        const Y = Math.ceil(Math.max(Math.abs(py), b) + 1);
        const U = Math.acosh(X / a) + 0.3;
        const fig = planeFit({
          x: [-X, X],
          y: [-Y, Y],
          params: [
            { x: (tt) => a * Math.cosh(tt), y: (tt) => b * Math.sinh(tt), t0: -U, t1: U },
            { x: (tt) => -a * Math.cosh(tt), y: (tt) => b * Math.sinh(tt), t0: -U, t1: U },
          ],
          segments: [[px, py, c, 0, { dash: "4 3" }], [px, py, -c, 0, { dash: "4 3" }]],
          points: [{ x: c, y: 0, label: "F" }, { x: -c, y: 0, label: "F′" }, { x: px, y: py, label: "P" }],
        });
        return num({
          q: `双曲線 $\\dfrac{x^2}{${a * a}}-\\dfrac{y^2}{${b * b}}=1$ の焦点のうち、$x$ 座標が正の方を F、負の方を F′ とします。この双曲線の $x>0$ の部分にある点 P について $PF=${d}$ のとき、$PF'$ の長さを求めなさい。`,
          ans,
          wrongs: [
            ...(2 * a - d > 0 ? [[2 * a - d, "MC-CONIC-ELLIPSE-HYPER"]] : []),
            [d + a, "MC-CONIC-2A"],
            [d + 2 * c, "MC-CONIC-VERTEX-FOCUS"],
            [d + 2 * b, "MC-CONIC-AXIS"],
          ],
          explain: `双曲線上の点は、2つの焦点からの距離の差（の絶対値）が一定で $2a$ に等しくなります。$a^2=${a * a}$ より $a=${a}$ なので $|PF'-PF|=${2 * a}$。P は $x>0$ の部分（F に近い側）にあるので $PF'>PF$ で、$PF'=${d}+${2 * a}=${ans}$。`,
          fig,
        });
      },
      { id: "c" },
    ),
  ],
  // ── 媒介変数表示と極座標 ──────────────────────────
  param_polar: [
    t("choice", (r, lv) => {
      if (lv === 1) {
        // x＝t＋p、y＝kt²＋q → y＝k(x−p)²＋q
        const k = r.pick([1, 2, -1, 3]);
        const p = r.nz(-4, 4);
        const q = r.int(-5, 5);
        const B = -2 * k * p;
        const C = k * p * p + q;
        const poly = (a2, a1, a0) => `$y=${sumTex(term(a2, "x^2"), term(a1, "x"), cst(a0))}$`;
        for (const tt of [0.4, -1.3, 2.2]) nearly(k * tt * tt + q, k * (tt + p) ** 2 + B * (tt + p) + C, "媒介変数の消去の検算", 1e-9);
        // (x−p)² を x²−p²（p＞0）や x²＋p²（p＜0）とするまちがい
        const sqErr = p > 0 ? ["MC-EXPAND-SQUARE-DIFF", -k * p * p] : ["MC-EXPAND-SQUARE-SUM", k * p * p];
        return choice({
          q: `媒介変数 $t$ を用いて $x=t${sgn(p)}$、$y=${cv(k, "t^2")}${q === 0 ? "" : sgn(q)}$ と表される曲線を、$x$ と $y$ の方程式で表したものを選びなさい。`,
          correct: poly(k, B, C),
          wrongs: [
            [poly(k, 2 * k * p, C), "MC-PARAM-SUBST"],
            [poly(k, 0, q + sqErr[1]), sqErr[0]],
            [poly(k, 0, q), "MC-PARAM-SUBST"],
          ],
          explain: `$x=t${sgn(p)}$ より $t=x${sgn(-p)}$。これを $y$ の式に（かっこごと）代入して $y=${cv(k, `${shifted("x", p)}^2`)}${q === 0 ? "" : sgn(q)}$。展開すると ${poly(k, B, C)}（放物線）。`,
        });
      }
      if (lv === 2) {
        // x＝A cosθ、y＝B sinθ → x²/A²＋y²/B²＝1
        const [A, B] = until(() => [r.int(1, 6), r.int(1, 6)], ([u, v]) => u !== v);
        const swap = r.chance(0.3); // x＝A sinθ、y＝B cosθ でも同じ楕円
        const fx = `${A === 1 ? "" : A}\\${swap ? "sin" : "cos"}\\theta`;
        const fy = `${B === 1 ? "" : B}\\${swap ? "cos" : "sin"}\\theta`;
        for (const th of [0.3, 1.9, 4.4]) {
          const x = A * (swap ? Math.sin(th) : Math.cos(th));
          const y = B * (swap ? Math.cos(th) : Math.sin(th));
          nearly((x * x) / (A * A) + (y * y) / (B * B), 1, "楕円の媒介変数表示の検算", 1e-12);
        }
        const co = (n) => (n === 1 ? "" : n);
        return choice({
          q: `媒介変数 $\\theta$ を用いて $x=${fx}$、$y=${fy}$ と表される曲線の方程式を選びなさい。`,
          correct: `$${sqOver("x", A * A)}+${sqOver("y", B * B)}=1$`,
          wrongs: [
            [`$${sqOver("x", A)}+${sqOver("y", B)}=1$`, "MC-PARAM-PYTH"],
            [`$${sqOver("x", A * A)}-${sqOver("y", B * B)}=1$`, "MC-PARAM-PYTH"],
            [`$${sqOver("x", B * B)}+${sqOver("y", A * A)}=1$`, "MC-PARAM-SUBST"],
            [`$${co(A * A)}x^2+${co(B * B)}y^2=1$`, "MC-PARAM-PYTH"],
          ],
          explain: `$\\${swap ? "sin" : "cos"}\\theta=\\dfrac{x}{${A}}$、$\\${swap ? "cos" : "sin"}\\theta=\\dfrac{y}{${B}}$ を $\\cos^2\\theta+\\sin^2\\theta=1$ に代入すると、$\\left(\\dfrac{x}{${A}}\\right)^2+\\left(\\dfrac{y}{${B}}\\right)^2=1$、つまり $${sqOver("x", A * A)}+${sqOver("y", B * B)}=1$（楕円）。`,
        });
      }
      const kind = r.pick(["shift", "shift", "recip", "sec"]);
      if (kind === "shift") {
        // x＝A cosθ＋p、y＝B sinθ＋q（A＝B なら円）
        let A;
        let B;
        if (r.chance(0.35)) A = B = r.int(2, 5); // 円
        else [A, B] = until(() => [r.int(1, 5), r.int(1, 5)], ([u, v]) => u !== v);
        const [p, q] = [r.nz(-4, 4), r.nz(-4, 4)];
        const fx = `${A === 1 ? "" : A}\\cos\\theta${sgn(p)}`;
        const fy = `${B === 1 ? "" : B}\\sin\\theta${sgn(q)}`;
        for (const th of [0.5, 2.8]) {
          const x = A * Math.cos(th) + p;
          const y = B * Math.sin(th) + q;
          nearly(((x - p) / A) ** 2 + ((y - q) / B) ** 2, 1, "媒介変数表示の検算", 1e-12);
        }
        const X = shifted("x", p);
        const Y = shifted("y", q);
        const Xn = shifted("x", -p);
        const Yn = shifted("y", -q);
        if (A === B) {
          return choice({
            q: `媒介変数 $\\theta$ を用いて $x=${fx}$、$y=${fy}$ と表される曲線の方程式を選びなさい。`,
            correct: `$${X}^2+${Y}^2=${A * A}$`,
            wrongs: [
              [`$${Xn}^2+${Yn}^2=${A * A}$`, "MC-CIRCLE-CENTER-SIGN"],
              [`$${X}^2+${Y}^2=${A}$`, "MC-CIRCLE-R-SQUARED"],
              [`$${X}^2-${Y}^2=${A * A}$`, "MC-PARAM-PYTH"],
              ...(p !== q ? [[`$${shifted("x", q)}^2+${shifted("y", p)}^2=${A * A}$`, "MC-COORD-XY-SWAP"]] : []),
            ],
            explain: `$\\cos\\theta=\\dfrac{x${sgn(-p)}}{${A}}$、$\\sin\\theta=\\dfrac{y${sgn(-q)}}{${A}}$ を $\\cos^2\\theta+\\sin^2\\theta=1$ に代入して分母をはらうと、$${X}^2+${Y}^2=${A * A}$（中心 $(${p},\\ ${q})$、半径 $${A}$ の円）。`,
          });
        }
        return choice({
          q: `媒介変数 $\\theta$ を用いて $x=${fx}$、$y=${fy}$ と表される曲線の方程式を選びなさい。`,
          correct: `$${sqOver(X, A * A)}+${sqOver(Y, B * B)}=1$`,
          wrongs: [
            [`$${sqOver(Xn, A * A)}+${sqOver(Yn, B * B)}=1$`, "MC-PARAM-SUBST"],
            [`$${sqOver(X, A)}+${sqOver(Y, B)}=1$`, "MC-PARAM-PYTH"],
            [`$${sqOver(X, B * B)}+${sqOver(Y, A * A)}=1$`, "MC-PARAM-SUBST"],
            [`$${sqOver(X, A * A)}-${sqOver(Y, B * B)}=1$`, "MC-PARAM-PYTH"],
          ],
          explain: `$\\cos\\theta=\\dfrac{x${sgn(-p)}}{${A}}$、$\\sin\\theta=\\dfrac{y${sgn(-q)}}{${B}}$ を $\\cos^2\\theta+\\sin^2\\theta=1$ に代入すると $${sqOver(X, A * A)}+${sqOver(Y, B * B)}=1$（中心 $(${p},\\ ${q})$ の楕円）。`,
        });
      }
      if (kind === "recip") {
        // x＝k(t＋1/t)、y＝k(t−1/t) → x²−y²＝4k²
        const k = r.pick([1, 2, 3]);
        const swap = r.chance(0.5);
        const pl = k === 1 ? "t+\\dfrac{1}{t}" : `${k}\\left(t+\\dfrac{1}{t}\\right)`;
        const mi = k === 1 ? "t-\\dfrac{1}{t}" : `${k}\\left(t-\\dfrac{1}{t}\\right)`;
        const [fx, fy] = swap ? [mi, pl] : [pl, mi];
        const K = 4 * k * k;
        for (const tt of [0.7, -2.1, 3.3]) {
          const a = k * (tt + 1 / tt);
          const b = k * (tt - 1 / tt);
          const [x, y] = swap ? [b, a] : [a, b];
          nearly(swap ? y * y - x * x : x * x - y * y, K, "媒介変数の消去の検算", 1e-9);
        }
        const lhs = swap ? "y^2-x^2" : "x^2-y^2";
        return choice({
          q: `媒介変数 $t$（$t\\neq 0$）を用いて $x=${fx}$、$y=${fy}$ と表される曲線の方程式を選びなさい。`,
          correct: `$${lhs}=${K}$`,
          wrongs: [
            [`$x^2+y^2=${K}$`, "MC-PARAM-PYTH"],
            [`$${lhs}=${2 * k * k}$`, "MC-SQUARE-CROSS-TERM"],
            [`$${lhs}=0$`, "MC-SQUARE-CROSS-TERM"],
            [`$${swap ? "x^2-y^2" : "y^2-x^2"}=${K}$`, "MC-PARAM-SUBST"],
          ],
          explain: `$${swap ? "y" : "x"}^2=${k * k === 1 ? "" : k * k}\\left(t^2+2+\\dfrac{1}{t^2}\\right)$、$${swap ? "x" : "y"}^2=${k * k === 1 ? "" : k * k}\\left(t^2-2+\\dfrac{1}{t^2}\\right)$。ひくと $t$ が消えて $${lhs}=${k * k === 1 ? "" : `${k * k}\\times `}4=${K}$（双曲線）。`,
        });
      }
      // x＝A/cosθ、y＝B tanθ → x²/A²−y²/B²＝1（1＋tan²θ＝1/cos²θ）
      const [A, B] = [r.int(1, 5), r.int(1, 5)];
      for (const th of [0.4, 2.0, -1.1]) {
        const x = A / Math.cos(th);
        const y = B * Math.tan(th);
        nearly((x * x) / (A * A) - (y * y) / (B * B), 1, "媒介変数の消去の検算", 1e-9);
      }
      const fx = A === 1 ? "\\dfrac{1}{\\cos\\theta}" : `\\dfrac{${A}}{\\cos\\theta}`;
      const fy = `${B === 1 ? "" : B}\\tan\\theta`;
      return choice({
        q: `媒介変数 $\\theta$ を用いて $x=${fx}$、$y=${fy}$ と表される曲線の方程式を選びなさい。`,
        correct: `$${sqOver("x", A * A)}-${sqOver("y", B * B)}=1$`,
        wrongs: [
          [`$${sqOver("x", A * A)}+${sqOver("y", B * B)}=1$`, "MC-PARAM-PYTH"],
          [`$${sqOver("y", B * B)}-${sqOver("x", A * A)}=1$`, "MC-PARAM-PYTH"],
          [`$${sqOver("x", A * A)}-${sqOver("y", B * B)}=-1$`, "MC-PARAM-PYTH"],
          [`$${sqOver("x", B * B)}-${sqOver("y", A * A)}=1$`, "MC-PARAM-SUBST"],
          ...(A !== 1 || B !== 1 ? [[`$${sqOver("x", A)}-${sqOver("y", B)}=1$`, "MC-PARAM-PYTH"]] : []),
        ],
        explain: `$\\dfrac{1}{\\cos\\theta}=\\dfrac{x}{${A}}$、$\\tan\\theta=\\dfrac{y}{${B}}$。$1+\\tan^2\\theta=\\dfrac{1}{\\cos^2\\theta}$ に代入すると $1+${sqOver("y", B * B)}=${sqOver("x", A * A)}$、つまり $${sqOver("x", A * A)}-${sqOver("y", B * B)}=1$（双曲線）。`,
      });
    }),
    t(
      "choice",
      (r, lv) => {
        if (lv === 1) {
          // 極座標 → 直交座標
          const rr = r.pick([2, 4, 6, 8]);
          const deg = r.pick([30, 45, 60, 120, 135, 150, 210, 225, 240, 300, 315, 330]);
          const { c, s } = trigParts(deg);
          const rf = trigParts(refDeg(deg));
          const P = (x, y, k = rr) => `$${ptTex(rootMul(x, k), rootMul(y, k))}$`;
          const flip = (p) => rootMul(p, -1);
          nearly(rootVal(rootMul(c, rr)), rr * Math.cos(toRad(deg)), "x 座標の検算", 1e-12);
          nearly(rootVal(rootMul(s, rr)), rr * Math.sin(toRad(deg)), "y 座標の検算", 1e-12);
          return choice({
            q: `極座標が $\\left(${rr},\\ ${radTex(Q(deg, 180))}\\right)$ である点を、直交座標で表したものを選びなさい。`,
            correct: P(c, s),
            wrongs: [
              [P(rf.c, rf.s), "MC-ARG-QUADRANT"],
              [P(s, c), "MC-POLAR-XY"],
              [P(c, s, 1), "MC-POLAR-XY"],
              [P(flip(c), s), "MC-ARG-QUADRANT"],
              [P(c, flip(s)), "MC-ARG-QUADRANT"],
            ],
            explain: `$x=r\\cos\\theta=${rr}\\cos${radTex(Q(deg, 180))}=${rr}\\times\\left(${rootTex(c)}\\right)=${rootTex(rootMul(c, rr))}$、$y=r\\sin\\theta=${rr}\\times\\left(${rootTex(s)}\\right)=${rootTex(rootMul(s, rr))}$。点は第${quadrant(deg)}象限にあります。`,
          });
        }
        if (lv === 2) {
          // 直交座標の方程式 → 極方程式（原点を通る円・座標軸に平行な直線）
          const kind = r.pick(["circle", "circle", "line"]);
          if (kind === "circle") {
            const [a, b] = until(() => [r.int(-4, 4), r.int(-4, 4)], ([u, v]) => (u !== 0 || v !== 0) && u !== v);
            const eqXY = `x^2+y^2${term(-2 * a, "x")}${term(-2 * b, "y")}=0`;
            for (const th of [0.3, 1.2, 2.9]) {
              const rr = 2 * a * Math.cos(th) + 2 * b * Math.sin(th);
              const x = rr * Math.cos(th);
              const y = rr * Math.sin(th);
              nearly(x * x + y * y - 2 * a * x - 2 * b * y, 0, "極方程式の検算", 1e-9);
            }
            return choice({
              q: `直交座標の方程式 $${eqXY}$ で表される円を、極方程式で表したものを選びなさい。`,
              correct: `$r=${trigLin(2 * a, 2 * b)}$`,
              wrongs: [
                [`$r=${trigLin(a, b)}$`, "MC-POLAR-CIRCLE-HALF"],
                [`$r=${trigLin(2 * b, 2 * a)}$`, "MC-POLAR-XY"],
                [`$r^2=${trigLin(2 * a, 2 * b)}$`, "MC-POLAR-XY"],
                [`$r=${trigLin(-2 * a, -2 * b)}$`, "MC-CIRCLE-CENTER-SIGN"],
              ],
              explain: `$x^2+y^2=r^2$、$x=r\\cos\\theta$、$y=r\\sin\\theta$ を $x^2+y^2=${sumTex(term(2 * a, "x"), term(2 * b, "y"))}$ に代入すると $r^2=${trigLin(2 * a, 2 * b, "r")}$。両辺を $r$ でわって $r=${trigLin(2 * a, 2 * b)}$（$r=0$ の原点もこの式にふくまれます）。`,
            });
          }
          const k = r.nz(-6, 6);
          const onX = r.chance(0.5); // x＝k か y＝k
          const fn = onX ? "\\cos" : "\\sin";
          const other = onX ? "\\sin" : "\\cos";
          return choice({
            q: `直交座標の方程式 $${onX ? "x" : "y"}=${k}$ で表される直線を、極方程式で表したものを選びなさい。`,
            correct: `$r${fn}\\theta=${k}$`,
            wrongs: [
              [`$r${other}\\theta=${k}$`, "MC-POLAR-XY"],
              [`$r=${k}$`, "MC-POLAR-XY"],
              [`$${fn}\\theta=${k}$`, "MC-POLAR-XY"],
              [`$\\theta=${k}$`],
            ],
            explain: `$${onX ? "x=r\\cos\\theta" : "y=r\\sin\\theta"}$ なので、$${onX ? "x" : "y"}=${k}$ は $r${fn}\\theta=${k}$。（$r=${k}$ は原点を中心とする円、$\\theta=$ 一定は原点を通る直線を表します）`,
          });
        }
        // 極方程式 r＝2a cosθ＋2b sinθ の表す円
        const [a0, b0, h] = r.pick([[3, 4, 5], [4, 3, 5], [0, 2, 2], [2, 0, 2], [0, 3, 3], [3, 0, 3], [6, 8, 10], [8, 6, 10], [5, 12, 13], [12, 5, 13], [1, 0, 1], [0, 4, 4]]);
        const a = a0 * r.sign();
        const b = b0 * r.sign();
        for (const th of [0.6, 2.4]) {
          const rr = 2 * a * Math.cos(th) + 2 * b * Math.sin(th);
          nearly((rr * Math.cos(th) - a) ** 2 + (rr * Math.sin(th) - b) ** 2, h * h, "極方程式の円の検算", 1e-9);
        }
        const lab = (x, y, rad) => `中心 $(${x},\\ ${y})$、半径 $${rad}$ の円`;
        return choice({
          q: `極方程式 $r=${trigLin(2 * a, 2 * b)}$ はどのような図形を表しますか。`,
          correct: lab(a, b, h),
          wrongs: [
            [lab(2 * a, 2 * b, 2 * h), "MC-POLAR-CIRCLE-HALF"],
            ...(a !== b ? [[lab(b, a, h), "MC-COORD-XY-SWAP"]] : []),
            ...(h !== 1 ? [[lab(a, b, h * h), "MC-CIRCLE-R-SQUARED"]] : []),
            [lab(-a, -b, h), "MC-CIRCLE-CENTER-SIGN"],
          ],
          explain: `両辺に $r$ をかけると $r^2=${trigLin(2 * a, 2 * b, "r")}$。$r^2=x^2+y^2$、$r\\cos\\theta=x$、$r\\sin\\theta=y$ より $x^2+y^2=${sumTex(term(2 * a, "x"), term(2 * b, "y"))}$。平方完成すると $${shifted("x", a)}^2+${shifted("y", b)}^2=${h * h}$ なので、${lab(a, b, h)}。`,
        });
      },
      { id: "b" },
    ),
    t(
      "fields",
      (r, lv) => {
        if (lv === 1) {
          // 直交座標 → 極座標
          const rr = r.pick([2, 4, 6, 8]);
          const deg = r.pick([30, 45, 60, 120, 135, 150, 210, 225, 240, 300, 315, 330]);
          const { c, s } = trigParts(deg);
          const X = rootMul(c, rr);
          const Y = rootMul(s, rr);
          nearly(Math.hypot(rootVal(X), rootVal(Y)), rr, "r の検算", 1e-12);
          const th = Q(deg, 180);
          return fields({
            q: `直交座標が $${ptTex(X, Y)}$ である点を極座標 $(r,\\ \\theta)$ で表しなさい。ただし $r>0$、$0\\le\\theta<2\\pi$ とし、$\\theta$ は $\\pi$ の何倍かを答えます。`,
            fields: [
              { id: "r", value: rr, pre: "$r=$" },
              { id: "th", value: th, pre: "$\\theta=$", post: "$\\pi$" },
            ],
            layout: "lines",
            wrongs: [
              { values: { r: rr, th: Q(refDeg(deg), 180) }, mc: "MC-ARG-QUADRANT" },
              { values: { r: rr * rr, th }, mc: "MC-PYTH-NOSQRT" },
              ...(deg > 180 ? [{ values: { r: rr, th: Q(deg - 360, 180) }, mc: "MC-ARG-RANGE" }] : []),
              { values: { r: rr, th: Q(mod360(90 - deg), 180) }, mc: "MC-POLAR-XY" },
            ],
            explain: `$r=\\sqrt{x^2+y^2}=\\sqrt{${tq(rootSq(X))}+${tq(rootSq(Y))}}=${rr}$。$\\cos\\theta=\\dfrac{x}{r}=${rootTex(c)}$、$\\sin\\theta=\\dfrac{y}{r}=${rootTex(s)}$ で、点は第${quadrant(deg)}象限にあるので $\\theta=${radTex(th)}$。`,
          });
        }
        // 極座標の2点（と原点）
        const pairs =
          lv === 2
            ? [[3, 8, 60, 7], [5, 8, 60, 7], [7, 15, 60, 13], [8, 15, 60, 13], [3, 5, 120, 7], [7, 8, 120, 13], [5, 16, 120, 19], [3, 4, 90, 5], [6, 8, 90, 10], [5, 12, 90, 13]]
            : [[2, 6, 30], [4, 5, 30], [3, 8, 150], [6, 7, 150], [4, 9, 90], [5, 6, 90], [2, 9, 30], [8, 3, 150]];
        const [r1, r2, gap, dd] = r.pick(pairs);
        const swap = r.chance(0.5);
        const [s1, s2] = swap ? [r2, r1] : [r1, r2];
        const d1 = r.pick([0, 30, 60, 90, 120, 150, 180, 210, 240, 270]);
        const d2 = mod360(d1 + gap * (r.chance(0.5) ? 1 : -1));
        const P = [s1 * Math.cos(toRad(d1)), s1 * Math.sin(toRad(d1))];
        const R = [s2 * Math.cos(toRad(d2)), s2 * Math.sin(toRad(d2))];
        const head = `極座標で表された2点 $P\\left(${s1},\\ ${radTex(Q(d1, 180))}\\right)$、$Q\\left(${s2},\\ ${radTex(Q(d2, 180))}\\right)$ があります。`;
        const gapTex = radTex(Q(gap, 180));
        // 偏角の差が π をこえるときは、2π からひいた方が ∠POQ
        const raw = Math.abs(d1 - d2);
        const gapNote = raw > 180 ? `偏角の差は $${radTex(Q(raw, 180))}$ で $\\pi$ より大きいので、$2\\pi$ からひいて` : "偏角の差";
        if (lv === 2) {
          nearly(Math.hypot(P[0] - R[0], P[1] - R[1]), dd, "2点間の距離の検算", 1e-9);
          const other = gap === 90 ? null : isqrt(s1 * s1 + s2 * s2 + (gap === 60 ? 1 : -1) * s1 * s2);
          const cosT = gap === 60 ? "\\dfrac{1}{2}" : gap === 120 ? "\\left(-\\dfrac{1}{2}\\right)" : "0";
          return fields({
            q: `${head}線分 PQ の長さを求めなさい。`,
            fields: [{ id: "d", value: dd, pre: "$PQ=$" }],
            wrongs: [{ values: { d: dd * dd }, mc: "MC-LAW-COS-SQUARE" }, ...(other ? [{ values: { d: other }, mc: "MC-LAW-COS-SIGN" }] : [])],
            explain: `$\\angle POQ=${gapTex}$（${gapNote}）。△OPQ で余弦定理を使うと $PQ^2=${s1}^2+${s2}^2-2\\times ${s1}\\times ${s2}\\times ${cosT}=${dd * dd}$。よって $PQ=${dd}$。`,
          });
        }
        const area = Q(s1 * s2 * (gap === 90 ? 2 : 1), 4);
        nearly(Math.abs(P[0] * R[1] - P[1] * R[0]) / 2, qnum(area), "三角形の面積の検算", 1e-9);
        const sinT = gap === 90 ? "1" : "\\dfrac{1}{2}";
        return fields({
          q: `${head}原点 O と P、Q を頂点とする △OPQ の面積を求めなさい。`,
          fields: [{ id: "S", value: area, pre: "面積 $=$" }],
          wrongs: [{ values: { S: mul(area, 2) }, mc: "MC-AREA-TRIG-HALF" }],
          explain: `$OP=${s1}$、$OQ=${s2}$、$\\angle POQ=${gapTex}$（${gapNote}）。面積は $\\dfrac{1}{2}\\times ${s1}\\times ${s2}\\times\\sin${gapTex}=\\dfrac{1}{2}\\times ${s1 * s2}\\times ${sinT}=${tq(area)}$。`,
        });
      },
      { id: "c" },
    ),
  ],
  // ── 複素数平面 ─────────────────────────────────
  complex_plane: [
    t("fields", (r, lv) => {
      const polar = (mod, th) => [
        { id: "r", value: mod, pre: "絶対値 $r=$" },
        { id: "th", value: th, pre: "偏角 $\\theta=$", post: "$\\pi$" },
      ];
      if (lv === 1) {
        // a＋bi → 極形式
        const rr = r.pick([2, 4, 6, 8]);
        const deg = r.pick([30, 45, 60, 120, 135, 150, 210, 225, 240, 300, 315, 330]);
        const { c, s } = trigParts(deg);
        const X = rootMul(c, rr);
        const Y = rootMul(s, rr);
        nearly(Math.hypot(rootVal(X), rootVal(Y)), rr, "絶対値の検算", 1e-12);
        const th = Q(deg, 180);
        return fields({
          q: `複素数 $z=${cRootTex(X, Y)}$ を極形式 $z=r(\\cos\\theta+i\\sin\\theta)$ で表しなさい。ただし $r>0$、$0\\le\\theta<2\\pi$ とし、$\\theta$ は $\\pi$ の何倍かを答えます。`,
          fields: polar(rr, th),
          layout: "lines",
          wrongs: [
            { values: { r: rr, th: Q(refDeg(deg), 180) }, mc: "MC-ARG-QUADRANT" },
            { values: { r: rr * rr, th }, mc: "MC-COMPLEX-MODULUS" },
            ...(deg > 180 ? [{ values: { r: rr, th: Q(deg - 360, 180) }, mc: "MC-ARG-RANGE" }] : []),
          ],
          explain: `$r=|z|=\\sqrt{${tq(rootSq(X))}+${tq(rootSq(Y))}}=${rr}$。$z=${rr}\\left(${rootTex(c)}${rootVal(s) < 0 ? "-" : "+"}${rootTex(rootMul(s, rootVal(s) < 0 ? -1 : 1))}\\,i\\right)$ なので、$\\cos\\theta=${rootTex(c)}$、$\\sin\\theta=${rootTex(s)}$。点は第${quadrant(deg)}象限にあるので $\\theta=${radTex(th)}$。`,
        });
      }
      if (lv === 2) {
        // 極形式どうしの積・商：絶対値はかける（わる）、偏角はたす（ひく）
        const ARGS = [30, 45, 60, 90, 120, 135, 150, 180, 210, 240, 270, 300, 330];
        const [a1, a2] = until(() => [r.pick(ARGS), r.pick(ARGS)], ([u, v]) => u !== v);
        const [r1, r2] = [r.int(2, 6), r.int(2, 5)];
        const isDiv = r.chance(0.45);
        const mod = isDiv ? Q(r1, r2) : Q(r1 * r2);
        const argDeg = mod360(isDiv ? a1 - a2 : a1 + a2);
        const z1 = [r1 * Math.cos(toRad(a1)), r1 * Math.sin(toRad(a1))];
        const z2 = [r2 * Math.cos(toRad(a2)), r2 * Math.sin(toRad(a2))];
        const w = isDiv ? cdivF(z1, z2) : cmulF(z1, z2);
        nearly(w[0], qnum(mod) * Math.cos(toRad(argDeg)), "積・商の検算（実部）", 1e-9);
        nearly(w[1], qnum(mod) * Math.sin(toRad(argDeg)), "積・商の検算（虚部）", 1e-9);
        const pf = (rr, d) => `${rr}\\left(\\cos${radTex(Q(d, 180))}+i\\sin${radTex(Q(d, 180))}\\right)`;
        const wrongs = isDiv
          ? [
              { values: { r: Q(r2, r1), th: Q(mod360(a2 - a1), 180) }, mc: "MC-CPOLAR-ARG-ORDER" },
              ...(r1 - r2 > 0 ? [{ values: { r: r1 - r2, th: Q(argDeg, 180) }, mc: "MC-CPOLAR-RULE" }] : []),
              { values: { r: mod, th: Q(mod360(a1 + a2), 180) }, mc: "MC-CPOLAR-RULE" },
            ]
          : [
              { values: { r: r1 + r2, th: Q(argDeg, 180) }, mc: "MC-CPOLAR-RULE" },
              { values: { r: mod, th: Q(mod360(a1 - a2), 180) }, mc: "MC-CPOLAR-RULE" },
              ...(a1 + a2 >= 360 ? [{ values: { r: mod, th: Q(a1 + a2, 180) }, mc: "MC-ARG-RANGE" }] : []),
            ];
        return fields({
          q: `$z_1=${pf(r1, a1)}$、$z_2=${pf(r2, a2)}$ のとき、$${isDiv ? "\\dfrac{z_1}{z_2}" : "z_1z_2"}$ を極形式 $r(\\cos\\theta+i\\sin\\theta)$ で表しなさい。ただし $0\\le\\theta<2\\pi$ とし、$\\theta$ は $\\pi$ の何倍かを答えます。`,
          fields: polar(mod, Q(argDeg, 180)),
          layout: "lines",
          wrongs,
          explain: isDiv
            ? `商の絶対値は絶対値の商、偏角は偏角の差です。$r=\\dfrac{${r1}}{${r2}}${mod.d === 1 ? `=${tq(mod)}` : ""}$、$\\theta=${radTex(Q(a1, 180))}-${radTex(Q(a2, 180))}${a1 - a2 < 0 ? "+2\\pi" : ""}=${radTex(Q(argDeg, 180))}$。`
            : `積の絶対値は絶対値の積、偏角は偏角の和です。$r=${r1}\\times ${r2}=${r1 * r2}$、$\\theta=${radTex(Q(a1, 180))}+${radTex(Q(a2, 180))}${a1 + a2 >= 360 ? `-2\\pi` : ""}=${radTex(Q(argDeg, 180))}$。`,
        });
      }
      // ド・モアブルの定理：(a＋bi)ⁿ
      const BASES = [
        { tex: "1+i", r2: 2, deg: 45 },
        { tex: "1-i", r2: 2, deg: 315 },
        { tex: "-1+i", r2: 2, deg: 135 },
        { tex: "-1-i", r2: 2, deg: 225 },
        { tex: "1+\\sqrt{3}\\,i", r2: 4, deg: 60 },
        { tex: "1-\\sqrt{3}\\,i", r2: 4, deg: 300 },
        { tex: "-1+\\sqrt{3}\\,i", r2: 4, deg: 120 },
        { tex: "\\sqrt{3}+i", r2: 4, deg: 30 },
        { tex: "\\sqrt{3}-i", r2: 4, deg: 330 },
        { tex: "-\\sqrt{3}+i", r2: 4, deg: 150 },
      ];
      const B = r.pick(BASES);
      const n = B.r2 === 2 ? r.pick([2, 4, 6, 8, 10]) : r.pick([3, 6, 9]);
      const R = B.r2 === 2 ? 2 ** (n / 2) : 2 ** n; // |z|ⁿ
      const nd = mod360(n * B.deg);
      const unit = (d) => [Math.round(Math.cos(toRad(d))), Math.round(Math.sin(toRad(d)))];
      const [ur, ui] = unit(nd);
      // 検算：浮動小数で n 回かける
      const z = [Math.sqrt(B.r2) * Math.cos(toRad(B.deg)), Math.sqrt(B.r2) * Math.sin(toRad(B.deg))];
      let w = [1, 0];
      for (let i = 0; i < n; i++) w = cmulF(w, z);
      nearly(w[0], R * ur, "ド・モアブルの検算（実部）", 1e-9);
      nearly(w[1], R * ui, "ド・モアブルの検算（虚部）", 1e-9);
      const [fr, fi] = unit(mod360(n * refDeg(B.deg)));
      const rTex = B.r2 === 2 ? "\\sqrt{2}" : "2";
      return fields({
        q: `$(${B.tex})^{${n}}$ を計算し、$a+bi$ の形で答えなさい（$a$、$b$ は実数）。`,
        fields: [
          { id: "re", value: R * ur, pre: "実部 $a=$" },
          { id: "im", value: R * ui, pre: "虚部 $b=$" },
        ],
        wrongs: [
          { values: { re: ur, im: ui }, mc: "MC-DEMOIVRE-R" },
          ...(B.r2 === 4 ? [{ values: { re: 2 * n * ur, im: 2 * n * ui }, mc: "MC-DEMOIVRE-R" }] : []),
          { values: { re: R * fr, im: R * fi }, mc: "MC-ARG-QUADRANT" },
        ],
        explain: `$${B.tex}=${rTex}\\left(\\cos${radTex(Q(B.deg, 180))}+i\\sin${radTex(Q(B.deg, 180))}\\right)$。ド・モアブルの定理より、絶対値は $(${rTex})^{${n}}=${R}$、偏角は $${n}\\times${radTex(Q(B.deg, 180))}=${radTex(Q(n * B.deg, 180))}$${n * B.deg >= 360 ? `（$${radTex(Q(nd, 180))}$ と同じ向き）` : ""}。よって $${R}\\left(\\cos${radTex(Q(nd, 180))}+i\\sin${radTex(Q(nd, 180))}\\right)=${cInt(R * ur, R * ui)}$。`,
      });
    }),
    t(
      "fields",
      (r, lv) => {
        const [a, b] = [r.nz(-6, 6), r.nz(-6, 6)];
        const fl = (re, im) => [
          { id: "re", value: re, pre: "実部 $=$" },
          { id: "im", value: im, pre: "虚部 $=$" },
        ];
        const rot = (z, deg, k = 1) => [k * (z[0] * Math.cos(toRad(deg)) - z[1] * Math.sin(toRad(deg))), k * (z[0] * Math.sin(toRad(deg)) + z[1] * Math.cos(toRad(deg)))];
        const check = (got, want, msg) => {
          nearly(got[0], want[0], msg, 1e-9);
          nearly(got[1], want[1], msg, 1e-9);
        };
        if (lv === 1) {
          // 原点のまわりの回転（±π/2、π）
          const deg = r.pick([90, -90, 180]);
          const ans = deg === 90 ? [-b, a] : deg === -90 ? [b, -a] : [-a, -b];
          check(rot([a, b], deg), ans, "回転の検算");
          const angTex = deg === 180 ? "\\pi" : `${deg > 0 ? "" : "-"}\\dfrac{\\pi}{2}`;
          const [mult, polarTex] = {
            90: ["i", "\\cos\\dfrac{\\pi}{2}+i\\sin\\dfrac{\\pi}{2}"],
            [-90]: ["-i", "\\cos\\left(-\\dfrac{\\pi}{2}\\right)+i\\sin\\left(-\\dfrac{\\pi}{2}\\right)"],
            180: ["-1", "\\cos\\pi+i\\sin\\pi"],
          }[deg];
          return fields({
            q: `複素数平面上で、点 $z=${cInt(a, b)}$ を原点を中心として $${angTex}$ だけ回転した点を表す複素数の実部と虚部を答えなさい。`,
            fields: fl(...ans),
            wrongs: [
              ...(deg !== 180 ? [{ values: { re: -ans[0], im: -ans[1] }, mc: "MC-ROT-DIR" }] : []),
              ...(deg === 90 ? [{ values: { re: b, im: a }, mc: "MC-COMPLEX-I2" }] : deg === -90 ? [{ values: { re: -b, im: -a }, mc: "MC-COMPLEX-I2" }] : []),
            ],
            explain: `原点のまわりに $${angTex}$ だけ回転するには、$${polarTex}=${mult}$ をかけます。$${mult === "-1" ? "-" : mult}(${cInt(a, b)})=${cInt(...ans)}$${deg !== 180 ? "（$i^2=-1$ を使う）" : ""}。`,
          });
        }
        if (lv === 2) {
          // 回転と拡大：(p＋qi) をかける
          const M = r.pick([
            { m: [1, 1], desc: "$\\dfrac{\\pi}{4}$ だけ回転し、原点からの距離を $\\sqrt{2}$ 倍", deg: 45, k: Math.SQRT2 },
            { m: [1, -1], desc: "$-\\dfrac{\\pi}{4}$ だけ回転し、原点からの距離を $\\sqrt{2}$ 倍", deg: -45, k: Math.SQRT2 },
            { m: [-1, 1], desc: "$\\dfrac{3}{4}\\pi$ だけ回転し、原点からの距離を $\\sqrt{2}$ 倍", deg: 135, k: Math.SQRT2 },
            { m: [0, 2], desc: "$\\dfrac{\\pi}{2}$ だけ回転し、原点からの距離を $2$ 倍", deg: 90, k: 2 },
            { m: [0, -3], desc: "$-\\dfrac{\\pi}{2}$ だけ回転し、原点からの距離を $3$ 倍", deg: -90, k: 3 },
          ]);
          const [p, q] = M.m;
          const ans = [p * a - q * b, p * b + q * a];
          check(rot([a, b], M.deg, M.k), ans, "回転と拡大の検算");
          return fields({
            q: `複素数平面上で、点 $z=${cInt(a, b)}$ を原点を中心として ${M.desc}した点を表す複素数の実部と虚部を答えなさい。`,
            fields: fl(...ans),
            wrongs: [
              { values: { re: p * a + q * b, im: p * b - q * a }, mc: "MC-ROT-DIR" },
              { values: { re: p * a + q * b, im: p * b + q * a }, mc: "MC-COMPLEX-I2" },
            ],
            explain: `この移動は $${cInt(p, q)}$ をかけることです（$${cInt(p, q)}$ の絶対値が拡大の倍率、偏角が回転の角）。$(${cInt(p, q)})(${cInt(a, b)})=${cInt(...ans)}$（$i^2=-1$ を使って展開）。`,
          });
        }
        // 原点以外の点のまわりの回転：w − c ＝ (回転) × (z − c)
        const [cx, cy] = until(() => [r.int(-4, 4), r.int(-4, 4)], ([u, v]) => (u !== 0 || v !== 0) && (u !== a || v !== b));
        const deg = r.pick([90, -90, 180]);
        const m = deg === 90 ? [0, 1] : deg === -90 ? [0, -1] : [-1, 0];
        const d = [a - cx, b - cy];
        const md = cmulF(m, d);
        const ans = [cx + md[0], cy + md[1]];
        check([cx + rot(d, deg)[0], cy + rot(d, deg)[1]], ans, "点のまわりの回転の検算");
        const mz = cmulF(m, [a, b]);
        const mTex = deg === 90 ? "i" : deg === -90 ? "-i" : "-1";
        const angTex = deg === 180 ? "\\pi" : `${deg > 0 ? "" : "-"}\\dfrac{\\pi}{2}`;
        return fields({
          q: `複素数平面上で、点 $z=${cInt(a, b)}$ を、点 $c=${cInt(cx, cy)}$ を中心として $${angTex}$ だけ回転した点を $w$ とします。$w$ の実部と虚部を答えなさい。`,
          fields: fl(...ans),
          wrongs: [
            { values: { re: mz[0], im: mz[1] }, mc: "MC-ROT-CENTER" },
            { values: { re: md[0], im: md[1] }, mc: "MC-ROT-CENTER" },
            ...(deg !== 180 ? [{ values: { re: cx - md[0], im: cy - md[1] }, mc: "MC-ROT-DIR" }] : []),
          ],
          explain: `中心 $c$ が原点に来るように平行移動して考えます。$w-c=${mTex === "-1" ? "-" : mTex}(z-c)$。$z-c=${cInt(...d)}$ なので $${mTex === "-1" ? "-" : mTex}(z-c)=${cInt(...md)}$。最後に $c$ をたしてもどすと $w=${cInt(...md)}+(${cInt(cx, cy)})=${cInt(...ans)}$。`,
        });
      },
      { id: "b" },
    ),
    t(
      "num",
      (r, lv) => {
        if (lv === 1) {
          // 2点間の距離 |z₁−z₂|
          const [p0, q0, h] = r.pick(TRIPLES.slice(0, 3));
          const dv = (r.chance(0.5) ? [p0, q0] : [q0, p0]).map((v) => v * r.sign());
          const z2 = [r.int(-5, 5), r.int(-5, 5)];
          const z1 = [z2[0] + dv[0], z2[1] + dv[1]];
          nearly(Math.hypot(z1[0] - z2[0], z1[1] - z2[1]), h, "距離の検算", 1e-12);
          const sumAbs = isqrt((z1[0] + z2[0]) ** 2 + (z1[1] + z2[1]) ** 2);
          return num({
            q: `複素数平面上の2点 $A(${cInt(...z1)})$、$B(${cInt(...z2)})$ の間の距離を求めなさい。`,
            ans: h,
            wrongs: [[h * h, "MC-COMPLEX-MODULUS"], ...(sumAbs !== null ? [[sumAbs, "MC-COMPLEX-SUB-SIGN"]] : [])],
            explain: `2点 $\\alpha$、$\\beta$ の距離は $|\\alpha-\\beta|$。$(${cInt(...z1)})-(${cInt(...z2)})=${cInt(...dv)}$ なので、距離は $\\sqrt{${dv[0] ** 2}+${dv[1] ** 2}}=${h}$。`,
          });
        }
        if (lv === 2) {
          const mk = (tr) => {
            const [u, v] = r.chance(0.5) ? [tr[0], tr[1]] : [tr[1], tr[0]];
            return [u * r.sign(), v * r.sign(), tr[2]];
          };
          if (r.chance(0.5)) {
            // |zⁿ|＝|z|ⁿ
            const [x, y, h] = mk(r.pick(TRIPLES.slice(0, 3)));
            const n = h === 5 ? r.pick([2, 3, 4]) : r.pick([2, 3]);
            let w = [1, 0];
            for (let i = 0; i < n; i++) w = cmulF(w, [x, y]);
            nearly(Math.hypot(...w), h ** n, "|zⁿ| の検算", 1e-9);
            return num({
              q: `$z=${cInt(x, y)}$ のとき、$|z^{${n}}|$ の値を求めなさい。`,
              ans: h ** n,
              wrongs: [[n * h, "MC-DEMOIVRE-R"], [(h * h) ** n, "MC-COMPLEX-MODULUS"], [h, "MC-DEMOIVRE-R"]],
              explain: `$|z^{${n}}|=|z|^{${n}}$（積の絶対値は絶対値の積）。$|z|=\\sqrt{${x * x}+${y * y}}=${h}$ なので、$${h}^{${n}}=${h ** n}$。（$z^{${n}}$ を展開してから絶対値を求めなくてよい）`,
            });
          }
          // |z₁z₂/z₃|＝|z₁||z₂|/|z₃|
          const [z1, z2, z3] = [mk(r.pick(TRIPLES.slice(0, 3))), mk(r.pick(TRIPLES.slice(0, 3))), mk(r.pick(TRIPLES.slice(0, 4)))];
          const ans = Q(z1[2] * z2[2], z3[2]);
          const w = cdivF(cmulF(z1, z2), z3);
          nearly(Math.hypot(...w), qnum(ans), "|z₁z₂/z₃| の検算", 1e-9);
          return num({
            q: `$z_1=${cInt(z1[0], z1[1])}$、$z_2=${cInt(z2[0], z2[1])}$、$z_3=${cInt(z3[0], z3[1])}$ のとき、$\\left|\\dfrac{z_1z_2}{z_3}\\right|$ の値を求めなさい。`,
            ans,
            wrongs: [[z1[2] + z2[2] - z3[2], "MC-CPOLAR-RULE"], [Q(z1[2] * z1[2] * z2[2] * z2[2], z3[2] * z3[2]), "MC-COMPLEX-MODULUS"]],
            explain: `$\\left|\\dfrac{z_1z_2}{z_3}\\right|=\\dfrac{|z_1||z_2|}{|z_3|}$。$|z_1|=${z1[2]}$、$|z_2|=${z2[2]}$、$|z_3|=${z3[2]}$ なので $\\dfrac{${z1[2]}\\times ${z2[2]}}{${z3[2]}}=${tq(ans)}$。（先に計算してから絶対値を求めるより、ずっと楽）`,
          });
        }
        // 円 |z−α|＝k 上の点 z の |z| の最大・最小
        const [p0, q0, h] = r.pick(TRIPLES.slice(0, 4));
        const [x, y] = (r.chance(0.5) ? [p0, q0] : [q0, p0]).map((v) => v * r.sign());
        const k = until(() => r.int(1, h + 4), (v) => v !== h);
        const askMax = r.chance(0.5);
        const ans = askMax ? h + k : Math.abs(h - k);
        // 検算：中心の向き φ₀ の両はしで最大・最小になり、円周上のほかの点はその間にある
        const ph0 = Math.atan2(y, x);
        nearly(Math.hypot(x + k * Math.cos(ph0), y + k * Math.sin(ph0)), h + k, "最大値の検算", 1e-12);
        nearly(Math.hypot(x - k * Math.cos(ph0), y - k * Math.sin(ph0)), Math.abs(h - k), "最小値の検算", 1e-12);
        for (let i = 0; i < 720; i++) {
          const ph = (i / 720) * 2 * Math.PI;
          const v = Math.hypot(x + k * Math.cos(ph), y + k * Math.sin(ph));
          assert(v <= h + k + 1e-9 && v >= Math.abs(h - k) - 1e-9, "最大・最小の検算（円周上）");
        }
        return num({
          q: `複素数 $z$ が $|z-(${cInt(x, y)})|=${k}$ を満たしながら動くとき、$|z|$ の${askMax ? "最大値" : "最小値"}を求めなさい。`,
          ans,
          wrongs: askMax ? [[k, "MC-CPLANE-MAXMIN"], [h, "MC-CPLANE-MAXMIN"], [Math.abs(h - k), "MC-CPLANE-MAXMIN"]] : [[h + k, "MC-CPLANE-MAXMIN"], [h - k, "MC-CPLANE-MAXMIN"], [k, "MC-CPLANE-MAXMIN"]],
          explain: `点 $z$ は、中心 $${cInt(x, y)}$、半径 $${k}$ の円の上を動きます。原点と中心の距離は $\\sqrt{${x * x}+${y * y}}=${h}$。$|z|$（原点からの距離）は、${askMax ? `中心の向こう側で最大になり、$${h}+${k}=${ans}$` : h > k ? `原点に近い側で最小になり、$${h}-${k}=${ans}$` : `原点が円の内側にあるので、$${k}-${h}=${ans}$`}。`,
        });
      },
      { id: "c" },
    ),
  ],
};
