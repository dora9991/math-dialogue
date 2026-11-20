// 場面の計算（画面なし）：場面の長さ・動画の長さで切る・手直し・外す・しぼりこみ・続けて再生のつなぎ方・まとめの長さ
//   node tests/unit-scenes.cjs
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');
const ctx = vm.createContext({ console });
['js/lib/core.js', 'js/lib/bs-core.js', 'js/lib/taplog.js', 'js/sc-scenes.js'].forEach((f) => vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f }));
const { BT, SC } = ctx;
const C = SC.scenes.core;
let pass = 0, fail = 0;
const ok = (c, name, extra) => { if (c) { pass++; console.log('  ok  ', name); } else { fail++; console.log('  FAIL', name, extra !== undefined ? JSON.stringify(extra) : ''); } };
const eq = (a, b, name) => ok(JSON.stringify(a) === JSON.stringify(b), name, { got: a, want: b });
const section = (t) => console.log('\n■ ' + t);
const clone = (o) => JSON.parse(JSON.stringify(o));
const PREFS = { win: { lead: 10, lag: 2, by: { reb: { lead: 5, lag: 2 }, mark: { lead: 5, lag: 2 } } }, reelMax: 24 };

function mkGame() {
  const g = BT.newGame({ teams: [{ name: 'ミライ', color: '#2f6fed', players: [{ no: '4', name: '' }, { no: '7', name: 'たけし' }] }, { name: 'ヒガシ', color: '#d93636', players: [] }] });
  g.mode = 'video';
  BT.addEvent(g, { t: 0, type: 'period', period: 1 });
  const add = (t, type, team, no) => BT.addEvent(g, { t, type, team, no });
  add(30, 'fg2', 0, '7');        // e2
  add(3, 'fg3x', 0, '4');        // e3（動画のはじめ近く：0 で切る）
  add(34, 'oreb', 0, '4');       // e4（リバウンド：前 5 秒）
  add(50, 'fg2', 1, null);       // e5 相手の得点
  add(60, 'mark', null, null);   // e6 ★
  add(70, 'ft', 0, null);        // e7 番号なし
  BT.addEvent(g, { t: 80, type: 'period', period: 2 });     // e8 ピリオドは場面ではない
  add(90, 'stl', 0, '7');        // e9（2Q）
  add(118.5, 'fg3', 0, '7');     // e10（動画の終わり近く：120 で切る）
  return g;
}

section('場面の長さ（プレーごと）');
{
  const g = mkGame();
  const all = C.list(g, PREFS, null, 120);
  eq(all.map((s) => s.id), ['e3', 'e2', 'e4', 'e5', 'e6', 'e7', 'e9', 'e10'], '場面は、記録の時刻の順（ピリオドは入らない）');
  const by = {}; all.forEach((s) => { by[s.id] = s; });
  eq([by.e2.t0, by.e2.t1, by.e2.len], [20, 32, 12], 'ふつう：前 10 秒・後 2 秒（2P成功 0:30 → 0:20〜0:32）');
  eq([by.e4.t0, by.e4.t1], [29, 36], 'リバウンド：前 5 秒');
  eq([by.e6.t0, by.e6.t1], [55, 62], '★：前 5 秒');
  eq([by.e3.t0, by.e3.t1], [0, 5], '動画のはじめより前は 0 で切る');
  eq([by.e10.t0, by.e10.t1], [108.5, 120], '動画の終わりより後は、動画の長さで切る');
  eq(C.list(g, PREFS, null, 0).find((s) => s.id === 'e10').t1, 120.5, '動画の長さが分からないときは、終わりを切らない');
  const p2 = clone(PREFS); p2.win.lead = 6; p2.win.lag = 3; p2.win.by.score = { lead: 8, lag: 1 };
  const b2 = {}; C.list(g, p2, null, 120).forEach((s) => { b2[s.id] = s; });
  eq([b2.e2.t0, b2.e2.t1, b2.e9.t0, b2.e9.t1, b2.e4.t0], [22, 31, 84, 93, 29], '設定：得点だけ 前 8・後 1、ほかは ふつう（前 6・後 3）、リバウンドは 前 5 のまま');
  eq([by.e2.who, by.e2.what, by.e2.label, by.e2.sub, by.e2.color], ['#7 たけし', '2P成功', '#7 たけし 2P成功', '1Q 0:30', '#2f6fed'], '札：だれ・何・「1Q 0:30」・自分の色');
  eq([by.e5.who, by.e5.what, by.e5.label, by.e5.color, by.e5.team], ['', '相手の得点（2点）', 'ヒガシの得点（2点）', '#d93636', 1], '相手の得点：「相手の得点（2点）」・相手の色');
  eq([by.e6.team, by.e6.label, by.e9.sub, by.e7.who], [null, '★ あとで見る', '2Q 1:30', ''], '★ はチームなし・2Q の場面・番号なし');
}

section('手直し（はじめ・おわり）と 外す');
{
  const g = mkGame();
  const e2 = BT.findEvent(g, 'e2');
  ok(C.adjust(g, PREFS, 'e2', 'd0', -1, 120) && C.adjust(g, PREFS, 'e2', 'd0', -1, 120), 'はじめを 2 回、1 秒前に');
  ok(C.adjust(g, PREFS, 'e2', 'd1', 1, 120), 'おわりを 1 秒後に');
  eq(g.sceneAdj, { e2: { d0: -2, d1: 1 } }, 'game.sceneAdj に { d0: -2, d1: 1 }');
  const w = C.windowOf(g, PREFS, e2, 120);
  eq([w.t0, w.t1], [18, 33], '場面が 0:18〜0:33 になる');
  const s = C.list(g, PREFS, null, 120).find((x) => x.id === 'e2');
  eq([s.len, s.adj], [15, { d0: -2, d1: 1 }], '長さ 15 秒・手直しの印');
  C.adjust(g, PREFS, 'e2', 'd0', 1, 120); C.adjust(g, PREFS, 'e2', 'd0', 1, 120); C.adjust(g, PREFS, 'e2', 'd1', -1, 120);
  ok(!('sceneAdj' in g), '0 に戻すと、sceneAdj から消える', g.sceneAdj);
  ok(!C.canAdjust(g, PREFS, BT.findEvent(g, 'e3'), 120).s0m, 'はじめが 0 の場面は、それより前にできない');
  C.adjust(g, PREFS, 'e3', 'd0', 1, 120);
  eq(C.windowOf(g, PREFS, BT.findEvent(g, 'e3'), 120).t0, 1, '0 で切られた場面のはじめを 1 秒後に → 0:01（見た目どおり 1 秒動く）');
  C.adjust(g, PREFS, 'e3', 'd0', -1, 120);
  ok(!g.sceneAdj, '戻すと消える（0 で切られた場面でも）', g.sceneAdj);
  ok(!C.canAdjust(g, PREFS, BT.findEvent(g, 'e10'), 120).s1p && !C.adjust(g, PREFS, 'e10', 'd1', 1, 120), '終わりが動画の終わりの場面は、それより後にできない');
  const p1 = clone(PREFS); p1.win.lead = 1; p1.win.lag = 1;
  ok(C.adjust(g, p1, 'e2', 'd0', 1, 120) && !C.adjust(g, p1, 'e2', 'd0', 1, 120) && !C.canAdjust(g, p1, e2, 120).s1m, '場面は 1 秒より短くできない');
  C.resetAdj(g, 'e2');
  ok(!g.sceneAdj, 'はじめに戻す（resetAdj）');
  C.setOff(g, 'e4', true);
  eq(g.sceneOff, { e4: true }, '外す → game.sceneOff');
  ok(C.list(g, PREFS, null, 120).find((x) => x.id === 'e4').on === false, '外した場面は on: false（一覧には残る）');
  C.setOff(g, 'e4', false);
  ok(!g.sceneOff, '入れ直すと消える');
}

section('しぼりこみ');
{
  const g = mkGame();
  const ids = (f) => C.list(g, PREFS, f, 120).map((s) => s.id);
  eq(ids(null), ['e3', 'e2', 'e4', 'e5', 'e6', 'e7', 'e9', 'e10'], 'なし：全部（自分・相手の得点・★）');
  eq(ids({ types: ['fg2', 'fg2x'], nos: null, team: null }), ['e2', 'e5'], 'types：2P（自分と相手）');
  eq(ids({ types: ['fg2', 'fg2x'], nos: null, team: 0 }), ['e2'], 'types＋team 0：自分の 2P');
  eq(ids({ types: null, nos: null, team: 1 }), ['e5'], 'team 1：相手だけ（★ は入らない）');
  eq(ids({ types: null, nos: null, team: 0 }), ['e3', 'e2', 'e4', 'e7', 'e9', 'e10'], 'team 0：自分だけ（★ は入らない）');
  eq(ids({ types: ['mark'], nos: null, team: null }), ['e6'], '★ は team が null のときだけ');
  eq(ids({ types: ['mark'], nos: null, team: 0 }), [], '★ は team 0 では入らない');
  eq(ids({ types: null, nos: ['7'], team: null }), ['e2', 'e9', 'e10'], 'nos：#7');
  eq(ids({ types: null, nos: ['4', '7'], team: null }), ['e3', 'e2', 'e4', 'e9', 'e10'], 'nos：#4 と #7');
  eq(ids({ types: null, nos: [''], team: null }), ['e7'], "nos ['']：番号なし（自分のチーム）");
  eq(ids({ types: ['fg2', 'fg3', 'ft'], nos: ['7'], team: 0 }), ['e2', 'e10'], '#7 の得点');
  const ch = C.chips(g, C.cleanFilter(null));
  eq(ch.plays.map((c) => [c.id, c.n]), [['all', 8], ['score', 3], ['shot', 4], ['reb', 1], ['stl', 1], ['mark', 1], ['opp', 1]], 'プレーのボタン：ある記録のものだけ・数');
  eq(ch.players.map((c) => [c.label, c.n]), [['全員', 8], ['#4', 2], ['#7', 3], ['番号なし', 1]], '選手のボタン：全員・#4・#7・番号なし');
  const ch7 = C.chips(g, C.cleanFilter({ nos: ['7'] }));
  eq(ch7.plays.filter((c) => c.n).map((c) => [c.id, c.n]), [['all', 3], ['score', 2], ['shot', 2], ['stl', 1]], '#7 を選ぶと、プレーの数は #7 の中で');
  ok(ch7.players.find((c) => c.key === '7').on && !ch7.players.find((c) => c.key === 'all').on, '#7 のボタンが選ばれている');
  const chs = C.chips(g, C.cleanFilter({ types: ['fg2', 'fg3', 'ft'], team: 0 }));
  eq(chs.plays.filter((c) => c.on).map((c) => c.id), ['score'], '得点（自分）のしぼりこみ → 「得点」のボタン');
  eq([C.describe(g, C.cleanFilter({ types: ['fg2', 'fg3', 'ft'], team: 0, nos: ['7'] })), C.describe(g, C.cleanFilter(null)), C.describe(g, C.cleanFilter({ types: ['fg2', 'fg3', 'ft'], team: 1 })), C.describe(g, C.cleanFilter({ types: ['fg2', 'fg2x'], nos: ['4'] }))],
    ['#7 たけし の 得点', 'すべて', '相手の得点', '#4 の 2P成功・2P失敗'], 'しぼりこみの呼び名');
}

section('続けて再生（重なる場面をつなぐ・reelMax）・まとめの長さ');
{
  const g = mkGame();
  const all = C.list(g, PREFS, null, 120);
  const r = C.reelOf(all, 24);
  eq(r.map((s) => [s.ids, s.t0, s.t1]), [[['e3'], 0, 5], [['e2', 'e4'], 20, 36], [['e5'], 40, 52], [['e6', 'e7'], 55, 72], [['e9'], 80, 92], [['e10'], 108.5, 120]],
    '重なる場面は 1 つにつなぐ（2P成功 0:20〜0:32 ＋ リバウンド 0:29〜0:36 → 0:20〜0:36）');
  eq(r[1].label, '#7 たけし 2P成功 → #4 オフェンスリバウンド', 'つないだ場面の札：「… → …」');
  const r10 = C.reelOf(all, 10);
  eq(r10.slice(1, 3).map((s) => [s.ids, s.t0, s.t1]), [[['e2'], 20, 32], [['e4'], 32, 36]], 'reelMax 10：つなぐと 16 秒 → つながずに、後ろの場面の重なりを削る');
  const g2 = mkGame(); C.setOff(g2, 'e4', true);
  eq(C.reelOf(C.list(g2, PREFS, null, 120), 24).map((s) => s.ids.join('+')), ['e3', 'e2', 'e5', 'e6+e7', 'e9', 'e10'], '外した場面は、続けて再生に入らない');
  const tot = C.total(all, 24);
  eq(tot, 5 + 16 + 12 + 17 + 12 + 11.5, 'まとめの長さ：つないだあとの長さの合計（' + tot + ' 秒）');
  eq([C.fmtLen(tot), C.fmtLen(48), C.fmtLen(60), C.fmtLen(84), C.fmtLen(3725)], ['1分14秒', '48秒', '1分', '1分24秒', '1時間2分'], '長さの書き方');
}

console.log(`\n${pass} ok / ${fail} fail`);
process.exit(fail ? 1 : 0);
