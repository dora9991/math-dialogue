// 野球の回帰テスト（node sports-tap/tests/unit-baseball.cjs）
// 画面を持たない部分（カウント・アウト・イニング・走者・得点・投球数・集計・CSV・書き出しと読み込み）を確かめる。
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function load() {
  const ctx = { console, Math, Date, JSON };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  ['core.js', 'sp/baseball.js'].forEach((f) => vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8'), ctx, { filename: f }));
  return ctx.ST;
}
let pass = 0, fail = 0;
const ok = (c, name, extra) => { if (c) { pass++; console.log('  ok  ', name); } else { fail++; console.log('  FAIL', name, extra !== undefined ? JSON.stringify(extra) : ''); } };
const eq = (a, b, name) => ok(JSON.stringify(a) === JSON.stringify(b), name, { got: a, want: b });
const section = (t) => console.log('\n■ ' + t);
const ST = load();
const SP = ST.SPORTS.baseball;

const T0 = Date.UTC(2026, 9, 25, 1, 0, 0);
const lineup = (from) => Array.from({ length: 9 }, (_, i) => ({ no: String(from + i), name: i === 0 ? 'たろう' : '' }));
function game(opts) {
  const g = ST.newGame({ sport: 'baseball', now: T0, tz: 540, opts: Object.assign({ inn: 7, plim: 70, top: 0 }, opts || {}),
    teams: [{ name: '致遠館', players: lineup(1), pitcher: '1' }, { name: '城南', players: lineup(11), pitcher: '18' }] });
  g.startedAt = T0;
  return g;
}
let tt = 0;
/* いまの打者で記録する（画面と同じ：攻撃のチーム・打順・背番号を付ける） */
function rec(g, type, extra) {
  const s = SP.situation(g);
  tt += 5;
  const isBat = SP.PITCHES.includes(type) || SP.RESULTS.includes(type);
  return ST.addEvent(g, Object.assign(isBat ? { team: s.bat, no: s.batter, slot: s.slot } : { team: s.bat }, { t: tt, type }, extra || {}));
}

section('種目の定義');
ok(SP && SP.family === 'baseball' && SP.orderedRoster, '野球が登録されている（打順の並びを保つ）');
eq(ST.cleanOpts(SP, { inn: 9, plim: 100, top: 1 }), { inn: 9, plim: 100, top: 1 }, '試合の形式：9回・100球・相手が先攻');
eq(ST.cleanOpts(SP, { inn: 8, plim: 33 }), { inn: 7, plim: 0, top: 0 }, '知らない値は、はじめの値に');
{
  const g = game();
  eq(g.teams[0].players.map((p) => p.no), ['1', '2', '3', '4', '5', '6', '7', '8', '9'], '打順の並びのまま');
  const g2 = ST.newGame({ sport: 'baseball', teams: [{ players: [{ no: '10' }, { no: '3' }, { no: '7' }] }] });
  eq(g2.teams[0].players.map((p) => p.no), ['10', '3', '7'], '番号の順に並べかえない（打順）');
}

section('1球ずつ：カウント・四球・三振・ファウル');
{
  tt = 0;
  const g = game();
  let s = SP.situation(g);
  eq([s.halfText, s.bat, s.batter, s.pitcherNo, s.outs], ['1回表', 0, '1', '18', 0], 'はじめ：1回表・自分の攻撃・1番 #1・投手 #18');
  rec(g, 'b'); rec(g, 's'); rec(g, 'f'); rec(g, 'f');
  s = SP.situation(g);
  eq([s.b, s.s, s.pitchCount], [1, 2, 4], 'B1 S2（2ストライクのファウルはそのまま）・4球');
  rec(g, 'b'); rec(g, 'b'); const e4 = rec(g, 'b');
  s = SP.situation(g);
  eq([s.b, s.s, s.batter, s.bases.map((x) => x && x.no)], [0, 0, '2', ['1', null, null]], '4ボール → 四球：#1 が一塁へ・次は 2番');
  eq(SP.textWithAnnot(g, e4), 'ボール（→ 四球）', '一覧の呼び名：ボール（→ 四球）');
  rec(g, 's'); rec(g, 's'); const k = rec(g, 's');
  s = SP.situation(g);
  eq([s.outs, s.batter, s.pitchCount], [1, '3', 10], '3ストライク → 三振：1アウト・次は 3番・10球');
  eq(SP.annot(SP.derive(g), k), '→ 三振', '三振の印');
}

section('打席の結果：アウト・チェンジ・イニング');
{
  tt = 0;
  const g = game();
  rec(g, 'go'); rec(g, 'fo');
  let s = SP.situation(g);
  eq([s.outs, s.batter], [2, '3'], 'ゴロ・フライで2アウト');
  rec(g, 'k');
  s = SP.situation(g);
  eq([s.halfText, s.bat, s.outs, s.batter, s.pitcherNo], ['1回裏', 1, 0, '11', '1'], '3アウトでチェンジ：1回裏・相手の 1番 #11・投手は #1');
  rec(g, 'dp');
  s = SP.situation(g);
  eq([s.outs, s.batter], [2, '12'], '併殺で2アウト');
  rec(g, 'lo');
  s = SP.situation(g);
  eq([s.halfText, s.batter], ['2回表', '4'], '2回表は 4番から（打順が続く）');
  eq(SP.derive(g).line, [[0, 0], [0]], 'スコアボード：1回の表裏は 0、2回表が始まった');
}

section('走者：確かな動きだけ');
{
  tt = 0;
  const g = game();
  rec(g, '1b'); rec(g, '1b');
  let s = SP.situation(g);
  eq(s.bases.map((x) => x && x.no), ['2', '1', null], '単打・単打：一塁 #2・二塁 #1（押し出しだけ）');
  rec(g, 'bb');
  s = SP.situation(g);
  eq(s.bases.map((x) => x && x.no), ['3', '2', '1'], '四球で満塁');
  const w = rec(g, 'hbp');
  s = SP.situation(g);
  eq([s.score, s.bases.map((x) => x && x.no)], [[1, 0], ['4', '3', '2']], '満塁で死球 → 押し出しの1点');
  eq(SP.derive(g).info[w.id].runs, 1, 'その記録の得点：1');
  rec(g, 'hr');
  s = SP.situation(g);
  eq([s.score, s.bases.every((x) => !x)], [[5, 0], true], '満塁本塁打：4点（走者なし）');
  rec(g, '2b');
  s = SP.situation(g);
  eq(s.bases.map((x) => x && x.no), [null, '6', null], '二塁打：打者が二塁');
  rec(g, '1b');
  s = SP.situation(g);
  eq(s.bases.map((x) => x && x.no), ['7', '6', null], '走者二塁で単打：二塁の走者は動かさない（確かでない）');
  rec(g, '3b');
  s = SP.situation(g);
  eq([s.score[0], s.bases.map((x) => x && x.no)], [7, [null, null, '8']], '三塁打：走者全員が生還（2点）・打者が三塁');
  rec(g, 'sf');
  s = SP.situation(g);
  eq([s.score[0], s.outs, s.bases.every((x) => !x)], [8, 1, true], '犠飛：三塁の走者の1点・1アウト');
  rec(g, '1b'); rec(g, 'sh');
  s = SP.situation(g);
  eq([s.outs, s.bases.map((x) => x && x.no)], [2, [null, '1', null], ], '犠打：走者を1つ先へ・2アウト');
  rec(g, 'run');
  s = SP.situation(g);
  eq([s.score[0], s.bases.every((x) => !x)], [9, true], '＋1点：いちばん先の走者を消して1点');
  rec(g, 'base', { base: 2, on: true });
  s = SP.situation(g);
  eq(s.bases.map((x) => !!x), [false, false, true], '塁を押して三塁に走者');
  rec(g, 'base', { base: 2, on: false });
  rec(g, 'out');
  s = SP.situation(g);
  eq([s.halfText, s.outs], ['1回裏', 0], 'アウト＋1 で3アウト → チェンジ');
  eq(SP.derive(g).line[0], [9], '1回表 9点');
  eq(SP.derive(g).hits[0], 7, '安打 7本');
}

section('併殺・失策・野選・二塁打の押し出し');
{
  tt = 0;
  const g = game();
  rec(g, 'e');
  let s = SP.situation(g);
  eq([s.bases[0] && s.bases[0].no, SP.derive(g).errs], ['1', [0, 1]], '失策で出塁：相手チームの失策 1');
  rec(g, 'dp');
  s = SP.situation(g);
  eq([s.outs, s.bases.every((x) => !x)], [2, true], '併殺：2アウト・一塁の走者を消す');
  tt = 0;
  const g2 = game();
  rec(g2, '1b'); rec(g2, '2b');
  s = SP.situation(g2);
  eq(s.bases.map((x) => x && x.no), [null, '2', '1'], '走者一塁で二塁打：一塁の走者は三塁まで（押し出し）');
  rec(g2, 'fc');
  s = SP.situation(g2);
  eq(s.bases.map((x) => x && x.no), ['3', '2', '1'], '野選：打者が一塁');
  rec(g2, '2b');
  s = SP.situation(g2);
  eq([s.score[0], s.bases.map((x) => x && x.no)], [2, [null, '4', '3']], '満塁で二塁打：三塁・二塁の走者は生還（2点）、一塁の走者（#3）は三塁');
}

section('取り消すと元に戻る（全部を記録から計算）');
{
  tt = 0;
  const g = game();
  rec(g, 'go'); rec(g, 'go'); const third = rec(g, 'go');
  eq(SP.situation(g).halfText, '1回裏', '3アウトで 1回裏');
  ST.removeEvent(g, third.id);
  const s = SP.situation(g);
  eq([s.halfText, s.outs, s.batter], ['1回表', 2, '3'], '3つ目のアウトを消すと 1回表・2アウト・3番');
  // 一覧で時刻を直すと、順番が変わる
  const ev = rec(g, '1b');
  ev.t = 1;
  const s2 = SP.situation(g);
  eq([s2.outs, s2.bases[0] && s2.bases[0].no], [2, '3'], '単打の時刻を最初に直すと、単打 → そのあと 2アウト（打った人は記録したときの #3 のまま）');
}

section('投手の交代・代打・打順を直す・チェンジ');
{
  tt = 0;
  const g = game();
  rec(g, 'b'); rec(g, 'b'); rec(g, 's');
  ST.addEvent(g, { t: (tt += 5), type: 'pch', team: 1, no: '20' });
  let s = SP.situation(g);
  eq([s.pitcherNo, s.pitchCount, s.b, s.s], ['20', 0, 2, 1], '投手 #20 に交代：投球数は 0 から・カウントはそのまま');
  rec(g, 's');
  const st = SP.derive(g);
  eq(st.pitchers[1].map((p) => [p.no, p.pitches]), [['18', 3], ['20', 1]], '投手ごとの投球数');
  ST.addEvent(g, { t: (tt += 5), type: 'sub', team: 0, slot: 0, no: '25' });
  s = SP.situation(g);
  eq(s.batter, '25', '代打 #25（1番）');
  rec(g, '1b');
  s = SP.situation(g);
  eq([s.batter, s.bases[0].no], ['2', '25'], '#25 の単打 → 次は 2番');
  ST.addEvent(g, { t: (tt += 5), type: 'bat', team: 0, slot: 5 });
  s = SP.situation(g);
  eq(s.batter, '6', '打順を直す：6番から');
  ST.addEvent(g, { t: (tt += 5), type: 'chg', team: 0 });
  s = SP.situation(g);
  eq([s.halfText, s.bases.every((x) => !x)], ['1回裏', true], 'チェンジ：1回裏・走者なし');
  // 相手が先攻
  const g2 = game({ top: 1 });
  eq([SP.situation(g2).bat, SP.situation(g2).batter, SP.situation(g2).pitcherNo], [1, '11', '1'], '相手が先攻：1回表は相手の攻撃・投手は自分の #1');
}

section('打順の人数（背番号を入れていない打順も数える）');
{
  tt = 0;
  const g = ST.newGame({ sport: 'baseball', now: T0, opts: { top: 0 }, teams: [{ players: [{ no: '11' }, { no: '12' }, { no: '13' }], order: 9 }, { players: [] }] });
  g.startedAt = T0;
  eq(SP.situation(g).nSlots, 9, '3人だけ背番号を入れた 9人の打順 → 9人');
  rec(g, 'go'); rec(g, 'go'); rec(g, 'go');
  rec(g, 'go'); rec(g, 'go'); rec(g, 'go');
  const s = SP.situation(g);
  eq([s.slot, s.batter], [3, null], '2回表は 4番（背番号なし）から');
  eq(SP.slotsOf([], undefined), 9, '名簿も人数もなければ 9人');
  eq(SP.slotsOf(['1', '2', '3', '4', '5', '6', '7', '8'], undefined), 8, '人数を決めていなければ名簿の人数（8人）');
  eq(SP.slotsOf(['1'], 10), 10, '人数 10（自由打順）');
  const back = ST.importData(ST.exportData(g));
  eq(back.teams[0].order, 9, '読み込み：打順の人数もそのまま');
}

section('集計（打者・投手）');
{
  tt = 0;
  const g = game();
  rec(g, '1b'); rec(g, 'bb'); rec(g, 'k'); rec(g, 'hr'); rec(g, 'sh'); rec(g, 'go');
  const b = SP.batting(g)[0];
  const r1 = b.rows.find((r) => r.no === '1'), r4 = b.rows.find((r) => r.no === '4');
  eq([r1.s.pa, r1.s.ab, r1.s.h], [1, 1, 1], '#1：1打席1打数1安打');
  eq([b.total.pa, b.total.ab, b.total.h, b.total.hr, b.total.bb, b.total.k, b.total.sac], [6, 4, 2, 1, 1, 1, 1], 'チームの合計：6打席・4打数・2安打・1本塁打・1四球・1三振・1犠打');
  eq(SP.avg(2, 4), '.500', '打率 .500');
  eq(r4.s.hr, 1, '#4 本塁打');
  const P = SP.derive(g).pitchers[1][0];
  eq([P.no, P.pitches, P.bf, P.h, P.k, P.bb, P.r, P.outs], ['18', 6, 6, 2, 1, 1, 3, 3], '投手 #18：6球・6人・被安打2・奪三振1・与四球1・失点3・3アウト');
  eq([SP.ipText(3), SP.ipText(16), SP.ipText(2)], ['1', '5 1/3', '2/3'], '投球回の書き方');
  eq(ST.scoreText(g), '3 − 0', '得点の文字');
}

section('CSV・書き出し・読み込み');
{
  tt = 0;
  const g = game();
  rec(g, 'b'); rec(g, '1b'); rec(g, 'hr');
  const rows = SP.csvEvents(g);
  eq(rows[0].slice(0, 6), ['No', '時刻', 'スタートからの秒', 'イニング', '表裏', 'アウト（前）'], '記録の一覧の見出し');
  eq(rows[3].slice(3, 11), [1, '表', 0, '致遠館', 2, '2', '', '本塁打（2点）'], '本塁打の行：1回表・0アウト・2番 #2・2点');
  const bat = SP.csvBatting(g);
  ok(bat[0][13] === '打率' && bat.some((r) => r[2] === '2' && r[9] === 1), '打者の集計に本塁打');
  const pit = SP.csvPitching(g);
  eq(pit[1].slice(0, 4), ['城南', '18', '', 3], '投手の集計：#18 3球');
  const out = ST.exportData(g);
  ok(out.format === 'sports-tap' && out.sport === 'baseball' && out.scoreText === '2 − 0', '書き出す JSON の形');
  eq([out.events[2].inning, out.events[2].half, out.events[2].runs], [1, '表', 2], '記録にイニング・表裏・得点も付く');
  eq(out.linescore, [[2], []], 'スコアボード');
  const back = ST.importData(JSON.stringify(out));
  eq([back.teams[0].pitcher, back.teams[1].pitcher, back.teams[0].players.map((p) => p.no).join(), ST.scoreText(back)], ['1', '18', '1,2,3,4,5,6,7,8,9', '2 − 0'], '読み込み：先発投手・打順・得点がそのまま');
  const g3 = game();
  ST.addEvent(g3, { t: 3, type: 'base', team: 0, base: 1, on: true });
  const back3 = ST.importData(ST.exportData(g3));
  eq([back3.events[0].base, back3.events[0].on], [1, true], '読み込み：走者の記録も');
}

console.log(`\n${pass} ok / ${fail} fail`);
process.exit(fail ? 1 : 0);
