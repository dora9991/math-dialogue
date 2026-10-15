#!/usr/bin/env node
/* js/core.js（画面を持たない計算）のテスト。使い方：node hibi/tools/check-core.cjs */
'use strict';
const HB = require('../js/core.js');
let failures = 0, passed = 0;
const eq = (a, b, msg) => { const A = JSON.stringify(a), B = JSON.stringify(b); if (A === B) passed++; else { failures++; console.log(`  ✗ ${msg}\n      期待: ${B}\n      実際: ${A}`); } };
const ok = (c, msg) => eq(!!c, true, msg);

console.log('■ 日付');
eq(HB.ymdOf(new Date('2026-10-15T15:30:00Z')), '2026-10-16', 'UTC 15:30 は日本の翌日');
eq(HB.hmOf(new Date('2026-10-15T15:30:00Z')), '00:30', '日本時間の時刻');
eq(HB.addDays('2026-12-31', 1), '2027-01-01', '年をまたぐ');
eq(HB.addDays('2028-03-01', -1), '2028-02-29', 'うるう年');
eq(HB.diffDays('2026-10-15', '2026-11-06'), 22, '日数の差');
eq(HB.labelDay('2026-10-15'), '10月15日（木）', '日付の見出し');
eq(HB.labelShort('2026-11-06'), '11/6(金)', '短い日付');
eq(HB.relDay('2026-10-16', '2026-10-15'), 'あした', 'あした');
eq(HB.relDay('2026-10-12', '2026-10-15'), '3日前', '3日前');
eq(HB.addMonths('2026-12', 1), '2027-01', '月をまたぐ');
const g = HB.monthGrid('2026-10');
eq([g.length, g[0][0].ymd, g[0][4].ymd, g[g.length - 1][6].ymd], [5, '2026-09-27', '2026-10-01', '2026-10-31'], '2026年10月のカレンダー（日曜はじまり）');
eq(HB.monthGrid('2026-02').length, 4, '2026年2月は4週');
const gm = HB.monthGrid('2026-10', 1);
eq([gm.length, gm[0][0].ymd, gm[0][3].ymd, gm[gm.length - 1][6].ymd], [5, '2026-09-28', '2026-10-01', '2026-11-01'], '2026年10月（月曜はじまり）');
eq([HB.monthGrid('2026-11', 1).length, HB.monthGrid('2026-11', 1)[0][0].ymd], [6, '2026-10-26'], '2026年11月（1日が日曜なので6週）');
eq([HB.isoWeek('2026-10-19'), HB.isoWeek('2026-11-09'), HB.isoWeek('2026-11-15')], [43, 46, 46], '週番号（FirstSeed と同じ）');
eq([HB.isoWeek('2026-12-31'), HB.isoWeek('2027-01-03'), HB.isoWeek('2027-01-04')], [53, 53, 1], '年またぎの週番号');
eq(HB.labelWhen('2026-10-15T05:52:00+09:00', '2026-10-15'), 'きょう 5:52', 'けさの時刻');
eq(HB.labelWhen('2026-10-14T18:02:00+09:00', '2026-10-15'), 'きのう 18:02', 'きのう');

console.log('■ その日に出すもの');
const st = {
  memos: [
    { id: 'm1', text: 'A', dates: ['2026-10-15'], important: false, updatedAt: '2026-10-15T01:00:00Z' },
    { id: 'm2', text: 'B', dates: ['2026-10-15'], important: true, updatedAt: '2026-10-14T01:00:00Z' },
    { id: 'm3', text: 'C', dates: [], important: true },
    { id: 'm4', text: 'D', dates: ['2026-10-15'], archived: true }
  ],
  items: [{ id: 'i1', dates: ['2026-10-15', '2026-10-30'], status: 'organized', important: true }, { id: 'i2', dates: ['2026-10-15'], status: 'archived' }],
  ios: {
    events: [{ title: '会議', d0: '2026-10-15', d1: '2026-10-15', t0: '15:30', allDay: false }, { title: '朝', d0: '2026-10-15', d1: '2026-10-15', t0: '08:15', allDay: false },
      { title: '出張', d0: '2026-10-14', d1: '2026-10-16', allDay: true, t0: '' }],
    reminders: [{ title: '過ぎた', due: '2026-10-10' }, { title: '今日', due: '2026-10-15', dueTime: '07:30' }, { title: '明日', due: '2026-10-16' }, { title: '期日なし', due: '' }]
  },
  briefings: { '2026-10-15': { summary: 'x' } },
  proposals: [{ id: 'p1' }]
};
const v = HB.dayView(st, '2026-10-15', '2026-10-15');
eq(v.events.map(e => e.title), ['出張', '朝', '会議'], '予定：終日が先、あとは時刻の順');
eq(v.reminders.map(r => r.title + (r.overdue ? '!' : '')), ['過ぎた!', '今日'], '今日のリマインダー（期限切れも）');
eq(v.memos.map(m => m.id), ['m2', 'm1'], 'メモ：重要が先・しまったものは出さない');
eq(v.pinned.map(m => m.id), ['m3'], '日付なしの重要メモ');
eq(v.items.map(i => i.id), ['i1'], '画像・資料');
eq([!!v.briefing, v.proposals.length], [true, 1], 'まとめ・確認（今日だけ）');
const v2 = HB.dayView(st, '2026-10-16', '2026-10-15');
eq([v2.reminders.map(r => r.title), v2.pinned.length, v2.proposals.length], [['明日'], 0, 0], 'ほかの日には、期限切れ・ピン留め・確認を出さない');
const mk = HB.monthMarks(st, '2026-10');
eq(mk['2026-10-15'], { ev: 3, memo: 2, item: 1, star: true }, '印（その日）');
eq(mk['2026-10-16'], { ev: 1, memo: 0, item: 0, star: false }, '何日かつづく予定');
eq(mk['2026-10-30'], { ev: 0, memo: 0, item: 1, star: true }, '写真の別の日');

console.log('■ 月のカレンダーの帯');
const ce = HB.calEntries(st, '2026-10-12', '2026-10-18');
eq(ce.map(e => e.kind + ':' + (e.title || e.id) + ':' + e.d0).sort(), ['ev:出張:2026-10-14', 'ev:会議:2026-10-15', 'ev:朝:2026-10-15', 'item:i1:2026-10-15', 'memo:A:2026-10-15', 'memo:B:2026-10-15',
  'rem:今日:2026-10-15', 'rem:明日:2026-10-16'].sort(), 'その週の予定・リマインダー・メモ・資料（しまったもの・期日なしは出さない）');
const days = Array.from({ length: 7 }, (_, i) => HB.addDays('2026-10-12', i));
const lay = HB.weekLayout(days, ce, 10);
const pos = t => { const b = lay.bars.find(x => x.e.title === t || x.e.id === t); return b ? [b.c0, b.c1, b.lane] : null; };
eq(pos('出張'), [2, 4, 0], '何日もつづく予定は1本の帯（いちばん上）');
eq([pos('B'), pos('i1'), pos('今日'), pos('朝'), pos('会議'), pos('A')], [[3, 3, 1], [3, 3, 2], [3, 3, 3], [3, 3, 4], [3, 3, 5], [3, 3, 6]],
  'その日の中の順：重要メモ → 重要な資料 → 予定とリマインダーは時刻の順 → メモ');
eq(pos('明日'), [4, 4, 1], '帯のない段に、つめて入れる');
eq(lay.more, [0, 0, 0, 0, 0, 0, 0], '入りきるときは +n なし');
const lay3 = HB.weekLayout(days, ce, 3);
eq(lay3.bars.filter(b => b.c0 <= 3 && b.c1 >= 3).map(b => b.e.title), ['出張', 'B'], '3段のとき：15日は2段まで出して、3段目は +n');
eq(lay3.more, [0, 0, 0, 5, 0, 0, 0], '+n の数（15日に、出せなかったのが5つ）');
ok(lay3.bars.some(b => b.e.title === '明日' && b.lane === 1), 'あふれていない日（16日）は、そのまま出す');
const span = HB.weekLayout(days, [{ kind: 'ev', title: '長い', d0: '2026-10-10', d1: '2026-10-25', allDay: true }, { kind: 'ev', title: '短い', d0: '2026-10-13', d1: '2026-10-13', allDay: true }], 1);
eq([span.bars.length, span.more], [0, [1, 2, 1, 1, 1, 1, 1]], '1段しかないとき、週をこえる帯も +n に数える');

console.log('■ 絞りこみ');
eq(HB.filterMemos(st.memos, { filter: 'star' }).map(m => m.id), ['m2', 'm3'], '★');
eq(HB.filterMemos(st.memos, { filter: 'archived' }).map(m => m.id), ['m4'], 'しまったもの');
eq(HB.filterMemos([{ id: 'x', text: 'ｱｲｳ 遠足' }], { q: 'アイウ' }).length, 1, '半角カナでもさがせる（NFKC）');
eq(HB.filterItems([{ id: 'a', status: 'inbox' }, { id: 'b', status: 'pending' }], { status: 'pending' }).map(i => i.id), ['b'], '確認待ち');

console.log('■ ショートカット・接続');
const u = HB.shortcutUrl('ひびの手帳から登録', { type: 'reminder', title: 'A&B', due: '2026-10-30 07:00' });
ok(u.startsWith('shortcuts://run-shortcut?name=%E3%81%B2'), '名前は URL エンコード');
eq(JSON.parse(decodeURIComponent(u.split('&text=')[1])), { type: 'reminder', title: 'A&B', due: '2026-10-30 07:00' }, '中身は JSON');
eq(HB.memoToIos({ text: '申込書\n担任へ', dates: ['2026-10-30'] }, 'reminder'), { type: 'reminder', title: '申込書', due: '2026-10-30 09:00', notes: '担任へ' }, 'メモ → リマインダー');
eq(HB.memoToIos({ text: '遠足', dates: ['2026-11-06'] }, 'event').allDay, '1', 'メモ → 終日の予定');
eq(HB.iosForShortcut({ type: 'event', title: 'x', start: '2026-10-28 16:00', end: '2026-10-28 17:00', allDay: false }).allDay, '0', '時刻つきの予定は allDay=0');
eq(HB.calshowUrl('2001-01-02'), 'calshow:86400', 'カレンダーApp を開く URL');
const link = '#connect=' + Buffer.from(JSON.stringify({ u: 'https://script.google.com/macros/s/AB_c-1/exec', t: 'hb_x' })).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
eq(HB.parseConnect(link), { url: 'https://script.google.com/macros/s/AB_c-1/exec', token: 'hb_x' }, '接続リンク');
eq(HB.parseConnect('#connect=@@@'), null, 'こわれた接続リンク');
eq(HB.checkGasUrl('https://script.google.com/macros/s/AB_c-1/exec').ok, true, '正しい URL');
ok(/\/exec/.test(HB.checkGasUrl('https://script.google.com/macros/s/AB/dev').why), '/dev は止める');
eq(HB.checkGasUrl('https://example.com/x').ok, false, 'ちがう URL');
eq(HB.esc('<a href="x">&\'</a>'), '&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;', 'HTML をよける');
eq([HB.safeUrl('javascript:alert(1)'), HB.safeUrl('https://a.b/c')], ['', 'https://a.b/c'], 'http(s) だけ');
ok(/^m_[a-z0-9]{12}$/.test(HB.uid('m_')), 'ID');
eq(HB.withDate(['2026-10-30'], '2026-10-15'), ['2026-10-15', '2026-10-30'], '日付を足す');
eq(HB.catIndex('健康', [{ name: '学校' }, { name: '健康' }]), 1, '分類の色は並び順');

console.log(`\n${failures ? '✗' : '✓'} ${passed} 件 OK${failures ? `、${failures} 件 失敗` : ''}`);
process.exit(failures ? 1 : 0);
