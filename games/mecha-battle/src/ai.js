'use strict';
/* ============================================================
   ai.js — CPUの思考
   人間と同じ「入力ビット」を毎フレーム返すだけ。シミュレーションは区別しない。
   ============================================================ */
const AI_LEVELS = [
  { react: 0.10, dMin: 16, dMax: 26, spec: 0.55, aggr: 0.34, aa: 0.15, think: [20, 38] },
  { react: 0.28, dMin: 11, dMax: 19, spec: 0.85, aggr: 0.48, aa: 0.40, think: [14, 28] },
  { react: 0.48, dMin: 8, dMax: 14, spec: 1.0, aggr: 0.62, aa: 0.65, think: [10, 22] },
  { react: 0.68, dMin: 6, dMax: 10, spec: 1.2, aggr: 0.78, aa: 0.85, think: [7, 16] },
];

function newAI(level, seed) {
  return { lvl: clamp(level | 0, 0, AI_LEVELS.length - 1), rng: { s: (seed | 0) || 7 }, t: 0, cool: 0, plan: null, pulse: null, react: null };
}
const aiPct = (ai, p) => (rngNext(ai.rng) % 1000) < p * 1000;
const aiRange = (ai, lo, hi) => lo + (rngNext(ai.rng) % (hi - lo + 1));

function cmdParts(key, fwd) {
  switch (key) {
    case 's1': return [fwd, IN.A];
    case 's2': return [fwd, IN.B];
    case 's3': return [IN.DOWN, IN.A];
    case 's4': return [IN.DOWN, IN.B];
    case 'jab': case 'jA': return [0, IN.A];
    default: return [0, IN.B];
  }
}
function makePulse(key, fwd) {
  const [d, b] = cmdParts(key, fwd);
  return { f: [d, d, d | b, d], i: 0 };
}

/* 相手の攻撃が「あと何フレームで」「どこまで」届くか */
function aiThreat(op, dist) {
  if (op.st !== 'atk') return null;
  const mv = CHARS[op.ch].moves[op.mv];
  let frames = 0, travel = 0, reach = -1;
  for (let i = op.ph; i < mv.phases.length; i++) {
    const p = mv.phases[i];
    const rem = i === op.ph ? p.dur - op.pt : p.dur;
    if (p.vx) travel += Math.abs(p.vx) / SP * rem;
    if (p.hit) { reach = (p.hit.box[0] + p.hit.box[2]) / SP; if (p.hit.box[0] < 0) reach = Math.max(reach, -p.hit.box[0] / SP); break; }
    if (p.counter !== undefined) return null;
    frames += rem;
  }
  if (reach < 0) return null;
  return { frames, inRange: dist <= reach + 14 + travel };
}
function aiProjThreat(m, me) {
  for (const pr of m.projs) {
    if (pr.own === me.i || pr.dead || pr.vx === 0) continue;
    const dx = (me.x - pr.x) / SP;
    if (sgn(dx) !== sgn(pr.vx)) continue;
    if (Math.abs(dx) < 112 && Math.abs(dx) > 6 && pr.y < S(70)) return pr;
  }
  return null;
}

function aiChoose(ai, m, me, op, dist, fwd, back, L) {
  const C = CHARS[me.ch];
  const projT = aiProjThreat(m, me);
  const opAir = op.y > S(14);
  const cands = [];
  for (const key of MOVE_KEYS) {
    if (key === 'jA' || key === 'jB') continue;
    const mv = C.moves[key], a = mv.ai;
    if (!a || dist < a.r[0] || dist > a.r[1] || !canStart(m, me, key)) continue;
    let w = a.w;
    const special = key[0] === 's';
    if (a.k === 'aa') w = opAir ? w * 5 : w * 0.3;
    else if (a.k === 'reflect') w = projT ? 10 : 0;
    else if (a.k === 'counter') w = 1;
    else if (a.k === 'proj' && dist < 55) w *= 0.3;
    else if (a.k === 'escape') w = dist < 40 ? w * 1.5 : 0;
    if (special) w *= L.spec;
    if (w > 0) cands.push([key, w]);
  }
  const downOp = op.st === 'down' || op.st === 'wake';
  const pAtk = cands.length === 0 ? 0 : Math.min(0.95, L.aggr * (downOp ? 1.3 : 1) * (dist >= C.pref[0] - 8 && dist <= C.pref[1] + 20 ? 1.15 : 0.9));
  const until = ai.t + aiRange(ai, L.think[0], L.think[1]);

  if (cands.length && aiPct(ai, pAtk)) {
    let tot = 0;
    for (const c of cands) tot += c[1];
    let r = (rngNext(ai.rng) % 10000) / 10000 * tot;
    let key = cands[0][0];
    for (const c of cands) { if (r < c[1]) { key = c[0]; break; } r -= c[1]; }
    ai.pulse = makePulse(key, fwd);
    return { type: 'idle', until: ai.t + 6 };
  }
  // 空中戦が得意なキャラは、中距離から飛び込む
  if (C.airy && dist > 36 && dist < 120 && aiPct(ai, C.airy * L.aggr)) {
    ai.pulse = { f: [IN.UP | fwd, 0], i: 0 };
    return { type: 'idle', until: ai.t + 40 };
  }
  // 位置取り
  const nearWall = me.x < S(WALL_L + 14) || me.x > S(WALL_R - 14);
  if (nearWall && dist < 50 && L.aggr > 0.4 && aiPct(ai, 0.35)) {
    ai.pulse = { f: [IN.UP | fwd, 0], i: 0 };   // 壁際から飛び越える
    return { type: 'idle', until: ai.t + 40 };
  }
  if (dist > C.pref[1]) {
    if (dist > 110 && ai.lvl >= 1 && aiPct(ai, 0.12)) { ai.pulse = { f: [IN.UP | fwd, 0], i: 0 }; return { type: 'idle', until: ai.t + 36 }; }
    return { type: 'walk', rel: 'f', until };
  }
  if (dist < C.pref[0]) {
    return aiPct(ai, 0.55) ? { type: 'walk', rel: 'b', until } : { type: 'idle', until };
  }
  const r = rngNext(ai.rng) % 100;
  if (r < 40) return { type: 'idle', until };
  if (r < 50) return { type: 'guard', until };
  return { type: 'walk', rel: r < 78 ? 'f' : 'b', until: ai.t + aiRange(ai, 6, 14) };
}

/* 毎フレーム呼ぶ。入力ビットを返す。 */
function aiInput(ai, m, idx) {
  const me = m.f[idx], op = m.f[1 - idx];
  ai.t++;
  if (ai.cool > 0) ai.cool--;
  if (m.phase !== 'fight') { ai.pulse = null; ai.plan = null; ai.react = null; return 0; }
  const L = AI_LEVELS[ai.lvl];
  const dxs = op.x - me.x;
  const dist = Math.abs(dxs) / SP;
  const fwd = dxs >= 0 ? IN.RIGHT : IN.LEFT, back = dxs >= 0 ? IN.LEFT : IN.RIGHT;

  if (ai.pulse) {
    const mask = ai.pulse.f[ai.pulse.i++];
    if (ai.pulse.i >= ai.pulse.f.length) ai.pulse = null;
    return mask;
  }
  if (me.st === 'air') {
    if (!me.airAtk && dist < 66 && aiPct(ai, (0.06 + L.aa * 0.1) * (CHARS[me.ch].airy ? 3 : 1))) ai.pulse = { f: [aiPct(ai, 0.5) ? IN.A : IN.B], i: 0 };
    return 0;
  }
  if (me.st === 'block') return back;
  if (me.st !== 'idle' && me.st !== 'walk' && me.st !== 'crouch') return 0;

  const C = CHARS[me.ch];
  // --- 防御の反応 ---
  const thr = aiThreat(op, dist);
  const pr = aiProjThreat(m, me);
  if (!ai.react && ai.cool === 0 && (thr && thr.inRange || pr)) {
    ai.cool = 18;
    if (aiPct(ai, L.react)) {
      const counterKey = C.moves.s3.ai.k === 'counter' ? 's3' : null;
      if (thr && counterKey && thr.frames >= 6 && thr.frames <= 22 && aiPct(ai, 0.3)) {
        ai.pulse = makePulse('s3', fwd);
      } else if (thr && ai.lvl >= 2 && C.moves.s4.ai.k === 'warp' && aiPct(ai, 0.12)) {
        ai.pulse = makePulse('s4', fwd);
      } else if (pr && !thr && ai.lvl >= 1 && aiPct(ai, 0.35)) {
        ai.pulse = { f: [IN.UP | (aiPct(ai, 0.5) ? fwd : 0), 0], i: 0 };
      } else {
        const at = ai.t + aiRange(ai, L.dMin, L.dMax);
        ai.react = { at, until: at + 10 + (thr ? Math.min(thr.frames, 30) : 12) };
      }
      if (ai.pulse) { ai.plan = null; return 0; }
    }
  }
  if (ai.react) {
    if (ai.t >= ai.react.until) ai.react = null;
    else if (ai.t >= ai.react.at) return back;
  }
  // --- 攻め・位置取り ---
  if (!ai.plan || ai.t >= ai.plan.until) ai.plan = aiChoose(ai, m, me, op, dist, fwd, back, L);
  const p = ai.plan;
  if (p.type === 'walk') return p.rel === 'f' ? fwd : back;
  if (p.type === 'guard') return back;
  return 0;
}
