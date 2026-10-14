/* ブラウザでの総合検査：ヘッドレス Chromium で adlib/index.html（file://）を開き、画面操作をひと通り行う
   使い方：NODE_PATH=$(npm root -g) node adlib/test/e2e.js [スクリーンショットの保存先フォルダ]
   確かめること：起動・コード入力・解析表示・再生（実際に音が出る）・停止・ソロの差しかえ・辞典・移調・範囲くり返し・書き出し・全サンプル */
const path = require('path'), fs = require('fs');
const { chromium } = require('playwright');
let bad = 0;
const ok = (c, m) => { if (!c) { bad++; console.log('✗', m); } else if (process.env.VERBOSE) console.log('✓', m); };
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const shots = process.argv[2] ? path.resolve(process.argv[2]) : null;
  if (shots) fs.mkdirSync(shots, { recursive: true });
  // ファイル名に日本語を使うので、ロケールを UTF-8 にして起動（C ロケールだと Chromium が「download」にしてしまう）
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'], env: Object.assign({}, process.env, { LANG: 'C.UTF-8', LC_ALL: 'C.UTF-8' }) });
  const ctx = await browser.newContext({ viewport: { width: 1100, height: 900 }, acceptDownloads: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console.error: ' + m.text()); });
  page.on('dialog', d => d.accept('E2Eテスト譜面'));
  const url = 'file://' + (process.env.ADLIB_FILE ? path.resolve(process.env.ADLIB_FILE) : path.resolve(__dirname, '../index.html'));
  await page.goto(url);
  await page.waitForTimeout(500);

  /* 1) 起動 */
  const info = await page.evaluate(() => ({ bars: document.querySelectorAll('#chartGrid .bar').length, chips: document.querySelectorAll('#chartGrid .chip').length, tabs: document.querySelectorAll('#tabs button').length, title: document.title }));
  ok(info.bars === 8, '起動時のグリッドは8小節：' + info.bars);
  ok(info.chips > 10, '役割のチップが出ている：' + info.chips);
  ok(info.tabs === 4, 'タブは4つ');

  /* 2) コードを選ぶと役割の詳細が出る */
  await page.click('#chartGrid .cc[data-k="0"] >> nth=1');   // F7
  await page.waitForTimeout(100);
  const detail = await page.evaluate(() => ({ roles: document.querySelectorAll('#chordDetail .role').length, scales: document.querySelectorAll('#chordDetail .scale').length, text: document.querySelector('#chordDetail').innerText }));
  ok(detail.roles >= 2, 'F7 の役割が複数：' + detail.roles);
  ok(detail.scales >= 2, 'スケールが出る：' + detail.scales);
  ok(/ミクソリディアン/.test(detail.text), 'ミクソリディアンの説明');
  if (shots) await page.screenshot({ path: path.join(shots, 'e2e-detail.png'), fullPage: true });

  /* 3) スケールの試聴 */
  await page.click('#chordDetail .scale .mini-play >> nth=0');
  await page.waitForTimeout(400);
  let pk = await page.evaluate(() => AL.App.playKind);
  ok(pk === 'preview', 'スケール試聴が始まる：' + pk);
  await page.evaluate(() => AL.App.stop());

  /* 4) 本再生：音が出る・位置が進む・ハイライト */
  await page.evaluate(() => {
    const App = AL.App; App.ensureAudio();
    const an = App.ctx.createAnalyser(); an.fftSize = 2048; App.engine.master.connect(an);
    window.__an = an; window.__peak = 0;
    const buf = new Float32Array(2048);
    window.__sampler = setInterval(() => { an.getFloatTimeDomainData(buf); let m = 0; for (let i = 0; i < buf.length; i++) m = Math.max(m, Math.abs(buf[i])); if (m > window.__peak) window.__peak = m; }, 30);
  });
  await page.click('#playBtn');
  await page.waitForTimeout(300);
  pk = await page.evaluate(() => AL.App.playKind);
  ok(pk === 'main', '再生が始まる：' + pk);
  await page.waitForTimeout(3600);
  const play = await page.evaluate(() => { const p = AL.App.player.position(); return { pos: p, peak: window.__peak, playing: !!document.querySelector('#chartGrid .bar.playing'), txt: document.getElementById('posText').innerText, state: AL.App.ctx.state }; });
  ok(play.state === 'running', 'AudioContext が動いている：' + play.state);
  ok(play.peak > 0.05, '実際に音が出ている（ピーク ' + play.peak.toFixed(3) + '）');
  ok(play.pos && !play.pos.countIn, 'カウントインが終わって進んでいる：' + JSON.stringify(play.pos));
  ok(play.playing, '再生中の小節がハイライトされる');
  ok(/小節/.test(play.txt), '位置の表示：' + play.txt.replace(/\n/g, ' '));
  if (shots) await page.screenshot({ path: path.join(shots, 'e2e-playing-chart.png') });
  // ソロタブ：カーソル
  await page.click('#tabs button[data-tab="solo"]');
  await page.waitForTimeout(500);
  const cur = await page.evaluate(() => { const c = document.querySelector('#scoreWrap .cursor'); return c ? { vis: c.getAttribute('visibility'), x: c.getAttribute('x1') } : null; });
  ok(cur && cur.vis === 'visible', '楽譜に再生カーソルが出る：' + JSON.stringify(cur));
  if (shots) await page.screenshot({ path: path.join(shots, 'e2e-playing-solo.png') });
  // テンポ変更（演奏中）
  await page.fill('#tempoNum', '150');
  await page.waitForTimeout(200);
  ok(await page.evaluate(() => AL.App.st.tempo === 150 && Math.abs(AL.App.player.spb - 0.4) < 1e-6), '演奏中のテンポ変更が効く');
  await page.click('#playBtn');
  await page.waitForTimeout(300);
  pk = await page.evaluate(() => AL.App.playKind);
  ok(pk === null, '停止できる：' + pk);
  await page.evaluate(() => { clearInterval(window.__sampler); });

  /* 5) ソロのフレーズを選んで差しかえる */
  await page.waitForTimeout(100);
  const n0 = await page.evaluate(() => AL.App.solo.decisions.length);
  await page.click('#scoreWrap .mark >> nth=0', { force: true });
  await page.waitForTimeout(200);
  const ph = await page.evaluate(() => ({ title: document.querySelector('#phraseCard h2') && document.querySelector('#phraseCard h2').innerText, sel: AL.App.sel.dec, degs: document.querySelectorAll('#phraseCard .deg').length, svg: document.querySelectorAll('#phraseCard .mini-score svg').length }));
  ok(ph.sel === 0 && /フレーズ 1/.test(ph.title), 'フレーズが選べる：' + JSON.stringify(ph));
  ok(ph.degs > 3 && ph.svg >= 1, '度数と楽譜が出る');
  await page.click('#phraseCard button:has-text("候補から選ぶ")');
  await page.waitForTimeout(300);
  const cands = await page.evaluate(() => document.querySelectorAll('#phraseCard .cand').length);
  ok(cands >= 3, '候補が複数：' + cands);
  const before = await page.evaluate(() => AL.App.solo.decisions[0].id);
  await page.click('#phraseCard .cand:not(.cur) button:has-text("これにする") >> nth=0');
  await page.waitForTimeout(300);
  const after = await page.evaluate(() => AL.App.solo.decisions[0].id);
  ok(before !== after, '差しかえで決定が変わる：' + before + '→' + after);
  ok(await page.evaluate(() => AL.App.solo.events.every(e => e.midi >= 36 && e.midi <= 96)), '差しかえ後の音域');
  // 新しいソロ
  const seed0 = await page.evaluate(() => AL.App.st.soloSeed);
  await page.click('button:has-text("新しいソロ")');
  await page.waitForTimeout(200);
  ok(await page.evaluate(s => AL.App.st.soloSeed !== s, seed0), '新しいソロで seed が変わる');
  // 難しさ・楽器
  await page.click('#tab-solo .seg-b:has-text("むずかしい")');
  await page.selectOption('#soloInst', 'trumpet');
  await page.waitForTimeout(300);
  ok(await page.evaluate(() => AL.App.st.level === 3 && AL.App.st.soloInst === 'trumpet'), '難しさ・楽器の変更');
  ok(await page.evaluate(() => { const r = AL.S.RANGES.trumpet; return AL.App.solo.events.every(e => e.midi >= r[0] - 6 && e.midi <= r[1] + 6); }), 'トランペットの音域に収まる');
  if (shots) await page.screenshot({ path: path.join(shots, 'e2e-solo.png'), fullPage: true });

  /* 6) 辞典 */
  await page.click('#tabs button[data-tab="dict"]');
  await page.waitForTimeout(700);
  let dict = await page.evaluate(() => ({ cards: document.querySelectorAll('#lickList .lick').length, svgs: document.querySelectorAll('#lickList .lick svg').length }));
  ok(dict.cards >= 20 && dict.svgs === dict.cards, '辞典のカード：' + JSON.stringify(dict));
  await page.click('.ctx-b[data-ctx="dom7"]');
  await page.waitForTimeout(500);
  dict = await page.evaluate(() => ({ cards: document.querySelectorAll('#lickList .lick').length, head: document.querySelector('.dict-head h2').innerText }));
  ok(dict.cards >= 20 && /ドミナント/.test(dict.head), 'ドミナント7th のリック：' + JSON.stringify(dict));
  await page.fill('#tab-dict input[type=search]', 'エンクロージャー');
  await page.waitForTimeout(600);
  await page.click('.ctx-b.all');
  await page.waitForTimeout(600);
  dict = await page.evaluate(() => document.querySelectorAll('#lickList .lick').length);
  ok(dict >= 3, '検索で絞れる：' + dict);
  await page.click('#lickList .lick .mini-play >> nth=0');
  await page.waitForTimeout(400);
  ok(await page.evaluate(() => AL.App.playKind === 'preview'), '辞典の試聴が鳴る');
  await page.evaluate(() => AL.App.stop());
  await page.selectOption('#dictKey', '7');
  await page.waitForTimeout(500);
  ok(await page.evaluate(() => AL.App.st.dictKey === 7), '辞典のキー変更');
  if (shots) await page.screenshot({ path: path.join(shots, 'e2e-dict.png') });

  /* 7) コード譜の編集・移調・エラー表示・範囲くり返し */
  await page.click('#tabs button[data-tab="chart"]');
  await page.fill('#chartText', '| Dm7 | G7 | Cmaj7 | % |\n| Xyz | Cm7 F7 | Bbmaj7 | % |');
  await page.waitForTimeout(600);
  const ed = await page.evaluate(() => ({ bars: document.querySelectorAll('#chartGrid .bar').length, errs: document.querySelectorAll('#tab-chart .errs li').length, bad: document.querySelectorAll('#chartGrid .cc.bad').length, key: AL.App.an.key.name }));
  ok(ed.bars === 8 && ed.errs === 1 && ed.bad === 1, '編集が反映され、読めないコードが示される：' + JSON.stringify(ed));
  await page.fill('#chartText', '| Dm7 | G7 | Cmaj7 | % |');
  await page.waitForTimeout(600);
  await page.selectOption('#keySel', '5');   // F
  await page.waitForTimeout(400);
  const tr = await page.evaluate(() => ({ text: document.getElementById('chartText').value, key: AL.App.an.key.name }));
  ok(/Gm7/.test(tr.text) && /C7/.test(tr.text) && /Fmaj7/.test(tr.text) && /F メジャー/.test(tr.key), '移調（C→F）：' + tr.text.replace(/\n/g, ' ') + ' / ' + tr.key);
  await page.click('button[aria-label="半音下げる"]');
  await page.waitForTimeout(300);
  ok(await page.evaluate(() => /F#m7/.test(document.getElementById('chartText').value) && /Emaj7/.test(document.getElementById('chartText').value) && /E メジャー/.test(AL.App.an.key.name)), '半音下げる（F→E）');
  // 範囲
  await page.evaluate(() => AL.App.loadPreset('blues-jazz'));
  await page.waitForTimeout(400);
  await page.click('button:has-text("範囲をえらぶ")');
  await page.click('#chartGrid .bar[data-bar="4"]');
  await page.click('#chartGrid .bar[data-bar="7"]');
  await page.waitForTimeout(200);
  const rg = await page.evaluate(() => ({ r: AL.App.st.range, cls: document.querySelectorAll('#chartGrid .bar.inrange').length, rb: AL.App.rangeBars() }));
  ok(rg.r && rg.r.a === 4 && rg.r.b === 7 && rg.cls === 4 && rg.rb.fromBar === 4 && rg.rb.toBar === 8, '範囲くり返しの選択：' + JSON.stringify(rg));
  await page.evaluate(() => { AL.App.st.countIn = 0; });
  await page.click('#playBtn');
  await page.waitForTimeout(2200);
  const rp = await page.evaluate(() => { const p = AL.App.player.position(); return { bar: p && p.bar, cycle: p && p.cycle }; });
  ok(rp.bar >= 4 && rp.bar <= 7, '範囲の中だけを演奏している：' + JSON.stringify(rp));
  await page.evaluate(() => AL.App.stop());
  await page.click('.range-info button:has-text("解除")');

  // 途中の小節から始める：カウントイン → 11小節目から → 最後まで → 頭にもどって2コーラス目
  await page.evaluate(() => { const A = AL.App; A.setRange(null); A.st.countIn = 1; A.st.loops = 3; A.setTempo(320); A.playFromBar(10); });
  await page.waitForTimeout(250);
  const ci = await page.evaluate(() => AL.App.player.position());
  ok(ci && ci.countIn === true && ci.ci >= 0 && ci.ci <= 3, '途中から：まずカウントイン ' + JSON.stringify(ci));
  let seen = null;
  for (let i = 0; i < 60 && !(seen && seen.chorus === 1); i++) { await page.waitForTimeout(100); seen = await page.evaluate(() => AL.App.player.position()); }
  ok(seen && seen.chorus === 1 && seen.bar <= 3, '途中から：最後まで演奏して頭にもどる ' + JSON.stringify(seen));
  await page.evaluate(() => { AL.App.stop(); AL.App.setTempo(140); });
  // 選んだ範囲の外から始めると、範囲は使わず全体を演奏する
  await page.evaluate(() => { const A = AL.App; A.setRange({ a: 0, b: 1 }); A.st.countIn = 0; A.playFromBar(8); });
  await page.waitForTimeout(300);
  const outR = await page.evaluate(() => { const p = AL.App.player.position(); return { bar: p && p.bar, rangeMode: AL.App.player.rangeMode }; });
  ok(outR.rangeMode === false && outR.bar >= 8, '範囲の外から：全体を演奏 ' + JSON.stringify(outR));
  await page.evaluate(() => { AL.App.stop(); AL.App.setRange(null); AL.App.st.countIn = 1; });

  /* 8) 書き出し */
  await page.click('#tabs button[data-tab="sound"]');
  await page.waitForTimeout(200);
  await page.selectOption('#tab-sound select[aria-label="書き出すコーラスの数"]', '1');
  for (const [label, ext, minBytes] of [['MIDI（伴奏＋ソロ）', 'mid', 500], ['MusicXML（ソロ譜）', 'musicxml', 2000], ['コード譜（テキスト）', 'txt', 20]]) {
    const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 15000 }), page.click(`#tab-sound button:has-text("${label}")`)]);
    const p = await dl.path();
    const size = fs.statSync(p).size;
    ok(dl.suggestedFilename().endsWith('.' + ext) && size >= minBytes, `${ext} の書き出し：${dl.suggestedFilename()} ${size}B`);
    if (ext === 'mid') ok(fs.readFileSync(p).slice(0, 4).toString() === 'MThd', 'MIDI のヘッダ');
    if (ext === 'musicxml') ok(/<score-partwise/.test(fs.readFileSync(p, 'utf8')), 'MusicXML の中身');
  }
  const [wav] = await Promise.all([page.waitForEvent('download', { timeout: 90000 }), page.click('#tab-sound button:has-text("WAV")')]);
  const wp = await wav.path(), wb = fs.readFileSync(wp);
  ok(wb.slice(0, 4).toString() === 'RIFF' && wb.length > 100000, 'WAV の書き出し：' + wb.length + 'B');
  // ミキサー
  await page.evaluate(() => { const r = document.querySelector('#tab-sound .mix-row input[type=range]'); r.value = 0.5; r.dispatchEvent(new Event('input', { bubbles: true })); });
  ok(await page.evaluate(() => Math.abs(AL.App.st.mix.comp - 0.5) < 1e-6), 'ミキサーの音量');
  if (shots) await page.screenshot({ path: path.join(shots, 'e2e-sound.png'), fullPage: true });

  /* 9) 全サンプル：読みこみ・解析・ソロの表示でエラーが出ない */
  const ids = await page.evaluate(() => AL.P.LIST.map(p => p.id));
  for (const id of ids) {
    await page.evaluate(i => AL.App.loadPreset(i), id);
    await page.click('#tabs button[data-tab="chart"]');
    const r = await page.evaluate(() => ({ bars: document.querySelectorAll('#chartGrid .bar').length, cc: document.querySelectorAll('#chartGrid .cc').length, errs: AL.App.chart.errors.length }));
    await page.click('#tabs button[data-tab="solo"]');
    const s = await page.evaluate(() => ({ svg: !!document.querySelector('#scoreWrap svg.ntn'), notes: document.querySelectorAll('#scoreWrap .note').length, marks: document.querySelectorAll('#scoreWrap .mark').length }));
    ok(r.bars > 0 && r.cc >= r.bars && r.errs === 0 && s.svg && s.notes > 5 && s.marks > 0, `サンプル ${id}：${JSON.stringify(r)} ${JSON.stringify(s)}`);
  }

  /* 10) 共有リンク：別のブラウザ（保存なし）で開くと、同じコード譜・曲名・スタイルが出る */
  await page.evaluate(() => AL.App.loadPreset('bossa'));
  const shareUrl = await page.evaluate(() => AL.App.shareUrl());
  const ctx2 = await browser.newContext({ viewport: { width: 900, height: 800 } });
  const page2 = await ctx2.newPage();
  const errors2 = [];
  page2.on('pageerror', e => errors2.push(e.message));
  await page2.goto(shareUrl);
  await page2.waitForTimeout(500);
  const sh = await page2.evaluate(() => ({ text: AL.App.st.text, style: AL.App.st.style, title: AL.App.st.title, bars: document.querySelectorAll('#chartGrid .bar').length }));
  const want = await page.evaluate(() => ({ text: AL.App.st.text, style: AL.App.st.style, title: AL.App.st.title }));
  ok(sh.text === want.text && sh.style === 'bossa' && sh.title === want.title && sh.bars === 8, '共有リンクで同じ譜面が開く：' + JSON.stringify(sh).slice(0, 120));
  ok(errors2.length === 0, '共有リンクのページのエラー：' + errors2.join(' | '));
  await ctx2.close();

  ok(errors.length === 0, 'ブラウザのエラー：' + errors.join(' | '));
  await browser.close();
  if (bad) { console.log(`\n${bad} 件の問題`); process.exit(1); }
  console.log('e2e: OK');
})().catch(e => { console.error(e); process.exit(1); });
