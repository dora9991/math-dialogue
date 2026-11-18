#!/usr/bin/env node
/* 分析エンジンの動作確認。 使い方：  node minibasket/tools/check.cjs
   samples/ の3試合（写真から手で書き起こしたもの）を使い、
   ・整合性チェックが通ること（＝書き起こしの数字が、見出しの得点と全部合うこと）
   ・分析の数字が、紙の上で別に数えた値と一致すること
   ・わざと壊したデータで、整合性チェックが読み違いに気づくこと
   を確かめる。 */
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const MB = Object.assign({}, require('../js/core.js'), require('../js/analysis.js'));

const load = k => JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'samples', k + '.json'), 'utf8'));
const raw = { g2: load('game2'), g3: load('game3'), g5: load('game5') };
const games = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, MB.normalizeGame(v)]));

let pass = 0, fail = 0;
const t = (name, fn) => {
  try { fn(); pass++; console.log('  ok   ' + name); } catch (e) { fail++; console.log('  FAIL ' + name + '\n       ' + String(e.message).split('\n').join('\n       ')); }
};
const ptsOf = (r, side = 'my') => Object.fromEntries(r.players[side].filter(p => p.pts).map(p => [p.no, p.pts]));
const byQ = r => r.fouls.my.byQ.map(x => (x.exact ? String(x.lo) : `${x.lo}-${x.hi ?? '+'}`));

console.log('■ 整合性チェック（書き起こしが見出しの得点と合うか）');
for (const [k, g] of Object.entries(games)) {
  t(`${k}: エラーなし`, () => { const v = MB.validateGame(g); assert.deepEqual(v.errors, []); });
  t(`${k}: 警告なし（得点した選手は全員そのピリオドに出場）`, () => { const v = MB.validateGame(g); assert.deepEqual(v.warnings, []); });
}

console.log('■ 得点の読み取り');
t('g2: 3点シュートは35点目（選手番号を丸で囲んだ得点）、第4Q', () => {
  const e = games.g2.teams[1].events.find(e => e.total === 35);
  assert.equal(e.kind, 'TP'); assert.equal(e.markKind, 'TP'); assert.equal(e.q, 3); assert.equal(e.player, '4');
});
t('g3/g5 にも3点が1本ずつ', () => {
  assert.equal(games.g3.teams[1].events.filter(e => e.kind === 'TP').length, 1);
  assert.equal(games.g5.teams[1].events.filter(e => e.kind === 'TP').length, 1);
});

console.log('■ 試合ごとの分析（自チーム＝サンプルクラブ）');
const R = Object.fromEntries(Object.entries(games).map(([k, g]) => [k, MB.analyzeGame(g, MB.pickMine(g, 'サンプル'))]));
t('自チームの判定（名前の言葉）', () => { for (const r of Object.values(R)) assert.equal(r.my, 1); });
t('自チームの判定：言葉が空、または当てはまらないときは、右側のチームB', () => {
  for (const g of Object.values(games)) { assert.equal(MB.pickMine(g, ''), 1); assert.equal(MB.pickMine(g, undefined), 1); assert.equal(MB.pickMine(g, 'どこにもない言葉'), 1); }
});
t('自チームの判定：言葉が相手側だけに当てはまれば、そちらが自チーム', () => { for (const g of Object.values(games)) assert.equal(MB.pickMine(g, '相手チーム'), 0); });
t('g2: 39-17、ピリオド別差 +8 -1 +4 +11', () => {
  assert.deepEqual([R.g2.result.pf, R.g2.result.pa], [39, 17]);
  assert.deepEqual(R.g2.quarters.slice(0, 4).map(q => q.net), [8, -1, 4, 11]);
});
t('g3: 54-33、差 +12 -7 -1 +17', () => {
  assert.deepEqual([R.g3.result.pf, R.g3.result.pa], [54, 33]);
  assert.deepEqual(R.g3.quarters.slice(0, 4).map(q => q.net), [12, -7, -1, 17]);
});
t('g5: 69-15、差 +22 +11 +12 +9', () => {
  assert.deepEqual([R.g5.result.pf, R.g5.result.pa], [69, 15]);
  assert.deepEqual(R.g5.quarters.slice(0, 4).map(q => q.net), [22, 11, 12, 9]);
});
t('選手別得点 g2', () => assert.deepEqual(ptsOf(R.g2), { 4: 21, 5: 8, 7: 2, 9: 4, 10: 2, 12: 2 }));
t('選手別得点 g3', () => assert.deepEqual(ptsOf(R.g3), { 4: 22, 5: 8, 7: 10, 9: 4, 11: 5, 13: 3, 14: 2 }));
t('選手別得点 g5', () => assert.deepEqual(ptsOf(R.g5), { 4: 21, 5: 16, 7: 11, 9: 11, 10: 1, 11: 5, 14: 4 }));
t('相手の選手別得点（g3 相手チームB）',() => assert.deepEqual(ptsOf(R.g3, 'opp'), { 11: 4, 15: 12, 16: 4, 21: 7, 54: 2, 88: 4 }));
t('得点の内訳 g3 自チーム：FG 2点×? / 3点1本 / FT 7本', () => {
  const s = R.g3.scoring.my; assert.equal(s.FT.n, 7); assert.equal(s.TP.n, 1); assert.equal(s.FG.pts + s.TP.pts + s.FT.pts, 54);
});
t('フリースロー（成功/機会）', () => {
  assert.deepEqual([R.g2.ft.my.made, R.g2.ft.my.att, R.g2.ft.opp.made, R.g2.ft.opp.att], [0, 2, 7, 17]);
  assert.deepEqual([R.g3.ft.my.made, R.g3.ft.my.att, R.g3.ft.opp.made, R.g3.ft.opp.att], [7, 15, 5, 15]);
  assert.deepEqual([R.g5.ft.my.made, R.g5.ft.my.att, R.g5.ft.opp.made, R.g5.ft.opp.att], [8, 15, 1, 7]);
});
t('ファウル合計（自チーム/相手）', () => {
  assert.deepEqual([R.g2.fouls.my.total, R.g2.fouls.opp.total], [19, 1]);
  assert.deepEqual([R.g3.fouls.my.total, R.g3.fouls.opp.total], [13, 8]);
  assert.deepEqual([R.g5.fouls.my.total, R.g5.fouls.opp.total], [9, 14]);
});
t('ファウルのピリオド別（欄＋インクの色から割り出し）', () => {
  assert.deepEqual(byQ(R.g3), ['1', '9', '2', '1']);         // 2Qが9個：欄は4個で頭打ち、黒インクの合計10−4Q(1)＝9
  assert.deepEqual(byQ(R.g5), ['4', '1', '2', '2']);
  assert.deepEqual(byQ(R.g2), ['5-7', '5', '4-6', '3']);      // 1Q・3Qは赤インクの合計11を出場で振り分けた幅
  assert.deepEqual(R.g5.fouls.opp.byQ.map(x => (x.exact ? String(x.lo) : `${x.lo}-${x.hi}`)), ['3', '4-6', '0', '5-7']);
});
t('プラスマイナス（ピリオド単位）g2: #4=+23, #5=+14, #12=+18', () => {
  const pm = no => R.g2.players.my.find(p => p.no === no).pm;
  assert.equal(pm('4'), 8 + 4 + 11); assert.equal(pm('5'), -1 + 4 + 11); assert.equal(pm('12'), 8 - 1 + 11);
});
t('出場ピリオド数と「参考値」の印（g5 相手の4Qは7人に印）', () => {
  assert.equal(R.g5.players.opp.find(p => p.no === '3').qCount, 3);
  assert.equal(R.g5.players.opp.find(p => p.no === '3').pmApprox, true);
  assert.equal(R.g2.players.my.find(p => p.no === '4').pmApprox, false);
});
t('ラインナップ g2 Q1：#4 #7 #10 #12 #13 で +8', () => {
  const l = R.g2.lineups.my[0]; assert.deepEqual(l.members, ['4', '7', '10', '12', '13']); assert.equal(l.net, 8); assert.equal(l.approx, false);
});
t('タイムアウト g5：2Qの3分・3Qの5分', () => {
  assert.deepEqual(R.g5.timeouts.my.map(x => [x.label, x.minute]), [['2Q', 3], ['3Q', 5]]);
  assert.deepEqual(R.g5.timeouts.opp.map(x => [x.label, x.minute]), [['1Q', 2]]);
});
t('出場の印がない登録選手 #6 #8 #15', () => { for (const r of Object.values(R)) assert.deepEqual(r.participation.dnp, ['6', '8', '15']); });

console.log('■ 3試合の通算');
const A = MB.analyzeMany(Object.values(games), { myKeyword: 'サンプル' });
t('3勝0敗、162-65', () => { assert.deepEqual(A.record, { w: 3, l: 0, d: 0 }); assert.deepEqual([A.pf, A.pa, A.diff], [162, 65, 97]); });
t('自チームの言葉が空でも同じ結果（右側のチームBが自チーム）', () => {
  const E = MB.analyzeMany(Object.values(games), { myKeyword: '' });
  assert.deepEqual(E.record, { w: 3, l: 0, d: 0 }); assert.deepEqual([E.pf, E.pa], [162, 65]);
});
t('ピリオド別の合計差 Q1 +42 / Q2 +3 / Q3 +15 / Q4 +37',() => assert.deepEqual(A.quarters.map(q => q.net), [42, 3, 15, 37]));
t('フリースロー 15/32 と 13/39', () => { assert.deepEqual([A.ft.my.made, A.ft.my.att], [15, 32]); assert.deepEqual([A.ft.opp.made, A.ft.opp.att], [13, 39]); });
t('ファウル合計 41 と 23', () => assert.deepEqual([A.fouls.my.total, A.fouls.opp.total], [41, 23]));
t('選手別の通算得点', () => assert.deepEqual(Object.fromEntries(A.players.filter(p => p.pts).map(p => [p.no, p.pts])), { 4: 64, 5: 32, 7: 23, 9: 19, 10: 3, 11: 10, 12: 2, 13: 3, 14: 6 }));
t('選手別の出場ピリオド（#4 #5 #7 #9 は9、全体で60）', () => {
  const q = no => A.players.find(p => p.no === no).qCount;
  assert.deepEqual(['4', '5', '7', '9', '12', '10', '11', '13', '14'].map(q), [9, 9, 9, 9, 7, 5, 5, 3, 4]);
  assert.equal(A.players.reduce((s, p) => s + p.qCount, 0), 60);
});
t('3試合とも出場の印がない選手', () => assert.deepEqual(A.neverPlayed.sort((a, b) => a - b), ['6', '8', '15']));
t('4ファウル到達：#5 ×2回, #9 ×2回, #14 ×1回（5ファウルは0）', () => {
  const f = no => A.players.find(p => p.no === no);
  assert.deepEqual([f('5').foul4, f('9').foul4, f('14').foul4, f('7').foul4], [2, 2, 1, 0]);
  assert.equal(A.players.reduce((s, p) => s + p.foulOut, 0), 0);
});
t('気づきの文章が作られる', () => { assert.ok(A.insights.length >= 8); assert.ok(A.insights.every(i => i.text && i.tag)); });

console.log('■ わざと壊したデータで、読み違いに気づけるか');
const broken = fn => { const r = JSON.parse(JSON.stringify(raw.g3)); fn(r); return MB.validateGame(MB.normalizeGame(r)); };
const codes = v => v.errors.map(e => e.code).concat(v.warnings.map(w => w.code));
t('ピリオド得点の読み違い（2Qを13→12）', () => assert.ok(codes(broken(r => { r.teams[0].quarterScores[1] = 12; })).includes('SCORE_SUM')));
t('ランニングスコアの読み落とし（A の16を欠く）', () => {
  const c = codes(broken(r => { r.teams[0].running = r.teams[0].running.filter(e => e.total !== 16); }));
  assert.ok(c.includes('RUN_STEP') || c.includes('MARK_MISMATCH'), c.join());
});
t('ピリオド終了の得点の読み落とし（A の20を欠く）', () => assert.ok(codes(broken(r => { r.teams[0].running = r.teams[0].running.filter(e => e.total !== 20); })).includes('Q_BOUNDARY')));
t('背番号の読み違い（A の3点目を #88→#8）', () => assert.ok(codes(broken(r => { r.teams[0].running.find(e => e.total === 3).player = '8'; })).includes('SCORER_UNKNOWN')));
t('背番号の読み違い（登録にある別の選手：#15→#16 の1点目）', () => assert.ok(codes(broken(r => { r.teams[0].running.find(e => e.total === 1).player = '88'; r.teams[0].players.find(p => p.no === '88').marks = ['', '/', '', '']; })).includes('SCORER_NOT_PLAYING')));
t('印の読み違い（●を斜線と読んだ）', () => assert.ok(codes(broken(r => { r.teams[0].running.find(e => e.total === 10).mark = 'slash'; })).includes('MARK_MISMATCH')));
t('最終得点の読み違い', () => assert.ok(codes(broken(r => { r.teams[1].finalScore = 55; })).includes('SCORE_SUM')));
t('自チームを画面で手動指定すると、名前より優先される', () => {
  const r = JSON.parse(JSON.stringify(raw.g3)); r.myTeam = 'A';
  const g = MB.normalizeGame(r); assert.equal(MB.pickMine(g, 'サンプル'), 0);
  const rep = MB.analyzeGame(g, MB.pickMine(g, 'サンプル')); assert.deepEqual([rep.result.pf, rep.result.pa], [33, 54]);
  assert.equal(MB.pickMine(MB.normalizeGame(raw.g3), 'サンプル'), 1);
});
t('出場の印の見落とし（4Qが4人になる）', () => assert.ok(codes(broken(r => { r.teams[1].players.find(p => p.no === '11').marks[3] = ''; })).includes('LINEUP_LT5')));

// ── 保存（store.js）：db の代わりに偽物を差して、共有リンクで書けない人の動きを確かめる ──
const ta = async (name, fn) => {
  try { await fn(); pass++; console.log('  ok   ' + name); } catch (e) { fail++; console.log('  FAIL ' + name + '\n       ' + String(e.message).split('\n').join('\n       ')); }
};
const makeStorage = () => { const m = new Map(); return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); }, removeItem: k => { m.delete(k); }, has: k => m.has(k) }; };
const makeDb = (o = {}) => {
  const docs = new Map(), log = [];
  const fail_ = code => Object.assign(new Error(code), { code });
  const doc = id => ({
    id,
    get: async () => (docs.has(id) ? { id, exists: true, data: () => JSON.parse(docs.get(id)) } : { id, exists: false, data: () => undefined }),
    set: async v => { log.push(id); if (o.writeErr) throw fail_(o.writeErr); docs.set(id, JSON.stringify(v)); },
    delete: async () => { docs.delete(id); },
  });
  return { docs, log, collection: () => ({ doc, get: async () => ({ docs: [...docs.keys()].map(id => ({ id, data: () => JSON.parse(docs.get(id)) })) }) }) };
};
const claudeWith = (db, can) => ({ use: async n => (n === 'db' ? db : n === 'user' ? Object.assign({ id: async () => 'u_1' }, can === undefined ? {} : { can: async () => can }) : null) });
const setGlobal = (k, v) => Object.defineProperty(globalThis, k, { value: v, configurable: true, writable: true });
const delGlobal = k => { delete globalThis[k]; };
/** 毎回まっさらな store を読み込んで使う（モジュール内の状態を持ち越さない） */
const freshStore = () => { const p = require.resolve('../js/store.js'); delete require.cache[p]; return require('../js/store.js'); };
const game = (no, extra) => Object.assign({ meta: { date: '2026-01-10', time: '10:00', gameNo: String(no) }, teams: [{}, {}] }, extra || {});

async function storeTests() {
  console.log('■ 保存（db に書けない共有ページでも、試合を残せるか）');
  await ta('db に書ける人：db に保存し、ブラウザには書かない', async () => {
    const ls = makeStorage(), db = makeDb(); setGlobal('localStorage', ls); setGlobal('claude', claudeWith(db));
    try {
      const S = freshStore(); assert.equal(await S.init(), 'db');
      const k = S.makeKey(game(2)); assert.equal(k, 'g_20260110_1000_2');
      assert.deepEqual(await S.put(k, game(2)), { where: 'db', fellBack: false });
      assert.ok(db.docs.has(k)); assert.equal(ls.has('mb.games.v1'), false);
      assert.deepEqual(S.storeInfo(), { where: 'db', dbBlocked: false });
      assert.equal((await S.list()).length, 1);
    } finally { delGlobal('localStorage'); delGlobal('claude'); }
  });
  await ta('閲覧のみの人（db が invalid_argument で断る）：このブラウザに保存し、以後は db を試さない', async () => {
    const ls = makeStorage(), db = makeDb({ writeErr: 'invalid_argument' }); setGlobal('localStorage', ls); setGlobal('claude', claudeWith(db, null));
    try {
      const S = freshStore(); assert.equal(await S.init(), 'db');
      assert.deepEqual(await S.put('g_a_b_1', game(1)), { where: 'local', fellBack: true });
      assert.deepEqual(S.storeInfo(), { where: 'local', dbBlocked: true });
      assert.deepEqual(await S.put('g_a_b_2', game(2)), { where: 'local', fellBack: true });
      assert.equal(db.log.length, 1, 'db への書き込みは最初の1回だけ');
      assert.deepEqual((await S.list()).map(x => x.key).sort(), ['g_a_b_1', 'g_a_b_2']);
    } finally { delGlobal('localStorage'); delGlobal('claude'); }
  });
  await ta('user.can("data.write") が false の人は、最初から db に書かない', async () => {
    const ls = makeStorage(), db = makeDb(); setGlobal('localStorage', ls); setGlobal('claude', claudeWith(db, false));
    try {
      const S = freshStore(); assert.equal(await S.init(), 'local');
      assert.deepEqual(S.storeInfo(), { where: 'local', dbBlocked: true });
      assert.deepEqual(await S.put('g_a_b_1', game(1)), { where: 'local', fellBack: true });
      assert.equal(db.log.length, 0);
    } finally { delGlobal('localStorage'); delGlobal('claude'); }
  });
  await ta('一時的な不調（unavailable）は、1回やり直し、それでもだめならブラウザへ。db は諦めない', async () => {
    const ls = makeStorage(), db = makeDb({ writeErr: 'unavailable' }); setGlobal('localStorage', ls); setGlobal('claude', claudeWith(db));
    try {
      const S = freshStore(); await S.init();
      assert.deepEqual(await S.put('g_a_b_1', game(1)), { where: 'local', fellBack: true });
      assert.equal(db.log.length, 2, '最初の1回＋やり直し1回');
      assert.equal(S.storeInfo().where, 'db', '次の保存ではまた db を試す');
    } finally { delGlobal('localStorage'); delGlobal('claude'); }
  });
  await ta('一覧は db とブラウザをまとめ、同じ試合は新しいほうを採る', async () => {
    const ls = makeStorage(), db = makeDb(); setGlobal('localStorage', ls); setGlobal('claude', claudeWith(db));
    try {
      const old = game(1, { tag: 'db側（古い）' }), neu = game(1, { tag: 'ブラウザ側（新しい）' });
      db.docs.set('g_k', JSON.stringify({ v: 1, savedAt: 100, raw: old })); db.docs.set('settings', JSON.stringify({ myKeyword: 'x' }));
      ls.setItem('mb.games.v1', JSON.stringify({ g_k: { v: 1, savedAt: 200, raw: neu }, g_only_local: { v: 1, savedAt: 50, raw: game(3) } }));
      const S = freshStore(); await S.init();
      const L = await S.list(); assert.deepEqual(L.map(x => x.key).sort(), ['g_k', 'g_only_local']);
      assert.equal(L.find(x => x.key === 'g_k').raw.tag, 'ブラウザ側（新しい）');
    } finally { delGlobal('localStorage'); delGlobal('claude'); }
  });
  await ta('削除は db とブラウザの両方から消える', async () => {
    const ls = makeStorage(), db = makeDb(); setGlobal('localStorage', ls); setGlobal('claude', claudeWith(db));
    try {
      db.docs.set('g_k', JSON.stringify({ v: 1, savedAt: 100, raw: game(1) }));
      ls.setItem('mb.games.v1', JSON.stringify({ g_k: { v: 1, savedAt: 100, raw: game(1) } }));
      const S = freshStore(); await S.init(); await S.remove('g_k');
      assert.equal((await S.list()).length, 0); assert.equal(db.docs.has('g_k'), false);
    } finally { delGlobal('localStorage'); delGlobal('claude'); }
  });
  await ta('普通のブラウザ（claude なし）：localStorage。それも使えなければメモリ', async () => {
    setGlobal('localStorage', makeStorage());
    try {
      const S = freshStore(); assert.equal(await S.init(), 'local');
      assert.deepEqual(await S.put('g_k', game(1)), { where: 'local', fellBack: false });
      await S.putSettings({ myKeyword: 'あ', noNames: true }); assert.deepEqual(await S.getSettings(), { myKeyword: 'あ', noNames: true });
    } finally { delGlobal('localStorage'); }
    Object.defineProperty(globalThis, 'localStorage', { get() { throw new Error('denied'); }, configurable: true });
    try {
      const S = freshStore(); assert.equal(await S.init(), 'memory');
      assert.deepEqual(await S.put('g_k', game(1)), { where: 'memory', fellBack: false });
      assert.equal((await S.list()).length, 1);
    } finally { delGlobal('localStorage'); }
  });
  await ta('書き出したJSON（1試合・配列・書き出しファイル）を取り込める', async () => {
    const S = freshStore();
    assert.equal(S.parseImport(JSON.parse(S.exportJson([game(1), game(2)]))).length, 2);
    assert.equal(S.parseImport(game(1)).length, 1); assert.equal(S.parseImport([game(1), { x: 1 }]).length, 1); assert.equal(S.parseImport({ a: 1 }).length, 0);
  });
}

function generatedTests() {
  console.log('■ 生成物が最新か（手で直さない・作り直し忘れの防止）');
  const { execFileSync } = require('child_process');
  const os = require('os');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mb-check-'));
  const same = (gen, args, name, committed) => t(`${name} が samples/・js/ と同期している`, () => {
    const out = path.join(tmp, name); execFileSync(process.execPath, [path.join(__dirname, gen), ...args, out], { stdio: 'ignore' });
    assert.equal(fs.readFileSync(out, 'utf8'), fs.readFileSync(committed, 'utf8'), `${name} が古い。 node minibasket/tools/${gen} ${args.join(' ')} を実行して作り直してください`);
  });
  same('make-samples.cjs', [], 'samples.js', path.join(__dirname, '..', 'js', 'samples.js'));
  same('bundle.cjs', [], 'minibasket-all-in-one.html', path.join(__dirname, '..', 'minibasket-all-in-one.html'));
  same('bundle.cjs', ['--artifact'], 'minibasket-artifact.html', path.join(__dirname, '..', 'minibasket-artifact.html'));
  fs.rmSync(tmp, { recursive: true, force: true });
}

storeTests().then(() => {
  generatedTests();
  console.log(`\n${pass} 件OK / ${fail} 件NG`);
  process.exit(fail ? 1 : 0);
});
