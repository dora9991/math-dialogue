// 解析のログ（tests/rim-check.cjs が保存した、コマごとのボール候補）を、シュートの判定（auto.js の createShotDetector）にかけ直す（検証・調整用）
//   node basket-clips/tests/rim-replay.cjs <ログ.json> <動画.mp4> [見る時刻 前後の秒]
//   動画を読み直さずに、判定のしかただけを数秒で試せる。3つ目を渡すと、その時刻のまわりのコマを1つずつ表示する（例：70.6 1.5）。
//   ※ ゴールの追跡やボール候補の取り出し（判定より前の段階）を変えたときは、ログを取り直す（rim-check.cjs）。
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { judge, print } = require('./rim-check.cjs');

function load(files) {
  const ctx = { console, Math, Date, JSON };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  for (const f of files) vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8'), ctx, { filename: f });
  return ctx.BS;
}
function replay(BS, data, opts) {
  const det = [0, 1].map((i) => BS.auto.createShotDetector(i, opts));
  const last = [-1, -1], all = [];
  const toCand = (c) => ({ x: c[0], y: c[1], area: c[2], r: c[3], g: c[4], b: c[5], fill: c[6], still: c[7] });
  for (const e of data.log) {
    const d = det[e.h];
    if (last[e.h] >= 0 && e.t - last[e.h] > 0.6) d.flush();
    last[e.h] = e.t;
    d.push(e.t, e.c.map(toCand), e.net, e.no);
    for (const ev of d.take()) all.push(Object.assign(ev, { hoop: data.idx ? data.idx[e.h] : e.h }));
  }
  det.forEach((d, i) => { d.flush(); for (const ev of d.take()) all.push(Object.assign(ev, { hoop: data.idx ? data.idx[i] : i })); });
  return all.sort((a, b) => a.t - b.t);
}
module.exports = { load, replay };

if (require.main === module) {
  const data = JSON.parse(fs.readFileSync(path.resolve(process.argv[2]), 'utf8'));
  const truth = JSON.parse(fs.readFileSync(path.resolve(process.argv[3]) + '.json', 'utf8'));
  const BS = load(['core.js', 'vision.js', 'auto.js']);
  const at = process.argv[4] != null ? Number(process.argv[4]) : null;
  if (at != null) {
    const w = Number(process.argv[5] || 1.5);
    let prev = null;
    data.log.filter((e) => e.t >= at - w && e.t <= at + w).forEach((e) => {
      const gap = prev && prev.h === e.h && e.t - prev.t > 0.09 ? `  （${(e.t - prev.t).toFixed(2)}秒あき）` : '';
      const balls = e.c.filter((c) => BS.auto.ballLike({ x: c[0], y: c[1], area: c[2], r: c[3], g: c[4], b: c[5], fill: c[6], still: c[7] }));
      console.log(`${e.t.toFixed(2)} h${e.h} 板${e.sc} 輪${e.rs == null ? '-' : e.rs} net${e.net.toFixed(2)}/${e.no.toFixed(2)} 候補${e.c.length} ボール[${balls.map((c) => `${c[0]},${c[1]} a${c[2]}`).join(' ')}]${gap}`);
      prev = e;
    });
    process.exit(0);
  }
  const shots = replay(BS, data);
  const res = judge(shots, truth);
  res.rows.filter((r) => r.s.rim || !r.d || r.d.made !== r.s.made).forEach((r) => console.log(`  ${r.s.t.toFixed(1).padStart(6)} ${r.s.made ? '入る' : '外れ'} ${(r.s.rim || (r.s.type === 'ft' ? 'FT' : 'きれい')).padEnd(9)} → ${r.d ? `${r.d.t.toFixed(1)} ${r.d.made ? '得点' : '外れ'}${r.d.sure === false ? '（要確認）' : ''}${r.d.made ? ` 速さ${r.d.speed} x${r.d.xin} net${r.d.net}/${r.d.netOnly}${r.d.born ? ' 下から' : ''}` : ''}` : '★見つからない'}`));
  if (res.extra.length) console.log('  正解にない検出：' + res.extra.map((d) => `${d.t.toFixed(1)}${d.made ? '得点' : '外れ'}`).join(' '));
  print(res, `判定をかけ直した結果（${path.basename(process.argv[2])}）`);
}
