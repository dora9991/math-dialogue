// 画面を通した確認（Playwright の Chromium を画面なしで動かし、人と同じようにファイル選択・クリック・ドラッグする）
//   node basket-clips/tests/e2e.cjs [dev|built]
//     dev   … basket-clips/index.html（js/ と css/ を読む版）
//     built … public/basket-clips/index.html（1ファイル版。公開するもの）
//   作業フォルダ（合成動画を置く）は WORK で変えられる。初回は合成動画を作る（約1〜3分）。
// 流れ：動画を開く → 色を選ぶ → ゴールを2つ指定（ドラッグ）→ 攻めるチームを選ぶ → 探す → 正解と比べる
//       → サムネイル → 続けて再生 → チームの付け替え・入れ替え・手で足す → 動画にする → 開き直して結果が戻る
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

async function ensureVideo(name, segs, rim) {
  const file = path.join(WORK, name);
  if (!fs.existsSync(file) || !fs.existsSync(file + '.json')) { console.log(`（合成動画を作っています：${name} ${segs}${rim ? '・リングに当たるシュート入り' : ''}）`); await make(file, segs, 30, 4, rim || null); }
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
/* ゴールを指定する：そのコマへ移って、板を囲み、拡大されたリングをなぞる */
async function markGoal(page, i, mark) {
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
  const b = mark.box, r = mark.rim;
  await drag(await scr(b.x, b.y), await scr(b.x + b.w, b.y + b.h));
  await drag(await scr(r.cx - r.w / 2, r.cy), await scr(r.cx + r.w / 2, r.cy));
  return page.evaluate((i) => BS.app.S.st.hoops[i], i);
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

    console.log('\n■ ゴールを教える（ドラッグ）');
    for (const i of [0, 1]) {
      const m = v1.truth.marks[i];
      const got = await markGoal(page, i, m);
      const d = got ? Math.max(Math.abs(got.box.x - m.box.x), Math.abs(got.box.y - m.box.y), Math.abs(got.rim.cx - m.rim.cx), Math.abs(got.rim.cy - m.rim.cy), Math.abs(got.rim.w - m.rim.w)) : 99;
      ok(got && d < 3, `ゴール${'AB'[i]} をドラッグで指定できる（ずれ ${d.toFixed(2)} 画素）`);
    }
    // 動画のはじめ（前半）：ゴールA（左）を攻めるのは赤＝相手
    await page.click('.teambtn[data-hoop="0"][data-team="1"]');
    ok(JSON.stringify(await page.evaluate(() => BS.app.S.st.hoopTeam)) === '[1,0]', '「ゴールA を攻めているのは相手」で、ゴールB は自動で自分になる');

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

    console.log('\n■ 入っていたかも？（外れと判定したシュートから、得点に直す）');
    const mbs = await page.evaluate(() => BS.app.maybes().map((m) => ({ id: m.id, t: m.t, team: m.team })));
    const mbTeam = mbs.length ? mbs[0].team : null;
    ok(mbs.length > 0, '外れと判定したシュートが候補に並ぶ', mbs.length);
    if (mbs.length) {
      await page.click('#tab' + mbTeam);
      await page.click('#maybes summary');
      const shown = await page.$$eval('#maybes .mb', (els) => els.length);
      ok(shown === mbs.filter((m) => m.team === mbTeam).length, 'そのチームが打った外れが、タブの下に並ぶ', shown);
      const before = (await counts(page))[mbTeam];
      await page.click(`[data-promote="${mbs[0].id}"]`);
      const after = (await counts(page))[mbTeam];
      ok(after === before + 1, '「入っていた」で得点の一覧に入る', [before, after]);
      const pc = await page.evaluate((id) => BS.app.clipsFor(BS.app.S.tab).find((c) => c.id === id), mbs[0].id);
      ok(pc && Math.abs(pc.t1 - pc.at - 2.5) < 0.01, '入っていたにした場面は、後ろを長めに（入るまで見える）', pc && [pc.at, pc.t1]);
      ok(await page.$(`[data-unpromote="${mbs[0].id}"]`), '一覧に「↩」（外れに戻す）が出る');
      await page.click(`[data-unpromote="${mbs[0].id}"]`);
      ok((await counts(page))[mbTeam] === before, '「↩」で外れに戻る');
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
    await openVideo(page2, v2.file);
    await page2.click('.sw[data-team="0"][data-color="青"]');
    await page2.click('.sw[data-team="1"][data-color="赤"]');
    for (const i of [0, 1]) await markGoal(page2, i, v2.truth.marks[i]);
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
      await openVideo(page3, webm);
      for (const i of [0, 1]) await markGoal(page3, i, v1.truth.marks[i]);
      await page3.click('.teambtn[data-hoop="0"][data-team="1"]');
      const r3 = await analyse(page3, 180000);
      ok(r3.mode === 'playback', '互換モード（再生しながら）で探した', r3.mode);
      const t3 = Object.assign({}, v1.truth, { shots: v1.truth.shots.filter((s) => s.t < 42) });
      const cmp3 = compare(r3.items, t3);
      ok(cmp3.found === cmp3.rows.length && cmp3.teamOk === cmp3.found && cmp3.extra.length === 0, `最初の 45 秒の得点 ${cmp3.rows.length} 本を、正しいチームで見つけた`, { found: cmp3.found, teamOk: cmp3.teamOk, extra: cmp3.extra.map((x) => x.t) });
      ok(P3.errors.length === 0, 'ページのエラーがない', P3.errors.slice(0, 3));
      await page3.close();
    }

    // リングに当たってから入る得点・ゴールの追跡（この 60 秒で、もとのエンジンはゴールを 40 秒見失い、リングを回って入った 2 本を落とした）
    console.log('\n■ リングに当たってから入る得点（ゴールを見失わない）');
    const v4 = await ensureVideo('rim360.mp4', '360-420', { makes: 0.7, misses: 0.6 });
    const P4 = await openPage(browser, srv.url);
    const page4 = P4.page;
    await page4.evaluate(() => localStorage.clear());
    await openVideo(page4, v4.file);
    for (const i of [0, 1]) await markGoal(page4, i, v4.truth.marks[i]);
    await page4.click('.teambtn[data-hoop="0"][data-team="1"]');
    const r4 = await analyse(page4);
    const cmp4 = compare(r4.items, v4.truth);
    cmp4.rows.forEach((r) => console.log(`     正解 ${r.s.t.toFixed(1)} ${r.s.rim || 'きれい'} ${r.s.team ? '赤' : '青'} → ${r.it ? `${r.it.t.toFixed(1)} ${r.it.team ? '入れられた' : '入れた'}` : '★見つからない'}`));
    const rimIns = cmp4.rows.filter((r) => r.s.rim);
    ok(rimIns.length >= 2 && rimIns.every((r) => r.it && r.it.team === r.s.team), `リングを転がって・回って入った得点 ${rimIns.length} 本を、正しいチームで見つけた`, rimIns.map((r) => [r.s.t, r.s.rim, !!r.it]));
    ok(cmp4.found === cmp4.rows.length && cmp4.teamOk === cmp4.found, `この区間の得点 ${cmp4.rows.length} 本をすべて見つけた`, { found: cmp4.found, teamOk: cmp4.teamOk });
    ok(P4.errors.length === 0, 'ページのエラーがない', P4.errors.slice(0, 3));
    await page4.close();
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
