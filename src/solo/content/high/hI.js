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
/** (ax+b) / (ax+by) の TeX */
const lin = (a, b, v = "x", w = "") => `(${coefVar(a, v)}${w ? signedVar(b, w) : b ? signed(b) : ""})`;
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

const H = { grade: "H1", course: "数学I", rikei: false };

export const UNITS = [
  // ─────────────────────────────────────────────────────
  {
    ...H,
    id: "HI-tenkai", area: "num", name: "式の展開", desc: "3乗の公式・3項の展開・工夫した展開",
    prereqs: ["J3-g3c1u4"],
    points: [
      "$(a+b)^{3}=a^{3}+3a^{2}b+3ab^{2}+b^{3}$、$(a-b)^{3}=a^{3}-3a^{2}b+3ab^{2}-b^{3}$",
      "$(a+b)(a^{2}-ab+b^{2})=a^{3}+b^{3}$、$(a-b)(a^{2}+ab+b^{2})=a^{3}-b^{3}$",
      "$(a+b+c)^{2}=a^{2}+b^{2}+c^{2}+2ab+2bc+2ca$",
      "共通な部分は1つの文字に置き換える。かける順番の組み合わせを工夫すると計算が楽になる。",
    ],
    levels: {
      1: [
        t("HI-tenkai-1a", (r) => {
          const a = rnz(r, -4, 4);
          const W = (c) => [tex(poly(c)), pkey(c)];
          const ok = [1, 3 * a, 3 * a * a, a ** 3];
          return {
            q: `${tex(`(x${signed(a)})^{3}`)} を展開すると？`,
            ...ec(r, W(ok), [W([1, 0, 0, a ** 3]), W([1, -3 * a, 3 * a * a, -(a ** 3)]), W([1, 3 * a, 3 * a, a ** 3]), W([1, a, a * a, a ** 3])],
              (i) => W([1, 3 * a, 3 * a * a + i + 1, a ** 3])),
            hint: "$(a+b)^{3}=a^{3}+3a^{2}b+3ab^{2}+b^{3}$ の $b$ に代入する。符号に注意。",
            steps: [
              `$(x${signed(a)})^{3}=x^{3}+3\\cdot x^{2}\\cdot (${a})+3\\cdot x\\cdot (${a})^{2}+(${a})^{3}$`,
              `$=${poly(ok)}$`,
            ],
          };
        }),
        t("HI-tenkai-1b", (r) => {
          const a = pick(r, [-5, -4, -3, -2, 2, 3, 4, 5]);
          const W = (c) => [tex(poly(c)), pkey(c)];
          const ok = [1, 0, 0, a ** 3];
          return {
            q: `${tex(`(x${signed(a)})${par([1, -a, a * a])}`)} を展開すると？`,
            ...ec(r, W(ok), [W([1, 0, 0, -(a ** 3)]), W([1, 3 * a, 3 * a * a, a ** 3]), W([1, 0, 0, a]), W([1, 0, 0, a * a])],
              (i) => W([1, 0, 0, a ** 3 + i + 1])),
            hint: a > 0 ? "$(a+b)(a^{2}-ab+b^{2})$ の形になっていないか確かめよう。" : "$(a-b)(a^{2}+ab+b^{2})$ の形になっていないか確かめよう。",
            steps: [
              a > 0
                ? `$a=x,\\ b=${a}$ とすると $(a+b)(a^{2}-ab+b^{2})=a^{3}+b^{3}$ の形`
                : `$a=x,\\ b=${-a}$ とすると $(a-b)(a^{2}+ab+b^{2})=a^{3}-b^{3}$ の形`,
              `$=x^{3}${a > 0 ? "+" : "-"}${Math.abs(a)}^{3}=${poly(ok)}$`,
            ],
          };
        }),
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
      ],
      2: [
        t("HI-tenkai-2a", (r) => {
          const a = r(2, 3) * sgn(r), b = rnz(r, -4, 4);
          const k = r(1, 2); // x^k の係数
          const coef = pmul(pmul([a, b], [a, b]), [a, b])[3 - k];
          return {
            q: `${tex(`(${a}x${signed(b)})^{3}`)} を展開したときの ${tex(k === 2 ? "x^{2}" : "x")} の係数は？`,
            ans: coef,
            hint: "$(a+b)^{3}=a^{3}+3a^{2}b+3ab^{2}+b^{3}$ で、どの項が求める次数になるか考える。",
            steps: [
              k === 2
                ? `$x^{2}$ の項は $3a^{2}b$ の部分：$3\\cdot (${a}x)^{2}\\cdot (${b})$`
                : `$x$ の項は $3ab^{2}$ の部分：$3\\cdot (${a}x)\\cdot (${b})^{2}$`,
              k === 2 ? `$=3\\cdot ${a * a}\\cdot (${b})\\,x^{2}=${coef}x^{2}$` : `$=3\\cdot (${a})\\cdot ${b * b}\\,x=${coef}x$`,
              `係数は ${coef}`,
            ],
          };
        }),
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
          if (r(0, 1)) {
            const v = s ** 3 - 3 * p * s;
            return {
              q: `${tex(`x+y=${s},\\ xy=${p}`)} のとき、${tex("x^{3}+y^{3}")} の値は？`,
              ans: v,
              hint: "$x^{3}+y^{3}$ を $x+y$ と $xy$ で表す。",
              steps: [
                "$x^{3}+y^{3}=(x+y)^{3}-3xy(x+y)$",
                `$=${s}^{3}-3\\cdot (${p})\\cdot ${s}=${s ** 3}${signed(-3 * p * s)}$`,
                `$=${v}$`,
              ],
            };
          }
          return {
            q: `${tex(`x+y=${s},\\ xy=${p}`)} のとき、${tex("\\frac{y}{x}+\\frac{x}{y}")} の値は？`,
            ans: fracAns(s * s - 2 * p, p),
            hint: "通分すると分子は $x^{2}+y^{2}$。これを $x+y$ と $xy$ で表す。",
            steps: [
              "$\\frac{y}{x}+\\frac{x}{y}=\\frac{x^{2}+y^{2}}{xy}$",
              `$x^{2}+y^{2}=(x+y)^{2}-2xy=${s * s}${signed(-2 * p)}=${s * s - 2 * p}$`,
              `$\\frac{${s * s - 2 * p}}{${p}}=${fracTex(s * s - 2 * p, p)}$`,
            ],
          };
        }),
      ],
      4: [
        t("HI-tenkai-4a", (r) => {
          const s = r(1, 5), tt = rnz(r, -5, 5), u = rnz(r, -5, 5);
          const sq = s * s - 2 * tt;
          const v = s ** 3 - 3 * s * tt + 3 * u;
          return {
            q: `${tex(`a+b+c=${s},\\ ab+bc+ca=${tt},\\ abc=${u}`)} のとき、${tex("a^{3}+b^{3}+c^{3}")} の値は？`,
            ans: v,
            hint: "$a^{3}+b^{3}+c^{3}-3abc=(a+b+c)(a^{2}+b^{2}+c^{2}-ab-bc-ca)$ を使う。",
            steps: [
              `$a^{2}+b^{2}+c^{2}=(a+b+c)^{2}-2(ab+bc+ca)=${s * s}${signed(-2 * tt)}=${sq}$`,
              `$a^{3}+b^{3}+c^{3}-3abc=${s}\\cdot (${sq}-(${tt}))=${s * (sq - tt)}$`,
              `$a^{3}+b^{3}+c^{3}=${s * (sq - tt)}+3\\cdot (${u})=${v}$`,
            ],
          };
        }),
        t("HI-tenkai-4b", (r) => {
          const k = r(3, 6), n = r(3, 5);
          const a = [2, k];
          for (let i = 2; i <= 5; i++) a.push(k * a[i - 1] - a[i - 2]);
          const st = [`$x^{2}+\\frac{1}{x^{2}}=\\left(x+\\frac{1}{x}\\right)^{2}-2=${a[2]}$`];
          if (n === 3) st.push(`$x^{3}+\\frac{1}{x^{3}}=\\left(x+\\frac{1}{x}\\right)^{3}-3\\left(x+\\frac{1}{x}\\right)=${k ** 3}-${3 * k}=${a[3]}$`);
          if (n === 4) st.push(`$x^{4}+\\frac{1}{x^{4}}=\\left(x^{2}+\\frac{1}{x^{2}}\\right)^{2}-2=${a[2] ** 2}-2=${a[4]}$`);
          if (n === 5) {
            st.push(`$x^{3}+\\frac{1}{x^{3}}=${k ** 3}-${3 * k}=${a[3]}$`);
            st.push(`$x^{5}+\\frac{1}{x^{5}}=\\left(x^{2}+\\frac{1}{x^{2}}\\right)\\left(x^{3}+\\frac{1}{x^{3}}\\right)-\\left(x+\\frac{1}{x}\\right)=${a[2]}\\cdot ${a[3]}-${k}=${a[5]}$`);
          }
          return {
            q: `${tex(`x+\\frac{1}{x}=${k}`)} のとき、${tex(`x^{${n}}+\\frac{1}{x^{${n}}}`)} の値は？`,
            ans: a[n],
            hint: "$x\\cdot\\frac{1}{x}=1$ を利用して、次数の低いものから順に求める。",
            steps: st,
          };
        }),
      ],
    },
  },
  // ─────────────────────────────────────────────────────
  {
    ...H,
    id: "HI-inbun", area: "num", name: "因数分解", desc: "たすき掛け・置き換え・3乗の因数分解",
    prereqs: ["HI-tenkai", "J3-g3c1u7"],
    points: [
      "たすき掛け：$acx^{2}+(ad+bc)x+bd=(ax+b)(cx+d)$。$x^{2}$ の係数と定数項の分け方を試す。",
      "$a^{3}+b^{3}=(a+b)(a^{2}-ab+b^{2})$、$a^{3}-b^{3}=(a-b)(a^{2}+ab+b^{2})$",
      "共通な部分は置き換える。文字が2つ以上なら、次数の低い文字について整理する。",
      "$x^{4}+kx^{2}+c^{2}$ は「平方の差」$(x^{2}+c)^{2}-(mx)^{2}$ に変形できないか考える。",
    ],
    levels: {
      1: [
        t("HI-inbun-1a", (r) => {
          const p = r(1, 3), q = rnz(r, -5, 5), rr = r(1, 3), s = rnz(r, -5, 5);
          if (p * rr < 2 || gcd(p, q) !== 1 || gcd(rr, s) !== 1) return { skip: true };
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
        t("HI-inbun-1b", (r) => {
          const p = r(1, 3), q = r(1, 5), sg = sgn(r);
          if (gcd(p, q) !== 1 || p === q) return { skip: true };
          const F = (A, B) => [tex(par(A) + par(B)), pkey(pmul(A, B))];
          const P = [p ** 3, 0, 0, sg * q ** 3];
          return {
            q: `${tex(poly(P))} を因数分解すると？`,
            ...ec(r, F([p, sg * q], [p * p, -sg * p * q, q * q]), [
              F([p, sg * q], [p * p, sg * p * q, q * q]),
              F([p, -sg * q], [p * p, sg * p * q, q * q]),
              F([p, sg * q], [p * p, -2 * sg * p * q, q * q]),
            ], (i) => F([p, sg * q], [p * p, -sg * p * q, q * q + i + 1])),
            hint: `$${p === 1 ? "x" : `${p}x`}$ と $${q}$ の3乗の${sg > 0 ? "和" : "差"}と見る。`,
            steps: [
              `$${poly(P)}=(${coefVar(p)})^{3}${sg > 0 ? "+" : "-"}${q}^{3}$`,
              sg > 0 ? "$a^{3}+b^{3}=(a+b)(a^{2}-ab+b^{2})$ を使う" : "$a^{3}-b^{3}=(a-b)(a^{2}+ab+b^{2})$ を使う",
              `$=${par([p, sg * q])}${par([p * p, -sg * p * q, q * q])}$`,
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
      ],
      2: [
        t("HI-inbun-2a", (r) => {
          const p = r(1, 3), q = rnz(r, -5, 5), rr = r(1, 3), s = rnz(r, -5, 5);
          if (p * rr < 2 || gcd(p, q) !== 1 || gcd(rr, s) !== 1) return { skip: true };
          const F = (a, b, c, d) => [tex(lin(a, b, "x", "y") + lin(c, d, "x", "y")), pkey(pmul([a, b], [c, d]))];
          const P = pmul([p, q], [rr, s]);
          const e = mpoly([[P[0], "x^{2}"], [P[1], "xy"], [P[2], "y^{2}"]]);
          return {
            q: `${tex(e)} を因数分解すると？`,
            ...ec(r, F(p, q, rr, s), [F(p, s, rr, q), F(p, -q, rr, -s), F(p, q, rr, -s), F(p, -q, rr, s)], (i) => F(p, q + i + 1, rr, s)),
            hint: "$y$ を定数のように見て、$x$ の2次式としてたすき掛けをする。",
            steps: [
              `$${P[0]}=${p}\\times ${rr}$、$${P[2]}y^{2}=(${coefVar(q, "y")})(${coefVar(s, "y")})$ と分ける`,
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
              `$${poly(P)}=(x^{2}+${c})^{2}-${m * m}x^{2}$`,
              `$=(x^{2}+${c})^{2}-(${coefVar(m)})^{2}$`,
              `$=${par([1, m, c])}${par([1, -m, c])}$`,
            ],
          };
        }),
        t("HI-inbun-3b", (r) => {
          const p = rnz(r, -3, 3), q = rnz(r, -4, 4), rr = rnz(r, -3, 3), s = rnz(r, -4, 4);
          if (p === rr || q === s) return { skip: true };
          const key = (a, b, c, d) => [a + c, a * c, b + d, a * d + b * c, b * d].join(",");
          const fx = (a, b) => `(x${signedVar(a, "y")}${signed(b)})`;
          const F = (a, b, c, d) => [tex(fx(a, b) + fx(c, d)), key(a, b, c, d)];
          const e = mpoly([[1, "x^{2}"], [p + rr, "xy"], [p * rr, "y^{2}"], [q + s, "x"], [p * s + q * rr, "y"], [q * s, ""]]);
          return {
            q: `${tex(e)} を因数分解すると？`,
            ...ec(r, F(p, q, rr, s), [F(p, s, rr, q), F(p, -q, rr, -s), F(-p, q, -rr, s), F(rr, q, p, s)], (i) => F(p, q + i + 1, rr, s)),
            hint: "$x$ について整理し、定数項（$y$ の式）を先に因数分解してからたすき掛けをする。",
            steps: [
              `$x$ について整理：$x^{2}+(${mpoly([[p + rr, "y"], [q + s, ""]])})x+(${mpoly([[p * rr, "y^{2}"], [p * s + q * rr, "y"], [q * s, ""]])})$`,
              `定数項 $=(${mpoly([[p, "y"], [q, ""]])})(${mpoly([[rr, "y"], [s, ""]])})$`,
              `$=${fx(p, q)}${fx(rr, s)}$`,
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
          const fx = (P, Q, A) => `(${coefVar(A, "x")}${signedVar(P, "y")}${signed(Q)})`;
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
              tex(`\\frac{${c}(${conj})}{${a + b}}`),
              tex(`\\frac{${c}}{${d}}`),
            ]),
            hint: `分母と分子に $${conj}$ を掛けて、和と差の積を作る。`,
            steps: [
              `$\\frac{${c}(${conj})}{(${den})(${conj})}=\\frac{${c}(${conj})}{${a}-${b}}$`,
              `$=\\frac{${c}(${conj})}{${d}}=${okS}$`,
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
      ],
      3: [
        t("HI-jissu-3a", (r) => {
          const [b, a] = sample(r, [2, 3, 5, 6, 7], 2).sort((u, v) => u - v);
          const [n, d] = reduce(2 * (a + b), a - b); // x+y = n/d
          const cube = r(0, 1) === 1;
          const num = cube ? n ** 3 - 3 * n * d * d : n * n - 2 * d * d;
          const den = cube ? d ** 3 : d * d;
          return {
            q: `${tex(`x=\\frac{\\sqrt{${a}}+\\sqrt{${b}}}{\\sqrt{${a}}-\\sqrt{${b}}},\\ y=\\frac{\\sqrt{${a}}-\\sqrt{${b}}}{\\sqrt{${a}}+\\sqrt{${b}}}`)} のとき、${tex(cube ? "x^{3}+y^{3}" : "x^{2}+y^{2}")} の値は？`,
            ans: fracAns(num, den),
            hint: "$x$ と $y$ を別々に計算せず、$x+y$ と $xy$ を先に求める（対称式）。",
            steps: [
              `$xy=1$、$x+y=\\frac{(\\sqrt{${a}}+\\sqrt{${b}})^{2}+(\\sqrt{${a}}-\\sqrt{${b}})^{2}}{${a}-${b}}=\\frac{${2 * (a + b)}}{${a - b}}=${fracTex(n, d)}$`,
              cube ? "$x^{3}+y^{3}=(x+y)^{3}-3xy(x+y)$" : "$x^{2}+y^{2}=(x+y)^{2}-2xy$",
              cube ? `$=\\left(${fracTex(n, d)}\\right)^{3}-3\\cdot ${fracTex(n, d)}=${fracTex(num, den)}$` : `$=\\left(${fracTex(n, d)}\\right)^{2}-2=${fracTex(num, den)}$`,
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
              `1つ目：$${I1.mid}$ より $${ivTex([L, e1], null)}$`,
              `2つ目：$${I2.mid}$ より $${ivTex(null, [U, e2])}$`,
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
              `1つ目より $${coefVar(d)}<${d * U}$、$x<${U}$`,
              `$a<x<${U}$ に入る整数が ${Array.from({ length: n }, (_, i) => U - n + i).join(", ")} の ${n} 個になればよい`,
              `$a=${A}$ なら $x=${A}$ は入らないのでよい。$a=${B}$ だと $x=${B}$ が入らなくなる`,
              `$${A}\\leqq a<${B}$`,
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
              `1つ目より $${coefVar(A)}${dir} ${A * L}$、$x>${L}$。2つ目より $x<\\frac{a${sh(c)}}{${m}}$`,
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
              `右側：$${k - 1 === 1 ? "" : k - 1}x<${p + q}$ より $x<${hi}$`,
              `左側：$${k + 1}x>${p - q}$ より $x>${lo}$`,
              `$${lo}<x<${hi}$`,
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
      "$A\\cap B$ は共通部分、$A\\cup B$ は和集合、$\\overline{A}$ は補集合。ド・モルガン $\\overline{A\\cup B}=\\overline{A}\\cap\\overline{B}$",
      "$n(A\\cup B)=n(A)+n(B)-n(A\\cap B)$（重なりを2回数えないように引く）",
      "$p\\Rightarrow q$ が真のとき、$p$ は $q$ であるための十分条件、$q$ は $p$ であるための必要条件。",
      "命題 $p\\Rightarrow q$ と対偶 $\\overline{q}\\Rightarrow\\overline{p}$ の真偽は一致する。条件を集合で表すと「小さい方が十分条件」。",
    ],
    levels: {
      1: [
        t("HI-shugo-1a", (r) => {
          const U = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
          const A = sample(r, U, r(3, 6)).sort((x, y) => x - y), B = sample(r, U, r(3, 6)).sort((x, y) => x - y);
          const kinds = [
            ["A\\cap B", U.filter((x) => A.includes(x) && B.includes(x))],
            ["A\\cup B", U.filter((x) => A.includes(x) || B.includes(x))],
            ["\\overline{A}\\cap B", U.filter((x) => !A.includes(x) && B.includes(x))],
            ["\\overline{A\\cup B}", U.filter((x) => !A.includes(x) && !B.includes(x))],
          ];
          const [name, S] = pick(r, kinds);
          return {
            q: `全体集合 ${tex("U=\\{1,2,3,\\ldots,10\\}")} の部分集合 ${tex(`A=\\{${A.join(",")}\\}`)}、${tex(`B=\\{${B.join(",")}\\}`)} について、${tex(`n(${name})`)} は？`,
            ans: S.length,
            unit: "個",
            hint: "記号の意味（$\\cap$ は「かつ」、$\\cup$ は「または」、上の線は「でない」）を確かめて、要素を書き出す。",
            steps: [
              `$${name}=${S.length ? `\\{${S.join(",")}\\}` : "\\varnothing"}$`,
              `要素の個数は ${S.length} 個`,
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
            q: `${tex("x,\\ y")} は実数とする。条件 ${tex(p)} は、条件 ${tex(q)} であるための何条件？`,
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
        t("HI-shugo-2b", (r) => {
          const N = r(5, 20) * 10, [a, b] = sample(r, [2, 3, 4, 5, 6, 7, 8, 9], 2);
          const L = (a * b) / gcd(a, b);
          const na = Math.floor(N / a), nb = Math.floor(N / b), nab = Math.floor(N / L);
          const kind = r(0, 2);
          const v = [na + nb - nab, N - (na + nb - nab), na - nab][kind];
          const what = [`${a} または ${b} で割り切れる数`, `${a} でも ${b} でも割り切れない数`, `${a} で割り切れるが ${b} では割り切れない数`][kind];
          return {
            q: `1 から ${N} までの整数のうち、${what}は何個？`,
            ans: v,
            unit: "個",
            hint: "$a$ の倍数の集合を $A$、$b$ の倍数の集合を $B$ として、$n(A\\cup B)=n(A)+n(B)-n(A\\cap B)$ を使う。",
            steps: [
              `$n(A)=${na}$、$n(B)=${nb}$、$A\\cap B$ は ${L} の倍数で $n(A\\cap B)=${nab}$`,
              [`$n(A\\cup B)=${na}+${nb}-${nab}=${v}$`, `$${N}-n(A\\cup B)=${N}-${na + nb - nab}=${v}$`, `$n(A)-n(A\\cap B)=${na}-${nab}=${v}$`][kind],
            ],
          };
        }),
      ],
      3: [
        t("HI-shugo-3a", (r) => {
          const N = r(10, 30) * 10, [a, b, c] = sample(r, [2, 3, 5, 7], 3).sort((x, y) => x - y);
          const f = (k) => Math.floor(N / k);
          const any = f(a) + f(b) + f(c) - f(a * b) - f(b * c) - f(c * a) + f(a * b * c);
          const none = r(0, 1) === 1;
          return {
            q: `1 から ${N} までの整数のうち、${a}, ${b}, ${c} の${none ? "どれでも割り切れない" : "少なくとも1つで割り切れる"}数は何個？`,
            ans: none ? N - any : any,
            unit: "個",
            hint: "$n(A\\cup B\\cup C)=n(A)+n(B)+n(C)-n(A\\cap B)-n(B\\cap C)-n(C\\cap A)+n(A\\cap B\\cap C)$",
            steps: [
              `${a}, ${b}, ${c} の倍数：${f(a)}, ${f(b)}, ${f(c)} 個。${a * b}, ${b * c}, ${c * a} の倍数：${f(a * b)}, ${f(b * c)}, ${f(c * a)} 個。${a * b * c} の倍数：${f(a * b * c)} 個`,
              `$n(A\\cup B\\cup C)=${f(a) + f(b) + f(c)}-${f(a * b) + f(b * c) + f(c * a)}+${f(a * b * c)}=${any}$`,
              none ? `どれでも割り切れない数は $${N}-${any}=${N - any}$` : `答えは ${any} 個`,
            ],
          };
        }),
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
      ],
      4: [
        t("HI-shugo-4a", (r) => {
          const N = r(10, 30) * 10, [a, b, c] = sample(r, [2, 3, 5, 7], 3);
          const f = (k) => Math.floor(N / k);
          let v = 0;
          for (let x = 1; x <= N; x++) if (x % a !== 0 && (x % b === 0 || x % c === 0)) v++;
          const bc = f(b) + f(c) - f(b * c), abc = f(a * b) + f(a * c) - f(a * b * c);
          return {
            q: `1 から ${N} までの整数で、${a} の倍数の集合を ${tex("A")}、${b} の倍数の集合を ${tex("B")}、${c} の倍数の集合を ${tex("C")} とする。${tex("n(\\overline{A}\\cap(B\\cup C))")} は？`,
            ans: v,
            hint: "$n(\\overline{A}\\cap X)=n(X)-n(A\\cap X)$。$A\\cap(B\\cup C)=(A\\cap B)\\cup(A\\cap C)$ と分配する。",
            steps: [
              `$n(B\\cup C)=${f(b)}+${f(c)}-${f(b * c)}=${bc}$`,
              `$n(A\\cap(B\\cup C))=n(A\\cap B)+n(A\\cap C)-n(A\\cap B\\cap C)=${f(a * b)}+${f(a * c)}-${f(a * b * c)}=${abc}$`,
              `$${bc}-${abc}=${v}$`,
            ],
          };
        }),
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
            ["x>y", "x^{3}>y^{3}", true, true, "$x^{3}-y^{3}=(x-y)(x^{2}+xy+y^{2})$ で第2因数は正", "同じ式から逆も成り立つ"],
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
              `$y=${a}(${poly([1, -2 * p, 0])})${signed(c)}$`,
              `$=${a}\\{(x${signed(-p)})^{2}-${p * p}\\}${signed(c)}=${a}(x${signed(-p)})^{2}${sh(q)}$`,
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
            q: `軸が直線 ${tex(`x=${p}`)} で、2点 ${tex(`(${x1},\\ ${f(x1)})`)}、${tex(`(${x2},\\ ${f(x2)})`)} を通る放物線を ${tex(`y=a(x${sh(-p)})^{2}+q`)} と表すとき、${tex(askA ? "a" : "q")} の値は？`,
            ans: askA ? a : q,
            hint: "軸がわかっているので $y=a(x-p)^{2}+q$ とおき、2点を代入する。",
            steps: [
              `$${f(x1)}=${u1}a+q$、$${f(x2)}=${u2}a+q$`,
              `辺々引いて $${f(x1) - f(x2)}=${u1 - u2}a$ より $a=${a}$`,
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
      ],
    },
  },
