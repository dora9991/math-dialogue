// ============================================================
// actions.js — 学習の記録を state に反映する（画面からはここだけ呼ぶ）
//  どれも「新しい state」を返す純粋な関数。新しく取ったバッジも一緒に返す。
// ============================================================
import { getUnit } from "../content/index.js";
import { requiredLevel, profileGradeIndex } from "./goals.js";
import { recordAnswer, recordTest, recordReview, displayLevel, masteredLevel, emptyUnit } from "./mastery.js";
import { todayKey, xpFor, earnedBadges } from "./motivation.js";
import { goalProgress } from "./recommend.js";

function bumpDaily(state, { n = 0, c = 0, xp = 0, sec = 0 }) {
  const k = todayKey();
  const d = state.daily[k] || { n: 0, c: 0, xp: 0, sec: 0 };
  return { ...state.daily, [k]: { n: d.n + n, c: d.c + c, xp: d.xp + xp, sec: d.sec + sec } };
}

/** バッジと「目標到達」の更新。newly: 今回はじめて取ったもの */
function settle(state, touchedUnitId = null) {
  let reached = state.reached;
  const newlyReached = [];
  if (touchedUnitId) {
    const u = getUnit(touchedUnitId);
    const req = requiredLevel(u, state.profile);
    const us = state.units[touchedUnitId];
    if (req && masteredLevel(us) >= req && !reached[touchedUnitId]) {
      reached = { ...reached, [touchedUnitId]: Date.now() };
      newlyReached.push(touchedUnitId);
    }
  }
  const s1 = { ...state, reached };
  const pct = goalProgress(s1).pct;
  const have = s1.badges || {};
  const newlyBadges = earnedBadges(s1, { goalPct: pct }).filter((id) => !have[id]);
  const badges = { ...have };
  for (const id of newlyBadges) badges[id] = Date.now();
  return { state: { ...s1, badges }, newlyBadges, newlyReached };
}

/**
 * 1問の解答を記録。
 * @param {object} p   問題（unitId, level, key を持つ）
 * @param {boolean} correct
 * @param {{hinted, firstTry, sec}} opt
 */
export function applyAnswer(state, p, correct, { hinted = false, firstTry = true, sec = 0 } = {}) {
  const before = state.units[p.unitId];
  let us = recordAnswer(before, p.level, correct, { hinted });
  // さかのぼり：2学年以上前の単元を、練習で新たに習得した
  const u = getUnit(p.unitId);
  if (u && profileGradeIndex(state.profile) - u.gi >= 2 && masteredLevel(before) < 1 && masteredLevel(us) >= 1) {
    us = { ...us, climbed: true };
  }
  const xp = correct ? xpFor(p.level, { hinted, firstTry }) : 0;
  const totals = { ...state.totals };
  totals.n += 1;
  totals.c += correct ? 1 : 0;
  totals.xp += xp;
  if (correct && p.level >= 3) totals.hi3 = (totals.hi3 || 0) + 1;
  if (correct && p.level >= 4) totals.hi4 = (totals.hi4 || 0) + 1;
  const log = [{ t: Date.now(), u: p.unitId, L: p.level, ok: correct, h: hinted }, ...(state.log || [])].slice(0, 400);
  const next = {
    ...state,
    units: { ...state.units, [p.unitId]: us },
    totals,
    daily: bumpDaily(state, { n: 1, c: correct ? 1 : 0, xp, sec }),
    log,
  };
  const levelBefore = displayLevel(before).level;
  const res = settle(next, p.unitId);
  return { ...res, xp, levelUp: displayLevel(us).level > levelBefore && !displayLevel(us).estimated };
}

/** 確認テストの結果を記録 */
export function applyTest(state, unitId, level, score, total) {
  const { us, pass } = recordTest(state.units[unitId], level, score, total);
  const bonus = pass ? 50 + level * 10 : 0;
  const next = {
    ...state,
    units: { ...state.units, [unitId]: us },
    totals: { ...state.totals, xp: state.totals.xp + bonus },
    daily: bumpDaily(state, { xp: bonus }),
  };
  return { ...settle(next, unitId), pass, bonus };
}

/** おすすめ演習の後：復習だった単元の復習間隔を更新 */
export function applyReview(state, accByUnit) {
  const units = { ...state.units };
  for (const [id, acc] of Object.entries(accByUnit)) {
    if (units[id]?.rev) units[id] = recordReview(units[id], acc);
  }
  return { ...state, units };
}

/** 診断結果を反映 */
export function applyDiag(state, result) {
  const units = { ...state.units };
  for (const [id, e] of Object.entries(result.estimates)) {
    const us = { ...(units[id] || emptyUnit()) };
    us.est = e.est;
    us.weak = !!e.weak;
    if (e.weak) us.wasWeak = true;
    units[id] = us;
  }
  const bonus = 100;
  const next = {
    ...state,
    units,
    diag: result.summary,
    totals: { ...state.totals, xp: state.totals.xp + bonus },
    daily: bumpDaily(state, { xp: bonus }),
  };
  return { ...settle(next), bonus };
}

/** 学習時間（秒）を足す */
export function addTime(state, sec) {
  if (!sec) return state;
  return { ...state, daily: bumpDaily(state, { sec }) };
}
