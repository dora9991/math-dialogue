// ============================================================
// ichiji-08.js — 一次関数 第8時「x の変域から、y の変域を求めよう」
//   ikkan の演習プリント（ichiji-08.dr.1〜8）・小テスト（ichiji-08.qz.1〜5）を、コツコツくんのテンプレートにしたもの。
//   テンプレート id＝「08」＋ d（演習）／q（小テスト）＋ ikkan の問題の番号（＋ 型ごとに a, b…）。例：08d03a ＝ ichiji-08.dr.3 の1つ目の型
//   y の変域（不等式）は入力欄で打てないので、(a) y の最大値・最小値を数で聞く、(b) 正しい変域を選ぶ4択（誤答は「x の変域をそのまま書く」「切片をたし忘れる」
//   「右下がりで小さい数を左に書かない」「切片・傾きの符号まちがい」。正解と同じ式にならないものだけ）、にした。グラフをかく問題は、線分の両はしの点を聞く形にした。
//   「a の値をすべて求めよう」（dr.8）は、a が 2 つあるので「大きいほう（小さいほう）の a の値は？」にして、場合分けは残した。
//   変域・最大値・最小値・a は、linear.js（直線 y＝ax+b を計算で扱う）から出す。
// ============================================================
import { t, pick, choices4, shuffle, rnz, gcd, sgn } from "../kit.js";
import { unitFor } from "../unit-kit.js";
import { Q, qadd, qsub, qmul, qdiv, qneg, qeq, qval } from "../algebra.js";
import { line, yAt, xAt, ltex, qt, num } from "../linear.js";

const unit = unitFor("ichiji");

// ── 道具（この授業の問題用に足した小さな関数）──────────────────────────
const $ = (s) => `$${s}$`;
const Z = (x) => (Array.isArray(x) ? Q(x[0], x[1]) : Q(x));
/** 負の数にはかっこをつけた TeX */
const par = (x) => { const v = Z(x); return v[0] < 0 ? `(${qt(v)})` : qt(v); };
/** 文の中の数（負の数・分数は TeX に） */
const N = (x) => { const v = Z(x); return v[0] >= 0 && v[1] === 1 ? String(v[0]) : $(qt(v)); };
/** 既約分数 p/q（p, q は正で q≧2）を選ぶ */
const fr = (r, ps, qs) => { for (let i = 0; i < 300; i++) { const p = pick(r, ps), q = pick(r, qs); if (q >= 2 && gcd(p, q) === 1) return [p, q]; } return [1, 2]; };
const LE = "\\leqq ";
/** 変域の TeX。b＝{ min, max, minOpen, maxOpen }（min・max は Q）。v＝x か y */
const rangeTex = (b, v = "y") => `${qt(b.min)}${b.minOpen ? "<" : LE}${v}${b.maxOpen ? "<" : LE}${qt(b.max)}`;
/** x の変域の TeX  -2\leqq x\leqq 4（loOpen・hiOpen＝端をふくまない） */
const xr = (lo, hi, loOpen = false, hiOpen = false) => `${lo}${loOpen ? "<" : LE}x${hiOpen ? "<" : LE}${hi}`;
/** 直線 L の、x の変域 [lo, hi] に対する y の変域（端をふくまないことも引きつぐ） */
const bounds = (L, lo, hi, loOpen = false, hiOpen = false) => {
  const ylo = yAt(L, lo), yhi = yAt(L, hi);
  return L.a[0] > 0
    ? { min: ylo, max: yhi, minOpen: loOpen, maxOpen: hiOpen }
    : { min: yhi, max: ylo, minOpen: hiOpen, maxOpen: loOpen };
};
/** y＝…＝値 の TeX（x に値を入れた式） */
const evalTex = (l, x) => {
  const X = par(x), a = l.a, b = l.b;
  let s;
  if (qeq(a, Q(1))) s = X; else if (qeq(a, Q(-1))) s = `-${X}`; else s = `${qt(a)}\\times ${X}`;
  if (b[0] !== 0) s += (b[0] < 0 ? "" : "+") + qt(b);
  return s;
};
const calcTex = (l, x) => { const e = evalTex(l, x), y = qt(yAt(l, x)); return e === y ? `y=${y}` : `y=${e}=${y}`; };

/** 変域つきの直線：sign＝1（右上がり）／-1（右下がり）／0（どちらか）。frac なら分数の傾き（x の端は分母の倍数にして、y を整数にする） */
const mkDom = (r, sign, frac, B = 6) => {
  const s = sign || sgn(r);
  let a, q = 1;
  if (frac) { const [p, qq] = fr(r, [1, 2, 3], [2, 3, 4]); a = Q(s * p, qq); q = qq; } else a = Q(s * r(1, 4));
  const b = rnz(r, -B, B), lo = q * r(-3, 1), hi = lo + q * r(2, q >= 3 ? 3 : 5);
  return { L: line(a, b), a, b, lo, hi, s, q };
};

/** 変域の4択：正解 bd と、ありがちな誤答 */
const rangeChoices = (r, L, lo, hi, bd) => {
  const a = L.a, b = L.b;
  const mk = (min, max) => ({ min, max, minOpen: false, maxOpen: false });
  const sorted = (u, v) => (qval(u) <= qval(v) ? [u, v] : [v, u]);
  const viaLine = (l) => { const [u, v] = sorted(yAt(l, lo), yAt(l, hi)); return mk(u, v); };
  const cand = [
    a[0] < 0 ? mk(yAt(L, lo), yAt(L, hi)) : null,                         // 右下がりなのに、小さい数を左に書かない
    mk(Q(lo), Q(hi)),                                                     // x の変域をそのまま書く
    (() => { const [u, v] = sorted(qmul(a, Q(lo)), qmul(a, Q(hi))); return mk(u, v); })(),   // 切片をたし忘れる
    viaLine(line(a, qneg(b))),                                            // 切片の符号まちがい
    viaLine(line(qneg(a), b)),                                            // 傾きの符号まちがい
  ].filter(Boolean);
  const right = $(rangeTex(bd)), seen = new Set([right]), ws = [];
  for (const c of cand) { const s = $(rangeTex({ ...c, minOpen: bd.minOpen, maxOpen: bd.maxOpen })); if (!seen.has(s)) { seen.add(s); ws.push(s); } }
  const fill = (i) => { const d = [1, -1, 2, -2][i % 4]; return $(rangeTex({ ...bd, max: qadd(bd.max, Q(d)) })); };
  return { ans: right, choices: choices4(r, right, ws, fill) };
};
/** 端をふくむか／ふくまないかの 4 通り（y の変域） */
const openChoices = (r, bd) => {
  const right = $(rangeTex(bd));
  const all = [[false, false], [true, false], [false, true], [true, true]].map(([a, b]) => $(rangeTex({ ...bd, minOpen: a, maxOpen: b })));
  return { ans: right, choices: choices4(r, right, all.filter((x) => x !== right)) };
};

const askTxt = { max: "最大", min: "最小" };
/** y の最大値・最小値を答える問題 */
const maxMinQ = (r, d, ask) => {
  const { L, lo, hi, a } = d, bd = bounds(L, lo, hi), v = ask === "max" ? bd.max : bd.min;
  const dirTxt = a[0] > 0 ? "傾きが正の数だから、右上がり。x が大きいほど y も大きい。" : "傾きが負の数だから、右下がり。x が大きいほど y は小さい。";
  const atX = ask === "max" ? (a[0] > 0 ? hi : lo) : (a[0] > 0 ? lo : hi);
  return {
    q: `一次関数 ${$(ltex(L))} で、x の変域が ${$(xr(lo, hi))} のとき、y の${askTxt[ask]}値は？`,
    ans: num(v),
    hint: "x の変域の両はしの値を式に入れて、y の値を求めてみよう。どちらが大きいかな？",
    steps: [`${dirTxt}`, `${$(`x=${lo}`)} のとき ${$(calcTex(L, lo))}、${$(`x=${hi}`)} のとき ${$(calcTex(L, hi))}。`, `y の変域は ${$(rangeTex(bd))}。${askTxt[ask]}値は、${$(`x=${atX}`)} のときの ${N(v)}。`],
  };
};
/** y の変域を選ぶ4択の問題 */
const rangeQ = (r, d, loOpen = false, hiOpen = false) => {
  const { L, lo, hi, a } = d, bd = bounds(L, lo, hi, loOpen, hiOpen);
  const { ans, choices } = loOpen || hiOpen ? openChoices(r, bd) : rangeChoices(r, L, lo, hi, bd);
  const openTxt = loOpen || hiOpen ? `（${$(`x=${loOpen ? lo : hi}`)} はふくまない）` : "";
  const flip = a[0] < 0 ? "右下がりだから、x が大きいほど y は小さい。小さい数を左に書く。" : "右上がりだから、x が大きいほど y も大きい。";
  return {
    q: `一次関数 ${$(ltex(L))} で、x の変域が ${$(xr(lo, hi, loOpen, hiOpen))} のとき、y の変域はどれか。`,
    ans, choices,
    hint: loOpen || hiOpen ? "グラフの両はしの点は、ふくまれるかな？ x の端がふくまれないとき、それに対応する y の端はどうなる？" : "x の変域の両はしの値を式に入れて、y の値を求めよう。不等号の左には、小さいほうの数を書くよ。",
    steps: [`${$(`x=${lo}`)} のとき ${$(calcTex(L, lo))}、${$(`x=${hi}`)} のとき ${$(calcTex(L, hi))}。`, `${flip}${openTxt}`, `y の変域は ${ans}。`],
  };
};

export const UNITS = [
  unit("08", {
    name: "x の変域から、y の変域を求めよう",
    desc: "一次関数のグラフ（線分）の両はしの点から、y の変域を求める",
    prereqs: ["J2-ik07", "J2-g2c3u1"],
    points: [
      "$x$ のとる値の範囲を $x$ の変域といい、$-2\\leqq x\\leqq 4$ のように不等号で表す。$\\leqq$ はその数をふくみ、$<$ はふくまない。",
      "$x$ の変域があると、一次関数のグラフは線分になる。$y$ の変域は、両はしの点の $y$ 座標を求めて、小さいほうを左に書く。",
      "傾きが正なら、$x$ が大きいほど $y$ も大きい。傾きが負なら、$x$ が大きいほど $y$ は小さいので、大小がいれかわる。",
    ],
    levels: {
      // ───────── 1 基礎 ─────────
      1: [
        // 08d01 演習（1）右上がりの一次関数：x の変域から y の最大値・最小値
        t("08d01", (r) => maxMinQ(r, mkDom(r, 1, r(0, 3) === 0), pick(r, ["max", "min"]))),
        // 08d02 演習（2）右下がりの一次関数：x の変域から y の最大値・最小値
        t("08d02", (r) => maxMinQ(r, mkDom(r, -1, r(0, 3) === 0), pick(r, ["max", "min"]))),
        // 08q01 小テスト（1）y＝3x−4（1≦x≦3）：y の変域
        t("08q01", (r) => rangeQ(r, mkDom(r, 1, false))),
      ],
      // ───────── 2 標準 ─────────
      2: [
        // 08d03a 演習（3）グラフ（線分）の x の変域から、y の変域を選ぶ
        t("08d03a", (r) => rangeQ(r, mkDom(r, 0, r(0, 1) === 1))),
        // 08d03b 演習（3）線分の両はしの点：y 座標が最大（最小）になる点の x 座標
        t("08d03b", (r) => {
          const d = mkDom(r, 0, r(0, 1) === 1), { L, lo, hi, a } = d, ask = pick(r, ["max", "min"]);
          const atX = ask === "max" ? (a[0] > 0 ? hi : lo) : (a[0] > 0 ? lo : hi);
          return {
            q: `一次関数 ${$(ltex(L))} のグラフを、x の変域 ${$(xr(lo, hi))} の部分だけかく。この線分上の点のうち、y 座標が${askTxt[ask]}になる点の x 座標は？`,
            ans: atX,
            hint: "線分の両はしの点のうち、どちらの点が高い（低い）位置にあるかな？ 傾きが正か負かで考えよう。",
            steps: [`両はしの点は、${$(`x=${lo}`)} のとき ${$(calcTex(L, lo))}、${$(`x=${hi}`)} のとき ${$(calcTex(L, hi))}。`, a[0] > 0 ? "右上がりだから、右はしの点が高く、左はしの点が低い。" : "右下がりだから、左はしの点が高く、右はしの点が低い。", `y 座標が${askTxt[ask]}になる点の x 座標は ${N(atX)}。`],
          };
        }),
        // 08d04 演習（4）端をふくまない：y の変域
        t("08d04", (r) => { const d = mkDom(r, 0, false), open = r(0, 1) === 1; return rangeQ(r, d, !open, open); }),
        // 08q02 小テスト（2）y＝−x+8（2≦x≦6）：右下がり
        t("08q02", (r) => rangeQ(r, mkDom(r, -1, false))),
        // 08q03 小テスト（3）y＝−(1/2)x+1（−4≦x≦2）：分数の傾き
        t("08q03", (r) => rangeQ(r, mkDom(r, -1, true))),
        // 08q04 小テスト（4）y＝2x−1（0≦x＜3）：端をふくまない
        t("08q04", (r) => rangeQ(r, mkDom(r, 1, false), false, true)),
      ],
      // ───────── 3 応用 ─────────
      3: [
        // 08d05a 演習（5）水そう：水がなくなるのは何分後か
        t("08d05a", (r) => {
          const c = tank(r);
          return {
            q: `${c.intro}水がなくなる（y が 0 になる）のは、${c.start}から何${c.unit}後か。`,
            ans: c.T,
            unit: `${c.unit}後`,
            hint: `${c.start}から x ${c.unit}後の量 y を、x の式で表そう。y が 0 になるのは、x がいくつのとき？`,
            steps: [`x ${c.unit}後の${c.what}は、${$(`y=${-c.k}x+${c.H}`)}。`, `${$("y=0")} のとき ${$(`0=${-c.k}x+${c.H}`)} より ${$(`${c.k}x=${c.H}`)}、${$(`x=${c.T}`)}。`, `${c.T}${c.unit}後。`],
          };
        }),
        // 08d05b 演習（5）水そう：x の変域と y の変域の組
        t("08d05b", (r) => {
          const c = tank(r), say = (X, Y) => `${$(`0${LE}x${LE}${X}`)}、${$(`0${LE}y${LE}${Y}`)}`;
          return {
            q: `${c.intro}x の変域と y の変域の組として、正しいものはどれか。（${c.what}は、なくなるまで考える）`,
            ans: say(c.T, c.H),
            choices: choices4(r, say(c.T, c.H), [say(c.H, c.H), say(c.H, c.T), say(c.T, c.T)]),
            hint: `x は、${c.start}からの時間。最初と、${c.what}がなくなるときの x と y を考えよう。`,
            steps: [`x ${c.unit}後の${c.what}は、${$(`y=${-c.k}x+${c.H}`)}。`, `最初は ${$(`x=0`)} で ${$(`y=${c.H}`)}。なくなるのは ${$(`y=0`)} のときで、${$(`x=${c.T}`)}。`, `x の変域は ${$(`0${LE}x${LE}${c.T}`)}、y の変域は ${$(`0${LE}y${LE}${c.H}`)}。`],
          };
        }),
        // 08d06 演習（6）y＝ax−2（a＞0）で、x の変域が 1≦x≦4 のとき、y の変域が 1≦y≦10。a を求める
        t("08d06", (r) => {
          for (let i = 0; i < 200; i++) {
            const neg = r(0, 3) === 0, A = r(1, 5), a = neg ? -A : A, b = rnz(r, -5, 5), lo = pick(r, [-4, -3, -2, -1, 1, 2, 3]), hi = lo + r(2, 5);
            if (hi === 0) continue;
            const L = line(a, b), bd = bounds(L, lo, hi), eqn = `y=ax${b < 0 ? "-" : "+"}${Math.abs(b)}`;
            const known = neg ? { x: lo, y: bd.max } : { x: lo, y: bd.min };   // 右上がりは x＝lo で最小、右下がりは x＝lo で最大
            const other = neg ? { x: hi, y: bd.min } : { x: hi, y: bd.max };
            return {
              q: `一次関数 ${$(eqn)}（${$(neg ? "a<0" : "a>0")}）で、x の変域が ${$(xr(lo, hi))} のとき、y の変域は ${$(rangeTex(bd))} である。a の値は？`,
              ans: a,
              hint: "a の正負から、グラフが右上がりか右下がりかがわかるよ。x の端のうち、y が最小（最大）になるのはどちらかな？",
              steps: [neg ? `${$("a<0")} だから右下がり。x が大きいほど y は小さいので、${$(`x=${lo}`)} のとき y は最大の ${N(known.y)}。` : `${$("a>0")} だから右上がり。x が大きいほど y も大きいので、${$(`x=${lo}`)} のとき y は最小の ${N(known.y)}。`, `${$(`x=${lo}`)}、${$(`y=${known.y}`)} を代入して ${$(`${known.y}=a\\times ${par(lo)}${b < 0 ? "-" : "+"}${Math.abs(b)}`)}、${$(`a=${a}`)}。`, `確かめ　${$(`x=${hi}`)} のとき ${$(`y=${a}\\times ${par(hi)}${b < 0 ? "-" : "+"}${Math.abs(b)}=${other.y}`)}　○`],
            };
          }
          return { skip: true };
        }),
      ],
      // ───────── 4 入試レベル ─────────
      4: [
        // 08d07a 演習（7）① x の変域 −4≦x≦8 のとき、y の変域（最大値・最小値）
        t("08d07a", (r) => maxMinQ(r, mkDom(r, r(0, 3) === 0 ? 1 : -1, true, 7), pick(r, ["max", "min"]))),
        // 08d07b 演習（7）② y の変域から、x の変域（最大値・最小値）
        t("08d07b", (r) => {
          const d = mkDom(r, r(0, 3) === 0 ? 1 : -1, true, 7), { L, lo, hi, a } = d, bd = bounds(L, lo, hi), ask = pick(r, ["max", "min"]);
          const ans = ask === "max" ? hi : lo;
          const xAtMax = xAt(L, bd.max)[0], xAtMin = xAt(L, bd.min)[0];
          return {
            q: `一次関数 ${$(ltex(L))} で、y の変域が ${$(rangeTex(bd))} のとき、x の${askTxt[ask]}値は？`,
            ans,
            hint: "y が両はしの値になるときの x を、それぞれ求めよう。傾きが正か負かで、y が大きいほうに対応する x はどちらかが決まるよ。",
            steps: [`${$(`y=${qt(bd.max)}`)} のとき ${$(`x=${xAtMax}`)}、${$(`y=${qt(bd.min)}`)} のとき ${$(`x=${xAtMin}`)}。`, a[0] > 0 ? "右上がりだから、y が大きいほど x も大きい。" : "右下がりだから、y が大きいほど x は小さい。", `x の変域は ${$(xr(lo, hi))}。${askTxt[ask]}値は ${N(ans)}。`],
          };
        }),
        // 08d08 演習（8）y＝ax+2 で x の変域が −2≦x≦3、y の最大値と最小値の差が 10。a の値をすべて求める
        t("08d08", (r) => {
          const lo = r(-4, -1), hi = lo + r(3, 6), d = hi - lo, m = r(1, 5), D = d * m, b = rnz(r, -5, 5), big = r(0, 1) === 1;
          const ca = (c) => (c === 1 ? "a" : c === -1 ? "-a" : `${c}a`), lin = (c) => `${ca(c)}${b < 0 ? "-" : "+"}${Math.abs(b)}`;
          return {
            q: `一次関数 ${$(`y=ax${b < 0 ? "-" : "+"}${Math.abs(b)}`)} で、x の変域が ${$(xr(lo, hi))} のとき、y の最大値と最小値の差が ${D} になった。a の値は 2 つある。${big ? "大きい" : "小さい"}ほうの a の値は？`,
            ans: big ? m : -m,
            hint: "a が正の場合と負の場合で、最大になる x の端がちがうよ。それぞれの場合に、（最大値）−（最小値）を a の式で表そう。",
            steps: [`${$("a>0")} のとき、${$(`x=${hi}`)} で最大、${$(`x=${lo}`)} で最小。差は ${$(`(${lin(hi)})-(${lin(lo)})=${ca(d)}`)}。${$(`${ca(d)}=${D}`)} より ${$(`a=${m}`)}。`, `${$("a<0")} のとき、${$(`x=${lo}`)} で最大、${$(`x=${hi}`)} で最小。差は ${$(`(${lin(lo)})-(${lin(hi)})=${ca(-d)}`)}。${$(`${ca(-d)}=${D}`)} より ${$(`a=${-m}`)}。`, `a の値は ${N(m)} と ${N(-m)}。${big ? "大きい" : "小さい"}ほうは ${N(big ? m : -m)}。`],
          };
        }),
        // 08q05 小テスト チャレンジ：y＝ax+3 で、x の変域 −2≦x≦4、y の変域 −5≦y≦7。a を求める
        t("08q05", (r) => {
          for (let i = 0; i < 200; i++) {
            const lo = r(-4, -1), hi = lo + r(3, 7), A = r(1, 5), a = r(0, 1) ? A : -A, b = rnz(r, -6, 6);
            if (hi === -lo || hi < 1) continue;
            const L = line(a, b), bd = bounds(L, lo, hi), w = (qval(bd.max) - qval(bd.min)) / (hi - lo), W = Math.abs(a);
            const pos = bounds(line(W, b), lo, hi), neg = bounds(line(-W, b), lo, hi);
            if (w !== W) continue;
            return {
              q: `一次関数 ${$(`y=ax${b < 0 ? "-" : "+"}${Math.abs(b)}`)} で、x の変域が ${$(xr(lo, hi))} のとき、y の変域は ${$(rangeTex(bd))} である。a の値は？`,
              ans: a,
              hint: "y の変域の幅は、x の変域の幅の何倍かな？ a が正の場合と負の場合を両方考えて、y の変域が合うほうを選ぼう。",
              steps: [`y の変域の幅は ${qt(Q(qval(bd.max) - qval(bd.min)))}、x の変域の幅は ${hi - lo} だから、a の絶対値は ${W}。a は ${W} か ${-W}。`, `${$(`a=${W}`)} のとき y の変域は ${$(rangeTex(pos))}、${$(`a=${-W}`)} のとき ${$(rangeTex(neg))}。`, `y の変域が ${$(rangeTex(bd))} になるのは ${$(`a=${a}`)} のとき。`],
            };
          }
          return { skip: true };
        }),
      ],
    },
  }),
];

/**
 * 水位・水の量・ろうそくの長さが、毎分（毎時）k ずつへっていく場面。H＝はじめの量、T＝なくなるまでの時間（整数）
 *   intro は、場面の文（y は x の一次関数）。
 */
function tank(r) {
  const kind = r(0, 2);
  if (kind === 0) {
    const k = pick(r, [2, 3, 4, 5]), T = r(6, 16), H = k * T;
    return { k, T, H, unit: "分", what: "水面の高さ", start: "栓をぬいて", intro: `高さ ${H}cm の水そうに、水がいっぱい入っている。底の栓をぬくと、水面の高さが 1 分間に ${k}cm ずつ下がる。栓をぬいてから x 分後の水面の高さを y cm とする。` };
  }
  if (kind === 1) {
    const k = pick(r, [4, 5, 6, 8, 10]), T = r(5, 16), H = k * T;
    return { k, T, H, unit: "分", what: "タンクの水の量", start: "くみ出しはじめて", intro: `水が ${H}L 入ったタンクから、ポンプで水を 1 分間に ${k}L ずつくみ出す。くみ出しはじめてから x 分後のタンクの水の量を y L とする。` };
  }
  const k = pick(r, [2, 3]), T = r(4, 10), H = k * T;
  return { k, T, H, unit: "時間", what: "ろうそくの長さ", start: "火をつけて", intro: `長さ ${H}cm のろうそくに火をつけると、1 時間に ${k}cm ずつ短くなる。火をつけてから x 時間後のろうそくの長さを y cm とする。` };
}

// 移さなかった問題：なし。グラフをかく問題（dr.3）は、線分の両はしの点を聞く形にして移した。
export const SKIPPED = [];
