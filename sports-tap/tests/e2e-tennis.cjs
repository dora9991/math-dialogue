// 画面を通した確認：テニス（node sports-tap/tests/e2e-tennis.cjs [dev|built]）
//   dev   … sports-tap/index.html（js/ と css/ を読む版）
//   built … public/sports-tap/index.html（1ファイル版。先に node sports-tap/build.mjs）
//   SHOTS=フォルダ を付けると、画面の写真を保存する
// スマホの縦（390×664）：硬式シングルス。準備（名前・最初のサーブ・形式）→ スタート → エース・ミス・ウィナー → デュース・アドバンテージ →
//   ゲーム（お知らせ・サーブの交代）→ サーブ側だけのボタン → 取り消し・やり直し → フォルト（設定）→ 一覧で直す → 集計 → CSV → 開き直し
// iPad の横（1180×820）：ソフトテニスのダブルス 7ゲームマッチ。3−3 からファイナルゲーム（2ポイントずつのサーブ）→ 試合終了 → 試合を終える
// スマホの縦：硬式ダブルスで、サーブする人の目安が上の帯に出る
// どの画面も、ボタンが画面からはみ出さない・文字がはみ出さない・ページのエラーが 0。時計は Playwright の clock で進める。
const fs = require('fs');
const path = require('path');
if (!process.env.LANG) process.env.LANG = 'C.UTF-8';       // 日本語のファイル名でダウンロードできるように
const { chromium } = require('./pw.cjs');
const { start } = require('./server.cjs');

const MODE = process.argv[2] || 'dev';
const SHOTS = process.env.SHOTS || '';
let pass = 0, fail = 0;
const ok = (c, name, extra) => { if (c) { pass++; console.log('  ok  ', name); } else { fail++; console.log('  FAIL', name, extra !== undefined ? JSON.stringify(extra) : ''); } };
const section = (t) => console.log('\n■ ' + t);
const T0 = new Date('2026-10-19T06:30:00Z');
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
const pts = (g) => g.events.filter((e) => e.type !== 'mark' && e.type !== 'flt');
const state = (page) => page.evaluate(() => { const s = ST.SPORTS.tennis.replay(ST.app.S.game); return { g: s.g, p: s.p, sets: s.sets.map((x) => x.g), sw: s.sw, tb: s.tb, server: s.server, serverNo: s.serverNo, over: s.over, winner: s.winner }; });
const tap = (page, sel) => page.tap(sel);
const btn = (side, no, type) => `#tside${side} .tprow[data-no="${no}"] .tb[data-type="${type}"]`;
const ptb = (side) => `#tside${side} .tb.ptb`;
/* 押して、時計を 1.2 秒進める（同じボタンの二度押しの見分け（0.45 秒）に当たらないように） */
async function press(page, sel, n) { for (let i = 0; i < (n || 1); i++) { await tap(page, sel); await page.clock.runFor(1200); } }
const dl = async (page, sel) => { const [d] = await Promise.all([page.waitForEvent('download'), tap(page, sel)]); const p = await d.path(); return { name: d.suggestedFilename(), text: fs.readFileSync(p, 'utf8') }; };
/* ボタン・スコア・上の帯が、画面と枠からはみ出していないか */
async function layoutBad(page) {
  return page.evaluate(() => {
    const W = innerWidth, H = innerHeight, bad = [];
    document.querySelectorAll('.fam-tennis .tb').forEach((b) => {
      const r = b.getBoundingClientRect(), s = b.closest('.tside').getBoundingClientRect();
      if (r.width < 44 || r.height < 36) bad.push(['小さい', b.closest('.tside').id, b.dataset.type, Math.round(r.width), Math.round(r.height)]);
      if (r.left < s.left - 1 || r.right > s.right + 1 || r.bottom > s.bottom + 1 || r.top < s.top - 1 || r.right > W + 1 || r.bottom > H + 1) bad.push(['はみ出し', b.closest('.tside').id, b.dataset.type, Math.round(r.right), Math.round(r.bottom)]);
      b.querySelectorAll('b, small').forEach((x) => { if (x.offsetParent !== null && x.scrollWidth > x.clientWidth + 1) bad.push(['文字', b.dataset.type, x.textContent, x.scrollWidth, x.clientWidth]); });
    });
    document.querySelectorAll('.fam-tennis .tbrow').forEach((r) => { const x = r.getBoundingClientRect(); if (r.scrollWidth > r.clientWidth + 1 || x.right > W + 1) bad.push(['スコア', r.dataset.side, r.scrollWidth, r.clientWidth]); });
    const parts = Array.from(document.querySelectorAll('.fam-tennis .lbar > *')).filter((e) => e.offsetParent !== null);
    for (let i = 1; i < parts.length; i++) { const a = parts[i - 1].getBoundingClientRect(), b = parts[i].getBoundingClientRect(); if (b.left < a.right - 1) bad.push(['上の帯が重なる', parts[i - 1].className, parts[i].className]); }
    if (parts.length && parts[parts.length - 1].getBoundingClientRect().right > W + 1) bad.push(['上の帯が右にはみ出す']);
    document.querySelectorAll('.gb, #btnUndo').forEach((b) => { const r = b.getBoundingClientRect(); if (r.bottom > H + 1 || r.right > W + 1) bad.push(['下の帯', b.id]); });
    return bad;
  });
}

(async () => {
  const root = MODE === 'built' ? path.join(__dirname, '..', '..', 'public', 'sports-tap') : path.join(__dirname, '..');
  if (MODE === 'built' && !fs.existsSync(path.join(root, 'index.html'))) { console.log('public/sports-tap/index.html がありません。先に node sports-tap/build.mjs'); process.exit(1); }
  const srv = await start(0, root);
  const browser = await chromium.launch();
  try {
    /* ========== スマホの縦：硬式シングルス ========== */
    section('スマホの縦：準備（硬式シングルス）');
    let { ctx, page, errors } = await openPage(browser, srv.url + '?s=tennis', { width: 390, height: 664 });
    ok((await page.title()) === 'テニス タップ記録' && await page.isVisible('#btnNew'), '?s=tennis でテニスのホーム');
    await tap(page, '#btnNew');
    await page.waitForSelector('.tn-setup');
    const order = await page.evaluate(() => { const oc = document.getElementById('optsCard'), box = document.querySelector('.tn-setup'); return !!(oc && box && (oc.compareDocumentPosition(box) & Node.DOCUMENT_POSITION_FOLLOWING)); });
    ok(order, '「試合の形式」が、選手の欄より上（シングルス・ダブルスを先に選べる）');
    ok(await page.$('#optsCard [data-opt="kind"] .btn.on[data-v="hard"]') != null && await page.$('#optsCard [data-opt="sets"] .btn.on[data-v="3"]') != null, 'はじめは硬式・3セットマッチ');
    ok((await page.$$('.tpname')).length === 2, 'シングルス：名前の欄は側ごとに1つ');
    await tap(page, '#optsCard [data-opt="fmt"] [data-v="double"]');
    ok((await page.$$('.tpname')).length === 4, 'ダブルスにすると、名前の欄が2つずつ');
    await tap(page, '#optsCard [data-opt="fmt"] [data-v="single"]');
    ok((await page.$$('.tpname')).length === 2, 'シングルスに戻すと1つずつ');
    await page.fill('#tside0 .tpname', 'たける'); await page.dispatchEvent('#tside0 .tpname', 'change');
    await page.fill('#tside0 .tname', '致遠館'); await page.dispatchEvent('#tside0 .tname', 'change');
    await page.fill('#tside1 .tpname', 'ゆうと'); await page.dispatchEvent('#tside1 .tpname', 'change');
    ok(/たける/.test(await page.textContent('#serveCard')) && /ゆうと/.test(await page.textContent('#serveCard')), '最初のサーブの欄に、入れた名前');
    await tap(page, '#serveCard [data-serve="1:"]');
    ok(await page.$('#serveCard .btn.on[data-serve="1:"]') != null, '最初のサーブ：ゆうと');
    await shot(page, 'p1-setup');
    await tap(page, '#btnToLive');
    let g = await game(page);
    ok(g.sport === 'tennis' && g.opts.fmt === 'single' && g.serve.side === 1 && g.teams[0].players[0].name === 'たける' && g.teams[0].name === '致遠館', '記録の画面へ：形式・最初のサーブ・名前');
    ok(/最初のサーブ：ゆうと/.test(await page.textContent('#cover')), 'スタート前の札に、最初のサーブ');
    await shot(page, 'p2-before');

    section('スマホの縦：記録する');
    await tap(page, '#btnStartBig');
    await page.clock.runFor(8000);
    ok(await page.$('#tside1.serving') != null && await page.$('#tBoard .tbrow[data-side="1"].serving') != null, 'サーブの印：ゆうとの側');
    ok(await page.$(btn(0, '1', 'ace') + '.off') != null && await page.$(btn(1, '1', 'ace') + ':not(.off)') != null, 'エースは、サーブする側だけ押せる（受ける側は薄く）');
    await tap(page, btn(0, '1', 'ace'));
    g = await game(page);
    ok(pts(g).length === 0 && /サーブする側のボタン/.test(await page.textContent('#lastbar')), '受ける側のエースは記録しない（お知らせ）');
    await press(page, btn(1, '1', 'ace'));
    g = await game(page);
    ok(pts(g).length === 1 && g.events[0].type === 'ace' && g.events[0].team === 1 && g.events[0].no === '1' && g.events[0].t === 8, 'ゆうとのエース（8.0 秒）');
    ok((await page.textContent('#tPt0')) === '0' && (await page.textContent('#tPt1')) === '15', 'スコア：0 と 15');
    ok(/エース → 0−15/.test(await page.textContent('#lastbar')), '下の帯：エース → 0−15');
    await press(page, btn(1, '1', 'err'));          // ゆうとのミス → たけるのポイント
    await press(page, btn(0, '1', 'win'));
    await press(page, btn(1, '1', 'win'), 2);
    let s = await state(page);
    ok(JSON.stringify(s.p) === '[2,3]' && (await page.textContent('#tPt0')) === '30' && (await page.textContent('#tPt1')) === '40', 'ミス（相手のポイント）・ウィナー → 30−40');
    await press(page, ptb(0));
    ok((await page.textContent('#tCall')) === 'デュース' && (await page.textContent('#tPt0')) === '40' && (await page.textContent('#tPt1')) === '40', '側の「ポイント」→ デュース（上の帯）');
    await press(page, btn(0, '1', 'win'));
    ok((await page.textContent('#tCall')) === 'アドバンテージ たける' && (await page.textContent('#tPt0')) === 'AD', 'アドバンテージ たける・AD');
    await shot(page, 'p3-adv');
    await press(page, btn(0, '1', 'win'));
    s = await state(page);
    ok(JSON.stringify(s.g) === '[1,0]' && JSON.stringify(s.p) === '[0,0]' && s.server === 0, 'ゲーム たける（ブレイク）・サーブは たける に');
    ok(/ゲーム：たける（1−0）・チェンジコート/.test(await page.textContent('#lastbar')), 'お知らせ：ゲーム たける（1−0）・チェンジコート');
    ok(await page.$('#tside0.serving') != null && await page.$(btn(0, '1', 'ace') + ':not(.off)') != null && await page.$(btn(1, '1', 'df') + '.off') != null, 'サーブの印とエース・DF のボタンも入れかわる');
    ok((await page.textContent('#tBoard .tbrow[data-side="0"] .tbset.cur')) === '1', 'スコアのゲーム数 1');

    section('スマホの縦：取り消し・やり直し');
    await tap(page, '#btnUndo');
    s = await state(page);
    ok(JSON.stringify(s.g) === '[0,0]' && JSON.stringify(s.p) === '[4,3]' && (await page.textContent('#tCall')) === 'アドバンテージ たける', '取り消すと、アドバンテージに戻る');
    await tap(page, '#btnMsgAct');
    s = await state(page);
    ok(JSON.stringify(s.g) === '[1,0]', 'やり直すと、ゲームに戻る');
    await page.clock.runFor(1500);

    section('スマホの縦：フォルト（設定）・集計');
    await tap(page, '#btnMenu');
    await page.click('.mitem:has-text("設定")');
    await page.click('#setButtons input[data-pref="flt"]');
    await page.click('.sheet-card header .x');
    ok(await page.$(btn(0, '1', 'flt')) != null && await page.$(btn(1, '1', 'flt') + '.off') != null, '設定でフォルトのボタンが出る（サーブする側だけ押せる）');
    await press(page, btn(0, '1', 'flt'));
    await press(page, btn(0, '1', 'ace'));           // 2ndサーブのエース
    await press(page, btn(0, '1', 'ace'));           // 1stサーブのエース
    await press(page, btn(0, '1', 'df'));
    g = await game(page);
    s = await state(page);
    ok(g.events.some((e) => e.type === 'flt' && e.team === 0) && JSON.stringify(s.p) === '[2,1]', 'フォルトはポイントにならない（30−15）');
    ok(JSON.stringify(await layoutBad(page)) === '[]', 'スマホの縦：ボタン・スコア・上の帯がはみ出さない', await layoutBad(page));
    await shot(page, 'p4-live');
    await tap(page, '#btnMenu');
    await page.click('.mitem:has-text("集計")');
    const stxt = await page.textContent('.sheet-card');
    ok(await page.$('#tnSets') != null && /第1セット（途中）/.test(stxt), '集計：セットごとのゲーム数の表');
    ok(/1stサーブ 1\/3（33%）/.test(stxt), '集計：1stサーブ 1/3（フォルトのあとのエースと DF は入らない）', stxt.match(/1stサーブ[^・]*/));
    ok(/ブレイク 1/.test(stxt) && /キープ 0\/1/.test(stxt), '集計：ブレイク・キープ');
    await shot(page, 'p5-stats');
    await page.click('.sheet-card header .x');

    section('スマホの縦：一覧で直す');
    await tap(page, '#btnMenu');
    await page.click('.mitem:has-text("記録の一覧")');
    const lt = await page.textContent('.loglist');
    ok(/ダブルフォルト → 30−15/.test(lt) && /サービスエース → 0−15/.test(lt), '一覧：記録のあとのポイントも出る');
    await page.click('.loglist .lrow >> nth=0');            // いちばん新しい記録（DF）
    ok(await page.$('[data-eteam="0"]') != null && await page.$('[data-eno="1"]') != null, '直す：側と選手を名前で選べる');
    await page.click('[data-etype="win"]');
    s = await state(page);
    ok(JSON.stringify(s.p) === '[3,0]', 'DF をウィナーに直すと、数え直す（40−0）');
    await page.click('.sheet-card header .x');
    ok((await page.textContent('#tPt0')) === '40', '記録の画面のスコアも、直したとおり');

    section('スマホの縦：書き出す・開き直す');
    await tap(page, '#btnMenu');
    await page.click('.mitem:has-text("書き出す")');
    const csv = await dl(page, '#btnExp_csv');
    ok(/^テニス記録_2026-10-19_1530_たけるvsゆうと_一覧\.csv$/.test(csv.name), 'CSV のファイル名', csv.name);
    ok(/サービスエース/.test(csv.text) && /ゲーム（そのセットの何ゲーム目）/.test(csv.text) && /ゆうと,ゆうと,サービスエース,ゆうと,0−15/.test(csv.text), 'CSV：サーブ・理由・その時点のポイント');
    await page.clock.runFor(5000);                  // 「保存しました」のお知らせが消えるまで
    const box = await dl(page, '#btnExp_box');
    ok(/1stサーブ（入った\/全部）/.test(box.text), '集計の CSV');
    await page.click('.sheet-card header .x');
    await page.reload();
    await page.waitForFunction(() => window.ST && ST.app && ST.app.S.view === 'live');
    ok((await page.textContent('#tPt0')) === '40' && (await page.textContent('#tBoard .tbrow[data-side="0"] .tbset.cur')) === '1', '開き直すと、続きから（スコアもそのまま）');
    ok(errors.length === 0, 'スマホの縦：ページのエラーなし', errors);
    await ctx.close();

    /* ========== iPad の横：ソフトテニスのダブルス ========== */
    section('iPad の横：ソフトテニスのダブルス 7ゲームマッチ');
    ({ ctx, page, errors } = await openPage(browser, srv.url + '?s=tennis', { width: 1180, height: 820 }));
    await tap(page, '#btnNew');
    await tap(page, '#optsCard [data-opt="kind"] [data-v="soft"]');
    ok(await page.$('#optsCard [data-opt="sgames"] .btn.on[data-v="7"]') != null && await page.$('#optsCard [data-opt="sets"]') == null, 'ソフトテニス：ゲーム数の欄（セット数の欄は消える）');
    await tap(page, '#optsCard [data-opt="fmt"] [data-v="double"]');
    const nm = ['あおい', 'いつき', 'うみ', 'えま'];
    const inputs = await page.$$('.tpname');
    for (let i = 0; i < 4; i++) { await inputs[i].fill(nm[i]); await inputs[i].dispatchEvent('change'); }
    await tap(page, '#btnToLive');
    g = await game(page);
    ok(g.opts.kind === 'soft' && g.opts.fmt === 'double' && g.teams[1].players[1].name === 'えま', 'ソフトテニス・ダブルス・4人の名前');
    await tap(page, '#btnStartBig');
    await page.clock.runFor(3000);
    ok(await page.evaluate(() => document.querySelector('.tpanels').classList.contains('wide')), 'iPad の横：2つの側を左右に');
    ok((await page.textContent('.tphase')) === '7ゲームマッチ', '上の帯：7ゲームマッチ');
    for (let k = 0; k < 6; k++) await press(page, ptb(k % 2), 4);
    s = await state(page);
    ok(JSON.stringify(s.g) === '[3,3]' && s.tb === 'final' && (await page.textContent('#tCall')) === 'ファイナルゲーム', '3−3 でファイナルゲーム（上の帯）');
    ok(/ファイナルゲーム/.test(await page.textContent('#lastbar')) || s.tb === 'final', 'ファイナルゲームのお知らせ');
    const servers = [];
    for (let i = 0; i < 4; i++) { servers.push((await state(page)).server); await press(page, ptb(0)); }
    ok(JSON.stringify(servers) === '[0,0,1,1]', 'ファイナルゲーム：2ポイントずつサーブを交代', servers);
    ok(JSON.stringify(await layoutBad(page)) === '[]', 'iPad の横：ボタン・スコア・上の帯がはみ出さない', await layoutBad(page));
    await shot(page, 'i1-final');
    await press(page, ptb(0), 3);
    s = await state(page);
    ok(s.over && s.winner === 0 && JSON.stringify(s.g) === '[4,3]', '7−0 で試合終了（4−3）');
    ok(/試合終了：あおい・いつきの勝ち（4−3）/.test(await page.textContent('#lastbar')) && await page.isVisible('#btnMsgAct'), 'お知らせと「試合を終える」');
    await press(page, ptb(1));
    g = await game(page);
    ok(g.events.length === 31 && /試合は決まっています/.test(await page.textContent('#lastbar')), '試合が決まったあとは、ポイントを記録しない');
    await tap(page, '#btnMsgAct');
    g = await game(page);
    ok(!!g.endedAt && /4 − 3/.test(await page.textContent('#cover')), '「試合を終える」→ 試合終了の札（4 − 3）');
    await page.click('.sheet-card header .x');
    await shot(page, 'i2-end');
    ok(errors.length === 0, 'iPad の横：ページのエラーなし', errors);
    await ctx.close();

    /* ========== スマホの縦：硬式ダブルス（サーブする人の目安） ========== */
    section('スマホの縦：硬式ダブルス');
    ({ ctx, page, errors } = await openPage(browser, srv.url + '?s=tennis', { width: 390, height: 664 }));
    await tap(page, '#btnNew');
    await tap(page, '#optsCard [data-opt="kind"] [data-v="hard"]');
    await tap(page, '#optsCard [data-opt="fmt"] [data-v="double"]');
    const ins = await page.$$('.tpname');
    for (let i = 0; i < 4; i++) { await ins[i].fill(['あ', 'い', 'う', 'え'][i]); await ins[i].dispatchEvent('change'); }
    await tap(page, '#serveCard [data-serve="0:2"]');
    await tap(page, '#serveCard [data-serve2="2"]');
    await tap(page, '#btnToLive');
    await tap(page, '#btnStartBig');
    await page.clock.runFor(2000);
    ok((await page.textContent('#tCall')) === 'サーブ：い', '上の帯：サーブ：い（最初に選んだ人）');
    await press(page, ptb(0), 4);
    ok((await page.textContent('#tCall')) === 'サーブ：え', '2ゲーム目：サーブ：え（相手の側で最初に選んだ人）');
    await press(page, ptb(0), 4);
    ok((await page.textContent('#tCall')) === 'サーブ：あ', '3ゲーム目：サーブ：あ（パートナーと交代）');
    ok((await page.$$('.tprow:not(.tptrow)')).length === 4, '選手の行は4つ（2人ずつ）');
    ok(JSON.stringify(await layoutBad(page)) === '[]', 'スマホの縦・ダブルス：はみ出さない', await layoutBad(page));
    await shot(page, 'p6-double');
    ok(errors.length === 0, 'ページのエラーなし', errors);
    await ctx.close();
  } catch (e) {
    fail++;
    console.log('  FAIL 途中で止まりました：', e && e.stack || e);
  } finally {
    await browser.close();
    await srv.close();
  }
  console.log(`\n${pass} ok / ${fail} fail`);
  process.exit(fail ? 1 : 0);
})();
