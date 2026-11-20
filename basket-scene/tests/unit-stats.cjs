// ③ スタッツの、画面を持たない部分（数字のまとめ・よかったところ・場面へ行く arg・画像の並べ方）
//   node tests/unit-stats.cjs
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');
const ctx = vm.createContext({ console });
['js/lib/core.js', 'js/lib/agg.js', 'js/sc-stats.js'].forEach((f) => vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f }));
const { BT, SC } = ctx;
const ST = SC.stats;
let pass = 0, fail = 0;
const plain = (v) => JSON.parse(JSON.stringify(v));
const ok = (c, name, extra) => { if (c) { pass++; console.log('  ok  ', name); } else { fail++; console.log('  FAIL', name, extra !== undefined ? JSON.stringify(extra) : ''); } };
const eq = (a, b, name) => ok(JSON.stringify(plain(a)) === JSON.stringify(plain(b)), name, { got: a, want: b });
const section = (t) => console.log('\n■ ' + t);

function game(players, evs, opp) {
  const g = BT.newGame({ teams: [{ name: 'ミライ', players }, { name: opp == null ? 'ヒガシ' : opp, players: [] }], now: Date.UTC(2026, 10, 20, 3), tz: 540 });
  BT.addEvent(g, { t: 0, type: 'period', period: 1 });
  evs.forEach(([t, type, team, no]) => BT.addEvent(g, { t, type, team, no }));
  return g;
}
const roster = [{ no: '4', name: '' }, { no: '7', name: 'たけし' }, { no: '9', name: 'ゆう' }, { no: '10', name: 'けん' }];

section('失敗も記録した試合（Oリバは、外れたシュートのあとの「リバ」から）');
const g1 = game(roster, [
  [1, 'fg2', 0, '7'], [2, 'fg2', 0, '7'], [3, 'fg2x', 0, '7'], [4, 'fg3', 0, '7'], [5, 'fg3x', 0, '7'], [6, 'ft', 0, '7'], [7, 'ftx', 0, '7'],
  [8, 'ast', 0, '7'], [9, 'stl', 0, '7'], [9.5, 'tov', 0, '7'], [9.8, 'foul', 0, '7'],
  [10, 'fg2x', 0, '9'], [12, 'reb', 0, '9'], [13, 'fg2', 0, '9'], [40, 'reb', 0, '4'],
  [50, 'fg2', 0, null], [51, 'pass', 0, null], [52, 'mark', null, null], [53, 'pass', null, null],
  [60, 'fg3', 1, null], [61, 'fg2', 1, null]
]);
BT.addEvent(g1, { t: 30, type: 'period', period: 2 });
const m1 = ST.model(g1);
eq(m1.names, ['ミライ', 'ヒガシ'], '名前');
eq(m1.score, [12, 5], '得点 12 − 5');
ok(m1.withA && !m1.split, '失敗の記録あり・O/D は分けていない');
eq(m1.periods.map((p) => [p.label, p.pts]), [['1Q', [10, 0]], ['2Q', [2, 5]]], 'ピリオドごとの得点（1Q 10−0・2Q 2−5）');
eq(m1.rows.map((r) => r.no), ['4', '7', '9'], '記録のある選手だけ（#4 #7 #9）');
eq(m1.idle, ['10'], '記録なし：#10');
const r7 = m1.rows.find((r) => r.no === '7').s;
eq([r7.pts, r7.fg2m, r7.fg2a, r7.fg3m, r7.fg3a, r7.ftm, r7.fta, r7.ast, r7.stl, r7.to, r7.foul], [8, 2, 3, 1, 2, 1, 2, 1, 1, 1, 1], '#7：8点・2P 2/3・3P 1/2・FT 1/2・アシスト・スティール・TO・ファウル 1');
const r9 = m1.rows.find((r) => r.no === '9').s;
eq([r9.pts, r9.fg2m, r9.fg2a, r9.reb, r9.oreb], [2, 1, 2, 1, 1], '#9：2点・2P 1/2・リバ 1（うちオフェンス 1）');
ok(m1.unknown && m1.unknown.s.pts === 2 && m1.unknown.s.to === 1, '番号なし：2点・TO 1（チームの付いたパスミス）');
const t1 = m1.total.s;
eq([t1.pts, t1.fgm, t1.fga, t1.fg3m, t1.fg3a, t1.ftm, t1.fta, t1.reb, t1.oreb, t1.ast, t1.stl, t1.blk, t1.to, t1.foul], [12, 5, 8, 1, 2, 1, 2, 2, 1, 1, 1, 0, 2, 1], '合計（チームなしのパスミス・★ は入らない）');
eq(m1.cols.map((c) => c.k), ['pts', 'fg2', 'fg3', 'ft', 'fg', 'reb', 'ast', 'stl', 'to', 'foul'], '列は記録のあるものだけ（ブロック・Oリバ・Dリバなし）');
eq(m1.tiles.map((t) => [t.id, t.value, t.sub]), [['fg', '63%', '5/8'], ['fg2', '67%', '4/6'], ['fg3', '50%', '1/2'], ['ft', '50%', '1/2'], ['efg', '69%', '3P を 1.5 本に'], ['reb', '2', ''], ['ast', '1', ''], ['stl', '1', ''], ['to', '2', 'パスミスも入れて'], ['foul', '1', '']], 'タイル：FG 5/8=63%・2P 4/6=67%・eFG (4+1.5)/8=69%・…');
ok(m1.tiles.find((t) => t.id === 'efg').tabOnly && m1.tiles.filter((t) => t.tabOnly).length === 1, 'eFG% はタブだけ（反省会・画像には出さない）');
const C = (k) => ST.COLS.find((c) => c.k === k);
eq([ST.cellOf(C('fg2'), r7, true).text, ST.cellOf(C('fg'), r7, true).text, ST.cellOf(C('reb'), r7, true).text, ST.cellOf(C('reb'), r7, true).zero], ['2/3', '60%', '0', true], 'マス：2P「2/3」・FG%「60%」（3/5）・0 は zero');
eq(ST.cellOf(C('fg'), m1.rows.find((r) => r.no === '4').s, true).text, '—', '打っていない人の FG% は「—」（NaN にならない）');
eq(ST.sortRows(m1, 'pts', -1).map((r) => r.no), ['7', '9', '4'], '並べかえ：得点の多い順');
eq(ST.sortRows(m1, 'reb', -1).map((r) => r.no), ['4', '9', '7'], '並べかえ：リバの多い順（同じなら背番号の順）');
eq(ST.sortRows(m1, 'pts', 1).map((r) => r.no), ['4', '9', '7'], '並べかえ：少ない順');
eq(ST.sortRows(m1, 'no', 1).map((r) => r.no), ['4', '7', '9'], '並べかえ：背番号の順');
eq(m1.located, 0, 'シュートの場所なし');

section('失敗の記録がない試合');
const g2 = game(roster, [[1, 'fg2', 0, '7'], [2, 'fg2', 0, '7'], [3, 'fg3', 0, '9'], [4, 'ft', 0, '9']]);
const m2 = ST.model(g2);
ok(!m2.withA, '失敗の記録なし');
eq(m2.cols.map((c) => c.k), ['pts', 'fg2', 'fg3', 'ft'], '列：得点・2P・3P・FT（FG% なし）');
eq(m2.tiles.map((t) => [t.id, t.value, t.sub]), [['fg2', '2本', '入った本数'], ['fg3', '1本', '入った本数'], ['ft', '1本', '入った本数']], 'タイル：入った本数だけ（成功率なし）');
eq(ST.cellOf(C('fg2'), m2.rows.find((r) => r.no === '7').s, false).text, '2', 'マス：入った本数「2」');
eq(m2.periods, [], 'ピリオドが1つなら、ピリオドの表なし');

section('Oリバ・Dリバで記録した試合');
const g3 = game(roster, [[1, 'oreb', 0, '7'], [2, 'dreb', 0, '7'], [3, 'dreb', 0, '9'], [4, 'blk', 0, '9']]);
const m3 = ST.model(g3);
ok(m3.split, 'O/D を分けている');
eq(m3.cols.map((c) => c.k), ['pts', 'reb', 'oreb', 'dreb', 'blk'], '列：リバ・Oリバ・Dリバ・ブロック');
eq(m3.tiles.map((t) => [t.id, t.value, t.sub]), [['reb', '3', 'Oリバ 1・Dリバ 2'], ['blk', '1', '']], 'タイル：リバウンド 3（Oリバ 1・Dリバ 2）');
eq(ST.highlights(m3).map((x) => [x.k, x.items.map((i) => [i.no, i.v, i.rank])]), [['reb', [['7', 2, 1], ['9', 1, 2]]]], 'よかったところ：リバだけ（得点・アシストは 0 なので出さない）');

section('名簿が空・番号なし・相手の得点だけ');
const g4 = game([], [[1, 'fg2', 0, '5'], [2, 'fg3', 0, null], [3, 'reb', 0, null]]);
const m4 = ST.model(g4);
eq(m4.rows.map((r) => [r.no, r.name, r.s.pts]), [['5', '', 2]], '名簿になくても、記録のある番号は行になる');
ok(m4.unknown && m4.unknown.s.pts === 3 && m4.unknown.s.reb === 1, '番号なし：3点・リバ 1');
eq(m4.idle, [], '記録なしの選手はいない');
const g5 = game(roster, [[1, 'fg2', 1, null], [2, 'fg3', 1, '8']], '');
const m5 = ST.model(g5);
ok(m5.empty && !m5.tiles.length && m5.cols.map((c) => c.k).join() === 'pts', '相手の得点だけ：自分の数字は空（タイルなし・列は得点だけ）');
eq([m5.score, m5.names], [[0, 5], ['ミライ', '相手']], '得点 0 − 5（相手の名前がなければ「相手」）');
eq(ST.highlights(m5), [], 'よかったところ：なし');
const g6 = game([], []);
const m6 = ST.model(g6);
ok(m6.empty && m6.rows.length === 0 && !m6.unknown && m6.tiles.length === 0 && m6.periods.length === 0, '記録のない試合：空');
ok(!/NaN|undefined|null/.test(JSON.stringify(ST.imageTable(m1)) + m1.tiles.map((t) => t.value + t.sub).join()), '表とタイルの文字に NaN・undefined・null がない');

section('よかったところ（多い 3人・同じ数は全員・「少ない」は出さない）');
const rows = [['4', 10], ['5', 8], ['6', 8], ['7', 8], ['8', 2], ['9', 0]].map(([no, v]) => ({ no, name: '', s: { pts: v } }));
eq(ST.top3(rows, 'pts').map((x) => [x.no, x.v, x.rank]), [['4', 10, 1], ['5', 8, 2], ['6', 8, 2], ['7', 8, 2]], '3人目と同じ数（8）の人は、みんな入る（順位 1・2・2・2）');
eq(ST.top3(rows.slice(0, 2), 'pts').map((x) => x.no), ['4', '5'], '2人しかいなければ 2人');
eq(ST.top3([{ no: '4', s: { pts: 3 } }, { no: '7', s: { pts: 3 } }, { no: '9', s: { pts: 3 } }, { no: '5', s: { pts: 3 } }], 'pts').map((x) => [x.no, x.rank]), [['4', 1], ['5', 1], ['7', 1], ['9', 1]], 'みんな同じ数なら、みんな 1（背番号の順）');
eq(ST.top3(rows, 'reb'), [], '記録がなければ空');
const hl1 = ST.highlights(m1);
eq(hl1.map((x) => [x.k, x.items.map((i) => i.no + ':' + i.v)]), [['pts', ['7:8', '9:2']], ['reb', ['4:1', '9:1']], ['ast', ['7:1']], ['stl', ['7:1']]], '試合の よかったところ（番号なしは入らない）');

section('場面へ（setTab の arg）');
const row7 = m1.rows.find((r) => r.no === '7');
eq(ST.cellJump(m1, row7, C('fg2')), { filter: { types: ['fg2', 'fg2x'], nos: ['7'], team: 0 }, title: '#7 たけし の 2P', play: 'reel' }, '#7 の 2P のマス');
eq(ST.cellJump(m1, m1.unknown, C('pts')), { filter: { types: ['fg2', 'fg3', 'ft'], nos: [''], team: 0 }, title: '番号なし の 得点', play: 'reel' }, '番号なしの得点');
eq(ST.cellJump(m1, m1.total, C('to')), { filter: { types: ['tov', 'pass'], nos: null, team: 0 }, title: 'ミライ の ターンオーバー', play: 'reel' }, '合計の TO');
eq(ST.rowJump(m1, row7), { filter: { types: null, nos: ['7'], team: 0 }, title: '#7 たけし', play: 'reel' }, '#7 の名前');
eq(ST.rowJump(m1, m1.rows.find((r) => r.no === '4')), { filter: { types: null, nos: ['4'], team: 0 }, title: '#4', play: 'reel' }, '名前のない #4');
eq(ST.tileJump(m1, m1.tiles.find((t) => t.id === 'to')), { filter: { types: ['tov', 'pass'], nos: null, team: 0 }, title: 'ミライ の ターンオーバー', play: 'reel' }, 'タイル：ターンオーバー');
eq(ST.tileJump(m1, m1.tiles.find((t) => t.id === 'fg')).filter.types, ['fg2', 'fg2x', 'fg3', 'fg3x'], 'タイル：シュート成功率 → 2P・3P の成功と失敗');
eq(ST.hlJump(m1, hl1[0], hl1[0].items[0]), { filter: { types: ['fg2', 'fg3', 'ft'], nos: ['7'], team: 0 }, title: '#7 たけし の 得点', play: 'reel' }, 'よかったところ：#7 の得点');

section('画像の並べ方');
const mono = (t, px) => Array.from(String(t)).length * (px || 10) * 0.6;
const ten = (t) => Array.from(String(t)).length * 10;
eq(ST.fitText('あいうえおかきく', 50, ten), 'あいうえ…', '入らない文字は「…」（50 px に 4 文字＋…）');
eq(ST.fitText('あいう', 50, ten), 'あいう', '入る文字はそのまま');
eq(ST.fitText('あいう', 5, ten), '', '「…」も入らなければ空');
eq(ST.colWidths([80, 200, 100, 100], 600, 1, 300), { widths: [80, 300, 110, 110], total: 600 }, '列の幅：余りは名前（300 まで）→ 残りは数の列に等しく');
eq(ST.colWidths([80, 200, 100, 100], 400, 1, 300), { widths: [80, 200, 100, 100], total: 480 }, '列の幅：入らなければ、そのまま（画像を広げる）');
const L1 = ST.layoutImage(m1, mono);
const K = ST.IMG;
ok(L1.W === 1600, '幅 1600', L1.W);
const tiles1 = m1.tiles.filter((t) => !t.tabOnly).length;
const tileRows = Math.ceil(tiles1 / K.tilePerRow);
const H1 = K.P + K.titleH + 12 + K.scoreH + K.gap + (K.perHead + 2 * K.perRow + K.gap) + (K.secH + tileRows * K.tileH + (tileRows - 1) * K.tileGap + K.gap) + (K.secH + K.headH + 5 * K.rowH + K.gap) + K.footH + K.P - 16;
eq(L1.H, H1, `高さ：題・得点・ピリオド・タイル ${tiles1}こ（${tileRows}段）・表 5行（3人＋番号なし＋合計）・下（${H1} px）`);
ok(L1.table.total <= L1.W - 2 * K.P && L1.table.widths.length === 2 + m1.cols.length && L1.table.x >= K.P, '表は画像の中に入る', L1.table);
const many = game(Array.from({ length: 30 }, (_, i) => ({ no: String(i + 1), name: 'ながいなまえのせんしゅ' + i })), Array.from({ length: 30 }, (_, i) => [i + 1, 'fg2', 0, String(i + 1)]));
const Lm = ST.layoutImage(ST.model(many), mono);
ok(Lm.table.n === 31 && Lm.table.rowH === K.rowHSmall && Lm.H > L1.H && Lm.table.y + Lm.table.secH + Lm.table.headH + 31 * Lm.table.rowH < Lm.foot.y, '30人：だれも切らずに、行を低くして、画像を長くする', { H: Lm.H, rowH: Lm.table.rowH });
const wideNo = ST.layoutImage(m1, (t, px) => Array.from(String(t)).length * (px || 10) * 2.2);
ok(wideNo.W > 1600 && wideNo.table.total + 2 * K.P <= wideNo.W, '列が入りきらないときは、画像を広げる', { W: wideNo.W, total: wideNo.table.total });
const L6 = ST.layoutImage(m6, mono);
ok(L6.table === null && L6.tiles === null && L6.per === null && L6.empty && L6.H > 300 && L6.W === 1600, '記録のない試合：得点と「まだ記録がありません」だけ', L6);
eq(ST.dateText('2026-11-20'), '2026年11月20日', '日付の文字');

console.log(`\n${pass} ok / ${fail} fail`);
process.exit(fail ? 1 : 0);
