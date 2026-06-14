// ============================================================
// unitTest.js — 単元テストの出題エンジン
//  章を渡すと、その章の全小単元から問題を集めて1セットにする。
//  各単元から「標準」と「発展」を1問ずつ → 章を網羅したテストになる。
//  数値は生成のたびに変わる（パターンはデータ＝PDF準拠）。
// ============================================================
import { genProblem } from "./generator.js";
import { shuffle } from "./rng.js";

/**
 * 章の単元テスト問題セットを作る。
 * @param {object} chapter CHAPTERS の1章
 * @param {string[]} levels 各単元から出す難易度（既定：標準＋発展）
 * @returns {Array} [{ q, ans, h1, h2, unitId, unitName, level }, ...]（シャッフル済み）
 */
export function genUnitTest(chapter, levels = ["standard", "advanced"]) {
  const out = [];
  for (const unit of chapter.units) {
    for (const level of levels) {
      const q = genProblem(unit, level);
      if (q) out.push({ ...q, unitId: unit.id, unitName: unit.name, level });
    }
  }
  return shuffle(out);
}

/** 単元テストの制限時間（秒）。1問あたり60秒で計算（章の問題数に応じて変わる）。 */
export function unitTestTimeLimit(questionCount) {
  return questionCount * 60;
}

/** 秒を mm:ss 形式の文字列にする */
export function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
