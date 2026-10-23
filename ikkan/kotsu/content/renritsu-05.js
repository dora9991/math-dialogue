// ============================================================
// renritsu-05.js — 連立方程式 第5時「かっこや小数・分数のある連立方程式を解こう」
//   ikkan の演習プリント（renritsu-05.dr.1〜8）・小テスト（renritsu-05.qz.1〜5）を、コツコツくんのテンプレートにしたもの。
//   テンプレート id＝「05」＋ d（演習）／q（小テスト）／x（演習プリント（1）〜（4）の2題ずつの組。ikkan の問題一覧には番号がないので、x にした）＋ 番号（＋ 型ごとに a, b…）
//     05x01 … 演習（1）かっこ　05x02a・b … 演習（1）（2）小数・分数　05x03a・b … 演習（3）　05x04a・b … 演習（4）
//     05d05 … dr.5　05d06〜08 … dr.6〜8　05q01〜05 … qz.1〜5
//   連立方程式は、解 (x, y) を先に決めて式をつくり、画面の式から整数の係数の式 ax+by=c を取り出して solve2 で解き直して、解と合うことを確かめてから出す。
//   「解を求めよ」は入力欄で打てる数にするため、x か y の一方の値を聞く（どちらを聞くかは毎回ランダム）。
//   dr.5 は「まちがいを説明して正しく解く」ので、(a) まちがいを選ぶ4択　(b) 正しく解いたときの x か y の値、の2つにした。
//   qz.4 は「分母をはらった式を答える」ので、(a) 正しい式を選ぶ4択　(b) 係数などの数を聞く、の2つにした。
// ============================================================
import { t, pick, choices4, shuffle, rnz, gcd, lcm, coefVar } from "../kit.js";
import { unitFor } from "../unit-kit.js";
import { linTex, casesTex, solve2, poly, ptex, peq } from "../algebra.js";

const unit = unitFor("renritsu");

// ── 道具（この授業の問題用に足した小さな関数）──────────────────────────
const TX = (s) => `$${s}$`;
/** 項を、符号つきでつなぐ（["2x","-y","3"] → 2x-y+3） */
const J = (...ps) => ps.filter((p) => p !== "" && p != null).reduce((s, p, i) => (i === 0 ? p : s + (p[0] === "-" ? p : "+" + p)), "");
/** 整数の係数の式 ax+by=c の TeX */
const eqT = (e) => linTex(e[0], e[1], e[2]);
const cases2 = (a, b) => TX(casesTex([a, b]));
/** 10倍した整数 n10 を、小数の文字列に（12 → 1.2、20 → 2、-5 → -0.5） */
const dec = (n10) => {
  let s = (Math.abs(n10) / 10).toFixed(1);
  if (s.endsWith(".0")) s = s.slice(0, -2);
  return (n10 < 0 ? "-" : "") + s;
};
/** 小数の係数つきの項（n10 は10倍した整数）  3 → 0.3x */
const dterm = (n10, v) => dec(n10) + v;
/** 分数の項  ft(-2,"y",3) → -\frac{2y}{3} */
const ft = (c, v, d) => (c < 0 ? "-" : "") + `\\frac{${Math.abs(c) === 1 ? "" : Math.abs(c)}${v}}{${d}}`;
/** かっこつきの項  pc(-2,"x+1") → -2(x+1) */
const pc = (c, inner) => (c < 0 ? "-" : "") + (Math.abs(c) === 1 ? "" : Math.abs(c)) + `(${inner})`;
/** 符号つきの数を、かけ算のなかで書く（-3 → (-3)） */
const par = (n) => (n < 0 ? `(${n})` : `${n}`);
/** ax+by=c と a'x+b'y=c' が、同じ式（何倍かの関係）か */
const sameEq = (p, q) => p[0] * q[1] === q[0] * p[1] && p[0] * q[2] === q[0] * p[2] && p[1] * q[2] === q[1] * p[2];
/** 2つの整数係数の式が、整数の解を1組だけもつか */
const uniq = (e1, e2) => { const s = solve2(e1, e2); return !!s && s[0][1] === 1 && s[1][1] === 1; };
/** 解 (x, y) を決める。neg は、負にする確率（%）。x≠y */
const solPick = (r, lo, hi, neg = 0) => {
  for (;;) {
    const f = () => { const v = r(lo, hi); return neg && r(1, 100) <= neg ? -v : v; };
    const s = [f(), f()];
    if (s[0] !== s[1]) return s;
  }
};
/** x か y のどちらを聞くか */
const askXY = (r, sol) => { const k = r(0, 1); return { w: ["x", "y"][k], v: sol[k] }; };

/** 整数の係数の式 e1, e2 を、加減法で解く解説（2行）。解が合わなければ例外 */
const solveLines = (e1, e2) => {
  const s = solve2(e1, e2);
  if (!s || s[0][1] !== 1 || s[1][1] !== 1) throw new Error(`解が整数でない ${JSON.stringify([e1, e2])}`);
  const sol = [s[0][0], s[1][0]], nm = ["x", "y"];
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
  const mul = (e, E, m) => (m > 1 ? `${TX(eqT(e))} を ${m} 倍して ${TX(eqT(E))}、` : "");
  const l1 = `${nm[k]} を消去する。${mul(e1, E1, P.m1)}${mul(e2, E2, P.m2)}${TX(eqT(E1))} と ${TX(eqT(E2))} を${P.same ? "ひく" : "たす"}と ${kk === 1 ? "" : `${TX(`${coefVar(kk, nm[w])}=${n}`)} より `}${TX(`${nm[w]}=${sol[w]}`)}。`;
  const pe = Math.abs(e1[k]) <= Math.abs(e2[k]) ? e1 : e2;
  const l2 = `${TX(eqT(pe))} に ${TX(`${nm[w]}=${sol[w]}`)} を代入して ${TX(`${nm[k]}=${sol[k]}`)}。よって、${TX(`x=${sol[0]}`)}、${TX(`y=${sol[1]}`)}。`;
  return [l1, l2];
};

/** 解いて x か y の値を聞く問題にまとめる。A, B は { tex, e, pre }（pre は式を整理する解説の行） */
const solveQ = (r, A, B, sol, hint) => {
  const swap = r(0, 1) === 1, [P, Q] = swap ? [B, A] : [A, B];
  if (!uniq(P.e, Q.e)) throw new Error("解が1組に決まらない");
  const s = solve2(P.e, Q.e);
  if (s[0][0] !== sol[0] || s[1][0] !== sol[1]) throw new Error(`解が合わない ${JSON.stringify([P.e, Q.e, sol])}`);
  const { w, v } = askXY(r, sol);
  return {
    q: `連立方程式 ${cases2(P.tex, Q.tex)} を解いたとき、${TX(w)} の値は？`,
    ans: v,
    hint,
    steps: [...A.pre, ...B.pre, ...solveLines(P.e, Q.e)],
  };
};

// ── 式のつくりかた（どれも、解 sol を入れると成り立つように、数をきめる）──────────
/** ふつうの式 px+qy=d */
const plainEq = (p, q, sol) => { const e = [p, q, p * sol[0] + q * sol[1]]; return { tex: eqT(e), e, pre: [] }; };
const PLAIN = [[1, 1], [1, -1], [2, 1], [1, 2], [2, -1], [3, 1], [1, 3], [3, -1], [1, -2], [3, 2], [2, -3]];
const plainOf = (r, sol, set = PLAIN) => { const [p, q] = pick(r, set); return plainEq(p, q, sol); };

/** かっこに定数がある式  m(w+k) と、ふつうの項 cu・u  （2(x+1)−y=13、x−2(y−1)=4 の型） */
const parenConst = (r, sol, o = {}) => {
  for (let n = 0; n < 300; n++) {
    const wv = pick(r, ["x", "y"]), uv = wv === "x" ? "y" : "x", iw = wv === "x" ? 0 : 1, iu = 1 - iw;
    const mm = pick(r, o.mm || [2, 3, -2, -3]), k = rnz(r, -4, 4), cu = pick(r, o.cu || [1, -1, 2, -2]);
    const rhs = cu * sol[iu] + mm * (sol[iw] + k);
    if (Math.abs(rhs) > 40) continue;
    const pT = pc(mm, J(wv, String(k))), uT = coefVar(cu, uv), first = r(0, 1) === 0;
    const tex = J(...(first ? [pT, uT] : [uT, pT])) + "=" + rhs;
    const mid = J(...(first ? [coefVar(mm, wv), String(mm * k), uT] : [uT, coefVar(mm, wv), String(mm * k)])) + "=" + rhs;
    const e = iw === 0 ? [mm, cu, rhs - mm * k] : [cu, mm, rhs - mm * k];
    return { tex, e, mm, k, wv, uT, first, rhs, pre: [`${TX(tex)} のかっこをはずして ${TX(mid)}、整理して ${TX(eqT(e))}。`] };
  }
  throw new Error("parenConst が作れない");
};

/** かっこの中に x と y がある式  m(x±y) と cu・u  （3x−2(x−y)=9、2(x+y)−y=7 の型） */
const parenBoth = (r, sol, o = {}) => {
  for (let n = 0; n < 300; n++) {
    const ov = pick(r, ["x", "y"]), mm = pick(r, o.mm || [2, 3, -2, -3]), s = pick(r, [1, -1]), cu = pick(r, o.cu || [1, -1, 2, 3, -2, -3]);
    const rhs = mm * (sol[0] + s * sol[1]) + cu * sol[ov === "x" ? 0 : 1];
    const xc = mm + (ov === "x" ? cu : 0), yc = mm * s + (ov === "y" ? cu : 0);
    if (xc === 0 || yc === 0 || Math.abs(rhs) > 40) continue;
    const pT = pc(mm, J("x", coefVar(s, "y"))), uT = coefVar(cu, ov), first = r(0, 1) === 0;
    const px = coefVar(mm, "x"), py = coefVar(mm * s, "y");
    const tex = J(...(first ? [pT, uT] : [uT, pT])) + "=" + rhs;
    const mid = J(...(first ? [px, py, uT] : [uT, px, py])) + "=" + rhs;
    const e = [xc, yc, rhs];
    return { tex, e, pre: [`${TX(tex)} のかっこをはずして ${TX(mid)}、同類項をまとめて ${TX(eqT(e))}。`] };
  }
  throw new Error("parenBoth が作れない");
};

/** 両辺に文字がある式  m(u+k)＝cv・v＋k2  （2(x+2)=y+1 の型） */
const parenSides = (r, sol, o = {}) => {
  for (let n = 0; n < 300; n++) {
    const uv = pick(r, ["x", "y"]), vv = uv === "x" ? "y" : "x", iu = uv === "x" ? 0 : 1, iv = 1 - iu;
    const mm = pick(r, o.mm || [2, 3, 4, -2]), k = rnz(r, -3, 3), cv = pick(r, o.cv || [1, 1, -1, 2]);
    const k2 = mm * (sol[iu] + k) - cv * sol[iv];
    if (k2 === 0 || Math.abs(k2) > 12) continue;
    const tex = pc(mm, J(uv, String(k))) + "=" + J(coefVar(cv, vv), String(k2));
    const mid = J(coefVar(mm, uv), String(mm * k)) + "=" + J(coefVar(cv, vv), String(k2));
    const c = k2 - mm * k;
    const e = iu === 0 ? [mm, -cv, c] : [-cv, mm, c];
    return { tex, e, pre: [`${TX(tex)} のかっこをはずして ${TX(mid)}、文字の項を左辺、数の項を右辺に移して ${TX(eqT(e))}。`] };
  }
  throw new Error("parenSides が作れない");
};

/** 小数の式  0.ax＋0.by＝0.c  （両辺に10をかける） */
const decEq = (r, sol, o = {}) => {
  for (let n = 0; n < 300; n++) {
    const a = r(1, o.amax || 9), b = pick(r, [1, -1]) * r(1, o.bmax || 9), c = a * sol[0] + b * sol[1];
    if (a % 10 === 0 || Math.abs(c) > 99 || c === 0) continue;
    const tex = J(dterm(a, "x"), dterm(b, "y")) + "=" + dec(c);
    const e = [a, b, c];
    return { tex, e, pre: [`${TX(tex)} の両辺に 10 をかけて ${TX(eqT(e))}。`] };
  }
  throw new Error("decEq が作れない");
};

/** 分数の式  ±(ca・x)/p ± (cb・y)/q ＝ c（c は整数）。解 sol は、この式が整数 c になるように、ここで決める */
const fracEqSol = (r, o = {}) => {
  const D = o.den || [2, 3, 4, 5, 6], NUM = o.num || [1];
  for (let n = 0; n < 2000; n++) {
    const p = pick(r, D), q = pick(r, D);
    if (p === q) continue;
    const ca = pick(r, NUM), cb = pick(r, NUM), sb = pick(r, [1, -1]);
    if (gcd(ca, p) !== 1 || gcd(cb, q) !== 1) continue;
    const L = lcm(p, q), sol = o.sol ? o.sol() : solPick(r, 1, 9, o.neg || 0);
    const cL = ca * (L / p) * sol[0] + sb * cb * (L / q) * sol[1];
    if (cL % L !== 0 || cL === 0) continue;
    const c = cL / L, e = [ca * (L / p), sb * cb * (L / q), cL];
    const tex = J(ft(ca, "x", p), ft(sb * cb, "y", q)) + "=" + c;
    return { tex, e, sol, pre: [`${TX(tex)} の両辺に分母の最小公倍数 ${L} をかけて、分母をはらうと ${TX(eqT(e))}。`] };
  }
  throw new Error("fracEqSol が作れない");
};

export const UNITS = [
  unit("05", {
    name: "かっこ・小数・分数のある連立方程式",
    desc: "整数の係数の式 ax+by=c に直してから解く",
    prereqs: ["J2-rk04", "J1-e2"],
    points: [
      "連立方程式は、$ax+by=c$ の形（整数の係数の式）に整理してから、加減法か代入法で解く。",
      "かっこがあるときは、かっこの前の数を中のすべての項にかけて、かっこをはずす。前が負の数のときは、符号に注意する。",
      "小数があるときは、両辺に 10 や 100 をかけて、係数を整数にする。右辺にもかけ忘れない。",
      "分数があるときは、分母の最小公倍数を両辺にかけて、分母をはらう。",
    ],
    levels: {
      // ───────── 1 基礎 ─────────
      1: [
        // 05x01 演習（1）かっこのある連立方程式（2(x+1)−y=13、x−2(y−1)=4）
        t("05d01", (r) => {
          const sol = solPick(r, 1, 9);
          for (let n = 0; n < 200; n++) {
            const A = parenConst(r, sol, { mm: [2, 3], cu: [1, -1] }), B = plainOf(r, sol, PLAIN.slice(0, 6));
            if (!uniq(A.e, B.e)) continue;
            return solveQ(r, A, B, sol, "かっこの前の数を、かっこの中のすべての項にかけてはずそう。そのあと、$ax+by=c$ の形に整理しよう。");
          }
          throw new Error("作れない");
        }),
        // 05x02a 演習（2）小数のある連立方程式（0.1x+0.4y=1.5）
        t("05d02a", (r) => {
          const sol = solPick(r, 1, 9);
          for (let n = 0; n < 200; n++) {
            const A = decEq(r, sol, { amax: 5, bmax: 5 }), B = plainOf(r, sol, PLAIN.slice(0, 6));
            if (!uniq(A.e, B.e)) continue;
            return solveQ(r, A, B, sol, "小数の式は、両辺に何をかけると係数がすべて整数になるかな？ 右辺にもかけ忘れないように。");
          }
          throw new Error("作れない");
        }),
        // 05x02b 演習（2）分数のある連立方程式（x/3+y/2=3）
        t("05d02b", (r) => {
          for (let n = 0; n < 200; n++) {
            const A = fracEqSol(r, { den: [2, 3, 4, 5, 6] }), B = plainOf(r, A.sol, PLAIN.slice(0, 2));
            if (!uniq(A.e, B.e)) continue;
            return solveQ(r, A, B, A.sol, "分母の最小公倍数を両辺にかけて、分母をはらおう。右辺の数にもかけること。");
          }
          throw new Error("作れない");
        }),
        // 05q01 小テスト（1）かっこの中に x と y がある連立方程式（2(x+y)−y=7）
        t("05q01", (r) => {
          const sol = solPick(r, 1, 9);
          for (let n = 0; n < 200; n++) {
            const A = parenBoth(r, sol, { mm: [2, 3], cu: [1, -1] }), B = plainOf(r, sol, [[1, -1], [1, 1], [2, -1], [1, -2]]);
            if (!uniq(A.e, B.e)) continue;
            return solveQ(r, A, B, sol, "かっこをはずして、同類項をまとめてから、加減法で解こう。");
          }
          throw new Error("作れない");
        }),
        // 05q04a 分母をはらった式を選ぶ（x/4−y/6=1 → 3x−2y=12）
        t("05q04a", (r) => {
          const D = [2, 3, 4, 5, 6, 8, 9, 10, 12];
          let a, b, L;
          do { a = pick(r, D); b = pick(r, D); L = lcm(a, b); } while (a === b || L > 36);
          const s2 = pick(r, [1, -1]), c = r(1, 5);
          const right = [L / a, s2 * (L / b), c * L];
          const wrongs = shuffle(r, [
            [L / a, s2 * (L / b), c],                 // 右辺にかけ忘れ
            [L / a, -s2 * (L / b), c * L],            // 符号をまちがえる
            [L / b, s2 * (L / a), c * L],             // 係数をいれかえる
            [L / a, s2 * (L / b), c + L],             // 右辺に、かけ算でなくたし算
            [a, s2 * b, c],                           // 分母をそのまま係数に
          ]).filter((e) => !sameEq(e, right)).map((e) => TX(eqT(e)));
          const ans = TX(eqT(right));
          return {
            q: `${TX(J(ft(1, "x", a), ft(s2, "y", b)) + "=" + c)} の分母をはらって、整数の係数の式に直す。両辺に分母の最小公倍数をかけたとき、できる式はどれか。`,
            ans,
            choices: choices4(r, ans, wrongs),
            hint: "分母の最小公倍数を求めて、両辺の「すべての項」にかけよう。",
            steps: [`${a} と ${b} の最小公倍数は ${L}。`, `両辺のすべての項に ${L} をかけると、${TX(eqT(right))}。`],
          };
        }),
        // 05q04b 分母をはらうときの数（最小公倍数・係数・右辺）
        t("05q04b", (r) => {
          const D = [2, 3, 4, 5, 6, 8, 9, 10, 12];
          let a, b, L;
          do { a = pick(r, D); b = pick(r, D); L = lcm(a, b); } while (a === b || L > 36);
          const s2 = pick(r, [1, -1]), c = r(1, 5);
          const asks = [
            ["分母をはらうために両辺にかける数のうち、いちばん小さい正の整数は？", L, `${a} でも ${b} でも割り切れる、いちばん小さい正の整数が ${L}。`],
            [`両辺に ${L} をかけて分母をはらった式の、${TX("x")} の係数は？`, L / a, `${TX(ft(1, "x", a))} に ${L} をかけると ${TX(coefVar(L / a, "x"))}。`],
            [`両辺に ${L} をかけて分母をはらった式の、${TX("y")} の係数は？（符号もふくめて答える）`, s2 * (L / b), `${TX(ft(s2, "y", b))} に ${L} をかけると ${TX(coefVar(s2 * (L / b), "y"))}。`],
            [`両辺に ${L} をかけて分母をはらった式の、右辺の数は？`, c * L, `右辺の ${c} にも ${L} をかけて ${c * L}。`],
          ];
          const [q2, ans, st] = pick(r, asks);
          return {
            q: `${TX(J(ft(1, "x", a), ft(s2, "y", b)) + "=" + c)} の分母をはらって、整数の係数の式に直す。${q2}`,
            ans,
            hint: "2つの分母のどちらでも割り切れる数を、式のすべての項にかければ、分母がはらえるよ。",
            steps: [`分母 ${a} と ${b} の最小公倍数は ${L}。`, st, `分母をはらった式は ${TX(eqT([L / a, s2 * (L / b), c * L]))}。`],
          };
        }),
      ],
      // ───────── 2 標準 ─────────
      2: [
        // 05x03a 演習（3）かっこの中に同じ文字がある（3x−2(x−y)=9）
        t("05d03a", (r) => {
          const sol = solPick(r, 1, 9, 20);
          for (let n = 0; n < 200; n++) {
            const A = parenBoth(r, sol), B = plainOf(r, sol);
            if (!uniq(A.e, B.e)) continue;
            return solveQ(r, A, B, sol, "かっこをはずしたら、同じ文字の項をまとめて、$ax+by=c$ の形にしよう。");
          }
          throw new Error("作れない");
        }),
        // 05x03b 演習（3）かっこと小数（3x+2(y−1)=22、0.3x−0.1y=1.5）
        t("05d03b", (r) => {
          const sol = solPick(r, 1, 9);
          for (let n = 0; n < 200; n++) {
            const A = parenConst(r, sol, { mm: [2, 3, -2], cu: [1, 2, 3, 4] }), B = decEq(r, sol);
            if (!uniq(A.e, B.e)) continue;
            return solveQ(r, A, B, sol, "かっこは、はずして整理。小数は、両辺に同じ数をかけて整数に。どちらも整数の係数の式にしてから解こう。");
          }
          throw new Error("作れない");
        }),
        // 05x04a 演習（4）両辺に文字がある式（2(x+2)=y+1）
        t("05d04a", (r) => {
          const sol = solPick(r, 1, 9, 20);
          for (let n = 0; n < 200; n++) {
            const A = parenSides(r, sol), B = plainOf(r, sol);
            if (!uniq(A.e, B.e)) continue;
            return solveQ(r, A, B, sol, "かっこをはずしたら、文字の項を左辺に、数の項を右辺に移して整理しよう。");
          }
          throw new Error("作れない");
        }),
        // 05x04b 演習（4）分数と小数（x/2−y/3=−1、0.3x+0.2y=1.8）
        t("05d04b", (r) => {
          for (let n = 0; n < 200; n++) {
            const A = fracEqSol(r, { den: [2, 3, 4, 5, 6], num: [1, 1, 2], neg: 15 });
            const B = decEq(r, A.sol, { amax: 6, bmax: 6 });
            if (!uniq(A.e, B.e)) continue;
            return solveQ(r, A, B, A.sol, "分数の式は分母の最小公倍数を、小数の式は何倍かして、両辺にかけて、整数の係数の式にしよう。");
          }
          throw new Error("作れない");
        }),
        // 05q02 小数のある連立方程式（0.2x+0.3y=2.2、x+y=10）
        t("05q02", (r) => {
          const sol = solPick(r, 1, 9);
          for (let n = 0; n < 200; n++) {
            const A = decEq(r, sol, { amax: 6, bmax: 6 }), B = plainOf(r, sol, [[1, 1], [1, -1]]);
            if (!uniq(A.e, B.e)) continue;
            return solveQ(r, A, B, sol, "小数の式の両辺に何をかけると、整数の係数の式になるかな？");
          }
          throw new Error("作れない");
        }),
        // 05q03 分数のある連立方程式（x/5+y/2=3、x−y=1）
        t("05q03", (r) => {
          for (let n = 0; n < 200; n++) {
            const A = fracEqSol(r, { den: [2, 3, 4, 5, 6, 8] }), B = plainOf(r, A.sol, [[1, 1], [1, -1]]);
            if (!uniq(A.e, B.e)) continue;
            return solveQ(r, A, B, A.sol, "分母の最小公倍数を両辺にかけて、分母をはらってから解こう。");
          }
          throw new Error("作れない");
        }),
      ],
      // ───────── 3 応用 ─────────
      3: [
        // 05d05a B さんのまちがい（−3(y+1) を −3y+3 とした）→ 正しくはずした式を選ぶ
        t("05d05a", (r) => {
          const D = bData(r), { a, m, k, c, sol } = D;
          const right = poly([-m, { y: 1 }], [-m * k, {}]);
          const cands = [
            poly([-m, { y: 1 }], [k, {}]),            // k にかけ忘れ
            poly([m, { y: 1 }], [m * k, {}]),         // すべての符号が逆
            poly([m, { y: 1 }], [-m * k, {}]),        // y の符号だけ逆
            poly([-m, { y: 1 }], [-k, {}]),           // k にかけ忘れ（符号は変わる）
          ].filter((p) => !peq(p, right));
          const ans = TX(ptex(right));
          const kT = par(k);
          return {
            q: `B さんは、連立方程式 ${cases2(D.t1, D.t2)} の上の式のかっこをはずして、${TX(D.bad + "=" + c)} と書いたが、これはまちがっている。${TX(pc(-m, J("y", String(k))))} を正しくはずした式は、次のうちどれか。`,
            ans,
            choices: choices4(r, ans, shuffle(r, cands).map((p) => TX(ptex(p)))),
            hint: "かっこの前の数は、かっこの中のすべての項にかける。前が負の数なら、符号に気をつけよう。",
            steps: [`${TX(String(-m))} を、中の ${TX("y")} と ${TX(String(k))} の両方にかける。`, `${TX(`${-m}\\times y=${-m}y`)}、${TX(`${-m}\\times ${kT}=${-m * k}`)}`, `よって ${TX(pc(-m, J("y", String(k))) + "=" + ptex(right))}。（B さんは、${TX(`${-m}\\times ${kT}`)} の符号をまちがえた。）`],
          };
        }),
        // 05d05b B さんのまちがい → 正しく解いたときの x か y の値
        t("05d05b", (r) => {
          const D = bData(r), { a, m, k, c, sol } = D;
          const { w, v } = askXY(r, sol);
          return {
            q: `B さんは、連立方程式 ${cases2(D.t1, D.t2)} の上の式のかっこをはずして、${TX(D.bad + "=" + c)} と書いたが、これはまちがっている。かっこを正しくはずして解くと、${TX(w)} の値は？`,
            ans: v,
            hint: "かっこの前が負の数のときは、中のすべての項に、符号も気をつけてかけよう。",
            steps: [`${TX(pc(-m, J("y", String(k))) + "=" + ptex(poly([-m, { y: 1 }], [-m * k, {}])))} だから、上の式は ${TX(J(coefVar(a, "x"), coefVar(-m, "y"), String(-m * k)) + "=" + c)}、整理して ${TX(eqT(D.e1))}。`, ...solveLines(D.e1, D.e2)],
          };
        }),
        // 05d06 分子が式の分数の連立方程式（(x+y)/3=4、(x−y)/2=1）
        t("05d06", (r) => {
          const NUM = [[1, 1], [1, -1], [2, 1], [1, 2], [1, -2], [2, -1], [3, 1]];
          for (let n = 0; n < 2000; n++) {
            const n1 = pick(r, NUM), n2 = pick(r, NUM), p = r(2, 5), q = r(2, 5);
            if (n1 === n2) continue;
            const sol = solPick(r, 1, 12, 10), N1 = n1[0] * sol[0] + n1[1] * sol[1], N2 = n2[0] * sol[0] + n2[1] * sol[1];
            if (N1 % p !== 0 || N2 % q !== 0 || N1 === 0 || N2 === 0) continue;
            const e1 = [n1[0], n1[1], N1], e2 = [n2[0], n2[1], N2];
            if (!uniq(e1, e2)) continue;
            const t1 = `\\frac{${linTexL(n1)}}{${p}}=${N1 / p}`, t2 = `\\frac{${linTexL(n2)}}{${q}}=${N2 / q}`;
            const { w, v } = askXY(r, sol);
            return {
              q: `連立方程式 ${cases2(t1, t2)} を解いたとき、${TX(w)} の値は？`,
              ans: v,
              hint: "分子が式のときも、両辺に分母をかければ、分母がはらえる。",
              steps: [`上の式の両辺に ${p}、下の式の両辺に ${q} をかけると ${TX(eqT(e1))}、${TX(eqT(e2))}。`, ...solveLines(e1, e2)],
            };
          }
          throw new Error("05d06 が作れない");
        }),
      ],
      // ───────── 4 入試レベル ─────────
      4: [
        // 05d07 分子が式の分数とかっこ（(x−1)/2+(y+1)/3=2、2x−3(y−1)=3）
        t("05d07", (r) => {
          for (let n = 0; n < 2000; n++) {
            const p = pick(r, [2, 3, 4]), q = pick(r, [2, 3, 4]);
            if (p === q) continue;
            const sol = solPick(r, 1, 9, 10);
            const as = [-4, -3, -2, -1, 1, 2, 3, 4].filter((a) => (sol[0] - a) % p === 0), bs = [-4, -3, -2, -1, 1, 2, 3, 4].filter((b) => (sol[1] + b) % q === 0);
            if (!as.length || !bs.length) continue;
            const a = pick(r, as), b = pick(r, bs);
            const c = (sol[0] - a) / p + (sol[1] + b) / q;
            const L = lcm(p, q);
            const A = { e: [L / p, L / q, L * c + (L / p) * a - (L / q) * b] };
            const B = parenConst(r, sol, { mm: [-2, -3], cu: [2, 3, 4], });
            if (B.wv !== "y" || B.first) continue;     // 2x−3(y−1) の型（x の項が先、かっこは y）
            if (!uniq(A.e, B.e)) continue;
            const t1 = `${frac(J("x", String(-a)), p)}+${frac(J("y", String(b)), q)}=${c}`;
            const pcx = (m, inner) => (m === 1 ? `(${inner})` : `${m}(${inner})`);
            const mid1 = `${pcx(L / p, J("x", String(-a)))}+${pcx(L / q, J("y", String(b)))}=${L * c}`;
            const { w, v } = askXY(r, sol);
            if (Math.abs(A.e[2]) > 60) continue;
            return {
              q: `連立方程式 ${cases2(t1, B.tex)} を解いたとき、${TX(w)} の値は？`,
              ans: v,
              hint: "上の式は分母をはらう（分子はかっこをつけてかける）、下の式はかっこをはずす。どちらも整数の係数の式にしてから解こう。",
              steps: [`上の式の両辺に ${L} をかけて ${TX(mid1)}、整理して ${TX(eqT(A.e))}。`, ...B.pre, ...solveLines(A.e, B.e)],
            };
          }
          throw new Error("05d07 が作れない");
        }),
        // 05d08 y＝0.2x+1 と小数の式（0.4x−0.5y=2.5）
        t("05d08", (r) => {
          for (let n = 0; n < 3000; n++) {
            const c1 = pick(r, [1, 2, 3, 4, 5, 6, 8]), k = rnz(r, -4, 4);
            const x0 = rnz(r, -12, 20);
            if ((c1 * x0) % 10 !== 0) continue;
            const y0 = (c1 * x0) / 10 + k;
            if (y0 === 0 || y0 === x0) continue;
            const a = r(1, 9), b = pick(r, [1, -1]) * r(1, 9);
            if ((b * c1) % 10 !== 0 || b % 10 === 0) continue;
            const C = a * x0 + b * y0, K = a + (b * c1) / 10;
            if (K === 0 || Math.abs(C) > 99 || C === 0) continue;
            const N = C - b * k;
            if (N % K !== 0 || N / K !== x0) continue;
            const t1 = "y=" + J(dterm(c1, "x"), String(k)), t2 = J(dterm(a, "x"), dterm(b, "y")) + "=" + dec(C);
            const e2 = [a, b, C];
            const sub = J(coefVar(a, "x"), pc(b, J(dterm(c1, "x"), String(k)))) + "=" + C;
            const sol = [x0, y0], { w, v } = askXY(r, sol);
            return {
              q: `連立方程式 ${cases2(t1, t2)} を解いたとき、${TX(w)} の値は？`,
              ans: v,
              hint: "下の式は、両辺に何をかけると整数の係数になるかな？ 上の式は、そのまま代入できる形。",
              steps: [`下の式の両辺に 10 をかけて ${TX(eqT(e2))}。`, `上の式を代入して ${TX(sub)}、かっこをはずして整理すると ${TX(`${coefVar(K, "x")}=${N}`)} より ${TX(`x=${x0}`)}。`, `${TX(`y=${dec(c1)}\\times ${par(x0)}${k < 0 ? "-" : "+"}${Math.abs(k)}=${y0}`)}。よって、${TX(`x=${x0}`)}、${TX(`y=${y0}`)}。`],
            };
          }
          throw new Error("05d08 が作れない");
        }),
        // 05q05 チャレンジ （x+y)/2−(x−y)/4=5、0.3x+0.2y=3.2
        t("05q05", (r) => {
          for (let n = 0; n < 3000; n++) {
            const p = pick(r, [2, 3, 4, 5, 6]), q = pick(r, [2, 3, 4, 5, 6]);
            if (p === q) continue;
            const sol = solPick(r, 1, 12, 10), N1 = sol[0] + sol[1], N2 = sol[0] - sol[1];
            if (N1 % p !== 0 || N2 % q !== 0 || N2 === 0) continue;
            const s = pick(r, [1, -1]), c = N1 / p + s * (N2 / q), L = lcm(p, q);
            if (c === 0 || Math.abs(c) > 20) continue;
            const e1 = [L / p + s * (L / q), L / p - s * (L / q), L * c];
            if (e1[0] === 0 || e1[1] === 0) continue;
            const B = decEq(r, sol, { amax: 6, bmax: 6 });
            if (!uniq(e1, B.e)) continue;
            const t1 = `${frac("x+y", p)}${s > 0 ? "+" : "-"}${frac("x-y", q)}=${c}`;
            const mid = `${L / p === 1 ? "(x+y)" : `${L / p}(x+y)`}${s > 0 ? "+" : "-"}${L / q === 1 ? "(x-y)" : `${L / q}(x-y)`}=${L * c}`;
            const { w, v } = askXY(r, sol);
            return {
              q: `連立方程式 ${cases2(t1, B.tex)} を解いたとき、${TX(w)} の値は？`,
              ans: v,
              hint: "上の式は分母をはらってかっこをはずし、下の式は小数を整数にして、どちらも整数の係数の式にしよう。",
              steps: [`上の式の両辺に ${L} をかけて ${TX(mid)}、整理して ${TX(eqT(e1))}。`, ...B.pre, ...solveLines(e1, B.e)],
            };
          }
          throw new Error("05q05 が作れない");
        }),
      ],
    },
  }),
];

// ── 05d05 の問題データ：2x−3(y+1)=8、x+y=8 の型 ──────────────────────────
function bData(r) {
  for (let n = 0; n < 500; n++) {
    const sol = solPick(r, 1, 9);
    const a = pick(r, [2, 3, 4]), m = pick(r, [2, 3, 4]), k = pick(r, [1, 2, 3, -1, -2]);
    const c = a * sol[0] - m * (sol[1] + k);
    const [p, q] = pick(r, [[1, 1], [1, -1], [2, 1], [1, 2]]);
    const e1 = [a, -m, c + m * k], e2 = [p, q, p * sol[0] + q * sol[1]];
    if (!uniq(e1, e2) || Math.abs(c) > 40) continue;
    const s = solve2(e1, e2);
    if (s[0][0] !== sol[0] || s[1][0] !== sol[1]) throw new Error("bData の解が合わない");
    return {
      a, m, k, c, sol, e1, e2,
      t1: J(coefVar(a, "x"), pc(-m, J("y", String(k)))) + "=" + c,
      t2: eqT(e2),
      bad: J(coefVar(a, "x"), coefVar(-m, "y"), String(m * k)),
    };
  }
  throw new Error("bData が作れない");
}

const frac = (n, d) => `\\frac{${n}}{${d}}`;
/** 数の組 [a, b] → ax+by の TeX（分数の分子用） */
function linTexL(n) { return J(coefVar(n[0], "x"), coefVar(n[1], "y")); }

// 移さなかった問題はない（dr.5 の「まちがいの説明」は、正しいはずし方を選ぶ4択と、正しく解く問題の2つにした）
export const SKIPPED = [];
