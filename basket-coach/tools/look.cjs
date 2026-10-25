#!/usr/bin/env node
/* 見た目と動きの検査：ブラウザ（Chromium）で開いて、
   ①データの検査（BC.validate・BC.validateMotions・BC.validateAid）にまちがいがないか
   ②はじめての人の画面 → ホーム。すべてのページ（技能・なやみ・見るポイント・練習・戦術・ケガ・テーピング）を開き、
     見出しが出るか・スマホの幅（390px）で横にはみ出さないか・エラーが出ないか
   ③やってみる：「やった！」→ 経験値、きょうのメニュー → タイマー → おわり → 記録とバッジ、なやみを書いてさがす、そうだん（チャット）、プラン、ずかん
   ④画像（スマホ・パソコン・暗い表示）を tools/_out/ に書き出す
   使い方：  NODE_PATH=$(npm root -g) node tools/look.cjs [開くHTML] [--no-shots] [--quick]（--quick：ページの全数検査をはぶく）
   まちがい（✗）が1つでもあれば、終了コード 1。 */
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

(async () => {
  const root = path.resolve(__dirname, '..');
  const args = process.argv.slice(2);
  const file = path.resolve(args.find((a) => !a.startsWith('--')) || path.join(root, 'index.html'));
  const shots = !args.includes('--no-shots');
  const quick = args.includes('--quick');
  const url = 'file://' + file;
  const outDir = path.join(root, 'tools', '_out');
  if (shots) fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  let bad = 0;
  const fail = (m) => { bad++; console.log('✗ ' + m); };
  const isExternal = (u) => /fonts\.(googleapis|gstatic)\.com|cdn\.jsdelivr\.net|storage\.googleapis\.com/.test(u);
  async function newPage(opt = {}) {
    const ctx = await browser.newContext({ viewport: opt.viewport || { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: opt.dark ? 'dark' : 'light', reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    page.errors = [];
    page.on('pageerror', (e) => page.errors.push('ページのエラー：' + e.message));
    page.on('console', (m) => { if (m.type() === 'error' && !isExternal(m.text())) page.errors.push('コンソール：' + m.text()); });
    page.on('requestfailed', (r) => { if (!isExternal(r.url())) page.errors.push('読みこめない：' + r.url()); });
    return page;
  }
  const overflow = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  const shot = async (page, name, full) => { if (shots) await page.screenshot({ path: path.join(outDir, name + '.png'), fullPage: !!full }); };
  const go = async (page, hash) => { await page.evaluate((h) => { location.hash = h; }, hash); await page.waitForTimeout(60); };
  const flushErrors = (page, where) => { for (const e of page.errors.splice(0)) fail(`${where}：${e}`); };

  const page = await newPage();
  await page.goto(url);
  await page.evaluate(() => localStorage.clear());
  await page.goto(url + '#home');
  await page.waitForSelector('.hello');

  // ① データ
  const data = await page.evaluate(() => ({
    ids: BC.all().map((it) => it.id),
    skills: BC.skills.map((s) => s.id),
    errors: BC.validate().errors,
    motion: BC.validateMotions ? BC.validateMotions().errors : ['BC.validateMotions がない'],
    aid: BC.validateAid ? BC.validateAid().errors : ['BC.validateAid がない'],
    aids: (BC.aids || []).map((a) => a.id),
    tapes: (BC.tapes || []).map((t) => t.id),
    counts: Object.fromEntries(Object.entries(BC.lists).map(([k, v]) => [k, v.length])),
    motions: Object.keys(BC.motions).length,
    linked: Object.keys(BC.MOTION_OF).length,
  }));
  console.log(`データ：${JSON.stringify(data.counts)}・動き ${data.motions}（つながり ${data.linked}）・ケガ ${data.aids.length}・テーピング ${data.tapes.length}`);
  for (const e of data.errors) fail('データ：' + e);
  for (const e of data.motion) fail('動き：' + e);
  for (const e of data.aid) fail('ケガ：' + e);

  // ② はじめての人
  await shot(page, 'k-hello');
  if (await overflow(page) > 0) fail('はじめての人：横にはみ出す');
  await page.fill('#hello-name', 'けんた');
  await page.click('[data-hello="grade"][data-v="e56"]');
  await page.click('[data-hello="goals"][data-v="dribble"]');
  await page.click('[data-hello="goals"][data-v="shoot"]');
  await page.click('[data-hello="place"][data-v="hoop"]');
  await page.click('[data-act="hello-done"]');
  await page.waitForSelector('.hero');
  const me = await page.evaluate(() => JSON.parse(localStorage.getItem('bc.me')));
  if (!me || me.name !== 'けんた' || me.level !== 1 || me.goals.join() !== 'dribble,shoot' || me.place !== 'hoop') fail('はじめての人：プロフィールが保存されない ' + JSON.stringify(me));
  const menu = await page.evaluate(() => BCAPP.todayMenu());
  if (!menu.items.length) fail('ホーム：きょうのメニューが空');
  if (Math.abs(menu.min - 15) > 2) fail('ホーム：きょうのメニューの時間 ' + menu.min);
  console.log(`きょうのメニュー：${menu.skill}・${menu.min}分・${menu.items.length}つ`);
  await shot(page, 'k-home');
  await shot(page, 'k-home-full', true);
  flushErrors(page, 'ホーム');

  // ページを全部ひらく
  const pages = ['practice', 'check', 'log', 'more', 'plan', 'chat', 'lib', 'settings', 'about', 'aid', ...data.skills.map((s) => 's/' + s), ...data.aids.map((a) => 'aid/' + a), ...data.tapes.map((t) => 'tape/' + t)];
  const all = quick ? pages.concat(data.ids.filter((_, i) => i % 15 === 0)) : pages.concat(data.ids);
  let n = 0;
  for (const h of all) {
    await go(page, h);
    const r = await page.evaluate(() => ({ h: (document.querySelector('main .page-h, main .hero, main .ck-h, main h1, main h2') || {}).textContent || '', anim: document.querySelectorAll('main [data-anim]').length, svg: document.querySelectorAll('main [data-anim] svg, main [data-court] svg, main .tape-fig svg').length }));
    if (!r.h.trim()) fail(`${h}：見出しがない`);
    if (r.anim && !r.svg) fail(`${h}：アニメーションが描けない`);
    const ov = await overflow(page);
    if (ov > 0) fail(`${h}：横に ${ov}px はみ出す`);
    flushErrors(page, h);
    n++;
  }
  console.log(`ページ：${n} 開いた`);

  // ③ やってみる
  await go(page, 'd-pound');
  await shot(page, 'k-drill');
  await shot(page, 'k-drill-full', true);
  await page.click('[data-act="drill-done"]');
  await page.waitForSelector('.modal .rate');
  await shot(page, 'k-rate');
  await page.click('.modal [data-rmin="10"]');
  await page.click('.modal [data-rate="3"]');
  await page.waitForTimeout(200);
  let acts = await page.evaluate(() => JSON.parse(localStorage.getItem('bc.acts') || '[]'));
  if (acts.length !== 1 || acts[0].id !== 'd-pound' || acts[0].min !== 10 || acts[0].rate !== 3 || !(acts[0].xp > 0)) fail('やった！：記録がおかしい ' + JSON.stringify(acts));
  const toast = await page.evaluate(() => (document.querySelector('.toast') || {}).textContent || '');
  if (!/XP/.test(toast)) fail('やった！：経験値のお知らせが出ない');
  await page.waitForTimeout(1100);
  if (await page.$('.modal .celebrate')) { await shot(page, 'k-celebrate'); await page.click('.modal button[data-act="modal-close"]'); }
  else fail('やった！：はじめてのバッジ（はじめの一歩）のお祝いが出ない');

  // きょうのメニュー → タイマー
  await go(page, 'home');
  await page.click('[data-act="menu-start"]');
  await page.waitForSelector('.run .run-clock');
  await page.waitForTimeout(300);
  await shot(page, 'k-run');
  for (let i = 0; i < menu.items.length; i++) await page.click('[data-run="next"]');
  await page.waitForSelector('.run .rate');
  await shot(page, 'k-run-done');
  await page.fill('#run-note', '左手が前よりできた');
  await page.click('.run [data-rate="2"]');
  await page.waitForTimeout(300);
  acts = await page.evaluate(() => JSON.parse(localStorage.getItem('bc.acts') || '[]'));
  if (!acts.some((a) => a.type === 'menu')) fail('きょうのメニュー：おわっても記録されない');
  if (acts.filter((a) => a.type === 'drill').length !== 1 + menu.items.length) fail('きょうのメニュー：メニューの数だけ記録されない');
  await page.waitForTimeout(1100);
  if (await page.$('.modal')) await page.click('.modal button[data-act="modal-close"]');
  const home2 = await page.evaluate(() => ({ done: !!document.querySelector('.today.done'), streak: (document.querySelector('.streak b') || {}).textContent }));
  if (!home2.done || home2.streak !== '1') fail('ホーム：クリアの表示・れんぞくの日数 ' + JSON.stringify(home2));
  await shot(page, 'k-home-after');
  // 見るポイントのチェック
  await go(page, 'v-drb-low');
  const nchk = await page.$$eval('.chk', (b) => b.length);
  for (let i = 0; i < nchk; i++) await page.click(`.chk[data-i="${i}"]`);
  acts = await page.evaluate(() => JSON.parse(localStorage.getItem('bc.acts') || '[]'));
  if (!acts.some((a) => a.type === 'view' && a.id === 'v-drb-low')) fail('見るポイント：ぜんぶチェックしても記録されない');
  await page.waitForTimeout(1200);
  if (await page.$('.modal')) await page.click('.modal button[data-act="modal-close"]');
  await shot(page, 'k-view');
  // なやみを書く
  await go(page, 'home');
  await page.fill('.ask-form input', 'シュートが入らない');
  await page.press('.ask-form input', 'Enter');
  await page.waitForTimeout(150);
  if ((await page.evaluate(() => location.hash)) !== '#i-shoot-miss') fail('なやみを書く：シュートが入らない → ' + (await page.evaluate(() => location.hash)));
  await shot(page, 'k-issue');
  await shot(page, 'k-issue-full', true);
  await page.click('.back-btn');
  await page.waitForTimeout(100);
  if ((await page.evaluate(() => location.hash)) !== '#home') fail('もどる：ホームにもどらない');
  // そうだん
  await go(page, 'chat');
  await page.fill('[data-form="chat"] textarea', 'ドリブルを取られる');
  await page.press('[data-form="chat"] textarea', 'Enter');
  await page.waitForTimeout(200);
  const bot = await page.evaluate(() => { const m = [...document.querySelectorAll('.msg.bot')].pop(); return m ? m.innerText : ''; });
  if (!/ドリブル/.test(bot)) fail('そうだん：答えが出ない');
  await shot(page, 'k-chat');
  // プラン
  await go(page, 'plan');
  await page.click('[data-pl="make"]');
  await page.waitForTimeout(150);
  const total = await page.evaluate(() => BCAPP.PL.data && BCAPP.PL.data.blocks.reduce((t, b) => t + b.items.reduce((u, x) => u + x.min, 0), 0));
  if (total !== 60) fail('プラン：合計が 60分にならない ' + total);
  await shot(page, 'k-plan');
  // ずかん
  await go(page, 'lib');
  await page.fill('#lib-q', 'ピボット');
  await page.waitForTimeout(100);
  const libN = await page.$$eval('#lib-list .row-card', (r) => r.length);
  if (!libN) fail('ずかん：ピボット が見つからない');
  await shot(page, 'k-lib');
  // きろく・ケガ・れんしゅう
  for (const [h, name] of [['log', 'k-log'], ['practice', 'k-practice'], ['s/shoot', 'k-skill'], ['aid', 'k-aid'], ['more', 'k-more'], ['settings', 'k-settings']]) { await go(page, h); await shot(page, name); }
  await go(page, 'log'); await shot(page, 'k-log-full', true);
  await go(page, 'practice'); await shot(page, 'k-practice-full', true);
  if (data.aids.length) { await go(page, 'aid/' + data.aids[0]); await shot(page, 'k-aid-detail', true); }
  if (data.tapes.length) { await go(page, 'tape/' + data.tapes[0]); await shot(page, 'k-tape', true); }
  await go(page, 'check'); await shot(page, 'k-check');
  flushErrors(page, 'やってみる');

  // ④ 暗い表示・パソコン
  const state = await page.evaluate(() => Object.fromEntries(['bc.me', 'bc.acts', 'bc.vchk'].map((k) => [k, localStorage.getItem(k)])));
  const dark = await newPage({ dark: true });
  await dark.goto(url);
  await dark.evaluate((s) => { for (const [k, v] of Object.entries(s)) if (v) localStorage.setItem(k, v); }, state);
  await dark.reload();
  for (const [h, name] of [['home', 'k-dark-home'], ['d-pound', 'k-dark-drill'], ['log', 'k-dark-log'], ['s/dribble', 'k-dark-skill']]) {
    await dark.evaluate((x) => { location.hash = x; }, h);
    await dark.waitForTimeout(150);
    await shot(dark, name);
  }
  flushErrors(dark, '暗い表示');
  const wide = await newPage({ viewport: { width: 1280, height: 860 } });
  await wide.goto(url);
  await wide.evaluate((s) => { for (const [k, v] of Object.entries(s)) if (v) localStorage.setItem(k, v); }, state);
  await wide.reload();
  for (const [h, name] of [['home', 'k-pc-home'], ['s/shoot', 'k-pc-skill']]) {
    await wide.evaluate((x) => { location.hash = x; }, h);
    await wide.waitForTimeout(150);
    await shot(wide, name);
    if (await overflow(wide) > 0) fail(`パソコン ${h}：横にはみ出す`);
  }
  flushErrors(wide, 'パソコン');

  await browser.close();
  console.log(bad ? `\n✗ まちがい ${bad}` : '\n✓ ぜんぶ よし');
  process.exit(bad ? 1 : 0);
})();
