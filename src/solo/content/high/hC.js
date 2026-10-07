// ============================================================
// hC.js — 高校 数学C の単元（数学ラボ ソロ）
//   平面ベクトル / 空間ベクトル / 複素数平面 / 2次曲線と媒介変数
// 書き方は docs/solo-問題データの書き方.md を参照
// ============================================================
import { t, pick, rnz, sgn, shuffle, gcd, reduce, fracAns, fracTex, sqrtSimp, sqrtTex, signed, signedVar, choices4 } from "../kit.js";

// ── この単元で使う小道具 ─────────────────────────────────
/** (n/d)√s の TeX（s は自動で簡単にする） */
function surd(n, d = 1, s = 1) {
  if (n === 0 || s === 0) return "0";
  const [a0, b0] = sqrtSimp(s);
  const [p, q] = reduce(n * a0, d);
  if (b0 === 1) return fracTex(p, q);
  const sg = p < 0 ? "-" : "";
  const ap = Math.abs(p);
  const rt = `\\sqrt{${b0}}`;
  if (q === 1) return `${sg}${ap === 1 ? "" : ap}${rt}`;
  return `${sg}\\frac{${ap === 1 ? "" : ap}${rt}}{${q}}`;
}

/** 係数 n/d × 記号 sym（先頭用・符号込み）。sym が "" なら定数 */
function termTex(n, d, sym) {
  const [p, q] = reduce(n, d);
  if (sym === "") return fracTex(p, q);
  const sg = p < 0 ? "-" : "";
  const ap = Math.abs(p);
  if (q === 1) return `${sg}${ap === 1 ? "" : ap}${sym}`;
  return `${sg}\\frac{${ap}}{${q}}${sym}`;
}

/** 1次結合の TeX。terms = [[分子, 分母, 記号], ...] */
function lin(terms) {
  let s = "";
  for (const [n, d, sym] of terms) {
    if (n === 0) continue;
    const tt = termTex(n, d, sym);
    s += s === "" ? tt : tt.startsWith("-") ? tt : "+" + tt;
  }
  return s || "0";
}

/** 成分表示 (1,\ -2,\ 3) */
const vt = (arr) => `(${arr.join(",\\ ")})`;
/** 負の数にかっこ */
const par = (n) => (n < 0 ? `(${n})` : `${n}`);
/** 度数の TeX */
const degT = (d) => `$${d}^{\\circ}$`;

/** 角 (num/den)π の TeX */
function radFrac(num, den) {
  const [n, d] = reduce(num, den);
  if (n === 0) return "0";
  const sg = n < 0 ? "-" : "";
  const an = Math.abs(n);
  if (d === 1) return `${sg}${an === 1 ? "" : an}\\pi`;
  if (an === 1) return `${sg}\\frac{\\pi}{${d}}`;
  return `${sg}\\frac{${an}}{${d}}\\pi`;
}
/** 度 → ラジアンの TeX */
const radT = (deg) => radFrac(deg, 180);

// cos, sin の値 [分子, 分母, √の中] （30° と 45° の倍数）
const TRIG = {
  0: [[1, 1, 1], [0, 1, 1]],
  30: [[1, 2, 3], [1, 2, 1]],
  45: [[1, 2, 2], [1, 2, 2]],
  60: [[1, 2, 1], [1, 2, 3]],
  90: [[0, 1, 1], [1, 1, 1]],
};
function trig(deg) {
  deg = ((deg % 360) + 360) % 360;
  let ref, cs, ss;
  if (deg <= 90) { ref = deg; cs = 1; ss = 1; }
  else if (deg <= 180) { ref = 180 - deg; cs = -1; ss = 1; }
  else if (deg <= 270) { ref = deg - 180; cs = -1; ss = -1; }
  else { ref = 360 - deg; cs = 1; ss = -1; }
  const [c, s] = TRIG[ref];
  return [[c[0] * cs, c[1], c[2]], [s[0] * ss, s[1], s[2]]];
}

/** 複素数 re + im i の TeX（re, im は [分子, 分母, √の中]） */
function cplx(re, im) {
  const r = re[0] === 0 ? "" : surd(...re);
  if (im[0] === 0) return r || "0";
  const it = surd(...im);
  const iT = it === "1" ? "i" : it === "-1" ? "-i" : it + "i";
  if (!r) return iT;
  return r + (iT.startsWith("-") ? iT : "+" + iT);
}
/** 整数の複素数 a+bi */
const ci = (a, b) => cplx([a, 1, 1], [b, 1, 1]);

/** a + b√3 の TeX */
function ab3(a, b) {
  const s3 = b === 0 ? "" : surd(b, 1, 3);
  if (a === 0) return s3 || "0";
  if (!s3) return String(a);
  return `${a}${s3.startsWith("-") ? s3 : "+" + s3}`;
}
/** (R1 + R2√3) + (I1 + I2√3) i の TeX */
function cplx3(R1, R2, I1, I2) {
  const re = R1 === 0 && R2 === 0 ? "" : ab3(R1, R2);
  if (I1 === 0 && I2 === 0) return re || "0";
  let im;
  if (I1 !== 0 && I2 !== 0) im = `(${ab3(I1, I2)})i`;
  else if (I2 === 0) im = I1 === 1 ? "i" : I1 === -1 ? "-i" : `${I1}i`;
  else im = surd(I2, 1, 3) + "i";
  if (!re) return im;
  return re + (im.startsWith("-") ? im : "+" + im);
}

/** (v - h)^2 の TeX */
const sqv = (v, h) => (h === 0 ? `${v}^{2}` : `(${v}${signed(-h)})^{2}`);

// ピタゴラス数
const PY = [[3, 4, 5], [4, 3, 5], [5, 12, 13], [12, 5, 13], [6, 8, 10], [8, 6, 10], [8, 15, 17], [15, 8, 17]];
// 3次元の「長さが整数」になる成分
const PY3 = [[1, 2, 2, 3], [2, 3, 6, 7], [1, 4, 8, 9], [4, 4, 7, 9], [2, 6, 9, 11], [6, 6, 7, 11], [2, 4, 4, 6], [3, 4, 12, 13]];
/** 符号つき並べかえ */
function signedPerm(r, arr) {
  return shuffle(r, arr).map((x) => x * sgn(r));
}

// ── 平面ベクトル ─────────────────────────────────────
const VECTOR = {
  id: "HC-vector",
  grade: "H2",
  area: "geo",
  name: "平面ベクトル",
  desc: "成分・内積・なす角・位置ベクトル",
  prereqs: ["HI-seigen", "HII-zuhou"],
  course: "数学C",
  rikei: false,
  points: [
    "成分 $\\vec{a}=(a_{1},a_{2})$ の大きさは $|\\vec{a}|=\\sqrt{a_{1}^{2}+a_{2}^{2}}$。長さの問題はまず2乗して内積で展開する。",
    "内積 $\\vec{a}\\cdot\\vec{b}=a_{1}b_{1}+a_{2}b_{2}=|\\vec{a}||\\vec{b}|\\cos\\theta$。なす角は $\\cos\\theta$ を求めてから。",
    "垂直 $\\Leftrightarrow\\ \\vec{a}\\cdot\\vec{b}=0$、平行 $\\Leftrightarrow\\ \\vec{b}=k\\vec{a}$。",
    "AB を $m:n$ に内分する点は $\\frac{n\\vec{a}+m\\vec{b}}{m+n}$。交点は「2通りに表して係数比較」。",
  ],
  levels: {
    1: [
      t("HC-vector-1a", (r) => {
        const a = [rnz(r, -5, 5), rnz(r, -5, 5)], b = [rnz(r, -5, 5), rnz(r, -5, 5)];
        const ans = a[0] * b[0] + a[1] * b[1];
        return {
          q: `$\\vec{a}=${vt(a)}$, $\\vec{b}=${vt(b)}$ のとき、内積 $\\vec{a}\\cdot\\vec{b}$ を求めよ。`,
          ans,
          hint: "内積は「x成分どうしの積」と「y成分どうしの積」の和。",
          steps: [
            `$\\vec{a}\\cdot\\vec{b}=${a[0]}\\times${par(b[0])}+${par(a[1])}\\times${par(b[1])}$`,
            `$=${a[0] * b[0]}${signed(a[1] * b[1])}=${ans}$`,
          ],
        };
      }),
      t("HC-vector-1b", (r) => {
        const [x, y, h] = pick(r, PY);
        const s = [x * sgn(r), y * sgn(r)];
        const a = [rnz(r, -4, 4), rnz(r, -4, 4)];
        const b = [s[0] - a[0], s[1] - a[1]];
        return {
          q: `$\\vec{a}=${vt(a)}$, $\\vec{b}=${vt(b)}$ のとき、$|\\vec{a}+\\vec{b}|$ を求めよ。`,
          ans: h,
          hint: "まず $\\vec{a}+\\vec{b}$ を成分で計算してから大きさを求める。",
          steps: [
            `$\\vec{a}+\\vec{b}=${vt(s)}$`,
            `$|\\vec{a}+\\vec{b}|=\\sqrt{${par(s[0])}^{2}+${par(s[1])}^{2}}=\\sqrt{${h * h}}=${h}$`,
          ],
        };
      }),
      t("HC-vector-1c", (r) => {
        const th = pick(r, [60, 120, 45, 135, 30, 150]);
        const k = r(1, 4), q = r(1, 5);
        let aT, num, den, cosT;
        const sg = th > 90 ? -1 : 1;
        if (th === 60 || th === 120) { aT = String(2 * k); num = sg * 2 * k * q; den = 2; cosT = th === 60 ? "\\frac{1}{2}" : "-\\frac{1}{2}"; }
        else if (th === 45 || th === 135) { aT = sqrtTex(k, 2); num = sg * k * q; den = 1; cosT = th === 45 ? "\\frac{\\sqrt{2}}{2}" : "-\\frac{\\sqrt{2}}{2}"; }
        else { aT = sqrtTex(k, 3); num = sg * 3 * k * q; den = 2; cosT = th === 30 ? "\\frac{\\sqrt{3}}{2}" : "-\\frac{\\sqrt{3}}{2}"; }
        const ans = fracAns(num, den);
        return {
          q: `$|\\vec{a}|=${aT}$, $|\\vec{b}|=${q}$ で、$\\vec{a}$ と $\\vec{b}$ のなす角が ${degT(th)} のとき、内積 $\\vec{a}\\cdot\\vec{b}$ を求めよ。`,
          ans,
          hint: "内積の定義 $\\vec{a}\\cdot\\vec{b}=|\\vec{a}||\\vec{b}|\\cos\\theta$ に代入する。",
          steps: [
            `$\\vec{a}\\cdot\\vec{b}=${aT}\\times${q}\\times\\cos${th}^{\\circ}$`,
            `$=${aT}\\times${q}\\times\\left(${cosT}\\right)=${fracTex(num, den)}$`,
          ],
        };
      }),
    ],
    2: [
      t("HC-vector-2a", (r) => {
        const mode = r(0, 2);
        if (mode === 2) {
          // (a + t b) ⊥ c
          const a = [rnz(r, -4, 4), rnz(r, -4, 4)], b = [rnz(r, -3, 3), rnz(r, -3, 3)], c = [rnz(r, -3, 3), rnz(r, -3, 3)];
          const ac = a[0] * c[0] + a[1] * c[1], bc = b[0] * c[0] + b[1] * c[1];
          if (bc === 0 || ac === 0) return { skip: true };
          return {
            q: `$\\vec{a}=${vt(a)}$, $\\vec{b}=${vt(b)}$, $\\vec{c}=${vt(c)}$ とする。$\\vec{a}+t\\vec{b}$ と $\\vec{c}$ が垂直になるような実数 $t$ の値を求めよ。`,
            ans: fracAns(-ac, bc),
            hint: "垂直なら内積が0。$(\\vec{a}+t\\vec{b})\\cdot\\vec{c}=0$ を t の式にする。",
            steps: [
              `$(\\vec{a}+t\\vec{b})\\cdot\\vec{c}=\\vec{a}\\cdot\\vec{c}+t\\,\\vec{b}\\cdot\\vec{c}=0$`,
              `$\\vec{a}\\cdot\\vec{c}=${ac}$, $\\vec{b}\\cdot\\vec{c}=${bc}$ より $${ac}${signed(bc)}t=0$`,
              `$t=${fracTex(-ac, bc)}$`,
            ],
          };
        }
        const a = [rnz(r, -5, 5), rnz(r, -5, 5)], b2 = rnz(r, -6, 6);
        if (mode === 0) {
          const ans = fracAns(-a[1] * b2, a[0]);
          return {
            q: `$\\vec{a}=${vt(a)}$, $\\vec{b}=(x,\\ ${b2})$ が垂直であるとき、$x$ の値を求めよ。`,
            ans,
            hint: "垂直 ⇔ 内積が0。",
            steps: [
              `$\\vec{a}\\cdot\\vec{b}=${a[0]}x${signed(a[1] * b2)}=0$`,
              `$x=${fracTex(-a[1] * b2, a[0])}$`,
            ],
          };
        }
        const ans = fracAns(a[0] * b2, a[1]);
        return {
          q: `$\\vec{a}=${vt(a)}$, $\\vec{b}=(x,\\ ${b2})$ が平行であるとき、$x$ の値を求めよ。`,
          ans,
          hint: "平行 ⇔ $\\vec{b}=k\\vec{a}$。成分の比が等しい。",
          steps: [
            `$\\vec{b}=k\\vec{a}$ とおくと $${b2}=${a[1]}k$ より $k=${fracTex(b2, a[1])}$`,
            `$x=${a[0]}k=${fracTex(a[0] * b2, a[1])}$`,
          ],
        };
      }),
      t("HC-vector-2b", (r) => {
        let p = 0, q = 0;
        while (p === 0 && q === 0) { p = r(-3, 3); q = r(-3, 3); }
        const m = pick(r, [1, 0, -1]), s = r(1, 2), sg = sgn(r);
        const a = [p, q];
        const b = [s * (m * p - sg * q), s * (m * q + sg * p)];
        const th = m === 1 ? 45 : m === 0 ? 90 : 135;
        const dot = a[0] * b[0] + a[1] * b[1];
        const A = p * p + q * q, B = b[0] * b[0] + b[1] * b[1];
        const cosT = m === 1 ? "\\frac{1}{\\sqrt{2}}" : m === 0 ? "0" : "-\\frac{1}{\\sqrt{2}}";
        const ans = degT(th);
        return {
          q: `$\\vec{a}=${vt(a)}$, $\\vec{b}=${vt(b)}$ のなす角 $\\theta$ を求めよ。ただし $0^{\\circ}\\leqq\\theta\\leqq180^{\\circ}$ とする。`,
          ans,
          choices: choices4(r, ans, [degT(180 - th), degT(60), degT(120), degT(30), degT(150)]),
          hint: "$\\cos\\theta=\\frac{\\vec{a}\\cdot\\vec{b}}{|\\vec{a}||\\vec{b}|}$ を計算する。",
          steps: [
            `$\\vec{a}\\cdot\\vec{b}=${dot}$, $|\\vec{a}|=${sqrtTex(1, A)}$, $|\\vec{b}|=${sqrtTex(1, B)}$`,
            `$\\cos\\theta=\\frac{${dot}}{${sqrtTex(1, A)}\\times${sqrtTex(1, B)}}=${cosT}$`,
            `よって $\\theta=${th}^{\\circ}$`,
          ],
        };
      }),
      t("HC-vector-2c", (r) => {
        const m = r(1, 5);
        let n = r(1, 5);
        if (n === m) n = m === 5 ? 4 : m + 1;
        const vab = (x, y, z) => `$\\overrightarrow{OP}=${lin([[x, z, "\\vec{a}"], [y, z, "\\vec{b}"]])}$`;
        const ans = vab(n, m, m + n);
        return {
          q: `△OAB で $\\vec{a}=\\overrightarrow{OA}$, $\\vec{b}=\\overrightarrow{OB}$ とする。辺 AB を ${m}:${n} に内分する点を P とするとき、$\\overrightarrow{OP}$ を $\\vec{a}$, $\\vec{b}$ で表せ。`,
          ans,
          choices: choices4(r, ans, [vab(m, n, m + n), vab(-n, m, m - n), vab(1, 1, 2), vab(n, m, m * n)]),
          hint: "内分点の公式：A に近い点ほど $\\vec{a}$ の係数が大きい（係数は「たすきがけ」）。",
          steps: [
            `$\\overrightarrow{OP}=\\frac{${n}\\vec{a}+${m}\\vec{b}}{${m}+${n}}$`,
            `${ans}`,
          ],
        };
      }),
    ],
    3: [
      t("HC-vector-3a", (r) => {
        const p = r(1, 5), q = r(1, 5);
        const d = rnz(r, -(p * q - 1), p * q - 1);
        if (p * q < 2) return { skip: true };
        const M = p * p + q * q - 2 * d;
        const askMin = r(0, 1) === 1;
        const tN = -d, tD = q * q;
        const minN = p * p * q * q - d * d, minD = q * q;
        return {
          q: `$|\\vec{a}|=${p}$, $|\\vec{b}|=${q}$, $|\\vec{a}-\\vec{b}|=${sqrtTex(1, M)}$ とする。実数 $t$ を動かすとき、$|\\vec{a}+t\\vec{b}|$ を最小にする ${askMin ? "$t$ に対して、最小値の2乗 $|\\vec{a}+t\\vec{b}|^{2}$ の値" : "$t$ の値"}を求めよ。`,
          ans: askMin ? fracAns(minN, minD) : fracAns(tN, tD),
          hint: "$|\\vec{a}-\\vec{b}|^{2}$ を展開して内積を求め、$|\\vec{a}+t\\vec{b}|^{2}$ を t の2次式として平方完成する。",
          steps: [
            `$|\\vec{a}-\\vec{b}|^{2}=${p * p}-2\\vec{a}\\cdot\\vec{b}+${q * q}=${M}$ より $\\vec{a}\\cdot\\vec{b}=${d}$`,
            `$|\\vec{a}+t\\vec{b}|^{2}=${q * q}t^{2}${signed(2 * d)}t+${p * p}$`,
            `$=${q * q}\\left(t${d / (q * q) >= 0 ? "+" : "-"}${fracTex(Math.abs(d), q * q)}\\right)^{2}+${fracTex(minN, minD)}$`,
            askMin ? `最小値の2乗は $${fracTex(minN, minD)}$` : `最小になるのは $t=${fracTex(tN, tD)}$`,
          ],
        };
      }),
      t("HC-vector-3b", (r) => {
        const p = r(2, 6), q = r(2, 6);
        const d = rnz(r, -(p * q - 1), p * q - 1);
        const N = p * p * q * q - d * d;
        const ans = `$${surd(1, 2, N)}$`;
        return {
          q: `$|\\overrightarrow{OA}|=${p}$, $|\\overrightarrow{OB}|=${q}$, $\\overrightarrow{OA}\\cdot\\overrightarrow{OB}=${d}$ のとき、△OAB の面積を求めよ。`,
          ans,
          choices: choices4(r, ans, [`$${surd(1, 1, N)}$`, `$${surd(1, 2, p * p * q * q + d * d)}$`, `$${fracTex(p * q, 2)}$`]),
          hint: "面積の公式 $S=\\frac{1}{2}\\sqrt{|\\vec{a}|^{2}|\\vec{b}|^{2}-(\\vec{a}\\cdot\\vec{b})^{2}}$ を使う。",
          steps: [
            `$S=\\frac{1}{2}\\sqrt{${p}^{2}\\times${q}^{2}-${par(d)}^{2}}$`,
            `$=\\frac{1}{2}\\sqrt{${N}}=${surd(1, 2, N)}$`,
          ],
        };
      }),
      t("HC-vector-3c", (r) => {
        const m1 = r(1, 4), n1 = r(1, 4), m2 = r(1, 4), n2 = r(1, 4);
        const coef = (a1, b1, a2, b2) => {
          // OA を a1:b1、OB を a2:b2 に内分したときの [s分子, t分子, 分母]
          const B1 = a1 + b1, B2 = a2 + b2, den = B1 * B2 - a1 * a2;
          return [a1 * b2, a2 * b1, den];
        };
        const [sN, tN, D] = coef(m1, n1, m2, n2);
        const vab = ([x, y, z]) => `$\\overrightarrow{OP}=${lin([[x, z, "\\vec{a}"], [y, z, "\\vec{b}"]])}$`;
        const ans = vab([sN, tN, D]);
        const k1 = fracTex(m1, m1 + n1), k2 = fracTex(m2, m2 + n2);
        return {
          q: `△OAB において、辺 OA を ${m1}:${n1} に内分する点を C、辺 OB を ${m2}:${n2} に内分する点を D とし、線分 AD と BC の交点を P とする。$\\vec{a}=\\overrightarrow{OA}$, $\\vec{b}=\\overrightarrow{OB}$ として $\\overrightarrow{OP}$ を表せ。`,
          ans,
          choices: choices4(r, ans, [vab([tN, sN, D]), vab(coef(n1, m1, m2, n2)), vab(coef(m1, n1, n2, m2)), vab([m1 * m2, n1 * n2, m1 * m2 + n1 * n2])]),
          hint: "P を「AD 上の点」「BC 上の点」の2通りで表し、$\\vec{a}$, $\\vec{b}$ の係数を比べる。",
          steps: [
            `AP:PD $=u:(1-u)$ とおくと $\\overrightarrow{OP}=(1-u)\\vec{a}+${k2}u\\vec{b}$`,
            `BP:PC $=v:(1-v)$ とおくと $\\overrightarrow{OP}=${k1}v\\vec{a}+(1-v)\\vec{b}$`,
            `係数を比べて $1-u=${k1}v$, $${k2}u=1-v$ を解く`,
            `${ans}`,
          ],
        };
      }),
    ],
    4: [
      t("HC-vector-4a", (r) => {
        const l = r(1, 5), m = r(1, 5), n = r(1, 5);
        const S = l + m + n;
        const mode = r(0, 2);
        const eq = `${lin([[l, 1, "\\overrightarrow{PA}"], [m, 1, "\\overrightarrow{PB}"], [n, 1, "\\overrightarrow{PC}"]])}=\\vec{0}`;
        const base = [
          `A を始点にすると $\\overrightarrow{AP}=\\frac{${m}\\overrightarrow{AB}+${n}\\overrightarrow{AC}}{${S}}=\\frac{${m + n}}{${S}}\\cdot\\frac{${m}\\overrightarrow{AB}+${n}\\overrightarrow{AC}}{${m + n}}$`,
          `直線 AP と BC の交点 D は BC を ${n}:${m} に内分し、AP:PD $=${m + n}:${l}$`,
        ];
        if (mode === 0) {
          return {
            q: `△ABC の内部の点 P が $${eq}$ を満たす。直線 AP と辺 BC の交点を D とするとき、$\\frac{AP}{PD}$ の値を求めよ。`,
            ans: fracAns(m + n, l),
            hint: "A を始点にして $\\overrightarrow{AP}$ を $\\overrightarrow{AB}$, $\\overrightarrow{AC}$ で表し、BC 上の点が見える形に変形する。",
            steps: [...base, `$\\frac{AP}{PD}=${fracTex(m + n, l)}$`],
          };
        }
        const which = mode === 1 ? ["PAB", n] : ["PBC", l];
        return {
          q: `△ABC の内部の点 P が $${eq}$ を満たす。△${which[0]} の面積は △ABC の面積の何倍か。`,
          ans: fracAns(which[1], S),
          hint: "A を始点にして $\\overrightarrow{AP}$ を表し、直線 AP と BC の交点 D の位置と AP:PD を求める。",
          steps: [
            ...base,
            `面積比は △PBC:△PCA:△PAB $=${l}:${m}:${n}$`,
            `△${which[0]} は △ABC の $${fracTex(which[1], S)}$ 倍`,
          ],
        };
      }),
      t("HC-vector-4b", (r) => {
        const [x0, y0, h0] = pick(r, [[3, 4, 5], [4, 3, 5], [0, 5, 5], [5, 0, 5], [0, 2, 2], [2, 0, 2], [6, 8, 10], [8, 6, 10], [0, 4, 4]]);
        const s = [x0 * sgn(r), y0 * sgn(r)];
        const a = [r(-4, 4), r(-4, 4)];
        const b = [s[0] - a[0], s[1] - a[1]];
        const rad = r(1, 3);
        const ab = a[0] * b[0] + a[1] * b[1];
        const isMax = r(0, 1) === 1;
        const ans = ab + rad * rad + (isMax ? 1 : -1) * rad * h0;
        return {
          q: `原点 O を中心とする半径 ${rad} の円周上を点 P が動く。2点 A$${vt(a)}$, B$${vt(b)}$ に対し、内積 $\\overrightarrow{PA}\\cdot\\overrightarrow{PB}$ の${isMax ? "最大値" : "最小値"}を求めよ。`,
          ans,
          hint: "$\\overrightarrow{PA}\\cdot\\overrightarrow{PB}=(\\vec{a}-\\vec{p})\\cdot(\\vec{b}-\\vec{p})$ と展開し、動く部分を $(\\vec{a}+\\vec{b})\\cdot\\vec{p}$ だけにする。",
          steps: [
            `$\\overrightarrow{PA}\\cdot\\overrightarrow{PB}=\\vec{a}\\cdot\\vec{b}-(\\vec{a}+\\vec{b})\\cdot\\vec{p}+|\\vec{p}|^{2}$`,
            `$\\vec{a}\\cdot\\vec{b}=${ab}$, $\\vec{a}+\\vec{b}=${vt(s)}$, $|\\vec{a}+\\vec{b}|=${h0}$, $|\\vec{p}|=${rad}$`,
            `$(\\vec{a}+\\vec{b})\\cdot\\vec{p}$ は $${-rad * h0}$ 以上 $${rad * h0}$ 以下（向きが同じ・逆のとき端）`,
            `${isMax ? "最大値" : "最小値"}は $${ab}+${rad * rad}${isMax ? "+" : "-"}${rad * h0}=${ans}$`,
          ],
        };
      }),
      t("HC-vector-4c", (r) => {
        const p = r(1, 4), q = r(1, 4);
        const d = rnz(r, -(p * q - 1), p * q - 1);
        if (p * q < 2) return { skip: true };
        const P2 = p * p, Q2 = q * q;
        const den = 2 * (P2 * Q2 - d * d);
        const sN = Q2 * (P2 - d), tN = P2 * (Q2 - d);
        const vab = (x, xd, y, yd) => `$\\overrightarrow{OP}=${lin([[x, xd, "\\vec{a}"], [y, yd, "\\vec{b}"]])}$`;
        const ans = vab(sN, den, tN, den);
        const sNw = Q2 * (P2 + d), tNw = P2 * (Q2 + d);
        return {
          q: `△OAB で $|\\overrightarrow{OA}|=${p}$, $|\\overrightarrow{OB}|=${q}$, $\\overrightarrow{OA}\\cdot\\overrightarrow{OB}=${d}$ とする。△OAB の外心を P とするとき、$\\vec{a}=\\overrightarrow{OA}$, $\\vec{b}=\\overrightarrow{OB}$ を用いて $\\overrightarrow{OP}$ を表せ。`,
          ans,
          choices: choices4(r, ans, [
            vab(tN, den, sN, den),
            vab(den - 2 * sN, den, den - 2 * tN, den),
            vab(1, 3, 1, 3),
            vab(sNw, den, tNw, den),
          ]),
          hint: "外心 P から辺 OA, OB に下ろした垂線の足は中点。$\\overrightarrow{OP}\\cdot\\vec{a}=\\frac{1}{2}|\\vec{a}|^{2}$ などを使う。",
          steps: [
            `$\\overrightarrow{OP}=s\\vec{a}+t\\vec{b}$ とおく。$\\overrightarrow{OP}\\cdot\\vec{a}=\\frac{1}{2}|\\vec{a}|^{2}$, $\\overrightarrow{OP}\\cdot\\vec{b}=\\frac{1}{2}|\\vec{b}|^{2}$`,
            `$${P2}s${signed(d)}t=${fracTex(P2, 2)}$, $${d}s+${Q2}t=${fracTex(Q2, 2)}$`,
            `解くと $s=${fracTex(sN, den)}$, $t=${fracTex(tN, den)}$`,
            `${ans}`,
          ],
        };
      }),
    ],
  },
};

// ── 空間ベクトル ─────────────────────────────────────
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (u, v) => [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];

const KUKAN = {
  id: "HC-kukan",
  grade: "H2",
  area: "geo",
  name: "空間ベクトル",
  desc: "空間座標・内積・平面と直線",
  prereqs: ["HC-vector"],
  course: "数学C",
  rikei: false,
  points: [
    "空間では成分が3つ。$|\\vec{a}|=\\sqrt{a_{1}^{2}+a_{2}^{2}+a_{3}^{2}}$、内積 $a_{1}b_{1}+a_{2}b_{2}+a_{3}b_{3}$。",
    "内分点・なす角・垂直条件は平面と同じ形で z 成分が加わるだけ。",
    "点 P が平面 ABC 上 $\\Leftrightarrow\\ \\overrightarrow{AP}=s\\overrightarrow{AB}+t\\overrightarrow{AC}$（O 始点なら係数の和が1）。",
    "平面 $ax+by+cz+d=0$ と点 $(x_{0},y_{0},z_{0})$ の距離は $\\frac{|ax_{0}+by_{0}+cz_{0}+d|}{\\sqrt{a^{2}+b^{2}+c^{2}}}$。",
  ],
  levels: {
    1: [
      t("HC-kukan-1a", (r) => {
        const q4 = pick(r, PY3);
        const dv = signedPerm(r, q4.slice(0, 3));
        const A = [r(-3, 3), r(-3, 3), r(-3, 3)];
        const B = [A[0] + dv[0], A[1] + dv[1], A[2] + dv[2]];
        const h = q4[3];
        return {
          q: `2点 A$${vt(A)}$, B$${vt(B)}$ 間の距離 AB を求めよ。`,
          ans: h,
          hint: "各成分の差を2乗してたし、平方根をとる。",
          steps: [
            `$\\overrightarrow{AB}=${vt(dv)}$`,
            `AB $=\\sqrt{${par(dv[0])}^{2}+${par(dv[1])}^{2}+${par(dv[2])}^{2}}=\\sqrt{${h * h}}=${h}$`,
          ],
        };
      }),
      t("HC-kukan-1b", (r) => {
        const a = [r(-4, 4), r(-4, 4), rnz(r, -4, 4)], b = [rnz(r, -4, 4), r(-4, 4), r(-4, 4)];
        const ans = dot3(a, b);
        return {
          q: `$\\vec{a}=${vt(a)}$, $\\vec{b}=${vt(b)}$ のとき、内積 $\\vec{a}\\cdot\\vec{b}$ を求めよ。`,
          ans,
          hint: "成分どうしの積を3つたす。",
          steps: [
            `$\\vec{a}\\cdot\\vec{b}=${a[0]}\\times${par(b[0])}+${par(a[1])}\\times${par(b[1])}+${par(a[2])}\\times${par(b[2])}$`,
            `$=${ans}$`,
          ],
        };
      }),
      t("HC-kukan-1c", (r) => {
        const A = [r(-4, 4), r(-4, 4), r(-4, 4)], B = [r(-4, 4), r(-4, 4), r(-4, 4)];
        const m = r(1, 4), n = r(1, 4);
        const c = r(0, 2), name = ["x", "y", "z"][c];
        if (A[c] === B[c]) return { skip: true };
        const num = n * A[c] + m * B[c];
        return {
          q: `2点 A$${vt(A)}$, B$${vt(B)}$ を結ぶ線分 AB を ${m}:${n} に内分する点 P の ${name} 座標を求めよ。`,
          ans: fracAns(num, m + n),
          hint: "内分点 $\\frac{n\\vec{a}+m\\vec{b}}{m+n}$ を成分ごとに使う。",
          steps: [
            `${name} 座標は $\\frac{${n}\\times${par(A[c])}+${m}\\times${par(B[c])}}{${m}+${n}}=\\frac{${num}}{${m + n}}$`,
            `$=${fracTex(num, m + n)}$`,
          ],
        };
      }),
    ],
    2: [
      t("HC-kukan-2a", (r) => {
        const BASE = [
          [[1, 1, 0], [0, 1, 1], 60, "\\frac{1}{2}"],
          [[1, 1, 0], [0, -1, 1], 120, "-\\frac{1}{2}"],
          [[1, 0, 0], [1, 1, 0], 45, "\\frac{1}{\\sqrt{2}}"],
          [[1, 0, 0], [-1, 1, 0], 135, "-\\frac{1}{\\sqrt{2}}"],
          [[1, 2, 2], [2, 1, -2], 90, "0"],
          [[1, 2, 1], [2, 1, -1], 60, "\\frac{1}{2}"],
          [[2, -1, 1], [1, 1, 2], 60, "\\frac{1}{2}"],
          [[1, 0, 1], [-1, 1, 0], 120, "-\\frac{1}{2}"],
          [[0, 1, 1], [0, 0, 1], 45, "\\frac{1}{\\sqrt{2}}"],
          [[1, 2, 1], [-2, -1, 1], 120, "-\\frac{1}{2}"],
          [[1, 1, 1], [1, 1, -2], 90, "0"],
        ];
        const [a0, b0, th, cosT] = pick(r, BASE);
        const perm = shuffle(r, [0, 1, 2]);
        const sg = [sgn(r), sgn(r), sgn(r)];
        const k1 = r(1, 2), k2 = r(1, 2);
        const a = perm.map((j, i) => k1 * sg[i] * a0[j] + 0);
        const b = perm.map((j, i) => k2 * sg[i] * b0[j] + 0);
        const ans = degT(th);
        return {
          q: `$\\vec{a}=${vt(a)}$, $\\vec{b}=${vt(b)}$ のなす角 $\\theta$ を求めよ。ただし $0^{\\circ}\\leqq\\theta\\leqq180^{\\circ}$ とする。`,
          ans,
          choices: choices4(r, ans, [degT(180 - th), degT(30), degT(60), degT(120), degT(150)]),
          hint: "$\\cos\\theta=\\frac{\\vec{a}\\cdot\\vec{b}}{|\\vec{a}||\\vec{b}|}$。空間でも同じ。",
          steps: [
            `$\\vec{a}\\cdot\\vec{b}=${dot3(a, b)}$, $|\\vec{a}|=${sqrtTex(1, dot3(a, a))}$, $|\\vec{b}|=${sqrtTex(1, dot3(b, b))}$`,
            `$\\cos\\theta=\\frac{${dot3(a, b)}}{${sqrtTex(1, dot3(a, a))}\\times${sqrtTex(1, dot3(b, b))}}=${cosT}$`,
            `よって $\\theta=${th}^{\\circ}$`,
          ],
        };
      }),
      t("HC-kukan-2b", (r) => {
        const a = [rnz(r, -4, 4), r(-4, 4), rnz(r, -4, 4)];
        if (r(0, 1) === 0) {
          const b2 = r(-4, 4), b3 = rnz(r, -4, 4);
          const num = -(a[1] * b2 + a[2] * b3);
          return {
            q: `$\\vec{a}=${vt(a)}$, $\\vec{b}=(x,\\ ${b2},\\ ${b3})$ が垂直であるとき、$x$ の値を求めよ。`,
            ans: fracAns(num, a[0]),
            hint: "垂直 ⇔ 内積が0。",
            steps: [
              `$\\vec{a}\\cdot\\vec{b}=${a[0]}x${signed(a[1] * b2)}${signed(a[2] * b3)}=0$`,
              `$x=${fracTex(num, a[0])}$`,
            ],
          };
        }
        const b3 = rnz(r, -6, 6);
        return {
          q: `$\\vec{a}=${vt(a)}$, $\\vec{b}=(x,\\ y,\\ ${b3})$ が平行であるとき、$x+y$ の値を求めよ。`,
          ans: fracAns((a[0] + a[1]) * b3, a[2]),
          hint: "平行 ⇔ $\\vec{b}=k\\vec{a}$。z 成分から k を決める。",
          steps: [
            `$\\vec{b}=k\\vec{a}$ とおくと $${b3}=${a[2]}k$ より $k=${fracTex(b3, a[2])}$`,
            `$x=${a[0]}k=${fracTex(a[0] * b3, a[2])}$, $y=${a[1]}k=${fracTex(a[1] * b3, a[2])}$`,
            `$x+y=${fracTex((a[0] + a[1]) * b3, a[2])}$`,
          ],
        };
      }),
      t("HC-kukan-2c", (r) => {
        const h = r(-3, 3), k = r(-3, 3), l = r(-3, 3), R = r(1, 5);
        const c = h * h + k * k + l * l - R * R;
        const eq = `x^{2}+y^{2}+z^{2}${signedVar(-2 * h, "x")}${signedVar(-2 * k, "y")}${signedVar(-2 * l, "z")}${c === 0 ? "" : signed(c)}=0`;
        return {
          q: `球面 $${eq}$ の半径を求めよ。`,
          ans: R,
          hint: "x, y, z それぞれ平方完成して $(x-a)^{2}+(y-b)^{2}+(z-c)^{2}=r^{2}$ の形にする。",
          steps: [
            `$${sqv("x", h)}+${sqv("y", k)}+${sqv("z", l)}=${R * R}$`,
            `中心 $${vt([h, k, l])}$、半径 $${R}$`,
          ],
        };
      }),
    ],
    3: [
      t("HC-kukan-3a", (r) => {
        const y = r(-3, 3), z = r(-3, 3);
        const u = [-y, 1, 0], w = [-z, 0, 1];
        const p = r(-2, 2), q = r(-2, 2), p2 = r(-2, 2), q2 = r(-2, 2);
        if (p * q2 - q * p2 === 0) return { skip: true };
        const a = [p * u[0] + q * w[0], p, q], b = [p2 * u[0] + q2 * w[0], p2, q2];
        const yz = (Y, Z) => `$y=${Y},\\ z=${Z}$`;
        const ans = yz(y, z);
        return {
          q: `$\\vec{a}=${vt(a)}$, $\\vec{b}=${vt(b)}$ の両方に垂直なベクトル $\\vec{n}=(1,\\ y,\\ z)$ を求めよ。`,
          ans,
          choices: choices4(r, ans, [yz(-y, -z), yz(z, y), yz(-y, z), yz(y, -z), yz(-z, -y)], (i) => yz(y + i + 1, z)),
          hint: "$\\vec{a}\\cdot\\vec{n}=0$, $\\vec{b}\\cdot\\vec{n}=0$ の連立方程式を解く。",
          steps: [
            `$\\vec{a}\\cdot\\vec{n}=${a[0]}${signedVar(a[1], "y")}${signedVar(a[2], "z")}=0$`,
            `$\\vec{b}\\cdot\\vec{n}=${b[0]}${signedVar(b[1], "y")}${signedVar(b[2], "z")}=0$`,
            `連立して ${ans}`,
          ],
        };
      }),
      t("HC-kukan-3b", (r) => {
        const A = [r(-2, 2), r(-2, 2), r(-2, 2)];
        const B = [r(-3, 3), r(-3, 3), r(-3, 3)], C = [r(-3, 3), r(-3, 3), r(-3, 3)];
        const AB = sub3(B, A), AC = sub3(C, A);
        const N = cross(AB, AC);
        if (N[0] === 0) return { skip: true };
        const py = r(-3, 3), pz = r(-3, 3);
        const APy = py - A[1], APz = pz - A[2];
        // s, t（AP の y, z 成分から）
        const sN = APy * AC[2] - APz * AC[1], tN = AB[1] * APz - AB[2] * APy, D = N[0];
        const xNum = A[0] * D + sN * AB[0] + tN * AC[0];
        const xm = A[0] === 0 ? "x" : `x${signed(-A[0])}`;
        return {
          q: `4点 A$${vt(A)}$, B$${vt(B)}$, C$${vt(C)}$, P$(x,\\ ${py},\\ ${pz})$ が同じ平面上にあるとき、$x$ の値を求めよ。`,
          ans: fracAns(xNum, D),
          hint: "$\\overrightarrow{AP}=s\\overrightarrow{AB}+t\\overrightarrow{AC}$ とおき、y, z 成分から s, t を決める。",
          steps: [
            `$\\overrightarrow{AB}=${vt(AB)}$, $\\overrightarrow{AC}=${vt(AC)}$, $\\overrightarrow{AP}=(${xm},\\ ${APy},\\ ${APz})$`,
            `y, z 成分：$${APy}=${AB[1]}s${signed(AC[1])}t$, $${APz}=${AB[2]}s${signed(AC[2])}t$ より $s=${fracTex(sN, D)}$, $t=${fracTex(tN, D)}$`,
            `x 成分：$${xm}=${AB[0]}s${signed(AC[0])}t$ より $x=${fracTex(xNum, D)}$`,
          ],
        };
      }),
      t("HC-kukan-3c", (r) => {
        const q4 = pick(r, PY3);
        const n = signedPerm(r, q4.slice(0, 3));
        const P = [r(-3, 3), r(-3, 3), r(-3, 3)];
        const d = r(-8, 8);
        const val = dot3(n, P) + d;
        if (val === 0) return { skip: true };
        const eq = `${lin([[n[0], 1, "x"], [n[1], 1, "y"], [n[2], 1, "z"], [d, 1, ""]])}=0`;
        return {
          q: `点 P$${vt(P)}$ と平面 $${eq}$ の距離を求めよ。`,
          ans: fracAns(Math.abs(val), q4[3]),
          hint: "点と平面の距離の公式（分母は法線ベクトルの大きさ）。",
          steps: [
            `法線ベクトル $${vt(n)}$ の大きさは $\\sqrt{${n[0] * n[0] + n[1] * n[1] + n[2] * n[2]}}=${q4[3]}$`,
            `距離 $=\\frac{|${n[0]}\\times${par(P[0])}+${par(n[1])}\\times${par(P[1])}+${par(n[2])}\\times${par(P[2])}${signed(d)}|}{${q4[3]}}=\\frac{${Math.abs(val)}}{${q4[3]}}$`,
            `$=${fracTex(Math.abs(val), q4[3])}$`,
          ],
        };
      }),
    ],
    4: [
      t("HC-kukan-4a", (r) => {
        const s = r(1, 6), m = r(1, 3), n = r(1, 3);
        const D = 2 * (m + n);
        const N = 3 * n * n + 3 * m * m + 2 * n * m;
        const ans = `$${surd(s, D, N)}$`;
        return {
          q: `1辺の長さが ${s} の正四面体 OABC において、辺 OA の中点を M、辺 BC を ${m}:${n} に内分する点を N とする。線分 MN の長さを求めよ。`,
          ans,
          choices: choices4(r, ans, [
            `$${surd(s, D, 3 * n * n + 3 * m * m - 2 * n * m)}$`,
            `$${surd(s, D, 4 * n * n + 4 * m * m + (m + n) * (m + n))}$`,
            `$${fracTex(s * s * N, D * D)}$`,
          ], (i) => `$${surd(s, D, N + 2 * (i + 1))}$`),
          hint: "O を始点に $\\vec{a}$, $\\vec{b}$, $\\vec{c}$ をとると、どの2つの内積も「1辺の2乗の半分」。$|\\overrightarrow{MN}|^{2}$ を展開する。",
          steps: [
            `$\\overrightarrow{MN}=\\frac{${n}\\vec{b}+${m}\\vec{c}}{${m + n}}-\\frac{1}{2}\\vec{a}$、$|\\vec{a}|=|\\vec{b}|=|\\vec{c}|=${s}$、内積はどれも $${fracTex(s * s, 2)}$`,
            `$|\\overrightarrow{MN}|^{2}=\\frac{${s * s}(${n * n}+${m * m}+${n * m})}{${(m + n) * (m + n)}}-${fracTex(s * s, 2)}+${fracTex(s * s, 4)}=${fracTex(s * s * N, D * D)}$`,
            `MN $=${surd(s, D, N)}$`,
          ],
        };
      }),
      t("HC-kukan-4b", (r) => {
        const ms = [r(1, 3), r(1, 3), r(1, 3)], ns = [r(1, 3), r(1, 3), r(1, 3)];
        // Σ (m+n)/m
        let num = 0, den = 1;
        for (let i = 0; i < 3; i++) {
          const a = ms[i] + ns[i], b = ms[i];
          num = num * b + a * den; den = den * b;
          const g = gcd(num, den); num /= g; den /= g;
        }
        const kT = fracTex(3 * den, num);
        const fr = (i) => fracTex(ms[i] + ns[i], ms[i]);
        return {
          q: `四面体 OABC において、辺 OA, OB, OC をそれぞれ ${ms[0]}:${ns[0]}, ${ms[1]}:${ns[1]}, ${ms[2]}:${ns[2]} に内分する点を D, E, F とする。△ABC の重心を G とし、直線 OG と平面 DEF の交点を Q とするとき、$\\frac{OQ}{OG}$ を求めよ。`,
          ans: fracAns(3 * den, num),
          hint: "$\\overrightarrow{OQ}=k\\overrightarrow{OG}$ を $\\overrightarrow{OD}$, $\\overrightarrow{OE}$, $\\overrightarrow{OF}$ で表し、「係数の和が1」を使う。",
          steps: [
            `$\\overrightarrow{OG}=\\frac{1}{3}(\\vec{a}+\\vec{b}+\\vec{c})$、$\\vec{a}=${fr(0)}\\overrightarrow{OD}$, $\\vec{b}=${fr(1)}\\overrightarrow{OE}$, $\\vec{c}=${fr(2)}\\overrightarrow{OF}$`,
            `$\\overrightarrow{OQ}=k\\overrightarrow{OG}=\\frac{k}{3}\\left(${fr(0)}\\overrightarrow{OD}+${fr(1)}\\overrightarrow{OE}+${fr(2)}\\overrightarrow{OF}\\right)$`,
            `Q は平面 DEF 上なので係数の和が1：$\\frac{k}{3}\\times${fracTex(num, den)}=1$`,
            `$k=${kT}$ より $\\frac{OQ}{OG}=${kT}$`,
          ],
        };
      }),
      t("HC-kukan-4c", (r) => {
        const u = [r(-1, 2), r(-1, 2), r(-1, 2)], v = [r(-1, 2), r(-1, 2), r(-1, 2)];
        const w = cross(u, v);
        const W = dot3(w, w);
        if (W === 0 || W > 30) return { skip: true };
        const A = [r(-2, 2), r(-2, 2), r(-2, 2)];
        const al = r(-2, 2), be = r(-2, 2), c = sgn(r);
        const B = [0, 1, 2].map((i) => A[i] + al * u[i] + be * v[i] + c * w[i]);
        const AB = sub3(B, A);
        const ans = `$${sqrtTex(1, W)}$`;
        const pq = w.map((x) => c * x);
        return {
          q: `点 A$${vt(A)}$ を通り方向ベクトル $${vt(u)}$ の直線を $\\ell$、点 B$${vt(B)}$ を通り方向ベクトル $${vt(v)}$ の直線を $m$ とする。$\\ell$ 上の点 P と $m$ 上の点 Q の距離 PQ の最小値を求めよ。`,
          ans,
          choices: choices4(r, ans, [`$${sqrtTex(1, dot3(AB, AB))}$`, `$${surd(1, 2, W)}$`, `$${W}$`, `$${sqrtTex(1, W + 1)}$`], (i) => `$${sqrtTex(1, W + i + 2)}$`),
          hint: "P, Q をそれぞれ1文字の媒介変数で表し、PQ が両方の方向ベクトルに垂直になる条件を立てる。",
          steps: [
            `$\\overrightarrow{OP}=\\overrightarrow{OA}+s${vt(u)}$, $\\overrightarrow{OQ}=\\overrightarrow{OB}+t${vt(v)}$ とおく`,
            `$\\overrightarrow{PQ}$ が $${vt(u)}$, $${vt(v)}$ の両方に垂直になる条件から $s=${al}$, $t=${-be}$`,
            `このとき $\\overrightarrow{PQ}=${vt(pq)}$`,
            `最小値は $|\\overrightarrow{PQ}|=${sqrtTex(1, W)}$`,
          ],
        };
      }),
    ],
  },
};
