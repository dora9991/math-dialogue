#!/usr/bin/env node
/* 動作の検査：テスト用の「バスケ動画」フォルダ（ffmpeg でつくる短い動画つき）を一時的につくり、
   ヘッドレス Chromium で、ライブラリ → 動画 → 印 → 今日の練習 → 実施モード → 設定 を一通り操作して、画面の画像（PNG）も書き出す。
   使い方：  NODE_PATH=$(npm root -g) node tools/check.cjs [画像の出力先フォルダ]
   必要なもの：playwright（npm i -g playwright。Chromium は PLAYWRIGHT_BROWSERS_PATH にあればそれを使う）、python3
             ffmpeg があれば、動画の再生・見どころへのジャンプも調べる（なければその部分は飛ばす）
   調べること：①エラーが出ないか　②サンプル表示／library.js 表示の両方　③印・計画・タイマーが動くか　④保存が残るか */
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawnSync } = require('child_process');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const outDir = path.resolve(process.argv[2] || path.join(root, 'tools', '_out'));
fs.mkdirSync(outDir, { recursive: true });
const failures = [];
const ok = (cond, msg) => { console.log((cond ? '  ✓ ' : '  ✗ ') + msg); if (!cond) failures.push(msg); };
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  /* ---- 準備：サンプル表示用と、library.js 表示用のフォルダ ---- */
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'basket-navi-check-'));
  const sampleDir = path.join(tmp, 'sample'), od = path.join(tmp, 'バスケ動画');
  fs.mkdirSync(sampleDir, { recursive: true });
  for (const d of ['指導法', '戦術/ピック＆ロール', 'トレーニング/ドリル']) fs.mkdirSync(path.join(od, d), { recursive: true });
  const bundle = (to) => spawnSync(process.execPath, [path.join(__dirname, 'bundle.cjs'), to], { stdio: 'pipe' });
  ok(bundle(path.join(sampleDir, 'basket-navi.html')).status === 0, 'bundle.cjs で 1 ファイルにまとめられる');
  ok(bundle(path.join(od, 'basket-navi.html')).status === 0, 'bundle.cjs（動画フォルダ用）');

  const hasFfmpeg = spawnSync('ffmpeg', ['-version']).status === 0;
  let withVideo = false;
  if (hasFfmpeg) {
    const f = path.join(od, '戦術', 'ピック＆ロール', '02_ピック＆ロール入門.webm');
    const r = spawnSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'testsrc=duration=45:size=640x360:rate=15', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=45', '-c:v', 'libvpx', '-b:v', '200k', '-g', '15', '-c:a', 'libvorbis', '-shortest', f]);
    withVideo = r.status === 0;
    if (withVideo) {
      fs.copyFileSync(f, path.join(od, '指導法', '01_声かけの基本.webm'));
      fs.copyFileSync(f, path.join(od, 'トレーニング', 'ドリル', '03_ハンドリング ドリル.webm'));
    }
  }
  if (!withVideo) console.log('（ffmpeg がないので、動画の再生まわりは飛ばす）');
  const scan = spawnSync('python3', ['-I', path.join(__dirname, 'make_library.py'), 'scan', od, '--probe'], { encoding: 'utf8' });
  ok(scan.status === 0, 'make_library.py scan で library.js ができる' + (scan.status ? '：' + scan.stderr : ''));
  if (scan.status !== 0) { console.log(scan.stdout, scan.stderr); process.exit(1); }
  // 要約・見どころ・URL を足す（手で書いた想定）
  const libPath = path.join(od, 'library.js');
  const txt = fs.readFileSync(libPath, 'utf8'), lib = JSON.parse(txt.slice(txt.indexOf('{'), txt.lastIndexOf('}') + 1));
  const pr = lib.videos.find(v => v.title.includes('ピック'));
  pr.summary = 'スクリーンの角度と、ボールマンの使い方。\n\n・合図は声と目\n・ロールは低く';
  pr.url = 'https://example.com/share/pr';
  pr.tags.push('オフェンス');
  pr.clips = [{ at: 5, title: 'スクリーンの角度', type: 'point', note: 'ディフェンスの足の向きを見る' }, { at: 20, title: '2対2ドリル', type: 'drill', minutes: 12, note: '攻守交代で' }];
  const ghost = { id: 'v-miss', title: '【ファイルなし】消えた動画', category: 'tactics', file: '戦術/ない.mp4', tags: [], summary: '', clips: [{ at: 3, title: '見どころ', type: 'drill', minutes: 5 }] };
  lib.videos.push(ghost);
  fs.writeFileSync(libPath, 'window.BASKET_LIBRARY = ' + JSON.stringify(lib) + ';');

  let browser;
  try { browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] }); }
  catch (e) { browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium/chrome-linux/chrome', args: ['--autoplay-policy=no-user-gesture-required'] }); }
  const errors = [];
  const watch = page => {
    page.on('pageerror', e => errors.push('pageerror: ' + e.message));
    page.on('console', m => { if (m.type() === 'error' && !/library\.js|ERR_FILE_NOT_FOUND/.test(m.text() + (m.location().url || ''))) errors.push('console: ' + m.text()); });
    page.on('dialog', d => d.accept());
  };
  const shot = (page, name, full) => page.screenshot({ path: path.join(outDir, name), fullPage: !!full });
  const text = (page, sel) => page.locator(sel).first().innerText();

  /* ---- A. サンプル表示（library.js なし）：デスクトップ ---- */
  console.log('A. サンプル表示');
  {
    const ctx = await browser.newContext({ viewport: { width: 1100, height: 900 }, acceptDownloads: true });
    const page = await ctx.newPage(); watch(page);
    await page.goto('file://' + path.join(sampleDir, 'basket-navi.html'));
    await page.waitForSelector('.card');
    ok((await page.locator('.card').count()) === 3, 'サンプルの動画が3本並ぶ');
    ok(await page.locator('.banner').first().isVisible(), '「サンプルを表示」の案内が出る');
    await shot(page, 'A1-library-desktop.png');
    await page.click('.seg button[data-v="tactics"]');
    ok((await page.locator('.card').count()) === 1, '分類「戦術」で1本に絞れる');
    await page.click('.seg button[data-v="all"]');
    await page.fill('#q', 'ハンドリング');
    ok((await page.locator('.card').count()) === 1, '検索「ハンドリング」で1本に絞れる');
    await page.fill('#q', '');
    await page.click('.card >> nth=2');
    await page.waitForSelector('.player.none');
    ok(true, '動画ファイルなしの項目は、案内のパネルが出る（エラーにならない）');
    ok((await page.locator('#clips .clip').count()) === 3, 'サンプルの見どころが3つ出る');
    // 印をつける
    await page.click('[data-act=mark]');
    await page.fill('#markForm [name=at]', '1:05');
    await page.selectOption('#markForm [name=type]', 'drill');
    await page.fill('#markForm [name=title]', 'テスト印（ステップ）');
    await page.fill('#markForm [name=minutes]', '7');
    await page.fill('#markForm [name=note]', 'メモです');
    await page.click('#markForm [type=submit]');
    ok((await page.locator('#clips .clip').count()) === 4, '「ここに印をつける」で見どころが1つ増える');
    ok((await page.locator('#clips .clip .mine').count()) === 1, '自分の印には目印が付く');
    await page.click('#clips .clip:has-text("テスト印") [data-act=markedit]');
    ok(await page.locator('#markForm').isVisible() && (await page.inputValue('#markForm [name=title]')) === 'テスト印（ステップ）', '自分の印を編集できる（フォームに中身が入る）');
    await page.click('#markForm [type=submit]');
    await page.click('[data-act=mark]'); await page.fill('#markForm [name=title]', '消す印'); await page.click('#markForm [type=submit]');
    await page.click('#clips .clip:has-text("消す印") [data-act=markedit]');
    await page.click('[data-act=markdel]');
    ok((await page.locator('#clips .clip:has-text("消す印")').count()) === 0 && (await page.locator('#clips .clip').count()) === 4, '自分の印を削除できる');
    // 計画へ
    await page.click('#clips .clip >> nth=0 >> [data-act=addplan]');
    await page.click('#clips .clip:has-text("テスト印") [data-act=addplan]');
    ok((await text(page, '#badge')) === '2', 'タブのバッジに計画のメニュー数（2）が出る');
    await page.click('.tabs a[data-tab=plan]');
    await page.waitForSelector('#items .pi');
    ok((await page.locator('#items .pi').count()) === 2, '今日の練習に2つ入っている');
    const before = await text(page, '#meter .sum1');
    await page.click('#items .pi >> nth=1 >> [data-act=pmin][data-d="5"]');
    const after = await text(page, '#meter .sum1');
    ok(before !== after, `分を＋5すると合計が変わる（${before} → ${after}）`);
    await page.click('[data-act=free]');
    ok((await page.locator('#items .pi').count()) === 3, '自由入力でメニューを足せる');
    await page.fill('#items .pi >> nth=2 >> .pin.t', 'クールダウン');
    await page.click('#items .pi >> nth=2 >> [data-act=pup]');
    ok((await page.locator('#items .pi >> nth=1 >> .pin.t').inputValue()) === 'クールダウン', '↑で順番を入れかえられる');
    await page.fill('[data-pf=start]', '16:30');
    ok((await text(page, '#items .pi >> nth=0 >> .ptime')).startsWith('16:30'), '開始時刻を入れると時刻表示になる');
    await page.fill('[data-pf=limit]', '20');
    ok(await page.locator('#meter.over').count() === 1, '使える時間をこえると「オーバー」表示になる');
    await page.fill('[data-pf=limit]', '90');
    ok((await page.locator('.print-only tbody tr').count()) === 3, '印刷用の表が、編集した内容（3件）に追従する');
    ok((await page.locator('#planSel option:checked').innerText()).includes('32分'), '計画の選択欄の分数も追従する');
    await page.click('[data-act=pick]');
    await page.waitForSelector('dialog[open] #picklist .pick');
    await page.fill('#pickq', 'ピック');
    ok((await page.locator('#picklist .pick').count()) === 2, '選択窓で、練習メニューを検索できる');
    await page.click('#picklist .pick >> nth=0 >> [data-act=pickadd]');
    await page.click('dialog [data-act=closedlg]');
    ok((await page.locator('#items .pi').count()) === 4, '選択窓から計画に追加できる');
    await page.click('#items .pi >> nth=3 >> [data-act=pdel]');
    ok((await page.locator('#items .pi').count()) === 3, '✕でメニューを消せる');
    await page.click('[data-act=copy]');
    const copied = await page.waitForFunction(() => /コピー(しました|できませんでした)/.test(document.querySelector('#toast').textContent), null, { timeout: 4000 }).then(() => true, () => false);
    ok(copied && /コピーしました/.test(await text(page, '#toast')), 'テキストのコピーが動く（' + (await text(page, '#toast')) + '）');
    await shot(page, 'A2-plan-desktop.png', true);
    // 印刷表示
    await page.emulateMedia({ media: 'print' });
    ok(await page.locator('.print-only table.sheet').isVisible(), '印刷表示では表（A4用）が出る');
    ok(!(await page.locator('.screen-only').isVisible()), '印刷表示では操作パーツが消える');
    await shot(page, 'A3-plan-print.png', true);
    await page.emulateMedia({ media: 'screen' });
    // 実施モード（3つ目は0分にして、時間切れの表示も調べる）
    await page.fill('#items .pi >> nth=2 >> .m', '0');
    await sleep(700);
    await page.click('[data-act=run]');
    await page.waitForSelector('#timer');
    ok((await page.locator('#toast.on').count()) === 0, '画面を移るとトーストは消える');
    ok(/^\d\d:\d\d$/.test(await text(page, '#timer')), '実施モードで大きなタイマーが出る（' + (await text(page, '#timer')) + '）');
    await shot(page, 'A4-run-desktop.png');
    const t0 = await text(page, '#timer');
    await page.click('[data-act=rtoggle]');
    await page.waitForFunction(s => document.querySelector('#timer').textContent !== s, t0, { timeout: 4000 });
    ok(true, 'スタートするとタイマーが減っていく');
    await page.click('[data-act=radj][data-d="1"]');
    await page.click('[data-act=rtoggle]');   // 一時停止
    ok(/スタート|もう一度/.test(await text(page, '[data-act=rtoggle]')), '一時停止できる');
    await page.reload();
    await page.waitForSelector('#timer');
    ok(true, '実施中に再読み込みしても実施モードにもどる');
    await page.click('[data-act=rnext]'); await page.click('[data-act=rnext]');
    await page.click('[data-act=rtoggle]');
    await page.waitForSelector('.timer.up', { timeout: 4000 });
    ok(/もう一度/.test(await text(page, '[data-act=rtoggle]')), '時間になると赤くなり、「もう一度」が出る');
    await page.click('[data-act=rnext]');
    await page.waitForSelector('#review');
    await page.fill('#review', 'ステップは良かった');
    await shot(page, 'A5-run-finish.png');
    await page.click('[data-act=rdone]');
    await page.waitForSelector('#items .pi');
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('basketNavi.v1')));
    ok(Object.keys(saved.done).length === 2 && saved.plans[0].review === 'ステップは良かった', '実践の回数とふりかえりが保存される');
    // 設定とバックアップ
    await page.click('.tabs a[data-tab=settings]');
    await page.waitForSelector('.set');
    await shot(page, 'A6-settings-desktop.png', true);
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click('[data-act=dlbackup]')]);
    const bkPath = path.join(tmp, 'backup.json');
    await dl.saveAs(bkPath);
    const bk = JSON.parse(fs.readFileSync(bkPath, 'utf8'));
    ok(bk.kind === 'basket-navi-backup' && bk.data.plans.length === 1, 'バックアップを書き出せる');
    // 再読み込みしても残る
    await page.goto('file://' + path.join(sampleDir, 'basket-navi.html') + '#/plan');
    await page.waitForSelector('#items .pi');
    ok((await page.locator('#items .pi').count()) === 3, '再読み込みしても計画が残る');
    // 記録を消して、バックアップから戻す
    await page.click('.tabs a[data-tab=settings]');
    await page.click('[data-act=wipe]');
    ok((await page.evaluate(() => JSON.parse(localStorage.getItem('basketNavi.v1')).plans.length)) === 0, '「すべての記録を消す」が動く');
    await page.setInputFiles('#ldbackup', bkPath);
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('basketNavi.v1')).plans.length === 1, null, { timeout: 4000 });
    ok(true, 'バックアップから記録を読み込める');
    // library.js の取り込み（スマホ・タブレット向け）
    await page.goto('file://' + path.join(sampleDir, 'basket-navi.html') + '#/settings');
    await page.waitForSelector('.set');
    // 日本語のフォルダ名を含むパスだと setInputFiles が反応しないことがあるので、中身を直接わたす（実際の操作はブラウザがファイルを読むので影響しない）
    await page.setInputFiles('#ldlib', { name: 'library.js', mimeType: 'text/javascript', buffer: fs.readFileSync(libPath) });
    await page.waitForFunction(() => /取り込みました/.test(document.querySelector('#toast').textContent), null, { timeout: 4000 });
    await page.click('.tabs a[data-tab=lib]');
    await page.waitForSelector('.card');
    ok((await page.locator('.card').count()) === lib.videos.length && (await page.locator('.banner').count()) === 0, '取り込んだライブラリが一覧に出る（サンプルの案内は消える）');
    await page.click('.tabs a[data-tab=settings]');
    await page.click('[data-act=dellib]');
    await page.click('.tabs a[data-tab=lib]');
    await page.waitForSelector('.card');
    ok((await page.locator('.card').count()) === 3, '取り込みを消すとサンプルにもどる');
    await ctx.close();
  }

  /* ---- B. library.js 表示（動画つき）：デスクトップ ---- */
  console.log('B. library.js の表示と動画');
  {
    const ctx = await browser.newContext({ viewport: { width: 1100, height: 900 } });
    const page = await ctx.newPage(); watch(page);
    await page.goto('file://' + path.join(od, 'basket-navi.html'));
    await page.waitForSelector('.card');
    ok((await page.locator('.card').count()) === lib.videos.length, `library.js の ${lib.videos.length} 本が並ぶ（サンプルは出ない）`);
    ok((await page.locator('.banner').count()) === 0, 'サンプルの案内は出ない');
    await shot(page, 'B1-library-real.png');
    await page.click('.card:has-text("ピック")');
    await page.waitForSelector('.vhead h1');
    ok((await text(page, '.prose')).includes('合図は声と目'), '要点（summary）が表示される');
    ok(await page.locator('a:has-text("OneDrive などで開く")').count() === 1, 'OneDrive などのリンクのボタンが出る');
    if (withVideo) {
      await page.waitForFunction(() => { const v = document.querySelector('#vp'); return v && v.readyState >= 1; }, null, { timeout: 8000 });
      const dur = await page.evaluate(() => document.querySelector('#vp').duration);
      ok(dur > 40 && dur < 50, `フォルダの動画が再生できる状態になる（長さ ${dur.toFixed(1)} 秒）`);
      await page.click('#clips .clip >> nth=1 >> .time');
      await page.waitForFunction(() => document.querySelector('#vp').currentTime >= 19, null, { timeout: 5000 });
      const ct = await page.evaluate(() => document.querySelector('#vp').currentTime);
      ok(ct >= 19 && ct < 24, `見どころの時刻ボタンでその位置から再生される（${ct.toFixed(1)} 秒）`);
      await page.waitForSelector('#clips .clip.now', { timeout: 4000 }).catch(() => {});
      ok(await page.locator('#clips .clip.now').count() === 1, '再生位置に合わせて見どころが光る');
      await page.click('[data-act=rate][data-r="1.5"]');
      ok((await page.evaluate(() => document.querySelector('#vp').playbackRate)) === 1.5, '再生速度を変えられる');
      await page.keyboard.press('m');
      ok(await page.locator('#markForm').isVisible(), 'Mキーで印のフォームが開く');
      ok(/^\d+:\d\d$/.test(await page.inputValue('#markForm [name=at]')), 'フォームに「いまの位置」が入る');
      await page.fill('#markForm [name=title]', '動画の途中の印');
      await page.click('#markForm [type=submit]');
      ok((await page.locator('#clips .clip').count()) === 3, '動画を見ながらの印が追加される');
      await page.click('#clips .clip:has-text("2対2ドリル") [data-act=addplan]');
      await page.goto('file://' + path.join(od, 'basket-navi.html') + '#/run');
      await page.waitForSelector('#timer');
      await page.click('[data-act=rvideo]');
      await page.waitForSelector('dialog[open] video');
      await page.waitForFunction(() => { const v = document.querySelector('dialog video'); return v && v.readyState >= 1 && v.currentTime >= 19; }, null, { timeout: 8000 });
      ok(true, '実施モードから、動画をその位置で開ける');
      await shot(page, 'B2-run-video.png');
      await page.click('dialog [data-act=closedlg]');
    }
    // ファイルがない項目
    await page.goto('file://' + path.join(od, 'basket-navi.html') + '#/v/v-miss');
    await page.waitForSelector('#verr:not([hidden])', { timeout: 8000 });
    ok((await text(page, '#verr')).includes('動画を開けませんでした'), 'ファイルがないときは、原因の案内が出る');
    ok((await text(page, '#verr')).includes('戦術/ない.mp4'), '探した場所が、読める文字で出る');
    await shot(page, 'B3-video-missing.png');
    // 練習メニュー（横断）
    await page.click('.tabs a[data-tab=drills]');
    await page.waitForSelector('#dlist .clip');
    ok((await page.locator('#dlist .clip').count()) >= 2, '練習メニューのページで、動画をまたいで見どころが並ぶ');
    await shot(page, 'B4-drills.png');
    await ctx.close();
  }

  /* ---- C. スマホ幅・暗い画面 ---- */
  console.log('C. スマホ幅・暗い画面');
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 800 }, deviceScaleFactor: 2, colorScheme: 'dark', hasTouch: true, isMobile: true });
    const page = await ctx.newPage(); watch(page);
    await page.goto('file://' + path.join(od, 'basket-navi.html'));
    await page.waitForSelector('.card');
    await shot(page, 'C1-library-mobile-dark.png');
    const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    ok(over <= 1, `ライブラリが横にはみ出さない（差 ${over}px）`);
    await page.click('.card:has-text("ピック")');
    await page.waitForSelector('.vhead h1');
    await shot(page, 'C2-video-mobile-dark.png', true);
    ok((await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 1, '動画ページが横にはみ出さない');
    await page.click('#clips .clip >> nth=1 >> [data-act=addplan]');
    await page.click('.tabs a[data-tab=plan]');
    await page.waitForSelector('#items .pi');
    await shot(page, 'C3-plan-mobile-dark.png', true);
    ok((await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 1, '計画ページが横にはみ出さない');
    await page.click('[data-act=run]');
    await page.waitForSelector('#timer');
    await shot(page, 'C4-run-mobile-dark.png');
    const tops = await page.$$eval('.rbtns .btn', els => els.map(e => Math.round(e.getBoundingClientRect().top)));
    ok(new Set(tops).size === 1, '実施モードの3つのボタンが、スマホ幅でも1行に並ぶ');
    ok((await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 1, '実施モードが横にはみ出さない');
    await ctx.close();
  }

  await browser.close();
  fs.rmSync(tmp, { recursive: true, force: true });
  ok(errors.length === 0, 'ブラウザにエラーが出ていない' + (errors.length ? '：\n    ' + errors.join('\n    ') : ''));
  console.log(`\n画像：${outDir}`);
  if (failures.length) { console.log(`\n✗ ${failures.length} 件が失敗`); process.exit(1); }
  console.log('\nすべて通った');
})().catch(e => { console.error(e); process.exit(1); });
