/* ブラウザでの総合検査：ヘッドレス Chromium で adlib/index.html（file://）を開き、画面操作をひと通り行う
   使い方：NODE_PATH=$(npm root -g) node adlib/test/e2e.js [スクリーンショットの保存先フォルダ]
   確かめること：起動・コード入力・解析表示・再生（実際に音が出る）・停止・ソロの差しかえ・ブレイク（間）・ノリ（シャッフル）・伴奏スタイル・MIDI で送る・
   辞典・移調・範囲くり返し・書き出し・全サンプル・共有リンク */
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

  /* 5b) ブレイク（間）：選ぶとソロが作りなおされる。たっぷりにするほど、鳴っている拍が減る */
  await page.evaluate(() => { const A = AL.App; A.loadPreset('blues-jazz'); A.setSoloParams({ soloSeed: 4242, level: 2, density: 1, rest: 1, soloInst: 'altosax' }); });
  await page.waitForTimeout(300);
  const restSeg = '#tab-solo .seg[aria-label="ブレイク（間）"]';
  const soundShare = () => page.evaluate(() => AL.App.solo.events.reduce((a, e) => a + e.dur, 0) / AL.App.chart.chorusBeats);
  ok(await page.evaluate(sel => document.querySelector(sel + ' .seg-b[aria-pressed="true"]').innerText === 'ふつう', restSeg), 'ブレイクの初期値は「ふつう」');
  const soloKeyNow = () => page.evaluate(() => AL.App.solo.events.map(e => e.t + ':' + e.midi + ':' + e.dur).join(' '));
  const k1 = await soloKeyNow();
  await page.click(restSeg + ' .seg-b:has-text("たっぷり")');
  await page.waitForTimeout(500);   // 保存は 0.3 秒おくれて行われる
  const sh2 = await soundShare(), k2 = await soloKeyNow();
  ok(await page.evaluate(() => AL.App.st.rest === 2 && AL.App.solo.opts.rest === 2 && AL.U.store.get('state').rest === 2), 'ブレイク「たっぷり」が選べて、保存される');
  await page.click(restSeg + ' .seg-b:has-text("少なめ")');
  await page.waitForTimeout(250);
  const sh0 = await soundShare(), k0 = await soloKeyNow();
  ok(await page.evaluate(() => AL.App.st.rest === 0 && AL.App.solo.opts.rest === 0), 'ブレイク「少なめ」が選べる');
  ok(k1 !== k2 && k2 !== k0 && k0 !== k1, 'ブレイクの多さを変えると、ソロが作りなおされる');
  // （多さの順に鳴っている拍が減ることは、たくさんの曲と種で test/solo.js が確かめている。ここは、両はしの差だけ見る）
  ok(sh0 > sh2 + 0.08, `「少なめ」より「たっぷり」のほうが、鳴っている拍が少ない：少なめ ${sh0.toFixed(2)} ＞ たっぷり ${sh2.toFixed(2)}`);
  if (shots) await page.screenshot({ path: path.join(shots, 'e2e-solo-rest.png'), fullPage: true });
  await page.click(restSeg + ' .seg-b:has-text("ふつう")');

  /* 5c) ノリ：8分シャッフル・16分シャッフルと、その強さ。ソロのタブとコード譜のタブの部品が、同じ値を指す */
  const feelS = '#tab-solo .feel-ctl', feelC = '#tab-chart .feel-ctl';
  const feel = () => page.evaluate(() => { const A = AL.App, f = A.feel(), pf = A.makePlan().feel(); return { div: f.div, r: f.r, same: pf.div === f.div && pf.r === f.r, kind: A.feelKind(), label: A.feelLabel() }; });
  let fl = await feel();
  ok(fl.kind === 's8' && fl.div === 2 && fl.r > 0.6 && fl.same, 'スウィングの標準は8分シャッフル：' + JSON.stringify(fl));
  await page.click(feelS + ' .seg-b:has-text("16分シャッフル")');
  await page.click(feelS + ' .chip:has-text("強い")');
  fl = await feel();
  ok(fl.kind === 's16' && fl.div === 4 && Math.abs(fl.r - 0.71) < 1e-6 && fl.same && /16th Shuffle/.test(fl.label), '16分シャッフル・強い（71%）：' + JSON.stringify(fl));
  await page.click(feelS + ' .seg-b:has-text("8分シャッフル")');
  await page.click(feelS + ' .chip:has-text("3連符")');
  fl = await feel();
  ok(fl.kind === 's8' && fl.div === 2 && Math.abs(fl.r - 2 / 3) < 1e-9 && fl.same, '8分シャッフル・3連符（2/3）：' + JSON.stringify(fl));
  await page.evaluate(() => { const r = document.getElementById('soloswingRng'); r.value = 58; r.dispatchEvent(new Event('input', { bubbles: true })); });
  fl = await feel();
  ok(Math.abs(fl.r - 0.58) < 1e-9, '強さのスライダー（58%）：' + JSON.stringify(fl));
  await page.click('#tabs button[data-tab="chart"]');
  await page.waitForTimeout(150);
  ok(await page.evaluate(sel => document.querySelector(sel + ' .seg-b[aria-pressed="true"]').innerText === '8分シャッフル' && document.getElementById('swingRng').value === '58', feelC), 'コード譜タブのノリも同じ値になっている');
  await page.click(feelC + ' .seg-b:has-text("ストレート")');
  fl = await feel();
  ok(fl.kind === 'even' && fl.r === 0.5 && fl.same && await page.evaluate(() => document.getElementById('swingRng').disabled), 'ストレート：強さは選べなくなる ' + JSON.stringify(fl));
  await page.click(feelC + ' button:has-text("スタイルの標準にもどす")');
  fl = await feel();
  ok(fl.kind === 's8' && await page.evaluate(() => AL.App.st.feel == null && AL.App.st.swing == null), '標準にもどす：' + JSON.stringify(fl));

  /* 5d) 伴奏スタイル：ジャズ以外も選べる。スタイルに合うノリと楽器になり、音が出る */
  await page.selectOption('#styleSel', 'hiphop');
  await page.waitForTimeout(300);
  const hip = await page.evaluate(() => { const A = AL.App, sd = AL.B.STYLES.hiphop; return { style: A.st.style, kind: A.feelKind(), r: A.feel().r, inst: [A.st.comp, A.st.bass, A.st.drums], want: [sd.inst.comp, sd.inst.bass, sd.inst.drums], groups: document.querySelectorAll('#styleSel optgroup').length, n: document.querySelectorAll('#styleSel option').length }; });
  ok(hip.style === 'hiphop' && hip.kind === 's16' && Math.abs(hip.r - 0.62) < 1e-9 && hip.inst.join() === hip.want.join(), 'ヒップホップ：16分シャッフルと、合う楽器になる ' + JSON.stringify(hip));
  ok(hip.groups >= 5 && hip.n >= 16, 'スタイルが、種類ごとにまとまって16個ある：' + hip.groups + ' / ' + hip.n);
  for (const sid of ['rock8', 'shuffle', 'reggae', 'samba', 'salsa', 'disco']) {
    await page.selectOption('#styleSel', sid);
    await page.waitForTimeout(120);
    const r = await page.evaluate(() => { const A = AL.App, c = A.makePlan().chorus(0); return { style: A.st.style, comp: c.comp.length, bass: c.bass.length, drums: c.drums.length, solo: c.solo.length, errs: A.chart.errors.length }; });
    ok(r.style === sid && r.comp > 4 && r.bass > 4 && r.drums > 8 && r.solo > 5 && r.errs === 0, `スタイル ${sid} で伴奏とソロができる：` + JSON.stringify(r));
  }
  // 画面の下のバーの「リズム」：どのタブからでも変えられる。コード譜タブの「リズム（伴奏のスタイル）」と同じ値になる
  await page.click('#tabs button[data-tab="solo"]');
  ok(await page.evaluate(() => { const r = document.getElementById('styleQuick').getBoundingClientRect(); return document.getElementById('styleQuick').value === 'disco' && r.width > 40 && r.top < innerHeight && r.bottom > 0; }), '下のバーに「リズム」があり、いまのスタイルを指している');
  await page.selectOption('#styleQuick', 'reggae');
  await page.waitForTimeout(150);
  ok(await page.evaluate(() => AL.App.st.style === 'reggae' && document.getElementById('styleSel').value === 'reggae' && AL.App.feelKind() === 's8'), '下のバーで変えると、スタイルもノリも変わり、コード譜タブの表示もそろう');
  await page.click('#tabs button[data-tab="chart"]');
  await page.selectOption('#styleSel', 'disco');
  await page.waitForTimeout(150);
  ok(await page.evaluate(() => document.getElementById('styleQuick').value === 'disco' && [...document.querySelectorAll('#tab-chart .f-label')].some(l => /^リズム/.test(l.innerText))), 'コード譜タブで変えると、下のバーの表示もそろう（欄の名前は「リズム（伴奏のスタイル）」）');
  await page.evaluate(() => { const A = AL.App; A.ensureAudio(); window.__peak = 0; const an = window.__an, buf = new Float32Array(2048); window.__sampler = setInterval(() => { an.getFloatTimeDomainData(buf); let m = 0; for (let i = 0; i < buf.length; i++) m = Math.max(m, Math.abs(buf[i])); if (m > window.__peak) window.__peak = m; }, 30); A.st.countIn = 0; A.play(); });
  await page.waitForTimeout(1500);
  ok(await page.evaluate(() => window.__peak > 0.05 && AL.App.playKind === 'main'), 'ディスコのスタイルで、実際に音が出る');
  await page.evaluate(() => { AL.App.stop(); clearInterval(window.__sampler); AL.App.st.countIn = 1; AL.App.loadPreset('blues-jazz'); });

  /* 5e) MIDI で送る（Kontakt など）：にせの MIDI 出力で、合図の中身・時刻・止めたときを確かめる */
  await page.evaluate(() => {
    window.__midi = [];
    const out = { id: 'iac1', name: 'IAC Driver Bus 1', send: (d, ts) => window.__midi.push({ d: Array.from(d), ts, at: performance.now() }) };
    const acc = { outputs: new Map([['iac1', out]]), onstatechange: null };
    Object.defineProperty(navigator, 'requestMIDIAccess', { value: () => Promise.resolve(acc), configurable: true });
  });
  await page.click('#tabs button[data-tab="sound"]');
  await page.waitForTimeout(150);
  ok(await page.evaluate(() => !!document.querySelector('#midiCard .sw-in') && /オフ/.test(document.getElementById('midiStatus').innerText)), 'MIDI のカードがあり、はじめはオフ');
  await page.click('#midiCard .sw');
  await page.waitForTimeout(300);
  const mst = await page.evaluate(() => ({ sel: document.getElementById('midiOut').value, status: document.getElementById('midiStatus').innerText, saved: AL.U.store.get('state') && AL.U.store.get('state').midi }));
  ok(mst.sel === 'IAC Driver Bus 1' && /送っています/.test(mst.status), 'オンにすると、送り先が選ばれる：' + JSON.stringify(mst).slice(0, 160));
  const peakDuring = async ms => page.evaluate(ms => new Promise(res => { const an = window.__an, buf = new Float32Array(2048); let p = 0; const id = setInterval(() => { an.getFloatTimeDomainData(buf); for (let i = 0; i < buf.length; i++) p = Math.max(p, Math.abs(buf[i])); }, 30); setTimeout(() => { clearInterval(id); res(p); }, ms); }), ms);
  await page.evaluate(() => { const A = AL.App; A.loadPreset('blues-jazz'); A.st.countIn = 0; A.st.soloMode = 'same'; window.__midi = []; A.play(); });
  const pk1 = await peakDuring(1800);
  const m1 = await page.evaluate(() => { const ons = window.__midi.filter(x => (x.d[0] & 0xf0) === 0x90); const ch = {}; ons.forEach(x => { ch[x.d[0] & 15] = (ch[x.d[0] & 15] || 0) + 1; }); return { ch, n: ons.length, late: ons.filter(x => x.ts < x.at - 5).length, span: ons.length ? Math.max(...ons.map(x => x.ts)) - Math.min(...ons.map(x => x.ts)) : 0, ahead: Math.max(...ons.map(x => x.ts - x.at)) }; });
  ok(m1.ch[0] > 0 && m1.ch[1] > 0 && m1.ch[2] > 0 && m1.ch[9] > 0, 'コード 1ch・ベース 2ch・ソロ 3ch・ドラム 10ch に合図が出る：' + JSON.stringify(m1.ch));
  ok(m1.late === 0 && m1.span > 800 && m1.ahead < 1500, '合図は、これから鳴る時刻つき（遅れ・まとめ送りなし）：' + JSON.stringify(m1));
  ok(pk1 < 0.02, '送っているパートは、ブラウザでは鳴らない（ピーク ' + pk1.toFixed(3) + '）');
  await page.evaluate(() => { window.__midi = []; AL.App.stop(); });
  await page.waitForTimeout(100);
  ok(await page.evaluate(() => [0xb0, 0xb1, 0xb2, 0xb9].every(c => window.__midi.some(x => x.d[0] === c && x.d[1] === 123))), '止めると、4つのチャンネルにオール・ノート・オフ');
  // ベースのチェックを外す：ベースはブラウザで鳴り、MIDI では送らない
  await page.click('#midiCard .midi-part:has-text("ベース") input');
  await page.evaluate(() => { window.__midi = []; AL.App.play(); });
  const pk2 = await peakDuring(1500);
  const m2 = await page.evaluate(() => { const ons = window.__midi.filter(x => (x.d[0] & 0xf0) === 0x90); return { bass: ons.filter(x => (x.d[0] & 15) === 1).length, comp: ons.filter(x => (x.d[0] & 15) === 0).length }; });
  await page.evaluate(() => AL.App.stop());
  ok(m2.bass === 0 && m2.comp > 0 && pk2 > 0.03, 'チェックを外したベースはブラウザで鳴る：' + JSON.stringify(m2) + ' ピーク ' + pk2.toFixed(3));
  // テスト音
  await page.evaluate(() => { window.__midi = []; });
  await page.click('#midiTest');
  ok(await page.evaluate(() => window.__midi.some(x => x.d[0] === 0x90) && window.__midi.some(x => x.d[0] === 0x99) && !window.__midi.some(x => x.d[0] === 0x91)), 'テスト音（チェックしたパートだけ）');
  if (shots) await page.screenshot({ path: path.join(shots, 'e2e-midi.png'), fullPage: true });
  // もとにもどす（このあとの検査は、ブラウザの音で）
  await page.evaluate(() => { AL.App.setMidi({ on: false, parts: { bass: true } }); AL.App.st.countIn = 1; });
  ok(await page.evaluate(() => !AL.MO.active() && AL.App.st.midi.parts.bass === true), 'MIDI をオフにもどせる');

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
  // 跳ぶ・ジグザグのリック：タグの名前でも探せる
  await page.fill('#tab-dict input[type=search]', 'ジグザグ');
  await page.waitForTimeout(600);
  const zz = await page.evaluate(() => ({ n: document.querySelectorAll('#lickList .lick').length, text: document.querySelector('#lickList .lick') ? document.querySelector('#lickList .lick').innerText : '' }));
  ok(zz.n >= 10 && /ジグザグ/.test(zz.text), '「ジグザグ」で、ジグザグのリックが出る：' + zz.n);
  await page.fill('#tab-dict input[type=search]', '跳ぶ');
  await page.waitForTimeout(600);
  ok(await page.evaluate(() => document.querySelectorAll('#lickList .lick').length >= 10), '「跳ぶ」で、跳ぶリックが出る');
  await page.fill('#tab-dict input[type=search]', 'エンクロージャー');
  await page.waitForTimeout(600);
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

  // くり返すたびにキーを上げる：2コーラス目は4度上（F → B♭）で鳴る。画面の譜面（もとのキー）はそのまま
  await page.evaluate(() => { const A = AL.App; A.loadPreset('ii-V-I'); A.setBacking({}); A.set({ keyCycle: 5 }); A._backing = {}; A._cyc = {}; A.st.countIn = 0; A.st.loops = 3; A.setTempo(320); });
  const kc = await page.evaluate(() => {
    const A = AL.App, root0 = A.slots[0].chord.rootPc;
    const b0 = A.makePlan().chorus(0).bass[0].midi % 12, b1 = A.makePlan().chorus(1).bass[0].midi % 12;
    const s0 = A.makePlan().chorus(0).solo.length, s1 = A.makePlan().chorus(1).solo.length;
    return { root0, b0, b1, s0, s1, name1: A.keyNameAt(1), name0: A.keyNameAt(0) };
  });
  ok(kc.b0 === kc.root0 && kc.b1 === (kc.root0 + 5) % 12 && kc.s1 > 5, 'キーを順に変える：コーラス2は4度上 ' + JSON.stringify(kc));
  await page.evaluate(() => AL.App.play());
  let kpos = null;
  for (let i = 0; i < 60 && !(kpos && kpos.chorus === 1); i++) { await page.waitForTimeout(100); kpos = await page.evaluate(() => AL.App.player.position()); }
  await page.waitForTimeout(200);
  const ktxt = await page.evaluate(() => document.getElementById('posText').innerText.replace(/\n/g, ' '));
  ok(kpos && kpos.chorus === 1 && /コーラス 2 \/ 3・キー F/.test(ktxt), '再生バーにいまのキーが出る：' + ktxt);
  await page.evaluate(() => { const A = AL.App; A.stop(); A.set({ keyCycle: 0 }); A._backing = {}; A._cyc = {}; A.setTempo(140); A.st.countIn = 1; });

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
  await page.evaluate(() => { const A = AL.App; A.loadPreset('bossa'); A.setSoloParams({ soloSeed: 4242, level: 3, density: 2, rest: 2, soloInst: 'tenorsax' }); A.set({ feel: 's16', swing: 0.6 }); A.swapLick(1, A.suggest(A.solo.decisions[1].i0, 5).list.find(l => l.id !== A.solo.decisions[1].id).id); });
  const shareUrl = await page.evaluate(() => AL.App.shareUrl());
  const soloKey = await page.evaluate(() => JSON.stringify(AL.App.solo.events.map(e => [e.t, e.midi, e.dur])));
  const instKey = await page.evaluate(() => [AL.App.st.comp, AL.App.st.bass, AL.App.st.drums].join());
  const ctx2 = await browser.newContext({ viewport: { width: 900, height: 800 } });
  const page2 = await ctx2.newPage();
  const errors2 = [];
  page2.on('pageerror', e => errors2.push(e.message));
  await page2.goto(shareUrl);
  await page2.waitForTimeout(500);
  const sh = await page2.evaluate(() => ({ text: AL.App.st.text, style: AL.App.st.style, title: AL.App.st.title, bars: document.querySelectorAll('#chartGrid .bar').length }));
  const want = await page.evaluate(() => ({ text: AL.App.st.text, style: AL.App.st.style, title: AL.App.st.title }));
  ok(sh.text === want.text && sh.style === 'bossa' && sh.title === want.title && sh.bars === 8, '共有リンクで同じ譜面が開く：' + JSON.stringify(sh).slice(0, 120));
  const soloKey2 = await page2.evaluate(() => JSON.stringify(AL.App.solo.events.map(e => [e.t, e.midi, e.dur])));
  ok(soloKey === soloKey2 && soloKey.length > 100, '共有リンクで同じソロ（差しかえたリックも）が再現される');
  ok(await page2.evaluate(() => AL.App.st.soloInst === 'tenorsax' && AL.App.st.level === 3 && AL.App.st.soloSeed === 4242), '共有リンクで楽器・難しさ・番号も再現される');
  ok(await page2.evaluate(() => AL.App.st.rest === 2 && AL.App.st.density === 2 && AL.App.feelKind() === 's16' && Math.abs(AL.App.feel().r - 0.6) < 1e-9), '共有リンクでブレイクの多さ・音の多さ・ノリも再現される');
  ok(await page2.evaluate(k => [AL.App.st.comp, AL.App.st.bass, AL.App.st.drums].join() === k, instKey), '共有リンクで伴奏の楽器も再現される：' + instKey);
  // 楽器の入っていない（前の版の）リンク：そのスタイルのおすすめの楽器で開く
  const oldUrl = await page.evaluate(() => { const A = AL.App; const d = { t: '| G | D | Em | C |', s: 'rock8', p: 120, ti: 'old' }; return location.href.split('#')[0] + '#s=' + btoa(unescape(encodeURIComponent(JSON.stringify(d)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); });
  await page2.goto('about:blank'); await page2.goto(oldUrl); await page2.waitForTimeout(400);
  ok(await page2.evaluate(() => { const A = AL.App, r = AL.B.STYLES.rock8.inst; return A.st.style === 'rock8' && A.st.comp === r.comp && A.st.bass === r.bass && A.st.drums === r.drums; }), '楽器の入っていないリンクは、スタイルに合う楽器で開く');
  ok(errors2.length === 0, '共有リンクのページのエラー：' + errors2.join(' | '));
  await ctx2.close();

  ok(errors.length === 0, 'ブラウザのエラー：' + errors.join(' | '));
  await browser.close();
  if (bad) { console.log(`\n${bad} 件の問題`); process.exit(1); }
  console.log('e2e: OK');
})().catch(e => { console.error(e); process.exit(1); });
