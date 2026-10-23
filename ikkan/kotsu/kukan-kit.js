// ============================================================
// kukan-kit.js — 空間図形の問題データ（content/）を書くための、小さな補助
//   kit.js（コツコツくんの本物と同じ道具）に、ないものだけをここに足す。
// ============================================================
import { t } from "./kit.js";

/** いつも同じ問題になるテンプレート（バリエーションの検査を、外すしるし）。コツコツくんの本物の検査も、fixed を見る */
export const fixed = (id, build) => ({ ...t(id, build), fixed: true });

/**
 * ikkan の 1 授業ぶんの単元をつくる。
 *   unit("03", { name, desc, prereqs, points, levels })
 *   単元 id は J1-kk03（既存の中1「空間図形」J1-k1〜k4 と、ぶつからないようにしてある）。
 *   levels：1＝基礎、2＝標準、3＝応用、4＝入試レベル（ikkan の演習プリントの見出しと同じ）
 */
export const unit = (no, o) => ({
  id: `J1-kk${no}`,
  grade: "J1",
  area: "geo",
  chapterId: "ikkan-kukan",
  chapterName: "空間図形（ikkan の授業）",
  ikkan: { lesson: `kukan-${no}` },
  ...o,
});

/** 円周率を使う答え：π の係数（□π の □）を、整数か約分した分数文字列で返す。fracAns と同じ（kit.js から使ってもよい） */
export { fracAns } from "./kit.js";
