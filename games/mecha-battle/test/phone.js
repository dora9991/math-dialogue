const { launch, shot } = require('./play.js');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  for (const [name, vp] of [['portrait', { width: 390, height: 844 }], ['landscape', { width: 844, height: 390 }]]) {
    const { browser, page, errs } = await launch({ touch: true, viewport: vp, dpr: 2 });
    await page.touchscreen.tap(200, 200); await sleep(400);          // タップで開始
    await page.screenshot({ path: 'shots/p_' + name + '_menu.png' });
    // 対戦に入る（アーケード → ロボを決定）
    await page.evaluate(() => { const G = window.__mecha.Game; G.go('fight', { chars: [0, 2], lvl: 1, mode: 'vs', versus: false }); });
    await sleep(3200);
    await page.screenshot({ path: 'shots/p_' + name + '_fight.png' });
    const info = await page.evaluate(() => { const r = document.getElementById('screen').getBoundingClientRect(); const t = document.getElementById('touch'); return { canvas: [Math.round(r.width), Math.round(r.height)], touchHidden: t.hidden, scrollW: document.documentElement.scrollWidth, innerW: window.innerWidth }; });
    console.log(name, JSON.stringify(info), errs.length ? 'ERRORS: ' + errs.join('|') : 'no errors');
    await browser.close();
  }
})();
