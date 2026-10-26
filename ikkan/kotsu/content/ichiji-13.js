// ============================================================
// ichiji-13.js — 一次関数 第13時「連立方程式の解と、2直線の交点」
//   ikkan の演習プリント（ichiji-13.dr.1〜7）・小テスト（ichiji-13.qz.1〜4）を、コツコツくんのテンプレートにしたもの。
//   テンプレート id＝「13」＋ d（演習）／q（小テスト）＋ ikkan の問題の番号（＋ 1つの問題から2つ以上つくるときは a, b…）。例：13d06c ＝ ichiji-13.dr.6 の3つ目
//   2直線の交点は linear.js の meet、連立方程式の解は algebra.js の solve2 で計算し、2つの方法で一致することを確かめてから出す（手で書かない）。問題文には、式を 2 本書く。
//   グラフ（図）は問題文に出せないので、「グラフをかいて解を求めよう」「グラフから式を読みとって交点を求めよう」は、
//   連立方程式（またはグラフの式 2 本）をそのまま書いて、交点の x 座標・y 座標（または交点の座標を選ぶ4択）を聞く形にした。
//   dr.4 の「図の ℓ、m」は、ℓ・m それぞれが通る 2 点の座標を言って、交点を聞く。dr.6 の三角形 PAB は、P の y 座標・AB の長さ・面積の 3 つに分けた。
// ============================================================
import { t, pick, choices4, shuffle, rnz, gcd } from "../kit.js";
import { unitFor } from "../unit-kit.js";
import { Q, qadd, qsub, qmul, qdiv, qneg, qeq, qiszero, qisint, qval, linTex, casesTex, solve2 } from "../algebra.js";
import { line, lineSlopePoint, lineThrough, fromStd, yAt, meet, xIntercept, triArea, onLine, ltex, ptex2, qt, num } from "../linear.js";

const unit = unitFor("ichiji");

// ── このファイルの小道具 ─────────────────────────────────────────
const TX = (s) => `$${s}$`;
const P = (x) => { const s = qt(x); return s[0] === "-" ? `(${s})` : s; };
const PT = (p, name = "") => TX(ptex2(p, name));
const rhs = (L) => ltex(L).slice(2);
/** 係数つきの項（1 は省く）。c は整数か Q */
const coefX = (c, v) => ltex(line(c, 0)).slice(2).replace(/x/g, v);
const tryGen = (fn, n = 500) => { for (let i = 0; i < n; i++) { const v = fn(); if (v) return v; } return null; };
const NZ = (r, m) => rnz(r, -m, m);
const INT_A = [1, 2, 3, 4, -1, -2, -3, -4];
const FRAC_A = [[1, 2], [-1, 2], [1, 3], [-1, 3], [2, 3], [-2, 3], [3, 2], [-3, 2]];
/** a×x の書き方（a＝±1 は省く） */
const aTimes = (a, x) => {
  if (qiszero(x)) return "0";                                      // x＝0 なら 0
  if (qeq(a, Q(1))) return qt(x);                                  // a＝1：x の値をそのまま（かっこなし）
  if (qeq(a, Q(-1))) return qt(qneg(x));                           // a＝−1：−x の値
  return `${P(a)}\\times ${P(x)}`;
};
/** 直線 L の x に値を入れた式：2×3+1（y の値は別に） */
const substY = (L, x) => {
  const b = L.b, bs = qiszero(b) ? "" : `${b[0] < 0 ? "-" : "+"}${qt([Math.abs(b[0]), b[1]])}`;
  return `${aTimes(L.a, x)}${bs}`;
};
/** k x＝n を解く解説の式。k＝1 なら「x=…」だけ */
const solveX = (k, n, x) => (qeq(k, Q(1)) ? TX(`x=${qt(x)}`) : `${TX(`${coefX(k, "x")}=${qt(n)}`)}、${TX(`x=${qt(x)}`)}`);
/** 2 直線の方程式を $ で包んで書く（y＝ax+b の形） */
const L2 = (L) => TX(ltex(L));
/** 交点の座標の組 [x, y]（Q）から、答えの値 */
const coordAns = (pt, which) => num(which === "x" ? pt[0] : pt[1]);
const WHICH = ["x", "y"];

/** 交点が整数の点 (x0, y0) になる、傾きが整数でちがう 2 直線（切片は 0 でない） */
const intPair = (r, { as = INT_A, x0r = [-4, 6], bmax = 12 } = {}) => tryGen(() => {
  const a1 = pick(r, as), a2 = pick(r, as);
  if (a1 === a2) return null;
  const x0 = r(x0r[0], x0r[1]), y0 = r(-8, 10);
  if (x0 === 0) return null;
  const b1 = y0 - a1 * x0, b2 = y0 - a2 * x0;
  if (b1 === 0 || b2 === 0 || Math.abs(b1) > bmax || Math.abs(b2) > bmax) return null;
  const L1 = line(a1, b1), L2_ = line(a2, b2), m = meet(L1, L2_);
  if (!m || !qeq(m[0], Q(x0)) || !qeq(m[1], Q(y0))) throw new Error("交点が合わない");
  return { L1, L2: L2_, x0, y0 };
});


// ── 点を選ぶ4択の誤答の選び方（式の4択と同じ考え方）：「他の選択肢と x 座標・y 座標がいちばんそろう点」を選ぶ当て方で、正解が決まらないようにする ──
const sharePt = (u, v) => (String(u[0]) === String(v[0]) ? 1 : 0) + (String(u[1]) === String(v[1]) ? 1 : 0);
/** 正解の点 good と、誤答の候補から、誤答の点を 3 つ選ぶ（正解と x 座標も y 座標もそろわない点を 1 つ以上入れる） */
const pickWrongPts = (r, good, cands) => {
  const key = (p) => p.map(String).join("|"), seen = new Set([key(good)]), pool = [];
  for (const c of cands) { if (!seen.has(key(c))) { seen.add(key(c)); pool.push(c); } }
  const trips = [];
  for (let i = 0; i < pool.length; i++) for (let j = i + 1; j < pool.length; j++) for (let k = j + 1; k < pool.length; k++) trips.push([pool[i], pool[j], pool[k]]);
  const info = (t) => {
    const set = [good, ...t], sc = set.map((c, i) => set.reduce((n, d, j) => n + (i === j ? 0 : sharePt(c, d)), 0));
    return { unrel: t.some((w) => sharePt(good, w) === 0), c: sc[0], maxW: Math.max(...sc.slice(1)), minW: Math.min(...sc.slice(1)) };
  };
  const all = trips.filter((t) => info(t).unrel && info(t).c >= info(t).minW);
  const hi = all.filter((t) => info(t).c > info(t).maxW), mid = all.filter((t) => info(t).c === info(t).maxW), lo = all.filter((t) => info(t).c < info(t).maxW);
  const order = shuffle(r, [hi, hi, mid, lo, lo, lo].filter((g) => g.length));
  const use = order.length ? order[0] : trips.filter((t) => info(t).unrel);
  return pick(r, use.length ? use : trips);
};

/** 交点 P の 4択（座標を入れかえる・符号をまちがえる・1 ずれる）。P 以外の点だけ */
const pointChoices = (r, pt) => {
  const [x, y] = pt.map((v) => (Array.isArray(v) ? v : Q(v)));
  const cand = [[y, x], [x, qneg(y)], [qneg(x), y], [qneg(x), qneg(y)], [qadd(x, Q(1)), y], [x, qadd(y, Q(1))], [qsub(x, Q(1)), y], [x, qsub(y, Q(1))], [y, qneg(x)], [qneg(y), x], [qneg(y), qneg(x)]];
  const good = ptex2([x, y]);
  return choices4(r, TX(good), pickWrongPts(r, [x, y], cand).map((c) => TX(ptex2(c))));
};

/** 右辺を等しいとおいて交点を求める解説（3行）。L1、L2 は y＝ax+b */
const meetSteps = (L1, L2_) => {
  const [x, y] = meet(L1, L2_);
  const da = qsub(L1.a, L2_.a), db = qsub(L2_.b, L1.b);
  return [
    `2つの式の右辺を等しいとおくと、${TX(`${rhs(L1)}=${rhs(L2_)}`)}。`,
    `${solveX(da, db, x)}。`,
    `${TX(ltex(L1))} に ${TX(`x=${qt(x)}`)} を代入して、${TX(`y=${substY(L1, x)}=${qt(y)}`)}。よって交点は ${PT([x, y])}。`,
  ];
};

/** 交点を 1 行で：右辺を等しいとおいて x、y を求める */
const meetOne = (L1, L2_) => {
  const [x, y] = meet(L1, L2_);
  return `${TX(`${rhs(L1)}=${rhs(L2_)}`)} より ${TX(`x=${qt(x)}`)}、これを ${TX(ltex(L1))} に代入して ${TX(`y=${qt(y)}`)}。交点は ${PT([x, y])}。`;
};
/** k v＝n を解く解説の式（文字は v）。k＝1 なら「v=…」だけ */
const solveV = (k, v, n, val) => (qeq(k, Q(1)) ? TX(`${v}=${qt(val)}`) : `${TX(`${coefX(k, v)}=${qt(n)}`)}、${TX(`${v}=${qt(val)}`)}`);
/** ax+by＝c の 2 式を cases で（問題文用） */
const SYS = (e1, e2) => TX(casesTex([linTex(...e1), linTex(...e2)]));
/** 連立方程式 e1、e2（[a, b, c]）を、加減法で解く解説（x か y を直接消せる組だけ）。解 [x, y]（整数）。できなければ null */
const elimSteps = (e1, e2) => {
  const [a1, b1, c1] = e1, [a2, b2, c2] = e2;
  const sol = solve2(e1, e2), x0 = sol[0][0], y0 = sol[1][0];
  const lines = [];
  if (Math.abs(b1) === Math.abs(b2) && b1 !== 0) {
    const add = b1 === -b2, kx = add ? a1 + a2 : a1 - a2, n = add ? c1 + c2 : c1 - c2;
    if (kx === 0) return null;
    lines.push(`上の式と下の式の辺々を${add ? "たす" : "ひく"}と、$y$ が消えて ${solveX(Q(kx), Q(n), Q(x0))}。`);
    lines.push(`上の式に ${TX(`x=${x0}`)} を代入して、${TX(`${aTimes(Q(a1), Q(x0))}${b1 === 1 ? "+y" : b1 === -1 ? "-y" : `${b1 < 0 ? "-" : "+"}${Math.abs(b1)}y`}=${c1}`)}、${TX(`y=${y0}`)}。`);
  } else if (Math.abs(a1) === Math.abs(a2) && a1 !== 0) {
    const add = a1 === -a2, ky = add ? b1 + b2 : b1 - b2, n = add ? c1 + c2 : c1 - c2;
    if (ky === 0) return null;
    lines.push(`上の式と下の式の辺々を${add ? "たす" : "ひく"}と、$x$ が消えて ${ky === 1 ? TX(`y=${n}`) : `${TX(`${coefX(Q(ky), "y")}=${n}`)}、${TX(`y=${y0}`)}`}。`);
    lines.push(`上の式に ${TX(`y=${y0}`)} を代入して、${TX(`${coefX(Q(a1), "x")}${b1 < 0 ? "-" : "+"}${Math.abs(b1) === 1 ? "" : Math.abs(b1) + "\\times "}${P(Q(y0))}=${c1}`)}、${TX(`x=${x0}`)}。`);
  } else return null;
  lines.push(`解は ${TX(`x=${x0}`)}、${TX(`y=${y0}`)}。2つのグラフの交点は ${PT([x0, y0])}。`);
  return lines;
};
/** 加減法で直接解ける連立方程式の組（解は整数） */
const sysCase = (r) => tryGen(() => {
  const x0 = r(1, 6), y0 = r(1, 6) * pick(r, [1, 1, -1]);
  const co = [1, 2, 3];                                   // x の係数は正（x+y=6、2x+y=5 のような形）
  const e1 = [pick(r, co), pick(r, [1, -1, 2, -2]), 0], e2 = [pick(r, co), pick(r, [1, -1, 2, -2]), 0];
  if (gcd(e1[0], e1[1]) !== 1 || gcd(e2[0], e2[1]) !== 1) return null;
  e1[2] = e1[0] * x0 + e1[1] * y0; e2[2] = e2[0] * x0 + e2[1] * y0;
  const s = solve2(e1, e2);
  if (!s || !qisint(s[0]) || !qisint(s[1]) || s[0][0] !== x0 || s[1][0] !== y0) return null;
  if (e1[2] === 0 || e2[2] === 0 || Math.abs(e1[2]) > 18 || Math.abs(e2[2]) > 18) return null;
  const el = elimSteps(e1, e2);
  return el ? { e1, e2, x0, y0, el } : null;
});

export const UNITS = [
  unit("13", {
    name: "連立方程式の解と、2直線の交点",
    desc: "2つの方程式のグラフの交点の座標が、連立方程式の解になる",
    prereqs: ["J2-ik12", "J2-rk07"],
    points: [
      "連立方程式の解 $(x, y)$ は、2つの方程式のグラフの交点の座標になる。",
      "2直線 $y=ax+b$、$y=a'x+b'$ の交点は、右辺どうしを等しいとおいた方程式を解いて $x$ を求め、どちらかの式に代入して $y$ を求める。",
      "$ax+by=c$ の形で与えられたときは、連立方程式として解く（加減法か代入法）。",
      "傾きが同じで切片がちがう2直線は平行で、交わらない。このとき連立方程式の解はない。",
    ],
    levels: {
      // ───────── 1 基礎 ─────────
      1: [
        // 13d01a 連立方程式の解は、グラフの交点の座標：x か y
        t("13d01a", (r) => {
          const c = sysCase(r);
          if (!c) return { skip: true };
          const w = pick(r, WHICH);
          return {
            q: `連立方程式 ${SYS(c.e1, c.e2)} の 2つの方程式のグラフをかくと、交点ができる。この交点の ${TX(w)} 座標は？`,
            ans: w === "x" ? c.x0 : c.y0,
            hint: "連立方程式の解は、2つのグラフの交点の座標になる。この連立方程式を解くと、何が求まる？",
            steps: c.el,
          };
        }),
        // 13d01b 交点の座標（4択）
        t("13d01b", (r) => {
          const c = sysCase(r);
          if (!c) return { skip: true };
          return {
            q: `連立方程式 ${SYS(c.e1, c.e2)} の 2つの方程式のグラフの交点の座標は、次のうちどれか。`,
            ans: PT([c.x0, c.y0]),
            choices: pointChoices(r, [c.x0, c.y0]),
            hint: "交点の座標は、連立方程式の解と同じ。解の $x$ と $y$ は、座標のどちらに入る？",
            steps: c.el,
          };
        }),
        // 13d02a 2直線の交点：x か y
        t("13d02a", (r) => {
          const c = intPair(r, { as: [1, 2, 3, -1, -2, -3], bmax: 9 });
          const w = pick(r, WHICH);
          return {
            q: `2直線 ${L2(c.L1)}、${L2(c.L2)} の交点の ${TX(w)} 座標は？`,
            ans: w === "x" ? c.x0 : c.y0,
            hint: "交点は、どちらの直線の上にもある。2つの式の $y$ が等しくなるのは、どんなとき？",
            steps: meetSteps(c.L1, c.L2),
          };
        }),
        // 13d02b 2直線の交点の座標（4択）
        t("13d02b", (r) => {
          const c = intPair(r, { as: [1, 2, 3, -1, -2, -3], bmax: 9 });
          return {
            q: `2直線 ${L2(c.L1)}、${L2(c.L2)} の交点の座標は、次のうちどれか。`,
            ans: PT([c.x0, c.y0]),
            choices: pointChoices(r, [c.x0, c.y0]),
            hint: "交点は、どちらの直線の上にもある。まず、$x$ 座標を求めるには、どんな方程式をつくる？",
            steps: meetSteps(c.L1, c.L2),
          };
        }),
        // 13q01 小テスト（1）連立方程式 ①、② の解（グラフの交点）
        t("13q01", (r) => {
          const c = sysCase(r);
          if (!c) return { skip: true };
          const w = pick(r, WHERE2);
          return {
            q: `連立方程式 ${SYS(c.e1, c.e2)} の 2つの方程式のグラフの交点の座標を $(p, q)$ とする。${TX(w)} の値は？`,
            ans: w === "p" ? c.x0 : c.y0,
            hint: "グラフの交点の座標は、この連立方程式の解と同じ。連立方程式を解いてみよう。",
            steps: c.el,
          };
        }),
      ],
      // ───────── 2 標準 ─────────
      2: [
        // 13d03a 傾きが分数の 2 直線（交点は格子点）
        t("13d03a", (r) => {
          const c = tryGen(() => {
            const a1 = pick(r, FRAC_A), a2 = pick(r, [1, 2, -1, -2, 3]);
            const x0 = a1[1] * r(-3, 3), y0 = r(-6, 8);
            if (x0 === 0) return null;
            const b1 = y0 - (a1[0] * x0) / a1[1], b2 = y0 - a2 * x0;
            if (b1 === 0 || b2 === 0 || Math.abs(b1) > 10 || Math.abs(b2) > 10 || qeq(Q(a1[0], a1[1]), Q(a2))) return null;
            return { L1: line(a1, b1), L2: line(a2, b2), x0, y0 };
          });
          const m = meet(c.L1, c.L2);
          if (!qeq(m[0], Q(c.x0)) || !qeq(m[1], Q(c.y0))) throw new Error("交点が合わない");
          const w = pick(r, WHICH);
          const [s1, s2] = pick(r, [[c.L1, c.L2], [c.L2, c.L1]]);
          return {
            q: `2直線 ${L2(s1)}、${L2(s2)} の交点の ${TX(w)} 座標は？`,
            ans: w === "x" ? c.x0 : c.y0,
            hint: "傾きが分数でも、考え方は同じ。2つの式の右辺を等しいとおくと、どんな方程式になる？",
            steps: meetSteps(s1, s2),
          };
        }),
        // 13d03b ax+by＝c の形の 2 直線（代入法）
        t("13d03b", (r) => {
          const c = tryGen(() => {
            const x0 = r(-3, 5), y0 = r(-3, 5);
            const a1 = r(1, 4), b1 = pick(r, [1, -1]), a2 = r(1, 3), b2 = pick(r, [1, -1, 2, -2, 3, -3]);
            if (x0 === 0 || y0 === 0 || gcd(a2, b2) !== 1) return null;
            const e1 = [a1, b1, a1 * x0 + b1 * y0], e2 = [a2, b2, a2 * x0 + b2 * y0];
            const m1 = -a1 / b1, n1 = e1[2] / b1, kx = a2 + b2 * m1;
            if (kx === 0 || e1[2] === 0 || e2[2] === 0 || Math.abs(kx) === 0) return null;
            const s = solve2(e1, e2);
            if (!s || s[0][0] !== x0 || s[1][0] !== y0 || s[0][1] !== 1 || s[1][1] !== 1) return null;
            return { e1, e2, x0, y0, m1, n1, kx, rest: e2[2] - b2 * n1 };
          });
          const Lg1 = fromStd(...c.e1), Lg2 = fromStd(...c.e2), m = meet(Lg1, Lg2);
          if (!qeq(m[0], Q(c.x0)) || !qeq(m[1], Q(c.y0))) throw new Error("交点が合わない");
          const w = pick(r, WHERE2);
          const [a2, b2] = c.e2;
          const sub = `${coefX(Q(a2), "x")}${b2 < 0 ? "-" : "+"}${Math.abs(b2) === 1 ? "" : Math.abs(b2)}(${rhs(Lg1)})=${c.e2[2]}`;
          return {
            q: `2直線 ${TX(linTex(...c.e1))}、${TX(linTex(...c.e2))} の交点の座標を $(p, q)$ とする。${TX(w)} の値は？`,
            ans: w === "p" ? c.x0 : c.y0,
            hint: "交点の座標は、2つの式をどちらもみたす。この 2つの式を、連立方程式と考えると、どう解ける？ $y=\\cdots$ の形になっている式は、使えないかな？",
            steps: [
              `${TX(linTex(...c.e1))} を $y$ について解くと、${L2(Lg1)}。`,
              `これを ${TX(linTex(...c.e2))} に代入して、${TX(sub)}。${solveX(Q(c.kx), Q(c.rest), Q(c.x0))}。`,
              `${L2(Lg1)} に ${TX(`x=${c.x0}`)} を代入して、${TX(`y=${substY(Lg1, Q(c.x0))}=${c.y0}`)}。交点は ${PT([c.x0, c.y0])}。`,
            ],
          };
        }),
        // 13d03c 交点の座標が分数になる 2 直線
        t("13d03c", (r) => {
          const c = tryGen(() => {
            const a1 = pick(r, INT_A), a2 = pick(r, INT_A), b1 = NZ(r, 6), b2 = NZ(r, 6);
            if (a1 === a2 || b1 === b2) return null;
            const m = meet(line(a1, b1), line(a2, b2));
            if (qisint(m[0]) || m[0][1] > 6 || m[1][1] > 30) return null;
            return { L1: line(a1, b1), L2: line(a2, b2) };
          });
          const w = pick(r, WHICH), m = meet(c.L1, c.L2);
          return {
            q: `2直線 ${L2(c.L1)}、${L2(c.L2)} の交点の ${TX(w)} 座標は？（約分した分数か、整数で答えよう。）`,
            ans: coordAns(m, w),
            hint: "$x$ がわり切れないときは、どう表せばいい？ 分数になったら、約分できるかな？",
            steps: meetSteps(c.L1, c.L2),
          };
        }),
        // 13q02 小テスト（2）2 直線の交点（計算）
        t("13q02", (r) => {
          const c = intPair(r, { as: [1, 2, 3, -1, -2, -3], x0r: [-3, 5], bmax: 10 });
          const w = pick(r, WHICH);
          return {
            q: `2直線 ${L2(c.L1)}、${L2(c.L2)} の交点の ${TX(w)} 座標を、計算で求めよう。`,
            ans: w === "x" ? c.x0 : c.y0,
            hint: "交点では、2つの式の $y$ は同じ値。$y$ を消して、$x$ だけの方程式にするには、どうする？",
            steps: meetSteps(c.L1, c.L2),
          };
        }),
        // 13q03 小テスト（3）交点が分数になる 2 直線
        t("13q03", (r) => {
          const c = tryGen(() => {
            const a1 = pick(r, [1, 2, 3, 4, -1, -2, -3]), a2 = pick(r, [1, 2, -1, -2, -3]), b1 = NZ(r, 5), b2 = NZ(r, 5);
            if (a1 === a2 || b1 === b2) return null;
            const m = meet(line(a1, b1), line(a2, b2));
            if (qisint(m[0]) || m[0][1] > 5 || m[1][1] > 20) return null;
            return { L1: line(a1, b1), L2: line(a2, b2) };
          });
          const w = pick(r, WHICH), m = meet(c.L1, c.L2);
          return {
            q: `2直線 ${L2(c.L1)}、${L2(c.L2)} の交点の ${TX(w)} 座標を求めよう。（約分した分数か、整数で答えよう。）`,
            ans: coordAns(m, w),
            hint: "2つの式の $y$ が等しいことから、$x$ を求めよう。わり切れないときは、どう答える？",
            steps: meetSteps(c.L1, c.L2),
          };
        }),
      ],
      // ───────── 3 応用 ─────────
      3: [
        // 13d04 ℓ、m がそれぞれ 2 点を通る：交点の x 座標か y 座標
        t("13d04", (r) => {
          const c = tryGen(() => {
            const L1 = line(pick(r, [...INT_A, ...FRAC_A]), NZ(r, 6)), L2_ = line(pick(r, [...INT_A, ...FRAC_A]), NZ(r, 8));
            if (qeq(L1.a, L2_.a)) return null;
            const m = meet(L1, L2_);
            if (qisint(m[0]) || m[0][1] > 6 || m[1][1] > 12 || Math.abs(qval(m[0])) > 12) return null;
            const p1 = pts2(r, L1), p2 = pts2(r, L2_);
            return p1 && p2 ? { L1, L2: L2_, p1, p2 } : null;
          });
          const w = pick(r, WHICH), m = meet(c.L1, c.L2);
          return {
            q: `直線 ℓ は 2点 ${PT(c.p1[0])}、${PT(c.p1[1])} を通り、直線 $m$ は 2点 ${PT(c.p2[0])}、${PT(c.p2[1])} を通る。ℓ と $m$ の交点の ${TX(w)} 座標は？（約分した分数か、整数で答えよう。）`,
            ans: coordAns(m, w),
            hint: "ℓ、$m$ の式がわからないと、交点は求められない。通る 2点の座標から、それぞれの式は求められるかな？",
            steps: [
              fitLine("ℓ", c.p1, c.L1),
              fitLine("$m$", c.p2, c.L2),
              meetSteps(c.L1, c.L2).slice(0, 2).join(""),
              `${TX(ltex(c.L1))} に ${TX(`x=${qt(m[0])}`)} を代入して、${TX(`y=${substY(c.L1, m[0])}=${qt(m[1])}`)}。よって交点は ${PT(m)}。`,
            ],
          };
        }),
        // 13d05 3 つの直線が 1 点で交わる：a の値
        t("13d05", (r) => {
          const c = tryGen(() => {
            const p = intPair(r, { as: [1, 2, 3, -1, -2, -3], x0r: [-3, 5], bmax: 9 });
            if (!p) return null;
            const a = NZ(r, 5), cc = p.y0 - a * p.x0;
            if (cc === 0 || Math.abs(cc) > 10 || a === qval(p.L1.a) || a === qval(p.L2.a)) return null;
            return { ...p, a, cc };
          });
          const third = `y=ax${c.cc < 0 ? "-" : "+"}${Math.abs(c.cc)}`;
          return {
            q: `3つの直線 ${L2(c.L1)}、${L2(c.L2)}、${TX(third)} が、1点で交わっている。$a$ の値は？`,
            ans: c.a,
            hint: "3本の直線が 1点で交わるとき、その点は 3本すべての上にある。式がわかっている 2本からは、どんな点が求まる？",
            steps: [
              meetOne(c.L1, c.L2),
              `${TX(third)} も点 ${PT([c.x0, c.y0])} を通るので、${TX(`${c.y0}=${coefX(Q(c.x0), "a")}${c.cc < 0 ? "-" : "+"}${Math.abs(c.cc)}`)}。`,
              `${solveV(Q(c.x0), "a", Q(c.y0 - c.cc), Q(c.a))}。`,
            ],
          };
        }),
        // 13d06a ℓ と m の交点 P の y 座標
        t("13d06a", (r) => {
          const c = d06Case(r);
          if (!c) return { skip: true };
          return {
            q: `${d06Text(c)}点 P の $y$ 座標は？`,
            ans: c.py,
            hint: "P は、ℓ と $m$ の両方の上にある点。2つの式の $y$ が等しくなるのは、どんなとき？",
            steps: meetSteps(c.L1, c.L2),
          };
        }),
        // 13d07a 交点 P を通る軸に平行な直線の式（4択）
        t("13d07a", (r) => {
          const c = d07Case(r);
          const par = pick(r, ["x", "y"]);
          const good = par === "x" ? TX(`y=${c.y0}`) : TX(`x=${c.x0}`);
          const wrongs = par === "x" ? [TX(`x=${c.x0}`), TX(`y=${c.x0}`), TX(`x=${c.y0}`)] : [TX(`y=${c.y0}`), TX(`x=${c.y0}`), TX(`y=${c.x0}`)];
          return {
            q: `2直線 ${L2(c.L1)}、${L2(c.L2)} の交点を P とする。点 P を通り、$${par}$ 軸に平行な直線の式は、次のうちどれか。`,
            ans: good,
            choices: choices4(r, good, wrongs),
            hint: `点 P の座標は、どうすればわかる？ $${par}$ 軸に平行な直線は、どの座標がいつも同じ？`,
            steps: [...meetSteps(c.L1, c.L2), `$${par}$ 軸に平行な直線は、${par === "x" ? "$y$" : "$x$"} 座標がいつも同じ。P の ${par === "x" ? "$y$" : "$x$"} 座標は ${TX(String(par === "x" ? c.y0 : c.x0))} なので、${good}。`].slice(0, 4),
          };
        }),
      ],
      // ───────── 4 入試レベル ─────────
      4: [
        // 13d06b 線分 AB の長さ
        t("13d06b", (r) => {
          const c = d06Case(r);
          if (!c) return { skip: true };
          return {
            q: `${d06Text(c)}線分 AB の長さは？（座標の 1 目もりを 1cm とする。）`,
            ans: Math.abs(c.xB - c.xA),
            unit: "cm",
            hint: "$x$ 軸上の点は、$y$ 座標がいくつ？ ℓ、$m$ の式にその値を入れると、A、B の $x$ 座標が求まるかな？",
            steps: d06Axes(c).concat([`AB は $x$ 軸上の線分なので、長さは ${TX(`${Math.max(c.xA, c.xB)}-${P(Q(Math.min(c.xA, c.xB)))}=${Math.abs(c.xB - c.xA)}`)}（cm）。`]),
          };
        }),
        // 13d06c 三角形 PAB の面積
        t("13d06c", (r) => {
          const c = d06Case(r);
          if (!c) return { skip: true };
          const AB = Math.abs(c.xB - c.xA), area = qmul(Q(1, 2), Q(AB * Math.abs(c.py)));
          return {
            q: `${d06Text(c)}三角形 PAB の面積は？（座標の 1 目もりを 1cm とする。）`,
            ans: num(area),
            unit: "cm²",
            hint: "底辺を AB と考えると、高さは、P のどんな値になる？ A、B、P の座標を、ひとつずつ求めよう。",
            steps: [
              meetOne(c.L1, c.L2),
              ...d06Axes(c),
              `底辺 AB の長さは ${AB}、高さ（P の $y$ 座標の絶対値）は ${Math.abs(c.py)} なので、${TX(`\\frac{1}{2}\\times ${AB}\\times ${Math.abs(c.py)}=${qt(area)}`)}（cm²）`,
            ],
          };
        }),
        // 13d07b 交点 P を通る、x 軸に平行な直線と y 軸に平行な直線と、x 軸・y 軸で囲まれた長方形の面積
        t("13d07b", (r) => {
          const c = d07Case(r);
          const area = Math.abs(c.x0 * c.y0);
          return {
            q: `2直線 ${L2(c.L1)}、${L2(c.L2)} の交点を P とする。点 P を通り $x$ 軸に平行な直線と、点 P を通り $y$ 軸に平行な直線をひく。この 2本の直線と、$x$ 軸、$y$ 軸で囲まれた長方形の面積は？（座標の 1 目もりを 1cm とする。）`,
            ans: area,
            unit: "cm²",
            hint: "点 P の座標は、どうすればわかる？ 長方形の横と縦は、P の座標のどの値で決まる？",
            steps: [
              ...meetSteps(c.L1, c.L2).slice(0, 2),
              `${TX(ltex(c.L1))} に ${TX(`x=${c.x0}`)} を代入して ${TX(`y=${substY(c.L1, Q(c.x0))}=${c.y0}`)}。P は ${PT([c.x0, c.y0])}。`,
              `P を通る平行線は ${TX(`y=${c.y0}`)} と ${TX(`x=${c.x0}`)}。横 ${Math.abs(c.x0)}、縦 ${Math.abs(c.y0)} の長方形なので、${TX(`${Math.abs(c.x0)}\\times ${Math.abs(c.y0)}=${area}`)}（cm²）`,
            ],
          };
        }),
        // 13q04a 小テスト（チャレンジ）交点を通り、傾きが s の直線の切片
        t("13q04a", (r) => {
          const c = q04Case(r);
          return {
            q: `2直線 ${L2(c.L1)}、${L2(c.L2)} の交点を通り、傾きが ${TX(String(c.s))} の直線の式を $y=${c.s === 1 ? "" : c.s === -1 ? "-" : c.s}x+b$ とする。$b$ の値は？`,
            ans: c.b,
            hint: "直線が通る点は、どうすればわかる？ その点を通ることを、$y=sx+b$ にどう使う？",
            steps: q04Steps(c).slice(0, 2),
          };
        }),
        // 13q04b 小テスト（チャレンジ）交点を通り、傾きが s の直線の式（4択）
        t("13q04b", (r) => {
          const c = q04Case(r);
          const L = line(c.s, c.b);
          const main = [
            line(c.s, c.y0 + c.s * c.x0),             // 切片の代入ミス（y＋s×x としてしまう）
            line(c.s, c.y0),                          // 切片を交点の y 座標にしてしまう
            line(-c.s, c.b),                          // 傾きの符号まちがい
            line(c.b, c.s),                           // 傾きと切片の入れかえ
            line(c.s, -c.b),                          // 切片の符号まちがい
            line(-c.s, -c.b),                         // 傾きも切片も符号をまちがえる
            line(c.b, -c.s),                          // 傾きと切片を入れかえて、符号もまちがえる
          ];
          const wrongs = pickWrongs(r, L, main).map((w) => TX(ltex(w)));
          return {
            q: `2直線 ${L2(c.L1)}、${L2(c.L2)} の交点を通り、傾きが ${TX(String(c.s))} の直線の式は、次のうちどれか。`,
            ans: TX(ltex(L)),
            choices: choices4(r, TX(ltex(L)), wrongs, (i) => TX(ltex(line(c.s, c.b + i + 1)))),
            hint: "直線が通る点は、どうすればわかる？ 傾きがわかっていて、1点を通る直線の式は、どう求める？",
            steps: q04Steps(c),
          };
        }),
      ],
    },
  }),
];

// ── 式を選ぶ4択の誤答の選び方 ─────────────────────────────────────────
//   正解と傾きも切片もそろわない誤答を 1 つ以上入れる。さらに、誤答どうしでそろう組ができるようにして、
//   「他の選択肢と傾き・切片がいちばん共通する式」「ひとつだけ浮いている式」を選ぶ、という当て方で正解が決まらないようにする。
const share = (u, v) => (qeq(u.a, v.a) ? 1 : 0) + (qeq(u.b, v.b) ? 1 : 0);
/** 正解 L と、誤答の候補（main。足りなければ low も使う）から、誤答の直線を 3 つ選ぶ */
const pickWrongs = (r, L, main, low = []) => {
  const uniq = (cs) => {
    const seen = new Set([ltex(L)]), out = [];
    for (const w of cs) { const s = ltex(w); if (!seen.has(s) && !(qeq(w.a, L.a) && qeq(w.b, L.b))) { seen.add(s); out.push(w); } }
    return out;
  };
  let pool = uniq(main);
  if (pool.length < 5) pool = uniq([...main, ...low]);
  const trips = [];
  for (let i = 0; i < pool.length; i++) for (let j = i + 1; j < pool.length; j++) for (let k = j + 1; k < pool.length; k++) trips.push([pool[i], pool[j], pool[k]]);
  const info = (t) => {
    const set = [L, ...t], sc = set.map((c, i) => set.reduce((n, d, j) => n + (i === j ? 0 : share(c, d)), 0));
    return { unrel: t.some((w) => share(L, w) === 0), c: sc[0], maxW: Math.max(...sc.slice(1)), minW: Math.min(...sc.slice(1)) };
  };
  const all = trips.filter((t) => info(t).unrel && info(t).c >= info(t).minW);
  const hi = all.filter((t) => info(t).c > info(t).maxW), mid = all.filter((t) => info(t).c === info(t).maxW), lo = all.filter((t) => info(t).c < info(t).maxW);
  // 正解が「いちばんそろう」（hi）／同点（mid）／他のほうがそろう（lo）を、まぜて出す
  const order = shuffle(r, [hi, hi, mid, lo, lo, lo].filter((g) => g.length));
  const use = order.length ? order[0] : trips.filter((t) => info(t).unrel);
  return pick(r, use.length ? use : trips);
};

const WHERE2 = ["p", "q"];

// ── dr.4：直線 L 上の格子点 2 点（x が異なる）──────────────────────
function pts2(r, L) {
  const den = L.a[1], xs = [];
  for (let x = -8; x <= 8; x++) if (x % den === 0 && Math.abs(yAt(L, x)[0]) <= 12) xs.push(x);
  if (xs.length < 2) return null;
  for (let n = 0; n < 40; n++) {
    const [u, v] = shuffle(r, xs).slice(0, 2);
    if (Math.abs(u - v) >= 2 && Math.abs(u - v) <= 8) return [[u, yAt(L, u)[0]], [v, yAt(L, v)[0]]];
  }
  return null;
}
/** 直線の解説の 1 行：2 点から傾きと切片を求めて式にする */
function fitLine(name, pts, L) {
  const [p1, p2] = pts, dy = qsub(Q(p2[1]), Q(p1[1])), dx = qsub(Q(p2[0]), Q(p1[0]));
  const sl = `(${qt(p2[1])}-${P(Q(p1[1]))})\\div(${qt(p2[0])}-${P(Q(p1[0]))})=${P(dy)}\\div ${P(dx)}=${qt(L.a)}`;
  return `${name} の傾きは ${TX(sl)}。点 ${PT(p1)} を代入して ${TX(`${qt(p1[1])}=${aTimes(L.a, Q(p1[0]))}+b`)}、${TX(`b=${qt(L.b)}`)}。${name} は ${L2(L)}。`;
}

// ── dr.6：ℓ：y＝a1 x＋b1、m：y＝a2 x＋b2。A＝ℓ と x 軸、B＝m と x 軸、P＝ℓ と m の交点（P の y 座標は 0 でない）──────
function d06Case(r) {
  return tryGen(() => {
    const py = r(1, 8) * pick(r, [1, 1, 1, -1]), px = r(-4, 4);   // P は x 軸の上にあることが多い
    const divs = [1, 2, 3, 4, 6].filter((d) => py % d === 0);
    const a1 = pick(r, divs) * pick(r, [1, -1]), a2 = pick(r, divs) * pick(r, [1, -1]);
    if (a1 === a2) return null;
    const b1 = py - a1 * px, b2 = py - a2 * px;
    if (b1 === 0 || b2 === 0 || Math.abs(b1) > 12 || Math.abs(b2) > 12) return null;
    const L1 = line(a1, b1), L2_ = line(a2, b2), xA = xIntercept(L1)[0], xB = xIntercept(L2_)[0];
    if (!qisint(xA) || !qisint(xB) || xA[0] === xB[0] || px === 0 || Math.abs(xA[0] - xB[0]) * Math.abs(py) < 8) return null;
    const m = meet(L1, L2_);
    if (!qeq(m[0], Q(px)) || !qeq(m[1], Q(py))) throw new Error("交点が合わない");
    return { L1, L2: L2_, px, py, xA: xA[0], xB: xB[0] };
  });
}
function d06Text(c) {
  return `直線 ℓ は ${TX(ltex(c.L1))}、直線 $m$ は ${TX(ltex(c.L2))} である。ℓ と $x$ 軸との交点を A、$m$ と $x$ 軸との交点を B、ℓ と $m$ の交点を P とする。`;
}
function d06Axes(c) {
  return [
    `A は ℓ と $x$ 軸の交点。${TX("y=0")} とすると ${TX(`0=${rhs(c.L1)}`)} より ${TX(`x=${c.xA}`)}。A ${PT([c.xA, 0])}。`,
    `B は $m$ と $x$ 軸の交点。${TX("y=0")} とすると ${TX(`0=${rhs(c.L2)}`)} より ${TX(`x=${c.xB}`)}。B ${PT([c.xB, 0])}。`,
  ];
}

// ── dr.7：交点 P を通る軸に平行な直線 ─────────────────────────────
function d07Case(r) {
  const c = intPair(r, { x0r: [-4, 6], bmax: 10 });
  return c.x0 === c.y0 || c.y0 === 0 ? d07Case(r) : c;   // 交点の y 座標が 0 だと、x 軸に平行な直線が x 軸そのものになるのではずす
}

// ── qz.4：2 直線の交点 (x0, y0) を通り、傾きが s の直線 y＝sx＋b ─────────────
function q04Case(r) {
  return tryGen(() => {
    const p = intPair(r, { as: [1, 2, 3, -1, -2, -3], x0r: [-3, 5], bmax: 9 });
    if (!p) return null;
    const s = NZ(r, 4), b = p.y0 - s * p.x0;
    if (s === qval(p.L1.a) || s === qval(p.L2.a) || b === 0 || Math.abs(b) > 14) return null;
    return { ...p, s, b };
  });
}
function q04Steps(c) {
  return [
    meetOne(c.L1, c.L2),
    `傾き ${TX(String(c.s))} の直線を ${TX(`y=${c.s === 1 ? "" : c.s === -1 ? "-" : c.s}x+b`)} として、点 ${PT([c.x0, c.y0])} を代入すると、${TX(`${c.y0}=${aTimes(Q(c.s), Q(c.x0))}+b`)} より ${TX(`b=${c.b}`)}。`,
    `式は ${TX(ltex(line(c.s, c.b)))}。`,
  ];
}

// 移さなかった問題はなし（図は、連立方程式・通る 2 点・式を文で言う形にした。dr.6 の三角形 PAB は、P の y 座標・AB の長さ・面積の 3 つに分けた）
export const SKIPPED = [];
