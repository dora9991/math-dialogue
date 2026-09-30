// ============================================================
// tpl/hs_func2.js — 高校 三角関数（数II）
//   trig_radian / trig_eq / trig_addition
//
//  すべて自作の数値・言い回し。特別な角の値は表から出し、Math.sin などの計算でも必ず検算する。
// ============================================================
import { num, choice, fields } from "../../core/items.js";
import { Q, add, sub, mul, div, neg, eq, num as qnum } from "../../core/rational.js";
import { tq } from "../../core/tex.js";
import { t, until, assert } from "./util.js";
import { nearly } from "./hs_util.js";
import { trigExact, radTex, VALUE_POOL, negV, V } from "./hs_trig.js";

const $ = (s) => `$${s}$`;
const rad = (d) => (d * Math.PI) / 180;
const FN_TEX = { sin: "\\sin", cos: "\\cos", tan: "\\tan" };
const valueOf = (fn, deg) => trigExact(deg)[fn];
const quadrantOf = (deg) => {
  const d = ((deg % 360) + 360) % 360;
  return d < 90 ? 1 : d < 180 ? 2 : d < 270 ? 3 : 4;
};

/** 誤答候補 [TeX, mc] を重複なしで選択肢にする */
function labels(list, correct) {
  const seen = new Set([correct]);
  const out = [];
  for (const [w, mc] of list) {
    if (seen.has(w)) continue;
    seen.add(w);
    out.push([$(w), mc]);
  }
  return out;
}

/** s の多項式 A s² + B s + C を、s を SIN/COS の TeX に置きかえて書く */
function quadInTrig(A, B, Cc, S) {
  const term = (k, body, first) => {
    if (k === 0) return "";
    const sign = k < 0 ? "-" : first ? "" : "+";
    const abs = Math.abs(k);
    return `${sign}${abs === 1 && body ? "" : abs}${body}`;
  };
  return `${term(A, `${S}^{2}\\theta`, true)}${term(B, `${S}\\theta`, A === 0)}${term(Cc, "", A === 0 && B === 0)}`;
}

/** 1 次式 a·s + b の TeX（s は文字。b=0 なら定数項を省く） */
const linS = (a, b) => `${a === 1 ? "" : a}s${b === 0 ? "" : b > 0 ? `+${b}` : b}`;
/** 2 次式 A s² + B s + C の TeX（s は文字） */
const polyS = (A, B, Cc) =>
  [[A, "s^{2}"], [B, "s"], [Cc, ""]]
    .filter(([k]) => k !== 0)
    .map(([k, body], i) => `${k < 0 ? "-" : i === 0 ? "" : "+"}${Math.abs(k) === 1 && body ? "" : Math.abs(k)}${body}`)
    .join("");
/** 因数 (a1 s + b1)(a2 s + b2) の組（s に sinθ, cosθ を入れると、解が単位円の上で見つかる値になる） */
const FACTOR_PAIRS = [
  [[2, 1], [1, -1]],
  [[2, -1], [1, 1]],
  [[2, 1], [1, 1]],
  [[2, -1], [1, -1]],
  [[2, 1], [2, -1]],
  [[1, 0], [2, 1]],
  [[1, 0], [2, -1]],
  [[1, 0], [1, -1]],
  [[1, 0], [1, 1]],
  [[1, 1], [1, -1]],
];
/** s の値（−b/a）の TeX */
const sValTex = (a, b) => (b === 0 ? "0" : `${b > 0 ? "-" : ""}${a === 1 ? `${Math.abs(b)}` : `\\frac{${Math.abs(b)}}{${a}}`}`);

export default {
  // ── 弧度法・三角関数の値 ─────────────────────
  trig_radian: [
    t("num", (r, lv) => {
      if (lv <= 2) {
        // 度 → π の何倍か
        const deg = r.pick(lv === 1 ? [30, 45, 60, 90, 120, 135, 180, 270, 360] : [150, 210, 225, 240, 300, 315, 330, 390, 540]);
        const k = Q(deg, 180);
        assert(Math.abs(qnum(k) * 180 - deg) < 1e-9, "度から弧度の検算");
        return num({
          q: `$${deg}^{\\circ}$ を弧度法で表すと、$\\square\\,\\pi$ ラジアンです。$\\square$ に入る数を求めなさい。（分数で答えます）`,
          ans: k,
          post: "π",
          reduced: true,
          wrongs: [[Q(180, deg), "MC-RADIAN-INVERT"], [Q(deg, 90), "MC-RADIAN-DEG"], [Q(deg, 360), "MC-RADIAN-DEG"], [Q(deg, 60), "MC-RADIAN-DEG"]],
          explain: `$180^{\\circ}=\\pi$ ラジアンです。$1^{\\circ}=\\dfrac{\\pi}{180}$ なので、$${deg}^{\\circ}=\\dfrac{${deg}}{180}\\pi=${tq(k)}\\pi$（約分して）。`,
        });
      }
      // ラジアン → 度
      const k = r.pick([Q(7, 6), Q(5, 4), Q(11, 6), Q(4, 3), Q(-1, 3), Q(-3, 4), Q(13, 6), Q(5, 3), Q(7, 4), Q(-5, 6)]);
      const deg = qnum(mul(k, Q(180)));
      assert(Number.isInteger(deg), "整数の度");
      return num({
        q: `$${radTex(k)}$ ラジアンは何度ですか。`,
        ans: deg,
        post: "度",
        wrongs: [[qnum(mul(k, Q(90))), "MC-RADIAN-DEG"], [qnum(mul(k, Q(360))), "MC-RADIAN-DEG"], [Math.round(180 / qnum(k)), "MC-RADIAN-INVERT"], [-deg, "MC-SLIP"]],
        explain: `$\\pi$ ラジアン $=180^{\\circ}$ なので、$\\pi$ を $180^{\\circ}$ に置きかえます。$${radTex(k)}\\to ${tq(k)}\\times 180^{\\circ}=${deg}^{\\circ}$。`,
      });
    }),
    t(
      "choice",
      (r, lv) => {
        // 特別な角の三角関数の値
        const fn = r.pick(["sin", "cos", "tan"]);
        let deg;
        let angleTex;
        if (lv === 1) {
          deg = r.pick([30, 45, 60]);
          angleTex = `${deg}^{\\circ}`;
        } else if (lv === 2) {
          deg = r.pick([120, 135, 150, 210, 225, 240, 300, 315, 330]);
          angleTex = `${deg}^{\\circ}`;
        } else {
          // 2π をこえる角・負の角（ラジアンで表示）
          deg = r.pick([30, 45, 60, 120, 135, 150, 210, 225, 240, 300, 315, 330]) + r.pick([360, -360, 720, -720]);
          angleTex = radTex(Q(deg, 180));
        }
        const v = valueOf(fn, deg);
        assert(v !== null, "値が定義される");
        const fl = fn === "sin" ? Math.sin(rad(deg)) : fn === "cos" ? Math.cos(rad(deg)) : Math.tan(rad(deg));
        nearly(v.val, fl, "三角関数の値の検算", 1e-9);
        const other = valueOf(fn === "sin" ? "cos" : "sin", deg);
        const swapMag = (w) => {
          const pos = w.val > 0;
          const m = Math.abs(w.val);
          const tbl = [[0.5, V.s32], [Math.sqrt(3) / 2, V.half], [Math.sqrt(3) / 3, V.t3], [Math.sqrt(3), V.t33]];
          const hit = tbl.find(([x]) => Math.abs(x - m) < 1e-9);
          return hit ? (pos ? hit[1] : negV(hit[1])) : null;
        };
        const cand = [
          [negV(v), "MC-TRIG-SIGN-QUADRANT"],
          [other && other.tex !== v.tex ? other : null, "MC-TRIG-SIN-COS-SWAP"],
          [swapMag(v), "MC-TRIG-VALUE-SWAP"],
        ]
          .filter(([w]) => w)
          .map(([w, mc]) => [w.tex, mc]);
        for (const w of r.shuffle(VALUE_POOL)) cand.push([w.tex, null]);
        return choice({
          q: `$${FN_TEX[fn]}\\,${angleTex}$ の値を求めなさい。`,
          correct: $(v.tex),
          wrongs: labels(cand, v.tex),
          explain: `単位円で考えます。$${angleTex}$ の動径は第${quadrantOf(deg)}象限にあり、基準角（$x$ 軸との角）で値を決めて符号をつけます。$${FN_TEX[fn]}\\,${angleTex}=${v.tex}$。（${fn === "sin" ? "$\\sin$ は $y$ 座標" : fn === "cos" ? "$\\cos$ は $x$ 座標" : "$\\tan$ は $y/x$"}）`,
        });
      },
      { id: "b", db: 0.1 },
    ),
    t(
      "num",
      (r, lv) => {
        // 弧の長さ・おうぎ形の面積（ラジアン）。答えは π の係数
        const rr = r.pick([2, 3, 4, 6, 8, 9, 12]);
        const thetaK = lv === 1 ? r.pick([Q(1, 2), Q(1, 3), Q(2, 3), Q(1, 4), Q(1, 6), Q(3, 2)]) : r.pick([Q(1, 3), Q(2, 3), Q(3, 4), Q(5, 6), Q(5, 4), Q(7, 6), Q(3, 2)]);
        const deg = qnum(mul(thetaK, Q(180)));
        if (lv <= 2) {
          const isArc = lv === 1 || r.chance(0.5);
          const ans = isArc ? mul(Q(rr), thetaK) : mul(Q(rr * rr, 2), thetaK);
          // 独立な検算：度数法の公式(2π r × deg/360, π r² × deg/360)と一致
          const viaDeg = isArc ? Q(2 * rr * deg, 360) : Q(rr * rr * deg, 360);
          assert(eq(ans, viaDeg), "弧・面積の検算");
          return num({
            q: `半径 $${rr}$、中心角 $${radTex(thetaK)}$ ラジアンのおうぎ形の${isArc ? "弧の長さ" : "面積"}は $\\square\\,\\pi$ です。$\\square$ に入る数を求めなさい。`,
            ans,
            post: "π",
            reduced: true,
            wrongs: isArc
              ? [[mul(Q(rr * rr, 2), thetaK), "MC-RADIAN-ARC-AREA"], [mul(Q(rr), div(thetaK, Q(2))), "MC-RADIAN-ARC-AREA"], [mul(Q(2 * rr), thetaK), "MC-RADIAN-ARC-AREA"]]
              : [[mul(Q(rr), thetaK), "MC-RADIAN-ARC-AREA"], [mul(Q(rr * rr), thetaK), "MC-RADIAN-ARC-AREA"], [mul(Q(rr, 2), thetaK), "MC-RADIAN-ARC-AREA"]],
            explain: isArc ? `弧の長さは $l=r\\theta$（$\\theta$ はラジアン）。$${rr}\\times ${radTex(thetaK)}=${tq(ans)}\\pi$。` : `おうぎ形の面積は $S=\\dfrac12 r^2\\theta$。$\\dfrac12\\times ${rr}^2\\times ${radTex(thetaK)}=${tq(ans)}\\pi$。`,
          });
        }
        // 弧の長さと半径から中心角（π の何倍か）
        const l = mul(Q(rr), thetaK);
        return num({
          q: `半径 $${rr}$、弧の長さ $${tq(l)}\\pi$ のおうぎ形の中心角は、$\\square\\,\\pi$ ラジアンです。$\\square$ に入る数を求めなさい。`,
          ans: thetaK,
          post: "π",
          reduced: true,
          wrongs: [[mul(thetaK, Q(rr)), "MC-RADIAN-ARC-AREA"], [div(thetaK, Q(2)), "MC-RADIAN-ARC-AREA"], [mul(thetaK, Q(2)), "MC-RADIAN-ARC-AREA"], [div(Q(1), thetaK), "MC-RADIAN-INVERT"]],
          explain: `弧の長さ $l=r\\theta$ より $\\theta=\\dfrac{l}{r}=\\dfrac{${tq(l)}\\pi}{${rr}}=${tq(thetaK)}\\pi$。`,
        });
      },
      { id: "c", db: 0.15 },
    ),
  ],

  // ── 三角関数の方程式・不等式 ───────────────────
  trig_eq: [
    t("fields", (r, lv) => {
      // 0° ≤ θ < 360° の解を、整数の度の全数チェックで求める
      const solsOf = (f) => {
        const out = [];
        for (let d = 0; d < 360; d++) if (Math.abs(f(rad(d))) < 1e-9) out.push(d);
        return out;
      };
      let eqTex;
      let f;
      let expl;
      if (lv === 1) {
        const fn = r.pick(["sin", "cos"]);
        const [vTex, val] = r.pick([["\\frac{1}{2}", 0.5], ["\\frac{\\sqrt{2}}{2}", Math.SQRT2 / 2], ["\\frac{\\sqrt{3}}{2}", Math.sqrt(3) / 2], ["-\\frac{1}{2}", -0.5], ["-\\frac{\\sqrt{2}}{2}", -Math.SQRT2 / 2], ["-\\frac{\\sqrt{3}}{2}", -Math.sqrt(3) / 2]]);
        eqTex = `${FN_TEX[fn]}\\theta=${vTex}`;
        f = (x) => (fn === "sin" ? Math.sin(x) : Math.cos(x)) - val;
        expl = `単位円で、${fn === "sin" ? "$y$ 座標が" : "$x$ 座標が"} $${vTex}$ になる点を探します。`;
      } else if (lv === 2 && r.chance(0.5)) {
        const fn = r.pick(["sin", "cos"]);
        const b = r.pick([-1, 1]);
        eqTex = `2${FN_TEX[fn]}\\theta${b < 0 ? "-" : "+"}1=0`;
        f = (x) => 2 * (fn === "sin" ? Math.sin(x) : Math.cos(x)) + b;
        expl = `$${eqTex}$ を $${FN_TEX[fn]}\\theta=${b < 0 ? "\\frac{1}{2}" : "-\\frac{1}{2}"}$ に直して、単位円で探します。`;
      } else if (lv === 2) {
        const [vTex, val] = r.pick([["1", 1], ["-1", -1], ["\\sqrt{3}", Math.sqrt(3)], ["-\\sqrt{3}", -Math.sqrt(3)], ["\\frac{\\sqrt{3}}{3}", Math.sqrt(3) / 3], ["-\\frac{\\sqrt{3}}{3}", -Math.sqrt(3) / 3]]);
        eqTex = `\\tan\\theta=${vTex}`;
        f = (x) => (Math.abs(Math.cos(x)) < 1e-12 ? NaN : Math.tan(x) - val);
        expl = `$\\tan\\theta$ は原点と円周上の点を結ぶ直線の傾き。傾きが $${vTex}$ になる直線は、円の反対側の点（$180^{\\circ}$ ちがい）も通ります。`;
      } else {
        // (a1 s + b1)(a2 s + b2) = 0 の形の2次式（s は sinθ または cosθ）
        const fn = r.pick(["sin", "cos"]);
        const [[a1, b1], [a2, b2]] = r.pick(FACTOR_PAIRS);
        const A = a1 * a2;
        const B = a1 * b2 + a2 * b1;
        const Cc = b1 * b2;
        const S = FN_TEX[fn];
        eqTex = `${quadInTrig(A, B, Cc, S)}=0`;
        f = (x) => {
          const s = fn === "sin" ? Math.sin(x) : Math.cos(x);
          return (a1 * s + b1) * (a2 * s + b2);
        };
        expl = `$${S}\\theta=s$ とおくと $${polyS(A, B, Cc)}=(${linS(a1, b1)})(${linS(a2, b2)})=0$ より $s=${sValTex(a1, b1)}$ または $s=${sValTex(a2, b2)}$。それぞれ $${S}\\theta$ の値にもどして単位円で探します。`;
      }
      const ans = solsOf(f);
      assert(ans.length >= 2 && ans.length <= 4, `解の個数 ${ans.length}`);
      const ids = ans.map((_, i) => `x${i + 1}`);
      const shifted = ans.map((d) => (d + 180) % 360);
      const flipped = ans.map((d) => (360 - d) % 360);
      return fields({
        q: `$0^{\\circ}\\le\\theta<360^{\\circ}$ のとき、方程式 $${eqTex}$ の解をすべて求めなさい。（度で答えます）`,
        orderFree: true,
        fields: ans.map((d, i) => ({ id: ids[i], value: d, pre: "$\\theta=$", post: "$^{\\circ}$" })),
        wrongs: [
          { values: Object.fromEntries(ids.map((id, i) => [id, shifted[i]])), mc: "MC-TRIGEQ-QUADRANT" },
          { values: Object.fromEntries(ids.map((id, i) => [id, flipped[i]])), mc: "MC-TRIGEQ-QUADRANT" },
          { values: Object.fromEntries(ids.map((id, i) => [id, i === ids.length - 1 ? ans[0] : ans[i]])), mc: "MC-TRIGEQ-ONE-SOLUTION" },
        ],
        explain: `${expl}$0^{\\circ}\\le\\theta<360^{\\circ}$ の範囲でそのような角は $${ans.map((d) => `${d}^{\\circ}`).join(",\\ ")}$。（ひとつだけ見つけて終わりにしない：単位円では対称な位置にもう1つあることが多い）`,
      });
    }),
    t(
      "num",
      (r, lv) => {
        // 解の個数・解の和（0° ≤ θ < 360°）。2θ の問題では 22.5° などが出るので 0.5° きざみで調べる
        const solsOf = (f) => {
          const out = [];
          for (let d2 = 0; d2 < 720; d2++) if (Math.abs(f(rad(d2 / 2))) < 1e-9) out.push(d2 / 2);
          return out;
        };
        if (lv <= 2) {
          const fn = r.pick(["sin", "cos", "tan"]);
          const cases = fn === "tan" ? [["1", 1], ["\\sqrt{3}", Math.sqrt(3)], ["-\\sqrt{3}", -Math.sqrt(3)]] : lv === 1 ? [["\\frac{1}{2}", 0.5], ["-\\frac{\\sqrt{2}}{2}", -Math.SQRT2 / 2], ["1", 1], ["-1", -1], ["0", 0]] : [["\\frac{1}{2}", 0.5], ["-\\frac{\\sqrt{3}}{2}", -Math.sqrt(3) / 2], ["\\frac{\\sqrt{2}}{2}", Math.SQRT2 / 2]];
          const [vTex, val] = r.pick(cases);
          const at = (x, k) => {
            const y = k * x;
            return fn === "sin" ? Math.sin(y) : fn === "cos" ? Math.cos(y) : Math.abs(Math.cos(y)) < 1e-12 ? NaN : Math.tan(y);
          };
          const k = lv === 1 ? 1 : 2;
          const ans = solsOf((x) => at(x, k) - val).length;
          if (lv === 2) assert(ans === 4, "2θ の解の個数は4");
          const arg = k === 1 ? "\\theta" : "2\\theta";
          return num({
            q: `$0\\le\\theta<2\\pi$ のとき、方程式 $${FN_TEX[fn]}\\,${arg}=${vTex}$ の解は何個ありますか。`,
            ans,
            wrongs: lv === 1 ? [[ans === 1 ? 2 : 1, "MC-TRIGEQ-ONE-SOLUTION"], [ans + 1, "MC-SLIP"], [ans === 2 ? 4 : 2, "MC-TRIGEQ-QUADRANT"]] : [[2, "MC-TRIGEQ-RANGE"], [3, "MC-SLIP"], [1, "MC-TRIGEQ-RANGE"], [8, "MC-SLIP"]],
            explain:
              lv === 1
                ? `単位円で数えます。${fn === "tan" ? "$\\tan\\theta$ は傾きなので、同じ値になる点は原点をはさんで2つ。" : `${fn === "sin" ? "$y$ 座標" : "$x$ 座標"}が $${vTex}$ になる点の数を調べると、`}$0\\le\\theta<2\\pi$ で解は $${ans}$ 個。${Math.abs(val) === 1 && fn !== "tan" ? "（値が $\\pm 1$ のときは点がひとつだけ）" : ""}`
                : `$2\\theta=t$ とおくと、$\\theta$ の範囲 $0\\le\\theta<2\\pi$ は $0\\le t<4\\pi$（2周分）になります。$${FN_TEX[fn]}\\,t=${vTex}$ は1周に2個ずつ解があるので、2周で $4$ 個。（範囲を広げるのを忘れて2個としない）`,
          });
        }
        // 2次式：解の和
        const fn = r.pick(["sin", "cos"]);
        const S = FN_TEX[fn];
        const [[a1, b1], [a2, b2]] = r.pick(FACTOR_PAIRS);
        const A = a1 * a2;
        const B = a1 * b2 + a2 * b1;
        const Cc = b1 * b2;
        const list = solsOf((x) => {
          const sv = fn === "sin" ? Math.sin(x) : Math.cos(x);
          return (a1 * sv + b1) * (a2 * sv + b2);
        });
        const sum = list.reduce((a, b) => a + b, 0);
        return num({
          q: `$0^{\\circ}\\le\\theta<360^{\\circ}$ のとき、方程式 $${quadInTrig(A, B, Cc, S)}=0$ のすべての解の和を、度で求めなさい。`,
          ans: sum,
          post: "度",
          wrongs: [[sum - list[0], "MC-TRIGEQ-ONE-SOLUTION"], [sum - list[list.length - 1], "MC-TRIGEQ-ONE-SOLUTION"], [sum + 360, "MC-SLIP"], [720 - sum, "MC-SLIP"]],
          explain: `$${S}\\theta=s$ とおくと $${polyS(A, B, Cc)}=(${linS(a1, b1)})(${linS(a2, b2)})=0$ より $${S}\\theta=${sValTex(a1, b1)}$ または $${S}\\theta=${sValTex(a2, b2)}$。単位円で探すと $\\theta=${list.map((d) => `${d}^{\\circ}`).join(",\\ ")}$。和は $${list.join("+")}=${sum}$。（どちらの値についても、単位円の上のすべての解を数える）`,
        });
      },
      { id: "b", db: 0.15 },
    ),
    t(
      "choice",
      (r, lv) => {
        // 三角不等式（0 ≤ θ < 2π）：解を区間で
        const fn = r.pick(["sin", "cos"]);
        const cases = lv === 1 ? [[0.5, "\\frac{1}{2}"], [Math.SQRT2 / 2, "\\frac{\\sqrt{2}}{2}"], [Math.sqrt(3) / 2, "\\frac{\\sqrt{3}}{2}"]] : [[-0.5, "-\\frac{1}{2}"], [-Math.SQRT2 / 2, "-\\frac{\\sqrt{2}}{2}"], [-Math.sqrt(3) / 2, "-\\frac{\\sqrt{3}}{2}"], [0.5, "\\frac{1}{2}"]];
        const [val, vTex] = r.pick(cases);
        const op = lv === 1 ? r.pick(["<", ">"]) : r.pick(["<", ">", "<=", ">="]);
        const F = (which, x) => (which === "sin" ? Math.sin(x) : Math.cos(x));
        const holdsAt = (o, y, v) => (o === "<" ? y < v - 1e-12 : o === ">" ? y > v + 1e-12 : o === "<=" ? y <= v + 1e-12 : y >= v - 1e-12);
        const isClosed = (o) => o === "<=" || o === ">=";
        // 整数の度で調べて、連続した区間にまとめる
        const runsOf = (which, o, v) => {
          const runs = [];
          let s = -1;
          for (let d = 0; d <= 360; d++) {
            const on = d < 360 && holdsAt(o, F(which, rad(d)), v);
            if (on && s < 0) s = d;
            if (!on && s >= 0) {
              runs.push([s, d - 1]);
              s = -1;
            }
          }
          return runs;
        };
        const fmtRun = ([s, e], o) => {
          const cl = isClosed(o);
          const lo = s === 0 ? "0" : radTex(Q(cl ? s : s - 1, 180));
          const hi = e === 359 ? "2\\pi" : radTex(Q(cl ? e : e + 1, 180));
          return `${lo}${s === 0 || cl ? "\\le " : "<"}\\theta${e === 359 ? "<" : cl ? "\\le " : "<"}${hi}`;
        };
        const fmtSet = (runs, o) => (runs.length ? runs.map((rn) => fmtRun(rn, o)).join(",\\ ") : "\\text{解なし}");
        const runs = runsOf(fn, op, val);
        assert(runs.length >= 1 && runs.length <= 2, "区間の数");
        const correct = fmtSet(runs, op);
        const complement = { "<": ">=", ">": "<=", "<=": ">", ">=": "<" }[op];
        const edgeFlip = { "<": "<=", ">": ">=", "<=": "<", ">=": ">" }[op];
        const otherFn = fn === "sin" ? "cos" : "sin";
        const wrong = [
          [fmtSet(runsOf(fn, complement, val), complement), "MC-TRIGEQ-INEQ-DIRECTION"],
          [fmtSet(runsOf(fn, edgeFlip, val), edgeFlip), "MC-TRIGEQ-INEQ-EQUAL"],
          [fmtSet(runsOf(fn, op, -val), op), "MC-TRIGEQ-INEQ-SIGN"],
          [fmtSet(runsOf(otherFn, op, val), op), "MC-TRIG-SIN-COS-SWAP"],
        ];
        return choice({
          q: `$0\\le\\theta<2\\pi$ のとき、不等式 $${FN_TEX[fn]}\\theta${op === "<" ? "<" : op === ">" ? ">" : op === "<=" ? "\\le " : "\\ge "}${vTex}$ を解きなさい。`,
          correct: $(correct),
          wrongs: labels(wrong, correct),
          explain: `単位円で、${fn === "sin" ? "$y$ 座標" : "$x$ 座標"}が $${vTex}$ に等しくなる角の位置に印をつけ、${op === "<" || op === "<=" ? "小さい側" : "大きい側"}の弧を選びます。解は $${correct}$。（${isClosed(op) ? "≦・≧ なので、端の値も含める" : "＜・＞ なので、端の値は含めない"}）`,
        });
      },
      { id: "c", db: 0.4 },
    ),
  ],

  // ── 加法定理・倍角の公式 ───────────────────────
  trig_addition: [
    t("choice", (r, lv) => {
      // 15° の倍数の値を加法定理で
      const fn = r.pick(["sin", "cos", "tan"]);
      const deg = lv === 1 ? r.pick([75, 15]) : lv === 2 ? r.pick([75, 15, 105]) : r.pick([105, 165, 195, 255]);
      const target = fn === "sin" ? Math.sin(rad(deg)) : fn === "cos" ? Math.cos(rad(deg)) : Math.tan(rad(deg));
      const s6 = Math.sqrt(6);
      const s2 = Math.SQRT2;
      const s3 = Math.sqrt(3);
      const pool = [
        ["\\frac{\\sqrt{6}+\\sqrt{2}}{4}", (s6 + s2) / 4],
        ["\\frac{\\sqrt{6}-\\sqrt{2}}{4}", (s6 - s2) / 4],
        ["-\\frac{\\sqrt{6}+\\sqrt{2}}{4}", -(s6 + s2) / 4],
        ["-\\frac{\\sqrt{6}-\\sqrt{2}}{4}", -(s6 - s2) / 4],
        ["2+\\sqrt{3}", 2 + s3],
        ["2-\\sqrt{3}", 2 - s3],
        ["-2-\\sqrt{3}", -2 - s3],
        ["\\sqrt{3}-2", s3 - 2],
        ["\\frac{\\sqrt{6}+\\sqrt{2}}{2}", (s6 + s2) / 2],
        ["\\frac{\\sqrt{3}+1}{2}", (s3 + 1) / 2],
        ["\\frac{\\sqrt{3}-1}{2}", (s3 - 1) / 2],
        ["\\frac{1+\\sqrt{3}}{4}", (1 + s3) / 4],
      ];
      const found = pool.find(([, v]) => Math.abs(v - target) < 1e-9);
      assert(found, `値の表にない ${fn} ${deg}`);
      const others = pool.filter(([, v]) => Math.abs(v - target) >= 1e-9);
      const alt = fn === "sin" ? Math.cos(rad(deg)) : Math.sin(rad(deg));
      const altFound = pool.find(([, v]) => Math.abs(v - alt) < 1e-9);
      const negFound = pool.find(([, v]) => Math.abs(v + target) < 1e-9);
      const cand = [];
      if (negFound) cand.push([negFound[0], "MC-ADDITION-SIGN"]);
      if (fn !== "tan" && altFound && altFound[0] !== found[0]) cand.push([altFound[0], "MC-TRIG-SIN-COS-SWAP"]);
      for (const [tex] of r.shuffle(others)) cand.push([tex, null]);
      const split = { 75: "45^{\\circ}+30^{\\circ}", 15: "45^{\\circ}-30^{\\circ}", 105: "60^{\\circ}+45^{\\circ}", 165: "120^{\\circ}+45^{\\circ}", 195: "150^{\\circ}+45^{\\circ}", 255: "210^{\\circ}+45^{\\circ}" }[deg];
      return choice({
        q: `加法定理を使って、$${FN_TEX[fn]}\\,${deg}^{\\circ}$ の値を求めなさい。${lv === 1 ? `（ヒント：$${deg}^{\\circ}=${split}$）` : ""}`,
        correct: $(found[0]),
        wrongs: labels(cand, found[0]),
        explain: `$${deg}^{\\circ}=${split}$ と分けて、加法定理を使います。${fn === "sin" ? "$\\sin(\\alpha\\pm\\beta)=\\sin\\alpha\\cos\\beta\\pm\\cos\\alpha\\sin\\beta$" : fn === "cos" ? "$\\cos(\\alpha\\pm\\beta)=\\cos\\alpha\\cos\\beta\\mp\\sin\\alpha\\sin\\beta$（符号が逆になる）" : "$\\tan(\\alpha\\pm\\beta)=\\dfrac{\\tan\\alpha\\pm\\tan\\beta}{1\\mp\\tan\\alpha\\tan\\beta}$"} に特別な角の値を代入して整理すると、$${FN_TEX[fn]}\\,${deg}^{\\circ}=${found[0]}$。（電卓の値と一致することも確かめられます）`,
      });
    }),
    t(
      "num",
      (r, lv) => {
        // 三辺が整数の直角三角形の比：sin, cos が有理数になる角
        const T = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29]];
        const tri = () => r.pick(T);
        if (lv === 1) {
          const [s, c, h] = tri();
          const swap = r.chance(0.5);
          const [sa, ca] = swap ? [c, s] : [s, c];
          const which = r.pick(["sin", "cos"]);
          const ans = which === "sin" ? Q(2 * sa * ca, h * h) : Q(ca * ca - sa * sa, h * h);
          const alpha = Math.asin(sa / h);
          nearly(which === "sin" ? Math.sin(2 * alpha) : Math.cos(2 * alpha), qnum(ans), "倍角の検算", 1e-9);
          return num({
            q: `$0<\\alpha<\\dfrac{\\pi}{2}$ で $\\sin\\alpha=\\dfrac{${sa}}{${h}}$ のとき、$${which === "sin" ? "\\sin 2\\alpha" : "\\cos 2\\alpha"}$ の値を求めなさい。`,
            ans,
            reduced: true,
            wrongs:
              which === "sin"
                ? [[Q(2 * sa, h), "MC-DOUBLE-ANGLE"], [Q(sa * sa, h * h), "MC-DOUBLE-ANGLE"], [Q(2 * sa * sa, h * h), "MC-DOUBLE-ANGLE"], [Q(ca * ca - sa * sa, h * h), "MC-TRIG-SIN-COS-SWAP"]]
                : [[Q(2 * sa * ca, h * h), "MC-TRIG-SIN-COS-SWAP"], [Q(sa * sa - ca * ca, h * h), "MC-ADDITION-SIGN"], [Q(2 * ca, h), "MC-DOUBLE-ANGLE"], [Q(ca * ca, h * h), "MC-DOUBLE-ANGLE"]],
            explain: `$\\alpha$ は鋭角なので $\\cos\\alpha=\\dfrac{${ca}}{${h}}$（直角三角形の3辺が $${sa},\\ ${ca},\\ ${h}$）。${which === "sin" ? `倍角の公式 $\\sin 2\\alpha=2\\sin\\alpha\\cos\\alpha=2\\times\\dfrac{${sa}}{${h}}\\times\\dfrac{${ca}}{${h}}=${tq(ans)}$。` : `倍角の公式 $\\cos 2\\alpha=\\cos^2\\alpha-\\sin^2\\alpha=\\dfrac{${ca * ca}}{${h * h}}-\\dfrac{${sa * sa}}{${h * h}}=${tq(ans)}$。`}`,
          });
        }
        const [s1, c1, h1] = tri();
        const [s2, c2, h2] = tri();
        const obtuse = lv === 3;
        const A = Q(s1, h1);
        const Ac = Q(obtuse ? -c1 : c1, h1);
        const B = Q(s2, h2);
        const Bc = Q(c2, h2);
        const which = obtuse ? r.pick(["sin(α+β)", "cos(α+β)", "cos(α−β)"]) : r.pick(["sin(α+β)", "cos(α+β)", "sin(α−β)", "cos(α−β)"]);
        const val =
          which === "sin(α+β)" ? add(mul(A, Bc), mul(Ac, B)) : which === "cos(α+β)" ? sub(mul(Ac, Bc), mul(A, B)) : which === "sin(α−β)" ? sub(mul(A, Bc), mul(Ac, B)) : add(mul(Ac, Bc), mul(A, B));
        const al = obtuse ? Math.PI - Math.asin(s1 / h1) : Math.asin(s1 / h1);
        const be = Math.asin(s2 / h2);
        const fl = { "sin(α+β)": Math.sin(al + be), "cos(α+β)": Math.cos(al + be), "sin(α−β)": Math.sin(al - be), "cos(α−β)": Math.cos(al - be) }[which];
        nearly(fl, qnum(val), "加法定理の検算", 1e-9);
        const tex = `\\${which.startsWith("sin") ? "sin" : "cos"}(\\alpha${which.includes("+") ? "+" : "-"}\\beta)`;
        // 誤答：符号を取りちがえた公式、cos の符号（鈍角）を無視、和の形
        const signWrong = {
          "sin(α+β)": sub(mul(A, Bc), mul(Ac, B)),
          "cos(α+β)": add(mul(Ac, Bc), mul(A, B)),
          "sin(α−β)": add(mul(A, Bc), mul(Ac, B)),
          "cos(α−β)": sub(mul(Ac, Bc), mul(A, B)),
        }[which];
        const posCos = Q(c1, h1);
        const ignoreObtuse = {
          "sin(α+β)": add(mul(A, Bc), mul(posCos, B)),
          "cos(α+β)": sub(mul(posCos, Bc), mul(A, B)),
          "cos(α−β)": add(mul(posCos, Bc), mul(A, B)),
        }[which];
        const wrongs = [[signWrong, "MC-ADDITION-SIGN"], [neg(val), "MC-ADDITION-SIGN"]];
        if (obtuse) wrongs.push([ignoreObtuse, "MC-TRIG-SIGN-QUADRANT"]);
        else wrongs.push([which.startsWith("sin") ? add(A, B) : add(Ac, Bc), "MC-ADDITION-SIGN"]);
        return num({
          q: obtuse
            ? `$\\alpha$ は鈍角、$\\beta$ は鋭角で、$\\sin\\alpha=\\dfrac{${s1}}{${h1}}$、$\\sin\\beta=\\dfrac{${s2}}{${h2}}$ です。$${tex}$ の値を求めなさい。`
            : `$\\alpha$、$\\beta$ はどちらも鋭角で、$\\sin\\alpha=\\dfrac{${s1}}{${h1}}$、$\\sin\\beta=\\dfrac{${s2}}{${h2}}$ です。$${tex}$ の値を求めなさい。`,
          ans: val,
          reduced: true,
          wrongs,
          explain: `${obtuse ? `$\\alpha$ が鈍角なので $\\cos\\alpha<0$。$\\cos\\alpha=-\\dfrac{${c1}}{${h1}}$（符号に注意）。` : `鋭角なので $\\cos\\alpha=\\dfrac{${c1}}{${h1}}$、`}$\\cos\\beta=\\dfrac{${c2}}{${h2}}$。加法定理 ${which.startsWith("sin") ? `$\\sin(\\alpha${which.includes("+") ? "+" : "-"}\\beta)=\\sin\\alpha\\cos\\beta${which.includes("+") ? "+" : "-"}\\cos\\alpha\\sin\\beta$` : `$\\cos(\\alpha${which.includes("+") ? "+" : "-"}\\beta)=\\cos\\alpha\\cos\\beta${which.includes("+") ? "-" : "+"}\\sin\\alpha\\sin\\beta$`} に代入して、$${tq(val)}$。`,
        });
      },
      { id: "b", db: 0.25 },
    ),
    t(
      "num",
      (r, lv) => {
        // 三角関数の合成：a sinθ + b cosθ の最大・最小
        const P2 = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [6, 8, 10]];
        const extremes = (fn) => {
          let mx = -Infinity;
          let mn = Infinity;
          for (let d = 0; d < 3600; d++) {
            const v = fn(rad(d / 10));
            mx = Math.max(mx, v);
            mn = Math.min(mn, v);
          }
          return [mx, mn];
        };
        if (lv === 1) {
          const [a, b, h] = r.pick(P2);
          const isMax = r.chance(0.5);
          const A = r.chance(0.5) ? a : -a;
          const B = r.chance(0.5) ? b : -b;
          const [mx, mn] = extremes((x) => A * Math.sin(x) + B * Math.cos(x));
          assert(Math.abs(mx - h) < 1e-3 && Math.abs(mn + h) < 1e-3, "合成の最大・最小の検算");
          return num({
            q: `$y=${A === 1 ? "" : A === -1 ? "-" : A}\\sin\\theta${B > 0 ? "+" : "-"}${Math.abs(B)}\\cos\\theta$ の${isMax ? "最大値" : "最小値"}を求めなさい。`,
            ans: isMax ? h : -h,
            wrongs: [[Math.abs(A) + Math.abs(B), "MC-COMPOSE-SUM"], [a * a + b * b, "MC-COMPOSE-SQUARE"], [isMax ? -h : h, "MC-SLIP"], [Math.abs(A * B), "MC-COMPOSE-SUM"]],
            explain: `$a\\sin\\theta+b\\cos\\theta=\\sqrt{a^2+b^2}\\sin(\\theta+\\alpha)$ と合成できます。$\\sqrt{${A * A}+${B * B}}=\\sqrt{${a * a + b * b}}=${h}$ なので、$\\sin(\\theta+\\alpha)$ の範囲 $-1$ 〜 $1$ から、最大値は $${h}$、最小値は $${-h}$。（$a+b$ ではありません）`,
          });
        }
        if (lv === 2) {
          const forms = [
            ["\\sin\\theta+\\sqrt{3}\\cos\\theta", (x) => Math.sin(x) + Math.sqrt(3) * Math.cos(x), "\\sqrt{1^2+(\\sqrt3)^2}"],
            ["\\sqrt{3}\\sin\\theta+\\cos\\theta", (x) => Math.sqrt(3) * Math.sin(x) + Math.cos(x), "\\sqrt{(\\sqrt3)^2+1^2}"],
            ["\\sqrt{2}\\sin\\theta+\\sqrt{2}\\cos\\theta", (x) => Math.SQRT2 * Math.sin(x) + Math.SQRT2 * Math.cos(x), "\\sqrt{(\\sqrt2)^2+(\\sqrt2)^2}"],
            ["\\sin\\theta-\\sqrt{3}\\cos\\theta", (x) => Math.sin(x) - Math.sqrt(3) * Math.cos(x), "\\sqrt{1^2+(\\sqrt3)^2}"],
          ];
          const [tex, fn, root] = r.pick(forms);
          const isMax = r.chance(0.5);
          const [mx, mn] = extremes(fn);
          assert(Math.abs(mx - 2) < 1e-3 && Math.abs(mn + 2) < 1e-3, "合成(√)の検算");
          return num({
            q: `$y=${tex}$ の${isMax ? "最大値" : "最小値"}を求めなさい。`,
            ans: isMax ? 2 : -2,
            wrongs: [[1, "MC-COMPOSE-SUM"], [isMax ? -2 : 2, "MC-SLIP"], [4, "MC-COMPOSE-SQUARE"], [3, "MC-COMPOSE-SUM"]],
            explain: `係数を $a$、$b$ として $\\sqrt{a^2+b^2}$ を計算します。$${root}=\\sqrt{4}=2$。合成すると $2\\sin(\\theta+\\alpha)$ の形になるので、最大値は $2$、最小値は $-2$。`,
          });
        }
        const [a, b, h] = r.pick(P2);
        const cst = r.nz(-4, 4);
        const isMax = r.chance(0.5);
        const [mx, mn] = extremes((x) => a * Math.sin(x) + b * Math.cos(x) + cst);
        const ans = isMax ? h + cst : -h + cst;
        assert(Math.abs((isMax ? mx : mn) - ans) < 1e-3, "定数つき合成の検算");
        return num({
          q: `$y=${a}\\sin\\theta+${b}\\cos\\theta${cst > 0 ? "+" : ""}${cst}$ の${isMax ? "最大値" : "最小値"}を求めなさい。`,
          ans,
          wrongs: [[isMax ? -h + cst : h + cst, "MC-SLIP"], [isMax ? h : -h, "MC-COMPOSE-CONST"], [a + b + cst, "MC-COMPOSE-SUM"], [isMax ? h - cst : -h - cst, "MC-COMPOSE-CONST"]],
          explain: `$${a}\\sin\\theta+${b}\\cos\\theta$ の部分を合成すると振幅は $\\sqrt{${a * a}+${b * b}}=${h}$。よってこの部分は $-${h}$ から $${h}$ の間を動きます。定数 $${cst}$ をたすので、${isMax ? "最大値" : "最小値"}は $${isMax ? h : -h}${cst >= 0 ? "+" : ""}${cst}=${ans}$。`,
        });
      },
      { id: "c", db: 0.3 },
    ),
  ],
};
