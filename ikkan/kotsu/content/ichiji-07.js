// ============================================================
// ichiji-07.js — 一次関数 第7時「式とグラフのカードを合わせて、決め手を説明しよう」（遊：式とグラフのカード合わせ）
//   ikkan の演習プリント（ichiji-07.dr.1〜7）・小テスト（ichiji-07.qz.1〜4）を、コツコツくんのテンプレートにしたもの。
//   テンプレート id＝「07」＋ d（演習）／q（小テスト）＋ ikkan の問題の番号（＋ 型ごとに a, b…）。例：07d02a ＝ ichiji-07.dr.2 の①、07d02b ＝ ②
//   カード・グラフ（図）は問題文に出せないので、「図の直線の式を選ぶ・求める」は、「この 2 点を通る直線の式はどれか（4択）」「2 点を通る直線の傾きは？」のように、
//   直線が通る 2 点の座標で言い切る。「式 y＝… の直線について正しいのは」は、式と、傾き・切片・右上がり／右下がり・平行・y 軸上の同じ点の対応を聞く4択にした。
//   式・傾き・切片・面積は、linear.js（直線 y＝ax+b を計算で扱う）から出す。誤答の式は、問題の条件（通る 2 点・平行）をみたさないことを onLine・parallel で確かめてから出す。
// ============================================================
import { t, pick, choices4, shuffle, rnz, gcd, sgn, round } from "../kit.js";
import { unitFor } from "../unit-kit.js";
import { Q, qadd, qmul, qdiv, qneg, qeq, qval, qisint } from "../algebra.js";
import { line, yAt, triArea, onLine, parallel, ltex, ptex2, qt, num } from "../linear.js";

const unit = unitFor("ichiji");

// ── 道具（この授業の問題用に足した小さな関数）──────────────────────────
const $ = (s) => `$${s}$`;
const Z = (x) => (Array.isArray(x) ? Q(x[0], x[1]) : Q(x));
/** 負の数にはかっこをつけた TeX */
const par = (x) => { const v = Z(x); return v[0] < 0 ? `(${qt(v)})` : qt(v); };
/** 文の中の数（負の数・分数は TeX に） */
const N = (x) => { const v = Z(x); return v[0] >= 0 && v[1] === 1 ? String(v[0]) : $(qt(v)); };
const PT = (p) => $(ptex2(p));
const both = (l, p1, p2) => onLine(l, p1) && onLine(l, p2);
const UD = (n) => (n > 0 ? "上" : "下");
/** 既約分数 p/q（p, q は正で q≧2）を選ぶ */
const fr = (r, ps, qs) => { for (let i = 0; i < 300; i++) { const p = pick(r, ps), q = pick(r, qs); if (q >= 2 && gcd(p, q) === 1) return [p, q]; } return [1, 2]; };
/** 係数つきの x の TeX（c は Q）  x, -x, 3x, \frac{3}{4}x */
const cx = (c) => { const [n, d] = c, ab = Math.abs(n), co = d === 1 ? (ab === 1 ? "" : String(ab)) : `\\frac{${ab}}{${d}}`; return `${n < 0 ? "-" : ""}${co}x`; };
/** y＝ax+b に x を入れた右辺の TeX  例 2\times 3-1 */
const evalTex = (l, x) => {
  const X = par(x), a = l.a, b = l.b;
  let s;
  if (qeq(a, Q(1))) s = X; else if (qeq(a, Q(-1))) s = `-${X}`; else s = `${qt(a)}\\times ${X}`;
  if (b[0] !== 0) s += (b[0] < 0 ? "" : "+") + qt(b);
  return s;
};
/** y＝…＝値 の TeX（右辺の式と値が同じなら、値だけ） */
const calcTex = (l, x) => { const e = evalTex(l, x), y = qt(yAt(l, x)); return e === y ? `y=${y}` : `y=${e}=${y}`; };
/** 傾きの候補（整数と分数） */
const SLOPES = [1, 2, 3, 4, -1, -2, -3, -4, [1, 2], [1, 3], [2, 3], [3, 2], [-1, 2], [-1, 3], [-2, 3], [-3, 2]].map(Z);
const recip = (a) => qdiv(Q(1), a);

/**
 * 式の4択：正解 right（直線）、ありがちな誤答 wrongs（直線の配列。先のものを優先）。
 * bad(l) が true の直線（＝問題の条件をみたしてしまうもの）は、誤答に入れない。
 */
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

/** 2 点 P1, P2 を通る直線の誤答（ありがちな間違い）。a・b は正しい傾き・切片 */
const pointWrongs = (a, b, P1) => [
  line(recip(a), b),            // x の増加量と y の増加量を取りちがえた
  line(qneg(a), b),             // 傾きの符号まちがい
  line(b, a),                   // 傾きと切片のいれかえ
  line(a, qneg(b)),             // 切片の符号まちがい
  line(a, P1[1]),               // 点の y 座標を、そのまま切片にした
];

/** 傾き ±p/q の直線のうち、切片が整数のもの。ps/qs＝傾きの分子・分母の候補 */
const stepLine = (r, ps, qs, B) => {
  const [p, q] = fr(r, ps, qs), s = sgn(r), b = rnz(r, -B, B);
  return { p, q, s, b, a: Q(s * p, q), L: line(Q(s * p, q), b) };
};
/** 「（y の増加量）÷（x の増加量）」の計算の TeX */
const slopeCalc = (dy, dx, a) => `${dy < 0 ? `(${dy})` : dy}\\div ${dx < 0 ? `(${dx})` : dx}=${qt(a)}`;

/** 通る 2 点（切片の点をふくむ）から式を選ぶ4択 */
const eqFromPoints = (r, slopes, B, ks) => {
  const [pp, qq] = pick(r, slopes), s = sgn(r), b = rnz(r, -B, B), a = Q(s * pp, qq), L = line(a, b), k = pick(r, ks);
  const P0 = [0, b], P1 = [k * qq, b + k * s * pp], pts = r(0, 1) ? [P0, P1] : [P1, P0];
  const { ans, choices } = eqChoices(r, L, pointWrongs(a, b, P1), (l) => both(l, P0, P1));
  return {
    q: `${PT(pts[0])} と ${PT(pts[1])} を通る直線の式は、次のうちどれか。`,
    ans, choices,
    hint: "x 座標が 0 の点の y 座標が、切片。傾きは、x が増えたときの y の増え方から考えよう。",
    steps: [`点 ${PT(P0)} は x 座標が 0 だから、切片は ${N(b)}。`, `x が ${k * qq} 増えると y が ${Math.abs(k * pp)} ${s > 0 ? "増える" : "減る"}。傾きは、${$(slopeCalc(k * s * pp, k * qq, a))}。`, `式は ${$(ltex(L))}。`],
  };
};

/** 4択：a、b の符号の組み合わせ */
const SIGNS = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
const signText = (sa, sb) => `${$(`a${sa > 0 ? ">" : "<"}0`)}、${$(`b${sb > 0 ? ">" : "<"}0`)}`;

export const UNITS = [
  unit("07", {
    name: "式とグラフを、傾きと切片で結びつけよう",
    desc: "式から、傾き・切片・グラフの向き・平行・y 軸上の点を読みとる",
    prereqs: ["J2-ik06", "J2-g2c3u1"],
    points: [
      "$y=ax+b$ の $a$ が傾き、$b$ が切片。切片は、グラフが $y$ 軸と交わる点 $(0, b)$ の $y$ 座標。",
      "傾きが正の数なら右上がり、負の数なら右下がりのグラフになる。$b=0$ のグラフは、原点を通る。",
      "傾きが同じ（切片がちがう）2 つのグラフは平行。切片が同じなら、$y$ 軸上の同じ点を通る。",
      "グラフから式を求めるときは、まず切片、つぎに傾き（2 点の座標から、$y$ の増加量 ÷ $x$ の増加量）を読みとる。",
    ],
    levels: {
      // ───────── 1 基礎 ─────────
      1: [
        // 07d01 演習（1）図の直線の式をア〜エから選ぶ → 通る 2 点から式を選ぶ
        t("07d01", (r) => eqFromPoints(r, [[1, 1], [2, 1], [3, 1], [1, 2], [1, 3]], 4, [1, 1, 2])),
        // 07q01 小テスト（1）右上がりか右下がりか、切片はいくつか
        t("07q01", (r) => {
          const s = sgn(r), A = pick(r, [Q(1), Q(2), Q(3), Q(4), Q(1, 2), Q(1, 3), Q(2, 3), Q(3, 2), Q(3, 4)]), a = qmul(Q(s), A), b = rnz(r, -6, 6), L = line(a, b);
          const dir = s > 0 ? "右上がり" : "右下がり", opp = s > 0 ? "右下がり" : "右上がり";
          const right = `${dir}で、切片は ${N(b)}`;
          return {
            q: `一次関数 ${$(ltex(L))} のグラフについて、正しいものはどれか。`,
            ans: right,
            choices: choices4(r, right, [`${opp}で、切片は ${N(b)}`, `${dir}で、切片は ${N(-b)}`, `${dir}で、切片は ${N(A)}`, `${opp}で、切片は ${N(-b)}`]),
            hint: "グラフの向きは傾きの符号で、y 軸との交点は切片で決まるよ。式の中で、どの数が傾きで、どの数が切片かな？",
            steps: [`傾きは ${N(a)}。${s > 0 ? "正の数" : "負の数"}だから、${dir}。`, `切片は ${N(b)}。`, `正しいのは「${right}」。`],
          };
        }),
      ],
      // ───────── 2 標準 ─────────
      2: [
        // 07d02a 演習（2）① グラフが平行になるもの
        t("07d02a", (r) => parallelCards(r, "parallel")),
        // 07d02b 演習（2）② グラフが y 軸上の同じ点を通るもの
        t("07d02b", (r) => parallelCards(r, "intercept")),
        // 07d03 演習（3）図の直線の式を求める（分数の傾き）→ 通る 2 点から式を選ぶ
        t("07d03", (r) => {
          for (let i = 0; i < 200; i++) {
            const { p, q, s, b, a, L } = stepLine(r, [1, 2, 3, 4], [2, 3, 4, 5], 5);
            const [k1, k2] = shuffle(r, [-2, -1, 1, 2, 3]).slice(0, 2);
            if (Math.abs(k1 * q) > 10 || Math.abs(k2 * q) > 10) continue;
            const P1 = [k1 * q, yAt(L, k1 * q)[0]], P2 = [k2 * q, yAt(L, k2 * q)[0]];
            const { ans, choices } = eqChoices(r, L, pointWrongs(a, b, P1), (l) => both(l, P1, P2));
            const dx = P2[0] - P1[0], dy = P2[1] - P1[1];
            return {
              q: `${PT(P1)} と ${PT(P2)} を通る直線の式は、次のうちどれか。`,
              ans, choices,
              hint: "まず 2 点の座標から傾きを求めよう。そのあと、通る点の座標を式に入れると、切片が求められるよ。",
              steps: [`傾きは（y の増加量）÷（x の増加量）で ${$(slopeCalc(dy, dx, a))}。`, `${$(`y=${qt(a)}x+b`)} に点 ${PT(P1)} の座標を入れて ${$(`${qt(P1[1])}=${qt(a)}\\times ${par(P1[0])}+b`)}、${$(`b=${qt(b)}`)}。`, `式は ${$(ltex(L))}。`],
            };
          }
          return { skip: true };
        }),
        // 07q02a 小テスト（2）図の直線の式を求める → 通る 2 点から式を選ぶ
        t("07q02a", (r) => eqFromPoints(r, [[1, 1], [2, 1], [3, 1], [4, 1], [1, 2], [1, 3]], 5, [1, 1, 2])),
        // 07q02b 小テスト（2）通る 2 点から、傾き（または切片）を読みとる
        t("07q02b", (r) => {
          for (let i = 0; i < 200; i++) {
            const { p, q, s, b, a, L } = stepLine(r, [1, 2, 3, 4], [1, 2, 3, 4], 5);
            const [k1, k2] = shuffle(r, [-2, -1, 1, 2, 3]).slice(0, 2);
            if (Math.abs(k1 * q) > 10 || Math.abs(k2 * q) > 10) continue;
            const P1 = [k1 * q, yAt(L, k1 * q)[0]], P2 = [k2 * q, yAt(L, k2 * q)[0]], dx = P2[0] - P1[0], dy = P2[1] - P1[1];
            const askB = r(0, 2) === 0;
            return {
              q: `${PT(P1)} と ${PT(P2)} を通る直線の${askB ? "切片" : "傾き"}は？`,
              ans: num(askB ? b : a),
              hint: askB ? "傾きを求めてから、通る点の座標を式に入れると、切片が求められるよ。" : "傾きは、（y の増加量）÷（x の増加量）で求められるよ。",
              steps: askB
                ? [`傾きは ${$(slopeCalc(dy, dx, a))}。`, `${$(`y=${qt(a)}x+b`)} に点 ${PT(P1)} の座標を入れて ${$(`${qt(P1[1])}=${qt(a)}\\times ${par(P1[0])}+b`)}、${$(`b=${qt(b)}`)}。`, `切片は ${N(b)}。`]
                : [`x の増加量は ${$(`${qt(P2[0])}-${par(P1[0])}=${dx}`)}、y の増加量は ${$(`${qt(P2[1])}-${par(P1[1])}=${dy}`)}。`, `傾きは ${$(slopeCalc(dy, dx, a))}。`],
            };
          }
          return { skip: true };
        }),
        // 07q03a 小テスト（3）① と平行なもの
        t("07q03a", (r) => {
          const a = pick(r, SLOPES), b = rnz(r, -6, 6), L = line(a, b);
          const b2 = pick(r, [-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6].filter((x) => x !== b)), right = line(a, b2);
          const a2 = pick(r, SLOPES.filter((x) => !qeq(x, a) && !qeq(x, qneg(a))));
          const { ans, choices } = eqChoices(r, right, [line(qneg(a), b), line(recip(a), b), line(a2, b2), line(b, a)], (l) => parallel(l, L));
          return {
            q: `一次関数 ${$(ltex(L))} のグラフと平行なグラフの式は、次のうちどれか。`,
            ans, choices,
            hint: "2 つのグラフが平行になるのは、式のどの数が同じときかな？ 切片も同じだと、どうなる？",
            steps: [`${$(ltex(L))} の傾きは ${N(a)}。`, `平行なグラフは、傾きが同じで、切片がちがう。`, `${$(ltex(right))} は、傾きが ${N(a)} で切片がちがうので、平行。`],
          };
        }),
        // 07q03b 小テスト（3）③ と y 軸上の同じ点で交わるもの
        t("07q03b", (r) => {
          const a = pick(r, SLOPES), b = rnz(r, -6, 6), L = line(a, b);
          const a2 = pick(r, SLOPES.filter((x) => !qeq(x, a))), b2 = pick(r, [-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6].filter((x) => x !== b)), right = line(a2, b);
          const { ans, choices } = eqChoices(r, right, [line(a, b2), line(a2, qneg(b)), line(b, a), line(a2, b2)], (l) => qeq(l.b, L.b));
          return {
            q: `一次関数 ${$(ltex(L))} のグラフと、y 軸上の同じ点で交わるグラフの式は、次のうちどれか。`,
            ans, choices,
            hint: "グラフが y 軸と交わる点の y 座標は、式のどの数かな？ 傾きは、同じでもちがってもよいのかな？",
            steps: [`${$(ltex(L))} は、切片が ${N(b)} だから、y 軸上の点 ${PT([0, b])} を通る。`, `y 軸上の同じ点を通るのは、切片が同じ ${N(b)} のグラフ。`, `${$(ltex(right))} は、切片が ${N(b)} で、傾きがちがうので、正しい。`],
          };
        }),
      ],
      // ───────── 3 応用 ─────────
      3: [
        // 07d04 演習（4）そうたさんのまちがい：正しい点のとり方
        t("07d04", (r) => {
          for (let i = 0; i < 100; i++) {
            const { p, q, s, b, a, L } = stepLine(r, [2, 3, 4], [3, 4, 5], 4);
            if (p === q) continue;
            const P0 = [0, b], good = [q, b + s * p];
            const opts = [[q, b + p], [q, b - p], [p, b + q], [p, b - q]];
            if (opts.filter((P) => onLine(L, P)).length !== 1) continue;
            const say = (P) => `右へ ${P[0]}、${UD(P[1] - b)}へ ${Math.abs(P[1] - b)} 進んだ点 ${PT(P)}`;
            const mis = [p, b + s * q];
            return {
              q: `そうたさんは、${$(ltex(L))} のグラフをかくのに、「点 ${PT(P0)} をとり、そこから右へ ${p}、${UD(s)}へ ${q} 進んだ点をとる」とした。正しい点のとり方は、次のうちどれか。`,
              ans: say(good),
              choices: shuffle(r, opts.map(say)),
              hint: "傾きの分数で、分母と分子は、それぞれ右へ進む量と上（下）へ進む量のどちらにあたるかな？",
              steps: [`傾き ${$(qt(a))} は、右へ ${q} 進むと、${UD(s)}へ ${p} 進むことを表す。`, `そうたさんの点 ${PT(mis)} は、右へ進む量と${UD(s)}へ進む量が逆になっている。`, `正しくは、点 ${PT(P0)} から ${say(good)}。`],
            };
          }
          return { skip: true };
        }),
        // 07d05 演習（5）3 つのヒントで式を決める：x のときの y の値
        t("07d05", (r) => {
          const A = pick(r, [Q(1), Q(2), Q(3), Q(4), Q(1, 2), Q(3, 2), Q(1, 3), Q(2, 3)]), s = sgn(r), b = rnz(r, -6, 6);
          const a = qmul(Q(s), A), L = line(a, b), d = A[1], X = d * rnz(r, -4, 4);
          const dir = s > 0 ? "右上がり" : "右下がり";
          return {
            q: `次の 3 つのヒントをすべてみたす一次関数がある。　ヒント1：グラフは、y 軸上の点 ${PT([0, b])} を通る。　ヒント2：傾きの絶対値は ${N(A)} である。　ヒント3：グラフは${dir}である。　この一次関数で、x が ${N(X)} のときの y の値は？`,
            ans: num(yAt(L, X)),
            hint: "ヒント1・2 だけでは、式は 1 つに決まるかな？ ヒント3 は、傾きについて何を教えてくれる？",
            steps: [`ヒント1 より、切片は ${N(b)}。ヒント2 より、傾きは ${N(A)} か ${N(qneg(A))}。`, `ヒント3 より${dir}だから、傾きは${s > 0 ? "正の数" : "負の数"}で ${N(a)}。式は ${$(ltex(L))}。`, `${$(`x=${X}`)} を入れて、${$(calcTex(L, X))}。`],
          };
        }),
        // 07d06a 演習（6）① a、b の符号
        t("07d06a", (r) => {
          for (let i = 0; i < 200; i++) {
            const { p, q, s, b, a, L } = stepLine(r, [1, 2, 3], [2, 3, 4], 5);
            const ks = shuffle(r, [-3, -2, -1, 1, 2, 3, 4]).slice(0, 2).sort((u, v) => u - v);
            const P1 = [ks[0] * q, yAt(L, ks[0] * q)[0]], P2 = [ks[1] * q, yAt(L, ks[1] * q)[0]];
            if (Math.abs(P1[0]) > 9 || Math.abs(P2[0]) > 9) continue;
            const dx = P2[0] - P1[0], dy = P2[1] - P1[1], sb = b > 0 ? 1 : -1;
            const right = signText(s, sb);
            return {
              q: `直線 ℓ は、2 点 ${PT(P1)}、${PT(P2)} を通る。ℓ の式を ${$("y=ax+b")} と表すとき、a、b の符号の組み合わせとして正しいものはどれか。`,
              ans: right,
              choices: shuffle(r, SIGNS.map(([x, y]) => signText(x, y))),
              hint: "傾き a の符号は、グラフが右上がりか右下がりかで決まるよ。切片 b は、x が 0 のときの y の値だね。",
              steps: [`傾きは ${$(slopeCalc(dy, dx, a))}。${s > 0 ? "正の数" : "負の数"}だから、${$(`a${s > 0 ? ">" : "<"}0`)}。`, `${$(`y=${qt(a)}x+b`)} に点 ${PT(P1)} の座標を入れて ${$(`${qt(P1[1])}=${qt(a)}\\times ${par(P1[0])}+b`)}、${$(`b=${qt(b)}`)}。`, `${$(`b${b > 0 ? ">" : "<"}0`)}。答えは ${right}。`],
            };
          }
          return { skip: true };
        }),
      ],
      // ───────── 4 入試レベル ─────────
      4: [
        // 07d06b 演習（6）② ③ ℓ 上で x＝8 のときの y の値
        t("07d06b", (r) => {
          for (let i = 0; i < 200; i++) {
            const { p, q, s, b, a, L } = stepLine(r, [1, 2, 3, 4], [2, 3, 4, 5], 5);
            const ks = shuffle(r, [-2, -1, 1, 2, 3]).slice(0, 2).sort((u, v) => u - v);
            const P1 = [ks[0] * q, yAt(L, ks[0] * q)[0]], P2 = [ks[1] * q, yAt(L, ks[1] * q)[0]];
            const kx = pick(r, [-4, -3, 3, 4, 5, 6]), X = kx * q;
            if (Math.abs(P1[0]) > 9 || Math.abs(P2[0]) > 9 || Math.abs(X) > 20 || ks.includes(kx)) continue;
            const dx = P2[0] - P1[0], dy = P2[1] - P1[1];
            return {
              q: `直線 ℓ は、2 点 ${PT(P1)}、${PT(P2)} を通る。ℓ 上で、x が ${N(X)} のときの y の値は？`,
              ans: num(yAt(L, X)),
              hint: "2 点の座標から傾きを求め、通る点の座標を式に入れて切片を求めると、ℓ の式がわかるよ。",
              steps: [`傾きは ${$(slopeCalc(dy, dx, a))}。`, `${$(`y=${qt(a)}x+b`)} に点 ${PT(P1)} の座標を入れて ${$(`${qt(P1[1])}=${qt(a)}\\times ${par(P1[0])}+b`)}、${$(`b=${qt(b)}`)}。ℓ は ${$(ltex(L))}。`, `${$(`x=${X}`)} を入れて、${$(calcTex(L, X))}。`],
            };
          }
          return { skip: true };
        }),
        // 07d07 演習（7）直線 m と x 軸、y 軸で囲まれた三角形の面積
        t("07d07", (r) => {
          for (let i = 0; i < 300; i++) {
            const xi = pick(r, [1, -1]) * pick(r, [2, 3, 4, 5, 6, 8]), yi = pick(r, [1, -1]) * pick(r, [2, 3, 4, 5, 6]), a = Q(-yi, xi);
            if (a[1] > 6) continue;
            const L = line(a, yi), k = pick(r, [-2, -1, 1, 2]), P2 = [k * a[1], yAt(L, k * a[1])[0]];
            if (P2[0] === xi || P2[1] === 0 || Math.abs(P2[0]) > 12 || Math.abs(P2[1]) > 12) continue;
            const P1 = [0, yi], ar = round(Math.abs(xi * yi) / 2);
            return {
              q: `直線 m は、2 点 ${PT(P1)}、${PT(P2)} を通る。m と x 軸、y 軸で囲まれた三角形の面積は何 cm² か。（座標の 1 目もりを 1cm とする）`,
              ans: ar,
              unit: "cm²",
              hint: "まず m の式を求めよう。そのあと、x 軸との交点（y が 0 の点）を求めると、三角形の底辺と高さがわかるよ。",
              steps: [`切片は ${N(yi)}。傾きは ${$(slopeCalc(P2[1] - yi, P2[0], a))}。m は ${$(ltex(L))}。`, `${$("y=0")} のとき ${$(`0${ltex(L).slice(1)}`)} より ${$(`x=${xi}`)}。x 軸との交点は ${PT([xi, 0])}。`, `底辺 ${Math.abs(xi)}、高さ ${Math.abs(yi)} だから、面積は ${$(`${Math.abs(xi)}\\times ${Math.abs(yi)}\\div 2=${ar}`)}（cm²）。`],
            };
          }
          return { skip: true };
        }),
        // 07q04 小テスト チャレンジ：a＜0、b＞0 のとき y＝bx+a のグラフ
        t("07q04", (r) => {
          for (let i = 0; i < 100; i++) {
            const [sa, sb] = pick(r, SIGNS), ul = pick(r, ["a", "b"]), vl = ul === "a" ? "b" : "a", s1 = pick(r, [1, -1]), s2 = pick(r, [1, -1]);
            if (ul === "a" && s1 === 1 && s2 === 1) continue;   // y＝ax+b（そのまま）は除く
            const sg = (l) => (l === "a" ? sa : sb);
            const slopeS = s1 * sg(ul), icptS = s2 * sg(vl);
            const eq = `y=${s1 < 0 ? "-" : ""}${ul}x${s2 < 0 ? "-" : "+"}${vl}`;
            const say = (up, hi) => `${up ? "右上がり" : "右下がり"}で、y 軸との交点が原点より${hi ? "上" : "下"}`;
            const right = say(slopeS > 0, icptS > 0);
            return {
              q: `${$(`a${sa > 0 ? ">" : "<"}0`)}、${$(`b${sb > 0 ? ">" : "<"}0`)} のとき、一次関数 ${$(eq)} のグラフはどれか。`,
              ans: right,
              choices: shuffle(r, [[true, true], [true, false], [false, true], [false, false]].map(([u, h]) => say(u, h))),
              hint: "この式で、傾きにあたる文字と、切片にあたる文字は、それぞれどちらかな？ 符号（−がついているか）にも目をつけよう。",
              steps: [`傾きは ${$(`${s1 < 0 ? "-" : ""}${ul}`)}。${$(`${ul}${sg(ul) > 0 ? ">" : "<"}0`)} だから、傾きは${slopeS > 0 ? "正の数" : "負の数"}で、${slopeS > 0 ? "右上がり" : "右下がり"}。`, `切片は ${$(`${s2 < 0 ? "-" : ""}${vl}`)}。${$(`${vl}${sg(vl) > 0 ? ">" : "<"}0`)} だから、切片は${icptS > 0 ? "正の数" : "負の数"}で、y 軸との交点は原点より${icptS > 0 ? "上" : "下"}。`, `正しいのは「${right}」。`],
            };
          }
          return { skip: true };
        }),
      ],
    },
  }),
];

/**
 * ア〜エの 4 つの一次関数（傾きが同じ 2 つ＝平行、切片が同じ 2 つ）から、平行な 2 つ／y 軸上の同じ点を通る 2 つを選ぶ4択
 *   kind＝"parallel"（平行）／"intercept"（y 軸上の同じ点）
 */
function parallelCards(r, kind) {
  for (let i = 0; i < 300; i++) {
    const s1 = pick(r, SLOPES), s2 = r(0, 1) ? qneg(s1) : pick(r, SLOPES), s3 = r(0, 2) === 0 && !qeq(recip(s1), s1) ? recip(s1) : pick(r, SLOPES);
    if (qeq(s1, s2) || qeq(s1, s3) || qeq(s2, s3)) continue;
    const sl = [s1, s1, s2, s3];
    const cpair = pick(r, [[0, 2], [0, 3], [1, 2], [1, 3], [2, 3]]), B = [-4, -3, -2, -1, 1, 2, 3, 4], v = pick(r, B);
    const rest = shuffle(r, B.filter((x) => x !== v)), ib = [0, 0, 0, 0];
    cpair.forEach((j) => { ib[j] = v; });
    [0, 1, 2, 3].filter((j) => !cpair.includes(j)).forEach((j, n) => { ib[j] = rest[n]; });
    const order = shuffle(r, [0, 1, 2, 3]), LET = ["ア", "イ", "ウ", "エ"];
    const lines = order.map((pos) => line(sl[pos], ib[pos]));
    const letterOf = (pos) => LET[order.indexOf(pos)];
    const pairText = (x, y) => [x, y].sort((m, n) => LET.indexOf(m) - LET.indexOf(n)).join(" と ");
    const PP = pairText(letterOf(0), letterOf(1)), IP = pairText(letterOf(cpair[0]), letterOf(cpair[1]));
    const allPairs = [];
    for (let m = 0; m < 4; m++) for (let n = m + 1; n < 4; n++) allPairs.push(pairText(LET[m], LET[n]));
    const right = kind === "parallel" ? PP : IP, trap = kind === "parallel" ? IP : PP;
    const others = shuffle(r, allPairs.filter((x) => x !== PP && x !== IP));
    const list = lines.map((l, j) => `${LET[j]} ${$(ltex(l))}`).join("　");
    const slopes = lines.map((l, j) => `${LET[j]} ${N(l.a)}`).join("、"), icpts = lines.map((l, j) => `${LET[j]} ${N(l.b)}`).join("、");
    return {
      q: kind === "parallel"
        ? `次のア〜エの一次関数のうち、グラフが平行になるのはどの 2 つか。　${list}`
        : `次のア〜エの一次関数のうち、グラフが y 軸上の同じ点を通るのはどの 2 つか。　${list}`,
      ans: right,
      choices: choices4(r, right, [trap, ...others]),
      hint: kind === "parallel" ? "2 つのグラフが平行になるのは、式のどの数が同じときかな？ 切片が同じだと、どうなる？" : "グラフが y 軸と交わる点の y 座標は、式のどの数かな？ その数が同じなのは、どれとどれ？",
      steps: kind === "parallel"
        ? [`傾きは、${slopes}。`, `傾きが同じ ${PP} は、平行。`]
        : [`切片は、${icpts}。`, `切片が同じ ${IP} は、y 軸上の同じ点を通る。`],
    };
  }
  return { skip: true };
}

// 移さなかった問題：なし。図とカードは問題文に出せないので、通る 2 点の座標と式で言い切る形にして、すべて移した（dr.1・dr.3・dr.6・dr.7、qz.2 は「図の直線」を「通る 2 点」に言いかえた）。
export const SKIPPED = [];
