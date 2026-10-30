// 水泳の画面を通した確認（Playwright の Chromium を画面なしで動かし、スマホ・iPad と同じようにタップする）
//   node sports-tap/tests/e2e-swim.cjs [dev|built]
//   SHOTS=フォルダ を付けると、画面の写真を保存する（見た目の確認用）
// 時計は Playwright の clock で進める（「スタートから 16.80 秒でタッチ」を、待たずに 0.01 秒まで確かめる）。
const fs = require('fs');
const path = require('path');
// 日本語のファイル名でダウンロードできるように（LANG がない環境では、Chromium が名前を「download」にしてしまう）
if (!process.env.LANG) process.env.LANG = 'C.UTF-8';
const { chromium } = require('./pw.cjs');
const { start } = require('./server.cjs');

const MODE = process.argv[2] || 'dev';
const SHOTS = process.env.SHOTS || '';
let pass = 0, fail = 0;
const ok = (c, name, extra) => { if (c) { pass++; console.log('  ok  ', name); } else { fail++; console.log('  FAIL', name, extra !== undefined ? JSON.stringify(extra) : ''); } };
const section = (t) => console.log('\n■ ' + t);
const T0 = new Date('2026-10-19T06:30:00Z');       // 日本時間 15:30
const shot = async (page, name) => { if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: path.join(SHOTS, name + '.png'), animations: 'disabled' }); } };

async function openPage(browser, url, vp) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 2, hasTouch: true, isMobile: vp.width < 900, acceptDownloads: true, locale: 'ja-JP', timezoneId: 'Asia/Tokyo' });
  await ctx.addInitScript(() => { try { Object.defineProperty(navigator, 'canShare', { value: () => false, configurable: true }); } catch (e) { /* 無視 */ } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.clock.install({ time: new Date(T0.getTime() - 20000) });
  await page.goto(url);
  await page.waitForFunction(() => window.ST && ST.app && document.querySelector('#view').children.length);
  await page.clock.pauseAt(T0);
  return { ctx, page, errors };
}
const game = (page) => page.evaluate(() => JSON.parse(JSON.stringify(ST.app.S.game)));
const touches = (g) => g.events.filter((e) => e.type === 'touch');
const tap = (page, sel) => page.tap(sel);
const lane = (ln) => `.swtouch[data-lane="${ln}"]`;
const rowText = (page, ln) => page.textContent(`.swrow[data-lane="${ln}"] .swstat`);
const last = (page) => page.textContent('#lastbar');
/* 時計を「この記録のスタートから sec 秒」まで進める（いまの時刻からの差だけ。スタート前は T0 から） */
async function at(page, sec) {
  const [now, base] = await page.evaluate(() => [Date.now(), (ST.app.S.game && ST.app.S.game.startedAt) || 0]);
  const want = (base || T0.getTime()) + Math.round(sec * 1000);
  if (want > now) await page.clock.runFor(want - now);
}
/* レーンのボタンが画面に収まっているか（横にはみ出さない・小さすぎない。行がすべらないときは、下にもはみ出さない） */
async function lanesVisible(page, minH) {
  return page.evaluate((minH) => {
    const W = innerWidth, H = innerHeight;
    const box = document.querySelector('.swlanes');
    const scrolls = box.scrollHeight > box.clientHeight + 1;
    const bad = [];
    document.querySelectorAll('.swtouch, .swmore').forEach((b) => {
      const r = b.getBoundingClientRect();
      const big = b.classList.contains('swtouch');
      if (r.left < -1 || r.right > W + 1 || r.height < (big ? minH : 28) || r.width < (big ? 100 : 26)) bad.push(['大きさ', b.className, b.dataset.lane, Math.round(r.width), Math.round(r.height)]);
      if (!scrolls && r.bottom > box.getBoundingClientRect().bottom + 1) bad.push(['下', b.dataset.lane, Math.round(r.bottom)]);
    });
    document.querySelectorAll('.swbig, .swnm').forEach((x) => { if (x.offsetParent && x.scrollWidth > x.clientWidth + 1 && x.classList.contains('swbig')) bad.push(['文字', x.textContent]); });
    document.querySelectorAll('.lbar > *').forEach((x) => { const r = x.getBoundingClientRect(); if (x.offsetParent && r.right > W + 1) bad.push(['上の帯', x.className]); });
    document.querySelectorAll('.gb, #btnUndo').forEach((b) => { const r = b.getBoundingClientRect(); if (b.offsetParent && (r.right > W + 1 || r.bottom > H + 1 || r.height < 36)) bad.push(['下の帯', b.id, Math.round(r.height)]); });
    return { bad, scrolls };
  }, minH);
}
const dl = async (page, sel) => {
  try {
    const [d] = await Promise.all([page.waitForEvent('download', { timeout: 8000 }), tap(page, sel)]);
    const p = await d.path();
    return { name: d.suggestedFilename(), text: fs.readFileSync(p, 'utf8') };
  } catch (e) { ok(false, 'ダウンロード ' + sel, e.message.split('\n')[0]); return { name: '', text: '' }; }
};

(async () => {
  const root = MODE === 'built' ? path.join(__dirname, '..', '..', 'public', 'sports-tap') : path.join(__dirname, '..');
  if (MODE === 'built' && !fs.existsSync(path.join(root, 'index.html'))) { console.log('public/sports-tap/index.html がありません。先に node sports-tap/build.mjs'); process.exit(1); }
  const srv = await start(0, root);
  const browser = await chromium.launch();
  try {
    /* ========== スマホ縦（390×664）：レース ========== */
    section('スマホ縦：準備');
    let { ctx, page, errors } = await openPage(browser, srv.url + '?s=swim', { width: 390, height: 664 });
    ok(/水泳 タップ記録/.test(await page.textContent('.hbar')), '?s=swim で水泳のホーム');
    await tap(page, '#btnNew');
    ok(await page.isVisible('#swSetup') && !/null/.test(await page.textContent('#swSetup')), '準備：レーンと名前の欄（「null」の文字が出ない）');
    await tap(page, '#optsCard [data-opt="lanes"] [data-v="8"]');
    ok((await page.$$('#swSetup .swnrow')).length === 8, 'レーンの数を 8 にすると、名前の欄も 8 つ');
    await tap(page, '#optsCard [data-opt="dist"] [data-v="50"]');
    await tap(page, '#optsCard [data-opt="pool"] [data-v="25"]');
    ok(/タッチの回数：2回/.test(await page.textContent('#swSetup')), '50m ÷ 25m → タッチ 2回');
    await page.fill('.swnrow[data-lane="1"] .swin-name', 'たけし'); await page.dispatchEvent('.swnrow[data-lane="1"] .swin-name', 'change');
    await page.fill('.swnrow[data-lane="1"] .swin-team', '致遠館'); await page.dispatchEvent('.swnrow[data-lane="1"] .swin-team', 'change');
    await page.fill('.swnrow[data-lane="2"] .swin-name', 'はなこ'); await page.dispatchEvent('.swnrow[data-lane="2"] .swin-name', 'change');
    await page.fill('.swnrow[data-lane="3"] .swin-name', 'じろう'); await page.dispatchEvent('.swnrow[data-lane="3"] .swin-name', 'change');
    await shot(page, 'p1-setup');
    await tap(page, '#btnToLive');
    ok(/1組目：自由形 50m（25mプール・タッチ2回）・8レーン/.test(await page.textContent('#cover')), 'スタート前の札に、種目・レーンの数');
    await shot(page, 'p2-before');

    section('スマホ縦：スタート・タッチ（0.01 秒まで）');
    await tap(page, '#btnStartBig');
    let g = await game(page);
    ok(g.startedAt === T0.getTime() && g.events.length === 1 && g.events[0].type === 'heat' && g.events[0].heat === 1 && g.events[0].lanes[0].name === 'たけし', '▶ スタート：1組目の始まり（t=0・名前つき）');
    ok((await page.$$('.swrow')).length === 8, 'レーンの行が 8 つ');
    let v = await lanesVisible(page, 44);
    ok(v.bad.length === 0 && !v.scrolls, '8レーンが1画面に収まる・タッチのボタンが大きい（すべらない）', v);
    await at(page, 16.8); await tap(page, lane(1));
    await at(page, 17.05); await tap(page, lane(2));
    await at(page, 17.6); await tap(page, lane(2));            // 1 秒以内の二度押し
    await at(page, 18.234); await tap(page, lane(3));          // 18.234 秒 → 18.23
    g = await game(page);
    const ts = touches(g);
    ok(ts.length === 3, '1 秒以内の二度押しは1回', ts.map((e) => [e.lane, e.t]));
    ok(ts[0].lane === 1 && ts[0].t === 16.8 && ts[1].t === 17.05 && ts[2].t === 18.23, 'タッチの時刻が 0.01 秒まで合う（16.80・17.05・18.23）', ts.map((e) => e.t));
    ok(/25m 16\.80/.test(await rowText(page, 1)) && /1\/2/.test(await page.textContent(lane(1))) && /ゴール/.test(await page.textContent(lane(1))), 'レーン1：25m 16.80・1/2・次はゴール');
    ok(/1組 18\.23/.test(await last(page)) && /L3 1\/2（ラップ 18\.23）/.test(await last(page)), '下の帯：いま記録したもの（1組 18.23・L3 1/2）', await last(page));
    await at(page, 34.21); await tap(page, lane(1));
    await at(page, 35.9); await tap(page, lane(2));
    ok(/34\.21/.test(await rowText(page, 1)) && /1位/.test(await rowText(page, 1)) && /17\.41/.test(await rowText(page, 1)), 'レーン1：ゴール 34.21・1位・ラップ 17.41');
    ok(/35\.90/.test(await rowText(page, 2)) && /2位/.test(await rowText(page, 2)), 'レーン2：35.90・2位');
    ok(await page.$eval('.swrow[data-lane="1"]', (e) => e.classList.contains('done') && e.classList.contains('first')), 'ゴールした行の見た目（1位）');
    await at(page, 37); await tap(page, lane(1));
    ok(touches(await game(page)).length === 5 && /もうゴールしています/.test(await last(page)), 'ゴールのあとに押しても、数えない（知らせる）');
    await at(page, 39.5);
    ok((await page.textContent('#tval')) === '39.50', '時計はいまの組のスタートからの時間（39.50）', await page.textContent('#tval'));
    await shot(page, 'p3-live');

    section('スマホ縦：レーンのメニュー（棄権）・全員が終わった・取り消す');
    await tap(page, '.swmore[data-lane="3"]');
    await tap(page, '.sheet-card [data-flag="dnf"]');
    g = await game(page);
    ok(g.events.some((e) => e.type === 'dnf' && e.lane === 3 && e.heat === 1), 'レーン3：棄権（組の番号つき）');
    ok(/棄権/.test(await rowText(page, 3)) && !/null/.test(await rowText(page, 3)) && /DNF/.test(await page.textContent(lane(3))), 'レーン3の行に「棄権」（「null」の文字が出ない）');
    ok(await page.isVisible('#swBanner') && /全員が終わりました/.test(await page.textContent('#swBanner')), '名前のあるレーンが全員終わった → 上に「全員が終わりました」');
    ok((await page.textContent('#tval')) === '35.90', '全員が終わったら、時計は最後のゴール（35.90）で止まる', await page.textContent('#tval'));
    v = await lanesVisible(page, 40);
    ok(v.bad.length === 0, '上の帯が出ても、ボタンがはみ出さない', v);
    await tap(page, '#btnUndo');
    ok(!(await game(page)).events.some((e) => e.type === 'dnf') && !(await page.isVisible('#swBanner')), '↶ 取り消す：棄権を取り消す');
    await tap(page, '#btnMsgAct');
    ok((await game(page)).events.some((e) => e.type === 'dnf'), '↷ やり直す');
    // レーン2の最後のタッチを、レーンのメニューから取り消す → 戻す
    await tap(page, '.swmore[data-lane="2"]');
    await tap(page, '#btnUndoLane');
    ok(touches(await game(page)).filter((e) => e.lane === 2).length === 1 && /1\/2/.test(await page.textContent(lane(2))), 'レーンのメニュー：いちばん新しいタッチを取り消す');
    await tap(page, '#btnMsgAct');
    ok(touches(await game(page)).filter((e) => e.lane === 2).length === 2, '戻す');
    await shot(page, 'p4-done');

    section('スマホ縦：次の組（距離を変える・名前を入れかえる）');
    await tap(page, '#btnNextHeat');
    await tap(page, '.sheet-card [data-opt="dist"] [data-v="100"]');
    await tap(page, '#btnClearNames');
    await page.fill('.sheet-card .swnrow[data-lane="1"] .swin-name', 'さぶろう');
    await page.dispatchEvent('.sheet-card .swnrow[data-lane="1"] .swin-name', 'change');
    await shot(page, 'p5-next');
    await tap(page, '#btnNextReady');
    g = await game(page);
    ok(g.pending && g.pending.heat === 2 && g.pending.spec.dist === 100 && g.pending.lanes[0].name === 'さぶろう' && !g.pending.lanes[1].name, '次の組：2組目・100m・名前を入れかえ');
    ok(await page.isVisible('#swWait') && !(await page.isVisible('#swLanes')) && /2組目：自由形 100m/.test(await page.textContent('#swWait')), 'スタートを待つ札（レーンの行のかわり）');
    ok((await page.textContent('#btnHeat')) === '2組目' && /100m/.test(await page.textContent('#swEvent')), '上の帯：2組目・自由形 100m');
    await shot(page, 'p6-wait');
    await at(page, 95.43);
    await tap(page, '#btnHeatStart');
    g = await game(page);
    const h2 = g.events.find((e) => e.type === 'heat' && e.heat === 2);
    ok(h2 && h2.t === 95.43 && h2.dist === 100 && h2.lanes[0].name === 'さぶろう', '▶ 2組目 スタート：スタートからの時刻（95.43）で組の始まり');
    ok((await page.textContent(lane(1))).includes('0/4'), '100m ÷ 25m → タッチ 4回');
    await at(page, 95.43 + 15.2); await tap(page, lane(1));
    await at(page, 95.43 + 31.07); await tap(page, lane(1));
    ok(/50m 31\.07/.test(await rowText(page, 1)) && /15\.87/.test(await rowText(page, 1)), '2組目のタイムは、組のスタートから（50m 31.07・ラップ 15.87）', await rowText(page, 1));
    ok((await page.textContent('#tval')) === '31.07', '時計は2組目のスタートから');
    await tap(page, '#btnUndo');
    // （取り消したあとは、同じ場所が「↷ やり直す」になるので、続けて取り消すのは中から）
    await page.evaluate(() => { ST.app.undo(); ST.app.undo(); });
    ok(await page.isVisible('#swWait'), '組の始まりまで取り消すと、スタート待ちに戻る');
    await tap(page, '#btnMsgAct');
    ok(!(await page.isVisible('#swWait')) && (await game(page)).events.some((e) => e.type === 'heat' && e.heat === 2), 'やり直す：2組目に戻る');
    await page.evaluate(() => { ST.app.redo(); ST.app.redo(); });
    ok(/50m 31\.07/.test(await rowText(page, 1)), 'やり直す：タッチも戻る');
    await at(page, 95.43 + 47.5); await tap(page, lane(1));
    await at(page, 95.43 + 64.99); await tap(page, lane(1));
    ok(/1:04\.99/.test(await rowText(page, 1)) && /1位/.test(await rowText(page, 1)), '2組目：ゴール 1:04.99・1位');

    section('スマホ縦：一覧で直す・集計・書き出す・開き直す');
    await tap(page, '#btnMenu');
    await page.tap('.mitem:has-text("記録の一覧")');
    const rows = await page.$$('.loglist .lrow');
    ok(rows.length === (await game(page)).events.length, '記録の一覧：全部の記録（組の始まりも）');
    ok(/2組 1:04\.99/.test(await page.textContent('.loglist')) && /L1 さぶろう/.test(await page.textContent('.loglist')), '一覧に「2組 1:04.99」「L1 さぶろう」');
    await page.tap('.loglist .lrow:not(.per) >> nth=0');
    ok(await page.isVisible('.sheet-card [data-elane="2"]') && /\+0\.01秒/.test(await page.textContent('.sheet-card')), '直す：レーンを変える・0.01 秒ずつ');
    await page.tap('.sheet-card .btn:has-text("+0.01秒")');
    g = await game(page);
    const lastT = touches(g).slice(-1)[0];
    ok(Math.abs(lastT.t - (95.43 + 65.0)) < 0.001, '0.01 秒あとに直す（1:05.00 に）', lastT.t);
    ok(/1:05\.00/.test(await rowText(page, 1)), '直すと、行のタイムも変わる');
    await page.tap('.sheet-card .btn.primary:has-text("とじる")');
    await tap(page, '#btnMenu');
    await page.tap('.mitem:has-text("集計")');
    await page.waitForTimeout(250);
    const st = await page.textContent('.sheet-card');
    ok(/1組目：自由形 50m/.test(st) && /2組目：自由形 100m/.test(st) && /34\.21/.test(st) && /1:05\.00/.test(st) && /DNF/.test(st), '集計：組ごとの順位・タイム・スプリット（棄権は DNF）');
    await shot(page, 'p7-stats');
    await page.tap('.sheet-foot .btn:has-text("書き出す")');
    const csv = await dl(page, '#btnExp_csv');
    ok(csv.text.charCodeAt(0) === 0xfeff && /スプリット・タイム/.test(csv.text) && /,ゴール,2\/2,34\.21,17\.41/.test(csv.text), '記録の一覧（CSV）：BOM 付き・スプリットとラップ', csv.text.split('\r\n').slice(0, 4));
    ok(/^水泳記録_2026-10-19_1530_.*_一覧\.csv$/.test(csv.name), 'ファイル名：水泳記録_日付_時刻', csv.name);
    await page.clock.runFor(4500);        // （「保存しました」のお知らせが消えるのを待つ。下のボタンに重なるため）
    const box = await dl(page, '#btnExp_box');
    ok(/組の順位,タイム,状態/.test(box.text) && /たけし,致遠館,1,34\.21/.test(box.text) && /棄権（DNF）/.test(box.text), '結果（CSV）：1人1行', box.text.split('\r\n').slice(0, 3));
    await page.clock.runFor(4500);
    const json = await dl(page, '#btnExpJson');
    let jo = null;
    try { jo = JSON.parse(json.text); } catch (e) { jo = null; }
    ok(jo && jo.format === 'sports-tap' && jo.sport === 'swim' && jo.heats.length === 2 && jo.heats[0].results[0].time === 34.21, '記録のファイル（JSON）：組ごとの結果も入る');
    await page.tap('.sheet-card header .x');
    await page.reload();
    await page.waitForFunction(() => window.ST && ST.app && ST.app.S.view === 'live');
    ok((await page.textContent('#btnHeat')) === '2組目' && /1:05\.00/.test(await rowText(page, 1)), '開き直すと、続きから（2組目・タイムもそのまま）');
    await tap(page, '#btnMenu');
    await page.tap('.mitem:has-text("計測を終える")');
    await page.tap('.sheet-foot .btn.primary');
    g = await game(page);
    ok(!!g.endedAt && /計測終了/.test(await page.textContent('#cover')) && /2組/.test(await page.textContent('#cover')), '計測を終える：札に「計測終了」');
    ok(!/null|undefined|NaN/.test(await page.textContent('#view')), '画面に「null」「undefined」「NaN」の文字が出ない');
    ok(errors.length === 0, 'スマホ：ページのエラーなし', errors);
    await ctx.close();

    /* ========== iPad 横（1180×820）：10 レーン・練習（サークル） ========== */
    section('iPad 横：10 レーン');
    ({ ctx, page, errors } = await openPage(browser, srv.url + '?s=swim', { width: 1180, height: 820 }));
    await tap(page, '#btnNew');
    ok(await page.inputValue('.swnrow[data-lane="1"] .swin-name') === '', '別の端末（新しいブラウザ）では、名前は空');
    await tap(page, '#optsCard [data-opt="lanes"] [data-v="10"]');
    await tap(page, '#optsCard [data-opt="stroke"] [data-v="fly"]');
    await tap(page, '#optsCard [data-opt="dist"] [data-v="200"]');
    await tap(page, '#optsCard [data-opt="pool"] [data-v="50"]');
    for (let i = 1; i <= 10; i++) { await page.fill(`.swnrow[data-lane="${i}"] .swin-name`, `選手${i}`); await page.dispatchEvent(`.swnrow[data-lane="${i}"] .swin-name`, 'change'); }
    await tap(page, '#btnToLive');
    await tap(page, '#btnStartBig');
    v = await lanesVisible(page, 50);
    ok(v.bad.length === 0 && !v.scrolls, '10レーンが1画面に収まる・ボタンが大きい（高さ 50px 以上・幅 100px 以上）', v);
    ok(/バタフライ 200m/.test(await page.textContent('#swEvent')) && /タッチ4回/.test(await page.textContent('#swEvent')), '上の帯：バタフライ 200m・50mプール・タッチ4回');
    for (let i = 1; i <= 10; i++) { await at(page, 30 + i * 0.37); await tap(page, lane(i)); }
    ok(touches(await game(page)).length === 10, '10レーン続けて押せる（それぞれ1回）');
    await shot(page, 'i1-live10');
    // 並び：レーン1 を下に
    await tap(page, '#btnMenu');
    await page.tap('.mitem:has-text("設定")');
    await page.tap('[data-swpref="order:desc"]');
    await page.tap('.sheet-card header .x');
    ok((await page.$eval('.swrow', (e) => e.dataset.lane)) === '10', '設定：レーン1 を下に（いちばん上はレーン10）');
    await tap(page, '#btnMenu');
    await page.tap('.mitem:has-text("設定")');
    await page.tap('[data-swpref="order:asc"]');
    await page.tap('[data-swpref="side:left"]');
    await page.tap('.sheet-card header .x');
    const lx = await page.$eval('.swrow[data-lane="1"]', (r) => [r.querySelector('.swtouch').getBoundingClientRect().left, r.querySelector('.swl').getBoundingClientRect().left]);
    ok(lx[0] < lx[1], '設定：タッチのボタンを左側に', lx);
    await tap(page, '#btnMenu');
    await page.tap('.mitem:has-text("設定")');
    await page.tap('[data-swpref="side:right"]');
    await page.tap('.sheet-card header .x');
    await tap(page, '#btnMenu');
    await page.tap('.mitem:has-text("ホームへ")');

    section('iPad 横：練習（サークル）');
    await tap(page, '#btnNew');
    await tap(page, '#optsCard [data-opt="mode"] [data-v="circle"]');
    ok(await page.isVisible('#optsCard [data-opt="reps"]') && await page.isVisible('#optsCard [data-opt="cycle"]') && !(await page.isVisible('#optsCard [data-opt="stroke"]')), '練習：本数・サークル・ずれを選ぶ（泳ぎ方はなし）');
    await tap(page, '#optsCard [data-opt="lanes"] [data-v="3"]');
    await tap(page, '#optsCard [data-opt="dist"] [data-v="50"]');
    await tap(page, '#optsCard [data-opt="reps"] [data-v="4"]');
    await tap(page, '#optsCard [data-opt="cycle"] [data-v="60"]');
    await tap(page, '#optsCard [data-opt="gap"] [data-v="5"]');
    ok(/泳ぐ人（3人・スタートの順）/.test(await page.textContent('#swSetup')), '準備：泳ぐ人（3人）');
    for (const [i, n] of [[1, 'A'], [2, 'B'], [3, 'C']]) { await page.fill(`.swnrow[data-lane="${i}"] .swin-name`, n); await page.dispatchEvent(`.swnrow[data-lane="${i}"] .swin-name`, 'change'); }
    await tap(page, '#btnToLive');
    await tap(page, '#btnStartBig');
    ok((await page.textContent('#btnHeat')) === '1セット目' && /50m×4/.test(await page.textContent('#swEvent')), '上の帯：1セット目・50m×4');
    await at(page, 3); await tap(page, lane(2));
    ok(touches(await game(page)).length === 0 && /まだスタートしていません/.test(await last(page)), 'B（0:05 スタート）が出る前に押しても数えない');
    ok(/スタートまで 0:02/.test(await rowText(page, 2)), 'B：スタートまで 0:02');
    await at(page, 34.5); await tap(page, lane(1));
    await at(page, 40.2); await tap(page, lane(2));
    await at(page, 47.1); await tap(page, lane(3));
    ok(/1本目 34\.50/.test(await rowText(page, 1)) && /1本目 35\.20/.test(await rowText(page, 2)) && /1本目 37\.10/.test(await rowText(page, 3)), '1本目のタイム：A 34.50・B 35.20（0:05 から）・C 37.10（0:10 から）');
    ok(/1\/4本/.test(await page.textContent(lane(1))), 'A：1/4本');
    await at(page, 70);
    ok(/2本目 10\.00/.test(await rowText(page, 1)) && /2本目 5\.00/.test(await rowText(page, 2)), '2本目を泳いでいる時間（A 10.00・B 5.00）', [await rowText(page, 1), await rowText(page, 2)]);
    await at(page, 95.1); await tap(page, lane(1));
    ok(/2本目 35\.10/.test(await rowText(page, 1)) && /平均 34\.80/.test(await rowText(page, 1)), 'A：2本目 35.10・平均 34.80');
    await shot(page, 'i2-circle');
    await tap(page, '#btnMenu');
    await page.tap('.mitem:has-text("集計")');
    await page.waitForTimeout(250);
    const cst = await page.textContent('.sheet-card');
    ok(/1セット目：練習 50m×4/.test(cst) && /34\.50/.test(cst) && /35\.10/.test(cst) && /34\.80/.test(cst), '集計：本ごとのタイム・平均');
    await shot(page, 'i3-circle-stats');
    ok(!/null|undefined|NaN/.test(await page.textContent('#view')), 'iPad：画面に「null」「undefined」「NaN」の文字が出ない');
    ok(errors.length === 0, 'iPad：ページのエラーなし', errors);
    await ctx.close();
  } catch (e) {
    ok(false, '途中で止まった：' + e.message.split('\n')[0]);
    console.log(e.stack);
  } finally {
    await browser.close();
    await srv.close();
  }
  console.log(`\n${pass} ok / ${fail} fail`);
  process.exit(fail ? 1 : 0);
})();
