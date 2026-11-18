// ============================================================
// heikou-13.js — 平行と合同 第13時「合同を使って、線分や角が等しいことを証明しよう」
//   ikkan の演習プリント（heikou-13.dr.1〜4）・小テスト（heikou-13.qz.1〜3）を、コツコツくんのテンプレートにしたもの。
//   テンプレート id＝「13」＋ d（演習）／q（小テスト）＋ ikkan の問題の番号（＋ 型ごとに a, b…）。例：13d01a ＝ heikou-13.dr.1 の穴うめ（4択）
//   図は出せないので、頂点の名前・位置関係・等しい辺や角（仮定）を、すべて問題文に書いた。「右の図」とは書かない。
//   証明は書けないので、(a) 証明の穴うめ（仮定・共通・共通な辺・合同条件・対応する辺や角）を選ぶ4択、(b) 「どの角が等しければよいか」「どの根拠か」「どの合同条件か」を選ぶ4択、
//   (c) 合同から出る角の大きさ（数値入力）、に直した。証明の全文を書かせる問題は、どれも (a)(b)(c) の形で移した（SKIPPED は 0）。
//   角の大きさ・合同条件は、問題文の数字・等しいものの組から計算して出す（手で書かない）。合同条件は judge（辺・角の位置から判定）で出す。
//   合同条件を聞く問題は、「次の 3つだけがわかっている（ほかのことは使わない）」と言い切り、3組の辺・2組の辺とその間の角・1組の辺とその両端の角・あてはまらない、が、まんべんなく答えになるようにした。
//   4択の「当てやすさ」（長さ・かたち・正解の語の出方で、問題を読まずに当てられる割合）は、各テンプレート 35〜45% 以下になるよう、誤答の長さ・出し方をそろえた。
// ============================================================
import { t as t0, pick, choices4, sample, shuffle } from "../kit.js";
import { unitFor } from "../unit-kit.js";

const unit = unitFor("heikou");

/** t(id, build) と同じ。ただし、数の答えが問題文の数とたまたま同じになる組は、作り直す（skip） */
const t = (id, build) => t0(id, (r) => {
  const p = build(r);
  return p && typeof p.ans === "number" && ((p.q.match(/\d+/g) || []).map(Number)).includes(p.ans) ? { skip: true } : p;
});

// ── 道具（この授業の問題用に足した小さな関数）──────────────────────────
const LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ";   // I と O は、1・0 とまぎらわしいので、のぞく
const CAN = "ABCDEFGHJKLMN";                     // 問題をかくときの仮の名前（A, B, C, …）
/** 仮の名前 A, B, C, … を、連続した文字（ABCD…／EFGH…／KLMN…／PQRS…）にとりかえる関数。k＝使う文字の数。avoid＝使わない文字（O など） */
function namer(r, k, avoid = "") {
  const seqs = [];
  for (let s = 0; s + k <= LETTERS.length; s++) {
    if (!"AEKP".includes(LETTERS[s])) continue;
    const seq = LETTERS.slice(s, s + k);
    if ([...avoid].some((c) => seq.includes(c))) continue;
    seqs.push(seq);
  }
  const seq = pick(r, seqs);
  return (str) => str.replace(/[A-Z]/g, (c) => { const i = CAN.indexOf(c); return i >= 0 && i < k ? seq[i] : c; });
}

/** 誤答の候補 pool から k 個えらぶ。正解 ans の「長さの順位」が、かたよらないように（長さで当てられないように） */
function pickWrongs(r, ans, pool, k = 3) {
  const target = r(0, k), len = (x) => String(x).length;
  let first = null;
  for (let i = 0; i < 80; i++) {
    const w = shuffle(r, pool).slice(0, k), lo = w.filter((x) => len(x) < len(ans)).length, ties = w.filter((x) => len(x) === len(ans)).length;
    if (!first) first = w;
    if (target >= lo && target <= lo + ties) return w;
  }
  return first;
}
/** 重みつきで 1つえらぶ */
function pickW(r, keys, w) {
  const tot = keys.reduce((s, k) => s + w[k], 0);
  let x = r(0, 9999) / 10000 * tot;
  for (const k of keys) { if (x < w[k]) return k; x -= w[k]; }
  return keys[keys.length - 1];
}

const kan = (n) => (n < 10 ? "〇一二三四五六七八九"[n] : n < 20 ? "十" + (n % 10 ? "一二三四五六七八九"[n % 10 - 1] : "") : "二三四五六七八九"[Math.floor(n / 10) - 2] + "十" + (n % 10 ? "一二三四五六七八九"[n % 10 - 1] : ""));
const polyName = (n) => (n === 3 ? "正三角形" : n === 4 ? "正方形" : `正${kan(n)}角形`);

// 合同条件
const COND = { SSS: "3組の辺", SAS: "2組の辺とその間の角", ASA: "1組の辺とその両端の角", NONE: "どれにもあてはまらない" };
const condChoices = (r, key) => choices4(r, COND[key], Object.keys(COND).filter((k) => k !== key).map((k) => COND[k]));
/** 三角形の頂点の番号 0, 1, 2 で、等しいものを言う。辺 SIDE(i, j)（頂点 i と j をむすぶ辺。common＝true なら「辺 ○○ が共通」）、角 ANG(i)（頂点 i の角） */
const SIDE = (i, j, common = false) => ({ k: "s", i, j, common });
const ANG = (i) => ({ k: "a", i });
/** 等しいもの 3つから、あてはまる合同条件を判定する（SSS／SAS／ASA／NONE）。辺2・角1 は、角が2辺の間（2辺に共通な頂点）の角のときだけ SAS。辺1・角2 は、2つの角が辺の両端のときだけ ASA */
function judge(els) {
  const ss = els.filter((e) => e.k === "s"), aa = els.filter((e) => e.k === "a");
  if (ss.length === 3) return "SSS";
  if (ss.length === 2 && aa.length === 1) {
    const common = [ss[0].i, ss[0].j].find((v) => v === ss[1].i || v === ss[1].j);
    return aa[0].i === common ? "SAS" : "NONE";
  }
  if (ss.length === 1 && aa.length === 2) {
    const ends = [ss[0].i, ss[0].j];
    if (aa.every((a) => ends.includes(a.i))) return "ASA";
    throw new Error("辺1・角2 で、角が辺の両端でない組は、使わない（AAS）");
  }
  return "NONE";
}
/** 三角形の頂点の並び V の、頂点 i の角の名前（i 以外の 2頂点を、番号の小さい順にはさむ）。例 V=[A,O,B] なら、i=0 → OAB、i=1 → AOB、i=2 → ABO */
const angName = (V, i) => { const o = [0, 1, 2].filter((x) => x !== i); return V[o[0]] + V[i] + V[o[1]]; };
const sorted2 = (e) => (e.i < e.j ? [e.i, e.j] : [e.j, e.i]);
/** 等しいもの e を、「AB＝DC」「∠OAB＝∠ODC」「辺 AC が共通」の形の文字にする（V1、V2＝2つの三角形の頂点の並び） */
const elText = (e, V1, V2) => {
  if (e.k === "s") { const [i, j] = sorted2(e); return e.common ? `辺 ${V1[i]}${V1[j]} が共通` : `${V1[i]}${V1[j]}＝${V2[i]}${V2[j]}`; }
  return `∠${angName(V1, e.i)}＝∠${angName(V2, e.i)}`;
};
const oth = (v) => [0, 1, 2].filter((z) => z !== v);
/** 等しいもの 3つの組の全部（種類ごと）。SSA＝2辺と、その間にない角。AAA＝3組の角 */
const TRI = {
  SSS: [[SIDE(0, 1), SIDE(1, 2), SIDE(0, 2)]],
  SAS: [0, 1, 2].map((v) => [SIDE(v, oth(v)[0]), SIDE(v, oth(v)[1]), ANG(v)]),
  ASA: [[0, 1], [1, 2], [0, 2]].map(([i, j]) => [SIDE(i, j), ANG(i), ANG(j)]),
  SSA: [0, 1, 2].flatMap((v) => oth(v).map((w) => [SIDE(v, oth(v)[0]), SIDE(v, oth(v)[1]), ANG(w)])),
  AAA: [[ANG(0), ANG(1), ANG(2)]],
};
/** 合同条件の解説（3行）。els＝等しいもの 3つ、key＝judge の答え */
function condSteps(els, V1, V2, key) {
  const ss = els.filter((e) => e.k === "s"), aa = els.filter((e) => e.k === "a");
  let mid;
  if (key === "SSS") mid = "辺が 3組とも、それぞれ等しい。";
  else if (key === "SAS") {
    const v = aa[0].i, [x, y] = ss.map((e) => [e.i, e.j].find((z) => z !== v));
    mid = `∠${angName(V1, v)} は、辺 ${V1[v]}${V1[Math.min(x, y)]} と ${V1[v]}${V1[Math.max(x, y)]} の間の角。`;
  } else if (key === "ASA") {
    const [i, j] = sorted2(ss[0]);
    mid = `辺 ${V1[i]}${V1[j]} の両端の角（∠${angName(V1, i)} と ∠${angName(V1, j)}）が、それぞれ等しい。`;
  } else if (aa.length === 3) mid = "3組の角が等しいだけでは、大きさがちがう三角形もある。";
  else {
    const v = [ss[0].i, ss[0].j].find((z) => z === ss[1].i || z === ss[1].j);
    mid = `∠${angName(V1, aa[0].i)} は、等しい 2辺の間の角ではない（間の角は ∠${angName(V1, v)}）。`;
  }
  return [`等しいのは、${els.map((e) => elText(e, V1, V2)).join("、")}。`, mid, key === "NONE" ? "だから、3つの合同条件のどれにもあてはまらない。" : `だから、合同条件は「${COND[key]}」。`];
}
/**
 * 合同条件を聞く問題。intro＝状況の紹介（「…について、次の 3つだけがわかっている（ほかのことは使わない）。」まで）、
 * kinds＝{ SSS: [組, …], SAS: […], ASA: […], NONE: […] }（等しいものの組。空の種類は出さない）。答えが、種類ごとに同じくらい出る。
 */
function condQ(r, N, { intro, V1, V2, kinds }) {
  const key = pick(r, Object.keys(kinds).filter((k) => kinds[k].length));
  const els0 = pick(r, kinds[key]);
  if (judge(els0) !== key) throw new Error(`種類がちがう: ${key}`);
  return {
    q: N(`${intro}${shuffle(r, els0).map((e) => elText(e, V1, V2)).join("、")}。三角形の合同条件のうち、あてはまるものは？`),
    ans: COND[key],
    choices: condChoices(r, key),
    hint: "三角形の合同条件は3つ。それぞれ、どんな条件だったかな？",
    steps: condSteps(els0, V1, V2, key).map(N),
  };
}

// ── 証明の穴うめ ───────────────────────────────────────────
/**
 * 辺を共通にもつ 2つの三角形で示す証明（たこ形・台形）。
 * hyps＝仮定の等しいもの（組の番号つき）、els＝合同条件につかう 3つ（共通な辺をふくむ）、concl＝結論の候補［等しいもの, …］。
 * 空欄の候補：seg3（③の行ぜんぶ＝どの辺が共通か）／cond（合同条件）。
 * 問題文に、ひく対角線の名前は書かない（seg3 の答えが、そのまま問題文に書いてあることになるので）。共通な辺は、「△〜 と △〜 において」の行から見つける。
 * 「仮定より」「共通」「対応する辺（角）は等しい」の語の空欄は、正解が 1〜2通りしかなく、問題を読まずに絞りこめてしまうので、つくらない（seg3 の選択肢の中に「共通」の語は出る）。
 */
function commonSideProof(r, { t1, t2, V1, V2, els, concls, seg: seg0, wrongSegs: wrongSegs0, w }) {
  const flip = (s) => (r(0, 1) ? s : s[1] + s[0]);   // 辺の名前の文字の順は、どちらでもよい（正解だけ、文字の並びがちがって見えないように）
  const seg = flip(seg0), wrongSegs = wrongSegs0.map(flip);
  const key = judge(els);
  const hypEls = els.filter((e) => !e.common), hyps = hypEls.map((e) => elText(e, V1, V2));
  const c = pick(r, concls), conclTx = elText(c, V1, V2), word = c.k === "s" ? "辺" : "角";   // 結論の種類（最後の行の「対応する辺（角）」に入る語）
  const others = ["SSS", "SAS", "ASA"].filter((k) => k !== key).map((k) => COND[k]);
  const holes = {
    seg3: { w: w.seg3, ans: `${seg} は共通`, pool: wrongSegs.map((s) => `${s} は共通`), steps: [`${t1} と ${t2} の両方にふくまれる辺は、${seg}。`, `だから、③は「${seg} は共通」。`] },
    cond: { w: w.cond, ans: COND[key], pool: [...others, "3組の角"], steps: condSteps(els, V1, V2, key) },
  };
  return {
    head: `四角形 ABCD で、${hyps.join("、")} ならば、${conclTx} である。対角線をひいて証明する。`,
    holes,
    lines: (k) => [
      `${t1} と ${t2} において`,
      `仮定より　${hyps[0]} …①　　${hyps[1]} …②`,
      k === "seg3" ? "（　） …③" : `${seg} は共通 …③`,
      `①、②、③より、${k === "cond" ? "（　）" : COND[key]}が、それぞれ等しいから　${t1}≡${t2}`,
      `合同な図形の、対応する${word}は等しいから　${conclTx}`,
    ],
  };
}
/** 証明の穴うめの問題をつくる。proof＝{ head, holes, lines(穴の名前) }。穴は、出やすさ w で選ぶ */
function proofQ(r, N, proof) {
  const keys = Object.keys(proof.holes), k = pickW(r, keys, Object.fromEntries(keys.map((x) => [x, proof.holes[x].w])));
  const h = proof.holes[k], ans = N(h.ans);
  return {
    q: N(`${proof.head}次は、その証明である。（　）にあてはまるものは？\n${proof.lines(k).join("\n")}`),
    ans,
    choices: choices4(r, ans, pickWrongs(r, ans, h.pool.map(N))),
    hint: "証明は、等しいものを3つ示す行、合同条件の行、合同から結論を導く行の順に書いた。空欄は、何を書くところかな？",
    steps: h.steps.map(N),
  };
}
const KITE_SEGS = (p, q) => [`${p}B`, `${q}B`, `${p}D`, `${q}D`, "BD"];
/** たこ形（AB＝AD、CB＝CD のような形）の証明。kind＝sss／sas／asa。p・q＝対角線の両はし */
function kiteProof(r, kind, p, q) {
  const V1 = [p, "B", q], V2 = [p, "D", q], C = SIDE(0, 2, true);
  const spec = {
    sss: { els: [SIDE(0, 1), SIDE(1, 2), C], concls: [ANG(0), ANG(2), ANG(1)], w: { seg3: 2, cond: 2 } },
    sas: { els: [SIDE(0, 1), ANG(0), C], concls: [SIDE(1, 2), ANG(1), ANG(2)], w: { seg3: 2, cond: 2 } },
    asa: { els: [ANG(0), ANG(2), C], concls: [SIDE(0, 1), SIDE(1, 2), ANG(1)], w: { seg3: 2, cond: 2 } },
  }[kind];
  return commonSideProof(r, { t1: `△${p}B${q}`, t2: `△${p}D${q}`, V1, V2, els: spec.els, concls: spec.concls, seg: `${p}${q}`, wrongSegs: KITE_SEGS(p, q), w: spec.w });
}
/** 台形のような形（AB＝DC、∠ABC＝∠DCB のような形）の証明。kind＝sas／sss／asa。三角形は △ABC と △DCB（共通な辺 BC） */
function trapProof(r, kind) {
  const V1 = ["A", "B", "C"], V2 = ["D", "C", "B"], C = SIDE(1, 2, true);
  const spec = {
    sas: { els: [SIDE(0, 1), ANG(1), C], concls: [ANG(0), ANG(2), SIDE(0, 2)] },
    sss: { els: [SIDE(0, 1), SIDE(0, 2), C], concls: [ANG(1), ANG(0), ANG(2)] },
    asa: { els: [ANG(1), ANG(2), C], concls: [SIDE(0, 1), SIDE(0, 2), ANG(0)] },
  }[kind];
  return commonSideProof(r, { t1: "△ABC", t2: "△DCB", V1, V2, els: spec.els, concls: spec.concls, seg: "BC", wrongSegs: ["AB", "AC", "DC", "DB", "AD"], w: { seg3: 2, cond: 2 } });
}

export const UNITS = [
  unit("13", {
    name: "合同を使った証明（線分や角が等しいことの証明）",
    desc: "共通・合同条件・対応する辺や角を使って、等しいことの証明を組み立てる",
    prereqs: ["J2-hk12"],
    points: [
      "証明は、「△ABC と △DEF において」と書きはじめる。仮定や、習った性質（共通・対頂角・平行線の錯角など）を根拠にして、等しいものを3つ示す。",
      "2つの三角形が同じ辺（や角）をもつとき、その辺（や角）は「共通」という。3つの等しいものが、合同条件（3組の辺／2組の辺とその間の角／1組の辺とその両端の角）のどれかにあてはまることを確かめて、合同を結論にする。",
      "合同な図形では、対応する辺や角は等しい。この性質を使って、示したい線分や角が等しいことを結論にする。図の見た目で等しいと決めるのは、根拠にならない。",
    ],
    levels: {
      // ───────── 1 基礎 ─────────
      1: [
        // 13d01a 演習（1）四角形 ABCD：AB＝AD、CB＝CD ならば ∠BAC＝∠DAC（たこ形。3組の辺・2組の辺とその間の角・1組の辺とその両端の角の、3つの証明のどれか。「CB＝CD」の空欄は、問題文に書いてあるので聞かない）
        t("13d01a", (r) => {
          const N = namer(r, 4), [p, q] = pick(r, [["A", "C"], ["C", "A"]]);
          return proofQ(r, N, kiteProof(r, pick(r, ["sss", "sas", "asa"]), p, q));
        }),
        // 13q01a 小テスト（1）四角形 ABCD：AB＝DC、∠ABC＝∠DCB ならば ∠BAC＝∠CDB（台形のような形。2組の辺とその間の角・3組の辺・1組の辺とその両端の角の、3つの証明のどれか）
        t("13q01a", (r) => {
          const N = namer(r, 4);
          return proofQ(r, N, trapProof(r, pick(r, ["sas", "sss", "asa"])));
        }),
      ],
      // ───────── 2 標準 ─────────
      2: [
        // 13d01b 演習（1）の続き：たこ形 AB＝AD、CB＝CD → △ABC≡△ADC を使って、∠DCA を求める
        t("13d01b", (r) => {
          const N = namer(r, 4), [p, q] = pick(r, [["A", "C"], ["C", "A"]]);
          const a = r(30, 70), b = r(60, 110), c = 180 - a - b;
          if (c < 15 || c === a || c === b) return { skip: true };
          return {
            q: N(`四角形 ABCD で、AB＝AD、CB＝CD である。∠B${p}${q}＝${a}°、∠${p}B${q}＝${b}° のとき、∠D${q}${p} の大きさは何度か。`),
            ans: c,
            unit: "度",
            hint: "合同になる三角形はどれかな？ 合同な図形の、対応する角はどうなる？ 三角形の内角の和は何度だったかな？",
            steps: [
              `△${p}B${q} と △${p}D${q} は、辺 ${p}${q} が共通で、${p}B＝${p}D、${q}B＝${q}D だから、3組の辺が等しく合同。`,
              `対応する角は等しいから、∠D${q}${p}＝∠B${q}${p}。`,
              `△${p}B${q} の内角の和は 180° だから、∠B${q}${p}＝180°−${a}°−${b}°＝${c}°。`,
            ].map(N),
          };
        }),
        // 13q01b 小テスト（1）の続き：AB＝DC、∠ABC＝∠DCB → △ABC≡△DCB を使って、∠DBC を求める
        t("13q01b", (r) => {
          const N = namer(r, 4);
          const b = r(60, 85), a = r(30, 75), c = 180 - a - b;
          if (c < 15 || c > b - 5 || c === a) return { skip: true };
          return {
            q: N(`四角形 ABCD で、AB＝DC、∠ABC＝∠DCB である。∠ABC＝${b}°、∠BAC＝${a}° のとき、∠DBC の大きさは何度か。`),
            ans: c,
            unit: "度",
            hint: "合同になる三角形はどれかな？ 合同な図形の、対応する角はどうなる？ 三角形の内角の和は何度だったかな？",
            steps: [
              "△ABC と △DCB は、AB＝DC、∠ABC＝∠DCB、BC が共通で、2組の辺とその間の角が等しいから合同。",
              "対応する角は等しいから、∠DBC＝∠ACB。",
              `△ABC の内角の和は 180° だから、∠ACB＝180°−${a}°−${b}°＝${c}°。よって ∠DBC＝${c}°。`,
            ].map(N),
          };
        }),
        // 13d02a 演習（2）AB∥DC：平行線の錯角で、∠OAB などと等しい角を選ぶ
        t("13d02a", (r) => {
          const N = namer(r, 4, "O");
          const [ask, ans, tr] = pick(r, [["OAB", "ODC", "AD"], ["ODC", "OAB", "AD"], ["OBA", "OCD", "BC"], ["OCD", "OBA", "BC"]]);
          const pool = ["OAB", "OBA", "OCD", "ODC", "AOB", "DOC", "AOC", "BOD"].filter((x) => x !== ask && x !== ans);
          const ws = sample(r, pool, 3);
          return {
            q: N(`線分 AD と BC が点 O で交わっている（O は、AD の間にも、BC の間にもある）。AB∥DC のとき、平行線の錯角が等しいことから、∠${ask} と必ず等しいといえる角は、次のうちどれか。`),
            ans: N(`∠${ans}`),
            choices: choices4(r, N(`∠${ans}`), ws.map((x) => N(`∠${x}`))),
            hint: "平行な2直線に1本の直線が交わるとき、等しくなる角は、どこにあったかな？ 錯角は、どの直線をはさんで反対がわにある角かな？",
            steps: [
              `直線 ${tr} が、平行な AB と DC に交わっている。`,
              `∠${ask} と ∠${ans} は、${tr} をはさんで反対がわにある角（錯角）だから、等しい。`,
              `ほかの選択肢の角は、∠${ask} と等しいとは、いえない。`,
            ].map(N),
          };
        }),
        // 13d02b 演習（2）△AOB と △DOC の合同条件（3つの等式だけを使う。3組の辺・2組の辺とその間の角・1組の辺とその両端の角・3組の角）
        t("13d02b", (r) => {
          const N = namer(r, 4, "O");
          return condQ(r, N, {
            intro: "線分 AD と BC が点 O で交わっている。△AOB と △DOC について、次の 3つだけがわかっている（ほかのことは使わない）。",
            V1: ["A", "O", "B"], V2: ["D", "O", "C"],
            kinds: { SSS: TRI.SSS, SAS: TRI.SAS, ASA: TRI.ASA, NONE: TRI.AAA },
          });
        }),
        // 13d02c 演習（2）AO＝DO の利用：AB∥DC、AB＝DC のとき、O は AD の中点でも BC の中点でもある
        t("13d02c", (r) => {
          const N = namer(r, 4, "O");
          const v = pick(r, [0, 1]);
          if (v === 0) {
            const ao = r(3, 12), bc = 2 * r(3, 12), bo = bc / 2, ans = ao + bo;
            return {
              q: N(`線分 AD と BC が点 O で交わっていて、AB∥DC、AB＝DC である。AO＝${ao}cm、BC＝${bc}cm のとき、DO の長さと BO の長さの和は何cmか。`),
              ans,
              unit: "cm",
              hint: "合同になる三角形はどれかな？ 合同な図形の、対応する辺はどうなる？",
              steps: [
                "△AOB と △DOC は、1組の辺とその両端の角（錯角）が等しいから合同。対応する辺は等しい。",
                `DO＝AO＝${ao}cm。BO＝CO で BC＝BO＋CO だから、BO＝${bc}÷2＝${bo}(cm)。`,
                `DO＋BO＝${ao}＋${bo}＝${ans}(cm)。`,
              ].map(N),
            };
          }
          const bo = r(3, 12), ad = 2 * r(3, 12), ao = ad / 2, ans = bo + ao;
          return {
            q: N(`線分 AD と BC が点 O で交わっていて、AB∥DC、AB＝DC である。BO＝${bo}cm、AD＝${ad}cm のとき、CO の長さと AO の長さの和は何cmか。`),
            ans,
            unit: "cm",
            hint: "合同になる三角形はどれかな？ 合同な図形の、対応する辺はどうなる？",
            steps: [
              "△AOB と △DOC は、1組の辺とその両端の角（錯角）が等しいから合同。対応する辺は等しい。",
              `CO＝BO＝${bo}cm。AO＝DO で AD＝AO＋DO だから、AO＝${ad}÷2＝${ao}(cm)。`,
              `CO＋AO＝${bo}＋${ao}＝${ans}(cm)。`,
            ].map(N),
          };
        }),
        // 13q02a 小テスト（2）四角形 ABCD の対角線 AC：△ABC と △ADC の合同条件（3つの等式だけを使う）
        t("13q02a", (r) => {
          const N = namer(r, 4), C = SIDE(0, 2, true);
          return condQ(r, N, {
            intro: "四角形 ABCD の対角線 AC をひく。△ABC と △ADC について、次の 3つだけがわかっている（ほかのことは使わない）。",
            V1: ["A", "B", "C"], V2: ["A", "D", "C"],
            kinds: {
              SSS: [[SIDE(0, 1), SIDE(1, 2), C]],
              SAS: [[SIDE(0, 1), ANG(0), C], [SIDE(1, 2), ANG(2), C]],
              ASA: [[ANG(0), ANG(2), C]],
              NONE: [[SIDE(0, 1), ANG(1), C], [SIDE(1, 2), ANG(1), C]],
            },
          });
        }),
        // 13q02b 小テスト（2）の続き：AB＝AD、∠BAC＝∠DAC → △ABC≡△ADC を使って、∠ACD を求める
        t("13q02b", (r) => {
          const N = namer(r, 4);
          const a = r(25, 70), b = r(50, 120), c = 180 - a - b;
          if (c < 15 || c > 85 || c === a || c === b) return { skip: true };   // c＞90° だと、C でへこんだ（ダーツ形の）四角形になるので、さける
          return {
            q: N(`四角形 ABCD で、AB＝AD、∠BAC＝∠DAC である。∠BAC＝${a}°、∠ABC＝${b}° のとき、∠ACD の大きさは何度か。`),
            ans: c,
            unit: "度",
            hint: "合同になる三角形はどれかな？ 合同な図形の、対応する角はどうなる？ 三角形の内角の和は何度だったかな？",
            steps: [
              "△ABC と △ADC は、AB＝AD、∠BAC＝∠DAC、AC が共通で、2組の辺とその間の角が等しいから合同。",
              "対応する角は等しいから、∠ACD＝∠ACB。",
              `△ABC の内角の和は 180° だから、∠ACB＝180°−${a}°−${b}°＝${c}°。よって ∠ACD＝${c}°。`,
            ].map(N),
          };
        }),
      ],
      // ───────── 3 応用 ─────────
      3: [
        // 13d03a 演習（3）AB＝AC、AD＝AE：2組の辺とその間の角のために、等しいといえばよい角を選ぶ
        t("13d03a", (r) => {
          const N = namer(r, 5), [x, y] = pick(r, [["D", "E"], ["E", "D"]]);
          const V1 = ["A", "B", y], V2 = ["A", "C", x];
          const ang = (i) => `∠${angName(V1, i)}＝∠${angName(V2, i)}`;
          const ans = ang(0);
          const ws = [ang(1), ang(2), `B${y}＝C${x}`];
          return {
            q: N(`AB＝AC の △ABC で、辺 AB 上に点 ${x}、辺 AC 上に点 ${y} を、A${x}＝A${y} となるようにとる。B${y}＝C${x} を証明するために、△AB${y} と △AC${x} の合同を、「2組の辺とその間の角」を使って示す。AB＝AC、A${y}＝A${x} のほかに、等しいことを示せばよいものは、次のうちどれか。`),
            ans: N(ans),
            choices: choices4(r, N(ans), ws.map(N)),
            hint: "等しいとわかっている 2組の辺は、どの点から出ているかな？",
            steps: [
              `等しい辺 AB と A${y}（AC と A${x}）は、どちらも点 A から出ている。その間の角は、∠BA${y}（∠CA${x}）。`,
              `∠BA${y} も ∠CA${x} も、△ABC の ∠A と同じ角（共通）だから、∠BA${y}＝∠CA${x}。`,
              "ほかの選択肢は、2辺の間の角ではない、または、示したい結論そのものだから、使えない。",
            ].map(N),
          };
        }),
        // 13d03b 演習（3）△ABE と △ACD の合同条件（3つの等式だけを使う）
        t("13d03b", (r) => {
          const N = namer(r, 5), [x, y] = pick(r, [["D", "E"], ["E", "D"]]);
          return condQ(r, N, {
            intro: `△AB${y} と △AC${x} について、次の 3つだけがわかっている（ほかのことは使わない）。`,
            V1: ["A", "B", y], V2: ["A", "C", x],
            kinds: { SSS: TRI.SSS, SAS: TRI.SAS, ASA: TRI.ASA, NONE: [...TRI.SSA, ...TRI.SSA, ...TRI.AAA] },
          });
        }),
        // 13d03c 演習（3）の続き：△ABE≡△ACD の対応する角と、一直線の角・三角形の内角の和
        t("13d03c", (r) => {
          const N = namer(r, 5), [x, y] = pick(r, [["D", "E"], ["E", "D"]]);
          const mode = pick(r, ["ext", "adc", "bdc"]);
          const head = `AB＝AC の △ABC で、辺 AB 上に点 ${x}、辺 AC 上に点 ${y} を、A${x}＝A${y} となるようにとる。`;
          const cong = `△AB${y} と △AC${x} は、AB＝AC、A${y}＝A${x}、∠A が共通で、2組の辺とその間の角が等しいから合同。`;
          if (mode === "ext") {
            const a = r(55, 150);
            if (a === 90) return { skip: true };
            const ans = 180 - a;
            return {
              q: N(`${head}∠A${y}B＝${a}° のとき、∠B${x}C の大きさは何度か。`),
              ans,
              unit: "度",
              hint: "合同になる三角形はどれかな？ 合同な図形の、対応する角はどうなる？ 一直線の角は何度だったかな？",
              steps: [cong, `対応する角は等しいから、∠A${x}C＝∠A${y}B＝${a}°。`, `A、${x}、B は一直線上にあるから、∠B${x}C＝180°−${a}°＝${ans}°。`].map(N),
            };
          }
          const al = r(20, 90), b = r(10, Math.floor((180 - al) / 2) - 5), v = 180 - al - b;
          if (b < 10 || v === al || v === b) return { skip: true };
          const ask = mode === "adc" ? `∠A${x}C` : `∠B${x}C`, ans = mode === "adc" ? v : al + b;
          return {
            q: N(`${head}∠BAC＝${al}°、∠AB${y}＝${b}° のとき、${ask} の大きさは何度か。`),
            ans,
            unit: "度",
            hint: "合同になる三角形はどれかな？ 合同な図形の、対応する角はどうなる？ 三角形の内角の和は何度だったかな？",
            steps: mode === "adc"
              ? [cong, `△AB${y} の内角の和は 180° だから、∠A${y}B＝180°−${al}°−${b}°＝${v}°。`, `対応する角は等しいから、∠A${x}C＝∠A${y}B＝${v}°。`].map(N)
              : [cong, `△AB${y} の内角の和は 180° だから、∠A${y}B＝180°−${al}°−${b}°＝${v}°。対応する角は等しいから、∠A${x}C＝${v}°。`, `A、${x}、B は一直線上にあるから、∠B${x}C＝180°−${v}°＝${ans}°。`].map(N),
          };
        }),
        // 13d04a 演習（4）①正方形で BE＝CF：AB＝BC・∠ABE＝∠BCF・BE＝CF の根拠、または合同条件（3つの等式だけを使う）
        t("13d04a", (r) => {
          const N = namer(r, 6);
          const head = "正方形 ABCD の辺 BC 上に点 E、辺 CD 上に点 F を、BE＝CF となるようにとる。AE＝BF を証明するために、△ABE と △BCF の合同を示す。";
          const k = pick(r, ["side", "angle", "hyp", "cond"]);
          if (k === "cond") {
            return condQ(r, N, {
              intro: `${head}次の 3つだけがわかっている（ほかのことは使わない）。`,
              V1: ["A", "B", "E"], V2: ["B", "C", "F"],
              kinds: { SSS: TRI.SSS, SAS: TRI.SAS, ASA: TRI.ASA },
            });
          }
          // 3つの根拠（辺・角・仮定）は、どれも、どこかで正解になる。もう 1つは、いつも誤答
          const U = { side: "正方形の4つの辺は、すべて等しいから", angle: "正方形の4つの角は、すべて 90° だから", hyp: "仮定で BE＝CF とされているから" };
          const far = ["正方形の対角線の長さは等しいから", "平行線の錯角は等しいから", "合同な図形の、対応する辺は等しいから", "対頂角は等しいから"];
          const eq = { side: "AB＝BC", angle: "∠ABE＝∠BCF", hyp: "BE＝CF" }[k];
          const ans = N(U[k]);
          const pool = [...["side", "angle", "hyp"].filter((x) => x !== k).map((x) => U[x]), pick(r, far)].map(N);
          return {
            q: N(`${head}${eq} と書く根拠として、正しいものは、次のうちどれか。`),
            ans,
            choices: choices4(r, ans, pool),
            hint: "証明の1行ごとに、等しいと書いたわけがあったね。ここでは、何がわけになるかな？",
            steps: {
              side: ["AB と BC は、正方形 ABCD の辺。正方形の4つの辺は、すべて等しい。", "だから、根拠は「正方形の4つの辺は、すべて等しいから」。"],
              angle: ["∠ABE は ∠ABC（正方形の角）と同じ角で 90°、∠BCF は ∠BCD（正方形の角）と同じ角で 90°。", "だから、根拠は「正方形の4つの角は、すべて 90° だから」。"],
              hyp: ["BE＝CF は、問題文で「BE＝CF となるようにとる」と言っていること（仮定）。", "だから、根拠は「仮定で BE＝CF とされているから」。"],
            }[k].map(N),
          };
        }),
        // 13q03a 小テスト（3）チャレンジ：外側の正三角形 ABD、ACE：∠BAE（または ∠DAC）＝∠BAC＋60°
        t("13q03a", (r) => {
          const N = namer(r, 5);
          const a = r(25, 115), ans = a + 60, ask = pick(r, ["BAE", "DAC"]);
          return {
            q: N(`△ABC の外側に、辺 AB、AC を1辺とする正三角形 ABD、ACE をつくる。∠BAC＝${a}° のとき、∠${ask} の大きさは何度か。`),
            ans,
            unit: "度",
            hint: "正三角形の1つの角は何度かな？ 求める角は、どんな角を合わせた角かな？",
            steps: ask === "BAE"
              ? ["正三角形 ACE の1つの角は 60° だから、∠CAE＝60°。", `E は、AC について B と反対がわにあるから、∠BAE＝∠BAC＋∠CAE＝${a}°+60°＝${ans}°。`].map(N)
              : ["正三角形 ABD の1つの角は 60° だから、∠DAB＝60°。", `D は、AB について C と反対がわにあるから、∠DAC＝∠DAB＋∠BAC＝60°+${a}°＝${ans}°。`].map(N),
          };
        }),
      ],
      // ───────── 4 入試レベル ─────────
      4: [
        // 13d04b 演習（4）②正方形：BE＝CF のとき ∠AGB（正n角形にひろげて、360°÷n）
        t("13d04b", (r) => {
          const n = pick(r, [3, 4, 4, 5, 6, 8, 10]);
          const N = namer(r, n + 3);
          const c = (i) => CAN[i], V = (i) => c(i % n), X = c(n), Y = c(n + 1), G = c(n + 2);
          const vs = Array.from({ length: n }, (_, i) => c(i)).join("");
          const inner = 180 * (n - 2) / n, ans = 360 / n;
          return {
            q: N(`${polyName(n)} ${vs} の辺 ${V(1)}${V(2)} 上に点 ${X}、辺 ${V(2)}${V(3)} 上に点 ${Y} を、${V(1)}${X}＝${V(2)}${Y} となるようにとり、${V(0)}${X} と ${V(1)}${Y} の交点を ${G} とする。∠${V(0)}${G}${V(1)} の大きさは何度か。`),
            ans,
            unit: "度",
            hint: "仮定の等しい辺は、どの三角形の辺かな？ その三角形と合同になる三角形は、見つかるかな？",
            steps: [
              `△${V(0)}${V(1)}${X} と △${V(1)}${V(2)}${Y} で、${V(0)}${V(1)}＝${V(1)}${V(2)}、∠${V(0)}${V(1)}${X}＝∠${V(1)}${V(2)}${Y}（${polyName(n)}の内角）、${V(1)}${X}＝${V(2)}${Y} だから、2組の辺とその間の角が等しく合同。`,
              `対応する角は等しいから、∠${V(1)}${V(0)}${G}＝∠${V(2)}${V(1)}${G}。だから ∠${V(1)}${V(0)}${G}＋∠${V(0)}${V(1)}${G}＝∠${V(2)}${V(1)}${G}＋∠${V(0)}${V(1)}${G}＝∠${V(0)}${V(1)}${V(2)}。`,
              `${polyName(n)}の1つの内角は 180°×(${n}−2)÷${n}＝${inner}° だから、∠${V(1)}${V(0)}${G}＋∠${V(0)}${V(1)}${G}＝${inner}°。`,
              `△${V(0)}${V(1)}${G} の内角の和は 180° だから、∠${V(0)}${G}${V(1)}＝180°−${inner}°＝${ans}°。`,
            ].map(N),
          };
        }),
        // 13q03b 小テスト（3）チャレンジ：AB＝AD・AE＝AC・∠BAE＝∠DAC の根拠を選ぶ
        t("13q03b", (r) => {
          const N = namer(r, 5), k = pick(r, ["AB", "AE", "ang"]);
          const head = "△ABC の外側に、辺 AB、AC を1辺とする正三角形 ABD、ACE をつくる。BE＝DC を証明するために、△ABE と △ADC の合同を示す。";
          // 3つの根拠は、どれも、どこかで正解になる。のこり 1つは、いつも誤答（長さ・かたちを、正解にそろえる）
          const U = { AB: "正三角形 ABD の 3つの辺は、すべて等しいから", AE: "正三角形 ACE の 3つの辺は、すべて等しいから", ang: "∠BAE も ∠DAC も、∠BAC＋60° だから" };
          const farSide = ["∠BAE と ∠DAC は、向かい合う角（対頂角）だから", "AB と DC が平行で、錯角が等しいから", "結論の BE＝DC を、そのまま使えるから", "∠BAE と ∠DAC は、2つの三角形に共通の角だから"];
          const farAng = [...farSide, "∠BAE は ∠BAC＋60°、∠DAC は ∠BAC だから", "∠BAE は ∠BAC＋60°、∠DAC は ∠BAC−60° だから"];
          const eq = { AB: "AB＝AD", AE: "AE＝AC", ang: "∠BAE＝∠DAC" }[k];
          const lead = k === "ang" ? `AB＝AD、AE＝AC のほかに、∠BAE＝∠DAC をいう。この ∠BAE＝∠DAC が成り立つ理由として、` : `${eq} と書く根拠として、`;
          const ans = N(U[k]);
          const pool = [...["AB", "AE", "ang"].filter((x) => x !== k).map((x) => U[x]), pick(r, k === "ang" ? farAng : farSide)].map(N);
          return {
            q: N(`${head}${lead}正しいものは、次のうちどれか。`),
            ans,
            choices: choices4(r, ans, pool),
            hint: k === "ang" ? N("正三角形の1つの角は何度だったかな？ ∠BAE や ∠DAC は、どんな角をつなぎ合わせてできているかな？") : "証明の1行ごとに、等しいと書いたわけがあったね。ここでは、何がわけになるかな？",
            steps: k === "ang"
              ? [
                "正三角形の1つの角は 60° だから、∠CAE＝60°、∠DAB＝60°。",
                "E は AC について B と反対がわ、D は AB について C と反対がわにあるから、∠BAE＝∠BAC＋60°、∠DAC＝60°＋∠BAC。",
                "よって ∠BAE＝∠DAC。ほかの理由は、この場合には当てはまらない。",
              ].map(N)
              : [`${eq.split("＝")[0]} と ${eq.split("＝")[1]} は、正三角形 ${k === "AB" ? "ABD" : "ACE"} の辺。正三角形の3つの辺は、すべて等しい。`, `だから、根拠は「正三角形 ${k === "AB" ? "ABD" : "ACE"} の 3つの辺は、すべて等しいから」。`].map(N),
          };
        }),
        // 13q03c 小テスト（3）チャレンジ：△ABE≡△ADC の対応する角と、三角形の内角の和：∠ACD＝120°−∠BAC−∠ABE
        t("13q03c", (r) => {
          const N = namer(r, 5);
          const a = r(30, 70), x = r(10, 40), ans = 120 - a - x;
          if (ans < 10) return { skip: true };
          return {
            q: N(`△ABC の外側に、辺 AB、AC を1辺とする正三角形 ABD、ACE をつくる。∠BAC＝${a}°、∠ABE＝${x}° のとき、∠ACD の大きさは何度か。`),
            ans,
            unit: "度",
            hint: "合同になる三角形の組は、見つかるかな？ 合同な図形の、対応する角は等しいね。",
            steps: [
              "△ABE と △ADC は、AB＝AD、AE＝AC、∠BAE＝∠DAC（どちらも ∠BAC+60°）で、2組の辺とその間の角が等しく合同。",
              `∠BAE＝${a}°+60°＝${a + 60}° だから、△ABE の内角の和より、∠AEB＝180°−${a + 60}°−${x}°＝${ans}°。`,
              `対応する角は等しいから、∠ACD＝∠AEB＝${ans}°。`,
            ].map(N),
          };
        }),
      ],
    },
  }),
];

export const SKIPPED = [];
