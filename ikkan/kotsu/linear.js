// ============================================================
// linear.js — 一次関数の問題用の道具：直線 y＝ax+b・変化の割合・2点を通る直線・交点・変域・面積を「計算で」出す
//
//  問題を書くとき、直線の式・傾き・切片・交点・y の変域・面積の答えを手で書かない。点や傾きから直線をつくって、ここの関数で計算し、
//  ltex・ptex2 で TeX にする。数は、有理数 Q（algebra.js の [分子, 分母]。約分済み・分母は正）。整数は、そのまま渡してよい。
//  図（座標平面）は、コツコツくんの問題文には出せないので、「点 A(1, 3) と B(2, 5) を通る直線」のように、点の座標を文で言う。
// ============================================================
import { Q, qadd, qsub, qmul, qdiv, qneg, qiszero, qeq, qisint, qval, qtex } from "./algebra.js";

const q = (x) => (Array.isArray(x) ? Q(x[0], x[1]) : Q(x));

/** 直線 y＝ax+b。a（傾き）・b（切片）は、整数か Q */
export const line = (a, b = 0) => ({ a: q(a), b: q(b) });
/** 傾き a と通る点 (x0, y0) から、直線 */
export const lineSlopePoint = (a, [x0, y0]) => { const A = q(a); return { a: A, b: qsub(q(y0), qmul(A, q(x0))) }; };
/** 2点 (x1, y1)・(x2, y2) を通る直線。x1＝x2 なら null（y 軸に平行） */
export const lineThrough = ([x1, y1], [x2, y2]) => {
  const dx = qsub(q(x2), q(x1));
  if (qiszero(dx)) return null;
  const a = qdiv(qsub(q(y2), q(y1)), dx);
  return { a, b: qsub(q(y1), qmul(a, q(x1))) };
};
/** ax+by＝c（2元1次方程式）を、y について解いた直線 y＝(−a/b)x+(c/b)。b＝0 なら null */
export const fromStd = (a, b, c) => (b === 0 ? null : { a: Q(-a, b), b: Q(c, b) });

/** x のときの y（Q） */
export const yAt = (l, x) => qadd(qmul(l.a, q(x)), l.b);
/** y のときの x（Q）。傾き 0 なら null */
export const xAt = (l, y) => (qiszero(l.a) ? null : qdiv(qsub(q(y), l.b), l.a));
/** 変化の割合（＝傾き）。x が x1 から x2 まで増加するときの、y の増加量 ÷ x の増加量（Q） */
export const rate = (l, x1, x2) => qdiv(qsub(yAt(l, x2), yAt(l, x1)), qsub(q(x2), q(x1)));
/** y の増加量（x が x1 から x2 まで増加するとき） */
export const dy = (l, x1, x2) => qsub(yAt(l, x2), yAt(l, x1));
/** x の変域 [x1, x2] のときの y の変域 [最小, 最大]（Q） */
export const yRange = (l, x1, x2) => { const u = yAt(l, x1), v = yAt(l, x2); return qval(u) <= qval(v) ? [u, v] : [v, u]; };
/** 2直線の交点 [x, y]（Q）。傾きが同じなら null */
export const meet = (l1, l2) => {
  if (qeq(l1.a, l2.a)) return null;
  const x = qdiv(qsub(l2.b, l1.b), qsub(l1.a, l2.a));
  return [x, yAt(l1, x)];
};
/** 軸との交点：y 軸（切片）[0, b]、x 軸 [x, 0]（傾き 0 なら null） */
export const xIntercept = (l) => (qiszero(l.a) ? null : [qneg(qdiv(l.b, l.a)), Q(0)]);
/** 3点 (x, y) が作る三角形の面積（Q） */
export const triArea = ([x1, y1], [x2, y2], [x3, y3]) => {
  const t = qadd(qadd(qmul(q(x1), qsub(q(y2), q(y3))), qmul(q(x2), qsub(q(y3), q(y1)))), qmul(q(x3), qsub(q(y1), q(y2))));
  const h = qmul(t, Q(1, 2));
  return qval(h) < 0 ? qneg(h) : h;
};
/** 点 (x, y) が直線の上にあるか */
export const onLine = (l, [x, y]) => qeq(yAt(l, x), q(y));
/** 2直線が、傾きが同じ（平行）か */
export const parallel = (l1, l2) => qeq(l1.a, l2.a);
/** 傾き・切片が、ともに整数か（整数の格子点を通る直線にしたいとき） */
export const isIntLine = (l) => qisint(l.a) && qisint(l.b);

// ── TeX ──────────────────────────────────────────────────
/** Q を TeX に（整数・分数）。符号つき */
export const qt = (x) => qtex(q(x));
/** 直線の TeX：y=2x+3、y=-\frac{1}{2}x-1、y=x、y=-x、y=3（傾き 0）、y=2x（切片 0） */
export const ltex = (l) => {
  const [an, ad] = l.a, [bn, bd] = l.b;
  let s = "y=";
  if (an !== 0) {
    const abs = Math.abs(an);
    const coef = ad === 1 ? (abs === 1 ? "" : String(abs)) : `\\frac{${abs}}{${ad}}`;
    s += `${an < 0 ? "-" : ""}${coef}x`;
  }
  if (bn !== 0 || an === 0) {
    const abs = Math.abs(bn), v = bd === 1 ? String(abs) : `\\frac{${abs}}{${bd}}`;
    s += an === 0 ? `${bn < 0 ? "-" : ""}${v}` : `${bn < 0 ? "-" : "+"}${v}`;
  }
  return s;
};
/** 点の TeX：(2, 5)、(\frac{1}{2}, -3)。名前つきは A(2, 5) */
export const ptex2 = ([x, y], name = "") => `${name}(${qt(x)}, ${qt(y)})`;
/** 答えに使う数値（整数か、約分済みの分数文字列）。kit.js の fracAns と同じ約束 */
export const num = (x) => { const [n, d] = q(x); return d === 1 ? n : `${n}/${d}`; };
/** 整数か（点が格子点か） */
export const isInt = (x) => qisint(q(x));
