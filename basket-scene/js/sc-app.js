/* バスケ シーン — 画面の土台（ホーム・動画つきの作業の画面・タブ・設定の入れ物）
   考え方：動画を選んだら、あとは 1 つの画面。上に動画、下（横長の画面では右）にタブ「① 記録」「② 場面」「③ スタッツ」。
   記録の時刻は、いつも「動画の時刻」。だから、記録したものは、そのまま場面（切り出し）になる。
   「試合を終える」「動画を選び直す」「時刻を合わせる」は、ない。

   ■ パネル（タブの中身）とのやりとり — js/sc-tap.js・js/sc-scenes.js・js/sc-stats.js は、これだけを使う
     SC.app.S                     { view: 'home'|'work', game, prefs, media, file, tab }（game は BT の記録の形。mode: 'video'）
     SC.app.now()                 動画のいまの時刻（秒・0.1 まで）。動画がないときは、前に見ていた所
     SC.app.dur()                 動画の長さ（秒。分からなければ 0）
     SC.app.hasVideo()            動画がつながっていて、再生できるか
     SC.app.seek(t, play)         その時刻へ（Promise）。play が true なら、そのまま再生
     SC.app.play() / pause() / toggle()
     SC.app.playRange(t0, t1, { loop })   t0 から再生して t1 で止める。Promise → 'end'（最後まで）| 'stop'（途中でやめた）| 'novideo'
     SC.app.stopRange()           playRange をやめる（動画は止めない）
     SC.app.save()                S.game を保存して、'change' を知らせる（記録を足した・直した・消したあとに呼ぶ）
     SC.app.savePrefs()           S.prefs を保存して、'prefs' を知らせる
     SC.app.setTab(id, arg)       タブを切りかえる（'tap' | 'scenes' | 'stats'）。arg は、そのパネルの show(arg) に渡る
     SC.app.on(name, fn)          'time'(t)・'play'・'pause'・'media'(つながったか)・'change'・'prefs'・'team'(背番号・名前・色を変えた)・'tab'(id)・'range'(いまの区間 | null)・'open'(試合を開いた)
     SC.app.ui.noGrid(get, set)   背番号をタップで入れたり外したりするマス → { el, draw }（get()：いま選んでいる番号 / set(list)：変えたあとの番号）
     SC.app.panel(id, def)        パネルを登録する：{ mount(el), show(arg), hide(), badge() → 文字 | '' }
                                  mount は、作業の画面を作るたびに呼ばれる（el は毎回新しい。中身を作り直す）
     SC.app.settings(def)         設定の節を登録する：{ id, title, order, render(box, redraw) }（redraw()：設定の小窓を描き直す）
     SC.app.openSettings(id)      設定を開く（id の節まで動かす）
     SC.app.pickVideo()           動画を選んでもらう（作業の画面では、いまの試合につなぐ）
     SC.app.wide()                横に並べる広い画面か（動画が左・タブが右）
     SC.app.S.overlay             画面いっぱいに重ねた画面（反省会の画面など）を開いているあいだ、その「閉じる」関数を入れておく（閉じたら null）。
                                  ブラウザの「戻る」で、ホームへ行かずに、それを閉じる */
(function (root) {
  'use strict';
  const BT = root.BT, BS = root.BS;
  const SC = root.SC = root.SC || {};
  const { h, $, $$ } = BT.ui;
  SC.APP = 'バスケ シーン';
  BS.APP = SC.APP;          // 切り出しの部品（js/lib/export.js）が、書き出す動画の終わりの札に出す名前
  SC.TAGLINE = '動画を見ながら記録 → 場面 → スタッツ';

  const bus = BS.emitter();
  const S = { view: 'home', game: null, prefs: SC.store.prefs(), media: null, file: null, tab: 'tap', W: null, guarded: false, overlay: null };
  const panels = {};
  const sections = [];
  const TABS = [['tap', '①', '記録'], ['scenes', '②', '場面'], ['stats', '③', 'スタッツ']];
  const RATES = [1, 0.5, 0.25, 2];
  const r1 = (v) => Math.round(v * 10) / 10;
  const fmt = BT.fmtTime;
  const on = bus.on, emit = bus.emit;

  /* ---------- 動画 ---------- */
  const hasVideo = () => !!(S.media && S.media.ready);
  const now = () => (hasVideo() ? r1(S.media.time) : (S.game && S.game.rvPos) || 0);
  const dur = () => (hasVideo() ? S.media.duration : (S.game && S.game.src && S.game.src.duration) || 0);
  const wide = () => root.innerWidth >= 900 || (root.innerWidth >= 640 && root.innerWidth > root.innerHeight * 1.2);
  let range = null;          // いま再生している区間 { t0, t1, loop, armed, resolve }

  function seek(t, play) {
    if (!hasVideo()) { if (S.game) S.game.rvPos = Math.max(0, r1(t)); emit('time', now()); return Promise.resolve(); }
    return S.media.seek(BT.clamp(t, 0, Math.max(0, dur() - 0.05))).then(() => { if (play && S.media) return S.media.play(); return undefined; });
  }
  function play() { if (hasVideo()) return S.media.play(); return Promise.resolve(); }
  function pause() { if (S.media) S.media.pause(); }
  function toggle() {
    if (!hasVideo()) { pickVideo(); return; }
    stopRange();
    if (S.media.paused) S.media.play(); else S.media.pause();
  }
  function playRange(t0, t1, opts) {
    stopRange();
    return new Promise((resolve) => {
      if (!hasVideo()) { resolve('novideo'); return; }
      const R = range = { t0: Math.max(0, t0), t1: Math.min(t1, dur() || t1), loop: !!(opts && opts.loop), armed: false, resolve };
      emit('range', R);
      S.media.seek(R.t0).then(() => { if (range !== R) return; R.armed = true; S.media.play(); });
    });
  }
  function stopRange() {
    const R = range;
    if (!R) return;
    range = null;
    R.resolve('stop');
    emit('range', null);
  }
  function rangeTick(t) {
    const R = range;
    if (!R || !R.armed) return;
    if (t >= R.t1 - 0.03 || S.media.el.ended) {
      if (R.loop) { R.armed = false; S.media.seek(R.t0).then(() => { if (range === R) { R.armed = true; S.media.play(); } }); return; }
      range = null;
      S.media.pause();
      R.resolve('end');
      emit('range', null);
    }
  }
  function detach() {
    stopRange();
    if (S.media) { try { S.media.destroy(); } catch (e) { /* 無視 */ } }
    S.media = null; S.file = null;
  }
  /* 動画をつなぐ（いまの試合に） */
  function attach(file) {
    const g = S.game;
    if (!g || !file) return;
    detach();
    const m = S.media = BS.createVideoMedia(file);
    S.file = file;
    m.on('ready', (info) => {
      if (S.media !== m) return;
      const src = g.src = g.src || {};
      const first = !src.duration;
      // 前に記録した動画と長さがちがうときは、知らせる（記録の時刻は、動画の時刻なので）
      if (!first && Math.abs(src.duration - info.duration) > 1.5) BT.ui.toast(`前に記録した動画（${src.name || '？'}・${fmt(src.duration)}）と長さがちがいます。場面の時刻が合わないかもしれません`, 'warn', 7000);
      else Object.assign(src, { name: file.name || src.name || '', size: file.size || src.size || null, duration: r1(info.duration), w: info.width, h: info.height });
      if (g.videos && g.videos[0] && g.videos[0].file && first) Object.assign(g.videos[0], { duration: r1(info.duration), w: info.width, h: info.height });
      SC.store.saveGame(g);
      const at = Math.min(g.rvPos || 0, Math.max(0, info.duration - 0.2));
      m.seek(at).then(() => { emit('media', true); drawWork(); });
    });
    m.on('time', (t) => { rangeTick(t); drawTime(); emit('time', r1(t)); });
    m.on('play', () => { drawPlay(); emit('play'); });
    m.on('pause', () => { drawPlay(); if (S.game) { S.game.rvPos = now(); } emit('pause'); });
    m.on('ended', () => { drawPlay(); });
    m.on('rate', drawPlay);
    m.on('notice', (text) => BT.ui.toast(text, 'warn', 5000));
    m.on('error', () => {
      if (S.media !== m) return;
      BT.ui.toast('この動画は、このブラウザでは再生できませんでした。MP4（iPhone・多くのカメラの形）でためしてください', 'err', 9000);
      detach();
      emit('media', false);
      drawWork();
    });
    const W = S.W;
    if (W) { W.stage.innerHTML = ''; W.stage.append(m.el, h('p', { class: 'sc-loading' }, '動画を読み込んでいます…')); }
    m.el.setAttribute('playsinline', '');
    m.el.addEventListener('click', toggle);
  }
  /* 動画を選んでもらう。作業の画面では、いまの試合につなぐ。ホームでは、試合を作る（同じ動画の試合があれば、続きを聞く） */
  function pickVideo() {
    const old = document.getElementById('scFile');
    if (old) old.remove();
    const inp = h('input', { type: 'file', id: 'scFile', accept: 'video/*,.mp4,.mov,.m4v,.webm', hidden: true });
    inp.addEventListener('change', () => { const f = inp.files && inp.files[0]; inp.remove(); if (f) gotVideo(f); });
    document.body.append(inp);
    inp.click();
  }
  function gotVideo(file) {
    if (S.view === 'work' && S.game) { attach(file); return; }
    const id = SC.store.findBySrc(file);          // （見本の試合は、findBySrc が外す）
    const g = id ? SC.store.loadGame(id) : null;
    if (!g) { newGameSheet(file); return; }
    const sum = BT.summary(g);
    const s = BT.ui.sheet({
      title: 'この動画で記録した試合があります',
      body: h('div', { class: 'sc-form' },
        h('p', null, `${g.date}　${sum.names[0]} ${sum.score[0]} − ${sum.score[1]} ${sum.names[1]}（${sum.n}件の記録）`),
        h('p', { class: 'note' }, '続きから記録したり、場面・スタッツを見たりできます。')),
      foot: [h('button', { class: 'btn', id: 'scNewAnyway', onclick: () => { s.close(); newGameSheet(file); } }, '新しい試合として記録する'),
        h('button', { class: 'btn primary', id: 'scResume', onclick: () => { s.close(); openGame(g, file); } }, '続きを開く')]
    });
  }

  /* ---------- 試合を作る ---------- */
  function createGame(file, t) {
    const mine = { name: t.name, color: t.color || '#2f6fed', colorName: t.colorName || '青', players: t.players };
    const oc = mine.color.toLowerCase() === '#d93636' ? { color: '#2f6fed', colorName: '青' } : { color: '#d93636', colorName: '赤' };
    const g = BT.newGame({ teams: [mine, Object.assign({ name: t.opp || '', players: [] }, oc)] });
    const t0 = Date.now();
    Object.assign(g, { mode: 'video', startedAt: t0, date: BT.ymdAt(t0, g.tz), rvPos: 0,
      src: { name: file ? file.name : '', size: file ? file.size || null : null, duration: null, w: null, h: null } });
    BT.addEvent(g, { t: 0, type: 'period', period: 1 });
    // もとの「バスケ タップ記録」でも、同じ動画なら時刻あわせなしで開けるように
    g.videos = [{ vid: 'file1', n: 1, startedAt: t0, endedAt: null, duration: null, name: file ? file.name : '', mime: file ? file.type || '' : '', w: null, h: null, bytes: file ? file.size || null : null, status: 'done', gone: true, file: true }];
    return g;
  }
  /* 背番号を、タップで入れたり外したりするマス（0・00・1〜30。「31〜99 も出す」で 99 まで。選んでいる 31 以上は、いつも出す）
     get()：いま選んでいる番号の並び / set(list)：変えたあとの番号の並び（番号の順）。draw()：get() を読みなおして描く */
  let noMore = false;
  function noGrid(get, set) {
    const grid = h('div', { class: 'sc-nogrid', id: 'scNoGrid', role: 'group', 'aria-label': '背番号を選ぶ' });
    const more = h('button', { type: 'button', class: 'linkbtn', id: 'scNoMore', onclick: () => { noMore = !noMore; draw(); } });
    function draw() {
      const on = new Set(get());
      const shown = ['0', '00'].concat(Array.from({ length: noMore ? 99 : 30 }, (_, k) => String(k + 1)));
      on.forEach((no) => { if (!shown.includes(no)) shown.push(no); });
      grid.innerHTML = '';
      BT.sortNos(shown).forEach((no) => grid.append(h('button', { type: 'button', class: 'sc-nb' + (on.has(no) ? ' on' : ''), dataset: { no }, 'aria-pressed': on.has(no) ? 'true' : 'false',
        onclick: () => { const cur = new Set(get()); if (cur.has(no)) cur.delete(no); else cur.add(no); set(BT.sortNos(Array.from(cur))); draw(); } }, no)));
      more.textContent = noMore ? '31〜99 をかくす' : '31〜99 も出す';
    }
    draw();
    return { el: h('div', { class: 'sc-nogridbox' }, grid, more), draw };
  }
  /* 新しい試合：自分のチームの名前と背番号だけ（前の試合のものが入っている）。相手は名前だけ（なくてもよい） */
  function newGameSheet(file) {
    const last = SC.store.team() || { name: '', color: '#2f6fed', colorName: '青', players: [] };
    const name = h('input', { type: 'text', id: 'scTeamName', maxlength: 20, placeholder: '例：致遠館', value: last.name || '', autocomplete: 'off' });
    const nos = h('input', { type: 'text', id: 'scTeamNos', inputmode: 'text', placeholder: '例：4-15　または　4 5 7 8 10', value: BT.formatNumbers((last.players || []).map((p) => p.no)), autocomplete: 'off' });
    const opp = h('input', { type: 'text', id: 'scOppName', maxlength: 20, placeholder: '（なくてもよい）', autocomplete: 'off' });
    const count = h('small', { class: 'note', id: 'scNosCount' });
    const drawCount = () => { const n = BT.parseNumbers(nos.value).length; count.textContent = n ? `${n}人` : '背番号がなくても始められます（あとで足せます）'; };
    /* タップで選ぶマス（文字の欄・一括ボタンと、いつも同じ番号を指す） */
    const grid = noGrid(() => BT.parseNumbers(nos.value), (list) => { nos.value = BT.formatNumbers(list); drawCount(); });
    const draw = () => { drawCount(); grid.draw(); };
    nos.addEventListener('input', draw);
    const preset = (txt, lab) => h('button', { class: 'btn small', dataset: { preset: txt }, onclick: () => { nos.value = txt; draw(); } }, lab);
    const start = () => {
      const players = BT.playersFromNos(BT.parseNumbers(nos.value), last.players);
      const t = { name: name.value.trim(), color: last.color, colorName: last.colorName, players, opp: opp.value.trim() };
      SC.store.saveTeam(t);
      s.close();
      openGame(createGame(file, t), file);
    };
    const s = BT.ui.sheet({
      title: '記録する試合',
      body: h('div', { class: 'sc-form' },
        h('p', { class: 'sc-picked' }, '🎬 ', h('b', null, file ? file.name : '動画')),
        h('label', { class: 'field' }, h('span', null, '自分のチームの名前'), name),
        h('div', { class: 'field' }, h('span', null, '自分のチームの背番号（タップで選ぶ）'), h('div', { class: 'row' }, preset('4-15', '4〜15'), preset('4-18', '4〜18'), preset('', '全部はずす'), count), grid.el,
          h('label', { class: 'sc-nostext' }, h('small', null, '文字で入れてもかまいません'), nos)),
        h('label', { class: 'field' }, h('span', null, '相手の名前'), opp),
        h('p', { class: 'note' }, '相手は、得点（1・2・3点）だけを記録します。名前・背番号・記録するものは、あとで ⚙ 設定から直せます。')),
      foot: [h('button', { class: 'btn', onclick: () => s.close() }, 'やめる'), h('button', { class: 'btn primary', id: 'scStart', onclick: start }, '▶ 記録をはじめる')]
    });
    draw();
  }

  /* ---------- 保存 ---------- */
  function save() {
    const g = S.game;
    if (!g) return;
    g.updatedAt = Date.now();
    if (hasVideo()) g.rvPos = now();
    if (!SC.store.saveGame(g) && !S.saveWarned) {
      S.saveWarned = true;
      BT.ui.toast('このブラウザに記録を保存できませんでした（保存場所がいっぱい・プライベートブラウズ など）。⚙ 設定の「データ」から、ファイルに書き出してください', 'err', 10000);
    }
    emit('change');
  }
  function savePrefs() { SC.store.savePrefs(S.prefs); applyTheme(); emit('prefs'); }
  function applyTheme() {
    const t = S.prefs.theme;
    if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme;
  }

  /* ---------- 画面の切りかえ ---------- */
  function guard() { if (S.guarded || !root.history || !history.pushState) return; history.pushState({ sc: 1 }, ''); S.guarded = true; }
  function goHome() {
    if (S.game) save();
    detach();
    BT.ui.closeSheet(true);
    BT.ui.keepAwake(false);
    S.game = null; S.W = null; S.view = 'home';
    if (S.guarded && root.history) { S.guarded = false; S.skipPop = true; try { history.back(); } catch (e) { S.skipPop = false; } }
    renderHome();
  }
  /* 試合を開く。file があれば、その動画をつなぐ。なければ、スタッツから（動画は、あとで選べる） */
  function openGame(g, file) {
    detach();
    BT.ui.closeSheet(true);
    S.game = g;
    S.view = 'work';
    S.tab = file ? 'tap' : (g.events.some((e) => e.type !== 'period') ? 'stats' : 'tap');
    SC.store.saveGame(g);
    buildWork();
    guard();
    BT.ui.keepAwake(true);
    emit('open');
    if (file) attach(file);
    setTab(S.tab);
  }

  /* ========== ホーム ========== */
  function renderHome() {
    document.body.dataset.view = 'home';
    const V = $('#view');
    V.innerHTML = '';
    const list = SC.store.games().filter((g) => !g.demo);          // 見本の試合（js/sc-demo.js）は、一覧に出さない
    const row = (g) => h('button', { class: 'sc-game', dataset: { id: g.id }, onclick: () => { const game = SC.store.loadGame(g.id); if (game) openGame(game, null); else { BT.ui.toast('この試合の記録が見つかりませんでした', 'err'); renderHome(); } } },
      h('span', { class: 'when' }, g.date),
      h('span', { class: 'vs' }, (g.names || [])[0], h('b', null, ` ${(g.score || [0, 0])[0]} − ${(g.score || [0, 0])[1]} `), (g.names || [])[1]),
      h('small', { class: 'note' }, `${g.n || 0}件の記録${g.src && g.src.name ? '・' + g.src.name : ''}`),
      h('span', { class: 'arr', 'aria-hidden': 'true' }, '›'));
    V.append(
      h('header', { class: 'hbar' },
        h('div', { class: 'brand' }, h('span', { class: 'logo', 'aria-hidden': 'true' }, '🏀'), h('div', null, h('b', null, SC.APP), h('small', null, SC.TAGLINE))),
        h('button', { class: 'btn icon', id: 'scHomeSettings', 'aria-label': '設定', onclick: () => openSettings() }, '⚙')),
      h('main', { class: 'home' },
        h('button', { class: 'sc-hero', id: 'scPick', onclick: pickVideo },
          h('span', { class: 'mi', 'aria-hidden': 'true' }, '🎬'),
          h('span', { class: 'mt' }, h('b', null, '試合の動画を選ぶ'), h('small', null, '選んだら、動画を見ながらタップで記録。場面とスタッツが、そのままできます'))),
        h('ol', { class: 'sc-steps', 'aria-label': '使い方の流れ' },
          h('li', null, h('b', null, '① 記録'), h('span', null, '動画を止めたり戻したりしながら、プレーと背番号をタップ')),
          h('li', null, h('b', null, '② 場面'), h('span', null, '記録した場面が、もう並んでいます。選手ごと・プレーごとに見る・1本の動画にする')),
          h('li', null, h('b', null, '③ スタッツ'), h('span', null, '成功率・選手ごとの数。反省会で、みんなで見られる画面も'))),
        h('div', { id: 'scHomeExtra' }),
        list.length ? h('section', { class: 'card' }, h('h2', null, 'これまでの試合'), h('div', { class: 'sc-games', id: 'scGames' }, list.map(row)),
          h('p', { class: 'note' }, '押すと、スタッツが開きます。場面を見るときは、同じ動画をもう一度選びます（動画の中身は、保存していません）。')) : null,
        h('div', { class: 'row center' }, h('button', { class: 'linkbtn', id: 'scImport', onclick: importFile }, '📂 記録のファイル（.json）を開く')),
        h('p', { class: 'note center' }, '🔒 記録は、この端末のブラウザの中に保存します。動画は、どこにも送りません。')));
    emit('home');
    root.scrollTo(0, 0);
  }
  async function importFile() {
    const f = await BT.ui.pickText();
    if (!f) return;
    try {
      const g = BT.importData(f.text);
      if (!BT.isReview(g)) throw new Error('試合を見ながら記録したファイルです（記録の時刻が、動画の時刻ではありません）。もとの「バスケ タップ記録」で開いてください');
      if (SC.store.loadGame(g.id)) g.id = BT.uid('g');
      openGame(g, null);
      BT.ui.toast('記録のファイルを開きました', 'ok');
    } catch (e) { BT.ui.toast('開けませんでした：' + e.message, 'err', 8000); }
  }

  /* ========== 作業の画面（動画＋タブ） ========== */
  function buildWork() {
    document.body.dataset.view = 'work';
    const V = $('#view');
    V.innerHTML = '';
    const W = S.W = {};
    W.score = h('button', { class: 'sc-score', id: 'scScore', 'aria-label': '得点', onclick: () => setTab('stats') });
    W.period = h('button', { class: 'sc-period', id: 'scPeriod', 'aria-label': 'ピリオド', onclick: openPeriod }, '1Q');
    W.bar = h('header', { class: 'sc-bar' },
      h('button', { class: 'btn icon', id: 'scHome', 'aria-label': 'ホームへ', onclick: goHome }, '🏠'),
      W.score, W.period,
      h('button', { class: 'btn icon', id: 'scSettings', 'aria-label': '設定', onclick: () => openSettings() }, '⚙'));
    W.stage = h('div', { class: 'sc-stage', id: 'scStage' });
    W.fill = h('i', { class: 'fill' });
    W.marks = h('div', { class: 'marks' });
    W.thumb = h('i', { class: 'thumb' });
    W.seek = h('div', { class: 'sc-seek', id: 'scSeek', role: 'slider', tabindex: '0', 'aria-label': '動画の位置（指でなぞって動かす）' }, W.marks, W.fill, W.thumb);
    W.time = h('span', { class: 'sc-time', id: 'scTime' }, '0:00 / 0:00');
    const tb = (id, label, aria, fn, cls) => h('button', { class: 'sc-tb' + (cls ? ' ' + cls : ''), id, 'aria-label': aria, title: aria, onclick: fn }, label);
    W.playBtn = tb('scPlay', '▶', '再生・一時停止', toggle, 'play');
    W.rate = tb('scRate', '×1', '再生の速さ（×1・×0.5・×0.25・×2）', nextRate, 'rate');
    W.ctl = h('div', { class: 'sc-ctl' },
      tb('scBack', '−5', '5秒もどる', () => step(-5)), tb('scPrevF', '◀', '1コマもどる', () => step(-1 / 30), 'fr'),
      W.playBtn,
      tb('scNextF', '▶', '1コマすすむ', () => step(1 / 30), 'fr'), tb('scFwd', '+5', '5秒すすむ', () => step(5)), W.rate, W.time);
    W.video = h('section', { class: 'sc-video', 'aria-label': '動画' }, W.stage, W.seek, W.ctl);
    W.tabs = h('nav', { class: 'sc-tabs', role: 'tablist', 'aria-label': '記録・場面・スタッツ' }, TABS.map(([id, n, label]) =>
      h('button', { class: 'sc-tab', id: 'scTab-' + id, role: 'tab', dataset: { tab: id }, onclick: () => setTab(id) }, h('i', null, n), h('b', null, label), h('small', { class: 'bdg', hidden: true }))));
    W.panes = {};
    W.panel = h('div', { class: 'sc-panel' }, TABS.map(([id]) => (W.panes[id] = h('section', { class: 'sc-pane', id: 'scPane-' + id, role: 'tabpanel', dataset: { pane: id }, hidden: true }))));
    W.side = h('div', { class: 'sc-side' }, W.tabs, W.panel);
    W.root = h('div', { class: 'sc-work', id: 'scWork' }, W.bar, W.video, W.side);
    V.append(W.root);
    seekEvents(W.seek);
    TABS.forEach(([id]) => { const p = panels[id]; if (p && p.mount) { try { p.mount(W.panes[id]); } catch (e) { console.error('[panel mount]', id, e); } } });
    drawWork();
    root.scrollTo(0, 0);
  }
  /* 動画の所・上の帯・タブの数字を、いまの状態に合わせる */
  function drawWork() {
    const W = S.W, g = S.game;
    if (!W || !g) return;
    const sc = BT.score(g);
    W.score.innerHTML = '';
    W.score.append(h('span', { class: 'tn' }, BT.teamName(g, 0)), h('b', null, `${sc[0]} − ${sc[1]}`), h('span', { class: 'tn' }, BT.teamName(g, 1)));
    W.period.textContent = BT.periodLabel(BT.periodAt(g, now()));
    if (!S.media) {
      W.stage.innerHTML = '';
      W.stage.append(h('div', { class: 'sc-novideo', id: 'scNoVideo' },
        h('button', { class: 'btn primary', id: 'scPickHere', onclick: pickVideo }, '🎬 この試合の動画を選ぶ'),
        g.src && g.src.name ? h('p', null, `記録した動画：${g.src.name}${g.src.duration ? `（${fmt(g.src.duration)}）` : ''}`) : null,
        h('p', { class: 'small' }, 'スタッツは、動画がなくても見られます。記録・場面は、同じ動画を選ぶと続きからできます。')));
    } else if (hasVideo()) {
      const l = W.stage.querySelector('.sc-loading');
      if (l) l.remove();
    }
    W.ctl.classList.toggle('off', !hasVideo());
    drawMarks();
    drawTime();
    drawPlay();
    drawBadges();
  }
  function drawBadges() {
    const W = S.W;
    if (!W) return;
    TABS.forEach(([id]) => {
      const el = W.tabs.querySelector(`#scTab-${id} .bdg`);          // （W.root にも data-tab が付くので、id で選ぶ）
      let t = '';
      try { t = panels[id] && panels[id].badge ? panels[id].badge() || '' : ''; } catch (e) { t = ''; }
      el.textContent = t; el.hidden = !t;
    });
  }
  function drawPlay() {
    const W = S.W;
    if (!W) return;
    const playing = hasVideo() && !S.media.paused && !S.media.el.ended;
    W.playBtn.textContent = playing ? '⏸' : '▶';
    W.playBtn.classList.toggle('on', playing);
    const r = S.media ? S.media.rate : 1;
    W.rate.textContent = '×' + r;
    W.rate.classList.toggle('on', r !== 1);
  }
  function drawTime() {
    const W = S.W, g = S.game;
    if (!W || !g) return;
    const t = now(), d = dur();
    W.time.textContent = `${fmt(t)} / ${fmt(d)}`;
    const p = d > 0 ? BT.clamp(t / d, 0, 1) * 100 : 0;
    W.fill.style.width = p + '%';
    W.thumb.style.left = p + '%';
    const per = BT.periodLabel(BT.periodAt(g, t));
    if (W.period.textContent !== per) W.period.textContent = per;
  }
  /* 位置のバーの印：自分の記録（チームの色）・相手の得点（灰色）・ピリオドの始まり（たての線） */
  function drawMarks() {
    const W = S.W, g = S.game;
    if (!W || !g) return;
    const d = dur();
    W.marks.innerHTML = '';
    if (!(d > 0)) return;
    g.events.forEach((e) => {
      if (e.t > d) return;
      const cls = e.type === 'period' ? 'per' : e.team === 1 ? 'opp' : 'me';
      if (e.type === 'period' && e.t <= 0) return;
      W.marks.append(h('i', { class: cls, style: { left: (e.t / d) * 100 + '%' } }));
    });
  }
  function step(d) { if (!hasVideo()) return; stopRange(); if (Math.abs(d) < 1) S.media.pause(); seek(S.media.time + d); }
  function nextRate() { if (!hasVideo()) return; const i = RATES.indexOf(S.media.rate); S.media.rate = RATES[(i + 1) % RATES.length]; drawPlay(); }
  function seekEvents(bar) {
    let drag = false;
    const at = (e) => { const r = bar.getBoundingClientRect(); return BT.clamp((e.clientX - r.left) / Math.max(1, r.width), 0, 1) * dur(); };
    const move = (e) => { if (!drag || !hasVideo()) return; S.media.el.currentTime = at(e); drawTime(); };
    bar.addEventListener('pointerdown', (e) => {
      if (!hasVideo()) return;
      drag = true; stopRange();
      try { bar.setPointerCapture(e.pointerId); } catch (err) { /* 無視 */ }
      move(e);
    });
    bar.addEventListener('pointermove', move);
    const up = () => { if (!drag) return; drag = false; if (S.game) S.game.rvPos = now(); emit('time', now()); };
    bar.addEventListener('pointerup', up);
    bar.addEventListener('pointercancel', up);
    bar.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') { e.preventDefault(); step(-5); } else if (e.key === 'ArrowRight') { e.preventDefault(); step(5); } });
  }
  function setTab(id, arg) {
    const W = S.W;
    if (!W || !panels[id]) return;
    const prev = S.tab;
    if (prev !== id && panels[prev] && panels[prev].hide) { try { panels[prev].hide(); } catch (e) { console.error('[panel hide]', prev, e); } }
    S.tab = id;
    TABS.forEach(([k]) => {
      W.panes[k].hidden = k !== id;
      const b = W.tabs.querySelector(`#scTab-${k}`);
      b.classList.toggle('on', k === id);
      b.setAttribute('aria-selected', k === id ? 'true' : 'false');
    });
    W.root.dataset.tab = id;
    if (panels[id].show) { try { panels[id].show(arg); } catch (e) { console.error('[panel show]', id, e); } }
    emit('tab', id);
  }

  /* ---------- ピリオド（動画のいまの時刻から、次のピリオド） ---------- */
  function openPeriod() {
    const g = S.game;
    pause();
    const t = now(), cur = BT.periodAt(g, t);
    const add = (p) => { BT.addEvent(g, { t, type: 'period', period: p }); save(); s.close(); BT.ui.toast(`${BT.periodLabel(p)} を、動画の ${fmt(t)} からにしました`, 'ok'); };
    const starts = BT.sorted(g).filter((e) => e.type === 'period');
    const s = BT.ui.sheet({
      title: `ピリオド（いまは ${BT.periodLabel(cur)}）`,
      body: h('div', { class: 'sc-form' },
        h('button', { class: 'btn primary huge', id: 'scNextPeriod', onclick: () => add(cur + 1) }, `ここから ${BT.periodLabel(cur + 1)}（動画の ${fmt(t)}）`),
        h('p', { class: 'note' }, '動画を、次のピリオドが始まる所まで動かしてから押します。それより後の記録が、そのピリオドになります。'),
        h('div', { class: 'sc-plist' }, starts.map((e) => h('div', { class: 'row' },
          h('button', { class: 'btn small', onclick: () => { s.close(); seek(e.t); } }, `${BT.periodLabel(e.period)}：${fmt(e.t)} から`),
          e.t > 0 ? h('button', { class: 'linkbtn', dataset: { delperiod: e.id }, onclick: () => { BT.removeEvent(g, e.id); save(); openPeriod(); } }, '消す') : null))))
    });
  }

  /* ========== 設定（節は、パネルも足せる） ========== */
  function settings(def) { const i = sections.findIndex((x) => x.id === def.id); if (i >= 0) sections[i] = def; else sections.push(def); }
  function openSettings(focus) {
    pause();
    const body = h('div', { class: 'settings sc-settings' });
    const redraw = () => openSettings(focus);
    sections.slice().sort((a, b) => (a.order || 50) - (b.order || 50)).forEach((sec) => {
      if (sec.when && !sec.when()) return;
      const box = h('section', { class: 'field sc-sec', id: 'scSec-' + sec.id }, h('span', null, sec.title));
      try { sec.render(box, redraw); } catch (e) { console.error('[settings]', sec.id, e); box.append(h('p', { class: 'note warn' }, 'この設定を出せませんでした')); }
      body.append(box);
    });
    const keep = (() => { const b = document.querySelector('#sheet .sheet-body'); return b && document.querySelector('#sheet .sc-settings') ? b.scrollTop : null; })();
    const s = BT.ui.sheet({ title: '設定', wide: true, body });
    if (keep != null) s.body.scrollTop = keep;
    else if (focus) { const el = document.getElementById('scSec-' + focus); if (el && el.scrollIntoView) el.scrollIntoView(); }
  }
  /* 設定の部品（パネルの設定の節でも使える） */
  const ui = {
    /* チェック：obj[key] を切りかえる。after は、切りかえたあと */
    noGrid,
    check(obj, key, label, after) {
      return h('label', { class: 'chk' }, h('input', { type: 'checkbox', dataset: { pref: key }, checked: !!obj[key], onchange: (e) => { obj[key] = e.target.checked; savePrefs(); if (after) after(); } }), label);
    },
    /* えらぶボタンの並び：[[値, 文字], …] */
    choice(cur, list, pick, name) {
      return h('div', { class: 'row', role: 'group' }, list.map(([v, lab]) => h('button', { class: 'btn small' + (cur === v ? ' on' : ''), 'aria-pressed': cur === v ? 'true' : 'false', dataset: { [name || 'choice']: String(v) }, onclick: () => pick(v) }, lab)));
    }
  };
  /* 土台が持つ設定：チーム・背番号／画面の色／データ */
  settings({ id: 'team', title: '👥 チーム・背番号', order: 10, when: () => !!S.game, render(box, redraw) {
    const g = S.game, t = g.teams[0];
    const changed = () => { SC.store.saveTeam(t); save(); drawWork(); emit('team'); };
    const name = h('input', { type: 'text', id: 'setTeamName', maxlength: 20, value: t.name || '', placeholder: '自分のチームの名前', onchange: (e) => { t.name = e.target.value.trim().slice(0, 20); changed(); } });
    /* 背番号：タップで選ぶマス・文字の欄・名前の欄は、いつも同じ名簿を指す。変えたら、その場で書き換える（小窓は閉じない） */
    const namesBox = h('div', { class: 'sc-nameswrap' });
    const drawNames = () => {
      namesBox.innerHTML = '';
      if (t.players.length) namesBox.append(h('div', { class: 'sc-names' }, t.players.map((p) => h('label', null, h('b', null, '#' + p.no), h('input', { type: 'text', maxlength: 12, value: p.name || '', placeholder: '名前', dataset: { pname: p.no }, onchange: (e) => { p.name = e.target.value.trim().slice(0, 12); changed(); } })))));
    };
    const setNos = (list) => { t.players = BT.playersFromNos(list, t.players); changed(); nos.value = BT.formatNumbers(t.players.map((p) => p.no)); drawNames(); grid.draw(); };
    const nos = h('input', { type: 'text', id: 'setTeamNos', value: BT.formatNumbers(t.players.map((p) => p.no)), placeholder: '例：4-15', onchange: (e) => setNos(BT.parseNumbers(e.target.value)) });
    const grid = noGrid(() => t.players.map((p) => p.no), setNos);
    const opp = h('input', { type: 'text', id: 'setOppName', maxlength: 20, value: g.teams[1].name || '', placeholder: '相手の名前', onchange: (e) => { g.teams[1].name = e.target.value.trim().slice(0, 20); save(); drawWork(); } });
    drawNames();
    box.append(h('label', { class: 'field' }, h('small', null, '自分のチーム'), name),
      h('div', { class: 'field' }, h('small', null, '背番号（タップで入れたり外したりできます）'), grid.el, h('label', { class: 'sc-nostext' }, h('small', null, '文字で入れてもかまいません（「4-15」「4 5 7」のように）'), nos)),
      namesBox,
      h('div', { class: 'row sc-colors', role: 'group', 'aria-label': 'チームの色' }, BT.COLORS.map((c) => h('button', { class: 'sw' + (t.color.toLowerCase() === c.hex ? ' on' : ''), 'aria-label': c.name, title: c.name, dataset: { color: c.name }, style: { background: c.hex }, onclick: () => { t.color = c.hex; t.colorName = c.name; changed(); redraw(); } }))),
      h('label', { class: 'field' }, h('small', null, '相手の名前'), opp));
  } });
  settings({ id: 'theme', title: '画面の色', order: 90, render(box, redraw) {
    box.append(ui.choice(S.prefs.theme, [['auto', '端末に合わせる'], ['light', '明るい'], ['dark', '暗い']], (v) => { S.prefs.theme = v; savePrefs(); redraw(); }, 'theme'));
  } });
  settings({ id: 'data', title: '💾 データ', order: 95, when: () => !!S.game, render(box) {
    const g = S.game, base = BT.fileBase(g);
    const out = async (name, blob) => { const r = await BT.ui.shareOrDownload(name, blob, BT.ui.canShareFiles()); if (r === 'downloaded') BT.ui.toast(`保存しました：${name}`, 'ok', 4000); };
    box.append(h('div', { class: 'row' },
      h('button', { class: 'btn small', id: 'setExpJson', onclick: () => out(base + '.json', new Blob([JSON.stringify(BT.exportData(g), null, 1)], { type: 'application/json' })) }, '🗂 記録のファイル（JSON）'),
      h('button', { class: 'btn small', id: 'setExpCsv', onclick: () => out(base + '_一覧.csv', new Blob(['﻿' + BT.eventsCSV(g)], { type: 'text/csv' })) }, '📋 記録の一覧（CSV）'),
      h('button', { class: 'btn small danger', id: 'setDelGame', onclick: () => BT.ui.confirm('この試合を消しますか？', `${g.date} ${BT.teamName(g, 0)} − ${BT.teamName(g, 1)} の記録を、この端末から消します。動画のファイルは消えません。`, '消す', () => { const id = g.id; S.game = null; SC.store.deleteGame(id); goHome(); BT.ui.toast('消しました', 'ok'); }, true) }, '🗑 この試合を消す')),
      h('p', { class: 'note' }, '記録のファイル（JSON）は、もとの「バスケ タップ記録」でも開けます。'));
  } });

  /* ---------- はじめ ---------- */
  function panel(id, def) { panels[id] = def; }
  function init() {
    applyTheme();
    document.addEventListener('touchstart', () => {}, { passive: true });
    root.addEventListener('popstate', () => {
      if (S.skipPop) { S.skipPop = false; return; }
      S.guarded = false;
      if (BT.ui.sheetOpen()) { BT.ui.closeSheet(); if (S.view === 'work') guard(); return; }
      if (S.overlay) { const f = S.overlay; S.overlay = null; try { f(); } catch (e) { /* 無視 */ } if (S.view === 'work') guard(); return; }
      if (S.view === 'work') goHome();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && BT.ui.sheetOpen()) { BT.ui.closeSheet(); return; }
      if (S.view !== 'work' || BT.ui.sheetOpen() || e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target && e.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === ' ') { e.preventDefault(); toggle(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); step(e.shiftKey ? -1 : -5); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); step(e.shiftKey ? 1 : 5); }
      else if (e.key === ',') step(-1 / 30);
      else if (e.key === '.') step(1 / 30);
    });
    on('change', () => { drawWork(); hintScenes(); });
    on('prefs', drawBadges);
    root.addEventListener('pagehide', () => { if (S.game) { if (hasVideo()) S.game.rvPos = now(); SC.store.saveGame(S.game); } });
    renderHome();
  }
  /* はじめの数回の記録のあと、1回だけ：「記録した場面は、② 場面で、すぐ見られます」 */
  function hintScenes() {
    const g = S.game;
    if (!g || S.prefs.hints.scenes || S.tab !== 'tap') return;
    if (g.events.filter((e) => e.type !== 'period').length < 3) return;
    S.prefs.hints.scenes = true;
    SC.store.savePrefs(S.prefs);
    BT.ui.toast('記録した場面は「② 場面」で、すぐ見られます', 'ok', 9000, { label: '見る', onClick: () => setTab('scenes') });
  }

  SC.app = { S, init, on, emit, now, dur, hasVideo, wide, seek, play, pause, toggle, playRange, stopRange, save, savePrefs, setTab, panel, settings, openSettings, pickVideo, ui,
    goHome, openGame, createGame, attach, renderHome, drawWork, fmt };
})(typeof window !== 'undefined' ? window : globalThis);
