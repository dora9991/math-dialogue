// 回帰テスト（node basket-tap/tests/unit.cjs）
// 画面を持たない部分（背番号の読み取り・タップの順番・時刻・ピリオド・得点・集計・CSV・書き出しと読み込み）を確かめる。
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

section('試合とタップ（番号 → プレー／プレー → 番号／プレーだけ）');
const T0 = Date.UTC(2026, 9, 19, 6, 30, 0);
const g = BT.newGame({ now: T0, tz: 540, teams: [{ name: '致遠館', players: BT.parseNumbers('4-8').map((no) => ({ no, name: no === '7' ? 'たけし' : '' })) }, { name: '城南', color: '#2f6fed' }] });
ok(g.format === 'basket-tap' && g.version === 1 && g.date === '2026-10-19', '新しい試合の形（日付は日本時間）');
eq(BT.elapsed(g, T0 + 5000), 0, 'スタート前は 0 秒');
g.startedAt = T0;
BT.addEvent(g, { t: 0, type: 'period', period: 1 });
eq(BT.elapsed(g, T0 + 125432), 125.4, 'スタートからの秒（0.1 秒まで）');
const tp = BT.tapper(g);
let r = tp.number(0, '7', T0 + 9000);
eq(r.kind, 'select', '番号を押すと「選んだ」');
r = tp.action(0, 'fg2', 10, T0 + 10000);
ok(r.ev.no === '7' && r.ev.team === 0 && r.ev.t === 10 && !r.waiting, '番号 → プレー：押した瞬間（10 秒）に #7 の 2P成功');
ok(tp.sel[0] === null, '記録したら、選んだ番号は外れる');
r = tp.action(1, 'fg3', 20, T0 + 20000);
ok(r.ev.no === null && r.waiting, 'プレー → ：番号なしで記録して、番号を待つ');
r = tp.number(1, '5', T0 + 23000);
ok(r.kind === 'assign' && r.ev.no === '5' && r.ev.t === 20, '7 秒以内に番号を押すと、その記録の番号になる（時刻はプレーを押した瞬間のまま）');
r = tp.action(0, 'reb', 30, T0 + 30000);
r = tp.number(0, '4', T0 + 30000 + BT.WAIT * 1000 + 1);
ok(r.kind === 'select' && BT.findEvent(g, 'e4').no === null, `${BT.WAIT} 秒を過ぎた番号は、次のプレーの「選んだ番号」になる（記録は番号なしのまま）`);
ok(tp.expire(T0 + 30000 + BT.WAIT * 1000 + 1 + BT.SEL * 1000 + 1) && tp.sel[0] === null, `選んだ番号は ${BT.SEL} 秒で外れる`);
tp.action(0, 'pass', 40, T0 + 40000);
tp.action(0, 'fg2x', 41, T0 + 41000);
r = tp.number(0, '8', T0 + 42000);
ok(r.kind === 'assign' && r.ev.type === 'fg2x' && BT.findEvent(g, 'e5').no === null, '続けてプレーを押したら、番号はいちばん新しい記録に付く');
tp.number(0, '6', T0 + 50000);
r = tp.number(0, '6', T0 + 50500);
ok(r.kind === 'deselect' && tp.sel[0] === null, '選んだ番号をもう一度押すと外れる');
tp.action(1, 'reb', 42, T0 + 42000);
tp.clearWait(1);
ok(tp.wait[1] === null, '「番号なし」で待つのをやめる');

section('ピリオド・得点・集計');
BT.addEvent(g, { t: 600, type: 'period', period: 2 });
BT.addEvent(g, { t: 610, type: 'ft', team: 1, no: '5' });
BT.addEvent(g, { t: 611, type: 'ftx', team: 1, no: '5' });
BT.addEvent(g, { t: 612, type: 'reb', team: 1, no: '9' });       // 同じチームの外れの直後 → オフェンスリバウンド
BT.addEvent(g, { t: 640, type: 'fg3', team: 0, no: '99' });      // 名簿にない番号
eq(BT.periodAt(g, 599.9), 1, '600 秒より前は 1Q');
eq(BT.periodAt(g, 600), 2, '600 秒から 2Q');
eq(BT.score(g), [5, 4], '得点：自分 2+3・相手 3+1');
eq(BT.periodScores(g).map((p) => [p.label, p.pts]), [['1Q', [2, 3]], ['2Q', [3, 1]]], 'ピリオドごとの得点');
const st = BT.stats(g);
const s7 = st[0].rows.find((x) => x.no === '7').s;
ok(s7.pts === 2 && s7.fg2m === 1 && s7.fg2a === 1, '#7：2点（2P 1/1）');
ok(st[0].rows.some((x) => x.no === '99' && x.extra), '名簿にない番号も集計に出る');
ok(st[0].unknown.reb === 1 && st[0].unknown.pass === 1, '番号なしのリバウンド・パスミスは「番号なし」に');
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
const box = BT.boxCSV(g).split('\r\n');
ok(box[0].startsWith('チーム,背番号,名前,得点,2P成功,2P試投') && box.some((l) => l.startsWith('城南,合計,,4,')), '集計の CSV：見出しと合計');
const g2 = BT.importData(JSON.stringify(ex));
ok(g2.events.length === g.events.length && g2.startedAt === g.startedAt && BT.score(g2).join() === '5,4', '書き出した JSON を読み込むと、同じ記録・得点');
ok(g2.events.every((e) => /^e\d+$/.test(e.id)) && new Set(g2.events.map((e) => e.id)).size === g2.events.length, '読み込んだ記録の id は重ならない');
const g3 = BT.importData({ format: 'basket-tap', teams: [{ name: 'A', color: 'red', players: [{ no: '７' }, { no: 'x' }] }], events: [{ id: 'e2', t: 1, type: 'fg2', team: 0, no: 7 }, { t: 2, type: 'reb', team: 1 }, { id: 'e2', t: 3, type: 'pass', team: 0 }, { t: -1, type: 'fg2' }, { t: 4, type: 'zzz' }] });
ok(g3.events.length === 3 && new Set(g3.events.map((e) => e.id)).size === 3, '壊れた記録・知らない種類は飛ばし、id のかぶりは付け直す', g3.events.map((e) => e.id));
ok(g3.teams[0].color === '#f4f4f4' && g3.teams[0].players.length === 1 && g3.teams[0].players[0].no === '7', '色の形が違えば初期値・背番号もそろえる');
let threw = null;
try { BT.importData({ format: 'other' }); } catch (e) { threw = e.message; }
ok(threw && /バスケ タップ記録/.test(threw), 'ほかのアプリのファイルは、分かる言葉で断る', threw);
eq(BT.fileBase(g), 'バスケ記録_2026-10-19_1530_致遠館vs城南', 'ファイル名');

section('ボタンの並び');
eq(BT.actionRows(BT.PRESETS.std.ids), [['fg2', 'fg3', 'ft'], ['fg2x', 'fg3x', 'ftx'], ['reb', 'pass', 'mark']], '「ふつう」：成功の段・失敗の段・そのほか');
eq(BT.actionRows(['mark', 'fg2', 'reb', 'fg2x']), [['fg2'], ['fg2x'], ['reb', 'mark']], '選んだ順ではなく、決まった並び');
eq(BT.presetOf(BT.PRESETS.score.ids.slice().reverse()), 'score', '組み合わせの名前');
eq([BT.inkOn('#f4f4f4'), BT.inkOn('#1f2f6e'), BT.inkOn('#f2c230')], ['#111111', '#ffffff', '#111111'], 'チームの色の上の文字の色（読みやすいほう）');
eq(BT.fmtTime(3725.46, true), '1:02:05.5', '時刻の書式（1時間以上・0.1 秒）');

console.log(`\n${pass} ok / ${fail} fail`);
process.exit(fail ? 1 : 0);
