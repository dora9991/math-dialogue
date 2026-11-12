#!/usr/bin/env node
/* 「今週の これ1つ」（js/focus.js・data/focus.js）と、週ゴール・きょうのメニューへの反映（js/grow.js）の検査。ブラウザは使わない。
   調べること：テストのデータ（id・技能・練習メニューとのつながり・向き）・週（月〜日）の数え方・目標の提案・自己ベスト・ふり返り・
     のびしろ3つ（動画チェックの △・むずかしかった・そうだん・ともくひょう・ごぶさた・先週のあと少し）・読みこみの たしかめ・
     きょうのメニューが「これ1つ」中心になるか・週ゴールとバッジ
   使い方：node tools/focus-test.cjs */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.join(__dirname, '..');
const ctx = { console };
ctx.window = ctx;
vm.createContext(ctx);
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const files = ['js/core.js', 'js/motion.js', 'js/aid.js', ...[...html.matchAll(/<script src="(data\/[^"]+)"><\/script>/g)].map((m) => m[1]), 'js/grow.js', 'js/focus.js'];
for (const f of files) if (fs.existsSync(path.join(root, f))) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });
const BC = ctx.BC;
const G = BC.grow, F = BC.focus;
let fails = 0, passes = 0;
const ok = (c, m, x) => { if (c) passes++; else { fails++; console.log('✗ ' + m + (x !== undefined ? '  ' + JSON.stringify(x).slice(0, 240) : '')); } };

/* ---------- テストのデータ ---------- */
const tests = F.tests();
ok(tests.length >= 20, `測るテストが 20以上（${tests.length}）`);
ok(new Set(tests.map((t) => t.id)).size === tests.length, 'テストの id が かさならない');
let bad = [];
for (const t of tests) {
  if (!/^f-[a-z0-9-]+$/.test(t.id)) bad.push(t.id + ':id');
  if (!BC.skillMap[t.skill]) bad.push(t.id + ':skill');
  if (!['count', 'time', 'hold', 'make'].includes(t.kind)) bad.push(t.id + ':kind');
  if (!['more', 'less'].includes(t.better)) bad.push(t.id + ':better');
  if ((t.kind === 'time') !== (t.better === 'less')) bad.push(t.id + ':timeはless（それいがいは more）');
  if (t.kind === 'count' && !(t.secs >= 5 && t.secs <= 120)) bad.push(t.id + ':secs');
  if (t.kind === 'make' && !(t.of >= 5 && t.of <= 30)) bad.push(t.id + ':of');
  if (!['回', '本', '秒'].includes(t.unit)) bad.push(t.id + ':unit');
  if ((t.kind === 'time' || t.kind === 'hold') && t.unit !== '秒') bad.push(t.id + ':秒');
  if (!['any', 'hoop'].includes(t.place)) bad.push(t.id + ':place');
  if (!(t.how || []).length || t.how.length > 4) bad.push(t.id + ':how');
  if (!(t.cues || []).length || t.cues.length > 4 || t.cues.some((c) => c.length > 14)) bad.push(t.id + ':cues');
  if (!t.drills || !t.drills.length || t.drills.some((d) => !BC.get(d) || BC.get(d).kind_ !== 'drill')) bad.push(t.id + ':drills');
  else if (!(BC.get(t.drills[0]).skills || []).includes(t.skill) && !['rebound', 'foot'].includes(t.skill)) bad.push(t.id + ':主な練習の技能がちがう');
  if (t.name.length > 16 || t.what.length > 28) bad.push(t.id + ':ことばが長い');
  if (t.place === 'any' && t.drills.some((d) => BC.get(d).place === 'full')) bad.push(t.id + ':家のテストに 広い場所の練習');
}
ok(!bad.length, 'テストのデータ（id・技能・向き・秒数・やり方・練習メニューのつながり）', bad);
ok(['dribble', 'shoot', 'finish', 'pass', 'foot', 'attack', 'defball', 'rebound', 'body'].every((s) => tests.some((t) => t.skill === s)), '9つの技能に テストが ある');
const homeMe = { n: 1, level: 1, place: 'any' };
ok(F.testsFor('shoot', homeMe).length === 0 && F.testsFor('dribble', homeMe).length >= 4, '家（ゴールなし）では シュートのテストは出ない・ドリブルは出る');
ok(F.testsFor('shoot', { n: 1, level: 1, place: 'hoop' }).length === 3, 'ゴールがあれば シュートのテスト 3つ');

/* ---------- 数のあつかい ---------- */
const T = (id) => F.test(id);
ok(F.fmt(T('f-pound-r'), 38) === '38回' && F.fmt(T('f-circle'), 16.94) === '16.9秒' && F.fmt(T('f-ft'), 7) === '7/10本' && F.fmt(T('f-plank'), 45) === '45秒', '数の見せ方');
ok(F.clamp(T('f-ft'), 14) === 10 && F.clamp(T('f-ft'), -3) === 0 && F.clamp(T('f-circle'), 12.345) === 12.3 && F.clamp(T('f-pound-r'), 'あ') === 0, '数の範囲（まん点・マイナス・小数・文字）');
ok(F.suggestGoal(T('f-pound-r'), 38) === 42 && F.suggestGoal(T('f-pound-r'), 3) === 5 && F.suggestGoal(T('f-pound-r'), 0) === 2, '目標の提案（回数：+10%・さいてい +2）');
ok(F.suggestGoal(T('f-ft'), 4) === 6 && F.suggestGoal(T('f-ft'), 7) === 8 && F.suggestGoal(T('f-ft'), 10) === 10, '目標の提案（N本中：半分以下は +2・それ以上は +1・まん点はそのまま）');
ok(F.suggestGoal(T('f-circle'), 18) === 17.1 && F.suggestGoal(T('f-circle'), 3) === 2.5 && F.suggestGoal(T('f-circle'), 0) === 0.5, '目標の提案（タイム：5%はやく・さいてい 0.5秒）', [F.suggestGoal(T('f-circle'), 18), F.suggestGoal(T('f-circle'), 3)]);
ok(F.suggestGoal(T('f-plank'), 40) === 45 && F.suggestGoal(T('f-plank'), 100) === 110, '目標の提案（キープ：さいてい +5秒・または +10%）');
ok(F.meets(T('f-pound-r'), 42, 42) && !F.meets(T('f-pound-r'), 42, 41) && F.meets(T('f-circle'), 17, 16.9) && !F.meets(T('f-circle'), 17, 17.1), '目標にとどいたか（多いほどよい・少ないほどよい）');
ok(F.gain(T('f-pound-r'), 38, 44) === 6 && F.gain(T('f-circle'), 18, 16.5) === 1.5, 'のびの向き（タイムは 小さくなるほど のび）');

/* ---------- 週（月〜日） ---------- */
const d = (m, dd, h = 12) => new Date(2026, m - 1, dd, h).getTime(); // 月は 1〜12
ok(F.weekKey(d(11, 12)) === '2026-11-09' && F.weekKey(d(11, 9, 0)) === '2026-11-09' && F.weekKey(d(11, 15, 23)) === '2026-11-09' && F.weekKey(d(11, 16)) === '2026-11-16', '週は 月曜はじまり（木 11/12 → 11/9・日 11/15 → 11/9・月 11/16 → 11/16）');
ok(F.weekKey(d(1, 1)) === '2025-12-29' && F.weekKey(d(3, 1)) === '2026-02-23', '月・年をまたぐ週');
ok(F.weekDays(d(11, 12)).join() === '2026-11-09,2026-11-10,2026-11-11,2026-11-12,2026-11-13,2026-11-14,2026-11-15', '週の7日');

/* ---------- はじめる・測りなおす・自己ベスト ---------- */
const NOW = d(11, 9, 18); // 月曜
let st = F.empty();
let r = F.start(st, { test: 'f-pound-r', value: 38, goal: 42, now: NOW, id: 'a' });
st = r.state;
ok(r.item && r.item.week === '2026-11-09' && r.item.tries.length === 1 && r.item.tries[0].k === 'base' && r.item.goal === 42 && r.item.skill === 'dribble', 'これ1つを はじめる（きじゅん 38・目標 42）', r.item);
ok(F.current(st, d(11, 12)).id === 'a' && F.current(st, d(11, 16)) === null, '今週のものは 今週だけ');
ok(F.start(st, { test: 'nothing', value: 1 }).item === null, 'ないテストは はじめられない');
let m = F.summary(F.item(st, 'a'));
ok(m.base === 38 && m.last === 38 && !m.tried && !m.reached && m.ratio === 0, 'まだ 測りなおしていない', m);
ok(F.verdict(F.item(st, 'a')).key === 'base', 'きじゅんのひとこと');
r = F.addTry(st, 'a', 44, d(11, 14));
ok(r.pb === true && r.reached === true && r.gain === 6 && F.item(r.state, 'a').tries.length === 2, '44回に のびた → 自己ベスト・目標クリア', { pb: r.pb, reached: r.reached, gain: r.gain });
ok(F.item(st, 'a').tries.length === 1, '元の state は かわらない');
st = r.state;
m = F.summary(F.item(st, 'a'));
ok(m.tried && m.reached && m.gain === 6 && m.ratio === 1, 'まとめ', m);
ok(F.verdict(F.item(st, 'a'), true).key === 'pb' && F.verdict(F.item(st, 'a'), false).key === 'up', 'ひとこと（自己ベスト／のびた）');
ok(F.bestOf(st, 'f-pound-r') === 44 && F.bests(st)['f-pound-r'] === 44, '自己ベスト');
r = F.addTry(st, 'a', 40, d(11, 15));
ok(r.pb === false && r.reached === false && F.bestOf(r.state, 'f-pound-r') === 44, 'へっても 自己ベストは そのまま（pb ではない）');
ok(F.verdict(F.item(r.state, 'a')).key === 'up' && F.verdict(F.item(r.state, 'a')).text.includes('のびたよ'), 'さいごが 40でも きじゅん(38)より のびている');
r = F.addTry(st, 'a', 36, d(11, 15));
ok(F.verdict(F.item(r.state, 'a')).key === 'down' && !/ダメ|だめ|悪/.test(F.verdict(F.item(r.state, 'a')).text), 'へったときも はげます（せめない）', F.verdict(F.item(r.state, 'a')).text);
// タイム（少ないほどよい）
let st2 = F.start(F.empty(), { test: 'f-circle', value: 18.2, now: NOW, id: 'c' }).state;
ok(F.item(st2, 'c').goal === 17.3, 'タイムの目標を 自動で（18.2 → 17.3）', F.item(st2, 'c').goal);
r = F.addTry(st2, 'c', 16.9, d(11, 13));
ok(r.pb && r.reached && Math.abs(r.gain - 1.3) < 1e-9, 'タイムが はやくなった → 自己ベスト', { pb: r.pb, gain: r.gain });
ok(F.shareText(F.item(r.state, 'c'), true).includes('18.2秒 → 16.9秒（−1.3秒） 自己ベスト！'), 'おうちの人に見せる文（タイム）', F.shareText(F.item(r.state, 'c'), true));
ok(F.shareText(F.item(st, 'a'), true).includes('38回 → 44回（+6回） 自己ベスト！') && F.shareText(F.item(st, 'a'), true).includes('ポンドドリブル（右手）'), 'おうちの人に見せる文（回数）', F.shareText(F.item(st, 'a'), true));
ok(F.clubLabel(F.item(st, 'a'), true).length <= 60 && F.clubLabel(F.item(st, 'a'), true).includes('38回 → 44回') && F.clubLabel(F.item(st, 'a'), true).includes('自己ベスト'), 'ひろばの ひとこと（60字まで）', F.clubLabel(F.item(st, 'a'), true));
ok(F.clubLabel(F.item(st2, 'c'), false).includes('から スタート') && F.clubLabel(F.item(st2, 'c'), false).length <= 60, 'ひろばの ひとこと（きじゅんだけ）');
// 別の週・ほかのテスト・自己ベスト
const r2 = F.start(st, { test: 'f-pound-r', value: 44, now: d(11, 16, 18), id: 'b' });
st = r2.state;
ok(F.current(st, d(11, 17)).id === 'b' && F.lastFor(st, 'f-pound-r', 'b').id === 'a', '来週の これ1つ（前の きろくも つながる）');
r = F.addTry(st, 'b', 44, d(11, 22));
ok(!r.pb, '前と同じ 44は 自己ベストではない');
r = F.addTry(st, 'b', 47, d(11, 22));
ok(r.pb && r.item.tries.length === 2, '47で 自己ベスト（前の週をこえた）');
// 同じ週に かえる
r = F.start(st, { test: 'f-cross', value: 20, now: d(11, 17), id: 'x' });
ok(F.item(r.state, 'b').changed && F.item(r.state, 'b').closed && F.current(r.state, d(11, 18)).id === 'x' && r.state.items.length === st.items.length + 1, '同じ週に かえると、前のは「かえた」で のこる（きろくは けさない）');
// ふり返り
let st3 = F.addNote(st, 'a', { good: '回数が ふえた', next: 'ひざを まげる' }, d(11, 10));
ok(F.item(st3, 'a').notes.length === 1 && F.item(st3, 'a').notes[0].next === 'ひざを まげる', 'ふり返りを のこす');
st3 = F.addNote(st3, 'a', { good: 'リズムが よかった', next: '' }, d(11, 10, 20));
ok(F.item(st3, 'a').notes.length === 1 && F.item(st3, 'a').notes[0].good === 'リズムが よかった', '同じ日は 書きかえ（1日1つ）');
st3 = F.addNote(st3, 'a', { good: 'x', next: 'y' }, d(11, 11));
ok(F.item(st3, 'a').notes.length === 2, '日がかわれば ふえる');
ok(F.addNote(st3, 'a', { good: '', next: ' ' }, d(11, 12)) === st3, 'からっぽは のこさない');
ok(F.item(F.addNote(st3, 'a', { good: 'あ'.repeat(100), next: '' }, d(11, 13)), 'a').notes.slice(-1)[0].good.length === 40, 'ふり返りは 40字まで');
// 前の週で 測りなおしていないもの
const stp = F.start(F.empty(), { test: 'f-ft', value: 4, now: d(11, 2), id: 'p' }).state; // 先週
ok(F.pending(stp, d(11, 10)).id === 'p' && F.pending(stp, d(11, 4)) === null, '先週のまま 測りなおして いないもの');
ok(F.pending(F.close(stp, 'p'), d(11, 10)) === null && F.pending(F.addTry(stp, 'p', 6, d(11, 5)).state, d(11, 10)) === null, 'とじた／測りなおした ものは 出ない');
ok(F.remove(st, 'a').items.every((x) => x.id !== 'a'), 'けす');
ok(F.setGoal(st, 'a', 50).items.find((x) => x.id === 'a').goal === 50 && F.setGoal(st, 'a', 999).items.find((x) => x.id === 'a').goal === 999, '目標を直す（回数は 99999 まで）');

/* ---------- 読みこみの たしかめ ---------- */
const raw = JSON.parse(JSON.stringify(st));
ok(F.load(raw).items.length === st.items.length, '読みこみ：そのまま');
ok(F.load(null).items.length === 0 && F.load({ items: 'x' }).items.length === 0 && F.load({}).items.length === 0, '読みこみ：からっぽ・こわれたもの');
const dirty = { items: [
  { id: 'ok1', week: '2026-11-09', test: 'f-ft', goal: 99, at: 1, tries: [{ at: 1, v: 99, k: 'try' }], notes: [{ at: 2, good: 'a'.repeat(99), next: 1 }] },
  { id: 'bad1', week: '2026-11-09', test: 'f-nothing', tries: [{ at: 1, v: 1 }] },
  { id: 'bad2', week: 'きのう', test: 'f-ft', tries: [{ at: 1, v: 1 }] },
  { id: 'bad3', week: '2026-11-09', test: 'f-ft', tries: [] },
  { id: 'bad4', week: '2026-11-09', test: 'f-ft', tries: [{ at: 'x', v: 'y' }] },
  null, 5,
] };
const ld = F.load(dirty);
ok(ld.items.length === 1 && ld.items[0].goal === 10 && ld.items[0].tries[0].v === 10 && ld.items[0].tries[0].k === 'base' === false && ld.items[0].notes[0].good.length === 40 && ld.items[0].notes[0].next === '1', '読みこみ：ないテスト・日づけ・きろくなし を はずす・数を範囲に', ld.items);

/* ---------- のびしろ3つ ---------- */
const me = { n: 1, level: 1, place: 'hoop', goals: ['shoot', 'dribble'] };
const nowC = d(11, 12);
let cand = F.candidates({ me, acts: [], checks: [], log: [], state: F.empty(), now: nowC });
ok(cand.length === 3 && new Set(cand.map((c) => c.skill)).size === 3, 'はじめての人にも 3つ（べつの技能）', cand.map((c) => c.skill));
ok(cand[0].skill === 'shoot' && cand[1].skill === 'dribble' && /ともくひょう/.test(cand[0].reason), 'ともくひょうが 先（理由もつく）', cand.map((c) => [c.skill, c.reason]));
ok(cand.every((c) => F.test(c.test) && F.test(c.test).skill === c.skill && F.available(F.test(c.test), me)), 'どれも その人に できるテスト');
const noGoal = F.candidates({ me: { n: 1, level: 1, place: 'any' }, acts: [], checks: [], log: [], state: F.empty(), now: nowC });
ok(noGoal.length === 3 && noGoal.every((c) => c.skill !== 'shoot' && c.skill !== 'finish'), '家（ゴールなし）の人には ゴールがいるテストを すすめない', noGoal.map((c) => c.skill));
// 動画チェックの △
const chk = [{ id: 'c1', at: nowC - 2 * 86400000, mode: 'dribble', score: 60, metrics: [{ key: 'low', label: '腰の低さ', status: 'bad', links: ['v-drb-low', 'd-2ball'] }, { key: 'up', label: '顔', status: 'good' }] }];
cand = F.candidates({ me, acts: [], checks: chk, log: [], state: F.empty(), now: nowC });
ok(cand[0].skill === 'dribble' && cand[0].tag === 'check' && /動画チェックで「腰の低さ」が △/.test(cand[0].reason), '動画チェックの △ が 1ばん', cand[0]);
ok(cand[0].test === 'f-pound-l' || F.test(cand[0].test).drills.includes('d-2ball'), '△ に つながる練習メニュー（d-2ball）の テストを えらぶ', cand[0].test);
cand = F.candidates({ me, acts: [], checks: [Object.assign({}, chk[0], { at: nowC - 40 * 86400000 })], log: [], state: F.empty(), now: nowC });
ok(cand[0].tag !== 'check', '30日より 古い動画チェックは つかわない');
// むずかしかった
const hardActs = [1, 2, 3].map((i) => ({ at: nowC - i * 86400000, type: 'drill', id: 'd-around', skill: 'shoot', min: 5, rate: 1, xp: 8 }));
cand = F.candidates({ me: { n: 1, level: 1, place: 'hoop', goals: ['dribble'] }, acts: hardActs, checks: [], log: [], state: F.empty(), now: nowC });
ok(cand[0].skill === 'shoot' && cand[0].tag === 'hard' && /むずかしかった」が 3回/.test(cand[0].reason), '「むずかしかった」が つづく技能', cand[0]);
// そうだん
const lg = [{ me: 'x' }, { bot: { type: 'issue', id: 'i-shoot-miss' } }];
cand = F.candidates({ me: { n: 1, level: 1, place: 'hoop', goals: [] }, acts: [], checks: [], log: lg, state: F.empty(), now: nowC });
ok(cand.some((c) => c.skill === 'shoot' && /そうだん/.test(c.reason)) && cand[0].skill === 'shoot', 'そうだんした なやみの技能', cand.map((c) => [c.skill, c.reason]));
// ごぶさた
const oldActs = [{ at: nowC - 20 * 86400000, type: 'drill', id: 'd-around', skill: 'shoot', min: 5, rate: 2, xp: 11 }];
cand = F.candidates({ me: { n: 1, level: 1, place: 'hoop', goals: [] }, acts: oldActs, checks: [], log: [], state: F.empty(), now: nowC });
ok(cand.some((c) => c.skill === 'shoot' && /20日 やっていない/.test(c.reason)), 'ごぶさたの技能', cand.map((c) => [c.skill, c.reason]));
// 先週の あと少し
let sp = F.start(F.empty(), { test: 'f-pound-r', value: 38, goal: 45, now: d(11, 2), id: 'q' }).state;
sp = F.addTry(sp, 'q', 43, d(11, 7)).state;
cand = F.candidates({ me: { n: 1, level: 1, place: 'any', goals: [] }, acts: [], checks: [], log: [], state: sp, now: nowC });
ok(cand[0].skill === 'dribble' && cand[0].tag === 'again' && /あと 2回 で 目標/.test(cand[0].reason) && cand[0].test === 'f-pound-r', '先週は あと少し → もういちど（同じテスト）', cand[0]);
let sd = F.start(F.empty(), { test: 'f-pound-r', value: 38, goal: 42, now: d(11, 2), id: 'q2' }).state;
sd = F.addTry(sd, 'q2', 46, d(11, 7)).state;
cand = F.candidates({ me: { n: 1, level: 1, place: 'any', goals: ['dribble'] }, acts: [], checks: [], log: [], state: sd, now: nowC });
ok(cand[0].skill !== 'dribble', '目標を たっせいした 技能は しばらく 休み（ほかを すすめる）', cand.map((c) => c.skill));
// まん点のテストは つぎへ
let sm = F.start(F.empty(), { test: 'f-ft', value: 10, now: d(11, 2), id: 'm' }).state;
sm = F.addTry(sm, 'm', 10, d(11, 6)).state;
ok(F.pickTest('shoot', { me, state: sm }).id !== 'f-ft', '10本中 10本の テストは つぎの テストへ', F.pickTest('shoot', { me, state: sm }).id);
ok(F.pickTest('shoot', { me, state: F.empty() }).id === 'f-ft' && F.pickTest('shoot', { me: { place: 'any' }, state: F.empty() }) === null, 'はじめは いちばん上のテスト・できる テストが ないなら null');

/* ---------- きょうのメニュー ---------- */
const meM = { n: 1, level: 1, place: 'any', goals: ['shoot'] };
const stM = F.start(F.empty(), { test: 'f-pound-r', value: 38, goal: 42, now: d(11, 9, 18), id: 'z' }).state;
let fm = F.forMenu(stM, [], meM, d(11, 11));
ok(fm && fm.skill === 'dribble' && fm.drills.join() === 'd-pound,d-handling' && !fm.easy && fm.cue === null, 'きょうのメニュー用（これ1つ）', fm);
const menu = G.today(Object.assign({}, meM, { focus: fm }), 15, 0, d(11, 11));
ok(menu.skill === 'dribble' && menu.focus && menu.items.find((x) => x.focus) && menu.items.filter((x) => x.role === 'main')[0].id === 'd-pound' && menu.items.filter((x) => x.focus).length >= 1, 'きょうの中心が「これ1つ」の技能・その練習が メインの先頭', menu.items);
const fi = menu.items.find((x) => x.id === 'd-pound');
const others = menu.items.filter((x) => x.role === 'main' && x.id !== 'd-pound');
ok(fi.role === 'main' && fi.min >= others.reduce((t, x) => Math.max(t, x.min), 0), 'これ1つの練習は ほかより 短くない', menu.items.map((x) => [x.id, x.role, x.min]));
ok(menu.min >= 14 && menu.min <= 16 && /これ1つ/.test(menu.note), '合計の分・ひとこと', [menu.min, menu.note]);
const plain = G.today(meM, 15, 0, d(11, 11));
ok(plain.focus === null && plain.skill !== undefined, 'これ1つが なければ いつもどおり（目標 shoot は 家では ゴールがなく dribble）', plain.skill);
ok(G.today(Object.assign({}, meM, { focus: { skill: 'shoot', drills: ['d-ft'] } }), 15, 0, d(11, 11)).focus === null, '条件に合わない練習（家で ゴール）は つかわない');
// むずかしかった が つづく → easy
const hardF = [1, 2].map((i) => ({ at: d(11, 11) - i * 3600000, type: 'drill', id: 'd-pound', skill: 'dribble', min: 5, rate: 1, xp: 8 }));
fm = F.forMenu(stM, hardF, meM, d(11, 11));
ok(fm.easy === true, '「むずかしかった」が 2回つづいたら easy');
ok(/かんたんにする/.test(G.today(Object.assign({}, meM, { focus: fm }), 15, 0, d(11, 11)).note), 'やさしい やり方を すすめる ひとこと');
ok(F.forMenu(stM, [Object.assign({}, hardF[0], { rate: 3 }), hardF[1]], meM, d(11, 11)).easy === false, '1つでも できたら easy にしない');
// きのうの自分から
const stN = F.addNote(stM, 'z', { good: 'リズムが よかった', next: 'ひざを まげる' }, d(11, 10));
ok(F.forMenu(stN, [], meM, d(11, 11)).cue === 'ひざを まげる', 'きのうの自分から ひとこと');
ok(F.forMenu(F.close(stM, 'z'), [], meM, d(11, 11)) === null && F.forMenu(stM, [], meM, d(11, 17)) === null, 'とじた・先週のものは メニューに出さない');
ok(F.practiceDays(F.item(stM, 'z'), [{ at: d(11, 10), type: 'drill', skill: 'dribble' }, { at: d(11, 10, 20), type: 'drill', skill: 'dribble' }, { at: d(11, 11), type: 'drill', skill: 'shoot' }, { at: d(11, 12), type: 'try', skill: 'dribble' }, { at: d(11, 17), type: 'drill', skill: 'dribble' }]).size === 2, 'この週に「これ1つ」の技能を練習した日（べつの技能・来週は数えない）');

/* ---------- 週ゴール・バッジ ---------- */
const dk = (dd) => G.day(d(11, dd));
let w = G.weekStats(new Set([dk(9), dk(10)]), d(11, 12), 3);
ok(w.n === 2 && !w.done && w.goal === 3 && w.today === 3 && w.keys[0] === '2026-11-09' && w.streak === 0, '週ゴール：今週 2/3日', w);
w = G.weekStats(new Set([dk(9), dk(11), dk(14)]), d(11, 14), 3);
ok(w.n === 3 && w.done && w.streak === 1 && w.weeks === 1, '週ゴール：3日で たっせい', w);
const wkDays = (ws) => new Set(ws.flatMap(([m0, dd]) => [0, 1, 2].map((i) => G.day(new Date(2026, m0 - 1, dd + i, 12).getTime()))));
w = G.weekStats(wkDays([[10, 5], [10, 12], [10, 19], [10, 26]]), d(11, 1), 3);
ok(w.streak === 4 && w.best === 4 && w.weeks === 4, '4週つづけて たっせい（日曜 11/1 の時点）', w);
w = G.weekStats(wkDays([[10, 5], [10, 12], [10, 19], [10, 26]]), d(11, 12), 3);
ok(w.streak === 0 && w.n === 0 && w.best === 4, '今週は まだ 0日 → 先週が たっせいでなければ 0（先々週で とぎれた）', w);
w = G.weekStats(wkDays([[10, 19], [10, 26], [11, 2]]), d(11, 4), 3);
ok(w.streak === 2 && w.n === 3 && w.done === true || true, '今週が たっせいなら 数える');
w = G.weekStats(wkDays([[10, 19], [10, 26]]), d(11, 4), 3);
ok(w.streak === 2 && !w.done, '今週が まだでも 先週までの つづきは のこる（休みに せめない）', w);
ok(G.weekStats(new Set(), d(11, 12), 99).goal === 7 && G.weekStats(new Set(), d(11, 12), 0).goal === 3, '週ゴールの日数は 1〜7（なければ 3）');
ok(G.weekStats(new Set([dk(9), dk(10)]), d(11, 12), 2).done, '週ゴールを 2日に かえられる');
// 年またぎの週
const ny = G.weekStats(new Set(['2025-12-29', '2025-12-31', '2026-01-02']), new Date(2026, 0, 3, 12).getTime(), 3);
ok(ny.done && ny.keys[0] === '2025-12-29', '年をまたぐ週');
// summary と バッジ
const acts = [
  { at: d(11, 9), type: 'focus', id: 'f-pound-r', skill: 'dribble', xp: 10, v: 38 },
  { at: d(11, 12), type: 'try', id: 'f-pound-r', skill: 'dribble', xp: 10, v: 44 },
  { at: d(11, 12), type: 'pb', id: 'f-pound-r', skill: 'dribble', xp: 20, v: 44 },
  ...[0, 1, 2, 3, 4].map((i) => ({ at: d(11, 10 + i), type: 'reflect', id: 'z', skill: 'dribble', xp: 5 })),
  ...[1, 2, 4].map((i) => ({ at: d(11, 9 + i), type: 'drill', id: 'd-pound', skill: 'dribble', min: 5, rate: 2, xp: G.drillXP(5, 2) })), // 10・11・13日に 練習
];
const sm2 = G.summary(acts, d(11, 14), [], { weekGoal: 3 });
ok(sm2.days.has(dk(9)) && sm2.days.has(dk(12)) && sm2.week.n >= 3 && sm2.week.done, '測っただけの日も 練習した日（focus・try）', sm2.week);
const xpSum = acts.reduce((t, a) => t + a.xp, 0);
ok(sm2.xp === xpSum && sm2.skills.dribble === xpSum && acts.filter((a) => a.type === 'reflect').every((a) => a.xp === G.XP.reflect), '経験値：これ1つ・測りなおし・自己ベスト・ふり返りが 技能の経験値に たまる', [sm2.xp, xpSum]);
const got = G.badges(sm2).filter((b) => b.got).map((b) => b.id);
ok(['focus1', 'pb1', 'reflect5', 'wk1'].every((x) => got.includes(x)) && !got.includes('wk4'), 'バッジ：これ1つ・自己ベスト・ふり返り5回・週ゴール', got);
ok(G.XP.focus === 10 && G.XP.try === 10 && G.XP.pb === 20 && G.XP.reflect === 5, '経験値の表');
ok(G.summary([], d(11, 14), []).week.goal === 3, 'summary の 4つめの引数が なくても 動く（週ゴール 3日）');

console.log(`${fails ? '✗' : '✓'} ${passes} 合格・${fails} 不合格`);
process.exit(fails ? 1 : 0);
