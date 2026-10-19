// 3段の判定（入った／たぶん入った／外れ）を、合成映像の正解と比べる（検証・調整用）
//   node basket-clips/tests/tier-check.cjs <動画.mp4> [記録の保存先.json]
//   node basket-clips/tests/tier-check.cjs --from <記録.json...>     保存した記録から、判定だけをやり直す（動画を読み直さない。数秒）
//   動画は tests/tools/make-video.cjs で作ったもの（正解は 動画.mp4.json）。ゴールの指定は正解の marks を使う。ffmpeg が必要。
//   ・3段：正解の得点・外れが、それぞれ「入った」「たぶん入った」「外れ」「見つからない」のどれになったか、正解にない検出がどれになったか
//   ・ボールが見えなかったら：判定が何も出さなかったとしても、ネットの揺れだけで得点を「たぶん入った」に拾えるか
//   環境変数 NET に JSON を渡すと、ネットの揺れのしきい値（auto.js の NE）を上書きして試せる（例：NET='{"peak":0.3}'）。VERB=1 で詳しく
const fs = require('fs');
const path = require('path');
const { run, loadBS } = require('./node-run.cjs');

const A = loadBS(['core.js', 'vision.js', 'auto.js']).auto;
const OPTS = process.env.NET ? JSON.parse(process.env.NET) : undefined;
const VERB = process.env.VERB === '1';
const RANK = { made: 3, maybe: 2, miss: 1 };

/* 正解のシュートごとに、いちばん合う検出を割り当てる（放ってから −0.3〜+3.0 秒・同じゴール）。得点の正解には「入った」寄りを、外れには「外れ」寄りを */
function judge(D) {
  const shots = D.shots.map((s) => Object.assign({}, s, { tier: undefined, why: undefined }));
  A.classify(shots, D.series, OPTS);
  const used = new Set();
  const res = { mk: { made: 0, maybe: 0, miss: 0, none: 0 }, ms: { made: 0, maybe: 0, miss: 0, none: 0 }, ex: { made: 0, maybe: 0, miss: 0 } };
  const lines = [];
  D.truth.forEach((s) => {
    const c = shots.map((d, i) => ({ d, i })).filter((x) => !used.has(x.i) && x.d.hoop === s.side && x.d.t >= s.t - 0.3 && x.d.t <= s.t + 3.0);
    c.sort((a, b) => (s.made ? RANK[b.d.tier] - RANK[a.d.tier] : RANK[a.d.tier] - RANK[b.d.tier]));
    c.forEach((x) => used.add(x.i));      // 同じシュートに当たったほかの検出（リングで弾んだ間の外れなど）も使ったことに
    const k = c[0] ? c[0].d.tier : 'none';
    res[s.made ? 'mk' : 'ms'][k]++;
    if (VERB && (s.made ? k !== 'made' : k === 'made' || k === 'maybe')) lines.push(`  ${s.made ? '得点' : '外れ'} ${s.t.toFixed(1)} ${'AB'[s.side]} ${s.rim || ''} → ${k}${c[0] && c[0].d.why ? '（' + c[0].d.why + '）' : ''}`);
  });
  shots.forEach((d, i) => { if (!used.has(i)) { res.ex[d.tier]++; if (VERB && d.tier !== 'miss') lines.push(`  正解にない ${d.t.toFixed(1)} ${'AB'[d.hoop]} → ${d.tier}（${d.why}）`); } });
  // ボールが見えなかったら（判定が何も出さなかったら）
  const none = [];
  A.classify(none, D.series, OPTS);
  const hit = (s) => none.some((d) => d.hoop === s.side && d.t >= s.t - 0.3 && d.t <= s.t + 3.0);
  const blind = { made: D.truth.filter((s) => s.made && hit(s)).length, miss: D.truth.filter((s) => !s.made && hit(s)).length, extra: none.filter((d) => !D.truth.some((s) => s.side === d.hoop && d.t >= s.t - 0.3 && d.t <= s.t + 3.0)).length };
  return { res, lines, blind, n: { made: D.truth.filter((s) => s.made).length, miss: D.truth.filter((s) => !s.made).length } };
}
function print(name, r) {
  const { res } = r;
  console.log(`■ ${name}`);
  console.log(`  得点 ${r.n.made} 本 → 入った ${res.mk.made}・たぶん入った ${res.mk.maybe}・外れ ${res.mk.miss}・見つからない ${res.mk.none}`);
  console.log(`  外れ ${r.n.miss} 本 → 入った ${res.ms.made}・たぶん入った ${res.ms.maybe}・外れ ${res.ms.miss}・見つからない ${res.ms.none}`);
  console.log(`  正解にない検出 → 入った ${res.ex.made}・たぶん入った ${res.ex.maybe}・外れ ${res.ex.miss}`);
  console.log(`  ボールが見えなかったら：ネットの揺れだけで、得点 ${r.n.made} 本のうち ${r.blind.made} 本を「たぶん入った」に（外れ ${r.blind.miss}・シュートでない所 ${r.blind.extra}）`);
  r.lines.forEach((l) => console.log(l));
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args[0] === '--from') {
    for (const f of args.slice(1)) print(path.basename(f), judge(JSON.parse(fs.readFileSync(f, 'utf8'))));
  } else {
    const movie = path.resolve(args[0]);
    const truth = JSON.parse(fs.readFileSync(movie + '.json', 'utf8'));
    // 解析そのものは3段に分けずに（tiers: false）、判定の結果とネットの揺れの記録を取り出してから、ここで分ける
    run(movie, 0, truth.duration, { cfg: { tiers: false } }).then(({ res, an }) => {
      const D = { shots: res.shots.map((s) => Object.assign({}, s)), series: an.netSeries, truth: truth.shots };
      if (args[1]) fs.writeFileSync(args[1], JSON.stringify(D));
      print(path.basename(movie), judge(D));
    }).catch((e) => { console.error(e); process.exit(1); });
  }
}
module.exports = { judge };
