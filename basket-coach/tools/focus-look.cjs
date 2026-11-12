#!/usr/bin/env node
/* 「今週の これ1つ」の画面の通しの検査（ブラウザ）。
   流れ：ホームのカード → のびしろ3つ → 30秒のタイマー（偽の時計で早送り）→ 数を入れる → 目標 → 決める（経験値）→
        きょうのメニューが「これ1つ」中心 → 練習のおわりに ふり返り → 測りなおし（ストップウォッチ・自己ベスト）→ のびの画面 →
        きろくのページ → 見せる文のコピー → 週ゴールの かえ方 → 来週になったら カードが もどる → くらい表示・横にはみ出さない・エラーなし
   使い方：NODE_PATH=$(npm root -g) node tools/focus-look.cjs [--no-shots]
   画像：tools/_out/focus-*.png（幅 390px） */
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'tools', '_out');
fs.mkdirSync(outDir, { recursive: true });
const shots = !process.argv.includes('--no-shots');
const url = 'file://' + path.join(root, 'index.html');
let pass = 0, fail = 0;
const ok = (c, m, x) => { if (c) { pass++; console.log('  ✓ ' + m); } else { fail++; console.log('  ✗ ' + m + (x !== undefined ? '  ' + JSON.stringify(x).slice(0, 220) : '')); } };

(async () => {
  const browser = await chromium.launch();
  const errors = [];
  const ME = { name: 'けんた', grade: 'e56', level: 1, goals: ['dribble', 'shoot'], place: 'hoop', n: 1, since: Date.now() };
  // 2026-11-11（水）の昼。この日を「きょう」に する
  const START = new Date(2026, 10, 11, 12, 0, 0);
  async function newUser(opt = {}) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: opt.dark ? 'dark' : 'light', reducedMotion: 'reduce', permissions: ['clipboard-read', 'clipboard-write'] });
    const page = await ctx.newPage();
    await page.clock.install({ time: START });
    page.on('pageerror', (e) => errors.push(`ページ：${e.message}`));
    page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)/.test(m.text())) errors.push(`コンソール：${m.text()}`); });
    await page.goto(url);
    await page.evaluate((me) => { localStorage.clear(); localStorage.setItem('bc.me', JSON.stringify(me)); }, opt.me || ME);
    await page.reload();
    await page.evaluate(() => { location.hash = 'home'; });
    await page.waitForSelector('.hero');
    return page;
  }
  const shot = async (page, name, full) => { if (shots) await page.screenshot({ path: path.join(outDir, `focus-${name}.png`), fullPage: !!full }); };
  const go = async (page, hash) => { await page.evaluate((h) => { location.hash = h; }, hash); await page.waitForTimeout(80); };
  const acts = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('bc.acts') || '[]'));
  const fstate = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('bc.focus') || '{"items":[]}'));
  const closeModal = async (page) => { await page.waitForTimeout(1100); if (await page.$('.modal')) await page.click('.modal button[data-act="modal-close"]'); };

  try {
    const page = await newUser();
    console.log('■ ホーム：はじめは「これ1つ」を きめよう');
    ok(await page.$('.fc-home.cta-new'), 'ホームに「今週の これ1つ」のカード（きめる前）');
    ok(/今週 0\/3日|今週\s*0/.test(await page.$eval('.week', (e) => e.innerText)) && (await page.$eval('.streak b', (e) => e.textContent)) === '0/3', '今週の日数と週ゴール（0/3）');
    await shot(page, 'home-new');

    console.log('■ のびしろを えらぶ');
    await page.click('.fc-home a[href="#focus"]');
    await page.waitForSelector('.fc-cand');
    const cands = await page.$$eval('.fc-cand', (bs) => bs.map((b) => b.innerText.replace(/\s+/g, ' ')));
    ok(cands.length === 3, 'のびしろが 3つ', cands);
    ok(/ドリブル/.test(cands[0]) && /ともくひょう/.test(cands[0]) && /シュート/.test(cands[1]), 'ともくひょう（ドリブル・シュート）の順・理由つき', cands);
    await shot(page, 'pick');
    await page.click('.fc-more summary');
    await page.click('.fc-more [data-fc="skill"]');
    await page.waitForSelector('.fc-row');
    ok((await page.$$('.fc-row')).length >= 1, 'ほかの技能から えらぶと、その技能の 測り方が 出る');
    await page.click('[data-fc="back"]');
    await page.waitForSelector('.fc-cand');

    console.log('■ 30秒チャレンジで 測る');
    await page.click('.fc-cand >> nth=0');
    await page.waitForSelector('#fc-timer');
    ok(/ポンドドリブル（右手）/.test(await page.$eval('.page-h', (e) => e.innerText)) && /30/.test(await page.$eval('#fc-clock', (e) => e.textContent)), '測るテスト（ポンドドリブル 右手・30秒）');
    ok(await page.$eval('#fc-enter', (e) => e.hidden), 'タイマーが おわるまで 数の欄は 出ない');
    await shot(page, 'measure');
    await page.click('#fc-go');
    await page.clock.runFor(1000);
    ok((await page.$eval('#fc-clock', (e) => e.textContent)).trim() === '2' && /よーい/.test(await page.$eval('#fc-clock-l', (e) => e.textContent)), '3・2・1 のカウント（よーい）');
    await page.clock.runFor(2200);
    ok(/スタート/.test(await page.$eval('#fc-clock-l', (e) => e.textContent)), 'スタート');
    await page.clock.runFor(10000);
    const mid = Number(await page.$eval('#fc-clock', (e) => e.textContent));
    ok(mid >= 19 && mid <= 21, '30秒のカウントダウン（のこり ' + mid + '）');
    await shot(page, 'measure-run');
    await page.clock.runFor(21000);
    await page.waitForFunction(() => !document.getElementById('fc-enter').hidden);
    ok(true, 'おしまい → 数を入れる欄が 出る');
    ok((await page.$eval('#fc-cancel', (e) => e.textContent)) === 'やりなおす', '「やりなおす」');
    await page.fill('#fc-val', '38');
    await page.click('[data-fc="num"][data-d="1"]');
    ok((await page.$eval('#fc-val', (e) => e.value)) === '39', 'ふやす（39）');
    await page.click('[data-fc="num"][data-d="-1"]');
    await shot(page, 'enter');
    await page.click('[data-fc="measured"]');

    console.log('■ 目標をきめる');
    await page.waitForSelector('.fc-base');
    ok(/38回/.test(await page.$eval('.fc-base', (e) => e.innerText)) && (await page.$eval('#fc-goal', (e) => e.value)) === '42', 'きじゅん 38回・目標は 42回（+10%）を すすめる');
    ok((await page.$$('.fc-goal-row, .rows .row-card')).length >= 1, 'この1週間の 練習メニュー');
    await page.click('[data-fc="num"][data-d="1"]');
    await shot(page, 'goal');
    await page.click('[data-fc="decide"]');
    await page.waitForSelector('.fc-home.on');
    ok(/38回/.test(await page.$eval('.fc-nums', (e) => e.innerText)) && /43回/.test(await page.$eval('.fc-nums', (e) => e.innerText)), 'ホームに「きじゅん 38回 → 目標 43回」');
    let a = await acts(page);
    ok(a.some((x) => x.type === 'focus' && x.xp === 10 && x.v === 38 && x.skill === 'dribble'), '経験値 +10（これ1つ）', a.map((x) => x.type));
    let st = await fstate(page);
    ok(st.items.length === 1 && st.items[0].goal === 43 && st.items[0].tries[0].v === 38 && st.items[0].week === '2026-11-09', '端末に のこった きろく（月曜はじまりの週）', st.items[0]);
    await closeModal(page);
    await shot(page, 'home-on');
    await shot(page, 'home-on-full', true);

    console.log('■ きょうのメニューが「これ1つ」中心');
    ok(/ドリブル/.test(await page.$eval('.today-skill', (e) => e.innerText)) && /これ1つ/.test(await page.$eval('.today-skill', (e) => e.innerText)), 'きょうの中心は ドリブル（これ1つ）');
    const first = await page.$eval('.today-list li:first-child', (e) => e.innerText.replace(/\s+/g, ' '));
    ok(/ポンドドリブル/.test(await page.$eval('.today-list', (e) => e.innerText)) && (await page.$$('.today-list .r-focus')).length >= 1, '「これ1つ」の練習が メニューに ある（バッジつき）', first);

    console.log('■ 練習のおわりに ふり返り');
    await page.click('[data-act="menu-start"]');
    await page.waitForSelector('.run .run-clock');
    const n = (await page.evaluate(() => window.BCAPP.getRun().items.length));
    for (let i = 0; i < n; i++) await page.click('[data-run="next"]');
    await page.waitForSelector('.run .rate');
    ok(await page.$('.run .fc-reflect'), '練習のおわりの画面に「ふり返り（30秒）」');
    await page.click('.run [data-fc-chip="good"][data-v="リズムが よかった"]');
    await page.click('.run [data-fc-chip="next"][data-v="ひざを まげる"]');
    ok((await page.$$eval('.run [data-fc-chip][aria-pressed="true"]', (b) => b.length)) === 2, 'できたこと・つぎに意識すること を 1つずつ えらぶ');
    await shot(page, 'reflect');
    await page.click('.run [data-rate="3"]');
    await page.waitForTimeout(300);
    st = await fstate(page);
    ok(st.items[0].notes.length === 1 && st.items[0].notes[0].good === 'リズムが よかった' && st.items[0].notes[0].next === 'ひざを まげる', 'ふり返りが のこった', st.items[0].notes);
    a = await acts(page);
    ok(a.some((x) => x.type === 'reflect' && x.xp === 5), '経験値 +5（ふり返り）');
    await closeModal(page);
    await go(page, 'home');
    await page.waitForSelector('.fc-home.on');
    ok(/ひざを まげる/.test(await page.$eval('.fc-cue', (e) => e.innerText)), 'ホームに「前の ふり返りから：ひざを まげる」');
    ok(/今週 1\/3|今週\s*1/.test(await page.$eval('.hero', (e) => e.innerText)) && (await page.$eval('.streak b', (e) => e.textContent)) === '1/3', '今週の日数 1/3');
    await shot(page, 'home-cue');

    console.log('■ 5分だけ これ1つ');
    await page.click('[data-fc-home="five"]');
    await page.waitForSelector('.run .run-clock');
    const five = await page.evaluate(() => window.BCAPP.getRun().items.map((x) => [x.id, x.min]));
    ok(five.length === 2 && five[0][0] === 'd-pound' && five.reduce((t, x) => t + x[1], 0) === 5, '5分（これ1つの練習 2つ）', five);
    await page.click('[data-run="stop"]');
    await page.waitForTimeout(100);

    console.log('■ 測りなおし（のびを見る）');
    await page.clock.setSystemTime(new Date(2026, 10, 14, 12, 0, 0)); // 土曜
    await page.reload();
    await page.waitForSelector('.fc-home.on');
    await page.click('.fc-home a[href="#focus/measure"]');
    await page.waitForSelector('#fc-timer');
    ok(/前の 数：\s*38回/.test(await page.$eval('main', (e) => e.innerText)), '測りなおし：前の数 38回');
    await page.click('[data-fc="manual"]');
    ok(!(await page.$eval('#fc-enter', (e) => e.hidden)), 'タイマーなしで 数を入れる');
    await page.fill('#fc-val', '44');
    await page.click('[data-fc="measured"]');
    await page.waitForSelector('.fc-result');
    ok(/38回/.test(await page.$eval('.fc-arrow', (e) => e.innerText)) && /44回/.test(await page.$eval('.fc-arrow', (e) => e.innerText)) && /\+6回/.test(await page.$eval('.fc-gain', (e) => e.innerText)), '38回 → 44回（+6回）');
    ok(await page.$('.fc-result.pb') && /自己ベスト/.test(await page.$eval('.fc-gain', (e) => e.innerText)) && /目標クリア/.test(await page.$eval('.fc-gain', (e) => e.innerText)), '自己ベスト・目標クリア');
    ok(await page.$('.fc-spark'), 'のびの グラフ');
    ok(/リズムが よかった/.test(await page.$eval('main', (e) => e.innerText)), 'ふり返りが 並ぶ');
    a = await acts(page);
    ok(a.some((x) => x.type === 'try' && x.v === 44) && a.some((x) => x.type === 'pb' && x.xp === 20), '経験値：測りなおし +10・自己ベスト +20');
    await closeModal(page);
    await shot(page, 'result');
    await shot(page, 'result-full', true);

    console.log('■ きろく・見せる・ひろば');
    await go(page, 'log');
    await page.waitForSelector('.fc-hist');
    ok(/ポンドドリブル（右手）/.test(await page.$eval('.fc-hist', (e) => e.innerText)) && /44回/.test(await page.$eval('.fc-hist', (e) => e.innerText)) && /\+6回/.test(await page.$eval('.fc-hist .cl-st', (e) => e.innerText)), 'きろくの「これ1つの のび」');
    const got = await page.$$eval('.badges .badge.got b', (b) => b.map((x) => x.textContent));
    ok(got.includes('これ1つ') && got.includes('自己ベスト'), 'バッジ「これ1つ」「自己ベスト」', got);
    await shot(page, 'log');
    await page.click('.fc-hist');
    await page.waitForSelector('.fc-result');
    await page.click('[data-fc="share"]');
    await page.waitForTimeout(400);
    const clip = await page.evaluate(() => navigator.clipboard.readText().catch(() => '')) || (await page.$eval('.modal .copy-box', (e) => e.value).catch(() => ''));
    ok(/今週の「これ1つ」：ポンドドリブル（右手）/.test(clip) && /38回 → 44回（\+6回）/.test(clip), '「見せる」文（コピー）', clip);
    ok(!(await page.$('[data-fc="club"]')), 'クラブに ログインしていなければ「ひろばに のせる」は 出ない');

    console.log('■ 週ゴール');
    await go(page, 'settings');
    await page.waitForSelector('[data-weekgoal]');
    await page.click('[data-weekgoal="4"]');
    await go(page, 'home');
    await page.waitForSelector('.hero');
    ok((await page.$eval('.streak b', (e) => e.textContent)).endsWith('/4'), '週ゴールを 4日に かえた');
    await page.click('[data-weekgoal]').catch(() => {});

    console.log('■ 来週になったら');
    await page.clock.setSystemTime(new Date(2026, 10, 17, 12, 0, 0)); // 次の火曜
    await page.reload();
    await page.waitForSelector('.hero');
    ok(await page.$('.fc-home.cta-new'), '来週は また「これ1つを きめる」から（きのうまでの きろくは のこる）');
    st = await fstate(page);
    ok(st.items.length === 1 && st.items[0].tries.length === 2, '先週の きろくは そのまま');
    await page.click('.fc-home a[href="#focus"]');
    await page.waitForSelector('.fc-cand');
    const c2 = await page.$$eval('.fc-cand', (bs) => bs.map((b) => b.innerText.replace(/\s+/g, ' ')));
    ok(c2.length === 3 && !/ポンドドリブル（右手）/.test(c2[0]), '目標を たっせいした テストは すぐには すすめない（べつの測り方・技能）', c2);
    await shot(page, 'pick-next');

    console.log('■ 書き出し・読みこみの もとになる 保存');
    const keys = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('bc.')));
    ok(keys.includes('bc.focus'), 'bc.focus が この端末に のこる', keys);

    console.log('■ くらい表示・横はみ出し');
    const dark = await newUser({ dark: true });
    await go(dark, 'focus');
    await dark.waitForSelector('.fc-cand');
    await shot(dark, 'dark-pick');
    await dark.click('.fc-cand >> nth=0');
    await dark.waitForSelector('#fc-timer');
    await shot(dark, 'dark-measure');
    for (const [name, p, h] of [['ホーム', page, 'home'], ['のびしろ', page, 'focus'], ['のびを見る', page, 'focus/' + st.items[0].id], ['くらい：測る', dark, null]]) {
      if (h) await go(p, h);
      await p.waitForTimeout(150);
      const ov = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      ok(ov <= 0, `${name}：横にはみ出さない`, ov);
    }
  } catch (e) {
    fail++;
    console.log('  ✗ とちゅうで止まった：' + e.message.split('\n')[0]);
  } finally {
    ok(!errors.length, 'コンソール・ページのエラーなし', errors.slice(0, 5));
    await browser.close();
  }
  console.log(`\n${fail ? '✗' : '✓'} ${pass} 合格・${fail} 不合格`);
  process.exit(fail ? 1 : 0);
})();
