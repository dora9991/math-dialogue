// ============================================================
// renritsu-13.js — 連立方程式 第13時「「連立方程式」で学んだことを、整理して確かめよう」（単元のまとめ）
//   ikkan の演習プリント（renritsu-13.dr.1〜9）・小テスト（renritsu-13.qz.1〜4）を、コツコツくんのテンプレートにしたもの。
//   テンプレート id＝「13」＋ d（演習）／q（小テスト）＋ ikkan の問題の番号（＋ a, b…）。例：13d02b ＝ renritsu-13.dr.2 の②
//   解く問題は、数値入力（x か y の値を聞く）。解の確かめ・「文章題をつくる」は、4択に直した。
//   解は、すべて algebra.js の solve2 で計算している。解説の途中の式は、同じ数から計算し、合わなければ例外を出す。
// ============================================================
import { t, pick, choices4, shuffle, round, lcm, gcd, rnz, coefVar, signedVar, signed } from "../kit.js";
import { unitFor } from "../unit-kit.js";
import { solve2, casesTex, linTex, Q, qadd, qsub, qmul, qval, qisint, qtex, qeq } from "../algebra.js";

const unit = unitFor("renritsu");

// ── 小さな道具 ──────────────────────────────────────────
const pn = (n) => (n < 0 ? `(${n})` : `${n}`);                  // 負の数にかっこ（TeX の中）
const mul = (k) => (k === 1 ? "" : `×${k}`);                    // ①×1 とは書かない
const tm = (c, v) => (c === 1 ? v : c === -1 ? `-${v}` : `${pn(c)}\\times${v}`);   // 係数 c × 値 v（v は pn 済み）。式の途中で使う
const tm1 = (c, k) => (c === 1 ? `${k}` : c === -1 ? `${-k}` : `${c}\\times${pn(k)}`);   // 式の先頭で使う（先頭の負の数にはかっこをつけない）
const NOUN = { 個: "個数", 本: "本数", 枚: "枚数", 冊: "冊数" };
const same = (a, b, msg) => { if (!qeq(a, b)) throw new Error(`計算の食いちがい: ${msg}`); };
/** [x, y] が (x0, y0) と合っているか */
const checkSol = (sol, x0, y0, msg) => { if (!sol) throw new Error(`解が決まらない: ${msg}`); same(sol[0], Q(x0), msg + " x"); same(sol[1], Q(y0), msg + " y"); };

/** 加減法の手順（2行）。e1、e2＝[x の係数, y の係数, 右辺]。ev＝消す文字（"x" か "y"）。lab＝式の名前
 *  1行め：①×m1 ±②×m2 で、ev を消して、残りの文字を求める。2行め：最初の式に代入して、ev を求める */
function addSub(e1, e2, [x0, y0], ev = "y", lab = ["①", "②"]) {
  const keep = ev === "y" ? "x" : "y", kv = ev === "y" ? x0 : y0, gv = ev === "y" ? y0 : x0;
  const g = (e) => (ev === "y" ? { gone: e[1], keep: e[0], c: e[2] } : { gone: e[0], keep: e[1], c: e[2] });
  const A = g(e1), B = g(e2);
  const L = lcm(Math.abs(A.gone), Math.abs(B.gone)), m1 = L / Math.abs(A.gone), m2 = L / Math.abs(B.gone);
  const sameSign = Math.sign(A.gone) === Math.sign(B.gone), sg = sameSign ? -1 : 1;
  let ca = A.keep * m1 + sg * B.keep * m2, cc = A.c * m1 + sg * B.c * m2;
  let head = `${lab[0]}${mul(m1)}${sameSign ? "−" : "＋"}${lab[1]}${mul(m2)}`;
  if (sameSign && ca < 0) { ca = -ca; cc = -cc; head = `${lab[1]}${mul(m2)}−${lab[0]}${mul(m1)}`; }
  if (ca * kv !== cc) throw new Error(`加減法の計算が合わない: ${JSON.stringify([e1, e2, ev])}`);
  // 最初の式に代入して、ev を求める（x の項、y の項の順に書く）
  const [a1, b1, c1] = e1;
  const left = keep === "x"
    ? `${tm1(a1, kv)}${signedVar(b1, "y")}`
    : `${coefVar(a1, "x")}${b1 < 0 ? "-" : "+"}${tm(Math.abs(b1), pn(kv))}`;
  const goneCoef = ev === "y" ? b1 : a1, keepCoef = ev === "y" ? a1 : b1;
  const rest = c1 - keepCoef * kv;
  if (goneCoef * gv !== rest) throw new Error(`代入の計算が合わない: ${JSON.stringify([e1, e2, ev])}`);
  return [
    `${head}（$${ev}$ を消す）　$${coefVar(ca, keep)}=${cc}$${ca === 1 ? "" : `　$${keep}=${kv}$`}`,
    `${lab[0]}に代入して　$${left}=${c1}$　$${coefVar(goneCoef, ev)}=${rest}$${goneCoef === 1 ? "" : `　$${ev}=${gv}$`}`,
  ];
}
const eqTex = (e) => linTex(e[0], e[1], e[2]);

// ── 連立方程式のつくり方（解 (x0, y0) から係数・右辺をつくる） ───────────
/** たすかひくだけで文字が消える形（ev の係数が、同じか、符号だけちがう） */
function sysAdd(r) {
  for (let i = 0; i < 300; i++) {
    const ev = pick(r, ["x", "y"]), same2 = r(0, 1) === 1, k = r(1, 5), o1 = r(1, 5), o2 = rnz(r, -5, 5);
    const x0 = rnz(r, -5, 6), y0 = rnz(r, -5, 6);
    const [a1, b1, a2, b2] = ev === "y" ? [o1, k, o2, same2 ? k : -k] : [k, o1, same2 ? k : -k, o2];
    const e1 = [a1, b1, a1 * x0 + b1 * y0], e2 = [a2, b2, a2 * x0 + b2 * y0];
    if (!solve2(e1, e2)) continue;
    if (Math.abs(e1[2]) > 40 || Math.abs(e2[2]) > 40) continue;
    return { e1, e2, x0, y0, ev };
  }
  return null;
}
/** どちらの式も何倍かしないと、文字が消えない形 */
function sysMult(r) {
  for (let i = 0; i < 500; i++) {
    const a1 = r(2, 7), a2 = rnz(r, -7, 7), b1 = rnz(r, -7, 7), b2 = rnz(r, -7, 7);
    const A2 = Math.abs(a2), B1 = Math.abs(b1), B2 = Math.abs(b2);
    if (A2 < 2 || B1 < 2 || B2 < 2 || a1 % A2 === 0 || A2 % a1 === 0 || B1 % B2 === 0 || B2 % B1 === 0) continue;
    const x0 = rnz(r, -5, 6), y0 = rnz(r, -5, 6);
    const e1 = [a1, b1, a1 * x0 + b1 * y0], e2 = [a2, b2, a2 * x0 + b2 * y0];
    if (!solve2(e1, e2) || Math.abs(e1[2]) > 60 || Math.abs(e2[2]) > 60) continue;
    return { e1, e2, x0, y0, ev: pick(r, ["x", "y"]) };
  }
  return null;
}
/** 片方が「v＝m×(もう一方の文字)＋d」の形（代入法）。v＝"x" か "y" */
function sysSub(r, v, bigA = false) {
  const o = v === "x" ? "y" : "x";
  for (let i = 0; i < 500; i++) {
    const x0 = rnz(r, -5, 6), y0 = rnz(r, -5, 6), m = pick(r, [-3, -2, 2, 3, 4]);
    const d = v === "x" ? x0 - m * y0 : y0 - m * x0;
    const p = r(1, 5), q = rnz(r, -5, 5);
    if (d === 0) continue;
    const cv = v === "x" ? p : q, co = v === "x" ? q : p, A = cv * m + co;
    if (A === 0 || (bigA && Math.abs(A) < 2)) continue;
    const r2 = p * x0 + q * y0, B = r2 - cv * d;
    if (Math.abs(r2) > 40 || Math.abs(B) > 80) continue;
    return { x0, y0, m, d, p, q, r2, v, o, cv, co, A, B };
  }
  return null;
}
const mt = (c) => (c === 1 ? "" : c === -1 ? "-" : String(c));   // かっこの前の係数
const subEq1 = (s) => `${s.v}=${coefVar(s.m, s.o)}${signed(s.d)}`;
const subEq2 = (s) => linTex(s.p, s.q, s.r2);

// ── 買い物（x＋y＝n、a1 x＋a2 y＝k） ──────────────────────
const SHOP13 = [["シュークリーム", "プリン", "個"], ["ジュース", "お茶", "本"], ["ケーキ", "クッキー", "個"], ["りんご", "みかん", "個"], ["ノート", "ファイル", "冊"], ["シール", "カード", "枚"], ["パン", "おにぎり", "個"]];
function buy(r, cat, nLo, nHi, diffs) {
  for (let i = 0; i < 300; i++) {
    const a1 = pick(r, [90, 100, 110, 120, 130, 140, 150, 160, 170, 180]);
    const a2 = a1 + pick(r, diffs) * (r(0, 1) ? 1 : -1);
    if (a2 < 50) continue;
    const n = r(nLo, nHi);
    const x = cat === "ok" ? r(1, n - 1) : r(0, 1) ? -r(1, 3) : n + r(1, 3);
    const y = n - x, k = a1 * x + a2 * y;
    if (k <= 0 || x === 0 || y === 0) continue;
    return { a1, a2, n, k, x, y };
  }
  return null;
}
const buyEq = (b) => [[1, 1, b.n], [b.a1, b.a2, b.k]];

export const UNITS = [
  unit("13", {
    name: "連立方程式のまとめ",
    desc: "解の確かめ・加減法・代入法・いろいろな形の方程式・文章題",
    prereqs: ["J2-rk12", "J2-rk11"],
    points: [
      "2つの方程式を組にしたものを連立方程式といい、2つの式を両方成り立たせる $x$、$y$ の値の組を解という。解は、2つの式に代入して確かめる。",
      "文字を減らすことを消去という。たしたりひいたりして消すのが加減法、一方の式を他方に代入して消すのが代入法。",
      "かっこ・小数・分数のある式は、$ax+by=c$ の形に整理してから解く。$A=B=C$ の形は、$A=C$、$B=C$ の組にして解く。",
      "連立方程式の利用では、求める数量を $x$、$y$ とおき、等しい関係を2つ式にして解く。解が問題に合うか（整数か・負でないか）も確かめる。",
    ],
    levels: {
      // ───────── 1 基礎 ─────────
      1: [
        // 13d01 ⟦4x+y＝11 ; 2x−3y＝−5⟧ の解を、ア〜ウから選ぶ
        t("13d01", (r) => {
          for (let i = 0; i < 200; i++) {
            const x0 = rnz(r, -3, 6), y0 = rnz(r, -3, 6), a1 = r(1, 5), b1 = rnz(r, -5, 5), a2 = r(1, 5), b2 = rnz(r, -5, 5);
            if (a1 * b2 - a2 * b1 === 0) continue;
            const e1 = [a1, b1, a1 * x0 + b1 * y0], e2 = [a2, b2, a2 * x0 + b2 * y0];
            const fmt = ([x, y]) => `$x=${x},\\ y=${y}$`;
            const ok = [x0, y0];
            const cand = [[x0 + b1, y0 - a1], [x0 + b2, y0 - a2], [y0, x0], [-x0, y0], [x0, -y0], [x0 + 1, y0 + 1]];
            const seen = new Set([fmt(ok)]), wrongs = [];
            for (const w of cand) { const f = fmt(w); if (!seen.has(f)) { seen.add(f); wrongs.push(w); } }
            if (wrongs.length < 3) continue;
            const w3 = wrongs.slice(0, 3);
            return {
              q: `連立方程式 $${casesTex([eqTex(e1), eqTex(e2)])}$ の解は、どれか。`,
              ans: fmt(ok),
              choices: choices4(r, fmt(ok), w3.map(fmt)),
              hint: "連立方程式の解は、2つの式の両方を成り立たせる。選択肢の値を、2つの式に代入して確かめよう。",
              steps: [
                `$x=${x0}$、$y=${y0}$ を代入する。上の式　$${tm1(a1, x0)}${b1 < 0 ? "-" : "+"}${tm(Math.abs(b1), pn(y0))}=${e1[2]}$　下の式　$${tm1(a2, x0)}${b2 < 0 ? "-" : "+"}${tm(Math.abs(b2), pn(y0))}=${e2[2]}$`,
                "どちらも成り立つのは、これだけ。ほかは、どちらかの式が成り立たない。",
              ],
            };
          }
          return { skip: true };
        }),
        // 13d02a 加減法で解く①（たすかひくだけで消える）
        t("13d02a", (r) => {
          const s = sysAdd(r);
          if (!s) return { skip: true };
          const ask = pick(r, ["x", "y"]);
          return {
            q: `次の連立方程式を、加減法で解いて、$${ask}$ の値を求めよう。$${casesTex([eqTex(s.e1), eqTex(s.e2)])}$`,
            ans: ask === "x" ? s.x0 : s.y0,
            hint: `$${s.ev}$ の係数を見くらべよう。同じなら、2つの式をひく。符号だけがちがうなら、たす。`,
            steps: [`$${eqTex(s.e1)}$ …①　$${eqTex(s.e2)}$ …②`, ...addSub(s.e1, s.e2, [s.x0, s.y0], s.ev), `$x=${s.x0}$、$y=${s.y0}$`],
          };
        }),
        // 13d03a 代入法で解く（x＝3y−4）
        t("13d03a", (r) => {
          const s = sysSub(r, "x");
          if (!s) return { skip: true };
          const ask = pick(r, ["x", "y"]);
          return {
            q: `次の連立方程式を、代入法で解いて、$${ask}$ の値を求めよう。$${casesTex([subEq1(s), subEq2(s)])}$`,
            ans: ask === "x" ? s.x0 : s.y0,
            hint: "上の式は、$x$ が $y$ の式で表されている。これを下の式の $x$ に代入して、$y$ だけの式にしよう。",
            steps: [
              `上の式を下の式に代入する　$${mt(s.p)}(${coefVar(s.m, "y")}${signed(s.d)})${signedVar(s.q, "y")}=${s.r2}$`,
              `かっこをはずして整理する　$${coefVar(s.A, "y")}=${s.B}$　$y=${s.y0}$`,
              `上の式に代入して　$x=${tm1(s.m, s.y0)}${signed(s.d)}=${s.x0}$`,
            ],
          };
        }),
      ],
      // ───────── 2 標準 ─────────
      2: [
        // 13d02b 加減法で解く②（何倍かしてから消す）
        t("13d02b", (r) => {
          const s = sysMult(r);
          if (!s) return { skip: true };
          const ask = pick(r, ["x", "y"]);
          return {
            q: `次の連立方程式を、加減法で解いて、$${ask}$ の値を求めよう。$${casesTex([eqTex(s.e1), eqTex(s.e2)])}$`,
            ans: ask === "x" ? s.x0 : s.y0,
            hint: `消したい文字の係数が、そろっていない。2つの式を何倍かして、$${s.ev}$ の係数の絶対値をそろえてから、たすかひくかしよう。`,
            steps: [`$${eqTex(s.e1)}$ …①　$${eqTex(s.e2)}$ …②`, ...addSub(s.e1, s.e2, [s.x0, s.y0], s.ev), `$x=${s.x0}$、$y=${s.y0}$`],
          };
        }),
        // 13d03b 代入して整理すると、Ay＝B の形になる
        t("13d03b", (r) => {
          const s = sysSub(r, "x", true);
          if (!s) return { skip: true };
          const askA = r(0, 1) === 1;
          return {
            q: `連立方程式 $${casesTex([subEq1(s), subEq2(s)])}$ の上の式を下の式に代入して整理すると、$Ay=B$ の形になった（両辺をわる前の形）。${askA ? "$A$" : "$B$"} の値は？`,
            ans: askA ? s.A : s.B,
            hint: "上の式の右辺を、下の式の $x$ に代入する。かっこをはずして、$y$ の項を左辺に、数の項を右辺に集めよう。",
            steps: [
              `下の式に代入する　$${mt(s.p)}(${coefVar(s.m, "y")}${signed(s.d)})${signedVar(s.q, "y")}=${s.r2}$`,
              `かっこをはずして　$${coefVar(s.p * s.m, "y")}${signed(s.p * s.d)}${signedVar(s.q, "y")}=${s.r2}$`,
              `$y$ の項をまとめ、数の項を右辺へ　$${coefVar(s.A, "y")}=${s.r2}${signed(-s.p * s.d)}=${s.B}$　　$A=${s.A}$、$B=${s.B}$`,
            ],
          };
        }),
        // 13d04a かっこのある連立方程式
        t("13d04a", (r) => {
          for (let i = 0; i < 300; i++) {
            const x0 = rnz(r, -4, 6), y0 = rnz(r, -4, 6), m = r(2, 4), s = rnz(r, -3, 3), p = r(1, 4), q = r(2, 4), u = rnz(r, -3, 3);
            const t1 = m * (x0 - s) - y0, rr = p * x0 - q * (y0 - u);
            if (p - m * q === 0 || Math.abs(t1) > 15 || Math.abs(rr) > 40) continue;
            const e1 = [m, -1, m * s + t1], e2 = [p, -q, rr - q * u];
            const sol = solve2(e1, e2);
            checkSol(sol, x0, y0, "13d04a");
            const eq1 = `${m}(x${signed(-s)})=y${t1 === 0 ? "" : signed(t1)}`, eq2 = `${coefVar(p, "x")}-${q}(y${signed(-u)})=${rr}`;
            const ask = pick(r, ["x", "y"]);
            return {
              q: `次の連立方程式を解いて、$${ask}$ の値を求めよう。$${casesTex([eq1, eq2])}$`,
              ans: ask === "x" ? x0 : y0,
              hint: "かっこをはずして、$ax+by=c$ の形に整理してから、加減法か代入法で解こう。",
              steps: [`かっこをはずして整理する　$${eqTex(e1)}$ …①　$${eqTex(e2)}$ …②`, ...addSub(e1, e2, [x0, y0], "y"), `$x=${x0}$、$y=${y0}$`],
            };
          }
          return { skip: true };
        }),
        // 13d04b 小数・分数のある連立方程式
        t("13d04b", (r) => {
          for (let i = 0; i < 300; i++) {
            const A = r(1, 9), B = rnz(r, -9, 9), d1 = r(2, 6), d2 = r(2, 6), ii = rnz(r, -3, 4), jj = rnz(r, -3, 4), sg = r(0, 1) ? 1 : -1;
            const x0 = d1 * ii, y0 = d2 * jj, C = A * x0 + B * y0, c2 = ii + sg * jj, L = lcm(d1, d2);
            if (Math.abs(C) > 99 || Math.abs(c2) > 9) continue;
            const e1 = [A, B, C], e2 = [L / d1, (sg * L) / d2, c2 * L];
            if (!solve2(e1, e2)) continue;
            checkSol(solve2(e1, e2), x0, y0, "13d04b");
            const d1s = (v) => String(round(v / 10, 1));
            const eq1 = `${d1s(A)}x${B < 0 ? "-" : "+"}${d1s(Math.abs(B))}y=${d1s(C)}`, eq2 = `\\frac{x}{${d1}}${sg < 0 ? "-" : "+"}\\frac{y}{${d2}}=${c2}`;
            const ask = pick(r, ["x", "y"]);
            return {
              q: `次の連立方程式を解いて、$${ask}$ の値を求めよう。$${casesTex([eq1, eq2])}$`,
              ans: ask === "x" ? x0 : y0,
              hint: "小数は両辺を何倍かして、分数は分母の最小公倍数を両辺にかけて、係数を整数にしてから解こう。",
              steps: [`上の式を 10倍、下の式を ${L}倍して、係数を整数にする　$${eqTex(e1)}$ …①　$${eqTex(e2)}$ …②`, ...addSub(e1, e2, [x0, y0], pick(r, ["x", "y"])), `$x=${x0}$、$y=${y0}$`],
            };
          }
          return { skip: true };
        }),
        // 13d05 A＝B＝C の形
        t("13d05", (r) => {
          for (let i = 0; i < 500; i++) {
            const x0 = rnz(r, -4, 6), y0 = rnz(r, -4, 6), a = r(1, 4), b = rnz(r, -4, 4), c = r(1, 5);
            const k = a * x0 + b * y0, dnum = k - c * x0;
            if (dnum % y0 !== 0) continue;
            const d = dnum / y0;
            if (d === 0 || Math.abs(d) > 5 || a * d - b * c === 0 || Math.abs(k) > 30 || (a === c && b === d)) continue;
            const e1 = [a, b, k], e2 = [c, d, k];
            checkSol(solve2(e1, e2), x0, y0, "13d05");
            const left = `${coefVar(a, "x")}${signedVar(b, "y")}`, mid = `${coefVar(c, "x")}${signedVar(d, "y")}`;
            const ask = pick(r, ["x", "y"]);
            return {
              q: `方程式 $${left}=${mid}=${k}$ を解いて、$${ask}$ の値を求めよう。`,
              ans: ask === "x" ? x0 : y0,
              hint: "A＝B＝C の形は、「A＝C」と「B＝C」の2つの方程式の組にして解く。",
              steps: ["A＝B＝C の形は、A＝C と B＝C の組にして解く。", `$${eqTex(e1)}$ …①　$${eqTex(e2)}$ …②`, ...addSub(e1, e2, [x0, y0], pick(r, ["x", "y"]))],
            };
          }
          return { skip: true };
        }),
        // 13q01 ⟦5x−3y＝9 ; 2x+3y＝12⟧ を解く
        t("13q01", (r) => {
          const s = sysAdd(r);
          if (!s) return { skip: true };
          const ask = pick(r, ["x", "y"]);
          return {
            q: `連立方程式 $${casesTex([eqTex(s.e1), eqTex(s.e2)])}$ を解いて、$${ask}$ の値を求めよう。`,
            ans: ask === "x" ? s.x0 : s.y0,
            hint: `$${s.ev}$ の係数を見くらべて、たすかひくかを決めよう。`,
            steps: [...addSub(s.e1, s.e2, [s.x0, s.y0], s.ev), `$x=${s.x0}$、$y=${s.y0}$`],
          };
        }),
        // 13q02 ⟦y＝2x−3 ; 4x−3y＝1⟧ を解く
        t("13q02", (r) => {
          const s = sysSub(r, "y");
          if (!s) return { skip: true };
          const ask = pick(r, ["x", "y"]);
          return {
            q: `連立方程式 $${casesTex([subEq1(s), subEq2(s)])}$ を解いて、$${ask}$ の値を求めよう。`,
            ans: ask === "x" ? s.x0 : s.y0,
            hint: "上の式は、$y$ が $x$ の式で表されている。これを下の式の $y$ に代入しよう。",
            steps: [
              `上の式を下の式に代入する　$${coefVar(s.p, "x")}${s.q < 0 ? "-" : "+"}${mt(Math.abs(s.q))}(${coefVar(s.m, "x")}${signed(s.d)})=${s.r2}$`,
              `かっこをはずして整理する　$${coefVar(s.A, "x")}=${s.B}$　$x=${s.x0}$`,
              `上の式に代入して　$y=${tm1(s.m, s.x0)}${signed(s.d)}=${s.y0}$`,
            ],
          };
        }),
      ],
      // ───────── 3 応用 ─────────
      3: [
        // 13d06 シュークリーム 170円、プリン 120円
        t("13d06", (r) => {
          const [A, B, c] = pick(r, SHOP13), b = buy(r, "ok", 10, 16, [30, 40, 50, 60]);
          if (!b) return { skip: true };
          const askA = r(0, 1) === 1, [e1, e2] = buyEq(b);
          return {
            q: `1${c} ${b.a1}円の${A}と、1${c} ${b.a2}円の${B}を、合わせて ${b.n}${c}買ったら、代金は ${b.k}円だった。${askA ? A : B}は何${c}買っただろう。`,
            ans: askA ? b.x : b.y,
            unit: c,
            hint: `${A}を $x$ ${c}、${B}を $y$ ${c}として、「合わせた${NOUN[c]}」と「代金」で式を2つつくり、連立方程式を解こう。`,
            steps: [`$x+y=${b.n}$ …①　$${b.a1}x+${b.a2}y=${b.k}$ …②`, ...addSub(e1, e2, [b.x, b.y], "y"), `${A}は ${b.x}${c}、${B}は ${b.y}${c}。（${NOUN[c]}は正の整数で、問題に合う）`],
          };
        }),
        // 13d07 自転車と徒歩の道のり
        t("13d07", (r) => {
          const [from, to] = pick(r, [["家", "体育館"], ["学校", "図書館"], ["駅", "公園"]]);
          const v1 = pick(r, [150, 200, 250, 300]), v2 = pick(r, [50, 60, 70, 80, 100]), t1 = r(5, 20), t2 = r(3, 12);
          const x0 = v1 * t1, y0 = v2 * t2, D = x0 + y0, T = t1 + t2, L = lcm(v1, v2), askX = r(0, 1) === 1;
          const e1 = [1, 1, D], e3 = [L / v1, L / v2, L * T];
          checkSol(solve2(e1, e3), x0, y0, "13d07");
          return {
            q: `${from}から${to}まで ${D}m ある。はじめは自転車で分速 ${v1}m、そのあと歩いて分速 ${v2}m で進み、${T}分で着いた。${askX ? "自転車で進んだ" : "歩いた"}道のりは、何 m か。`,
            ans: askX ? x0 : y0,
            unit: "m",
            hint: "自転車で進んだ道のりを $x$ m、歩いた道のりを $y$ m として、道のりの式と、時間（道のり÷速さ）の式をつくろう。",
            steps: [
              `$x+y=${D}$ …①　$\\frac{x}{${v1}}+\\frac{y}{${v2}}=${T}$ …②`,
              `②の両辺に ${L} をかける　$${coefVar(L / v1, "x")}${signedVar(L / v2, "y")}=${L * T}$ …③`,
              ...addSub(e1, e3, [x0, y0], "x", ["①", "③"]),
            ],
          };
        }),
        // 13q03 ジュース 140円、お茶 110円
        t("13q03", (r) => {
          const [A, B, c] = pick(r, SHOP13), b = buy(r, "ok", 9, 14, [30, 40, 50]);
          if (!b) return { skip: true };
          const askA = r(0, 1) === 1, [e1, e2] = buyEq(b);
          return {
            q: `1${c} ${b.a1}円の${A}と、1${c} ${b.a2}円の${B}を、合わせて ${b.n}${c}買ったら、代金は ${b.k}円だった。${A}と${B}を、それぞれ何${c}買っただろう。${askA ? A : B}の${NOUN[c]}は？`,
            ans: askA ? b.x : b.y,
            unit: c,
            hint: `${A}を $x$ ${c}、${B}を $y$ ${c}として、連立方程式をつくって解こう。`,
            steps: [`$x+y=${b.n}$ …①　$${b.a1}x+${b.a2}y=${b.k}$ …②`, ...addSub(e1, e2, [b.x, b.y], "y"), `${A}は ${b.x}${c}、${B}は ${b.y}${c}。確かめ　$${b.x}+${b.y}=${b.n}$、$${b.a1}\\times${b.x}+${b.a2}\\times${b.y}=${b.k}$`],
          };
        }),
      ],
      // ───────── 4 入試レベル ─────────
      4: [
        // 13d08 遊園地：大人 5％ 増・子ども 10％ 減
        t("13d08", (r) => {
          for (let i = 0; i < 300; i++) {
            const [p, q] = pick(r, [[5, 10], [10, 5], [5, 20], [20, 10], [10, 20], [15, 10], [10, 15], [25, 10], [5, 15], [20, 5]]);
            const x0 = 20 * r(10, 140), y0 = 20 * r(10, 140), N = x0 + y0, adultUp = r(0, 1) === 1;
            const C = adultUp ? (p * x0 - q * y0) / 100 : (q * y0 - p * x0) / 100;
            if (C === 0 || !Number.isInteger(C) || x0 === y0) continue;
            const e1 = [1, 1, N], e3 = adultUp ? [p, -q, 100 * C] : [-p, q, 100 * C];
            checkSol(solve2(e1, e3), x0, y0, "13d08");
            const askA = r(0, 1) === 1, d2 = (v) => String(round(v / 100, 2));
            const eq2 = adultUp ? `${d2(p)}x-${d2(q)}y=${C}` : `-${d2(p)}x+${d2(q)}y=${C}`;
            return {
              q: `ある遊園地の昨年の入園者は、大人と子どもを合わせて ${N}人だった。今年は、昨年とくらべて、大人が ${p}％ ${adultUp ? "増え" : "減り"}、子どもが ${q}％ ${adultUp ? "減って" : "増えて"}、全体では ${Math.abs(C)}人 ${C > 0 ? "増えた" : "減った"}。昨年の${askA ? "大人" : "子ども"}の入園者は、何人か。`,
              ans: askA ? x0 : y0,
              unit: "人",
              hint: "昨年の大人を $x$ 人、子どもを $y$ 人として、「合わせた人数」の式と、「増えた人数・減った人数」の式をつくろう。",
              steps: [
                `昨年の大人を $x$ 人、子どもを $y$ 人とする。$x+y=${N}$ …①　$${eq2}$ …②`,
                `②×100　$${eqTex(e3)}$ …③`,
                ...addSub(e1, e3, [x0, y0], "y", ["①", "③"]),
              ],
            };
          }
          return { skip: true };
        }),
        // 13d09a 代金を変えたとき、解が負の数になる
        t("13d09a", (r) => {
          const [A, B, c] = pick(r, SHOP13), b = buy(r, "neg", 10, 16, [30, 40, 50]);
          if (!b) return { skip: true };
          const askA = r(0, 1) === 1, [e1, e2] = buyEq(b);
          checkSol(solve2(e1, e2), b.x, b.y, "13d09a");
          return {
            q: `1${c} ${b.a1}円の${A}と、1${c} ${b.a2}円の${B}を、合わせて ${b.n}${c}買ったら、代金は ${b.k}円だった。${A}を $x$ ${c}、${B}を $y$ ${c}として連立方程式をつくって解くと、$${askA ? "x" : "y"}$ の値は？`,
            ans: askA ? b.x : b.y,
            hint: `「合わせた${NOUN[c]}」と「代金」で式を2つつくって解こう。値が負の数になっても、そのまま答える。`,
            steps: [`$x+y=${b.n}$ …①　$${b.a1}x+${b.a2}y=${b.k}$ …②`, ...addSub(e1, e2, [b.x, b.y], "y"), `$x=${b.x}$、$y=${b.y}$ で、${NOUN[c]}が負の数になるから、問題の答えにはならない。`],
          };
        }),
        // 13d09b x＝4、y＝3 が答えになる文章題を選ぶ
        t("13d09b", (r) => {
          const [A, B, c] = pick(r, SHOP13);
          for (let i = 0; i < 200; i++) {
            const a = pick(r, [60, 70, 80, 90, 100, 120, 150]), b = a + pick(r, [20, 30, 40, 60]) * (r(0, 1) ? 1 : -1);
            const x0 = r(2, 9), y0 = r(2, 9);
            if (b < 30 || x0 === y0) continue;
            const n = x0 + y0, k = a * x0 + b * y0, noun = NOUN[c];
            const wrongK = [a * y0 + b * x0, ((a + b) * n) / 2, a * n + b, b * n + a, k + a, k - b].filter((v) => Number.isInteger(v) && v > 0 && v !== k);
            const uniq = [...new Set(wrongK)];
            if (uniq.length < 3) continue;
            const story = (kk) => `1${c} ${a}円の${A}と、1${c} ${b}円の${B}を、合わせて ${n}${c}買ったら、代金は ${kk}円だった。`;
            return {
              q: `解が $x=${x0}$、$y=${y0}$ になる文章題は、どれか。（$x$ は${A}の${noun}、$y$ は${B}の${noun}）`,
              ans: story(k),
              choices: choices4(r, story(k), shuffle(r, uniq).slice(0, 3).map(story)),
              hint: "解の値を、2つの式（「合わせた数」の式と「代金」の式）の両方に入れて、成り立つ問題を選ぼう。",
              steps: [`合わせた${noun}は　$${x0}+${y0}=${n}$（${c}）`, `代金は　$${a}\\times${x0}+${b}\\times${y0}=${a * x0}+${b * y0}=${k}$（円）`, `だから、「${story(k)}」が合う。`],
            };
          }
          return { skip: true };
        }),
        // 13q04 食塩水
        t("13q04", (r) => {
          for (let i = 0; i < 300; i++) {
            const p = r(2, 8), q = r(p + 2, 12), tt = r(p + 1, q - 1), u = q - tt, v = tt - p, g = gcd(u, v);
            const k = pick(r, [50, 100, 150, 200]), x0 = (u / g) * k, y0 = (v / g) * k, W = x0 + y0;
            if (W < 200 || W > 1000) continue;
            const e1 = [1, 1, W], e3 = [p, q, tt * W];
            checkSol(solve2(e1, e3), x0, y0, "13q04");
            const askP = r(0, 1) === 1;
            return {
              q: `${p}％の食塩水と ${q}％の食塩水を混ぜて、${tt}％の食塩水を ${W}g つくる。${askP ? p : q}％の食塩水を、何 g 混ぜればよいか。`,
              ans: askP ? x0 : y0,
              unit: "g",
              hint: "混ぜる前の食塩水の重さの和と、食塩の重さの和（食塩水の重さ×濃度）で、式を2つつくろう。",
              steps: [
                `${p}％の食塩水を $x$ g、${q}％の食塩水を $y$ g とする。$x+y=${W}$ …①　食塩の重さ　$\\frac{${p}}{100}x+\\frac{${q}}{100}y=${W}\\times\\frac{${tt}}{100}$ …②`,
                `②×100　$${eqTex(e3)}$ …③`,
                ...addSub(e1, e3, [x0, y0], "y", ["①", "③"]),
              ],
            };
          }
          return { skip: true };
        }),
      ],
    },
  }),
];

// 移さなかった問題：なし（ikkan の演習プリント 9問・小テスト 4問のすべてを移した。「方法とわけを書く」「文章題をつくる」は、数値入力か4択に直した）
export const SKIPPED = [];
