// ============================================================
// renritsu-07.js — 連立方程式 第7時「加減法と代入法をくらべて、解き方を選ぼう」
//   ikkan の演習プリント（renritsu-07.dr.1〜7）・小テスト（renritsu-07.qz.1〜5）を、コツコツくんのテンプレートにしたもの。
//   テンプレート id＝「07」＋ d（演習）／q（小テスト）／x（演習（3）①〜④の解きくらべ。ikkan の問題一覧には番号がないので、x にした）＋ 番号（＋ a, b…）
//     07d01a・b … dr.1（代入法・加減法）　07d02 … dr.2　07d03 … dr.3（予想）　07x03a〜c … 演習（3）①〜④　07d04a・b … dr.4　07d05 … dr.5　07d06a・b … dr.6　07d07 … dr.7　07q01〜05 … qz.1〜5
//   連立方程式は、解 (x, y) を先に決めて式をつくり、画面の式から整数の係数の式 ax+by=c を取り出して solve2 で解き直して、解と合うことを確かめてから出す。
//   「方法を選ぶ・理由を書く」は入力欄で打てないので、(a) 式の形から向いている方法を見分ける4択　(b) 理由を選ぶ4択　(c) 消去のしかたを選ぶ4択　(d) 向いている方法が使える式の数を聞く、にした。
//   解く問題は、x か y の一方の値を聞く（どちらを聞くかは毎回ランダム）。方法を選ぶ問題で、答えがあいまいにならないよう、
//   「代入法が向く式」は y＝…（x＝…）の式があって係数がそろわない式、「加減法が向く式」はどの係数も 1 でなく、ある文字の係数が同じ（反対）の式、とはっきり決めてつくる。
// ============================================================
import { t, pick, choices4, shuffle, gcd, lcm, coefVar } from "../kit.js";
import { unitFor } from "../unit-kit.js";
import { linTex, casesTex, solve2 } from "../algebra.js";

const unit = unitFor("renritsu");

// ── 道具 ───────────────────────────────────────────
const TX = (s) => `$${s}$`;
const J = (...ps) => ps.filter((p) => p !== "" && p != null).reduce((s, p, i) => (i === 0 ? p : s + (p[0] === "-" ? p : "+" + p)), "");
const XY = ["x", "y"];
const eqT = (e, nm = XY) => linTex(e[0], e[1], e[2], nm);
const cases2 = (a, b) => TX(casesTex([a, b]));
/** 連立方程式を 1 行で（選択肢・複数の式を並べるとき） */
const inl = (G) => TX(`${G.tex[0]},\\quad ${G.tex[1]}`);
const R = (lo, hi) => Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
const NZ = (lo, hi) => R(lo, hi).filter((v) => v !== 0);
const sg = (r) => (r(0, 1) ? 1 : -1);
const uniq = (e1, e2) => { const s = solve2(e1, e2); return !!s && s[0][1] === 1 && s[1][1] === 1; };
const solPick = (r, lo, hi, neg = 0) => {
  for (;;) {
    const f = () => { const v = r(lo, hi); return neg && r(1, 100) <= neg ? -v : v; };
    const s = [f(), f()];
    if (s[0] !== s[1]) return s;
  }
};
const askXY = (r, sol) => { const k = r(0, 1); return { w: XY[k], v: sol[k] }; };
/** かっこつきの項  pc(-2,"x+1") → -2(x+1)、pc(1,"x+1") → (x+1) */
const pc = (c, inner) => (c < 0 ? "-" : "") + (Math.abs(c) === 1 ? "" : Math.abs(c)) + `(${inner})`;
const lab = (i) => (i === 0 ? "①" : "②");
const gcd3 = (a, b, c) => gcd(gcd(a, b), c);
const fm = (n) => String(n).replace("-", "−");

/** 整数の係数の式 e1, e2（文字は nm）を、加減法で解く解説（2行） */
const solveLines = (e1, e2, nm = XY) => {
  const s = solve2(e1, e2);
  if (!s || s[0][1] !== 1 || s[1][1] !== 1) throw new Error(`解が整数でない ${JSON.stringify([e1, e2])}`);
  const sol = [s[0][0], s[1][0]];
  const plans = [0, 1].map((k) => {
    const p1 = e1[k], p2 = e2[k];
    if (p1 === 0 || p2 === 0) return null;
    const L = lcm(Math.abs(p1), Math.abs(p2)), m1 = L / Math.abs(p1), m2 = L / Math.abs(p2);
    return { k, m1, m2, L, same: p1 > 0 === p2 > 0, cost: (m1 > 1 ? 1 : 0) + (m2 > 1 ? 1 : 0) };
  }).filter(Boolean);
  if (!plans.length) throw new Error(`消去できない ${JSON.stringify([e1, e2])}`);
  plans.sort((a, b) => a.cost - b.cost || a.L - b.L || b.k - a.k);
  const P = plans[0], k = P.k, w = 1 - k;
  const E1 = e1.map((v) => v * P.m1), E2 = e2.map((v) => v * P.m2), sgn = P.same ? -1 : 1;
  const kk = E1[w] + sgn * E2[w], n = E1[2] + sgn * E2[2];
  if (kk === 0 || n % kk !== 0 || n / kk !== sol[w]) throw new Error(`消去が合わない ${JSON.stringify([e1, e2])}`);
  const mul = (e, E, m) => (m > 1 ? `${TX(eqT(e, nm))} を ${m} 倍して ${TX(eqT(E, nm))}、` : "");
  const l1 = `${nm[k]} を消去する。${mul(e1, E1, P.m1)}${mul(e2, E2, P.m2)}${TX(eqT(E1, nm))} と ${TX(eqT(E2, nm))} を${P.same ? "ひく" : "たす"}と ${kk === 1 ? "" : `${TX(`${coefVar(kk, nm[w])}=${n}`)} より `}${TX(`${nm[w]}=${sol[w]}`)}。`;
  const pe = Math.abs(e1[k]) <= Math.abs(e2[k]) ? e1 : e2;
  const l2 = `${TX(eqT(pe, nm))} に ${TX(`${nm[w]}=${sol[w]}`)} を代入して ${TX(`${nm[k]}=${sol[k]}`)}。よって、${TX(`${nm[0]}=${sol[0]}`)}、${TX(`${nm[1]}=${sol[1]}`)}。`;
  return [l1, l2];
};

/** 代入法で解く解説（2行）。sub：{ v, u, m, k } ＝「v ＝ m・u ＋ k」、other：[p, q, c]（px+qy=c）、sol */
const subLines = (G) => {
  const { v, u, m, k } = G.sub, [p, q, c] = G.other;
  const expr = J(coefVar(m, u), String(k));
  const sub = v === "y" ? J(coefVar(p, "x"), pc(q, expr)) : J(pc(p, expr), coefVar(q, "y"));
  const [K, N] = v === "y" ? [p + q * m, c - q * k] : [p * m + q, c - p * k];
  const u0 = G.sol[u === "x" ? 0 : 1], v0 = G.sol[v === "x" ? 0 : 1];
  if (K === 0 || N % K !== 0 || N / K !== u0) throw new Error(`代入の解説が合わない ${JSON.stringify(G)}`);
  return [
    `${TX(`${v}=${expr}`)} を、もう一方の式 ${TX(eqT(G.other))} の ${TX(v)} に代入すると ${TX(`${sub}=${c}`)}。整理して ${TX(`${coefVar(K, u)}=${N}`)} より ${TX(`${u}=${u0}`)}。`,
    `${TX(`${v}=${expr}`)} に ${TX(`${u}=${u0}`)} を代入して ${TX(`${v}=${v0}`)}。よって、${TX(`x=${G.sol[0]}`)}、${TX(`y=${G.sol[1]}`)}。`,
  ];
};

// ── 連立方程式のつくりかた（どれも、解 sol を先に決める）────────────────────
/** 代入法が向く式  v＝m・u＋k  と  px+qy＝c（p は正、c は正。ふつうは解が正の数）
 *  strict：加減法の手間が少なくならない形（書きなおした式で、x の係数も y の係数も、同じでも反対でもない） */
const genSub = (r, o = {}) => {
  for (let n = 0; n < 20000; n++) {
    const v = pick(r, o.vars || XY), u = v === "x" ? "y" : "x";
    const m = pick(r, o.m || [1, 2, 3, 4, -1, -2, -3]), k = pick(r, o.k || NZ(-9, 9));
    const u0 = (o.neg && r(1, 100) <= o.neg ? -1 : 1) * r(o.lo || 1, o.hi || 9), v0 = m * u0 + k;
    if (v0 === 0 || v0 === u0 || Math.abs(v0) > (o.vmax || 25) || (!o.neg && v0 < 1)) continue;
    const sol = v === "y" ? [u0, v0] : [v0, u0];
    const p = pick(r, o.p || R(1, 5)), q = pick(r, o.q || NZ(-5, 5)), c = p * sol[0] + q * sol[1];
    if (Math.abs(c) > 150 || c === 0 || (!o.neg && c < 1) || gcd3(p, q, c) !== 1) continue;
    if (o.strict) {
      if (v === "y" ? (Math.abs(p) === Math.abs(m) || Math.abs(q) === 1) : (Math.abs(p) === 1 || Math.abs(q) === Math.abs(m))) continue;
    }
    const subE = v === "y" ? [m, -1, -k] : [1, -m, k], other = [p, q, c];
    if (!uniq(subE, other)) continue;
    const s = solve2(subE, other);
    if (s[0][0] !== sol[0] || s[1][0] !== sol[1]) throw new Error("genSub の解が合わない");
    const t1 = `${v}=${J(coefVar(m, u), String(k))}`, t2 = eqT(other);
    return { kind: "sub", e: r(1, 10) <= 7 ? [subE, other] : [other, subE], tex: null, t1, t2, sol, sub: { v, u, m, k }, other, subE };
  }
  throw new Error("genSub が作れない");
};
/** 加減法が向く式  ある文字の係数が同じ（反対）。x の係数は正。strict：どの係数も 1 でない */
const genAdd = (r, o = {}) => {
  const lo = o.strict ? 2 : 1;
  for (let n = 0; n < 20000; n++) {
    const same = r(0, 1) === 1, col = same ? r(0, 1) : 1;      // 反対の符号にするのは y の係数だけ（x の係数はいつも正）
    const u = r(lo, o.umax || 6);
    const v1 = col === 0 ? sg(r) * r(lo, o.vmax || 7) : r(lo, o.vmax || 7), v2 = col === 0 ? sg(r) * r(lo, o.vmax || 7) : r(lo, o.vmax || 7);
    if (Math.abs(v1) === Math.abs(v2)) continue;
    const sol = solPick(r, o.lo || 1, o.hi || 9, o.neg || 0);
    const e1 = col === 0 ? [u, v1, 0] : [v1, u, 0], e2 = col === 0 ? [u, v2, 0] : [v2, same ? u : -u, 0];
    e1[2] = e1[0] * sol[0] + e1[1] * sol[1]; e2[2] = e2[0] * sol[0] + e2[1] * sol[1];
    if (!o.neg && (e1[2] < 1 || e2[2] < 1)) continue;
    if (Math.abs(e1[2]) > 150 || Math.abs(e2[2]) > 150 || !uniq(e1, e2) || gcd3(...e1) !== 1 || gcd3(...e2) !== 1) continue;
    return { kind: "add", e: [e1, e2], tex: [eqT(e1), eqT(e2)], sol, col, same, wv: XY[col], ov: XY[1 - col] };
  }
  throw new Error("genAdd が作れない");
};
/** どちらの文字も、片方の式だけを何倍かしてもそろわない式（両方の式を何倍かする）。x の係数は正 */
const genMult = (r, o = {}) => {
  for (let n = 0; n < 40000; n++) {
    const a1 = r(2, o.cmax || 9), a2 = r(2, o.cmax || 9), b1 = sg(r) * r(2, o.cmax || 9), b2 = sg(r) * r(2, o.cmax || 9);
    const bad = (p, q) => Math.abs(p) === Math.abs(q) || Math.abs(p) % Math.abs(q) === 0 || Math.abs(q) % Math.abs(p) === 0;
    if (bad(a1, a2) || bad(b1, b2)) continue;
    const sol = solPick(r, 1, o.hi || 9, o.neg || 0);
    const e1 = [a1, b1, a1 * sol[0] + b1 * sol[1]], e2 = [a2, b2, a2 * sol[0] + b2 * sol[1]];
    if (!o.neg && (e1[2] < 1 || e2[2] < 1)) continue;
    if (Math.abs(e1[2]) > 200 || Math.abs(e2[2]) > 200 || !uniq(e1, e2) || gcd3(...e1) !== 1 || gcd3(...e2) !== 1) continue;
    return { kind: "mult", e: [e1, e2], tex: [eqT(e1), eqT(e2)], sol };
  }
  throw new Error("genMult が作れない");
};
/** x＋by＝c と ax−y＝d（x の係数が 1、y の係数が −1 の式）：どちらの方法でも同じくらい */
const genPM1 = (r, o = {}) => {
  for (let n = 0; n < 5000; n++) {
    const b = pick(r, o.b || [2, 3, 4, 5]), a = pick(r, o.a || [2, 3, 4, 5]);
    const sol = solPick(r, 1, o.hi || 9, o.neg || 0);
    const e1 = [1, b, sol[0] + b * sol[1]], e2 = [a, -1, a * sol[0] - sol[1]];
    if (!o.neg && (e1[2] < 1 || e2[2] < 1)) continue;
    if (Math.abs(e1[2]) > 100 || !uniq(e1, e2)) continue;
    return { kind: "pm1", e: [e1, e2], tex: [eqT(e1), eqT(e2)], sol, sub: { v: "x", u: "y", m: -b, k: e1[2] }, other: e2 };
  }
  throw new Error("genPM1 が作れない");
};
/** 2つの式を表示する形に（代入法の式は t1・t2 から） */
const fin = (G) => {
  if (G.kind === "sub") {
    const first = G.e[0] === G.subE;
    return { ...G, tex: first ? [G.t1, G.t2] : [G.t2, G.t1] };
  }
  return G;
};
const SUB = (r, o) => fin(genSub(r, o));
/** 解き方の解説（式の種類に合わせる） */
const stepsOf = (G) => (G.kind === "sub" ? subLines(G) : solveLines(G.e[0], G.e[1]));
/** 解いて、x か y の値を聞く */
const solveQ = (r, G, how, hint) => {
  const s = solve2(G.e[0], G.e[1]);
  if (s[0][0] !== G.sol[0] || s[1][0] !== G.sol[1]) throw new Error("solveQ の解が合わない");
  const { w, v } = askXY(r, G.sol);
  return {
    q: `連立方程式 ${cases2(G.tex[0], G.tex[1])} を${how}解いたとき、${TX(w)} の値は？`,
    ans: v,
    hint,
    steps: stepsOf(G),
  };
};

export const UNITS = [
  unit("07", {
    name: "加減法と代入法の選び方",
    desc: "式の形を見て、手間の少ない解き方を選ぶ",
    prereqs: ["J2-rk06", "J1-e2"],
    points: [
      "加減法は、2つの式をたしたりひいたりして、1つの文字を消去する方法。代入法は、一方の式を他方の式に代入して、1つの文字を消去する方法。どちらで解いても、解は同じになる。",
      "解き方は、解くまでの行数（手間）やまちがえにくさでくらべる。式の形をよく見て、手間の少ない方法を選ぼう。",
      "$y=\\cdots$ や $x=\\cdots$ の形の式があるときは、そのまま代入できるので代入法が楽。ある文字の係数が同じ（または反対）のときは、ひく（たす）だけで消えるので加減法が楽。",
    ],
    levels: {
      // ───────── 1 基礎 ─────────
      1: [
        // 07d01a 代入法で解く（y＝x+5、3x+y＝21）
        t("07d01a", (r) => solveQ(r, SUB(r, { m: [1, 2, 3, -1], k: [1, 2, 3, 4, 5, -1, -2, -3], pos: true, q: [1, 1, 2, -1, 3], p: [1, 2, 3, 4], lo: 1, hi: 8 }), "代入法で", "「$x=\\cdots$」や「$y=\\cdots$」の形の式を、もう一方の式の同じ文字に代入しよう。かっこをつけるのを忘れずに。")),
        // 07d01b 加減法で解く（2x+5y＝19、2x−3y＝11）
        t("07d01b", (r) => solveQ(r, genAdd(r, { umax: 5, vmax: 6 }), "加減法で", "係数がそろっている文字を、たすかひくかして消去しよう。")),
        // 07d02 同じ連立方程式を、加減法と代入法の2通りで解く（x+2y＝16、3x−y＝13）
        t("07d02", (r) => {
          const G = genPM1(r), [l1, l2] = solveLines(G.e[0], G.e[1]), [s1, s2] = subLines(G);
          const { w, v } = askXY(r, G.sol);
          return {
            q: `連立方程式 ${cases2(G.tex[0], G.tex[1])} を、加減法と代入法の 2 通りで解くと、解は同じになる。解の ${TX(w)} の値は？`,
            ans: v,
            hint: "加減法は、1つの文字の係数をそろえて消去する。代入法は、$x=\\cdots$ の形に直して代入する。どちらでも同じ値になるよ。",
            steps: [`加減法　${l1}`, l2, `代入法　${s1}`, `${s2}どちらの方法でも、解は同じ。`],
          };
        }),
        // 07q04 好きな方法で解く（x+4y＝17、3x−y＝25）
        t("07q04", (r) => {
          const G = pick(r, [() => genPM1(r), () => genAdd(r, { umax: 5, vmax: 6 }), () => SUB(r, { pos: true, hi: 8, p: [1, 2, 3, 4], q: [1, 1, 2, -1, 3] })])();
          return solveQ(r, G, "好きな方法で", "加減法でも代入法でもよい。式の形を見て、手間が少ないと思う方法を選ぼう。");
        }),
      ],
      // ───────── 2 標準 ─────────
      2: [
        // 07d03 解く前に、速そうな方法を予想する → 代入法（加減法）が向く連立方程式を選ぶ
        t("07d03", (r) => {
          const wantSub = r(0, 1) === 1;
          for (let n = 0; n < 200; n++) {
            const good = wantSub ? SUB(r, { strict: true, hi: 8 }) : genAdd(r, { strict: true });
            const bads = [0, 1, 2].map(() => (wantSub ? genAdd(r, { strict: true }) : SUB(r, { strict: true, hi: 8 })));
            const texts = [good, ...bads].map(inl);
            if (new Set(texts).size < 4) continue;
            const ans = inl(good);
            const why = (G) => (G.kind === "sub" ? `${TX(G.t1)} のように ${G.sub.v}＝… の式があり、そのまま代入できる` : `${G.wv} の係数が${G.same ? "同じ" : "反対"}で、${G.same ? "ひく" : "たす"}だけで ${G.wv} が消える`);
            return {
              q: `次の連立方程式のうち、${wantSub ? "加減法よりも代入法" : "代入法よりも加減法"}のほうが、少ない手間で解けるものはどれか。`,
              ans,
              choices: choices4(r, ans, bads.map(inl)),
              hint: "加減法と代入法は、それぞれ、どんな形の式のときに手間が少なくなったか、思い出そう。",
              steps: [`${ans} は、${why(good)}。だから、${wantSub ? "代入法" : "加減法"}が楽。`, `ほかの 3つは、${wantSub ? "係数がそろった文字があり、たす（ひく）だけで消去できる" : "y＝… や x＝… の形の式があり、そのまま代入できる"}ので、${wantSub ? "加減法" : "代入法"}のほうが楽。`],
            };
          }
          throw new Error("07d03 が作れない");
        }),
        // 07x03a 演習（3）①③ 解きくらべ（代入法が向く式：y＝2x−4、x＝2y−5）
        t("07x03a", (r) => solveQ(r, SUB(r, { strict: true, hi: 8 }), "", "式の形をよく見よう。そのまま代入できる式はあるかな？")),
        // 07x03b 演習（3）② 解きくらべ（加減法が向く式：3x+4y＝28、5x−4y＝36）
        t("07x03b", (r) => solveQ(r, genAdd(r, { strict: true, umax: 6, vmax: 6 }), "", "式の形をよく見よう。係数が同じ（または反対）の文字はあるかな？ たす（ひく）だけで消せるのは、どちらの文字？")),
        // 07x03c 演習（3）④ 解きくらべ（どちらの文字も、両方の式を何倍かする：3x+4y＝29、2x−3y＝8）
        t("07x03c", (r) => solveQ(r, genMult(r, { cmax: 6 }), "", "消したい文字の係数の絶対値を、どうすればそろえられるかな？ 片方の式を何倍かするだけで、そろうだろうか。")),
        // 07q01 向いている方法で解く（代入法が向く式）
        t("07q01", (r) => solveQ(r, SUB(r, { strict: true, hi: 9, k: NZ(-9, 9) }), "向いている方法で", "式の形を見て、手間が少ない方法を選ぼう。そのまま代入できる式はあるかな？")),
        // 07q02 向いている方法で解く（加減法が向く式）
        t("07q02", (r) => solveQ(r, genAdd(r, { strict: true, umax: 6, vmax: 7 }), "向いている方法で", "式の形を見て、手間が少ない方法を選ぼう。係数が同じ（反対）の文字はないかな？")),
        // 07q03 向いている方法と理由を選ぶ
        t("07q03", (r) => {
          const G = r(0, 1) ? SUB(r, { strict: true, hi: 8 }) : genAdd(r, { strict: true });
          const same = (w) => `加減法。${w} の係数が同じなので、ひくだけで ${w} が消えるから。`, opp = (w) => `加減法。${w} の係数の符号が反対なので、たすだけで ${w} が消えるから。`, sub = (w) => `代入法。${w}＝… の式を、そのまま代入できるから。`;
          let ans, wrongs;
          if (G.kind === "sub") {
            const { v, u } = G.sub;
            ans = sub(v);
            wrongs = shuffle(r, [same("x"), same("y"), opp("x"), opp("y"), sub(u)]);
          } else {
            ans = G.same ? same(G.wv) : opp(G.wv);
            wrongs = shuffle(r, [same(G.ov), opp(G.ov), sub("x"), sub("y")]);
          }
          return {
            q: `連立方程式 ${cases2(G.tex[0], G.tex[1])} を解く。加減法と代入法のどちらが向いているか。理由として正しいものを選ぼう。`,
            ans,
            choices: choices4(r, ans, wrongs.filter((x) => x !== ans)),
            hint: "加減法と代入法は、それぞれ、どんな形の式のときに手間が少なくなったか、思い出そう。",
            steps: G.kind === "sub"
              ? [`${TX(G.t1)} のように ${G.sub.v}＝… の形の式がある。`, `x の係数も y の係数も、同じでも反対でもないので、加減法ではそろえる手間がかかる。`, `だから、「${ans}」`]
              : [`${G.wv} の係数は ${G.e[0][G.col]} と ${G.e[1][G.col]} で、${G.same ? "同じ" : "反対の符号"}。${G.ov} の係数はそろっていない。`, `${G.same ? "ひく" : "たす"}だけで ${G.wv} が消える。${"x＝… や y＝… の形の式はないので、代入するには式を直す手間がかかる。"}`, `だから、「${ans}」`],
          };
        }),
      ],
      // ───────── 3 応用 ─────────
      3: [
        // 07d04a 向いている方法を選んで解く
        t("07d04a", (r) => {
          const G = pick(r, [() => genAdd(r, { strict: true, umax: 6, vmax: 7, neg: 10 }), () => SUB(r, { strict: true, hi: 9 }), () => genPM1(r, { neg: 10 })])();
          return solveQ(r, G, "向いている方法を選んで", "式の形を見て、手間の少ない方法を選ぼう。加減法でも代入法でも、解は同じ。");
        }),
        // 07d04b ①〜③のうち、代入法が向くものの数
        t("07d04b", (r) => {
          const k = pick(r, [0, 1, 1, 1, 2, 2, 2, 3]);
          for (let n = 0; n < 100; n++) {
            const gs = shuffle(r, [...Array(k).fill(0).map(() => SUB(r, { strict: true, hi: 9 })), ...Array(3 - k).fill(0).map(() => genAdd(r, { strict: true }))]);
            if (new Set(gs.map(inl)).size < 3) continue;
            const mark = (G) => (G.kind === "sub" ? `代入法（${TX(G.t1)} の形の式がある）` : `加減法（${G.wv} の係数が${G.same ? "同じ" : "反対"}）`);
            return {
              q: `次の ①〜③ の連立方程式のうち、加減法よりも代入法のほうが少ない手間で解けるものは、いくつあるか。\n①　${inl(gs[0])}\n②　${inl(gs[1])}\n③　${inl(gs[2])}`.replace(/\n/g, "　"),
              ans: k,
              unit: "つ",
              hint: "加減法と代入法は、それぞれ、どんな形の式のときに手間が少なくなったか、思い出して、1組ずつ見分けよう。",
              steps: [`①　${mark(gs[0])}が楽。`, `②　${mark(gs[1])}が楽。`, `③　${mark(gs[2])}が楽。`, `代入法が楽なのは ${k} つ。`],
            };
          }
          throw new Error("07d04b が作れない");
        }),
        // 07d05 加減法で、x を消去するか y を消去するか、楽な方を選ぶ（3x+4y＝44、5x−2y＝4）
        t("07d05", (r) => {
          const G = genProc(r);
          return {
            q: `連立方程式 ${cases2(G.tex[0], G.tex[1])} を加減法で解く。上の式を ①、下の式を ② とするとき、倍にする式が 1 つですみ、いちばん手間の少ない消去のしかたは、次のうちどれか。`,
            ans: G.ans,
            choices: choices4(r, G.ans, G.wrongs),
            hint: "文字を消すには、その文字の係数の絶対値をそろえる。式を何倍かする回数が少ないのは、どちらの文字を消すときかな？",
            steps: G.steps,
          };
        }),
      ],
      // ───────── 4 入試レベル ─────────
      4: [
        // 07d06a x＝4y−9 の代入法（入試）
        t("07d06a", (r) => solveQ(r, SUB(r, { vars: ["x", "y"], m: [3, 4, 5, -2, -3], k: NZ(-12, 12), p: [1, 2, 3, 4, 5], q: [-5, -4, -3, -2, 2, 3, 4, 5], hi: 9, vmax: 40, strict: true }), "", "「$x=\\cdots$（$y=\\cdots$）」の式を、もう一方の式に代入しよう。かっこをはずすときの符号に注意。")),
        // 07d06b 両方の式を何倍かする加減法（7x−4y＝36、3x+5y＝49）
        t("07d06b", (r) => solveQ(r, genMult(r, { cmax: 9 }), "", "消す文字を決めて、その文字の係数の絶対値をそろえよう。片方の式を何倍かするだけで、そろうかな？")),
        // 07d07 2組の連立方程式の解が同じとき、a、b
        t("07d07", (r) => {
          for (let n = 0; n < 5000; n++) {
            const sol = solPick(r, 1, 7), a = r(1, 5), b = r(1, 5);
            if (a === b) continue;
            const f1 = [pick(r, [1, 2, 3]), pick(r, [-3, -2, -1, 1, 2]), 0], f2 = [pick(r, [1, 2, 3]), pick(r, [-2, -1, 1, 2, 3]), 0];
            f1[2] = f1[0] * sol[0] + f1[1] * sol[1]; f2[2] = f2[0] * sol[0] + f2[1] * sol[1];
            if (f1[2] < 1 || f2[2] < 1 || !uniq(f1, f2) || gcd3(...f1) !== 1 || gcd3(...f2) !== 1) continue;
            const c2 = a * sol[0] - b * sol[1], c4 = b * sol[0] + a * sol[1];
            if (!uniq(f1, [a, -b, c2]) || !uniq(f2, [b, a, c4])) continue;     // どちらの組も、解が1つに決まる
            const rows = [[sol[0], -sol[1], c2], [sol[1], sol[0], c4]];
            const s = solve2(rows[0], rows[1]);
            if (!s || s[0][0] !== a || s[1][0] !== b) throw new Error("07d07 の解が合わない");
            const w = pick(r, ["a", "b"]), v = w === "a" ? a : b;
            const AB = ["a", "b"];
            return {
              q: `2組の連立方程式 ${cases2(eqT(f1), `ax-by=${c2}`)} と ${cases2(eqT(f2), `bx+ay=${c4}`)} の解が同じとき、${TX(w)} の値は？`,
              ans: v,
              hint: "$a$、$b$ をふくまない 2 つの式から、$x$、$y$ を先に求めよう。その値を、$a$、$b$ をふくむ式に代入する。",
              steps: [
                `$a$、$b$ をふくまない式 ${TX(eqT(f1))}、${TX(eqT(f2))} を解くと、${TX(`x=${sol[0]}`)}、${TX(`y=${sol[1]}`)}。`,
                `これを ${TX(`ax-by=${c2}`)}、${TX(`bx+ay=${c4}`)} に代入して、${TX(eqT(rows[0], AB))}、${TX(eqT(rows[1], AB))}。`,
                ...solveLines(rows[0], rows[1], AB),
              ],
            };
          }
          throw new Error("07d07 が作れない");
        }),
        // 07q05 チャレンジ 7x−5y＝2、4x+3y＝48
        t("07q05", (r) => solveQ(r, genMult(r, { cmax: 9, hi: 9, neg: 10 }), "", "消す文字を決めて、その文字の係数の絶対値をそろえよう。片方の式を何倍かするだけで、そろうかな？")),
      ],
    },
  }),
];

/** 07d05：加減法で、何倍かする回数が少なくてすむ消去のしかた（楽な方の文字の係数は、一方が他方の整数倍）。x の係数は正 */
function genProc(r) {
  for (let n = 0; n < 20000; n++) {
    const col = r(0, 1), f = r(2, 4), km = r(2, 3), bigAt = r(0, 1);
    const same = col === 0 ? true : r(0, 1) === 1, s1 = col === 0 ? 1 : sg(r);
    const ab = bigAt === 0 ? [km * f, f] : [f, km * f];
    const easy = [ab[0] * s1, ab[1] * (same ? s1 : -s1)];
    const hs = col === 0 ? sg(r) : 1;                      // もう一方の列（x の係数のときは正、y の係数のときは符号は自由）
    const h1 = hs * r(2, 7), h2 = (col === 0 ? sg(r) : 1) * r(2, 7);
    const dv = (p, q) => Math.abs(p) % Math.abs(q) === 0 || Math.abs(q) % Math.abs(p) === 0;
    if (dv(h1, h2)) continue;
    const sol = solPick(r, 1, 9);
    const e1 = col === 0 ? [easy[0], h1, 0] : [h1, easy[0], 0], e2 = col === 0 ? [easy[1], h2, 0] : [h2, easy[1], 0];
    e1[2] = e1[0] * sol[0] + e1[1] * sol[1]; e2[2] = e2[0] * sol[0] + e2[1] * sol[1];
    if (e1[2] < 1 || e2[2] < 1 || e1[2] > 100 || e2[2] > 100 || !uniq(e1, e2) || gcd3(...e1) !== 1 || gcd3(...e2) !== 1) continue;
    const E = [e1, e2], small = ab[0] < ab[1] ? 0 : 1, big = 1 - small, nm = XY;
    const op = same ? "ひく" : "たす", opx = same ? "たす" : "ひく";
    const L = lcm(Math.abs(h1), Math.abs(h2)), m1 = L / Math.abs(h1), m2 = L / Math.abs(h2), opH = (h1 > 0) === (h2 > 0) ? "ひく" : "たす";
    const optA = (c, i, m, j, o) => `${nm[c]} を消去する（${lab(i)}を ${m} 倍して、${lab(j)}と${o}）`;
    const optB = (c, ma, mb, o) => `${nm[c]} を消去する（①を ${ma} 倍、②を ${mb} 倍して、${o}）`;
    // 本当に消えるか（正解と、「楽でない正解」W1 は消える。ほかは消えない）
    const resid = (c, i, m, j, o) => m * E[i][c] + (o === "たす" ? 1 : -1) * E[j][c];
    const ans = optA(col, small, km, big, op);
    if (resid(col, small, km, big, op) !== 0) throw new Error("07d05 の正解が消えない");
    const W1 = optB(1 - col, m1, m2, opH);
    const pool = [
      [optA(col, small, km, big, opx), resid(col, small, km, big, opx)],
      [optA(col, big, km, small, op), resid(col, big, km, small, op)],
      [optA(col, small, km + 1, big, op), resid(col, small, km + 1, big, op)],
    ].filter((x) => x[1] !== 0).map((x) => x[0]);
    if (pool.length < 2) continue;
    const wrongs = [W1, ...shuffle(r, pool).slice(0, 2)];
    const hv = nm[1 - col], ev = nm[col];
    return {
      tex: [eqT(e1), eqT(e2)], ans, wrongs,
      steps: [
        `${ev} の係数は ${fm(e1[col])} と ${fm(e2[col])}。${lab(small)}を ${km} 倍すれば、絶対値がそろう。${ev} を消去するのは、式を倍にするのが 1 つですむ。`,
        `${hv} の係数は ${fm(e1[1 - col])} と ${fm(e2[1 - col])} で、片方の式を何倍かしてもそろわない。${hv} を消去するには、①、② の両方を倍にしなければならない。`,
        `だから、「${ans}」。`,
      ],
    };
  }
  throw new Error("genProc が作れない");
}

// 移さなかった問題はない（dr.3 の「予想」は、向いている方法の式を選ぶ4択にした。dr.4・qz.1〜3 の「方法を選び、理由を書く」は、解く問題・方法と理由を選ぶ4択・数を聞く問題にした）
export const SKIPPED = [];
