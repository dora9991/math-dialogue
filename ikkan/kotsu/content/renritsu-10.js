// ============================================================
// renritsu-10.js — 連立方程式 第10時「割合の問題を、表に整理して解こう」
//   ikkan の演習プリント（renritsu-10.dr.1〜6）・小テスト（renritsu-10.qz.1〜5）を、コツコツくんのテンプレートにしたもの。
//   テンプレート id＝「10」＋ d（演習）／q（小テスト）／w（ワークシート）＋ ikkan の問題の番号（＋ 1つの問題から2つ以上つくるとき a, b…）。
//     例：10d04a ＝ renritsu-10.dr.4 の1つ目（正しい連立方程式を選ぶ）、10d04b ＝ 2つ目（先週の個数から今週の個数を求める）、10w03 ＝ ワークシートの3つ目の課題（考えよう）
//   文章題は、先月（昨年度・先週）の量や、今月の量を数で聞く。「式で表す」「連立方程式をつくる」「式のまちがいを見つける」問いは、場面に合う式を選ぶ4択に直した。
//   どの問題も、先に答え（整数の解）を決めてから、問題文の数字（合計・増減・代金など）を計算でつくる。答えは solve2 で解き直している。
//   割合の式は、ikkan と同じ \frac{20}{100}x の形（約分しない）で書く。係数が分数の式は、100 などをかけて整数にしてから解く（解説）。
// ============================================================
import { t, pick, choices4, shuffle, gcd } from "../kit.js";
import { unitFor } from "../unit-kit.js";
import { solve2, qval, qisint, casesTex, linTex } from "../algebra.js";

const unit = unitFor("renritsu");

// ── 小さな道具 ─────────────────────────────────────────
const tx = (s) => `$${s}$`;
/** 連立方程式の TeX（2式を2行にならべる） */
const sys2 = (e1, e2) => tx(casesTex([e1, e2]));
/** 整数の解 [x, y] を返す（解が決まらない・整数でないなら null） */
const solveInt = (e1, e2) => {
  const s = solve2(e1, e2);
  return s && s.every(qisint) ? s.map(qval) : null;
};
/** 「①×5」「①」（かける数が 1 なら省く） */
const times = (label, k) => (k === 1 ? label : `${label}×${k}`);
/** 「D x = R」（D が 1 なら x = R）の TeX */
const dxr = (D, R, v = "x") => (D === 1 ? `${v}=${R}` : `${D}${v}=${R}`);
/** 「D x = R」を解いた形："$3x=240$　$x=80$"（D が 1 なら "$x=240$" だけ） */
const solved = (D, R, v, val) => (D === 1 ? `$${v}=${val}$` : `$${dxr(D, R, v)}$　$${v}=${val}$`);
/** p% の TeX：\frac{20}{100} */
const pc = (p) => `\\frac{${p}}{100}`;
/** 符号つき割合の項：fterm(-4, "x", true) → -\frac{4}{100}x、fterm(6, "y", false) → +\frac{6}{100}y */
const fterm = (s, v, first) => `${s < 0 ? "-" : first ? "" : "+"}${pc(Math.abs(s))}${v}`;
/** 増減の式の TeX：\frac{20}{100}x-\frac{10}{100}y=8 */
const incdecTex = (sA, sB, net) => `${fterm(sA, "x", true)}${fterm(sB, "y", false)}=${net}`;
/** 文中の符号つきの数：＋8、−6 */
const sg = (n) => `${n > 0 ? "＋" : "−"}${Math.abs(n)}`;

// ── 「先月と今月」の場面（品A・品B、数え方、期間）──────────────────────────
//  lead(T)＝1文目（合計 T）。same＝「今月の量が同じになった」を言う文
const MIX = [
  { A: "小説", B: "図鑑", u: "冊", p0: "先月", p1: "今月", solo: (N, nm) => `ある図書室の先月の${nm}の貸し出しは ${N}冊だった。`, ask1: (nm) => `今月の${nm}の貸し出しは何冊か。`, askTot: "今月の貸し出しは、合わせて何冊か。", lead: (T) => `ある図書室の先月の貸し出しは、小説と図鑑を合わせて ${T}冊だった。`, same: "今月の貸し出し冊数は、小説と図鑑で同じになった" },
  { A: "トマト", B: "きゅうり", u: "個", p0: "先月", p1: "今月", solo: (N, nm) => `ある農園で、先月収穫した${nm}は ${N}個だった。`, ask1: (nm) => `今月収穫した${nm}は何個か。`, askTot: "今月収穫した個数は、合わせて何個か。", lead: (T) => `ある農園で、先月は、トマトときゅうりを合わせて ${T}個収穫した。`, same: "今月収穫した個数は、トマトときゅうりで同じになった" },
  { A: "おにぎり", B: "サンドイッチ", u: "個", p0: "先月", p1: "今月", solo: (N, nm) => `ある店で、先月売れた${nm}は ${N}個だった。`, ask1: (nm) => `今月売れた${nm}は何個か。`, askTot: "今月売れた個数は、合わせて何個か。", lead: (T) => `ある店で、先月は、おにぎりとサンドイッチを合わせて ${T}個売った。`, same: "今月売れた個数は、おにぎりとサンドイッチで同じになった" },
  { A: "運動部", B: "文化部", u: "人", p0: "昨年度", p1: "今年度", solo: (N, nm) => `ある中学校の昨年度の${nm}の部員は ${N}人だった。`, ask1: (nm) => `今年度の${nm}の部員は何人か。`, askTot: "今年度の部員は、合わせて何人か。", lead: (T) => `ある中学校の昨年度の部員は、運動部と文化部を合わせて ${T}人だった。`, same: "今年度の部員の人数は、運動部と文化部で同じになった" },
  { A: "大人", B: "子ども", u: "人", p0: "先月", p1: "今月", solo: (N, nm) => `ある市民プールの先月の${nm}の利用者は ${N}人だった。`, ask1: (nm) => `今月の${nm}の利用者は何人か。`, askTot: "今月の利用者は、合わせて何人か。", lead: (T) => `ある市民プールの先月の利用者は、大人と子どもを合わせて ${T}人だった。`, same: "今月の利用者の人数は、大人と子どもで同じになった" },
  { A: "牛乳", B: "お茶", u: "本", p0: "先月", p1: "今月", solo: (N, nm) => `あるスーパーで、先月売れた${nm}は ${N}本だった。`, ask1: (nm) => `今月売れた${nm}は何本か。`, askTot: "今月売れた本数は、合わせて何本か。", lead: (T) => `あるスーパーで、先月は、牛乳とお茶を合わせて ${T}本売った。`, same: "今月売れた本数は、牛乳とお茶で同じになった" },
  { A: "商品P", B: "商品Q", u: "個", p0: "先週", p1: "今週", solo: (N, nm) => `ある店で、先週売れた${nm}は ${N}個だった。`, ask1: (nm) => `今週売れた${nm}は何個か。`, askTot: "今週売れた個数は、合わせて何個か。", lead: (T) => `ある店で、先週、商品Pと商品Qを合わせて ${T}個売った。`, same: "今週売れた個数は、商品Pと商品Qで同じになった" },
];
const PCTS = [5, 10, 15, 20, 25, 30, 40];

/** 2つの量の増減を言う文：「今月は、先月とくらべて、小説が 20% 増え、図鑑が 10% 減って、合わせて 8冊増えた。」sA・sB は符号つき% */
const changeText = (m, sA, sB, net) =>
  `${m.p1}は、${m.p0}とくらべて、${m.A}が ${Math.abs(sA)}% ${sA > 0 ? "増え" : "減り"}、${m.B}が ${Math.abs(sB)}% ${sB > 0 ? "増えて" : "減って"}、合わせて ${Math.abs(net)}${m.u}${net > 0 ? "増えた" : "減った"}。`;

/** 先月の量 x, y（x·|sA|/100、y·|sB|/100 が整数）。一方が増え、一方が減る。割合はちがう。合計の増減 net ≠ 0（|net| ≤ 40）。upFirst＝品Aが増える側に決める */
function mixScene(r, upFirst) {
  const m = pick(r, MIX);
  for (let i = 0; i < 80; i++) {
    const pA = pick(r, PCTS), pB = pick(r, PCTS);
    if (pA === pB) continue;
    const up = upFirst === undefined ? r(0, 1) === 0 : upFirst;
    const sA = up ? pA : -pA, sB = up ? -pB : pB;
    const xs = [], ys = [];
    for (let v = 30; v <= 300; v += 10) { if ((v * pA) % 100 === 0) xs.push(v); if ((v * pB) % 100 === 0) ys.push(v); }
    const x = pick(r, xs), y = pick(r, ys);
    const net = (sA * x + sB * y) / 100;
    if (net === 0 || Math.abs(net) > 40 || x + y > 600 || x === y) continue;
    return { m, T: x + y, x, y, sA, sB, net };
  }
  return null;
}

/** 増減の連立方程式を解く解説（3行）：①x+y=T、②増減の式、③整数にした式、加減法。nameA・nameB・u・p0 は文に出す名前 */
function mixSteps({ nameA, nameB, u, p0, T, x, y, sA, sB, net, intro = "" }) {
  const g = gcd(100, gcd(Math.abs(sA), Math.abs(sB))), k = 100 / g, a = sA / g, b = sB / g, c = net * k;
  const line1 = `${intro}${p0}の${nameA}を $x$ ${u}、${nameB}を $y$ ${u}とする。　$x+y=${T}$ …①　　$${incdecTex(sA, sB, net)}$ …②`;
  const line2 = `②×${k}　$${linTex(a, b, c)}$ …③`;
  // 符号が逆なので、負の係数の文字を ①×|係数| で消す
  const line3 = a > 0
    ? `③+${times("①", -b)}　${solved(a - b, c - b * T, "x", x)}　① に代入　$y=${T}-${x}=${y}$`
    : `③+${times("①", -a)}　${solved(b - a, c - a * T, "y", y)}　① に代入　$x=${T}-${y}=${x}$`;
  return [line1, line2, line3];
}

// ── 10d01・10q01：式で表す（4択）──────────────────────────
const NOUN = { 個: "個数", 人: "人数", 本: "本数", 冊: "冊数" };
const PCT_KIND = {
  of: { us: ["人", "円", "個", "本", "冊"], num: (p) => p, ask: (v, p, u) => `$${v}$ ${u}の ${p}% は、何${u}か。`, why: (p) => `${p}% は分数で $\\frac{${p}}{100}$。もとの量にかける。`, hint: (v, p) => `${p}% は、分数で表すとどうなるかな。それを、もとの量 $${v}$ にどう使えばよいかな。` },
  off: { us: ["円"], num: (p) => 100 - p, ask: (v, p) => `$${v}$ 円の ${p}%引きの値段は、何円か。`, why: (p) => `${p}%引きは、もとの値段の ${100 - p}% になる。`, hint: (v, p) => `${p}%引きの値段は、もとの値段の何%になるかな。` },
  up: { us: ["個", "人", "本", "冊"], num: (p) => 100 + p, ask: (v, p, u) => `$${v}$ ${u}の ${p}%増の${NOUN[u]}は、何${u}か。`, why: (p) => `${p}%増えたあとは、もとの量の ${100 + p}% になる。`, hint: (v, p) => `${p}%増えると、もとの量の何%になるかな。` },
  down: { us: ["個", "人", "本", "冊"], num: (p) => 100 - p, ask: (v, p, u) => `$${v}$ ${u}の ${p}%減の${NOUN[u]}は、何${u}か。`, why: (p) => `${p}%減ったあとは、もとの量の ${100 - p}% になる。`, hint: (v, p) => `${p}%減ると、もとの量の何%になるかな。` },
};
function pctProblem(r, kinds, ps) {
  const kind = pick(r, kinds), K = PCT_KIND[kind], p = pick(r, kind === "of" ? ps : ps.filter((n) => n <= 45)), v = pick(r, ["x", "y"]), u = pick(r, K.us);
  const num = K.num(p);
  const ok = tx(`${pc(num)}${v}`);
  // ありがちな誤答：ほかの割合をつかう・100でわるのを忘れる
  const others = [p, 100 - p, 100 + p].filter((n) => n !== num);
  const wrongs = [...others.map((n) => tx(`${pc(n)}${v}`)), tx(kind === "of" ? `${p}${v}` : `${num}${v}`)];
  return {
    q: `${K.ask(v, p, u)}$${v}$ を使った式で表すと？`,
    ans: ok,
    choices: choices4(r, ok, shuffle(r, wrongs)),
    hint: K.hint(v, p),
    steps: [K.why(p), `$${v}\\times ${pc(num)}=${pc(num)}${v}$（${u}）`],
  };
}

// ── 10d05 の数字：昨年度の x 人・y 人。第1群が s1％、第2群が s2％（符号つき、逆の符号）変わり、全体では q％ 変わる（整数、|q| ≤ 9、q≠0）──
//   増減の人数 x·|s1|/100、y·|s2|/100 が整数
const TOTAL = [];
for (const T of [200, 300, 400, 500, 600, 800, 1000, 1200]) for (let x = 50; x < T; x += 50) {
  const y = T - x;
  for (let pA = 1; pA <= 10; pA++) for (let pB = 1; pB <= 10; pB++) {
    if (pA === pB || (x * pA) % 100 !== 0 || (y * pB) % 100 !== 0) continue;
    for (const dir of [1, -1]) {
      const s1 = -dir * pA, s2 = dir * pB, num = s1 * x + s2 * y;
      if (num % T !== 0) continue;
      const q = num / T;
      if (q !== 0 && Math.abs(q) <= 9 && x !== y) TOTAL.push({ T, x, y, s1, s2, q });
    }
  }
}

// ── 10d06 の数字：先月の x・y。第1群が s1％、第2群が s2％（逆の符号）変わって、今月の量が等しい：(100+s1)x ＝ (100+s2)y ──
//   a x ＝ b y（a・b は互いに素）。x : y ＝ b : a
const EQUAL = [];
for (const pA of [5, 10, 15, 20, 25, 30]) for (const pB of [5, 10, 15, 20, 25, 30]) for (const dir of [1, -1]) {
  const s1 = -dir * pA, s2 = dir * pB, g = gcd(100 + s1, 100 + s2), a = (100 + s1) / g, b = (100 + s2) / g;
  for (let k = 1; k <= 60; k++) {
    const x = k * b, y = k * a, T = x + y;
    if (T < 200 || T > 900 || x === y) continue;
    if ((x * pA) % 100 !== 0 || (y * pB) % 100 !== 0) continue;
    EQUAL.push({ s1, s2, x, y, T, a, b });
  }
}

export const UNITS = [
  unit("10", {
    name: "割合の問題（連立方程式の利用）",
    desc: "％の増減を、表に整理して式を2つつくる",
    prereqs: ["J2-rk09", "J1-e2"],
    points: [
      "$x$ の $a\\%$ は $\\frac{a}{100}x$。$a\\%$ 増えたあとの量は $\\frac{100+a}{100}x$、$a\\%$ 減ったあとの量は $\\frac{100-a}{100}x$。",
      "割合の問題は、もとにする量を文字でおき、表に整理して、式を2つつくる。増えた量・減った量の式と、あとの量の式を、まちがえないようにする。",
      "係数に分数があるときは、両辺に 10 や 100 などをかけて整数にしてから、加減法で解く。解が、人数・個数として合うか（自然数か）も、確かめる。",
    ],
    levels: {
      // ───────── 1 基礎 ─────────
      1: [
        // 10d01 x 人の 30％、x 円の 20％引き、x 個の 10％増、y 本の 5％減 を式で表す（4択）
        t("10d01", (r) => pctProblem(r, ["of", "off", "up", "down"], [5, 10, 15, 20, 25, 30, 35, 40, 45, 60, 70])),
        // 10d02 図書室：小説が 20％増え、図鑑が 10％減って、合わせて 8冊増えた → 先月の冊数
        t("10d02", (r) => {
          const s = mixScene(r);
          if (!s) return { skip: true };
          const { m, T, x, y, sA, sB, net } = s;
          const sol = solveInt([1, 1, T], [sA, sB, 100 * net]);
          if (!sol || sol[0] !== x || sol[1] !== y) return { skip: true };
          const askA = r(0, 1) === 0, ask = askA ? m.A : m.B;
          const dx = (x * sA) / 100, dy = (y * sB) / 100;
          return {
            q: `${m.lead(T)}${changeText(m, sA, sB, net)}${m.p0}の${ask}は何${m.u}だったか。${m.p0}の${m.A}を $x$ ${m.u}、${m.B}を $y$ ${m.u}として、連立方程式で求めよう。`,
            ans: askA ? x : y,
            unit: m.u,
            hint: "増えた量と減った量は、それぞれ $x$、$y$ と割合で、どう表せるかな。合わせた増減は？",
            steps: [
              ...mixSteps({ nameA: m.A, nameB: m.B, u: m.u, p0: m.p0, T, x, y, sA, sB, net }),
              `確かめ　$${x}+${y}=${T}$、増減は ${sg(dx)}${m.u}と ${sg(dy)}${m.u}で、合わせて ${sg(net)}${m.u}。${m.p0}の${m.A}は ${x}${m.u}、${m.B}は ${y}${m.u}。`,
            ],
          };
        }),
        // 10q01 x 円の 20％引きの値段、y 人の 15％増の人数
        t("10q01", (r) => pctProblem(r, ["off", "up", "down"], [5, 10, 15, 20, 25, 30, 35, 40, 45])),
        // 10q04 今月収穫したトマトは何個か（先月の個数と増減の割合から）
        t("10q04", (r) => {
          const m = pick(r, MIX), nm = pick(r, [m.A, m.B]), p = pick(r, [5, 10, 15, 20, 25, 30, 40]), up = r(0, 1) === 0;
          const cand = [];
          for (let N = 40; N <= 400; N += 10) if ((N * p) % 100 === 0) cand.push(N);
          const N = pick(r, cand), num = up ? 100 + p : 100 - p, ans = (N * num) / 100;
          return {
            q: `${m.solo(N, nm)}${m.p1}は、${m.p0}とくらべて ${p}% ${up ? "増えた" : "減った"}。${m.ask1(nm)}`,
            ans,
            unit: m.u,
            hint: `${p}%${up ? "増える" : "減る"}と、${m.p0}の量の何%になるかな。`,
            steps: [`${m.p1}は、${m.p0}の ${num}% になる。`, `$${N}\\times ${pc(num)}=${ans}$（${m.u}）`],
          };
        }),
      ],
      // ───────── 2 標準 ─────────
      2: [
        // 10d03 リュックとくつ：それぞれ 20％引き・30％引き → 定価
        t("10d03", (r) => {
          const S = pick(r, [
            { A: "リュック", B: "くつ" }, { A: "シャツ", B: "ズボン" }, { A: "ジャケット", B: "ぼうし" }, { A: "かばん", B: "スニーカー" },
          ]);
          const pA = pick(r, [10, 20, 25, 30, 40]), pB = pick(r, [10, 20, 25, 30, 40]);
          if (pA === pB) return { skip: true };
          const x = 500 * r(2, 10), y = 500 * r(2, 10);
          if (x === y) return { skip: true };
          const T = x + y, M = (x * (100 - pA)) / 100 + (y * (100 - pB)) / 100;
          const g = gcd(100, gcd(100 - pA, 100 - pB)), k = 100 / g, a = (100 - pA) / g, b = (100 - pB) / g;
          const sol = solveInt([1, 1, T], [100 - pA, 100 - pB, 100 * M]);
          if (!sol || sol[0] !== x || sol[1] !== y) return { skip: true };
          const askA = r(0, 1) === 0, ask = askA ? S.A : S.B;
          const elim = a > b
            ? `③−${times("①", b)}　${solved(a - b, k * M - b * T, "x", x)}　① に代入　$y=${T}-${x}=${y}$`
            : `③−${times("①", a)}　${solved(b - a, k * M - a * T, "y", y)}　① に代入　$x=${T}-${y}=${x}$`;
          return {
            q: `${S.A}と${S.B}を買う。定価の合計は ${T}円だが、${S.A}は定価の ${pA}%引き、${S.B}は定価の ${pB}%引きになっていたので、代金の合計は ${M}円だった。${ask}の定価は何円か。${S.A}の定価を $x$ 円、${S.B}の定価を $y$ 円として、連立方程式で求めよう。`,
            ans: askA ? x : y,
            unit: "円",
            hint: `定価の合計の式と、実際に払った代金の式をつくろう。${pA}%引きの代金は、定価の何%かな。`,
            steps: [
              `${S.A}の定価を $x$ 円、${S.B}の定価を $y$ 円とする。　$x+y=${T}$ …①　　$${pc(100 - pA)}x+${pc(100 - pB)}y=${M}$ …②`,
              `②×${k}　$${linTex(a, b, k * M)}$ …③`,
              elim,
              `確かめ　$${x}\\times ${pc(100 - pA)}+${y}\\times ${pc(100 - pB)}=${(x * (100 - pA)) / 100}+${(y * (100 - pB)) / 100}=${M}$。${S.A} ${x}円、${S.B} ${y}円。`,
            ],
          };
        }),
        // 10q02 連立方程式をつくろう（4択）
        t("10q02", (r) => {
          const s = mixScene(r, true);
          if (!s) return { skip: true };
          const { m, T, x, y, sA, sB, net } = s, pA = sA, pB = -sB;
          const ok = sys2(`x+y=${T}`, incdecTex(sA, sB, net));
          const wrongs = shuffle(r, [
            sys2(`x+y=${T}`, `${pc(100 + pA)}x+${pc(100 - pB)}y=${net}`),    // 今月の個数と増減をイコールにしてしまう
            sys2(`x+y=${T}`, `${pc(pA)}x+${pc(pB)}y=${net}`),                // 減った量の符号がちがう
            sys2(`x+y=${T}`, `${pc(pB)}x-${pc(pA)}y=${net}`),                // 割合を入れちがえる
            sys2(`x+y=${net}`, `${pc(pA)}x-${pc(pB)}y=${T}`),                // 右辺を入れちがえる
          ]);
          return {
            q: `${m.lead(T)}${changeText(m, sA, sB, net)}${m.p0}の${m.A}を $x$ ${m.u}、${m.B}を $y$ ${m.u}とするとき、この場面を表す連立方程式は、どれか。`,
            ans: ok,
            choices: choices4(r, ok, wrongs),
            hint: "先月の合計のほかに、全体の増減についての式がいる。増えた分と減った分から、全体の増減はどう表せるかな。",
            steps: [
              `先月の合計が ${T}${m.u}だから　$x+y=${T}$ …①`,
              `${m.A}が ${pA}% 増えた分は $${pc(pA)}x$、${m.B}が ${pB}% 減った分は $${pc(pB)}y$。`,
              `増えた分 − 減った分 ＝ 全体の増減（${sg(net)}${m.u}）だから　$${incdecTex(sA, sB, net)}$ …②`,
              `連立方程式は　${ok}`,
            ],
          };
        }),
        // 10q03 （2）の連立方程式を解こう（係数が分数）
        t("10q03", (r) => {
          const s = mixScene(r);
          if (!s) return { skip: true };
          const { m, T, x, y, sA, sB, net } = s;
          const sol = solveInt([1, 1, T], [sA, sB, 100 * net]);
          if (!sol || sol[0] !== x || sol[1] !== y) return { skip: true };
          const askX = r(0, 1) === 0, v = askX ? "x" : "y";
          const st = mixSteps({ nameA: "", nameB: "", u: "", p0: "", T, x, y, sA, sB, net });
          return {
            q: `連立方程式 ${sys2(`x+y=${T}`, incdecTex(sA, sB, net))} を解いたとき、$${v}$ の値は？`,
            ans: askX ? x : y,
            hint: "②の分数を、全体に同じ数（分母をなくせる数）をかけて、整数にしてから、加減法で解こう。",
            steps: [
              `$x+y=${T}$ …①　　$${incdecTex(sA, sB, net)}$ …②`,
              st[1],
              st[2],
              `確かめ　$${x}+${y}=${T}$。解は $x=${x}$、$y=${y}$。$${v}$ の値は ${askX ? x : y}。`,
            ],
          };
        }),
        // 10w03 考えよう：先月の A の量を変えたときの、今月の全体の量（割合は、A が増える分と B が減る分で同じ）
        t("10w03", (r) => {
          const m = pick(r, MIX), T = pick(r, [200, 250, 300, 350, 400, 450, 500, 600]), p = pick(r, [10, 20, 30, 40]);
          const xs = [];
          for (let v = 50; v < T; v += 50) xs.push(v);
          const x = pick(r, xs), y = T - x, x1 = (x * (100 + p)) / 100, y1 = (y * (100 - p)) / 100, ans = x1 + y1;
          const cmp = ans > T ? `${m.p0}より ${ans - T}${m.u}増えた。` : ans < T ? `${m.p0}より ${T - ans}${m.u}減った。` : `${m.p0}と変わらない。`;
          return {
            q: `${m.lead(T)}${m.p1}は、${m.A}が ${p}% 増え、${m.B}が ${p}% 減った。${m.p0}の${m.A}が ${x}${m.u}だったとき、${m.askTot}`,
            ans,
            unit: m.u,
            hint: `${m.p0}の${m.B}は何${m.u}かな。${m.p1}の${m.A}と${m.B}は、それぞれ${m.p0}の何%になったかな。`,
            steps: [
              `${m.p0}の${m.B}は $${T}-${x}=${y}$（${m.u}）。`,
              `${m.p1}の${m.A}は $${x}\\times ${pc(100 + p)}=${x1}$（${m.u}）、${m.B}は $${y}\\times ${pc(100 - p)}=${y1}$（${m.u}）。`,
              `合わせて $${x1}+${y1}=${ans}$（${m.u}）。${cmp}`,
            ],
          };
        }),
      ],
      // ───────── 3 応用 ─────────
      3: [
        // 10d04a A さん・B さんの式：どちらの式が場面を正しく表しているか（4択）
        t("10d04a", (r) => {
          const s = mixScene(r, true);
          if (!s) return { skip: true };
          const { m, T, sA, sB, net } = s, pA = sA, pB = -sB, after = T + net;
          // 式の種類：good＝場面を正しく表している。why＝解説の一言
          const KIND = {
            inc: { good: true, e: [`x+y=${T}`, incdecTex(sA, sB, net)], why: "「増えた分 − 減った分 ＝ 全体の増減」の形になっていて、正しい。" },
            aft: { good: true, e: [`x+y=${T}`, `${pc(100 + pA)}x+${pc(100 - pB)}y=${after}`], why: `「${m.p1}の量 ＝ ${m.p0}の合計 ＋ 増減 ＝ ${after}」の形になっていて、正しい。` },
            mix: { good: false, e: [`x+y=${T}`, `${pc(100 + pA)}x+${pc(100 - pB)}y=${net}`], why: `左辺は「${m.p1}の量」なのに、右辺の ${Math.abs(net)} は「増減した量」で、そろっていない。` },
            sgn: { good: false, e: [`x+y=${T}`, `${pc(pA)}x+${pc(pB)}y=${net}`], why: `${m.B}は減るのに、減った分をたしてしまっている。` },
            swp: { good: false, e: [`x+y=${T}`, `${pc(pB)}x-${pc(pA)}y=${net}`], why: `割合が入れちがっている（${m.A}が ${pA}% 増え、${m.B}が ${pB}% 減る）。` },
            rhs: { good: false, e: [`x+y=${net}`, `${pc(pA)}x-${pc(pB)}y=${T}`], why: `右辺が入れちがっている（${m.p0}の合計は ${T}${m.u}）。` },
          };
          const GOOD = ["inc", "aft"], BAD = ["mix", "sgn", "swp", "rhs"];
          const out = pick(r, ["A", "B", "both", "none"]);
          let kA, kB;
          if (out === "A") { kA = pick(r, GOOD); kB = pick(r, BAD); }
          else if (out === "B") { kB = pick(r, GOOD); kA = pick(r, BAD); }
          else if (out === "both") { kA = pick(r, GOOD); kB = GOOD.find((g) => g !== kA); }
          else { [kA, kB] = shuffle(r, BAD).slice(0, 2); }
          const LABEL = { A: "A さんだけ", B: "B さんだけ", both: "2人とも正しい", none: "2人ともまちがい" };
          const ok = LABEL[out];
          return {
            q: `${m.lead(T)}${changeText(m, sA, sB, net)}${m.p0}の${m.A}を $x$ ${m.u}、${m.B}を $y$ ${m.u}として、A さんと B さんが連立方程式をつくった。A さん ${sys2(...KIND[kA].e)}　B さん ${sys2(...KIND[kB].e)}　場面を正しく表しているのは、だれの式か。`,
            ans: ok,
            choices: choices4(r, ok, Object.values(LABEL).filter((l) => l !== ok)),
            hint: `それぞれの②は、左辺と右辺が同じ種類の量（どちらも増減、またはどちらも${m.p1}の量）になっているかな。①の右辺や、割合・符号もたしかめよう。`,
            steps: [
              `A さんの式：${KIND[kA].why}`,
              `B さんの式：${KIND[kB].why}`,
              `${m.p0}の合計は ${T}${m.u}、増減は ${sg(net)}${m.u}だから、${m.p1}の合計は ${after}${m.u}。`,
              `したがって、正しいのは「${ok}」。`,
            ],
          };
        }),
        // 10d04b 先週売れた P、Q の個数を求めよう → 今週売れた個数
        t("10d04b", (r) => {
          const s = mixScene(r, r(0, 1) === 0);
          if (!s) return { skip: true };
          const { m, T, x, y, sA, sB, net } = s;
          const sol = solveInt([1, 1, T], [sA, sB, 100 * net]);
          if (!sol || sol[0] !== x || sol[1] !== y) return { skip: true };
          const askA = r(0, 1) === 0, ask = askA ? m.A : m.B, s1 = askA ? sA : sB, v0 = askA ? x : y, ans = (v0 * (100 + s1)) / 100;
          return {
            q: `${m.lead(T)}${changeText(m, sA, sB, net)}${m.p1}の${ask}は何${m.u}か。${m.p0}の${m.A}を $x$ ${m.u}、${m.B}を $y$ ${m.u}として、連立方程式で求めよう。`,
            ans,
            unit: m.u,
            hint: `まず、${m.p0}の量（$x$、$y$）を求めよう。${m.p1}の量は、${m.p0}の量に、増減の割合を使って求める。`,
            steps: [
              ...mixSteps({ nameA: m.A, nameB: m.B, u: m.u, p0: m.p0, T, x, y, sA, sB, net }),
              `${m.p0}の${ask}は ${v0}${m.u}。${m.p1}は $${v0}\\times ${pc(100 + s1)}=${ans}$（${m.u}）。`,
            ],
          };
        }),
      ],
      // ───────── 4 入試レベル ─────────
      4: [
        // 10d05 全体では q％ 増えた → 今年度の男子・女子
        t("10d05", (r) => {
          const c = pick(r, TOTAL), { T, x, y, s1, s2, q } = c;
          const W = pick(r, [
            { G1: "男子", G2: "女子", lead: `ある中学校の昨年度の生徒数は、男女合わせて ${T}人だった。`, p0: "昨年度", p1: "今年度" },
            { G1: "大人", G2: "子ども", lead: `ある市民プールの先月の利用者は、大人と子どもを合わせて ${T}人だった。`, p0: "先月", p1: "今月" },
          ]);
          const net = (q * T) / 100;
          const sol = solveInt([1, 1, T], [s1, s2, 100 * net]);
          if (!sol || sol[0] !== x || sol[1] !== y) return { skip: true };
          const x1 = (x * (100 + s1)) / 100, y1 = (y * (100 + s2)) / 100;
          const askA = r(0, 1) === 0, ask = askA ? W.G1 : W.G2;
          return {
            q: `${W.lead}${W.p1}は、${W.p0}とくらべて、${W.G1}が ${Math.abs(s1)}% ${s1 > 0 ? "増え" : "減り"}、${W.G2}が ${Math.abs(s2)}% ${s2 > 0 ? "増えて" : "減って"}、全体では ${Math.abs(q)}% ${q > 0 ? "増えた" : "減った"}。${W.p1}の${ask}は何人か。${W.p0}の${W.G1}を $x$ 人、${W.G2}を $y$ 人として、連立方程式で求めよう。`,
            ans: askA ? x1 : y1,
            unit: "人",
            hint: `全体の ${Math.abs(q)}% の増減は、何人の増減かな。その人数が、${W.G1}の増減と${W.G2}の増減の合計になる。`,
            steps: [
              ...mixSteps({ nameA: W.G1, nameB: W.G2, u: "人", p0: W.p0, T, x, y, sA: s1, sB: s2, net, intro: `全体の ${Math.abs(q)}% の${q > 0 ? "増加" : "減少"}は $${T}\\times ${pc(Math.abs(q))}=${Math.abs(net)}$（人）。` }),
              `${W.p0}は ${W.G1} ${x}人、${W.G2} ${y}人。${W.p1}は　${W.G1} $${x}\\times ${pc(100 + s1)}=${x1}$（人）、${W.G2} $${y}\\times ${pc(100 + s2)}=${y1}$（人）。`,
            ],
          };
        }),
        // 10d06 牛乳 10％減、お茶 10％増で、今月の本数が同じ → 先月の本数
        t("10d06", (r) => {
          const c = pick(r, EQUAL), { s1, s2, x, y, T, a, b } = c, m = pick(r, MIX);
          const g = gcd(100 + s1, 100 + s2);
          const sol = solveInt([1, 1, T], [100 + s1, -(100 + s2), 0]);
          if (!sol || sol[0] !== x || sol[1] !== y) return { skip: true };
          const askA = r(0, 1) === 0, ask = askA ? m.A : m.B, x1 = (x * (100 + s1)) / 100;
          return {
            q: `${m.lead(T)}${m.p1}は、${m.p0}とくらべて、${m.A}が ${Math.abs(s1)}% ${s1 > 0 ? "増え" : "減り"}、${m.B}が ${Math.abs(s2)}% ${s2 > 0 ? "増えて" : "減って"}、${m.same}。${m.p0}の${ask}は何${m.u}か。${m.p0}の${m.A}を $x$ ${m.u}、${m.B}を $y$ ${m.u}として、連立方程式で求めよう。`,
            ans: askA ? x : y,
            unit: m.u,
            hint: `${m.p1}の${m.A}の量と${m.B}の量は、どう表せるかな。それが等しい、という式をつくろう。`,
            steps: [
              `${m.p0}の${m.A}を $x$ ${m.u}、${m.B}を $y$ ${m.u}とする。　$x+y=${T}$ …①　　${m.p1}の量が等しいから　$${pc(100 + s1)}x=${pc(100 + s2)}y$ …②`,
              `②の両辺に 100 をかけて${g === 1 ? "" : `、さらに ${g} でわる`}　$${a}x=${b}y$　$${linTex(a, -b, 0)}$ …③`,
              `${times("①", b)}+③　${solved(a + b, b * T, "x", x)}　① に代入　$y=${T}-${x}=${y}$`,
              `確かめ　${m.p1}は　$${x}\\times ${pc(100 + s1)}=${x1}$、$${y}\\times ${pc(100 + s2)}=${x1}$ で等しい。${m.p0}の${m.A}は ${x}${m.u}、${m.B}は ${y}${m.u}。`,
            ],
          };
        }),
        // 10q05 チャレンジ：セーターは 25％引き、マフラーは 100円引き
        t("10q05", (r) => {
          const S = pick(r, [
            { A: "セーター", B: "マフラー" }, { A: "ジャケット", B: "ネクタイ" }, { A: "くつ", B: "ぼうし" }, { A: "コート", B: "手ぶくろ" },
          ]);
          const p = pick(r, [10, 20, 25, 30, 40]), c = pick(r, [50, 100, 200, 300]);
          const x = 100 * r(8, 30), y = 100 * r(3, 15);
          if (y <= c || x === y) return { skip: true };
          const T = x + y, M = (x * (100 - p)) / 100 + (y - c);
          const sol = solveInt([1, 1, T], [100 - p, 100, 100 * (M + c)]);
          if (!sol || sol[0] !== x || sol[1] !== y) return { skip: true };
          const g = gcd(100 - p, 100), a = (100 - p) / g, b = 100 / g, R = (M + c) * b;   // ④：a x + b y ＝ R
          const askA = r(0, 1) === 0, ask = askA ? S.A : S.B;
          return {
            q: `ある店で、${S.A}と${S.B}を買う。定価の合計は ${T}円で、${S.A}は定価の ${p}%引き、${S.B}は定価から ${c}円引きで売られていたので、代金の合計は ${M}円だった。${ask}の定価は何円か。${S.A}の定価を $x$ 円、${S.B}の定価を $y$ 円として、求めよう。`,
            ans: askA ? x : y,
            unit: "円",
            hint: `${S.B}の代金は、定価から ${c}円ひいた金額。${S.A}の代金は、定価の何%かな。`,
            steps: [
              `${S.A}の定価を $x$ 円、${S.B}の定価を $y$ 円とする。　$x+y=${T}$ …①　　$${pc(100 - p)}x+(y-${c})=${M}$ …②`,
              `② を整理　$${pc(100 - p)}x+y=${M + c}$ …③　　③×${b}　$${linTex(a, b, R)}$ …④`,
              `④−${times("①", a)}　${solved(b - a, R - a * T, "y", y)}　① に代入　$x=${T}-${y}=${x}$`,
              `確かめ　$${x}\\times ${pc(100 - p)}+(${y}-${c})=${(x * (100 - p)) / 100}+${y - c}=${M}$。${S.A} ${x}円、${S.B} ${y}円。`,
            ],
          };
        }),
      ],
    },
  }),
];

// 移さなかった問題（記述・説明・図が必要など、コツコツくんの入力形式で答えられないもの）
export const SKIPPED = [];   // 第10時は、演習プリント 6問・小テスト 5問のすべてを移した（式を選ぶ問いは4択、解く問いは数で聞く。「わけを説明」は、まちがっている式を選ぶ4択に直した）
