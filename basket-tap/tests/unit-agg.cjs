// これまでの試合の集計（js/agg.js）の回帰テスト：node basket-tap/tests/unit-agg.cjs
// 数はみな手で数えたもの（下の試合の作り方のコメントを見ながら）。
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function load() {
  const ctx = { console, Math, Date, JSON };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  ['core.js', 'agg.js'].forEach((f) => vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8'), ctx, { filename: f }));
  return ctx.BT;
}
let pass = 0, fail = 0;
const ok = (c, name, extra) => { if (c) { pass++; console.log('  ok  ', name); } else { fail++; console.log('  FAIL', name, extra !== undefined ? JSON.stringify(extra) : ''); } };
const eq = (a, b, name) => ok(JSON.stringify(a) === JSON.stringify(b), name, { got: a, want: b });
const section = (t) => console.log('\n■ ' + t);
const BT = load();
const A = BT.agg;

const DAY = 86400000;
const T0 = Date.UTC(2026, 9, 1, 6, 0, 0);
/* 試合を作る。evs：[t, team, no, type, x, y] */
function mk(id, day, names, evs, opt) {
  const o = opt || {};
  const g = BT.newGame({ id, now: T0 + day * DAY, tz: 540, teams: [{ name: names[0], players: o.p0 || [] }, { name: names[1], players: o.p1 || [] }] });
  g.startedAt = T0 + day * DAY;
  if (!o.going) g.endedAt = g.startedAt + 3600000;
  if (o.court) g.court = o.court;
  if (o.demo) g.demo = true;
  if (o.gc) g.gc = o.gc;
  evs.forEach(([t, team, no, type, x, y]) => {
    const e = BT.addEvent(g, type === 'period' ? { t, type, period: no } : { t, type, team, no });
    if (x != null) { e.x = x; e.y = y; }
  });
  return g;
}
const RIM = [0.5, 0.1], T3 = [0.5, 0.75], PAINT = [0.4, 0.3], C3L = [0.03, 0.05], LONGC = [0.5, 0.9];
const rep = (n, f) => Array.from({ length: n }, (_, i) => f(i));

// A：ミライ（自分の側）10 − 7 ヒガシ。外れの記録あり・ピリオドあり（2Q）・場所あり（ふつうのコート）
const gA = mk('gA', 0, ['ミライ', 'ヒガシ'], [
  [0, null, 1, 'period'],
  [1, 0, '4', 'fg2', ...RIM], [2, 0, '4', 'fg2x', ...RIM], [3, 0, '4', 'fg3', ...T3], [4, 0, '4', 'ftx'], [5, 0, '4', 'ft'],
  [6, 0, '4', 'reb'], [7, 0, '4', 'ast'], [8, 0, '4', 'tov'],
  [9, 0, '7', 'fg2', ...PAINT], [10, 0, '7', 'fg3x', ...C3L], [11, 0, '7', 'oreb'], [12, 0, '7', 'pass'],
  [100, null, 2, 'period'],
  [101, 0, '7', 'foul'], [102, 0, '7', 'stl'], [103, 0, null, 'fg2'],
  [104, 1, '10', 'fg2'], [105, 1, '10', 'fg2'], [106, 1, '10', 'fg3'], [107, 1, '10', 'ftx'], [108, 1, '10', 'tov'], [109, 1, '10', 'foul'],
  [110, 1, null, 'pass'], [111, null, null, 'pass']
], { p0: [{ no: '4', name: 'タロウ' }, { no: '7', name: '' }], court: 'std' });
// B：ニシ 5 − 7 ミライ（ミライは相手の側）。外れの記録なし
const gB = mk('gB', 7, ['ニシ', 'ミライ'], [
  [1, 1, '4', 'fg2', ...RIM], [2, 1, '4', 'fg2', ...RIM], [3, 1, '9', 'fg3'], [4, 1, '4', 'tov'],
  [5, 0, '5', 'fg2'], [6, 0, '5', 'fg2'], [7, 0, '5', 'ft']
], { p1: [{ no: '4', name: 'たろう' }] });
// C：ミライ 2 − 2 ヒガシ（引き分け）。ミニバスのコート
const gC = mk('gC', 14, ['ミライ', 'ヒガシ'], [
  [1, 0, '7', 'fg2', ...LONGC], [2, 0, '7', 'fg2x', ...LONGC], [3, 1, '10', 'fg2']
], { p0: [{ no: '7', name: 'なな' }], court: 'mini' });
// D：ミライ 15 − 30 キタ。ゴール下 4/5・3P トップ 1/5・ペイント 2/4
const gD = mk('gD', 21, ['ミライ', 'キタ'], [
  ...rep(4, (i) => [1 + i, 0, '4', 'fg2', ...RIM]), [5, 0, '4', 'fg2x', ...RIM],
  [6, 0, '4', 'fg3', ...T3], ...rep(4, (i) => [7 + i, 0, '4', 'fg3x', ...T3]),
  [11, 0, '7', 'fg2', ...PAINT], [12, 0, '7', 'fg2', ...PAINT], [13, 0, '7', 'fg2x', ...PAINT], [14, 0, '7', 'fg2x', ...PAINT],
  ...rep(10, (i) => [20 + i, 1, '11', 'fg3'])
], { court: 'std' });
// E：デモ（入れない）・F：記録なし（入れない）・G：名前なし 2 − 0 ヒガシ・H：記録の途中（いちばん新しい。game.gc あり）
const gE = mk('gE', 30, ['ミライ', 'デモ'], [[1, 0, '4', 'fg2']], { demo: true });
const gF = mk('gF', 31, ['ミライ', 'ゼロ'], [[0, null, 1, 'period']]);
const gG = mk('gG', -10, ['', 'ヒガシ'], [[1, 0, '4', 'fg2']]);
const gH = mk('gH', 28, ['ミライ', 'ミナミ'], [[1, 0, '4', 'ft']], { going: true, gc: { run: true, left: 300 } });
const ALL = [gA, gB, gC, gD, gE, gF, gG, gH];

section('集計に使う試合');
const EL = A.eligible(ALL);
eq(EL.map((g) => g.id).sort(), ['gA', 'gB', 'gC', 'gD', 'gG', 'gH'], 'デモと、記録のない試合（ピリオドだけ）は入れない・記録の途中の試合は入れる');
eq(A.plays(gF), 0, 'ピリオドの始まりは、記録に数えない');

section('チームを選ぶ');
const TM = A.teams(EL, '');
eq(TM.list.map((t) => [t.key, t.n, t.n0]), [['ミライ', 5, 4], ['ヒガシ', 3, 0], ['ニシ', 1, 1], ['', 1, 1], ['ミナミ', 1, 0], ['キタ', 1, 0]], 'どちらかの側に出てくる名前・試合の多い順（同じなら自分の側の多い順 → 新しい順）');
eq(TM.def, 'ミライ', 'ふだんは、自分の側にいちばん多く出てくる名前');
eq(TM.list.find((t) => t.key === '').label, '自分（名前なし）', '自分の側の名前がない試合は「自分（名前なし）」');
{
  const x = mk('x1', 1, ['X', 'Q'], [[1, 0, '1', 'fg2']]), y = mk('y1', 0, ['Y', 'Q'], [[1, 0, '1', 'fg2']]);
  eq(A.teams([x, y], 'Y').def, 'Y', '同じ数なら、自分のチームとして覚えている名前');
  eq(A.teams([x, y], '').def, 'X', '覚えていなければ、新しい試合の名前');
  eq(A.teams([x, y], 'Z').def, 'X', '覚えている名前が出てこなければ、新しい試合の名前');
}
eq(A.gamesFor(EL, 'ミライ').map((x) => [x.game.id, x.side]), [['gH', 0], ['gD', 0], ['gC', 0], ['gB', 1], ['gA', 0]], 'ミライの試合（新しい順・相手の側の試合も）');
eq(A.gamesFor(EL, 'ヒガシ').map((x) => [x.game.id, x.side]), [['gC', 1], ['gA', 1], ['gG', 1]], 'ヒガシ（いつも相手の側）');
eq(A.gamesFor(EL, '').map((x) => [x.game.id, x.side]), [['gG', 0]], '名前なしは、自分の側だけ');
{
  const s = mk('s1', 0, ['  ミライ ', 'ミライ'], [[1, 0, '1', 'fg2']]);
  eq(A.sideOf(s, 'ミライ'), 0, '名前のまわりの空白は無視・両方の側が同じ名前なら自分の側');
}

section('しぼる（直近・外す）');
const MI = A.gamesFor(EL, 'ミライ');
eq(A.pick(MI, { recent: 2 }).map((x) => x.game.id), ['gH', 'gD'], '直近2試合 ＝ スタートした時刻の新しい2つ');
eq(A.pick(MI, { recent: 5 }).length, 5, '直近5試合（5試合しかない）');
eq(A.pick(MI, { recent: 2, exclude: ['gD'] }).map((x) => x.game.id), ['gH'], '直近にしぼってから、外した試合を除く（繰り上げない）');
eq(A.pick(MI, { exclude: new Set(['gA', 'gB']) }).map((x) => x.game.id), ['gH', 'gD', 'gC'], '外す（Set でも）');
{
  const c1 = mk('c1', 5, ['P', 'Q'], [[1, 0, '1', 'fg2']]); c1.startedAt = null;           // まだスタートしていない：作った時刻
  const c2 = mk('c2', 3, ['P', 'Q'], [[1, 0, '1', 'fg2']]);
  eq(A.pick(A.gamesFor([c2, c1], 'P'), { recent: 1 }).map((x) => x.game.id), ['c1'], 'スタートしていない試合は、作った時刻で並べる');
}

section('まとめ（ミライ・5試合）');
const R = A.compute(MI);
eq([R.n, R.nMiss], [5, 3], '5試合・外れも記録した試合は 3（A・C・D）');
eq([R.w, R.l, R.d], [3, 1, 1], '勝ち 3（A・B・H）・負け 1（D）・引き分け 1（C）');
eq([R.pf, R.pa], [35, 44], '得点 10+7+2+15+1・失点 7+5+2+30+0');
eq([R.us.fg2m, R.us.fg3m, R.us.ftm], [12, 3, 2], '入れた本数は、全部の試合から');
eq(R.usSh, { fg2m: 10, fg2a: 15, fg3m: 2, fg3a: 7, ftm: 1, fta: 2 }, '成功率に使う本数は、外れも記録した試合（A・C・D）だけ');
const RT = A.rates(R.usSh);
eq([A.fmtPct(RT.fg), A.fmtPct(RT.fg2), A.fmtPct(RT.fg3), A.fmtPct(RT.ft), A.fmtPct(RT.efg)], ['55%', '67%', '29%', '50%', '59%'], 'FG% 12/22・2P 10/15・3P 2/7・FT 1/2・eFG (10+1.5×2)/22');
eq([R.us.reb, R.us.oreb, R.us.ast, R.us.stl, R.us.foul], [2, 1, 1, 1, 1], 'リバウンド（うちオフェンス）・アシスト・スティール・ファウル');
eq(R.us.to, 3, 'ターンオーバー ＝ tov（A 1・B 1）＋ チームの付いたパスミス（A 1）');
eq(R.op.to, 2, '相手：tov 1 ＋ 相手のパスミス 1（チームなしのパスミスは、どちらにも入らない）');
eq([R.op.fg3m, R.opSh.fg3a, R.op.pts], [11, 11, 44], '相手の数も、同じ数え方（失点 ＝ 相手の得点）');
eq(A.compute(A.gamesFor(EL, 'ミライ').filter((x) => x.game.id === 'gA')).op.to, 2, '試合 A だけ：相手のターンオーバー 2');

section('選手ごと');
const P = (no) => R.players.find((p) => p.no === no);
eq(R.players.map((p) => p.no), ['4', '7', '9'], '背番号の順');
eq([P('4').games, P('4').s.pts, P('4').name], [4, 22, 'たろう'], '#4：記録のある試合 4（A・B・D・H）・22 点・名前は、いちばん新しい名前（B の「たろう」）');
eq(P('4').sh, { fg2m: 5, fg2a: 7, fg3m: 2, fg3a: 6, ftm: 1, fta: 2 }, '#4 の成功率用（A と D だけ。B は外れの記録なし）');
eq([P('7').games, P('7').s.pts, P('7').name, P('7').s.to, P('7').s.foul], [3, 8, 'なな', 1, 1], '#7：3試合・8 点・名前「なな」・ターンオーバー（パスミス）1');
eq([P('9').games, P('9').s.fg3m, P('9').sh.fg3a, A.fmtPct(A.rates(P('9').sh).fg3)], [1, 1, 0, '—'], '#9：外れを記録していない試合だけ → 成功率は「—」（0% にしない）');
eq([R.unknown.games, R.unknown.s.pts], [1, 2], '番号なし：1試合・2 点');
eq([R.total.games, R.total.s.pts], [5, 35], '合計の行');
eq(A.fmtAvg(P('4').s.pts / P('4').games), '5.5', '1試合あたり：選手は、記録のある試合の数で割る（22/4）');
eq(A.fmtAvg(R.pf / R.n), '7.0', 'チームは、試合の数で割る（35/5）');
eq([A.fmtPct(null), A.fmtAvg(null), A.fmtPct(A.ratio(0, 0)), A.fmtDiff(-1.25), A.fmtDiff(0)], ['—', '—', '—', '−1.3', '±0.0'], '0 本は「—」（NaN にしない）・差は ＋−');

section('試合ごと・ピリオドごと');
eq(R.games.map((g) => [g.id, g.pf, g.pa, g.res, g.miss, g.opp]), [['gH', 1, 0, 'W', false, 'ミナミ'], ['gD', 15, 30, 'L', true, 'キタ'], ['gC', 2, 2, 'D', true, 'ヒガシ'], ['gB', 7, 5, 'W', false, 'ニシ'], ['gA', 10, 7, 'W', true, 'ヒガシ']], '新しい順・相手の名前・勝敗');
ok(R.games[0].going && !R.games[1].going, '記録の途中の試合の印');
eq([R.games[3].sh, R.games[4].sh.fg2a], [null, 4], '外れの記録のない試合は、成功率用の本数なし');
eq(R.periods, { n: 1, rows: [{ period: 1, label: '1Q', n: 1, pf: 8, pa: 0 }, { period: 2, label: '2Q', n: 1, pf: 2, pa: 7 }] }, 'ピリオドごと：ピリオドを進めた試合（A）だけ');
const RA = A.compute(A.gamesFor(EL, 'ヒガシ'));
eq([RA.n, RA.w, RA.l, RA.d, RA.pf, RA.pa], [3, 0, 2, 1, 9, 14], 'ヒガシ（相手の側）：負け 2・引き分け 1・得点 7+2+0・失点 10+2+2');
eq(RA.periods.rows.map((r) => [r.label, r.pf, r.pa]), [['1Q', 0, 8], ['2Q', 7, 2]], '相手の側のピリオドも、その側から');
eq(RA.us.to, 2, '相手の側のターンオーバー（tov ＋ 相手のパスミス）');
const R0 = A.compute([]);
eq([R0.n, R0.pf, R0.players.length, R0.unknown, A.fmtPct(A.rates(R0.usSh).fg)], [0, 0, 0, null, '—'], '0 試合でも NaN を出さない');

section('流れ（グラフ）');
eq(A.trend(R, 'pts').map((p) => [p.id, ...p.values]), [['gA', 10, 7], ['gB', 7, 5], ['gC', 2, 2], ['gD', 15, 30], ['gH', 1, 0]], '得点と失点（古い順）');
eq(A.trend(R, 'fg').map((p) => p.values[0] == null ? null : Math.round(p.values[0] * 100)), [67, null, 50, 50, null], 'シュート成功率：外れを記録していない試合は空き（A 4/6・C 1/2・D 7/14）');
eq(A.trend(R, 'to').map((p) => p.values[0]), [2, 1, 0, 0, 0], 'ターンオーバー');

section('シュートの場所');
const SH = A.shots(MI);
eq([SH.court, SH.courts], ['std', { std: 3, mini: 1 }], 'コートが混ざっていたら、多いほう（ふつう 3・ミニバス 1）');
const Z = (s, id) => { const z = s.zones.find((x) => x.id === id); return [z.made, z.att, z.madeAll]; };
eq(Z(SH, 'rim'), [5, 7, 7], 'ゴール下：成功率用は A・D だけ（5/7）・入れた本数は B も（7）');
eq([Z(SH, 't3'), Z(SH, 'paint'), Z(SH, 'c3L')], [[2, 6, 2], [3, 5, 3], [0, 1, 0]], '3P トップ・ペイント・左コーナー');
eq([SH.located, SH.nGames, SH.nMissGames, SH.nos], [21, 3, 2, ['4', '7']], '点は全部の試合から（A 5・B 2・D 14）');
eq([SH.best && SH.best.id, SH.worst && SH.worst.id], ['rim', 't3'], 'いちばん入るのはゴール下（71%）・入らないのは 3P トップ（33%）（5本以上のゾーンだけ）');
const S7 = A.shots(MI, { no: '7' });
eq([S7.located, Z(S7, 'paint'), S7.best && S7.best.id, S7.worst], [6, [3, 5, 3], 'paint', null], '#7 だけ：5本以上はペイントだけ → 入らないゾーンは出さない');
const SM = A.shots(MI, { court: 'mini' });
eq([SM.court, Z(SM, 'longC'), SM.located, SM.best], ['mini', [1, 2, 1], 2, null], 'ミニバスに切りかえ：C だけ（ロング正面 1/2）');
eq(A.shots(A.gamesFor(EL, 'ヒガシ')).located, 0, '場所の記録がないチーム');

section('CSV');
const pc = A.playersCSV(R).trim().split('\r\n');
eq(pc.length, 6, '選手ごと：見出し＋ 3人＋番号なし＋合計');
eq(pc[0].split(',').length, 25, '25 列');
ok(pc.every((l) => l.split(',').length === 25), 'どの行も同じ列の数');
eq(pc[1].split(',').slice(0, 11), ['4', 'たろう', '4', '22', '5.5', '7', '2', '2', '5', '7', '71.4'], '#4：試合 4・22 点・平均 5.5・入れた本数（2P 1+2+4・3P 2・FT 2）・成功率用 5/7 → 71.4');
eq(pc[5].split(',').slice(0, 4), ['合計', '', '5', '35'], '合計の行は最後');
ok(!/NaN|undefined|null/.test(A.playersCSV(R) + A.gamesCSV(R) + A.playersCSV(R0)), 'NaN・undefined・null の文字がない');
const gc = A.gamesCSV(R).trim().split('\r\n');
eq(gc.length, 6, '試合ごと：見出し＋5試合');
eq(gc[2].split(',').slice(0, 15), ['2026-10-22', 'キタ', '15', '30', '負け', 'あり', '6', '9', '1', '5', '0', '0', '50', '20', ''], '試合 D：成功率（FT は打っていないので空）');
eq(gc[1].split(',').slice(5, 15), ['なし', '0', '', '0', '', '1', '', '', '', ''], '外れの記録のない試合は、打った数・成功率を空に');
{
  const q = mk('q1', 0, ['A,"B"', 'C'], [[1, 0, '1', 'fg2']]);
  const line = A.gamesCSV(A.compute(A.gamesFor([q], 'A,"B"'))).split('\r\n')[1];
  ok(line.startsWith('2026-10-01,C,2,0,'), 'カンマ・" の入った名前でも列がずれない', line);
}

console.log(`\n${pass} ok / ${fail} fail`);
process.exit(fail ? 1 : 0);
