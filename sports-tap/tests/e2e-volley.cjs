// バレーボールの画面を通した確認（node sports-tap/tests/e2e-volley.cjs）
// Playwright の Chromium・スマホの縦（390×664・タッチ）と iPad の横（1180×820）。時計は page.clock で進める。
//   SHOTS=フォルダ を付けると、画面の写真も撮る（見た目の確認用）
// （このコンテナのように LANG が空だと、Chromium が日本語のファイル名のダウンロードを「download」にしてしまうので）
if (!process.env.LANG) process.env.LANG = 'C.UTF-8';
const path = require('path');
const fs = require('fs');
const { chromium } = require('./pw.cjs');
const { start } = require('./server.cjs');

const SHOTS = process.env.SHOTS || '';
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
let pass = 0, fail = 0;
const ok = (c, name, extra) => { if (c) { pass++; console.log('  ok  ', name); } else { fail++; console.log('  FAIL', name, extra !== undefined ? JSON.stringify(extra) : ''); } };
const section = (t) => console.log('\n■ ' + t);
const T0 = new Date('2026-10-29T15:00:00+09:00').getTime();

async function shot(p, name) { if (SHOTS) await p.screenshot({ path: path.join(SHOTS, name + '.png') }); }
/* 見えているボタンが、画面からはみ出していないか（行を縦にすべらせているチームは、横だけ） */
async function fits(p) {
  return p.evaluate(() => {
    const W = innerWidth, H = innerHeight, bad = [];
    let minW = 1e9;
    document.querySelectorAll('.live .pb, .live .gb, .live .lbar button:not([hidden]), .live .srvb').forEach((b) => {
      const r = b.getBoundingClientRect();
      if (!r.width) return;
      const scroll = b.closest('.team.scroll');
      if (r.left < -0.5 || r.right > W + 0.5) bad.push([b.className, 'x', Math.round(r.left), Math.round(r.right)]);
      if (!scroll && (r.top < -0.5 || r.bottom > H + 0.5)) bad.push([b.className, 'y', Math.round(r.top), Math.round(r.bottom)]);
      if (b.classList.contains('pb')) minW = Math.min(minW, r.width);
    });
    // 上の帯の部品が重なっていないか
    const bar = Array.from(document.querySelectorAll('.lbar > *')).filter((e) => !e.hidden && e.getBoundingClientRect().width).map((e) => e.getBoundingClientRect());
    for (let i = 1; i < bar.length; i++) if (bar[i].left < bar[i - 1].right - 0.5) bad.push(['lbar overlap', i]);
    return { bad, minW: Math.round(minW) };
  });
}
const stateOf = (p) => p.evaluate(() => { const g = ST.app.S.game; const rp = ST.SPORTS.volley.replay(g); return { set: rp.set, pts: rp.pts, sets: rp.sets, server: rp.server, done: rp.done, n: g.events.length, last: g.events[g.events.length - 1] }; });

(async () => {
  // node sports-tap/tests/e2e-volley.cjs [dev|built]（built は public/sports-tap/ の1ファイル版）
  const MODE = process.argv[2] || 'dev';
  const root = MODE === 'built' ? path.join(__dirname, '..', '..', 'public', 'sports-tap') : path.join(__dirname, '..');
  const srv = await start(0, root);
  const browser = await chromium.launch();
  const errors = [];
  // 画面を消さない仕組み（Wake Lock）は、画面なしの Chromium では使えないので、あるふりをする（下の帯のお知らせが出ないように）
  const fakeWake = () => { try { Object.defineProperty(navigator, 'wakeLock', { value: { request: async () => ({ release: async () => {}, addEventListener() {} }) } }); } catch (e) { /* なし */ } };
  const watch = (p) => { p.addInitScript(fakeWake); p.on('pageerror', (e) => errors.push(String(e))); p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); }); };
  try {
    /* ========== スマホの縦 ========== */
    const ctx = await browser.newContext({ viewport: { width: 390, height: 664 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2, locale: 'ja-JP', timezoneId: 'Asia/Tokyo' });
    const p = await ctx.newPage();
    watch(p);
    await p.clock.install({ time: T0 });
    await p.goto(srv.url + '?s=volley');

    section('ホーム・試合の準備');
    ok(/バレーボール タップ記録/.test(await p.textContent('.hbar')), '?s=volley で、バレーボールのホームが開く');
    await p.click('#btnNew');
    await p.click('#team0 [data-preset="1-12"]');
    await p.fill('#team0 .tname', '致遠館'); await p.dispatchEvent('#team0 .tname', 'change');
    await p.fill('#team1 .tname', '城南'); await p.dispatchEvent('#team1 .tname', 'change');
    ok(await p.isVisible('[data-opt="fmt"] [data-v="9"]') && await p.isVisible('[data-opt="sets"] [data-v="5"]'), '試合の形式：6人制・9人制・小学生／3・5セット');
    ok(await p.getAttribute('[data-opt="fmt"] [data-v="6"]', 'aria-pressed') === 'true', 'はじめは6人制');
    await p.click('#btnToLive');

    section('スタート前：最初のサーブを選ぶ');
    ok(await p.isVisible('#btnFirst0') && await p.isVisible('#btnFirst1'), '札に「最初のサーブ」');
    await p.click('#btnFirst1');
    ok(await p.evaluate(() => ST.app.S.game.opts.first) === 1, '相手を選ぶと opts.first = 1');
    ok(await p.getAttribute('#btnFirst1', 'aria-pressed') === 'true', '選んだほうが押された形');
    await shot(p, 'v1-phone-before');
    await p.click('#btnFirst0');
    ok(await p.evaluate(() => ST.app.S.game.opts.first) === 0, '自分に戻せる');

    section('記録：点の向きとサーブ権');
    await p.click('#btnStartBig');
    await p.clock.runFor(5000);
    await p.click('#panel0 .prow[data-no="4"] .pb[data-type="atk"]');
    let s = await stateOf(p);
    ok(s.pts[0] === 1 && s.pts[1] === 0 && s.last.type === 'atk' && s.last.no === '4' && Math.abs(s.last.t - 5) < 0.15, '#4 の「アタック」：1−0・時刻 5.0 秒', s.last);
    ok((await p.textContent('#score0')) === '1' && (await p.textContent('#panel0 .tsc')) === '1', '上の帯とチームの帯に、いまのセットの点');
    ok(await p.evaluate(() => document.querySelector('#panel0').classList.contains('serving') && document.querySelector('#score0').classList.contains('srv')), '自分のサーブ（🏐）');
    ok(/アタック → 1−0/.test(await p.textContent('#lastbar')), '下の帯：「アタック → 1−0」', await p.textContent('#lastbar'));
    await p.clock.runFor(3000);
    await p.click('#panel0 .prow[data-no="2"] .pb[data-type="err"]');
    s = await stateOf(p);
    ok(s.pts[0] === 1 && s.pts[1] === 1 && s.server === 1, '#2 の「ミス」→ 相手の点・相手のサーブ');
    await p.clock.runFor(3000);
    await p.click('#panel1 .trow .pb[data-type="pt"]');
    s = await stateOf(p);
    ok(s.pts[1] === 2 && s.last.team === 1 && s.last.no == null, '相手のチームの行の「得点」→ 1−2');
    await p.clock.runFor(1000);
    await p.click('#panel1 .prow.teamonly .pb[data-type="blk"]');
    ok((await stateOf(p)).pts[1] === 3, '相手（名簿なし）の「チーム」の行の「ブロック」→ 1−3');
    await p.clock.runFor(1000);
    await p.click('#panel0 .srvb');
    s = await stateOf(p);
    ok(s.server === 0 && s.last.type === 'srv' && s.last.team === 0, '自分の帯の 🏐 → サーブを自分に入れかえる（srv の記録）');
    await p.click('#btnUndo');
    ok((await stateOf(p)).server === 1, '取り消すと、サーブも元に戻る');
    await shot(p, 'v2-phone-live');
    let f = await fits(p);
    ok(!f.bad.length && f.minW >= 30, `スマホ縦：ボタンが画面からはみ出さない・重ならない（いちばん細いボタン ${f.minW}px）`, f.bad.slice(0, 5));

    section('セットの区切り（25点・2点差）');
    for (let i = 0; i < 24; i++) { await p.clock.runFor(600); await p.click('#panel0 .prow[data-no="7"] .pb[data-type="ace"]'); }
    s = await stateOf(p);
    ok(s.set === 2 && s.sets[0] === 1 && s.pts[0] === 0, '25−3 で第1セットは自分 → 第2セットへ', s);
    ok(/第1セット 25−3 で致遠館/.test(await p.textContent('#lastbar')), '下の帯に「第1セット 25−3 で致遠館」', await p.textContent('#lastbar'));
    ok((await p.textContent('#setLabel')) === '第2セット' && /1−0/.test(await p.textContent('#setScore')), '上の帯：「第2セット」・セット 1−0');
    ok(s.server === 1, '第2セットの最初のサーブは相手（交互）');
    await shot(p, 'v3-phone-set2');
    await p.click('#btnSet');
    ok(await p.isVisible('#setTable') && /25/.test(await p.textContent('#setTable')), 'セットの小窓：セットごとの点の表');
    await p.click('#btnSwapSrv');
    ok((await stateOf(p)).server === 0, 'セットの小窓から、サーブを入れかえられる');
    await p.click('#btnUndo');

    section('試合が決まる（2セット先取）');
    for (let i = 0; i < 25; i++) { await p.clock.runFor(600); await p.click('#panel0 .prow[data-no="4"] .pb[data-type="atk"]'); }
    s = await stateOf(p);
    ok(s.done && s.sets[0] === 2, '2−0 で試合が決まる', s);
    ok(/試合終了/.test(await p.textContent('#lastbar')) && await p.isVisible('#btnMsgAct'), '下の帯に「試合終了」と「試合を終える」');
    await p.clock.runFor(600);
    await p.click('#panel0 .prow[data-no="4"] .pb[data-type="atk"]');
    ok((await stateOf(p)).n === s.n, '決まったあとの点のボタンは、記録しないで知らせる');
    await p.click('#btnMsgAct');
    ok(await p.isVisible('.sheet-card .stats #setTable'), '「試合を終える」→ 集計（セットの表）');
    const statsText = await p.textContent('.sheet-card .stats');
    ok(/サイドアウト率/.test(statsText) && /ブレイク率/.test(statsText) && /相手のミスでの得点 1/.test(statsText), '集計：サイドアウト率・ブレイク率・相手のミスでの得点', statsText.slice(0, 200));
    ok(/サーブエース/.test(statsText) && /アタック/.test(statsText), '集計：選手ごとのアタック・サーブエース');
    await shot(p, 'v4-phone-stats');
    await p.click('.sheet-card .btn.primary');
    ok(/2 − 0/.test(await p.textContent('#cover')), '試合のあとの札：セット 2 − 0');
    const csv = await p.evaluate(() => ST.csv(ST.SPORTS.volley.csvEvents(ST.app.S.game)));
    ok(/第1セット終了（セット 1−0）/.test(csv) && /^No,時刻,スタートからの秒,セット/.test(csv), '記録の一覧（CSV）：セット・セットの終わり');

    section('一覧で直す・続きから');
    await p.click('#btnMenu');
    await p.click('.mitem:has-text("続きを記録する")');
    await p.click('#btnMenu');
    await p.click('.mitem:has-text("記録の一覧")');
    const n0 = await p.locator('.lrow').count();
    ok(n0 > 50, `記録の一覧に ${n0} 行`);
    // 1つ目のアタックを、相手の記録に直す → 第1セットの点が変わる
    const firstId = await p.evaluate(() => ST.sorted(ST.app.S.game).find((e) => e.type === 'atk').id);
    await p.click(`.lrow[data-id="${firstId}"]`);
    await p.click('[data-eteam="1"]');
    const s2 = await stateOf(p);
    ok(s2.set === 2 && s2.sets[0] === 1 && s2.pts[0] === 24 && !s2.done, '最初のアタックを相手の点に直すと、第1セットの終わりが1点あとにずれ、試合はまだ決まっていない（記録から計算し直す）', s2);
    await p.click('.sheet-card .btn.primary');
    await p.reload();
    ok(await p.isVisible('#panel0'), '開き直すと、続きから（記録中の試合）');

    section('設定：ミスの種類を分ける');
    await p.click('#btnMenu');
    await p.click('.mitem:has-text("設定")');
    await p.check('[data-pref="errs"]');
    await p.click('.sheet-card .x');
    ok(await p.locator('#panel0 .prow[data-no="4"] .pb').count() === 6, 'ボタンが6つ（アタック・ブロック・サーブ・サーブミス・アタックミス・その他ミス）');
    f = await fits(p);
    ok(!f.bad.length && f.minW >= 30, `ボタンが増えても、はみ出さない（いちばん細い ${f.minW}px）`, f.bad.slice(0, 5));
    await shot(p, 'v5-phone-errs');
    await ctx.close();

    /* ========== iPad の横 ========== */
    section('iPad の横（2チームとも名簿・12人ずつ）');
    const ctx2 = await browser.newContext({ viewport: { width: 1180, height: 820 }, hasTouch: true, deviceScaleFactor: 1, locale: 'ja-JP', timezoneId: 'Asia/Tokyo' });
    const q = await ctx2.newPage();
    watch(q);
    await q.clock.install({ time: T0 });
    await q.goto(srv.url + '?s=volley');
    await q.click('#btnNew');
    await q.click('#team0 [data-preset="1-12"]');
    await q.click('#team1 [data-preset="1-12"]');
    await q.click('[data-opt="fmt"] [data-v="9"]');
    await q.click('#btnToLive');
    ok(await q.evaluate(() => ST.app.S.game.opts.fmt) === '9', '9人制を選んで記録の画面へ');
    await q.click('#btnStartBig');
    for (let i = 0; i < 6; i++) { await q.clock.runFor(700); await q.click(`#panel${i % 2} .prow[data-no="${i + 1}"] .pb[data-type="atk"]`); }
    const fq = await fits(q);
    const scroll = await q.evaluate(() => document.querySelectorAll('.team.scroll').length);
    ok(!fq.bad.length && !scroll && fq.minW >= 60, `iPad 横：全部のボタンが1画面に入る（すべらせない・いちばん細い ${fq.minW}px）`, fq.bad.slice(0, 5));
    ok((await q.evaluate(() => ST.SPORTS.volley.target(ST.app.S.game.opts, 1))) === 21, '9人制は 21 点');
    await shot(q, 'v6-ipad-live');
    await ctx2.close();
  } catch (e) {
    fail++;
    console.log('  FAIL 例外', e && e.stack ? e.stack : e);
  } finally {
    ok(!errors.length, 'ページのエラーがない', errors.slice(0, 5));
    await browser.close();
    await srv.close();
    console.log(`\n${pass} 件 ok・${fail} 件 FAIL`);
    process.exit(fail ? 1 : 0);
  }
})();
