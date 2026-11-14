// 画面を通した確認：📊 これまでの集計（ホームのボタン → チーム・しぼり方・表・グラフ・場所・書き出し・戻る）
//   node basket-tap/tests/e2e-totals.cjs [dev|built]
//     dev   … basket-tap/index.html（js/ と css/ を読む版）
//     built … public/basket-tap/index.html（1ファイル版。公開するもの）
//   SHOTS=フォルダ を付けると、画面の写真をそこに保存する（明るい・暗い画面、390 と 1180 の幅）
// 画面に出た数は、同じページの BT.agg で計算した数と、手で数えた数（tests/unit-agg.cjs と同じ試合）でくらべる。
const fs = require('fs');
const path = require('path');
const { chromium } = require('./pw.cjs');
const { stubCloud } = require('./cloudstub.cjs');
const { start } = require('./server.cjs');

const MODE = process.argv[2] || 'dev';
const SHOTS = process.env.SHOTS || '';
let pass = 0, fail = 0;
const ok = (c, name, extra) => { if (c) { pass++; console.log('  ok  ', name); } else { fail++; console.log('  FAIL', name, extra !== undefined ? JSON.stringify(extra) : ''); } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const shot = async (page, name, full) => { if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: path.join(SHOTS, name + '.png'), fullPage: !!full, animations: 'disabled' }); } };

/* 試合を作って保存する（ページの中で。unit-agg.cjs と同じ試合＋ミライの古い試合 I） */
function seed(page) {
  return page.evaluate(() => {
    const DAY = 86400000, T0 = Date.UTC(2026, 9, 1, 6, 0, 0);
    const RIM = [0.5, 0.1], T3 = [0.5, 0.75], PAINT = [0.4, 0.3], C3L = [0.03, 0.05], LONGC = [0.5, 0.9];
    const rep = (n, f) => Array.from({ length: n }, (_, i) => f(i));
    function mk(id, day, names, evs, o) {
      o = o || {};
      const g = BT.newGame({ id, now: T0 + day * DAY, tz: 540, teams: [{ name: names[0], color: o.c0 || '#f4f4f4', players: o.p0 || [] }, { name: names[1], color: o.c1 || '#2f6fed', players: o.p1 || [] }] });
      g.startedAt = T0 + day * DAY;
      if (!o.going) g.endedAt = g.startedAt + 3600000;
      if (o.court) g.court = o.court;
      if (o.demo) g.demo = true;
      if (o.gc) g.gc = o.gc;
      evs.forEach(([t, team, no, type, x, y]) => { const e = BT.addEvent(g, type === 'period' ? { t, type, period: no } : { t, type, team, no }); if (x != null) { e.x = x; e.y = y; } });
      g.updatedAt = g.startedAt;
      BT.store.saveGame(g);
      return g;
    }
    mk('gA', 0, ['ミライ', 'ヒガシ'], [
      [0, null, 1, 'period'],
      [1, 0, '4', 'fg2', ...RIM], [2, 0, '4', 'fg2x', ...RIM], [3, 0, '4', 'fg3', ...T3], [4, 0, '4', 'ftx'], [5, 0, '4', 'ft'],
      [6, 0, '4', 'reb'], [7, 0, '4', 'ast'], [8, 0, '4', 'tov'],
      [9, 0, '7', 'fg2', ...PAINT], [10, 0, '7', 'fg3x', ...C3L], [11, 0, '7', 'oreb'], [12, 0, '7', 'pass'],
      [100, null, 2, 'period'],
      [101, 0, '7', 'foul'], [102, 0, '7', 'stl'], [103, 0, null, 'fg2'],
      [104, 1, '10', 'fg2'], [105, 1, '10', 'fg2'], [106, 1, '10', 'fg3'], [107, 1, '10', 'ftx'], [108, 1, '10', 'tov'], [109, 1, '10', 'foul'],
      [110, 1, null, 'pass'], [111, null, null, 'pass']
    ], { p0: [{ no: '4', name: 'タロウ' }, { no: '7', name: '' }], court: 'std', c0: '#d93636' });
    mk('gB', 7, ['ニシ', 'ミライ'], [
      [1, 1, '4', 'fg2', ...RIM], [2, 1, '4', 'fg2', ...RIM], [3, 1, '9', 'fg3'], [4, 1, '4', 'tov'],
      [5, 0, '5', 'fg2'], [6, 0, '5', 'fg2'], [7, 0, '5', 'ft']
    ], { p1: [{ no: '4', name: 'たろう' }], c1: '#d93636' });
    mk('gC', 14, ['ミライ', 'ヒガシ'], [[1, 0, '7', 'fg2', ...LONGC], [2, 0, '7', 'fg2x', ...LONGC], [3, 1, '10', 'fg2']], { p0: [{ no: '7', name: 'なな' }], court: 'mini', c0: '#d93636' });
    mk('gD', 21, ['ミライ', 'キタ'], [
      ...rep(4, (i) => [1 + i, 0, '4', 'fg2', ...RIM]), [5, 0, '4', 'fg2x', ...RIM],
      [6, 0, '4', 'fg3', ...T3], ...rep(4, (i) => [7 + i, 0, '4', 'fg3x', ...T3]),
      [11, 0, '7', 'fg2', ...PAINT], [12, 0, '7', 'fg2', ...PAINT], [13, 0, '7', 'fg2x', ...PAINT], [14, 0, '7', 'fg2x', ...PAINT],
      ...rep(10, (i) => [20 + i, 1, '11', 'fg3'])
    ], { court: 'std', c0: '#d93636' });
    mk('gE', 30, ['ミライ', 'デモ'], [[1, 0, '4', 'fg2']], { demo: true });
    mk('gF', 31, ['ミライ', 'ゼロ'], [[0, null, 1, 'period']]);
    mk('gG', -10, ['', 'ヒガシ'], [[1, 0, '4', 'fg2']]);
    mk('gH', 28, ['ミライ', 'ミナミ'], [[1, 0, '4', 'ft']], { going: true, gc: { run: true, left: 300 }, c0: '#d93636' });
    mk('gI', -20, ['ミライ', 'サクラ'], [[1, 0, '12', 'fg2'], [2, 0, '12', 'fg3'], [3, 1, '8', 'fg2']], { p0: [{ no: '12', name: 'じろう' }], c0: '#d93636' });
    BT.store.setCurrent(null);
  });
}
/* いまの画面と同じ試合の組で、BT.agg を計算する */
const aggNow = (page) => page.evaluate(() => {
  const T = BT.totals.state;
  const games = BT.agg.eligible(BT.store.games().map((s) => BT.store.loadGame(s.id)).filter(Boolean).concat(Array.from(T.cloud.values())));
  const used = BT.agg.pick(BT.agg.gamesFor(games, T.key), { recent: T.recent, exclude: T.excl });
  const R = BT.agg.compute(used);
  const rt = BT.agg.rates(R.usSh);
  return { n: R.n, w: R.w, l: R.l, d: R.d, pf: R.pf, pa: R.pa, fg: BT.agg.fmtPct(rt.fg), efg: BT.agg.fmtPct(rt.efg), fg3: BT.agg.fmtPct(rt.fg3), ft: BT.agg.fmtPct(rt.ft), avgPts: BT.agg.fmtAvg(R.pf / R.n), avgPa: BT.agg.fmtAvg(R.pa / R.n),
    players: R.players.map((p) => ({ no: p.no, pts: p.s.pts, games: p.games })), to: R.us.to, reb: R.us.reb, pcsv: BT.agg.playersCSV(R), gcsv: BT.agg.gamesCSV(R), ids: R.games.map((g) => g.id) };
});
const tile = (page, id) => page.evaluate((id) => { const t = document.querySelector(`.tt-tile[data-tile="${id}"] .tv`); return t ? t.textContent : null; }, id);
const tableRows = (page) => page.evaluate(() => Array.from(document.querySelectorAll('#ttPlayerTable tbody tr')).map((tr) => ({ no: tr.dataset.no || tr.className, cells: Object.fromEntries(Array.from(tr.querySelectorAll('td')).map((td) => [td.dataset.k, td.textContent])) })));
const zones = (page) => page.evaluate(() => { const o = {}; document.querySelectorAll('#ttZoneTable tbody tr').forEach((tr) => { o[tr.querySelector('th').textContent] = Array.from(tr.querySelectorAll('td')).map((td) => td.textContent).join(' '); }); return o; });
const count = (page) => page.textContent('#ttCount');
const clean = async (page) => { const t = await page.evaluate(() => document.querySelector('#view').textContent); return !/NaN|undefined|null|Infinity/.test(t); };
const fits = (page) => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
/* 押せるもの（ボタン・チェック）の高さが 40px 以上か */
const targets = (page) => page.evaluate(() => {
  const small = [];
  document.querySelectorAll('.tot .btn, .tt-sort, .tt-check, #ttTeam, #btnTotalsHome').forEach((el) => { const r = el.getBoundingClientRect(); if (r.width && r.height < 39.5) small.push([el.id || el.className, Math.round(r.height)]); });
  return small;
});

(async () => {
  const root = MODE === 'built' ? path.join(__dirname, '..', '..', 'public', 'basket-tap') : path.join(__dirname, '..');
  if (MODE === 'built' && !fs.existsSync(path.join(root, 'index.html'))) { console.log('public/basket-tap/index.html がありません。先に node basket-tap/build.mjs'); process.exit(1); }
  const srv = await start(0, root);
  const browser = await chromium.launch();
  const errors = [];
  async function openPage(vp, scheme) {
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: SHOTS ? 2 : 1, hasTouch: true, isMobile: vp.width < 900, acceptDownloads: true, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', colorScheme: scheme || 'light' });
    await ctx.addInitScript(() => {
      try { Object.defineProperty(navigator, 'canShare', { value: () => false, configurable: true }); } catch (e) { /* 無視 */ }
      // 保存するファイルの名前（ヘッドレスの Chromium は、日本語の名前の blob を「download」にしてしまうので、a.download で確かめる）
      const click = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = function () { if (this.download) (window.__dl = window.__dl || []).push(this.download); return click.call(this); };
    });
    const cloud = await stubCloud(ctx);
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(srv.url);
    await page.waitForFunction(() => window.BT && BT.app && BT.totals && document.querySelector('#view').children.length);
    return { ctx, page, cloud };
  }
  try {
    console.log(`\n■ ${MODE === 'built' ? '1ファイル版' : '開発版'}・ホームの入口（390×844）`);
    let { ctx, page, cloud } = await openPage({ width: 390, height: 844 });
    ok(!(await page.$('#btnTotals')), '試合がないときは、ボタンを出さない');
    await page.evaluate(() => { const g = BT.newGame({ id: 'onlyDemo' }); g.demo = true; BT.addEvent(g, { t: 1, type: 'fg2', team: 0, no: '4' }); BT.store.saveGame(g); const z = BT.newGame({ id: 'zero' }); BT.store.saveGame(z); BT.app.go('home'); });
    ok(!(await page.$('#btnTotals')), 'デモの試合・記録のない試合だけのときも、出さない');
    await page.evaluate(() => { BT.store.deleteGame('onlyDemo'); BT.store.deleteGame('zero'); });
    await seed(page);
    // クラウドにだけある試合（ミライ 4 − 0 ヒガシ・別の端末で記録したもの）
    const cg = await page.evaluate(() => { const g = BT.newGame({ id: 'gCloud', now: Date.UTC(2026, 8, 1, 6), tz: 540, teams: [{ name: 'ミライ' }, { name: 'ヒガシ' }] }); g.startedAt = g.createdAt; g.endedAt = g.startedAt + 1000; BT.addEvent(g, { t: 1, type: 'fg2', team: 0, no: '4' }); BT.addEvent(g, { t: 2, type: 'fg2', team: 0, no: '4' }); return { data: g, summary: BT.summary(g) }; });
    cloud.games.gCloud = { data: cg.data, summary: cg.summary, at: 1 };
    await page.evaluate(() => BT.app.go('home'));
    const order = await page.evaluate(() => { const b = document.querySelector('#btnTotals'); const n = b && b.nextElementSibling; return { text: b && b.textContent, next: n && n.querySelector('h2') && n.querySelector('h2').textContent }; });
    ok(order.text && order.text.includes('📊') && order.text.includes('これまでの集計') && order.text.includes('7試合'), 'ボタン「📊 これまでの集計」（デモ・記録なしは数えない：7試合）', order.text);
    ok(order.next === 'これまでの試合', '「これまでの試合」のすぐ上', order);
    await shot(page, 'totals-home-390');
    await page.click('#btnTotals');
    await page.waitForSelector('#ttFilters');
    ok(await page.evaluate(() => document.body.dataset.view === 'totals' && BT.app.S.view === 'totals'), '押すと、これまでの集計（view totals）');
    ok(await page.evaluate(() => { const o = document.querySelector('#ttTeam'); return o && o.options[o.selectedIndex].textContent; }) === 'ミライ（6試合）', 'チームは、自分の側にいちばん多い「ミライ」（6試合）');
    ok((await count(page)).startsWith('6 試合を集計'), '6 試合を集計', await count(page));
    let a = await aggNow(page);
    ok(a.n === 6 && a.pf === 40 && a.pa === 46, '計算：6試合・得点 35+5・失点 44+2', a);
    ok(await tile(page, 'n') === '6' && await tile(page, 'wl') === `${a.w}勝 ${a.l}敗 1分` && a.w === 4, 'まとめ：試合数・4勝 1敗 1分', [await tile(page, 'wl')]);
    ok(await tile(page, 'pts') === `${a.avgPts} − ${a.avgPa}` && a.avgPts === '6.7', `平均得点 − 平均失点（${a.avgPts} − ${a.avgPa}）`, await tile(page, 'pts'));
    ok(await tile(page, 'fg') === '55%' && await tile(page, 'efg') === '59%' && await tile(page, 'fg3') === '29%' && await tile(page, 'ft') === '50%', 'FG 55%・eFG 59%・3P 29%・FT 50%（外れも記録した 3 試合）');
    ok((await page.textContent('#ttBasis')).includes('外れも記録した 3 試合で計算'), '成功率が何試合からかを書く');
    ok(await tile(page, 'to') === '0.5' && await tile(page, 'reb') === '0.3', 'ターンオーバー（1試合）3/6・リバウンド 2/6');
    let rows = await tableRows(page);
    ok(rows.map((r) => r.no).join(',') === '4,7,12,9,unk,tot', '選手ごと：得点の多い順（#4 22・#7 8・#12 5・#9 3）→ 番号なし → 合計', rows.map((r) => r.no));
    ok(rows[0].cells.pts === '22' && rows[0].cells.name === 'たろう' && rows[0].cells.games === '4' && rows[0].cells.avg === '5.5', '#4：22 点・名前は新しい「たろう」・4試合・平均 5.5', rows[0].cells);
    ok(rows[0].cells.fg2 === '5/771%+2', '#4 の 2P：成功率は外れも記録した試合（5/7・71%）＋ほかの試合で入れた 2', rows[0].cells.fg2);
    ok(rows[3].cells.fg3 === '1' && rows[3].cells.fg === '—', '#9：外れの記録のない試合だけ → 入れた本数・成功率は「—」', rows[3].cells);
    ok(rows[5].cells.pts === '40' && rows[5].cells.no === '—', '合計の行', rows[5].cells);
    ok(await page.evaluate(() => document.querySelector('#ttPlayerTable th[aria-sort]').textContent.startsWith('得点')) && (await page.textContent('#ttPlayerTable [data-sort="pts"]')).includes('▼'), '並べている列（得点 ▼）が分かる');
    ok(await clean(page), 'NaN・undefined・null の文字がない');
    ok(await fits(page), '横にはみ出さない（390）');
    ok((await targets(page)).length === 0, '押すものは、どれも高さ 40px 以上', await targets(page));
    await shot(page, 'totals-390-light', true);

    console.log('\n■ 並べかえ・1試合あたり');
    await page.click('[data-sort="no"]');
    rows = await tableRows(page);
    ok(rows.map((r) => r.no).slice(0, 4).join(',') === '4,7,9,12' && (await page.textContent('[data-sort="no"]')).includes('▲'), '背番号を押す → 小さい順 ▲');
    await page.click('[data-sort="no"]');
    ok((await tableRows(page)).map((r) => r.no).slice(0, 4).join(',') === '12,9,7,4', 'もう一度 → 大きい順');
    await page.click('[data-sort="fg2"]');
    rows = await tableRows(page);
    ok(rows.map((r) => r.no).slice(0, 4).join(',') === '4,7,9,12' && rows[4].no === 'unk' && rows[5].no === 'tot', '2P（成功率）：#4 71%・#7 57%・—（#12・#9）は下・番号なしと合計はいつも下', rows.map((r) => r.no));
    await page.click('[data-per="1"]');
    rows = await tableRows(page);
    ok(rows.find((r) => r.no === '4').cells.pts === '5.5' && rows.find((r) => r.no === 'tot').cells.pts === '6.7' && !(await page.$('[data-sort="avg"]')), '1試合あたり：#4 22/4・合計 40/6', rows.find((r) => r.no === '4').cells);
    ok(await clean(page), '1試合あたりでも NaN などがない');
    await page.click('[data-per="0"]');
    await page.click('[data-sort="pts"]');

    console.log('\n■ シュートの場所');
    ok(await page.evaluate(() => document.querySelectorAll('#ttShots svg.court .mk.made').length) > 0 && await page.evaluate(() => document.querySelector('#ttShots svg.court').dataset.court) === 'std', 'コートの図（ふつうのコートが多い）');
    let z = await zones(page);
    ok(z['ゴール下'] === '5/7 71%' && z['3P トップ'] === '2/6 33%' && z['ペイント'] === '3/5 60%', 'ゾーン：ゴール下 5/7・3P トップ 2/6・ペイント 3/5', z);
    let ins = await page.textContent('#ttInsight');
    ok(ins.includes('いちばん入っているのは ゴール下') && ins.includes('いちばん入っていないのは 3P トップ'), '読み取り：ゴール下と 3P トップ', ins);
    ok(await page.evaluate(() => document.querySelectorAll('#ttShots svg.court .mk.made').length + document.querySelectorAll('#ttShots svg.court .mk.miss').length) === 21, '図の点は 21（外れを記録していない試合 B の点も）');
    await page.click('#ttShots [data-shotno="7"]');
    z = await zones(page);
    ins = await page.textContent('#ttInsight');
    ok(z['ペイント'] === '3/5 60%' && z['ゴール下'] === '0/0 —' && ins.includes('ペイント') && ins.includes('だけ'), '#7 だけ：ペイント 3/5・5本以上はペイントだけ', [z, ins]);
    ok(await page.evaluate(() => document.querySelectorAll('#ttShots svg.court .mk.made').length + document.querySelectorAll('#ttShots svg.court .mk.miss').length) === 6, '#7 の点は 6');
    await page.click('#ttShots [data-court="mini"]');
    z = await zones(page);
    ok(z['ロング正面'] === '1/2 50%' && !(await page.$('#ttInsight')) && await page.evaluate(() => document.querySelector('#ttShots svg.court').dataset.court) === 'mini', 'ミニバスに切りかえ：ロング正面 1/2・読み取りなし（5本未満）', z);
    await page.click('#ttShots [data-court="std"]');
    await page.click('#ttShots [data-shotno=""]');

    console.log('\n■ グラフ');
    ok(await page.evaluate(() => document.querySelectorAll('#ttChart circle.pt.s0').length === 6 && document.querySelectorAll('#ttChart rect.pt.s1').length === 6), '得点（● 6）と失点（■ 6）');
    ok(await page.evaluate(() => document.querySelector('.tt-legend').textContent) === '得点（ミライ）失点（相手の得点）', '凡例');
    ok((await page.textContent('#ttReadout')) === '10/29 ミナミ 戦：得点 1・失点 0', '読み取り：いちばん新しい試合', await page.textContent('#ttReadout'));
    const box = await page.evaluate(() => { const s = document.querySelector('#ttChart svg'); s.scrollIntoView({ block: 'center' }); const r = s.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
    await page.touchscreen.tap(box.x + 38, box.y + box.h / 2);
    ok((await page.textContent('#ttReadout')).startsWith('9/11 サクラ 戦：得点 5'), 'グラフを押すと、その試合（いちばん古い I）', await page.textContent('#ttReadout'));
    await page.click('[data-metric="fg"]');
    ok(await page.evaluate(() => document.querySelector('#ttChart').dataset.metric === 'fg' && document.querySelectorAll('#ttChart circle.pt.s0').length === 3 && !document.querySelector('.tt-legend')), 'シュート成功率：外れも記録した 3 試合だけ・1本なので凡例なし');
    ok(await page.evaluate(() => Array.from(document.querySelectorAll('#ttChart text.ax')).some((t) => t.textContent === '100%')), '縦の目盛りは %');
    await page.click('[data-metric="to"]');
    ok(await page.evaluate(() => document.querySelectorAll('#ttChart circle.pt.s0').length === 6), 'ターンオーバー（6試合）');
    ok(await clean(page), 'グラフでも NaN などがない');
    await page.click('[data-metric="pts"]');

    console.log('\n■ しぼる（直近・チェック）');
    await page.click('[data-recent="5"]');
    a = await aggNow(page);
    ok((await count(page)).startsWith('5 試合') && a.n === 5 && a.pf === 35 && !a.ids.includes('gI'), '直近5試合：いちばん古い I が外れる（得点 35）', a.ids);
    ok(await page.evaluate(() => document.querySelectorAll('#ttGameTable tbody tr').length) === 5, '試合ごとの表も 5 試合');
    await page.click('[data-recent="10"]');
    ok((await count(page)).startsWith('6 試合'), '直近10試合（6 試合しかない）');
    await page.click('[data-recent="0"]');
    await page.click('input[data-game="gD"]');
    a = await aggNow(page);
    ok((await count(page)).includes('5 試合') && (await count(page)).includes('チェックを外した 1') && a.n === 5 && await tile(page, 'wl') === '4勝 0敗 1分', 'D のチェックを外す → 5 試合・4勝 0敗 1分', await count(page));
    ok(await page.evaluate(() => document.querySelector('#ttGameTable tr[data-id="gD"]').classList.contains('off')), '外した試合は、表で薄く');
    ok(!(await page.$('#ttInsight')), '外すと、場所の読み取りも計算し直す（5本以上のゾーンがなくなる）');
    await page.click('input[data-game="gD"]');
    ok((await count(page)).startsWith('6 試合'), 'チェックを戻す');
    const gt = await page.evaluate(() => Array.from(document.querySelectorAll('#ttGameTable tbody tr')).map((tr) => Array.from(tr.querySelectorAll('td')).slice(1).map((td) => td.textContent).join('|')));
    ok(gt[0].startsWith('10/29 記録中|ミナミ|1 − 0|勝ち|—') && gt[1].startsWith('10/22|キタ|15 − 30|負け|50%|20%|—'), '試合ごとの表：新しい順・記録中の印・成功率', gt.slice(0, 2));
    // 全部外す → 空の案内
    for (const id of a.ids.concat(['gD'])) { const el = await page.$(`input[data-game="${id}"]`); if (el && await el.isChecked()) await el.click(); }
    ok(await page.isVisible('#ttEmpty') && !(await page.$('#ttSummary')) && await page.isVisible('#ttGameTable'), '0 試合：やさしい案内（表は残るので、チェックを戻せる）');
    ok(await clean(page) && await fits(page), '0 試合でも NaN などがない・はみ出さない');
    await shot(page, 'totals-390-empty');
    await page.click('#ttAll');
    ok((await count(page)).startsWith('6 試合'), '「すべての試合を入れる」で戻る');

    console.log('\n■ チームを選ぶ');
    await page.selectOption('#ttTeam', { label: 'ヒガシ（3試合）' });
    a = await aggNow(page);
    ok((await count(page)).startsWith('3 試合') && await tile(page, 'wl') === '0勝 2敗 1分' && a.pf === 9 && a.pa === 14, 'ヒガシ（いつも相手の側）：3試合・0勝 2敗 1分', await count(page));
    ok(!(await page.$('#ttShots')) && await page.isVisible('#ttPeriods'), '場所の記録がない → 場所の欄なし・ピリオドは A から');
    ok((await page.evaluate(() => Array.from(document.querySelectorAll('#ttPeriodTable tbody tr')).map((tr) => tr.textContent).join('/'))) === '得点0.07.0/失点8.02.0/差−8.0+5.0', 'ピリオドごと（ヒガシの側から）', await page.evaluate(() => Array.from(document.querySelectorAll('#ttPeriodTable tbody tr')).map((tr) => tr.textContent).join('/')));
    ok(await clean(page), 'ヒガシ：NaN などがない');
    await page.selectOption('#ttTeam', { label: '自分（名前なし）（1試合）' });
    ok((await count(page)).startsWith('1 試合') && (await page.textContent('#ttChart')).includes('2 試合以上'), '名前なし：1試合・グラフは「2 試合以上」の案内');
    ok((await page.textContent('#ttBasis')).includes('外れ（シュートの失敗）を記録した試合がない') && !(await page.$('.tt-tile[data-tile="fg"]')), '外れの記録がない → 成功率のタイルなし・そのわけを書く');
    ok(await clean(page) && await fits(page), '1試合でも NaN などがない');
    await page.selectOption('#ttTeam', { label: 'ミライ（6試合）' });

    console.log('\n■ 相手とのくらべ・ピリオド');
    const cmp = await page.evaluate(() => Object.fromEntries(Array.from(document.querySelectorAll('#ttCompareTable tbody tr')).map((tr) => [tr.dataset.k, Array.from(tr.querySelectorAll('td')).map((td) => td.textContent + (td.classList.contains('better') ? '*' : '')).join(' ')])));
    ok(cmp.pts === '6.7 7.7*' && cmp.to === '0.5 0.3*' && cmp.fg === '55% 100%*', '得点 40/6 と 46/6・FG 55% と 100%（相手は外していない 14/14）・ターンオーバーは少ないほうが太字', cmp);

    console.log('\n■ 書き出す（CSV）');
    a = await aggNow(page);
    for (const [btn, key, label] of [['#ttExpPlayers', 'pcsv', '選手ごと'], ['#ttExpGames', 'gcsv', '試合ごと']]) {
      const [dl] = await Promise.all([page.waitForEvent('download'), page.click(btn)]);
      const file = await dl.path();
      const buf = fs.readFileSync(file);
      const fname = await page.evaluate(() => (window.__dl || []).slice(-1)[0]);
      ok(buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf && buf.slice(3).toString('utf8') === a[key] && /^バスケ集計_ミライ_\d{4}-\d{2}-\d{2}_/.test(fname) && fname.endsWith(`_${label}.csv`), `${label}の CSV（BOM つき・BT.agg と同じ中身・${fname}）`, fname);
    }

    console.log('\n■ クラウドにだけある試合');
    ok(await page.isVisible('#ttCloud') && (await page.textContent('#ttCloud')).includes('1 試合'), '「☁️ クラウドにだけある 1 試合も入れる」');
    await page.click('#ttCloud');
    await page.waitForFunction(() => !document.querySelector('#ttCloud') && /7 試合/.test(document.querySelector('#ttCount').textContent));
    ok(!(await page.evaluate(() => BT.store.loadGame('gCloud'))), '読み込んで 7 試合に（この端末には保存しない）');
    ok(await page.evaluate(() => document.querySelector('#ttGameTable tr[data-id="gCloud"]').textContent.includes('☁️')), 'クラウドの試合の印');

    console.log('\n■ 戻る');
    await page.goBack();
    await page.waitForFunction(() => document.body.dataset.view === 'home');
    ok(await page.isVisible('#btnTotals'), 'ブラウザの「戻る」でホームへ');
    await page.click('#btnTotals');
    await page.waitForSelector('#ttFilters');
    await page.click('#btnTotalsHome');
    await page.waitForFunction(() => document.body.dataset.view === 'home');
    await sleep(200);
    ok(await page.evaluate(() => BT.app.S.view === 'home' && !BT.app.S.guarded), '「🏠 ホーム」でホームへ（足した履歴も戻す）');
    ok(await page.isVisible('#btnNew'), 'ホームはいつものまま');
    ok(errors.length === 0, 'ページのエラーなし', errors);
    await ctx.close();

    console.log('\n■ 画面の大きさ・明るさ');
    for (const [w, hgt] of [[320, 568], [390, 844], [1180, 820]]) {
      for (const scheme of ['light', 'dark']) {
        ({ ctx, page } = await openPage({ width: w, height: hgt }, scheme));
        await seed(page);
        await page.evaluate(() => BT.app.go('home'));
        await page.click('#btnTotals');
        await page.waitForSelector('#ttFilters');
        await sleep(150);
        const f = await fits(page), tg = await targets(page);
        const chartW = await page.evaluate(() => { const s = document.querySelector('#ttChart svg'); const r = s.getBoundingClientRect(); return [Math.round(r.width), Number(s.getAttribute('width'))]; });
        ok(f && tg.length === 0 && Math.abs(chartW[0] - chartW[1]) <= 1 && await clean(page), `${w}×${hgt} ${scheme}：はみ出さない・押すもの 40px 以上・グラフは幅どおり（文字が縮まない）`, { f, tg, chartW });
        if (scheme === 'dark') ok(await page.evaluate(() => getComputedStyle(document.body).backgroundColor) === 'rgb(10, 14, 21)', '暗い画面の色');
        if (w !== 320) await shot(page, `totals-${w}-${scheme}`, true);
        await ctx.close();
      }
    }
    ok(errors.length === 0, 'ページのエラーなし（全部）', errors);
  } finally {
    await browser.close();
    await srv.close();
  }
  console.log(`\n${pass} ok / ${fail} fail`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
