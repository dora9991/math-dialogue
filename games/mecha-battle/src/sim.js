'use strict';
/* ============================================================
   sim.js — 対戦シミュレーション（固定60Hz・整数のみ・決定論）
   画面描画・音・DOM には一切触れない。出来事は m.events に積むだけ。
   ============================================================ */
const BUF_FRAMES = 6;          // ボタン先行入力の猶予
const FRIC = S(0.12);          // 吹っ飛びの減速
const DOWN_FRAMES = 38;        // ダウン時間
const WAKE_FRAMES = 14;        // 起き上がり（無敵）
const INTRO_FRAMES = 150;      // ROUND表示 + FIGHT!
const END_KO_FRAMES = 130;     // KO演出
const END_TIME_FRAMES = 90;    // タイムアップ演出
const OVER_ROUND_FRAMES = 150; // ラウンド結果を見せる時間（次のラウンドへ）
const COMBO_SCALE = [100, 90, 80, 70, 60, 50];
const KD_COMBO = 5;            // 5ヒット目で必ず吹っ飛ぶ

/* ---------- 取り出し用 ---------- */
const fMove = (f) => (f.mv ? CHARS[f.ch].moves[f.mv] : null);
const fPhase = (f) => (f.mv ? CHARS[f.ch].moves[f.mv].phases[f.ph] : null);

function ev(m, t, o) { const e = o || {}; e.t = t; m.events.push(e); }

/* ---------- 生成・リセット ---------- */
function resetFighter(f, i) {
  const c = CHARS[f.ch];
  Object.assign(f, {
    x: S(i === 0 ? 90 : 166), y: 0, vx: 0, vy: 0, face: i === 0 ? 1 : -1, hp: c.stats.hp,
    st: 'idle', t: 0, mv: null, ph: 0, pt: 0, hd: {}, stun: 0, flash: 0, comboN: 0,
    bufA: 0, bufB: 0, in: 0, dm: [0, 0, 0], airAtk: false, crouchG: false, hits: 0, jmp: false, wish: 0,
  });
  return f;
}
function newFighter(i, ch) { return resetFighter({ i, ch }, i); }

function createMatch(cfg) {
  const c = Object.assign({ rounds: 2, time: 60, seed: 1 }, cfg);
  return {
    cfg: c, frame: 0, rng: { s: (c.seed | 0) || 1 },
    f: [newFighter(0, c.ch[0]), newFighter(1, c.ch[1])],
    projs: [], round: 1, wins: [0, 0], draws: 0, phase: 'intro', pt: 0, timer: c.time * FPS,
    freeze: 0, events: [], roundWinner: -1, matchWinner: -1, endWhy: '',
  };
}
function nextRound(m) {
  m.round++;
  m.f.forEach((f, i) => resetFighter(f, i));
  m.projs = []; m.timer = m.cfg.time * FPS; m.phase = 'intro'; m.pt = 0; m.freeze = 0;
  m.roundWinner = -1; m.endWhy = '';
}

/* ---------- 幾何 ---------- */
const clampX = (f) => { f.x = clamp(f.x, S(WALL_L), S(WALL_R)); };
const ov = (a, b) => a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];
function fbox(f, b) {
  const x0 = f.face > 0 ? f.x + b[0] : f.x - b[0] - b[2];
  return [x0, f.y + b[1], x0 + b[2], f.y + b[1] + b[3]];
}
function hurtBox(f) {
  const st = CHARS[f.ch].stats;
  const p = f.st === 'atk' ? fPhase(f) : null;
  let h = st.h, y0 = f.y;
  if (f.st === 'crouch' || (f.st === 'block' && f.crouchG) || (p && p.hb === 'low')) h = st.ch;
  else if (f.y > 0 && f.st !== 'knock') y0 = f.y + S(6);
  const hw = st.w >> 1;
  return [f.x - hw, y0, f.x + hw, f.y + h];
}
function hittable(d) {
  if (d.st === 'down' || d.st === 'wake' || d.st === 'ko') return false;
  if (d.st === 'knock' && d.comboN >= 4) return false;
  if (d.st === 'atk') { const p = fPhase(d); if (p.inv) return false; }
  return true;
}

/* ---------- 入力のバッファ ---------- */
function bufferInput(f, inp) {
  const pressed = inp & ~f.in;
  if (pressed & IN.A) f.bufA = BUF_FRAMES;
  if (pressed & IN.B) f.bufB = BUF_FRAMES;
  f.dm[2] = f.dm[1]; f.dm[1] = f.dm[0]; f.dm[0] = inp & 15;
  f.in = inp;
}

/* どの技を出すか：ボタン＋方向（→=前、↓=下）。空中は専用技。 */
function pickMove(f, grounded) {
  if (f.bufA <= 0 && f.bufB <= 0) return null;
  const useA = f.bufA >= f.bufB;
  if (!grounded) return useA ? 'jA' : 'jB';
  const d = f.dm[0] | f.dm[1] | f.dm[2];
  const fwd = f.face > 0 ? IN.RIGHT : IN.LEFT;
  if (d & IN.DOWN) return useA ? 's3' : 's4';
  if (d & fwd) return useA ? 's1' : 's2';
  return useA ? 'jab' : 'kick';
}
function canStart(m, f, key) {
  const mv = CHARS[f.ch].moves[key];
  if (mv.limit) {
    let n = 0;
    for (const p of m.projs) if (p.own === f.i && p.type === mv.limit && !p.dead) n++;
    if (n >= 1) return false;
  }
  return true;
}

/* ---------- 技の進行 ---------- */
function startMove(m, f, key) {
  f.st = 'atk'; f.mv = key; f.hd = {}; f.t = 0; f.bufA = 0; f.bufB = 0;
  if (CHARS[f.ch].moves[key].air) f.airAtk = true;
  enterPhase(m, f, 0);
}
function enterPhase(m, f, idx) {
  const mv = CHARS[f.ch].moves[f.mv], p = mv.phases[idx];
  f.ph = idx; f.pt = 0;
  if (!p.keep && !mv.air) f.vx = (p.vx || 0) * f.face;
  else if (p.vx !== undefined) f.vx = p.vx * f.face;
  if (p.vy !== undefined) f.vy = p.vy;
  if (p.tele) teleport(m, f);
  if (p.turn) { const o = m.f[1 - f.i]; if (o.x !== f.x) f.face = o.x > f.x ? 1 : -1; }   // すりぬけたあと、相手のほうへ向きなおる
  if (p.heal && f.wish < 2) {   // HP回復（1ラウンドに2回まで）
    f.wish++; f.hp = Math.min(CHARS[f.ch].stats.hp, f.hp + p.heal);
    ev(m, 'heal', { x: f.x, y: f.y + S(28) });
  }
  if (p.spawn) spawnProjs(m, f, p.spawn);
  if (p.snd) ev(m, 'snd', { n: p.snd, i: f.i });
  if (p.land && f.y === 0 && f.vy <= 0) advance(m, f);   // もう着地済みなら飛ばす
}
function advance(m, f) {
  const mv = CHARS[f.ch].moves[f.mv], p = mv.phases[f.ph];
  if (p.end || f.ph + 1 >= mv.phases.length) endMove(f);
  else enterPhase(m, f, f.ph + 1);
}
function endMove(f) {
  f.mv = null; f.ph = 0; f.pt = 0; f.t = 0;
  if (f.y > 0) f.st = 'air';
  else { f.st = 'idle'; f.vx = 0; }
}
function teleport(m, f) {
  const o = m.f[1 - f.i];
  const side = sgn(f.x - o.x) || -f.face;        // 相手から見て自分がいる側
  let nx = o.x - side * S(34);
  if (nx < S(WALL_L) || nx > S(WALL_R)) nx = o.x + side * S(34);
  f.x = clamp(nx, S(WALL_L), S(WALL_R));
  f.face = sgn(o.x - f.x) || f.face;
  ev(m, 'puff', { x: f.x, y: 0 });
}
function spawnProjs(m, f, spec) {
  const list = Array.isArray(spec) ? spec : [spec];
  const o = m.f[1 - f.i];
  for (const s of list) {
    m.projs.push({
      own: f.i, type: s.type, x: s.at === 'opp' ? o.x : f.x + f.face * s.x, y: f.y + s.y,
      vx: f.face * s.vx, vy: s.vy, ax: f.face * (s.ax || 0), grav: s.grav, w: s.w, h: s.h,
      hh: { dmg: s.dmg, hs: s.hs, bs: s.bs, kb: s.kb, kd: !!s.kd, lift: s.lift, hstop: s.hstop },
      life: s.life, delay: s.delay, mh: s.mh || 0, pierce: !!s.pierce, bounce: s.bounce || 0,
      ground: s.ground || null, hide: s.hide || null, dir: f.face, age: 0, hits: {}, dead: false,
    });
  }
}

/* ---------- 各ステートの1フレーム ---------- */
const decay = (v, a) => (v > 0 ? (v > a ? v - a : 0) : v < -a ? v + a : 0);

function tickFighter(m, f) {
  const C = CHARS[f.ch];
  const o = m.f[1 - f.i];
  f.t++;
  if (f.flash > 0) f.flash--;
  if (f.bufA > 0) f.bufA--;
  if (f.bufB > 0) f.bufB--;
  if (f.jmp && f.y === 0 && f.vy <= 0) f.jmp = false;   // 地面に着いたら、ジャンプ中の重力はおしまい（吹っ飛びで着地した場合も）
  const live = m.phase === 'fight';
  const inp = live ? f.in : 0;
  switch (f.st) {
    case 'idle': case 'walk': case 'crouch': tickGround(m, f, o, inp, C, live); break;
    case 'air': tickAir(m, f, o, C, live); break;
    case 'atk': tickAtk(m, f, C); break;
    case 'hit': case 'block':
      f.x += f.vx; clampX(f); f.vx = decay(f.vx, FRIC);
      if (--f.stun <= 0) { f.st = 'idle'; f.t = 0; f.vx = 0; f.crouchG = false; }
      break;
    case 'knock':
      f.vy -= C.stats.grav; f.y += f.vy; f.x += f.vx; clampX(f);
      if (f.y <= 0) { f.y = 0; f.vy = 0; f.vx = 0; f.st = 'down'; f.t = 0; ev(m, 'down', { x: f.x }); }
      break;
    case 'down': if (f.t >= DOWN_FRAMES) { f.st = 'wake'; f.t = 0; } break;
    case 'wake': if (f.t >= WAKE_FRAMES) { f.st = 'idle'; f.t = 0; } break;
    case 'ko':
      f.vy -= C.stats.grav; f.y += f.vy; f.x += f.vx;
      f.x = clamp(f.x, S(8), S(SCREEN_W - 8));
      if (f.y <= 0) {
        f.y = 0;
        if (f.vy < -S(1.2)) { f.vy = (-f.vy) >> 1; f.vx = f.vx >> 1; ev(m, 'down', { x: f.x }); }
        else { f.vy = 0; f.vx = 0; }
      }
      break;
    default: break; // win / intro
  }
}

function tickGround(m, f, o, inp, C, live) {
  f.comboN = 0;
  if (live && f.x !== o.x) f.face = o.x > f.x ? 1 : -1;
  const fwd = f.face > 0 ? IN.RIGHT : IN.LEFT, back = f.face > 0 ? IN.LEFT : IN.RIGHT;
  if (live && (f.bufA > 0 || f.bufB > 0)) {
    const key = pickMove(f, true);
    if (key && canStart(m, f, key)) { startMove(m, f, key); return; }
    if (key) { f.bufA = 0; f.bufB = 0; }
  }
  if (inp & IN.UP) {
    f.st = 'air'; f.t = 0; f.airAtk = false; f.jmp = true; f.vy = C.stats.jumpV;
    f.vx = (((inp & IN.RIGHT) ? 1 : 0) - ((inp & IN.LEFT) ? 1 : 0)) * C.stats.airX;
    ev(m, 'snd', { n: 'jump', i: f.i });
    return;
  }
  if (inp & IN.DOWN) { f.st = 'crouch'; f.vx = 0; return; }
  if (inp & fwd) { f.st = 'walk'; f.vx = f.face * C.stats.walk; }
  else if (inp & back) { f.st = 'walk'; f.vx = -f.face * C.stats.back; }
  else { f.st = 'idle'; f.vx = 0; }
  f.x += f.vx; clampX(f);
}

function tickAir(m, f, o, C, live) {
  if (live && !f.airAtk && (f.bufA > 0 || f.bufB > 0)) {
    const key = pickMove(f, false);
    if (key) { startMove(m, f, key); return; }
  }
  f.vy -= f.jmp ? C.stats.jumpG : C.stats.grav; f.y += f.vy; f.x += f.vx; clampX(f);   // 技のあと空中に残った場合(jmpなし)は、これまでの重力
  if (f.y <= 0) {
    f.y = 0; f.vy = 0; f.vx = 0; f.st = 'idle'; f.t = 0; f.airAtk = false;
    if (f.x !== o.x) f.face = o.x > f.x ? 1 : -1;
    ev(m, 'land', { x: f.x });
  }
}

function tickAtk(m, f, C) {
  const mv = C.moves[f.mv], p = mv.phases[f.ph];
  let landed = false;
  if (f.y > 0 || f.vy > 0) {
    f.vy -= f.jmp ? C.stats.jumpG : C.stats.grav; f.y += f.vy;   // ジャンプ中の空中技は、ジャンプの続き（同じ放物線）
    if (f.y <= 0) { f.y = 0; f.vy = 0; landed = true; }
  }
  f.x += f.vx; clampX(f);
  f.pt++;
  if (landed) {
    ev(m, 'land', { x: f.x });
    if (p.land) { advance(m, f); return; }
    if (mv.landPh !== undefined && f.ph < mv.landPh) { enterPhase(m, f, mv.landPh); return; }
    if (mv.air) { f.airAtk = false; endMove(f); return; }
  }
  if (f.pt >= p.dur) advance(m, f);
}

/* ---------- 当たり判定 ---------- */
function resolveHits(m) {
  const list = [];
  for (let i = 0; i < 2; i++) {
    const a = m.f[i], d = m.f[1 - i];
    if (a.st !== 'atk') continue;
    const p = fPhase(a);
    if (!p.hit) continue;
    const last = a.hd[a.ph];
    if (last !== undefined && !(p.hit.mh && a.pt - last >= p.hit.mh)) continue;
    if (!hittable(d)) continue;
    const hb = fbox(a, p.hit.box), ub = hurtBox(d);
    if (!ov(hb, ub)) continue;
    a.hd[a.ph] = a.pt;
    list.push({ a, d, h: p.hit, hb, ub });
  }
  for (const e of list) applyHit(m, e.a, e.d, e.h, e.hb, e.ub, null);
}

function applyHit(m, a, d, h, hb, ub, pr) {
  const srcX = pr ? pr.x : a.x;
  const dir = sgn(d.x - srcX) || (pr ? pr.dir : a.face);
  const cx = (Math.max(hb[0], ub[0]) + Math.min(hb[2], ub[2])) >> 1;
  const cy = (Math.max(hb[1], ub[1]) + Math.min(hb[3], ub[3])) >> 1;
  const dp = d.st === 'atk' ? fPhase(d) : null;

  // カウンター技（ムシャガエシ）
  if (dp && dp.counter !== undefined) {
    d.flash = 6; d.face = sgn(srcX - d.x) || d.face;
    enterPhase(m, d, dp.counter);
    m.freeze = 10;
    ev(m, 'counter', { x: cx, y: cy });
    return 'counter';
  }

  // ガード判定：攻撃元と反対方向を押している（地上のみ）
  const away = dir > 0 ? IN.RIGHT : IN.LEFT;
  const grounded = d.y === 0 && (d.st === 'idle' || d.st === 'walk' || d.st === 'crouch' || d.st === 'block');
  if (grounded && (d.st === 'block' || (d.in & away))) {
    const chip = Math.floor(h.dmg / 6);
    if (chip > 0) d.hp = Math.max(1, d.hp - chip);
    d.crouchG = d.st === 'crouch' || (d.st === 'block' && d.crouchG) || (d.in & IN.DOWN) !== 0;
    d.st = 'block'; d.t = 0; d.stun = h.bs; d.vx = dir * h.kb;
    m.freeze = Math.min(h.hstop, 4);
    ev(m, 'block', { x: cx, y: cy });
    pushAttacker(a, d, dir, h.kb);
    return 'block';
  }

  const scale = COMBO_SCALE[Math.min(d.comboN, COMBO_SCALE.length - 1)];
  const dmg = Math.max(1, Math.floor(h.dmg * scale / 100));
  d.hp -= dmg; d.comboN++; d.flash = 3; a.hits++;
  const lethal = d.hp <= 0;
  d.mv = null; d.hd = {}; d.crouchG = false; d.face = -dir; d.t = 0;
  if (lethal) {
    d.hp = 0; d.st = 'ko'; d.vx = dir * S(3.2); d.vy = S(5.2);
    m.freeze = 16;
  } else if (h.kd || d.y > 0 || d.st === 'knock' || d.comboN >= KD_COMBO) {
    d.st = 'knock'; d.vx = dir * Math.max(h.kb, S(2.0)); d.vy = h.lift !== undefined ? h.lift : S(4.0);
    m.freeze = h.hstop;
  } else {
    d.st = 'hit'; d.stun = Math.max(8, h.hs - (d.comboN - 1)); d.vx = dir * h.kb;
    m.freeze = h.hstop;
  }
  ev(m, 'hit', { x: cx, y: cy, p: h.dmg >= 10 ? 2 : h.dmg >= 6 ? 1 : 0, kd: d.st !== 'hit', n: d.i, ko: lethal, dmg });
  pushAttacker(a, d, dir, h.kb);
  return 'hit';
}
function pushAttacker(a, d, dir, kb) {
  if (a.y > 0) return;
  if ((dir < 0 && d.x <= S(WALL_L + 3)) || (dir > 0 && d.x >= S(WALL_R - 3))) { a.x -= dir * S(1.6); clampX(a); }
}

/* ---------- 飛び道具 ---------- */
function burst(m, pr) {
  const g = pr.ground;
  pr.type = g.type; pr.w = g.w; pr.h = g.h; pr.vx = 0; pr.vy = 0; pr.grav = 0; pr.life = g.life;
  pr.y = g.h >> 1; pr.ground = null; pr.pierce = true; pr.hits = {}; pr.age = 0; pr.delay = 0;
  pr.hh = { dmg: g.dmg, hs: g.hs, bs: g.bs, kb: g.kb, kd: !!g.kd, lift: g.lift, hstop: g.hstop || 6 };
  ev(m, 'burst', { x: pr.x, y: pr.y });
}
function stepProjs(m) {
  const live = m.phase === 'fight';   // ラウンド終了後は当たらない（見た目だけ動く）
  for (const pr of m.projs) {
    if (pr.dead) continue;
    pr.age++;
    if (pr.delay > 0) {
      pr.delay--;
      if (pr.delay === 0 && (pr.type === 'bolt' || pr.type === 'pillar')) ev(m, 'snd', { n: pr.type, i: pr.own });
      continue;
    }
    if (--pr.life < 0) { pr.dead = true; continue; }
    pr.vx += pr.ax; pr.vy -= pr.grav; pr.x += pr.vx; pr.y += pr.vy;
    const hh = pr.h >> 1, hw = pr.w >> 1;
    if (pr.vy < 0 && pr.y - hh <= 0) {
      if (pr.bounce > 0) { pr.bounce--; pr.y = hh; pr.vy = Math.trunc((-pr.vy * 5) / 8); ev(m, 'bounce', { x: pr.x }); }
      else if (pr.ground) burst(m, pr);
      else { pr.dead = true; ev(m, 'pop', { x: pr.x, y: pr.y }); continue; }
    }
    if (pr.x < -S(30) || pr.x > S(SCREEN_W + 30)) { pr.dead = true; continue; }
    if (!live) continue;
    const pb = [pr.x - hw, pr.y - hh, pr.x + hw, pr.y + hh];
    const d = m.f[1 - pr.own];
    // 反射（ルートのリフレクト）
    if (d.st === 'atk') {
      const ep = fPhase(d);
      if (ep.reflect && ov(pb, fbox(d, ep.reflect.box))) {
        pr.own = d.i; pr.vx = -pr.vx; pr.ax = -pr.ax; pr.dir = -pr.dir; pr.hits = {}; pr.life = Math.max(pr.life, 40);
        ev(m, 'reflect', { x: pr.x, y: pr.y });
        continue;
      }
    }
    if (hittable(d)) {
      const ub = hurtBox(d);
      const last = pr.hits[d.i];
      if (ov(pb, ub) && (last === undefined || (pr.mh && pr.age - last >= pr.mh))) {
        pr.hits[d.i] = pr.age;
        applyHit(m, m.f[pr.own], d, pr.hh, pb, ub, pr);
        if (!pr.pierce) { pr.dead = true; ev(m, 'pop', { x: pr.x, y: pr.y }); }
      }
    }
  }
  // 飛び道具どうしの相殺
  const ps = m.projs;
  for (let i = 0; i < ps.length; i++) {
    const p = ps[i];
    if (p.dead || p.delay > 0 || p.pierce) continue;
    for (let j = i + 1; j < ps.length; j++) {
      const q = ps[j];
      if (q.dead || q.delay > 0 || q.pierce || q.own === p.own) continue;
      const pb = [p.x - (p.w >> 1), p.y - (p.h >> 1), p.x + (p.w >> 1), p.y + (p.h >> 1)];
      const qb = [q.x - (q.w >> 1), q.y - (q.h >> 1), q.x + (q.w >> 1), q.y + (q.h >> 1)];
      if (ov(pb, qb)) { p.dead = q.dead = true; ev(m, 'clash', { x: (p.x + q.x) >> 1, y: (p.y + q.y) >> 1 }); break; }
    }
  }
  m.projs = ps.filter((p) => !p.dead);
}

/* ---------- からだの押し合い ---------- */
function resolvePush(m) {
  const a = m.f[0], b = m.f[1];
  const solid = (f) => f.st !== 'down' && f.st !== 'wake' && f.st !== 'ko' && !(f.st === 'atk' && fPhase(f).hide);
  if (!solid(a) || !solid(b)) return;
  if (absI(a.y - b.y) >= S(28)) return;
  const pw = (CHARS[a.ch].stats.push + CHARS[b.ch].stats.push) >> 1;
  const dx = b.x - a.x, ad = absI(dx);
  if (ad >= pw) return;
  const dir = dx > 0 ? 1 : dx < 0 ? -1 : (a.face > 0 ? 1 : -1);
  const over = pw - ad, h1 = over >> 1, h2 = over - h1;
  a.x -= dir * h1; b.x += dir * h2;
  const ax = a.x, bx = b.x;
  clampX(a); clampX(b);
  const lostA = a.x - ax, lostB = b.x - bx;
  if (lostA !== 0) { b.x += dir * absI(lostA); clampX(b); }
  if (lostB !== 0) { a.x -= dir * absI(lostB); clampX(a); }
}

/* ---------- 1フレーム進める ---------- */
function stepMatch(m, in0, in1) {
  m.frame++;
  bufferInput(m.f[0], in0);
  bufferInput(m.f[1], in1);
  if (m.freeze > 0) { m.freeze--; return; }
  switch (m.phase) {
    case 'intro':
      m.pt++;
      m.f.forEach((f) => tickFighter(m, f));
      if (m.pt >= INTRO_FRAMES) {
        m.phase = 'fight'; m.pt = 0;
        m.f.forEach((f) => { f.bufA = 0; f.bufB = 0; });
        ev(m, 'fight');
      }
      break;
    case 'fight': stepFight(m); break;
    case 'end':
      m.pt++;
      m.f.forEach((f) => tickFighter(m, f));
      stepProjs(m);
      resolvePush(m);
      if (m.pt >= (m.endWhy === 'ko' ? END_KO_FRAMES : END_TIME_FRAMES)) finishRound(m);
      break;
    default: // over：勝負がつかなければ、少し見せてから次のラウンドへ（決定論のためシミュレーション側で進める）
      m.pt++;
      if (m.matchWinner < 0 && m.pt >= OVER_ROUND_FRAMES) nextRound(m);
      break;
  }
}

function stepFight(m) {
  const a = m.f[0], b = m.f[1];
  m.timer--;
  tickFighter(m, a);
  tickFighter(m, b);
  stepProjs(m);
  resolveHits(m);
  resolvePush(m);
  if (a.st === 'ko' || b.st === 'ko') endRound(m, 'ko');
  else if (m.timer <= 0) endRound(m, 'time');
}

function endRound(m, why) {
  const a = m.f[0], b = m.f[1];
  let w;
  if (why === 'ko') {
    const ka = a.st === 'ko', kb = b.st === 'ko';
    w = ka && kb ? rngInt(m.rng, 2) : ka ? 1 : 0;
  } else {
    const ra = a.hp * CHARS[b.ch].stats.hp, rb = b.hp * CHARS[a.ch].stats.hp; // HP割合の比較（整数の掛け算で）
    w = ra > rb ? 0 : rb > ra ? 1 : -1;
  }
  m.roundWinner = w; m.phase = 'end'; m.pt = 0; m.endWhy = why;
  ev(m, 'end', { why, w });
}
function finishRound(m) {
  const w = m.roundWinner;
  if (w >= 0) {
    m.wins[w]++;
    const wf = m.f[w];
    wf.st = 'win'; wf.t = 0; wf.vx = 0; wf.vy = 0; wf.y = 0; wf.mv = null;
    if (m.wins[w] >= m.cfg.rounds) m.matchWinner = w;
  } else m.draws++;
  m.phase = 'over'; m.pt = 0;
}
