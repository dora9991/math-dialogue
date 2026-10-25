// ============================================================
// ichiji-14.js — 一次関数 第14時「実験の結果を一次関数とみなして、予測しよう」
//   ikkan の演習プリント（ichiji-14.dr.1〜7）・小テスト（ichiji-14.qz.1〜5）を、コツコツくんのテンプレートにしたもの。
//   テンプレート id＝「14」＋ d（演習）／q（小テスト）＋ ikkan の問題の番号（＋ 1つの問題から2つ以上つくるときは a, b…）。例：14d01b ＝ ichiji-14.dr.1 の2つ目
//   実験の表（点）は、本物の直線 y＝ax+b に、小さなずれ（0.1 きざみ、±0.3 まで）をつけてつくる。式に使う 2点は、ずれなし（直線の上の点）にして、式が1つに決まるようにした。
//   図（点と直線）は出せないので、点の座標を文で言い、「x＝○ の点と x＝△ の点を通る直線」「点 (0, 8) と (4, 12) を通る直線」と言い切った。
//   「直線をひく」は、式にして聞く。「式を求めよう」は入力欄で打てないので、(a) 式から出る数（x＝○ のときの y、y＝△ のときの x）を聞く、
//   (b) 4択（誤答は、傾きと切片の入れかえ・符号まちがい・傾きの逆数・切片の代入ミスなど。2点を両方は通らないことを onLine で確かめてから出す）にした。
//   「予測は正しいか、わけも書こう」（dr.5）は、(a) 式を使ってよい x の最大値を聞く、(b) 説明を選ぶ4択にした。
// ============================================================
import { t, pick, choices4, shuffle, round } from "../kit.js";
import { unitFor } from "../unit-kit.js";
import { Q, qadd, qsub, qmul, qdiv, qneg, qeq, qval, qiszero } from "../algebra.js";
import { line, yAt, xAt, onLine, qt } from "../linear.js";

const unit = unitFor("ichiji");

// ── このファイルの小道具 ─────────────────────────────────────────
const TX = (s) => `$${s}$`;
/** 整数・小数（1〜2けた）・[分子, 分母] → Q */
const Qa = (x) => (Array.isArray(x) ? Q(x[0], x[1]) : Number.isInteger(x) ? Q(x) : Q(Math.round(x * 100), 100));
/** 有限小数か（分母が 2 と 5 だけ） */
const isFin = (x) => { let d = Qa(x)[1]; while (d % 2 === 0) d /= 2; while (d % 5 === 0) d /= 5; return d === 1; };
/** 入力欄の答え：整数・有限小数はそのまま数、そうでなければ約分した分数の文字列 */
const ansOf = (x) => { const [n, d] = Qa(x); return d === 1 ? n : isFin([n, d]) ? round(n / d) : `${n}/${d}`; };
/** 数の TeX（有限小数は小数、そうでなければ分数） */
const dt = (x) => { const [n, d] = Qa(x); return d === 1 ? String(n) : isFin([n, d]) ? String(round(n / d)) : qt([n, d]); };
/** 負の数にはかっこをつける */
const P = (x) => { const s = dt(x); return s[0] === "-" ? `(${s})` : s; };
const PT = (p) => TX(`(${dt(p[0])}, ${dt(p[1])})`);
const absQ = (x) => (Qa(x)[0] < 0 ? qneg(Qa(x)) : Qa(x));
/** 「a×x」の書き方（a＝±1 は省く） */
const aX = (a, x) => (qeq(Qa(a), Q(1)) ? P(x) : qeq(Qa(a), Q(-1)) ? `-${P(x)}` : `${P(a)}\\times ${P(x)}`);
/** 直線の TeX（係数は小数）：y=2.5x+3、y=-0.6x+25、y=x+8 */
const ltexD = (l) => {
  const an = l.a[0], bn = l.b[0];
  let s = "y=";
  if (an !== 0) { const c = dt(absQ(l.a)); s += `${an < 0 ? "-" : ""}${c === "1" ? "" : c}x`; }
  if (bn !== 0 || an === 0) { const v = dt(absQ(l.b)); s += an === 0 ? `${bn < 0 ? "-" : ""}${v}` : `${bn < 0 ? "-" : "+"}${v}`; }
  return s;
};
/** 表の y の見かけ（小数第1位まで） */
const fy = (x) => qval(Qa(x)).toFixed(1);

/** 傾きの解説の1行 */
const slopeLine = (p1, p2) => {
  const [x1, y1] = p1, [x2, y2] = p2;
  const a = qdiv(qsub(Qa(y2), Qa(y1)), qsub(Qa(x2), Qa(x1)));
  return `傾きは ${TX(`\\frac{${dt(y2)}-${P(y1)}}{${dt(x2)}-${P(x1)}}=${dt(a)}`)}。`;
};
/** 切片の解説の1行（傾き a、点 p を通る） */
const interceptLine = (a, p) => {
  const [x, y] = p, b = qsub(Qa(y), qmul(Qa(a), Qa(x)));
  if (qiszero(Qa(x))) return `点 ${PT(p)} は y 軸上の点なので、切片は ${TX(dt(y))}。`;
  return `点 ${PT(p)} を通るので、${TX(`${dt(y)}=${aX(a, x)}+b`)} より ${TX(`b=${dt(b)}`)}。`;
};
/** x＝X を代入して y を出す解説の1行（最後に値） */
const evalStep = (l, X, yu = "") => {
  const v = yAt(l, X), b = l.b;
  const bs = b[0] === 0 ? "" : `${b[0] < 0 ? "-" : "+"}${dt(absQ(b))}`;
  return `${TX(`x=${dt(X)}`)} を ${TX(ltexD(l))} に代入して、${TX(`y=${aX(l.a, X)}${bs}=${dt(v)}`)}${yu ? `（${yu}）` : ""}。`;
};
/** y＝Y となる x を出す解説の1行 */
const solveStep = (l, Y, xu = "") => {
  const a = l.a, X = xAt(l, Y), rest = qsub(Qa(Y), l.b);
  const rhs = ltexD(l).slice(2);
  const ax = qeq(a, Q(1)) ? "x" : qeq(a, Q(-1)) ? "-x" : `${dt(a)}x`;
  return qeq(a, Q(1))
    ? `${TX(`${dt(Y)}=${rhs}`)} より ${TX(`x=${dt(X)}`)}${xu ? `（${xu}）` : ""}。`
    : `${TX(`${dt(Y)}=${rhs}`)} より ${TX(`${ax}=${dt(rest)}`)}、${TX(`x=${dt(X)}`)}${xu ? `（${xu}）` : ""}。`;
};

/** 2点 p1、p2 を通る直線 L の式の4択。誤答は「ありがちな間違い」で、2点を両方は通らないものだけ */
const lineChoices = (r, L, p1, p2) => {
  const [x1, y1] = [Qa(p1[0]), Qa(p1[1])], a = L.a, b = L.b;
  const inv = qiszero(a) ? null : qdiv(Q(1), a);
  const cand = [
    qiszero(b) ? null : line(b, a),                                      // 傾きと切片の入れかえ
    qiszero(b) ? null : line(a, qneg(b)),                                // 切片の符号まちがい
    line(qneg(a), b),                                                    // 傾きの符号まちがい
    inv ? line(inv, qsub(y1, qmul(inv, x1))) : null,                     // 傾きを (x の増加量)÷(y の増加量) にしてしまう
    line(a, qadd(y1, qmul(a, x1))),                                      // 切片の代入ミス（y＋a×x としてしまう）
    line(a, y1),                                                         // 切片を y 座標そのものにしてしまう
  ];
  const seen = new Set([ltexD(L)]);
  const wrongs = [];
  const order = shuffle(r, cand.filter(Boolean));
  for (const w of order) {
    const s = ltexD(w);
    if (seen.has(s) || (onLine(w, p1) && onLine(w, p2))) continue;
    seen.add(s); wrongs.push(TX(s));
  }
  const one = Q(1);
  const fills = [line(qadd(a, one), b), line(a, qadd(b, one)), line(qsub(a, one), b), line(a, qsub(b, one))];
  return choices4(r, TX(ltexD(L)), wrongs, (i) => {
    const w = fills[i % fills.length];
    return onLine(w, p1) && onLine(w, p2) ? null : TX(ltexD(w));
  });
};

// ── 実験の場面 ─────────────────────────────────────────────────
//   A：傾きの候補、B：切片の候補、xs：表の x、X：y を予測する x の候補、XX：x を予測する（y＝△ になる x）の候補、ylo・yhi：現実的な y の範囲
const SC = {
  cup: {
    intro: "同じ紙コップを 1個ずつ重ねていく。重ねた個数を $x$ 個、全体の高さを $y$ cm とする。",
    xs: [1, 2, 3, 4, 5, 6], A: [[1, 2], 1, [3, 2]], B: [6, 7, 8, 9, 10, 12], X: [20, 24, 25, 30, 40, 50], XX: [9, 10, 12, 14, 15, 18, 20, 25, 30], ylo: 0, yhi: 90,
    yu: "cm", xu: "個",
    askY: (X) => `${X}個重ねたときの全体の高さは、およそ何 cm と予測できるか。`,
    askX: (Y) => `全体の高さが ${Y}cm になるのは、何個重ねたときと予測できるか。`,
  },
  plant: {
    intro: "ある植物の草丈を、毎日はかった。$x$ 日後の草丈を $y$ cm とする。",
    xs: [1, 2, 3, 4, 5], A: [2, 3, 4], B: [2, 3, 4, 5, 6, 7, 8], X: [7, 8, 10, 12, 15, 20], XX: [7, 8, 10, 12, 14, 15], ylo: 0, yhi: 90,
    yu: "cm", xu: "日後",
    askY: (X) => `${X}日後の草丈は、およそ何 cm と予測できるか。`,
    askX: (Y) => `草丈が ${Y}cm になるのは、何日後と予測できるか。`,
    mean: { rate: "1日にのびる草丈（cm）", inv: "草丈が 1cm のびるのにかかる日数（日）", init: "はかりはじめたとき（x=0）の草丈（cm）", one: "1日後の草丈（cm）" },
  },
  water: {
    intro: "水を温めたときの、$x$ 分後の水温を $y$ ℃ とする。",
    xs: [0, 2, 4, 6, 8], A: [2, 3, 4], B: [14, 15, 16, 18, 20, 22, 24], X: [10, 12, 15, 18, 20], XX: [9, 10, 11, 12, 14, 15, 16, 18, 20], ylo: 0, yhi: 95,
    yu: "℃", xu: "分後",
    askY: (X) => `${X}分後の水温は、およそ何℃と予測できるか。`,
    askX: (Y) => `水温が ${Y}℃になるのは、何分後と予測できるか。`,
    mean: { rate: "1分間に上がる水温（℃）", inv: "水温が 1℃ 上がるのにかかる時間（分）", init: "温めはじめたとき（x=0）の水温（℃）", one: "1分後の水温（℃）" },
  },
  mountain: {
    intro: "山に登りながら、標高 $x$（百 m）の地点の気温を $y$ ℃ とする。",
    xs: [0, 5, 10, 15, 20], A: [[-3, 5], [-1, 2]], B: [20, 22, 24, 25, 26, 28, 30], X: [30, 40], XX: [], ylo: -10, yhi: 40,
    yu: "℃", xu: "",
    askY: (X) => `標高 ${X * 100}m の地点の気温は、およそ何℃と予測できるか。`,
  },
  spring: {
    intro: "ばねに、同じおもりを $x$ 個つるしたときの、ばねの長さを $y$ cm とする。",
    xs: [1, 2, 3, 4, 5, 6], A: [1, 2, 3, [3, 2]], B: [3, 4, 5, 6, 8, 10], X: [8, 10, 12, 15, 20], XX: [8, 9, 10, 12, 14, 15], ylo: 0, yhi: 90,
    yu: "cm", xu: "個",
    askY: (X) => `おもりを ${X}個つるしたときの、ばねの長さは、およそ何 cm と予測できるか。`,
    askX: (Y) => `ばねの長さが ${Y}cm になるのは、おもりを何個つるしたときと予測できるか。`,
    mean: { rate: "おもりを 1個ふやすごとにのびる、ばねの長さ（cm）", inv: "ばねが 1cm のびるのに必要な、おもりの数（個）", init: "おもりをつるしていない（x=0）ときの、ばねの長さ（cm）", one: "おもりを 1個つるしたときの、ばねの長さ（cm）" },
  },
  tank: {
    intro: "水そうに、水を一定の割合で入れる。水を入れはじめてから $x$ 分後の水の深さを $y$ cm とする。",
    xs: [0, 2, 4, 6, 8], A: [[3, 2], 2, [5, 2], 3], B: [2, 3, 4, 5, 6], X: [9, 10, 11, 12, 13, 14, 15, 16, 18], XX: [9, 10, 11, 12, 13, 14, 15, 16, 18], ylo: 0, yhi: 48,
    yu: "cm", xu: "分後",
    askY: (X) => `水を入れはじめて ${X}分後の水の深さは、およそ何 cm と予測できるか。`,
    askX: (Y) => `水の深さが ${Y}cm になるのは、水を入れはじめて何分後と予測できるか。`,
    mean: { rate: "1分間にふえる水の深さ（cm）", inv: "水の深さが 1cm ふえるのにかかる時間（分）", init: "水を入れはじめたとき（x=0）の水の深さ（cm）", one: "水を入れはじめて 1分後の水の深さ（cm）" },
  },
  candle: {
    intro: "ろうそくに火をつけて、$x$ 時間後のろうそくの長さを $y$ cm とする。",
    xs: [0, 1, 2, 3, 4], A: [-1, -2, -3, [-3, 2]], B: [12, 14, 15, 16, 18, 20], X: [5, 6, 7, 8], XX: [5, 6, 7, 8], ylo: 1, yhi: 30,
    yu: "cm", xu: "時間後",
    askY: (X) => `${X}時間後のろうそくの長さは、およそ何 cm と予測できるか。`,
    askX: (Y) => `ろうそくの長さが ${Y}cm になるのは、何時間後と予測できるか。`,
  },
  sound: {
    intro: "空気中を伝わる音の速さを、気温 $x$ ℃のときに調べ、$y$ m/秒 とした（小数点以下を切りすてた値）。",
    xs: [0, 10, 20, 30], A: [[3, 5]], B: [331], X: [-10, -5, 5, 15, 25, 35, 40], XX: [], ylo: 300, yhi: 400,
    yu: "m/秒", xu: "℃", int: true,
    askY: (X) => `気温が ${X < 0 ? `−${-X}` : X}℃のときの、音の速さは、およそ秒速何 m と予測できるか。`,
  },
  lake: {
    intro: "夏の湖で、水面から深さ $x$ m の水温を $y$ ℃ とする。",
    xs: [0, 2, 4, 6, 8], A: [-1, [-3, 2], -2], B: [20, 22, 24, 25, 26], X: [10], XX: [], ylo: 0, yhi: 40,
    yu: "℃", xu: "",
    askY: (X) => `深さ ${X}m の水温は、およそ何℃と予測できるか。`,
  },
  soil: {
    intro: "地下 $x$（百 m）の地中の温度を $y$ ℃ とする。",
    xs: [0, 2, 4, 6, 8], A: [3, [5, 2], [7, 2]], B: [12, 14, 15, 16, 18], X: [10, 12, 15], XX: [], ylo: 0, yhi: 100,
    yu: "℃", xu: "",
    askY: (X) => `地下 ${X * 100}m の地中の温度は、およそ何℃と予測できるか。`,
  },
};

/** 実験データ：直線 l（傾き a・切片 b）、表の x（xs）と y（ずれつき。2点 xp の x では、ずれなし）。pts＝true なら、2点を座標で言う */
function fit(r, key, o = {}) {
  const sc = SC[key];
  const a = Qa(pick(r, sc.A)), b = Q(pick(r, sc.B)), l = line(a, b);
  const xs = o.xs || sc.xs;
  const xp = o.xp || [xs[0], xs[xs.length - 1]];
  const ys = xs.map((x) => {
    const v = yAt(l, x);
    return xp.includes(x) || o.exact ? v : qadd(v, Q(r(-3, 3), 10));
  });
  const p1 = [Q(xp[0]), yAt(l, xp[0])], p2 = [Q(xp[1]), yAt(l, xp[1])];
  return { sc, key, l, a, b, xs, ys, xp, p1, p2, pts: !!o.pts };
}
/** 表の点の文 */
const rows = (f) => f.xs.map((x, i) => TX(`(${x}, ${f.sc.int ? dt(f.ys[i]) : fy(f.ys[i])})`)).join("、");
const lead = (f) => `${f.sc.intro}$x$ と $y$ の値の組 $(x, y)$ を調べると、${rows(f)} となり、点はほぼ一直線上にならんだ。`;
/** 式をつくるのに使う 2点の言い方 */
const which = (f) => (f.pts ? `点 ${PT(f.p1)} と点 ${PT(f.p2)} ` : `$x=${f.xp[0]}$ の点と $x=${f.xp[1]}$ の点`);
/** 2点から式を出す解説（2行） */
const lineSteps = (f) => {
  const l1 = f.pts
    ? `2点 ${PT(f.p1)}、${PT(f.p2)} を通るので、${slopeLine(f.p1, f.p2)}`
    : `${TX(`x=${f.xp[0]}`)}、${TX(`x=${f.xp[1]}`)} の点は ${PT(f.p1)}、${PT(f.p2)}。${slopeLine(f.p1, f.p2)}`;
  return [l1, `${interceptLine(f.a, f.p1)}よって、式は ${TX(ltexD(f.l))}。`];
};
/** 候補の x から、y が現実的な範囲に入るものを選ぶ */
const pickX = (r, f, list) => {
  const ok = list.filter((X) => { const v = qval(yAt(f.l, X)); return v >= f.sc.ylo && v <= f.sc.yhi; });
  return ok.length ? pick(r, ok) : null;
};

/** 「2点を通る直線の式」の4択問題 */
const eqQ = (r, f) => ({
  q: `${lead(f)}一次関数とみなして、${which(f)}を通る直線の式を求める。式は、次のうちどれか。`,
  ans: TX(ltexD(f.l)),
  choices: lineChoices(r, f.l, f.p1, f.p2),
  hint: "2点の座標から、傾きを出せるかな？ 傾きがわかったら、切片は、どうやって決める？",
  steps: lineSteps(f),
});
/** 「x＝X のときの y を予測」 */
const predYQ = (r, f, X) => {
  const v = yAt(f.l, X);
  return {
    q: `${lead(f)}一次関数とみなして、${which(f)}を通る直線で表すと、${f.sc.askY(X)}`,
    ans: ansOf(v), unit: f.sc.yu,
    hint: "2点を通る直線の式は、どうやって求める？ 式ができたら、予測したい値は、$x$ と $y$ のどちらにあたる？",
    steps: [...lineSteps(f), evalStep(f.l, X, f.sc.yu)],
  };
};
/** 「y＝Y になる x を予測」 */
const predXQ = (r, f, X) => {
  const Y = yAt(f.l, X);
  return {
    q: `${lead(f)}一次関数とみなして、${which(f)}を通る直線で表すと、${f.sc.askX(dt(Y))}`,
    ans: ansOf(Q(X)), unit: f.sc.xu,
    hint: "2点を通る直線の式を求めたあと、与えられた値は、$x$ と $y$ のどちらにあたる？ それを式に入れると、どんな方程式になる？",
    steps: [...lineSteps(f), solveStep(f.l, Y, f.sc.xu)],
  };
};

// ── dr.5：予測がどこまで使えるか ───────────────────────────────
//   数や式の都合ではなく、場面の都合（水は 100℃まで、水そうの深さ、ろうそくが燃えつきる）で、式が使えなくなる
function capCase(r, kind) {
  for (let n = 0; n < 300; n++) {
    if (kind === "water") {
      const a = pick(r, [2, 3, 4]), b = pick(r, [14, 15, 16, 18, 20, 22, 24]);
      if ((100 - b) % a !== 0) continue;
      const xl = (100 - b) / a;
      return { kind, l: line(a, b), xl, cap: 100, yu: "℃", xu: "分後", x0: pick(r, [xl + 15, xl + 20, xl + 25]),
        setup: `水を温めはじめてから $x$ 分後の水温を $y$ ℃ とすると、${TX(ltexD(line(a, b)))} と表せることがわかった。水は 100℃で沸とうして、それ以上は上がらない。`,
        limit: "この式を使って水温を予測してよいのは、水温が 100℃になるまでである。それは、水を温めはじめて何分後までか。（$x$ の最大値）",
        reason: "水は 100℃で沸とうして、それ以上は上がらない", name: "水温" };
    }
    if (kind === "tank") {
      const a = pick(r, [2, 3, 4, 5]), b = pick(r, [2, 3, 4, 5, 6]), H = pick(r, [30, 40, 45, 50, 60]);
      if ((H - b) % a !== 0) continue;
      const xl = (H - b) / a;
      return { kind, l: line(a, b), xl, cap: H, yu: "cm", xu: "分後", x0: xl + pick(r, [3, 4, 5, 6]),
        setup: `水そうに水を入れる。水を入れはじめてから $x$ 分後の水の深さを $y$ cm とすると、${TX(ltexD(line(a, b)))} と表せることがわかった。この水そうの深さは ${H}cm で、いっぱいになると、水はあふれる。`,
        limit: `この式を使って水の深さを予測してよいのは、水そうがいっぱいになる（水の深さが ${H}cm になる）までである。それは、水を入れはじめて何分後までか。（$x$ の最大値）`,
        reason: `水そうの深さは ${H}cm までで、それをこえた水はあふれる`, name: "水の深さ" };
    }
    // candle
    const a = pick(r, [-1, -2, -3, -4]), xl = r(4, 9), b = -a * xl;
    if (b < 12 || b > 30) continue;
    return { kind, l: line(a, b), xl, cap: 0, yu: "cm", xu: "時間後",
      setup: `ろうそくに火をつけて、$x$ 時間後のろうそくの長さを $y$ cm とすると、${TX(ltexD(line(a, b)))} と表せることがわかった。ろうそくは、燃えつきると長さが 0cm になる。`,
      limit: "この式を使って長さを予測してよいのは、ろうそくが燃えつきる（長さが 0cm になる）までである。それは、火をつけて何時間後までか。（$x$ の最大値）" };
  }
  throw new Error("capCase が作れない");
}

// ── dr.6：はずれた測定 ──────────────────────────────────────────
function outlierCase(r) {
  const sc = SC.spring, n = r(6, 8), xs = Array.from({ length: n }, (_, i) => i + 1);
  const a = Qa(pick(r, [[3, 2], 2, [5, 2], 3])), b = Q(pick(r, [3, 4, 5, 6, 7, 8, 9])), l = line(a, b);
  const xo = pick(r, xs.filter((x) => x !== 2 && x !== 6)), dev = pick(r, [1, -1]) * pick(r, [15, 18, 20, 24]);
  const ys = xs.map((x) => {
    const v = yAt(l, x);
    if (x === 2 || x === 6) return v;
    return qadd(v, Q(x === xo ? dev : r(-2, 2), 10));
  });
  const f = { sc, key: "spring", l, a, b, xs, ys, xp: [2, 6], p1: [Q(2), yAt(l, 2)], p2: [Q(6), yAt(l, 6)], pts: false };
  return { f, xo };
}

export const UNITS = [
  unit("14", {
    name: "実験の結果を一次関数とみなして、予測する",
    desc: "ほぼ一直線上にならぶ点を直線で表し、式で予測する",
    prereqs: ["J2-ik13", "J2-g2c3u1"],
    points: [
      "調べた点が、ほぼ一直線上にならぶときは、一次関数とみなして、点の近くを通る直線の式で表す。式は、直線が通る点を 2つ選んで、傾きと切片を求めてつくる。",
      "傾きは $y$ の増加量 ÷ $x$ の増加量。切片は、1点の座標を $y=ax+b$ に代入して求める。",
      "式を使って、調べていない値を求めることを予測という。$x$ から $y$ を求めることも、$y$ から $x$ を求める（方程式を解く）こともできる。",
      "式が使えるのは、実験の範囲の近くまで。水温が 100℃をこえるなど、現実にありえない値になるところでは、式のとおりにならない。",
    ],
    levels: {
      // ───────── 1 基礎 ─────────
      1: [
        // 14d01a 紙コップ：点 (0, 8)、(4, 12) を通る直線で、30個の高さを予測
        t("14d01a", (r) => {
          const f = fit(r, "cup", { xp: [0, pick(r, [2, 4])], pts: true });
          const X = pickX(r, f, f.sc.X);
          return X == null ? { skip: true } : predYQ(r, f, X);
        }),
        // 14d01b 紙コップ：2点を通る直線の式（4択）
        t("14d01b", (r) => eqQ(r, fit(r, "cup", { xp: [0, pick(r, [2, 4])], pts: true }))),
        // 14d02a 植物の草丈：x＝1 と x＝5 の点を通る直線の式（4択）
        t("14d02a", (r) => eqQ(r, fit(r, "plant"))),
        // 14d02b 植物の草丈：10日後の草丈を予測
        t("14d02b", (r) => {
          const f = fit(r, "plant"), X = pickX(r, f, f.sc.X);
          return X == null ? { skip: true } : predYQ(r, f, X);
        }),
        // 14q01 水そう：x＝0 と x＝8 の点を通る直線の式（4択）
        t("14q01", (r) => eqQ(r, fit(r, "tank"))),
        // 14q02 水そう：12分後の水の深さを予測
        t("14q02", (r) => {
          const f = fit(r, "tank"), X = pickX(r, f, f.sc.X);
          return X == null ? { skip: true } : predYQ(r, f, X);
        }),
        // 14q04 式の傾き・切片が表すもの（4択）
        t("14q04", (r) => {
          const key = pick(r, ["tank", "plant", "water", "spring"]), sc = SC[key];
          const a = Qa(pick(r, sc.A)), b = Q(pick(r, sc.B));
          if (qeq(absQ(a), b)) return { skip: true };
          const l = line(a, b), ask = pick(r, ["a", "b"]), m = sc.mean;
          const right = ask === "a" ? m.rate : m.init;
          const num = ask === "a" ? dt(a) : dt(b);
          return {
            q: `${sc.intro}ある実験から、${TX(ltexD(l))} という式が得られた。この式の ${TX(num)} が表しているものは、次のうちどれか。`,
            ans: right,
            choices: choices4(r, right, [m.rate, m.inv, m.init, m.one].filter((x) => x !== right)),
            hint: ask === "a" ? "$x$ が 1 ふえると、$y$ は、いくつふえる？ 式の中の、どの数が、それを表している？" : "$x=0$ を式に入れると、$y$ はいくつになる？ 式の中の、どの数が出てくる？",
            steps: ask === "a"
              ? [`${TX("y=ax+b")} の ${TX("a")} は傾きで、${TX("x")} が 1 ふえたときの ${TX("y")} のふえ方を表す。`, `${TX(num)} は、${right}。`]
              : [`${TX("y=ax+b")} の ${TX("b")} は切片で、${TX("x=0")} のときの ${TX("y")} の値を表す。`, `${TX(num)} は、${right}。`],
          };
        }),
      ],
      // ───────── 2 標準 ─────────
      2: [
        // 14d03a 水を温める：表のいちばん左と右の点を通る直線の式（4択）
        t("14d03a", (r) => eqQ(r, fit(r, pick(r, ["water", "tank", "spring"])))),
        // 14d03b 水を温める：y＝50 になるのは何分後か
        t("14d03b", (r) => {
          const f = fit(r, pick(r, ["water", "tank", "spring", "cup"])), X = pickX(r, f, f.sc.XX);
          return X == null ? { skip: true } : predXQ(r, f, X);
        }),
        // 14d04a 標高と気温（ろうそく）：傾きが負の直線の式（4択）
        t("14d04a", (r) => eqQ(r, fit(r, pick(r, ["mountain", "candle"])))),
        // 14d04b 標高 3000m の気温（ろうそくの長さ）を予測
        t("14d04b", (r) => {
          const key = pick(r, ["mountain", "mountain", "candle"]), f = fit(r, key);
          if (key === "candle" && r(0, 1)) { const X = pickX(r, f, f.sc.XX); return X == null ? { skip: true } : predXQ(r, f, X); }
          const X = pickX(r, f, f.sc.X);
          return X == null ? { skip: true } : predYQ(r, f, X);
        }),
        // 14q03 水そう：深さが 43cm になるのは何分後か
        t("14q03", (r) => {
          const f = fit(r, "tank"), X = pickX(r, f, f.sc.XX);
          return X == null ? { skip: true } : predXQ(r, f, X);
        }),
      ],
      // ───────── 3 応用 ─────────
      3: [
        // 14d05a 式が使える範囲：x の最大値
        t("14d05a", (r) => {
          const c = capCase(r, pick(r, ["water", "tank", "candle"]));
          return {
            q: `${c.setup}${c.limit}`,
            ans: c.xl, unit: c.xu,
            hint: c.cap === 0 ? "ろうそくの長さが 0cm になるのは、$y$ がいくつのとき？ それを式に入れると、どんな方程式になる？" : `限界の値は、$x$ と $y$ のどちらの値？ それを式に入れると、どんな方程式になる？`,
            steps: [solveStep(c.l, c.cap, c.xu), `この式が使えるのは、${TX(`0\\leqq x\\leqq ${c.xl}`)} の範囲。最大値は ${c.xl}。`],
          };
        }),
        // 14d05c A さんの予測は正しいか（説明を選ぶ4択）
        t("14d05c", (r) => {
          const c = capCase(r, pick(r, ["water", "tank"]));
          const y0 = yAt(c.l, c.x0), y0w = qmul(c.l.a, Q(c.x0));   // 誤答用：切片 b をたし忘れた値
          if (qeq(y0w, y0) || y0w[0] === c.cap) return { skip: true };
          const right = `${dt(y0)}${c.yu}と計算できるが、${c.reason}ので、この予測は正しくない。`;
          const wrongs = [
            `式に ${TX(`x=${c.x0}`)} を代入して求めた値なので、そのまま信じてよく、この予測は正しい。`,
            `式に ${TX(`x=${c.x0}`)} を代入すると ${dt(y0w)}${c.yu}になり、A さんの値とちがうので、この予測は正しくない。`,
            "一次関数のグラフは直線で、どこまでも続くので、$x$ がどんなに大きくても式のとおりになり、この予測は正しい。",
          ];
          return {
            q: `${c.setup}A さんは、この式を使って、「${c.x0}分後の${c.name}は ${dt(y0)}${c.yu}になる」と予測した。この予測について、正しい説明は、次のうちどれか。`,
            ans: right,
            choices: choices4(r, right, wrongs),
            hint: "式に代入した値は、現実の場面で、起こりうる値かな？ 場面の条件ともくらべてみよう。",
            steps: [`${TX(`x=${c.x0}`)} を ${TX(ltexD(c.l))} に代入すると、${TX(`y=${aX(c.l.a, c.x0)}+${c.l.b[0]}=${dt(y0)}`)}。`, `でも、${c.reason}。`, "式が使えるのは、場面の条件にあう範囲だけ。この予測は、正しくない。"],
          };
        }),
        // 14d06a ばね：はずれている測定は何個のときか
        t("14d06a", (r) => {
          const { f, xo } = outlierCase(r);
          const ds = f.xs.slice(1).map((x, i) => fy(qsub(f.ys[i + 1], f.ys[i])).replace("-", "−"));
          return {
            q: `${f.sc.intro}$x$ と $y$ の値の組 $(x, y)$ を調べると、${rows(f)} となった。1つだけ、ほかの点から大きくはずれている測定がある。それは、おもりを何個つるしたときの測定か。`,
            ans: xo, unit: "個",
            hint: "おもりが 1個ふえるごとの、$y$ のふえ方を、順にくらべてみよう。1つだけ、ようすのちがうところはない？",
            steps: [`おもりが 1個ふえるごとの $y$ のふえ方は、順に ${ds.join("、")}。`, `ほかは約 ${dt(f.a)} ずつふえているのに、${xo}個のところだけ、${xo === 1 ? "次の点との" : "前後との"}ふえ方が大きくちがう。よって、${xo}個のとき。`],
          };
        }),
        // 14d06b ばね：はずれた測定をのぞいて、10個のときの長さを予測
        t("14d06b", (r) => {
          const { f } = outlierCase(r), X = pickX(r, f, f.sc.X.filter((v) => v > f.xs.length + 1));
          if (X == null) return { skip: true };
          const v = yAt(f.l, X);
          return {
            q: `${f.sc.intro}$x$ と $y$ の値の組 $(x, y)$ を調べると、${rows(f)} となった。1つだけ、ほかの点から大きくはずれている測定があるので、それをのぞく。そして、${which(f)}を通る直線で表すと、${f.sc.askY(X)}`,
            ans: ansOf(v), unit: "cm",
            hint: "はずれた測定を使うと、直線はどうなる？ 指定された 2点からは、どんな式がつくれる？",
            steps: [...lineSteps(f), evalStep(f.l, X, "cm")],
          };
        }),
        // 14d06c ばね：x＝2 と x＝6 の点を通る直線の式（4択）
        t("14d06c", (r) => {
          const { f } = outlierCase(r);
          return {
            q: `${f.sc.intro}$x$ と $y$ の値の組 $(x, y)$ を調べると、${rows(f)} となった。1つだけ、ほかの点から大きくはずれている測定があるので、それをのぞく。そして、${which(f)}を通る直線の式を求める。式は、次のうちどれか。`,
            ans: TX(ltexD(f.l)),
            choices: lineChoices(r, f.l, f.p1, f.p2),
            hint: "指定された 2点は、はずれた測定ではない。その座標から、傾きと切片を出せるかな？",
            steps: lineSteps(f),
          };
        }),
      ],
      // ───────── 4 入試レベル ─────────
      4: [
        // 14d07a 音の速さ（地中の温度）：x＝0 と x＝30 の点を通る直線の式（4択）
        t("14d07a", (r) => { const key = pick(r, ["sound", "soil", "lake"]); return eqQ(r, fit(r, key, { exact: key === "sound" })); }),
        // 14d07b 音の速さ：気温 25℃のときの速さを予測
        t("14d07b", (r) => {
          const f = fit(r, "sound", { exact: true }), X = pickX(r, f, f.sc.X);
          return X == null ? { skip: true } : predYQ(r, f, X);
        }),
        // 14d07c 音の速さ：花火が光ってから 3秒後に音が聞こえた。花火までのきょり
        t("14d07c", (r) => {
          const f = fit(r, "sound", { exact: true }), X = pickX(r, f, [5, 15, 25, 35, 40]), sec = r(2, 6);
          if (X == null) return { skip: true };
          const v = yAt(f.l, X), d = qmul(v, Q(sec));
          return {
            q: `${lead(f)}一次関数とみなして、${which(f)}を通る直線で表す。気温 ${X}℃の日に、花火が光ってから ${sec}秒後に、花火の音が聞こえた。音は、この直線から予測した速さで進んだものとし、光が届くまでの時間は考えない。花火までのきょりは、およそ何 m か。`,
            ans: ansOf(d), unit: "m",
            hint: "その気温での音の速さは、直線の式から、どう予測できる？ きょりは、速さと時間から、どう求める？",
            steps: [...lineSteps(f), evalStep(f.l, X, "m/秒"), `きょりは、${TX(`${dt(v)}\\times ${sec}=${dt(d)}`)}（m）。`],
          };
        }),
        // 14q05a 水そう：深さ 40cm の水そうがいっぱいになるのは何分後か
        t("14q05a", (r) => {
          const f = fit(r, "tank"), H = pick(r, [35, 40, 45, 50, 55, 60]);
          const xl = xAt(f.l, H);
          if (!xl || !isFin(xl) || qval(xl) <= 9) return { skip: true };
          return {
            q: `${lead(f)}一次関数とみなして、${which(f)}を通る直線で表す。この水そうの深さは ${H}cm である。水そうが水でいっぱいになるのは、水を入れはじめて何分後と予測できるか。`,
            ans: ansOf(xl), unit: "分後",
            hint: "「いっぱいになる」とき、水の深さ $y$ はいくつ？ それを、2点から求めた式に入れると、どんな方程式になる？",
            steps: [...lineSteps(f), solveStep(f.l, H, "分後")],
          };
        }),
        // 14q05b 水そう：いっぱいになったあとも、式を使ってよいか（x 分後の深さ）
        t("14q05b", (r) => {
          const f = fit(r, "tank"), H = pick(r, [35, 40, 45, 50, 55, 60]);
          const xl = xAt(f.l, H);
          if (!xl || qval(xl) < 11 || qval(xl) > 24) return { skip: true };
          const over = r(0, 2) > 0, X2 = over ? Math.floor(qval(xl)) + r(2, 5) : r(9, Math.floor(qval(xl)) - 1);
          const v = yAt(f.l, X2), shown = qval(v) > H ? Q(H) : v;
          return {
            q: `${lead(f)}一次関数とみなして、${which(f)}を通る直線で表す。この水そうの深さは ${H}cm で、いっぱいになったあとは、水があふれて、水の深さは ${H}cm のまま変わらない。水を入れはじめて ${X2}分後の水の深さは、およそ何 cm と予測できるか。`,
            ans: ansOf(shown), unit: "cm",
            hint: "式で計算した値は、水そうの深さ（水が入る限度）と、くらべるとどうかな？",
            steps: [...lineSteps(f), qval(v) > H
              ? `${evalStep(f.l, X2)}これは水そうの深さ ${H}cm をこえる。水があふれるので、深さは ${H}cm のまま。`
              : `${evalStep(f.l, X2, "cm")}これは水そうの深さ ${H}cm 以内なので、式のとおり。`],
          };
        }),
      ],
    },
  }),
];

// 移さなかった問題
export const SKIPPED = [];   // 第14時は、演習プリント 7問・小テスト 5問のすべてを移した（直線をひく・説明を書く問いは、式の4択・数の問い・説明を選ぶ4択に直した）
