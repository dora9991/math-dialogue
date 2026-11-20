// ① 記録のタブ：プレー＋背番号（どちらが先でも）・相手の得点・★・取り消す／やり直す・▶ 見る・一覧・直す小窓・シュートの場所・動画を止める・設定・画面の大きさ
//   node tests/e2e-tap.cjs [dev|built]    SHOTS=フォルダ で画面の写真
const T = require('./helpers.cjs');
const MODE = process.argv[2] || 'dev';
const ALL = ['fg2', 'fg2x', 'fg3', 'fg3x', 'ft', 'ftx', 'oreb', 'dreb', 'ast', 'stl', 'blk', 'tov', 'foul'];
const NOS12 = ['4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15'];
const strip = (s) => (s || '').replace(/\s+/g, '');

(async () => {
  const { browser, srv, close } = await T.launch(MODE);
  try {
    const VID = await T.video('g120.mp4', 120);
    const types = (page) => page.$$eval('#scPane-tap .tp-pt', (els) => els.map((e) => e.dataset.type));
    const pick = (page) => page.evaluate(() => SC.tap.state().pick);
    const recs = async (page) => T.plays(await T.game(page));
    const lastRec = async (page) => { const r = await recs(page); return r[r.length - 1]; };
    const toast = (page) => page.textContent('#toasts');

    T.section(`${MODE === 'built' ? '1ファイル版' : '開発版'}・スマホ（390×844）・はじめの設定（全部オン）`);
    let C = await T.open(browser, srv.url, { width: 390, height: 844 });
    let page = C.page;
    await T.start(page, VID, { name: 'ミライ', opp: 'ヒガシ', nos: '4-15' });
    T.eq(await types(page), ALL, 'プレーのボタン：2P 2P× 3P 3P× FT FT× Oリバ Dリバ アシスト スティール ブロック ターンオーバー ファウル');
    T.eq(await page.$$eval('#scPane-tap .tp-no', (els) => els.map((e) => e.dataset.no)), NOS12.concat(['']), '背番号：番号の順＋「？」');
    T.ok((await page.textContent('[data-no=""]')).trim() === '？', '「？」のボタン');
    T.ok(strip(await page.textContent('#tpOpp')).startsWith('ヒガシの得点+1+2+3'), '相手：「ヒガシの得点 +1 +2 +3」の1行だけ');
    T.ok(await page.isVisible('#tpMark') && await page.isVisible('#tpList'), '★ あとで見る・📋 記録の一覧');
    T.ok((await page.textContent('#tpLastBar')).includes('まだ記録はありません') && await page.isDisabled('#tpUndo'), '下の帯：まだ記録なし（取り消すは押せない）');
    T.ok((await page.textContent('#tpHint')).includes('プレーと背番号をタップ'), '案内：プレーと背番号をタップ（どちらが先でも）');
    const aria = await page.$$eval('#scPane-tap .tp-pt', (els) => els.map((e) => e.getAttribute('aria-label')));
    T.ok(aria.every(Boolean) && aria.includes('ターンオーバー') && aria.includes('オフェンスリバウンド'), 'ボタンに読み上げの名前（短い文字でも）');
    const pane = await page.evaluate(() => { const p = document.querySelector('#scPane-tap'); return { sh: p.scrollHeight, ch: p.clientHeight }; });
    T.ok(pane.sh <= pane.ch + 1, `12人・全部オン：すべらせずに全部押せる（${pane.sh} ≦ ${pane.ch}）`, pane);

    // プレー → 背番号
    await T.seek(page, 10);
    await page.click('[data-type="fg2"]');
    T.ok(strip(await page.textContent('#tpHint')).includes('2P→番号は？') && await page.$eval('[data-type="fg2"]', (e) => e.classList.contains('tp-sel')), 'プレーを押すと「2P → 番号は？」（押したボタンに印）');
    await T.seek(page, 13);
    await page.click('[data-no="7"]');
    let e = await lastRec(page);
    T.eq([e.t, e.type, e.team, e.no], [10, 'fg2', 0, '7'], '2P → #7：時刻は、はじめに押したときの動画の時刻（10 秒）');
    T.ok(strip(await page.textContent('#scScore')) === 'ミライ2−0ヒガシ', '上の帯の得点（2 − 0）');
    T.ok(!(await pick(page)) && (await page.textContent('#tpHint')).includes('プレーと背番号'), '記録すると、選びかけは消える');
    T.ok(strip(await page.textContent('#tpLast')).includes('#72P成功') && strip(await page.textContent('#tpLast')).includes('0:10'), '下の帯：0:10 #7 2P成功');
    T.ok(!(await page.isVisible('#tpShot')), 'シュートの場所がオフなら、場所は聞かない');
    // 背番号 → プレー
    await T.seek(page, 20);
    await page.click('[data-no="5"]');
    T.ok(strip(await page.textContent('#tpHint')).includes('#5→プレーは？'), '背番号を先に：「#5 → プレーは？」');
    await T.seek(page, 22.5);
    await page.click('[data-type="ast"]');
    e = await lastRec(page);
    T.eq([e.t, e.type, e.team, e.no], [20, 'ast', 0, '5'], '#5 → アシスト：時刻は 20 秒');
    // やめる
    const n0 = (await recs(page)).length;
    await page.click('[data-type="fg3"]');
    await page.click('[data-type="fg3"]');
    T.ok(!(await pick(page)), '同じプレーをもう一度 → やめる');
    await page.click('[data-no="9"]');
    await page.click('[data-no="9"]');
    T.ok(!(await pick(page)), '同じ番号をもう一度 → やめる');
    await page.click('[data-type="ft"]');
    await page.click('#tpCancel');
    T.ok(!(await pick(page)) && (await recs(page)).length === n0, '「× やめる」でもやめられる（記録は増えない）');
    // 20 秒
    await T.seek(page, 30);
    await page.click('[data-type="fg2"]');
    await T.seek(page, 49);
    T.ok(!!(await pick(page)), '19 秒動かしただけなら、選びかけはそのまま');
    await page.click('[data-no="8"]');
    e = await lastRec(page);
    T.eq([e.t, e.type, e.no], [30, 'fg2', '8'], '→ 記録は 30 秒');
    await T.seek(page, 30);
    await page.click('[data-type="fg2"]');
    await T.seek(page, 51);
    T.ok(!(await pick(page)) && (await toast(page)).includes('20 秒より大きく動いた'), '20 秒より大きく動くと、選びかけをやめて知らせる');
    // ？
    await T.seek(page, 40);
    await page.click('[data-type="fg2x"]');
    await page.click('[data-no=""]');
    e = await lastRec(page);
    T.eq([e.t, e.type, e.team, e.no], [40, 'fg2x', 0, null], '2P× → ？：番号なし（no: null）');
    T.ok(strip(await page.textContent('#tpLast')).includes('？2P失敗'), '下の帯：？ 2P失敗');
    // 相手
    await T.seek(page, 45);
    for (const p of [1, 2, 3]) await page.click(`[data-opp="${p}"]`);
    const opp = (await recs(page)).slice(-3);
    T.eq(opp.map((x) => [x.t, x.type, x.team, x.no]), [[45, 'ft', 1, null], [45, 'fg2', 1, null], [45, 'fg3', 1, null]], '相手 +1 +2 +3：1回押すだけ（ft・fg2・fg3・team 1・番号なし）');
    T.ok(strip(await page.textContent('#scScore')) === 'ミライ4−6ヒガシ', '上の帯の得点（4 − 6）');
    // ★
    await T.seek(page, 60);
    await page.click('#tpMark');
    e = await lastRec(page);
    T.eq([e.t, e.type, e.team, e.no], [60, 'mark', null, null], '★ あとで見る：チームなし');
    // 取り消す・やり直す
    const before = (await recs(page)).length;
    await page.click('#tpUndo');
    T.ok((await recs(page)).length === before - 1 && (await lastRec(page)).type === 'fg3' && await page.isVisible('#tpRedo'), '↶ 取り消す：いちばん新しい記録（★）を消す・やり直すが出る');
    T.ok(strip(await page.textContent('#tpLast')).includes('ヒガシ3P成功'), '下の帯は、その前の記録（ヒガシ 3P成功）');
    await page.click('#tpRedo');
    T.ok((await lastRec(page)).type === 'mark' && (await lastRec(page)).t === 60 && !(await page.isVisible('#tpRedo')), '↷ やり直す：★ が戻る');
    // ▶ 見る（★：前 5 秒・後 2 秒 → 55〜62 秒）
    await page.click('#tpWatch');
    await page.waitForFunction(() => SC.app.S.media && !SC.app.S.media.paused, null, { timeout: 5000 });
    const mid = await page.evaluate(() => SC.app.now());
    T.ok(mid >= 54.9 && mid < 62.2 && (await page.textContent('#tpWatch')).includes('止める'), `▶ 見る：場面の中で再生（${mid} 秒・ボタンは ■ 止める）`);
    await page.waitForFunction(() => SC.app.S.media.paused, null, { timeout: 12000 });
    const end = await page.evaluate(() => SC.app.now());
    T.ok(end >= 61.6 && end <= 62.5 && (await page.textContent('#tpWatch')).includes('見る'), `場面の終わり（62 秒）で止まる（${end} 秒）`);
    await page.click('#tpWatch');
    await page.waitForFunction(() => !SC.app.S.media.paused, null, { timeout: 5000 });
    await page.click('#tpWatch');
    await T.sleep(200);
    T.ok(await page.evaluate(() => SC.app.S.media.paused || !SC.tap.state().watching), 'もう一度押すと、途中でやめられる');
    await page.evaluate(() => SC.app.pause());
    // タブを切りかえると、選びかけはやめる
    await page.click('[data-type="stl"]');
    await page.click('#scTab-scenes');
    T.ok(!(await pick(page)) && (await toast(page)).includes('ほかのタブ'), 'ほかのタブを開くと、選びかけをやめる（知らせる）');
    await page.click('#scTab-tap');
    await T.shot(page, 'tap-390x844-light');

    // 一覧
    await page.click('#tpList');
    const rows = await page.$$eval('#tpListSheet .tp-lrow', (els) => els.map((x) => x.dataset.eid));
    const g = await T.game(page);
    const want = T.plays(g).map((x, i) => ({ x, i })).sort((a, b) => (b.x.t - a.x.t) || (b.i - a.i)).map((y) => y.x.id);
    T.eq(rows, want, `📋 記録の一覧：全部（${rows.length}件）・動画の時刻の新しい順`);
    T.ok(strip(await page.textContent('#tpListSheet')).includes('1Q'), '一覧に、ピリオド');
    await T.shot(page, 'tap-list');
    const fg2 = T.plays(g).find((x) => x.type === 'fg2' && x.t === 10);
    await page.click(`#tpListSheet [data-eid="${fg2.id}"]`);
    T.ok(await page.isVisible('#tpEdit') && (await page.getAttribute('#tpEdit', 'data-eid')) === fg2.id && await page.isVisible('#tpEditBack'), '一覧の行を押すと、直す小窓（一覧にもどる）');
    await page.click('#tpEditBack');
    T.ok(await page.isVisible('#tpListSheet'), '「一覧にもどる」');
    await page.evaluate(() => BT.ui.closeSheet());

    // 直す小窓
    T.ok(await page.evaluate((id) => SC.tap.edit(id), fg2.id) && await page.isVisible('#tpEdit'), 'SC.tap.edit(id) で、直す小窓が開く');
    const ev = async () => (await T.game(page)).events.find((x) => x.id === fg2.id);
    await page.click('#tpEdit [data-eno="9"]');
    T.eq((await ev()).no, '9', '背番号を直す（#7 → #9）');
    await page.click('#tpEdit [data-etype="fg3"]');
    T.eq((await ev()).type, 'fg3', 'プレーを直す（2P → 3P）');
    T.ok(strip(await page.textContent('#scScore')) === 'ミライ5−6ヒガシ', '直すと、得点も変わる（5 − 6）');
    const tt = [];
    for (const d of ['1', '-0.5', '5', '-5', '-1', '0.5']) { await page.click(`#tpEdit [data-nudge="${d}"]`); tt.push((await ev()).t); }
    T.eq(tt, [11, 10.5, 15.5, 10.5, 9.5, 10], '時刻を直す：+1 −0.5 +5 −5 −1 +0.5');
    T.ok((await page.textContent('#tpEditTime')).includes('0:10.0'), '小窓に、いまの時刻（0:10.0）');
    await T.shot(page, 'tap-edit');
    await page.evaluate(() => SC.app.seek(33.3));
    await T.sleep(200);
    await page.click('#tpNow');
    T.eq((await ev()).t, 33.3, '「いまの動画の時刻にする」→ 33.3 秒');
    await page.click('#tpDel');
    T.ok(!(await ev()) && !(await page.isVisible('#tpEdit')) && (await toast(page)).includes('消しました'), '🗑 この記録を消す');
    await page.click('#toasts .tbtn');
    T.ok(!!(await ev()), '「もとに戻す」で戻る');
    // 帯を押すと、いちばん新しい記録の小窓
    await page.click('#tpLast');
    T.ok((await page.getAttribute('#tpEdit', 'data-eid')) === (await lastRec(page)).id, '下の帯を押すと、その記録を直す小窓');
    await page.evaluate(() => BT.ui.closeSheet());
    // 相手の記録を直す
    const o1 = T.plays(await T.game(page)).find((x) => x.team === 1 && x.type === 'ft');
    await page.evaluate((id) => SC.tap.edit(id), o1.id);
    T.ok(!(await page.$('#tpEdit [data-eno]')) && !(await page.$('#tpEdit [data-etype]')) && await page.isVisible('#tpEdit [data-epts="3"]') && await page.isVisible('#tpDel'), '相手の記録：得点（1・2・3）・時刻・消すだけ');
    await page.click('#tpEdit [data-epts="3"]');
    T.eq((await T.game(page)).events.find((x) => x.id === o1.id).type, 'fg3', '相手 +1 → +3 に直す');
    await page.click('#tpEdit [data-nudge="-1"]');
    T.eq((await T.game(page)).events.find((x) => x.id === o1.id).t, 44, '相手の記録の時刻も直せる');
    await page.evaluate(() => BT.ui.closeSheet());
    // ▶ この場面を見る（小窓を閉じて再生 → 終わったら、また小窓）
    const mk = (await recs(page)).find((x) => x.type === 'mark');
    await page.evaluate((id) => SC.tap.edit(id), mk.id);
    await page.click('#tpEditWatch');
    T.ok(!(await page.isVisible('#tpEdit')), '「▶ この場面を見る」：小窓を閉じて再生');
    await page.waitForSelector('#tpEdit', { timeout: 12000 });
    const t2 = await page.evaluate(() => SC.app.now());
    T.ok(t2 >= 61.5 && t2 <= 62.5, `見終わると（62 秒で止まる）、また直す小窓（${t2} 秒）`);
    await page.evaluate(() => BT.ui.closeSheet());
    T.ok(C.errors.length === 0, 'ページのエラーなし', C.errors);

    // 設定
    T.section('設定：① 記録するもの');
    await page.click('#scSettings');
    T.ok(await page.isVisible('#scSec-rec') && (await page.textContent('#scSec-rec')).includes('成功率が出ます'), '設定に「① 記録するもの」（説明つき）');
    await page.evaluate(() => document.querySelector('#scSec-rec').scrollIntoView());
    await T.shot(page, 'tap-settings');
    const sel = (k) => `#scSec-rec input[data-pref="${k}"]`;
    const steps = [
      ['miss', ['fg2', 'fg3', 'ft', 'oreb', 'dreb', 'ast', 'stl', 'blk', 'tov', 'foul']],
      ['rebSplit', ['fg2', 'fg3', 'ft', 'reb', 'ast', 'stl', 'blk', 'tov', 'foul']],
      ['reb', ['fg2', 'fg3', 'ft', 'ast', 'stl', 'blk', 'tov', 'foul']],
      ['ast', ['fg2', 'fg3', 'ft', 'stl', 'blk', 'tov', 'foul']],
      ['stl', ['fg2', 'fg3', 'ft', 'blk', 'tov', 'foul']],
      ['blk', ['fg2', 'fg3', 'ft', 'tov', 'foul']],
      ['tov', ['fg2', 'fg3', 'ft', 'foul']],
      ['foul', ['fg2', 'fg3', 'ft']]
    ];
    for (const [k, w] of steps) {
      await page.click(sel(k));
      const st = await page.evaluate((key) => [JSON.parse(localStorage.getItem('bscene:prefs')).rec[key], SC.app.S.prefs.rec[key]], k);
      T.ok(JSON.stringify(await types(page)) === JSON.stringify(w) && st[0] === false && st[1] === false, `「${k}」を外す → ボタンがすぐ変わる・保存される`, { got: await types(page), st });
    }
    T.ok(!(await page.$(sel('rebSplit'))), 'リバウンドを外すと、「Oリバ・Dリバに分ける」は出ない');
    await page.click(sel('mark'));
    T.ok(!(await page.$('#tpMark')) && (await page.evaluate(() => JSON.parse(localStorage.getItem('bscene:prefs')).rec.mark)) === false, '「★ あとで見る」を外す → ★ がなくなる');
    T.ok(!(await page.$('#scSec-rec [data-courttype]')), '場所がオフなら、コートの選択は出ない');
    await page.click(sel('shotLoc'));
    await page.click('#scSec-rec [data-courttype="mini"]');
    await page.click(sel('autoPause'));
    let pf = await page.evaluate(() => JSON.parse(localStorage.getItem('bscene:prefs')));
    T.ok(pf.shotLoc === true && pf.courtType === 'mini' && pf.autoPause === true, 'シュートの場所（ミニバス）・タップしたら動画を止める も保存', pf);
    await page.click(sel('rebSplit').replace('rebSplit', 'reb'));
    T.ok(await page.$(sel('rebSplit')) && JSON.stringify(await types(page)) === JSON.stringify(['fg2', 'fg3', 'ft', 'reb']), 'リバウンドを戻す → 「リバ」1つ（分けるはオフのまま）');
    await page.evaluate(() => BT.ui.closeSheet());
    await T.shot(page, 'tap-off-390x844');
    await page.reload();
    await page.waitForFunction(() => window.SC && SC.app && document.querySelector('#scPick'));
    pf = await page.evaluate(() => SC.app.S.prefs);
    T.ok(pf.rec.miss === false && pf.rec.reb === true && pf.rec.mark === false && pf.shotLoc === true && pf.autoPause === true, '開き直しても、設定はそのまま');
    T.ok(C.errors.length === 0, 'ページのエラーなし', C.errors);
    await C.ctx.close();

    // 全部オフ（3つ）・背番号なし
    T.section('全部オフ・背番号なし');
    const OFF = { rec: { miss: false, reb: false, rebSplit: false, ast: false, stl: false, blk: false, tov: false, foul: false, mark: false } };
    C = await T.open(browser, srv.url, { width: 390, height: 844 }, { prefs: OFF });
    page = C.page;
    await T.start(page, VID, { nos: '' });
    T.eq(await types(page), ['fg2', 'fg3', 'ft'], '全部オフ：2P 3P FT だけ');
    T.eq(await page.$$eval('#scPane-tap .tp-no', (els) => els.map((x) => [x.dataset.no, x.textContent.trim()])), [['', 'チーム']], '背番号なし：「チーム」だけ');
    T.ok(!(await page.$('#tpMark')) && await page.isVisible('#tpList'), '★ なし（一覧はある）');
    T.ok((await page.textContent('#tpHint')).includes('「チーム」'), '案内：プレー → 「チーム」');
    await T.seek(page, 8);
    await page.click('[data-type="fg3"]');
    await page.click('[data-no=""]');
    e = await lastRec(page);
    T.eq([e.t, e.type, e.team, e.no], [8, 'fg3', 0, null], '3P → チーム（no: null）');
    T.ok(strip(await page.textContent('#tpLast')).includes('自分3P成功'), '下の帯：チームの名前（なければ「自分」）');
    await page.evaluate((id) => SC.tap.edit(id), e.id);
    T.eq(await page.$$eval('#tpEdit [data-eno]', (els) => els.map((x) => x.textContent)), ['チーム'], '直す小窓の背番号も「チーム」だけ');
    await page.evaluate(() => BT.ui.closeSheet());
    await T.shot(page, 'tap-off-empty');
    T.ok(C.errors.length === 0, 'ページのエラーなし', C.errors);
    await C.ctx.close();

    // タップしたら動画を止める
    T.section('タップしたら動画を止める');
    C = await T.open(browser, srv.url, { width: 390, height: 844 }, { prefs: { autoPause: true } });
    page = C.page;
    await T.start(page, VID, {});
    await T.seek(page, 5);
    await page.evaluate(() => SC.app.play());
    await page.waitForFunction(() => !SC.app.S.media.paused);
    await T.sleep(400);
    await page.click('[data-type="fg2"]');
    const tp = await page.evaluate(() => ({ t: SC.app.now(), paused: SC.app.S.media.paused }));
    T.ok(tp.paused, 'プレーを押すと、動画が止まる');
    await T.sleep(500);
    await page.click('[data-no="4"]');
    await page.waitForFunction(() => !SC.app.S.media.paused, null, { timeout: 3000 }).catch(() => {});
    e = await lastRec(page);
    T.ok(await page.evaluate(() => !SC.app.S.media.paused) && e.t === tp.t, `番号を押して記録すると、また動く（時刻 ${e.t} = 止めた時刻）`);
    await page.click('[data-no="4"]');
    T.ok(await page.evaluate(() => SC.app.S.media.paused), '背番号が先でも止まる');
    await page.click('[data-no="4"]');
    T.ok(await page.evaluate(() => !SC.app.S.media.paused), 'やめると、また動く');
    await page.evaluate(() => SC.app.pause());
    await T.sleep(200);
    await page.click('[data-type="ft"]');
    await page.click('[data-no="5"]');
    await T.sleep(300);
    T.ok(await page.evaluate(() => SC.app.S.media.paused), '止まっていたときは、記録しても止まったまま');
    T.ok(C.errors.length === 0, 'ページのエラーなし', C.errors);
    await C.ctx.close();

    // シュートの場所
    T.section('シュートの場所（オン）');
    C = await T.open(browser, srv.url, { width: 390, height: 844 }, { prefs: { shotLoc: true } });
    page = C.page;
    await T.start(page, VID, {});
    await T.seek(page, 10);
    await page.evaluate(() => SC.app.play());
    await page.waitForFunction(() => !SC.app.S.media.paused);
    await page.click('[data-type="fg2"]');
    await page.click('[data-no="6"]');
    await page.waitForSelector('#tpShot');
    T.ok(await page.evaluate(() => SC.app.S.media.paused) && (await page.textContent('#sheet header')).includes('#6 2P成功'), '2P を記録すると、動画を止めて「#6 2P成功：どこから？」');
    await T.shot(page, 'tap-shot');
    const pt = await page.evaluate(() => { const s = document.querySelector('#tpShot svg.court'); return BT.shot.client(s, 0.85, 0.3); });
    await page.mouse.click(pt.x, pt.y);
    await page.waitForFunction(() => !SC.app.S.media.paused, null, { timeout: 3000 }).catch(() => {});
    let g2 = await T.game(page);
    e = T.plays(g2).slice(-1)[0];
    T.ok(Math.abs(e.x - 0.85) < 0.01 && Math.abs(e.y - 0.3) < 0.01 && String(e.x).split('.')[1].length <= 3 && g2.court === 'std', `場所を押すと x・y（${e.x}, ${e.y}）・コート std`, { x: e.x, y: e.y, court: g2.court });
    T.ok(await page.evaluate(() => !SC.app.S.media.paused) && !(await page.isVisible('#tpShot')), '押すと閉じて、動画はまた動く');
    T.ok((await page.textContent('#tpLast')).includes('📍 ミドル右'), '下の帯に「📍 ミドル右」');
    await page.evaluate(() => SC.app.pause());
    await page.click('[data-type="fg3x"]');
    await page.click('[data-no="7"]');
    await page.waitForSelector('#tpShot');
    await page.click('#tpShotLater');
    e = await lastRec(page);
    T.ok(!('x' in e) && !(await page.isVisible('#tpShot')) && await page.evaluate(() => SC.app.S.media.paused), '「あとで」：場所なし（止まっていた動画は止まったまま）');
    await page.click('[data-type="ft"]');
    await page.click('[data-no="7"]');
    await T.sleep(200);
    T.ok(!(await page.isVisible('#tpShot')), 'FT では、場所は聞かない');
    await page.click('[data-type="ast"]');
    await page.click('[data-no="7"]');
    await T.sleep(200);
    T.ok(!(await page.isVisible('#tpShot')), 'アシストでも聞かない');
    // 直す小窓で場所
    const located = T.plays(await T.game(page)).find((x) => x.type === 'fg2');
    await page.evaluate((id) => SC.tap.edit(id), located.id);
    T.ok(await page.isVisible('#tpEditLoc') && (await page.textContent('#tpEditLoc')).includes('ミドル右') && (await page.textContent('#tpEditSum')).includes('📍'), '直す小窓：場所（ゾーンの名前）');
    await page.click('#tpLocClear');
    T.ok(!('x' in (await T.game(page)).events.find((x) => x.id === located.id)), '「場所を消す」');
    await page.evaluate(() => document.querySelector('#tpEditLoc svg.court').scrollIntoView({ block: 'center' }));
    const p2 = await page.evaluate(() => { const s = document.querySelector('#tpEditLoc svg.court'); return BT.shot.client(s, 0.5, 0.7); });
    await page.mouse.click(p2.x, p2.y);
    const moved = (await T.game(page)).events.find((x) => x.id === located.id);
    T.ok(Math.abs(moved.x - 0.5) < 0.01 && Math.abs(moved.y - 0.7) < 0.01 && (await page.textContent('#tpEditLoc')).includes('3P トップ'), `コートを押して場所を付け直す（${moved.x}, ${moved.y}・3P トップ）`);
    await page.click('#tpEdit [data-etype="ast"]');
    const nl = (await T.game(page)).events.find((x) => x.id === located.id);
    T.ok(nl.type === 'ast' && !('x' in nl) && !(await page.$('#tpEditLoc')), 'シュートでないプレーに直すと、場所は消える');
    await page.evaluate(() => BT.ui.closeSheet());
    T.ok(C.errors.length === 0, 'ページのエラーなし', C.errors);
    await C.ctx.close();

    // 場所がオフでも、直す小窓から付けられる・ミニバス
    C = await T.open(browser, srv.url, { width: 390, height: 844 }, { prefs: { courtType: 'mini' } });
    page = C.page;
    await T.start(page, VID, {});
    await page.click('[data-type="fg3"]');
    await page.click('[data-no="8"]');
    await T.sleep(200);
    T.ok(!(await page.isVisible('#tpShot')), '場所がオフ：聞かない');
    e = await lastRec(page);
    await page.evaluate((id) => SC.tap.edit(id), e.id);
    T.ok(!(await page.$('#tpEditLoc')) && await page.isVisible('#tpLocOpen'), '直す小窓には「📍 シュートの場所を付ける」だけ');
    await page.click('#tpLocOpen');
    T.ok((await page.getAttribute('#tpEditLoc svg.court', 'data-court')) === 'mini', '押すとコート（設定のミニバス）');
    await page.evaluate(() => document.querySelector('#tpEditLoc svg.court').scrollIntoView({ block: 'center' }));
    const p3 = await page.evaluate(() => BT.shot.client(document.querySelector('#tpEditLoc svg.court'), 0.5, 0.9));
    await page.mouse.click(p3.x, p3.y);
    g2 = await T.game(page);
    T.ok(g2.court === 'mini' && BT_hasLoc(g2.events.find((x) => x.id === e.id)), '場所を付けると、試合のコートは mini');
    await page.evaluate(() => BT.ui.closeSheet());
    T.ok(C.errors.length === 0, 'ページのエラーなし', C.errors);
    await C.ctx.close();

    // 画面の大きさ（全部オン・15人）
    T.section('画面の大きさ（全部オン・15人）');
    for (const [vp, scheme] of [[{ width: 320, height: 568 }, 'light'], [{ width: 390, height: 844 }, 'light'], [{ width: 390, height: 844 }, 'dark'], [{ width: 844, height: 390 }, 'light'], [{ width: 820, height: 1180 }, 'light'], [{ width: 1180, height: 820 }, 'dark']]) {
      const name = `${vp.width}×${vp.height}${scheme === 'dark' ? '（暗い）' : ''}`;
      const P = await T.open(browser, srv.url, vp, { scheme });
      await T.start(P.page, VID, { name: 'ミライ', opp: 'ヒガシ', nos: '4-18' });
      await T.seek(P.page, 12); await P.page.click('[data-type="fg2"]'); await P.page.click('[data-no="7"]');
      await T.seek(P.page, 20); await P.page.click('[data-opp="3"]');
      await T.seek(P.page, 30); await P.page.click('[data-no="10"]'); await P.page.click('[data-type="fg3x"]');
      await T.seek(P.page, 35); await P.page.click('[data-type="oreb"]');
      await P.page.evaluate(() => { document.querySelectorAll('#toasts .toast').forEach((x) => x.remove()); });
      const r = await P.page.evaluate(() => {
        const pane = document.querySelector('#scPane-tap'), pr = pane.getBoundingClientRect();
        const btns = Array.from(pane.querySelectorAll('button')).filter((b) => b.offsetParent);
        const bad = [];
        const check = () => btns.forEach((b) => {
          const r = b.getBoundingClientRect();
          if (r.height < 39.5) bad.push(['低い', b.id || b.dataset.type || b.dataset.no || b.dataset.opp, Math.round(r.height)]);
          if (r.left < pr.left - 0.5 || r.right > pr.right + 0.5) bad.push(['横にはみ出す', b.id || b.dataset.type || b.dataset.no]);
          if (b.scrollWidth > b.clientWidth + 1 && !b.classList.contains('tp-lastmain')) bad.push(['文字が切れる', b.id || b.dataset.type || b.dataset.no, b.scrollWidth, b.clientWidth]);
        });
        check();
        // 全部のボタンが、上か下までなぞれば押せる（下の帯に隠れたままのものがない）
        const hit = (b) => { const r = b.getBoundingClientRect(); const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return el && (el === b || b.contains(el)); };
        const seen = new Set();
        pane.scrollTop = 0; btns.forEach((b) => { if (hit(b)) seen.add(b); });
        pane.scrollTop = pane.scrollHeight; btns.forEach((b) => { if (hit(b)) seen.add(b); });
        const hidden = btns.filter((b) => !seen.has(b)).map((b) => b.id || b.dataset.type || b.dataset.no || b.dataset.opp);
        pane.scrollTop = 0;
        const bar = document.querySelector('#tpLastBar').getBoundingClientRect();
        return { hscroll: document.documentElement.scrollWidth > innerWidth + 1, bad, hidden, n: btns.length, barIn: bar.top >= pr.top && bar.bottom <= Math.min(pr.bottom, innerHeight) + 0.5, scroll: pane.scrollHeight - pane.clientHeight, low: document.querySelector('#tpRoot').classList.contains('tp-low') };
      });
      T.ok(!r.hscroll && !r.bad.length && !r.hidden.length && r.barIn, `${name}：はみ出さない・ボタンは 40px 以上・文字が切れない・全部押せる・下の帯が見える（ボタン ${r.n}・すべる ${r.scroll}px${r.low ? '・低い画面の並べ方' : ''}）`, r);
      if (vp.width === 390) T.ok(r.scroll <= 1, `${name}：15人でも、すべらせずに全部`, r.scroll);
      await T.shot(P.page, `tap-${vp.width}x${vp.height}-${scheme}`);
      // 選びかけ
      await P.page.click('[data-type="fg2"]');
      const hv = await P.page.evaluate(() => { const e = document.querySelector('#tpHint'); const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.bottom <= innerHeight && document.querySelector('#tpCancel').getBoundingClientRect().right <= innerWidth; });
      T.ok(hv, `${name}：選びかけ（2P → 番号は？・やめる）が見える`);
      await T.shot(P.page, `tap-${vp.width}x${vp.height}-${scheme}-pick`);
      T.ok(P.errors.length === 0, `${name}：ページのエラーなし`, P.errors);
      await P.ctx.close();
    }
  } catch (err) { T.failed(err); } finally { await close(); }
  T.done();
})();
function BT_hasLoc(e) { return !!e && typeof e.x === 'number' && typeof e.y === 'number'; }
