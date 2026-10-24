// ============================================================
// shiki-04.js — 式の計算 第4時「文字式どうしのかけ算・わり算を、考えて計算しよう」（単項式の乗法・除法）
//   ikkan の演習プリント（shiki-04.dr.1〜10）・小テスト（shiki-04.qz.1〜5）を、コツコツくんのテンプレートにしたもの。
//   テンプレート id＝「04」＋ d（演習）／q（小テスト）＋ ikkan の問題の番号（＋ 型ごとに a, b…）。例：04d01a ＝ shiki-04.dr.1 の数の問い、04d01b ＝ 同じ型の4択
//   単項式の積・商・累乗は algebra.js の多項式（term・pmul・pdivMono）で計算し、答えを手で書かない。
//   式の答えは入力欄で打てないので、(a) 答えの式の係数を聞く問い（「□xy の □は？」のように、文字の部分は問題文で見せる）と、
//   (b) 4択（誤答は「係数をたしてしまう」「約分で文字を消し忘れる」「(−3a)² の符号」など、正解と式として同じにならないもの）の2つの型にした。
//   「まちがいを説明する」(dr.8) は、正しい理由を選ぶ4択にした。
// ============================================================
import { t, pick, choices4, fracAns, fracTex, gcd } from "../kit.js";
import { unitFor } from "../unit-kit.js";
import { Q, qmul, term, padd, pneg, pmul, pdivMono, pisz, peq, ptex } from "../algebra.js";

const unit = unitFor("shiki");

// ── 式の道具（algebra.js のうえに、この授業の問題用に足した小さな関数）──────────────
const $ = (s) => `$${s}$`;
/** 単項式 [係数, {文字: 指数}]（係数は整数か [分子, 分母]）→ 多項式（1項） */
const Mq = ([c, e]) => term(c, e);
const T1 = (m) => ptex(Mq(m));
const keyOf = (e) => Object.keys(e).filter((v) => e[v] !== 0).sort().map((v) => v + e[v]).join("");
const expsOf = (key) => { const e = {}; for (const m of key.matchAll(/([a-z])(-?\d+)/g)) e[m[1]] = +m[2]; return e; };
/** 1項の多項式 → [係数(Q), 指数の組] */
const parts = (p) => { const k = Object.keys(p)[0]; return [p[k], expsOf(k)]; };
const letterList = (e) => Object.keys(e).sort().flatMap((v) => Array(e[v]).fill(v));
const lettersTex = (e) => ptex(term(1, e));                 // 文字の部分だけの TeX（x^{2}y など）
/** 係数の絶対値 c と文字 e の積の TeX（係数 1 は省く。文字がなければ数） */
const mTex = (c, e) => (Object.keys(e).length ? `${c === 1 ? "" : c}${lettersTex(e)}` : String(c));
const kf = (c) => (c < 0 ? `(${c})` : String(c));
const par = (s) => (s[0] === "-" ? `(${s})` : s);
/** かけ算・わり算の式の中での単項式の書き方：負の項や分数の係数がマイナスなら、かっこをつける */
const fT = (m) => {
  const s = T1(m);
  return s[0] === "-" ? (s.includes("\\frac") ? `\\left(${s}\\right)` : `(${s})`) : s;
};
const ansQ = (q) => fracAns(q[0], q[1]);
/** 解説の中の「÷ わる式」の書き方：1つの数・1つの文字・分数・かっこつきの式のほかには、かっこをつける（24π÷(4π) と同じ） */
const dp = (s) => (/^\(.*\)$/.test(s) || /^\\left\(/.test(s) || /^\d+$/.test(s) || /^[a-z](\^\{\d+\})?$/.test(s) || /^\\frac\{[^{}]+\}\{[^{}]+\}$/.test(s) ? s : `(${s})`);
/** 解説の最後の一文 */
const lastLine = (label, q) => `${label}は ${$(fracTex(q[0], q[1]))}。`;
const LET2 = [["x", "y"], ["a", "b"], ["m", "n"], ["p", "q"], ["s", "t"]];
const addE = (a, b) => { const e = { ...a }; for (const v in b) e[v] = (e[v] || 0) + b[v]; return e; };
const allInt = (p) => Object.values(p).every((c) => c[1] === 1);
/** 係数の符号 */
const sgn = (c) => (c < 0 ? -1 : 1);
const absC = (c) => Math.abs(c);

/** 式の4択：正解 right、ありがちな誤答 wrongs（多項式）。正解と式として同じもの（peq）は、はずす */
const polyChoices = (r, right, wrongs) => {
  const rt = ptex(right), seen = new Set([rt]), ws = [];
  for (const w of wrongs) {
    if (!w || pisz(w) || peq(w, right) || (allInt(right) && !allInt(w))) continue;    // 答えが整数係数なら、誤答も整数係数にそろえる
    const s = ptex(w);
    if (seen.has(s)) continue;
    seen.add(s); ws.push($(s));
  }
  const ks = Object.keys(right);
  const fill = (i) => {
    if (!ks.length) return null;
    const w = padd(right, { [ks[i % ks.length]]: Q([1, -1, 2, -2, 3, -3][Math.floor(i / ks.length) % 6]) });
    return pisz(w) || peq(w, right) ? null : $(ptex(w));
  };
  return { ans: $(rt), choices: choices4(r, $(rt), ws, fill) };
};

/** 「expr ＝ □（文字の部分）」の □ にあてはまる数（答えの単項式 res の係数）を聞く問い。文字の部分は res から出して、問題文で見せる */
const boxQ = (expr, res, hint, steps, note = "") => {
  const [c, e] = parts(res);
  return { q: `${$(`${expr}=\\square ${lettersTex(e)}`)} の □ にあてはまる数は？${note}`, ans: ansQ(c), hint, steps: [...steps, lastLine("□ にあてはまる数", c)] };
};
/** 単項式の積の途中式：(-4)\times 3\times a\times b */
const mulMid = (ms) => [...ms.map(([c]) => (Array.isArray(c) ? (c[1] === 1 ? kf(c[0]) : fracTex(c[0], c[1])) : kf(c))), ...ms.flatMap(([, e]) => letterList(e))].join("\\times ");

// ── 乗法（dr.1・qz.1）─────────────────────────────────────
const mulBuild = (r, mode, o) => {
  const [u, v] = pick(r, LET2), kind = pick(r, o.kinds), c = () => pick(r, [1, -1]) * r(2, o.cmax);
  let m1, m2;
  if (kind === "diff") { m1 = [c(), { [u]: 1 }]; m2 = [c(), { [v]: 1 }]; if (r(0, 1)) [m1, m2] = [m2, m1]; }
  else { m1 = [c(), { [u]: r(1, 2) }]; m2 = [c(), { [u]: r(1, 2) }]; }      // same：同じ文字どうし
  const res = pmul(Mq(m1), Mq(m2)), [rc, re] = parts(res);
  const expr = `${fT(m1)}\\times ${fT(m2)}`;
  const steps = ["係数どうし、文字どうしをかける。", $(`${expr}=${mulMid([m1, m2])}=${ptex(res)}`)];
  const hint = "係数どうしをかけて、文字どうしをかけよう。同じ文字のかけ算は、$x\\times x=x^2$ のように指数で表す。";
  if (mode === "num") return boxQ(expr, res, hint, steps);
  const sum = Mq([m1[0] + m2[0], re]);                                                                                       // 係数をたしてしまう
  const noAdd = Mq([rc, Object.fromEntries(Object.keys(re).map((k) => [k, Math.max(m1[1][k] || 0, m2[1][k] || 0)]))]);    // 同じ文字の指数をたさない
  const { ans, choices } = polyChoices(r, res, [sum, noAdd, pneg(res), Mq([m1[0] * m2[0] - (m1[0] + m2[0]), re])]);
  return { q: `${$(expr)} を計算すると？`, ans, choices, hint, steps };
};

// ── 累乗（dr.2・qz.1）─────────────────────────────────────
const powBuild = (r, mode, o) => {
  const [u] = pick(r, LET2), form = pick(r, o.forms), n = 2, k = r(2, o.cmax);
  const base = [form === "neg" ? -k : k, { [u]: 1 }], s = T1(base);
  let res = pmul(Mq(base), Mq(base));
  if (form === "outer") res = pneg(res);
  const expr = form === "outer" ? `-(${s})^{${n}}` : `(${s})^{${n}}`;
  const steps = form === "outer"
    ? ["累乗が先。−(…)² は、(…)² の符号を変えたもの。", $(`${expr}=-(${s}\\times ${s})=${ptex(res)}`)]
    : ["累乗は、かっこの中をその回数かけること。係数も文字も、同じ回数かける。", $(`${expr}=${par(s)}\\times ${par(s)}=${ptex(res)}`)];
  const hint = "累乗は、同じものを何回かかけること。かっこの中の係数も文字も、同じ回数かける。";
  if (mode === "num") return boxQ(expr, res, hint, steps);
  const [rc] = parts(res), sg = sgn(rc[0]);
  const wrongs = [Mq([sg * k, { [u]: 2 }]), Mq([sg * k * n, { [u]: 2 }]), Mq([rc, { [u]: 1 }]), pneg(res)];
  const { ans, choices } = polyChoices(r, res, wrongs);
  return { q: `${$(expr)} を計算すると？`, ans, choices, hint, steps };
};

// ── 除法（dr.3・qz.2）─────────────────────────────────────
/** わられる式 ÷ わる式。商 q とわる式 d を決めて、わられる式 ＝ q × d にする */
const divBuild = (r, mode, o) => {
  const [u, v] = pick(r, LET2);
  const EQ = [{ [v]: 1 }, { [u]: 1 }, { [u]: 2 }, { [v]: 2 }, { [u]: 1, [v]: 1 }], ED = [{ [u]: 1 }, { [v]: 1 }, { [u]: 1, [v]: 1 }, { [u]: 2 }];
  let eq, ed;
  for (let i = 0; i < 50; i++) { eq = pick(r, EQ); ed = pick(r, ED); if (Object.keys(eq).every((x) => !(x in ed)) || r(0, 2) === 0) break; }
  const cq = pick(r, [1, -1]) * r(2, o.cmax), cd = (o.negDiv && r(0, 1) ? -1 : 1) * r(2, o.cmax);
  const dv = [cd, ed], dd = [cq * cd, addE(eq, ed)];
  const res = pdivMono(Mq(dd), Mq(dv));
  const expr = `${fT(dd)}\\div ${fT(dv)}`;
  const sg = cq < 0 ? "-" : "";
  const frac = `${sg}\\frac{${mTex(absC(cq * cd), dd[1])}}{${mTex(absC(cd), ed)}}`;
  const steps = ["分数の形にして、係数どうし、同じ文字どうしを約分する（逆数をかけてもよい）。", $(`${fT(dd)}\\div ${dp(fT(dv))}=${frac}=${ptex(res)}`)];
  const hint = "わる式を分母にした分数にすると、約分できる係数と文字は、どれだろう。";
  if (mode === "num") return boxQ(expr, res, hint, steps, "（÷ のあとの式は、全体でわる）");
  const [rc, re] = parts(res);
  const wrongs = [
    Mq([rc, dd[1]]),                                              // 約分で文字を消し忘れる
    pneg(res),                                                    // 符号
    Mq([rc, addE(re, ed)]),                                       // 指数をたしてしまう
    Mq([dd[0] - cd, re]),                                         // 係数を、ひき算にしてしまう
  ];
  const { ans, choices } = polyChoices(r, res, wrongs);
  return { q: `${$(expr)} を計算すると？（÷ のあとの式は、全体でわる）`, ans, choices, hint, steps };
};

// ── 分数の係数の乗法（dr.4）───────────────────────────────
const fracCoef = (r) => {
  for (;;) {
    const q = r(2, 6), p = r(1, 5);
    if (gcd(p, q) === 1 && p !== q) return [p, q];
  }
};
const fmulBuild = (r, mode, o) => {
  const [u, v] = pick(r, LET2), [p, q] = fracCoef(r);
  let mm = r(1, o.mmax);
  if (p * mm < 2) mm += 1;
  const sf = o.fneg && r(0, 3) === 0 ? -1 : 1, m = mm * q * pick(r, [1, -1]), same = r(0, 2) === 0;
  const f1 = [[sf * p, q], { [u]: 1 }], f2 = [m, { [same ? u : v]: same ? r(1, 2) : 1 }];
  const [a, b] = r(0, 3) === 0 ? [f2, f1] : [f1, f2];
  const res = pmul(Mq(f1), Mq(f2)), [rc, re] = parts(res);
  const expr = `${fT(a)}\\times ${fT(b)}`;
  const coefs = [a, b].map(([c]) => (Array.isArray(c) ? (c[0] < 0 ? `\\left(${fracTex(c[0], c[1])}\\right)` : fracTex(c[0], c[1])) : kf(c)));
  const mid = [...coefs, ...[a, b].flatMap(([, e]) => letterList(e))].join("\\times ");
  const steps = ["係数どうし、文字どうしをかける。分数の係数は、約分しながら計算するとよい。", $(`${expr}=${mid}=${ptex(res)}`)];
  const hint = "分数の係数と整数の係数を、約分しながらかけよう。文字どうしもかける。";
  if (mode === "num") return boxQ(expr, res, hint, steps);
  const wrongs = [Mq([Q(sf * q * m, p), re]), Mq([Q(sf * p + m * q, q), re]), pneg(res), Mq([sf * p * m, re])];      // 分数を逆にしてかける／係数をたす／符号／分母を忘れる
  const { ans, choices } = polyChoices(r, res, wrongs);
  return { q: `${$(expr)} を計算すると？`, ans, choices, hint, steps };
};

// ── 分数の係数でわる除法（dr.5・qz.3）───────────────────────
const fdivBuild = (r, mode, o) => {
  const [u, v] = pick(r, LET2), [p, q] = fracCoef(r);
  const sgd = o.negDiv && r(0, 1) ? -1 : 1, cq = pick(r, [1, -1]) * r(1, o.mmax) * q;       // 商の係数（q の倍数にして、わられる式の係数を整数にする）
  const eq = pick(r, [{ [v]: 1 }, { [u]: 1 }]), ed = pick(r, [{ [u]: 1 }, { [u]: 1, [v]: 1 }, { [u]: 1 }]);
  const dv = [[sgd * p, q], ed], dd = [(cq * sgd * p) / q, addE(eq, ed)];
  const res = pdivMono(Mq(dd), Mq(dv)), [rc, re] = parts(res);
  const expr = `${fT(dd)}\\div ${fT(dv)}`;
  const recip = `${sgd < 0 ? "-" : ""}\\frac{${q}}{${mTex(p, ed)}}`;
  const sg = cq < 0 ? "-" : "";
  const mid2 = `${sg}\\frac{${mTex(absC(dd[0]), dd[1])}\\times ${q}}{${mTex(p, ed)}}`;
  const steps = ["わる式の逆数をかける（分母と分子を入れかえる。文字も入れかえる）。", $(`${expr}=${fT(dd)}\\times ${sgd < 0 ? `\\left(${recip}\\right)` : recip}=${mid2}=${ptex(res)}`)];
  const hint = "わる式の逆数（分母と分子を入れかえた式）は、どんな式になるかな。文字も入れかえるよ。";
  if (mode === "num") return boxQ(expr, res, hint, steps);
  const wrongs = [
    Mq([rc, dd[1]]),                                              // 文字を約分し忘れる
    Mq([rc, addE(dd[1], ed)]),                                    // 文字は逆数にせず、そのままかけてしまう
    Mq([Q(dd[0], sgd * p), re]),                                  // 分母の数 q を忘れて、分子の数 p だけでわる
    Mq([qmul(Q(dd[0]), Q(sgd * p, q)), re]),                      // わる式の逆数にしないで、そのままかけてしまう
    pneg(res),
  ];
  const { ans, choices } = polyChoices(r, res, wrongs);
  return { q: `${$(expr)} を計算すると？`, ans, choices, hint, steps };
};

// ── 直方体の高さ・長方形の横（dr.6・qz.4）─────────────────────
const boxHeight = (r, mode) => {
  const [u, v] = pick(r, LET2);
  const s1 = [r(2, 5), { [u]: 1 }], s2 = [r(2, 5), { [v]: 1 }];
  const h = [r(2, 6), pick(r, [{ [u]: 1 }, { [v]: 1 }, { [u]: 1, [v]: 1 }, { [u]: 2 }, { [v]: 2 }])];
  const base = pmul(Mq(s1), Mq(s2)), vol = pmul(base, Mq(h)), res = pdivMono(vol, base);
  const [hc, he] = parts(res), [vc, ve] = parts(vol);
  const head = `底面が、縦 ${$(T1(s1))} cm・横 ${$(T1(s2))} cm の長方形で、体積が ${$(ptex(vol))} cm³ の直方体がある。この直方体の高さを式で表すと、`;
  const steps = [`底面積は ${$(`${T1(s1)}\\times ${T1(s2)}=${ptex(base)}`)}（cm²）`, `高さは、体積を底面積でわる。${$(`${ptex(vol)}\\div ${dp(ptex(base))}=\\frac{${ptex(vol)}}{${ptex(base)}}=${ptex(res)}`)}（cm）`];
  const hint = "直方体の体積は、(底面積)×(高さ)。まず、底面積を式で表そう。";
  if (mode === "num") return { q: `${head}${$(`\\square ${lettersTex(he)}`)} cm。□ にあてはまる数は？`, ans: ansQ(hc), hint, steps: [...steps, lastLine("□ にあてはまる数", hc)] };
  const wrongs = [pdivMono(vol, Mq(s1)), pdivMono(vol, Mq(s2)), Mq([Q(vc[0], s1[0] + s2[0]), he]), Mq([hc, ve])];     // 底面の一辺しかわらない／係数を和でわる／文字を約分し忘れる
  const { ans, choices } = polyChoices(r, res, wrongs);
  return { q: `${head}どれか。`, ans, choices, hint, steps };
};
const sideOfRect = (r, mode) => {
  const [u, v] = pick(r, LET2);
  const side = [r(2, 6), pick(r, [{ [v]: 1 }, { [u]: 1 }])];
  let other;
  for (;;) { other = [r(2, 7), pick(r, [{ [u]: 1 }, { [v]: 1 }, { [u]: 1, [v]: 1 }])]; if (keyOf(other[1]) !== keyOf(side[1])) break; }
  const area = pmul(Mq(side), Mq(other)), res = pdivMono(area, Mq(side)), [oc, oe] = parts(res), [ac, ae] = parts(area);
  const head = `面積が ${$(ptex(area))} cm²、縦が ${$(T1(side))} cm の長方形の、横の長さを式で表すと、`;
  const steps = ["横の長さ ＝ 面積 ÷ 縦", `${$(`${ptex(area)}\\div ${dp(T1(side))}=\\frac{${ptex(area)}}{${T1(side)}}=${ptex(res)}`)}（cm）`];
  const hint = "長方形の面積は、(縦)×(横)。横を求めるには、面積を縦でわる。";
  if (mode === "num") return { q: `${head}${$(`\\square ${lettersTex(oe)}`)} cm。□ にあてはまる数は？`, ans: ansQ(oc), hint, steps: [...steps, lastLine("□ にあてはまる数", oc)] };
  const wrongs = [Mq([oc, ae]), Mq([ac[0] - side[0], oe]), Mq([oc, addE(oe, side[1])]), Mq([Q(ac[0], 1), oe])];       // 文字を約分し忘れる／係数をひく／文字をたす／係数をわらない
  const { ans, choices } = polyChoices(r, res, wrongs);
  return { q: `${head}どれか。`, ans, choices, hint, steps };
};

// ── □ にあてはまる式（dr.7）────────────────────────────────
const blankBuild = (r, mode, form) => {
  const [u, v] = pick(r, LET2), c = (big) => pick(r, [1, -1]) * r(2, big || 6), cp = (big) => r(2, big || 6);
  let A, X, C, expr, steps, hint;
  if (form === "x") {           // A × □ = C
    A = [cp(), pick(r, [{ [u]: 1 }, { [u]: 1, [v]: 1 }, { [v]: 1 }])]; X = [c(), pick(r, [{ [v]: 1 }, { [u]: 1, [v]: 1 }, { [u]: 1 }])];
    C = parts(pmul(Mq(A), Mq(X))); C = [C[0], C[1]];
    expr = `${T1(A)}\\times\\square=${T1(C)}`;
    const sg = sgn(C[0][0]) < 0 ? "-" : "";
    steps = ["□ ＝ (積) ÷ (かけた式)", $(`\\square=${fT(C)}\\div ${dp(T1(A))}=${sg}\\frac{${mTex(absC(C[0][0]), C[1])}}{${mTex(A[0], A[1])}}=${T1(X)}`)];
    hint = "「(かけられる式)×□＝(積)」から、□ を求める計算を考えよう。";
  } else if (form === "d1") {   // □ ÷ A = C
    A = [cp(), pick(r, [{ [u]: 1 }, { [v]: 1 }])]; C = [c(), pick(r, [{ [u]: 1, [v]: 1 }, { [v]: 1 }, { [u]: 1 }])];
    X = parts(pmul(Mq(C), Mq(A))); X = [X[0], X[1]];
    expr = `\\square\\div ${T1(A)}=${T1(C)}`;
    steps = ["□ ＝ (商) × (わる式)", $(`\\square=${fT(C)}\\times ${T1(A)}=${T1(X)}`)];
    hint = "「□÷(わる式)＝(商)」から、□ を求める計算を考えよう。";
  } else {                      // A ÷ □ = C
    C = [c(), pick(r, [{ [u]: 1 }, { [v]: 1 }, { [u]: 1, [v]: 1 }])]; X = [c(), pick(r, [{ [u]: 1, [v]: 1 }, { [v]: 1 }, { [u]: 1 }])];
    A = parts(pmul(Mq(C), Mq(X))); A = [A[0], A[1]];
    expr = `${T1(A)}\\div\\square=${T1(C)}`;
    const sg = sgn(A[0][0]) * sgn(C[0]) < 0 ? "-" : "";
    steps = ["□ ＝ (わられる式) ÷ (商)", $(`\\square=${fT(A)}\\div ${dp(fT(C))}=${sg}\\frac{${mTex(absC(A[0][0]), A[1])}}{${mTex(absC(C[0]), C[1])}}=${T1(X)}`)];
    hint = "「(わられる式)÷□＝(商)」から、□ を求める計算を考えよう。";
  }
  const ans0 = Mq(X);
  const note = form === "d1" ? "（÷ のあとの式は、全体でわる）" : "";
  if (mode === "num") return { q: `${$(expr)} のとき、□ にあてはまる単項式の係数は？${note}`, ans: ansQ(parts(ans0)[0]), hint, steps: [...steps, lastLine("□ にあてはまる単項式の係数", parts(ans0)[0])] };
  const xc = X[0];
  const wrongs = form === "x"
    ? [pmul(Mq(A), Mq(C)), pdivMono(Mq(A), Mq(C)), pneg(ans0), Mq([xc, C[1]])]
    : form === "d1"
      ? [pdivMono(Mq(C), Mq(A)), Mq(C), pdivMono(Mq(A), Mq(C)), pneg(ans0)]
      : [pmul(Mq(A), Mq(C)), pdivMono(Mq(C), Mq(A)), Mq(A), pneg(ans0)];
  const { ans, choices } = polyChoices(r, ans0, wrongs);
  return { q: `${$(expr)} のとき、□ にあてはまる式はどれか。${note}`, ans, choices, hint, steps };
};

// ── 正しい計算とその理由を選ぶ（dr.8）─────────────────────────
// 問題のまちがった計算をなぞった文は、選択肢に入れない（「まちがいの説明」とも読めてしまうため）
const reasonBuild = (r, kind) => {
  const [u] = pick(r, LET2);
  const HINT = "累乗の意味にもどって、式を 1行ずつ書いて確かめよう。";
  if (kind === "pow") {
    const k = r(3, 7), neg = r(0, 1) === 1;      // k≠2：「指数 2 を係数にかける」と「2乗する」が同じ値にならないように
    const s = `${neg ? "-" : ""}${k}${u}`;
    const wrongRes = neg ? `-${k * k}${u}^{2}` : `${k}${u}^{2}`;
    const q = `次の計算は、まちがっている。${$(`(${s})^{2}=${wrongRes}`)} 正しい計算と、その理由を述べている文はどれか。`;
    const ans = neg
      ? `${$(`(${s})^{2}=(${s})\\times(${s})`)} だから、符号は + になり、${$(`${k * k}${u}^{2}`)} となる。`
      : `${$(`(${s})^{2}=${s}\\times ${s}`)} だから、係数の ${k} も 2回かけて、${$(`${k * k}${u}^{2}`)} となる。`;
    const wrongs = [
      `${$(`(${s})^{2}`)} は ${$(s)} を 2回たすことだから、${$(`${neg ? "-" : ""}${2 * k}${u}`)} となる。`,
      neg ? `${$(`-${k}`)} だけを 2乗するので、${$(`${k * k}${u}`)} となる。` : `係数の ${k} だけを 2乗するので、${$(`${k * k}${u}`)} となる。`,
      `指数の 2 を係数にかけて、${$(`${neg ? "(-" + k + ")" : k}\\times 2=${neg ? "-" : ""}${2 * k}`)} より、${$(`${neg ? "-" : ""}${2 * k}${u}^{2}`)} となる。`,
    ];
    return {
      q, ans, choices: choices4(r, ans, wrongs), hint: HINT,
      steps: [$(`(${s})^{2}=(${s})\\times(${s})=${k * k}${u}^{2}`), neg ? "− どうしのかけ算は + になる。係数も文字も 2回かける。" : "係数も文字も 2回かける。"],
    };
  }
  // 除法：a^m ÷ a で、指数が減らない
  let m, cd, cq, cc;
  do { m = r(2, 3); cd = r(2, 6); cq = r(2, 5); cc = cd * cq; } while (cd * (cq - 1) === cq);       // 「係数もひき算する」が、正しい答えと同じ値にならないように
  const um = (n) => (n === 1 ? u : `${u}^{${n}}`), wrongRes = `${cq}${um(m)}`;
  const q = `次の計算は、まちがっている。${$(`${cc}${um(m)}\\div ${cd}${u}=${wrongRes}`)}（÷ のあとの式は、全体でわる） 正しい計算と、その理由を述べている文はどれか。`;
  const ans = `${$(`\\frac{${cc}${um(m)}}{${cd}${u}}`)} を約分して、${$(`${um(m)}\\div ${u}=${um(m - 1)}`)} となるので、答えは ${$(`${cq}${um(m - 1)}`)}。`;
  const wrongs = [
    `${$(`${um(m)}\\div ${u}`)} は指数をたして ${$(um(m + 1))} になるので、答えは ${$(`${cq}${um(m + 1)}`)}。`,
    `${$(`${um(m)}\\div ${u}=1`)} となるので、答えは ${$(String(cq))}。`,
    `係数もひき算して ${$(`(${cc}-${cd})${um(m - 1)}`)} となるので、答えは ${$(`${cc - cd}${um(m - 1)}`)}。`,
  ];
  return {
    q, ans, choices: choices4(r, ans, wrongs), hint: "÷ の意味にもどって、式を 1行ずつ書いて確かめよう。",
    steps: [$(`${cc}${um(m)}\\div ${dp(`${cd}${u}`)}=\\frac{${cc}${um(m)}}{${cd}${u}}=${cq}${um(m - 1)}`), "約分すると、文字は指数が 1 へる。"],
  };
};

// ── 辺を何倍かにしたとき（dr.9）──────────────────────────────
/** 図形・立体と、その量（係数 c、π をふくむか、文字の指数 n）。寸法を k 倍すると、量は k^n 倍 */
const FIGS = [
  { sentence: (k) => `1辺が ${$("a")} cm の立方体がある。1辺を ${k}倍にすると、`, inv: (N, w) => `立方体の1辺を何倍かにしたら、${w}がもとの ${N}倍になった。1辺は、もとの何倍にしたか。`, v: "a", dim: "1辺",
    qs: [{ name: "表面積", c: [6, 1], pi: false, n: 2 }, { name: "体積", c: [1, 1], pi: false, n: 3 }, { name: "辺の長さの合計", c: [12, 1], pi: false, n: 1 }] },
  { sentence: (k) => `1辺が ${$("a")} cm の正方形がある。1辺を ${k}倍にすると、`, inv: (N, w) => `正方形の1辺を何倍かにしたら、${w}がもとの ${N}倍になった。1辺は、もとの何倍にしたか。`, v: "a", dim: "1辺",
    qs: [{ name: "面積", c: [1, 1], pi: false, n: 2 }, { name: "周の長さ", c: [4, 1], pi: false, n: 1 }] },
  { sentence: (k) => `半径が ${$("r")} cm の球がある。半径を ${k}倍にすると、`, inv: (N, w) => `球の半径を何倍かにしたら、${w}がもとの ${N}倍になった。半径は、もとの何倍にしたか。`, v: "r", dim: "半径",
    qs: [{ name: "表面積", c: [4, 1], pi: true, n: 2 }, { name: "体積", c: [4, 3], pi: true, n: 3 }] },
  { sentence: (k) => `半径が ${$("r")} cm の円がある。半径を ${k}倍にすると、`, inv: (N, w) => `円の半径を何倍かにしたら、${w}がもとの ${N}倍になった。半径は、もとの何倍にしたか。`, v: "r", dim: "半径",
    qs: [{ name: "面積", c: [1, 1], pi: true, n: 2 }, { name: "円周の長さ", c: [2, 1], pi: true, n: 1 }] },
];
/** 係数 c（Q）・π・文字 v の n 乗の TeX */
const figTex = (c, pi, v, n) => `${c[1] === 1 ? (c[0] === 1 ? "" : String(c[0])) : fracTex(c[0], c[1])}${pi ? "\\pi " : ""}${v}${n === 1 ? "" : `^{${n}}`}`;
const growBuild = (r, kind) => {
  if (kind === "fig") {
    const f = pick(r, FIGS), qd = pick(r, f.qs.filter((x) => x.n >= 2)), k = r(2, 9), ratio = k ** qd.n;       // 比が k 倍そのままになる量（周の長さなど）は、入試レベルにしない
    const base = figTex(qd.c, qd.pi, f.v, qd.n);
    const cNew = qmul(Q(qd.c[0], qd.c[1]), Q(ratio)), scaledVal = figTex(cNew, qd.pi, f.v, qd.n);
    const coef = qd.c[1] === 1 ? (qd.c[0] === 1 ? "" : `${qd.c[0]}`) : fracTex(qd.c[0], qd.c[1]);
    const scaledExpr = `${coef}${qd.pi ? "\\pi " : ""}${qd.n === 1 ? `${coef || qd.pi ? "\\times " : ""}${k}${f.v}` : `(${k}${f.v})^{${qd.n}}`}`;
    return {
      q: `${f.sentence(k)}${qd.name}は、もとの何倍になるか。`,
      ans: ratio,
      unit: "倍",
      hint: `${qd.name}を、$${f.v}$ を使った式で表して、${f.dim}が ${k}倍になったときの${qd.name}と、くらべよう。`,
      steps: [`${qd.name}は ${$(base)}。${f.dim}を ${k}倍すると ${$(`${scaledExpr}=${scaledVal}`)}。`, `${$(`${scaledVal}\\div ${dp(base)}=${ratio}`)}（倍）`],
    };
  }
  if (kind === "box") {
    const p = r(2, 6), q = r(2, 6), s = r(2, 6), which = pick(r, ["rect", "tri", "vol"]);
    const ratio = which === "vol" ? p * q * s : p * q;
    const q0 = which === "rect"
      ? `縦 ${$("a")} cm、横 ${$("b")} cm の長方形がある。縦を ${p}倍、横を ${q}倍にすると、面積は、もとの何倍になるか。`
      : which === "tri"
        ? `底辺 ${$("a")} cm、高さ ${$("h")} cm の三角形がある。底辺を ${p}倍、高さを ${q}倍にすると、面積は、もとの何倍になるか。`
        : `縦 ${$("a")} cm、横 ${$("b")} cm、高さ ${$("c")} cm の直方体がある。縦を ${p}倍、横を ${q}倍、高さを ${s}倍にすると、体積は、もとの何倍になるか。`;
    const steps = which === "rect"
      ? [`もとの面積は ${$("ab")}。新しい面積は ${$(`${p}a\\times ${q}b=${p * q}ab`)}。`, `${$(`${p * q}ab\\div ${dp("ab")}=${ratio}`)}（倍）`]
      : which === "tri"
        ? [`もとの面積は ${$("\\frac{ah}{2}")}。新しい面積は ${$(`\\frac{1}{2}\\times ${p}a\\times ${q}h=\\frac{${p * q}ah}{2}`)}。`, `${$(`\\frac{${p * q}ah}{2}\\div\\frac{ah}{2}=${ratio}`)}（倍）`]
        : [`もとの体積は ${$("abc")}。新しい体積は ${$(`${p}a\\times ${q}b\\times ${s}c=${p * q * s}abc`)}。`, `${$(`${p * q * s}abc\\div ${dp("abc")}=${ratio}`)}（倍）`];
    return { q: q0, ans: ratio, unit: "倍", hint: "もとの量を式で表し、新しい寸法で同じ量を式にして、くらべよう。", steps };
  }
  // 逆算：量が N 倍になった → 寸法は何倍か
  const cand = FIGS.flatMap((f) => f.qs.filter((x) => x.n >= 2).map((x) => [f, x])), [f, qd] = pick(r, cand), k = r(2, 9), N = k ** qd.n;
  return {
    q: f.inv(N, qd.name),
    ans: k,
    unit: "倍",
    hint: `${f.dim}を □ 倍にすると、${qd.name}は何倍になるか、式で表して考えよう。`,
    steps: [`${f.dim}を ${$("x")} 倍すると、${qd.name}は、もとの ${$(`x^{${qd.n}}`)} 倍になる。`, `${$(`x^{${qd.n}}=${N}`)} より ${$(`x=${k}`)}（倍）`],
  };
};

// ── かけるところを、わってしまった（dr.10・qz.5）─────────────────
const undoMonoBuild = (r, mode, o) => {
  const [u, v] = pick(r, LET2), modeX = o.onlyX || r(0, 1) === 0;       // modeX：かけるところを、まちがえてわった／でなければ、わるところを、まちがえてかけた
  const Bm = [(o.bneg && r(0, 1) ? -1 : 1) * r(2, o.bmax), pick(r, o.bexps ? o.bexps(u, v) : [{ [u]: 1, [v]: 1 }, { [u]: 1 }, { [v]: 1 }])];
  const Rm = [pick(r, [1, -1]) * r(2, o.cmax), pick(r, [{ [u]: 1 }, { [v]: 1 }, { [u]: 1, [v]: 1 }, { [u]: 2 }])];
  const B = Mq(Bm), bt = fT(Bm), bt0 = T1(Bm);
  let W, A, right, head, steps;
  if (modeX) {        // まちがえた答え W ＝ A ÷ B。 A ＝ W × B。正しい答え ＝ A × B
    W = Mq(Rm); A = pmul(W, B); right = pmul(A, B);
    head = `ある単項式に ${$(bt0)} をかけるところを、まちがえて ${$(bt0)} でわったので、答えが ${$(ptex(W))} になった。`;
    steps = [`ある単項式を ${$("A")} とすると、${$(`A\\div ${dp(bt)}=${ptex(W)}`)} より、${$(`A=${fT(parts(W))}\\times ${bt}=${ptex(A)}`)}。`, `正しい答えは、${$(`A\\times ${bt}=${fT(parts(A))}\\times ${bt}=${ptex(right)}`)}。`];
  } else {            // まちがえた答え W ＝ A × B。 A ＝ W ÷ B。正しい答え ＝ A ÷ B（R × B² ＝ W になるように R を決める）
    right = Mq(Rm); A = pmul(right, B); W = pmul(A, B);
    head = `ある単項式を ${$(bt0)} でわるところを、まちがえて ${$(bt0)} をかけたので、答えが ${$(ptex(W))} になった。`;
    steps = [`ある単項式を ${$("A")} とすると、${$(`A\\times ${bt}=${ptex(W)}`)} より、${$(`A=${fT(parts(W))}\\div ${dp(bt)}=${ptex(A)}`)}。`, `正しい答えは、${$(`A\\div ${dp(bt)}=${fT(parts(A))}\\div ${dp(bt)}=${ptex(right)}`)}。`];
  }
  const hint = "まちがえた計算を式で表して、ある単項式 $A$ を先に求めよう。";
  const [rc, re] = parts(right);
  if (mode === "num") {
    return r(0, 1) === 1
      ? { q: `${head}正しい答えの次数は？`, ans: degOf(re), hint, steps: [...steps, `正しい答えの次数は ${$(String(degOf(re)))}。`] }
      : { q: `${head}正しい答えの係数は？`, ans: ansQ(rc), hint, steps: [...steps, lastLine("正しい答えの係数", rc)] };
  }
  const wrongs = [A, W, pneg(right), Mq([rc, parts(A)[1]])];
  const { ans, choices } = polyChoices(r, right, wrongs);
  return { q: `${head}正しい答えはどれか。`, ans, choices, hint, steps };
};
const degOf = (e) => Object.values(e).reduce((a, b) => a + b, 0);

export const UNITS = [
  unit("04", {
    name: "単項式の乗法・除法",
    desc: "係数どうし・文字どうしをかける、分数の形にして約分する",
    prereqs: ["J2-sk03"],
    points: [
      "単項式どうしの乗法は、係数どうし、文字どうしをかける。$5x\\times 2y=10xy$。同じ文字のかけ算は指数で表す（$3x\\times(-6x)=-18x^2$）。累乗は、同じものをその回数かける（$(-5x)^2=(-5x)\\times(-5x)=25x^2$）。",
      "単項式どうしの除法は、わる式を分母にした分数にして約分する。$12ab\\div 4a=\\frac{12ab}{4a}=3b$。÷ のあとの式は、全体が分母になる。",
      "分数の係数でわるときは、逆数（分母と分子を入れかえた式。かけて 1 になる式）をかける。$8xy\\div\\frac{4y}{3}=8xy\\times\\frac{3}{4y}=6x$。",
    ],
    levels: {
      // ───────── 1 基礎 ─────────
      1: [
        // 04d01a 乗法（数の問い）
        t("04d01a", (r) => mulBuild(r, "num", { kinds: ["diff", "diff", "same"], cmax: 9 })),
        // 04d01b 乗法（4択）
        t("04d01b", (r) => mulBuild(r, "choice", { kinds: ["diff", "diff", "same"], cmax: 9 })),
        // 04d02a 累乗（数の問い）
        t("04d02a", (r) => powBuild(r, "num", { forms: ["plain", "neg", "outer"], cmax: 7 })),
        // 04d02b 累乗（4択）
        t("04d02b", (r) => powBuild(r, "choice", { forms: ["plain", "neg", "outer"], cmax: 7 })),
        // 04d03a 除法（数の問い）
        t("04d03a", (r) => divBuild(r, "num", { cmax: 9, negDiv: false })),
        // 04d03b 除法（4択）
        t("04d03b", (r) => divBuild(r, "choice", { cmax: 9, negDiv: false })),
        // 04q01a 7a×(−2b) など（小テスト・数の問い）
        t("04q01a", (r) => (r(0, 1) ? mulBuild(r, "num", { kinds: ["diff", "same"], cmax: 9 }) : powBuild(r, "num", { forms: ["neg", "plain"], cmax: 7 }))),
        // 04q01b 7a×(−2b) など（小テスト・4択）
        t("04q01b", (r) => (r(0, 1) ? mulBuild(r, "choice", { kinds: ["diff", "same"], cmax: 9 }) : powBuild(r, "choice", { forms: ["neg", "plain"], cmax: 7 }))),
        // 04q02a 24ab÷6a など（小テスト・数の問い）
        t("04q02a", (r) => divBuild(r, "num", { cmax: 9, negDiv: true })),
        // 04q02b 24ab÷6a など（小テスト・4択）
        t("04q02b", (r) => divBuild(r, "choice", { cmax: 9, negDiv: true })),
      ],
      // ───────── 2 標準 ─────────
      2: [
        // 04d04a 分数の係数の乗法（数の問い）
        t("04d04a", (r) => fmulBuild(r, "num", { mmax: 3, fneg: false })),
        // 04d04b 分数の係数の乗法（4択）
        t("04d04b", (r) => fmulBuild(r, "choice", { mmax: 3, fneg: true })),
        // 04d05a 分数の係数でわる（数の問い）
        t("04d05a", (r) => fdivBuild(r, "num", { mmax: 3, negDiv: true })),
        // 04d05b 分数の係数でわる（4択）
        t("04d05b", (r) => fdivBuild(r, "choice", { mmax: 3, negDiv: true })),
        // 04d06a 直方体の高さ（数の問い）
        t("04d06a", (r) => boxHeight(r, "num")),
        // 04d06b 直方体の高さ（4択）
        t("04d06b", (r) => boxHeight(r, "choice")),
        // 04q03a 9ab÷(3/4 b)（小テスト・数の問い）
        t("04q03a", (r) => fdivBuild(r, "num", { mmax: 3, negDiv: false })),
        // 04q03b 9ab÷(3/4 b)（小テスト・4択）
        t("04q03b", (r) => fdivBuild(r, "choice", { mmax: 3, negDiv: false })),
        // 04q04a 長方形の横の長さ（小テスト・数の問い）
        t("04q04a", (r) => sideOfRect(r, "num")),
        // 04q04b 長方形の横の長さ（小テスト・4択）
        t("04q04b", (r) => sideOfRect(r, "choice")),
      ],
      // ───────── 3 応用 ─────────
      3: [
        // 04d07a 4xy×□＝12x²y² 型（4択）
        t("04d07a", (r) => blankBuild(r, "choice", "x")),
        // 04d07b □÷3a＝−5ab 型（4択）
        t("04d07b", (r) => blankBuild(r, "choice", "d1")),
        // 04d07c 24x²y÷□＝−6x 型（4択）
        t("04d07c", (r) => blankBuild(r, "choice", "d2")),
        // 04d07d □の係数を聞く（3つの型）
        t("04d07d", (r) => blankBuild(r, "num", pick(r, ["x", "d1", "d2"]))),
        // 04d08a 累乗のまちがいの理由を選ぶ
        t("04d08a", (r) => reasonBuild(r, "pow")),
        // 04d08b 除法のまちがいの理由を選ぶ
        t("04d08b", (r) => reasonBuild(r, "div")),
      ],
      // ───────── 4 入試レベル ─────────
      4: [
        // 04d09a 図形・立体の寸法を何倍かにしたとき（表面積・体積・面積・周の長さ）
        t("04d09a", (r) => growBuild(r, "fig")),
        // 04d09b 縦・横・高さ（底辺・高さ）を、それぞれ何倍かにしたとき
        t("04d09b", (r) => growBuild(r, "box")),
        // 04d09c 面積・表面積・体積が何倍になったか → 寸法は何倍か
        t("04d09c", (r) => growBuild(r, "inverse")),
        // 04d10a かけるところを、まちがえてわった（4択）
        t("04d10a", (r) => undoMonoBuild(r, "choice", { cmax: 4, bmax: 3, bneg: true })),
        // 04d10b かけるところを、まちがえてわった（係数・次数）
        t("04d10b", (r) => undoMonoBuild(r, "num", { cmax: 4, bmax: 3, bneg: true })),
        // 04q05a チャレンジ：かけるところを、まちがえてわった（4択）
        t("04q05a", (r) => undoMonoBuild(r, "choice", { cmax: 4, bmax: 3, onlyX: true, bexps: (u, v) => [{ [u]: 1 }, { [v]: 1 }] })),
        // 04q05b チャレンジ：かけるところを、まちがえてわった（係数・次数）
        t("04q05b", (r) => undoMonoBuild(r, "num", { cmax: 4, bmax: 3, onlyX: true, bexps: (u, v) => [{ [u]: 1 }, { [v]: 1 }] })),
      ],
    },
  }),
];

// 移さなかった問題
export const SKIPPED = [];   // 第4時は、演習プリント 10問・小テスト 5問のすべてを移した
