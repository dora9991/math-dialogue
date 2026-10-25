#!/usr/bin/env node
/* 見た目と動きの検査：ブラウザ（Chromium）で開いて、
   ①データの検査（BC.validate）にまちがいがないか
   ②すべての項目（困りごと・視点・練習・戦術）のシートを開き、見出しが出るか・作戦図が描けるか・スマホの幅（390px）で横にはみ出さないか
   ③チャット：例の文を送って答えが出るか、ask の選択肢・練習プラン（時間の合計）・図鑑の検索
   ④動画：フォルダを選ぶ（動画のフォルダを渡したとき）→ 自動の紐付け → チャットの答えに動画が出るか → 再生のシート
   ⑤画像（会話・シート・図鑑・動画。スマホ・パソコン・暗い表示）を tools/_out/ に書き出す
   使い方：  NODE_PATH=$(npm root -g) node tools/look.cjs [開くHTML] [--videos=動画のフォルダ] [--no-shots]
   まちがい（✗）が1つでもあれば、終了コード 1。 */
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

(async () => {
  const root = path.resolve(__dirname, '..');
  const args = process.argv.slice(2);
  const file = path.resolve(args.find((a) => !a.startsWith('--')) || path.join(root, 'index.html'));
  const vdir = (args.find((a) => a.startsWith('--videos=')) || '').slice(9);
  const shots = !args.includes('--no-shots');
  const url = 'file://' + file;
  const outDir = path.join(root, 'tools', '_out');
  if (shots) fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  let bad = 0;
  const fail = (m) => { bad++; console.log('✗ ' + m); };
  const isFont = (u) => /fonts\.(googleapis|gstatic)\.com/.test(u);
  // playwright でフォルダを渡すと、日本語の名前の動画は blob で読めない（playwright の制約。ふつうのブラウザでは読める）ので数えない
  const isPwBlob = (t) => /^blob:|ERR_BLOB_REFERENCED_FILE_UNAVAILABLE/.test(t);
  async function newPage(opt = {}) {
    const ctx = await browser.newContext({ viewport: opt.viewport || { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: opt.dark ? 'dark' : 'light' });
    // テストでは、フォルダは <input webkitdirectory> で選ぶ（showDirectoryPicker はテストから操作できない）
    await ctx.addInitScript(() => { try { delete window.showDirectoryPicker; window.showDirectoryPicker = undefined; } catch (e) { /* なし */ } });
    const page = await ctx.newPage();
    page.errors = [];
    page.on('pageerror', (e) => page.errors.push('ページのエラー：' + e.message));
    page.on('console', (m) => { if (m.type() === 'error' && !isFont(m.text()) && !isPwBlob(m.text())) page.errors.push('コンソール：' + m.text()); });
    page.on('requestfailed', (r) => { if (!isFont(r.url()) && !isPwBlob(r.url())) page.errors.push('読みこめない：' + r.url()); });
    return page;
  }
  const overflow = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  const shot = async (page, name) => { if (shots) await page.screenshot({ path: path.join(outDir, name + '.png') }); };
  const lastBot = (page) => page.evaluate(() => { const m = [...document.querySelectorAll('.msg-bot')].pop(); return m ? m.innerText : ''; });
  async function say(page, text) {
    await page.fill('#say', text);
    await page.click('.send');
    await page.waitForTimeout(120);
  }

  const page = await newPage();
  await page.goto(url);
  await page.waitForSelector('.hello');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('.hello');
  const data = await page.evaluate(() => ({
    ids: BC.all().map((it) => it.id),
    diagrams: BC.all().filter((it) => it.diagram).map((it) => it.id),
    errors: BC.validate().errors,
    counts: Object.fromEntries(Object.entries(BC.lists).map(([k, v]) => [k, v.length])),
  }));
  for (const e of data.errors) fail('データ：' + e);
  console.log('項目：' + JSON.stringify(data.counts) + `・作戦図 ${data.diagrams.length}`);
  await shot(page, 'chat-hello');

  // ② すべての項目のシート
  let opened = 0;
  for (const id of data.ids) {
    await page.evaluate((x) => { location.hash = x; }, id);
    await page.waitForSelector('.sheet .d-title', { timeout: 3000 }).catch(() => {});
    const r = await page.evaluate(() => {
      const t = document.querySelector('.sheet .d-title');
      const body = document.querySelector('.sheet-body');
      const cv = document.querySelector('.sheet [data-court]');
      return { title: t ? t.textContent : '', wide: body ? body.scrollWidth - body.clientWidth : 0, court: cv ? cv.querySelectorAll('.cv-p').length : -1 };
    });
    if (!r.title) fail(`${id}：シートが開かない`);
    if (r.wide > 1) fail(`${id}：シートが横にはみ出す（${r.wide}px）`);
    if (data.diagrams.includes(id) && r.court !== 10) fail(`${id}：作戦図が描けない`);
    if ((await overflow(page)) > 0) fail(`${id}：ページが横にはみ出す`);
    opened++;
  }
  console.log(`シートを開いた：${opened}`);
  // 作戦図の場面を進める
  const withFrames = await page.evaluate(() => BC.all().filter((it) => it.diagram && it.diagram.frames && it.diagram.frames.length > 1).map((it) => it.id));
  if (withFrames.length) {
    await page.evaluate((x) => { location.hash = x; }, withFrames[0]);
    await page.waitForSelector('.sheet [data-cv="next"]');
    const before = await page.textContent('.sheet .cv-count');
    await page.click('.sheet [data-cv="next"]');
    const after = await page.textContent('.sheet .cv-count');
    if (before === after) fail('作戦図の ▶ で場面が進まない');
    await page.waitForTimeout(700);
    await shot(page, 'sheet-tactic');
  }
  const someDrill = data.ids.find((id) => id === 'd-mikan') || data.ids.find((id) => id.startsWith('d-'));
  if (someDrill) { await page.evaluate((x) => { location.hash = x; }, someDrill); await page.waitForSelector('.sheet .d-title'); await shot(page, 'sheet-drill'); }
  await page.evaluate(() => { location.hash = 'chat'; });
  await page.waitForTimeout(100);

  // ③ チャット
  const talk = [
    ['シュートが入らない', 'i-shoot-miss'],
    ['ドリブルしてるとすぐボールを取られる', 'i-drb-stolen'],
    ['ディフェンスですぐ抜かれる', 'i-def-beat'],
    ['ゾーンをされると攻め方がわからない', 'i-vs-zone'],
    ['リバウンドが全然取れない', 'i-reb-lose'],
    ['試合で緊張してしまう', 'i-nerve'],
  ];
  for (const [text, want] of talk) {
    const got = await page.evaluate((t) => { const a = BC.answer(t); return a.type === 'issue' ? a.issue.id : a.type + ':' + ((a.item && a.item.id) || (a.skill && a.skill.id) || ''); }, text);
    if (data.ids.includes(want) && got !== want) fail(`チャット「${text}」→ ${got}（${want} のはず）`);
  }
  if (data.ids.includes('i-shoot-miss')) {
    await say(page, 'シュートが入らない');
    const txt = await lastBot(page);
    if (!txt.includes('シュートが入らない')) fail('チャット：「シュートが入らない」の答えが出ない');
    await shot(page, 'chat-issue');
    const ask = await page.$('.msg-bot:last-child .ask [data-ask]');
    if (ask) {
      await ask.click();
      await page.waitForTimeout(120);
      const t2 = await lastBot(page);
      if (!t2.includes('困りごと')) fail('チャット：ask の選択肢で次の困りごとが出ない');
    }
    const planBtn = await page.$('.msg-bot:last-child [data-plan]');
    if (planBtn) {
      await planBtn.click();
      await page.waitForSelector('.msg-bot:last-child .plan');
      const total = await page.evaluate(() => [...document.querySelectorAll('.msg-bot:last-child .plan-row small')].reduce((t, s) => t + parseInt(s.textContent, 10), 0));
      if (total !== 60) fail(`練習プランの合計が 60 分でない（${total}）`);
      await page.click('.msg-bot:last-child [data-planmin="90"]');
      const t90 = await page.evaluate(() => [...document.querySelectorAll('.msg-bot:last-child .plan-row small')].reduce((t, s) => t + parseInt(s.textContent, 10), 0));
      if (t90 !== 90) fail(`練習プランを90分にしても合計が 90 分でない（${t90}）`);
      await shot(page, 'chat-plan');
    }
  }
  await say(page, 'ひとりで30分の練習メニューを作って');
  if (!(await page.$('.msg-bot:last-child .plan'))) fail('チャット：「ひとりで30分の練習メニューを作って」で練習プランが出ない');
  else {
    const solo = await page.evaluate(() => [...document.querySelectorAll('.msg-bot:last-child .plan-row')].map((r) => BC.get(r.dataset.open)).filter((d) => d && d.n > 1).map((d) => d.id));
    if (solo.length) fail('ひとりのプランに、ひとりでできない練習：' + solo.join('、'));
  }
  await say(page, 'あいうえお');
  if (!(await lastBot(page)).includes('読み取れません')) fail('チャット：わからない文のときの答えが出ない');
  if ((await overflow(page)) > 0) fail('チャット：横にはみ出す');

  // 図鑑
  await page.evaluate(() => { location.hash = 'library'; });
  await page.waitForSelector('#lib-q');
  await shot(page, 'library');
  await page.fill('#lib-q', 'ボックスアウト');
  await page.waitForTimeout(100);
  const libN = await page.$$eval('#lib-list .card', (x) => x.length);
  if (!libN) fail('図鑑：「ボックスアウト」で何も出ない');
  for (const k of ['view', 'drill', 'tactic']) {
    await page.click(`[data-libkind="${k}"]`);
    if (!(await page.$$eval('#lib-list .card', (x) => x.length))) fail(`図鑑：${k} の一覧が空`);
  }
  if ((await overflow(page)) > 0) fail('図鑑：横にはみ出す');
  await shot(page, 'library-tactic');

  // 練習プラン（プランの画面）
  await page.evaluate(() => { location.hash = 'plan'; });
  await page.waitForSelector('[data-pl="make"]');
  await page.fill('#pl-q', 'シュート');
  await page.waitForTimeout(80);
  const addTheme = await page.$('#pl-sug [data-plthadd]');
  if (addTheme) await addTheme.click(); else fail('プラン：テーマの候補が出ない');
  await page.click('[data-plc="minutes"][data-v="90"]');
  await page.click('[data-pl="make"]');
  await page.waitForSelector('.pl-row');
  const total = () => page.evaluate(() => BCAPP.PL.data.blocks.reduce((t, b) => t + b.items.reduce((u, x) => u + x.min, 0), 0));
  if ((await total()) !== 90) fail(`プラン：合計が 90 分でない（${await total()}）`);
  const before = await page.evaluate(() => BCAPP.PL.data.blocks[0].items[0].id);
  await page.click('.pl-row [data-pl="swap"]');
  const after = await page.evaluate(() => BCAPP.PL.data.blocks[0].items[0].id);
  if (before === after) fail('プラン：↻ で入れかわらない');
  await page.click('.pl-row [data-pl="plus"]');
  if ((await total()) !== 91) fail('プラン：＋ で時間がふえない');
  await page.click('[data-pl="save"]');
  if (!(await page.$('.pl-saved'))) fail('プラン：保存したプランが出ない');
  if ((await overflow(page)) > 0) fail('プラン：横にはみ出す');
  await shot(page, 'plan');
  await page.click('[data-pl="run"]');
  await page.waitForSelector('.run #run-clock');
  const clock = await page.textContent('#run-clock');
  if (!/^\d+:\d\d$/.test(clock)) fail('タイマー：時間が出ない（' + clock + '）');
  await page.waitForTimeout(1300);
  const clock2 = await page.textContent('#run-clock');
  if (clock2 === clock) fail('タイマー：時間が進まない');
  await shot(page, 'run');
  await page.click('[data-run="next"]');
  if ((await page.evaluate(() => BCAPP.getRun().i)) !== 1) fail('タイマー：「次」で進まない');
  await page.click('[data-run="end"]');
  if (await page.$('.run')) fail('タイマー：終われない');
  // チャットのプランから、プランの画面へ
  await page.evaluate(() => { location.hash = 'chat'; });
  await say(page, '45分の練習メニューを作って');
  const edit = await page.$('.msg-bot:last-child [data-pledit]');
  if (!edit) fail('チャット：プランの画面へのボタンがない');
  else {
    await edit.click();
    await page.waitForSelector('.pl-row');
    if ((await total()) !== 45) fail('チャットのプランを、プランの画面で開けない');
  }

  // 棒人間のアニメーション
  await page.evaluate(() => { location.hash = 'd-pound'; });
  await page.waitForSelector('.sheet .mo-stage svg');
  const head = () => page.evaluate(() => { const c = document.querySelector('.sheet .mo-head'); return c ? c.getAttribute('cy') + ',' + document.querySelector('.sheet .mo-ball').getAttribute('transform') : ''; });
  const h1 = await head();
  await page.waitForTimeout(260);
  const h2 = await head();
  if (!h1 || h1 === h2) fail('アニメーション：動かない');
  const motions = await page.evaluate(() => Object.keys(BC.motions).length + '・つながっている項目 ' + Object.keys(BC.MOTION_OF).filter((id) => BC.get(id)).length);
  console.log('アニメーション：' + motions);
  const badIds = await page.evaluate(() => Object.keys(BC.MOTION_OF).filter((id) => !BC.get(id) || !BC.motions[BC.MOTION_OF[id]]));
  if (badIds.length) fail('アニメーション：ない項目・動き ' + badIds.join('、'));
  await shot(page, 'sheet-anim');
  await page.evaluate(() => { location.hash = 'chat'; });

  // ④ 動画
  await page.evaluate(() => { location.hash = 'videos'; });
  await page.waitForSelector('[data-act="pick-folder"]');
  if (vdir) {
    const [fc] = await Promise.all([page.waitForEvent('filechooser'), page.click('[data-act="pick-folder"]')]);
    await fc.setFiles(path.resolve(vdir));
    await page.waitForSelector('.vrow', { timeout: 5000 }).catch(() => {});
    const n = await page.$$eval('.vrow', (x) => x.length);
    if (!n) fail('動画：フォルダを選んでも一覧が出ない');
    const linked = await page.evaluate(() => BCV.count());
    console.log(`動画：${linked.files} 本・紐付けあり ${linked.linked} 本`);
    await page.waitForTimeout(1500);
    await shot(page, 'videos');
    await page.click('.vrow [data-play]');
    await page.waitForSelector('.sheet video, .sheet .btn-go');
    await page.fill('#link-q', 'マイカン');
    await page.waitForTimeout(100);
    const addBtn = await page.$('#link-res [data-link]');
    if (addBtn) {
      await addBtn.click();
      await page.waitForTimeout(150);
      const tags = await page.$$eval('.sheet [data-unlink]', (x) => x.length);
      if (!tags) fail('動画：紐付けを足せない');
    }
    await shot(page, 'video-sheet');
    await page.click('.sheet [data-act="close"]');
    await page.evaluate(() => { location.hash = 'chat'; });
    await say(page, 'シュートが入らない');
    await page.waitForTimeout(800);
    const vids = await page.$$eval('.msg-bot:last-child .vid', (x) => x.length);
    if (!vids) fail('動画：チャットの答えに動画が出ない');
    await shot(page, 'chat-issue-videos');
  }
  for (const e of page.errors) fail(e);

  // ⑤ パソコン・暗い表示
  if (shots) {
    const pc = await newPage({ viewport: { width: 1280, height: 860 } });
    await pc.goto(url);
    await pc.waitForSelector('.hello');
    await pc.evaluate(() => localStorage.clear());
    await pc.reload();
    await pc.waitForSelector('.hello');
    if (data.ids.includes('i-vs-zone')) { await say(pc, 'ゾーンを攻略できない'); }
    const t = data.ids.find((id) => id === 't-pnr') || data.diagrams[0];
    if (t) { await pc.evaluate((x) => { location.hash = x; }, t); await pc.waitForSelector('.sheet .d-title'); await pc.waitForTimeout(400); }
    await shot(pc, 'pc');
    for (const e of pc.errors) fail('パソコン：' + e);
    const dk = await newPage({ dark: true });
    await dk.goto(url);
    await dk.waitForSelector('.hello');
    if (data.ids.includes('i-def-beat')) await say(dk, 'ディフェンスで抜かれる');
    await shot(dk, 'dark-chat');
    if (t) { await dk.evaluate((x) => { location.hash = x; }, t); await dk.waitForSelector('.sheet .d-title'); await dk.waitForTimeout(400); await shot(dk, 'dark-tactic'); }
    for (const e of dk.errors) fail('暗い表示：' + e);
  }
  await browser.close();
  console.log(bad ? `\nまちがい ${bad}` : '\nまちがいなし');
  if (bad) process.exitCode = 1;
})();
