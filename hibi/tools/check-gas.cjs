#!/usr/bin/env node
/* 裏側（gas/Code.gs）のテスト。Google の代わりに tools/gas-mock.cjs の「にせもの」で動かす。
   使い方：node hibi/tools/check-gas.cjs     （失敗があれば一覧を出して、終了コード 1） */
'use strict';
const { createGasEnv } = require('./gas-mock.cjs');

let failures = 0, passed = 0;
function ok(cond, msg) { if (cond) passed++; else { failures++; console.log('  ✗ ' + msg); } }
function eq(a, b, msg) { const A = JSON.stringify(a), B = JSON.stringify(b); ok(A === B, msg + `\n      期待: ${B}\n      実際: ${A}`); }
function section(name, fn) {
  console.log('■ ' + name);
  try { fn(); } catch (e) { failures++; console.log('  ✗ 例外: ' + (e.stack || e)); }
}

const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 16]), Buffer.from('JFIF fake jpeg body')]);
const PNG = Buffer.concat([Buffer.from([0x89]), Buffer.from('PNG\r\n fake')]);
const PDF = Buffer.from('%PDF-1.4\n fake pdf');
const HEIC = Buffer.concat([Buffer.from([0, 0, 0, 24]), Buffer.from('ftypheic fake heic')]);
const b64 = buf => buf.toString('base64');

const heicFetch = (url, o, { nodes }) => {
  const m = /drive\/v3\/files\/([^?]+)\?fields=thumbnailLink/.exec(url);
  if (m) return { getResponseCode: () => 200, getContentText: () => JSON.stringify({ thumbnailLink: 'https://lh3.googleusercontent.com/drive-storage/' + m[1] + '=s220' }) };
  if (/lh3\.googleusercontent\.com\/drive-storage\/.+=s2048$/.test(url)) {
    return { getResponseCode: () => 200, getBlob: () => {
      let name = 'thumb';
      const blob = { getBytes: () => Array.from(JPEG, b => (b > 127 ? b - 256 : b)), getContentType: () => 'image/jpeg', getName: () => name, setName: n => { name = n; return blob; }, _buf: () => JPEG };
      return blob;
    } };
  }
  return null;
};

const env = createGasEnv({ fetch: [heicFetch] });
const today = env.today();
const addDays = (ymd, n) => { const [y, m, d] = ymd.split('-').map(Number); const t = new Date(Date.UTC(y, m - 1, d + n)); return t.toISOString().slice(0, 10); };
const tomorrow = addDays(today, 1);

section('setup：フォルダ・データ・合言葉・トリガー', () => {
  env.call('setup');
  ok(/^hb_[0-9a-f]{36}$/.test(env.props.get('TOKEN')), '合言葉ができる');
  ok(/^fk_/.test(env.props.get('FEED_KEY')), 'カレンダー購読の鍵ができる');
  eq(env.list('ひびの手帳'), ['_system', '受信箱', '整理済み', '確認待ち'], 'ひびの手帳の中のフォルダ');
  eq(env.list('ひびの手帳/_system'), ['claudeから', 'claudeへ', 'db.json', 'サムネイル', '元ファイル'], '_system の中');
  eq(env.list('ひびの手帳/_system/claudeから'), ['取り込み済み'], 'claudeから の中');
  eq(env.list('ひびの手帳/整理済み').length, 9, '分類のフォルダが 9 つ');
  eq(env.triggers.map(t => t.fn + ':' + t.everyHours), ['hourly:1'], '1時間ごとの見回り');
  ok(env.logs.some(l => l.includes('合言葉（トークン）：hb_')), 'ログに合言葉が出る');
  const tokenBefore = env.props.get('TOKEN');
  env.call('setup');
  eq(env.list('ひびの手帳'), ['_system', '受信箱', '整理済み', '確認待ち'], '2回目の setup でもフォルダは増えない');
  eq(env.list('ひびの手帳/整理済み').length, 9, '分類フォルダも増えない');
  eq(env.triggers.length, 1, 'トリガーも 1 つのまま');
  eq(env.props.get('TOKEN'), tokenBefore, '合言葉は変わらない');
  const ex = env.exportJson();
  eq(ex.schema, 'hibi-export/1', 'claudeへ に JSON が入る');
  eq(ex.categories.length, 9, 'claudeへ に分類');
  ok(ex.folders && ex.folders.inbox === env.find('ひびの手帳/受信箱').id, 'claudeへ に受信箱のフォルダID');
});

section('入口：合言葉・ping・GET', () => {
  eq(env.post('ping', {}, 'wrong').ok, false, '合言葉がちがうと断る');
  eq(env.post('ping', {}, '').error, 'unauthorized', '合言葉なしも断る');
  eq(env.postRaw('not json').ok, false, 'JSON でない本文も断る（合言葉なし）');
  const r = env.post('ping');
  eq([r.ok, r.data.app], [true, 'hibi'], 'ping');
  eq(env.post('nope').error, 'unknown_action: nope', '知らない動作');
  const form = env.postRaw(null, { token: env.props.get('TOKEN'), action: 'ping' });
  eq(form.ok, true, 'フォーム（URL のパラメータ）でも受け取る');
  ok(/裏側/.test(env.get({}).getContent()), 'ブラウザで開くと説明のページ');
  eq(env.get({ feed: 'ics', key: 'bad' }).getContent(), 'forbidden', '鍵がちがうと ICS を出さない');
});

let memoA, memoB;
section('メモ：つくる・直す・消す', () => {
  let r = env.post('memo.save', { memo: { text: '申込書を出す\n園の遠足の', important: true, dates: ['2026/10/30', today, 'あした'] } });
  ok(r.ok, 'メモを保存');
  memoA = r.data.memo;
  ok(/^m_[0-9a-f]{12}$/.test(memoA.id), 'メモの ID');
  eq(memoA.dates, ['2026-10-30', today].sort(), '日付は YYYY-MM-DD にそろえ、読めないものは捨てる');
  eq(memoA.important, true, '重要');
  eq(memoA.categorySource, '', '分類はまだ（Claude におまかせ）');
  ok(r.data.rev >= 1, 'rev が返る');
  r = env.post('memo.save', { memo: { id: 'm_clientmade01', text: '牛乳とパン', category: '暮らし・買い物' } });
  memoB = r.data.memo;
  eq([memoB.id, memoB.category, memoB.categorySource], ['m_clientmade01', '暮らし・買い物', 'manual'], 'アプリがつけた ID と、自分で決めた分類');
  r = env.post('memo.save', { memo: { id: memoB.id, category: '存在しない分類' } });
  eq([r.data.memo.category, r.data.memo.categorySource], ['', ''], '知らない分類は「おまかせ」にもどす');
  r = env.post('memo.save', { memo: { id: memoA.id, text: '申込書を出す（10/30まで）' } });
  eq([r.data.memo.text, r.data.memo.important], ['申込書を出す（10/30まで）', true], '一部だけ直せる');
  const tmp = env.post('memo.save', { memo: { text: '消すメモ' } }).data.memo;
  eq(env.post('memo.delete', { id: tmp.id }).data.deleted, 1, 'メモを消す');
  const st = env.post('bootstrap').data;
  eq(st.memos.map(m => m.id).sort(), [memoA.id, memoB.id].sort(), 'bootstrap にメモが出る');
  const ex = env.exportJson();
  eq(ex.memosToClassify, [], 'メモの保存だけでは claudeへ は書きかえない（見回りか同期のとき）');
});

let photo, photo2, pdfItem;
section('写真・PDF を入れる', () => {
  let r = env.post('item.upload', { name: '写真_20261015_081233.jpg', data: 'data:image/jpeg;base64,' + b64(JPEG), dates: [tomorrow], note: '遠足の持ち物', thumb: 'data:image/jpeg;base64,' + b64(JPEG) });
  ok(r.ok, '写真を入れる：' + r.error);
  photo = r.data.item;
  eq([photo.kind, photo.mime, photo.status, photo.source], ['photo', 'image/jpeg', 'inbox', 'app'], '写真の記録');
  eq(env.parentPath(photo.fileId), 'ひびの手帳/受信箱', '受信箱に入る');
  eq(photo.dates, [tomorrow], '選んだ日付');
  ok(photo.thumbFileId && env.parentPath(photo.thumbFileId) === 'ひびの手帳/_system/サムネイル', 'サムネイルを保存');
  r = env.post('item.upload', { name: 'IMG_0001', ext: 'heic', data: b64(JPEG), source: 'shortcut', dates: '2026年11月6日', important: 'はい' });
  photo2 = r.data.item;
  eq([photo2.name, photo2.mime, photo2.source, photo2.dates, photo2.important], ['IMG_0001.jpg', 'image/jpeg', 'shortcut', ['2026-11-06'], true], '中身から JPEG と判定し、拡張子をつける（ショートカット）');
  r = env.post('item.upload', { name: 'おたより', data: b64(PDF), category: '家族・子ども' });
  pdfItem = r.data.item;
  eq([pdfItem.kind, pdfItem.name, pdfItem.status, pdfItem.category, pdfItem.categorySource], ['pdf', 'おたより.pdf', 'organized', '家族・子ども', 'manual'], '分類を選んで入れた PDF');
  eq(env.parentPath(pdfItem.fileId), 'ひびの手帳/整理済み/家族・子ども', '分類フォルダに直接入る');
  eq(env.post('item.upload', { data: '' }).ok, false, '中身がないと断る');
  r = env.post('item.thumbs', { ids: [photo.id, pdfItem.id, 'i_nothing'] });
  ok(/^data:image\/jpeg;base64,/.test(r.data.thumbs[photo.id]), '保存したサムネイルを返す');
  ok(!(pdfItem.id in r.data.thumbs), 'ドライブのサムネイルがまだないものは返さない');
  env.nodes.get(pdfItem.fileId).thumbnail = PNG;
  r = env.post('item.thumbs', { ids: [pdfItem.id] });
  ok(/^data:image\/png;base64,/.test(r.data.thumbs[pdfItem.id]), 'ドライブのサムネイルから作る');
  ok(env.post('bootstrap').data.items.find(i => i.id === pdfItem.id).thumbFileId, '作ったサムネイルを覚える');
  r = env.post('item.file', { id: photo.id });
  eq([r.data.mime, Buffer.from(r.data.data, 'base64').equals(JPEG)], ['image/jpeg', true], '元のファイルを返す');
});

section('ドライブに直接入れたファイル（ファイルApp・ドライブApp から）', () => {
  const n = env.putFile('ひびの手帳/受信箱', 'scan.pdf', 'application/pdf', PDF);
  const st = env.post('bootstrap').data;
  const it = st.items.find(i => i.fileId === n.id);
  ok(it, 'アプリを開くと見つけて登録する');
  eq([it.status, it.source, it.kind], ['inbox', 'drive', 'pdf'], 'ドライブから来た PDF');
  const h = env.putFile('ひびの手帳/受信箱', 'IMG_9999.HEIC', 'image/heic', HEIC);
  env.call('hourly');
  const st2 = env.post('bootstrap').data;
  const conv = st2.items.find(i => i.originalFileId === h.id);
  ok(conv, 'HEIC は JPEG にする');
  eq([conv.name, conv.mime, env.parentPath(conv.fileId), env.parentPath(h.id)], ['IMG_9999.jpg', 'image/jpeg', 'ひびの手帳/受信箱', 'ひびの手帳/_system/元ファイル'], 'JPEG は受信箱に、元の HEIC は _system/元ファイル に');
  eq(st2.items.filter(i => i.fileId === h.id).length, 0, '元の HEIC は二重に登録しない');
  const later = [];
  const env2 = createGasEnv({ fetch: later });
  env2.call('setup');
  const h2 = env2.putFile('ひびの手帳/受信箱', 'IMG_1.heic', 'image/heic', HEIC);
  let it2 = env2.post('bootstrap').data.items.find(i => i.fileId === h2.id);
  eq([it2 && it2.mime, it2 && it2.status], ['image/heic', 'inbox'], 'アプリを開いたときは、HEIC のまま登録だけ（変換は見回りで）');
  env2.call('hourly');
  it2 = env2.post('bootstrap').data.items.find(i => i.id === it2.id);
  eq(it2.mime, 'image/heic', 'ドライブのプレビューがまだなら、HEIC のまま');
  later.push(heicFetch);
  env2.call('hourly');
  it2 = env2.post('bootstrap').data.items.find(i => i.id === it2.id);
  eq([it2.mime, it2.name, it2.originalFileId], ['image/jpeg', 'IMG_1.jpg', h2.id], 'プレビューができたら、次の見回りで JPEG にする（記録はそのまま）');
  const c = env.putFile('ひびの手帳/整理済み/健康', '診察券.png', 'image/png', PNG);
  env.call('hourly');
  const ci = env.post('bootstrap').data.items.find(i => i.fileId === c.id);
  eq([ci.status, ci.category, ci.categorySource], ['organized', '健康', 'folder'], '分類フォルダに直接入れたら、その分類');
});

section('写真・PDF の文字を読みとる（Google の文字認識・1時間ごと）', () => {
  const before = env.ocrCalls || 0;
  const img = Buffer.concat([JPEG, Buffer.from('TEXT=さくら園 えんだより\n11月6日（金）いもほり遠足')]);
  const it = env.post('item.upload', { name: 'おたより.jpg', data: b64(img) }).data.item;
  ok(!it.ocr && !it.ocrAt, '入れたときは、まだ読まない（アプリの返事を待たせない）');
  env.call('hourly');
  const st = env.post('bootstrap').data;
  const got = st.items.find(i => i.id === it.id);
  eq(got.ocr, 'さくら園 えんだより\n11月6日（金）いもほり遠足', '見回りで文字を読みとる');
  ok(got.ocrAt, '読んだ時刻');
  ok(!st.items.find(i => i.id === pdfItem.id).ocrAt, '自分で分類して入れたもの（整理済み）は読まない');
  const h = env.exportJson().inboxHints.find(x => x.fileId === it.fileId);
  eq(h && h.ocr, got.ocr, 'claudeへ に、読みとった文字を入れる');
  ok(![...env.nodes.values()].some(n => /^hibi-ocr-/.test(n.name) && !n.trashed), '文字を読むためにつくったドキュメントは捨てる');
  const calls = env.ocrCalls;
  ok(calls > before, '文字認識を呼んだ');
  env.call('hourly');
  eq(env.ocrCalls, calls, '一度読んだものは、もう読まない');
});

section('iPhone の予定・リマインダー（ショートカットから）', () => {
  // ① 辞書の配列（いちばん素直な形）
  let r = env.post('ios.sync', {
    events: [
      { title: '職員会議', start: today + 'T15:30:00+09:00', end: today + 'T17:00:00+09:00', allDay: 'いいえ', cal: '仕事', loc: '会議室\n2F' },
      { title: '遠足', start: tomorrow + 'T00:00:00+09:00', end: tomorrow + 'T23:59:59+09:00', allDay: 'はい', cal: '家族' },
      { title: '出張', start: '2026-11-01T00:00:00+09:00', end: '2026-11-04T00:00:00+09:00', allDay: '1' },
      { title: '日付のない予定' }
    ],
    reminders: [
      { title: '申込書', due: tomorrow + 'T07:00:00+09:00', list: 'リマインダー', prio: '高', flag: 'Yes' },
      { title: '本を返す', due: '', prio: '0' },
      { title: '' }
    ]
  });
  ok(r.ok, 'ios.sync：' + r.error);
  eq([r.data.events, r.data.reminders], [3, 2], '読めないもの（日付なし・題名なし）は捨てる');
  let st = env.post('bootstrap').data;
  const ev = st.ios.events;
  eq(ev[0], { title: '職員会議', d0: today, d1: today, t0: '15:30', t1: '17:00', allDay: false, cal: '仕事', loc: '会議室 2F' }, '時刻つきの予定（場所の改行は空白に）');
  eq([ev[1].allDay, ev[1].d0, ev[1].d1, ev[1].t0], [true, tomorrow, tomorrow, ''], '終日の予定');
  eq([ev[2].d0, ev[2].d1], ['2026-11-01', '2026-11-03'], '何日かつづく終日（翌日0時終わり）');
  eq([st.ios.reminders[0].due, st.ios.reminders[0].dueTime, st.ios.reminders[0].prio, st.ios.reminders[0].flag], [tomorrow, '07:00', 3, true], 'リマインダーの期日・優先度・フラグ');
  ok(st.ios.syncedAt, '同期した時刻');
  const ex = env.exportJson();
  eq(ex.agenda.today.map(e => e.title + ' ' + e.time), ['職員会議 15:30-17:00'], 'claudeへ に今日の予定');
  eq(ex.agenda.tomorrow.map(e => e.title + ' ' + e.time), ['遠足 終日'], 'claudeへ に明日の予定');
  eq(ex.agenda.reminders.map(x => x.title), ['申込書'], 'claudeへ に近いリマインダー');
  // ② 辞書を「テキスト」に入れて送った形（JSON を改行でつないだもの）
  const asText = [{ title: 'A', start: '2026-12-01T10:00:00+09:00', end: '2026-12-01T11:00:00+09:00' }, { title: 'B', start: '2026-12-02T10:00:00+09:00' }]
    .map(o => JSON.stringify(o, null, 2)).join('\n');
  r = env.post('ios.sync', { events: asText });
  eq(r.data.events, 2, '整形された辞書を改行でつないだテキストも読める');
  r = env.post('ios.sync', { events: '{"タイトル":"C","開始日":"2026年12月3日 9:00","終日":"いいえ"}' });
  st = env.post('bootstrap').data;
  eq([st.ios.events.length, st.ios.events[0].title, st.ios.events[0].d0, st.ios.events[0].t0], [1, 'C', '2026-12-03', '09:00'], '日本語のキー・日本語の日付');
  eq(st.ios.reminders.length, 2, 'events だけ送ったときは、リマインダーは消さない');
  r = env.post('ios.sync', { events: 'title: X\nstart: 2026-12-05' });
  ok(!r.ok && /読めませんでした/.test(r.error), '読めない形は、いまのデータを消さずに知らせる');
  eq(env.post('bootstrap').data.ios.events.length, 1, '読めなかったときは、前の予定のまま');
  r = env.post('ios.sync', { events: JSON.stringify([{ title: 'D', start: '2026/12/04 13:05' }]), reminders: '[]' });
  st = env.post('bootstrap').data;
  eq([st.ios.events[0].t0, st.ios.reminders.length], ['13:05', 0], 'JSON 文字列の配列・空のリマインダー');
  // あとのテストのために、今日と明日の予定をもどしておく
  env.post('ios.sync', { events: [{ title: '職員会議', start: today + 'T15:30:00+09:00', end: today + 'T17:00:00+09:00' }] });
});

section('Claude の結果を取り込む', () => {
  const inboxScan = env.find('ひびの手帳/受信箱');
  ok(inboxScan, '受信箱');
  const scanPdf = env.post('bootstrap').data.items.find(i => i.name === 'scan.pdf');
  const out = {
    schema: 'hibi-claude-out/1', runAt: today + 'T05:52:00+09:00', date: today,
    briefing: {
      summary: '今日は職員会議があります。', notes: 'テスト',
      gmail: [{ subject: '面談の日程', from: '学年主任', summary: '候補日を返信', action: '返信', due: tomorrow, url: 'https://mail.google.com/mail/u/0/#all/abc', threadId: 'abc' },
        { subject: '危ない', url: 'javascript:alert(1)' }],
      ai: [{ title: 'AIの話題', summary: '要約', source: 'NHK', url: 'https://example.com/a' }],
      news: [{ title: 'ニュース1', summary: '要約', source: '共同', url: 'https://example.com/n' }, { summary: '題名なしは捨てる' }]
    },
    files: [
      { fileId: photo.fileId, title: '遠足のおたより', summary: '11/6 いもほり遠足。申込は10/30まで。', text: 'さくら保育園 えんだより…', category: '家族・子ども', tags: ['遠足', '保育園'],
        dates: [{ date: '2026-11-06', reason: '遠足の日' }, { date: '2026-10-30', reason: '申込の締切' }], important: true, confidence: 0.92, status: 'organized' },
      { fileId: photo2.fileId, title: 'ホワイトボードの写真', summary: '何かの板書', category: '学校・授業', confidence: 0.4, status: 'pending', dates: ['2026-11-20'] },
      { fileId: scanPdf.fileId, title: '請求書', summary: '電気代', category: 'ない分類', confidence: 0.9 },
      { fileId: 'not-exist', title: 'ない' }
    ],
    memos: [
      { id: memoA.id, category: '家族・子ども', title: '申込書を出す', confidence: 0.9, dates: ['2026-10-30'] },
      { id: memoB.id, category: '健康', confidence: 0.99 },
      { id: 'm_unknown', category: '健康' }
    ],
    proposals: [
      { kind: 'reminder', target: { type: 'file', fileId: photo.fileId }, question: '申込書の提出をリマインダーに入れますか？', context: '締切は10/30（金）',
        options: [{ label: 'リマインダーに入れる（10/30 7:00）', ios: { type: 'reminder', title: '遠足の申込書を出す', due: '2026-10-30 07:00' } }, { label: '入れない', patch: {} }],
        rule: '園のおたよりの締切は、いつもリマインダーに入れる' },
      { kind: 'reply', target: { type: 'mail', threadId: 'abc', url: 'https://mail.google.com/mail/u/0/#all/abc' }, question: '面談の返信を予定に入れますか？',
        options: [{ label: '明日の朝に返信する（リマインダー）', ios: { type: 'reminder', title: '面談の返信', due: tomorrow + ' 08:00' } }, { label: 'カレンダーに入れる', ios: { type: 'event', title: '面談', start: '2026-10-28 16:00' } }] },
      { kind: 'x', question: '選択肢がない提案は捨てる', options: [] }
    ]
  };
  env.putFile('ひびの手帳/_system/claudeから', 'claude_' + today + '_0552.json', 'application/json', JSON.stringify(out));
  let st = env.post('bootstrap').data;
  const b = st.briefings[today];
  ok(b, 'けさのまとめを取り込む');
  eq([b.summary, b.gmail.length, b.gmail[1].url, b.news.length, b.runAt], ['今日は職員会議があります。', 2, '', 1, today + 'T05:52:00+09:00'], 'まとめの中身（危ない URL は消す・題名なしは捨てる）');
  const p1 = st.items.find(i => i.id === photo.id);
  eq([p1.title, p1.category, p1.categorySource, p1.status, p1.important], ['遠足のおたより', '家族・子ども', 'claude', 'organized', true], '自信のあるファイルは分類');
  eq(p1.dates, ['2026-10-30', '2026-11-06', tomorrow].sort(), '日付は、自分で選んだ日に Claude の日付を足す');
  eq(p1.dateNotes, { '2026-11-06': '遠足の日', '2026-10-30': '申込の締切' }, 'その日の理由');
  eq(env.parentPath(p1.fileId), 'ひびの手帳/整理済み/家族・子ども', 'ファイルは分類フォルダへ');
  const p2 = st.items.find(i => i.id === photo2.id);
  eq([p2.status, p2.suggestedCategory, p2.dates, p2.suggestedDates.map(x => x.date)], ['pending', '学校・授業', ['2026-11-06'], ['2026-11-20']], '自信のないファイルは確認待ち（日付はまだつけない）');
  eq(env.parentPath(p2.fileId), 'ひびの手帳/確認待ち', '確認待ちフォルダへ');
  const p3 = st.items.find(i => i.fileId === scanPdf.fileId);
  eq([p3.status, p3.title], ['pending', '請求書'], '知らない分類は、決めきれなかった扱い');
  const mA = st.memos.find(m => m.id === memoA.id), mB = st.memos.find(m => m.id === memoB.id);
  eq([mA.category, mA.categorySource, mA.title, mA.dates.includes('2026-10-30'), !!mA.claudeAt], ['家族・子ども', 'claude', '申込書を出す', true, true], 'メモの分類');
  eq([mB.category, mB.categorySource], ['健康', 'claude'], '分類をおまかせにもどしたメモにも、Claude の分類が入る');
  const kinds = st.proposals.map(p => p.kind + ':' + p.target.type).sort();
  eq(kinds, ['category:file', 'category:file', 'reminder:file', 'reply:mail'], '確認してほしいこと（決めきれなかった 2 つには分類の提案を自動で足す）');
  const rem = st.proposals.find(p => p.kind === 'reminder');
  eq(rem.options[0].ios, { type: 'reminder', title: '遠足の申込書を出す', notes: '', due: '2026-10-30 07:00' }, 'リマインダーの提案');
  const reply = st.proposals.find(p => p.kind === 'reply');
  eq(reply.options[1].ios, { type: 'event', title: '面談', notes: '', allDay: false, start: '2026-10-28 16:00', end: '2026-10-28 17:00', location: '' }, '予定の提案（終わりは1時間後）');
  eq(env.list('ひびの手帳/_system/claudeから'), ['取り込み済み'], '結果のファイルは 取り込み済み へ');
  eq(env.list('ひびの手帳/_system/claudeから/取り込み済み').length, 1, '取り込み済み に 1 つ');
  eq([st.lastRun.files, st.lastRun.memos, st.lastRun.proposals], [3, 2, 2], '取り込んだ数');
  // 同じ結果を戻しても二重に取り込まない
  const moved = env.find('ひびの手帳/_system/claudeから/取り込み済み/claude_' + today + '_0552.json');
  moved.parents = [env.find('ひびの手帳/_system/claudeから').id];
  st = env.post('bootstrap').data;
  eq(st.proposals.length, 4, '同じファイルは二度取り込まない');
  // ドキュメントで書かれた結果・``` でかこまれた結果
  const doc = env.putFile('ひびの手帳/_system/claudeから', 'claude_doc', 'application/vnd.google-apps.document', '```json\n' + JSON.stringify({ date: tomorrow, briefing: { summary: 'ドキュメントで来た' } }) + '\n```');
  env.putFile('ひびの手帳/_system/claudeから', 'broken.json', 'application/json', '{ これは壊れている');
  st = env.post('bootstrap').data;
  eq(st.briefings[tomorrow] && st.briefings[tomorrow].summary, 'ドキュメントで来た', 'Google ドキュメント・```json の結果も読む');
  eq((st.outboxErrors || []).map(e => e.name), ['broken.json'], '壊れた結果は記録して、ほかは止めない');
  ok(doc, 'doc');
  const memoC = env.post('memo.save', { memo: { text: 'ピアノの新しい曲のアイデア' } }).data.memo;
  env.call('hourly');
  const ex = env.exportJson();
  eq(ex.memosToClassify.map(m => m.id), [memoC.id], 'Claude に聞くメモ：まだ見ていない・分類のないものだけ（見回りで claudeへ を書きかえる）');
  eq(ex.inboxHints.map(x => x.name).sort(), ['IMG_9999.jpg', 'おたより.jpg'], '受信箱のヒント（まだ受信箱にあるものだけ）');
  eq(ex.pendingCount, 2, '確認待ちの数');
  eq(ex.openProposals.length, 4, 'まだ答えていない提案');
});

section('確認してほしいことに答える', () => {
  let st = env.post('bootstrap').data;
  const cat = st.proposals.find(p => p.kind === 'category' && p.target.itemId === photo2.id);
  eq(cat.options[0].label, '学校・授業', 'Claude の候補が先頭');
  let r = env.post('proposal.answer', { id: cat.id, option: 1 });
  ok(r.ok, '答える：' + r.error);
  const chosen = cat.options[1].label;
  eq([r.data.item.category, r.data.item.categorySource, r.data.item.status], [chosen, 'manual', 'organized'], '選んだ分類になる');
  eq(env.parentPath(photo2.fileId), 'ひびの手帳/整理済み/' + chosen, '分類フォルダへ移る');
  eq(env.post('proposal.answer', { id: cat.id, option: 0 }).ok, false, '答えた提案には、もう答えられない');
  const rem = st.proposals.find(p => p.kind === 'reminder');
  r = env.post('proposal.answer', { id: rem.id, option: 0, remember: true });
  eq(r.data.ios.type, 'reminder', 'iPhone に登録するものを返す（アプリがショートカットに渡す）');
  eq(r.data.rules, ['園のおたよりの締切は、いつもリマインダーに入れる'], '「今後もこうする」で決まりを覚える');
  const other = env.post('bootstrap').data.proposals.find(p => p.kind === 'category');
  r = env.post('proposal.dismiss', { id: other.id });
  eq(r.data.proposal.status, 'dismissed', '却下');
  env.call('hourly');
  st = env.post('bootstrap').data;
  eq(st.proposals.filter(p => p.kind === 'category').length, 0, '却下した分類の確認は、もう出さない');
  const ex = env.exportJson();
  eq(ex.rules, ['園のおたよりの締切は、いつもリマインダーに入れる'], 'claudeへ に決まり');
  ok(ex.recentDecisions.length >= 3, 'claudeへ に最近の判断');
});

section('資料を直す・消す', () => {
  let r = env.post('item.update', { id: photo.id, patch: { important: false, removeDates: [tomorrow], addDates: ['2026-12-24'], note: 'メモ', title: '遠足（直した）' } });
  eq([r.data.item.important, r.data.item.dates, r.data.item.note, r.data.item.title], [false, ['2026-10-30', '2026-11-06', '2026-12-24'], 'メモ', '遠足（直した）'], '日付・重要・メモ・題名を直す');
  r = env.post('item.update', { id: photo.id, patch: { category: '' } });
  eq([r.data.item.status, env.parentPath(photo.fileId)], ['inbox', 'ひびの手帳/受信箱'], '分類を「おまかせ」にもどすと受信箱へ（次の朝 Claude が読みなおす）');
  r = env.post('item.update', { id: photo.id, patch: { category: '家族・子ども' } });
  eq(env.parentPath(photo.fileId), 'ひびの手帳/整理済み/家族・子ども', 'もう一度分類');
  r = env.post('item.update', { id: photo.id, patch: { archive: true } });
  eq(r.data.item.status, 'archived', 'しまう（アーカイブ）');
  r = env.post('item.update', { id: photo.id, patch: { archive: false } });
  eq(r.data.item.status, 'organized', 'しまったのをもどす');
  const fid = pdfItem.fileId;
  r = env.post('item.delete', { id: pdfItem.id });
  eq([r.data.deleted, env.nodes.get(fid).trashed], [1, true], '消すと、ドライブではゴミ箱へ');
  eq(env.post('item.update', { id: pdfItem.id, patch: {} }).ok, false, '消したものは直せない');
});

section('設定', () => {
  let r = env.post('settings.save', { settings: { categories: [{ name: '学校・授業' }, '部活', { name: ' ' }, { name: '部活' }, { name: 'a/b' }], briefing: { news: 'A\nB\n\n', maxNews: 99 }, appUrl: 'javascript:x' } });
  ok(r.ok, '設定を保存');
  const s = r.data.settings;
  eq(s.categories.map(c => c.name), ['学校・授業', '部活', 'a・b'], '分類（空・重複は捨てる。/ は ・ に）');
  eq([s.briefing.news, s.briefing.maxNews, s.appUrl], [['A', 'B'], 10, ''], 'まとめの設定（上限あり）・危ない URL は入れない');
  ok(env.find('ひびの手帳/整理済み/部活'), '新しい分類のフォルダをつくる');
  r = env.post('settings.save', { settings: { categories: [] } });
  eq(r.data.settings.categories.length, 9, '分類を全部消すと、初めの分類にもどる');
  r = env.post('settings.save', { settings: { appUrl: 'https://hibi-techo.pages.dev/' } });
  eq(r.data.settings.appUrl, 'https://hibi-techo.pages.dev/', 'アプリの URL');
});

section('カレンダー購読（ICS）', () => {
  const ics = env.get({ feed: 'ics', key: env.props.get('FEED_KEY') });
  const text = ics.getContent();
  eq(ics.getMimeType(), 'text/calendar', 'ICS の種類');
  ok(text.startsWith('BEGIN:VCALENDAR\r\n') && text.endsWith('END:VCALENDAR\r\n'), 'はじめと終わり（CRLF）');
  ok(text.split('\r\n').every(l => Buffer.byteLength(l, 'utf8') <= 75), '1行 75 バイト以内（折り返し）');
  const unfolded = text.replace(/\r\n /g, '');
  ok(unfolded.includes('SUMMARY:★📝 申込書を出す'), '重要メモ（★📝）');
  ok(unfolded.includes('DTSTART;VALUE=DATE:20261030'), 'メモの日付');
  ok(unfolded.includes('📷 遠足（直した）'), '写真の日付');
  ok(unfolded.includes('URL:https://hibi-techo.pages.dev/#/day/2026-11-06'), 'アプリのその日へのリンク');
  ok(/DESCRIPTION:[^\r\n]*\\n/.test(unfolded), '説明の改行は \\n');
});

section('日付の読みとり（parseDateLoose_）', () => {
  const p = s => { const r = env.call('parseDateLoose_', s); return r ? r.ymd + (r.hm ? ' ' + r.hm : '') : null; };
  eq(p('2026-10-30'), '2026-10-30', 'ISO の日付');
  eq(p('2026-10-30T07:05:00+09:00'), '2026-10-30 07:05', '時差つき');
  eq(p('2026-10-29T22:30:00Z'), '2026-10-30 07:30', 'UTC は日本時間に直す');
  eq(p('2026-10-30T07:05:00+0900'), '2026-10-30 07:05', '時差の : なし');
  eq(p('2026/10/30 7:05'), '2026-10-30 07:05', 'スラッシュ');
  eq(p('2026年10月30日（金）午後3時'), '2026-10-30 15:00', '日本語・午後');
  eq(p('２０２６年１０月３０日 ９：３０'), '2026-10-30 09:30', '全角');
  eq(p('2026-02-30'), null, 'ない日付');
  eq(p('あした'), null, '読めない言葉');
  ok(/^\d{4}-10-30$/.test(p('10/30')), '年なしは今年');
});

section('毎日のバックアップ・壊れたデータ', () => {
  env.call('hourly');
  const bk = env.list('ひびの手帳/_system/バックアップ');
  eq(bk, ['db-' + today + '.json'], 'バックアップ');
  env.call('hourly');
  eq(env.list('ひびの手帳/_system/バックアップ').length, 1, '1日1回');
  const dbNode = env.find('ひびの手帳/_system/db.json');
  const good = dbNode.content;
  dbNode.content = Buffer.from('{ 壊れた');
  const r = env.post('memo.save', { memo: { text: 'x' } });
  eq(r.ok, false, '壊れていたら書かない');
  eq(dbNode.content.toString(), '{ 壊れた', '壊れたデータの上に書かない（戻せるように）');
  dbNode.content = good;
  eq(env.post('ping').ok, true, 'もどせば動く');
});

console.log(`\n${failures ? '✗' : '✓'} ${passed} 件 OK${failures ? `、${failures} 件 失敗` : ''}`);
process.exit(failures ? 1 : 0);
