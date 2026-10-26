// ============================================================
// renritsu-01.js — 連立方程式 第1時「2つの文字をふくむ方程式の解をさがし、連立方程式の解を見つけよう」
//   ikkan の演習プリント（renritsu-01.dr.1〜10）・小テスト（renritsu-01.qz.1〜5）を、コツコツくんのテンプレートにしたもの。
//   テンプレート id＝「01」＋ d（演習）／q（小テスト）＋ ikkan の問題の番号（＋ 1つの問題から2つ以上つくるときは a, b…）。例：01d07a ＝ renritsu-01.dr.7 の1つ目
//   解は、先に x、y を決めて右辺を計算してつくり、2元1次方程式の解の組・連立方程式の解は、問題文の式に代入して成り立つかを計算で確かめて選択肢にする。
//   「表を完成させる」「すべて選ぶ」「連立方程式をつくる」は入力欄で答えられないので、表の1つの値・解の個数・4択・まちがえやすい組を選ぶ形に直した。
// ============================================================
import { t, pick, choices4, shuffle, rnz, coefVar, signedVar, signed, gcd, lcm } from "../kit.js";
import { unitFor } from "../unit-kit.js";
import { linTex, casesTex, solve2 } from "../algebra.js";
const unit = unitFor("renritsu");

// ── このファイルの小道具（式の組をつくる・解く・解説をつくる）。答えは、すべて solve2 などの計算で出す ──
/** 数に負の符号があれば、かっこをつける */
const par = (v) => (v < 0 ? `(${v})` : `${v}`);
/** 先頭の項「k×v」の TeX（k＝1 は v のみ、k＝−1 は −v） */
const mulNum = (k, v) => (k === 1 ? `${v}` : k === -1 ? `-${par(v)}` : `${k}\\times${par(v)}`);
/** 2番目以降の項「+k×v」の TeX */
const smulNum = (k, v) => (k === 1 ? `+${par(v)}` : k === -1 ? `-${par(v)}` : `${k < 0 ? "-" : "+"}${Math.abs(k)}\\times${par(v)}`);
/** ax+by に x、y の値を入れた式の TeX */
const lhsNum = (a, b, x, y) => mulNum(a, x) + smulNum(b, y);
/** 条件に合うまで作り直す（合わなければ skip） */
const gen = (fn) => (r) => {
  for (let i = 0; i < 400; i++) { const p = fn(r); if (p) return p; }
  return { skip: true };
};
/** 連立方程式を cases で（問題文用）。e＝[a, b, c] */
const SYS = (e1, e2, vars) => `$${casesTex([linTex(...e1, vars), linTex(...e2, vars)])}$`;
/** 整数の解 [x, y]（整数にならない・1つに決まらないなら null） */
const solveI = (e1, e2) => {
  const s = solve2(e1, e2);
  return s && s[0][1] === 1 && s[1][1] === 1 ? [s[0][0], s[1][0]] : null;
};
/** 4行におさめる（多いときは、前の2行を1行にする） */
const fit = (ls) => {
  const a = [...ls];
  while (a.length > 4) a.splice(0, 2, a[0] + "　" + a[1]);
  return a;
};
/** 式 e（ax+by=c）の、ki 番目の文字に val を代入する。残る文字の値 other と、代入した式 sub、整理した式 rest を返す */
const substEq = (e, ki, val, vars = ["x", "y"]) => {
  const oi = 1 - ki, kc = e[ki], oc = e[oi], ov = vars[oi];
  const rhs = e[2] - kc * val;
  if (!oc || rhs % oc !== 0) return null;
  const first = ki === 0 ? mulNum(kc, val) : coefVar(oc, ov);
  const second = ki === 0 ? signedVar(oc, ov) : smulNum(kc, val);
  return { sub: `${first}${second}=${e[2]}`, rest: oc === 1 ? null : `${coefVar(oc, ov)}=${rhs}`, other: rhs / oc };
};
/** 消す文字と、①②に何をかけるか（かける数が小さくなる文字を選ぶ。同じなら pref 番目の文字。force を渡すと、その文字を消す） */
const plan = (e1, e2, pref = 0, force = null) => {
  const cs = [0, 1].filter((k) => e1[k] && e2[k] && (force === null || k === force)).map((k) => {
    const p = Math.abs(e1[k]), q = Math.abs(e2[k]), L = lcm(p, q);
    return { k, m1: L / p, m2: L / q, cost: L / p + L / q };
  });
  cs.sort((u, v) => u.cost - v.cost || (u.k === pref ? -1 : 1) - (v.k === pref ? -1 : 1));
  return cs[0] || null;
};
/** 加減法で解く解説（かける数が1なら、そのまま）。lines＝[かけ算の行（あれば）, 消去の行, 代入の行]、sol＝解 [x, y] */
const elimSteps = (e1, e2, pref = 0, vars = ["x", "y"], force = null) => {
  const pl = plan(e1, e2, pref, force);
  if (!pl) return null;
  const { k, m1, m2 } = pl, w = 1 - k;
  const E1 = e1.map((v) => v * m1), E2 = e2.map((v) => v * m2);
  const n1 = m1 > 1 ? "③" : "①", n2 = m2 > 1 ? (m1 > 1 ? "④" : "③") : "②";
  let op, A, C;
  if (E1[k] === E2[k]) {
    if (E1[w] - E2[w] > 0) { op = `${n1}−${n2}`; A = E1[w] - E2[w]; C = E1[2] - E2[2]; }
    else { op = `${n2}−${n1}`; A = E2[w] - E1[w]; C = E2[2] - E1[2]; }
  } else if (E1[k] === -E2[k]) { op = `${n1}+${n2}`; A = E1[w] + E2[w]; C = E1[2] + E2[2]; }
  else return null;
  if (!A || C % A) return null;
  const v1 = C / A, sb = substEq(e1, w, v1, vars);
  if (!sb) return null;
  const lines = [], mult = [];
  if (m1 > 1) mult.push(`①×${m1}　$${linTex(...E1, vars)}$ …③`);
  if (m2 > 1) mult.push(`②×${m2}　$${linTex(...E2, vars)}$ …${n2}`);
  if (mult.length) lines.push(mult.join("　"));
  lines.push(`$${vars[k]}$ を消去するため、${op}　$${coefVar(A, vars[w])}=${C}$${A === 1 ? "" : `　より　$${vars[w]}=${v1}$`}`);
  lines.push(`①に $${vars[w]}=${v1}$ を代入：$${sb.sub}$　${sb.rest ? `$${sb.rest}$　` : ""}$${vars[k]}=${sb.other}$`);
  const sol = []; sol[w] = v1; sol[k] = sb.other;
  return { lines, sol, plan: pl };
};
const XY = ["x", "y"];
const ANS = (x, y) => `答えは $x=${x}$、$y=${y}$。`;
const INTRO = "上の式を①、下の式を②とする。";

const sv = (r, lo, hi, neg = 0) => (r(1, 100) <= neg ? -r(lo, hi) : r(lo, hi));
const E = (e) => `$${linTex(...e)}$`;                                  // 2元1次方程式（問題文用）
const PAIR = ([x, y]) => `$x=${x},\\ y=${y}$`;                          // 解の組（問題文・選択肢用）
const sat = (e, x, y) => e[0] * x + e[1] * y === e[2];
const KANA = ["ア", "イ", "ウ", "エ"];
/** 2元1次方程式 e の整数の解（|x|、|y| が R 以下） */
const solsOf = (e, R = 7) => {
  const o = [];
  for (let x = -R; x <= R; x++) {
    const rem = e[2] - e[0] * x;
    if (rem % e[1] === 0 && Math.abs(rem / e[1]) <= R) o.push([x, rem / e[1]]);
  }
  return o;
};
/** 解のすぐそばの、解ではない組（まちがえやすい組）。r で並べかえる */
const nearMiss = (r, e, [x, y]) => shuffle(r, [[x, y + 1], [x, y - 1], [x + 1, y], [x - 1, y], [y, x], [-x, y], [x, -y], [x + 1, y + 1], [x - 1, y - 1]])
  .filter(([u, v]) => !sat(e, u, v) && Math.abs(u) <= 9 && Math.abs(v) <= 9);
/** 式 e の線の上を、1ずつずらした組（e の解になる）。連立方程式の「片方の式だけ成り立つ組」をつくる */
const onLine = (e, [x, y], ts = [1, -1, 2, -2]) => {
  const g = gcd(Math.abs(e[0]), Math.abs(e[1]));
  return ts.map((s) => [x + s * (e[1] / g), y - s * (e[0] / g)]).filter(([u, v]) => Math.abs(u) <= 9 && Math.abs(v) <= 9);
};
const mark = (b) => (b ? "○" : "×");

/** 連立方程式の解を選ぶ（4択）。o：a1・b1・a2・b2＝係数の候補、x・y＝解の範囲 */
const sysPick = (id, o) => t(id, gen((r) => {
  const e1 = [pick(r, o.a1), pick(r, o.b1)], e2 = [pick(r, o.a2), pick(r, o.b2)];
  const x0 = r(o.x[0], o.x[1]), y0 = r(o.y[0], o.y[1]);
  e1.push(e1[0] * x0 + e1[1] * y0); e2.push(e2[0] * x0 + e2[1] * y0);
  const s = solveI(e1, e2);
  if (!s || s[0] !== x0 || s[1] !== y0) return null;
  const A = onLine(e1, [x0, y0]), B = onLine(e2, [x0, y0]);
  const wr = [A[0], B[0], A[1], B[1], A[2], B[2]].filter(Boolean);
  const wrongs = [];
  for (const w of wr) if (!wrongs.some((u) => u[0] === w[0] && u[1] === w[1]) && !(sat(e1, w[0], w[1]) && sat(e2, w[0], w[1]))) wrongs.push(w);
  if (wrongs.length < 3) return null;
  const ex = wrongs[0], v1 = ex[0] * e1[0] + ex[1] * e1[1], v2 = ex[0] * e2[0] + ex[1] * e2[1];
  return {
    q: `連立方程式 ${SYS(e1, e2)} の解はどれか。代入して確かめよう。`,
    ans: PAIR(s),
    choices: choices4(r, PAIR(s), wrongs.map(PAIR)),
    hint: "連立方程式の解は、2つの式の両方に代入して、どちらも成り立つ組。",
    steps: [
      `${PAIR(s)} を代入すると　上の式 $${lhsNum(e1[0], e1[1], x0, y0)}=${e1[2]}$ ○　下の式 $${lhsNum(e2[0], e2[1], x0, y0)}=${e2[2]}$ ○　で、両方成り立つ。`,
      `ほかの組は、たとえば ${PAIR(ex)} だと　上の式 $${lhsNum(e1[0], e1[1], ex[0], ex[1])}=${v1}$（${mark(v1 === e1[2])}）　下の式 $${lhsNum(e2[0], e2[1], ex[0], ex[1])}=${v2}$（${mark(v2 === e2[2])}）で、片方しか成り立たない。`,
    ],
  };
}));

// ── 買い物の問題（合わせて n 個・代金 T 円）──
const BUYS = [
  { f: (pa, pb, n, T, u) => `${pa}円切手と${pb}円切手を、合わせて${n}枚買ったら、代金は${T}円だった。${pa}円切手を $x$ 枚、${pb}円切手を $y$ 枚とする。`, A: (pa) => `${pa}円切手`, B: (pb) => `${pb}円切手`, u: "枚", pa: [30, 40, 50, 60, 70], pb: [80, 90, 100, 120] },
  { f: (pa, pb, n, T) => `1個${pa}円のりんごと1個${pb}円のみかんを、合わせて${n}個買ったら、代金は${T}円だった。りんごを $x$ 個、みかんを $y$ 個とする。`, A: () => "りんご", B: () => "みかん", u: "個", pa: [100, 120, 150, 180], pb: [40, 50, 60, 70, 80] },
  { f: (pa, pb, n, T) => `1枚${pa}円の画用紙と1枚${pb}円の色紙を、合わせて${n}枚買ったら、代金は${T}円だった。画用紙を $x$ 枚、色紙を $y$ 枚とする。`, A: () => "画用紙", B: () => "色紙", u: "枚", pa: [30, 40, 50, 60], pb: [70, 80, 90, 100] },
];
const buy = (r) => {
  const b = pick(r, BUYS), pa = pick(r, b.pa), pb = pick(r, b.pb), x0 = r(1, 9), y0 = r(1, 9);
  if (x0 === y0 || pa === pb) return null;
  const n = x0 + y0, T = pa * x0 + pb * y0;
  return { b, pa, pb, x0, y0, n, T, e1: [1, 1, n], e2: [pa, pb, T], text: b.f(pa, pb, n, T) };
};

export const UNITS = [
  unit("01", {
    name: "2元1次方程式と連立方程式の解",
    desc: "解をさがして、代入して確かめる",
    prereqs: ["J1-e2"],
    points: [
      "$x$、$y$ のように文字を2つふくむ1次方程式を、2元1次方程式という。これを成り立たせる $x$、$y$ の値の組を、その方程式の解といい、解はたくさんある。",
      "2つの方程式を組にしたものを連立方程式という。2つの式を両方成り立たせる $x$、$y$ の値の組を、連立方程式の解という。",
      "解かどうかは、$x$、$y$ の値を式に代入して確かめる。連立方程式の解は、2つの式のどちらにも代入して、両方成り立つかを調べる。",
    ],
    levels: {
      // ───────── 1 基礎 ─────────
      1: [
        // 01d01 x+2y=6 の表（x=−2 のときの y）
        t("01d01", gen((r) => {
          const a = pick(r, [1, 1, 1, 2, 2, 3]), b = pick(r, [1, 2, 2, 3, -1, -2, -3, 4]);
          const x0 = r(-3, 6), y0 = r(-3, 5), e = [a, b, a * x0 + b * y0];
          const askY = r(1, 5) !== 1, sb = askY ? substEq(e, 0, x0) : substEq(e, 1, y0);
          if (!sb) return null;
          return {
            q: `2元1次方程式 ${E(e)} で、$${askY ? "x" : "y"}=${askY ? x0 : y0}$ のとき、$${askY ? "y" : "x"}$ の値は？`,
            ans: askY ? y0 : x0,
            hint: `$${askY ? "x" : "y"}$ の値を方程式に入れると、$${askY ? "y" : "x"}$ だけの方程式になる。`,
            steps: [`$${askY ? "x" : "y"}=${askY ? x0 : y0}$ を代入すると　$${sb.sub}$${sb.rest ? `　$${sb.rest}$` : ""}　$${askY ? "y" : "x"}=${sb.other}$`, `答えは ${PAIR([x0, y0])}。`],
          };
        })),
        // 01d02a 3x+y=7 の解はどれか（4択）
        t("01d02a", gen((r) => {
          const e0 = [pick(r, [1, 2, 3]), pick(r, [1, 1, 2, -1, -2])];
          const x0 = r(-2, 5), y0 = r(-2, 5), e = [...e0, e0[0] * x0 + e0[1] * y0];
          const wr = nearMiss(r, e, [x0, y0]);
          if (wr.length < 3) return null;
          const w = wr[0], v = w[0] * e[0] + w[1] * e[1];
          return {
            q: `次のうち、2元1次方程式 ${E(e)} の解はどれか。`,
            ans: PAIR([x0, y0]),
            choices: choices4(r, PAIR([x0, y0]), wr.map(PAIR)),
            hint: "$x$、$y$ の値を方程式に代入して、成り立つかどうかを調べよう。",
            steps: [`${PAIR([x0, y0])} を代入すると　$${lhsNum(e[0], e[1], x0, y0)}=${e[2]}$ となり、成り立つ。`, `たとえば ${PAIR(w)} は　$${lhsNum(e[0], e[1], w[0], w[1])}=${v}$ で、$${e[2]}$ にならない。`],
          };
        })),
        // 01d02b 4つの組のうち、解は何個か
        t("01d02b", gen((r) => {
          const e0 = [pick(r, [1, 2, 3]), pick(r, [1, 1, 2, -1, -2])];
          const base = [r(-2, 5), r(-2, 5)], e = [...e0, e0[0] * base[0] + e0[1] * base[1]];
          const ss = solsOf(e, 6), k = pick(r, [0, 1, 1, 2, 2, 3, 3, 4]);
          if (ss.length < k) return null;
          const good = shuffle(r, ss).slice(0, k);
          const wr = [];
          for (const g of shuffle(r, ss)) for (const w of nearMiss(r, e, g)) if (!wr.some((u) => u[0] === w[0] && u[1] === w[1])) wr.push(w);
          if (wr.length < 4 - k) return null;
          const all = shuffle(r, [...good.map((p) => ({ p, ok: true })), ...wr.slice(0, 4 - k).map((p) => ({ p, ok: false }))]);
          const row = (it, i) => `${KANA[i]}：$${lhsNum(e[0], e[1], it.p[0], it.p[1])}=${it.p[0] * e[0] + it.p[1] * e[1]}$（${mark(it.ok)}）`;
          return {
            q: `次のア〜エのうち、2元1次方程式 ${E(e)} の解になっているものは何個か。${all.map((it, i) => `${KANA[i]} ${PAIR(it.p)}`).join("　")}`,
            ans: k,
            unit: "個",
            hint: "ア〜エを1つずつ方程式に代入して、成り立つかどうかを調べよう。",
            steps: [all.slice(0, 2).map((it, i) => row(it, i)).join("　"), all.slice(2).map((it, i) => row(it, i + 2)).join("　"), k === 0 ? `どれも ${e[2]} にならないので、解になっているものは 0 個。` : `${E(e)} が成り立つ（${e[2]} になる）のは ${all.map((it, i) => (it.ok ? KANA[i] : null)).filter(Boolean).join("、")} の ${k} 個。`],
          };
        })),
        // 01d03 2x+y=8, x−y=1 の解を、ア〜ウから
        sysPick("01d03", { a1: [1, 2, 3], b1: [1, 1, 2], a2: [1, 1, 2], b2: [-1, -1, 1, -2], x: [1, 5], y: [1, 5] }),
        // 01q01 2x+y=9 で、x=1, 2, 3 のときの y
        t("01q01", gen((r) => {
          const a = r(1, 4), x0 = r(1, 3), c = r(3 * a + 1, 3 * a + 8), e = [a, 1, c];
          const sb = substEq(e, 0, x0);
          if (!sb) return null;
          return {
            q: `2元1次方程式 ${E(e)} で、$x=${x0}$ のとき、$y$ の値は？`,
            ans: sb.other,
            hint: "$x$ の値を方程式に入れると、$y$ だけの方程式になる。",
            steps: [`$x=${x0}$ を代入すると　$${sb.sub}$`, `${a === 1 ? "" : `$${a * x0}+y=${c}$　`}$y=${sb.other}$`],
          };
        })),
        // 01q02 x−y=4 の解でないものはどれか（4択）
        t("01q02", gen((r) => {
          const e0 = [pick(r, [1, 1, 2, 3]), pick(r, [-1, -1, 1, -2, 2])];
          const base = [r(-2, 6), r(-2, 6)], e = [...e0, e0[0] * base[0] + e0[1] * base[1]];
          const ss = solsOf(e, 7);
          if (ss.length < 3) return null;
          const good = shuffle(r, ss).slice(0, 3);
          const wr = nearMiss(r, e, good[0]);
          if (!wr.length) return null;
          const w = wr[0], v = w[0] * e[0] + w[1] * e[1];
          return {
            q: `次のうち、2元1次方程式 ${E(e)} の解ではないものはどれか。`,
            ans: PAIR(w),
            choices: choices4(r, PAIR(w), good.map(PAIR)),
            hint: "3つは解、1つは解でない。それぞれ方程式に代入して、成り立つかどうかを調べよう。",
            steps: [`${PAIR(w)} を代入すると　$${lhsNum(e[0], e[1], w[0], w[1])}=${v}$ で、$${e[2]}$ にならない。`, `ほかの3つは、代入すると $${e[2]}$ になるので、解。`],
          };
        })),
      ],
      // ───────── 2 標準 ─────────
      2: [
        // 01d09a x+2y=4, 3x−y=5 の解を、ア〜エから
        sysPick("01d09a", { a1: [1, 2], b1: [2, 3, -2], a2: [2, 3, 4], b2: [-1, -2, 1], x: [-2, 5], y: [-3, 4] }),
        // 01d04 x=2, y=−1 が解である連立方程式を選ぶ（4択）
        t("01d04", gen((r) => {
          const x0 = r(-3, 5), y0 = r(-3, 5);
          if (!x0 || !y0) return null;
          const co = () => { for (let i = 0; i < 30; i++) { const c = [pick(r, [1, 2, 3, -1]), pick(r, [1, -1, 2, 3, -2])]; if (!(c[0] < 0 && c[1] < 0)) return c; } return [1, 1]; };   // 「−x−2y」のように両方負の式は出さない
          const mk = ([a, b], d = 0) => [a, b, a * x0 + b * y0 + d];
          const e1 = mk(co()), e2 = mk(co());
          const s = solveI(e1, e2);
          if (!s || s[0] !== x0 || s[1] !== y0) return null;
          const bad = (cf) => {
            const [a, b] = cf, c0 = a * x0 + b * y0;
            const c = pick(r, [c0 + pick(r, [1, -1, 2, -2, 3]), a * x0 - b * y0, b * x0 + a * y0, -c0].filter((v) => v !== c0));
            return [a, b, c];
          };
          const cands = [];
          for (let i = 0; i < 10; i++) { const u = mk(co()), w = bad(co()); cands.push(r(0, 1) ? [u, w] : [w, u]); }
          const show = ([u, w]) => SYS(u, w);
          const key = ([u, w]) => [linTex(...u), linTex(...w)].sort().join("|");       // 式の順がちがうだけの組は、同じ連立とみなす
          const seen = new Set([key([e1, e2])]), wrongs = [];
          for (const c of cands) {        // 解がない（平行な）組・同じ連立は出さない
            if (sat(c[0], x0, y0) && sat(c[1], x0, y0)) continue;
            if (c[0][0] * c[1][1] - c[0][1] * c[1][0] === 0 || seen.has(key(c))) continue;
            seen.add(key(c)); wrongs.push(c);
          }
          if (wrongs.length < 3) return null;
          const ex = wrongs[0], f = sat(ex[0], x0, y0) ? ex[1] : ex[0];
          return {
            q: `$x=${x0}$、$y=${y0}$ が解である連立方程式はどれか。`,
            ans: show([e1, e2]),
            choices: choices4(r, show([e1, e2]), wrongs.map(show)),
            hint: "$x$、$y$ の値を、それぞれの連立方程式の2つの式に代入して、どちらも成り立つものをさがそう。",
            steps: [`正しい連立方程式は、${PAIR([x0, y0])} を代入すると　$${lhsNum(e1[0], e1[1], x0, y0)}=${e1[2]}$ ○　$${lhsNum(e2[0], e2[1], x0, y0)}=${e2[2]}$ ○`, `ほかは、少なくとも1つの式が成り立たない。たとえば $${linTex(...f)}$ は　$${lhsNum(f[0], f[1], x0, y0)}=${f[0] * x0 + f[1] * y0}$ で、$${f[2]}$ にならない。`],
          };
        })),
        // 01d05 x、y が自然数のとき 2x+3y=18 の解
        t("01d05", gen((r) => {
          const a = r(2, 5), b = r(2, 5), c = r(12, 40), e = [a, b, c];
          const ys = [];
          for (let y = 1; b * y < c; y++) ys.push(y);
          if (ys.length > 8) return null;
          const rows = ys.map((y) => ({ y, rem: c - b * y, ok: (c - b * y) % a === 0 }));
          const sols = rows.filter((o) => o.ok).map((o) => [o.rem / a, o.y]);
          if (sols.length < 2 || sols.length > 5) return null;
          const count = r(0, 1) === 0;
          const listing = rows.filter((o) => o.ok).map((o) => `$y=${o.y}$ のとき $x=${o.rem / a}$`).join("、");
          return {
            q: count ? `$x$、$y$ がどちらも自然数のとき、2元1次方程式 ${E(e)} の解は、全部で何組あるか。` : `$x$、$y$ がどちらも自然数のとき、2元1次方程式 ${E(e)} の解のうち、$x$ の値がいちばん大きいものの、$x$ の値は？`,
            ans: count ? sols.length : sols[0][0],
            unit: count ? "組" : undefined,
            hint: "$y$ に 1、2、3、… を入れて、$x$ が自然数（1以上の整数）になるかを調べよう。",
            steps: [`$y=1, 2, 3, \\cdots$ を順に入れて、$x$ が自然数になるものをさがす。`, `$y$ が 1 から ${rows.length} までの整数のうち、$x$ が自然数になるのは　${listing}。`, `解は ${sols.map(([x, y]) => `$(x,\\ y)=(${x},\\ ${y})$`).join("、")} の ${sols.length} 組。`],
          };
        })),
        // 01q03 x+y=7, 3x−y=1 の解を、ア〜ウから
        sysPick("01q03", { a1: [1], b1: [1], a2: [2, 3, 4], b2: [-1], x: [1, 6], y: [1, 6] }),
        // 01q04 x=1, y=2 が ax+3y=10 の解であるとき a
        t("01q04", gen((r) => {
          const x0 = r(1, 3), y0 = sv(r, 1, 4, 20), a = sv(r, 1, 5, 20), p = pick(r, [2, 3, 4, 5, -2, -3]);
          if (!a) return null;
          const c = a * x0 + p * y0;
          const sb = substEq([x0, p, c], 1, y0, ["a", "y"]);
          if (!sb || sb.other !== a) return null;
          return {
            q: `$x=${x0}$、$y=${y0}$ が、2元1次方程式 $ax${signedVar(p, "y")}=${c}$ の解であるとき、$a$ の値は？`,
            ans: a,
            hint: "解は、方程式に代入すると成り立つ。$x$、$y$ の値を入れて、$a$ についての方程式にしよう。",
            steps: [`解だから、$x=${x0}$、$y=${y0}$ を代入すると　$${x0 === 1 ? "" : x0}a${smulNum(p, y0)}=${c}$`, `$${coefVar(x0, "a")}${signed(p * y0)}=${c}$　${sb.rest ? `$${sb.rest}$　` : ""}$a=${a}$`],
          };
        })),
      ],
      // ───────── 3 応用 ─────────
      3: [
        // 01d06 x+y=7, 3x−y=5 の y の表
        t("01d06", gen((r) => {
          const a1 = pick(r, [1, 1, 2]), m = r(3, 5), x0 = r(2, 4), y0 = r(2, 8);
          if (m === a1) return null;
          const e1 = [a1, 1, a1 * x0 + y0], e2 = [m, -1, m * x0 - y0];
          const s = solveI(e1, e2);
          if (!s || s[0] !== x0 || s[1] !== y0) return null;
          const xs = [1, 2, 3, 4, 5], ya = xs.map((x) => e1[2] - a1 * x), yb = xs.map((x) => m * x - e2[2]);
          const same = xs.filter((x, i) => ya[i] === yb[i]);
          if (same.length !== 1 || same[0] !== x0) return null;
          const askX = r(0, 1) === 0;
          return {
            q: `連立方程式 ${SYS(e1, e2)} について、$x=1, 2, 3, 4, 5$ のときの $y$ の値を、2つの方程式それぞれで求めて、表にして調べる。2つの方程式で $y$ の値が等しくなるときの、${askX ? "$x$" : "$y$"} の値は？`,
            ans: askX ? x0 : y0,
            hint: "$x$ に 1〜5 を入れて、それぞれの式から $y$ を求めよう。2つの式で同じ $y$ になる行をさがす。",
            steps: [`${E(e1)} の $y$（$x=1, 2, 3, 4, 5$ の順）：${ya.join("、")}`, `${E(e2)} の $y$：${yb.join("、")}`, `$y$ が等しいのは $x=${x0}$ のとき（$y=${y0}$）。`],
          };
        })),
        // 01d07a 50円切手と80円切手 …枚数と代金を式に（4択）
        t("01d07a", gen((r) => {
          const B = buy(r);
          if (!B) return null;
          const { pa, pb, n, T, x0, y0 } = B, ok = [B.e1, B.e2];
          const cand = [
            [[1, 1, n], [pb, pa, T]],                // 値段を入れかえた
            [[1, 1, T], [pa, pb, n]],                // 枚数と代金を入れかえた
            [[1, -1, n], [pa, pb, T]],               // 枚数を「差」にした
            [[1, 1, n], [pa, pb, T + n]],
          ].filter(([u, v]) => !(sat(u, x0, y0) && sat(v, x0, y0)));
          return {
            q: `${B.text}${B.b.u === "個" ? "個数" : "枚数"}の関係と代金の関係から、連立方程式をつくると、正しいものはどれか。`,
            ans: SYS(...ok),
            choices: choices4(r, SYS(...ok), cand.map(([u, v]) => SYS(u, v))),
            hint: `合わせた${B.b.u === "個" ? "個数" : "枚数"}と、合計の代金を、それぞれ $x$、$y$ で表そう。`,
            steps: [`合わせた${B.b.u === "個" ? "個数" : "枚数"}より　$x+y=${n}$`, `代金より　$${pa}x+${pb}y=${T}$`],
          };
        })),
        // 01d07b 解を表などで見つける
        t("01d07b", gen((r) => {
          const B = buy(r);
          if (!B) return null;
          const { pa, pb, n, T, x0, y0 } = B, askX = r(0, 1) === 0;
          const xs = x0 > 1 ? [x0 - 1, x0] : [x0, x0 + 1];
          const row = (x) => { const y = n - x; return `$x=${x}$、$y=${y}$ のとき　$${pa}\\times${x}+${pb}\\times${y}=${pa * x + pb * y}$（円）${pa * x + pb * y === T ? "　← 合う" : ""}`; };
          return {
            q: `${B.text}${askX ? B.b.A(pa) : B.b.B(pb)}は何${B.b.u}買ったか。`,
            ans: askX ? x0 : y0,
            unit: B.b.u,
            hint: `$x+y=${n}$ になる $x$、$y$ の組を、表にして、代金を調べよう。`,
            steps: [`合わせた${B.b.u === "個" ? "個数" : "枚数"}より　$x+y=${n}$　代金より　$${pa}x+${pb}y=${T}$`, ...xs.map(row), `代金が ${T} 円になるのは　$x=${x0}$、$y=${y0}$。`],
          };
        })),
        // 01d08 x=2, y=b が 3x−4y=10 の解
        t("01d08", gen((r) => {
          const a = r(2, 5), p = pick(r, [-2, -3, -4, -5, 2, 3, 4]), x0 = r(1, 4), b = sv(r, 1, 5, 50);
          if (!b) return null;
          const c = a * x0 + p * b, e = [a, p, c];
          const sb = substEq(e, 0, x0, ["x", "b"]);
          if (!sb || sb.other !== b) return null;
          return {
            q: `$x=${x0}$、$y=b$ が、2元1次方程式 ${E(e)} の解であるとき、$b$ の値は？`,
            ans: b,
            hint: "解は、方程式に代入すると成り立つ。$x$ の値と $y=b$ を入れて、$b$ についての方程式にしよう。",
            steps: [`$x=${x0}$、$y=b$ を代入すると　$${sb.sub}$`, `$${sb.rest}$　より　$b=${b}$`],
          };
        })),
      ],
      // ───────── 4 入試レベル ─────────
      4: [
        // 01d09b x=2, y=−1 が ax+y=3, x−by=5 の解であるとき a, b
        t("01d09b", gen((r) => {
          const x0 = r(1, 4), y0 = sv(r, 1, 3, 50), a = sv(r, 1, 4, 20), b = r(1, 5), p = pick(r, [1, 1, 2, -1, 3]), q = pick(r, [1, 1, 2, 3]), sB = pick(r, [1, -1]);
          if (!a) return null;
          const c1 = a * x0 + p * y0, c2 = q * x0 + sB * b * y0;
          const s1 = substEq([x0, p, c1], 1, y0, ["a", "y"]), s2 = substEq([sB * y0, q, c2], 1, x0, ["b", "x"]);
          if (!s1 || !s2 || s1.other !== a || s2.other !== b) return null;
          const ask = r(0, 1);
          return {
            q: `$x=${x0}$、$y=${y0}$ が、連立方程式 $\\begin{cases}ax${signedVar(p, "y")}=${c1}\\\\${coefVar(q, "x")}${sB > 0 ? "+" : "-"}by=${c2}\\end{cases}$ の解であるとき、$${["a", "b"][ask]}$ の値は？`,
            ans: [a, b][ask],
            hint: "解は、2つの式のどちらにも代入して成り立つ。$x$、$y$ の値を、それぞれの式に入れよう。",
            steps: [`上の式に代入　$${s1.sub}$　${s1.rest ? `$${s1.rest}$　` : ""}$a=${a}$`, `下の式に代入　$${s2.sub}$　${s2.rest ? `$${s2.rest}$　` : ""}$b=${b}$`, `答えは $a=${a}$、$b=${b}$。`],
          };
        })),
        // 01d10 x=3, y=−2 が解になる連立方程式を1つつくる → 2つ目の式を選ぶ（4択）
        t("01d10", gen((r) => {
          const x0 = r(1, 5), y0 = sv(r, 1, 4, 60);
          const e1 = [pick(r, [1, 1, 2]), pick(r, [1, 1, 2, -1])], e2 = [pick(r, [1, 2, 3, -1]), pick(r, [1, -1, 2, 3, -2])];
          if (e2[0] < 0 && e2[1] < 0) return null;                                  // 両方負の式は出さない
          e1.push(e1[0] * x0 + e1[1] * y0);
          const ok = [...e2, e2[0] * x0 + e2[1] * y0];
          const s = solveI(e1, ok);
          if (!s || s[0] !== x0 || s[1] !== y0) return null;
          const c0 = ok[2];
          const alts = [[e2[0], e2[1], e2[0] * x0 - e2[1] * y0], [e2[0], e2[1], e2[1] * x0 + e2[0] * y0], [e2[0], e2[1], c0 + 1], [e2[0], e2[1], c0 - 1], [e2[0], e2[1], c0 + 2], [e2[0], e2[1], -c0]]
            .filter((e) => e[2] !== c0 && !sat(e, x0, y0));
          return {
            q: `$x=${x0}$、$y=${y0}$ が解になる連立方程式をつくりたい。1つ目の式を ${E(e1)} とするとき、2つ目の式にできるものはどれか。`,
            ans: E(ok),
            choices: choices4(r, E(ok), alts.map(E)),
            hint: "2つの式の両方が、$x$、$y$ の値を代入して成り立たないといけない。選択肢を1つずつ代入して確かめよう。",
            steps: [`1つ目の式は、代入すると　$${lhsNum(e1[0], e1[1], x0, y0)}=${e1[2]}$ で成り立つ。`, `2つ目の式は、代入すると　$${lhsNum(ok[0], ok[1], x0, y0)}=${ok[2]}$ となる式 ${E(ok)} が、成り立つ。`],
          };
        })),
        // 01q05 チャレンジ x、y が自然数、2x+5y=26 の解のうち x+y=10
        t("01q05", gen((r) => {
          const x0 = r(1, 9), y0 = r(1, 9), a = r(1, 6), b = r(1, 6);
          if (a === b) return null;
          const c = a * x0 + b * y0, s = x0 + y0, e = [a, b, c];
          const sols = [];
          for (let y = 1; b * y < c; y++) if ((c - b * y) % a === 0) sols.push([(c - b * y) / a, y]);
          if (sols.length < 2 || sols.length > 6 || sols.filter(([x, y]) => x + y === s).length !== 1) return null;
          const ask = r(0, 1);
          return {
            q: `$x$、$y$ がどちらも自然数のとき、2元1次方程式 ${E(e)} の解のうち、$x+y=${s}$ となるものの、$${["x", "y"][ask]}$ の値は？`,
            ans: [x0, y0][ask],
            hint: "まず、方程式の自然数の解をすべてさがそう。そのあと、$x+y$ を計算して調べる。",
            steps: [`$y=1, 2, 3, \\cdots$ を順に入れて、$x$ が自然数になる解をさがす。`, `解は ${sols.map(([x, y]) => `$(x,\\ y)=(${x},\\ ${y})$`).join("、")}。`, `$x+y$ を計算すると　${sols.map(([x, y]) => `$${x}+${y}=${x + y}$`).join("、")}`, `$x+y=${s}$ になるのは　$x=${x0}$、$y=${y0}$。`],
          };
        })),
      ],
    },
  }),
];

// 移さなかった問題：なし（演習プリント 10問・小テスト 5問のすべてを移した。表を完成させる・すべて選ぶ・連立方程式をつくる問いは、1つの値・個数・4択に直した）
export const SKIPPED = [];
