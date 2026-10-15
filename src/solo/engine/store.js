// ============================================================
// store.js — 学習データの保存（いまはブラウザ内 localStorage）
//
//  state = {
//    v: 1,
//    profile: { name, grade:"E1".."H3"|"R", goal:{ tier, track, uni }, learned:[unitId], dailyGoal, createdAt },
//    units:   { [unitId]: us }            … mastery.js の単元記録
//    daily:   { "2026-10-07": { n, c, xp, sec } }
//    totals:  { n, c, xp, hi3, hi4 }      … 合計（hi3=応用以上の正解, hi4=難関の正解）
//    reached: { [unitId]: 時刻 }          … 目標レベルに到達した単元
//    badges:  { [badgeId]: 時刻 }
//    diag:    最後の診断のまとめ / log: 最近の解答（最大 400件）
//  }
//  将来サーバー保存にするときは、load/save だけ差し替えればよい。
// ============================================================

// ※ 同じサイト（github.io）の別の版「コツコツくん」が mathlab-solo-v1 を使っているので、記録が混ざらないよう別の名前にする
const KEY = "mathlab-solo-lab-v1";
const APP = "mathlab-solo-lab";

export function blankState() {
  return {
    v: 1,
    profile: null,
    units: {},
    daily: {},
    totals: { n: 0, c: 0, xp: 0, hi3: 0, hi4: 0 },
    reached: {},
    badges: {},
    diag: null,
    log: [],
  };
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return blankState();
    const s = JSON.parse(raw);
    if (!s || s.v !== 1) return blankState();
    return { ...blankState(), ...s };
  } catch {
    return blankState();
  }
}

export function save(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function exportJson(state) {
  return JSON.stringify({ app: APP, exportedAt: new Date().toISOString(), state }, null, 1);
}

export function importJson(text) {
  const obj = JSON.parse(text);
  // 別の版（コツコツくんなど）の書き出しは、記録の形がちがうことがあるので読み込まない
  if (obj?.app && obj.app !== APP) throw new Error("このファイルは別の版のアプリの記録のようです（この版では読み込めません）");
  const s = obj?.state || obj;
  if (!s || s.v !== 1) throw new Error("数学ラボ ソロのデータではないようです");
  return { ...blankState(), ...s };
}

export function clearAll() {
  try { localStorage.removeItem(KEY); } catch { /* 何もしない */ }
}
