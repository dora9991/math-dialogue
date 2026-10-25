// ============================================================
// ichiji-06.js — 一次関数 第6時「傾きと切片を使って、グラフをかこう」
//   ikkan の演習プリント（ichiji-06.dr.1〜7）・小テスト（ichiji-06.qz.1〜5）を、コツコツくんのテンプレートにしたもの。
//   テンプレート id＝「06」＋ d（演習）／q（小テスト）＋ ikkan の問題の番号（＋ 型ごとに a, b…）。例：06d02a ＝ ichiji-06.dr.2 の1つ目の型
//   図（座標平面）は問題文に出せないので、「グラフをかく」問題は、(a) かくために使う 2 点を選ぶ4択、(b) 切片の点から傾きにしたがって進んだ点の座標、(c) 軸との交点・面積 など、
//   1つの値や1つの組を聞く形にした。点の座標・面積・個数は、linear.js（直線 y＝ax+b を計算で扱う）から出す。
//   「まちがいを説明する」（dr.5）は、(a) 正しい点を選ぶ4択　(b) A さんの 2 点を通る直線の傾き、の2つにした。
// ============================================================
import { t, pick, choices4, shuffle, rnz, gcd, sgn, round } from "../kit.js";
import { unitFor } from "../unit-kit.js";
import { Q, qneg, qeq, qval, qisint } from "../algebra.js";
import { line, yAt, triArea, onLine, ltex, ptex2, qt, num } from "../linear.js";

const unit = unitFor("ichiji");

// ── 道具（この授業の問題用に足した小さな関数）──────────────────────────
const $ = (s) => `$${s}$`;
const Z = (x) => (Array.isArray(x) ? Q(x[0], x[1]) : Q(x));
/** 負の数にはかっこをつけた TeX */
const par = (x) => { const v = Z(x); return v[0] < 0 ? `(${qt(v)})` : qt(v); };
/** 文の中の数（負の数・分数は TeX に） */
const N = (x) => { const v = Z(x); return v[0] >= 0 && v[1] === 1 ? String(v[0]) : $(qt(v)); };
const PT = (p) => $(ptex2(p));
const PAIR = (p1, p2) => `${PT(p1)} と ${PT(p2)}`;
const both = (l, p1, p2) => onLine(l, p1) && onLine(l, p2);
const UD = (n) => (n > 0 ? "上" : "下");
/** 既約分数 p/q（p, q は正で q≧2）を選ぶ */
const fr = (r, ps, qs) => { for (let i = 0; i < 300; i++) { const p = pick(r, ps), q = pick(r, qs); if (q >= 2 && gcd(p, q) === 1) return [p, q]; } return [1, 2]; };
/** 係数つきの x の TeX（c は Q）  x, -x, 3x, \frac{3}{4}x */
const cx = (c) => { const [n, d] = c, ab = Math.abs(n), co = d === 1 ? (ab === 1 ? "" : String(ab)) : `\\frac{${ab}}{${d}}`; return `${n < 0 ? "-" : ""}${co}x`; };
/** 小数の書き方（0.5 など。分母が 2 のときだけ使う） */
const decS = (v) => String(round(qval(Z(v))));
/** y＝ax+b に x を入れた右辺の TeX  例 2\times 3-1。dec なら小数のまま */
const evalTex = (l, x, dec = false) => {
  const T = dec ? decS : qt, X = par(x), a = l.a, b = l.b;
  let s;
  if (qeq(a, Q(1))) s = qt(Z(x)); else if (qeq(a, Q(-1))) s = `-${X}`; else s = `${T(a)}\\times ${X}`;
  if (b[0] !== 0) s += (b[0] < 0 ? "" : "+") + T(b);
  return s;
};
/** y＝…＝値 の TeX（右辺の式と値が同じなら、値だけ） */
const calcTex = (l, x, dec = false) => { const e = evalTex(l, x, dec), y = dec ? decS(yAt(l, x)) : qt(yAt(l, x)); return e === y ? `y=${y}` : `y=${e}=${y}`; };
/** 小数の式の TeX（傾き・切片の分母が 1 か 2 のときだけ）  y=0.5x-1.5 */
const ltexDec = (l) => {
  const A = Math.abs(qval(l.a)), B = Math.abs(qval(l.b));
  return `y=${l.a[0] < 0 ? "-" : ""}${A === 1 ? "" : round(A)}x${l.b[0] === 0 ? "" : (l.b[0] < 0 ? "-" : "+") + round(B)}`;
};
/** (m x + k)/q の形の直線（q≧2、m と q は互いに素、切片は整数でない） */
const fracLine = (r, qs, ms, ks) => {
  for (let i = 0; i < 400; i++) {
    const q = pick(r, qs), m = pick(r, ms), k = pick(r, ks);
    if (gcd(m, q) !== 1 || gcd(k, q) !== 1) continue;
    return { q, m, k, L: line(Q(m, q), Q(k, q)) };
  }
  return { q: 2, m: 1, k: 1, L: line(Q(1, 2), Q(1, 2)) };
};
/** 直線 L 上の、x 座標が [lo, hi] の整数で、y 座標も整数の点 */
const latt = (L, lo, hi) => { const o = []; for (let x = lo; x <= hi; x++) { const y = yAt(L, x); if (qisint(y)) o.push([x, y[0]]); } return o; };

/** 「切片の点と、右へ 1 進んだ点」の 2 点の組を選ぶ4択（整数の傾き） */
const twoPointsQ = (r, A, B) => {
  const a = pick(r, A), b = rnz(r, -B, B), L = line(a, b);
  const P0 = [0, b], P1 = [1, a + b];
  const wrongs = shuffle(r, [[[0, b], [1, b - a]], [[0, b], [a, b + 1]], [[0, a], [1, a + b]], [[0, -b], [1, a - b]], [[b, 0], [a + b, 1]]]);
  const bad = wrongs.filter(([p, q]) => !both(L, p, q));
  return {
    q: `${$(ltex(L))} のグラフをかく。グラフが通る 2 点の組はどれか。`,
    ans: PAIR(P0, P1),
    choices: choices4(r, PAIR(P0, P1), bad.map(([p, q]) => PAIR(p, q))),
    hint: "切片の点は、x 座標が 0 の点。そこから右へ 1 進むと、y 座標はどう変わるかな？",
    steps: [`切片が ${N(b)} だから、点 ${PT(P0)} を通る。`, `傾きが ${N(a)} だから、右へ 1 進むと${UD(a)}へ ${Math.abs(a)} 進む。点 ${PT(P1)} を通る。`, `通る 2 点の組は ${PAIR(P0, P1)}。`],
  };
};

/** 傾き ±p/q（約分済み）、切片 b の直線と、切片の点・右へ q 進んだ点 */
const stepLine = (r, ps, qs, B) => {
  const [p, q] = fr(r, ps, qs), s = sgn(r), b = rnz(r, -B, B), L = line(Q(s * p, q), b);
  return { p, q, s, b, L, a: L.a, P0: [0, b], P1: [q, b + s * p] };
};

/** 軸との交点から作る直線：x 軸との交点 (xi, 0)、y 軸との交点 (0, yi) */
const axisLine = (r, shape) => {
  for (let i = 0; i < 300; i++) {
    const xs = shape === "pos-neg" ? 1 : pick(r, [1, -1]), ys = shape === "pos-neg" ? -1 : pick(r, [1, -1]);
    const xi = xs * pick(r, [2, 3, 4, 5, 6, 8]), yi = ys * pick(r, [2, 3, 4, 5, 6]);
    const a = Q(-yi, xi);
    if (a[1] > 6) continue;
    const L = line(a, yi);
    return { xi, yi, L, area: triArea([0, 0], [xi, 0], [0, yi]) };
  }
  return { xi: 4, yi: 3, L: line(Q(-3, 4), 3), area: Q(6) };
};
const areaAns = (A) => round(qval(A));
/** 「0＝ax+b を x について解く」解説の1行  例 0=-\frac{3}{4}x+3 より \frac{3}{4}x=3 */
const solveX = (L, xi) => (qeq(L.a, Q(1)) ? `${$(`0${ltex(L).slice(1)}`)} より ${$(`x=${xi}`)}` : `${$(`0${ltex(L).slice(1)}`)} より ${$(`${cx(L.a)}=${qt(qneg(L.b))}`)}、${$(`x=${xi}`)}`);

export const UNITS = [
  unit("06", {
    name: "傾きと切片を使って、グラフをかこう",
    desc: "切片の点と、傾きから進んだ点の 2 点を通る直線",
    prereqs: ["J2-ik05", "J2-g2c3u1"],
    points: [
      "$y=ax+b$ のグラフは、まず切片の点 $(0, b)$ をとる。次に、傾き $a$ にしたがって進んだ点をとり、2点を通る直線をひく。",
      "傾きが $\\frac{p}{q}$ のときは、右へ $q$ 進むと、上へ $p$ 進む（$p$ が負の数なら、下へ進む）。整数の傾きは、右へ 1 進んで、上（下）へ傾きの分だけ進む。",
      "切片が整数でないときは、$x$ 座標も $y$ 座標も整数の点を見つけて、その点を通る直線をひく。",
    ],
    levels: {
      // ───────── 1 基礎 ─────────
      1: [
        // 06d01 演習（1）グラフをかく手順（ウ → イ → ア）
        t("06d01", (r) => {
          const fracSlope = r(0, 3) === 0, s = sgn(r), b = rnz(r, -5, 5);
          let a, dx, dy;
          if (fracSlope) { const [p, q] = fr(r, [1, 2, 3], [2, 3, 4]); a = Q(s * p, q); dx = q; dy = s * p; }
          else { const k = r(1, 4); a = Q(s * k); dx = 1; dy = s * k; }
          const L = line(a, b), P0 = [0, b], P1 = [dx, b + dy];
          const text = {
            line: "2点を通る直線をひく",
            slope: `切片の点から、傾きにしたがって進み、点 ${PT(P1)} をとる`,
            icpt: `切片から、点 ${PT(P0)} をとる`,
          };
          const letters = shuffle(r, ["ア", "イ", "ウ"]), of = { line: letters[0], slope: letters[1], icpt: letters[2] };
          const byLetter = { [of.line]: "line", [of.slope]: "slope", [of.icpt]: "icpt" };
          const list = ["ア", "イ", "ウ"].map((l) => `${l} ${text[byLetter[l]]}`).join("　");
          const order = (ks) => ks.map((k) => of[k]).join(" → ");
          const right = order(["icpt", "slope", "line"]);
          const rest = shuffle(r, [["icpt", "line", "slope"], ["line", "icpt", "slope"], ["slope", "line", "icpt"], ["line", "slope", "icpt"]]);
          return {
            q: `${$(ltex(L))} のグラフを、切片の点と、傾きから進んだ点の 2 点を使ってかく。次のア〜ウを、かく順にならべたものはどれか。　${list}`,
            ans: right,
            choices: choices4(r, right, [order(["slope", "icpt", "line"]), ...rest.map(order)]),
            hint: "直線をひくには、点がいくつ必要かな？ 傾きにしたがって進むとき、スタートはどの点だろう？",
            steps: [
              `まず、切片が ${N(b)} だから、点 ${PT(P0)} をとる。`,
              `次に、その点から傾き ${$(qt(a))} にしたがって、右へ ${dx}、${UD(dy)}へ ${Math.abs(dy)} 進み、点 ${PT(P1)} をとる。`,
              `最後に、2点を通る直線をひく。順は「${right}」。`,
            ],
          };
        }),
        // 06d02a 演習（2）グラフをかく：通る 2 点の組（整数の傾き）
        t("06d02a", (r) => twoPointsQ(r, [-3, -2, -1, 1, 2, 3], 4)),
        // 06d02b 演習（2）切片の点から右へ進んだ点の y 座標
        t("06d02b", (r) => {
          const a = pick(r, [-4, -3, -2, -1, 1, 2, 3, 4]), b = rnz(r, -5, 5), k = pick(r, [1, 1, 2]), L = line(a, b);
          return {
            q: `${$(ltex(L))} のグラフをかく。切片の点から、傾きにしたがって右へ ${k} 進んだ点の y 座標は？`,
            ans: num(yAt(L, k)),
            hint: "切片の点は、x 座標が 0 の点。右へ 1 進むごとに、y 座標はどれだけ変わるかな？ 傾きは何を表していた？",
            steps: [`切片が ${N(b)} だから、切片の点は ${PT([0, b])}。`, `右へ ${k} 進んだ点は、x 座標が ${k} の点。`, `${$(calcTex(L, k))} だから、y 座標は ${N(yAt(L, k))}。`],
          };
        }),
        // 06q01 小テスト（1）y＝3x−2 のグラフ：通る 2 点の組
        t("06q01", (r) => twoPointsQ(r, [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5], 6)),
      ],
      // ───────── 2 標準 ─────────
      2: [
        // 06d03a 演習（3）分数の傾き：通る 2 点の組
        t("06d03a", (r) => {
          const { p, q, s, b, L, a, P0, P1 } = stepLine(r, [1, 2, 3], [2, 3, 4], 4);
          const wrongs = [[P0, [p, b + s * q]], [P0, [q, b - s * p]], [P0, [p, b - s * q]], [[0, -b], [q, s * p - b]]].filter(([x, y]) => !both(L, x, y));
          return {
            q: `${$(ltex(L))} のグラフをかく。グラフが通る 2 点の組はどれか。`,
            ans: PAIR(P0, P1),
            choices: choices4(r, PAIR(P0, P1), wrongs.map(([x, y]) => PAIR(x, y))),
            hint: "傾きが分数のとき、右へ進む量と上（下）へ進む量は、それぞれ分母と分子のどちらにあたるかな？",
            steps: [`傾き ${$(qt(a))} は、右へ ${q} 進むと、${UD(s)}へ ${p} 進むことを表す。`, `切片の点 ${PT(P0)} から、右へ ${q}、${UD(s)}へ ${p} 進んだ点は ${PT(P1)}。`, `通る 2 点の組は ${PAIR(P0, P1)}。`],
          };
        }),
        // 06d03b 演習（3）切片の点から右へ（分母）進んだ点の y 座標
        t("06d03b", (r) => {
          const { p, q, s, b, L, a, P0, P1 } = stepLine(r, [1, 2, 3, 4], [2, 3, 4, 5], 5);
          return {
            q: `${$(ltex(L))} のグラフをかく。切片の点から、傾きにしたがって右へ ${q} 進んだ点の y 座標は？`,
            ans: num(P1[1]),
            hint: "傾きが分数のとき、右へ進む量と上（下）へ進む量は、それぞれ分母と分子のどちらにあたるかな？",
            steps: [`傾き ${$(qt(a))} は、右へ ${q} 進むと、${UD(s)}へ ${p} 進むことを表す。`, `切片の点 ${PT(P0)} から、${UD(s)}へ ${p} 進むから、y 座標は ${$(`${b}${s > 0 ? "+" : "-"}${p}=${P1[1]}`)}。`],
          };
        }),
        // 06q02 小テスト（2）y＝−(3/4)x+1：x 座標が分母の点の y 座標
        t("06q02", (r) => {
          const { p, q, s, b, L, a } = stepLine(r, [1, 2, 3, 4, 5], [2, 3, 4, 5], 5), k = pick(r, [1, 1, 2, -1]), X = q * k;
          return {
            q: `${$(ltex(L))} のグラフをかく。グラフ上で、x 座標が ${N(X)} の点の y 座標は？`,
            ans: num(yAt(L, X)),
            hint: "切片の点（x 座標が 0 の点）から、右（左）へいくつ進むと、その x 座標になるかな？ そのとき、y 座標はどれだけ変わる？",
            steps: [`切片が ${N(b)} だから、切片の点は ${PT([0, b])}。`, `傾き ${$(qt(a))} は、右へ ${q} 進むと、${UD(s)}へ ${p} 進むことを表す。`, `${$(calcTex(L, X))} だから、y 座標は ${N(yAt(L, X))}。`],
          };
        }),
        // 06q03 小テスト（3）x 座標も y 座標も整数の点を 2 つ：その組を選ぶ
        t("06q03", (r) => {
          const { L } = fracLine(r, [2, 3], [1, -1, 2, -2], [-5, -3, -1, 1, 3, 5]);
          const pts = shuffle(r, latt(L, -5, 5)), correct = pts.slice(0, 2).sort((u, v) => u[0] - v[0]);
          const [A, B] = correct, d = pick(r, [1, -1]);
          const cand = shuffle(r, [[A, [B[0], B[1] + d]], [[A[0], A[1] - d], B], [A, [B[0] + 1, B[1]]], [[A[0] - 1, A[1]], B], [[A[0], A[1] + d], [B[0], B[1] - d]]]);
          const wrongs = cand.filter(([u, v]) => !both(L, u, v) && u[0] !== v[0]);
          return {
            q: `${$(ltex(L))} のグラフが通る、x 座標も y 座標も整数の点を 2 つ答えたい。2 点とも、グラフが通る点になっている組はどれか。`,
            ans: PAIR(correct[0], correct[1]),
            choices: choices4(r, PAIR(correct[0], correct[1]), wrongs.map(([u, v]) => PAIR(u, v))),
            hint: "点の x 座標を式に入れて、y 座標と合うか確かめよう。切片が整数でないので、x が整数でも y は整数にならないことがあるよ。",
            steps: [`${PT(correct[0])}：${$(calcTex(L, correct[0][0]))} で、y 座標と合う。`, `${PT(correct[1])}：${$(calcTex(L, correct[1][0]))} で、y 座標と合う。`, `2 点とも通るのは ${PAIR(correct[0], correct[1])}。ほかの組は、1 点が通らない。`],
          };
        }),
        // 06q04 小テスト（4）傾き −3/2 切片 4：切片の点から、右へいくつ・下へいくつ
        t("06q04", (r) => {
          const { p, q, s, b, L, a, P0, P1 } = stepLine(r, [1, 2, 3, 4], [2, 3, 4, 5], 6), mode = r(0, 2);
          const ask = mode < 2;
          return {
            q: ask
              ? `傾きが ${$(qt(a))}、切片が ${$(String(b))} の一次関数のグラフをかく。切片の点 ${PT(P0)} から、右へ ${q} 進むとき、${UD(s)}へいくつ進んだ点をとればよいか。`
              : `傾きが ${$(qt(a))}、切片が ${$(String(b))} の一次関数のグラフをかく。切片の点 ${PT(P0)} から、${UD(s)}へ ${p} 進むとき、右へいくつ進んだ点をとればよいか。`,
            ans: ask ? p : q,
            hint: "傾きが分数のとき、右へ進む量と上（下）へ進む量は、それぞれ分母と分子のどちらにあたるかな？",
            steps: [`傾き ${$(qt(a))} は、右へ ${q} 進むと、${UD(s)}へ ${p} 進むことを表す。`, `切片の点 ${PT(P0)} から、右へ ${q}、${UD(s)}へ ${p} 進んだ点 ${PT(P1)} をとる。`, ask ? `${UD(s)}へ ${p} 進めばよい。` : `右へ ${q} 進めばよい。`],
          };
        }),
      ],
      // ───────── 3 応用 ─────────
      3: [
        // 06d04a 演習（4）x 座標も y 座標も整数の点：グラフが通る点を選ぶ
        t("06d04a", (r) => {
          const { q, L } = fracLine(r, [2, 3, 4], [1, -1, 2, -2, 3, -3], [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5]);
          const dec = q === 2 && r(0, 1) === 1, eq = dec ? ltexDec(L) : ltex(L);
          const [x0, y0] = pick(r, latt(L, -5, 5));
          const pool = shuffle(r, [[x0, y0 + 1], [x0, y0 - 1], [x0 + 1, y0], [x0 - 1, y0], [y0, x0], [x0 + 2, y0]]).filter((P) => !onLine(L, P));
          return {
            q: `${$(eq)} のグラフが通る点はどれか。`,
            ans: PT([x0, y0]),
            choices: choices4(r, PT([x0, y0]), pool.map(PT)),
            hint: "それぞれの点の x 座標を式に入れると、y はいくつになるかな？ y 座標と合う点はどれだろう？",
            steps: [`点の x 座標を式に入れて、y 座標と合うかを確かめる。`, `${PT([x0, y0])}：${$(calcTex(L, x0, dec))} で、y 座標と合う。`, `ほかの点は、x 座標を式に入れても、y 座標と合わない。`],
          };
        }),
        // 06d04b 演習（4）x 座標も y 座標も整数の点の個数（範囲つき）
        t("06d04b", (r) => {
          for (let i = 0; i < 200; i++) {
            const { q, L } = fracLine(r, [2, 3], [1, -1, 2, -2, 3, -3], [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5]);
            const lo = r(-6, -1), hi = lo + r(7, 10), ps = latt(L, lo, hi);
            if (ps.length < 2 || ps.length > 5) continue;
            return {
              q: `${$(ltex(L))} のグラフが通る点のうち、x 座標が ${$(String(lo))} 以上 ${$(String(hi))} 以下の整数で、y 座標も整数の点は、全部で何個か。`,
              ans: ps.length,
              unit: "個",
              hint: "x が整数のとき、y が整数になるのは、どんな x かな？ 小さい x から順に、式に入れて調べてみよう。",
              steps: [`x が整数で、y も整数になる x を、式に入れて調べる。`, `${ps.map((P) => `${$(`x=${P[0]}`)} のとき ${$(`y=${P[1]}`)}`).join("、")}。`, `全部で ${ps.length} 個。`],
            };
          }
          return { skip: true };
        }),
        // 06d05a 演習（5）A さんのまちがい：正しい点を選ぶ
        t("06d05a", (r) => {
          for (let i = 0; i < 100; i++) {
            const { p, q, s, b, L, a, P0, P1 } = stepLine(r, [1, 2, 3, 4], [2, 3, 4, 5], 5);
            if (p === q) continue;
            const PA = [p, b + s * q];
            const wrongs = [PA, [q, b - s * p], [p, b - s * q]].filter((P) => !onLine(L, P));
            if (wrongs.length < 3) continue;
            return {
              q: `A さんは、${$(ltex(L))} のグラフを、切片の点 ${PT(P0)} から、右へ ${p}、${UD(s)}へ ${q} 進んだ点 ${PT(PA)} をとってかこうとした。切片の点から傾きにしたがって進んだ、正しい点はどれか。`,
              ans: PT(P1),
              choices: choices4(r, PT(P1), wrongs.map(PT)),
              hint: "傾きの分数で、分母と分子は、それぞれ右へ進む量と上（下）へ進む量のどちらにあたるかな？",
              steps: [`傾き ${$(qt(a))} は、右へ ${q} 進むと、${UD(s)}へ ${p} 進むことを表す。`, `A さんは、右へ ${p}、${UD(s)}へ ${q} と、進む量を取りちがえている。`, `正しい点は、右へ ${q}、${UD(s)}へ ${p} 進んだ ${PT(P1)}。`],
            };
          }
          return { skip: true };
        }),
        // 06d05b 演習（5）A さんがかいた直線の傾き
        t("06d05b", (r) => {
          for (let i = 0; i < 100; i++) {
            const { p, q, s, b, L, a, P0 } = stepLine(r, [1, 2, 3, 4], [2, 3, 4, 5], 5);
            if (p === q) continue;
            const PA = [p, b + s * q], mine = Q(s * q, p);
            return {
              q: `A さんは、${$(ltex(L))} のグラフを、切片の点 ${PT(P0)} から、右へ ${p}、${UD(s)}へ ${q} 進んだ点 ${PT(PA)} をとり、この 2 点を通る直線をひいた。A さんがひいた直線の傾きは？`,
              ans: num(mine),
              hint: "傾きは、何÷何で求められたかな？ A さんは、右へいくつ、上（下）へいくつ進んだ？",
              steps: [`2 点 ${PT(P0)}、${PT(PA)} で、x の増加量は ${p}、y の増加量は ${N(s * q)}。`, `傾きは、（y の増加量）÷（x の増加量）で ${$(`${s * q < 0 ? `(${s * q})` : s * q}\\div ${p}=${qt(mine)}`)}。`, `もとの傾き ${$(qt(a))} とは、ちがう（右へ進む量と上（下）へ進む量が、逆になっている）。`],
            };
          }
          return { skip: true };
        }),
        // 06d06a 演習（6）① 直線と x 軸との交点の x 座標
        t("06d06a", (r) => {
          const { xi, yi, L } = axisLine(r, "any");
          return {
            q: `一次関数 ${$(ltex(L))} のグラフをかく。このグラフが x 軸と交わる点の x 座標は？`,
            ans: xi,
            hint: "x 軸上の点は、y 座標がいくつの点かな？ その y 座標を式に入れてみよう。",
            steps: [`x 軸上の点は、y 座標が 0。`, `${solveX(L, xi)}。`, `x 軸との交点は ${PT([xi, 0])}。x 座標は ${N(xi)}。`],
          };
        }),
      ],
      // ───────── 4 入試レベル ─────────
      4: [
        // 06d06b 演習（6）② 直線と x 軸、y 軸で囲まれた三角形の面積
        t("06d06b", (r) => {
          const { xi, yi, L, area } = axisLine(r, "any");
          return {
            q: `一次関数 ${$(ltex(L))} のグラフと、x 軸、y 軸で囲まれた三角形の面積は何 cm² か。（座標の 1 目もりを 1cm とする）`,
            ans: areaAns(area),
            unit: "cm²",
            hint: "x 軸との交点と、y 軸との交点は、それぞれどこかな？ 三角形の底辺と高さは、どの点の座標からわかる？",
            steps: [`y 軸との交点は ${PT([0, yi])}。`, `x 軸との交点は、${solveX(L, xi)}。${PT([xi, 0])}。`, `底辺 ${Math.abs(xi)}、高さ ${Math.abs(yi)} だから、面積は ${$(`${Math.abs(xi)}\\times ${Math.abs(yi)}\\div 2=${areaAns(area)}`)}（cm²）。`],
          };
        }),
        // 06d07 演習（7）x 座標が範囲内の整数で、y 座標も整数の点の個数
        t("06d07", (r) => {
          for (let i = 0; i < 300; i++) {
            const { q, m, k, L } = fracLine(r, [3, 4, 5], [1, -1, 2, -2, 3, -3, 4], [-4, -3, -2, -1, 1, 2, 3, 4]);
            const hi = r(14, 25), ps = latt(L, 0, hi);
            if (ps.length < 3) continue;
            const numer = `${cx(Q(m))}${k < 0 ? "-" : "+"}${Math.abs(k)}`;
            const first = ps[0], d = ps[1][0] - ps[0][0];
            return {
              q: `一次関数 ${$(ltex(L))} のグラフ上の点のうち、x 座標が 0 以上 ${hi} 以下の整数で、y 座標も整数である点は、全部で何個あるか。`,
              ans: ps.length,
              unit: "個",
              hint: "式を 1 つの分数にまとめて書くと、y が整数になるのは、分子がどんな数のときかな？",
              steps: [`${$(`y=\\frac{${numer}}{${q}}`)} と書き直す。分子 ${$(numer)} が ${q} の倍数になる x を調べる。`, `x が ${first[0]} のとき ${$(`y=${first[1]}`)}。そこから、x が ${d} ふえるごとに y が整数になる。`, `${ps.map((P) => P[0]).join("、")} の ${ps.length} 個。`],
            };
          }
          return { skip: true };
        }),
        // 06q05 小テスト チャレンジ：y＝(2/3)x−4 と x 軸、y 軸で囲まれた三角形の面積
        t("06q05", (r) => {
          const { xi, yi, L, area } = axisLine(r, "pos-neg");
          return {
            q: `一次関数 ${$(ltex(L))} のグラフと、x 軸、y 軸で囲まれた三角形の面積は何 cm² か。（座標の 1 目もりを 1cm とする）`,
            ans: areaAns(area),
            unit: "cm²",
            hint: "グラフが x 軸、y 軸と交わる点は、それぞれどこかな？ 三角形の底辺と高さは、どの点の座標からわかる？",
            steps: [`y 軸との交点は ${PT([0, yi])}。`, `x 軸との交点は、${solveX(L, xi)}。${PT([xi, 0])}。`, `底辺 ${Math.abs(xi)}、高さ ${Math.abs(yi)} だから、面積は ${$(`${Math.abs(xi)}\\times ${Math.abs(yi)}\\div 2=${areaAns(area)}`)}（cm²）。`],
          };
        }),
      ],
    },
  }),
];

// 移さなかった問題：なし。図（座標平面）にかく問題は、通る 2 点の組・切片の点から進んだ点の座標・軸との交点・面積などの値を聞く形にして、すべて移した。
export const SKIPPED = [];
