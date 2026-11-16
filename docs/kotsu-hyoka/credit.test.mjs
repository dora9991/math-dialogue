// credit.test.mjs — 「評価される学習時間」の受け入れテスト。アプリ本体に移したあとも、同じ場面で同じ結果になること。
//   node --test docs/kotsu-hyoka/credit.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { PARAMS, isVisible, claim, solveSeconds, reviewSeconds, lectureSeconds, reflectSeconds, entryCheck, isGuessing, categorize, xpFactor, addToDay, release } from "./credit.mjs";

const S = 1000, MIN = 60 * S;
const J1 = 7;                                              // 学年の通し番号：小1=1 … 小6=6、中1=7
const student = { grade: J1 };
const now = { grade: J1, order: 6 };                       // いまの単元＝中1の6番目（空間図形）とする
const unit = (grade, order) => ({ id: `g${grade}-${order}`, grade, order });

// ───────── A. 時間の数え方 ─────────

test("ふつうに解く：40秒で解いたら40秒", () => {
  assert.equal(solveSeconds({ shownAt: 0, answeredAt: 40 * S, level: 2 }), 40);
});

test("放置：10分おいてから答えても、上限（レベル1・2は3分）まで", () => {
  assert.equal(solveSeconds({ shownAt: 0, answeredAt: 10 * MIN, level: 1 }), 180);
});

test("入試レベルは5分まで数える（4分かけて解いたら4分）", () => {
  assert.equal(solveSeconds({ shownAt: 0, answeredAt: 4 * MIN, level: 4 }), 240);
  assert.equal(solveSeconds({ shownAt: 0, answeredAt: 9 * MIN, level: 4 }), 300);
  assert.equal(solveSeconds({ shownAt: 0, answeredAt: 4 * MIN, level: 3 }), 240);
});

test("見えていなかった時間は引く（別のタブを見ていた2分は数えない）", () => {
  assert.equal(solveSeconds({ shownAt: 0, answeredAt: 150 * S, hiddenMs: 120 * S, level: 2 }), 30);
});

test("見えているかは hidden だけで決める（フォーカスが外れていても、見えていれば数える）", () => {
  assert.equal(isVisible({ hidden: false, hasFocus: () => false }), true);
  assert.equal(isVisible({ hidden: true }), false);
});

test("たくさんのタブで交互に解いても、実際の時間をこえない", () => {
  // 10個のタブで同時に問題を出し、1つめを60秒で答えたあと、残りを2秒おきに答える
  let countedUntil = 0, total = 0;
  for (let i = 0; i < 10; i++) {
    const answeredAt = 60 * S + i * 2 * S;
    total += solveSeconds({ shownAt: 0, answeredAt, level: 1, countedUntil });
    countedUntil = claim({ from: 0, to: answeredAt, countedUntil }).countedUntil;
  }
  assert.equal(total, 78);                                 // 実際にかかった 78秒。600秒にはならない
});

test("まちがえたあと、解説を読む時間を数える（90秒まで）", () => {
  assert.equal(reviewSeconds({ answeredAt: 0, leftAt: 45 * S, correct: false }), 45);
  assert.equal(reviewSeconds({ answeredAt: 0, leftAt: 5 * MIN, correct: false }), 90);
});

test("正解のあとは20秒まで。「ていねい解説」を開いたら3分まで", () => {
  assert.equal(reviewSeconds({ answeredAt: 0, leftAt: 2 * MIN, correct: true }), 20);
  assert.equal(reviewSeconds({ answeredAt: 0, leftAt: 2 * MIN, correct: true, openedDetail: true }), 120);
  assert.equal(reviewSeconds({ answeredAt: 0, leftAt: 9 * MIN, correct: false, openedDetail: true }), 180);
});

test("解説を読む時間も、解く時間と重ねて数えない", () => {
  const countedUntil = 30 * S;                             // 別のタブで、30秒の時点まで数えてある
  assert.equal(reviewSeconds({ answeredAt: 10 * S, leftAt: 50 * S, correct: false, countedUntil }), 20);
});

test("解説授業：見た時間を数える。標準の長さ×1.2 まで。同じ日の見直しは、合計がその上限まで", () => {
  assert.equal(lectureSeconds({ visibleMs: 4 * MIN, standardSec: 300 }), 240);
  assert.equal(lectureSeconds({ visibleMs: 30 * MIN, standardSec: 300 }), 360);
  assert.equal(lectureSeconds({ visibleMs: 5 * MIN, standardSec: 300, countedTodaySec: 240 }), 120);   // 上限 360秒のうち、残りは 120秒
  assert.equal(lectureSeconds({ visibleMs: 5 * MIN, standardSec: 300, countedTodaySec: 360 }), 0);
  assert.equal(lectureSeconds({ visibleMs: 30 * MIN }), Math.round(PARAMS.lectureDefaultSec * PARAMS.lectureCapFactor));
});

test("ふりかえりを書く時間は、1日3分まで", () => {
  assert.equal(reflectSeconds({ visibleMs: 2 * MIN }), 120);
  assert.equal(reflectSeconds({ visibleMs: 10 * MIN }), 180);
  assert.equal(reflectSeconds({ visibleMs: 2 * MIN, countedTodaySec: 150 }), 30);
});

test("1時間の学習の例：いまの数え方では30分 → 新しい数え方では55分", () => {
  // 40問。1問に45秒かけて解き、半分はまちがえて解説を40秒読む、半分は正解で5秒。途中で解説授業を8分（標準7分）、ふりかえり2分
  let old = 0, neu = 0;
  for (let i = 0; i < 40; i++) {
    old += 45; neu += solveSeconds({ shownAt: 0, answeredAt: 45 * S, level: 2 });
    neu += reviewSeconds({ answeredAt: 0, leftAt: (i % 2 ? 40 : 5) * S, correct: i % 2 === 0 });
  }
  neu += lectureSeconds({ visibleMs: 8 * MIN, standardSec: 420 }) + reflectSeconds({ visibleMs: 2 * MIN });
  assert.equal(old, 30 * 60);                              // いまの数え方：解く時間だけ＝30分
  assert.equal(neu, 55 * 60);                              // 新しい数え方：解く30分＋解説15分＋授業8分＋ふりかえり2分
});

// ───────── B. 評価に入れるか ─────────

test("いまの単元と、その前の2単元は「いまの単元」", () => {
  for (const order of [6, 5, 4]) assert.equal(categorize({ unit: unit(J1, order), student, now, mastery: "learning" }).cat, "now");
  assert.equal(categorize({ unit: unit(J1, 6), student, now, mastery: "unknown" }).credited, true);
});

test("先の単元・上の学年は「予習」", () => {
  assert.equal(categorize({ unit: unit(J1, 7), student, now }).cat, "preview");
  assert.equal(categorize({ unit: unit(J1 + 1, 1), student, now }).cat, "preview");
  assert.equal(categorize({ unit: unit(J1 + 1, 1), student, now }).credited, true);
});

test("前の単元：弱点・学習中なら「学び直し」。できているなら「じゆう練習」", () => {
  assert.equal(categorize({ unit: unit(J1, 1), student, now, mastery: "weak" }).cat, "relearn");
  assert.equal(categorize({ unit: unit(5, 3), student, now, mastery: "learning" }).credited, true);
  const done = categorize({ unit: unit(1, 2), student, now, mastery: "mastered" });
  assert.equal(done.cat, "free"); assert.equal(done.credited, false);
});

test("小1の問題を連打する：できているので、評価の時間は 0。経験値は2割", () => {
  let day = {};
  for (let i = 0; i < 300; i++) {
    const c = categorize({ unit: unit(1, 1 + (i % 5)), student, now, mastery: "mastered" });
    day = addToDay(day, { seconds: solveSeconds({ shownAt: 0, answeredAt: 4 * S, level: 1 }), c });
    assert.equal(xpFactor(c), 0.2);
  }
  assert.equal(day.sec, 0); assert.equal(day.raw, 1200); assert.equal(day.by.free, 1200);
});

test("合格したレベルのくり返しは数えない。復習の期日が来たら数える", () => {
  const u = unit(J1, 6);
  assert.equal(categorize({ unit: u, student, now, mastery: "learning", levelPassed: true }).credited, false);
  assert.equal(categorize({ unit: u, student, now, mastery: "mastered", levelPassed: true, reviewDue: true }).credited, true);
  assert.equal(categorize({ unit: unit(4, 2), student, now, mastery: "mastered", levelPassed: false, reviewDue: true }).cat, "relearn");
});

test("まだ分からない下の単元は「たしかめ」5問：2問まちがえたら学び直し、4問以上正解ならじゆう練習", () => {
  assert.equal(entryCheck([true, true, true]), "pending");
  assert.equal(entryCheck([true, false, true, false]), "need");
  assert.equal(entryCheck([true, true, true, true, false]), "ok");
  assert.equal(entryCheck([true, true, true, true, true, false, false]), "ok");   // 6問目からは、たしかめの外
  const u = unit(5, 2);
  const pend = categorize({ unit: u, student, now, mastery: "unknown", check: "pending" });
  assert.deepEqual([pend.credited, pend.pending], [false, true]);
  assert.equal(categorize({ unit: u, student, now, mastery: "unknown", check: "need" }).cat, "relearn");
  assert.equal(categorize({ unit: u, student, now, mastery: "unknown", check: "ok" }).cat, "free");
});

test("たしかめ中の時間は保留。つまずきがあれば、さかのぼって評価に入る", () => {
  const pend = categorize({ unit: unit(5, 2), student, now, mastery: "unknown", check: "pending" });
  let day = {};
  for (let i = 0; i < 4; i++) day = addToDay(day, { seconds: 30, c: pend });
  assert.deepEqual([day.sec, day.hold, day.raw], [0, 120, 120]);
  const need = release(day, { seconds: 120, result: "need" });
  assert.deepEqual([need.sec, need.hold, need.by.relearn], [120, 0, 120]);
  const ok = release(day, { seconds: 120, result: "ok" });
  assert.deepEqual([ok.sec, ok.hold, ok.by.free], [0, 0, 120]);
});

test("わざとまちがえて学び直しにしても、得にならない：合格で止まり、あてずっぽうでも止まる", () => {
  const u = unit(1, 1);
  // わざと2問まちがえて need にする → そのあと正解を続けると、すぐ合格して止まる
  assert.equal(categorize({ unit: u, student, now, mastery: "unknown", check: "need", levelPassed: true }).credited, false);
  // まちがえ続けて放置でかせぐ → 直近10問で正解3問以下になり、止まる
  const answers = [false, false, true, false, false, false, true, false, false, false];
  assert.equal(isGuessing(answers), true);
  assert.equal(categorize({ unit: u, student, now, mastery: "weak", guessing: isGuessing(answers) }).credited, false);
  assert.equal(isGuessing([true, false, true, false, true, false, true, false, true, false]), false);
  assert.equal(isGuessing([false, false, false]), false);  // 10問たまるまでは判定しない
});

test("本当に学び直している生徒：小5の割合でつまずく → 解く時間も、解説を読む時間も評価に入る", () => {
  const c = categorize({ unit: unit(5, 4), student, now, mastery: "weak" });
  let day = {};
  for (let i = 0; i < 10; i++) {
    const ok = i % 3 !== 0;
    day = addToDay(day, { seconds: solveSeconds({ shownAt: 0, answeredAt: 30 * S, level: 1 }) + reviewSeconds({ answeredAt: 0, leftAt: 25 * S, correct: ok }), c });
  }
  assert.equal(day.sec, day.raw); assert.equal(day.by.relearn, day.sec); assert.ok(day.sec > 300);
});

test("1日の内訳：評価の時間＝いま＋予習＋学び直し。じゆう練習は総時間にだけ入る", () => {
  let day = {};
  day = addToDay(day, { seconds: 600, c: categorize({ unit: unit(J1, 6), student, now }) });
  day = addToDay(day, { seconds: 300, c: categorize({ unit: unit(J1, 8), student, now }) });
  day = addToDay(day, { seconds: 200, c: categorize({ unit: unit(6, 1), student, now, mastery: "weak" }) });
  day = addToDay(day, { seconds: 900, c: categorize({ unit: unit(1, 1), student, now, mastery: "mastered" }) });
  assert.deepEqual(day, { sec: 1100, raw: 2000, hold: 0, by: { now: 600, preview: 300, relearn: 200, free: 900 } });
});
