// 小テスト採点（生徒・先生共通）のテスト: node lesson-live/test/quizcore.test.js
global.window = global;
const LM = require("../js/math.js");
require("../js/curriculum.js");
for (let u = 1; u <= 7; u++) require(`../js/bank/u${u}.js`);
require("../js/quizcore.js");
const { LL, QC } = global;
let pass = 0, fail = 0;
const ok = (c, m, x) => { if (c) pass++; else { fail++; console.log("NG:", m, x === undefined ? "" : JSON.stringify(x)); } };

function modelAnswer(it) {
  const s = it.sub, q = it.q, mode = QC.modeOf(it);
  if (it.type === "choice") return s.a;
  if (it.type === "multi") return q.a.slice();
  if (it.type === "plot") return Object.fromEntries(q.points.map(([l, x, y]) => [l, [x, y]]));
  if (it.type === "graph") {
    const a = typeof q.fn.a === "number" ? q.fn.a : LM.evalAST(LM.parse(String(q.fn.a)), {});
    const pts = [];
    for (let x = -q.R; x <= q.R; x++) for (let y = -q.R; y <= q.R; y++) {
      if (x === 0) continue;
      if (q.fn.kind === "line" ? Math.abs(y - a * x) < 1e-9 : Math.abs(x * y - a) < 1e-9) pts.push([x, y]);
    }
    return q.fn.kind === "line" ? [pts.find(p => p[0] > 0)] : [pts.find(p => p[0] > 0), pts.find(p => p[0] < 0)];
  }
  if (mode === "coord") return `(${s.a[0]},${s.a[1]})`;
  if (mode === "list" || mode === "set") return s.a.join(",");
  if (mode === "text" || mode === "form") return s.a[0];
  if (mode === "factor") return s.show;
  return String(s.a);
}

for (const L of LL.LESSONS) {
  const ans = {};
  for (const it of QC.items(L)) ans[it.k] = modelAnswer(it);
  const bi = QC.bonusItem(L);
  if (bi) ans.b = modelAnswer(bi);
  const g = QC.grade(L, ans);
  ok(g.perfect && g.score === g.max + (bi ? 1 : 0), `${L.id} 模範解答で満点＋ボーナス`, { score: g.score, max: g.max, ng: g.items.filter(r => !r.ok).map(r => r.k) });
  // 送信形式から戻して採点し直しても同じ（先生画面の検証）
  const g2 = QC.grade(L, QC.answersFrom(JSON.parse(JSON.stringify(QC.payload(g)))));
  ok(g2.score === g.score, `${L.id} 採点し直しが一致`);
  const g0 = QC.grade(L, {});
  ok(g0.score === 0 && g0.items.every(r => r.why === "empty" || r.why === null), `${L.id} 空欄は0点`);
  // 表示が落ちない
  for (const it of QC.items(L)) { QC.rightHTML(it); QC.userHTML(it, ans[it.k]); QC.userHTML(it, null); }
  if (bi) { QC.rightHTML(bi); QC.userHTML(bi, ans.b); }
}
// ボーナスは基本が満点のときだけ
const L = LL.lesson("1-3");
const a = {}; for (const it of QC.items(L)) a[it.k] = modelAnswer(it);
a["0.0"] = "0"; a.b = "4";
let g = QC.grade(L, a);
ok(!g.perfect && g.bonus.ok && !g.bonus.awarded && g.score === g.max - 1, "基本に誤りがあるとボーナス加点なし", g.bonus);
// よくある間違いのメッセージ
g = QC.grade(L, { "0.1": "12" });
ok(/負/.test(g.items.find(r => r.k === "0.1").miss || ""), "よくある間違いのメッセージ", g.items[1]);
g = QC.grade(L, { "0.1": "(-7)+(-5)" });
ok(g.items.find(r => r.k === "0.1").why === "notLiteral", "式をそのまま書いても正解にならない");
// グラフ
ok(QC.gradeGraph({ kind: "line", a: 3 }, [[0, 0]]).why === "graphNeed", "原点だけでは不可");
ok(QC.gradeGraph({ kind: "hyper", a: 6 }, [[1, 6], [2, 3]]).why === "graphBoth", "反比例は両側が必要");
ok(QC.gradeGraph({ kind: "hyper", a: 6 }, [[1, 6], [-2, -3]]).ok, "反比例 両側OK");
console.log(`quizcore: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
