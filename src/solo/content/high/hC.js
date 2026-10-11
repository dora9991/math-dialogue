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
          // a ∥ b だと答えの t で a+tb が零ベクトルになり「垂直」にならない
          if (bc === 0 || ac === 0 || a[0] * b[1] === a[1] * b[0]) return { skip: true };
          return {
            q: `$\\vec{a}=${vt(a)}$, $\\vec{b}=${vt(b)}$, $\\vec{c}=${vt(c)}$ とする。$\\vec{a}+t\\vec{b}$ と $\\vec{c}$ が垂直になるような実数 $t$ の値を求めよ。`,
            ans: fracAns(-ac, bc),
            hint: "垂直なら内積が0。$(\\vec{a}+t\\vec{b})\\cdot\\vec{c}=0$ を t の式にする。",
            steps: [
              `$(\\vec{a}+t\\vec{b})\\cdot\\vec{c}=\\vec{a}\\cdot\\vec{c}+t\\,\\vec{b}\\cdot\\vec{c}=0$`,
              `$\\vec{a}\\cdot\\vec{c}=${ac}$, $\\vec{b}\\cdot\\vec{c}=${bc}$ より $${lin([[bc, 1, "t"], [ac, 1, ""]])}=0$`,
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
              `$\\vec{a}\\cdot\\vec{b}=${lin([[a[0], 1, "x"], [a[1] * b2, 1, ""]])}=0$`,
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
            `$\\vec{b}=k\\vec{a}$ とおくと $${b2}=${termTex(a[1], 1, "k")}$ より $k=${fracTex(b2, a[1])}$`,
            `$x=${termTex(a[0], 1, "k")}=${fracTex(a[0] * b2, a[1])}$`,
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
            dot === 0 ? "内積が $0$ なので $\\cos\\theta=0$" : `$\\cos\\theta=\\frac{${dot}}{${sqrtTex(1, A)}\\times${sqrtTex(1, B)}}=${cosT}$`,
            `よって $\\theta=${th}^{\\circ}$`,
          ],
        };
      }),
      t("HC-vector-2c", (r) => {
        const m = r(1, 5);
        let n = r(1, 5);
        if (n === m) n = m === 5 ? 4 : m + 1;
        if (gcd(m, n) !== 1) return { skip: true }; // 2:4 のような約分できる比は出さない
        const vab = (x, y, z) => `$\\overrightarrow{OP}=${lin([[x, z, "\\vec{a}"], [y, z, "\\vec{b}"]])}$`;
        const ans = vab(n, m, m + n);
        return {
          q: `△OAB で $\\vec{a}=\\overrightarrow{OA}$, $\\vec{b}=\\overrightarrow{OB}$ とする。辺 AB を ${m}:${n} に内分する点を P とするとき、$\\overrightarrow{OP}$ を $\\vec{a}$, $\\vec{b}$ で表せ。`,
          ans,
          choices: choices4(r, ans, [vab(m, n, m + n), vab(-n, m, m - n), vab(1, 1, 2), vab(n, m, m * n)]),
          hint: "内分点の公式：A に近い点ほど $\\vec{a}$ の係数が大きい（係数は「たすきがけ」）。",
          steps: [
            `$\\overrightarrow{OP}=\\frac{${lin([[n, 1, "\\vec{a}"], [m, 1, "\\vec{b}"]])}}{${m}+${n}}$`,
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
            `$|\\vec{a}+t\\vec{b}|^{2}=${lin([[q * q, 1, "t^{2}"], [2 * d, 1, "t"], [p * p, 1, ""]])}$`,
            `$=${q * q === 1 ? "" : q * q}\\left(t${d / (q * q) >= 0 ? "+" : "-"}${fracTex(Math.abs(d), q * q)}\\right)^{2}+${fracTex(minN, minD)}$`,
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
        const RT = [[1, 1], [1, 2], [2, 1], [1, 3], [3, 1], [2, 3], [3, 2], [3, 4], [4, 3], [1, 4]];
        const [m1, n1] = pick(r, RT), [m2, n2] = pick(r, RT);
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
          choices: choices4(r, ans, [vab([tN, sN, D]), vab(coef(n1, m1, m2, n2)), vab(coef(m1, n1, n2, m2)), vab(coef(n1, m1, n2, m2)), `$\\overrightarrow{OP}=${lin([[m1, m1 + n1, "\\vec{a}"], [m2, m2 + n2, "\\vec{b}"]])}$`], (i) => vab([sN + i + 1, tN, D])),
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
        if (gcd(gcd(l, m), n) !== 1) return { skip: true }; // 2PA+2PB+2PC のような約分できる係数は出さない
        const S = l + m + n;
        const mode = r(0, 2);
        const ABC = lin([[m, 1, "\\overrightarrow{AB}"], [n, 1, "\\overrightarrow{AC}"]]);
        const eq = `${lin([[l, 1, "\\overrightarrow{PA}"], [m, 1, "\\overrightarrow{PB}"], [n, 1, "\\overrightarrow{PC}"]])}=\\vec{0}`;
        const base = [
          `A を始点にすると $\\overrightarrow{AP}=\\frac{${ABC}}{${S}}=${fracTex(m + n, S)}\\cdot\\frac{${ABC}}{${m + n}}$`,
          `直線 AP と BC の交点 D は BC を ${n / gcd(n, m)}:${m / gcd(n, m)} に内分し、AP:PD $=${(m + n) / gcd(m + n, l)}:${l / gcd(m + n, l)}$`,
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
        if ((a[0] === 0 && a[1] === 0) || (b[0] === 0 && b[1] === 0)) return { skip: true };
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
            vab(2 * sN, den, 2 * tN, den),
          ], (i) => vab(sN + i + 1, den, tN, den)),
          hint: "外心 P から辺 OA, OB に下ろした垂線の足は中点。$\\overrightarrow{OP}\\cdot\\vec{a}=\\frac{1}{2}|\\vec{a}|^{2}$ などを使う。",
          steps: [
            `$\\overrightarrow{OP}=s\\vec{a}+t\\vec{b}$ とおく。$\\overrightarrow{OP}\\cdot\\vec{a}=\\frac{1}{2}|\\vec{a}|^{2}$, $\\overrightarrow{OP}\\cdot\\vec{b}=\\frac{1}{2}|\\vec{b}|^{2}$`,
            `$${lin([[P2, 1, "s"], [d, 1, "t"]])}=${fracTex(P2, 2)}$, $${lin([[d, 1, "s"], [Q2, 1, "t"]])}=${fracTex(Q2, 2)}$`,
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
        const [m, n] = pick(r, [[1, 1], [1, 2], [2, 1], [1, 3], [3, 1], [2, 3], [3, 2], [1, 4], [4, 1], [3, 4], [4, 3]]);
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
            dot3(a, b) === 0 ? "内積が $0$ なので $\\cos\\theta=0$" : `$\\cos\\theta=\\frac{${dot3(a, b)}}{${sqrtTex(1, dot3(a, a))}\\times${sqrtTex(1, dot3(b, b))}}=${cosT}$`,
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
              `$\\vec{a}\\cdot\\vec{b}=${lin([[a[0], 1, "x"], [a[1] * b2, 1, ""], [a[2] * b3, 1, ""]])}=0$`,
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
            `$\\vec{b}=k\\vec{a}$ とおくと $${b3}=${termTex(a[2], 1, "k")}$ より $k=${fracTex(b3, a[2])}$`,
            `$x=${termTex(a[0], 1, "k")}=${fracTex(a[0] * b3, a[2])}$, $y=${a[1] === 0 ? "0" : `${termTex(a[1], 1, "k")}=${fracTex(a[1] * b3, a[2])}`}$`,
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
        if (py === A[1] && pz === A[2]) return { skip: true };
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
            `y, z 成分：$${APy}=${lin([[AB[1], 1, "s"], [AC[1], 1, "t"]])}$, $${APz}=${lin([[AB[2], 1, "s"], [AC[2], 1, "t"]])}$ より $s=${fracTex(sN, D)}$, $t=${fracTex(tN, D)}$`,
            `x 成分：$${xm}=${lin([[AB[0], 1, "s"], [AC[0], 1, "t"]])}$ より $x=${fracTex(xNum, D)}$`,
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
            `距離 $=\\frac{|${n[0]}\\times${par(P[0])}+${par(n[1])}\\times${par(P[1])}+${par(n[2])}\\times${par(P[2])}${d === 0 ? "" : signed(d)}|}{${q4[3]}}=\\frac{${Math.abs(val)}}{${q4[3]}}$`,
            `$=${fracTex(Math.abs(val), q4[3])}$`,
          ],
        };
      }),
    ],
    4: [
      t("HC-kukan-4a", (r) => {
        const s = r(1, 6);
        const [m, n] = pick(r, [[1, 1], [1, 2], [2, 1], [1, 3], [3, 1], [2, 3], [3, 2]]);
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
            `$\\overrightarrow{MN}=\\frac{${lin([[n, 1, "\\vec{b}"], [m, 1, "\\vec{c}"]])}}{${m + n}}-\\frac{1}{2}\\vec{a}$、$|\\vec{a}|=|\\vec{b}|=|\\vec{c}|=${s}$、内積はどれも $${fracTex(s * s, 2)}$`,
            `$|\\overrightarrow{MN}|^{2}=\\frac{${s * s}(${n * n}+${m * m}+${n * m})}{${(m + n) * (m + n)}}-${fracTex(s * s, 2)}+${fracTex(s * s, 4)}=${fracTex(s * s * N, D * D)}$`,
            `MN $=${surd(s, D, N)}$`,
          ],
        };
      }),
      t("HC-kukan-4b", (r) => {
        const RT = [[1, 1], [1, 2], [2, 1], [1, 3], [3, 1], [2, 3], [3, 2]];
        const rr = [pick(r, RT), pick(r, RT), pick(r, RT)];
        const ms = rr.map((x) => x[0]), ns = rr.map((x) => x[1]);
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

// ── 複素数平面 ───────────────────────────────────────
/** 偏角 deg（30°・45°の仲間）、大きさ k 倍の点 → [TeX, 絶対値TeX] */
function polarPoint(deg, k) {
  const [c, s] = trig(deg);
  const ref = [30, 150, 210, 330].includes(deg) ? 30 : [45, 135, 225, 315].includes(deg) ? 45 : 60;
  // 45°系：r = k√2 → 成分 ±k、30°・60°系：r = 2k → 成分 ±k√3, ±k
  const mul = ref === 45 ? [k, 1, 2] : [k * 2, 1, 1];
  const re = [c[0] * mul[0], c[1], c[2] * mul[2]];
  const im = [s[0] * mul[0], s[1], s[2] * mul[2]];
  return [cplx(re, im), ref === 45 ? sqrtTex(k, 2) : String(2 * k)];
}

const FUKUSO = {
  id: "HC-fukuso",
  grade: "H3",
  area: "geo",
  name: "複素数平面",
  desc: "絶対値・極形式・ド・モアブルの定理・回転",
  prereqs: ["HII-fukuso", "HII-sankaku"],
  course: "数学C",
  rikei: true,
  points: [
    "$z=a+bi$ は点 $(a,b)$。$|z|=\\sqrt{a^{2}+b^{2}}$、$|z_{1}-z_{2}|$ は2点間の距離、$z\\bar{z}=|z|^{2}$。",
    "極形式 $z=r(\\cos\\theta+i\\sin\\theta)$。積は「絶対値をかけ、偏角をたす」、商は「絶対値をわり、偏角をひく」。",
    "ド・モアブルの定理 $(\\cos\\theta+i\\sin\\theta)^{n}=\\cos n\\theta+i\\sin n\\theta$。",
    "点 $\\beta$ を点 $\\alpha$ のまわりに $\\theta$ 回転した点 $\\gamma$ は $\\gamma-\\alpha=(\\cos\\theta+i\\sin\\theta)(\\beta-\\alpha)$。",
  ],
  levels: {
    1: [
      t("HC-fukuso-1a", (r) => {
        const [x, y, h] = pick(r, PY);
        if (r(0, 2) === 0) {
          const [x2, y2, h2] = pick(r, [[3, 4, 5], [4, 3, 5], [1, 0, 1], [0, 2, 2], [6, 8, 10]]);
          const z1 = ci(x * sgn(r), y * sgn(r)), z2 = ci(x2 * sgn(r), y2 * sgn(r));
          return {
            q: `$|(${z1})(${z2})|$ を求めよ。`,
            ans: h * h2,
            hint: "$|z_{1}z_{2}|=|z_{1}||z_{2}|$。展開しなくてよい。",
            steps: [`$|${z1}|=${h}$, $|${z2}|=${h2}$`, `$|(${z1})(${z2})|=${h}\\times${h2}=${h * h2}$`],
          };
        }
        const a = x * sgn(r), b = y * sgn(r);
        return {
          q: `$z=${ci(a, b)}$ の絶対値 $|z|$ を求めよ。`,
          ans: h,
          hint: "$|a+bi|=\\sqrt{a^{2}+b^{2}}$。",
          steps: [`$|z|=\\sqrt{${par(a)}^{2}+${par(b)}^{2}}=\\sqrt{${h * h}}=${h}$`],
        };
      }),
      t("HC-fukuso-1b", (r) => {
        const deg = pick(r, [30, 45, 60, 120, 135, 150, 210, 225, 240, 300, 315, 330]);
        const k = r(1, 3);
        const [zT, rT] = polarPoint(deg, k);
        const ref = deg % 90 === 45 ? 45 : Math.min(deg % 180, 180 - (deg % 180));
        const ref2 = 90 - ref, qd = Math.floor(deg / 90);
        const conf = [ref2, 180 - ref2, 180 + ref2, 360 - ref2][qd];
        const wrong = [ref, 360 - deg, (deg + 180) % 360, conf].filter((d) => d !== deg).map((d) => `$${radT(d)}$`);
        const ans = `$${radT(deg)}$`;
        return {
          q: `$z=${zT}$ の偏角 $\\theta$ を求めよ。ただし $0\\leqq\\theta<2\\pi$ とする。`,
          ans,
          choices: choices4(r, ans, wrong, (i) => `$${radT((deg + 30 * (i + 1)) % 360)}$`),
          hint: "まず $|z|$ でくくって $\\cos\\theta$, $\\sin\\theta$ の値を読む。点がどの象限にあるかに注意。",
          steps: [
            `$|z|=${rT}$`,
            `$\\cos\\theta=${surd(...trig(deg)[0])}$, $\\sin\\theta=${surd(...trig(deg)[1])}$`,
            `よって $\\theta=${radT(deg)}$`,
          ],
        };
      }),
      t("HC-fukuso-1c", (r) => {
        const [x, y, h] = pick(r, PY);
        const sw = r(0, 1);
        const dx = (sw ? y : x) * sgn(r), dy = (sw ? x : y) * sgn(r);
        const a1 = r(-5, 5), a2 = r(-5, 5);
        const z1 = ci(a1, a2), z2 = ci(a1 + dx, a2 + dy);
        return {
          q: `複素数平面上の2点 A$(${z1})$, B$(${z2})$ 間の距離を求めよ。`,
          ans: h,
          hint: "2点間の距離は $|\\beta-\\alpha|$。",
          steps: [`$\\beta-\\alpha=${ci(dx, dy)}$`, `AB $=|${ci(dx, dy)}|=\\sqrt{${dx * dx}+${dy * dy}}=${h}$`],
        };
      }),
    ],
    2: [
      t("HC-fukuso-2a", (r) => {
        const fam45 = r(0, 1) === 1;
        const deg = fam45 ? pick(r, [45, 135, 225, 315]) : pick(r, [30, 60, 120, 150, 210, 240, 300, 330]);
        const n = fam45 ? r(3, 10) : r(3, 8);
        const [zT, rT] = polarPoint(deg, 1);
        // r^n = (√2)^n または 2^n → [係数, √の中]
        const M = fam45 ? [2 ** Math.floor(n / 2), n % 2 === 0 ? 1 : 2] : [2 ** n, 1];
        const pw = (ang, mag) => {
          const [c, s] = trig(ang);
          return cplx([mag[0] * c[0], c[1], mag[1] * c[2]], [mag[0] * s[0], s[1], mag[1] * s[2]]);
        };
        const ans = `$${pw(n * deg, M)}$`;
        const ref = deg % 90 === 45 ? 45 : Math.min(deg % 180, 180 - (deg % 180));
        return {
          q: `$(${zT})^{${n}}$ を計算せよ。`,
          ans,
          choices: choices4(r, ans, [
            `$${pw(n * deg, [1, 1])}$`,
            `$${pw(-n * deg, M)}$`,
            `$${pw(n * ref, M)}$`,
            `$${pw(n * deg + 180, M)}$`,
          ], (i) => `$${pw(n * deg + 90 * (i + 1), M)}$`),
          hint: "極形式に直してド・モアブルの定理。絶対値も n 乗することを忘れない。",
          steps: [
            `$${zT}=${rT}\\left(\\cos${radT(deg)}+i\\sin${radT(deg)}\\right)$`,
            `$(${zT})^{${n}}=(${rT})^{${n}}\\left(\\cos${radFrac(n * deg, 180)}+i\\sin${radFrac(n * deg, 180)}\\right)$`,
            `$=${pw(n * deg, M)}$`,
          ],
        };
      }),
      t("HC-fukuso-2b", (r) => {
        const W = pick(r, [
          [[0, 1], "$\\frac{\\pi}{2}$ だけ回転した点"],
          [[0, -1], "$-\\frac{\\pi}{2}$ だけ回転した点"],
          [[1, 1], "$\\frac{\\pi}{4}$ だけ回転し、点 A からの距離を $\\sqrt{2}$ 倍した点"],
          [[1, -1], "$-\\frac{\\pi}{4}$ だけ回転し、点 A からの距離を $\\sqrt{2}$ 倍した点"],
        ]);
        const [w, desc] = W;
        const al = [r(-4, 4), r(-4, 4)], be = [r(-4, 4), r(-4, 4)];
        const d = [be[0] - al[0], be[1] - al[1]];
        if (d[0] === 0 && d[1] === 0) return { skip: true };
        const mul = (p, q) => [p[0] * q[0] - p[1] * q[1], p[0] * q[1] + p[1] * q[0]];
        const rot = mul(w, d);
        const g = [al[0] + rot[0], al[1] + rot[1]];
        const wc = [w[0], -w[1]];
        const rotC = mul(wc, d);
        const ans = `$${ci(g[0], g[1])}$`;
        const wT = ci(w[0], w[1]);
        return {
          q: `複素数平面上で、点 B$(${ci(be[0], be[1])})$ を点 A$(${ci(al[0], al[1])})$ のまわりに${desc}を表す複素数を求めよ。`,
          ans,
          choices: choices4(r, ans, [
            `$${ci(al[0] + rotC[0], al[1] + rotC[1])}$`,
            `$${ci(...mul(w, be))}$`,
            `$${ci(rot[0], rot[1])}$`,
          ], (i) => `$${ci(g[0] + i + 1, g[1])}$`),
          hint: "A が原点に来るように平行移動 → 回転 → 元に戻す。",
          steps: [
            `$\\gamma-\\alpha=(${wT})(\\beta-\\alpha)$`,
            `$\\beta-\\alpha=${ci(d[0], d[1])}$ より $(${wT})(${ci(d[0], d[1])})=${ci(rot[0], rot[1])}$`,
            `$\\gamma=${ci(al[0], al[1])}+(${ci(rot[0], rot[1])})=${ci(g[0], g[1])}$`,
          ],
        };
      }),
      t("HC-fukuso-2c", (r) => {
        const r1 = r(1, 6), r2 = r(1, 6);
        const d1 = 15 * r(1, 11);
        let d2 = 15 * r(1, 11);
        if (d2 === d1) d2 = d1 === 165 ? 150 : d1 + 15;
        const norm = (d) => ((d % 360) + 360) % 360;
        const pf = (mn, md, deg) => {
          const m = fracTex(mn, md);
          const A = radT(norm(deg));
          return `$${m === "1" ? "" : m}\\left(\\cos${A}+i\\sin${A}\\right)$`;
        };
        const pz = (rr, dd) => `${rr === 1 ? "" : rr}\\left(\\cos${radT(dd)}+i\\sin${radT(dd)}\\right)`;
        const isProd = r(0, 1) === 1;
        let ans, wr;
        if (isProd) {
          ans = pf(r1 * r2, 1, d1 + d2);
          wr = [pf(r1 * r2, 1, d1 - d2), pf(r1 + r2, 1, d1 + d2), pf(r1 + r2, 1, d1 - d2)];
        } else {
          ans = pf(r1, r2, d1 - d2);
          wr = [pf(r1, r2, d1 + d2), pf(r1 * r2, 1, d1 - d2), pf(r2, r1, d2 - d1), pf(r1, r2, d2 - d1)];
        }
        return {
          q: `$z_{1}=${pz(r1, d1)}$, $z_{2}=${pz(r2, d2)}$ のとき、$${isProd ? "z_{1}z_{2}" : "\\frac{z_{1}}{z_{2}}"}$ を極形式で表せ（偏角は $0$ 以上 $2\\pi$ 未満）。`,
          ans,
          choices: choices4(r, ans, wr, (i) => pf(r1 * r2 + i + 1, isProd ? 1 : r2, isProd ? d1 + d2 : d1 - d2)),
          hint: isProd ? "積：絶対値はかけ算、偏角はたし算。" : "商：絶対値はわり算、偏角はひき算。",
          steps: [
            isProd
              ? `絶対値 $${r1}\\times${r2}=${r1 * r2}$、偏角 $${radT(d1)}+${radT(d2)}=${radT(d1 + d2)}$`
              : `絶対値 $${r2 === 1 ? r1 : `\\frac{${r1}}{${r2}}=${fracTex(r1, r2)}`}$、偏角 $${radT(d1)}-${radT(d2)}=${radT(d1 - d2)}$${d1 < d2 ? `（$2\\pi$ をたして $${radT(d1 - d2 + 360)}$）` : ""}`,
            `${ans}`,
          ],
        };
      }),
    ],
    3: [
      t("HC-fukuso-3a", (r) => {
        const C = pick(r, [[1, "1", 60], [-1, "-1", 120], [0, "0", 90], [2, "\\sqrt{3}", 30], [3, "\\sqrt{2}", 45]]);
        const [, cT, th] = C;
        const n = r(5, 40);
        const [c] = trig(n * th);
        const val = [2 * c[0], c[1], c[2]];
        const valT = surd(...val);
        const isInt = c[2] === 1 && (2 * c[0]) % c[1] === 0;
        const base = {
          q: `複素数 $z$ が $z+\\frac{1}{z}=${cT}$ を満たすとき、$z^{${n}}+\\frac{1}{z^{${n}}}$ の値を求めよ。`,
          hint: "$z^{2}-(\\cdots)z+1=0$ を解くと $z=\\cos\\theta\\pm i\\sin\\theta$ の形。ド・モアブルの定理へ。",
          steps: [
            `$z^{2}${{ "0": "", "1": "-z", "-1": "+z" }[cT] ?? `-${cT}z`}+1=0$ より $z=\\cos${radT(th)}\\pm i\\sin${radT(th)}$`,
            `$z^{n}+\\frac{1}{z^{n}}=2\\cos n\\theta$（複号どちらでも同じ）`,
            `$z^{${n}}+\\frac{1}{z^{${n}}}=2\\cos${radFrac(n * th, 180)}=${valT}$`,
          ],
        };
        if (isInt) return { ...base, ans: (2 * c[0]) / c[1] };
        const ans = `$${valT}$`;
        return {
          ...base,
          ans,
          choices: choices4(r, ans, [`$${surd(-val[0], val[1], val[2])}$`, `$${surd(c[0], c[1], c[2])}$`, `$${surd(-c[0], c[1], c[2])}$`, "$2$", "$-2$", "$0$"]),
        };
      }),
      t("HC-fukuso-3b", (r) => {
        // A β^2 + B αβ + C α^2 = 0 （w = β/α）、角 [O, A, B]
        const T = pick(r, [
          [[1, -2, 2], "1\\pm i", "\\sqrt{2}", 45, [45, 90, 45]],
          [[1, -2, 4], "1\\pm\\sqrt{3}i", "2", 60, [60, 90, 30]],
          [[1, -1, 1], "\\frac{1\\pm\\sqrt{3}i}{2}", "1", 60, [60, 60, 60]],
          [[1, 0, 1], "\\pm i", "1", 90, [90, 45, 45]],
          [[2, -2, 1], "\\frac{1\\pm i}{2}", "\\frac{\\sqrt{2}}{2}", 45, [45, 45, 90]],
          [[4, -2, 1], "\\frac{1\\pm\\sqrt{3}i}{4}", "\\frac{1}{2}", 60, [60, 30, 90]],
          [[1, 1, 1], "\\frac{-1\\pm\\sqrt{3}i}{2}", "1", 120, [120, 30, 30]],
        ]);
        const [[cA, cB, cC], wT, rT, phi, ang] = T;
        const swap = r(0, 1) === 1;
        // swap なら α と β の役割を入れかえる（A と B の角も入れかわる）
        const X = swap ? "\\alpha" : "\\beta", Y = swap ? "\\beta" : "\\alpha";
        const eq = `${lin([[cA, 1, `${X}^{2}`], [cB, 1, "\\alpha\\beta"], [cC, 1, `${Y}^{2}`]])}=0`;
        const angles = swap ? [ang[0], ang[2], ang[1]] : ang;
        const names = ["∠AOB", "∠OAB", "∠OBA"];
        const k = r(0, 2);
        const ans = degT(angles[k]);
        const others = [0, 1, 2].filter((i) => i !== k).map((i) => degT(angles[i]));
        return {
          q: `0 でない複素数 $\\alpha$, $\\beta$ が $${eq}$ を満たす。複素数平面上で O$(0)$, A$(\\alpha)$, B$(\\beta)$ とするとき、${names[k]} の大きさを求めよ。`,
          ans,
          choices: choices4(r, ans, [...others, degT(30), degT(45), degT(60), degT(90), degT(120)]),
          hint: `両辺を $${Y}^{2}$ でわって $\\frac{${X}}{${Y}}$ の2次方程式にする。`,
          steps: [
            `両辺を $${Y}^{2}$ でわると $\\frac{${X}}{${Y}}=${wT}$`,
            `$\\left|\\frac{${X}}{${Y}}\\right|=${rT}$、偏角 $\\pm${radT(phi)}$ より ∠AOB $=${phi}^{\\circ}$、O${swap ? "A" : "B"}:O${swap ? "B" : "A"} $=${rT}:1$`,
            `△OAB の3つの角は ∠AOB $=${angles[0]}^{\\circ}$, ∠OAB $=${angles[1]}^{\\circ}$, ∠OBA $=${angles[2]}^{\\circ}$`,
          ],
        };
      }),
      t("HC-fukuso-3c", (r) => {
        const C = pick(r, [["1", 0], ["-1", 180], ["i", 90], ["-i", 270], ["8", 0], ["-8", 180], ["16i", 90], ["-27i", 270]]);
        const [cT, phi] = C;
        const n = r(3, 8);
        const good = [];
        for (let k = 0; k < n; k++) {
          const a = (phi + 360 * k) / n;
          if (Math.cos((a * Math.PI) / 180) > 1e-9) good.push(radFrac(phi + 360 * k, 180 * n));
        }
        return {
          q: `方程式 $z^{${n}}=${cT}$ の解のうち、実部が正であるものは何個あるか。`,
          ans: good.length,
          unit: "個",
          hint: "解の偏角を $\\theta_{k}$ の形ですべて書き出し、$\\cos\\theta_{k}>0$ となるものを数える。",
          steps: [
            `解の偏角は $\\theta_{k}=\\frac{${radT(phi)}+2k\\pi}{${n}}$ $(k=${n <= 4 ? [...Array(n).keys()].join(",") : `0,1,\\cdots,${n - 1}`})$`,
            `実部が正 $\\Leftrightarrow$ $\\cos\\theta_{k}>0$（虚軸上の点は除く）`,
            good.length ? `当てはまる偏角は $${good.join(",\\ ")}$（$2\\pi$ 未満の範囲で）` : "当てはまるものはない",
            `よって ${good.length} 個`,
          ],
        };
      }),
    ],
    4: [
      t("HC-fukuso-4a", (r) => {
        const C = pick(r, [
          ["2", 0, [2, 1]], ["2i", 90, [2, 1]], ["(1+i)", 45, [1, 2]], ["(\\sqrt{3}+i)", 30, [2, 1]],
          ["(1+\\sqrt{3}i)", 60, [2, 1]], ["(2+2i)", 45, [2, 2]], ["4", 0, [4, 1]], ["4i", 90, [4, 1]],
        ]);
        const [cT, argc, [a, s]] = C;
        const be = pick(r, [30, 45]);
        const radT2 = be === 30 ? surd(a, 2, s) : surd(a, 2, 2 * s);
        const isMax = r(0, 1) === 1;
        const val = isMax ? argc + be : argc - be;
        const ans = `$${radT(val)}$`;
        return {
          q: `複素数 $z$ が $|z-${cT}|=${radT2}$ を満たして動くとき、偏角 $\\arg z$ の${isMax ? "最大値" : "最小値"}を求めよ。ただし $-\\pi<\\arg z\\leqq\\pi$ とする。`,
          ans,
          choices: choices4(r, ans, [`$${radT(isMax ? argc - be : argc + be)}$`, `$${radT(argc + (isMax ? 1 : -1) * (90 - be))}$`, `$${radT(argc)}$`, `$${radT(isMax ? argc + 2 * be : argc - 2 * be)}$`]),
          hint: "z は円周上を動く。原点からこの円に引いた接線の方向で偏角が最大・最小になる。",
          steps: [
            `中心 $${cT.replace(/^\(|\)$/g, "")}$（偏角 $${radT(argc)}$、原点からの距離 $${surd(a, 1, s)}$）、半径 $${radT2}$ の円`,
            `接線と、中心へ向かう半直線のなす角を $\\varphi$ とすると $\\sin\\varphi=\\frac{${radT2}}{${surd(a, 1, s)}}$ より $\\varphi=${radT(be)}$`,
            `${isMax ? "最大値" : "最小値"}は $${radT(argc)}${isMax ? "+" : "-"}${radT(be)}=${radT(val)}$`,
          ],
        };
      }),
      t("HC-fukuso-4b", (r) => {
        const n = r(3, 7), a = pick(r, [1, 2, 3, -1, -2]);
        const ans = a === 1 ? n : (a ** n - 1) / (a - 1);
        const aT = String(a);
        const prodT = n === 3 ? `(${aT}-z)(${aT}-z^{2})` : n === 4 ? `(${aT}-z)(${aT}-z^{2})(${aT}-z^{3})` : `(${aT}-z)(${aT}-z^{2})\\cdots(${aT}-z^{${n - 1}})`;
        const xprod = n === 3 ? "(x-z)(x-z^{2})" : n === 4 ? "(x-z)(x-z^{2})(x-z^{3})" : `(x-z)(x-z^{2})\\cdots(x-z^{${n - 1}})`;
        const sumT = n === 3 ? "x^{2}+x+1" : n === 4 ? "x^{3}+x^{2}+x+1" : `x^{${n - 1}}+x^{${n - 2}}+\\cdots+x+1`;
        return {
          q: `$z=\\cos\\frac{2\\pi}{${n}}+i\\sin\\frac{2\\pi}{${n}}$ のとき、$${prodT}$ の値を求めよ。`,
          ans,
          hint: `$${n === 3 ? "z, z^{2}" : n === 4 ? "z, z^{2}, z^{3}" : `z, z^{2}, \\cdots, z^{${n - 1}}`}$ は $x^{${n}}=1$ の 1 以外の解。因数分解の形を考える。`,
          steps: [
            `$x^{${n}}-1=(x-1)${xprod}$`,
            `両辺を $x-1$ でわると $${sumT}=${xprod}$`,
            `$x=${aT}$ を代入して ${a === 1 ? `$1$ が ${n} 個で $${n}$` : `$\\frac{${par(a)}^{${n}}-1}{${a}-1}=${ans}$`}`,
          ],
        };
      }),
      t("HC-fukuso-4c", (r) => {
        const a1 = r(-3, 3), a2 = r(-3, 3);
        const p = r(-2, 2), q = r(-2, 2);
        if (p === 0 && q === 0) return { skip: true };
        const b1 = a1 + 2 * p, b2 = a2 + 2 * q;
        const ans = `$${cplx3(a1 + p, -q, a2 + q, p)}$`;
        return {
          q: `複素数平面上の3点 A$(\\alpha)$, B$(\\beta)$, C$(\\gamma)$ が正三角形の頂点で、A→B→C の順に反時計回りに並んでいる。$\\alpha=${ci(a1, a2)}$, $\\beta=${ci(b1, b2)}$ のとき、$\\gamma$ を求めよ。`,
          ans,
          choices: choices4(r, ans, [
            `$${cplx3(a1 + p, q, a2 + q, -p)}$`,
            `$${cplx3(p, -q, q, p)}$`,
            `$${cplx3(a1 - q, p, a2 + p, q)}$`,
          ], (i) => `$${cplx3(a1 + p + i + 1, -q, a2 + q, p)}$`),
          hint: "C は、B を A のまわりに $\\frac{\\pi}{3}$ 回転した点。",
          steps: [
            `$\\gamma-\\alpha=\\left(\\cos\\frac{\\pi}{3}+i\\sin\\frac{\\pi}{3}\\right)(\\beta-\\alpha)$`,
            `$\\beta-\\alpha=${ci(2 * p, 2 * q)}$ より $\\gamma-\\alpha=\\frac{1+\\sqrt{3}i}{2}(${ci(2 * p, 2 * q)})=${cplx3(p, -q, q, p)}$`,
            `$\\gamma=${cplx3(a1 + p, -q, a2 + q, p)}$`,
          ],
        };
      }),
    ],
  },
};

// ── 2次曲線と媒介変数 ─────────────────────────────────
// 楕円と直線 y=mx+k が接する組 [a, b, m, k]（k^2 = a^2 m^2 + b^2 が平方数）
const TAN_COMBOS = [];
for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) for (let m = 1; m <= 4; m++) {
  if (a === b) continue;
  const k2 = a * a * m * m + b * b, k = Math.round(Math.sqrt(k2));
  if (k * k === k2) TAN_COMBOS.push([a, b, m, k]);
}
// 楕円上で px+qy の最大値が整数になる組 [a, b, p, q, M]
const LIN_COMBOS = [];
for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) for (let p = 1; p <= 4; p++) for (let q = 1; q <= 4; q++) {
  if (a === b) continue;
  const M2 = p * p * a * a + q * q * b * b, M = Math.round(Math.sqrt(M2));
  if (M * M === M2) LIN_COMBOS.push([a, b, p, q, M]);
}
/** x^2/A + y^2/B (= 1) の左辺 TeX。sg = -1 で双曲線 */
const conicT = (A, B, sg = 1) =>
  `${A === 1 ? "x^{2}" : `\\frac{x^{2}}{${A}}`}${sg > 0 ? "+" : "-"}${B === 1 ? "y^{2}" : `\\frac{y^{2}}{${B}}`}`;

const KYOKUSEN = {
  id: "HC-kyokusen",
  grade: "H3",
  area: "func",
  name: "2次曲線と媒介変数",
  desc: "放物線・楕円・双曲線・媒介変数・極座標",
  prereqs: ["HII-zuhou"],
  course: "数学C",
  rikei: true,
  points: [
    "放物線 $y^{2}=4px$ は焦点 $(p,0)$、準線 $x=-p$。曲線上の点から焦点と準線までの距離が等しい。",
    "楕円 $\\frac{x^{2}}{a^{2}}+\\frac{y^{2}}{b^{2}}=1\\ (a>b>0)$ は焦点 $(\\pm\\sqrt{a^{2}-b^{2}},0)$、焦点からの距離の和が $2a$。",
    "双曲線 $\\frac{x^{2}}{a^{2}}-\\frac{y^{2}}{b^{2}}=1$ は焦点 $(\\pm\\sqrt{a^{2}+b^{2}},0)$、漸近線 $y=\\pm\\frac{b}{a}x$、距離の差が $2a$。",
    "楕円は $x=a\\cos\\theta,\\ y=b\\sin\\theta$ と媒介変数表示できる。極座標は $x=r\\cos\\theta,\\ y=r\\sin\\theta$ で直交座標へ。",
  ],
  levels: {
    1: [
      t("HC-kyokusen-1a", (r) => {
        const K = rnz(r, -12, 12);
        const xForm = r(0, 1) === 1;
        const askFocus = r(0, 1) === 1;
        const eq = xForm ? `y^{2}=${K === 1 ? "" : K === -1 ? "-" : K}x` : `x^{2}=${K === 1 ? "" : K === -1 ? "-" : K}y`;
        const v = xForm ? "x" : "y";
        const p = fracTex(K, 4);
        return {
          q: askFocus
            ? `放物線 $${eq}$ の焦点の ${v} 座標を求めよ。`
            : `放物線 $${eq}$ の準線の方程式を $${v}=c$ と表すとき、$c$ の値を求めよ。`,
          ans: askFocus ? fracAns(K, 4) : fracAns(-K, 4),
          hint: xForm ? "$y^{2}=4px$ の形に合わせて p を読む。" : "$x^{2}=4py$ の形に合わせて p を読む。",
          steps: [
            `$${eq}$ を $${xForm ? "y^{2}=4px" : "x^{2}=4py"}$ と比べて $4p=${K}$、$p=${p}$`,
            askFocus ? `焦点は $${xForm ? `(${p},\\ 0)` : `(0,\\ ${p})`}$` : `準線は $${v}=${fracTex(-K, 4)}$`,
          ],
        };
      }),
      t("HC-kyokusen-1b", (r) => {
        const ell = r(0, 1) === 1;
        if (ell) {
          const [a, b, c] = pick(r, [[5, 4, 3], [5, 3, 4], [13, 12, 5], [13, 5, 12], [10, 8, 6], [10, 6, 8], [17, 15, 8], [17, 8, 15]]);
          const vert = r(0, 1) === 1;
          const eq = vert ? conicT(b * b, a * a) : conicT(a * a, b * b);
          return {
            q: `楕円 $${eq}=1$ の2つの焦点の間の距離を求めよ。`,
            ans: 2 * c,
            hint: "楕円は「大きい方の分母 − 小さい方の分母」が $c^{2}$。焦点は長軸上。",
            steps: [`$c^{2}=${a * a}-${b * b}=${c * c}$ より $c=${c}$`, `焦点は $${vert ? `(0,\\ \\pm${c})` : `(\\pm${c},\\ 0)`}$、距離は $2c=${2 * c}$`],
          };
        }
        const [a, b, c] = pick(r, [[3, 4, 5], [4, 3, 5], [5, 12, 13], [12, 5, 13], [6, 8, 10], [8, 6, 10], [8, 15, 17]]);
        return {
          q: `双曲線 $${conicT(a * a, b * b, -1)}=1$ の2つの焦点の間の距離を求めよ。`,
          ans: 2 * c,
          hint: "双曲線は $c^{2}=a^{2}+b^{2}$（楕円とちがって「たす」）。",
          steps: [`$c^{2}=${a * a}+${b * b}=${c * c}$ より $c=${c}$`, `焦点は $(\\pm${c},\\ 0)$、距離は $2c=${2 * c}$`],
        };
      }),
      t("HC-kyokusen-1c", (r) => {
        const a = r(1, 6), b = r(1, 6);
        const coefForm = r(0, 1) === 1;
        let eq;
        if (coefForm) {
          const g = gcd(a * a, b * b);
          eq = `${b * b / g === 1 ? "" : b * b / g}x^{2}-${a * a / g === 1 ? "" : a * a / g}y^{2}=${(a * a * b * b) / g}`;
        } else eq = `${conicT(a * a, b * b, -1)}=1`;
        return {
          q: `双曲線 $${eq}$ の漸近線のうち、傾きが正であるものの傾きを求めよ。`,
          ans: fracAns(b, a),
          hint: "$\\frac{x^{2}}{a^{2}}-\\frac{y^{2}}{b^{2}}=1$ の漸近線は $y=\\pm\\frac{b}{a}x$。",
          steps: [
            coefForm ? `両辺をわって $${conicT(a * a, b * b, -1)}=1$` : `$a=${a}$, $b=${b}$`,
            `漸近線は $y=\\pm ${fracTex(b, a) === "1" ? "" : fracTex(b, a)}x$、正の傾きは $${fracTex(b, a)}$`,
          ],
        };
      }),
    ],
    2: [
      t("HC-kyokusen-2a", (r) => {
        const a = r(1, 6);
        let b = r(1, 6);
        if (b === a) b = a === 6 ? 5 : a + 1;
        const g = gcd(a * a, b * b);
        const P = (b * b) / g, Q = (a * a) / g, R = (a * a * b * b) / g;
        const ell = r(0, 1) === 1;
        const cf = (c) => (c === 1 ? "" : c);
        if (ell) {
          const big = Math.max(a, b);
          return {
            q: `楕円 $${cf(P)}x^{2}+${cf(Q)}y^{2}=${R}$ 上の点 P と、2つの焦点 F, F' に対し、PF + PF' の値を求めよ。`,
            ans: 2 * big,
            hint: "標準形に直す。焦点からの距離の和は長軸の長さ。",
            steps: [`両辺を ${R} でわると $${conicT(a * a, b * b)}=1$`, `長軸の長さは $2\\times${big}=${2 * big}$ なので PF + PF' $=${2 * big}$`],
          };
        }
        return {
          q: `双曲線 $${cf(P)}x^{2}-${cf(Q)}y^{2}=${R}$ 上の点 P と、2つの焦点 F, F' に対し、$|\\mathrm{PF}-\\mathrm{PF'}|$ の値を求めよ。`,
          ans: 2 * a,
          hint: "標準形に直す。焦点からの距離の差は頂点間の距離。",
          steps: [`両辺を ${R} でわると $${conicT(a * a, b * b, -1)}=1$`, `距離の差は $2a=2\\times${a}=${2 * a}$`],
        };
      }),
      t("HC-kyokusen-2b", (r) => {
        const a = r(2, 5);
        let b = r(2, 5);
        if (b === a) b = a === 5 ? 4 : a + 1;
        const h = r(-3, 3), k = r(-3, 3);
        const hyp = r(0, 2) === 0;
        const xs = (H) => sqv("x", H), ys = (K) => sqv("y", K);
        const E = (A, B, H, K, sg) => `$\\frac{${xs(H)}}{${A}}${sg > 0 ? "+" : "-"}\\frac{${ys(K)}}{${B}}=1$`;
        const sg = hyp ? -1 : 1;
        const ans = E(a * a, b * b, h, k, sg);
        const xh = h === 0 ? "x" : `x${signed(-h)}`, yk = k === 0 ? "y" : `y${signed(-k)}`;
        const xT = hyp ? `\\frac{${a}}{\\cos\\theta}${h === 0 ? "" : signed(h)}` : `${a}\\cos\\theta${h === 0 ? "" : signed(h)}`;
        const yT = hyp ? `${b}\\tan\\theta${k === 0 ? "" : signed(k)}` : `${b}\\sin\\theta${k === 0 ? "" : signed(k)}`;
        return {
          q: `媒介変数 $\\theta$ で $x=${xT}$, $y=${yT}$ と表される曲線の方程式を求めよ。`,
          ans,
          choices: choices4(r, ans, [E(b * b, a * a, h, k, sg), E(a * a, b * b, -h, -k, sg), E(a, b, h, k, sg), E(a * a, b * b, h, k, -sg)]),
          hint: hyp ? "$\\frac{1}{\\cos^{2}\\theta}-\\tan^{2}\\theta=1$ を使って $\\theta$ を消す。" : "$\\cos^{2}\\theta+\\sin^{2}\\theta=1$ を使って $\\theta$ を消す。",
          steps: hyp
            ? [`$\\frac{1}{\\cos\\theta}=\\frac{${xh}}{${a}}$, $\\tan\\theta=\\frac{${yk}}{${b}}$`, `$\\frac{1}{\\cos^{2}\\theta}-\\tan^{2}\\theta=1$ に代入して ${ans}`]
            : [`$\\cos\\theta=\\frac{${xh}}{${a}}$, $\\sin\\theta=\\frac{${yk}}{${b}}$`, `$\\cos^{2}\\theta+\\sin^{2}\\theta=1$ に代入して ${ans}`],
        };
      }),
      t("HC-kyokusen-2c", (r) => {
        const [u0, v0, R] = pick(r, [[3, 4, 5], [4, 3, 5], [0, 1, 1], [1, 0, 1], [0, 2, 2], [2, 0, 2], [0, 3, 3], [3, 0, 3], [6, 8, 10], [5, 12, 13]]);
        const u = u0 * sgn(r), v = v0 * sgn(r);
        const p = 2 * u, q = 2 * v;
        const rhs = lin([[p, 1, "\\cos\\theta"], [q, 1, "\\sin\\theta"]]);
        const askR = r(0, 1) === 1 || u === 0;
        return {
          q: `極方程式 $r=${rhs}$ が表す円の${askR ? "半径" : "中心の x 座標"}を求めよ。`,
          ans: askR ? R : u,
          hint: "両辺に r をかけ、$r^{2}=x^{2}+y^{2}$, $r\\cos\\theta=x$, $r\\sin\\theta=y$ で直交座標に直す。",
          steps: [
            `両辺に r をかけて $r^{2}=${lin([[p, 1, "r\\cos\\theta"], [q, 1, "r\\sin\\theta"]])}$`,
            `$x^{2}+y^{2}=${lin([[p, 1, "x"], [q, 1, "y"]])}$ より $${sqv("x", u)}+${sqv("y", v)}=${R * R}$`,
            askR ? `半径は $${R}$` : `中心は $(${u},\\ ${v})$`,
          ],
        };
      }),
    ],
    3: [
      t("HC-kyokusen-3a", (r) => {
        const [a, b, m0, k] = pick(r, TAN_COMBOS);
        const m = m0 * sgn(r);
        const askK = r(0, 1) === 1;
        const lineT = `y=${m === 1 ? "" : m === -1 ? "-" : m}x+k`;
        return {
          q: askK
            ? `直線 $${lineT}$ が楕円 $${conicT(a * a, b * b)}=1$ に接するとき、正の定数 $k$ の値を求めよ。`
            : `直線 $${lineT}$（$k>0$）が楕円 $${conicT(a * a, b * b)}=1$ に接するとき、接点の x 座標を求めよ。`,
          ans: askK ? k : fracAns(-a * a * m, k),
          hint: "直線の式を楕円に代入した x の2次方程式が重解をもつ（判別式 $=0$）。",
          steps: [
            `代入して整理：$${b * b + a * a * m * m}x^{2}${signed(2 * a * a * m)}kx+${a * a === 1 ? "" : a * a}(k^{2}-${b * b})=0$`,
            `判別式 $=0$ より $k^{2}=${a * a}\\times${m * m}+${b * b}=${k * k}$、$k=${k}$`,
            askK ? `$k=${k}$` : `接点の x 座標は重解 $x=-\\frac{${2 * a * a * m}k}{2\\times${b * b + a * a * m * m}}=${fracTex(-a * a * m, k)}$`,
          ],
        };
      }),
      t("HC-kyokusen-3b", (r) => {
        const a = r(1, 5);
        let b = r(1, 5);
        if (b === a) b = a === 5 ? 4 : a + 1;
        const c2 = a * a + b * b;
        const E = (A, B, sg = 1, rhs = "1") => `$${conicT(A, B, sg)}=${rhs}$`;
        const ans = E(a * a, b * b, -1);
        const sl = fracTex(b, a);
        return {
          q: `2点 $(\\pm${sqrtTex(1, c2)},\\ 0)$ を焦点とし、2直線 $y=\\pm ${sl === "1" ? "" : sl}x$ を漸近線とする双曲線の方程式を求めよ。`,
          ans,
          choices: choices4(r, ans, [E(b * b, a * a, -1), E(a * a, b * b, -1, "-1"), E(a, b, -1), E(c2, b * b, -1)]),
          hint: "$\\frac{x^{2}}{a^{2}}-\\frac{y^{2}}{b^{2}}=1$ とおき、$a^{2}+b^{2}=c^{2}$ と $\\frac{b}{a}$ の2条件で決める。",
          steps: [
            `$\\frac{b}{a}=${sl}$, $a^{2}+b^{2}=${c2}$`,
            `$b=${sl === "1" ? "" : sl}a$ を代入して $a^{2}=${a * a}$, $b^{2}=${b * b}$`,
            `${ans}`,
          ],
        };
      }),
      t("HC-kyokusen-3c", (r) => {
        const p = r(1, 3), m = rnz(r, -3, 3);
        const ans = fracAns(4 * p * (m * m + 1), m * m);
        const mT = m === 1 ? "" : m === -1 ? "-" : m;
        return {
          q: `放物線 $y^{2}=${4 * p}x$ の焦点 F を通り、傾き $${m}$ の直線が放物線と2点 A, B で交わる。線分 AB の長さを求めよ。`,
          ans,
          hint: "放物線の定義から AF = (A の x 座標) + p。解と係数の関係で x 座標の和を出す。",
          steps: [
            `焦点 F$(${p},\\ 0)$、直線 $y=${mT}(x-${p})$ を代入：$${lin([[m * m, 1, "x^{2}"], [-(2 * p * m * m + 4 * p), 1, "x"], [m * m * p * p, 1, ""]])}=0$`,
            `$x_{1}+x_{2}=${fracTex(2 * p * m * m + 4 * p, m * m)}$`,
            `AB = AF + BF $=(x_{1}+${p})+(x_{2}+${p})=${fracTex(4 * p * (m * m + 1), m * m)}$`,
          ],
        };
      }),
    ],
    4: [
      t("HC-kyokusen-4a", (r) => {
        const th = pick(r, [60, 90, 90]);
        const A = r(3, 20), B = r(1, A - 1);
        if (th === 90 ? A < 2 * B : 3 * A < 4 * B) return { skip: true };
        const askArea = th === 90 && r(0, 1) === 1;
        const prod = th === 90 ? [2 * B, 1] : [4 * B, 3];
        const ans = askArea ? B : fracAns(prod[0], prod[1]);
        return {
          q: `楕円 $${conicT(A, B)}=1$ の2つの焦点を F, F' とする。楕円上の点 P が ∠FPF' $=${th}^{\\circ}$ を満たすとき、${askArea ? "△PFF' の面積" : "PF·PF' の値"}を求めよ。`,
          ans,
          hint: "PF + PF' $=2a$ と、△PFF' での余弦定理（FF' $=2c$）を組み合わせる。",
          steps: [
            `PF + PF' $=${sqrtTex(2, A)}$、FF' $=2c$、$c^{2}=${A}-${B}=${A - B}$`,
            `余弦定理：$4c^{2}=(\\mathrm{PF}+\\mathrm{PF'})^{2}-2\\,\\mathrm{PF}\\cdot\\mathrm{PF'}(1+\\cos${th}^{\\circ})$`,
            `$\\mathrm{PF}\\cdot\\mathrm{PF'}=\\frac{4\\times${A}-4\\times${A - B}}{2(1+\\cos${th}^{\\circ})}=${fracTex(prod[0], prod[1])}$`,
            ...(askArea ? [`面積は $\\frac{1}{2}\\mathrm{PF}\\cdot\\mathrm{PF'}=${B}$`] : []),
          ],
        };
      }),
      t("HC-kyokusen-4b", (r) => {
        const mode = r(0, 2);
        if (mode === 0) {
          const [a, b, p0, q0, M] = pick(r, LIN_COMBOS);
          const p = p0 * sgn(r), q = q0 * sgn(r);
          const isMax = r(0, 1) === 1;
          return {
            q: `点 $(x,\\ y)$ が楕円 $${conicT(a * a, b * b)}=1$ 上を動くとき、$${lin([[p, 1, "x"], [q, 1, "y"]])}$ の${isMax ? "最大値" : "最小値"}を求めよ。`,
            ans: isMax ? M : -M,
            hint: "$x=a\\cos\\theta$, $y=b\\sin\\theta$ とおいて三角関数の合成。",
            steps: [
              `$x=${termTex(a, 1, "\\cos\\theta")}$, $y=${termTex(b, 1, "\\sin\\theta")}$ とおくと $${lin([[p * a, 1, "\\cos\\theta"], [q * b, 1, "\\sin\\theta"]])}$`,
              `合成して $\\sqrt{${par(p * a)}^{2}+${par(q * b)}^{2}}\\sin(\\theta+\\alpha)=${M}\\sin(\\theta+\\alpha)$`,
              `${isMax ? "最大値" : "最小値"}は $${isMax ? M : -M}$`,
            ],
          };
        }
        if (mode === 1) {
          const a = r(1, 6), b = r(1, 6);
          if (a === b) return { skip: true };
          return {
            q: `楕円 $${conicT(a * a, b * b)}=1$ に内接し、各辺が座標軸に平行な長方形の面積の最大値を求めよ。`,
            ans: 2 * a * b,
            hint: "第1象限の頂点を $(a\\cos\\theta,\\ b\\sin\\theta)$ とおく。",
            steps: [
              `頂点 $(${termTex(a, 1, "\\cos\\theta")},\\ ${termTex(b, 1, "\\sin\\theta")})$ $\\left(0<\\theta<\\frac{\\pi}{2}\\right)$ とおくと面積は $4\\times${termTex(a, 1, "\\cos\\theta")}\\times${termTex(b, 1, "\\sin\\theta")}$`,
              `$=${2 * a * b}\\sin2\\theta$、$\\theta=\\frac{\\pi}{4}$ で最大値 $${2 * a * b}$`,
            ],
          };
        }
        const [a, b, h] = pick(r, PY);
        return {
          q: `楕円 $${conicT(a * a, b * b)}=1$ に内接し、各辺が座標軸に平行な長方形の周の長さの最大値を求めよ。`,
          ans: 4 * h,
          hint: "第1象限の頂点を $(a\\cos\\theta,\\ b\\sin\\theta)$ とおき、合成する。",
          steps: [
            `周の長さは $4(${a}\\cos\\theta+${b}\\sin\\theta)$`,
            `$=4\\sqrt{${a * a}+${b * b}}\\sin(\\theta+\\alpha)=${4 * h}\\sin(\\theta+\\alpha)$`,
            `最大値は $${4 * h}$`,
          ],
        };
      }),
      t("HC-kyokusen-4c", (r) => {
        const m = r(2, 6), n = r(1, m - 1), l = r(1, 6);
        const sg = sgn(r);
        const askAxis = r(0, 1) === 1;
        const D = m * m - n * n;
        const rp = fracTex(l, m - n), rm = fracTex(l, m + n);
        return {
          q: `極方程式 $r=\\frac{${l}}{${m}${sg > 0 ? "-" : "+"}${n === 1 ? "" : n}\\cos\\theta}$ は楕円を表す。この楕円の${askAxis ? "長軸の長さ" : "中心の x 座標"}を求めよ。`,
          ans: askAxis ? fracAns(2 * l * m, D) : fracAns(sg * l * n, D),
          hint: "$\\theta=0$ と $\\theta=\\pi$ のときの点が長軸の両端になる。",
          steps: [
            `$\\theta=0$ で $r=${sg > 0 ? rp : rm}$、$\\theta=\\pi$ で $r=${sg > 0 ? rm : rp}$`,
            `長軸の両端は $(${sg > 0 ? rp : rm},\\ 0)$ と $(-${sg > 0 ? rm : rp},\\ 0)$`,
            askAxis ? `長軸の長さは $${rp}+${rm}=${fracTex(2 * l * m, D)}$` : `中心の x 座標は両端の中点で $${fracTex(sg * l * n, D)}$`,
          ],
        };
      }),
    ],
  },
};

export const UNITS = [VECTOR, KUKAN, FUKUSO, KYOKUSEN];
