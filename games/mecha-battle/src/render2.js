'use strict';
/* ============================================================
   render2.js — あとから足した8体の「構え」「飛び道具」「技の演出」
   render.js の POSES に構えを足し、PROJ_DRAW / FX_DRAW / FXL_DRAW に描き方を登録する。
   ============================================================ */

/* ---------- 構え（静止位置からのずれ [前方向dx, 上dy]） ---------- */
Object.assign(POSES, {
  // カゲマル
  slash: { t: [5, -2], h: [7, -2], hf: [30, 11], hb: [12, 9], ff: [8, 0], fb: [-6, 0] },
  slashRec: { t: [2, 0], h: [2, 0], hf: [14, 6], hb: [5, 5] },
  flipKick: { t: [-3, 4], h: [-7, 8], hf: [-9, 13], hb: [-11, 11], ff: [24, 20], fb: [11, 14] },
  // ガブリ
  biteWind: { h: [-6, 3], t: [-3, 0], hf: [-2, 3], hb: [-5, 2] },
  bite: { h: [20, -2], t: [7, 0], hf: [12, 5], hb: [2, 3], ff: [5, 0] },
  biteRec: { h: [9, -1], t: [3, 0], hf: [6, 3] },
  tailWind: { t: [-4, -1], h: [-5, -1], hf: [-4, 3], hb: [-7, 2], ff: [3, 0], fb: [-3, 0] },
  tailSpin: { t: [2, 0], h: [4, 0], hf: [14, 6], hb: [-14, 6], ff: [9, 0], fb: [-9, 0] },
  tailRec: { t: [0, -1], h: [0, -1], hf: [7, 3], hb: [-5, 3] },
  roarWind: { h: [-4, 6], t: [-3, -1], hf: [-6, 9], hb: [-9, 9] },
  roar: { h: [9, 8], t: [3, -1], hf: [-1, 17], hb: [-5, 17] },
  roarRec: { h: [3, 3], t: [1, 0] },
  stompUp: { t: [0, 2], h: [0, 3], hf: [5, 9], hb: [-4, 9], ff: [5, 8], fb: [-4, 7] },
  stompDown: { t: [2, -3], h: [3, -4], hf: [11, 4], hb: [-7, 6], ff: [7, -1], fb: [-5, 1] },
  stompRec: { t: [0, -5], h: [0, -6], hf: [5, -3], hb: [-4, -3], ff: [7, 0], fb: [-5, 0] },
  // フブキ
  blowWind: { t: [-3, 0], h: [-5, -1], hf: [-4, 6], hb: [-7, 5] },
  blow: { t: [3, 0], h: [7, 0], hf: [19, 7], hb: [14, 7] },
  blowRec: { t: [1, 0], h: [2, 0], hf: [9, 4], hb: [6, 4] },
  // ハヤブサ
  rocketHead: { h: [15, -1], t: [7, -1], hf: [17, -3], hb: [3, -2], ff: [-4, 5], fb: [-12, 6] },
  jetBack: { t: [-3, 0], h: [-4, 1], hf: [13, 7], hb: [9, 6], ff: [-3, 3], fb: [-6, 2] },
  // ダルマ
  curl: { t: [0, -7], h: [1, -9], hf: [3, -6], hb: [-3, -6], ff: [4, 0], fb: [-4, 0] },
  rollA: { h: [3, -16], t: [0, -2], hf: [8, -7], hb: [-7, -7], ff: [3, 3], fb: [-3, 3] },
  rollB: { h: [10, -10], t: [-1, -4], hf: [10, -3], hb: [-5, -12], ff: [5, 4], fb: [-4, 5] },
  rollC: { h: [3, -4], t: [0, -7], hf: [3, -12], hb: [-3, -4], ff: [-2, 4], fb: [4, 4] },
  rollD: { h: [-5, -11], t: [1, -4], hf: [3, -3], hb: [-8, -8], ff: [-3, 4], fb: [3, 5] },
  zutsuWind: { h: [-5, 0], t: [-3, 0], hf: [-2, 4], hb: [-4, 3] },
  zutsu: { h: [17, -6], t: [5, -2], hf: [8, 2], hb: [2, 3], ff: [4, 0] },
  zutsuRec: { h: [6, -2], t: [2, 0] },
  wish: { t: [0, -1], h: [0, -2], hf: [5, 26], hb: [-1, 24], ff: [4, 0], fb: [-4, 0] },
  // メンタロー
  noodleWind: { h: [-3, 0], t: [-3, 0], hf: [-4, 12], hb: [-2, 6] },
  noodle: { hf: [17, 20], hb: [10, 10], h: [3, 0], t: [2, 0] },
  noodle2: { hf: [21, 17], hb: [12, 8], h: [5, 0], t: [3, 0] },
  noodleRec: { hf: [8, 10], h: [1, 0] },
  steamPose: { hf: [11, 10], hb: [5, 10], t: [0, -3], h: [0, -3] },
  // カワタロ
  geyserCast: { hf: [3, -4], hb: [-2, -4], t: [0, -4], h: [1, -5] },
  geyserCast2: { hf: [17, -6], hb: [12, -6], t: [2, -4], h: [3, -5] },
  spinA: { hf: [15, 9], hb: [-15, 9], ff: [8, 0], fb: [-8, 0], t: [0, -2], h: [0, -2] },
  spinB: { hf: [4, 12], hb: [-4, 6], ff: [2, 2], fb: [-2, 0], t: [2, -2], h: [2, -2] },
  spinC: { hf: [-15, 9], hb: [15, 9], ff: [-8, 0], fb: [8, 0], t: [0, -2], h: [0, -2] },
  spinD: { hf: [-4, 6], hb: [4, 12], ff: [-2, 0], fb: [2, 2], t: [-2, -2], h: [-2, -2] },
  // ポポロ
  jugWind: { hf: [3, 24], hb: [-2, 20], t: [-1, 0] },
  jug: { hf: [9, 31], hb: [-6, 35], t: [1, 0], h: [1, 0] },
  ballWind: { t: [0, -4], h: [0, -5], hf: [3, -3], hb: [-3, -3], ff: [3, 0], fb: [-3, 0] },
  ballA: { ff: [8, 12], fb: [-6, 12], t: [2, 12], h: [3, 12], hf: [12, 21], hb: [-9, 17] },
  ballB: { ff: [6, 12], fb: [-8, 12], t: [1, 13], h: [2, 13], hf: [10, 17], hb: [-8, 22] },
  ballRec: { t: [1, 11], h: [1, 11], ff: [5, 11], fb: [-5, 11], hf: [6, 13], hb: [-3, 12] },
});

/* ---------- 飛び道具 ----------
   (c, pr, x, y, d, hw, hh, t, fr, m)  x,y=画面の中心  d=向き(±1)  hw,hh=半分の大きさ  t=出てからのフレーム */
const fwdX = (x, d, a, w) => (d > 0 ? x + a : x - a - w);   // 向きに合わせた四角の左はし（前方向に a から w の幅）

PROJ_DRAW.shuriken = (c, pr, x, y, d, hw, hh, t, fr) => {
  R(c, x - d * 12 - (d > 0 ? 6 : 0), y, 6, 1, 'rgba(255,255,255,0.7)');
  const a = t * 0.9;
  for (const [col, r1, r2] of [['#000', 8, 3.6], ['#d8d8e4', 7, 2.6]]) {
    for (let i = 0; i < 4; i++) {
      const th = a + i * Math.PI / 2;
      Tri(c, x + Math.cos(th - 0.55) * r2, y + Math.sin(th - 0.55) * r2, x + Math.cos(th + 0.55) * r2, y + Math.sin(th + 0.55) * r2, x + Math.cos(th) * r1, y + Math.sin(th) * r1, col);
    }
    E(c, x, y, r2 - 0.4, r2 - 0.4, col);
  }
  R(c, x - 1, y - 1, 2, 2, '#383838');
};
PROJ_DRAW.kunai = (c, pr, x, y, d) => {
  R(c, fwdX(x, d, -8, 17), y - 2, 17, 5, '#000');
  R(c, fwdX(x, d, -7, 7), y - 1, 7, 3, '#886400'); R(c, fwdX(x, d, 0, 8), y - 1, 8, 3, '#d8d8e4'); R(c, fwdX(x, d, 1, 7), y - 1, 7, 1, '#fcfcfc');
  Tri(c, x + d * 12, y, x + d * 7, y - 3, x + d * 7, y + 3, '#000'); Tri(c, x + d * 11, y, x + d * 7, y - 2, x + d * 7, y + 2, '#d8d8e4');
  E(c, x - d * 10, y, 3, 3, '#000'); E(c, x - d * 10, y, 1.6, 1.6, '#3cbcfc');
};
PROJ_DRAW.roar = (c, pr, x, y, d, hw, hh, t, fr) => {
  for (let k = 0; k < 3; k++) {
    const r = 6 + k * 5 + (t >> 1), off = ((fr >> 2) + k) % 3;
    for (const [col, size] of [['#000', 4], [off === k ? '#fcfcfc' : '#fc9838', 2]]) {
      for (let a = -70; a <= 70; a += 5) {
        const rad = a * Math.PI / 180, px = Math.round(x - d * 12 + d * Math.cos(rad) * r), py = Math.round(y + Math.sin(rad) * r * 1.6);
        R(c, px - (size >> 1), py - (size >> 1), size, size, col);
      }
    }
  }
};
PROJ_DRAW.snowball = (c, pr, x, y, d, hw, hh, t, fr) => {
  for (let i = 1; i <= 3; i++) R(c, x - d * (8 + i * 4), y - 2 + ((fr + i * 3) & 3), 2, 2, i < 3 ? '#ffffff' : '#a4e4fc');
  E(c, x, y, 9, 9, '#000'); E(c, x, y, 8, 8, '#f4faff'); E(c, x + 2, y + 2, 5, 5, '#c4d8f0'); E(c, x - 2.5, y - 3, 3, 2.5, '#ffffff');
  R(c, x + 3, y - 4, 1, 1, '#a4c4e8'); R(c, x - 4, y + 3, 1, 1, '#a4c4e8');
};
PROJ_DRAW.snowburst = (c, pr, x, y, d, hw, hh, t) => {
  const k = Math.min(1, Math.max(1, t) / 6), W = hw, H = hh;
  E(c, x, FLOOR_Y - H * 0.55, W * (0.5 + k * 0.5), H * (0.6 + k * 0.4), '#000');
  E(c, x, FLOOR_Y - H * 0.55, W * (0.5 + k * 0.5) - 1, H * (0.6 + k * 0.4) - 1, '#f4faff');
  E(c, x, FLOOR_Y - H * 0.55, W * 0.5, H * 0.5, '#a4e4fc');
  for (let i = 0; i < 6; i++) R(c, x + (hash01(i * 5 + 1) - 0.5) * W * 1.7, FLOOR_Y - hash01(i * 7 + 2) * H * 1.3 - 2, 2, 2, '#ffffff');
};
PROJ_DRAW.icicle = (c, pr, x, y, d, hw, hh, t, fr) => {
  const hang = pr.delay > 0, on = (fr >> 1) & 1;
  const top = y - 15, bot = y + 15;
  Tri(c, x - 6, top - 1, x + 6, top - 1, x, bot + 1, '#000');
  Tri(c, x - 5, top, x + 5, top, x, bot, '#a4e4fc');
  Tri(c, x - 5, top, x, top, x, bot, '#e8faff'); Tri(c, x + 1, top + 2, x + 5, top, x + 1, bot - 8, '#3cbcfc');
  R(c, x - 6, top - 3, 12, 3, '#000'); R(c, x - 5, top - 2, 10, 2, '#d8f4ff');
  if (hang) { if (on) R(c, x - 1, top + 6, 2, 2, '#ffffff'); R(c, x + ((fr >> 2) & 1), top - 5, 1, 2, '#a4e4fc'); }
  else for (let i = 1; i <= 3; i++) R(c, x, top - i * 5, 1, 3, 'rgba(255,255,255,0.6)');
};
PROJ_DRAW.iceshard = (c, pr, x, y, d, hw, hh, t) => {
  for (let i = -1; i <= 1; i++) {
    const bx = x + i * 8, hgt = (i === 0 ? 14 : 9) - (t >> 2);
    Tri(c, bx - 4, FLOOR_Y, bx + 4, FLOOR_Y, bx, FLOOR_Y - hgt - 1, '#000');
    Tri(c, bx - 3, FLOOR_Y, bx + 3, FLOOR_Y, bx, FLOOR_Y - hgt, i & 1 ? '#a4e4fc' : '#e8faff');
  }
};
PROJ_DRAW.iwall = (c, pr, x, y, d, hw, hh, t, fr) => {
  if (pr.life < 36 && (fr >> 2) & 1) return;
  const x0 = x - hw, y0 = y - hh, w = hw * 2, h = hh * 2;
  R(c, x0 - 1, y0 - 1, w + 2, h + 2, '#000'); R(c, x0, y0, w, h, '#6cc8fc');
  R(c, x0 + 1, y0 + 1, 4, h - 2, '#e8faff'); R(c, x0 + 5, y0 + 1, 2, h - 2, '#a4e4fc'); R(c, x0 + w - 4, y0 + 1, 3, h - 2, '#2c94e0');
  Line(c, x0 + 3, y0 + 12, x0 + w - 4, y0 + 20, '#e8faff'); Line(c, x0 + w - 5, y0 + 28, x0 + 4, y0 + 40, '#3cbcfc');
  Tri(c, x0, y0 - 1, x0 + w, y0 - 1, x, y0 - 8, '#000'); Tri(c, x0 + 1, y0, x0 + w - 1, y0, x, y0 - 6, '#a4e4fc');
  if ((fr >> 3) & 1) R(c, x0 + 3, y0 + 5, 2, 2, '#ffffff');
};
PROJ_DRAW.blizzard = (c, pr, x, y, d, hw, hh, t, fr) => {
  const fade = pr.life < 14;
  E(c, x, y, hw, hh, fade ? 'rgba(220,240,255,0.25)' : 'rgba(220,240,255,0.5)'); E(c, x, y, hw * 0.7, hh * 0.7, fade ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.4)');
  for (let i = 0; i < 26; i++) {
    const sp = 2 + (i % 3), px = x - hw + (((i * 37 + fr * sp * d) % (hw * 2)) + hw * 2) % (hw * 2), py = y - hh + (i * 53 + fr * (1 + (i % 2))) % (hh * 2);
    if (fade && i % 2) continue;
    R(c, px, py, 2 + (i & 1), 2, i % 3 ? '#ffffff' : '#7cc8fc');
  }
  for (let k = 0; k < 3; k++) {
    const yy = y - hh + 8 + k * 14;
    for (let i = 0; i < hw * 2; i += 3) R(c, x - hw + i, Math.round(yy + Math.sin((i + fr * 2 * d) * 0.3 + k) * 3), 2, 1, k & 1 ? '#a4e4fc' : '#ffffff');
  }
};
PROJ_DRAW.rocket = (c, pr, x, y, d, hw, hh, t, fr) => {
  const sp = Math.min(1, Math.abs(pr.vx) / S(5));
  const fl = 4 + sp * 8 + ((fr >> 1) & 1) * 2;
  Tri(c, x - d * 9, y - 3, x - d * 9, y + 3, x - d * (9 + fl), y, '#fc9838'); Tri(c, x - d * 9, y - 2, x - d * 9, y + 2, x - d * (9 + fl * 0.6), y, '#fcd838');
  R(c, fwdX(x, d, -9, 16), y - 4, 16, 8, '#000'); R(c, fwdX(x, d, -8, 14), y - 3, 14, 6, '#f0f0f8'); R(c, fwdX(x, d, -8, 14), y + 1, 14, 2, '#9c9cb0');
  R(c, fwdX(x, d, -3, 3), y - 3, 3, 6, '#e83c28');
  Tri(c, x + d * 8, y - 4, x + d * 8, y + 4, x + d * 15, y, '#000'); Tri(c, x + d * 8, y - 3, x + d * 8, y + 3, x + d * 13, y, '#e83c28');
  Tri(c, x - d * 6, y - 3, x - d * 9, y - 3, x - d * 9, y - 8, '#e83c28'); Tri(c, x - d * 6, y + 3, x - d * 9, y + 3, x - d * 9, y + 8, '#e83c28');
  E(c, x + d * 2, y, 2, 2, '#5cd8fc');
};
PROJ_DRAW.meteor = (c, pr, x, y, d, hw, hh, t, fr) => {
  const s = pr.vx >= 0 ? 1 : -1;
  for (let i = 4; i >= 1; i--) E(c, x - s * i * 1.5, y - i * 5.5, 8 - i, 8 - i, i > 2 ? '#d82800' : i > 1 ? '#fc9838' : '#fcd838');
  E(c, x, y, 10, 10, '#000'); E(c, x, y, 9, 9, '#a07848'); E(c, x - 3, y - 3, 4, 3, '#d8b078'); E(c, x + 3, y + 2, 3, 3, '#6c4c28'); R(c, x - 1, y + 4, 2, 2, '#6c4c28');
  R(c, x + 4, y - 5, 2, 2, '#fcd838');
};
PROJ_DRAW.minidaruma = (c, pr, x, y, d, hw, hh, t, fr) => {
  E(c, x, y, 8, 8, '#000'); E(c, x, y, 7, 7, '#d82800'); E(c, x - 2, y - 3, 3, 2.5, '#fc7c60');
  E(c, x + d * 2, y - 1, 4.2, 3.8, '#fcf0d8'); R(c, x + d * 2, y - 2, 1, 2, '#000'); R(c, x + d * 4, y - 2, 1, 2, '#000'); R(c, x - 4, y + 3, 9, 1, '#fcd838');
};
PROJ_DRAW.bowl = (c, pr, x, y, d, hw, hh, t, fr) => {
  const tilt = ((t >> 2) & 1) * d;
  E(c, x, y + 1, 9, 6, '#000'); E(c, x, y + 1, 8, 5, '#d82820'); R(c, x - 8, y - 2, 16, 3, '#000'); R(c, x - 7, y - 1, 14, 1, '#f8f8f8');
  E(c, x + tilt, y - 3, 7, 3.4, '#f8d860'); R(c, x + 2, y - 5, 3, 2, '#f8f8f8'); R(c, x - 3, y - 5, 2, 2, '#388800');
  R(c, x - 3 + tilt, y - 10 - ((fr >> 2) & 1), 1, 3, 'rgba(255,255,255,0.8)'); R(c, x + 2 + tilt, y - 11 + ((fr >> 2) & 1), 1, 3, 'rgba(255,255,255,0.8)');
};
PROJ_DRAW.steam = (c, pr, x, y, d, hw, hh, t) => {
  const k = Math.min(1, Math.max(1, t) / 8), W = hw, H = hh, a = pr.life > 6 ? 0.92 : 0.5;
  for (let i = 0; i < 5; i++) {
    const ox = (i - 2) * W * 0.4 * k, oy = -hash01(i * 11 + 3) * H * 0.9 - t * 0.4, r = 6 + hash01(i * 3 + 1) * 4 + k * 2;
    E(c, x + ox, FLOOR_Y - 8 + oy, r + 1, r + 1, 'rgba(120,150,190,' + a + ')'); E(c, x + ox, FLOOR_Y - 8 + oy, r, r, 'rgba(255,255,255,' + a + ')');
  }
};
PROJ_DRAW.steamcloud = (c, pr, x, y, d, hw, hh, t, fr) => {
  const a = pr.life > 10 ? 0.9 : 0.5;
  for (let i = 0; i < 7; i++) {
    const ox = (hash01(i * 7 + 2) - 0.5) * hw * 1.7, oy = (hash01(i * 13 + 5) - 0.5) * hh * 1.2 - ((fr + i * 5) % 20) * 0.5, r = 7 + hash01(i * 3 + 9) * 5;
    E(c, x + ox + Math.sin((fr + i * 9) * 0.15) * 2, y + oy, r + 1, r + 1, 'rgba(120,150,190,' + a + ')'); E(c, x + ox + Math.sin((fr + i * 9) * 0.15) * 2, y + oy, r, r, 'rgba(255,255,255,' + a + ')');
  }
};
PROJ_DRAW.water = (c, pr, x, y, d, hw, hh, t, fr) => {
  for (let i = 1; i <= 3; i++) R(c, x - d * (12 + i * 5) - 1, y - 3 + ((fr + i * 5) % 7), 2, 2, i < 3 ? '#3cbcfc' : '#a4e4fc');
  E(c, x, y, 11, 5, '#000'); E(c, x, y, 10, 4, '#3cbcfc'); E(c, x - d * 1, y - 1, 6, 1.6, '#a4e4fc'); R(c, x - 3, y - 2, 4, 1, '#ffffff');
  Tri(c, x + d * 8, y - 4, x + d * 8, y + 4, x + d * 14, y, '#000'); Tri(c, x + d * 8, y - 3, x + d * 8, y + 3, x + d * 12, y, '#3cbcfc');
};
PROJ_DRAW.boomhand = (c, pr, x, y, d, hw, hh, t, fr, m) => {
  const s = SPR.parts[CHARS[m.f[pr.own].ch].key].hand, dd = pr.vx >= 0 ? 1 : -1;
  for (let i = 1; i <= 3; i++) R(c, x - dd * (7 + i * 4), y - 2 + ((fr + i * 3) & 3), 2, 2, i < 3 ? '#3cbcfc' : '#a4e4fc');
  c.save(); c.translate(x, y); c.rotate(t * 0.5 * dd);
  c.drawImage(dd > 0 ? s.n : s.f, -s.cw / 2, -s.ch / 2); c.restore();
};
PROJ_DRAW.geyser = (c, pr, x, y, d, hw, hh, t, fr) => {
  if (pr.delay > 0) {
    const on = (fr >> 1) & 1;
    for (let r = 0; r < 3; r++) E(c, x, FLOOR_Y - 1, 6 + r * 6 + ((fr >> 2) & 1) * 2, 1.5 + r * 0.6, 'rgba(60,188,252,' + (0.9 - r * 0.25) + ')');
    if (on) R(c, x - 5, FLOOR_Y - 5 - ((fr >> 1) & 3), 2, 2, '#ffffff');
    return;
  }
  const H = Math.round(pr.h / SP);
  for (let j = 0; j < H; j++) {
    const w = 9 + Math.sin((j + fr * 2) * 0.4) * 1.5 - (j > H - 8 ? (j - (H - 8)) * 0.6 : 0), yy = FLOOR_Y - j, ww = Math.round(w);
    R(c, x - ww - 1, yy, ww * 2 + 2, 1, '#000'); R(c, x - ww, yy, ww * 2, 1, '#3cbcfc');
    R(c, x - ww + 2, yy, Math.max(0, ww * 2 - 8), 1, '#a4e4fc'); R(c, x - ww + 3, yy, 2, 1, '#ffffff');
  }
  for (let i = 0; i < 6; i++) { const a = hash01(fr * 3 + i) * 6.28; R(c, x + Math.cos(a) * 14, FLOOR_Y - H + 6 + Math.sin(a) * 6, 2, 2, '#ffffff'); }
};
const JUG_COL = ['#fc5c4c', '#3cbcfc', '#58c868'];
PROJ_DRAW.jugball = (c, pr, x, y, d, hw, hh, t, fr) => {
  const col = JUG_COL[Math.round(Math.abs(pr.vx) / SP * 3) % 3];
  E(c, x, y, 7, 7, '#000'); E(c, x, y, 6, 6, col); R(c, x - 5 + ((t >> 1) % 8), y - 5, 2, 10, '#fcfcfc'); E(c, x - 2, y - 3, 2, 1.6, '#ffffff');
};
PROJ_DRAW.jackbox = (c, pr, x, y, d, hw, hh, t, fr) => {
  if (pr.delay > 0) {
    const sh = pr.delay < 10 ? ((fr & 1) * 2 - 1) : 0, lift = pr.delay < 8 ? 3 : 0;
    R(c, x - 10 + sh, FLOOR_Y - 14, 20, 14, '#000'); R(c, x - 9 + sh, FLOOR_Y - 13, 18, 12, '#e8282c'); R(c, x - 9 + sh, FLOOR_Y - 13, 18, 3, '#fc7460');
    for (let i = 0; i < 3; i++) R(c, x - 7 + i * 6 + sh, FLOOR_Y - 8, 3, 3, '#fcd838');
    R(c, x - 11 + sh, FLOOR_Y - 17 - lift, 22, 4, '#000'); R(c, x - 10 + sh, FLOOR_Y - 16 - lift, 20, 2, '#8848e0');
    return;
  }
  const H = Math.round(pr.h / SP), top = FLOOR_Y - H + 8;
  R(c, x - 10, FLOOR_Y - 14, 20, 14, '#000'); R(c, x - 9, FLOOR_Y - 13, 18, 12, '#e8282c');
  for (let yy = FLOOR_Y - 14; yy > top + 6; yy -= 3) { const o = (((yy >> 1) & 1) * 4 - 2); Line(c, x - 4 + o, yy, x + 4 - o, yy - 3, '#000'); Line(c, x - 4 + o + 1, yy, x + 4 - o + 1, yy - 3, '#bcbcbc'); }
  E(c, x, top, 8, 8, '#000'); E(c, x, top, 7, 7, '#fcfcfc'); Tri(c, x - 6, top - 5, x + 6, top - 5, x, top - 15, '#000'); Tri(c, x - 5, top - 5, x + 5, top - 5, x, top - 13, '#8848e0');
  R(c, x + 1, top - 1, 2, 2, '#000'); R(c, x - 4, top - 1, 2, 2, '#000'); E(c, x - 1, top + 2, 2.5, 2.5, '#e8282c'); R(c, x - 5, top + 4, 10, 1, '#e8282c');
};

/* ---------- 技の演出 (c, f, ph, L, fr) ---------- */
FX_DRAW.smoke = (c, f, ph, L, fr) => {
  const d = f.face;
  for (let i = 0; i < 6; i++) {
    const ox = -d * (i * 9) + (hash01(fr * 3 + i) - 0.5) * 4, oy = -8 - hash01(i * 7 + fr) * 16, r = 7 - i * 0.6 + ((fr + i) & 1);
    E(c, L.fx + ox, FLOOR_Y + oy + 2, r + 1, r + 1, 'rgba(80,80,110,0.8)'); E(c, L.fx + ox, FLOOR_Y + oy + 2, r, r, i & 1 ? 'rgba(235,235,245,0.95)' : 'rgba(205,205,225,0.95)');
  }
  for (let i = 0; i < 3; i++) R(c, L.fx - d * (14 + i * 11), FLOOR_Y - 20 - hash01(fr + i * 17) * 18, 3, 1, '#58b848');
};
FX_DRAW.tail = (c, f, ph, L, fr) => {
  const d = f.face, k = Math.min(1, f.pt / 6), ang = Math.PI + Math.PI * k;
  const bx = L.fx - d * 12, by = L.fy - 16, N = 14, pts = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N, rr = u * 54;
    pts.push([bx + d * Math.cos(ang) * rr, by - Math.sin(ang) * rr * 0.3 + 3 * u, 6.2 - u * 4.2]);
  }
  for (const [col, grow] of [['#000', 1.2], ['#58b838', 0], ['#a4f06c', -0.2]]) {
    for (const [x, y, w] of pts) {
      if (grow < 0) E(c, x - 1, y - 1.2, Math.max(0.8, w * 0.45), Math.max(0.8, w * 0.35), col);
      else E(c, x, y, Math.max(1.2, w + grow), Math.max(1.2, w + grow), col);
    }
  }
  const [tx, ty] = pts[N];
  Tri(c, tx - 2, ty - 3, tx + 2, ty - 3, tx + d * 6, ty, '#000'); Tri(c, tx - 1, ty - 2, tx + 1, ty - 2, tx + d * 5, ty, '#fc9838');
};
FX_DRAW.noodle = (c, f, ph, L, fr) => {
  const d = f.face, b = ph.hit.box, len = b[2] / SP, x0 = L.pts.hf.x + d * 4, y0 = L.pts.hf.y;
  for (const [col, off] of [['#000', 2], ['#c89a20', 1], ['#f8d860', 0]]) {
    for (let i = 0; i < len; i++) {
      const yy = y0 + Math.sin((i * 0.45) + fr * 0.9) * (1.5 + i * 0.03);
      R(c, d > 0 ? x0 + i : x0 - i - 1, Math.round(yy - off), 1, 1 + off * 2 - (off === 1 ? 0 : 0), col);
    }
  }
  E(c, x0 + d * len, y0 + Math.sin(len * 0.45 + fr * 0.9) * 3.5, 3, 3, '#000'); E(c, x0 + d * len, y0 + Math.sin(len * 0.45 + fr * 0.9) * 3.5, 2, 2, '#f8d860');
};
FX_DRAW.jetfront = (c, f, ph, L, fr) => {
  const d = f.face;
  for (let i = 0; i < 4; i++) {
    const ox = d * (10 + i * 6 + ((fr + i * 3) % 4)), oy = (hash01(fr + i * 9) - 0.5) * 6;
    E(c, L.pts.t.x + ox, L.pts.t.y + oy + 4, 5 - i * 0.8, 4 - i * 0.6, i < 2 ? '#fcd838' : i < 3 ? '#fc9838' : '#d82800');
  }
};
const starAt = (c, x, y, s, col) => { R(c, x - s, y, s * 2 + 1, 1, col); R(c, x, y - s, 1, s * 2 + 1, col); };
FX_DRAW.sparkle = (c, f, ph, L, fr) => {
  for (let i = 0; i < 7; i++) {
    const ph0 = (fr * 1.1 + i * 9) % 44, x = L.fx + Math.sin(i * 2.1 + fr * 0.08) * 17, y = L.fy - 6 - ph0 * 1.1;
    starAt(c, x + 1, y + 1, 2, '#000'); starAt(c, x, y, i & 1 ? 1 : 2, i % 3 ? '#fcd838' : '#ffffff');
  }
};
FX_DRAW.splash = (c, f, ph, L, fr) => {
  for (let i = 0; i < 10; i++) {
    const a = fr * 0.55 + i * Math.PI * 2 / 10, px = L.fx + Math.cos(a) * 30, py = L.fy - 26 + Math.sin(a) * 18;
    E(c, px, py, 2.4, 2.4, '#000'); E(c, px, py, 1.6, 1.6, i & 1 ? '#3cbcfc' : '#a4e4fc');
  }
};
FX_UNDER.ball = 1;
FX_DRAW.ball = (c, f, ph, L, fr) => {
  const x = L.fx + f.face * 2, cy = FLOOR_Y - 6, R6 = 6;
  for (let dx = -R6 - 1; dx <= R6 + 1; dx++) {
    const h = Math.sqrt(Math.max(0, (R6 + 1) * (R6 + 1) - dx * dx));
    R(c, x + dx, cy - h, 1, h * 2, '#000');
  }
  for (let dx = -R6; dx <= R6; dx++) {
    const h = Math.sqrt(Math.max(0, R6 * R6 - dx * dx)), band = Math.floor((dx + R6 + f.t * 1.5 * f.face) / 3) & 1;
    R(c, x + dx, cy - h, 1, h * 2, band ? '#fcec3c' : '#fc5c4c');
  }
  R(c, x - 3, cy - 4, 2, 2, '#ffffff');
};
FX_DRAW.hammer = (c, f, ph, L, fr) => {
  const d = f.face, hf = L.pts.hf, up = ph.pose === 'slamWind';
  const head = (hx, hy, w, h) => {
    R(c, hx - w / 2 - 1, hy - h / 2 - 1, w + 2, h + 2, '#000'); R(c, hx - w / 2, hy - h / 2, w, h, '#e8282c');
    R(c, hx - w / 2, hy - h / 2, w, 3, '#fc7460'); R(c, hx - w / 2, hy - h / 2 + h * 0.4, w, 2, '#fcd838'); R(c, hx - w / 2, hy + h / 2 - 3, w, 3, '#a81018');
  };
  if (up) {
    R(c, hf.x - 2, hf.y - 28, 4, 28, '#000'); R(c, hf.x - 1, hf.y - 28, 2, 28, '#c8944c');
    head(hf.x, hf.y - 36, 24, 14);
  } else {
    const hx = hf.x + d * 14, hy = FLOOR_Y - 10;
    Line(c, hf.x, hf.y, hx, hy, '#000'); Line(c, hf.x + 1, hf.y, hx + 1, hy, '#000'); Line(c, hf.x, hf.y, hx, hy, '#c8944c');
    head(hx, hy, 22, 18);
  }
};

/* ---------- ヒットなどの演出（イベント） ---------- */
FXL_DRAW.heal = (c, x, y, t) => {
  for (let i = 0; i < 8; i++) {
    const yy = y - t * 1.4 - hash01(i * 5 + 1) * 14, xx = x + (hash01(i * 3 + 2) - 0.5) * 34;
    starAt(c, xx + 1, yy + 1, 2, '#000'); starAt(c, xx, yy, 2, i & 1 ? '#a8ffb0' : '#fcd838');
  }
  E(c, x, y + 20, 14 - (t >> 2), 4, 'rgba(168,255,176,0.6)');
};
