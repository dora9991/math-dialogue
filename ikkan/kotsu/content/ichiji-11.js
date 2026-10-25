// ============================================================
// ichiji-11.js — 一次関数 第11時「2元1次方程式のグラフをかこう」
//   ikkan の演習プリント（ichiji-11.dr.1〜8）・小テスト（ichiji-11.qz.1〜4）を、コツコツくんのテンプレートにしたもの。
//   テンプレート id＝「11」＋ d（演習）／q（小テスト）＋ ikkan の問題の番号（＋ 1つの問題から2つ以上つくるときは a, b…）。例：11d03a ＝ ichiji-11.dr.3 の1つ目
//   方程式 ax+by＝c は、linear.js の fromStd で直線 y＝(−a/b)x＋c/b にして、傾き・切片・軸との交点・点が上にあるか・面積を計算で出す（手で書かない）。
//   グラフ（図）は問題文に出せないので、「グラフをかく」問題は、かくのに使う 1 つの値（切片・x 軸との交点・ある x での y）を聞く形にした。
//   「y について解こう」は入力欄で打てないので、(a) 傾き・切片の値を聞く、(b) 4択（誤答は、移項の符号まちがい・b でわり忘れ・定数項の符号まちがいなど）にした。
//   「グラフ上の点をすべて選ぼう」は、4択（グラフ上の点は 1 つだけ）と、グラフ上にある点の個数の 2 通りにした。
// ============================================================
import { t, pick, choices4, shuffle, rnz, gcd } from "../kit.js";
import { unitFor } from "../unit-kit.js";
import { Q, qadd, qsub, qmul, qdiv, qneg, qeq, qval, linTex } from "../algebra.js";
import { line, fromStd, yAt, xIntercept, ltex, ptex2, qt, num } from "../linear.js";

const unit = unitFor("ichiji");

// ── このファイルの小道具 ─────────────────────────────────────────
const TX = (s) => `$${s}$`;
/** 負の数にかっこをつけた TeX（Q か整数） */
const P = (x) => { const s = qt(x); return s[0] === "-" ? `(${s})` : s; };
const PT = (p) => TX(ptex2(p));
/** 係数つきの項（1 は省く）  coefX(3,"y") → 3y、coefX(-1,"y") → -y */
const coefX = (c, v) => ltex(line(c, 0)).slice(2).replace(/x/g, v);
/** 直線の右辺（y＝ の右） */
const rhs = (L) => ltex(L).slice(2);
/** 方程式 ax+by＝c の TeX と、それを $ で包んだもの */
const eqTex = (a, b, c) => linTex(a, b, c);
const EQ = (a, b, c) => TX(eqTex(a, b, c));
/** k×v＝n を解く解説の式：「3x=15、x=5」。k が 1 のときは「x=5」だけ */
const solveVar = (k, v, n) => {
  const val = qdiv(Q(n), Q(k));
  return k === 1 ? TX(`${v}=${qt(val)}`) : `${TX(`${coefX(k, v)}=${n}`)}、${TX(`${v}=${qt(val)}`)}`;
};
/** ax+by に x、y の値を入れた式（かけ算で）。2×3−3×0 のように、方程式の書き方にそろえる */
const firstTerm = (a, x) => (x === 0 ? "0" : a === 1 ? String(x) : a === -1 ? String(-x) : `${P(a)}\\times ${P(x)}`);   // 先頭の項（a＝±1 は x の値をそのまま・−x の値、x＝0 は 0）
const lhsNum = (a, b, x, y) => {
  const first = firstTerm(a, x);
  const second = b === 1 ? `+${P(y)}` : b === -1 ? `-${P(y)}` : `${b < 0 ? "-" : "+"}${Math.abs(b)}\\times ${P(y)}`;
  return first + second;
};
/** x に値 k を入れて、y は文字のままの左辺：2×3−y */
const lhsX = (a, b, k) => {
  const first = firstTerm(a, k);
  return first + (b === 1 ? "+y" : b === -1 ? "-y" : `${b < 0 ? "-" : "+"}${Math.abs(b)}y`);
};
/** y に値 k を入れて、x は文字のままの左辺：2x−3×(−1) */
const lhsY = (a, b, k) => coefX(a, "x") + (b === 1 ? `+${P(k)}` : b === -1 ? `-${P(k)}` : `${b < 0 ? "-" : "+"}${Math.abs(b)}\\times ${P(k)}`);
/** ax+by＝c を y について解く解説（2 行）。移項 → 両辺を b でわる */
const solveYSteps = (a, b, c) => {
  const L = fromStd(a, b, c);
  const move = `${coefX(b, "y")}=${rhs(line(-a, c))}`;
  return b === 1
    ? [`${EQ(a, b, c)} の ${TX(coefX(a, "x"))} を右辺に移項して、${TX(ltex(L))}。`]
    : [`${TX(coefX(a, "x"))} を右辺に移項して、${TX(move)}。`, `両辺を ${TX(String(b))} でわって、${TX(ltex(L))}。`];
};

/** ax+by＝c を y について解いた式の4択。誤答は「ありがちな間違い」で、正解と同じ直線にならないものだけ */
const solveChoices = (r, a, b, c) => {
  const L = fromStd(a, b, c);
  const cand = [
    line(Q(a, b), Q(c, b)),          // x の項を移項しても、符号を変えない
    line(Q(-a, b), Q(-c, b)),        // 定数項の符号をまちがえる
    line(Q(a, b), Q(-c, b)),         // x の項も定数項も符号をまちがえる
    line(Q(-a, 1), Q(c, 1)),         // 両辺を b でわり忘れる
    line(Q(-a, b), Q(c, 1)),         // 定数項だけ b でわり忘れる
    line(Q(-a, 1), Q(c, b)),         // x の項だけ b でわり忘れる
  ];
  const seen = new Set([ltex(L)]);
  const wrongs = [];
  for (const w of shuffle(r, cand)) {
    const s = ltex(w);
    if (seen.has(s) || (qeq(w.a, L.a) && qeq(w.b, L.b))) continue;
    seen.add(s); wrongs.push(TX(s));
  }
  return choices4(r, TX(ltex(L)), wrongs, (i) => TX(ltex(line(qadd(L.a, Q(i + 1)), L.b))));
};

/** 係数 a、b（0 でない）と、定数 c を、条件に合うまでつくる。fn が null を返したら作り直し */
const tryGen = (r, fn, n = 300) => { for (let i = 0; i < n; i++) { const v = fn(); if (v) return v; } return null; };
const NZ = (r, m) => rnz(r, -m, m);

/** x 軸、y 軸との交点が、どちらも格子点になる方程式 ax+by＝c（x の係数は正。共通の約数なし） */
const d03Eq = (r) => {
  const a = r(1, 5), b = pick(r, [1, 2, 3, 4, 5, -1, -2, -3, -4, -5]);
  if (gcd(a, b) !== 1) return null;
  const c = Math.abs(a * b) * pick(r, [1, 2, 3, -1, -2, -3]);          // a、b の最小公倍数（互いに素なので |ab|）の倍数
  return Math.abs(c) > 30 ? null : [a, b, c];
};
/** 方程式 ax+by＝c のグラフ上の格子点から 1 点（x が -6〜6） */
const latticePts = (a, b, c, xr = [-6, 6], yMax = 12) => {
  const out = [];
  for (let x = xr[0]; x <= xr[1]; x++) {
    const y = qdiv(Q(c - a * x), Q(b));
    if (y[1] === 1 && Math.abs(y[0]) <= yMax) out.push([x, y[0]]);
  }
  return out;
};

export const UNITS = [
  unit("11", {
    name: "2元1次方程式のグラフ",
    desc: "方程式 ax+by=c を y について解いて、グラフの傾き・切片・軸との交点を求める",
    prereqs: ["J2-ik10", "J2-rk01"],
    points: [
      "2元1次方程式 $ax+by=c$ の解を点にとると、一直線にならぶ。この直線を、方程式のグラフという。",
      "方程式のグラフは、$y$ について解いて $y=mx+n$ の形にすると、傾き $m$ と切片 $n$ がわかる。",
      "$x$ 軸との交点は $y=0$ を、$y$ 軸との交点は $x=0$ を、方程式に代入して求める。",
      "点がグラフ上にあるかどうかは、その点の座標を方程式に代入して、成り立つかどうかで調べる。",
    ],
    levels: {
      // ───────── 1 基礎 ─────────
      1: [
        // 11d01a y について解く（4択）
        t("11d01a", (r) => {
          const [a, b, cc] = tryGen(r, () => {
            const a = r(1, 4), b = pick(r, [1, -1, 2, -2]), cc = NZ(r, 9);
            return gcd(a, b) === 1 ? [a, b, cc] : null;           // 係数に共通の約数がない（x の係数は正）
          });
          return {
            q: `方程式 ${EQ(a, b, cc)} を $y$ について解くと、次のうちどれになるか。`,
            ans: TX(ltex(fromStd(a, b, cc))),
            choices: solveChoices(r, a, b, cc),
            hint: "$y$ について解くとは、$y=\\cdots$ の形にすること。まず、$x$ の項を、どちらの辺に移す？",
            steps: solveYSteps(a, b, cc),
          };
        }),
        // 11d01b y について解いたときの傾き・切片
        t("11d01b", (r) => {
          const [a, b, c] = tryGen(r, () => {
            const a = r(1, 4), b = pick(r, [1, -1, 2, -2, 3, -3]), c = NZ(r, 9);
            return gcd(a, b) === 1 ? [a, b, c] : null;
          });
          const L = fromStd(a, b, c), ask = pick(r, ["傾き", "切片"]);
          return {
            q: `方程式 ${EQ(a, b, c)} を $y$ について解いて $y=mx+n$ の形にしたとき、${ask === "傾き" ? "傾き $m$" : "切片 $n$"} の値は？（約分した分数か、整数で答えよう。）`,
            ans: num(ask === "傾き" ? L.a : L.b),
            hint: "$y=mx+n$ の形にするには、$x$ の項を移項したあと、$y$ の係数でわる。$y$ の係数が 1 でないとき、右辺の全部の項をわっているかな？",
            steps: [...solveYSteps(a, b, c), `${ask}は ${TX(qt(ask === "傾き" ? L.a : L.b))}。`],
          };
        }),
        // 11d02a グラフがかけるように：y 軸との交点（切片）
        t("11d02a", (r) => {
          const [a, b, c] = tryGen(r, () => {
            const a = r(1, 4), b = pick(r, [1, -1, 2, -2, 3, -3]), k = NZ(r, 4);
            return gcd(a, b) === 1 ? [a, b, b * k] : null;
          });
          const L = fromStd(a, b, c);
          return {
            q: `方程式 ${EQ(a, b, c)} のグラフは、$y$ 軸と点 $(0, \\square)$ で交わる。$\\square$ に入る数は？`,
            ans: num(L.b),
            hint: "$y$ 軸上の点は、$x$ 座標がいくつ？ その値を方程式に入れると、$y$ はいくつになる？",
            steps: [`$y$ 軸上の点は ${TX("x=0")}。${EQ(a, b, c)} に代入して ${solveVar(b, "y", c)}。`, `交点は ${PT([0, L.b])}。`],
          };
        }),
        // 11d02b グラフ上の点：x＝k のときの y
        t("11d02b", (r) => {
          const [a, b, c, k, y] = tryGen(r, () => {
            const a = r(1, 4), b = pick(r, [1, -1, 2, -2, 3, -3]), x0 = r(-3, 3), y0 = r(-3, 3);
            const c = a * x0 + b * y0;
            if (c === 0 || gcd(a, b) !== 1) return null;
            const ks = [-4, -3, -2, -1, 0, 1, 2, 3, 4, 6].filter((k) => (c - a * k) % b === 0);
            if (!ks.length) return null;
            const k = pick(r, ks);
            return [a, b, c, k, (c - a * k) / b];
          });
          const L = fromStd(a, b, c);
          return {
            q: `方程式 ${EQ(a, b, c)} のグラフ上の点で、$x$ 座標が ${TX(String(k))} である点の $y$ 座標は？`,
            ans: y,
            hint: "グラフ上の点の座標は、方程式にあてはまる。$x$ に値を入れると、$y$ についての方程式になるかな？",
            steps: [`${EQ(a, b, c)} に ${TX(`x=${k}`)} を代入して、${TX(`${lhsX(a, b, k)}=${c}`)}。`, `${solveVar(b, "y", c - a * k)}。`],
          };
        }),
      ],
      // ───────── 2 標準 ─────────
      2: [
        // 11d03a x 軸との交点（x 座標）
        t("11d03a", (r) => {
          const [a, b, c] = tryGen(r, () => d03Eq(r));
          return {
            q: `方程式 ${EQ(a, b, c)} のグラフと $x$ 軸との交点の $x$ 座標は？`,
            ans: c / a,
            hint: "$x$ 軸上の点は、$y$ 座標がいくつ？ その値を方程式に入れると、$x$ についての方程式になるかな？",
            steps: [`$x$ 軸上の点は ${TX("y=0")}。${EQ(a, b, c)} に代入して ${solveVar(a, "x", c)}。`, `交点は ${PT([c / a, 0])}。`],
          };
        }),
        // 11d03b y 軸との交点（y 座標）
        t("11d03b", (r) => {
          const [a, b, c] = tryGen(r, () => d03Eq(r));
          return {
            q: `方程式 ${EQ(a, b, c)} のグラフと $y$ 軸との交点の $y$ 座標は？`,
            ans: c / b,
            hint: "$y$ 軸上の点は、$x$ 座標がいくつ？ その値を方程式に入れると、$y$ についての方程式になるかな？",
            steps: [`$y$ 軸上の点は ${TX("x=0")}。${EQ(a, b, c)} に代入して ${solveVar(b, "y", c)}。`, `交点は ${PT([0, c / b])}。`],
          };
        }),
        // 11d04a グラフ上にある点（4択。1つだけ）
        t("11d04a", (r) => {
          const [a, b, c, good, wrongs] = tryGen(r, () => {
            const a = r(1, 4), b = NZ(r, 4);
            if (gcd(a, b) !== 1) return null;
            const c = a * r(-3, 3) + b * r(-3, 3);
            const pts = latticePts(a, b, c, [-6, 6], 8);
            if (pts.length < 2 || c === 0) return null;
            const g = pick(r, pts), [x0, y0] = g;
            const near = [[y0, x0], [-x0, y0], [x0, -y0], [-x0, -y0], [x0 + 1, y0], [x0, y0 + 1], [x0 - 1, y0], [x0, y0 - 1], [x0 + 2, y0], [x0, y0 + 2]];
            const off = [], seen = new Set([g.join(",")]);
            for (const p of shuffle(r, near)) {
              if (seen.has(p.join(",")) || a * p[0] + b * p[1] === c) continue;
              seen.add(p.join(",")); off.push(p);
            }
            return off.length >= 3 ? [a, b, c, g, off.slice(0, 3)] : null;
          });
          const ans = TX(ptex2(good));
          return {
            q: `方程式 ${EQ(a, b, c)} のグラフ上にある点は、次のうちどれか。`,
            ans,
            choices: choices4(r, ans, wrongs.map((p) => TX(ptex2(p)))),
            hint: "グラフ上の点は、座標を方程式に代入すると、成り立つ。ひとつずつ、代入して確かめてみよう。",
            steps: [`${PT(good)} を代入すると、${TX(`${lhsNum(a, b, good[0], good[1])}=${c}`)} となり、成り立つ。`, `ほかの 3点は、代入すると ${TX(String(c))} にならない。`],
          };
        }),
        // 11d04b グラフ上にある点の個数
        t("11d04b", (r) => {
          const [a, b, c, pts, nOn] = tryGen(r, () => {
            const a = r(1, 4), b = NZ(r, 4);
            if (gcd(a, b) !== 1) return null;
            const c = a * r(-3, 3) + b * r(-3, 3);
            const on = latticePts(a, b, c, [-6, 6], 8);
            if (on.length < 3 || c === 0) return null;
            const k = pick(r, [1, 1, 2, 2, 3, 3, 0, ...(on.length >= 4 ? [4] : [])]);
            const good = shuffle(r, on).slice(0, k);
            const bad = [];
            for (let i = 0; i < 300 && bad.length < 4 - k; i++) {
              const p = [r(-6, 6), r(-8, 8)];
              if (a * p[0] + b * p[1] !== c && ![...good, ...bad].some((q) => q.join() === p.join())) bad.push(p);
            }
            if (bad.length < 4 - k) return null;
            return [a, b, c, shuffle(r, [...good, ...bad]), k];
          });
          const NAMES = ["ア", "イ", "ウ", "エ"];
          const ok = pts.map(([x, y]) => a * x + b * y === c);
          const line1 = (i) => `${NAMES[i]} ${TX(`${lhsNum(a, b, pts[i][0], pts[i][1])}=${a * pts[i][0] + b * pts[i][1]}`)}（${ok[i] ? "○" : "×"}）`;
          return {
            q: `方程式 ${EQ(a, b, c)} のグラフ上にある点は、次の 4点のうち何個あるか。　${pts.map((p, i) => `${NAMES[i]} ${PT(p)}`).join("　")}`,
            ans: nOn,
            unit: "個",
            hint: "グラフ上の点は、座標を方程式に代入すると、左辺が右辺と等しくなる。4点を、ひとつずつ代入して確かめてみよう。",
            steps: [`右辺は ${TX(String(c))}。左辺が ${TX(String(c))} になれば、グラフ上の点。`, `${line1(0)}　${line1(1)}`, `${line1(2)}　${line1(3)}`, `グラフ上にあるのは ${nOn} 個。`],
          };
        }),
        // 11q01 小テスト（1）y について解く（4択。b＝±3 も出る）
        t("11q01", (r) => {
          const [a, b, c] = tryGen(r, () => {
            const a = r(1, 4), b = pick(r, [1, -1, 3, -3, 2, -2]), c = NZ(r, 9);
            return gcd(a, b) === 1 ? [a, b, c] : null;
          });
          return {
            q: `方程式 ${EQ(a, b, c)} を $y$ について解くと、次のうちどれになるか。`,
            ans: TX(ltex(fromStd(a, b, c))),
            choices: solveChoices(r, a, b, c),
            hint: "$x$ の項を移項するとき、符号はどうなる？ $y$ の係数が 1 でないとき、右辺の全部の項をわっているかな？",
            steps: solveYSteps(a, b, c),
          };
        }),
        // 11q02 小テスト（2）グラフのようす（4択：右上がり・右下がり、y 軸との交点）
        t("11q02", (r) => {
          const [a, b, c] = tryGen(r, () => {
            const a = r(1, 4), b = pick(r, [1, -1, 2, -2, 3, -3]), k = NZ(r, 5);
            return gcd(a, b) === 1 ? [a, b, b * k] : null;
          });
          const L = fromStd(a, b, c), up = qval(L.a) > 0, q = L.b[0];
          const D = (u) => (u ? "右上がり" : "右下がり");
          const text = (u, y) => `${D(u)}の直線で、$y$ 軸と点 ${PT([0, y])} で交わる`;
          const cand = shuffle(r, [[!up, q], [up, -q], [!up, -q], ...(Math.abs(b) > 1 ? [[up, c]] : [])]);
          const wrongs = [], seen = new Set([text(up, q)]);
          for (const [u, y] of cand) { const s = text(u, y); if (!seen.has(s)) { seen.add(s); wrongs.push(s); } }
          return {
            q: `方程式 ${EQ(a, b, c)} のグラフについて、正しいものは次のうちどれか。`,
            ans: text(up, q),
            choices: choices4(r, text(up, q), wrongs),
            hint: "$y$ について解くと、傾きと切片がわかる。傾きの符号で、右上がりか右下がりかが決まる。",
            steps: [...solveYSteps(a, b, c), `傾きは ${TX(qt(L.a))} で${up ? "正" : "負"}なので${D(up)}。切片は ${TX(String(q))} なので、$y$ 軸と点 ${PT([0, q])} で交わる。`],
          };
        }),
        // 11q03a 小テスト（3）x 軸との交点（x 座標）
        t("11q03a", (r) => {
          const [a, b, c] = tryGen(r, () => {
            const a = r(2, 7), b = r(2, 7), k = r(1, 8);
            return gcd(a, b) !== 1 ? null : [a, b, a * k];
          });
          return {
            q: `方程式 ${EQ(a, b, c)} のグラフと $x$ 軸との交点の $x$ 座標は？`,
            ans: c / a,
            hint: "$x$ 軸上の点では、$y$ 座標はいくつ？",
            steps: [`$x$ 軸上の点は ${TX("y=0")}。${EQ(a, b, c)} に代入して ${solveVar(a, "x", c)}。`, `交点は ${PT([c / a, 0])}。`],
          };
        }),
        // 11q03b 小テスト（3）y 軸との交点（y 座標）
        t("11q03b", (r) => {
          const [a, b, c] = tryGen(r, () => {
            const a = r(2, 7), b = r(2, 7), k = r(1, 8);
            return gcd(a, b) !== 1 ? null : [a, b, b * k];
          });
          return {
            q: `方程式 ${EQ(a, b, c)} のグラフと $y$ 軸との交点の $y$ 座標は？`,
            ans: c / b,
            hint: "$y$ 軸上の点では、$x$ 座標はいくつ？",
            steps: [`$y$ 軸上の点は ${TX("x=0")}。${EQ(a, b, c)} に代入して ${solveVar(b, "y", c)}。`, `交点は ${PT([0, c / b])}。`],
          };
        }),
      ],
      // ───────── 3 応用 ─────────
      3: [
        // 11d05a 文字をふくむ方程式のグラフが点を通る：a か b の値
        t("11d05a", (r) => {
          const c5 = d05Case(r);
          if (!c5) return { skip: true };
          const { unk, a, b, c, p, q } = c5;
          return {
            q: `方程式 ${d05Eq(c5)} のグラフが、点 ${PT([p, q])} を通る。$${unk}$ の値は？`,
            ans: unk === "a" ? a : b,
            hint: "グラフが点を通るとき、その点の座標は方程式にあてはまる。$x$、$y$ に値を入れると、$" + unk + "$ についての方程式になるかな？",
            steps: d05Steps(c5, false),
          };
        }),
        // 11d05b 点を通る → 文字の値 → 傾き・切片
        t("11d05b", (r) => {
          const c5 = d05Case(r);
          if (!c5) return { skip: true };
          const { a, b, c, p, q } = c5, L = fromStd(a, b, c), ask = pick(r, ["傾き", "切片"]);
          return {
            q: `方程式 ${d05Eq(c5)} のグラフが、点 ${PT([p, q])} を通る。このグラフの${ask}は？（約分した分数か、整数で答えよう。）`,
            ans: num(ask === "傾き" ? L.a : L.b),
            hint: `グラフが通る点の座標は、方程式にあてはまる。文字の値がわかったら、${ask}はどうやって出せる？`,
            steps: d05Steps(c5, true).concat([`${ask}は ${TX(qt(ask === "傾き" ? L.a : L.b))}。`]),
          };
        }),
        // 11d06 グラフと x 軸、y 軸で囲まれた三角形の面積
        t("11d06", (r) => {
          const [a, b, c, p, q] = tryGen(r, () => {
            const p = r(2, 8), q = r(2, 8);
            if ((p * q) % 2 !== 0) return null;                       // 面積が整数になる組だけ
            const L = (p * q) / gcd(p, q);                            // c は p、q の最小公倍数（a、b、c に共通の約数が残らない）
            const sb = pick(r, [1, 1, -1]), sc = pick(r, [1, 1, -1]);
            const a = L / p, b = sb * (L / q);                        // x の係数は正
            return L > 30 || a > 12 || Math.abs(b) > 12 ? null : [a, b, sc * L, p, q];   // x 軸との交点は x＝c/a＝±p、y 軸との交点は y＝c/b＝±q
          });
          const area = (p * q) / 2;
          return {
            q: `方程式 ${EQ(a, b, c)} のグラフと、$x$ 軸、$y$ 軸で囲まれた三角形の面積は？（座標の 1 目もりを 1cm とする。）`,
            ans: area,
            unit: "cm²",
            hint: "グラフと軸の交点は、どこ？ 三角形の底辺と高さは、交点の座標のどの値から出る？",
            steps: [
              `${TX("y=0")} とすると ${solveVar(a, "x", c)}。$x$ 軸との交点は ${PT([c / a, 0])}。`,
              `${TX("x=0")} とすると ${solveVar(b, "y", c)}。$y$ 軸との交点は ${PT([0, c / b])}。`,
              `底辺 ${Math.abs(c / a)}、高さ ${Math.abs(c / b)} の直角三角形なので、${TX(`\\frac{1}{2}\\times ${Math.abs(c / a)}\\times ${Math.abs(c / b)}=${area}`)}（cm²）`,
            ],
          };
        }),
        // 11d07a y について解く（分数の傾き。4択）
        t("11d07a", (r) => {
          const [a, b, c] = tryGen(r, () => {
            const a = r(1, 5), b = pick(r, [2, 3, 4, 5, -2, -3, -4, -5]), c = NZ(r, 12);
            return gcd(a, b) === 1 ? [a, b, c] : null;
          });
          return {
            q: `方程式 ${EQ(a, b, c)} を $y$ について解くと、次のうちどれになるか。`,
            ans: TX(ltex(fromStd(a, b, c))),
            choices: solveChoices(r, a, b, c),
            hint: "$x$ の項を移項したあと、$y$ の係数でわる。右辺のすべての項を、わっているかな？",
            steps: solveYSteps(a, b, c),
          };
        }),
        // 11d07b x 軸との交点（x 座標。分数もある）
        t("11d07b", (r) => {
          const [a, b, c] = tryGen(r, () => {
            const a = r(2, 6), b = NZ(r, 6), c = NZ(r, 14);
            return gcd(a, b) === 1 ? [a, b, c] : null;
          });
          const xi = qdiv(Q(c), Q(a));
          return {
            q: `方程式 ${EQ(a, b, c)} のグラフと $x$ 軸との交点の $x$ 座標は？（約分した分数か、整数で答えよう。）`,
            ans: num(xi),
            hint: "$x$ 軸上の点は、$y$ 座標がいくつ？ その値を方程式に入れて、$x$ について解けるかな？",
            steps: [`$x$ 軸上の点は ${TX("y=0")}。${EQ(a, b, c)} に代入して ${solveVar(a, "x", c)}。`, `交点は ${PT([xi, 0])}。`],
          };
        }),
        // 11d07c グラフ上の点 P の x 座標から y 座標
        t("11d07c", (r) => {
          const [a, b, c, k] = tryGen(r, () => {
            const a = r(1, 5), b = pick(r, [2, 3, 4, -2, -3, -4]), c = NZ(r, 12), k = pick(r, [-6, -4, -3, -2, 2, 3, 4, 5, 6, 8]);
            return gcd(a, b) === 1 && (c - a * k) % b === 0 && c - a * k !== 0 ? [a, b, c, k] : null;
          });
          const y = (c - a * k) / b;
          return {
            q: `方程式 ${EQ(a, b, c)} のグラフ上の点 P の $x$ 座標が ${TX(String(k))} のとき、P の $y$ 座標は？`,
            ans: y,
            hint: "P は、グラフ上の点。$x$ 座標を方程式に入れると、$y$ についての方程式になるかな？",
            steps: [`${EQ(a, b, c)} に ${TX(`x=${k}`)} を代入して、${TX(`${lhsX(a, b, k)}=${c}`)}。`, `${solveVar(b, "y", c - a * k)}。`],
          };
        }),
      ],
      // ───────── 4 入試レベル ─────────
      4: [
        // 11d08a 方程式のグラフ上で、x 座標、y 座標がともに自然数の点の個数
        t("11d08a", (r) => {
          const c8 = d08Case(r);
          if (!c8) return { skip: true };
          const { a, b, c, sols } = c8;
          return {
            q: `方程式 ${EQ(a, b, c)} のグラフ上の点で、$x$ 座標、$y$ 座標が、どちらも自然数である点は、全部で何個あるか。`,
            ans: sols.length,
            unit: "個",
            hint: "$x$ も $y$ も 1 以上の整数。$y$ に 1、2、3、… と入れていくと、$x$ はどうなる？",
            steps: d08Steps(c8),
          };
        }),
        // 11d08b そのような点の x 座標の和
        t("11d08b", (r) => {
          const c8 = d08Case(r);
          if (!c8) return { skip: true };
          const { a, b, c, sols } = c8;
          const sum = sols.reduce((m, [x]) => m + x, 0);
          return {
            q: `方程式 ${EQ(a, b, c)} のグラフ上の点で、$x$ 座標、$y$ 座標が、どちらも自然数である点を、すべて考える。それらの点の $x$ 座標を、すべてたすと？`,
            ans: sum,
            hint: "$x$ も $y$ も 1 以上の整数の点を、まず見つけよう。$y$ に 1、2、3、… と入れていくと、$x$ はどうなる？",
            steps: d08Steps(c8, `$x$ 座標は ${sols.map(([x]) => x).join("、")} なので、和は ${TX(sols.map(([x]) => x).join("+") + "=" + sum)}。`),
          };
        }),
        // 11q04a 小テスト（チャレンジ）方程式 ax+by＝c が 2点を通る：a の値
        t("11q04a", (r) => {
          const c4 = q04Case(r);
          if (!c4) return { skip: true };
          return {
            q: `方程式 ${q04Eq(c4)} のグラフが、2点 ${PT([c4.p, 0])}、${PT([0, c4.q])} を通る。$a$ の値は？`,
            ans: c4.a,
            hint: "グラフが通る点の座標は、方程式にあてはまる。軸上の点の座標を代入すると、$a$、$b$ のどちらかだけの方程式になるかな？",
            steps: q04Steps(c4, "a"),
          };
        }),
        // 11q04b 小テスト（チャレンジ）b の値
        t("11q04b", (r) => {
          const c4 = q04Case(r);
          if (!c4) return { skip: true };
          return {
            q: `方程式 ${q04Eq(c4)} のグラフが、2点 ${PT([c4.p, 0])}、${PT([0, c4.q])} を通る。$b$ の値は？`,
            ans: c4.b,
            hint: "グラフが通る点の座標は、方程式にあてはまる。軸上の点の座標を代入すると、$a$、$b$ のどちらかだけの方程式になるかな？",
            steps: q04Steps(c4, "b"),
          };
        }),
      ],
    },
  }),
];

// ── dr.5：ax+3y＝12 のグラフが点 (3, 1) を通る。a（または b）を求める ──────────────
//   傾き m（整数）・切片 n（整数）の直線から、方程式 ax+by＝c（a は正で、b でわり切れる）をつくり、直線上の点を 1 つ選ぶ。
function d05Case(r) {
  for (let n = 0; n < 300; n++) {
    const a = pick(r, [2, 3, 4, 5, 6, 8, 9]);
    const divs = [2, 3, 4, 5, 6, 8, 9].filter((d) => a % d === 0);
    const b = pick(r, divs) * pick(r, [1, 1, -1]);
    const m = -a / b, nn = NZ(r, 6), c = nn * b;
    const p = r(-4, 5), q = m * p + nn;
    if (p === 0 || q === 0 || Math.abs(q) > 12 || Math.abs(c) > 40) continue;
    return { unk: pick(r, ["a", "a", "b"]), a, b, c, p, q };
  }
  return null;
}
/** 文字をふくむ方程式の TeX（a か b を文字のままにする） */
function d05Eq(c5) {
  const { unk, a, b, c } = c5;
  return TX(unk === "a" ? `ax${b < 0 ? "-" : "+"}${Math.abs(b)}y=${c}` : `${a}x+by=${c}`);
}
function d05Steps(c5, more) {
  const { unk, a, b, c, p, q } = c5;
  const lhs = unk === "a"
    ? `${coefX(p, "a")}${b < 0 ? "-" : "+"}${Math.abs(b)}\\times ${P(q)}`
    : `${a}\\times ${P(p)}${q === 1 ? "+b" : q === -1 ? "-b" : (q < 0 ? "-" : "+") + Math.abs(q) + "b"}`;
  const rest = unk === "a" ? c - b * q : c - a * p;
  const k = unk === "a" ? p : q;
  const lines = [
    `方程式に ${TX(`x=${p}`)}、${TX(`y=${q}`)} を代入して、${TX(`${lhs}=${c}`)}。`,
    `${solveVar(k, unk, rest)}。`,
  ];
  if (more) lines.push(`方程式は ${EQ(a, b, c)}。$y$ について解くと ${TX(ltex(fromStd(a, b, c)))}。`);
  return lines;
}

// ── dr.8：ax+by＝c（a、b、c は正）で、x、y がともに自然数の解 ─────────────────
function d08Case(r) {
  for (let n = 0; n < 200; n++) {
    const a = pick(r, [1, 2, 3]), b = pick(r, [1, 2, 3, 4, 5]), c = r(8, 28);
    if (gcd(a, b) !== 1) continue;
    const sols = [];
    for (let y = 1; b * y < c; y++) { const rem = c - b * y; if (rem % a === 0) sols.push([rem / a, y]); }
    if (sols.length >= 2 && sols.length <= 7) return { a, b, c, sols };
  }
  return null;
}
function d08Steps(c8, last) {
  const { a, b, c, sols } = c8;
  const xFor = a === 1 ? `x=${c}-${b === 1 ? "" : b}y` : `${a}x=${c}-${b === 1 ? "" : b}y`;
  return [
    `${TX(xFor)}。$y$ に 1、2、3、… を入れて、$x$ が自然数になるものを探す。`,
    sols.map(([x, y]) => `${TX(`y=${y}`)} のとき ${TX(`x=${x}`)}`).join("、") + "。",
    `そのほかの $y$ では、$x$ が自然数にならない（整数にならないか、0 以下になる）。`,
    last || `自然数の点は ${sols.map((s) => TX(ptex2(s))).join("、")} の ${sols.length} 個。`,
  ];
}

// ── qz.4：ax+by＝c（c は与えられる）が (p, 0)、(0, q) を通る：a、b ──────────────
function q04Case(r) {
  for (let n = 0; n < 200; n++) {
    const c = pick(r, [6, 8, 10, 12, 12, 15, 18]);
    const divs = [];
    for (let d = 1; d <= c; d++) if (c % d === 0) { divs.push(d); divs.push(-d); }
    const p = pick(r, divs), q = pick(r, divs);
    if (Math.abs(p) === 1 || Math.abs(q) === 1 || Math.abs(p) === c || Math.abs(q) === c) continue;
    return { c, p, q, a: c / p, b: c / q };
  }
  return null;
}
function q04Eq(c4) { return TX(`ax+by=${c4.c}`); }
function q04Steps(c4, ask) {
  const { c, p, q, a, b } = c4;
  return ask === "a"
    ? [`点 ${PT([p, 0])} を代入して、${TX(`${coefX(p, "a")}+b\\times 0=${c}`)}。`, `${TX(`${coefX(p, "a")}=${c}`)}、${TX(`a=${a}`)}。`]
    : [`点 ${PT([0, q])} を代入して、${TX(`a\\times 0+${coefX(q, "b")}=${c}`)}。`, `${TX(`${coefX(q, "b")}=${c}`)}、${TX(`b=${b}`)}。`];
}

// 移さなかった問題はなし（グラフをかく問題は、切片・x 軸との交点・ある x での y を聞く形にした）
export const SKIPPED = [];
