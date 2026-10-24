// ============================================================
// renritsu-03.js — 連立方程式 第3時「式を何倍かして、文字を1つ消そう」（加減法・係数をそろえる）
//   ikkan の演習プリント（renritsu-03.dr.1〜7）・小テスト（renritsu-03.qz.1〜4）を、コツコツくんのテンプレートにしたもの。
//   テンプレート id＝「03」＋ d（演習）／q（小テスト）＋ ikkan の問題の番号（＋ 1つの問題から2つ以上つくるときは a, b…）。例：03d04a ＝ renritsu-03.dr.4 の1つ目
//   連立方程式は、解（x、y）を先に決めて係数と右辺を計算し、解は algebra.js の solve2 で出し直して一致を確かめる。
//   何倍するか・どの文字を消すかは、係数から計算で決め（かける数がいちばん小さい文字）、解説の途中式も計算で出す。
//   式を答える問題は入力欄で打てないので、解の値（数）か、まちがいの場所・式・かける数を選ぶ4択に直した（03d03b・03d04a・03d05b）。
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

const sv = (r, lo, hi, neg = 0) => (r(1, 100) <= neg ? -r(lo, hi) : r(lo, hi));
const nice = (e1, e2) => !((e1[0] < 0 && e1[1] < 0) || (e2[0] < 0 && e2[1] < 0));   // 「−3x−2y」のように、両方負の式は出さない

// ── 片方の式だけを何倍かすればよい連立方程式 ──
/** o：sm＝小さいほうの係数の絶対値の範囲、m＝倍率の範囲、p＝もう一方の文字の係数の絶対値の範囲、s＝解の絶対値の範囲、negS・negB・negP・negX＝負になる確率（%） */
const mult1Sys = (r, o) => {
  const k = r(0, 1), j = r(0, 1);                      // k＝消す文字（0＝x, 1＝y）、j＝何倍かする式（0＝上、1＝下）
  const m = r(o.m[0], o.m[1]), sm = r(o.sm[0], o.sm[1]);
  const cs = (r(1, 100) <= (o.negS || 0) ? -1 : 1) * sm, cb = (r(1, 100) <= (o.negB || 0) ? -1 : 1) * sm * m;
  const ce = j === 0 ? [cs, cb] : [cb, cs];             // 消す文字の係数 [上, 下]
  const sg = () => (r(1, 100) <= (o.negP || 0) ? -1 : 1);
  const po = [sg() * r(o.p[0], o.p[1]), sg() * r(o.p[0], o.p[1])];
  const x0 = sv(r, o.s[0], o.s[1], o.negX), y0 = sv(r, o.s[0], o.s[1], o.negX);
  if (o.needNeg && x0 > 0 && y0 > 0) return null;
  const mk = (i) => (k === 0 ? [ce[i], po[i]] : [po[i], ce[i]]);
  const e1 = mk(0), e2 = mk(1);
  e1.push(e1[0] * x0 + e1[1] * y0); e2.push(e2[0] * x0 + e2[1] * y0);
  if (!nice(e1, e2)) return null;
  const s = solveI(e1, e2);
  if (!s || s[0] !== x0 || s[1] !== y0) return null;
  const pl = plan(e1, e2, k);
  if (!pl || pl.k !== k || pl.m1 !== (j === 0 ? m : 1) || pl.m2 !== (j === 1 ? m : 1)) return null;
  return { e1, e2, sol: s, k, j, m };
};
// ── 両方の式を何倍かする連立方程式 ──
/** o：c＝消す文字の係数の絶対値の範囲、p＝もう一方の文字の係数の絶対値の範囲、s＝解の絶対値の範囲、negC・negP・negX＝負になる確率（%） */
const mult2Sys = (r, o) => {
  const k = r(0, 1);
  const pa = r(o.c[0], o.c[1]), qa = r(o.c[0], o.c[1]);
  if (pa === qa || pa % qa === 0 || qa % pa === 0) return null;
  const sc = () => (r(1, 100) <= (o.negC || 0) ? -1 : 1), sg = () => (r(1, 100) <= (o.negP || 0) ? -1 : 1);
  const ce = [sc() * pa, sc() * qa], po = [sg() * r(o.p[0], o.p[1]), sg() * r(o.p[0], o.p[1])];
  const x0 = sv(r, o.s[0], o.s[1], o.negX), y0 = sv(r, o.s[0], o.s[1], o.negX);
  if (o.needNeg && x0 > 0 && y0 > 0) return null;
  const mk = (i) => (k === 0 ? [ce[i], po[i]] : [po[i], ce[i]]);
  const e1 = mk(0), e2 = mk(1);
  e1.push(e1[0] * x0 + e1[1] * y0); e2.push(e2[0] * x0 + e2[1] * y0);
  if (!nice(e1, e2)) return null;
  const s = solveI(e1, e2);
  if (!s || s[0] !== x0 || s[1] !== y0) return null;
  const pl = plan(e1, e2, k);
  if (!pl || pl.m1 < 2 || pl.m2 < 2) return null;
  return { e1, e2, sol: s, k, m1: pl.m1, m2: pl.m2 };
};
const HINT = "そのままでは、たしてもひいても文字が消えない。式の両辺に同じ数をかけて、ある文字の係数をそろえられないかな。右辺にもかけたかな。";
/** 「連立方程式を解いたとき、x（または y）の値は？」。gen＝連立方程式をつくる関数 */
const solveQ = (id, mk, o) => t(id, gen((r) => {
  const S = mk(r, o);
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

// ── 買い物の問題（どちらも個数がちがう）──
const SHOPS = [
  { A: "おにぎり", uA: "個", B: "お茶", uB: "本", pa: [110, 120, 130, 140, 150], pb: [90, 100, 110, 120] },
  { A: "ケーキ", uA: "個", B: "ジュース", uB: "本", pa: [250, 300, 350, 400], pb: [100, 120, 150, 180] },
  { A: "えんぴつ", uA: "本", B: "消しゴム", uB: "個", pa: [40, 50, 60, 70, 80], pb: [60, 80, 90, 100, 120] },
  { A: "パン", uA: "個", B: "牛乳", uB: "本", pa: [120, 140, 160, 180], pb: [90, 100, 110, 130] },
];
const shopSys = (r) => {
  const sh = pick(r, SHOPS), pa = pick(r, sh.pa), pb = pick(r, sh.pb);
  if (pa === pb) return null;
  const c = [[r(1, 5), r(1, 5)], [r(1, 5), r(1, 5)]];
  if (c[0][0] === c[1][0] || c[0][1] === c[1][1]) return null;
  if (c[0][0] === c[1][1] && c[0][1] === c[1][0]) return null;                 // 個数が (a, b) と (b, a) の組は出さない
  const e1 = [c[0][0], c[0][1], c[0][0] * pa + c[0][1] * pb], e2 = [c[1][0], c[1][1], c[1][0] * pa + c[1][1] * pb];
  if (e1[2] === e2[2]) return null;                                            // 2つの代金が同じ組は出さない
  const s = solveI(e1, e2);
  if (!s || s[0] !== pa || s[1] !== pb) return null;
  const text = (cc, e) => `${sh.A}${cc[0]}${sh.uA}と${sh.B}${cc[1]}${sh.uB}の代金は${e[2]}円`;
  return { sh, pa, pb, e1, e2, cnt: c, text: `${text(c[0], e1)}、${text(c[1], e2)}である。`, sol: s };
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

export const UNITS = [
  unit("03", {
    name: "加減法（式を何倍かして係数をそろえる）",
    desc: "式の両辺を何倍かして、文字を1つ消す",
    prereqs: ["J2-rk02"],
    points: [
      "そのままではたしてもひいても文字が消えないときは、式の両辺に同じ数をかけて、消したい文字の係数の絶対値をそろえる。これは、等式の性質（両辺に同じ数をかけても等式は成り立つ）を使っている。",
      "式を何倍かするときは、左辺のすべての項と、右辺にも、同じ数をかける。右辺にかけわすれないこと。",
      "係数がそろったら、同じ符号ならひき算、ちがう符号ならたし算で文字を1つ消去する（加減法）。そのあとは、1つの文字の値を求めて、もとの式に代入して、もう1つの文字の値を求める。",
    ],
    levels: {
      // ───────── 1 基礎 ─────────
      1: [
        // 03d01 片方の式を何倍かして解く
        solveQ("03d01", mult1Sys, { sm: [1, 2], m: [2, 3], p: [1, 5], s: [1, 5], negS: 25, negX: 12 }),
        // 03q01 x+y=7, 4x+3y=24
        solveQ("03q01", mult1Sys, { sm: [1, 1], m: [2, 4], p: [1, 5], s: [1, 6] }),
        // 03q02 2x−3y=1, x+2y=11
        solveQ("03q02", mult1Sys, { sm: [1, 2], m: [2, 2], p: [1, 4], s: [1, 6], negP: 25 }),
      ],
      // ───────── 2 標準 ─────────
      2: [
        // 03d02 両方の式を何倍かして解く
        solveQ("03d02", mult2Sys, { c: [2, 5], p: [1, 5], s: [1, 5], negC: 25, negP: 25, negX: 25 }),
        // 03d03a おにぎり4個とお茶3本の代金 → それぞれの値段
        t("03d03a", gen((r) => {
          const S = shopSys(r);
          if (!S) return null;
          const st = elimSteps(S.e1, S.e2, 1);
          if (!st || st.sol[0] !== S.sol[0] || st.sol[1] !== S.sol[1]) return null;
          const ask = r(0, 1), nm = ask === 0 ? S.sh.A : S.sh.B, u = ask === 0 ? S.sh.uA : S.sh.uB;
          return {
            q: `${S.text}${nm}1${u}の値段は何円か。`,
            ans: S.sol[ask],
            unit: "円",
            hint: "1個（1本）の値段を $x$、$y$ として、2つの買い物を式にしよう。そのあと、文字を1つ消すには、どうすればよいかな。",
            steps: fit([shopLine(S), ...st.lines, `${S.sh.A}は ${S.pa}円、${S.sh.B}は ${S.pb}円。`]),
          };
        })),
        // 03d03b 連立方程式のつくり方（4択）
        t("03d03b", gen((r) => {
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
            steps: [`${S.sh.A}${S.cnt[0][0]}${S.sh.uA}と${S.sh.B}${S.cnt[0][1]}${S.sh.uB}の代金より　$${linTex(...S.e1)}$`, `${S.sh.A}${S.cnt[1][0]}${S.sh.uA}と${S.sh.B}${S.cnt[1][1]}${S.sh.uB}の代金より　$${linTex(...S.e2)}$`],
          };
        })),
        // 03q03 3x+4y=2, 5x−6y=16
        solveQ("03q03", mult2Sys, { c: [2, 6], p: [2, 6], s: [1, 5], negC: 30, negP: 30, negX: 30 }),
      ],
      // ───────── 3 応用 ─────────
      3: [
        // 03d04a A さんの「②×3」のまちがいは？（4択）
        t("03d04a", gen((r) => {
          const S = mult1Sys(r, { sm: [1, 3], m: [2, 4], p: [1, 5], s: [1, 5], negS: 30, negP: 25, negX: 12 });
          if (!S) return null;
          const { e1, e2, j, m } = S, e = j === 0 ? e1 : e2, lab = j === 0 ? "①" : "②";
          const place = pick(r, ["x", "y", "rhs"]);
          if (place === "rhs" && e[2] === 0) return null;
          const good = [e[0] * m, e[1] * m, e[2] * m], bad = [...good];
          if (place === "x") bad[0] = e[0]; else if (place === "y") bad[1] = e[1]; else bad[2] = e[2];
          const stmt = { x: `$x$ の項に $${m}$ をかけていない。`, y: `$y$ の項に $${m}$ をかけていない。`, rhs: `右辺に $${m}$ をかけていない。` };
          const wrong4 = `かけた数 $${m}$ がまちがっている。`;
          const ok = stmt[place];
          return {
            q: `連立方程式 ${SYS(e1, e2)}（上の式が①、下の式が②）で、A さんは「${lab}×${m}」として、$${linTex(...bad)}$ …③ と書いた。まちがっているところはどれか。`,
            ans: ok,
            choices: choices4(r, ok, [stmt.x, stmt.y, stmt.rhs, wrong4].filter((s) => s !== ok)),
            hint: `${lab} の $x$ の項・$y$ の項・右辺を、それぞれ ${m} 倍した値と、A さんの式をくらべてみよう。`,
            steps: [`${lab}×${m} は、両辺のすべての項に ${m} をかけるので　$${linTex(...good)}$ …③`, `A さんの式は、${place === "rhs" ? "右辺" : `$${place}$ の項`}に ${m} がかかっていない。`],
          };
        })),
        // 03d04b 正しく解く
        t("03d04b", gen((r) => {
          const S = mult1Sys(r, { sm: [1, 3], m: [2, 4], p: [1, 5], s: [1, 5], negS: 30, negP: 25, negX: 12 });
          if (!S) return null;
          const st = elimSteps(S.e1, S.e2, S.k);
          if (!st || st.sol[0] !== S.sol[0] || st.sol[1] !== S.sol[1]) return null;
          const ask = r(0, 1), lab = S.j === 0 ? "①" : "②";
          return {
            q: `連立方程式 ${SYS(S.e1, S.e2)}（上の式が①、下の式が②）を、${lab}×${S.m} を使って解く。右辺にも ${S.m} をかけて、正しく解いたとき、$${XY[ask]}$ の値は？`,
            ans: S.sol[ask],
            hint: HINT,
            steps: fit([INTRO + st.lines[0], ...st.lines.slice(1), ANS(...S.sol)]),
          };
        })),
        // 03d05a x を消去する方法でも、y を消去する方法でも、同じ解
        t("03d05a", gen((r) => {
          const S = mult2Sys(r, { c: [2, 5], p: [2, 5], s: [1, 5], negC: 25, negP: 25, negX: 30 });
          if (!S) return null;
          const sx = elimSteps(S.e1, S.e2, 0, XY, 0), sy = elimSteps(S.e1, S.e2, 1, XY, 1);
          if (!sx || !sy || sx.sol[0] !== S.sol[0] || sx.sol[1] !== S.sol[1] || sy.sol[0] !== S.sol[0] || sy.sol[1] !== S.sol[1]) return null;
          const head = (st) => st.lines.slice(0, -1).join("　");
          const sum = S.sol[0] + S.sol[1];
          return {
            q: `連立方程式 ${SYS(S.e1, S.e2)} を、$x$ を消去する方法と、$y$ を消去する方法の、両方で解く。求めた $x$ の値と $y$ の値の和は？`,
            ans: sum,
            hint: HINT,
            steps: [`${INTRO}$x$ を消去する方法　${head(sx)}`, `$y$ を消去する方法　${head(sy)}`, ANS(...S.sol), `和は　$${S.sol[0]}+${par(S.sol[1])}=${sum}$`],
          };
        })),
        // 03d05b y を消去するには、①、②を何倍するか（4択）
        t("03d05b", gen((r) => {
          const S = mult2Sys(r, { c: [2, 6], p: [2, 6], s: [1, 5], negC: 25, negP: 25, negX: 30 });
          if (!S) return null;
          const k = S.k, pl = plan(S.e1, S.e2, k, k), po = plan(S.e1, S.e2, 1 - k, 1 - k);
          const txt = (a, b) => `①×${a}、②×${b}`;
          const works = (a, b) => Math.abs(S.e1[k] * a) === Math.abs(S.e2[k] * b);
          const ok = txt(pl.m1, pl.m2);
          const wrongs = [[pl.m2, pl.m1], [po.m1, po.m2], [pl.m1 + 1, pl.m2], [pl.m1, pl.m2 + 1], [pl.m1 + 1, pl.m2 + 1]]
            .filter(([a, b]) => !works(a, b)).map(([a, b]) => txt(a, b));
          return {
            q: `連立方程式 ${SYS(S.e1, S.e2)}（上の式が①、下の式が②）で、$${XY[k]}$ を消去するために、①、②をそれぞれ何倍すればよいか。ただし、かける数は、いちばん小さくする。`,
            ans: ok,
            choices: choices4(r, ok, wrongs),
            hint: `①、②の $${XY[k]}$ の係数の絶対値を、同じ数にするには、それぞれ何倍すればよいかな。`,
            steps: [`$${XY[k]}$ の係数は、①が $${S.e1[k]}$、②が $${S.e2[k]}$。絶対値の最小公倍数は $${lcm(Math.abs(S.e1[k]), Math.abs(S.e2[k]))}$。`, `①を ${pl.m1} 倍、②を ${pl.m2} 倍すると、$${XY[k]}$ の係数の絶対値が ${lcm(Math.abs(S.e1[k]), Math.abs(S.e2[k]))} でそろう。`],
          };
        })),
      ],
      // ───────── 4 入試レベル ─────────
      4: [
        // 03d06 係数が大きい・解に負の数がある連立方程式
        solveQ("03d06", mult2Sys, { c: [3, 7], p: [2, 7], s: [1, 6], negC: 40, negP: 40, negX: 50, needNeg: true }),
        // 03d07 ax+by=4, bx−ay=7 の解が x=2, y=−1
        t("03d07", gen((r) => {
          const x0 = sv(r, 1, 3, 40), y0 = sv(r, 1, 3, 40), a = sv(r, 1, 5, 30), b = sv(r, 1, 5, 30);
          if (!a || !b || a === b) return null;
          const c1 = a * x0 + b * y0, c2 = b * x0 - a * y0;
          const f1 = [x0, y0, c1], f2 = [-y0, x0, c2];
          const s = solveI(f1, f2);
          if (!s || s[0] !== a || s[1] !== b) return null;
          const st = elimSteps(f1, f2, 0, ["a", "b"]);
          if (!st || st.sol[0] !== a || st.sol[1] !== b) return null;
          const ask = r(0, 1);
          return {
            q: `連立方程式 $\\begin{cases}ax+by=${c1}\\\\bx-ay=${c2}\\end{cases}$ の解が $x=${x0}$、$y=${y0}$ であるとき、$${["a", "b"][ask]}$ の値は？`,
            ans: s[ask],
            hint: "解は、2つの式のどちらにも代入して成り立つ。$x$、$y$ の値を入れて、$a$、$b$ についての連立方程式をつくろう。",
            steps: fit([`$x=${x0}$、$y=${y0}$ を代入すると　$${linTex(...f1, ["a", "b"])}$ …①　$${linTex(...f2, ["a", "b"])}$ …②`, ...st.lines, `答えは $a=${a}$、$b=${b}$。`]),
          };
        })),
        // 03q04 チャレンジ 5x+7y=−1, 3x+4y=0
        solveQ("03q04", mult2Sys, { c: [3, 8], p: [3, 8], s: [1, 6], negC: 30, negP: 30, negX: 50, needNeg: true }),
      ],
    },
  }),
];

// 移さなかった問題：なし（演習プリント 7問・小テスト 4問のすべてを移した。式を立てる・まちがいを説明する問いは、数か4択に直した）
export const SKIPPED = [];
