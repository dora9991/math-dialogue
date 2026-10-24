// ============================================================
// renritsu-12.js — 連立方程式 第12時「連立方程式に合う問題をつくって、解き合おう」
//   ikkan の演習プリント（renritsu-12.dr.1〜8）・小テスト（renritsu-12.qz.1〜4）を、コツコツくんのテンプレートにしたもの。
//   テンプレート id＝「12」＋ d（演習）／q（小テスト）＋ ikkan の問題の番号（＋ a, b…）。例：12d06b ＝ renritsu-12.dr.6 の2つ目
//   「問題をつくって書く」問いは、(a) 式に合う問題（場面）を選ぶ4択、(b) 空欄の数を求める、(c) 式を解いて数を聞く、のどれかに直した。
//   「理由を書く」問いは、正しい理由を選ぶ4択に直した。解は、すべて algebra.js の solve2 で計算している。
// ============================================================
import { t, pick, choices4, shuffle, round, lcm, rnz, coefVar, signedVar } from "../kit.js";
import { unitFor } from "../unit-kit.js";
import { solve2, casesTex, linTex, Q, qval, qtex, qeq } from "../algebra.js";

const unit = unitFor("renritsu");

// ── 小さな道具 ──────────────────────────────────────────
const same = (a, b, msg) => { if (!qeq(a, b)) throw new Error(`計算の食いちがい: ${msg}`); };
const NOUN = { 個: "個数", 本: "本数", 枚: "枚数", 冊: "冊数", 人: "人数" };
const SHOP = [["ドーナツ", "クッキー", "個"], ["鉛筆", "ペン", "本"], ["ボールペン", "ものさし", "本"], ["シール", "カード", "枚"], ["みかん", "りんご", "個"], ["ノート", "ファイル", "冊"], ["パン", "おにぎり", "個"], ["色紙", "画用紙", "枚"]];
/** 値段の組（a ≠ b）：30 円以上 */
const prices = (r) => {
  const a = pick(r, [40, 50, 60, 70, 80, 90, 100, 120, 150]);
  let b = a + pick(r, [20, 30, 40, 50]) * (r(0, 2) === 0 ? -1 : 1);
  if (b < 30) b = a + 30;
  return [a, b];
};
const mul = (k) => (k === 1 ? "" : `×${k}`);   // ①×1 とは書かない
/** x＋y＝n、a x＋b y＝k を解く手順（2行） */
const buySteps = (a, b, n, k, [x, y]) => [
  `$x+y=${n}$ …①　$${a}x+${b}y=${k}$ …②`,
  `②−①${mul(a)}　$${coefVar(b - a, "y")}=${k - a * n}$　$y=${qtex(y)}$　①より　$x=${qtex(x)}$`,
];

/** 式が 1つ（a x＋b y＝k）で、どちらも 1以上の整数の組が lo〜hi 通りある場面 */
function manyPairs(r, lo = 2, hi = 5, kMax = 150) {
  for (let i = 0; i < 400; i++) {
    const [A, B, c] = pick(r, [["パン", "おにぎり", "個"], ["クッキー", "ドーナツ", "個"], ["えんぴつ", "ボールペン", "本"], ["シール", "カード", "枚"]]);
    const [a, b] = pick(r, [[100, 150], [50, 80], [60, 90], [40, 70], [120, 150], [30, 50], [80, 110], [70, 100], [90, 120]]);
    const k = 10 * r(40, kMax), ps = [];
    for (let y = 1; b * y < k; y++) { const rest = k - b * y; if (rest % a === 0) ps.push([rest / a, y]); }
    if (ps.length >= lo && ps.length <= hi) return { A, B, c, a, b, k, ps };
  }
  return null;
}

export const UNITS = [
  unit("12", {
    name: "連立方程式に合う問題をつくる",
    desc: "式に合う場面・空欄の数・条件を考えて、問題をつくる",
    prereqs: ["J2-rk11", "J1-e2"],
    points: [
      "連立方程式に合う問題をつくるときは、まず場面を決めて、$x$、$y$ が表す数量を決める。",
      "次に、$x$、$y$ の答え（値）を決めて、数量の関係を式にし、右辺の数を計算してそろえる。",
      "等しい関係が 1つしかないと、あてはまる $x$、$y$ の組が何通りもあって、答えが 1つに決まらない。等しい関係を 2つ（式を2つ）立てると、答えが決まる。",
      "連立方程式の解は、2つの式を両方成り立たせる $x$、$y$ の値の組。つくった問題は、解いて、答えが場面に合うか確かめる。",
    ],
    levels: {
      // ───────── 1 基礎 ─────────
      1: [
        // 12d01 ⟦x+y＝12 ; 120x+80y＝1160⟧ に合う問題を選ぶ
        t("12d01", (r) => {
          const [A, B, c] = pick(r, SHOP), [a, b] = prices(r);
          const x0 = r(2, 8), y0 = r(2, 8), n = x0 + y0, k = a * x0 + b * y0, noun = NOUN[c];
          if (x0 === y0) return { skip: true };
          const ok = `1${c} ${a}円の${A}と、1${c} ${b}円の${B}を、合わせて ${n}${c}買うと、${k}円だった。`;
          const bad = [
            `1${c} ${b}円の${A}と、1${c} ${a}円の${B}を、合わせて ${n}${c}買うと、${k}円だった。`,
            `1${c} ${a}円の${A}を ${n}${c}と、1${c} ${b}円の${B}を何${c}か買うと、${k}円だった。`,
            `1${c} ${a}円の${A}と、1${c} ${b}円の${B}を、${A}が${B}より ${n}${c}多くなるように買うと、${k}円だった。`,
          ];
          return {
            q: `連立方程式 $${casesTex([linTex(1, 1, n), linTex(a, b, k)])}$ に合う問題はどれか。（$x$ は${A}の${noun}、$y$ は${B}の${noun}）`,
            ans: ok,
            choices: choices4(r, ok, bad),
            hint: `1つ目の式は「合わせた${noun}」、2つ目の式は「代金」の関係。値段が、どちらの文字についているかも見よう。`,
            steps: [`$x+y=${n}$ は、${A}と${B}を合わせて ${n}${c}ということ。`, `$${a}x+${b}y=${k}$ は、${A}（1${c} ${a}円）が $x$ ${c}、${B}（1${c} ${b}円）が $y$ ${c}で、代金が ${k}円ということ。`, "この2つが両方そろっている問題を選ぶ。"],
          };
        }),
        // 12d02a ⟦x+y＝28 ; x＝3y⟧ を解く
        t("12d02a", (r) => {
          const form = pick(r, ["mx", "my", "d"]);
          let x0, y0, e2, row2, sub;
          if (form === "mx") { const m = r(2, 5); y0 = r(2, 9); x0 = m * y0; e2 = `x=${m}y`; row2 = [1, -m, 0]; sub = (n) => `②を①に代入して　$${m}y+y=${n}$　$${m + 1}y=${n}$　$y=${y0}$`; }
          else if (form === "my") { const m = r(2, 5); x0 = r(2, 9); y0 = m * x0; e2 = `y=${m}x`; row2 = [m, -1, 0]; sub = (n) => `②を①に代入して　$x+${m}x=${n}$　$${m + 1}x=${n}$　$x=${x0}$`; }
          else { const d = r(2, 9); y0 = r(3, 12); x0 = y0 + d; e2 = `x=y+${d}`; row2 = [1, -1, d]; sub = (n) => `②を①に代入して　$(y+${d})+y=${n}$　$2y=${n - d}$　$y=${y0}$`; }
          const n = x0 + y0, sol = solve2([1, 1, n], row2), ask = pick(r, ["x", "y"]);
          same(sol[0], Q(x0), "12d02a x");
          return {
            q: `連立方程式 $${casesTex([`x+y=${n}`, e2])}$ を解いて、$${ask}$ の値を求めよう。`,
            ans: ask === "x" ? x0 : y0,
            hint: "2つ目の式は、$x$ か $y$ が、もう一方の文字の式で表されている。これを①に代入して、文字を 1つにしよう。",
            steps: [`$x+y=${n}$ …①　$${e2}$ …②`, sub(n), `$x=${x0}$、$y=${y0}$`],
          };
        }),
        // 12d02b ⟦x+y＝28 ; x＝3y⟧ に合う場面（関係）を選ぶ
        t("12d02b", (r) => {
          const [A, B, c] = pick(r, [["小説", "図鑑", "冊"], ["男子", "女子", "人"], ["大人", "子ども", "人"], ["赤い玉", "青い玉", "個"]]);
          const noun = NOUN[c] || "数", kind = pick(r, ["R1", "R2", "R3", "R4"]), m = r(2, 5), d = r(2, 8);
          let x0, y0;
          if (kind === "R1") { y0 = r(2, 8); x0 = m * y0; } else if (kind === "R2") { x0 = r(2, 8); y0 = m * x0; } else if (kind === "R3") { y0 = r(3, 12); x0 = y0 + d; } else { x0 = r(3, 12); y0 = x0 + d; }
          const n = x0 + y0;
          const REL = {
            R1: [`x=${m}y`, `${A}の${noun}は、${B}の ${m}倍である`],
            R2: [`y=${m}x`, `${B}の${noun}は、${A}の ${m}倍である`],
            R3: [`x=y+${d}`, `${A}は、${B}より ${d}${c}多い`],
            R4: [`x=y-${d}`, `${A}は、${B}より ${d}${c}少ない`],
            R5: ["x=y", `${A}と${B}の${noun}は、同じである`],
          };
          const say = (key) => `${A}と${B}は、合わせて ${n}${c}で、${REL[key][1]}。`;
          const holds = { R1: x0 === m * y0, R2: y0 === m * x0, R3: x0 === y0 + d, R4: x0 === y0 - d, R5: x0 === y0 };   // 解の値で、たまたま成り立つ言い方は、誤答に入れない
          const wrongs = shuffle(r, ["R1", "R2", "R3", "R4", "R5"].filter((k) => k !== kind && !holds[k])).slice(0, 3).map(say);
          return {
            q: `連立方程式 $${casesTex([`x+y=${n}`, REL[kind][0]])}$ に合う問題はどれか。（$x$ は${A}の${noun}、$y$ は${B}の${noun}）`,
            ans: say(kind),
            choices: choices4(r, say(kind), wrongs),
            hint: "2つ目の式は、$x$ と $y$ の関係を表している。「何倍」か「いくつ多い・少ない」か、どちらが大きいかを見よう。",
            steps: [`$x+y=${n}$ は、合わせて ${n}${c}ということ。`, `$${REL[kind][0]}$ は、${REL[kind][1]}ということ。`, `だから、「${say(kind)}」が合う。`],
          };
        }),
        // 12q01 ⟦x+y＝10 ; 40x+110y＝890⟧ に合う問題になるように、空欄にあてはまる数
        t("12q01", (r) => {
          const [A, B, c] = pick(r, SHOP), [a, b] = prices(r), x0 = r(2, 8), y0 = r(2, 8), n = x0 + y0, k = a * x0 + b * y0, noun = NOUN[c];
          const which = pick(r, ["a", "b", "n", "k"]), v = { a, b, n, k };
          const s = (key) => (key === which ? "□" : String(v[key]));
          return {
            q: `連立方程式 $${casesTex([linTex(1, 1, n), linTex(a, b, k)])}$ に合う問題になるように、□にあてはまる数を答えよう。（$x$ は${A}の${noun}、$y$ は${B}の${noun}）「1${c} ${s("a")}円の${A}と、1${c} ${s("b")}円の${B}を、合わせて ${s("n")}${c}買ったら、代金は ${s("k")}円だった。」`,
            ans: v[which],
            unit: which === "n" ? c : "円",
            hint: "式の数と、問題文の数を、1つずつ対応させよう。$x$ や $y$ の係数は、何を表しているか。",
            steps: [`$x+y=${n}$ は「合わせて ${n}${c}」、$${a}x+${b}y=${k}$ は「${A}が1${c} ${a}円、${B}が1${c} ${b}円で、代金が ${k}円」。`, `□は ${v[which]}${which === "n" ? c : "円"}。`],
          };
        }),
      ],
      // ───────── 2 標準 ─────────
      2: [
        // 12d03a 解が x＝4、y＝6 になるように、代金の空欄を求める
        t("12d03a", (r) => {
          const [A, B, c] = pick(r, [["鉛筆", "ものさし", "本"], ["ノート", "ファイル", "冊"], ["シール", "カード", "枚"], ["あめ", "チョコレート", "個"]]), [a, b] = prices(r);
          const x0 = r(2, 9), y0 = r(2, 9), n = x0 + y0, k = a * x0 + b * y0;
          return {
            q: `1${c} ${a}円の${A}を $x$ ${c}と、1${c} ${b}円の${B}を $y$ ${c}買った。解が $x=${x0}$、$y=${y0}$ になるように、「合わせて ${n}${c}で、代金は □円だった。」とする。□にあてはまる数は？`,
            ans: k,
            unit: "円",
            hint: "解は、2つの式の両方を成り立たせる。代金は（値段）×（個数）の和。解の値を、代金の式に入れよう。",
            steps: [`合わせた${NOUN[c]}　$${x0}+${y0}=${n}$（${c}）`, `代金　$${a}\\times${x0}+${b}\\times${y0}=${a * x0}+${b * y0}=${k}$（円）`],
          };
        }),
        // 12d03b 解が x＝4、y＝6 になるように、値段の空欄を求める
        t("12d03b", (r) => {
          const [A, B, c] = pick(r, [["鉛筆", "ものさし", "本"], ["ノート", "ファイル", "冊"], ["シール", "カード", "枚"], ["あめ", "チョコレート", "個"]]), [a, b] = prices(r);
          const x0 = r(2, 9), y0 = r(2, 9), n = x0 + y0, k = a * x0 + b * y0;
          return {
            q: `1${c} ${a}円の${A}を $x$ ${c}と、1${c} □円の${B}を $y$ ${c}買った。合わせて ${n}${c}で、代金は ${k}円だった。解が $x=${x0}$、$y=${y0}$ になるようにするには、□を何円にすればよいか。`,
            ans: b,
            unit: "円",
            hint: "解の値を、代金の式（値段×個数の和）に入れて、□についての方程式を解こう。",
            steps: [`代金の式に $x=${x0}$、$y=${y0}$ を入れる　$${a}\\times${x0}+\\square\\times${y0}=${k}$`, `$${y0}\\times\\square=${k - a * x0}$　$\\square=${b}$（円）`],
          };
        }),
        // 12d04 大人 900円、子ども 500円が答えになるように、入館料の空欄を求める
        t("12d04", (r) => {
          const place = pick(r, ["美術館", "水族館", "動物園", "博物館", "科学館"]);
          for (let i = 0; i < 50; i++) {
            const p1 = r(1, 4), q1 = r(1, 4), p2 = r(1, 4), q2 = r(1, 4);
            if (p1 * q2 - p2 * q1 === 0) continue;
            const A = r(5, 15) * 100, C = r(2, 9) * 100;
            if (C >= A) continue;
            const s1 = p1 * A + q1 * C, s2 = p2 * A + q2 * C, ask = pick(r, ["ア", "イ"]);
            return {
              q: `ある${place}の入館料は、大人 ${p1}人と子ども ${q1}人で ア円、大人 ${p2}人と子ども ${q2}人で イ円である。大人1人の入館料 $x=${A}$ 円、子ども1人の入館料 $y=${C}$ 円が連立方程式の答えになるように、${ask}にあてはまる数を求めよう。`,
              ans: ask === "ア" ? s1 : s2,
              unit: "円",
              hint: "答えは、2つの式の両方を成り立たせる。（大人の人数）×（大人1人の入館料）＋（子どもの人数）×（子ども1人の入館料）を計算しよう。",
              steps: [`ア　$${p1}\\times${A}+${q1}\\times${C}=${p1 * A}+${q1 * C}=${s1}$（円）`, `イ　$${p2}\\times${A}+${q2}\\times${C}=${p2 * A}+${q2 * C}=${s2}$（円）`, `${ask}は ${ask === "ア" ? s1 : s2}円。`],
            };
          }
          return { skip: true };
        }),
        // 12q02 ⟦x+y＝10 ; 40x+110y＝890⟧ を解く（本数は問題に合うか）
        t("12q02", (r) => {
          const [A, B, c] = pick(r, SHOP), [a, b] = prices(r);
          const x0 = r(2, 9), y0 = r(2, 9);
          if (x0 === y0) return { skip: true };
          const n = x0 + y0, k = a * x0 + b * y0, sol = solve2([1, 1, n], [a, b, k]), askA = r(0, 1) === 1;
          same(sol[0], Q(x0), "12q02 x");
          return {
            q: `1${c} ${a}円の${A}と、1${c} ${b}円の${B}を、合わせて ${n}${c}買ったら、代金は ${k}円だった。連立方程式 $${casesTex([linTex(1, 1, n), linTex(a, b, k)])}$ を解いて、${askA ? A : B}は何${c}買ったか求めよう。（$x$ は${A}の${NOUN[c]}、$y$ は${B}の${NOUN[c]}）`,
            ans: askA ? x0 : y0,
            unit: c,
            hint: "どちらかの文字を消そう。①を何倍かして②からひくと、$x$ が消える（または $y$ が消える）。",
            steps: [...buySteps(a, b, n, k, sol), `${A}は ${x0}${c}、${B}は ${y0}${c}。確かめ　$${a}\\times${x0}+${b}\\times${y0}=${k}$ で、${NOUN[c]}は正の整数だから問題に合う。`],
          };
        }),
      ],
      // ───────── 3 応用 ─────────
      3: [
        // 12d05a ⟦x+y＝36 ; x/3＋y/30＝3⟧ を解く
        t("12d05a", (r) => {
          const v1 = pick(r, [3, 4, 5, 6]), v2 = pick(r, [12, 15, 20, 30, 40, 60]), t1 = r(1, 4), t2 = r(1, 3);
          const x0 = v1 * t1, y0 = v2 * t2, D = x0 + y0, T = t1 + t2, L = lcm(v1, v2), ask = pick(r, ["x", "y"]);
          const sol = solve2([1, 1, D], [L / v1, L / v2, L * T]);
          same(sol[0], Q(x0), "12d05a x");
          return {
            q: `連立方程式 $${casesTex([`x+y=${D}`, `\\frac{x}{${v1}}+\\frac{y}{${v2}}=${T}`])}$ を解いて、$${ask}$ の値を求めよう。`,
            ans: ask === "x" ? x0 : y0,
            hint: "分数のある式は、分母の最小公倍数を両辺にかけて、分母をはらってから解こう。",
            steps: [
              `下の式の両辺に ${L} をかける　$${coefVar(L / v1, "x")}${signedVar(L / v2, "y")}=${L * T}$ …③`,
              `③−①${mul(L / v2)}　$${coefVar(L / v1 - L / v2, "x")}=${L * T - (L / v2) * D}$　$x=${x0}$`,
              `①より　$y=${D}-${x0}=${y0}$`,
            ],
          };
        }),
        // 12d05b 「道のり・速さ・時間」の問題を解く
        t("12d05b", (r) => {
          const v1 = pick(r, [3, 4, 5, 6]), v2 = pick(r, [20, 30, 40]), t1 = r(1, 4), t2 = r(1, 3);
          const x0 = v1 * t1, y0 = v2 * t2, D = x0 + y0, T = t1 + t2, L = lcm(v1, v2), abAsk = r(0, 1) === 1;
          const [P, Q2, R] = pick(r, [["A町", "B町", "C町"], ["家", "駅", "学校"], ["P地点", "Q地点", "R地点"]]);
          const sol = solve2([1, 1, D], [L / v1, L / v2, L * T]);
          same(sol[1], Q(y0), "12d05b y");
          return {
            q: `${P}から${R}まで ${D} km ある。${P}から${Q2}までは、歩いて時速 ${v1} km、${Q2}から${R}までは、バスで時速 ${v2} km で進み、全部で ${T}時間かかった。${abAsk ? `${P}から${Q2}まで` : `${Q2}から${R}まで`}の道のりは、何 km か。`,
            ans: abAsk ? x0 : y0,
            unit: "km",
            hint: `${P}から${Q2}までを $x$ km、${Q2}から${R}までを $y$ km として、道のりの式と、時間（道のり÷速さ）の式をつくろう。`,
            steps: [
              `$x+y=${D}$ …①　$\\frac{x}{${v1}}+\\frac{y}{${v2}}=${T}$ …②`,
              `②の両辺に ${L} をかける　$${coefVar(L / v1, "x")}${signedVar(L / v2, "y")}=${L * T}$ …③　　③−①${mul(L / v2)}　$${coefVar(L / v1 - L / v2, "x")}=${L * T - (L / v2) * D}$　$x=${x0}$、$y=${y0}$`,
              `${P}から${Q2}まで ${x0} km、${Q2}から${R}まで ${y0} km。`,
            ],
          };
        }),
        // 12d06a 式が 1つしかない問題：あてはまる組は何通りか
        t("12d06a", (r) => {
          const target = r(2, 7);   // 組の数がかたよらないように、先に決める
          const g = manyPairs(r, target, target, 400) || manyPairs(r);
          if (!g) return { skip: true };
          const { A, B, c, a, b, k, ps } = g;
          return {
            q: `1${c} ${a}円の${A}と、1${c} ${b}円の${B}を買ったら、代金は ${k}円だった。どちらも 1${c}以上買ったとき、${A}と${B}の${NOUN[c]}の組は、何通り考えられるか。`,
            ans: ps.length,
            unit: "通り",
            hint: "式は 1つしか立たない。$y$ を 1、2、… と決めて、$x$ が正の整数になるかを調べよう。",
            steps: [
              `${A}を $x$ ${c}、${B}を $y$ ${c}とすると　$${a}x+${b}y=${k}$`,
              `$y=1,\\ 2,\\ 3,\\ \\dots$ と順に入れて、$x=\\frac{${k}-${b}y}{${a}}$ が正の整数になるものを探す。`,
              `${ps.map(([x, y]) => `$(${x},\\ ${y})$`).join("、")}`,
              `全部で ${ps.length}通り。式が 1つだけだと、答えが 1つに決まらない。`,
            ],
          };
        }),
        // 12d06b 条件を 1つ加えて、答えが 1つに決まるようにする（条件を選ぶ）
        t("12d06b", (r) => {
          const g = manyPairs(r);
          if (!g) return { skip: true };
          const { A, B, c, a, b, k, ps } = g;
          const [x0, y0] = pick(r, ps), n = x0 + y0, noun = NOUN[c];
          const ok = `${A}と${B}を、合わせて ${n}${c}買った。`;
          // 誤答：加えても、あてはまる組が 2つ以上のこるもの（1つに決まらない）。足りなければ、問題にすでに書いてあることで補う
          const pool = [
            [`${A}を${B}より多く買った。`, ([x, y]) => x > y],
            [`${A}を${B}より少なく買った。`, ([x, y]) => x < y],
            [`${A}の${noun}は、偶数だった。`, ([x]) => x % 2 === 0],
            [`${A}の${noun}は、奇数だった。`, ([x]) => x % 2 === 1],
            [`${B}の${noun}は、偶数だった。`, ([, y]) => y % 2 === 0],
            [`${B}の${noun}は、奇数だった。`, ([, y]) => y % 2 === 1],
          ];
          for (let tt = 2; tt <= 30; tt++) {
            pool.push([`${A}は ${tt}${c}以上買った。`, ([x]) => x >= tt], [`${B}は ${tt}${c}以上買った。`, ([, y]) => y >= tt], [`${A}は ${tt}${c}以下買った。`, ([x]) => x <= tt], [`${B}は ${tt}${c}以下買った。`, ([, y]) => y <= tt]);
          }
          const cnt = (f) => ps.filter(f).length;
          const good = pool.filter(([, f]) => cnt(f) >= 2);
          const partial = shuffle(r, good.filter(([, f]) => cnt(f) < ps.length)), whole = shuffle(r, good.filter(([, f]) => cnt(f) === ps.length));
          const types = new Set(), bad = [];
          for (const [text] of [...partial, ...whole]) {   // 同じ種類（「偶数」「以上」など）が重ならないように
            const key = text.replace(/\d+/g, "").replace(new RegExp(`${A}|${B}`, "g"), "");
            if (types.has(key)) continue;
            types.add(key); bad.push(text);
            if (bad.length === 3) break;
          }
          for (const t2 of [`代金は、ちょうど ${k}円だった。`, `${A}は 1${c} ${a}円、${B}は 1${c} ${b}円だった。`, `${A}と${B}を、どちらも買った。`]) if (bad.length < 3) bad.push(t2);
          return {
            q: `「1${c} ${a}円の${A}と、1${c} ${b}円の${B}を買ったら、代金は ${k}円だった。それぞれ何${c}買ったでしょう。」（${noun}は、どちらも 1${c}以上の整数とする）この問題は、このままでは答えが 1つに決まらない。答えが 1つに決まるようにするには、どの条件を加えればよいか。`,
            ans: ok,
            choices: choices4(r, ok, bad),
            hint: "いまの式は 1つだけ。答えを 1つに決めるには、等しい関係があと何個いるだろう。",
            steps: [`いまの条件は、式 $${a}x+${b}y=${k}$ が 1つだけ。あてはまる組は、${ps.map(([x, y]) => `$(${x},\\ ${y})$`).join("、")} の${ps.length}通り。`, `「${ok}」を加えると、$x+y=${n}$ という 2つ目の式ができて、組が 1つに決まる。`, "ほかの条件では、あてはまる組が 2つ以上のこる（または、すでに問題に書いてあることで、条件がふえていない）。"],
          };
        }),
        // 12d06c 「合わせて ○個」を加えて、解く
        t("12d06c", (r) => {
          const g = manyPairs(r);
          if (!g) return { skip: true };
          const { A, B, c, a, b, k, ps } = g;
          const [x0, y0] = pick(r, ps), n = x0 + y0, sol = solve2([1, 1, n], [a, b, k]), askA = r(0, 1) === 1;
          same(sol[0], Q(x0), "12d06c x");
          return {
            q: `1${c} ${a}円の${A}と、1${c} ${b}円の${B}を買ったら、代金は ${k}円だった。「合わせて ${n}${c}買った」という条件を加えると、${askA ? A : B}は何${c}買ったことになるか。`,
            ans: askA ? x0 : y0,
            unit: c,
            hint: `${A}を $x$ ${c}、${B}を $y$ ${c}として、「合わせた${NOUN[c]}」の式を加えて、連立方程式を解こう。`,
            steps: [...buySteps(a, b, n, k, sol), `${A}は ${x0}${c}、${B}は ${y0}${c}。`],
          };
        }),
        // 12q03a 「合わせて 10本」だけでは答えが 1つに決まらないわけ
        t("12q03a", (r) => {
          const [A, B, c] = pick(r, SHOP), n = r(6, 15), noun = NOUN[c];
          const ok = `等しい関係が 1つ（$x+y=${n}$）しかなく、あてはまる組が何通りもあるから。`;
          return {
            q: `「${A}と${B}を、合わせて ${n}${c}買いました。それぞれ何${c}買ったでしょう。」この問題は、このままでは答えが 1つに決まらない。そのわけとして、正しいものはどれか。`,
            ans: ok,
            choices: choices4(r, ok, ["未知数（$x$、$y$）の数より、等しい関係の数が多すぎるから。", "文字が 2つ（$x$、$y$）あるときは、等しい関係が 3つないと、解が決まらないから。", `$x+y=${n}$ をみたす組は 1組だけなのに、${A}と${B}のどちらを先に決めるかが書かれていないから。`]),
            hint: "$x$、$y$ の 2つの文字の値を決めるには、等しい関係がいくつ必要か。いまの問題には、いくつあるか。",
            steps: [`${A}を $x$ ${c}、${B}を $y$ ${c}とすると、立つ式は $x+y=${n}$ の 1つだけ。`, `$x+y=${n}$ をみたす組は、$(1,\\ ${n - 1})$、$(2,\\ ${n - 2})$、… と何通りもある。`, "答えを 1つに決めるには、もう 1つ、別の等しい関係が必要。"],
          };
        }),
        // 12q03b 条件を 1つ加えて、答えが 1つに決まるようにする（解く）
        t("12q03b", (r) => {
          const [A, B, c] = pick(r, SHOP), kind = pick(r, ["d", "m"]);
          let x0, y0, cond, e2, row2;
          if (kind === "d") { const d = r(2, 6); y0 = r(2, 9); x0 = y0 + d; cond = `${A}は、${B}より ${d}${c}多い`; row2 = [1, -1, d]; e2 = `x=y+${d}`; }
          else { const m = r(2, 4); y0 = r(2, 6); x0 = m * y0; cond = `${A}は、${B}の ${m}倍`; row2 = [1, -m, 0]; e2 = `x=${m}y`; }
          const n = x0 + y0, sol = solve2([1, 1, n], row2);
          same(sol[0], Q(x0), "12q03b x");
          return {
            q: `「${A}と${B}を、合わせて ${n}${c}買いました。それぞれ何${c}買ったでしょう。」この問題に、「${cond}」という条件を加えると、答えが 1つに決まる。${A}は何${c}買ったか。`,
            ans: x0,
            unit: c,
            hint: `${A}を $x$ ${c}、${B}を $y$ ${c}として、「合わせた${NOUN[c]}」の式と、加えた条件の式をつくって、連立方程式にしよう。`,
            steps: [`$x+y=${n}$ …①　加えた条件から　$${e2}$ …②`, `②を①に代入して解く　$x=${x0}$、$y=${y0}$`, `${A}は ${x0}${c}、${B}は ${y0}${c}。`],
          };
        }),
      ],
      // ───────── 4 入試レベル ─────────
      4: [
        // 12d07a ⟦x+y＝23 ; 0.2x−0.25y＝1⟧ を解く
        t("12d07a", (r) => {
          const ST = { 10: 10, 20: 5, 25: 4, 40: 5, 50: 2 };
          for (let i = 0; i < 100; i++) {
            const p = pick(r, [10, 20, 25, 40, 50]), q = pick(r, [10, 20, 25, 40, 50]);
            const x0 = ST[p] * r(1, 4), y0 = ST[q] * r(1, 4), C = (p * x0 - q * y0) / 100;
            if (C === 0 || !Number.isInteger(C) || x0 === y0) continue;
            const N = x0 + y0, sol = solve2([1, 1, N], [p, -q, 100 * C]), ask = pick(r, ["x", "y"]);
            same(sol[0], Q(x0), "12d07a x");
            return {
              q: `連立方程式 $${casesTex([`x+y=${N}`, `${round(p / 100, 2)}x-${round(q / 100, 2)}y=${C}`])}$ を解いて、$${ask}$ の値を求めよう。`,
              ans: ask === "x" ? x0 : y0,
              hint: "小数のある式は、両辺を何倍かして、係数を整数にしてから解こう。",
              steps: [`下の式の両辺に 100 をかける　$${p}x-${q}y=${100 * C}$ …③`, `①×${q}＋③　$${p + q}x=${q * N + 100 * C}$　$x=${x0}$`, `①より　$y=${N}-${x0}=${y0}$`],
            };
          }
          return { skip: true };
        }),
        // 12d07b 「割合」の式に合う問題を選ぶ
        t("12d07b", (r) => {
          const ST = { 10: 10, 20: 5, 25: 4, 40: 5, 50: 2 };
          for (let i = 0; i < 100; i++) {
            const p = pick(r, [10, 20, 25, 40, 50]), q = pick(r, [10, 20, 25, 40, 50]);
            const x0 = ST[p] * r(1, 4), y0 = ST[q] * r(1, 4), C = (p * x0 - q * y0) / 100;
            if (C === 0 || !Number.isInteger(C) || x0 === y0) continue;
            const [P, Q2, c] = pick(r, [["バラ", "チューリップ", "本"], ["コーラ", "お茶", "本"], ["あめ", "チョコレート", "個"], ["りんご", "みかん", "個"]]);
            const N = x0 + y0, noun = NOUN[c], dir = (s) => (s > 0 ? "増えた" : "減った");
            const ok = `先週売れた${P}と${Q2}は、合わせて ${N}${c}だった。今週は、先週とくらべて、${P}が ${p}％ 増え、${Q2}が ${q}％ 減って、全体で ${Math.abs(C)}${c} ${dir(C)}。`;
            const bad = [
              `先週売れた${P}と${Q2}は、合わせて ${N}${c}だった。今週は、先週とくらべて、${P}が ${p}％ 減り、${Q2}が ${q}％ 増えて、全体で ${Math.abs(C)}${c} ${dir(C)}。`,
              `先週売れた${P}と${Q2}は、合わせて ${N}${c}だった。今週は、先週とくらべて、${P}が ${p}％ 増え、${Q2}が ${q}％ 減って、全体で ${Math.abs(C)}${c} ${dir(-C)}。`,
              `先週売れた${P}と${Q2}は、合わせて ${N}${c}だった。今週売れたのは、先週の${P}の ${p}％ と、先週の${Q2}の ${q}％ で、合わせて ${Math.abs(C)}${c}だった。`,
            ];
            return {
              q: `連立方程式 $${casesTex([`x+y=${N}`, `${round(p / 100, 2)}x-${round(q / 100, 2)}y=${C}`])}$ に合う問題はどれか。（$x$ は先週売れた${P}の${noun}、$y$ は先週売れた${Q2}の${noun}）`,
              ans: ok,
              choices: choices4(r, ok, bad),
              hint: "2つ目の式の「−」は、何と何の差か。$x$ の係数、$y$ の係数の意味と、右辺の符号が、増えたことか減ったことかを見よう。",
              steps: [`$x+y=${N}$ は、先週の合計が ${N}${c}ということ。`, `$${round(p / 100, 2)}x$ は${P}の増えた${noun}、$${round(q / 100, 2)}y$ は${Q2}の減った${noun}。その差（増えた−減った）が ${C < 0 ? "−" : ""}${Math.abs(C)}${c}、つまり全体で ${Math.abs(C)}${c} ${dir(C)}。`, "この2つがそろった問題を選ぶ。"],
            };
          }
          return { skip: true };
        }),
        // 12d08a 工場：A、B の個数を求める
        t("12d08a", (r) => {
          for (let i = 0; i < 100; i++) {
            const w1 = r(2, 8), w2 = r(3, 10);
            if (w1 === w2) continue;
            const nA = r(15, 60), nB = r(15, 60);
            if (nA === nB) continue;
            const N = nA + nB, W = w1 * nA + w2 * nB, sol = solve2([1, 1, N], [w1, w2, W]), askA = r(0, 1) === 1;
            same(sol[0], Q(nA), "12d08a x");
            return {
              q: `ある工場で、製品 A と製品 B を、合わせて ${N}個つくった。A は 1個 ${w1}kg、B は 1個 ${w2}kg で、全部の重さは ${W}kg だった。製品 ${askA ? "A" : "B"} は、何個つくったか。`,
              ans: askA ? nA : nB,
              unit: "個",
              hint: "A を $x$ 個、B を $y$ 個として、「個数の合計」と「重さの合計」で式を2つつくろう。",
              steps: [`$x+y=${N}$ …①　$${w1}x+${w2}y=${W}$ …②`, `②−①${mul(w1)}　$${coefVar(w2 - w1, "y")}=${W - w1 * N}$　$y=${nB}$　①より　$x=${nA}$`, `A は ${nA}個、B は ${nB}個。`],
            };
          }
          return { skip: true };
        }),
        // 12d08b 工場：A 全部の重さを x、B 全部の重さを y として、連立方程式をつくる（式を選ぶ）
        t("12d08b", (r) => {
          for (let i = 0; i < 100; i++) {
            const w1 = r(2, 8), w2 = r(3, 10);
            if (w1 === w2) continue;
            const nA = r(15, 60), nB = r(15, 60);
            if (nA === nB) continue;
            const N = nA + nB, W = w1 * nA + w2 * nB, L = lcm(w1, w2);
            const fr = `\\frac{x}{${w1}}+\\frac{y}{${w2}}`;
            const S = (e1, e2) => `$${casesTex([e1, e2])}$`;
            const ok = S(`x+y=${W}`, `${fr}=${N}`);
            const right = [nA * w1, nB * w2];   // 正しい式の解（x、y）
            const cand = [
              [S(`x+y=${N}`, `${fr}=${W}`), [1, 1, N], [L / w1, L / w2, L * W]],         // 個数と重さの合計を取りちがえている
              [S(`x+y=${W}`, `${linTex(w1, w2, N)}`), [1, 1, W], [w1, w2, N]],              // 割るところを、かけている
              [S(`x+y=${N}`, `${linTex(w1, w2, W)}`), [1, 1, N], [w1, w2, W]],              // 個数を x、y とした式のまま
            ].filter(([, e1, e2]) => { const s = solve2(e1, e2); return !s || !(qeq(s[0], Q(right[0])) && qeq(s[1], Q(right[1]))); }).map((w) => w[0]);
            if (cand.length < 3) continue;
            return {
              q: `ある工場で、製品 A と製品 B を、合わせて ${N}個つくった。A は 1個 ${w1}kg、B は 1個 ${w2}kg で、全部の重さは ${W}kg だった。A 全部の重さを $x$ kg、B 全部の重さを $y$ kg として、連立方程式をつくる。正しいものはどれか。`,
              ans: ok,
              choices: choices4(r, ok, cand),
              hint: "$x$、$y$ は「重さ」。重さの合計の式と、個数（重さ÷1個の重さ）の合計の式をつくろう。",
              steps: [`重さの合計　$x+y=${W}$ …①`, `A の個数は $\\frac{x}{${w1}}$ 個、B の個数は $\\frac{y}{${w2}}$ 個。個数の合計　$${fr}=${N}$ …②`, "この2つを組にしたものが、連立方程式。"],
            };
          }
          return { skip: true };
        }),
        // 12q04 りんご 90円、みかん 120円、9個、950円 → 場面に合うように、代金を変える
        t("12q04", (r) => {
          const [A, B, c] = pick(r, [["りんご", "みかん", "個"], ["パン", "おにぎり", "個"], ["シール", "カード", "枚"], ["ノート", "ファイル", "冊"]]);
          const a = pick(r, [60, 70, 80, 90, 100]), step = pick(r, [30, 40, 50, 60]), b = a + step, n = r(8, 12), x0 = r(1, n - 1);
          const offs = [5, 10, 15, 20, 25].filter((o) => o < step / 2), off = pick(r, offs) * (r(0, 1) ? 1 : -1);
          const price0 = b * n - step * x0, k = price0 + off, noun = NOUN[c];
          const ask = pick(r, ["price", "A", "B"]);
          const ans = ask === "price" ? price0 : ask === "A" ? x0 : n - x0;
          return {
            q: `ゆうさんは、次の問題をつくった。「1${c} ${a}円の${A}と、1${c} ${b}円の${B}を、合わせて ${n}${c}買って、${k}円はらった。それぞれ何${c}買ったか。」このまま解くと、答えが場面に合わない。代金を、${k}円にいちばん近い金額に変えて、答えが場面に合う（${noun}が、どちらも 1以上の整数になる）問題に直す。${ask === "price" ? "直した代金は、何円か" : `直した問題の${ask === "A" ? A : B}は、何${c}か`}。`,
            ans,
            unit: ask === "price" ? "円" : c,
            hint: `${A}を $x$ ${c}とすると、${B}は何${c}か。代金を $x$ の式で表すと、何円きざみで変わるだろう。`,
            steps: [
              `${A}を $x$ ${c}とすると、${B}は $(${n}-x)$ ${c}。代金は　$${a}x+${b}(${n}-x)=${b * n}-${step}x$（円）`,
              `$x$ が整数のとき、代金は ${step}円きざみ（…、${price0 + step}、${price0}、${price0 - step}、…）。${k}円は、この中にない。`,
              `${k}円にいちばん近いのは ${price0}円（差は ${Math.abs(off)}円）。`,
              `$${b * n}-${step}x=${price0}$　より　$x=${x0}$。${A}は ${x0}${c}、${B}は ${n - x0}${c}、代金は ${price0}円。`,
            ],
          };
        }),
      ],
    },
  }),
];

// 移さなかった問題：なし（ikkan の演習プリント 8問・小テスト 4問のすべてを移した。「問題をつくる」「理由・条件を書く」は、場面を選ぶ4択・空欄の数・条件を選ぶ4択・数値入力に直した）
export const SKIPPED = [];
