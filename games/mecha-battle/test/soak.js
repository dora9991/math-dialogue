// 耐久テスト：全キャラ組み合わせをCPU同士で高速に戦わせ、描画エラーを探す
const { launch } = require('./play.js');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const { browser, page, errs } = await launch();
  const ev = (f, ...a) => page.evaluate(f, ...a);
  let played = 0, i = 0;
  const pairs = [];
  for (let a = 0; a < 8; a++) pairs.push([a, (a * 3 + 1) % 8], [a, (a + 4) % 8]);
  const t0 = Date.now();
  for (const [a, b] of pairs) {
    if (Date.now() - t0 > 150000) break;
    await ev(([a, b]) => { const G = window.__mecha.Game; G.speed = 12; G.go('fight', { chars: [a, b], cpu0: true, lvl: 3, versus: false, mode: 'vs' }); }, [a, b]);
    // 1ラウンド分 or 8秒で次へ
    const t1 = Date.now();
    while (Date.now() - t1 < 8000) {
      const s = await ev(() => { const m = window.__mecha.Game.scene.m; return m ? m.phase + ':' + m.round : 'x'; });
      if (s.startsWith('over') ) break;
      await sleep(100);
    }
    played++;
    if (errs.length) break;
  }
  const frames = await ev(() => window.__mecha.Game.fr);
  console.log('matches visited:', played, 'ticks:', frames);
  console.log(errs.length ? 'ERRORS:\n' + errs.slice(0, 6).join('\n') : 'no errors');
  await browser.close();
})();
