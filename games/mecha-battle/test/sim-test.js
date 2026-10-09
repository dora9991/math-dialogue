// ヘッドレス検証：Nodeでシミュレーションだけを動かす
const fs = require('fs'), vm = require('vm'), path = require('path');
const dir = path.join(__dirname, '..', 'src');
const code = ['core.js', 'chars.js', 'chars2.js', 'sim.js', 'ai.js'].map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');
const ctx = vm.createContext({ console });
vm.runInContext(code + '\nthis.API = { CHARS, createMatch, stepMatch, nextRound, newAI, aiInput, IN, S, SP, FPS, MOVE_KEYS, resetFighter, hurtBox, fPhase };', ctx);
const A = ctx.API;

const VALID_ST = new Set(['idle', 'walk', 'crouch', 'air', 'atk', 'hit', 'block', 'knock', 'down', 'wake', 'ko', 'win', 'intro']);
function check(m, tag) {
  for (const f of m.f) {
    for (const k of ['x', 'y', 'vx', 'vy', 'hp']) {
      if (!Number.isInteger(f[k])) throw new Error(`${tag}: f${f.i}.${k} not int: ${f[k]}`);
    }
    if (!VALID_ST.has(f.st)) throw new Error(`${tag}: bad state ${f.st}`);
    if (f.x < 0 || f.x > A.S(256)) throw new Error(`${tag}: x out of range ${f.x / 256}`);
    if (f.y < 0) throw new Error(`${tag}: y<0 ${f.y}`);
    if (f.hp < 0 || f.hp > A.CHARS[f.ch].stats.hp) throw new Error(`${tag}: hp ${f.hp}`);
    if (f.st === 'atk' && !f.mv) throw new Error(`${tag}: atk w/o move`);
  }
  if (m.projs.length > 12) throw new Error(`${tag}: too many projectiles ${m.projs.length}`);
}

function playMatch(a, b, seed, la, lb, stats) {
  const m = A.createMatch({ ch: [a, b], seed, rounds: 2, time: 60 });
  const ais = [A.newAI(la, seed * 2 + 1), A.newAI(lb, seed * 2 + 2)];
  let frames = 0, roundFrames = 0;
  const used = [{}, {}];
  while (frames < 60 * 60 * 6) {
    const i0 = A.aiInput(ais[0], m, 0), i1 = A.aiInput(ais[1], m, 1);
    m.events.length = 0;
    A.stepMatch(m, i0, i1);
    frames++; roundFrames++;
    for (const e of m.events) {
      if (e.t === 'hit') { stats.hits++; stats.dmg += e.dmg; }
      if (e.t === 'block') stats.blocks++;
      if (e.t === 'counter') stats.counters++;
      if (e.t === 'reflect') stats.reflects++;
      if (e.t === 'end') { stats[e.why]++; stats.rounds++; stats.roundFrames += roundFrames; roundFrames = 0; }
    }
    for (const f of m.f) if (f.st === 'atk' && f.pt === 0 && f.ph === 0) used[f.i][f.mv] = (used[f.i][f.mv] || 0) + 1;
    check(m, `m${a}v${b}s${seed}f${frames}`);
    if (m.phase === 'over') {
      if (m.matchWinner >= 0) break;
      A.nextRound(m);
    }
  }
  return { winner: m.matchWinner, frames, wins: m.wins.slice(), used };
}

const N = +process.argv[2] || 6;
const lv = +process.argv[3] || 2;
const names = A.CHARS.map((c) => c.en);
const NC = A.CHARS.length;
const win = Array.from({ length: NC }, () => Array(NC).fill(0));
const games = Array.from({ length: NC }, () => Array(NC).fill(0));
const totals = { hits: 0, dmg: 0, blocks: 0, counters: 0, reflects: 0, ko: 0, time: 0, rounds: 0, roundFrames: 0 };
const moveUse = Array.from({ length: NC }, () => ({}));
let unfinished = 0, matches = 0;
const t0 = Date.now();
for (let a = 0; a < NC; a++) for (let b = 0; b < NC; b++) for (let s = 1; s <= N; s++) {
  const r = playMatch(a, b, s * 7919 + a * 31 + b, lv, lv, totals);
  matches++;
  if (r.winner < 0) { unfinished++; continue; }
  games[a][b]++; games[b][a]++;
  if (r.winner === 0) win[a][b]++; else win[b][a]++;
  for (const k in r.used[0]) moveUse[a][k] = (moveUse[a][k] || 0) + r.used[0][k];
  for (const k in r.used[1]) moveUse[b][k] = (moveUse[b][k] || 0) + r.used[1][k];
}
console.log(`matches=${matches} unfinished=${unfinished} time=${Date.now() - t0}ms  level=${lv}`);
console.log(`avg round = ${(totals.roundFrames / totals.rounds / 60).toFixed(1)}s  KO=${totals.ko} TIME=${totals.time}  hits=${totals.hits} blocks=${totals.blocks} counters=${totals.counters} reflects=${totals.reflects} avgdmg=${(totals.dmg / totals.hits).toFixed(1)}`);
console.log('勝率（行が列に勝つ割合）');
console.log('         ' + names.map((n) => n.slice(0, 4).padEnd(5)).join(''));
for (let a = 0; a < NC; a++) {
  let row = names[a].padEnd(9);
  let w = 0, g = 0;
  for (let b = 0; b < NC; b++) {
    if (a === b) { row += '  -  '; continue; }
    row += (games[a][b] ? Math.round((100 * win[a][b]) / games[a][b]) : 0).toString().padStart(3) + '  ';
    w += win[a][b]; g += games[a][b];
  }
  console.log(row + '  total ' + Math.round((100 * w) / g) + '%');
}
console.log('技の使用回数（開始数）');
for (let a = 0; a < NC; a++) console.log(names[a].padEnd(8) + A.MOVE_KEYS.map((k) => `${k}:${moveUse[a][k] || 0}`).join(' '));
