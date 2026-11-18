// geo.js — 角度の約束（player.js と dsl.js で共通）
// 角度は「画面で反時計まわり」に増える度。0°＝右（東）、90°＝上（北）。y は下向き（SVG）。
export const rad = (d) => (d * Math.PI) / 180;
export const polar = (c, r, deg) => [c[0] + r * Math.cos(rad(deg)), c[1] - r * Math.sin(rad(deg))];
export const dirDeg = (a, b) => (Math.atan2(-(b[1] - a[1]), b[0] - a[0]) * 180) / Math.PI;
export const norm = (d) => ((d % 360) + 360) % 360;
