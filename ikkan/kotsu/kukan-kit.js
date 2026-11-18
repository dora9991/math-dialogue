// ============================================================
// kukan-kit.js — 空間図形の問題データ（content/kukan-NN.js）を書くための補助（unit-kit.js の、空間図形用の呼び名）
// ============================================================
import { fixed, unitFor } from "./unit-kit.js";

export { fixed };
/** 空間図形の 1 授業ぶんの単元。unit("03", { name, desc, prereqs, points, levels }) */
export const unit = unitFor("kukan");
export { fracAns } from "./kit.js";
