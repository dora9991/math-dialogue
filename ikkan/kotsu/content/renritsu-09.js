// ============================================================
// renritsu-09.js — 連立方程式 第9時「道のり・速さ・時間の問題を、表に整理して解こう」
//   ikkan の演習プリント（renritsu-09.dr.1〜6）・小テスト（renritsu-09.qz.1〜5）を、コツコツくんのテンプレートにしたもの。
//   テンプレート id＝「09」＋ d（演習）／q（小テスト）／w（ワークシート）＋ ikkan の問題の番号（＋ 1つの問題から2つ以上つくるとき a, b…）。
//     例：09d01a ＝ renritsu-09.dr.1 の1つ目（道のりを表す式）、09d02b ＝ renritsu-09.dr.2 の2つ目（時間の式を選ぶ）、09w03 ＝ ワークシートの3つ目の課題（考えよう）
//   文章題は、道のり・速さ・時間を数で聞く。「式で表す」「連立方程式をつくる」問いは、場面に合う式を選ぶ4択に直した。
//   どの問題も、先に答え（整数の道のり・時間）を決めてから、問題文の数字（合計の道のり・時間など）を計算でつくる。答えは solve2 で解き直している。
//   時間の式 $\frac{x}{40}+\frac{y}{120}=30$ は、全体に最小公倍数をかけて、整数の係数にして解く（解説）。
// ============================================================
import { t, pick, choices4, shuffle, lcm, fracTex } from "../kit.js";
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
/** 時間（分）を「5時間 30分」「45分」の文に */
const fmtT = (min) => {
  const h = Math.floor(min / 60), m = min % 60;
  return h && m ? `${h}時間 ${m}分` : h ? `${h}時間` : `${m}分`;
};
/** 時間（分）を「時間」で表す TeX：330 → \frac{11}{2}、300 → 5 */
const hoursTex = (min) => fracTex(min, 60);

// ── 歩く・走る（分速 m）の場面：歩いた時間 t1・走った時間 t2（分）から、道のり x, y・合計 D, T をつくる ──────────
//  [歩く速さ, 走る速さ]：最小公倍数が大きくならない組
const WR = [[40, 120], [50, 150], [60, 180], [60, 120], [80, 240], [90, 180], [40, 100], [50, 100], [60, 150], [80, 200]];
const PLACES = ["図書館", "駅", "学校", "公園", "体育館", "市民会館"];
/** 合計の道のりが 1000〜4000 m になる場面（歩いた道のり≠走った道のり、歩いた時間≠走った時間）。{ place, v1, v2, t1, t2, x, y, D, T } */
function walkRunScene(r) {
  for (let i = 0; i < 50; i++) {
    const [v1, v2] = pick(r, WR), t1 = r(5, 20), t2 = r(3, 12);
    const x = v1 * t1, y = v2 * t2, D = x + y;
    if (D < 1000 || D > 4000 || x === y || t1 === t2) continue;   // 道のりが等しい・時間が等しいと、速さを入れちがえた式も成り立ってしまう
    return { place: pick(r, PLACES), v1, v2, t1, t2, x, y, D, T: t1 + t2 };
  }
  return null;
}

/** x+y=D …①、x/v1+y/v2=T …② を解く解説（4行）。nameX・nameY は「歩いた道のり」など、u は「m」「km」。
 *  intro＝1行目の頭の文（"" なら式だけ）、last＝4行目を書きかえるとき */
function ratioSteps({ nameX, nameY, u, v1, v2, D, T, X, Y, intro, last }) {
  const L = lcm(v1, v2), a = L / v1, b = L / v2;
  const head = intro === undefined ? `${nameX}を $x$ ${u}、${nameY}を $y$ ${u} とする。　` : intro;
  return [
    `${head}$x+y=${D}$ …①　　$\\frac{x}{${v1}}+\\frac{y}{${v2}}=${T}$ …②`,
    `②×${L}　$${linTex(a, b, L * T)}$ …③`,
    `③−${times("①", b)}　${solved(a - b, L * T - b * D, "x", X)}　① に代入　$y=${D}-${X}=${Y}$`,
    last || `確かめ　$${X}\\div ${v1}+${Y}\\div ${v2}=${X / v1}+${Y / v2}=${T}$。${nameX}は ${X} ${u}、${nameY}は ${Y} ${u}。`,
  ];
}

// ── 09d01 の場面：速さの言い方・道のりの単位・時間の単位 ──────────────────
const MOVE = [
  { sp: "分速", len: "m", tm: "分", act: "歩く", vs: [50, 60, 65, 70, 75, 80, 85, 90, 100, 110, 120] },
  { sp: "分速", len: "m", tm: "分", act: "走る", vs: [150, 160, 180, 200, 210, 220, 240, 250, 260, 280, 300] },
  { sp: "分速", len: "m", tm: "分", act: "進む", vs: [40, 45, 50, 55, 60, 65, 70, 75, 80, 90, 100, 120, 150, 200, 250] },
  { sp: "時速", len: "km", tm: "時間", act: "歩く", vs: [3, 4, 5, 6] },
  { sp: "時速", len: "km", tm: "時間", act: "走る", vs: [8, 9, 10, 12, 15, 16, 18, 20] },
  { sp: "時速", len: "km", tm: "時間", act: "進む", vs: [20, 25, 30, 36, 40, 45, 50, 54, 60, 72, 80] },
];

// ── 09d03 の場面：自動車・バスが、遅い道と速い道を走る（時速 km）──────────
const ROAD = [
  { veh: "自動車", a: "一般道路", b: "高速道路" },
  { veh: "バス", a: "市街地", b: "高速道路" },
  { veh: "自動車", a: "山道", b: "高速道路" },
];
const KM_SPEEDS = [[40, 100], [50, 100], [60, 120], [40, 120], [30, 90], [60, 90]];

// ── 09d04：家から駅まで（km で言う）。歩く速さ v1・自転車の速さ v2（分速 m）、歩いた時間 t1・自転車の時間 t2（分）。合計の道のりが 100 m の倍数 ──
const HOME = [];
for (const v1 of [60, 70, 80, 90, 100]) for (const v2 of [150, 180, 200, 210, 240, 250, 300]) for (let t1 = 3; t1 <= 20; t1++) for (let t2 = 3; t2 <= 15; t2++) {
  const D = v1 * t1 + v2 * t2;
  if (D % 100 === 0 && D >= 1500 && D <= 5000) HOME.push({ v1, v2, t1, t2, D });
}

// ── 09d05：池のまわり（1周 L m）。A さん（速さ x）・B さん（速さ y）。反対向き t1分後に出会い、同じ向き t2分後に追いつく ──
const POND = [];
for (let y = 50; y <= 100; y += 5) for (let x = y + 10; x <= 110; x += 5) for (const t1 of [3, 4, 5, 6, 8, 10, 12, 15]) {
  const L = (x + y) * t1;
  if (L % 50 !== 0 || L < 300 || L > 2400 || L % (x - y) !== 0) continue;
  const t2 = L / (x - y);
  if (t2 >= 8 && t2 <= 60 && t2 > t1) POND.push({ x, y, t1, t2, L });
}

// ── 09d06：上り坂（時速 u km）・下り坂（時速 w km）。行きの上り x km・下り y km。行き・帰りの時間（分）が整数 ──
const SLOPE = [];
for (const u of [2, 3, 4, 5]) for (const w of [4, 5, 6]) {
  if (w <= u) continue;
  for (let x = 2; x <= 12; x++) for (let y = 2; y <= 12; y++) {
    if (x === y) continue;
    const go = (60 * x) / u + (60 * y) / w, back = (60 * x) / w + (60 * y) / u;
    if (!Number.isInteger(go) || !Number.isInteger(back) || go % 10 !== 0 || back % 10 !== 0 || go < 90 || go > 540 || back < 90 || back > 540) continue;
    SLOPE.push({ u, w, x, y, go, back });
  }
}

// ── 09q05：先に出た人を、あとから追いかける。追いつくまでの時間 t が整数 ──
const CHASE = [];
for (const v1 of [50, 60, 70, 80, 90]) for (const v2 of [150, 180, 200, 210, 240, 250]) for (const h of [4, 5, 6, 8, 10, 12]) {
  if ((v1 * h) % (v2 - v1) === 0) {
    const tt = (v1 * h) / (v2 - v1);
    if (tt >= 2 && tt <= 20) CHASE.push({ v1, v2, h, tt });
  }
}

export const UNITS = [
  unit("09", {
    name: "道のり・速さ・時間の問題（連立方程式の利用）",
    desc: "表に整理して、道のりの式と時間の式をつくる",
    prereqs: ["J2-rk08", "J1-e2"],
    points: [
      "道のり ＝ 速さ $\\times$ 時間、時間 ＝ 道のり $\\div$ 速さ。速さは、分速（m/分）や時速（km/時）で表す。",
      "単位（m と km、分と時間）は、そろえてから式をつくる。",
      "道のり・速さ・時間を表に整理して、道のりの式と時間の式の、2つをつくって解く。$x$、$y$ を道のりにおくか、時間におくかで、式の形は変わる。解は、もとの式に代入して確かめる。",
    ],
    levels: {
      // ───────── 1 基礎 ─────────
      1: [
        // 09d01a 道のり ＝ 速さ × 時間（文字を使った式）
        t("09d01a", (r) => {
          const m = pick(r, MOVE), v = pick(r, m.vs), c = pick(r, ["x", "y", "a", "b"]);
          const ok = tx(`${v}${c}`);
          const wrongs = [tx(`\\frac{${c}}{${v}}`), tx(`\\frac{${v}}{${c}}`), tx(`${c}+${v}`)];
          return {
            q: `${m.sp} ${v} ${m.len} で $${c}$ ${m.tm}${m.act}道のりは、何 ${m.len} か。$${c}$ を使った式で表すと？`,
            ans: ok,
            choices: choices4(r, ok, wrongs),
            hint: "道のりは、速さに何をかけると求められるかな。",
            steps: [`道のり ＝ 速さ $\\times$ 時間 だから　$${v}\\times ${c}=${v}${c}$`, `答えは $${v}${c}$（${m.len}）。`],
          };
        }),
        // 09d01b 時間 ＝ 道のり ÷ 速さ（文字を使った式）
        t("09d01b", (r) => {
          const m = pick(r, MOVE), v = pick(r, m.vs), c = pick(r, ["x", "y", "a", "b"]);
          const ok = tx(`\\frac{${c}}{${v}}`);
          const wrongs = [tx(`${v}${c}`), tx(`\\frac{${v}}{${c}}`), tx(`${c}-${v}`)];
          return {
            q: `$${c}$ ${m.len} の道のりを、${m.sp} ${v} ${m.len} で${m.act}とき、かかる時間は何${m.tm}か。$${c}$ を使った式で表すと？`,
            ans: ok,
            choices: choices4(r, ok, wrongs),
            hint: "時間は、道のりを何でわると求められるかな。",
            steps: [`時間 ＝ 道のり $\\div$ 速さ だから　$${c}\\div ${v}=\\frac{${c}}{${v}}$`, `答えは $\\frac{${c}}{${v}}$（${m.tm}）。`],
          };
        }),
        // 09d02a 歩いて、走って、全部で○分（道のり x, y を求める）
        t("09d02a", (r) => {
          const s = walkRunScene(r);
          if (!s) return { skip: true };
          const L = lcm(s.v1, s.v2);
          const sol = solveInt([1, 1, s.D], [L / s.v1, L / s.v2, L * s.T]);
          if (!sol || sol[0] !== s.x || sol[1] !== s.y) return { skip: true };
          const askWalk = r(0, 1) === 0;
          return {
            q: `家から${s.place}まで ${s.D} m ある。はじめは分速 ${s.v1} m で歩き、途中から分速 ${s.v2} m で走って、全部で ${s.T}分かかった。${askWalk ? "歩いた" : "走った"}道のりは何 m か。歩いた道のりを $x$ m、走った道のりを $y$ m として、連立方程式で求めよう。`,
            ans: askWalk ? s.x : s.y,
            unit: "m",
            hint: "道のりの式と、時間の式（時間 ＝ 道のり ÷ 速さ）の、2つをつくろう。分数の式は、全体に同じ数をかけて、整数にする。",
            steps: ratioSteps({ nameX: "歩いた道のり", nameY: "走った道のり", u: "m", v1: s.v1, v2: s.v2, D: s.D, T: s.T, X: s.x, Y: s.y }),
          };
        }),
        // 09d02b 表の「時間」の行から、式をつくる（4択）
        t("09d02b", (r) => {
          const s = walkRunScene(r);
          if (!s) return { skip: true };
          const ok = tx(`\\frac{x}{${s.v1}}+\\frac{y}{${s.v2}}=${s.T}`);
          const wrongs = shuffle(r, [
            tx(`\\frac{x}{${s.v2}}+\\frac{y}{${s.v1}}=${s.T}`),   // 速さの入れちがえ
            tx(`${s.v1}x+${s.v2}y=${s.T}`),                        // 速さ×道のりにしてしまう
            tx(`\\frac{x}{${s.v1}}+\\frac{y}{${s.v2}}=${s.D}`),    // 右辺が道のり
            tx(`x+y=${s.T}`),                                      // 道のりの文字を時間の式に
          ]);
          return {
            q: `家から${s.place}まで ${s.D} m ある。はじめは分速 ${s.v1} m で歩き、途中から分速 ${s.v2} m で走って、全部で ${s.T}分かかった。歩いた道のりを $x$ m、走った道のりを $y$ m とするとき、時間の関係を表す式は、どれか。`,
            ans: ok,
            choices: choices4(r, ok, wrongs),
            hint: "歩いた時間は、歩いた道のりを何でわると求められるかな。走った時間も同じように。",
            steps: [
              `歩いた時間は $\\frac{x}{${s.v1}}$ 分、走った時間は $\\frac{y}{${s.v2}}$ 分。`,
              `その合計が ${s.T}分だから　$\\frac{x}{${s.v1}}+\\frac{y}{${s.v2}}=${s.T}$`,
            ],
          };
        }),
        // 09q01 歩いた時間を、x, y を使った式で表そう（4択）
        t("09q01", (r) => {
          const s = walkRunScene(r);
          if (!s) return { skip: true };
          const askWalk = r(0, 1) === 0, v = askWalk ? s.v1 : s.v2, c = askWalk ? "x" : "y", o = askWalk ? "y" : "x", vo = askWalk ? s.v2 : s.v1;
          const ok = tx(`\\frac{${c}}{${v}}`);
          const wrongs = shuffle(r, [tx(`${v}${c}`), tx(`\\frac{${c}}{${vo}}`), tx(`\\frac{${o}}{${v}}`), tx(`\\frac{${v}}{${c}}`)]);
          return {
            q: `家から${s.place}まで ${s.D} m ある。はじめは分速 ${s.v1} m で歩き、途中から分速 ${s.v2} m で走った。歩いた道のりを $x$ m、走った道のりを $y$ m とする。${askWalk ? "歩いた" : "走った"}時間は何分か。$x$ か $y$ を使った式で表すと？`,
            ans: ok,
            choices: choices4(r, ok, wrongs),
            hint: `${askWalk ? "歩いた" : "走った"}時間は、何を何でわると求められるかな。${askWalk ? "歩いた" : "走った"}道のりの文字は $x$、$y$ のどちらで、そのときの速さはいくつかな。`,
            steps: [`${askWalk ? "歩いた" : "走った"}道のりは $${c}$ m、速さは分速 ${v} m。`, `時間 ＝ 道のり $\\div$ 速さ だから　$\\frac{${c}}{${v}}$（分）`],
          };
        }),
        // 09q04 解を、もとの式に代入して確かめて、答えを文で書こう（組を選ぶ4択）
        t("09q04", (r) => {
          const s = walkRunScene(r);
          if (!s) return { skip: true };
          const seen = new Set([`${s.x},${s.y}`]);
          const shifts = shuffle(r, [50, 100, 150, 200].flatMap((d) => [d, -d]));
          const pairs = [];
          for (const d of shifts) {
            const u = s.x + d, v = s.y - d, key = `${u},${v}`;
            if (u >= 50 && v >= 50 && !seen.has(key)) { seen.add(key); pairs.push([u, v]); }
            if (pairs.length === 3) break;
          }
          if (pairs.length < 3) return { skip: true };
          const label = ([u, v]) => `歩いた道のり ${u} m、走った道のり ${v} m`;
          const ok = label([s.x, s.y]);
          return {
            q: `家から${s.place}まで ${s.D} m ある。はじめは分速 ${s.v1} m で歩き、途中から分速 ${s.v2} m で走って、全部で ${s.T}分かかった。次のうち、この問題の答えとして正しいものはどれか。（解を、もとの式に代入して確かめよう）`,
            ans: ok,
            choices: choices4(r, ok, pairs.map(label)),
            hint: "道のりの合計と、時間の合計の、両方があう組を選ぼう。時間は、道のり ÷ 速さ。",
            steps: [
              `どの組も、道のりの合計は ${s.D} m。時間の合計を計算して、${s.T}分になる組を探す。`,
              `${ok}　→　$${s.x}\\div ${s.v1}+${s.y}\\div ${s.v2}=${s.t1}+${s.t2}=${s.T}$ で、あう。`,
              `ほかの組は、時間の合計が ${s.T}分にならない。`,
              `答えは「${ok}」。`,
            ],
          };
        }),
      ],
      // ───────── 2 標準 ─────────
      2: [
        // 09q02 連立方程式をつくろう（4択）
        t("09q02", (r) => {
          const s = walkRunScene(r);
          if (!s) return { skip: true };
          const ok = sys2(`x+y=${s.D}`, `\\frac{x}{${s.v1}}+\\frac{y}{${s.v2}}=${s.T}`);
          const wrongs = shuffle(r, [
            sys2(`x+y=${s.D}`, `\\frac{x}{${s.v2}}+\\frac{y}{${s.v1}}=${s.T}`),    // 速さの入れちがえ
            sys2(`x+y=${s.D}`, `${s.v1}x+${s.v2}y=${s.T}`),                          // 速さ×道のり
            sys2(`x+y=${s.T}`, `\\frac{x}{${s.v1}}+\\frac{y}{${s.v2}}=${s.D}`),      // 右辺の入れちがえ
            sys2(`x+y=${s.D}`, `\\frac{x}{${s.v1}}-\\frac{y}{${s.v2}}=${s.T}`),      // 時間の式が差
          ]);
          return {
            q: `家から${s.place}まで ${s.D} m ある。はじめは分速 ${s.v1} m で歩き、途中から分速 ${s.v2} m で走って、全部で ${s.T}分かかった。歩いた道のりを $x$ m、走った道のりを $y$ m とするとき、この場面を表す連立方程式は、どれか。`,
            ans: ok,
            choices: choices4(r, ok, wrongs),
            hint: "道のりの合計の式と、時間の合計の式の、2つをつくろう。時間 ＝ 道のり ÷ 速さ。",
            steps: [
              `道のりの合計が ${s.D} m だから　$x+y=${s.D}$ …①`,
              `歩いた時間 $\\frac{x}{${s.v1}}$ 分と、走った時間 $\\frac{y}{${s.v2}}$ 分の合計が ${s.T}分だから　$\\frac{x}{${s.v1}}+\\frac{y}{${s.v2}}=${s.T}$ …②`,
              `連立方程式は　${ok}`,
            ],
          };
        }),
        // 09q03 （2）の連立方程式を解こう
        t("09q03", (r) => {
          const s = walkRunScene(r);
          if (!s) return { skip: true };
          const askX = r(0, 1) === 0, v = askX ? "x" : "y";
          return {
            q: `連立方程式 ${sys2(`x+y=${s.D}`, linTex([1, s.v1], [1, s.v2], s.T))} を解いたとき、$${v}$ の値は？`,
            ans: askX ? s.x : s.y,
            hint: "②の分数を、全体に同じ数（分母の最小公倍数）をかけて、整数にしてから、加減法で解こう。",
            steps: ratioSteps({ nameX: "", nameY: "", u: "", v1: s.v1, v2: s.v2, D: s.D, T: s.T, X: s.x, Y: s.y, intro: "",
              last: `確かめ　$${s.x}\\div ${s.v1}+${s.y}\\div ${s.v2}=${s.t1}+${s.t2}=${s.T}$。解は $x=${s.x}$、$y=${s.y}$。$${v}$ の値は ${askX ? s.x : s.y}。` }),
          };
        }),
        // 09d03 一般道路と高速道路（時速 km）
        t("09d03", (r) => {
          const R = pick(r, ROAD), [v1, v2] = pick(r, KM_SPEEDS), t1 = r(1, 4), t2 = r(1, 3);
          const x = v1 * t1, y = v2 * t2, D = x + y, T = t1 + t2;
          if (D > 450) return { skip: true };
          const L = lcm(v1, v2);
          const sol = solveInt([1, 1, D], [L / v1, L / v2, L * T]);
          if (!sol || sol[0] !== x || sol[1] !== y) return { skip: true };
          const askA = r(0, 1) === 0;
          return {
            q: `${D} km の道のりを、${R.veh}で走った。${R.a}を時速 ${v1} km、${R.b}を時速 ${v2} km で走ったところ、全体で ${T}時間かかった。${askA ? R.a : R.b}の道のりは何 km か。${R.a}を $x$ km、${R.b}を $y$ km として、連立方程式で求めよう。`,
            ans: askA ? x : y,
            unit: "km",
            hint: "道のりの式と、時間の式（時間 ＝ 道のり ÷ 速さ）の、2つをつくろう。",
            steps: ratioSteps({ nameX: `${R.a}の道のり`, nameY: `${R.b}の道のり`, u: "km", v1, v2, D, T, X: x, Y: y }),
          };
        }),
        // 09w03 考えよう：歩いた時間を x 分、走った時間を y 分とおいたときの連立方程式（4択）
        t("09w03", (r) => {
          const s = walkRunScene(r);
          if (!s) return { skip: true };
          const ok = sys2(`x+y=${s.T}`, `${s.v1}x+${s.v2}y=${s.D}`);
          const wrongs = shuffle(r, [
            sys2(`x+y=${s.T}`, `${s.v2}x+${s.v1}y=${s.D}`),                          // 速さの入れちがえ
            sys2(`x+y=${s.D}`, `${s.v1}x+${s.v2}y=${s.T}`),                          // 右辺の入れちがえ
            sys2(`x+y=${s.D}`, `\\frac{x}{${s.v1}}+\\frac{y}{${s.v2}}=${s.T}`),       // 道のりを文字にしたときの式
            sys2(`x+y=${s.T}`, `\\frac{x}{${s.v1}}+\\frac{y}{${s.v2}}=${s.D}`),       // 時間を文字にしたのに、わり算にしてしまう
          ]);
          return {
            q: `家から${s.place}まで ${s.D} m ある。はじめは分速 ${s.v1} m で歩き、途中から分速 ${s.v2} m で走って、全部で ${s.T}分かかった。歩いた時間を $x$ 分、走った時間を $y$ 分とするとき、この場面を表す連立方程式は、どれか。`,
            ans: ok,
            choices: choices4(r, ok, wrongs),
            hint: "$x$、$y$ は時間。時間の合計は何分かな。歩いた道のりと走った道のりは、それぞれ速さと時間から、どう表せるかな。",
            steps: [
              `時間の合計が ${s.T}分だから　$x+y=${s.T}$ …①`,
              `歩いた道のりは $${s.v1}\\times x=${s.v1}x$（m）、走った道のりは $${s.v2}\\times y=${s.v2}y$（m）。`,
              `その合計が ${s.D} m だから　$${s.v1}x+${s.v2}y=${s.D}$ …②`,
              `連立方程式は　${ok}`,
            ],
          };
        }),
      ],
      // ───────── 3 応用 ─────────
      3: [
        // 09d04 家から駅まで ○ km。単位をそろえる
        t("09d04", (r) => {
          const h = pick(r, HOME), { v1, v2, t1, t2, D } = h, T = t1 + t2;
          const sol = solveInt([1, 1, T], [v1, v2, D]);
          if (!sol || sol[0] !== t1 || sol[1] !== t2) return { skip: true };
          const askWalk = r(0, 1) === 0, from = pick(r, ["駅", "学校", "図書館", "公園"]);
          const X = v1 * t1, Y = v2 * t2;
          return {
            q: `家から${from}までは ${D / 1000} km ある。はじめは分速 ${v1} m で歩き、途中から分速 ${v2} m の自転車に乗って、全部で ${T}分かかった。${askWalk ? "歩いた" : "自転車に乗った"}道のりは何 m か。（単位をそろえて考えよう）`,
            ans: askWalk ? X : Y,
            unit: "m",
            hint: "道のりは km、速さは分速 m。単位は、そろっているかな。文字は、道のりでも、時間でもよい。",
            steps: [
              `${D / 1000} km ＝ ${D} m（単位を m にそろえる）。歩いた時間を $x$ 分、自転車に乗った時間を $y$ 分とする。`,
              `時間　$x+y=${T}$ …①　　道のり　$${linTex(v1, v2, D)}$ …②`,
              `②−①×${v1}　${solved(v2 - v1, D - v1 * T, "y", t2)}　① に代入　$x=${t1}$`,
              `歩いた道のりは $${v1}\\times ${t1}=${X}$（m）、自転車に乗った道のりは $${v2}\\times ${t2}=${Y}$（m）。`,
            ],
          };
        }),
        // 09d05 池のまわり（出会う・追いつく）
        t("09d05", (r) => {
          const c = pick(r, POND), { x, y, t1, t2, L } = c, s = x + y, d = x - y;
          const sol = solveInt([1, 1, s], [1, -1, d]);
          if (!sol || sol[0] !== x || sol[1] !== y) return { skip: true };
          const [N1, N2] = pick(r, [["A さん", "B さん"], ["兄", "弟"], ["姉", "妹"], ["太郎さん", "花子さん"]]);   // N1 のほうが速い
          const askA = r(0, 1) === 0, ask = askA ? N1 : N2;
          return {
            q: `1周 ${L} m の池のまわりを、${N1}と${N2}が、同じ地点から同時に出発して歩く。反対向きに歩くと ${t1}分後にはじめて出会い、同じ向きに歩くと ${t2}分後に${N1}が${N2}にはじめて追いつく。${ask}の速さは、分速何 m か。${N1}の速さを分速 $x$ m、${N2}の速さを分速 $y$ m として、求めよう。`,
            ans: askA ? x : y,
            unit: "m/分",
            hint: "反対向きに歩いて出会うとき、2人の歩いた道のりの合計は、何と等しいかな。同じ向きで追いつくときは、2人の道のりの差は？",
            steps: [
              `${N1}の速さを分速 $x$ m、${N2}の速さを分速 $y$ m とする。`,
              `反対向き　$${t1}x+${t1}y=${L}$ より　$x+y=${s}$ …①　　同じ向き　$${t2}x-${t2}y=${L}$ より　$x-y=${d}$ …②`,
              `①+②　$2x=${s + d}$　$x=${x}$　① に代入　$y=${y}$`,
              `${N1}は分速 ${x} m、${N2}は分速 ${y} m。確かめ　$${t1}\\times ${s}=${L}$、$${t2}\\times ${d}=${L}$`,
            ],
          };
        }),
      ],
      // ───────── 4 入試レベル ─────────
      4: [
        // 09d06 上り坂と下り坂の往復
        t("09d06", (r) => {
          const c = pick(r, SLOPE), { u, w, x, y, go, back } = c;
          const L = lcm(u, w), a = L / u, b = L / w;
          const R1 = a * x + b * y, R2 = b * x + a * y;
          const sol = solveInt([a, b, R1], [b, a, R2]);
          if (!sol || sol[0] !== x || sol[1] !== y) return { skip: true };
          const askUp = r(0, 1) === 0;
          return {
            q: `A町から B町までは、上り坂と下り坂の道である。上りは時速 ${u} km、下りは時速 ${w} km で歩く。行きは ${fmtT(go)}、帰りは同じ道を通って ${fmtT(back)}かかった。行きの${askUp ? "上り" : "下り"}の道のりは何 km か。行きの上りの道のりを $x$ km、下りの道のりを $y$ km として、連立方程式で求めよう。`,
            ans: askUp ? x : y,
            unit: "km",
            hint: "帰りの道では、行きの上り坂と下り坂は、それぞれどうなるかな。行きと帰りで、時間の式を1つずつつくろう。",
            steps: [
              `行き　$\\frac{x}{${u}}+\\frac{y}{${w}}=${hoursTex(go)}$ …①　　帰り　$\\frac{x}{${w}}+\\frac{y}{${u}}=${hoursTex(back)}$ …②`,
              `①×${L}　$${linTex(a, b, R1)}$ …③　　②×${L}　$${linTex(b, a, R2)}$ …④`,
              `${times("③", a)}−${times("④", b)}　${solved(a * a - b * b, a * R1 - b * R2, "x", x)}　③ に代入　$y=${y}$`,
              `確かめ　行き $${x}\\div ${u}+${y}\\div ${w}$ ＝ ${fmtT(go)}、帰り $${x}\\div ${w}+${y}\\div ${u}$ ＝ ${fmtT(back)}。上りの道のりは ${x} km、下りの道のりは ${y} km。`,
            ],
          };
        }),
        // 09q05 チャレンジ：弟が出たあとで兄が追いかける
        t("09q05", (r) => {
          const c = pick(r, CHASE), { v1, v2, h, tt } = c;
          const [young, old] = pick(r, [["弟", "兄"], ["妹", "姉"]]);
          const sol = solveInt([1, -v2, 0], [1, -v1, v1 * h]);   // y−v2 x＝0、y−v1 x＝v1 h  → 解は [y, x]
          if (!sol || sol[1] !== tt) return { skip: true };
          const askTime = r(0, 2) !== 0;
          return {
            q: `${young}が家を出て ${h}分後に、${old}が同じ道を自転車で追いかけた。${young}は分速 ${v1} m、${old}は分速 ${v2} m で進む。${askTime ? `${old}が${young}に追いつくのは、${old}が出発して何分後か。` : `${old}が${young}に追いつくのは、家から何 m の地点か。`}`,
            ans: askTime ? tt : v2 * tt,
            unit: askTime ? "分後" : "m",
            hint: `追いつくとき、2人の家からの道のりは等しい。${old}が出発してから $x$ 分後に追いつくとして、${young}が進んだ時間は？`,
            steps: [
              `${old}が出発して $x$ 分後に追いつき、そのときの家からの道のりを $y$ m とする。`,
              `${old}　$y=${v2}x$ …①　　${young}　$y=${v1}(x+${h})$ …②`,
              `① を ② に代入　$${v2}x=${v1}x+${v1 * h}$　${solved(v2 - v1, v1 * h, "x", tt)}`,
              `確かめ　$${v2}\\times ${tt}=${v2 * tt}$、$${v1}\\times (${tt}+${h})=${v1 * (tt + h)}$。${old}が出発して ${tt}分後に、家から ${v2 * tt} m の地点で追いつく。`,
            ],
          };
        }),
      ],
    },
  }),
];

// 移さなかった問題（記述・説明・図が必要など、コツコツくんの入力形式で答えられないもの）
export const SKIPPED = [];   // 第9時は、演習プリント 6問・小テスト 5問のすべてを移した（式で表す問いは4択、解く問いは数で聞く）
