// ③ スタッツ・📺 反省会の画面・🖼 画像で保存・📊 CSV・🖨 印刷
//   node tests/e2e-stats.cjs [dev|built]    SHOTS=フォルダ で画面の写真（と、作った画像）
const fs = require('fs');
const path = require('path');
const T = require('./helpers.cjs');
const MODE = process.argv[2] || 'dev';

/* 手で数えられる記録（数は tests/unit-stats.cjs と同じ） */
function seedExact() {
  const g = SC.app.S.game;
  g.teams[0].players.find((p) => p.no === '7').name = 'たけし';
  g.teams[0].players.find((p) => p.no === '9').name = 'ゆう';
  const add = (t, type, team, no, x, y) => { const e = BT.addEvent(g, { t, type, team, no }); if (x != null) { e.x = x; e.y = y; } return e; };
  [[1, 'fg2', '7', 0.5, 0.1], [2, 'fg2', '7', 0.3, 0.2], [3, 'fg2x', '7', 0.7, 0.15], [4, 'fg3', '7', 0.5, 0.6], [5, 'fg3x', '7', 0.04, 0.05], [6, 'ft', '7'], [7, 'ftx', '7'],
    [8, 'ast', '7'], [9, 'stl', '7'], [9.5, 'tov', '7'], [9.8, 'foul', '7'], [10, 'fg2x', '9', 0.45, 0.12], [12, 'reb', '9'], [13, 'fg2', '9', 0.52, 0.08], [40, 'reb', '4'], [50, 'fg2', null], [51, 'pass', null]]
    .forEach(([t, type, no, x, y]) => add(t, type, 0, no, x, y));
  add(52, 'mark', null, null); add(53, 'pass', null, null);
  add(60, 'fg3', 1, null); add(61, 'fg2', 1, null);
  BT.addEvent(g, { t: 30, type: 'period', period: 2 });
  SC.app.save();
}
/* たくさんの記録（写真・大きさの確かめ用。決まった並び） */
function seedRich() {
  const g = SC.app.S.game;
  const names = { 4: 'はると', 5: 'そうた', 6: 'ゆいと', 7: 'たけし', 8: 'りく', 9: 'ゆう', 10: 'けんたろう', 11: 'みなと', 12: 'あおい', 13: 'しょう', 14: 'こうき', 15: 'だいち' };
  g.teams[0].players.forEach((p) => { p.name = names[p.no] || ''; });
  let s = 7;
  const rnd = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; };
  const nos = ['4', '5', '6', '7', '8', '9', '10', '11', '12', '13'];
  const types = ['fg2', 'fg2', 'fg2x', 'fg2x', 'fg2x', 'fg3', 'fg3x', 'fg3x', 'ft', 'ftx', 'oreb', 'dreb', 'dreb', 'ast', 'stl', 'blk', 'tov', 'foul'];
  [150, 300, 450].forEach((t, i) => BT.addEvent(g, { t, type: 'period', period: i + 2 }));
  for (let i = 0; i < 150; i++) {
    const t = 2 + i * 3.9, type = types[Math.floor(rnd() * types.length)];
    const no = rnd() < 0.05 ? null : nos[Math.floor(Math.pow(rnd(), 1.6) * nos.length)];
    const e = BT.addEvent(g, { t, type, team: 0, no });
    if (BT.isLocShot(type)) { const far = type.startsWith('fg3'); const a = (rnd() - 0.5) * Math.PI * 0.95, d = far ? 7.3 + rnd() * 1.2 : 1 + rnd() * 4.8; e.x = BT.locRound(BT.clamp((7.5 + Math.sin(a) * d) / 15, 0.03, 0.97)); e.y = BT.locRound(BT.clamp((1.575 + Math.cos(a) * d) / 14, 0.03, 0.97)); }
    if (rnd() < 0.24) BT.addEvent(g, { t: t + 1, type: rnd() < 0.2 ? 'fg3' : 'fg2', team: 1, no: null });
  }
  SC.app.save();
}
/* タブの表のマスが、BT.stats から数えたものと同じか（このテストの中で、別に数える） */
function checkTable() {
  const g = SC.app.S.game, st = BT.stats(g)[0], withA = BT.hasMisses(g);
  const pct = (m, a) => (a ? Math.round(100 * m / a) + '%' : '—');
  const text = (s, k) => {
    const sh = { fg2: ['fg2m', 'fg2a'], fg3: ['fg3m', 'fg3a'], ft: ['ftm', 'fta'] }[k];
    if (sh) return withA ? `${s[sh[0]]}/${s[sh[1]]}` : String(s[sh[0]]);
    if (k === 'fg') return pct(s.fg2m + s.fg3m, s.fg2a + s.fg3a);
    if (k === 'to') return String(s.tov + s.pass);
    return String(s[k]);
  };
  const bad = [];
  let n = 0;
  document.querySelectorAll('#stTable tbody tr').forEach((tr) => {
    const no = tr.dataset.no;
    const s = no === '*' ? st.total : no === '?' ? st.unknown : (st.rows.find((r) => r.no === no) || {}).s;
    if (!s) { bad.push('no row ' + no); return; }
    const ks = Array.from(document.querySelectorAll('#stTable thead [data-sort]')).map((b) => b.dataset.sort).filter((k) => k !== 'no');
    const tds = tr.querySelectorAll('td.st-c-v');
    ks.forEach((k, i) => { n++; const got = tds[i].textContent.trim(); const want = text(s, k); if (got !== want) bad.push(`${no}:${k} ${got}≠${want}`); });
  });
  return { n, bad };
}
const badText = (page, sel) => page.evaluate((s) => { const el = s ? document.querySelector(s) : document.body; const t = el ? el.innerText : ''; const m = /NaN|undefined|null|Infinity/.exec(t); return m ? t.slice(Math.max(0, m.index - 30), m.index + 30) : ''; }, sel || null);
const wrapTab = (page) => page.evaluate(() => { window.__tabs = []; const o = SC.app.setTab; if (o.__w) return; SC.app.setTab = function (id, arg) { window.__tabs.push([id, arg === undefined ? '(none)' : JSON.parse(JSON.stringify(arg))]); return o.call(this, id, arg); }; SC.app.setTab.__w = true; });
const lastTab = async (page) => { const r = await page.evaluate(() => { const x = window.__tabs.slice(-1)[0] || null; window.__tabs = []; return x; }); return r; };
const toStats = async (page) => { await page.click('#scTab-stats'); await page.waitForSelector('#stTab'); };

(async () => {
  const { browser, srv, close } = await T.launch(MODE);
  const shotsDir = T.SHOTS;
  let stored = null;
  try {
    const VID = await T.video('g120.mp4', 120);
    T.section(`${MODE === 'built' ? '1ファイル版' : '開発版'}・スマホ（390×844）`);
    const { ctx, page, errors } = await T.open(browser, srv.url, { width: 390, height: 844 });
    await T.start(page, VID, { name: 'ミライ', opp: 'ヒガシ', nos: '4-15' });
    await wrapTab(page);

    // ---- 記録のない試合 ----
    await toStats(page);
    T.ok(await page.isVisible('#stEmpty') && (await page.textContent('#stScoreNum')) === '0 − 0' && !(await page.$('#stTable')) && !(await page.$('#stTeam')), '記録なし：得点 0 − 0 と「まだ記録がありません」（表・タイルなし）');
    T.eq(await badText(page), '', '記録なし：NaN・undefined・null の文字がない');
    await page.click('#stOpenReport');
    T.ok(await page.isVisible('#stREmpty') && !(await page.$('#stRTable')) && !(await page.$('#stRTeam')) && !(await page.$('#stRHl')), '記録なし：反省会の画面も、得点と「まだ記録がありません」だけ');
    T.eq(await badText(page, '#stReport'), '', '記録なし：反省会の画面に NaN などがない');
    await page.keyboard.press('Escape');
    const emptyImg = await page.evaluate(async () => { const b = await SC.stats.image(); const bm = await createImageBitmap(b); return [b.type, bm.width, bm.height]; });
    T.ok(emptyImg[0] === 'image/png' && emptyImg[1] === 1600 && emptyImg[2] > 300 && emptyImg[2] < 1000, '記録なし：画像も作れる（1600 px・短い）', emptyImg);

    // ---- 失敗の記録がない ----
    await page.evaluate(() => { const g = SC.app.S.game; [[1, 'fg2', '7'], [2, 'fg2', '7'], [3, 'fg3', '9'], [4, 'ft', '9']].forEach(([t, type, no]) => BT.addEvent(g, { t, type, team: 0, no })); SC.app.save(); });
    T.ok(await page.isVisible('#stNoMiss') && (await page.textContent('#stNoMiss')).includes('「シュートの失敗」も記録すると'), '失敗の記録なし：「成功率は、シュートの失敗も記録すると出ます」');
    T.eq(await page.$$eval('#stTeam .st-tile', (els) => els.map((e) => e.dataset.tile + ':' + e.querySelector('.st-tv').textContent)), ['fg2:2本', 'fg3:1本', 'ft:1本'], '失敗の記録なし：タイルは入った本数（成功率なし）');
    T.eq(await page.$$eval('#stTable thead th', (els) => els.map((e) => e.textContent.replace(/[▼▲\s]/g, ''))), ['#', '名前', '得点', '2P', '3P', 'FT'], '失敗の記録なし：列は 得点・2P・3P・FT（FG% なし）');
    let ck = await page.evaluate(checkTable);
    T.ok(ck.n > 0 && !ck.bad.length, `失敗の記録なし：表のマス ${ck.n} こが BT.stats と同じ`, ck.bad);
    // 消して、手で数えられる記録に
    await page.evaluate(() => { const g = SC.app.S.game; g.events = g.events.filter((e) => e.type === 'period'); SC.app.save(); });
    await page.evaluate(seedExact);
    await page.waitForSelector('#stTable');

    // ---- 数字 ----
    T.section('数字（手で数えたものと同じ）');
    T.eq(await page.textContent('#stScoreNum'), '12 − 5', '得点 12 − 5');
    T.eq(await page.$$eval('#stPer tbody tr', (trs) => trs.map((tr) => Array.from(tr.children).map((c) => c.textContent.trim()))), [['ミライ', '10', '2', '12'], ['ヒガシ', '0', '5', '5']], 'ピリオドの表（1Q 10−0・2Q 2−5・計）');
    T.eq(await page.$$eval('#stTeam .st-tile', (els) => els.map((e) => [e.dataset.tile, e.querySelector('.st-tv').textContent, (e.querySelector('.st-ts') || {}).textContent || ''])),
      [['fg', '63%', '5/8'], ['fg2', '67%', '4/6'], ['fg3', '50%', '1/2'], ['ft', '50%', '1/2'], ['efg', '69%', '3P を 1.5 本に'], ['reb', '2', ''], ['ast', '1', ''], ['stl', '1', ''], ['to', '2', 'パスミスも入れて'], ['foul', '1', '']], 'チームの数字（FG 63%・2P 67%・3P 50%・FT 50%・eFG 69%・リバ 2・TO 2…）');
    T.ok(!(await page.$('#stNoMiss')), '失敗の記録があれば、成功率の案内は出ない');
    T.eq(await page.$$eval('#stTable thead th', (els) => els.map((e) => e.textContent.replace(/[▼▲\s]/g, ''))), ['#', '名前', '得点', '2P', '3P', 'FT', 'FG%', 'リバ', 'アシスト', 'スティール', 'TO', 'ファウル'], '列は記録のあるものだけ（ブロック・Oリバ・Dリバなし）');
    const tableRows = () => page.$$eval('#stTable tbody tr', (trs) => trs.map((tr) => Array.from(tr.children).map((c) => c.textContent.replace('▶', '').trim())));
    T.eq(await tableRows(), [
      ['7', 'たけし', '8', '2/3', '1/2', '1/2', '60%', '0', '1', '1', '1', '1'],
      ['9', 'ゆう', '2', '1/2', '0/0', '0/0', '50%', '1', '0', '0', '0', '0'],
      ['4', '', '0', '0/0', '0/0', '0/0', '—', '1', '0', '0', '0', '0'],
      ['—', '番号なし', '2', '1/1', '0/0', '0/0', '100%', '0', '0', '0', '1', '0'],
      ['', '合計', '12', '4/6', '1/2', '1/2', '63%', '2', '1', '1', '2', '1']], '選手の表（得点の多い順・番号なし・合計）');
    ck = await page.evaluate(checkTable);
    T.ok(ck.n === 50 && !ck.bad.length, `表のマス ${ck.n} こが BT.stats と同じ`, ck.bad);
    T.ok((await page.textContent('#stIdle')).includes('#5') && !(await page.textContent('#stIdle')).includes('#7'), '記録のない選手は「記録なし：#5 …」の1行');
    T.ok(await page.textContent('#stSortNow') === '得点の多い順' && await page.getAttribute('#stTable [data-sort="pts"]', 'class') === 'st-sort on' && (await page.textContent('#stTable [data-sort="pts"]')).includes('▼'), 'はじめは得点の多い順（見出しに ▼）');

    T.section('並べかえ');
    const order = () => page.$$eval('#stTable tbody tr', (trs) => trs.map((tr) => tr.dataset.no));
    await page.click('#stTable [data-sort="reb"]');
    T.eq(await order(), ['4', '9', '7', '?', '*'], 'リバの見出し → リバの多い順（同じなら背番号の順）・番号なしと合計は下のまま');
    T.ok((await page.textContent('#stSortNow')) === 'リバウンドの多い順', '「リバウンドの多い順」と出る');
    await page.click('#stTable [data-sort="reb"]');
    T.eq(await order(), ['7', '4', '9', '?', '*'], 'もう一度 → 少ない順（▲）');
    await page.click('#stTable [data-sort="no"]');
    T.eq(await order(), ['4', '7', '9', '?', '*'], '「#」→ 背番号の順');
    await page.click('#stTable [data-sort="pts"]');
    T.eq(await order(), ['7', '9', '4', '?', '*'], '得点 → 得点の多い順に戻る');

    T.section('数字から場面へ（setTab）');
    const jumps = [
      ['#stTable tr[data-no="7"] [data-col="fg2"]', { filter: { types: ['fg2', 'fg2x'], nos: ['7'], team: 0 }, title: '#7 たけし の 2P', play: 'reel' }, '#7 の「2P 2/3」'],
      ['#stTable tr[data-no="7"] .st-c-nm .st-who', { filter: { types: null, nos: ['7'], team: 0 }, title: '#7 たけし', play: 'reel' }, '#7 の名前'],
      ['#stTable tr[data-no="9"] .st-c-no .st-who', { filter: { types: null, nos: ['9'], team: 0 }, title: '#9 ゆう', play: 'reel' }, '#9 の背番号'],
      ['#stTable tr[data-no="9"] [data-col="fg"]', { filter: { types: ['fg2', 'fg2x', 'fg3', 'fg3x'], nos: ['9'], team: 0 }, title: '#9 ゆう の シュート', play: 'reel' }, '#9 の FG%'],
      ['#stTable tr[data-no="?"] [data-col="pts"]', { filter: { types: ['fg2', 'fg3', 'ft'], nos: [''], team: 0 }, title: '番号なし の 得点', play: 'reel' }, '番号なしの得点'],
      ['#stTable tr[data-no="*"] [data-col="to"]', { filter: { types: ['tov', 'pass'], nos: null, team: 0 }, title: 'ミライ の ターンオーバー', play: 'reel' }, '合計の TO'],
      ['#stTeam [data-tile="to"]', { filter: { types: ['tov', 'pass'], nos: null, team: 0 }, title: 'ミライ の ターンオーバー', play: 'reel' }, 'タイル「ターンオーバー 2」'],
      ['#stTeam [data-tile="fg3"]', { filter: { types: ['fg3', 'fg3x'], nos: null, team: 0 }, title: 'ミライ の 3P', play: 'reel' }, 'タイル「3P」'],
      ['#stTeam [data-tile="reb"]', { filter: { types: ['reb', 'oreb', 'dreb'], nos: null, team: 0 }, title: 'ミライ の リバウンド', play: 'reel' }, 'タイル「リバウンド」']
    ];
    for (const [sel, want, name] of jumps) {
      await page.click(sel);
      const got = await lastTab(page);
      T.eq(got, ['scenes', want], `${name} → setTab('scenes', …)`);
      T.ok(await page.evaluate(() => SC.app.S.tab === 'scenes'), `${name} → ② 場面のタブへ`);
      await toStats(page);
    }
    T.ok(await page.$$eval('#stTable tr[data-no="7"] [data-col="reb"] button', (b) => b.length) === 0, '0 のマスは押せない（場面がない）');
    T.ok(await page.$$eval('#stTable tbody .st-c-nm .st-go', (els) => els.length) === 5 && await page.isVisible('#stTeam .st-tile .st-go'), '名前とタイルに、小さな ▶');

    T.section('シュートの場所');
    const marks = (sel) => page.evaluate((s) => [document.querySelectorAll(s + ' .mk.made').length, document.querySelectorAll(s + ' .mk.miss').length], sel);
    T.eq(await marks('#stShots'), [4, 3], '図：入った ● 4・外れ × 3（場所のあるシュートだけ）');
    T.ok((await page.textContent('#stZones tr.st-t')).replace(/\s+/g, '') === '合計4/757%' && (await page.textContent('#stShotNote')).includes('場所なし 1本'), 'ゾーンの表の合計 4/7・場所なし 1本');
    await page.click('#stShots [data-shotno="9"]');
    T.eq(await marks('#stShots'), [1, 1], '「#9」で しぼる → ● 1・× 1');
    T.ok((await page.textContent('#stZones tr.st-t')).replace(/\s+/g, '') === '合計1/250%' && (await page.getAttribute('#stShots [data-shotno="9"]', 'aria-pressed')) === 'true', '#9 のゾーンの表 1/2');
    await page.click('#stShots [data-shotno=""]');
    T.eq(await marks('#stShots'), [4, 3], '「全員」で戻る');

    T.section('📊 CSV・🖼 画像');
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#stCsv')]);
    const csvPath = path.join(T.WORK, 'stats-' + MODE + '.csv');
    await dl.saveAs(csvPath);
    const want = await page.evaluate(() => '\ufeff' + BT.boxCSV(SC.app.S.game));
    T.ok(fs.readFileSync(csvPath, 'utf8') === want && dl.suggestedFilename().endsWith('_スタッツ.csv'), `CSV ＝ BOM ＋ BT.boxCSV（${dl.suggestedFilename()}）`);
    const img = await page.evaluate(async () => { const b = await SC.stats.image(); const bm = await createImageBitmap(b); return [b.type, bm.width, bm.height, b.size]; });
    T.ok(img[0] === 'image/png' && img[1] === 1600 && img[2] > 900 && img[2] < 2600 && img[3] > 20000, `画像：PNG・幅 1600・高さ ${img[2]}`, img);
    const [dl2] = await Promise.all([page.waitForEvent('download'), page.click('#stImage')]);
    const imgPath = path.join(shotsDir || T.WORK, 'stats-image-exact.png');
    await dl2.saveAs(imgPath);
    const head = fs.readFileSync(imgPath).subarray(0, 8).toString('hex');
    T.ok(head === '89504e470d0a1a0a' && dl2.suggestedFilename() === (await page.evaluate(() => BT.fileBase(SC.app.S.game))) + '_スタッツ.png', `「🖼 画像で保存」で PNG を保存（${dl2.suggestedFilename()}）`);

    T.section('📺 反省会の画面');
    await page.click('#stOpenReport');
    T.ok(await page.isVisible('#stReport') && await page.evaluate(() => SC.stats.reportOpen() && getComputedStyle(document.querySelector('#stReport')).position === 'fixed'), '開く（画面いっぱいに重なる）');
    T.eq(await page.$$eval('#stRScore .st-rteam', (els) => els.map((e) => e.innerText.replace(/\s+/g, ''))), ['ミライ12', 'ヒガシ5'], '大きな得点 ミライ 12 − 5 ヒガシ');
    T.ok((await page.textContent('#stRHead .st-rdate')).includes('の試合') && !!(await page.$('#stRPer')), '日付・ピリオドの表');
    T.eq(await page.$$eval('#stRTeam .st-rtile', (els) => els.map((e) => e.dataset.tile + ':' + e.querySelector('.st-tv').textContent)), ['fg:63%', 'fg2:67%', 'fg3:50%', 'ft:50%', 'reb:2', 'ast:1', 'stl:1', 'to:2', 'foul:1'], 'チームの数字（eFG% は出さない）');
    T.ok(await page.$$eval('#stRTeam .st-rtile', (els) => els.every((e) => e.textContent.includes('▶ 場面を見る'))), 'どのタイルにも「▶ 場面を見る」');
    const rrows = () => page.$$eval('#stRTable tbody tr', (trs) => trs.map((tr) => Array.from(tr.querySelectorAll('td:not(.st-c-go)')).map((c) => c.textContent.trim())));
    const rhead = () => page.$$eval('#stRTable thead th', (els) => els.map((e) => (e.querySelector('.st-wide') || e).textContent));
    T.eq(await rhead(), ['#', '名前', '得点', 'シュート（成功/本数）', 'リバウンド', 'アシスト', 'ターンオーバー', ''], '選手の表：背番号・名前・得点・シュート・リバウンド・アシスト・ターンオーバー');
    T.eq(await rrows(), [['4', '', '0', '0/0', '1', '0', '0'], ['7', 'たけし', '8', '3/5', '0', '1', '1'], ['9', 'ゆう', '2', '1/2', '1', '0', '0'], ['—', '番号なし', '2', '1/1', '0', '0', '1'], ['', '合計', '12', '5/8', '2', '1', '2']], '選手の表（背番号の順・番号なし・合計）');
    T.ok(await page.$$eval('#stRTable tbody tr', (trs) => trs.every((tr) => tr.querySelector('.st-rgo') && tr.querySelector('.st-rgo').textContent === '▶ 場面を見る')), 'どの行にも「▶ 場面を見る」');
    await page.click('#stMore');
    T.eq(await rhead(), ['#', '名前', '得点', 'シュート（成功/本数）', 'リバウンド', 'アシスト', 'ターンオーバー', '2P', '3P', 'FT', 'FG%', 'スティール', 'ファウル', ''], '「くわしく」→ 2P・3P・FT・FG%・スティール・ファウルも');
    T.ok((await page.textContent('#stMore')) === 'たたむ', '「くわしく」→「たたむ」');
    await page.click('#stMore');
    T.ok(await page.$$eval('#stRTable thead th', (els) => els.length) === 8, '「たたむ」で戻る');
    T.eq(await page.$$eval('#stRHl .st-hl', (els) => els.map((e) => e.dataset.hl + ':' + Array.from(e.querySelectorAll('.st-hlrow')).map((r) => r.dataset.no + '=' + r.querySelector('.st-hlv').textContent).join(','))), ['pts:7=8点,9=2点', 'reb:4=1,9=1', 'ast:7=1', 'stl:7=1'], 'よかったところ：得点・リバウンド・アシスト・スティールの多い人（同じ数は両方）');
    T.ok(await page.$$eval('#stRShots .mk.made', (e) => e.length) === 4 && !!(await page.$('#stRZones')), 'シュートの場所の図と表');
    T.eq(await badText(page, '#stReport'), '', '反省会の画面に NaN・undefined・null がない');
    // 文字の大きさ
    const fsz = () => page.evaluate(() => parseFloat(getComputedStyle(document.querySelector('#stReport')).fontSize));
    const f0 = await fsz();
    T.ok(await page.getAttribute('#stReport', 'data-size') === 'm' && await page.getAttribute('[data-size="m"].st-rbtn', 'aria-pressed') === 'true', 'はじめの文字は「中」（reportSize がまだないとき）');
    await page.click('.st-rbtn[data-size="l"]');
    const f1 = await fsz();
    await page.click('.st-rbtn[data-size="s"]');
    const f2 = await fsz();
    T.ok(f1 > f0 * 1.2 && f2 < f0 * 0.85, `文字の大きさ：小 ${f2}・中 ${f0}・大 ${f1} px`);
    await page.click('.st-rbtn[data-size="l"]');
    T.ok(await page.evaluate(() => SC.app.S.prefs.reportSize === 'l' && JSON.parse(localStorage.getItem('bscene:prefs')).reportSize === 'l'), '「大」を覚える（設定 reportSize）');
    // Esc
    await page.keyboard.press('Escape');
    T.ok(!(await page.$('#stReport')) && !(await page.evaluate(() => SC.stats.reportOpen())), 'Esc で閉じる');
    await page.click('#stOpenReport');
    T.ok(await page.getAttribute('#stReport', 'data-size') === 'l', '開き直しても「大」のまま');
    await page.keyboard.press('Space');
    T.ok(await page.isVisible('#stReport') && await page.evaluate(() => SC.app.S.media.paused), '開いているときのスペースは、うしろの動画に渡さない');
    await page.click('#stRClose');
    T.ok(!(await page.$('#stReport')), '「✕ 閉じる」で閉じる');
    // 反省会から場面へ
    await page.click('#stOpenReport');
    await page.click('#stRTable tr[data-no="7"] .st-rgo');
    T.eq(await lastTab(page), ['scenes', { filter: { types: null, nos: ['7'], team: 0 }, title: '#7 たけし', play: 'reel' }], '反省会：#7 の「▶ 場面を見る」→ setTab');
    T.ok(!(await page.$('#stReport')) && await page.evaluate(() => SC.app.S.tab === 'scenes'), '反省会は閉じて、② 場面へ');
    await toStats(page);
    await page.click('#stOpenReport');
    await page.click('#stRTeam [data-tile="fg3"]');
    T.eq(await lastTab(page), ['scenes', { filter: { types: ['fg3', 'fg3x'], nos: null, team: 0 }, title: 'ミライ の 3P', play: 'reel' }], '反省会：タイル「3P」→ setTab');
    await toStats(page);
    await page.click('#stOpenReport');
    await page.click('#stRTable tr[data-no="?"] .st-rgo');
    T.eq(await lastTab(page), ['scenes', { filter: { types: null, nos: [''], team: 0 }, title: '番号なし', play: 'reel' }], '反省会：番号なしの行 → nos: [\'\']');
    await toStats(page);
    await page.click('#stOpenReport');
    await page.click('#stRHl [data-hl="pts"] .st-hlrow[data-no="7"]');
    T.eq(await lastTab(page), ['scenes', { filter: { types: ['fg2', 'fg3', 'ft'], nos: ['7'], team: 0 }, title: '#7 たけし の 得点', play: 'reel' }], '反省会：よかったところ「#7 8点」→ setTab');
    await toStats(page);
    // 記録が変わると、開いている反省会も変わる
    await page.click('#stOpenReport');
    await page.evaluate(() => { BT.addEvent(SC.app.S.game, { t: 70, type: 'fg3', team: 0, no: '9' }); SC.app.save(); });
    T.eq(await page.$$eval('#stRScore .st-rnum', (els) => els.map((e) => e.textContent)), ['15', '5'], '記録が変わると、開いている反省会の画面も変わる（15 − 5）');
    // 印刷
    await page.emulateMedia({ media: 'print' });
    const pr = await page.evaluate(() => {
      const cs = (s) => { const e = document.querySelector(s); return e ? getComputedStyle(e) : null; };
      return { view: cs('#view').display, toasts: cs('#toasts').display, sheet: cs('#sheet').display, rep: cs('#stReport').display, pos: cs('#stReport').position, bg: cs('#stReport').backgroundColor, bar: cs('.st-rbar').display, go: cs('.st-c-go').display, tile: cs('.st-rtile .st-play').display, chart: cs('#stRShots').display };
    });
    T.ok(pr.view === 'none' && pr.toasts === 'none' && pr.rep === 'block' && pr.pos === 'static' && pr.bg === 'rgb(255, 255, 255)' && pr.bar === 'none' && pr.go === 'none' && pr.tile === 'none' && pr.chart !== 'none', '印刷：反省会の画面だけ（白地・ボタンなし）', pr);
    await page.emulateMedia({ media: 'screen' });
    const prn = await page.evaluate(() => { let n = 0; const o = window.print; window.print = () => { n++; }; document.querySelector('#stRPrint').click(); window.print = o; return n; });
    T.ok(prn === 1, '「🖨 印刷・PDF」で window.print()');
    await page.keyboard.press('Escape');
    T.ok(errors.length === 0, 'ページのエラーなし', errors);

    // ---- 写真用のたくさんの記録 → ホームの一覧から開く（動画なし） ----
    T.section('ホームの一覧から開く（動画なし）');
    await page.evaluate(() => { const g = SC.app.S.game; g.events = g.events.filter((e) => e.type === 'period' && e.t === 0); SC.app.S.prefs.reportSize = 'm'; SC.app.savePrefs(); SC.app.save(); });
    await page.evaluate(seedRich);
    ck = await page.evaluate(checkTable);
    T.ok(ck.n > 100 && !ck.bad.length, `たくさんの記録：表のマス ${ck.n} こが BT.stats と同じ`, ck.bad.slice(0, 5));
    await page.click('#scHome');
    await page.waitForSelector('#scGames');
    await page.click('#scGames .sc-game');
    await page.waitForSelector('#stTable');
    T.ok(await page.evaluate(() => SC.app.S.tab === 'stats' && !SC.app.hasVideo()) && await page.isVisible('#stTable') && await page.isVisible('#stShots'), '保存した試合を開くと、動画なしでスタッツ（表・シュートの場所）');
    ck = await page.evaluate(checkTable);
    T.ok(ck.n > 100 && !ck.bad.length, '開き直しても、同じ数字', ck.bad.slice(0, 5));
    T.eq(await badText(page), '', 'NaN・undefined・null の文字がない（タブ）');
    stored = await page.evaluate(() => { const g = SC.app.S.game; return { ['bscene:game:' + g.id]: g, 'bscene:games': [BT.summary(g)] }; });
    const richImg = await page.evaluate(async () => { const b = await SC.stats.image(); const bm = await createImageBitmap(b); return [b.type, bm.width, bm.height]; });
    T.ok(richImg[0] === 'image/png' && richImg[1] >= 1600 && richImg[2] > 1400, `たくさんの記録の画像：${richImg[1]}×${richImg[2]}`, richImg);
    if (shotsDir) {
      const b64 = await page.evaluate(async () => { const b = await SC.stats.image(); return await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(String(fr.result).split(',')[1]); fr.readAsDataURL(b); }); });
      fs.writeFileSync(path.join(shotsDir, 'stats-image.png'), Buffer.from(b64, 'base64'));
    }
    T.ok(errors.length === 0, 'ページのエラーなし', errors);
    await ctx.close();

    // ---- 大きさ・明るい／暗い ----
    T.section('画面の大きさ（タブ）');
    for (const [vp, scheme] of [[{ width: 390, height: 844 }, 'light'], [{ width: 390, height: 844 }, 'dark'], [{ width: 320, height: 568 }, 'light'], [{ width: 844, height: 390 }, 'light'], [{ width: 820, height: 1180 }, 'dark'], [{ width: 1180, height: 820 }, 'light']]) {
      const name = `${vp.width}×${vp.height}・${scheme === 'dark' ? '暗い' : '明るい'}`;
      const P = await T.open(browser, srv.url, vp, { store: stored, scheme });
      await P.page.click('#scGames .sc-game');
      await P.page.waitForSelector('#stTable');
      const r = await P.page.evaluate(() => {
        const pane = document.querySelector('#scPane-stats'), wrap = document.querySelector('.st-tblwrap');
        const nm0 = document.querySelector('#stTable tbody .st-c-nm').getBoundingClientRect().left;
        wrap.scrollLeft = 400;
        const nm1 = document.querySelector('#stTable tbody .st-c-nm').getBoundingClientRect().left, no1 = document.querySelector('#stTable tbody .st-c-no').getBoundingClientRect().left;
        const wl = wrap.getBoundingClientRect().left;
        const scrolled = wrap.scrollLeft;
        wrap.scrollLeft = 0;
        return { hscroll: document.documentElement.scrollWidth > innerWidth + 1, paneOver: pane.scrollWidth - pane.clientWidth, pane: [pane.clientWidth, pane.clientHeight], sticky: scrolled === 0 || (Math.abs(nm1 - nm0) < 1.5 && Math.abs(no1 - wl) < 14), scrolled, tiles: document.querySelectorAll('#stTeam .st-tile').length };
      });
      T.ok(!r.hscroll && r.paneOver <= 0 && r.sticky, `${name}：横にはみ出さない・表だけが横にすべる・背番号と名前は止まったまま（タブの中身 ${r.pane.join('×')}・すべる ${r.scrolled}px）`, r);
      const tag = `stats-tab-${vp.width}x${vp.height}-${scheme}`;
      await T.shot(P.page, tag);
      if (vp.width === 390 && T.SHOTS) {
        for (const [sel, n] of [['#stPlayers', 2], ['#stShots', 3]]) { await P.page.evaluate((s) => { const p = document.querySelector('#scPane-stats'); p.scrollTop = document.querySelector(s).offsetTop - 8; }, sel); await T.shot(P.page, `${tag}-${n}`); }
      }
      T.ok(P.errors.length === 0, `${name}：ページのエラーなし`, P.errors);
      await P.ctx.close();
    }
    T.section('画面の大きさ（反省会）');
    for (const vp of [{ width: 390, height: 844 }, { width: 844, height: 390 }, { width: 1180, height: 820 }, { width: 1920, height: 1080 }]) {
      const name = `${vp.width}×${vp.height}`;
      const P = await T.open(browser, srv.url, vp, { store: stored, scheme: 'dark' });
      await P.page.click('#scGames .sc-game');
      await P.page.waitForSelector('#stTable');
      await P.page.click('#stOpenReport');
      await P.page.waitForSelector('#stRTable');
      const r = await P.page.evaluate(() => {
        const rep = document.querySelector('#stReport'), b = (s) => document.querySelector(s).getBoundingClientRect();
        const num = parseFloat(getComputedStyle(document.querySelector('.st-rnum')).fontSize), body = parseFloat(getComputedStyle(rep).fontSize);
        const bar = b('.st-rbar'), kids = Array.from(document.querySelectorAll('.st-rbar > *')).map((e) => e.getBoundingClientRect());
        const tw = document.querySelector('.st-rtblwrap');
        return { over: rep.scrollWidth - rep.clientWidth, hscroll: document.documentElement.scrollWidth > innerWidth + 1, num, body, scoreIn: b('#stRScore').bottom <= innerHeight, barIn: kids.every((k) => k.right <= innerWidth + 0.5 && k.bottom <= bar.bottom + 0.5), bg: getComputedStyle(rep).backgroundColor, tableScroll: tw.scrollWidth > tw.clientWidth };
      });
      T.ok(r.over <= 0 && !r.hscroll && r.scoreIn && r.barIn && r.bg === 'rgb(255, 255, 255)' && r.num >= 70 && r.body >= 15, `${name}：はみ出さない・得点は始めの画面に大きく（${r.num}px・文字 ${r.body}px${r.tableScroll ? '・表は横にすべる' : ''}）`, r);
      if (vp.width >= 1180) T.ok(!r.tableScroll && r.body >= 17, `${name}：表は横にすべらない・文字 ${r.body}px`, r);
      await T.shot(P.page, `stats-report-${vp.width}x${vp.height}`);
      if (T.SHOTS) {
        for (const [sel, n] of [['#stRHl', 2], ['#stRPlayers', 3]]) { await P.page.evaluate((s) => { const rep = document.querySelector('#stReport'); rep.scrollTop = document.querySelector(s).offsetTop - 70; }, sel); await T.shot(P.page, `stats-report-${vp.width}x${vp.height}-${n}`); }
        if (vp.width === 1180) { await P.page.click('.st-rbtn[data-size="l"]'); await P.page.evaluate(() => { document.querySelector('#stReport').scrollTop = 0; }); await T.shot(P.page, 'stats-report-1180x820-large'); }
      }
      T.ok(P.errors.length === 0, `${name}：ページのエラーなし`, P.errors);
      await P.ctx.close();
    }
  } catch (e) { T.failed(e); } finally { await close(); }
  T.done();
})();
