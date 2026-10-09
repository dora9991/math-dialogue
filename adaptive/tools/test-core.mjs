// ============================================================
// test-core.mjs — コア部品のテスト（依存ライブラリなし）
//
//   node adaptive/tools/test-core.mjs
//
//  ・分数の厳密計算／入力文字列の解釈／多項式
//  ・採点（judge）
//  ・学習者モデル：サンプリング結果を、小さなグラフの厳密計算（全列挙）と突き合わせる
// ============================================================
import * as Qm from "../js/core/rational.js";
import { Poly, P } from "../js/core/poly.js";
import { judge, num, choice, fields, makeItem } from "../js/core/items.js";
import { Learner, replay } from "../js/core/model.js";
import { tq, tmixed } from "../js/core/tex.js";
import { makeRng } from "../js/core/rng.js";

let pass = 0;
let failCount = 0;
function ok(cond, msg) {
  if (cond) pass++;
  else {
    failCount++;
    console.log("  ✗ FAIL:", msg);
  }
}
function eq(a, b, msg) {
  ok(JSON.stringify(a) === JSON.stringify(b), `${msg}  期待=${JSON.stringify(b)} 実際=${JSON.stringify(a)}`);
}
function near(a, b, tol, msg) {
  ok(Math.abs(a - b) <= tol, `${msg}  期待≈${b.toFixed(3)} 実際=${a.toFixed(3)} (許容${tol})`);
}
const section = (t) => console.log(`\n■ ${t}`);

// ── rational ─────────────────────────────────────────
section("有理数・入力の解釈");
eq(Qm.Q(6, -8), { n: -3, d: 4 }, "Q(6,-8) は既約で分母が正");
eq(Qm.add(Qm.Q(1, 2), Qm.Q(1, 3)), { n: 5, d: 6 }, "1/2+1/3=5/6");
eq(Qm.div(Qm.Q(3, 4), Qm.Q(3, 8)), { n: 2, d: 1 }, "3/4÷3/8=2");
eq(Qm.pow(Qm.Q(-2), 3), { n: -8, d: 1 }, "(-2)^3");
eq(Qm.pow(Qm.Q(2), -2), { n: 1, d: 4 }, "2^-2");
eq(Qm.parseInput("0.75"), { n: 3, d: 4 }, '"0.75"');
eq(Qm.parseInput("３／４"), { n: 3, d: 4 }, "全角の分数");
eq(Qm.parseInput("−3/6"), { n: -1, d: 2 }, "全角マイナス＋約分される分数");
eq(Qm.parseInput(".5"), { n: 1, d: 2 }, '".5"');
eq(Qm.parseInput("1,200"), { n: 1200, d: 1 }, "3桁区切り");
eq(Qm.parseInput("2 1/3", { mixed: true }), { n: 7, d: 3 }, "帯分数");
eq(Qm.parseInput("2 1/3"), null, "帯分数は許可しないとき null");
eq(Qm.parseInput("3/0"), null, "分母0");
eq(Qm.parseInput("abc"), null, "文字");
eq(Qm.parseInput(""), null, "空");
eq(Qm.toDecimalString(Qm.Q(3, 4)), "0.75", "3/4→0.75");
eq(Qm.toDecimalString(Qm.Q(-1, 8)), "-0.125", "-1/8→-0.125");
eq(Qm.toDecimalString(Qm.Q(1, 3)), null, "1/3 は有限小数でない");
eq(Qm.toDecimalString(Qm.Q(7, 1)), "7", "整数");
ok(Qm.isReducedText("3/4") && !Qm.isReducedText("6/8") && Qm.isReducedText("5"), "約分済みの判定");
eq(tq(Qm.Q(-3, 4)), "-\\frac{3}{4}", "tq");
eq(tmixed(Qm.Q(7, 3)), "2\\frac{1}{3}", "tmixed");
eq(tmixed(Qm.Q(-7, 3)), "-2\\frac{1}{3}", "tmixed 負");

// ── poly ─────────────────────────────────────────────
section("多項式");
const x = P.x();
const px = x.add(P.c(2)).mul(x.add(P.c(3))); // (x+2)(x+3)
eq(px.toTeX(), "x^{2}+5x+6", "(x+2)(x+3) の展開");
eq(x.sub(P.c(1)).pow(2).toTeX(), "x^{2}-2x+1", "(x-1)^2");
eq(P.coeffs([-4, 0, 1]).toTeX(), "x^{2}-4", "x^2-4");
ok(x.add(P.c(1)).mul(x.sub(P.c(1))).equals(P.coeffs([-1, 0, 1])), "(x+1)(x-1)=x^2-1（構造で等しい）");
eq(P.mono(Qm.Q(1, 2), { x: 1 }).add(P.c(-3)).toTeX(), "\\frac{1}{2}x-3", "分数係数");
const xy = P.v("x").add(P.v("y").scale(2)).pow(2);
eq(xy.toTeX({ order: ["x", "y"] }), "x^{2}+4xy+4y^{2}", "(x+2y)^2");
eq(px.eval({ x: 2 }), { n: 20, d: 1 }, "eval");
eq(P.c(0).toTeX(), "0", "零多項式");
eq(P.mono(-1, { x: 2 }).add(P.x()).toTeX(), "-x^{2}+x", "先頭が負");

// ── judge ────────────────────────────────────────────
section("採点");
const skill = { id: "t", tpl: [{ id: "a", kind: "num", make: () => num({ q: "q", ans: Qm.Q(3, 4), wrongs: [[Qm.Q(2, 5), "MC-X"]], explain: "e" }) }] };
const it1 = makeItem(skill, 1, 1);
eq(judge(it1, { type: "num", text: "3/4" }).ok, true, "3/4 正解");
eq(judge(it1, { type: "num", text: "0.75" }).ok, true, "0.75 も正解");
eq(judge(it1, { type: "num", text: "2/5" }).mc, "MC-X", "誤答パターンの検出");
eq(judge(it1, { type: "num", text: "x" }).invalid, true, "解釈できない入力は invalid");
eq(judge(it1, { type: "skip" }).skipped, true, "わからない");
const skillR = { id: "t2", tpl: [{ id: "a", kind: "num", make: () => num({ q: "q", ans: Qm.Q(1, 2), reduced: true, explain: "e" }) }] };
const it2 = makeItem(skillR, 1, 1);
const j2 = judge(it2, { type: "num", text: "2/4" });
ok(!j2.ok && j2.mc === "MC-NOT-REDUCED", "約分していない分数は不正解＋MC-NOT-REDUCED");
ok(judge(it2, { type: "num", text: "0.5" }).ok, "約分指定でも小数の 0.5 は正解");
const skillC = { id: "t3", tpl: [{ id: "a", kind: "choice", make: () => choice({ q: "q", correct: "A", wrongs: [["B", "MC-1"], ["C"], ["D"], ["A"]], explain: "e" }) }] };
const it3 = makeItem(skillC, 1, 5);
eq(it3.choices.length, 4, "選択肢は4つ（正解と同じ重複は除く）");
eq(it3.choices.filter((c) => c.correct).length, 1, "正解は1つ");
const ci = it3.choices.findIndex((c) => c.correct);
ok(judge(it3, { type: "choice", index: ci }).ok, "選択式の正解");
const wi = it3.choices.findIndex((c) => c.mc === "MC-1");
if (wi >= 0) eq(judge(it3, { type: "choice", index: wi }).mc, "MC-1", "選択式の誤答パターン");
const skillF = {
  id: "t4",
  tpl: [{ id: "a", kind: "fields", make: () => fields({ q: "q", fields: [{ id: "a", value: 2 }, { id: "b", value: -3 }], orderFree: true, wrongs: [{ values: { a: 2, b: 3 }, mc: "MC-F" }], explain: "e" }) }],
};
const it4 = makeItem(skillF, 1, 1);
ok(judge(it4, { type: "fields", values: { a: "-3", b: "2" } }).ok, "順序不問の複数欄");
eq(judge(it4, { type: "fields", values: { a: "3", b: "2" } }).mc, "MC-F", "複数欄の誤答パターン");
eq(judge(it4, { type: "fields", values: { a: "", b: "2" } }).invalid, true, "空欄は invalid");
// 同じ uid なら同じ問題
const skillRnd = { id: "t5", tpl: [{ id: "a", kind: "num", make: (r) => num({ q: `q${r.int(1, 1000000)}`, ans: r.int(1, 9), explain: "e" }) }] };
eq(makeItem(skillRnd, 2, 12345).q, makeItem(skillRnd, 2, 12345).q, "同じ seed は同じ問題");
ok(makeItem(skillRnd, 2, 12345).q !== makeItem(skillRnd, 2, 12346).q, "seed が違えば別の問題");

// ── rng ──────────────────────────────────────────────
section("乱数");
{
  const r = makeRng(7);
  let inRange = true;
  for (let i = 0; i < 2000; i++) {
    const v = r.int(-3, 4);
    if (v < -3 || v > 4) inRange = false;
  }
  ok(inRange, "int の範囲");
  const r2 = makeRng(7);
  const r3 = makeRng(7);
  eq([r2.next(), r2.next(), r2.next()], [r3.next(), r3.next(), r3.next()], "同じ seed は同じ列");
}

// ── model：ギブスサンプリング vs 厳密計算 ───────────────
section("学習者モデル（サンプリングと全列挙の一致）");
const mini = {
  order: ["A", "B", "C", "D", "E"],
  strands: ["x", "y"],
  skills: {
    A: { stage: 5, strand: "x", prereqs: [] },
    B: { stage: 6, strand: "x", prereqs: ["A"] },
    C: { stage: 6, strand: "y", prereqs: ["A"] },
    D: { stage: 7, strand: "y", prereqs: ["B", "C"] },
    E: { stage: 7, strand: "x", prereqs: [] },
  },
};
function compare(label, setup) {
  const L = new Learner({ grade: 7, graph: mini, params: { chain: { burn: 300, keep: 40000, chains: 4 } } });
  setup(L);
  const exact = L.exactMarginals();
  L.refresh();
  let worst = 0;
  for (let j = 0; j < exact.length; j++) worst = Math.max(worst, Math.abs(exact[j] - L.marg[j]));
  ok(worst < 0.02, `${label}: 最大誤差 ${worst.toFixed(4)} < 0.02`);
  return { L, exact };
}
compare("証拠なし（事前分布）", () => {});
compare("D を不正解", (L) => L.observe({ skillId: "D", level: 2, ok: false, kind: "num" }));
compare("D 不正解＋A 正解＋C わからない", (L) => {
  L.observe({ skillId: "D", level: 2, ok: false, kind: "num" });
  L.observe({ skillId: "A", level: 1, ok: true, kind: "choice" });
  L.observe({ skillId: "C", level: 2, ok: false, skipped: true, kind: "choice" });
});
compare("すべて正解", (L) => {
  for (const id of ["A", "B", "C", "D", "E"]) L.observe({ skillId: id, level: 3, ok: true, kind: "num" });
});

section("学習者モデル（性質）");
{
  // 前提が弱いと分かれば、その先の単元は下がる。上流が強いと分かれば「疑い」が晴れる
  const mk = () => new Learner({ grade: 7, graph: mini });
  const base = mk();
  const pD0 = base.pMaster("D");
  const l1 = mk();
  l1.observe({ skillId: "A", level: 1, ok: false, kind: "num" });
  ok(l1.pMaster("D") < pD0, `前提 A に不正解 → D の習熟確率が下がる (${pD0.toFixed(2)} → ${l1.pMaster("D").toFixed(2)})`);
  const l2 = mk();
  l2.observe({ skillId: "D", level: 2, ok: true, kind: "num" });
  ok(l2.pMaster("A") > base.pMaster("A"), `D に正解 → 前提 A の習熟確率が上がる (${base.pMaster("A").toFixed(2)} → ${l2.pMaster("A").toFixed(2)})`);
  // explaining away：D を間違えた後、B が弱いと分かれば C への疑いは晴れる
  // （共有の前提や全体パラメータを外した最小の構造で、厳密計算で確かめる）
  const tri = {
    order: ["B", "C", "D"],
    strands: ["x"],
    skills: { B: { stage: 6, strand: "x", prereqs: [] }, C: { stage: 6, strand: "x", prereqs: [] }, D: { stage: 7, strand: "x", prereqs: ["B", "C"] } },
  };
  const mkTri = () => new Learner({ grade: 7, graph: tri, params: { tiltGlobal: 0, tiltStrand: 0 } });
  const pmOf = (m, i) => m[i * 4 + 2] + m[i * 4 + 3];
  const t1 = mkTri();
  t1.observe({ skillId: "D", level: 2, ok: false, kind: "num" });
  const pC = pmOf(t1.exactMarginals(), 1);
  const t2 = mkTri();
  t2.observe({ skillId: "D", level: 2, ok: false, kind: "num" });
  t2.observe({ skillId: "B", level: 2, ok: false, kind: "num" });
  const pC2 = pmOf(t2.exactMarginals(), 1);
  ok(pC2 > pC, `B の弱さが判明 → C への疑いは晴れる (${pC.toFixed(3)} → ${pC2.toFixed(3)})`);
  // 再現性：同じログなら同じ結果
  const log = [
    { skillId: "D", level: 2, ok: false, kind: "num" },
    { skillId: "A", level: 1, ok: true, kind: "choice" },
  ];
  const a = replay(log, { grade: 7, graph: mini });
  const b = replay(log, { grade: 7, graph: mini });
  eq(a.pMaster("B"), b.pMaster("B"), "同じログなら同じ推定（固定seed）");
  // 「わからない」は同じ不正解より強い証拠
  const wrong = mk();
  wrong.observe({ skillId: "B", level: 2, ok: false, kind: "choice" });
  const skip = mk();
  skip.observe({ skillId: "B", level: 2, ok: false, skipped: true, kind: "choice" });
  ok(skip.pMaster("B") <= wrong.pMaster("B") + 0.005, `「わからない」は選択式の誤答より強い不正解の証拠 (${skip.pMaster("B").toFixed(3)} ≤ ${wrong.pMaster("B").toFixed(3)})`);
}

console.log(`\n${failCount === 0 ? "✓ すべて成功" : "✗ 失敗あり"}: 成功 ${pass} / 失敗 ${failCount}`);
process.exit(failCount ? 1 : 0);
