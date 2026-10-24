// ============================================================
// renritsu-06.js — 連立方程式 第6時「A＝B＝C の形の方程式を解こう」
//   ikkan の演習プリント（renritsu-06.dr.1〜8）・小テスト（renritsu-06.qz.1〜5）を、コツコツくんのテンプレートにしたもの。
//   テンプレート id＝「06」＋ d（演習）／q（小テスト）＋ ikkan の問題の番号（＋ a, b…）
//     06d01 … dr.1　06d02 … dr.2　06d03・06d04 … dr.3・dr.4　06d05〜08 … dr.5〜8　06q01〜05 … qz.1〜5
//   （演習の（1）（3）（4）は、「1つ目・2つ目」の2題の組。1つのテンプレートで両方の型が出るようにしてある。dr.4 は、A＝B の文字が消える形（3x+y＝4x+y−2＝5x）も出す）
//   A＝B＝C の方程式は、解 (x, y) を先に決めて、3つの式 A・B・C がすべて同じ値 K になるように数を決めてつくる。
//   画面の式 A＝B、B＝C（または A＝C、B＝C）から整数の係数の式を取り出して solve2 で解き直し、解と合うことを確かめてから出す。
//   「連立方程式の組に直そう」（dr.2・qz.3）は式を答える問題なので、正しい組を選ぶ4択（qz.3 は「正しくない組」を選ぶ4択）にした。
//   「a、b の値」「a と y の値」は、聞くほうを毎回ランダムに（a か b、a か y）。
// ============================================================
import { t, pick, choices4, shuffle, rnz, lcm, coefVar } from "../kit.js";
import { unitFor } from "../unit-kit.js";
import { linTex, casesTex, solve2 } from "../algebra.js";

const unit = unitFor("renritsu");

// ── 道具 ───────────────────────────────────────────
const TX = (s) => `$${s}$`;
const J = (...ps) => ps.filter((p) => p !== "" && p != null).reduce((s, p, i) => (i === 0 ? p : s + (p[0] === "-" ? p : "+" + p)), "");
const XY = ["x", "y"];
const eqT = (e, nm = XY) => linTex(e[0], e[1], e[2], nm);
const cases2 = (a, b) => TX(casesTex([a, b]));
const fm = (n) => String(n).replace("-", "−");
const frac = (n, d) => `\\frac{${n}}{${d}}`;
const R = (lo, hi) => Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
const NZ = (lo, hi) => R(lo, hi).filter((v) => v !== 0);
const uniq = (e1, e2) => { const s = solve2(e1, e2); return !!s && s[0][1] === 1 && s[1][1] === 1; };
const solPick = (r, lo, hi, neg = 0) => {
  for (;;) {
    const f = () => { const v = r(lo, hi); return neg && r(1, 100) <= neg ? -v : v; };
    const s = [f(), f()];
    if (s[0] !== s[1]) return s;
  }
};
const askXY = (r, sol) => { const k = r(0, 1); return { w: XY[k], v: sol[k] }; };

/** 整数の係数の式 e1, e2（文字は nm）を、加減法で解く解説（2行） */
const solveLines = (e1, e2, nm = XY) => {
  const s = solve2(e1, e2);
  if (!s || s[0][1] !== 1 || s[1][1] !== 1) throw new Error(`解が整数でない ${JSON.stringify([e1, e2])}`);
  const sol = [s[0][0], s[1][0]];
  // 片方の式が 1 つの文字だけの式（-x=-2 など）のとき：その式から 1 つの文字が決まる
  const z = [e1, e2].findIndex((e) => e[0] === 0 || e[1] === 0);
  if (z >= 0) {
    const e = [e1, e2][z], o = [e1, e2][1 - z], k = e[0] === 0 ? 1 : 0, w = 1 - k;
    if (e[2] % e[k] !== 0 || e[2] / e[k] !== sol[k]) throw new Error(`1文字の式が合わない ${JSON.stringify([e1, e2])}`);
    const fin = `よって、${TX(`${nm[0]}=${sol[0]}`)}、${TX(`${nm[1]}=${sol[1]}`)}。`;
    return [
      `${TX(eqT(e, nm))} より ${TX(`${nm[k]}=${sol[k]}`)}。`,
      o[k] === 0 ? `${TX(eqT(o, nm))} より ${TX(`${nm[w]}=${sol[w]}`)}。${fin}` : `${TX(eqT(o, nm))} に ${TX(`${nm[k]}=${sol[k]}`)} を代入して ${TX(`${nm[w]}=${sol[w]}`)}。${fin}`,
    ];
  }
  const plans = [0, 1].map((k) => {
    const p1 = e1[k], p2 = e2[k];
    if (p1 === 0 || p2 === 0) return null;
    const L = lcm(Math.abs(p1), Math.abs(p2)), m1 = L / Math.abs(p1), m2 = L / Math.abs(p2);
    return { k, m1, m2, L, same: p1 > 0 === p2 > 0, cost: (m1 > 1 ? 1 : 0) + (m2 > 1 ? 1 : 0) };
  }).filter(Boolean);
  if (!plans.length) throw new Error(`消去できない ${JSON.stringify([e1, e2])}`);
  plans.sort((a, b) => a.cost - b.cost || a.L - b.L || b.k - a.k);
  const P = plans[0], k = P.k, w = 1 - k;
  const E1 = e1.map((v) => v * P.m1), E2 = e2.map((v) => v * P.m2), sg = P.same ? -1 : 1;
  const kk = E1[w] + sg * E2[w], n = E1[2] + sg * E2[2];
  if (kk === 0 || n % kk !== 0 || n / kk !== sol[w]) throw new Error(`消去が合わない ${JSON.stringify([e1, e2])}`);
  const mul = (e, E, m) => (m > 1 ? `${TX(eqT(e, nm))} を ${m} 倍して ${TX(eqT(E, nm))}、` : "");
  const l1 = `${TX(nm[k])} を消去する。${mul(e1, E1, P.m1)}${mul(e2, E2, P.m2)}${TX(eqT(E1, nm))} と ${TX(eqT(E2, nm))} を${P.same ? "ひく" : "たす"}と ${kk === 1 ? "" : `${TX(`${coefVar(kk, nm[w])}=${n}`)} より `}${TX(`${nm[w]}=${sol[w]}`)}。`;
  const pe = Math.abs(e1[k]) <= Math.abs(e2[k]) ? e1 : e2;
  const l2 = `${TX(eqT(pe, nm))} に ${TX(`${nm[w]}=${sol[w]}`)} を代入して ${TX(`${nm[k]}=${sol[k]}`)}。よって、${TX(`${nm[0]}=${sol[0]}`)}、${TX(`${nm[1]}=${sol[1]}`)}。`;
  return [l1, l2];
};

// ── A＝B＝C のつくりかた ───────────────────────────────────
// 1つの式（スロット）は [a, b, c] ＝ ax + by + c
const slotT = ([a, b, c]) => J(a ? coefVar(a, "x") : "", b ? coefVar(b, "y") : "", c ? String(c) : "") || "0";
const slotV = ([a, b, c], sol) => a * sol[0] + b * sol[1] + c;
/** S＝T を ax+by=c の形にした [a, b, c] */
const slotEq = (S, T) => [S[0] - T[0], S[1] - T[1], T[2] - S[2]];
/** 解 sol で値 K になる式の候補（係数 a, b の範囲と、定数項 c の許す値から） */
const cand = (spc, sol, K) => {
  const out = [];
  for (const a of spc.a) for (const b of spc.b) {
    if (!a && !b) continue;
    if (spc.one && a && b) continue;
    const c = K - a * sol[0] - b * sol[1];
    if (spc.c.includes(c)) out.push([a, b, c]);
  }
  return out;
};
/** A＝B＝C をつくる。sp.C が "const" なら C は数 K。解 sol で A・B・C はすべて K */
const tripleGen = (r, solFn, sp, zero = false) => {
  let sol = solFn();
  for (let n = 0; n < 6000; n++) {
    if (n % 8 === 7) sol = solFn();
    const A = [pick(r, sp.A.a), pick(r, sp.A.b), pick(r, sp.A.c)];
    if (!A[0] && !A[1]) continue;
    const K = slotV(A, sol);
    if (Math.abs(K) > 60 || K === 0) continue;
    const cb = cand(sp.B, sol, K);
    if (!cb.length) continue;
    const B = pick(r, cb);
    let C;
    if (sp.C === "const") C = [0, 0, K];
    else { const cc = cand(sp.C, sol, K); if (!cc.length) continue; C = pick(r, cc); }
    // 組：C が数なら (A＝C, B＝C)、そうでなければ (A＝B, B＝C)
    const cst = sp.C === "const";
    const eA = cst ? slotEq(A, C) : slotEq(A, B), eB = slotEq(B, C);
    // 係数 0（1つの文字が消える式）は、zero のときだけ、ちょうど 1 つの式に出す
    const zc = (e) => (e[0] === 0 ? 1 : 0) + (e[1] === 0 ? 1 : 0);
    if (zc(eA) > 1 || zc(eB) > 1 || zc(eA) + zc(eB) !== (zero ? 1 : 0)) continue;
    if (!uniq(eA, eB)) continue;
    const s = solve2(eA, eB);
    if (s[0][0] !== sol[0] || s[1][0] !== sol[1]) throw new Error("tripleGen の解が合わない");
    const At = slotT(A), Bt = slotT(B), Ct = slotT(C);
    return { sol, A, B, C, K, At, Bt, Ct, cst, eA, eB, tex: `${At}=${Bt}=${Ct}`, pair: cst ? [`${At}=${Ct}`, `${Bt}=${Ct}`] : [`${At}=${Bt}`, `${Bt}=${Ct}`] };
  }
  throw new Error("tripleGen が作れない");
};
/** A＝B＝C を解いて、x か y の値を聞く問題 */
const tripleQ = (r, T, hint) => {
  const { w, v } = askXY(r, T.sol);
  return {
    q: `方程式 ${TX(T.tex)} を解いたとき、${TX(w)} の値は？`,
    ans: v,
    hint,
    steps: [
      `${TX(T.tex)} を、${TX(T.pair[0])} と ${TX(T.pair[1])} の 2 つの等式に分けて整理すると、${TX(eqT(T.eA))}、${TX(eqT(T.eB))}。`,
      ...solveLines(T.eA, T.eB),
    ],
  };
};

// A・B・C の形の指定（スロットごとの、x の係数 a・y の係数 b・定数項 c の範囲）
const SP = {
  // 演習（1）2x+y＝x+6y＝11 … 数に等しい。A・B に定数項なし
  x01: { A: { a: [1, 2, 3], b: R(1, 6), c: [0] }, B: { a: R(1, 6), b: R(1, 8), c: [0] }, C: "const" },
  // 小テスト（1）x+2y＝3x+y＝15
  q01: { A: { a: R(1, 4), b: NZ(-3, 5), c: [0] }, B: { a: R(1, 5), b: NZ(-4, 6), c: [0] }, C: "const" },
  // 小テスト（2）3x−4y＝x+6＝5y … B は1文字＋定数、C は1文字
  q02: { A: { a: R(2, 5), b: NZ(-5, 3), c: [0] }, B: { a: R(0, 3), b: R(0, 3), c: NZ(-9, 9), one: true }, C: { a: R(0, 6), b: R(0, 6), c: [0], one: true } },
  // 演習（3）2x−y−1＝x+2＝3y−1 … 3つとも式。定数項あり
  x03: { A: { a: R(1, 3), b: NZ(-3, 3), c: NZ(-4, 4) }, B: { a: R(0, 3), b: R(0, 3), c: NZ(-6, 6), one: true }, C: { a: R(0, 3), b: R(0, 4), c: R(-4, 4), one: true } },
  // 演習（4）3x+y＝4x+y−2＝5x … 定数項は B だけ、C は文字だけ
  x04: { A: { a: R(1, 5), b: R(1, 3), c: [0] }, B: { a: R(1, 5), b: R(0, 3), c: NZ(-4, 4) }, C: { a: R(0, 6), b: R(0, 5), c: R(-3, 3) } },
  // 入試（7）2x−y＝x+y−2＝3x−4y+5 … 3つとも2文字の式。定数項あり
  d07: { A: { a: R(1, 4), b: NZ(-4, 4), c: [0] }, B: { a: R(1, 4), b: NZ(-4, 4), c: NZ(-5, 5) }, C: { a: R(1, 5), b: NZ(-5, 5), c: NZ(-6, 6) } },
};

/** 連立方程式の組の4択用：A＝B＝C（C は数 K）の、正しい組と、正しくない組 */
const pairSets = (r, A, B, K) => {
  const AB = `${A}=${B}`, AC = `${A}=${K}`, BC = `${B}=${K}`;
  const rev = (p) => (r(0, 1) ? p : [p[1], p[0]]);
  const good = [[AC, BC], [AB, BC], [AB, AC]].map(rev);
  const ds = shuffle(r, [1, 2, 3, 4, 5, -1, -2, -3]);
  const key = (p) => [...p].sort().join("|");              // 組は、式の順序によらず、集合として比べる
  const goodKeys = new Set(good.map(key)), seen = new Set();
  const bad = shuffle(r, [
    [AC, `${B}=0`],
    [AB, `${A}=${K + ds[0]}`],
    [AC, `${B}=${K + ds[1]}`],
    [`${A}=${K + ds[2]}`, BC],
    [AB, `${B}=${K + ds[3]}`],
    [AC, `${B}=${-K}`],
  ].map(rev)).filter((p) => { const k = key(p); if (goodKeys.has(k) || seen.has(k)) return false; seen.add(k); return true; });
  return { good, bad };
};
const pairTex = (p) => TX(casesTex(p));

/** 問題の元の式 A, B（定数項のない2文字の式）を、C＝K の A＝B＝K として出す */
const pairBase = (r) => ({ T: tripleGen(r, () => solPick(r, 1, 9), { A: { a: R(1, 4), b: NZ(-3, 4), c: [0] }, B: { a: R(1, 5), b: NZ(-4, 6), c: [0] }, C: "const" }) });

// ── a・b を求める問題（ax−y＝x+by＝11 の型）──────────────────────
const abGen = (r, o) => {
  for (let n = 0; n < 4000; n++) {
    const x0 = pick(r, o.x0), y0 = pick(r, o.y0), a = pick(r, o.a), p = pick(r, o.p), q = pick(r, o.q);
    const K = a * x0 + p * y0;
    if (K === 0 || Math.abs(K) > 40 || (K - q * x0) % y0 !== 0) continue;
    const b = (K - q * x0) / y0;
    if (!o.b.includes(b) || b === 0) continue;
    if (a * b === p * q) continue;     // a、b を入れると 2 つの式が同じ式（何倍かの式）になって、組が 1 つに決まらない
    return { x0, y0, a, b, p, q, K };
  }
  throw new Error("abGen が作れない");
};

export const UNITS = [
  unit("06", {
    name: "A＝B＝C の形の方程式",
    desc: "2つの等式の組（連立方程式）に直して解く",
    prereqs: ["J2-rk05", "J1-e2"],
    points: [
      "$A=B=C$ の形の方程式は、3つの式 $A$、$B$、$C$ がすべて等しいということ。等式を 2 つつくって、連立方程式に直して解く。",
      "組のつくり方は 3 通り。「$A=B$ と $A=C$」「$A=B$ と $B=C$」「$A=C$ と $B=C$」。どの組で解いても、解は同じになる。",
      "$C$ が数のときは「$A=C$ と $B=C$」にすると、そのまま連立方程式になる。",
      "解がわかっているときは、$x$、$y$ の値を式に代入して、$a$、$b$ についての式をつくる。",
    ],
    levels: {
      // ───────── 1 基礎 ─────────
      1: [
        // 06d01 演習（1）2x+y＝x+6y＝11（右の数に等しい）
        t("06d01", (r) => {
          return tripleQ(r, tripleGen(r, () => solPick(r, 1, 9, 10), SP.x01), "3つの式が等しい。右の数に等しい 2 つの等式をつくって、連立方程式に直そう。");
        }),
        // 06d02 連立方程式の組に直す（3x+y＝x−2y＝7）→ 正しい組を選ぶ
        t("06d02", (r) => {
          const { T } = pairBase(r), { good, bad } = pairSets(r, T.At, T.Bt, T.K);
          const right = pick(r, good), ans = pairTex(right);
          return {
            q: `方程式 ${TX(T.tex)} を、連立方程式の組に直したものは、次のうちどれか。（解かなくてよい）`,
            ans,
            choices: choices4(r, ans, bad.map(pairTex)),
            hint: "3つの式がすべて等しいとき、その中の 2 つを等号でむすんだ等式を 2 つつくって、組にする。どの式とどの式をむすんだ等式が、つくれるかな？",
            steps: [`${TX(T.At)}、${TX(T.Bt)}、${TX(String(T.K))} の 3つがすべて等しい。`, `その中の 2 つの等式を組にして、${ans}。`, `ほかの組は、右辺の数が ${fm(T.K)} とちがう（もとの式と等しくなっていない）ので、正しくない。`],
          };
        }),
      ],
      // ───────── 2 標準 ─────────
      2: [
        // 06d03 演習（3）2x−y−1＝x+2＝3y−1（3つとも式）
        t("06d03", (r) => {
          return tripleQ(r, tripleGen(r, () => solPick(r, 1, 9, 20), SP.x03), "3つとも式のときは、「$A=B$」と「$B=C$」のように 2 つの等式をつくって、整理しよう。");
        }),
        // 06d04 演習（4）3x+y＝4x+y−2＝5x
        t("06d04", (r) => {
          // 半分は、A＝B の文字が 1 つ消える形（3x+y＝4x+y−2＝5x）
          return tripleQ(r, tripleGen(r, () => solPick(r, 1, 9, 20), SP.x04, r(0, 1) === 1), "「$A=B$」と「$B=C$」のように 2 つの等式をつくって、$ax+by=c$ の形に整理してから解こう。");
        }),
        // 06q01 x+2y＝3x+y＝15
        t("06q01", (r) => {
          return tripleQ(r, tripleGen(r, () => solPick(r, 1, 9, 25), SP.q01), "右の数に等しい 2 つの等式をつくって、連立方程式に直そう。");
        }),
        // 06q02 3x−4y＝x+6＝5y
        t("06q02", (r) => {
          return tripleQ(r, tripleGen(r, () => solPick(r, 1, 9, 15), SP.q02), "3つの式から 2 つの等式をつくって、整理してから解こう。");
        }),
        // 06q03 連立方程式に直した組として「正しくないもの」を選ぶ（x+3y＝3x−2y＝11）
        t("06q03", (r) => {
          const { T } = pairBase(r), { good, bad } = pairSets(r, T.At, T.Bt, T.K);
          const wrong = pick(r, bad), ans = pairTex(wrong);
          return {
            q: `方程式 ${TX(T.tex)} を、連立方程式の組に直した。次のうち、正しくない組はどれか。`,
            ans,
            choices: choices4(r, ans, shuffle(r, good).map(pairTex)),
            hint: "組にできる等式は、3つの式のうちの、どれとどれをむすんだものだろう？ それぞれの組を、もとの方程式とくらべてみよう。",
            steps: [`${TX(T.At)}、${TX(T.Bt)}、${TX(String(T.K))} の 3つがすべて等しい。`, `正しい組は、この 3つのうちの 2 つの等式。たとえば ${pairTex(good[0])}。`, `${ans} は、右辺の数がもとの ${fm(T.K)} とちがう式をふくむので、正しくない。`],
          };
        }),
        // 06q04 解を代入して a、b を求める（ax+2y＝x+by＝8、解は x＝2、y＝1）
        t("06q04", (r) => {
          const g = abGen(r, { x0: R(1, 4), y0: R(1, 3), a: R(1, 5), p: R(1, 3), q: [1, 2, 3], b: R(1, 7) });
          return abQ(r, g);
        }),
      ],
      // ───────── 3 応用 ─────────
      3: [
        // 06d05 ax−y＝x+by＝11 の解が x＝4、y＝1 のとき a、b
        t("06d05", (r) => {
          const g = abGen(r, { x0: R(2, 5), y0: R(1, 3), a: NZ(-4, 6), p: NZ(-3, 3), q: NZ(-3, 3), b: NZ(-5, 8) });
          return abQ(r, g);
        }),
        // 06d06 解が x＝1、y＝2 の連立方程式 ax+by＝5、ax−by＝1 から a、b
        t("06d06", (r) => {
          for (let n = 0; n < 2000; n++) {
            const x0 = r(1, 5), y0 = r(1, 5), a = rnz(r, -5, 6), b = rnz(r, -5, 6), kind = r(0, 1);
            if (x0 === y0) continue;
            const c1 = a * x0 + b * y0, c2 = kind === 0 ? a * x0 - b * y0 : b * x0 - a * y0;
            const rows = [[x0, y0, c1], kind === 0 ? [x0, -y0, c2] : [-y0, x0, c2]];
            if (!uniq(rows[0], rows[1])) continue;
            const s = solve2(rows[0], rows[1]);
            if (s[0][0] !== a || s[1][0] !== b) throw new Error("06d06 の解が合わない");
            const t1 = `ax+by=${c1}`, t2 = kind === 0 ? `ax-by=${c2}` : `bx-ay=${c2}`;
            const w = pick(r, ["a", "b"]), v = w === "a" ? a : b;
            const sub1 = `${J(coefVar(x0, "a"), coefVar(y0, "b"))}=${c1}`, sub2 = kind === 0 ? `${J(coefVar(x0, "a"), coefVar(-y0, "b"))}=${c2}` : `${J(coefVar(-y0, "a"), coefVar(x0, "b"))}=${c2}`;
            return {
              q: `${TX(`x=${x0}`)}、${TX(`y=${y0}`)} が、連立方程式 ${cases2(t1, t2)} の解であるとき、${TX(w)} の値は？`,
              ans: v,
              hint: "解は、どちらの式も成り立たせる値。$x$、$y$ に値を代入して、$a$、$b$ の連立方程式をつくろう。",
              steps: [`2つの式に ${TX(`x=${x0}`)}、${TX(`y=${y0}`)} を代入すると、${TX(sub1)}、${TX(sub2)}。`, ...solveLines(rows[0], rows[1], ["a", "b"])],
            };
          }
          throw new Error("06d06 が作れない");
        }),
      ],
      // ───────── 4 入試レベル ─────────
      4: [
        // 06d07 2x−y＝x+y−2＝3x−4y+5
        t("06d07", (r) => {
          return tripleQ(r, tripleGen(r, () => solPick(r, 1, 9, 30), SP.d07), "「$A=B$」と「$B=C$」のように 2 つの等式をつくって、整理してから解こう。");
        }),
        // 06d08 (x+y)/3＝(x−y)/2＝2（分子が式の分数）
        t("06d08", (r) => {
          const NUM = [[1, 1], [1, -1], [2, 1], [1, 2], [2, -1], [1, -2], [3, 1], [1, 3]];
          for (let n = 0; n < 5000; n++) {
            const n1 = pick(r, NUM), n2 = pick(r, NUM);
            if (n1 === n2) continue;
            const sol = solPick(r, 1, 12, 15), N1 = n1[0] * sol[0] + n1[1] * sol[1], N2 = n2[0] * sol[0] + n2[1] * sol[1];
            const Ks = R(1, 6).filter((K) => N1 % K === 0 && N2 % K === 0 && N1 / K >= 2 && N1 / K <= 6 && N2 / K >= 2 && N2 / K <= 6);
            if (!Ks.length) continue;
            const K = pick(r, Ks), p = N1 / K, q = N2 / K;
            const e1 = [n1[0], n1[1], N1], e2 = [n2[0], n2[1], N2];
            if (!uniq(e1, e2)) continue;
            const s = solve2(e1, e2);
            if (s[0][0] !== sol[0] || s[1][0] !== sol[1]) throw new Error("06d08 の解が合わない");
            const f1 = frac(J(coefVar(n1[0], "x"), coefVar(n1[1], "y")), p), f2 = frac(J(coefVar(n2[0], "x"), coefVar(n2[1], "y")), q);
            const { w, v } = askXY(r, sol);
            return {
              q: `方程式 ${TX(`${f1}=${f2}=${K}`)} を解いたとき、${TX(w)} の値は？`,
              ans: v,
              hint: "右の数に等しい 2 つの等式をつくる。分母は、両辺に同じ数をかけてはらおう。",
              steps: [`${TX(`${f1}=${K}`)} の両辺に ${p} をかけて ${TX(eqT(e1))}、${TX(`${f2}=${K}`)} の両辺に ${q} をかけて ${TX(eqT(e2))}。`, ...solveLines(e1, e2)],
            };
          }
          throw new Error("06d08 が作れない");
        }),
        // 06q05 チャレンジ 2x+y＝3x−y＝a の解が x＝2 のとき a、y
        t("06q05", (r) => {
          for (let n = 0; n < 5000; n++) {
            const x0 = r(1, 6), p = pick(r, NZ(-3, 4)), q = pick(r, NZ(-3, 4)), rr = pick(r, NZ(-2, 5)), s = pick(r, NZ(-3, 4));
            if ((p === rr && q === s) || q === s) continue;
            const num = (rr - p) * x0, den = q - s;
            if (num === 0 || num % den !== 0) continue;
            const y0 = num / den, a = p * x0 + q * y0;
            if (y0 === 0 || Math.abs(y0) > 9 || a === 0 || Math.abs(a) > 30) continue;
            if (rr * x0 + s * y0 !== a) throw new Error("06q05 の値が合わない");
            const Atx = J(coefVar(p, "x"), coefVar(q, "y")), Btx = J(coefVar(rr, "x"), coefVar(s, "y"));
            const e = [p - rr, q - s, 0], w = pick(r, ["a", "y"]), v = w === "a" ? a : y0;
            return {
              q: `方程式 ${TX(`${Atx}=${Btx}=a`)} の解が ${TX(`x=${x0}`)} のとき、${TX(w)} の値は？`,
              ans: v,
              hint: "まず、$a$ をふくまない 2 つの式を等号でむすんで、$y$ を求めよう。$a$ は、それがわかってから。",
              steps: [`${TX(`${Atx}=${Btx}`)} を整理して ${TX(eqT(e))}。`, `${TX(`x=${x0}`)} を代入すると ${TX(J(String((p - rr) * x0), coefVar(q - s, "y")) + "=0")} より ${TX(`y=${y0}`)}。`, `${TX(`a=${Atx}`)} に代入して ${TX(`a=${J(String(p * x0), String(q * y0))}=${a}`)}。`, `よって、${TX(`y=${y0}`)}、${TX(`a=${a}`)}。`],
            };
          }
          throw new Error("06q05 が作れない");
        }),
      ],
    },
  }),
];

/** ax＋py＝qx＋by＝K の解が x＝x0、y＝y0 のとき、a か b を聞く */
function abQ(r, g) {
  const { x0, y0, a, b, p, q, K } = g;
  const At = J("ax", coefVar(p, "y")), Bt = J(coefVar(q, "x"), "by");
  const w = pick(r, ["a", "b"]), v = w === "a" ? a : b;
  const s1 = `${J(coefVar(x0, "a"), String(p * y0))}=${K}`, s2 = `${J(String(q * x0), coefVar(y0, "b"))}=${K}`;
  return {
    q: `方程式 ${TX(`${At}=${Bt}=${K}`)} の解が ${TX(`x=${x0}`)}、${TX(`y=${y0}`)} であるとき、${TX(w)} の値は？`,
    ans: v,
    hint: "解は、式を成り立たせる値。$x$、$y$ の値を、右の数に等しい 2 つの等式に代入しよう。",
    steps: [
      `${TX(`${At}=${K}`)} に ${TX(`x=${x0}`)}、${TX(`y=${y0}`)} を代入すると ${TX(s1)} より ${TX(`a=${a}`)}。`,
      `${TX(`${Bt}=${K}`)} に代入すると ${TX(s2)} より ${TX(`b=${b}`)}。`,
      `${TX(`a=${a}`)}、${TX(`b=${b}`)}。`,
    ],
  };
}

// 移さなかった問題はない（dr.2・qz.3 の「組に直す」は、式を答える問題なので、4択にした。qz.3 は「すべて選ぶ」を「正しくない組を1つ選ぶ」に直した）
export const SKIPPED = [];
