// ============================================================
// shiki-10.js — 式の計算 第10時「等式を、目的に合う形に変形しよう」
//   ikkan の演習プリント（shiki-10.dr.1〜8）・小テスト（shiki-10.qz.1〜5）を、コツコツくんのテンプレートにしたもの。
//   テンプレート id＝「10」＋ d（演習）／q（小テスト）＋ ikkan の問題の番号（＋ 小問ごとに a, b…）。例：10d03 ＝ shiki-10.dr.3、10d05b ＝ shiki-10.dr.5 の2つ目
//   「〜について解こう」の答えは式なので入力欄では打てない。そこで、
//     ・解いた式を選ぶ4択（誤答は、移項の符号まちがい・一部の項だけをわる・わらない・かける・逆数 など。解いた式と同じ値になるものは入れない）
//     ・解いた式にもとづく数（x＝□y の □、代入した値）を聞く数値入力
//   に分けて移した。解いた式は algebra.js の多項式（pdivMono など）で計算して出し、数を入れて、もとの等式が成り立つかを、つくるたびに確かめている。
//   π・ℓ・S・V など、algebra.js の文字（小文字 a〜z）にない記号は、内部の小文字を TeX の記号に置きかえて表示する（dsp）。
// ============================================================
import { t, pick, choices4, shuffle, sample, rnz, fracAns, gcd, lcm } from "../kit.js";
import { unitFor } from "../unit-kit.js";
import { Q, qsub, qdiv, qneg, qeq, qiszero, qval, qtex, poly, padd, psub, pneg, pscale, pmul, pdivMono, peval, peq, ptex } from "../algebra.js";
const unit = unitFor("shiki");
const tx = (s) => `$${s}$`;

// ── 式の表示（文字の置きかえ・分数の形・正の項を先に）──────────────────
const expsOf = (key) => { const e = {}; for (const m of key.matchAll(/([a-z])(-?\d+)/g)) e[m[1]] = +m[2]; return e; };
const degOf = (e) => Object.values(e).reduce((a, c) => a + Math.max(0, c), 0);
const sortedKeys = (p, order) => Object.keys(p).sort((a, b) => {
  const ea = expsOf(a), eb = expsOf(b), da = degOf(ea), db = degOf(eb);
  if (da !== db) return db - da;
  const vs = order || [...new Set([...Object.keys(ea), ...Object.keys(eb)])].sort();
  for (const v of vs) { const x = (ea[v] || 0) - (eb[v] || 0); if (x) return -x; }
  return 0;
});
/** 項を keys の順にならべた TeX */
const ptK = (p, keys) => keys.map((k, i) => {
  const c = p[k], neg = c[0] < 0, body = ptex({ [k]: [Math.abs(c[0]), c[1]] });
  return (i === 0 ? (neg ? "-" : "") : neg ? "-" : "+") + body;
}).join("");
/** 多項式の TeX。先頭がマイナスの項で、あとにプラスの項があれば、そのプラスの項を先頭に（c−b、9−3y の形） */
const pt = (p, order) => {
  const ks = sortedKeys(p, order);
  if (!ks.length) return "0";
  const i = ks.findIndex((k) => p[k][0] > 0);
  if (i > 0 && p[ks[0]][0] < 0) ks.unshift(ks.splice(i, 1)[0]);
  return ptK(p, ks);
};
/** 内部の小文字を、表示する記号に置きかえる（\frac はそのまま）。map：{ s: "S", p: "\\pi " } */
const dsp = (s, map) => (map ? s.replace(/\\frac/g, "\u0001").replace(/[a-z]/g, (c) => map[c] || c).replace(/\u0001/g, "\\frac") : s);
/** 係数が分数のときは、共通の分母の分数にして書く（(12-3y)/2 の形）。分母に文字が出る式は、項ごとに書く */
const ftex = (p, ord, map) => {
  const ks = Object.keys(p);
  if (!ks.length) return "0";
  if (ks.some((k) => /-\d/.test(k))) return dsp(pt(p, ord), map);
  let L = 1;
  for (const k of ks) L = lcm(L, p[k][1]);
  if (L === 1) return dsp(pt(p, ord), map);
  const num = pscale(p, L);
  if (ks.length === 1) {
    const neg = num[ks[0]][0] < 0;
    return `${neg ? "-" : ""}\\frac{${dsp(pt(neg ? pneg(num) : num, ord), map)}}{${L}}`;
  }
  return `\\frac{${dsp(pt(num, ord), map)}}{${L}}`;
};
const eqTex = (L, R, ord, map) => `${ftex(L, ord, map)}=${ftex(R, ord, map)}`;
const V1 = (v) => poly([1, { [v]: 1 }]);

// ── 等式を v について解く（v の1次式）───────────────────────────
/** D＝L−R を、C·v＋B に分ける（C：v の係数の多項式、B：v をふくまない部分） */
const splitV = (D, v) => {
  const C = {}, B = {};
  for (const k of Object.keys(D)) {
    const m = k.match(new RegExp(`${v}(-?\\d+)`));
    if (!m) B[k] = D[k];
    else if (m[1] === "1") C[k.replace(m[0], "")] = D[k];
    else throw new Error("v の1次式でない");
  }
  return [C, B];
};
/** 解く：C·v ＝ rhs（C の先頭の係数が正になるよう、必要なら両辺を入れかえる）。C が1項なら sol＝rhs÷C */
const solve = (L, R, v) => {
  let [C, B] = splitV(psub(L, R), v);
  const ck = Object.keys(C);
  if (ck.length && C[ck[0]][0] < 0) { C = pneg(C); B = pneg(B); }
  const rhs = pneg(B);
  return { C, rhs, sol: ck.length === 1 ? pdivMono(rhs, C) : null, lhsV: pmul(C, V1(v)) };
};
const PR = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101];
/** 解を、数を入れてたしかめる（合わなければ例外） */
const checkSol = (L, R, v, sol) => {
  const env = {};
  for (const p of [L, R, sol]) for (const k of Object.keys(p)) for (const ch of Object.keys(expsOf(k))) if (ch !== v) env[ch] = Q(PR[ch.charCodeAt(0) - 97]);
  env[v] = peval(sol, env);
  if (!qiszero(qsub(peval(L, env), peval(R, env)))) throw new Error("解がもとの等式に合わない");
};
const isUnit1 = (C) => Object.keys(C).length === 1 && C[""] && qeq(C[""], Q(1));
/** ありがちな誤答の候補（グループごと。同じグループからは、まず1つ） */
const wrongGroups = (rhs, C, sol) => {
  const ks = Object.keys(rhs), dv = (p) => pdivMono(p, C);
  const flip = (k) => { const q = { ...rhs }; q[k] = qneg(q[k]); return q; };
  const one = isUnit1(C), constC = Object.keys(C).length === 1 && C[""] !== undefined;
  const G = [];
  G.push(ks.filter((k) => k !== "").map((k) => dv(flip(k))));                                                          // 移項で、文字の項の符号をかえ忘れた
  if (!one && ks.length > 1) G.push(ks.map((k) => { const o = { [k]: rhs[k] }; return padd(dv(o), psub(rhs, o)); }));    // 一部の項だけをわった
  if (rhs[""]) G.push([dv(flip(""))]);                                                                                 // 定数項の符号をかえた
  if (!one) G.push([rhs]);                                                                                             // わらなかった
  G.push([pneg(sol)]);                                                                                                 // 全体の符号が逆
  if (!one) G.push([pmul(rhs, C)]);                                                                                    // わるところを、かけてしまった
  if (!one && ks.length === 1) G.push([pdivMono(C, rhs)]);                                                             // 逆数にしてしまった
  if (constC && !one) { const c = C[""], n0 = c[1] > 1 ? c[1] : Math.abs(c[0]); G.push([psub(rhs, poly([n0, {}])), padd(rhs, poly([n0, {}]))]); }   // わるかわりに、ひいた・たした
  else if (!one) G.push([psub(rhs, C)]);
  return G;
};
/** グループから、誤答を3つ選ぶ（正解と式として同じ値のものは除く） */
const take3 = (r, groups, ok) => {
  const out = [];
  const add = (w) => { if (out.length < 3 && ok(w) && !out.some((o) => peq(o, w))) out.push(w); };
  for (const g of groups) { const c = shuffle(r, g).filter(ok); if (c.length) add(c[0]); }
  for (const g of groups) for (const w of g) add(w);
  return out;
};
/** 解く手順の解説 */
const explain = (L, R, v, ord, map) => {
  const { C, rhs, sol, lhsV } = solve(L, R, v);
  const e = (p) => ftex(p, ord, map), dvn = (map && map[v]) || v, out = [];
  const moved = !(peq(lhsV, L) && peq(rhs, R));
  const ck = Object.keys(C), numC = ck.length === 1 && ck[0] === "";
  if (moved) out.push(`$${dvn}$ をふくむ項を左辺に、ほかの項を右辺に移項して、$${e(lhsV)}=${e(rhs)}$。`);
  if (!isUnit1(C)) {
    if (numC) {
      const a = C[""];
      out.push(a[1] === 1 ? `両辺を ${a[0]} でわって、$${dvn}=${e(sol)}$。` : a[0] === 1 ? `両辺に ${a[1]} をかけて、$${dvn}=${e(sol)}$。` : `両辺に $\\frac{${a[1]}}{${a[0]}}$ をかけて、$${dvn}=${e(sol)}$。`);
    } else out.push(`両辺を $${dsp(pt(C, ord), map)}$ でわって、$${dvn}=${e(sol)}$。`);
  } else if (moved) { /* 移項だけで解けた */ } else out.push(`$${dvn}=${e(sol)}$。`);
  out.push(`答え　$${dvn}=${e(sol)}$`);
  return out;
};
/** 「等式を v について解くと？」の4択をつくる（q を除く） */
const solveChoices = (r, L, R, v, o = {}) => {
  const { ord, map } = o, info = solve(L, R, v);
  checkSol(L, R, v, info.sol);
  const dvn = (map && map[v]) || v, form = (p) => tx(`${dvn}=${ftex(p, ord, map)}`);
  const ans = form(info.sol);
  const ws = take3(r, wrongGroups(info.rhs, info.C, info.sol), (w) => !peq(w, info.sol));
  return { ans, choices: choices4(r, ans, ws.map(form)), steps: explain(L, R, v, ord, map), eq: eqTex(L, R, ord, map), dvn };
};
const HINT_SOLVE = "解く文字をふくむ項だけを左辺に残す。ほかの項は、移項するとき符号がどうなる？ 文字にかかる数は、両辺をどうすればよい？";

// ── 数値で確かめる4択（式が分数の形などで、多項式の道具では扱いにくいもの）──────
/** F：{ vars: 使う文字（表示名）, resid(vals): 左辺−右辺, ans: 正しい式（表示）, f(vals): 解く文字の値, wrongs: [[式, f(vals)]…] } */
const checkFam = (F, v) => {
  const vals = {};
  F.vars.forEach((x, i) => { vals[x] = [3.7, 2.3, 5.9, 4.3, 6.1][i % 5]; });
  vals[v] = F.f[v](vals);
  if (Math.abs(F.resid(vals)) > 1e-9) throw new Error(`${F.name}：解が合わない`);
  const base = F.f[v](vals);
  for (const [, g] of F.wrongs[v]) if (Math.abs(g(vals) - base) < 1e-6) throw new Error(`${F.name}：誤答が正解と同じ値`);
};
const famChoices = (r, F, v) => {
  checkFam(F, v);
  const ans = tx(F.ans[v]);
  return { ans, choices: choices4(r, ans, F.wrongs[v].map(([s]) => tx(s))) };
};

export const UNITS = [
  unit("10", {
    name: "等式を、目的に合う形に変形しよう",
    desc: "等式の変形（ある文字について解く）。身近な公式を、目的に合わせて変形する",
    prereqs: ["J2-sk09", "J1-e2"],
    points: [
      "等式を、目的に合わせて別の形に直すことを等式の変形という。等式を $x=\\cdots$ の形にすることを、$x$ について解くという。",
      "等式の変形には、1年で学んだ等式の性質（両辺に同じ数をたしても、ひいても、かけても、わっても、等式は成り立つ）と、移項を使う。",
      "解く文字以外の文字は、数と同じように考える。たとえば $V=\\pi r^2h$ を $h$ について解くと、両辺を $\\pi r^2$ でわって、$h=\\frac{V}{\\pi r^2}$。",
      "文字にかかっている数や式で、両辺を全部（右辺の項ぜんぶ）わることに気をつける。移項するときは符号がかわる。",
    ],
    levels: {
      // ───────── 1 基礎 ─────────
      1: [
        // 10d01 a＋b＝c [a]、x−7＝y [x]、x＋3y＝9 [x]
        t("10d01", (r) => {
          const [u, w, z] = sample(r, ["a", "b", "c", "m", "n", "s", "t", "x", "y", "z"], 3);
          const kind = pick(r, ["A", "B", "C"]);
          let L, R;
          if (kind === "A") { L = poly([1, { [u]: 1 }], [pick(r, [1, -1]), { [w]: 1 }]); R = V1(z); }
          else if (kind === "B") { L = poly([1, { [u]: 1 }], [pick(r, [1, -1]) * r(2, 9), {}]); R = V1(w); }
          else { L = poly([1, { [u]: 1 }], [pick(r, [1, 1, -1]) * r(2, 6), { [w]: 1 }]); R = poly([r(6, 20), {}]); }
          const s = solveChoices(r, L, R, u);
          return {
            q: `等式 $${s.eq}$ を、$${u}$ について解くと？`,
            ans: s.ans, choices: s.choices,
            hint: HINT_SOLVE,
            steps: s.steps,
          };
        }),
        // 10d02 6x＝y [x]、ℓ＝2πr [r]、x/4＝y [x]
        t("10d02", (r) => {
          const kind = pick(r, ["A", "B", "C"]);
          let L, R, v, o = {};
          if (kind === "A") {
            const [u, w] = pick(r, [["x", "y"], ["a", "b"], ["m", "n"], ["s", "t"], ["x", "z"]]);
            L = poly([r(2, 9), { [u]: 1 }]); R = V1(w); v = u;
          } else if (kind === "B") {
            // l＝ℓ、p＝π、d＝直径（内部の小文字）
            const [tgt, k] = pick(r, [["r", 2], ["d", 1]]);
            L = V1("l"); R = poly([k, { p: 1, [tgt]: 1 }]); v = tgt; o = { map: { l: "\\ell ", p: "\\pi " } };
          } else {
            const [u, w] = pick(r, [["x", "y"], ["a", "b"], ["m", "n"], ["s", "t"]]);
            L = poly([[1, r(2, 9)], { [u]: 1 }]); R = V1(w); v = u;
          }
          const s = solveChoices(r, L, R, v, o);
          return {
            q: `等式 $${s.eq}$ を、$${s.dvn}$ について解くと？`,
            ans: s.ans, choices: s.choices,
            hint: "解く文字にかかっている数や文字で、両辺をわる（かけて分母をはらう）。ほかの文字は、数と同じように考える。",
            steps: s.steps,
          };
        }),
        // 10q01 x＋2y＝6 [x]、5a＝b [a]、x/3＝y [x]
        t("10q01", (r) => {
          const kind = pick(r, ["A", "B", "C"]);
          let L, R, v;
          if (kind === "A") { const [u, w] = pick(r, [["x", "y"], ["a", "b"], ["m", "n"], ["s", "t"]]); L = poly([1, { [u]: 1 }], [r(2, 5), { [w]: 1 }]); R = poly([r(5, 18), {}]); v = u; }
          else if (kind === "B") { const [u, w] = pick(r, [["a", "b"], ["x", "y"], ["m", "n"], ["s", "t"]]); L = poly([r(2, 9), { [u]: 1 }]); R = V1(w); v = u; }
          else { const [u, w] = pick(r, [["x", "y"], ["a", "b"], ["m", "n"], ["s", "t"]]); L = poly([[1, r(2, 9)], { [u]: 1 }]); R = V1(w); v = u; }
          const s = solveChoices(r, L, R, v);
          return {
            q: `等式 $${s.eq}$ を、$${v}$ について解くと？`,
            ans: s.ans, choices: s.choices,
            hint: HINT_SOLVE,
            steps: s.steps,
          };
        }),
      ],
      // ───────── 2 標準 ─────────
      2: [
        // 10d03 2x−3y＝12 [x]、x−2y＝6 [y]、y＝3x−5 [x]
        t("10d03", (r) => {
          const [u, w] = pick(r, [["x", "y"], ["x", "y"], ["a", "b"], ["m", "n"], ["s", "t"]]);
          const kind = pick(r, ["A", "B", "C"]);
          let L, R, v;
          if (kind === "A") { L = poly([r(2, 5), { [u]: 1 }], [pick(r, [1, -1]) * r(2, 6), { [w]: 1 }]); R = poly([r(4, 24), {}]); v = u; }
          else if (kind === "B") { L = poly([1, { [u]: 1 }], [pick(r, [1, -1]) * r(2, 4), { [w]: 1 }]); R = poly([r(3, 18), {}]); v = w; }
          else { L = V1(w); R = poly([r(2, 5), { [u]: 1 }], [pick(r, [1, -1]) * r(1, 9), {}]); v = u; }
          const s = solveChoices(r, L, R, v);
          return {
            q: `等式 $${s.eq}$ を、$${v}$ について解くと？`,
            ans: s.ans, choices: s.choices,
            hint: HINT_SOLVE,
            steps: s.steps,
          };
        }),
        // 10d04a S＝1/2 ah [a]（三角形の面積）など、公式を目的の文字について解く
        t("10d04a", (r) => {
          const F = pick(r, FORMULA);
          const v = pick(r, F.targets);
          const ord = F.ord;
          const s = solveChoices(r, F.L, F.R, v, { ord, map: F.map });
          return {
            q: `${F.stmt}$${s.eq}$ と表される。この等式を、$${s.dvn}$ について解くと？`,
            ans: s.ans, choices: s.choices,
            hint: "公式の文字のうち、解く文字以外は、数と同じように考える。解く文字にかかっているものを、両辺で消そう。",
            steps: s.steps,
          };
        }),
        // 10d04b m＝(a+b+c)/3 [c]（3回のテストの平均点）
        t("10d04b", (r) => {
          const n = pick(r, [3, 3, 4]);
          const names = pick(r, [["a", "b", "c", "d"], ["x", "y", "z", "w"]]).slice(0, n);
          const v = pick(r, names);
          const L = V1("m"), R = pscale(names.reduce((p, x) => padd(p, V1(x)), {}), [1, n]);
          const s = solveChoices(r, L, R, v, { ord: ["m", ...names] });
          return {
            q: `${n}回のテストの得点を ${names.map((x) => `$${x}$`).join("点、")}点、平均点を $m$ 点とすると、$${s.eq}$ と表される。この等式を、$${v}$ について解くと？`,
            ans: s.ans, choices: s.choices,
            hint: "分数の形の等式は、両辺に分母の数をかけて、分母をはらってから、移項しよう。",
            steps: s.steps,
          };
        }),
        // 10q02 3x＋2y＝12 を y について解く
        t("10q02", (r) => {
          const [u, w] = pick(r, [["x", "y"], ["x", "y"], ["a", "b"], ["m", "n"]]);
          const L = poly([r(2, 6), { [u]: 1 }], [r(2, 5), { [w]: 1 }]), R = poly([r(6, 30), {}]);
          const s = solveChoices(r, L, R, w);
          return {
            q: `等式 $${s.eq}$ を、$${w}$ について解くと？`,
            ans: s.ans, choices: s.choices,
            hint: HINT_SOLVE,
            steps: s.steps,
          };
        }),
        // 10q03 長方形の周の長さ ℓ＝2(a+b) を b について解く
        t("10q03", (r) => {
          const kind = pick(r, ["P", "P", "M"]);
          const v = pick(r, ["a", "b"]), o = v === "a" ? "b" : "a";
          const F = kind === "P" ? famPerim(v, o) : famMean(v, o);
          const { ans, choices } = famChoices(r, F, v);
          return {
            q: `${F.stmt}$${F.eq}$ と表される。この等式を、$${v}$ について解くと？`,
            ans, choices,
            hint: kind === "P" ? "まず、かっこの前の数で両辺をわって、かっこの中の形にしよう。そのあと、移項する。" : "分数の形の等式は、両辺に分母の数をかけて、分母をはらってから、移項しよう。",
            steps: F.steps[v],
          };
        }),
        // 10q04a s＝vt を t について解く（道のり・速さ・時間 など）
        t("10q04a", (r) => {
          const C = pick(r, RELS);
          const v = pick(r, C.targets);
          const L = V1(C.lhs), R = pmul(V1(C.a), V1(C.b));
          const s = solveChoices(r, L, R, v, { map: C.map });
          return {
            q: `${C.stmt}$${s.eq}$ が成り立つ。この等式を、$${s.dvn}$ について解くと？`,
            ans: s.ans, choices: s.choices,
            hint: "解く文字にかかっている文字で、両辺をわる。ほかの文字は、数と同じように考える。",
            steps: s.steps,
          };
        }),
        // 10q04b 道のり s＝150、速さ v＝60 のときの時間 t
        t("10q04b", (r) => {
          const v = pick(r, [20, 30, 40, 50, 60, 70, 80, 90]);
          const tm = pick(r, [1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 0.5, 1]);
          const s = v * tm;
          if (!Number.isInteger(s)) return { skip: true };
          return {
            q: `道のり $s$ km、速さ 時速 $v$ km、時間 $t$ 時間について、$s=vt$ が成り立つ。$s=${s}$、$v=${v}$ のときの $t$ の値は？`,
            ans: tm, unit: "時間",
            hint: "まず、$t$ について解いた式をつくる。そこに、$s$ と $v$ の値を入れよう。",
            steps: ["$s=vt$ を $t$ について解く。両辺を $v$ でわって、$t=\\frac{s}{v}$。", `$s=${s}$、$v=${v}$ を代入して、$t=\\frac{${s}}{${v}}=${tm}$。`],
          };
        }),
      ],
      // ───────── 3 応用 ─────────
      3: [
        // 10d05a 3a+2b+c＝1000（りんご・なしを買って、おつり）の等式
        t("10d05a", (r) => {
          const S = shop(r);
          const L = S.L, R = S.R;
          const bad = [
            [poly([S.q, { a: 1 }], [S.p, { b: 1 }], [1, { c: 1 }]), R],     // 個数をとりちがえた
            [poly([S.p, { a: 1 }], [S.q, { b: 1 }]), V1("c")],              // おつりが代金と考えた
            [poly([S.p, { a: 1 }], [S.q, { b: 1 }], [-1, { c: 1 }]), R],    // おつりの符号がちがう
            [poly([1, { a: 1 }], [1, { b: 1 }], [1, { c: 1 }]), R],         // 個数を忘れた
          ].filter(([l2, r2]) => !sameEq(l2, r2, L, R));
          const form = (l2, r2) => tx(`${ftex(l2)}=${ftex(r2)}`);
          const ans = form(L, R);
          return {
            q: `${S.stmt} $a$、$b$、$c$ の関係を表す等式は、次のうちどれか。`,
            ans,
            choices: choices4(r, ans, shuffle(r, bad).slice(0, 3).map(([l2, r2]) => form(l2, r2))),
            hint: "買った代金の合計は、（1個の値段）×（個数）をたしたもの。出したお金は、代金の合計とおつりの和。",
            steps: [`${S.n1}の代金は $${S.p}a$ 円、${S.n2}の代金は $${S.q}b$ 円。`, `代金の合計とおつりの和が、出したお金の ${S.m} 円だから、$${eqTex(L, R)}$。`],
          };
        }),
        // 10d05b その等式を b について解く
        t("10d05b", (r) => {
          const S = shop(r);
          const s = solveChoices(r, S.L, S.R, "b");
          return {
            q: `${S.stmt} これを表す等式 $${s.eq}$ を、$b$ について解くと？`,
            ans: s.ans, choices: s.choices,
            hint: HINT_SOLVE,
            steps: s.steps,
          };
        }),
        // 10d05c a＝120、c＝140 のときの b
        t("10d05c", (r) => {
          const S = shop(r, true);
          const info = solve(S.L, S.R, "b");
          return {
            q: `${S.stmt} $a=${S.av}$、$c=${S.cv}$ のとき、$b$ の値は？`,
            ans: S.bv, unit: "円",
            hint: "等式を $b$ について解いた式をつくってから、$a$ と $c$ の値を代入しよう。",
            steps: [
              `$${S.eqs}$ を $b$ について解くと、$b=${ftex(info.sol)}$。`,
              `$a=${S.av}$、$c=${S.cv}$ を代入して、$b=\\frac{${S.m}-${S.p}\\times${S.av}-${S.cv}}{${S.q}}=\\frac{${S.m - S.p * S.av - S.cv}}{${S.q}}=${S.bv}$（円）`,
            ],
          };
        }),
        // 10d06a 台形 S＝1/2(a+b)h を h について解く
        t("10d06a", (r) => {
          const v = pick(r, ["h", "h", "a", "b"]);
          const o = v === "a" ? "b" : "a";
          const F = famTrap(v, o);
          const { ans, choices } = famChoices(r, F, v);
          return {
            q: `台形の面積 $S$ は、上底 $a$、下底 $b$、高さ $h$ のとき、$S=\\frac{1}{2}(a+b)h$ と表される。この等式を、$${v}$ について解くと？`,
            ans, choices,
            hint: "まず、両辺に 2 をかけて分母をはらう。そのあと、$(a+b)$ をひとまとまりと見て、解く文字だけを左辺に残そう。",
            steps: F.steps[v],
          };
        }),
        // 10d06b S＝30、a＝4、b＝6 のときの h
        t("10d06b", (r) => {
          let a, b, h, S;
          do { a = r(2, 9); b = r(2, 9); h = r(2, 10); } while (((a + b) * h) % 2 !== 0);
          S = ((a + b) * h) / 2;
          const v = pick(r, ["h", "h", "a"]);
          if (v === "h") {
            return {
              q: `台形の面積 $S$ は、上底 $a$、下底 $b$、高さ $h$ のとき、$S=\\frac{1}{2}(a+b)h$ と表される。$S=${S}$、$a=${a}$、$b=${b}$ のとき、$h$ の値は？（長さは cm、面積は cm²）`,
              ans: h, unit: "cm",
              hint: "等式を $h$ について解いた式をつくってから、$S$、$a$、$b$ の値を代入しよう。",
              steps: ["$S=\\frac{1}{2}(a+b)h$ を $h$ について解くと、$h=\\frac{2S}{a+b}$。", `$S=${S}$、$a=${a}$、$b=${b}$ を代入して、$h=\\frac{2\\times${S}}{${a}+${b}}=\\frac{${2 * S}}{${a + b}}=${h}$（cm）`],
            };
          }
          return {
            q: `台形の面積 $S$ は、上底 $a$、下底 $b$、高さ $h$ のとき、$S=\\frac{1}{2}(a+b)h$ と表される。$S=${S}$、$b=${b}$、$h=${h}$ のとき、$a$ の値は？（長さは cm、面積は cm²）`,
            ans: a, unit: "cm",
            hint: "等式を $a$ について解いた式をつくってから、$S$、$b$、$h$ の値を代入しよう。",
            steps: ["$S=\\frac{1}{2}(a+b)h$ を $a$ について解くと、$a=\\frac{2S}{h}-b$。", `$S=${S}$、$b=${b}$、$h=${h}$ を代入して、$a=\\frac{2\\times${S}}{${h}}-${b}=${(2 * S) / h}-${b}=${a}$（cm）`],
          };
        }),
      ],
      // ───────── 4 入試レベル ─────────
      4: [
        // 10d07 (x+2y)/3＝(x−y)/2 を x について解く：x＝□y の □
        t("10d07", (r) => {
          let p, q, a, b, c2, g;
          for (let i = 0; i < 400; i++) {
            p = pick(r, [2, 3, 4, 5, 6]); q = pick(r, [2, 3, 4, 5, 6]);
            a = rnz(r, -4, 4); b = rnz(r, -4, 4); c2 = pick(r, [1, 1, 2]);
            const den = q - p * c2, num = p * b - q * a;
            if (den === 0 || num === 0) continue;
            const z = Q(num, den);
            if (z[1] === 1 && Math.abs(z[0]) <= 12) { g = z[0]; break; }
          }
          if (g === undefined) return { skip: true };
          const lcmv = lcm(p, q), mp = lcmv / p, mq = lcmv / q;
          const N1 = poly([1, { x: 1 }], [a, { y: 1 }]), N2 = poly([c2, { x: 1 }], [b, { y: 1 }]);
          // 確かめ：y＝1 のとき x＝g で、両辺が等しい
          if (qval(qsub(qdiv(peval(N1, { x: Q(g), y: Q(1) }), Q(p)), qdiv(peval(N2, { x: Q(g), y: Q(1) }), Q(q)))) !== 0) throw new Error("解が合わない");
          const mulP = (m, N) => (m === 1 ? ptex(N) : `${m}(${ptex(N)})`);
          return {
            q: `等式 $\\frac{${ptex(N1)}}{${p}}=\\frac{${ptex(N2)}}{${q}}$ を、$x$ について解くと、$x=\\square y$ となる。□は？`,
            ans: g,
            hint: "両辺に、分母の最小公倍数をかけて、分母をはらおう。そのあと、$x$ をふくむ項を左辺に集める。",
            steps: [
              `両辺に、${p} と ${q} の最小公倍数 ${lcmv} をかけて、$${mulP(mp, N1)}=${mulP(mq, N2)}$。`,
              `かっこをはずして、$${ptex(pscale(N1, mp))}=${ptex(pscale(N2, mq))}$。`,
              `$x$ をふくむ項を左辺に、$y$ をふくむ項を右辺に移項して、$${ptex(pscale(psub(pscale(N1, mp), pscale(N2, mq)), 1))}$ の形を整理すると $x=${g}y$。`,
              `したがって、□ は ${g}。`,
            ],
          };
        }),
        // 10d08a S＝2πr²+2πrh を h について解く（円柱・円錐の表面積）
        t("10d08a", (r) => {
          const F = pick(r, SURF);
          const s = solveChoices(r, F.L, F.R, F.v, { ord: ["p", "q", "x"], map: F.map });
          return {
            q: `${F.stmt}$${s.eq}$ と表される。この等式を、$${s.dvn}$ について解くと？`,
            ans: s.ans, choices: s.choices,
            hint: `解く文字をふくむ項だけを左辺に残し、ほかの項を右辺に移す。そのあと、解く文字にかかっている ${F.hintCoef} で、両辺の全部をわろう。`,
            steps: s.steps,
          };
        }),
        // 10d08b S＝80π、r＝4 のときの h
        t("10d08b", (r) => {
          const F = pick(r, SURF), rad = r(2, 6), h = r(1, 10);
          const K = F.coef(rad, h);
          return {
            q: `${F.stmt}$${eqTex(F.L, F.R, ["p", "q", "x"], F.map)}$ と表される。表面積が ${K}π cm²、$r=${rad}$ cm のとき、${F.hName}は何cmか。`,
            ans: h, unit: "cm",
            hint: "等式を解いた式に、$S$ と $r$ の値を代入しよう。（別の道：先に値を代入してから解いてもよい）",
            steps: [
              `${F.hName}を、等式を解いた式で表すと、$${F.vName}=${ftex(solve(F.L, F.R, F.v).sol, ["p", "q", "x"], F.map)}$。`,
              `$S=${K}\\pi$、$r=${rad}$ を代入して、$${F.vName}=\\frac{${K}\\pi}{${F.den(rad)}\\pi}-${rad}=${K / F.den(rad)}-${rad}=${h}$（cm）`,
            ],
          };
        }),
        // 10q05 V を、S と r を使った式で表す：V＝□Sr
        t("10q05", (r) => {
          const F = pick(r, VOL);
          const ans = fracAns(F.vc, F.sc);
          return {
            q: `${F.shape}の、側面積を $S$、体積を $V$ とすると、$S=${F.S}$、$V=${F.V}$ と表される。$V$ を、$S$ と $${F.fac}$ を使った式で表すと、$V=\\square S${F.fac}$ となる。□は？`,
            ans,
            hint: `まず、$S$ の式を $h$ について解こう。それを、$V$ の式の $h$ に代入して、約分する。`,
            steps: [
              `$S=${F.S}$ を $h$ について解くと、$h=\\frac{S}{${F.Sden}}$。`,
              `$V=${F.V}$ の $h$ に代入して、$V=${F.Vlead}\\times\\frac{S}{${F.Sden}}$。`,
              `約分して、$V=${qtex(Q(F.vc, F.sc))}S${F.fac}$。だから、□ は ${ans}。`,
            ],
          };
        }),
      ],
    },
  }),
];

// ── 公式（10d04a）──────────────────────────────────────────
//   内部の文字：s＝S、v＝V、g＝S（底面積）、p＝π、q＝r、x＝h の置きかえ（map）。文字の並びが、表示のときの並び順になるよう選んである。
const FORMULA = [
  { stmt: "三角形の面積を $S$、底辺を $a$、高さを $h$ とすると、", L: V1("s"), R: pscale(pmul(V1("a"), V1("h")), [1, 2]), targets: ["a", "h"], map: { s: "S" } },
  { stmt: "平行四辺形の面積を $S$、底辺を $a$、高さを $h$ とすると、", L: V1("s"), R: pmul(V1("a"), V1("h")), targets: ["a", "h"], map: { s: "S" } },
  { stmt: "角錐の体積を $V$、底面積を $S$、高さを $h$ とすると、", L: V1("v"), R: pscale(pmul(V1("g"), V1("h")), [1, 3]), targets: ["h", "g"], map: { v: "V", g: "S" } },
  { stmt: "直方体の体積を $V$、縦を $a$、横を $b$、高さを $c$ とすると、", L: V1("v"), R: pmul(pmul(V1("a"), V1("b")), V1("c")), targets: ["a", "c"], map: { v: "V" } },
  { stmt: "底面の半径 $r$、高さ $h$ の円柱の体積を $V$ とすると、", L: V1("v"), R: pmul(pmul(V1("p"), pmul(V1("q"), V1("q"))), V1("x")), targets: ["x"], map: { v: "V", p: "\\pi ", q: "r", x: "h" }, ord: ["p", "q", "x"] },
];

// ── 身近な関係（10q04a）：lhs＝a×b ──────────────────────────
const RELS = [
  { stmt: "道のりを $s$、速さを $v$、時間を $t$ とすると、", lhs: "s", a: "v", b: "t", targets: ["t", "v"], map: undefined },
  { stmt: "代金を $y$、1個の値段を $a$、個数を $x$ とすると、", lhs: "y", a: "a", b: "x", targets: ["x", "a"], map: undefined },
  { stmt: "長方形の面積を $S$、縦を $a$、横を $b$ とすると、", lhs: "s", a: "a", b: "b", targets: ["a", "b"], map: { s: "S" } },
  { stmt: "底面積 $S$、高さ $h$ の柱の体積を $V$ とすると、", lhs: "v", a: "g", b: "h", targets: ["g", "h"], map: { v: "V", g: "S" } },
];

// ── 円柱・円錐の表面積（10d08）──────────────────────────────
//   p＝π、q＝r、x＝h（円柱）または ℓ（円錐）、s＝S
const SURF = [
  {
    stmt: "底面の半径 $r$、高さ $h$ の円柱の表面積 $S$ は、",
    L: V1("s"), R: poly([2, { p: 1, q: 2 }], [2, { p: 1, q: 1, x: 1 }]), v: "x", map: { s: "S", p: "\\pi ", q: "r", x: "h" },
    hName: "高さ $h$ ", vName: "h", coef: (rad, h) => 2 * rad * (rad + h), den: (rad) => 2 * rad, hintCoef: "$2\\pi r$",
  },
  {
    stmt: "底面の半径 $r$、母線の長さ $\\ell$ の円錐の表面積 $S$ は、",
    L: V1("s"), R: poly([1, { p: 1, q: 2 }], [1, { p: 1, q: 1, x: 1 }]), v: "x", map: { s: "S", p: "\\pi ", q: "r", x: "\\ell " },
    hName: "母線の長さ $\\ell$ ", vName: "\\ell", coef: (rad, h) => rad * (rad + h), den: (rad) => rad, hintCoef: "$\\pi r$",
  },
];

// ── 側面積と体積（10q05）：V＝(vc/sc)·S·fac ───────────────────
const VOL = [
  { shape: "底面の半径が $r$、高さが $h$ の円柱", S: "2\\pi rh", V: "\\pi r^{2}h", Sden: "2\\pi r", Vlead: "\\pi r^{2}", fac: "r", vc: 1, sc: 2 },
  { shape: "底面が1辺 $a$ の正方形で、高さが $h$ の四角柱", S: "4ah", V: "a^{2}h", Sden: "4a", Vlead: "a^{2}", fac: "a", vc: 1, sc: 4 },
  { shape: "底面が縦 $a$・横 $2a$ の長方形で、高さが $h$ の四角柱", S: "6ah", V: "2a^{2}h", Sden: "6a", Vlead: "2a^{2}", fac: "a", vc: 2, sc: 6 },
  { shape: "底面が縦 $a$・横 $3a$ の長方形で、高さが $h$ の四角柱", S: "8ah", V: "3a^{2}h", Sden: "8a", Vlead: "3a^{2}", fac: "a", vc: 3, sc: 8 },
  { shape: "底面が縦 $a$・横 $4a$ の長方形で、高さが $h$ の四角柱", S: "10ah", V: "4a^{2}h", Sden: "10a", Vlead: "4a^{2}", fac: "a", vc: 4, sc: 10 },
];

// ── 買い物（10d05）：p a＋q b＋c＝m ─────────────────────────
const SHOPS = [
  { n1: "りんご", k1: "個", n2: "なし", k2: "個" }, { n1: "みかん", k1: "個", n2: "かき", k2: "個" },
  { n1: "ノート", k1: "冊", n2: "えんぴつ", k2: "本" }, { n1: "プリン", k1: "個", n2: "ゼリー", k2: "個" },
  { n1: "クッキー", k1: "個", n2: "ドーナツ", k2: "個" },
];
/** 等式 p a＋q b＋c＝m とその文章。numeric：a・b・c に具体的な値（10円単位）をつくる */
const shop = (r, numeric) => {
  const S = pick(r, SHOPS);
  let p = r(2, 5), q = r(2, 5);
  while (q === p) q = r(2, 5);
  const m = pick(r, [500, 1000, 1000, 2000]);
  const o = { ...S, p, q, m };
  o.L = poly([p, { a: 1 }], [q, { b: 1 }], [1, { c: 1 }]); o.R = poly([m, {}]);
  o.eqs = eqTex(o.L, o.R);
  o.stmt = `1${S.k1} $a$ 円の${S.n1}${p}${S.k1}と、1${S.k2} $b$ 円の${S.n2}${q}${S.k2}を買って、${m}円出したら、おつりは $c$ 円だった。`;
  if (numeric) {
    for (let i = 0; i < 200; i++) {
      const a = 10 * r(5, 20), b = 10 * r(5, 20), c = m - p * a - q * b;
      if (c >= 10 && c <= 400) { o.av = a; o.bv = b; o.cv = c; break; }
    }
    if (o.av === undefined) { o.p = 3; o.q = 2; o.m = 1000; o.L = poly([3, { a: 1 }], [2, { b: 1 }], [1, { c: 1 }]); o.R = poly([1000, {}]); o.eqs = eqTex(o.L, o.R); o.stmt = `1${S.k1} $a$ 円の${S.n1}3${S.k1}と、1${S.k2} $b$ 円の${S.n2}2${S.k2}を買って、1000円出したら、おつりは $c$ 円だった。`; o.av = 120; o.cv = 140; o.bv = 250; }
  }
  return o;
};
/** 2つの等式が同じ（一方が他方の何倍か）か */
const sameEq = (L1, R1, L2, R2) => {
  const D1 = psub(L1, R1), D2 = psub(L2, R2), k = Object.keys(D1)[0];
  if (!D2[k] || Object.keys(D1).length !== Object.keys(D2).length) return false;
  return peq(pscale(D1, qdiv(D2[k], D1[k])), D2);
};

// ── 数値で確かめる公式の4択（台形・周の長さ・平均）────────────────
/** 台形 S＝1/2(a+b)h を v（h・a・b）について解く */
const famTrap = (v, o) => {
  const F = {
    name: "台形", vars: ["S", "a", "b", "h"],
    resid: (x) => x.S - 0.5 * (x.a + x.b) * x.h,
    f: { h: (x) => (2 * x.S) / (x.a + x.b), a: (x) => (2 * x.S) / x.h - x.b, b: (x) => (2 * x.S) / x.h - x.a },
    ans: { h: "h=\\frac{2S}{a+b}", a: "a=\\frac{2S}{h}-b", b: "b=\\frac{2S}{h}-a" },
    wrongs: {
      h: [["h=\\frac{2S}{a}+b", (x) => (2 * x.S) / x.a + x.b], ["h=\\frac{S}{2(a+b)}", (x) => x.S / (2 * (x.a + x.b))], ["h=2S(a+b)", (x) => 2 * x.S * (x.a + x.b)], ["h=\\frac{2S-a}{b}", (x) => (2 * x.S - x.a) / x.b]],
      a: [["a=\\frac{2S}{h}+b", (x) => (2 * x.S) / x.h + x.b], ["a=\\frac{S}{2h}-b", (x) => x.S / (2 * x.h) - x.b], ["a=\\frac{2S-b}{h}", (x) => (2 * x.S - x.b) / x.h], ["a=\\frac{2S}{h-b}", (x) => (2 * x.S) / (x.h - x.b)]],
      b: [["b=\\frac{2S}{h}+a", (x) => (2 * x.S) / x.h + x.a], ["b=\\frac{S}{2h}-a", (x) => x.S / (2 * x.h) - x.a], ["b=\\frac{2S-a}{h}", (x) => (2 * x.S - x.a) / x.h], ["b=\\frac{2S}{h-a}", (x) => (2 * x.S) / (x.h - x.a)]],
    },
    steps: {
      h: ["両辺を入れかえ、両辺に 2 をかけて、$(a+b)h=2S$。", "両辺を $a+b$ でわって、$h=\\frac{2S}{a+b}$。"],
      a: ["両辺を入れかえ、両辺に 2 をかけて、$(a+b)h=2S$。", "両辺を $h$ でわって、$a+b=\\frac{2S}{h}$。", "$b$ を移項して、$a=\\frac{2S}{h}-b$。"],
      b: ["両辺を入れかえ、両辺に 2 をかけて、$(a+b)h=2S$。", "両辺を $h$ でわって、$a+b=\\frac{2S}{h}$。", "$a$ を移項して、$b=\\frac{2S}{h}-a$。"],
    },
  };
  F.wrongs[v] = shuffle0(F.wrongs[v]).slice(0, 3);
  return F;
};
/** 長方形の周 ℓ＝2(a+b)（a・b どちらかについて） */
const famPerim = (v, o) => ({
  name: "周", stmt: "長方形の周の長さを $\\ell$、縦を $a$、横を $b$ とすると、", eq: "\\ell=2(a+b)", vars: ["l", "a", "b"],
  resid: (x) => x.l - 2 * (x.a + x.b),
  f: { [v]: (x) => x.l / 2 - x[o] },
  ans: { [v]: `${v}=\\frac{\\ell}{2}-${o}` },
  wrongs: { [v]: [[`${v}=\\ell-2${o}`, (x) => x.l - 2 * x[o]], [`${v}=\\frac{\\ell}{2}+${o}`, (x) => x.l / 2 + x[o]], [`${v}=\\frac{\\ell-${o}}{2}`, (x) => (x.l - x[o]) / 2], [`${v}=\\frac{\\ell}{2}-2${o}`, (x) => x.l / 2 - 2 * x[o]]] },
  steps: { [v]: ["両辺を入れかえ、両辺を 2 でわって、$a+b=\\frac{\\ell}{2}$。", `$${o}$ を移項して、$${v}=\\frac{\\ell}{2}-${o}$。`] },
});
/** 平均 m＝(a+b)/2（a・b どちらかについて） */
const famMean = (v, o) => ({
  name: "平均", stmt: "2回のテストの得点を $a$ 点、$b$ 点、平均点を $m$ 点とすると、", eq: "m=\\frac{a+b}{2}", vars: ["m", "a", "b"],
  resid: (x) => x.m - (x.a + x.b) / 2,
  f: { [v]: (x) => 2 * x.m - x[o] },
  ans: { [v]: `${v}=2m-${o}` },
  wrongs: { [v]: [[`${v}=2m+${o}`, (x) => 2 * x.m + x[o]], [`${v}=\\frac{m-${o}}{2}`, (x) => (x.m - x[o]) / 2], [`${v}=m-2${o}`, (x) => x.m - 2 * x[o]], [`${v}=\\frac{m}{2}-${o}`, (x) => x.m / 2 - x[o]]] },
  steps: { [v]: ["両辺を入れかえ、両辺に 2 をかけて、$a+b=2m$。", `$${o}$ を移項して、$${v}=2m-${o}$。`] },
});
/** 配列の先頭3つだけを使う前の並べかえ（乱数を使わない固定の入れかえはしない：そのまま返す） */
const shuffle0 = (a) => a;

// 移さなかった問題（なし）
export const SKIPPED = [];   // 第10時は、演習プリント 8問・小テスト 5問のすべてを移した（解いた式は4択か、式から出る数に直した）
