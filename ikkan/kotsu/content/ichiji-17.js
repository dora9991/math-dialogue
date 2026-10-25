// ============================================================
// ichiji-17.js — 一次関数 第17時「「一次関数」で学んだことを、整理して確かめよう」（単元のまとめ）
//   ikkan の演習プリント（ichiji-17.dr.1〜9）・小テスト（ichiji-17.qz.1〜5）を、コツコツくんのテンプレートにしたもの。
//   テンプレート id＝「17」＋ d（演習）／q（小テスト）＋ ikkan の問題の番号（＋ 1つの問題から2つ以上つくるときは a, b…）。例：17d05b ＝ ichiji-17.dr.5 の2つ目
//   直線・交点・変域・面積は linear.js（line・lineSlopePoint・lineThrough・fromStd・yAt・xAt・rate・yRange・meet・xIntercept・triArea・onLine）で計算し、
//   答え・選択肢の式・解説の数は、すべてそこから出す（手で書かない）。
//   図（座標平面）は出せないので、グラフをかく問題（dr.3）は「x 軸との交点」「グラフのようす（右上がり・右下がり、通る点）」を聞く形に、
//   グラフから読みとる問題（dr.9）は、折れ線の頂点の座標を文で言い切る形にした。「式を求めよう」は入力欄で打てないので、(a) 式から出る数、(b) 4択（誤答は、
//   傾きと切片の入れかえ・符号まちがい・傾きの逆数・切片の代入ミスなど。条件の点を通らないことを onLine で確かめてから出す）にした。
//   「一次関数をすべて選ぼう」は「1つ選ぶ」「でないものを選ぶ」の4択に、「すべて答えよう」（dr.9②）は「早いほう・遅いほう・2つの合計」の数に直した。
// ============================================================
import { t, pick, choices4, shuffle, rnz, round } from "../kit.js";
import { unitFor } from "../unit-kit.js";
import { Q, qadd, qsub, qmul, qdiv, qneg, qeq, qval, qiszero, linTex, poly, ptex } from "../algebra.js";
import { line, lineSlopePoint, lineThrough, fromStd, yAt, xAt, rate, yRange, meet, xIntercept, triArea, onLine, ltex, ptex2, qt, num } from "../linear.js";

const unit = unitFor("ichiji");

// ── このファイルの小道具 ─────────────────────────────────────────
const TX = (s) => `$${s}$`;
const Qa = (x) => (Array.isArray(x) ? Q(x[0], x[1]) : Q(x));
const isFin = (x) => { let d = Qa(x)[1]; while (d % 2 === 0) d /= 2; while (d % 5 === 0) d /= 5; return d === 1; };
/** 面積などの答え：整数・有限小数はそのまま数、そうでなければ約分した分数の文字列 */
const ansOf = (x) => { const [n, d] = Qa(x); return d === 1 ? n : isFin([n, d]) ? round(n / d) : `${n}/${d}`; };
/** 数の TeX（有限小数は小数、そうでなければ分数）。座標・面積・時刻に使う */
const dt = (x) => { const [n, d] = Qa(x); return d === 1 ? String(n) : isFin([n, d]) ? String(round(n / d)) : qt([n, d]); };
/** 負の数にはかっこをつけた TeX（分数のまま） */
const P = (x) => { const s = qt(x); return s[0] === "-" ? `(${s})` : s; };
/** 点を $(x, y)$ で */
const PT = (p) => TX(ptex2(p));
/** 直線の右辺（y＝ の右） */
const rhs = (L) => ltex(L).slice(2);
/** x の係数つきの項（1 は省く） */
const cxq = (c) => { const s = qt(c); return s === "1" ? "x" : s === "-1" ? "-x" : `${s}x`; };
/** 「a×x」の書き方（a＝±1 は省く） */
const aX = (a, x) => (qeq(Qa(a), Q(1)) ? P(x) : qeq(Qa(a), Q(-1)) ? `-${P(x)}` : `${P(a)}\\times ${P(x)}`);
const HALF = "\\frac{1}{2}";
/** 式の4択：正解 L、ありがちな誤答の直線 cands。正解と同じ式にならないものだけ。keep(w)＝その誤答が条件をみたさないことの確認 */
const lineChoices = (r, L, cands, fills = [], keep = () => true) => {
  const seen = new Set([ltex(L)]);
  const wrongs = [];
  for (const w of shuffle(r, cands.filter(Boolean))) {
    const s = ltex(w);
    if (seen.has(s) || !keep(w)) continue;
    seen.add(s); wrongs.push(TX(s));
  }
  return choices4(r, TX(ltex(L)), wrongs, (i) => {
    const w = fills[i % Math.max(1, fills.length)];
    return w && ltex(w) !== ltex(L) && keep(w) ? TX(ltex(w)) : null;
  });
};
const INT_A = [1, 2, 3, 4, 5, -1, -2, -3, -4, -5];
const randLine = (r, as = INT_A, bmax = 8) => line(pick(r, as), rnz(r, -bmax, bmax));
/** 傾きの解説の1行 */
const slopeLine = (p1, p2) => {
  const [x1, y1] = p1, [x2, y2] = p2;
  const a = qdiv(qsub(Qa(y2), Qa(y1)), qsub(Qa(x2), Qa(x1)));
  return `傾きは ${TX(`\\frac{${qt(y2)}-${P(y1)}}{${qt(x2)}-${P(x1)}}=${qt(a)}`)}。`;
};
/** 切片の解説の1行（傾き a、点 p を通る） */
const interceptLine = (a, p) => {
  const [x, y] = p, b = qsub(Qa(y), qmul(Qa(a), Qa(x)));
  if (qiszero(Qa(x))) return `点 ${PT(p)} は y 軸上の点なので、切片は ${TX(qt(y))}。`;
  return `点 ${PT(p)} を通るので、${TX(`${qt(y)}=${aX(a, x)}+b`)} より ${TX(`b=${qt(b)}`)}。`;
};
/** 直線上の格子点から、異なる 2 点を選ぶ（順番は x の小さい順）。作れないなら null */
const pickPts = (r, L, { xr = [-4, 5], yMax = 14, gap = 5, minGap = 1, first0 = false } = {}) => {
  const xs = [];
  for (let x = xr[0]; x <= xr[1]; x++) {
    const y = yAt(L, x);
    if (y[1] !== 1 || Math.abs(y[0]) > yMax) continue;
    xs.push(x);
  }
  for (let n = 0; n < 80 && xs.length >= 2; n++) {
    let [u, v] = shuffle(r, xs).slice(0, 2);
    if (first0 && xs.includes(0)) { u = 0; v = pick(r, xs.filter((x) => x !== 0)); }
    if (u > v) [u, v] = [v, u];
    if (v - u > gap || v - u < minGap) continue;
    return [[u, yAt(L, u)[0]], [v, yAt(L, v)[0]]];
  }
  return null;
};
/** 2点 p1、p2 を通る直線 L の式の4択 */
const twoPtChoices = (r, L, p1, p2, noInv = false) => {
  const [x1, y1] = [Qa(p1[0]), Qa(p1[1])], a = L.a, b = L.b;
  const inv = qiszero(a) ? null : qdiv(Q(1), a);
  const cand = [
    qiszero(b) ? null : line(b, a),                                      // 傾きと切片の入れかえ
    qiszero(b) ? null : line(a, qneg(b)),                                // 切片の符号まちがい
    line(qneg(a), b),                                                    // 傾きの符号まちがい
    inv && !noInv ? line(inv, qsub(y1, qmul(inv, x1))) : null,           // 傾きを (x の増加量)÷(y の増加量) にしてしまう
    line(a, qadd(y1, qmul(a, x1))),                                      // 切片の代入ミス（y＋a×x としてしまう）
    line(a, y1),                                                         // 切片を y 座標そのものにしてしまう
  ];
  const one = Q(1);
  const fills = [line(qadd(a, one), b), line(a, qadd(b, one)), line(qsub(a, one), b), line(a, qsub(b, one))];
  const keep = (w) => !(onLine(w, p1) && onLine(w, p2));
  return lineChoices(r, L, cand, fills, keep);
};

// ── dr.1：一次関数かどうか ─────────────────────────────────────
/** 一次関数の式（TeX）と、変化の割合 */
function linForm(r) {
  const kind = r(0, 4);
  if (kind === 0) { const L = randLine(r, INT_A, 9); return { tex: ltex(L), a: L.a }; }
  if (kind === 1) { const L = line(pick(r, [2, 3, 4, 5, 6, -2, -3, -4, -5]), 0); return { tex: ltex(L), a: L.a }; }
  if (kind === 2) { const a = r(1, 5), b = r(1, 9); return { tex: a === 1 ? `y=${b}-x` : `y=${b}-${a}x`, a: Q(-a) }; }
  if (kind === 3) { const k = r(2, 5), b = rnz(r, -6, 6); return { tex: `y=\\frac{x}{${k}}${b < 0 ? "-" : "+"}${Math.abs(b)}`, a: Q(1, k) }; }
  const [n, d] = pick(r, [[2, 3], [3, 4], [1, 2], [3, 2], [2, 5], [5, 2]]), b = rnz(r, -6, 6), s = pick(r, [1, -1]);
  const L = line(Q(s * n, d), b);
  return { tex: ltex(L), a: L.a };
}
/** 一次関数でない式（TeX）：反比例の形か、定数。kind＝0〜3 で、式の種類を指定できる。why＝一次関数でないわけ */
function nonLinForm(r, kind = r(0, 3)) {
  const k = pick(r, [2, 3, 4, 5, 6, 8, 10, 12]);
  if (kind === 0) return { tex: `y=\\frac{${k}}{x}`, why: "$x$ が分母にある（反比例の形）" };
  if (kind === 1) return { tex: `xy=${k}`, why: "$xy$ が一定の形（反比例）で、$y=ax+b$ の形にならない" };
  if (kind === 2) return { tex: `y=${pick(r, [1, 2, 3, 5, 7, -2, -4])}`, why: "$x$ をふくまない（$a=0$）" };
  return { tex: `y=-\\frac{${k}}{x}`, why: "$x$ が分母にある（反比例の形）" };
}
/** 負の数の「−」（文の中で使う） */
const mn = (n) => String(n).replace("-", "−");

// ── dr.8：タクシーなどの料金（どちらも基本料金あり）─────────────────────────────
//   A 社：基本料金 FA ＋ 1あたり pA　B 社：基本料金 FB ＋ 1あたり pB。FA＞FB で pA＜pB。同じ料金になる量 xeq＝(FA−FB)/(pB−pA)
const CTX2 = {
  taxi: { lead: "タクシーの ", u: "km", names: ["A 社", "B 社"], fee: "基本料金", def: "$x$ km 乗るときの料金を $y$ 円とする。", ask: (k) => `${k}km 乗る`, noun: "km", pA: [250, 300, 350], dp: [50, 100], FB: [300, 400, 500, 600], xs: [2, 3, 4, 5, 6], fstep: 100 },
  rent: { lead: "レンタカーの ", u: "日", names: ["A 社", "B 社"], fee: "基本料金", def: "$x$ 日借りるときの料金を $y$ 円とする。", ask: (k) => `${k}日借りる`, noun: "日", pA: [3000, 3500, 4000], dp: [500, 1000], FB: [2000, 3000, 4000], xs: [2, 3, 4, 5], fstep: 500 },
  phone: { lead: "スマートフォンの料金プランがある。", u: "GB", names: ["A プラン", "B プラン"], fee: "基本料", def: "1か月に $x$ GB 使うときの料金を $y$ 円とする。", ask: (k) => `${k}GB 使う`, noun: "GB", pA: [200, 300, 400], dp: [100, 200], FB: [500, 800, 1000, 1500], xs: [3, 4, 5, 6, 8], fstep: 100 },
};
function mk2(r, key) {
  const c = CTX2[key];
  for (let i = 0; i < 400; i++) {
    const pA = pick(r, c.pA), pB = pA + pick(r, c.dp), xeq = pick(r, c.xs), FB = pick(r, c.FB), FA = FB + (pB - pA) * xeq;
    if (FA % c.fstep !== 0) continue;
    const lA = line(pA, FA), lB = line(pB, FB), m = meet(lA, lB);
    if (!m || !qeq(m[0], Q(xeq))) throw new Error("料金の交点が合わない");
    const swap = r(0, 1) === 1, [nA, nB] = swap ? [c.names[1], c.names[0]] : c.names;
    const sp = /^[a-zA-Z]/.test(c.u) ? " " : "";
    const dA = `${nA}は、${c.fee} ${FA}円と、1${c.u}${sp}ごとに ${pA}円。`, dB = `${nB}は、${c.fee} ${FB}円と、1${c.u}${sp}ごとに ${pB}円。`;
    return { c, pA, pB, FA, FB, xeq, lA, lB, nA, nB, lead: `${c.lead}${swap ? dB + dA : dA + dB}${c.def}` };
  }
  throw new Error("mk2 が作れない");
}

// ── dr.9：折れ線グラフ（三角形 APC の面積）─────────────────────────
function peakCase(r) {
  for (let i = 0; i < 600; i++) {
    const p = r(3, 8), q = r(4, 10);
    if (p === q) continue;
    const h = Q(p * q, 2), L1 = lineThrough([0, 0], [p, h]), L2 = lineThrough([p, h], [p + q, 0]);
    if (!qeq(L1.a, Q(q, 2)) || !qeq(L2.a, Q(-p, 2))) throw new Error("折れ線の傾きが合わない");
    return { p, q, h, L1, L2 };
  }
  throw new Error("peakCase が作れない");
}
const peakText = (c) => `長方形 ABCD の辺上を、点 P が、A を出発して、B を通って C まで、毎秒 1cm で動く。$x$ 秒後の、三角形 APC の面積を $y$ cm² とする。$x$ と $y$ の関係を表すグラフは、3点 ${TX("(0, 0)")}、${TX(`(${c.p}, ${dt(c.h)})`)}、${TX(`(${c.p + c.q}, 0)`)} を、順に線分で結んだ折れ線である。`;

export const UNITS = [
  unit("17", {
    name: "一次関数のまとめ",
    desc: "一次関数の式・変化の割合・グラフ・変域・交点・利用を、ひととおり確かめる",
    prereqs: ["J2-ik16", "J2-g2c3u1"],
    points: [
      "$y$ が $x$ の一次関数であるとは、$y=ax+b$（$a$、$b$ は定数、$a\\neq 0$）の形で表されること。$y=ax$（比例）も、一次関数の特別な場合。変化の割合は一定で、$a$ に等しい。",
      "グラフは直線で、$a$ が傾き、$b$ が切片（$y$ 軸との交点 $(0, b)$）。$a>0$ なら右上がり、$a<0$ なら右下がり。$y=k$ は $x$ 軸に平行、$x=h$ は $y$ 軸に平行な直線。",
      "式は、傾きと1点、または2点の座標から求める。$y$ の変域は、$x$ の変域の両はしの値を式に代入して求める。傾きが負のときは、大小に注意する。",
      "2直線の交点の座標は、2つの式を連立方程式として解いた $(x, y)$ の組。料金・動く点などの問題は、式をつくって、方程式を解く。",
    ],
    levels: {
      // ───────── 1 基礎 ─────────
      1: [
        // 17d01a 一次関数であるものを選ぶ
        t("17d01a", (r) => {
          const f = linForm(r), wrongs = shuffle(r, [0, 1, 2, 3]).slice(0, 3).map((k) => nonLinForm(r, k).tex);
          const ans = TX(f.tex);
          return {
            q: "次のうち、$y$ が $x$ の一次関数であるものはどれか。",
            ans,
            choices: choices4(r, ans, wrongs.map(TX), () => TX(nonLinForm(r).tex)),
            hint: "一次関数は、$y=ax+b$（$a\\neq 0$）の形で表せる式。$x$ が分母にあるものや、$x$ をふくまないものは、その形になる？",
            steps: [`${ans} は $y=ax+b$ の形で表せる。`, "ほかの3つは、$x$ が分母にある（反比例の形）か、$x$ をふくまない（$a=0$）ので、一次関数ではない。"],
          };
        }),
        // 17d01b 一次関数でないものを選ぶ
        t("17d01b", (r) => {
          const nl = nonLinForm(r), ans = TX(nl.tex), ws = [];
          const seen = new Set([ans]);
          for (let n = 0; n < 40 && ws.length < 3; n++) { const f = TX(linForm(r).tex); if (!seen.has(f)) { seen.add(f); ws.push(f); } }
          return {
            q: "次のうち、$y$ が $x$ の一次関数でないものはどれか。",
            ans,
            choices: choices4(r, ans, ws),
            hint: "一次関数は、$y=ax+b$（$a\\neq 0$）の形で表せる式。どれが、その形にならない？",
            steps: [`${ans} は、${nl.why}ので、一次関数ではない。`, "ほかの3つは、$y=ax+b$（$a\\neq 0$）の形で表せる。（$y=ax$ のような比例の式も、一次関数）"],
          };
        }),
        // 17d01c 一次関数の変化の割合
        t("17d01c", (r) => {
          const f = linForm(r);
          return {
            q: `一次関数 ${TX(f.tex)} の、変化の割合は？`,
            ans: num(f.a),
            hint: "一次関数 $y=ax+b$ の変化の割合は、一定。それは、式の中の、どの数？ 符号にも気をつけよう。",
            steps: [`${TX(f.tex)} を $y=ax+b$ の形に見ると、$x$ の係数が ${TX(qt(f.a))}。`, `変化の割合は一定で、$a$ に等しいので、${TX(qt(f.a))}。`],
          };
        }),
        // 17d02a x が x1 から x2 まで増加するとき、y の増加量
        t("17d02a", (r) => {
          const L = randLine(r, INT_A, 6), x1 = r(-3, 3), x2 = x1 + r(1, 5), v1 = yAt(L, x1), v2 = yAt(L, x2), d = qsub(v2, v1);
          return {
            q: `一次関数 ${TX(ltex(L))} で、$x$ が ${mn(x1)} から ${mn(x2)} まで増加するとき、$y$ の増加量は？`,
            ans: num(d),
            hint: "$x$ がふえはじめる値と、ふえ終わる値を、それぞれ式に入れて、$y$ の値を求めよう。$y$ は、どれだけ変わった？",
            steps: [`${TX(`x=${x1}`)} のとき ${TX(`y=${aX(L.a, x1)}${L.b[0] < 0 ? "-" : "+"}${Math.abs(L.b[0])}=${qt(v1)}`)}。`, `${TX(`x=${x2}`)} のとき ${TX(`y=${aX(L.a, x2)}${L.b[0] < 0 ? "-" : "+"}${Math.abs(L.b[0])}=${qt(v2)}`)}。`, `$y$ の増加量は ${TX(`${qt(v2)}-${P(v1)}=${qt(d)}`)}。`],
          };
        }),
        // 17d02b x が x1 から x2 まで増加するとき、変化の割合
        t("17d02b", (r) => {
          const L = randLine(r, INT_A, 6), x1 = r(-3, 3), x2 = x1 + r(1, 5), v1 = yAt(L, x1), v2 = yAt(L, x2), d = qsub(v2, v1), rt = rate(L, x1, x2);
          return {
            q: `一次関数 ${TX(ltex(L))} で、$x$ が ${mn(x1)} から ${mn(x2)} まで増加するとき、変化の割合は？`,
            ans: num(rt),
            hint: "変化の割合は、（$y$ の増加量）÷（$x$ の増加量）。それぞれ、いくつ増えた？",
            steps: [`$x$ の増加量は ${TX(`${x2}-${P(x1)}=${x2 - x1}`)}。$y$ の増加量は ${TX(`${qt(v2)}-${P(v1)}=${qt(d)}`)}。`, `変化の割合は ${TX(`\\frac{${qt(d)}}{${x2 - x1}}=${qt(rt)}`)}。（一次関数では、いつも $a$ に等しい）`],
          };
        }),
        // 17d03a グラフが x 軸と交わる点の x 座標
        t("17d03a", (r) => {
          const a = pick(r, [[1, 2], [-1, 2], 2, -2, 3, -3, 1, -1]), A = Qa(a), x0 = rnz(r, -6, 6), b = qneg(qmul(A, Q(x0)));
          if (!qisintQ(b) || Math.abs(b[0]) > 9 || b[0] === 0) return { skip: true };
          const L = line(A, b), xi = xIntercept(L);
          return {
            q: `一次関数 ${TX(ltex(L))} のグラフは、直線である。このグラフが $x$ 軸と交わる点の、$x$ 座標は？`,
            ans: num(xi[0]),
            hint: "$x$ 軸の上の点では、$y$ の値は、いくつ？ それを式に入れると、どんな方程式になる？",
            steps: [`$x$ 軸上の点では ${TX("y=0")}。${TX(`0=${rhs(L)}`)} を解く。`, `${TX(`${cxq(A)}=${qt(qneg(b))}`)} より ${TX(`x=${qt(xi[0])}`)}。`],
          };
        }),
        // 17d03b グラフのようす（右上がり・右下がり、通る点）の4択
        t("17d03b", (r) => {
          const L = randLine(r, [1, 2, 3, 4, -2, -3, -4, -1, [1, 2], [-1, 2]], 6);
          const a = L.a, b = L.b;
          if (qeq(a, b) || qeq(a, Q(-1)) || qiszero(b)) return { skip: true };
          const up = a[0] > 0, dir = (u) => (u ? "右上がり" : "右下がり");
          const pts = { b: [Q(0), b], a: [Q(0), a], x: [b, Q(0)] };
          const txt = (u, k) => `${dir(u)}の直線で、点 ${PT(pts[k])} を通る。`;
          const right = txt(up, "b");
          const wrongs = shuffle(r, [txt(!up, "b"), txt(up, "a"), txt(!up, "a"), txt(up, "x")]);
          return {
            q: `一次関数 ${TX(ltex(L))} のグラフについて、正しい説明は、次のうちどれか。`,
            ans: right,
            choices: choices4(r, right, wrongs),
            hint: "傾きの符号で、右上がりか右下がりかが決まる。$y$ 軸と交わる点の座標は、切片から決まる。",
            steps: [`傾きは ${TX(qt(a))}${up ? "（正）" : "（負）"}だから、${dir(up)}。`, `切片は ${TX(qt(b))} だから、$y$ 軸と交わる点は ${PT(pts.b)}。`],
          };
        }),
        // 17d04a x の変域から、y の最大値・最小値
        t("17d04a", (r) => {
          const L = randLine(r, INT_A, 8), x1 = r(-3, 3), x2 = x1 + r(2, 5), [lo, hi] = yRange(L, x1, x2), ask = pick(r, ["最大値", "最小値"]);
          const v1 = yAt(L, x1), v2 = yAt(L, x2), neg = L.a[0] < 0;
          return {
            q: `一次関数 ${TX(ltex(L))} で、$x$ の変域が ${TX(`${x1}\\leqq x\\leqq ${x2}`)} のとき、$y$ の${ask}は？`,
            ans: num(ask === "最大値" ? hi : lo),
            hint: neg ? "傾きが負のとき、$x$ が大きくなると、$y$ は大きくなる？ 小さくなる？ 両はしの $x$ を式に入れてくらべよう。" : "傾きが正のとき、$x$ が大きくなると、$y$ は大きくなる？ 小さくなる？ 両はしの $x$ を式に入れてくらべよう。",
            steps: [`${TX(`x=${x1}`)} のとき ${TX(`y=${qt(v1)}`)}、${TX(`x=${x2}`)} のとき ${TX(`y=${qt(v2)}`)}。`, `傾きが${neg ? "負" : "正"}なので、$x$ が大きいほど $y$ は${neg ? "小さい" : "大きい"}。$y$ の変域は ${TX(`${qt(lo)}\\leqq y\\leqq ${qt(hi)}`)} で、${ask}は ${qt(ask === "最大値" ? hi : lo)}。`],
          };
        }),
        // 17d04b y の変域（4択）
        t("17d04b", (r) => {
          const L = randLine(r, INT_A, 8), x1 = r(-3, 3), x2 = x1 + r(2, 5), [lo, hi] = yRange(L, x1, x2);
          const rg = (u, v) => TX(`${qt(u)}\\leqq y\\leqq ${qt(v)}`);
          const right = rg(lo, hi);
          const cand = [];
          const L2 = line(qneg(L.a), L.b), L3 = line(L.a, qneg(L.b));
          cand.push(rg(...yRange(L2, x1, x2)), rg(...yRange(L3, x1, x2)), rg(Q(x1), Q(x2)), rg(hi, lo));
          const seen = new Set([right]), wrongs = [];
          for (const w of shuffle(r, cand)) { if (!seen.has(w)) { seen.add(w); wrongs.push(w); } }
          return {
            q: `一次関数 ${TX(ltex(L))} で、$x$ の変域が ${TX(`${x1}\\leqq x\\leqq ${x2}`)} のとき、$y$ の変域は、次のうちどれか。`,
            ans: right,
            choices: choices4(r, right, wrongs, (i) => rg(qsub(lo, Q(i + 1)), hi)),
            hint: "両はしの $x$ の値を、式に入れて、$y$ の値を求めよう。小さいほうを左に書く。",
            steps: [`${TX(`x=${x1}`)} のとき ${TX(`y=${qt(yAt(L, x1))}`)}、${TX(`x=${x2}`)} のとき ${TX(`y=${qt(yAt(L, x2))}`)}。`, `小さいほうを左に書いて ${right}。`],
          };
        }),
        // 17q02 小テスト（2）x の変域が −1≦x≦3 のとき、y の変域（最大値・最小値）
        t("17q02", (r) => {
          const L = randLine(r, [-2, -3, -1, -4, 2, 3, 1], 9), x1 = r(-3, -1), x2 = r(2, 4), [lo, hi] = yRange(L, x1, x2), ask = pick(r, ["最大値", "最小値"]);
          return {
            q: `一次関数 ${TX(ltex(L))} で、$x$ の変域が ${TX(`${x1}\\leqq x\\leqq ${x2}`)} のとき、$y$ の${ask}は？`,
            ans: num(ask === "最大値" ? hi : lo),
            hint: "$x$ の両はしの値を、式に入れてみよう。傾きが負のときは、大小に気をつけて。",
            steps: [`${TX(`x=${x1}`)} のとき ${TX(`y=${aX(L.a, x1)}${L.b[0] < 0 ? "-" : "+"}${Math.abs(L.b[0])}=${qt(yAt(L, x1))}`)}。`, `${TX(`x=${x2}`)} のとき ${TX(`y=${aX(L.a, x2)}${L.b[0] < 0 ? "-" : "+"}${Math.abs(L.b[0])}=${qt(yAt(L, x2))}`)}。${TX(`${qt(lo)}\\leqq y\\leqq ${qt(hi)}`)} だから、${ask}は ${qt(ask === "最大値" ? hi : lo)}。`],
          };
        }),
      ],
      // ───────── 2 標準 ─────────
      2: [
        // 17d05a 傾きと 1点から、式（4択）
        t("17d05a", (r) => {
          const L = randLine(r, [1, 2, 3, 4, -1, -2, -3, -4, [1, 2], [-1, 2]], 8), x0 = r(-3, 4), y0 = yAt(L, x0);
          if (y0[1] !== 1 || Math.abs(y0[0]) > 14 || x0 === 0) return { skip: true };
          const a = L.a, b = L.b, p = [Q(x0), y0];
          return {
            q: `傾きが ${TX(qt(a))} で、点 ${PT(p)} を通る一次関数の式は、次のうちどれか。`,
            ans: TX(ltex(L)),
            choices: lineChoices(r, L, [
              line(a, qadd(y0, qmul(a, Q(x0)))),         // 切片の代入ミス（y＋a×x としてしまう）
              line(a, y0),                               // 切片を y 座標そのものにしてしまう
              line(qneg(a), qadd(y0, qmul(a, Q(x0)))),   // 傾きの符号をまちがえ、切片もずれる
              line(b, a),                                // 傾きと切片の入れかえ
              line(a, qsub(y0, a)),                      // x をかけわすれる
            ], [line(qadd(a, Q(1)), b), line(a, qadd(b, Q(1)))], (w) => !onLine(w, p)),
            hint: "式を $y=ax+b$ と書くと、$a$ はわかっている。通る点の座標を代入すると、$b$ はどうやって決まる？",
            steps: [`傾きが ${TX(qt(a))} だから、${TX(`y=${cxq(a)}+b`)}。`, `点 ${PT(p)} を通るので、${TX(`${qt(y0)}=${aX(a, x0)}+b`)} より ${TX(`b=${qt(b)}`)}。`, `式は ${TX(ltex(L))}。`],
          };
        }),
        // 17d05b 2点から、式（4択）
        t("17d05b", (r) => {
          const L = randLine(r, INT_A.concat([[1, 2], [-1, 2]]), 7), pts = pickPts(r, L, { gap: 5, first0: r(0, 1) === 0 });
          if (!pts) return { skip: true };
          const [p1, p2] = pts;
          return {
            q: `2点 ${PT(p1)}、${PT(p2)} を通る一次関数の式は、次のうちどれか。`,
            ans: TX(ltex(L)),
            choices: twoPtChoices(r, L, p1, p2, L.a[1] === 1),
            hint: "2点の座標から、まず傾きを出せるかな？ そのあと、切片は、どうやって決める？",
            steps: [slopeLine(p1, p2), interceptLine(L.a, p1), `式は ${TX(ltex(L))}。`],
          };
        }),
        // 17d05c 2点から求めた式で、切片・x＝k のときの y
        t("17d05c", (r) => {
          const L = randLine(r, INT_A, 7), pts = pickPts(r, L, { gap: 5 });
          if (!pts) return { skip: true };
          const [p1, p2] = pts, askB = r(0, 1) === 0, X = pick(r, [5, 6, 8, 10, -3, -5].filter((v) => v !== p1[0] && v !== p2[0]));
          return {
            q: askB
              ? `グラフが 2点 ${PT(p1)}、${PT(p2)} を通る一次関数 $y=ax+b$ の、切片 $b$ の値は？`
              : `グラフが 2点 ${PT(p1)}、${PT(p2)} を通る一次関数で、$x=${X}$ のときの $y$ の値は？`,
            ans: num(askB ? L.b : yAt(L, X)),
            hint: askB ? "まず、2点の座標から傾きを出そう。そのあと、通る1点の座標を式に入れると、どんな方程式になる？" : "まず、2点から式をつくろう。そのあと、$x$ の値を式に入れると？",
            steps: askB ? [slopeLine(p1, p2), interceptLine(L.a, p1)] : [slopeLine(p1, p2), `${interceptLine(L.a, p1)}式は ${TX(ltex(L))}。`, `${TX(`x=${X}`)} のとき ${TX(`y=${aX(L.a, X)}${L.b[0] < 0 ? "-" : "+"}${Math.abs(L.b[0])}=${qt(yAt(L, X))}`)}。`],
          };
        }),
        // 17d06a ax+by＝c を y について解いて、傾き・切片
        t("17d06a", (r) => {
          const a = pick(r, [1, 2, 3, 4, 5, 6, -1, -2, -3]), b = pick(r, [2, 3, 4, -2, -3]), k = rnz(r, -4, 4), c = b * k;
          if (Math.abs(c) > 20) return { skip: true };
          const L = fromStd(a, b, c), ask = r(0, 1) === 0 ? "傾き" : "切片";
          const eq = linTex(a, b, c), mv = ptex(poly([-a, { x: 1 }], [c, {}]));
          return {
            q: `方程式 ${TX(eq)} を、$y$ について解くと、一次関数の式になる。その式の${ask}は？`,
            ans: num(ask === "傾き" ? L.a : L.b),
            hint: "$y$ の項だけを左辺に残すには、$x$ の項を、どうすればいい？ そのあと、$y$ の係数でわる。",
            steps: [`${TX(eq)} の $x$ の項を右辺に移項して、${TX(`${b === 1 ? "" : b}y=${mv}`)}。`, `両辺を ${mn(b)} でわって、${TX(ltex(L))}。`, ask === "傾き" ? `傾きは ${TX(qt(L.a))}。` : `切片は ${TX(qt(L.b))}。`],
          };
        }),
        // 17d06b y＝k、x＝h のグラフ（通る点と平行な軸）の4択
        t("17d06b", (r) => {
          const isY = r(0, 1) === 0, k = rnz(r, -6, 6), eq = isY ? `y=${k}` : `x=${k}`;
          const pt = (axis) => TX(axis === "x" ? `(${k}, 0)` : `(0, ${k})`);
          const txt = (pointAxis, par) => `点 ${pt(pointAxis)} を通り、$${par}$ 軸に平行な直線。`;
          // y＝k は (0, k) を通り x 軸に平行。x＝h は (h, 0) を通り y 軸に平行。
          const right = isY ? txt("y", "x") : txt("x", "y");
          const wrongs = isY ? [txt("x", "x"), txt("y", "y"), txt("x", "y")] : [txt("y", "y"), txt("x", "x"), txt("y", "x")];
          return {
            q: `方程式 ${TX(eq)} のグラフについて、正しい説明は、次のうちどれか。`,
            ans: right,
            choices: choices4(r, right, wrongs),
            hint: isY ? "$y=k$ の式では、$x$ がどんな値でも、$y$ はいくつ？ そのとき、点はどこに並ぶ？" : "$x=h$ の式では、$y$ がどんな値でも、$x$ はいくつ？ そのとき、点はどこに並ぶ？",
            steps: isY
              ? [`${TX(eq)} は、$x$ がどんな値でも $y$ は ${k}。点 ${pt("y")} を通る。`, `$y$ の値がいつも ${k} なので、$x$ 軸に平行な直線。`]
              : [`${TX(eq)} は、$y$ がどんな値でも $x$ は ${k}。点 ${pt("x")} を通る。`, `$x$ の値がいつも ${k} なので、$y$ 軸に平行な直線。`],
          };
        }),
        // 17q01 小テスト（1）2点を通る一次関数の式（4択）
        t("17q01", (r) => {
          const L = randLine(r, [-3, -2, -1, 1, 2, 3, 4, -4], 8), x1 = r(0, 2), x2 = x1 + r(1, 3), p1 = [x1, yAt(L, x1)[0]], p2 = [x2, yAt(L, x2)[0]];
          if (Math.abs(p1[1]) > 14 || Math.abs(p2[1]) > 14) return { skip: true };
          return {
            q: `グラフが 2点 ${PT(p1)}、${PT(p2)} を通る一次関数の式は、次のうちどれか。`,
            ans: TX(ltex(L)),
            choices: twoPtChoices(r, L, p1, p2, true),
            hint: "2点の座標から、傾きを求めよう。そのあと、1点の座標を代入して、切片を求める。",
            steps: [slopeLine(p1, p2), interceptLine(L.a, p1), `式は ${TX(ltex(L))}。`],
          };
        }),
        // 17q03a 小テスト（3）2直線の交点の座標（4択）
        t("17q03a", (r) => {
          const c = crossCase(r);
          const right = PT(c.m), wrongs = [];
          const seen = new Set([right]);
          for (const w of shuffle(r, [[c.m[1], c.m[0]], [qneg(c.m[0]), c.m[1]], [c.m[0], qneg(c.m[1])], [qadd(c.m[0], Q(1)), c.m[1]], [c.m[0], qadd(c.m[1], Q(1))]])) {
            const s = PT(w);
            if (seen.has(s) || (onLine(c.l1, w) && onLine(c.l2, w))) continue;
            seen.add(s); wrongs.push(s);
          }
          return {
            q: `2直線 ${TX(ltex(c.l1))}、${TX(ltex(c.l2))} の交点の座標は、次のうちどれか。`,
            ans: right,
            choices: choices4(r, right, wrongs),
            hint: "交点は、2つの直線の上にある点。$x$ と $y$ は、どちらの式も成り立つ。2つの式の右辺を、等しいとおけないかな？",
            steps: crossSteps(c),
          };
        }),
        // 17q03b 2直線の交点の x 座標・y 座標
        t("17q03b", (r) => {
          const c = crossCase(r), askX = r(0, 1) === 0;
          return {
            q: `2直線 ${TX(ltex(c.l1))}、${TX(ltex(c.l2))} の交点の ${askX ? "$x$" : "$y$"} 座標は？`,
            ans: num(askX ? c.m[0] : c.m[1]),
            hint: "交点では、2つの式の $y$ が等しい。右辺を等しいとおくと、$x$ についての方程式になる。",
            steps: crossSteps(c),
          };
        }),
        // 17q04a 小テスト（4）プリペイドカード：y を x の式で（4択）
        t("17q04a", (r) => {
          const c = cardCase(r);
          return {
            q: `${c.text}残高 $y$ 円を、$x$ の式で表すと、次のうちどれか。`,
            ans: TX(ltex(c.L)),
            choices: lineChoices(r, c.L, [line(c.d, c.B), line(c.B, -c.d), line(-c.B, c.d), line(c.d, -c.B), line(-c.d, -c.B)], [line(-c.d, c.B + 100), line(-c.d - 10, c.B)]),
            hint: "使うごとに、残高は、増える？ 減る？ はじめの残高は、式のどこに入る？",
            steps: [`はじめの残高が ${c.B}円で、1回ごとに ${c.d}円ずつ減る。`, `$x$ 回使うと ${c.d}x 円減るので、${TX(ltex(c.L))}。`],
          };
        }),
        // 17q04b 小テスト（4）残高が 280円になるのは何回使ったときか
        t("17q04b", (r) => {
          const c = cardCase(r);
          return {
            q: `${c.text}残高が ${c.R}円になるのは、何回使ったときか。`,
            ans: c.x0, unit: "回",
            hint: "まず、残高 $y$ を $x$ の式で表そう。残高が決まった金額になるとき、その式の $y$ に何を入れる？",
            steps: [`残高は ${TX(ltex(c.L))}。`, `${TX(`${c.R}=${rhs(c.L)}`)} より ${TX(`${c.d}x=${c.B - c.R}`)}、${TX(`x=${c.x0}`)}（回）。`],
          };
        }),
      ],
      // ───────── 3 応用 ─────────
      3: [
        // 17d07 2直線と y 軸で囲まれた三角形の面積
        t("17d07", (r) => {
          for (let n = 0; n < 300; n++) {
            const a1 = pick(r, [-3, -2, -1, 1, 2, 3]), a2 = pick(r, [-3, -2, -1, 1, 2, 3]), b1 = rnz(r, -6, 6), b2 = rnz(r, -6, 6);
            if (a1 === a2 || b1 === b2) continue;
            const l1 = line(a1, b1), l2 = line(a2, b2), m = meet(l1, l2);
            if (!m || m[0][1] !== 1 || m[0][0] < 1 || m[0][0] > 6 || m[1][1] !== 1) continue;
            const base = Math.abs(b1 - b2), area = triArea([0, b1], [0, b2], m);
            if (!qeq(area, Q(base * m[0][0], 2))) throw new Error("三角形の面積が合わない");
            return {
              q: `2つの直線 ${TX(ltex(l1))}、${TX(ltex(l2))} と、$y$ 軸で囲まれた三角形の面積を求めよう。（座標の 1目もりを 1cm とする。）`,
              ans: ansOf(area), unit: "cm²",
              hint: "三角形の3つの頂点は、どこ？ $y$ 軸の上にある辺を底辺とすると、高さは、どこの座標？",
              steps: [`交点は ${TX(`${rhs(l1)}=${rhs(l2)}`)} より ${TX(`${cxq(Q(a1 - a2))}=${b2 - b1}`)}、${TX(`x=${m[0][0]}`)}、${TX(`y=${m[1][0]}`)}。交点は ${PT(m)}。`, `$y$ 軸との交点は ${PT([0, b1])} と ${PT([0, b2])}。$y$ 軸上の辺を底辺とすると、底辺 ${TX(`${Math.max(b1, b2)}-${P(Math.min(b1, b2))}=${base}`)}（cm）、高さは交点の $x$ 座標 ${m[0][0]}cm。`, `${TX(`${HALF}\\times ${base}\\times ${m[0][0]}=${dt(area)}`)}（cm²）。`],
            };
          }
          return { skip: true };
        }),
        // 17d08a タクシー：A 社の式（4択）
        t("17d08a", (r) => {
          const p = mk2(r, pick(r, ["taxi", "rent", "phone"]));
          return {
            q: `${p.lead}${p.nA}の料金 $y$ 円を、$x$ の式で表すと、次のうちどれか。`,
            ans: TX(ltex(p.lA)),
            choices: lineChoices(r, p.lA, [line(p.FA, p.pA), line(p.pA, -p.FA), line(p.pA + p.FA, 0), line(p.pA, 0), line(p.pB, p.FA), line(p.pA, p.FB)], [line(p.pA * 2, p.FA), line(p.pA, p.FA * 2)]),
            hint: `料金は、「${p.c.fee}」と「${p.c.u}数ぶんの料金」の和。$x$ ${p.c.u}ぶんの料金は、$x$ を使って、どう表せる？`,
            steps: [`（料金）＝（1${p.c.u}の料金）×（${p.c.u}数）＋（${p.c.fee}）。`, `${p.nA}は、1${p.c.u}が ${p.pA}円で、${p.c.fee}が ${p.FA}円だから、${TX(ltex(p.lA))}。`],
          };
        }),
        // 17d08b タクシー：同じ料金になるのは何 km のときか
        t("17d08b", (r) => {
          const p = mk2(r, pick(r, ["taxi", "rent", "phone"]));
          return {
            q: `${p.lead}2つの料金が同じになるのは、何${p.c.u}のときか。`,
            ans: p.xeq, unit: p.c.u,
            hint: "料金が同じとき、2つの式の $y$ は、どんな関係になる？ そこから、$x$ についての方程式がつくれないかな？",
            steps: [`${p.nA}は ${TX(ltex(p.lA))}、${p.nB}は ${TX(ltex(p.lB))}。`, `料金が等しいので ${TX(`${rhs(p.lA)}=${rhs(p.lB)}`)}。移項して ${TX(`${cxq(Q(p.pB - p.pA))}=${p.FA - p.FB}`)}、${TX(`x=${p.xeq}`)}。`, `${p.xeq}${p.c.u}のとき、同じ料金（${yAt(p.lA, p.xeq)[0]}円）になる。`],
          };
        }),
        // 17d08c タクシー：5km 乗るときは、どちらが安いか
        t("17d08c", (r) => {
          const p = mk2(r, pick(r, ["taxi", "rent", "phone"])), step = p.xeq >= 20 ? 5 : 1;
          const ks = [];
          for (let j = 1; j <= 4; j++) { if (p.xeq - step * j >= 1) ks.push(p.xeq - step * j); ks.push(p.xeq + step * j); }
          const k = pick(r, ks), pa = yAt(p.lA, k)[0], pb = yAt(p.lB, k)[0], aCheap = pa < pb;
          const right = aCheap ? `${p.nA}、${pa}円` : `${p.nB}、${pb}円`;
          return {
            q: `${p.lead}${p.c.ask(k)}とき、安いのはどちらか。また、そのときの料金はいくらか。「安いほう、その料金」の組として正しいものは、次のうちどれか。`,
            ans: right,
            choices: choices4(r, right, [aCheap ? `${p.nB}、${pb}円` : `${p.nA}、${pa}円`, `${p.nA}、${pb}円`, `${p.nB}、${pa}円`]),
            hint: `${p.nA}、${p.nB}の式に、$x=${k}$ を入れると、それぞれの料金はいくらになる？ 低いのはどちら？`,
            steps: [`${p.nA}は ${TX(`y=${p.pA}\\times ${k}+${p.FA}=${pa}`)}（円）。`, `${p.nB}は ${TX(`y=${p.pB}\\times ${k}+${p.FB}=${pb}`)}（円）。`, `${aCheap ? pa : pb}円のほうが安いので、${right}。`],
          };
        }),
      ],
      // ───────── 4 入試レベル ─────────
      4: [
        // 17d09a 折れ線グラフ：AB・BC の長さ
        t("17d09a", (r) => {
          const c = peakCase(r), askAB = r(0, 1) === 0;
          return {
            q: `${peakText(c)}${askAB ? "AB" : "BC"} の長さは何 cm か。`,
            ans: askAB ? c.p : c.q, unit: "cm",
            hint: askAB ? "グラフが折れる点は、P がどこに来たときかな？ そのとき、$x$ はいくつ？" : "グラフが折れる点と、$y$ が 0 にもどる点は、それぞれ、P がどこに来たとき？",
            steps: askAB
              ? [`$y$ が最大になる（グラフが折れる）のは、P が B に来たとき。$x=${c.p}$ のとき。`, `毎秒 1cm で ${c.p}秒動いたので、AB＝${c.p}cm。`]
              : [`P が B に来るのは $x=${c.p}$、C に来る（$y$ が 0 にもどる）のは $x=${c.p + c.q}$ のとき。`, `BC＝${TX(`${c.p + c.q}-${c.p}=${c.q}`)}（cm）。`],
          };
        }),
        // 17d09b 折れ線グラフ：y＝9 になるのは何秒後か（2回ある。早いほう・遅いほう・2回の合計）
        t("17d09b", (r) => {
          for (let n = 0; n < 300; n++) {
            const c = peakCase(r), x1 = r(1, c.p - 1), k = qmul(Q(c.q, 2), Q(x1));
            if (!isFin(k) || qval(k) >= qval(c.h)) continue;
            const x2 = xAt(c.L2, k);
            if (!isFin(x2) || qval(x2) <= c.p || qval(x2) >= c.p + c.q) continue;
            const ask = pick(r, ["early", "late", "sum"]), xs = ask === "early" ? Q(x1) : ask === "late" ? x2 : qadd(Q(x1), x2);
            const askT = ask === "early" ? "1回目（早いほう）は、何秒後か。" : ask === "late" ? "2回目（遅いほう）は、何秒後か。" : "その 2回の時刻（秒後）を合わせた合計は、何秒か。";
            return {
              q: `${peakText(c)}三角形 APC の面積が ${dt(k)}cm² になるのは、A を出発してから、2回ある。${askT}`,
              ans: ansOf(xs), unit: ask === "sum" ? "秒" : "秒後",
              hint: `グラフは折れ線。${TX(`0\\leqq x\\leqq ${c.p}`)} のときと、それ以降とで、式がちがう。それぞれの式に、面積の値を入れてみよう。`,
              steps: [
                `0≦x≦${c.p} のとき ${TX(ltex(c.L1))}、${c.p}≦x≦${c.p + c.q} のとき ${TX(ltex(c.L2))}。（2点の座標から求めた）`,
                `${TX(`${rhs(c.L1)}=${dt(k)}`)} より ${TX(`x=${x1}`)}。${TX(`${rhs(c.L2)}=${dt(k)}`)} より ${TX(`x=${dt(x2)}`)}。どちらも変域に合う。`,
                ask === "early" ? `1回目（早いほう）は ${x1}秒後。` : ask === "late" ? `2回目（遅いほう）は ${dt(x2)}秒後。` : `合計は ${TX(`${x1}+${dt(x2)}=${dt(qadd(Q(x1), x2))}`)}（秒）。`,
              ],
            };
          }
          return { skip: true };
        }),
        // 17q05 チャレンジ：三角形 PAC の面積
        t("17q05", (r) => {
          for (let n = 0; n < 400; n++) {
            const a = r(1, 4), b = r(2, 6), l = lineThrough([-a, 0], [0, b]);
            const px = a * r(1, 3), py = yAt(l, px);
            if (py[1] !== 1) continue;
            const s = pick(r, [1, 1, 2, 3]), c1 = py[0] + s * px, m = line(-s, c1), C = xIntercept(m);
            if (C[0][1] !== 1 || C[0][0] <= px || C[0][0] > 14 || Math.abs(c1) > 24) continue;
            const mp = meet(l, m);
            if (!mp || !qeq(mp[0], Q(px)) || !qeq(mp[1], py)) throw new Error("交点が合わない");
            const A = [Q(-a), Q(0)], Pp = [Q(px), py], Cc = [C[0], Q(0)], area = triArea(A, Pp, Cc), AC = qsub(C[0], Q(-a));
            if (!qeq(area, Q(AC[0] * py[0], 2))) throw new Error("PAC の面積が合わない");
            return {
              q: `直線 ℓ は 2点 A(−${a}, 0)、B(0, ${b}) を通り、直線 m の式は ${TX(ltex(m))} である。ℓ と m の交点を P、m と $x$ 軸との交点を C とする。三角形 PAC の面積を求めよう。（座標の 1目もりを 1cm とする。）`,
              ans: ansOf(area), unit: "cm²",
              hint: "まず、ℓ の式を求めよう。P、C の座標がわかれば、三角形 PAC の底辺と高さは、どの長さ？",
              steps: [
                `ℓ の式は、切片 ${b}、傾き ${TX(`\\frac{${b}-0}{0-(${-a})}=${qt(l.a)}`)} より ${TX(ltex(l))}。`,
                `P は ${TX(`${rhs(l)}=${rhs(m)}`)} より ${TX(`x=${px}`)}、${TX(`y=${py[0]}`)}。P は ${PT(Pp)}。C は ${TX(`0=${rhs(m)}`)} より ${TX(`x=${C[0][0]}`)}。C は ${PT(Cc)}。`,
                `AC＝${TX(`${C[0][0]}-(${-a})=${AC[0]}`)}（cm）、高さは P の $y$ 座標 ${py[0]}cm。${TX(`${HALF}\\times ${AC[0]}\\times ${py[0]}=${dt(area)}`)}（cm²）。`,
              ],
            };
          }
          return { skip: true };
        }),
      ],
    },
  }),
];

// ── 交点・プリペイドカードの問題データ ───────────────────────────────
const qisintQ = (x) => Qa(x)[1] === 1;
/** 2直線とその交点（交点は整数の座標） */
function crossCase(r) {
  for (let n = 0; n < 400; n++) {
    const a1 = pick(r, [-3, -2, -1, 1, 2, 3]), a2 = pick(r, [-3, -2, -1, 1, 2, 3]), b1 = rnz(r, -8, 8), b2 = rnz(r, -8, 8);
    if (a1 === a2 || b1 === b2) continue;
    const l1 = line(a1, b1), l2 = line(a2, b2), m = meet(l1, l2);
    if (!m || m[0][1] !== 1 || m[1][1] !== 1 || Math.abs(m[0][0]) > 8 || Math.abs(m[1][0]) > 14 || m[0][0] === 0 || m[1][0] === 0) continue;
    return { l1, l2, m, a1, a2, b1, b2 };
  }
  throw new Error("crossCase が作れない");
}
const crossSteps = (c) => [
  `交点では $y$ が等しいので ${TX(`${rhs(c.l1)}=${rhs(c.l2)}`)}。`,
  `移項して ${TX(`${cxq(Q(c.a1 - c.a2))}=${c.b2 - c.b1}`)}、${TX(`x=${qt(c.m[0])}`)}。`,
  `${TX(`y=${aX(c.a1, c.m[0])}${c.b1 < 0 ? "-" : "+"}${Math.abs(c.b1)}=${qt(c.m[1])}`)} より、交点は ${PT(c.m)}。`,
];
/** プリペイドカード：はじめの残高 B 円、1回使うごとに d 円ずつ減る */
function cardCase(r) {
  for (let n = 0; n < 300; n++) {
    const B = pick(r, [500, 800, 1000, 1500, 2000, 3000]), d = pick(r, [50, 80, 100, 120, 150, 200, 250]), x0 = r(3, 9), R = B - d * x0;
    if (R < 100 || R % 10 !== 0) continue;
    return { B, d, x0, R, L: line(-d, B), text: `プリペイドカードに ${B}円入っている。1回使うごとに ${d}円ずつ減る。$x$ 回使ったあとの残高を $y$ 円とする。` };
  }
  throw new Error("cardCase が作れない");
}

// 移さなかった問題
export const SKIPPED = [];   // 第17時は、演習プリント 9問・小テスト 5問のすべてを移した（グラフをかく小問は x 軸との交点・グラフのようすの4択に、グラフの読みとりは頂点の座標を文で言い切る形に直した）
