// ============================================================
// ichiji-16.js — 一次関数 第16時「図形の中を動く点がつくる面積を調べよう」
//   ikkan の演習プリント（ichiji-16.dr.1〜6）・小テスト（ichiji-16.qz.1〜5）を、コツコツくんのテンプレートにしたもの。
//   テンプレート id＝「16」＋ d（演習）／q（小テスト）＋ ikkan の問題の番号（＋ 1つの問題から2つ以上つくるときは a, b…）。例：16d03b ＝ ichiji-16.dr.3 の2つ目
//   図（長方形・三角形・点 P）は出せないので、「長方形 ABCD（AB＝6cm、BC＝8cm）。点 P は、…を毎秒 ○cm で動く」と、文で言い切った（頂点は A、B、C、D の順にならぶ）。
//   面積の式は、底辺・高さを辺ごとに考え、直線 line(傾き, 切片) で持つ。変域は2場合まで。答え・選択肢の式・解説の数は、すべて計算で出す（手で書かない）。
//   dr.6（グラフから長さと式を読みとる）は、図が出せないので、折れ線グラフの頂点の座標を文で言い切った（「3点 (0, 0)、(5, 10)、(9, 0) を順に線分で結んだ折れ線」）。
//   dr.5（A さんのまちがいを説明する）は、(a) まちがいの理由を選ぶ4択、(b) 正しい式での面積の値、の2つにした。
//   式を答える問題は入力欄で打てないので、4択（誤答は、÷2 のわすれ・底辺と高さの取りちがえ・符号まちがい・速さのかけわすれ など。正解と同じ式にならないものだけ）にした。
// ============================================================
import { t, pick, choices4, shuffle, round } from "../kit.js";
import { unitFor } from "../unit-kit.js";
import { Q, qadd, qsub, qmul, qdiv, qneg, qeq, qval, qiszero } from "../algebra.js";
import { line, lineThrough, yAt, xAt, onLine, ltex, qt } from "../linear.js";

const unit = unitFor("ichiji");

// ── このファイルの小道具 ─────────────────────────────────────────
const TX = (s) => `$${s}$`;
const Qa = (x) => (Array.isArray(x) ? Q(x[0], x[1]) : Q(x));
const isFin = (x) => { let d = Qa(x)[1]; while (d % 2 === 0) d /= 2; while (d % 5 === 0) d /= 5; return d === 1; };
/** 入力欄の答え：整数・有限小数はそのまま数、そうでなければ約分した分数の文字列 */
const ansOf = (x) => { const [n, d] = Qa(x); return d === 1 ? n : isFin([n, d]) ? round(n / d) : `${n}/${d}`; };
/** 数の TeX（有限小数は小数、そうでなければ分数） */
const dt = (x) => { const [n, d] = Qa(x); return d === 1 ? String(n) : isFin([n, d]) ? String(round(n / d)) : qt([n, d]); };
const cxq = (c) => { const s = qt(c); return s === "1" ? "x" : s === "-1" ? "-x" : `${s}x`; };   // 係数つきの x（1 は省く）
const HALF = "\\frac{1}{2}";
/** 長方形の言い方 */
const rectOf = (p, q) => `長方形 ABCD（AB＝${p}cm、BC＝${q}cm）`;
/** 式の4択：正解 L、ありがちな誤答の直線 cands。正解と同じ式になるものは、はずす */
const lineChoices = (r, L, cands, fills = []) => {
  const seen = new Set([ltex(L)]);
  const wrongs = [];
  for (const w of shuffle(r, cands.filter(Boolean))) {
    const s = ltex(w);
    if (seen.has(s)) continue;
    seen.add(s); wrongs.push(TX(s));
  }
  return choices4(r, TX(ltex(L)), wrongs, (i) => {
    const w = fills[i % Math.max(1, fills.length)];
    return w && ltex(w) !== ltex(L) ? TX(ltex(w)) : null;
  });
};
/** 2点を通る直線の4択（折れ線の2本目など）。誤答は、2点を両方は通らないものだけ */
const throughChoices = (r, L, p1, p2) => {
  const [x1, y1] = [Qa(p1[0]), Qa(p1[1])], a = L.a, b = L.b;
  const inv = qiszero(a) ? null : qdiv(Q(1), a);
  const cand = [
    qiszero(b) ? null : line(b, a),                                      // 傾きと切片の入れかえ
    qiszero(b) ? null : line(a, qneg(b)),                                // 切片の符号まちがい
    line(qneg(a), b),                                                    // 傾きの符号まちがい
    inv ? line(inv, qsub(y1, qmul(inv, x1))) : null,                     // 傾きを (x の増加量)÷(y の増加量) にしてしまう
    line(a, qadd(y1, qmul(a, x1))),                                      // 切片の代入ミス（y＋a×x としてしまう）
    line(a, y1),                                                         // 切片を y 座標そのものにしてしまう
  ].filter((w) => w && !(onLine(w, p1) && onLine(w, p2)));
  const one = Q(1);
  const fills = [line(qadd(a, one), b), line(a, qadd(b, one)), line(qsub(a, one), b), line(a, qsub(b, one))].filter((w) => !(onLine(w, p1) && onLine(w, p2)));
  return lineChoices(r, L, cand, fills);
};
const mulTex = (c, v) => (c === 1 ? v : `${c}${v}`);
/** 傾き a を 1 ふやした直線（4択の補い用） */
const bump = (a, b = 0) => line(qadd(Qa(a), Q(1)), b);

// ── 長方形の辺の上を動く点 ─────────────────────────────────────
//   BC 上を B から C（dr.1）：三角形 ABP（底辺 AB、高さ BP）
function bcCase(r, evenSlope) {
  for (let i = 0; i < 400; i++) {
    const p = r(4, 10), v = pick(r, [1, 2, 3]), T = r(3, 6), q = v * T;
    if (q > 16 || q < 6 || p === q) continue;
    if (evenSlope && (p * v) % 2 !== 0) continue;
    const s = Q(p * v, 2), L = line(s, 0);
    return { p, q, v, T, s, L, ymax: qmul(s, Q(T)) };
  }
  throw new Error("bcCase が作れない");
}
//   A→B→C を毎秒 1cm（dr.2：三角形 APD、dr.3：三角形 APC）
function rectABC(r) {
  for (let i = 0; i < 400; i++) {
    const p = r(4, 10), q = r(4, 10);
    if (p === q) continue;
    return { p, q };
  }
  throw new Error("rectABC が作れない");
}
/** 三角形 APC：辺 AB 上 y＝(q/2)x（0≦x≦p）、辺 BC 上 y＝(p/2)(p+q−x)（p≦x≦p+q） */
const apcLines = (p, q) => ({ ab: line(Q(q, 2), 0), bc: line(Q(-p, 2), Q(p * (p + q), 2)) });

// ── dr.4：直角三角形 ────────────────────────────────────────────
function triCase(r) {
  for (let i = 0; i < 600; i++) {
    const p = r(4, 10), v = pick(r, [1, 1, 2]), k = pick(r, [1, 1, 2]), q = r(6, 18);
    const x = Q(k * q, (1 + k) * v);
    if (!isFin(x) || qval(x) <= 0 || qval(x) >= q / v || (x[1] !== 1 && r(0, 3) > 0)) continue;
    if (v > 1 && q % v !== 0) continue;
    const yL = line(Q(p * v, 2), 0), zL = line(Q(-p * v, 2), Q(p * q, 2));
    // y＝k×z となる x を、方程式から確かめる
    const lhs = yAt(yL, x), rhs = qmul(Q(k), yAt(zL, x));
    if (!qeq(lhs, rhs)) throw new Error("triCase の x が合わない");
    return { p, q, v, k, x, yL, zL };
  }
  throw new Error("triCase が作れない");
}

// ── dr.6・17dr.9 と同じ型：折れ線グラフの頂点から、長さと式を読みとる ───────────────
function peakCase(r) {
  for (let i = 0; i < 600; i++) {
    const p = r(3, 8), q = r(3, 9);
    if (p === q) continue;
    const h = Q(p * q, 2);
    const L1 = lineThrough([0, 0], [p, h]), L2 = lineThrough([p, h], [p + q, 0]);
    if (!qeq(L1.a, Q(q, 2)) || !qeq(L2.a, Q(-p, 2))) throw new Error("折れ線の傾きが合わない");
    return { p, q, h, L1, L2 };
  }
  throw new Error("peakCase が作れない");
}

export const UNITS = [
  unit("16", {
    name: "動く点がつくる面積を、式で表す",
    desc: "点がどの辺の上にあるかで場合を分けて、面積を x の式で表す",
    prereqs: ["J2-ik15", "J2-g2c3u1"],
    points: [
      "動く点が図形の辺の上を動くときは、動いた時間 $x$ を使って、長さを $x$ の式で表す。（長さ）＝（速さ）×（時間）。",
      "三角形の面積 $y$ は、（底辺）×（高さ）÷2。点がどの辺の上にあるかで、底辺や高さの表し方が変わるので、場合を分けて、それぞれ式をつくる。",
      "場合を分けるときは、$x$ の変域（点がその辺の上にある間の、$x$ の範囲）を決める。点が次の頂点に着く時刻が、変域の境目になる。",
      "面積が決まった値になる $x$ は、その場合の式に $y$ の値を入れて解く。求めた $x$ が、その場合の変域に入っているか確かめる。",
    ],
    levels: {
      // ───────── 1 基礎 ─────────
      1: [
        // 16d01a 長方形：B から C まで辺 BC 上を動く。三角形 ABP の面積 y を x の式で（4択）
        t("16d01a", (r) => {
          const c = bcCase(r, true), bp = mulTex(c.v, "x"), s = qt(c.s);
          return {
            q: `${rectOf(c.p, c.q)}で、点 P は、B から C まで、辺 BC 上を毎秒 ${c.v}cm で動く。B を出発して $x$ 秒後の、三角形 ABP の面積を $y$ cm² とする。$y$ を $x$ の式で表すと、次のうちどれか。`,
            ans: TX(ltex(c.L)),
            choices: lineChoices(r, c.L, [
              line(c.p * c.v, 0),                  // ÷2 をわすれる
              line(Q(c.p, 2), 0),                  // 速さをかけわすれる（BP＝x としてしまう）
              line(Q(c.q * c.v, 2), 0),            // 底辺に BC を使ってしまう
              line(Q(c.p * c.v, 2), c.p),          // 切片をつけてしまう
            ], [bump(c.s)]),
            hint: "三角形 ABP の底辺と高さは、それぞれ、どの辺？ 高さは、時間とともに、どう変わる？",
            steps: [`BP は、毎秒 ${c.v}cm で $x$ 秒動くので ${TX(`BP=${bp}`)}（cm）。`, `底辺 AB＝${c.p}cm、高さ BP より ${TX(`y=${HALF}\\times ${c.p}\\times ${bp}=${cxq(c.s).replace(/^x$/, "x")}`)}。`],
          };
        }),
        // 16d01b 長方形：C に着くのは何秒後か（x の変域）／ y の最大値（y の変域）
        t("16d01b", (r) => {
          const c = bcCase(r, false), askT = r(0, 1) === 0;
          return {
            q: `${rectOf(c.p, c.q)}で、点 P は、B から C まで、辺 BC 上を毎秒 ${c.v}cm で動く。B を出発して $x$ 秒後の、三角形 ABP の面積を $y$ cm² とする。${askT ? "P が C に着くのは、B を出発して何秒後か。（$x$ の変域の、最大値）" : "P が B から C まで動くとき、$y$ の値の、最大値は何 cm² か。（$y$ の変域の、最大値）"}`,
            ans: askT ? c.T : ansOf(c.ymax), unit: askT ? "秒後" : "cm²",
            hint: askT ? "BC の長さを、P が動く速さでわると、何がわかる？" : "$y$ が最大になるのは、P がどこに来たとき？ そのとき、$x$ はいくつ？",
            steps: askT
              ? [`BC＝${c.q}cm を毎秒 ${c.v}cm で動くので、${TX(`${c.q}\\div ${c.v}=${c.T}`)}（秒後）。`, `$0\\leqq x\\leqq ${c.T}$ の間、P は辺 BC 上にある。`]
              : [`C に着くのは ${TX(`${c.q}\\div ${c.v}=${c.T}`)}（秒後）。`, `$y$ は $x$ とともにふえるので、最大は $x=${c.T}$ のとき。${TX(`y=${HALF}\\times ${c.p}\\times ${c.q}=${dt(c.ymax)}`)}（cm²）。`],
          };
        }),
        // 16d02a 正方形：P が辺 AB 上のとき、y を x の式で（4択）
        t("16d02a", (r) => {
          const s = pick(r, [4, 6, 8, 10, 12, 14]), L = line(Q(s, 2), 0);
          return {
            q: `1辺 ${s}cm の正方形 ABCD。点 P は、A から辺 AB、BC の上を C まで、毎秒 1cm で動く。A を出発して $x$ 秒後の、三角形 APD の面積を $y$ cm² とする。P が辺 AB 上にあるとき、$y$ を $x$ の式で表すと、次のうちどれか。`,
            ans: TX(ltex(L)),
            choices: lineChoices(r, L, [line(s, 0), line(Q(1, 2), 0), line(s * s / 2, 0), line(Q(-s, 2), s * s / 2), line(Q(s, 2), s)], [bump(Q(s, 2))]),
            hint: "P が辺 AB 上にあるとき、三角形 APD の底辺と高さは、それぞれ、どの辺（どの長さ）？",
            steps: [`AP＝$x$ cm。三角形 APD は、底辺 AD＝${s}cm、高さ AP＝$x$ cm。`, `${TX(`y=${HALF}\\times ${s}\\times x=${cxq(Q(s, 2))}`)}（$0\\leqq x\\leqq ${s}$）。`],
          };
        }),
        // 16d02b 正方形：P が辺 BC 上のとき、y の値
        t("16d02b", (r) => {
          const s = pick(r, [4, 6, 8, 10, 12, 14]), x = r(s + 1, 2 * s - 1), y = s * s / 2;
          return {
            q: `1辺 ${s}cm の正方形 ABCD。点 P は、A から辺 AB、BC の上を C まで、毎秒 1cm で動く。A を出発して $x$ 秒後の、三角形 APD の面積を $y$ cm² とする。A を出発して ${x}秒後、P は辺 BC 上にある。このときの、三角形 APD の面積は何 cm² か。`,
            ans: y, unit: "cm²",
            hint: "P が辺 BC 上を動くとき、三角形 APD の底辺 AD と高さは、変わる？ 変わらない？",
            steps: [`P が辺 BC 上にあるとき、底辺 AD＝${s}cm、高さは AB＝${s}cm で、変わらない。`, `${TX(`y=${HALF}\\times ${s}\\times ${s}=${y}`)}（cm²）。（$${s}\\leqq x\\leqq ${2 * s}$）`],
          };
        }),
        // 16d02c 正方形：y＝20 になるのは何秒後か
        t("16d02c", (r) => {
          const s = pick(r, [4, 6, 8, 10, 12, 14]), x0 = r(2, s - 1), k = (s / 2) * x0;
          return {
            q: `1辺 ${s}cm の正方形 ABCD。点 P は、A から辺 AB、BC の上を C まで、毎秒 1cm で動く。A を出発して $x$ 秒後の、三角形 APD の面積を $y$ cm² とする。三角形 APD の面積が ${k}cm² になるのは、A を出発して何秒後か。`,
            ans: x0, unit: "秒後",
            hint: "三角形 APD の面積が、どちらの辺の上のときの値になるか、考えよう。その辺の上での式に、面積の値を入れると？",
            steps: [`P が辺 AB 上のとき ${TX(`y=${cxq(Q(s, 2))}`)}（$0\\leqq x\\leqq ${s}$）。辺 BC 上のときは、いつも ${s * s / 2}cm²。`, `${k}＜${s * s / 2} だから、P は辺 AB 上。${TX(`${cxq(Q(s, 2))}=${k}`)} より ${TX(`x=${x0}`)}。`],
          };
        }),
        // 16q01 小テスト（1）P が辺 BC 上にあるとき、y を x の式で（4択）
        t("16q01", (r) => {
          const p = r(4, 10), q = r(p === 4 ? 5 : 4, 10);
          if (p === q) return { skip: true };
          const L = line(Q(p, 2), 0);
          return {
            q: `${rectOf(p, q)}がある。点 P は、B を出発して、毎秒 1cm の速さで、辺 BC、CD の上を D まで動く。P が B を出発して $x$ 秒後の、三角形 ABP の面積を $y$ cm² とする。P が辺 BC 上にあるとき、$y$ を $x$ の式で表すと、次のうちどれか。`,
            ans: TX(ltex(L)),
            choices: lineChoices(r, L, [line(p, 0), line(Q(q, 2), 0), line(Q(1, 2), 0), line(Q(p, 2), p), line(Q(-p, 2), Q(p * q, 2))], [bump(Q(p, 2))]),
            hint: "P が辺 BC 上にあるとき、三角形 ABP の底辺と高さは、それぞれ、どの辺？ 高さは、時間とともに、どう変わる？",
            steps: [`BP＝$x$ cm。三角形 ABP は、底辺 AB＝${p}cm、高さ BP＝$x$ cm。`, `${TX(`y=${HALF}\\times ${p}\\times x=${cxq(Q(p, 2))}`)}。`],
          };
        }),
        // 16q02 小テスト（2）（1）のとき、x の変域（C に着くのは何秒後か）
        t("16q02", (r) => {
          const p = r(4, 10), q = r(5, 12);
          if (p === q) return { skip: true };
          return {
            q: `${rectOf(p, q)}がある。点 P は、B を出発して、毎秒 1cm の速さで、辺 BC、CD の上を D まで動く。P が B を出発して $x$ 秒後の、三角形 ABP の面積を $y$ cm² とする。P が辺 BC 上にある間の $x$ の変域は、$0\\leqq x\\leqq a$ である。$a$ の値は？`,
            ans: q, unit: "",
            hint: "辺 BC 上にいるのは、P がどこからどこまで動く間かな？",
            steps: [`BC＝${q}cm を毎秒 1cm で動くので、C に着くのは ${TX(`${q}\\div 1=${q}`)}（秒後）。`, `P が辺 BC 上にあるのは ${TX(`0\\leqq x\\leqq ${q}`)} の間。よって ${TX(`a=${q}`)}。`],
          };
        }),
      ],
      // ───────── 2 標準 ─────────
      2: [
        // 16d03a 長方形：P が辺 AB 上のとき、三角形 APC の面積 y を x の式で（4択）
        t("16d03a", (r) => {
          const { p, q } = rectABC(r), { ab } = apcLines(p, q);
          return {
            q: `${rectOf(p, q)}で、点 P は、A から辺 AB、BC の上を C まで、毎秒 1cm で動く。A を出発して $x$ 秒後の、三角形 APC の面積を $y$ cm² とする。P が辺 AB 上にある（$0\\leqq x\\leqq ${p}$）とき、$y$ を $x$ の式で表すと、次のうちどれか。`,
            ans: TX(ltex(ab)),
            choices: lineChoices(r, ab, [line(Q(p, 2), 0), line(q, 0), line(Q(p * q, 2), 0), line(Q(q, 2), q), line(Q(-q, 2), Q(p * q, 2))], [bump(Q(q, 2))]),
            hint: "P が辺 AB 上にあるとき、三角形 APC の底辺を AP とすると、高さは、どの辺の長さ？",
            steps: [`AP＝$x$ cm。三角形 APC は、底辺 AP＝$x$ cm、高さ BC＝${q}cm。`, `${TX(`y=${HALF}\\times x\\times ${q}=${cxq(Q(q, 2))}`)}。`],
          };
        }),
        // 16d03b 長方形：P が辺 BC 上のとき、y を x の式で（4択）
        t("16d03b", (r) => {
          const { p, q } = rectABC(r), { bc } = apcLines(p, q);
          return {
            q: `${rectOf(p, q)}で、点 P は、A から辺 AB、BC の上を C まで、毎秒 1cm で動く。A を出発して $x$ 秒後の、三角形 APC の面積を $y$ cm² とする。P が辺 BC 上にある（$${p}\\leqq x\\leqq ${p + q}$）とき、$y$ を $x$ の式で表すと、次のうちどれか。`,
            ans: TX(ltex(bc)),
            choices: lineChoices(r, bc, [
              line(Q(p, 2), Q(-p * p, 2)),           // BP を底辺にしてしまう（BP＝x−AB、三角形 ABP の面積）
              line(Q(-p, 2), Q(p * q, 2)),           // PC＝BC−x としてしまう
              line(Q(-q, 2), Q(q * (p + q), 2)),     // 底辺と高さを取りちがえる
              line(-p, p * (p + q)),                 // ÷2 をわすれる
            ], [line(Q(-p, 2), qadd(Q(p * (p + q), 2), Q(1)))]),
            hint: "P が辺 BC 上にあるとき、三角形 APC の底辺は、どの線分？ その長さは、$x$ を使うと、どう表せる？",
            steps: [`P が辺 BC 上のとき、PC＝（AB＋BC）−AP＝${p + q}−$x$（cm）。高さは AB＝${p}cm。`, `${TX(`y=${HALF}\\times (${p + q}-x)\\times ${p}`)}。かっこをはずして ${TX(ltex(bc))}。`],
          };
        }),
        // 16d03c 長方形：y＝18 になるのは何秒後か（2回ある。早いほう・遅いほう）
        t("16d03c", (r) => {
          for (let n = 0; n < 200; n++) {
            const { p, q } = rectABC(r), { ab, bc } = apcLines(p, q);
            const x1 = r(2, p - 1), k = qmul(Q(q, 2), Q(x1));
            if (!isFin(k)) continue;
            const x2 = xAt(bc, k);
            if (x2[1] > 2 || qval(x2) <= p || qval(x2) >= p + q) continue;
            if (!qeq(yAt(ab, x1), k) || !qeq(yAt(bc, x2), k)) throw new Error("16d03c の x が合わない");
            const early = r(0, 1) === 0, xs = early ? Q(x1) : x2;
            return {
              q: `${rectOf(p, q)}で、点 P は、A から辺 AB、BC の上を C まで、毎秒 1cm で動く。A を出発して $x$ 秒後の、三角形 APC の面積を $y$ cm² とする。三角形 APC の面積が ${dt(k)}cm² になるのは、A を出発してから、2回ある。${early ? "1回目（早いほう）" : "2回目（遅いほう）"}は、何秒後か。`,
              ans: ansOf(xs), unit: "秒後",
              hint: "P が辺 AB 上のときと、辺 BC 上のときで、式がちがう。それぞれの式に、面積の値を入れてみよう。",
              steps: [
                `辺 AB 上（$0\\leqq x\\leqq ${p}$）は ${TX(ltex(ab))}、辺 BC 上（$${p}\\leqq x\\leqq ${p + q}$）は ${TX(ltex(bc))}。`,
                `辺 AB 上：${TX(`${rhs(ab)}=${dt(k)}`)} より ${TX(`x=${x1}`)}（$0\\leqq x\\leqq ${p}$ に合う）。`,
                `辺 BC 上：${TX(`${rhs(bc)}=${dt(k)}`)} より ${TX(`x=${dt(x2)}`)}（$${p}\\leqq x\\leqq ${p + q}$ に合う）。`,
                early ? `1回目（早いほう）は ${x1}秒後。` : `2回目（遅いほう）は ${dt(x2)}秒後。`,
              ],
            };
          }
          return { skip: true };
        }),
        // 16q03 小テスト（3）三角形 ABP の面積が 6cm² になるのは何秒後か
        t("16q03", (r) => {
          const p = r(4, 10), q = r(5, 10), x0 = r(2, q - 1);
          if (p === q) return { skip: true };
          return {
            q: `${rectOf(p, q)}がある。点 P は、B を出発して、毎秒 1cm の速さで、辺 BC、CD の上を D まで動く。P が B を出発して $x$ 秒後の、三角形 ABP の面積を $y$ cm² とする。三角形 ABP の面積が ${dt(Q(p * x0, 2))}cm² になるのは、P が B を出発して何秒後か。`,
            ans: x0, unit: "秒後",
            hint: "面積が、P が辺 BC 上にあるときの式で表せるか、考えよう。その式に、面積の値を入れると？",
            steps: [`P が辺 BC 上のとき ${TX(`y=${cxq(Q(p, 2))}`)}（$0\\leqq x\\leqq ${q}$）。辺 CD 上のときは、いつも ${dt(Q(p * q, 2))}cm²。`, `${dt(Q(p * x0, 2))}＜${dt(Q(p * q, 2))} だから、P は辺 BC 上。${TX(`${cxq(Q(p, 2))}=${dt(Q(p * x0, 2))}`)} より ${TX(`x=${x0}`)}（$0\\leqq x\\leqq ${q}$ に合う）。`],
          };
        }),
        // 16q04 小テスト（4）P が辺 CD 上にあるとき、y の値
        t("16q04", (r) => {
          const p = r(4, 10), q = r(5, 10), x = r(q + 1, p + q - 1), y = Q(p * q, 2);
          if (p === q) return { skip: true };
          return {
            q: `${rectOf(p, q)}がある。点 P は、B を出発して、毎秒 1cm の速さで、辺 BC、CD の上を D まで動く。P が B を出発して $x$ 秒後の、三角形 ABP の面積を $y$ cm² とする。P が B を出発して ${x}秒後、P は辺 CD 上（$${q}\\leqq x\\leqq ${p + q}$）にある。このときの、三角形 ABP の面積は何 cm² か。`,
            ans: ansOf(y), unit: "cm²",
            hint: "P が辺 CD 上を動くとき、三角形 ABP の底辺 AB と高さは、変わる？ 変わらない？",
            steps: [`P が辺 CD 上にあるとき、底辺 AB＝${p}cm、高さは BC＝${q}cm で、変わらない。`, `${TX(`y=${HALF}\\times ${p}\\times ${q}=${dt(y)}`)}（cm²）。`],
          };
        }),
      ],
      // ───────── 3 応用 ─────────
      3: [
        // 16d04a 直角三角形：三角形 APC の面積 z を x の式で（4択）
        t("16d04a", (r) => {
          const c = triCase(r), { p, q, v } = c;
          return {
            q: `∠B＝90°、AB＝${p}cm、BC＝${q}cm の直角三角形 ABC。点 P は、B から C まで、辺 BC 上を毎秒 ${v}cm で動く。B を出発して $x$ 秒後の、三角形 ABP の面積を $y$ cm²、三角形 APC の面積を $z$ cm² とする。$z$ を $x$ の式で表すと、次のうちどれか。`,
            ans: TX(ltex(c.zL).replace(/^y/, "z")),
            choices: (() => {
              const zt = (L) => ltex(L).replace(/^y/, "z");
              const right = c.zL, seen = new Set([zt(right)]), wrongs = [];
              const cand = [line(Q(-p, 2), Q(p * q, 2)), line(Q(p * v, 2), Q(-p * q, 2)), line(Q(p * v, 2), Q(p * q, 2)), line(-p * v, p * q), line(Q(-q * v, 2), Q(q * q, 2)), line(Q(p * v, 2), 0)];
              for (const w of shuffle(r, cand)) { const s = zt(w); if (seen.has(s)) continue; seen.add(s); wrongs.push(TX(s)); }
              return choices4(r, TX(zt(right)), wrongs, (i) => TX(zt(line(qadd(Q(-p * v, 2), Q((i % 2 ? 1 : -1) * (Math.floor(i / 2) + 1))), Q(p * q, 2)))));
            })(),
            hint: "三角形 APC の底辺を PC とすると、PC の長さは、BC から BP をひいたもの。BP は、$x$ を使うと、どう表せる？",
            steps: [`BP＝${mulTex(v, "x")}（cm）なので PC＝${q}−${mulTex(v, "x")}（cm）。高さは AB＝${p}cm。`, `${TX(`z=${HALF}\\times (${q}-${mulTex(v, "x")})\\times ${p}`)}。かっこをはずして ${TX(ltex(c.zL).replace(/^y/, "z"))}。`],
          };
        }),
        // 16d04b 直角三角形：y＝z になるのは何秒後か（y が z の k倍）
        t("16d04b", (r) => {
          const c = triCase(r), { p, q, v, k } = c;
          const cond = k === 1 ? "三角形 ABP と三角形 APC の面積が等しくなる（$y=z$ になる）のは" : `三角形 ABP の面積が、三角形 APC の面積の ${k}倍になる（$y=${k}z$ になる）のは`;
          const yT = ltex(c.yL), zT = ltex(c.zL).replace(/^y/, "z");
          return {
            q: `∠B＝90°、AB＝${p}cm、BC＝${q}cm の直角三角形 ABC。点 P は、B から C まで、辺 BC 上を毎秒 ${v}cm で動く。B を出発して $x$ 秒後の、三角形 ABP の面積を $y$ cm²、三角形 APC の面積を $z$ cm² とする。${cond}、B を出発して何秒後か。`,
            ans: ansOf(c.x), unit: "秒後",
            hint: "$y$ と $z$ を、それぞれ $x$ の式で表そう。2つの面積の関係を、式にすると？",
            steps: [
              `${TX(yT)}、${TX(zT)}。`,
              `${k === 1 ? TX(`y=z`) : TX(`y=${k}z`)} より ${TX(`${rhs(c.yL)}=${k === 1 ? "" : k}${k === 1 ? rhs(c.zL) : `(${rhs(c.zL)})`}`)}。`,
              `整理して ${TX(`${cxq(Q((1 + k) * p * v, 2))}=${dt(Q(k * p * q, 2))}`)} より ${TX(`x=${dt(c.x)}`)}。（$0\\leqq x\\leqq ${dt(Q(q, v))}$ に合う）`,
            ],
          };
        }),
        // 16d05a 長方形：A さんのまちがいの理由（4択）
        t("16d05a", (r) => {
          const { p, q } = rectABC(r), { bc } = apcLines(p, q), tot = p + q;
          const right = `BP を底辺にした三角形は三角形 ABP で、三角形 APC ではない。三角形 APC の底辺は PC（＝${tot}−$x$）だから。`;
          const wrongs = [
            "三角形の面積は「底辺×高さ」で求めるので、÷2 はいらないから。",
            `三角形 APC の高さは、AB ではなく BC の長さ ${q}cm だから。`,
            `BP の長さは $x-${p}$ ではなく、$${p}-x$ だから。`,
          ];
          return {
            q: `${rectOf(p, q)}で、点 P は、A から辺 AB、BC の上を C まで、毎秒 1cm で動く。A を出発して $x$ 秒後の、三角形 APC の面積を $y$ cm² とする。A さんは、P が辺 BC 上にあるときの $y$ を、BP＝($x-${p}$) cm を底辺として、${TX(`y=${HALF}\\times (x-${p})\\times ${p}=${ltex(line(Q(p, 2), Q(-p * p, 2))).slice(2)}`)} と求めたが、これはまちがっている。まちがっている理由として、正しいものは、次のうちどれか。`,
            ans: right,
            choices: choices4(r, right, wrongs),
            hint: "A さんの式で、底辺としている BP は、どの三角形の底辺かな？ 三角形 APC の底辺は？",
            steps: [`BP を底辺にした三角形は ABP で、三角形 APC ではない。`, `三角形 APC の底辺は PC＝${tot}−$x$（cm）。高さは AB＝${p}cm。`, `正しくは ${TX(`y=${HALF}\\times (${tot}-x)\\times ${p}`)} で、${TX(ltex(bc))}。`],
          };
        }),
        // 16d05b 長方形：正しい式で、P が辺 BC 上のときの面積
        t("16d05b", (r) => {
          const { p, q } = rectABC(r), { bc } = apcLines(p, q), x = r(p + 1, p + q - 1), y = yAt(bc, x);
          return {
            q: `${rectOf(p, q)}で、点 P は、A から辺 AB、BC の上を C まで、毎秒 1cm で動く。A を出発して $x$ 秒後の、三角形 APC の面積を $y$ cm² とする。A を出発して ${x}秒後、P は辺 BC 上にある。このときの、三角形 APC の面積は何 cm² か。`,
            ans: ansOf(y), unit: "cm²",
            hint: "P が辺 BC 上にあるとき、三角形 APC の底辺は、どの線分？ その長さは、出発してからの時間と、AB、BC の長さから、どう求められる？",
            steps: [`P が辺 BC 上のとき PC＝${p + q}−${x}＝${p + q - x}（cm）。高さは AB＝${p}cm。`, `${TX(`y=${HALF}\\times ${p + q - x}\\times ${p}=${dt(y)}`)}（cm²）。`],
          };
        }),
      ],
      // ───────── 4 入試レベル ─────────
      4: [
        // 16d06a 折れ線グラフ：AB・BC の長さ
        t("16d06a", (r) => {
          const c = peakCase(r), askAB = r(0, 1) === 0;
          return {
            q: `長方形 ABCD の辺上を、点 P が、A から B を通って C まで、毎秒 1cm で動く。A を出発して $x$ 秒後の、三角形 APC の面積を $y$ cm² とする。$x$ と $y$ の関係を表すグラフは、3点 ${TX("(0, 0)")}、${TX(`(${c.p}, ${dt(c.h)})`)}、${TX(`(${c.p + c.q}, 0)`)} を、順に線分で結んだ折れ線である。${askAB ? "AB" : "BC"} の長さは何 cm か。`,
            ans: askAB ? c.p : c.q, unit: "cm",
            hint: askAB ? "グラフが折れる点は、P がどこに来たときかな？ そのとき、$x$ はいくつ？" : "グラフが折れる点と、$y$ が 0 にもどる点は、それぞれ、P がどこに来たとき？",
            steps: askAB
              ? [`$y$ が最大になる（グラフが折れる）のは、P が B に来たとき。$x=${c.p}$ のとき。`, `毎秒 1cm で ${c.p}秒動いたので、AB＝${c.p}cm。`]
              : [`P が B に来るのは $x=${c.p}$、C に来る（$y$ が 0 にもどる）のは $x=${c.p + c.q}$ のとき。`, `BC＝${TX(`${c.p + c.q}-${c.p}=${c.q}`)}（cm）。`],
          };
        }),
        // 16d06b 折れ線グラフ：P が辺 BC 上のときの式（4択）
        t("16d06b", (r) => {
          const c = peakCase(r), p1 = [c.p, c.h], p2 = [c.p + c.q, 0];
          return {
            q: `長方形 ABCD の辺上を、点 P が、A から B を通って C まで、毎秒 1cm で動く。A を出発して $x$ 秒後の、三角形 APC の面積を $y$ cm² とする。$x$ と $y$ の関係を表すグラフは、3点 ${TX("(0, 0)")}、${TX(`(${c.p}, ${dt(c.h)})`)}、${TX(`(${c.p + c.q}, 0)`)} を、順に線分で結んだ折れ線である。$${c.p}\\leqq x\\leqq ${c.p + c.q}$ のときの、$y$ を $x$ の式で表すと、次のうちどれか。`,
            ans: TX(ltex(c.L2)),
            choices: throughChoices(r, c.L2, p1, p2),
            hint: "この範囲のグラフは、どの2点を通る線分？ その2点から、傾きと切片を出せるかな？",
            steps: [`この範囲のグラフは、2点 ${TX(`(${c.p}, ${dt(c.h)})`)}、${TX(`(${c.p + c.q}, 0)`)} を通る。傾きは ${TX(`\\frac{0-${dt(c.h)}}{${c.p + c.q}-${c.p}}=${qt(c.L2.a)}`)}。`, `点 ${TX(`(${c.p + c.q}, 0)`)} を通るので ${TX(`0=(${qt(c.L2.a)})\\times ${c.p + c.q}+b`)} より ${TX(`b=${qt(c.L2.b)}`)}。式は ${TX(ltex(c.L2))}。`],
          };
        }),
        // 16d06c 折れ線グラフ：y＝6 になるのは何秒後か（2回ある）
        t("16d06c", (r) => {
          for (let n = 0; n < 300; n++) {
            const c = peakCase(r), x1 = r(1, c.p - 1), k = qmul(Q(c.q, 2), Q(x1));
            if (!isFin(k) || qval(k) >= qval(c.h)) continue;
            const x2 = xAt(c.L2, k);
            if (x2[1] > 2 || qval(x2) <= c.p || qval(x2) >= c.p + c.q) continue;
            const early = r(0, 1) === 0, xs = early ? Q(x1) : x2;
            return {
              q: `長方形 ABCD の辺上を、点 P が、A から B を通って C まで、毎秒 1cm で動く。A を出発して $x$ 秒後の、三角形 APC の面積を $y$ cm² とする。$x$ と $y$ の関係を表すグラフは、3点 ${TX("(0, 0)")}、${TX(`(${c.p}, ${dt(c.h)})`)}、${TX(`(${c.p + c.q}, 0)`)} を、順に線分で結んだ折れ線である。三角形 APC の面積が ${dt(k)}cm² になるのは、A を出発してから、2回ある。${early ? "1回目（早いほう）" : "2回目（遅いほう）"}は、何秒後か。`,
              ans: ansOf(xs), unit: "秒後",
              hint: "グラフは、折れ線。$0\\leqq x\\leqq" + c.p + "$ のときと、それ以降とで、式がちがう。それぞれの式に、面積の値を入れてみよう。",
              steps: [
                `$0\\leqq x\\leqq ${c.p}$ のとき ${TX(ltex(c.L1))}、$${c.p}\\leqq x\\leqq ${c.p + c.q}$ のとき ${TX(ltex(c.L2))}。（2点の座標から求めた）`,
                `${early ? `${TX(`${rhs(c.L1)}=${dt(k)}`)} より ${TX(`x=${x1}`)}（$0\\leqq x\\leqq ${c.p}$ に合う）。` : `${TX(`${rhs(c.L2)}=${dt(k)}`)} より ${TX(`x=${dt(x2)}`)}（$${c.p}\\leqq x\\leqq ${c.p + c.q}$ に合う）。`}`,
                early ? `1回目（早いほう）は ${x1}秒後。` : `2回目（遅いほう）は ${dt(x2)}秒後。`,
              ],
            };
          }
          return { skip: true };
        }),
        // 16q05 チャレンジ：三角形 APD の面積が 10cm² になるのは何秒後か
        t("16q05", (r) => {
          for (let n = 0; n < 200; n++) {
            const p = r(4, 10), q = r(5, 10), x = r(q + 1, p + q - 1);
            if (p === q) continue;
            const k = Q(q * (p + q - x), 2);
            if (!isFin(k) || qval(k) >= (p * q) / 2) continue;
            const L = line(Q(-q, 2), Q(q * (p + q), 2));
            if (!qeq(yAt(L, x), k)) throw new Error("16q05 の式が合わない");
            return {
              q: `${rectOf(p, q)}がある。点 P は、B を出発して、毎秒 1cm の速さで、辺 BC、CD の上を D まで動く。P が B を出発して $x$ 秒後の、三角形 APD の面積を $y$ cm² とする。三角形 APD の面積が ${dt(k)}cm² になるのは、P が B を出発して何秒後か。`,
              ans: x, unit: "秒後",
              hint: "P が辺 BC 上のときと、辺 CD 上のときで、三角形 APD の底辺や高さは、それぞれ、どうなる？",
              steps: [
                `P が辺 BC 上（$0\\leqq x\\leqq ${q}$）のとき、底辺 AD＝${q}cm、高さ AB＝${p}cm で、いつも ${TX(`${HALF}\\times ${q}\\times ${p}=${dt(Q(p * q, 2))}`)}（cm²）。${dt(k)} にはならない。`,
                `P が辺 CD 上（$${q}\\leqq x\\leqq ${p + q}$）のとき、PD＝${p + q}−$x$（cm）。${TX(`y=${HALF}\\times ${q}\\times (${p + q}-x)`)}。`,
                `${TX(`${HALF}\\times ${q}\\times (${p + q}-x)=${dt(k)}`)} より ${TX(`${p + q}-x=${p + q - x}`)}、${TX(`x=${x}`)}（$${q}\\leqq x\\leqq ${p + q}$ に合う）。`,
              ],
            };
          }
          return { skip: true };
        }),
      ],
    },
  }),
];

/** 直線の右辺（y＝ の右） */
function rhs(L) { return ltex(L).slice(2); }

// 移さなかった問題
export const SKIPPED = [];   // 第16時は、演習プリント 6問・小テスト 5問のすべてを移した（図は出せないので、辺の長さ・点の動き方・グラフの頂点の座標を文で言い切った）
