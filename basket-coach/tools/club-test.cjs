#!/usr/bin/env node
/* クラブの画面の通しの検査（コーチと子ども、2つのブラウザ）。
   手元の Postgres（club/schema.sql）と検査用サーバー（tools/club-dev-server.cjs）を使い、アプリが Supabase に送る
   /rest/v1/rpc/… を、Playwright で検査用サーバーへ回す（本番の Supabase には さわらない）。
   使い方：NODE_PATH=$(npm root -g) node tools/club-test.cjs [--db=postgres://postgres@127.0.0.1:54434/bgtest] [--no-shots]
   流れ：コーチがクラブをつくる → 子どもを登録（ログインカード）→ 子どもがログイン → 課題を写真つきで提出（4つ）→
        ひろばに投稿（文・写真）→ コーチが確認して合格 → 10級を認定 → 子どもの画面でお祝い・経験値 → スタンプ →
        コーチが写真の投稿を出す → 級の回数を直す → せってい → ログインカード → ホームのカード →
        v2：スキルごとの級（ドリブル10級の認定）→ 自主練（コーチが出す → 子どもが2回きろくしてクリア → コーチの拍手・怒り）→
        ひろばでコーチの いいね → 予定（参加する → コーチが かわりに入れる）→ 体験の申し込み（保護者がリンクから → メンバーにする）
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
if (/supabase\.co/.test(DB)) { console.error('本番には実行できません'); process.exit(2); }
const shots = !process.argv.includes('--no-shots');
const url = 'file://' + path.join(root, 'index.html');

let pass = 0, fail = 0;
const ok = (c, m, x) => { if (c) { pass++; console.log('  ✓ ' + m); } else { fail++; console.log('  ✗ ' + m + (x !== undefined ? '  ' + JSON.stringify(x).slice(0, 200) : '')); } };

(async () => {
  const srv = await start({ port: 54437, db: DB, schema: true });
  await srv.pool.query(`delete from bg_rate where key like 'apply%' or key like 'create:%'`); // 前に流したときの 回数制限を消す（手元の Postgres だけ）
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
    ok(tiles[0] === 4 && tiles[4] === 1 && tiles[5] === 1, 'コーチのホーム：確認まち 4・ひろば 1・子ども 1', tiles);
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

    console.log('■ v2：スキルごとの級');
    await go(kid, 'club');
    await kid.waitForSelector('.cl-tracks');
    const trs = await kid.$$eval('.cl-track', (bs) => bs.map((b) => b.innerText.replace(/\s+/g, ' ').trim()));
    ok(trs.length === 5 && /総合/.test(trs[0]) && trs.some((t) => /ドリブル/.test(t)), '級の種類：総合＋4つ', trs);
    await kid.click('.cl-track:nth-child(2)');
    await kid.waitForFunction(() => /ドリブル 10級/.test((document.querySelector('.cl-next') || {}).innerText || ''));
    const dtasks = await kid.$$eval('.cl-cur a.cl-task', (as) => as.map((a) => a.getAttribute('href')));
    ok(dtasks.length === 2, 'ドリブル10級の課題が 2つ', dtasks);
    await shot(kid, 'kid-tracks');
    for (const href of dtasks) {
      await go(kid, href.slice(1));
      await kid.waitForSelector('[data-cl="send"]');
      ok(/ドリブルの 課題/.test(await kid.$eval('.eyebrow', (e) => e.innerText)), '課題のページに 種類の名前');
      await kid.click('[data-cl="send"]');
      await kid.waitForSelector('.cl-sub .cl-st.wait', { timeout: 8000 });
    }
    await go(coach, 'club/review');
    await coach.waitForSelector('.cl-q');
    ok(/ドリブル/.test(await coach.$eval('.cl-q', (e) => e.innerText)), 'コーチの確認：種類の名前が見える');
    for (let i = 0; i < 2; i++) { await coach.waitForSelector('.cl-q'); await coach.click('.cl-q [data-cl="review"][data-s="pass"]'); await coach.waitForTimeout(250); }
    await coach.waitForSelector('.cl-ready');
    ok(/ドリブル 10級/.test(await coach.$eval('.cl-ready', (e) => e.innerText)), '「ドリブル 10級」を認定できる');
    await coach.click('.cl-ready [data-cl="grant"]');
    await coach.waitForTimeout(400);
    await go(kid, 'home');
    await go(kid, 'club');
    await kid.waitForSelector('.modal .cl-cert-big', { timeout: 6000 });
    ok(/ドリブル 10級/.test(await kid.$eval('.modal', (e) => e.innerText)), 'お祝い：ドリブル 10級');
    await kid.click('.modal button[data-act="modal-close"]');
    ok(/10級/.test(await kid.$eval('.cl-track:nth-child(2)', (e) => e.innerText)), '種類のボタンに ドリブルの級');

    console.log('■ v2：自主練');
    await go(coach, 'club/quest-new');
    await coach.waitForSelector('[data-clform="quest"]');
    await coach.click('[data-cl="qtpl"][data-i="0"]');
    await coach.fill('[data-clform="quest"] [name="times"]', '2');
    await shot(coach, 'quest-form');
    await coach.click('[data-clform="quest"] button[type="submit"]');
    await coach.waitForSelector('.cl-qkid');
    ok(/ドリブル 100回/.test(await coach.$eval('.page-h', (e) => e.innerText)) && /0\/2/.test(await coach.$eval('.cl-qkid', (e) => e.innerText)), 'コーチ：自主練を出した（けんた 0/2）');
    await go(kid, 'club/quests');
    await kid.waitForSelector('.cl-quest');
    ok(/0/.test(await kid.$eval('.cl-quest .cl-quest-n', (e) => e.innerText)) && await kid.$('.cl-tabs [href="#club/quests"] .cl-tdot'), '子ども：自主練（タブに 数）');
    await shot(kid, 'kid-quests');
    await kid.click('.cl-quest');
    await kid.waitForSelector('[data-cl="qlog"]');
    await kid.fill('#cl-note', '右50・左50');
    await shot(kid, 'kid-quest');
    await kid.click('[data-cl="qlog"]');
    await kid.waitForFunction(() => /1/.test((document.querySelector('.cl-qprog > b') || {}).textContent || ''));
    ok(true, '1回目を きろく（1 / 2）');
    await kid.click('[data-cl="qlog"]');
    await kid.waitForSelector('.modal .cl-cert-big.quest', { timeout: 6000 });
    ok(/自主練 クリア/.test(await kid.$eval('.modal', (e) => e.innerText)), '2回目で クリアの お祝い');
    await shot(kid, 'quest-clear');
    await kid.click('.modal button[data-act="modal-close"]');
    const acts2 = await kid.evaluate(() => JSON.parse(localStorage.getItem('bc.acts') || '[]'));
    ok(acts2.filter((a) => a.type === 'qlog').length === 2 && acts2.some((a) => a.type === 'quest' && a.xp === 30), '経験値：きろく +5×2・クリア +30', acts2.map((a) => a.type));
    await go(coach, 'club/quests');
    await coach.waitForSelector('.cl-quest');
    ok(/1\s*\/\s*1/.test(await coach.$eval('.cl-quest .cl-quest-n', (e) => e.innerText.replace(/\s+/g, ' '))), 'コーチの一覧：クリア 1/1');
    await coach.click('.cl-quest');
    await coach.waitForSelector('.cl-qlog');
    await coach.fill('.cl-qlog [data-ccomment]', 'リズムが いいね！');
    await coach.click('.cl-qlog [data-cl="creact"][data-k="clap"]');
    await coach.waitForSelector('.cl-qlog .cl-creact.clap');
    await coach.click('.cl-qlog:nth-of-type(2) [data-cl="creact"][data-k="angry"]').catch(async () => { const b = await coach.$$('.cl-qlog [data-cl="creact"][data-k="angry"]'); await b[1].click(); });
    await coach.waitForFunction(() => document.querySelectorAll('.cl-qlog .cl-creact').length === 2);
    ok(true, 'コーチ：拍手（ひとこと）と 怒りを つけた');
    await shot(coach, 'coach-quest');
    await go(kid, 'club/quests');
    await kid.waitForSelector('.cl-quest');
    await kid.click('.cl-quest');
    await kid.waitForSelector('.cl-creact.clap');
    ok(/リズムが いいね/.test(await kid.$eval('.cl-creact.clap', (e) => e.innerText)) && await kid.$('.cl-creact.angry'), '子ども：コーチの 拍手（ひとこと）と 怒りが見える');

    console.log('■ v2：ひろばで コーチの いいね');
    await go(kid, 'club/feed');
    await kid.waitForFunction(() => [...document.querySelectorAll('.cl-post')].some((p) => /自主練「ドリブル 100回」を クリア/.test(p.innerText)));
    ok(true, 'ひろばに「自主練クリア」');
    await go(coach, 'club/feed');
    await coach.waitForSelector('[data-cl="creact"][data-kind="post"]');
    const qp = await coach.$$('.cl-post');
    let qpId = null;
    for (const el of qp) if (/自主練「ドリブル 100回」/.test(await el.innerText())) qpId = await el.getAttribute('data-post');
    await coach.click(`[data-post="${qpId}"] [data-cl="creact"][data-k="good"]`);
    await coach.waitForSelector(`[data-post="${qpId}"] .cl-creact.good`);
    await go(kid, 'club');
    await kid.waitForSelector('.cl-me');
    await go(kid, 'club/feed');
    await kid.waitForSelector(`[data-post="${qpId}"] .cl-creact.good`);
    ok(true, 'コーチの いいねが 子どもにも見える');
    await shot(kid, 'feed-coach-react');

    console.log('■ これ1つの のびを ひろばに のせる');
    const fid = await kid.evaluate(() => {
      const F = BC.focus;
      let st = F.start(F.empty(), { test: 'f-pound-r', value: 38, goal: 42 }).state;
      const id = st.items[0].id;
      st = F.addTry(st, id, 44).state;
      localStorage.setItem('bc.focus', JSON.stringify(st));
      return id;
    });
    await kid.reload();
    await go(kid, 'focus/' + fid);
    await kid.waitForSelector('.fc-result');
    ok(await kid.$('[data-fc="club"]'), 'クラブに ログインしていると「ひろばに のせる」が 出る');
    await kid.click('[data-fc="club"]');
    await kid.waitForFunction(() => /ひろばに のせたよ/.test((document.querySelector('.toast') || {}).textContent || ''));
    await go(kid, 'club/feed');
    await kid.waitForFunction(() => [...document.querySelectorAll('.cl-post')].some((p) => /ポンドドリブル（右手）」38回 → 44回/.test(p.innerText)));
    ok(true, 'ひろばに「38回 → 44回」が のった');
    await kid.waitForSelector('.cl-compose .chip');
    ok(/ポンドドリブル/.test(await kid.$eval('.cl-compose .chips', (e) => e.innerText)), '書くところの おすすめ（アプリの記録）にも「これ1つ」が 出る');
    await shot(kid, 'feed-focus');

    console.log('■ v2：予定と 参加の申し込み');
    await go(coach, 'club/event-new');
    await coach.waitForSelector('[data-clform="event"]');
    await coach.fill('[data-clform="event"] [name="title"]', '練習試合 vs みなみ');
    await coach.fill('[data-clform="event"] [name="time"]', '9:00〜12:00');
    await coach.fill('[data-clform="event"] [name="place"]', '中央体育館');
    await coach.fill('[data-clform="event"] [name="note"]', 'お弁当・水とう');
    await coach.fill('[data-clform="event"] [name="capacity"]', '10');
    await coach.click('[data-clform="event"] button[type="submit"]');
    await coach.waitForSelector('.cl-egroup');
    ok(/練習試合 vs みなみ/.test(await coach.$eval('main', (e) => e.innerText)), 'コーチ：予定を出した');
    await go(kid, 'club');
    await kid.waitForSelector('.cl-notice.ev');
    ok(true, '子ども：「予定の へんじが まだ」');
    await go(kid, 'club/events');
    await kid.waitForSelector('.cl-event');
    await kid.click('.cl-event [data-cl="answer"][data-a="yes"]');
    await kid.waitForFunction(() => (document.querySelector('.cl-event [data-a="yes"]') || {}).getAttribute && document.querySelector('.cl-event [data-a="yes"]').getAttribute('aria-pressed') === 'true');
    ok(/参加する/.test(await kid.$eval('.cl-event', (e) => e.innerText)), '子ども：「参加する」と答えた');
    await shot(kid, 'kid-events');
    await go(coach, 'club/events');
    await coach.waitForSelector('.cl-event');
    ok(/参加\s*1/.test(await coach.$eval('.cl-ev-count', (e) => e.innerText)), 'コーチの一覧：参加 1');
    await coach.click('.cl-event');
    await coach.waitForSelector('.cl-egroup.yes .cl-entry');
    await coach.click('.cl-egroup.yes [data-cl="eset"][data-a="maybe"]');
    await coach.waitForSelector('.cl-egroup.maybe .cl-entry');
    ok(/コーチが入れた/.test(await coach.$eval('.cl-egroup.maybe', (e) => e.innerText)), 'コーチが かわりに「まだわからない」');
    await shot(coach, 'coach-event');

    console.log('■ v2：体験・入団の申し込み');
    await go(coach, 'club/applies');
    await coach.waitForSelector('[data-clform="applyset"]');
    await coach.check('[data-clform="applyset"] [name="open"]');
    await coach.fill('[data-clform="applyset"] [name="note"]', '土曜 9時〜 中央体育館。体育館シューズを 持ってきてください');
    await coach.click('[data-clform="applyset"] button[type="submit"]');
    await coach.waitForSelector('.cl-url');
    const applyLink = (await coach.$eval('.cl-url', (e) => e.textContent)).trim();
    const ACODE = applyLink.split('#club/apply/')[1];
    ok(/^[A-Z2-9]{8}$/.test(ACODE), '申し込みの リンク（' + ACODE + '）');
    await shot(coach, 'applies-setup');
    // 保護者：アプリを使ったことのない人（プロフィールなし）
    const gctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
    await gctx.route(/https:\/\/[a-z0-9]+\.supabase\.co\/rest\/v1\/rpc\/.*/, async (route) => {
      const req = route.request();
      const r = await fetch(`${srv.url}/rest/v1/rpc/${req.url().split('/rpc/')[1]}`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-test-ip': '10.1.0.9' }, body: req.postData() || '{}' });
      route.fulfill({ status: r.status, contentType: 'application/json', body: await r.text(), headers: { 'access-control-allow-origin': '*' } });
    });
    const guardian = await gctx.newPage();
    guardian.on('pageerror', (e) => errors.push('保護者：' + e.message));
    await guardian.goto(url + '#club/apply/' + ACODE);
    await guardian.waitForSelector('[data-clform="apply"]');
    ok(/さくらミニバス/.test(await guardian.$eval('main', (e) => e.innerText)) && /体育館シューズ/.test(await guardian.$eval('main', (e) => e.innerText)), '保護者：プロフィールなしで 申し込みページが開く（クラブ名・お知らせ）');
    await shot(guardian, 'apply-public');
    await guardian.fill('[data-clform="apply"] [name="child"]', 'さとう はると');
    await guardian.selectOption('[data-clform="apply"] [name="grade"]', 'e34');
    await guardian.fill('[data-clform="apply"] [name="guardian"]', 'さとう');
    await guardian.fill('[data-clform="apply"] [name="contact"]', '090-1234-5678');
    await guardian.fill('[data-clform="apply"] [name="message"]', '土曜の体験に 行きたいです');
    await guardian.check('[data-clform="apply"] [name="agree"]');
    await guardian.click('[data-clform="apply"] button[type="submit"]');
    await guardian.waitForFunction(() => /申し込みました/.test(document.querySelector('main').innerText));
    ok(true, '保護者：申し込んだ');
    const ov2 = await guardian.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    ok(ov2 <= 0, '申し込みページ：横にはみ出さない');
    await go(coach, 'club');
    await coach.waitForSelector('.cl-tiles');
    ok((await coach.$$eval('.cl-tile b', (bs) => +bs[3].textContent)) === 1, 'コーチのホーム：新しい申し込み 1');
    await go(coach, 'club/applies');
    await coach.waitForSelector('.cl-apply');
    ok(/さとう はると/.test(await coach.$eval('.cl-apply', (e) => e.innerText)) && /090-1234-5678/.test(await coach.$eval('.cl-apply', (e) => e.innerText)), 'コーチ：申し込みが とどいた');
    await shot(coach, 'applies');
    await coach.click('.cl-apply [data-cl="amember"]');
    await coach.waitForSelector('[data-clform="addkid"]');
    ok((await coach.$eval('[data-clform="addkid"] [name="nick"]', (e) => e.value)) === 'さとうはると', 'メンバーにする：名前が 入っている');
    await coach.fill('[data-clform="addkid"] [name="nick"]', 'はると');
    await coach.click('[data-clform="addkid"] button[type="submit"]');
    await coach.waitForSelector('.cl-card');
    await go(coach, 'club/applies');
    await coach.waitForSelector('.cl-apply');
    ok(/おわり/.test(await coach.$eval('.cl-apply .cl-st', (e) => e.innerText)), '申し込みは「おわり」に');
    await gctx.close();

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
