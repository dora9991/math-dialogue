// 回帰テスト（node sports-tap/tests/unit-tennis.cjs）
// テニス（硬式・ソフトテニス：sp/tennis.js）の、画面を持たない部分を確かめる。
// ポイントの記録から、ゲーム・セット・試合・サーブ権が正しく決まるか（タイブレーク・ノーアド・マッチタイブレーク・ソフトテニスのファイナルゲーム）、集計・CSV・書き出しと読み込み。
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function load(files) {
  const ctx = { console, Math, Date, JSON };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  files.forEach((f) => vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8'), ctx, { filename: f }));
  return ctx.ST;
}
let pass = 0, fail = 0;
const ok = (c, name, extra) => { if (c) { pass++; console.log('  ok  ', name); } else { fail++; console.log('  FAIL', name, extra !== undefined ? JSON.stringify(extra) : ''); } };
const eq = (a, b, name) => ok(JSON.stringify(a) === JSON.stringify(b), name, { got: a, want: b });
const section = (t) => console.log('\n■ ' + t);
const ST = load(['core.js', 'sp/tennis.js']);
const sp = ST.SPORTS.tennis;
const T0 = Date.UTC(2026, 9, 19, 6, 30, 0);

/* 試合を作る（opts：形式・serve：最初のサーブ） */
function mk(opts, serve, names) {
  const g = ST.newGame({ sport: 'tennis', now: T0, tz: 540, opts, teams: [{ name: '致遠館', players: (names && names[0]) || [{ no: '1', name: 'たける' }] }, { name: '城南', players: (names && names[1]) || [{ no: '1', name: 'ゆうと' }] }] });
  if (serve) g.serve = serve;
  g.startedAt = T0;
  g._t = 0;
  return g;
}
/* ポイントを足す：side がポイントを取る（type で理由。'pt' 理由なし・'err' は相手のミスとして相手側に記録） */
function pt(g, side, type) {
  g._t += 10;
  type = type || 'pt';
  const d = sp.TYPE[type];
  const team = d.to === 'opp' ? 1 - side : side;
  return ST.addEvent(g, { t: g._t, type, team, no: type === 'pt' ? null : '1' });
}
const pts = (g, side, n, type) => { for (let i = 0; i < n; i++) pt(g, side, type); };
const game = (g, side) => pts(g, side, 4);            // ラブゲーム
const st = (g) => sp.replay(g);

section('種目の登録と形式');
ok(sp && sp.family === 'tennis' && sp.name === 'テニス', 'テニスが登録される（family: tennis）');
eq(ST.cleanOpts(sp, {}), { kind: 'hard', fmt: 'single', sets: 3, games: 6, adv: 'ad', final: 'set', sgames: 7 }, 'はじめの形式：硬式・シングルス・3セットマッチ・6ゲーム・アドバンテージあり');
eq(ST.cleanOpts(sp, { kind: 'soft', sgames: '9', sets: 4 }).sgames, 9, '形式：文字の「9」も数に・選べない値（sets 4）は、はじめの値');
eq(sp.rules({ kind: 'soft', sgames: 7 }), { soft: true, matchGames: 7, need: 4, finalPts: 7 }, 'ソフトテニス 7ゲームマッチ：4ゲーム先取・ファイナルゲームは 7 ポイント');
eq(sp.rules({ kind: 'hard', sets: 1, final: 'mtb' }).mtb, false, '1セットマッチでは、マッチタイブレークにしない');

section('硬式：ポイントとゲーム');
let g = mk();
eq(st(g).p, [0, 0], 'はじめは 0−0');
pt(g, 0, 'ace');
eq(sp.pointText(st(g).R, st(g).p, st(g).tb), '15−0', 'エース → 15−0');
pt(g, 1, 'win');
const em = pt(g, 0, 'err');
eq([em.team, st(g).p], [1, [2, 1]], '城南のミス（城南の側に記録）→ 致遠館のポイント（2−1）');
eq(sp.pointText(st(g).R, st(g).p, st(g).tb), '30−15', '30−15');
pts(g, 1, 2); pt(g, 0);
eq(sp.pointCells(st(g).R, st(g).p, null), ['40', '40'], '3−3 は 40−40');
eq(sp.callText(st(g).R, st(g).p, null, ['A', 'B']), 'デュース', '呼び名：デュース');
pt(g, 0);
eq(sp.pointCells(st(g).R, st(g).p, null), ['AD', '40'], 'アドバンテージは AD');
eq(sp.callText(st(g).R, st(g).p, null, ['たける', 'ゆうと']), 'アドバンテージ たける', '呼び名：アドバンテージ たける');
pt(g, 1);
eq(sp.callText(st(g).R, st(g).p, null, ['A', 'B']), 'デュース', 'もう一度デュース');
pts(g, 0, 2);
eq([st(g).g, st(g).p, st(g).k], [[1, 0], [0, 0], 1], '2 ポイント差でゲーム（1−0）・次のゲームへ');
eq(st(g).server, 1, 'サーブはゲームごとに交代（2ゲーム目は相手）');
const s1 = st(g).stats;
eq([s1.svcGames, s1.held, s1.breaks], [[1, 0], [1, 0], [0, 0]], 'サービスゲーム：致遠館が1つキープ');

section('ノーアド（40−40 は次の1ポイントで決める）');
g = mk({ adv: 'noad' });
pts(g, 0, 3); pts(g, 1, 3);
eq(sp.callText(st(g).R, st(g).p, null, ['A', 'B']), 'デサイディングポイント', '40−40：デサイディングポイント');
pt(g, 1);
eq([st(g).g, st(g).p], [[0, 1], [0, 0]], '次の1ポイントでゲーム（ブレイク）');
eq(st(g).stats.breaks, [0, 1], 'ブレイク 1');

section('セット・タイブレーク・次のセットの最初のサーブ');
g = mk();
for (let i = 0; i < 5; i++) { game(g, 0); game(g, 1); }
eq(st(g).g, [5, 5], '5−5');
game(g, 0);
eq([st(g).g, st(g).sets.length], [[6, 5], 0], '6−5 ではセットにならない（2ゲーム差が必要）');
game(g, 1);
eq([st(g).g, st(g).tb], [[6, 6], 'tb'], '6−6 でタイブレーク');
eq(st(g).k, 12, 'タイブレークは 13 ゲーム目（k=12）');
eq(st(g).server, 0, 'タイブレークの1ポイント目は、順番どおり（致遠館）');
pt(g, 0);
eq(st(g).server, 1, '1ポイント目のあとは相手が2ポイント');
pt(g, 1);
eq(st(g).server, 1, '（相手の2ポイント目）');
pt(g, 1);
eq(st(g).server, 0, 'そのあと致遠館が2ポイント');
eq(sp.pointText(st(g).R, st(g).p, st(g).tb), '1−2', 'タイブレークのポイントは数で（1−2）');
pts(g, 0, 5); pts(g, 1, 4);
eq(st(g).p, [6, 6], 'タイブレーク 6−6');
pts(g, 0, 2);
eq([st(g).sets.length, st(g).sets[0], st(g).sw, st(g).tb], [1, { g: [7, 6], tb: [8, 6] }, [1, 0], null], '2ポイント差で 8−6 → セット 7−6(6)');
eq(sp.setText(st(g).sets[0]), '7−6(6)', 'セットの書き方：7−6(6)（負けた側のタイブレークのポイント）');
eq(st(g).server, 1, '次のセットの最初のサーブ：タイブレークで最初にサーブしなかった側');
eq(st(g).stats.svcGames, [6, 6], 'タイブレークは、サービスゲームに数えない');
game(g, 1); game(g, 0);
eq(sp.scoreText(g), '7−6(6) 1−1', '一覧の得点：7−6(6) 1−1');

section('3セットマッチの終わり・試合のあとのポイント');
g = mk();
for (let s = 0; s < 2; s++) for (let i = 0; i < 6; i++) game(g, 0);
eq([st(g).over, st(g).winner, sp.score(g)], [true, 0, [2, 0]], '2セット先取で試合終了（6−0 6−0）');
const extra = pt(g, 1);
eq([st(g).sw, !!st(g).snap[extra.id].after], [[2, 0], true], '試合のあとのポイントは数えない');
eq(sp.scoreText(g), '6−0 6−0', '一覧の得点：6−0 6−0');

section('最終セットのマッチタイブレーク（10 ポイント）');
g = mk({ sets: 3, final: 'mtb' });
for (let i = 0; i < 6; i++) game(g, 0);
for (let i = 0; i < 6; i++) game(g, 1);
eq([st(g).sw, st(g).tb], [[1, 1], 'mtb'], '1−1 → マッチタイブレーク');
pts(g, 0, 9); pts(g, 1, 9);
eq(st(g).over, false, '9−9 ではまだ');
pts(g, 0, 2);
eq([st(g).over, st(g).winner, st(g).sets[2]], [true, 0, { g: [1, 0], tb: [11, 9], mtb: true }], '11−9 で試合終了（セットは 1−0、ポイントを残す）');
eq(sp.scoreText(g), '6−0 0−6 [11−9]', '一覧の得点：6−0 0−6 [11−9]');

section('ショートセット・プロセット');
g = mk({ sets: 1, games: 4 });
for (let i = 0; i < 4; i++) { game(g, 0); game(g, 1); }
eq(st(g).tb, 'tb', '4ゲーム：4−4 でタイブレーク');
pts(g, 1, 7);
eq([st(g).over, st(g).winner, st(g).sets[0].g], [true, 1, [4, 5]], 'タイブレーク 7−0 → 4−5 で相手の勝ち（1セットマッチ）');
g = mk({ sets: 1, games: 8 });
for (let i = 0; i < 8; i++) game(g, 0);
eq([st(g).over, st(g).sets[0].g], [true, [8, 0]], '8ゲームプロセット：8−0');

section('ダブルス（硬式）：サーブする人の目安');
g = mk({ fmt: 'double' }, { side: 0, p: ['2', '1'] }, [[{ no: '1', name: 'あ' }, { no: '2', name: 'い' }], [{ no: '1', name: 'う' }, { no: '2', name: 'え' }]]);
eq([st(g).server, st(g).serverNo], [0, '2'], '1ゲーム目：致遠館の2人目（い）');
game(g, 0);
eq([st(g).server, st(g).serverNo], [1, '1'], '2ゲーム目：城南の1人目（う）');
game(g, 0);
eq([st(g).server, st(g).serverNo], [0, '1'], '3ゲーム目：致遠館の1人目（あ）');
game(g, 0);
eq([st(g).server, st(g).serverNo], [1, '2'], '4ゲーム目：城南の2人目（え）');
eq(sp.sideNames(g), ['あ・い', 'う・え'], '側の名前：選手の名前を「・」でつなぐ');

section('ソフトテニス');
g = mk({ kind: 'soft', sgames: 7 });
pts(g, 0, 3); pts(g, 1, 3);
eq([sp.pointCells(st(g).R, st(g).p, null), sp.callText(st(g).R, st(g).p, null, ['A', 'B'])], [['3', '3'], 'デュース'], '3−3 でデュース（数字で）');
pt(g, 1);
eq(sp.pointCells(st(g).R, st(g).p, null), ['3', 'AD'], 'アドバンテージ');
pts(g, 0, 3);
eq([st(g).g, st(g).server], [[1, 0], 1], '2ポイント差でゲーム・サーブは交代');
g = mk({ kind: 'soft', sgames: 7 });
for (let i = 0; i < 3; i++) { game(g, 0); game(g, 1); }
eq([st(g).g, st(g).tb], [[3, 3], 'final'], '3−3 でファイナルゲーム');
eq(sp.callText(st(g).R, st(g).p, st(g).tb, ['A', 'B']), 'ファイナルゲーム', '呼び名：ファイナルゲーム');
const fs0 = st(g).server;
eq(fs0, 0, 'ファイナルゲームの最初のサーブは、順番どおり（7ゲーム目＝致遠館）');
pt(g, 0);
eq(st(g).server, 0, 'ファイナルゲーム：2ポイントずつ（2ポイント目も同じ側）');
pt(g, 0);
eq(st(g).server, 1, '3ポイント目から相手');
pts(g, 0, 4); pts(g, 1, 6);
eq([st(g).p, st(g).over], [[6, 6], false], '6−6 はまだ（2ポイント差）');
pts(g, 1, 2);
eq([st(g).over, st(g).winner, sp.score(g), sp.scoreText(g)], [true, 1, [3, 4], '3−4'], '8−6 で相手の勝ち（ゲーム 3−4）');
g = mk({ kind: 'soft', sgames: 5 });
for (let i = 0; i < 3; i++) game(g, 0);
eq([st(g).over, st(g).winner], [true, 0], '5ゲームマッチ：3ゲーム先取で終わり');

section('取り消し・直し（記録から数え直す）');
g = mk();
pts(g, 0, 3);
const last = pt(g, 0);
eq(st(g).g, [1, 0], '4ポイントでゲーム');
ST.removeEvent(g, last.id);
eq([st(g).g, st(g).p], [[0, 0], [3, 0]], '取り消すと 40−0 に戻る');
const e2 = pt(g, 0);
e2.team = 1;          // 直す：相手のポイントに
eq(st(g).p, [3, 1], '直すと数え直す（40−15）');
g.opts.adv = 'noad';
eq(st(g).R.noAd, true, '形式を変えても数え直す（ノーアド）');

section('1stサーブ（フォルト）・エース・ダブルフォルトの集計');
g = mk();
ST.addEvent(g, { t: 1, type: 'flt', team: 0, no: '1' });
ST.addEvent(g, { t: 2, type: 'win', team: 0, no: '1' });        // 2ndサーブで取った
ST.addEvent(g, { t: 3, type: 'ace', team: 0, no: '1' });        // 1stサーブでエース
ST.addEvent(g, { t: 4, type: 'df', team: 0, no: '1' });         // ダブルフォルト（1st もフォルト）
ST.addEvent(g, { t: 5, type: 'err', team: 1, no: '1' });        // 相手のミス
let S = sp.stats(g);
eq([S[0].firstIn, S[0].firstSv, S[0].servePts, S[0].serveWon, S[0].won], [2, 4, 4, 3, 3], '1stサーブ 2/4（フォルトと DF のポイントは入らない）・サーブのポイント 3/4');
eq([S[0].rows[0].c.ace, S[0].rows[0].c.df, S[0].rows[0].c.flt, S[1].rows[0].c.err], [1, 1, 1, 1], '選手ごと：エース・DF・フォルト・ミス');
ok(st(g).stats.anyFault, 'フォルトを使った試合（1stサーブの割合を出す）');
eq(sp.pointText(st(g).R, st(g).p, null), '40−15', 'フォルトはポイントにならない（40−15）');

section('名前・一覧の文字');
g = mk();
const a1 = pt(g, 0, 'ace');
eq(sp.lastText(g, a1), 'エース → 15−0', '下の帯：エース → 15−0');
pts(g, 0, 3);
const lastEv = g.events[g.events.length - 1];
eq(sp.snapText(g, lastEv), 'ゲーム たける（1−0）', 'ゲームが決まったポイント：ゲーム たける（1−0）');
eq(sp.whoText(g, a1), 'たける', '下の帯のだれ：選手の名前');
eq(sp.whoText(g, lastEv), 'たける（側のポイント）', '理由なしのポイント：側の名前（側のポイント）');
eq(ST.fileBase(g).startsWith('テニス記録_2026-10-19_1530_たけるvsゆうと'), true, 'ファイル名：テニス記録_日付_時刻_たけるvsゆうと');

section('CSV');
g = mk();
pt(g, 0, 'ace'); pts(g, 0, 3); pt(g, 1, 'win');
const rows = sp.csvEvents(g);
eq(rows[0].slice(0, 6), ['No', '時刻', 'スタートからの秒', 'セット', 'ゲーム（そのセットの何ゲーム目）', 'サーブ'], '一覧の見出し');
eq(rows[1].slice(3, 11), [1, 1, 'たける', 'たける', 'たける', 'サービスエース', 'たける', '15−0'], '1行目：第1セット・1ゲーム目・サーブ たける・エース → 15−0');
eq(rows[4].slice(10, 14), ['', '1−0', '', 'ゲーム'], 'ゲームが決まった行：ゲーム数 1−0・できごと「ゲーム」');
eq(rows[5].slice(5, 11), ['ゆうと', 'ゆうと', 'ゆうと', 'ウィナー', 'ゆうと', '0−15'], '2ゲーム目：サーブは ゆうと');
const box = sp.csvBox(g);
eq(box[0].slice(0, 4), ['側', '選手', 'エース', 'ウィナー'], '集計の見出し');
eq(box.find((r) => r[0] === 'たける' && r[1] === '合計').slice(2, 13), [1, 0, 0, 0, 0, 3, 4, '4/4', '4/4', '1/1', 0], '合計：エース1・ポイント3・取ったポイント4・キープ 1/1');

section('書き出しと読み込み');
g = mk({ kind: 'soft', fmt: 'double', sgames: 9 }, { side: 1, p: ['1', '2'] }, [[{ no: '1', name: 'あ' }, { no: '2', name: 'い' }], [{ no: '1', name: 'う' }, { no: '2', name: 'え' }]]);
pt(g, 0, 'win'); pt(g, 1, 'ace');
const out = ST.exportData(g);
eq([out.format, out.sport, out.sportName, out.serve, out.tennis.points, out.events[0].won, out.events[1].server], ['sports-tap', 'tennis', 'テニス', { side: 1, p: ['1', '2'] }, [1, 1], 0, 1], '書き出す JSON：種目・最初のサーブ・ポイント・記録ごとの取った側とサーブ');
const back = ST.importData(JSON.stringify(out));
eq([back.opts.kind, back.opts.sgames, back.serve, back.events.length, sp.replay(back).p], ['soft', 9, { side: 1, p: ['1', '2'] }, 2, [1, 1]], '読み込むと、形式・最初のサーブ・記録が元どおり');
eq(sp.cleanServe({ side: 5, p: ['x'] }), { side: 0, p: ['1', '1'] }, '最初のサーブの形が合わないときは、自分の側・1人目');

console.log(`\n${pass} ok / ${fail} fail`);
process.exit(fail ? 1 : 0);
