// 水泳の回帰テスト（node sports-tap/tests/unit-swim.cjs）
// 画面を持たない部分（タッチの回数・組・スプリットとラップ・順位・失格・練習（サークル）・総合順位・CSV・書き出しと読み込み）を確かめる。
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function load() {
  const ctx = { console, Math, Date, JSON };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  ['js/core.js', 'js/sp/swim.js'].forEach((f) => vm.runInContext(fs.readFileSync(path.join(__dirname, '..', f), 'utf8'), ctx, { filename: f }));
  return ctx.ST;
}
let pass = 0, fail = 0;
const ok = (c, name, extra) => { if (c) { pass++; console.log('  ok  ', name); } else { fail++; console.log('  FAIL', name, extra !== undefined ? JSON.stringify(extra) : ''); } };
const eq = (a, b, name) => ok(JSON.stringify(a) === JSON.stringify(b), name, { got: a, want: b });
const section = (t) => console.log('\n■ ' + t);
const ST = load();
const sp = ST.SPORTS.swim;
const T0 = Date.UTC(2026, 9, 19, 6, 30, 0);

section('種目の登録・タッチの回数');
ok(sp && sp.family === 'swim' && sp.prec === 100 && sp.hasTeams === false, '水泳：family swim・0.01 秒・チームなし');
eq([sp.touchesOf({ dist: 50, pool: 25 }), sp.touchesOf({ dist: 100, pool: 25 }), sp.touchesOf({ dist: 25, pool: 50 }), sp.touchesOf({ dist: 1500, pool: 50 })], [2, 4, 1, 30], '距離 ÷ プール（25m をプール 50m なら1回）');
eq(sp.specText({ mode: 'race', stroke: 'br', dist: 100, pool: 25 }), '平泳ぎ 100m', '種目の呼び名');
eq(sp.specText({ mode: 'circle', dist: 50, reps: 8, cycle: 60, gap: 5 }), '練習 50m×8（1:00・5秒おき）', '練習の呼び名');
eq(ST.fmtRace(62.35), '1:02.35', 'タイムの見せ方 1:02.35');
eq(ST.fmtRace(9.5), '9.50', '1分未満は 9.50');
eq(sp.cleanLanes([{ name: ' たけし ' }], 3).map((x) => [x.lane, x.name]), [[1, 'たけし'], [2, ''], [3, '']], 'レーンを n 本にそろえる');

section('試合（計測）を作ってスタート');
const D = { opts: ST.cleanOpts(sp, { dist: 50, pool: 25, lanes: 4 }), lanes: sp.cleanLanes([{ name: 'たけし', team: '致遠館' }, { name: 'はなこ' }, { name: 'じろう' }], 10) };
const g = ST.newGame({ sport: 'swim', now: T0, tz: 540, opts: D.opts });
sp.fromDraft(g, D);
ok(g.prec === 100 && g.pending && g.pending.heat === 1 && g.pending.lanes.length === 4, '準備：1組目を待つ（4レーン）');
g.startedAt = T0;
sp.onStart(g);
const hs = sp.heats(g);
ok(hs.length === 1 && hs[0].start === 0 && hs[0].lanes[0].name === 'たけし' && hs[0].spec.dist === 50, 'スタート：1組目の始まり（t=0・名前・距離）');
ok(!sp.waiting(g), 'スタートしたら、待っていない');
eq(ST.elapsed(g, T0 + 12345), 12.35, '経過は 0.01 秒まで（12.345 → 12.35）');
eq(ST.elapsed(g, T0 + 12344), 12.34, '12.344 → 12.34');

section('タッチ・スプリット・ラップ・順位');
const touch = (t, lane) => ST.addEvent(g, { t, type: 'touch', lane });
touch(16.8, 1); touch(17.05, 2); touch(34.21, 1); touch(35.9, 2); touch(18.2, 3);
let rs = sp.raceResults(g, sp.heats(g)[0]);
const r1 = rs.find((x) => x.lane === 1), r2 = rs.find((x) => x.lane === 2), r3 = rs.find((x) => x.lane === 3), r4 = rs.find((x) => x.lane === 4);
eq(r1.splits, [16.8, 34.21], 'レーン1のスプリット');
eq(r1.laps, [16.8, 17.41], 'レーン1のラップ（34.21 − 16.80 = 17.41）');
ok(r1.done && r1.time === 34.21 && r1.rank === 1, 'レーン1：ゴール 34.21・1位');
ok(r2.done && r2.time === 35.9 && r2.rank === 2, 'レーン2：ゴール 35.90・2位');
ok(!r3.done && r3.splits.length === 1 && r3.rank == null, 'レーン3：まだ途中（1/2）');
ok(!r4.done && !r4.splits.length, 'レーン4：まだタッチなし');
ok(g.events.find((e) => e.type === 'touch').team === undefined, 'タッチはチームを持たない（noTeam）');
let info = sp.touchInfo(g, g.events.find((e) => e.type === 'touch' && e.lane === 1 && e.t === 34.21));
ok(info.goal && info.rank === 1 && info.idx === 2 && info.need === 2, 'タッチの中身：2/2・ゴール・1位');
eq(sp.touchText(info), 'ゴール 34.21（1位）', 'ゴールの呼び名');
eq(sp.touchText(sp.touchInfo(g, g.events.find((e) => e.lane === 1))), '1/2 16.80（ラップ 16.80）', '途中のタッチの呼び名');
ok(!sp.heatDone(g, sp.heats(g)[0]), 'まだ全員は終わっていない');
// 同じ時間（0.005 秒より近い）は同じ順位
touch(35.9, 3);
rs = sp.raceResults(g, sp.heats(g)[0]);
ok(rs.find((x) => x.lane === 3).rank === 2 && rs.find((x) => x.lane === 2).rank === 2, '同じタイムは同じ順位');
// 失格
const dq = ST.addEvent(g, { t: 40, type: 'dq', lane: 2, heat: 1 });
rs = sp.raceResults(g, sp.heats(g)[0]);
ok(rs.find((x) => x.lane === 2).flag === 'dq' && rs.find((x) => x.lane === 2).rank == null && rs.find((x) => x.lane === 3).rank === 2, '失格：順位から外す（レーン3が2位に）');
ST.addEvent(g, { t: 41, type: 'dns', lane: 4, heat: 1 });
ok(sp.heatDone(g, sp.heats(g)[0]), '全員がゴールか失格・欠場 → 組が終わった');
// 多すぎるタッチ
const extra = touch(50, 1);
ok(sp.touchInfo(g, extra).extra && sp.raceResults(g, sp.heats(g)[0]).find((x) => x.lane === 1).time === 34.21, 'ゴールのあとのタッチは「多い」（タイムは変わらない）');
ST.removeEvent(g, extra.id);

section('次の組（ちがう種目でも）');
g.pending = { heat: 2, lanes: sp.cleanLanes([{ name: 'さぶろう' }], 2), spec: sp.specOf(ST.cleanOpts(sp, { stroke: 'br', dist: 100, pool: 25 })) };
ok(sp.waiting(g), '次の組の準備ができて、スタートを待つ');
ST.addEvent(g, Object.assign({ t: 120, type: 'heat', heat: 2, lanes: g.pending.lanes }, g.pending.spec));
ok(!sp.waiting(g) && sp.heats(g).length === 2, '2組目スタート');
touch(150, 1); touch(181.5, 1); touch(215, 1); touch(248.77, 1);
const h2 = sp.heats(g)[1];
const x2 = sp.raceResults(g, h2).find((x) => x.lane === 1);
ok(x2.done && x2.time === 128.77 && x2.need === 4 && x2.name === 'さぶろう', '2組目：100m（タッチ4回）・タイムは組のスタートから（248.77 − 120 = 2:08.77）');
eq(ST.fmtRace(x2.time), '2:08.77', '2:08.77');
ok(sp.raceResults(g, sp.heats(g)[0]).find((x) => x.lane === 1).time === 34.21, '1組目のタイムは変わらない');
ok(sp.heatAt(g, 119.99).heat === 1 && sp.heatAt(g, 120).heat === 2, '時刻で、どの組かが決まる');
eq(sp.timeText(g, g.events.find((e) => e.t === 248.77)), '2組 2:08.77', '一覧の時刻：「2組 2:08.77」');
ok(/2組目 スタート（平泳ぎ 100m）/.test(sp.eventText(g, g.events.find((e) => e.type === 'heat' && e.heat === 2))), '組のスタートの呼び名');
eq(sp.lastText(g, g.events.find((e) => e.t === 248.77)), 'L1 ゴール（1位）', '下の帯の呼び名（時刻は左に出るので、何回目と順位だけ）');
// 組の始まりの時刻を直すと、タイムが全部変わる
g.events.find((e) => e.type === 'heat' && e.heat === 2).t = 119.5;
ok(sp.raceResults(g, sp.heats(g)[1]).find((x) => x.lane === 1).time === 129.27, '組のスタートの時刻を直すと、タイムも変わる');
g.events.find((e) => e.type === 'heat' && e.heat === 2).t = 120;

section('総合順位（同じ種目の組をまとめる）');
g.pending = { heat: 3, lanes: sp.cleanLanes([{ name: 'しろう' }, { name: 'ごろう' }], 2), spec: sp.specOf(ST.cleanOpts(sp, { stroke: 'fr', dist: 50, pool: 25 })) };
ST.addEvent(g, Object.assign({ t: 300, type: 'heat', heat: 3, lanes: g.pending.lanes }, g.pending.spec));
touch(316, 1); touch(333.5, 1); touch(317, 2); touch(336, 2);
const ov = sp.overall(g);
const fr = ov.find((x) => x.key === 'fr:50:25');
ok(fr && fr.heats === 2 && fr.rows.length === 4, '自由形 50m：1組目と3組目をまとめる（失格は入れない）');
eq(fr.rows.map((x) => [x.name, x.time, x.rank]), [['しろう', 33.5, 1], ['たけし', 34.21, 2], ['じろう', 35.9, 3], ['ごろう', 36, 4]], '総合順位');
ok(ov.find((x) => x.key === 'br:100:25').rows.length === 1, '平泳ぎ 100m は別');
ok(/自由形 50m・平泳ぎ 100m・3組・/.test(sp.scoreText(g)), '一覧の短い説明：' + sp.scoreText(g));

section('練習（サークル）');
const c = ST.newGame({ sport: 'swim', now: T0, tz: 540, opts: { mode: 'circle', dist: 50, reps: 4, cycle: 60, gap: 5, lanes: 3 } });
sp.fromDraft(c, { lanes: sp.cleanLanes([{ name: 'A' }, { name: 'B' }, { name: 'C' }], 10) });
c.startedAt = T0;
sp.onStart(c);
const C = sp.heats(c)[0];
ok(C.spec.mode === 'circle' && C.spec.reps === 4 && sp.unitOf(C.spec) === 'セット', '練習：セット・4本');
eq([sp.repStart(C, 0, 0), sp.repStart(C, 1, 0), sp.repStart(C, 1, 1), sp.repStart(C, 2, 3)], [0, 5, 65, 190], '本ごとのスタート（サークル 1:00・5秒おき）');
const ct = (t, lane) => ST.addEvent(c, { t, type: 'touch', lane });
ct(3, 2);                       // B は 0:05 スタート → 押しまちがい（自分のスタートより前）
ct(34.5, 1); ct(40.2, 2); ct(95.1, 1); ct(100.5, 2); ct(101, 2);   // B の 2本目に2回 → あとのほう
let cr = sp.circleResults(c, C);
eq(cr[0].reps.map((x) => x.time), [34.5, 35.1, null, null], 'A：1本目 34.50・2本目 35.10');
eq(cr[1].reps.map((x) => x.time), [35.2, 36, null, null], 'B：スタート前のタッチは数えない・同じ本の2回目はあとのほう');
ok(cr[0].done === 2 && cr[0].avg === 34.8 && cr[0].best === 34.5, 'A：2本・平均 34.80・ベスト 34.50');
let now = sp.circleNow(C, 1, 130, cr[1]);
ok(now.r === 3 && now.start === 125 && now.swimming && now.next === 185, '2:10 の B：3本目を泳いでいる（2:05 スタート・次は 3:05）');
now = sp.circleNow(C, 1, 110, cr[1]);
ok(now.r === 2 && !now.swimming && now.next === 125, '1:50 の B：2本目はゴールずみ（次の本を待つ）');
now = sp.circleNow(C, 2, 5, cr[2]);
ok(now.before && now.start === 10, '0:05 の C：まだスタート前（0:10 から）');
ok(!sp.heatDone(c, C, 100), 'まだ終わっていない');
ok(sp.heatDone(c, C, 251), '最後の本のスタートから1サークル過ぎたら、終わり');
const ci = sp.touchInfo(c, c.events.find((e) => e.t === 95.1));
ok(ci.circle && ci.rep === 2 && ci.time === 35.1, 'タッチの中身：2本目 35.10');
eq(sp.timeText(c, c.events.find((e) => e.t === 95.1)), '1セット 35.10', '練習の時刻の呼び名');

section('CSV');
const ev = sp.csvEvents(g);
ok(ev[0][0] === 'No' && ev[0].includes('スプリット・タイム') && ev.length === g.events.length + 1, '記録の一覧：見出し＋記録の数');
ok(ev.some((r) => r[8] === 'ゴール' && r[10] === '34.21' && r[11] === '17.41'), 'ゴールの行（スプリット 34.21・ラップ 17.41）');
const box = sp.csvBox(g);
ok(box[0].includes('組の順位') && box[0].includes('25m') && box[0].includes('100m'), '結果：見出しに 25m〜100m のスプリット');
ok(box.some((r) => r[4] === 'はなこ' && r[8] === '失格（DQ）'), '失格の人');
ok(box.some((r) => r[4] === 'さぶろう' && r[7] === '2:08.77'), '2組目の人');
const cbox = sp.csvBox(c);
ok(cbox[0].includes('1本目') && cbox.some((r) => r[3] === 'A' && r[6] === '34.80'), '練習の結果：本ごと・平均');
const csvText = ST.csv(box);
ok(/\r\n$/.test(csvText) && csvText.split('\r\n').length >= box.length, 'CSV の文字（改行は CRLF）');

section('書き出しと読み込み');
g.pending = { heat: 4, lanes: sp.cleanLanes([{ name: 'まつ' }], 1), spec: sp.specOf(ST.cleanOpts(sp, {})) };
const out = ST.exportData(g);
ok(out.format === 'sports-tap' && out.sport === 'swim' && out.heats.length === 3 && out.heats[0].results.find((x) => x.lane === 1).time === 34.21, '書き出し：組ごとの結果も入る');
const back = ST.importData(JSON.parse(JSON.stringify(out)));
ok(back.sport === 'swim' && back.prec === 100 && back.events.length === g.events.length, '読み込み：記録の数が同じ');
eq(sp.raceResults(back, sp.heats(back)[1]).find((x) => x.lane === 1).time, 128.77, '読み込んでも 2組目のタイムが同じ');
ok(sp.flagsIn(back, sp.heats(back)[0]).get(2).type === 'dq', '読み込んでも失格が残る');
ok(back.pending && back.pending.heat === 4 && back.pending.lanes[0].name === 'まつ' && sp.waiting(back), '読み込んでも、スタート待ちの組が残る');
const bad = JSON.parse(JSON.stringify(out));
bad.events.push({ id: 'e999', t: 5, type: 'touch', lane: -3 }, { id: 'e998', t: 5, type: 'dq', lane: 1 });
ok(ST.importData(bad).events.length === g.events.length, 'おかしなタッチ（レーン −3）・組のない失格は読み込まない');
const cb = ST.importData(JSON.parse(JSON.stringify(ST.exportData(c))));
eq(sp.circleResults(cb, sp.heats(cb)[0])[1].reps.map((x) => x.time), [35.2, 36, null, null], '練習も読み込める');

console.log(`\n${pass} ok / ${fail} fail`);
process.exit(fail ? 1 : 0);
