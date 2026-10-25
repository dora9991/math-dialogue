// ============================================================
// ichiji-15.js — 一次関数 第15時「3つの料金プランを、グラフでくらべよう」
//   ikkan の演習プリント（ichiji-15.dr.1〜6）・小テスト（ichiji-15.qz.1〜5）を、コツコツくんのテンプレートにしたもの。
//   テンプレート id＝「15」＋ d（演習）／q（小テスト）＋ ikkan の問題の番号（＋ 1つの問題から2つ以上つくるときは a, b…）。例：15d01c ＝ ichiji-15.dr.1 の3つ目
//   料金の式 y＝（1あたりの料金）×x＋（基本料金）は、直線 line(傾き, 切片) で持ち、交点（同じ料金になる x）は meet、料金は yAt で計算する（手で書かない）。
//   グラフ（図）は出せないので、「グラフをかこう」は落とし、式・同じ料金になる量・どちらが安いか・「何〜以上で安い」を聞く形にした。
//   「何枚以上で安いか」は、境目（同じ料金になる x）が答えに含まれるか含まれないかを、問題文で言い切り、いちばん小さい（大きい）整数で答えさせる。
//   dr.6（グラフから式を読みとる）は、図が出せないので、各プランのグラフが通る 2点の座標を文で言い切った。
//   式を答える問題は入力欄で打てないので、4択（誤答は、傾きと切片の入れかえ・符号まちがい・基本料金を 1あたりの料金にたす・もう一方の店の料金を使う、など。正解と同じ式にならないものだけ）にした。
// ============================================================
import { t, pick, choices4, shuffle } from "../kit.js";
import { unitFor } from "../unit-kit.js";
import { Q, qadd, qsub, qmul, qneg, qeq, qiszero } from "../algebra.js";
import { line, yAt, meet, onLine, ltex } from "../linear.js";

const unit = unitFor("ichiji");

// ── このファイルの小道具 ─────────────────────────────────────────
const TX = (s) => `$${s}$`;
/** x の係数つきの項（1 は省く） */
const cx = (c) => (c === 1 ? "x" : c === -1 ? "-x" : `${c}x`);
/** 直線の右辺（y＝ の右） */
const rhs = (L) => ltex(L).slice(2);
/** 式の4択：正解 L、ありがちな誤答の直線 cands。正解と同じ式になるものは、はずす */
const lineChoices = (r, L, cands, fills = []) => {
  const seen = new Set([ltex(L)]);
  const wrongs = [];
  for (const w of shuffle(r, cands.filter(Boolean))) {
    const s = ltex(w);
    if (seen.has(s)) continue;
    seen.add(s); wrongs.push(TX(s));
  }
  return choices4(r, TX(ltex(L)), wrongs, (i) => {
    const w = fills[i % Math.max(1, fills.length)];
    return w && ltex(w) !== ltex(L) ? TX(ltex(w)) : null;
  });
};

// ── 料金プランの場面（A 店・B 店のように、2つのプランをくらべる）──────────────────
//   combos：[高い単価 pS（基本料金なし）, 低い単価 pR, 同じ料金になる量の候補…]。基本料金 FR＝(pS−pR)×(同じ料金になる量)
const CTX = {
  bike: {
    lead: "自転車を借りる。", names: ["A 店", "B 店"], shop: "店", u: "時間", fee: "基本料金", fstep: 50,
    def: "$x$ 時間借りたときの料金を $y$ 円とする。", ask: (k) => `${k}時間借りる`,
    combos: [[200, 100, [3, 4, 5, 6, 8]], [300, 150, [2, 4, 6]], [250, 150, [3, 4, 5, 6]], [200, 150, [4, 6, 8]], [300, 200, [3, 4, 5, 6]]],
  },
  copy: {
    lead: "コピーをとる。", names: ["A 店", "B 店"], shop: "店", u: "枚", fee: "会員料", fstep: 50,
    def: "$x$ 枚とるときの料金を $y$ 円とする。", ask: (k) => `${k}枚とる`,
    combos: [[10, 5, [20, 30, 40, 50, 60]], [10, 6, [25, 50]], [8, 4, [25, 50]], [10, 4, [25, 50]], [12, 6, [25, 50]]],
  },
  photo: {
    lead: "写真を焼き増しする。", names: ["A 店", "B 店"], shop: "店", u: "枚", fee: "会員料", fstep: 50,
    def: "$x$ 枚（$x$ は整数）焼き増しするときの料金を $y$ 円とする。", ask: (k) => `${k}枚焼き増しする`,
    combos: [[30, 15, [20, 30, 40]], [20, 10, [20, 30, 40]], [25, 15, [20, 30]], [40, 20, [15, 20, 25]], [30, 20, [20, 30, 40]], [50, 30, [10, 20, 25]], [35, 20, [10, 20]], [45, 15, [5, 10, 15]], [40, 25, [10, 20]]],
  },
  print: {
    lead: "クラスの文集を印刷する。", names: ["X 社", "Y 社"], shop: "社", u: "冊", fee: "基本料金", fstep: 100,
    def: "$x$ 冊印刷するときの料金を $y$ 円とする。", ask: (k) => `${k}冊印刷する`,
    combos: [[350, 200, [20, 30]], [300, 200, [20, 30, 40]], [400, 250, [20, 30]], [500, 300, [10, 15, 20]], [450, 300, [20, 30]]],
  },
  pool: {
    lead: "市民プールに通う。", names: ["A プラン", "B プラン"], shop: "プラン", u: "回", fee: "月会費", fstep: 100,
    def: "$x$ 回利用した月の料金を $y$ 円とする。", ask: (k) => `${k}回利用する`,
    combos: [[300, 100, [3, 4, 5, 6]], [400, 200, [3, 4, 5]], [500, 300, [3, 4, 5]], [400, 150, [4, 6, 8]], [600, 400, [3, 4, 5, 6]]],
  },
  karaoke: {
    lead: "カラオケに行く。", names: ["A 店", "B 店"], shop: "店", u: "時間", fee: "入室料", fstep: 100,
    def: "$x$ 時間利用するときの料金を $y$ 円とする。", ask: (k) => `${k}時間利用する`,
    combos: [[800, 500, [3, 4, 5]], [1000, 600, [2, 3, 4]], [900, 500, [2, 3, 4, 5]], [1200, 800, [3, 4, 5]]],
  },
};

/** 2つのプラン：S（基本料金なし・単価が高い）と R（基本料金あり・単価が低い）。名前の割りふりは、ランダム */
function mkPlan(r, key) {
  const c = CTX[key];
  for (let i = 0; i < 200; i++) {
    const [pS, pR, xs] = pick(r, c.combos), xeq = pick(r, xs);
    const FR = (pS - pR) * xeq;
    if (FR % c.fstep !== 0) continue;
    const swap = r(0, 1) === 1;
    const [nS, nR] = swap ? [c.names[1], c.names[0]] : [c.names[0], c.names[1]];
    const dS = `${nS}は 1${c.u} ${pS}円。`, dR = `${nR}は、${c.fee} ${FR}円と、1${c.u} ${pR}円。`;
    const m = meet(line(pS, 0), line(pR, FR));
    if (!m || !qeq(m[0], Q(xeq))) throw new Error("同じ料金になる量が合わない");
    return { c, pS, pR, FR, xeq, nS, nR, lS: line(pS, 0), lR: line(pR, FR), lead: `${c.lead}${swap ? dR + dS : dS + dR}${c.def}` };
  }
  throw new Error("mkPlan が作れない");
}
/** 料金（円）：S（k 単位） */
const priceS = (p, k) => p.pS * k;
const priceR = (p, k) => p.pR * k + p.FR;

/** R の式の4択 */
const eqR = (r, p) => ({
  q: `${p.lead}${p.nR}の料金 $y$ 円を、$x$ の式で表すと、次のうちどれか。`,
  ans: TX(ltex(p.lR)),
  choices: lineChoices(r, p.lR, [
    line(p.FR, p.pR),                  // 基本料金と 1あたりの料金の入れかえ
    line(p.pR, -p.FR),                 // 基本料金を引いてしまう
    line(p.pR + p.FR, 0),              // 基本料金を 1あたりの料金にたしてしまう
    line(p.pR, 0),                     // 基本料金を入れわすれる
    line(p.pS, p.FR),                  // もう一方の店の 1あたりの料金を使う
  ], [line(p.pR * 2, p.FR), line(p.pR, p.FR * 2), line(p.pS + p.pR, p.FR)]),
  hint: `料金は、「${p.c.fee}」と「${p.c.u}数ぶんの料金」の和。$x$ ${p.c.u}ぶんの料金は、$x$ を使って、どう表せる？`,
  steps: [`（料金）＝（1${p.c.u}の料金）×（${p.c.u}数）＋（${p.c.fee}）。`, `${p.nR}は、1${p.c.u}が ${p.pR}円で、${p.c.fee}が ${p.FR}円だから、${TX(ltex(p.lR))}。`],
});
/** 同じ料金になる量 */
const crossQ = (r, p) => ({
  q: `${p.lead}${p.c.shop === "社" ? "2社" : `2つの${p.c.shop}`}の料金が同じになるのは、何${p.c.u}のときか。`,
  ans: p.xeq, unit: p.c.u,
  hint: "料金が同じとき、2つの式の $y$ は、どんな関係になる？ そこから、$x$ についての方程式がつくれないかな？",
  steps: [
    `${p.nS}は ${TX(ltex(p.lS))}、${p.nR}は ${TX(ltex(p.lR))}。`,
    `料金が等しいので ${TX(`${rhs(p.lS)}=${rhs(p.lR)}`)}。移項して ${TX(`${cx(p.pS - p.pR)}=${p.FR}`)}、${TX(`x=${p.xeq}`)}。`,
    `${p.xeq}${p.c.u}のときに同じ料金（${priceS(p, p.xeq)}円）になる。`,
  ],
});
/** k 単位のとき、安いのはどちらで、いくらか（4択） */
const cheaperQ = (r, p, k) => {
  const pS = priceS(p, k), pR = priceR(p, k), sCheap = k < p.xeq;
  const right = sCheap ? `${p.nS}、${pS}円` : `${p.nR}、${pR}円`;
  const wrongs = [sCheap ? `${p.nR}、${pR}円` : `${p.nS}、${pS}円`, `${p.nS}、${pR}円`, `${p.nR}、${pS}円`];
  return {
    q: `${p.lead}${p.c.ask(k)}とき、安いのはどちらか。また、そのときの料金はいくらか。「安いほう、その料金」の組として正しいものは、次のうちどれか。`,
    ans: right,
    choices: choices4(r, right, wrongs),
    hint: `${p.nS}、${p.nR}の式に、$x=${k}$ を入れると、それぞれの料金はいくらになる？ 低いのはどちら？`,
    steps: [
      `${p.nS}は ${TX(`y=${p.pS}\\times ${k}=${pS}`)}（円）。`,
      `${p.nR}は ${TX(`y=${p.pR}\\times ${k}+${p.FR}=${pR}`)}（円）。`,
      `${sCheap ? pS : pR} 円のほうが安いので、${right}。`,
    ],
  };
};
/** R のほうが安くなる最小の量（同じ料金のときは、安いとはいわない） */
const minRQ = (r, p) => ({
  q: `${p.lead}${p.nR}のほうが、${p.nS}より安くなるのは、何${p.c.u}以上のときか。（$x$ は整数。同じ料金のときは、「安い」にふくめない。）`,
  ans: p.xeq + 1, unit: `${p.c.u}以上`,
  hint: "2つの店の料金が同じになるのは、何のときかな？ そのすぐあと、どちらが安くなる？",
  steps: [
    `同じ料金になるのは ${TX(`x=${p.xeq}`)}（${priceS(p, p.xeq)}円）。`,
    `${p.xeq + 1}${p.c.u}のとき、${p.nS}は ${priceS(p, p.xeq + 1)}円、${p.nR}は ${priceR(p, p.xeq + 1)}円で、${p.nR}が安い。`,
    `${p.xeq}${p.c.u}のときは同じ料金なのでふくめない。${p.xeq + 1}${p.c.u}以上。`,
  ],
});
/** S のほうが安い最大の量 */
const maxSQ = (r, p) => ({
  q: `${p.lead}${p.nS}のほうが、${p.nR}より安いのは、何${p.c.u}以下のときか。（$x$ は整数。同じ料金のときは、「安い」にふくめない。）`,
  ans: p.xeq - 1, unit: `${p.c.u}以下`,
  hint: "2つの店の料金が同じになるのは、何のときかな？ そのすぐ前、どちらが安い？",
  steps: [
    `同じ料金になるのは ${TX(`x=${p.xeq}`)}（${priceS(p, p.xeq)}円）。`,
    `${p.xeq - 1}${p.c.u}のとき、${p.nS}は ${priceS(p, p.xeq - 1)}円、${p.nR}は ${priceR(p, p.xeq - 1)}円で、${p.nS}が安い。`,
    `${p.xeq}${p.c.u}のときは同じ料金なのでふくめない。${p.xeq - 1}${p.c.u}以下。`,
  ],
});
/** 同じ料金にならない量（xeq の前後）を選ぶ。dir＝-1 なら前、1 なら後、0 ならどちらでも。量が大きいときは、5ずつはなす */
const nearK = (r, p, dir) => {
  const step = p.xeq >= 20 ? 5 : 1, cs = [];
  for (let j = 1; j <= 4; j++) {
    if (dir <= 0 && p.xeq - step * j >= 1) cs.push(p.xeq - step * j);
    if (dir >= 0) cs.push(p.xeq + step * j);
  }
  return pick(r, cs);
};

// ── dr.4：2つの水そう ───────────────────────────────────────────
function tankCase(r) {
  for (let i = 0; i < 400; i++) {
    const rP = pick(r, [2, 3, 4, 5]), rQ = pick(r, [2, 3, 4, 5, 6]), Q0 = pick(r, [0, 0, 0, 10, 20]), xeq = r(4, 12);
    const P0 = (rP + rQ) * xeq + Q0;
    if (P0 > 150 || P0 < 30 || P0 % rP !== 0 || P0 / rP > 25 || rP === rQ) continue;
    const lP = line(-rP, P0), lQ = line(rQ, Q0), m = meet(lP, lQ);
    if (!m || !qeq(m[0], Q(xeq))) throw new Error("水そうの交点が合わない");
    const empty = P0 / rP;
    return {
      rP, rQ, Q0, P0, xeq, lP, lQ, empty, yEq: yAt(lP, xeq)[0], qAtEmpty: yAt(lQ, empty)[0],
      text: `水そう P には水が ${P0}L 入っていて、毎分 ${rP}L ずつぬく。水そう Q は${Q0 === 0 ? "空で" : `水が ${Q0}L 入っていて`}、毎分 ${rQ}L ずつ入れる。同時にはじめてから $x$ 分後の、水の量を $y$ L とする。`,
    };
  }
  throw new Error("tankCase が作れない");
}

// ── dr.5：弟を兄が追いかける ───────────────────────────────────
function chaseCase(r) {
  for (let i = 0; i < 600; i++) {
    const vB = pick(r, [40, 50, 60, 70, 80]), vA = pick(r, [100, 120, 150, 160, 180, 200, 240]), d = pick(r, [2, 3, 4, 5, 6, 8, 10]);
    if (vA <= vB * 1.5 || (vA * d) % (vA - vB) !== 0) continue;
    const x = (vA * d) / (vA - vB), pos = vB * x;
    const D = (Math.floor(pos / 100) + r(2, 6)) * 100;
    const lB = line(vB, 0), lA = line(vA, -vA * d), m = meet(lB, lA);
    if (!m || !qeq(m[0], Q(x)) || !qeq(m[1], Q(pos))) throw new Error("追いかけの交点が合わない");
    return {
      vB, vA, d, x, pos, D, lB, lA,
      text: `弟が家を出発して、駅に向かって分速 ${vB}m で歩いた。兄は、弟が出発して ${d}分後に家を出発し、分速 ${vA}m で同じ道を追いかけた。家から駅までは ${D}m である。弟が出発してから $x$ 分後の、家からの道のりを $y$ m とする。`,
    };
  }
  throw new Error("chaseCase が作れない");
}

// ── dr.6：携帯電話のプラン ア・イ（グラフが通る 2点で言う）─────────────────
function callCase(r) {
  for (let i = 0; i < 600; i++) {
    const pA = pick(r, [50, 100, 150]), pB = pA + pick(r, [50, 100]), xeq = r(3, 8);
    const FB = pick(r, [100, 200, 300]), FA = FB + (pB - pA) * xeq;
    if (FA > 1000) continue;
    const lA = line(pA, FA), lB = line(pB, FB), m = meet(lA, lB);
    if (!m || !qeq(m[0], Q(xeq))) throw new Error("通話プランの交点が合わない");
    const two = (L) => { const xs = shuffle(r, [0, 1, 2, 3, 4, 5, 6]).slice(0, 2).sort((a, b) => a - b); return xs.map((x) => [x, yAt(L, x)[0]]); };
    const ptA = two(lA), ptB = two(lB);
    const PT = (p) => TX(`(${p[0]}, ${p[1]})`);
    return {
      pA, pB, FA, FB, xeq, lA, lB, ptA, ptB,
      text: `携帯電話の料金プラン ア、イ がある。通話時間を $x$ 分、料金を $y$ 円とする。プラン ア のグラフは、点 ${PT(ptA[0])} と点 ${PT(ptA[1])} を通る直線で、プラン イ のグラフは、点 ${PT(ptB[0])} と点 ${PT(ptB[1])} を通る直線である。`,
    };
  }
  throw new Error("callCase が作れない");
}
/** 2点 p1、p2 を通る直線 L の4択（傾きの逆数は使わない） */
const callChoices = (r, L, p1, p2) => {
  const [x1, y1] = p1, a = L.a, b = L.b;
  const cand = [
    qiszero(b) ? null : line(b, a),                                        // 傾きと切片の入れかえ
    qiszero(b) ? null : line(a, qneg(b)),                                  // 切片の符号まちがい
    line(qneg(a), b),                                                      // 傾きの符号まちがい
    line(a, qadd(Q(y1), qmul(a, Q(x1)))),                                  // 切片の代入ミス（y＋a×x としてしまう）
    line(a, Q(y1)),                                                        // 切片を y 座標そのものにしてしまう
  ].filter((w) => w && !(onLine(w, p1) && onLine(w, p2)));
  const one = Q(50);
  return lineChoices(r, L, cand, [line(qadd(a, one), b), line(a, qadd(b, one)), line(qsub(a, one), b), line(a, qsub(b, one))].filter((w) => !(onLine(w, p1) && onLine(w, p2))));
};

// ── 小テスト（5）：3つの店（A は基本料金なし、B と C は基本料金あり）────────────────
function triCase(r) {
  for (let i = 0; i < 800; i++) {
    const pA = pick(r, [20, 30, 40, 50]), pB = pick(r, [10, 15, 20, 25]), pC = pick(r, [2, 4, 5, 8]);
    if (!(pA > pB && pB > pC)) continue;
    const x1 = pick(r, [10, 15, 20, 25, 30]), x2 = x1 + pick(r, [6, 8, 10, 12, 15]);
    const FB = (pA - pB) * x1, FC = FB + (pB - pC) * x2;
    if (FB % 50 !== 0 || FC % 50 !== 0 || FC > 1500) continue;
    const lA = line(pA, 0), lB = line(pB, FB), lC = line(pC, FC);
    if (!qeq(meet(lA, lB)[0], Q(x1)) || !qeq(meet(lB, lC)[0], Q(x2))) throw new Error("3つの店の交点が合わない");
    return { pA, pB, pC, FB, FC, x1, x2, lA, lB, lC };
  }
  throw new Error("triCase が作れない");
}

export const UNITS = [
  unit("15", {
    name: "料金プランを式でくらべる",
    desc: "2つのプランの式をつくり、同じ料金になる量と、どちらが安いかを調べる",
    prereqs: ["J2-ik14", "J2-rk02"],
    points: [
      "料金は、（料金）＝（1あたりの料金）×（量）＋（基本料金）の形の一次関数 $y=ax+b$ で表せる。$a$ が 1あたりの料金、$b$ が基本料金。",
      "2つのプランの料金が同じになる量は、2つの式を等しいとおいた方程式（連立方程式）の解。グラフでは、2直線の交点の $x$ 座標。",
      "グラフが下にあるほうが安い。交点より前と後で、安いほうが入れかわる。「何以上（以下）で安いか」は、同じ料金になる量を境にして、整数で考える。同じ料金のときは、安いとはいわない。",
      "どちらが安いかは、実際に $x$ の値を式に入れて、料金をくらべて確かめる。",
    ],
    levels: {
      // ───────── 1 基礎 ─────────
      1: [
        // 15d01a 自転車：基本料金のある店の式（4択）
        t("15d01a", (r) => eqR(r, mkPlan(r, pick(r, ["bike", "karaoke", "pool"])))),
        // 15d01b 自転車：同じ料金になるのは何時間のときか
        t("15d01b", (r) => crossQ(r, mkPlan(r, pick(r, ["bike", "karaoke", "pool"])))),
        // 15d01c 自転車：B 店が安いのは何時間以上のときか
        t("15d01c", (r) => minRQ(r, mkPlan(r, pick(r, ["bike", "karaoke", "pool"])))),
        // 15d02a コピー：同じ料金になるのは何枚のときか
        t("15d02a", (r) => crossQ(r, mkPlan(r, pick(r, ["copy", "photo"])))),
        // 15d02b コピー：60枚とるときは、どちらの店が安いか
        t("15d02b", (r) => { const p = mkPlan(r, pick(r, ["copy", "photo"])); return cheaperQ(r, p, nearK(r, p, 1)); }),
        // 15q01 小テスト（1）A 店、B 店の式（写真の焼き増し）
        t("15q01", (r) => eqR(r, mkPlan(r, "photo"))),
      ],
      // ───────── 2 標準 ─────────
      2: [
        // 15d03a 文集の印刷：基本料金のある社の式（4択）
        t("15d03a", (r) => eqR(r, mkPlan(r, pick(r, ["print", "pool", "karaoke"])))),
        // 15d03b 文集の印刷：同じ料金になるのは何冊のときか
        t("15d03b", (r) => crossQ(r, mkPlan(r, pick(r, ["print", "pool", "karaoke", "bike"])))),
        // 15d03c 文集の印刷：15冊のとき、30冊のときは、どちらの社が安いか
        t("15d03c", (r) => { const p = mkPlan(r, pick(r, ["print", "pool", "karaoke", "bike"])); return cheaperQ(r, p, nearK(r, p, r(0, 1) ? 1 : -1)); }),
        // 15q02 小テスト（2）2つの店の料金が同じになるのは何枚のときか
        t("15q02", (r) => crossQ(r, mkPlan(r, "photo"))),
        // 15q03 小テスト（3）50枚焼き増しするときは、どちらの店が安いか。料金も
        t("15q03", (r) => { const p = mkPlan(r, "photo"); return cheaperQ(r, p, nearK(r, p, 0)); }),
        // 15q04 小テスト（4）A 店のほうが安いのは何枚以下のときか
        t("15q04", (r) => maxSQ(r, mkPlan(r, "photo"))),
      ],
      // ───────── 3 応用 ─────────
      3: [
        // 15d04a 2つの水そう：P の式（4択）
        t("15d04a", (r) => {
          const c = tankCase(r);
          return {
            q: `${c.text}水そう P の水の量 $y$ L を、$x$ の式で表すと、次のうちどれか。`,
            ans: TX(ltex(c.lP)),
            choices: lineChoices(r, c.lP, [line(c.rP, c.P0), line(c.P0, -c.rP), line(-c.P0, c.rP), line(-c.rQ, c.P0), line(-c.rP, c.Q0 === 0 ? -c.P0 : c.P0 + c.Q0)], [line(-c.rP, c.P0 + 10), line(-c.rP - 1, c.P0)]),
            hint: "水がぬけていくと、水の量は、ふえる？ へる？ 1分間に何 L かわる？ はじめの量は？",
            steps: [`P は、はじめに ${c.P0}L あり、毎分 ${c.rP}L ずつへっていく。`, `$x$ 分後には ${c.rP}x（L）へるので、${TX(ltex(c.lP))}。`],
          };
        }),
        // 15d04b 2つの水そう：水の量が等しくなるのは何分後か（何 L のときか）
        t("15d04b", (r) => {
          const c = tankCase(r), askT = r(0, 1) === 0;
          return {
            q: `${c.text}2つの水そうの水の量が等しくなるのは、${askT ? "同時にはじめてから何分後か" : "何 L のときか"}。`,
            ans: askT ? c.xeq : c.yEq, unit: askT ? "分後" : "L",
            hint: "水の量が等しいとき、P と Q の式の $y$ は、どんな関係？ $x$ についての方程式がつくれないかな？",
            steps: [
              `P は ${TX(ltex(c.lP))}、Q は ${TX(ltex(c.lQ))}。`,
              `量が等しいので ${TX(`${rhs(c.lP)}=${rhs(c.lQ)}`)}。移項して ${TX(`${cx(c.rP + c.rQ)}=${c.P0 - c.Q0}`)}、${TX(`x=${c.xeq}`)}。`,
              askT ? `${c.xeq}分後に等しくなる。` : `${TX(`y=${c.rQ}\\times ${c.xeq}${c.Q0 ? `+${c.Q0}` : ""}=${c.yEq}`)}（L）。`,
            ],
          };
        }),
        // 15d04c 2つの水そう：P が空になったとき、Q の水は何 L か
        t("15d04c", (r) => {
          const c = tankCase(r);
          return {
            q: `${c.text}水そう P が空になったとき、水そう Q の水は何 L か。`,
            ans: c.qAtEmpty, unit: "L",
            hint: "P の水の量 $y$ が 0 になるのは、何分後かな？ そのとき、Q の式に同じ $x$ を入れると？",
            steps: [`P が空になるのは ${TX(`0=-${c.rP}x+${c.P0}`)} より ${TX(`${cx(c.rP)}=${c.P0}`)}、${TX(`x=${c.empty}`)}。`, `Q は ${TX(`y=${c.rQ}\\times ${c.empty}${c.Q0 ? `+${c.Q0}` : ""}=${c.qAtEmpty}`)}（L）。`],
          };
        }),
        // 15d05a 弟を兄が追いかける：兄の式（4択）
        t("15d05a", (r) => {
          const c = chaseCase(r);
          return {
            q: `${c.text}兄の道のり $y$ m を、$x$ の式で表すと、次のうちどれか。`,
            ans: TX(ltex(c.lA)),
            choices: lineChoices(r, c.lA, [line(c.vA, -c.d), line(c.vA, c.vA * c.d), line(c.vB, -c.vA * c.d), line(c.vA, -c.vB * c.d), line(-c.vA, c.vA * c.d)], [line(c.vA, -c.vA * c.d - 100), line(c.vA + 10, -c.vA * c.d)]),
            hint: "兄が歩いているのは、弟が出発して何分後から？ 兄が歩いた時間は、$x$ を使うと、どう表せる？",
            steps: [`兄が歩いている時間は ${TX(`x-${c.d}`)}（分）。`, `道のり＝速さ×時間 より ${TX(`y=${c.vA}(x-${c.d})`)}。かっこをはずして ${TX(ltex(c.lA))}。`],
          };
        }),
        // 15d05b 弟を兄が追いかける：追いつくのは何分後か・家から何 m の地点か
        t("15d05b", (r) => {
          const c = chaseCase(r), askT = r(0, 1) === 0;
          return {
            q: `${c.text}兄が弟に追いつくのは、${askT ? "弟が出発してから何分後か" : "家から何 m の地点か"}。`,
            ans: askT ? c.x : c.pos, unit: askT ? "分後" : "m",
            hint: "追いついたとき、2人の家からの道のりは、どんな関係？ そこから、$x$ についての方程式がつくれないかな？",
            steps: [
              `弟は ${TX(ltex(c.lB))}、兄は ${TX(`y=${c.vA}(x-${c.d})=${rhs(c.lA)}`)}。`,
              `道のりが等しいので ${TX(`${rhs(c.lB)}=${rhs(c.lA)}`)}。移項して ${TX(`${cx(c.vA - c.vB)}=${c.vA * c.d}`)}、${TX(`x=${c.x}`)}。`,
              askT ? `弟が出発して ${c.x}分後に追いつく。` : `${TX(`y=${c.vB}\\times ${c.x}=${c.pos}`)}（m）。駅までは ${c.D}m なので、駅の手前で追いつく。`,
            ],
          };
        }),
      ],
      // ───────── 4 入試レベル ─────────
      4: [
        // 15d06a 携帯電話のプラン：ア の式（4択）
        t("15d06a", (r) => {
          const c = callCase(r), isA = r(0, 1) === 0, L = isA ? c.lA : c.lB, pts = isA ? c.ptA : c.ptB, nm = isA ? "ア" : "イ";
          return {
            q: `${c.text}プラン ${nm} の料金 $y$ 円を、$x$ の式で表すと、次のうちどれか。`,
            ans: TX(ltex(L)),
            choices: callChoices(r, L, pts[0], pts[1]),
            hint: "2点の座標から、傾き（1分あたりの料金）は出せるかな？ そのあと、切片（基本料金）は、どうやって決める？",
            steps: [`傾きは ${TX(`\\frac{${pts[1][1]}-${pts[0][1]}}{${pts[1][0]}-${pts[0][0]}}=${L.a[0]}`)}。`, `点 ${TX(`(${pts[0][0]}, ${pts[0][1]})`)} を通るので、${TX(`${pts[0][1]}=${L.a[0]}\\times ${pts[0][0]}+b`)} より ${TX(`b=${L.b[0]}`)}。`, `プラン ${nm} は ${TX(ltex(L))}。`],
          };
        }),
        // 15d06b 携帯電話のプラン：同じ料金になるのは何分のときか
        t("15d06b", (r) => {
          const c = callCase(r);
          return {
            q: `${c.text}2つのプランの料金が同じになるのは、通話時間が何分のときか。`,
            ans: c.xeq, unit: "分",
            hint: "まず、ア と イ の式を、それぞれつくろう。料金が同じとき、2つの式の $y$ は、どんな関係？",
            steps: [
              `ア は ${TX(ltex(c.lA))}、イ は ${TX(ltex(c.lB))}（2点の座標から、傾きと切片を求めた）。`,
              `料金が等しいので ${TX(`${rhs(c.lA)}=${rhs(c.lB)}`)}。移項して ${TX(`${cx(c.pB - c.pA)}=${c.FA - c.FB}`)}、${TX(`x=${c.xeq}`)}。`,
              `${c.xeq}分のとき、同じ料金（${yAt(c.lA, c.xeq)[0]}円）になる。`,
            ],
          };
        }),
        // 15d06c 携帯電話のプラン：k 分のとき、安いのはどちらか
        t("15d06c", (r) => {
          const c = callCase(r), k = pick(r, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].filter((v) => v !== c.xeq && Math.abs(v - c.xeq) <= 5));
          const pa = yAt(c.lA, k)[0], pb = yAt(c.lB, k)[0], aCheap = pa < pb;
          const right = aCheap ? `ア、${pa}円` : `イ、${pb}円`;
          return {
            q: `${c.text}通話時間が ${k}分のとき、安いのはどちらのプランか。また、そのときの料金はいくらか。「安いプラン、その料金」の組として正しいものは、次のうちどれか。`,
            ans: right,
            choices: choices4(r, right, [aCheap ? `イ、${pb}円` : `ア、${pa}円`, `ア、${pb}円`, `イ、${pa}円`]),
            hint: "まず、ア と イ の式を、2点の座標からつくろう。式に $x$ の値を入れると、料金は？",
            steps: [`ア は ${TX(ltex(c.lA))}、イ は ${TX(ltex(c.lB))}。`, `$x=${k}$ のとき、ア は ${pa}円、イ は ${pb}円。`, `${aCheap ? pa : pb}円のほうが安いので、${right}。`],
          };
        }),
        // 15q05 チャレンジ：B 店がいちばん安くなるのは何枚から何枚までか
        t("15q05", (r) => {
          const c = triCase(r), ask = pick(r, ["min", "max", "cnt"]);
          const nm = ask === "min" ? "そのうち、いちばん小さい枚数は？" : ask === "max" ? "そのうち、いちばん大きい枚数は？" : "そのような枚数は、全部で何通りあるか。";
          const ans = ask === "min" ? c.x1 + 1 : ask === "max" ? c.x2 - 1 : c.x2 - c.x1 - 1;
          return {
            q: `写真を焼き増しする。A 店は 1枚 ${c.pA}円。B 店は、会員料 ${c.FB}円と、1枚 ${c.pB}円。C 店は、会員料 ${c.FC}円と、1枚 ${c.pC}円である。$x$ 枚（$x$ は整数）焼き増しするときの料金を $y$ 円とする。A 店、B 店、C 店のうち、B 店がいちばん安くなる枚数がある。（ほかの店と同じ料金のときは、いちばん安いとはいわない。）${nm}`,
            ans, unit: ask === "cnt" ? "通り" : "枚",
            hint: "A 店と B 店、B 店と C 店で、それぞれ、同じ料金になる枚数を求めよう。B 店が両方より安いのは、どの範囲？",
            steps: [
              `A と B は ${TX(`${c.pA}x=${c.pB}x+${c.FB}`)} より ${TX(`${cx(c.pA - c.pB)}=${c.FB}`)}、${TX(`x=${c.x1}`)} で同じ。`,
              `B と C は ${TX(`${c.pB}x+${c.FB}=${c.pC}x+${c.FC}`)} より ${TX(`${cx(c.pB - c.pC)}=${c.FC - c.FB}`)}、${TX(`x=${c.x2}`)} で同じ。`,
              `B が A より安い … ${c.x1 + 1}枚以上、B が C より安い … ${c.x2 - 1}枚以下。${c.x1 + 1}枚から ${c.x2 - 1}枚まで。`,
              ask === "min" ? `いちばん小さい枚数は ${c.x1 + 1}。` : ask === "max" ? `いちばん大きい枚数は ${c.x2 - 1}。` : `${TX(`${c.x2 - 1}-${c.x1 + 1}+1=${ans}`)}（通り）。`,
            ],
          };
        }),
      ],
    },
  }),
];

// 移さなかった問題
export const SKIPPED = [];   // 第15時は、演習プリント 6問・小テスト 5問のすべてを移した（グラフをかく小問は、式・同じ料金になる量・どちらが安いかを聞く形に直した。dr.6 のグラフは、通る 2点の座標で言い切った）
