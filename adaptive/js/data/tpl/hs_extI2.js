// ============================================================
// tpl/hs_extI2.js — 高校 数学Ⅰ・数学Ⅱ の追加単元
//   data_corr / hypo_basic（数Ⅰ）
//   frac_expr / identity / amgm / locus / region / log_common（数Ⅱ）
//
//  すべて自作の数値・言い回し・図。答えは、別の方法（数値での代入・全数の探索・
//  格子点での最大値探し・整数の厳密な計算など）でも計算し直して確かめている。
// ============================================================
import { num, choice, fields } from "../../core/items.js";
import { Q, add, sub, mul, div, neg, eq, num as qnum } from "../../core/rational.js";
import { tq } from "../../core/tex.js";
import { Poly, P } from "../../core/poly.js";
import { t, until, assert, gcd } from "./util.js";
import { nearly, isqrt } from "./hs_util.js";
import { scatter, coordPlane } from "./fig.js";
import { texTable, tx } from "./hs_extA.js";

const $ = (s) => `$${s}$`;
const sgn = (n) => (n >= 0 ? `+${n}` : `${n}`);
const px = (p, order = ["x"]) => p.toTeX({ order });

/** 標準正規乱数（Box–Muller） */
function gauss(r) {
  const u = Math.max(1e-12, r.next());
  const v = r.next();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
/** 相関係数（浮動小数） */
function corr(xs, ys) {
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < n; i++) {
    sxy += (xs[i] - mx) * (ys[i] - my);
    sxx += (xs[i] - mx) ** 2;
    syy += (ys[i] - my) ** 2;
  }
  return sxy / Math.sqrt(sxx * syy);
}
/** 小数の TeX（有限小数の Q） */
const dq = (q) => {
  const v = qnum(q);
  const s = String(Math.round(v * 1e6) / 1e6);
  return s;
};

// 偏差（和が 0）のパターン。y の偏差は、x の偏差を並べかえて c 倍（符号を変えることも）したものにする。
// こうすると y の偏差の2乗の和は x の c² 倍になり、相関係数がきれいな有理数になる。
const DEV = [
  [-2, -1, 0, 1, 2],
  [-3, -1, 0, 1, 3],
  [-4, -2, 0, 2, 4],
  [-3, -2, 0, 2, 3],
  [-4, -1, 0, 1, 4],
  [-3, -1, -1, 2, 3],
  [-4, -2, 1, 2, 3],
  [-3, -3, 1, 2, 3],
];

export default {
  // ── 散布図と相関係数 ──────────────────────────────
  data_corr: [
    t("num", (r, lv) => {
      if (lv <= 2) {
        const { dx, dy, c } = until(
          () => {
            const dx0 = r.pick(DEV);
            const c0 = lv === 1 ? r.pick([1, 2]) : r.pick([1, 2, 3]);
            const sg = r.chance(0.5) ? 1 : -1;
            return { dx: dx0, dy: r.shuffle(dx0.map((v) => v * c0 * sg)), c: c0 };
          },
          ({ dx, dy, c }) => {
            const sxx = dx.reduce((a, v) => a + v * v, 0);
            const sxy = dx.reduce((a, v, i) => a + v * dy[i], 0);
            const rq0 = Q(sxy, c * sxx);
            // 相関係数が 0.3〜0.95（負も）で、小数第2位までで割り切れる値になるもの
            return Math.abs(qnum(rq0)) >= 0.3 && Math.abs(qnum(rq0)) <= 0.95 && 100 % rq0.d === 0;
          },
          1000,
        );
        const n = 5;
        // 100点満点のテスト：平均値のまわりにちらばっても 0〜100 に収まるように
        const mx = r.int(45, 80);
        const my = r.int(40, 85);
        const shuffleIdx = r.shuffle([0, 1, 2, 3, 4]);
        const xs = shuffleIdx.map((i) => mx + dx[i]);
        const ys = shuffleIdx.map((i) => my + dy[i]);
        const sxx = dx.reduce((a, v) => a + v * v, 0);
        const syy = dy.reduce((a, v) => a + v * v, 0);
        const sxy = dx.reduce((a, v, i) => a + v * dy[i], 0);
        assert(syy === c * c * sxx, "y の偏差の2乗の和の検算");
        const cov = Q(sxy, n);
        const rq = Q(sxy, c * sxx);
        nearly(corr(xs, ys), qnum(rq), "相関係数の検算", 1e-12);
        const table = `\\begin{array}{c|ccccc} ${tx("生徒")} & ${["A", "B", "C", "D", "E"].map(tx).join(" & ")} \\\\ \\hline x & ${xs.join(" & ")} \\\\ y & ${ys.join(" & ")} \\end{array}`;
        const head = `5人の生徒の、2つのテスト（どちらも100点満点）の得点 $x$、$y$ です。$x$ の平均値は $${mx}$、$y$ の平均値は $${my}$ です。\n$${table}$\n`;
        if (lv === 1) {
          return num({
            q: `${head}$x$ と $y$ の共分散を求めなさい。（小数または分数で答えます）`,
            ans: cov,
            wrongs: [[sxy, "MC-COV-NO-DIVIDE"], [Q(xs.reduce((a, v, i) => a + v * ys[i], 0), n), "MC-COV-RAW"], [neg(cov), "MC-CORR-SIGN"]],
            explain: `偏差（値 − 平均値）は、$x$：$${xs.map((v) => v - mx).join(",\\ ")}$、$y$：$${ys.map((v) => v - my).join(",\\ ")}$。偏差の積の和は $${sxy}$。共分散はその平均で $${sxy}\\div ${n}=${dq(cov)}$。`,
          });
        }
        return num({
          q: `${head}$x$ と $y$ の相関係数を求めなさい。（小数で答えます）`,
          ans: rq,
          wrongs: [[cov, "MC-CORR-COV"], [neg(rq), "MC-CORR-SIGN"], [Q(sxy, sxx * syy), "MC-CORR-NO-SQRT"], [Q(sxy, sxx + syy), "MC-CORR-NO-SQRT"]],
          explain: `偏差の積の和 $${sxy}$、$x$ の偏差の2乗の和 $${sxx}$、$y$ の偏差の2乗の和 $${syy}$。相関係数は $r=\\dfrac{${sxy}}{\\sqrt{${sxx}}\\sqrt{${syy}}}=\\dfrac{${sxy}}{${c === 1 ? sxx : `${c}\\times ${sxx}`}}=${dq(rq)}$。（5 でわる平均を分子・分母の両方でとるので、和のまま計算してよい）`,
        });
      }
      // 変量の変換と相関係数・共分散
      const [sx, sy] = until(() => [r.int(2, 6), r.int(2, 6)], ([a, b]) => a !== b);
      const rq = Q(r.pick([-9, -8, -7, -6, -5, -4, -3, 3, 4, 5, 6, 7, 8, 9]), 10);
      const sxy = mul(rq, sx * sy);
      // 係数の符号：6割は「積が負」（相関係数の符号が変わる場合）にする
      const flip = r.chance(0.6);
      const a = r.pick([2, 3, 5]) * (r.chance(0.5) ? 1 : -1);
      const cc = r.pick([2, 3, 4]) * (flip ? -Math.sign(a) : Math.sign(a));
      const [b, d] = [r.int(1, 9), r.int(-9, 9)];
      const askCorr = r.chance(0.5);
      const ruv = a * cc > 0 ? rq : neg(rq);
      const suv = mul(sxy, a * cc);
      // 独立な検算：データを実際に作って変換し、相関係数・共分散を計算する
      const xs = [0, 1, 2, 3];
      const ys = [1, 0, 3, 2];
      const tr = (arr, p, q) => arr.map((v) => p * v + q);
      nearly(corr(tr(xs, a, b), tr(ys, cc, d)), (a * cc > 0 ? 1 : -1) * corr(xs, ys), "変換後の相関係数の検算", 1e-12);
      const lin = (p, q, v) => `${p === 1 ? "" : p === -1 ? "-" : p}${v}${sgn(q)}`;
      return num({
        q: `2つの変量 $x$、$y$ の標準偏差がそれぞれ $${sx}$、$${sy}$、共分散が $${dq(sxy)}$ です。$u=${lin(a, b, "x")}$、$v=${lin(cc, d, "y")}$ とおくとき、$u$ と $v$ の${askCorr ? "相関係数" : "共分散"}を求めなさい。（小数で答えます）`,
        ans: askCorr ? ruv : suv,
        wrongs: askCorr
          ? [[rq, "MC-CORR-SIGN"], [mul(rq, a * cc), "MC-CORR-SCALE"], [sxy, "MC-CORR-COV"]]
          : [[sxy, "MC-COV-SCALE"], [add(mul(sxy, a * cc), b * d), "MC-COV-SHIFT"], [mul(sxy, Math.abs(a * cc)), "MC-CORR-SIGN"], [mul(sxy, a + cc), "MC-COV-SCALE"]],
        explain: askCorr
          ? `もとの相関係数は $\\dfrac{${dq(sxy)}}{${sx}\\times ${sy}}=${dq(rq)}$。$u$ の偏差は $x$ の偏差の $${a}$ 倍、$v$ の偏差は $y$ の偏差の $${cc}$ 倍なので、共分散は $${a * cc}$ 倍、標準偏差の積は $${Math.abs(a * cc)}$ 倍。相関係数は ${a * cc > 0 ? "変わらず" : "符号だけが変わって"} $${dq(ruv)}$。（足した定数 $${b}$、$${d}$ は影響しません）`
          : `偏差は、$u$ が $x$ の $${a}$ 倍、$v$ が $y$ の $${cc}$ 倍になるので、共分散は $${a}\\times(${cc})=${a * cc}$ 倍：$${dq(sxy)}\\times(${a * cc})=${dq(suv)}$。（足した定数は偏差に影響しません）`,
      });
    }),
    t(
      "choice",
      (r, lv) => {
        // 散布図から相関を読む
        const targets = lv === 1 ? [0.9, -0.9, 0] : [0.9, 0.5, -0.5, -0.9];
        const target = r.pick(targets);
        const n = 16;
        const { xs, ys, rr } = until(
          () => {
            const x0 = Array.from({ length: n }, () => Math.round((1 + 8 * r.next()) * 2) / 2);
            const noise = target === 0 ? 2.2 : Math.abs(target) > 0.8 ? 0.8 : 1.9;
            const slope = target === 0 ? 0 : Math.sign(target) * 0.8;
            const y0 = x0.map((x) => Math.round((5 + slope * (x - 5) + noise * gauss(r)) * 2) / 2);
            return { xs: x0, ys: y0, rr: corr(x0, y0) };
          },
          ({ ys: yy, rr: c }) => yy.every((v) => v >= 0.5 && v <= 9.5) && Math.abs(c - target) < (target === 0 ? 0.1 : 0.06),
          2000,
        );
        const fig = scatter({ pts: xs.map((x, i) => [x, ys[i]]), xr: [0, 10, 2], yr: [0, 10, 2] });
        if (lv <= 2) {
          const all = [-0.9, -0.5, 0, 0.5, 0.9];
          const lbl = (v) => $(v === 0 ? "0" : String(v));
          const others = all.filter((v) => v !== target);
          // 符号が逆のもの・強さが違うものを混ぜる
          const picks = r.shuffle(others).slice(0, 3);
          return choice({
            q: `次の散布図の2つの変量の相関係数に最も近い値はどれですか。`,
            fig,
            correct: lbl(target),
            wrongs: picks.map((v) => [lbl(v), Math.sign(v) !== Math.sign(target) && v !== 0 && target !== 0 ? "MC-CORR-SIGN" : "MC-CORR-STRENGTH"]),
            explain: `${target > 0 ? "右上がり" : target < 0 ? "右下がり" : "右上がりでも右下がりでもない"}の分布${target === 0 ? "なので、相関はほとんどなく、相関係数は $0$ に近い" : `で、点が直線の近くに${Math.abs(target) > 0.8 ? "よく集まっている" : "ある程度ちらばっている"}ので、${Math.abs(target) > 0.8 ? "強い" : "弱い"}${target > 0 ? "正" : "負"}の相関`}です。（この図の実際の相関係数は約 $${Math.round(rr * 100) / 100}$）`,
          });
        }
        const pos = target > 0;
        return choice({
          q: `次の散布図は、ある町の16日間の、2つの量 $x$、$y$ を1日ごとに記録したものです。この図から言えることとして、最も適切なものはどれですか。`,
          fig,
          correct: pos ? "$x$ が大きい日ほど、$y$ も大きい傾向がある" : "$x$ が大きい日ほど、$y$ は小さい傾向がある",
          wrongs: [
            [pos ? "$x$ が大きい日ほど、$y$ は小さい傾向がある" : "$x$ が大きい日ほど、$y$ も大きい傾向がある", "MC-CORR-SIGN"],
            ["$x$ と $y$ の間には、相関がほとんどない", "MC-CORR-STRENGTH"],
            [pos ? "$x$ を大きくすれば、必ず $y$ も大きくなる" : "$x$ を大きくすれば、必ず $y$ は小さくなる", "MC-CORR-CAUSE"],
          ],
          explain: `点が${pos ? "右上がり" : "右下がり"}に分布しているので${pos ? "正" : "負"}の相関があります。ただし、相関は「傾向」であり、一方を変えればもう一方が必ず変わる（原因と結果の関係がある）とまでは言えません。`,
        });
      },
      { id: "b" },
    ),
  ],

  // ── 仮説検定の考え方 ─────────────────────────────
  hypo_basic: [
    t("num", (r, lv) => {
      const sim = simTable(r, lv);
      const { K, rows, count } = sim;
      const ge = count((k) => k >= K);
      const eqK = count((k) => k === K);
      const gt = count((k) => k > K);
      if (lv <= 2) {
        return num({
          q: `${sim.story}\n$${rows}$\nこの結果で、${sim.unitName}が $${K}$ ${sim.unit}以上だったのは、全体の何割にあたりますか。相対度数（小数）で答えなさい。`,
          ans: Q(ge, 1000),
          wrongs: [[Q(gt, 1000), "MC-HYPO-TAIL-EQUAL"], [Q(eqK, 1000), "MC-HYPO-TAIL-ONLY"], [Q(1000 - ge, 1000), "MC-HYPO-TAIL-SIDE"]],
          explain: `${K} ${sim.unit}以上の度数をすべてたすと $${ge}$。全体は $1000$ なので、相対度数は $${ge}\\div 1000=${dq(Q(ge, 1000))}$。（「以上」なので $${K}$ ${sim.unit}の度数もふくめます）`,
        });
      }
      // 両側：K 以上 または (n−K) 以下
      const lo = sim.n - K;
      const both = count((k) => k >= K || k <= lo);
      return num({
        q: `${sim.story}\n$${rows}$\nこの結果で、${sim.unitName}が $${K}$ ${sim.unit}以上、または $${lo}$ ${sim.unit}以下だったのは、全体の何割にあたりますか。相対度数（小数）で答えなさい。`,
        ans: Q(both, 1000),
        wrongs: [[Q(ge, 1000), "MC-HYPO-TAIL-SIDE"], [Q(count((k) => k > K || k < lo), 1000), "MC-HYPO-TAIL-EQUAL"]],
        explain: `$${K}$ ${sim.unit}以上の度数は $${ge}$、$${lo}$ ${sim.unit}以下の度数は $${count((k) => k <= lo)}$。合わせて $${both}$ なので、相対度数は $${dq(Q(both, 1000))}$。`,
      });
    }),
    t(
      "choice",
      (r, lv) => {
        const sim = simTable(r, lv, true);
        const { K, rows, count } = sim;
        const ge = count((k) => k >= K);
        const p = ge / 1000;
        const rare = p < 0.05;
        const yes = `「${sim.claim}」と判断できる`;
        const no = `「${sim.claim}」とは判断できない`;
        return choice({
          q: `${sim.story}\n$${rows}$\n${sim.trial}ところ、${sim.unitName}が $${K}$ ${sim.unit}でした。「${sim.null}」と仮定し、基準となる確率を $5\\%$ として考えると、どのように判断できますか。`,
          correct: rare ? yes : no,
          wrongs: [
            [rare ? no : yes, "MC-HYPO-REVERSE"],
            [`「${sim.null}」と判断できる`, "MC-HYPO-ACCEPT"],
            [`「${sim.opposite}」と判断できる`, "MC-HYPO-TAIL-SIDE"],
          ],
          explain: `「${sim.null}」と仮定したときの実験で、$${K}$ ${sim.unit}以上になった割合は $${ge}\\div 1000=${p}$。これは基準の $0.05$ ${rare ? "より小さいので、仮定のもとでは「めったに起こらない」ことが起きたと考え、仮定は正しくなかった、つまり" + yes.replace("と判断できる", "") + "と判断します。" : "以上なので、偶然でも十分に起こりうる結果です。仮定を否定できないので、" + no + "。（「仮定が正しい」と言いきれるわけでもありません）"}`,
        });
      },
      { id: "b" },
    ),
  ],

  // ── 分数式の計算（数Ⅱ） ─────────────────────────
  frac_expr: [
    t("choice", (r, lv) => {
      const L = (c) => P.lin(1, c);
      const f = (poly) => `(${px(poly)})`;
      const frac = (n, d) => `\\dfrac{${n}}{${d}}`;
      // 分数式（分子・分母の多項式）を有理数 x で評価
      const val = (n, d, x) => div(n.eval({ x }), d.eval({ x }));
      const pts = [Q(7, 3), Q(-11, 5), Q(13, 2)];
      let given;
      let evalGiven;
      let good; // [分子, 分母]
      let goodTex;
      let bad; // [TeX, 分子, 分母, mc]
      let expl;
      if (lv === 1) {
        const [p, q, s2] = until(() => [r.nz(-5, 5), r.nz(-5, 5), r.nz(-5, 5)], ([a, b, c]) => new Set([a, b, c]).size === 3);
        const N = L(p).mul(L(q));
        const D = L(p).mul(L(s2));
        given = frac(px(N), px(D));
        evalGiven = (x) => val(N, D, x);
        good = [L(q), L(s2)];
        goodTex = frac(px(L(q)), px(L(s2)));
        const x2 = P.x(2);
        bad = [
          [frac(px(N.sub(x2)), px(D.sub(x2))), N.sub(x2), D.sub(x2), "MC-FRACEXP-CANCEL-TERMS"],
          [frac(px(L(p)), px(L(s2))), L(p), L(s2), "MC-FRACEXP-WRONG-FACTOR"],
          [frac(px(L(-q)), px(L(-s2))), L(-q), L(-s2), "MC-FACTOR-SIGN"],
          [frac(px(L(s2)), px(L(q))), L(s2), L(q), "MC-FRACEXP-INVERT"],
        ];
        expl = `分子と分母をそれぞれ因数分解すると $${frac(`${f(L(p))}${f(L(q))}`, `${f(L(p))}${f(L(s2))}`)}$。共通な因数 $${f(L(p))}$ で約分して $${goodTex}$。（$x^2$ どうしのように「項」で約分することはできません）`;
      } else if (lv === 2) {
        const [a, b, c, d] = until(() => [r.nz(-4, 4), r.nz(-4, 4), r.nz(-4, 4), r.nz(-4, 4)], (v) => new Set(v).size === 4);
        const N = L(a).mul(L(b));
        const D = L(c).mul(L(d));
        const divide = r.chance(0.5);
        given = divide ? `${frac(px(N), px(D))}\\div${frac(px(L(a)), px(L(c)))}` : `${frac(px(N), px(D))}\\times${frac(px(L(c)), px(L(a)))}`;
        evalGiven = (x) => (divide ? div(val(N, D, x), val(L(a), L(c), x)) : mul(val(N, D, x), val(L(c), L(a), x)));
        good = [L(b), L(d)];
        goodTex = frac(px(L(b)), px(L(d)));
        bad = [
          [frac(`${f(L(a))}^{2}${f(L(b))}`, `${f(L(c))}^{2}${f(L(d))}`), L(a).mul(L(a)).mul(L(b)), L(c).mul(L(c)).mul(L(d)), divide ? "MC-FRACEXP-DIV-NO-INVERT" : "MC-FRACEXP-WRONG-FACTOR"],
          [frac(px(L(d)), px(L(b))), L(d), L(b), "MC-FRACEXP-INVERT"],
          [frac(px(L(-b)), px(L(-d))), L(-b), L(-d), "MC-FACTOR-SIGN"],
          [frac(px(L(a)), px(L(c))), L(a), L(c), "MC-FRACEXP-WRONG-FACTOR"],
        ];
        expl = `${divide ? `わり算は、わる式の分母と分子を入れかえてかけ算にします。` : ""}分子・分母を因数分解すると $${frac(`${f(L(a))}${f(L(b))}`, `${f(L(c))}${f(L(d))}`)}\\times${frac(px(L(c)), px(L(a)))}$。$${f(L(a))}$ と $${f(L(c))}$ を約分して $${goodTex}$。`;
      } else {
        const [a, b] = until(() => [r.nz(-5, 5), r.nz(-5, 5)], ([u, v]) => u !== v);
        const [m, n] = [r.int(1, 5), r.int(1, 5)];
        const minus = r.chance(0.5);
        const sn = minus ? -n : n;
        // m/(x+a) ± n/(x+b) = {(m±n)x + (mb ± na)} / {(x+a)(x+b)}
        const num1 = P.lin(m + sn, m * b + sn * a);
        const den = L(a).mul(L(b));
        given = `${frac(m, px(L(a)))}${minus ? "-" : "+"}${frac(n, px(L(b)))}`;
        evalGiven = (x) => add(val(P.c(m), L(a), x), mul(sn, val(P.c(1), L(b), x)));
        good = [num1, den];
        goodTex = frac(px(num1), `${f(L(a))}${f(L(b))}`);
        const wrongSign = P.lin(m + sn, m * b - sn * a);
        bad = [
          [frac(m + sn, px(L(a).add(L(b)))), P.c(m + sn), L(a).add(L(b)), "MC-FRACEXP-ADD-DENOM"],
          [frac(m + sn, `${f(L(a))}${f(L(b))}`), P.c(m + sn), den, "MC-FRACEXP-CROSS"],
          ...(minus ? [[frac(px(wrongSign), `${f(L(a))}${f(L(b))}`), wrongSign, den, "MC-FRACEXP-SUB-SIGN"]] : []),
          // 分子の分配で、かっこの中の定数に係数をかけ忘れる：m(x+b) を mx+b とする
          [frac(px(P.lin(m + sn, b + (minus ? -a : a))), `${f(L(a))}${f(L(b))}`), P.lin(m + sn, b + (minus ? -a : a)), den, "MC-EXPAND-DISTRIB"],
          [frac(px(P.lin(m + sn, m * a + sn * b)), `${f(L(a))}${f(L(b))}`), P.lin(m + sn, m * a + sn * b), den, "MC-FRACEXP-CROSS"],
        ];
        expl = `分母を $${f(L(a))}${f(L(b))}$ にそろえます（通分）。分子は $${m}${f(L(b))}${minus ? "-" : "+"}${n}${f(L(a))}=${px(num1)}$。よって $${goodTex}$。${minus ? "（ひく式の分子全体にかっこをつけて、符号に注意）" : ""}`;
      }
      // 検算：いくつかの値を代入して、正解が与式と一致し、誤答は一致しないこと
      for (const x of pts) assert(eq(evalGiven(x), val(good[0], good[1], x)), "分数式の検算");
      const list = bad.filter(([, n, d]) => pts.some((x) => !eq(d.eval({ x }), Q(0)) && !eq(val(n, d, x), evalGiven(x)))).map(([tex, , , mc]) => [$(tex), mc]);
      return choice({
        q: `次の式を計算しなさい。\n$${given}$`,
        correct: $(goodTex),
        wrongs: list,
        explain: expl,
      });
    }),
    t(
      "fields",
      (r, lv) => {
        const L = (c) => P.lin(1, c);
        const f = (poly) => `(${px(poly)})`;
        const at = (poly, x) => poly.eval({ x });
        const [a, b] = until(() => [r.nz(-5, 5), r.nz(-5, 5)], ([u, v]) => u !== v);
        let given;
        let evalGiven; // 与式を x の値で直接計算する（答えの検算用）
        let numP;
        let wrongs;
        let expl;
        if (lv <= 2) {
          const m = lv === 1 ? 1 : r.int(2, 5);
          const n = lv === 1 ? 1 : r.int(1, 5);
          const minus = lv === 2 && r.chance(0.6);
          const sn = minus ? -n : n;
          given = `\\dfrac{${m}}{${px(L(a))}}${minus ? "-" : "+"}\\dfrac{${n}}{${px(L(b))}}`;
          evalGiven = (x) => add(div(Q(m), at(L(a), x)), div(Q(sn), at(L(b), x)));
          numP = [m + sn, m * b + sn * a];
          wrongs = [
            { values: { p: m + sn, q: m * a + sn * b }, mc: "MC-FRACEXP-CROSS" },
            { values: { p: m + sn, q: m * b - sn * a }, mc: "MC-FRACEXP-SUB-SIGN" },
          ];
          const co = (v) => (v === 1 ? "" : String(v));
          expl = `通分すると、分子は $${co(m)}${f(L(b))}${minus ? "-" : "+"}${co(n)}${f(L(a))}=${px(P.lin(numP[0], numP[1]))}$。よって $p=${numP[0]}$、$q=${numP[1]}$。`;
        } else {
          // (x + k)/{(x+a)(x+b)} − n/(x+a)
          const [k, n] = until(
            () => [r.nz(-6, 6), r.int(2, 4)],
            ([kk, nn]) => {
              const pp = 1 - nn;
              const qq = kk - nn * b;
              // 分子 px+q が (x+a)・(x+b) を因数にもたない（これ以上約分できない）
              return pp * -a + qq !== 0 && pp * -b + qq !== 0 && kk !== a && kk !== b;
            },
          );
          given = `\\dfrac{${px(L(k))}}{${px(L(a).mul(L(b)))}}-\\dfrac{${n}}{${px(L(a))}}`;
          evalGiven = (x) => sub(div(at(L(k), x), at(L(a).mul(L(b)), x)), div(Q(n), at(L(a), x)));
          numP = [1 - n, k - n * b];
          wrongs = [
            { values: { p: 1 - n, q: k + n * b }, mc: "MC-FRACEXP-SUB-SIGN" },
            { values: { p: 1 + n, q: k + n * b }, mc: "MC-FRACEXP-SUB-SIGN" },
            { values: { p: 1 - n, q: k - n * a }, mc: "MC-FRACEXP-CROSS" },
          ];
          expl = `$${px(L(a).mul(L(b)))}=${f(L(a))}${f(L(b))}$ と因数分解して通分します。分子は $${px(L(k))}-${n}${f(L(b))}=${px(P.lin(numP[0], numP[1]))}$。よって $p=${numP[0]}$、$q=${numP[1]}$。（ひく式の分子にかっこ）`;
        }
        // 検算：いくつかの x で、(px+q)/{(x+a)(x+b)} と与式が一致する
        const den = L(a).mul(L(b));
        for (const x of [Q(7, 3), Q(-9, 4), Q(11, 5)]) assert(eq(div(at(P.lin(numP[0], numP[1]), x), at(den, x)), evalGiven(x)), "分数式（係数）の検算");
        return fields({
          q: `次の式を計算して $\\dfrac{px+q}{${f(L(a))}${f(L(b))}}$ の形にしたとき、$p$、$q$ の値を求めなさい。\n$${given}$`,
          fields: [
            { id: "p", value: numP[0], pre: "$p=$" },
            { id: "q", value: numP[1], pre: "$q=$" },
          ],
          layout: "lines",
          wrongs,
          explain: expl,
        });
      },
      { id: "b" },
    ),
  ],

  // ── 恒等式（係数比較・数値代入） ─────────────────────
  identity: [
    t("fields", (r, lv) => {
      const at = (poly, x) => poly.eval({ x });
      if (lv === 1) {
        // a(x+p) + b(x+q) = mx + n
        const [a, b, p, q] = until(() => [r.nz(-5, 5), r.nz(-5, 5), r.nz(-4, 4), r.nz(-4, 4)], ([u, v, pp, qq]) => pp !== qq && u !== v && u + v !== 0);
        const m = a + b;
        const n = a * p + b * q;
        const lhs = P.lin(1, p).scale(a).add(P.lin(1, q).scale(b));
        assert(lhs.equals(P.lin(m, n)), "恒等式の検算");
        const lin = (c) => px(P.lin(1, c));
        // 定数項 pa + qb の TeX（係数 ±1 は省く）
        const term = (c, v, first) => `${c < 0 ? "-" : first ? "" : "+"}${Math.abs(c) === 1 ? "" : Math.abs(c)}${v}`;
        const constT = `${term(p, "a", true)}${term(q, "b", false)}`;
        return fields({
          q: `等式 $a(${lin(p)})+b(${lin(q)})=${px(P.lin(m, n))}$ が $x$ についての恒等式となるように、定数 $a$、$b$ の値を定めなさい。`,
          fields: [
            { id: "a", value: a, pre: "$a=$" },
            { id: "b", value: b, pre: "$b=$" },
          ],
          layout: "lines",
          wrongs: [{ values: { a: b, b: a }, mc: "MC-IDENTITY-SWAP" }, { values: { a: -a, b: -b }, mc: "MC-IDENTITY-SIGN" }],
          explain: `左辺を整理すると $(a+b)x+(${constT})$。係数を比べて $a+b=${m}$、$${constT}=${n}$。この連立方程式を解いて $a=${a}$、$b=${b}$。`,
        });
      }
      if (lv === 2) {
        // k x² + m x + n = a(x−h)² + b(x−h) + c
        const k = r.pick([1, 1, 2, 3]);
        const h = r.pick([1, 2, 3, -1, -2]);
        const [a, b, c] = [k, r.int(-6, 6), r.int(-8, 8)];
        const t_ = P.lin(1, -h);
        const rhs = t_.pow(2).scale(a).add(t_.scale(b)).add(P.c(c));
        const cs = [0, 1, 2].map((d) => qnum(rhs.coeff(d)));
        // 独立な検算：x に h, h+1, h−1 を代入すると c, a+b+c, a−b+c
        assert(eq(at(rhs, Q(h)), Q(c)) && eq(at(rhs, Q(h + 1)), Q(a + b + c)) && eq(at(rhs, Q(h - 1)), Q(a - b + c)), "数値代入の検算");
        const ht = h > 0 ? `x-${h}` : `x+${-h}`;
        return fields({
          q: `等式 $${px(rhs)}=a(${ht})^2+b(${ht})+c$ が $x$ についての恒等式となるように、定数 $a$、$b$、$c$ の値を定めなさい。`,
          fields: [
            { id: "a", value: a, pre: "$a=$" },
            { id: "b", value: b, pre: "$b=$" },
            { id: "c", value: c, pre: "$c=$" },
          ],
          layout: "lines",
          wrongs: [
            { values: { a, b: cs[1], c: cs[0] }, mc: "MC-IDENTITY-SWAP" },
            { values: { a, b: b + 4 * a * h, c: c + 2 * b * h }, mc: "MC-IDENTITY-SIGN" },
          ],
          explain: `$x=${h}$ を代入すると $c=${c}$。$x=${h + 1}$ を代入すると $a+b+c=${a + b + c}$、$x=${h - 1}$ を代入すると $a-b+c=${a - b + c}$。これを解いて $a=${a}$、$b=${b}$、$c=${c}$。（右辺を展開して係数を比べてもよい。数値代入で求めたときは、恒等式になっていることを確かめる）`,
        });
      }
      // 部分分数：(mx+n)/((x−a)(x−b)) = A/(x−a) + B/(x−b)
      const [a, b, A, B] = until(() => [r.int(-4, 4), r.int(-4, 4), r.nz(-5, 5), r.nz(-5, 5)], ([u, v, p, q]) => u !== v && p + q !== 0);
      const m = A + B;
      const n = -(A * b + B * a);
      const L = (c) => px(P.lin(1, -c));
      for (const x of [Q(7, 3), Q(-5, 2), Q(11, 7)]) {
        const lhs = div(P.lin(m, n).eval({ x }), mul(P.lin(1, -a).eval({ x }), P.lin(1, -b).eval({ x })));
        const rhs = add(div(Q(A), P.lin(1, -a).eval({ x })), div(Q(B), P.lin(1, -b).eval({ x })));
        assert(eq(lhs, rhs), "部分分数の検算");
      }
      return fields({
        q: `等式 $\\dfrac{${px(P.lin(m, n))}}{(${L(a)})(${L(b)})}=\\dfrac{A}{${L(a)}}+\\dfrac{B}{${L(b)}}$ が $x$ についての恒等式となるように、定数 $A$、$B$ の値を定めなさい。`,
        fields: [
          { id: "A", value: A, pre: "$A=$" },
          { id: "B", value: B, pre: "$B=$" },
        ],
        layout: "lines",
        wrongs: [{ values: { A: B, B: A }, mc: "MC-IDENTITY-SWAP" }, { values: { A: -A, B: -B }, mc: "MC-IDENTITY-SIGN" }],
        explain: `両辺に $(${L(a)})(${L(b)})$ をかけると $${px(P.lin(m, n))}=A(${L(b)})+B(${L(a)})$。$x=${a}$ を代入して $${m * a + n}=${a - b}A$ より $A=${A}$。$x=${b}$ を代入して $${m * b + n}=${b - a}B$ より $B=${B}$。`,
      });
    }),
    t(
      "num",
      (r, lv) => {
        // 数値代入：係数の和・定数項・偶数次の係数の和
        if (lv === 1) {
          const [p, q] = until(() => [r.int(1, 3), r.nz(-3, 3)], ([u, v]) => u + v !== 0 && u + v !== 1);
          const n = r.int(3, 5);
          const f = P.lin(p, q).pow(n);
          const sumC = [...f.t.values()].reduce((acc, tm) => add(acc, tm.c), Q(0));
          assert(eq(sumC, Q((p + q) ** n)) && eq(f.eval({ x: 1 }), sumC), "係数の和の検算");
          return num({
            q: `$(${px(P.lin(p, q))})^{${n}}$ を展開したとき、すべての項の係数（定数項もふくむ）の和を求めなさい。`,
            ans: (p + q) ** n,
            wrongs: [[p ** n + q ** n, "MC-IDENTITY-SUBST"], [(p + q) * n, "MC-IDENTITY-SUBST"], [(p + q) ** n - q ** n, "MC-IDENTITY-SUBST"]],
            explain: `$(${px(P.lin(p, q))})^{${n}}=a_0+a_1x+\\cdots+a_{${n}}x^{${n}}$ は $x$ についての恒等式なので、$x=1$ を代入できます。係数の和は $(${p === 1 ? "" : `${p}\\cdot `}1${sgn(q)})^{${n}}=${p + q < 0 ? `(${p + q})` : p + q}^{${n}}=${(p + q) ** n}$。`,
          });
        }
        const base = lv === 2 ? P.lin(r.int(1, 3), r.nz(-3, 3)) : P.coeffs([r.nz(-2, 2), r.nz(-2, 2), 1]);
        const n = lv === 2 ? r.int(3, 5) : r.int(3, 4);
        const f = base.pow(n);
        const f1 = f.eval({ x: 1 });
        const fm1 = f.eval({ x: -1 });
        const even = div(add(f1, fm1), 2);
        const odd = div(sub(f1, fm1), 2);
        const deg = f.degree();
        let evenSum = Q(0);
        for (let d = 0; d <= deg; d += 2) evenSum = add(evenSum, f.coeff(d));
        assert(eq(evenSum, even), "偶数次の係数の和の検算");
        const askEven = r.chance(0.5);
        const ans = askEven ? even : odd;
        return num({
          q: `$(${px(base)})^{${n}}$ を展開したとき、${askEven ? "定数項と $x$ の偶数乗の項" : "$x$ の奇数乗の項"}の係数の和を求めなさい。`,
          ans,
          wrongs: [[f1, "MC-IDENTITY-SUBST"], [askEven ? odd : even, "MC-IDENTITY-SUBST"], [fm1, "MC-IDENTITY-SUBST"]],
          explain: `展開した式を $f(x)=a_0+a_1x+a_2x^2+\\cdots$ とすると、$f(1)$ はすべての係数の和、$f(-1)$ は偶数次の係数の和から奇数次の係数の和をひいたもの。$f(1)=${tq(f1)}$、$f(-1)=${tq(fm1)}$ なので、${askEven ? `偶数次は $\\dfrac{f(1)+f(-1)}{2}` : `奇数次は $\\dfrac{f(1)-f(-1)}{2}`}=${tq(ans)}$。`,
        });
      },
      { id: "b" },
    ),
  ],

  // ── 相加平均と相乗平均の関係 ────────────────────────
  amgm: [
    t("num", (r, lv) => {
      // 数値で最小値を探して検算する
      const gridMin = (fn, lo, hi) => {
        let best = Infinity;
        for (let i = 0; i <= 20000; i++) {
          const x = lo * Math.pow(hi / lo, i / 20000);
          best = Math.min(best, fn(x));
        }
        return best;
      };
      if (lv === 1) {
        const k = r.pick([4, 9, 16, 25, 36, 49, 64, 81]);
        const s = Math.sqrt(k);
        nearly(gridMin((x) => x + k / x, 0.01, 1000), 2 * s, "最小値の検算", 1e-6);
        return num({
          q: `$x>0$ のとき、$x+\\dfrac{${k}}{x}$ の最小値を求めなさい。`,
          ans: 2 * s,
          wrongs: [[s, "MC-AMGM-NO-2"], [k, "MC-AMGM-NO-SQRT"], [2 * k, "MC-AMGM-NO-SQRT"]],
          explain: `$x>0$、$\\dfrac{${k}}{x}>0$ なので、相加平均と相乗平均の関係より $x+\\dfrac{${k}}{x}\\ge 2\\sqrt{x\\cdot\\dfrac{${k}}{x}}=2\\sqrt{${k}}=${2 * s}$。等号は $x=\\dfrac{${k}}{x}$、つまり $x=${s}$ のときに成り立つので、最小値は $${2 * s}$。`,
        });
      }
      if (lv === 2) {
        if (r.chance(0.5)) {
          const [a, b] = until(() => [r.int(1, 9), r.int(1, 36)], ([u, v]) => isqrt(u * v) !== null && u !== v && u > 1);
          const m = 2 * isqrt(a * b);
          nearly(gridMin((x) => a * x + b / x, 0.001, 1000), m, "最小値の検算", 1e-6);
          return num({
            q: `$x>0$ のとき、$${a}x+\\dfrac{${b}}{x}$ の最小値を求めなさい。`,
            ans: m,
            // 係数 a を落として x + b/x の最小値 2√b にしてしまう誤りは、それが整数のときだけ選択肢にする
            wrongs: [[m / 2, "MC-AMGM-NO-2"], [a * b, "MC-AMGM-NO-SQRT"], ...(isqrt(b) !== null ? [[2 * isqrt(b), "MC-AMGM-COEF"]] : [])],
            explain: `$${a}x>0$、$\\dfrac{${b}}{x}>0$ なので $${a}x+\\dfrac{${b}}{x}\\ge2\\sqrt{${a}x\\cdot\\dfrac{${b}}{x}}=2\\sqrt{${a * b}}=${m}$。等号は $${a}x=\\dfrac{${b}}{x}$ のとき（$x^2=${tq(Q(b, a))}$）に成り立つので、最小値は $${m}$。`,
          });
        }
        // x > c のとき x + k/(x − c)
        const c = r.int(1, 5);
        const k = r.pick([1, 4, 9, 16, 25]);
        const s = Math.sqrt(k);
        const ans = 2 * s + c;
        nearly(gridMin((t_) => t_ + c + k / t_, 0.001, 1000), ans, "最小値の検算", 1e-6);
        return num({
          q: `$x>${c}$ のとき、$x+\\dfrac{${k}}{x-${c}}$ の最小値を求めなさい。`,
          ans,
          wrongs: [[2 * s, "MC-AMGM-SHIFT"], [2 * s - c, "MC-AMGM-SHIFT"], [s + c, "MC-AMGM-NO-2"]],
          explain: `$x-${c}>0$ なので、$x+\\dfrac{${k}}{x-${c}}=(x-${c})+\\dfrac{${k}}{x-${c}}+${c}\\ge2\\sqrt{${k}}+${c}=${ans}$。等号は $x-${c}=${s}$、つまり $x=${s + c}$ のとき。最小値は $${ans}$。`,
        });
      }
      // (x + a/y)(y + b/x)（x>0, y>0）：展開してから1回だけ使う
      const [a, b] = until(() => [r.int(1, 9), r.int(1, 9)], ([u, v]) => isqrt(u * v) !== null && u !== v);
      const g = isqrt(a * b);
      const ans = a + b + 2 * g;
      // 検算：t=xy とおくと t + ab/t + a + b。t を動かして最小値
      nearly(gridMin((t_) => t_ + (a * b) / t_ + a + b, 0.001, 1000), ans, "2変数の最小値の検算", 1e-6);
      const wrong = 4 * g; // 2つのかっこに別々に使う（等号が同時に成り立たない）
      assert(wrong !== ans || a === b, "誤答が正解と異なる");
      return num({
        q: `$x>0$、$y>0$ のとき、$\\left(x+\\dfrac{${a}}{y}\\right)\\left(y+\\dfrac{${b}}{x}\\right)$ の最小値を求めなさい。`,
        ans,
        wrongs: [[wrong, "MC-AMGM-EQUALITY"], [a + b, "MC-AMGM-NO-2"], [2 * g, "MC-AMGM-SHIFT"]],
        explain: `展開すると $xy+${b}+${a}+\\dfrac{${a * b}}{xy}=xy+\\dfrac{${a * b}}{xy}+${a + b}$。$xy>0$ なので $xy+\\dfrac{${a * b}}{xy}\\ge2\\sqrt{${a * b}}=${2 * g}$（等号は $xy=${g}$）。よって最小値は $${2 * g}+${a + b}=${ans}$。（かっこごとに相加・相乗平均を使って $2\\sqrt{${a}}\\cdot2\\sqrt{${b}}$ とすると、2つの等号が同時に成り立たないので誤りになります）`,
      });
    }),
    t(
      "num",
      (r, lv) => {
        if (lv === 1) {
          const k = r.pick([4, 9, 16, 25, 36, 49]);
          const s = Math.sqrt(k);
          return num({
            q: `$x>0$ のとき、$x+\\dfrac{${k}}{x}$ が最小となる $x$ の値を求めなさい。`,
            ans: s,
            wrongs: [[2 * s, "MC-AMGM-NO-2"], [k, "MC-AMGM-NO-SQRT"], [k / 2, "MC-AMGM-NO-SQRT"]],
            explain: `相加平均と相乗平均の関係の等号は、2つの数が等しいとき成り立ちます。$x=\\dfrac{${k}}{x}$ より $x^2=${k}$、$x>0$ なので $x=${s}$。（そのときの最小値は $${2 * s}$）`,
          });
        }
        if (lv === 2) {
          const [a, b] = until(() => [r.int(2, 9), r.int(2, 72)], ([u, v]) => Number.isInteger(Math.sqrt(v / u)) && v % u === 0 && u !== v);
          const x0 = Math.sqrt(b / a);
          return num({
            q: `$x>0$ のとき、$${a}x+\\dfrac{${b}}{x}$ が最小となる $x$ の値を求めなさい。`,
            ans: x0,
            // 平方根のとり忘れ（x = b/a）と、最小値そのものを答えてしまう誤り（整数のときだけ）
            wrongs: [[b / a, "MC-AMGM-NO-SQRT"], ...(isqrt(a * b) !== null ? [[2 * isqrt(a * b), "MC-AMGM-VALUE-X"]] : [])],
            explain: `等号が成り立つのは $${a}x=\\dfrac{${b}}{x}$ のとき。$x^2=\\dfrac{${b}}{${a}}=${b / a}$、$x>0$ より $x=${x0}$。`,
          });
        }
        // 面積が S の長方形の、周の長さの最小値
        const S = r.pick([16, 25, 36, 49, 64, 81, 100, 144]);
        const s = Math.sqrt(S);
        // 検算：たての長さ x を動かして 2(x + S/x) の最小
        let best = Infinity;
        for (let i = 1; i <= 100000; i++) {
          const x = (i / 100000) * S;
          best = Math.min(best, 2 * (x + S / x));
        }
        nearly(best, 4 * s, "周の長さの最小値の検算", 1e-6);
        return num({
          q: `面積が $${S}\\,\\mathrm{cm}^2$ の長方形のうち、周の長さが最も短いものの周の長さを求めなさい。`,
          ans: 4 * s,
          post: "$\\,\\mathrm{cm}$",
          wrongs: [[2 * s, "MC-AMGM-NO-2"], [s, "MC-AMGM-NO-2"], [S / 2, "MC-AMGM-NO-SQRT"]],
          explain: `たてを $x$、横を $\\dfrac{${S}}{x}$ とすると、周の長さは $2\\left(x+\\dfrac{${S}}{x}\\right)\\ge 2\\cdot 2\\sqrt{${S}}=${4 * s}$。等号は $x=${s}$（正方形）のとき。最小の周の長さは $${4 * s}\\,\\mathrm{cm}$。`,
        });
      },
      { id: "b" },
    ),
  ],

  // ── 軌跡 ─────────────────────────────────────
  locus: [
    t("fields", (r, lv) => {
      const vec = (p) => `(${p[0]},\\ ${p[1]})`;
      const d2 = (P1, P2) => (P1[0] - P2[0]) ** 2 + (P1[1] - P2[1]) ** 2;
      if (lv === 1) {
        // 2点から等距離（垂直二等分線）y = m x + n
        const [A, B] = until(() => [[r.int(-5, 5), r.int(-5, 5)], [r.int(-5, 5), r.int(-5, 5)]], ([a, b]) => a[0] !== b[0] && a[1] !== b[1] && (a[0] + b[0]) % 2 === 0 && (a[1] + b[1]) % 2 === 0);
        const m = Q(-(B[0] - A[0]), B[1] - A[1]);
        const M = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
        const n = sub(Q(M[1]), mul(m, M[0]));
        // 検算：直線上の点は A、B から等距離
        for (const x of [-3, 0, 2, 7]) {
          const y = qnum(add(mul(m, x), n));
          nearly(d2([x, y], A), d2([x, y], B), "垂直二等分線の検算", 1e-9);
        }
        return fields({
          q: `2点 $A${vec(A)}$、$B${vec(B)}$ から等しい距離にある点 P の軌跡は直線になります。その直線を $y=mx+n$ と表すとき、$m$、$n$ の値を求めなさい。`,
          fields: [
            { id: "m", value: m, pre: "$m=$" },
            { id: "n", value: n, pre: "$n=$" },
          ],
          layout: "lines",
          wrongs: [
            { values: { m: Q(B[1] - A[1], B[0] - A[0]), n: sub(Q(M[1]), mul(Q(B[1] - A[1], B[0] - A[0]), M[0])) }, mc: "MC-LOCUS-PERP" },
            { values: { m, n: add(Q(M[1]), mul(m, M[0])) }, mc: "MC-LOCUS-SIGN" },
          ],
          explain: `P$(x,\\ y)$ とすると $AP^2=BP^2$ より $(x${sgn(-A[0])})^2+(y${sgn(-A[1])})^2=(x${sgn(-B[0])})^2+(y${sgn(-B[1])})^2$。展開して整理すると $x^2$、$y^2$ は消え、$y=${px(P.lin(m, n))}$。これは線分 AB の垂直二等分線です（中点 $${vec(M)}$ を通り、AB に垂直）。`,
        });
      }
      if (lv === 2) {
        // アポロニウスの円：A(p,0), B(q,0), AP:BP = k:1
        const k = r.pick([2, 3]);
        const [p, q] = until(() => [r.int(-6, 6), r.int(-6, 6)], ([u, v]) => u !== v && ((k * k * v - u) % (k * k - 1) === 0) && ((k * Math.abs(u - v)) % (k * k - 1) === 0));
        const cx = (k * k * q - p) / (k * k - 1);
        const rad_ = (k * Math.abs(p - q)) / (k * k - 1);
        // 検算：円周上の点で比が k:1
        for (const th of [0.3, 1.7, 2.9, 4.4]) {
          const Pt = [cx + rad_ * Math.cos(th), rad_ * Math.sin(th)];
          nearly(Math.sqrt(d2(Pt, [p, 0])) / Math.sqrt(d2(Pt, [q, 0])), k, "アポロニウスの円の検算", 1e-9);
        }
        return fields({
          q: `2点 $A(${p},\\ 0)$、$B(${q},\\ 0)$ に対して、$AP:BP=${k}:1$ となる点 P の軌跡は円になります。その円の中心 $(a,\\ 0)$ の $a$ と、半径 $r$ を求めなさい。`,
          fields: [
            { id: "a", value: cx, pre: "$a=$" },
            { id: "r", value: rad_, pre: "$r=$" },
          ],
          layout: "lines",
          wrongs: [
            { values: { a: (k * k * p - q) / (k * k - 1), r: rad_ }, mc: "MC-LOCUS-RATIO" },
            { values: { a: cx, r: rad_ * rad_ }, mc: "MC-LOCUS-RADIUS" },
            { values: { a: (p + q) / 2, r: Math.abs(p - q) / 2 }, mc: "MC-LOCUS-RATIO" },
          ],
          explain: `P$(x,\\ y)$ とすると $AP=${k}BP$ より $AP^2=${k * k}BP^2$。$(x${sgn(-p)})^2+y^2=${k * k}\\{(x${sgn(-q)})^2+y^2\\}$ を整理すると $(x${sgn(-cx)})^2+y^2=${rad_ * rad_}$。中心 $(${cx},\\ 0)$、半径 $${rad_}$ の円です。`,
        });
      }
      // 円周上の点と定点を結ぶ線分の中点
      const R = r.pick([2, 4, 6, 8, 10]);
      const A = [r.int(-6, 6) * 2, r.int(-6, 6) * 2];
      const C = [A[0] / 2, A[1] / 2];
      for (const th of [0.2, 1.1, 2.5, 5.0]) {
        const Qp = [R * Math.cos(th), R * Math.sin(th)];
        const M = [(A[0] + Qp[0]) / 2, (A[1] + Qp[1]) / 2];
        nearly(Math.sqrt(d2(M, C)), R / 2, "中点の軌跡の検算", 1e-9);
      }
      return fields({
        q: `点 Q が円 $x^2+y^2=${R * R}$ の上を動くとき、点 $A${vec(A)}$ と Q を結ぶ線分 AQ の中点 P の軌跡は円になります。その円の中心 $(a,\\ b)$ と半径 $r$ を求めなさい。`,
        fields: [
          { id: "a", value: C[0], pre: "$a=$" },
          { id: "b", value: C[1], pre: "$b=$" },
          { id: "r", value: R / 2, pre: "$r=$" },
        ],
        layout: "lines",
        wrongs: [
          { values: { a: A[0], b: A[1], r: R }, mc: "MC-LOCUS-MIDPOINT" },
          { values: { a: C[0], b: C[1], r: R }, mc: "MC-LOCUS-MIDPOINT" },
          { values: { a: C[0], b: C[1], r: (R * R) / 4 }, mc: "MC-LOCUS-RADIUS" },
        ],
        explain: `Q$(s,\\ t)$、P$(x,\\ y)$ とすると $x=\\dfrac{${A[0]}+s}{2}$、$y=\\dfrac{${A[1]}+t}{2}$ なので、$s=2x${sgn(-A[0])}$、$t=2y${sgn(-A[1])}$。$s^2+t^2=${R * R}$ に代入して $(2x${sgn(-A[0])})^2+(2y${sgn(-A[1])})^2=${R * R}$、つまり $(x${sgn(-C[0])})^2+(y${sgn(-C[1])})^2=${(R * R) / 4}$。中心 $${vec(C)}$、半径 $${R / 2}$。`,
      });
    }),
    t(
      "fields",
      (r, lv) => {
        // 放物線 y = x² − 2tx + f(t) の頂点 (t, f(t) − t²) の軌跡：y = A x² + B x + C
        const [al, be, ga] = lv === 1 ? [1, r.nz(-4, 4), 0] : lv === 2 ? [1, r.nz(-4, 4), r.nz(-5, 5)] : [r.pick([2, 3, -1]), r.nz(-4, 4), r.nz(-5, 5)];
        // f(t) = al t² + be t + ga → 頂点の y = (al − 1)t² + be t + ga
        const A = al - 1;
        const fT = (tt) => al * tt * tt + be * tt + ga;
        for (const tt of [-2, 0.5, 3]) {
          // 頂点の座標を平方完成でなく、微分（放物線の軸）から求めて確かめる：x = t、y = t² − 2t·t + f(t)
          const vx = tt;
          const vy = tt * tt - 2 * tt * tt + fT(tt);
          nearly(vy, A * vx * vx + be * vx + ga, "頂点の軌跡の検算", 1e-9);
        }
        const fTex = px(P.coeffs([ga, be, al], "t"), ["t"]);
        return fields({
          q: `$t$ がすべての実数値をとって変化するとき、放物線 $y=x^2-2tx+${fTex.startsWith("-") ? `(${fTex})` : fTex}$ の頂点の軌跡は $y=ax^2+bx+c$ と表せます。$a$、$b$、$c$ の値を求めなさい。`,
          fields: [
            { id: "a", value: A, pre: "$a=$" },
            { id: "b", value: be, pre: "$b=$" },
            { id: "c", value: ga, pre: "$c=$" },
          ],
          layout: "lines",
          wrongs: [
            { values: { a: al, b: be, c: ga }, mc: "MC-LOCUS-VERTEX" },
            { values: { a: al + 1, b: be, c: ga }, mc: "MC-LOCUS-VERTEX" },
            { values: { a: A, b: -be, c: ga }, mc: "MC-LOCUS-SIGN" },
          ],
          explain: `平方完成すると $y=(x-t)^2-t^2+${fTex.startsWith("-") ? `(${fTex})` : fTex}$ なので、頂点は $(t,\\ ${px(P.coeffs([ga, be, A], "t"), ["t"])})$。$x=t$ とおいて $t$ を消去すると、$y=${px(P.coeffs([ga, be, A]))}$。${A === 0 ? "（2次の項が消えて直線になります）" : ""}`,
        });
      },
      { id: "b" },
    ),
  ],

  // ── 不等式の表す領域 ─────────────────────────────
  region: [
    t("num", (r, lv) => {
      if (lv <= 2) {
        // 連立1次不等式の領域で px + qy の最大値
        let cons; // [a, b, c]：ax + by ≤ c
        let verts;
        let p;
        let q;
        if (lv === 1) {
          const k = r.int(3, 9);
          cons = [[1, 1, k]];
          verts = [[0, 0], [k, 0], [0, k]];
          [p, q] = until(() => [r.int(1, 7), r.int(1, 7)], ([u, v]) => u !== v);
        } else {
          // 交点 (X0, Y0) が格子点になる2本の直線と、最大がその交点になる px + qy をいっしょに選ぶ。
          // 直線1の傾きのほうが急（a1/b1 > a2/b2）なので、a2/b2 < p/q < a1/b1 なら最大は交点でただ1つ
          const [X0, Y0, a1, b1, a2, b2, pp, qq] = until(
            () => [r.int(1, 6), r.int(1, 6), r.int(1, 5), r.int(1, 5), r.int(1, 5), r.int(1, 5), r.int(1, 7), r.int(1, 7)],
            ([, , u1, v1, u2, v2, u, v]) => u1 * v2 - u2 * v1 !== 0 && u1 / v1 > u2 / v2 && u2 / v2 < u / v && u / v < u1 / v1 && u !== v,
            2000,
          );
          [p, q] = [pp, qq];
          cons = [[a1, b1, a1 * X0 + b1 * Y0], [a2, b2, a2 * X0 + b2 * Y0]];
          // 頂点：原点、x 軸との交点（小さい方）、y 軸との交点（小さい方）、2直線の交点
          const xInt = Math.min(...cons.map(([a, , c]) => c / a));
          const yInt = Math.min(...cons.map(([, b, c]) => c / b));
          verts = [[0, 0], [xInt, 0], [0, yInt], [X0, Y0]];
        }
        const vals = verts.map(([x, y]) => p * x + q * y);
        const ans = Math.max(...vals);
        // 検算1：境界の直線（x=0, y=0 と各不等式の境界）どうしの交点をすべて有理数で求め、領域内のものの最大値
        const lines = [[1, 0, 0], [0, 1, 0], ...cons]; // ax + by = c
        const inside = (x, y) => x.n >= 0 && y.n >= 0 && cons.every(([a, b, c]) => qnum(add(mul(a, x), mul(b, y))) <= c + 1e-12);
        let exact = null;
        for (let i = 0; i < lines.length; i++) {
          for (let j = i + 1; j < lines.length; j++) {
            const [a1_, b1_, c1_] = lines[i];
            const [a2_, b2_, c2_] = lines[j];
            const det = a1_ * b2_ - a2_ * b1_;
            if (det === 0) continue;
            const x = Q(c1_ * b2_ - c2_ * b1_, det);
            const y = Q(a1_ * c2_ - a2_ * c1_, det);
            if (!inside(x, y)) continue;
            const v = add(mul(p, x), mul(q, y));
            if (exact === null || qnum(v) > qnum(exact)) exact = v;
          }
        }
        assert(exact !== null && eq(exact, Q(ans)), "頂点の値による最大値の検算");
        // 検算2：格子点で調べて、最大値をこえる点がないこと
        const maxX = Math.max(...verts.map((v) => v[0]));
        const maxY = Math.max(...verts.map((v) => v[1]));
        for (let i = 0; i <= 200; i++) {
          for (let j = 0; j <= 200; j++) {
            const x = (maxX * i) / 200;
            const y = (maxY * j) / 200;
            if (cons.every(([a, b, c]) => a * x + b * y <= c + 1e-9)) assert(p * x + q * y <= ans + 1e-9, "格子点で最大値をこえない");
          }
        }
        const sys = `\\begin{cases} x\\ge 0,\\ y\\ge 0 \\\\ ${cons.map(([a, b, c]) => `${a === 1 ? "" : a}x+${b === 1 ? "" : b}y\\le ${c}`).join(" \\\\ ")} \\end{cases}`;
        const others = vals.filter((v) => v !== ans);
        return num({
          q: `$x$、$y$ が連立不等式 $${sys}$ を満たすとき、$${p}x+${q}y$ の最大値を求めなさい。`,
          ans,
          wrongs: [...others.slice(1).map((v) => [v, "MC-REGION-VERTEX"]), [p * verts[1][0] + q * verts[2][1], "MC-REGION-VERTEX"]],
          explain: `不等式の表す領域は、${lv === 1 ? "3点" : "4点"} ${verts.map((v) => `$(${tq(Q(Math.round(v[0] * 60), 60))},\\ ${tq(Q(Math.round(v[1] * 60), 60))})$`).join("、")} を頂点とする${lv === 1 ? "三角形" : "四角形"}（周と内部）です。$${p}x+${q}y=k$ とおいた直線が領域と共有点をもつような $k$ の最大値を考えると、頂点で調べればよく、それぞれ ${vals.map((v) => `$${tq(Q(Math.round(v * 60), 60))}$`).join("、")}。最大値は $${ans}$。`,
        });
      }
      // 円の内部で ax + by の最大・最小
      const [a, b, c] = r.pick([[3, 4, 5], [4, 3, 5], [5, 12, 13], [12, 5, 13], [6, 8, 10], [8, 6, 10], [8, 15, 17]]);
      const R = r.pick([1, 2, 3, 4, 5]);
      const sa = r.chance(0.5) ? 1 : -1;
      const askMax = r.chance(0.5);
      const ans = askMax ? c * R : -c * R;
      let best = askMax ? -Infinity : Infinity;
      for (let i = 0; i < 20000; i++) {
        const th = (2 * Math.PI * i) / 20000;
        const v = sa * a * R * Math.cos(th) + b * R * Math.sin(th);
        best = askMax ? Math.max(best, v) : Math.min(best, v);
      }
      nearly(best, ans, "円の領域での最大・最小の検算", 1e-6);
      return num({
        q: `$x$、$y$ が $x^2+y^2\\le ${R * R}$ を満たすとき、$${sa < 0 ? "-" : ""}${a}x+${b}y$ の${askMax ? "最大値" : "最小値"}を求めなさい。`,
        ans,
        wrongs: [[askMax ? (a + b) * R : -(a + b) * R, "MC-REGION-CIRCLE"], [askMax ? c * R * R : -c * R * R, "MC-REGION-CIRCLE"], [-ans, "MC-REGION-SIDE"]],
        explain: `$${sa < 0 ? "-" : ""}${a}x+${b}y=k$ とおくと、これは直線を表します。この直線が円 $x^2+y^2=${R * R}$ と共有点をもつ条件は、原点と直線の距離が半径以下：$\\dfrac{|k|}{\\sqrt{${a}^2+${b}^2}}\\le ${R}$、つまり $-${c * R}\\le k\\le ${c * R}$。${askMax ? "最大値" : "最小値"}は $${ans}$（直線が円に接するとき）。`,
      });
    }),
    t(
      "choice",
      (r, lv) => {
        // 図の斜線部分（境界をふくむ）を表す不等式
        const within = (x, y) => x >= -5 && x <= 5 && y >= -5 && y <= 5;
        let correct;
        let wrongs;
        let fig;
        let test; // 正解の判定（点 (x,y) が領域にあるか）
        let testsWrong; // 誤答それぞれの判定
        let expl;
        if (lv === 1) {
          const m = r.nz(-2, 2);
          const n = r.int(-2, 2);
          const above = r.chance(0.5);
          const line = `y${above ? "\\ge" : "\\le"} ${px(P.lin(m, n))}`;
          correct = line;
          const ge = above ? "\\ge" : "\\le";
          const cmpF = (lhs, rhs) => (above ? lhs >= rhs : lhs <= rhs);
          wrongs = [
            [`y${above ? "\\le" : "\\ge"} ${px(P.lin(m, n))}`, "MC-REGION-SIDE"],
            [`y${ge} ${px(P.lin(-m, n))}`, "MC-REGION-SLOPE"],
            [`y${ge} ${px(P.lin(m, -n))}`, "MC-REGION-SLOPE"],
            [`y${ge} ${px(P.lin(n, m))}`, "MC-REGION-SLOPE"],
            [`x${ge} ${px(P.lin(m, n)).replace(/x/g, "y")}`, "MC-REGION-SIDE"],
          ];
          test = (x, y) => cmpF(y, m * x + n);
          testsWrong = [(x, y) => !cmpF(y, m * x + n) || y === m * x + n, (x, y) => cmpF(y, -m * x + n), (x, y) => cmpF(y, m * x - n), (x, y) => cmpF(y, n * x + m), (x, y) => cmpF(x, m * y + n)];
          const hi = above ? () => 5.5 : (x) => m * x + n;
          const lo = above ? (x) => m * x + n : () => -5.5;
          fig = coordPlane({ x: [-5, 5], y: [-5, 5], lines: [{ a: m, b: n }], fills: [{ x0: -5, x1: 5, hi, lo }], cell: 22 });
          expl = `塗られているのは、直線 $y=${px(P.lin(m, n))}$ の${above ? "上側" : "下側"}です。直線の上側は $y>${px(P.lin(m, n))}$、下側は $y<${px(P.lin(m, n))}$ で表し、境界線をふくむので等号をつけて $${line}$。`;
        } else if (lv === 2) {
          // 円の内部（または外部）と直線の上側（または下側）の共通部分
          const R = r.pick([2, 3, 4]);
          const n = r.int(-1, 1);
          const above = r.chance(0.5);
          correct = `\\begin{cases} x^2+y^2\\le ${R * R} \\\\ y${above ? "\\ge" : "\\le"} ${px(P.lin(1, n))} \\end{cases}`;
          wrongs = [
            [`\\begin{cases} x^2+y^2\\ge ${R * R} \\\\ y${above ? "\\ge" : "\\le"} ${px(P.lin(1, n))} \\end{cases}`, "MC-REGION-SIDE"],
            [`\\begin{cases} x^2+y^2\\le ${R * R} \\\\ y${above ? "\\le" : "\\ge"} ${px(P.lin(1, n))} \\end{cases}`, "MC-REGION-SIDE"],
            [`\\begin{cases} x^2+y^2\\le ${R} \\\\ y${above ? "\\ge" : "\\le"} ${px(P.lin(1, n))} \\end{cases}`, "MC-REGION-RADIUS"],
          ];
          const circ = (x) => Math.sqrt(Math.max(0, R * R - x * x));
          test = (x, y) => x * x + y * y <= R * R && (above ? y >= x + n : y <= x + n);
          testsWrong = [(x, y) => x * x + y * y >= R * R && (above ? y >= x + n : y <= x + n), (x, y) => x * x + y * y <= R * R && (above ? y <= x + n : y >= x + n), (x, y) => x * x + y * y <= R && (above ? y >= x + n : y <= x + n)];
          // 図：円の内部で、直線の上側（下側）を塗る
          const hi = (x) => (above ? circ(x) : Math.min(circ(x), x + n));
          const lo = (x) => (above ? Math.max(-circ(x), x + n) : -circ(x));
          fig = coordPlane({ x: [-5, 5], y: [-5, 5], lines: [{ a: 1, b: n }], params: [{ x: (th) => R * Math.cos(th), y: (th) => R * Math.sin(th), t0: 0, t1: 2 * Math.PI }], fills: [{ x0: -R, x1: R, hi: (x) => Math.max(hi(x), lo(x)), lo }], cell: 22 });
          expl = `塗られているのは、円 $x^2+y^2=${R * R}$ の内部（$x^2+y^2\\le ${R * R}$）で、しかも直線 $y=${px(P.lin(1, n))}$ の${above ? "上側" : "下側"}の部分です。よって $${correct}$。（円の半径は $${R}$ なので、右辺は $${R}^2=${R * R}$）`;
        } else {
          // 放物線と直線ではさまれた部分
          const [p, q] = until(() => [r.int(-3, 0), r.int(0, 3)], ([u, v]) => v - u >= 2 && v - u <= 4);
          // y = (x − p)(x − q) + … の形の放物線 y = x² + bx + c と、直線 y = mx + k が x = p, q で交わる
          const m = r.int(-1, 1);
          const k = r.int(0, 2);
          const B = m - (p + q);
          const C = k + p * q;
          const par = (x) => x * x + B * x + C;
          const ln = (x) => m * x + k;
          nearly(par(p), ln(p), "交点の検算", 1e-9);
          nearly(par(q), ln(q), "交点の検算", 1e-9);
          correct = `\\begin{cases} y\\ge ${px(P.coeffs([C, B, 1]))} \\\\ y\\le ${px(P.lin(m, k))} \\end{cases}`;
          wrongs = [
            [`\\begin{cases} y\\le ${px(P.coeffs([C, B, 1]))} \\\\ y\\ge ${px(P.lin(m, k))} \\end{cases}`, "MC-REGION-SIDE"],
            [`\\begin{cases} y\\ge ${px(P.coeffs([C, B, 1]))} \\\\ y\\ge ${px(P.lin(m, k))} \\end{cases}`, "MC-REGION-SIDE"],
            [`\\begin{cases} y\\le ${px(P.coeffs([C, B, 1]))} \\\\ y\\le ${px(P.lin(m, k))} \\end{cases}`, "MC-REGION-SIDE"],
          ];
          test = (x, y) => y >= par(x) && y <= ln(x);
          testsWrong = [(x, y) => y <= par(x) && y >= ln(x), (x, y) => y >= par(x) && y >= ln(x), (x, y) => y <= par(x) && y <= ln(x)];
          fig = coordPlane({ x: [-5, 5], y: [-5, 5], lines: [{ a: m, b: k }], curves: [{ fn: par }], fills: [{ x0: p, x1: q, hi: ln, lo: par }], cell: 22 });
          expl = `塗られているのは、放物線 $y=${px(P.coeffs([C, B, 1]))}$ の上側で、しかも直線 $y=${px(P.lin(m, k))}$ の下側の部分です（2つは $x=${p}$、$${q}$ で交わる）。よって $${correct}$。`;
        }
        // 検算：格子点で、正解の不等式が図の塗り方と一致し、誤答は少なくとも1点で一致しない
        const samples = [];
        for (let x = -4.9; x <= 4.9; x += 0.2) for (let y = -4.9; y <= 4.9; y += 0.2) if (within(x, y)) samples.push([x, y]);
        assert(samples.some(([x, y]) => test(x, y)), "領域に点がある");
        // 正解と同じ領域を表してしまう誤答（例：y≧−x と x≧−y）は選択肢から除く
        const distinct = wrongs.filter((_, i) => samples.some(([x, y]) => testsWrong[i](x, y) !== test(x, y)));
        return choice({
          q: `図の色のついた部分（境界線をふくむ）を表す${lv === 1 ? "不等式" : "連立不等式"}はどれですか。`,
          fig,
          correct: $(correct),
          wrongs: distinct.map(([w, mc]) => [$(w), mc]),
          explain: expl,
        });
      },
      { id: "b" },
    ),
  ],

  // ── 常用対数の利用（桁数・小数首位） ─────────────────
  log_common: [
    t("num", (r, lv) => {
      // log₁₀2 = 0.3010、log₁₀3 = 0.4771 を使う（問題文で与える）。答えは BigInt で厳密に確かめる
      const L2 = 0.301;
      const L3 = 0.4771;
      const givenTex = "\\log_{10}2=0.3010,\\ \\log_{10}3=0.4771";
      /** 近似値の丸めで答えが変わりそうな数（整数部分の境目のすぐ近く）は使わない */
      const safe = (lg) => lg - Math.floor(lg) >= 0.01 && Math.ceil(lg) - lg >= 0.01;
      if (lv <= 2) {
        const bases = lv === 1 ? [[2, 1, 0], [3, 0, 1]] : [[6, 1, 1], [12, 2, 1], [18, 1, 2], [5, -1, 0]];
        // 5 は 10/2 と考えて log 5 = 1 − log 2
        const logOf = ([base, e2, e3], n) => (base === 5 ? n * (1 - L2) : n * (e2 * L2 + e3 * L3));
        const [bs, n] = until(
          () => [r.pick(bases), r.int(lv === 1 ? 20 : 15, lv === 1 ? 80 : 50)],
          ([b0, n0]) => {
            const lg0 = logOf(b0, n0);
            return safe(lg0) && Math.floor(lg0) + 1 === (BigInt(b0[0]) ** BigInt(n0)).toString().length;
          },
        );
        const [base, e2, e3] = bs;
        const lg = logOf(bs, n);
        const ans = Math.floor(lg) + 1;
        const coefLog = (c, v) => (c === 0 ? "" : `${c === 1 ? "" : c}\\log_{10}${v}`);
        const inner = `${coefLog(e2, 2)}${e2 && e3 ? "+" : ""}${coefLog(e3, 3)}`;
        const logTex = base === 5 ? `\\log_{10}5^{${n}}=${n}(1-\\log_{10}2)` : `\\log_{10}${base}^{${n}}=${n}${e2 && e3 ? `(${inner})` : inner}`;
        return num({
          q: `$${givenTex}$ とします。$${base}^{${n}}$ は何けたの整数ですか。`,
          ans,
          wrongs: [[ans - 1, "MC-DIGITS-NO-PLUS1"], [Math.round(lg), "MC-DIGITS-ROUND"], [ans + 1, "MC-DIGITS-NO-PLUS1"]],
          explain: `$${logTex}=${Math.round(lg * 10000) / 10000}$。よって $10^{${Math.floor(lg)}}<${base}^{${n}}<10^{${Math.floor(lg) + 1}}$ なので、$${base}^{${n}}$ は $${ans}$ けたの整数です。（$10^{k}$ は $k+1$ けた）`,
        });
      }
      // 小数首位：(1/2)^n、(1/3)^n、(2/3)^n
      const KINDS = [
        { tex: "\\left(\\dfrac12\\right)", lg1: -L2, num: 1n, den: 2n },
        { tex: "\\left(\\dfrac13\\right)", lg1: -L3, num: 1n, den: 3n },
        { tex: "\\left(\\dfrac23\\right)", lg1: L2 - L3, num: 2n, den: 3n },
      ];
      const [kd, n] = until(
        () => [r.pick(KINDS), r.int(10, 40)],
        ([k0, n0]) => {
          const lg0 = n0 * k0.lg1;
          const k = -Math.floor(lg0);
          // 厳密：num^n / den^n が 10^{−k} 以上 10^{−(k−1)} 未満
          const N = k0.num ** BigInt(n0);
          const D = k0.den ** BigInt(n0);
          return safe(lg0) && N * 10n ** BigInt(k) >= D && N * 10n ** BigInt(k - 1) < D;
        },
      );
      const lg = n * kd.lg1;
      const k = -Math.floor(lg);
      return num({
        q: `$${givenTex}$ とします。$${kd.tex}^{${n}}$ を小数で表すと、小数第何位に初めて $0$ でない数字が現れますか。`,
        ans: k,
        wrongs: [[k - 1, "MC-DIGITS-NO-PLUS1"], [k + 1, "MC-DIGITS-NO-PLUS1"], [Math.round(-lg), "MC-DIGITS-ROUND"]],
        explain: `$\\log_{10}${kd.tex}^{${n}}=${Math.round(lg * 10000) / 10000}$ なので、$10^{${-k}}\\le ${kd.tex}^{${n}}<10^{${-k + 1}}$。$10^{-${k}}=0.${"0".repeat(k - 1)}1$ 以上なので、小数第 $${k}$ 位に初めて $0$ でない数字が現れます。`,
      });
    }),
    t(
      "num",
      (r, lv) => {
        // 最高位の数字（log 2・log 3 から log 4〜log 6 もわかる）
        const L = { 1: 0, 2: 0.301, 3: 0.4771, 4: 0.602, 5: 0.699, 6: 0.7781 };
        const givenTex = "\\log_{10}2=0.3010,\\ \\log_{10}3=0.4771";
        const bases = lv === 1 ? [2] : lv === 2 ? [2, 3] : [3, 6, 12];
        const logBase = { 2: 0.301, 3: 0.4771, 6: 0.7781, 12: 1.0791 };
        const [base, n] = until(
          () => [r.pick(bases), r.int(15, 60)],
          ([b0, n0]) => {
            const lg0 = n0 * logBase[b0];
            const fr = lg0 - Math.floor(lg0);
            // 小数部分が log 1〜log 6 の境目から離れていて、最高位が 1〜5（log 7 を使わずに決まる）
            const edges = [0, 0.301, 0.4771, 0.602, 0.699, 0.7781];
            if (fr >= 0.7781 - 0.004 || edges.some((e) => Math.abs(fr - e) < 0.004)) return false;
            const lead = Number((BigInt(b0) ** BigInt(n0)).toString()[0]);
            const dLead = [1, 2, 3, 4, 5].filter((d) => fr >= L[d] && fr < L[d + 1])[0];
            return lead === dLead;
          },
        );
        const lg = n * logBase[base];
        const fr = lg - Math.floor(lg);
        const lead = Number((BigInt(base) ** BigInt(n)).toString()[0]);
        const lo = L[lead];
        const hi = L[lead + 1];
        return num({
          q: `$${givenTex}$ とします。$${base}^{${n}}$ の最高位の数字を求めなさい。`,
          ans: lead,
          wrongs: [[lead + 1, "MC-DIGITS-LEAD"], [lead - 1 >= 1 ? lead - 1 : 9, "MC-DIGITS-LEAD"], [Math.floor(lg) + 1, "MC-DIGITS-LEAD"]],
          explain: `$\\log_{10}${base}^{${n}}=${Math.round(lg * 10000) / 10000}$。小数部分 $${Math.round(fr * 10000) / 10000}$ について、$\\log_{10}${lead}=${lo === 0 ? "0" : lo.toFixed(4)}\\le ${Math.round(fr * 10000) / 10000}<${hi.toFixed(4)}=\\log_{10}${lead + 1}$ なので、$${lead}\\times10^{${Math.floor(lg)}}\\le ${base}^{${n}}<${lead + 1}\\times 10^{${Math.floor(lg)}}$。最高位の数字は $${lead}$。（$\\log_{10}4=2\\log_{10}2$、$\\log_{10}5=1-\\log_{10}2$、$\\log_{10}6=\\log_{10}2+\\log_{10}3$）`,
        });
      },
      { id: "b" },
    ),
  ],
};

/**
 * 「公正なコイン」などのシミュレーション結果の表（1000 回分）。seed つき乱数で実際にくり返して作る。
 *  decision=true のときは、判断があいまいになりすぎないよう、割合が 0.05 から少し離れる K を選ぶ。
 */
function simTable(r, lv, decision = false) {
  const ctx = r.pick([
    { n: 20, story: (n) => `表と裏が同じ確率で出るコインを ${n} 回投げて表の出た回数を記録する実験を、$1000$ 回くり返しました。表の出た回数ごとの度数は次のとおりです。`, unitName: "表の出た回数", unit: "回", trial: "実際にあるコインを 20 回投げた", null: "このコインは表と裏が同じ確率で出る", claim: "このコインは表が出やすい", opposite: "このコインは裏が出やすい" },
    { n: 20, story: (n) => `2つの商品 A、B について「どちらが好きか」を ${n} 人にたずねたとき、A と答える人数を、それぞれの人が確率 $\\frac12$ で A を選ぶとしてシミュレーションしました。これを $1000$ 回くり返した結果が次の表です。`, unitName: "A と答えた人数", unit: "人", trial: "実際に 20 人にたずねた", null: "A と B の好まれ方に差はない", claim: "A のほうが好まれている", opposite: "B のほうが好まれている" },
    { n: 10, story: (n) => `表と裏が同じ確率で出るコインを ${n} 回投げて表の出た回数を記録する実験を、$1000$ 回くり返しました。表の出た回数ごとの度数は次のとおりです。`, unitName: "表の出た回数", unit: "回", trial: "実際にあるコインを 10 回投げた", null: "このコインは表と裏が同じ確率で出る", claim: "このコインは表が出やすい", opposite: "このコインは裏が出やすい" },
  ]);
  const n = lv === 1 ? 10 : ctx.n;
  const freq = Array(n + 1).fill(0);
  for (let s = 0; s < 1000; s++) {
    let h = 0;
    for (let i = 0; i < n; i++) if (r.next() < 0.5) h++;
    freq[h]++;
  }
  assert(freq.reduce((a, b) => a + b, 0) === 1000, "度数の合計");
  // 表の行：端は「◯以下」「◯以上」にまとめる（n=20 のとき 4以下・16以上）
  const loCut = n === 20 ? 4 : 0;
  const hiCut = n === 20 ? 16 : n;
  const rowsArr = [];
  for (let k = loCut; k <= hiCut; k++) {
    const label = k === loCut && loCut > 0 ? `${k}\\text{以下}` : k === hiCut && hiCut < n ? `${k}\\text{以上}` : String(k);
    const f = k === loCut && loCut > 0 ? freq.slice(0, k + 1).reduce((a, b) => a + b, 0) : k === hiCut && hiCut < n ? freq.slice(k).reduce((a, b) => a + b, 0) : freq[k];
    rowsArr.push([label, f]);
  }
  const rows = `\\begin{array}{c|c} ${tx(ctx.unitName)} & ${tx("度数")} \\\\ \\hline ${rowsArr.map(([a, b]) => `${a} & ${b}`).join(" \\\\ ")} \\\\ \\hline ${tx("計")} & 1000 \\end{array}`;
  const count = (pred) => freq.reduce((a, f, k) => a + (pred(k) ? f : 0), 0);
  // K は、表で区別できる範囲（まとめた行より内側）から選ぶ
  const cands = [];
  for (let K = Math.ceil(n / 2) + 2; K <= hiCut - (hiCut < n ? 1 : 0); K++) {
    const p = count((k) => k >= K) / 1000;
    if (decision ? Math.abs(p - 0.05) >= 0.008 && p > 0.003 && p < 0.3 : p > 0.002 && p < 0.4) cands.push(K);
  }
  assert(cands.length > 0, "K の候補がある");
  const K = r.pick(cands);
  return { n, K, rows, count, story: ctx.story(n), unitName: ctx.unitName, unit: ctx.unit, trial: ctx.trial.replace("20", String(n)), null: ctx.null, claim: ctx.claim, opposite: ctx.opposite };
}
