// ============================================================
// renritsu-04.js — 連立方程式 第4時「式を式に代入して、文字を1つ消そう」（代入法）
//   ikkan の演習プリント（renritsu-04.dr.5〜8）・小テスト（renritsu-04.qz.1〜5）を、コツコツくんのテンプレートにしたもの。
//   （ikkan の dr.1〜4 は「2題ずつ左右にならべた」基礎・標準の問題で、問題の一覧には出ないため、同じ型を 04x01〜04x04 としてつくった）
//   テンプレート id＝「04」＋ d（演習）／q（小テスト）／x（ikkan の一覧にない基礎・標準）＋ 番号（＋ 1つの問題から2つ以上つくるときは a, b…）。例：04d05a ＝ renritsu-04.dr.5 の1つ目
//   連立方程式は、解（x、y）を先に決めて係数と右辺を計算し、解は algebra.js の solve2 で出し直して一致を確かめる。解説の途中式（かっこのつけ方・整理）も、係数から多項式の計算で出す。
//   式を答える問題は入力欄で打てないので、解の値（数）か、代入した式・まちがいを選ぶ4択に直した（04d05a・04q04a）。
// ============================================================
import { t, pick, choices4, shuffle, rnz, coefVar, signedVar, signed, lcm } from "../kit.js";
import { unitFor } from "../unit-kit.js";
import { Q, qadd, qsub, qmul, qdiv, qeq, qisint, qiszero, qtex, poly, ptex, pscale, padd, term, linTex, casesTex, solve2 } from "../algebra.js";
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

// ── 代入法の道具：「v＝m×(もう一方の文字)＋n」の式を、もう一方の式に代入する ──
const idx = (v) => (v === "x" ? 0 : 1);
const exprPoly = (m, n, ov) => poly([m, { [ov]: 1 }], [n, {}]);          // m は [分子, 分母]
const EXPR = (m, n, ov) => ptex(exprPoly(m, n, ov), [ov]);
const paren = (s) => (s.includes("\\frac") ? `\\left(${s}\\right)` : `(${s})`);
/** かっこが要るか（項が2つ以上、負の係数、または分数） */
const needP = (m, n) => n !== 0 || m[0] < 0 || m[1] !== 1;
/** B（ax+by=c）の sv の項に、式 ex を代入した式。noParen＝かっこをつけない（まちがい） */
const subTex = (B, sVar, m, n, ov, noParen = false) => {
  const ex = EXPR(m, n, ov), np = needP(m, n) && !noParen;
  let out = "";
  ["x", "y"].forEach((v, i) => {
    const k = B[i];
    if (v !== sVar) { out += i === 0 ? coefVar(k, v) : signedVar(k, v); return; }
    if (i === 0) out += k === 1 ? ex : k === -1 ? `-${np ? paren(ex) : ex}` : `${k}${np ? paren(ex) : `\\times ${ex}`}`;
    else out += k === 1 ? (ex.startsWith("-") ? `+${paren(ex)}` : `+${ex}`) : k === -1 ? `-${np ? paren(ex) : ex}` : `${k < 0 ? "-" : "+"}${Math.abs(k)}${np ? paren(ex) : `\\times ${ex}`}`;
  });
  return `${out}=${B[2]}`;
};
/** 先頭が 0 でない数を、式の値に入れた TeX：m×val＋n */
const exprNum = (m, n, val) => {
  const mv = qeq(m, Q(1)) ? `${val}` : qeq(m, Q(-1)) ? `-${val < 0 ? `(${val})` : val}` : `${qtex(m)}\\times${val < 0 ? `(${val})` : val}`;
  return `${mv}${n > 0 ? `+${n}` : n < 0 ? `-${-n}` : ""}`;
};
/** 代入法で解く解説。S＝{ sv, ov, m, n, B, std（①を x＝…の形に直す前の式 [a,b,c]、なければ null） }。lines と sol を返す */
const subSteps = (S) => {
  const { m, n, B } = S, sVar = S.sv, ov = S.ov;
  const kS = B[idx(sVar)], kO = B[idx(ov)], c = B[2];
  const al = qadd(qmul(Q(kS), m), Q(kO)), be = Q(kS * n);
  if (qiszero(al)) return null;
  const rhs = qsub(Q(c), be), ovq = qdiv(rhs, al);
  if (!qisint(ovq)) return null;
  const ov0 = ovq[0], svq = qadd(qmul(m, Q(ov0)), Q(n));
  if (!qisint(svq)) return null;
  const sv0 = svq[0], lab = S.std ? "③" : "①";
  const sc = ptex(pscale(exprPoly(m, n, ov), kS), [ov]), ot = idx(sVar) === 0 ? signedVar(kO, ov) : coefVar(kO, ov);
  const expd = idx(sVar) === 0 ? `${sc}${ot}` : `${ot}${sc.startsWith("-") ? sc : `+${sc}`}`;
  const comb = ptex(padd(pscale(exprPoly(m, n, ov), kS), term(kO, { [ov]: 1 })), [ov]);
  const aov = ptex(term(al, { [ov]: 1 }), [ov]);
  const pcs = [];
  if (expd !== comb && `${expd}=${c}` !== subTex(B, sVar, m, n, ov)) pcs.push(`${expd}=${c}`);
  pcs.push(`${comb}=${c}`);
  if (!qiszero(be)) pcs.push(`${aov}=${qtex(rhs)}`);
  if (!qeq(al, Q(1))) pcs.push(`${ov}=${ov0}`);
  const lines = [];
  if (S.std) lines.push(`① を $${sVar}=\\cdots$ の形に直すと　$${sVar}=${EXPR(m, n, ov)}$ …③`);
  lines.push(`② に ${lab} を代入：$${subTex(B, sVar, m, n, ov)}$`);
  lines.push(`整理して　${pcs.map((p) => `$${p}$`).join("　")}`);
  lines.push(`${lab}に $${ov}=${ov0}$ を代入：$${sVar}=${exprNum(m, n, ov0)}=${sv0}$`);
  const sol = []; sol[idx(ov)] = ov0; sol[idx(sVar)] = sv0;
  return { lines, sol, ov0, sv0 };
};
/** 代入法で解ける連立方程式。① が「sv＝m×ov＋n」（rearr のときは、sv の係数が 1 の標準形 [a,b,c]）、② が ax+by=c。
 *  o：sv＝代入される文字の候補、m＝[分子,分母] の候補、n＝定数項の候補、v＝もう一方の文字の値の範囲、kS・kO＝② の sv・ov の係数の候補、rearr＝① を標準形で出す、ok＝(m, n, kS, kO) の組み合わせの条件 */
const subSys = (r, o) => {
  const sVar = pick(r, o.sv || ["x", "y"]), ov = sVar === "x" ? "y" : "x";
  const m = Q(...pick(r, o.m)), n = pick(r, o.n), q = m[1];
  if (o.rearr && (m[1] !== 1 || (sVar === "y" && m[0] > 0))) return null;      // 標準形 −m x＋y＝n の x の係数が正になるように
  const ov0 = q * sv(r, o.v[0], o.v[1], o.neg || 0);
  const sv0 = m[0] * (ov0 / q) + n;
  if (!ov0 || !sv0) return null;
  const kS = pick(r, o.kS), kO = pick(r, o.kO);
  if (o.ok && !o.ok(m, n, kS, kO)) return null;
  const [x0, y0] = sVar === "x" ? [sv0, ov0] : [ov0, sv0];
  const B = sVar === "x" ? [kS, kO] : [kO, kS];
  B.push(B[0] * x0 + B[1] * y0);
  const A = sVar === "y" ? [-m[0], q, q * n] : [q, -m[0], q * n];         // ① を整数の係数の式に直したもの
  const s = solveI(A, B);
  if (!s || s[0] !== x0 || s[1] !== y0) return null;
  const std = o.rearr ? (sVar === "y" ? [-m[0], 1, n] : [1, -m[0], n]) : null;
  const S = { sv: sVar, ov, m, n, B, std, sol: s };
  S.A = std ? linTex(...std) : `${sVar}=${EXPR(m, n, ov)}`;
  S.tex = `$${casesTex([S.A, linTex(...B)])}$`;
  const st = subSteps(S);
  if (!st || st.sol[0] !== s[0] || st.sol[1] !== s[1]) return null;
  S.st = st;
  return S;
};
/** 04d05a・04d05b：代入する式の先頭が負にならない（かっこをつけないと、「×−」の形になって読みにくいため） */
const D5 = { m: [[2, 1], [3, 1], [4, 1]], n: [1, 2, 3, 4, -1, -2, -3, -4], v: [1, 4], kS: [-2, -3, -4, 2, 3, 4], kO: [1, 2, 3, 4, 5, -1, -2] };
const LAB = "（上の式が①、下の式が②）";
const SUBHINT = (S) => (S.std ? "まず、① を $x=\\cdots$ か $y=\\cdots$ の形に直そう。そのあと、② に代入する。" : `$${S.sv}=\\cdots$ の形の式を、もう一方の式の $${S.sv}$ に代入して、文字を1つ消そう。`);
/** 「連立方程式を解いたとき、x（または y）の値は？」 */
const solveQ = (id, o, hintFn, viaSub = false) => t(id, gen((r) => {
  const S = subSys(r, o);
  if (!S) return null;
  const ask = viaSub ? idx(S.ov) : r(0, 1);
  return {
    q: viaSub ? `連立方程式 ${S.tex}${LAB}で、② に ① を代入して $${S.ov}$ の値を求めると？` : `連立方程式 ${S.tex}${LAB}を、代入法で解いたとき、$${XY[ask]}$ の値は？`,
    ans: S.sol[ask],
    hint: hintFn ? hintFn(S) : SUBHINT(S),
    steps: fit([...S.st.lines, ANS(...S.sol)]),
  };
}));

export const UNITS = [
  unit("04", {
    name: "代入法",
    desc: "式を式に代入して、文字を1つ消す",
    prereqs: ["J2-rk03"],
    points: [
      "一方の式を、もう一方の式に代入して、文字を1つ消して解く方法を代入法という。$x=\\cdots$ や $y=\\cdots$ の形の式があるときは、そのまま代入できる。",
      "代入するときは、かっこをつける。たとえば $x=3y-5$ を $2x$ に代入するときは $2(3y-5)$ と書く（$2\\times3y-5$ とは、ちがう）。",
      "$x=\\cdots$ の形でない式は、変形してから代入する。1つの文字の値が求まったら、もとの式に代入して、もう1つの文字の値を求める。",
    ],
    levels: {
      // ───────── 1 基礎 ─────────
      1: [
        // 04x01（ikkan の dr.1〜2）y＝x+3, x+y＝11 ／ x＝3y, 2x+y＝14
        solveQ("04x01", { m: [[1, 1], [1, 1], [2, 1], [3, 1]], n: [0, 1, 2, 3, 4, -1, -2, -3], v: [1, 5], kS: [1, 1, 2], kO: [1, 1, -1, 2], ok: (m, n, kS) => kS === 1 || (n === 0 && m[0] > 0) }),
        // 04q01 y＝x+2, 3x+y＝14
        solveQ("04q01", { m: [[1, 1], [1, 1], [2, 1]], n: [1, 2, 3, 4, 5, -1, -2], v: [1, 6], kS: [1], kO: [2, 3, 4, 5, -1, -2] }),
      ],
      // ───────── 2 標準 ─────────
      2: [
        // 04q04a ② に ① を代入した式を選ぶ（4択）
        t("04q04a", gen((r) => {
          const S = subSys(r, { m: [[2, 1], [3, 1], [1, 1], [-1, 1], [-2, 1]], n: [1, 2, 3, 4, 5, -1, -2, -3], v: [1, 5], kS: [-1, -2, -3, 2, 3], kO: [2, 3, 4, 5, 1, -2] });
          if (!S) return null;
          const { sv: sVar, ov, m, n, B } = S;
          const ok = `$${subTex(B, sVar, m, n, ov)}$`;
          const w = [
            `$${subTex(B, sVar, m, n, ov, true)}$`,                                  // かっこをつけない
            `$${subTex(B, sVar, m, -n, ov)}$`,                                       // 定数項の符号をまちがえた
            `$${subTex(B, ov, m, n, ov)}$`,                                          // ほかの文字に代入した
            `$${subTex([-B[0], -B[1], B[2]].map((v, i) => (i === idx(sVar) ? v : B[i])), sVar, m, n, ov)}$`,   // 係数の符号をまちがえた
          ].filter((s) => s !== ok && !/--|\+-|times -/.test(s));
          const ex = EXPR(m, n, ov);
          return {
            q: `連立方程式 ${S.tex}${LAB}で、② に ① を代入した式として正しいものは、どれか。`,
            ans: ok,
            choices: choices4(r, ok, w),
            hint: `② の $${sVar}$ を、① の右辺におきかえる。代入する式は、ひとまとまり。`,
            steps: [`② の $${sVar}$ に、① の右辺 $${ex}$ を、かっこをつけて代入する。`, `${ok}`],
          };
        })),
        // 04q04b ② に ① を代入して、x（または y）の値を求める
        solveQ("04q04b", { m: [[2, 1], [3, 1], [1, 1], [-1, 1], [-2, 1]], n: [1, 2, 3, 4, 5, -1, -2, -3], v: [1, 5], kS: [-1, -2, -3, 2, 3], kO: [2, 3, 4, 5, 1, -2], rearr: false }, null, true),
        // 04x02（ikkan の dr.3〜4）y＝2x+1, 4x−3y＝−5 ／ x＝5−y, 2x−y＝−2
        solveQ("04x02", { m: [[2, 1], [3, 1], [-1, 1], [-2, 1], [1, 1]], n: [1, 2, 3, 4, 5, -1, -2, -3, -4], v: [1, 5], kS: [-3, -2, -1, 2, 3, 4], kO: [1, 2, 3, 4, 5, -1, -2] }),
        // 04q02 x＝3y+1, 2x−5y＝4
        solveQ("04q02", { sv: ["x", "y"], m: [[2, 1], [3, 1], [4, 1], [-1, 1], [-2, 1]], n: [1, 2, 3, -1, -2, -3], v: [1, 5], kS: [2, 3, 4, 5], kO: [-2, -3, -4, -5, 1, 2, 3] }),
        // 04x03（ikkan の dr.3 の左右）x+y＝9, 4x−y＝6 ／ x−2y＝−3, 3x+4y＝21 … ① を変形してから代入
        solveQ("04x03", { m: [[-1, 1], [-2, 1], [-3, 1], [2, 1], [3, 1]], n: [-3, -2, 2, 3, 4, 5, 6, 8, 9], v: [1, 6], kS: [2, 3, 4, -1, -2, -3], kO: [-1, 1, 2, 3, 4, -2, -3], rearr: true }),
        // 04q03 x−2y＝−6, 2x+y＝8
        solveQ("04q03", { m: [[2, 1], [3, 1], [-1, 1], [-2, 1], [4, 1]], n: [-1, -2, -3, -4, -5, -6, 2, 3, 4, 6], v: [1, 5], kS: [2, 3, 4, -1, -2], kO: [1, -1, 2, 3, -2, -3], rearr: true }),
        // 04x04（ikkan の dr.4 の左右）y＝3x−4, y＝−x+8 ／ x＝3y+2, x＝−2y+12 … 2つとも「文字＝…」の形
        t("04x04", gen((r) => {
          const sVar = r(0, 1) ? "x" : "y", ov = sVar === "x" ? "y" : "x";
          const m1 = pick(r, [1, 2, 3, 4, -1, -2, -3]), m2 = pick(r, [1, 2, 3, -1, -2, -3]), n1 = pick(r, [-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6]), n2 = pick(r, [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, -2, -4]);
          const al = m1 - m2;
          if (!al || (n2 - n1) % al !== 0 || m1 === m2) return null;
          const ov0 = (n2 - n1) / al, sv0 = m1 * ov0 + n1;
          if (!ov0 || !sv0 || sv0 !== m2 * ov0 + n2) return null;
          const [x0, y0] = sVar === "x" ? [sv0, ov0] : [ov0, sv0];
          const mk = (m, n) => (sVar === "y" ? [-m, 1, n] : [1, -m, n]);
          const s = solveI(mk(m1, n1), mk(m2, n2));
          if (!s || s[0] !== x0 || s[1] !== y0) return null;
          const E1 = EXPR(Q(m1), n1, ov), E2 = EXPR(Q(m2), n2, ov), ask = r(0, 1);
          const sub = ptex(poly([Q(m1 - m2), { [ov]: 1 }]), [ov]);
          return {
            q: `連立方程式 $${casesTex([`${sVar}=${E1}`, `${sVar}=${E2}`])}$${LAB}を、代入法で解いたとき、$${XY[ask]}$ の値は？`,
            ans: [x0, y0][ask],
            hint: `どちらの式も $${sVar}=\\cdots$ の形。② の $${sVar}$ に、① の右辺を代入しよう。`,
            steps: [`② の $${sVar}$ に ① を代入：$${E1}=${E2}$`, `整理して　$${sub}=${n2 - n1}$${al === 1 ? "" : `　$${ov}=${ov0}$`}`, `① に $${ov}=${ov0}$ を代入：$${sVar}=${exprNum(Q(m1), n1, ov0)}=${sv0}$`, ANS(x0, y0)],
          };
        })),
      ],
      // ───────── 3 応用 ─────────
      3: [
        // 04d05a A さんの「2x−3×4x−3＝−1」のまちがいは？（4択）
        t("04d05a", gen((r) => {
          const S = subSys(r, D5);
          if (!S) return null;
          const { sv: sVar, ov, m, n, B } = S, ex = EXPR(m, n, ov), kS = B[idx(sVar)];
          const wrong = subTex(B, sVar, m, n, ov, true), good = subTex(B, sVar, m, n, ov);
          const mono = ptex(term(m, { [ov]: 1 }), [ov]);
          const ok = `かっこをつけずに代入したので、$${kS}$ が $${ex}$ の全体にかかっていない。`;
          const wr = [`代入する文字をまちがえて、$${ov}$ に $${ex}$ を代入してしまった。`, `① の式 $${sVar}=${ex}$ を、写しまちがえた。`, `① の式の右辺と左辺を、入れかえて代入してしまった。`];
          return {
            q: `連立方程式 ${S.tex}${LAB}の ② に ① を代入して、A さんは「$${wrong}$」と書いた。A さんの式のまちがいはどれか。`,
            ans: ok,
            choices: choices4(r, ok, wr),
            hint: `$${kS}$ が、代入した式のどこにかかるのかを考えて、A さんの式と、自分で代入した式をくらべよう。`,
            steps: [`正しくは、かっこをつけて　$${good}$`, `かっこをつけないと、$${kS}$ が $${mono}$ にしかかからず、$${n}$ にかからない。`],
          };
        })),
        // 04d05b 正しく解く
        t("04d05b", gen((r) => {
          const S = subSys(r, D5);
          if (!S) return null;
          const { sv: sVar, ov, m, n, B } = S, kS = B[idx(sVar)], ask = r(0, 1);
          return {
            q: `連立方程式 ${S.tex}${LAB}の ② に ① を代入して、A さんは「$${subTex(B, sVar, m, n, ov, true)}$」と書いたが、まちがっていた。この連立方程式を、正しく解いたとき、$${XY[ask]}$ の値は？`,
            ans: S.sol[ask],
            hint: `代入する式にかっこをつけて、$${sVar}$ の係数を、式全体にかけよう。`,
            steps: fit([...S.st.lines, ANS(...S.sol)]),
          };
        })),
        // 04d06 y＝3x−1, 2x+y＝14 を、代入法と加減法の両方で
        t("04d06", gen((r) => {
          const S = subSys(r, { m: [[2, 1], [3, 1], [4, 1], [-1, 1], [-2, 1], [1, 1]], n: [-1, -2, -3, 1, 2, 3, 4], v: [1, 5], kS: [1, 1, -1], kO: [2, 3, 4, 5, 1, -2, -3] });
          if (!S) return null;
          const { sv: sVar, ov, m, n, B } = S, ask = r(0, 1);
          const A3 = sVar === "y" ? [-m[0], 1, n] : [1, -m[0], n], ki = idx(sVar), oi = idx(ov);
          const sub = B[ki] === 1;                                                      // 同じ係数ならひく、反対なら たす
          const Aco = sub ? B[oi] - A3[oi] : B[oi] + A3[oi], C = sub ? B[2] - A3[2] : B[2] + A3[2];
          if (!Aco || C % Aco !== 0 || C / Aco !== S.st.ov0) return null;
          return {
            q: `連立方程式 ${S.tex}${LAB}を、代入法と加減法の両方で解いて、答えを比べる。どちらの方法でも同じ解になるとき、$${XY[ask]}$ の値は？`,
            ans: S.sol[ask],
            hint: "代入法では ② に ① を代入し、加減法では ① を変形して、$x$ か $y$ の係数をそろえる。",
            steps: fit([`代入法　${S.st.lines[0]}`, ...S.st.lines.slice(1), `加減法　① を変形して　$${linTex(...A3)}$ …③　$${sVar}$ を消去するため、②${sub ? "−" : "+"}③　$${coefVar(Aco, ov)}=${C}$　$${ov}=${S.st.ov0}$`, `${ANS(...S.sol)}どちらの方法でも、同じ解になる。`]),
          };
        })),
      ],
      // ───────── 4 入試レベル ─────────
      4: [
        // 04d07 x+2y＝11, 3(x+2y)−y＝31 … x+2y を 11 におきかえる
        t("04d07", gen((r) => {
          const pat = r(0, 1), p = pick(r, [2, 3, -2, -3]), k = pick(r, [2, 3, 4]), s = pick(r, [1, -1, 2, -2]);
          const x0 = sv(r, 1, 5, 25), y0 = sv(r, 1, 5, 25);
          const [u, w] = pat === 0 ? [1, p] : [p, 1], z = pat === 0 ? "y" : "x", z0 = pat === 0 ? y0 : x0;
          const c1 = u * x0 + w * y0, c2 = k * c1 + s * z0;
          const e1 = [u, w, c1], e2 = [k * u + (z === "x" ? s : 0), k * w + (z === "y" ? s : 0), c2];
          const sol = solveI(e1, e2);
          if (!sol || sol[0] !== x0 || sol[1] !== y0) return null;
          const blk = ptex(poly([u, { x: 1 }], [w, { y: 1 }]), ["x", "y"]);
          const sb = substEq(e1, idx(z), z0);
          if (!sb) return null;
          const ask = r(0, 1);
          return {
            q: `連立方程式 $${casesTex([`${blk}=${c1}`, `${k}(${blk})${signedVar(s, z)}=${c2}`])}$${LAB}を解いたとき、$${XY[ask]}$ の値は？`,
            ans: sol[ask],
            hint: "② の中に、① の左辺と同じ形の式がある。ひとまとまりと見て、おきかえられないかな。",
            steps: [`$${blk}$ は ① より $${c1}$ と同じ。② の $${blk}$ に $${c1}$ を代入：$${k}\\times${c1 < 0 ? `(${c1})` : c1}${signedVar(s, z)}=${c2}$`, `$${k * c1}${signedVar(s, z)}=${c2}$${s === 1 ? "" : `　$${coefVar(s, z)}=${c2 - k * c1}$`}　$${z}=${z0}$`, `① に $${z}=${z0}$ を代入：$${sb.sub}$　${sb.rest ? `$${sb.rest}$　` : ""}$${z === "x" ? "y" : "x"}=${sb.other}$`, ANS(x0, y0)],
          };
        })),
        // 04d08 y＝(1/2)x+1, 3x−4y＝−2（分数をふくむ式を代入）
        solveQ("04d08", { m: [[1, 2], [1, 3], [3, 2], [2, 3], [-1, 2]], n: [1, 2, 3, -1, -2, -3, 4], v: [1, 4], neg: 20, kS: [-2, -3, -4, -6, 2, 3, 4, 6], kO: [2, 3, 4, 5, 1, -2, -3], ok: (m, n, kS) => (kS * m[0]) % m[1] === 0 }, (S) => `$${S.sv}=\\cdots$ の式の右辺に分数がある。② に代入するときは、かっこをつけて、$${S.sv}$ の係数をかけよう。`),
        // 04q05 チャレンジ x＝(1/3)y+2, 3x−4y＝−12
        solveQ("04q05", { m: [[1, 3], [1, 4], [2, 3], [1, 2], [-1, 3]], n: [1, 2, 3, 4, -1, -2, -3], v: [1, 4], neg: 20, kS: [3, 4, 6, -2, -3, -4, 2, 6], kO: [-4, -3, -2, 2, 3, 4, 5], sv: ["x", "y"], ok: (m, n, kS) => (kS * m[0]) % m[1] === 0 }, (S) => `$${S.sv}=\\cdots$ の式の右辺に分数がある。② に代入するときは、かっこをつけて、$${S.sv}$ の係数をかけよう。`),
      ],
    },
  }),
];

// 移さなかった問題：なし（演習プリント 4問・小テスト 5問のすべてを移した。「まちがいを説明する」「代入した式を書く」問いは、まちがいを選ぶ4択・代入した式を選ぶ4択に直した）
export const SKIPPED = [];
