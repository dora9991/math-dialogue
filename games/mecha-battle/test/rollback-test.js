// ロールバック同期のテスト：遅延・ゆらぎ・パケット落ち・クロックのずれがあっても、2人の結果が一致するか
const fs = require('fs'), vm = require('vm'), path = require('path');
const code = ['core.js', 'chars.js', 'chars2.js', 'sim.js', 'ai.js', 'rollback.js'].map((f) => fs.readFileSync(path.join(__dirname, '..', 'src', f), 'utf8')).join('\n');
const ctx = vm.createContext({ console });
vm.runInContext(code + '\nthis.API = { CHARS, createMatch, stepMatch, newAI, aiInput, RollbackSession, hashStr, IN };', ctx);
const A = ctx.API;

function lcg(seed) { let s = seed >>> 0; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); }

function runScenario(name, o) {
  const rnd = lcg(o.seed || 1);
  const cfg = { ch: [o.c0 || 2, o.c1 || 6], seed: 77, rounds: 2, time: 60 };
  const peers = [new A.RollbackSession(cfg, 0, { delay: o.delay }), new A.RollbackSession(cfg, 1, { delay: o.delay })];
  const ais = [A.newAI(3, 11), A.newAI(3, 22)];
  const inbox = [[], []];            // 各ピアに届くパケット（deliverAt付き）
  const sumsRecv = [[], []];
  const TICKS = o.ticks || 2400;
  const startAt = [0, o.lateStart || 0];
  const slow = [0, o.slowEvery || 0];  // N tickに1回、そのピアは1tick休む（クロックが遅い）
  let stallTicks = [0, 0];
  for (let t = 0; t < TICKS; t++) {
    for (let p = 0; p < 2; p++) {
      const me = peers[p], peer = 1 - p;
      // 届いたパケットを処理
      const due = inbox[p].filter((x) => x.at <= t);
      inbox[p] = inbox[p].filter((x) => x.at > t);
      due.sort((a, b) => (o.reorder ? a.at - b.at : a.seq - b.seq));
      for (const x of due) { if (x.pkt.t === 'in') me.receive(x.pkt); else me.receiveSum(x.pkt.f, x.pkt.h); }
      if (t < startAt[p]) continue;
      if (slow[p] && t % slow[p] === 0) continue;
      const mask = A.aiInput(ais[p], me.m, p);
      const r = me.tick(mask);
      if (r.stalled) stallTicks[p]++;
      // 送信（毎tick。遅延・ゆらぎ・落ちを加える）
      const send = (pkt) => {
        if (rnd() < (o.loss || 0)) return;
        const lat = o.latency + Math.floor(rnd() * ((o.jitter || 0) + 1));
        inbox[peer].push({ at: t + lat, pkt, seq: t * 10 + (pkt.t === 'in' ? 0 : 1) });
      };
      send(me.packet());
      for (const s of me.takeSums()) send(s);
    }
  }
  // 参照：両者の「実際に使われた入力」で、1台のマシンで素直に回した結果
  const ref = A.createMatch(cfg);
  const maxF = Math.min(peers[0].verified, peers[1].verified) - 1;
  const refHash = new Map();
  for (let f = 0; f <= maxF; f++) {
    ref.events.length = 0;
    if (f > 0 && f % 60 === 0) refHash.set(f, A.hashStr(JSON.stringify(ref)));
    const i0 = peers[0].localIn[f], i1 = peers[1].localIn[f];
    A.stepMatch(ref, i0, i1);
  }
  let hashOk = 0, hashBad = 0;
  for (const [f, h] of refHash) {
    for (const p of peers) if (p.myHash.has(f)) { if (p.myHash.get(f) === h) hashOk++; else hashBad++; }
  }
  const adv = peers.map((p) => p.frame);
  const problems = [];
  if (peers.some((p) => p.desync >= 0)) problems.push('desync検出 ' + peers.map((p) => p.desync));
  if (hashBad) problems.push('参照と不一致 ' + hashBad);
  if (hashOk < 5) problems.push('比較できたハッシュが少ない ' + hashOk);
  const minAdv = Math.min(...adv);
  if (minAdv < (o.ticks || 2400) * (o.minProgress || 0.6)) problems.push('進みが遅すぎる ' + adv);
  console.log((problems.length ? '  FAIL ' : '  ok   ') + name.padEnd(46) + ` 進行=${adv} ロールバック=${peers.map((p) => p.stats.rollbacks)} 最大深さ=${peers.map((p) => p.stats.maxDepth)} 待ち=${stallTicks} hash一致=${hashOk}` + (problems.length ? '  → ' + problems.join(' / ') : ''));
  return problems.length === 0;
}

let ok = true;
const sc = [
  ['遅延0', { latency: 0, delay: 2 }],
  ['片道1tick', { latency: 1 }],
  ['片道3tick(50ms)', { latency: 3 }],
  ['片道6tick(100ms)', { latency: 6, minProgress: 0.5 }],
  ['片道3 + ゆらぎ±3', { latency: 3, jitter: 3 }],
  ['片道3 + ゆらぎ + 並べ替え', { latency: 3, jitter: 4, reorder: true }],
  ['片道3 + パケット落ち10%', { latency: 3, loss: 0.1 }],
  ['片道4 + 落ち20% + ゆらぎ', { latency: 4, loss: 0.2, jitter: 3 }],
  ['片道3 + 片方が20tick遅れて開始', { latency: 3, lateStart: 20 }],
  ['片道3 + 片方のクロックが2%遅い', { latency: 3, slowEvery: 50 }],
  ['片道3 + 片方のクロックが5%遅い', { latency: 3, slowEvery: 20 }],
  ['入力遅延0フレーム', { latency: 3, delay: 0 }],
  ['入力遅延4フレーム', { latency: 3, delay: 4 }],
  ['別キャラ組み合わせ(ライゴウ×ルート)', { latency: 3, jitter: 2, c0: 6, c1: 4 }],
  ['別キャラ組み合わせ(バルーナ×ガンジョウ)', { latency: 4, jitter: 2, c0: 3, c1: 1, seed: 9 }],
];
for (const [name, o] of sc) { for (const seed of [1, 2]) ok = runScenario(name + ' s' + seed, Object.assign({ seed }, o)) && ok; }
console.log(ok ? '\nALL PASSED' : '\nFAILED');
process.exit(ok ? 0 : 1);
