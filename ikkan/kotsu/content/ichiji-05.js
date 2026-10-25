// ============================================================
// ichiji-05.js — 一次関数 第5時「グラフの傾きを調べよう」（傾き・右上がり・右下がり）
//   ikkan の演習プリント（ichiji-05.dr.1〜8）・小テスト（ichiji-05.qz.1〜5）を、コツコツくんのテンプレートにしたもの。
//   テンプレート id＝「05」＋ d（演習）／q（小テスト）＋ ikkan の問題の番号（＋ 小問・型ごとに a, b…）。例：05d07b ＝ ichiji-05.dr.7 の②
//   図（座標平面）は出せないので、「右の図の直線 ①〜③」は、直線が通る 2点の座標（格子点）を文で言って、傾き・切片・式を聞く形にした。
//   傾き・切片・右上がり／右下がりは、linear.js の直線 line と yAt・lineThrough から計算する（手で書かない）。
//   式を答える問題は、ありがちな誤答（傾きと切片の入れかえ・符号まちがい）をならべた4択にし、2点を通らないことを onLine で確かめてから出す。
// ============================================================
import { t, pick, choices4, shuffle, rnz, gcd } from "../kit.js";
import { unitFor } from "../unit-kit.js";
import { Q, qadd, qiszero, qeq, qmul, qdiv } from "../algebra.js";
import { line, lineThrough, yAt, xAt, onLine, ltex, ptex2, qt, num } from "../linear.js";

const unit = unitFor("ichiji");

// ── 道具（この授業の問題用に足した小さな関数）──────────────────────────
const $ = (s) => `$${s}$`;
const L = (l) => $(ltex(l));
const axt = (a) => ltex(line(a, 0)).slice(2);
const nz = (r, m) => rnz(r, -m, m);
const N = (v) => `$${v}$`;
const par = (x) => { const v = Array.isArray(x) ? x : [x, 1]; return v[0] < 0 ? `(${qt(v)})` : qt(v); };
const absq = (x) => (x[0] < 0 ? [-x[0], x[1]] : x);
/** 式の4択を、(正しい傾き, 正しい切片)・(正しい傾き, 誤った切片)・(誤った傾き, 正しい切片)・(誤った傾き, 誤った切片) の 2×2 にそろえる。
 *  どの選択肢も、ほかの選択肢と共通する部分の数が同じになるので、共通部分を見ただけでは正解が当たらない。
 *  S＝誤った傾きの候補、T＝誤った切片の候補（ありがちな誤り。数）。pts＝問題の条件の点（誤答がそのすべてを通ってしまうものは使わない） */
const gridCells = (r, right, S, T, pts) => {
  const a = right.a, b = right.b, qv = (x) => (Array.isArray(x) ? Q(x[0], x[1]) : Q(x));
  const pool = (xs, bad) => { const out = []; for (const x of xs.map(qv)) if (!bad(x) && !out.some((y) => qeq(x, y))) out.push(x); return out; };
  const sl = [...pool(shuffle(r, S), (x) => qeq(x, a) || qiszero(x)), ...pool(shuffle(r, [qadd(a, Q(1)), qadd(a, Q(-1)), qmul(a, Q(2)), qdiv(a, Q(2))]), (x) => qeq(x, a) || qiszero(x))];
  const ts = [...pool(shuffle(r, T), (x) => qeq(x, b)), ...pool(shuffle(r, [qadd(b, Q(1)), qadd(b, Q(-1)), qadd(b, Q(2)), qmul(b, Q(2))]), (x) => qeq(x, b))];
  const ok = (l) => !(pts && pts.every((p) => onLine(l, p)));
  for (const s of sl) for (const t of ts) {
    const cells = [line(a, t), line(s, b), line(s, t)];
    if (cells.every(ok)) return cells;
  }
  throw new Error("4択がつくれない");
};
const gridChoices = (r, right, S, T, pts, name = "y") => {
  const cells = gridCells(r, right, S, T, pts), sh = (l) => $(ltex(l).replace(/^y/, name)), ans = sh(right);
  return { ans, choices: shuffle(r, [ans, ...cells.map(sh)]) };
};
/** 分母 n と互いに素な、0 でない整数 m（絶対値 mx 以下） */
const coprimeTo = (r, n, mx) => { let m = nz(r, mx); while (gcd(m, n) !== 1) m = nz(r, mx); return m; };
/** 約分した分数の割り算の TeX：\frac{-8}{3}=-\frac{8}{3}（約分しても変わらないときは、等号をつけない） */
const divTex = (n, d) => { if (d === 1) return qt(Q(n, 1)); const base = `\\frac{${n}}{${d}}`, red = qt(Q(n, d)); return base === red ? base : `${base}=${red}`; };
const dirOf = (a) => (a[0] > 0 ? "右上がり" : "右下がり");
/** 傾き a（Q）の、ふつうの数：整数か、分母 2〜4 の分数 */
const slopeOf = (r, withFrac, sign = 0) => {
  const sg = sign || pick(r, [1, -1]);
  if (withFrac && r(0, 2) === 0) { const n = pick(r, [2, 3, 4]); return Q(sg * Math.abs(coprimeTo(r, n, 3)), n); }
  return Q(sg * r(1, 6));
};

// ── 傾きと切片を読みとる式 ─────────────────────────────────────
/** 式の形。std（ax+b）／rev（b+ax）。a は Q、b は整数。{ tex, a, b, std, form } */
const exprOf = (r, a, form = "std", bmax = 6) => {
  const b = nz(r, bmax), std = ltex(line(a, b)), neg = a[0] < 0, ab = absq(a);
  const tex = form === "rev" ? `y=${b}${neg ? "-" : "+"}${ab[1] === 1 ? (ab[0] === 1 ? "x" : `${ab[0]}x`) : `\\frac{${ab[0]}}{${ab[1]}}x`}` : std;
  return { tex, a, b: Q(b), std, form };
};
/** 傾きの符号が sign（1 か −1）の式を n 個（重複なし） */
const signedExprs = (r, signs) => {
  const out = [], seen = new Set();
  for (const sg of signs) {
    for (let i = 0; i < 100; i++) {
      const e = exprOf(r, slopeOf(r, true, sg), pick(r, ["std", "std", "rev"]));
      if (seen.has(e.tex)) continue;
      seen.add(e.tex); out.push(e); break;
    }
  }
  return out;
};
/** 傾きと切片と向きの言い方 */
const descOf = (a, b) => `傾き ${N(qt(a))}、切片 ${N(qt(b))}、${dirOf(a)}`;

// ── 通る 2点（格子点）からつくる直線 ───────────────────────────────
/** 傾き a、切片 b の直線が通る格子点を 2つ。onAxis なら 1つは y 軸上 (0, b)。範囲は |x|≦5、|y|≦6 */
const twoPoints = (r, a, b, onAxis) => {
  const d = a[1], xs = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5].filter((x) => x % d === 0);
  for (let i = 0; i < 300; i++) {
    let x1 = onAxis ? 0 : pick(r, xs.filter((x) => x !== 0)), x2 = pick(r, xs.filter((x) => x !== x1 && x !== 0 && (!onAxis || x > 0)));
    if (x1 > x2) [x1, x2] = [x2, x1];      // A、B は 左から右 の順（右へ進む量が正の数になるように）
    const l = line(a, b), p1 = [x1, yAt(l, x1)[0]], p2 = [x2, yAt(l, x2)[0]];
    if (Math.abs(p1[1]) <= 6 && Math.abs(p2[1]) <= 6) return [p1, p2];
  }
  return null;
};
const PT = (p, name) => $(ptex2(p, name));

export const UNITS = [
  unit("05", {
    name: "グラフの傾き",
    desc: "傾き・右上がり・右下がり",
    prereqs: ["J2-ik04"],
    points: [
      "$y=ax+b$ のグラフで、$x$ が 1 増加するときの $y$ の増加量が $a$。この $a$ を、グラフの傾きという。傾きは、変化の割合と同じ値。",
      "$a>0$ のとき、グラフは右上がり。$a<0$ のとき、グラフは右下がり。$b$ は切片で、$y$ 軸との交点 $(0, b)$ の $y$ 座標。",
      "傾き $\\frac{2}{3}$ のグラフは、右へ 3 進むと、上へ 2 進む。傾きが負の数のときは、下へ進む。",
    ],
    levels: {
      // ───────── 1 基礎 ─────────
      1: [
        // 05d01a 演習（1）傾きと切片と向き（4択）
        t("05d01a", (r) => {
          const e = exprOf(r, slopeOf(r, true), pick(r, ["std", "std", "rev"])), a = e.a, b = e.b;
          const right = descOf(a, b), neg = (q) => [-q[0], q[1]];
          const wrongs = [descOf(b, a), descOf(neg(a), b), descOf(a, neg(b)), descOf(neg(a), neg(b)), descOf(b, neg(a))];
          return {
            q: `一次関数 ${$(e.tex)} のグラフについて、傾きと切片と向きの組として正しいものは、次のうちどれか。`,
            ans: right,
            choices: choices4(r, right, wrongs.filter((w) => w !== right)),
            hint: "式を $y=ax+b$ の形にならべかえると、どうなるかな？ 傾きは $a$ と $b$ のどちらかな？ 向きは、何の符号で決まったかな？",
            steps: [e.form === "rev" ? `$x$ の項を先に書くと、${$(e.std)}。` : `${$(e.tex)} は、$y=ax+b$ の形。`, `傾き（$a$）は ${N(qt(a))}、切片（$b$）は ${N(qt(b))}。傾きが${a[0] > 0 ? "正" : "負"}の数だから、${dirOf(a)}。`],
          };
        }),
        // 05d01b 演習（1）x が 1 増加するとき y はいくつ増加するか（傾き）
        t("05d01b", (r) => {
          const e = exprOf(r, slopeOf(r, true), pick(r, ["std", "rev", "rev"]));
          return {
            q: `一次関数 ${$(e.tex)} のグラフで、$x$ が 1 増加するとき、$y$ はいくつ増加するか。（減少するときは、負の数で答えよう。）`,
            ans: num(e.a),
            hint: "グラフで、$x$ が 1 増加するときの $y$ の増加量を、何というのだったかな？ 式のどこにあるかな？",
            steps: [e.form === "rev" ? `$x$ の項を先に書くと、${$(e.std)}。` : `${$(e.tex)} は、$y=ax+b$ の形。`, `$x$ が 1 増加するときの $y$ の増加量は、傾き $a$ に等しいから、${$(qt(e.a))}。`],
          };
        }),
        // 05d02a 演習（2）傾きと右へ進む量 → y の増加量（符号つき）
        t("05d02a", (r) => {
          const a = slopeOf(r, true), n = a[1] * (a[1] === 1 ? r(2, 4) : r(1, 4)), rise = [a[0] * (n / a[1]), 1];
          return {
            q: `傾きが ${N(qt(a))} のグラフは、右へ ${n} 進むと、$y$ の値はいくつ増えるか。（減るときは、負の数で答えよう。）`,
            ans: num(rise),
            hint: "傾きは、右へ 1 進んだときの $y$ の増加量だったね。右へ 1 でなく、いくつ進むのかな？",
            steps: [`$y$ の増加量は、傾きに、右へ進む量（$x$ の増加量）をかけて、${$(`${par(a)}\\times ${n}=${qt(rise)}`)}。`, `${rise[0] > 0 ? "正の数だから、上へ" : "負の数だから、下へ"} ${Math.abs(rise[0])} 進む。`],
          };
        }),
        // 05d02b 演習（2）傾きと右へ進む量 → 上へ／下へ いくつ進むか（4択）
        t("05d02b", (r) => {
          const a = slopeOf(r, true), n = a[1] * (a[1] === 1 ? r(2, 4) : r(1, 4)), rise = Q(a[0] * (n / a[1])), sg = rise[0] > 0 ? 1 : -1;
          const txt = (v) => `${v[0] > 0 ? "上" : "下"}へ ${N(qt(absq(v)))} 進む`, mv = (s, m) => [s * m[0], m[1]];
          const ans = txt(rise), recip = Q(n * a[1], a[0]);
          const cands = [mv(-sg, absq(rise)), mv(sg, absq(a)), mv(sg, [n, 1]), mv(-sg, [n, 1]), recip].map(txt).filter((s) => s !== ans);
          return {
            q: `傾きが ${N(qt(a))} のグラフは、右へ ${n} 進むと、上へ進むか、下へ進むか。また、いくつ進むか。`,
            ans,
            choices: choices4(r, ans, cands, (i) => { const m = Math.abs(rise[0]) + [1, -1, 2, -2, 3][i % 5]; return m > 0 ? txt([sg * m, 1]) : null; }),
            hint: "傾きが正の数のときと負の数のときで、進む向きはどうなるかな？ 傾きは、右へ 1 進むときの量だったね。",
            steps: [`傾き ${N(qt(a))} は、右へ 1 進むと、${a[0] > 0 ? "上" : "下"}へ ${N(qt(absq(a)))} 進むことを表す。`, `右へ ${n} 進むと、${$(`${par(a)}\\times ${n}=${qt(rise)}`)} だから、${ans}。`],
          };
        }),
        // 05q01 小テスト（1）傾きと切片
        t("05q01", (r) => {
          const e = exprOf(r, slopeOf(r, true), "std"), ask = pick(r, ["a", "b"]);
          return {
            q: `一次関数 ${$(e.tex)} のグラフの、${ask === "a" ? "傾き" : "切片"}は？`,
            ans: num(ask === "a" ? e.a : e.b),
            hint: ask === "a" ? "$y=ax+b$ のグラフで、傾きは $a$ と $b$ のどちらかな？" : "$y=ax+b$ のグラフで、切片は $a$ と $b$ のどちらかな？",
            steps: [`${$(e.tex)} は、$y=ax+b$ の形。`, `傾きは $a=${qt(e.a)}$、切片は $b=${qt(e.b)}$。よって ${ask === "a" ? "傾き" : "切片"}は ${$(qt(ask === "a" ? e.a : e.b))}。`],
          };
        }),
      ],
      // ───────── 2 標準 ─────────
      2: [
        // 05d03a 演習（3）y 軸上の点と、もう1つの格子点を通る直線の式（4択）
        t("05d03a", (r) => {
          const a = slopeOf(r, true), b = nz(r, 4), pts = twoPoints(r, a, b, true);
          if (!pts) return { skip: true };
          const [p1, p2] = pts, right = line(a, b);
          const { ans, choices } = lineChoices(r, right, [line(Q(b), a), line([-a[0], a[1]], b), line(a, -b), line([-a[0], a[1]], -b)], pts);
          const dx = p2[0] - p1[0], dyv = p2[1] - p1[1];
          return {
            q: `直線 ℓ は、2点 ${PT(p1, "A")}、${PT(p2, "B")} を通る。ℓ の式は？`,
            ans,
            choices,
            hint: "A は $y$ 軸の上の点だね。切片はいくつかな？ A から B まで、右へいくつ進むと、上（下）へいくつ進むかな？",
            steps: [`A は $y$ 軸上の点だから、切片は ${N(b)}。`, `A から B まで、右へ ${dx} 進むと、${dyv > 0 ? "上" : "下"}へ ${Math.abs(dyv)} 進む。傾きは ${$(divTex(dyv, dx))}。`, `よって、${ans}。`],
          };
        }),
        // 05d03b 演習（3）2点を通る直線の傾き
        t("05d03b", (r) => {
          const a = slopeOf(r, true), b = nz(r, 4), pts = twoPoints(r, a, b, false);
          if (!pts) return { skip: true };
          const [p1, p2] = pts, dx = p2[0] - p1[0], dyv = p2[1] - p1[1];
          return {
            q: `直線 ℓ は、2点 ${PT(p1, "A")}、${PT(p2, "B")} を通る。ℓ の傾きは？`,
            ans: num(a),
            hint: "A から B まで、右へいくつ進むと、上（下）へいくつ進むかな？ 傾きは、右へ 1 進むときの量だったね。",
            steps: [`A から B まで、$x$ の増加量は ${$(`${p2[0]}-${par(p1[0])}=${dx}`)}、$y$ の増加量は ${$(`${p2[1]}-${par(p1[1])}=${dyv}`)}。`, `傾きは ${$(divTex(dyv, dx))}。`],
          };
        }),
        // 05d04a 演習（4）4つの式のうち、右上がりの直線になるものはいくつか
        t("05d04a", (r) => {
          const k = pick(r, [1, 2, 3]), es = signedExprs(r, shuffle(r, [...Array(k).fill(1), ...Array(4 - k).fill(-1)]));
          if (es.length < 4 || new Set(es.map((e) => e.tex)).size < 4) return { skip: true };
          const LET = ["ア", "イ", "ウ", "エ"], tag = es.map((e, i) => ({ ...e, c: LET[i] })), ups = tag.filter((e) => e.a[0] > 0).map((e) => e.c);
          return {
            q: `次のア〜エのうち、グラフが右上がりの直線になるものは、いくつあるか。\n${tag.map((e) => `${e.c} ${$(e.tex)}`).join("　　")}`,
            ans: k,
            unit: "個",
            hint: "グラフが右上がりになるのは、傾きがどんな数のときだったかな？ 式を $y=ax+b$ の形にすると、$a$ はどうなっているかな？",
            steps: [`傾きは、${tag.map((e) => `${e.c}：${N(qt(e.a))}`).join("、")}。`, `右上がりになるのは、傾きが正の数の ${ups.join("、")} の ${k}個。`],
          };
        }),
        // 05d04b 演習（4）右上がり（右下がり）の直線になる式を選ぶ（4択）
        t("05d04b", (r) => {
          const up = r(0, 1) === 0, es = signedExprs(r, [up ? 1 : -1, ...Array(3).fill(up ? -1 : 1)]);      // es[0] だけが、向きが合う
          if (es.length < 4 || new Set(es.map((e) => e.tex)).size < 4) return { skip: true };
          const good = es[0], ans = $(good.tex);
          return {
            q: `次の 4つの式のうち、グラフが${up ? "右上がり" : "右下がり"}の直線になるものはどれか。`,
            ans,
            choices: choices4(r, ans, es.slice(1).map((e) => $(e.tex))),
            hint: `グラフが${up ? "右上がり" : "右下がり"}になるのは、傾きがどんな数のときだったかな？`,
            steps: [`傾きは、${es.map((e) => `${$(e.tex)} … ${N(qt(e.a))}`).join("、")}。`, `${up ? "右上がり" : "右下がり"}になるのは、傾きが${up ? "正" : "負"}の数の ${ans}。`],
          };
        }),
        // 05q02a 小テスト（2）2点を通る直線の傾き
        t("05q02a", (r) => {
          const a = slopeOf(r, true), b = nz(r, 4), pts = twoPoints(r, a, b, r(0, 1) === 0);
          if (!pts) return { skip: true };
          const [p1, p2] = pts, dx = p2[0] - p1[0], dyv = p2[1] - p1[1];
          return {
            q: `直線 ℓ は、2点 ${PT(p1, "A")}、${PT(p2, "B")} を通る。ℓ の傾きを求めよう。`,
            ans: num(a),
            hint: "2点の $x$ 座標の差と、$y$ 座標の差から、右へいくつ進むと上（下）へいくつ進むかがわかるかな？",
            steps: [`$x$ の増加量は ${$(`${p2[0]}-${par(p1[0])}=${dx}`)}、$y$ の増加量は ${$(`${p2[1]}-${par(p1[1])}=${dyv}`)}。`, `傾きは ${$(divTex(dyv, dx))}。`],
          };
        }),
        // 05q02b 小テスト（2）2点を通る直線の切片（y 軸上の点ではない2点）
        t("05q02b", (r) => {
          const a = Q(nz(r, 3)), b = nz(r, 5), pts = twoPoints(r, a, b, false);
          if (!pts) return { skip: true };
          const [p1, p2] = pts, dx = p2[0] - p1[0], dyv = p2[1] - p1[1];
          return {
            q: `直線 ℓ は、2点 ${PT(p1, "A")}、${PT(p2, "B")} を通る。ℓ の切片を求めよう。`,
            ans: b,
            hint: "まず傾きを求めよう。傾きがわかったら、どの点を使って、$y$ 軸との交点の $y$ 座標を求められるかな？",
            steps: [`傾きは ${$(divTex(dyv, dx))}。`, `${$(`y=${axt(a)}+b`)} に点 A の座標 $x=${p1[0]}$、$y=${p1[1]}$ を代入して、${$(`${p1[1]}=${par(a)}\\times ${par(p1[0])}+b`)}。`, `$b=${b}$ だから、切片は ${N(b)}。`],
          };
        }),
        // 05q03 小テスト（3）分数の傾き：右へ進むと y はいくつ増えるか
        t("05q03", (r) => {
          const n = pick(r, [2, 3, 4, 5]), a = Q(coprimeTo(r, n, 3), n), k = r(1, 4), m = n * k, rise = a[0] * k;
          return {
            q: `一次関数 ${$(`y=${axt(a)}+${r(1, 5)}`)} のグラフは、右へ ${m} 進むと、$y$ の値はいくつ増えるか。（減るときは、負の数で答えよう。）`,
            ans: rise,
            hint: "傾きは、右へ 1 進むときの $y$ の増加量だったね。右へ " + m + " 進むと、その何倍になるかな？",
            steps: [`傾きは ${N(qt(a))}。`, `$y$ の増加量は ${$(`${par(a)}\\times ${m}=${rise}`)}。${rise > 0 ? "上へ" : "下へ"} ${Math.abs(rise)} 進む。`],
          };
        }),
        // 05q04 小テスト（4）4つの式のうち、右下がりの直線になるものはいくつか
        t("05q04", (r) => {
          const k = pick(r, [1, 2, 3]), es = signedExprs(r, shuffle(r, [...Array(k).fill(-1), ...Array(4 - k).fill(1)]));
          if (es.length < 4 || new Set(es.map((e) => e.tex)).size < 4) return { skip: true };
          const LET = ["ア", "イ", "ウ", "エ"], tag = es.map((e, i) => ({ ...e, c: LET[i] })), downs = tag.filter((e) => e.a[0] < 0).map((e) => e.c);
          return {
            q: `次のア〜エのうち、グラフが右下がりの直線になるものは、いくつあるか。\n${tag.map((e) => `${e.c} ${$(e.tex)}`).join("　　")}`,
            ans: k,
            unit: "個",
            hint: "グラフが右下がりになるのは、傾きがどんな数のときだったかな？",
            steps: [`傾きは、${tag.map((e) => `${e.c}：${N(qt(e.a))}`).join("、")}。`, `右下がりになるのは、傾きが負の数の ${downs.join("、")} の ${k}個。`],
          };
        }),
      ],
      // ───────── 3 応用 ─────────
      3: [
        // 05d05 演習（5）右下がりで y 軸と原点より上で交わる式を選ぶ（4択）
        t("05d05", (r) => {
          const pa = Q(r(1, 5) * pick(r, [1, 1, 1]), pick(r, [1, 1, 2])), pb = r(1, 6), up = r(0, 1) === 0, top = r(0, 1) === 0;
          const mk = (su, st) => line([su * pa[0], pa[1]], st * pb), target = mk(up ? 1 : -1, top ? 1 : -1);
          const ans = L(target), others = [mk(1, 1), mk(-1, 1), mk(1, -1), mk(-1, -1)].filter((l) => ltex(l) !== ltex(target));
          return {
            q: `次の 4つの式のうち、グラフが${up ? "右上がり" : "右下がり"}の直線で、$y$ 軸と原点より${top ? "上" : "下"}で交わるものはどれか。`,
            ans,
            choices: choices4(r, ans, others.map(L)),
            hint: "右上がり・右下がりは、$a$ と $b$ のどちらの符号で決まったかな？ $y$ 軸と交わる位置は、どちらの符号で決まるかな？",
            steps: [`${up ? "右上がり" : "右下がり"}だから、傾きは${up ? "正" : "負"}の数。`, `$y$ 軸と原点より${top ? "上" : "下"}で交わるから、切片は${top ? "正" : "負"}の数。`, `傾きが${up ? "正" : "負"}で切片が${top ? "正" : "負"}の式は、${ans}。`],
          };
        }),
        // 05d06 演習（6）2点を通る直線 y＝ax+b の a、b の符号（4択）
        t("05d06", (r) => {
          const sa = pick(r, [1, -1]), sb = pick(r, [1, -1]), a = Q(sa * r(1, 3), pick(r, [1, 1, 2])), b = sb * r(1, 4), pts = twoPoints(r, a, b, false);
          if (!pts) return { skip: true };
          const [p1, p2] = pts, dx = p2[0] - p1[0], dyv = p2[1] - p1[1], sgn = (v) => (v > 0 ? ">" : "<");
          const combo = (x, y) => `${$(`a${sgn(x)}0`)}、${$(`b${sgn(y)}0`)}`, ans = combo(sa, sb);
          return {
            q: `直線 ℓ は、2点 ${PT(p1, "A")}、${PT(p2, "B")} を通る。ℓ の式を $y=ax+b$ とするとき、$a$、$b$ の符号の組として正しいものは？`,
            ans,
            choices: choices4(r, ans, [combo(-sa, sb), combo(sa, -sb), combo(-sa, -sb)]),
            hint: "$a$ は傾き、$b$ は切片だね。2点から、傾きの符号と、$y$ 軸と交わる位置が決められるかな？",
            steps: [`傾きは ${$(divTex(dyv, dx))} で、${a[0] > 0 ? "正" : "負"}の数。`, `点 A の座標を ${$(`y=${axt(a)}+b`)} に代入して、${$(`${p1[1]}=${par(a)}\\times ${par(p1[0])}+b`)} より ${$(`b=${b}`)}。切片は${b > 0 ? "正" : "負"}の数。`, `よって、${ans}。`],
          };
        }),
      ],
      // ───────── 4 入試レベル ─────────
      4: [
        // 05d07a 演習（7）① y＝ax+2 で、x が 1 から 4 まで増加すると y が 6 減少 → a
        t("05d07a", (r) => {
          const s = spec(r);
          return { q: `${s.text}$a$ の値は？`, ans: num(s.a), hint: "$x$ の増加量と $y$ の増加量から、変化の割合が求められるかな？ $a$ は、変化の割合と、どんな関係だったかな？", steps: [`$x$ の増加量は ${$(`${s.x2}-${par(s.x1)}=${s.dx}`)}、$y$ の増加量は ${$(String(s.dyv))}。`, `$a$ は変化の割合に等しいので、${$(`a=${divTex(s.dyv, s.dx)}`)}。`] };
        }),
        // 05d07b 演習（7）② x＝−2 のときの y の値
        t("05d07b", (r) => {
          const s = spec(r), x0 = s.a[1] * pick(r, [-3, -2, -1, 1, 2, 3]), l = line(s.a, s.b), v = yAt(l, x0)[0];
          return {
            q: `${s.text}$x=${x0}$ のときの $y$ の値は？`,
            ans: v,
            hint: "$a$ は、何から求められるかな？ $a$ がわかれば、$x$ の値から $y$ の値はどう求められるかな？",
            steps: [`$x$ の増加量は ${$(`${s.x2}-${par(s.x1)}=${s.dx}`)}、$y$ の増加量は ${$(String(s.dyv))}。$a=${divTex(s.dyv, s.dx)}$。`, `${L(l)} に $x=${x0}$ を代入して、${$(`y=${subTex(l, x0)}`)}。`],
          };
        }),
        // 05d08a 演習（8）直線 ℓ が (0, −2) と (4, 1) を通る → ℓ の式（4択）
        t("05d08a", (r) => {
          const n = pick(r, [3, 4, 5]), a = Q(coprimeTo(r, n, 3), n), b = nz(r, 4), pts = twoPoints(r, a, b, true);
          if (!pts) return { skip: true };
          const [p1, p2] = pts, right = line(a, b), dx = p2[0] - p1[0], dyv = p2[1] - p1[1];
          const { ans, choices } = lineChoices(r, right, [line(Q(b), a), line([-a[0], a[1]], b), line(a, -b), line([a[1], a[0]], b)], pts);
          return {
            q: `直線 ℓ は、2点 ${PT(p1, "A")}、${PT(p2, "B")} を通る。ℓ の式は？`,
            ans,
            choices,
            hint: "A は $y$ 軸上の点だね。切片はいくつかな？ A から B まで、右へいくつ進むと上（下）へいくつ進むかな？",
            steps: [`A は $y$ 軸上の点だから、切片は ${N(b)}。`, `A から B まで、右へ ${dx} 進むと、${dyv > 0 ? "上" : "下"}へ ${Math.abs(dyv)} 進むから、傾きは ${$(divTex(dyv, dx))}。`, `よって、${ans}。`],
          };
        }),
        // 05d08b 演習（8）ℓ 上の点で、x 座標が 8 の点の y 座標
        t("05d08b", (r) => {
          const n = pick(r, [3, 4, 5]), a = Q(coprimeTo(r, n, 3), n), b = nz(r, 4), pts = twoPoints(r, a, b, true);
          if (!pts) return { skip: true };
          const [p1, p2] = pts, l = line(a, b), x0 = n * pick(r, [-3, -2, 2, 3, 4]), v = yAt(l, x0)[0], dx = p2[0] - p1[0], dyv = p2[1] - p1[1];
          return {
            q: `直線 ℓ は、2点 ${PT(p1, "A")}、${PT(p2, "B")} を通る。ℓ 上の点で、$x$ 座標が ${N(x0)} である点の、$y$ 座標は？`,
            ans: v,
            hint: "ℓ の傾きと切片は、それぞれいくつかな？ 式がわかれば、$x$ 座標から $y$ 座標はどう求められるかな？",
            steps: [`切片は ${N(b)}、傾きは ${$(divTex(dyv, dx))}。ℓ の式は ${L(l)}。`, `$x=${x0}$ を代入して、${$(`y=${subTex(l, x0)}`)}。`],
          };
        }),
        // 05q05 小テスト チャレンジ：y＝ax+3 で、x が 2 増加すると y が 5 減少 → x が −4 から 2 まで増加するときの y の増加量
        t("05q05", (r) => {
          const n = pick(r, [2, 3, 4]), dx = n * r(1, 2), m = coprimeTo(r, n, 6) * (dx / n), a = Q(m, dx), b = nz(r, 6);
          let k2 = 2;
          do { k2 = r(2, 4); } while (n * k2 === dx);      // 聞く範囲の幅が、条件の幅と同じにならないようにする
          const x1 = n * r(-3, -1), x2 = x1 + n * k2, v = a[0] * ((x2 - x1) / a[1]);
          return {
            q: `一次関数 ${$(`y=ax${b < 0 ? "-" : "+"}${Math.abs(b)}`)} で、$x$ の値が ${dx} 増加すると、$y$ の値は ${Math.abs(m)} ${m < 0 ? "減少" : "増加"}する。この一次関数で、$x$ の値が ${N(x1)} から ${N(x2)} まで増加するとき、$y$ の増加量は？`,
            ans: v,
            hint: "$a$ は、どうやって求められたかな？ $a$ がわかれば、$x$ の増加量から $y$ の増加量はどう求められるかな？",
            steps: [`$a$ は変化の割合に等しいので、${$(`a=${divTex(m, dx)}`)}。`, `$x$ の増加量は ${$(`${x2}-${par(x1)}=${x2 - x1}`)}。`, `$y$ の増加量は ${$(`${par(a)}\\times ${x2 - x1}=${v}`)}。`],
          };
        }),
      ],
    },
  }),
];

/** 05d07 の条件：y＝ax+b（b は数）で、x が x1 から x2 まで増加すると y が dyv 増加（減少）する */
function spec(r) {
  const d = pick(r, [1, 1, 2, 3]), a = d === 1 ? Q(nz(r, 5)) : Q(coprimeTo(r, d, 3), d), b = nz(r, 6);
  const x1 = r(-2, 3), x2 = x1 + d * r(1, 3), dyv = (a[0] * (x2 - x1)) / a[1];
  return { a, b, x1, x2, dx: x2 - x1, dyv, text: `一次関数 $y=ax${b < 0 ? "-" : "+"}${Math.abs(b)}$ で、$x$ の値が ${N(x1)} から ${N(x2)} まで増加するとき、$y$ の値は ${Math.abs(dyv)} ${dyv < 0 ? "減少" : "増加"}する。` };
}
/** 直線 l に x を入れた計算と値の TeX：2\times 3-7=-1 */
function subTex(l, x) {
  const xv = Array.isArray(x) ? x : [x, 1], xs = qt(xv), xp = xv[0] < 0 ? `(${xs})` : xs;
  const s = xv[0] === 0 && Math.abs(l.a[0]) === 1 && l.a[1] === 1 ? "0" : l.a[0] === 1 && l.a[1] === 1 ? xs : l.a[0] === -1 && l.a[1] === 1 ? `-${xp}` : `${qt(l.a)}\\times ${xp}`;
  const b = qiszero(l.b) ? "" : `${l.b[0] < 0 ? "-" : "+"}${qt([Math.abs(l.b[0]), l.b[1]])}`;
  return `${s}${b}=${qt(yAt(l, xv))}`;
}

// 移さなかった問題はない（図の直線の読みとりは、直線が通る 2点の座標を文で言う形にした）
export const SKIPPED = [];
