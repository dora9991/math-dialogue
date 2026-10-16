#!/usr/bin/env node
/* 画面を通したテスト：iPhone くらいの画面（390×844）の Chromium で、アプリを開いて操作する。
   裏側は tools/serve.cjs の「にせもの」（本物の Google にはつながない）。
   たどる流れ：つなぐ → メモ（★・日付）→ その日のメモ → 写真を撮って入れる → iPhone の予定が届く（ショートカットのかわりに POST）
     → Claude の朝の結果が届く → けさのまとめ・確認してほしいこと → 答える（分類・リマインダー）→ カレンダー → 資料を開いて直す
     → 設定 → つくり方 → 電波がないときのメモ → おためし → 暗い画面
   使い方：NODE_PATH=$(npm root -g) node hibi/tools/e2e.cjs [画面写真の出力先]
   playwright が要る（この環境ではグローバルに入っている）。 */
'use strict';
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { start } = require('./serve.cjs');

const OUT = path.resolve(process.argv[2] || path.join(require('os').tmpdir(), 'hibi-e2e'));
fs.mkdirSync(OUT, { recursive: true });
const FIX = path.join(__dirname, 'fixtures');

let failures = 0, passed = 0;
function ok(cond, msg) { if (cond) passed++; else { failures++; console.log('  ✗ ' + msg); } }
const step = s => console.log('■ ' + s);

(async () => {
  const srv = await start(8810, { quiet: true });
  const st = async () => JSON.parse(await (await fetch(`http://localhost:8810/__state`)).text());
  const post = (action, body) => fetch(srv.gas, { method: 'POST', body: JSON.stringify(Object.assign({ action, token: srv.token }, body)) }).then(r => r.json());
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'ja-JP', timezoneId: 'Asia/Tokyo' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_INTERNET_DISCONNECTED|Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
  const shot = name => page.screenshot({ path: path.join(OUT, name + '.png') });
  const fullShot = name => page.screenshot({ path: path.join(OUT, name + '.png'), fullPage: true });
  const toastText = async () => (await page.textContent('#toast')) || '';
  // 上の1週間の帯で、その日を開く（その週になければ、次の週・前の週へ）
  const openDay = async ymd => {
    if (!(await page.$(`#top .wday[data-ymd="${ymd}"]`))) await page.click(`#top [aria-label="${ymd > await page.evaluate(() => HB.today()) ? '次の週' : '前の週'}"]`);
    await page.click(`#top .wday[data-ymd="${ymd}"]`);
  };
  const waitToast = async re => { await page.waitForFunction(r => new RegExp(r).test(document.querySelector('#toast').textContent), re.source, { timeout: 8000 }); };
  const today = await page.evaluate(() => 0) || null;
  void today;

  try {
    step('はじめて開く → つなぐ');
    await page.goto('http://localhost:8810/');
    await page.waitForSelector('.welcome');
    ok(await page.isHidden('#tabs'), 'つなぐ前はタブを出さない');
    await shot('01-welcome');
    await page.fill('#cUrl', 'https://script.google.com/macros/s/abc/dev');
    await page.fill('#cToken', srv.token);
    await page.click('[data-form="connect"] button[type="submit"]');
    ok(/\/exec/.test(await page.textContent('#cErr')), '/dev の URL は止める');
    await page.fill('#cUrl', srv.gas);
    await page.fill('#cToken', 'wrong-token-1234567');
    await page.click('[data-form="connect"] button[type="submit"]');
    await page.waitForFunction(() => /合言葉/.test(document.querySelector('#cErr').textContent));
    ok(true, '合言葉がちがうと止める');
    await page.fill('#cToken', srv.token);
    await page.click('[data-form="connect"] button[type="submit"]');
    await page.waitForSelector('.day');
    ok(await page.isVisible('#tabs'), 'つながるとタブが出る');
    const T = await page.evaluate(() => HB.today());
    const TM = await page.evaluate(t => HB.addDays(t, 1), T);

    step('iPhone と同期（まだ一度も届いていないときは、先に説明を出す）');
    ok(await page.evaluate(() => document.querySelector('#iosSync').classList.contains('unsynced')), 'まだ同期していない印');
    await page.click('#iosSync');
    await page.waitForSelector('.sheet [data-act="go"][data-hash="#/guide"]');
    ok(/ひびの手帳 同期/.test(await page.textContent('.sheet')), 'ショートカットの名前を出す');
    await page.click('.sheet-head [data-act="closeSheet"]');

    step('メモ：★・日付をつけて書く');
    await page.click('#fab');
    await page.click('.menu [data-act="newMemo"]');
    await page.fill('#mText', '申込書を出す\n遠足の参加申込書。担任へ。');
    await page.click('[data-act="mStar"]');
    await page.click('[data-act="mAddDate"][data-v="tomorrow"]');
    ok((await page.textContent('#mDates')).includes(await page.evaluate(d => HB.labelShort(d), TM)), '明日の日付がつく');
    await shot('02-memo-editor');
    await page.click('[data-act="saveMemo"]');
    await waitToast(/保存/);
    let db = await st();
    const m1 = db.memos.find(m => m.text.startsWith('申込書を出す'));
    ok(m1 && m1.important && m1.dates.includes(TM), '裏側にメモ（★・明日）');
    ok(!(await page.textContent('.day')).includes('申込書を出す'), '今日の画面には出ない（明日のメモ）');
    ok(await page.isVisible(`#top .wday.sel.today[data-ymd="${T}"]`), '上の帯で、今日が選ばれている');
    await openDay(TM);
    await page.waitForFunction(() => /申込書を出す/.test(document.querySelector('#view').textContent));
    ok(true, '明日を開くと出る（上の帯から）');
    ok((await page.textContent('.hero .hd-d')).trim() === String(Number(TM.slice(8))), '大きな日付');
    await page.click('#top [aria-label="今日へ"]');
    await page.waitForSelector(`#top .wday.sel[data-ymd="${T}"]`);

    step('今日のメモ（すぐ書く）');
    await page.fill('.quick textarea', '牛乳・パン・軍手');
    await page.click('.quick button[type="submit"]');
    await waitToast(/追加/);
    db = await st();
    ok(db.memos.some(m => m.text === '牛乳・パン・軍手' && m.dates.includes(T)), '今日の日付のメモ');
    ok((await page.textContent('.day')).includes('牛乳・パン・軍手'), '今日の画面に出る');

    step('★ をメモの一覧から切りかえる');
    await page.click('#tabs a[data-tab="memos"]');
    await page.waitForSelector('.list-wrap .memo');
    const starBtn = page.locator('.memo', { hasText: '牛乳' }).locator('.star');
    await starBtn.click();
    await waitToast(/重要/);
    db = await st();
    ok(db.memos.find(m => m.text === '牛乳・パン・軍手').important === true, '★ が裏側に');
    await page.click('[data-act="memoFilter"][data-f="star"]');
    ok((await page.locator('.list-wrap .memo').count()) === 2, '★ 重要で絞りこむ');
    await page.fill('.search', '軍手');
    await page.waitForTimeout(400);
    ok((await page.locator('.list-wrap .memo').count()) === 1, 'さがす');
    await page.fill('.search', '');
    await page.click('[data-act="memoFilter"][data-f="all"]');

    step('写真を撮って入れる（日付は明日）');
    await page.click('#tabs a[data-tab="library"]');
    await page.waitForSelector('.add-row');
    await page.setInputFiles('#pickCamera', path.join(FIX, 'otayori.jpg'));
    await page.waitForSelector('#uSend:not([disabled])');
    await page.click('[data-act="uAddDate"][data-v="tomorrow"]');
    await page.fill('#uNote', '遠足のおたより');
    await shot('03-upload');
    await page.click('#uSend');
    await waitToast(/受信箱に入れました/);
    db = await st();
    const ph = db.items.find(i => i.note === '遠足のおたより');
    ok(ph && ph.mime === 'image/jpeg' && ph.status === 'inbox' && ph.dates.includes(TM) && ph.thumbFileId, '受信箱に写真（JPEG・明日・サムネイル）');
    await page.waitForSelector(`.thumb img[data-thumb="${ph.id}"][src^="data:image"]`);
    ok(true, '資料の一覧にサムネイルが出る');
    await page.setInputFiles('#pickFile', path.join(FIX, 'sample.pdf'));
    await page.waitForSelector('#uSend:not([disabled])');
    await page.click('#uSend');
    await waitToast(/受信箱/);
    db = await st();
    const pdf = db.items.find(i => i.kind === 'pdf');
    ok(pdf && pdf.name === 'sample.pdf', 'PDF も入る');
    await shot('04-library');

    step('iPhone の予定とリマインダーが届く（ショートカットと同じ形で POST）');
    const asText = [
      { title: '職員会議', start: T + 'T15:30:00+09:00', end: T + 'T17:00:00+09:00', allDay: 'いいえ', cal: '仕事', loc: '会議室' },
      { title: '朝の打ち合わせ', start: T + 'T08:15:00+09:00', end: T + 'T08:35:00+09:00', allDay: 'いいえ', cal: '仕事', loc: '' },
      { title: '遠足', start: TM + 'T00:00:00+09:00', end: TM + 'T23:59:59+09:00', allDay: 'はい', cal: '家族', loc: '' }
    ].map(o => JSON.stringify(o, null, 2)).join('\n');
    const yesterday = await page.evaluate(t => HB.addDays(t, -1), T);
    const sync = await post('ios.sync', { events: asText, reminders: JSON.stringify({ title: '本を返す', due: yesterday + 'T09:00:00+09:00', list: 'リマインダー', prio: '0', flag: 'No' }) + '\n' + JSON.stringify({ title: '教材の印刷', due: T + 'T07:30:00+09:00', list: '仕事', prio: '5', flag: 'Yes' }) });
    ok(sync.ok && sync.data.events === 3 && sync.data.reminders === 2, 'ios.sync');
    await page.click('#tabs a[data-tab="today"]');
    await page.click('[data-act="refresh"]');
    await page.waitForFunction(() => /職員会議/.test(document.querySelector('#view').textContent));
    const evText = await page.textContent('.day');
    ok(evText.indexOf('朝の打ち合わせ') < evText.indexOf('職員会議'), '予定は時刻の順');
    const blocks = await page.$$eval('.tl-ev', els => els.map(e => e.className));
    ok(blocks.length === 2 && blocks.every(c => /\bp\d\b/.test(c)), '予定はカレンダーの色のブロック：' + blocks.join(' / '));
    ok(!(await page.evaluate(() => document.querySelector('#iosSync').classList.contains('unsynced'))), '同期したら印が消える');
    ok(/期限切れ/.test(evText) && /教材の印刷/.test(evText), 'リマインダー（期限切れ・今日）');

    step('Claude の朝の結果が届く');
    const out = {
      schema: 'hibi-claude-out/1', runAt: T + 'T05:52:00+09:00', date: T,
      briefing: {
        summary: '今日は 15:30 から職員会議。明日は遠足です。返信が必要なメールが1件。',
        gmail: [{ subject: '面談の日程について', from: '学年主任', summary: '候補日を金曜までに。', action: '返信', due: TM, url: 'https://mail.google.com/mail/u/0/#all/abc', threadId: 'abc' }],
        ai: [{ title: 'テストの AI ニュース', summary: '要約です。', source: 'テスト', url: 'https://example.com/ai' }],
        news: [{ title: 'テストのニュース', summary: '要約です。', source: 'テスト', url: 'https://example.com/n' }]
      },
      files: [
        { fileId: ph.fileId, title: 'いもほり遠足のおたより', summary: '11/6 いもほり遠足。申込は 10/30 まで。', text: '（テスト用）さくら園 えんだより', category: '家族・子ども',
          dates: [{ date: '2026-11-06', reason: '遠足の日' }, { date: '2026-10-30', reason: '申込の締切' }], confidence: 0.93, status: 'organized', important: true },
        { fileId: pdf.fileId, title: '英字のテストPDF', summary: '中身がよくわからない', confidence: 0.3, status: 'pending', category: 'その他' }
      ],
      memos: [{ id: db.memos.find(m => m.text === '牛乳・パン・軍手').id, category: '暮らし・買い物', confidence: 0.95 }],
      proposals: [{ kind: 'reminder', target: { type: 'file', fileId: ph.fileId }, question: '申込書の提出をリマインダーに入れますか？', context: '締切は 10/30（金）',
        options: [{ label: '入れる（10/30 7:00）', ios: { type: 'reminder', title: '遠足の申込書を出す', due: '2026-10-30 07:00' } }, { label: '入れない', patch: {} }], rule: '園のおたよりの締切は、いつもリマインダーに入れる' }]
    };
    await fetch(`http://localhost:8810/__outbox`, { method: 'POST', body: JSON.stringify(out) });
    await page.click('[data-act="refresh"]');
    await page.waitForSelector('.hero-msg');
    const dayText = await page.textContent('.day');
    ok(/職員会議。明日は遠足/.test(dayText), 'けさのひとこと');
    ok(/面談の日程について/.test(dayText) && /テストの AI ニュース/.test(dayText) && /テストのニュース/.test(dayText), 'メール・AI・ニュース');
    ok((await page.locator('.prop').count()) === 2, '確認してほしいこと（リマインダー・PDF の分類）');
    await shot('05-today-morning');
    await fullShot('05-today-morning-full');

    step('確認してほしいことに答える');
    const catProp = page.locator('.prop', { hasText: 'どの分類' });
    await catProp.locator('button', { hasText: 'その他' }).click();
    await waitToast(/決めました/);
    db = await st();
    ok(db.items.find(i => i.id === pdf.id).category === 'その他' && db.items.find(i => i.id === pdf.id).status === 'organized', '選んだ分類になる');
    const remProp = page.locator('.prop', { hasText: 'リマインダーに入れますか' });
    await remProp.locator('input[type="checkbox"]').check();
    await remProp.locator('button', { hasText: '入れる' }).click();
    await page.waitForFunction(() => window.__hibi.S.lastShortcut && /run-shortcut/.test(window.__hibi.S.lastShortcut));
    const sc = await page.evaluate(() => window.__hibi.S.lastShortcut);
    const u = new URL(sc.replace('shortcuts://', 'https://x/'));
    ok(u.searchParams.get('name') === 'ひびの手帳から登録', 'ショートカット「ひびの手帳から登録」を呼ぶ');
    const payload = JSON.parse(u.searchParams.get('text'));
    ok(payload.type === 'reminder' && payload.title === '遠足の申込書を出す' && payload.due === '2026-10-30 07:00', 'リマインダーの中身を渡す：' + JSON.stringify(payload));
    await page.waitForFunction(() => !document.querySelector('.prop'));
    db = await st();
    ok(db.settings.rules.includes('園のおたよりの締切は、いつもリマインダーに入れる'), '決まりを覚える');

    step('カレンダー（色の帯）');
    await page.click('#tabs a[data-tab="cal"]');
    await page.waitForSelector('.mweeks .bar');
    const tmBar = k => page.locator(`.bar.k-${k}[data-d0="${TM}"]`);
    ok((await tmBar('ev').count()) === 1 && (await tmBar('memo').count()) === 1 && (await tmBar('item').count()) === 1, '明日に 予定・メモ・写真 の帯');
    ok(/^★申込書を出す/.test(await tmBar('memo').textContent()), '重要の印（★）と題名');
    ok(/遠足/.test(await tmBar('ev').textContent()) && /\bp\d\b/.test(await tmBar('ev').getAttribute('class')), '予定の帯は題名とカレンダーの色');
    const mon = await page.$$eval('.mwd span', els => els.map(e => e.textContent).join(''));
    ok(mon === '月火水木金土日', '月曜はじまり');
    const lanes = await page.evaluate(() => Number(getComputedStyle(document.querySelector('.mweeks')).getPropertyValue('--lanes')));
    ok(lanes >= 4, '1週に 4 段以上の帯が入る：' + lanes);
    ok(await page.evaluate(() => document.querySelectorAll('.mweeks .wk').length > 40), '週がたてにつづく（前後の月も）');
    ok(/\bsun\b/.test(await page.getAttribute('.cell[data-ymd="2026-11-03"]', 'class')), '祝日（文化の日）は赤');
    await shot('06-calendar');
    const nextYm = await page.evaluate(t => HB.addMonths(t.slice(0, 7), 1), T);
    await page.click('#top [aria-label="次の月"]');
    await page.waitForFunction(m => document.querySelector('#calTitle').textContent.includes(Number(m.slice(5)) + '月') && location.hash === '#/cal/' + m, nextYm);
    ok(true, '次の月へスクロールすると、上の題名と URL も変わる');
    ok((await page.locator('.bar.k-item[data-d0="2026-11-06"]').count()) === 1, 'Claude が読んだ日付（11/6）にも写真');
    await page.waitForTimeout(700);   // スクロールが止まるまで
    await page.click('.cell[data-ymd="2026-11-06"]');
    await page.waitForFunction(() => location.hash === '#/day/2026-11-06' && document.querySelector('.day .thumb'));
    ok(/いもほり遠足のおたより/.test(await page.textContent('.day')), 'その日を開くと写真が出る');

    step('資料を開いて直す');
    await page.click(`.thumb[data-id="${ph.id}"]`);
    await page.waitForSelector('#iTitle');
    await page.waitForFunction(() => { const i = document.querySelector('#vImg'); return i && /^data:image\/jpeg/.test(i.src) && i.naturalWidth > 400; });
    ok(true, '大きい写真を読みこむ');
    ok(/遠足の日/.test(await page.textContent('.summary')), 'その日の理由');
    await shot('07-item');
    await page.fill('#iTitle', '遠足のおたより（直した）');
    await page.click('[data-act="iDelDate"][data-ymd="2026-11-06"]');
    await page.click('[data-act="saveItem"]');
    await waitToast(/保存/);
    db = await st();
    const ph2 = db.items.find(i => i.id === ph.id);
    ok(ph2.title === '遠足のおたより（直した）' && !ph2.dates.includes('2026-11-06') && ph2.dates.includes('2026-10-30'), '題名・日付を直す');

    step('設定');
    const before = await page.evaluate(() => location.hash);
    await page.click('#top [aria-label="設定"]');
    await page.waitForSelector('#cats');
    ok(await page.isHidden('#tabs'), '設定では下のバーを出さない');
    await page.click('[data-act="calColor"][data-name="仕事"][data-c="3"]');
    await page.waitForSelector('[data-act="calColor"][data-name="仕事"][data-c="3"].on');
    ok((await page.evaluate(() => HB.api.ui().calColors)).仕事 === 3, 'カレンダーの色を、この端末に覚える');
    await page.click('[data-act="calWps"][data-n="5"]');
    await page.waitForSelector('[data-act="calWps"][data-n="5"].on');
    ok((await page.evaluate(() => HB.api.ui().calWps)) === 5, '月のカレンダーの、1画面の週の数');
    await page.click('[data-act="catAdd"]');
    await page.fill('#cats .cat-row:last-child .cName', '部活');
    await page.click('[data-act="saveCats"]');
    await waitToast(/分類を保存/);
    db = await st();
    ok(db.settings.categories.some(c => c.name === '部活'), '分類を足す');
    await page.fill('#bNews', '佐賀県のニュース\n教育のニュース');
    await page.click('[data-act="saveBriefing"]');
    await waitToast(/保存/);
    db = await st();
    ok(JSON.stringify(db.settings.briefing.news) === JSON.stringify(['佐賀県のニュース', '教育のニュース']), 'まとめの話題');
    await page.waitForSelector('.settings .copy');
    ok(/feed=ics&key=fk_/.test(await page.textContent('.settings .copy')), 'カレンダー購読の URL');
    await fullShot('08-settings');

    step('ショートカットのつくり方');
    await page.click('a[href="#/guide"]');
    await page.waitForSelector('.guide');
    const g = await page.textContent('.guide');
    ok(g.includes(srv.gas) && g.includes(srv.token), 'URL と合言葉が入っている');
    ok((await page.locator('.guide .copy').count()) >= 4, 'タップでコピーできる');
    await fullShot('09-guide');
    await page.click('#top [aria-label="もどる"]');
    await page.waitForSelector('#cats');
    await page.click('#top [aria-label="もどる"]');
    await page.waitForFunction(h => location.hash === h, before);
    ok(true, '設定から「もどる」で、来た画面へ');

    step('電波がないときのメモ');
    await page.click('#tabs a[data-tab="today"]');
    ok((await page.$$eval('.tl-ev', els => els.map(e => e.className))).every(c => /\bp3\b/.test(c)), '選んだ色が今日の予定にも出る');
    await ctx.setOffline(true);
    await page.fill('.quick textarea', '電波なしで書いたメモ');
    await page.click('.quick button[type="submit"]');
    await waitToast(/つながったら/);
    ok((await page.evaluate(() => HB.api.queue().length)) === 1, '未送信にためる');
    await openDay(TM);
    await page.click('#top [aria-label="今日へ"]');
    ok(/未送信のメモが 1 件/.test(await page.textContent('#view')), '未送信の表示');
    await ctx.setOffline(false);
    await page.click('[data-act="refresh"]');
    await page.waitForFunction(() => HB.api.queue().length === 0);
    db = await st();
    ok(db.memos.some(m => m.text === '電波なしで書いたメモ'), 'つながったら送る');

    step('おためし・暗い画面');
    const p2 = await ctx.newPage();
    await p2.goto('http://localhost:8810/');
    await p2.evaluate(() => localStorage.clear());
    await p2.goto('http://localhost:8810/?demo#/today');
    await p2.waitForSelector('.hero-msg');
    await p2.screenshot({ path: path.join(OUT, '10-demo.png') });
    await p2.emulateMedia({ colorScheme: 'dark' });
    await p2.screenshot({ path: path.join(OUT, '11-demo-dark.png') });
    await p2.goto('http://localhost:8810/?demo#/cal');
    await p2.waitForSelector('.mweeks .bar');
    await p2.screenshot({ path: path.join(OUT, '12-demo-cal-dark.png') });
    await p2.close();

    ok(!errors.length, 'ページのエラーなし：' + errors.join(' / '));
  } catch (e) {
    failures++;
    console.log('  ✗ 例外：' + (e.stack || e));
    await page.screenshot({ path: path.join(OUT, 'zz-failure.png'), fullPage: true }).catch(() => {});
    console.log('    toast: ' + await toastText().catch(() => ''));
  } finally {
    await browser.close();
    srv.server.close();
  }
  console.log(`\n${failures ? '✗' : '✓'} ${passed} 件 OK${failures ? `、${failures} 件 失敗` : ''}　画面写真：${OUT}`);
  process.exit(failures ? 1 : 0);
})();
