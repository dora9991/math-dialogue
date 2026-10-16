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
      { title: '出張', start: addDays(today, 20) + 'T00:00:00+09:00', end: addDays(today, 23) + 'T00:00:00+09:00', allDay: '1' },
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
  eq([ev[2].d0, ev[2].d1], [addDays(today, 20), addDays(today, 22)], '何日かつづく終日（翌日0時終わり）');
  eq([st.ios.reminders[0].due, st.ios.reminders[0].dueTime, st.ios.reminders[0].prio, st.ios.reminders[0].flag], [tomorrow, '07:00', 3, true], 'リマインダーの期日・優先度・フラグ');
  ok(st.ios.syncedAt, '同期した時刻');
  const ex = env.exportJson();
  eq(ex.agenda.today.map(e => e.title + ' ' + e.time), ['職員会議 15:30-17:00'], 'claudeへ に今日の予定');
  eq(ex.agenda.tomorrow.map(e => e.title + ' ' + e.time), ['遠足 終日'], 'claudeへ に明日の予定');
  eq(ex.agenda.reminders.map(x => x.title), ['申込書'], 'claudeへ に近いリマインダー');
  // ② 辞書を「テキスト」に入れて送った形（JSON を改行でつないだもの）
  const d45 = addDays(today, 45), d46 = addDays(today, 46), d47 = addDays(today, 47), d48 = addDays(today, 48);
  const asText = [{ title: 'A', start: d45 + 'T10:00:00+09:00', end: d45 + 'T11:00:00+09:00' }, { title: 'B', start: d46 + 'T10:00:00+09:00' }]
    .map(o => JSON.stringify(o, null, 2)).join('\n');
  r = env.post('ios.sync', { events: asText });
  eq(r.data.events, 2, '整形された辞書を改行でつないだテキストも読める');
  const [y47, m47, dd47] = d47.split('-').map(Number);
  r = env.post('ios.sync', { events: `{"タイトル":"C","開始日":"${y47}年${m47}月${dd47}日 9:00","終日":"いいえ"}` });
  st = env.post('bootstrap').data;
  eq([st.ios.events.length, st.ios.events[0].title, st.ios.events[0].d0, st.ios.events[0].t0], [1, 'C', d47, '09:00'], '日本語のキー・日本語の日付（同じ期間の予定は入れかわる）');
  eq(st.ios.reminders.length, 2, 'events だけ送ったときは、リマインダーは消さない');
  r = env.post('ios.sync', { events: 'title: X\nstart: 2026-12-05' });
  ok(!r.ok && /読めませんでした/.test(r.error), '読めない形は、いまのデータを消さずに知らせる');
  eq(env.post('bootstrap').data.ios.events.length, 1, '読めなかったときは、前の予定のまま');
  r = env.post('ios.sync', { events: JSON.stringify([{ title: 'D', start: d48.replace(/-/g, '/') + ' 13:05' }]), reminders: '[]' });
  st = env.post('bootstrap').data;
  eq([st.ios.events[0].t0, st.ios.reminders.length], ['13:05', 0], 'JSON 文字列の配列・空のリマインダー');

  // ③ 送られてきた期間の分だけ入れかえる（はじめに1年ぶんを入れて、毎朝は短い期間だけ同期する）
  const every10 = [];
  for (let n = -300; n <= 300; n += 10) every10.push({ title: 'P' + n, start: addDays(today, n) + 'T09:00:00+09:00', cal: '仕事' });
  r = env.post('ios.sync', { events: every10, from: addDays(today, -300) + 'T00:00:00+09:00', to: addDays(today, 300) + 'T23:59:00+09:00' });
  eq([r.data.events, r.data.total, r.data.from, r.data.to], [61, 61, addDays(today, -300), addDays(today, 300)], '長い期間をまとめて入れる（from・to）');
  r = env.post('ios.sync', { events: [{ title: 'あたらしい', start: addDays(today, 5) + 'T10:00:00+09:00' }, { title: 'P10', start: addDays(today, 10) + 'T09:00:00+09:00' }] });
  st = env.post('bootstrap').data;
  const titles = st.ios.events.map(e => e.title);
  ok(titles.includes('P-100') && titles.includes('P200') && titles.includes('P-300') && titles.includes('P300'), 'ふだんの同期（期間なし）でも、きのう〜60日後より前と後の予定は残る');
  ok(!titles.includes('P20') && !titles.includes('P0') && titles.includes('あたらしい') && titles.includes('P10'), 'きのう〜60日後は、送られてきた予定に入れかわる（iPhone で消した予定は消える）');
  eq(st.ios.events.length, 61 - 7 + 2, '入れかえたあとの数');
  eq(st.ios.events.map(e => e.d0), st.ios.events.map(e => e.d0).slice().sort(), '日付の順にならぶ');
  r = env.post('ios.sync', { events: '[]', from: addDays(today, 195), to: addDays(today, 215) });
  st = env.post('bootstrap').data;
  ok(!st.ios.events.some(e => e.title === 'P200' || e.title === 'P210') && st.ios.events.some(e => e.title === 'P220'), 'その期間に予定が1つもなければ、その期間だけ消える');
  // 多すぎるとき：予定は 8000 件まで（古いほうから捨てる）・リマインダーは 3000 件まで
  const many = [];
  for (let n = 0; n < 8100; n++) many.push({ title: 'M' + n, start: addDays(today, -400 + Math.floor(n / 20)) + 'T' + String(8 + (n % 10)).padStart(2, '0') + ':00:00+09:00' });
  const mr = Array.from({ length: 3100 }, (_, n) => ({ title: 'R' + n, due: '' }));
  r = env.post('ios.sync', { events: many, reminders: mr, from: '2000-01-01', to: '2100-12-31' });
  st = env.post('bootstrap').data;
  eq([r.data.total, st.ios.events.length, st.ios.reminders.length], [8000, 8000, 3000], '予定は 8000 件・リマインダーは 3000 件まで');
  ok(!st.ios.events.some(e => e.title === 'M0') && st.ios.events.some(e => e.title === 'M8099'), '多すぎるときは、いちばん古い予定から捨てる');
  // あとのテストのために、今日の予定だけにもどしておく
  env.post('ios.sync', { events: [{ title: '職員会議', start: today + 'T15:30:00+09:00', end: today + 'T17:00:00+09:00' }], reminders: '[]', from: '2000-01-01', to: '2100-12-31' });
  eq(env.post('bootstrap').data.ios.events.length, 1, '期間をとても長くすると、ぜんぶ入れかえ');
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

/* ── パスキー：鍵は Node の crypto で作り、署名も Node でつくる（Apple・Chrome のパスキーと同じ形） ── */
const nodeCrypto = require('crypto');
const b64u = buf => Buffer.from(buf).toString('base64url');
const signed = buf => Array.from(buf, b => (b > 127 ? b - 256 : b));
function makePasskey(origin = 'https://hibi-techo.pages.dev', rpId = 'hibi-techo.pages.dev') {
  const { privateKey, publicKey } = nodeCrypto.generateKeyPairSync('ec', { namedCurve: 'P-256' });
  const jwk = publicKey.export({ format: 'jwk' });
  return { id: b64u(nodeCrypto.randomBytes(20)), x: jwk.x, y: jwk.y, privateKey, origin, rpId };
}
function assertion(pk, o = {}) {
  const ts = o.ts != null ? o.ts : Date.now();
  const nonce = o.nonce || nodeCrypto.randomBytes(16).toString('hex');
  const challenge = o.challenge || b64u(Buffer.from(`hb1.${ts}.${nonce}`));
  const cd = Buffer.from(JSON.stringify(Object.assign({ type: 'webauthn.get', challenge, origin: pk.origin, crossOrigin: false }, o.cd || {})));
  const rpHash = nodeCrypto.createHash('sha256').update(o.rpId || pk.rpId).digest();
  const ad = Buffer.concat([rpHash, Buffer.from([o.flags != null ? o.flags : 0x1d]), Buffer.from([0, 0, 0, 0])]);   // UP・UV・BE・BS（Apple と同じ。回数は 0）
  const sig = nodeCrypto.sign('sha256', Buffer.concat([ad, nodeCrypto.createHash('sha256').update(cd).digest()]), pk.privateKey);
  return { id: o.id || pk.id, clientDataJSON: b64u(cd), authenticatorData: b64u(ad), signature: o.sig || b64u(sig) };
}
const addPk = (pk, name) => env.post('passkey.add', { id: pk.id, x: pk.x, y: pk.y, rpId: pk.rpId, origin: pk.origin, name: name || 'iPhone' });
const login = a => env.post('passkey.login', a, '');

section('パスキー：署名の確かめ方（ES256）を Node の crypto と見くらべる', () => {
  ok(env.call('es256Ready_') === true, '決まった答えの署名で、自分を確かめる');
  let agree = 0, rejectHash = 0, rejectKey = 0, rejectSig = 0;
  const N = 60;
  for (let i = 0; i < N; i++) {
    const a = makePasskey(), b = makePasskey();
    const msg = nodeCrypto.randomBytes(1 + (i * 37) % 300);
    const hash = nodeCrypto.createHash('sha256').update(msg).digest();
    const sig = nodeCrypto.sign('sha256', msg, a.privateKey);
    if (env.context.es256Verify_(a.x, a.y, signed(hash), signed(sig))) agree++;
    const h2 = Buffer.from(hash); h2[i % 32] ^= 1 << (i % 8);
    if (!env.context.es256Verify_(a.x, a.y, signed(h2), signed(sig))) rejectHash++;
    if (!env.context.es256Verify_(b.x, b.y, signed(hash), signed(sig))) rejectKey++;
    const s2 = Buffer.from(sig); s2[s2.length - 1 - (i % 5)] ^= 1;
    if (!env.context.es256Verify_(a.x, a.y, signed(hash), signed(s2))) rejectSig++;
  }
  eq(agree, N, '正しい署名は全部とおす');
  eq(rejectHash, N, '中身が1ビットちがえば止める');
  eq(rejectKey, N, 'ちがう鍵なら止める');
  eq(rejectSig, N, '署名が1ビットちがえば止める');
  // s を n - s にした署名（ECDSA ではこれも正しい）も、とおす
  const c = makePasskey(), msg = Buffer.from('high s');
  const der = nodeCrypto.sign('sha256', msg, c.privateKey);
  const n = BigInt('0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551');
  const rl = der[3], r = der.subarray(4, 4 + rl), s = BigInt('0x' + der.subarray(6 + rl).toString('hex'));
  let sh = (n - s).toString(16); if (sh.length % 2) sh = '0' + sh;
  let sb = Buffer.from(sh, 'hex'); if (sb[0] & 0x80) sb = Buffer.concat([Buffer.from([0]), sb]);
  const der2 = Buffer.concat([Buffer.from([0x30, 4 + r.length + sb.length, 2, r.length]), r, Buffer.from([2, sb.length]), sb]);
  ok(nodeCrypto.verify('sha256', msg, { key: nodeCrypto.createPublicKey({ key: { kty: 'EC', crv: 'P-256', x: c.x, y: c.y }, format: 'jwk' }), dsaEncoding: 'der' }, der2), '（Node でも正しい）');
  ok(env.context.es256Verify_(c.x, c.y, signed(nodeCrypto.createHash('sha256').update(msg).digest()), signed(der2)), 'n - s の署名もとおす');
  ok(!env.context.es256Verify_(c.x, c.y, signed(Buffer.alloc(32)), signed(Buffer.from([0x30, 6, 2, 1, 0, 2, 1, 1]))), 'r = 0 は止める');
  ok(!env.context.es256Verify_(c.x, c.y, signed(Buffer.alloc(32)), signed(Buffer.from('not a der signature'))), 'DER でないものは止める');
});

let pkA, pkB;
section('パスキー：作る（合言葉が要る）・形をたしかめる', () => {
  pkA = makePasskey();
  eq(env.post('passkey.add', { id: pkA.id, x: pkA.x, y: pkA.y, rpId: pkA.rpId, origin: pkA.origin }, 'wrong').error, 'unauthorized', '合言葉なしでは作れない');
  const r = addPk(pkA, 'iPhone');
  ok(r.ok, '作れる：' + r.error);
  eq(r.data.passkeys.map(p => p.name), ['iPhone'], '名前');
  ok(!('x' in r.data.passkeys[0]) && !('y' in r.data.passkeys[0]), 'アプリには鍵を返さない');
  ok(/パスキーの鍵/.test(env.post('passkey.add', { id: pkA.id, x: 'abc', y: pkA.y, rpId: pkA.rpId, origin: pkA.origin }).error), '鍵の形がちがう');
  const off = makePasskey();
  ok(/正しくありません/.test(env.post('passkey.add', { id: off.id, x: off.x, y: pkA.y, rpId: off.rpId, origin: off.origin }).error), '曲線の上にない鍵は入れない');
  ok(/合いません/.test(env.post('passkey.add', { id: off.id, x: off.x, y: off.y, rpId: 'example.com', origin: off.origin }).error), 'rpId とアプリの URL が合わない');
  ok(/origin/.test(env.post('passkey.add', { id: off.id, x: off.x, y: off.y, rpId: 'evil.test', origin: 'http://evil.test' }).error), 'https でない（localhost のほか）は入れない');
  ok(addPk(makePasskey('http://localhost:8810', 'localhost')).ok, '開発用の localhost は入れられる');
  ok(addPk(makePasskey('https://abc.hibi-techo.pages.dev', 'hibi-techo.pages.dev')).ok, 'サブドメインから、上の rpId で作れる');
  const st = env.post('bootstrap', {}).data;
  eq(st.passkeys.length, 3, 'bootstrap にも一覧（名前と日付だけ）');
  ok(!('x' in st.passkeys[0]), 'bootstrap にも鍵は出さない');
  ok(!JSON.stringify(st).includes(pkA.x), 'どこにも鍵を出さない');
});

section('パスキー：ログイン（合言葉なしで呼べて、合言葉を返す）', () => {
  const a = assertion(pkA);
  const r = login(a);
  ok(r.ok, 'ログインできる：' + r.error);
  eq(r.data && r.data.token, env.props.get('TOKEN'), '合言葉が返る');
  eq(r.data && r.data.name, 'iPhone', 'どのパスキーか');
  ok(env.post('passkey.list').data.passkeys.find(p => p.id === pkA.id).lastUsedAt, '最後に使った日');
  eq(login(a).error, 'passkey_stale', '同じものは二度使えない（使い捨て）');
  eq(login(assertion(pkA, { ts: Date.now() - 11 * 60000 })).error, 'passkey_stale', '11分前のものは受けない');
  eq(login(assertion(pkA, { ts: Date.now() + 11 * 60000 })).error, 'passkey_stale', '11分先のものも受けない');
  ok(login(assertion(pkA, { ts: Date.now() - 4 * 60000 })).ok, '4分のずれは受ける');
  eq(login(assertion(pkA, { cd: { origin: 'https://evil.example' } })).error, 'passkey_failed', 'ちがうサイトからは止める');
  eq(login(assertion(pkA, { rpId: 'evil.example' })).error, 'passkey_failed', 'ちがう rpId は止める');
  eq(login(assertion(pkA, { flags: 0x01 })).error, 'passkey_failed', '顔・指紋・パスコードで確かめていなければ止める');
  eq(login(assertion(pkA, { cd: { type: 'webauthn.create' } })).error, 'passkey_failed', '作るときの署名は使えない');
  eq(login(assertion(pkA, { cd: { crossOrigin: true } })).error, 'passkey_failed', 'ほかのサイトに埋めこまれたものは止める');
  eq(login(assertion(pkA, { challenge: b64u(Buffer.from('hello')) })).error, 'passkey_failed', '合図の形がちがう');
  const other = makePasskey();
  eq(login(assertion(other, { id: pkA.id })).error, 'passkey_failed', 'ちがう鍵の署名は止める');
  eq(login(Object.assign(assertion(pkA), { signature: '%%%' })).error, 'passkey_failed', '壊れた base64 は止める');
  eq(login(assertion(other)).error, 'passkey_unknown', '登録していないパスキー');
  eq(env.post('passkey.login', assertion(other), env.props.get('TOKEN')).error, 'passkey_unknown', '合言葉をつけても、パスキーの確かめは飛ばさない');
  eq(login({}).error, 'passkey_unknown', '空');
});

section('パスキー：消す・10個まで・全部消す・BigInt がないとき', () => {
  pkB = makePasskey();
  ok(addPk(pkB, 'Mac').ok, 'もう1つ');
  const r = env.post('passkey.remove', { id: pkA.id });
  eq(r.data.removed, 1, '消せる');
  eq(login(assertion(pkA)).error, 'passkey_unknown', '消したパスキーではログインできない');
  ok(login(assertion(pkB)).ok, 'ほかのパスキーは使える');
  const many = Array.from({ length: 12 }, () => makePasskey());
  many.forEach((k, i) => addPk(k, 'k' + i));
  const list = env.post('passkey.list').data.passkeys;
  eq(list.length, 10, '10個まで');
  eq(list[list.length - 1].name, 'k11', '新しいものを残す');
  ok(login(assertion(many[11])).ok, '新しいものでログインできる');
  require('vm').runInContext('ES256_OK_ = false; var __BI = BigInt; BigInt = undefined;', env.context);
  eq(login(assertion(many[10])).error, 'passkey_unsupported', 'BigInt がなければ、使えないと返す');
  ok(/BigInt/.test(env.post('passkey.add', { id: pkA.id, x: pkA.x, y: pkA.y, rpId: pkA.rpId, origin: pkA.origin }).error), '作るときも、使えないと返す');
  require('vm').runInContext('BigInt = __BI;', env.context);
  ok(login(assertion(many[10])).ok, 'もどせば使える');
  env.call('clearPasskeys');
  eq(env.post('passkey.list').data.passkeys, [], 'clearPasskeys で全部消える');
  ok(!env.props.has('PASSKEYS'), 'プロパティも消える');
  eq(login(assertion(many[11])).error, 'passkey_unknown', '全部消したらログインできない');
});

console.log(`\n${failures ? '✗' : '✓'} ${passed} 件 OK${failures ? `、${failures} 件 失敗` : ''}`);
process.exit(failures ? 1 : 0);
