// 回帰テスト（node sports-tap/tests/unit-volley.cjs）
// バレーボールの画面を持たない部分（点の向き・セットの区切り・デュース・最終セット・サーブ権・集計・CSV・書き出しと読み込み）を確かめる。
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function load() {
  const ctx = { console, Math, Date, JSON };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  ['core.js', 'sp/volley.js'].forEach((f) => vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8'), ctx, { filename: f }));
  return ctx.ST;
}
let pass = 0, fail = 0;
const ok = (c, name, extra) => { if (c) { pass++; console.log('  ok  ', name); } else { fail++; console.log('  FAIL', name, extra !== undefined ? JSON.stringify(extra) : ''); } };
const eq = (a, b, name) => ok(JSON.stringify(a) === JSON.stringify(b), name, { got: a, want: b });
const section = (t) => console.log('\n■ ' + t);
const ST = load();
const sp = ST.SPORTS.volley;

const T0 = Date.UTC(2026, 9, 29, 6, 0, 0);
function game(opts) {
  const g = ST.newGame({ sport: 'volley', now: T0, tz: 540, opts, teams: [{ name: '致遠館', players: ST.parseNumbers('1-6').map((no) => ({ no, name: no === '4' ? 'ゆい' : '' })) }, { name: '城南' }] });
  g.startedAt = T0;
  return g;
}
let t = 0;
const add = (g, type, team, no) => ST.addEvent(g, { t: (t += 10), type, team, no: no == null ? null : String(no) });
/* 点を、チーム tm に n 回（アタック） */
const pts = (g, tm, n) => { for (let i = 0; i < n; i++) add(g, 'atk', tm, tm === 0 ? 4 : null); };

section('種目の登録・はじめの値');
ok(ST.SPORTS.volley && sp.family === 'volley', 'バレーボールが登録されている（family volley）');
eq(sp.defaultOpts(), { fmt: '6', sets: 3, deuce: 1, first: 0 }, '形式のはじめ：6人制・3セットマッチ・デュースあり・最初のサーブは自分');
eq(sp.rowTypes({ rows: {} }), ['atk', 'blk', 'ace', 'err'], '選手の行のボタン：アタック・ブロック・サーブ・ミス（ふだんは4つ）');
eq(sp.rowTypes({ rows: { errs: true, rec: true } }), ['atk', 'blk', 'ace', 'rec', 'serr', 'aerr', 'oerr'], '設定で：レシーブ・ミスの種類を分ける');
eq(sp.teamTypesOf({ rows: {} }), ['pt', 'to'], 'チームの行：得点・タイムアウト');
eq(sp.teamTypesOf({ rows: { team: false } }), [], 'チームの行は設定で消せる');

section('点の向き（記録の種類で決まる）');
let g = game();
add(g, 'atk', 0, 4);
add(g, 'err', 0, 2);           // 自分のミス → 相手の点
add(g, 'blk', 1, null);
add(g, 'pt', 0, null);         // チームの行の得点
add(g, 'rec', 0, 3);           // レシーブ：点は動かない
add(g, 'to', 1, null);         // タイムアウト：点は動かない
add(g, 'mark', null, null);
let rp = sp.replay(g);
eq(rp.pts, [2, 2], 'アタック→自分・ミス→相手・ブロック→相手・得点→自分。レシーブ・タイムアウト・★は点にならない');
eq(rp.rallies.length, 4, 'ラリーは点の動いた4つ');
eq(ST.score(g), [0, 0], 'まだセットは取っていない（score は取ったセット数）');
ok(/2 − 2（第1セット）/.test(ST.scoreText(g)), '試合の一覧の文字：「2 − 2（第1セット）」', ST.scoreText(g));

section('サーブ権（ラリーを取ったチームが次にサーブ）');
g = game({ first: 1 });
eq(sp.replay(g).server, 1, '最初のサーブは opts.first（相手）');
add(g, 'atk', 1, null);
eq(sp.replay(g).server, 1, '相手がサーブで取った → 相手のサーブのまま（ブレイク）');
add(g, 'ace', 0, 1);
eq(sp.replay(g).server, 0, '自分が取った → 自分のサーブに（サイドアウト）');
add(g, 'serr', 0, 1);
eq(sp.replay(g).server, 1, '自分のサーブミス → 相手の点・相手のサーブ');
ST.addEvent(g, { t: (t += 1), type: 'srv', team: 0 });
eq(sp.replay(g).server, 0, '「🏐」の記録（srv）で、サーブを入れかえられる');
let info = sp.replay(g).info;
const ids = g.events.filter((e) => e.type !== 'srv').map((e) => e.id);
eq([info[ids[0]].server, info[ids[1]].server, info[ids[2]].server], [1, 1, 0], 'ラリーごとに、サーブしたチームを覚えている');

section('セットの区切り（6人制：25点・2点差）');
g = game();
pts(g, 0, 24); pts(g, 1, 24);
rp = sp.replay(g);
eq([rp.set, rp.pts], [1, [24, 24]], '24−24 はまだ第1セット');
pts(g, 0, 1);
eq(sp.replay(g).set, 1, '25−24 は2点差がないので続く（デュース）');
pts(g, 0, 1);
rp = sp.replay(g);
eq([rp.set, rp.pts, rp.sets, rp.log[0].pts], [2, [0, 0], [1, 0], [26, 24]], '26−24 で第1セットは自分。次の点から第2セット');
const last = g.events[g.events.length - 1];
ok(rp.info[last.id].ended && !rp.info[last.id].match, 'そのラリーで「セットが決まった」印（試合はまだ）');
eq(rp.server, 1, '第2セットの最初のサーブは、交互（相手）');
g.events.pop();
rp = sp.replay(g);
eq([rp.set, rp.pts, rp.sets], [1, [25, 24], [0, 0]], '取り消すと、セットも元に戻る（記録から計算するので）');

section('デュースなし・試合が決まる・最終セット 15 点');
g = game({ deuce: 0 });
pts(g, 0, 24); pts(g, 1, 24); pts(g, 0, 1);
eq(sp.replay(g).sets, [1, 0], 'デュースなし：25−24 で決まる');
g = game();
pts(g, 0, 25);              // 1セット目 自分
pts(g, 1, 25);              // 2セット目 相手
rp = sp.replay(g);
eq([rp.set, rp.sets, sp.target(g.opts, 3)], [3, [1, 1], 15], '1−1 で第3セット（最終セット）は 15 点');
eq(rp.server, 0, '第3セットの最初のサーブは、ふたたび自分（交互）');
pts(g, 1, 14); pts(g, 0, 15); pts(g, 0, 1);
rp = sp.replay(g);
ok(rp.done && rp.winner === 0, '16−14 で試合は自分の勝ち（2セット先取）', rp);
eq(ST.score(g), [2, 1], '取ったセット数 2−1');
ok(/^2 − 1（25−0・0−25・16−14）$/.test(ST.scoreText(g)), '試合の一覧：「2 − 1（25−0・0−25・16−14）」', ST.scoreText(g));
pts(g, 1, 3);
eq(sp.replay(g).sets, [2, 1], '試合が決まったあとの点は数えない');

section('形式：9人制（21点）・小学生（最終セット15点）・5セットマッチ・1セットだけ');
eq([sp.target({ fmt: '9', sets: 3 }, 1), sp.target({ fmt: '9', sets: 3 }, 3)], [21, 21], '9人制は全部 21 点');
eq([sp.target({ fmt: 'j', sets: 3 }, 2), sp.target({ fmt: 'j', sets: 3 }, 3)], [21, 15], '小学生は 21 点・最終セット 15 点');
eq([sp.target({ fmt: '6', sets: 5 }, 4), sp.target({ fmt: '6', sets: 5 }, 5), sp.need({ sets: 5 })], [25, 15, 3], '5セットマッチ：第5セットが 15 点・3セット先取');
eq([sp.target({ fmt: '6', sets: 1 }, 1), sp.need({ sets: 1 })], [25, 1], '1セットだけ：25 点（最終セットの短い形式は使わない）・1セットで勝ち');
g = game({ sets: 1 });
pts(g, 0, 25);
ok(sp.replay(g).done, '1セットだけ：25 点で試合が決まる');

section('集計（選手ごと・サイドアウト率・ブレイク率・相手のミスでの得点・タイムアウト）');
t = 0;
g = game();
add(g, 'atk', 0, 4);       // 自分サーブ → 自分（ブレイク）
add(g, 'err', 1, null);    // 自分サーブ → 相手ミス → 自分（ブレイク）
add(g, 'atk', 1, null);    // 自分サーブ → 相手（相手のサイドアウト）
add(g, 'serr', 1, null);   // 相手サーブ → 相手のサーブミス → 自分（自分のサイドアウト）
add(g, 'blk', 0, 2);       // 自分サーブ → 自分
add(g, 'aerr', 0, 4);      // 自分サーブ → 自分のアタックミス → 相手
add(g, 'to', 0, null);
add(g, 'rec', 0, 4);
let st = sp.stats(g);
const me = st.teams[0], op = st.teams[1];
const p4 = me.rows.find((r) => r.no === '4');
eq([p4.pts, p4.c.atk, p4.errs, p4.c.rec], [1, 1, 1, 1], '#4：得点 1（アタック）・ミス 1・レシーブ 1');
eq([me.won, op.won], [4, 2], '取ったラリー 4−2');
eq([me.serve.n, me.serve.won, me.recv.n, me.recv.won], [5, 3, 1, 1], '自分：サーブのラリー 5 のうち 3（ブレイク）・相手サーブ 1 のうち 1（サイドアウト）');
eq([op.recv.n, op.recv.won, op.serve.n, op.serve.won], [5, 2, 1, 0], '相手：サイドアウト 2/5・ブレイク 0/1');
eq([me.oppErr, op.oppErr], [2, 1], '相手のミスでの得点：自分 2（相手のミス・サーブミス）・相手 1');
eq(me.tos, { 1: 1 }, 'タイムアウト：第1セットに 1');
eq(me.teamRow.c.to, 1, 'チームの行の記録（タイムアウト）は、チームの欄に入る');

section('CSV・書き出しと読み込み');
const csv = sp.csvEvents(g);
eq(csv[0].slice(0, 4), ['No', '時刻', 'スタートからの秒', 'セット'], '記録の一覧の見出し');
eq(csv[1].slice(7, 12), ['アタック決定', '致遠館', '致遠館', 1, 0], '1つ目：アタック決定・点は致遠館・サーブ致遠館・1−0');
eq(csv[2].slice(7, 9), ['ミス（相手の点）', '致遠館'], '相手のミス → 点は致遠館');
const box = sp.csvBox(g);
ok(box[0].includes('サーブエース') && box.some((r) => r[0] === '致遠館' && r[1] === '合計'), '選手ごとの集計（合計の行もある）');
ok(box.some((r) => r[0] === '致遠館' && r[4] === '60%' && r[7] === '100%' && r[8] === 2), 'チームごとのラリー：ブレイク率 60%・サイドアウト率 100%・相手のミスでの得点 2', box.filter((r) => r[0] === '致遠館').slice(-1));
const ex = ST.exportData(g);
ok(ex.format === 'sports-tap' && ex.sport === 'volley' && ex.sportName === 'バレーボール', '書き出す JSON：format・sport');
ok(ex.events[0].pointTo === 0 && ex.events[0].set === 1 && ex.events[0].server === 0, '書き出す記録に、点を取ったチーム・セット・サーブ');
const g2 = ST.importData(JSON.stringify(ex));
eq(sp.replay(g2).pts, sp.replay(g).pts, '読み込み直しても、同じ点');
ST.addEvent(g, { t: 500, type: 'srv', team: 1 });
const g3 = ST.importData(ST.exportData(g));
ok(g3.events.some((e) => e.type === 'srv' && e.team === 1), 'サーブ権の記録（srv）も、チームごと読み込める');
eq(ST.cleanOpts(sp, { fmt: '9', sets: 5, deuce: 0, first: 1, x: 1 }), { fmt: '9', sets: 5, deuce: 0, first: 1 }, '形式をそろえる');
eq(ST.cleanOpts(sp, { fmt: 'z', sets: 4 }), { fmt: '6', sets: 3, deuce: 1, first: 0 }, '知らない形式は、はじめの値に');

console.log(`\n${pass} 件 ok・${fail} 件 FAIL`);
process.exit(fail ? 1 : 0);
