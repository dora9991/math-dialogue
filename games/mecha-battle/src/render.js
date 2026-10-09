'use strict';
/* ============================================================
   render.js — ポーズ表・ロボの組み立て・飛び道具・エフェクト・文字
   ============================================================ */

/* ---------- 5x7ドット文字（英数字） ---------- */
const FONT5 = {
  A: '.###./#...#/#...#/#####/#...#/#...#/#...#', B: '####./#...#/#...#/####./#...#/#...#/####.',
  C: '.###./#...#/#..../#..../#..../#...#/.###.', D: '####./#...#/#...#/#...#/#...#/#...#/####.',
  E: '#####/#..../#..../####./#..../#..../#####', F: '#####/#..../#..../####./#..../#..../#....',
  G: '.###./#...#/#..../#.###/#...#/#...#/.###.', H: '#...#/#...#/#...#/#####/#...#/#...#/#...#',
  I: '.###./..#../..#../..#../..#../..#../.###.', J: '..###/...#./...#./...#./...#./#..#./.##..',
  K: '#...#/#..#./#.#../##.../#.#../#..#./#...#', L: '#..../#..../#..../#..../#..../#..../#####',
  M: '#...#/##.##/#.#.#/#.#.#/#...#/#...#/#...#', N: '#...#/##..#/#.#.#/#..##/#...#/#...#/#...#',
  O: '.###./#...#/#...#/#...#/#...#/#...#/.###.', P: '####./#...#/#...#/####./#..../#..../#....',
  Q: '.###./#...#/#...#/#...#/#.#.#/#..#./.##.#', R: '####./#...#/#...#/####./#.#../#..#./#...#',
  S: '.####/#..../#..../.###./....#/....#/####.', T: '#####/..#../..#../..#../..#../..#../..#..',
  U: '#...#/#...#/#...#/#...#/#...#/#...#/.###.', V: '#...#/#...#/#...#/#...#/#...#/.#.#./..#..',
  W: '#...#/#...#/#...#/#.#.#/#.#.#/##.##/#...#', X: '#...#/#...#/.#.#./..#../.#.#./#...#/#...#',
  Y: '#...#/#...#/.#.#./..#../..#../..#../..#..', Z: '#####/....#/...#./..#../.#.../#..../#####',
  0: '.###./#...#/#..##/#.#.#/##..#/#...#/.###.', 1: '..#../.##../..#../..#../..#../..#../.###.',
  2: '.###./#...#/....#/...#./..#../.#.../#####', 3: '#####/...#./..#../...#./....#/#...#/.###.',
  4: '...#./..##./.#.#./#..#./#####/...#./...#.', 5: '#####/#..../####./....#/....#/#...#/.###.',
  6: '..##./.#.../#..../####./#...#/#...#/.###.', 7: '#####/....#/...#./..#../.#.../.#.../.#...',
  8: '.###./#...#/#...#/.###./#...#/#...#/.###.', 9: '.###./#...#/#...#/.####/....#/...#./.##..',
  '!': '..#../..#../..#../..#../..#../...../..#..', '?': '.###./#...#/....#/...#./..#../...../..#..',
  '.': '...../...../...../...../...../.##../.##..', ':': '...../.##../.##../...../.##../.##../.....',
  '-': '...../...../...../#####/...../...../.....', '+': '...../..#../..#../#####/..#../..#../.....',
  '/': '....#/....#/...#./..#../.#.../#..../#....', "'": '..#../..#../...../...../...../...../.....',
  '%': '##..#/##..#/...#./..#../.#.../#..##/#..##', '=': '...../...../#####/...../#####/...../.....',
  '*': '...../#.#.#/.###./#####/.###./#.#.#/.....', ' ': '...../...../...../...../...../...../.....',
  '<': '...#./..#../.#.../#..../.#.../..#../...#.', '>': '.#.../..#../...#./....#/...#./..#../.#...',
  '(': '...#./..#../.#.../.#.../.#.../..#../...#.', ')': '.#.../..#../...#./...#./...#./..#../.#...',
  '^': '..#../.#.#./#...#/...../...../...../.....', ',': '...../...../...../...../.##../..#../.#...',
};
const FONT5_ROWS = {};
Object.keys(FONT5).forEach((k) => { FONT5_ROWS[k] = FONT5[k].split('/'); });

function text5W(str, s) { return str.length * 6 * (s || 1) - (s || 1); }
/* x,y は左上。align: 'l' | 'c' | 'r' */
function text5(c, str, x, y, col, s, o) {
  s = s || 1; o = o || {};
  str = String(str).toUpperCase();
  const w = text5W(str, s);
  if (o.align === 'c') x = Math.round(x - w / 2); else if (o.align === 'r') x = Math.round(x - w);
  const pass = (ox, oy, color) => {
    c.fillStyle = color;
    for (let i = 0; i < str.length; i++) {
      const g = FONT5_ROWS[str[i]] || FONT5_ROWS['?'];
      for (let gy = 0; gy < 7; gy++) for (let gx = 0; gx < 5; gx++) {
        if (g[gy][gx] === '#') c.fillRect(x + ox + (i * 6 + gx) * s, y + oy + gy * s, s, s);
      }
    }
  };
  if (o.outline !== false) { const k = o.ocol || '#000000'; pass(-s, 0, k); pass(s, 0, k); pass(0, -s, k); pass(0, s, k); pass(s, s, k); }
  pass(0, 0, col);
}

/* ---------- 日本語ドット文字（DotGothic16、実ピクセル16px = 論理8px） ---------- */
const JPFONT = '"DotGothic16","Hiragino Kaku Gothic ProN","Yu Gothic","Noto Sans JP",sans-serif';
function jp(c, str, x, y, col, o) {
  o = o || {};
  const px = (o.size || 8) * 2;
  c.save();
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.font = px + 'px ' + JPFONT;
  c.textBaseline = 'top';
  let tx = Math.round(x * 2);
  const ty = Math.round(y * 2);
  if (o.align === 'c') tx -= Math.round(c.measureText(str).width / 2);
  else if (o.align === 'r') tx -= Math.round(c.measureText(str).width);
  if (o.outline) {
    c.fillStyle = o.ocol || '#000';
    for (const [dx, dy] of [[-2, 0], [2, 0], [0, -2], [0, 2], [2, 2], [-2, 2], [2, -2], [-2, -2]]) c.fillText(str, tx + dx, ty + dy);
  } else if (o.shadow !== false) {
    c.fillStyle = o.scol || '#000';
    c.fillText(str, tx + 2, ty + 2);
  }
  c.fillStyle = col;
  c.fillText(str, tx, ty);
  c.restore();
}
function jpW(c, str, size) {
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
  c.font = (size || 8) * 2 + 'px ' + JPFONT;
  const w = c.measureText(str).width / 2;
  c.restore();
  return w;
}

/* ============================================================
   ポーズ表：静止位置からのずれ [前方向dx, 上dy]（px）
   h=頭 t=胴 hf/hb=手(前/奥) ff/fb=足(前/奥)
   ============================================================ */
const POSES = {
  idle: {},
  intro: { hf: [4, 6], hb: [3, 3] },
  walk1: { ff: [5, 3], fb: [-4, 0], h: [0, 1], t: [0, 1], hf: [-1, 1], hb: [1, 0] },
  walk2: { ff: [-3, 0], fb: [5, 3], h: [0, 0], t: [0, 0], hf: [1, 0], hb: [-1, 1] },
  back1: { ff: [4, 3], fb: [-3, 0], h: [-2, 1], t: [-2, 1], hf: [-6, 14], hb: [10, 10] },
  back2: { ff: [-2, 0], fb: [4, 3], h: [-2, 0], t: [-2, 0], hf: [-6, 14], hb: [10, 10] },
  crouch: { t: [0, -9], h: [1, -12], hf: [3, -9], hb: [-3, -9], ff: [5, 0], fb: [-5, 0] },
  crouchGuard: { t: [-1, -9], h: [-1, -12], hf: [-4, 4], hb: [12, 2], ff: [5, 0], fb: [-5, 0] },
  guard: { t: [-2, 0], h: [-3, 0], hf: [-6, 14], hb: [10, 10], ff: [3, 0], fb: [-3, 0] },
  jump: { ff: [3, 5], fb: [-3, 4], hf: [3, 7], hb: [-3, 7], h: [0, 1] },
  fall: { ff: [3, 2], fb: [-3, 3], hf: [6, 3], hb: [-6, 4] },
  hitHi: { t: [-3, 0], h: [-6, 2], hf: [-5, 5], hb: [-9, 4], ff: [-2, 1], fb: [-5, 0] },
  hitLo: { t: [-2, -1], h: [-4, -2], hf: [-3, -3], hb: [-6, -2], ff: [1, 0], fb: [-3, 0] },
  flyback: { t: [-3, 1], h: [-7, 3], hf: [-9, 9], hb: [-11, 5], ff: [-3, 7], fb: [-8, 6] },
  // 倒れた姿：頭を後ろ、足を前にして地面に横たわる（目標位置との差を返す）
  down: (g, sz) => {
    const tw = sz.torso[0] + 2, hw = sz.head[0] + 2, hh = sz.head[1] + 2, th = sz.torso[1] + 2, fh = sz.foot[1] + 2;
    return {
      t: [0, th / 2 - g.torsoY],
      h: [-(tw / 2 + hw / 2 + 1), hh / 2 - g.headY],
      hf: [3 - g.handX, th - 2 - g.handY],
      hb: [-5 + g.handX, th - 5 - g.handY],
      ff: [tw / 2, 1 + fh / 2 - g.footY],
      fb: [tw / 2 + 28, 1 + fh / 2 - g.footY],
    };
  },
  wake: { t: [0, -8], h: [2, -10], hf: [4, -8], hb: [-2, -8], ff: [4, 0], fb: [-4, 0] },
  win1: { hf: [4, 22], hb: [-4, 22], h: [0, 2], t: [0, 2], ff: [4, 5], fb: [-4, 5] },
  win2: { hf: [8, 18], hb: [-8, 26], h: [0, 0], t: [0, 0], ff: [4, 0], fb: [-4, 0] },
  /* --- こうげき --- */
  jabWind: { t: [-2, 0], h: [-2, 0], hf: [-8, 2], hb: [-3, 0] },
  jab: { t: [3, 0], h: [4, 0], hf: [22, 9], hb: [-4, 0], ff: [3, 0] },
  jabRec: { t: [1, 0], h: [1, 0], hf: [10, 5] },
  kickWind: { t: [-3, 0], h: [-3, 0], ff: [-5, 9], hb: [-7, 3], hf: [3, 3] },
  kick: { t: [-4, 1], h: [-5, 1], ff: [30, 13], fb: [-4, 0], hf: [-10, 7], hb: [-10, 1] },
  kickRec: { t: [-1, 0], ff: [10, 6] },
  ajab: { hf: [22, -1], t: [2, 0], h: [3, 0], ff: [4, 5], fb: [-3, 4], hb: [-6, 4] },
  akick: { ff: [24, -5], fb: [-3, 3], t: [-3, 0], h: [-3, 0], hf: [-9, 5], hb: [-11, 2] },
  cast1: { hf: [-3, 7], hb: [-6, 6], t: [-3, 0], h: [-3, 0] },
  cast2: { hf: [20, 7], hb: [15, 7], t: [3, 0], h: [3, 0] },
  castRec: { hf: [12, 6], hb: [9, 5], t: [1, 0] },
  uppercutWind: { t: [0, -4], h: [0, -5], hf: [2, -8], hb: [-3, -6], ff: [4, 0], fb: [-4, 0] },
  uppercut: { hf: [10, 31], hb: [-4, 8], t: [1, 3], h: [1, 4], ff: [3, 6], fb: [-3, 5] },
  jetKick: { ff: [30, 5], fb: [-7, 9], t: [-3, 6], h: [-2, 6], hf: [-9, 9], hb: [-13, 7] },
  beamWind: { t: [-1, 0], h: [-3, 0], hf: [2, 2], hb: [-2, 2] },
  beam: { h: [5, 0], t: [2, 0], hf: [8, 5], hb: [-4, 5] },
  beamRec: { h: [1, 0] },
  shoulderWind: { t: [-4, -2], h: [-4, -2], hf: [-6, 3], hb: [-9, 0], ff: [4, 0], fb: [-4, 0] },
  shoulder: { t: [9, -1], h: [12, -1], hf: [17, 6], hb: [3, 5], ff: [7, 0], fb: [-7, 0] },
  shoulderRec: { t: [3, 0], h: [3, 0] },
  stompWind: { ff: [3, 12], hf: [5, 14], hb: [-5, 14], t: [0, 3], h: [0, 4] },
  stomp: { ff: [9, 0], hf: [8, 2], hb: [-8, 2], t: [1, -3], h: [1, -4], fb: [-4, 0] },
  stompRec: { t: [0, -1], h: [0, -1] },
  stand: { t: [0, -2], h: [-1, -3], hf: [8, 6], hb: [5, 4], ff: [5, 0], fb: [-5, 0] },
  standRec: { t: [0, -1], h: [0, -1], hf: [4, 2], hb: [2, 1] },
  counterHit: { hf: [30, 10], hb: [18, 18], t: [7, 0], h: [8, 0], ff: [8, 0] },
  slamWind: { hf: [4, 38], hb: [-4, 38], t: [-2, 1], h: [-2, 3] },
  slam: { hf: [26, -4], hb: [20, -4], t: [6, -3], h: [9, -4], ff: [6, 0] },
  slamRec: { hf: [14, 0], hb: [10, 0], t: [2, -1], h: [3, -1] },
  birdWind: { t: [0, -4], h: [0, -5], hf: [3, -8], hb: [-3, -6] },
  fireBird: { hf: [10, 27], hb: [-2, 9], t: [3, 3], h: [4, 4], ff: [6, 3], fb: [-3, 2] },
  divRec: { t: [0, -5], h: [0, -6], ff: [4, 0], fb: [-4, 0], hf: [3, -4], hb: [-3, -4] },
  jumpWind: { t: [0, -5], h: [0, -6], hf: [2, -5], hb: [-2, -5], ff: [4, 0], fb: [-4, 0] },
  floatUp: { hf: [4, 13], hb: [-4, 13], ff: [3, 7], fb: [-3, 6], h: [0, 2], t: [0, 1] },
  dive: { ff: [16, -3], fb: [11, -4], hf: [17, 0], hb: [13, 3], t: [6, -2], h: [9, -3] },
  floatBack: { t: [-2, 0], h: [-3, 1], hf: [-1, 12], hb: [-6, 14], ff: [3, 6], fb: [-3, 5] },
  teleOut: { t: [0, 1], h: [0, 2], hf: [4, 12], hb: [-4, 12], ff: [3, 3], fb: [-3, 3] },
  appear: { hf: [18, 11], hb: [11, 13], t: [3, 0], h: [3, 0] },
  reflect: { hf: [14, 9], hb: [14, 21], t: [0, 0], h: [-1, 0] },
  hopUp: { ff: [3, 5], fb: [-3, 4], hf: [3, 7], hb: [-3, 7], h: [4, 0] },
  peck: { h: [11, -7], t: [4, -3], ff: [6, 4], fb: [-4, 5], hf: [6, 0], hb: [-6, 3] },
  slide: { t: [3, -13], h: [7, -15], ff: [26, -3], fb: [11, -3], hf: [20, -13], hb: [0, -13] },
  slideRec: { t: [1, -9], h: [2, -11], ff: [8, 0], fb: [-3, 0], hf: [8, -9], hb: [0, -9] },
  tongueWind: { h: [-3, 0], t: [-2, 0] },
  tongue: { h: [7, 0], t: [3, 0] },
  tongueRec: { h: [1, 0] },
  dashPunch: { t: [9, -1], h: [11, -1], hf: [27, 6], hb: [1, 3], ff: [7, 2], fb: [-9, 2] },
  castUp: { hf: [4, 28], hb: [-3, 2], t: [-1, 0], h: [-1, 0] },
  castUp2: { hf: [5, 38], hb: [-3, 3], t: [0, 1], h: [0, 2] },
  discharge: { hf: [20, 12], hb: [-22, 12], ff: [11, 3], fb: [-11, 3], h: [0, 3], t: [0, 2] },
  dischargeRec: { h: [0, -1], t: [0, -1] },
  swingWind: { hf: [-7, 29], hb: [-3, 8], t: [-3, 0], h: [-3, 0] },
  swing: { hf: [23, 12], hb: [6, 10], t: [5, 0], h: [6, 0] },
  swingRec: { hf: [13, -4], hb: [5, 4], t: [2, 0] },
  strumWind: { hf: [9, 6], hb: [-1, 4], t: [-2, 0] },
  strum: { hf: [12, 4], hb: [3, 6], t: [2, 0], h: [2, 0] },
  strumRec: { hf: [10, 5], hb: [1, 4] },
  flurry1: { hf: [26, 9], hb: [-2, 3], t: [3, 0], h: [4, 0] },
  flurry2: { hf: [-1, 4], hb: [22, 11], t: [3, 0], h: [4, 0] },
};

const RIG = {};
/* 後から足した技の見た目の登録表（render2.js）。FX_DRAW=技の演出 / FX_UNDER=ロボの下に描くもの / PROJ_DRAW=飛び道具 / FXL_DRAW=ヒットなどの演出 */
const FX_DRAW = {}, FX_UNDER = {}, PROJ_DRAW = {}, FXL_DRAW = {};
const rigOf = (key) => RIG[key] || (RIG[key] = rigGeom(key));

function poseName(f, m) {
  switch (f.st) {
    case 'idle': return m.phase === 'intro' ? 'intro' : 'idle';
    case 'walk': return (f.vx * f.face < 0 ? 'back' : 'walk') + ((((f.t / 6) | 0) & 1) + 1);
    case 'crouch': return f.in & (f.face > 0 ? IN.LEFT : IN.RIGHT) ? 'crouchGuard' : 'crouch';
    case 'air': return f.vy > 0 ? 'jump' : 'fall';
    case 'atk': {
      const p = fPhase(f);
      if (p.alt) return p.alt[((f.pt / (p.altN || 3)) | 0) % p.alt.length];
      return p.pose;
    }
    case 'hit': return f.stun > 5 ? 'hitHi' : 'hitLo';
    case 'block': return f.crouchG ? 'crouchGuard' : 'guard';
    case 'knock': case 'ko': return 'flyback';
    case 'down': return 'down';
    case 'wake': return 'wake';
    case 'win': return (((f.t / 14) | 0) & 1) ? 'win2' : 'win1';
    default: return 'idle';
  }
}
/* パーツの画面位置を計算（デブリ生成にも使う） */
function rigLayout(f, m, fr) {
  const C = CHARS[f.ch], key = C.key, g = rigOf(key), sz = ART[key].size;
  const name = poseName(f, m);
  const pd = typeof POSES[name] === 'function' ? POSES[name](g, sz) : (POSES[name] || POSES.idle);
  let bobH = 0, bobHand = 0;
  if (name === 'idle' || name === 'intro' || name === 'guard') {
    const ph = (((fr + f.i * 9) / 9) | 0) & 3;
    bobH = ph === 1 || ph === 2 ? 1 : 0;
    bobHand = ph === 0 || ph === 1 ? 0 : 1;
  }
  const base = { hb: [-g.handX + 3, g.handY], fb: [-g.footX, g.footY], t: [0, g.torsoY], h: [1, g.headY], ff: [g.footX + 1, g.footY], hf: [g.handX, g.handY] };
  const fx = f.x / SP, fy = FLOOR_Y - f.y / SP;
  const out = {};
  for (const k of ['hb', 'fb', 't', 'h', 'ff', 'hf']) {
    const d = pd[k] || [0, 0];
    let dy = d[1];
    if (k === 'h') dy += bobH; if (k === 'hf' || k === 'hb') dy += bobHand;
    out[k] = { x: fx + f.face * (base[k][0] + d[0]), y: fy - (base[k][1] + dy) };
  }
  return { pts: out, name, fx, fy };
}
const PART_SPR = { hb: 'hand', hf: 'hand', fb: 'foot', ff: 'foot', t: 'torso', h: 'head' };

function drawFighter(c, f, m, fr) {
  const C = CHARS[f.ch], key = C.key, set = SPR.parts[key];
  const ph = f.st === 'atk' ? fPhase(f) : null;
  const L = rigLayout(f, m, fr);
  if (ph && ph.hide) { if (ph.fx) drawMoveFx(c, f, ph, L, fr); return; }
  // 影
  const air = f.y / SP;
  c.fillStyle = 'rgba(0,0,0,0.38)';
  E(c, L.fx, FLOOR_Y + 1, Math.max(5, 15 - air / 5), 3, 'rgba(0,0,0,0.38)');
  const flash = f.flash >= 2;
  const hideHand = m.projs.some((p) => p.own === f.i && p.hide === 'hf');
  if (ph && ph.fx && FX_UNDER[ph.fx]) drawMoveFx(c, f, ph, L, fr);
  for (const k of ['hb', 'fb', 't', 'h', 'ff', 'hf']) {
    if (k === 'hf' && hideHand) continue;
    const s = set[PART_SPR[k]];
    const back = k === 'hb' || k === 'fb';
    const right = f.face > 0;
    const img = s[flash ? (right ? 'w' : 'wf') : back ? (right ? 'b' : 'bf') : (right ? 'n' : 'f')];
    c.drawImage(img, Math.round(L.pts[k].x - s.cw / 2), Math.round(L.pts[k].y - s.ch / 2));
  }
  if (ph && ph.prop) {
    const p = SPR.props[ph.prop], hp = L.pts.hf;
    c.drawImage(f.face > 0 ? p.n : p.f, Math.round(hp.x - p.cw / 2 + f.face * 5), Math.round(hp.y - p.ch / 2 - 1));
  }
  if (ph && ph.fx && !FX_UNDER[ph.fx]) drawMoveFx(c, f, ph, L, fr);
}

/* 技ごとの演出（ビーム・べろ・バリアなど） */
function hash01(n) { n = Math.imul(n ^ (n >>> 15), 0x2c1b3c6d); n = Math.imul(n ^ (n >>> 12), 0x297a2d39); return ((n ^ (n >>> 15)) >>> 0) / 4294967296; }
function drawMoveFx(c, f, ph, L, fr) {
  const fx = L.fx, fy = L.fy, d = f.face;
  switch (ph.fx) {
    case 'beam': {
      const b = ph.hit.box, y = fy - (b[1] + b[3] / 2) / SP;
      const len = (b[2] / SP), th = 3 + ((fr >> 1) & 1) * 2;
      const sx = d > 0 ? L.pts.h.x + 8 : L.pts.h.x - 8 - len;
      R(c, sx, y - th - 1, len, th * 2 + 2, '#000');
      R(c, sx, y - th, len, th * 2, '#d82800');
      R(c, sx, y - th + 1, len, th * 2 - 2, '#fc9838');
      R(c, sx, y - 1, len, 2, '#fcfcfc');
      break;
    }
    case 'tongue': {
      const b = ph.hit.box, len = b[2] / SP, y = L.pts.h.y + 4;
      const sx = d > 0 ? L.pts.h.x + 8 : L.pts.h.x - 8 - len;
      R(c, sx, y - 2, len, 5, '#000');
      R(c, sx, y - 1, len, 3, '#fc7460');
      E(c, d > 0 ? sx + len : sx, y, 4, 4, '#000'); E(c, d > 0 ? sx + len : sx, y, 3, 3, '#fc74b4');
      break;
    }
    case 'shield': {
      const x = fx + d * 12, on = (fr >> 1) & 1;
      for (let i = 0; i < 7; i++) { Dither(c, x - 14 + i * 4, fy - 62, 4, 62, on ? '#a4e4fc' : '#3cbcfc', i); }
      R(c, x - 14, fy - 63, 28, 1, '#fcfcfc');
      break;
    }
    case 'ring': {
      const x = fx + d * 20, on = (fr >> 1) & 1;
      for (let r = 0; r < 3; r++) {
        for (let a = -70; a <= 70; a += 5) {
          const rad = a * Math.PI / 180;
          const px = x + d * Math.cos(rad) * (8 + r * 2) - d * 8 * 0, py = fy - 30 + Math.sin(rad) * (28 + r);
          c.fillStyle = (r === 1 ? (on ? '#fcfcfc' : '#a4e4fc') : '#3cbcfc');
          c.fillRect(Math.round(px), Math.round(py), 1, 1);
        }
      }
      break;
    }
    case 'zap': {
      for (let i = 0; i < 7; i++) {
        const a = hash01(fr * 7 + i * 13) * Math.PI * 2, r1 = 8, r2 = 30 + hash01(fr + i) * 6;
        let px = fx, py = fy - 28;
        for (let s = 1; s <= 4; s++) {
          const rr = r1 + (r2 - r1) * (s / 4), jit = (hash01(fr * 3 + i * 5 + s) - 0.5) * 8;
          const nx = fx + Math.cos(a) * rr + jit, ny = fy - 28 + Math.sin(a) * rr + jit;
          Line(c, px + 1, py + 1, nx + 1, ny + 1, '#000'); Line(c, px, py, nx, ny, i & 1 ? '#fcfcfc' : '#fcd838');
          px = nx; py = ny;
        }
      }
      break;
    }
    case 'flame': {
      for (let i = 0; i < 5; i++) {
        const ox = -d * (8 + i * 6 + ((fr + i * 3) % 4)), oy = (hash01(fr + i * 9) - 0.5) * 6;
        const x = L.pts.t.x + ox, y = L.pts.t.y + oy + 2;
        E(c, x, y, 5 - i * 0.7, 4 - i * 0.5, i < 2 ? '#fcd838' : i < 4 ? '#fc9838' : '#d82800');
      }
      break;
    }
    case 'spark': {
      for (let i = 0; i < 4; i++) {
        const x = L.pts.t.x - d * (10 + i * 7), y = L.pts.t.y + (hash01(fr * 5 + i) - 0.5) * 18;
        R(c, x, y, 5, 1, '#fcfcfc'); R(c, x + d * 2, y + 1, 3, 1, '#fcd838');
      }
      break;
    }
    default: if (FX_DRAW[ph.fx]) FX_DRAW[ph.fx](c, f, ph, L, fr); break;
  }
}

/* ---------- 飛び道具 ---------- */
function drawProj(c, pr, m, fr) {
  const x = Math.round(pr.x / SP), y = Math.round(FLOOR_Y - pr.y / SP), d = pr.vx >= 0 ? 1 : -1;
  const hw = (pr.w / SP) / 2, hh = (pr.h / SP) / 2;
  const t = pr.age;
  switch (pr.type) {
    case 'fist': {
      const s = SPR.parts[CHARS[m.f[pr.own].ch].key].hand;
      for (let i = 1; i <= 3; i++) R(c, x - d * (6 + i * 4), y - 1 + (i & 1), 4 - i + 1, 2, i === 1 ? '#fcd838' : '#fc9838');
      c.drawImage(d > 0 ? s.n : s.f, Math.round(x - s.cw / 2), Math.round(y - s.ch / 2));
      break;
    }
    case 'fire': {
      E(c, x, y, 9, 9, '#000'); E(c, x, y, 8, 8, '#d82800'); E(c, x, y, 6, 6, '#fc9838'); E(c, x + ((fr >> 1) & 1) * d, y, 3.5, 3.5, '#fcd838');
      for (let i = 1; i <= 3; i++) { E(c, x - d * (7 + i * 5), y + ((fr + i) & 1) * 2 - 1, 5 - i, 4 - i * 0.7, i < 3 ? '#fc9838' : '#d82800'); }
      break;
    }
    case 'balloon': {
      Line(c, x, y + 9, x + ((fr >> 3) & 1 ? 2 : -2), y + 15, '#000');
      E(c, x, y, 9, 10, '#000'); E(c, x, y, 8, 9, '#fc74b4'); E(c, x - 2, y - 3, 2.5, 3, '#fcc8e0'); Tri(c, x - 2, y + 9, x + 2, y + 9, x, y + 12, '#c8286c');
      break;
    }
    case 'sqrt': {
      E(c, x, y, 9, 8, 'rgba(60,188,252,0.5)');
      const seg = [[-6, 1, -4, 5], [-4, 5, 0, -5], [0, -5, 7, -5]];
      for (const col of ['#000', '#fcfcfc']) {
        const o = col === '#000' ? 1 : 0;
        for (const s of seg) { Line(c, x + s[0], y + s[1], x + s[2], y + s[3], col); Line(c, x + s[0] + 1, y + s[1], x + s[2] + 1, y + s[3], col); if (o) { Line(c, x + s[0], y + s[1] + 1, x + s[2], y + s[3] + 1, col); Line(c, x + s[0] - 1, y + s[1], x + s[2] - 1, y + s[3], col); } }
      }
      break;
    }
    case 'plus': {
      R(c, x - 2, y - 5, 5, 11, '#000'); R(c, x - 5, y - 2, 11, 5, '#000');
      R(c, x - 1, y - 4, 3, 9, '#3cbcfc'); R(c, x - 4, y - 1, 9, 3, '#3cbcfc'); R(c, x - 1, y - 1, 3, 3, '#fcfcfc');
      break;
    }
    case 'mud': {
      E(c, x, y, 8, 8, '#000'); E(c, x, y, 7, 7, '#886400'); E(c, x - 2, y - 2, 3, 2.5, '#c8944c'); R(c, x + 2, y + 1, 2, 2, '#503000');
      for (let i = 1; i <= 2; i++) R(c, x - d * (8 + i * 4), y + (i === 1 ? 2 : -1), 3, 3, '#886400');
      break;
    }
    case 'orb': {
      E(c, x, y, hw + 1, hh + 1, '#000'); E(c, x, y, hw, hh, '#3cbcfc'); E(c, x, y, hw - 2, hh - 2, '#fcfcfc');
      for (let i = 0; i < 5; i++) {
        const a = hash01(fr * 3 + i * 7 + pr.own) * 6.283;
        Line(c, x, y, x + Math.cos(a) * (hw + 6), y + Math.sin(a) * (hh + 6), i & 1 ? '#fcd838' : '#fcfcfc');
      }
      break;
    }
    case 'wave': {
      for (let k = 0; k < 3; k++) {
        const r = 6 + k * 5, off = ((fr >> 2) + k) % 3;
        for (let a = -62; a <= 62; a += 4) {
          const rad = a * Math.PI / 180;
          const px = Math.round(x - d * 8 + d * Math.cos(rad) * r), py = Math.round(y + Math.sin(rad) * r * 1.5);
          R(c, px - 1, py - 1, 3, 3, '#000');
        }
        for (let a = -62; a <= 62; a += 4) {
          const rad = a * Math.PI / 180;
          const px = Math.round(x - d * 8 + d * Math.cos(rad) * r), py = Math.round(y + Math.sin(rad) * r * 1.5);
          R(c, px, py, 1, 1, off === k ? '#fcfcfc' : '#f878f8');
        }
      }
      break;
    }
    case 'quake': {
      for (let i = 0; i < 3; i++) {
        const bx = x - d * i * 7, hgt = 11 - i * 3;
        Tri(c, bx - 5, FLOOR_Y, bx + 5, FLOOR_Y, bx, FLOOR_Y - hgt - 1, '#000');
        Tri(c, bx - 4, FLOOR_Y, bx + 4, FLOOR_Y, bx, FLOOR_Y - hgt, i & 1 ? '#a8a090' : '#dcd4c0');
      }
      for (let i = 0; i < 3; i++) R(c, x - d * (14 + i * 6), FLOOR_Y - 2 - ((fr + i) & 1), 2, 2, '#bcac90');
      break;
    }
    case 'pillar': {
      if (pr.delay > 0) {
        const on = (fr >> 1) & 1;
        Dither(c, x - 12, FLOOR_Y - 3, 24, 4, on ? '#fc9838' : '#d82800', fr);
        Line(c, x - 8, FLOOR_Y, x - 2, FLOOR_Y - 2, '#fcd838'); Line(c, x + 2, FLOOR_Y - 1, x + 9, FLOOR_Y - 3, '#fcd838');
        break;
      }
      const H = Math.round(pr.h / SP);
      for (let j = 0; j < H; j++) {
        const w = 10 + Math.sin((j + fr) * 0.5) * 2 - j * 0.04 + (j > H - 10 ? -(j - (H - 10)) * 0.8 : 0);
        const yy = FLOOR_Y - j;
        R(c, x - Math.round(w) - 1, yy, Math.round(w) * 2 + 2, 1, '#000');
      }
      for (let j = 0; j < H; j++) {
        const w = 10 + Math.sin((j + fr) * 0.5) * 2 - j * 0.04 + (j > H - 10 ? -(j - (H - 10)) * 0.8 : 0);
        const yy = FLOOR_Y - j, ww = Math.round(w);
        R(c, x - ww, yy, ww * 2, 1, '#d82800');
        R(c, x - ww + 2, yy, Math.max(0, ww * 2 - 4), 1, '#fc9838');
        R(c, x - ww + 5, yy, Math.max(0, ww * 2 - 10), 1, '#fcd838');
      }
      break;
    }
    case 'bolt': {
      const top = Math.round(FLOOR_Y - (pr.y + pr.h / 2) / SP);
      if (pr.delay > 0) {
        const on = (fr >> 1) & 1;
        if (on) for (let yy = top + 6; yy < FLOOR_Y; yy += 8) R(c, x, yy, 1, 4, '#fcd838');
        E(c, x, FLOOR_Y, 14, 3, on ? '#fcd838' : '#6c6c00');
        break;
      }
      let px = x, py = Math.max(0, top - 30);
      const pts = [[px, py]];
      for (let yy = py + 12; yy < FLOOR_Y; yy += 12) { px = x + Math.round((hash01(yy * 31 + fr) - 0.5) * 12); pts.push([px, yy]); }
      pts.push([x, FLOOR_Y]);
      for (const [col, w] of [['#000', 3], ['#fcd838', 2], ['#fcfcfc', 1]]) {
        for (let i = 1; i < pts.length; i++) for (let o = -(w >> 1); o <= (w >> 1); o++) Line(c, pts[i - 1][0] + o, pts[i - 1][1], pts[i][0] + o, pts[i][1], col);
      }
      E(c, x, FLOOR_Y, 14, 4, 'rgba(252,216,56,0.7)');
      break;
    }
    case 'bomb': {
      E(c, x, y, 8, 8, '#000'); E(c, x, y, 7, 7, '#383838'); E(c, x - 2, y - 2, 2, 2, '#bcbcbc');
      R(c, x + 3, y - 10, 2, 3, '#886400'); R(c, x + 3, y - 12 - ((fr >> 1) & 1), 2, 2, (fr >> 1) & 1 ? '#fcd838' : '#fc7460');
      break;
    }
    case 'burst': {
      const life = Math.max(1, t), k = Math.min(1, life / 8), W = hw, H = hh;
      E(c, x, FLOOR_Y - H * 0.6, W * (0.5 + k * 0.5), H * (0.6 + k * 0.4), '#d82800');
      E(c, x, FLOOR_Y - H * 0.6, W * 0.7 * (0.5 + k * 0.5), H * 0.7 * (0.6 + k * 0.4), '#fc9838');
      if (t < 7) E(c, x, FLOOR_Y - H * 0.6, W * 0.4, H * 0.4, '#fcfcfc');
      for (let i = 0; i < 6; i++) R(c, x + (hash01(i * 5 + 1) - 0.5) * W * 1.6, FLOOR_Y - hash01(i * 7 + 2) * H * 1.2 - 2, 2, 2, '#fcd838');
      break;
    }
    default: if (PROJ_DRAW[pr.type]) PROJ_DRAW[pr.type](c, pr, x, y, d, hw, hh, t, fr, m); else E(c, x, y, hw, hh, '#fcfcfc');
  }
}

/* ============================================================
   エフェクト（見た目だけ・シミュレーションに影響しない）
   ============================================================ */
const FXS = [];
function fxAdd(k, x, y, o) { FXS.push(Object.assign({ k, x, y, t: 0, life: 12 }, o || {})); }
function drawStar(c, x, y, L, col, ocol) {
  const draw = (l, w, cl) => {
    R(c, x - l, y - (w >> 1), l * 2 + 1, w, cl); R(c, x - (w >> 1), y - l, w, l * 2 + 1, cl);
    const dl = Math.round(l * 0.7);
    Line(c, x - dl, y - dl, x + dl, y + dl, cl); Line(c, x - dl, y + dl, x + dl, y - dl, cl);
  };
  draw(L + 1, 3, ocol); draw(L, 1, col);
  R(c, x - 1, y - 1, 3, 3, col);
}
function drawFxList(c) {
  for (const e of FXS) {
    const t = e.t, x = Math.round(e.x), y = Math.round(e.y);
    switch (e.k) {
      case 'hit': {
        const r = 5 + (e.p || 0) * 3;
        if (t < 2) drawStar(c, x, y, Math.round(r * 0.6), '#fcfcfc', '#d82800');
        else if (t < 6) drawStar(c, x, y, r + (t < 4 ? 2 : 0), '#fcfcfc', '#d82800');
        else drawStar(c, x, y, Math.round(r * 0.6), '#fcd838', '#a81000');
        if (t > 3 && t < 10) for (let i = 0; i < 4; i++) { const a = i * 1.57 + 0.6; R(c, x + Math.cos(a) * (r + t), y + Math.sin(a) * (r + t), 2, 2, '#fcd838'); }
        break;
      }
      case 'block': {
        E(c, x, y, 5 - (t >> 2), 7, '#000'); E(c, x, y, 4 - (t >> 2), 6, '#3cbcfc'); R(c, x - 1, y - 4, 2, 8, '#fcfcfc');
        break;
      }
      case 'counter': {
        drawStar(c, x, y, 14 + (t & 1) * 2, '#fcfcfc', '#0070d8');
        text5(c, 'COUNTER!', x, y - 22 - (t >> 2), '#fcd838', 1, { align: 'c' });
        break;
      }
      case 'reflect': drawStar(c, x, y, 9, '#fcfcfc', '#0070d8'); break;
      case 'clash': drawStar(c, x, y, 8, '#fcd838', '#a81000'); break;
      case 'pop': drawStar(c, x, y, 6 - (t >> 2), '#fcd838', '#a81000'); break;
      case 'puff': {
        for (let i = 0; i < 4; i++) E(c, x + (i - 1.5) * (4 + t), FLOOR_Y - 4 - (t >> 1) - (i & 1) * 3, 3 + (t >> 2), 3 + (t >> 2), 'rgba(240,240,240,0.8)');
        break;
      }
      case 'dust': {
        for (let s = -1; s <= 1; s += 2) E(c, x + s * (4 + t * 1.2), FLOOR_Y - 2 - (t >> 2), 2.5 - (t >> 3), 2.2 - (t >> 3), 'rgba(235,235,235,0.85)');
        break;
      }
      case 'burst': {
        E(c, x, FLOOR_Y - 8, 10 + t, 8 + t * 0.7, t < 4 ? '#fcfcfc' : '#fc9838');
        break;
      }
      default: if (FXL_DRAW[e.k]) FXL_DRAW[e.k](c, x, y, t, e); break;
    }
  }
}
function fxUpdate() {
  for (let i = FXS.length - 1; i >= 0; i--) { FXS[i].t++; if (FXS[i].t >= FXS[i].life) FXS.splice(i, 1); }
}

/* ---------- KOで体がバラバラに飛び散る ---------- */
const DEBRIS = [];
function debrisSpawn(f, m, fr) {
  const L = rigLayout(f, m, fr), set = SPR.parts[CHARS[f.ch].key];
  const dir = f.face > 0 ? -1 : 1; // 向きと反対へ飛ぶ
  for (const k of ['hb', 'fb', 't', 'h', 'ff', 'hf']) {
    const s = set[PART_SPR[k]];
    DEBRIS.push({ k, s, face: f.face, x: L.pts[k].x, y: L.pts[k].y, vx: dir * (1 + Math.random() * 2.8) + (Math.random() - 0.5) * 1.5, vy: -(2.5 + Math.random() * 4),
      big: k === 't' || k === 'h', rest: 0 });
  }
}
function debrisUpdate() {
  for (const p of DEBRIS) {
    if (p.rest) continue;
    p.vy += 0.32; p.x += p.vx; p.y += p.vy;
    const floor = FLOOR_Y - p.s.ch / 2;
    if (p.x < 6) { p.x = 6; p.vx = -p.vx * 0.6; } if (p.x > SCREEN_W - 6) { p.x = SCREEN_W - 6; p.vx = -p.vx * 0.6; }
    if (p.y >= floor) {
      p.y = floor;
      if (p.vy > 1.4) { p.vy = -p.vy * 0.5; p.vx *= 0.7; } else { p.vy = 0; p.vx *= 0.8; if (Math.abs(p.vx) < 0.15) { p.vx = 0; p.rest = 1; } }
    }
  }
}
function debrisDraw(c) {
  for (const p of DEBRIS) {
    const back = p.k === 'hb' || p.k === 'fb';
    const img = p.face > 0 ? (back ? p.s.b : p.s.n) : (back ? p.s.bf : p.s.f);
    c.drawImage(img, Math.round(p.x - p.s.cw / 2), Math.round(p.y - p.s.ch / 2));
  }
}
