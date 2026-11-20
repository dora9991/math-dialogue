// はじめての人の流れを、3 つのタブを通して確かめる（「タップのあと、場面の切り出しへ」が、迷わずつながるか）
//   node tests/e2e-flow.cjs [dev|built]    SHOTS=フォルダ で画面の写真
//   ホーム → 動画を選ぶ → 名前と背番号 → ① 記録（タップ）→ ② 場面（押すだけで再生・続けて再生・1本の動画）→
//   ③ スタッツ（数字を押すと、その場面へ）→ 反省会の画面（「▶ 場面を見る」で、その場面へ・戻るで閉じる）→ 画像 → ホーム → 開き直す
const T = require('./helpers.cjs');
const MODE = process.argv[2] || 'dev';
const strip = (s) => String(s || '').replace(/\s+/g, '');
(async () => {
  const { browser, srv, close } = await T.launch(MODE);
  try {
    const VID = await T.video('g120.mp4', 120);
    for (const [name, vp] of [['スマホ（390×844）', { width: 390, height: 844 }], ['iPad 横（1180×820）', { width: 1180, height: 820 }]]) {
      T.section(`${MODE === 'built' ? '1ファイル版' : '開発版'}・${name}`);
      const tag = vp.width;
      const { ctx, page, errors } = await T.open(browser, srv.url, vp);
      let taps = 0;
      const click = async (sel) => { taps++; await page.click(sel); };

      // ---- 動画を選ぶ → 記録をはじめる ----
      await T.pick(page, '#scPick', VID);
      await page.waitForSelector('#scStart');
      await page.fill('#scTeamName', 'ミライ');
      await page.click('[data-preset="4-15"]');
      await page.fill('#scOppName', 'ヒガシ');
      await page.click('#scStart');
      await T.ready(page);
      await T.sleep(250);
      T.ok(await page.evaluate(() => SC.app.S.tab === 'tap' && !BT.ui.sheetOpen()) && await page.isVisible('[data-type="fg2"]') && await page.isVisible('[data-no="7"]'), '動画を選んで「記録をはじめる」と、すぐ ① 記録（プレーと背番号のボタン）');
      T.eq(await page.$$eval('#tpRoot [data-type]', (els) => els.map((e) => e.dataset.type)), ['fg2', 'fg2x', 'fg3', 'fg3x', 'ft', 'ftx', 'oreb', 'dreb', 'ast', 'stl', 'blk', 'tov', 'foul'], 'はじめから、記録するものは全部ある（シュートの成功・失敗、Oリバ・Dリバ、アシスト、スティール、ブロック、ターンオーバー、ファウル）');
      T.eq(await page.$$eval('#tpRoot [data-opp]', (els) => els.map((e) => e.textContent.trim())), ['+1', '+2', '+3'], '相手は、得点（+1・+2・+3）だけ');

      // ---- ① 記録：動画を動かしながら、プレーと背番号 ----
      const rec = async (t, a, b) => { await T.seek(page, t); await page.click(a); if (b) await page.click(b); };
      await rec(12, '[data-type="fg2"]', '[data-no="7"]');
      await rec(25, '[data-no="5"]', '[data-type="fg3x"]');          // 背番号が先でもよい
      await rec(27, '[data-type="dreb"]', '[data-no="7"]');
      await rec(40, '[data-opp="2"]');
      await rec(52, '[data-type="ast"]', '[data-no="5"]');
      await rec(53, '[data-type="fg2"]', '[data-no="7"]');
      await rec(70, '[data-type="tov"]', '[data-no="9"]');
      await rec(85, '[data-type="fg3"]', '[data-no="5"]');
      let g = await T.game(page);
      T.eq(T.plays(g).map((e) => `${e.t}:${e.team}:${e.no}:${e.type}`), ['12:0:7:fg2', '25:0:5:fg3x', '27:0:7:dreb', '40:1:null:fg2', '52:0:5:ast', '53:0:7:fg2', '70:0:9:tov', '85:0:5:fg3'], '8 つ記録（時刻は、動画の時刻）');
      T.ok(strip(await page.textContent('#scScore')) === 'ミライ7−2ヒガシ', '上の帯の得点（7 − 2）');
      await T.shot(page, `flow-${tag}-1-tap`);

      // ---- ② 場面：タブを押すだけ（終える・動画を選び直す・時刻あわせは、ない） ----
      await page.evaluate(() => { document.querySelector('#toasts').innerHTML = ''; });
      taps = 0;
      await click('#scTab-scenes');
      T.ok(await page.evaluate(() => SC.app.S.tab === 'scenes' && !BT.ui.sheetOpen() && SC.app.hasVideo()) && (await page.$$eval('#snList .sn-row', (e) => e.length)) === 8, 'タブ「② 場面」を押すと、もう 8 場面が並んでいる（小窓も、動画の選び直しも、時刻あわせもない）');
      T.ok((await page.textContent('#scTab-scenes .bdg')) === '8', 'タブに場面の数（8）');
      await click('#snList .sn-row[data-id="e2"] .sn-play');
      await page.waitForFunction(() => !SC.app.S.media.paused);
      await T.sleep(500);
      const t1 = await page.evaluate(() => SC.app.now());
      T.ok(t1 >= 2 && t1 < 14.2 && taps === 2, `記録のあと 2 回押すだけで、場面が再生される（#7 の 2P：動画の ${t1} 秒＝タップの 10 秒前から）`, { t1, taps });
      await T.shot(page, `flow-${tag}-2-scenes`);
      await page.evaluate(() => SC.app.pause());
      await page.click('#snNos [data-snno="7"]');
      T.eq(await page.$$eval('#snList .sn-row', (els) => els.map((e) => e.dataset.id)), ['e2', 'e4', 'e7'], '選手でしぼる（#7：2P・Dリバ・2P）');
      await page.click('#snPlayAll');
      await page.waitForSelector('#snReelBar:not([hidden])');
      T.ok((await page.textContent('#snReelPos')).replace(/\s+/g, '') === '1/3', '「▶ 続けて再生」（1 / 3）');
      await page.click('#snPlayAll');
      // 1本の動画にする
      await page.click('#snExport');
      await page.waitForSelector('#snExpSave', { timeout: 90000 });
      const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#snExpSave')]);
      const fs = require('fs');
      const size = fs.statSync(await dl.path()).size;
      T.ok(size > 20000 && /ミライvsヒガシ.*3場面\.(webm|mp4)$/.test(dl.suggestedFilename()), `「🎬 1本の動画にする」→ 保存（${dl.suggestedFilename()}・${Math.round(size / 1024)} KB）`, dl.suggestedFilename());

      // ---- ③ スタッツ：数字を押すと、その場面へ ----
      await page.click('#scTab-stats');
      T.ok(strip(await page.textContent('#stScore')).includes('ミライ7−2ヒガシ') && await page.isVisible('#stTable'), 'タブ「③ スタッツ」：得点と、選手の表');
      const row7 = await page.$eval('#stTable tr[data-no="7"]', (tr) => tr.textContent.replace(/\s+/g, ' '));
      T.ok(/7/.test(row7) && /2\/2/.test(row7), '#7：得点 4・2P 2/2', row7);
      await T.shot(page, `flow-${tag}-3-stats`);
      await page.click('#stTable tr[data-no="5"] [data-col="fg3"]');
      await page.waitForFunction(() => SC.app.S.tab === 'scenes');
      await T.sleep(400);
      T.eq(await page.$$eval('#snList .sn-row', (els) => els.map((e) => e.dataset.id)), ['e3', 'e9'], '#5 の 3P の数字を押すと、② 場面に、その場面だけ（3P失敗・3P成功）');
      T.ok((await page.textContent('#snTitle')).includes('#5') && (await page.textContent('#snTitle')).includes('3P') && await page.evaluate(() => !SC.app.S.media.paused || SC.app.now() > 14), 'しぼりこみの題（#5 の 3P）が出て、続けて再生が始まる', await page.textContent('#snTitle'));
      await page.evaluate(() => SC.app.pause());
      await page.click('#snClearFilter');
      T.ok((await page.$$eval('#snList .sn-row', (e) => e.length)) === 8, '「× しぼりこみを外す」で、全部の場面に戻る');

      // ---- 反省会の画面：みんなで見る → 「▶ 場面を見る」→ 戻る ----
      await page.click('#scTab-stats');
      await page.click('#stOpenReport');
      await page.waitForSelector('#stReport');
      const rs = await page.evaluate(() => { const r = document.querySelector('#stReport').getBoundingClientRect(); const n = document.querySelector('#stRScore'); return { full: r.width >= innerWidth - 1 && r.height >= innerHeight - 1, score: n.textContent.replace(/\s+/g, ''), px: Math.round(parseFloat(getComputedStyle(n.querySelector('b, .st-rnum, span') || n).fontSize)) }; });
      T.ok(rs.full && rs.score.includes('7') && rs.score.includes('2') && rs.score.includes('ミライ'), '「📺 反省会の画面」：画面いっぱいに、大きな得点', rs);
      await T.shot(page, `flow-${tag}-4-report`);
      await page.goBack();
      await T.sleep(200);
      T.ok(!(await page.$('#stReport')) && await page.evaluate(() => SC.app.S.view === 'work' && SC.app.S.tab === 'stats'), 'ブラウザの「戻る」で、反省会の画面だけが閉じる（ホームへは行かない）');
      await page.click('#stOpenReport');
      await page.waitForSelector('#stReport');
      await page.click('#stRTeam [data-tile="to"]');
      await page.waitForFunction(() => SC.app.S.tab === 'scenes' && !document.querySelector('#stReport'));
      await T.sleep(300);
      T.eq(await page.$$eval('#snList .sn-row', (els) => els.map((e) => e.dataset.id)), ['e8'], '反省会の画面の「ターンオーバー」→ 閉じて、その場面（#9 のターンオーバー）へ');
      await page.evaluate(() => SC.app.pause());

      // ---- 画像で保存 ----
      await page.click('#scTab-stats');
      const [img] = await Promise.all([page.waitForEvent('download'), page.click('#stImage')]);
      const buf = fs.readFileSync(await img.path());
      T.ok(buf.slice(1, 4).toString() === 'PNG' && buf.readUInt32BE(16) >= 1600 && /_スタッツ\.png$/.test(img.suggestedFilename()), `「🖼 画像で保存」→ PNG（幅 ${buf.readUInt32BE(16)}px・${img.suggestedFilename()}）`);
      if (T.SHOTS) fs.writeFileSync(require('path').join(T.SHOTS, `flow-${tag}-5-image.png`), buf);

      // ---- ② 場面から、記録を直す（細かい手直しは、設定でオンにしたときだけ） ----
      await page.click('#scTab-scenes');
      await page.click('#snClearFilter').catch(() => {});
      T.ok(!(await page.$('#snList .sn-edit')), 'はじめは、場面の一覧に ✎（細かい手直し）は出ない');
      await page.click('#scSettings');
      await page.click('#scSec-scenes [data-pref="sceneDetail"]');
      await page.evaluate(() => BT.ui.closeSheet());
      await page.click('#snList .sn-row[data-id="e8"] .sn-edit');
      await page.click('#snAdjEdit');
      T.ok(await page.isVisible('#tpEdit'), '設定で ✎ を出すと、場面から「記録を直す」（① 記録の、直す小窓が開く）');
      await page.evaluate(() => BT.ui.closeSheet());

      // ---- ホーム → 開き直す ----
      await page.click('#scHome');
      await page.waitForSelector('#scGames');
      T.ok(strip(await page.textContent('#scGames')).includes('ミライ7−2ヒガシ'), 'ホームの「これまでの試合」に出る');
      await page.click('#scGames .sc-game');
      T.ok(await page.evaluate(() => SC.app.S.tab === 'stats' && !SC.app.hasVideo()) && await page.isVisible('#stTable'), '開くと、動画なしでスタッツ');
      await page.click('#scTab-scenes');
      T.ok(await page.isVisible('#snBanner') && (await page.$$eval('#snList .sn-row', (e) => e.length)) === 8, '② 場面：一覧は見られる・「🎬 動画を選ぶと、場面を見られます」');
      await T.pick(page, '#snPickVideo', VID);
      await T.ready(page);
      await T.sleep(300);
      await page.click('#snList .sn-row[data-id="e2"] .sn-play');
      await page.waitForFunction(() => !SC.app.S.media.paused);
      T.ok(!(await page.isVisible('#snBanner')), '同じ動画を選ぶと、そのまま場面を再生できる');
      await page.evaluate(() => SC.app.pause());
      T.ok(errors.length === 0, 'ページのエラーなし', errors);
      await ctx.close();
    }
  } catch (e) { T.failed(e); } finally { await close(); }
  T.done();
})();
