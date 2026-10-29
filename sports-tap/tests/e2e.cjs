// 画面を通した確認（Playwright の Chromium を画面なしで動かし、スマホと同じようにタップする）
//   node sports-tap/tests/e2e.cjs [dev|built]
//     dev   … sports-tap/index.html（js/ と css/ を読む版）
//     built … public/sports-tap/index.html（1ファイル版。公開するもの）
//   SHOTS=フォルダ を付けると、画面の写真（スクリーンショット）をそこに保存する（見た目の確認用）
// 骨組み（種目を選ぶ・準備・記録・取り消し・一覧で直す・集計・書き出し・読み込み・開き直し）と、
// チームの行で記録する種目（サッカー・フットサル・ハンドボール・ラグビー）を確かめる。ほかの種目は e2e-volley.cjs など。
// 時計は Playwright の clock で進める（「スタートから 10 秒でゴール」などを、待たずに正確に確かめる）。
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

async function openPage(browser, url, vp, opts) {
  const ctx = await browser.newContext(Object.assign({ viewport: vp, deviceScaleFactor: 2, hasTouch: true, isMobile: vp.width < 900, acceptDownloads: true, locale: 'ja-JP', timezoneId: 'Asia/Tokyo' }, opts || {}));
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
const plays = (g) => g.events.filter((e) => e.type !== 'period' && e.type !== 'pend');
const tap = (page, sel) => page.tap(sel);
const pb = (tm, no, type) => `#panel${tm} .prow[data-no="${no == null ? '' : no}"]:not(.trow) .pb[data-type="${type}"]`;
const tb = (tm, type) => `#panel${tm} .trow .pb[data-type="${type}"]`;
/* 上の帯の部品が重なっていないか */
async function barOverlap(page) {
  return page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('.lbar > *')).filter((e) => e.offsetParent !== null);
    const parts = [];
    els.forEach((e) => { if (e.classList.contains('score')) e.querySelectorAll('.sc, .sosc').forEach((x) => { if (x.offsetParent !== null) parts.push(x); }); else parts.push(e); });
    const bad = [];
    for (let i = 1; i < parts.length; i++) { const a = parts[i - 1].getBoundingClientRect(), b = parts[i].getBoundingClientRect(); if (b.left < a.right - 1) bad.push([parts[i - 1].className, parts[i].className, Math.round(a.right - b.left)]); }
    parts.forEach((e) => { if (e.scrollWidth > e.clientWidth + 1) bad.push(['文字がはみ出す', e.className, e.textContent.trim()]); });
    const last = parts[parts.length - 1].getBoundingClientRect();
    if (last.right > innerWidth + 1) bad.push(['right edge', Math.round(last.right - innerWidth)]);
    return bad;
  });
}
/* ボタンが画面の中に収まっているか（はみ出し・小さすぎない・文字がはみ出さない）。行が縦にすべるチームは、横だけを見る */
async function allVisible(page) {
  return page.evaluate(() => {
    const W = innerWidth, H = innerHeight;
    const bad = [];
    document.querySelectorAll('.pb').forEach((b) => {
      const r = b.getBoundingClientRect();
      const team = b.closest('.team').getBoundingClientRect();
      const ro = b.closest('.roster');
      const scrolls = ro.scrollHeight > ro.clientHeight + 1;
      const minW = b.classList.contains('miss') ? 24 : 28;        // 失敗の「×」は少し細い（スマホでボタンを全部出したとき）
      if (r.width < minW || r.height < 28 || r.left < team.left - 1 || r.right > team.right + 1 || r.right > W + 1) bad.push(['幅', b.closest('.team').id, b.dataset.no, b.dataset.type, Math.round(r.width), Math.round(r.height)]);
      if (!scrolls && (r.bottom > team.bottom + 1 || r.bottom > H + 1)) bad.push(['下', b.closest('.team').id, b.dataset.no, b.dataset.type, Math.round(r.bottom), Math.round(team.bottom)]);
      // 文字がボタンの幅に入っているか（b は inline なので、文字の大きさを測るために一時的に inline-block にする）
      const lab = Array.from(b.querySelectorAll('b')).find((x) => getComputedStyle(x).display !== 'none');
      if (lab) {
        const old = lab.style.cssText;
        lab.style.overflow = 'visible'; lab.style.display = 'inline-block';
        const lw = lab.getBoundingClientRect().width;
        lab.style.cssText = old;
        if (lw > r.width - 2) bad.push(['文字', b.closest('.team').id, b.dataset.no, b.dataset.type, lab.textContent, Math.round(lw), Math.round(r.width)]);
      }
    });
    document.querySelectorAll('.gb, #btnUndo').forEach((b) => {
      const r = b.getBoundingClientRect();
      if (r.width < 40 || r.height < 36 || r.left < -1 || r.right > W + 1 || r.bottom > H + 1) bad.push(['下の帯', b.id, Math.round(r.width), Math.round(r.height), Math.round(r.bottom)]);
    });
    return bad;
  });
}
const scrolls = (page) => page.evaluate(() => Array.from(document.querySelectorAll('.roster')).map((r) => r.scrollHeight > r.clientHeight + 1));
/* 準備の画面：自分のチームの名前・背番号（まとめて）・相手 */
async function setupTeams(page, mine, preset, opp, oppPreset) {
  await page.fill('#team0 .tname', mine);
  await page.dispatchEvent('#team0 .tname', 'change');
  if (preset) await tap(page, `#team0 [data-preset="${preset}"]`);
  if (opp) { await page.fill('#team1 .tname', opp); await page.dispatchEvent('#team1 .tname', 'change'); }
  if (oppPreset) await tap(page, `#team1 [data-preset="${oppPreset}"]`);
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
  const PHONE = { width: 390, height: 664 };
  try {
    /* ========== 種目を選ぶ → サッカー ========== */
    section('種目を選ぶ・サッカーの準備');
    let { ctx, page, errors } = await openPage(browser, srv.url, PHONE);
    const sports = await page.$$eval('#sportGrid [data-sport]', (els) => els.map((e) => e.dataset.sport));
    ok(sports.length >= 4 && sports[0] === 'soccer' && sports.includes('rugby'), '種目を選ぶ画面に、種目が並ぶ（サッカーが最初）', sports);
    ok(await page.$('#sportGrid a.basket[href="../basket-tap/"]') != null, 'バスケは「バスケ タップ記録」へのリンク');
    await shot(page, '01-picker');
    await tap(page, '[data-sport="soccer"]');
    ok(page.url().includes('s=soccer') && (await page.title()) === 'サッカー タップ記録', '種目を選ぶと、URL に ?s=soccer・題名もサッカーに');
    await tap(page, '#btnNew');
    ok(await page.$('#optsCard [data-opt="len"] .btn.on[data-v="40"]') != null, '試合の形式：前半・後半 40 分が選ばれている');
    await tap(page, '#optsCard [data-opt="len"] [data-v="30"]');
    await setupTeams(page, '致遠館', '1-11');
    ok((await page.$$('#team0 .nb.on')).length === 11, '「1〜11」で 11 人');
    await shot(page, '02-setup');
    await tap(page, '#btnToLive');
    let g = await game(page);
    ok(g.sport === 'soccer' && g.opts.len === 30 && g.teams[0].players.length === 11 && !g.startedAt, '記録の画面へ：種目・30 分・名簿');
    ok(await page.isVisible('#btnStartBig'), 'スタート前は大きな「▶ スタート」');
    await shot(page, '03-before');

    section('サッカー：記録する');
    await tap(page, '#btnStartBig');
    g = await game(page);
    ok(g.startedAt === T0.getTime() && g.events.length === 1 && g.events[0].type === 'period' && g.events[0].period === 1, 'スタート：前半 開始（t=0）');
    await page.clock.runFor(10000);
    await tap(page, pb(0, '10', 'goal'));
    await page.clock.runFor(5000);
    await tap(page, pb(1, null, 'shot'));
    await page.clock.runFor(2000);
    await tap(page, tb(0, 'ck'));
    await tap(page, tb(0, 'ck'));                      // 二度押し（0.45 秒以内）は1回に
    await page.clock.runFor(1000);
    await tap(page, '#btn_mark');
    g = await game(page);
    const ps = plays(g);
    ok(ps.length === 4, '4件の記録（CK の二度押しは1回）', ps.map((e) => e.type));
    ok(ps[0].type === 'goal' && ps[0].team === 0 && ps[0].no === '10' && ps[0].t === 10, '#10 のゴール：10.0 秒', ps[0]);
    ok(ps[1].type === 'shot' && ps[1].team === 1 && ps[1].no === null && ps[1].t === 15, '相手（チームの行）のシュート：15.0 秒', ps[1]);
    ok(ps[2].type === 'ck' && ps[2].team === 0 && ps[2].no === null, 'チームの行の CK：番号なし');
    ok(ps[3].type === 'mark' && ps[3].team === null, '★ あとで見る：チームなし');
    ok((await page.textContent('#score0')) === '1' && (await page.textContent('#score1')) === '0', '上の帯の得点 1−0');
    ok((await page.textContent(pb(0, '10', 'goal') + ' .cnt')) === '1', 'ボタンの回数');
    ok((await page.textContent('#tval')) === '0:18', '時計：前半が始まってからの時間 0:18');
    ok(/0:10/.test(await page.textContent('#lastbar')) === false && /★/.test(await page.textContent('#lastbar')), '下の帯に、いま記録したもの');
    ok((await barOverlap(page)).length === 0, '上の帯が重ならない', await barOverlap(page));
    ok((await allVisible(page)).length === 0, 'ボタンが画面に収まる・文字がはみ出さない', await allVisible(page));
    await shot(page, '04-live');

    section('取り消す・やり直す');
    await tap(page, '#btnUndo');
    g = await game(page);
    ok(plays(g).length === 3 && (await page.isVisible('#btnMsgAct')), '取り消す：★ が消え、「やり直す」');
    await tap(page, '#btnMsgAct');
    ok(plays(await game(page)).length === 4, 'やり直す：戻る');
    await tap(page, '#btnUndo');
    await tap(page, '#btnUndo');
    ok(plays(await game(page)).length === 2, '「取り消す」を続けて2回押すと、2つ取り消せる（「取り消す」はいつも同じ場所）');
    await tap(page, '#btnMsgAct');
    await tap(page, '#btnMsgAct');
    ok(plays(await game(page)).length === 4, '「やり直す」2回で、2つとも戻る');

    section('ピリオド：前半を終える・後半・アディショナルタイム');
    await page.clock.runFor((30 * 60 - 18 + 83) * 1000);       // 前半 30 分を 1:23 過ぎた
    ok((await page.textContent('#tval')) === '30+1:23' && (await page.$('#clock.over')) != null, '時計：30 分を過ぎると「30+1:23」');
    await tap(page, '#btnPeriod');
    await tap(page, '#btnEndPeriod');
    ok((await page.textContent('#btnPeriod')) === 'HT' && (await page.$('#clock.paused')) != null, '前半を終える：「HT」・時計は止まって見える');
    await page.clock.runFor(600 * 1000);
    ok((await page.textContent('#tval')) === '30+1:23', 'ハーフタイムの間、時計は進まない');
    await tap(page, '#btnPeriod');
    await tap(page, '#btnNextPeriod');
    await page.clock.runFor(65 * 1000);
    ok((await page.textContent('#btnPeriod')) === '後半' && (await page.textContent('#tval')) === '1:05', '後半を始める：後半 1:05');
    await tap(page, pb(1, null, 'goal'));
    g = await game(page);
    let last = g.events[g.events.length - 1];
    ok(last.type === 'goal' && last.team === 1, '相手のゴール');
    ok(/後半 1:05/.test(await page.textContent('#lastbar')), '下の帯の時刻は「後半 1:05」');

    section('PK戦');
    await tap(page, '#btnPeriod');
    await tap(page, '#btnShootout');
    ok(await page.$(pb(0, '10', 'sog')) != null && await page.$(pb(0, '10', 'goal')) == null && await page.$(tb(0, 'ck')) == null, 'PK戦：選手の行が「成功」「×」に・チームの行はなし');
    await tap(page, pb(0, '10', 'sog'));
    await page.clock.runFor(30000);
    await tap(page, pb(1, null, 'sox'));
    ok((await page.textContent('#soScore')) === 'PK 1−0' && (await page.textContent('#score0')) === '1', '上の帯に「PK 1−0」（試合の得点は変わらない）');
    await shot(page, '05-pk');

    section('記録の一覧で直す');
    await tap(page, '#btnMenu');
    await page.tap('.mitem:has-text("記録の一覧")');
    const goalId = (await game(page)).events.find((e) => e.type === 'goal' && e.team === 0).id;
    await tap(page, `.lrow[data-id="${goalId}"]`);
    await page.tap('.edit .row .btn:has-text("+1秒")');
    await page.tap('.nopick .btn:has-text("#9")');
    g = await game(page);
    const fixed = g.events.find((e) => e.id === goalId);
    ok(fixed.t === 11 && fixed.no === '9', '時刻 +1 秒・番号を #9 に');
    await page.tap('.typepick [data-etype="shot"]');
    g = await game(page);
    ok(g.events.find((e) => e.id === goalId).type === 'shot', 'プレーを「シュート」に直す');
    ok((await page.textContent('#score0')) === '0', '得点も直る（0）');
    await page.tap('.typepick [data-etype="goal"]');
    await page.tap('.sheet-foot .btn.primary');

    section('集計・書き出す');
    await tap(page, '#btnMenu');
    await page.tap('.mitem:has-text("集計")');
    const statsText = await page.textContent('.stats');
    ok(/前半/.test(statsText) && /後半/.test(statsText) && /PK戦/.test(statsText) && /シュート/.test(statsText), '集計：ピリオドごとの得点・PK戦・シュート');
    await shot(page, '06-stats');
    await page.tap('.sheet-foot .btn:has-text("書き出す")');
    const j = await dl(page, '#btnExpJson');
    const data = JSON.parse(j.text || '{}');
    ok(/^サッカー記録_2026-10-19_1530_致遠館vs相手\.json$/.test(j.name), 'JSON のファイル名', j.name);
    ok(data.format === 'sports-tap' && data.sport === 'soccer' && data.scoreText === '1 − 1（PK 1−0）', 'JSON の中身：種目・得点', data.scoreText);
    await page.tap('.sheet-card header .x');
    await tap(page, '#btnMenu');
    await page.tap('.mitem:has-text("書き出す")');
    const csv = await dl(page, '#btnExp_csv');
    ok(csv.text.charCodeAt(0) === 0xfeff && /ピリオドの時間/.test(csv.text) && /前半,0:11,致遠館,9/.test(csv.text), '記録の一覧（CSV）：BOM 付き・ピリオドの時間', csv.text.split('\r\n').slice(0, 3));
    const box = await dl(page, '#btnExp_box');
    ok(/チーム,背番号,名前,得点,シュート/.test(box.text) && /合計/.test(box.text), '選手ごとの集計（CSV）');
    await page.tap('.sheet-card header .x');

    section('開き直す・試合を終える');
    await page.reload();
    await page.waitForFunction(() => window.ST && ST.app && ST.app.S.view === 'live');
    ok((await page.textContent('#soScore')) === 'PK 1−0' && await page.isVisible(pb(0, '10', 'sog')), '開き直すと、記録中の試合の続きから（PK戦のまま）');
    await tap(page, '#btnMenu');
    await page.tap('.mitem:has-text("試合を終える")');
    await page.tap('.sheet-foot .btn.primary');
    g = await game(page);
    ok(!!g.endedAt, '試合を終える');
    await page.tap('.sheet-foot .btn.primary');
    ok(/試合終了/.test(await page.textContent('#cover')) && /1 − 1（PK 1−0）/.test(await page.textContent('#cover')), '「試合終了」の札');
    await tap(page, '#btnMenu');
    await page.tap('.mitem:has-text("ホームへ")');
    ok(/1 − 1（PK 1−0）/.test(await page.textContent('.games')), 'サッカーのホーム：これまでの試合に得点');
    await tap(page, '#btnNew');
    ok((await page.inputValue('#team0 .tname')) === '致遠館' && (await page.$$('#team0 .nb.on')).length === 11 && await page.$('#optsCard [data-opt="len"] .btn.on[data-v="30"]') != null, '次の試合：自分のチームと、前の形式（30 分）が入っている');
    ok(errors.length === 0, 'ページのエラーなし', errors);
    await ctx.close();

    /* ========== ハンドボール：2分間退場 ========== */
    section('ハンドボール：2分間退場・7mスロー');
    ({ ctx, page, errors } = await openPage(browser, srv.url + '?s=handball', PHONE));
    ok((await page.title()) === 'ハンドボール タップ記録' && await page.isVisible('#btnNew'), '?s=handball で、ハンドボールのホーム');
    await tap(page, '#btnNew');
    await setupTeams(page, '致遠館', '1-14');
    await tap(page, '#btnToLive');
    await tap(page, '#btnStartBig');
    ok(await page.$(pb(0, '7', 's2')) != null && await page.$(pb(0, '7', 'shotx')) != null, 'ふだん：ゴール・×・警告・2分・失格');
    await page.clock.runFor(60000);
    await tap(page, pb(0, '7', 's2'));
    await page.clock.runFor(30000);
    ok((await page.textContent('#panel0 .prow[data-no="7"] .ptag')) === '1:30' && await page.$('#panel0 .prow[data-no="7"].susp') != null, '2分間退場：その選手の行に のこり 1:30');
    ok((await page.textContent('#panel0 .tshort')) === '−1 1:30', 'チームの帯に「−1 1:30」');
    await shot(page, '07-handball');
    await page.clock.runFor(91000);
    ok(await page.$('#panel0 .prow[data-no="7"].susp') == null && await page.isHidden('#panel0 .tshort'), '2分たつと、もとに戻る');
    // 設定で 7mスロー
    await tap(page, '#btnMenu');
    await page.tap('.mitem:has-text("設定")');
    await page.check('[data-pref="g7"]');
    await page.tap('.sheet-card header .x');
    ok(await page.$(pb(0, '7', 'g7')) != null && await page.$(pb(0, '7', 'x7')) != null, '設定：7mスローの「7m」「×」が出る');
    ok((await allVisible(page)).length === 0, 'ボタン 7 つでも画面に収まる', await allVisible(page));
    await tap(page, pb(0, '3', 'goal'));
    await page.clock.runFor(2000);
    await tap(page, pb(0, '3', 'shotx'));
    await page.clock.runFor(2000);
    await tap(page, pb(0, '3', 'g7'));
    await tap(page, '#btnMenu');
    await page.tap('.mitem:has-text("集計")');
    const hbStats = await page.textContent('.stats');
    ok(/決定率 67%/.test(hbStats) && /2\/3/.test(hbStats), '集計：シュート 2/3・決定率 67%', hbStats.slice(0, 200));
    ok(errors.length === 0, 'ページのエラーなし', errors);
    await ctx.close();

    /* ========== フットサル：累積ファウル ========== */
    section('フットサル：累積ファウル');
    ({ ctx, page, errors } = await openPage(browser, srv.url + '?s=futsal', PHONE));
    await tap(page, '#btnNew');
    await setupTeams(page, '致遠館', '1-12');
    await tap(page, '#btnToLive');
    await tap(page, '#btnStartBig');
    for (let i = 0; i < 5; i++) { await page.clock.runFor(1000); await tap(page, pb(0, String(4 + (i % 2)), 'foul')); }
    ok((await page.textContent('#panel0 .tfoul')) === '累積5' && await page.$('#panel0 .tfoul.w') != null, '累積ファウル 5：黄');
    await page.clock.runFor(1000);
    await tap(page, pb(0, '4', 'foul'));
    ok(await page.$('#panel0 .tfoul.x') != null, '6つ目：赤（第2PK）');
    await shot(page, '08-futsal');
    await tap(page, '#btnPeriod'); await tap(page, '#btnEndPeriod');
    await tap(page, '#btnPeriod'); await tap(page, '#btnNextPeriod');
    ok((await page.textContent('#panel0 .tfoul')) === '累積0', '後半は 0 から');
    ok(errors.length === 0, 'ページのエラーなし', errors);
    await ctx.close();

    /* ========== ラグビー：得点・シンビン ========== */
    section('ラグビー：得点・シンビン');
    ({ ctx, page, errors } = await openPage(browser, srv.url + '?s=rugby', PHONE));
    await tap(page, '#btnNew');
    await setupTeams(page, '致遠館', '1-15');
    await tap(page, '#btnToLive');
    await tap(page, '#btnStartBig');
    await page.clock.runFor(1000);
    await tap(page, pb(0, '11', 'try'));
    await page.clock.runFor(60000);
    await tap(page, pb(0, '10', 'con'));
    await page.clock.runFor(60000);
    await tap(page, pb(1, null, 'pg'));
    await tap(page, tb(0, 'ptry'));
    ok((await page.textContent('#score0')) === '14' && (await page.textContent('#score1')) === '3', '得点：トライ 5＋ゴール 2＋認定トライ 7 ／ PG 3');
    await tap(page, '#btnMenu');
    await page.tap('.mitem:has-text("設定")');
    await page.check('[data-pref="card"]');
    await page.check('[data-pref="kickx"]');
    await page.tap('.sheet-card header .x');
    await tap(page, pb(0, '6', 'yc'));
    await page.clock.runFor(60000);
    ok((await page.textContent('#panel0 .prow[data-no="6"] .ptag')) === '9:00' && /−1 9:00/.test(await page.textContent('#panel0 .tshort')), 'シンビン 10 分：のこり 9:00');
    ok((await allVisible(page)).length === 0, 'キックの×・シンビン・退場（ボタン 9 つ）でも画面に収まる（すべらせるときは横だけ）', await allVisible(page));
    await shot(page, '09-rugby');
    ok(errors.length === 0, 'ページのエラーなし', errors);
    await ctx.close();

    /* ========== いろいろな画面の大きさ ========== */
    section('画面の大きさ（サッカー 18人ずつ・ボタンを全部）');
    const sizes = [['スマホ縦', 390, 664], ['iPhone SE', 375, 553], ['スマホ横', 844, 390], ['iPad 縦', 820, 1180], ['iPad 横', 1180, 820]];
    for (const [label, w, hh] of sizes) {
      ({ ctx, page, errors } = await openPage(browser, srv.url + '?s=soccer', { width: w, height: hh }));
      await page.evaluate(() => { const p = ST.app.S.prefs; ST.store.sportPrefs(p, 'soccer').rows = { ast: true, card: true, foul: true, save: true }; ST.store.savePrefs(p); });
      await tap(page, '#btnNew');
      await setupTeams(page, '致遠館', '1-18', '城南', '1-18');
      await tap(page, '#btnToLive');
      await tap(page, '#btnStartBig');
      const bad = await allVisible(page);
      const bar = await barOverlap(page);
      ok(bad.length === 0 && bar.length === 0, `${label}（${w}×${hh}）：ボタン 7 つ・18人ずつでも、はみ出さない（すべり：${(await scrolls(page)).join('/')}）`, { bad: bad.slice(0, 5), bar });
      await shot(page, `10-size-${w}x${hh}`);
      ok(errors.length === 0, `${label}：ページのエラーなし`, errors);
      await ctx.close();
    }

    section('読み込み（書き出したファイルを開く）');
    ({ ctx, page, errors } = await openPage(browser, srv.url, PHONE));
    const tmp = path.join(require('os').tmpdir(), 'stap-import.json');
    fs.writeFileSync(tmp, j.text);
    const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.tap('.tools .btn')]);
    await chooser.setFiles(tmp);
    await page.waitForFunction(() => ST.app.S.view === 'live');
    g = await game(page);
    ok(g.sport === 'soccer' && plays(g).length === plays(data).length && (await page.textContent('#soScore')) === 'PK 1−0', '記録のファイルを開くと、同じ試合（PK戦まで）');
    ok(errors.length === 0, 'ページのエラーなし', errors);
    await ctx.close();
  } finally {
    await browser.close();
    await srv.close();
  }
  console.log(`\n${pass} ok / ${fail} fail`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
