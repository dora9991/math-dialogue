'use strict';
/* ============================================================
   chars.js — 最初の8体のロボと、その技データ（あとから足した8体は chars2.js）
   技は「フェーズ（区間）の並び」で書く。
     PH(フレーム数, ポーズ名, {hit, spawn, vx, vy, inv, ...})
   座標の単位は px / フレーム。x は「向いている方向」が +、y は「足元から上」が +。
   最後の compileChar() で整数（サブピクセル）に変換する。
   ============================================================ */
const PH = (dur, pose, o) => Object.assign({ dur, pose }, o || {});
const HIT = (box, dmg, o) => Object.assign({ box, dmg, hs: 13, bs: 8, kb: 1.8, hstop: 5 }, o || {});
const SPW = (o) => Object.assign({ type: 'orb', x: 20, y: 30, vx: 4, vy: 0, grav: 0, w: 14, h: 14,
  dmg: 6, hs: 14, bs: 8, kb: 1.8, hstop: 5, life: 80, delay: 0 }, o || {});

/* ---------- 共通の通常技（キャラごとに数値だけ変える） ---------- */
function mkJab(o) {
  o = Object.assign({ su: 4, ac: 3, rc: 8, reach: 38, y: 38, h: 14, dmg: 4, hs: 12, bs: 7, kb: 1.4 }, o);
  return {
    name: 'パンチ', cmd: 'A', ai: { r: [0, o.reach + 14], w: 4, k: 'poke' },
    phases: [
      PH(o.su, 'jabWind'),
      PH(o.ac, 'jab', { hit: HIT([6, o.y, o.reach - 6, o.h], o.dmg, { hs: o.hs, bs: o.bs, kb: o.kb, hstop: 4 }), snd: 'swing' }),
      PH(o.rc, 'jabRec'),
    ],
  };
}
function mkKick(o) {
  o = Object.assign({ su: 7, ac: 4, rc: 12, reach: 48, y: 6, h: 24, dmg: 6, hs: 15, bs: 9, kb: 2.2 }, o);
  return {
    name: 'キック', cmd: 'B', ai: { r: [0, o.reach + 14], w: 4, k: 'poke' },
    phases: [
      PH(o.su, 'kickWind'),
      PH(o.ac, 'kick', { hit: HIT([6, o.y, o.reach - 6, o.h], o.dmg, { hs: o.hs, bs: o.bs, kb: o.kb, hstop: 5 }), snd: 'swing' }),
      PH(o.rc, 'kickRec'),
    ],
  };
}
function mkAirP(o) {
  o = Object.assign({ su: 3, ac: 10, dmg: 4, reach: 36, hs: 12, bs: 7, kb: 1.4 }, o);
  return {
    name: 'ジャンプパンチ', cmd: '空中A', air: true, ai: { r: [0, 50], w: 3, k: 'air' },
    phases: [
      PH(o.su, 'ajab'),
      PH(o.ac, 'ajab', { hit: HIT([4, 12, o.reach - 4, 26], o.dmg, { hs: o.hs, bs: o.bs, kb: o.kb, hstop: 4 }) }),
      PH(90, 'fall', { land: true }),
    ],
  };
}
function mkAirK(o) {
  o = Object.assign({ su: 4, ac: 12, dmg: 6, reach: 40, hs: 14, bs: 8, kb: 1.8 }, o);
  return {
    name: 'ジャンプキック', cmd: '空中B', air: true, ai: { r: [0, 56], w: 3, k: 'air' },
    phases: [
      PH(o.su, 'akick'),
      PH(o.ac, 'akick', { hit: HIT([2, -6, o.reach - 2, 26], o.dmg, { hs: o.hs, bs: o.bs, kb: o.kb, hstop: 5 }) }),
      PH(90, 'fall', { land: true }),
    ],
  };
}
/* 飛び道具を撃つ共通パターン */
function mkCast(name, cmd, spawn, o) {
  o = Object.assign({ su: 11, rc: 18, ai: { r: [70, 240], w: 5, k: 'proj' }, limit: spawn.type || 'orb' }, o);
  return {
    name, cmd, ai: o.ai, limit: o.limit,
    phases: [PH(o.su, 'cast1'), PH(3, 'cast2', { spawn, snd: o.snd || 'shoot' }), PH(o.rc, 'castRec')],
  };
}

const CHARS = [
  /* ---------------------------------------------------------- */
  {
    key: 'kotetsu', name: 'コテツ', en: 'KOTETSU', stage: 'factory', pref: [50, 105],
    desc: ['町工場うまれの主人公ロボ。', 'クセがなく、何でもできる。'],
    stats: { hp: 100, walk: 1.5, back: 1.15, grav: 0.30, w: 22, h: 56, ch: 36, push: 16 },
    jump: { h: 104, t: 40, d: 72 },   // ふつう
    moves: {
      jab: mkJab({}), kick: mkKick({}), jA: mkAirP({}), jB: mkAirK({}),
      s1: mkCast('ロケットパンチ', '→A', SPW({ type: 'fist', x: 20, y: 30, vx: 5.6, w: 16, h: 12, dmg: 7, hs: 15, bs: 9, kb: 2.2, life: 75, hide: 'hf', hstop: 6 }),
        { su: 10, rc: 20, ai: { r: [70, 250], w: 5, k: 'proj' }, snd: 'rocket' }),
      s2: {
        name: 'ジェットキック', cmd: '→B', ai: { r: [50, 135], w: 4, k: 'dash' },
        phases: [
          PH(8, 'kickWind'),
          PH(16, 'jetKick', { vx: 4.6, fx: 'flame', snd: 'whoosh', hit: HIT([4, 6, 40, 22], 7, { hs: 15, bs: 9, kb: 2.5, hstop: 5 }) }),
          PH(18, 'kickRec'),
        ],
      },
      s3: {
        name: 'ライジングパンチ', cmd: '↓A', ai: { r: [0, 52], w: 3, k: 'aa' },
        phases: [
          PH(3, 'uppercutWind', { inv: true }),
          PH(6, 'uppercut', { vy: 5.6, vx: 0.8, inv: true, snd: 'whoosh', hit: HIT([4, 24, 26, 40], 9, { kd: true, lift: 5.2, kb: 1.8, hstop: 7 }) }),
          PH(8, 'uppercut', { keep: true, hit: HIT([4, 24, 26, 40], 9, { kd: true, lift: 5.2, kb: 1.8, hstop: 7 }) }),
          PH(70, 'fall', { land: true, keep: true }),
          PH(14, 'divRec'),
        ],
      },
      s4: {
        name: 'アイビーム', cmd: '↓B', ai: { r: [60, 150], w: 3, k: 'proj' },
        phases: [
          PH(16, 'beamWind'),
          PH(8, 'beam', { fx: 'beam', snd: 'beam', hit: HIT([12, 40, 124, 10], 8, { hs: 16, bs: 10, kb: 2.6, hstop: 6 }) }),
          PH(22, 'beamRec'),
        ],
      },
    },
  },
  /* ---------------------------------------------------------- */
  {
    key: 'ganjou', name: 'ガンジョウ', en: 'GANJOU', stage: 'castle', pref: [30, 72],
    desc: ['お城のいしがきでできた', 'どっしり重量級。力が強い。'],
    stats: { hp: 125, walk: 0.95, back: 0.75, grav: 0.30, w: 28, h: 60, ch: 40, push: 20 },
    jump: { h: 100, t: 34, d: 46 },   // どっしり。すとんと落ちる
    moves: {
      jab: mkJab({ su: 5, rc: 10, reach: 44, y: 42, h: 16, dmg: 5 }),
      kick: mkKick({ su: 9, ac: 4, rc: 15, reach: 52, y: 6, h: 24, dmg: 8, hs: 17, kb: 2.6 }),
      jA: mkAirP({ dmg: 5, reach: 40 }), jB: mkAirK({ dmg: 7, reach: 44 }),
      s1: {
        name: 'ショルダータックル', cmd: '→A', ai: { r: [40, 125], w: 4, k: 'dash' },
        phases: [
          PH(14, 'shoulderWind'),
          PH(18, 'shoulder', { vx: 3.4, snd: 'whoosh', hit: HIT([2, 6, 42, 46], 11, { hs: 18, bs: 11, kb: 3.6, kd: true, hstop: 7 }) }),
          PH(24, 'shoulderRec'),
        ],
      },
      s2: {
        name: 'ちならし', cmd: '→B', limit: 'quake', ai: { r: [40, 170], w: 4, k: 'proj' },
        phases: [
          PH(14, 'stompWind'),
          PH(4, 'stomp', {
            snd: 'quake',
            spawn: SPW({ type: 'quake', x: 26, y: 6, vx: 2.8, w: 22, h: 12, dmg: 8, hs: 18, bs: 10, kb: 2.4, life: 50 }),
            hit: HIT([-22, 0, 44, 12], 6, { hs: 16, kb: 2.4, hstop: 5 }),
          }),
          PH(26, 'stompRec'),
        ],
      },
      s3: {
        name: 'ムシャガエシ', cmd: '↓A', ai: { r: [0, 62], w: 3, k: 'counter' },
        phases: [
          PH(5, 'stand'),
          PH(26, 'stand', { counter: 3, fx: 'shield' }),
          PH(24, 'standRec', { end: true }),
          PH(8, 'counterHit', { snd: 'counter', hit: HIT([-4, 0, 60, 62], 14, { hs: 20, bs: 12, kb: 4.2, kd: true, hstop: 12 }) }),
          PH(14, 'standRec'),
        ],
      },
      s4: {
        name: 'いしがきプレス', cmd: '↓B', ai: { r: [18, 78], w: 3, k: 'poke' },
        phases: [
          PH(22, 'slamWind'),
          PH(5, 'slam', { snd: 'slam', hit: HIT([8, 20, 48, 40], 13, { hs: 20, bs: 12, kb: 3, kd: true, hstop: 8 }) }),
          PH(26, 'slamRec'),
        ],
      },
    },
  },
  /* ---------------------------------------------------------- */
  {
    key: 'ason', name: 'アソン', en: 'ASON', stage: 'aso', pref: [78, 140],
    desc: ['阿蘇山のマグマで動く。', '炎の技がいっぱい。'],
    stats: { hp: 100, walk: 1.4, back: 1.1, grav: 0.30, w: 22, h: 56, ch: 36, push: 16 },
    jump: { h: 105, t: 32, d: 72 },   // さっと
    moves: {
      jab: mkJab({}), kick: mkKick({}), jA: mkAirP({}), jB: mkAirK({}),
      s1: mkCast('ファイアボール', '→A', SPW({ type: 'fire', x: 20, y: 30, vx: 3.8, w: 16, h: 16, dmg: 6, hs: 15, bs: 9, kb: 2, life: 84 }),
        { su: 11, rc: 21, ai: { r: [60, 240], w: 5, k: 'proj' }, snd: 'fire' }),
      s2: {
        name: 'ファイアバード', cmd: '→B', ai: { r: [20, 80], w: 3, k: 'aa' },
        phases: [
          PH(6, 'birdWind'),
          PH(8, 'fireBird', { vx: 2.4, vy: 4.8, inv: true, fx: 'flame', snd: 'whoosh', hit: HIT([0, 0, 30, 56], 9, { kd: true, lift: 4.2, kb: 2.2, hstop: 6 }) }),
          PH(8, 'fireBird', { keep: true, fx: 'flame', hit: HIT([0, 0, 30, 56], 9, { kd: true, lift: 4.2, kb: 2.2, hstop: 6 }) }),
          PH(70, 'fall', { land: true, keep: true }),
          PH(14, 'divRec'),
        ],
      },
      s3: {
        name: 'マグマピラー', cmd: '↓A', limit: 'pillar', ai: { r: [34, 80], w: 4, k: 'zone' },
        phases: [
          PH(14, 'cast1'),
          PH(3, 'slam', { spawn: SPW({ type: 'pillar', x: 56, y: 36, vx: 0, w: 24, h: 72, dmg: 10, hs: 18, bs: 11, kb: 1.5, kd: true, lift: 5, life: 14, delay: 10, pierce: true }), snd: 'rumble' }),
          PH(24, 'castRec'),
        ],
      },
      s4: {
        name: 'ボルケーノボム', cmd: '↓B', limit: 'bomb', ai: { r: [70, 150], w: 3, k: 'proj' },
        phases: [
          PH(12, 'cast1'),
          PH(3, 'cast2', {
            snd: 'shoot',
            spawn: SPW({ type: 'bomb', x: 16, y: 44, vx: 2.3, vy: 3.8, grav: 0.2, w: 14, h: 14, dmg: 6, hs: 14, bs: 9, kb: 2, life: 120,
              ground: { type: 'burst', w: 36, h: 32, life: 10, dmg: 7, hs: 17, bs: 10, kb: 2.4, kd: true } }),
          }),
          PH(25, 'castRec'),
        ],
      },
    },
  },
  /* ---------------------------------------------------------- */
  {
    key: 'baruna', name: 'バルーナ', en: 'BARUNA', stage: 'balloon', pref: [60, 120], airy: 0.3,
    desc: ['バルーンフェスタの空から来た', 'ふわふわ軽量級。空中戦が得意。'],
    stats: { hp: 105, walk: 1.55, back: 1.25, grav: 0.20, w: 20, h: 54, ch: 34, push: 14 },
    jump: { h: 107, t: 64, d: 112 },   // ふんわり（いちばん）
    moves: {
      jab: mkJab({ su: 3, rc: 7, reach: 36, y: 36, dmg: 4 }),
      kick: mkKick({ su: 6, rc: 11, reach: 46, dmg: 6 }),
      jA: mkAirP({ dmg: 5 }), jB: mkAirK({ dmg: 6 }),
      s1: mkCast('バルーンショット', '→A', SPW({ type: 'balloon', x: 18, y: 34, vx: 2.2, vy: 0.1, w: 16, h: 18, dmg: 7, hs: 15, bs: 9, kb: 1.8, life: 100 }),
        { su: 13, rc: 16, ai: { r: [60, 230], w: 4, k: 'proj' } }),
      s2: {
        name: 'ふわふわダイブ', cmd: '→B', ai: { r: [60, 140], w: 4, k: 'dash' },
        phases: [
          PH(6, 'jumpWind'),
          PH(12, 'floatUp', { vx: 2.4, vy: 4.4, inv: true }),
          PH(80, 'dive', { vx: 3.0, vy: -3.2, land: true, snd: 'whoosh', hit: HIT([2, -6, 28, 36], 11, { kd: true, lift: 4, kb: 2.6, hstop: 6 }) }),
          PH(12, 'divRec'),
        ],
      },
      s3: {
        name: 'ふわりジャンプ', cmd: '↓A', ai: { r: [0, 46], w: 2, k: 'escape' },
        phases: [
          PH(8, 'floatBack', { vx: -2.8, vy: 5.8, inv: true }),
          PH(70, 'fall', { keep: true, land: true }),
          PH(6, 'divRec'),
        ],
      },
      s4: {
        name: 'ばくだんおとし', cmd: '↓B', limit: 'bomb', ai: { r: [24, 90], w: 4, k: 'zone' },
        phases: [
          PH(12, 'cast1'),
          PH(3, 'cast2', {
            snd: 'shoot',
            spawn: SPW({ type: 'bomb', x: 44, y: 78, vx: 0, vy: 0, grav: 0.25, w: 14, h: 14, dmg: 10, hs: 15, bs: 9, kb: 2.2, life: 100,
              ground: { type: 'burst', w: 32, h: 28, life: 9, dmg: 9, hs: 16, bs: 10, kb: 2.2, kd: true } }),
          }),
          PH(22, 'castRec'),
        ],
      },
    },
  },
  /* ---------------------------------------------------------- */
  {
    key: 'root', name: 'ルート', en: 'ROOT', stage: 'mathlab', pref: [100, 170],
    desc: ['数学ラボから来た先生ロボ。', '遠くからの攻めとワープが得意。'],
    stats: { hp: 85, walk: 1.35, back: 1.1, grav: 0.30, w: 22, h: 56, ch: 36, push: 16 },
    jump: { h: 105, t: 50, d: 72 },   // ふんわり
    moves: {
      jab: mkJab({ reach: 36 }), kick: mkKick({ reach: 48 }), jA: mkAirP({}), jB: mkAirK({}),
      s1: mkCast('ルートブラスト', '→A', SPW({ type: 'sqrt', x: 20, y: 30, vx: 4.2, w: 16, h: 14, dmg: 6, hs: 14, bs: 8, kb: 1.8, life: 76 }),
        { su: 12, rc: 21, ai: { r: [60, 250], w: 5, k: 'proj' } }),
      s2: {
        name: 'ばいすうショット', cmd: '→B', limit: 'plus', ai: { r: [60, 160], w: 4, k: 'proj' },
        phases: [
          PH(12, 'cast1'),
          PH(3, 'cast2', {
            snd: 'shoot',
            spawn: [
              SPW({ type: 'plus', x: 18, y: 36, vx: 3.4, vy: 1.5, w: 10, h: 10, dmg: 3, hs: 12, bs: 7, kb: 1.4, life: 46 }),
              SPW({ type: 'plus', x: 18, y: 32, vx: 3.6, vy: 0, w: 10, h: 10, dmg: 3, hs: 12, bs: 7, kb: 1.4, life: 46 }),
              SPW({ type: 'plus', x: 18, y: 26, vx: 3.4, vy: -1.1, w: 10, h: 10, dmg: 3, hs: 12, bs: 7, kb: 1.4, life: 46 }),
            ],
          }),
          PH(20, 'castRec'),
        ],
      },
      s3: {
        name: 'リフレクト', cmd: '↓A', ai: { r: [0, 160], w: 2, k: 'reflect' },
        phases: [
          PH(3, 'guard'),
          PH(24, 'reflect', { fx: 'ring', reflect: { box: [2, 4, 36, 54] } }),
          PH(14, 'standRec'),
        ],
      },
      s4: {
        name: 'ワープ', cmd: '↓B', ai: { r: [0, 140], w: 3, k: 'warp' },
        phases: [
          PH(10, 'teleOut', { inv: true, snd: 'warp' }),
          PH(8, 'hidden', { inv: true, hide: true, tele: 'behind' }),
          PH(5, 'appear', { snd: 'warp2', hit: HIT([4, 22, 32, 28], 4, { hs: 16, bs: 9, kb: 1.6, hstop: 4 }) }),
          PH(16, 'castRec'),
        ],
      },
    },
  },
  /* ---------------------------------------------------------- */
  {
    key: 'mutsugo', name: 'ムツゴ', en: 'MUTSUGO', stage: 'ariake', pref: [40, 92],
    desc: ['有明海のひがたから来た。', 'すばしこくて、トリッキー。'],
    stats: { hp: 105, walk: 1.6, back: 1.3, grav: 0.30, w: 24, h: 48, ch: 32, push: 16 },
    jump: { h: 111, t: 30, d: 75 },   // さっと
    moves: {
      jab: mkJab({ su: 3, rc: 7, reach: 34, y: 34, h: 12 }),
      kick: mkKick({ reach: 46, y: 4, h: 22 }),
      jA: mkAirP({ reach: 34 }), jB: mkAirK({}),
      s1: {
        name: 'ぴょんつつき', cmd: '→A', ai: { r: [50, 120], w: 4, k: 'dash' },
        phases: [
          PH(8, 'crouch'),
          PH(10, 'hopUp', { vx: 3.2, vy: 4.2 }),
          PH(70, 'peck', { keep: true, land: true, snd: 'whoosh', hit: HIT([4, -4, 30, 34], 9, { hs: 16, bs: 9, kb: 2.2, hstop: 5 }) }),
          PH(12, 'divRec'),
        ],
      },
      s2: mkCast('どろだんご', '→B', SPW({ type: 'mud', x: 18, y: 32, vx: 3.0, vy: 3.2, grav: 0.18, bounce: 2, w: 14, h: 14, dmg: 8, hs: 14, bs: 8, kb: 1.8, life: 110 }),
        { su: 12, rc: 18, ai: { r: [50, 150], w: 4, k: 'proj' } }),
      s3: {
        name: 'ぬるぬるスライド', cmd: '↓A', ai: { r: [40, 110], w: 4, k: 'dash' },
        phases: [
          PH(7, 'crouch', { hb: 'low' }),
          PH(16, 'slide', { vx: 3.8, hb: 'low', snd: 'whoosh', hit: HIT([0, 0, 34, 16], 8, { hs: 16, bs: 9, kb: 2, kd: true, lift: 3.4, hstop: 5 }) }),
          PH(14, 'slideRec', { hb: 'low' }),
        ],
      },
      s4: {
        name: 'ながいベロ', cmd: '↓B', ai: { r: [40, 80], w: 4, k: 'poke' },
        phases: [
          PH(12, 'tongueWind'),
          PH(6, 'tongue', { fx: 'tongue', snd: 'swing', hit: HIT([6, 26, 66, 10], 8, { hs: 16, bs: 9, kb: 2, hstop: 5 }) }),
          PH(18, 'tongueRec'),
        ],
      },
    },
  },
  /* ---------------------------------------------------------- */
  {
    key: 'raigou', name: 'ライゴウ', en: 'RAIGOU', stage: 'storm', pref: [26, 66],
    desc: ['雷雲の街のスピードスター。', 'とにかく速い。打たれ弱い。'],
    stats: { hp: 82, walk: 1.9, back: 1.5, grav: 0.32, w: 20, h: 54, ch: 34, push: 14 },
    jump: { h: 105, t: 26, d: 84 },   // さっと（いちばん）
    moves: {
      jab: mkJab({ su: 3, ac: 2, rc: 6, reach: 34, y: 36, dmg: 3 }),
      kick: mkKick({ su: 5, ac: 3, rc: 10, reach: 44, dmg: 5 }),
      jA: mkAirP({ dmg: 3 }), jB: mkAirK({ dmg: 5 }),
      s1: {
        name: 'らいげきダッシュ', cmd: '→A', ai: { r: [40, 130], w: 5, k: 'dash' },
        phases: [
          PH(6, 'jabWind'),
          PH(10, 'dashPunch', { vx: 5.6, fx: 'spark', snd: 'whoosh', hit: HIT([6, 22, 30, 20], 5, { hs: 14, bs: 8, kb: 2.4, hstop: 5 }) }),
          PH(15, 'jabRec'),
        ],
      },
      s2: {
        name: 'いかずち', cmd: '→B', limit: 'bolt', ai: { r: [60, 240], w: 4, k: 'zone' },
        phases: [
          PH(14, 'castUp'),
          PH(3, 'castUp2', {
            snd: 'bolt0',
            spawn: SPW({ type: 'bolt', at: 'opp', y: 72, vx: 0, w: 22, h: 144, dmg: 10, hs: 18, bs: 11, kb: 2, kd: true, lift: 4.4, life: 8, delay: 18, pierce: true }),
          }),
          PH(22, 'castRec'),
        ],
      },
      s3: mkCast('スパークボール', '↓A', SPW({ type: 'orb', x: 48, y: 28, vx: 0, w: 20, h: 20, dmg: 3, hs: 9, bs: 6, kb: 0.6, life: 90, mh: 8, pierce: true }),
        { su: 10, rc: 16, limit: 'orb', ai: { r: [30, 110], w: 3, k: 'zone' } }),
      s4: {
        name: 'ほうでん', cmd: '↓B', ai: { r: [0, 42], w: 3, k: 'close' },
        phases: [
          PH(6, 'crouch'),
          PH(8, 'discharge', { fx: 'zap', snd: 'zap', hit: HIT([-32, 0, 64, 58], 7, { hs: 17, bs: 10, kb: 3, kd: true, lift: 3.6, hstop: 6 }) }),
          PH(20, 'dischargeRec'),
        ],
      },
    },
  },
  /* ---------------------------------------------------------- */
  {
    key: 'gitaro', name: 'ギタロー', en: 'GITARO', stage: 'live', pref: [68, 128],
    desc: ['ライブハウスの爆音ロッカー。', '音波と連打でぐいぐい押す。'],
    stats: { hp: 100, walk: 1.35, back: 1.1, grav: 0.30, w: 22, h: 56, ch: 36, push: 16 },
    jump: { h: 104, t: 42, d: 72 },   // ふつう
    moves: {
      jab: mkJab({}), kick: mkKick({}), jA: mkAirP({}), jB: mkAirK({}),
      s1: mkCast('ソニックウェーブ', '→A', SPW({ type: 'wave', x: 22, y: 30, vx: 3.8, w: 14, h: 32, dmg: 6, hs: 15, bs: 9, kb: 2, life: 80 }),
        { su: 12, rc: 18, ai: { r: [60, 240], w: 5, k: 'proj' }, snd: 'wave' }),
      s2: {
        name: 'ギターすいんぐ', cmd: '→B', ai: { r: [20, 62], w: 4, k: 'poke' },
        phases: [
          PH(14, 'swingWind', { prop: 'gtrUp' }),
          PH(5, 'swing', { prop: 'gtrFwd', snd: 'whoosh', hit: HIT([6, 8, 54, 52], 10, { hs: 18, bs: 11, kb: 3.2, kd: true, hstop: 7 }) }),
          PH(20, 'swingRec', { prop: 'gtrDown' }),
        ],
      },
      s3: {
        name: 'パワーコード', cmd: '↓A', ai: { r: [0, 46], w: 3, k: 'close' },
        phases: [
          PH(9, 'strumWind', { prop: 'gtrFwd' }),
          PH(4, 'strum', { prop: 'gtrFwd', snd: 'chord', hit: HIT([4, 8, 42, 44], 3, { hs: 11, bs: 7, kb: 0.5, hstop: 4 }) }),
          PH(4, 'strum', { prop: 'gtrFwd', snd: 'chord', hit: HIT([4, 8, 42, 44], 3, { hs: 11, bs: 7, kb: 0.5, hstop: 4 }) }),
          PH(5, 'strum', { prop: 'gtrFwd', snd: 'chord', hit: HIT([4, 8, 42, 44], 4, { hs: 16, bs: 9, kb: 2.6, kd: true, hstop: 6 }) }),
          PH(16, 'strumRec', { prop: 'gtrFwd' }),
        ],
      },
      s4: {
        name: 'ドラムロール', cmd: '↓B', ai: { r: [0, 46], w: 3, k: 'close' },
        phases: [
          PH(7, 'jabWind'),
          PH(6, 'flurry1', { snd: 'swing', hit: HIT([6, 30, 36, 14], 2, { hs: 9, bs: 6, kb: 0.3, hstop: 2 }) }),
          PH(6, 'flurry2', { snd: 'swing', hit: HIT([6, 30, 36, 14], 2, { hs: 9, bs: 6, kb: 0.3, hstop: 2 }) }),
          PH(6, 'flurry1', { snd: 'swing', hit: HIT([6, 30, 36, 14], 2, { hs: 9, bs: 6, kb: 0.3, hstop: 2 }) }),
          PH(6, 'flurry2', { snd: 'swing', hit: HIT([6, 30, 36, 14], 2, { hs: 9, bs: 6, kb: 0.3, hstop: 2 }) }),
          PH(5, 'jab', { snd: 'swing', hit: HIT([6, 30, 40, 14], 4, { hs: 16, bs: 9, kb: 2.6, kd: true, hstop: 6 }) }),
          PH(16, 'jabRec'),
        ],
      },
    },
  },
];

/* ---------- ジャンプ ----------
   各キャラの jump: { h, t, d } は、人が決める3つの数字。
     h … いちばん高いところ（px）。体力ゲージ（上の黒い帯）に頭がかからない高さにそろえてある
     t … 地面を離れてから着地するまでのフレーム数（60で1秒）。小さいほど「さっと」、大きいほど「ふんわり」
     d … 前にジャンプしたとき、横に進む距離（px）
   ここから、整数の初速 v・ジャンプ中の重力 g を作る（放物線：高さ = g*t*t/8、初速 = g*t/2）。
   整数で1フレームずつ進めると、連続の式より「初速の半分」ぶん低くなるので、そのぶん先に足しておく。
   これで、高さの誤差は 1px 以内、滞空フレーム数は t どおりになる（test/mechanics.js で確かめている）。 */
function jumpArc(h, t) {
  const hc = h + (2 * h) / t;
  const g = S((8 * hc) / (t * t));
  return { v: Math.floor((g * t) / 2), g };
}

/* ---------- px → サブピクセル整数 へ変換（1回だけ） ---------- */
function compileSpawn(s) {
  ['x', 'y', 'vx', 'vy', 'ax', 'grav', 'w', 'h', 'kb', 'lift'].forEach((k) => { if (s[k] !== undefined) s[k] = S(s[k]); });
  if (s.ground) compileSpawn(s.ground);
}
function compileChar(c) {
  if (c._c) return;
  c._c = true;
  const st = c.stats;
  ['walk', 'back', 'grav', 'w', 'h', 'ch', 'push'].forEach((k) => { st[k] = S(st[k]); });
  // ジャンプ：高さ・滞空・距離から、初速・ジャンプ中の重力・横の速さを出す。
  // 技の中のジャンプ（アッパーなど）や、吹っ飛びの重力は、これまでの grav のまま。
  const arc = jumpArc(c.jump.h, c.jump.t);
  st.jumpV = arc.v; st.jumpG = arc.g; st.airX = S(c.jump.d / c.jump.t);
  for (const key of Object.keys(c.moves)) {
    const mv = c.moves[key];
    mv.key = key;
    mv.phases.forEach((p) => {
      if (p.vx !== undefined) p.vx = S(p.vx);
      if (p.vy !== undefined) p.vy = S(p.vy);
      if (p.hit) {
        p.hit.box = p.hit.box.map(S);
        if (p.hit.kb !== undefined) p.hit.kb = S(p.hit.kb);
        if (p.hit.lift !== undefined) p.hit.lift = S(p.hit.lift);
      }
      if (p.reflect) p.reflect.box = p.reflect.box.map(S);
      if (p.spawn) (Array.isArray(p.spawn) ? p.spawn : [p.spawn]).forEach(compileSpawn);
    });
  }
}
CHARS.forEach(compileChar);
const MOVE_KEYS = ['jab', 'kick', 's1', 's2', 's3', 's4', 'jA', 'jB'];
