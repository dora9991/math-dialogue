// 入口（バスケ・グロウ）とのつながりの確認：タップ記録のホームの「‹ バスケ・グロウ」と、得点クリップの案内の帯
//   node basket-tap/tests/e2e-links.cjs [built|dev]   （built：public/ の1ファイル版。得点クリップはいつも public/ を見る）
// 調べること：
//   タップ記録 … ふつうに開くと グロウのホーム（#home）へ／グロウから ?from=grow-club で開くと コーチのページ（#club）へ・
//               ?from=grow-more は「もっと」へ／知らない from は使わない／?from= はアドレスから消える（?lic= といっしょでも）／
//               このタブのあいだは覚えている（試合の準備 → ホームに戻っても）／スマホの幅で はみ出さない・エラーなし
//   得点クリップ … いちばん上に「タップ記録の中でもできる」の帯と、タップ記録・グロウへのリンク／はみ出さない・エラーなし
const fs = require('fs');
const path = require('path');
const { chromium } = require('./pw.cjs');
const { stubCloud } = require('./cloudstub.cjs');
const { start } = require('./server.cjs');

const MODE = process.argv[2] || 'built';
const GROW = 'https://dora9991.github.io/math-dialogue/basket-coach/';
const TAP = 'https://dora9991.github.io/math-dialogue/basket-tap/';
let pass = 0, fail = 0;
const ok = (c, name, extra) => { if (c) { pass++; console.log('  ok  ', name); } else { fail++; console.log('  FAIL', name, extra !== undefined ? JSON.stringify(extra) : ''); } };

async function open(browser, url, vp) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1, hasTouch: true, isMobile: vp.width < 900, locale: 'ja-JP', timezoneId: 'Asia/Tokyo' });
  await stubCloud(ctx);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(url);
  return { ctx, page, errors };
}
const homeReady = (page) => page.waitForFunction(() => window.BT && BT.app && document.querySelector('#growLink'));
const link = (page) => page.evaluate(() => { const a = document.querySelector('#growLink'); return { href: a.getAttribute('href'), text: a.textContent, search: location.search, w: document.documentElement.scrollWidth - innerWidth, right: a.getBoundingClientRect().right - innerWidth, first: a === document.querySelector('main.home').firstElementChild }; });

(async () => {
  const tapRoot = MODE === 'built' ? path.join(__dirname, '..', '..', 'public', 'basket-tap') : path.join(__dirname, '..');
  const clipRoot = path.join(__dirname, '..', '..', 'public', 'basket-clips');
  for (const f of [path.join(tapRoot, 'index.html'), path.join(clipRoot, 'index.html')]) if (!fs.existsSync(f)) { console.log(f + ' がありません。先に build.mjs を'); process.exit(1); }
  const tapSrv = await start(0, tapRoot);
  const clipSrv = await start(0, clipRoot);
  const browser = await chromium.launch();
  try {
    console.log(`\n■ タップ記録（${MODE === 'built' ? '1ファイル版' : '開発版'}）`);
    {
      const { ctx, page, errors } = await open(browser, tapSrv.url, { width: 390, height: 844 });
      await homeReady(page);
      const L = await link(page);
      ok(L.href === GROW + '#home' && L.text.includes('バスケ・グロウ') && L.text.includes('クラブ・練習・保護者会の入口'), 'ふつうに開くと：ホームのいちばん上に「‹ バスケ・グロウ」→ グロウのホーム', L);
      ok(L.first, '「試合を見ながら記録する」などより上（ホームのいちばん上）');
      ok(L.w <= 0 && L.right <= 0, '横にはみ出さない', L);
      ok(errors.length === 0, 'ページのエラーなし', errors);
      await ctx.close();
    }
    {
      const { ctx, page, errors } = await open(browser, tapSrv.url + '?from=grow-club', { width: 390, height: 844 });
      await homeReady(page);
      let L = await link(page);
      ok(L.href === GROW + '#club' && L.text.includes('コーチのページに戻る'), 'グロウのコーチのページから（?from=grow-club）：「コーチのページに戻る」→ #club', L);
      ok(L.search === '', '?from= はアドレスから消える', L.search);
      await page.tap('#btnNew');
      await page.waitForFunction(() => BT.app.S.view === 'setup');
      await page.evaluate(() => BT.app.go('home'));
      await homeReady(page);
      L = await link(page);
      ok(L.href === GROW + '#club', 'このタブのあいだは覚えている（試合の準備 → ホームに戻っても #club）', L);
      await page.reload();
      await homeReady(page);
      L = await link(page);
      ok(L.href === GROW + '#club', '読み込み直しても（同じタブ）#club', L);
      ok(errors.length === 0, 'ページのエラーなし', errors);
      await ctx.close();
    }
    for (const [q, want, label] of [['?from=grow-more', '#more', '「もっと」から → #more'], ['?from=evil', '#home', '知らない from は使わない → #home'], ['?from=grow-home', '#home', 'ホームから → #home']]) {
      const { ctx, page, errors } = await open(browser, tapSrv.url + q, { width: 390, height: 844 });
      await homeReady(page);
      const L = await link(page);
      ok(L.href === GROW + want && L.search === '', `${q}：${label}・アドレスから消える`, L);
      ok(errors.length === 0, `${q}：ページのエラーなし`, errors);
      await ctx.close();
    }
    for (const q of ['?lic=on&from=grow-club', '?from=grow-club&lic=on']) {
      const { ctx, page, errors } = await open(browser, tapSrv.url + q, { width: 390, height: 844 });
      await homeReady(page);
      const L = await link(page);
      const lic = await page.evaluate(() => BT.license.mode());
      ok(L.href === GROW + '#club' && L.search === '' && lic === 'on', `${q}：場面パックのスイッチ（?lic=）といっしょでも、両方 効いて 両方 消える`, Object.assign({ lic }, L));
      ok(errors.length === 0, `${q}：ページのエラーなし`, errors);
      await ctx.close();
    }
    {
      const { ctx, page, errors } = await open(browser, tapSrv.url + '?from=grow-club', { width: 320, height: 568 });
      await homeReady(page);
      const L = await link(page);
      ok(L.w <= 0 && L.right <= 0, '小さなスマホ（320px）でも はみ出さない', L);
      await page.screenshot({ path: path.join(process.env.SHOTS || require('os').tmpdir(), 'links-tap-320.png') }).catch(() => {});
      ok(errors.length === 0, 'ページのエラーなし', errors);
      await ctx.close();
    }

    console.log('\n■ 得点クリップ（1ファイル版）');
    for (const vp of [{ width: 1280, height: 800 }, { width: 390, height: 844 }, { width: 320, height: 568 }]) {
      const { ctx, page, errors } = await open(browser, clipSrv.url, vp);
      await page.waitForSelector('#hubbar');
      const B = await page.evaluate(() => {
        const bar = document.querySelector('#hubbar');
        return { first: bar === document.querySelector('#app').firstElementChild, text: bar.textContent.replace(/\s+/g, ' '), tap: document.querySelector('#hbTap').getAttribute('href'), grow: document.querySelector('#hbGrow').getAttribute('href'),
          w: document.documentElement.scrollWidth - innerWidth, h: Math.round(bar.getBoundingClientRect().height), top: Math.round(document.querySelector('.topbar').getBoundingClientRect().top) };
      });
      ok(B.first && B.text.includes('タップ記録') && B.tap === TAP && B.grow === GROW + '#home', `${vp.width}px：いちばん上に案内の帯（タップ記録を開く・バスケ・グロウ）`, B);
      ok(B.w <= 0, `${vp.width}px：横にはみ出さない`, B);
      ok(B.h <= (vp.width < 500 ? 90 : 40), `${vp.width}px：帯は小さく（高さ ${B.h}px）`, B);
      if (vp.width === 390) await page.screenshot({ path: path.join(process.env.SHOTS || require('os').tmpdir(), 'links-clips-390.png') }).catch(() => {});
      ok(errors.length === 0, `${vp.width}px：ページのエラーなし`, errors);
      await ctx.close();
    }
  } catch (e) { fail++; console.log('  STOPPED', e && e.stack || e); } finally { await browser.close(); await tapSrv.close(); await clipSrv.close(); }
  console.log(`\n${pass} ok / ${fail} fail`);
  process.exit(fail ? 1 : 0);
})();
