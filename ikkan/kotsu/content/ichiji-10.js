// ============================================================
// ichiji-10.js — 一次関数 第10時「2点から、一次関数の式を求めよう」
//   ikkan の演習プリント（ichiji-10.dr.1〜9）・小テスト（ichiji-10.qz.1〜5）を、コツコツくんのテンプレートにしたもの。
//   テンプレート id＝「10」＋ d（演習）／q（小テスト）＋ ikkan の問題の番号（＋ 1つの問題から2つ以上つくるときは a, b…）。例：10d02a ＝ ichiji-10.dr.2 の1つ目
//   直線は linear.js の line・lineThrough・yAt・xAt・xIntercept で計算し、答え・選択肢の式・解説の数は、ここから出す（手で書かない）。
//   「式を求めよう」は入力欄で打てないので、(a) 式から出る数（傾き・切片・x＝○ のときの y）を聞く、(b) 4択（誤答は、傾きと切片の入れかえ・符号まちがい・
//   傾きの逆数・切片の代入ミスなど。どれも、問題の2点を両方は通らないことを onLine で確かめてから出す）にした。
//   「右の図の直線」は、図が出せないので、通る2点の座標を文で言い切った（dr.8）。dr.9 の「すべて求めよう」は、傾きの正負を決めて、1つの式（または a・b）を聞く形にした。
// ============================================================
import { t, pick, choices4, shuffle, rnz } from "../kit.js";
import { unitFor } from "../unit-kit.js";
import { Q, qadd, qsub, qmul, qdiv, qneg, qeq, qval, linTex, solve2 } from "../algebra.js";
import { line, lineThrough, yAt, xAt, yRange, xIntercept, onLine, ltex, ptex2, qt, num } from "../linear.js";

const unit = unitFor("ichiji");

// ── このファイルの小道具 ─────────────────────────────────────────
const TX = (s) => `$${s}$`;
/** 負の数にかっこをつけた TeX（Q か整数） */
const P = (x) => { const s = qt(x); return s[0] === "-" ? `(${s})` : s; };
/** 点を $(x, y)$ で */
const PT = (p) => TX(ptex2(p));
/** 直線の右辺（y＝ の右）。変数名を v に */
const rhs = (L, v = "x") => ltex(L).slice(2).replace(/x/g, v);
/** 係数つきの項（1 は省く）  coefX(3,"a") → 3a、coefX(-1,"a") → -a */
const coefX = (c, v) => ltex(line(c, 0)).slice(2).replace(/x/g, v);
/** 「a×x」の書き方（a＝±1 は省く） */
const aX = (a, x) => {
  const X = Array.isArray(x) ? x : Q(x);
  if (qeq(X, Q(0))) return "0";                                      // x＝0 なら 0
  if (qeq(a, Q(1))) return qt(X);                                   // a＝1：x の値をそのまま（かっこなし）
  if (qeq(a, Q(-1))) return qt(qneg(X));                            // a＝−1：−x の値（x＝0 なら 0）
  return `${P(a)}\\times ${P(X)}`;
};

const INT_A = [1, 2, 3, 4, -1, -2, -3, -4];
const FRAC_A = [[1, 2], [-1, 2], [1, 3], [-1, 3], [2, 3], [-2, 3], [3, 2], [-3, 2], [3, 4], [-3, 4], [1, 4], [-1, 4]];
const randLine = (r, as, bmax = 8) => line(pick(r, as), rnz(r, -bmax, bmax));

/** 直線 L 上の格子点（x、y とも整数）から、異なる 2 点を選ぶ（順番はランダム）。ない・作れないなら null */
const pickPts = (r, L, { xr = [-6, 6], yMax = 12, gap = 6, minGap = 1, noAxis = false, exclude = [] } = {}) => {
  const xs = [];
  for (let x = xr[0]; x <= xr[1]; x++) {
    const y = yAt(L, x);
    if (y[1] !== 1 || Math.abs(y[0]) > yMax) continue;
    if (noAxis && (x === 0 || y[0] === 0)) continue;
    if (exclude.includes(x)) continue;
    xs.push(x);
  }
  for (let n = 0; n < 60 && xs.length >= 2; n++) {
    const [u, v] = shuffle(r, xs).slice(0, 2);
    if (Math.abs(u - v) > gap || Math.abs(u - v) < minGap) continue;
    return [[u, yAt(L, u)[0]], [v, yAt(L, v)[0]]];
  }
  return null;
};

/** 傾きの解説の1行：(y2−y1)÷(x2−x1) */
const slopeLine = (p1, p2) => {
  const [x1, y1] = p1, [x2, y2] = p2;
  const dy = qsub(Q(y2), Q(y1)), dx = qsub(Q(x2), Q(x1)), a = qdiv(dy, dx);
  return `傾きは ${TX(`(${qt(y2)}-${P(y1)})\\div(${qt(x2)}-${P(x1)})=${P(dy)}\\div ${P(dx)}=${qt(a)}`)}。`;
};
/** 切片の解説の1行：点 p を通るので y＝a×x＋b に代入 */
const interceptLine = (a, p) => {
  const [x, y] = p, b = qsub(Q(y), qmul(a, Q(x)));
  return `点 ${PT(p)} を通るので、${TX(`${qt(y)}=${aX(a, x)}+b`)} より ${TX(`b=${qt(b)}`)}。`;
};


// ── 式を選ぶ4択の誤答の選び方 ─────────────────────────────────────────
//   正解と傾きも切片もそろわない誤答を 1 つ以上入れる。さらに、誤答どうしでそろう組ができるようにして、
//   「他の選択肢と傾き・切片がいちばん共通する式」「ひとつだけ浮いている式」を選ぶ、という当て方で正解が決まらないようにする。
const share = (u, v) => (qeq(u.a, v.a) ? 1 : 0) + (qeq(u.b, v.b) ? 1 : 0);
/** 正解 L と、誤答の候補（main。足りなければ low も使う）から、誤答の直線を 3 つ選ぶ */
const pickWrongs = (r, L, main, low = []) => {
  const uniq = (cs) => {
    const seen = new Set([ltex(L)]), out = [];
    for (const w of cs) { const s = ltex(w); if (!seen.has(s) && !(qeq(w.a, L.a) && qeq(w.b, L.b))) { seen.add(s); out.push(w); } }
    return out;
  };
  let pool = uniq(main);
  if (pool.length < 5) pool = uniq([...main, ...low]);
  const trips = [];
  for (let i = 0; i < pool.length; i++) for (let j = i + 1; j < pool.length; j++) for (let k = j + 1; k < pool.length; k++) trips.push([pool[i], pool[j], pool[k]]);
  const info = (t) => {
    const set = [L, ...t], sc = set.map((c, i) => set.reduce((n, d, j) => n + (i === j ? 0 : share(c, d)), 0));
    return { unrel: t.some((w) => share(L, w) === 0), c: sc[0], maxW: Math.max(...sc.slice(1)), minW: Math.min(...sc.slice(1)) };
  };
  const all = trips.filter((t) => info(t).unrel && info(t).c >= info(t).minW);
  const hi = all.filter((t) => info(t).c > info(t).maxW), mid = all.filter((t) => info(t).c === info(t).maxW), lo = all.filter((t) => info(t).c < info(t).maxW);
  // 正解が「いちばんそろう」（hi）／同点（mid）／他のほうがそろう（lo）を、まぜて出す
  const order = shuffle(r, [hi, hi, mid, lo, lo, lo].filter((g) => g.length));
  const use = order.length ? order[0] : trips.filter((t) => info(t).unrel);
  return pick(r, use.length ? use : trips);
};

/** 2点 p1、p2 を通る直線 L の式の4択。誤答は「ありがちな間違い」で、2点を両方は通らないものだけ */
const lineChoices = (r, L, p1, p2) => {
  const [x1, y1] = p1, a = L.a, b = L.b;
  const inv = qdiv(Q(1), a);
  const main = [
    line(b, a),                                              // 傾きと切片の入れかえ
    line(a, qneg(b)),                                        // 切片の符号まちがい
    line(qneg(a), b),                                        // 傾きの符号まちがい
    line(a, qadd(Q(y1), qmul(a, Q(x1)))),                    // 切片の代入ミス（y＋a×x としてしまう）
    line(a, Q(y1)),                                          // 切片を y 座標そのものにしてしまう
    line(qneg(a), qneg(b)),                                  // 傾きも切片も符号をまちがえる
    line(b, qneg(a)),                                        // 傾きと切片を入れかえて、符号もまちがえる
  ];
  const low = [line(inv, qsub(Q(y1), qmul(inv, Q(x1))))];   // 傾きを (x の増加量)÷(y の増加量) にしてしまう（傾きが整数のときは、分数になるので最後に回す）
  const cands = a[1] === 1 ? { main, low } : { main: [...main, ...low], low: [] };
  const wrongs = pickWrongs(r, L, cands.main.filter((w) => !(onLine(w, p1) && onLine(w, p2))), cands.low).map((w) => TX(ltex(w)));
  const fills = [line(qadd(a, Q(1)), b), line(a, qadd(b, Q(1))), line(qsub(a, Q(1)), b), line(a, qsub(b, Q(1)))];
  return choices4(r, TX(ltex(L)), wrongs, (i) => {
    const w = fills[i % fills.length];
    return onLine(w, p1) && onLine(w, p2) ? null : TX(ltex(w));
  });
};

/** 2点 p1、p2 の解説 3 行（傾き・切片・式） */
const lineSteps = (L, p1, p2) => [slopeLine(p1, p2), interceptLine(L.a, p1), `式は ${TX(ltex(L))}。`];

/** 「x＝○ のとき y＝△」の言い方 */
const xyWord = (p) => `$x=${qt(p[0])}$ のとき $y=${qt(p[1])}$`;

/** 連立方程式の2式（a、b の式）。x 座標の小さい順にならべる */
const abEq = (p) => linTex(p[0], 1, p[1], ["a", "b"]);
const sortPts = (p1, p2) => (p1[0] <= p2[0] ? [p1, p2] : [p2, p1]);

/** a、b の連立方程式の解き方の解説（2点の x 座標がちがうこと）。ask は "a" か "b" */
const abSteps = (L, p1, p2, ask) => {
  const [u, v] = sortPts(p1, p2);
  const dx = v[0] - u[0], dyv = v[1] - u[1];
  const a = L.a[0], b = L.b[0];
  return [
    `${TX(abEq(u))} …①　${TX(abEq(v))} …②`,
    dx === 1 ? `② − ① より ${TX(`a=${a}`)}。` : `② − ① より ${TX(`${coefX(dx, "a")}=${dyv}`)}、${TX(`a=${a}`)}。`,
    `① に ${TX(`a=${a}`)} を代入して ${TX(`${a * u[0]}+b=${u[1]}`)}、${TX(`b=${b}`)}。`,
    ask === "a" ? `よって ${TX(`a=${a}`)}。` : `よって ${TX(`b=${b}`)}。`,
  ];
};

/** y の変域 [x1,x2] → [ylo,yhi]（整数）と、条件をみたす 2 本の直線（傾き正・負） */
const rangeCase = (r) => {
  const sgn = pick(r, [1, -1]), a = sgn * r(1, 4), b = rnz(r, -8, 8);
  const x1 = r(-3, 2), x2 = x1 + r(2, 5);
  const L = line(a, b), [lo, hi] = yRange(L, x1, x2);
  if (Math.abs(lo[0]) > 20 || Math.abs(hi[0]) > 20) return null;
  const ylo = lo[0], yhi = hi[0];
  const other = sgn > 0 ? lineThrough([x1, yhi], [x2, ylo]) : lineThrough([x1, ylo], [x2, yhi]);
  return { sgn, L, other, x1, x2, ylo, yhi };
};
/** 変域の条件を言う文 */
const rangeText = (c) => `一次関数 $y=ax+b$ で、$x$ の変域が $${c.x1}\\leqq x\\leqq ${c.x2}$ のとき、$y$ の変域は $${c.ylo}\\leqq y\\leqq ${c.yhi}$ である。`;
/** 変域の条件をみたし、傾きの正負も合う直線か */
const rangeOk = (c, w) => {
  if (qval(w.a) === 0 || (qval(w.a) > 0) !== (c.sgn > 0)) return false;
  const [lo, hi] = yRange(w, c.x1, c.x2);
  return lo[0] === c.ylo && lo[1] === 1 && hi[0] === c.yhi && hi[1] === 1;
};
/** 変域の解説：通る 2 点 */
const rangePts = (c) => (c.sgn > 0 ? [[c.x1, c.ylo], [c.x2, c.yhi]] : [[c.x1, c.yhi], [c.x2, c.ylo]]);
const rangeSteps = (c) => {
  const [p1, p2] = rangePts(c);
  return [
    c.sgn > 0
      ? `傾きが正のとき、$x$ が増えると $y$ も増える。2点 ${PT(p1)}、${PT(p2)} を通る。`
      : `傾きが負のとき、$x$ が増えると $y$ は減る。2点 ${PT(p1)}、${PT(p2)} を通る。`,
    slopeLine(p1, p2), interceptLine(c.L.a, p1), `式は ${TX(ltex(c.L))}。`,
  ];
};

export const UNITS = [
  unit("10", {
    name: "2点から、一次関数の式を求める",
    desc: "通る2点の座標から、傾きと切片を求める",
    prereqs: ["J2-ik09", "J2-rk02"],
    points: [
      "2点を通る直線の傾きは、(y の増加量)÷(x の増加量) で求める。2点 $(x_1, y_1)$、$(x_2, y_2)$ なら、傾きは $\\frac{y_2-y_1}{x_2-x_1}$。",
      "方法1：傾きがわかったら、1点の座標を $y=ax+b$ に代入して、$b$ を求める。",
      "方法2：2点の座標を $y=ax+b$ に代入して、$a$、$b$ の連立方程式をつくって解く。",
      "求めた式に、もう1つの点の座標を代入して、成り立つか確かめるとよい。",
    ],
    levels: {
      // ───────── 1 基礎 ─────────
      1: [
        // 10d01 2点を通る直線の傾き
        t("10d01", (r) => {
          const L = randLine(r, INT_A), pts = pickPts(r, L, { gap: 4 });
          if (!pts) return { skip: true };
          const [p1, p2] = pts;
          return {
            q: `2点 ${PT(p1)}、${PT(p2)} を通る直線の傾きは？`,
            ans: num(L.a),
            hint: "傾きは、$x$ が 1 増えたときの $y$ の増え方。2点の $x$ 座標の差と $y$ 座標の差は、それぞれいくつかな？",
            steps: ["傾きは (y の増加量)÷(x の増加量) で求める。", slopeLine(p1, p2)],
          };
        }),
        // 10d02a 2点を通る一次関数の式（4択）
        t("10d02a", (r) => {
          const L = randLine(r, INT_A), pts = pickPts(r, L, { gap: 4 });
          if (!pts) return { skip: true };
          const [p1, p2] = pts;
          return {
            q: `グラフが 2点 ${PT(p1)}、${PT(p2)} を通る一次関数の式は、次のうちどれか。`,
            ans: TX(ltex(L)),
            choices: lineChoices(r, L, p1, p2),
            hint: "まず傾きを考えよう。2点の座標の差から、傾きは出せるかな？ そのあと、切片はどうやって決める？",
            steps: lineSteps(L, p1, p2),
          };
        }),
        // 10d02b 2点を通る一次関数の切片
        t("10d02b", (r) => {
          const L = randLine(r, INT_A), pts = pickPts(r, L, { gap: 4 });
          if (!pts) return { skip: true };
          const [p1, p2] = pts;
          return {
            q: `グラフが 2点 ${PT(p1)}、${PT(p2)} を通る一次関数 $y=ax+b$ の、切片 $b$ の値は？`,
            ans: num(L.b),
            hint: "傾きがわかれば、残るのは切片だけ。通る1点の座標を式に入れると、どんな方程式になる？",
            steps: [slopeLine(p1, p2), interceptLine(L.a, p1)],
          };
        }),
        // 10d03a 連立方程式をつくる（4択）
        t("10d03a", (r) => {
          const L = randLine(r, INT_A, 6), pts = pickPts(r, L, { xr: [-3, 5], gap: 4, yMax: 15, exclude: [0, 1] });   // x 座標が 0・1 の点は、a と b の係数を取りちがえた誤答が正解と同じになるので、はずす
          if (!pts) return { skip: true };
          const [u, v] = sortPts(...pts);
          const E = (x, y) => [x, 1, y];
          const sys = (a, b) => [linTex(...a, ["a", "b"]), linTex(...b, ["a", "b"])];
          const right = [E(u[0], u[1]), E(v[0], v[1])];
          const sol = solve2(...right);
          const cand = [
            [E(u[1], u[0]), E(v[1], v[0])],                         // x と y を取りちがえる
            [[1, u[0], u[1]], [1, v[0], v[1]]],                     // a と b の係数を取りちがえる
            [E(u[0], u[1]), [v[0], -1, v[1]]],                      // b の符号をまちがえる
            [E(u[0], u[1]), E(u[0], v[1])],                         // 同じ点の x 座標を 2 度使う
            [E(u[0], u[1]), E(v[0], u[1])],                         // 同じ点の y 座標を 2 度使う
          ];
          const seen = new Set([sys(...right).join("|")]);
          const wrongs = [];
          for (const w of shuffle(r, cand)) {
            const s = sys(...w).join("|"), sw = solve2(...w);
            if (seen.has(s) || !sw || (qeq(sw[0], sol[0]) && qeq(sw[1], sol[1]))) continue;
            seen.add(s); wrongs.push(TX(`\\begin{cases}${sys(...w).join("\\\\")}\\end{cases}`));
          }
          const ans = TX(`\\begin{cases}${sys(...right).join("\\\\")}\\end{cases}`);
          return {
            q: `グラフが 2点 ${PT(u)}、${PT(v)} を通る一次関数 $y=ax+b$ の、$a$、$b$ を求めるために、2点の座標を代入して連立方程式をつくる。正しい連立方程式は、次のうちどれか。`,
            ans,
            choices: choices4(r, ans, wrongs, (i) => {
              const w = [E(u[0], u[1]), E(v[0], v[1] + (i % 2 ? 1 : -1) * (Math.floor(i / 2) + 1))];   // 2つ目の式の右辺をずらす
              return TX(`\\begin{cases}${sys(...w).join("\\\\")}\\end{cases}`);
            }),
            hint: "$y=ax+b$ に点の座標を入れるとき、$x$ の値は $a$ にかかるかな？ $b$ にかかるかな？",
            steps: [
              `$y=ax+b$ に ${PT(u)} を代入して ${TX(abEq(u))}。`,
              `${PT(v)} を代入して ${TX(abEq(v))}。`,
              "この2つの式をならべたものが、正しい連立方程式。",
            ],
          };
        }),
        // 10d03b 連立方程式を使って、a か b の値
        t("10d03b", (r) => {
          const L = randLine(r, INT_A, 6), pts = pickPts(r, L, { xr: [-3, 5], gap: 4, yMax: 15, exclude: [0] });
          if (!pts) return { skip: true };
          const [u, v] = sortPts(...pts);
          const s = solve2([u[0], 1, u[1]], [v[0], 1, v[1]]);
          if (!qeq(s[0], L.a) || !qeq(s[1], L.b)) throw new Error("連立方程式の解が直線と合わない");
          const ask = pick(r, ["a", "b"]);
          return {
            q: `グラフが 2点 ${PT(u)}、${PT(v)} を通る一次関数 $y=ax+b$ について、2点の座標を代入すると、$a$、$b$ の連立方程式 ${TX(`\\begin{cases}${abEq(u)}\\\\${abEq(v)}\\end{cases}`)} ができる。この連立方程式を解いたとき、$${ask}$ の値は？`,
            ans: num(ask === "a" ? L.a : L.b),
            hint: "2つの式を見くらべよう。同じ形の項はあるかな？ 文字を1つ消せないかな？",
            steps: abSteps(L, u, v, ask),
          };
        }),
        // 10q01 小テスト（1）2点を通る直線の傾き
        t("10q01", (r) => {
          const L = randLine(r, [2, 3, 4, -2, -3, 1, -1]), x1 = r(-3, 3), dx = r(2, 4);
          const p1 = [x1, yAt(L, x1)[0]], p2 = [x1 + dx, yAt(L, x1 + dx)[0]];
          if (Math.abs(p1[1]) > 14 || Math.abs(p2[1]) > 14) return { skip: true };
          return {
            q: `2点 ${PT(p1)}、${PT(p2)} を通る直線の傾きを求めよう。`,
            ans: num(L.a),
            hint: "傾きは、$x$ の増加量と $y$ の増加量の、どちらをどちらでわる？",
            steps: ["傾きは (y の増加量)÷(x の増加量) で求める。", slopeLine(p1, p2)],
          };
        }),
        // 10q04 小テスト（4）連立方程式を使って式を求める（a か b）
        t("10q04", (r) => {
          const L = randLine(r, INT_A, 6), pts = pickPts(r, L, { xr: [-3, 4], gap: 4, yMax: 15, exclude: [0] });
          if (!pts) return { skip: true };
          const [u, v] = sortPts(...pts);
          const ask = pick(r, ["a", "b"]);
          return {
            q: `グラフが 2点 ${PT(u)}、${PT(v)} を通る一次関数を $y=ax+b$ として、連立方程式を使って求める。${TX(`\\begin{cases}${abEq(u)}\\\\${abEq(v)}\\end{cases}`)} を解いたとき、$${ask}$ の値は？`,
            ans: num(ask === "a" ? L.a : L.b),
            hint: "$a$、$b$ のどちらかの文字を、消せないかな？ 2つの式の係数をくらべてみよう。",
            steps: abSteps(L, u, v, ask),
          };
        }),
      ],
      // ───────── 2 標準 ─────────
      2: [
        // 10d04a 傾きが分数の2点 → 式（4択）
        t("10d04a", (r) => {
          const L = randLine(r, FRAC_A, 6), pts = pickPts(r, L, { xr: [-8, 8], gap: 9, minGap: 2, yMax: 12 });
          if (!pts) return { skip: true };
          const [p1, p2] = pts;
          return {
            q: `グラフが 2点 ${PT(p1)}、${PT(p2)} を通る一次関数の式は、次のうちどれか。`,
            ans: TX(ltex(L)),
            choices: lineChoices(r, L, p1, p2),
            hint: "傾きは分数になりそう。約分を忘れずに。傾きがわかったら、どの点を使って切片を決める？",
            steps: lineSteps(L, p1, p2),
          };
        }),
        // 10d04b 傾きが分数の2点 → 傾き
        t("10d04b", (r) => {
          const L = randLine(r, FRAC_A, 6), pts = pickPts(r, L, { xr: [-8, 8], gap: 9, minGap: 2, yMax: 12 });
          if (!pts) return { skip: true };
          const [p1, p2] = pts;
          return {
            q: `2点 ${PT(p1)}、${PT(p2)} を通る直線の傾きは？（約分した分数か、整数で答えよう。）`,
            ans: num(L.a),
            hint: "$x$ の増加量と $y$ の増加量を求めたら、わり算の答えを約分できるかな？",
            steps: ["傾きは (y の増加量)÷(x の増加量) で求める。", slopeLine(p1, p2)],
          };
        }),
        // 10d05a 「x＝○ のとき y＝△」の2つ → 式（4択）
        t("10d05a", (r) => {
          const L = randLine(r, INT_A), pts = pickPts(r, L, { gap: 5, minGap: 2 });
          if (!pts) return { skip: true };
          const [p1, p2] = pts;
          return {
            q: `ある一次関数で、${xyWord(p1)}、${xyWord(p2)} である。この一次関数の式は、次のうちどれか。`,
            ans: TX(ltex(L)),
            choices: lineChoices(r, L, p1, p2),
            hint: "「$x$ のとき $y$」の2組は、グラフ上の2点の座標と同じ意味。どんな2点になる？",
            steps: [`2点 ${PT(p1)}、${PT(p2)} を通る。`, slopeLine(p1, p2), interceptLine(L.a, p1), `式は ${TX(ltex(L))}。`],
          };
        }),
        // 10d05b 「x＝○ のとき y＝△」の2つ → 別の x のときの y
        t("10d05b", (r) => {
          const L = randLine(r, INT_A), pts = pickPts(r, L, { gap: 5, minGap: 2 });
          if (!pts) return { skip: true };
          const [p1, p2] = pts;
          const xs = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6].filter((x) => x !== p1[0] && x !== p2[0] && Math.abs(yAt(L, x)[0]) <= 20);
          const k = pick(r, xs);
          return {
            q: `ある一次関数で、${xyWord(p1)}、${xyWord(p2)} である。$x=${k}$ のときの $y$ の値は？`,
            ans: yAt(L, k)[0],
            hint: "まず、この一次関数の式を求めよう。式がわかれば、$x$ に値を入れるだけ。",
            steps: [`2点 ${PT(p1)}、${PT(p2)} を通る。`, slopeLine(p1, p2), interceptLine(L.a, p1), `${TX(ltex(L))} に $x=${k}$ を入れると、${TX(`y=${aX(L.a, k)}${L.b[0] < 0 ? "-" : "+"}${Math.abs(L.b[0])}=${yAt(L, k)[0]}`)}。`],
          };
        }),
        // 10q02 小テスト（2）2点を通る一次関数の式（4択。傾きが負）
        t("10q02", (r) => {
          const L = randLine(r, [-1, -2, -3, -4]), pts = pickPts(r, L, { xr: [0, 6], gap: 4, yMax: 12 });
          if (!pts) return { skip: true };
          const [p1, p2] = pts;
          return {
            q: `グラフが 2点 ${PT(p1)}、${PT(p2)} を通る一次関数の式は、次のうちどれか。`,
            ans: TX(ltex(L)),
            choices: lineChoices(r, L, p1, p2),
            hint: "$x$ が増えると $y$ は減っている。傾きの符号に気をつけて、傾きを求めてみよう。",
            steps: lineSteps(L, p1, p2),
          };
        }),
        // 10q03 小テスト（3）「x＝−4 のとき y＝1、x＝2 のとき y＝−2」（傾きが分数。4択）
        t("10q03", (r) => {
          const L = randLine(r, FRAC_A, 6), pts = pickPts(r, L, { xr: [-8, 8], gap: 9, minGap: 2, yMax: 12 });
          if (!pts) return { skip: true };
          const [p1, p2] = pts;
          return {
            q: `ある一次関数で、${xyWord(p1)}、${xyWord(p2)} である。この一次関数の式は、次のうちどれか。`,
            ans: TX(ltex(L)),
            choices: lineChoices(r, L, p1, p2),
            hint: "2つの組を、2点の座標と考えよう。傾きは約分できるかな？",
            steps: [`2点 ${PT(p1)}、${PT(p2)} を通る。`, slopeLine(p1, p2), interceptLine(L.a, p1), `式は ${TX(ltex(L))}。`],
          };
        }),
      ],
      // ───────── 3 応用 ─────────
      3: [
        // 10d06a x 軸・y 軸との交点が与えられた直線の式（4択）
        t("10d06a", (r) => {
          const p = rnz(r, -8, 8), q = rnz(r, -8, 8);
          if (Math.abs(p) < 2 || Math.abs(q) < 2 || Math.abs(p) === Math.abs(q)) return { skip: true };
          const L = lineThrough([p, 0], [0, q]);
          const main = [
            line(qneg(L.a), L.b),                                  // 傾きの符号まちがい
            line(qdiv(Q(-p), Q(q)), Q(q)),                          // 傾きの分母と分子を取りちがえる
            line(L.a, Q(p)),                                        // 切片に x 軸との交点の x 座標を使う
            line(L.a, qneg(L.b)),                                   // 切片の符号まちがい
            line(qneg(L.a), qneg(L.b)),                             // 傾きも切片も符号をまちがえる
            line(L.b, L.a),                                         // 傾きと切片の入れかえ
            line(qdiv(Q(-p), Q(q)), Q(p)),                          // 分母と分子を取りちがえて、切片に x 座標を使う
          ];
          const wrongs = pickWrongs(r, L, main.filter((w) => !(onLine(w, [p, 0]) && onLine(w, [0, q])))).map((w) => TX(ltex(w)));
          return {
            q: `グラフが $x$ 軸と点 ${PT([p, 0])} で、$y$ 軸と点 ${PT([0, q])} で交わる直線の式は、次のうちどれか。`,
            ans: TX(ltex(L)),
            choices: choices4(r, TX(ltex(L)), wrongs, (i) => TX(ltex(line(qadd(L.a, Q(i + 1)), L.b)))),
            hint: "$y$ 軸と交わる点の $y$ 座標は、一次関数の何にあたる？ 傾きは、2つの交点から出せるかな？",
            steps: [`2点 ${PT([p, 0])}、${PT([0, q])} を通る。切片は $y$ 軸との交点の $y$ 座標で、${TX(`b=${q}`)}。`, slopeLine([p, 0], [0, q]), `式は ${TX(ltex(L))}。`],
          };
        }),
        // 10d06b x 軸・y 軸との交点が与えられた直線の傾き
        t("10d06b", (r) => {
          const p = rnz(r, -9, 9), q = rnz(r, -9, 9);
          if (Math.abs(p) < 2 || Math.abs(q) < 2) return { skip: true };
          const L = lineThrough([p, 0], [0, q]);
          return {
            q: `グラフが $x$ 軸と点 ${PT([p, 0])} で、$y$ 軸と点 ${PT([0, q])} で交わる直線の傾きは？（約分した分数か、整数で答えよう。）`,
            ans: num(L.a),
            hint: "交わる2つの点は、どちらも直線が通る点。2点の座標の差から、傾きは出せるかな？",
            steps: [`直線は 2点 ${PT([p, 0])}、${PT([0, q])} を通る。`, slopeLine([p, 0], [0, q])],
          };
        }),
        // 10d07 2点を通る直線 ℓ 上の点 P(a, y) の a
        t("10d07", (r) => {
          const L = randLine(r, INT_A), pts = pickPts(r, L, { xr: [-4, 5], gap: 4, yMax: 12 });
          if (!pts) return { skip: true };
          const [p1, p2] = pts;
          const xs = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7].filter((x) => x !== p1[0] && x !== p2[0] && Math.abs(yAt(L, x)[0]) <= 25);
          const k = pick(r, xs), y = yAt(L, k)[0];
          if (y === p1[1] || y === p2[1]) return { skip: true };
          return {
            q: `2点 ${PT(p1)}、${PT(p2)} を通る直線を ℓ とする。点 ${TX(`P(a, ${y})`)} が ℓ 上にあるとき、$a$ の値は？`,
            ans: k,
            hint: "ℓ 上の点は、ℓ の式にあてはまる。まず ℓ の式を求めると、$a$ についての方程式がつくれるかな？",
            steps: [
              `ℓ の式を求める。${slopeLine(p1, p2)}`,
              `${interceptLine(L.a, p1)}　ℓ は ${TX(ltex(L))}。`,
              `P は ℓ 上にあるので、${TX(`${y}=${rhs(L, "a")}`)}。これを解いて ${TX(`a=${k}`)}。`,
            ],
          };
        }),
        // 10d08a 直線 ℓ が 2点 A、B を通り、x 軸と P、y 軸と Q で交わる：ℓ の式（4択）
        t("10d08a", (r) => {
          const c = d08Case(r);
          if (!c) return { skip: true };
          return {
            q: `${d08Text(c)}ℓ の式は、次のうちどれか。`,
            ans: TX(ltex(c.L)),
            choices: lineChoices(r, c.L, c.A, c.B),
            hint: "ℓ は 2点 A、B を通る。傾きを求めてから、切片を決めよう。",
            steps: lineSteps(c.L, c.A, c.B),
          };
        }),
      ],
      // ───────── 4 入試レベル ─────────
      4: [
        // 10d08b P の x 座標
        t("10d08b", (r) => {
          const c = d08Case(r);
          if (!c) return { skip: true };
          return {
            q: `${d08Text(c)}点 P の $x$ 座標は？`,
            ans: c.p,
            hint: "$x$ 軸上の点は、$y$ 座標がいくつ？ ℓ の式がわかれば、その $y$ の値から $x$ が求められるかな？",
            steps: [slopeLine(c.A, c.B), `${interceptLine(c.L.a, c.A)}　ℓ は ${TX(ltex(c.L))}。`, `P は $x$ 軸上の点なので ${TX("y=0")}。${TX(`0=${rhs(c.L)}`)} を解いて ${TX(`x=${c.p}`)}。`],
          };
        }),
        // 10d08c 三角形 OPQ の面積
        t("10d08c", (r) => {
          const c = d08Case(r, true);
          if (!c) return { skip: true };
          const area = qmul(Q(1, 2), Q(Math.abs(c.p) * Math.abs(c.q)));
          return {
            q: `${d08Text(c)}三角形 OPQ の面積は？（座標の 1 目もりを 1cm とする。）`,
            ans: num(area),
            unit: "cm²",
            hint: "三角形 OPQ は、O が直角の三角形。底辺と高さは、P と Q のどんな値から出る？",
            steps: [
              slopeLine(c.A, c.B),
              `${interceptLine(c.L.a, c.A)}　ℓ は ${TX(ltex(c.L))}。`,
              `${TX(`x=0`)} で ${TX(`y=${c.q}`)} より ${TX(ptex2([0, c.q], "Q"))}。${TX("y=0")} で ${TX(`x=${c.p}`)} より ${TX(ptex2([c.p, 0], "P"))}。`,
              `${TX(`\\frac{1}{2}\\times ${Math.abs(c.p)}\\times ${Math.abs(c.q)}=${qt(area)}`)}（cm²）`,
            ],
          };
        }),
        // 10d09a 変域から式（4択）
        t("10d09a", (r) => {
          const c = rangeCase(r);
          if (!c) return { skip: true };
          const [p1, p2] = rangePts(c);
          const main = [
            c.other,                                                // 傾きの正負を取りちがえた式（もう一方の場合の式）
            line(c.L.b, c.L.a),                                     // 傾きと切片の入れかえ
            line(c.L.a, qneg(c.L.b)),                               // 切片の符号まちがい
            line(qneg(c.L.a), c.L.b),                               // 傾きの符号まちがい
            line(c.L.a, Q(c.sgn > 0 ? c.ylo : c.yhi)),              // 切片を y の変域の端の値にしてしまう
            line(qneg(c.L.a), qneg(c.L.b)),                         // 傾きも切片も符号をまちがえる
            line(c.L.b, qneg(c.L.a)),                               // 傾きと切片を入れかえて、符号もまちがえる
          ].filter((w) => !rangeOk(c, w));
          const wrongs = pickWrongs(r, c.L, main).map((w) => TX(ltex(w)));
          return {
            q: `${rangeText(c)}$a$ が${c.sgn > 0 ? "正" : "負"}の数のとき、この一次関数の式は、次のうちどれか。`,
            ans: TX(ltex(c.L)),
            choices: choices4(r, TX(ltex(c.L)), wrongs, (i) => TX(ltex(line(qadd(c.L.a, Q(c.sgn * (i + 1))), c.L.b)))),
            hint: `傾きの正負は、グラフの向きとどう結びついている？ その向きから、条件の 2つの端は、どんな 2点の座標になる？`,
            steps: rangeSteps(c),
          };
        }),
        // 10d09b 変域から a か b
        t("10d09b", (r) => {
          const c = rangeCase(r);
          if (!c) return { skip: true };
          const ask = pick(r, ["a", "b"]);
          return {
            q: `${rangeText(c)}$a$ が${c.sgn > 0 ? "正" : "負"}の数のとき、$${ask}$ の値は？`,
            ans: num(ask === "a" ? c.L.a : c.L.b),
            hint: `傾きの正負は、グラフの向きとどう結びついている？ その向きから、通る 2点の座標は決まる？`,
            steps: [...rangeSteps(c), `よって ${TX(`${ask}=${qt(ask === "a" ? c.L.a : c.L.b)}`)}。`],
          };
        }),
        // 10q05 小テスト（5）チャレンジ：2点を通る直線 ℓ が x 軸と交わる点の x 座標
        t("10q05", (r) => {
          const L = randLine(r, [...INT_A, ...FRAC_A], 8), pts = pickPts(r, L, { xr: [-8, 8], gap: 8, minGap: 2, yMax: 12 });
          if (!pts) return { skip: true };
          const [p1, p2] = pts;
          const xi = xIntercept(L)[0];
          if (Math.abs(qval(xi)) > 20) return { skip: true };
          return {
            q: `2点 ${PT(p1)}、${PT(p2)} を通る直線 ℓ が、$x$ 軸と交わる点の $x$ 座標は？（約分した分数か、整数で答えよう。）`,
            ans: num(xi),
            hint: "$x$ 軸上の点は、$y$ 座標がいくつ？ ℓ の式がわかれば、その値から $x$ が求められるかな？",
            steps: [slopeLine(p1, p2), `${interceptLine(L.a, p1)}　ℓ は ${TX(ltex(L))}。`, `$x$ 軸との交点は ${TX("y=0")} のとき。${TX(`0=${rhs(L)}`)} を解いて ${TX(`x=${qt(xi)}`)}。`],
          };
        }),
      ],
    },
  }),
];

// ── dr.8 の図形：直線 ℓ が x 軸と P(p, 0)、y 軸と Q(0, q) で交わり、軸上でない格子点 A、B を通る ─────────
function d08Case(r, evenArea = false) {
  for (let n = 0; n < 160; n++) {
    const p = rnz(r, -8, 8), q = rnz(r, -8, 8);
    if (Math.abs(p) < 2 || Math.abs(q) < 2) continue;
    if (evenArea && (Math.abs(p) * Math.abs(q)) % 2 !== 0) continue;   // 面積が整数になる組だけ
    const L = lineThrough([p, 0], [0, q]);
    const pts = pickPts(r, L, { xr: [-8, 8], gap: 8, minGap: 2, yMax: 12, noAxis: true });
    if (!pts || pts.some(([x, y]) => x === p || y === q)) continue;
    const [A, B] = pts[0][0] < pts[1][0] ? pts : [pts[1], pts[0]];
    return { L, p, q, A, B };
  }
  return null;
}
function d08Text(c) {
  return `直線 ℓ は 2点 ${TX(ptex2(c.A, "A"))}、${TX(ptex2(c.B, "B"))} を通り、$x$ 軸と点 P、$y$ 軸と点 Q で交わっている。O は原点とする。`;
}

// 移さなかった問題はなし（図は、通る2点の座標を文で言い切った。「すべて求めよう」は、傾きの正負を決めて1つの式（または a・b）を聞く形にした）
export const SKIPPED = [];
