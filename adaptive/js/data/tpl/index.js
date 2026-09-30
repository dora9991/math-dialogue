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
import hsNum from "./hs_num.js";
import hsAlg1 from "./hs_alg1.js";
import hsAlg2 from "./hs_alg2.js";
import hsFunc1 from "./hs_func1.js";
import hsFunc2 from "./hs_func2.js";
import hsFunc3 from "./hs_func3.js";
import hsGeom from "./hs_geom.js";
import hsData from "./hs_data.js";
import hsProb from "./hs_prob.js";
import hsSeq from "./hs_seq.js";
import hsCalcDeriv from "./hs_calc_deriv.js";
import hsCalcDeriv2 from "./hs_calc_deriv2.js";
import hsCalcInteg from "./hs_calc_integ.js";
import hsCalcLimit from "./hs_calc_limit.js";

export const TEMPLATES = {
  ...elemNum1,
  ...elemNum2,
  ...elemOther,
  ...midNum,
  ...midAlg1,
  ...midAlg2,
  ...midFuncGeom,
  ...hsNum,
  ...hsAlg1,
  ...hsAlg2,
  ...hsFunc1,
  ...hsFunc2,
  ...hsFunc3,
  ...hsGeom,
  ...hsData,
  ...hsProb,
  ...hsSeq,
  ...hsCalcDeriv,
  ...hsCalcDeriv2,
  ...hsCalcInteg,
  ...hsCalcLimit,
};
