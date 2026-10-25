// ============================================================
// ichiji-04.js — 一次関数 第4時「y＝ax+b のグラフは、y＝ax のグラフをどう動かしたものか」（平行移動・切片・一次関数のグラフ）
//   ikkan の演習プリント（ichiji-04.dr.1〜9）・小テスト（ichiji-04.qz.1〜5）を、コツコツくんのテンプレートにしたもの。
//   テンプレート id＝「04」＋ d（演習）／q（小テスト）＋ ikkan の問題の番号（＋ 小問・型ごとに a, b…）。例：04d06b ＝ ichiji-04.dr.6 の②
//   図（座標平面）は出せないので、グラフをかく問題は「x 軸との交点の x 座標」「通る点の組」「平行移動したあとの切片」など、1つの値や選択で聞く問題にした。
//   「点がグラフの上にあるか」は、点の座標を式に代入して調べる（linear.js の onLine・yAt で判定）。誤答の点・式は、条件を満たさないことを確かめてから出す。
//   「y＝3x のグラフをどう動かすか」は、動かしたあとの直線を計算して、正解と同じ直線になる選択肢（x 軸方向の移動など）を入れないようにした。
// ============================================================
import { t, pick, choices4, shuffle, rnz, gcd } from "../kit.js";
import { unitFor } from "../unit-kit.js";
import { Q, qadd, qiszero, qeq } from "../algebra.js";
import { line, yAt, xAt, onLine, ltex, ptex2, qt, num } from "../linear.js";

const unit = unitFor("ichiji");

// ── 道具（この授業の問題用に足した小さな関数）──────────────────────────
const $ = (s) => `$${s}$`;
const L = (l) => $(ltex(l));
const axt = (a) => ltex(line(a, 0)).slice(2);
const nz = (r, m) => rnz(r, -m, m);
const N = (v) => `$${v}$`;
const par = (x) => { const v = Array.isArray(x) ? x : [x, 1]; return v[0] < 0 ? `(${qt(v)})` : qt(v); };
const subTex = (l, x) => {
  const xv = Array.isArray(x) ? x : [x, 1], xs = qt(xv), xp = xv[0] < 0 ? `(${xs})` : xs;
  const s = xv[0] === 0 && Math.abs(l.a[0]) === 1 && l.a[1] === 1 ? "0" : l.a[0] === 1 && l.a[1] === 1 ? xs : l.a[0] === -1 && l.a[1] === 1 ? `-${xp}` : `${qt(l.a)}\\times ${xp}`;
  const b = qiszero(l.b) ? "" : `${l.b[0] < 0 ? "-" : "+"}${qt([Math.abs(l.b[0]), l.b[1]])}`;
  if (l.a[0] === 1 && l.a[1] === 1 && !b) return qt(yAt(l, xv));      // y＝x のとき：x の値がそのまま y
  return `${s}${b}=${qt(yAt(l, xv))}`;
};
const solveTex = (l, y0) => {
  const out = [`${y0}=${ltex(l).slice(2)}`];
  if (!qiszero(l.b)) out.push(`${axt(l.a)}=${qt(qadd([y0, 1], [-l.b[0], l.b[1]]))}`);
  if (!(l.a[0] === 1 && l.a[1] === 1)) out.push(`x=${qt(xAt(l, y0))}`);
  return out;
};
const solveLine = (l, y0) => solveTex(l, y0).map($).join("、");
const lineChoices = (r, right, wrongs) => {
  const ans = L(right), seen = new Set([ltex(right)]), ws = [];
  for (const w of wrongs) {
    if (!w || qiszero(w.a)) continue;
    const s = ltex(w);
    if (seen.has(s)) continue;
    seen.add(s); ws.push($(s));
  }
  const fill = (i) => {
    const d = [1, -1, 2, -2, 3, -3][i % 6], w = i % 12 < 6 ? line(qadd(right.a, Q(d)), right.b) : line(right.a, qadd(right.b, Q(d)));
    return qiszero(w.a) || seen.has(ltex(w)) ? null : $(ltex(w));
  };
  return { ans, choices: choices4(r, ans, ws, fill) };
};
/** 分母 n と互いに素な、0 でない整数 m（絶対値 mx 以下） */
const coprimeTo = (r, n, mx) => { let m = nz(r, mx); while (gcd(m, n) !== 1) m = nz(r, mx); return m; };
/** 「y 軸の正（負）の方向に d だけ」 */
const upTxt = (b) => `$y$ 軸の${b < 0 ? "負" : "正"}の方向に ${Math.abs(b)} だけ`;
/** 傾きがふつうの数（整数か分数）の、あつかいやすい直線の傾き */
const slopes = (r, withFrac) => (withFrac && r(0, 2) === 0 ? Q(coprimeTo(r, pick(r, [2, 3]), 3), pick(r, [2, 3])) : Q(nz(r, 5)));

// ── 切片を読みとる式 ─────────────────────────────────────────
/** 整数の a、b の式。form＝std／rev／prop */
const intForm = (r, form, am = 6, bm = 9) => {
  const a = nz(r, am), b = form === "prop" ? 0 : nz(r, bm), std = ltex(line(a, b));
  return { tex: form === "rev" ? `y=${b}${a < 0 ? "-" : "+"}${axt(Math.abs(a))}` : std, a: Q(a), b: Q(b), std, form };
};
const interceptAsk = (e) => ({
  q: `一次関数 ${$(e.tex)} のグラフの、切片は？`,
  ans: num(e.b),
  hint: "切片は、グラフと $y$ 軸が交わる点の、$y$ 座標だったね。式のどの部分かな？",
  steps: [e.form === "rev" ? `$x$ の項を先に書くと、${$(e.std)}。` : e.form === "prop" ? `${$(e.tex)} は、${$(`y=${axt(e.a)}+0`)} と見る。` : `${$(e.tex)} は、$y=ax+b$ の形。`, `定数項 $b$ が切片だから、切片は ${$(qt(e.b))}。`],
});

// ── 点がグラフの上にあるか（04d04・04q03）──────────────────────────
/** 直線 l の上にない点を、ありがちな誤り（符号・切片・座標の入れかえ・1ずれ）でつくる。ちょうど l の上にあるものは除く */
const offPoint = (r, l, x, seen) => {
  const a = l.a[0], b = l.b[0], yv = a * x + b;      // a、b は整数の直線のみ
  const cands = [[x, -a * x + b], [x, a * x - b], [x, yv + 1], [x, yv - 1], [x, yv + 2], [x, yv - 2], [yv, x]];
  const ok = cands.filter((p) => !onLine(l, p) && Math.abs(p[0]) <= 15 && Math.abs(p[1]) <= 15 && !seen.has(p.join(",")));      // ほかの点と重ならない
  return ok.length ? pick(r, ok) : null;
};
/** 4つの点（どれも別の点）。on の個数だけ、直線の上にある */
const fourPoints = (r, l, on) => {
  for (let n = 0; n < 100; n++) {
    const xs = shuffle(r, [-3, -2, -1, 0, 1, 2, 3]).slice(0, 4), kinds = shuffle(r, [0, 1, 2, 3]).map((i) => i < on), seen = new Set(), out = [];
    for (let i = 0; i < 4; i++) {
      const p = kinds[i] ? [xs[i], yAt(l, xs[i])[0]] : offPoint(r, l, xs[i], seen);
      if (!p || seen.has(p.join(","))) break;
      seen.add(p.join(",")); out.push({ p, on: onLine(l, p) });
    }
    if (out.length === 4) return out;
  }
  throw new Error("fourPoints が作れない");
};

export const UNITS = [
  unit("04", {
    name: "一次関数のグラフ（平行移動・切片）",
    desc: "y＝ax+b のグラフは、y＝ax のグラフを平行移動した直線",
    prereqs: ["J2-ik03"],
    points: [
      "一次関数 $y=ax+b$ のグラフは直線で、$y=ax$ のグラフを $y$ 軸の正の方向に $b$ だけ平行移動した直線になる。$b$ が負の数のときは、$y$ 軸の負の方向に $|b|$ だけ動かす。",
      "グラフと $y$ 軸との交点 $(0, b)$ の $y$ 座標 $b$ を、グラフの切片という。$x$ 軸との交点では $y=0$ だから、$y=0$ を代入して $x$ を求める。",
      "点がグラフの上にあるとき、点の座標を式に代入すると、等式が成り立つ。",
    ],
    levels: {
      // ───────── 1 基礎 ─────────
      1: [
        // 04d01a 演習（1）y＝ax のグラフ上の点を平行移動した点の y 座標（表の y の値）
        t("04d01a", (r) => {
          const a = nz(r, 4), b = nz(r, 6), k = nz(r, 4), l = line(a, b);
          return {
            q: `$y=${axt(a)}$ のグラフ上の点 $(${k}, ${a * k})$ を、${upTxt(b)}平行移動した点は、${L(l)} のグラフ上の点になる。その点の $y$ 座標は？`,
            ans: a * k + b,
            hint: "$y$ 軸の方向に動かすと、点の $y$ 座標はどう変わるかな？ $x$ 座標は変わるかな？",
            steps: [`${upTxt(b)}動かすと、$y$ 座標は ${Math.abs(b)} ${b < 0 ? "小さく" : "大きく"}なる。`, `${$(`${a * k}${b < 0 ? "-" : "+"}${Math.abs(b)}=${a * k + b}`)}。（$x=${k}$ を ${L(l)} に代入した値と同じ。）`],
          };
        }),
        // 04d01b 演習（1）表：同じ x のとき、y＝ax+b の y は y＝ax の y より いくつ大きいか
        t("04d01b", (r) => {
          const a = nz(r, 4), b = nz(r, 6), x = r(-3, 3), l = line(a, b);
          return {
            q: `$x=${x}$ のとき、${L(l)} の $y$ の値から、$y=${axt(a)}$ の $y$ の値をひいた数は？`,
            ans: b,
            hint: "同じ $x$ の値を、2つの式にそれぞれ代入すると、$y$ の値はどうちがうかな？",
            steps: [`$y=${axt(a)}$ では ${$(`y=${subTex(line(a, 0), x)}`)}、${L(l)} では ${$(`y=${subTex(l, x)}`)}。`, `その差は ${$(`${yAt(l, x)[0]}-${par(a * x)}=${b}`)}。（$x$ が変わっても、差はいつも $b$。）`],
          };
        }),
        // 04d02 演習（2）切片
        t("04d02", (r) => interceptAsk(intForm(r, pick(r, ["std", "std", "rev", "prop"])))),
        // 04q01 小テスト（1）切片
        t("04q01", (r) => {
          if (r(0, 3) === 0) {
            const n = pick(r, [2, 3, 4, 5]), a = Q(coprimeTo(r, n, 3), n), b = nz(r, 6), std = ltex(line(a, b));
            return interceptAsk({ tex: std, a, b: Q(b), std, form: "std" });
          }
          return interceptAsk(intForm(r, pick(r, ["std", "rev", "prop"]), 5, 6));
        }),
      ],
      // ───────── 2 標準 ─────────
      2: [
        // 04d03a 演習（3）x 軸との交点（y＝−2x を 3 動かすと、…）
        t("04d03a", (r) => {
          const a = nz(r, 4), x0 = nz(r, 6), l = line(a, -a * x0);
          return {
            q: `一次関数 ${L(l)} のグラフが、$x$ 軸と交わる点の $x$ 座標は？`,
            ans: x0,
            hint: "$x$ 軸の上の点は、$y$ 座標がいくつかな？",
            steps: [`$x$ 軸上の点は $y=0$ だから、${solveLine(l, 0)}。`, `$x$ 軸と交わる点は $(${x0}, 0)$ で、$x$ 座標は ${x0}。`],
          };
        }),
        // 04d03b 演習（3）グラフが通る2点の組（4択）
        t("04d03b", (r) => {
          const a = nz(r, 4), b = nz(r, 6), l = line(a, b), [x1, x2] = pick(r, [[0, 1], [0, 2], [-1, 0], [1, 2], [-1, 1], [0, -1]]);
          const y = (x) => a * x + b, pr = (p, q2) => `${$(ptex2(p))} と ${$(ptex2(q2))}`;
          const right = [[x1, y(x1)], [x2, y(x2)]], ans = pr(...right);
          const i = x1 !== 0 ? 0 : 1;      // i：x が 0 でない方の点
          const cs = [
            right.map((p, k) => (k === i ? [p[0], -a * p[0] + b] : p)),     // 傾きの符号をまちがえた点がまじる
            right.map((p) => [p[0], a * p[0] - b]),                         // 切片の符号をまちがえた
            right.map((p) => [p[1], p[0]]),                                 // x 座標と y 座標をいれかえた
            right.map((p, k) => (k === i ? [p[0], p[1] + 1] : p)),          // 1ずれた点がまじる
            right.map((p, k) => (k === 1 - i ? [p[0], p[1] - 1] : p)),
          ].filter((ps) => !(onLine(l, ps[0]) && onLine(l, ps[1])));
          return {
            q: `一次関数 ${L(l)} のグラフが通る 2点の組として、正しいものは、次のうちどれか。`,
            ans,
            choices: choices4(r, ans, cs.map((ps) => pr(...ps))),
            hint: "それぞれの点の $x$ 座標を式に代入すると、$y$ の値は点の $y$ 座標と同じになるかな？",
            steps: [`${$(`x=${x1}`)} のとき ${$(`y=${subTex(l, x1)}`)}、${$(`x=${x2}`)} のとき ${$(`y=${subTex(l, x2)}`)}。`, `だから、グラフが通る 2点は ${ans}。ほかの組には、グラフの上にない点がふくまれる。`],
          };
        }),
        // 04d04a 演習（4）4つの点のうち、グラフの上にある点はいくつか
        t("04d04a", (r) => {
          const l = line(nz(r, 4), nz(r, 6)), on = pick(r, [1, 2, 3]), pts = fourPoints(r, l, on), LET = ["ア", "イ", "ウ", "エ"];
          const lines = pts.map((q, i) => ({ c: LET[i], p: q.p, on: q.on }));
          return {
            q: `次のア〜エの点のうち、一次関数 ${L(l)} のグラフの上にあるものは、いくつあるか。\n${lines.map((e) => `${e.c} ${$(ptex2(e.p))}`).join("　　")}`,
            ans: on,
            unit: "個",
            hint: "点の $x$ 座標を式に代入すると、できた $y$ の値は、点の $y$ 座標と同じになるかな？",
            steps: [lines.slice(0, 2).map((e) => `${e.c}：${$(`x=${e.p[0]}`)} のとき ${$(`y=${yAt(l, e.p[0])[0]}`)}。点の $y$ 座標 ${N(e.p[1])} と${e.on ? "同じ" : "ちがう"}。`).join(" "), lines.slice(2).map((e) => `${e.c}：${$(`x=${e.p[0]}`)} のとき ${$(`y=${yAt(l, e.p[0])[0]}`)}。点の $y$ 座標 ${N(e.p[1])} と${e.on ? "同じ" : "ちがう"}。`).join(" "), `グラフの上にあるのは ${lines.filter((e) => e.on).map((e) => e.c).join("、")} の ${on}個。`],
          };
        }),
        // 04d04b 演習（4）グラフの上にある点を選ぶ（4択）
        t("04d04b", (r) => {
          const l = line(nz(r, 4), nz(r, 6)), pts = fourPoints(r, l, 1), good = pts.find((q) => q.on).p, bad = pts.filter((q) => !q.on).map((q) => q.p);
          const ans = $(ptex2(good));
          return {
            q: `次の 4つの点のうち、一次関数 ${L(l)} のグラフの上にある点はどれか。`,
            ans,
            choices: choices4(r, ans, bad.map((p) => $(ptex2(p)))),
            hint: "点の $x$ 座標を式に代入すると、できた $y$ の値が、点の $y$ 座標と同じになるのは、どの点かな？",
            steps: [`${$(`x=${good[0]}`)} を代入すると、${$(`y=${subTex(l, good[0])}`)}。点の $y$ 座標と同じだから、${ans} はグラフの上にある。`, `ほかの点は、$x$ 座標を代入して出る $y$ の値が、点の $y$ 座標とちがう。`],
          };
        }),
        // 04q02 小テスト（2）y＝3x のグラフをどう動かすと y＝3x−4 のグラフになるか（4択）
        t("04q02", (r) => {
          const a = pick(r, [-5, -4, -3, -2, 2, 3, 4, 5]), b = nz(r, 8), target = line(a, b), dirTxt = (s, ax) => `${ax === "y" ? "$y$" : "$x$"} 軸の${s > 0 ? "正" : "負"}の方向に`;
          const res = (ax, s, amt) => (ax === "y" ? line(a, s * amt) : line(a, -s * a * amt));      // y＝ax から動かしたあとの直線
          const txt = (ax, s, amt) => `${dirTxt(s, ax)} ${amt} だけ平行移動する`;
          const m = Math.abs(b), s0 = b < 0 ? -1 : 1, ans = txt("y", s0, m);
          const cands = [["y", -s0, m], ["x", 1, m], ["x", -1, m], ["y", 1, Math.abs(a)], ["y", -1, Math.abs(a)]]
            .filter(([ax, s, amt]) => !qeq(res(ax, s, amt).b, target.b) || !qeq(res(ax, s, amt).a, target.a));
          return {
            q: `$y=${axt(a)}$ のグラフを、どのように動かすと、${L(target)} のグラフになるか。`,
            ans,
            choices: choices4(r, ans, cands.map(([ax, s, amt]) => txt(ax, s, amt)), (i) => txt("y", i % 2 ? 1 : -1, m + 1 + Math.floor(i / 2))),
            hint: "2つの式をくらべて、何が変わっているかな？ その数は、グラフのどこに表れるかな？",
            steps: [`${$(`y=${axt(a)}`)} と ${L(target)} をくらべると、切片が 0 から ${$(String(b))} に変わっている。`, `切片は $y$ 軸との交点の $y$ 座標だから、${ans}。`],
          };
        }),
        // 04q03 小テスト（3）点 (2, 7) は y＝3x+1 のグラフの上にあるか（理由つきで選ぶ）
        t("04q03", (r) => {
          const a = nz(r, 5), b = nz(r, 8), l = line(a, b), p = r(-3, 4), on = r(0, 1) === 1, yv = a * p + b;
          let q0 = on ? yv : yv + pick(r, [-3, -2, -1, 1, 2, 3]);
          const claim = (v) => (v === q0 ? `グラフの上にある。${$(`x=${p}`)} のとき ${$(`y=${v}`)} となり、点の $y$ 座標 ${N(q0)} と同じだから。` : `グラフの上にない。${$(`x=${p}`)} のとき ${$(`y=${v}`)} となり、点の $y$ 座標 ${N(q0)} とちがうから。`);
          const vals = [...new Set([a * p - b, a * p, b * p + a, a * q0 + b, yv + 1, yv - 1].filter((v) => v !== yv && Math.abs(v) < 60))];
          const ans = claim(yv);
          return {
            q: `点 ${$(ptex2([p, q0]))} は、一次関数 ${L(l)} のグラフの上にあるか。理由とともに、正しいものを選ぼう。`,
            ans,
            choices: choices4(r, ans, shuffle(r, vals).map(claim)),
            hint: "点の $x$ 座標を式に代入して出た $y$ の値は、点の $y$ 座標と同じになるかな？",
            steps: [`点の $x$ 座標 ${N(p)} を代入すると、${$(`y=${subTex(l, p)}`)}。`, on ? `点の $y$ 座標 ${N(q0)} と同じだから、グラフの上にある。` : `点の $y$ 座標 ${N(q0)} とちがうから、グラフの上にない。`],
          };
        }),
        // 04q04 小テスト（4）y＝−x のグラフを 2 動かしたグラフが x 軸と交わる点の x 座標
        t("04q04", (r) => {
          const a = pick(r, [-3, -2, -1, 1, 2, 3]), x0 = nz(r, 5), b = -a * x0, l = line(a, b);
          return {
            q: `$y=${axt(a)}$ のグラフを、${upTxt(b)}平行移動したグラフが、$x$ 軸と交わる点の $x$ 座標は？`,
            ans: x0,
            hint: "平行移動すると、式のどこが変わるかな？ $x$ 軸上の点の $y$ 座標は、いくつかな？",
            steps: [`平行移動したグラフの式は ${L(l)}。`, `$x$ 軸上の点は $y=0$ だから、${solveLine(l, 0)}。`],
          };
        }),
      ],
      // ───────── 3 応用 ─────────
      3: [
        // 04d05 演習（5）y＝2x+b が点 (1, 5) を通る → b
        t("04d05", (r) => {
          const n = pick(r, [1, 1, 1, 2, 3]), a = n === 1 ? Q(nz(r, 5)) : Q(coprimeTo(r, n, 3), n), b = nz(r, 9), p = n * nz(r, 3), q0 = yAt(line(a, b), p)[0];
          return {
            q: `一次関数 ${$(`y=${axt(a)}+b`)} のグラフが、点 ${$(ptex2([p, q0]))} を通るとき、$b$ の値は？`,
            ans: b,
            hint: "グラフが点を通るとき、その点の座標を式に代入すると、どうなるかな？",
            steps: [`$x=${p}$、$y=${q0}$ を代入して、${$(`${q0}=${par(a)}\\times ${par(p)}+b`)}。`, `${$(`b=${q0}-${par(yAt(line(a, 0), p))}=${b}`)}。`],
          };
        }),
        // 04d06a 演習（6）① グラフ上の点：x 座標から y 座標
        t("04d06a", (r) => {
          const n = pick(r, [2, 3, 4]), l = line(Q(coprimeTo(r, n, 3), n), nz(r, 6)), x = n * nz(r, 4);
          return {
            q: `一次関数 ${L(l)} のグラフの上の点で、$x$ 座標が ${N(x)} である点の、$y$ 座標は？`,
            ans: num(yAt(l, x)),
            hint: "グラフの上の点の座標は、式に代入するとどうなるかな？ $x$ 座標がわかっているとき、$y$ 座標はどう求められるかな？",
            steps: [`$x=${x}$ を代入して、${$(`y=${subTex(l, x)}`)}。`],
          };
        }),
        // 04d06b 演習（6）② グラフ上の点：y 座標から x 座標
        t("04d06b", (r) => {
          const n = pick(r, [2, 3, 4]), l = line(Q(coprimeTo(r, n, 3), n), nz(r, 6)), x = n * nz(r, 5), y0 = yAt(l, x)[0];
          return {
            q: `一次関数 ${L(l)} のグラフの上の点で、$y$ 座標が ${N(y0)} である点の、$x$ 座標は？`,
            ans: x,
            hint: "グラフの上の点の座標は、式に代入するとどうなるかな？ $y$ 座標がわかっているとき、$x$ はどう求められるかな？",
            steps: [`$y=${y0}$ を代入して、${solveLine(l, y0)}。`],
          };
        }),
        // 04d07a 演習（7）y＝3x+1 を y 軸の負の方向に 4 動かした直線の式（4択）
        t("04d07a", (r) => {
          const a = nz(r, 5), b = nz(r, 6), d = r(1, 7) * pick(r, [1, -1]), l = line(a, b), right = line(a, b + d);
          const { ans, choices } = lineChoices(r, right, [line(a, b - d), line(a, d), line(a + d, b), line(a, b - a * d)]);
          return {
            q: `一次関数 ${L(l)} のグラフを、${upTxt(d)}平行移動した直線の式は？`,
            ans,
            choices,
            hint: "平行移動すると、傾きは変わるかな？ 切片（$y$ 軸との交点の $y$ 座標）は、どう変わるかな？",
            steps: [`傾きは変わらず、切片が ${$(`${b}${d < 0 ? "-" : "+"}${Math.abs(d)}=${b + d}`)} になる。`, `だから、${L(right)}。`],
          };
        }),
        // 04d07b 演習（7）平行移動したあとの切片
        t("04d07b", (r) => {
          const a = nz(r, 5), b = nz(r, 6), d = r(1, 7) * pick(r, [1, -1]), l = line(a, b);
          return {
            q: `一次関数 ${L(l)} のグラフを、${upTxt(d)}平行移動した直線の、切片は？`,
            ans: b + d,
            hint: "$y$ 軸の方向に動かすと、グラフと $y$ 軸との交点は、どう動くかな？",
            steps: [`切片は、もとの ${N(b)} から ${upTxt(d)}動くので、${$(`${b}${d < 0 ? "-" : "+"}${Math.abs(d)}=${b + d}`)}。`],
          };
        }),
      ],
      // ───────── 4 入試レベル ─────────
      4: [
        // 04d08a 演習（8）① 比例 y＝−x を平行移動した直線 ℓ が y 軸と (0, 3) で交わる → ℓ の式（4択）
        t("04d08a", (r) => {
          const a = Q(pick(r, [-3, -2, -1, 1, 2, 3, 1, -1]), pick(r, [1, 1, 1, 2])), k = nz(r, 6), right = line(a, k);
          const { ans, choices } = lineChoices(r, right, [line(a, -k), line(qadd([0, 1], [-a[0], a[1]]), k), line(k, a), line(a, 0)]);
          return {
            q: `直線 ℓ は、比例 $y=${axt(a)}$ のグラフを平行移動したものである。ℓ は $y$ 軸と点 ${$(ptex2([0, k]))} で交わる。ℓ の式は？`,
            ans,
            choices,
            hint: "平行移動すると、傾きは変わるかな？ 切片は、$y$ 軸との交点の何座標かな？",
            steps: [`平行移動したから、傾きは $y=${axt(a)}$ と同じ ${$(qt(a))}。`, `$y$ 軸と ${$(ptex2([0, k]))} で交わるから、切片は ${N(k)}。よって ${ans}。`],
          };
        }),
        // 04d08b 演習（8）② ℓ をさらに y 軸方向に動かした直線の切片
        t("04d08b", (r) => {
          const a = Q(pick(r, [-3, -2, -1, 1, 2, 3]), pick(r, [1, 1, 2])), k = nz(r, 6), d = r(1, 6) * pick(r, [1, -1]);
          return {
            q: `直線 ℓ は、比例 $y=${axt(a)}$ のグラフを平行移動したもので、$y$ 軸と点 ${$(ptex2([0, k]))} で交わる。ℓ を、さらに ${upTxt(d)}平行移動した直線の、切片は？`,
            ans: k + d,
            hint: "ℓ の切片はいくつかな？ そこから、さらに動かすと、切片はどう変わるかな？",
            steps: [`ℓ の切片は ${N(k)}。`, `さらに ${upTxt(d)}動かすと、切片は ${$(`${k}${d < 0 ? "-" : "+"}${Math.abs(d)}=${k + d}`)}。`],
          };
        }),
        // 04d09a 演習（9）① 同じ x 座標の点 A、B の間の長さ
        t("04d09a", (r) => {
          const a = slopes(r, true), b1 = pick(r, [0, 0, nz(r, 5)]);
          let b2 = nz(r, 6);
          while (b2 === b1) b2 = nz(r, 6);
          const l1 = line(a, b1), l2 = line(a, b2), len = Math.abs(b2 - b1);
          return {
            q: `${L(l1)} のグラフの上に点 A、${L(l2)} のグラフの上に点 B があり、A と B の $x$ 座標は等しい。座標軸の 1 目もりを 1 とするとき、線分 AB の長さは？`,
            ans: len,
            hint: "$x$ 座標が同じ2点の $y$ 座標を、$x$ を使って表すと、その差はどうなるかな？",
            steps: [`2点の $x$ 座標を $t$ とすると、A の $y$ 座標は ${$(ltex(l1).slice(2).replace(/x/g, "t"))}、B の $y$ 座標は ${$(ltex(l2).slice(2).replace(/x/g, "t"))}。`, `$y$ 座標の差は、定数項の差で、${$(`${Math.max(b1, b2)}-${par(Math.min(b1, b2))}=${len}`)}。だから、AB の長さは ${len}。`],
          };
        }),
        // 04d09b 演習（9）② A の x 座標が t のとき、B の y 座標
        t("04d09b", (r) => {
          const n = pick(r, [2, 3, 4]), a = Q(coprimeTo(r, n, 3), n), b1 = pick(r, [0, nz(r, 4)]);
          let b2 = nz(r, 6);
          while (b2 === b1) b2 = nz(r, 6);
          const l1 = line(a, b1), l2 = line(a, b2), tx = n * nz(r, 3);
          return {
            q: `${L(l1)} のグラフの上に点 A、${L(l2)} のグラフの上に点 B があり、A と B の $x$ 座標は等しい。A の $x$ 座標が ${N(tx)} のとき、B の $y$ 座標は？`,
            ans: num(yAt(l2, tx)),
            hint: "B の $x$ 座標は、A の $x$ 座標と同じだね。B は、どちらの式のグラフの上にある点かな？",
            steps: [`B の $x$ 座標も ${N(tx)}。`, `B は ${L(l2)} のグラフの上にあるから、${$(`y=${subTex(l2, tx)}`)}。`],
          };
        }),
        // 04q05 小テスト チャレンジ：y＝−x+b が点 (4, 1) を通る → y 軸方向に動かしたグラフの切片
        t("04q05", (r) => {
          const a = pick(r, [-3, -2, -1, 1, 2, 3]), p = r(1, 5), b = nz(r, 7), q0 = a * p + b, d = r(1, 5) * pick(r, [1, -1]);
          return {
            q: `一次関数 ${$(`y=${axt(a)}+b`)} のグラフは、点 ${$(ptex2([p, q0]))} を通る。このグラフを、${upTxt(d)}平行移動したグラフの、切片は？`,
            ans: b + d,
            hint: "もとのグラフの切片 $b$ は、どうやって求められるかな？ 点を通るとき、座標を式に代入すると？",
            steps: [`点 ${$(ptex2([p, q0]))} を通るから、${$(`${q0}=${par(a)}\\times ${p}+b`)} より ${$(`b=${b}`)}。`, `平行移動すると、切片は ${$(`${b}${d < 0 ? "-" : "+"}${Math.abs(d)}=${b + d}`)}。`],
          };
        }),
      ],
    },
  }),
];

// 移さなかった問題はない（グラフをかく問題は、x 軸との交点・通る点の組・平行移動後の切片など、1つの値や選択を聞く問題にした）
export const SKIPPED = [];
