const { launch } = require('./play.js');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const { browser, page, errs } = await launch({ touch: true, viewport: { width: 390, height: 844 }, dpr: 2 });
  await page.touchscreen.tap(200, 200); await sleep(300);
  await page.evaluate(() => { const M = window.__mecha; M.Game.go('online'); });
  await sleep(300);
  await page.evaluate(() => { const M = window.__mecha; M.SceneOnline.state = 'joinInput'; M.SceneOnline.showLobby(true, false); });
  await sleep(400);
  await page.screenshot({ path: 'shots/p_online_join.png' });
  const info = await page.evaluate(() => ({ scrollW: document.documentElement.scrollWidth, innerW: innerWidth, lobbyBottom: Math.round(document.getElementById('lobby').getBoundingClientRect().bottom), touchTop: Math.round(document.getElementById('touch').getBoundingClientRect().top) }));
  console.log(JSON.stringify(info), errs.length ? 'ERRORS ' + errs.join('|') : 'no errors');
  await browser.close();
})();
