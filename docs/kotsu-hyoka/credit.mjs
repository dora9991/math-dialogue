// credit.mjs — コツコツくん「評価される学習時間」の決め方（見本の実装）
//
// アプリ本体（src/solo）に移すための、画面や保存に触らない純粋な関数だけの部品です。
// 仕様は README.md。ここの関数と credit.test.mjs のテストが、仕様の「正」です。
//
//   node --test docs/kotsu-hyoka/credit.test.mjs
//
// 考え方は2つ。
//   A. 何秒と数えるか（時間の数え方）……解く時間＋解説を読む時間＋解説授業。見えている間だけ。同じ時刻は1回だけ。
//   B. その時間を評価に入れるか（学習の種類）……いまの単元・予習・学び直し は入れる。それ以外は「じゆう練習」。

export const PARAMS = {
  // ── A. 時間の数え方 ──
  solveCapSec: { 1: 180, 2: 180, 3: 240, 4: 300 },   // 1問を解く時間の上限（レベル別）。入試レベルは 12% が 3分をこえていた
  reviewCapSec: { correct: 20, wrong: 90, detail: 180 }, // 答えたあと、解説を読む時間の上限（正解・まちがい・「ていねい解説」を開いた）
  lectureDefaultSec: 360,                             // 解説授業の標準の長さが分からないときの上限
  lectureCapFactor: 1.2,                              // 解説授業は、標準の長さ × 1.2 まで
  reflectCapSecPerDay: 180,                           // ふりかえりを書く時間は、1日 3分まで
  // ── B. 評価に入れるか ──
  recentUnits: 3,                                     // 「直近」＝いまの単元をふくめて、さかのぼって 3単元
  entryCheckSize: 5,                                  // 下の単元の「たしかめ」＝はじめの 5問
  entryCheckNeedMaxCorrect: 3,                        // 5問中 3問以下の正解なら、学び直しと認める
  guessWindow: 10,                                    // あてずっぽうの見張り：同じ単元の直近 10問
  guessMaxCorrect: 3,                                 //   正解が 3問以下なら、数えるのを止めて解説へ
  freeXpFactor: 0.2,                                  // じゆう練習の経験値は 2割
};

/** いま見えているか。フォーカス（hasFocus）は見ない：画面分割や一部の端末で、解いているのに 0 になるため */
export const isVisible = (doc) => !(doc && doc.hidden);

// ───────────────────────── A. 何秒と数えるか ─────────────────────────

/**
 * 同じ時刻を2回数えないための台帳。たくさんのタブ・窓で交互に解いても、実際の時間をこえない。
 * countedUntil＝この端末で「ここまでは数えた」時刻（ms）。タブをまたいで共有する（localStorage など）。
 * 返す ms は、[from, to] のうち、まだ数えていない部分の長さ。
 */
export function claim({ from, to, countedUntil = 0 }) {
  const start = Math.max(from, countedUntil);
  return { ms: Math.max(0, to - start), countedUntil: Math.max(countedUntil, to) };
}

/** 1問を解いた時間（秒）。表示から解答まで、見えていなかった時間を引き、レベル別の上限でおさえる */
export function solveSeconds({ shownAt, answeredAt, hiddenMs = 0, level = 1, countedUntil = 0 }, P = PARAMS) {
  const visible = Math.max(0, answeredAt - shownAt - Math.max(0, hiddenMs));
  const fresh = claim({ from: shownAt, to: answeredAt, countedUntil }).ms;
  const cap = (P.solveCapSec[level] ?? P.solveCapSec[1]) * 1000;
  return Math.round(Math.min(visible, fresh, cap) / 1000);
}

/** 答えたあと、解説を読んだ時間（秒）。次の問題に進む（または画面を出る）まで。まちがえたときは長めに認める */
export function reviewSeconds({ answeredAt, leftAt, hiddenMs = 0, correct, openedDetail = false, countedUntil = 0 }, P = PARAMS) {
  const visible = Math.max(0, leftAt - answeredAt - Math.max(0, hiddenMs));
  const fresh = claim({ from: answeredAt, to: leftAt, countedUntil }).ms;
  const cap = (openedDetail ? P.reviewCapSec.detail : correct ? P.reviewCapSec.correct : P.reviewCapSec.wrong) * 1000;
  return Math.round(Math.min(visible, fresh, cap) / 1000);
}

/** 解説授業を見た時間（秒）。標準の長さ×1.2 まで。同じ解説を同じ日に見直しても、合計はこの上限まで */
export function lectureSeconds({ visibleMs, standardSec = 0, countedTodaySec = 0 }, P = PARAMS) {
  const cap = Math.round((standardSec > 0 ? standardSec : P.lectureDefaultSec) * P.lectureCapFactor);
  return Math.min(Math.round(visibleMs / 1000), Math.max(0, cap - Math.max(0, countedTodaySec)));   // 今回見た時間と、きょうの残りの枠の、小さいほう
}

/** ふりかえりを書いた時間（秒）。1日の上限まで */
export function reflectSeconds({ visibleMs, countedTodaySec = 0 }, P = PARAMS) {
  return Math.min(Math.round(visibleMs / 1000), Math.max(0, P.reflectCapSecPerDay - Math.max(0, countedTodaySec)));
}

// ───────────────────────── B. 評価に入れるか ─────────────────────────

/**
 * 下の単元の「たしかめ」。はじめの5問の正誤から、学び直しが要るかを決める。
 *   "pending" … まだ5問に足りない（この間の時間は「保留」。need になったら、さかのぼって評価に入れる）
 *   "need"    … つまずきあり → 学び直しとして評価に入れる
 *   "ok"      … もうできている → じゆう練習
 */
export function entryCheck(firstAnswers, P = PARAMS) {
  const a = firstAnswers.slice(0, P.entryCheckSize);
  const wrong = a.filter((ok) => !ok).length;
  if (wrong >= P.entryCheckSize - P.entryCheckNeedMaxCorrect) return "need";      // 2問まちがえた時点で確定
  return a.length < P.entryCheckSize ? "pending" : "ok";
}

/** あてずっぽうが続いているか。同じ単元の直近10問で、正解が3問以下 */
export function isGuessing(recentAnswers, P = PARAMS) {
  const a = recentAnswers.slice(-P.guessWindow);
  return a.length >= P.guessWindow && a.filter(Boolean).length <= P.guessMaxCorrect;
}

/**
 * 学習の種類を決める。
 *   unit      … { id, grade（学年の通し番号。小1=1 … 中1=7 …）, order（その学年の中での順番） }
 *   student   … { grade }
 *   now       … { grade, order }  クラスの「いまの単元」（先生が決める。なければ生徒の nowUnit）
 *   mastery   … アプリがその生徒・その単元をどう見ているか："mastered" | "learning" | "weak" | "unknown"
 *   levelPassed … いま解いているレベルを、もう合格しているか
 *   reviewDue … 復習の期日が来ているか（忘れかけのころに出す復習）
 *   check     … 下の単元で mastery が "unknown" のときの entryCheck の結果
 *   guessing  … isGuessing の結果
 * 返す：{ cat: "now" | "preview" | "relearn" | "free", credited, pending, reason }
 */
export function categorize({ unit, student, now, mastery = "unknown", levelPassed = false, reviewDue = false, check = "pending", guessing = false }, P = PARAMS) {
  const free = (reason) => ({ cat: "free", credited: false, pending: false, reason });
  if (guessing) return free("まちがいが続いています。解説を見てから、もう一度");
  if (levelPassed && !reviewDue) return free("このレベルは合格ずみ。次のレベルか、次の単元へ");

  const sameGrade = unit.grade === now.grade;
  const isRecent = sameGrade && unit.order <= now.order && unit.order > now.order - P.recentUnits;
  if (isRecent) return { cat: "now", credited: true, pending: false, reason: "いまの単元" };

  const ahead = unit.grade > now.grade || (sameGrade && unit.order > now.order);
  if (ahead) return { cat: "preview", credited: true, pending: false, reason: "予習" };

  // ここから下は「前の単元」（同じ学年の前の単元、または下の学年）
  if (reviewDue) return { cat: "relearn", credited: true, pending: false, reason: "復習の時期" };
  if (mastery === "weak" || mastery === "learning") return { cat: "relearn", credited: true, pending: false, reason: "学び直し" };
  if (mastery === "unknown") {
    if (check === "need") return { cat: "relearn", credited: true, pending: false, reason: "学び直し（たしかめでつまずき）" };
    if (check === "pending") return { cat: "relearn", credited: false, pending: true, reason: "たしかめ中（つまずきがあれば、評価に入ります）" };
  }
  return free("もうできている単元。いまの単元か、予習へ");
}

/** 経験値にかける倍率。じゆう練習は 2割。保留中は、いったん 2割で、need になったら差額を足す */
export const xpFactor = (c, P = PARAMS) => (c.credited ? 1 : P.freeXpFactor);

/**
 * 1日ぶんの記録に足す。
 *   sec … 評価に入る時間（電子黒板・先生の画面・ランキング・メダルは、これを使う。いまの daily.sec と同じ場所）
 *   raw … 数えた時間のぜんぶ（じゆう練習もふくむ）
 *   by  … 種類ごとの内訳（生徒に「なぜこの分数か」を見せるため）
 *   hold … 保留（たしかめ中）。need になったら release() で sec に移す
 */
export function addToDay(day = {}, { seconds, c }) {
  const d = { sec: 0, raw: 0, hold: 0, ...day, by: { now: 0, preview: 0, relearn: 0, free: 0, ...(day.by || {}) } };
  d.raw += seconds;
  if (c.credited) { d.sec += seconds; d.by[c.cat] += seconds; }
  else if (c.pending) d.hold += seconds;
  else d.by.free += seconds;
  return d;
}

/** たしかめの結果が出たとき：need なら保留を評価に入れ、ok ならじゆう練習にする */
export function release(day, { seconds, result }) {
  const d = { ...day, by: { ...day.by } };
  const s = Math.min(seconds, d.hold);
  d.hold -= s;
  if (result === "need") { d.sec += s; d.by.relearn += s; } else d.by.free += s;
  return d;
}
