// バランスの目安：全員 vs 全員をCPU同士で戦わせて、キャラごとの勝率だけを出す（人間とCPUでは動きがちがうので、あくまで目安）
//   node test/balance.js [1組あたりの試合数=8] [CPUレベル=2]
const fs = require('fs'), vm = require('vm'), path = require('path');
const dir = path.join(__dirname, '..', 'src');
const code = ['core.js', 'chars.js', 'chars2.js', 'sim.js', 'ai.js'].map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');
const ctx = vm.createContext({ console });
vm.runInContext(code + '\nthis.API = { CHARS, createMatch, stepMatch, nextRound, newAI, aiInput };', ctx);
const A = ctx.API, NC = A.CHARS.length, N = +process.argv[2] || 8, lv = +process.argv[3] || 2;
const win = Array(NC).fill(0), games = Array(NC).fill(0), time = Array(NC).fill(0);
for (let a = 0; a < NC; a++) for (let b = a + 1; b < NC; b++) for (let s = 1; s <= N; s++) {
  const flip = s & 1, ch = flip ? [b, a] : [a, b];
  const m = A.createMatch({ ch, seed: s * 104729 + a * 131 + b * 7, rounds: 2, time: 60 });
  const ais = [A.newAI(lv, s * 3 + 1), A.newAI(lv, s * 3 + 2)];
  for (let f = 0; f < 60 * 60 * 5 && m.matchWinner < 0; f++) {
    m.events.length = 0; A.stepMatch(m, A.aiInput(ais[0], m, 0), A.aiInput(ais[1], m, 1));
    if (m.phase === 'over' && m.matchWinner < 0) A.nextRound(m);
  }
  games[a]++; games[b]++;
  if (m.matchWinner >= 0) win[ch[m.matchWinner]]++;
}
const rows = A.CHARS.map((c, i) => ({ en: c.en, p: Math.round(100 * win[i] / games[i]) }));
console.log(rows.map((r) => `${r.en.padEnd(9)}${String(r.p).padStart(3)}% ${'#'.repeat(Math.round(r.p / 4))}`).join('\n'));
