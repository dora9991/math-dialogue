// ============================================================
// ichiji-01.js — 一次関数 第1時「比例に似ているけれど、比例ではない関係を調べよう」（関数・一次関数・1次式・定数）
//   ikkan の演習プリント（ichiji-01.dr.1〜8）・小テスト（ichiji-01.qz.1〜5）を、コツコツくんのテンプレートにしたもの。
//   テンプレート id＝「01」＋ d（演習）／q（小テスト）＋ ikkan の問題の番号（＋ 小問・型ごとに a, b…）。例：01d05b ＝ ichiji-01.dr.5 の②
//   場面の式は、はじめの量 b と 1 ふえるごとの量 a から linear.js の直線 line(a, b) をつくって、ltex で TeX にする（手で書かない）。
//   「式を表す」は入力欄で打てないので、(a) ありがちな誤答（切片と傾きの入れかえ・符号まちがい など）をならべた4択、(b) 式から出る数（x のときの y・x の値）、にした。
//   「一次関数かどうか」は、場面や式をならべて「一次関数であるものを選ぶ」4択、または「いくつあるか」の数にした。
//   「表を完成させる」は、x のときの y の値を聞く問題、「わけも書こう」は、比例している表を選ぶ4択にした。
//   図（マッチ棒）は出せないので、1個・2個・3個のときの本数を文で言う。
// ============================================================
import { t, pick, choices4, shuffle, sample, rnz } from "../kit.js";
import { unitFor } from "../unit-kit.js";
import { Q, qadd, qiszero, qeq, qmul, qdiv } from "../algebra.js";
import { line, onLine, yAt, xAt, meet, ltex, qt, num } from "../linear.js";

const unit = unitFor("ichiji");

// ── 道具（この授業の問題用に足した小さな関数）──────────────────────────
const $ = (s) => `$${s}$`;
const L = (l) => $(ltex(l));
/** 係数つきの x の項：axt(3) → 3x、axt(1) → x、axt(-1) → -x */
const axt = (a) => ltex(line(a, 0)).slice(2);
/** 直線 l に x を入れた計算と値の TeX：2\times 3-7=-1 */
const subTex = (l, x) => {
  const xv = Array.isArray(x) ? x : [x, 1], xs = qt(xv), xp = xv[0] < 0 ? `(${xs})` : xs;
  const s = xv[0] === 0 && Math.abs(l.a[0]) === 1 && l.a[1] === 1 ? "0" : l.a[0] === 1 && l.a[1] === 1 ? xs : l.a[0] === -1 && l.a[1] === 1 ? `-${xp}` : `${qt(l.a)}\\times ${xp}`;
  const b = qiszero(l.b) ? "" : `${l.b[0] < 0 ? "-" : "+"}${qt([Math.abs(l.b[0]), l.b[1]])}`;
  return `${s}${b}=${qt(yAt(l, xv))}`;
};
/** 直線 l で y が y0 になる x を求める途中式（TeX の配列）：["10=3x-5", "3x=15", "x=5"] */
const solveTex = (l, y0) => {
  const out = [`${y0}=${ltex(l).slice(2)}`];
  if (!qiszero(l.b)) out.push(`${axt(l.a)}=${qt(qadd([y0, 1], [-l.b[0], l.b[1]]))}`);
  if (!(l.a[0] === 1 && l.a[1] === 1)) out.push(`x=${qt(xAt(l, y0))}`);
  return out;
};
const solveLine = (l, y0) => solveTex(l, y0).map($).join("、");

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

// ── 「はじめの量 b から、1 ふえるごとに a ふえる」場面 ─────────────────────
const NAMES = ["まい", "そうた", "ゆう", "りく", "あおい", "はると"];
const FOOD = ["りんご", "パン", "おにぎり", "クッキー", "プリン"];
/** setup＝場面の説明、when(Y)＝y が Y になるときを聞く文、xr＝x の範囲、yU＝y の単位、xU＝x の単位 */
const GROW = {
  book: (r) => { const a = r(2, 5), b = r(4, 12); return { a, b, xr: [3, 12], yU: "cm", xU: "冊", setup: `高さ ${b} cm の台の上に、厚さ ${a} cm の本を $x$ 冊積み重ねる。全体の高さを $y$ cm とする`, when: (Y) => `全体の高さが ${Y} cm になるのは、本を何冊積み重ねたときか` }; },
  tank: (r) => { const a = r(2, 8), b = r(5, 30); return { a, b, xr: [3, 15], yU: "L", xU: "分後", setup: `水そうに水が ${b} L 入っている。ここに、毎分 ${a} L ずつ水を入れる。$x$ 分後の水そうの水の量を $y$ L とする`, when: (Y) => `水そうの水の量が ${Y} L になるのは、水を入れはじめて何分後か` }; },
  spring: (r) => { const a = r(1, 4), b = r(8, 20); return { a, b, xr: [2, 10], yU: "cm", xU: "個", setup: `自然の長さが ${b} cm のばねがある。おもりを 1個つるすごとに、ばねは ${a} cm ずつのびる。おもりを $x$ 個つるしたときのばねの長さを $y$ cm とする`, when: (Y) => `ばねの長さが ${Y} cm になるのは、おもりを何個つるしたときか` }; },
  temp: (r) => { const a = r(1, 2), b = r(6, 14); return { a, b, xr: [2, 8], yU: "℃", xU: "時間後", setup: `朝 6時の気温は ${b}℃ だった。その後、1時間に ${a}℃ ずつ上がった。6時から $x$ 時間後の気温を $y$℃ とする`, when: (Y) => `気温が ${Y}℃ になるのは、6時から何時間後か` }; },
  bank: (r) => { const a = pick(r, [10, 20, 30, 40, 50, 60, 80]), b = r(2, 18) * 50, nm = pick(r, NAMES); return { a, b, xr: [4, 20], yU: "円", xU: "日後", setup: `${nm}さんの貯金箱には、${b} 円入っている。ここに、毎日 ${a} 円ずつ入れていく。$x$ 日後の貯金箱の金額を $y$ 円とする`, when: (Y) => `貯金箱の金額が ${Y} 円になるのは、何日後か` }; },
  walk: (r) => { const a = pick(r, [50, 60, 70, 80, 90]), b = pick(r, [100, 150, 200, 250, 300, 400]), nm = pick(r, NAMES); return { a, b, xr: [4, 20], yU: "m", xU: "分後", setup: `${nm}さんは、家から ${b} m はなれた地点を通ってから、分速 ${a} m で、家からはなれる向きに同じ道をまっすぐ歩き続けた。この地点を通ってから $x$ 分後の、家からの道のりを $y$ m とする`, when: (Y) => `家からの道のりが ${Y} m になるのは、この地点を通ってから何分後か` }; },
  shop: (r) => { const a = pick(r, [80, 90, 100, 110, 120, 150, 180, 200]), b = pick(r, [100, 120, 150, 180, 200]), it = pick(r, FOOD); return { a, b, xr: [2, 9], yU: "円", xU: "個", setup: `1個 ${a} 円の${it}を $x$ 個と、${b} 円の飲み物を 1本買う。代金の合計を $y$ 円とする`, when: (Y) => `代金の合計が ${Y} 円になるのは、${it}を何個買ったときか` }; },
};
const grow = (r, keys) => GROW[pick(r, keys)](r);
/** はじめ b、1ふえるごとに a の場面の「式を選ぶ」ありがちな誤答（切片と傾きの入れかえ・符号・たし算の混同） */
/** はじめ b、1ふえるごとに a の場面の「式を選ぶ」ありがちな誤答（傾きと切片の入れかえ・合計・符号・はじめの量を忘れる）：[誤った傾き, 誤った切片, 条件の点] */
const growWrongs = (a, b) => [[b, a + b, -a], [a, -b, 0], [[0, b], [1, a + b]]];
const growHint = "はじめの量（$x$ が 0 のとき）と、$x$ が 1 ふえるごとにふえる量は、式のどの部分になるかな？";

// ── 場面を式に表す・一次関数かどうか（01d02）──────────────────────────
/** 場面の生成：{ text, short（何の量か）, eq（y＝…の TeX） } */
const SCENE = {
  lin: [
    (r) => { const a = pick(r, [50, 60, 80, 90, 100, 120, 150]), b = pick(r, [100, 120, 150, 200]); return { short: "代金", text: `1個 ${a} 円の${pick(r, FOOD)}を $x$ 個と、${b} 円の箱 1つを買ったときの、代金 $y$ 円`, eq: ltex(line(a, b)) }; },
    (r) => { const a = r(2, 8), b = r(5, 30); return { short: "水の量", text: `${b} L の水が入った水そうに、毎分 ${a} L ずつ水を入れるとき、$x$ 分後の水の量 $y$ L`, eq: ltex(line(a, b)) }; },
    (r) => { const a = pick(r, [50, 60, 80, 100, 120]), P = pick(r, [500, 600, 800, 1000]); return { short: "おつり", text: `${P} 円を持って、1個 ${a} 円の${pick(r, FOOD)}を $x$ 個買ったときの、おつり $y$ 円`, eq: ltex(line(-a, P)) }; },
    (r) => { const s = r(6, 18); return { short: "横の長さ", text: `周の長さが ${2 * s} cm の長方形の、縦の長さ $x$ cm と、横の長さ $y$ cm`, eq: ltex(line(-1, s)) }; },
  ],
  prop: [
    (r) => { const n = pick(r, [3, 4, 5, 6, 8]); return { short: "周の長さ", text: `1辺が $x$ cm の${n === 4 ? "正方形" : `正${KAN[n]}角形`}の、周の長さ $y$ cm`, eq: ltex(line(n, 0)) }; },
    (r) => { const a = pick(r, [50, 60, 80, 90, 100, 120]); return { short: "代金", text: `1個 ${a} 円の${pick(r, FOOD)}を $x$ 個買ったときの、代金 $y$ 円`, eq: ltex(line(a, 0)) }; },
    (r) => { const h = pick(r, [5, 6, 7, 8, 9, 10, 12]); return { short: "面積", text: `底辺が $x$ cm、高さが ${h} cm の三角形の、面積 $y$ cm²`, eq: ltex(line(Q(h, 2), 0)) }; },
    (r) => { const a = pick(r, [50, 60, 70, 80, 90]); return { short: "道のり", text: `分速 ${a} m で $x$ 分間歩いたときの、道のり $y$ m`, eq: ltex(line(a, 0)) }; },
  ],
  inv: [
    (r) => { const S = pick(r, [12, 18, 24, 36]); return { short: "横の長さ", text: `面積が ${S} cm² の長方形の、縦の長さ $x$ cm と、横の長さ $y$ cm`, eq: `y=\\frac{${S}}{x}` }; },
    (r) => { const D = pick(r, [24, 30, 36, 48, 60]); return { short: "かかる時間", text: `${D} km の道のりを、時速 $x$ km で進むときにかかる時間 $y$ 時間`, eq: `y=\\frac{${D}}{x}` }; },
    (r) => { const V = pick(r, [12, 18, 24, 30]); return { short: "1人分の水の量", text: `${V} L の水を、$x$ 人で等しく分けるときの、1人分の水の量 $y$ L`, eq: `y=\\frac{${V}}{x}` }; },
  ],
  sq: [
    () => ({ short: "正方形の面積", text: "1辺が $x$ cm の正方形の、面積 $y$ cm²", eq: "y=x^2" }),
    () => ({ short: "立方体の体積", text: "1辺が $x$ cm の立方体の、体積 $y$ cm³", eq: "y=x^3" }),
    (r) => { const h = r(3, 9); return { short: "四角柱の体積", text: `底面が 1辺 $x$ cm の正方形で、高さが ${h} cm の四角柱の、体積 $y$ cm³`, eq: `y=${h}x^2` }; },
    (r) => { const k = r(2, 6); return { short: "長方形の面積", text: `縦が $x$ cm、横が $(x+${k})$ cm の長方形の、面積 $y$ cm²`, eq: `y=x^2+${k}x` }; },
  ],
};
const KAN = { 3: "三", 4: "四", 5: "五", 6: "六", 8: "八" };
const WHY_NOT = "$y=ax+b$ の形ではない";

// ── 式のいろいろ（01d06・01q02）──────────────────────────────────
/** 一次関数の式：{ tex, prop（比例か） } */
const linExpr = (r, kind) => {
  const a = rnz(r, -6, 6), b = rnz(r, -9, 9);
  if (kind === "std") return { tex: ltex(line(a, b)), prop: false };
  if (kind === "rev") return { tex: `y=${b}${a < 0 ? "-" : "+"}${axt(Math.abs(a))}`, prop: false };
  if (kind === "prop") return { tex: ltex(line(a, 0)), prop: true };
  if (kind === "fprop") return { tex: `y=${pick(r, [1, -1]) < 0 ? "-" : ""}\\frac{x}{${r(2, 6)}}`, prop: true };
  return { tex: ltex(line(Q(pick(r, [1, -1]), r(2, 5)), b)), prop: false };      // fstd：y=\frac{1}{2}x+3
};
/** 一次関数でない式：{ tex, why } */
const nonExpr = (r, kind) => {
  const k = r(2, 12), c = r(1, 9);
  if (kind === "inv") return { tex: `y=${pick(r, [1, -1]) < 0 ? "-" : ""}\\frac{${k}}{x}`, why: "分母に $x$ がある" };
  if (kind === "invc") return { tex: `y=\\frac{${k}}{x}${pick(r, ["+", "-"])}${c}`, why: "分母に $x$ がある" };
  if (kind === "sqc") return { tex: `y=x^2${pick(r, ["+", "-"])}${c}`, why: "$x^2$ がある" };
  return { tex: `y=${r(2, 5)}x^2`, why: "$x^2$ がある" };
};
const LIN_KINDS = ["std", "rev", "prop", "fprop", "fstd"];
const NON_KINDS = ["inv", "invc", "sqc", "sq"];
/** 重複しない式を n 個（kinds からランダムに） */
const distinct = (r, n, make, kinds) => {
  const out = [], seen = new Set();
  for (let i = 0; i < 200 && out.length < n; i++) {
    const e = make(r, pick(r, kinds));
    if (seen.has(e.tex)) continue;
    seen.add(e.tex); out.push(e);
  }
  return out;
};

// ── 2つの量が同じになる場面（01d08・01q05）──────────────────────────
/** b1 > b2、a1 < a2 で、x0 のとき同じ量になる（meet で確かめる） */
const catchUp = (r, { a1s, ds, b2s, xr }) => {
  const a1 = pick(r, a1s), d = pick(r, ds), a2 = a1 + d, x0 = r(xr[0], xr[1]), b2 = pick(r, b2s), b1 = b2 + d * x0;
  const l1 = line(a1, b1), l2 = line(a2, b2), m = meet(l1, l2);
  if (!m || m[0][1] !== 1 || m[0][0] !== x0 || m[1][1] !== 1 || m[1][0] !== a1 * x0 + b1) throw new Error("交点が合わない");
  return { a1, a2, b1, b2, x0, v: m[1][0], l1, l2 };
};
const catchSteps = (c, n1, n2, askValue, u = "") => {
  const z = (l) => ltex(l).replace(/^y/, "z");
  const s = [
    `${n1}は ${$(ltex(c.l1))}、${n2}は ${$(z(c.l2))} と表せる。`,
    `同じになるのは $y=z$ のときだから、${$(`${ltex(c.l1).slice(2)}=${z(c.l2).slice(2)}`)}。`,
    `${$(`${axt(c.a1 - c.a2)}=${c.b2 - c.b1}`)} より ${$(`x=${c.x0}`)}。`,
  ];
  if (askValue) s.push(`${$(`y=${subTex(c.l1, c.x0)}`)}${u ? `（${u}）` : ""}。`);
  return s;
};

export const UNITS = [
  unit("01", {
    name: "一次関数の意味（比例とのちがい）",
    desc: "比例に似ているけれど、比例ではない関係を、式で調べる",
    prereqs: ["J2-rk13", "J1-h1"],
    points: [
      "$x$ の値を決めると、$y$ の値がただ 1つに決まるとき、$y$ は $x$ の関数であるという。",
      "$y$ が $x$ の 1次式 $y=ax+b$（$a$、$b$ は定数で、$a$ は 0 でない）で表されるとき、$y$ は $x$ の一次関数であるという。例：$y=70x+200$。",
      "$b=0$ のとき、$y=ax$ は比例で、一次関数にふくまれる。$y=\\frac{24}{x}$（反比例）や $y=x^2$ は、$y=ax+b$ の形ではないので、一次関数ではない。",
    ],
    levels: {
      // ───────── 1 基礎 ─────────
      1: [
        // 01d01a 演習（1）台の上に本を積む → y を x の式で表す（4択）
        t("01d01a", (r) => {
          const c = grow(r, ["book", "tank", "spring", "temp", "shop"]), right = line(c.a, c.b);
          const { ans, choices } = gridChoices(r, right, ...growWrongs(c.a, c.b));
          return {
            q: `${c.setup}。$y$ を $x$ の式で表すと？`,
            ans,
            choices,
            hint: growHint,
            steps: [`$x$ が 1 ふえるごとに ${c.a} ふえるので、$x$ で決まる部分は ${$(axt(c.a))}。`, `これに、はじめの量 ${c.b} をたして、${L(right)}。`],
          };
        }),
        // 01d01b 演習（1）③ x のときの y の値
        t("01d01b", (r) => {
          const c = grow(r, ["book", "tank", "spring", "temp", "shop"]), right = line(c.a, c.b), k = r(c.xr[0], c.xr[1]);
          return {
            q: `${c.setup}。$x=${k}$ のときの $y$ の値は？`,
            ans: num(yAt(right, k)),
            unit: c.yU,
            hint: "$x$ が 1 ふえるごとに、$y$ はいくつふえるかな？ はじめの量はいくつだったかな？",
            steps: [`$x$ が 1 ふえるごとに ${c.a} ふえ、はじめが ${c.b} だから、${L(right)}。`, `$x=${k}$ を代入して、${$(`y=${subTex(right, k)}`)}。`],
          };
        }),
        // 01d02a 演習（2）場面のうち、一次関数であるものを選ぶ
        t("01d02a", (r) => {
          const good = pick(r, SCENE.lin)(r), bad = sample(r, [...SCENE.inv, ...SCENE.sq], 3).map((f) => f(r));
          const ans = good.text;
          return {
            q: "次の場面のうち、$y$ が $x$ の一次関数であるものはどれか。",
            ans,
            choices: choices4(r, ans, bad.map((s) => s.text)),
            hint: "それぞれの場面で、$y$ を $x$ の式で表すと、どうなるかな？ $y=ax+b$ の形になるかな？",
            steps: [`${good.short}は ${$(good.eq)}。$y=ax+b$ の形だから、一次関数。`, `${bad.map((s) => `${s.short}は ${$(s.eq)}`).join("、")}。これらは ${WHY_NOT}。`],
          };
        }),
        // 01d02b 演習（2）場面のうち、一次関数でないものを選ぶ
        t("01d02b", (r) => {
          const bad = pick(r, [...SCENE.inv, ...SCENE.sq])(r), l1 = pick(r, SCENE.lin), rest = [...SCENE.lin.filter((f) => f !== l1), ...SCENE.prop];
          const good = [l1, ...sample(r, rest, 2)].map((f) => f(r));
          const ans = bad.text;
          return {
            q: "次の場面のうち、$y$ が $x$ の一次関数ではないものはどれか。（比例は、一次関数にふくまれる。）",
            ans,
            choices: choices4(r, ans, good.map((s) => s.text)),
            hint: "それぞれの場面で、$y$ を $x$ の式で表すと、どうなるかな？ $y=ax+b$ の形にならないものは、どれかな？",
            steps: [`${bad.short}は ${$(bad.eq)}。${WHY_NOT}ので、一次関数ではない。`, `${good.map((s) => `${s.short}は ${$(s.eq)}`).join("、")}。これらは $y=ax+b$ の形だから、一次関数。`],
          };
        }),
        // 01q01 小テスト（1）貯金箱 → y を x の式で表す（4択）
        t("01q01", (r) => {
          const c = grow(r, ["bank", "walk", "shop", "tank"]), right = line(c.a, c.b);
          const { ans, choices } = gridChoices(r, right, ...growWrongs(c.a, c.b));
          return {
            q: `${c.setup}。$y$ を $x$ の式で表すと？`,
            ans,
            choices,
            hint: growHint,
            steps: [`$x$ が 1 ふえるごとに ${c.a} ふえるので、$x$ で決まる部分は ${$(axt(c.a))}。`, `これに、はじめの量 ${c.b} をたして、${L(right)}。`],
          };
        }),
        // 01q02 小テスト（2）4つの式のうち、一次関数であるもの（1つ）
        t("01q02", (r) => {
          const good = distinct(r, 1, linExpr, ["std", "prop", "fprop", "rev"])[0], bad = distinct(r, 3, nonExpr, NON_KINDS);
          const ans = $(good.tex);
          return {
            q: "次の 4つの式のうち、$y$ が $x$ の一次関数であるものはどれか。",
            ans,
            choices: choices4(r, ans, bad.map((e) => $(e.tex))),
            hint: "$y=ax+b$ の形になっているかな？ 分母に $x$ があったり、$x^2$ があったりしないかな？",
            steps: [good.prop ? `${ans} は $y=ax+b$ で $b=0$ の場合（比例）だから、一次関数。` : `${ans} は $y=ax+b$ の形だから、一次関数。`, "ほかの 3つは、分母に $x$ がある式か、$x^2$ をふくむ式なので、一次関数ではない。"],
          };
        }),
      ],
      // ───────── 2 標準 ─────────
      2: [
        // 01d03a 演習（3）① おつり → 式（4択）
        t("01d03a", (r) => {
          const a = pick(r, [50, 60, 80, 90, 100, 120, 150]), P = pick(r, [500, 600, 800, 1000, 1500]), it = pick(r, FOOD), right = line(-a, P);
          const { ans, choices } = gridChoices(r, right, [a, -P, P], [-P, a, 0], [[0, P], [1, P - a]]);
          return {
            q: `${P} 円を持って、1個 ${a} 円の${it}を $x$ 個買ったときの、おつりを $y$ 円とする。$y$ を $x$ の式で表すと？`,
            ans,
            choices,
            hint: "$x$ 個買うと、代金はいくらかな？ おつりは、持っているお金から何をひいたものかな？",
            steps: [`代金は ${$(axt(a))} 円。おつりは、持っているお金から代金をひいたものだから、${$(`y=${P}-${axt(a)}`)}。`, `$x$ の項を先に書いて、${L(right)}。`],
          };
        }),
        // 01d03b 演習（3）② 周の長さが一定の長方形 → 式（4択）
        t("01d03b", (r) => {
          const s = r(5, 24), right = line(-1, s), v = r(0, 3), [X, Y] = v % 2 === 0 ? ["縦", "横"] : ["横", "縦"];
          const { ans, choices } = gridChoices(r, right, [1, -2, 2], [2 * s, -s, -2 * s], [[0, s], [s, 0]]);
          return {
            q: `${v < 2 ? `周の長さが ${2 * s} cm の長方形の、${X}の長さを $x$ cm、${Y}の長さを $y$ cm とする` : `長さ ${2 * s} cm のひもを、余らないように折り曲げて、長方形をつくる。${X}の長さを $x$ cm、${Y}の長さを $y$ cm とする`}。$y$ を $x$ の式で表すと？`,
            ans,
            choices,
            hint: "長方形の周の長さは、縦と横を使ってどう表せるかな？",
            steps: [v < 2 ? "長方形の周の長さは $2(x+y)$ cm。" : "ひもの長さは、長方形の周の長さに等しく、$2(x+y)$ cm。", `${$(`2(x+y)=${2 * s}`)} より ${$(`x+y=${s}`)}。`, `$y$ について解いて、${L(right)}。`],
          };
        }),
        // 01d03c 演習（3）③ 三角形などの面積の式の x の係数
        t("01d03c", (r) => {
          const h = r(4, 25);
          const shape = pick(r, [
            { q: `底辺が $x$ cm、高さが ${h} cm の三角形の面積を $y$ cm² とする`, f: Q(h, 2), why: "三角形の面積は、$\\frac{1}{2}\\times$（底辺）$\\times$（高さ）" },
            { q: `一方の対角線が $x$ cm、もう一方の対角線が ${h} cm のひし形の面積を $y$ cm² とする`, f: Q(h, 2), why: "ひし形の面積は、$\\frac{1}{2}\\times$（対角線）$\\times$（対角線）" },
            { q: `底辺が $x$ cm、高さが ${h} cm の平行四辺形の面積を $y$ cm² とする`, f: Q(h), why: "平行四辺形の面積は、（底辺）$\\times$（高さ）" },
          ]);
          const l = line(shape.f, 0);
          return {
            q: `${shape.q}。$y$ を $x$ の式で表したとき、$x$ の係数は？`,
            ans: num(shape.f),
            hint: "この図形の面積は、どんな公式で求めたかな？ $x$ にかけられている数は？",
            steps: [`${shape.why}。`, `${$(`y=${ltex(l).slice(2)}`)} と表せる（$y=ax+b$ の $b=0$ の場合）。`, `$x$ の係数は ${$(qt(shape.f))}。`],
          };
        }),
        // 01d04 演習（4）式が与えられた場面で、y の値から x を求める
        t("01d04", (r) => {
          const c = grow(r, ["walk", "bank", "shop", "tank", "temp"]), l = line(c.a, c.b), k = r(c.xr[0], c.xr[1]), Y = c.a * k + c.b;
          return {
            q: `${c.setup}と、${$(ltex(l))} と表せる。${c.when(Y)}。`,
            ans: k,
            unit: c.xU,
            hint: "知りたいのは、$y$ が決まった値のときの $x$。式の $y$ に、その値を入れるとどうなるかな？",
            steps: [`${$(`y=${Y}`)} を代入して、${solveLine(l, Y)}。`, `答えは ${k}${c.xU}。`],
          };
        }),
        // 01q03 小テスト（3）比例している表を選ぶ
        t("01q03", (r) => {
          const xs = [1, 2, 3, 4], a = r(2, 6), tabs = [];
          const seen = new Set([a * 1 + "," + 0]);
          while (tabs.length < 3) {
            const a2 = r(1, 6), b2 = pick(r, [-4, -3, -2, -1, 1, 2, 3, 5, 7, 9]), key = a2 + "," + b2;
            if (seen.has(key) || a2 * 1 + b2 <= 0) continue;
            seen.add(key); tabs.push([a2, b2]);
          }
          const tab = (ys) => `$x=${xs.join(",\\ ")}$ のとき $y=${ys.join(",\\ ")}$`;
          const ans = tab(xs.map((x) => a * x));
          return {
            q: "$x$ の値が 1、2、3、4 のとき、$y$ の値が次のようになる表がある。$y$ が $x$ に比例しているといえるのは、どれか。",
            ans,
            choices: choices4(r, ans, tabs.map(([a2, b2]) => tab(xs.map((x) => a2 * x + b2)))),
            hint: "比例のとき、$x$ が 2倍、3倍になると、$y$ はどうなるかな？",
            steps: ["比例なら、$x$ が 2倍、3倍、…になると、$y$ も 2倍、3倍、…になる。", `「${ans}」の表は、$y$ がいつも $x$ の ${a} 倍になっているので、比例している。`, "ほかの表は、$x$ が 1 から 2 に 2倍になっても、$y$ が 2倍にならないので、比例していない。"],
          };
        }),
        // 01q04 小テスト（4）y が決まった値になるのは、x がいくつのとき（式は自分で立てる）
        t("01q04", (r) => {
          const c = grow(r, ["bank", "tank", "spring", "temp", "book"]), l = line(c.a, c.b), k = r(c.xr[0], c.xr[1]), Y = c.a * k + c.b;
          return {
            q: `${c.setup}。${c.when(Y)}。`,
            ans: k,
            unit: c.xU,
            hint: "$y$ は $x$ の式でどう表せるかな？ はじめの量と、$x$ が 1 ふえるごとにふえる量は？",
            steps: [`$y$ を $x$ の式で表すと ${L(l)}。`, `${$(`y=${Y}`)} を代入して、${solveLine(l, Y)}。`, `答えは ${k}${c.xU}。`],
          };
        }),
      ],
      // ───────── 3 応用 ─────────
      3: [
        // 01d05a 演習（5）① マッチ棒 → 式（4択）
        t("01d05a", (r) => {
          const m = matches(r), right = line(m.a, m.b);
          const { ans, choices } = gridChoices(r, right, [m.c1, m.a + 1, m.a - 1], [0, m.c1, m.a], [[1, m.c1], [2, 2 * m.a + m.b], [3, 3 * m.a + m.b]]);
          return {
            q: `${m.q}$y$ を $x$ の式で表すと？`,
            ans,
            choices,
            hint: `1${m.u}ふえるごとに、本数はいくつふえているかな？ 1${m.u}のときの本数は、式のどの部分と合うかな？`,
            steps: [`1${m.u}ふえるごとに ${m.a} 本ふえるので、${$(axt(m.a))} の部分がふえる分。`, `$x=1$ のとき ${$(axt(m.a))} は ${m.a} だから、${m.c1} 本にするには ${m.b} 本たして、${L(right)}。`],
          };
        }),
        // 01d05b 演習（5）② 20個つくるときの本数
        t("01d05b", (r) => {
          const m = matches(r), right = line(m.a, m.b), k = r(10, 30);
          return {
            q: `${m.q}${m.make(k)}ときの、本数は？`,
            ans: num(yAt(right, k)),
            unit: "本",
            hint: `1${m.u}ふえるごとに、本数はいくつふえるかな？ $y$ は $x$ の式でどう表せるかな？`,
            steps: [`1${m.u}ふえるごとに ${m.a} 本ふえ、1${m.u}のとき ${m.c1} 本だから、${L(right)}。`, `$x=${k}$ を代入して、${$(`y=${subTex(right, k)}`)}（本）。`],
          };
        }),
        // 01d05c 演習（5）③ 本数から個数を求める
        t("01d05c", (r) => {
          const m = matches(r), right = line(m.a, m.b), k = r(8, 30), Y = m.a * k + m.b;
          return {
            q: `${m.q}${m.stick}が ${Y}本あるとき、すべて使うと、${m.ask}。`,
            ans: k,
            unit: m.u,
            hint: "$y$ は $x$ の式でどう表せるかな？ 本数が $y$ のとき、$x$ はどうやって求められるかな？",
            steps: [`1${m.u}ふえるごとに ${m.a} 本ふえ、1${m.u}のとき ${m.c1} 本だから、${L(right)}。`, `${$(`y=${Y}`)} を代入して、${solveLine(right, Y)}。`, `答えは ${k}${m.u}。`],
          };
        }),
        // 01d06a 演習（6）6つの式のうち、一次関数はいくつか
        t("01d06a", (r) => {
          const k = pick(r, [2, 3, 4]), lins = distinct(r, k, linExpr, LIN_KINDS), nons = distinct(r, 6 - k, nonExpr, NON_KINDS);
          const all = shuffle(r, [...lins.map((e) => ({ ...e, lin: true })), ...nons.map((e) => ({ ...e, lin: false }))]);
          if (new Set(all.map((e) => e.tex)).size < 6) return { skip: true };
          const LET = ["ア", "イ", "ウ", "エ", "オ", "カ"], tag = (e, i) => ({ ...e, c: LET[i] });
          const tagged = all.map(tag), linL = tagged.filter((e) => e.lin).map((e) => e.c), invL = tagged.filter((e) => !e.lin && e.why.startsWith("分母")).map((e) => e.c), sqL = tagged.filter((e) => !e.lin && e.why.startsWith("$x^2")).map((e) => e.c);
          const note = [invL.length ? `${invL.join("、")} は分母に $x$ がある` : "", sqL.length ? `${sqL.join("、")} は $x^2$ をふくむ` : ""].filter(Boolean).join("。");
          return {
            q: `次の 6つの式のうち、$y$ が $x$ の一次関数であるものは、全部で何個あるか。（比例の式も、一次関数にふくまれる。）\n${tagged.map((e) => `${e.c} ${$(e.tex)}`).join("　　")}`,
            ans: k,
            unit: "個",
            hint: "1つずつ、$y=ax+b$ の形になっているかな？ 分母に $x$ がある式や、$x^2$ をふくむ式はどうかな？",
            steps: [`${note}。これらは ${WHY_NOT}。`, `一次関数は ${linL.join("、")} の ${k}個。（$y=ax$ のような比例の式も、一次関数にふくまれる。）`],
          };
        }),
        // 01d06b 演習（6）比例の式を選ぶ
        t("01d06b", (r) => {
          const good = distinct(r, 1, linExpr, ["prop", "fprop"])[0], lin2 = distinct(r, 2, linExpr, ["std", "rev", "fstd"]), non = distinct(r, 1, nonExpr, NON_KINDS)[0];
          const ans = $(good.tex);
          return {
            q: "次の 4つの式のうち、$y$ が $x$ に比例するものはどれか。",
            ans,
            choices: choices4(r, ans, [...lin2, non].map((e) => $(e.tex))),
            hint: "比例の式は、どんな形の式だったかな？ $y=ax+b$ と見たとき、$b$ はどうなっているかな？",
            steps: ["比例の式は、$y=ax$ の形（定数の項 $b$ が 0 の一次関数）。", `${ans} がその形。ほかの式は、定数の項があるか、一次関数でないので、比例ではない。`],
          };
        }),
      ],
      // ───────── 4 入試レベル ─────────
      4: [
        // 01d07a 演習（7）① y＝(a−3)x+5 が一次関数 → a について（4択）
        t("01d07a", (r) => {
          const k = pick(r, [-5, -4, -3, -2, 2, 3, 4, 5, 6, 7]), m = rnz(r, -9, 9);
          const kt = `a${k > 0 ? "-" : "+"}${Math.abs(k)}`, expr = `y=(${kt})x${m < 0 ? "-" : "+"}${Math.abs(m)}`;
          const ans = $(`a\\neq ${k}`);
          return {
            q: `$a$ を定数とする。${$(expr)} が $x$ の一次関数であるとき、$a$ についていえることは、次のうちどれか。`,
            ans,
            choices: choices4(r, ans, [$(`a=${k}`), $(`a\\neq ${-k}`), $(`a\\neq ${m}`), $(`a=${-k}`)]),
            hint: "一次関数 $y=ax+b$ では、$x$ の係数について、どんな決まりがあったかな？",
            steps: [`$x$ の係数は ${$(kt)}。一次関数であるためには、$x$ の係数が 0 でないことが必要。`, `${$(`${kt}\\neq 0`)} より ${ans}。（${$(`a=${k}`)} のときは、$y=${m}$ となって一次関数でない。）`],
          };
        }),
        // 01d07b 演習（7）② y＝(a−3)x+(a+2) が比例の式 → a の値
        t("01d07b", (r) => {
          const k = pick(r, [-4, -3, -2, 2, 3, 4, 5]), p = pick(r, [1, 1, 2, 3]);
          let a0 = 0;
          do { a0 = rnz(r, -6, 6); } while (a0 === k);
          const c = -p * a0, kt = `a${k > 0 ? "-" : "+"}${Math.abs(k)}`, ct = `${p === 1 ? "" : p}a${c < 0 ? "-" : "+"}${Math.abs(c)}`;
          return {
            q: `$a$ を定数とする。${$(`y=(${kt})x+(${ct})`)} が $x$ の比例の式であるとき、$a$ の値は？`,
            ans: a0,
            hint: "比例の式は、どんな形の式だったかな？ 定数の項は、どうなればよいかな？",
            steps: [`比例の式だから、定数の項が 0。${$(`${ct}=0`)} より ${$(`a=${a0}`)}。`, `このとき ${$(`y=${axt(a0 - k)}`)} で、$x$ の係数は 0 でないから、比例の式になる。`],
          };
        }),
        // 01d08a 演習（8）① 兄の貯金 → 式（4択）
        t("01d08a", (r) => {
          const c = catchUp(r, { a1s: [200, 300, 400, 500], ds: [100, 200, 300], b2s: [500, 800, 1000, 1500], xr: [4, 15] }), [P1, P2] = pick(r, [["兄", "弟"], ["姉", "妹"]]);
          const first = r(0, 1) === 0, right = first ? c.l1 : c.l2, name = first ? "y" : "z";
          const { ans, choices } = gridChoices(r, right, first ? [c.b1, c.a2, -c.a1] : [c.b2, c.a1, -c.a2], first ? [c.a1, c.b2, -c.b1] : [c.a2, c.b1, -c.b2], first ? [[0, c.b1], [1, c.a1 + c.b1]] : [[0, c.b2], [1, c.a2 + c.b2]], name);
          const who = first ? P1 : P2, a = first ? c.a1 : c.a2, b = first ? c.b1 : c.b2;
          return {
            q: `${P1}は ${c.b1} 円、${P2}は ${c.b2} 円の貯金がある。今月から、${P1}は毎月 ${c.a1} 円、${P2}は毎月 ${c.a2} 円ずつ貯金する。$x$ か月後の貯金を、${P1}は $y$ 円、${P2}は $z$ 円とする。${who}の貯金 $${name}$ を $x$ の式で表すと？`,
            ans,
            choices,
            hint: "はじめの金額と、毎月ふえる金額は、それぞれいくらかな？ それは、式のどの部分になるかな？",
            steps: [`${who}は、はじめが ${b} 円で、毎月 ${a} 円ふえる。`, `${$(`${name}=${axt(a)}+${b}`)}。`],
          };
        }),
        // 01d08b 演習（8）② 同じ金額になるのは何か月後か
        t("01d08b", (r) => {
          const c = catchUp(r, { a1s: [200, 300, 400, 500], ds: [100, 200, 300], b2s: [500, 800, 1000, 1500], xr: [4, 15] }), [P1, P2] = pick(r, [["兄", "弟"], ["姉", "妹"]]);
          return {
            q: `${P1}は ${c.b1} 円、${P2}は ${c.b2} 円の貯金がある。今月から、${P1}は毎月 ${c.a1} 円、${P2}は毎月 ${c.a2} 円ずつ貯金する。$x$ か月後の貯金を、${P1}は $y$ 円、${P2}は $z$ 円とする。2人の貯金が同じ金額になるのは、何か月後か。`,
            ans: c.x0,
            unit: "か月後",
            hint: "$y$ と $z$ は、それぞれ $x$ の式でどう表せるかな？ 2人の貯金が同じとき、$y$ と $z$ はどんな関係かな？",
            steps: catchSteps(c, P1, P2, false),
          };
        }),
        // 01d08c 演習（8）② そのときの金額
        t("01d08c", (r) => {
          const c = catchUp(r, { a1s: [200, 300, 400, 500], ds: [100, 200, 300], b2s: [500, 800, 1000, 1500], xr: [4, 15] }), [P1, P2] = pick(r, [["兄", "弟"], ["姉", "妹"]]);
          return {
            q: `${P1}は ${c.b1} 円、${P2}は ${c.b2} 円の貯金がある。今月から、${P1}は毎月 ${c.a1} 円、${P2}は毎月 ${c.a2} 円ずつ貯金する。$x$ か月後の貯金を、${P1}は $y$ 円、${P2}は $z$ 円とする。2人の貯金が同じ金額になったとき、その金額は？`,
            ans: c.v,
            unit: "円",
            hint: "2人の貯金は、それぞれ $x$ の式でどう表せるかな？ 同じになるのは、$x$ がいくつのときかな？",
            steps: catchSteps(c, P1, P2, true, "円"),
          };
        }),
        // 01q05a 小テスト（5）チャレンジ：2つの量が同じになるのはいつか
        t("01q05a", (r) => {
          const w = twoThings(r);
          return { q: `${w.setup}${w.askTime}`, ans: w.c.x0, unit: w.xU, hint: "それぞれの量は、$x$ の式でどう表せるかな？ 同じになるとき、2つの式にはどんな関係があるかな？", steps: catchSteps(w.c, w.n1, w.n2, false) };
        }),
        // 01q05b 小テスト（5）チャレンジ：同じになったときの量
        t("01q05b", (r) => {
          const w = twoThings(r);
          return { q: `${w.setup}${w.askValue}`, ans: w.c.v, unit: w.vU, hint: "それぞれの量は、$x$ の式でどう表せるかな？ 同じになるのは、$x$ がいくつのときかな？", steps: catchSteps(w.c, w.n1, w.n2, true, w.vU) };
        }),
      ],
    },
  }),
];

/** 棒でつくる形。(1) 正三角形・正方形・正六角形を、となり合う 2つが 1辺を共有するように横に一列につなげる（本数は (n−1)x+1）
 *  (2) 正方形を縦に k 段ならべた形を横に列でふやす（本数は (2k+1)x+k）。a＝1つふえるごとの本数、b＝定数項、c1＝1つのときの本数 */
function matches(r) {
  const stick = pick(r, ["マッチ棒", "つまようじ", "ストロー", "竹ひご"]);
  let a, b, q, u, ask, make;
  if (r(0, 4) < 3) {
    const n = pick(r, [3, 4, 6]), sq = n === 4 ? "正方形" : `正${{ 3: "三", 6: "六" }[n]}角形`;
    a = n - 1; b = 1; u = "個"; make = (k) => `${k}個つくる`; ask = `${sq}は何個つくれるか`;
    q = `同じ長さの${stick}で、${sq}を、となり合う 2つが 1辺を共有するように、横に一列につなげていく。${sq}を 1個つくるのに ${a + b}本、2個つくるのに ${2 * a + b}本、3個つくるのに ${3 * a + b}本いる。${sq}を $x$ 個つくるときの${stick}の本数を $y$ 本とする。`;
  } else {
    const k = pick(r, [2, 3, 4]);
    a = 2 * k + 1; b = k; u = "列"; make = (x) => `横に ${x}列つくる`; ask = "横に何列つくれるか";
    q = `同じ長さの${stick}で、正方形を縦に ${k}段ならべた形を、横に列をふやしながらつくっていく。横に 1列つくるのに ${a + b}本、2列つくるのに ${2 * a + b}本、3列つくるのに ${3 * a + b}本いる。横に $x$ 列つくるときの${stick}の本数を $y$ 本とする。`;
  }
  return { a, b, c1: a + b, stick, u, ask, make, q };
}

/** 2つの量が同じになる場面（ポイント・水そう・読んだページ）。setup＝場面、askTime＝同じになる x、askValue＝そのときの量 */
function twoThings(r) {
  const k = r(0, 2);
  if (k === 0) {
    const c = catchUp(r, { a1s: [20, 30, 40, 50], ds: [10, 20, 30], b2s: [50, 100, 150, 200], xr: [5, 25] });
    return { c, n1: "A店", n2: "B店", xU: "回", vU: "ポイント", askTime: "2つのポイントが同じになるのは、何回買い物をしたときか。", askValue: "2つのポイントが同じになったとき、そのポイントはいくつか。", setup: `A店のカードは、はじめに ${c.b1} ポイントあり、買い物を 1回するごとに ${c.a1} ポイントふえる。B店のカードは、はじめに ${c.b2} ポイントあり、1回ごとに ${c.a2} ポイントふえる。$x$ 回買い物をしたあとの、A店のポイントを $y$、B店のポイントを $z$ とする。` };
  }
  if (k === 1) {
    const c = catchUp(r, { a1s: [2, 3, 4, 5], ds: [1, 2, 3], b2s: [5, 10, 15, 20], xr: [4, 15] });
    return { c, n1: "水そうA", n2: "水そうB", xU: "分後", vU: "L", askTime: "2つの水そうの水の量が同じになるのは、水を入れはじめて何分後か。", askValue: "2つの水そうの水の量が同じになったとき、その水の量は？", setup: `水そうAには水が ${c.b1} L、水そうBには水が ${c.b2} L 入っている。いま、Aには毎分 ${c.a1} L、Bには毎分 ${c.a2} L の割合で、同時に水を入れはじめた。$x$ 分後の水の量を、Aは $y$ L、Bは $z$ L とする。` };
  }
  const c = catchUp(r, { a1s: [5, 8, 10], ds: [2, 3, 5], b2s: [10, 20, 30, 40], xr: [5, 20] });
  return { c, n1: "ゆうさん", n2: "りくさん", xU: "日後", vU: "ページ", askTime: "2人が同じページまで読んでいるのは、何日後か。", askValue: "2人が同じページまで読んでいるとき、そのページ数は？", setup: `ゆうさんは ${c.b1} ページまで読んだ本を毎日 ${c.a1} ページずつ、りくさんは ${c.b2} ページまで読んだ本を毎日 ${c.a2} ページずつ読み進める。$x$ 日後に読んでいるページ数を、ゆうさんは $y$、りくさんは $z$ とする。` };
}

// 移さなかった問題はない（「表を完成させる」は x のときの y の値を聞く問題に、「わけも書こう」は比例している表を選ぶ4択に直した）
export const SKIPPED = [];
