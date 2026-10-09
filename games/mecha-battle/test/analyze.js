// バランス調整用：1体を、ほかの全員とCPU同士で戦わせて、技ごとの「出した回数・当たった回数・与えたダメージ」を数える
//   node test/analyze.js <キャラ番号 or キー> [1組あたりの試合数=6] [CPUレベル=2]
const fs = require('fs'), vm = require('vm'), path = require('path');
const dir = path.join(__dirname, '..', 'src');
const code = ['core.js', 'chars.js', 'chars2.js', 'sim.js', 'ai.js'].map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');
const ctx = vm.createContext({ console });
vm.runInContext(code + `
const __stat = {};
const __orig = applyHit;
applyHit = function (m, a, d, h, hb, ub, pr) {
  const hp0 = d.hp, r = __orig(m, a, d, h, hb, ub, pr);
  const key = a.ch + ':' + (pr ? 'P:' + pr.type : (a.mv || '?'));
  const s = __stat[key] || (__stat[key] = { hit: 0, block: 0, counter: 0, dmg: 0 });
  if (r === 'hit') { s.hit++; s.dmg += hp0 - d.hp; } else if (r === 'block') s.block++; else if (r === 'counter') s.counter++;
  return r;
};
this.API = { CHARS, createMatch, stepMatch, nextRound, newAI, aiInput, __stat };`, ctx);
const A = ctx.API;
const arg = process.argv[2];
const me = /^\d+$/.test(arg) ? +arg : A.CHARS.findIndex((c) => c.key === arg);
const N = +process.argv[3] || 6, lv = +process.argv[4] || 2;
if (me < 0) { console.log('キャラが見つかりません'); process.exit(1); }

const starts = {}, wins = { w: 0, g: 0 };
for (let o = 0; o < A.CHARS.length; o++) {
  if (o === me) continue;
  for (let s = 1; s <= N; s++) {
    const side = s & 1;                       // 1P側・2P側を半々に
    const ch = side ? [o, me] : [me, o];
    const m = A.createMatch({ ch, seed: s * 7919 + o * 31, rounds: 2, time: 60 });
    const ais = [A.newAI(lv, s * 3 + 1), A.newAI(lv, s * 3 + 2)];
    for (let f = 0; f < 60 * 60 * 5 && m.matchWinner < 0; f++) {
      const i0 = A.aiInput(ais[0], m, 0), i1 = A.aiInput(ais[1], m, 1);
      m.events.length = 0; A.stepMatch(m, i0, i1);
      const f0 = m.f[side ? 1 : 0];
      if (f0.st === 'atk' && f0.pt === 0 && f0.ph === 0) starts[f0.mv] = (starts[f0.mv] || 0) + 1;
      if (m.phase === 'over' && m.matchWinner < 0) A.nextRound(m);
    }
    wins.g++; if (m.matchWinner === (side ? 1 : 0)) wins.w++;
  }
}
const C = A.CHARS[me];
console.log(`${C.en}  勝率 ${Math.round(100 * wins.w / wins.g)}%  (${wins.w}/${wins.g}, CPUレベル${lv})`);
console.log('技                    出した  当たった  ガード  ダメージ合計  1回あたり');
for (const key of Object.keys(C.moves)) {
  const mv = C.moves[key];
  const rows = Object.keys(A.__stat).filter((k) => k.startsWith(me + ':') && (k === me + ':' + key || (k.startsWith(me + ':P:') && false)));
  const s = A.__stat[me + ':' + key] || { hit: 0, block: 0, counter: 0, dmg: 0 };
  console.log((key + ' ' + mv.name).padEnd(22) + String(starts[key] || 0).padStart(6) + String(s.hit).padStart(9) + String(s.block).padStart(8) + String(s.dmg).padStart(12) + ((s.hit ? s.dmg / s.hit : 0).toFixed(1)).padStart(10));
}
const proj = Object.keys(A.__stat).filter((k) => k.startsWith(me + ':P:'));
for (const k of proj) { const s = A.__stat[k]; console.log(('飛び道具 ' + k.slice(me.toString().length + 3)).padEnd(22) + ''.padStart(6) + String(s.hit).padStart(9) + String(s.block).padStart(8) + String(s.dmg).padStart(12) + ((s.hit ? s.dmg / s.hit : 0).toFixed(1)).padStart(10)); }
