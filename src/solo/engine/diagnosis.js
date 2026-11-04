// ============================================================
// diagnosis.js — 理解度診断（さかのぼり診断）
//
//  1. 「もう習った」単元のうち、いちばん先にある単元（先端）から1問ずつ出す
//  2. 正解 → その単元の前提（さかのぼった先）はたぶん大丈夫、とみなして聞かない
//  3. 不正解 → その単元の前提単元にさかのぼって出題（つまずきの“根っこ”を探す）
//  4. 分野ごとの系統を順番に回す（1つの分野だけで出題数を使い切らない）
//  5. 出題数の上限（budget）に達したら終了 → 単元ごとの推定レベルを返す
//
//  診断中は正誤を見せない（落ち込ませないため）。結果画面でまとめて伝える。
// ============================================================
import { UNITS, getUnit, prereqsOf, ancestorsOf, descendantsOf, AREAS } from "../content/index.js";
import { requiredLevel, isLearned } from "./goals.js";

export const DIAG_SIZES = [
  { id: "short", label: "かんたん（約10問）", budget: 10 },
  { id: "normal", label: "ふつう（約15問）", budget: 15 },
  { id: "long", label: "しっかり（約25問）", budget: 25 },
];

/** 診断の対象：目標の範囲内で、もう習った単元 */
function scopeUnits(profile) {
  return UNITS.filter((u) => requiredLevel(u, profile) > 0 && isLearned(u, profile) && u.maxLevel > 0);
}

/** 出題レベル：標準（目標が簡単なら簡単） */
export function probeLevel(unit, profile) {
  return Math.max(1, Math.min(2, requiredLevel(unit, profile), unit.maxLevel));
}

export function startDiagnosis(profile, budget = 15) {
  const scope = scopeUnits(profile);
  const inScope = new Set(scope.map((u) => u.id));
  // 先端：範囲内に「自分を前提にする単元」がない単元
  const tips = scope.filter((u) => !UNITS.some((d) => inScope.has(d.id) && (d.prereqs || []).includes(u.id)));
  tips.sort((a, b) => b.gi - a.gi);
  // 分野ごとに順番に（新しい学年から）
  const byArea = Object.fromEntries(AREAS.map((a) => [a, tips.filter((u) => u.area === a)]));
  const first = [];
  for (let round = 0; first.length < Math.min(6, budget) && round < 10; round++) {
    for (const a of AREAS) {
      const u = byArea[a][round];
      if (u && first.length < Math.min(6, budget)) first.push(u.id);
    }
  }
  return {
    budget: Math.min(budget, Math.max(1, scope.length)),
    scope: [...inScope],
    // 系統（strand）＝はじめの先端1つから始まる「さかのぼりの列」。系統を順番に回して、
    // 1つの分野のさかのぼりだけで出題数を使い切らないようにする。
    strands: first.map((id) => [id]),
    turn: 0,
    asked: [], // { unitId, level, correct, strand }
    okInferred: [],
  };
}

/** 次に出す単元（なければ null）。sess.cur に、その単元の系統番号を入れる */
export function nextDiagUnit(sess) {
  if (sess.asked.length >= sess.budget) return null;
  const tested = new Set(sess.asked.map((a) => a.unitId));
  const ok = new Set(sess.okInferred);
  const n = sess.strands.length;
  for (let k = 0; k < n; k++) {
    const si = (sess.turn + k) % n;
    const q = sess.strands[si];
    while (q.length && (tested.has(q[0]) || ok.has(q[0]))) q.shift();
    if (q.length) {
      sess.turn = si + 1;
      sess.cur = si;
      return q[0];
    }
  }
  // どの系統も空：まだ何もわかっていない単元のうち、土台として大事なもの（子孫が多い）を選ぶ
  const inScope = new Set(sess.scope);
  const known = new Set([...tested, ...ok]);
  const areaCount = Object.fromEntries(AREAS.map((a) => [a, 0]));
  for (const a of sess.asked) areaCount[getUnit(a.unitId)?.area] += 1;
  let best = null, bestScore = -1;
  for (const id of sess.scope) {
    if (known.has(id)) continue;
    const u = getUnit(id);
    const weight = descendantsOf(id).filter((d) => inScope.has(d)).length + 1;
    const score = weight / (1 + areaCount[u.area]) + u.gi * 0.1;
    if (score > bestScore) { bestScore = score; best = id; }
  }
  if (best) {
    sess.strands.push([best]);
    sess.cur = sess.strands.length - 1;
    sess.turn = 0;
  }
  return best;
}

/** 回答を反映（sess を書き換えて返す） */
export function answerDiag(sess, unitId, level, correct) {
  const si = sess.cur ?? 0;
  sess.asked.push({ unitId, level, correct, strand: si });
  const strand = sess.strands[si] || [];
  const idx = strand.indexOf(unitId);
  if (idx >= 0) strand.splice(idx, 1);
  const inScope = new Set(sess.scope);
  if (correct) {
    // 前提はたぶん大丈夫
    const ok = new Set(sess.okInferred);
    for (const a of ancestorsOf(unitId)) if (inScope.has(a)) ok.add(a);
    sess.okInferred = [...ok];
  } else {
    // この系統の先頭に、前提をさかのぼって入れる（新しい学年の前提から先に）
    const tested = new Set(sess.asked.map((a) => a.unitId));
    const ok = new Set(sess.okInferred);
    const back = prereqsOf(unitId)
      .filter((p) => inScope.has(p) && !tested.has(p) && !ok.has(p))
      .sort((a, b) => getUnit(b).gi - getUnit(a).gi);
    sess.strands[si] = [...back, ...strand.filter((id) => !back.includes(id))];
  }
  return sess;
}

/**
 * 診断の結果をまとめる。
 * @returns {{ estimates: Object<unitId,{est,weak}>, summary }}
 */
export function finishDiag(sess, profile) {
  const estimates = {};
  const res = new Map(sess.asked.map((a) => [a.unitId, a]));
  const ok = new Set(sess.okInferred);

  for (const a of sess.asked) {
    const u = getUnit(a.unitId);
    if (a.correct) {
      estimates[a.unitId] = { est: a.level, weak: false };
    } else {
      // 根っこ判定：前提のうち「出題して不正解」のものが無ければ、この単元がつまずきの根っこ
      const pre = prereqsOf(a.unitId).filter((p) => sess.scope.includes(p));
      const deeperWrong = pre.some((p) => res.has(p) && !res.get(p).correct);
      estimates[a.unitId] = { est: 0, weak: !deeperWrong };
      void u;
    }
  }
  for (const id of ok) {
    if (estimates[id]) continue;
    const u = getUnit(id);
    estimates[id] = { est: Math.min(probeLevel(u, profile), 2), weak: false, inferred: true };
  }

  const byArea = Object.fromEntries(AREAS.map((a) => [a, { asked: 0, correct: 0 }]));
  for (const a of sess.asked) {
    const area = getUnit(a.unitId)?.area;
    if (!byArea[area]) continue;
    byArea[area].asked += 1;
    byArea[area].correct += a.correct ? 1 : 0;
  }
  const weakRoots = Object.entries(estimates).filter(([, e]) => e.weak).map(([id]) => id)
    .sort((a, b) => getUnit(a).gi - getUnit(b).gi);
  const strong = sess.asked.filter((a) => a.correct).map((a) => a.unitId);
  return {
    estimates,
    summary: {
      at: Date.now(),
      total: sess.asked.length,
      correct: sess.asked.filter((a) => a.correct).length,
      weakRoots,
      strong,
      inferredOk: sess.okInferred.length,
      byArea,
      asked: sess.asked,
    },
  };
}
