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
eq(BT.fmtTime(3725.46, true), '1:02:05.5', '時刻の書式（1時間以上・0.1 秒）');

console.log(`\n${pass} ok / ${fail} fail`);
process.exit(fail ? 1 : 0);
