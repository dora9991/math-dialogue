// ============================================================
// ichiji-02.js — 一次関数 第2時「一次関数かどうかを、式の形で判断しよう」（x の係数 a・定数項 b・代入）
//   ikkan の演習プリント（ichiji-02.dr.1〜8）・小テスト（ichiji-02.qz.1〜5）を、コツコツくんのテンプレートにしたもの。
//   テンプレート id＝「02」＋ d（演習）／q（小テスト）＋ ikkan の問題の番号（＋ 小問・型ごとに a, b…）。
//   a・b は、式を y＝ax+b の形にならべかえて読みとる（y＝9−4x、y＝(x+5)/2 の形も出す）。値は linear.js の line・yAt・xAt で計算する。
//   「y を x の式で表す」は入力欄で打てないので、(a) ありがちな誤答（符号まちがい・切片と傾きの入れかえ）をならべた4択、(b) a・b や x・y の値、にした。
//   「一次関数をすべて選ぶ」は、数式を algebra.js の多項式で展開して判定し、(a) 1つ選ぶ4択、(b) いくつあるか、にした。
//   「a＝0 のときを一次関数といわないのはなぜか（説明）」は、正しい説明を選ぶ4択と、a＝0 になる a の値を聞く問題にした。
// ============================================================
import { t, pick, choices4, shuffle, sample, rnz, gcd } from "../kit.js";
import { unitFor } from "../unit-kit.js";
import { Q, qadd, qiszero } from "../algebra.js";
import { term, padd, psub, pmul, pdeg, ptex } from "../algebra.js";
import { line, yAt, xAt, ltex, qt, num } from "../linear.js";

const unit = unitFor("ichiji");

// ── 道具（この授業の問題用に足した小さな関数）──────────────────────────
const $ = (s) => `$${s}$`;
const L = (l) => $(ltex(l));
/** 係数つきの x の項：axt(3) → 3x、axt(1) → x、axt(-1) → -x */
const axt = (a) => ltex(line(a, 0)).slice(2);
/** 直線 l に x を入れた計算と値の TeX：2\times 3-7=-1 */
const subTex = (l, x) => {
  const xv = Array.isArray(x) ? x : [x, 1], xs = qt(xv), xp = xv[0] < 0 ? `(${xs})` : xs;
  const s = xv[0] === 0 && Math.abs(l.a[0]) === 1 && l.a[1] === 1 ? "0" : l.a[0] === 1 && l.a[1] === 1 ? xs : l.a[0] === -1 && l.a[1] === 1 ? `-${xp}` : `${qt(l.a)}\\times ${xp}`;
  const b = qiszero(l.b) ? "" : `${l.b[0] < 0 ? "-" : "+"}${qt([Math.abs(l.b[0]), l.b[1]])}`;
  return `${s}${b}=${qt(yAt(l, xv))}`;
};
/** 直線 l で y が y0 になる x を求める途中式（TeX の配列）：["10=3x-5", "3x=15", "x=5"] */
const solveTex = (l, y0) => {
  const out = [`${y0}=${ltex(l).slice(2)}`];
  if (!qiszero(l.b)) out.push(`${axt(l.a)}=${qt(qadd([y0, 1], [-l.b[0], l.b[1]]))}`);
  if (!(l.a[0] === 1 && l.a[1] === 1)) out.push(`x=${qt(xAt(l, y0))}`);
  return out;
};
const solveLine = (l, y0) => solveTex(l, y0).map($).join("、");
/** 直線の4択。正解 right、ありがちな誤答 wrongs（直線） */
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
/** 0 以外の整数 a、b */
const nz = (r, m) => rnz(r, -m, m);
const NAMES = ["まい", "そうた", "ゆう", "りく", "あおい", "はると"];

// ── a・b を読みとる式のいろいろ ─────────────────────────────────
/** 整数の a、b の式。form＝std（ax+b）／rev（b+ax）／prop（ax）。{ tex, a, b, std（ならべかえた式）} */
const intForm = (r, form, am = 9, bm = 9) => {
  const a = nz(r, am), b = form === "prop" ? 0 : nz(r, bm), std = ltex(line(a, b));
  const tex = form === "rev" ? `y=${b}${a < 0 ? "-" : "+"}${axt(Math.abs(a))}` : std;
  return { tex, a: Q(a), b: Q(b), std, form };
};
/** 分数の a の式。form＝A（x/d+c）／B（(x+c)/d）／C（(m/n)x+c） */
const fracForm = (r, form) => {
  const d = r(2, 6);
  if (form === "A") {
    const c = nz(r, 9), neg = pick(r, [1, -1]) < 0, a = Q(neg ? -1 : 1, d);
    return { tex: `y=${neg ? "-" : ""}\\frac{x}{${d}}${c < 0 ? "-" : "+"}${Math.abs(c)}`, a, b: Q(c), std: ltex(line(a, c)), mid: null };
  }
  if (form === "B") {
    let c = nz(r, 9);
    while (c % d === 0) c = nz(r, 9);
    const a = Q(1, d), b = Q(c, d);
    return { tex: `y=\\frac{x${c < 0 ? "-" : "+"}${Math.abs(c)}}{${d}}`, a, b, std: ltex(line(a, b)), mid: `y=\\frac{x}{${d}}${c < 0 ? "-" : "+"}\\frac{${Math.abs(c)}}{${d}}` };
  }
  let m = nz(r, 4);
  while (gcd(m, d) !== 1) m = nz(r, 4);
  const c = nz(r, 9), a = Q(m, d);
  return { tex: ltex(line(a, c)), a, b: Q(c), std: ltex(line(a, c)), mid: null };
};
/** a か b を聞く問題にする */
const abAsk = (e, ask) => {
  const v = ask === "a" ? e.a : e.b, nm = ask === "a" ? "$x$ の係数 $a$ の値" : "定数項 $b$ の値";
  const lines = [];
  if (e.mid) lines.push(`${$(e.tex)} を分けて、${$(e.mid)}。`);
  if (e.form === "rev") lines.push(`$x$ の項を先に書くと、${$(e.std)}。`);
  else if (e.form === "prop") lines.push(`${$(e.tex)} は、${$(`y=${axt(e.a)}+0`)} と見る。`);
  else if (!e.mid) lines.push(`${$(e.tex)} は、$y=ax+b$ の形になっている。`);
  else lines.push(`整理すると、${$(e.std)}。`);
  lines.push(`$a=${qt(e.a)}$、$b=${qt(e.b)}$ だから、${nm}は ${$(qt(v))}。`);
  return {
    q: `一次関数 ${$(e.tex)} を $y=ax+b$ の形と見たとき、${nm}は？`,
    ans: num(v),
    hint: "式を $y=ax+b$ の形にならべかえよう。$x$ の項と、数だけの項は、それぞれどれかな？",
    steps: lines,
  };
};

// ── 場面（入園料など・持っている金額がへる場面）───────────────────────
/** 「はじめに b 円かかり、1回ごとに a 円かかる」場面 */
const FEE = {
  park: (r) => { const a = pick(r, [150, 200, 250, 300, 350, 400]), b = pick(r, [500, 600, 800, 1000, 1200]); return { a, b, xr: [2, 10], xU: "回", setup: `遊園地の入園料は ${b} 円で、乗り物に 1回乗るごとに、${a} 円かかる。乗り物に $x$ 回乗ったときの、合計金額を $y$ 円とする`, when: (Y) => `合計金額が ${Y} 円になるのは、乗り物に何回乗ったときか` }; },
  bowl: (r) => { const a = pick(r, [400, 500, 600, 700]), b = pick(r, [300, 400, 500]); return { a, b, xr: [2, 6], xU: "ゲーム", setup: `ボウリング場の貸し靴代は ${b} 円で、ゲーム代は 1ゲームごとに ${a} 円かかる。$x$ ゲームしたときの、合計金額を $y$ 円とする`, when: (Y) => `合計金額が ${Y} 円になるのは、何ゲームしたときか` }; },
  club: (r) => { const a = pick(r, [300, 400, 500]), b = pick(r, [1000, 2000, 3000]); return { a, b, xr: [2, 10], xU: "回", setup: `スポーツクラブの入会金は ${b} 円で、利用 1回ごとに ${a} 円かかる。$x$ 回利用したときの、合計金額を $y$ 円とする`, when: (Y) => `合計金額が ${Y} 円になるのは、何回利用したときか` }; },
};
/** 「はじめに b あり、1 ごとに a ずつへる」場面（x は 1 以上 b÷a 未満の整数で聞く） */
const DEC = {
  money: (r) => { const a = pick(r, [100, 200, 300, 400, 500]), b = pick(r, [2000, 2500, 3000, 3500, 4000]), nm = pick(r, NAMES); return { a, b, xr: [2, Math.min(9, Math.floor(b / a) - 1)], xU: "週間後", setup: `${nm}さんは、${b} 円持っている。毎週 ${a} 円ずつ使う。$x$ 週間後に持っている金額を $y$ 円とする`, when: (Y) => `持っている金額が ${Y} 円になるのは、何週間後か` }; },
  tank: (r) => { const a = r(2, 6), b = pick(r, [30, 40, 50, 60]); return { a, b, xr: [2, Math.min(9, Math.floor(b / a) - 1)], xU: "分後", setup: `水が ${b} L 入っている水そうから、毎分 ${a} L ずつ水をぬく。$x$ 分後の水そうの水の量を $y$ L とする`, when: (Y) => `水そうの水の量が ${Y} L になるのは、水をぬきはじめて何分後か` }; },
  pages: (r) => { const a = pick(r, [10, 12, 15, 20, 25, 30]), b = pick(r, [150, 200, 240, 300]); return { a, b, xr: [2, Math.min(9, Math.floor(b / a) - 1)], xU: "日後", setup: `${b} ページの本を、毎日 ${a} ページずつ読む。$x$ 日後に、まだ読んでいないページ数を $y$ ページとする`, when: (Y) => `まだ読んでいないページ数が ${Y} ページになるのは、何日後か` }; },
};

// ── 式を展開して、一次関数かどうか調べる（02d07・02q05）──────────────────
const X = term(1, { x: 1 });
const K = (n) => term(n, {});
const xp = (k) => `x${k < 0 ? "-" : "+"}${Math.abs(k)}`;                    // x+3、x-2
const cx = (m) => (m === 1 ? "" : String(m)) + "x";                          // 2x、x
const sg = (k) => `${k < 0 ? "-" : "+"}${Math.abs(k)}`;
/** 式の型。tex＝問題の式、P＝右辺を展開した多項式（x だけ）、lin＝一次関数か（P の次数で決める）、note＝解説の1行 */
const FORMS = {
  // 一次関数（整理すると x の1次式）
  L1: (r) => { const p = nz(r, 5), q = nz(r, 6); return mk(`y=x(${xp(p)})-x^2${sg(q)}`, padd(psub(pmul(X, padd(X, K(p))), pmul(X, X)), K(q)), true); },
  L2: (r) => {
    for (;;) {
      const m = r(1, 3), n = nz(r, 3), s = nz(r, 8);
      if (s - m * n === 0) continue;
      const P = psub(pmul(pmul(K(m), X), padd(X, K(-n))), pmul(X, padd(pmul(K(m), X), K(-s))));
      return mk(`y=${cx(m)}(${xp(-n)})-x(${cx(m)}${sg(-s)})`, P, true);
    }
  },
  L3: (r) => { const m = r(2, 4), n = nz(r, 4), c = nz(r, 6); return mk(`y=${m}(${xp(-n)})${sg(c)}`, padd(pmul(K(m), padd(X, K(-n))), K(c)), true); },
  // 一次関数でない
  N1: (r) => { const m = r(2, 4), n = nz(r, 4); return mk(`y=${m}(${xp(-n)})+x^2`, padd(pmul(K(m), padd(X, K(-n))), pmul(X, X)), false); },
  N2: (r) => { const p = nz(r, 5), q = nz(r, 6); return mk(`y=x(${xp(p)})${sg(-q)}`, psub(pmul(X, padd(X, K(p))), K(q)), false); },
  N4: (r) => { const p = nz(r, 5); return mk(`y=x(${xp(-p)})+x^2`, padd(pmul(X, padd(X, K(-p))), pmul(X, X)), false); },
  N5: (r) => { const m = r(2, 5), n = nz(r, 5); return mk(`y=${m}(${xp(n)})-${cx(m)}`, psub(pmul(K(m), padd(X, K(n))), pmul(K(m), X)), false); },
  // xy＋px＝q（y について解くと 分母に x）
  N3: (r) => {
    const p = nz(r, 5), q = r(2, 12), tex = `xy${p < 0 ? "-" : "+"}${Math.abs(p) === 1 ? "" : Math.abs(p)}x=${q}`;
    return { tex, lin: false, note: `${$(tex)} を $y$ について解くと ${$(`y=\\frac{${q}}{x}${p < 0 ? "+" : "-"}${Math.abs(p)}`)}。分母に $x$ があるので、一次関数ではない。` };
  },
};
const mk = (tex, P, wantLin) => {
  const d = pdeg(P), lin = d === 1;
  if (lin !== wantLin) throw new Error(`式の型が合わない ${tex} ${ptex(P)}`);
  const exp = `y=${ptex(P)}`;
  const note = lin ? `${$(tex)} を整理すると ${$(exp)}。$y=ax+b$ の形なので、一次関数。`
    : d === 0 ? `${$(tex)} を整理すると ${$(exp)}。$x$ の項がなくなるので、一次関数ではない。`
      : `${$(tex)} を整理すると ${$(exp)}。$x^2$ が残るので、一次関数ではない。`;
  return { tex, lin, note };
};
const LIN_FORMS = ["L1", "L2", "L3"], NON_FORMS = ["N1", "N2", "N3", "N4", "N5"];
/** 重複しない式を n 個 */
const exprs = (r, n, forms) => {
  const out = [], seen = new Set();
  for (let i = 0; i < 300 && out.length < n; i++) {
    const e = FORMS[pick(r, forms)](r);
    if (seen.has(e.tex)) continue;
    seen.add(e.tex); out.push(e);
  }
  return out;
};

export const UNITS = [
  unit("02", {
    name: "一次関数の式の読みとり（a・b）と代入",
    desc: "y＝ax+b の a・b を読みとり、x・y の値を求める",
    prereqs: ["J2-ik01", "J2-g2c3u1"],
    points: [
      "一次関数 $y=ax+b$ で、$a$ を $x$ の係数、$b$ を定数項という。式は $y=ax+b$ の形にならべかえて読みとる。$y=4-2x$ は $y=-2x+4$ だから、$a=-2$、$b=4$。",
      "$y=ax$ のように定数項がないときは、$b=0$ と考える。$a=0$ のときは、$y=b$ となって $x$ の項がなくなるので、一次関数とはいわない。",
      "$x$ の値から $y$ の値を求めるときは、式の $x$ に値を代入する。$y$ の値から $x$ の値を求めるときは、$y$ に値を代入してできる方程式を解く。",
    ],
    levels: {
      // ───────── 1 基礎 ─────────
      1: [
        // 02d01a 演習（1）整数の a、b を読みとる（ax+b、b+ax、ax）
        t("02d01a", (r) => abAsk(intForm(r, pick(r, ["std", "rev", "rev", "prop"])), pick(r, ["a", "b"]))),
        // 02d01b 演習（1）⑥⑦ 分数の a、b を読みとる（x/3+1、(x+5)/2）
        t("02d01b", (r) => abAsk(fracForm(r, pick(r, ["A", "B", "C"])), pick(r, ["a", "b"]))),
        // 02d02a 演習（2）x のとき y（整数の a）
        t("02d02a", (r) => {
          const l = line(nz(r, 9), nz(r, 9)), x = pick(r, [-5, -4, -3, -2, -1, 2, 3, 4, 5, 6]);
          return {
            q: `一次関数 ${L(l)} で、$x=${x}$ のときの $y$ の値は？`,
            ans: num(yAt(l, x)),
            hint: "式の $x$ を、与えられた数でおきかえると、どうなるかな？ 負の数を入れるときは、どう書けばよいかな？",
            steps: [`$x=${x}$ を代入する。`, `${$(`y=${subTex(l, x)}`)}。`],
          };
        }),
        // 02d02b 演習（2）③ x のとき y（分数の a）
        t("02d02b", (r) => {
          const n = pick(r, [2, 3, 4, 5]);
          let m = nz(r, 4);
          while (gcd(m, n) !== 1) m = nz(r, 4);
          const l = line(Q(m, n), nz(r, 9)), x = n * pick(r, [-4, -3, -2, -1, 1, 2, 3, 4, 5]);
          return {
            q: `一次関数 ${L(l)} で、$x=${x}$ のときの $y$ の値は？`,
            ans: num(yAt(l, x)),
            hint: "分数の係数をかけるとき、$x$ の値は分母の数で割り切れるかな？",
            steps: [`$x=${x}$ を代入する。`, `${$(`y=${subTex(l, x)}`)}。`],
          };
        }),
        // 02q01 小テスト（1）a、b を読みとる（6x+1、−x−5、4−2x）
        t("02q01", (r) => abAsk(intForm(r, pick(r, ["std", "rev"]), 6, 6), pick(r, ["a", "b"]))),
        // 02q02 小テスト（2）x のとき y（負の数も）
        t("02q02", (r) => {
          const l = line(nz(r, 5), nz(r, 6)), x = r(-4, 6);
          return {
            q: `一次関数 ${L(l)} で、$x=${x}$ のときの $y$ の値は？`,
            ans: num(yAt(l, x)),
            hint: "式の $x$ のところに数を入れると、$y$ はいくつになるかな？",
            steps: [`$x=${x}$ を代入する。`, `${$(`y=${subTex(l, x)}`)}。`],
          };
        }),
      ],
      // ───────── 2 標準 ─────────
      2: [
        // 02d03a 演習（3）y のとき x（整数の a）
        t("02d03a", (r) => {
          const l = line(nz(r, 6), nz(r, 9)), x = pick(r, [-5, -4, -3, -2, -1, 2, 3, 4, 5, 6, 8]), y0 = yAt(l, x)[0];
          return {
            q: `一次関数 ${L(l)} で、$y=${y0}$ のときの $x$ の値は？`,
            ans: x,
            hint: "$y$ の値がわかっているとき、式の $y$ に代入すると、何についての方程式になるかな？",
            steps: [`$y=${y0}$ を代入して、${solveLine(l, y0)}。`, `答えは $x=${x}$。`],
          };
        }),
        // 02d03b 演習（3）③ y のとき x（分数の a）
        t("02d03b", (r) => {
          const n = pick(r, [2, 3, 4, 5]);
          let m = nz(r, 4);
          while (gcd(m, n) !== 1) m = nz(r, 4);
          const l = line(Q(m, n), nz(r, 9)), x = n * pick(r, [-4, -3, -2, 1, 2, 3, 4, 5]), y0 = yAt(l, x)[0];
          return {
            q: `一次関数 ${L(l)} で、$y=${y0}$ のときの $x$ の値は？`,
            ans: x,
            hint: "$y$ に値を代入してできる方程式で、$x$ の係数が分数のとき、どうやって解くかな？",
            steps: [`$y=${y0}$ を代入して、${solveLine(l, y0)}。`, `答えは $x=${x}$。`],
          };
        }),
        // 02d04a 演習（4）① 入園料 → 式（4択）
        t("02d04a", (r) => {
          const c = FEE[pick(r, Object.keys(FEE))](r), right = line(c.a, c.b);
          const { ans, choices } = lineChoices(r, right, [line(c.b, c.a), line(c.a, -c.b), line(c.a + c.b, 0), line(-c.a, c.b)]);
          return {
            q: `${c.setup}。$y$ を $x$ の式で表すと？`,
            ans,
            choices,
            hint: "回数が 0 回でも、かかる金額はいくらかな？ 1回ふえるごとに、いくらふえるかな？",
            steps: [`1回ごとにかかる金額が ${c.a} 円なので、$x$ 回で ${$(axt(c.a))} 円。`, `これに、回数によらずかかる ${c.b} 円をたして、${L(right)}。`],
          };
        }),
        // 02d04b 演習（4）② 合計金額から回数を求める
        t("02d04b", (r) => {
          const c = FEE[pick(r, Object.keys(FEE))](r), l = line(c.a, c.b), k = r(c.xr[0], c.xr[1]), Y = c.a * k + c.b;
          return {
            q: `${c.setup}。${c.when(Y)}。`,
            ans: k,
            unit: c.xU,
            hint: "$y$ は $x$ の式でどう表せるかな？ 合計金額がわかっているとき、$x$ はどうやって求めるかな？",
            steps: [`$y$ を $x$ の式で表すと ${L(l)}。`, `${$(`y=${Y}`)} を代入して、${solveLine(l, Y)}。`, `答えは ${k}${c.xU}。`],
          };
        }),
        // 02q03a 小テスト（3）① 持っている金額がへる場面 → 式（4択）
        t("02q03a", (r) => {
          const c = DEC[pick(r, Object.keys(DEC))](r), right = line(-c.a, c.b);
          const { ans, choices } = lineChoices(r, right, [line(c.a, c.b), line(-c.b, c.a), line(c.b, -c.a), line(-c.a, -c.b)]);
          return {
            q: `${c.setup}。$y$ を $x$ の式で表すと？`,
            ans,
            choices,
            hint: "$x$ がふえると、$y$ はふえるかな、へるかな？ はじめの量は、$x$ がいくつのときの $y$ かな？",
            steps: [`$x$ が 1 ふえるごとに ${c.a} へるので、へる分は ${$(axt(c.a))}。`, `はじめの ${c.b} からへる分をひいて、${$(`y=${c.b}-${axt(c.a)}`)}。ならべかえて ${L(right)}。`],
          };
        }),
        // 02q03b 小テスト（3）② a の値
        t("02q03b", (r) => {
          const c = DEC[pick(r, Object.keys(DEC))](r), right = line(-c.a, c.b), ask = pick(r, ["a", "b"]);
          return {
            q: `${c.setup}。$y$ を $x$ の式で表して、$y=ax+b$ の形と見たとき、${ask === "a" ? "$a$" : "$b$"} の値は？`,
            ans: ask === "a" ? -c.a : c.b,
            hint: ask === "a" ? "$x$ が 1 ふえるごとに、$y$ は何ふえる（へる）かな？ へるときは、負の数で考えよう。" : "$x$ が 0 のときの $y$ は、いくつかな？",
            steps: [`$y$ を $x$ の式で表すと ${L(right)}。`, `$a=${-c.a}$、$b=${c.b}$ だから、${ask === "a" ? "$a$" : "$b$"} の値は $${ask === "a" ? -c.a : c.b}$。`],
          };
        }),
        // 02q04 小テスト（4）y が決まった値になるのは、x がいくつのときか（へる場面）
        t("02q04", (r) => {
          const c = DEC[pick(r, Object.keys(DEC))](r), l = line(-c.a, c.b), k = r(c.xr[0], c.xr[1]), Y = c.b - c.a * k;
          return {
            q: `${c.setup}。${c.when(Y)}。`,
            ans: k,
            unit: c.xU,
            hint: "$y$ は $x$ の式でどう表せるかな？ へる場面では、$x$ の係数はどんな数になるかな？",
            steps: [`$y$ を $x$ の式で表すと ${L(l)}。`, `${$(`y=${Y}`)} を代入して、${solveLine(l, Y)}。`, `答えは ${k}${c.xU}。`],
          };
        }),
      ],
      // ───────── 3 応用 ─────────
      3: [
        // 02d05a 演習（5）a＝0 のとき、一次関数といわないわけ（正しい説明を選ぶ4択）
        t("02d05a", (r) => {
          const k = pick(r, [2, 3, 4, 5, 6, 7, 8, 9]);
          const ans = `${$(`y=${k}`)} となり、$x$ がどんな値でも、$y$ の値はいつも ${k} になる`;
          const wrongs = [
            `${$(`y=${k}x`)} となり、$x$ が 1 ふえるごとに、$y$ は ${k} ふえる`,
            `${$("y=0")} となり、$x$ がどんな値でも、$y$ の値はいつも 0 になる`,
            `${$(`y=x+${k}`)} となり、$x$ が 1 ふえるごとに、$y$ は 1 ふえる`,
          ];
          return {
            q: `一次関数 $y=ax+b$ では、$a$ は 0 でないとする。$b=${k}$ のとき、$a=0$ とすると、式と $y$ の値について正しい説明は、次のうちどれか。`,
            ans,
            choices: choices4(r, ans, shuffle(r, wrongs)),
            hint: "$a=0$ を $y=ax+b$ に代入すると、$x$ の項はどうなるかな？",
            steps: [`$a=0$ とすると、${$(`y=0\\times x+${k}=${k}`)}。`, `$x$ の項がなくなり、$x$ がどんな値でも $y$ の値はいつも ${k} になる。だから、$x$ の 1次式ではなく、一次関数とはいわない。`],
          };
        }),
        // 02d05b 演習（5）x の係数が 0 になる a（一次関数でなくなる a の値）
        t("02d05b", (r) => {
          const p = pick(r, [1, 2, 3, 4]), a0 = r(1, 8), m = nz(r, 9), q = p * a0;
          const co = `${p === 1 ? "" : p}a-${q}`;
          return {
            q: `$a$ を定数とする。${$(`y=(${co})x${m < 0 ? "-" : "+"}${Math.abs(m)}`)} が $x$ の一次関数にならないのは、$a$ がいくつのときか。`,
            ans: a0,
            hint: "一次関数 $y=ax+b$ の $a$ には、どんな決まりがあったかな？ それが守られなくなるのは、どんなとき？",
            steps: [`$x$ の係数が 0 のとき、$x$ の項がなくなり、${$(`y=${m}`)} となって一次関数でない。`, `${$(`${co}=0`)} より ${$(`a=${a0}`)}。`],
          };
        }),
        // 02d06a 演習（6）円周・二等辺三角形など → 一次関数であるものを選ぶ（4択）
        t("02d06a", (r) => {
          const goods = [
            () => ({ text: "半径が $x$ cm の円の、周の長さ $y$ cm", eq: "y=2\\pi x" }),
            () => { const s = r(4, 10); return { text: `底辺が $x$ cm、等しい 2辺が ${s} cm の二等辺三角形の、周の長さ $y$ cm`, eq: ltex(line(1, 2 * s)) }; },
            () => { const p = r(3, 9); return { text: `縦が ${p} cm、横が $x$ cm の長方形の、周の長さ $y$ cm`, eq: ltex(line(2, 2 * p)) }; },
          ];
          const bads = [
            () => ({ text: "半径が $x$ cm の円の、面積 $y$ cm²", eq: "y=\\pi x^2" }),
            () => ({ text: "1辺が $x$ cm の立方体の、表面積 $y$ cm²", eq: "y=6x^2" }),
            () => ({ text: "直角をはさむ 2辺が、ともに $x$ cm の直角二等辺三角形の、面積 $y$ cm²", eq: "y=\\frac{1}{2}x^2" }),
            () => { const h = r(3, 9); return { text: `底面が 1辺 $x$ cm の正方形で、高さが ${h} cm の四角柱の、体積 $y$ cm³`, eq: `y=${h}x^2` }; },
          ];
          const good = pick(r, goods)(), bad = sample(r, bads, 3).map((f) => f());
          const ans = good.text;
          return {
            q: "次の場面のうち、$y$ が $x$ の一次関数であるものはどれか。",
            ans,
            choices: choices4(r, ans, bad.map((s) => s.text)),
            hint: "場面を、$y$ を $x$ の式で表してみよう。$\\pi$ は決まった数（定数）だよ。$y=ax+b$ の形になるのはどれかな？",
            steps: [`答えの場面は ${$(good.eq)}。$x$ の 1次式だから、一次関数。`, `ほかの場面は ${bad.map((s) => $(s.eq)).join("、")}。どれも $x^2$ をふくむので、一次関数ではない。`],
          };
        }),
        // 02d06b 演習（6）③ 二等辺三角形などの周の長さの式の b／x のときの y
        t("02d06b", (r) => {
          const sc = pick(r, [
            () => { const s = r(4, 10); return { q: `底辺が $x$ cm、等しい 2辺が ${s} cm の二等辺三角形の、周の長さを $y$ cm とする。`, l: line(1, 2 * s), xr: [2, 2 * s - 1], why: `周の長さは、底辺と等しい 2辺の和で、${$(`x+${s}+${s}`)}。` }; },
            () => { const p = r(3, 9); return { q: `縦が ${p} cm、横が $x$ cm の長方形の、周の長さを $y$ cm とする。`, l: line(2, 2 * p), xr: [2, 12], why: `周の長さは、縦 2本と横 2本の和で、${$(`${p}\\times 2+x\\times 2`)}。` }; },
            () => { const s = r(3, 9); return { q: `となり合う 2辺が $x$ cm と ${s} cm の平行四辺形の、周の長さを $y$ cm とする。`, l: line(2, 2 * s), xr: [2, 12], why: `平行四辺形の向かい合う辺は等しいので、周の長さは ${$(`x\\times 2+${s}\\times 2`)}。` }; },
          ])();
          if (pick(r, ["b", "y"]) === "b") return { q: `${sc.q}$y$ を $x$ の式で表したとき、定数項 $b$ の値は？`, ans: sc.l.b[0], hint: "周の長さは、$x$ をふくむ辺と、$x$ をふくまない辺に分けると、どう表せるかな？", steps: [sc.why, `整理して ${L(sc.l)}。`, `定数項は $b=${sc.l.b[0]}$。`] };
          const x = r(sc.xr[0], sc.xr[1]);
          return { q: `${sc.q}$x=${x}$ のときの $y$ の値は？`, ans: num(yAt(sc.l, x)), unit: "cm", hint: "周の長さは、$x$ の式でどう表せるかな？", steps: [sc.why, `整理して ${L(sc.l)}。`, `$x=${x}$ を代入して、${$(`y=${subTex(sc.l, x)}`)}（cm）。`] };
        }),
      ],
      // ───────── 4 入試レベル ─────────
      4: [
        // 02d07 演習（7）展開して、一次関数であるものを選ぶ（4択）
        t("02d07", (r) => {
          const good = exprs(r, 1, LIN_FORMS)[0], bad = exprs(r, 3, NON_FORMS);
          const ans = $(good.tex);
          return {
            q: "次の 4つの式のうち、$y$ が $x$ の一次関数であるものはどれか。（$xy$ をふくむ式は、$y$ について解いて考える。）",
            ans,
            choices: choices4(r, ans, bad.map((e) => $(e.tex))),
            hint: "かっこをはずして整理すると、$x^2$ の項は残るかな、消えるかな？",
            steps: [good.note, ...bad.map((e) => e.note)],
          };
        }),
        // 02d08 演習（8）y が整数になる x の値（全部で何個／合計）
        t("02d08", (r) => {
          const q0 = pick(r, [2, 3, 4, 5, 6]), p = pick(r, [1, 2, 3, 4, 5, 7].filter((v) => gcd(v, q0) === 1)) * pick(r, [1, 1, -1]), b = nz(r, 9), k = pick(r, [2, 3, 4, 5]);
          const N = q0 * k, l = line(Q(p, q0), b), xs = Array.from({ length: k }, (_, i) => q0 * (i + 1)), sum = xs.reduce((u, v) => u + v, 0), ask = pick(r, ["count", "sum"]);
          const ft = `${p < 0 ? "-" : ""}\\frac{${Math.abs(p) === 1 ? "" : Math.abs(p)}x}{${q0}}`;
          return {
            q: `一次関数 ${L(l)} について、$x$ が 1 から ${N} までの整数のとき、$y$ が整数になるような $x$ の値は、${ask === "count" ? "全部で何個あるか。" : "すべてたすと、いくつになるか。"}`,
            ans: ask === "count" ? k : sum,
            hint: "$y$ が整数になるのは、$x$ にかけられている分数が、整数になるときだね。$x$ がどんな数のとき、そうなるかな？",
            steps: [`${$(`y=${ft}${b < 0 ? "-" : "+"}${Math.abs(b)}`)} だから、$x$ が ${q0} の倍数のとき ${$(ft)} が整数になり、$y$ も整数になる。`, `1 から ${N} までの ${q0} の倍数は ${xs.join("、")} の ${k}個。`, ask === "count" ? `答えは ${k}個。` : `合計は ${$(`${xs.join("+")}=${sum}`)}。`],
          };
        }),
        // 02q05 小テスト チャレンジ：展開して、一次関数であるものはいくつあるか
        t("02q05", (r) => {
          const k = pick(r, [1, 2, 3]), lins = exprs(r, k, LIN_FORMS), nons = exprs(r, 4 - k, NON_FORMS);
          const all = shuffle(r, [...lins, ...nons]), LET = ["ア", "イ", "ウ", "エ"];
          if (new Set(all.map((e) => e.tex)).size < 4) return { skip: true };
          const tag = all.map((e, i) => ({ ...e, c: LET[i] })), linL = tag.filter((e) => e.lin).map((e) => e.c);
          const hasXY = all.some((e) => e.tex.startsWith("xy"));
          return {
            q: `次のア〜エのうち、$y$ が $x$ の一次関数であるものは、何個あるか。${hasXY ? "（$xy$ をふくむ式は、$y$ について解いて考える。）" : ""}\n${tag.map((e) => `${e.c} ${$(e.tex)}`).join("　　")}`,
            ans: k,
            unit: "個",
            hint: "1つずつ、かっこをはずして整理すると、どうなるかな？ $x^2$ は残るかな、消えるかな？",
            steps: [tag.filter((e) => e.lin).map((e) => `${e.c}：${e.note}`).join(" "), tag.filter((e) => !e.lin).map((e) => `${e.c}：${e.note}`).join(" "), `一次関数は ${linL.join("、")} の ${k}個。`],
          };
        }),
      ],
    },
  }),
];

// 移さなかった問題はない（「a＝0 のときを一次関数といわないわけを説明する」は、正しい説明を選ぶ4択と、x の係数が 0 になる a を聞く問題にした）
export const SKIPPED = [];
