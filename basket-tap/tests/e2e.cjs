// 画面を通した確認（Playwright の Chromium を画面なしで動かし、スマホと同じようにタップする）
//   node basket-tap/tests/e2e.cjs [dev|built]
//     dev   … basket-tap/index.html（js/ と css/ を読む版）
//     built … public/basket-tap/index.html（1ファイル版。公開するもの）
//   SHOTS=フォルダ を付けると、画面の写真（スクリーンショット）をそこに保存する（見た目の確認用）
// 時計は Playwright の clock で進める（「スタートから 10 秒で 2P」などを、待たずに正確に確かめる）。
const fs = require('fs');
const path = require('path');
const { chromium } = require('./pw.cjs');
const { start } = require('./server.cjs');

const MODE = process.argv[2] || 'dev';
const SHOTS = process.env.SHOTS || '';
let pass = 0, fail = 0;
const ok = (c, name, extra) => { if (c) { pass++; console.log('  ok  ', name); } else { fail++; console.log('  FAIL', name, extra !== undefined ? JSON.stringify(extra) : ''); } };
const T0 = new Date('2026-10-19T06:30:00Z');       // 日本時間 15:30
const shot = async (page, name) => { if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: path.join(SHOTS, name + '.png'), animations: 'disabled' }); } };

async function openPage(browser, url, vp, opts) {
  const ctx = await browser.newContext(Object.assign({ viewport: vp, deviceScaleFactor: 2, hasTouch: true, isMobile: vp.width < 900, acceptDownloads: true, locale: 'ja-JP', timezoneId: 'Asia/Tokyo' }, opts || {}));
  // 「共有」は開かない（ダウンロードで確かめる）
  await ctx.addInitScript(() => { try { Object.defineProperty(navigator, 'canShare', { value: () => false, configurable: true }); } catch (e) { /* 無視 */ } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  // 時計は T0 の少し前から入れ、ページを開いたら T0 で止める（あとは runFor で、決めた秒数だけ進める）
  await page.clock.install({ time: new Date(T0.getTime() - 20000) });
  await page.goto(url);
  await page.waitForFunction(() => window.BT && BT.app && document.querySelector('#view').children.length);
  await page.clock.pauseAt(T0);
  return { ctx, page, errors };
}
const game = (page) => page.evaluate(() => JSON.parse(JSON.stringify(BT.app.S.game)));
const plays = (g) => g.events.filter((e) => e.type !== 'period');
const tap = (page, sel) => page.tap(sel);
/* 上の帯の部品が重なっていないか（となりどうし） */
async function barOverlap(page) {
  return page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('.lbar > *')).filter((e) => e.offsetParent !== null);
    const parts = [];
    els.forEach((e) => { if (e.classList.contains('score')) e.querySelectorAll('.sc').forEach((x) => parts.push(x)); else parts.push(e); });
    const bad = [];
    for (let i = 1; i < parts.length; i++) { const a = parts[i - 1].getBoundingClientRect(), b = parts[i].getBoundingClientRect(); if (b.left < a.right - 1) bad.push([parts[i - 1].className, parts[i].className, Math.round(a.right - b.left)]); }
    parts.forEach((e) => { if (e.scrollWidth > e.clientWidth + 1) bad.push(['文字がはみ出す', e.className, e.textContent.trim()]); });
    const last = parts[parts.length - 1].getBoundingClientRect();
    if (last.right > innerWidth + 1) bad.push(['right edge', Math.round(last.right - innerWidth)]);
    return bad;
  });
}
/* ボタンが画面の中に収まっているか（はみ出し・重なりがない） */
async function allVisible(page) {
  return page.evaluate(() => {
    const W = innerWidth, H = innerHeight;
    const bad = [];
    document.querySelectorAll('.act').forEach((b) => {
      const r = b.getBoundingClientRect();
      const team = b.closest('.team').getBoundingClientRect();
      if (r.width < 40 || r.height < 30 || r.left < -1 || r.right > W + 1 || r.top < -1 || r.bottom > H + 1 || r.bottom > team.bottom + 1 || r.right > team.right + 1) bad.push([b.dataset.type, Math.round(r.width), Math.round(r.height), Math.round(r.bottom), Math.round(team.bottom)]);
    });
    return bad;
  });
}

(async () => {
  const root = MODE === 'built' ? path.join(__dirname, '..', '..', 'public', 'basket-tap') : path.join(__dirname, '..');
  if (MODE === 'built' && !fs.existsSync(path.join(root, 'index.html'))) { console.log('public/basket-tap/index.html がありません。先に node basket-tap/build.mjs'); process.exit(1); }
  const srv = await start(0, root);
  const browser = await chromium.launch({ env: Object.assign({}, process.env, { LANG: 'C.UTF-8', LC_ALL: 'C.UTF-8' }) });
  try {
    console.log(`\n■ ${MODE === 'built' ? '1ファイル版（public/basket-tap/index.html）' : '開発版（basket-tap/index.html）'}・スマホ（390×713）`);
    const { ctx, page, errors } = await openPage(browser, srv.url, { width: 390, height: 713 });
    ok(await page.$('#btnNew'), '最初は試合の一覧（「新しい試合を記録する」）');
    await shot(page, 'phone-home');

    console.log('\n■ 試合の準備（チーム名・色・背番号をパッと）');
    await tap(page, '#btnNew');
    await page.fill('#team0 .tname', '致遠館');
    await tap(page, '#team0 [data-preset="4-15"]');        // 名前の欄から、そのまま「4〜15」を押す（1回で効くこと）
    ok(await page.$$eval('#team0 .nb.on', (els) => els.map((e) => e.dataset.no).join(',')) === '4,5,6,7,8,9,10,11,12,13,14,15', '名前を入れて、そのまま「4〜15」：1回のタップで 12 人をまとめて選ぶ');
    ok((await page.textContent('#team0 .tc-head b')).trim() === '致遠館', 'カードの見出しも「致遠館」に');
    await tap(page, '#team0 .nb[data-no="15"]');
    await tap(page, '#team0 .nb[data-no="23"]');
    ok(await page.$$eval('#team0 .nb.on', (els) => els.length) === 12 && await page.$('#team0 .nb[data-no="23"].on') && !(await page.$('#team0 .nb[data-no="15"].on')), '番号をタップして、外す・足す（15 を外して 23 を足す）');
    await page.fill('#team1 .nostext', '4-9, 00');
    await tap(page, '#team1 .sw[data-color="赤"]');          // 文字の欄から、そのまま色を押す
    ok(await page.$$eval('#team1 .nb.on', (els) => els.map((e) => e.dataset.no).join(',')) === '00,4,5,6,7,8,9', '直接入れる：「4-9, 00」');
    ok(await page.$('#team1 .sw.on[data-color="赤"]'), '文字の欄から、そのまま色を選べる（1回のタップで）');
    await page.click('#team0 .names summary');
    const nameInput = page.locator('#team0 .nm').filter({ hasText: '#7' }).locator('input');
    await nameInput.fill('たけし');
    await nameInput.blur();
    await shot(page, 'phone-setup');
    await tap(page, '#btnToLive');
    await page.waitForSelector('.live');
    let g = await game(page);
    ok(g.teams[0].name === '致遠館' && g.teams[1].color === '#d93636' && g.teams[0].players.find((p) => p.no === '7').name === 'たけし', 'チーム名・色・名前が試合に入る');
    ok(await page.$('#btnStartBig') && !(await page.isVisible('#clock')), 'スタート前：大きな「▶ スタート」');
    ok((await allVisible(page)).length === 0, 'プレーのボタンが全部、画面に収まる', await allVisible(page));
    ok((await barOverlap(page)).length === 0, '上の帯（スタート・ピリオド・得点・メニュー）が重ならない', await barOverlap(page));
    await shot(page, 'phone-prestart');
    { const bb = await page.locator('#panel0 .act[data-type="fg2"]').boundingBox(); await page.touchscreen.tap(bb.x + bb.width / 2, bb.y + bb.height / 2); }
    ok(plays(await game(page)).length === 0, 'スタート前にプレーの所を押しても記録しない（大きなスタートの札の下）');

    console.log('\n■ スタート → 記録（どちらの順でも）');
    await tap(page, '#btnStartBig');
    g = await game(page);
    ok(g.startedAt === T0.getTime() && g.events.length === 1 && g.events[0].type === 'period', 'スタートの時刻と「1Q 開始」');
    await page.clock.runFor(10000);
    ok((await page.textContent('#tval')).trim() === '0:10', '左上の時計が進む（0:10）');
    await tap(page, '#panel0 .no[data-no="7"]');
    ok(await page.$('#panel0 .no[data-no="7"].sel'), '番号を押すと、選んだ印');
    await tap(page, '#panel0 .act[data-type="fg2"]');
    g = await game(page);
    let e = plays(g)[0];
    ok(e && e.team === 0 && e.no === '7' && e.type === 'fg2' && e.t === 10, '番号 → プレー：0:10 に #7 の 2P成功', e);
    ok((await page.textContent('#score0')).trim() === '2', '得点が増える（2）');
    ok((await page.textContent('#lastbar')).includes('#7') && (await page.textContent('#lastbar')).includes('2P成功'), '画面の下に、いま記録したものが出る');
    await page.clock.runFor(10000);
    await tap(page, '#panel1 .act[data-type="fg3"]');
    ok(await page.isVisible('#panel1 .ask') && (await page.textContent('#panel1 .asktxt')).includes('3P成功'), 'プレーを先に押すと「だれの『3P成功』？」');
    await page.clock.runFor(3000);
    await tap(page, '#panel1 .no[data-no="00"]');
    g = await game(page);
    e = plays(g)[1];
    ok(e.team === 1 && e.no === '00' && e.type === 'fg3' && e.t === 20, 'プレー → 番号：3 秒後に「00」を押しても、時刻はプレーを押した 0:20', e);
    ok(!(await page.isVisible('#panel1 .ask')), '番号が付いたら「だれの？」は消える');
    await page.clock.runFor(5000);
    await tap(page, '#panel0 .act[data-type="reb"]');
    await page.clock.runFor(8000);
    ok(!(await page.isVisible('#panel0 .ask')), '7 秒たつと「だれの？」は消える');
    g = await game(page);
    ok(plays(g)[2].type === 'reb' && plays(g)[2].no === null && plays(g)[2].t === 28, 'プレーだけ：番号なしのリバウンド（0:28）', plays(g)[2]);
    await tap(page, '#panel0 .act[data-type="pass"]');
    await tap(page, '#panel0 .askx');
    ok(!(await page.isVisible('#panel0 .ask')), '「番号なし」で、すぐに待つのをやめる');
    await tap(page, '#panel0 .act[data-type="fg2x"]');
    await tap(page, '#panel0 .act[data-type="fg2x"]');
    g = await game(page);
    ok(plays(g).filter((x) => x.type === 'fg2x').length === 1, '同じボタンの二度押し（0.45 秒以内）は1回');
    ok((await allVisible(page)).length === 0, '記録中も、ボタンが全部収まる', await allVisible(page));
    ok((await barOverlap(page)).length === 0, '記録中も、上の帯が重ならない', await barOverlap(page));
    await shot(page, 'phone-live');

    console.log('\n■ 取り消す・やり直す');
    const before = plays(await game(page)).length;
    await tap(page, '#btnUndo');
    ok(plays(await game(page)).length === before - 1, '「↶ 取り消す」でいちばん新しい記録を取り消す');
    ok(await page.isVisible('#btnMsgAct') && (await page.textContent('#btnMsgAct')).includes('やり直す'), '画面の下に「やり直す」');
    await tap(page, '#btnMsgAct');
    ok(plays(await game(page)).length === before, '「やり直す」で戻る');

    console.log('\n■ 名簿にない番号を、その場で足す');
    await page.clock.runFor(2000);
    await tap(page, '#panel1 .act[data-type="fg2"]');
    await tap(page, '#panel1 .no.add');
    await page.waitForSelector('.keypad');
    await tap(page, '.key[data-key="2"]');
    await tap(page, '.key[data-key="3"]');
    await page.clock.runFor(9000);          // 打っている間に 7 秒を過ぎても、その記録に付く
    await tap(page, '#btnKeyOk');
    g = await game(page);
    e = plays(g)[plays(g).length - 1];
    ok(g.teams[1].players.some((p) => p.no === '23') && e.no === '23' && e.type === 'fg2', '「＋」で #23 を足して、待っていた記録に付ける', e);
    ok(await page.$('#panel1 .no[data-no="23"]'), '足した番号のボタンが出る');

    console.log('\n■ ピリオド');
    const cur = await page.evaluate(() => BT.elapsed(BT.app.S.game, Date.now()));
    await page.clock.fastForward(Math.round((600 - cur) * 1000));
    await tap(page, '#btnPeriod');
    await tap(page, '#btnNextPeriod');
    g = await game(page);
    const per2 = g.events.find((x) => x.type === 'period' && x.period === 2);
    ok(per2 && Math.abs(per2.t - 600) < 1, '「2Q を始める」で、その時刻（10:00）に 2Q 開始', per2);
    ok((await page.textContent('#btnPeriod')).trim() === '2Q', '時計の横が「2Q」');
    await page.clock.runFor(4000);
    await tap(page, '#panel0 .no[data-no="10"]');
    await tap(page, '#panel0 .act[data-type="fg3"]');
    ok((await page.textContent('#score0')).trim() === '5' && (await page.textContent('#score1')).trim() === '5', '得点 5 − 5');

    console.log('\n■ 記録の一覧で直す');
    await tap(page, '#btnMenu');
    await page.click('.mitem:has-text("記録の一覧")');
    await page.waitForSelector('.loglist');
    ok((await page.$$('.lrow')).length === plays(await game(page)).length + 2, '一覧に、記録とピリオドの始まりが並ぶ');
    await shot(page, 'phone-log');
    const rebId = plays(await game(page)).find((x) => x.type === 'reb').id;
    await page.click(`.lrow[data-id="${rebId}"]`);
    await page.waitForSelector('.edit');
    await page.click('.nopick .btn:has-text("#5")');
    await page.click('.edit .btn:has-text("+1秒")');
    g = await game(page);
    e = g.events.find((x) => x.id === rebId);
    ok(e.no === '5' && e.t === 29, '番号なしのリバウンドに #5 を付け、時刻を +1 秒', e);
    await shot(page, 'phone-edit');
    await page.click('#btnDelEv');
    ok(!(await game(page)).events.some((x) => x.id === rebId), '記録を消す');
    await page.click('.sheet-card header .x');

    console.log('\n■ 集計');
    await tap(page, '#btnMenu');
    await page.click('.mitem:has-text("集計")');
    await page.waitForSelector('.stats');
    const statText = await page.textContent('.stats');
    ok(/たけし/.test(statText) && /1\/1/.test(statText), '集計に #7 たけし（2P 1/1）');
    ok(await page.$$eval('.per tbody tr', (rows) => rows.map((r) => r.textContent.replace(/\s+/g, '')).join('|')).then((t) => t.includes('致遠館') && t.includes('5')), 'ピリオドごとの得点の表');
    await shot(page, 'phone-stats');
    await page.click('.sheet-card header .x');

    console.log('\n■ 書き出す（JSON・CSV）');
    await tap(page, '#btnMenu');
    await page.click('.mitem:has-text("書き出す")');
    let [dl] = await Promise.all([page.waitForEvent('download'), page.click('#btnExpJson')]);
    const jsonText = fs.readFileSync(await dl.path(), 'utf8');
    const ex = JSON.parse(jsonText);
    ok(/^バスケ記録_2026-10-19_1530_致遠館vs相手\.json$/.test(dl.suggestedFilename()), 'ファイル名：バスケ記録_日付_時刻_チーム', dl.suggestedFilename());
    ok(ex.format === 'basket-tap' && ex.startedAt === T0.getTime() && ex.events.filter((x) => x.type !== 'period').length === plays(await game(page)).length && ex.types.pass.label === 'パスミス', 'JSON：形・スタートの時刻・記録・呼び名');
    [dl] = await Promise.all([page.waitForEvent('download'), page.click('#btnExpCsv')]);
    const csvText = fs.readFileSync(await dl.path(), 'utf8');
    ok(csvText.charCodeAt(0) === 0xfeff && csvText.includes('致遠館,7,たけし,2P成功'), 'CSV：Excel 用の BOM と、#7 たけし 2P成功');
    [dl] = await Promise.all([page.waitForEvent('download'), page.click('#btnExpBox')]);
    ok(fs.readFileSync(await dl.path(), 'utf8').includes('得点,2P成功,2P試投'), '集計の CSV');
    await page.click('.sheet-card header .x');

    console.log('\n■ 開き直すと続きから（記録中に画面を閉じても）');
    const n0 = plays(await game(page)).length;
    await page.reload();
    await page.waitForSelector('.live');
    ok(plays(await game(page)).length === n0 && (await page.textContent('#score0')).trim() === '5', '記録・得点がそのまま');
    await page.clock.runFor(1000);
    ok((await page.textContent('#tval')).trim().startsWith('10:'), '時計はスタートから進み続けている', await page.textContent('#tval'));

    console.log('\n■ 試合を終える');
    await tap(page, '#btnMenu');
    await page.click('.mitem:has-text("試合を終える")');
    await page.click('.sheet-foot .btn.primary');
    g = await game(page);
    ok(g.endedAt > g.startedAt, '終えた時刻');
    await page.waitForSelector('.stats');
    await page.click('.sheet-card header .x');
    ok(await page.isVisible('#cover') && (await page.textContent('#cover')).includes('試合終了'), '「試合終了」と得点');
    { const bb = await page.locator('#panel0 .act[data-type="fg2"]').boundingBox(); await page.touchscreen.tap(bb.x + bb.width / 2, bb.y + bb.height / 2); }
    ok(plays(await game(page)).length === n0, '終えたあとは記録しない');
    await page.click('#cover .btn.small');
    ok(!(await game(page)).endedAt && !(await page.isVisible('#cover')), '「続きを記録する」で戻せる');
    ok(errors.length === 0, 'ページのエラーがない', errors.slice(0, 3));

    console.log('\n■ 試合の一覧・次の試合（自分のチームは自動で入る）');
    await tap(page, '#btnMenu');
    await page.click('.mitem:has-text("試合の一覧へ")');
    await page.waitForSelector('#btnNew');
    ok(await page.$('#btnResume'), '「記録中の試合があります」→ 続きを記録する');
    await tap(page, '#btnNew');
    ok((await page.inputValue('#team0 .tname')) === '致遠館' && await page.$$eval('#team0 .nb.on', (els) => els.length) === 12, '自分のチーム（名前・背番号）が最初から入っている');
    ok(await page.$('#team1 .chipbtn:has-text("相手")') === null, '名前のない相手は保存しない');
    await ctx.close();

    // いろいろな画面の大きさで、ボタンが収まるか
    console.log('\n■ 画面の大きさ（背番号 15 人ずつでも、プレーのボタンが全部収まる）');
    for (const vp of [{ width: 375, height: 553, n: 'iPhone SE（Safari）' }, { width: 430, height: 800, n: '大きいスマホ' }, { width: 750, height: 340, n: 'スマホ横向き' }, { width: 667, height: 320, n: 'SE 横向き' }, { width: 820, height: 1100, n: 'iPad 縦' }, { width: 1180, height: 820, n: 'iPad 横' }]) {
      const P = await openPage(browser, srv.url, { width: vp.width, height: vp.height });
      await P.page.evaluate(() => {
        const g2 = BT.newGame({ teams: [{ name: 'A', players: BT.parseNumbers('4-18').map((no) => ({ no })) }, { name: 'B', players: BT.parseNumbers('4-18').map((no) => ({ no })) }] });
        BT.store.saveGame(g2); BT.app.resume(g2.id); BT.app.start();
      });
      await P.page.waitForSelector('.live');
      await P.page.clock.fastForward(3725000);       // 1:02:05（1時間を超えても、時計が帯からはみ出さない）
      await P.page.evaluate(() => { const g3 = BT.app.S.game; BT.addEvent(g3, { t: 3700, type: 'fg3', team: 0, no: '4' }); BT.addEvent(g3, { t: 3701, type: 'fg3', team: 1, no: '4' }); for (let i = 0; i < 33; i++) { BT.addEvent(g3, { t: 3702 + i * 0.1, type: 'fg3', team: 0, no: '5' }); BT.addEvent(g3, { t: 3702 + i * 0.1, type: 'fg3', team: 1, no: '5' }); } BT.app.go('live'); });
      const bo = await barOverlap(P.page);
      ok(bo.length === 0 && /^1:02:0\d$/.test((await P.page.textContent('#tval')).trim()), `${vp.n}：1時間を超えた時計・3けたの得点でも、上の帯が重ならない`, { bo, t: await P.page.textContent('#tval') });
      const bad = await allVisible(P.page);
      const lay = await P.page.evaluate(() => document.querySelector('.live').className);
      ok(bad.length === 0, `${vp.n}（${vp.width}×${vp.height}）：${lay.replace('live ', '')}`, bad);
      await shot(P.page, `size-${vp.width}x${vp.height}`);
      ok(P.errors.length === 0, `${vp.n}：ページのエラーがない`, P.errors.slice(0, 2));
      await P.ctx.close();
    }
  } catch (err) {
    fail++;
    console.log('  FAIL 途中で止まりました:', err && err.stack || err);
  } finally {
    await browser.close();
    await srv.close();
  }
  console.log(`\n${pass} ok / ${fail} fail`);
  process.exit(fail ? 1 : 0);
})();
