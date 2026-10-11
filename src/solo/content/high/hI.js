// ============================================================
// high/hI.js — 高校 数学I の単元（数学ラボ ソロ）
//  式の展開・因数分解・実数・1次不等式・集合と命題・2次関数・三角比・データの分析
//  答えはすべてプログラムで計算する。√ や式・区間の答えは4択。
// ============================================================
import { t, pick, rnz, sgn, shuffle, sample, gcd, round, reduce, fracAns, fracTex, sqrtSimp, sqrtTex, poly, signed, coefVar, signedVar, choices4, tex } from "../kit.js";

// ── 小さな道具 ─────────────────────────────────────────
/** 多項式の積（係数は高次から） */
const pmul = (A, B) => {
  const o = Array(A.length + B.length - 1).fill(0);
  A.forEach((a, i) => B.forEach((b, j) => { o[i + j] += a * b; }));
  return o;
};
const ppow = (A, n) => { let o = [1]; for (let i = 0; i < n; i++) o = pmul(o, A); return o; };
const pkey = (A) => A.join(",");
/** 0 なら空、それ以外は符号つき（"+3" "-3"） */
const sh = (v) => (v ? signed(v) : "");
/** (x-p)^2（p=0 なら x^2） */
const vx = (p) => (p ? `(x${signed(-p)})^{2}` : "x^{2}");
/** a/b を「約分前=約分後」で（約分できなければ1つだけ） */
const fr = (a, b) => (gcd(a, b) === 1 && b > 0 ? fracTex(a, b) : `\\frac{${a}}{${b}}=${fracTex(a, b)}`);
/** (ax+b) / (ax+by) の TeX */
const lin = (a, b, v = "x", w = "") => `(${coefVar(a, v)}${w ? signedVar(b, w) : b ? signed(b) : ""})`;
/** (v-a)(v-b) の TeX（a か b が 0 なら v(v-…) の形に） */
const fac2 = (a, b, v = "x") => (a === 0 ? `${v}(${v}${sh(-b)})` : b === 0 ? `${v}(${v}${sh(-a)})` : `(${v}${sh(-a)})(${v}${sh(-b)})`);
/** 単項式 c x^p y^q の TeX（係数 ±1 は省略） */
const mono = (c, p, q = 0, vx = "x", vy = "y") => {
  const pw = (v, e) => (e === 0 ? "" : e === 1 ? v : `${v}^{${e}}`);
  const body = pw(vx, p) + pw(vy, q);
  if (!body) return String(c);
  return (c === 1 ? "" : c === -1 ? "-" : String(c)) + body;
};
/** a+b√n の TeX（b≠0、n は平方因数なし） */
const rad = (a, b, n) => {
  const r = sqrtTex(b, n);
  return a === 0 ? r : `${a}${r.startsWith("-") ? "" : "+"}${r}`;
};
/** 実数の部分集合（述語 f）を、整数の端をもつ区間の和として TeX に（lo〜hi の外は端の値と同じとみなす） */
function setTex(f, lo, hi, v = "x") {
  const pts = [];
  for (let k = 2 * lo; k <= 2 * hi; k++) pts.push(k / 2); // 整数と半整数
  const out = [];
  let i = 0;
  const inf0 = f(lo - 1), inf1 = f(hi + 1);
  while (i < pts.length) {
    if (!f(pts[i])) { i++; continue; }
    let j = i;
    while (j + 1 < pts.length && f(pts[j + 1])) j++;
    const L = i === 0 && inf0 ? null : pts[i], R = j === pts.length - 1 && inf1 ? null : pts[j];
    const lc = L !== null && Number.isInteger(L), rc = R !== null && Number.isInteger(R);
    const Lv = lc ? L : L !== null ? L - 0.5 : null, Rv = rc ? R : R !== null ? R + 0.5 : null;
    if (Lv === null && Rv === null) out.push("");
    else if (Lv === null) out.push(`${v}${rc ? "\\leqq" : "<"} ${Rv}`);
    else if (Rv === null) out.push(`${v}${lc ? "\\geqq" : ">"} ${Lv}`);
    else if (Lv === Rv) out.push(`${v}=${Lv}`);
    else out.push(`${Lv}${lc ? "\\leqq" : "<"} ${v}${rc ? "\\leqq" : "<"} ${Rv}`);
    i = j + 1;
  }
  return out;
}
/** 多項式の TeX をかっこで包む */
const par = (c, v = "x") => `(${poly(c, v)})`;
/** 多変数の式 [[係数, "文字"], ...] → TeX */
function mpoly(terms) {
  let s = "";
  for (const [c, m] of terms) {
    if (c === 0) continue;
    const ac = Math.abs(c);
    const body = m === "" ? String(ac) : (ac === 1 ? "" : ac) + m;
    s += s === "" ? (c < 0 ? "-" : "") + body : (c < 0 ? "-" : "+") + body;
  }
  return s || "0";
}
/**
 * 式の4択。ok / wrongs は [TeX, 比較用キー]。キーが正解と同じ（＝同じ式）の誤答は除く。
 * fill(i) も [TeX, キー] を返す。
 */
function ec(r, ok, wrongs, fill = null) {
  const seen = new Set([ok[1]]);
  const ws = [];
  const add = (w) => { if (!w || ws.length >= 3 || seen.has(w[1])) return; seen.add(w[1]); ws.push(w[0]); };
  wrongs.forEach(add);
  for (let i = 0; fill && ws.length < 3 && i < 60; i++) add(fill(i));
  return { ans: ok[0], choices: choices4(r, ok[0], ws) };
}
/** n√s / d を簡単にした TeX（s=1 なら有理数） */
function fsq(n, s = 1, d = 1) {
  if (n === 0) return "0";
  const [k, s2] = sqrtSimp(s);
  const [a, b] = reduce(n * k, d);
  const aa = Math.abs(a);
  const body = s2 === 1 ? String(aa) : `${aa === 1 ? "" : aa}\\sqrt{${s2}}`;
  const sign = a < 0 ? "-" : "";
  return b === 1 ? sign + body : `${sign}\\frac{${body}}{${b}}`;
}
/** 区間の TeX。lo/hi は [値TeX, 等号つきか] または null */
function ivTex(lo, hi, v = "x") {
  const op = (eq) => (eq ? "\\leqq" : "<");
  if (lo && hi) return `${lo[0]}${op(lo[1])} ${v}${op(hi[1])} ${hi[0]}`;
  if (lo) return `${v}${lo[1] ? "\\geqq" : ">"} ${lo[0]}`;
  if (hi) return `${v}${op(hi[1])} ${hi[0]}`;
  return "";
}
const OPS = { "<": "<", ">": ">", "<=": "\\leqq", ">=": "\\geqq" };
const FLIP = { "<": ">", ">": "<", "<=": ">=", ">=": "<=" };
const NS = ["必要十分条件である", "必要条件であるが十分条件ではない", "十分条件であるが必要条件ではない", "必要条件でも十分条件でもない"];
/** p⇒q, q⇒p の真偽から「p は q であるための〜」 */
const nsOf = (pq, qp) => (pq && qp ? NS[0] : qp ? NS[1] : pq ? NS[2] : NS[3]);

// 有名角の三角比 [n, s, d] = n√s/d
const TRIG = {
  sin: { 0: [0, 1, 1], 30: [1, 1, 2], 45: [1, 2, 2], 60: [1, 3, 2], 90: [1, 1, 1], 120: [1, 3, 2], 135: [1, 2, 2], 150: [1, 1, 2], 180: [0, 1, 1] },
  cos: { 0: [1, 1, 1], 30: [1, 3, 2], 45: [1, 2, 2], 60: [1, 1, 2], 90: [0, 1, 1], 120: [-1, 1, 2], 135: [-1, 2, 2], 150: [-1, 3, 2], 180: [-1, 1, 1] },
  tan: { 0: [0, 1, 1], 30: [1, 3, 3], 45: [1, 1, 1], 60: [1, 3, 1], 120: [-1, 3, 1], 135: [-1, 1, 1], 150: [-1, 3, 3], 180: [0, 1, 1] },
};
const ANG = [0, 30, 45, 60, 90, 120, 135, 150, 180];
const tv = (f, A) => fsq(...TRIG[f][A]);
const deg = (A) => `${A}^{\\circ}`;
const TRIPLES = [[3, 4, 5], [4, 3, 5], [5, 12, 13], [12, 5, 13], [8, 15, 17], [15, 8, 17], [7, 24, 25], [20, 21, 29]];
// 2辺と 60°・120° の間の角で、残りの辺も整数になる三角形 [b, c, A, a]
const NICE_TRI = [];
for (let b = 1; b <= 16; b++) for (let c = 1; c <= 16; c++) for (const A of [60, 120]) {
  if (A === 60 && b === c) continue;
  const a2 = b * b + c * c + (A === 60 ? -b * c : b * c), a = Math.round(Math.sqrt(a2));
  if (a * a === a2) NICE_TRI.push([b, c, A, a]);
}
// 3辺と面積が整数の三角形（ヘロンの公式で確認）
const HERON = [[3, 4, 5, 6], [5, 5, 6, 12], [5, 5, 8, 12], [13, 14, 15, 84], [5, 12, 13, 30], [10, 13, 13, 60], [9, 10, 17, 36], [7, 15, 20, 42], [13, 20, 21, 126], [8, 15, 17, 60], [11, 13, 20, 66], [13, 13, 24, 60], [12, 17, 25, 90], [7, 24, 25, 84]]
  .filter(([a, b, c, S]) => (a + b + c) * (-a + b + c) * (a - b + c) * (a + b - c) === 16 * S * S);

/** 点 (x, y)（どちらも0でない）がある象限 */
const QUAD = (x, y) => (x > 0 ? (y > 0 ? "第1象限" : "第4象限") : y > 0 ? "第2象限" : "第3象限");
const H = { grade: "H1", course: "数学I", rikei: false };

export const UNITS = [
  // ─────────────────────────────────────────────────────
  {
    ...H,
    id: "HI-tenkai", area: "num", name: "式の展開", desc: "乗法公式・3項の展開・工夫した展開",
    prereqs: ["J3-g3c1u4"],
    points: [
      "$(a\\pm b)^{2}=a^{2}\\pm 2ab+b^{2}$、$(a+b)(a-b)=a^{2}-b^{2}$、$(ax+b)(cx+d)=acx^{2}+(ad+bc)x+bd$",
      "単項式の積は指数法則 $a^{m}a^{n}=a^{m+n}$、$(a^{m})^{n}=a^{mn}$、$(ab)^{n}=a^{n}b^{n}$ で計算する。",
      "$(a+b+c)^{2}=a^{2}+b^{2}+c^{2}+2ab+2bc+2ca$",
      "共通な部分は1つの文字に置き換える。かける順番の組み合わせを工夫すると計算が楽になる。",
    ],
    levels: {
      1: [
        t("HI-tenkai-1c", (r) => {
          const p = rnz(r, -3, 3), q = rnz(r, -5, 5);
          const mons = ["x^{2}", "y^{2}", "", "xy", "y", "x"];
          const W = (v) => [tex(mpoly(v.map((c, i) => [c, mons[i]]))), v.join(",")];
          const ok = [1, p * p, q * q, 2 * p, 2 * p * q, 2 * q];
          return {
            q: `${tex(`(x${signedVar(p, "y")}${signed(q)})^{2}`)} を展開すると？`,
            ...ec(r, W(ok), [
              W([1, p * p, q * q, 0, 0, 0]),
              W([1, p * p, q * q, p, p * q, q]),
              W([1, p * p, q * q, 2 * p, -2 * p * q, 2 * q]),
              W([1, p * p, q * q, 2 * Math.abs(p), 2 * Math.abs(p * q), 2 * Math.abs(q)]),
            ], (i) => W([1, p * p, q * q, 2 * p, 2 * p * q + 2 * (i + 1), 2 * q])),
            hint: "$(a+b+c)^{2}=a^{2}+b^{2}+c^{2}+2ab+2bc+2ca$ を使う。2つずつの積を2倍するのを忘れずに。",
            steps: [
              `$a=x,\\ b=${coefVar(p, "y")},\\ c=${q}$ として公式に代入`,
              `$x^{2}+(${coefVar(p, "y")})^{2}+(${q})^{2}+2\\cdot x\\cdot (${coefVar(p, "y")})+2\\cdot (${coefVar(p, "y")})\\cdot (${q})+2\\cdot (${q})\\cdot x$`,
              `$=${mpoly([[1, "x^{2}"], [p * p, "y^{2}"], [q * q, ""], [2 * p, "xy"], [2 * p * q, "y"], [2 * q, "x"]])}$`,
            ],
          };
        }),
        t("HI-tenkai-1d", (r) => {
          const m = r(2, 3), c1 = m === 3 ? pick(r, [-2, 2]) : pick(r, [-3, -2, 2, 3]), a1 = r(1, 3), b1 = r(1, 2);
          const c2 = rnz(r, -4, 4), a2 = r(1, 3), b2 = r(0, 2);
          const C = c1 ** m * c2, X = a1 * m + a2, Y = b1 * m + b2;
          const ok = tex(mono(C, X, Y));
          return {
            q: `${tex(`(${mono(c1, a1, b1)})^{${m}}\\times ${c2 < 0 ? `(${mono(c2, a2, b2)})` : mono(c2, a2, b2)}`)} を計算すると？`,
            ans: ok,
            choices: choices4(r, ok, [
              tex(mono(C, a1 + m + a2, b1 + m + b2)),
              tex(mono(c1 * m * c2, X, Y)),
              tex(mono(-C, X, Y)),
              tex(mono(C, X, b1 + b2)),
            ], (i) => tex(mono(C, X + i + 1, Y))),
            hint: "係数と文字を分けて計算する。$(a^{m})^{n}=a^{mn}$、$a^{m}\\times a^{n}=a^{m+n}$",
            steps: [
              `$(${mono(c1, a1, b1)})^{${m}}=(${c1})^{${m}}${mono(1, a1 * m, b1 * m)}=${mono(c1 ** m, a1 * m, b1 * m)}$`,
              `$${mono(c1 ** m, a1 * m, b1 * m)}\\times ${c2 < 0 ? `(${mono(c2, a2, b2)})` : mono(c2, a2, b2)}=${mono(C, X, Y)}$`,
            ],
          };
        }),
        t("HI-tenkai-1e", (r) => {
          const a = r(1, 4), c = r(1, 4), b = rnz(r, -6, 6), d = rnz(r, -6, 6);
          if (a * c < 2) return { skip: true };
          const W = (k) => [tex(poly(k)), pkey(k)];
          const ok = [a * c, a * d + b * c, b * d];
          return {
            q: `${tex(lin(a, b) + lin(c, d))} を展開すると？`,
            ...ec(r, W(ok), [W([a * c, a * d, b * d]), W([a * c, b * c, b * d]), W([a * c, a * d + b * c, -b * d]), W([a * c, 0, b * d]), W([a * c, -(a * d + b * c), b * d])],
              (i) => W([a * c, a * d + b * c + i + 1, b * d])),
            hint: "分配法則で4つの積を作り、同類項（$x$ の項）をまとめる。",
            steps: [
              `$x^{2}$ の係数は $${a}\\times ${c}=${a * c}$、$x$ の係数は $${a}\\times (${d})+(${b})\\times ${c}=${a * d + b * c}$、定数項は $(${b})\\times (${d})=${b * d}$`,
              `$${lin(a, b)}${lin(c, d)}=${poly(ok)}$`,
            ],
          };
        }),
        t("HI-tenkai-1f", (r) => {
          const a = r(1, 4), b = r(1, 4), kind = r(0, 2);
          const W = (v) => [tex(mpoly([[v[0], "x^{2}"], [v[1], "xy"], [v[2], "y^{2}"]])), v.join(",")];
          const e = [`(${coefVar(a)}+${coefVar(b, "y")})^{2}`, `(${coefVar(a)}-${coefVar(b, "y")})^{2}`, `(${coefVar(a)}+${coefVar(b, "y")})(${coefVar(a)}-${coefVar(b, "y")})`][kind];
          const sg = kind === 1 ? -1 : 1;
          const ok = kind === 2 ? [a * a, 0, -b * b] : [a * a, 2 * sg * a * b, b * b];
          const wr = kind === 2
            ? [W([a * a, 0, b * b]), W([a * a, -2 * a * b, b * b]), W([a, 0, -b]), W([a * a, -2 * a * b, -b * b])]
            : [W([a * a, 0, b * b]), W([a * a, sg * a * b, b * b]), W([a, 2 * sg * a * b, b]), W([a * a, -2 * sg * a * b, b * b]), W([a * a, 2 * sg * a * b, -b * b])];
          return {
            q: `${tex(e)} を展開すると？`,
            ...ec(r, W(ok), wr, (i) => W([a * a, ok[1] + 2 * (i + 1), ok[2]])),
            hint: kind === 2 ? "$(A+B)(A-B)=A^{2}-B^{2}$ の $A,\\ B$ に何が入るか考える。" : "$(A\\pm B)^{2}=A^{2}\\pm 2AB+B^{2}$ の $A,\\ B$ に何が入るか考える。係数も2乗する。",
            steps: [
              kind === 2
                ? `$A=${coefVar(a)},\\ B=${coefVar(b, "y")}$ とすると $A^{2}-B^{2}=(${coefVar(a)})^{2}-(${coefVar(b, "y")})^{2}$`
                : `$A=${coefVar(a)},\\ B=${coefVar(b, "y")}$ とすると $(${coefVar(a)})^{2}${sg > 0 ? "+" : "-"}2\\cdot ${coefVar(a)}\\cdot ${coefVar(b, "y")}+(${coefVar(b, "y")})^{2}$`,
              `$=${W(ok)[0].slice(1, -1)}$`,
            ],
          };
        }),
      ],
      2: [
        t("HI-tenkai-2b", (r) => {
          const a = r(2, 4), A = a * a;
          const W = (c) => [tex(poly(c)), pkey(c)];
          if (r(0, 1)) {
            const ok = [1, 0, 0, 0, -(A * A)];
            return {
              q: `${tex(`(x+${a})(x^{2}+${A})(x-${a})`)} を展開すると？`,
              ...ec(r, W(ok), [W([1, 0, 0, 0, A * A]), W([1, 0, -2 * A, 0, A * A]), W([1, 0, 0, 0, -A])], (i) => W([1, 0, i + 1, 0, -(A * A)])),
              hint: "かける順番を工夫する。和と差の積を先に計算しよう。",
              steps: [
                `$(x+${a})(x-${a})=x^{2}-${A}$`,
                `$(x^{2}-${A})(x^{2}+${A})=x^{4}-${A}^{2}$`,
                `$=${poly(ok)}$`,
              ],
            };
          }
          const ok = [1, 0, A, 0, A * A];
          return {
            q: `${tex(`${par([1, a, A])}${par([1, -a, A])}`)} を展開すると？`,
            ...ec(r, W(ok), [W([1, 0, 0, 0, A * A]), W([1, 0, 2 * A, 0, A * A]), W([1, 0, -A, 0, A * A])], (i) => W([1, 0, A + i + 1, 0, A * A])),
            hint: `$x^{2}+${A}$ を1つのかたまりと見ると、和と差の積になる。`,
            steps: [
              `$X=x^{2}+${A}$ とおくと $(X+${a}x)(X-${a}x)=X^{2}-${A}x^{2}$`,
              `$=(x^{2}+${A})^{2}-${A}x^{2}=x^{4}+${2 * A}x^{2}+${A * A}-${A}x^{2}$`,
              `$=${poly(ok)}$`,
            ],
          };
        }),
        t("HI-tenkai-2c", (r) => {
          const a = rnz(r, -3, 3), b = rnz(r, -3, 3), c = rnz(r, -3, 3);
          const opts = [["xy", 2 * a * b], ["yz", 2 * b * c], ["zx", 2 * c * a], ["y^{2}", b * b]];
          const [m, v] = pick(r, opts);
          const e = `(${coefVar(a, "x")}${signedVar(b, "y")}${signedVar(c, "z")})^{2}`;
          return {
            q: `${tex(e)} を展開したときの ${tex(m)} の係数は？`,
            ans: v,
            hint: "$(a+b+c)^{2}=a^{2}+b^{2}+c^{2}+2ab+2bc+2ca$ のどの項から出てくるか考える。",
            steps: [
              `$(${coefVar(a, "x")}${signedVar(b, "y")}${signedVar(c, "z")})^{2}=${mpoly([[a * a, "x^{2}"], [b * b, "y^{2}"], [c * c, "z^{2}"], [2 * a * b, "xy"], [2 * b * c, "yz"], [2 * c * a, "zx"]])}$`,
              `${tex(m)} の係数は ${v}`,
            ],
          };
        }),
        t("HI-tenkai-2d", (r) => {
          const MON = ["x^{2}", "y^{2}", "z^{2}", "yz", "x", ""];
          const W = (v) => [tex(mpoly(v.map((c, i) => [c, MON[i]]))), v.join(",")];
          if (r(0, 1)) {
            const p = rnz(r, -3, 3), q = rnz(r, -3, 3);
            const P = `${coefVar(p, "y")}${signedVar(q, "z")}`;
            const ok = [1, -p * p, -q * q, -2 * p * q, 0, 0];
            return {
              q: `${tex(`(x${signedVar(p, "y")}${signedVar(q, "z")})(x${signedVar(-p, "y")}${signedVar(-q, "z")})`)} を展開すると？`,
              ...ec(r, W(ok), [W([1, -p * p, -q * q, 0, 0, 0]), W([1, -p * p, -q * q, 2 * p * q, 0, 0]), W([1, p * p, q * q, 2 * p * q, 0, 0]), W([1, -p * p, q * q, -2 * p * q, 0, 0])],
                (i) => W([1, -p * p, -q * q, -2 * p * q - 2 * (i + 1), 0, 0])),
              hint: "共通な部分を見つけて1つの文字に置き換え、$(A+B)(A-B)=A^{2}-B^{2}$ の形にする。",
              steps: [
                `$A=${P}$ とおくと $(x+A)(x-A)=x^{2}-A^{2}$`,
                `$=x^{2}-(${P})^{2}=x^{2}-(${mpoly([[p * p, "y^{2}"], [2 * p * q, "yz"], [q * q, "z^{2}"]])})$`,
                `$=${W(ok)[0].slice(1, -1)}$`,
              ],
            };
          }
          const p = r(1, 3), c = rnz(r, -4, 4);
          const ok = [1, -p * p, 0, 0, 2 * c, c * c];
          return {
            q: `${tex(`(x${signedVar(p, "y")}${signed(c)})(x${signedVar(-p, "y")}${signed(c)})`)} を展開すると？`,
            ...ec(r, W(ok), [W([1, -p * p, 0, 0, 0, c * c]), W([1, -p * p, 0, 0, 2 * c, -c * c]), W([1, p * p, 0, 0, 2 * c, c * c]), W([1, -p * p, 0, 0, c, c * c])],
              (i) => W([1, -p * p, 0, 0, 2 * c, c * c + i + 1])),
            hint: "共通な部分を見つけて1つの文字に置き換え、$(A+B)(A-B)=A^{2}-B^{2}$ の形にする。",
            steps: [
              `$A=x${signed(c)}$ とおくと $(A${signedVar(p, "y")})(A${signedVar(-p, "y")})=A^{2}-${p === 1 ? "" : p * p}y^{2}$`,
              `$=(x${signed(c)})^{2}-${p === 1 ? "" : p * p}y^{2}=${W(ok)[0].slice(1, -1)}$`,
            ],
          };
        }),
        t("HI-tenkai-2e", (r) => {
          const A = [pick(r, [1, 2, 3, -1, -2]), rnz(r, -5, 5), rnz(r, -5, 5)], B = [pick(r, [1, 2, 3, -1, -2]), rnz(r, -5, 5), rnz(r, -5, 5)];
          const k = r(1, 3);
          const P = pmul(A, B);
          const v = P[4 - k];
          const pairs = [];
          for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (4 - i - j === k) pairs.push([i, j]);
          const term = (c, e) => `${c < 0 ? `(${mono(c, e)})` : mono(c, e)}`;
          return {
            q: `${tex(par(A) + par(B))} を展開したときの ${tex(k === 1 ? "x" : `x^{${k}}`)} の係数は？`,
            ans: v,
            hint: "全部を展開しなくてよい。掛けると求める次数になる項の組を探す。",
            steps: [
              `次数の和が ${k} になる組：${pairs.map(([i, j]) => `$${term(A[i], 2 - i)}\\times ${term(B[j], 2 - j)}$`).join("、")}`,
              `係数は $${pairs.map(([i, j]) => `(${A[i] * B[j]})`).join("+")}=${v}$`,
            ],
          };
        }),
      ],
      3: [
        t("HI-tenkai-3a", (r) => {
          const s = r(-3, 5);
          const prs = [];
          for (let u = -5; u <= 5; u++) if (u !== 0 && s - u !== 0 && u < s - u) prs.push([u, s - u]);
          if (prs.length < 2) return { skip: true };
          const [[a, d], [b, c]] = sample(r, prs, 2);
          const P = [[1, a], [1, b], [1, c], [1, d]].reduce((acc, f) => pmul(acc, f), [1]);
          const k = r(1, 2);
          const v = P[4 - k];
          const shown = shuffle(r, [a, b, c, d]).map((u) => `(x${signed(u)})`).join("");
          const ad = a * d, bc = b * c;
          return {
            q: `${tex(shown)} を展開したときの ${tex(k === 2 ? "x^{2}" : "x")} の係数は？`,
            ans: v,
            hint: "定数項の和が等しくなる2組を先に掛けると、共通な部分が現れる。",
            steps: [
              `$(x${signed(a)})(x${signed(d)})=${poly([1, s, ad])}$、$(x${signed(b)})(x${signed(c)})=${poly([1, s, bc])}$`,
              `$X=${poly([1, s, 0])}$ とおくと $(X${signed(ad)})(X${signed(bc)})=X^{2}${signedVar(ad + bc, "X")}${signed(ad * bc)}$`,
              `$X^{2}=${poly(ppow([1, s, 0], 2))}$ なので ${tex(k === 2 ? "x^{2}" : "x")} の係数は ${k === 2 ? `$${s * s}+(${ad + bc})$` : `$(${ad + bc})\\cdot (${s})$`}`,
              `$=${v}$`,
            ],
          };
        }),
        t("HI-tenkai-3b", (r) => {
          const s = r(2, 6), p = rnz(r, -5, 5);
          if (s * s < 4 * p) return { skip: true }; // x, y が実数になる組だけ
          return {
            q: `${tex(`x+y=${s},\\ xy=${p}`)} のとき、${tex("\\frac{y}{x}+\\frac{x}{y}")} の値は？`,
            ans: fracAns(s * s - 2 * p, p),
            hint: "通分すると分子は $x^{2}+y^{2}$。これを $x+y$ と $xy$ で表す。",
            steps: [
              "$\\frac{y}{x}+\\frac{x}{y}=\\frac{x^{2}+y^{2}}{xy}$",
              `$x^{2}+y^{2}=(x+y)^{2}-2xy=${s * s}${signed(-2 * p)}=${s * s - 2 * p}$`,
              `$\\frac{x^{2}+y^{2}}{xy}=${fr(s * s - 2 * p, p)}$`,
            ],
          };
        }),
        t("HI-tenkai-3c", (r) => {
          const minus = r(0, 1) === 1; // x^2-kx-1=0 型（x-1/x）
          const k = minus ? r(1, 6) : r(3, 6), four = r(0, 1) === 1;
          const v2 = minus ? k * k + 2 : k * k - 2, v4 = v2 * v2 - 2;
          return {
            q: `${tex("x")} が2次方程式 ${tex(`${poly([1, -k, minus ? -1 : 1])}=0`)} を満たすとき、${tex(four ? "x^{4}+\\frac{1}{x^{4}}" : "x^{2}+\\frac{1}{x^{2}}")} の値は？`,
            ans: four ? v4 : v2,
            hint: "$x\\neq 0$ なので両辺を $x$ で割ると、$x$ と $\\frac{1}{x}$ の関係式が出る。",
            steps: [
              minus
                ? `$x\\neq 0$ より両辺を $x$ で割って $x${signed(-k)}-\\frac{1}{x}=0$、$x-\\frac{1}{x}=${k}$`
                : `$x\\neq 0$ より両辺を $x$ で割って $x${signed(-k)}+\\frac{1}{x}=0$、$x+\\frac{1}{x}=${k}$`,
              minus
                ? `$x^{2}+\\frac{1}{x^{2}}=\\left(x-\\frac{1}{x}\\right)^{2}+2=${k * k}+2=${v2}$`
                : `$x^{2}+\\frac{1}{x^{2}}=\\left(x+\\frac{1}{x}\\right)^{2}-2=${k * k}-2=${v2}$`,
              ...(four ? [`$x^{4}+\\frac{1}{x^{4}}=\\left(x^{2}+\\frac{1}{x^{2}}\\right)^{2}-2=${v2 * v2}-2=${v4}$`] : []),
            ],
          };
        }),
        t("HI-tenkai-3d", (r) => {
          const s = r(1, 6), p = rnz(r, -8, 8);
          if (s * s < 3 * p) return { skip: true }; // a, b, c が実数になる組だけ
          const sq = s * s - 2 * p;
          const kinds = [
            ["(a-b)^{2}+(b-c)^{2}+(c-a)^{2}", 2 * sq - 2 * p, "2(a^{2}+b^{2}+c^{2})-2(ab+bc+ca)", `2\\cdot ${sq}-2\\cdot (${p})`],
            ["(a+b)^{2}+(b+c)^{2}+(c+a)^{2}", 2 * sq + 2 * p, "2(a^{2}+b^{2}+c^{2})+2(ab+bc+ca)", `2\\cdot ${sq}+2\\cdot (${p})`],
            ["(a+b)(b+c)+(b+c)(c+a)+(c+a)(a+b)", sq + 3 * p, "(a^{2}+b^{2}+c^{2})+3(ab+bc+ca)", `${sq}+3\\cdot (${p})`],
          ];
          const [E, v, form, calc] = pick(r, kinds);
          return {
            q: `${tex(`a+b+c=${s},\\ ab+bc+ca=${p}`)} のとき、${tex(E)} の値は？`,
            ans: v,
            hint: "まず $a^{2}+b^{2}+c^{2}$ を求め、求める式を展開して $a^{2}+b^{2}+c^{2}$ と $ab+bc+ca$ で表す。",
            steps: [
              `$a^{2}+b^{2}+c^{2}=(a+b+c)^{2}-2(ab+bc+ca)=${s * s}${signed(-2 * p)}=${sq}$`,
              `展開して整理すると $${E}=${form}$`,
              `$=${calc}=${v}$`,
            ],
          };
        }),
      ],
      4: [
        t("HI-tenkai-4b", (r) => {
          const n = pick(r, [4, 6, 8]), k = n === 8 ? r(3, 4) : r(3, 6);
          const a2 = k * k - 2, a4 = a2 * a2 - 2, a6 = a2 * a4 - a2, a8 = a4 * a4 - 2;
          const st = [
            `$x^{2}+\\frac{1}{x^{2}}=\\left(x+\\frac{1}{x}\\right)^{2}-2=${k * k}-2=${a2}$`,
            `$x^{4}+\\frac{1}{x^{4}}=\\left(x^{2}+\\frac{1}{x^{2}}\\right)^{2}-2=${a2 * a2}-2=${a4}$`,
          ];
          if (n === 6) st.push(`$\\left(x^{2}+\\frac{1}{x^{2}}\\right)\\left(x^{4}+\\frac{1}{x^{4}}\\right)=x^{6}+\\frac{1}{x^{6}}+x^{2}+\\frac{1}{x^{2}}$ より $x^{6}+\\frac{1}{x^{6}}=${a2}\\cdot ${a4}-${a2}=${a6}$`);
          if (n === 8) st.push(`$x^{8}+\\frac{1}{x^{8}}=\\left(x^{4}+\\frac{1}{x^{4}}\\right)^{2}-2=${a4 * a4}-2=${a8}$`);
          return {
            q: `${tex(`x+\\frac{1}{x}=${k}`)} のとき、${tex(`x^{${n}}+\\frac{1}{x^{${n}}}`)} の値は？`,
            ans: { 4: a4, 6: a6, 8: a8 }[n],
            hint: "$x\\cdot\\frac{1}{x}=1$ を利用して、2乗をくり返して次数を上げる。",
            steps: st,
          };
        }),
        t("HI-tenkai-4c", (r) => {
          const m = rnz(r, -3, 3), n = pick(r, [2, 3, 5, 6, 7]);
          const u = r(-3, 3), v = r(-3, 3), al = rnz(r, -4, 4), be = r(-5, 5);
          const Q = [1, -2 * m, m * m - n];
          const P = pmul(Q, [1, u, v]);
          P[3] += al; P[4] += be;
          const A = al * m + be;
          const ok = tex(rad(A, al, n));
          return {
            q: `${tex(`x=${m}+\\sqrt{${n}}`)} のとき、${tex(poly(P))} の値は？`,
            ans: ok,
            choices: choices4(r, ok, [tex(rad(A, -al, n)), tex(rad(be, al, n)), tex(rad(-A, al, n)), tex(rad(A, 2 * al, n))], (i) => tex(rad(A + i + 1, al, n))),
            hint: `そのまま代入せず、$x${signed(-m)}=\\sqrt{${n}}$ の両辺を2乗した2次式を使って次数を下げる。`,
            steps: [
              `$x${signed(-m)}=\\sqrt{${n}}$ の両辺を2乗して $${poly(Q)}=0$`,
              `与式 $=(${poly(Q)})(${poly([1, u, v])})${al === 0 ? "" : signedVar(al)}${sh(be)}$ と変形できる`,
              `$=${poly([al, be])}=${al === 1 ? "" : al === -1 ? "-" : al}(${m}+\\sqrt{${n}})${sh(be)}=${rad(A, al, n)}$`,
            ],
          };
        }),
        t("HI-tenkai-4d", (r) => {
          const k = r(3, 6), big = r(0, 1) === 1; // a>1 か 0<a<1 か
          const sg = big ? 1 : -1;
          const ok = tex(sqrtTex(sg * k, k * k - 4));
          return {
            q: `${tex(big ? "a>1" : "0<a<1")} で ${tex(`a+\\frac{1}{a}=${k}`)} のとき、${tex("a^{2}-\\frac{1}{a^{2}}")} の値は？`,
            ans: ok,
            choices: choices4(r, ok, [tex(sqrtTex(-sg * k, k * k - 4)), tex(sqrtTex(sg, k * k - 4)), tex(String(k * k - 2)), tex(sqrtTex(sg * k, k * k + 4))]),
            hint: "$a^{2}-\\frac{1}{a^{2}}=\\left(a+\\frac{1}{a}\\right)\\left(a-\\frac{1}{a}\\right)$。$a-\\frac{1}{a}$ の符号を $a$ の範囲から決める。",
            steps: [
              `$\\left(a-\\frac{1}{a}\\right)^{2}=\\left(a+\\frac{1}{a}\\right)^{2}-4=${k * k}-4=${k * k - 4}$`,
              big ? `$a>1$ なので $a>\\frac{1}{a}$、$a-\\frac{1}{a}>0$ より $a-\\frac{1}{a}=${sqrtTex(1, k * k - 4)}$` : `$0<a<1$ なので $a<\\frac{1}{a}$、$a-\\frac{1}{a}<0$ より $a-\\frac{1}{a}=${sqrtTex(-1, k * k - 4)}$`,
              `$a^{2}-\\frac{1}{a^{2}}=\\left(a+\\frac{1}{a}\\right)\\left(a-\\frac{1}{a}\\right)=${k}\\cdot (${sqrtTex(sg, k * k - 4)})=${sqrtTex(sg * k, k * k - 4)}$`,
            ],
          };
        }),
        t("HI-tenkai-4e", (r) => {
          const p = rnz(r, -6, 6), q = rnz(r, -6, 6), w = -(p + q);
          const sym = r(0, 1) === 1;
          const v = sym ? (p * p + q * q + w * w) / 2 : p * q + q * w + w * p;
          return {
            q: `${tex(`a-b=${p},\\ b-c=${q}`)} のとき、${tex(sym ? "a^{2}+b^{2}+c^{2}-ab-bc-ca" : "(a-b)(b-c)+(b-c)(c-a)+(c-a)(a-b)")} の値は？`,
            ans: v,
            hint: "$c-a$ も $a-b$ と $b-c$ で表せる。求める式を $a-b,\\ b-c,\\ c-a$ だけで書けないか考える。",
            steps: [
              `$c-a=-(a-b)-(b-c)=${w}$`,
              sym ? "$a^{2}+b^{2}+c^{2}-ab-bc-ca=\\frac{1}{2}\\{(a-b)^{2}+(b-c)^{2}+(c-a)^{2}\\}$" : "3つの差 $a-b,\\ b-c,\\ c-a$ をそのまま代入する",
              sym ? `$=\\frac{1}{2}(${p * p}+${q * q}+${w * w})=${v}$` : `$=(${p})(${q})+(${q})(${w})+(${w})(${p})=${v}$`,
            ],
          };
        }),
      ],
    },
  },
  // ─────────────────────────────────────────────────────
  {
    ...H,
    id: "HI-inbun", area: "num", name: "因数分解", desc: "共通因数・公式・たすき掛け・置き換え",
    prereqs: ["HI-tenkai", "J3-g3c1u7"],
    points: [
      "まず共通因数でくくる。$a^{2}\\pm 2ab+b^{2}=(a\\pm b)^{2}$、$a^{2}-b^{2}=(a+b)(a-b)$",
      "たすき掛け：$acx^{2}+(ad+bc)x+bd=(ax+b)(cx+d)$。$x^{2}$ の係数と定数項の分け方を試す。",
      "共通な部分は置き換える。文字が2つ以上なら、次数の低い文字について整理する。",
      "$x^{4}+kx^{2}+c^{2}$ は「平方の差」$(x^{2}+c)^{2}-(mx)^{2}$ に変形できないか考える。",
    ],
    levels: {
      1: [
        t("HI-inbun-1a", (r) => {
          let p, q, rr, s;
          do { p = r(1, 3); q = rnz(r, -5, 5); rr = r(1, 3); s = rnz(r, -5, 5); } while (p * rr < 2 || gcd(p, q) !== 1 || gcd(rr, s) !== 1 || (p === rr && q === s));
          const F = (a, b, c, d) => [tex(lin(a, b) + lin(c, d)), pkey(pmul([a, b], [c, d]))];
          const P = pmul([p, q], [rr, s]);
          return {
            q: `${tex(poly(P))} を因数分解すると？`,
            ...ec(r, F(p, q, rr, s), [F(p, s, rr, q), F(p, -q, rr, -s), F(p, q, rr, -s), F(p, -q, rr, s)], (i) => F(p, q + i + 1, rr, s)),
            hint: `たすき掛け：$x^{2}$ の係数 ${P[0]} と定数項 ${P[2]} を2数の積に分け、たすきに掛けた和が ${P[1]} になる組を探す。`,
            steps: [
              `$${P[0]}=${p}\\times ${rr}$、$${P[2]}=(${q})\\times (${s})$ と分ける`,
              `たすき掛け：$${p}\\times (${s})+${rr}\\times (${q})=${P[1]}$`,
              `$${poly(P)}=${lin(p, q)}${lin(rr, s)}$`,
            ],
          };
        }),
        t("HI-inbun-1c", (r) => {
          const al = rnz(r, -5, 5), be = rnz(r, -5, 5);
          if (al === be || al + be === 0) return { skip: true };
          const m = al + be, n = al * be;
          const F = (a, b) => [tex(`(x+y${signed(a)})(x+y${signed(b)})`), pkey(pmul([1, a], [1, b]))];
          return {
            q: `${tex(`(x+y)^{2}${signedVar(m, "(x+y)")}${signed(n)}`)} を因数分解すると？`,
            ...ec(r, F(al, be), [F(-al, -be), F(al, -be), F(-al, be)], (i) => F(al + i + 1, be)),
            hint: "$x+y=X$ とおくと、$X$ の2次式になる。",
            steps: [
              `$X=x+y$ とおくと $${poly([1, m, n], "X")}=(X${signed(al)})(X${signed(be)})$`,
              `$X$ をもどして $(x+y${signed(al)})(x+y${signed(be)})$`,
            ],
          };
        }),
        t("HI-inbun-1d", (r) => {
          const c = r(2, 6), p = r(0, 2), q = r(0, 2), a1 = r(1, 4), a2 = rnz(r, -4, 4), a3 = rnz(r, -3, 3);
          if (p + q === 0 || gcd(gcd(a1, a2), a3) !== 1) return { skip: true };
          const mb = (e, f) => (e === 0 && f === 0 ? "" : mono(1, e, f));
          const E = mpoly([[c * a1, mb(p + 1, q)], [c * a2, mb(p, q + 1)], [c * a3, mb(p, q)]]);
          const G = mono(c, p, q);
          const F = (g, b1, b2, b3) => [tex(`${g}(${mpoly([[b1, "x"], [b2, "y"], [b3, ""]])})`), `${g}|${b1},${b2},${b3}`];
          const keyOf = (gc, gp, gq, b1, b2, b3) => [[gc * b1, gp + 1, gq], [gc * b2, gp, gq + 1], [gc * b3, gp, gq]].filter(([k]) => k).map(([k, e, f]) => `${k}:${e},${f}`).sort().join(";");
          const W = (gc, gp, gq, b1, b2, b3) => [tex(`${mono(gc, gp, gq)}(${mpoly([[b1, "x"], [b2, "y"], [b3, ""]])})`), keyOf(gc, gp, gq, b1, b2, b3)];
          return {
            q: `${tex(E)} を、共通因数をくくり出して因数分解すると？`,
            ...ec(r, W(c, p, q, a1, a2, a3), [W(c, p, q, a1, a2, 0), W(c, p, q, a1, -a2, a3), W(c, p, q, a1, a2, -a3), W(c, p + 1, q, a1, a2, a3), W(c, p, q + 1, a1, a2, a3)],
              (i) => W(c, p, q, a1 + i + 1, a2, a3)),
            hint: "係数の最大公約数と、すべての項に共通な文字（いちばん低い次数）を見つける。",
            steps: [
              `各項に共通な因数は $${G}$`,
              `$${E}=${G}(${mpoly([[a1, "x"], [a2, "y"], [a3, ""]])})$`,
            ],
          };
        }),
        t("HI-inbun-1e", (r) => {
          const a = r(1, 5), b = r(1, 5), kind = r(0, 2);
          if (gcd(a, b) !== 1) return { skip: true };
          // key は [x^2, xy, y^2, x, 1] の係数
          const L = (p, q, two) => (two ? `${coefVar(p)}${signedVar(q, "y")}` : `${coefVar(p)}${signed(q)}`);
          const two = kind !== 2;
          const sq = (p, q) => [tex(`(${L(p, q, two)})^{2}`), (two ? [p * p, 2 * p * q, q * q, 0, 0] : [p * p, 0, 0, 2 * p * q, q * q]).join(",")];
          const pr = (p, q, u, v) => [tex(`(${L(p, q, two)})(${L(u, v, two)})`), (two ? [p * u, p * v + q * u, q * v, 0, 0] : [p * u, 0, 0, p * v + q * u, q * v]).join(",")];
          let E, ok, wr;
          if (kind === 0) { E = mpoly([[a * a, "x^{2}"], [-b * b, "y^{2}"]]); ok = pr(a, b, a, -b); wr = [sq(a, -b), sq(a, b), pr(b, a, b, -a), pr(a * a, b * b, 1, -1)]; }
          else if (kind === 1) { E = mpoly([[a * a, "x^{2}"], [2 * a * b, "xy"], [b * b, "y^{2}"]]); ok = sq(a, b); wr = [sq(a, -b), pr(a, b, a, -b), sq(a, 2 * b), pr(a, 2 * b, a, b)]; }
          else { E = mpoly([[a * a, "x^{2}"], [-2 * a * b, "x"], [b * b, ""]]); ok = sq(a, -b); wr = [sq(a, b), pr(a, b, a, -b), sq(a, -2 * b), pr(a, -2 * b, a, -b)]; }
          return {
            q: `${tex(E)} を因数分解すると？`,
            ...ec(r, ok, wr),
            hint: kind === 0 ? "$A^{2}-B^{2}=(A+B)(A-B)$ の形になっていないか確かめる。" : "$A^{2}\\pm 2AB+B^{2}=(A\\pm B)^{2}$ の形になっていないか確かめる。",
            steps: [
              kind === 0
                ? `$${E}=(${coefVar(a)})^{2}-(${coefVar(b, "y")})^{2}$`
                : kind === 1
                  ? `$${E}=(${coefVar(a)})^{2}+2\\cdot ${coefVar(a)}\\cdot ${coefVar(b, "y")}+(${coefVar(b, "y")})^{2}$`
                  : `$${E}=(${coefVar(a)})^{2}-2\\cdot ${coefVar(a)}\\cdot ${b}+${b}^{2}$`,
              `$=${ok[0].slice(1, -1)}$`,
            ],
          };
        }),
      ],
      2: [
        t("HI-inbun-2a", (r) => {
          let p, q, rr, s;
          do { p = r(1, 3); q = rnz(r, -5, 5); rr = r(1, 3); s = rnz(r, -5, 5); } while (p * rr < 2 || gcd(p, q) !== 1 || gcd(rr, s) !== 1 || (p === rr && q === s));
          const F = (a, b, c, d) => [tex(lin(a, b, "x", "y") + lin(c, d, "x", "y")), pkey(pmul([a, b], [c, d]))];
          const P = pmul([p, q], [rr, s]);
          const e = mpoly([[P[0], "x^{2}"], [P[1], "xy"], [P[2], "y^{2}"]]);
          return {
            q: `${tex(e)} を因数分解すると？`,
            ...ec(r, F(p, q, rr, s), [F(p, s, rr, q), F(p, -q, rr, -s), F(p, q, rr, -s), F(p, -q, rr, s)], (i) => F(p, q + i + 1, rr, s)),
            hint: "$y$ を定数のように見て、$x$ の2次式としてたすき掛けをする。",
            steps: [
              `$${P[0]}=${p}\\times ${rr}$、$${mpoly([[P[2], "y^{2}"]])}=(${coefVar(q, "y")})(${coefVar(s, "y")})$ と分ける`,
              `たすき掛け：$${p}\\times (${s})+${rr}\\times (${q})=${P[1]}$`,
              `$${e}=${lin(p, q, "x", "y")}${lin(rr, s, "x", "y")}$`,
            ],
          };
        }),
        t("HI-inbun-2b", (r) => {
          const [a, b] = sample(r, [1, 2, 3, 4, 5], 2).sort((u, v) => u - v);
          const A = a * a, B = b * b;
          const P = [1, 0, -(A + B), 0, A * B];
          const ok = `(x+${a})(x-${a})(x+${b})(x-${b})`;
          const wr = [
            `(x^{2}-${A})(x^{2}-${B})`,
            `(x^{2}+${A})(x^{2}+${B})`,
            `(x+${a})(x-${a})(x^{2}+${B})`,
            `(x+${a})^{2}(x-${b})^{2}`,
          ];
          return {
            q: `${tex(poly(P))} を、整数の範囲でできるところまで因数分解すると？`,
            ans: tex(ok),
            choices: choices4(r, tex(ok), wr.map(tex)),
            hint: "$x^{2}=X$ とおいて $X$ の2次式として因数分解し、さらに分解できないか確かめる。",
            steps: [
              `$X=x^{2}$ とおくと $${poly([1, -(A + B), A * B], "X")}=(X-${A})(X-${B})$`,
              `$(x^{2}-${A})(x^{2}-${B})$ はまだ和と差の積に分解できる`,
              `$=${ok}$`,
            ],
          };
        }),
        t("HI-inbun-2c", (r) => {
          const c = r(1, 4), e = r(0, 1), m = r(1, 5), kind = r(0, 2);
          if (c === 1 && e === 0) return { skip: true };
          const n = kind === 2 ? rnz(r, -5, 5) : 0;
          if (kind === 2 && (n === m || n === -m)) return { skip: true };
          // 中の2次式の根：kind0 は ±m、kind1 は重解 -m、kind2 は -m と -n
          const roots = kind === 0 ? [m, -m] : kind === 1 ? [-m, -m] : [-m, -n];
          const quad = pmul([1, -roots[0]], [1, -roots[1]]);
          const head = mono(c, e);
          const full = pmul([c, ...Array(e).fill(0)], quad);
          const facs = (rs) => {
            const cnt = new Map();
            for (const x of rs) cnt.set(x, (cnt.get(x) || 0) + 1);
            return [...cnt.entries()].sort((u, v) => v[0] - u[0]).map(([x, k]) => `(x${signed(-x)})${k > 1 ? `^{${k}}` : ""}`).join("");
          };
          const W = (hc, he, rs) => [tex(`${mono(hc, he) === "1" ? "" : mono(hc, he)}${facs(rs)}`), pkey(pmul([hc, ...Array(he).fill(0)], rs.reduce((acc, x) => pmul(acc, [1, -x]), [1])))];
          const ok = W(c, e, roots);
          const wr = kind === 0
            ? [W(c, e, [m, m]), W(c, e, [-m, -m]), W(c, 1 - e, roots), W(c, e, [2 * m, -2 * m])]
            : kind === 1
              ? [W(c, e, [m, -m]), W(c, e, [m, m]), W(c, 1 - e, roots), W(c, e, [-m, m * 2])]
              : [W(c, e, [m, n]), W(c, e, [-m, n]), W(c, 1 - e, roots), W(c, e, [m, -n])];
          return {
            q: `${tex(poly(full))} を、できるところまで因数分解すると？`,
            ...ec(r, ok, wr, (i) => W(c, e, [roots[0] + i + 1, roots[1]])),
            hint: "まず共通因数をくくり出し、残った2次式を公式やたすき掛けでさらに分解する。",
            steps: [
              `共通因数 $${head}$ をくくり出す：$${poly(full)}=${head}(${poly(quad)})$`,
              `$${poly(quad)}=${facs(roots)}$`,
              `$=${ok[0].slice(1, -1)}$`,
            ],
          };
        }),
        t("HI-inbun-2d", (r) => {
          const p = rnz(r, -5, 5), q = rnz(r, -3, 3), rr = rnz(r, -5, 5);
          const key = (a, b, c) => [b, a + c, a * b, a * c].join(","); // (x+a)(x+by+c) の [xy, x, y, 1]
          const F = (a, b, c) => [tex(`(x${signed(a)})(x${signedVar(b, "y")}${signed(c)})`), key(a, b, c)];
          const E = mpoly([[1, "x^{2}"], [q, "xy"], [p + rr, "x"], [p * q, "y"], [p * rr, ""]]);
          return {
            q: `${tex(E)} を因数分解すると？`,
            ...ec(r, F(p, q, rr), [F(rr, q, p), F(-p, q, -rr), F(p, -q, rr), F(-p, -q, rr)], (i) => F(p, q, rr + i + 1)),
            hint: "$y$ については1次式。$y$ について整理すると、共通因数が見えてくる。",
            steps: [
              `$y$ について整理：$${mpoly([[q, "x"], [p * q, ""]])}$ が $y$ の係数、残りは $${mpoly([[1, "x^{2}"], [p + rr, "x"], [p * rr, ""]])}$`,
              `$=${coefVar(q, "y")}(x${signed(p)})+(x${signed(p)})(x${signed(rr)})$`,
              `$=(x${signed(p)})(x${signedVar(q, "y")}${signed(rr)})$`,
            ],
          };
        }),
      ],
      3: [
        t("HI-inbun-3a", (r) => {
          const m = r(1, 3), c = r(Math.max(2, Math.floor((m * m) / 4) + 1), 6);
          const k = 2 * c - m * m;
          const P = [1, 0, k, 0, c * c];
          const F = (A, B) => [tex(par(A) + par(B)), pkey(pmul(A, B))];
          const sq = [tex(`(x^{2}+${c})^{2}`), pkey(ppow([1, 0, c], 2))];
          return {
            q: `${tex(poly(P))} を因数分解すると？`,
            ...ec(r, F([1, m, c], [1, -m, c]), [sq, F([1, m, -c], [1, -m, -c]), F([1, m, c], [1, m, -c])], (i) => F([1, m + i + 1, c], [1, -m - i - 1, c])),
            hint: `$(x^{2}+${c})^{2}$ を作って、ずれた分を引く（平方の差の形）。`,
            steps: [
              `$${poly(P)}=(x^{2}+${c})^{2}-${m === 1 ? "" : m * m}x^{2}$`,
              `$=(x^{2}+${c})^{2}-(${coefVar(m)})^{2}$`,
              `$=${par([1, m, c])}${par([1, -m, c])}$`,
            ],
          };
        }),
        t("HI-inbun-3b", (r) => {
          const p = rnz(r, -3, 3), q = rnz(r, -4, 4), rr = rnz(r, -3, 3), s = rnz(r, -4, 4);
          if (p === rr || q === s) return { skip: true };
          const key = (a, b, c, d) => [a + c, a * c, b + d, a * d + b * c, b * d].join(",");
          const fx = (a, b) => `(x${signedVar(a, "y")}${sh(b)})`;
          const F = (a, b, c, d) => [tex(fx(a, b) + fx(c, d)), key(a, b, c, d)];
          const e = mpoly([[1, "x^{2}"], [p + rr, "xy"], [p * rr, "y^{2}"], [q + s, "x"], [p * s + q * rr, "y"], [q * s, ""]]);
          return {
            q: `${tex(e)} を因数分解すると？`,
            ...ec(r, F(p, q, rr, s), [F(p, s, rr, q), F(p, -q, rr, -s), F(-p, q, -rr, s), F(rr, q, p, s)], (i) => F(p, q + i + 1, rr, s)),
            hint: "$x$ について整理し、定数項（$y$ の式）を先に因数分解してからたすき掛けをする。",
            steps: [
              `$x$ について整理：$x^{2}${p + rr || q + s ? `+(${mpoly([[p + rr, "y"], [q + s, ""]])})x` : ""}+(${mpoly([[p * rr, "y^{2}"], [p * s + q * rr, "y"], [q * s, ""]])})$`,
              `定数項 $=(${mpoly([[p, "y"], [q, ""]])})(${mpoly([[rr, "y"], [s, ""]])})$`,
              `$=${fx(p, q)}${fx(rr, s)}$`,
            ],
          };
        }),
        t("HI-inbun-3c", (r) => {
          const b = rnz(r, -4, 4), a1 = rnz(r, -4, 4), a2 = rnz(r, -4, 4);
          const b1 = -b - a1, b2 = -b - a2; // x^2+bx-m=(x-a1)(x-b1)
          if (b1 === 0 || b2 === 0) return { skip: true };
          const m = -a1 * b1, n = -a2 * b2;
          if (m === n) return { skip: true };
          const X = `(x^{2}${signedVar(b)})`;
          const E = `${X}^{2}${signedVar(-(m + n), X)}${signed(m * n)}`;
          const facs = (rs) => {
            const cnt = new Map();
            for (const x of rs) cnt.set(x, (cnt.get(x) || 0) + 1);
            return [...cnt.entries()].sort((u, v) => v[0] - u[0]).map(([x, k]) => `(x${signed(-x)})${k > 1 ? `^{${k}}` : ""}`).join("");
          };
          const W = (rs) => [tex(facs(rs)), pkey(rs.reduce((acc, x) => pmul(acc, [1, -x]), [1]))];
          const rs = [a1, b1, a2, b2];
          return {
            q: `${tex(E)} を、できるところまで因数分解すると？`,
            ...ec(r, W(rs), [W([-a1, -b1, -a2, -b2]), W([a1, b1, -a2, -b2]), W([-a1, -b1, a2, b2]), W([a1, -b1, a2, -b2])], (i) => W([a1 + i + 1, b1, a2, b2])),
            hint: `$x^{2}${signedVar(b)}=X$ とおいて $X$ の2次式として因数分解し、もどしてからさらに分解できないか確かめる。`,
            steps: [
              `$X=x^{2}${signedVar(b)}$ とおくと $${poly([1, -(m + n), m * n], "X")}=(X${signed(-m)})(X${signed(-n)})$`,
              `$=(x^{2}${signedVar(b)}${signed(-m)})(x^{2}${signedVar(b)}${signed(-n)})$`,
              `$=${facs(rs)}$`,
            ],
          };
        }),
        t("HI-inbun-3d", (r) => {
          const a = rnz(r, -4, 4), b = r(1, 3), c = rnz(r, -3, 3);
          if (a === c || a === -c) return { skip: true };
          const E = mpoly([[1, "x^{2}"], [-b * b, "y^{2}"], [2 * a, "x"], [-2 * b * c, "y"], [a * a - c * c, ""]]);
          // (x+by+(a+c))(x-by+(a-c))
          const key = (p, u, q, v) => [p + q, p * q, u + v, u * q + v * p, u * v].join(","); // (x+py+u)(x+qy+v) の [xy, y^2, x, y, 1]
          const F = (p, u, q, v) => [tex(`(x${signedVar(p, "y")}${sh(u)})(x${signedVar(q, "y")}${sh(v)})`), key(p, u, q, v)];
          return {
            q: `${tex(E)} を因数分解すると？`,
            ...ec(r, F(b, a + c, -b, a - c), [F(b, a - c, -b, a + c), F(b, c - a, -b, -a - c), F(b, a + c, b, a - c), F(-b, a + c, b, a + c)],
              (i) => F(b, a + c + i + 1, -b, a - c)),
            hint: "$x$ の項と定数項で $(x+a)^{2}$ を作り、残りを $(\\ )^{2}$ にして平方の差 $A^{2}-B^{2}$ の形にする。",
            steps: [
              `$${E}=(x${signed(a)})^{2}-(${coefVar(b, "y")}${sh(c)})^{2}$`,
              `$=\\{(x${signed(a)})+(${coefVar(b, "y")}${sh(c)})\\}\\{(x${signed(a)})-(${coefVar(b, "y")}${sh(c)})\\}$`,
              `$=(x${signedVar(b, "y")}${sh(a + c)})(x${signedVar(-b, "y")}${sh(a - c)})$`,
            ],
          };
        }),
      ],
      4: [
        t("HI-inbun-4a", (r) => {
          const d = r(1, 2), a = pick(r, [-3, -2, -1, 1, 2, 3]);
          const vals = [a, a + d, a + 2 * d, a + 3 * d];
          if (vals.includes(0)) return { skip: true };
          const B = 2 * a + 3 * d, Cc = a * (a + 3 * d);
          const D4 = d ** 4;
          const shown = shuffle(r, vals).map((u) => `(x${signed(u)})`).join("") + `+${D4}`;
          const S = (A) => [tex(`${par(A)}^{2}`), pkey(ppow(A, 2))];
          const okA = [1, B, Cc + d * d];
          return {
            q: `${tex(shown)} を因数分解すると？`,
            ...ec(r, S(okA), [S([1, B, Cc]), [tex(par(okA) + par([1, B, Cc - d * d])), pkey(pmul(okA, [1, B, Cc - d * d]))], S([1, B, Cc + 2 * d * d])],
              (i) => S([1, B + i + 1, Cc + d * d])),
            hint: "定数項の和が等しくなる2組を掛けると、同じ式が現れる。",
            steps: [
              `$(x${signed(a)})(x${signed(a + 3 * d)})=X$ とおくと $X=${poly([1, B, Cc])}$`,
              `$(x${signed(a + d)})(x${signed(a + 2 * d)})=${poly([1, B, Cc + 2 * d * d])}=X+${2 * d * d}$`,
              `与式 $=X(X+${2 * d * d})+${D4}=X^{2}+${2 * d * d}X+${D4}=(X+${d * d})^{2}$`,
              `$=${par(okA)}^{2}$`,
            ],
          };
        }),
        t("HI-inbun-4b", (r) => {
          const a = r(2, 3), p = rnz(r, -3, 3), q = rnz(r, -4, 4), rr = rnz(r, -3, 3), s = rnz(r, -4, 4);
          if (gcd(gcd(a, p), q) !== 1 || q === s) return { skip: true };
          const key = (P, Q, R, S) => [a * R + P, P * R, a * S + Q, P * S + Q * R, Q * S].join(",");
          const fx = (P, Q, A) => `(${coefVar(A, "x")}${signedVar(P, "y")}${sh(Q)})`;
          const F = (P, Q, R, S) => [tex(fx(P, Q, a) + fx(R, S, 1)), key(P, Q, R, S)];
          const co = [a, a * rr + p, p * rr, a * s + q, p * s + q * rr, q * s];
          const e = mpoly([[co[0], "x^{2}"], [co[1], "xy"], [co[2], "y^{2}"], [co[3], "x"], [co[4], "y"], [co[5], ""]]);
          return {
            q: `${tex(e)} を因数分解すると？`,
            ...ec(r, F(p, q, rr, s), [F(p, s, rr, q), F(rr, q, p, s), F(p, -q, rr, -s), F(-p, q, -rr, s)], (i) => F(p, q + i + 1, rr, s)),
            hint: "$x$ について整理する。定数項（$y$ の2次式）を因数分解してから、全体をたすき掛け。",
            steps: [
              `$x$ について整理：$${a}x^{2}+(${mpoly([[co[1], "y"], [co[3], ""]])})x+(${mpoly([[co[2], "y^{2}"], [co[4], "y"], [co[5], ""]])})$`,
              `定数項 $=(${mpoly([[p, "y"], [q, ""]])})(${mpoly([[rr, "y"], [s, ""]])})$`,
              `たすき掛けで $x$ の係数が $${mpoly([[co[1], "y"], [co[3], ""]])}$ になる組を選ぶ`,
              `$=${fx(p, q, a)}${fx(rr, s, 1)}$`,
            ],
          };
        }),
        t("HI-inbun-4c", (r) => {
          const [A, B, C] = pick(r, [["a", "b", "c"], ["x", "y", "z"]]);
          const L = (str) => str.replace(/A/g, A).replace(/B/g, B).replace(/C/g, C);
          // 恒等式の一覧：[式, 答え, 正解の関数, 解説]
          const D1 = "-(A-B)(B-C)(C-A)", D0 = "(A-B)(B-C)(C-A)", S0 = "(A+B)(B+C)(C+A)", T0 = "(A+B+C)(AB+BC+CA)";
          const list = [
            ["A^{2}(B-C)+B^{2}(C-A)+C^{2}(A-B)", D1, ["$A$ について整理：$(B-C)A^{2}-(B^{2}-C^{2})A+BC(B-C)$", "$=(B-C)\\{A^{2}-(B+C)A+BC\\}=(B-C)(A-B)(A-C)$"]],
            ["AB(A-B)+BC(B-C)+CA(C-A)", D1, ["$A$ について整理：$(B-C)A^{2}-(B^{2}-C^{2})A+BC(B-C)$", "$=(B-C)\\{A^{2}-(B+C)A+BC\\}=(B-C)(A-B)(A-C)$"]],
            ["A(B^{2}-C^{2})+B(C^{2}-A^{2})+C(A^{2}-B^{2})", D0, ["$A$ について整理：$-(B-C)A^{2}+(B^{2}-C^{2})A-BC(B-C)$", "$=-(B-C)\\{A^{2}-(B+C)A+BC\\}=-(B-C)(A-B)(A-C)$"]],
            ["(A+B)(B+C)(C+A)+ABC", T0, ["展開して $A$ について整理：$(B+C)A^{2}+(B^{2}+3BC+C^{2})A+BC(B+C)$", "たすき掛けで $=\\{A+(B+C)\\}\\{(B+C)A+BC\\}$"]],
            ["A^{2}B+AB^{2}+B^{2}C+BC^{2}+C^{2}A+CA^{2}+2ABC", S0, ["$A$ について整理：$(B+C)A^{2}+(B^{2}+2BC+C^{2})A+BC(B+C)$", "$=(B+C)A^{2}+(B+C)^{2}A+BC(B+C)=(B+C)\\{A^{2}+(B+C)A+BC\\}$", "$=(B+C)(A+B)(A+C)$"]],
          ];
          const [E, ans, st] = pick(r, list);
          const val = {
            [D1]: (a, b, c) => -(a - b) * (b - c) * (c - a),
            [D0]: (a, b, c) => (a - b) * (b - c) * (c - a),
            [S0]: (a, b, c) => (a + b) * (b + c) * (c + a),
            [T0]: (a, b, c) => (a + b + c) * (a * b + b * c + c * a),
            "-(A+B)(B+C)(C+A)": (a, b, c) => -(a + b) * (b + c) * (c + a),
          };
          const fp = (f) => [[1, 2, 3], [2, -1, 4], [-3, 5, 2], [4, 1, -2]].map(([a, b, c]) => f(a, b, c)).join(",");
          const W = (k) => [tex(L(k)), fp(val[k])];
          return {
            q: `${tex(L(E))} を因数分解すると？`,
            ...ec(r, W(ans), [W(D1), W(D0), W(S0), W(T0), W("-(A+B)(B+C)(C+A)")]),
            hint: `1つの文字（例えば $${A}$）について整理すると、残りの文字の式が共通因数として見えてくる。`,
            steps: [...st.map(L), `$=${L(ans)}$`],
          };
        }),
        t("HI-inbun-4d", (r) => {
          const lead = pick(r, [1, 1, 2]), c = pick(r, [-36, -30, -24, -20, -18, -12, -8, 8, 12, 18, 20, 24, 30, 36]);
          const ks = new Set(), rows = [];
          for (let q = -Math.abs(c); q <= Math.abs(c); q++) {
            if (q === 0 || c % q !== 0) continue;
            const p = c / q, k = lead * q + p; // (lead x + p)(x + q)
            if (!ks.has(k)) { ks.add(k); rows.push([p, q, k]); }
          }
          const E = lead === 1 ? `x^{2}+kx${signed(c)}` : `2x^{2}+kx${signed(c)}`;
          const pos = [...ks].filter((k) => k > 0).sort((u, v) => u - v);
          return {
            q: `${tex("k")} は整数とする。${tex(E)} が整数を係数とする ${tex("x")} の1次式の積に因数分解できるような ${tex("k")} は何個ある？`,
            ans: ks.size,
            unit: "個",
            hint: lead === 1 ? `$x^{2}+kx${signed(c)}=(x+p)(x+q)$ とおくと $pq=${c}$、$k=p+q$。積が ${c} になる整数の組をすべて調べる。` : `$2x^{2}+kx${signed(c)}=(2x+p)(x+q)$ とおくと $pq=${c}$、$k=2q+p$。積が ${c} になる整数の組をすべて調べる。`,
            steps: [
              lead === 1 ? `$pq=${c}$ となる整数の組から $k=p+q$ を作る` : `$pq=${c}$ となる整数の組から $k=2q+p$ を作る`,
              `正の値は ${pos.join(", ")}、負の値はその符号を変えたもの${ks.has(0) ? "、ほかに $k=0$" : ""}`,
              `異なる $k$ は全部で ${ks.size} 個`,
            ],
          };
        }),
      ],
    },
  },
  // ─────────────────────────────────────────────────────
  {
    ...H,
    id: "HI-jissu", area: "num", name: "実数と根号", desc: "分母の有理化・絶対値・二重根号",
    prereqs: ["J3-g3c2u5"],
    points: [
      "分母の有理化：$\\frac{1}{\\sqrt{a}+\\sqrt{b}}=\\frac{\\sqrt{a}-\\sqrt{b}}{a-b}$（分母と分子の両方に同じものを掛ける）",
      "$|a|=a\\ (a\\geqq 0)$、$|a|=-a\\ (a<0)$。$\\sqrt{a^{2}}=|a|$ なので、中身の符号で場合分け。",
      "二重根号：$a>b>0$ のとき $\\sqrt{(a+b)\\pm 2\\sqrt{ab}}=\\sqrt{a}\\pm\\sqrt{b}$。中の $\\sqrt{\\ }$ の前を2にそろえる。",
    ],
    levels: {
      1: [
        t("HI-jissu-1a", (r) => {
          const n = pick(r, [2, 3, 5, 6, 7, 10]), c = r(1, 12);
          const ok = tex(fsq(c, n, n));
          return {
            q: `${tex(`\\frac{${c}}{\\sqrt{${n}}}`)} の分母を有理化すると？`,
            ans: ok,
            choices: choices4(r, ok, [tex(fracTex(c, n)), tex(sqrtTex(c, n)), tex(fsq(1, n, c)), tex(fsq(c, n, 2 * n))]),
            hint: `分母と分子に $\\sqrt{${n}}$ を掛ける。`,
            steps: [
              `$\\frac{${c}}{\\sqrt{${n}}}=\\frac{${c}\\sqrt{${n}}}{\\sqrt{${n}}\\times\\sqrt{${n}}}=\\frac{${c}\\sqrt{${n}}}{${n}}$`,
              `$=${fsq(c, n, n)}$`,
            ],
          };
        }),
        t("HI-jissu-1b", (r) => {
          const n = pick(r, [2, 3, 5, 6, 7, 10, 11, 13, 14, 15, 17, 19, 21, 22, 23]), m = r(1, 5);
          const big = m * m > n;
          const A = `${m}-\\sqrt{${n}}`, B = `\\sqrt{${n}}-${m}`;
          const ok = tex(big ? A : B);
          return {
            q: `${tex(`|${m}-\\sqrt{${n}}|`)} を、絶対値記号を使わずに表すと？`,
            ans: ok,
            choices: choices4(r, ok, [tex(big ? B : A), tex(`${m}+\\sqrt{${n}}`), tex(`-${m}-\\sqrt{${n}}`)]),
            hint: `中身 $${m}-\\sqrt{${n}}$ が正か負かを、$${m}=\\sqrt{${m * m}}$ と比べて判断する。`,
            steps: [
              `$${m}=\\sqrt{${m * m}}$ ${big ? ">" : "<"} $\\sqrt{${n}}$ なので $${m}-\\sqrt{${n}}$ は${big ? "正" : "負"}`,
              big ? `そのまま外して $${A}$` : `符号を変えて外す：$-(${A})=${B}$`,
            ],
          };
        }),
        t("HI-jissu-1c", (r) => {
          const n = pick(r, [2, 3, 5, 6, 7]), ks = sample(r, [1, 2, 3, 4, 5], 3), sg = [1, sgn(r), sgn(r)];
          const tot = ks[0] * sg[0] + ks[1] * sg[1] + ks[2] * sg[2];
          if (tot === 0) return { skip: true };
          const rads = ks.map((k) => k * k * n);
          const E = rads.map((v, i) => `${i === 0 ? "" : sg[i] > 0 ? "+" : "-"}\\sqrt{${v}}`).join("");
          const ok = tex(sqrtTex(tot, n));
          const naive = rads[0] + sg[1] * rads[1] + sg[2] * rads[2];
          return {
            q: `${tex(E)} を計算すると？`,
            ans: ok,
            choices: choices4(r, ok, [naive > 0 ? tex(sqrtTex(1, naive)) : null, tex(sqrtTex(ks[0] - sg[1] * ks[1] + sg[2] * ks[2], n)), tex(sqrtTex(ks[0] + ks[1] + ks[2], n)), tex(sqrtTex(-tot, n))].filter((x) => x && x !== "$0$"), (i) => tex(sqrtTex(tot + (i % 2 ? -1 : 1) * (Math.floor(i / 2) + 1), n))),
            hint: "それぞれの根号を $a\\sqrt{b}$（$b$ はできるだけ小さく）に直してから、同じ根号どうしをまとめる。",
            steps: [
              rads.filter((v) => v !== n).map((v) => `$\\sqrt{${v}}=${sqrtTex(1, v)}$`).join("、"),
              `$${ks.map((k, i) => `${i === 0 ? "" : sg[i] > 0 ? "+" : "-"}${sqrtTex(k, n)}`).join("")}=${sqrtTex(tot, n)}$`,
            ],
          };
        }),
        t("HI-jissu-1d", (r) => {
          const kind = r(0, 2);
          let shown, num, den, st;
          if (kind === 0) {
            const a = r(1, 8);
            shown = `0.\\dot{${a}}`; num = a; den = 9;
            st = [`$x=0.${a}${a}${a}\\cdots$ とおくと $10x=${a}.${a}${a}\\cdots$`, `辺々引いて $9x=${a}$`];
          } else if (kind === 1) {
            const a = r(0, 9), b = r(0, 9);
            if (a === b) return { skip: true };
            shown = `0.\\dot{${a}}\\dot{${b}}`; num = 10 * a + b; den = 99;
            st = [`$x=0.${a}${b}${a}${b}\\cdots$ とおくと $100x=${a}${b}.${a}${b}\\cdots$`.replace("=0" + b + ".", "=" + b + "."), `辺々引いて $99x=${num}$`];
          } else {
            const a = r(1, 9), b = r(1, 8);
            if (a === b) return { skip: true };
            shown = `0.${a}\\dot{${b}}`; num = 9 * a + b; den = 90;
            st = [`$x=0.${a}${b}${b}\\cdots$ とおくと $10x=${a}.${b}${b}\\cdots$、$100x=${a}${b}.${b}${b}\\cdots$`, `辺々引いて $90x=${a}${b}-${a}=${num}$`];
          }
          return {
            q: `循環小数 ${tex(shown)} を分数で表すと？（約分した形で）`,
            ans: fracAns(num, den),
            hint: "循環する部分の桁数だけ10倍、100倍した数をつくり、引き算して循環部分を消す。",
            steps: [...st, `$x=${fr(num, den)}$`],
          };
        }),
      ],
      2: [
        t("HI-jissu-2a", (r) => {
          const [b, a] = sample(r, [2, 3, 5, 6, 7, 10, 11], 2).sort((u, v) => u - v);
          const d = a - b, k = r(1, 3), c = d * k;
          const plus = r(0, 1) === 1; // 分母が √a+√b か
          const sa = sqrtTex(k, a), sb = sqrtTex(k, b);
          const okS = plus ? `${sa}-${sb}` : `${sa}+${sb}`;
          const ok = tex(okS);
          const den = plus ? `\\sqrt{${a}}+\\sqrt{${b}}` : `\\sqrt{${a}}-\\sqrt{${b}}`;
          const conj = plus ? `\\sqrt{${a}}-\\sqrt{${b}}` : `\\sqrt{${a}}+\\sqrt{${b}}`;
          return {
            q: `${tex(`\\frac{${c}}{${den}}`)} の分母を有理化すると？`,
            ans: ok,
            choices: choices4(r, ok, [
              tex(plus ? `${sa}+${sb}` : `${sa}-${sb}`),
              tex(plus ? `${sb}-${sa}` : `-${sa}-${sb}`),
              tex(`\\frac{${c === 1 ? "" : c}(${conj})}{${a + b}}`),
              tex(`\\frac{${c}}{${d}}`),
            ]),
            hint: `分母と分子に $${conj}$ を掛けて、和と差の積を作る。`,
            steps: [
              `$\\frac{${c === 1 ? "" : c}(${conj})}{(${den})(${conj})}=\\frac{${c === 1 ? "" : c}(${conj})}{${a}-${b}}$`,
              `$=\\frac{${c === 1 ? "" : c}(${conj})}{${d}}=${okS}$`,
            ],
          };
        }),
        t("HI-jissu-2b", (r) => {
          const b = r(1, 7), a = r(b + 1, 10);
          const q = a * b, p = a + b;
          if (Number.isInteger(Math.sqrt(q))) return { skip: true };
          const sg = r(0, 1) ? 1 : -1;
          const [k, q2] = sqrtSimp(q);
          const inner = `${2 * k}\\sqrt{${q2}}`;
          const SA = sqrtTex(1, a), SB = sqrtTex(1, b);
          const okS = sg > 0 ? `${SA}+${SB}` : `${SA}-${SB}`;
          const ok = tex(okS);
          return {
            q: `${tex(`\\sqrt{${p}${sg > 0 ? "+" : "-"}${inner}}`)} を簡単にすると？`,
            ans: ok,
            choices: choices4(r, ok, [
              tex(sg > 0 ? `${SA}-${SB}` : `${SB}-${SA}`),
              tex(sg > 0 ? `\\sqrt{${p}}+\\sqrt{${q}}` : `${SA}+${SB}`),
              tex(`\\sqrt{${p}}${sg > 0 ? "+" : "-"}${sqrtTex(1, 2 * q)}`),
            ], (i) => tex(`${sqrtTex(1, a + i + 1)}${sg > 0 ? "+" : "-"}${SB}`)),
            hint: "中の根号の前を2にして $2\\sqrt{ab}$ の形にし、足して $a+b$、掛けて $ab$ になる2数を探す。",
            steps: [
              k > 1 ? `$${inner}=2\\sqrt{${q}}$ と直す` : `中の根号はすでに $2\\sqrt{${q}}$ の形`,
              `足して ${p}、掛けて ${q} になる2数は ${a} と ${b}`,
              `$\\sqrt{(${a}+${b})${sg > 0 ? "+" : "-"}2\\sqrt{${a}\\cdot ${b}}}=${okS}$`,
            ],
          };
        }),
        t("HI-jissu-2c", (r) => {
          const [m, n] = pick(r, [[2, 3], [2, 5], [3, 5], [2, 7], [3, 7]]);
          const a = r(1, 3), b = rnz(r, -3, 3), c = r(1, 3), d = rnz(r, -3, 3);
          const A = a * c * m + b * d * n, B = a * d + b * c;
          const T = (p, q) => `${sqrtTex(p, m)}${q < 0 ? "" : "+"}${sqrtTex(q, n)}`;
          const R = (u, v) => (v === 0 ? String(u) : rad(u, v, m * n));
          const ok = tex(R(A, B));
          return {
            q: `${tex(`(${T(a, b)})(${T(c, d)})`)} を計算すると？`,
            ans: ok,
            choices: choices4(r, ok, [tex(R(A, -B)), tex(R(a * c + b * d, B)), tex(R(a * c * m - b * d * n, B)), tex(R(A + 1, B))], (i) => tex(R(A, B + i + 1))),
            hint: "分配法則で4つの積を作る。$\\sqrt{a}\\times\\sqrt{a}=a$、$\\sqrt{a}\\times\\sqrt{b}=\\sqrt{ab}$",
            steps: [
              `$=${sqrtTex(a, m)}\\cdot ${sqrtTex(c, m)}+${sqrtTex(a, m)}\\cdot (${sqrtTex(d, n)})+(${sqrtTex(b, n)})\\cdot ${sqrtTex(c, m)}+(${sqrtTex(b, n)})(${sqrtTex(d, n)})$`,
              `$=${a * c * m}${signed(b * d * n)}+(${a * d}${signed(b * c)})\\sqrt{${m * n}}$`,
              `$=${R(A, B)}$`,
            ],
          };
        }),
        t("HI-jissu-2d", (r) => {
          const pool = [];
          for (const k of [1, 2, 3, 4]) for (const b of [2, 3, 5, 6, 7]) { const v = k * k * b; if (v >= 10 && v <= 50) pool.push([sqrtTex(k, b), v]); }
          for (const k of [4, 5, 6, 7]) pool.push([String(k), k * k]);
          const pickd = sample(r, pool, 12);
          const four = [];
          for (const x of pickd) if (four.length < 4 && !four.some((y) => y[1] === x[1])) four.push(x);
          if (four.length < 4) return { skip: true };
          const askMax = r(0, 1) === 1;
          const best = four.reduce((u, v) => (askMax ? (v[1] > u[1] ? v : u) : (v[1] < u[1] ? v : u)));
          const ok = tex(best[0]);
          return {
            q: `4つの数 ${four.map((x) => tex(x[0])).join("、")} のうち、${askMax ? "最も大きい" : "最も小さい"}ものは？`,
            ans: ok,
            choices: choices4(r, ok, four.filter((x) => x !== best).map((x) => tex(x[0]))),
            hint: "正の数どうしは、2乗した値の大小で比べられる。$a\\sqrt{b}=\\sqrt{a^{2}b}$",
            steps: [
              `それぞれ2乗すると ${four.map((x) => `$(${x[0]})^{2}=${x[1]}$`).join("、")}`,
              `2乗が${askMax ? "最も大きい" : "最も小さい"}のは $${best[0]}$`,
            ],
          };
        }),
      ],
      3: [
        t("HI-jissu-3a", (r) => {
          const [b, a] = sample(r, [2, 3, 5, 6, 7], 2).sort((u, v) => u - v);
          const [n, d] = reduce(2 * (a + b), a - b); // x+y = n/d
          const num = n * n - 2 * d * d, den = d * d;
          return {
            q: `${tex(`x=\\frac{\\sqrt{${a}}+\\sqrt{${b}}}{\\sqrt{${a}}-\\sqrt{${b}}},\\ y=\\frac{\\sqrt{${a}}-\\sqrt{${b}}}{\\sqrt{${a}}+\\sqrt{${b}}}`)} のとき、${tex("x^{2}+y^{2}")} の値は？`,
            ans: fracAns(num, den),
            hint: "$x$ と $y$ を別々に計算せず、$x+y$ と $xy$ を先に求める（対称式）。",
            steps: [
              `$xy=1$、$x+y=\\frac{(\\sqrt{${a}}+\\sqrt{${b}})^{2}+(\\sqrt{${a}}-\\sqrt{${b}})^{2}}{${a}-${b}}=${fr(2 * (a + b), a - b)}$`,
              "$x^{2}+y^{2}=(x+y)^{2}-2xy$",
              `$=\\left(${fracTex(n, d)}\\right)^{2}-2=${fracTex(num, den)}$`,
            ],
          };
        }),
        t("HI-jissu-3b", (r) => {
          if (r(0, 1)) {
            const n = pick(r, [2, 3, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15, 17, 18, 19, 20, 21, 22, 23, 24, 26, 27, 28, 29, 30]);
            const a = Math.floor(Math.sqrt(n));
            return {
              q: `${tex(`\\sqrt{${n}}`)} の整数部分を ${tex("a")}、小数部分を ${tex("b")} とするとき、${tex("b^{2}+2ab")} の値は？`,
              ans: n - a * a,
              hint: "小数部分は $b=\\sqrt{n}-a$。式を $b(b+2a)$ と見る。",
              steps: [
                `$${a * a}<${n}<${(a + 1) ** 2}$ より $a=${a}$、$b=\\sqrt{${n}}-${a}$`,
                `$b^{2}+2ab=b(b+2a)=(\\sqrt{${n}}-${a})(\\sqrt{${n}}+${a})$`,
                `$=${n}-${a * a}=${n - a * a}$`,
              ],
            };
          }
          const m = r(2, 9), n = m * m + 1;
          return {
            q: `${tex(`\\frac{1}{\\sqrt{${n}}-${m}}`)} の小数部分を ${tex("b")} とするとき、${tex("b^{2}+\\frac{1}{b^{2}}")} の値は？`,
            ans: 4 * m * m + 2,
            hint: "まず有理化して、整数部分を決める。$\\frac{1}{b}$ も有理化で求まる。",
            steps: [
              `$\\frac{1}{\\sqrt{${n}}-${m}}=\\sqrt{${n}}+${m}$。$${m}<\\sqrt{${n}}<${m + 1}$ より整数部分は ${2 * m}`,
              `$b=\\sqrt{${n}}-${m}$、$\\frac{1}{b}=\\sqrt{${n}}+${m}$ なので $\\frac{1}{b}-b=${2 * m}$`,
              `$b^{2}+\\frac{1}{b^{2}}=\\left(\\frac{1}{b}-b\\right)^{2}+2=${4 * m * m}+2=${4 * m * m + 2}$`,
            ],
          };
        }),
        t("HI-jissu-3c", (r) => {
          const sA = r(1, 3), tA = r(sA + 1, 5), a = sA * sA, b = tA * tA;
          const rt = (k) => (Number.isInteger(Math.sqrt(k)) ? String(Math.sqrt(k)) : `\\sqrt{${k}}`);
          const term = (k) => `\\frac{1}{${rt(k)}+${rt(k + 1)}}`;
          const E = b - a === 3 ? `${term(a)}+${term(a + 1)}+${term(a + 2)}` : `${term(a)}+${term(a + 1)}+\\cdots+${term(b - 1)}`;
          return {
            q: `${tex(E)} を計算すると？`,
            ans: tA - sA,
            hint: "1つ1つの項の分母を有理化してみる。打ち消し合う項が出てくる。",
            steps: [
              `$\\frac{1}{\\sqrt{k}+\\sqrt{k+1}}=\\frac{\\sqrt{k+1}-\\sqrt{k}}{(k+1)-k}=\\sqrt{k+1}-\\sqrt{k}$`,
              `与式 $=(${rt(a + 1)}-${rt(a)})+(${rt(a + 2)}-${rt(a + 1)})+\\cdots+(${rt(b)}-${rt(b - 1)})$`,
              `$=${rt(b)}-${rt(a)}=${tA - sA}$`,
            ],
          };
        }),
        t("HI-jissu-3d", (r) => {
          const u = r(-5, 3), v = u + r(1, 5), d = v - u;
          let c = d + r(1, 6);
          if ((u + v + c) % 2) c++;
          const x1 = (u + v - c) / 2, x2 = (u + v + c) / 2;
          const ok = tex(`x=${x1},\\ ${x2}`);
          return {
            q: `方程式 ${tex(`\\sqrt{${poly([1, -2 * v, v * v])}}+\\sqrt{${poly([1, -2 * u, u * u])}}=${c}`)} を解くと？`,
            ans: ok,
            choices: choices4(r, ok, [tex(`x=${x2}`), tex(`x=${x1}`), tex(`x=${u},\\ ${v}`), tex(`x=${u - c},\\ ${v + c}`)]),
            hint: "根号の中を $(\\ )^{2}$ の形にして $\\sqrt{A^{2}}=|A|$ を使い、絶対値の方程式として場合分けする。",
            steps: [
              `与式は $|x${sh(-v)}|+|x${sh(-u)}|=${c}$`,
              `$x<${u}$ のとき $-2x${sh(u + v)}=${c}$ より $x=${x1}$（適する）、$${u}\\leqq x\\leqq ${v}$ のとき $${d}=${c}$ となり解なし`,
              `$x>${v}$ のとき $2x${sh(-(u + v))}=${c}$ より $x=${x2}$（適する）`,
              `$x=${x1},\\ ${x2}$`,
            ],
          };
        }),
      ],
      4: [
        t("HI-jissu-4a", (r) => {
          const p = r(1, 6), q = r(1, 6), reg = r(0, 2);
          const E1 = poly([-2, q - p]), E2 = String(p + q), E3 = poly([2, p - q]);
          const ok = tex([E1, E2, E3][reg]);
          const cond = [`x<${-p}`, `${-p}\\leqq x\\leqq ${q}`, `x>${q}`][reg];
          const ins = [
            [`x+${p}<0`, `x-${q}<0`],
            [`x+${p}\\geqq 0`, `x-${q}\\leqq 0`],
            [`x+${p}>0`, `x-${q}>0`],
          ][reg];
          return {
            q: `${tex(cond)} のとき、${tex(`\\sqrt{x^{2}+${2 * p}x+${p * p}}+\\sqrt{x^{2}-${2 * q}x+${q * q}}`)} を簡単にすると？`,
            ans: ok,
            choices: choices4(r, ok, [E1, E2, E3, String(-(p + q))].map(tex)),
            hint: "根号の中を $(\\ )^{2}$ の形にして、$\\sqrt{A^{2}}=|A|$ を使う。",
            steps: [
              `与式 $=\\sqrt{(x+${p})^{2}}+\\sqrt{(x-${q})^{2}}=|x+${p}|+|x-${q}|$`,
              `$${cond}$ では $${ins[0]}$、$${ins[1]}$`,
              [`$=-(x+${p})-(x-${q})=${E1}$`, `$=(x+${p})-(x-${q})=${E2}$`, `$=(x+${p})+(x-${q})=${E3}$`][reg],
            ],
          };
        }),
        t("HI-jissu-4b", (r) => {
          const prs = [];
          for (let b0 = 1; b0 <= 6; b0++) for (let a0 = b0 + 1; a0 <= 11; a0++) if ((a0 + b0) % 2 === 0 && sqrtSimp(a0 * b0)[0] === 1) prs.push([a0, b0]);
          const [a, b] = pick(r, prs);
          const m = (a + b) / 2, n = a * b, sg = r(0, 1) ? 1 : -1;
          const op = sg > 0 ? "+" : "-";
          const [s1, t1] = sqrtSimp(2 * a), [s2, t2] = sqrtSimp(2 * b);
          const okS = s1 % 2 === 0 && s2 % 2 === 0
            ? `${sqrtTex(s1 / 2, t1)}${op}${sqrtTex(s2 / 2, t2)}`
            : `\\frac{${sqrtTex(s1, t1)}${op}${sqrtTex(s2, t2)}}{2}`;
          const ok = tex(okS);
          const SA = sqrtTex(1, a), SB = sqrtTex(1, b);
          return {
            q: `${tex(`\\sqrt{${m}${op}\\sqrt{${n}}}`)} を簡単にすると？`,
            ans: ok,
            choices: choices4(r, ok, [
              tex(`${SA}${op}${SB}`),
              tex(`\\frac{${SA}${op}${SB}}{2}`),
              tex(`\\frac{${sqrtTex(s1, t1)}${sg > 0 ? "-" : "+"}${sqrtTex(s2, t2)}}{2}`),
            ]),
            hint: "中の根号の前が2になるように、根号の中の分母・分子に2を掛ける。",
            steps: [
              `$\\sqrt{${m}${op}\\sqrt{${n}}}=\\sqrt{\\frac{${2 * m}${op}2\\sqrt{${n}}}{2}}=\\frac{\\sqrt{${a + b}${op}2\\sqrt{${a}\\cdot ${b}}}}{\\sqrt{2}}$`,
              `$=\\frac{${SA}${op}${SB}}{\\sqrt{2}}=\\frac{${sqrtTex(1, 2 * a)}${op}${sqrtTex(1, 2 * b)}}{2}$`,
              `$=${okS}$`,
            ],
          };
        }),
        t("HI-jissu-4c", (r) => {
          const n = pick(r, [2, 3, 5]);
          const p = r(1, 3), q = rnz(r, -2, 2), rr = rnz(r, -3, 3), sv = rnz(r, -2, 2);
          if (p * sv - q * rr === 0) return { skip: true };
          const a = rnz(r, -4, 4), b = rnz(r, -4, 4);
          const T = p * a + rr * b, U = q * a + sv * b;
          const askA = r(0, 1) === 1;
          const f = (x, y) => `(${x}${y < 0 ? "-" : "+"}${Math.abs(y) === 1 ? "" : Math.abs(y)}\\sqrt{${n}})`;
          const rhs = U === 0 ? String(T) : rad(T, U, n);
          return {
            q: `${tex("a,\\ b")} は有理数とする。${tex(`${f(p, q)}a+${f(rr, sv)}b=${rhs}`)} が成り立つとき、${tex(askA ? "a" : "b")} の値は？`,
            ans: askA ? a : b,
            hint: `$\\sqrt{${n}}$ は無理数。有理数の部分どうし、$\\sqrt{${n}}$ の係数どうしが等しくなる。`,
            steps: [
              `左辺を整理すると $(${p === 1 ? "" : p}a${signedVar(rr, "b")})+(${coefVar(q, "a")}${signedVar(sv, "b")})\\sqrt{${n}}$`,
              `$a,\\ b$ は有理数で $\\sqrt{${n}}$ は無理数なので $${coefVar(p, "a")}${signedVar(rr, "b")}=${T}$、$${coefVar(q, "a")}${signedVar(sv, "b")}=${U}$`,
              `これを解いて $a=${a},\\ b=${b}$`,
            ],
          };
        }),
        t("HI-jissu-4d", (r) => {
          const pts = sample(r, [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6], 3).sort((u, v) => u - v);
          const w = [pick(r, [1, 1, 2]), pick(r, [1, 1, 2]), pick(r, [1, 1, 2])];
          const f = (x) => pts.reduce((acc, p, i) => acc + w[i] * Math.abs(x - p), 0);
          const vals = pts.map(f), mn = Math.min(...vals);
          const order = shuffle(r, [0, 1, 2]);
          const E = order.map((i, k) => `${k === 0 ? "" : "+"}${w[i] === 1 ? "" : w[i]}|x${sh(-pts[i])}|`).join("");
          return {
            q: `${tex("x")} がすべての実数を動くとき、${tex(E)} の最小値は？`,
            ans: mn,
            hint: "折れ線のグラフになる。傾きが変わるのは絶対値の中が0になる点なので、その点での値を比べる（数直線上の距離の和と考えてもよい）。",
            steps: [
              `グラフは折れ線で、傾きが変わるのは $x=${pts.join(",\\ ")}$`,
              pts.map((p, i) => `$x=${p}$ のとき ${vals[i]}`).join("、"),
              `この中で最小の ${mn} が最小値`,
            ],
          };
        }),
      ],
    },
  },
  // ─────────────────────────────────────────────────────
  {
    ...H,
    id: "HI-futoshiki", area: "num", name: "1次不等式", desc: "不等式の性質・連立不等式・絶対値",
    prereqs: ["J1-e3"],
    points: [
      "両辺に同じ数を足しても引いても不等号の向きは同じ。正の数を掛ける・割るときも同じ。",
      "両辺に負の数を掛ける・割ると、不等号の向きが逆になる。",
      "連立不等式は、それぞれを解いて数直線で共通部分をとる。",
      "$c>0$ のとき $|x|<c \\iff -c<x<c$、$|x|>c \\iff x<-c,\\ c<x$",
    ],
    levels: {
      1: [
        t("HI-futoshiki-1a", (r) => {
          const a = rnz(r, -5, 5), dl = rnz(r, -4, 4), c = a - dl, b = r(-9, 9), d = r(-9, 9);
          const op = pick(r, ["<", ">", "<=", ">="]);
          const op2 = dl > 0 ? op : FLIP[op];
          const k = fracTex(d - b, dl), mk = fracTex(b - d, dl);
          const S = (o, v) => tex(`x${OPS[o]} ${v}`);
          const ok = S(op2, k);
          return {
            q: `不等式 ${tex(`${poly([a, b])}${OPS[op]} ${poly([c, d])}`)} を解くと？`,
            ans: ok,
            choices: choices4(r, ok, [S(FLIP[op2], k), S(op2, mk), S(FLIP[op2], mk)], (i) => S(op2, fracTex(d - b + (i + 1) * dl, dl))),
            hint: "$x$ の項を左辺、数を右辺に集めて $ax<b$ の形にする。$x$ の係数の符号に注意。",
            steps: [
              `移項して $${coefVar(dl)}${OPS[op]} ${d - b}$`,
              dl > 0 ? `両辺を正の数 ${dl} で割る（向きはそのまま）` : `両辺を負の数 ${dl} で割るので、不等号の向きが逆になる`,
              `$x${OPS[op2]} ${k}$`,
            ],
          };
        }),
        t("HI-futoshiki-1b", (r) => {
          const a = rnz(r, -5, 5), dl = rnz(r, -4, 4), c = a - dl, b = r(-9, 9), d = r(-9, 9);
          if ((d - b) % dl === 0 && r(0, 2) > 0) return { skip: true };
          const op = pick(r, ["<", ">", "<=", ">="]);
          const op2 = dl > 0 ? op : FLIP[op];
          const k = (d - b) / dl;
          const lower = op2 === ">" || op2 === ">=";
          let v;
          if (lower) v = op2 === ">=" ? Math.ceil(k - 1e-9) : Math.floor(k + 1e-9) + 1;
          else v = op2 === "<=" ? Math.floor(k + 1e-9) : Math.ceil(k - 1e-9) - 1;
          return {
            q: `不等式 ${tex(`${poly([a, b])}${OPS[op]} ${poly([c, d])}`)} を満たす${lower ? "最小" : "最大"}の整数 ${tex("x")} は？`,
            ans: v,
            hint: "まず不等式を解いて、数直線で考える。等号がつくかどうかに注意。",
            steps: [
              `移項して $${coefVar(dl)}${OPS[op]} ${d - b}$`,
              `$x${OPS[op2]} ${fracTex(d - b, dl)}$${dl < 0 ? "（負の数で割ったので向きが逆）" : ""}`,
              `これを満たす${lower ? "最小" : "最大"}の整数は ${v}`,
            ],
          };
        }),
        t("HI-futoshiki-1c", (r) => {
          const k = r(2, 5), m = r(1, 9), lt = r(0, 1) === 1; // 前提 a<b か a>b か
          const [A, B] = pick(r, [["a", "b"], ["x", "y"], ["p", "q"]]);
          const V = (t) => t.replace(/\\frac/g, "§").replace(/a/g, "#").replace(/b/g, B).replace(/#/g, A).replace(/§/g, "\\frac");
          const P = lt ? "<" : ">", N = lt ? ">" : "<";
          const T = [`a${signed(m)}${P}b${signed(m)}`, `a-${m}${P}b-${m}`, `${k}a${P}${k}b`, `-${k}a${N}-${k}b`, `\\frac{a}{${k}}${P}\\frac{b}{${k}}`, `-a${N}-b`];
          const F = [`${k}a${N}${k}b`, `-${k}a${P}-${k}b`, `a-${m}${N}b-${m}`, `-a${P}-b`, `\\frac{a}{${k}}${N}\\frac{b}{${k}}`, `${m}-a${P}${m}-b`];
          const ok = tex(V(pick(r, T)));
          return {
            q: `${tex(`${A}${P}${B}`)} のとき、次のうち正しいものは？`,
            ans: ok,
            choices: choices4(r, ok, sample(r, F, 3).map((x) => tex(V(x)))),
            hint: "両辺に同じ数を足す・引く、正の数を掛ける・割るときは向きはそのまま。負の数を掛ける・割ると向きが逆になる。",
            steps: [
              `負の数を掛けたり割ったりしたもの、$-${A}$ や $${m}-${A}$ の形は不等号の向きが逆になる`,
              `正しいのは $${ok.slice(1, -1)}$`,
            ],
          };
        }),
        t("HI-futoshiki-1d", (r) => {
          const a = r(-5, 5), b = r(1, 6), kind = r(0, 2);
          const A = `|x${sh(-a)}|`;
          if (kind === 0) {
            const ok = tex(`x=${a - b},\\ ${a + b}`);
            return {
              q: `方程式 ${tex(`${A}=${b}`)} を解くと？`,
              ans: ok,
              choices: choices4(r, ok, [tex(`x=${-a - b},\\ ${-a + b}`), tex(`x=${a + b}`), tex(`x=${a - b}`), tex(`x=${-b},\\ ${b}`)]),
              hint: "$|X|=c\\ (c>0)$ のとき $X=\\pm c$",
              steps: [`$x${sh(-a)}=\\pm ${b}$`, `$x=${a}\\pm ${b}$ より $x=${a - b},\\ ${a + b}$`],
            };
          }
          const eq = r(0, 1) === 1;
          const inside = kind === 1;
          const op = inside ? (eq ? "\\leqq" : "<") : eq ? "\\geqq" : ">";
          const le = eq ? "\\leqq" : "<";
          const IN = (u, v) => tex(`${u}${le} x${le} ${v}`), OUT = (u, v) => tex(`x${le} ${u},\\ ${v}${le} x`);
          const ok = inside ? IN(a - b, a + b) : OUT(a - b, a + b);
          return {
            q: `不等式 ${tex(`${A}${op} ${b}`)} を解くと？`,
            ans: ok,
            choices: choices4(r, ok, [inside ? OUT(a - b, a + b) : IN(a - b, a + b), inside ? IN(-a - b, -a + b) : OUT(-a - b, -a + b), inside ? tex(`x${le} ${a + b}`) : tex(`x${eq ? "\\geqq" : ">"} ${a + b}`), inside ? IN(-b, b) : OUT(-b, b)]),
            hint: inside ? "$c>0$ のとき $|X|<c \\iff -c<X<c$" : "$c>0$ のとき $|X|>c \\iff X<-c,\\ c<X$",
            steps: [
              inside ? `$-${b}${le} x${sh(-a)}${le} ${b}$` : `$x${sh(-a)}${le} -${b}$ または $${b}${le} x${sh(-a)}$`,
              `$${ok.slice(1, -1)}$`,
            ],
          };
        }),
      ],
      2: [
        t("HI-futoshiki-2a", (r) => {
          const L = r(-6, 3), U = L + r(1, 6);
          const mk = (bound, wantLower, eq) => {
            const A = rnz(r, -4, 4), c1 = r(-3, 3), a1 = A + c1, b1 = r(-9, 9), d1 = b1 + A * bound;
            const dir = wantLower === A > 0 ? (eq ? ">=" : ">") : eq ? "<=" : "<";
            return { tx: `${poly([a1, b1])}${OPS[dir]} ${poly([c1, d1])}`, A, naiveLower: dir === ">" || dir === ">=", eq, bound, mid: `${coefVar(A)}${OPS[dir]} ${A * bound}` };
          };
          const e1 = r(0, 1) === 1, e2 = r(0, 1) === 1;
          const I1 = mk(L, true, e1), I2 = mk(U, false, e2);
          const okS = ivTex([L, e1], [U, e2]);
          // 負の数で割ったときに向きを変え忘れた答え
          const naive = () => {
            let lo = null, hi = null;
            for (const I of [I1, I2]) {
              if (I.naiveLower) { if (!lo || I.bound > lo[0]) lo = [I.bound, I.eq]; }
              else if (!hi || I.bound < hi[0]) hi = [I.bound, I.eq];
            }
            if (lo && hi && (lo[0] > hi[0] || (lo[0] === hi[0] && !(lo[1] && hi[1])))) return "解なし";
            if (lo && hi && lo[0] === hi[0]) return tex(`x=${lo[0]}`);
            return tex(ivTex(lo, hi));
          };
          const ok = tex(okS);
          return {
            q: `連立不等式 ${tex(`\\begin{cases} ${I1.tx} \\\\ ${I2.tx} \\end{cases}`)} を解くと？`,
            ans: ok,
            choices: choices4(r, ok, [naive(), tex(ivTex([L, !e1], [U, !e2])), tex(ivTex([L, e1], null)), "解なし"]),
            hint: "それぞれの不等式を解いて、数直線で共通部分を探す。",
            steps: [
              I1.A === 1 ? `1つ目：$${I1.mid}$` : `1つ目：$${I1.mid}$ より $${ivTex([L, e1], null)}$`,
              I2.A === 1 ? `2つ目：$${I2.mid}$` : `2つ目：$${I2.mid}$ より $${ivTex(null, [U, e2])}$`,
              `共通部分は $${okS}$`,
            ],
          };
        }),
        t("HI-futoshiki-2b", (r) => {
          const mk = (wantLower) => {
            const A = pick(r, [-5, -4, -3, -2, 2, 3, 4, 5]), c1 = r(-3, 3), a1 = A + c1, b1 = r(-9, 9);
            const K = A * (wantLower ? r(-6, 1) : r(2, 8)) + r(-Math.abs(A) + 1, Math.abs(A) - 1), d1 = b1 + K;
            const dir = wantLower === A > 0 ? pick(r, [">", ">="]) : pick(r, ["<", "<="]);
            const test = (x) => ({ "<": A * x < K, ">": A * x > K, "<=": A * x <= K, ">=": A * x >= K })[dir];
            return { tx: `${poly([a1, b1])}${OPS[dir]} ${poly([c1, d1])}`, test, A, K, dir };
          };
          const I1 = mk(true), I2 = mk(false);
          const xs = [];
          for (let x = -60; x <= 60; x++) if (I1.test(x) && I2.test(x)) xs.push(x);
          if (xs.length < 1 || xs.length > 12) return { skip: true };
          const sol = (I) => {
            const o = I.A > 0 ? I.dir : FLIP[I.dir];
            return `x${OPS[o]} ${fracTex(I.K, I.A)}`;
          };
          return {
            q: `連立不等式 ${tex(`\\begin{cases} ${I1.tx} \\\\ ${I2.tx} \\end{cases}`)} を満たす整数 ${tex("x")} は何個？`,
            ans: xs.length,
            unit: "個",
            hint: "それぞれを解いて共通部分を求め、その範囲の整数を数える。端の値が入るかに注意。",
            steps: [
              `1つ目より $${sol(I1)}$、2つ目より $${sol(I2)}$`,
              `共通部分に入る整数は ${xs.join(", ")}`,
              `全部で ${xs.length} 個`,
            ],
          };
        }),
        t("HI-futoshiki-2c", (r) => {
          const [p, q] = sample(r, [2, 3, 4, 5, 6], 2), a = r(-5, 5), b = r(-5, 5), c = r(-3, 3);
          const op = pick(r, ["<", ">", "<=", ">="]);
          const L = (p * q) / gcd(p, q), A = L / p - L / q;
          const rhs = c * L + (L / p) * a + (L / q) * b;
          const op2 = A > 0 ? op : FLIP[op];
          const S = (o, n) => tex(`x${OPS[o]} ${fracTex(n, A)}`);
          const ok = S(op2, rhs);
          return {
            q: `不等式 ${tex(`\\frac{x${sh(-a)}}{${p}}-\\frac{x${sh(b)}}{${q}}${OPS[op]} ${c}`)} を解くと？`,
            ans: ok,
            choices: choices4(r, ok, [S(FLIP[op2], rhs), S(op2, c + (L / p) * a + (L / q) * b), S(op2, c * L + (L / p) * a - (L / q) * b), S(op2, -rhs)], (i) => S(op2, rhs + (i + 1) * A)),
            hint: `両辺に分母の最小公倍数 ${L} を掛けて分母をはらう。右辺にも掛けるのを忘れずに。`,
            steps: [
              `両辺に ${L} を掛けて $${L / p === 1 ? "" : L / p}(x${sh(-a)})-${L / q === 1 ? "" : L / q}(x${sh(b)})${OPS[op]} ${c * L}$`,
              `整理して $${coefVar(A)}${OPS[op]} ${rhs}$${A < 0 ? "（負の数で割るので向きが逆）" : ""}`,
              ...(A === 1 ? [] : [`$${ok.slice(1, -1)}$`]),
            ],
          };
        }),
        t("HI-futoshiki-2d", (r) => {
          const q = pick(r, [50, 60, 80, 100, 120]), d = pick(r, [20, 30, 40, 50, 70]), p = q + d, n = r(10, 20);
          const xm = r(2, n - 2), M = q * n + d * xm + 10 * r(0, d / 10 - 1);
          return {
            q: `1個 ${p} 円の品物 A と、1個 ${q} 円の品物 B を合わせて ${n} 個買い、代金の合計を ${M} 円以下にしたい。A をできるだけ多く買うとき、A は何個買える？`,
            ans: xm,
            unit: "個",
            hint: "A を $x$ 個とすると B は $(" + n + "-x)$ 個。代金の条件を不等式で表す。",
            steps: [
              `A を $x$ 個とすると $${p}x+${q}(${n}-x)\\leqq ${M}$`,
              `$${d}x\\leqq ${M - q * n}$ より $x\\leqq ${fr(M - q * n, d)}$`,
              `$x$ は整数なので、最大で ${xm} 個`,
            ],
          };
        }),
      ],
      3: [
        t("HI-futoshiki-3a", (r) => {
          const a = r(-5, 3), b = a + r(1, 4);
          let c = b - a + r(1, 6);
          if ((a + b + c) % 2) c++;
          const lo = (a + b - c) / 2, hi = (a + b + c) / 2;
          const ok = tex(`${lo}<x<${hi}`);
          return {
            q: `不等式 ${tex(`|x${sh(-a)}|+|x${sh(-b)}|<${c}`)} を解くと？`,
            ans: ok,
            choices: choices4(r, ok, [tex(`x<${lo},\\ ${hi}<x`), tex(`${a}<x<${b}`), tex(`${lo}\\leqq x\\leqq ${hi}`), tex(`${a - c}<x<${b + c}`)]),
            hint: `絶対値の中が0になる $x=${a},\\ ${b}$ で範囲を3つに分けて考える。`,
            steps: [
              `$x<${a}$ のとき $-2x${sh(a + b)}<${c}$ より $x>${lo}$ → $${lo}<x<${a}$`,
              `$${a}\\leqq x\\leqq ${b}$ のとき $${b - a}<${c}$ で常に成り立つ`,
              `$x>${b}$ のとき $2x${sh(-(a + b))}<${c}$ より $x<${hi}$ → $${b}<x<${hi}$`,
              `合わせて $${lo}<x<${hi}$`,
            ],
          };
        }),
        t("HI-futoshiki-3b", (r) => {
          const U = r(-3, 8), n = r(2, 4), d = r(1, 3), nn = r(1, 4), m = nn + d, s = r(-9, 9), tt = s + d * U;
          const A = U - n - 1, B = U - n;
          const ok = tex(`${A}\\leqq a<${B}`);
          return {
            q: `連立不等式 ${tex(`\\begin{cases} ${poly([m, s])}<${poly([nn, tt])} \\\\ x>a \\end{cases}`)} を満たす整数 ${tex("x")} がちょうど ${n} 個あるような、定数 ${tex("a")} の値の範囲は？`,
            ans: ok,
            choices: choices4(r, ok, [tex(`${A}<a\\leqq ${B}`), tex(`${A}\\leqq a\\leqq ${B}`), tex(`${A}<a<${B}`), tex(`${A - 1}\\leqq a<${A}`)]),
            hint: "1つ目を解いて、数直線上で整数がちょうどその個数入るように $a$ を動かす。端の等号に注意。",
            steps: [
              `1つ目より ${d === 1 ? "" : `\$${d}x<${d * U}\$、`}$x<${U}$`,
              `$a<x<${U}$ に入る整数が ${Array.from({ length: n }, (_, i) => U - n + i).join(", ")} の ${n} 個になればよい`,
              `$a=${A}$ なら $x=${A}$ は入らないのでよい。$a=${B}$ だと $x=${B}$ が入らなくなる`,
              `$${A}\\leqq a<${B}$`,
            ],
          };
        }),
        t("HI-futoshiki-3c", (r) => {
          const p = rnz(r, -5, 5), q = rnz(r, -4, 4), big = r(0, 1) === 1;
          if (p === q) return { skip: true };
          const op = pick(r, ["<", ">", "<=", ">="]);
          const op2 = big ? op : FLIP[op];
          const F = (u, v) => `\\frac{a${signed(-u)}}{a${signed(-v)}}`;
          const S = (o, f) => tex(`x${OPS[o]} ${f}`);
          const ok = S(op2, F(p, q));
          return {
            q: `${tex(big ? `a>${q}` : `a<${q}`)} のとき、${tex("x")} の不等式 ${tex(`ax${signed(p)}${OPS[op]} ${coefVar(q)}+a`)} を解くと？`,
            ans: ok,
            choices: choices4(r, ok, [S(FLIP[op2], F(p, q)), S(op2, F(q, p)), S(FLIP[op2], F(q, p)), S(op2, `\\frac{a${signed(p)}}{a${signed(-q)}}`)]),
            hint: `$x$ の項を左辺に集めると $(a${signed(-q)})x$ の形になる。$a${signed(-q)}$ の符号で、割ったときの向きが決まる。`,
            steps: [
              `移項して $(a${signed(-q)})x${OPS[op]} a${signed(-p)}$`,
              big ? `$a>${q}$ より $a${signed(-q)}>0$ なので、向きはそのまま` : `$a<${q}$ より $a${signed(-q)}<0$ なので、両辺を割ると向きが逆になる`,
              `$${ok.slice(1, -1)}$`,
            ],
          };
        }),
        t("HI-futoshiki-3d", (r) => {
          const m = r(-4, 4), K = r(-3, 6), e1 = r(0, 1) === 1, e2 = r(0, 1) === 1;
          const c = r(2, 4), A = c + 1, B = r(-6, 6); // 2つ目：(c+1)x + B (<=/<) cx + B + K → x (<=/<) K
          const none = r(0, 1) === 1;
          const both = e1 && e2;
          // 解をもつ ⇔ a+m < K（両方に等号があれば a+m ≦ K）
          const T = K - m;
          const opsHas = both ? "\\leqq" : "<";
          const opsNone = both ? ">" : "\\geqq";
          const S = (o) => tex(`a${o} ${T}`);
          const ok = S(none ? opsNone : opsHas);
          const all = ["<", "\\leqq", ">", "\\geqq"].map(S);
          return {
            q: `連立不等式 ${tex(`\\begin{cases} x-a${e1 ? "\\geqq" : ">"} ${m} \\\\ ${A}x${signed(B)}${e2 ? "\\leqq" : "<"} ${c}x${signed(B + K)} \\end{cases}`)} が${none ? "解をもたない" : "解をもつ"}ような、定数 ${tex("a")} の値の範囲は？`,
            ans: ok,
            choices: choices4(r, ok, all.filter((x) => x !== ok)),
            hint: "それぞれを解いて数直線にかき、共通部分ができる（できない）条件を考える。端が一致するときに注意。",
            steps: [
              `1つ目より $x${e1 ? "\\geqq" : ">"} a${sh(m)}$、2つ目より $x${e2 ? "\\leqq" : "<"} ${K}$`,
              both ? `共通部分があるのは $a${sh(m)}\\leqq ${K}$ のとき（等しいときは $x=${K}$ だけが解）` : `共通部分があるのは $a${sh(m)}<${K}$ のとき（等しいときは解がない）`,
              `よって ${none ? "解をもたない" : "解をもつ"}のは $${ok.slice(1, -1)}$`,
            ],
          };
        }),
      ],
      4: [
        t("HI-futoshiki-4a", (r) => {
          const L = r(-4, 3), k = r(2, 4), m = r(2, 4), c = r(-6, 6);
          const A = rnz(r, -3, 3), c1 = r(-3, 3), a1 = A + c1, b1 = r(-9, 9), d1 = b1 + A * L;
          const dir = A > 0 ? ">" : "<";
          const lo = m * (L + k) - c, hi = m * (L + k + 1) - c;
          const ok = tex(`${lo}<a\\leqq ${hi}`);
          return {
            q: `連立不等式 ${tex(`\\begin{cases} ${poly([a1, b1])}${dir} ${poly([c1, d1])} \\\\ ${m}x-a<${c} \\end{cases}`)} を満たす整数 ${tex("x")} がちょうど ${k} 個となるような、定数 ${tex("a")} の値の範囲は？`,
            ans: ok,
            choices: choices4(r, ok, [tex(`${lo}\\leqq a<${hi}`), tex(`${lo}<a<${hi}`), tex(`${lo}\\leqq a\\leqq ${hi}`), tex(`${lo - m}<a\\leqq ${lo}`)]),
            hint: "1つ目は数だけで解ける。2つ目は $x<\\frac{a+c}{m}$ の形。整数がちょうど何個入るかを数直線で考える。",
            steps: [
              `1つ目より ${A === 1 ? "" : `$${coefVar(A)}${dir} ${A * L}$、`}$x>${L}$。2つ目より $x<\\frac{a${sh(c)}}{${m}}$`,
              `整数 ${Array.from({ length: k }, (_, i) => L + 1 + i).join(", ")} だけが入るには $${L + k}<\\frac{a${sh(c)}}{${m}}\\leqq ${L + k + 1}$`,
              `$${m * (L + k)}<a${sh(c)}\\leqq ${m * (L + k + 1)}$ より $${lo}<a\\leqq ${hi}$`,
            ],
          };
        }),
        t("HI-futoshiki-4b", (r) => {
          const k = r(2, 3), p = r(1, 9), q = r(1, 6);
          const lo = fracTex(p - q, k + 1), hi = fracTex(p + q, k - 1);
          const ok = tex(`${lo}<x<${hi}`);
          return {
            q: `不等式 ${tex(`|${k}x-${p}|<x+${q}`)} を解くと？`,
            ans: ok,
            choices: choices4(r, ok, [tex(`x<${hi}`), tex(`x<${lo},\\ ${hi}<x`), tex(`${fracTex(p - q, k - 1)}<x<${fracTex(p + q, k + 1)}`), tex(`${lo}<x<${fracTex(p + q, k + 1)}`)]),
            hint: "$|A|<B \\iff -B<A<B$ を使う（$B$ が負なら解なしになることも含めて成り立つ）。",
            steps: [
              `$-(x+${q})<${k}x-${p}<x+${q}$ と同じ`,
              k === 2 ? `右側：$x<${hi}$` : `右側：$${k - 1}x<${p + q}$ より $x<${hi}$`,
              `左側：$${k + 1}x>${p - q}$ より $x>${lo}$`,
              `$${lo}<x<${hi}$`,
            ],
          };
        }),
        t("HI-futoshiki-4c", (r) => {
          const p = rnz(r, -4, 4), gt = r(0, 1) === 1, sol = r(0, 1) === 1; // 1つ目は ax+b>0（gt）か <0、解は x<p（sol）か x>p
          const aPos = gt ? !sol : sol; // ax+b>0 の解が x<p ⇔ a<0
          const op2 = pick(r, ["<", ">"]);
          // 2つ目：bx+a op2 0、b=-ap → a(1-px) op2 0
          const o1 = aPos ? op2 : FLIP[op2]; // 1-px o1 0
          const o2 = FLIP[o1]; // px o2 1
          const o3 = p > 0 ? o2 : FLIP[o2]; // x o3 1/p
          const S = (o, v) => tex(`x${OPS[o]} ${v}`);
          const ok = S(o3, fracTex(1, p));
          return {
            q: `${tex("x")} の不等式 ${tex(`ax+b${gt ? ">" : "<"}0`)} の解が ${tex(`x${sol ? "<" : ">"}${p}`)} であるとき、${tex("x")} の不等式 ${tex(`bx+a${OPS[op2]}0`)} を解くと？`,
            ans: ok,
            choices: choices4(r, ok, [S(FLIP[o3], fracTex(1, p)), S(o3, fracTex(-1, p)), S(FLIP[o3], fracTex(-1, p))]),
            hint: "解の不等号の向きから $a$ の符号がわかる。さらに解の境目から $b$ を $a$ で表す。",
            steps: [
              `解が $x${sol ? "<" : ">"}${p}$ になるのは、$a${aPos ? ">" : "<"}0$ で $-\\frac{b}{a}=${p}$ のとき。よって $b=${p === 1 ? "-" : p === -1 ? "" : -p}a$`,
              `$bx+a=a(1${p > 0 ? "-" : "+"}${Math.abs(p) === 1 ? "" : Math.abs(p)}x)$ なので $a(1${p > 0 ? "-" : "+"}${Math.abs(p) === 1 ? "" : Math.abs(p)}x)${OPS[op2]}0$`,
              `$a${aPos ? ">" : "<"}0$ で割って $1${p > 0 ? "-" : "+"}${Math.abs(p) === 1 ? "" : Math.abs(p)}x${OPS[o1]}0$、これを解いて $x${OPS[o3]} ${fracTex(1, p)}$`,
            ],
          };
        }),
        t("HI-futoshiki-4d", (r) => {
          const c1 = r(-3, 3), c2 = r(1, 6), k = r(2, 3), e1 = r(0, 1) === 1, e2 = !e1; // 等号は片方だけ（答えが1つの区間になる）
          // 2a+c1 (<,≦) x (<,≦) a+c2 を満たす整数の個数 N(a)
          const N = (a) => { let n = 0; for (let x = -60; x <= 60; x++) { const L = 2 * a + c1, R = a + c2; if ((e1 ? x >= L : x > L) && (e2 ? x <= R : x < R)) n++; } return n; };
          // a は 1/2 刻みの点で N が変わる。1/4 刻みで調べて区間にまとめる
          const lo = c2 - c1 - k - 3, hi = c2 - c1 - k + 3;
          const pts = []; for (let t = lo * 4; t <= hi * 4; t++) pts.push(t / 4);
          const good = pts.map((a) => N(a) === k);
          if (good[0] || good[good.length - 1] || !good.some((g) => g)) return { skip: true };
          const iv = [];
          for (let i = 0; i < pts.length; i++) {
            if (!good[i]) continue;
            let j = i; while (j + 1 < pts.length && good[j + 1]) j++;
            // 端は 1/2 の倍数の点。pts[i] が 1/2 の倍数なら閉、そうでなければ開（その左の 1/2 の倍数）
            const L = pts[i] * 2 === Math.round(pts[i] * 2) ? [pts[i], true] : [pts[i] - 0.25, false];
            const R = pts[j] * 2 === Math.round(pts[j] * 2) ? [pts[j], true] : [pts[j] + 0.25, false];
            iv.push([L, R]);
            i = j;
          }
          const fq = (v) => fracTex(Math.round(v * 2), 2);
          const piece = ([[l, lc], [rr2, rc]]) => (l === rr2 ? `a=${fq(l)}` : `${fq(l)}${lc ? "\\leqq" : "<"} a${rc ? "\\leqq" : "<"} ${fq(rr2)}`);
          const show = (list) => tex(list.map(piece).join(",\\ "));
          const ok = show(iv);
          const tog = (f) => show(iv.map(([[l, lc], [rr2, rc]]) => (l === rr2 ? [[l, lc], [rr2, rc]] : f([[l, lc], [rr2, rc]]))));
          return {
            q: `連立不等式 ${tex(`\\begin{cases} x-2a${e1 ? "\\geqq" : ">"} ${c1} \\\\ x-a${e2 ? "\\leqq" : "<"} ${c2} \\end{cases}`)} を満たす整数 ${tex("x")} がちょうど ${k} 個となるような、定数 ${tex("a")} の値の範囲は？`,
            ans: ok,
            choices: choices4(r, ok, [tog(([[l, lc], [q2, rc]]) => [[l, !lc], [q2, !rc]]), tog(([[l, lc], [q2, rc]]) => [[l, !lc], [q2, rc]]), tog(([[l, lc], [q2, rc]]) => [[l, lc], [q2, !rc]]), tog(([[l, lc], [q2, rc]]) => [[l - 0.5, lc], [q2 - 0.5, rc]])]),
            hint: "解は $2a+(\\text{定数})$ と $a+(\\text{定数})$ ではさまれた範囲。両端が $a$ とともに動くので、$a$ を少しずつ動かしたときの整数の個数の変化を、端が整数をまたぐ $a$ の値で区切って調べる。",
            steps: [
              `解は $2a${signed(c1)}${e1 ? "\\leqq" : "<"} x${e2 ? "\\leqq" : "<"} a${signed(c2)}$`,
              "端が整数になるのは $a$ が $\\frac{1}{2}$ の倍数（左端）か整数（右端）のとき。その値で区切って整数の個数を数える",
              `整数がちょうど ${k} 個になるのは $${ok.slice(1, -1)}$`,
            ],
          };
        }),
      ],
    },
  },
  // ─────────────────────────────────────────────────────
  {
    ...H,
    id: "HI-shugo", area: "num", name: "集合と命題", desc: "共通部分・和集合・必要条件と十分条件・対偶",
    prereqs: ["HI-futoshiki"],
    points: [
      "$A\\cap B$ は共通部分、$A\\cup B$ は和集合、$\\overline{A}$ は補集合。ド・モルガン $\\overline{A\\cup B}=\\overline{A}\\cap\\overline{B}$、$\\overline{A\\cap B}=\\overline{A}\\cup\\overline{B}$",
      "不等式で表された集合は数直線で考える。端の値が入るか（$\\leqq$ か $<$ か）に注意する。",
      "$p\\Rightarrow q$ が真のとき、$p$ は $q$ であるための十分条件、$q$ は $p$ であるための必要条件。",
      "命題 $p\\Rightarrow q$ と対偶 $\\overline{q}\\Rightarrow\\overline{p}$ の真偽は一致する。条件を集合で表すと「小さい方が十分条件」。「かつ」の否定は「または」、「すべての」の否定は「ある」。",
    ],
    levels: {
      1: [
        t("HI-shugo-1a", (r) => {
          const U = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
          const A = sample(r, U, r(3, 6)).sort((x, y) => x - y), B = sample(r, U, r(3, 6)).sort((x, y) => x - y);
          const inA = (x) => A.includes(x), inB = (x) => B.includes(x);
          const kinds = [
            ["A\\cap B", U.filter((x) => inA(x) && inB(x))],
            ["A\\cup B", U.filter((x) => inA(x) || inB(x))],
            ["\\overline{A}\\cap B", U.filter((x) => !inA(x) && inB(x))],
            ["\\overline{A\\cup B}", U.filter((x) => !inA(x) && !inB(x))],
          ];
          const [name, S] = pick(r, kinds);
          const ST = (arr) => tex(arr.length ? `\\{${arr.join(",")}\\}` : "\\varnothing");
          const ok = ST(S);
          const traps = [
            ...kinds.filter(([n]) => n !== name).map(([, v]) => v),
            U.filter((x) => inA(x) && !inB(x)),
            U.filter((x) => !(inA(x) && inB(x))),
            U.filter((x) => !inA(x)),
          ];
          return {
            q: `全体集合 ${tex("U=\\{1,2,3,\\ldots,10\\}")} の部分集合 ${tex(`A=\\{${A.join(",")}\\}`)}、${tex(`B=\\{${B.join(",")}\\}`)} について、${tex(name)} は？`,
            ans: ok,
            choices: choices4(r, ok, traps.map(ST), () => ST(U.filter(() => r(0, 1) === 1))),
            hint: "記号の意味（$\\cap$ は「かつ」、$\\cup$ は「または」、上の線は「でない」）を確かめて、要素を書き出す。",
            steps: [
              name === "\\overline{A}\\cap B" ? `$\\overline{A}=${ST(U.filter((x) => !inA(x))).slice(1, -1)}$` : name === "\\overline{A\\cup B}" ? `$A\\cup B=${ST(kinds[1][1]).slice(1, -1)}$` : "$A$ と $B$ の要素を1つずつ調べる",
              `$${name}=${ok.slice(1, -1)}$`,
            ],
          };
        }),
        t("HI-shugo-1b", (r) => {
          const a = r(1, 6), b = r(1, 6);
          const kinds = [
            [`x=${a}`, `x^{2}=${a * a}`, true, false, `$x=${a}$ なら $x^{2}=${a * a}$`, `反例 $x=${-a}$`],
            [`x>${a + b}`, `x>${a}`, true, false, `$x>${a + b}$ なら $x>${a}$`, `反例 $x=${b > 1 ? a + 1 : `${a}.5`}$`],
            ["xy=0", "x=0", false, true, "反例 $x=1,\\ y=0$", "$x=0$ なら $xy=0$"],
            [`x>${a}`, `x^{2}>${a * a}`, true, false, `$x>${a}>0$ なら $x^{2}>${a * a}$`, `反例 $x=${-a - 1}$`],
            [`x^{2}<${a * a}`, `x<${a}`, true, false, `$-${a}<x<${a}$ なので $x<${a}$`, `反例 $x=${-a - 1}$`],
            [`${2}x-${a}=${b}`, `x=${fracTex(a + b, 2)}`, true, true, "移項して2で割ればよい", "代入すれば成り立つ"],
            [`x>${a}`, `|x|<${a + b}`, false, false, `反例 $x=${a + b + 1}$`, `反例 $x=${-1}$`],
          ];
          const [P, Q, pq, qp, w1, w2] = pick(r, kinds);
          const sw = r(0, 1) === 1;
          const [p, q, PQ, QP, W1, W2] = sw ? [Q, P, qp, pq, w2, w1] : [P, Q, pq, qp, w1, w2];
          const ok = nsOf(PQ, QP);
          return {
            q: `${tex((p + q).includes("y") ? "x,\\ y" : "x")} は実数とする。条件 ${tex(p)} は、条件 ${tex(q)} であるための何条件？`,
            ans: ok,
            choices: choices4(r, ok, NS.filter((s) => s !== ok)),
            hint: "「前 ⇒ 後」と「後 ⇒ 前」の真偽をそれぞれ調べる。偽なら反例を1つ見つける。",
            steps: [
              `$${p}\\Rightarrow ${q}$ は${PQ ? "真" : "偽"}（${W1}）`,
              `$${q}\\Rightarrow ${p}$ は${QP ? "真" : "偽"}（${W2}）`,
              `よって ${ok}`,
            ],
          };
        }),
        t("HI-shugo-1c", (r) => {
          const a = r(1, 6), b = r(1, 5);
          const props = pick(r, [
            [[`x=${a}`, `x\\neq ${a}`], [`x^{2}=${a * a}`, `x^{2}\\neq ${a * a}`]],
            [[`x>${a + b}`, `x\\leqq ${a + b}`], [`x>${a}`, `x\\leqq ${a}`]],
            [[`x<${a}`, `x\\geqq ${a}`], [`x<${a + b}`, `x\\geqq ${a + b}`]],
          ]);
          const [[P, nP], [Q, nQ]] = props;
          const st = (A, B) => `$${A}$ ならば $${B}$`;
          const all = { 逆: st(Q, P), 裏: st(nP, nQ), 対偶: st(nQ, nP), 元: st(P, Q) };
          const ask = pick(r, ["逆", "裏", "対偶"]);
          const ok = all[ask];
          return {
            q: `命題「${st(P, Q)}」の${ask}は？`,
            ans: ok,
            choices: choices4(r, ok, Object.entries(all).filter(([k]) => k !== ask).map(([, v]) => v)),
            hint: "$p\\Rightarrow q$ の逆は $q\\Rightarrow p$、裏は $\\overline{p}\\Rightarrow\\overline{q}$、対偶は $\\overline{q}\\Rightarrow\\overline{p}$。",
            steps: [
              `$p$：$${P}$、$q$：$${Q}$ とする`,
              `${ask}は ${{ 逆: "$q\\Rightarrow p$", 裏: "$\\overline{p}\\Rightarrow\\overline{q}$", 対偶: "$\\overline{q}\\Rightarrow\\overline{p}$" }[ask]}`,
              `「${ok}」`,
            ],
          };
        }),
        t("HI-shugo-1d", (r) => {
          const C = [
            ["A\\cap B", (a, b) => a && b], ["A\\cup B", (a, b) => a || b],
            ["\\overline{A}\\cap\\overline{B}", (a, b) => !a && !b], ["\\overline{A}\\cup\\overline{B}", (a, b) => !a || !b],
            ["A\\cap\\overline{B}", (a, b) => a && !b], ["\\overline{A}\\cap B", (a, b) => !a && b],
            ["\\overline{A}\\cup B", (a, b) => !a || b], ["A\\cup\\overline{B}", (a, b) => a || !b],
          ];
          const ask = pick(r, [
            ["\\overline{A\\cup B}", 2, 3, "\\overline{A}\\cap\\overline{B}"], ["\\overline{A\\cap B}", 3, 2, "\\overline{A}\\cup\\overline{B}"],
            ["\\overline{\\overline{A}\\cup B}", 4, 6, "\\overline{\\overline{A}}\\cap\\overline{B}=A\\cap\\overline{B}"], ["\\overline{A\\cap\\overline{B}}", 6, 4, "\\overline{A}\\cup\\overline{\\overline{B}}=\\overline{A}\\cup B"],
            ["\\overline{\\overline{A}\\cap\\overline{B}}", 1, 0, "\\overline{\\overline{A}}\\cup\\overline{\\overline{B}}=A\\cup B"], ["\\overline{A\\cup\\overline{B}}", 5, 7, "\\overline{A}\\cap\\overline{\\overline{B}}=\\overline{A}\\cap B"],
          ]);
          const [E, okI, trapI, how] = ask;
          const ok = tex(C[okI][0]);
          const rest = C.map((c, i) => i).filter((i) => i !== okI && i !== trapI);
          return {
            q: `全体集合を ${tex("U")} とし、${tex("A,\\ B")} をその部分集合とする。${tex(E)} と等しい集合は？`,
            ans: ok,
            choices: choices4(r, ok, [tex(C[trapI][0]), ...sample(r, rest, 2).map((i) => tex(C[i][0]))]),
            hint: "ド・モルガンの法則：$\\overline{A\\cup B}=\\overline{A}\\cap\\overline{B}$、$\\overline{A\\cap B}=\\overline{A}\\cup\\overline{B}$。上の線をはずすと $\\cap$ と $\\cup$ が入れかわる。",
            steps: [`ド・モルガンの法則より $${E}=${how}$`, `等しいのは $${C[okI][0]}$`],
          };
        }),
      ],
      2: [
        t("HI-shugo-2a", (r) => {
          const c = r(-3, 4), d = r(2, 5), L1 = c - d, U1 = c + d;
          const type = r(0, 3);
          let L2, U2;
          if (type === 0) { L2 = L1; U2 = U1; }
          else if (type === 1) { L2 = L1 - r(0, 2); U2 = U1 + r(1, 2); }
          else if (type === 2) { L2 = L1 + r(0, 1); U2 = U1 - r(1, 2); }
          else { const s = pick(r, [-2, -1, 1, 2]); L2 = L1 + s; U2 = U1 + s; }
          const pq = L2 <= L1 && U1 <= U2, qp = L1 <= L2 && U2 <= U1;
          const ok = nsOf(pq, qp);
          const pT = `|x${sh(-c)}|<${d}`, qT = `${L2}<x<${U2}`;
          return {
            q: `条件 ${tex("p")}：${tex(pT)} は、条件 ${tex("q")}：${tex(qT)} であるための何条件？`,
            ans: ok,
            choices: choices4(r, ok, NS.filter((s) => s !== ok)),
            hint: "条件を満たす $x$ の範囲（集合）を数直線にかき、どちらがどちらに含まれるかを見る。",
            steps: [
              `$p$：$${L1}<x<${U1}$、$q$：$${L2}<x<${U2}$`,
              `$p\\Rightarrow q$ は${pq ? "真" : "偽"}、$q\\Rightarrow p$ は${qp ? "真" : "偽"}`,
              `よって ${ok}`,
            ],
          };
        }),
        t("HI-shugo-2c", (r) => {
          const a1 = r(-5, 0), b1 = a1 + r(1, 3), a2 = b1 + r(1, 3), b2 = a2 + r(1, 3);
          // A: a1〜a2、B: b1〜b2（a1<b1<a2<b2）。等号はランダム
          const [e1, e2, e3, e4] = [r(0, 1), r(0, 1), r(0, 1), r(0, 1)].map((x) => x === 1);
          const inA = (x) => (e1 ? x >= a1 : x > a1) && (e2 ? x <= a2 : x < a2);
          const inB = (x) => (e3 ? x >= b1 : x > b1) && (e4 ? x <= b2 : x < b2);
          const ops = [
            ["A\\cap B", (x) => inA(x) && inB(x)], ["A\\cup B", (x) => inA(x) || inB(x)],
            ["\\overline{A}\\cap B", (x) => !inA(x) && inB(x)], ["A\\cap\\overline{B}", (x) => inA(x) && !inB(x)],
          ];
          const [name, f] = pick(r, ops);
          const T = (g) => { const p = setTex(g, a1 - 2, b2 + 2); return p.length ? tex(p.join(",\\ ")) : "空集合"; };
          const ok = T(f);
          const lt = (eq) => (eq ? "\\leqq" : "<");
          const traps = [...ops.filter(([n]) => n !== name).map(([, g]) => T(g)), T((x) => !f(x)), T((x) => f(x) || x === b1 || x === a2)];
          return {
            q: `実数全体を全体集合とし、${tex(`A=\\{x\\mid ${a1}${lt(e1)} x${lt(e2)} ${a2}\\}`)}、${tex(`B=\\{x\\mid ${b1}${lt(e3)} x${lt(e4)} ${b2}\\}`)} とする。${tex(name)} を表すものは？`,
            ans: ok,
            choices: choices4(r, ok, traps, (i) => T((x) => f(x) || x === a1 + i)),
            hint: "数直線に $A$ と $B$ をかき、端の値（●か○か）に注意して範囲を読み取る。上の線は「でない」部分。",
            steps: [
              `数直線で $A$ は $${a1}$ から $${a2}$、$B$ は $${b1}$ から $${b2}$（端の等号に注意）`,
              `$${name}$ は ${ok}`,
            ],
          };
        }),
        t("HI-shugo-2d", (r) => {
          const a = r(-3, 5), b = r(-3, 5), kind = r(0, 2);
          const NOT = { ">": "\\leqq", "\\geqq": "<", "<": "\\geqq", "\\leqq": ">" };
          const o1 = pick(r, [">", "\\geqq", "<", "\\leqq"]), o2 = pick(r, [">", "\\geqq", "<", "\\leqq"]);
          const C1 = `x${o1} ${a}`, C2 = `y${o2} ${b}`, N1 = `x${NOT[o1]} ${a}`, N2 = `y${NOT[o2]} ${b}`;
          const W1 = `x${{ ">": "<", "\\geqq": "\\leqq", "<": ">", "\\leqq": "\\geqq" }[o1]} ${a}`, W2 = `y${{ ">": "<", "\\geqq": "\\leqq", "<": ">", "\\leqq": "\\geqq" }[o2]} ${b}`;
          const J = (p, c, q) => `$${p}$ ${c} $${q}$`;
          if (kind === 2) {
            const lo = r(-4, 2), hi = lo + r(1, 5), e1 = r(0, 1) === 1, e2 = r(0, 1) === 1;
            const P = `${lo}${e1 ? "\\leqq" : "<"} x${e2 ? "\\leqq" : "<"} ${hi}`;
            const ok = J(`x${e1 ? "<" : "\\leqq"} ${lo}`, "または", `x${e2 ? ">" : "\\geqq"} ${hi}`);
            return {
              q: `条件「${tex(P)}」の否定は？`,
              ans: ok,
              choices: choices4(r, ok, [J(`x${e1 ? "<" : "\\leqq"} ${lo}`, "かつ", `x${e2 ? ">" : "\\geqq"} ${hi}`), J(`x${e1 ? "\\leqq" : "<"} ${lo}`, "または", `x${e2 ? "\\geqq" : ">"} ${hi}`), J(`x${e1 ? "\\geqq" : ">"} ${lo}`, "または", `x${e2 ? "\\leqq" : "<"} ${hi}`)]),
              hint: "「$a\\leqq x\\leqq b$」は「$x\\geqq a$ かつ $x\\leqq b$」のこと。「かつ」の否定は「または」。",
              steps: [`「${tex(P)}」は「${J(`x${e1 ? "\\geqq" : ">"} ${lo}`, "かつ", `x${e2 ? "\\leqq" : "<"} ${hi}`)}」`, `否定は「${ok}」`],
            };
          }
          const and = kind === 0;
          const ok = J(N1, and ? "または" : "かつ", N2);
          return {
            q: `${tex("x,\\ y")} は実数とする。条件「${J(C1, and ? "かつ" : "または", C2)}」の否定は？`,
            ans: ok,
            choices: choices4(r, ok, [J(N1, and ? "かつ" : "または", N2), J(W1, and ? "または" : "かつ", W2), J(W1, and ? "かつ" : "または", W2)]),
            hint: "ド・モルガンの法則：「$p$ かつ $q$」の否定は「$\\overline{p}$ または $\\overline{q}$」、「$p$ または $q$」の否定は「$\\overline{p}$ かつ $\\overline{q}$」。",
            steps: [`$${C1}$ の否定は $${N1}$、$${C2}$ の否定は $${N2}$`, `「${and ? "かつ" : "または"}」は「${and ? "または" : "かつ"}」に変わるので「${ok}」`],
          };
        }),
        t("HI-shugo-2e", (r) => {
          const k = r(1, 5);
          const T = [
            [`x>${k + 1}`, `x>${k}`], [`x=${k}`, `x^{2}=${k * k}`], [`x^{2}<${k * k}`, `x<${k}`], [`|x|<${k}`, `x>-${k}`], [`x>${k}`, `x^{2}>${k * k}`],
          ];
          const F = [
            [`x^{2}=${k * k}`, `x=${k}`, `x=-${k}`], [`x<${k}`, `x^{2}<${k * k}`, `x=-${k + 1}`], [`x^{2}>${k * k}`, `x>${k}`, `x=-${k + 1}`],
            [`|x|>${k}`, `x>${k}`, `x=-${k + 1}`], [`x>${k}`, `x>${k + 1}`, `x=${k + 1}`], [`x>-${k}`, `|x|<${k}`, `x=${k}`],
          ];
          const v = pick(r, ["x", "t", "a"]), askTrue = r(0, 1) === 1;
          const S = ([p, q]) => `$${p.replace(/x/g, v)}$ ならば $${q.replace(/x/g, v)}$`;
          if (askTrue) {
            const t0 = pick(r, T), fs = sample(r, F, 3);
            const ok = S(t0);
            return {
              q: `${tex(v)} は実数とする。次の命題のうち、真であるものは？`,
              ans: ok,
              choices: choices4(r, ok, fs.map(S)),
              hint: "偽の命題は、仮定を満たすのに結論を満たさない例（反例）が1つあればよい。",
              steps: [...fs.map((f) => `「${S(f)}」は偽（反例 $${f[2].replace(/x/g, v)}$）`), `よって真であるのは「${ok}」`],
            };
          }
          const f0 = pick(r, F), ts = sample(r, T, 3);
          const ok = S(f0);
          return {
            q: `${tex(v)} は実数とする。次の命題のうち、偽であるものは？`,
            ans: ok,
            choices: choices4(r, ok, ts.map(S)),
            hint: "偽の命題は、仮定を満たすのに結論を満たさない例（反例）が1つあればよい。",
            steps: [`「${ok}」は反例 $${f0[2].replace(/x/g, v)}$ があるので偽`, "ほかの3つは、仮定を満たすものがすべて結論を満たすので真"],
          };
        }),
      ],
      3: [
        t("HI-shugo-3b", (r) => {
          const L = -r(1, 6), U = r(1, 6);
          if (-L === U) return { skip: true };
          const suf = r(0, 1) === 1;
          const v = suf ? Math.max(-L, U) : Math.min(-L, U);
          return {
            q: `条件 ${tex("p")}：${tex(`${L}\\leqq x\\leqq ${U}`)}、条件 ${tex("q")}：${tex("|x|\\leqq a")}（${tex("a")} は正の定数）について、${tex("p")} が ${tex("q")} であるための${suf ? "十分条件となる a の最小値" : "必要条件となる a の最大値"}は？`.replace(" a の", " $a$ の"),
            ans: v,
            hint: "条件を集合で表す。「$p$ が十分条件」は $P\\subset Q$、「$p$ が必要条件」は $Q\\subset P$。",
            steps: [
              `$Q$：$-a\\leqq x\\leqq a$`,
              suf ? `$P\\subset Q$ となるには $-a\\leqq ${L}$ かつ $${U}\\leqq a$` : `$Q\\subset P$ となるには $${L}\\leqq -a$ かつ $a\\leqq ${U}$`,
              suf ? `$a\\geqq ${Math.max(-L, U)}$ なので最小値は ${v}` : `$a\\leqq ${Math.min(-L, U)}$ なので最大値は ${v}`,
            ],
          };
        }),
        t("HI-shugo-3c", (r) => {
          const a0 = pick(r, [-3, -2, -1, 1, 2, 3]), m = r(3, 9), e = m - a0 * a0, d = m - a0;
          const others = sample(r, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].filter((x) => x !== m && x !== m - 2 * a0), 4);
          const [c1, c2, c3, c4] = others;
          const elA = shuffle(r, [String(c1), String(c2), `a^{2}${sh(e)}`]), elB = shuffle(r, [`a${sh(d)}`, String(c3), String(c4)]);
          return {
            q: `${tex(`A=\\{${elA.join(",\\ ")}\\}`)}、${tex(`B=\\{${elB.join(",\\ ")}\\}`)} について、${tex(`A\\cap B=\\{${m}\\}`)} となるような定数 ${tex("a")} の値は？`,
            ans: a0,
            hint: `${m} は $A$ の要素なので、まず $A$ の中で ${m} になれる要素を考える。求めた値が条件を満たすか必ず確かめる。`,
            steps: [
              `$${m}\\in A$ より $a^{2}${sh(e)}=${m}$、$a^{2}=${a0 * a0}$、$a=\\pm ${Math.abs(a0)}$`,
              `$a=${-a0}$ のとき $B=\\{${elB.map((x) => x === `a${sh(d)}` ? String(-a0 + d) : x).join(",\\ ")}\\}$ で ${m} を含まないので不適`,
              `$a=${a0}$ のとき $B=\\{${elB.map((x) => x === `a${sh(d)}` ? String(a0 + d) : x).join(",\\ ")}\\}$、$A\\cap B=\\{${m}\\}$ となり適する。よって $a=${a0}$`,
            ],
          };
        }),
        t("HI-shugo-3d", (r) => {
          const U = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
          const reg = U.map(() => r(0, 3)); // 0:A∩B 1:A∩B̄ 2:Ā∩B 3:Ā∩B̄
          const R = [0, 1, 2, 3].map((k) => U.filter((x, i) => reg[i] === k));
          if (R.some((g) => g.length === 0)) return { skip: true };
          const askA = r(0, 1) === 1;
          const hide = askA ? 1 : 2; // 求める集合の片側の部分を隠す
          const name = ["A\\cap B", "A\\cap\\overline{B}", "\\overline{A}\\cap B", "\\overline{A}\\cap\\overline{B}"];
          const given = [0, 1, 2, 3].filter((k) => k !== hide);
          const ST = (arr) => tex(`\\{${[...arr].sort((u, v) => u - v).join(",")}\\}`);
          const ans = askA ? [...R[0], ...R[1]] : [...R[0], ...R[2]];
          const ok = ST(ans);
          const traps = [ST(R[0]), ST(askA ? [...R[0], ...R[2]] : [...R[0], ...R[1]]), ST([...R[0], ...R[3]]), ST(R[hide]), ST([...R[hide], ...R[3]])];
          return {
            q: `全体集合 ${tex("U=\\{1,2,3,\\ldots,10\\}")} の部分集合 ${tex("A,\\ B")} について、${given.map((k) => tex(`${name[k]}=\\{${R[k].join(",")}\\}`)).join("、")} であるとき、${tex(askA ? "A" : "B")} は？`,
            ans: ok,
            choices: choices4(r, ok, traps),
            hint: "4つの部分 $A\\cap B$、$A\\cap\\overline{B}$、$\\overline{A}\\cap B$、$\\overline{A}\\cap\\overline{B}$ に分けた図（ベン図）をかき、残りの部分を求める。",
            steps: [
              `残りの $${name[hide]}$ は $U$ から与えられた3つを除いたもの：$\\{${R[hide].join(",")}\\}$`,
              askA ? "$A=(A\\cap B)\\cup(A\\cap\\overline{B})$" : "$B=(A\\cap B)\\cup(\\overline{A}\\cap B)$",
              `$${askA ? "A" : "B"}=${ok.slice(1, -1)}$`,
            ],
          };
        }),
        t("HI-shugo-3e", (r) => {
          const k = r(1, 5), kind = r(0, 2);
          const J = (p, c, q) => `$${p}$ ${c} $${q}$`;
          let P, ok, wr;
          if (kind === 0) {
            P = `$x+y>${2 * k}$ ならば ${J(`x>${k}`, "または", `y>${k}`)}`;
            ok = `${J(`x\\leqq ${k}`, "かつ", `y\\leqq ${k}`)} ならば $x+y\\leqq ${2 * k}$`;
            wr = [`${J(`x\\leqq ${k}`, "または", `y\\leqq ${k}`)} ならば $x+y\\leqq ${2 * k}$`, `${J(`x>${k}`, "または", `y>${k}`)} ならば $x+y>${2 * k}$`, `$x+y\\leqq ${2 * k}$ ならば ${J(`x\\leqq ${k}`, "かつ", `y\\leqq ${k}`)}`];
          } else if (kind === 1) {
            P = `${J(`x>${k}`, "かつ", `y>${k}`)} ならば $x+y>${2 * k}$`;
            ok = `$x+y\\leqq ${2 * k}$ ならば ${J(`x\\leqq ${k}`, "または", `y\\leqq ${k}`)}`;
            wr = [`$x+y\\leqq ${2 * k}$ ならば ${J(`x\\leqq ${k}`, "かつ", `y\\leqq ${k}`)}`, `$x+y>${2 * k}$ ならば ${J(`x>${k}`, "かつ", `y>${k}`)}`, `${J(`x\\leqq ${k}`, "または", `y\\leqq ${k}`)} ならば $x+y\\leqq ${2 * k}$`];
          } else {
            P = `$x^{2}+y^{2}>${2 * k * k}$ ならば ${J(`|x|>${k}`, "または", `|y|>${k}`)}`;
            ok = `${J(`|x|\\leqq ${k}`, "かつ", `|y|\\leqq ${k}`)} ならば $x^{2}+y^{2}\\leqq ${2 * k * k}$`;
            wr = [`${J(`|x|\\leqq ${k}`, "または", `|y|\\leqq ${k}`)} ならば $x^{2}+y^{2}\\leqq ${2 * k * k}$`, `${J(`|x|>${k}`, "または", `|y|>${k}`)} ならば $x^{2}+y^{2}>${2 * k * k}$`, `$x^{2}+y^{2}\\leqq ${2 * k * k}$ ならば ${J(`|x|\\leqq ${k}`, "かつ", `|y|\\leqq ${k}`)}`];
          }
          return {
            q: `${tex("x,\\ y")} は実数とする。命題「${P}」の対偶は？`,
            ans: ok,
            choices: choices4(r, ok, wr),
            hint: "$p\\Rightarrow q$ の対偶は $\\overline{q}\\Rightarrow\\overline{p}$。「または」の否定は「かつ」、「かつ」の否定は「または」になる。",
            steps: ["対偶は「(結論の否定) ならば (仮定の否定)」", "結論・仮定をそれぞれ否定するとき、「かつ」と「または」が入れかわる", `「${ok}」`],
          };
        }),
      ],
      4: [
        t("HI-shugo-4b", (r) => {
          const c = r(-3, 3), d = r(3, 7), a = c + r(-(d - 1), d - 1);
          const suf = r(0, 1) === 1;
          const m1 = a - c + d, m2 = c + d - a;
          const v = suf ? Math.min(m1, m2) : Math.max(m1, m2);
          return {
            q: `条件 ${tex("p")}：${tex(`|x${sh(-a)}|<b`)}（${tex("b")} は正の定数）、条件 ${tex("q")}：${tex(`|x${sh(-c)}|<${d}`)} について、${tex("p")} が ${tex("q")} であるための${suf ? "十分条件" : "必要条件"}となるような ${tex("b")} の${suf ? "最大値" : "最小値"}は？`,
            ans: v,
            hint: "それぞれ区間に直し、どちらの区間がどちらに含まれればよいかを考える。端の値の扱いに注意。",
            steps: [
              `$p$：$${a}-b<x<${a}+b$、$q$：$${c - d}<x<${c + d}$`,
              suf ? `$p\\Rightarrow q$ より $${c - d}\\leqq ${a}-b$ かつ $${a}+b\\leqq ${c + d}$` : `$q\\Rightarrow p$ より $${a}-b\\leqq ${c - d}$ かつ $${c + d}\\leqq ${a}+b$`,
              suf ? `$b\\leqq ${m1}$ かつ $b\\leqq ${m2}$ より最大値は ${v}` : `$b\\geqq ${m1}$ かつ $b\\geqq ${m2}$ より最小値は ${v}`,
            ],
          };
        }),
        t("HI-shugo-4c", (r) => {
          const L = [
            ["x>0 \\text{ and } y>0", "x+y>0,\\ xy>0", true, true, "和も積も正", "積が正なら同符号で、和が正なので両方正"],
            ["x+y>0", "x>0,\\ y>0", false, true, "反例 $x=3,\\ y=-1$", "両方正なら和も正"],
            ["xy>0", "x>0,\\ y>0", false, true, "反例 $x=y=-1$", "両方正なら積も正"],
            ["x^{2}+y^{2}=0", "x=y=0", true, true, "$x^{2}\\geqq 0,\\ y^{2}\\geqq 0$ より両方0", "代入すれば成り立つ"],
            ["x>1,\\ y>1", "x+y>2,\\ xy>1", true, false, "両方1より大きければ和は2より、積は1より大きい", "反例 $x=\\frac{1}{2},\\ y=4$"],
            ["x^{2}=y^{2}", "x=y", false, true, "反例 $x=1,\\ y=-1$", "$x=y$ なら $x^{2}=y^{2}$"],
            ["x>y", "x^{2}>y^{2}", false, false, "反例 $x=1,\\ y=-2$", "反例 $x=-2,\\ y=1$"],
            ["xy+1=x+y", "(x-1)(y-1)=0", true, true, "移項すると $(x-1)(y-1)=0$", "展開すると $xy+1=x+y$"],
            ["x^{2}+y^{2}<1", "|x|<1,\\ |y|<1", true, false, "$x^{2}<1$ かつ $y^{2}<1$ になる", "反例 $x=y=0.9$"],
            ["|x+y|=|x|+|y|", "xy\\geqq 0", true, true, "両辺を2乗すると $xy=|xy|$", "同符号（または0）なら等号が成り立つ"],
            ["xy>1", "x>1,\\ y>1", false, true, "反例 $x=y=-2$", "両方1より大きければ積は1より大きい"],
            ["|x|+|y|<1", "x^{2}+y^{2}<1", true, false, "$x^{2}+y^{2}\\leqq(|x|+|y|)^{2}<1$", "反例 $x=y=0.6$"],
          ];
          const [P0, Q0, pq0, qp0, w10, w20] = pick(r, L);
          const sw = r(0, 1) === 1;
          const [P, Q, pq, qp, w1, w2] = sw ? [Q0, P0, qp0, pq0, w20, w10] : [P0, Q0, pq0, qp0, w10, w20];
          const ok = nsOf(pq, qp);
          const show = (s) => s.replace(" \\text{ and } ", ",\\ ");
          return {
            q: `${tex("x,\\ y")} は実数とする（「,」は「かつ」を表す）。条件 ${tex(show(P))} は、条件 ${tex(show(Q))} であるための何条件？`,
            ans: ok,
            choices: choices4(r, ok, NS.filter((s) => s !== ok)),
            hint: "両方向の真偽を調べる。偽のものは反例を探し、真のものは対偶や式変形で示す。",
            steps: [
              `前 ⇒ 後：${pq ? "真" : "偽"}（${w1}）`,
              `後 ⇒ 前：${qp ? "真" : "偽"}（${w2}）`,
              `よって ${ok}`,
            ],
          };
        }),
        t("HI-shugo-4d", (r) => {
          const suf = r(0, 1) === 1, w = suf ? r(1, 5) : r(3, 7);
          const rr = suf ? r(Math.floor(w / 2) + 1, 4) : r(1, Math.ceil(w / 2) - 1), al = r(-4, 2), be = al + w; // 十分なら 2r>w、必要なら 2r<w
          // 十分：α≦x≦β ⊂ a-r<x<a+r ⇔ β-r<a<α+r、必要：a-r<x<a+r ⊂ α≦x≦β ⇔ α+r≦a≦β-r
          const L = suf ? be - rr : al + rr, R = suf ? al + rr : be - rr;
          const S = (l, rc) => tex(`${L}${l ? "\\leqq" : "<"} a${rc ? "\\leqq" : "<"} ${R}`);
          const ok = suf ? S(false, false) : S(true, true);
          return {
            q: `${tex("x")} についての条件 ${tex(`p:\\ ${poly([1, -(al + be), al * be])}\\leqq 0`)}、${tex(`q:\\ |x-a|<${rr}`)} がある。${tex("p")} が ${tex("q")} であるための${suf ? "十分条件" : "必要条件"}となるような定数 ${tex("a")} の値の範囲は？`,
            ans: ok,
            choices: choices4(r, ok, [S(suf, suf), S(true, false), S(false, true)]),
            hint: `それぞれの条件を満たす $x$ の範囲（集合 $P,\\ Q$）を求め、${suf ? "$P\\subset Q$" : "$Q\\subset P$"} となる条件を考える。端が等しくてよいかに注意。`,
            steps: [
              `$P:\\ ${al}\\leqq x\\leqq ${be}$、$Q:\\ a-${rr}<x<a+${rr}$`,
              suf ? `$P\\subset Q$ となるのは $a-${rr}<${al}$ かつ $${be}<a+${rr}$（端は等しくてはいけない）` : `$Q\\subset P$ となるのは $${al}\\leqq a-${rr}$ かつ $a+${rr}\\leqq ${be}$（端は等しくてよい）`,
              `$${ok.slice(1, -1)}$`,
            ],
          };
        }),
        t("HI-shugo-4e", (r) => {
          const k = r(1, 5), strict = r(0, 1) === 1, two = r(0, 1) === 1;
          // 命題「すべての実数 x について x^2 + 2ax + k^2 (>,≧) 0」の否定が真となる a
          const E = two ? `x^{2}+2ax+${k * k}` : `x^{2}-2ax+${k * k}`;
          const S = (eq) => tex(`a${eq ? "\\leqq" : "<"} -${k},\\ ${k}${eq ? "\\leqq" : "<"} a`);
          const ok = S(strict);
          return {
            q: `命題「すべての実数 ${tex("x")} について ${tex(`${E}${strict ? ">" : "\\geqq"} 0`)}」の否定が真となるような、定数 ${tex("a")} の値の範囲は？`,
            ans: ok,
            choices: choices4(r, ok, [S(!strict), tex(`-${k}<a<${k}`), tex(`-${k}\\leqq a\\leqq ${k}`)]),
            hint: "「すべての $x$ について〜」の否定は「ある $x$ について〜でない」。それが真となる条件を、グラフ（判別式）で考える。",
            steps: [
              `否定は「ある実数 $x$ について $${E}${strict ? "\\leqq" : "<"} 0$」`,
              strict ? `放物線が $x$ 軸と共有点をもてばよいので $\\frac{D}{4}=a^{2}-${k * k}\\geqq 0$` : `放物線が $x$ 軸より下にくる部分があればよいので $\\frac{D}{4}=a^{2}-${k * k}>0$`,
              `$${ok.slice(1, -1)}$`,
            ],
          };
        }),
      ],
    },
  },
  // ─────────────────────────────────────────────────────
  {
    ...H,
    id: "HI-niji", area: "func", name: "2次関数のグラフ", desc: "平方完成・頂点・軸・平行移動",
    prereqs: ["J3-g3c4u1", "J3-g3c1u4"],
    points: [
      "平方完成：$y=a(x-p)^{2}+q$ の形にすると、頂点は $(p,\\ q)$、軸は $x=p$",
      "$x^{2}+bx=\\left(x+\\frac{b}{2}\\right)^{2}-\\frac{b^{2}}{4}$（$x$ の係数の半分を2乗して引く）。$a\\neq 1$ なら先に $a$ でくくる。",
      "$y=f(x)$ を $x$ 軸方向に $p$、$y$ 軸方向に $q$ 平行移動 → $y-q=f(x-p)$",
      "対称移動：$x$ 軸 → $y$ を $-y$ に、$y$ 軸 → $x$ を $-x$ に、原点 → 両方",
    ],
    levels: {
      1: [
        t("HI-niji-1a", (r) => {
          const p = rnz(r, -5, 5), c = r(-9, 9), q = c - p * p;
          const PT = (x, y) => tex(`(${x},\\ ${y})`);
          const ok = PT(p, q);
          return {
            q: `放物線 ${tex(`y=${poly([1, -2 * p, c])}`)} の頂点の座標は？`,
            ans: ok,
            choices: choices4(r, ok, [PT(-p, q), PT(2 * p, c - 4 * p * p), PT(p, c + p * p), PT(p, -q)]),
            hint: "平方完成して $y=(x-p)^{2}+q$ の形にする。",
            steps: [
              `$y=(x${signed(-p)})^{2}-${p * p}${sh(c)}$`,
              `$=(x${signed(-p)})^{2}${sh(q)}$`,
              `頂点は $(${p},\\ ${q})$`,
            ],
          };
        }),
        t("HI-niji-1b", (r) => {
          const a = rnz(r, -4, 4), b = rnz(r, -9, 9), c = r(-9, 9);
          return {
            q: `放物線 ${tex(`y=${poly([a, b, c])}`)} の軸を ${tex("x=k")} と表すとき、${tex("k")} の値は？`,
            ans: fracAns(-b, 2 * a),
            hint: "$y=ax^{2}+bx+c$ の軸は $x=-\\frac{b}{2a}$（平方完成で確かめられる）。",
            steps: [
              `$a=${a},\\ b=${b}$`,
              `$k=-\\frac{${b}}{2\\cdot (${a})}=${fracTex(-b, 2 * a)}$`,
            ],
          };
        }),
        t("HI-niji-1c", (r) => {
          const a = pick(r, [1, 2, 3, -1, -2, -3]), p = rnz(r, -5, 5), q = rnz(r, -6, 6);
          const A = a === 1 ? "" : a === -1 ? "-" : String(a);
          const S = (u, v) => `${tex("x")} 軸方向に ${tex(String(u))}、${tex("y")} 軸方向に ${tex(String(v))}`;
          const ok = S(p, q);
          return {
            q: `放物線 ${tex(`y=${A}(x${signed(-p)})^{2}${signed(q)}`)} は、放物線 ${tex(`y=${A}x^{2}`)} をどのように平行移動したもの？`,
            ans: ok,
            choices: choices4(r, ok, [S(-p, q), S(p, -q), S(-p, -q)]),
            hint: "$y=a(x-p)^{2}+q$ の頂点は $(p,\\ q)$。かっこの中の符号に注意。",
            steps: [
              `頂点は $(${p},\\ ${q})$。もとの頂点は原点 $(0,\\ 0)$`,
              `原点を $(${p},\\ ${q})$ に移す平行移動`,
            ],
          };
        }),
        t("HI-niji-1d", (r) => {
          const a = pick(r, [1, -1, 2, -2]), p = rnz(r, -4, 4), q = rnz(r, -6, 6);
          const ok = QUAD(p, q);
          return {
            q: `放物線 ${tex(`y=${poly([a, -2 * a * p, a * p * p + q])}`)} の頂点は、座標平面のどの象限にある？`,
            ans: ok,
            choices: ["第1象限", "第2象限", "第3象限", "第4象限"],
            hint: "平方完成して頂点の座標を求め、$x$ 座標・$y$ 座標の符号を見る。",
            steps: [
              `$y=${a === 1 ? "" : a === -1 ? "-" : a}${vx(p)}${sh(q)}$ より頂点は $(${p},\\ ${q})$`,
              `$x$ 座標が${p > 0 ? "正" : "負"}、$y$ 座標が${q > 0 ? "正" : "負"}なので ${ok}`,
            ],
          };
        }),
      ],
      2: [
        t("HI-niji-2a", (r) => {
          const a = pick(r, [2, 3, -2, -3]), p = rnz(r, -4, 4), q = r(-8, 8);
          const b = -2 * a * p, c = a * p * p + q;
          const f = (x) => a * x * x + b * x + c;
          const PT = (x, y) => tex(`(${x},\\ ${y})`);
          const ok = PT(p, q);
          return {
            q: `放物線 ${tex(`y=${poly([a, b, c])}`)} の頂点の座標は？`,
            ans: ok,
            choices: choices4(r, ok, [PT(-p, q), PT(a * p, f(a * p)), PT(p, -q), PT(p, c)]),
            hint: "$x^{2}$ の係数で $x$ の項までをくくってから平方完成する。",
            steps: [
              `$y=${a}(${poly([1, -2 * p, 0])})${sh(c)}$`,
              `$=${a}\\{(x${signed(-p)})^{2}-${p * p}\\}${sh(c)}=${a}(x${signed(-p)})^{2}${sh(q)}$`,
              `頂点は $(${p},\\ ${q})$`,
            ],
          };
        }),
        t("HI-niji-2b", (r) => {
          const a = rnz(r, -3, 3), b = r(-5, 5), c = r(-5, 5);
          const xs = sample(r, [-2, -1, 0, 1, 2, 3], 3).sort((u, v) => u - v);
          const pts = xs.map((x) => [x, a * x * x + b * x + c]);
          const ask = pick(r, ["a", "b", "c"]);
          const v = { a, b, c }[ask];
          return {
            q: `2次関数 ${tex("y=ax^{2}+bx+c")} のグラフが3点 ${pts.map(([x, y]) => tex(`(${x},\\ ${y})`)).join("、")} を通るとき、${tex(ask)} の値は？`,
            ans: v,
            hint: "3点の座標を代入して、$a,\\ b,\\ c$ の連立方程式を作る。2式ずつ引いて $c$ を消す。",
            steps: [
              `${pts.map(([x, y]) => `\$${y}=${mpoly([[x * x, "a"], [x, "b"], [1, "c"]])}\$`).join("、")}`,
              `これを解いて $a=${a},\\ b=${b},\\ c=${c}$`,
            ],
          };
        }),
        t("HI-niji-2c", (r) => {
          const B = r(-6, 6), C = r(-6, 6), h = rnz(r, -4, 4), k = rnz(r, -5, 5);
          const mv = (hh, kk) => [1, B - 2 * hh, hh * hh - B * hh + C + kk];
          const W = (c) => [tex(`y=${poly(c)}`), pkey(c)];
          return {
            q: `放物線 ${tex(`y=${poly([1, B, C])}`)} を ${tex("x")} 軸方向に ${tex(String(h))}、${tex("y")} 軸方向に ${tex(String(k))} だけ平行移動した放物線の方程式は？`,
            ...ec(r, W(mv(h, k)), [W(mv(-h, -k)), W(mv(-h, k)), W(mv(h, -k))], (i) => W(mv(h, k + i + 1))),
            hint: "$x$ を $x-p$ に、$y$ を $y-q$ に置き換える。",
            steps: [
              `$y${signed(-k)}=(x${signed(-h)})^{2}${signedVar(B, `(x${signed(-h)})`)}${sh(C)}$`,
              `展開して整理すると $y=${poly(mv(h, k))}$`,
            ],
          };
        }),
        t("HI-niji-2d", (r) => {
          const a = pick(r, [1, 2, 3, -1, -2, -3]), p = rnz(r, -3, 3), q = r(-6, 6), x1 = p + rnz(r, -3, 3), y1 = a * (x1 - p) ** 2 + q;
          const V = (A, P, Qv) => [A, -2 * A * P, A * P * P + Qv];
          const W = (c) => [tex(`y=${poly(c)}`), pkey(c)];
          const a2 = (y1 - q) / (x1 - p);
          return {
            q: `頂点が点 ${tex(`(${p},\\ ${q})`)} で、点 ${tex(`(${x1},\\ ${y1})`)} を通る放物線の方程式は？`,
            ...ec(r, W(V(a, p, q)), [W(V(a, -p, q)), Number.isInteger(a2) ? W(V(a2, p, q)) : null, W(V(-a, p, q)), W(V(a, p, -q))], (i) => W(V(a, p, q + i + 1))),
            hint: "頂点が $(p,\\ q)$ なので $y=a(x-p)^{2}+q$ とおき、通る点を代入して $a$ を求める。",
            steps: [
              `$y=a${vx(p)}${sh(q)}$ とおく`,
              `点 $(${x1},\\ ${y1})$ を通るので $${y1}=a\\cdot (${x1 - p})^{2}${sh(q)}$、$a=${a}$`,
              `$y=${a === 1 ? "" : a === -1 ? "-" : a}${vx(p)}${sh(q)}=${poly(V(a, p, q))}$`,
            ],
          };
        }),
      ],
      3: [
        t("HI-niji-3a", (r) => {
          const a = rnz(r, -3, 3), p = r(-3, 3), q = r(-6, 6);
          const [x1, x2] = sample(r, [-3, -2, -1, 0, 1, 2, 3, 4].map((d) => p + d).filter((x) => x !== p), 2);
          if ((x1 - p) ** 2 === (x2 - p) ** 2) return { skip: true };
          const f = (x) => a * (x - p) ** 2 + q;
          const askA = r(0, 1) === 1;
          const u1 = (x1 - p) ** 2, u2 = (x2 - p) ** 2;
          return {
            q: `軸が直線 ${tex(`x=${p}`)} で、2点 ${tex(`(${x1},\\ ${f(x1)})`)}、${tex(`(${x2},\\ ${f(x2)})`)} を通る放物線を ${tex(`y=a${vx(p)}+q`)} と表すとき、${tex(askA ? "a" : "q")} の値は？`,
            ans: askA ? a : q,
            hint: "軸がわかっているので $y=a(x-p)^{2}+q$ とおき、2点を代入する。",
            steps: [
              `$${f(x1)}=${coefVar(u1, "a")}+q$、$${f(x2)}=${coefVar(u2, "a")}+q$`,
              `辺々引いて $${f(x1) - f(x2)}=${coefVar(u1 - u2, "a")}$ より $a=${a}$`,
              `$q=${f(x1)}-${u1}\\cdot (${a})=${q}$`,
            ],
          };
        }),
        t("HI-niji-3b", (r) => {
          const a = rnz(r, -3, 3), b = rnz(r, -6, 6), c = rnz(r, -6, 6);
          const kinds = { "x 軸": [-a, -b, -c], "y 軸": [a, -b, c], 原点: [-a, b, -c] };
          const ask = pick(r, Object.keys(kinds));
          const W = (cf) => [tex(`y=${poly(cf)}`), pkey(cf)];
          const others = Object.keys(kinds).filter((k) => k !== ask).map((k) => W(kinds[k]));
          const label = ask === "原点" ? "原点" : `${tex(ask[0])} 軸`;
          const rule = { "x 軸": "$y$ を $-y$ に置き換える", "y 軸": "$x$ を $-x$ に置き換える", 原点: "$x$ を $-x$ に、$y$ を $-y$ に置き換える" }[ask];
          return {
            q: `放物線 ${tex(`y=${poly([a, b, c])}`)} を${label}に関して対称移動した放物線の方程式は？`,
            ...ec(r, W(kinds[ask]), [...others, W([a, b, -c]), W([-a, -b, c])]),
            hint: "対称移動では、$x$ や $y$ をどう置き換えるかを考える。",
            steps: [rule, `$y=${poly(kinds[ask])}$`],
          };
        }),
        t("HI-niji-3c", (r) => {
          const a = pick(r, [1, 2, 3, -1, -2, -3]), [al, be] = sample(r, [-4, -3, -2, -1, 0, 1, 2, 3, 4, 5], 2).sort((u, v) => u - v);
          const cand = [-4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6].filter((x) => x !== al && x !== be);
          const x1 = pick(r, cand), y1 = a * (x1 - al) * (x1 - be);
          const vy = [-a * (be - al) ** 2, 4]; // a((β-α)/2)^2 の符号反転：頂点 y = -a(β-α)^2/4
          return {
            q: `放物線が ${tex("x")} 軸と2点 ${tex(`(${al},\\ 0)`)}、${tex(`(${be},\\ 0)`)} で交わり、点 ${tex(`(${x1},\\ ${y1})`)} を通るとき、この放物線の頂点の ${tex("y")} 座標は？`,
            ans: fracAns(...vy),
            hint: "$x$ 軸との交点が $\\alpha,\\ \\beta$ なら $y=a(x-\\alpha)(x-\\beta)$ とおける。",
            steps: [
              `$y=a(x${sh(-al)})(x${sh(-be)})$ とおき、点 $(${x1},\\ ${y1})$ を代入して $${y1}=a\\cdot (${x1 - al})\\cdot (${x1 - be})$、$a=${a}$`,
              `軸は $x=${fracTex(al + be, 2)}$（2つの交点の真ん中）`,
              `頂点の $y$ 座標は $${a}\\cdot \\left(${fracTex(al + be, 2)}${al === 0 ? "" : `-(${al})`}\\right)\\left(${fracTex(al + be, 2)}-(${be})\\right)=${fracTex(...vy)}$`,
            ],
          };
        }),
        t("HI-niji-3d", (r) => {
          const a = pick(r, [1, -1]), p = rnz(r, -4, 4), q = rnz(r, -6, 6), c = a * p * p + q;
          if (c === 0) return { skip: true };
          const b = -2 * a * p;
          const sg = (v) => (v > 0 ? ">0" : "<0");
          const T = (sa, sb, sc) => tex(`a${sa},\\ b${sb},\\ c${sc}`);
          const ok = T(sg(a), sg(b), sg(c));
          return {
            q: `放物線 ${tex("y=ax^{2}+bx+c")} は${a > 0 ? "下に凸" : "上に凸"}で、頂点は${QUAD(p, q)}にあり、${tex("y")} 軸とは ${tex(c > 0 ? "y>0" : "y<0")} の部分で交わる。${tex("a,\\ b,\\ c")} の符号の組み合わせは？`,
            ans: ok,
            choices: choices4(r, ok, [T(sg(a), sg(-b), sg(c)), T(sg(a), sg(b), sg(-c)), T(sg(-a), sg(b), sg(c)), T(sg(-a), sg(-b), sg(c))]),
            hint: "凸の向きで $a$、$y$ 軸との交点で $c$ がわかる。軸 $x=-\\frac{b}{2a}$ の位置（頂点の $x$ 座標の符号）から $b$ の符号を決める。",
            steps: [
              `${a > 0 ? "下に凸" : "上に凸"}なので $a${sg(a)}$、$y$ 軸との交点は $(0,\\ c)$ なので $c${sg(c)}$`,
              `頂点は${QUAD(p, q)}なので軸 $x=-\\frac{b}{2a}$ は ${p > 0 ? "正" : "負"}`,
              `$a${sg(a)}$ だから $b${sg(b)}$`,
            ],
          };
        }),
      ],
      4: [
        t("HI-niji-4a", (r) => {
          const a = pick(r, [1, 2, -1, 3]), p1 = r(-4, 4), q1 = r(-6, 6), h = rnz(r, -4, 4), k = rnz(r, -5, 5);
          const p2 = p1 + h, q2 = q1 + k;
          const F = (p, q) => poly([a, -2 * a * p, a * p * p + q]);
          const S = (u, v) => tex(`h=${u},\\ k=${v}`);
          const ok = S(h, k);
          return {
            q: `放物線 ${tex(`y=${F(p1, q1)}`)} を ${tex("x")} 軸方向に ${tex("h")}、${tex("y")} 軸方向に ${tex("k")} だけ平行移動すると、放物線 ${tex(`y=${F(p2, q2)}`)} に重なった。${tex("h,\\ k")} の値は？`,
            ans: ok,
            choices: choices4(r, ok, [S(-h, -k), S(-h, k), S(h, -k)]),
            hint: "式どうしを比べるより、2つの放物線の頂点の移動を考える方が早い。",
            steps: [
              `移動前の頂点 $(${p1},\\ ${q1})$、移動後の頂点 $(${p2},\\ ${q2})$`,
              `$h=${p2}-(${p1})=${h}$、$k=${q2}-(${q1})=${k}$`,
            ],
          };
        }),
        t("HI-niji-4b", (r) => {
          const k = r(2, 3), l = rnz(r, -6, 6), c = r(-5, 5);
          const K = k - 1;
          const mn = fracAns(4 * K * c - l * l, 4 * K);
          return {
            q: `${tex("a")} を実数の定数とする。放物線 ${tex(`y=x^{2}-2ax+${mpoly([[k, "a^{2}"], [l, "a"], [c, ""]])}`)} の頂点の ${tex("y")} 座標が最小となるときの、その最小値は？`,
            ans: mn,
            hint: "まず頂点の $y$ 座標を $a$ の式で表す。それは $a$ の2次関数になる。",
            steps: [
              `$y=(x-a)^{2}-a^{2}+${mpoly([[k, "a^{2}"], [l, "a"], [c, ""]])}$ より頂点の $y$ 座標は $${mpoly([[K, "a^{2}"], [l, "a"], [c, ""]])}$`,
              `$=${K === 1 ? "" : K}\\left(a${l > 0 ? "+" : "-"}${fracTex(Math.abs(l), 2 * K)}\\right)^{2}${4 * K * c - l * l === 0 ? "" : (4 * K * c - l * l > 0 ? "+" : "") + fracTex(4 * K * c - l * l, 4 * K)}$`,
              `$a=${fracTex(-l, 2 * K)}$ のとき最小値 $${fracTex(4 * K * c - l * l, 4 * K)}$`,
            ],
          };
        }),
        t("HI-niji-4c", (r) => {
          const al = r(-5, 1), w = 2 * r(1, 3), be = al + w, m = (al + be) / 2, M = (w / 2) ** 2;
          const f = poly([1, -(al + be), al * be]);
          const ask3 = r(0, 1) === 1;
          const base = {
            hint: "$y=|f(x)|$ のグラフは、$y=f(x)$ の $x$ 軸より下の部分を $x$ 軸に関して折り返したもの。直線 $y=k$ を上下に動かして交点を数える。",
            steps: [
              `$${f}=${vx(m)}-${M}$ なので、頂点 $(${m},\\ -${M})$ が折り返されて $(${m},\\ ${M})$ になる`,
              `$0<k<${M}$ で4個、$k=${M}$ で3個、$k=0$ または $k>${M}$ で2個`,
            ],
          };
          if (ask3) return { q: `関数 ${tex(`y=|${f}|`)} のグラフと直線 ${tex("y=k")} の共有点がちょうど3個となるような定数 ${tex("k")} の値は？`, ans: M, ...base };
          const ok = tex(`0<k<${M}`);
          return {
            q: `関数 ${tex(`y=|${f}|`)} のグラフと直線 ${tex("y=k")} の共有点がちょうど4個となるような定数 ${tex("k")} の値の範囲は？`,
            ans: ok,
            choices: choices4(r, ok, [tex(`0\\leqq k\\leqq ${M}`), tex(`k>${M}`), tex(`0<k<${al * be < 0 ? -al * be : M + 1}`), tex(`-${M}<k<${M}`)]),
            ...base,
          };
        }),
        t("HI-niji-4d", (r) => {
          const m = pick(r, [-2, 2, -3, 3, -4, 4]), h = rnz(r, -3, 3), p = r(-4, 4), rr = r(-5, 5);
          const E = mpoly([[1, "x^{2}"], [m, "ax"], [p, "x"], [-m * h, "a"], [rr, ""]]);
          const Y = h * h + p * h + rr;
          const P = (x, y) => tex(`(${x},\\ ${y})`);
          const ok = P(h, Y);
          return {
            q: `${tex("a")} がどんな値をとっても、放物線 ${tex(`y=${E}`)} が通る点の座標は？`,
            ans: ok,
            choices: choices4(r, ok, [P(-h, h * h - p * h + rr), P(h, rr), P(0, rr), P(h, Y + m * h)], (i) => P(h, Y + i + 1)),
            hint: "$a$ について整理し、「$a$ がどんな値でも成り立つ」ためには $a$ の係数が0、残りも等しくなればよい。",
            steps: [
              `$a$ について整理すると $${mpoly([[m, "x"], [-m * h, ""]])}$ が $a$ の係数：$y=${mpoly([[1, "x^{2}"], [p, "x"], [rr, ""]])}+(${mpoly([[m, "x"], [-m * h, ""]])})a$`,
              `どんな $a$ でも成り立つのは $${mpoly([[m, "x"], [-m * h, ""]])}=0$、すなわち $x=${h}$ のとき`,
              `そのとき $y=${h * h}${sh(p * h)}${sh(rr)}=${Y}$ なので、点 $(${h},\\ ${Y})$`,
            ],
          };
        }),
      ],
    },
  },
  // ─────────────────────────────────────────────────────
  {
    ...H,
    id: "HI-saidai", area: "func", name: "2次関数の最大・最小", desc: "定義域・軸の位置で場合分け",
    prereqs: ["HI-niji", "J1-h4"],
    points: [
      "まず平方完成して頂点と軸を調べる。定義域があるときはグラフをかいて、頂点と両端の値を比べる。",
      "下に凸 ($a>0$) のとき、最小値は「軸が定義域の中なら頂点、外なら軸に近い端」。",
      "最大値は「軸から遠い端」。軸が定義域の中央より左か右かで場合分け。",
      "条件式があるときは1文字を消去して1変数の2次関数にする（消した文字の範囲にも注意）。",
    ],
    levels: {
      1: [
        t("HI-saidai-1a", (r) => {
          const p = r(-3, 3), c = r(-5, 5), s = p - r(1, 3), tt = p + r(1, 4), q = c - p * p;
          const f = (x) => (x - p) ** 2 + q;
          const askMax = r(0, 1) === 1;
          const M = Math.max(f(s), f(tt));
          return {
            q: `2次関数 ${tex(`y=${poly([1, -2 * p, c])}\\ (${s}\\leqq x\\leqq ${tt})`)} の${askMax ? "最大値" : "最小値"}は？`,
            ans: askMax ? M : q,
            hint: "平方完成して頂点を求め、定義域の両端の値と比べる。",
            steps: [
              `$y=${vx(p)}${sh(q)}$。軸 $x=${p}$ は定義域の中にある`,
              `$x=${s}$ のとき $y=${f(s)}$、$x=${tt}$ のとき $y=${f(tt)}$、頂点で $y=${q}$`,
              askMax ? `最大値は ${M}（軸から遠い端）` : `最小値は頂点の ${q}`,
            ],
          };
        }),
        t("HI-saidai-1b", (r) => {
          const a = rnz(r, -3, 3), p = r(-4, 4), q = r(-8, 8);
          const b = -2 * a * p, c = a * p * p + q;
          return {
            q: `2次関数 ${tex(`y=${poly([a, b, c])}`)} の${a > 0 ? "最小値" : "最大値"}は？`,
            ans: q,
            hint: `平方完成して頂点を求める。$x^{2}$ の係数が${a > 0 ? "正なので下に凸" : "負なので上に凸"}。`,
            steps: [
              `$y=${a === 1 ? "" : a === -1 ? "-" : a}${vx(p)}${sh(q)}$`,
              `$x=${p}$ のとき${a > 0 ? "最小値" : "最大値"} ${q}`,
            ],
          };
        }),
      ],
      2: [
        t("HI-saidai-2a", (r) => {
          const p = r(-3, 3), c = r(-5, 5), left = r(0, 1) === 1;
          const s = left ? p + r(1, 3) : p - r(4, 6), tt = s + r(1, 3);
          const q = c - p * p, f = (x) => (x - p) ** 2 + q;
          const askMax = r(0, 1) === 1;
          const v = askMax ? Math.max(f(s), f(tt)) : Math.min(f(s), f(tt));
          return {
            q: `2次関数 ${tex(`y=${poly([1, -2 * p, c])}\\ (${s}\\leqq x\\leqq ${tt})`)} の${askMax ? "最大値" : "最小値"}は？`,
            ans: v,
            hint: "軸が定義域の中にあるか外にあるかを確かめる。外にあるなら、定義域でのグラフは増加だけ（または減少だけ）。",
            steps: [
              `$y=${vx(p)}${sh(q)}$。軸 $x=${p}$ は定義域の${left ? "左" : "右"}側の外`,
              `定義域では${left ? "増加" : "減少"}する。$f(${s})=${f(s)}$、$f(${tt})=${f(tt)}$`,
              `${askMax ? "最大値" : "最小値"}は ${v}`,
            ],
          };
        }),
        t("HI-saidai-2b", (r) => {
          const a = -r(1, 2), p = r(-3, 3), q = r(-4, 8), s = p - r(1, 4), tt = p + r(1, 4);
          if (p - s === tt - p) return { skip: true };
          const f = (x) => a * (x - p) ** 2 + q;
          const askMax = r(0, 1) === 1;
          const mn = Math.min(f(s), f(tt));
          return {
            q: `2次関数 ${tex(`y=${poly([a, -2 * a * p, a * p * p + q])}\\ (${s}\\leqq x\\leqq ${tt})`)} の${askMax ? "最大値" : "最小値"}は？`,
            ans: askMax ? q : mn,
            hint: "上に凸のグラフ。最大は頂点（軸が定義域内のとき）、最小は軸から遠い端。",
            steps: [
              `$y=${a === -1 ? "-" : a}${vx(p)}${sh(q)}$。軸 $x=${p}$ は定義域の中`,
              `$f(${s})=${f(s)}$、$f(${tt})=${f(tt)}$`,
              askMax ? `最大値は頂点の ${q}` : `最小値は軸から遠い端の ${mn}`,
            ],
          };
        }),
      ],
      3: [
        t("HI-saidai-3a", (r) => {
          const a = rnz(r, -4, 4), k = r(1, 10);
          const A = 1 + a * a;
          return {
            q: `実数 ${tex("x,\\ y")} が ${tex(`${coefVar(a)}+y=${k}`)} を満たすとき、${tex("x^{2}+y^{2}")} の最小値は？`,
            ans: fracAns(k * k, A),
            hint: "条件式から $y$ を $x$ で表して代入し、$x$ の2次関数にする。",
            steps: [
              `$y=${poly([-a, k])}$ を代入：$x^{2}+(${poly([-a, k])})^{2}=${poly([A, -2 * a * k, k * k])}$`,
              `軸は $x=${fracTex(a * k, A)}$。これを代入すると最小`,
              `最小値は $${k * k}-\\frac{${(a * k) ** 2}}{${A}}=${fracTex(k * k, A)}$`,
            ],
          };
        }),
        t("HI-saidai-3b", (r) => {
          const d = r(1, 3), c = r(-5, 5), mid = r(0, 1) === 1;
          let a0, m;
          if (mid) { a0 = r(1, d); m = c - a0 * a0; }
          else { a0 = d + r(1, 3); m = d * d - 2 * d * a0 + c; }
          return {
            q: `${tex("a")} を正の定数とする。関数 ${tex(`y=x^{2}-2ax${sh(c)}\\ (0\\leqq x\\leqq ${d})`)} の最小値が ${tex(String(m))} であるとき、${tex("a")} の値は？`,
            ans: a0,
            hint: "軸 $x=a$ が定義域の中にあるときと、右の外にあるときで場合分けする。",
            steps: [
              `$y=(x-a)^{2}-a^{2}${sh(c)}$、軸は $x=a$`,
              `$0<a\\leqq ${d}$ のとき最小値 $-a^{2}${sh(c)}=${m}$ → $a^{2}=${c - m}$${mid ? `、$a=${a0}$（適する）` : `（$a=${sqrtTex(1, c - m)}>${d}$ なので不適）`}`,
              `$a>${d}$ のとき最小値 $f(${d})=${d * d}-${2 * d}a${sh(c)}=${m}$ → $a=${fracTex(d * d + c - m, 2 * d)}$${mid ? `（$${d}$ 以下なので不適）` : "（適する）"}`,
              `よって $a=${a0}$`,
            ],
          };
        }),
      ],
      4: [
        t("HI-saidai-4a", (r) => {
          const d = r(2, 4), k = 2 * r(1, d - 1 + (d > 2 ? 1 : 0)), c = r(-5, 5);
          if (k >= 2 * d) return { skip: true };
          const v = (k * k) / 4 + c;
          return {
            q: `${tex("a")} を定数とする。関数 ${tex(`y=x^{2}-2ax+${k}a${sh(c)}\\ (0\\leqq x\\leqq ${d})`)} の最小値を ${tex("m(a)")} とするとき、${tex("m(a)")} の最大値は？`,
            ans: v,
            hint: "軸 $x=a$ の位置で3つに場合分けして $m(a)$ を求め、$a$ の関数としての最大値を調べる。",
            steps: [
              `$a<0$ のとき $m(a)=f(0)=${k}a${sh(c)}$（増加）`,
              `$0\\leqq a\\leqq ${d}$ のとき $m(a)=f(a)=-a^{2}+${k}a${sh(c)}=-(a-${k / 2})^{2}${sh(v)}$`,
              `$a>${d}$ のとき $m(a)=f(${d})=${poly([k - 2 * d, d * d + c], "a")}$（減少）`,
              `よって $a=${k / 2}$ のとき最大値 ${v}`,
            ],
          };
        }),
        t("HI-saidai-4b", (r) => {
          const a = r(1, 2), p = r(-3, 3), q = r(-5, 5), L = 2 * r(1, 2);
          const v = a * (L / 2) ** 2 + q;
          return {
            q: `${tex("t")} を実数とする。関数 ${tex(`f(x)=${poly([a, -2 * a * p, a * p * p + q])}`)} の ${tex(`t\\leqq x\\leqq t+${L}`)} における最大値を ${tex("M(t)")} とするとき、${tex("M(t)")} の最小値は？`,
            ans: v,
            hint: "最大値は軸から遠い端でとる。区間の中央が軸より左か右かで場合分けし、$M(t)$ のグラフを考える。",
            steps: [
              `$f(x)=${a === 1 ? "" : a}${vx(p)}${sh(q)}$、軸 $x=${p}$`,
              `区間の中央 $t+${L / 2}$ が軸より左なら $M(t)=f(t)$、右なら $M(t)=f(t+${L})$`,
              `$M(t)$ が最小になるのは中央が軸と一致する $t=${p - L / 2}$ のとき`,
              `最小値は $f(${p - L / 2})=${a === 1 ? "" : `${a}\\cdot `}${(L / 2) ** 2}${sh(q)}=${v}$`,
            ],
          };
        }),
      ],
    },
  },
  // ─────────────────────────────────────────────────────
  {
    ...H,
    id: "HI-nijifuto", area: "func", name: "2次方程式と2次不等式", desc: "判別式・グラフとx軸・2次不等式",
    prereqs: ["HI-niji", "J3-g3c3u3", "HI-futoshiki"],
    points: [
      "判別式 $D=b^{2}-4ac$：$D>0$ なら異なる2つの実数解、$D=0$ なら重解、$D<0$ なら実数解なし。$b=2b'$ のときは $\\frac{D}{4}=b'^{2}-ac$",
      "$y=ax^{2}+bx+c$ のグラフと $x$ 軸の共有点の個数も $D$ の符号で決まる。",
      "$\\alpha<\\beta$ のとき $(x-\\alpha)(x-\\beta)<0 \\iff \\alpha<x<\\beta$、$(x-\\alpha)(x-\\beta)>0 \\iff x<\\alpha,\\ \\beta<x$",
      "$x^{2}$ の係数が負なら、両辺に $-1$ を掛けて正にしてから解く（不等号の向きが変わる）。",
    ],
    levels: {
      1: [
        t("HI-nijifuto-1a", (r) => {
          let a, b, c;
          if (r(0, 2) === 0) { a = rnz(r, -3, 3); const p = r(-3, 3); b = -2 * a * p; c = a * p * p; }
          else { a = rnz(r, -3, 3); b = r(-6, 6); c = r(-6, 6); }
          const D = b * b - 4 * a * c;
          const n = D > 0 ? 2 : D === 0 ? 1 : 0;
          return {
            q: `2次方程式 ${tex(`${poly([a, b, c])}=0`)} の異なる実数解の個数は？`,
            ans: n,
            unit: "個",
            hint: "判別式 $D=b^{2}-4ac$ の符号を調べる。",
            steps: [
              `$D=(${b})^{2}-4\\cdot (${a})\\cdot (${c})=${D}$`,
              D > 0 ? "$D>0$ なので異なる2つの実数解" : D === 0 ? "$D=0$ なので重解（実数解は1個）" : "$D<0$ なので実数解なし",
            ],
          };
        }),
        t("HI-nijifuto-1b", (r) => {
          const [al, be] = sample(r, [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6], 2).sort((u, v) => u - v);
          const op = pick(r, ["<", ">", "<=", ">="]);
          const inside = (A, B, eq) => tex(`${A}${eq ? "\\leqq" : "<"} x${eq ? "\\leqq" : "<"} ${B}`);
          const outside = (A, B, eq) => tex(`x${eq ? "\\leqq" : "<"} ${A},\\ ${B}${eq ? "\\leqq" : "<"} x`);
          const eq = op.length === 2, isIn = op[0] === "<";
          const ok = isIn ? inside(al, be, eq) : outside(al, be, eq);
          return {
            q: `2次不等式 ${tex(`${poly([1, -(al + be), al * be])}${OPS[op]} 0`)} を解くと？`,
            ans: ok,
            choices: choices4(r, ok, [isIn ? outside(al, be, eq) : inside(al, be, eq), isIn ? inside(-be, -al, eq) : outside(-be, -al, eq), isIn ? inside(al, be, !eq) : outside(al, be, !eq), isIn ? outside(al, be, !eq) : inside(al, be, !eq)]),
            hint: "左辺を因数分解して、グラフが $x$ 軸より下（または上）になる範囲を考える。",
            steps: [
              `$${fac2(al, be)}${OPS[op]} 0$`,
              `グラフは下に凸で $x=${al},\\ ${be}$ で $x$ 軸と交わる`,
              `${ok}`,
            ],
          };
        }),
      ],
      2: [
        t("HI-nijifuto-2a", (r) => {
          const k1 = -r(1, 5), k2 = r(1, 6);
          if (k1 + k2 === 0) return { skip: true };
          const m = k1 + k2, n = -k1 * k2;
          const askRoot = r(0, 1) === 1;
          return {
            q: `2次方程式 ${tex(`x^{2}-2kx${signedVar(m, "k")}${signed(n)}=0`)} が重解をもつような正の定数 ${tex("k")} について、${askRoot ? "そのときの重解" : tex("k") + " の値"}は？`,
            ans: k2,
            hint: "重解 ⇔ 判別式が0。$x$ の係数が偶数なので $\\frac{D}{4}$ を使うと楽。",
            steps: [
              `$\\frac{D}{4}=k^{2}-(${mpoly([[m, "k"], [n, ""]])})=${poly([1, -m, -n], "k")}=(k${sh(-k1)})(k${sh(-k2)})=0$`,
              `$k>0$ より $k=${k2}$`,
              askRoot ? `重解は $x=-\\frac{-2k}{2}=k=${k2}$` : `$k=${k2}$`,
            ],
          };
        }),
        t("HI-nijifuto-2b", (r) => {
          let p, q, rr, s;
          for (let i = 0; i < 40; i++) {
            p = r(1, 3); q = rnz(r, -6, 6); rr = r(1, 3); s = rnz(r, -6, 6);
            if (gcd(p, q) === 1 && gcd(rr, s) === 1 && q * rr !== s * p && p * rr > 1) break;
          }
          if (gcd(p, q) !== 1 || gcd(rr, s) !== 1 || q * rr === s * p) return { skip: true };
          const P = pmul([p, -q], [rr, -s]).map((x) => -x); // 先頭が負
          let A = [q, p], B = [s, rr];
          if (q / p > s / rr) [A, B] = [B, A];
          const at = fracTex(A[0], A[1]), bt = fracTex(B[0], B[1]);
          const op = pick(r, ["<", ">", "<=", ">="]);
          const op2 = FLIP[op];
          const eq = op.length === 2, isIn = op2[0] === "<";
          const inside = (u, v, e) => tex(`${u}${e ? "\\leqq" : "<"} x${e ? "\\leqq" : "<"} ${v}`);
          const outside = (u, v, e) => tex(`x${e ? "\\leqq" : "<"} ${u},\\ ${v}${e ? "\\leqq" : "<"} x`);
          const ok = isIn ? inside(at, bt, eq) : outside(at, bt, eq);
          const wrong = isIn ? outside(at, bt, eq) : inside(at, bt, eq);
          const nat = fracTex(-B[0], B[1]), nbt = fracTex(-A[0], A[1]);
          return {
            q: `2次不等式 ${tex(`${poly(P)}${OPS[op]} 0`)} を解くと？`,
            ans: ok,
            choices: choices4(r, ok, [wrong, isIn ? inside(nat, nbt, eq) : outside(nat, nbt, eq), isIn ? inside(at, bt, !eq) : outside(at, bt, !eq)]),
            hint: "まず両辺に $-1$ を掛けて $x^{2}$ の係数を正にする（不等号の向きが変わる）。",
            steps: [
              `両辺に $-1$ を掛けて $${poly(P.map((x) => -x))}${OPS[op2]} 0$`,
              `$${lin(p, -q)}${lin(rr, -s)}${OPS[op2]} 0$、解は $x=${at},\\ ${bt}$`,
              `${ok}`,
            ],
          };
        }),
        t("HI-nijifuto-2c", (r) => {
          const a = pick(r, [1, -1, 2, -2]), [al, be] = sample(r, [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5], 2).sort((u, v) => u - v);
          const P = pmul([a, -a * al], [1, -be]);
          return {
            q: `放物線 ${tex(`y=${poly(P)}`)} が ${tex("x")} 軸から切り取る線分の長さは？`,
            ans: be - al,
            hint: "$y=0$ とおいた2次方程式の2つの解が、$x$ 軸との交点の $x$ 座標。",
            steps: [
              `$${poly(P)}=0$ より $${a === 1 ? "" : a === -1 ? "-" : a}${fac2(al, be)}=0$`,
              `$x=${al},\\ ${be}$ なので長さは $${be}-(${al})=${be - al}$`,
            ],
          };
        }),
      ],
      3: [
        t("HI-nijifuto-3a", (r) => {
          const k1 = r(-5, 2), k2 = k1 + r(1, 6);
          if (k1 + k2 === 0) return { skip: true };
          const m = k1 + k2, n = -k1 * k2;
          const ok = tex(`${k1}<k<${k2}`);
          return {
            q: `すべての実数 ${tex("x")} について ${tex(`x^{2}+2kx${signedVar(m, "k")}${sh(n)}>0`)} が成り立つような定数 ${tex("k")} の値の範囲は？`,
            ans: ok,
            choices: choices4(r, ok, [tex(`k<${k1},\\ ${k2}<k`), tex(`${k1}\\leqq k\\leqq ${k2}`), tex(`${-k2}<k<${-k1}`)]),
            hint: "下に凸の放物線が $x$ 軸より常に上 ⇔ $x$ 軸と共有点をもたない ⇔ $D<0$",
            steps: [
              `$\\frac{D}{4}=k^{2}-(${mpoly([[m, "k"], [n, ""]])})<0$`,
              `$${poly([1, -m, -n], "k")}<0$、$${fac2(k1, k2, "k")}<0$`,
              `$${k1}<k<${k2}$`,
            ],
          };
        }),
        t("HI-nijifuto-3b", (r) => {
          const [al, be] = sample(r, [-4, -3, -2, -1, 0, 1, 2, 3, 4, 5], 2).sort((u, v) => u - v);
          const [ga, de] = sample(r, [-4, -3, -2, -1, 0, 1, 2, 3, 4, 5], 2).sort((u, v) => u - v);
          const e1 = r(0, 1) === 1, e2 = r(0, 1) === 1;
          const f1 = (x) => (x - al) * (x - be), f2 = (x) => (x - ga) * (x - de);
          const xs = [];
          for (let x = -10; x <= 10; x++) if ((e1 ? f1(x) <= 0 : f1(x) < 0) && (e2 ? f2(x) >= 0 : f2(x) > 0)) xs.push(x);
          if (xs.length === 0 || xs.length > 8) return { skip: true };
          return {
            q: `連立不等式 ${tex(`\\begin{cases} ${poly([1, -(al + be), al * be])}${e1 ? "\\leqq" : "<"} 0 \\\\ ${poly([1, -(ga + de), ga * de])}${e2 ? "\\geqq" : ">"} 0 \\end{cases}`)} を満たす整数 ${tex("x")} は何個？`,
            ans: xs.length,
            unit: "個",
            hint: "それぞれ因数分解して解き、数直線で共通部分をとる。端の等号に注意。",
            steps: [
              `1つ目：$${al}${e1 ? "\\leqq" : "<"} x${e1 ? "\\leqq" : "<"} ${be}$`,
              `2つ目：$x${e2 ? "\\leqq" : "<"} ${ga},\\ ${de}${e2 ? "\\leqq" : "<"} x$`,
              `共通部分の整数は ${xs.join(", ")} の ${xs.length} 個`,
            ],
          };
        }),
      ],
      4: [
        t("HI-nijifuto-4a", (r) => {
          const r1 = r(1, 3), r2 = r(r1 + 1, 6);
          const a = r1 + r2, b = r1 * r2;
          const tt = fracTex(b, a);
          const ok = tex(`${tt}<m<${r1},\\ ${r2}<m`);
          return {
            q: `${tex("x")} の2次方程式 ${tex(`x^{2}-2mx+${a}m-${b}=0`)} が異なる2つの正の解をもつような、定数 ${tex("m")} の値の範囲は？`,
            ans: ok,
            choices: choices4(r, ok, [tex(`m<${r1},\\ ${r2}<m`), tex(`${r2}<m`), tex(`0<m<${r1},\\ ${r2}<m`)]),
            hint: "$f(x)=x^{2}-2mx+\\cdots$ のグラフで考える。(i) 判別式 (ii) 軸の位置 (iii) $f(0)$ の符号 の3条件。",
            steps: [
              `(i) $\\frac{D}{4}=m^{2}-${a}m+${b}=(m-${r1})(m-${r2})>0$ より $m<${r1},\\ ${r2}<m$`,
              `(ii) 軸 $x=m>0$`,
              `(iii) $f(0)=${a}m-${b}>0$ より $m>${tt}$`,
              `共通部分は $${tt}<m<${r1},\\ ${r2}<m$`,
            ],
          };
        }),
        t("HI-nijifuto-4b", (r) => {
          const p = rnz(r, -3, 3), n = r(2, 4);
          const ok = tex(`${p - n - 1}\\leqq a<${p - n},\\ ${p + n}<a\\leqq ${p + n + 1}`);
          return {
            q: `${tex("x")} の不等式 ${tex(`x^{2}-(a${signed(p)})x${signedVar(p, "a")}<0`)} を満たす整数 ${tex("x")} がちょうど ${n} 個となるような、定数 ${tex("a")} の値の範囲は？`,
            ans: ok,
            choices: choices4(r, ok, [
              tex(`${p + n}<a\\leqq ${p + n + 1}`),
              tex(`${p - n - 1}<a\\leqq ${p - n},\\ ${p + n}\\leqq a<${p + n + 1}`),
              tex(`${p - n - 1}<a<${p - n},\\ ${p + n}<a<${p + n + 1}`),
            ]),
            hint: `左辺は $(x${sh(-p)})(x-a)$ と因数分解できる。$a$ と ${p} の大小で場合分け。`,
            steps: [
              `$(x${sh(-p)})(x-a)<0$`,
              `$a>${p}$ のとき $${p}<x<a$。整数 ${Array.from({ length: n }, (_, i) => p + 1 + i).join(", ")} だけ入るのは $${p + n}<a\\leqq ${p + n + 1}$`,
              `$a<${p}$ のとき $a<x<${p}$。整数 ${Array.from({ length: n }, (_, i) => p - n + i).join(", ")} だけ入るのは $${p - n - 1}\\leqq a<${p - n}$`,
              `合わせて ${ok}`,
            ],
          };
        }),
      ],
    },
  },
  // ─────────────────────────────────────────────────────
  {
    ...H,
    id: "HI-sankakuhi", area: "geo", name: "三角比", desc: "sin・cos・tan・相互関係・鈍角の三角比",
    prereqs: ["J3-g3c7u2", "J3-g3c5u1"],
    points: [
      "直角三角形で、斜辺 $r$、角 $\\theta$ の対辺 $y$、隣辺 $x$ とすると $\\sin\\theta=\\frac{y}{r}$、$\\cos\\theta=\\frac{x}{r}$、$\\tan\\theta=\\frac{y}{x}$",
      "$\\sin^{2}\\theta+\\cos^{2}\\theta=1$、$\\tan\\theta=\\frac{\\sin\\theta}{\\cos\\theta}$、$1+\\tan^{2}\\theta=\\frac{1}{\\cos^{2}\\theta}$",
      "$\\sin(180^{\\circ}-\\theta)=\\sin\\theta$、$\\cos(180^{\\circ}-\\theta)=-\\cos\\theta$。鈍角では $\\cos$ と $\\tan$ が負。",
      "$0^{\\circ}\\leqq\\theta\\leqq 180^{\\circ}$ では $\\sin\\theta\\geqq 0$。$\\cos$ の符号で鋭角か鈍角かが決まる。",
    ],
    levels: {
      1: [
        t("HI-sankakuhi-1a", (r) => {
          const f = pick(r, ["sin", "cos", "tan"]);
          const A = pick(r, ANG.filter((x) => !(f === "tan" && x === 90)));
          const ok = tex(tv(f, A));
          const neg = (g) => { const [n, s, d] = TRIG[g][A]; return tex(fsq(-n, s, d)); };
          const others = ["sin", "cos", "tan"].filter((g) => g !== f && TRIG[g][A]).map((g) => tex(tv(g, A)));
          return {
            q: `${tex(`\\${f} ${deg(A)}`)} の値は？`,
            ans: ok,
            choices: choices4(r, ok, [...others, neg(f)], () => tex(tv(f, pick(r, Object.keys(TRIG[f]).map(Number))))),
            hint: A > 0 && A < 90 ? "30°・45°・60° の直角三角形（辺の比 $1:\\sqrt{3}:2$、$1:1:\\sqrt{2}$）を思い出す。" : "単位円の上の点 $(\\cos\\theta,\\ \\sin\\theta)$ で考える。$180^{\\circ}-\\theta$ の関係も使える。",
            steps: [
              A > 90 && A < 180 ? `$${deg(A)}=180^{\\circ}-${deg(180 - A)}$ より ${f === "sin" ? "符号はそのまま" : "符号が変わる"}` : `単位円で $${deg(A)}$ の点を考える`,
              `$\\${f} ${deg(A)}=${tv(f, A)}$`,
            ],
          };
        }),
        t("HI-sankakuhi-1b", (r) => {
          const [p, q, h] = pick(r, TRIPLES);
          const [a, b] = r(0, 1) ? [p, q] : [q, p]; // BC=a, CA=b
          const f = pick(r, ["sin", "cos", "tan"]), atA = r(0, 1) === 1;
          const opp = atA ? a : b, adj = atA ? b : a;
          const v = f === "sin" ? [opp, h] : f === "cos" ? [adj, h] : [opp, adj];
          const ang = atA ? "A" : "B";
          return {
            q: `${tex("\\angle C=90^{\\circ}")} の直角三角形 ABC で、${tex(`BC=${a},\\ CA=${b},\\ AB=${h}`)} のとき、${tex(`\\${f} ${ang}`)} の値は？`,
            ans: fracAns(v[0], v[1]),
            hint: `角 ${ang} から見て、どの辺が斜辺・対辺・隣辺かを確かめる。`,
            steps: [
              `斜辺は AB $=${h}$、角 ${ang} の対辺は ${atA ? "BC" : "CA"} $=${opp}$、隣辺は ${atA ? "CA" : "BC"} $=${adj}$`,
              `$\\${f} ${ang}=${fr(v[0], v[1])}$`,
            ],
          };
        }),
      ],
      2: [
        t("HI-sankakuhi-2a", (r) => {
          const [p, q, h] = pick(r, TRIPLES);
          const obtuse = r(0, 1) === 1, giveSin = r(0, 1) === 1;
          const s = [p, h], c = [obtuse ? -q : q, h];
          const ask = giveSin ? pick(r, ["cos", "tan"]) : pick(r, ["sin", "tan"]);
          const val = ask === "sin" ? s : ask === "cos" ? c : [p, obtuse ? -q : q];
          return {
            q: `${tex(obtuse ? "90^{\\circ}<\\theta<180^{\\circ}" : "0^{\\circ}<\\theta<90^{\\circ}")} で ${tex(giveSin ? `\\sin\\theta=${fracTex(p, h)}` : `\\cos\\theta=${fracTex(c[0], h)}`)} のとき、${tex(`\\${ask}\\theta`)} の値は？`,
            ans: fracAns(val[0], val[1]),
            hint: "$\\sin^{2}\\theta+\\cos^{2}\\theta=1$ を使う。$\\theta$ の範囲から符号を決める。",
            steps: [
              giveSin
                ? `$\\cos^{2}\\theta=1-\\left(${fracTex(p, h)}\\right)^{2}=${fracTex(q * q, h * h)}$、${obtuse ? "鈍角なので $\\cos\\theta<0$" : "鋭角なので $\\cos\\theta>0$"}、$\\cos\\theta=${fracTex(c[0], h)}$`
                : `$\\sin^{2}\\theta=1-\\left(${fracTex(c[0], h)}\\right)^{2}=${fracTex(p * p, h * h)}$、$\\sin\\theta>0$ より $\\sin\\theta=${fracTex(p, h)}$`,
              ask === "tan" ? `$\\tan\\theta=\\frac{\\sin\\theta}{\\cos\\theta}=${fracTex(val[0], val[1])}$` : `$\\${ask}\\theta=${fracTex(val[0], val[1])}$`,
            ],
          };
        }),
        t("HI-sankakuhi-2b", (r) => {
          const f = pick(r, ["sin", "cos", "tan"]);
          const A = pick(r, ANG.filter((x) => !(f === "tan" && x === 90)));
          const key = (g, B) => (TRIG[g][B] ? tv(g, B) : null);
          const sols = (g, v) => ANG.filter((B) => key(g, B) === v);
          const v = tv(f, A);
          const S = (arr) => tex(`\\theta=${arr.map(deg).join(",\\ ")}`);
          const sol = sols(f, v);
          const ok = S(sol);
          const wr = [];
          for (const g of ["sin", "cos", "tan"]) if (g !== f && sols(g, v).length) wr.push(S(sols(g, v)));
          if (sol.length === 2) wr.push(S([sol[0]]), S([sol[1]]));
          else if (A !== 90 && A !== 0 && A !== 180) wr.push(S([A, 180 - A].sort((x, y) => x - y)), S([180 - A]));
          return {
            q: `${tex("0^{\\circ}\\leqq\\theta\\leqq 180^{\\circ}")} のとき、${tex(`\\${f}\\theta=${v}`)} を満たす ${tex("\\theta")} は？`,
            ans: ok,
            choices: choices4(r, ok, wr, () => S([pick(r, ANG)])),
            hint: f === "sin" ? "単位円で $y$ 座標が等しい点を探す（2つあることが多い）。" : f === "cos" ? "単位円で $x$ 座標が等しい点を探す（1つだけ）。" : "原点と点 $(1,\\ \\tan\\theta)$ を結ぶ直線の傾きで考える。",
            steps: [
              f === "sin" ? `単位円で $y=${v}$ となる点を探す` : f === "cos" ? `単位円で $x=${v}$ となる点を探す` : `傾き $${v}$ の直線と単位円の交点を探す`,
              `$${`\\theta=${sol.map(deg).join(",\\ ")}`}$`,
            ],
          };
        }),
        t("HI-sankakuhi-2c", (r) => {
          const [p, q, h] = pick(r, TRIPLES);
          const k = r(1, 2), a = p * k, b = q * k, c = h * k;
          const f = pick(r, ["sin", "cos", "tan"]);
          const v = f === "sin" ? [a, c] : f === "cos" ? [b, c] : [a, b];
          return {
            q: `${tex("\\angle C=90^{\\circ}")} の直角三角形 ABC で、${tex(`AB=${c},\\ BC=${a}`)} のとき、${tex(`\\${f} A`)} の値は？`,
            ans: fracAns(v[0], v[1]),
            hint: "三平方の定理で残りの辺を求めてから、角 A から見た辺の比をとる。",
            steps: [
              `$CA=\\sqrt{${c}^{2}-${a}^{2}}=\\sqrt{${c * c - a * a}}=${b}$`,
              `$\\${f} A=${fr(v[0], v[1])}$`,
            ],
          };
        }),
      ],
      3: [
        t("HI-sankakuhi-3a", (r) => {
          const [p, q, h] = pick(r, TRIPLES);
          const obtuse = r(0, 1) === 1;
          const tn = obtuse ? -p : p;
          const ask = pick(r, ["sin", "cos"]);
          const val = ask === "sin" ? [p, h] : [obtuse ? -q : q, h];
          return {
            q: `${tex("0^{\\circ}\\leqq\\theta\\leqq 180^{\\circ}")} で ${tex(`\\tan\\theta=${fracTex(tn, q)}`)} のとき、${tex(`\\${ask}\\theta`)} の値は？`,
            ans: fracAns(val[0], val[1]),
            hint: "$1+\\tan^{2}\\theta=\\frac{1}{\\cos^{2}\\theta}$ で $\\cos\\theta$ を求める。$\\tan$ の符号から鋭角か鈍角かがわかる。",
            steps: [
              `$\\frac{1}{\\cos^{2}\\theta}=1+${fracTex(p * p, q * q)}=${fracTex(h * h, q * q)}$ より $\\cos^{2}\\theta=${fracTex(q * q, h * h)}$`,
              `$\\tan\\theta${obtuse ? "<" : ">"}0$ なので$\\theta$ は${obtuse ? "鈍角、$\\cos\\theta<0$" : "鋭角、$\\cos\\theta>0$"}：$\\cos\\theta=${fracTex(obtuse ? -q : q, h)}$`,
              ask === "sin" ? `$\\sin\\theta=\\tan\\theta\\cos\\theta=${fracTex(p, h)}$` : `$\\cos\\theta=${fracTex(val[0], val[1])}$`,
            ],
          };
        }),
        t("HI-sankakuhi-3b", (r) => {
          const q = r(2, 5), p = rnz(r, -q + 1, Math.floor(Math.sqrt(2) * q));
          if (p * p >= 2 * q * q) return { skip: true };
          const sc = [p * p - q * q, 2 * q * q];
          return {
            q: `${tex("0^{\\circ}\\leqq\\theta\\leqq 180^{\\circ}")} で ${tex(`\\sin\\theta+\\cos\\theta=${fracTex(p, q)}`)} のとき、${tex("\\sin\\theta\\cos\\theta")} の値は？`,
            ans: fracAns(...sc),
            hint: "両辺を2乗して $\\sin^{2}\\theta+\\cos^{2}\\theta=1$ を使う。",
            steps: [
              `2乗して $1+2\\sin\\theta\\cos\\theta=${fracTex(p * p, q * q)}$`,
              `$\\sin\\theta\\cos\\theta=${fracTex(...sc)}$`,
            ],
          };
        }),
      ],
      4: [
        t("HI-sankakuhi-4a", (r) => {
          const q = r(2, 6), p = rnz(r, -q + 1, q - 1);
          const askSum = r(0, 1) === 1;
          const sc = [q * q - p * p, 2 * q * q];
          const okS = fsq(1, 2 * q * q - p * p, q);
          if (askSum) {
            const ok = tex(okS);
            return {
              q: `${tex("0^{\\circ}\\leqq\\theta\\leqq 180^{\\circ}")} で ${tex(`\\sin\\theta-\\cos\\theta=${fracTex(p, q)}`)} のとき、${tex("\\sin\\theta+\\cos\\theta")} の値は？`,
              ans: ok,
              choices: choices4(r, ok, [tex(fsq(-1, 2 * q * q - p * p, q)), tex(fsq(1, 2 * q * q + p * p, q)), tex(fsq(1, q * q - p * p, q))]),
              hint: "まず $\\sin\\theta\\cos\\theta$ を求め、その符号から $\\theta$ が鋭角か鈍角かを決める。",
              steps: [
                `2乗して $1-2\\sin\\theta\\cos\\theta=${fracTex(p * p, q * q)}$ より $\\sin\\theta\\cos\\theta=${fracTex(...sc)}>0$`,
                "$\\sin\\theta>0$ なので $\\cos\\theta>0$、よって $\\sin\\theta+\\cos\\theta>0$",
                `$(\\sin\\theta+\\cos\\theta)^{2}=1+2\\cdot ${fracTex(...sc)}=${fracTex(2 * q * q - p * p, q * q)}$`,
                `$\\sin\\theta+\\cos\\theta=${okS}$`,
              ],
            };
          }
          return {
            q: `${tex("0^{\\circ}\\leqq\\theta\\leqq 180^{\\circ}")} で ${tex(`\\sin\\theta-\\cos\\theta=${fracTex(p, q)}`)} のとき、${tex("\\tan\\theta+\\frac{1}{\\tan\\theta}")} の値は？`,
            ans: fracAns(sc[1], sc[0]),
            hint: "$\\tan\\theta+\\frac{1}{\\tan\\theta}$ を $\\sin\\theta$ と $\\cos\\theta$ で書いて通分する。",
            steps: [
              `$\\tan\\theta+\\frac{1}{\\tan\\theta}=\\frac{\\sin^{2}\\theta+\\cos^{2}\\theta}{\\sin\\theta\\cos\\theta}=\\frac{1}{\\sin\\theta\\cos\\theta}$`,
              `2乗して $1-2\\sin\\theta\\cos\\theta=${fracTex(p * p, q * q)}$ より $\\sin\\theta\\cos\\theta=${fracTex(...sc)}$`,
              `答えは $${fracTex(sc[1], sc[0])}$`,
            ],
          };
        }),
        t("HI-sankakuhi-4b", (r) => {
          const k = r(1, 2), a = rnz(r, -4, 4), b = r(-3, 3);
          // y = -k t^2 + a t + (k+b), t = cosθ (-1≦t≦1)
          const inside = Math.abs(a) <= 2 * k;
          const mx = inside ? [4 * k * (k + b) + a * a, 4 * k] : [Math.abs(a) + b, 1];
          return {
            q: `${tex("0^{\\circ}\\leqq\\theta\\leqq 180^{\\circ}")} のとき、${tex(`y=${k === 1 ? "" : k}\\sin^{2}\\theta${signedVar(a, "\\cos\\theta")}${sh(b)}`)} の最大値は？`,
            ans: fracAns(...mx),
            hint: "$\\sin^{2}\\theta=1-\\cos^{2}\\theta$ で $\\cos\\theta=t$ の2次関数にする。$t$ の範囲に注意。",
            steps: [
              `$t=\\cos\\theta$ とおくと $-1\\leqq t\\leqq 1$、$y=${poly([-k, a, k + b], "t")}$`,
              `軸は $t=${fracTex(a, 2 * k)}$${inside ? "（範囲内）" : "（範囲外）"}`,
              inside ? `$t=${fracTex(a, 2 * k)}$ のとき最大値 $${fracTex(...mx)}$` : `$t=${a > 0 ? 1 : -1}$ のとき最大値 $${fracTex(...mx)}$`,
            ],
          };
        }),
      ],
    },
  },
  // ─────────────────────────────────────────────────────
  {
    ...H,
    id: "HI-seigen", area: "geo", name: "正弦定理・余弦定理", desc: "三角形の辺・角・面積・外接円",
    prereqs: ["HI-sankakuhi"],
    points: [
      "正弦定理：$\\frac{a}{\\sin A}=\\frac{b}{\\sin B}=\\frac{c}{\\sin C}=2R$（$R$ は外接円の半径）。角と向かい合う辺の組がわかるときに使う。",
      "余弦定理：$a^{2}=b^{2}+c^{2}-2bc\\cos A$、$\\cos A=\\frac{b^{2}+c^{2}-a^{2}}{2bc}$。2辺と間の角、または3辺がわかるときに使う。",
      "面積 $S=\\frac{1}{2}bc\\sin A$。内接円の半径 $r$ は $S=\\frac{1}{2}r(a+b+c)$ から求める。",
      "円に内接する四角形では向かい合う角の和が $180^{\\circ}$ なので $\\cos D=-\\cos B$。",
    ],
    levels: {
      1: [
        t("HI-seigen-1a", (r) => {
          const b = r(2, 8), c = r(2, 8), A = pick(r, [60, 120]);
          const sg = A === 60 ? -1 : 1;
          const a2 = b * b + c * c + sg * b * c;
          const ok = tex(sqrtTex(1, a2));
          return {
            q: `${tex("\\triangle ABC")} で ${tex(`AB=${c},\\ CA=${b},\\ \\angle A=${deg(A)}`)} のとき、${tex("BC")} の長さは？`,
            ans: ok,
            choices: choices4(r, ok, [tex(sqrtTex(1, b * b + c * c - sg * b * c)), tex(sqrtTex(1, b * b + c * c)), (b - c) ** 2 > 0 ? tex(sqrtTex(1, b * b + c * c + 2 * sg * b * c)) : null], (i) => tex(sqrtTex(1, a2 + i + 1))),
            hint: "2辺とその間の角がわかっている → 余弦定理。",
            steps: [
              `$BC^{2}=${c}^{2}+${b}^{2}-2\\cdot ${c}\\cdot ${b}\\cos ${deg(A)}$`,
              `$=${b * b + c * c}${sg > 0 ? "+" : "-"}${b * c}=${a2}$`,
              `$BC=${sqrtTex(1, a2)}$`,
            ],
          };
        }),
        t("HI-seigen-1b", (r) => {
          const A = pick(r, [30, 45, 60, 90, 120, 135, 150]), a = r(2, 12);
          const [n, s, d] = TRIG.sin[A];
          const ok = tex(fsq(a * d, s, 2 * n * s));
          return {
            q: `${tex("\\triangle ABC")} で ${tex(`BC=${a},\\ \\angle A=${deg(A)}`)} のとき、外接円の半径 ${tex("R")} は？`,
            ans: ok,
            choices: choices4(r, ok, [tex(fsq(a * d, s, n * s)), tex(fsq(a * n, s, 2 * d)), tex(fsq(a * n, s, d))], (i) => tex(fsq(a * d + i + 1, s, 2 * n * s))),
            hint: "正弦定理 $\\frac{a}{\\sin A}=2R$ を使う。",
            steps: [
              `$2R=\\frac{${a}}{\\sin ${deg(A)}}=\\frac{${a}}{${tv("sin", A)}}=${fsq(a * d, s, n * s)}$`,
              `$R=${fsq(a * d, s, 2 * n * s)}$`,
            ],
          };
        }),
        t("HI-seigen-1c", (r) => {
          const A = pick(r, [30, 45, 60, 90, 120, 135, 150]), b = r(2, 9), c = r(2, 9);
          const [n, s, d] = TRIG.sin[A];
          const [cn, cs, cd] = TRIG.cos[A];
          const ok = tex(fsq(b * c * n, s, 2 * d));
          return {
            q: `${tex("\\triangle ABC")} で ${tex(`AB=${c},\\ CA=${b},\\ \\angle A=${deg(A)}`)} のとき、面積は？`,
            ans: ok,
            choices: choices4(r, ok, [tex(fsq(b * c * n, s, d)), cn ? tex(fsq(b * c * Math.abs(cn), cs, 2 * cd)) : null, tex(fsq(b * c * n, s, 4 * d))], (i) => tex(fsq(b * c * n + i + 1, s, 2 * d))),
            hint: "$S=\\frac{1}{2}bc\\sin A$（2辺とその間の角）",
            steps: [
              `$S=\\frac{1}{2}\\cdot ${c}\\cdot ${b}\\cdot\\sin ${deg(A)}=\\frac{1}{2}\\cdot ${b * c}\\cdot ${tv("sin", A)}$`,
              `$=${fsq(b * c * n, s, 2 * d)}$`,
            ],
          };
        }),
      ],
      2: [
        t("HI-seigen-2a", (r) => {
          const a = r(2, 9), b = r(a, 10), c = r(b, 12);
          if (a + b <= c || c === a) return { skip: true };
          return {
            q: `3辺の長さが ${a}, ${b}, ${c} の三角形で、最大の角を ${tex("\\theta")} とするとき、${tex("\\cos\\theta")} の値は？`,
            ans: fracAns(a * a + b * b - c * c, 2 * a * b),
            hint: "最大の角は最大の辺と向かい合う。余弦定理を $\\cos$ について解いた形を使う。",
            steps: [
              `最大の角は長さ ${c} の辺の向かい側`,
              `$\\cos\\theta=\\frac{${a}^{2}+${b}^{2}-${c}^{2}}{2\\cdot ${a}\\cdot ${b}}=${fr(a * a + b * b - c * c, 2 * a * b)}$`,
            ],
          };
        }),
        t("HI-seigen-2b", (r) => {
          const [b, c, A, a] = pick(r, NICE_TRI);
          const S = (x) => tex(`\\angle A=${deg(x)}`);
          const ok = S(A);
          const [cn, , cd] = TRIG.cos[A];
          return {
            q: `${tex("\\triangle ABC")} で ${tex(`BC=${a},\\ CA=${b},\\ AB=${c}`)} のとき、${tex("\\angle A")} の大きさは？`,
            ans: ok,
            choices: choices4(r, ok, [S(180 - A), S(A === 60 ? 30 : 150), S(A === 60 ? 45 : 135), S(90)]),
            hint: "3辺がわかっている → 余弦定理で $\\cos A$ を求める。",
            steps: [
              `$\\cos A=\\frac{${b}^{2}+${c}^{2}-${a}^{2}}{2\\cdot ${b}\\cdot ${c}}=\\frac{${b * b + c * c - a * a}}{${2 * b * c}}=${fracTex(cn, cd)}$`,
              `$\\angle A=${deg(A)}$`,
            ],
          };
        }),
        t("HI-seigen-2c", (r) => {
          const [A, B] = sample(r, [30, 45, 60, 90, 120, 135], 2);
          if (A + B >= 180) return { skip: true };
          const a = r(2, 10);
          const [nA, sA, dA] = TRIG.sin[A], [nB, sB, dB] = TRIG.sin[B];
          const okS = fsq(a * nB * dA, sA * sB, dB * nA * sA);
          const ok = tex(okS);
          return {
            q: `${tex("\\triangle ABC")} で ${tex(`BC=${a},\\ \\angle A=${deg(A)},\\ \\angle B=${deg(B)}`)} のとき、${tex("CA")} の長さは？`,
            ans: ok,
            choices: choices4(r, ok, [tex(fsq(a * nA * dB, sA * sB, dA * nB * sB)), tex(fsq(a * nB, sB, dB)), tex(fsq(a * nB * dA, sA * sB, 2 * dB * nA * sA))], (i) => tex(fsq(a * nB * dA + i + 1, sA * sB, dB * nA * sA))),
            hint: "向かい合う「辺と角」の組が1つわかっている → 正弦定理。",
            steps: [
              `$\\frac{CA}{\\sin B}=\\frac{BC}{\\sin A}$ より $CA=\\frac{${a}\\sin ${deg(B)}}{\\sin ${deg(A)}}$`,
              `$=${a}\\cdot ${tv("sin", B)}\\div ${tv("sin", A)}=${okS}$`,
            ],
          };
        }),
      ],
      3: [
        t("HI-seigen-3a", (r) => {
          const [b, c, A, a] = pick(r, NICE_TRI);
          const okS = fsq(a, 3, 3);
          const ok = tex(okS);
          return {
            q: `${tex("\\triangle ABC")} で ${tex(`AB=${c},\\ CA=${b},\\ \\angle A=${deg(A)}`)} のとき、外接円の半径 ${tex("R")} は？`,
            ans: ok,
            choices: choices4(r, ok, [tex(fsq(2 * a, 3, 3)), tex(fsq(a * a, 3, 3)), tex(fsq(a, 1, 2))], (i) => tex(fsq(a + i + 1, 3, 3))),
            hint: "まず余弦定理で $BC$ を求め、次に正弦定理で $R$ を求める。",
            steps: [
              `$BC^{2}=${c}^{2}+${b}^{2}-2\\cdot ${c}\\cdot ${b}\\cos ${deg(A)}=${a * a}$、$BC=${a}$`,
              `$2R=\\frac{${a}}{\\sin ${deg(A)}}=\\frac{${a}}{\\frac{\\sqrt{3}}{2}}$`,
              `$R=\\frac{${a}}{\\sqrt{3}}=${okS}$`,
            ],
          };
        }),
        t("HI-seigen-3b", (r) => {
          const [a0, b0, c0, S0] = pick(r, HERON);
          const k = r(1, 2), a = a0 * k, b = b0 * k, c = c0 * k, S = S0 * k * k;
          const askR = r(0, 1) === 1;
          const cosC = [a * a + b * b - c * c, 2 * a * b], sinC = [2 * S, a * b];
          return {
            q: `3辺の長さが ${tex(`BC=${a},\\ CA=${b},\\ AB=${c}`)} の ${tex("\\triangle ABC")} の${askR ? "内接円の半径" : "面積"}は？`,
            ans: askR ? fracAns(2 * S, a + b + c) : S,
            hint: "余弦定理で1つの角の $\\cos$ を求め、$\\sin$ に直して面積を出す。",
            steps: [
              `$\\cos C=\\frac{${a}^{2}+${b}^{2}-${c}^{2}}{2\\cdot ${a}\\cdot ${b}}=${fracTex(...cosC)}$、$\\sin C=\\sqrt{1-\\cos^{2}C}=${fracTex(...sinC)}$`,
              `$S=\\frac{1}{2}\\cdot ${a}\\cdot ${b}\\cdot ${fracTex(...sinC)}=${S}$`,
              ...(askR ? [`$S=\\frac{1}{2}r(${a}+${b}+${c})$ より $r=\\frac{2\\cdot ${S}}{${a + b + c}}=${fracTex(2 * S, a + b + c)}$`] : []),
            ],
          };
        }),
        t("HI-seigen-3c", (r) => {
          const p = r(2, 7), q = r(p, 8), s = r(q, 9);
          if (p + q <= s || s === p) return { skip: true };
          const [P, Q, R2] = shuffle(r, [p, q, s]);
          return {
            q: `${tex("\\triangle ABC")} で ${tex(`\\sin A:\\sin B:\\sin C=${P}:${Q}:${R2}`)} のとき、最大の角の ${tex("\\cos")} の値は？`,
            ans: fracAns(p * p + q * q - s * s, 2 * p * q),
            hint: "正弦定理より $a:b:c=\\sin A:\\sin B:\\sin C$。辺を $k$ 倍の形でおく。",
            steps: [
              `$a:b:c=${P}:${Q}:${R2}$ なので、辺を $${P}k,\\ ${Q}k,\\ ${R2}k$ とおける`,
              `最大の角は ${s}k の辺の向かい側：$\\cos=\\frac{${p * p}+${q * q}-${s * s}}{2\\cdot ${p}\\cdot ${q}}=${fracTex(p * p + q * q - s * s, 2 * p * q)}$`,
            ],
          };
        }),
      ],
      4: [
        t("HI-seigen-4a", (r) => {
          const a = r(2, 8), b = r(2, 8), c = r(2, 8), d = r(2, 8);
          const num = a * a + b * b - c * c - d * d, den = 2 * (a * b + c * d);
          if (Math.abs(num) >= den || num === 0) return { skip: true };
          const askAC = r(0, 1) === 1;
          const [cn, cd] = reduce(num, den);
          const ac2 = [(a * a + b * b) * cd - 2 * a * b * cn, cd];
          return {
            q: `円に内接する四角形 ABCD で ${tex(`AB=${a},\\ BC=${b},\\ CD=${c},\\ DA=${d}`)} のとき、${tex(askAC ? "AC^{2}" : "\\cos B")} の値は？`,
            ans: askAC ? fracAns(...ac2) : fracAns(num, den),
            hint: "対角線 AC を2つの三角形で余弦定理を使って表す。$B+D=180^{\\circ}$ より $\\cos D=-\\cos B$。",
            steps: [
              `$\\triangle ABC$：$AC^{2}=${a * a}+${b * b}-${2 * a * b}\\cos B$`,
              `$\\triangle ACD$：$AC^{2}=${c * c}+${d * d}-${2 * c * d}\\cos D=${c * c + d * d}+${2 * c * d}\\cos B$`,
              `2式から $\\cos B=${fr(num, den)}$`,
              ...(askAC ? [`$AC^{2}=${a * a + b * b}-${2 * a * b}\\cdot\\left(${fracTex(num, den)}\\right)=${fracTex(...ac2)}$`] : []),
            ],
          };
        }),
        t("HI-seigen-4b", (r) => {
          const b = r(2, 9), c = r(2, 9), A = pick(r, [60, 90, 120]);
          const half = A / 2;
          const base = [
            `$\\triangle ABD+\\triangle ACD=\\triangle ABC$ を面積で考える（$AD=x$）`,
            `$\\frac{1}{2}\\cdot ${c}x\\sin ${deg(half)}+\\frac{1}{2}\\cdot ${b}x\\sin ${deg(half)}=\\frac{1}{2}\\cdot ${b * c}\\sin ${deg(A)}$`,
          ];
          const q = `${tex("\\triangle ABC")} で ${tex(`AB=${c},\\ AC=${b},\\ \\angle A=${deg(A)}`)} とする。${tex("\\angle A")} の二等分線と辺 BC の交点を D とするとき、${tex("AD")} の長さは？`;
          if (A === 120) {
            return {
              q,
              ans: fracAns(b * c, b + c),
              hint: "面積を2通りに表す：$\\triangle ABC=\\triangle ABD+\\triangle ACD$",
              steps: [...base, `$\\sin 60^{\\circ}=\\sin 120^{\\circ}$ なので $${b + c}x=${b * c}$、$x=${fracTex(b * c, b + c)}$`],
            };
          }
          const s = A === 60 ? 3 : 2;
          const okS = fsq(b * c, s, b + c);
          const ok = tex(okS);
          return {
            q,
            ans: ok,
            choices: choices4(r, ok, [tex(fracTex(b * c, b + c)), tex(fsq(b * c, s, 2 * (b + c))), tex(fsq(2 * b * c, s, b + c))], (i) => tex(fsq(b * c + i + 1, s, b + c))),
            hint: "面積を2通りに表す：$\\triangle ABC=\\triangle ABD+\\triangle ACD$",
            steps: [...base, `$\\frac{1}{2}x(${b + c})\\cdot ${tv("sin", half)}=\\frac{1}{2}\\cdot ${b * c}\\cdot ${tv("sin", A)}$`, `$x=${okS}$`],
          };
        }),
      ],
    },
  },
  // ─────────────────────────────────────────────────────
  {
    ...H,
    id: "HI-data", area: "data", name: "データの分析", desc: "四分位数・分散・標準偏差・相関係数",
    prereqs: ["J1-d1"],
    points: [
      "四分位数：小さい順に並べ、中央値 $Q_{2}$ で前半・後半に分ける（個数が奇数なら中央値は除く）。前半の中央値が $Q_{1}$、後半が $Q_{3}$。四分位範囲は $Q_{3}-Q_{1}$",
      "分散 $s^{2}=\\frac{1}{n}\\sum(x_{i}-\\overline{x})^{2}=\\overline{x^{2}}-(\\overline{x})^{2}$、標準偏差 $s=\\sqrt{s^{2}}$",
      "$y=ax+b$ と変換すると $\\overline{y}=a\\overline{x}+b$、$s_{y}^{2}=a^{2}s_{x}^{2}$、$s_{y}=|a|s_{x}$",
      "相関係数 $r=\\frac{s_{xy}}{s_{x}s_{y}}$（$-1\\leqq r\\leqq 1$）。共分散 $s_{xy}=\\frac{1}{n}\\sum(x_{i}-\\overline{x})(y_{i}-\\overline{y})$",
    ],
    levels: {
      1: [
        t("HI-data-1a", (r) => {
          const n = r(7, 11);
          const xs = Array.from({ length: n }, () => r(1, 30));
          const s = [...xs].sort((a, b) => a - b);
          const med = (arr) => (arr.length % 2 ? arr[(arr.length - 1) / 2] : (arr[arr.length / 2 - 1] + arr[arr.length / 2]) / 2);
          const h = Math.floor(n / 2);
          const lo = s.slice(0, h), hi = s.slice(n - h);
          const q1 = med(lo), q3 = med(hi);
          return {
            q: `次の ${n} 個のデータの四分位範囲は？　${xs.join(", ")}`,
            ans: round(q3 - q1),
            hint: "小さい順に並べ、中央値で前半と後半に分ける。それぞれの中央値が $Q_{1}$ と $Q_{3}$。",
            steps: [
              `並べると ${s.join(", ")}`,
              `前半 ${lo.join(", ")} → $Q_{1}=${q1}$、後半 ${hi.join(", ")} → $Q_{3}=${q3}$`,
              `$Q_{3}-Q_{1}=${round(q3 - q1)}$`,
            ],
          };
        }),
        t("HI-data-1b", (r) => {
          const xs = Array.from({ length: 4 }, () => r(1, 15));
          const S4 = xs.reduce((a, b) => a + b, 0);
          xs.splice(r(0, 4), 0, pick(r, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].filter((x) => (S4 + x) % 5 === 0)));
          const S = xs.reduce((a, b) => a + b, 0);
          const m = S / 5, dv = xs.map((x) => x - m), V = round(dv.reduce((a, d) => a + d * d, 0) / 5);
          return {
            q: `5個のデータ ${xs.join(", ")} の分散は？`,
            ans: V,
            hint: "平均を求め、各データの偏差（データ − 平均）の2乗の平均をとる。",
            steps: [
              `平均は $\\frac{${S}}{5}=${m}$`,
              `偏差は ${dv.join(", ")}、2乗の和は ${dv.reduce((a, d) => a + d * d, 0)}`,
              `分散は $\\frac{${dv.reduce((a, d) => a + d * d, 0)}}{5}=${V}$`,
            ],
          };
        }),
      ],
      2: [
        t("HI-data-2a", (r) => {
          const m = r(10, 60), sd = r(2, 8), a = rnz(r, -4, 4), b = rnz(r, -20, 20);
          const ask = pick(r, ["mean", "var", "sd"]);
          const v = { mean: a * m + b, var: a * a * sd * sd, sd: Math.abs(a) * sd }[ask];
          const name = { mean: "平均値", var: "分散", sd: "標準偏差" }[ask];
          return {
            q: `変量 ${tex("x")} のデータの平均値が ${m}、分散が ${sd * sd} である。${tex(`y=${poly([a, b])}`)} で定まる変量 ${tex("y")} の${name}は？`,
            ans: v,
            hint: "$y=ax+b$ のとき、平均は $a\\overline{x}+b$、分散は $a^{2}$ 倍、標準偏差は $|a|$ 倍（$b$ は散らばりに影響しない）。",
            steps: [
              ask === "mean" ? `$\\overline{y}=${a}\\cdot ${m}${signed(b)}=${v}$` : ask === "var" ? `$s_{y}^{2}=(${a})^{2}\\cdot ${sd * sd}=${v}$` : `$s_{x}=\\sqrt{${sd * sd}}=${sd}$、$s_{y}=|${a}|\\cdot ${sd}=${v}$`,
            ],
          };
        }),
        t("HI-data-2b", (r) => {
          const n = pick(r, [5, 10]);
          const xs = Array.from({ length: n }, () => r(1, 12));
          const S = xs.reduce((a, b) => a + b, 0), T = xs.reduce((a, b) => a + b * b, 0);
          const V = round(T / n - (S / n) ** 2);
          return {
            q: `${n} 個のデータ ${tex("x_{1},\\ x_{2},\\ \\ldots,\\ x_{" + n + "}")} について、${tex(`\\sum x_{i}=${S},\\ \\sum x_{i}^{2}=${T}`)} である。このデータの分散は？`,
            ans: V,
            hint: "分散 $=\\overline{x^{2}}-(\\overline{x})^{2}$（2乗の平均 − 平均の2乗）",
            steps: [
              `$\\overline{x}=\\frac{${S}}{${n}}=${round(S / n)}$、$\\overline{x^{2}}=\\frac{${T}}{${n}}=${round(T / n)}$`,
              `分散 $=${round(T / n)}-${round(S / n)}^{2}=${V}$`,
            ],
          };
        }),
      ],
      3: [
        t("HI-data-3a", (r) => {
          const dx = [-2, -1, 0, 1, 2], perm = shuffle(r, dx), c = pick(r, [1, 2, 3, -1, -2]);
          const mx = r(3, 10), my = r(10, 30);
          const dot = dx.reduce((a, d, i) => a + d * perm[i], 0);
          const rr = round((Math.sign(c) * dot) / 10);
          const idx = shuffle(r, [0, 1, 2, 3, 4]);
          const X = idx.map((i) => mx + dx[i]), Y = idx.map((i) => my + c * perm[i]);
          return {
            q: `5組のデータ ${idx.map((_, k) => tex(`(${X[k]},\\ ${Y[k]})`)).join("、")}（${tex("(x,\\ y)")} の組）について、${tex("x")} と ${tex("y")} の相関係数は？`,
            ans: rr,
            hint: "平均を求め、偏差の積の和 $\\sum(x_{i}-\\overline{x})(y_{i}-\\overline{y})$ と、偏差の2乗の和を計算する。",
            steps: [
              `$\\overline{x}=${mx}$、$\\overline{y}=${my}$`,
              `$\\sum(x-\\overline{x})^{2}=10$、$\\sum(y-\\overline{y})^{2}=${10 * c * c}$、$\\sum(x-\\overline{x})(y-\\overline{y})=${c * dot}$`,
              `$r=\\frac{${c * dot}}{\\sqrt{10}\\sqrt{${10 * c * c}}}=\\frac{${c * dot}}{${10 * Math.abs(c)}}=${rr}$`,
            ],
          };
        }),
        t("HI-data-3b", (r) => {
          const n = pick(r, [5, 10]);
          const xs = Array.from({ length: n }, () => r(1, 20));
          const w = xs[0], u = r(1, 20);
          if (u === w) return { skip: true };
          const S = xs.reduce((a, b) => a + b, 0), T = xs.reduce((a, b) => a + b * b, 0);
          const m = round(S / n), V = round(T / n - (S / n) ** 2);
          const S2 = S - w + u, T2 = T - w * w + u * u;
          const V2 = round(T2 / n - (S2 / n) ** 2);
          return {
            q: `${n} 個のデータの平均値は ${m}、分散は ${V} であった。ところが、1つの値を ${u} とすべきところを誤って ${w} としていた。正しい分散は？`,
            ans: V2,
            hint: "平均と分散から、データの和と2乗の和を求める。誤りの分だけ和と2乗の和を直す。",
            steps: [
              `和 $=${n}\\times ${m}=${S}$、2乗の和 $=${n}\\times(${V}+${m}^{2})=${T}$`,
              `正しい和 $=${S}-${w}+${u}=${S2}$、正しい2乗の和 $=${T}-${w * w}+${u * u}=${T2}$`,
              `分散 $=\\frac{${T2}}{${n}}-\\left(\\frac{${S2}}{${n}}\\right)^{2}=${V2}$`,
            ],
          };
        }),
      ],
      4: [
        t("HI-data-4a", (r) => {
          const N = 10, n1 = r(2, N - 2), n2 = N - n1;
          const m1 = r(40, 80), m2 = r(40, 80), v1 = r(4, 40), v2 = r(4, 40);
          const Q = n1 * (v1 + m1 * m1) + n2 * (v2 + m2 * m2), S = n1 * m1 + n2 * m2;
          const V = round(Q / N - (S / N) ** 2);
          return {
            q: `A組 ${n1} 人の得点は平均値 ${m1}、分散 ${v1}、B組 ${n2} 人の得点は平均値 ${m2}、分散 ${v2} である。2組を合わせた ${N} 人の得点の分散は？`,
            ans: V,
            hint: "それぞれの組の「得点の和」と「得点の2乗の和」を求めてから合わせる。",
            steps: [
              `2乗の平均 $=s^{2}+(\\overline{x})^{2}$ より、A組の2乗の和 $=${n1}(${v1}+${m1 * m1})=${n1 * (v1 + m1 * m1)}$、B組 $=${n2}(${v2}+${m2 * m2})=${n2 * (v2 + m2 * m2)}$`,
              `全体の平均 $=\\frac{${S}}{${N}}=${round(S / N)}$、2乗の平均 $=\\frac{${Q}}{${N}}=${round(Q / N)}$`,
              `分散 $=${round(Q / N)}-${round(S / N)}^{2}=${V}$`,
            ],
          };
        }),
        t("HI-data-4b", (r) => {
          const n = r(4, 9), m = r(5, 20), v = r(2, 20);
          const atMean = r(0, 1) === 1;
          const w = atMean ? m : m + rnz(r, -6, 6);
          const num = (n + 1) * (n * (v + m * m) + w * w) - (n * m + w) ** 2, den = (n + 1) ** 2;
          return {
            q: `${n} 個のデータの平均値が ${m}、分散が ${v} である。このデータに値 ${w} を1つ加えた ${n + 1} 個のデータの分散は？`,
            ans: fracAns(num, den),
            hint: "和と2乗の和を求めて、1個加えたあとの平均と2乗の平均を計算する。",
            steps: [
              `和 $=${n * m}$、2乗の和 $=${n}(${v}+${m * m})=${n * (v + m * m)}$`,
              `加えたあと：和 $=${n * m + w}$、2乗の和 $=${n * (v + m * m) + w * w}$`,
              `分散 $=\\frac{${n * (v + m * m) + w * w}}{${n + 1}}-\\left(\\frac{${n * m + w}}{${n + 1}}\\right)^{2}=${fracTex(num, den)}$`,
            ],
          };
        }),
        t("HI-data-4c", (r) => {
          const sx = r(2, 6), sy = r(2, 6), rr = rnz(r, -9, 9) / 10, a = rnz(r, -3, 3), b = r(-10, 10), c = rnz(r, -3, 3), d = r(-10, 10);
          const askCov = r(0, 1) === 1;
          const cov = round(rr * sx * sy), v = askCov ? round(a * c * cov) : round(Math.sign(a * c) * rr);
          return {
            q: `2つの変量 ${tex("x,\\ y")} の標準偏差がそれぞれ ${sx}, ${sy}、相関係数が ${round(rr)} である。${tex(`u=${poly([a, b])},\\ v=${poly([c, d], "y")}`)} とするとき、${askCov ? `${tex("u")} と ${tex("v")} の共分散` : `${tex("u")} と ${tex("v")} の相関係数`}は？`,
            ans: v,
            hint: "共分散は $s_{uv}=ac\\,s_{xy}$。相関係数は $a,\\ c$ の符号だけで変わる。",
            steps: [
              `$s_{xy}=r\\,s_{x}s_{y}=${round(rr)}\\times ${sx}\\times ${sy}=${cov}$`,
              askCov ? `$s_{uv}=(${a})\\times(${c})\\times(${cov})=${v}$` : `$s_{u}=${coefVar(Math.abs(a), "s_{x}")}$、$s_{v}=${coefVar(Math.abs(c), "s_{y}")}$、$s_{uv}=${coefVar(a * c, "s_{xy}")}$ より $r_{uv}=${a * c > 0 ? "" : "-"}r_{xy}=${v}$`,
            ],
          };
        }),
      ],
    },
  },
];
