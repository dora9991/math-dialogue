// ブラウザでゲームを実際に操作して、スクリーンショットとエラーを集める
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

async function launch(opts) {
  opts = opts || {};
  const browser = await chromium.launch({});
  const ctx = await browser.newContext({
    viewport: opts.viewport || { width: 1100, height: 900 },
    hasTouch: !!opts.touch, isMobile: !!opts.touch, deviceScaleFactor: opts.dpr || 1,
  });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); });
  await page.goto('file://' + path.join(ROOT, opts.file || 'dist/standalone.html'));
  await page.waitForTimeout(400);
  return { browser, ctx, page, errs };
}
const shot = async (page, name, clip) => { await page.screenshot({ path: path.join(ROOT, 'shots', name + '.png'), clip }); };
const canvasClip = async (page) => { const b = await page.locator('#screen').boundingBox(); return { x: b.x, y: b.y, width: b.width, height: b.height }; };
module.exports = { launch, shot, canvasClip, ROOT };

if (require.main === module) {
  (async () => {
    const { browser, page, errs } = await launch();
    await shot(page, 't01_press', await canvasClip(page));
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    await shot(page, 't02_menu', await canvasClip(page));
    console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no errors');
    await browser.close();
  })();
}
