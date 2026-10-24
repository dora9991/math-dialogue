// ============================================================
// renritsu-08.js — 連立方程式 第8時「代金と個数の問題を、連立方程式をつくって解こう」
//   ikkan の演習プリント（renritsu-08.dr.1〜7）・小テスト（renritsu-08.qz.1〜5）を、コツコツくんのテンプレートにしたもの。
//   テンプレート id＝「08」＋ d（演習）／q（小テスト）／w（ワークシート）＋ ikkan の問題の番号（＋ 1つの問題から2つ以上つくるとき a, b…）。
//     例：08d01a ＝ renritsu-08.dr.1 の1つ目、08q03 ＝ renritsu-08.qz.3、08w03 ＝ ワークシートの3つ目の課題（考えよう）
//   文章題は、解の個数・値段・数を数で聞く。「式をつくる」問いは、場面に合う式（連立方程式）を選ぶ4択に直した。
//   どの問題も、先に答え（整数の解）を決めてから、問題文の数字（合計・代金など）を計算でつくる。答えは solve2 で解き直している。
// ============================================================
import { t, pick, choices4, shuffle, gcd, round } from "../kit.js";
import { unitFor } from "../unit-kit.js";
import { solve2, qval, qisint, casesTex, linTex, poly, ptex, peq, term } from "../algebra.js";

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
/** 「3\times 80」（1 なら 80） */
const mulTex = (k, n) => (k === 1 ? String(n) : `${k}\\times ${n}`);
/** 「y」「3y」（係数 1 を省く） */
const coef = (k, v) => (k === 1 ? v : `${k}${v}`);

/** a1x+b1y=c1 …①、a2x+b2y=c2 …② から y を消す（b1, b2 は正の整数）。{ line:"①×5−②", D, R }（D x = R、D > 0）。a1b2−a2b1 ≠ 0 */
function elimY(a1, b1, c1, a2, b2, c2) {
  const g = gcd(b1, b2), m1 = b2 / g, m2 = b1 / g;
  const D = a1 * m1 - a2 * m2, R = c1 * m1 - c2 * m2;
  return D > 0
    ? { line: `${times("①", m1)}−${times("②", m2)}`, D, R }
    : { line: `${times("②", m2)}−${times("①", m1)}`, D: -D, R: -R };
}

// ── 買い物の場面（品A・品B、1つの値段、数え方）──────────────────────────
//  pa の値は、どれも pb の値より小さい（②−①×pa で消すので、pb−pa が正になるように）
const BUY = [
  { a: "折り紙", b: "画用紙", c: "枚", pa: [40, 50, 60, 70, 80, 90], pb: [100, 110, 120, 130, 150, 180] },
  { a: "鉛筆", b: "ボールペン", c: "本", pa: [40, 50, 60, 70, 80], pb: [100, 110, 120, 130, 150] },
  { a: "りんご", b: "なし", c: "個", pa: [80, 90, 100, 110, 120], pb: [130, 140, 150, 160, 180] },
  { a: "ノート", b: "ファイル", c: "冊", pa: [90, 100, 110, 120, 130], pb: [150, 170, 180, 200, 220] },
  { a: "おにぎり", b: "サンドイッチ", c: "個", pa: [100, 110, 120, 130], pb: [200, 220, 250, 280] },
  { a: "クッキー", b: "ドーナツ", c: "個", pa: [60, 70, 80, 90], pb: [120, 130, 140, 150] },
];
/** 品A を x 個、品B を y 個（x ≠ y）買った場面 */
function buyScene(r) {
  const s = pick(r, BUY), pa = pick(r, s.pa), pb = pick(r, s.pb);
  const x = r(3, 12);
  let y = r(3, 12);
  if (y === x) y = x === 12 ? 11 : x + 1;
  return { ...s, pa, pb, x, y, n: x + y, M: pa * x + pb * y };
}

// 屋台・店で、合わせて何個（つ）買う場面（個数の式と代金の式を立てる・確かめる問題用）。数え方は、品ごとにちがってよい
const STALL = [
  { place: "文化祭の屋台で", a: "たこ焼き", ca: "パック", b: "焼きそば", cb: "皿", pa: [250, 300, 350, 400], pb: [200, 250, 300, 350, 450] },
  { place: "ある店で", a: "ケーキ", ca: "個", b: "プリン", cb: "個", pa: [300, 350, 400, 450], pb: [150, 200, 250] },
  { place: "ある店で", a: "コーヒー", ca: "杯", b: "紅茶", cb: "杯", pa: [250, 300, 350, 400], pb: [150, 200, 450] },
  { place: "ある店で", a: "ハンバーガー", ca: "個", b: "ポテト", cb: "袋", pa: [250, 300, 350, 400], pb: [150, 200, 450] },
];
/** 品A を x 個、品B を y 個（x ≠ y、値段は ちがう）買った場面。条件に合わなければ null。tc＝合わせた数の数え方（数え方が同じならそれ、ちがえば「品」） */
function stallScene(r) {
  const s = pick(r, STALL), pa = pick(r, s.pa), pb = pick(r, s.pb);
  const x = r(2, 9), y = r(2, 9);
  if (x === y || pa === pb) return null;
  return { ...s, pa, pb, x, y, n: x + y, M: pa * x + pb * y, tc: s.ca === s.cb ? s.ca : "品" };
}

// ── 08d06 の数字：a 個ずつ配ると e1（＋あまる／−たりない）、b 個ずつ配ると e2。 y ＝ a x + e1 ＝ b x + e2 ─────────
//   classic＝「たりない／あまる」（どちらも人数より少ない数）。same＝どちらもあまる／どちらもたりない
const DIST = [];
for (let a = 4; a <= 9; a++) for (let dd = 1; dd <= 3; dd++) {
  const b = a - dd;
  if (b < 2) continue;
  for (let x = 6; x <= 20; x++) for (let e1 = -20; e1 <= 20; e1++) {
    const e2 = e1 + dd * x;
    if (e1 === 0 || e2 === 0 || Math.abs(e2) > 20) continue;
    const classic = e1 < 0 && e2 > 0;
    if (classic && (-e1 >= x || e2 >= x)) continue;
    DIST.push({ a, b, x, e1, e2, classic });
  }
}
const DIST_CLASSIC = DIST.filter((d) => d.classic), DIST_SAME = DIST.filter((d) => !d.classic);

// ── 08q05 の数字：入れかえた数 ＝ k×(もとの数) ＋ d（d≠0、|d| ≤ 40）になる、十の位 x・一の位 y ─────────
const CHALLENGE = [];
for (const k of [2, 3, 4, 5]) for (let x = 1; x <= 9; x++) for (let y = 1; y <= 9; y++) {
  if (x === y) continue;
  const d = (10 * y + x) - k * (10 * x + y);
  if (d !== 0 && Math.abs(d) <= 40) CHALLENGE.push({ x, y, k, d });
}

export const UNITS = [
  unit("08", {
    name: "代金と個数の問題（連立方程式の利用）",
    desc: "表に整理して式を2つつくり、解いて確かめる",
    prereqs: ["J2-rk07", "J1-e2"],
    points: [
      "文章題は、わからない2つの数量を $x$、$y$ とおき、数量の関係を表に整理して、式を2つつくる。",
      "個数の関係と、代金の関係（代金 ＝ 1つの値段 $\\times$ 個数）の、2つの式をつくって、連立方程式を解く。",
      "解けたら、解をもとの式（問題の条件）に代入して確かめる。解が、個数として合わない数（小数・負の数）になることもあるので、場面にもどして確かめてから、答えを書く。",
    ],
    levels: {
      // ───────── 1 基礎 ─────────
      1: [
        // 08d01a 折り紙・画用紙（個数と代金から、枚数を求める）
        t("08d01a", (r) => {
          const s = buyScene(r), askA = r(0, 1) === 0;
          const sol = solveInt([1, 1, s.n], [s.pa, s.pb, s.M]);
          if (!sol) return { skip: true };
          const [X, Y] = sol, ask = askA ? s.a : s.b, ans = askA ? X : Y;
          return {
            q: `1${s.c} ${s.pa}円の${s.a}と、1${s.c} ${s.pb}円の${s.b}を、合わせて ${s.n}${s.c}買ったら、代金は ${s.M}円だった。${ask}は何${s.c}買ったか。${s.a}を $x$ ${s.c}、${s.b}を $y$ ${s.c}として、連立方程式で求めよう。`,
            ans,
            unit: s.c,
            hint: "個数の関係と、代金の関係で、式を2つつくろう。代金は、（1つの値段）×（個数）の合計。",
            steps: [
              `${s.a}を $x$ ${s.c}、${s.b}を $y$ ${s.c}とする。　個数　$x+y=${s.n}$ …①　　代金　$${linTex(s.pa, s.pb, s.M)}$ …②`,
              `②−①×${s.pa}　${solved(s.pb - s.pa, s.M - s.pa * s.n, "y", Y)}`,
              `① に代入　$x=${s.n}-${Y}=${X}$`,
              `確かめ　$${s.pa}\\times ${X}+${s.pb}\\times ${Y}=${s.M}$。${s.a} ${X}${s.c}、${s.b} ${Y}${s.c}なので、${ask}は ${ans}${s.c}。`,
            ],
          };
        }),
        // 08d01b 表の「代金」の行から、式をつくる（4択）
        t("08d01b", (r) => {
          const s = buyScene(r);
          const ok = tx(linTex(s.pa, s.pb, s.M));
          const wrongs = shuffle(r, [
            tx(linTex(s.pb, s.pa, s.M)),                                // 値段の入れちがえ
            tx(linTex(s.pa, s.pb, s.n)),                                // 右辺が個数
            tx(linTex(s.pa, -s.pb, s.M)),                               // 代金の式が差
            tx(`\\frac{x}{${s.pa}}+\\frac{y}{${s.pb}}=${s.M}`),           // 値段でわってしまう
            tx(`x+y=${s.M}`),                                           // 個数の式に代金を入れる
          ]);
          return {
            q: `1${s.c} ${s.pa}円の${s.a}を $x$ ${s.c}、1${s.c} ${s.pb}円の${s.b}を $y$ ${s.c}、合わせて ${s.n}${s.c}買ったら、代金は ${s.M}円だった。代金の関係を表す式は、どれか。`,
            ans: ok,
            choices: choices4(r, ok, wrongs),
            hint: `${s.a}だけの代金は、1${s.c}の値段に、何をかけると求められるかな。`,
            steps: [
              `${s.a}の代金は $${s.pa}x$ 円、${s.b}の代金は $${s.pb}y$ 円。`,
              `代金の合計が ${s.M}円だから　$${linTex(s.pa, s.pb, s.M)}$`,
            ],
          };
        }),
        // 08q03 解を、もとの式に代入して確かめて、答えを文で書こう（組を選ぶ4択）
        t("08q03", (r) => {
          const s = stallScene(r);
          if (!s) return { skip: true };
          const { x, y } = s;
          const seen = new Set([`${x},${y}`]);
          const pairs = shuffle(r, [[x + 1, y - 1], [x - 1, y + 1], [y, x], [x + 2, y - 2], [x - 2, y + 2]])
            .filter(([u, v]) => u >= 1 && v >= 1 && !seen.has(`${u},${v}`) && seen.add(`${u},${v}`));
          if (pairs.length < 3) return { skip: true };
          const label = ([u, v]) => `${s.a} ${u}${s.ca}、${s.b} ${v}${s.cb}`;
          const ok = label([x, y]), wr = pairs.slice(0, 3);
          const cost = ([u, v]) => s.pa * u + s.pb * v;
          return {
            q: `${s.place}、1${s.ca} ${s.pa}円の${s.a}と、1${s.cb} ${s.pb}円の${s.b}を、合わせて ${s.n}${s.tc}買ったら、代金は ${s.M}円だった。次のうち、この問題の答えとして正しいものはどれか。（解を、もとの式に代入して確かめよう）`,
            ans: ok,
            choices: choices4(r, ok, wr.map(label)),
            hint: "個数の合計と、代金の合計の、両方があう組を選ぼう。",
            steps: [
              `どの組も、合わせて ${s.n}${s.tc}。代金を計算して、${s.M}円になる組を探す。`,
              `${ok}　→　$${s.pa}\\times ${x}+${s.pb}\\times ${y}=${s.M}$ で、あう。`,
              `ほかの組の代金は、${wr.map((w) => `${cost(w)}円`).join("、")}で、${s.M}円にならない。`,
              `答えは「${ok}」。`,
            ],
          };
        }),
        // 08q04 1個 x円のパン3個と、1個 y円のジュース2本の、代金の合計
        t("08q04", (r) => {
          const S = pick(r, [
            { a: "パン", ca: "個", b: "ジュース", cb: "本" },
            { a: "ノート", ca: "冊", b: "ペン", cb: "本" },
            { a: "りんご", ca: "個", b: "みかん", cb: "個" },
            { a: "クッキー", ca: "枚", b: "ゼリー", cb: "個" },
            { a: "ケーキ", ca: "個", b: "コーヒー", cb: "杯" },
            { a: "おにぎり", ca: "個", b: "お茶", cb: "本" },
            { a: "鉛筆", ca: "本", b: "消しゴム", cb: "個" },
          ]);
          const a = r(2, 9), b = r(2, 9);
          if (a === b) return { skip: true };
          const right = poly([a, { x: 1 }], [b, { y: 1 }]);
          const wrongPolys = shuffle(r, [
            poly([b, { x: 1 }], [a, { y: 1 }]),                // 個数と文字の入れちがえ
            term(a + b, { x: 1, y: 1 }),                        // たし算をかけ算にしてしまう
            poly([a + b, { x: 1 }], [a + b, { y: 1 }]),         // 個数の合計をどちらにもかける
            term(a * b, { x: 1, y: 1 }),
          ]).filter((w) => !peq(w, right));
          const ok = tx(ptex(right, ["x", "y"]));
          return {
            q: `1${S.ca} $x$ 円の${S.a}を ${a}${S.ca}と、1${S.cb} $y$ 円の${S.b}を ${b}${S.cb}買った。代金の合計は何円か。$x$、$y$ を使った式で表すと？`,
            ans: ok,
            choices: choices4(r, ok, wrongPolys.map((w) => tx(ptex(w, ["x", "y"])))),
            hint: `${S.a}の代金と${S.b}の代金を、別々に表してから、合わせよう。`,
            steps: [`${S.a}の代金は $${a}x$ 円、${S.b}の代金は $${b}y$ 円。`, `合計は $${ptex(right, ["x", "y"])}$（円）。`],
          };
        }),
      ],
      // ───────── 2 標準 ─────────
      2: [
        // 08q01 連立方程式をつくろう（4択）
        t("08q01", (r) => {
          const s = stallScene(r);
          if (!s) return { skip: true };
          const ok = sys2(`x+y=${s.n}`, linTex(s.pa, s.pb, s.M));
          const wrongs = shuffle(r, [
            sys2(`x+y=${s.n}`, linTex(s.pb, s.pa, s.M)),     // 値段の入れちがえ
            sys2(`x+y=${s.M}`, linTex(s.pa, s.pb, s.n)),     // 右辺の入れちがえ
            sys2(`x-y=${s.n}`, linTex(s.pa, s.pb, s.M)),     // 個数の式が差
            sys2(`x+y=${s.n}`, linTex(s.pa, -s.pb, s.M)),    // 代金の式が差
          ]);
          return {
            q: `${s.place}、1${s.ca} ${s.pa}円の${s.a}と、1${s.cb} ${s.pb}円の${s.b}を、合わせて ${s.n}${s.tc}買ったら、代金は ${s.M}円だった。${s.a}を $x$ ${s.ca}、${s.b}を $y$ ${s.cb}とするとき、この場面を表す連立方程式は、どれか。`,
            ans: ok,
            choices: choices4(r, ok, wrongs),
            hint: "個数の合計の式と、代金の合計の式の、2つをつくろう。",
            steps: [
              `合わせて ${s.n}${s.tc}だから　$x+y=${s.n}$ …①`,
              `代金は、${s.a}が $${s.pa}x$ 円、${s.b}が $${s.pb}y$ 円で、合計 ${s.M}円だから　$${linTex(s.pa, s.pb, s.M)}$ …②`,
              `連立方程式は　${ok}`,
            ],
          };
        }),
        // 08q02 （1）の連立方程式を解こう
        t("08q02", (r) => {
          const p = 50 * r(2, 8), q = 50 * r(2, 8), x = r(2, 9), y = r(2, 9);
          if (p === q || x === y) return { skip: true };
          const n = x + y, M = p * x + q * y;
          const sol = solveInt([1, 1, n], [p, q, M]);
          if (!sol || sol[0] !== x || sol[1] !== y) return { skip: true };
          const askX = r(0, 1) === 0, v = askX ? "x" : "y";
          // p > q なら y を、p < q なら x を消す
          const first = p > q
            ? `②−①×${q}　${solved(p - q, M - q * n, "x", x)}`
            : `②−①×${p}　${solved(q - p, M - p * n, "y", y)}`;
          const second = p > q ? `① に代入　$${x}+y=${n}$　$y=${y}$` : `① に代入　$x+${y}=${n}$　$x=${x}$`;
          return {
            q: `連立方程式 ${sys2(`x+y=${n}`, linTex(p, q, M))} を解いたとき、$${v}$ の値は？`,
            ans: askX ? x : y,
            hint: "①を何倍かして、$x$ か $y$ のどちらかの係数をそろえて、消そう。",
            steps: [
              `$x+y=${n}$ …①　　$${linTex(p, q, M)}$ …②`,
              first,
              second,
              `解は $x=${x}$、$y=${y}$。$${v}$ の値は ${askX ? x : y}。`,
            ],
          };
        }),
        // 08d02 コロッケ3個とメンチカツ1個で450円、… → 1個の値段
        t("08d02", (r) => {
          const P = pick(r, [
            { a: "コロッケ", ca: "個", b: "メンチカツ", cb: "個", pa: [60, 70, 80, 90, 100, 120], pb: [150, 180, 200, 210, 250] },
            { a: "りんご", ca: "個", b: "なし", cb: "個", pa: [80, 90, 100, 120, 130], pb: [150, 160, 180, 200] },
            { a: "ノート", ca: "冊", b: "鉛筆", cb: "本", pa: [100, 120, 150, 180, 200], pb: [40, 50, 60, 80] },
            { a: "ドーナツ", ca: "個", b: "シュークリーム", cb: "個", pa: [100, 120, 130, 150], pb: [160, 180, 200, 220] },
          ]);
          const p = pick(r, P.pa), q = pick(r, P.pb);
          const a1 = r(1, 5), b1 = r(1, 5), a2 = r(1, 5), b2 = r(1, 5);
          if (a1 * b2 - a2 * b1 === 0) return { skip: true };
          const c1 = a1 * p + b1 * q, c2 = a2 * p + b2 * q;
          const sol = solveInt([a1, b1, c1], [a2, b2, c2]);
          if (!sol || sol[0] !== p || sol[1] !== q) return { skip: true };
          const [X, Y] = sol, askA = r(0, 1) === 0, ask = askA ? P.a : P.b, askC = askA ? P.ca : P.cb, ans = askA ? X : Y;
          const e = elimY(a1, b1, c1, a2, b2, c2);
          return {
            q: `${P.a}${a1}${P.ca}と${P.b}${b1}${P.cb}で ${c1}円、${P.a}${a2}${P.ca}と${P.b}${b2}${P.cb}で ${c2}円だった。${ask}1${askC}の値段は何円か。${P.a}1${P.ca}を $x$ 円、${P.b}1${P.cb}を $y$ 円として、連立方程式で求めよう。`,
            ans,
            unit: "円",
            hint: "1回目の買い物と、2回目の買い物で、それぞれ代金の式をつくろう。どちらの文字を先に消すと、計算が楽かな。",
            steps: [
              `${P.a}1${P.ca}を $x$ 円、${P.b}1${P.cb}を $y$ 円とする。　$${linTex(a1, b1, c1)}$ …①　　$${linTex(a2, b2, c2)}$ …②`,
              `${e.line}　${solved(e.D, e.R, "x", X)}`,
              `① に代入　$${mulTex(a1, X)}+${coef(b1, "y")}=${c1}$　$y=${Y}$`,
              `${P.a}は 1${P.ca} ${X}円、${P.b}は 1${P.cb} ${Y}円なので、${ask}は ${ans}円。`,
            ],
          };
        }),
        // 08d03 2けたの自然数（各位の和・入れかえた数）
        t("08d03", (r) => {
          const x = r(1, 9), y = r(1, 9);
          if (x === y) return { skip: true };
          const S = x + y, k = y - x, D = 9 * Math.abs(k), bigger = k > 0, orig = 10 * x + y;
          const sol = solveInt([1, 1, S], [-1, 1, k]);
          if (!sol || sol[0] !== x || sol[1] !== y) return { skip: true };
          const what = pick(r, ["orig", "orig", "orig", "tens", "ones"]);
          const sumText = pick(r, ["各位の数の和", "十の位の数と一の位の数の和"]);
          const askText = { orig: "もとの自然数は、いくつか。", tens: "もとの自然数の、十の位の数は、いくつか。", ones: "もとの自然数の、一の位の数は、いくつか。" }[what];
          return {
            q: `2けたの自然数があり、${sumText}は ${S} である。十の位の数と一の位の数を入れかえた数は、もとの数より ${D} ${bigger ? "大きい" : "小さい"}。${askText}`,
            ans: { orig, tens: x, ones: y }[what],
            hint: "2けたの自然数は、（十の位の数）×10＋（一の位の数）。入れかえた数は、どう表せるかな。",
            steps: [
              `十の位の数を $x$、一の位の数を $y$ とする。　$x+y=${S}$ …①　　$10y+x=10x+y${bigger ? "+" : "-"}${D}$ …②`,
              `② を整理　$${linTex(-1, 1, k)}$ …③`,
              `①+③　$2y=${S + k}$　$y=${y}$　① に代入　$x=${x}$`,
              `確かめ　$${x}+${y}=${S}$、入れかえた数は ${10 * y + x}。十の位の数は ${x}、一の位の数は ${y}で、もとの自然数は ${orig}。`,
            ],
          };
        }),
      ],
      // ───────── 3 応用 ─────────
      3: [
        // 08d04 にわとりとうさぎ（足の数）
        t("08d04", (r) => {
          const W = pick(r, [
            { a: "にわとり", b: "うさぎ", la: 2, lb: 4, u: "匹", part: "足", pu: "本", be: "いる" },
            { a: "自転車", b: "三輪車", la: 2, lb: 3, u: "台", part: "車輪", pu: "個", be: "ある" },
            { a: "自動車", b: "オートバイ", la: 4, lb: 2, u: "台", part: "タイヤ", pu: "本", be: "ある" },
          ]);
          const x = r(2, 12), y = r(2, 12);
          if (x === y) return { skip: true };
          const n = x + y, m = W.la * x + W.lb * y;
          const sol = solveInt([1, 1, n], [W.la, W.lb, m]);
          if (!sol || sol[0] !== x || sol[1] !== y) return { skip: true };
          const askA = r(0, 1) === 0, ask = askA ? W.a : W.b, ans = askA ? x : y;
          const lo = Math.min(W.la, W.lb), hi = Math.max(W.la, W.lb);
          const killX = W.la < W.lb;   // la が小さい → ②−①×la で x が消えて y が求まる。la が大きい → ②−①×lb で y が消えて x が求まる
          return {
            q: `${W.a}と${W.b}が、合わせて ${n}${W.u}${W.be}。${W.part}の数は、全部で ${m}${W.pu}である。${ask}は何${W.u}${W.be}か。${W.a}を $x$ ${W.u}、${W.b}を $y$ ${W.u}として、連立方程式で求めよう。`,
            ans,
            unit: W.u,
            hint: `${W.u}数の関係と、${W.part}の数の関係で、式を2つつくろう。${W.part}の数は、（1${W.u}の${W.part}の数）×（${W.u}数）の合計。`,
            steps: [
              `${W.a}を $x$ ${W.u}、${W.b}を $y$ ${W.u}とする。　${W.u}数　$x+y=${n}$ …①　　${W.part}の数　$${linTex(W.la, W.lb, m)}$ …②`,
              killX
                ? `②−①×${lo}　${solved(hi - lo, m - lo * n, "y", y)}`
                : `②−①×${lo}　${solved(hi - lo, m - lo * n, "x", x)}`,
              killX ? `① に代入　$x=${n}-${y}=${x}$` : `① に代入　$y=${n}-${x}=${y}$`,
              `確かめ　$${W.la}\\times ${x}+${W.lb}\\times ${y}=${m}$。${W.a} ${x}${W.u}、${W.b} ${y}${W.u}なので、${ask}は ${ans}${W.u}。`,
            ],
          };
        }),
        // 08d05 クイズの得点
        t("08d05", (r) => {
          const n = r(10, 25), a = r(2, 5), b = r(1, 2);
          const x = r(Math.ceil(n / 2), n - 1), y = n - x, S = a * x - b * y;
          if (S <= 0 || S > 100) return { skip: true };
          const sol = solveInt([1, 1, n], [a, -b, S]);
          if (!sol || sol[0] !== x || sol[1] !== y) return { skip: true };
          const askA = r(0, 1) === 0, ans = askA ? x : y, who = askA ? "正解した" : "不正解だった";
          return {
            q: `${n}問のクイズ（すべての問題に答えた）で、正解は 1問 ${a}点もらえ、不正解は 1問 ${b}点ひかれる。得点は ${S}点だった。${who}問題は何問か。正解を $x$ 問、不正解を $y$ 問として、連立方程式で求めよう。`,
            ans,
            unit: "問",
            hint: "問題数の合計の式と、得点の式（もらう点 − ひかれる点）で、式を2つつくろう。",
            steps: [
              `正解を $x$ 問、不正解を $y$ 問とする。　$x+y=${n}$ …①　　$${linTex(a, -b, S)}$ …②`,
              `${b === 1 ? "①+②" : `①×${b}+②`}　${solved(a + b, S + b * n, "x", x)}　① に代入　$y=${y}$`,
              `確かめ　$${mulTex(a, x)}-${mulTex(b, y)}=${S}$`,
              `正解 ${x}問、不正解 ${y}問なので、${who}問題は ${ans}問。`,
            ],
          };
        }),
        // 08w03 考えよう：連立方程式の解は、そのまま問題の答えにしてよいか（4択）。解が小数・負の数・問題に合う、の3通り
        t("08w03", (r) => {
          const kind = pick(r, ["dec", "dec", "neg", "ok", "ok"]);
          const s = pick(r, BUY), c = s.c, a = s.a, b = s.b;
          let p, q, n, M, X, Y;                       // X, Y は表示する解（文字列）、ok1 は正しい選択肢、wr は誤答の候補
          let ok1, wr, why;
          if (kind === "dec") {
            p = pick(r, [40, 50, 60, 70]); q = p + 50; n = r(10, 20);
            const k = r(2, n - 3), fi = r(1, 4);
            M = p * n + 50 * k + 10 * fi;
            const sol = solve2([1, 1, n], [p, q, M]);
            if (!sol) return { skip: true };
            const xs = round(qval(sol[0]), 1), ys = round(qval(sol[1]), 1);
            if (Number.isInteger(xs) || Number.isInteger(ys) || xs <= 0 || ys <= 0) return { skip: true };
            X = String(xs); Y = String(ys);
            ok1 = pick(r, [`$x$、$y$ は${c}数だから、整数でなければならない。小数の解は、問題の答えにできない`, `${c}数は整数のはずなので、小数の $x$、$y$ は、この問題の答えにならない`]);
            wr = [`${a}${xs}${c}、${b}${ys}${c}を、そのまま答えにしてよい`, `四捨五入して、${a}${Math.round(xs)}${c}、${b}${Math.round(ys)}${c}を答えにすればよい`, "解は、もとの式に代入して成り立つから、いつでも問題の答えになる"];
            why = [`${xs}、${ys} は整数ではないので、答えにできない（このような買い方はない）。四捨五入した組は、代金が ${M}円にならない。`, `$x$、$y$ は${c}数なので、整数でなければならない。`];
          } else if (kind === "neg") {
            p = pick(r, s.pa); q = pick(r, s.pb); n = r(8, 16);
            const k = r(1, 3);
            M = q * n + (q - p) * k;
            const sol = solveInt([1, 1, n], [p, q, M]);
            if (!sol || sol[0] !== -k || sol[1] !== n + k) return { skip: true };
            X = String(-k); Y = String(n + k);
            ok1 = pick(r, [`${c}数が負の数になることはないので、この解は問題の答えにできない`, `$x$ が負の数だから、${a}の${c}数として、ありえない。答えにできない`]);
            wr = [`式が成り立つのだから、負の数のままで答えにしてよい`, `符号をとって、${a}${k}${c}、${b}${n + k}${c}を答えにすればよい`, `${a}を買わなかったことにして、${b}だけ${n}${c}を答えにすればよい`];
            why = [`$x=${-k}$ は負の数で、${c}数としてありえないので、答えにできない。`, `符号をとった組や、${b}だけの組は、合わせて ${n}${c}と代金 ${M}円の、両方は満たさない。`];
          } else {
            p = pick(r, s.pa); q = pick(r, s.pb);
            const x = r(3, 12), y = r(3, 12);
            if (x === y) return { skip: true };
            n = x + y; M = p * x + q * y;
            const sol = solveInt([1, 1, n], [p, q, M]);
            if (!sol || sol[0] !== x || sol[1] !== y) return { skip: true };
            X = String(x); Y = String(y);
            ok1 = pick(r, [`$x$、$y$ はどちらも整数で、${c}数として合っている。もとの式にも合うので、答えにしてよい`, `${a}${x}${c}、${b}${y}${c}は、合わせて ${n}${c}で、代金も ${M}円になる。そのまま答えにしてよい`]);
            wr = [`合わせて ${n}${c}にならないので、答えにできない`, `代金が ${M}円にならないので、答えにできない`, "解が2組以上あるので、1つに決められない", "整数の解は、問題の答えにならない"];
            why = [`$x=${x}$、$y=${y}$ はどちらも整数で、${c}数として合っている。`, `確かめ　$${x}+${y}=${n}$、$${p}\\times ${x}+${q}\\times ${y}=${M}$ で、条件に合う。答えにしてよい。`];
          }
          return {
            q: `1${c} ${p}円の${a}と、1${c} ${q}円の${b}を、合わせて ${n}${c}買ったら、代金は ${M}円だった。${a}を $x$ ${c}、${b}を $y$ ${c}として連立方程式をつくって解くと、$x=${X}$、$y=${Y}$ になった。この結果について、正しいものはどれか。`,
            ans: ok1,
            choices: choices4(r, ok1, shuffle(r, wr)),
            hint: "$x$、$y$ は、何を表す文字だったかな。その数として、ありえる数かどうか、問題の条件に合うかを考えよう。",
            steps: [
              "連立方程式の解は、式に代入すると成り立つ。でも、それだけでは、問題の答えになるとは限らない。場面にもどして確かめる。",
              ...why,
            ],
          };
        }),
      ],
      // ───────── 4 入試レベル ─────────
      4: [
        // 08d06 配りもの（たりない・あまる）
        t("08d06", (r) => {
          const d = pick(r, r(0, 9) < 7 ? DIST_CLASSIC : DIST_SAME);
          const T = pick(r, [
            { who: "子ども", wc: "人", thing: "みかん", tc: "個" },
            { who: "子ども", wc: "人", thing: "あめ", tc: "個" },
            { who: "生徒", wc: "人", thing: "色紙", tc: "枚" },
            { who: "子ども", wc: "人", thing: "クッキー", tc: "枚" },
            { who: "生徒", wc: "人", thing: "鉛筆", tc: "本" },
          ]);
          const { a, b, x, e1, e2 } = d, y = a * x + e1;
          const sol = solveInt([a, -1, -e1], [b, -1, -e2]);
          if (!sol || sol[0] !== x || sol[1] !== y) return { skip: true };
          const first = e1 > 0 ? `${e1}${T.tc}あまり` : `${-e1}${T.tc}たりず`;
          const second = e2 > 0 ? `${e2}${T.tc}あまる` : `${-e2}${T.tc}たりない`;
          const askWho = r(0, 1) === 0, ans = askWho ? x : y, au = askWho ? T.wc : T.tc;
          const expr = (k, e) => ptex(poly([k, { x: 1 }], [e, {}]));
          return {
            q: `${T.who}たちに${T.thing}を配る。1人に ${a}${T.tc}ずつ配ると ${first}、1人に ${b}${T.tc}ずつ配ると ${second}。${askWho ? `${T.who}の人数` : `${T.thing}の数`}は何${au}か。${T.who}を $x$ ${T.wc}、${T.thing}を $y$ ${T.tc}として、連立方程式で求めよう。`,
            ans,
            unit: au,
            hint: `${T.thing}の数 $y$ を、2つの配り方のそれぞれで、人数 $x$ を使って表してみよう。`,
            steps: [
              `${T.who}を $x$ ${T.wc}、${T.thing}を $y$ ${T.tc}とする。　$y=${expr(a, e1)}$ …①　　$y=${expr(b, e2)}$ …②`,
              `① を ② に代入　$${expr(a, e1)}=${expr(b, e2)}$　${solved(a - b, e2 - e1, "x", x)}`,
              `① に代入　$y=${a}\\times ${x}${e1 > 0 ? "+" : "-"}${Math.abs(e1)}=${y}$`,
              `確かめ　② でも $${b}\\times ${x}${e2 > 0 ? "+" : "-"}${Math.abs(e2)}=${y}$。${T.who} ${x}${T.wc}、${T.thing} ${y}${T.tc}なので、答えは ${ans}${au}。`,
            ],
          };
        }),
        // 08d07 せんべい3枚とだんご2本で540円。5枚の代金は4本の代金より20円高い
        t("08d07", (r) => {
          const S = pick(r, [
            { a: "せんべい", ca: "枚", b: "だんご", cb: "本", pa: [60, 80, 100, 120], pb: [80, 100, 120, 150] },
            { a: "クッキー", ca: "枚", b: "プリン", cb: "個", pa: [50, 60, 80, 100], pb: [120, 150, 180] },
            { a: "メロンパン", ca: "個", b: "牛乳", cb: "本", pa: [120, 150, 180, 200], pb: [80, 100, 120] },
          ]);
          const p = pick(r, S.pa), q = pick(r, S.pb), a1 = r(1, 5), b1 = r(1, 5);
          const cands = [];
          for (let a2 = 2; a2 <= 7; a2++) for (let b2 = 2; b2 <= 7; b2++) {
            const d = a2 * p - b2 * q;
            if (d !== 0 && Math.abs(d) <= 300 && !(a2 === a1 && b2 === b1)) cands.push([a2, b2, d]);
          }
          if (!cands.length) return { skip: true };
          const [a2, b2, d] = pick(r, cands);
          const c1 = a1 * p + b1 * q;
          const sol = solveInt([a1, b1, c1], [a2, -b2, d]);
          if (!sol || sol[0] !== p || sol[1] !== q) return { skip: true };
          const askA = r(0, 1) === 0, ask = askA ? S.a : S.b, askC = askA ? S.ca : S.cb, ans = askA ? p : q;
          const g = gcd(b1, b2), m1 = b2 / g, m2 = b1 / g;
          const D = a1 * m1 + a2 * m2, R = c1 * m1 + d * m2;
          return {
            q: `${S.a}${a1}${S.ca}と${S.b}${b1}${S.cb}で ${c1}円。${S.a}${a2}${S.ca}の代金は、${S.b}${b2}${S.cb}の代金より ${Math.abs(d)}円${d > 0 ? "高い" : "安い"}。${ask}1${askC}の値段は何円か。${S.a}1${S.ca}を $x$ 円、${S.b}1${S.cb}を $y$ 円として、連立方程式で求めよう。`,
            ans,
            unit: "円",
            hint: `「${S.a}${a2}${S.ca}の代金は、${S.b}${b2}${S.cb}の代金より ${Math.abs(d)}円${d > 0 ? "高い" : "安い"}」を、$x$、$y$ を使った式で、どう表すかな。`,
            steps: [
              `${S.a}1${S.ca}を $x$ 円、${S.b}1${S.cb}を $y$ 円とする。　$${linTex(a1, b1, c1)}$ …①　　$${linTex(a2, -b2, d)}$ …②`,
              `${times("①", m1)}+${times("②", m2)}　${solved(D, R, "x", p)}`,
              `① に代入　$${mulTex(a1, p)}+${coef(b1, "y")}=${c1}$　$y=${q}$`,
              `確かめ　$${a2}\\times ${p}-${b2}\\times ${q}=${d}$。${S.a}は 1${S.ca} ${p}円、${S.b}は 1${S.cb} ${q}円なので、${ask}は ${ans}円。`,
            ],
          };
        }),
        // 08q05 チャレンジ：2けたの自然数（入れかえた数が、もとの数の k倍より d 大きい／小さい）
        t("08q05", (r) => {
          const { x, y, k, d } = pick(r, CHALLENGE);
          const S = x + y, orig = 10 * x + y, swapped = 10 * y + x;
          const ca = 1 - 10 * k, cb = 10 - k;               // ③：ca x + cb y = d
          const sol = solveInt([1, 1, S], [ca, cb, d]);
          if (!sol || sol[0] !== x || sol[1] !== y) return { skip: true };
          const what = pick(r, ["orig", "orig", "orig", "tens", "ones"]);
          const sumText = pick(r, ["各位の数の和", "十の位の数と一の位の数の和"]);
          const rel = r(0, 1) === 0
            ? `十の位の数と一の位の数を入れかえた数は、もとの数の ${k}倍より ${Math.abs(d)} ${d > 0 ? "大きい" : "小さい"}`
            : `もとの数の ${k}倍は、十の位の数と一の位の数を入れかえた数より ${Math.abs(d)} ${d > 0 ? "小さい" : "大きい"}`;
          const askText = { orig: "もとの自然数は、いくつか。", tens: "もとの自然数の、十の位の数は、いくつか。", ones: "もとの自然数の、一の位の数は、いくつか。" }[what];
          return {
            q: `2けたの自然数があり、${sumText}は ${S} である。${rel}。${askText}`,
            ans: { orig, tens: x, ones: y }[what],
            hint: "十の位の数を $x$、一の位の数を $y$ とすると、もとの数は $10x+y$。入れかえた数は？　かっこを使って式をつくろう。",
            steps: [
              `十の位の数を $x$、一の位の数を $y$ とする。　$x+y=${S}$ …①　　$10y+x=${k}(10x+y)${d > 0 ? "+" : "-"}${Math.abs(d)}$ …②`,
              `② を整理　$${linTex(ca, cb, d)}$ …③`,
              `①×${cb}−③　${solved(cb - ca, cb * S - d, "x", x)}　① に代入　$y=${y}$`,
              `確かめ　${orig} → ${swapped}、$${k}\\times ${orig}${d > 0 ? "+" : "-"}${Math.abs(d)}=${swapped}$。十の位の数は ${x}、一の位の数は ${y}で、もとの自然数は ${orig}。`,
            ],
          };
        }),
      ],
    },
  }),
];

// 移さなかった問題（記述・説明・図が必要など、コツコツくんの入力形式で答えられないもの）
export const SKIPPED = [];   // 第8時は、演習プリント 7問・小テスト 5問のすべてを移した（式をつくる問いは4択、解く問いは数で聞く）
