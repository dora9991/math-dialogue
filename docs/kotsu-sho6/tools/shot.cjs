process.env.PORT = '8867';
const L = require('../time/t_lib.cjs');
const strip = e => { const c = e.cloneNode(true); c.querySelectorAll('rt,rp').forEach(x => x.remove()); return c.textContent.trim(); };
(async () => {
  const b = await L.launch();
  const st = { profile: { name: 'テスト', grade: 'E6', goal: { tier: 'std', track: '', uni: '' } } };
  let p = await L.open(b, { viewport: { width: 390, height: 800 }, state: st, routeState: { name: 'hub', unitId: 'E5-wariai' } });
  await L.run(p, 2000);
  await p.evaluate(() => document.querySelector('.tp-list').scrollIntoView({ block: 'start' })); await L.run(p, 300);
  await p.screenshot({ path: '/home/user/math-dialogue/docs/kotsu-sho6/shot-list.png' });
  await p.context().close();
  for (let k = 0; k < 10; k++) {
    p = await L.open(b, { viewport: { width: 390, height: 800 }, state: st, routeState: { name: 'hub', unitId: 'E5-wariai' } });
    await L.run(p, 2000);
    await p.evaluate((s) => { const strip = eval(s); const r = [...document.querySelectorAll('.tp-row')].find(r => strip(r.querySelector('.tp-name')) === '円グラフの 読み方'); r.querySelector('.tp-b.L1').click(); }, strip.toString());
    await p.waitForSelector('.qcard', { timeout: 10000 }); await L.run(p, 800);
    if (await p.evaluate(() => !!document.querySelector('.qcard svg'))) { await p.screenshot({ path: '/home/user/math-dialogue/docs/kotsu-sho6/shot-quiz.png' }); console.log('quiz shot', k); break; }
    await p.context().close();
  }
  await b.close();
})();
