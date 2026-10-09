// ============================================================
// tpl/hs_trig.js — 三角関数の「特別な角」の厳密な値と、ラジアンの TeX
//
//  値は { tex, val }（tex は TeX、val は浮動小数の検算用）。
//  角度は「度」の整数（30° や 45° の倍数）で扱い、象限と基準角から符号を決める。
//  ※ テンプレはここで出した値を Math.sin などでも必ず検算する。
// ============================================================
import { Q } from "../../core/rational.js";

const V = {
  zero: { tex: "0", val: 0 },
  half: { tex: "\\frac{1}{2}", val: 0.5 },
  s22: { tex: "\\frac{\\sqrt{2}}{2}", val: Math.SQRT2 / 2 },
  s32: { tex: "\\frac{\\sqrt{3}}{2}", val: Math.sqrt(3) / 2 },
  one: { tex: "1", val: 1 },
  t33: { tex: "\\frac{\\sqrt{3}}{3}", val: Math.sqrt(3) / 3 },
  t3: { tex: "\\sqrt{3}", val: Math.sqrt(3) },
};
export const negV = (v) => (v.val === 0 ? v : { tex: v.tex.startsWith("-") ? v.tex.slice(1) : `-${v.tex}`, val: -v.val });

const REF = [0, 30, 45, 60, 90];
const SIN = [V.zero, V.half, V.s22, V.s32, V.one];
const COS = [V.one, V.s32, V.s22, V.half, V.zero];
const TAN = [V.zero, V.t33, V.one, V.t3, null];

/** 度 → { sin, cos, tan }（tan は定義されないとき null）。30° と 45° の倍数だけ */
export function trigExact(deg) {
  const d = ((deg % 360) + 360) % 360;
  let ref;
  let sSign;
  let cSign;
  if (d <= 90) [ref, sSign, cSign] = [d, 1, 1];
  else if (d <= 180) [ref, sSign, cSign] = [180 - d, 1, -1];
  else if (d <= 270) [ref, sSign, cSign] = [d - 180, -1, -1];
  else [ref, sSign, cSign] = [360 - d, -1, 1];
  const i = REF.indexOf(ref);
  if (i < 0) throw new Error(`trigExact: 特別な角ではない ${deg}`);
  const sin = sSign > 0 ? SIN[i] : negV(SIN[i]);
  const cos = cSign > 0 ? COS[i] : negV(COS[i]);
  const tanBase = TAN[i];
  const tan = tanBase === null ? null : sSign * cSign > 0 ? tanBase : negV(tanBase);
  return { sin, cos, tan };
}

/** k π（k は有理数）の TeX。例: 5/6 → \frac{5\pi}{6}, 1 → \pi, -1/3 → -\frac{\pi}{3} */
export function radTex(k) {
  if (k.n === 0) return "0";
  const sign = k.n < 0 ? "-" : "";
  const n = Math.abs(k.n);
  if (k.d === 1) return `${sign}${n === 1 ? "" : n}\\pi`;
  return `${sign}\\frac{${n === 1 ? "" : n}\\pi}{${k.d}}`;
}

/** 度 → π の何倍か（既約な有理数） */
export const degToPiQ = (deg) => Q(deg, 180);

/** 値の表（選択肢のごまかし用）：基準になる値の一覧 */
export const VALUE_POOL = [
  V.zero,
  V.half,
  negV(V.half),
  V.s22,
  negV(V.s22),
  V.s32,
  negV(V.s32),
  V.one,
  negV(V.one),
  V.t33,
  negV(V.t33),
  V.t3,
  negV(V.t3),
];
export { V };
