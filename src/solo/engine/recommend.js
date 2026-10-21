// ============================================================
// recommend.js — 「今日のおすすめ」を決める
//
//  優先順位（上ほど先）：
//   1. つまずきの根っこ（さかのぼり）… 弱い単元の、さらに前提で弱いところ
//   2. 目標レベルに届いていない、もう習った単元（最近間違えたものを優先）
//   3. 復習の時期が来た単元（忘れる前にもう一度）
//   4. まだ確認していない、もう習った単元
//   5. 予習（前提がそろっている、これから習う単元）
//  土台として多くの単元につながる単元ほど少し優先する。
// ============================================================
import { UNITS, getUnit, prereqsOf, descendantsOf, GRADE_LABEL } from "../content/index.js";
import { requiredLevel, isLearned, profileGradeIndex } from "./goals.js";
import { displayLevel, masteredLevel, reviewDue, startLevel, unitStatus } from "./mastery.js";

const DAY = 86400000;

/** 単元ごとの基本情報（何度も使うのでまとめて計算） */
export function analyze(state) {
  const profile = state.profile;
  const map = new Map();
  for (const u of UNITS) {
    const req = requiredLevel(u, profile);
    const us = state.units[u.id];
    const learned = isLearned(u, profile);
    const { level, estimated } = displayLevel(us);
    map.set(u.id, {
      u, req, us, learned, level, estimated,
      mastered: masteredLevel(us),
      status: unitStatus(us, req, learned),
    });
  }
  return map;
}

/** 弱い単元から前提へたどって「根っこ」を探す（前提がすべてOKな弱い単元） */
function weakRoot(id, info, seen = new Set()) {
  if (seen.has(id)) return null;
  seen.add(id);
  for (const p of prereqsOf(id)) {
    const x = info.get(p);
    if (!x || !x.req || !x.learned) continue;
    if (x.status === "weak" || (x.level < 1 && x.status !== "unknown")) {
      return weakRoot(p, info, seen) || p;
    }
  }
  return null;
}

/**
 * おすすめの一覧。
 * @returns {Array<{unitId, kind, reason, level, score}>}
 */
export function recommend(state, { now = Date.now(), limit = 6, info = analyze(state) } = {}) {
  const gi = profileGradeIndex(state.profile);
  const out = new Map();
  const put = (unitId, kind, reason, score) => {
    const x = info.get(unitId);
    if (!x) return;
    const cur = out.get(unitId);
    if (cur && cur.score >= score) return;
    out.set(unitId, { unitId, kind, reason, score, level: startLevel(x.us, x.req, x.u.maxLevel) });
  };
  const fanout = (id) => Math.min(6, descendantsOf(id).filter((d) => info.get(d)?.req).length);
  const recency = (x) => (x.u.gi === gi ? 10 : x.u.gi === gi - 1 ? 5 : 0);

  for (const [id, x] of info) {
    if (!x.req || x.u.maxLevel === 0) continue;
    const recentWrong = x.us?.wrongAt && now - x.us.wrongAt < 3 * DAY;

    if (x.learned && x.status === "weak") {
      const root = weakRoot(id, info);
      if (root) {
        const r = info.get(root);
        put(root, "sakanobori",
          `「${x.u.name}」のつまずきの根っこかも。${GRADE_LABEL[r.u.grade]}にさかのぼって、土台から固めよう`,
          120 + fanout(root) * 3);
      } else {
        put(id, "weak", x.us?.weak ? "診断でつまずきが見つかった単元。ここを越えると一気に進む" : "最近まちがいが多い単元。今のうちに立て直そう",
          100 + fanout(id) * 3 + recency(x) + (recentWrong ? 10 : 0));
      }
      continue;
    }
    if (x.learned && (x.status === "learning")) {
      const gap = x.req - x.mastered;
      put(id, "goal", gap <= 1 ? `目標の「${["", "簡単", "標準", "応用", "難関"][x.req]}」まであと少し` : "目標レベルに向けて練習中",
        80 + (gap <= 1 ? 8 : 0) + recency(x) + (recentWrong ? 15 : 0) + fanout(id));
      continue;
    }
    if ((x.status === "goal" || x.status === "beyond") && reviewDue(x.us, now)) {
      const over = Math.floor((now - x.us.rev.next) / DAY);
      put(id, "review", "忘れる前に復習しよう（間をあけて解くと記憶に残る）", 60 + Math.min(20, over * 2));
      continue;
    }
    if (x.learned && x.status === "unknown") {
      put(id, "check", "まだ確認していない単元。理解度をチェックしよう", 40 + fanout(id) + recency(x));
      continue;
    }
    if (x.learned && x.status === "est") {
      put(id, "confirm", "診断では「たぶんOK」。確認テストで確かめよう", 30 + recency(x));
      continue;
    }
    if (!x.learned && x.u.gi <= gi + 1 && x.status === "future") {
      const ready = prereqsOf(id).every((p) => {
        const y = info.get(p);
        return !y || !y.req || y.level >= 1;
      });
      if (ready) put(id, "ahead", "前提はそろっている。予習してみよう", 20 + (x.u.gi === gi ? 5 : 0) - x.u.gi * 0.1);
    }
  }
  return [...out.values()].sort((a, b) => b.score - a.score).slice(0, limit);
}

/** 目標までの進み具合：範囲内の単元のうち目標レベルに達した割合など */
export function goalProgress(state, info = analyze(state)) {
  const stages = { E: { done: 0, total: 0 }, J: { done: 0, total: 0 }, H: { done: 0, total: 0 } };
  let done = 0, total = 0, learnedDone = 0, learnedTotal = 0;
  for (const [, x] of info) {
    if (!x.req) continue;
    const ok = x.level >= x.req;
    total++; if (ok) done++;
    const st = stages[x.u.grade[0]];
    st.total++; if (ok) st.done++;
    if (x.learned) { learnedTotal++; if (ok) learnedDone++; }
  }
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0, stages, learnedDone, learnedTotal };
}

/** 分野ごとの理解度（レーダーチャート用）：もう習った範囲での平均（0〜100） */
export function areaScores(state, info = analyze(state)) {
  const acc = {};
  for (const [, x] of info) {
    if (!x.req || !x.learned) continue;
    const a = (acc[x.u.area] ||= { sum: 0, n: 0 });
    a.sum += Math.min(1, x.level / x.req) * (x.estimated ? 0.85 : 1);
    a.n += 1;
  }
  return Object.fromEntries(Object.entries(acc).map(([k, v]) => [k, Math.round((v.sum / v.n) * 100)]));
}

/** おすすめ演習（ミックス）用：上位のおすすめから単元とレベルを並べる */
export function mixPlan(state, n = 10) {
  const recs = recommend(state, { limit: 5 });
  if (!recs.length) return [];
  const plan = [];
  // 1位を多めに（3:2:2:2:1 くらい）
  const weights = [3, 2, 2, 2, 1];
  recs.forEach((r, i) => { for (let k = 0; k < (weights[i] || 1); k++) plan.push({ unitId: r.unitId, level: r.level }); });
  while (plan.length < n) plan.push(...plan.slice(0, n - plan.length));
  return plan.slice(0, n);
}

export { getUnit };
