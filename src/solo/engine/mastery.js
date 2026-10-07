// ============================================================
// mastery.js — 単元ごとの「理解度」を記録・推定する
//
//  単元の記録 us = {
//    lv: { 1: {n, c, p, streak, passed}, 2: {...}, 3: {...}, 4: {...} },
//        n:解いた数 c:正解数 p:正答の見込み(0〜1, 直近ほど重い移動平均)
//        passed: 確認テストに合格したか
//    est:  診断からの推定レベル（0〜4。null=未確認）
//    weak: 診断で「つまずきの原因」と判定された（習得すると false に、overcame=true）
//    last: 最後に解いた時刻 / wrongAt: 最後に間違えた時刻
//    rev:  { n:復習の回数, next:次の復習の時刻 }
//  }
//
//  レベル L の「習得」＝ 確認テスト合格（かつ最近くずれていない） または 3問以上解いて正答見込み80%以上。
//  上のレベルを習得したら、下のレベルも習得あつかい。
// ============================================================

const ALPHA = 0.3; // 移動平均の重み（新しい結果をどれだけ重く見るか）
const DAY = 86400000;
// 復習の間隔（日）。習得直後 → 3日後 → 7日後 → 16日後 → 35日後 …
const REVIEW_DAYS = [3, 7, 16, 35, 75];

export const emptyUnit = () => ({ lv: {}, est: null, weak: false, last: 0, wrongAt: 0, rev: null });

const lvOf = (us, L) => us?.lv?.[L] || { n: 0, c: 0, p: null, streak: 0, passed: false };

/** 1問の結果を記録（新しい us を返す）。hinted=ヒントを見た */
export function recordAnswer(us0, level, correct, { hinted = false, now = Date.now() } = {}) {
  const us = structuredClone(us0 || emptyUnit());
  const s = { ...lvOf(us, level) };
  const before = masteredLevel(us);
  const y = correct ? (hinted ? 0.6 : 1) : 0;
  s.n += 1;
  s.c += correct ? 1 : 0;
  s.p = s.p == null ? (correct ? 0.65 : 0.25) : s.p + ALPHA * (y - s.p);
  s.streak = correct ? Math.max(1, s.streak + 1) : Math.min(-1, s.streak - 1);
  us.lv[level] = s;
  us.last = now;
  if (!correct) us.wrongAt = now;
  // 下のレベルにも少しだけ効かせる（応用が解ければ標準もたぶん大丈夫）
  if (correct && !hinted) {
    for (let L = level - 1; L >= 1; L--) {
      const t = { ...lvOf(us, L) };
      if (t.p != null) { t.p = t.p + 0.15 * (1 - t.p); us.lv[L] = t; }
    }
  }
  const after = masteredLevel(us);
  if (after > before) us.rev = { n: 0, next: now + REVIEW_DAYS[0] * DAY };
  if (after >= 1 && us.weak) { us.weak = false; us.overcame = true; } // つまずき克服
  return us;
}

/** 確認テストの結果（score 正解数 / total）を記録 */
export function recordTest(us0, level, score, total, now = Date.now()) {
  const us = structuredClone(us0 || emptyUnit());
  const s = { ...lvOf(us, level) };
  const pass = score >= Math.ceil(total * 0.8);
  const before = masteredLevel(us);
  if (pass) {
    s.passed = true;
    s.p = Math.max(s.p ?? 0, 0.85);
  }
  us.lv[level] = s;
  us.last = now;
  // 復習テストとしての合格なら、次の復習を先へ延ばす
  if (pass && us.rev && before >= level) {
    const n = Math.min(us.rev.n + 1, REVIEW_DAYS.length - 1);
    us.rev = { n, next: now + REVIEW_DAYS[n] * DAY };
  } else if (masteredLevel(us) > before) {
    us.rev = { n: 0, next: now + REVIEW_DAYS[0] * DAY };
  }
  if (!pass && us.rev) us.rev = { n: 0, next: now + DAY };
  if (masteredLevel(us) >= 1 && us.weak) { us.weak = false; us.overcame = true; }
  return { us, pass };
}

/** 復習セッション（おすすめ演習など）で正答率が高ければ、次の復習を延ばす */
export function recordReview(us0, accuracy, now = Date.now()) {
  if (!us0?.rev) return us0;
  const us = structuredClone(us0);
  if (accuracy >= 0.8) {
    const n = Math.min(us.rev.n + 1, REVIEW_DAYS.length - 1);
    us.rev = { n, next: now + REVIEW_DAYS[n] * DAY };
  } else {
    us.rev = { n: 0, next: now + DAY };
  }
  return us;
}

/** 習得しているレベル（0〜4）。実際に解いた記録だけで判定 */
export function masteredLevel(us) {
  for (let L = 4; L >= 1; L--) {
    const s = lvOf(us, L);
    if ((s.passed && (s.p ?? 1) >= 0.5) || (s.n >= 3 && (s.p ?? 0) >= 0.8)) return L;
  }
  return 0;
}

/** 表示用のレベル：{ level, estimated }（診断の推定が実績より上なら推定を使う） */
export function displayLevel(us) {
  const m = masteredLevel(us);
  const e = us?.est ?? null;
  if (e != null && e > m) return { level: e, estimated: true };
  return { level: m, estimated: false };
}

/** 単元の状態（マップの色分けに使う）
 *  "out" 範囲外 / "future" まだ習っていない / "unknown" 未確認 / "weak" 要復習 /
 *  "learning" 学習中 / "est" 推定OK（未確認） / "goal" 目標達成 / "beyond" 目標超え */
export function unitStatus(us, req, learned) {
  if (!req) return "out";
  const { level, estimated } = displayLevel(us);
  const touched = !!us && (Object.keys(us.lv || {}).length > 0 || us.est != null);
  if (level >= req) return estimated ? "est" : level > req ? "beyond" : "goal";
  if (!touched) return learned ? "unknown" : "future";
  if (us.weak || (us.est === 0 && masteredLevel(us) === 0)) return "weak";
  const recentWrong = us.wrongAt && Date.now() - us.wrongAt < 3 * DAY;
  const lowP = Object.values(us.lv || {}).some((s) => s.n >= 2 && (s.p ?? 1) < 0.45);
  if ((recentWrong && lowP) || lowP) return "weak";
  return "learning";
}

export const STATUS_INFO = {
  beyond: { label: "目標以上", color: "#0ea5e9" },
  goal: { label: "目標達成", color: "#22c55e" },
  est: { label: "たぶんOK（未確認）", color: "#86efac" },
  learning: { label: "学習中", color: "#fbbf24" },
  weak: { label: "要復習", color: "#f87171" },
  unknown: { label: "未確認", color: "#cbd5e1" },
  future: { label: "これから習う", color: "#eef2f7" },
  out: { label: "目標の範囲外", color: "#f8fafc" },
};

/**
 * 理解度スコア（0〜100）：目標レベルに対してどこまで来たか。
 *  習得レベルごとに満点、次のレベルは正答見込みに応じて部分点。推定は8割の重み。
 */
export function unitScore(us, req) {
  if (!req) return 0;
  const m = masteredLevel(us);
  let pts = Math.min(m, req);
  if (m < req) {
    const s = lvOf(us, m + 1);
    if (s.n > 0 && s.p != null) pts += Math.max(0, Math.min(1, (s.p - 0.3) / 0.5)) * Math.min(1, s.n / 3) * 0.9;
  }
  const e = us?.est ?? null;
  if (e != null) pts = Math.max(pts, Math.min(e, req) * 0.8);
  return Math.round((Math.min(pts, req) / req) * 100);
}

/** 練習で最初に出すレベル：目標までで、まだ習得していない一番下のレベル */
export function startLevel(us, req, maxLevel = 4) {
  const m = masteredLevel(us);
  return Math.max(1, Math.min(m + 1, req || maxLevel, maxLevel));
}

/** 復習の時期か */
export function reviewDue(us, now = Date.now()) {
  return !!us?.rev && us.rev.next <= now;
}

export const totalAnswered = (us) => Object.values(us?.lv || {}).reduce((s, x) => s + (x.n || 0), 0);
export const totalCorrect = (us) => Object.values(us?.lv || {}).reduce((s, x) => s + (x.c || 0), 0);
