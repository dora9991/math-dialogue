#!/usr/bin/env node
/* クラブの画面の通しの検査（コーチと子ども、2つのブラウザ）。
   手元の Postgres（club/schema.sql）と検査用サーバー（tools/club-dev-server.cjs）を使い、アプリが Supabase に送る
   /rest/v1/rpc/… を、Playwright で検査用サーバーへ回す（本番の Supabase には さわらない）。
   使い方：NODE_PATH=$(npm root -g) node tools/club-test.cjs [--db=postgres://postgres@127.0.0.1:54434/bgtest] [--no-shots]
   流れ：コーチがクラブをつくる → 子どもを登録（ログインカード）→ 子どもがログイン → 課題を写真つきで提出（4つ）→
        ひろばに投稿（文・写真）→ コーチが確認して合格 → 10級を認定 → 子どもの画面でお祝い・経験値 → スタンプ →
        コーチが写真の投稿を出す → 級の回数を直す → せってい → ログインカード → ホームのカード
   画像：tools/_out/club-*.png（幅 390px） */
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const { start } = require('./club-dev-server.cjs');

const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'tools', '_out');
fs.mkdirSync(outDir, { recursive: true });
const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const DB = arg('db', process.env.BG_DB || 'postgres://postgres@127.0.0.1:54434/bgtest');
const shots = !process.argv.includes('--no-shots');
const url = 'file://' + path.join(root, 'index.html');

let pass = 0, fail = 0;
const ok = (c, m, x) => { if (c) { pass++; console.log('  ✓ ' + m); } else { fail++; console.log('  ✗ ' + m + (x !== undefined ? '  ' + JSON.stringify(x).slice(0, 200) : '')); } };

(async () => {
  const srv = await start({ port: 54437, db: DB, schema: true });
  const browser = await chromium.launch();
  const errors = [];
  async function newUser(name, ip, opt = {}) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: opt.dark ? 'dark' : 'light', reducedMotion: 'reduce', acceptDownloads: true });
    await ctx.route(/https:\/\/[a-z0-9]+\.supabase\.co\/rest\/v1\/rpc\/.*/, async (route) => {
      const req = route.request();
      const fn = req.url().split('/rpc/')[1];
      const r = await fetch(`${srv.url}/rest/v1/rpc/${fn}`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-test-ip': ip }, body: req.postData() || '{}' });
      route.fulfill({ status: r.status, contentType: 'application/json', body: await r.text(), headers: { 'access-control-allow-origin': '*' } });
    });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errors.push(`${name}：${e.message}`));
    page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|jsdelivr|googleapis\.com\/mediapipe/.test(m.text())) errors.push(`${name}：${m.text()}`); });
    await page.goto(url);
    await page.evaluate((me) => { localStorage.clear(); localStorage.setItem('bc.me', JSON.stringify(me)); }, { name: name, grade: name === 'コーチ' ? 'a' : 'e56', level: name === 'コーチ' ? null : 1, goals: ['dribble'], place: 'hoop', n: 1, since: Date.now() });
    await page.reload();
    return page;
  }
  const shot = async (page, name, full) => { if (shots) await page.screenshot({ path: path.join(outDir, `club-${name}.png`), fullPage: !!full }); };
  const go = async (page, hash) => { await page.evaluate((h) => { location.hash = h; }, hash); await page.waitForTimeout(80); };
  const waitText = (page, sel, re, ms = 6000) => page.waitForFunction(([s, r]) => { const e = document.querySelector(s); return e && new RegExp(r).test(e.innerText); }, [sel, re.source], { timeout: ms });

  try {
    // 写真（テスト用の JPEG を、ブラウザの canvas で作る）
    const coach = await newUser('コーチ', '10.1.0.1');
    const photo = path.join(outDir, 'club-photo.jpg');
    const b64 = await coach.evaluate(() => { const c = document.createElement('canvas'); c.width = 1600; c.height = 1200; const g = c.getContext('2d'); g.fillStyle = '#ecd2a2'; g.fillRect(0, 0, 1600, 1200); g.fillStyle = '#d9581a'; g.beginPath(); g.arc(800, 450, 160, 0, 7); g.fill(); g.fillStyle = '#28405a'; g.fillRect(700, 600, 200, 500); return c.toDataURL('image/jpeg', 0.9).split(',')[1]; });
    fs.writeFileSync(photo, Buffer.from(b64, 'base64'));

    console.log('■ コーチ：クラブをつくる');
    await go(coach, 'club');
    await coach.waitForSelector('[data-clform="kid"]');
    await shot(coach, 'welcome');
    ok(await coach.$('[data-tab="club"][aria-current="page"]'), 'タブ「クラブ」');
    await go(coach, 'club/create');
    await coach.fill('[data-clform="create"] [name="name"]', 'さくらミニバス');
    await coach.fill('[data-clform="create"] [name="coach"]', 'たなかコーチ');
    await coach.fill('[data-clform="create"] [name="pass"]', 'sakura-coach-2026');
    await coach.fill('[data-clform="create"] [name="pass2"]', 'sakura-coach-2026');
    await coach.click('[data-clform="create"] button[type="submit"]');
    await coach.waitForSelector('.cl-code b');
    const CODE = (await coach.$eval('.cl-code b', (e) => e.textContent)).trim();
    ok(/^[A-Z2-9]{6}$/.test(CODE), 'クラブができた（コード ' + CODE + '）');
    await shot(coach, 'coach-home');

    console.log('■ コーチ：子どもを登録');
    await go(coach, 'club/members');
    await coach.fill('[data-clform="addkid"] [name="nick"]', 'けんた');
    await coach.selectOption('[data-clform="addkid"] [name="grade"]', 'e56');
    await coach.click('[data-clform="addkid"] button[type="submit"]');
    await coach.waitForSelector('.cl-card');
    const card = await coach.$$eval('.cl-card dd', (ds) => ds.map((d) => d.textContent.trim()));
    ok(card[0] === CODE && card[1] === '1' && /^[0-9]{6}$/.test(card[2]), 'ログインカード（コード・ばんごう・あいことば）', card);
    const PIN = card[2];
    await shot(coach, 'login-card');

    console.log('■ 子ども：ログイン');
    const kid = await newUser('けんた', '10.1.0.2');
    await go(kid, 'club');
    await kid.fill('[data-clform="kid"] [name="code"]', CODE.toLowerCase());
    await kid.fill('[data-clform="kid"] [name="no"]', '1');
    await kid.fill('[data-clform="kid"] [name="pin"]', '111111');
    await kid.click('[data-clform="kid"] button[type="submit"]');
    await kid.waitForTimeout(300);
    ok(await kid.$('[data-clform="kid"]'), 'あいことばが ちがうと 入れない');
    await kid.fill('[data-clform="kid"] [name="pin"]', PIN);
    await kid.click('[data-clform="kid"] button[type="submit"]');
    await kid.waitForSelector('.cl-me');
    ok(/けんた/.test(await kid.$eval('.cl-me', (e) => e.innerText)) && /級なし/.test(await kid.$eval('.cl-me', (e) => e.innerText)), '子どものホーム（級なし）');
    const tasks = await kid.$$eval('.cl-cur a.cl-task', (as) => as.map((a) => a.getAttribute('href')));
    ok(tasks.length === 4, '10級の課題が 4つ', tasks);
    await shot(kid, 'kid-home');
    await shot(kid, 'kid-home-full', true);

    console.log('■ 子ども：課題を写真つきで提出');
    for (let i = 0; i < tasks.length; i++) {
      await go(kid, tasks[i].slice(1));
      await kid.waitForSelector('[data-cl="send"]');
      if (i === 0) {
        await kid.click('[data-cl="cnt"][data-d="1"]');
        ok(/とどいています/.test(await kid.$eval('#cl-met', (e) => e.innerText)), '目標にとどいた表示');
        await shot(kid, 'task');
      }
      const file = await kid.$('#cl-file');
      if (file) {
        await file.setInputFiles(photo);
        await kid.waitForSelector('.cl-preview img');
      }
      if (i === 0) {
        await kid.fill('#cl-note', '左手も がんばる');
        await shot(kid, 'task-photo');
      }
      await kid.click('[data-cl="send"]');
      try { await kid.waitForSelector('.cl-sub .cl-st.wait', { timeout: 8000 }); }
      catch (e) { throw new Error(`提出 ${i + 1}：確認まちに ならない（${await kid.evaluate(() => ((document.querySelector('.toast') || {}).textContent || '') + ' / ' + document.querySelector('main').innerText.slice(0, 300))}）`); }
    }
    ok(true, '4つ 提出した（確認まち）');
    await shot(kid, 'task-sent');

    console.log('■ 子ども：ひろばに投稿');
    await go(kid, 'club/feed');
    await kid.waitForSelector('#cl-post');
    await kid.fill('#cl-post', 'ばか みたいに がんばった'); // 「ばか」だけでは ことわらない（「ばかり」と まぎれるので）
    await kid.click('[data-cl="post"]');
    await kid.waitForTimeout(400);
    await kid.fill('#cl-post', 'あいつ キモい');
    await kid.click('[data-cl="post"]');
    await kid.waitForTimeout(300);
    const t1 = await kid.evaluate(() => (document.querySelector('.toast') || {}).textContent || '');
    ok(/やさしい/.test(t1), '悪口は のせられない（やさしい ことばで）', t1);
    await kid.fill('#cl-post', '左手のドリブルが 30回 つづいた！');
    await kid.click('[data-cl="post"]');
    await kid.waitForFunction(() => [...document.querySelectorAll('.cl-post')].some((p) => /30回 つづいた/.test(p.innerText)) && document.getElementById('cl-file'));
    await (await kid.$('#cl-file')).setInputFiles(photo);
    await kid.waitForSelector('.cl-compose .cl-preview img');
    await kid.fill('#cl-post', 'シュート練習');
    await kid.click('[data-cl="post"]');
    await kid.waitForFunction(() => [...document.querySelectorAll('.cl-post')].some((p) => /シュート練習/.test(p.innerText)));
    const kidFeed = await kid.$$eval('.cl-post', (ps) => ps.map((p) => p.innerText));
    ok(kidFeed.some((t) => /コーチの確認まち/.test(t)), '写真つきは「コーチの確認まち」');
    await shot(kid, 'feed');

    console.log('■ コーチ：確認・合格・認定');
    await go(coach, 'club');
    await coach.waitForSelector('.cl-tiles');
    const tiles = await coach.$$eval('.cl-tile b', (bs) => bs.map((b) => +b.textContent));
    ok(tiles[0] === 4 && tiles[2] === 1 && tiles[3] === 1, 'コーチのホーム：確認まち 4・ひろば 1・子ども 1', tiles);
    await go(coach, 'club/review');
    await coach.waitForSelector('.cl-q');
    await coach.waitForSelector('.cl-q .cl-photo img');
    ok(true, '提出の写真が見える');
    await shot(coach, 'review');
    for (let i = 0; i < 4; i++) {
      await coach.waitForSelector('.cl-q');
      if (i === 0) await coach.click('.cl-q [data-cl="quick"]');
      await coach.click('.cl-q [data-cl="review"][data-s="pass"]');
      await coach.waitForTimeout(250);
    }
    await coach.waitForSelector('.cl-ready');
    ok(/10級/.test(await coach.$eval('.cl-ready', (e) => e.innerText)), '「認定できる級」に 10級');
    await shot(coach, 'ready');
    await coach.fill('.cl-ready input', 'よくがんばったね！');
    await coach.click('.cl-ready [data-cl="grant"]');
    await coach.waitForTimeout(400);
    ok(!(await coach.$('.cl-ready')), '認定した');

    console.log('■ 子ども：お祝い・経験値');
    await go(kid, 'home');
    await go(kid, 'club');
    await kid.waitForSelector('.modal .cl-cert-big', { timeout: 6000 });
    ok(/10級/.test(await kid.$eval('.modal', (e) => e.innerText)) && /よくがんばったね/.test(await kid.$eval('.modal', (e) => e.innerText)), 'お祝い（10級・コーチのひとこと）');
    await shot(kid, 'cert');
    await kid.click('.modal button[data-act="modal-close"]');
    const acts = await kid.evaluate(() => JSON.parse(localStorage.getItem('bc.acts') || '[]'));
    ok(acts.some((a) => a.type === 'kyu' && a.xp === 50) && acts.filter((a) => a.type === 'pass').length === 4, '経験値：級 +50・合格 +10×4', acts.map((a) => a.type));
    ok(/10級/.test(await kid.$eval('.cl-me', (e) => e.innerText)), '自分の級が 10級');
    ok(/9級/.test(await kid.$eval('.cl-next', (e) => e.innerText)), 'つぎの目標は 9級');
    await shot(kid, 'kid-home-10');
    await go(kid, 'log');
    ok(/はじめての級/.test(await kid.$eval('main', (e) => e.innerText)), 'バッジ「はじめての級」');

    console.log('■ ひろば：スタンプ・確認まちを出す');
    await go(kid, 'club/feed');
    await kid.waitForSelector('.cl-post.cert');
    await kid.click('.cl-post.cert [data-cl="react"][data-k="like"]');
    await kid.waitForTimeout(300);
    ok((await kid.$eval('.cl-post.cert [data-k="like"]', (b) => b.getAttribute('aria-pressed'))) === 'true' && /1/.test(await kid.$eval('.cl-post.cert [data-k="like"] b', (b) => b.textContent)), 'スタンプ「いいね」1');
    await shot(kid, 'feed-cert');
    await go(coach, 'club/feed');
    await coach.waitForSelector('[data-cl="mod"][data-s="shown"]');
    await coach.click('[data-cl="mod"][data-s="shown"]');
    await coach.waitForTimeout(400);
    ok(!(await coach.$('[data-cl="mod"][data-s="shown"]')), 'コーチが 写真の投稿を出した');
    await coach.waitForSelector('.cl-post .cl-photo img');
    await shot(coach, 'feed-coach');

    console.log('■ コーチ：級をつくる・せってい・カード');
    await go(coach, 'club/design');
    await coach.waitForSelector('.cl-dlv');
    const before = await coach.$eval('.cl-dlv .cl-count b', (b) => +b.textContent);
    await coach.click('.cl-dlv [data-cl="tnum"][data-d="1"]');
    await coach.click('[data-cl="dsave"]');
    await coach.waitForTimeout(400);
    ok((await coach.$eval('.cl-dlv .cl-count b', (b) => +b.textContent)) === before + 1, '課題の回数を +1 して保存');
    await shot(coach, 'design');
    await go(coach, 'club/settings');
    await coach.click('[name="review_posts"]');
    await coach.click('[data-clform="settings"] button[type="submit"]');
    await coach.waitForTimeout(300);
    await shot(coach, 'settings');
    await go(coach, 'club/cards');
    await coach.waitForSelector('.cl-print .cl-card');
    ok(true, 'ログインカードの印刷ページ');
    await go(kid, 'club');
    await kid.waitForSelector('.cl-me');
    await go(kid, 'home');
    await kid.waitForSelector('.cl-homecard');
    ok(/さくらミニバス/.test(await kid.$eval('.cl-homecard', (e) => e.innerText)), 'ホームにクラブのカード');
    await shot(kid, 'home-card');

    console.log('■ くらい表示');
    const dark = await newUser('けんた', '10.1.0.3', { dark: true });
    await dark.evaluate(() => {});
    await go(dark, 'club');
    await dark.fill('[data-clform="kid"] [name="code"]', CODE);
    await dark.fill('[data-clform="kid"] [name="no"]', '1');
    await dark.fill('[data-clform="kid"] [name="pin"]', PIN);
    await dark.click('[data-clform="kid"] button[type="submit"]');
    await dark.waitForSelector('.cl-me');
    await dark.waitForTimeout(300);
    if (await dark.$('.modal')) await dark.click('.modal button[data-act="modal-close"]');
    await shot(dark, 'dark-home');
    for (const p of [coach, kid, dark]) {
      const ov = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      ok(ov <= 0, '横にはみ出さない');
    }
  } catch (e) {
    fail++;
    console.log('  ✗ とちゅうで止まった：' + e.message.split('\n')[0]);
  } finally {
    ok(!errors.length, 'コンソールのエラーなし', errors.slice(0, 5));
    await browser.close();
    await srv.close();
  }
  console.log(`\n${fail ? '✗' : '✓'} ${pass} 合格・${fail} 不合格`);
  process.exit(fail ? 1 : 0);
})();
