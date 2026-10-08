'use strict';
/* ============================================================
   core.js — 定数と小さな道具
   シミュレーション側は「整数（サブピクセル）だけ」で計算する。
   → 2台のブラウザで同じ入力を流せば同じ結果になる（オンライン対戦の前提）。
   ============================================================ */
const SP = 256;                       // 1px = 256 サブピクセル
const SCREEN_W = 256, SCREEN_H = 224; // ファミコンっぽい解像度
const FLOOR_Y = 190;                  // 床（足が付く画面Y）
const WALL_L = 28, WALL_R = SCREEN_W - 28; // 戦える範囲（中心X）。パーツが画面外に出ない余白
const FPS = 60;
// ジャンプの高さの倍率（1 = 最初の高さ）。初速と重力をどちらも同じ倍率にするので、滞空時間は変わらず、高さだけが変わる。
const JUMP_MUL = 2;

// 入力ビット
const IN = { UP: 1, DOWN: 2, LEFT: 4, RIGHT: 8, A: 16, B: 32 };

const S = (n) => Math.round(n * SP);
const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
const sgn = (v) => (v > 0 ? 1 : v < 0 ? -1 : 0);
const absI = (v) => (v < 0 ? -v : v);

// 決定論的な乱数（xorshift32）。Math.random は対戦ロジックでは使わない。
function rngNext(r) {
  let x = r.s | 0;
  if (x === 0) x = 0x2545f491;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  r.s = x | 0;
  return x >>> 0;
}
function rngInt(r, n) { return rngNext(r) % n; }
