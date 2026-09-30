// ============================================================
// tpl/index.js — 問題テンプレの登録所（スキルID → テンプレ配列）
//   新しい単元の問題を足すときは、tpl/ にファイルを作ってここに1行足す。
// ============================================================
import elemNum1 from "./elem_num1.js";
import elemNum2 from "./elem_num2.js";
import elemOther from "./elem_other.js";
import midNum from "./mid_num.js";
import midAlg1 from "./mid_alg1.js";
import midAlg2 from "./mid_alg2.js";
import midFuncGeom from "./mid_func_geom.js";

export const TEMPLATES = {
  ...elemNum1,
  ...elemNum2,
  ...elemOther,
  ...midNum,
  ...midAlg1,
  ...midAlg2,
  ...midFuncGeom,
};
