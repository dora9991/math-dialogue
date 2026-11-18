// ============================================================
// renritsu-02.js — 連立方程式 第2時「2つの式をたしたりひいたりして、文字を1つ消そう」（加減法・そのままたす／ひく）
//   ikkan の演習プリント（renritsu-02.dr.1〜7）・小テスト（renritsu-02.qz.1〜4）を、コツコツくんのテンプレートにしたもの。
//   テンプレート id＝「02」＋ d（演習）／q（小テスト）＋ ikkan の問題の番号（＋ 1つの問題から2つ以上つくるときは a, b…）。例：02d04a ＝ renritsu-02.dr.4 の1つ目
//   連立方程式は、解（x、y）を先に決めて係数と右辺を計算し、解は algebra.js の solve2 で出し直して一致を確かめる。解説の途中式も、係数から計算で出す。
//   式を答える問題は入力欄で打てないので、解の値（数）か、式・まちがいを選ぶ4択に直した（02d03b・02d04a）。
// ============================================================
import { t, pick, choices4, shuffle, rnz, coefVar, signedVar, signed, lcm } from "../kit.js";
import { unitFor } from "../unit-kit.js";
import { linTex, casesTex, solve2 } from "../algebra.js";
const unit = unitFor("renritsu");

// ── このファイルの小道具（式の組をつくる・解く・解説をつくる）。答えは、すべて solve2 などの計算で出す ──
/** 数に負の符号があれば、かっこをつける */
const par = (v) => (v < 0 ? `(${v})` : `${v}`);
/** 先頭の項「k×v」の TeX（k＝1 は v のみ、k＝−1 は −v） */
const mulNum = (k, v) => (k === 1 ? `${v}` : k === -1 ? `-${par(v)}` : `${k}\\times${par(v)}`);
/** 2番目以降の項「+k×v」の TeX */
const smulNum = (k, v) => (k === 1 ? `+${par(v)}` : k === -1 ? `-${par(v)}` : `${k < 0 ? "-" : "+"}${Math.abs(k)}\\times${par(v)}`);
/** ax+by に x、y の値を入れた式の TeX */
const lhsNum = (a, b, x, y) => mulNum(a, x) + smulNum(b, y);
/** 条件に合うまで作り直す（合わなければ skip） */
const gen = (fn) => (r) => {
  for (let i = 0; i < 400; i++) { const p = fn(r); if (p) return p; }
  return { skip: true };
};
/** 連立方程式を cases で（問題文用）。e＝[a, b, c] */
const SYS = (e1, e2, vars) => `$${casesTex([linTex(...e1, vars), linTex(...e2, vars)])}$`;
/** 整数の解 [x, y]（整数にならない・1つに決まらないなら null） */
const solveI = (e1, e2) => {
  const s = solve2(e1, e2);
  return s && s[0][1] === 1 && s[1][1] === 1 ? [s[0][0], s[1][0]] : null;
};
/** 4行におさめる（多いときは、前の2行を1行にする） */
const fit = (ls) => {
  const a = [...ls];
  while (a.length > 4) a.splice(0, 2, a[0] + "　" + a[1]);
  return a;
};
/** 式 e（ax+by=c）の、ki 番目の文字に val を代入する。残る文字の値 other と、代入した式 sub、整理した式 rest を返す */
const substEq = (e, ki, val, vars = ["x", "y"]) => {
  const oi = 1 - ki, kc = e[ki], oc = e[oi], ov = vars[oi];
  const rhs = e[2] - kc * val;
  if (!oc || rhs % oc !== 0) return null;
  const first = ki === 0 ? mulNum(kc, val) : coefVar(oc, ov);
  const second = ki === 0 ? signedVar(oc, ov) : smulNum(kc, val);
  return { sub: `${first}${second}=${e[2]}`, rest: oc === 1 ? null : `${coefVar(oc, ov)}=${rhs}`, other: rhs / oc };
};
/** 消す文字と、①②に何をかけるか（かける数が小さくなる文字を選ぶ。同じなら pref 番目の文字。force を渡すと、その文字を消す） */
const plan = (e1, e2, pref = 0, force = null) => {
  const cs = [0, 1].filter((k) => e1[k] && e2[k] && (force === null || k === force)).map((k) => {
    const p = Math.abs(e1[k]), q = Math.abs(e2[k]), L = lcm(p, q);
    return { k, m1: L / p, m2: L / q, cost: L / p + L / q };
  });
  cs.sort((u, v) => u.cost - v.cost || (u.k === pref ? -1 : 1) - (v.k === pref ? -1 : 1));
  return cs[0] || null;
};
/** 加減法で解く解説（かける数が1なら、そのまま）。lines＝[かけ算の行（あれば）, 消去の行, 代入の行]、sol＝解 [x, y] */
const elimSteps = (e1, e2, pref = 0, vars = ["x", "y"], force = null) => {
  const pl = plan(e1, e2, pref, force);
  if (!pl) return null;
  const { k, m1, m2 } = pl, w = 1 - k;
  const E1 = e1.map((v) => v * m1), E2 = e2.map((v) => v * m2);
  const n1 = m1 > 1 ? "③" : "①", n2 = m2 > 1 ? (m1 > 1 ? "④" : "③") : "②";
  let op, A, C;
  if (E1[k] === E2[k]) {
    if (E1[w] - E2[w] > 0) { op = `${n1}−${n2}`; A = E1[w] - E2[w]; C = E1[2] - E2[2]; }
    else { op = `${n2}−${n1}`; A = E2[w] - E1[w]; C = E2[2] - E1[2]; }
  } else if (E1[k] === -E2[k]) { op = `${n1}+${n2}`; A = E1[w] + E2[w]; C = E1[2] + E2[2]; }
  else return null;
  if (!A || C % A) return null;
  const v1 = C / A, sb = substEq(e1, w, v1, vars);
  if (!sb) return null;
  const lines = [], mult = [];
  if (m1 > 1) mult.push(`①×${m1}　$${linTex(...E1, vars)}$ …③`);
  if (m2 > 1) mult.push(`②×${m2}　$${linTex(...E2, vars)}$ …${n2}`);
  if (mult.length) lines.push(mult.join("　"));
  lines.push(`$${vars[k]}$ を消去するため、${op}　$${coefVar(A, vars[w])}=${C}$${A === 1 ? "" : `　より　$${vars[w]}=${v1}$`}`);
  lines.push(`①に $${vars[w]}=${v1}$ を代入：$${sb.sub}$　${sb.rest ? `$${sb.rest}$　` : ""}$${vars[k]}=${sb.other}$`);
  const sol = []; sol[w] = v1; sol[k] = sb.other;
  return { lines, sol, plan: pl };
};
const XY = ["x", "y"];
const ANS = (x, y) => `答えは $x=${x}$、$y=${y}$。`;
const INTRO = "上の式を①、下の式を②とする。";

// ── 加減法（そのままたす・ひく）で解ける連立方程式 ──
const sv = (r, lo, hi, neg = 0) => (r(1, 100) <= neg ? -r(lo, hi) : r(lo, hi));
/** o：e＝消す文字の係数の絶対値の範囲、p＝もう一方の係数の絶対値の範囲、s＝解の絶対値の範囲、negE・negP・negS＝負になる確率（%）、needNeg＝解に負の数をふくむ、posA＝x の係数は正だけ */
const addSubSys = (r, o) => {
  const k = r(0, 1), op = pick(r, ["add", "sub"]);
  const e = r(o.e[0], o.e[1]);
  const c1 = r(1, 100) <= (o.negE || 0) ? -e : e, c2 = op === "sub" ? c1 : -c1;
  const sg = () => (r(1, 100) <= (o.negP || 0) ? -1 : 1);
  const p1 = sg() * r(o.p[0], o.p[1]), p2 = sg() * r(o.p[0], o.p[1]);
  const x0 = sv(r, o.s[0], o.s[1], o.negS), y0 = sv(r, o.s[0], o.s[1], o.negS);
  if (o.needNeg && x0 > 0 && y0 > 0) return null;
  const [a1, b1] = k === 0 ? [c1, p1] : [p1, c1], [a2, b2] = k === 0 ? [c2, p2] : [p2, c2];
  if ((a1 < 0 && b1 < 0) || (a2 < 0 && b2 < 0)) return null;
  if (o.posA && (a1 < 0 || a2 < 0)) return null;                     // x の係数が負の式は出さない（基礎）
  const e1 = [a1, b1, a1 * x0 + b1 * y0], e2 = [a2, b2, a2 * x0 + b2 * y0];
  const s = solveI(e1, e2);
  if (!s || s[0] !== x0 || s[1] !== y0) return null;
  const pl = plan(e1, e2, k);
  if (!pl || pl.m1 !== 1 || pl.m2 !== 1) return null;
  return { e1, e2, sol: s, k };
};
const HINT = "$x$ の係数と $y$ の係数を、2つの式でくらべてみよう。2つの式をたしたり、ひいたりして、文字が1つ消えるのはどんなときかな。";
/** 「連立方程式を解いたとき、x（または y）の値は？」 */
const solveQ = (id, o) => t(id, gen((r) => {
  const S = addSubSys(r, o);
  if (!S) return null;
  const st = elimSteps(S.e1, S.e2, S.k);
  if (!st || st.sol[0] !== S.sol[0] || st.sol[1] !== S.sol[1]) return null;
  const ask = r(0, 1);
  return {
    q: `連立方程式 ${SYS(S.e1, S.e2)} を解いたとき、$${XY[ask]}$ の値は？`,
    ans: S.sol[ask],
    hint: HINT,
    steps: fit([INTRO + st.lines[0], ...st.lines.slice(1), ANS(...S.sol)]),
  };
}));

// ── 買い物の問題（おとな・子ども／えんぴつ・ノート など）──
const SHOPS = [
  { A: "おとな", uA: "人", B: "子ども", uB: "人", tot: "入園料", one: "入園料", pa: [800, 900, 1000, 1200, 1500], pb: [300, 400, 500, 600, 700] },
  { A: "えんぴつ", uA: "本", B: "ノート", uB: "冊", tot: "代金", one: "値段", pa: [40, 50, 60, 80, 90], pb: [100, 120, 150, 180, 200] },
  { A: "プリン", uA: "個", B: "ジュース", uB: "本", tot: "代金", one: "値段", pa: [120, 150, 180, 200, 250], pb: [80, 100, 120, 150] },
  { A: "りんご", uA: "個", B: "みかん", uB: "個", tot: "代金", one: "値段", pa: [100, 120, 150, 180], pb: [40, 50, 60, 70, 80] },
];
/** 2つの買い物（片方の個数が同じ）。x＝A の値段、y＝B の値段。e1・e2 が連立方程式 */
const shopSys = (r) => {
  const sh = pick(r, SHOPS), pa = pick(r, sh.pa), pb = pick(r, sh.pb);
  if (pa === pb) return null;
  const m = r(1, 4), c1 = r(1, 5), c2 = r(1, 5);
  if (c1 >= c2) return null;
  const shareA = r(0, 1) === 1;
  const cnt = shareA ? [[m, c1], [m, c2]] : [[c1, m], [c2, m]];       // [Aの数, Bの数] が2つの買い物
  const e1 = [cnt[0][0], cnt[0][1], cnt[0][0] * pa + cnt[0][1] * pb], e2 = [cnt[1][0], cnt[1][1], cnt[1][0] * pa + cnt[1][1] * pb];
  const s = solveI(e1, e2);
  if (!s || s[0] !== pa || s[1] !== pb) return null;
  const text = (c, e) => `${sh.A}${c[0]}${sh.uA}と${sh.B}${c[1]}${sh.uB}の${sh.tot}は${e[2]}円`;
  return { sh, pa, pb, e1, e2, cnt, k: shareA ? 0 : 1, text: `${text(cnt[0], e1)}、${text(cnt[1], e2)}である。`, sol: s };
};
const shopLine = (S) => `${S.sh.A}1${S.sh.uA}を $x$ 円、${S.sh.B}1${S.sh.uB}を $y$ 円とすると　$${linTex(...S.e1)}$ …①　$${linTex(...S.e2)}$ …②`;
const sat = (e, x, y) => e[0] * x + e[1] * y === e[2];
/** 買い物の連立方程式の、まちがいの選択肢（解のない組・同じ組・正解になる組は除く）。S＝shopSys の結果 */
const wrongShop = (S) => {
  const a = S.e1, b = S.e2, swap = (e) => [e[1], e[0], e[2]];
  const cands = [
    [swap(a), swap(b)],                                     // A と B の個数を入れかえた
    [[a[0], a[1], b[2]], [b[0], b[1], a[2]]],               // 代金を入れかえた
    [a, swap(b)], [swap(a), b],                             // 片方の式だけ、個数を入れかえた
    [a, [b[0], b[1], a[2] + b[2]]],                         // 代金を合計してしまった
    [[a[0], a[1], a[2] + b[2]], b],
    [a, [b[0], b[1], a[2]]],
  ];
  const key = (u, v) => [linTex(...u), linTex(...v)].sort().join("|");
  const seen = new Set([key(a, b)]), out = [];
  for (const [u, v] of cands) {
    if (sat(u, S.pa, S.pb) && sat(v, S.pa, S.pb)) continue;
    if (u[0] * v[1] - u[1] * v[0] === 0) continue;         // 解のない（平行な）組は出さない
    const k = key(u, v);
    if (seen.has(k)) continue;
    seen.add(k); out.push([u, v]);
  }
  return out;
};

// ── まちがいさがし（①−② の計算）──
const mistakeSys = (r) => {
  const k = r(0, 1), w = 1 - k;
  const a = r(2, 5), b1 = r(2, 5), b2 = -r(1, 5);
  if (b1 === -b2) return null;
  const vk = r(1, 4), vw = r(1, 5);
  const mk = (cc, bb) => (k === 0 ? [cc, bb] : [bb, cc]);
  const e1 = [...mk(a, b1), 0], e2 = [...mk(a, b2), 0];
  e1[2] = e1[0] * (k === 0 ? vk : vw) + e1[1] * (k === 0 ? vw : vk);
  e2[2] = e2[0] * (k === 0 ? vk : vw) + e2[1] * (k === 0 ? vw : vk);
  const [c1, c2] = [e1[2], e2[2]];
  if (c2 === 0 || b1 + b2 === 0) return null;
  const mis = pick(r, ["S", "R"]);
  const num = mis === "S" ? c1 - c2 : c1 + c2, den = mis === "S" ? b1 + b2 : b1 - b2;
  if (num % den !== 0) return null;
  const va = num / den;
  if (va === vw) return null;
  if ((c1 - c2) * (b1 - b2) === (c1 + c2) * (b1 + b2)) return null;     // どちらのまちがいでも同じ値になる組は使わない
  const s = solveI(e1, e2);
  if (!s || s[k] !== vk || s[w] !== vw) return null;
  return { k, w, a, b1, b2, c1, c2, e1, e2, mis, va, vw, vk, sol: s };
};
const lhsOf = (e) => linTex(...e).split("=")[0];

export const UNITS = [
  unit("02", {
    name: "加減法（そのままたす・ひく）",
    desc: "2つの式をたしたりひいたりして、文字を1つ消す",
    prereqs: ["J2-rk01"],
    points: [
      "連立方程式の2つの式を、たしたりひいたりして、文字を1つ消すことを消去という。この方法で解くのが加減法。",
      "消したい文字の係数が、同じ数ならひき算、符号だけがちがう数（たとえば $2$ と $-2$）ならたし算で、その文字が消える。",
      "1つの文字の値が求まったら、もとの式に代入して、もう1つの文字の値を求める。解を求めることを、連立方程式を解くという。",
    ],
    levels: {
      // ───────── 1 基礎 ─────────
      1: [
        // 02d01 係数が同じ／符号だけちがう文字を消して解く（6問のうちの1つ）
        solveQ("02d01", { e: [1, 3], p: [1, 5], s: [1, 6], negS: 12, posA: true }),
        // 02q01 x+y=11, x−y=5
        solveQ("02q01", { e: [1, 1], p: [1, 4], s: [1, 8], posA: true }),
      ],
      // ───────── 2 標準 ─────────
      2: [
        // 02d02 係数が大きい・負の係数がある連立方程式
        solveQ("02d02", { e: [2, 5], p: [1, 6], s: [1, 6], negE: 25, negP: 25, negS: 25 }),
        // 02d03a おとな2人と子ども1人の入園料 → それぞれの値段
        t("02d03a", gen((r) => {
          const S = shopSys(r);
          if (!S) return null;
          const st = elimSteps(S.e1, S.e2, S.k);
          if (!st || st.sol[0] !== S.sol[0] || st.sol[1] !== S.sol[1]) return null;
          const ask = r(0, 1), nm = ask === 0 ? S.sh.A : S.sh.B, u = ask === 0 ? S.sh.uA : S.sh.uB;
          return {
            q: `${S.text}${nm}1${u}の${S.sh.one}は何円か。`,
            ans: S.sol[ask],
            unit: "円",
            hint: "1個（1本）の値段を $x$、$y$ として、2つの買い物を式にしよう。そのあと、式をたしたりひいたりして、文字を1つ消せないかな。",
            steps: fit([shopLine(S), ...st.lines, `${S.sh.A}は ${S.pa}円、${S.sh.B}は ${S.pb}円。`]),
          };
        })),
        // 02d03b 連立方程式のつくり方（4択）
        t("02d03b", gen((r) => {
          const S = shopSys(r);
          if (!S) return null;
          const ok = [S.e1, S.e2];
          const cand = wrongShop(S);
          if (cand.length < 3) return null;
          const show = ([u, v]) => SYS(u, v);
          return {
            q: `${S.text}${S.sh.A}1${S.sh.uA}を $x$ 円、${S.sh.B}1${S.sh.uB}を $y$ 円として連立方程式をつくる。正しいものはどれか。`,
            ans: show(ok),
            choices: choices4(r, show(ok), cand.map(show)),
            hint: "$x$ と $y$ が何の値段か、それぞれの買い物で、$x$ の数と $y$ の数がいくつか、整理しよう。",
            steps: [`${S.sh.A}${S.cnt[0][0]}${S.sh.uA}と${S.sh.B}${S.cnt[0][1]}${S.sh.uB}の${S.sh.tot}より　$${linTex(...S.e1)}$`, `${S.sh.A}${S.cnt[1][0]}${S.sh.uA}と${S.sh.B}${S.cnt[1][1]}${S.sh.uB}の${S.sh.tot}より　$${linTex(...S.e2)}$`],
          };
        })),
        // 02q02 2x+3y=12, 2x+y=8
        solveQ("02q02", { e: [2, 4], p: [1, 5], s: [1, 6] }),
        // 02q03 4x−y=3, 3x+y=11
        solveQ("02q03", { e: [1, 2], p: [2, 6], s: [1, 6], negE: 40 }),
      ],
      // ───────── 3 応用 ─────────
      3: [
        // 02d04a A さんの①−② のまちがいは？（4択）
        t("02d04a", gen((r) => {
          const M = mistakeSys(r);
          if (!M) return null;
          const { w, k, a, b1, b2, c1, c2, e1, e2, mis, va, vw } = M;
          const vn = XY[w];
          const A = b1 - b2, C = c1 - c2;
          const stS = `ひく式 ② の $${coefVar(b2, vn)}$ の符号を変えずに、$${coefVar(b1, vn)}${signedVar(b2, vn)}$ と計算した。`;
          const stR = `右辺を、$${c1}-${par(c2)}$ ではなく $${c1}+${par(c2)}$ と計算した。`;
          const f1 = "①−② ではなく、①+② を計算するべきだった。";
          const f2 = `消去する文字を $${XY[k]}$ ではなく $${vn}$ にするべきだった。`;
          const ok = mis === "S" ? stS : stR, other = mis === "S" ? stR : stS;
          return {
            q: `A さんは、連立方程式 ${SYS(e1, e2)}（上の式が①、下の式が②）を解くために、①−② を計算して「$${vn}=${va}$」とした。まちがっているところはどれか。`,
            ans: ok,
            choices: choices4(r, ok, [other, f1, f2]),
            hint: "①−② の左辺と右辺を、自分で計算して、A さんの結果とくらべてみよう。",
            steps: [
              `${INTRO}①−② を正しく計算すると、左辺は $(${lhsOf(e1)})-(${lhsOf(e2)})=${coefVar(A, vn)}$、右辺は $${c1}-${par(c2)}=${C}$。`,
              mis === "S" ? `A さんは、${stS}` : `A さんは、${stR}`,
              `正しくは　$${coefVar(A, vn)}=${C}$　より　$${vn}=${vw}$。`,
            ],
          };
        })),
        // 02d04b 正しく解く
        t("02d04b", gen((r) => {
          const M = mistakeSys(r);
          if (!M) return null;
          const { w, k, e1, e2, va } = M;
          const st = elimSteps(e1, e2, k);
          if (!st || st.sol[0] !== M.sol[0] || st.sol[1] !== M.sol[1]) return null;
          const ask = r(0, 1);
          return {
            q: `A さんは、連立方程式 ${SYS(e1, e2)}（上の式が①、下の式が②）を、①−② を計算して「$${XY[w]}=${va}$」としたが、まちがっていた。この連立方程式を正しく解いたとき、$${XY[ask]}$ の値は？`,
            ans: M.sol[ask],
            hint: "①−② は、右辺どうしも、左辺の項どうしも、ひき算。ひく式の符号に気をつけて解きなおそう。",
            steps: fit([INTRO + st.lines[0], ...st.lines.slice(1), ANS(...M.sol)]),
          };
        })),
        // 02d05 和が37、差が9の2つの数
        t("02d05", gen((r) => {
          const small = r(5, 30), d = r(2, 14), big = small + d, S = big + small;
          const e1 = [1, 1, S], e2 = [1, -1, d];
          const st = elimSteps(e1, e2, 1);
          if (!st || st.sol[0] !== big || st.sol[1] !== small) return null;
          const askBig = r(0, 1) === 0, card = r(0, 1) === 0;
          if (!card) {
            return {
              q: `大きい数と小さい数があり、和は ${S}、差は ${d} である。${askBig ? "大きい" : "小さい"}数は？`,
              ans: askBig ? big : small,
              hint: "大きい数を $x$、小さい数を $y$ として、和と差を式にしよう。",
              steps: fit([`大きい数を $x$、小さい数を $y$ とすると　$x+y=${S}$ …①　$x-y=${d}$ …②`, ...st.lines, `大きい数 ${big}、小さい数 ${small}。`]),
            };
          }
          return {
            q: `兄と弟が持っているカードは、合わせて ${S}枚で、兄のほうが弟より ${d}枚多い。${askBig ? "兄" : "弟"}が持っているカードは何枚か。`,
            ans: askBig ? big : small,
            unit: "枚",
            hint: "兄の枚数を $x$、弟の枚数を $y$ として、合計と、ちがいを式にしよう。",
            steps: fit([`兄を $x$ 枚、弟を $y$ 枚とすると　$x+y=${S}$ …①　$x-y=${d}$ …②`, ...st.lines, `兄は ${big}枚、弟は ${small}枚。`]),
          };
        })),
      ],
      // ───────── 4 入試レベル ─────────
      4: [
        // 02d06 係数が大きい・解に負の数がある連立方程式
        solveQ("02d06", { e: [2, 6], p: [2, 7], s: [1, 8], negE: 40, negP: 40, negS: 50, needNeg: true }),
        // 02d07 解が x=2, y=1 のとき a, b
        t("02d07", gen((r) => {
          const x0 = sv(r, 1, 4, 25), y0 = sv(r, 1, 4, 25), a = sv(r, 1, 6, 25), b = sv(r, 1, 6, 25);
          if (!a || !b) return null;
          const c1 = a * x0 + b * y0, c2 = a * x0 - b * y0;
          const s = solveI([x0, y0, c1], [x0, -y0, c2]);
          if (!s || s[0] !== a || s[1] !== b) return null;
          const st = elimSteps([x0, y0, c1], [x0, -y0, c2], 0, ["a", "b"]);
          if (!st || st.sol[0] !== a || st.sol[1] !== b) return null;
          const ask = r(0, 1);
          return {
            q: `連立方程式 $\\begin{cases}ax+by=${c1}\\\\ax-by=${c2}\\end{cases}$ の解が $x=${x0}$、$y=${y0}$ であるとき、$${["a", "b"][ask]}$ の値は？`,
            ans: s[ask],
            hint: "解は、2つの式のどちらにも代入して成り立つ。$x$、$y$ の値を入れて、$a$、$b$ についての連立方程式をつくろう。",
            steps: fit([`$x=${x0}$、$y=${y0}$ を代入すると　$${linTex(x0, y0, c1, ["a", "b"])}$ …①　$${linTex(x0, -y0, c2, ["a", "b"])}$ …②`, ...st.lines, `答えは $a=${a}$、$b=${b}$。`]),
          };
        })),
        // 02q04 チャレンジ 7x−2y=−4, 3x−2y=4
        solveQ("02q04", { e: [2, 5], p: [2, 8], s: [1, 6], negE: 30, negP: 30, negS: 50, needNeg: true }),
      ],
    },
  }),
];

// 移さなかった問題：なし（演習プリント 7問・小テスト 4問のすべてを移した。式を立てる・まちがいを説明する問いは、数か4択に直した）
export const SKIPPED = [];
