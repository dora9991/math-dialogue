// ============================================================
// heikou-13.js — 平行と合同 第13時「合同を使って、線分や角が等しいことを証明しよう」
//   ikkan の演習プリント（heikou-13.dr.1〜4）・小テスト（heikou-13.qz.1〜3）を、コツコツくんのテンプレートにしたもの。
//   テンプレート id＝「13」＋ d（演習）／q（小テスト）＋ ikkan の問題の番号（＋ 型ごとに a, b…）。例：13d01a ＝ heikou-13.dr.1 の穴うめ（4択）
//   図は出せないので、頂点の名前・位置関係・等しい辺や角（仮定）を、すべて問題文に書いた。「右の図」とは書かない。
//   証明は書けないので、(a) 証明の穴うめ（共通・合同条件・対応する辺や角）を選ぶ4択、(b) 「どの角が等しければよいか」「どの根拠か」を選ぶ4択、
//   (c) 合同から出る角の大きさ（数値入力）、に直した。証明の全文を書かせる問題は、どれも (a)(b)(c) の形で移した（SKIPPED は 0）。
//   角の大きさ・合同条件は、問題文の数字・等しいものの組から計算して出す（手で書かない）。合同条件は judge（辺・角の位置から判定）で出す。
// ============================================================
import { t, pick, choices4, sample } from "../kit.js";
import { unitFor } from "../unit-kit.js";

const unit = unitFor("heikou");

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

const kan = (n) => (n < 10 ? "〇一二三四五六七八九"[n] : n < 20 ? "十" + (n % 10 ? "一二三四五六七八九"[n % 10 - 1] : "") : "二三四五六七八九"[Math.floor(n / 10) - 2] + "十" + (n % 10 ? "一二三四五六七八九"[n % 10 - 1] : ""));
const polyName = (n) => (n === 3 ? "正三角形" : n === 4 ? "正方形" : `正${kan(n)}角形`);

// 合同条件
const COND = { SSS: "3組の辺", SAS: "2組の辺とその間の角", ASA: "1組の辺とその両端の角", NONE: "どれにもあてはまらない" };
const condChoices = (r, key) => choices4(r, COND[key], Object.keys(COND).filter((k) => k !== key).map((k) => COND[k]));
/** 三角形の頂点の番号 0, 1, 2 で、等しいものを言う。辺 SIDE(i, j)（頂点 i と j をむすぶ辺）、角 ANG(i)（頂点 i の角） */
const SIDE = (i, j) => ({ k: "s", i, j });
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
const elOne = (e, V) => (e.k === "s" ? V[e.i] + V[e.j] : "∠" + angName(V, e.i));
/** 等しいもの e を、「AB＝DC」「∠OAB＝∠ODC」の形の文字にする（V1、V2＝2つの三角形の頂点の並び） */
const elText = (e, V1, V2) => `${elOne(e, V1)}＝${elOne(e, V2)}`;

/** 証明の穴うめの問題。holes＝穴の候補 { 名前: { ans, pool（誤答の候補）, steps } }。lines(H)＝証明の行（H(名前) は、その穴なら「（　）」、そうでなければ正しいことば） */
function fillQ(r, N, head, lines, holes) {
  const key = pick(r, Object.keys(holes));
  const H = (k) => (k === key ? "（　）" : holes[k].ans);
  const h = holes[key];
  return {
    q: N(`${head}次は、その証明である。（　）にあてはまるものは？\n${lines(H).join("\n")}`),
    ans: h.ans,
    choices: choices4(r, h.ans, sample(r, h.pool, 3)),
    hint: "証明は、仮定や共通を示す行、合同条件の行、合同から結論を導く行の順に書いた。空欄は、どの行にあるかな？",
    steps: h.steps.map(N),
  };
}
/** 穴の候補（共通／合同条件／対応する辺や角）を、まとめてつくる */
const holeCommon = (side, tri1, tri2) => ({ ans: "共通", pool: ["仮定", "結論", "対頂角", "同位角", "錯角"], steps: [`${tri1} と ${tri2} は、辺 ${side} をどちらもふくんでいる。`, "このように、2つの三角形が同じ辺をもつとき、その辺は「共通」という。"] });
const holeCond = (key, say) => ({ ans: COND[key], pool: [...["SSS", "SAS", "ASA"].filter((k) => k !== key).map((k) => COND[k]), "3組の角"], steps: [...say, `だから、合同条件は「${COND[key]}」。`] });
const holeCorr = (word, concl, tri1, tri2) => ({ ans: word, pool: ["辺", "角", "頂点", "直線", "面"].filter((x) => x !== word), steps: [`${tri1}≡${tri2} だから、対応する辺や角は等しい。`, `結論の ${concl} は${word}の等しさだから、「対応する${word}は等しい」を使う。`] });

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
        // 13d01a 演習（1）四角形 ABCD：AB＝AD、CB＝CD ならば ∠BAC＝∠DAC（空欄「共通」「3組の辺」「角」のどれかを聞く。「CB＝CD」の空欄は、問題文に書いてあるので聞かない）
        t("13d01a", (r) => {
          const N = namer(r, 4), [p, q] = pick(r, [["A", "C"], ["C", "A"]]);
          const t1 = `△${p}B${q}`, t2 = `△${p}D${q}`, concl = `∠B${p}${q}＝∠D${p}${q}`;
          return fillQ(r, N, `四角形 ABCD で、${p}B＝${p}D、${q}B＝${q}D ならば、${concl} である。対角線 ${p}${q} をひいて証明する。`,
            (H) => [
              `${t1} と ${t2} において`,
              `仮定より　${p}B＝${p}D …①　　${q}B＝${q}D …②`,
              `${p}${q} は${H("common")} …③`,
              `①、②、③より、${H("cond")}が、それぞれ等しいから　${t1}≡${t2}`,
              `合同な図形の、対応する${H("corr")}は等しいから　${concl}`,
            ],
            {
              common: holeCommon(`${p}${q}`, t1, t2),
              cond: holeCond("SSS", [`等しいのは、${p}B＝${p}D、${q}B＝${q}D、${p}${q}（共通）の、辺3組。`]),
              corr: holeCorr("角", concl, t1, t2),
            });
        }),
        // 13q01a 小テスト（1）四角形 ABCD：AB＝DC、∠ABC＝∠DCB ならば ∠BAC＝∠CDB（空欄「共通」「2組の辺とその間の角」「角」）
        t("13q01a", (r) => {
          const N = namer(r, 4), c = pick(r, [["∠BAC＝∠CDB", "角"], ["∠ACB＝∠DBC", "角"], ["AC＝DB", "辺"]]);
          const t1 = "△ABC", t2 = "△DCB";
          return fillQ(r, N, `四角形 ABCD で、AB＝DC、∠ABC＝∠DCB ならば、${c[0]} である。対角線 AC、DB をひいて証明する。`,
            (H) => [
              `${t1} と ${t2} において`,
              "仮定より　AB＝DC …①　　∠ABC＝∠DCB …②",
              `BC は${H("common")} …③`,
              `①、②、③より、${H("cond")}が、それぞれ等しいから　${t1}≡${t2}`,
              `合同な図形の、対応する${H("corr")}は等しいから　${c[0]}`,
            ],
            {
              common: holeCommon("BC", t1, t2),
              cond: holeCond("SAS", ["等しいのは、AB＝DC、∠ABC＝∠DCB、BC（共通）。", "∠ABC は辺 AB と BC の間の角、∠DCB は辺 DC と CB の間の角。"]),
              corr: holeCorr(c[1], c[0], t1, t2),
            });
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
        // 13d02b 演習（2）△AOB と △DOC の合同条件（錯角から ASA ／ 対頂角から SAS）
        t("13d02b", (r) => {
          const N = namer(r, 4, "O"), V1 = ["A", "O", "B"], V2 = ["D", "O", "C"];
          const v = pick(r, ["asa", "sas"]);
          const els = v === "asa" ? [SIDE(0, 2), ANG(0), ANG(2)] : [SIDE(0, 1), SIDE(2, 1), ANG(1)];
          const key = judge(els), tx = els.map((e) => elText(e, V1, V2));
          const head = v === "asa"
            ? "線分 AD と BC が点 O で交わっていて、AB∥DC、AB＝DC である。平行線の錯角は等しいから、∠OAB＝∠ODC、∠ABO＝∠DCO である。"
            : "線分 AD と BC が点 O で交わっていて、AO＝DO、BO＝CO である。対頂角は等しいから、∠AOB＝∠DOC である。";
          return {
            q: N(`${head}△AOB と △DOC の合同条件は、次のうちどれか。`),
            ans: COND[key],
            choices: condChoices(r, key),
            hint: "三角形の合同条件は3つ。それぞれ、どんな条件だったかな？",
            steps: [
              `等しいのは、${tx.join("、")}。`,
              v === "asa" ? "辺 AB の両端の角（∠OAB と ∠ABO）が、それぞれ等しい。" : "∠AOB は、辺 AO と BO の間の角（∠DOC は、DO と CO の間の角）。",
              `だから、合同条件は「${COND[key]}」。`,
            ].map(N),
          };
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
        // 13q02a 小テスト（2）四角形 ABCD：AB＝AD、∠BAC＝∠DAC → 合同条件（間の角なら 2組の辺とその間の角、間にない角なら あてはまらない）
        t("13q02a", (r) => {
          const N = namer(r, 4);
          const v = pick(r, ["sas", "none"]);
          const els = v === "sas" ? [SIDE(0, 1), SIDE(2, 0), ANG(0)] : [SIDE(0, 1), SIDE(2, 0), ANG(1)];
          const key = judge(els);
          const ang = els.find((e) => e.k === "a");
          const angTx = `∠${angName(["A", "B", "C"], ang.i)}＝∠${angName(["A", "D", "C"], ang.i)}`;
          return {
            q: N(v === "sas"
              ? `四角形 ABCD で、AB＝AD、∠BAC＝∠DAC ならば、BC＝DC である。△ABC と △ADC について、AB＝AD、${angTx} と、辺 AC が共通であることを使う。三角形の合同条件のうち、あてはまるものは？`
              : `四角形 ABCD で、AB＝AD、∠ABC＝∠ADC である。△ABC と △ADC について、AB＝AD、${angTx} と、辺 AC が共通であることを使う。三角形の合同条件のうち、あてはまるものは？`),
            ans: COND[key],
            choices: condChoices(r, key),
            hint: "三角形の合同条件は3つ。それぞれ、どんな条件だったかな？",
            steps: [
              `等しいのは、辺 AB と AD、辺 AC（共通）、${angTx}。`,
              v === "sas" ? "∠BAC は、辺 AB と AC の間の角（∠DAC は、辺 AD と AC の間の角）。" : "∠ABC は、辺 AB と AC の間の角ではない（間の角は ∠BAC）。",
              key === "SAS" ? "だから、合同条件は「2組の辺とその間の角」。" : "だから、3つの合同条件のどれにもあてはまらない。",
            ].map(N),
          };
        }),
        // 13q02b 小テスト（2）の続き：AB＝AD、∠BAC＝∠DAC → △ABC≡△ADC を使って、∠ACD を求める
        t("13q02b", (r) => {
          const N = namer(r, 4);
          const a = r(25, 70), b = r(50, 120), c = 180 - a - b;
          if (c < 15 || c === a || c === b) return { skip: true };
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
          const ans = `∠${angName(V1, 0)}＝∠${angName(V2, 0)}`;
          const ws = [`∠${angName(V1, 1)}＝∠${angName(V2, 1)}`, `∠${angName(V1, 2)}＝∠${angName(V2, 2)}`, `B${y}＝C${x}`];
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
        // 13d03b 演習（3）3つの等しいものから、合同条件を選ぶ（間の角が共通なら SAS、間にない角なら あてはまらない）
        t("13d03b", (r) => {
          const N = namer(r, 5), [x, y] = pick(r, [["D", "E"], ["E", "D"]]);
          const V1 = ["A", "B", y], V2 = ["A", "C", x];
          const ang = pick(r, [0, 0, 1, 2]);
          const els = [SIDE(0, 1), SIDE(2, 0), ANG(ang)], key = judge(els);
          const angTx = elText(ANG(ang), V1, V2);
          return {
            q: N(`AB＝AC の △ABC で、辺 AB 上に点 ${x}、辺 AC 上に点 ${y} を、A${x}＝A${y} となるようにとる。△AB${y} と △AC${x} について、AB＝AC、A${y}＝A${x}、${angTx} がわかっているとき、三角形の合同条件のうち、あてはまるものは？`),
            ans: COND[key],
            choices: condChoices(r, key),
            hint: "三角形の合同条件は3つ。それぞれ、どんな条件だったかな？",
            steps: [
              `等しいのは、辺 AB と AC、辺 A${y} と A${x}、${angTx}。`,
              ang === 0 ? `∠BA${y} は、辺 AB と A${y} の間の角（∠CA${x} は、辺 AC と A${x} の間の角）。` : `${angTx.split("＝")[0]} は、辺 AB と A${y} の間の角ではない（間の角は ∠BA${y}）。`,
              key === "SAS" ? "だから、合同条件は「2組の辺とその間の角」。" : "だから、3つの合同条件のどれにもあてはまらない。",
            ].map(N),
          };
        }),
        // 13d03c 演習（3）の続き：∠AEB から ∠BDC（△ABE≡△ACD の対応する角と、一直線の角）
        t("13d03c", (r) => {
          const N = namer(r, 5), [x, y] = pick(r, [["D", "E"], ["E", "D"]]);
          const a = r(55, 150), ans = 180 - a;
          if (a === 90) return { skip: true };
          return {
            q: N(`AB＝AC の △ABC で、辺 AB 上に点 ${x}、辺 AC 上に点 ${y} を、A${x}＝A${y} となるようにとる。∠A${y}B＝${a}° のとき、∠B${x}C の大きさは何度か。`),
            ans,
            unit: "度",
            hint: "合同になる三角形はどれかな？ 合同な図形の、対応する角はどうなる？ 一直線の角は何度だったかな？",
            steps: [
              `△AB${y} と △AC${x} は、AB＝AC、A${y}＝A${x}、∠A が共通で、2組の辺とその間の角が等しいから合同。`,
              `対応する角は等しいから、∠A${x}C＝∠A${y}B＝${a}°。`,
              `A、${x}、B は一直線上にあるから、∠B${x}C＝180°−${a}°＝${ans}°。`,
            ].map(N),
          };
        }),
        // 13d04a 演習（4）①正方形で BE＝CF：AB＝BC・∠ABE＝∠BCF の根拠と、合同条件
        t("13d04a", (r) => {
          const N = namer(r, 6);
          const head = "正方形 ABCD の辺 BC 上に点 E、辺 CD 上に点 F を、BE＝CF となるようにとる。AE＝BF を証明するために、△ABE と △BCF の合同を示す。";
          const k = pick(r, ["side", "angle", "cond"]);
          if (k === "cond") {
            const els = [SIDE(0, 1), SIDE(1, 2), ANG(1)], key = judge(els);   // △ABE と △BCF：AB＝BC、BE＝CF、∠ABE＝∠BCF
            return {
              q: N(`${head}AB＝BC、∠ABE＝∠BCF、BE＝CF がいえるとき、合同条件は、次のうちどれか。`),
              ans: COND[key],
              choices: condChoices(r, key),
              hint: "三角形の合同条件は3つ。それぞれ、どんな条件だったかな？",
              steps: [
                "等しいのは、AB＝BC、BE＝CF、∠ABE＝∠BCF。",
                "∠ABE は辺 AB と BE の間の角、∠BCF は辺 BC と CF の間の角。",
                `だから、合同条件は「${COND[key]}」。`,
              ].map(N),
            };
          }
          const side = k === "side";
          const ans = side ? "正方形の4つの辺は等しいから" : "正方形の4つの角は、すべて 90° だから";
          const pool = side
            ? ["正方形の対角線の長さは等しいから", "仮定の BE＝CF があるから", "△ABE≡△BCF だから", "AB と BC は共通の辺だから", "平行線の錯角は等しいから"]
            : ["正方形の対角線の長さは等しいから", "仮定の BE＝CF があるから", "△ABE≡△BCF だから", "∠ABE と ∠BCF は共通の角だから", "∠ABE と ∠BCF は対頂角だから"];
          return {
            q: N(`${head}${side ? "AB＝BC" : "∠ABE＝∠BCF"} と書く根拠として、正しいものは、次のうちどれか。`),
            ans: N(ans),
            choices: choices4(r, N(ans), sample(r, pool, 3).map(N)),
            hint: "証明の1行ごとに、等しいと書いたわけがあったね。ここでは、何がわけになるかな？",
            steps: side
              ? ["AB と BC は、正方形 ABCD の辺。正方形の4つの辺は、すべて等しい。", "だから、根拠は「正方形の4つの辺は等しいから」。"].map(N)
              : ["∠ABE は ∠ABC（正方形の角）と同じ角で 90°、∠BCF は ∠BCD（正方形の角）と同じ角で 90°。", "だから、根拠は「正方形の4つの角は、すべて 90° だから」。"].map(N),
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
          const hint = "証明の1行ごとに、等しいと書いたわけがあったね。ここでは、何がわけになるかな？";
          if (k !== "ang") {
            const eq = k === "AB" ? "AB＝AD" : "AE＝AC", ans = N(k === "AB" ? "正三角形 ABD の辺だから" : "正三角形 ACE の辺だから");
            const ws = [k === "AB" ? "正三角形 ACE の辺だから" : "正三角形 ABD の辺だから", "結論の BE＝DC があるから", "共通の辺だから", "対頂角は等しいから", "平行線の錯角は等しいから"];
            const tri = k === "AB" ? "ABD" : "ACE";
            return {
              q: N(`${head}${eq} と書く根拠として、正しいものは、次のうちどれか。`),
              ans,
              choices: choices4(r, ans, [N(ws[0]), ...sample(r, ws.slice(1), 2).map(N)]),
              hint,
              steps: [`${eq.split("＝")[0]} と ${eq.split("＝")[1]} は、正三角形 ${tri} の辺。正三角形の3つの辺は、すべて等しい。`, `だから、根拠は「正三角形 ${tri} の辺だから」。`].map(N),
            };
          }
          const ans = N("∠BAE＝∠BAC＋60°、∠DAC＝60°＋∠BAC だから");
          const near = ["∠BAE＝∠BAC＋60°、∠DAC＝∠BAC だから", "∠BAE＝∠BAC＋60°、∠DAC＝∠BAC−60° だから"], far = ["∠BAE と ∠DAC は、対頂角だから", "∠BAE と ∠DAC は、共通の角だから", "AB＝AD、AC＝AE だから", "平行線の錯角は等しいから"];
          const ws = [pick(r, near), ...sample(r, far, 2)].map(N);   // 60° をふくむ誤答を1つ入れる（正解だけが 60° をふくまないように）。どの誤答も、2つの角が等しくなる理由にはならない
          return {
            q: N(`${head}AB＝AD、AE＝AC のほかに、∠BAE＝∠DAC をいう。この ∠BAE＝∠DAC が成り立つ理由として、正しいものは、次のうちどれか。`),
            ans,
            choices: choices4(r, ans, ws),
            hint: N("正三角形の1つの角は何度だったかな？ ∠BAE や ∠DAC は、どんな角をつなぎ合わせてできているかな？"),
            steps: [
              "正三角形の1つの角は 60° だから、∠CAE＝60°、∠DAB＝60°。",
              "E は AC について B と反対がわ、D は AB について C と反対がわにあるから、∠BAE＝∠BAC＋60°、∠DAC＝60°＋∠BAC。",
              "よって ∠BAE＝∠DAC。ほかの理由は、この場合には当てはまらない。",
            ].map(N),
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
