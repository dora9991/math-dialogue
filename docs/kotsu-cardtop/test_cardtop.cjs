// 「カードで学ぶ」：下まで読んでから つぎへ／まえ／番号 を押すと、新しいカードが上から出るか
process.env.PORT = process.env.PORT || '8859';
const L = require('../time/t_lib.cjs');
let fail = 0; const ok = (n, c, i) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + n + (i !== undefined ? '  ' + JSON.stringify(i) : '')); if (!c) fail++; };
const pos = (p) => p.evaluate(() => { const scd = document.querySelector('.scd'), h2 = document.querySelector('.scd-card h2'); return { winY: Math.round(window.scrollY), scdTop: Math.round(scd.getBoundingClientRect().top), h2Top: Math.round(h2.getBoundingClientRect().top), title: h2.innerText.slice(0, 24) }; });
const toBottom = (p) => p.evaluate(() => document.querySelector('.scd-foot').scrollIntoView({ block: 'end' }));
const click = (p, sel, re) => p.evaluate(([sel, re]) => { const b = [...document.querySelectorAll(sel)].find(x => new RegExp(re).test(x.innerText)); b.click(); return !!b; }, [sel, re]);
(async () => {
  const b = await L.launch();
  for (const [unit, grade] of [['J1-d1', 'J1'], ['J2-g2c1u1', 'J2'], ['J2-g2c2u3', 'J2']]) {
    for (const clock of [true, false]) {
      const wait = (ms) => clock ? L.run(p, ms) : p.waitForTimeout(ms);
      var p = await L.open(b, { viewport: { width: 390, height: 760 }, clock: clock ? undefined : false, state: { profile: { name: 'テスト', grade, goal: { tier: 'std', track: '', uni: '' } } }, routeState: { name: 'sum', unitId: unit } });
      await wait(1500); await p.waitForSelector('.scd-card', { timeout: 8000 });
      const tag = `${unit}${clock ? '（時計とめ）' : ''}`;
      // 1) 上のまま つぎへ → ページは動かない（上にいるので）
      let a = await pos(p); await click(p, '.scd-foot button', 'わかった'); await wait(800); let c = await pos(p);
      ok(`${tag}：上のまま つぎへ → 位置はそのまま`, c.winY === a.winY, { before: a.winY, after: c.winY });
      // 2) 下まで読む → つぎへ → カードの見出しが画面の上に見える
      await toBottom(p); await wait(300); const mid = await pos(p);
      await click(p, '.scd-foot button', 'わかった'); await wait(800); c = await pos(p);
      ok(`${tag}：下まで読んで つぎへ → 上から（見出しが画面内）`, mid.winY > 0 && c.scdTop >= -2 && c.h2Top >= 0 && c.h2Top < 300, { 読んだ位置: mid.winY, ...c });
      // 3) 下まで読む → まえ → 上から
      await toBottom(p); await wait(300);
      await click(p, '.scd-foot button', 'まえ'); await wait(800); c = await pos(p);
      ok(`${tag}：下まで読んで まえ → 上から`, c.scdTop >= -2 && c.h2Top >= 0 && c.h2Top < 300, c);
      // 4) 下まで読む → 番号（まとめ）を押す → 上から
      await toBottom(p); await wait(300);
      await p.evaluate(() => { const k = document.querySelector('.scd-chip.fin'); k.scrollIntoView({ block: 'end' }); });
      await toBottom(p); await wait(200);
      await p.evaluate(() => document.querySelector('.scd-chip.fin').click()); await wait(800); c = await pos(p);
      ok(`${tag}：下まで読んで「まとめ」の番号 → 上から`, c.scdTop >= -2 && /まとめ/.test(c.title), c);
      ok(`${tag}：コンソールのエラーなし`, p.__errs.length === 0, p.__errs.slice(0, 3));
      await p.context().close();
    }
  }
  await b.close(); console.log('FAILS', fail); process.exit(fail ? 1 : 0);
})();
