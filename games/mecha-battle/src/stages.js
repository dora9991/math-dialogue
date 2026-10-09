'use strict';
/* ============================================================
   stages.js — 最初の8体のステージ背景（コードで描くドット絵。あとの8つは stages2.js）
   どれも「晴れた日の昼」の、すっきり明るい配色。
   draw(c)  : 最初に1回だけ描く（静止）
   anim(c,fr): 毎フレーム重ねる（雲・煙・光など）
   ============================================================ */
const hexRGB = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
function lerpHex(a, b, t) {
  const A = hexRGB(a), B = hexRGB(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
}
/* 空：上から下へ色を段々に変える（ファミコンの帯っぽく） */
function sky(c, c1, c2, y1, steps) {
  steps = steps || 14;
  const h = y1 / steps;
  for (let i = 0; i < steps; i++) R(c, 0, Math.round(i * h), SCREEN_W, Math.ceil(h) + 1, lerpHex(c1, c2, i / (steps - 1)));
}
/* ふわっとした雲（下側に薄い影） */
function puff(c, x, y, s) {
  const draw = (ox, oy, col) => {
    E(c, x + ox, y + oy, 9 * s, 4 * s, col); E(c, x - 8 * s + ox, y + 1 * s + oy, 6 * s, 3 * s, col);
    E(c, x + 9 * s + ox, y + 1 * s + oy, 7 * s, 3 * s, col); E(c, x + 2 * s + ox, y - 3 * s + oy, 6 * s, 4 * s, col);
  };
  draw(0, 1.5 * s, '#c4dcf4'); draw(0, 0, '#ffffff');
}
function cloud(c, x, y, s) { puff(c, x, y, s); }
function floorBase(c, mid, dark, light, speck) {
  R(c, 0, FLOOR_Y, SCREEN_W, SCREEN_H - FLOOR_Y, mid);
  R(c, 0, FLOOR_Y, SCREEN_W, 2, light);
  R(c, 0, FLOOR_Y + 2, SCREEN_W, 1, dark);
  if (speck) Dither(c, 0, FLOOR_Y + 3, SCREEN_W, 9, speck, 0);
  R(c, 0, SCREEN_H - 3, SCREEN_W, 3, dark);
}
const rnd = (i, k) => ((i * 7919 + k * 104729) % 1000) / 1000;   // 決まった「ばらつき」（毎回同じ）

const STAGES = {
  /* ---- 町工場の朝 ---- */
  factory: {
    name: '町工場の朝', draw(c) {
      sky(c, '#4c98fc', '#e4f6ff', 150);
      R(c, 0, 138, 256, 16, '#b8d0e8');
      [[6, 124, 20, 30], [44, 130, 26, 24], [154, 120, 22, 34], [200, 128, 30, 26], [238, 122, 18, 32]].forEach(([x, y, w, h]) => R(c, x, y, w, h, '#b8d0e8'));
      // 赤白の煙突
      for (const cx of [40, 184]) {
        for (let y = 38; y < 100; y += 8) R(c, cx, y, 12, 8, (y / 8) & 1 ? '#fc5c4c' : '#fcfcfc');
        R(c, cx - 1, 36, 14, 3, '#383838');
      }
      // 本棟
      R(c, 14, 100, 204, 90, '#f6eed4'); R(c, 14, 100, 204, 3, '#fffbe8'); R(c, 14, 186, 204, 4, '#d8caa4');
      for (let i = 0; i < 7; i++) { const x = 14 + i * 29; Tri(c, x, 100, x, 84, x + 29, 100, '#2fb0a8'); Tri(c, x + 2, 100, x + 2, 87, x + 25, 100, '#60d0c4'); }
      for (let r = 0; r < 2; r++) for (let i = 0; i < 9; i++) {
        const x = 22 + i * 22, y = 112 + r * 32;
        R(c, x, y, 16, 22, '#2c5c8c'); R(c, x + 1, y + 1, 14, 20, '#8cd0fc'); R(c, x + 2, y + 2, 4, 9, '#e0f4ff'); R(c, x + 8, y + 1, 1, 20, '#2c5c8c');
      }
      // カラフルな配管
      R(c, 0, 170, 256, 5, '#fcd838'); R(c, 0, 171, 256, 1, '#fcfcc0'); R(c, 0, 174, 256, 1, '#c89800');
      for (let x = 20; x < 256; x += 52) { R(c, x, 168, 5, 9, '#c89800'); }
      R(c, 226, 96, 6, 78, '#3c9cfc'); R(c, 227, 96, 1, 78, '#a4e4fc'); R(c, 236, 110, 5, 64, '#fc7c3c');
      // 木
      for (const x of [8, 244]) { R(c, x - 1, 172, 3, 18, '#7c5030'); E(c, x, 168, 9, 9, '#58b848'); E(c, x - 2, 165, 5, 5, '#88dc68'); }
      floorBase(c, '#d4d8e2', '#8c94a8', '#fcfcff', 'rgba(255,255,255,0.35)');
      for (let x = 0; x < 256; x += 8) { R(c, x, FLOOR_Y + 6, 4, 3, '#fcd838'); R(c, x + 4, FLOOR_Y + 6, 4, 3, '#383838'); }
      for (let x = 0; x < 256; x += 40) R(c, x, FLOOR_Y + 12, 1, 20, '#b0b8c8');
    },
    anim(c, fr) {
      [[30, 30, 1.0, 0.1], [140, 20, 0.8, 0.07], [214, 44, 1.1, 0.12]].forEach(([x, y, s, v]) => cloud(c, ((x + fr * v) % 300) - 22, y, s));
      for (let k = 0; k < 2; k++) for (let i = 0; i < 5; i++) {
        const t = (fr * 0.5 + i * 14 + k * 30) % 70, x = (k ? 190 : 46) + Math.sin(t * 0.1 + i) * 4 + t * 0.2, y = 36 - t * 0.6;
        E(c, x, y, 3 + t * 0.07, 2 + t * 0.05, 'rgba(255,255,255,' + (0.95 - t / 80).toFixed(2) + ')');
      }
      const gx = 238, gy = 78, a = fr * 0.025;
      for (let i = 0; i < 8; i++) { const r = a + i * Math.PI / 4; Tri(c, gx + Math.cos(r - 0.14) * 11, gy + Math.sin(r - 0.14) * 11, gx + Math.cos(r + 0.14) * 11, gy + Math.sin(r + 0.14) * 11, gx + Math.cos(r) * 16, gy + Math.sin(r) * 16, '#e08820'); }
      E(c, gx, gy, 12, 12, '#e08820'); E(c, gx, gy, 9, 9, '#fcb848'); E(c, gx, gy, 3.5, 3.5, '#e08820');
    },
  },
  /* ---- 熊本城（春・桜） ---- */
  castle: {
    name: '熊本城', draw(c) {
      sky(c, '#3c8cfc', '#e8f8ff', 140);
      Tri(c, -30, 150, 90, 150, 28, 114, '#84cc84'); Tri(c, 150, 150, 290, 150, 218, 110, '#6cbc6c'); Tri(c, 60, 150, 170, 150, 115, 128, '#98d898');
      // 石垣
      R(c, 0, 138, 256, 52, '#cac2b4');
      for (let r = 0; r < 7; r++) for (let x = (r & 1) * 8; x < 256; x += 16) { R(c, x, 138 + r * 8, 15, 1, '#948c7c'); R(c, x + 15, 139 + r * 8, 1, 7, '#948c7c'); }
      Dither(c, 0, 138, 256, 6, '#e8e0d0', 0);
      // 天守
      const wall = '#ffffff', roof = '#34406c';
      R(c, 84, 98, 88, 40, wall); R(c, 84, 98, 88, 2, '#d8d8e0'); R(c, 84, 136, 88, 2, '#a8a8b8');
      for (let i = 0; i < 6; i++) { R(c, 92 + i * 14, 108, 6, 8, '#4c5c88'); R(c, 92 + i * 14, 122, 6, 6, '#4c5c88'); }
      Tri(c, 74, 98, 182, 98, 128, 84, roof); R(c, 70, 96, 116, 3, roof); R(c, 66, 99, 5, 2, roof); R(c, 185, 99, 5, 2, roof);
      R(c, 100, 70, 56, 16, wall); R(c, 100, 84, 56, 1, '#d8d8e0'); for (let i = 0; i < 4; i++) R(c, 106 + i * 12, 74, 5, 6, '#4c5c88');
      Tri(c, 92, 70, 164, 70, 128, 58, roof); R(c, 88, 69, 80, 3, roof);
      R(c, 112, 46, 32, 12, wall); for (let i = 0; i < 2; i++) R(c, 118 + i * 14, 49, 5, 5, '#4c5c88');
      Tri(c, 106, 46, 150, 46, 128, 34, roof); R(c, 102, 45, 52, 3, roof);
      Tri(c, 125, 34, 131, 34, 128, 24, '#fcd838'); R(c, 127, 22, 2, 3, '#fcd838');
      R(c, 16, 112, 34, 26, wall); Tri(c, 10, 112, 56, 112, 33, 98, roof); R(c, 6, 110, 48, 3, roof);
      R(c, 206, 112, 34, 26, wall); Tri(c, 200, 112, 246, 112, 223, 98, roof); R(c, 202, 110, 48, 3, roof);
      for (let i = 0; i < 2; i++) { R(c, 24 + i * 14, 120, 5, 7, '#4c5c88'); R(c, 214 + i * 14, 120, 5, 7, '#4c5c88'); }
      // 桜
      for (const x of [10, 246]) {
        R(c, x - 2, 122, 5, 40, '#7c5030');
        E(c, x, 112, 17, 12, '#fc9cc0'); E(c, x - 7, 108, 10, 8, '#fcc4d8'); E(c, x + 8, 109, 10, 8, '#fcd8e8');
        for (let i = 0; i < 9; i++) R(c, x - 14 + ((i * 13) % 28), 102 + ((i * 7) % 18), 2, 2, '#ffffff');
      }
      floorBase(c, '#e4dccc', '#948c7c', '#fcf4e4', 'rgba(255,255,255,0.3)');
      for (let x = 0; x < 256; x += 24) R(c, x, FLOOR_Y + 3, 1, 28, '#c4bca8');
    },
    anim(c, fr) {
      [[30, 38, 1.1, 0.12], [150, 24, 0.9, 0.08], [212, 52, 1.0, 0.1]].forEach(([x, y, s, v]) => cloud(c, ((x + fr * v) % 300) - 22, y, s));
      for (let i = 0; i < 16; i++) {
        const x = ((i * 37 + fr * 0.5 + Math.sin(fr * 0.04 + i) * 6) % 270) - 8, y = (i * 53 + fr * 0.8) % 196;
        R(c, x, y, 2, 1, '#fcb4cc'); R(c, x + 1, y + 1, 1, 1, '#ffffff');
      }
    },
  },
  /* ---- 阿蘇 ---- */
  aso: {
    name: '阿蘇の草原', draw(c) {
      sky(c, '#2c84fc', '#dcf2ff', 132);
      R(c, 0, 116, 256, 36, '#a4c4e8'); Tri(c, -20, 116, 80, 116, 28, 92, '#a4c4e8'); Tri(c, 170, 116, 280, 116, 224, 94, '#a4c4e8');
      Tri(c, 52, 152, 204, 152, 128, 82, '#8ea8c4'); Tri(c, 128, 82, 204, 152, 152, 152, '#7490ac');
      R(c, 114, 82, 28, 4, '#7490ac'); E(c, 128, 85, 13, 3, '#566c84');
      R(c, 0, 148, 256, 42, '#60d048'); Dither(c, 0, 148, 256, 12, '#8ce868', 0);
      for (let i = 0; i < 70; i++) { const x = (i * 53) % 252, y = 154 + ((i * 29) % 32); R(c, x, y, 2, 1, i % 4 ? '#fcec3c' : '#ffffff'); R(c, x, y + 1, 1, 1, '#38a020'); }
      for (const [x, y] of [[40, 166], [208, 170]]) { R(c, x, y, 14, 7, '#fcfcfc'); R(c, x + 3, y + 1, 4, 3, '#383838'); R(c, x + 9, y + 3, 3, 3, '#383838'); R(c, x + 12, y - 2, 5, 5, '#fcfcfc'); R(c, x + 15, y, 2, 2, '#fc9cb0'); R(c, x + 1, y + 7, 2, 3, '#383838'); R(c, x + 10, y + 7, 2, 3, '#383838'); }
      floorBase(c, '#58c848', '#2c8c24', '#9cf078', 'rgba(255,255,255,0.18)');
      for (let i = 0; i < 40; i++) R(c, (i * 47) % 252, FLOOR_Y + 5 + ((i * 13) % 24), 2, 2, '#3ca830');
    },
    anim(c, fr) {
      [[40, 36, 1.2, 0.08], [160, 22, 1.0, 0.06], [220, 56, 0.8, 0.1]].forEach(([x, y, s, v]) => cloud(c, ((x + fr * v) % 300) - 22, y, s));
      for (let i = 0; i < 7; i++) {
        const t = (fr * 0.6 + i * 12) % 80, x = 130 + Math.sin(t * 0.08 + i) * 5 + t * 0.35, y = 82 - t * 0.7;
        E(c, x, y, 4 + t * 0.12, 3 + t * 0.09, 'rgba(255,255,255,' + (0.9 - t / 100).toFixed(2) + ')');
      }
    },
  },
  /* ---- バルーンフェスタ ---- */
  balloon: {
    name: '佐賀バルーンフェスタ', draw(c) {
      sky(c, '#2c84fc', '#e0f4ff', 150);
      Tri(c, -30, 160, 90, 160, 30, 122, '#8cb0e0'); Tri(c, 60, 160, 200, 160, 140, 132, '#78a0d8'); Tri(c, 170, 160, 300, 160, 240, 120, '#8cb0e0');
      R(c, 0, 158, 256, 32, '#5cd048'); Dither(c, 0, 158, 256, 14, '#90ec6c', 0);
      for (let i = 0; i < 12; i++) { const x = 6 + i * 21, h = 8 + (i * 5) % 6; R(c, x, 168 - h + 8, 7, h, ['#fc7460', '#fcd838', '#3cbcfc', '#fcfcfc'][i % 4]); Tri(c, x - 1, 168 - h + 8, x + 8, 168 - h + 8, x + 3, 164 - h + 8, '#fcfcfc'); }
      floorBase(c, '#64d04c', '#2c9020', '#b0f888', 'rgba(255,255,255,0.18)');
      for (let i = 0; i < 40; i++) { const x = (i * 41) % 252, y = FLOOR_Y + 5 + ((i * 17) % 26); R(c, x, y, 1, 2, '#b8f478'); R(c, x + 2, y + 1, 1, 1, '#fcfcfc'); }
    },
    anim(c, fr) {
      const list = [[40, 66, 1.0, '#fc3c3c', '#fcfcfc'], [120, 40, 1.35, '#fcd838', '#3c78fc'], [200, 74, 0.9, '#3cc878', '#fcfcfc'], [84, 100, 0.7, '#fc74b4', '#fcfcfc'], [168, 112, 0.6, '#a078fc', '#fcd838']];
      list.forEach(([x0, y0, s, c1, c2], i) => {
        const x = x0 + Math.sin(fr * 0.01 + i * 2) * 6, y = y0 + Math.sin(fr * 0.02 + i) * 3;
        E(c, x, y, 13 * s, 15 * s, '#000'); E(c, x, y, 12 * s, 14 * s, c1);
        for (let k = -1; k <= 1; k++) E(c, x + k * 5 * s, y, 3 * s, 14 * s, c2);
        E(c, x - 4 * s, y - 5 * s, 3 * s, 4 * s, 'rgba(255,255,255,0.4)');
        Tri(c, x - 6 * s, y + 12 * s, x + 6 * s, y + 12 * s, x, y + 18 * s, c1);
        R(c, x - 1, y + 17 * s, 1, 5 * s, '#000');
        R(c, x - 4 * s, y + 21 * s, 8 * s, 6 * s, '#000'); R(c, x - 3 * s, y + 22 * s, 6 * s, 4 * s, '#a87830');
      });
      cloud(c, ((30 + fr * 0.1) % 300) - 20, 30, 1); cloud(c, ((170 + fr * 0.07) % 300) - 20, 20, 0.8);
    },
  },
  /* ---- 有明海（昼の干潟） ---- */
  ariake: {
    name: '有明海', draw(c) {
      sky(c, '#3ca8fc', '#eaf8ff', 112);
      Tri(c, 36, 118, 176, 118, 106, 86, '#8cb0d8'); Tri(c, 130, 118, 240, 118, 192, 102, '#a4c4e4');
      // 海（青緑）
      for (let y = 114; y < 142; y += 2) R(c, 0, y, 256, 2, lerpHex('#68dcf4', '#2cb4e0', (y - 114) / 28));
      // のり養殖の支柱
      for (let r = 0; r < 3; r++) for (let i = 0; i < 16; i++) { const x = 6 + i * 16 + (r & 1) * 8, y = 120 + r * 7; R(c, x, y, 1, 5, '#6c4c30'); R(c, x, y - 1, 1, 1, '#fcfcfc'); }
      // 干潟
      R(c, 0, 142, 256, 48, '#f4dea8');
      for (let y = 146; y < 190; y += 4) { Dither(c, 0, y, 256, 1, '#dcc088', y); R(c, ((y * 13) % 60), y + 1, 30 + (y % 20), 1, '#e8cc94'); }
      for (const [x, y, w] of [[34, 158, 14], [120, 166, 18], [196, 156, 12], [70, 178, 16]]) { E(c, x, y, w, 3, '#8cd4f4'); E(c, x - 2, y - 1, w * 0.6, 1.2, '#d8f4ff'); }
      floorBase(c, '#f0d89c', '#b49860', '#fcf0c8', 'rgba(255,255,255,0.28)');
      for (let i = 0; i < 24; i++) { const x = (i * 43) % 244, y = FLOOR_Y + 6 + ((i * 17) % 24); E(c, x + 5, y, 6, 1.5, '#8cd4f4'); E(c, x + 4, y - 0.5, 3, 0.8, '#e0f8ff'); }
    },
    anim(c, fr) {
      [[50, 30, 1.0, 0.09], [180, 40, 1.2, 0.06]].forEach(([x, y, s, v]) => cloud(c, ((x + fr * v) % 300) - 22, y, s));
      for (let i = 0; i < 16; i++) { if ((fr + i * 9) % 48 < 6) R(c, (i * 71) % 250, 116 + ((i * 29) % 24), 3, 1, '#ffffff'); }
      for (let i = 0; i < 3; i++) {
        const x = ((fr * 0.4 + i * 100) % 300) - 20, y = 56 + i * 14 + Math.sin(fr * 0.05 + i) * 4, f = (fr >> 4) & 1;
        for (const col of ['#000', '#fff']) { const o = col === '#000' ? 1 : 0; Line(c, x - 5, y - f * 2 + o, x, y + o, col); Line(c, x, y + o, x + 5, y - f * 2 + o, col); }
      }
    },
  },
  /* ---- 数学ラボ（明るい教室） ---- */
  mathlab: {
    name: '数学ラボ', draw(c) {
      R(c, 0, 0, SCREEN_W, FLOOR_Y, '#e6f6ee'); Dither(c, 0, 0, SCREEN_W, FLOOR_Y, '#d8eee2', 0);
      R(c, 0, 150, SCREEN_W, 40, '#bce0d0'); R(c, 0, 150, SCREEN_W, 2, '#fcfcfc');
      // 窓（青空）
      for (const x of [6, 216]) {
        R(c, x, 30, 34, 76, '#fcfcfc'); R(c, x + 3, 33, 28, 70, '#5cb8fc'); R(c, x + 3, 68, 28, 35, '#a8dcfc');
        E(c, x + 12, 82, 9, 4, '#ffffff'); E(c, x + 22, 52, 7, 3, '#ffffff'); R(c, x + 16, 33, 2, 70, '#fcfcfc'); R(c, x + 3, 66, 28, 2, '#fcfcfc');
        R(c, x - 2, 106, 38, 4, '#d8c8a8');
      }
      // 黒板
      R(c, 52, 28, 152, 98, '#c8903c'); R(c, 52, 28, 152, 2, '#e8b060'); R(c, 56, 32, 144, 90, '#2c9c68'); Dither(c, 56, 32, 144, 90, '#36ac76', 0);
      const ch = '#f8f8e8';
      text5(c, 'A^2+B^2=C^2', 62, 38, ch, 2, { outline: false });
      text5(c, 'SIN^2+COS^2=1', 62, 60, ch, 1, { outline: false });
      text5(c, 'E=MC^2', 62, 74, '#fcec3c', 1, { outline: false });
      text5(c, 'X=(-B+-SQRT(D))/2A', 62, 88, ch, 1, { outline: false });
      text5(c, '1+2+...+N=N(N+1)/2', 62, 102, '#bcecfc', 1, { outline: false });
      Line(c, 168, 78, 168, 52, ch); Line(c, 168, 78, 192, 78, ch); Line(c, 168, 52, 192, 78, ch); R(c, 168, 73, 5, 1, ch); R(c, 172, 73, 1, 5, ch);
      R(c, 52, 122, 152, 4, '#e8b060'); R(c, 70, 120, 8, 2, '#fcfcfc'); R(c, 82, 121, 5, 1, '#fcc4d0');
      // 時計
      E(c, 128, 14, 10, 10, '#000'); E(c, 128, 14, 9, 9, '#fcfcfc'); Line(c, 128, 14, 128, 8, '#383838'); Line(c, 128, 14, 133, 16, '#383838');
      floorBase(c, '#f0cc84', '#b88838', '#fce8a8', 'rgba(255,255,255,0.25)');
      for (let x = 0; x < 256; x += 22) R(c, x, FLOOR_Y + 3, 1, 30, '#d4a860');
    },
    anim(c, fr) {
      const sym = ['PI', 'X', '+', '%', '=', '0', '?'], cols = ['#fc7c9c', '#3cbcfc', '#fcb83c', '#58c868', '#a078fc', '#fc7460', '#3cbcfc'];
      for (let i = 0; i < 7; i++) {
        const x = (i * 41 + fr * 0.2) % 270 - 10, y = 18 + ((i * 53) % 100) + Math.sin(fr * 0.03 + i) * 6;
        if (x > 46 && x < 210 && y > 24 && y < 130) continue;
        text5(c, sym[i], x, y, cols[i], 1, { outline: false });
      }
    },
  },
  /* ---- 入道雲の街（雷のステージ） ---- */
  storm: {
    name: '入道雲の街', draw(c) {
      sky(c, '#2878f0', '#d4ecff', 152);
      // 入道雲
      const big = (cx, cy, sc) => {
        const parts = [[0, 0, 30, 18], [-22, -16, 24, 18], [14, -24, 26, 20], [-6, -44, 22, 18], [22, -52, 16, 12]];
        for (const [ox, oy, rx, ry] of parts) E(c, cx + ox + 2 * sc, cy + oy + 4 * sc, rx * sc, ry * sc, '#bcd4f0');
        for (const [ox, oy, rx, ry] of parts) E(c, cx + ox, cy + oy, rx * sc, ry * sc, '#ffffff');
      };
      big(66, 122, 1.0); big(206, 132, 0.62);
      // 遠くのビル
      for (let i = 0; i < 16; i++) { const x = i * 17 - 4, h = 28 + ((i * 37) % 44); R(c, x, 170 - h, 15, h + 20, ['#cfe0f4', '#d8e8f8', '#e8dcf0'][i % 3]); }
      // 近くのビル
      const cols = ['#f8f4ec', '#a4d0f4', '#f8c4cc', '#fcec9c', '#b8ecd0', '#d4c4f4'];
      for (let i = 0; i < 8; i++) {
        const x = i * 34 - 6, h = 52 + ((i * 53) % 50), col = cols[i % 6];
        R(c, x, 190 - h, 30, h, col); R(c, x, 190 - h, 30, 2, '#ffffff'); R(c, x + 28, 190 - h, 2, h, 'rgba(0,0,40,0.16)');
        for (let wy = 190 - h + 6; wy < 182; wy += 8) for (let wx = x + 4; wx < x + 26; wx += 7) { R(c, wx, wy, 4, 5, '#5c98d4'); R(c, wx, wy, 2, 2, '#d8f0ff'); }
      }
      for (const x of [14, 128, 240]) { R(c, x - 1, 176, 3, 14, '#7c5030'); E(c, x, 172, 9, 8, '#58c868'); E(c, x - 2, 169, 5, 4, '#98e888'); }
      floorBase(c, '#d0d4de', '#8c90a4', '#fcfcff', 'rgba(255,255,255,0.3)');
      for (let x = 0; x < 256; x += 36) R(c, x + 6, FLOOR_Y + 20, 22, 2, '#ffffff');
      R(c, 0, FLOOR_Y + 8, SCREEN_W, 1, '#b0b4c4');
    },
    anim(c, fr) {
      [[70, 24, 1.0, 0.07], [170, 18, 0.8, 0.05]].forEach(([x, y, s, v]) => cloud(c, ((x + fr * v) % 300) - 22, y, s));
      // 雲の中でときどきピカッ（雷のしるし）
      const ph = fr % 240;
      if (ph < 5 || (ph > 9 && ph < 12)) {
        E(c, 76, 98, 24, 16, 'rgba(255,248,170,0.75)');
        let px = 78, py = 90;
        for (let s = 0; s < 4; s++) { const nx = px + ((s * 37 + fr) % 11) - 5, ny = py + 11; Line(c, px, py, nx, ny, '#fcec3c'); Line(c, px + 1, py, nx + 1, ny, '#ffffff'); px = nx; py = ny; }
      }
    },
  },
  /* ---- 夏フェス ---- */
  live: {
    name: '夏フェス', draw(c) {
      sky(c, '#2c8cfc', '#dcf2ff', 150);
      Tri(c, -30, 160, 100, 160, 30, 126, '#84d484'); Tri(c, 140, 160, 300, 160, 220, 122, '#6cc86c');
      // ステージ
      R(c, 24, 84, 208, 106, '#f4f6fa'); R(c, 24, 84, 208, 4, '#c4cad8');
      for (let x = 24; x < 232; x += 26) Line(c, x, 88, x + 26, 112, '#d4d8e4');
      for (let i = 0; i < 13; i++) R(c, 24 + i * 16, 62, 16, 22, i & 1 ? '#fc5c4c' : '#fcfcfc');
      for (let i = 0; i < 13; i++) Tri(c, 24 + i * 16, 84, 40 + i * 16, 84, 32 + i * 16, 92, i & 1 ? '#fc5c4c' : '#fcfcfc');
      // 大型ビジョン
      R(c, 62, 100, 132, 62, '#000'); R(c, 64, 102, 128, 58, '#1c4c9c');
      for (let i = 0; i < 16; i++) Tri(c, 128, 150, 64 + i * 8, 102, 72 + i * 8, 102, i & 1 ? '#2c6cc8' : '#3c84e0');
      const L = [['S', '#fc5c4c'], ['U', '#fcb83c'], ['M', '#fcec3c'], ['M', '#58c868'], ['E', '#3cbcfc'], ['R', '#a078fc']];
      L.forEach(([ch, col], i) => text5(c, ch, 78 + i * 17, 112, col, 2, { ocol: '#0c1c4c' }));
      text5(c, 'FES 2026', 128, 138, '#ffffff', 1, { align: 'c', ocol: '#0c1c4c' });
      // スピーカー
      for (const x of [4, 230]) { R(c, x, 112, 22, 78, '#34384c'); R(c, x, 112, 22, 2, '#6c7494'); for (const y of [124, 152]) { E(c, x + 11, y, 8, 8, '#1c2030'); E(c, x + 11, y, 5, 5, '#505870'); E(c, x + 11, y, 2, 2, '#1c2030'); } }
      floorBase(c, '#f0c880', '#a8742c', '#fce4a8', 'rgba(255,255,255,0.25)');
      for (let x = 0; x < 256; x += 16) R(c, x, FLOOR_Y + 3, 1, 30, '#d09c50');
    },
    anim(c, fr) {
      // 旗（ゆれる）
      for (let i = 0; i < 17; i++) {
        const x = i * 16, y = 14 + Math.sin(i * 0.5) * 6 + Math.sin(fr * 0.08 + i) * 1.5;
        const col = ['#fc5c4c', '#fcec3c', '#3cbcfc', '#58c868', '#fc74b4'][i % 5];
        Tri(c, x, y, x + 12, y, x + 6, y + 12, '#000'); Tri(c, x + 1, y + 1, x + 11, y + 1, x + 6, y + 10, col);
      }
      for (let x = 0; x < 256; x += 2) R(c, x, 14 + Math.sin(x / 16 * 0.5 * 16 / 16 * 1) * 6 - 1, 2, 1, '#34384c');
      // 紙ふぶき
      for (let i = 0; i < 30; i++) {
        const x = ((i * 47 + Math.sin(fr * 0.05 + i) * 8) % 256 + 256) % 256, y = (i * 61 + fr * (0.8 + (i % 3) * 0.3)) % 190;
        R(c, x, y, 2, 2, ['#fc5c4c', '#fcec3c', '#3cbcfc', '#58c868', '#fc74b4', '#ffffff'][i % 6]);
      }
    },
  },
};

/* 静止部分を1回だけ描いてキャッシュ */
const STAGE_CACHE = {};
function stageCanvas(id) {
  if (STAGE_CACHE[id]) return STAGE_CACHE[id];
  const cv = document.createElement('canvas');
  cv.width = SCREEN_W * 2; cv.height = SCREEN_H * 2;
  const c = cv.getContext('2d');
  c.imageSmoothingEnabled = false;
  c.setTransform(2, 0, 0, 2, 0, 0);
  STAGES[id].draw(c);
  STAGE_CACHE[id] = cv;
  return cv;
}
function drawStage(c, id, fr) {
  c.drawImage(stageCanvas(id), 0, 0, SCREEN_W, SCREEN_H);
  if (STAGES[id].anim) STAGES[id].anim(c, fr);
}
