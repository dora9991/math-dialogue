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
/* ボタンが画面の中に収まっているか（はみ出し・重なりがない・小さすぎない）。
   行が縦にすべるチーム（人数が多くて入りきらないとき）は、横に収まっているかだけを見る */
async function allVisible(page) {
  return page.evaluate(() => {
    const W = innerWidth, H = innerHeight;
    const bad = [];
    document.querySelectorAll('.pb').forEach((b) => {
      const r = b.getBoundingClientRect();
      const team = b.closest('.team').getBoundingClientRect();
      const ro = b.closest('.roster');
      const scrolls = ro.scrollHeight > ro.clientHeight + 1;
      if (r.width < 27 || r.height < 27 || r.left < team.left - 1 || r.right > team.right + 1 || r.right > W + 1) bad.push(['幅', b.closest('.team').id, b.dataset.no, b.dataset.type, Math.round(r.width), Math.round(r.height)]);
      if (!scrolls && (r.bottom > team.bottom + 1 || r.bottom > H + 1)) bad.push(['下', b.closest('.team').id, b.dataset.no, b.dataset.type, Math.round(r.bottom), Math.round(team.bottom)]);
    });
    document.querySelectorAll('.gb, #btnUndo').forEach((b) => {
      const r = b.getBoundingClientRect();
      if (r.width < 40 || r.height < 36 || r.left < -1 || r.right > W + 1 || r.bottom > H + 1) bad.push(['下の帯', b.id, Math.round(r.width), Math.round(r.height), Math.round(r.bottom)]);
    });
    return bad;
  });
}
/* 行が縦にすべるか（チームごと） */
const scrolls = (page) => page.evaluate(() => Array.from(document.querySelectorAll('.roster')).map((r) => r.scrollHeight > r.clientHeight + 1));
/* 選手の行のボタン */
const pb = (tm, no, type) => `#panel${tm} .prow[data-no="${no == null ? '' : no}"] .pb[data-type="${type}"]`;

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
    // （まん中の札のボタンに当たらないよう、いちばん上の行を押す）
    { const bb = await page.locator(pb(0, '4', 'fg2')).boundingBox(); await page.touchscreen.tap(bb.x + bb.width / 2, bb.y + bb.height / 2); }
    await tap(page, '#btnMark');
    ok(plays(await game(page)).length === 0, 'スタート前は記録しない（選手の行は大きなスタートの札の下・★ を押すと「先にスタート」）');
    ok((await page.textContent('#lastbar')).includes('スタート'), '「先に『▶ スタート』を押してください」');

    console.log('\n■ スタート → 選手の行のボタンを1回押して記録');
    await tap(page, '#btnStartBig');
    g = await game(page);
    ok(g.startedAt === T0.getTime() && g.events.length === 1 && g.events[0].type === 'period', 'スタートの時刻と「1Q 開始」');
    ok(await page.$$eval('#panel0 .prow', (els) => els.map((e) => e.dataset.no).join(',')) === '4,5,6,7,8,9,10,11,12,13,14,23,', '自分：背番号の小さい順に上から並び、最後に「？」の行', await page.$$eval('#panel0 .prow', (els) => els.map((e) => e.dataset.no).join(',')));
    ok(await page.$$eval('#panel0 .prow[data-no="7"] .pb', (els) => els.map((e) => e.dataset.type + ':' + e.textContent.trim()).join(',')) === 'fg2:2P,fg3:3P,ft:FT,reb:リバ', '1行に「2P」「3P」「FT」「リバ」（失敗のボタンはない）');
    ok(!(await page.$('.pb[data-type="fg2x"], .pb[data-type="pass"]')), '選手の行に、失敗・パスミスのボタンはない');
    await page.clock.runFor(10000);
    ok((await page.textContent('#tval')).trim() === '0:10', '左上の時計が進む（0:10）');
    await tap(page, pb(0, '7', 'fg2'));
    g = await game(page);
    let e = plays(g)[0];
    ok(e && e.team === 0 && e.no === '7' && e.type === 'fg2' && e.t === 10, '「7」の行の「2P」を1回押す：0:10 に #7 の 2P成功', e);
    ok((await page.textContent('#score0')).trim() === '2', '得点が増える（2）');
    ok((await page.textContent('#lastbar')).includes('#7') && (await page.textContent('#lastbar')).includes('2P成功'), '画面の下に、いま記録したもの（#7 たけし 2P成功）');
    ok((await page.textContent(pb(0, '7', 'fg2') + ' .cnt')).trim() === '1', 'ボタンに回数「1」');
    await page.clock.runFor(10000);
    await tap(page, pb(1, '00', 'fg3'));
    g = await game(page);
    e = plays(g)[1];
    ok(e.team === 1 && e.no === '00' && e.type === 'fg3' && e.t === 20, '相手「00」の行の「3P」：0:20 に #00 の 3P成功（0 と 00 は別）', e);
    await page.clock.runFor(5000);
    await tap(page, pb(0, null, 'reb'));
    g = await game(page);
    ok(plays(g)[2].type === 'reb' && plays(g)[2].team === 0 && plays(g)[2].no === null && plays(g)[2].t === 25, '「？」の行の「リバ」：番号なしのリバウンド（0:25）', plays(g)[2]);

    console.log('\n■ パスミス・★ あとで見る（画面の下・チームも選手も決めない）');
    await page.clock.runFor(2000);
    await tap(page, '#btnPass');
    await page.clock.runFor(1500);
    await tap(page, '#btnMark');
    g = await game(page);
    ok(plays(g)[3].type === 'pass' && plays(g)[3].team === null && plays(g)[3].no === null && plays(g)[3].t === 27, '「パスミス」：0:27 にチームなしのパスミス', plays(g)[3]);
    ok(plays(g)[4].type === 'mark' && plays(g)[4].team === null && plays(g)[4].t === 28.5, '「★ あとで見る」：0:28.5 にチームなし', plays(g)[4]);
    ok((await page.textContent('#btnPass .cnt')).trim() === '1' && (await page.textContent('#lastbar')).includes('チームなし'), 'パスミスの回数・画面の下に「チームなし」');
    ok((await page.textContent('#score0')).trim() === '2' && (await page.textContent('#score1')).trim() === '3', '得点は変わらない');
    await tap(page, pb(0, '9', 'ft'));
    await tap(page, pb(0, '9', 'ft'));
    g = await game(page);
    ok(plays(g).filter((x) => x.type === 'ft').length === 1, '同じボタンの二度押し（0.45 秒以内）は1回');
    await page.clock.runFor(1000);
    await tap(page, pb(0, '9', 'ft'));
    g = await game(page);
    ok(plays(g).filter((x) => x.type === 'ft' && x.no === '9').length === 2 && (await page.textContent(pb(0, '9', 'ft') + ' .cnt')).trim() === '2', '1 秒あけて押せば、もう1本（フリースロー 2 本目）・回数「2」');
    ok((await allVisible(page)).length === 0, '記録中も、ボタンが全部収まる', await allVisible(page));
    ok((await barOverlap(page)).length === 0, '記録中も、上の帯が重ならない', await barOverlap(page));
    await shot(page, 'phone-live');

    console.log('\n■ 取り消す・やり直す');
    const before = plays(await game(page)).length;
    await tap(page, '#btnUndo');
    ok(plays(await game(page)).length === before - 1, '「↶ 取り消す」でいちばん新しい記録を取り消す');
    ok((await page.textContent(pb(0, '9', 'ft') + ' .cnt')).trim() === '1', 'ボタンの回数も戻る（2 → 1）');
    ok(await page.isVisible('#btnMsgAct') && (await page.textContent('#btnMsgAct')).includes('やり直す'), '画面の下に「やり直す」');
    await tap(page, '#btnMsgAct');
    ok(plays(await game(page)).length === before, '「やり直す」で戻る');

    console.log('\n■ 名簿にない番号を、その場で足す');
    await tap(page, '#panel1 .tadd');
    await page.waitForSelector('.keypad');
    await tap(page, '.key[data-key="2"]');
    await tap(page, '.key[data-key="3"]');
    await tap(page, '#btnKeyOk');
    g = await game(page);
    ok(g.teams[1].players.some((p) => p.no === '23'), '「＋番号」で相手に #23 を足す');
    ok(await page.$$eval('#panel1 .prow', (els) => els.map((e) => e.dataset.no).join(',')) === '00,4,5,6,7,8,9,23,', '足した番号の行が、番号の順のところに入る');
    await page.clock.runFor(2000);
    await tap(page, pb(1, '23', 'fg2'));
    e = plays(await game(page)).slice(-1)[0];
    ok(e.team === 1 && e.no === '23' && e.type === 'fg2', '足した行のボタンで、すぐに記録できる', e);

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
    await tap(page, pb(0, '10', 'fg3'));
    ok((await page.textContent('#score0')).trim() === '7' && (await page.textContent('#score1')).trim() === '5', '得点 7 − 5（2P・FT 2 本・3P と、3P・2P）');

    console.log('\n■ 記録の一覧で直す');
    await tap(page, '#btnMenu');
    await page.click('.mitem:has-text("記録の一覧")');
    await page.waitForSelector('.loglist');
    ok((await page.$$('.lrow')).length === plays(await game(page)).length + 2, '一覧に、記録とピリオドの始まりが並ぶ');
    await shot(page, 'phone-log');
    ok(await page.$('.tabsrow .btn:has-text("チームなし")'), '「チームなし」のタブ（パスミス・★）');
    const rebId = plays(await game(page)).find((x) => x.type === 'reb').id;
    await page.click(`.lrow[data-id="${rebId}"]`);
    await page.waitForSelector('.edit');
    await page.click('.nopick .btn:has-text("#5")');
    await page.click('.edit .btn:has-text("+1秒")');
    g = await game(page);
    e = g.events.find((x) => x.id === rebId);
    ok(e.no === '5' && e.t === 26, '番号なしのリバウンドに #5 を付け、時刻を +1 秒', e);
    ok(await page.$$eval('.typepick .btn', (els) => els.map((b) => b.dataset.etype).join(',')) === 'fg2,fg3,ft,reb,pass,mark', '直せるプレーは、画面のボタンと同じ種類');
    await page.click('#btnDelEv');
    ok(!(await game(page)).events.some((x) => x.id === rebId), '記録を消す');
    const passId = plays(await game(page)).find((x) => x.type === 'pass').id;
    await page.click(`.lrow[data-id="${passId}"]`);
    await page.waitForSelector('.edit');
    ok(await page.$('[data-eteam="none"].on') && !(await page.$('.nopick')), 'チームなしのパスミス：「チームなし」が選ばれ、背番号の欄はない');
    await page.click('[data-eteam="0"]');
    await page.click('.nopick .btn:has-text("#8")');
    e = (await game(page)).events.find((x) => x.id === passId);
    ok(e.team === 0 && e.no === '8', 'あとから、チーム（自分）と #8 を付けられる', e);
    await shot(page, 'phone-edit');
    await page.click('.sheet-card header .x');

    console.log('\n■ 集計');
    await tap(page, '#btnMenu');
    await page.click('.mitem:has-text("集計")');
    await page.waitForSelector('.stats');
    const statText = await page.textContent('.stats');
    const row7 = await page.$$eval('.teamstat', (secs) => { const tr = Array.from(secs[0].querySelectorAll('tbody tr')).find((r) => r.querySelector('td.no') && r.querySelector('td.no').textContent === '7'); return tr ? Array.from(tr.children).map((td) => td.textContent) : null; });
    ok(row7 && row7[1] === 'たけし' && row7[2] === '2' && row7[3] === '1', '集計に #7 たけし（得点 2・2P 1 本）', row7);
    ok(!/1\/1/.test(statText) && !/成功率/.test(statText), '失敗のボタンがないので「成功/打った数」「成功率」は出さない（入れた本数だけ）');
    ok(/チームなし/.test(statText) && /★ あとで見る 1/.test(statText), '集計に「チームなし：★ あとで見る 1」');
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
    ok(ex.events.find((x) => x.type === 'mark').team === null, 'JSON：チームなしの記録は team: null');
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
    ok(plays(await game(page)).length === n0 && (await page.textContent('#score0')).trim() === '7' && (await page.textContent(pb(0, '9', 'ft') + ' .cnt')).trim() === '2', '記録・得点・ボタンの回数がそのまま');
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
    { const bb = await page.locator(pb(0, '4', 'fg2')).boundingBox(); await page.touchscreen.tap(bb.x + bb.width / 2, bb.y + bb.height / 2); }
    await tap(page, '#btnPass');
    ok(plays(await game(page)).length === n0, '終えたあとは記録しない（選手の行・パスミスとも）');
    await page.click('#cover .btn.small');
    ok(!(await game(page)).endedAt && !(await page.isVisible('#cover')), '「続きを記録する」で戻せる');
    ok(errors.length === 0, 'ページのエラーがない', errors.slice(0, 3));

    console.log('\n■ 設定（「？」の行・名前）');
    await tap(page, '#btnMenu');
    await page.click('.mitem:has-text("設定")');
    await page.click('input[data-pref="unknown"]');
    ok(!(await page.$('#panel0 .prow.unk')) && await page.$$eval('#panel0 .prow', (els) => els.length) === 12, '「？」の行を出さない（背番号の行だけ）');
    await page.click('input[data-pref="unknown"]');
    ok(await page.$('#panel0 .prow.unk') && await page.$('#panel1 .prow.unk'), 'もう一度チェックすると「？」の行が戻る');
    await page.click('.sheet-card header .x');
    ok(errors.length === 0, 'ページのエラーがない（設定のあと）', errors.slice(0, 3));

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
    console.log('\n■ 画面の大きさ（背番号 15 人ずつ・「？」の行つき）');
    // scroll：行を縦にすべらせてよいか（高さの足りない画面だけ。ふつうのスマホ・iPad は全員が1画面に入る）
    for (const vp of [{ width: 390, height: 664, n: 'ふつうのスマホ（Safari）' }, { width: 375, height: 553, n: 'iPhone SE（Safari）', scroll: true }, { width: 430, height: 800, n: '大きいスマホ' }, { width: 750, height: 340, n: 'スマホ横向き', scroll: true }, { width: 667, height: 320, n: 'SE 横向き', scroll: true }, { width: 820, height: 1100, n: 'iPad 縦' }, { width: 1180, height: 820, n: 'iPad 横' }]) {
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
      const info = await P.page.evaluate(() => { const b = document.querySelector('.pb').getBoundingClientRect(); return { lay: document.querySelector('.live').className.replace('live ', ''), c: BT.app.S.L.plan.teams.map((t) => t.c).join('・'), w: Math.round(b.width), h: Math.round(b.height) }; });
      const sc = await scrolls(P.page);
      ok(bad.length === 0, `${vp.n}（${vp.width}×${vp.height}）：${info.lay}・${info.c} 列・ボタン ${info.w}×${info.h}`, bad);
      ok(vp.scroll || !sc.some(Boolean), `${vp.n}：${vp.scroll ? '入りきらない分は、行を縦にすべらせる' : '全員が1画面に入る（すべらせない）'}`, sc);
      if (vp.scroll && sc.some(Boolean)) {
        // すべらせて、いちばん下の「？」の行も押せる
        await P.page.evaluate(() => document.querySelectorAll('.roster').forEach((r) => { r.scrollTop = r.scrollHeight; }));
        const n0 = (await game(P.page)).events.length;
        await P.page.tap(pb(1, null, 'reb'));
        ok((await game(P.page)).events.length === n0 + 1, `${vp.n}：すべらせた先の「？」の行も押せる`);
      }
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
