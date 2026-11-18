// 画面を通した確認（Playwright の Chromium を画面なしで動かし、人と同じようにファイル選択・クリック・ドラッグする）
//   node basket-clips/tests/e2e.cjs [dev|built]
//     dev   … basket-clips/index.html（js/ と css/ を読む版）
//     built … public/basket-clips/index.html（1ファイル版。公開するもの）
//   作業フォルダ（合成動画を置く）は WORK で変えられる。初回は合成動画を作る（約1〜3分）。
// 流れ：動画を開く → 色を選ぶ → ゴールを2つ自動で見つける → 攻めるチームを選ぶ → 探す → 正解と比べる
//       → サムネイル → 続けて再生 → チームの付け替え・入れ替え・手で足す → 📋 記録（2点/3点/FT・番号・リバウンド・CSV）
//       → 動画にする → 開き直して結果が戻る → 後半 → WebM → リングに当たる得点 → ゴール裏（たぶん入った → 入った／外れ）
const fs = require('fs');
const os = require('os');
const path = require('path');
const { chromium } = require('./pw.cjs');
const { start } = require('./server.cjs');
const { make } = require('./tools/make-video.cjs');

const MODE = process.argv[2] || 'dev';
const WORK = process.env.WORK || path.join(os.tmpdir(), 'basket-clips-e2e');
const ARGS = ['--autoplay-policy=no-user-gesture-required', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--mute-audio'];
let pass = 0, fail = 0;
const ok = (c, name, extra) => { if (c) { pass++; console.log('  ok  ', name); } else { fail++; console.log('  FAIL', name, extra !== undefined ? JSON.stringify(extra) : ''); } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function ensureVideo(name, segs, rim, view) {
  const file = path.join(WORK, name);
  if (!fs.existsSync(file) || !fs.existsSync(file + '.json')) { console.log(`（合成動画を作っています：${name} ${segs}${rim ? '・リングに当たるシュート入り' : ''}${view && view !== 'side' ? '・カメラ ' + view : ''}）`); await make(file, segs, 30, 4, rim || null, view || 'side'); }
  return { file, truth: JSON.parse(fs.readFileSync(file + '.json', 'utf8')) };
}

/* 正解の得点と、見つけた得点を突き合わせる（ボールがリングに届くのは、放ってから約 0.7〜1.1 秒後） */
function compare(items, truth) {
  const made = truth.shots.filter((s) => s.made);
  const used = new Set();
  const rows = made.map((s) => {
    const k = items.findIndex((it, i) => !used.has(i) && it.t >= s.t - 0.3 && it.t <= s.t + 2.4);
    if (k >= 0) used.add(k);
    return { s, it: k >= 0 ? items[k] : null };
  });
  return { rows, found: rows.filter((r) => r.it).length, teamOk: rows.filter((r) => r.it && r.it.team === r.s.team).length, extra: items.filter((it, i) => !used.has(i)) };
}

async function openPage(browser, url) {
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 }, acceptDownloads: true });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(url);
  await page.waitForFunction(() => window.BS && BS.app && document.querySelector('#stepVideo'));
  return { page, errors };
}
async function openVideo(page, file) {
  await page.setInputFiles('#fileVideo', file);
  await page.waitForFunction(() => BS.app.S.media && BS.app.S.media.ready && BS.app.duration() > 5, null, { timeout: 30000 });
  await sleep(300);
}
/* ゴールを教える：そのコマへ移って「このゴールを教える」→ how が 'tap' ならリングをタップ、'trace' ならリングの左端から右端までなぞる
   （タップで見つからないとき・リングが小さいときは拡大されるので、拡大された映像でもう一度なぞる） */
async function markGoal(page, i, mark, how) {
  await page.evaluate((t) => BS.app.seek(t), mark.t);
  await sleep(400);
  await page.click('#btnMark' + i);
  const drag = async (a, b) => {
    await page.mouse.move(a.x, a.y);
    await page.mouse.down();
    await page.mouse.move(b.x, b.y, { steps: 8 });
    await page.mouse.up();
    await sleep(150);
  };
  const scr = (x, y) => page.evaluate(([x, y]) => BS.app.toScreen(x, y), [x, y]);
  const r = mark.rim;
  if (how === 'tap') {
    const p = await scr(r.cx, r.cy);
    await page.mouse.click(p.x, p.y);
    await sleep(300);
  }
  for (let k = 0; k < 2 && await page.evaluate(() => !!BS.app.S.marking); k++) await drag(await scr(r.cx - r.w / 2, r.cy), await scr(r.cx + r.w / 2, r.cy));
  return page.evaluate((i) => BS.app.S.st.hoops[i], i);
}
/* 自動でゴールを探さずに開く（ゴールを手で教えるテスト用） */
async function openVideoManual(page, file) {
  await page.evaluate(() => { BS.app.S.autoGoals = false; });
  await openVideo(page, file);
}
async function analyse(page, ms) {
  await page.click('#btnRun');
  await page.waitForFunction(() => BS.app.S.running, null, { timeout: 10000 });
  await page.waitForFunction(() => !BS.app.S.running, null, { timeout: ms || 600000, polling: 500 });
  return page.evaluate(() => ({ items: BS.app.list().map((it) => ({ id: it.id, t: it.t, team: it.team, hoop: it.hoop, on: it.on, unsure: it.unsure })), mode: BS.app.S.st.result && BS.app.S.st.result.mode, wall: BS.app.S.st.result && BS.app.S.st.result.wall }));
}
const counts = (page) => page.evaluate(() => [0, 1].map((tm) => BS.app.list().filter((it) => it.team === tm).length));
const tabText = (page) => page.evaluate(() => [0, 1].map((i) => document.querySelector('#tab' + i).textContent));

(async () => {
  fs.mkdirSync(WORK, { recursive: true });
  const v1 = await ensureVideo('game150.mp4', '0-150');
  const srv = await start(0, MODE === 'built' ? path.join(__dirname, '..', '..', 'public', 'basket-clips') : path.join(__dirname, '..'));
  // 日本語のファイル名で保存できるように、UTF-8 で起動する（ロケールが C のままだと、Chromium は保存名を「download」にする）
  const browser = await chromium.launch({ args: ARGS, env: Object.assign({}, process.env, { LANG: 'C.UTF-8', LC_ALL: 'C.UTF-8' }) });
  try {
    console.log(`\n■ ${MODE === 'built' ? '1ファイル版（public/basket-clips/index.html）' : '開発版（basket-clips/index.html）'}`);
    const { page, errors } = await openPage(browser, srv.url);
    ok(await page.$('#stepTeams') && await page.$('#stepGoals'), '最初の画面に ①〜④ の手順が出る');

    console.log('\n■ 動画を開く・色を選ぶ');
    await openVideo(page, v1.file);
    ok(Math.abs(await page.evaluate(() => BS.app.duration()) - 150) < 0.2, '動画の長さ 150 秒');
    await page.click('.sw[data-team="0"][data-color="青"]');
    await page.click('.sw[data-team="1"][data-color="赤"]');
    const teams = await page.evaluate(() => BS.app.S.st.teams.map((t) => t.colorName));
    ok(teams[0] === '青' && teams[1] === '赤', '自分＝青・相手＝赤', teams);

    console.log('\n■ ゴールを自動で探す（動画を開くと始まる）');
    await page.waitForFunction(() => !BS.app.S.finding && BS.app.S.st.autoTried, null, { timeout: 180000, polling: 300 });
    const auto = await page.evaluate(() => BS.app.S.st.hoops.map((m) => m && { t: m.t, rim: m.rim, box: m.box, how: m.how }));
    ok(auto.every((m) => m && m.how === 'auto'), 'ゴールを2つ、自動で見つけた', auto.map((m) => m && [m.t, Math.round(m.rim.cx), Math.round(m.rim.cy), Math.round(m.rim.w)]));
    // 横から撮った映像では、左に映るのが正解のゴールA（左のゴール）。リングの高さ・幅は、カメラが横に振れても変わらない
    const leftIdx = auto[0] && auto[1] && auto[0].rim.cx < auto[1].rim.cx ? 0 : 1;
    const tm0 = v1.truth.marks[0].rim;
    ok(auto.every((m) => m && Math.abs(m.rim.cy - tm0.cy) < 6 && Math.abs(m.rim.w - tm0.w) < 0.25 * tm0.w), '見つけたリングの位置（高さ）と大きさが正解と合う', auto.map((m) => m && [Math.round(m.rim.cy), Math.round(m.rim.w)]));
    ok(auto[leftIdx] && auto[1 - leftIdx] && auto[leftIdx].rim.cx < 640 && auto[1 - leftIdx].rim.cx > 640, '左のゴールと右のゴールを1つずつ（同じゴールを2つにしない）');
    await page.waitForFunction(() => BS.app.S.thumbs.hoop0 && BS.app.S.thumbs.hoop1, null, { timeout: 30000 }).catch(() => {});
    ok(await page.$$eval('#stepGoals canvas.hoopthumb', (els) => els.length) === 2, '見つけたゴールの絵（リングに黄色の線）が2つ出る');
    ok(!!await page.$('#btnFind'), '「もう一度、自動で探す」がある');
    // 動画のはじめ（前半）：左のゴールを攻めるのは赤＝相手
    await page.click(`.teambtn[data-hoop="${leftIdx}"][data-team="1"]`);
    ok(JSON.stringify(await page.evaluate(() => BS.app.S.st.hoopTeam)) === (leftIdx === 0 ? '[1,0]' : '[0,1]'), '「このゴールを攻めているのは相手」で、もう片方は自動で自分になる');

    console.log('\n■ 得点シーンを探す');
    const r1 = await analyse(page);
    console.log(`     解析：${r1.mode}・${r1.wall} 秒`);
    ok(r1.mode === 'decode', 'ファイルを直接デコードして解析した', r1.mode);
    const cmp = compare(r1.items, v1.truth);
    cmp.rows.forEach((r) => console.log(`     正解 ${r.s.t.toFixed(1)} ${r.s.type === 'ft' ? 'FT' : '  '} ${r.s.team ? '赤' : '青'} → ${r.it ? `${r.it.t.toFixed(1)} ${r.it.team ? '入れられた' : '入れた'}${r.it.unsure ? '（要確認）' : ''}` : '★見つからない'}`));
    ok(cmp.found === cmp.rows.length, `得点 ${cmp.rows.length} 本をすべて見つけた`, cmp.found);
    ok(cmp.teamOk === cmp.found, '見つけた得点のチーム（入れた／入れられた）がすべて正しい', cmp.teamOk);
    ok(cmp.extra.length === 0, '正解にない得点がない', cmp.extra.map((x) => x.t));
    const n = await counts(page);
    const want = [0, 1].map((tm) => v1.truth.shots.filter((s) => s.made && s.team === tm).length);
    ok(n[0] === want[0] && n[1] === want[1], `入れた ${want[0]}・入れられた ${want[1]}`, n);
    const tt = await tabText(page);
    ok(tt[0].includes(String(want[0])) && tt[1].includes(String(want[1])) && tt[0].includes('入れた') && tt[1].includes('入れられた'), 'タブに本数が出る', tt);
    const clips0 = await page.evaluate(() => BS.app.clipsFor(0));
    ok(clips0.every((c) => Math.abs(c.t1 - c.t0 - 5) < 0.01 && Math.abs(c.at - c.t0 - 4) < 0.01), '1場面は5秒（入った瞬間の前4秒・後1秒）');
    ok(await page.$$eval('#clipList .clip', (els) => els.length) === want[0], '一覧に「入れた」の場面が並ぶ');

    console.log('\n■ サムネイル');
    await page.waitForFunction(() => BS.app.list().every((it) => BS.app.S.thumbs[it.id]), null, { timeout: 30000 }).catch(() => {});
    const th = await page.evaluate(() => { const imgs = Array.from(document.querySelectorAll('#clipList img.thumb')); return { n: imgs.length, loaded: imgs.filter((i) => i.src.startsWith('data:image')).length }; });
    ok(th.n > 0 && th.loaded === th.n, '場面の小さな絵が出る', th);

    console.log('\n■ 続けて再生');
    await page.click('#btnReel');
    await page.waitForFunction(() => BS.app.S.reel.active && !BS.app.S.media.paused, null, { timeout: 8000 });
    await sleep(1200);
    const p0 = await page.evaluate(() => { const R = BS.app.S.reel, s = R.list[R.i]; return { i: R.i, t: BS.app.S.media.time, t0: s.t0, t1: s.t1, badge: document.querySelector('#ovBadge').textContent }; });
    ok(p0.i === 0 && p0.t >= p0.t0 && p0.t <= p0.t1, '1本目の区間を再生している', p0);
    ok(/入れた 1 \/ \d/.test(p0.badge), '映像の上に「入れた 1 / N」', p0.badge);
    await page.waitForFunction(() => BS.app.S.reel.i >= 1, null, { timeout: 9000 });
    const p1 = await page.evaluate(() => { const R = BS.app.S.reel, s = R.list[R.i]; return { i: R.i, t: BS.app.S.media.time, t0: s.t0, t1: s.t1 }; });
    ok(p1.i === 1 && p1.t >= p1.t0 - 0.05 && p1.t <= p1.t1, '5秒たつと次の場面へ移る', p1);
    await page.click('#reelStop');
    ok(!(await page.evaluate(() => BS.app.S.reel.active)), '⏹ で止まる');

    console.log('\n■ 直す・足す');
    const first = clips0[0].id;
    await page.click(`[data-move="${first}"]`);
    let c2 = await counts(page);
    ok(c2[0] === want[0] - 1 && c2[1] === want[1] + 1, '「⇄ 入れられたへ」で1本移る', c2);
    await page.click('#tab1');
    await page.click(`[data-move="${first}"]`);
    c2 = await counts(page);
    ok(c2[0] === want[0] && c2[1] === want[1], '戻すと元どおり（手直しの印も消える）', c2);
    ok(!(await page.evaluate((id) => id in BS.app.S.st.edits.fix, first)), '元に戻したら「手で直した」も消える');
    await page.click('#tab0');
    await page.click('#btnSwap');
    c2 = await counts(page);
    ok(c2[0] === want[1] && c2[1] === want[0], '「⇄ 入れ替える」で自分と相手が入れ替わる', c2);
    await page.click('#btnSwap');
    await page.evaluate(() => BS.app.seek(60));
    await sleep(300);
    await page.click('#btnAdd1');
    c2 = await counts(page);
    ok(c2[1] === want[1] + 1, '「＋ 入れられた」で手で足せる', c2);
    const added = await page.evaluate(() => BS.app.S.st.edits.added.map((a) => a.id));
    await page.click(`.clip[data-id="${added[0]}"] button[title="この場面を消す"]`);
    ok((await counts(page))[1] === want[1], '手で足した場面は消せる');
    await page.click('#tab0');
    // 1本だけ外す（続けて再生・書き出しに入れない）
    const lastId = clips0[clips0.length - 1].id;
    await page.click(`.clip[data-id="${lastId}"] input[type="checkbox"]`);
    ok(await page.evaluate((id) => !BS.app.list().find((x) => x.id === id).on, lastId), 'チェックを外すと、その場面は入らない');

    console.log('\n■ 📋 記録（ゴールに来たシュートを全部・2点/3点/FT・番号・リバウンド）');
    {
      const rec0 = await page.evaluate(() => BS.app.record().map((r) => ({ id: r.id, t: r.t, res: r.res, team: r.team, auto: r.auto })));
      const truthAll = v1.truth.shots.length;
      const nMade = (await counts(page)).reduce((a, b) => a + b, 0);
      ok(rec0.filter((r) => r.res === 'made').length === nMade && rec0.length >= truthAll - 1, `ゴールに来たシュートを全部並べる（正解 ${truthAll} 本、記録 ${rec0.length} 本。入ったは得点の一覧と同じ ${nMade} 本）`, rec0.map((r) => [r.t, r.res]));
      await page.click('#tab2');
      ok(await page.$$eval('#recList .rec', (els) => els.length) === rec0.length, '記録のタブに、シュートが1本1行で並ぶ');
      ok((await page.textContent('#tab2')).includes(String(rec0.length)), 'タブに本数が出る');
      // 外れの行を「入った」にすると、得点の一覧に入る。「外れ」に戻すと元どおり（印も消える）
      const miss = rec0.find((r) => r.res === 'miss' && r.auto);
      const before = await counts(page);
      await page.click(`.rec[data-rec="${miss.id}"] .seg.res .sb[data-v="made"]`);
      const mid = await counts(page);
      ok(mid[miss.team] === before[miss.team] + 1, '記録で「入った」にすると、得点の一覧に入る', [before, mid]);
      await page.click(`.rec[data-rec="${miss.id}"] .seg.res .sb[data-v="miss"]`);
      ok(JSON.stringify(await counts(page)) === JSON.stringify(before) && !(await page.evaluate((id) => id in BS.app.S.st.edits.judge, miss.id)), '「外れ」に戻すと元どおり（人が決めた印も消える）');
      // 1本目の成功に「3点・#7」、外れに「リバウンド：自分 #4」
      const made = rec0.find((r) => r.res === 'made');
      await page.click(`.rec[data-rec="${made.id}"] .seg.type .sb[data-v="3"]`);
      await page.fill(`.rec[data-rec="${made.id}"] .r2 > input.no`, '7');
      await page.press(`.rec[data-rec="${made.id}"] .r2 > input.no`, 'Tab');
      await page.click(`.rec[data-rec="${miss.id}"] .seg.rebteam .sb[data-v="0"]`);
      await page.fill(`.rec[data-rec="${miss.id}"] .reb input.no`, '4');
      await page.press(`.rec[data-rec="${miss.id}"] .reb input.no`, 'Tab');
      const st = await page.evaluate(() => BS.clips.stats(BS.app.record()));
      const T = st.teams[made.team];
      ok(T.shots['3'].join('/') === '1/1' && st.players[made.team].some((p) => p.no === '7' && p.pts === 3), '「3点・#7」が集計に入る（#7 の得点 3）', { t3: T.shots['3'], players: st.players[made.team] });
      const rb = st.teams[0];
      ok(rb.oreb + rb.dreb === 1 && st.players[0].some((p) => p.no === '4' && p.oreb + p.dreb === 1), 'リバウンド（自分 #4）が集計に入る', { oreb: rb.oreb, dreb: rb.dreb });
      const sumText = await page.textContent('#recSummary');
      ok(sumText.includes('得点') && sumText.includes('リバウンド'), '下に集計の表が出る');
      // CSV（Excel で開けるように、先頭に BOM）
      const [dlc] = await Promise.all([page.waitForEvent('download'), page.click('#btnCSV')]);
      const csvPath = path.join(WORK, 'rec.csv');
      await dlc.saveAs(csvPath);
      const csv = fs.readFileSync(csvPath, 'utf8');
      const lines = csv.replace(/^\ufeff/, '').trim().split(/\r\n/);
      ok(csv.charCodeAt(0) === 0xfeff && lines.length === rec0.length + 1 && lines[0].startsWith('時刻,'), '「⬇ CSV で保存」：見出し＋シュートの数だけ行（Excel 用の BOM つき）', { name: dlc.suggestedFilename(), lines: lines.length });
      ok(/記録\.csv$/.test(dlc.suggestedFilename()) && lines.some((l) => l.includes(',3点,7,')), 'CSV に「3点・#7」が入る', lines.slice(0, 3));
      // 見つからなかったシュートを手で足す（外れ）→ 消す
      await page.evaluate(() => BS.app.seek(75));
      await sleep(300);
      await page.click('#btnRecAddMiss');
      const rec1 = await page.evaluate(() => BS.app.record().length);
      ok(rec1 === rec0.length + 1, '「＋ 外れ」で、記録に1本足せる（得点の一覧には入らない）', rec1);
      const addedId = await page.evaluate(() => BS.app.S.st.edits.added.find((a) => a.res === 'miss').id);
      await page.click(`.rec[data-rec="${addedId}"] button[title="この行を消す"]`);
      ok(await page.evaluate(() => BS.app.record().length) === rec0.length, '手で足した行は消せる');
      // 上から続けて見る
      await page.click('#btnRecReel');
      await page.waitForFunction(() => BS.app.S.reel.active && !BS.app.S.media.paused, null, { timeout: 8000 });
      await sleep(600);
      ok(/記録 1 \/ \d+/.test(await page.textContent('#ovBadge')), '「▶ 上から続けて見る」：映像の上に「記録 1 / N」', await page.textContent('#ovBadge'));
      await page.click('#reelStop');
      await page.click('#tab0');
    }

    console.log('\n■ 動画にする（入れたところ）');
    const nOn = want[0] - 1;
    await page.click('#btnExport');
    await page.waitForFunction(() => BS.app.S.exporting, null, { timeout: 5000 });
    await page.waitForFunction(() => !BS.app.S.exporting, null, { timeout: 120000, polling: 500 });
    const out = await page.evaluate(() => { const r = BS.app.S.out[0]; return r ? { size: r.blob.size, ext: r.ext, seconds: r.seconds, name: r.name } : null; });
    ok(out && out.size > 100000, '動画ができた', out);
    ok(out && Math.abs(out.seconds - (nOn * 5 + 4.7)) < 0.2, `長さの見込み ${nOn}本×5秒＋最初と最後`, out && out.seconds);
    ok(out && /入れた_\d+本\.(mp4|webm)$/.test(out.name), 'ファイル名に「入れた_N本」', out && out.name);
    // できた動画の中身：時間がたつと絵が変わる（止まった絵ではない）
    const look = await page.evaluate(async () => {
      const v = document.querySelector('#exportBox video');
      if (!v) return null;
      await new Promise((r) => { if (v.readyState >= 1) r(); else v.addEventListener('loadedmetadata', r, { once: true }); });
      if (!isFinite(v.duration)) { v.currentTime = 1e6; await new Promise((r) => v.addEventListener('seeked', r, { once: true })); }
      const dur = v.duration;
      const grab = async (t) => { v.currentTime = t; await new Promise((r) => v.addEventListener('seeked', r, { once: true })); const c = document.createElement('canvas'); c.width = 64; c.height = 36; const g = c.getContext('2d'); g.drawImage(v, 0, 0, 64, 36); return Array.from(g.getImageData(0, 0, 64, 36).data); };
      const a = await grab(4), b = await grab(5.5), c = await grab(9.5);
      const diff = (x, y) => x.reduce((s, val, i) => s + Math.abs(val - y[i]), 0) / x.length;
      return { dur, ab: diff(a, b), ac: diff(a, c) };
    });
    ok(look && Math.abs(look.dur - (nOn * 5 + 4.7)) < 1.5, '書き出した動画の長さ', look && look.dur);
    ok(look && look.ab > 1 && look.ac > 1, '書き出した動画の絵が動いている', look);
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#btnDownload')]);
    ok(/入れた/.test(dl.suggestedFilename()), '「⬇ 保存する」でダウンロードできる', dl.suggestedFilename());

    console.log('\n■ 開き直すと結果が戻る');
    await page.reload();
    await page.waitForFunction(() => window.BS && BS.app);
    await openVideo(page, v1.file);
    const back = await page.evaluate(() => ({ res: !!BS.app.S.st.result, n: [0, 1].map((tm) => BS.app.list().filter((it) => it.team === tm).length), colors: BS.app.S.st.teams.map((t) => t.colorName), panel: !!document.querySelector('#results') }));
    ok(back.res && back.panel && back.n[0] === want[0] && back.n[1] === want[1], '同じ動画を開くと、解析し直さずに結果が出る', back);
    ok(back.colors[0] === '青' && back.colors[1] === '赤', '色も戻る', back.colors);
    ok(await page.evaluate((id) => !BS.app.list().find((x) => x.id === id).on, lastId), '外した場面も覚えている');
    ok(errors.length === 0, 'ページのエラーがない', errors.slice(0, 3));
    await page.close();

    console.log('\n■ 後半（ハーフタイムで攻めるゴールが入れ替わる）');
    const v2 = await ensureVideo('game-half.mp4', '0-100,805-905');
    const P2 = await openPage(browser, srv.url);
    const page2 = P2.page;
    await page2.evaluate(() => localStorage.clear());
    await openVideoManual(page2, v2.file);
    await page2.click('.sw[data-team="0"][data-color="青"]');
    await page2.click('.sw[data-team="1"][data-color="赤"]');
    // ゴールを手で教える：ゴールA はリングをタップ、ゴールB はリングをなぞる
    for (const [i, how] of [[0, 'tap'], [1, 'trace']]) {
      const m = v2.truth.marks[i].rim;
      const got = await markGoal(page2, i, v2.truth.marks[i], how);
      const d = got ? Math.hypot(got.rim.cx - m.cx, got.rim.cy - m.cy) : 99;
      ok(got && got.how === how && d < 0.3 * m.w && Math.abs(got.rim.w - m.w) < 0.25 * m.w, `ゴール${'AB'[i]} を${how === 'tap' ? 'リングのタップ' : 'リングをなぞって'}教えられる（中心のずれ ${d.toFixed(1)} 画素・幅 ${got ? got.rim.w.toFixed(1) : '-'} / ${m.w.toFixed(1)}）`, got && got.how);
    }
    await page2.click('.teambtn[data-hoop="0"][data-team="1"]');
    // 後半の始まり（動画の 100 秒）：映像をそこで止めて「いまの位置から後半にする」
    await page2.evaluate(() => BS.app.seek(100.2));
    await sleep(300);
    await page2.evaluate(() => { const d = document.querySelector('#stepGoals details.half'); if (d) d.open = true; });
    await page2.click('#btnHalf');
    ok(Math.abs((await page2.evaluate(() => BS.app.S.st.halfT)) - 100.2) < 0.11, '「いまの位置から後半にする」で後半の始まりが決まる');
    const r2 = await analyse(page2);
    const cmp2 = compare(r2.items, v2.truth);
    cmp2.rows.forEach((r) => console.log(`     正解 ${r.s.t.toFixed(1)} ${r.s.half === 2 ? '後半' : '前半'} ${r.s.team ? '赤' : '青'} → ${r.it ? `${r.it.t.toFixed(1)} ${r.it.team ? '入れられた' : '入れた'}` : '★見つからない'}`));
    ok(cmp2.found === cmp2.rows.length && cmp2.teamOk === cmp2.found, `前半・後半の得点 ${cmp2.rows.length} 本が、正しいチームに分かれる`, { found: cmp2.found, teamOk: cmp2.teamOk });
    ok(cmp2.rows.some((r) => r.s.half === 2), '後半の得点を含んでいる');
    // 後半を取り消すと、後半の得点だけチームが逆になる
    await page2.evaluate(() => BS.app.setHalf(null));
    const wrong = compare(await page2.evaluate(() => BS.app.list().map((it) => ({ t: it.t, team: it.team }))), v2.truth);
    ok(wrong.teamOk === cmp2.rows.filter((r) => r.s.half === 1).length, '後半を設定しないと、後半の得点だけ逆になる（設定の意味の確認）', wrong.teamOk);
    ok(P2.errors.length === 0, 'ページのエラーがない', P2.errors.slice(0, 3));
    await page2.close();

    // 直接読めない形式（WebM など）：再生しながら探す（互換モード）。動画と同じ時間がかかるので、最初の 45 秒だけ
    const webm = path.join(WORK, 'game45.webm');
    let haveWebm = fs.existsSync(webm);
    if (!haveWebm) {
      try { require('child_process').execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', v1.file, '-t', '45', '-c', 'copy', webm]); haveWebm = true; }
      catch (e) { console.log('\n（ffmpeg がないので、互換モードの確認は省きます）'); }
    }
    if (haveWebm) {
      console.log('\n■ 直接読めない形式（WebM）：再生しながら探す');
      const P3 = await openPage(browser, srv.url);
      const page3 = P3.page;
      await page3.evaluate(() => localStorage.clear());
      await openVideoManual(page3, webm);
      for (const [i, how] of [[0, 'trace'], [1, 'tap']]) await markGoal(page3, i, v1.truth.marks[i], how);
      await page3.click('.teambtn[data-hoop="0"][data-team="1"]');
      const r3 = await analyse(page3, 180000);
      ok(r3.mode === 'playback', '互換モード（再生しながら）で探した', r3.mode);
      const t3 = Object.assign({}, v1.truth, { shots: v1.truth.shots.filter((s) => s.t < 42) });
      // 互換モードは、動画を再生しながら間に合ったコマだけを調べるので、実行のたびに調べるコマが少し変わる（このテストの環境では、
      // ゴールB にカメラが向いた直後の 1 本を、変更前のコードでも 3 回に 2 回落とした）。1 本までの見落としは許し、正しさを確かめる
      const mb3 = await page3.evaluate(() => BS.app.maybes().map((m) => ({ id: m.id, t: m.t, team: m.team })));
      const cmp3 = compare(r3.items.concat(mb3), t3);
      const made3 = compare(r3.items, t3);
      ok(cmp3.found >= cmp3.rows.length - 1 && cmp3.teamOk === cmp3.found && made3.extra.length === 0, `最初の 45 秒の得点 ${cmp3.rows.length} 本のうち ${cmp3.found} 本を、正しいチームで「入った」か「たぶん入った」に（1本までの見落としは許す）・「入った」に正解にない得点なし`, { found: cmp3.found, teamOk: cmp3.teamOk, made: made3.found, extra: made3.extra.map((x) => x.t) });
      ok(P3.errors.length === 0, 'ページのエラーがない', P3.errors.slice(0, 3));
      await page3.close();
    }

    // リングに当たってから入る得点・ゴールの追跡（この 60 秒で、もとのエンジンはゴールを 40 秒見失い、リングを回って入った 2 本を落とした）
    console.log('\n■ リングに当たってから入る得点（ゴールを見失わない）');
    const v4 = await ensureVideo('rim360.mp4', '360-420', { makes: 0.7, misses: 0.6 });
    const P4 = await openPage(browser, srv.url);
    const page4 = P4.page;
    await page4.evaluate(() => localStorage.clear());
    await openVideoManual(page4, v4.file);
    for (const [i, how] of [[0, 'tap'], [1, 'trace']]) await markGoal(page4, i, v4.truth.marks[i], how);
    await page4.click('.teambtn[data-hoop="0"][data-team="1"]');
    const r4 = await analyse(page4);
    const cmp4 = compare(r4.items, v4.truth);
    cmp4.rows.forEach((r) => console.log(`     正解 ${r.s.t.toFixed(1)} ${r.s.rim || 'きれい'} ${r.s.team ? '赤' : '青'} → ${r.it ? `${r.it.t.toFixed(1)} ${r.it.team ? '入れられた' : '入れた'}` : '★見つからない'}`));
    const rimIns = cmp4.rows.filter((r) => r.s.rim);
    ok(rimIns.length >= 2 && rimIns.every((r) => r.it && r.it.team === r.s.team), `リングを転がって・回って入った得点 ${rimIns.length} 本を、正しいチームで見つけた`, rimIns.map((r) => [r.s.t, r.s.rim, !!r.it]));
    ok(cmp4.found === cmp4.rows.length && cmp4.teamOk === cmp4.found, `この区間の得点 ${cmp4.rows.length} 本をすべて見つけた`, { found: cmp4.found, teamOk: cmp4.teamOk });
    ok(P4.errors.length === 0, 'ページのエラーがない', P4.errors.slice(0, 3));
    await page4.close();

    // ゴール裏の2階の隅から撮った映像（手前のゴールは、ガラスのボード越しに裏から見る。カメラはボールを追ってパン・チルト・ズーム）。
    // ゴールは自動で見つけたまま、手で直さずに探す
    console.log('\n■ ゴール裏の2階から撮った映像（ゴールは自動で見つけたまま）');
    const v5 = await ensureVideo('behind150.mp4', '0-150', null, 'behind');
    const P5 = await openPage(browser, srv.url);
    const page5 = P5.page;
    await page5.evaluate(() => localStorage.clear());
    await openVideo(page5, v5.file);
    await page5.waitForFunction(() => !BS.app.S.finding && BS.app.S.st.autoTried, null, { timeout: 180000, polling: 300 });
    const auto5 = await page5.evaluate(() => BS.app.S.st.hoops.map((m) => m && { t: m.t, rim: m.rim }));
    // 見つけたゴールが、正解のどちらのゴールか（そのコマの、正解のリングの位置で）
    const sideOf = (m) => {
      if (!m) return -1;
      const tr = v5.truth.rimTrack.reduce((b, r) => (Math.abs(r[0] - m.t) < Math.abs(b[0] - m.t) ? r : b));
      if (Math.abs(tr[0] - m.t) > 0.3) return -1;
      return [tr[1], tr[2]].findIndex((r) => r && Math.hypot(m.rim.cx - r[0], m.rim.cy - r[1]) <= 0.5 * r[2] && m.rim.w >= 0.7 * r[2] && m.rim.w <= 1.4 * r[2]);
    };
    const sides5 = auto5.map(sideOf);
    ok(sides5.includes(0) && sides5.includes(1), '手前（裏から見る）と奥のゴールを、どちらも自動で見つけた', auto5.map((m, i) => m && [m.t, Math.round(m.rim.cx), Math.round(m.rim.cy), Math.round(m.rim.w), sides5[i]]));
    if (sides5.includes(0)) {
      // 動画のはじめ（前半）：手前のゴール（ゴールA の側）を攻めるのは赤＝相手
      await page5.click(`.teambtn[data-hoop="${sides5.indexOf(0)}"][data-team="1"]`);
      const r5 = await analyse(page5);
      // 入った＋たぶん入った（確かめる候補）を合わせて数える。手前のゴール（裏から見る）は、ネットの揺れをはっきり確かめにくいので「たぶん入った」になりやすい
      const mb5 = await page5.evaluate(() => BS.app.maybes().map((m) => ({ id: m.id, t: m.t, team: m.team, why: m.why })));
      const cmp5 = compare(r5.items.concat(mb5.map((m) => Object.assign({ maybe: true }, m))), v5.truth);
      cmp5.rows.forEach((r) => console.log(`     正解 ${r.s.t.toFixed(1)} ${r.s.side === 0 ? '手前' : '奥  '} ${r.s.team ? '赤' : '青'} → ${r.it ? `${r.it.t.toFixed(1)} ${r.it.team ? '入れられた' : '入れた'}${r.it.maybe ? '（たぶん入った）' : ''}` : '★見つからない'}`));
      ok(cmp5.found >= cmp5.rows.length - 1 && cmp5.teamOk === cmp5.found, `得点 ${cmp5.rows.length} 本のうち ${cmp5.found} 本を、正しいチームで「入った」か「たぶん入った」に（1本までの見落としは許す）`, { found: cmp5.found, teamOk: cmp5.teamOk });
      const extraMade = compare(r5.items, v5.truth).extra;
      ok(extraMade.length === 0, '「入った」に、正解にない得点がない', extraMade.map((x) => x.t));
      ok(cmp5.extra.length <= 1, '「たぶん入った」に、シュートでない所は1本まで', cmp5.extra.map((x) => x.t));

      console.log('\n■ たぶん入った（確認して）→「入った」「外れ」を決める');
      if (mb5.length) {
        const m = mb5[0];
        await page5.click('#tab' + m.team);
        ok(await page5.$$eval('#maybes .mb', (els) => els.length) === mb5.filter((x) => x.team === m.team).length, '得点のタブの下に「たぶん入った（確認して）」が並ぶ（理由つき）', await page5.textContent('#maybes'));
        ok((await page5.textContent('#tab' + m.team)).includes('確認'), 'タブに「＋確認 N」が出る');
        const b0 = (await counts(page5))[m.team];
        await page5.click(`[data-promote="${m.id}"]`);
        ok((await counts(page5))[m.team] === b0 + 1 && !(await page5.evaluate((id) => BS.app.maybes().some((x) => x.id === id), m.id)), '「入った」で得点の一覧に入り、確認待ちから消える');
        ok(await page5.$(`[data-unpromote="${m.id}"]`), '一覧に「↩」（確かめる前に戻す）が出る');
        await page5.click(`[data-unpromote="${m.id}"]`);
        ok((await counts(page5))[m.team] === b0 && await page5.evaluate((id) => BS.app.maybes().some((x) => x.id === id), m.id), '「↩」で確認待ちに戻る');
        await page5.click(`[data-reject="${m.id}"]`);
        ok(!(await page5.evaluate((id) => BS.app.maybes().some((x) => x.id === id), m.id)) && await page5.evaluate((id) => BS.app.record().some((r) => r.id === id && r.res === 'miss'), m.id), '「外れ」で確認待ちから消え、記録では外れになる');
      } else ok(false, 'ゴール裏の映像で「たぶん入った」が出る（手前のゴール）');
    }
    ok(P5.errors.length === 0, 'ページのエラーがない', P5.errors.slice(0, 3));
    await page5.close();
  } catch (e) {
    fail++;
    console.log('  FAIL 途中で止まりました:', e && e.stack || e);
  } finally {
    await browser.close();
    await srv.close();
  }
  console.log(`\n${pass} ok / ${fail} fail`);
  process.exit(fail ? 1 : 0);
})();
