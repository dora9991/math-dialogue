#!/usr/bin/env node
/* 検査：日付・祝日・日程・くじの本数・申込や予約の判定・抽選・違反点数・サンプル（画面は使わない）。
   使い方：  node tools/test.cjs        （Node 18 以上。ほかに入れるものはない） */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
for (const f of ['rules', 'lottery', 'actions', 'sample']) require(path.join(__dirname, '..', 'js', `${f}.js`));
const GB = globalThis.GB, D = GB.date, A = GB.act;

// 小さな状態：中部の学校体育館（半面あり・全面だけ）と、北部の市の体育館
function mini(clock = '2026-10-05') {
  const org = (id, type, districtId, extra = {}) => ({ id, name: id, type, districtId, inCity: true, status: 'approved', points: 0, suspendUntil: null, lossStreak: 0, ...extra });
  return {
    v: 1, seq: 1, clock, settings: GB.defaults(),
    districts: [{ id: 'd1', name: '中部' }, { id: 'd2', name: '北部' }],
    facilities: [
      { id: 'f1', name: '中学校', kind: 'school', districtId: 'd1', areas: 2 },
      { id: 'f2', name: '小学校', kind: 'school', districtId: 'd1', areas: 1 },
      { id: 'f3', name: '市の体育館', kind: 'city', districtId: 'd2', areas: 2 },
    ],
    orgs: [org('y1', 'youth', 'd1'), org('y2', 'youth', 'd2'), org('c1', 'club', 'd1'), org('g1', 'general', 'd2'), org('s1', 'commercial', 'd1'),
      org('x1', 'general', null, { inCity: false }), org('p1', 'general', 'd1', { status: 'pending' })],
    regulars: [], blocks: [], apps: [], bookings: [], runs: [], notices: [],
  };
}
const ok = r => { assert.equal(r.ok, true, r.msg); return r; };

test('日付の計算', () => {
  assert.equal(D.wd('2026-10-14'), 3);                       // 水曜
  assert.equal(D.add('2026-12-31', 1), '2027-01-01');
  assert.equal(D.diff('2026-11-01', '2026-10-25'), 7);
  assert.equal(D.addMonths('2026-12', 1), '2027-01');
  assert.equal(D.addMonths('2027-01', -1), '2026-12');
  assert.equal(D.days('2028-02'), 29);
  assert.equal(D.on('2026-02', 31), '2026-02-28');
});

test('祝日（振替休日・国民の休日をふくむ）', () => {
  assert.equal(GB.holiday('2026-10-12'), 'スポーツの日');
  assert.equal(GB.holiday('2026-11-03'), '文化の日');
  assert.equal(GB.holiday('2026-09-22'), '国民の休日');      // 敬老の日と秋分の日にはさまれた日
  assert.equal(GB.holiday('2027-01-11'), '成人の日');
  assert.equal(GB.holiday('2027-03-21'), '春分の日');
  assert.equal(GB.holiday('2027-03-22'), '振替休日');        // 春分の日が日曜
  assert.equal(GB.holiday('2026-11-04'), '');
  assert.equal(GB.dayType('2026-11-03'), 'holiday');
  assert.equal(GB.dayType('2026-11-04'), 'weekday');
});

test('月の日程と段階（佐賀市の体育施設と同じ：前月1〜9日申込・10日抽選・15日まで確定・16日から先着）', () => {
  const st = mini();
  const sc = GB.schedule(st, '2026-11');
  assert.deepEqual([sc.applyStart, sc.applyEnd, sc.draw, sc.confirmEnd, sc.firstCity], ['2026-10-01', '2026-10-09', '2026-10-10', '2026-10-15', '2026-10-16']);
  assert.equal(GB.phase(st, '2026-11', '2026-09-30'), 'before');
  assert.equal(GB.phase(st, '2026-11', '2026-10-09'), 'apply');
  assert.equal(GB.phase(st, '2026-11', '2026-10-10'), 'drawing');   // 抽選するまでは先に進まない
  assert.equal(GB.lotteryMonth(st), '2026-11');
  const bad = { ...GB.defaults(), drawDay: 5 };
  assert.ok(GB.checkSettings(bad).length > 0);
  assert.deepEqual(GB.checkSettings(GB.defaults()), []);
});

test('くじの本数（区分の基本＋地区内＋優先時間帯＋前回はずれ）', () => {
  const st = mini(), f1 = st.facilities[0], f3 = st.facilities[2];
  const after = GB.slot(st, f1, '2026-11-04', 'after');
  assert.equal(GB.tickets(st, GB.find(st.orgs, 'y1'), f1, after).total, 7);   // 3＋2＋2
  assert.equal(GB.tickets(st, GB.find(st.orgs, 'c1'), f1, after).total, 7);
  assert.equal(GB.tickets(st, GB.find(st.orgs, 'g1'), f1, after).total, 2);   // 地区外の一般・優先の対象外
  const s1 = GB.find(st.orgs, 's1');
  assert.equal(GB.tickets(st, s1, f3, GB.slot(st, f3, '2026-11-04', 'am')).total, 1);
  const y2 = GB.find(st.orgs, 'y2');
  y2.lossStreak = 5;                                          // 数えるのは 2 回ぶんまで
  assert.equal(GB.tickets(st, y2, f3, GB.slot(st, f3, '2026-11-04', 'am')).total, 3 + 2 + 2);
});

test('申込・予約ができない理由', () => {
  const st = mini();
  const why = (o, f, d, s, n, mode = 'apply') => GB.blocker(st, o, f, d, s, n, mode);
  assert.match(why('x1', 'f1', '2026-11-07', 'am', 'full'), /市内に住む・通う・働く人の団体/);
  assert.match(why('x1', 'f3', '2026-11-07', 'am', 'full'), /市外の団体は抽選に申し込めません/);
  assert.match(why('s1', 'f1', '2026-11-07', 'am', 'full'), /営利目的の団体は、学校体育館を使えません/);
  assert.equal(why('s1', 'f3', '2026-11-07', 'am', 'half'), '');
  assert.match(why('p1', 'f1', '2026-11-07', 'am', 'full'), /承認されていません/);
  assert.match(why('y1', 'f2', '2026-11-07', 'am', 'half'), /半面に分けられません/);
  assert.match(why('y1', 'f1', '2026-11-04', 'am', 'full'), /このコマがありません/);   // 平日に午前はない
  assert.match(why('y1', 'f1', '2026-12-30', 'am', 'full'), /休館日/);
  ok(A.apply(st, 'y1', 'f1', '2026-11-07', 'am', 'full'));
  assert.match(why('y1', 'f1', '2026-11-07', 'am', 'full'), /申し込み済み/);
  st.settings.maxApps = 2;
  ok(A.apply(st, 'y1', 'f1', '2026-11-08', 'am', 'full'));
  assert.match(why('y1', 'f1', '2026-11-14', 'am', 'full'), /2 件まで/);
  st.regulars.push({ id: 'r1', facilityId: 'f2', orgId: 'c1', weekday: 3, slotId: 'night', need: 'full', half: null, from: '2026-04-01', to: '2027-03-31' });
  assert.match(why('c1', 'f1', '2026-11-04', 'after', 'full'), /1日 1 コマまで/);   // 水曜は定期枠がある
  st.settings.commercialSchool = 'first';
  assert.match(why('s1', 'f1', '2026-11-07', 'am', 'full'), /抽選には申し込めません/);
  assert.match(why('y1', 'f1', '2026-11-21', 'am', 'full', 'book'), /16 から/);
});

// 申込をたくさん作って抽選する
function crowd(seed) {
  const st = mini('2026-10-02'), rnd = GB.rng(seed);
  st.settings.maxApps = 30;
  const orgs = ['y1', 'y2', 'c1', 'g1'];
  for (const d of D.list('2026-11')) for (const f of ['f1', 'f3']) {
    const fac = GB.find(st.facilities, f);
    for (const s of GB.slotsOn(st, fac, d)) for (const o of orgs) if (rnd() < 0.18) A.apply(st, o, f, d, s.id, rnd() < 0.5 ? 'full' : 'half');
  }
  return st;
}

test('抽選：同じ申込と同じシードなら、同じ結果', () => {
  const st = crowd('crowd-1'), input = GB.lotteryInput(st, '2026-11');
  assert.ok(input.items.length > 60, `申込 ${input.items.length} 件`);
  assert.deepEqual(GB.draw(input, 'abc').results, GB.draw(input, 'abc').results);
  assert.notDeepEqual(GB.draw(input, 'abc').results, GB.draw(input, 'abd').results);
});

test('抽選：上限・1日のコマ数・区画の数を守る', () => {
  for (const seed of ['s1', 's2', 's3', 's4', 's5']) {
    const st = crowd(`crowd-${seed}`), input = GB.lotteryInput(st, '2026-11'), out = GB.draw(input, seed);
    const wins = {}, days = {}, units = {};
    for (const it of input.items) {
      const r = out.results[it.appId];
      assert.ok(['won', 'lost'].includes(r.status));
      if (r.status !== 'won') { assert.ok(r.reason); continue; }
      wins[it.orgId] = (wins[it.orgId] || 0) + 1;
      const dk = `${it.orgId}|${it.date}`;
      days[dk] = (days[dk] || 0) + 1;
      const u = units[it.key] = units[it.key] || [];
      if (it.need === 'full') { assert.equal(u.length, 0, `${it.key} 全面が重なった`); u.push('A', 'B'); }
      else { assert.ok(!u.includes(r.half), `${it.key} ${r.half}面が重なった`); u.push(r.half); }
    }
    for (const n of Object.values(wins)) assert.ok(n <= input.maxWins);
    for (const n of Object.values(days)) assert.ok(n <= input.maxPerDay);
    for (const [k, u] of Object.entries(units)) assert.ok(u.length <= input.capacity[k].units);
  }
});

test('抽選：くじの本数に比例して当たる（7本 対 2本 → 約 78％）', () => {
  let a = 0;
  const N = 3000;
  const input = { month: '2026-11', invalid: [], dayUsed: {}, maxWins: 9, maxPerDay: 9, capacity: { k: { units: 1, free: ['A'] } },
    items: [{ appId: 'a1', orgId: 'o1', key: 'k', date: '2026-11-07', need: 'full', tickets: 7 }, { appId: 'a2', orgId: 'o2', key: 'k', date: '2026-11-07', need: 'full', tickets: 2 }] };
  for (let i = 0; i < N; i++) if (GB.draw(input, `p${i}`).results.a1.status === 'won') a++;
  assert.ok(Math.abs(a / N - 7 / 9) < 0.03, `当たった割合 ${(a / N).toFixed(3)}`);
});

test('抽選：全面と半面がまざっても、重ならない', () => {
  const input = { month: '2026-11', invalid: [], dayUsed: {}, maxWins: 9, maxPerDay: 9, capacity: { k: { units: 2, free: ['A', 'B'] } },
    items: [{ appId: 'a1', orgId: 'o1', key: 'k', date: 'd', need: 'full', tickets: 3 }, { appId: 'a2', orgId: 'o2', key: 'k', date: 'd', need: 'half', tickets: 3 }, { appId: 'a3', orgId: 'o3', key: 'k', date: 'd', need: 'half', tickets: 3 }] };
  const seen = new Set();
  for (let i = 0; i < 300; i++) {
    const r = GB.draw(input, `m${i}`).results, won = Object.keys(r).filter(k => r[k].status === 'won').sort().join(',');
    assert.ok(['a1', 'a2,a3'].includes(won), won);
    seen.add(won);
  }
  assert.equal(seen.size, 2);
});

test('抽選の流れ：当選 → 確定の締切 → 取り消し、落選が続いた団体', () => {
  const st = mini('2026-10-03');
  ok(A.apply(st, 'y1', 'f2', '2026-11-07', 'am', 'full'));
  ok(A.apply(st, 'g1', 'f2', '2026-11-07', 'am', 'full'));
  ok(A.apply(st, 'y1', 'f1', '2026-11-14', 'am', 'full'));
  ok(A.runLottery(st, '2026-11', 'test-seed'));
  assert.equal(st.clock, '2026-10-10');                       // 抽選日まで進んだ
  const run = st.runs[0];
  assert.ok(GB.verifyRun(run));
  const pend = st.bookings.filter(b => b.status === 'pending');
  assert.ok(pend.length >= 2);
  const loser = st.apps.find(a => a.status === 'lost');
  assert.equal(GB.find(st.orgs, loser.orgId).lossStreak, loser.orgId === 'g1' ? 1 : 0);
  ok(A.confirm(st, pend[0].id));
  ok(A.setClock(st, '2026-10-16'));
  assert.equal(GB.find(st.bookings, pend[0].id).status, 'confirmed');
  assert.equal(GB.find(st.bookings, pend[1].id).status, 'expired');
  assert.ok(st.notices.some(n => /確定の手続きがなかった/.test(n.text)));
  run.results[Object.keys(run.results)[0]].status = 'lost';  // 記録を書きかえると、確かめで分かる
  assert.equal(GB.verifyRun(run), false);
});

test('先着：受付の日・市外の団体・1か月の上限', () => {
  const st = mini('2026-10-03');
  st.settings.firstAll = 20;
  ok(A.runLottery(st, '2026-11', 'x'));
  assert.equal(A.book(st, 'y1', 'f1', '2026-11-07', 'am', 'full').ok, false);   // まだ 10/10
  ok(A.setClock(st, '2026-10-16'));
  ok(A.book(st, 'y1', 'f1', '2026-11-07', 'am', 'half'));
  assert.match(A.book(st, 'y1', 'f1', '2026-11-07', 'pm', 'full').msg, /1日 1 コマまで/);
  assert.match(A.book(st, 'x1', 'f3', '2026-11-07', 'am', 'full').msg, /市外の団体は 10\/20 から/);
  ok(A.setClock(st, '2026-10-20'));
  ok(A.book(st, 'x1', 'f3', '2026-11-07', 'am', 'full'));
  st.settings.maxTotal = 2;
  ok(A.book(st, 'y1', 'f1', '2026-11-08', 'am', 'full'));
  assert.match(A.book(st, 'y1', 'f1', '2026-11-14', 'am', 'full').msg, /2 コマまで/);
  assert.match(A.book(st, 'g1', 'f1', '2026-11-07', 'am', 'full').msg, /半面しか空いていない/);
  ok(A.book(st, 'g1', 'f1', '2026-11-07', 'am', 'half'));
  assert.deepEqual(GB.occupancy(st, st.facilities[0], '2026-11-07', 'am').free, []);
});

test('違反点数：直前のキャンセル・無断の不使用 → 停止', () => {
  const st = mini('2026-10-03');
  ok(A.runLottery(st, '2026-11', 'x'));
  ok(A.setClock(st, '2026-10-20'));
  const last = () => st.bookings[st.bookings.length - 1];
  ok(A.book(st, 'g1', 'f3', '2026-11-07', 'am', 'full'));
  ok(A.cancel(st, last().id));                                // 18 日前：違反にならない
  assert.equal(GB.find(st.orgs, 'g1').points, 0);
  ok(A.setClock(st, '2026-11-01'));
  ok(A.book(st, 'g1', 'f3', '2026-11-05', 'am', 'full'));
  ok(A.cancel(st, last().id));                                // 4 日前：違反 1 点
  assert.equal(GB.find(st.orgs, 'g1').points, 1);
  assert.match(A.book(st, 'g1', 'f3', '2026-11-03', 'am', 'full').msg, /3 日前まで/);
  ok(A.book(st, 'g1', 'f3', '2026-11-08', 'am', 'full'));
  const b3 = last();
  ok(A.setClock(st, '2026-11-09'));
  ok(A.markUse(st, b3.id, false));                            // 無断の不使用：2 点 → 合計 3 点で停止
  const g1 = GB.find(st.orgs, 'g1');
  assert.equal(g1.points, 0);
  assert.equal(g1.suspendUntil, '2026-12-09');
  assert.match(GB.blocker(st, 'g1', 'f3', '2026-11-28', 'am', 'full', 'book'), /止めています/);
  ok(A.setClock(st, '2026-12-09'));
  assert.equal(g1.suspendUntil, null);
});

test('学校行事を入れると、予約・申込・定期枠の団体にお知らせ（違反にはしない）', () => {
  const st = mini('2026-10-03');
  ok(A.apply(st, 'y1', 'f1', '2026-11-07', 'am', 'half'));
  st.regulars.push({ id: 'r1', facilityId: 'f1', orgId: 'c1', weekday: 6, slotId: 'pm', need: 'full', half: null, from: '2026-04-01', to: '2027-03-31' });
  ok(A.addBlock(st, { facilityId: 'f1', date: '2026-11-07', slotId: null, kind: 'school', reason: '学習発表会' }));
  assert.equal(st.apps[0].status, 'invalid');
  assert.ok(st.notices.some(n => n.orgId === 'y1') && st.notices.some(n => n.orgId === 'c1'));
  assert.match(GB.blocker(st, 'g1', 'f1', '2026-11-07', 'night', 'half', 'apply'), /学習発表会/);
  assert.equal(GB.find(st.orgs, 'y1').points, 0);
});

test('定期枠：1団体 週の上限・体育館ごとの割合・予約との重なり', () => {
  const st = mini('2026-10-03');
  ok(A.addRegular(st, { facilityId: 'f1', orgId: 'c1', weekday: 2, slotId: 'after', need: 'full' }));
  ok(A.addRegular(st, { facilityId: 'f1', orgId: 'c1', weekday: 4, slotId: 'after', need: 'full' }));
  assert.match(A.addRegular(st, { facilityId: 'f1', orgId: 'c1', weekday: 1, slotId: 'after', need: 'full' }).msg, /週 2 コマまで/);
  assert.match(A.addRegular(st, { facilityId: 'f1', orgId: 'y1', weekday: 2, slotId: 'after', need: 'half' }).msg, /もう定期枠があります/);
  st.settings.regularMax = 15;                                // 3 つ目の全面で 6/32 区画＝19％
  assert.match(A.addRegular(st, { facilityId: 'f1', orgId: 'y1', weekday: 1, slotId: 'after', need: 'full' }).msg, /上限の 15％/);
  assert.equal(GB.slot(st, st.facilities[0], '2026-11-03', 'after'), null);   // 祝日の火曜は平日のコマがない
});

test('サンプル：どの月に開いても組み立てられ、抽選の記録を確かめられる', () => {
  for (const now of ['2026-10-14', '2026-12-20', '2027-01-03', '2027-03-28', '2027-04-02', '2027-08-15']) {
    const st = GB.sample(new Date(`${now}T09:00:00`));
    const ym = now.slice(0, 7);
    assert.equal(st.clock, `${ym}-05`);
    assert.equal(st.runs.length, 1);
    assert.ok(GB.verifyRun(st.runs[0]));
    assert.equal(GB.phase(st, ym), 'firstAll');
    assert.equal(GB.phase(st, GB.lotteryMonth(st)), 'apply');
    const apps = st.apps.filter(a => a.month === GB.lotteryMonth(st));
    assert.ok(apps.length > 40, `${now}: 来月分の申込 ${apps.length} 件`);
    assert.ok(apps.every(a => a.status === 'applied'));
    assert.ok(st.runs[0].input.items.length > 40);
    for (const o of st.orgs) assert.ok(GB.appCount(st, o.id, GB.lotteryMonth(st)) <= st.settings.maxApps);
  }
});
