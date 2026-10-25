// ============================================================
// ichiji-12.js — 一次関数 第12時「y＝k、x＝h のグラフをかこう」
//   ikkan の演習プリント（ichiji-12.dr.1〜8）・小テスト（ichiji-12.qz.1〜4）を、コツコツくんのテンプレートにしたもの。
//   テンプレート id＝「12」＋ d（演習）／q（小テスト）＋ ikkan の問題の番号（＋ 1つの問題から2つ以上つくるときは a, b…）。例：12d07b ＝ ichiji-12.dr.7 の2つ目
//   y＝k は x 軸に平行で点 (0, k) を通る直線、x＝h は y 軸に平行で点 (h, 0) を通る直線。長方形・三角形の面積は、linear.js の triArea と有理数 Q で計算する（手で書かない）。
//   グラフ（図）は問題文に出せないので、「グラフをかく」「図の直線の式を答える」は、(a) どんな直線かを選ぶ4択（誤答は、x 軸と y 軸の取りちがえ・座標の入れかえ）、
//   (b) 通る点を言って式を選ぶ4択、(c) 式を y＝k・x＝h に直したときの k・h の値、にした。
//   dr.7 の「a の値と直線の式」は、a の値（数）と、直線の式（4択）の 2 つにした。
// ============================================================
import { t, pick, choices4, shuffle, rnz, gcd } from "../kit.js";
import { unitFor } from "../unit-kit.js";
import { Q, qadd, qsub, qmul, qdiv, qneg, qisint, qval } from "../algebra.js";
import { line, xAt, triArea, ltex, ptex2, qt, num } from "../linear.js";

const unit = unitFor("ichiji");

// ── このファイルの小道具 ─────────────────────────────────────────
const TX = (s) => `$${s}$`;
/** 負の数にかっこをつけた TeX（Q か整数） */
const P = (x) => { const s = qt(x); return s[0] === "-" ? `(${s})` : s; };
const PT = (p, name = "") => TX(ptex2(p, name));
/** 係数つきの項（1 は省く） */
const coefX = (c, v) => ltex(line(c, 0)).slice(2).replace(/x/g, v);
/** m×v＋k の TeX（k＝0 なら項を書かない） */
const lin = (m, k, v) => coefX(m, v) + (k === 0 ? "" : `${k < 0 ? "-" : "+"}${Math.abs(k)}`);
/** $y=2$、$x=-3$ */
const HV = (v, val) => TX(`${v}=${qt(val)}`);
/** k×v＝n を解く解説の式：「3x=12」「x=4」 */
const solveVar = (k, v, n) => {
  const val = qdiv(Q(n), Q(k));
  return k === 1 ? TX(`${v}=${qt(val)}`) : `${TX(`${coefX(k, v)}=${n}`)}、${TX(`${v}=${qt(val)}`)}`;
};
const tryGen = (fn, n = 400) => { for (let i = 0; i < n; i++) { const v = fn(); if (v) return v; } return null; };
const NZ = (r, m) => rnz(r, -m, m);
/** 軸に平行な直線の言い方：$x$ 軸に平行な直線で、点 $(0, 2)$ を通る */
const descr = (par, pt) => `${TX(par)} 軸に平行な直線で、点 ${PT(pt)} を通る`;

/** 方程式 v＝val を、いろいろな形で書く。form：plain（y＝2）／A（2y＝−8）／B（3x−12＝0）。tex と、y＝k・x＝h の形に直す解説 */
const hvEq = (r, v, val, form) => {
  const m = pick(r, [2, 3, 4, 5, 6, -2, -3, -4]);
  if (form === "plain") return { tex: `${v}=${qt(val)}`, steps: [] };
  const n = m * val;
  if (form === "A") return { tex: `${coefX(m, v)}=${n}`, steps: [`両辺を ${TX(String(m))} でわって、${HV(v, val)}。`] };
  const c = -n;
  return {
    tex: `${coefX(m, v)}${c < 0 ? "-" : "+"}${Math.abs(c)}=0`,
    steps: [`${TX(String(c))} を右辺に移項して、${TX(`${coefX(m, v)}=${n}`)}。`, `両辺を ${TX(String(m))} でわって、${HV(v, val)}。`],
  };
};

export const UNITS = [
  unit("12", {
    name: "y=k、x=h のグラフ",
    desc: "x 軸に平行な直線 y=k と、y 軸に平行な直線 x=h",
    prereqs: ["J2-ik11"],
    points: [
      "$y=k$ のグラフは、点 $(0, k)$ を通り、$x$ 軸に平行な直線。直線上の点は、$y$ 座標がどれも $k$。",
      "$x=h$ のグラフは、点 $(h, 0)$ を通り、$y$ 軸に平行な直線。直線上の点は、$x$ 座標がどれも $h$。",
      "$2y+4=0$ や $3x-12=0$ のように、文字が 1 つだけの方程式も、$y=k$ や $x=h$ の形に直すと、グラフがかける。",
      "2点の $y$ 座標が等しければ $x$ 軸に平行、$x$ 座標が等しければ $y$ 軸に平行な直線を通る。",
    ],
    levels: {
      // ───────── 1 基礎 ─────────
      1: [
        // 12d01a y＝k、x＝h のグラフはどんな直線か（4択）
        t("12d01a", (r) => {
          const v = pick(r, ["x", "y"]), val = NZ(r, 6);
          const good = v === "y" ? descr("x", [0, val]) : descr("y", [val, 0]);
          const wrongs = v === "y"
            ? [descr("x", [val, 0]), descr("y", [0, val]), descr("y", [val, 0])]
            : [descr("y", [0, val]), descr("x", [val, 0]), descr("x", [0, val])];
          return {
            q: `方程式 ${HV(v, val)} のグラフについて、正しいものは次のうちどれか。`,
            ans: good,
            choices: choices4(r, good, wrongs),
            hint: `${HV(v, val)} をみたす点 $(x, y)$ では、${v === "y" ? "$y$" : "$x$"} の値はいくつ？ もう一方の値は、どんな数でもよい？`,
            steps: v === "y"
              ? [`${HV("y", val)} は、$y$ 座標がいつも ${val} の点の集まり。`, `$x$ 軸に平行な直線で、$y$ 軸と点 ${PT([0, val])} で交わる。`]
              : [`${HV("x", val)} は、$x$ 座標がいつも ${val} の点の集まり。`, `$y$ 軸に平行な直線で、$x$ 軸と点 ${PT([val, 0])} で交わる。`],
          };
        }),
        // 12d01b 直線の式を答える（図の読みとり → 通る点を言って、式を選ぶ4択）
        t("12d01b", (r) => {
          const v = pick(r, ["x", "y"]), val = NZ(r, 5);
          const good = HV(v, val);
          const wrongs = [HV(v === "x" ? "y" : "x", val), HV(v, -val), HV(v === "x" ? "y" : "x", -val)];
          return {
            q: v === "y"
              ? `$x$ 軸に平行で、$y$ 軸と点 ${PT([0, val])} で交わる直線の式は、次のうちどれか。`
              : `$y$ 軸に平行で、$x$ 軸と点 ${PT([val, 0])} で交わる直線の式は、次のうちどれか。`,
            ans: good,
            choices: choices4(r, good, wrongs),
            hint: v === "y" ? "$x$ 軸に平行な直線上の点は、$y$ 座標がどれも同じ。その値は、交わる点のどちらの座標？" : "$y$ 軸に平行な直線上の点は、$x$ 座標がどれも同じ。その値は、交わる点のどちらの座標？",
            steps: v === "y"
              ? [`$x$ 軸に平行な直線は、$y$ 座標がいつも同じ。通る点 ${PT([0, val])} の $y$ 座標は ${val}。`, `式は ${good}。`]
              : [`$y$ 軸に平行な直線は、$x$ 座標がいつも同じ。通る点 ${PT([val, 0])} の $x$ 座標は ${val}。`, `式は ${good}。`],
          };
        }),
        // 12d01c グラフ上にある点（4択）
        t("12d01c", (r) => {
          const v = pick(r, ["x", "y"]), val = NZ(r, 6), m = tryGen(() => { const m = NZ(r, 7); return m === val ? null : m; });
          const on = (p) => (v === "y" ? p[1] === val : p[0] === val);
          const good = v === "y" ? [m, val] : [val, m];
          const cand = v === "y" ? [[val, m], [m, -val], [-val, m], [-m, -val]] : [[m, val], [-val, m], [m, -val], [-m, -val]];
          const wrongs = [], seen = new Set([good.join()]);
          for (const p of shuffle(r, cand)) { if (on(p) || seen.has(p.join())) continue; seen.add(p.join()); wrongs.push(PT(p)); }
          return {
            q: `方程式 ${HV(v, val)} のグラフ上にある点は、次のうちどれか。`,
            ans: PT(good),
            choices: choices4(r, PT(good), wrongs),
            hint: `グラフ上の点は、${HV(v, val)} をみたす。座標の${v === "y" ? "$y$" : "$x$"}の値に注目しよう。`,
            steps: [`${HV(v, val)} のグラフ上の点は、${v === "y" ? "$y$" : "$x$"} 座標がいつも ${val}。`, `${PT(good)} は ${v === "y" ? "$y$" : "$x$"} 座標が ${val} なので、グラフ上にある。`],
          };
        }),
        // 12d02 y＝k または x＝h の形に直す
        t("12d02", (r) => {
          const v = pick(r, ["x", "y"]), val = NZ(r, 8), form = pick(r, ["A", "B", "B"]);
          const e = hvEq(r, v, val, form);
          const kh = v === "y" ? "k" : "h";
          return {
            q: `方程式 ${TX(e.tex)} を、${TX(`${v}=${kh}`)} の形に直すと、$${kh}$ の値は？`,
            ans: val,
            hint: form === "A" ? `${TX(v)} の係数を 1 にするには、両辺をどうする？` : "数の項を右辺に移項すると、どうなる？ そのあと、文字の係数を 1 にするには？",
            steps: e.steps,
          };
        }),
      ],
      // ───────── 2 標準 ─────────
      2: [
        // 12d03a 点を通り、軸に平行な直線の式（4択）
        t("12d03a", (r) => {
          const [p, q] = tryGen(() => { const p = NZ(r, 6), q = NZ(r, 6); return p === q || p === -q ? null : [p, q]; });
          const par = pick(r, ["x", "y"]);
          const good = par === "x" ? HV("y", q) : HV("x", p);
          const wrongs = par === "x" ? [HV("x", p), HV("y", p), HV("x", q)] : [HV("y", q), HV("x", q), HV("y", p)];
          return {
            q: `点 ${PT([p, q])} を通り、$${par}$ 軸に平行な直線の式は、次のうちどれか。`,
            ans: good,
            choices: choices4(r, good, wrongs),
            hint: `$${par}$ 軸に平行な直線上の点は、${par === "x" ? "$y$" : "$x$"} 座標がどれも同じ。通る点の座標から、その値はわかる？`,
            steps: [`$${par}$ 軸に平行な直線は、${par === "x" ? "$y$" : "$x$"} 座標がいつも同じ。`, `点 ${PT([p, q])} の${par === "x" ? "$y$" : "$x$"}座標は ${par === "x" ? q : p} なので、式は ${good}。`],
          };
        }),
        // 12d03b 2点を通る直線の式（4択。y 座標が等しい／x 座標が等しい）
        t("12d03b", (r) => {
          const same = pick(r, ["y", "x"]);   // 等しい座標
          const [k, u1, u2] = tryGen(() => { const k = NZ(r, 7), u1 = NZ(r, 7), u2 = NZ(r, 7); return u1 === u2 || k === u1 || k === u2 ? null : [k, u1, u2]; });
          const A = same === "y" ? [u1, k] : [k, u1], B = same === "y" ? [u2, k] : [k, u2];
          const good = HV(same, k);
          const cand = same === "y" ? [HV("x", k), HV("y", u1), HV("x", u1), HV("x", u2), HV("y", u2)] : [HV("y", k), HV("x", u1), HV("y", u1), HV("y", u2), HV("x", u2)];
          return {
            q: `2点 ${PT(A)}、${PT(B)} を通る直線の式は、次のうちどれか。`,
            ans: good,
            choices: choices4(r, good, shuffle(r, cand).slice(0, 3)),
            hint: "2点の座標をくらべよう。$x$ 座標と $y$ 座標の、どちらが等しい？",
            steps: same === "y"
              ? [`2点の $y$ 座標が ${k} で等しいので、$x$ 軸に平行な直線。`, `式は ${good}。`]
              : [`2点の $x$ 座標が ${k} で等しいので、$y$ 軸に平行な直線。`, `式は ${good}。`],
          };
        }),
        // 12d04 4つの直線で囲まれた長方形の面積
        t("12d04", (r) => {
          const [x1, x2, y1, y2] = rectCase(r);
          return {
            q: `4つの直線 ${shuffle(r, [HV("x", x1), HV("x", x2), HV("y", y1), HV("y", y2)]).join("、")} で囲まれた長方形の面積は？（座標の 1 目もりを 1cm とする。）`,
            ans: (x2 - x1) * (y2 - y1),
            unit: "cm²",
            hint: "$x=$ の直線 2本の間の長さが、長方形の横。$y=$ の直線 2本の間は？",
            steps: rectSteps(x1, x2, y1, y2),
          };
        }),
        // 12q01a 小テスト（1）方程式のグラフはどんな直線か（4択。2y+4＝0 のような形も）
        t("12q01a", (r) => {
          const v = pick(r, ["x", "y"]), val = NZ(r, 6), form = pick(r, ["plain", "A", "B", "B"]);
          const e = hvEq(r, v, val, form);
          const good = v === "y" ? descr("x", [0, val]) : descr("y", [val, 0]);
          const wrongs = v === "y"
            ? [descr("x", [val, 0]), descr("y", [0, val]), descr("y", [val, 0])]
            : [descr("y", [0, val]), descr("x", [val, 0]), descr("x", [0, val])];
          return {
            q: `方程式 ${TX(e.tex)} のグラフについて、正しいものは次のうちどれか。`,
            ans: good,
            choices: choices4(r, good, wrongs),
            hint: form === "plain" ? `${HV(v, val)} をみたす点では、${v === "y" ? "$y$" : "$x$"} の値はいくつ？` : `まず、${TX(`${v}=${v === "y" ? "k" : "h"}`)} の形に直してみよう。`,
            steps: [...e.steps, v === "y" ? `${HV("y", val)} のグラフは、$x$ 軸に平行で、点 ${PT([0, val])} を通る直線。` : `${HV("x", val)} のグラフは、$y$ 軸に平行で、点 ${PT([val, 0])} を通る直線。`],
          };
        }),
        // 12q01b 小テスト（1）グラフが軸と交わる点の座標
        t("12q01b", (r) => {
          const v = pick(r, ["x", "y"]), val = NZ(r, 7), form = pick(r, ["plain", "A", "B"]);
          const e = hvEq(r, v, val, form);
          return {
            q: v === "y"
              ? `方程式 ${TX(e.tex)} のグラフが $y$ 軸と交わる点の $y$ 座標は？`
              : `方程式 ${TX(e.tex)} のグラフが $x$ 軸と交わる点の $x$ 座標は？`,
            ans: val,
            hint: v === "y" ? "グラフはどんな直線？ $y$ 軸と交わる点の $x$ 座標は？" : "グラフはどんな直線？ $x$ 軸と交わる点の $y$ 座標は？",
            steps: [...e.steps, v === "y" ? `${HV("y", val)} のグラフは $x$ 軸に平行な直線で、$y$ 軸と点 ${PT([0, val])} で交わる。` : `${HV("x", val)} のグラフは $y$ 軸に平行な直線で、$x$ 軸と点 ${PT([val, 0])} で交わる。`],
          };
        }),
        // 12q02a 小テスト（2）点を通る x 軸に平行な直線と y 軸に平行な直線（4択）
        t("12q02a", (r) => {
          const [p, q] = tryGen(() => { const p = NZ(r, 6), q = NZ(r, 6); return p === q ? null : [p, q]; });
          const T = (a, b) => `$x$ 軸に平行な直線は ${HV(a[0], a[1])}、$y$ 軸に平行な直線は ${HV(b[0], b[1])}`;
          const good = T(["y", q], ["x", p]);
          const wrongs = [T(["x", p], ["y", q]), T(["y", p], ["x", q]), T(["x", q], ["y", p])];
          return {
            q: `点 ${PT([p, q])} を通る、$x$ 軸に平行な直線と $y$ 軸に平行な直線の式の組は、次のうちどれか。`,
            ans: good,
            choices: choices4(r, good, wrongs),
            hint: `$x$ 軸に平行な直線は $y$ 座標が、$y$ 軸に平行な直線は $x$ 座標が、それぞれ一定。通る点の座標のどちらを使う？`,
            steps: [`$x$ 軸に平行な直線は、$y$ 座標がいつも同じ。${PT([p, q])} の $y$ 座標は ${q} なので ${HV("y", q)}。`, `$y$ 軸に平行な直線は、$x$ 座標がいつも同じ。${PT([p, q])} の $x$ 座標は ${p} なので ${HV("x", p)}。`],
          };
        }),
        // 12q02b 小テスト（2）点を通り、軸に平行な直線 y＝k（または x＝h）の値
        t("12q02b", (r) => {
          const [p, q] = tryGen(() => { const p = NZ(r, 8), q = NZ(r, 8); return p === q ? null : [p, q]; });
          const par = pick(r, ["x", "y"]);
          return {
            q: par === "x"
              ? `点 ${PT([p, q])} を通り、$x$ 軸に平行な直線の式は $y=k$ になる。$k$ の値は？`
              : `点 ${PT([p, q])} を通り、$y$ 軸に平行な直線の式は $x=h$ になる。$h$ の値は？`,
            ans: par === "x" ? q : p,
            hint: par === "x" ? "$x$ 軸に平行な直線上の点は、どの座標がどれも同じ？" : "$y$ 軸に平行な直線上の点は、どの座標がどれも同じ？",
            steps: par === "x"
              ? [`$x$ 軸に平行な直線は、$y$ 座標がいつも同じ。${PT([p, q])} の $y$ 座標は ${q}。`, `式は ${HV("y", q)}。`]
              : [`$y$ 軸に平行な直線は、$x$ 座標がいつも同じ。${PT([p, q])} の $x$ 座標は ${p}。`, `式は ${HV("x", p)}。`],
          };
        }),
        // 12q03 小テスト（3）長方形の面積
        t("12q03", (r) => {
          const [x1, x2, y1, y2] = rectCase(r);
          return {
            q: `4つの直線 ${shuffle(r, [HV("x", x1), HV("x", x2), HV("y", y1), HV("y", y2)]).join("、")} で囲まれた長方形の面積を求めよう。（座標の 1 目もりを 1cm とする。）`,
            ans: (x2 - x1) * (y2 - y1),
            unit: "cm²",
            hint: "長方形の横と縦は、それぞれ、どの 2本の直線の間の長さ？",
            steps: rectSteps(x1, x2, y1, y2),
          };
        }),
      ],
      // ───────── 3 応用 ─────────
      3: [
        // 12d05 長方形の面積から、a の値
        t("12d05", (r) => {
          const c5 = d05Case(r);
          if (!c5) return { skip: true };
          const { v, name, k1, k2, side, w, h, S, ans, lines } = c5;
          const Wt = side > 0 ? lin(1, -k1, name) : `${qt(k1)}-${name}`;   // a−k1（k1 が負なら a+|k1|）／ k1−a
          return {
            q: `4つの直線 ${shuffle(r, lines).join("、")} で囲まれた長方形の面積が ${S}cm² であるとき、$${name}$ の値は？ただし、$${name}$ は $${qt(k1)}$ より${side > 0 ? "大きい" : "小さい"}。（座標の 1 目もりを 1cm とする。）`,
            ans,
            hint: `長方形の面積は、横の長さ×縦の長さ。はじめから決まっているほうの長さは、いくつ？ もう一方を、${name} を使った式で表せるかな？`,
            steps: [
              `${v === "x" ? "横" : "縦"}の長さは ${TX(Wt)}（cm）、${v === "x" ? "縦" : "横"}の長さは ${TX(`${qt(k2.b)}-${P(k2.a)}=${h}`)}（cm）。`,
              `${TX(`(${Wt})\\times ${h}=${S}`)}`,
              `${TX(`${Wt}=${w}`)}、${TX(`${name}=${ans}`)}。`,
            ],
          };
        }),
        // 12d06a 点 P(2a−1, a+3) が直線 x＝5 の上：a
        t("12d06a", (r) => {
          const c = d06Case(r, "x");
          if (!c) return { skip: true };
          return {
            q: `点 ${TX(`P(${c.e1}, ${c.e2})`)} が直線 ${HV("x", c.h)} の上にある。$a$ の値は？`,
            ans: c.val,
            hint: "直線 $x=h$ の上にある点は、$x$ 座標がどれも同じ。点 P の $x$ 座標は、どんな式？",
            steps: [`P は直線 ${HV("x", c.h)} の上にあるので、$x$ 座標が ${c.h}。`, `${TX(`${c.e1}=${c.h}`)}　${solveVar(c.m, c.nm, c.h - c.k)}。`],
          };
        }),
        // 12d06b 点 Q(b+1, 3b−2) が直線 y＝4 の上：b
        t("12d06b", (r) => {
          const c = d06Case(r, "y");
          if (!c) return { skip: true };
          return {
            q: `点 ${TX(`Q(${c.e2}, ${c.e1})`)} が直線 ${HV("y", c.h)} の上にある。$b$ の値は？`,
            ans: c.val,
            hint: "直線 $y=k$ の上にある点は、$y$ 座標がどれも同じ。点 Q の $y$ 座標は、どんな式？",
            steps: [`Q は直線 ${HV("y", c.h)} の上にあるので、$y$ 座標が ${c.h}。`, `${TX(`${c.e1}=${c.h}`)}　${solveVar(c.m, c.nm, c.h - c.k)}。`],
          };
        }),
      ],
      // ───────── 4 入試レベル ─────────
      4: [
        // 12d07a 2点を通る直線が y 軸に平行：a
        t("12d07a", (r) => {
          const c = d07Case(r, "x");
          if (!c) return { skip: true };
          return {
            q: `2点 ${TX(`A(${c.eA}, ${c.yA})`)}、${TX(`B(${c.eB}, ${c.yB})`)} を通る直線が、$y$ 軸に平行であるとき、$a$ の値は？`,
            ans: c.val,
            hint: "$y$ 軸に平行な直線上の点は、どの座標がどれも同じ？ 2点 A、B で、その座標をくらべると？",
            steps: d07Steps(c),
          };
        }),
        // 12d07b 2点を通る直線が y 軸に平行：直線の式（4択）
        t("12d07b", (r) => {
          const c = d07Case(r, "x");
          if (!c) return { skip: true };
          const good = HV("x", c.h);
          const cand = [HV("y", c.h), HV("x", c.yA), HV("x", c.yB), HV("y", c.yA), HV("y", c.yB)];
          const wrongs = [], seen = new Set([good]);
          for (const w of shuffle(r, cand)) { if (!seen.has(w)) { seen.add(w); wrongs.push(w); } }
          return {
            q: `2点 ${TX(`A(${c.eA}, ${c.yA})`)}、${TX(`B(${c.eB}, ${c.yB})`)} を通る直線が、$y$ 軸に平行であるとき、この直線の式は、次のうちどれか。`,
            ans: good,
            choices: choices4(r, good, wrongs),
            hint: "まず、$a$ の値を求めよう。$a$ がわかれば、2点の座標が決まる。",
            steps: [...d07Steps(c), `$y$ 軸に平行なので、式は ${good}。`],
          };
        }),
        // 12d07c 2点を通る直線が x 軸に平行：b
        t("12d07c", (r) => {
          const c = d07Case(r, "y");
          if (!c) return { skip: true };
          return {
            q: `2点 ${TX(`C(${c.xC}, ${c.eC})`)}、${TX(`D(${c.xD}, ${c.eD})`)} を通る直線が、$x$ 軸に平行であるとき、$b$ の値は？`,
            ans: c.val,
            hint: "$x$ 軸に平行な直線上の点は、どの座標がどれも同じ？ 2点 C、D で、その座標をくらべると？",
            steps: d07Steps(c),
          };
        }),
        // 12d07d 2点を通る直線が x 軸に平行：直線の式 y＝k の k
        t("12d07d", (r) => {
          const c = d07Case(r, "y");
          if (!c) return { skip: true };
          return {
            q: `2点 ${TX(`C(${c.xC}, ${c.eC})`)}、${TX(`D(${c.xD}, ${c.eD})`)} を通る直線が、$x$ 軸に平行であるとき、この直線の式 $y=k$ の $k$ の値は？`,
            ans: c.h,
            hint: "まず、$b$ の値を求めよう。$b$ がわかれば、2点の座標が決まる。",
            steps: [...d07Steps(c), `$x$ 軸に平行なので、式は ${HV("y", c.h)}。`],
          };
        }),
        // 12d08 3つの直線 y＝(分数)x、y＝k、x＝0 で囲まれた三角形の面積
        t("12d08", (r) => {
          const c = tryGen(() => {
            const xb = r(2, 8), k = r(2, 9) * pick(r, [1, 1, -1]), sx = pick(r, [1, 1, -1]);
            return (xb * Math.abs(k)) % 2 !== 0 ? null : { xb, k, sx };
          });
          const a = Q(c.k, c.sx * c.xb), L = line(a, 0), area = (c.xb * Math.abs(c.k)) / 2, vx = c.sx * c.xb;
          return {
            q: `3つの直線 ${shuffle(r, [TX(ltex(L)), HV("y", c.k), HV("x", 0)]).join("、")} で囲まれた三角形の面積は？（座標の 1 目もりを 1cm とする。）`,
            ans: area,
            unit: "cm²",
            hint: "3つの頂点はどこ？ 直線どうしの交点を、ひとつずつ求めてみよう。",
            steps: [
              `${TX(ltex(L))} と ${HV("y", c.k)} の交点は、${TX(`${c.k}=${ltex(L).slice(2)}`)} より ${TX(`x=${vx}`)} で ${PT([vx, c.k])}。`,
              `3つの頂点は ${PT([0, 0])}、${PT([0, c.k])}、${PT([vx, c.k])}。`,
              `底辺（$x=0$ 上）の長さ ${Math.abs(c.k)}、高さ ${c.xb} なので、${TX(`\\frac{1}{2}\\times ${Math.abs(c.k)}\\times ${c.xb}=${area}`)}（cm²）`,
            ],
          };
        }),
        // 12q04 小テスト（チャレンジ）y＝x、y＝5、x＝−1 で囲まれた三角形の面積
        t("12q04", (r) => {
          const c = tryGen(() => {
            const a = pick(r, [Q(1), Q(1), Q(-1), Q(2), Q(-2), Q(1, 2), Q(-1, 2), Q(3)]), k = NZ(r, 8), h = NZ(r, 6);
            const x1 = qdiv(Q(k), a), y2 = qmul(a, Q(h));
            if (!qisint(x1) || !qisint(y2) || x1[0] === h || y2[0] === k) return null;
            const area = triArea([x1, Q(k)], [Q(h), y2], [Q(h), Q(k)]);
            return qisint(area) && area[0] <= 40 ? { a, k, h, V1: [x1[0], k], V2: [h, y2[0]], V3: [h, k], area } : null;
          });
          const L = line(c.a, 0), legV = Math.abs(c.k - c.V2[1]), legH = Math.abs(c.V1[0] - c.h);
          return {
            q: `3つの直線 ${shuffle(r, [TX(ltex(L)), HV("y", c.k), HV("x", c.h)]).join("、")} で囲まれた三角形の面積を求めよう。（座標の 1 目もりを 1cm とする。）`,
            ans: num(c.area),
            unit: "cm²",
            hint: "3つの頂点を求めよう。どの 2本の直線の交点が、頂点になる？",
            steps: [
              `${TX(ltex(L))} と ${HV("y", c.k)} の交点は ${PT(c.V1)}。${TX(ltex(L))} と ${HV("x", c.h)} の交点は ${PT(c.V2)}。`,
              `${HV("y", c.k)} と ${HV("x", c.h)} の交点は ${PT(c.V3)}。`,
              `直角をはさむ 2辺の長さは、${HV("x", c.h)} 上の辺が ${TX(diff(c.k, c.V2[1]))}、${HV("y", c.k)} 上の辺が ${TX(diff(c.V1[0], c.h))}。`,
              `${TX(`\\frac{1}{2}\\times ${legV}\\times ${legH}=${qt(c.area)}`)}（cm²）`,
            ],
          };
        }),
      ],
    },
  }),
];

/** 大きいほう−小さいほう＝長さ（2つの座標の間の長さ） */
const diff = (u, v) => `${Math.max(u, v)}-${P(Math.min(u, v))}=${Math.abs(u - v)}`;

// ── 長方形：x＝x1、x＝x2、y＝y1、y＝y2（x1＜x2、y1＜y2）─────────────────────
function rectCase(r) {
  return tryGen(() => {
    const x1 = r(-5, 3), x2 = x1 + r(2, 7), y1 = r(-4, 2), y2 = y1 + r(2, 6);
    return x1 === x2 || y1 === y2 || (x2 - x1) * (y2 - y1) > 40 ? null : [x1, x2, y1, y2];
  });
}
function rectSteps(x1, x2, y1, y2) {
  return [
    `横の長さは ${TX(`${x2}-${P(x1)}=${x2 - x1}`)}（cm）、縦の長さは ${TX(`${y2}-${P(y1)}=${y2 - y1}`)}（cm）。`,
    `${TX(`${x2 - x1}\\times ${y2 - y1}=${(x2 - x1) * (y2 - y1)}`)}（cm²）`,
  ];
}

// ── dr.5：x＝−1、x＝a、y＝1、y＝4 で囲まれた長方形の面積が S のとき a ─────────────
//   未知の直線は x＝a（横の長さが a−(−1)）か y＝b（縦の長さが b−1）。k1 は既知の同じ向きの直線、side は未知が大きい側(+1)か小さい側(−1)
function d05Case(r) {
  return tryGen(() => {
    const v = pick(r, ["x", "y"]), name = v === "x" ? "a" : "b", side = pick(r, [1, -1]);
    const k1 = r(-5, 4), w = r(2, 8), ans = k1 + side * w;                       // 未知の直線の位置（未知 − k1 の絶対値が w）
    const o1 = r(-4, 2), h = r(2, 6), o2 = o1 + h, S = w * h;                    // もう一方の向きの 2 直線
    if (ans === 0 || k1 === 0 || S > 60) return null;
    const other = v === "x" ? "y" : "x";
    const lines = [HV(v, k1), TX(`${v}=${name}`), HV(other, o1), HV(other, o2)];
    return { v, name, k1, k2: { a: o1, b: o2 }, side, w, h, S, ans, lines };
  });
}

// ── dr.6：P(2a−1, a+3) が直線 x＝5 の上（e1 が上にある座標の式、e2 はもう一方の座標の式）──────
function d06Case(r, which) {
  const nm = which === "x" ? "a" : "b";
  return tryGen(() => {
    const val = rnz(r, -4, 6), m = pick(r, [1, 2, 3, 4, -1, -2, -3]), k = NZ(r, 6);
    const h = m * val + k, n = pick(r, [1, 2, 3, -1, -2]), l = NZ(r, 5);
    if (h === 0 || Math.abs(h) > 14 || n === m) return null;
    return { nm, val, m, k, h, e1: lin(m, k, nm), e2: lin(n, l, nm) };
  });
}

// ── dr.7：A(a+2, 4)、B(3a−4, 9) が y 軸に平行（x 座標が等しい）／C(1, 2b+3)、D(6, b−1) が x 軸に平行（y 座標が等しい）──
function d07Case(r, which) {
  return tryGen(() => {
    const val = rnz(r, -3, 6), nm = which === "x" ? "a" : "b";
    const p1 = pick(r, [1, 2, 3, -1, -2]), p2 = pick(r, [1, 2, 3, 4, -1, -2, -3]), k1 = NZ(r, 6);
    if (p1 === p2) return null;
    const k2 = (p1 - p2) * val + k1, h = p1 * val + k1;
    if (k2 === 0 || Math.abs(k2) > 9 || h === 0 || Math.abs(h) > 14) return null;
    const o1 = NZ(r, 9), o2 = NZ(r, 9);
    if (o1 === o2) return null;
    const e1 = lin(p1, k1, nm), e2 = lin(p2, k2, nm);
    return which === "x"
      ? { which, nm, val, h, p1, p2, k1, k2, eA: e1, eB: e2, yA: o1, yB: o2 }
      : { which, nm, val, h, p1, p2, k1, k2, eC: e1, eD: e2, xC: o1, xD: o2 };
  });
}
function d07Steps(c) {
  const [e1, e2] = c.which === "x" ? [c.eA, c.eB] : [c.eC, c.eD];
  const par = c.which === "x" ? "$y$ 軸" : "$x$ 軸", co = c.which === "x" ? "$x$" : "$y$";
  return [
    `${par}に平行な直線上の2点は、${co}座標が等しい。${TX(`${e1}=${e2}`)}。`,
    `${solveVar(c.p1 - c.p2, c.nm, c.k2 - c.k1)}。`,
  ];
}

// 移さなかった問題はなし（図の読みとりは、通る点を文で言う形にした。dr.7 の「a の値と式」は、a の値（数）と式（4択）の 2 つに分けた）
export const SKIPPED = [];
