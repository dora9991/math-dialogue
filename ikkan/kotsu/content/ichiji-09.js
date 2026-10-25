// ============================================================
// ichiji-09.js — 一次関数 第9時「傾きと1点から、一次関数の式を求めよう」
//   ikkan の演習プリント（ichiji-09.dr.1〜7）・小テスト（ichiji-09.qz.1〜5）を、コツコツくんのテンプレートにしたもの。
//   テンプレート id＝「09」＋ d（演習）／q（小テスト）＋ ikkan の問題の番号（＋ 型ごとに a, b…）。例：09d02a ＝ ichiji-09.dr.2 の「傾きと 1 点」の型、09d02b ＝ 「切片と 1 点」の型
//   「式を求めよう」は入力欄で打てないので、(a) 式の4択（誤答は「点の y 座標をそのまま切片にする」「代入の符号まちがい」「傾きと切片の入れかえ」「切片の符号まちがい」など。
//   linear.js の onLine・傾きで、問題の条件（傾き・通る点）をみたさないことを確かめてから出す）、(b) 式から出る数（切片 b・傾き a・x のときの y・y のときの x）、の2つにした。
//   条件の言い方は、ikkan の問題にそろえた：「傾きが a で、点 (p, q) を通る」「変化の割合が a で、x＝p のとき y＝q」「切片が b で、点 (p, q) を通る」
//   「x が d 増加すると y が e 増加（減少）し、点を通る」「直線 y＝… に平行で、点を通る」。数・式は、すべて linear.js から出す（手で書かない）。
// ============================================================
import { t, pick, choices4, shuffle, rnz } from "../kit.js";
import { unitFor } from "../unit-kit.js";
import { Q, qadd, qsub, qmul, qneg, qeq, qval, qisint } from "../algebra.js";
import { line, yAt, onLine, ltex, ptex2, qt, num } from "../linear.js";

const unit = unitFor("ichiji");

// ── 道具（この授業の問題用に足した小さな関数）──────────────────────────
const $ = (s) => `$${s}$`;
const Z = (x) => (Array.isArray(x) ? Q(x[0], x[1]) : Q(x));
/** 負の数にはかっこをつけた TeX */
const par = (x) => { const v = Z(x); return v[0] < 0 ? `(${qt(v)})` : qt(v); };
/** 文の中の数（負の数・分数は TeX に） */
const N = (x) => { const v = Z(x); return v[0] >= 0 && v[1] === 1 ? String(v[0]) : $(qt(v)); };
const PT = (p) => $(ptex2(p));
/** 係数つきの文字の TeX（c は Q）  x, -x, 3x, \frac{3}{4}x */
const cx = (c, v = "x") => { const [n, d] = c, ab = Math.abs(n), co = d === 1 ? (ab === 1 ? "" : String(ab)) : `\\frac{${ab}}{${d}}`; return `${n < 0 ? "-" : ""}${co}${v}`; };
/** a×x の TeX（a が ±1 のときは省く）  2\times 3、-(-4)、\frac{1}{2}\times 6 */
const mulTex = (a, x) => (qeq(a, Q(1)) ? qt(Z(x)) : qeq(a, Q(-1)) ? `-${par(x)}` : `${qt(a)}\\times ${par(x)}`);
/** 整数の符号つき定数項（先頭以外）  +3、-2 */
const sc = (n) => (n < 0 ? `-${Math.abs(n)}` : `+${n}`);
/** y＝ax+b に x を入れた右辺の TeX  例 2\times 3-1 */
const evalTex = (l, x) => { let s = mulTex(l.a, x); if (l.b[0] !== 0) s += (l.b[0] < 0 ? "" : "+") + qt(l.b); return s; };
const calcTex = (l, x) => { const e = evalTex(l, x), y = qt(yAt(l, x)); return e === y ? `y=${y}` : `y=${e}=${y}`; };
const SLOPES_INT = [1, 2, 3, 4, -1, -2, -3, -4].map(Z);
const SLOPES_FRAC = [[1, 2], [1, 3], [2, 3], [3, 2], [-1, 2], [-1, 3], [-2, 3], [-3, 2], [3, 4], [-3, 4], [1, 4], [-1, 4], [2, 5], [-2, 5]].map(Z);

/** 式の4択：正解 right、ありがちな誤答 wrongs（直線の配列。先のものを優先）。bad(l) が true の直線（条件をみたすもの）は入れない */
const eqChoices = (r, right, wrongs, bad) => {
  const seen = new Set([ltex(right)]), ws = [];
  for (const w of wrongs) {
    if (!w || bad(w)) continue;
    const s = ltex(w);
    if (seen.has(s)) continue;
    seen.add(s); ws.push($(s));
  }
  const fill = (i) => { const d = [1, -1, 2, -2, 3, -3][i % 6], l2 = line(right.a, qadd(right.b, Q(d))); return bad(l2) ? null : $(ltex(l2)); };
  return { ans: $(ltex(right)), choices: choices4(r, $(ltex(right)), ws, fill) };
};

/** 傾き a（slopes から）・切片 b（整数）の直線と、その上の x 座標も y 座標も整数の点 P（x 座標は 0 でない） */
const mkLine = (r, slopes, B, pr) => {
  for (let i = 0; i < 400; i++) {
    const a = pick(r, slopes), b = rnz(r, -B, B), ps = [];
    for (let p = -pr; p <= pr; p++) if (p !== 0 && qisint(qmul(a, Q(p)))) ps.push(p);
    if (!ps.length) continue;
    const p = pick(r, ps), L = line(a, b), q = yAt(L, p)[0];
    if (q === 0) continue;
    return { a, b: Z(b), L, P: [p, q] };
  }
  const L = line(2, 1);
  return { a: Q(2), b: Q(1), L, P: [1, 3] };
};

/** 条件の文（式を求める問題の前半）と、その解説の 1 行目。kind＝slope／rate／par／inc */
const condOf = (r, kind, d, lo) => {
  const { a, b, L, P } = d, [p, q] = P;
  if (kind === "slope") return { text: `傾きが ${N(a)} で、点 ${PT(P)} を通る`, head: `傾きが ${N(a)} だから、${$(`y=${cx(a)}+b`)} とおける。`, hint: "傾きがわかると、式はどんな形で書けるかな？ 残りの b は、通る点の座標をどう使えば求められる？" };
  if (kind === "rate") return { text: `変化の割合が ${N(a)} で、${$(`x=${p}`)} のとき ${$(`y=${q}`)} である`, head: `変化の割合は傾きと同じ。傾きが ${N(a)} だから、${$(`y=${cx(a)}+b`)} とおける。`, hint: "一次関数の変化の割合は、傾きとどんな関係だったかな？ 傾きがわかったら、残りの b は x と y の組をどう使えば求められる？" };
  if (kind === "inc") {
    const dx = lo.dx, dy = lo.dy;
    return { text: `${$("x")} が ${dx} 増加すると ${$("y")} が ${Math.abs(dy)} ${dy > 0 ? "増加" : "減少"}し、点 ${PT(P)} を通る`, head: `傾きは、（y の増加量）÷（x の増加量）で ${$(`${dy < 0 ? `(${dy})` : dy}\\div ${dx}=${qt(a)}`)}。${$(`y=${cx(a)}+b`)} とおける。`, hint: "傾きは、x の増加量と y の増加量から、どう求められたかな？ 傾きがわかったら、b は通る点の座標からどう求める？" };
  }
  // par：直線 y＝ax+b0（b0≠b）に平行
  const L0 = lo.L0;
  return { text: `直線 ${$(ltex(L0))} に平行で、点 ${PT(P)} を通る`, head: `平行だから、傾きは ${N(a)}。${$(`y=${cx(a)}+b`)} とおける。`, hint: "平行な直線の傾きは、もとの直線の傾きとどんな関係かな？ 傾きがわかったら、b は通る点の座標からどう求める？" };
};
/** 傾き a・点 P から b を求める解説（2 行目） */
const solveB = (d) => {
  const { a, b, P } = d, [p, q] = P;
  return `${$(`x=${p}`)}、${$(`y=${q}`)} を代入して ${$(`${qt(q)}=${mulTex(a, p)}+b`)}、${$(`b=${qt(b)}`)}。`;
};
/** ありがちな誤答の直線（a, b, 点 P から） */
const wrongLines = (d) => {
  const { a, b, P } = d, [p, q] = P, ap = qmul(a, Q(p));
  return [line(a, q), line(a, qadd(Q(q), ap)), line(b, a), line(a, qneg(b)), line(a, qsub(Q(p), qmul(a, Q(q)))), line(a, qsub(Q(q), Q(p)))];
};

/** 「傾きと 1 点から式を選ぶ」4択の問題（kind ごとに条件の言い方がちがう） */
const eqQ = (r, kind, slopes, B, pr, extra = {}) => {
  for (let i = 0; i < 200; i++) {
    const d = mkLine(r, slopes, B, pr), a = d.a;
    const lo = {};
    if (kind === "inc") {
      const dxs = [2, 3, 4, 5, 6].filter((m) => m % a[1] === 0);
      if (!dxs.length) continue;
      lo.dx = pick(r, dxs); lo.dy = a[0] * (lo.dx / a[1]);
      if (Math.abs(lo.dy) > 12) continue;
    }
    if (kind === "par") { const b0 = rnz(r, -6, 6); if (b0 === qval(d.b)) continue; lo.L0 = line(a, b0); }
    const c = condOf(r, kind, d, lo), bad = (l) => qeq(l.a, a) && onLine(l, d.P);
    const wl = extra.first ? [extra.first(d, lo), ...wrongLines(d)] : wrongLines(d);
    const { ans, choices } = eqChoices(r, d.L, wl, bad);
    return { q: `${c.text}${kind === "rate" ? "一次関数" : "直線"}の式は、次のうちどれか。`, ans, choices, hint: c.hint, steps: [c.head, solveB(d), `式は ${$(ltex(d.L))}。`] };
  }
  return { skip: true };
};
/** 「傾きと 1 点から切片 b を求める」数値の問題 */
const interceptQ = (r, kind, slopes, B, pr) => {
  for (let i = 0; i < 200; i++) {
    const d = mkLine(r, slopes, B, pr), a = d.a, lo = {};
    if (kind === "par") { const b0 = rnz(r, -6, 6); if (b0 === qval(d.b)) continue; lo.L0 = line(a, b0); }
    const c = condOf(r, kind, d, lo);
    return { q: `${c.text}${kind === "rate" ? "一次関数" : "直線"}の切片は？`, ans: num(d.b), hint: c.hint, steps: [c.head, solveB(d), `切片は ${N(d.b)}。`] };
  }
  return { skip: true };
};

export const UNITS = [
  unit("09", {
    name: "傾きと1点から、一次関数の式を求めよう",
    desc: "傾き（変化の割合）と通る 1 点の座標を代入して、切片 b を求める",
    prereqs: ["J2-ik08", "J2-g2c3u1"],
    points: [
      "傾き（変化の割合）が $a$ とわかれば、一次関数は $y=ax+b$ とおける。あとは $b$ を求めればよい。",
      "グラフが点 $(p, q)$ を通るとは、$x=p$ のとき $y=q$ になるということ。$x=p$、$y=q$ を式に代入して、$b$ を求める。",
      "最後に、求めた $b$ を入れて、$y=ax+b$ の式を書く。式に点の座標を入れて、成り立つか確かめるとよい。",
      "傾きが同じ直線は平行。$x$ の増加量と $y$ の増加量がわかれば、傾きは（$y$ の増加量）÷（$x$ の増加量）。",
    ],
    levels: {
      // ───────── 1 基礎 ─────────
      1: [
        // 09d01a 演習（1）傾きと通る 1 点（変化の割合と x、y の値のこともある）から式を選ぶ
        t("09d01a", (r) => eqQ(r, r(0, 3) === 0 ? "rate" : "slope", SLOPES_INT, 6, 5)),
        // 09d01b 演習（1）傾きと通る 1 点から、切片を求める
        t("09d01b", (r) => interceptQ(r, r(0, 3) === 0 ? "rate" : "slope", SLOPES_INT, 6, 5)),
        // 09q01 小テスト（1）傾きが 2 で、点 (2, 3) を通る
        t("09q01", (r) => eqQ(r, "slope", [2, 3, 4, 1, 5].map(Z), 6, 4)),
      ],
      // ───────── 2 標準 ─────────
      2: [
        // 09d02a 演習（2）分数の傾きと通る 1 点から式を選ぶ
        t("09d02a", (r) => eqQ(r, r(0, 2) === 0 ? "rate" : "slope", SLOPES_FRAC, 5, 9)),
        // 09d02b 演習（2）切片と通る 1 点から、傾きを求める
        t("09d02b", (r) => {
          for (let i = 0; i < 200; i++) {
            const { a, b, L, P } = mkLine(r, [...SLOPES_INT, ...SLOPES_FRAC], 6, 8), [p, q] = P;
            const ca = (c) => (c === 1 ? "a" : c === -1 ? "-a" : `${c}a`);
            return {
              q: `切片が ${N(b)} で、点 ${PT(P)} を通る直線の傾きは？`,
              ans: num(a),
              hint: "切片がわかると、式はどんな形で書けるかな？ 残りの a は、通る点の座標をどう使えば求められる？",
              steps: [`切片が ${N(b)} だから、${$(`y=ax${sc(qval(b))}`)} とおける。`, `${$(`x=${p}`)}、${$(`y=${q}`)} を代入して ${$(`${q}=${ca(p)}${sc(qval(b))}`)}、${$(`${ca(p)}=${qt(qsub(Q(q), b))}`)}。`, `傾きは ${N(a)}。`],
            };
          }
          return { skip: true };
        }),
        // 09d02c 演習（2）x が d 増加すると y が e 減少（増加）し、点を通る：式を選ぶ
        t("09d02c", (r) => eqQ(r, "inc", [...SLOPES_INT, ...SLOPES_FRAC].map(Z), 6, 6)),
        // 09d03a 演習（3）直線に平行で、点を通る：式を選ぶ
        t("09d03a", (r) => eqQ(r, "par", SLOPES_INT.concat(SLOPES_FRAC.slice(0, 6)), 6, 5, { first: (d, lo) => lo.L0 })),
        // 09d03b 演習（3）直線に平行で、点を通る：切片を求める
        t("09d03b", (r) => interceptQ(r, "par", SLOPES_INT.concat(SLOPES_FRAC.slice(0, 6)), 6, 5)),
        // 09q02 小テスト（2）傾きが −3 で、点 (1, 4) を通る
        t("09q02", (r) => eqQ(r, "slope", [-2, -3, -4, -1, -5].map(Z), 6, 4)),
        // 09q03 小テスト（3）変化の割合が 1/2 で、x＝−4 のとき y＝3
        t("09q03", (r) => eqQ(r, "rate", SLOPES_FRAC, 5, 8)),
        // 09q04 小テスト（4）直線 y＝−x+4 に平行で、点 (1, −2) を通る
        t("09q04", (r) => eqQ(r, "par", [1, -1, 2, -2, 3, -3].map(Z), 6, 4, { first: (d, lo) => lo.L0 })),
      ],
      // ───────── 3 応用 ─────────
      3: [
        // 09d04a 演習（4）そうたさんの式のまちがい：正しい式を選ぶ
        t("09d04a", (r) => {
          for (let i = 0; i < 200; i++) {
            const d = mkLine(r, SLOPES_INT, 6, 4), { a, b, L, P } = d, [p, q] = P, ap = qmul(a, Q(p));
            const kind = r(0, 2), bw = [Q(q), qadd(Q(q), ap), Q(p)][kind];
            if (qeq(bw, b)) continue;
            const Lw = line(a, bw), bad = (l) => qeq(l.a, a) && onLine(l, P);
            const { ans, choices } = eqChoices(r, L, [Lw, ...wrongLines(d).filter((l) => !qeq(l.b, bw))], bad);
            return {
              q: `そうたさんは、傾きが ${N(a)} で、点 ${PT(P)} を通る直線の式を ${$(ltex(Lw))} と求めたが、まちがっていた。正しい式はどれか。`,
              ans, choices,
              hint: "そうたさんの式に、点の x 座標を入れてみよう。y 座標と合うかな？ 合わなければ、b の求め方を見直そう。",
              steps: [`そうたさんの式に ${$(`x=${p}`)} を入れると ${$(calcTex(Lw, p))} で、${N(q)} にならない（点を通らない）。`, solveB(d), `正しい式は ${$(ltex(L))}。`],
            };
          }
          return { skip: true };
        }),
        // 09d04b 演習（4）そうたさんのまちがい：まちがいの理由を選ぶ
        t("09d04b", (r) => {
          for (let i = 0; i < 300; i++) {
            const d = mkLine(r, SLOPES_INT, 6, 4), { a, b, L, P } = d, [p, q] = P, ap = qmul(a, Q(p));
            const bws = [Q(q), Q(p), qadd(Q(q), ap), qneg(b)], kind = r(0, 3), bw = bws[kind];
            const keys = bws.map((x) => `${x[0]}/${x[1]}`);
            if (new Set(keys).size !== 4) continue;
            if (bws.slice(0, 3).some((x) => qeq(x, b))) continue;
            const Lw = line(a, bw);
            const R = [
              "点の y 座標を、そのまま切片にしている",
              "点の x 座標を、そのまま切片にしている",
              "b を求めるとき、傾きと x 座標の積を、ひかずにたしている",
              "b を正しく求めたあと、符号を逆にして式に書いている",
            ];
            return {
              q: `そうたさんは、傾きが ${N(a)} で、点 ${PT(P)} を通る直線の式を ${$(ltex(Lw))} と求めたが、まちがっていた。まちがいの理由として正しいものはどれか。`,
              ans: R[kind],
              choices: shuffle(r, R),
              hint: "正しい式の切片 b は、いくつになるかな？ そうたさんの切片 b と、見くらべてみよう。",
              steps: [solveB(d), `正しい式は ${$(ltex(L))}。切片は ${N(b)} だが、そうたさんの切片は ${N(bw)}。`, `${N(bw)} は、${["点の y 座標", "点の x 座標", `${$(`${q}+${par(ap)}`)} の値`, `${N(b)} の符号を逆にした数`][kind]}。だから「${R[kind]}」。`],
            };
          }
          return { skip: true };
        }),
        // 09d05a 演習（5）水温：熱しはじめたときの水温（はじめの値）
        t("09d05a", (r) => {
          const c = ctx(r);
          return {
            q: `${c.intro}${c.askInit}`,
            ans: c.init,
            unit: c.uVal,
            hint: `${c.rateWord}ずつふえるから、y は x の一次関数になるね。傾きは何かな？ はじめの値は、x がいくつのときの y だろう？`,
            steps: [`${c.rateWord}ずつふえるから、傾きは ${c.k}。${$(`y=${c.k}x+b`)} とおける。`, `${$(`x=${c.t0}`)}、${$(`y=${c.y0}`)} を代入して ${$(`${c.y0}=${c.k}\\times ${c.t0}+b`)}、${$(`b=${c.init}`)}。`, `x=0 のときの y が、はじめの値。${$(`y=${c.k}x+${c.init}`)} で ${$("x=0")} のとき ${$(`y=${c.init}`)}。`],
          };
        }),
        // 09d05b 演習（5）水温：目標の値になるのは何分後か
        t("09d05b", (r) => {
          const c = ctx(r);
          return {
            q: `${c.intro}${c.askTime}`,
            ans: c.t1,
            unit: c.uTime,
            hint: "y を x の式で表すには、どうすればいいかな？ その式で、y が目標の値になるのは、x がいくつのとき？",
            steps: [`${c.rateWord}ずつふえるから、${$(`y=${c.k}x+b`)} とおける。${$(`x=${c.t0}`)}、${$(`y=${c.y0}`)} を代入して ${$(`b=${c.init}`)}。式は ${$(`y=${c.k}x+${c.init}`)}。`, `${$(`y=${c.yg}`)} を代入して ${$(`${c.yg}=${c.k}x+${c.init}`)}、${$(`${c.k}x=${c.yg - c.init}`)}。`, `${$(`x=${c.t1}`)}。${c.t1}${c.uTime}。`],
          };
        }),
        // 09d05c 演習（5）水温：y を x の式で表す
        t("09d05c", (r) => {
          const c = ctx(r), L = line(c.k, c.init), bad = (l) => qeq(l.a, L.a) && qeq(l.b, L.b);
          const { ans, choices } = eqChoices(r, L, [line(c.k, c.y0), line(c.k, -c.init), line(c.init, c.k), line(c.k, c.t0), line(c.y0, c.t0)], bad);
          return {
            q: `${c.intro}y を x の式で表すと、どうなるか。`,
            ans, choices,
            hint: `${c.rateWord}ずつふえるから、傾きはいくつかな？ 切片は、x と y の組をどう使えば求められる？`,
            steps: [`${c.rateWord}ずつふえるから、傾きは ${c.k}。${$(`y=${c.k}x+b`)} とおける。`, `${$(`x=${c.t0}`)}、${$(`y=${c.y0}`)} を代入して ${$(`${c.y0}=${c.k}\\times ${c.t0}+b`)}、${$(`b=${c.init}`)}。`, `式は ${$(ltex(L))}。`],
          };
        }),
      ],
      // ───────── 4 入試レベル ─────────
      4: [
        // 09d06a 演習（6）変化の割合と通る 1 点から、x のときの y の値
        t("09d06a", (r) => {
          for (let i = 0; i < 200; i++) {
            const d = mkLine(r, SLOPES_FRAC, 6, 9), { a, b, L, P } = d, den = a[1], X = den * rnz(r, -4, 4);
            if (X === P[0] || Math.abs(X) > 15) continue;
            return {
              q: `変化の割合が ${N(a)} で、グラフが点 ${PT(P)} を通る一次関数がある。${$("x")} が ${N(X)} のときの ${$("y")} の値は？`,
              ans: num(yAt(L, X)),
              hint: "変化の割合は、傾きと同じだったかな？ 式を決めてから、x の値をどう使えば y が求められる？",
              steps: [`傾きが ${N(a)} だから、${$(`y=${cx(a)}+b`)} とおける。`, `${solveB(d)}式は ${$(ltex(L))}。`, `${$(`x=${X}`)} を入れて、${$(calcTex(L, X))}。`],
            };
          }
          return { skip: true };
        }),
        // 09d06b 演習（6）変化の割合と通る 1 点から、y のときの x の値
        t("09d06b", (r) => {
          for (let i = 0; i < 200; i++) {
            const d = mkLine(r, SLOPES_FRAC, 6, 9), { a, b, L, P } = d, den = a[1], x0 = den * rnz(r, -4, 4);
            if (x0 === P[0] || Math.abs(x0) > 15) continue;
            const Y = yAt(L, x0)[0];
            return {
              q: `変化の割合が ${N(a)} で、グラフが点 ${PT(P)} を通る一次関数がある。${$("y")} が ${N(Y)} となる ${$("x")} の値は？`,
              ans: x0,
              hint: "変化の割合は、傾きと同じだったかな？ 式を決めてから、y の値をどう使えば x が求められる？",
              steps: [`傾きが ${N(a)} だから、${$(`y=${cx(a)}+b`)} とおける。`, `${solveB(d)}式は ${$(ltex(L))}。`, `${$(`y=${Y}`)} を入れて ${$(`${Y}=${cx(a)}${sc(qval(b))}`)}、${$(`${cx(a)}=${Y - qval(b)}`)}、${$(`x=${x0}`)}。`],
            };
          }
          return { skip: true };
        }),
        // 09d07 演習（7）直線に平行で、点を通る直線 m：点 (a, k) が m 上にあるときの a
        t("09d07", (r) => {
          for (let i = 0; i < 200; i++) {
            const d = mkLine(r, SLOPES_INT.concat(SLOPES_FRAC.slice(0, 6)), 6, 5), { a, b, L, P } = d, b0 = rnz(r, -6, 6);
            if (b0 === qval(b)) continue;
            const x0 = a[1] * rnz(r, -4, 4);
            if (x0 === P[0] || Math.abs(x0) > 12) continue;
            const Y = yAt(L, x0)[0], L0 = line(a, b0);
            return {
              q: `直線 ${$(ltex(L0))} に平行で、点 ${PT(P)} を通る直線を m とする。点 ${$(`(a, ${Y})`)} が m 上にあるとき、a の値は？`,
              ans: x0,
              hint: "m の傾きは、平行な直線の傾きとどんな関係かな？ m の式がわかったら、点 (a, y 座標) の座標をどう使えば a が求められる？",
              steps: [`平行だから、m の傾きは ${N(a)}。${solveB(d)}m は ${$(ltex(L))}。`, `点 ${$(`(a, ${Y})`)} が m 上にあるから、${$("x=a")}、${$(`y=${Y}`)} を代入して ${$(`${Y}=${cx(a, "a")}${sc(qval(b))}`)}。`, `${$(`${cx(a, "a")}=${Y - qval(b)}`)} より ${$(`a=${x0}`)}。`],
            };
          }
          return { skip: true };
        }),
        // 09q05 小テスト チャレンジ：点 (1, 4) を通り、x が 2 増加すると y が 3 増加する。点 (−3, k) を通るときの k
        t("09q05", (r) => {
          for (let i = 0; i < 300; i++) {
            const dx = pick(r, [2, 3, 4]), dy = rnz(r, -5, 5), a = Q(dy, dx), d = mkLine(r, [a], 5, 6), { b, L, P } = d;
            const X = a[1] * rnz(r, -4, 4);
            if (X === P[0] || Math.abs(X) > 10) continue;
            const k = yAt(L, X)[0];
            return {
              q: `一次関数のグラフが、点 ${PT(P)} を通り、${$("x")} の値が ${dx} 増加すると ${$("y")} の値が ${Math.abs(dy)} ${dy > 0 ? "増加" : "減少"}する。このグラフが点 ${$(`(${X}, k)`)} を通るとき、k の値は？`,
              ans: k,
              hint: "傾きは、x の増加量と y の増加量から、どう求められたかな？ 式を決めたあと、x の値をどう使えば k が求められる？",
              steps: [`傾きは、（y の増加量）÷（x の増加量）で ${$(`${dy < 0 ? `(${dy})` : dy}\\div ${dx}=${qt(a)}`)}。${$(`y=${cx(a)}+b`)} とおける。`, `${solveB(d)}式は ${$(ltex(L))}。`, `${$(`x=${X}`)} を入れて、${$(calcTex(L, X))}。よって ${$(`k=${k}`)}。`],
            };
          }
          return { skip: true };
        }),
      ],
    },
  }),
];

/**
 * 一定の割合でふえていく場面（水温・水の量・貯金）。y＝kx＋init。x＝t0 のとき y＝y0、x＝t1 のとき y＝yg。
 *   intro は場面の文、askInit・askTime は 2 つの問い。
 */
function ctx(r) {
  const kind = r(0, 2);
  if (kind === 0) {
    const k = pick(r, [2, 3, 4, 5]), init = r(10, 25), t0 = r(3, 8), t1 = r(8, 18), y0 = init + k * t0, yg = init + k * t1;
    if (yg > 95) return ctx(r);
    return { k, init, t0, t1, y0, yg, uVal: "℃", uTime: "分後", rateWord: `水温は 1 分間に ${k}℃`, intro: `水を熱すると、水温が 1 分間に ${k}℃ ずつ上がる。熱しはじめて ${t0} 分後の水温は ${y0}℃ だった。熱しはじめて x 分後の水温を y℃ とする。`, askInit: "熱しはじめたときの水温は、何℃か。", askTime: `水温が ${yg}℃ になるのは、熱しはじめて何分後か。` };
  }
  if (kind === 1) {
    const k = pick(r, [3, 4, 5, 6, 8]), init = pick(r, [10, 15, 20, 30, 40]), t0 = r(3, 8), t1 = r(8, 18), y0 = init + k * t0, yg = init + k * t1;
    return { k, init, t0, t1, y0, yg, uVal: "L", uTime: "分後", rateWord: `水の量は 1 分間に ${k}L`, intro: `水が入っている水そうに、水を入れる。水の量は 1 分間に ${k}L ずつふえ、水を入れはじめて ${t0} 分後の水の量は ${y0}L だった。水を入れはじめて x 分後の水の量を y L とする。`, askInit: "水を入れはじめたときの水の量は、何 L か。", askTime: `水の量が ${yg}L になるのは、水を入れはじめて何分後か。` };
  }
  const k = pick(r, [300, 500, 600, 800]), init = pick(r, [1000, 1500, 2000, 2500]), t0 = r(3, 8), t1 = r(8, 15), y0 = init + k * t0, yg = init + k * t1;
  return { k, init, t0, t1, y0, yg, uVal: "円", uTime: "か月後", rateWord: `貯金は 1 か月に ${k}円`, intro: `毎月 ${k}円ずつ貯金する。貯金しはじめて ${t0} か月後の貯金は ${y0}円だった。貯金しはじめて x か月後の貯金を y 円とする。`, askInit: "貯金しはじめたときの貯金は、何円か。", askTime: `貯金が ${yg}円になるのは、貯金しはじめて何か月後か。` };
}

// 移さなかった問題：なし。「式を求めよう」は、式を選ぶ4択か、切片・傾き・x のときの y・y のときの x の数に直して、すべて移した。
export const SKIPPED = [];
