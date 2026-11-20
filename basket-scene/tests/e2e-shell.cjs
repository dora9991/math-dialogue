// 土台の確認：ホーム → 動画を選ぶ → 試合を作る → 動画つきの作業の画面（再生・位置のバー・タブ・ピリオド・設定）→ ホームに戻る → 開き直す
//   node tests/e2e-shell.cjs [dev|built]    SHOTS=フォルダ で画面の写真
const T = require('./helpers.cjs');
const MODE = process.argv[2] || 'dev';
(async () => {
  const { browser, srv, close } = await T.launch(MODE);
  try {
    const VID = await T.video('g120.mp4', 120);
    T.section(`${MODE === 'built' ? '1ファイル版' : '開発版'}・スマホ（390×844）`);
    const { ctx, page, errors } = await T.open(browser, srv.url, { width: 390, height: 844 });
    T.ok(await page.isVisible('#scPick') && (await page.textContent('#scPick')).includes('試合の動画を選ぶ'), 'ホーム：大きな「🎬 試合の動画を選ぶ」');
    T.ok((await page.textContent('.sc-steps')).includes('① 記録') && (await page.textContent('.sc-steps')).includes('③ スタッツ'), 'ホーム：流れ（① 記録 → ② 場面 → ③ スタッツ）');
    T.ok(!(await page.$('#scGames')), 'はじめは、試合の一覧なし');
    await T.shot(page, 'shell-home');
    await T.pick(page, '#scPick', VID);
    await page.waitForSelector('#scStart');
    T.ok((await page.textContent('.sc-picked')).includes('g120.mp4'), '動画を選ぶと「記録する試合」（選んだ動画の名前）');
    await page.fill('#scTeamName', 'ミライ');
    await page.click('[data-preset="4-15"]');
    T.ok((await page.textContent('#scNosCount')) === '12人', '背番号「4〜15」→ 12人');
    await page.fill('#scOppName', 'ヒガシ');
    await T.shot(page, 'shell-newgame');
    await page.click('#scStart');
    await T.ready(page);
    await T.sleep(300);
    let g = await T.game(page);
    T.ok(g.mode === 'video' && g.src.name === 'g120.mp4' && Math.abs(g.src.duration - 120) < 0.5 && g.teams[0].players.length === 12 && g.teams[1].name === 'ヒガシ' && g.teams[1].players.length === 0, '試合ができる（動画を見ながらの記録・自分 12人・相手は名前だけ）', { mode: g.mode, src: g.src });
    T.eq(g.events.map((e) => [e.type, e.t, e.period]), [['period', 0, 1]], 'はじめのピリオド（1Q・動画の 0 秒から）');
    T.ok(await page.evaluate(() => SC.app.S.view === 'work' && SC.app.S.tab === 'tap' && document.querySelector('#scTab-tap').classList.contains('on')), '作業の画面：タブは「① 記録」から');
    T.eq(await page.$$eval('.sc-tab', (els) => els.map((e) => e.textContent.replace(/\s+/g, ''))), ['①記録', '②場面', '③スタッツ'], 'タブ：① 記録・② 場面・③ スタッツ');
    T.ok((await page.textContent('#scScore')).replace(/\s+/g, '') === 'ミライ0−0ヒガシ' && (await page.textContent('#scPeriod')) === '1Q', '上の帯：チームの名前と得点・ピリオド');
    const f = await T.fits(page, '#scStage');
    T.ok(!f.hscroll && f.inside && f.box[3] > 150, '動画が画面に収まる（横にはみ出さない）', f);
    await T.shot(page, 'shell-work');
    // 再生・止める・位置
    await page.click('#scPlay');
    await page.waitForFunction(() => !SC.app.S.media.paused);
    await T.sleep(700);
    await page.click('#scPlay');
    const t1 = await page.evaluate(() => SC.app.now());
    T.ok(t1 > 0.3 && await page.evaluate(() => SC.app.S.media.paused), `▶ で再生・⏸ で止まる（${t1} 秒）`);
    await page.click('#scFwd');
    await T.sleep(250);
    T.ok(Math.abs((await page.evaluate(() => SC.app.now())) - (t1 + 5)) < 0.3, '「+5」で 5 秒すすむ');
    await T.seek(page, 60);
    T.ok((await page.textContent('#scTime')).startsWith('1:00 / 2:00'), '時刻の表示（1:00 / 2:00）', await page.textContent('#scTime'));
    const box = await page.locator('#scSeek').boundingBox();
    await page.mouse.click(box.x + box.width * 0.25, box.y + box.height / 2);
    await T.sleep(300);
    T.ok(Math.abs((await page.evaluate(() => SC.app.now())) - 30) < 1.5, '位置のバーを押すと、その所へ（1/4 → 0:30 あたり）', await page.evaluate(() => SC.app.now()));
    // 区間の再生（場面の再生の土台）
    const res = await page.evaluate(async () => { const r = await SC.app.playRange(10, 11.2); return { r, t: SC.app.now(), paused: SC.app.S.media.paused }; });
    T.ok(res.r === 'end' && res.paused && Math.abs(res.t - 11.2) < 0.4, 'playRange：10 秒から再生して 11.2 秒で止まる', res);
    const res2 = await page.evaluate(async () => { const p = SC.app.playRange(20, 30); await new Promise((r) => setTimeout(r, 500)); SC.app.stopRange(); return p; });
    T.ok(res2 === 'stop', 'stopRange：途中でやめると stop');
    await page.evaluate(() => SC.app.pause());
    // ピリオド
    await T.seek(page, 62);
    await page.click('#scPeriod');
    await page.click('#scNextPeriod');
    g = await T.game(page);
    T.ok(g.events.some((e) => e.type === 'period' && e.period === 2 && e.t === 62) && (await page.textContent('#scPeriod')) === '2Q', '「ここから 2Q」→ 動画の 1:02 から 2Q');
    await T.seek(page, 30);
    T.ok((await page.textContent('#scPeriod')) === '1Q', '動画を戻すと、その時刻のピリオド（1Q）');
    T.ok(await page.$$eval('.sc-seek .marks i.per', (e) => e.length) === 1, '位置のバーに、ピリオドの線');
    // タブ・記録の知らせ
    await page.click('#scTab-scenes');
    T.ok(await page.evaluate(() => SC.app.S.tab === 'scenes' && !document.querySelector('#scPane-scenes').hidden && document.querySelector('#scPane-tap').hidden), 'タブを押すと、中身が切りかわる（動画はそのまま）');
    T.ok(await page.evaluate(() => SC.app.hasVideo()), 'タブを切りかえても、動画はつながったまま');
    await page.click('#scTab-tap');
    await page.evaluate(() => { const g = SC.app.S.game; [[5, 'fg2'], [12, 'fg3'], [20, 'reb']].forEach(([t, type]) => BT.addEvent(g, { t, type, team: 0, no: '7' })); BT.addEvent(g, { t: 25, type: 'fg2', team: 1, no: null }); SC.app.save(); });
    T.ok((await page.textContent('#scScore')).replace(/\s+/g, '') === 'ミライ5−2ヒガシ', '記録すると、上の帯の得点が変わる（5 − 2）');
    T.eq(await page.evaluate(() => [document.querySelectorAll('.sc-seek .marks i.me').length, document.querySelectorAll('.sc-seek .marks i.opp').length]), [3, 1], '位置のバーに、記録の印（自分 3・相手 1）');
    T.ok((await page.textContent('#toasts')).includes('「② 場面」で、すぐ見られます'), '3 つ記録すると、1回だけ「記録した場面は ② 場面で、すぐ見られます」');
    await page.click('#toasts .tbtn');
    T.ok(await page.evaluate(() => SC.app.S.tab === 'scenes'), 'その「見る」で、② 場面へ');
    // 設定（チーム・色・データ）
    await page.click('#scSettings');
    T.ok(await page.isVisible('#scSec-team') && await page.isVisible('#scSec-theme') && await page.isVisible('#scSec-data'), '設定：チーム・背番号／画面の色／データ');
    await page.fill('[data-pname="7"]', 'たけし');
    await page.locator('[data-pname="7"]').blur();
    await page.click('#scSec-theme [data-theme="dark"]');
    T.ok(await page.evaluate(() => document.documentElement.dataset.theme === 'dark' && SC.app.S.game.teams[0].players.find((p) => p.no === '7').name === 'たけし' && JSON.parse(localStorage.getItem('bscene:team')).players.find((p) => p.no === '7').name === 'たけし'), '名前を入れる・暗い画面にする（自分のチームは、次の試合のために覚える）');
    await T.shot(page, 'shell-settings');
    await page.evaluate(() => BT.ui.closeSheet());
    // ホームへ → 一覧 → 開き直す（動画なし：スタッツから。動画を選ぶと、見ていた所から）
    await T.seek(page, 44);
    await page.click('#scHome');
    await page.waitForSelector('#scGames');
    T.ok((await page.textContent('#scGames')).replace(/\s+/g, '').includes('ミライ5−2ヒガシ') && (await page.textContent('#scGames')).includes('4件の記録'), 'ホームに戻ると、これまでの試合に出る');
    await page.click('#scGames .sc-game');
    T.ok(await page.evaluate(() => SC.app.S.view === 'work' && SC.app.S.tab === 'stats' && !SC.app.hasVideo()) && await page.isVisible('#scPickHere'), '試合を押すと、動画なしで開く（③ スタッツから・「🎬 この試合の動画を選ぶ」）');
    await T.pick(page, '#scPickHere', VID);
    await T.ready(page);
    await T.sleep(300);
    T.ok(Math.abs((await page.evaluate(() => SC.app.now())) - 44) < 0.3, '同じ動画を選ぶと、見ていた所（0:44）から');
    await page.click('#scHome');
    await page.waitForSelector('#scPick');
    // 同じ動画をホームで選ぶ → 続きを聞く
    await T.pick(page, '#scPick', VID);
    await page.waitForSelector('#scResume');
    await page.click('#scResume');
    await T.ready(page);
    T.ok(await page.evaluate(() => SC.app.S.tab === 'tap' && SC.app.S.game.events.length === 6), 'ホームで同じ動画を選ぶと「この動画で記録した試合があります」→ 続きを開く');
    await page.goBack();
    await page.waitForSelector('#scPick');
    T.ok(await page.evaluate(() => SC.app.S.view === 'home'), 'ブラウザの「戻る」でホームへ');
    T.ok(errors.length === 0, 'ページのエラーなし', errors);
    await ctx.close();

    T.section('画面の大きさ');
    for (const [name, vp] of [['小さなスマホ 320×568', { width: 320, height: 568 }], ['スマホの横 844×390', { width: 844, height: 390 }], ['iPad 横 1180×820', { width: 1180, height: 820 }], ['iPad 縦 820×1180', { width: 820, height: 1180 }]]) {
      const P = await T.open(browser, srv.url, vp);
      await T.start(P.page, VID, { name: 'ミライ', opp: 'ヒガシ' });
      const r = await P.page.evaluate(() => {
        const b = (s) => document.querySelector(s).getBoundingClientRect();
        const st = b('#scStage'), side = b('.sc-side'), bar = b('.sc-bar'), ctl = b('.sc-ctl'), tabs = b('.sc-tabs'), pane = b('#scPane-tap');
        const kids = Array.from(document.querySelectorAll('.sc-bar > *')).map((e) => e.getBoundingClientRect());
        let over = 0; for (let i = 1; i < kids.length; i++) over = Math.max(over, kids[i - 1].right - kids[i].left);
        return { hscroll: document.documentElement.scrollWidth > innerWidth + 1, vscroll: document.documentElement.scrollHeight > innerHeight + 1, wide: SC.app.wide(), sideBySide: side.left >= st.right - 1,
          stage: [Math.round(st.width), Math.round(st.height)], pane: [Math.round(pane.width), Math.round(pane.height)], barOver: Math.round(over), ctlIn: ctl.right <= innerWidth + 0.5 && ctl.bottom <= innerHeight + 0.5, tabsIn: tabs.right <= innerWidth + 0.5 };
      });
      T.ok(!r.hscroll && !r.vscroll && r.barOver <= 0 && r.ctlIn && r.tabsIn && r.stage[1] >= 120 && r.pane[1] >= 150, `${name}：はみ出さない・上の帯が重ならない（動画 ${r.stage.join('×')}・タブの中身 ${r.pane.join('×')}${r.sideBySide ? '・左右に並ぶ' : '・上下に並ぶ'}）`, r);
      await T.shot(P.page, 'shell-' + vp.width + 'x' + vp.height);
      T.ok(P.errors.length === 0, `${name}：ページのエラーなし`, P.errors);
      await P.ctx.close();
    }
  } catch (e) { T.failed(e); } finally { await close(); }
  T.done();
})();
