// ============================================================
// ichiji-03.js — 一次関数 第3時「変化の割合を調べよう」（増加量・変化の割合）
//   ikkan の演習プリント（ichiji-03.dr.1〜8）・小テスト（ichiji-03.qz.1〜5）を、コツコツくんのテンプレートにしたもの。
//   テンプレート id＝「03」＋ d（演習）／q（小テスト）＋ ikkan の問題の番号（＋ 小問・型ごとに a, b…）。例：03d07b ＝ ichiji-03.dr.7 の②
//   変化の割合・y の増加量は、linear.js の直線 line と rate・dy・yAt から計算する（手で書かない）。減少は負の数の増加量として扱う。
//   「式を表す」（ろうそくの式 y＝−3/5x+24）は、ありがちな誤答（符号まちがい・割合の逆数）をならべた4択にした。
//   dr.6 の表（x と y の対応）は、「x＝0 のとき y＝7、x＝2 のとき y＝13」のように対応を文で言い、残りの x のときの y を聞く問題にした。
// ============================================================
import { t, pick, choices4, rnz, gcd } from "../kit.js";
import { unitFor } from "../unit-kit.js";
import { Q, qadd, qiszero } from "../algebra.js";
import { line, yAt, xAt, rate, dy, ltex, qt, num } from "../linear.js";

const unit = unitFor("ichiji");

// ── 道具（この授業の問題用に足した小さな関数）──────────────────────────
const $ = (s) => `$${s}$`;
const L = (l) => $(ltex(l));
const axt = (a) => ltex(line(a, 0)).slice(2);
const nz = (r, m) => rnz(r, -m, m);
/** 負の数にかっこ：par(-3) → (-3)。Q も受けつける */
const par = (x) => { const v = Array.isArray(x) ? x : [x, 1]; return v[0] < 0 ? `(${qt(v)})` : qt(v); };
/** 直線 l に x を入れた計算と値の TeX：2\times 3-7=-1 */
const subTex = (l, x) => {
  const xv = Array.isArray(x) ? x : [x, 1], xs = qt(xv), xp = xv[0] < 0 ? `(${xs})` : xs;
  const s = l.a[0] === 1 && l.a[1] === 1 ? xs : l.a[0] === -1 && l.a[1] === 1 ? `-${xp}` : `${qt(l.a)}\\times ${xp}`;
  const b = qiszero(l.b) ? "" : `${l.b[0] < 0 ? "-" : "+"}${qt([Math.abs(l.b[0]), l.b[1]])}`;
  return `${s}${b}=${qt(yAt(l, xv))}`;
};
const solveTex = (l, y0) => {
  const out = [`${y0}=${ltex(l).slice(2)}`];
  if (!qiszero(l.b)) out.push(`${axt(l.a)}=${qt(qadd([y0, 1], [-l.b[0], l.b[1]]))}`);
  if (!(l.a[0] === 1 && l.a[1] === 1)) out.push(`x=${qt(xAt(l, y0))}`);
  return out;
};
const solveLine = (l, y0) => solveTex(l, y0).map($).join("、");
const lineChoices = (r, right, wrongs) => {
  const ans = L(right), seen = new Set([ltex(right)]), ws = [];
  for (const w of wrongs) {
    if (!w || qiszero(w.a)) continue;
    const s = ltex(w);
    if (seen.has(s)) continue;
    seen.add(s); ws.push($(s));
  }
  const fill = (i) => {
    const d = [1, -1, 2, -2, 3, -3][i % 6], w = i % 12 < 6 ? line(qadd(right.a, Q(d)), right.b) : line(right.a, qadd(right.b, Q(d)));
    return qiszero(w.a) || seen.has(ltex(w)) ? null : $(ltex(w));
  };
  return { ans, choices: choices4(r, ans, ws, fill) };
};
/** 約分した分数 m/n（m、n は整数。n は正）の TeX：-\frac{2}{5}。整数なら整数 */
const fr = (m, n) => qt(Q(m, n));
/** 「y が d 増加（減少）する」の言い方 */
const upDown = (d) => (d < 0 ? `${-d} 減少する` : `${d} 増加する`);

// ── 変化の割合を読みとる式のいろいろ ─────────────────────────────
/** 整数の a の式。form＝std（ax+b）／rev（b+ax）／prop（ax） */
const intForm = (r, form, am = 9, bm = 9) => {
  const a = nz(r, am), b = form === "prop" ? 0 : nz(r, bm), std = ltex(line(a, b));
  return { tex: form === "rev" ? `y=${b}${a < 0 ? "-" : "+"}${axt(Math.abs(a))}` : std, a: Q(a), std, form };
};
/** 分数の a の式（x/d、(m/n)x+c など） */
const fracForm = (r) => {
  const d = r(2, 6);
  if (r(0, 1) === 0) {
    const neg = pick(r, [1, -1]) < 0, c = pick(r, [0, 0, nz(r, 9)]), a = Q(neg ? -1 : 1, d);
    return { tex: `y=${neg ? "-" : ""}\\frac{x}{${d}}${c === 0 ? "" : `${c < 0 ? "-" : "+"}${Math.abs(c)}`}`, a, std: ltex(line(a, c)), form: "frac" };
  }
  let m = nz(r, 4);
  while (gcd(m, d) !== 1) m = nz(r, 4);
  const c = pick(r, [0, nz(r, 9)]), a = Q(m, d);
  return { tex: ltex(line(a, c)), a, std: ltex(line(a, c)), form: "std" };
};
const rateAsk = (e) => ({
  q: `一次関数 ${$(e.tex)} の、変化の割合は？`,
  ans: num(e.a),
  hint: "一次関数 $y=ax+b$ の変化の割合は、$a$ や $b$ と、どんな関係があったかな？",
  steps: [e.form === "rev" ? `$x$ の項を先に書くと、${$(e.std)}。` : e.form === "frac" ? `${$(e.tex)} は、${$(e.std)} と同じ。` : `${$(e.tex)} は、$y=ax+b$ の形。`, `一次関数の変化の割合は、いつも $x$ の係数 $a$ に等しいので、${$(qt(e.a))}。`],
});

// ── 減っていく場面（ろうそく・水そう・ストーブ）──────────────────────
/** p 単位に q ずつへる（q＜p）。はじめの量 L0＝q×t なので、なくなるまでの時間 t×p は整数 */
const BURN = {
  candle: (r) => { const p = r(3, 7), q = r(1, p - 1), t0 = Math.ceil(12 / q) + r(0, 3), L0 = q * t0; return { p, q, L0, T: t0 * p, yU: "cm", xU: "分後", setup: `長さ ${L0} cm のろうそくに火をつけると、${p}分間に ${q} cm の割合で短くなる。火をつけてから $x$ 分後のろうそくの長さを $y$ cm とする`, what: "ろうそくが燃えつきる", whenQ: "ろうそくが燃えつきるのは、火をつけてから何分後か" }; },
  tank: (r) => { const p = r(3, 8), q = r(2, p - 1), t0 = Math.ceil(24 / q) + r(0, 5), L0 = q * t0; return { p, q, L0, T: t0 * p, yU: "L", xU: "分後", setup: `水が ${L0} L 入っている水そうの底の栓をぬくと、${p}分間に ${q} L の割合で水がへる。栓をぬいてから $x$ 分後の水そうの水の量を $y$ L とする`, what: "水そうの水がなくなる", whenQ: "水そうの水がなくなるのは、栓をぬいてから何分後か" }; },
  stove: (r) => { const p = r(3, 6), q = r(1, 2), t0 = r(4, 9), L0 = q * t0; return { p, q, L0, T: t0 * p, yU: "L", xU: "時間後", setup: `灯油が ${L0} L 入ったストーブを使うと、${p}時間に ${q} L の割合で灯油がへる。使いはじめてから $x$ 時間後の灯油の量を $y$ L とする`, what: "灯油がなくなる", whenQ: "灯油がなくなるのは、使いはじめてから何時間後か" }; },
};
const burn = (r) => BURN[pick(r, Object.keys(BURN))](r);

// ── 変化の割合・x=x0 のときの値などが与えられた一次関数（03d07・03q05）─────────────
/** a（整数か 1/2 きざみ）、b、x1→x2 の増加、x=xp のとき y＝yp。a の分母 d のとき、x の増加量・xp は d の倍数 */
const spec = (r) => {
  const d = pick(r, [1, 1, 1, 2]), a = d === 1 ? Q(nz(r, 5)) : Q(pick(r, [1, 3, 5]) * pick(r, [1, -1]), 2);
  const x1 = r(-3, 3), x2 = x1 + (d === 1 ? r(2, 5) : 2 * r(1, 3)), xp = d * pick(r, [-3, -2, -1, 1, 2, 3, 4]), l = line(a, nz(r, 9));
  return { l, a, b: l.b[0], x1, x2, dyv: dy(l, x1, x2)[0], dx: x2 - x1, xp, yp: yAt(l, xp)[0], d };
};

export const UNITS = [
  unit("03", {
    name: "変化の割合",
    desc: "x の増加量・y の増加量と、変化の割合",
    prereqs: ["J2-ik02"],
    points: [
      "$x$ の値が $p$ から $q$ まで増加するとき、$x$ の増加量は $q-p$。$y$ の増加量は、（$x=q$ のときの $y$）$-$（$x=p$ のときの $y$）。$y$ が減るときの増加量は、負の数。",
      "変化の割合は、（$y$ の増加量）÷（$x$ の増加量）で求める。",
      "一次関数 $y=ax+b$ の変化の割合は、どの範囲でも一定で、$x$ の係数 $a$ に等しい。だから、$y$ の増加量 $=a\\times$（$x$ の増加量）。",
    ],
    levels: {
      // ───────── 1 基礎 ─────────
      1: [
        // 03d01a 演習（1）変化の割合（整数）
        t("03d01a", (r) => rateAsk(intForm(r, pick(r, ["std", "std", "rev", "prop"])))),
        // 03d01b 演習（1）③⑥ 変化の割合（分数）
        t("03d01b", (r) => rateAsk(fracForm(r))),
        // 03d02a 演習（2）x の増加量 → y の増加量（整数の a）
        t("03d02a", (r) => {
          const l = line(nz(r, 6), nz(r, 9)), dx = r(2, 8), v = l.a[0] * dx;
          return {
            q: `一次関数 ${L(l)} で、$x$ の値が ${dx} 増加するときの、$y$ の増加量は？`,
            ans: v,
            hint: "$y$ の増加量は、変化の割合と、$x$ の増加量から求められるよ。この一次関数の変化の割合は？",
            steps: [`変化の割合は、$x$ の係数の ${$(qt(l.a))}。`, `$y$ の増加量は、変化の割合に $x$ の増加量をかけて、${$(`${qt(l.a)}\\times ${dx}=${v}`)}。`],
          };
        }),
        // 03d02b 演習（2）③ x の増加量 → y の増加量（分数の a）
        t("03d02b", (r) => {
          const n = pick(r, [2, 3, 4, 5]);
          let m = nz(r, 4);
          while (gcd(m, n) !== 1) m = nz(r, 4);
          const l = line(Q(m, n), nz(r, 9)), dx = n * r(1, 4), v = m * (dx / n);
          return {
            q: `一次関数 ${L(l)} で、$x$ の値が ${dx} 増加するときの、$y$ の増加量は？`,
            ans: v,
            hint: "$y$ の増加量は、変化の割合と、$x$ の増加量から求められるよ。この一次関数の変化の割合は？",
            steps: [`変化の割合は、$x$ の係数の ${$(qt(l.a))}。`, `$y$ の増加量は、変化の割合に $x$ の増加量をかけて、${$(`${qt(l.a)}\\times ${dx}=${v}`)}。`],
          };
        }),
        // 03q01 小テスト（1）変化の割合（6x−1、−x+4、2/5 x）
        t("03q01", (r) => (r(0, 2) === 0 ? rateAsk(fracForm(r)) : rateAsk(intForm(r, pick(r, ["std", "rev"]), 6, 6)))),
        // 03q02 小テスト（2）x が増加するときの y の増加量（負の a が多い）
        t("03q02", (r) => {
          const l = line(pick(r, [-6, -5, -4, -3, -2, -1, 2, 3, 4, 5, 6]), nz(r, 9)), dx = r(2, 9), v = l.a[0] * dx;
          return {
            q: `一次関数 ${L(l)} で、$x$ の値が ${dx} 増加するときの、$y$ の増加量を求めよう。`,
            ans: v,
            hint: "$x$ の係数の符号に気をつけよう。$y$ は、ふえるのかな、へるのかな？",
            steps: [`変化の割合は ${$(qt(l.a))}。`, `$y$ の増加量は ${$(`${qt(l.a)}\\times ${dx}=${v}`)}。${v < 0 ? "（マイナスは、減少を表す。）" : ""}`],
          };
        }),
      ],
      // ───────── 2 標準 ─────────
      2: [
        // 03d03a 演習（3）x が x1 から x2 まで増加するときの y の増加量（計算して求める）
        t("03d03a", (r) => {
          const l = line(nz(r, 6), nz(r, 9)), x1 = r(-4, 4), x2 = x1 + r(2, 6), y1 = yAt(l, x1), y2 = yAt(l, x2), v = dy(l, x1, x2)[0];
          return {
            q: `一次関数 ${L(l)} で、$x$ の値が ${x1} から ${x2} まで増加するときの、$y$ の増加量は？`,
            ans: v,
            hint: "$x$ のはじめの値のときと、終わりの値のときの $y$ を、それぞれ求めて、くらべてみよう。",
            steps: [`$x=${x1}$ のとき ${$(`y=${subTex(l, x1)}`)}、$x=${x2}$ のとき ${$(`y=${subTex(l, x2)}`)}。`, `$y$ の増加量は、${$(`${qt(y2)}-${par(y1)}=${v}`)}。`],
          };
        }),
        // 03d03b 演習（3）x が x1 から x2 まで増加するときの変化の割合（y の増加量を計算して求める）
        t("03d03b", (r) => {
          const d = pick(r, [1, 1, 2, 3]);
          let m = nz(r, 5);
          while (gcd(m, d) !== 1) m = nz(r, 5);
          const l = line(Q(m, d), nz(r, 9)), x1 = d * r(-3, 3), x2 = x1 + d * r(1, 3) + (d === 1 ? 1 : 0), y1 = yAt(l, x1), y2 = yAt(l, x2), dyv = dy(l, x1, x2), dx = x2 - x1;
          return {
            q: `一次関数 ${L(l)} で、$x$ の値が ${x1} から ${x2} まで増加するときの、変化の割合を、$y$ の増加量を計算して求めよう。`,
            ans: num(rate(l, x1, x2)),
            hint: "変化の割合は、$y$ の増加量と $x$ の増加量の、どちらをどちらで割った値だったかな？",
            steps: [`$x$ の増加量は ${$(`${x2}-${par(x1)}=${dx}`)}。`, `$y$ の増加量は ${$(`${qt(y2)}-${par(y1)}=${qt(dyv)}`)}。`, `変化の割合は ${$(`\\frac{${qt(dyv)}}{${dx}}=${qt(rate(l, x1, x2))}`)}。`],
          };
        }),
        // 03d04a 演習（4）① 変化の割合と x の増加量 → y の増加量
        t("03d04a", (r) => {
          const d = pick(r, [1, 1, 2, 3]);
          let m = nz(r, 6);
          while (gcd(m, d) !== 1) m = nz(r, 6);
          const a = Q(m, d), dx = d * r(1, 5), v = m * (dx / d);
          return {
            q: `変化の割合が ${$(qt(a))} の一次関数で、$x$ の値が ${dx} 増加するときの、$y$ の増加量は？`,
            ans: v,
            hint: "変化の割合は、$y$ の増加量が $x$ の増加量の何倍かを表しているよ。",
            steps: [`$y$ の増加量は、変化の割合に $x$ の増加量をかけて、${$(`${qt(a)}\\times ${dx}=${v}`)}。`],
          };
        }),
        // 03d04b 演習（4）② x の増加量と y の増加量 → 変化の割合
        t("03d04b", (r) => {
          const dx = r(2, 8), m = r(1, 12), s = pick(r, [-1, -1, 1]), dyv = s * m, a = Q(dyv, dx);
          if (qiszero(a) || a[1] === 1) return { skip: true };
          return {
            q: `$x$ の値が ${dx} 増加するとき、$y$ の値が ${upDown(dyv)}一次関数の、変化の割合は？`,
            ans: num(a),
            hint: "$y$ が減少するときは、$y$ の増加量はどんな数になるかな？",
            steps: [`$y$ の増加量は ${$(String(dyv))}${dyv < 0 ? "（減少は負の数）" : ""}。`, `変化の割合は ${$(`\\frac{${dyv}}{${dx}}=${qt(a)}`)}。`],
          };
        }),
        // 03q03 小テスト（3）x の増加を計算して変化の割合（x1 が負）
        t("03q03", (r) => {
          const l = line(nz(r, 6), nz(r, 9)), x1 = r(-4, -1), x2 = x1 + r(3, 6), y1 = yAt(l, x1), y2 = yAt(l, x2), dyv = dy(l, x1, x2)[0], dx = x2 - x1;
          return {
            q: `一次関数 ${L(l)} で、$x$ の値が ${x1} から ${x2} まで増加するときの、変化の割合を、$y$ の増加量を計算して求めよう。`,
            ans: num(l.a),
            hint: "$x$ のはじめの値のときと、終わりの値のときの $y$ を求めて、増加量をくらべよう。",
            steps: [`$x$ の増加量は ${$(`${x2}-${par(x1)}=${dx}`)}。`, `$y$ の増加量は ${$(`${qt(y2)}-${par(y1)}=${dyv}`)}。`, `変化の割合は ${$(`\\frac{${dyv}}{${dx}}=${qt(l.a)}`)}。`],
          };
        }),
        // 03q04 小テスト（4）x が増加、y が減少 → 変化の割合
        t("03q04", (r) => {
          const dx = r(2, 8), m = r(3, 13), a = Q(-m, dx);
          if (a[1] === 1) return { skip: true };
          return {
            q: `$x$ の値が ${dx} 増加するとき、$y$ の値が ${m} 減少する一次関数の、変化の割合を求めよう。`,
            ans: num(a),
            hint: "$y$ が減少するときの増加量は、正の数かな、負の数かな？",
            steps: [`$y$ の増加量は ${$(String(-m))}（減少は負の数）。`, `変化の割合は ${$(`\\frac{${-m}}{${dx}}=${qt(a)}`)}。`],
          };
        }),
      ],
      // ───────── 3 応用 ─────────
      3: [
        // 03d05a 演習（5）① 減っていく場面の変化の割合
        t("03d05a", (r) => {
          const c = burn(r), a = Q(-c.q, c.p);
          return {
            q: `${c.setup}。このときの、変化の割合は？`,
            ans: num(a),
            hint: `$x$ が ${c.p} ふえると、$y$ はいくつ変わるかな？ へるときは、増加量が負の数になるよ。`,
            steps: [`$x$ の増加量は ${c.p}、$y$ の増加量は ${$(String(-c.q))}（へるので、負の数）。`, `変化の割合は ${$(`\\frac{${-c.q}}{${c.p}}=${qt(a)}`)}。`],
          };
        }),
        // 03d05b 演習（5）② 減っていく場面 → 式（4択）
        t("03d05b", (r) => {
          const c = burn(r), a = Q(-c.q, c.p), right = line(a, c.L0);
          const { ans, choices } = lineChoices(r, right, [line(Q(c.q, c.p), c.L0), line(Q(-c.p, c.q), c.L0), line(Q(-c.q, c.p), -c.L0), line(c.L0, a)]);
          return {
            q: `${c.setup}。$y$ を $x$ の式で表すと？`,
            ans,
            choices,
            hint: "変化の割合が $x$ の係数、$x$ が 0 のときの $y$ が定数項だったね。この場面では、それぞれいくつかな？",
            steps: [`変化の割合は ${$(`\\frac{${-c.q}}{${c.p}}=${qt(a)}`)}、$x=0$ のとき $y=${c.L0}$。`, `$y=ax+b$ の $a$ が ${$(qt(a))}、$b$ が ${c.L0} だから、${L(right)}。`],
          };
        }),
        // 03d05c 演習（5）③ なくなるまでの時間
        t("03d05c", (r) => {
          const c = burn(r), a = Q(-c.q, c.p), l = line(a, c.L0);
          return {
            q: `${c.setup}。${c.whenQ}。`,
            ans: c.T,
            unit: c.xU,
            hint: "なくなるときの $y$ の値は、いくつかな？ $y$ を $x$ の式で表してから考えよう。",
            steps: [`$y$ を $x$ の式で表すと ${L(l)}。`, `${c.what}のは $y=0$ のとき。${solveLine(l, 0)}。`, `答えは ${c.T}${c.xU}。`],
          };
        }),
        // 03d06 演習（6）表：対応する x、y の値から、ほかの x のときの y
        t("03d06", (r) => {
          const a = nz(r, 5), b = nz(r, 9), l = line(a, b), x1 = r(-2, 2), x2 = x1 + r(2, 3);
          let x3 = x1;
          while (x3 === x1 || x3 === x2) x3 = x1 + r(-2, 6);
          const y1 = yAt(l, x1)[0], y2 = yAt(l, x2)[0], y3 = yAt(l, x3)[0], dx3 = x3 - x2;
          return {
            q: `一次関数で、$x=${x1}$ のとき $y=${y1}$、$x=${x2}$ のとき $y=${y2}$ である。$x=${x3}$ のときの $y$ の値は？`,
            ans: y3,
            hint: "2つの対応から、変化の割合を求められるかな？ 変化の割合がわかると、$x$ が変わったときの $y$ の変わり方がわかるよ。",
            steps: [`変化の割合は ${$(`\\frac{${y2}-${par(y1)}}{${x2}-${par(x1)}}=${a}`)}。`, `$x$ が ${x2} から ${x3} まで変わると、$x$ の増加量は ${$(`${x3}-${par(x2)}=${dx3}`)}、$y$ の増加量は ${$(`${par(a)}\\times ${par(dx3)}=${a * dx3}`)}。`, `$y$ の値は ${$(`${y2}${a * dx3 < 0 ? "-" : "+"}${Math.abs(a * dx3)}=${y3}`)}。`],
          };
        }),
      ],
      // ───────── 4 入試レベル ─────────
      4: [
        // 03d07a 演習（7）① a の値
        t("03d07a", (r) => {
          const s = spec(r), pre = specText(s);
          return {
            q: `${pre}$a$ の値は？`,
            ans: num(s.a),
            hint: "$x$ の増加量と $y$ の増加量から、変化の割合が求められるよ。一次関数 $y=ax+b$ の変化の割合は、何と等しいかな？",
            steps: [`$x$ の増加量は ${$(`${s.x2}-${par(s.x1)}=${s.dx}`)}、$y$ の増加量は ${$(String(s.dyv))}。`, `$a$ は変化の割合に等しいので、${$(`a=\\frac{${s.dyv}}{${s.dx}}=${qt(s.a)}`)}。`],
          };
        }),
        // 03d07b 演習（7）② b の値
        t("03d07b", (r) => {
          const s = spec(r), pre = specText(s);
          return {
            q: `${pre}$b$ の値は？`,
            ans: s.b,
            hint: "まず $a$ を求めよう。$a$ がわかれば、わかっている $x$、$y$ の値の組を使って、$b$ が求められるよ。",
            steps: [`$a=\\frac{${s.dyv}}{${s.dx}}=${qt(s.a)}$。`, `$x=${s.xp}$、$y=${s.yp}$ を ${$(`y=${axt(s.a)}+b`)} に代入して、${$(`${s.yp}=${qt(s.a)}\\times ${par(s.xp)}+b`)}。`, `$b=${s.b}$。`],
          };
        }),
        // 03d07c 演習（7）③ ほかの範囲の y の増加量
        t("03d07c", (r) => {
          const s = spec(r), pre = specText(s), d = s.d;
          const x3 = d * r(-4, 0), x4 = x3 + d * r(2, 4), v = dy(s.l, x3, x4)[0];
          return {
            q: `${pre}$x$ の値が ${x3} から ${x4} まで増加するときの、$y$ の増加量は？`,
            ans: v,
            hint: "まず、この一次関数の変化の割合を求めよう。そのあと、$x$ の増加量をかければいいね。",
            steps: [`変化の割合は ${$(`a=\\frac{${s.dyv}}{${s.dx}}=${qt(s.a)}`)}。`, `$x$ の増加量は ${$(`${x4}-${par(x3)}=${x4 - x3}`)}。`, `$y$ の増加量は ${$(`${qt(s.a)}\\times ${x4 - x3}=${v}`)}。`],
          };
        }),
        // 03d08 演習（8）2つの一次関数の y の増加量の差 → k
        t("03d08", (r) => {
          const a1 = r(2, 6);
          let a2 = a1;
          while (a2 === a1 || a2 === 1 || a2 === -1 || a2 === 0) a2 = r(-6, 5);
          const x1 = r(-3, 4), tt = r(2, 7), k = x1 + tt, D = (a1 - a2) * tt, l1 = line(a1, nz(r, 9)), l2 = line(a2, nz(r, 9));
          const kx = x1 === 0 ? "k" : `k${x1 > 0 ? "-" : "+"}${Math.abs(x1)}`, w = x1 === 0 ? "k" : `(${kx})`;
          return {
            q: `2つの一次関数 ① ${$(ltex(l1))}、② ${$(ltex(l2))} がある。$x$ の値が ${x1} から $k$ まで増加するときの ① の $y$ の増加量が、② の $y$ の増加量より ${D} 大きくなった。$k$ の値は？（$k$ は ${x1} より大きい）`,
            ans: k,
            hint: "$x$ の増加量を $k$ を使って表そう。それぞれの $y$ の増加量は、変化の割合に $x$ の増加量をかけて求められるね。",
            steps: [`$x$ の増加量は ${$(kx)}。① の $y$ の増加量は ${$(`${a1}${w}`)}、② の $y$ の増加量は ${$(`${par(a2)}${w}`)}。`, `差が ${D} だから、${$(`${a1}${w}-${par(a2)}${w}=${D}`)}。`, `${$(`${a1 - a2}${w}=${D}`)} より ${$(`${kx}=${tt}`)}。よって ${$(`k=${k}`)}。`],
          };
        }),
        // 03q05 小テスト チャレンジ：x が増えると y が増える、x=x1 で y=y1 → x=x3 のときの y
        t("03q05", (r) => {
          const d = pick(r, [1, 1, 2]), a = d === 1 ? Q(nz(r, 5)) : Q(pick(r, [1, 3, 5]) * pick(r, [1, -1]), 2);
          const x1 = r(-1, 3), dx = d === 1 ? r(2, 5) : 2 * r(1, 3), x2 = x1 + dx, l = line(a, nz(r, 9)), dyv = dy(l, x1, x2)[0], y1 = yAt(l, x1)[0];
          const x3 = x1 - d * r(1, 5), v = yAt(l, x3)[0], d31 = x1 - x3, up = a[0] * d31 / a[1];
          return {
            q: `一次関数で、$x$ の値が ${x1} から ${x2} まで増加すると、$y$ の値は ${upDown(dyv)}。また、$x=${x1}$ のとき $y=${y1}$ である。$x=${x3}$ のときの $y$ の値は？`,
            ans: v,
            hint: "まず、変化の割合を求めよう。求めたい $x$ の値から、$y$ の値がわかっている $x$ の値まで増加するとき、$y$ の増加量はいくつになるかな？",
            steps: [`変化の割合は ${$(`\\frac{${dyv}}{${dx}}=${qt(a)}`)}。`, `$x$ が ${x3} から ${x1} まで増加するときの、$x$ の増加量は ${$(`${x1}-${par(x3)}=${d31}`)}、$y$ の増加量は ${$(`${qt(a)}\\times ${d31}=${up}`)}。`, `$x=${x1}$ のとき $y=${y1}$ だから、$x=${x3}$ のときの $y$ は ${$(`${y1}-${par(up)}=${v}`)}。`],
          };
        }),
      ],
    },
  }),
];

/** 03d07 の問題文（a、b を求める一次関数の条件） */
function specText(s) {
  return `一次関数 $y=ax+b$ は、$x$ の値が ${s.x1} から ${s.x2} まで増加すると、$y$ の値が ${upDown(s.dyv)}。また、$x=${s.xp}$ のとき $y=${s.yp}$ である。`;
}

// 移さなかった問題はない（dr.6 の表は、対応する x、y の値を文で言って、残りの x のときの y を聞く問題にした）
export const SKIPPED = [];
