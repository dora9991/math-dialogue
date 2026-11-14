// 回帰テスト（node basket-tap/tests/unit.cjs）
// 画面を持たない部分（背番号の読み取り・記録・時刻・ピリオド・得点・集計・CSV・書き出しと読み込み・画面の並べ方）を確かめる。
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function load() {
  const ctx = { console, Math, Date, JSON };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'core.js'), 'utf8'), ctx, { filename: 'core.js' });
  return ctx.BT;
}
let pass = 0, fail = 0;
const ok = (c, name, extra) => { if (c) { pass++; console.log('  ok  ', name); } else { fail++; console.log('  FAIL', name, extra !== undefined ? JSON.stringify(extra) : ''); } };
const eq = (a, b, name) => ok(JSON.stringify(a) === JSON.stringify(b), name, { got: a, want: b });
const section = (t) => console.log('\n■ ' + t);
const BT = load();

section('背番号の読み取り');
eq(BT.parseNumbers('4-15'), ['4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15'], '「4-15」→ 4〜15');
eq(BT.parseNumbers('４〜８、２３ ００ 0 07'), ['0', '00', '4', '5', '6', '7', '8', '23'], '全角・「〜」・「、」・00 と 0 は別・07 は 7');
eq(BT.parseNumbers('12-9'), ['9', '10', '11', '12'], '逆向きの範囲も');
eq(BT.parseNumbers('100 abc 5 5'), ['5'], '100 や文字は無視・重なりは1つ');
eq(BT.formatNumbers(['4', '5', '6', '7', '9', '10', '00', '23']), '00, 4-7, 9, 10, 23', '短い文字に（3つ以上続けば範囲）');
eq(BT.normNo('０７'), '7', '前の 0 を取る');
eq([BT.normNo('00'), BT.normNo('100'), BT.normNo('x')], ['00', null, null], '00 はそのまま・3桁や文字は null');

section('試合と記録（選手の行のボタン・画面の下のボタン）');
const T0 = Date.UTC(2026, 9, 19, 6, 30, 0);
const g = BT.newGame({ now: T0, tz: 540, teams: [{ name: '致遠館', players: BT.parseNumbers('4-8').map((no) => ({ no, name: no === '7' ? 'たけし' : '' })) }, { name: '城南', color: '#2f6fed' }] });
ok(g.format === 'basket-tap' && g.version === 1 && g.date === '2026-10-19', '新しい試合の形（日付は日本時間）');
eq(BT.elapsed(g, T0 + 5000), 0, 'スタート前は 0 秒');
g.startedAt = T0;
BT.addEvent(g, { t: 0, type: 'period', period: 1 });
eq(BT.elapsed(g, T0 + 125432), 125.4, 'スタートからの秒（0.1 秒まで）');
eq(BT.ROW_TYPES, ['fg2', 'fg3', 'ft', 'reb'], '選手の行のボタン：2P・3P・FT（成功）とリバウンド');
eq(BT.GLOBAL_TYPES, ['pass', 'mark'], '画面の下のボタン：パスミス・★ あとで見る');
let ev = BT.addEvent(g, { t: 10, type: 'fg2', team: 0, no: '7' });
ok(ev.id === 'e2' && ev.team === 0 && ev.no === '7' && ev.t === 10, '「7」の行の「2P」：10 秒に #7 の 2P成功（1回で記録）');
ev = BT.addEvent(g, { t: 20, type: 'fg3', team: 1, no: '5' });
ok(ev.team === 1 && ev.no === '5', '相手 #5 の 3P成功');
ev = BT.addEvent(g, { t: 30, type: 'reb', team: 0, no: null });
ok(ev.team === 0 && ev.no === null, '「？」の行：番号なしのリバウンド（チームの記録）');
ev = BT.addEvent(g, { t: 40, type: 'pass', team: null, no: null });
ok(ev.team === null && ev.no === null, '画面の下の「パスミス」：チームなし・番号なし（時刻だけ）');
ev = BT.addEvent(g, { t: 41, type: 'mark', team: null, no: '7' });
ok(ev.team === null && ev.no === null, '★ もチームなし（チームがなければ、番号も付けない）');
ev = BT.addEvent(g, { t: 42, type: 'fg2', team: null, no: '8' });
ok(ev.team === 0 && ev.no === '8', '得点のプレーは、チームなしにできない（自分のチームにする）');
BT.removeEvent(g, ev.id);
const tl = BT.tally(g);
ok(tl['0:7:fg2'] === 1 && tl['1:5:fg3'] === 1 && tl['0::reb'] === 1 && tl['-::pass'] === 1 && tl['*:pass'] === 1 && tl['*:mark'] === 1 && !tl['0:8:fg2'], 'ボタンの右上の回数（チーム:番号:種類）', tl);
eq(BT.editTypes('fg2'), ['fg2', 'fg3', 'ft', 'reb', 'pass', 'mark'], '一覧で直すときに選べる種類（画面のボタンと同じ）');
eq(BT.editTypes('fg2x').slice(-1), ['fg2x'], '前の版の種類（2P失敗など）の記録は、その種類も選べる');

section('ピリオド・得点・集計');
BT.addEvent(g, { t: 600, type: 'period', period: 2 });
BT.addEvent(g, { t: 610, type: 'ft', team: 1, no: '5' });
BT.addEvent(g, { t: 611, type: 'ftx', team: 1, no: '5' });       // 前の版で記録した「FT失敗」も数える
BT.addEvent(g, { t: 612, type: 'reb', team: 1, no: '9' });       // 同じチームの外れの直後 → オフェンスリバウンド
BT.addEvent(g, { t: 640, type: 'fg3', team: 0, no: '99' });      // 名簿にない番号
BT.addEvent(g, { t: 650, type: 'pass', team: 0, no: '7' });      // 一覧で、チーム・番号を付けたパスミス
eq(BT.periodAt(g, 599.9), 1, '600 秒より前は 1Q');
eq(BT.periodAt(g, 600), 2, '600 秒から 2Q');
eq(BT.score(g), [5, 4], '得点：自分 2+3・相手 3+1');
eq(BT.periodScores(g).map((p) => [p.label, p.pts]), [['1Q', [2, 3]], ['2Q', [3, 1]]], 'ピリオドごとの得点');
const st = BT.stats(g);
const s7 = st[0].rows.find((x) => x.no === '7').s;
ok(s7.pts === 2 && s7.fg2m === 1 && s7.fg2a === 1, '#7：2点（2P 1/1）');
ok(st[0].rows.some((x) => x.no === '99' && x.extra), '名簿にない番号も集計に出る');
ok(st[0].unknown.reb === 1 && st[0].unknown.pass === 0, '番号なしのリバウンドは「番号なし」に');
ok(st[0].rows.find((x) => x.no === '7').s.pass === 1 && st[0].total.pass === 1 && st[1].total.pass === 0, 'チームを付けたパスミスは、その選手に');
ok(BT.hasMisses(g) && !BT.hasMisses({ events: [{ type: 'fg2' }, { type: 'reb' }] }), '外れたシュートの記録があるか（前の版の記録だけ。いまの画面は成功だけ）');
const free = BT.teamlessStats(g);
ok(free.pass === 1 && free.mark === 1 && free.pts === 0, 'チームなし（画面の下のボタン）：パスミス 1・★ 1', free);
const s5 = st[1].rows.find((x) => x.no === '5');
ok(s5 && s5.s.pts === 4 && s5.s.ftm === 1 && s5.s.fta === 2 && s5.s.fg3m === 1, '相手 #5：3P 1/1・FT 1/2 で 4 点');
ok(st[1].rows.find((x) => x.no === '9').s.oreb === 1, '同じチームの外れの直後のリバウンドは、オフェンスリバウンド');
ok(st[0].total.oreb === 0, '相手の外れのあとのリバウンドは、オフェンスにしない');
// ピリオドを押し忘れても、ピリオドの時刻を直せば、そのあとの記録が全部そのピリオドになる
const pe = g.events.find((e) => e.type === 'period' && e.period === 2);
pe.t = 30;
eq(BT.periodScores(g).map((p) => [p.label, p.pts]), [['1Q', [2, 3]], ['2Q', [3, 1]]], 'ピリオドの時刻を 30 秒に直しても、30 秒より前の得点は 1Q のまま');
eq(BT.periodAt(g, 35), 2, '…30 秒より後は 2Q');
pe.t = 600;

section('書き出し（JSON・CSV）と読み込み');
const ex = BT.exportData(g);
ok(ex.format === 'basket-tap' && ex.version === 1 && ex.score[0] === 5 && ex.types.fg2.label === '2P成功', 'JSON：形・得点・種類の呼び名');
ok(ex.events.every((e, i) => i === 0 || ex.events[i - 1].t <= e.t), 'JSON：記録は時刻の順');
ok(ex.events.filter((e) => e.type !== 'period').every((e) => e.period >= 1), 'JSON：ピリオドが付く');
ok(/UTC\+09:00/.test(ex.startedAtText) && ex.startedAtText.startsWith('2026-10-19 15:30:00'), 'JSON：スタートの時刻（日本時間）', ex.startedAtText);
const csv = BT.eventsCSV(g).split('\r\n');
ok(csv[0].startsWith('No,時刻,スタートからの秒,ピリオド,チーム,背番号,名前,プレー,得点,致遠館の得点,城南の得点'), 'CSV：見出し');
ok(csv.some((l) => l === '1,0:10,10,1Q,致遠館,7,たけし,2P成功,2,2,0'), 'CSV：#7 の 2P成功（その時点の得点つき）', csv.slice(0, 4));
ok(csv.some((l) => l === '4,0:40,40,1Q,,,,パスミス,,2,3'), 'CSV：チームなしのパスミスは、チーム・背番号が空', csv.slice(0, 7));
const box = BT.boxCSV(g).split('\r\n');
ok(box[0].startsWith('チーム,背番号,名前,得点,2P成功,2P試投') && box.some((l) => l.startsWith('城南,合計,,4,')), '集計の CSV：見出しと合計');
ok(box.some((l) => l.startsWith('チームなし,,,0,') && l.endsWith(',1,0,0,1')), '集計の CSV：チームなしの行（パスミス・★）', box.slice(-3));
eq([BT.eventText(g, BT.findEvent(g, 'e5'), true), BT.eventText(g, BT.findEvent(g, 'e2'), true)], ['パスミス', '致遠館 #7 たけし 2P成功'], '呼び名：チームなしは「パスミス」だけ');
const g2 = BT.importData(JSON.stringify(ex));
ok(g2.events.length === g.events.length && g2.startedAt === g.startedAt && BT.score(g2).join() === '5,4', '書き出した JSON を読み込むと、同じ記録・得点');
ok(BT.findEvent(g2, 'e5').team === null && BT.findEvent(g2, 'e6').team === null, '読み込んでも、チームなしの記録はチームなしのまま');
{
  // 撮影しながら記録した動画の情報（中身はブラウザの中。記録には、ファイル名・録画を始めた時刻・長さ）
  const gv = JSON.parse(JSON.stringify(g));
  gv.videos = [{ vid: 'va', n: 1, startedAt: T0 - 2150, endedAt: T0 + 600000, duration: 602.15, name: 'x_動画1.mp4', mime: 'video/mp4', w: 1280, h: 720, bytes: 123, status: 'done' }, { vid: 'vb', n: 2, startedAt: T0 + 700000, gone: true }];
  ok(BT.summary(gv).videos === 1, '試合の一覧の「📹 動画 n本」は、この端末にある動画だけ');
  const exv = BT.exportData(gv);
  ok(exv.videos.length === 2 && exv.videos[0].startedAt === T0 - 2150 && exv.videos[0].name === 'x_動画1.mp4', '書き出す JSON に、動画の情報が入る');
  const gi = BT.importData(JSON.stringify(Object.assign(exv, { videos: exv.videos.concat([{ vid: 'bad' }, null]) })));
  ok(gi.videos.length === 2 && gi.videos.every((v) => v.gone) && gi.videos[0].duration === 602.15, '読み込んだ記録の動画は「この端末にはない」として残す（形の合わないものは捨てる）', gi.videos);
}
ok(g2.events.every((e) => /^e\d+$/.test(e.id)) && new Set(g2.events.map((e) => e.id)).size === g2.events.length, '読み込んだ記録の id は重ならない');
const g3 = BT.importData({ format: 'basket-tap', teams: [{ name: 'A', color: 'red', players: [{ no: '７' }, { no: 'x' }] }], events: [{ id: 'e2', t: 1, type: 'fg2', team: 0, no: 7 }, { t: 2, type: 'reb', team: 1 }, { id: 'e2', t: 3, type: 'pass', team: 0 }, { t: -1, type: 'fg2' }, { t: 4, type: 'zzz' }] });
ok(g3.events.length === 3 && new Set(g3.events.map((e) => e.id)).size === 3, '壊れた記録・知らない種類は飛ばし、id のかぶりは付け直す', g3.events.map((e) => e.id));
ok(g3.teams[0].color === '#f4f4f4' && g3.teams[0].players.length === 1 && g3.teams[0].players[0].no === '7', '色の形が違えば初期値・背番号もそろえる');
let threw = null;
try { BT.importData({ format: 'other' }); } catch (e) { threw = e.message; }
ok(threw && /バスケ タップ記録/.test(threw), 'ほかのアプリのファイルは、分かる言葉で断る', threw);
eq(BT.fileBase(g), 'バスケ記録_2026-10-19_1530_致遠館vs城南', 'ファイル名');

section('記録の画面の並べ方（BT.planLayout）');
// W×H：2つのチームを並べる場所（上と下の帯を除く）。n：チームごとの行の数（背番号＋「？」）。チームの帯の高さ 22
const plan = (W, H, n) => BT.planLayout(W, H, n, 22);
let pl = plan(390, 556, [16, 16]);
ok(pl.arr === 'side' && pl.teams.every((t) => t.c === 1 && t.r === 16 && t.bw >= 30 && t.rowH >= BT.LAYOUT.rmin), 'ふつうのスマホ（縦）・15 人ずつ：左右に並べて、上から 1 列（縦にすべらせずに全員が入る）', pl.teams);
pl = plan(390, 556, [13, 1]);
ok(pl.arr === 'stack' && pl.teams[0].c === 1 && pl.teams[0].bw > 60, '相手の背番号なし：自分のチームを画面の幅いっぱいに（相手は下に1行）', pl);
pl = plan(1180, 688, [16, 16]);
ok(pl.arr === 'side' && pl.teams.every((t) => t.c === 1 && t.rowH >= 36), 'iPad（横）：左右に並べて 1 列ずつ', pl.teams);
pl = plan(750, 244, [16, 16]);
ok(pl.arr === 'side' && pl.teams.every((t) => t.c === 2 && t.bw >= BT.LAYOUT.minBw) && pl.scroll, 'スマホの横向き：チームの中を 2 列に（高さが足りない分は、縦にすべらせる）', pl.teams);
pl = plan(320, 372, [16, 16]);
ok(pl.teams.every((t) => t.bw >= BT.LAYOUT.minBw), 'とても小さい画面でも、ボタンの幅は狭くしすぎない（縦にすべらせる）', pl);
section('選手のボタンを足す（設定：シュートの失敗・ファウル）');
eq(BT.rowTypes(), ['fg2', 'fg3', 'ft', 'reb'], 'ふだんは 2P・3P・FT・リバ（いまのまま）');
eq(BT.rowTypes({ miss: true }), ['fg2', 'fg2x', 'fg3', 'fg3x', 'ft', 'ftx', 'reb'], '失敗：それぞれの成功のとなりに「×」');
eq(BT.rowTypes({ foul: true }), ['fg2', 'fg3', 'ft', 'reb', 'foul'], 'ファウル：リバのあと');
eq(BT.rowTypes({ miss: true, foul: true }).length, 8, '両方で 8 つ');
eq(BT.rowTypes({ tov: true }), ['fg2', 'fg3', 'ft', 'reb', 'tov'], 'ターンオーバー：リバのあと');
eq(BT.rowTypes({ ast: true, stl: true, tov: true, foul: true }), ['fg2', 'fg3', 'ft', 'reb', 'ast', 'stl', 'tov', 'foul'], 'ターンオーバーは、スティールのあと・ファウルの前');
eq([BT.TYPE.tov.label, BT.TYPE.tov.btn, BT.TYPE.tov.btnShort, BT.TYPE.tov.kind, BT.TYPE.tov.pts], ['ターンオーバー', 'ターンオーバー', 'TO', 'bad', 0], 'ターンオーバーの呼び名（狭いボタンは「TO」）・得点なし');
{
  const g = BT.newGame({ now: Date.UTC(2026, 10, 14, 1, 0, 0), tz: 540, teams: [{ name: 'A', players: [{ no: '7' }] }, { name: 'B', players: [] }] });
  g.startedAt = Date.UTC(2026, 10, 14, 1, 0, 0);
  BT.addEvent(g, { t: 0, type: 'period', period: 1 });
  BT.addEvent(g, { t: 5, type: 'tov', team: 0, no: '7' });
  BT.addEvent(g, { t: 9, type: 'tov', team: 0, no: '7' });
  BT.addEvent(g, { t: 12, type: 'tov', team: 1, no: null });
  BT.addEvent(g, { t: 15, type: 'pass' });
  const st = BT.stats(g);
  eq([st[0].rows[0].s.tov, st[0].total.tov, st[1].unknown.tov, st[1].total.tov, BT.teamlessStats(g).pass], [2, 2, 1, 1, 1], 'ターンオーバーは選手・チームごとに数える（画面の下の「パスミス」は、チームなしのまま別に数える）');
  eq(BT.score(g), [0, 0], 'ターンオーバーで得点は動かない');
  ok(BT.boxCSV(g).split('\r\n')[0].split(',').includes('ターンオーバー') && !BT.boxCSV(g).includes('ミス（その他）'), '集計の CSV の見出しは「ターンオーバー」');
  ok(BT.eventsCSV(g).includes('ターンオーバー'), '一覧の CSV にも「ターンオーバー」');
  const back = BT.importData(JSON.stringify(BT.exportData(g)));
  eq(back.events.filter((e) => e.type === 'tov').length, 3, '書き出して読み込んでも、ターンオーバーは残る');
}

section('試合時間（止められる時計）');
{
  const mk = (len, stopped) => {
    const g = BT.newGame({ now: Date.UTC(2026, 10, 14, 1, 0, 0), tz: 540, teams: [{ name: 'A', players: [{ no: '7' }] }, { name: 'B', players: [] }] });
    g.startedAt = Date.UTC(2026, 10, 14, 1, 0, 0);
    BT.addEvent(g, { t: 0, type: 'period', period: 1 });
    if (len !== undefined) g.gc = BT.newClock(len, stopped);
    return g;
  };
  const at = (g, t) => { const c = BT.gameClock(g, t); return c && [c.period, c.used, c.left, c.running, c.done]; };
  eq(BT.gameClock(mk(), 30), null, '時計のない試合は null（これまでの記録は、そのまま）');
  eq(BT.newClock(600), { len: 600, ot: 300, ev: [] }, '10分のピリオド：延長は 5分');
  eq([BT.newClock(480).ot, BT.newClock(360).ot, BT.newClock(300).ot, BT.newClock(0).ot, BT.newClock(123).len], [180, 180, 180, 0, 600], '8分・6分・5分のピリオド：延長は 3分／決めないときは 0／知らない長さは 10分');
  eq(BT.newClock(600, true).ev, [{ t: 0, on: 0 }], '動画を見ながら記録：はじめは止めておく');
  let g = mk(600);
  eq(at(g, 0), [1, 0, 600, true, false], 'スタート：残り 10:00・動いている');
  eq(at(g, 150), [1, 150, 450, true, false], '150 秒たつと、残り 7:30');
  eq([BT.gcText(BT.gameClock(g, 150)), BT.gcLabel(BT.gameClock(g, 150))], ['7:30', '1Q 残り 7:30'], '「7:30」「1Q 残り 7:30」');
  eq([BT.gcText(BT.gameClock(g, 0.4)), BT.gcText(BT.gameClock(g, 599.5)), BT.gcText(BT.gameClock(g, 600))], ['10:00', '0:01', '0:00'], '秒は切り上げ（0:00 は、終わったときだけ）');
  let c = BT.gcToggle(g, 150);
  eq([c.running, c.left, g.gc.ev], [false, 450, [{ t: 150, on: 0 }]], '止める：その時刻に { on: 0 }');
  eq(at(g, 200), [1, 150, 450, false, false], '止まっているあいだは進まない（記録の時刻だけが進む）');
  c = BT.gcToggle(g, 210);
  eq([c.running, at(g, 220)], [true, [1, 160, 440, true, false]], '動かすと、そこからまた進む');
  eq(at(g, 100), [1, 100, 500, true, false], '前の時刻の試合時間も出せる（動画を戻したとき）');
  BT.gcToggle(g, 50);          // あとから、前の時刻で止めた（動画を戻して押した）
  eq([at(g, 120), at(g, 220)], [[1, 50, 550, false, false], [1, 60, 540, true, false]], 'あとから前の時刻で止めても、時刻の順にたどる（50 で止まり、210 で動く）');
  g = mk(600);
  eq(at(g, 700), [1, 600, 0, false, true], '残り 0:00 で止まる（done）');
  eq(BT.gcToggle(g, 700), null, '終わったあとは、押しても動かない');
  BT.gcSet(g, 700, 590);
  eq([at(g, 700), at(g, 705), at(g, 720)], [[1, 590, 10, true, false], [1, 595, 5, true, false], [1, 600, 0, false, true]], '時間を合わせる（残り 10 秒に）→ そこからまた進んで、0:00 で止まる');
  eq(BT.gcSet(g, 720, -5).used, 0, '合わせる値は 0 より小さくならない');
  eq(BT.gcSet(g, 720, 9999).used, 600, 'ピリオドの長さより大きくならない');
  g = mk(600);
  BT.gcToggle(g, 400);
  BT.addEvent(g, { t: 500, type: 'period', period: 2 });
  eq([at(g, 499), at(g, 500), at(g, 530)], [[1, 400, 200, false, false], [2, 0, 600, true, false], [2, 30, 570, true, false]], '次のピリオドが始まると、10:00 に戻って動き出す（前のピリオドで止めていても）');
  BT.addEvent(g, { t: 2000, type: 'period', period: 5 });
  eq([at(g, 2010), at(g, 2400)], [[5, 10, 290, true, false], [5, 300, 0, false, true]], '延長（OT1）は 5分');
  g = mk(0);
  eq([at(g, 75), BT.gcText(BT.gameClock(g, 75)), BT.gcLabel(BT.gameClock(g, 75))], [[1, 75, null, true, false], '1:15', '1Q 1:15'], '長さを決めない：進んだ時間を数える（残りは null）');
  eq(at(g, 5000), [1, 5000, null, true, false], '長さを決めないときは、止まらない');
  g = mk(600, true);
  eq([at(g, 0), at(g, 40)], [[1, 0, 600, false, false], [1, 0, 600, false, false]], '動画を見ながら記録：はじめは止まったまま（ティップオフの前）');
  BT.gcToggle(g, 40);
  eq(at(g, 100), [1, 60, 540, true, false], '動画の 40 秒で動かすと、そこから進む');
  // 書き出し・読み込み・CSV
  g = mk(600);
  BT.gcToggle(g, 150); BT.gcToggle(g, 210); BT.gcSet(g, 300, 250);
  BT.addEvent(g, { t: 220, type: 'fg2', team: 0, no: '7' });
  const back = BT.importData(JSON.stringify(BT.exportData(g)));
  eq(back.gc, g.gc, '書き出して読み込んでも、時計は同じ');
  eq(at(back, 220), at(g, 220), '読み込んだ試合の試合時間も同じ');
  const rows = BT.eventsCSV(g).trim().split('\r\n').map((r) => r.split(','));
  eq([rows[0][rows[0].length - 1], rows[2][rows[2].length - 1]], ['試合時間（残り）', '7:20'], '一覧の CSV：時計のある試合だけ、いちばん後ろに「試合時間（残り）」');
  ok(!BT.eventsCSV(mk()).includes('試合時間'), '時計のない試合の CSV には、列を足さない');
  ok(BT.eventsCSV(mk(0)).includes('試合時間（進んだ時間）'), '長さを決めない時計は「試合時間（進んだ時間）」');
  eq(BT.cleanClock({ len: 480, ot: 120, ev: [{ t: 5, on: 1 }, { t: -1, on: 0 }, { t: 9, set: 99999 }, null, { t: 'x' }] }), { len: 480, ot: 120, ev: [{ t: 5, on: 1 }, { t: 9, set: 5999 }] }, '読み込み：形の合わないものは捨てる');
  eq([BT.cleanClock(null), BT.cleanClock({ len: 600 })], [null, null], '時計でないものは null');
}
let rs = BT.rowSpec(BT.rowTypes({ miss: true, foul: true }));
ok(rs.k === 8 && Math.abs(rs.units - 7.25) < 1e-9 && rs.minW === 0.75 && rs.weights[1] === 0.75 && rs.weights[7] === 1, '行の幅の割合：「×」は 0.75・ほかは 1', rs);
ok(['fg2x', 'fg3x', 'ftx'].every((t) => BT.TYPE[t].btn === '×') && BT.TYPE.foul.btn === 'ファウル' && BT.TYPE.foul.btnShort === 'F', 'ボタンの文字：「×」・「ファウル」（狭いときは F）');
const p4 = BT.planLayout(1180, 688, [16, 16], 22), p8 = BT.planLayout(1180, 688, [16, 16], 22, rs);
ok(JSON.stringify(BT.planLayout(1180, 688, [16, 16], 22, BT.rowSpec())) === JSON.stringify(p4), 'ふだんのボタン（4つ）では、並べ方は前と同じ');
ok(p8.teams.every((t) => t.bwMin >= BT.LAYOUT.minBw && t.bw > t.bwMin) && p8.teams[0].bw < p4.teams[0].bw, `iPad 横・ボタン 8 つ：1つずつは細く（2P ${p8.teams[0].bw.toFixed(0)}px・× ${p8.teams[0].bwMin.toFixed(0)}px）、いちばん細いボタンも狭くしすぎない`, p8.teams);
const ps8 = BT.planLayout(390, 556, [16, 16], 22, rs);
ok(ps8.teams.every((t) => t.bwMin >= BT.LAYOUT.minBw || ps8.scroll) && ps8.arr === 'stack', 'スマホ縦・ボタン 8 つ：上下に重ねて幅を使う（足りない分は縦にすべらせる）', ps8);
eq(BT.editTypes('fg2', BT.rowTypes({ miss: true, foul: true })).slice(0, 8), ['fg2', 'fg2x', 'fg3', 'fg3x', 'ft', 'ftx', 'reb', 'foul'], '一覧で直すときも、いまのボタンから選べる');
{
  const gf = BT.newGame({ teams: [{ name: 'A', players: [{ no: '4' }] }, { name: 'B' }] });
  gf.startedAt = Date.now() - 1000 * 1000;
  BT.addEvent(gf, { t: 10, type: 'foul', team: 0, no: '4' });
  BT.addEvent(gf, { t: 20, type: 'foul', team: 1, no: null });
  BT.addEvent(gf, { t: 30, type: 'foul', team: 0, no: '4' });
  BT.addEvent(gf, { t: 600, type: 'period', period: 2 });
  BT.addEvent(gf, { t: 610, type: 'foul', team: 0, no: '4' });
  BT.addEvent(gf, { t: 620, type: 'fg2x', team: 0, no: '4' });
  BT.addEvent(gf, { t: 630, type: 'fg2', team: 0, no: '4' });
  const pf = BT.periodFouls(gf);
  ok(JSON.stringify(pf.get(1)) === '[2,1]' && JSON.stringify(pf.get(2)) === '[1,0]', 'ピリオドごとのチームファウル（1Q 2・1／2Q 1・0）', Array.from(pf.entries()));
  const st = BT.stats(gf)[0].rows.find((r) => r.no === '4').s;
  ok(st.foul === 3 && st.fg2a === 2 && st.fg2m === 1 && BT.hasMisses(gf) && BT.pct(st.fg2m, st.fg2a) === '50%', '選手の集計：ファウル 3・2P 1/2（50%）', st);
  ok(BT.periodFouls(BT.newGame({ teams: [{ name: 'A' }, { name: 'B' }] })).size === 0, 'ファウルがなければ、チームファウルは出さない');
}

section('選手のボタンを足す（設定：Oリバ・Dリバ・アシスト・スティール）');
eq(BT.rowTypes({ rebSplit: true }), ['fg2', 'fg3', 'ft', 'oreb', 'dreb'], 'リバを分ける：「Oリバ」「Dリバ」の2つに（「リバ」はなくなる）');
eq(BT.rowTypes({ ast: true, stl: true }), ['fg2', 'fg3', 'ft', 'reb', 'ast', 'stl'], 'アシスト・スティール：リバのあと');
eq(BT.rowTypes({ miss: true, rebSplit: true, ast: true, stl: true, foul: true }), ['fg2', 'fg2x', 'fg3', 'fg3x', 'ft', 'ftx', 'oreb', 'dreb', 'ast', 'stl', 'foul'], '全部を足すと 11 こ（ファウルはいちばん後ろ）');
ok(BT.TYPE.oreb.btn === 'Oリバ' && BT.TYPE.oreb.btnShort === 'OR' && BT.TYPE.dreb.btn === 'Dリバ' && BT.TYPE.dreb.btnShort === 'DR' && BT.TYPE.ast.btnShort === 'AS' && BT.TYPE.stl.btn === 'スティール' && BT.TYPE.stl.btnShort === 'ST',
  'ボタンの文字：Oリバ・Dリバ・アシスト・スティール（狭いときは OR・DR・AS・ST）');
ok(Math.abs(BT.textEm('Oリバ') - 2.62) < 1e-9 && BT.textEm('スティール') === 5 && BT.textEm('ファウル') === 4, '文字の幅の目安（全角 1・半角 0.62。長い文字のボタンの文字の大きさに使う）');
eq(BT.editTypes('fg2', BT.rowTypes({ rebSplit: true, ast: true, stl: true })).slice(0, 7), ['fg2', 'fg3', 'ft', 'oreb', 'dreb', 'ast', 'stl'], '一覧で直すときも、いまのボタンから選べる');
{
  const go = BT.newGame({ teams: [{ name: 'A', players: [{ no: '4' }, { no: '5' }] }, { name: 'B', players: [{ no: '9' }] }] });
  go.startedAt = Date.now() - 1000 * 1000;
  BT.addEvent(go, { t: 10, type: 'fg2x', team: 0, no: '4' });
  BT.addEvent(go, { t: 12, type: 'oreb', team: 0, no: '5' });
  BT.addEvent(go, { t: 14, type: 'fg2', team: 0, no: '5' });
  BT.addEvent(go, { t: 15, type: 'ast', team: 0, no: '4' });
  BT.addEvent(go, { t: 30, type: 'fg3x', team: 1, no: '9' });
  BT.addEvent(go, { t: 32, type: 'dreb', team: 0, no: '4' });
  BT.addEvent(go, { t: 40, type: 'stl', team: 0, no: '5' });
  BT.addEvent(go, { t: 50, type: 'fg2x', team: 0, no: '4' });
  BT.addEvent(go, { t: 52, type: 'reb', team: 0, no: '4' });        // 分けずに「リバ」で記録：同じチームの外れの 10 秒以内 → オフェンスに数える
  const [A] = BT.stats(go);
  const s4 = A.rows.find((r) => r.no === '4').s, s5 = A.rows.find((r) => r.no === '5').s;
  ok(s4.reb === 2 && s4.oreb === 1 && s4.dreb === 1 && s4.ast === 1 && s4.fg2a === 2, '#4：リバウンド 2（うち O 1＝分けずに記録した分・D 1）・アシスト 1', s4);
  ok(s5.reb === 1 && s5.oreb === 1 && s5.dreb === 0 && s5.stl === 1 && s5.pts === 2, '#5：Oリバ 1・スティール 1・2点', s5);
  ok(A.total.reb === 3 && A.total.oreb === 2 && A.total.dreb === 1, 'チームの合計：リバウンド 3（O 2・D 1）', A.total);
  ok(BT.offensiveRebounds(go).size === 1, '「Oリバ」の後は、前の外れを使い終わる（分けずに記録した「リバ」だけを推し量る）');
  ok(BT.hasRebSplit(go) && !BT.hasRebSplit(BT.newGame({ teams: [{ name: 'A' }, { name: 'B' }] })), '「Oリバ」「Dリバ」の記録があるか（集計の OR・DR の列）');
  const bx = BT.boxCSV(go).split('\r\n');
  ok(bx[0].includes('リバウンド,うちオフェンス,うちディフェンス,アシスト,スティール') && bx.includes('A,4,,0,0,2,0,0,0,0,2,1,1,1,0,0,0,0,0,0'), '集計の CSV：うちディフェンスの列', bx.slice(0, 3));
  const gi = BT.importData(JSON.stringify(BT.exportData(go)));
  ok(['oreb', 'dreb', 'ast', 'stl'].every((t) => gi.events.some((e) => e.type === t)) && BT.exportData(go).types.oreb.label === 'オフェンスリバウンド', '書き出して読み込んでも、Oリバ・Dリバ・アシスト・スティールのまま（JSON に呼び名も入る）');
}

section('1つのチームだけの並べ方（BT.planTeam。ワイプ「特大」）');
// W×H：チームの枠の外側の大きさ。n：行の数
let pt = BT.planTeam(600, 744, 13, 22);
ok(pt.c === 1 && pt.r === 13 && !pt.scroll && pt.rowH >= 44 && pt.bw >= 100, 'iPad 横の左側（600×744）・12 人＋？：1 列・すべらない・大きなボタン', pt);
pt = BT.planTeam(560, 300, 13, 22, 4);
ok(pt.c >= 2 && !pt.scroll && pt.bw >= BT.LAYOUT.minBw, '映像の下の相手チーム（560×300）・12 人＋？：列を増やして入れる（すべらない）', pt);
pt = BT.planTeam(643, 230, 13, 22, 4);
ok(pt.c === 3 && !pt.scroll && pt.rowH >= 30, 'すべらずに入る並べ方があれば、列が多くてもそちら（643×230：3 列・すべらない）', pt);
pt = BT.planTeam(560, 80, 1, 22, 4);
ok(pt.c === 1 && pt.r === 1 && !pt.scroll, '相手の背番号なし（チームの1行だけ）：1 行', pt);
pt = BT.planTeam(380, 70, 13, 22, 4);
ok(pt.scroll && pt.bw >= BT.LAYOUT.minBw, '入りきらないとき：ボタンの幅は狭くしすぎず、縦にすべらせる', pt);
pt = BT.planTeam(250, 400, 13, 22, 4);
ok(pt.bw >= BT.LAYOUT.minBw && pt.c === 1, '幅が狭いときは、列を増やさない（ボタンの幅を保つ）', pt);
eq([BT.inkOn('#f4f4f4'), BT.inkOn('#1f2f6e'), BT.inkOn('#f2c230')], ['#111111', '#ffffff', '#111111'], 'チームの色の上の文字の色（読みやすいほう）');

section('撮った動画を見ながら記録した試合（mode: video）・💬 コメント');
{
  const gv = BT.newGame({ teams: [{ name: 'A', players: [{ no: '4' }] }, { name: 'B' }], now: Date.UTC(2026, 10, 3, 6, 0) });
  gv.startedAt = Date.UTC(2026, 10, 3, 6, 0);
  Object.assign(gv, { mode: 'video', src: { name: 'IMG_0001.MOV', size: 1234, duration: 2700.5, w: 1920, h: 1080 }, rvPos: 61.2,
    notes: [{ id: 'n1', t: 30.123, dur: 5, text: ' ヘルプ！ ', stamps: ['👍'], tags: ['ヘルプ'], at: 1 }, { id: 'n2', t: 40, text: '', stamps: [] }, { id: 'zz', t: 50, text: '声', stamps: [], dur: 99 }] });
  gv.videos = [{ vid: 'file1', n: 1, startedAt: gv.startedAt, duration: 2700.5, name: 'IMG_0001.MOV', status: 'done', gone: true, file: true }];
  BT.addEvent(gv, { t: 0, type: 'period', period: 1 });
  BT.addEvent(gv, { t: 1500.25, type: 'fg2', team: 0, no: '4' });
  BT.addEvent(gv, { t: 12.3, type: 'fg3', team: 1, no: null });          // 動画を戻して、前の場面を記録（時刻の順でなくてよい）
  ok(BT.isReview(gv) && !BT.isReview(BT.newGame({})), 'BT.isReview：動画を見ながら記録した試合か');
  eq(BT.score(gv, 100), [0, 3], '得点は、動画の時刻まで（BT.score の until）');
  eq(BT.sorted(gv).map((e) => e.t), [0, 12.3, 1500.3], '一覧・書き出しは時刻の順（記録した順ではなく）');
  const ex = BT.exportData(gv);
  ok(ex.mode === 'video' && ex.src.name === 'IMG_0001.MOV' && ex.notes.length === 3 && ex.videos[0].file === true && ex.videos[0].startedAt === ex.startedAt, '書き出す JSON：mode・src・notes・videos（file: true・startedAt が記録と同じ）', ex);
  const gi = BT.importData(JSON.stringify(ex));
  ok(gi.mode === 'video' && gi.src.duration === 2700.5 && gi.src.w === 1920 && gi.videos[0].file === true && gi.videos[0].gone === true, '読み込んでも、動画を見ながら記録した試合のまま（動画の情報も）', { mode: gi.mode, src: gi.src, v: gi.videos });
  eq(gi.notes.map((n) => [n.id, n.t, n.dur, n.text, n.stamps.join('')]), [['n1', 30.12, 5, 'ヘルプ！', '👍'], ['n2', 50, 30, '声', '']], 'コメント：文もスタンプもないものは捨てる・id のないものに番号・出す長さは 30 秒まで');
  eq(BT.cleanNotes([{ id: 'n2', t: 1, text: 'a' }, { id: 'n2', t: 2, text: 'b' }, { t: 3, text: 'c' }]).map((n) => n.id), ['n2', 'n3', 'n4'], 'コメントの id がかぶっていたら付け直す');
  const plain = BT.importData(JSON.stringify(BT.exportData(BT.importData(JSON.stringify(Object.assign({}, ex, { mode: undefined, notes: undefined }))))));
  ok(!plain.mode && !plain.src && !plain.notes, 'ふつうの記録には、mode・src・notes を足さない');
  ok(BT.summary(gv).rv === true && BT.summary(plain).rv === false, '試合の一覧に「動画を見ながら」の印（summary.rv）');
}
{
  // コメントの絵・形は、バスケ得点クリップと同じもの（js/notes.js をそのまま写して使う）
  const a = fs.readFileSync(path.join(__dirname, '..', 'js', 'notes.js'), 'utf8');
  const b = fs.readFileSync(path.join(__dirname, '..', '..', 'basket-clips', 'js', 'notes.js'), 'utf8');
  ok(a === b, 'js/notes.js は basket-clips/js/notes.js と同じ（直したら、両方に写す）');
}
eq(BT.fmtTime(3725.46, true), '1:02:05.5', '時刻の書式（1時間以上・0.1 秒）');

section('1本にまとめた版：切り出し・クラウド');
{
  // 切り出しの部品は、バスケ得点クリップのものを写して使う（直したら、両方に）
  ['taplog', 'media', 'mp4', 'export'].forEach((f) => {
    const a2 = fs.readFileSync(path.join(__dirname, '..', 'js', 'clip', f + '.js'), 'utf8').split('\n').slice(1).join('\n');
    const b2 = fs.readFileSync(path.join(__dirname, '..', '..', 'basket-clips', 'js', f + '.js'), 'utf8');
    ok(a2 === b2, `js/clip/${f}.js は basket-clips/js/${f}.js と同じ`);
  });
  // 切り出した印（試合の一覧の「✓ 切り出しずみ」・ホームの「✂️ 切り出し待ち」）
  const g = BT.newGame({ now: T0, tz: 540 });
  g.startedAt = T0; g.endedAt = T0 + 60000;
  BT.addEvent(g, { t: 0, type: 'period', period: 1 });
  BT.addEvent(g, { t: 12.3, type: 'fg2', team: 0, no: '7' });
  ok(BT.summary(g).trim === false, '切り出す前は summary.trim が false');
  g.trims = { 'game.mp4|123': { anchors: [{ t: 0, v: 3 }], how: 'manual', view: { teams: [true, true], groups: {}, players: [] }, off: {}, adds: [], win: { lead: 10, lag: 2, by: {} } } };
  g.trimmed = true; g.trimLast = 'game.mp4|123';
  ok(BT.summary(g).trim === true, '切り出したら summary.trim が true');
  const back = BT.importData(JSON.parse(JSON.stringify(BT.exportData(g))));
  eq([back.trimmed, back.trimLast, back.trims['game.mp4|123'].anchors], [true, 'game.mp4|123', [{ t: 0, v: 3 }]], '書き出して読み込んでも、時刻あわせ（trims）が残る');
  const bad = BT.importData(Object.assign(JSON.parse(JSON.stringify(BT.exportData(g))), { trims: { x: 1, y: { anchors: 'no' } } }));
  ok(!bad.trims && !bad.trimmed, '形の合わない trims は読み込まない');
}
section('シュートの場所（ゾーン・集計・書き出しと読み込み）');
{
  const at = (X, Y) => [X / 15, Y / 14];        // メートル → 0〜1（幅 15・奥行き 14）
  const z = (X, Y, c) => BT.shotZone(...at(X, Y), c || 'std').label;
  ok(Math.abs(BT.COURT.y3 - 2.99) < 0.01, 'コーナーのまっすぐな 3P の線は、ベースラインから約 2.99 m まで', BT.COURT.y3);
  eq([z(7.5, 1.575), z(7.5, 2.7), z(6.5, 1.0)], ['ゴール下', 'ゴール下', 'ゴール下'], 'ゴールの真下・1.25 m の半円の中はゴール下');
  eq([z(7.5, 5.8), z(9.95, 5.8), z(5.2, 3.0)], ['ペイント', 'ペイント', 'ペイント'], 'フリースローラインの真ん中・エルボー（ペイントの角）・ペイントの中は ペイント（線の上も中）');
  eq([z(7.5, 6.2), z(10.4, 6.2), z(4.6, 6.2)], ['ミドル正面', 'ミドル右', 'ミドル左'], 'フリースローラインのすぐ後ろは正面・エルボーのすぐ外は左右');
  eq([z(14.6, 0.5), z(0.4, 0.5), z(14.6, 2.9), z(0.4, 2.9)], ['3P 右コーナー', '3P 左コーナー', '3P 右コーナー', '3P 左コーナー'], '両方のコーナー（サイドラインから 0.9 m より外）は 3P コーナー');
  eq([z(14.0, 0.5), z(1.0, 2.9)], ['ミドル右', 'ミドル左'], 'コーナーでも、0.9 m の線より内側はミドル');
  eq([z(7.5, 1.575 + 6.70), z(7.5, 1.575 + 6.80)], ['ミドル正面', '3P トップ'], 'トップ：6.75 m のすぐ内側はミドル・すぐ外は 3P');
  eq([z(7.5, 1.575 + 6.75)], ['ミドル正面'], '線の上（ちょうど 6.75 m）は 2P の側');
  const r = 7.5, a45 = (s) => [7.5 + s * r * Math.SQRT1_2, 1.575 + r * Math.SQRT1_2];
  eq([z(...a45(-1)), z(...a45(1))], ['3P 左ウィング', '3P 右ウィング'], '45° の向き・7.5 m は 3P 左／右ウィング');
  eq([z(7.5, 13.9), z(0, 0), z(15, 14)], ['3P トップ', '3P 左コーナー', '3P 右ウィング'], 'センターラインの近く・コートの角も、どこかのゾーンになる');
  // ミニバス：3P はない
  const mini = BT.SHOT_ZONES('mini').map((x) => x.label);
  ok(mini.length === 8 && !mini.some((l) => /3P/.test(l)) && mini.includes('ロング正面'), 'ミニバスのゾーン：3P がなく、ロング左／正面／右', mini);
  eq([z(7.5, 1.575 + 6.80, 'mini'), z(14.6, 0.5, 'mini'), z(...a45(-1), 'mini'), z(7.5, 6.2, 'mini'), z(7.5, 2.0, 'mini')], ['ロング正面', 'ロング右', 'ロング左', 'ミドル正面', 'ゴール下'], 'ミニバス：6.75 m より遠いと ロング（コーナーも）');
  eq(BT.SHOT_ZONES('std').map((x) => x.id), ['rim', 'paint', 'midL', 'midC', 'midR', 'c3L', 'w3L', 't3', 'w3R', 'c3R'], 'ふつうのゾーンの順（表の順）');
  ok(BT.isLocShot('fg2') && BT.isLocShot('fg3x') && !BT.isLocShot('ft') && !BT.isLocShot('ftx') && !BT.isLocShot('reb'), '場所を聞くのは 2P・3P（成功・失敗）だけ。フリースローは聞かない');

  // 集計
  const gs = BT.newGame({ now: T0, tz: 540, teams: [{ name: 'A', players: [{ no: '4' }, { no: '7' }] }, { name: 'B' }] });
  gs.startedAt = T0;
  BT.addEvent(gs, { t: 0, type: 'period', period: 1 });
  const put = (t, type, team, no, X, Y) => { const e = BT.addEvent(gs, { t, type, team, no }); if (X != null) [e.x, e.y] = at(X, Y).map(BT.locRound); return e; };
  put(1, 'fg2', 0, '7', 7.5, 2.0);       // ゴール下 成功
  put(2, 'fg2x', 0, '7', 7.5, 2.2);      // ゴール下 失敗
  put(3, 'fg3', 0, '4', 14.6, 0.5);      // 右コーナー 成功
  put(4, 'fg3x', 0, '4', 7.5, 9.0);      // トップ 失敗
  put(5, 'fg2', 0, '4');                 // 場所なし
  put(6, 'ft', 0, '4');                  // フリースロー（数えない）
  put(7, 'fg2', 1, '9', 8, 4);           // 相手 ペイント
  ok(BT.hasShotLoc(gs) && !BT.hasShotLoc(g), '場所のある試合か（hasShotLoc）');
  const sA = BT.shotStats(gs, { team: 0 });
  eq([sA.byZone.rim.made, sA.byZone.rim.att, sA.byZone.c3R.made, sA.byZone.c3R.att, sA.byZone.t3.made, sA.byZone.t3.att, sA.located, sA.unlocated], [1, 2, 1, 1, 0, 1, 4, 1], 'shotStats：自分のチーム（ゴール下 1/2・右コーナー 1/1・トップ 0/1・場所あり 4・なし 1）');
  ok(sA.zones.length === 10 && sA.zones[0].id === 'rim' && sA.shots.length === 4 && sA.shots[0].zone.label === 'ゴール下' && sA.shots[1].made === false, 'zones は表の順・shots は場所のあるシュート（入ったか・ゾーン付き）');
  const s4 = BT.shotStats(gs, { team: 0, no: '4' });
  eq([s4.located, s4.unlocated, s4.byZone.rim.att], [2, 1, 0], 'shotStats：#4 だけ（場所あり 2・なし 1）');
  const sB = BT.shotStats(gs, { team: 1 });
  eq([sB.byZone.paint.made, sB.located], [1, 1], 'shotStats：相手（ペイント 1）');
  eq(BT.shotStats(gs).located, 5, 'チームを決めなければ両方');
  eq(BT.shotStats(gs, { court: 'mini' }).byZone.longC.att, 1, 'ミニバスのコートで数えると、トップの 3P は「ロング正面」');

  // CSV：場所のある試合だけ、いちばん後ろに3つの列
  const cs = BT.eventsCSV(gs).split('\r\n');
  ok(cs[0].startsWith('No,時刻,スタートからの秒,ピリオド,チーム,背番号,名前,プレー,得点,Aの得点,Bの得点,場所X,場所Y,場所（ゾーン名）'), 'CSV：見出しのいちばん後ろに 場所X・場所Y・場所（ゾーン名）', cs[0]);
  ok(cs.some((l) => l === '3,0:03,3,1Q,A,4,,3P成功,3,5,0,0.973,0.036,3P 右コーナー') && cs.some((l) => l === '5,0:05,5,1Q,A,4,,2P成功,2,7,0,,,'), 'CSV：場所のある記録は X・Y・ゾーン、ない記録は空', cs.slice(0, 8));
  ok(BT.eventsCSV(g).split('\r\n')[0].endsWith('致遠館の得点,城南の得点'), '場所のない試合の CSV は、前と同じ（列を足さない）');

  // 書き出しと読み込み
  gs.court = 'std';
  const exs = BT.exportData(gs);
  const e3 = exs.events.find((e) => e.t === 3);
  ok(e3.x === 0.973 && e3.y === 0.036 && exs.court === 'std', '書き出す JSON に x・y（とコートの種類）が残る', e3);
  const gi = BT.importData(JSON.parse(JSON.stringify(exs)));
  eq(BT.shotStats(gi, { team: 0 }).byZone.rim.att, 2, '読み込んでも場所が残る（集計が同じ）');
  ok(gi.court === 'std', '読み込んでもコートの種類が残る');
  const bad = BT.importData({ format: 'basket-tap', court: 'nba', teams: [{}, {}], events: [
    { id: 'e1', t: 1, type: 'fg2', team: 0, x: 0.123456, y: 0.5 },
    { id: 'e2', t: 2, type: 'ft', team: 0, x: 0.5, y: 0.1 },
    { id: 'e3', t: 3, type: 'fg3', team: 0, x: 1.2, y: 0.5 },
    { id: 'e4', t: 4, type: 'fg2x', team: 0, x: '0.5', y: 0.5 },
    { id: 'e5', t: 5, type: 'reb', team: 0, x: 0.5, y: 0.5 },
    { id: 'e6', t: 6, type: 'fg3x', team: 1, x: 0, y: 1 },
    { id: 'e7', t: 7, type: 'fg2', team: 0, x: NaN, y: 0.5 }] });
  const loc = bad.events.map((e) => (e.x === undefined && e.y === undefined ? '-' : `${e.x},${e.y}`));
  eq(loc, ['0.123,0.5', '-', '-', '-', '-', '0,1', '-'], '読み込み：x・y は 2P・3P で 0〜1 の数のときだけ残す（0.001 にまるめる。フリースロー・リバ・範囲外・文字・NaN は捨てる）');
  ok(bad.court === undefined, '知らないコートの種類は読み込まない');
}

section('設定のはじめ（シュートの場所）');
{
  const ctx = { console, Math, Date, JSON };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  ['core.js', 'store.js'].forEach((f) => vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8'), ctx, { filename: f }));
  const p = ctx.BT.store.prefs();
  ok(p.shotLoc === false && p.courtType === 'std', 'shotLoc はオフ・courtType は std（ふつう）', { shotLoc: p.shotLoc, courtType: p.courtType });
}
{
  // 合言葉（クラウド）：16 文字・まぎらわしい文字なし。「-」・小文字・空白を許す
  const ctx = { console, Math, Date, JSON, Uint8Array, crypto: require('crypto').webcrypto };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  ['core.js', 'store.js', 'cloud.js'].forEach((f) => vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8'), ctx, { filename: f }));
  const C = ctx.BT.cloud;
  const k = C.newKey();
  ok(/^[2-9A-HJKMNP-Z]{16}$/.test(k), '新しい合言葉は 16 文字（0・1・I・L・O を使わない）', k);
  eq(C.normKey(k.toLowerCase().replace(/(.{4})(?=.)/g, '$1-')), k, '小文字・「-」区切りで入れても同じ合言葉');
  eq([C.normKey('ABCD'), C.normKey('ABCD-EFGH-JKMN-PQR1'), C.normKey('')], [null, null, null], '短い・使わない文字（1）・空は null');
  eq(C.showKey('ABCDEFGHJKMNPQRS'), 'ABCD-EFGH-JKMN-PQRS', '見せるときは 4 文字ずつ「-」');
}
(async () => {
  // 場面パック（js/license.js）：保存場所・時計・通信をさしかえて、使えるかの判定を確かめる
  section('場面パック（購入コード・お試し 3 試合）');
  const ctx = { console, Math, Date, JSON, Uint8Array, Promise, setTimeout, clearTimeout, crypto: require('crypto').webcrypto };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  ['core.js', 'license.js'].forEach((f) => vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8'), ctx, { filename: f }));
  const mem = () => { const m = {}; return { getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: (k) => { delete m[k]; }, m }; };
  let clock = Date.UTC(2026, 10, 12);
  const DAYMS = 86400000;
  let reply = { ok: true, club: 'テストクラブ', plan: 'scene', expires_at: new Date(clock + 200 * DAYMS).toISOString() }, netDown = false, calls = 0;
  const fakeFetch = async () => { calls++; if (netDown) throw new Error('down'); return { ok: true, json: async () => reply }; };
  const mk = (mode) => { const st = mem(); return { st, L: ctx.BT.license.make({ storage: st, now: () => clock, fetch: fakeFetch, mode, online: () => true }) }; };
  const G = (id) => ({ id, date: '2026-11-0' + id, teams: [{ name: 'A' }, { name: 'B' }], events: [] });

  { // off：いつも通す・何も数えない・何も保存しない
    const { st, L } = mk('off');
    ok(L.MODE === 'off' && ctx.BT.license.MODE === 'off', 'MODE の初期値は off');
    ok([1, 2, 3, 4, 5].every((i) => L.use('trim', G(i))) && L.can('shot', G(9)), 'off：何試合でも使える');
    eq(Object.keys(st.m), [], 'off：何も保存しない（btap:trial もなし）');
  }
  { // on：お試し 3 試合
    const { st, L } = mk('on');
    ok(L.can('trim', G(1)) && Object.keys(st.m).length === 0, 'can は何も書かない（副作用なし）');
    ok(L.use('trim', G(1)) && L.use('trim', G(2)) && L.use('trim', G(2)), '同じ試合をもう一度使っても、枠は減らない');
    eq([L.status().trialUsed, L.status().trialLeft], [2, 1], '2 試合数えた・あと 1');
    ok(L.use('shot', G(3)) && L.status().trialLeft === 0, '3 試合目まで通る（機能名はどれでも同じ）');
    ok(!L.can('trim', G(4)) && !L.use('trim', G(4)), '4 試合目は通らない');
    ok(L.use('trim', G(1)) && L.can('trim', G(3)), '数えた試合は、これからも通る');
    ok(JSON.parse(st.m['btap:trial']).length === 3 && JSON.parse(st.m['btap:trial'])[0].name.includes('A vs B'), 'btap:trial は 3 件・名前に日付とチーム名');
    ok(L.use('trim', Object.assign(G(5), { demo: true })) && L.status().trialUsed === 3, 'デモの試合は、いつも通り・数えない');
    ok(!L.use('trim', null), '試合がないと、お試しでは通さない');
  }
  { // 購入コード
    const { st, L } = mk('on');
    [1, 2, 3].forEach((i) => L.use('trim', G(i)));
    eq((await L.enter('abc')).error, 'format', '形がちがうコードは、通信せずに format');
    eq((await L.enter('ABCD-EFGH-JKM1')).error, 'format', '0・1・I・L・O は format');
    const c0 = calls;
    reply = { ok: false, error: 'none' };
    const r1 = await L.enter('abcd efgh jkmn');
    ok(!r1.ok && r1.error === 'none' && /見つかりません/.test(r1.message) && calls === c0 + 1, 'ないコード：やさしい日本語で none', r1);
    reply = { ok: false, error: 'revoked' }; eq((await L.enter('ABCDEFGHJKMN')).error, 'revoked', 'revoked');
    reply = { ok: false, error: 'expired' }; eq((await L.enter('ABCDEFGHJKMN')).error, 'expired', 'expired');
    netDown = true; const rn = await L.enter('ABCDEFGHJKMN'); netDown = false;
    ok(!rn.ok && rn.error === 'net' && /つながりませんでした/.test(rn.message), '通信できないとき：net');
    ok(!L.use('trim', G(4)) && !st.m['btap:license'], 'ここまでの失敗では、何も保存されず、4 試合目は通らない');
    reply = { ok: true, club: 'テストクラブ', plan: 'scene', expires_at: new Date(clock + 200 * DAYMS).toISOString() };
    const r2 = await L.enter('abcd-efgh-jkmn');
    ok(r2.ok && r2.club === 'テストクラブ' && JSON.parse(st.m['btap:license']).code === 'ABCDEFGHJKMN', 'コードが通ると、正規化して保存');
    ok(L.use('trim', G(4)) && L.use('trim', G(5)) && L.status().trialUsed === 3, '場面パックがあれば何試合でも通る（お試しの枠は使わない）');
    const s = L.status();
    eq([s.licensed, s.expired, s.daysLeft, s.club], [true, false, 200, 'テストクラブ'], 'status：club・daysLeft');
    // 期限切れ：数えた試合だけ通る
    clock += 201 * DAYMS;
    const s2 = L.status();
    ok(!s2.licensed && s2.expired && !L.can('trim', G(4)) && L.can('trim', G(1)), '期限が切れると、数えた試合だけ通る');
    reply = { ok: true, club: 'X', plan: 'scene', expires_at: new Date(clock - DAYMS).toISOString() };
    eq((await L.enter('ABCDEFGHJKMN')).error, 'expired', 'サーバーが期限前と言っても、期限が過ぎた日付なら expired');
    L.clear();
    ok(!st.m['btap:license'] && !L.status().licensed, 'clear で外れる');
  }
  { // refresh：24 時間・通信失敗・止められたコード
    const { st, L } = mk('on');
    reply = { ok: true, club: 'C', plan: 'scene', expires_at: new Date(clock + 100 * DAYMS).toISOString() };
    [1, 2, 3].forEach((i) => L.use('trim', G(i)));      // お試しで数えた 3 試合
    await L.enter('ABCDEFGHJKMN');
    let c0 = calls; await L.refresh();
    eq(calls, c0, '24 時間たつまでは、確かめ直さない');
    clock += 2 * DAYMS; netDown = true; await L.refresh(); netDown = false;
    ok(L.status().licensed && L.use('trim', G(1)), '通信できないときは、控えのコードのまま使える');
    reply = { ok: true, club: 'C2', plan: 'scene', expires_at: new Date(clock + 365 * DAYMS).toISOString() };
    await L.refresh();
    ok(L.status().club === 'C2' && L.status().daysLeft === 365, '期限が延びたら、控えも延びる');
    clock += 2 * DAYMS; reply = { ok: false, error: 'revoked' };
    await L.refresh();
    const sr = L.status();
    ok(!sr.licensed && sr.revoked && !L.can('trim', G(7)) && L.can('trim', G(1)), '止められたコードは外れる（数えた試合は通る）');
    const { L: L2 } = mk('on');
    const c1 = calls; await L2.refresh(); eq(calls, c1, 'コードがなければ、通信しない');
  }
  { // 切りかえ
    const { st, L } = mk('off');
    ok(L.applySearch('?lic=on') && L.enabled() && st.m['btap:licmode'] === 'on', '?lic=on でオンになり、印が残る');
    ok(L.applySearch('?x=1&lic=off') && !L.enabled() && !('btap:licmode' in st.m), '?lic=off で印を外す');
    ok(!L.applySearch('?x=1') && !L.applySearch('?lic=maybe'), 'ほかの値は無視');
    st.setItem('btap:licmode', 'on'); ok(L.mode() === 'on', 'btap:licmode = on');
    st.setItem('btap:licmode', 'zzz'); ok(L.mode() === 'off', 'こわれた印は MODE にもどる');
  }
})().then(() => {
console.log(`\n${pass} ok / ${fail} fail`);
process.exit(fail ? 1 : 0);
});
