// 画面を通した確認：場面パック（購入コード・お試し 3 試合）
//   node basket-tap/tests/e2e-license.cjs [dev|built]
//     dev   … basket-tap/index.html（js/ と css/ を読む版）
//     built … public/basket-tap/index.html（1ファイル版）
//   SHOTS=フォルダ を付けると、画面の写真をそこに保存する（明るい・暗い）
// 購入コードの確かめ（btap_code_check）は、tests/cloudstub.cjs の codes で答える。本物のクラウドには送らない。
// 切り出し画面は、開いて（view が trim）、動画を付けるところまでを見る（お試しの試合は、動画を付けたときに数える）。
// テスト用の動画は ffmpeg で作る（10 秒。なければ Chrome で作る）。
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('./pw.cjs');
const { stubCloud } = require('./cloudstub.cjs');
const { start } = require('./server.cjs');

const MODE = process.argv[2] || 'dev';
const SHOTS = process.env.SHOTS || '';
let pass = 0, fail = 0;
const ok = (c, name, extra) => { if (c) { pass++; console.log('  ok  ', name); } else { fail++; console.log('  FAIL', name, extra !== undefined ? JSON.stringify(extra) : ''); } };
const shot = async (page, name) => { if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: path.join(SHOTS, name + '.png'), animations: 'disabled' }); } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const DAY = 86400000;
const WORK = process.env.WORK || path.join(os.tmpdir(), 'basket-tap-e2e');
async function makeVideo(name, sec) {
  const file = path.join(WORK, name);
  if (!fs.existsSync(file)) {
    fs.mkdirSync(WORK, { recursive: true });
    try { execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'testsrc2=size=640x360:rate=30', '-t', String(sec), '-c:v', 'libvpx-vp9', '-b:v', '300k', '-deadline', 'realtime', '-cpu-used', '8', '-pix_fmt', 'yuv420p', file]); }
    catch (e) { await require('./tools/chrome-video.cjs').chromeVideo(chromium, file, sec); }
  }
  return file;
}
let VID = '';

const VP = { width: 390, height: 664 };
async function openPage(browser, url, scheme) {
  const ctx = await browser.newContext({ viewport: VP, deviceScaleFactor: SHOTS ? 2 : 1, hasTouch: true, isMobile: true, acceptDownloads: true, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', colorScheme: scheme || 'light' });
  const cloud = await stubCloud(ctx);
  await ctx.addInitScript(() => { try { Object.defineProperty(navigator, 'canShare', { value: () => false, configurable: true }); } catch (e) { /* 無視 */ } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(url);
  await page.waitForFunction(() => window.BT && BT.app && BT.license && document.querySelector('#view').children.length);
  return { ctx, page, errors, cloud };
}
/* 終えた試合を1つ作って保存（i：日付ちがい）。opts.demo / opts.live */
function seed(page, i, opts) {
  return page.evaluate(([i, opts]) => {
    const T = Date.UTC(2026, 9, 1 + i, 6, 30);
    const g = BT.newGame({ now: T, tz: 540, id: 'g-lic-' + i, teams: [{ name: 'チーム' + i, players: BT.parseNumbers('4-8').map((no) => ({ no, name: '' })) }, { name: '城南' }] });
    g.startedAt = T;
    BT.addEvent(g, { t: 0, type: 'period', period: 1 });
    BT.addEvent(g, { t: 10, type: 'fg2', team: 0, no: '4' });
    BT.addEvent(g, { t: 20, type: 'reb', team: 1, no: null });
    if (!opts.live) g.endedAt = T + 600000;
    if (opts.demo) g.demo = true;
    BT.store.saveGame(g);
    return g.id;
  }, [i, opts || {}]);
}
const hub = (page, id) => page.evaluate((id) => { BT.app.openHub(id); }, id);
const view = (page) => page.evaluate(() => BT.app.S.view);
const ls = (page, k) => page.evaluate((k) => localStorage.getItem(k), k);
const trialN = async (page) => { const v = await ls(page, 'btap:trial'); return v ? JSON.parse(v).length : 0; };
const txt = (page, sel) => page.evaluate((s) => { const e = document.querySelector(s); return e ? e.textContent : null; }, sel);
/* 切り出しを開く：押して、画面が trim になるか。開いたら、動画も付ける（attach === false なら付けない） */
async function tryTrim(page, id, attach) {
  await hub(page, id);
  await page.waitForSelector('#hubTrim');
  await page.tap('#hubTrim');
  await sleep(150);
  const opened = (await view(page)) === 'trim';
  if (opened && attach !== false) {
    const [fc] = await Promise.all([page.waitForEvent('filechooser'), page.tap('#tPick')]);
    await fc.setFiles(VID);
    await page.waitForFunction(() => BT.trim.state && BT.trim.state.vkey);
    await sleep(450);      // 保存（0.2 秒おくれ）のあとで、お試しに数える
  }
  return opened;
}
async function fits(page, sel) {
  await sleep(400);      // 下から出る動きが終わるまで
  return page.evaluate((s) => {
    const c = document.querySelector(s), r = c.getBoundingClientRect();
    const foot = c.querySelector('.sheet-foot'), fr = foot ? foot.getBoundingClientRect() : r;
    return { inside: r.left >= -0.5 && r.right <= innerWidth + 0.5 && r.top >= -0.5 && r.bottom <= innerHeight + 0.5 && fr.bottom <= innerHeight + 0.5, hscroll: document.documentElement.scrollWidth > innerWidth + 1, h: Math.round(r.height) };
  }, sel);
}
async function setLic(page, patch) {
  await page.evaluate((patch) => { const l = JSON.parse(localStorage.getItem('btap:license')); localStorage.setItem('btap:license', JSON.stringify(Object.assign(l, patch))); }, patch);
}

(async () => {
  const root = MODE === 'built' ? path.join(__dirname, '..', '..', 'public', 'basket-tap') : path.join(__dirname, '..');
  if (MODE === 'built' && !fs.existsSync(path.join(root, 'index.html'))) { console.log('public/basket-tap/index.html がありません。先に node basket-tap/build.mjs'); process.exit(1); }
  VID = await makeVideo('rv10.mp4', 10);
  const srv = await start(0, root);
  const browser = await chromium.launch({ args: ['--mute-audio'] });
  try {
    // ---------------------------------------------------------------
    console.log(`\n■ ${MODE === 'built' ? '1ファイル版' : '開発版'}・スイッチが off のまま（はじめの状態）`);
    {
      const { ctx, page, errors, cloud } = await openPage(browser, srv.url);
      ok(await page.evaluate(() => BT.license.mode() === 'off' && !BT.license.enabled()), 'はじめは off');
      const ids = [];
      for (let i = 1; i <= 4; i++) ids.push(await seed(page, i));
      let all = true;
      for (const id of ids) all = (await tryTrim(page, id)) && all;
      ok(all, '4 つのちがう試合で、切り出しが開く');
      await hub(page, ids[0]);
      ok(!(await page.$('#licLine')) && !(await page.$('[class*="lic-"]')), '試合のページに、場面パックの表示はない');
      await page.evaluate(() => BT.app.go('home'));
      await page.tap('#btnSettings');
      await page.waitForSelector('#setCloud');
      ok(!(await page.$('#setLicense')), '設定に場面パックの項目はない');
      ok((await ls(page, 'btap:trial')) === null && (await ls(page, 'btap:license')) === null && (await ls(page, 'btap:licmode')) === null, 'btap:trial・btap:license・btap:licmode は書かれない');
      ok(!cloud.calls.includes('btap_code_check'), '購入コードの通信もしない');
      ok(errors.length === 0, 'off：ページのエラーなし', errors);
      await ctx.close();
    }

    // ---------------------------------------------------------------
    console.log('\n■ ?lic=on で入れる・お試し 3 試合・紙面の表示');
    const { ctx, page, errors, cloud } = await openPage(browser, srv.url + '?lic=on&x=1');
    ok((await ls(page, 'btap:licmode')) === 'on' && await page.evaluate(() => BT.license.enabled()), '?lic=on でオンになり、印が残る');
    ok(await page.evaluate(() => location.search === '?x=1'), 'アドレスから lic=on が消える（ほかの値は残る）', await page.evaluate(() => location.search));
    await page.reload();
    await page.waitForFunction(() => window.BT && BT.license);
    ok(await page.evaluate(() => BT.license.enabled()), '開き直しても、オンのまま');

    const ids = [];
    for (let i = 1; i <= 6; i++) ids.push(await seed(page, i));
    const demoId = await seed(page, 7, { demo: true });
    const liveId = await seed(page, 8, { live: true });

    await hub(page, ids[0]);
    await page.waitForSelector('#licLine');
    ok((await txt(page, '#licLine')).includes('お試し：あと 3 試合'), '1試合目の前：お試し：あと 3 試合', await txt(page, '#licLine'));
    const trimBtn = await page.evaluate(() => { const b = document.querySelector('#hubTrim').getBoundingClientRect(), l = document.querySelector('#licLine').getBoundingClientRect(); return l.top >= b.bottom - 1 && l.right <= innerWidth && l.left >= 0; });
    ok(trimBtn, '状態の一行は、切り出しボタンの下にある');
    await shot(page, 'line-trial');
    ok(await tryTrim(page, ids[0], false) && (await trialN(page)) === 0, '1試合目：切り出しが開く。開いただけ（動画を選ぶ前）では、数えない');
    await hub(page, ids[0]);
    ok((await txt(page, '#licLine')).includes('お試し：あと 3 試合'), '（のぞいただけなら、あと 3 試合のまま）', await txt(page, '#licLine'));
    ok(await tryTrim(page, ids[0]), '動画を付ける');
    ok((await trialN(page)) === 1, '動画を付けたときに、1試合数えた');
    await hub(page, ids[0]);
    ok((await txt(page, '#licLine')).includes('お試し中の試合です'), '数えた試合：「お試し中の試合です」', await txt(page, '#licLine'));
    ok(await tryTrim(page, ids[0]) && (await trialN(page)) === 1, '同じ試合を開き直しても、枠は減らない');
    ok(await tryTrim(page, ids[1]) && (await trialN(page)) === 2, '2試合目：開く・2 件');
    await hub(page, ids[2]);
    ok((await txt(page, '#licLine')).includes('お試し：あと 1 試合'), '3試合目の前：あと 1 試合', await txt(page, '#licLine'));
    ok(await tryTrim(page, ids[2]) && (await trialN(page)) === 3, '3試合目：開く・3 件');
    const trial = JSON.parse(await ls(page, 'btap:trial'));
    ok(trial.length === 3 && trial.every((x) => x.id && x.at > 0 && x.name.includes('vs 城南')), 'btap:trial：id・時刻・名前（日付とチーム名）', trial);

    console.log('\n■ 4 試合目：場面パックの案内（記録・集計・CSV は使える）');
    await hub(page, ids[3]);
    ok((await txt(page, '#licLine')).includes('🔒 場面パックが必要です'), '4試合目のページ：🔒 場面パックが必要です', await txt(page, '#licLine'));
    await shot(page, 'line-locked');
    await page.tap('#hubTrim');
    await page.waitForSelector('.sheet-card.paywall');
    ok((await view(page)) === 'game' && !(await page.$('.trim')), '切り出しは開かず、案内が出る');
    const pw = await txt(page, '.sheet-card.paywall');
    ok(pw.includes('場面パック（クラブで 年 3万円）') && pw.includes('お試しの 3 試合を使いました') && pw.includes('記録・集計・CSV') && pw.includes('ずっと無料'), '案内の文：題・お試しを使いました・無料のもの', pw.slice(0, 120));
    ok((await page.$$eval('.lic-list li', (l) => l.length)) === 3, '入っているものは 3 つ');
    ok((await page.$$eval('#licGames li', (l) => l.map((x) => x.textContent))).length === 3 && (await txt(page, '#licGames')).includes('チーム1'), 'お試しの 3 試合が並ぶ');
    ok(pw.includes('お申し込みは、ご案内した窓口へ') && !(await page.$('#licApply')), '窓口が空のあいだは、ボタンを出さず案内の文だけ');
    ok(!!(await page.$('#licEnter')) && !!(await page.$('#licClose')), '「🔑 購入コードを入れる」と「とじる」');
    let f = await fits(page, '.sheet-card.paywall');
    ok(f.inside && !f.hscroll, `案内の小窓が 390×664 に収まる（高さ ${f.h}）`, f);
    await shot(page, 'paywall-light');
    await page.emulateMedia({ colorScheme: 'dark' });
    await shot(page, 'paywall-dark');
    await page.emulateMedia({ colorScheme: 'light' });
    // CONTACT があるとき
    await page.evaluate(() => { BT.license.CONTACT = 'https://example.com/apply'; BT.license.ui.paywall(BT.app.S.game, () => {}); });
    ok(await page.evaluate(() => { const a = document.querySelector('#licApply'); return !!a && a.href === 'https://example.com/apply' && !document.querySelector('#licApplyNote'); }), 'CONTACT を入れると、申し込みのボタンが出る');
    await page.evaluate(() => { BT.license.CONTACT = ''; });
    await page.tap('#licClose');
    ok(await page.isHidden('#sheet'), '「とじる」で閉じる');

    ok(await page.isVisible('.hubstats'), '集計は見られる');
    const [dl] = await Promise.all([page.waitForEvent('download'), page.tap('#btnExpCsv')]);
    ok(fs.readFileSync(await dl.path(), 'utf8').includes('チーム4'), 'CSV の書き出しは使える');
    const evN = async () => (await page.evaluate(() => BT.app.S.game.events.filter((e) => e.type !== 'period').length));
    await page.evaluate((id) => { BT.app.openHub(id); }, liveId);
    await page.waitForSelector('.live');
    const n0 = await evN();
    await page.tap('#panel0 .prow[data-no="5"] .pb[data-type="fg3"]');
    ok((await evN()) === n0 + 1, '記録（タップ）は使える');
    await page.evaluate(() => BT.app.go('home'));
    ok((await trialN(page)) === 3, 'ここまで、お試しの枠は 3 件のまま');

    console.log('\n■ デモの試合は数えない');
    ok(await tryTrim(page, demoId) && (await trialN(page)) === 3, 'デモの試合：いつも開く・枠は増えない');
    await hub(page, demoId);
    ok(!(await page.$('#licLine')), 'デモの試合のページには、状態の行を出さない');

    console.log('\n■ 購入コードを入れる');
    await hub(page, ids[3]);
    await page.tap('#hubTrim');
    await page.waitForSelector('#licEnter');
    await page.tap('#licEnter');
    await page.waitForSelector('#licCode');
    const fsz = await page.evaluate(() => getComputedStyle(document.querySelector('#licCode')).fontSize);
    ok(fsz === '16px', 'コードの入力欄は 16px（iPhone で拡大されない）', fsz);
    await page.fill('#licCode', '');
    await page.type('#licCode', 'abcdefghjkmn');
    ok((await page.inputValue('#licCode')) === 'ABCD-EFGH-JKMN', '打つと大文字になり、4 文字ずつ「-」が入る', await page.inputValue('#licCode'));
    f = await fits(page, '.sheet-card.lic-sheet');
    ok(f.inside && !f.hscroll, `コードの小窓が 390×664 に収まる（高さ ${f.h}）`, f);
    await shot(page, 'code-light');
    await page.emulateMedia({ colorScheme: 'dark' });
    await shot(page, 'code-dark');
    await page.emulateMedia({ colorScheme: 'light' });
    // 短い・ないコード
    await page.fill('#licCode', 'ABCD');
    await page.dispatchEvent('#licCode', 'input');
    await page.tap('#licCheck');
    await page.waitForFunction(() => document.querySelector('#licMsg').textContent);
    ok((await txt(page, '#licMsg')).includes('コードの形がちがいます') && !cloud.calls.includes('btap_code_check'), '短いコード：形がちがう（通信しない）', await txt(page, '#licMsg'));
    await page.fill('#licCode', 'AAAAAAAAAAAA');
    await page.dispatchEvent('#licCode', 'input');
    await page.tap('#licCheck');
    await page.waitForFunction(() => /見つかりません/.test(document.querySelector('#licMsg').textContent));
    ok(await page.isVisible('#licCode') && (await ls(page, 'btap:license')) === null, 'ないコード：見つかりません・入力欄は残る・保存されない');
    await shot(page, 'code-error');
    cloud.codes.KKKKKKKKKKKK = { club: '期限切れ', expires_at: new Date(Date.now() - DAY).toISOString() };
    cloud.codes.MMMMMMMMMMMM = { club: '止めた', expires_at: new Date(Date.now() + 100 * DAY).toISOString(), revoked: true };
    await page.fill('#licCode', 'KKKKKKKKKKKK'); await page.dispatchEvent('#licCode', 'input'); await page.tap('#licCheck');
    await page.waitForFunction(() => /期限が切れています/.test(document.querySelector('#licMsg').textContent));
    ok((await ls(page, 'btap:license')) === null && !(await page.evaluate(() => BT.license.status().licensed)), '期限切れのコードは、受け付けない');
    await page.fill('#licCode', 'MMMMMMMMMMMM'); await page.dispatchEvent('#licCode', 'input'); await page.tap('#licCheck');
    await page.waitForFunction(() => /使えなくなっています/.test(document.querySelector('#licMsg').textContent));
    ok((await ls(page, 'btap:license')) === null, '止められたコードも、受け付けない');
    // 本物（スタブ）のコード
    const exp = Date.now() + 300 * DAY;
    cloud.codes.ABCDEFGHJKMN = { club: '致遠館クラブ', plan: 'scene', expires_at: new Date(exp).toISOString() };
    await page.fill('#licCode', 'abcd-efgh-jkmn'); await page.dispatchEvent('#licCode', 'input');
    await page.tap('#licCheck');
    await page.waitForFunction(() => Array.from(document.querySelectorAll('.toast')).some((t) => t.textContent.includes('場面パック')), null, { timeout: 5000 });
    const ymd = new Date(exp).toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' });
    const toast = await page.evaluate(() => Array.from(document.querySelectorAll('.toast')).map((t) => t.textContent).find((t) => t.includes('場面パック')) || '');
    ok(toast.includes('場面パックが使えるようになりました') && toast.includes('致遠館クラブ') && toast.includes(ymd + ' まで'), 'お知らせ：クラブ名と期限', toast);
    await page.waitForFunction(() => BT.app.S.view === 'trim');
    ok((await view(page)) === 'trim', '案内から来たので、そのまま切り出しへ進む');
    const lic = JSON.parse(await ls(page, 'btap:license'));
    ok(lic.code === 'ABCDEFGHJKMN' && lic.club === '致遠館クラブ' && lic.plan === 'scene' && Math.abs(lic.expiresAt - exp) < 1000 && lic.checkedAt > 0, 'btap:license：code・club・plan・expiresAt・checkedAt', lic);
    ok((await trialN(page)) === 3, '場面パックで開いた試合は、お試しの枠に入れない');
    ok(await tryTrim(page, ids[4]) && await tryTrim(page, ids[5]), '5・6 試合目も開く');
    await hub(page, ids[4]);
    ok((await txt(page, '#licLine')).includes('致遠館クラブ') && (await txt(page, '#licLine')).includes(ymd), '試合のページ：クラブと期限の一行', await txt(page, '#licLine'));
    await shot(page, 'line-licensed');

    console.log('\n■ 設定');
    await page.evaluate(() => BT.app.go('home'));
    await page.tap('#btnSettings');
    await page.waitForSelector('#setLicense');
    const last = await page.evaluate(() => { const b = document.querySelector('.settings'); return b.lastElementChild.id; });
    ok(last === 'setLicense' || (await page.evaluate(() => document.querySelector('#setLicense').nextElementSibling === document.querySelector('.settings').lastElementChild)), '設定の終わり（最後の注意書きの前）に置く', last);
    const st = await txt(page, '#licStat');
    ok(st.includes('致遠館クラブ') && st.includes(ymd), '設定：クラブと期限', st);
    ok(!!(await page.$('#licSetEnter')) && !!(await page.$('#licSetClear')), '「🔑 購入コードを入れる」「コードを外す」');
    await page.evaluate(() => document.querySelector('#setLicense').scrollIntoView());
    await shot(page, 'settings-light');
    await page.emulateMedia({ colorScheme: 'dark' });
    await shot(page, 'settings-dark');
    await page.emulateMedia({ colorScheme: 'light' });
    // 期限が近い
    await page.evaluate(() => BT.ui.closeSheet(true));
    await setLic(page, { expiresAt: Date.now() + 10 * DAY });
    await page.tap('#btnSettings');
    await page.waitForSelector('#setLicense');
    ok((await txt(page, '#licNote')).includes('あと 10 日で期限です'), '期限が近い：あと 10 日で期限です', await txt(page, '#licNote'));
    await page.evaluate(() => BT.ui.closeSheet(true));

    console.log('\n■ 期限・止められたコード・電波がないとき');
    await setLic(page, { expiresAt: Date.now() - 1000 });
    await hub(page, ids[3]);
    ok((await txt(page, '#licLine')).includes('期限が切れました'), '控えの期限が過ぎた：期限が切れました', await txt(page, '#licLine'));
    await page.tap('#hubTrim');
    await page.waitForSelector('.sheet-card.paywall');
    ok((await view(page)) === 'game' && (await txt(page, '.sheet-card.paywall')).includes('期限が切れました'), '期限が切れると、数えていない試合は開かず、案内に期限切れと出る');
    await page.tap('#licClose');
    ok(await tryTrim(page, ids[0]), '数えた試合は、期限が切れても開く');
    // 電波なし：控えのまま
    await setLic(page, { expiresAt: Date.now() + 200 * DAY, checkedAt: Date.now() - 3 * DAY });
    cloud.down = true;
    await page.evaluate(() => BT.license.refresh());
    ok((await page.evaluate(() => BT.license.status().licensed)) === true, '電波がない（通信が失敗）：控えのコードのまま使える');
    ok(await tryTrim(page, ids[3]), '電波がなくても、数えていない試合が開く');
    cloud.down = false;
    // 止められた
    cloud.codes.ABCDEFGHJKMN.revoked = true;
    await setLic(page, { checkedAt: Date.now() - 3 * DAY });
    await page.evaluate(() => BT.license.refresh());
    const stt = await page.evaluate(() => BT.license.status());
    ok(!stt.licensed && stt.revoked, 'サーバーで止められたコードは、refresh のあとに外れる', stt);
    await hub(page, ids[5]);
    ok((await txt(page, '#licLine')).includes('場面パックが必要です'), '外れたあと：🔒 場面パックが必要です', await txt(page, '#licLine'));
    await page.tap('#hubTrim');
    await page.waitForSelector('.sheet-card.paywall');
    ok((await view(page)) === 'game', '外れたあと：数えていない試合は開かない');
    // コードを外す
    cloud.codes.ABCDEFGHJKMN.revoked = false;
    await page.tap('#licEnter'); await page.fill('#licCode', 'ABCDEFGHJKMN'); await page.dispatchEvent('#licCode', 'input'); await page.tap('#licCheck');
    await page.waitForFunction(() => BT.app.S.view === 'trim');
    ok(await page.evaluate(() => BT.license.status().licensed), '同じコードを入れ直すと、また使える');
    await page.evaluate(() => BT.app.go('home'));
    await page.tap('#btnSettings');
    await page.tap('#licSetClear');
    await page.tap('.sheet-foot .danger-fill');
    await page.waitForSelector('#setLicense');
    ok(!(await page.evaluate(() => BT.license.status().licensed)) && (await ls(page, 'btap:license')) === null, '「コードを外す」で外れる');
    const bad = errors.filter((e) => !/ERR_FAILED/.test(e));      // 通信を止めた確認（cloud.down）で出る分は除く
    ok(bad.length === 0 && errors.length <= 2, 'ページのエラーなし（止めた通信の分だけ除く）', errors);
    await ctx.close();

    // ---------------------------------------------------------------
    console.log('\n■ ?lic=off でもどす');
    {
      const { ctx: c2, page: p2, errors: e2 } = await openPage(browser, srv.url + '?lic=on');
      await p2.goto(srv.url + '?lic=off');
      await p2.waitForFunction(() => window.BT && BT.license);
      ok(!(await p2.evaluate(() => BT.license.enabled())) && (await ls(p2, 'btap:licmode')) === null && (await p2.evaluate(() => location.search)) === '', '?lic=off でオフにもどり、印も URL の値も消える');
      ok(e2.length === 0, 'ページのエラーなし', e2);
      await c2.close();
    }
  } catch (e) {
    fail++;
    console.log('  FAIL 例外', e && e.stack ? e.stack : e);
  } finally {
    await browser.close();
    await srv.close();
  }
  console.log(`\n${pass} ok / ${fail} fail`);
  process.exit(fail ? 1 : 0);
})();
