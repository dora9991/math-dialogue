'use strict';
/* ============================================================
   chars2.js — あとから足した8体のロボ（9〜16人目）と、その技データ
   書き方は chars.js と同じ（PH / HIT / SPW と、共通の mkJab などを使う）。
   この8体で新しく使っている仕組み：
     ・飛び道具の ax …… 毎フレーム vx に足す数（正=だんだん加速／負=ブレーキ→もどってくる）
     ・フェーズの turn …… その瞬間に、相手のほうへ向きなおる（すりぬけたあとの攻撃用）
     ・フェーズの heal …… HPを回復（1ラウンドに2回まで）
   ============================================================ */
CHARS.push(
  /* ---------------------------------------------------------- */
  {
    key: 'kagemaru', name: 'カゲマル', en: 'KAGEMARU', stage: 'bamboo', pref: [46, 104],
    desc: ['たけやぶの ニンジャ。', 'はやくて ひきょうな わざ。'],
    stats: { hp: 86, walk: 1.75, back: 1.4, grav: 0.31, w: 20, h: 54, ch: 34, push: 14 },
    jump: { h: 107, t: 28, d: 82 },   // さっと
    moves: {
      jab: mkJab({ su: 3, ac: 2, rc: 6, reach: 36, y: 36, dmg: 3, hs: 11, bs: 7 }),
      kick: mkKick({ su: 5, ac: 3, rc: 10, reach: 46, dmg: 5 }),
      jA: mkAirP({ dmg: 3 }), jB: mkAirK({ dmg: 5 }),
      s1: mkCast('しゅりけん', '→A', SPW({ type: 'shuriken', x: 18, y: 34, vx: 6.4, w: 12, h: 12, dmg: 5, hs: 13, bs: 8, kb: 1.6, life: 42 }),
        { su: 10, rc: 20, ai: { r: [60, 250], w: 4, k: 'proj' }, snd: 'throw' }),
      s2: {
        name: 'かげぬい', cmd: '→B', ai: { r: [36, 82], w: 4, k: 'dash' },
        phases: [
          PH(7, 'crouch'),
          PH(11, 'crouch', { inv: true, hide: true, vx: 5.4, fx: 'smoke', snd: 'whoosh' }),
          PH(5, 'slash', { turn: true, snd: 'swing', hit: HIT([4, 16, 52, 26], 8, { hs: 15, bs: 9, kb: 2.4, kd: true, hstop: 6 }) }),
          PH(22, 'slashRec'),
        ],
      },
      s3: mkCast('くないなげ', '↓A', SPW({ type: 'kunai', x: 20, y: 10, vx: 5.0, w: 18, h: 8, dmg: 5, hs: 13, bs: 8, kb: 1.8, life: 56 }),
        { su: 13, rc: 23, ai: { r: [50, 200], w: 3, k: 'proj' }, snd: 'throw' }),
      s4: {
        name: 'バクテンげり', cmd: '↓B', ai: { r: [0, 56], w: 3, k: 'aa' },
        phases: [
          PH(3, 'crouch', { inv: true }),
          PH(6, 'flipKick', { vy: 5.8, vx: -1.5, inv: true, snd: 'whoosh', hit: HIT([-2, 10, 34, 46], 8, { kd: true, lift: 5, kb: 1.6, hstop: 7 }) }),
          PH(8, 'flipKick', { keep: true, hit: HIT([-2, 10, 34, 46], 8, { kd: true, lift: 5, kb: 1.6, hstop: 7 }) }),
          PH(70, 'fall', { land: true, keep: true }),
          PH(12, 'divRec'),
        ],
      },
    },
  },
  /* ---------------------------------------------------------- */
  {
    key: 'gaburi', name: 'ガブリ', en: 'GABURI', stage: 'jurassic', pref: [30, 76],
    desc: ['ジュラきの きょうりゅう。', 'かみつきが つよい。'],
    stats: { hp: 114, walk: 1.12, back: 0.85, grav: 0.30, w: 28, h: 58, ch: 40, push: 19 },
    jump: { h: 98, t: 40, d: 56 },   // どっしり
    moves: {
      jab: mkJab({ su: 5, rc: 10, reach: 42, y: 36, h: 16, dmg: 5 }),
      kick: mkKick({ su: 8, ac: 4, rc: 14, reach: 52, dmg: 8, hs: 17, kb: 2.6 }),
      jA: mkAirP({ dmg: 5, reach: 40 }), jB: mkAirK({ dmg: 7, reach: 44 }),
      s1: {
        name: 'ガブリつき', cmd: '→A', ai: { r: [24, 90], w: 4, k: 'dash' },
        phases: [
          PH(11, 'biteWind'),
          PH(7, 'bite', { vx: 3.4, snd: 'chomp', hit: HIT([8, 20, 46, 34], 10, { hs: 18, bs: 11, kb: 3, kd: true, hstop: 8 }) }),
          PH(24, 'biteRec'),
        ],
      },
      s2: {
        name: 'しっぽブン', cmd: '→B', ai: { r: [0, 50], w: 3, k: 'close' },
        phases: [
          PH(13, 'tailWind'),
          PH(7, 'tailSpin', { fx: 'tail', snd: 'whoosh', hit: HIT([-46, 4, 92, 24], 9, { hs: 17, bs: 10, kb: 3, kd: true, hstop: 7 }) }),
          PH(22, 'tailRec'),
        ],
      },
      s3: {
        name: 'ほえる', cmd: '↓A', limit: 'roar', ai: { r: [20, 64], w: 2, k: 'close' },
        phases: [
          PH(12, 'roarWind'),
          PH(3, 'roar', { snd: 'roar', spawn: SPW({ type: 'roar', x: 28, y: 38, vx: 3.6, w: 24, h: 50, dmg: 6, hs: 17, bs: 10, kb: 3.6, life: 30 }) }),
          PH(24, 'roarRec'),
        ],
      },
      s4: {
        name: 'どしんフミ', cmd: '↓B', limit: 'quake', ai: { r: [40, 100], w: 3, k: 'poke' },
        phases: [
          PH(9, 'crouch'),
          PH(16, 'stompUp', { vy: 6.4, vx: 1.6, snd: 'jump' }),
          PH(70, 'stompDown', { vy: -4.2, vx: 1.2, land: true, hit: HIT([-6, -8, 36, 36], 10, { hs: 18, bs: 11, kb: 2.6, kd: true, hstop: 7 }) }),
          PH(26, 'stompRec', {
            snd: 'slam',
            spawn: SPW({ type: 'quake', x: 22, y: 6, vx: 2.4, w: 18, h: 10, dmg: 6, hs: 16, bs: 9, kb: 2, life: 30 }),
            hit: HIT([-26, 0, 52, 14], 6, { hs: 16, bs: 9, kb: 2.2, hstop: 5 }),
          }),
        ],
      },
    },
  },
  /* ---------------------------------------------------------- */
  {
    key: 'fubuki', name: 'フブキ', en: 'FUBUKI', stage: 'snow', pref: [86, 160],
    desc: ['ゆきぐにの こおりロボ。', 'とおくから せめる。'],
    stats: { hp: 90, walk: 1.3, back: 1.1, grav: 0.28, w: 20, h: 54, ch: 34, push: 14 },
    jump: { h: 101, t: 52, d: 80 },   // ふんわり
    moves: {
      jab: mkJab({ su: 4, reach: 36, dmg: 4 }), kick: mkKick({ reach: 46 }), jA: mkAirP({}), jB: mkAirK({}),
      s1: mkCast('ゆきだま', '→A', SPW({ type: 'snowball', x: 18, y: 42, vx: 2.6, vy: 3.0, grav: 0.14, w: 16, h: 16, dmg: 7, hs: 15, bs: 9, kb: 2, life: 110,
        ground: { type: 'snowburst', w: 30, h: 20, life: 8, dmg: 5, hs: 15, bs: 9, kb: 1.8 } }),
        { su: 13, rc: 20, ai: { r: [70, 230], w: 5, k: 'proj' }, snd: 'throw' }),
      s2: {
        name: 'つらら', cmd: '→B', limit: 'icicle', ai: { r: [50, 120], w: 4, k: 'zone' },
        phases: [
          PH(14, 'cast1'),
          PH(3, 'castUp2', {
            snd: 'ice',
            spawn: SPW({ type: 'icicle', x: 78, y: 150, vx: 0, vy: -0.5, grav: 0.22, w: 10, h: 30, dmg: 9, hs: 17, bs: 10, kb: 2, kd: true, lift: 3.4, life: 90, delay: 16,
              ground: { type: 'iceshard', w: 26, h: 12, life: 8, dmg: 4, hs: 14, bs: 8, kb: 1.4 } }),
          }),
          PH(24, 'castRec'),
        ],
      },
      s3: {
        name: 'こおりのかべ', cmd: '↓A', limit: 'iwall', ai: { r: [30, 140], w: 3, k: 'zone' },
        phases: [
          PH(12, 'cast1'),
          PH(3, 'cast2', { snd: 'ice', spawn: SPW({ type: 'iwall', x: 44, y: 26, vx: 0, w: 16, h: 52, dmg: 7, hs: 16, bs: 9, kb: 2, life: 150 }) }),
          PH(20, 'castRec'),
        ],
      },
      s4: {
        name: 'ふぶき', cmd: '↓B', limit: 'blizzard', ai: { r: [50, 120], w: 3, k: 'zone' },
        phases: [
          PH(16, 'blowWind'),
          PH(3, 'blow', { snd: 'wave', spawn: SPW({ type: 'blizzard', x: 24, y: 28, vx: 1.5, w: 36, h: 46, dmg: 3, hs: 11, bs: 7, kb: 0.8, life: 64, mh: 10, pierce: true, hstop: 3 }) }),
          PH(20, 'blowRec'),
        ],
      },
    },
  },
  /* ---------------------------------------------------------- */
  {
    key: 'hayabusa', name: 'ハヤブサ', en: 'HAYABUSA', stage: 'space', pref: [64, 130], airy: 0.2,
    desc: ['たねがしまの ロボ。', 'いきおいが すごい。'],
    stats: { hp: 98, walk: 1.45, back: 1.2, grav: 0.26, w: 22, h: 56, ch: 36, push: 16 },
    jump: { h: 100, t: 58, d: 104 },   // ふんわり
    moves: {
      jab: mkJab({}), kick: mkKick({}), jA: mkAirP({}), jB: mkAirK({}),
      s1: mkCast('ミニロケット', '→A', SPW({ type: 'rocket', x: 20, y: 34, vx: 1.2, ax: 0.11, w: 18, h: 10, dmg: 7, hs: 15, bs: 9, kb: 2.2, life: 70 }),
        { su: 12, rc: 20, ai: { r: [70, 250], w: 5, k: 'proj' }, snd: 'rocket' }),
      s2: {
        name: 'ロケットずつき', cmd: '→B', ai: { r: [60, 140], w: 4, k: 'dash' },
        phases: [
          PH(10, 'shoulderWind'),
          PH(14, 'rocketHead', { vx: 6.0, fx: 'flame', snd: 'rocket', hit: HIT([4, 14, 36, 30], 9, { hs: 16, bs: 10, kb: 2.8, kd: true, hstop: 6 }) }),
          PH(22, 'divRec'),
        ],
      },
      s3: {
        name: 'ぎゃくふんしゃ', cmd: '↓A', ai: { r: [0, 46], w: 2, k: 'escape' },
        phases: [
          PH(3, 'jetBack', { inv: true, vx: -4.8, fx: 'jetfront', snd: 'whoosh' }),
          PH(12, 'jetBack', { inv: true, vx: -3.4, fx: 'jetfront', hit: HIT([4, 8, 36, 40], 5, { hs: 15, bs: 9, kb: 2.6, hstop: 5 }) }),
          PH(12, 'divRec'),
        ],
      },
      s4: {
        name: 'いんせきおとし', cmd: '↓B', limit: 'meteor', ai: { r: [60, 150], w: 3, k: 'zone' },
        phases: [
          PH(14, 'castUp'),
          PH(3, 'castUp2', {
            snd: 'whoosh',
            spawn: SPW({ type: 'meteor', x: 110, y: 170, vx: -0.7, vy: -2.4, grav: 0.08, w: 20, h: 20, dmg: 9, hs: 17, bs: 10, kb: 2.2, kd: true, life: 120,
              ground: { type: 'burst', w: 34, h: 30, life: 10, dmg: 6, hs: 16, bs: 10, kb: 2.2, kd: true } }),
          }),
          PH(22, 'castRec'),
        ],
      },
    },
  },
  /* ---------------------------------------------------------- */
  {
    key: 'daruma', name: 'ダルマ', en: 'DARUMA', stage: 'shrine', pref: [28, 74],
    desc: ['じんじゃの だるまロボ。', 'ねがいで げんきに。'],
    stats: { hp: 112, walk: 1.0, back: 0.85, grav: 0.30, w: 26, h: 52, ch: 40, push: 18 },
    jump: { h: 107, t: 36, d: 50 },   // どっしり
    moves: {
      jab: mkJab({ su: 4, rc: 9, reach: 36, y: 30, h: 16, dmg: 5 }),
      kick: mkKick({ su: 8, rc: 14, reach: 46, dmg: 7, hs: 16, kb: 2.4 }),
      jA: mkAirP({ dmg: 4 }), jB: mkAirK({ dmg: 6 }),
      s1: {
        name: 'ころがりタックル', cmd: '→A', ai: { r: [30, 100], w: 4, k: 'dash' },
        phases: [
          PH(9, 'curl'),
          PH(26, 'rollA', { alt: ['rollA', 'rollB', 'rollC', 'rollD'], altN: 3, vx: 3.0, snd: 'whoosh', hit: HIT([-4, 2, 40, 42], 4, { mh: 9, hs: 12, bs: 8, kb: 1.4, hstop: 3 }) }),
          PH(18, 'curl'),
        ],
      },
      s2: {
        name: 'ずつき', cmd: '→B', ai: { r: [16, 62], w: 4, k: 'poke' },
        phases: [
          PH(11, 'zutsuWind'),
          PH(7, 'zutsu', { vx: 2.2, snd: 'whoosh', hit: HIT([4, 28, 38, 26], 9, { hs: 16, bs: 10, kb: 2.4, kd: true, hstop: 6 }) }),
          PH(20, 'zutsuRec'),
        ],
      },
      s3: {
        name: 'ねがいごと', cmd: '↓A', ai: { r: [90, 300], w: 3, k: 'heal' },
        phases: [
          PH(8, 'crouch'),
          PH(30, 'wish', { fx: 'sparkle', heal: 7 }),
          PH(10, 'standRec'),
        ],
      },
      s4: mkCast('ころころだるま', '↓B', SPW({ type: 'minidaruma', x: 20, y: 30, vx: 2.2, vy: 3.6, grav: 0.2, bounce: 3, w: 14, h: 14, dmg: 7, hs: 15, bs: 9, kb: 2, life: 150 }),
        { su: 12, rc: 20, ai: { r: [50, 190], w: 3, k: 'proj' } }),
    },
  },
  /* ---------------------------------------------------------- */
  {
    key: 'mentaro', name: 'メンタロー', en: 'MENTARO', stage: 'yatai', pref: [52, 128],
    desc: ['ラーメンやたいの ロボ。', 'めんと ゆげで ふりまわす。'],
    stats: { hp: 102, walk: 1.3, back: 1.05, grav: 0.30, w: 22, h: 56, ch: 36, push: 16 },
    jump: { h: 100, t: 44, d: 70 },   // ふつう
    moves: {
      jab: mkJab({}), kick: mkKick({}), jA: mkAirP({}), jB: mkAirK({}),
      s1: {
        name: 'どんぶりなげ', cmd: '→A', limit: 'bowl', ai: { r: [60, 200], w: 5, k: 'proj' },
        phases: [
          PH(11, 'cast1'),
          PH(3, 'cast2', {
            snd: 'shoot',
            spawn: SPW({ type: 'bowl', x: 16, y: 50, vx: 2.9, vy: 3.0, grav: 0.17, w: 18, h: 16, dmg: 6, hs: 14, bs: 9, kb: 1.8, life: 120,
              ground: { type: 'steam', w: 34, h: 30, life: 18, dmg: 5, hs: 16, bs: 9, kb: 1.6 } }),
          }),
          PH(16, 'castRec'),
        ],
      },
      s2: {
        name: 'めんのばし', cmd: '→B', ai: { r: [40, 92], w: 4, k: 'poke' },
        phases: [
          PH(14, 'noodleWind'),
          PH(5, 'noodle', { fx: 'noodle', snd: 'swing', hit: HIT([8, 28, 76, 10], 5, { hs: 12, bs: 8, kb: 0.8, hstop: 3 }) }),
          PH(5, 'noodle2', { fx: 'noodle', hit: HIT([8, 28, 76, 10], 6, { hs: 15, bs: 9, kb: 2.2, hstop: 5 }) }),
          PH(18, 'noodleRec'),
        ],
      },
      s3: {
        name: 'ゆげバリア', cmd: '↓A', limit: 'steamcloud', ai: { r: [0, 60], w: 2, k: 'close' },
        phases: [
          PH(10, 'cast1'),
          PH(3, 'steamPose', { snd: 'steam', spawn: SPW({ type: 'steamcloud', x: 30, y: 28, vx: 0, w: 46, h: 52, dmg: 3, hs: 11, bs: 7, kb: 0.4, life: 46, mh: 9, pierce: true, hstop: 2 }) }),
          PH(18, 'castRec'),
        ],
      },
      s4: {
        name: 'ラーメンアッパー', cmd: '↓B', ai: { r: [0, 54], w: 3, k: 'aa' },
        phases: [
          PH(4, 'uppercutWind', { inv: true }),
          PH(6, 'uppercut', { vy: 5.4, vx: 0.6, inv: true, snd: 'whoosh', hit: HIT([4, 24, 28, 42], 8, { kd: true, lift: 5, kb: 1.6, hstop: 7 }) }),
          PH(8, 'uppercut', { keep: true, hit: HIT([4, 24, 28, 42], 8, { kd: true, lift: 5, kb: 1.6, hstop: 7 }) }),
          PH(70, 'fall', { land: true, keep: true }),
          PH(14, 'divRec'),
        ],
      },
    },
  },
  /* ---------------------------------------------------------- */
  {
    key: 'kawataro', name: 'カワタロ', en: 'KAWATARO', stage: 'river', pref: [48, 118],
    desc: ['ちくごがわの かっぱロボ。', 'うでを ぬいて なげるよ。'],
    stats: { hp: 96, walk: 1.4, back: 1.15, grav: 0.30, w: 22, h: 52, ch: 34, push: 16 },
    jump: { h: 103, t: 34, d: 78 },   // さっと
    moves: {
      jab: mkJab({ su: 3, rc: 7, reach: 36, y: 34, h: 14 }), kick: mkKick({ reach: 46 }), jA: mkAirP({}), jB: mkAirK({}),
      s1: mkCast('みずでっぽう', '→A', SPW({ type: 'water', x: 22, y: 26, vx: 5.0, w: 20, h: 10, dmg: 5, hs: 14, bs: 8, kb: 2.6, life: 56 }),
        { su: 11, rc: 21, ai: { r: [60, 230], w: 4, k: 'proj' }, snd: 'splash' }),
      s2: {
        name: 'うでぬき', cmd: '→B', limit: 'boomhand', ai: { r: [50, 150], w: 4, k: 'proj' },
        phases: [
          PH(13, 'cast1'),
          PH(3, 'cast2', { snd: 'shoot', spawn: SPW({ type: 'boomhand', x: 20, y: 30, vx: 5.0, ax: -0.15, w: 16, h: 14, dmg: 4, hs: 14, bs: 8, kb: 1.8, life: 72, mh: 34, pierce: true, hide: 'hf' }) }),
          PH(22, 'castRec'),
        ],
      },
      s3: {
        name: 'すいりゅう', cmd: '↓A', limit: 'geyser', ai: { r: [36, 90], w: 4, k: 'zone' },
        phases: [
          PH(13, 'geyserCast'),
          PH(3, 'geyserCast2', { snd: 'splash', spawn: SPW({ type: 'geyser', x: 62, y: 36, vx: 0, w: 24, h: 72, dmg: 8, hs: 17, bs: 10, kb: 1.5, kd: true, lift: 5, life: 14, delay: 15, pierce: true }) }),
          PH(24, 'castRec'),
        ],
      },
      s4: {
        name: 'かっぱスピン', cmd: '↓B', ai: { r: [0, 40], w: 3, k: 'close' },
        phases: [
          PH(8, 'crouch'),
          PH(24, 'spinA', { alt: ['spinA', 'spinB', 'spinC', 'spinD'], altN: 3, fx: 'splash', snd: 'whoosh', hit: HIT([-30, 0, 60, 52], 3, { mh: 6, hs: 10, bs: 6, kb: 0.4, hstop: 2 }) }),
          PH(5, 'spinA', { hit: HIT([-30, 0, 60, 52], 4, { kd: true, hs: 16, bs: 9, kb: 2.8, hstop: 6 }) }),
          PH(10, 'divRec'),
        ],
      },
    },
  },
  /* ---------------------------------------------------------- */
  {
    key: 'poporo', name: 'ポポロ', en: 'POPORO', stage: 'circus', pref: [50, 125],
    desc: ['サーカスの ピエロロボ。', 'いたずらが だいすき。'],
    stats: { hp: 116, walk: 1.45, back: 1.2, grav: 0.28, w: 22, h: 56, ch: 36, push: 16 },
    jump: { h: 100, t: 46, d: 76 },   // ふんわり
    moves: {
      jab: mkJab({}), kick: mkKick({ reach: 50, rc: 13 }), jA: mkAirP({}), jB: mkAirK({}),
      s1: {
        name: 'ジャグリング', cmd: '→A', limit: 'jugball', ai: { r: [40, 170], w: 4, k: 'proj' },
        phases: [
          PH(9, 'jugWind'),
          PH(3, 'jug', {
            snd: 'shoot',
            spawn: [
              SPW({ type: 'jugball', x: 16, y: 56, vx: 1.8, vy: 4.8, grav: 0.2, w: 14, h: 14, dmg: 5, hs: 13, bs: 7, kb: 1.4, life: 100 }),
              SPW({ type: 'jugball', x: 16, y: 56, vx: 2.7, vy: 4.2, grav: 0.2, w: 14, h: 14, dmg: 5, hs: 13, bs: 7, kb: 1.4, life: 100 }),
              SPW({ type: 'jugball', x: 16, y: 56, vx: 3.6, vy: 3.4, grav: 0.2, w: 14, h: 14, dmg: 5, hs: 13, bs: 7, kb: 1.4, life: 100 }),
            ],
          }),
          PH(15, 'castRec'),
        ],
      },
      s2: {
        name: 'びっくりばこ', cmd: '→B', limit: 'jackbox', ai: { r: [30, 100], w: 4, k: 'zone' },
        phases: [
          PH(12, 'cast1'),
          PH(3, 'cast2', { snd: 'spring', spawn: SPW({ type: 'jackbox', x: 58, y: 34, vx: 0, w: 30, h: 68, dmg: 10, hs: 17, bs: 10, kb: 2, kd: true, lift: 4.6, life: 14, delay: 16, pierce: true }) }),
          PH(20, 'castRec'),
        ],
      },
      s3: {
        name: 'たまのり', cmd: '↓A', ai: { r: [50, 150], w: 4, k: 'dash' },
        phases: [
          PH(8, 'ballWind'),
          PH(26, 'ballA', { alt: ['ballA', 'ballB'], altN: 4, vx: 4.4, fx: 'ball', snd: 'whoosh', hit: HIT([2, 6, 34, 34], 7, { hs: 15, bs: 9, kb: 2.4, hstop: 5 }) }),
          PH(16, 'ballRec', { fx: 'ball' }),
        ],
      },
      s4: {
        name: 'ハンマーぽん', cmd: '↓B', ai: { r: [14, 70], w: 3, k: 'poke' },
        phases: [
          PH(16, 'slamWind', { fx: 'hammer' }),
          PH(5, 'slam', { fx: 'hammer', snd: 'slam', hit: HIT([10, 6, 50, 50], 10, { hs: 19, bs: 11, kb: 3, kd: true, hstop: 8 }) }),
          PH(26, 'slamRec', { fx: 'hammer' }),
        ],
      },
    },
  },
);
CHARS.forEach(compileChar);   // 前半8体は chars.js で変換ずみ。ここで足した8体だけが変換される
