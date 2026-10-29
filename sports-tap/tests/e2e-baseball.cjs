// 野球の画面を通した確認（Playwright の Chromium を画面なしで動かし、スマホ・iPad と同じようにタップする）
//   node sports-tap/tests/e2e-baseball.cjs [dev|built]
//     dev   … sports-tap/index.html（js/ と css/ を読む版）
//     built … public/sports-tap/index.html（1ファイル版。公開するもの）
//   SHOTS=フォルダ を付けると、画面の写真を保存する（見た目の確認用）
// 準備（打順・先発投手・先攻・イニング・投球数の目安）→ 1球ずつ（カウント・四球・三振）→ 打席の結果（走者・得点・チェンジ）
// → 取り消し・やり直し → 塁のタップ・＋1点 → 投手の交代・代打 → 一覧で直す → 1球ずつをやめる → 集計 → CSV → 開き直し、
// と、スマホ縦・iPad 横・スマホ横で、ボタンが画面からはみ出さないこと。時計は Playwright の clock で進める。
const fs = require('fs');
const path = require('path');
// 日本語のファイル名でダウンロードできるように（LANG がない環境では、Chromium が名前を「download」にしてしまう）
if (!process.env.LANG) process.env.LANG = 'C.UTF-8';
const { chromium } = require('./pw.cjs');
const { start } = require('./server.cjs');

const MODE = process.argv[2] || 'dev';
const SHOTS = process.env.SHOTS || '';
let pass = 0, fail = 0;
const ok = (c, name, extra) => { if (c) { pass++; console.log('  ok  ', name); } else { fail++; console.log('  FAIL', name, extra !== undefined ? JSON.stringify(extra) : ''); } };
const eq = (a, b, name) => ok(JSON.stringify(a) === JSON.stringify(b), name, { got: a, want: b });
const section = (t) => console.log('\n■ ' + t);
const T0 = new Date('2026-10-25T01:00:00Z');       // 日本時間 10:00
const shot = async (page, name) => { if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: path.join(SHOTS, name + '.png'), animations: 'disabled' }); } };

async function openPage(browser, url, vp) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 2, hasTouch: true, isMobile: vp.width < 900, acceptDownloads: true, locale: 'ja-JP', timezoneId: 'Asia/Tokyo' });
  await ctx.addInitScript(() => { try { Object.defineProperty(navigator, 'canShare', { value: () => false, configurable: true }); } catch (e) { /* 無視 */ } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.clock.install({ time: new Date(T0.getTime() - 20000) });
  await page.goto(url);
  await page.waitForFunction(() => window.ST && ST.app && document.querySelector('#view').children.length);
  await page.clock.pauseAt(T0);
  return { ctx, page, errors };
}
const sit = (page) => page.evaluate(() => { const s = ST.SPORTS.baseball.situation(ST.app.S.game); return { half: s.halfText, outs: s.outs, b: s.b, s: s.s, bat: s.bat, slot: s.slot, batter: s.batter, pitcher: s.pitcherNo, pc: s.pitchCount, score: s.score, bases: s.bases.map((x) => (x ? x.no || '?' : null)) }; });
const text = (page, sel) => page.$eval(sel, (e) => e.textContent.trim());
const count = (page, sel) => page.$$eval(sel, (l) => l.length);
/* 1つ押して、時計を少し進める（同じボタンの二度押しの防止に当たらないように） */
async function tap(page, sel, ms) { await page.tap(sel); await page.clock.runFor(ms || 3000); }
/* ボタンが画面の中に収まっているか（はみ出し・小さすぎない・文字がはみ出さない）・上の帯が重ならないか */
async function layoutBad(page) {
  return page.evaluate(() => {
    const W = innerWidth, H = innerHeight, bad = [];
    document.querySelectorAll('.live button').forEach((b) => {
      if (b.offsetParent === null || b.closest('[hidden]') || b.closest('.cover')) return;
      const r = b.getBoundingClientRect();
      if (r.left < -1 || r.top < -1 || r.right > W + 1 || r.bottom > H + 1) bad.push(['はみ出す', b.id || b.className, Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)]);
      const minSide = b.classList.contains('bb-base') ? 30 : 34;
      if (r.width < minSide || r.height < minSide) bad.push(['小さい', b.id || b.className, Math.round(r.width), Math.round(r.height)]);
      b.querySelectorAll('b').forEach((x) => { if (x.offsetParent !== null && x.scrollWidth > x.clientWidth + 1) bad.push(['文字がはみ出す', b.id || b.className, x.textContent]); });
    });
    const parts = Array.from(document.querySelectorAll('.lbar > *')).filter((e) => e.offsetParent !== null);
    const flat = [];
    parts.forEach((e) => { if (e.classList.contains('score')) e.querySelectorAll('.sc').forEach((x) => flat.push(x)); else flat.push(e); });
    for (let i = 1; i < flat.length; i++) { const a = flat[i - 1].getBoundingClientRect(), b = flat[i].getBoundingClientRect(); if (b.left < a.right - 1) bad.push(['上の帯が重なる', flat[i - 1].className, flat[i].className]); }
    // 状況の欄（打者・投手）の文字が切れていないか（縦にあふれない）
    document.querySelectorAll('.bb-card').forEach((c) => { if (c.scrollHeight > c.clientHeight + 2) bad.push(['欄の中があふれる', c.id, c.scrollHeight, c.clientHeight]); });
    return bad;
  });
}
/* 準備の画面：下の「記録の画面へ」の帯に隠れないよう、真ん中まで動かしてから押す */
async function tapC(page, sel) { await page.$eval(sel, (e) => e.scrollIntoView({ block: 'center' })); await page.tap(sel); }
async function setupGame(page, opts) {
  await page.tap('#btnNew');
  await page.waitForSelector('.bb-setup');
  await tapC(page, '#team0 [data-fill="seq"]');
  await page.fill('#team0 .tname', '致遠館'); await page.dispatchEvent('#team0 .tname', 'change');
  await page.fill('#team0 .bb-orow[data-slot="0"] .bb-nm', 'たろう'); await page.dispatchEvent('#team0 .bb-orow[data-slot="0"] .bb-nm', 'change');
  await page.$eval('#team0 .bb-orow[data-slot="0"] .bb-nm', (e) => e.focus());
  await tapC(page, '#team0 [data-pno="1"]');          // 名前の欄から、そのまま投手のボタンへ
  await page.fill('#team1 .tname', '城南'); await page.dispatchEvent('#team1 .tname', 'change');
  for (const [k, no] of [[0, '11'], [1, '12'], [2, '13']]) { await page.fill(`#team1 .bb-orow[data-slot="${k}"] .bb-no`, no); await page.dispatchEvent(`#team1 .bb-orow[data-slot="${k}"] .bb-no`, 'change'); }
  await page.fill('#bbPitcher1', '18'); await page.dispatchEvent('#bbPitcher1', 'change');
  if (opts.top) {
    // チーム名の欄から、そのまま先攻のボタンを押しても、タップが消えない（欄の「変わった」で作り直さない）
    await page.fill('#team1 .tname', '城南高'); await page.$eval('#team1 .tname', (e) => e.focus());
    await tapC(page, '#bbTop [data-top="1"]');
  }
  await tapC(page, `[data-opt="inn"] [data-v="${opts.inn}"]`);
  await tapC(page, `[data-opt="plim"] [data-v="${opts.plim}"]`);
}

(async () => {
  const root = MODE === 'built' ? path.join(__dirname, '..', '..', 'public', 'sports-tap') : path.join(__dirname, '..');
  const srv = await start(0, root);
  const browser = await chromium.launch();
  try {
    /* ================= スマホ縦 ================= */
    section('スマホ縦（390×664）：準備');
    let { ctx, page, errors } = await openPage(browser, srv.url + '?s=baseball', { width: 390, height: 664 });
    ok((await text(page, '.brand b')).includes('野球 タップ記録'), '?s=baseball で野球のホーム');
    await setupGame(page, { inn: 9, plim: 70 });
    eq(await page.$$eval('#team0 .bb-no', (l) => l.map((x) => x.value)), ['1', '2', '3', '4', '5', '6', '7', '8', '9'], '「背番号 1〜9 を順に」');
    eq(await text(page, '#team1 .bb-count'), '打順：9人（背番号を入れたのは 3人）', '相手：9人の打順のうち 3人だけ背番号');
    await shot(page, 'bb-phone-setup');
    await page.tap('#btnToLive');
    await page.waitForSelector('.fam-baseball');
    let g = await page.evaluate(() => ST.app.S.game);
    eq([g.sport, g.opts.inn, g.opts.plim, g.opts.top, g.teams[0].pitcher, g.teams[1].pitcher, g.teams[1].order, g.teams[0].players[0].name], ['baseball', 9, 70, 0, '1', '18', 9, 'たろう'], '試合の形式・先発投手・打順の人数・名前が入った');
    ok(await page.isVisible('#btnStartBig'), 'スタート前の札');
    ok((await text(page, '#cover')).includes('プレイボール'), '札に「プレイボール（試合開始）の瞬間」');
    ok((await text(page, '#cover')).includes('城南の投手 #18'), '札に 1回表の攻撃と投手');
    await shot(page, 'bb-phone-before');

    section('1球ずつ：カウント・投球数・四球・三振');
    await page.tap('#btnStartBig');
    await page.clock.runFor(4000);
    eq(await text(page, '#btnInning'), '1回表', '1回表');
    eq(await text(page, '.bb-bmain'), '1番#1', 'いまの打者：1番 #1');
    ok((await text(page, '#bbBatter')).includes('たろう'), '打者の名前');
    for (const id of ['bb_b', 'bb_s', 'bb_f', 'bb_f']) await tap(page, '#' + id);
    eq([await count(page, '#bso .db.on'), await count(page, '#bso .ds.on'), await text(page, '.bb-pc')], [1, 2, '4'], 'B1 S2・投球数 4（2ストライクのファウルはそのまま）');
    ok((await text(page, '#lastbar')).includes('ファウル（1-2）'), '下の帯：ファウル（1-2）');
    for (let i = 0; i < 3; i++) await tap(page, '#bb_b');
    let s = await sit(page);
    eq([s.b, s.s, s.slot, s.bases], [0, 0, 1, ['1', null, null]], '4ボールで四球：#1 が一塁・次は 2番');
    ok((await text(page, '#lastbar')).includes('→ 四球'), '下の帯：ボール（→ 四球）');
    ok(await page.$eval('#base0', (e) => e.classList.contains('on') && e.textContent === '1'), 'ダイヤモンドの一塁に #1');

    section('打席の結果：走者・得点・チェンジ');
    await tap(page, '#bb_1b');
    s = await sit(page);
    eq(s.bases, ['2', '1', null], '単打：一塁 #2・二塁 #1');
    await tap(page, '#bb_hr');
    s = await sit(page);
    eq([s.score, s.bases, await text(page, '#score0')], [[3, 0], [null, null, null], '3'], '本塁打：3点・走者なし・上の帯の得点');
    ok(await page.$eval('#score0', (e) => e.classList.contains('atbat')), '攻撃中のチームの得点に ▲');
    await tap(page, '#bb_k'); await tap(page, '#bb_go');
    eq(await count(page, '#bso .do.on'), 2, '2アウト');
    await tap(page, '#bb_fo');
    s = await sit(page);
    eq([s.half, s.bat, s.batter, s.pitcher], ['1回裏', 1, '11', '1'], '3アウトでチェンジ：1回裏・城南の 1番 #11・投手は #1');
    ok((await text(page, '#lastbar')).includes('チェンジ → 1回裏'), '下の帯に「3アウト チェンジ → 1回裏」');
    eq(await text(page, '#bbPitcher .bb-pnum'), '#1', '投手の欄：#1');
    await shot(page, 'bb-phone-live');

    section('取り消し・やり直し');
    await tap(page, '#btnUndo');
    s = await sit(page);
    eq([s.half, s.outs], ['1回表', 2], '取り消すと 1回表・2アウトに戻る');
    await page.tap('#btnMsgAct');
    await page.clock.runFor(1000);
    s = await sit(page);
    eq([s.half, s.outs], ['1回裏', 0], 'やり直すと 1回裏');

    section('塁のタップ・＋1点・アウト＋1');
    await tap(page, '#base2');
    eq((await sit(page)).bases, [null, null, '?'], '三塁を押して走者を置く');
    await tap(page, '#btnRun');
    s = await sit(page);
    eq([s.score, s.bases], [[3, 1], [null, null, null]], '＋1点：三塁の走者を消して1点');
    await tap(page, '#base0'); await tap(page, '#base0');
    eq((await sit(page)).bases, [null, null, null], '一塁を2回押すと、置いて消す');
    await tap(page, '#btnOut');
    eq((await sit(page)).outs, 1, 'アウト＋1');

    section('投手の交代・代打・打順を直す');
    await page.tap('#bbPitcher');
    await page.tap('.bb-slots [data-pno="2"]');
    await page.clock.runFor(2000);
    s = await sit(page);
    eq([s.pitcher, s.pc], ['2', 0], '投手を #2 に交代：投球数は 0 から');
    await tap(page, '#bb_s');
    eq(await text(page, '.bb-pc'), '1', '新しい投手の投球数');
    await page.tap('#bbBatter');
    await page.tap('#btnPinch');
    for (const k of ['2', '5']) await page.tap(`.key[data-key="${k}"]`);
    await page.tap('#btnKeyOk');
    await page.clock.runFor(2000);
    s = await sit(page);
    eq([s.slot, s.batter], [0, '25'], '代打 #25（1番）');
    await tap(page, '#bb_2b');
    eq((await sit(page)).bases, [null, '25', null], '代打の #25 の二塁打');
    await page.tap('#bbBatter');
    await page.tap('.bb-slots [data-slot="5"]');
    await page.clock.runFor(2000);
    eq((await sit(page)).slot, 5, '打順を直す：6番から');

    section('一覧で直す（本塁打 → 二塁打）');
    const hrId = await page.evaluate(() => ST.app.S.game.events.find((e) => e.type === 'hr').id);
    await page.tap('#btnMenu');
    await page.tap('text=記録の一覧');
    await page.waitForSelector(`.lrow[data-id="${hrId}"]`);
    ok((await text(page, `.lrow[data-id="${hrId}"]`)).includes('本塁打（3点）'), '一覧：本塁打（3点）');
    ok((await text(page, `.lrow[data-id="${hrId}"]`)).includes('1回表'), '一覧の時刻の欄：1回表');
    await page.tap(`.lrow[data-id="${hrId}"]`);
    await page.tap('[data-etype="2b"]');
    s = await sit(page);
    eq(s.score, [1, 1], '本塁打を二塁打に直すと、得点が 3 → 1（二塁の走者だけ生還）');
    await page.tap('.sheet-card header .x');

    section('投球数の目安（70球）');
    await page.evaluate(() => {
      const g = ST.app.S.game, sp = ST.SPORTS.baseball;
      const s = sp.situation(g);
      for (let i = 0; i < 61; i++) ST.addEvent(g, { t: ST.elapsed(g, Date.now()), type: 'f', team: s.bat, no: s.batter, slot: s.slot });
      ST.app.ctx.save(); ST.app.ctx.update();
    });
    let pc = (await sit(page)).pc;
    ok(pc >= 60 && pc < 70 && await page.$eval('#bbPitcher', (e) => e.classList.contains('lim-w') && !e.classList.contains('lim-x')), `${pc}球：黄色（目安の10球前から）`);
    ok((await text(page, '#bbPitcher')).includes(`あと${70 - pc}`), `「目安 70球まで あと${70 - pc}」`);
    await page.evaluate((n) => { const g = ST.app.S.game, s = ST.SPORTS.baseball.situation(g); for (let i = 0; i < n; i++) ST.addEvent(g, { t: ST.elapsed(g, Date.now()), type: 'f', team: s.bat, no: s.batter, slot: s.slot }); ST.app.ctx.update(); }, 70 - pc);
    ok(await page.$eval('#bbPitcher', (e) => e.classList.contains('lim-x')), '70球：赤');
    let bad = await layoutBad(page);
    ok(!bad.length, 'スマホ縦：ボタンが画面に収まる・上の帯が重ならない', bad);
    await shot(page, 'bb-phone-limit');

    section('設定：1球ずつは記録しない');
    await page.tap('#btnMenu');
    await page.tap('text=設定');
    await page.click('input[data-pref="pitch"]');
    await page.tap('.sheet-card header .x');
    ok(await page.$eval('.bb-pitch', (e) => e.hidden), '1球のボタンが消える');
    const pc0 = Number(await text(page, '.bb-pc'));
    await tap(page, '#bb_go');
    eq(Number(await text(page, '.bb-pc')), pc0 + 1, '結果だけ：投球数は結果1つで1球');
    bad = await layoutBad(page);
    ok(!bad.length, '1球のボタンがなくても、収まる', bad);
    await page.tap('#btnMenu'); await page.tap('text=設定'); await page.click('input[data-pref="pitch"]'); await page.tap('.sheet-card header .x');
    ok(await page.$eval('.bb-pitch', (e) => !e.hidden), '設定を戻すと、1球のボタンが出る');

    section('集計・CSV');
    await page.tap('#btnMenu');
    await page.tap('text=集計');
    await page.waitForSelector('#bbBoard');
    const board = await page.$$eval('#bbBoard tbody tr', (rows) => rows.map((r) => Array.from(r.children).map((c) => c.textContent.trim())));
    eq(board[0].slice(1, 3).concat(board[0].slice(-3)), ['1', '', '1', '2', '0'], 'スコアボード：致遠館 1回 1点・R 1・H 2（単打・直した二塁打）・E 0');
    eq(board[1].slice(1, 2).concat(board[1].slice(-3)), ['1', '1', '1', '0'], 'スコアボード：城南 1回裏 1点・R 1・H 1');
    eq(board[0].length, 1 + 9 + 3, '9回まで並ぶ（試合の形式）');
    ok((await text(page, '.stats')).includes('投球数'), '投手の表');
    ok(await page.$$eval('.stats td.bb-over', (l) => l.length === 1), '目安に届いた投手（#2）は赤');
    await shot(page, 'bb-phone-stats');
    await page.tap('.sheet-foot .btn:not(.primary)');       // 書き出す
    const dl = async (sel) => {
      const [d] = await Promise.all([page.waitForEvent('download'), page.tap(sel)]);
      const p = await d.path();
      await page.clock.runFor(10000);         // 「保存しました」のお知らせが消えるまで（次のボタンに重なるため）
      return { name: d.suggestedFilename(), text: fs.readFileSync(p, 'utf8') };
    };
    const bat = await dl('#btnExp_bat');
    ok(/^野球記録_2026-10-25_1000_致遠館vs城南_打者\.csv$/.test(bat.name), '打者の CSV のファイル名', bat.name);
    ok(bat.text.charCodeAt(0) === 0xfeff && bat.text.includes('打席,打数,安打') && bat.text.includes('致遠館,1,1,たろう'), '打者の CSV（BOM 付き・見出し・1番 たろう）');
    const pit = await dl('#btnExp_pit');
    ok(pit.text.includes('投球数') && pit.text.includes('城南,18,') && pit.text.includes('致遠館,1,') && pit.text.includes('致遠館,2,'), '投手の CSV（城南の #18・致遠館の #1・#2）');
    const lst = await dl('#btnExp_csv');
    ok(lst.text.includes('イニング,表裏,アウト（前）') && lst.text.includes('本塁打') === false && lst.text.includes('二塁打'), '記録の一覧の CSV（直した二塁打）');
    const js = await dl('#btnExpJson');
    const data = JSON.parse(js.text);
    ok(data.format === 'sports-tap' && data.sport === 'baseball' && Array.isArray(data.linescore) && data.events.some((e) => e.inning === 1 && e.half === '裏'), '記録のファイル（JSON）にイニング・表裏');
    await page.tap('.sheet-card header .x');

    section('開き直すと続きから');
    const before = await sit(page);
    await page.reload();
    await page.waitForSelector('.fam-baseball');
    eq(await sit(page), before, '開き直しても同じ状況（イニング・アウト・カウント・走者・得点・投手）');
    eq(errors, [], 'スマホ縦：ページのエラーなし');
    await ctx.close();

    /* ================= iPad 横 ================= */
    section('iPad 横（1180×820）：相手が先攻');
    ({ ctx, page, errors } = await openPage(browser, srv.url + '?s=baseball', { width: 1180, height: 820 }));
    await setupGame(page, { inn: 7, plim: 0, top: true });
    await page.tap('#btnToLive');
    await page.waitForSelector('.fam-baseball');
    ok(await page.$eval('.fam-baseball', (e) => e.classList.contains('bb-wide')), '横長の並べ方');
    await page.tap('#btnStartBig');
    await page.clock.runFor(3000);
    s = await sit(page);
    eq([s.half, s.bat, s.batter, s.pitcher], ['1回表', 1, '11', '1'], '相手が先攻：1回表は城南の攻撃・投手は致遠館の #1');
    for (const id of ['bb_b', 'bb_s', 'bb_1b', 'bb_bb', 'bb_e']) await tap(page, '#' + id);
    s = await sit(page);
    eq([s.bases, s.slot, s.batter], [['13', '12', '11'], 3, null], '単打・四球・失策で満塁・次は 4番（背番号なし）');
    eq(await text(page, '.bb-bmain'), '4番', '背番号のない打順は「4番」だけ');
    ok(await page.$eval('#bbPitcher', (e) => !e.classList.contains('lim-w') && !e.classList.contains('lim-x') && e.querySelector('.bb-plim').hidden), '投球数の目安「なし」：色は付かない');
    bad = await layoutBad(page);
    ok(!bad.length, 'iPad 横：ボタンが画面に収まる・上の帯が重ならない', bad);
    const big = await page.$eval('#bb_1b', (e) => { const r = e.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; });
    ok(big[0] >= 150 && big[1] >= 90, 'iPad 横：結果のボタンが大きい', big);
    await shot(page, 'bb-ipad-live');
    await page.tap('#btnMenu'); await page.tap('text=集計');
    await page.waitForSelector('#bbBoard');
    const b2 = await page.$$eval('#bbBoard tbody tr th', (l) => l.map((x) => x.textContent.trim()));
    eq(b2, ['城南高', '致遠館'], 'スコアボードは先攻（城南高）が上（名前の欄から、そのまま先攻のボタンを押せた）');
    eq(await page.$$eval('#bbBoard thead th', (l) => l.length), 1 + 7 + 3, '7回まで並ぶ');
    await page.tap('.sheet-card header .x');
    eq(errors, [], 'iPad 横：ページのエラーなし');
    await ctx.close();

    /* ================= スマホ横・小さなスマホ ================= */
    for (const vp of [{ width: 844, height: 390 }, { width: 375, height: 553 }]) {
      section(`${vp.width}×${vp.height}`);
      ({ ctx, page, errors } = await openPage(browser, srv.url + '?s=baseball', vp));
      await setupGame(page, { inn: 7, plim: 80 });
      await page.tap('#btnToLive');
      await page.waitForSelector('.fam-baseball');
      await page.tap('#btnStartBig');
      await page.clock.runFor(3000);
      for (const id of ['bb_b', 'bb_1b', 'bb_2b']) await tap(page, '#' + id);
      bad = await layoutBad(page);
      ok(!bad.length, `${vp.width}×${vp.height}：ボタンが画面に収まる・上の帯が重ならない`, bad);
      await shot(page, `bb-${vp.width}x${vp.height}`);
      eq(errors, [], 'ページのエラーなし');
      await ctx.close();
    }
  } finally {
    await browser.close();
    await srv.close();
  }
  console.log(`\n${pass} ok / ${fail} fail`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
