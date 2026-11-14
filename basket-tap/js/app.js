/* バスケ タップ記録 — 画面
   ホーム（home）→ 試合の準備（setup：チーム名・色・背番号）→ 記録（live）→ 試合のページ（game：集計・書き出し・切り出し）→ 場面を切り出す（trim。js/trim.js）。
   どの画面からも「🏠 ホーム」に戻れる。記録は1つ押すたびに、この端末とクラウド（js/cloud.js）に残す。
   記録の画面は、いちど作ったら作り直さず、表示（数字・色・選んでいる番号）だけを書き換える
   （押している間にボタンが入れ替わると、Safari ではタップにならないため）。 */
(function (root) {
  'use strict';
  const BT = root.BT;
  const { h, $, $$ } = BT.ui;

  const S = {
    view: 'home',
    game: null,
    prefs: BT.store.prefs(),
    draft: null,            // 新しい試合の準備中のチーム { teams, title }
    setupFor: 'new',        // 'new'（新しい試合）| 'edit'（記録中の試合のチームを直す）
    more: [false, false],   // 準備：31〜99 の番号も出すか
    L: null,                // 記録の画面の要素
    redo: [],
    lastTap: { key: '', at: 0 },
    guarded: false
  };
  const now = () => Date.now();

  /* ---------- 小さな道具 ---------- */
  const teamColor = (tm) => (S.game ? S.game.teams[tm].color : '#888');
  // いまの時刻：ふつうはスタートからの時間。動画を見ながら記録するときは、動画の時刻（rvNow）
  const elapsed = () => (rvMode() ? rvNow() : BT.elapsed(S.game, now()));
  const curPeriod = () => BT.periodAt(S.game, elapsed());
  /* 試合時間（止められる時計。設定でオン）：スタートからの時間・動画の時刻とは別に、笛で止まる時計を持つ（試合ごとに game.gc。js/core.js の「試合時間」）。
     時計のある試合を、記録の途中で開いているときだけ出す（終えた試合には、あとから時計を作らない） */
  const clockOn = () => !!S.prefs.gameClock;
  const gcShown = () => !!(clockOn() && S.game && S.game.startedAt && (S.game.gc || !S.game.endedAt));
  function ensureClock(g) { if (!g.gc || !Array.isArray(g.gc.ev)) g.gc = BT.newClock(S.prefs.periodLen, BT.isReview(g)); return g.gc; }
  const gcNow = () => (gcShown() ? (ensureClock(S.game), BT.gameClock(S.game, elapsed())) : null);
  function save() {
    if (!S.game) return;
    if (rvReady() && S.rv.match) S.game.rvPos = rvNow();          // 動画を見ながら記録：見ていた所も覚えておく（続きを記録するとき。記録の動画と同じ長さの動画のときだけ）
    S.game.updatedAt = now();
    if (S.demoMode) S.game.demo = true;            // 使い方のデモの試合（クラウドに送らず、終わると消す）
    // 保存できないとき（プライベートブラウズ・空きがない）は、記録のたびに出さず、1回だけ知らせる
    if (!BT.store.saveGame(S.game) && !S.saveWarned) {
      S.saveWarned = true;
      BT.ui.toast('このブラウザに記録を保存できません（このサイトの小さな保存場所がいっぱい・プライベートブラウズ など。iPhone 本体の空きとは別）。' + (BT.cloud.enabled() ? 'クラウドには送っています。' : '') + '終わったら「書き出す」でファイルにも残してください', 'err', 10000);
    }
    BT.cloud.push(S.game);          // クラウドにも（記録の途中は、数秒ごとにまとめて）
    if (S.view === 'game') { clearTimeout(S.hubTimer); S.hubTimer = setTimeout(() => { if (S.view === 'game') renderGame(); }, 120); }
  }
  function applyTheme() {
    const t = S.prefs.theme;
    if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme;
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', getComputedStyle(document.body).getPropertyValue('--bg').trim() || '#0b0f17');
    if (S.L && S.L.rvBox) { rvColors(); rvDrawSeek(); }
  }
  function savePrefs() { BT.store.savePrefs(S.prefs); }
  function feel(kind) {
    BT.ui.haptic();
    if (S.prefs.sound) BT.ui.beep(kind === 'made' ? 1046 : kind === 'undo' ? 440 : 784, 55);
  }
  /* ボタンを光らせる（押せたことが目で分かるように） */
  function flash(el) {
    if (!el) return;
    el.classList.remove('hit');
    void el.offsetWidth;
    el.classList.add('hit');
  }

  /* ---------- 画面の切り替え ---------- */
  function go(view) {
    if (S.view === 'trim' && view !== 'trim' && BT.trim.active()) BT.trim.close();
    // 📊 これまでの集計から出るとき：開いたときに足した履歴（ブラウザの「戻る」でホームへ戻るためのもの）を戻しておく
    if (S.view === 'totals' && view !== 'totals' && S.guarded && root.history) { S.guarded = false; S.skipPop = true; try { history.back(); } catch (e) { S.skipPop = false; } }
    S.view = view;
    BT.ui.closeSheet(true);
    if (view !== 'live') { delete document.documentElement.dataset.rot; rvPause(); }
    if (view === 'home') rvRelease();
    if (view === 'home') renderHome();
    else if (view === 'setup') renderSetup();
    else if (view === 'live') buildLive();
    else if (view === 'game') renderGame();
    else if (view === 'totals') { BT.totals.open(); guard(); }      // 📊 これまでの集計（js/totals.js）。ブラウザの「戻る」でホームへ
    root.scrollTo(0, 0);
  }
  /* 試合を選ぶ（記録の画面・試合のページの前に） */
  function setGame(game) {
    if (S.game && S.game.id !== game.id && camOn()) camClose();
    if (S.rv && S.rv.gameId !== game.id) rvRelease();
    S.game = game;
    S.redo = [];
    BT.store.setCurrent(game.id);
  }
  /* ✂️ 場面を切り出す（js/trim.js）。opts：{ vid（この端末で撮影した動画）, file（動画のファイル） } */
  function openTrim(opts) {
    const g = S.game;
    if (!g) return;
    opts = opts || {};
    // 場面パック（js/license.js。スイッチが off のあいだは、いつも通す）。
    // 開くだけでは数えない：動画を付けたときに、その試合をお試しの 1 試合に数える（のぞいただけで枠が減らないように）
    if (!BT.license.can('trim', g)) { BT.license.ui.paywall(g, () => openTrim(opts)); return; }
    const saveTrim = () => { const T = BT.trim.state; if (T && T.vkey) BT.license.use('trim', g); save(); };
    save();
    if (camOn()) camClose();
    BT.ui.closeSheet(true);
    delete document.documentElement.dataset.rot;
    rvPause();
    // 動画を見ながら記録した試合：そのとき見ていた動画を、そのまま使う（選び直さなくてよい）
    const file = opts.file || (!opts.vid && BT.isReview(g) && S.rv && S.rv.gameId === g.id && S.rv.file ? S.rv.file : null);
    S.view = 'trim';
    S.L = null;
    BT.ui.keepAwake(false);
    BT.trim.open({ game: g, save: saveTrim, back: () => go('game'), home: () => go('home'), file, vid: opts.vid || null });
    root.scrollTo(0, 0);
  }
  function openGame(game) {
    setGame(game);
    go('live');
    if (game.startedAt && !game.endedAt) { BT.ui.keepAwake(true); guard(); }
    // 前回、録画の途中で閉じた動画があれば、そろっている所までで仕上げる
    if (!camRec() && (game.videos || []).some((v) => v.status === 'recording') && BT.vstore.supported()) {
      BT.camera.recover(game.id).then(async (list) => {
        list.forEach(upsertVideo);
        // 記録には「録画中」のまま残っているが、この端末ではもう仕上がっている動画（別の画面で止めた）・もうない動画
        for (const v of game.videos || []) {
          if (v.status !== 'recording' || list.some((x) => x.vid === v.vid)) continue;
          const m = await BT.vstore.getVideo(v.vid).catch(() => null);
          if (m && m.status === 'done') upsertVideo(m); else { v.status = 'done'; v.gone = true; }
        }
        save();
        if (list.some((v) => !v.gone)) say('前回の録画を、閉じる前までの分で保存しました', 'ok', 5000);
        if (S.L) updateLive();
      }).catch(() => {});
    }
  }

  /* ========== 入口（バスケ・グロウ）へ戻る ==========
     クラブ・練習・保護者会への入口は「バスケ・グロウ」。グロウから ?from=grow-home・grow-club・grow-more で開かれたら、
     戻り先を覚えておく（このタブのあいだだけ）。ホームの上の「‹ バスケ・グロウ」で、そこへ戻る（同じタブ）。 */
  const GROW_URL = 'https://dora9991.github.io/math-dialogue/basket-coach/';
  const FROM_KEY = 'btap:from';
  const FROMS = { 'grow-home': '#home', 'grow-club': '#club', 'grow-more': '#more' };
  function growFrom() { try { const f = sessionStorage.getItem(FROM_KEY) || ''; return FROMS[f] ? f : ''; } catch (e) { return ''; } }
  function growHref() { return GROW_URL + (FROMS[growFrom()] || '#home'); }
  /* はじめ：?from= を覚えて、アドレスからは消す（ほかの ? と # はそのまま） */
  function takeFrom() {
    const m = /[?&]from=([a-z-]+)/.exec(location.search || '');
    if (!m) return;
    if (FROMS[m[1]]) { try { sessionStorage.setItem(FROM_KEY, m[1]); } catch (e) { /* 保存できなくても、ふつうに開く */ } }
    const q = location.search.replace(/([?&])from=[a-z-]+&?/, '$1').replace(/[?&]$/, '');
    try { history.replaceState(history.state, '', location.pathname + q + location.hash); } catch (e) { /* 無視 */ }
  }
  function growBar() {
    const club = growFrom() === 'grow-club';
    return h('a', { class: 'growbar', id: 'growLink', href: growHref() },
      h('span', { class: 'gb-back', 'aria-hidden': 'true' }, '‹'),
      h('b', null, 'バスケ・グロウ'),
      h('small', null, club ? 'コーチのページに戻る' : 'クラブ・練習・保護者会の入口'));
  }

  /* ========== ホーム ==========
     上から：記録中の試合 → 2つの始め方（試合を見ながら／撮った動画を見ながら）→ ✂️ 切り出し待ち → これまでの試合。
     試合を押すと「試合のページ」（集計・切り出し・書き出し）。クラウドにだけある試合（ほかの端末で記録した・この端末の保存が消えた）も並べる */
  function renderHome() {
    S.L = null;
    document.body.dataset.view = 'home';
    BT.ui.keepAwake(false);
    const V = $('#view');
    V.innerHTML = '';
    const list = BT.store.games().filter((g) => !g.demo);
    const curId = BT.store.current();
    const cur = curId ? list.find((g) => g.id === curId) : null;
    const going = cur && cur.startedAt && !cur.endedAt ? cur : null;
    const waits = list.filter((g) => g.endedAt && !g.rv && !g.trim && g.n > 0 && g !== going);
    const cloudOnly = (S.cloudList || []).filter((c) => c && c.id && !list.some((g) => g.id === c.id) && c.summary && !c.summary.demo);
    const totN = list.filter((g) => g.n > 0).length;          // 📊 これまでの集計に入る試合（デモでない・記録が1つ以上）
    V.append(
      h('header', { class: 'hbar' },
        h('div', { class: 'brand' }, h('span', { class: 'logo', 'aria-hidden': 'true' }, '🏀'), h('div', null, h('b', null, BT.APP), h('small', null, 'タップで記録 → 動画から場面を切り出す。これ1つで'))),
        h('button', { class: 'btn small demo-btn', id: 'btnDemo', onclick: openDemo }, '▶ デモ'),
        h('button', { class: 'btn icon', id: 'btnSettings', 'aria-label': '設定', onclick: openSettings }, '⚙'),
        h('button', { class: 'btn icon', id: 'btnHelp', 'aria-label': '使い方', onclick: help }, '？')),
      h('main', { class: 'home' },
        growBar(),
        going ? h('section', { class: 'card going' },
          h('div', { class: 'going-h' }, h('span', { class: 'recdot' }), h('b', null, going.rv ? '動画を見ながら記録している試合があります' : '記録中の試合があります')),
          gameLine(going),
          h('button', { class: 'btn primary huge', id: 'btnResume', onclick: () => resume(going.id) }, '続きを記録する')) : null,
        h('section', { class: 'modes' },
          h('button', { class: 'mode mode-live', id: 'btnNew', onclick: () => newGame() },
            h('span', { class: 'mi' }, '🏀'),
            h('span', { class: 'mt' }, h('b', null, '試合を見ながら記録する'), h('small', null, 'タップで記録 → 終わったら、試合の動画から場面を切り出す'))),
          h('button', { class: 'mode mode-rv', id: 'btnNewReview', onclick: () => newGame('video') },
            h('span', { class: 'mi' }, '🎬'),
            h('span', { class: 'mt' }, h('b', null, '撮った動画を見ながら記録する'), h('small', null, '動画を先に選ぶ → 記録したら、すぐ集計・場面・動画の書き出し')))),
        !list.length && !cloudOnly.length ? h('section', { class: 'card demo-card' },
          h('b', null, 'はじめての方へ'),
          h('p', null, '使い方を、見本の試合と動画で、自動で見せます（約2分・記録は残りません）。'),
          h('div', { class: 'row' }, h('button', { class: 'btn primary', id: 'btnDemo2', onclick: openDemo }, '▶ 使い方のデモを見る'))) : null,
        waits.length ? h('section', { class: 'card waits', id: 'waits' },
          h('h2', null, '✂️ 切り出し待ち（動画から、まだ場面を切り出していない試合）'),
          h('p', { class: 'note' }, '記録は保存されています。動画が用意できたら、ここから続きができます。'),
          h('div', { class: 'games' }, waits.slice(0, 6).map((g) => h('div', { class: 'grow', dataset: { wait: g.id } },
            h('button', { class: 'gopen', onclick: () => openHub(g.id) }, gameLine(g)),
            h('button', { class: 'btn small primary', dataset: { trim: g.id }, onclick: () => openHub(g.id, 'trim') }, '🎬 動画を選ぶ'))))) : null,
        totN ? h('button', { class: 'totbtn', id: 'btnTotals', onclick: () => go('totals') },
          h('span', { class: 'mi', 'aria-hidden': 'true' }, '📊'),
          h('span', { class: 'mt' }, h('b', null, 'これまでの集計'), h('small', null, `${totN}試合のシュート成功率・選手ごと・場所ごとの成功率など`)),
          h('span', { class: 'arr', 'aria-hidden': 'true' }, '›')) : null,
        list.length || cloudOnly.length ? h('section', { class: 'card' }, h('h2', null, 'これまでの試合'),
          h('div', { class: 'games', id: 'gameList' }, list.map(gameRow), cloudOnly.map(cloudRow))) : null,
        h('div', { class: 'row homefoot' },
          h('button', { class: 'linkbtn', onclick: importFile }, '📂 記録のファイル（.json）を開く')),
        h('p', { class: 'note', id: 'cloudNote' }, cloudNoteText())));
    if (!S.cloudFetched) refreshCloud();
  }
  function cloudNoteText() {
    if (!BT.cloud.enabled()) return '🔒 記録はこの端末のブラウザの中だけに保存しています（設定でクラウドに残すようにできます）。';
    const n = BT.cloud.pending();
    return `☁️ 記録は、この端末とクラウドの両方に保存します（合言葉 ${BT.cloud.showKey()}。ほかの端末で同じ合言葉を入れると、同じ記録が見られます）。${n ? `　送る待ち ${n}件（電波がつながったら送ります）` : ''}`;
  }
  /* クラウドの一覧を読み直す（ホームを開いたとき。この端末にない試合も出す） */
  function refreshCloud() {
    if (!BT.cloud.enabled()) return;
    S.cloudFetched = true;
    BT.cloud.flush();
    BT.cloud.list().then((list) => { S.cloudList = list; if (S.view === 'home') renderHome(); }).catch(() => { S.cloudFetched = false; });
  }
  function gameLine(g) {
    const when = g.startedAt ? `${g.date} ${new Date(g.startedAt).toTimeString().slice(0, 5)}` : `${g.date}（まだスタートしていません）`;
    return h('div', { class: 'gline' },
      h('span', { class: 'when' }, when),
      h('span', { class: 'vs' }, h('i', { class: 'chip', style: { background: (g.colors || [])[0] } }), (g.names || [])[0], h('b', null, ` ${(g.score || [0, 0])[0]} − ${(g.score || [0, 0])[1]} `), (g.names || [])[1], h('i', { class: 'chip', style: { background: (g.colors || [])[1] } })),
      g.title ? h('span', { class: 'gtitle' }, g.title) : null);
  }
  /* 試合の状態の札：記録中・切り出し待ち・切り出しずみ・動画を見ながら・クラウド */
  function gameTags(g) {
    const tags = [];
    if (g.startedAt && !g.endedAt) tags.push(['rec', g.rv ? '🎬 記録の途中' : '● 記録中']);
    else if (g.rv) tags.push(['rv', '🎬 動画を見ながら記録']);
    else if (g.endedAt && g.trim) tags.push(['done', '✓ 切り出しずみ']);
    else if (g.endedAt && g.n > 0) tags.push(['wait', '✂️ 切り出し待ち']);
    if (g.videos) tags.push(['', `📹 動画${g.videos}本`]);
    const cs = BT.cloud.status(g.id);
    if (cs.s === 'ok') tags.push(['cloud', '☁️ 保存ずみ']); else if (cs.s === 'wait') tags.push(['cwait', '☁️ 送る待ち']);
    return h('span', { class: 'gtags' }, tags.map(([k, t]) => h('i', { class: 'gtag ' + k }, t)));
  }
  function gameRow(g) {
    return h('div', { class: 'grow', dataset: { id: g.id } },
      h('button', { class: 'gopen', onclick: () => openHub(g.id) }, gameLine(g), h('small', { class: 'note' }, `${g.n}件の記録`), gameTags(g)),
      h('span', { class: 'gopen-arrow', 'aria-hidden': 'true' }, '›'));
  }
  function cloudRow(c) {
    const g = c.summary;
    return h('div', { class: 'grow cloudonly', dataset: { cloud: c.id } },
      h('button', { class: 'gopen', onclick: () => openCloudGame(c.id) }, gameLine(g), h('small', { class: 'note' }, `${g.n || 0}件の記録`),
        h('span', { class: 'gtags' }, h('i', { class: 'gtag cloud' }, '☁️ クラウドだけ（押すと、この端末に読み込みます）'))),
      h('span', { class: 'gopen-arrow', 'aria-hidden': 'true' }, '›'));
  }
  async function openCloudGame(id) {
    BT.ui.toast('クラウドから読み込んでいます…', '', 3000);
    let g = null;
    try { g = await BT.cloud.get(id); } catch (e) { g = null; }
    if (!g) { BT.ui.toast('読み込めませんでした（電波を確かめて、もう一度）', 'err', 5000); return; }
    // この端末の動画は無いので、撮影した動画は「この端末にない」にする
    (g.videos || []).forEach((v) => { if (!v.file) v.gone = true; });
    BT.store.saveGame(g);
    openHub(g.id);
    BT.ui.toast('クラウドの記録を、この端末に読み込みました', 'ok');
  }
  function resume(id) {
    const g = BT.store.loadGame(id);
    if (!g) { BT.ui.toast('この試合の記録が見つかりませんでした', 'err'); renderHome(); return; }
    openGame(g);
  }
  /* 試合のページを開く（記録の途中の試合は、記録の画面へ）。then：'trim'（すぐ動画を選ぶ画面へ） */
  function openHub(id, then) {
    const g = BT.store.loadGame(id);
    if (!g) { BT.ui.toast('この試合の記録が見つかりませんでした', 'err'); renderHome(); return; }
    if (g.startedAt && !g.endedAt && then !== 'trim') { openGame(g); return; }
    setGame(g);
    if (then === 'trim') openTrim({}); else go('game');
  }
  async function importFile() {
    const f = await BT.ui.pickText();
    if (!f) return;
    try {
      const g = BT.importData(f.text);
      if (BT.store.loadGame(g.id)) g.id = BT.uid('g');      // 同じ試合がもうあるときは、別の試合として開く
      setGame(g);
      save();
      go(g.startedAt && !g.endedAt ? 'live' : 'game');
      BT.ui.toast('記録のファイルを開きました', 'ok');
    } catch (e) { BT.ui.toast('開けませんでした：' + e.message, 'err', 6000); }
  }
  function deleteGame(g) {
    const sum = BT.summary(g);
    BT.ui.confirm('この試合を消しますか？', `${sum.date} ${sum.names[0]} ${sum.score[0]} − ${sum.score[1]} ${sum.names[1]}（${sum.n}件の記録${sum.videos ? `・撮影した動画${sum.videos}本` : ''}）。この端末とクラウドから消します。書き出したファイル・写真に保存した動画は残ります。`, '消す', () => {
      BT.store.deleteGame(g.id);
      BT.cloud.del(g.id);
      if (BT.vstore.supported()) BT.vstore.removeGame(g.id).catch(() => {});
      S.cloudList = (S.cloudList || []).filter((c) => c.id !== g.id);
      S.game = null;
      go('home');
      BT.ui.toast('消しました', 'ok');
    }, true);
  }

  /* ========== 試合のページ（記録のあと：集計・切り出し・書き出し・ホームへ） ========== */
  function renderGame() {
    const g = S.game;
    if (!g) { go('home'); return; }
    S.L = null;
    document.body.dataset.view = 'game';
    BT.ui.keepAwake(false);
    const V = $('#view');
    const keepY = root.scrollY || 0;
    V.innerHTML = '';
    const sum = BT.summary(g);
    const sc = sum.score;
    const rv = BT.isReview(g), going = !!(g.startedAt && !g.endedAt);
    const plays = sum.n;
    const cams = (g.videos || []).filter((v) => !v.gone && !v.file && v.status !== 'recording');
    const cs = BT.cloud.status(g.id);
    const cloudTxt = cs.s === 'ok' ? '☁️ クラウドに保存ずみ' : cs.s === 'wait' ? (cs.busy ? '☁️ 送っています…' : '☁️ 送る待ち（つながったら送ります）') : '🔒 この端末だけに保存';
    const rvFile = rv && S.rv && S.rv.gameId === g.id && S.rv.file ? S.rv.file : null;
    // いちばん大事な「次にすること」
    let next;
    if (!g.startedAt) {
      next = h('section', { class: 'card next' }, h('h2', null, 'まだスタートしていません'), h('button', { class: 'btn primary huge', onclick: () => openGame(g) }, '記録の画面へ →'));
    } else if (!plays) {
      next = h('section', { class: 'card next' }, h('h2', null, 'まだ記録がありません'), h('button', { class: 'btn primary huge', id: 'hubRecord', onclick: () => openGame(g) }, '記録の画面へ →'));
    } else if (rv) {
      next = h('section', { class: 'card next', id: 'hubNext' },
        h('h2', null, '🎬 場面を見る・動画にする'),
        h('p', { class: 'note' }, rvFile ? '記録した動画から、記録した場面を切り出します（時刻あわせはいりません）。選手ごと・プレーごとに見たり、1本の動画にしたりできます。'
          : `記録したときに見ていた動画（${(g.src && g.src.name) || '同じ動画'}）を選ぶと、時刻あわせなしで場面を切り出せます。`),
        h('button', { class: 'btn primary huge', id: 'hubTrim', onclick: () => openTrim({}) }, rvFile ? '🎬 場面を見る・動画にする' : '🎬 動画を選んで、場面を見る'));
    } else {
      next = h('section', { class: 'card next' + (g.trimmed ? '' : ' todo'), id: 'hubNext' },
        h('h2', null, g.trimmed ? '🎬 場面を見る・動画にする' : '✂️ 動画から場面を切り出す'),
        h('p', { class: 'note' }, g.trimmed ? '前に切り出した動画を選ぶと、合わせた時刻のまま開きます。'
          : '試合の動画を選ぶと、記録した場面（シュート・リバウンド・パスミスなど）を切り出せます。動画がまだなら、あとでも大丈夫です（記録は保存されています）。'),
        h('button', { class: 'btn primary huge', id: 'hubTrim', onclick: () => openTrim({}) }, g.trimmed ? '🎬 場面を見る・動画にする' : '🎬 動画を選んで、場面を切り出す'),
        cams.length ? h('div', { class: 'row' }, cams.map((v) => h('button', { class: 'btn', dataset: { camvid: v.vid }, onclick: () => openTrim({ vid: v.vid }) }, `📹 撮影した動画${v.n}で切り出す（時刻あわせなし）`))) : null);
    }
    const licLine = next.querySelector('#hubTrim') ? BT.license.ui.line(g) : null;
    if (licLine) next.append(licLine);
    V.append(
      h('header', { class: 'hbar' },
        h('button', { class: 'btn', id: 'hubHome', onclick: () => go('home') }, '🏠 ホーム'),
        h('b', { class: 'htitle' }, '試合のページ'),
        h('span', { class: 'spacer' }),
        h('button', { class: 'btn icon', 'aria-label': '使い方', onclick: help }, '？')),
      h('main', { class: 'hub' },
        h('section', { class: 'card hubhead' },
          h('div', { class: 'hubwhen' }, `${g.date}${g.startedAt ? ' ' + BT.hmsAt(g.startedAt, g.tz).slice(0, 5) : ''}${g.title ? '・' + g.title : ''}${rv ? '・🎬 動画を見ながら記録' : ''}`),
          h('div', { class: 'hubvs' },
            h('span', { class: 'ht' }, h('i', { class: 'chip', style: { background: g.teams[0].color } }), BT.teamName(g, 0)),
            h('b', { class: 'hsc' }, `${sc[0]} − ${sc[1]}`),
            h('span', { class: 'ht' }, BT.teamName(g, 1), h('i', { class: 'chip', style: { background: g.teams[1].color } }))),
          h('div', { class: 'hubstat' }, h('span', null, `${plays}件の記録`), h('span', { class: 'cloud ' + cs.s, id: 'hubCloud' }, cloudTxt),
            !rv && plays ? h('span', null, g.trimmed ? '✓ 切り出しずみ' : '✂️ まだ切り出していません') : null)),
        going ? h('section', { class: 'card going' }, h('div', { class: 'going-h' }, h('span', { class: 'recdot' }), h('b', null, 'この試合は、まだ記録の途中です')),
          h('button', { class: 'btn primary huge', onclick: () => openGame(g) }, '記録の画面へ（続きを記録する）')) : null,
        next,
        plays ? h('section', { class: 'card hubstats' }, h('h2', null, '📊 集計'), statsBody(g)) : null,
        plays || videoCount(g) ? h('section', { class: 'card hubexport' }, h('h2', null, plays ? '💾 記録を書き出す' : '📹 撮影した動画'), exportBody(g)) : null,
        h('section', { class: 'card hubmore' }, h('h2', null, 'そのほか'),
          h('div', { class: 'row' },
            plays ? h('button', { class: 'btn', id: 'hubLog', onclick: () => openLog() }, '📋 記録の一覧を見る・直す') : null,
            h('button', { class: 'btn', onclick: () => { S.setupFor = 'edit'; S.editBack = 'game'; go('setup'); } }, '👥 チーム・背番号を直す'),
            g.endedAt ? h('button', { class: 'btn', id: 'hubReopen', onclick: () => { reopenGame(g); } }, '▶ 続きを記録する') : null,
            h('button', { class: 'btn danger', id: 'hubDelete', onclick: () => deleteGame(g) }, '🗑 この試合を消す'))),
        h('button', { class: 'btn huge homebig', id: 'hubHome2', onclick: () => go('home') }, '🏠 ホームへ戻る')));
    if (keepY) root.scrollTo(0, keepY);
  }
  /* 終えた試合を、もう一度記録の画面で続ける */
  function reopenGame(g) {
    BT.ui.confirm('続きを記録しますか？', BT.isReview(g) ? '記録の画面に戻ります（動画をもう一度選びます）。' : '時計は、スタートから進んだまま動きます（試合を終えたあとの時間も入ります）。まちがえて終えたときに使ってください。', '続きを記録する', () => {
      g.endedAt = null;
      save();
      openGame(g);
      if (BT.isReview(g) && !rvReady()) setTimeout(() => BT.ui.toast('「🎬 動画を選んで、続きを記録する」で、同じ動画を選んでください', 'warn', 6000), 300);
    });
  }
  /* 記録を終えたあと：「動画のトリミング（場面の切り出し）を行いますか？」 */
  function askTrim(g) {
    const cams = (g.videos || []).filter((v) => !v.gone && !v.file && v.status !== 'recording');
    const cs = BT.cloud.status(g.id);
    const s = BT.ui.sheet({
      title: '動画のトリミングを行いますか？', cls: 'asktrim',
      body: h('div', { class: 'asktrim-body' },
        h('p', { class: 'saved' }, cs.s === 'off' ? '✓ 記録をこの端末に保存しました' : '✓ 記録を保存しました（この端末とクラウド）'),
        h('p', null, '試合の動画から、記録した場面（シュート・リバウンド・パスミスなど）を切り出します。選手ごと・プレーごとに見たり、1本の動画にしたりできます。'),
        cams.length ? h('div', { class: 'col' }, cams.map((v) => h('button', { class: 'btn primary', dataset: { camvid: v.vid }, onclick: () => { s.close(); openTrim({ vid: v.vid }); } }, `📹 撮影した動画${v.n}で切り出す（時刻あわせなし）`))) : null,
        h('p', { class: 'note' }, '動画がまだ用意できていないときは「あとで」。記録は消えません。ホームの「✂️ 切り出し待ち」から、いつでも続きができます。')),
      foot: [h('button', { class: 'btn', id: 'askLater', onclick: () => s.close() }, 'あとで'),
        h('button', { class: 'btn primary', id: 'askTrimYes', onclick: () => { s.close(); openTrim({}); } }, cams.length ? '🎬 ほかの動画を選ぶ' : '🎬 はい、動画を選ぶ')]
    });
  }

  /* ========== 試合の準備（チーム名・色・背番号） ========== */
  /* kind：'video'（撮った動画を見ながら記録する） */
  function newGame(kind) {
    const mine = BT.store.myTeam();
    S.draft = { title: '', review: kind === 'video', teams: [mine ? { name: mine.name, color: mine.color, colorName: mine.colorName, players: BT.cleanPlayers(mine.players) } : BT.blankTeam(0), BT.blankTeam(1)] };
    if (S.draft.teams[0].color === S.draft.teams[1].color) Object.assign(S.draft.teams[1], S.draft.teams[0].color === '#2f6fed' ? { color: '#d93636', colorName: '赤' } : {});
    S.setupFor = 'new';
    S.more = [false, false];
    go('setup');
  }
  const setupTeams = () => (S.setupFor === 'edit' ? S.game.teams : S.draft.teams);
  const editBack = () => (S.editBack === 'game' ? 'game' : 'live');
  function setupChanged() { if (S.setupFor === 'edit') save(); }

  function renderSetup() {
    S.L = null;
    document.body.dataset.view = 'setup';
    const V = $('#view');
    V.innerHTML = '';
    const edit = S.setupFor === 'edit';
    V.append(
      h('header', { class: 'hbar' },
        h('button', { class: 'btn', id: 'setupBack', onclick: () => (edit ? go(editBack()) : go('home')) }, edit ? (editBack() === 'game' ? '← 試合のページへ' : '← 記録へ戻る') : '← ホーム'),
        h('b', { class: 'htitle' }, edit ? 'チーム・背番号を直す' : '試合の準備'),
        h('span', { class: 'spacer' })),
      h('main', { class: 'setup' },
        !edit && S.draft.review ? h('p', { class: 'lead rvlead' }, '🎬 撮った動画を見ながら記録します。チームと背番号を選んだら、いちばん下のボタンで動画を選んでください。') : null,
        h('p', { class: 'lead' }, '背番号は、下の番号をタップして選びます（「4〜15」などのボタンで、まとめて選べます）。名前はなくても大丈夫です。'),
        h('div', { class: 'teams2' }, [0, 1].map((i) => teamCard(i))),
        edit ? null : h('section', { class: 'card' },
          h('label', { class: 'field' }, h('span', null, '試合のメモ（なくてもOK）'),
            h('input', { type: 'text', id: 'gameTitle', maxlength: 40, placeholder: '例：練習試合・新人戦 1回戦', value: S.draft.title, oninput: (e) => { S.draft.title = e.target.value; } }))),
        h('div', { class: 'gobar' },
          edit ? h('button', { class: 'btn primary huge', onclick: () => { saveTeams(); go(editBack()); } }, editBack() === 'game' ? '試合のページへ戻る' : '記録へ戻る')
            : S.draft.review ? [h('button', { class: 'btn primary huge', id: 'btnToReview', onclick: toReview }, '🎬 動画を選んで、記録の画面へ →'),
              h('button', { class: 'linkbtn', id: 'btnToLive', onclick: toLive }, '動画なしで記録する（試合を見ながら）')]
              : [h('button', { class: 'btn primary huge', id: 'btnToLive', onclick: toLive }, '記録の画面へ →'),
                h('button', { class: 'linkbtn', id: 'btnToReview', onclick: toReview }, '🎬 撮った動画を見ながら記録する（動画を選ぶ）')])));
  }
  function saveTeams() {
    if (S.demoMode) return;          // デモのチームは、名簿に残さない
    const T = setupTeams();
    if (T[0].name) BT.store.saveTeam(T[0], true);
    if (T[1].name) BT.store.saveTeam(T[1], false);
  }
  function toLive() {
    const T = S.draft.teams;
    saveTeams();
    const g = BT.newGame({ teams: T, title: (S.draft.title || '').trim() });
    if (S.demoMode) g.demo = true;
    S.draft = null;
    BT.store.saveGame(g);
    openGame(g);
  }

  /* チームのカード。文字の欄を変えたときは、カードを作り直さずに、その場で書き換える
     （欄から次のボタンへ指を動かした瞬間に作り直すと、そのボタンのタップが消えてしまうため）。
     作り直すのは、ボタンを押し終わったあと（保存したチームを選ぶ・色）だけ */
  function teamCard(i) {
    const T = setupTeams();
    const t = T[i];
    const card = h('section', { class: 'card teamcard', id: 'team' + i, style: { '--tc': t.color, '--tink': BT.inkOn(t.color) } });
    const redraw = () => { [0, 1].forEach((k) => { const old = document.getElementById('team' + k); if (old) old.replaceWith(teamCard(k)); }); };
    const label = () => (t.name || '').trim() || (i ? '相手のチーム' : '自分のチーム');
    const headName = h('b', null, label());
    card.append(h('div', { class: 'tc-head' }, h('span', { class: 'tc-band' }, i ? '相手' : '自分'), headName));
    // 保存したチームから
    const saved = BT.store.teams().filter((x) => x.name !== t.name || JSON.stringify(x.players.map((p) => p.no)) !== JSON.stringify(t.players.map((p) => p.no)));
    if (saved.length) {
      card.append(h('div', { class: 'savedrow' }, h('span', { class: 'note' }, '前のチームから：'),
        saved.slice(0, 8).map((x) => h('button', { class: 'btn small chipbtn', onclick: () => { Object.assign(t, { name: x.name, color: x.color, colorName: x.colorName, players: BT.cleanPlayers(x.players) }); setupChanged(); redraw(); } },
          h('i', { class: 'chip', style: { background: x.color } }), x.name, h('small', null, ` ${x.players.length}人`)))));
    }
    // 名前
    card.append(h('label', { class: 'field' }, h('span', null, 'チーム名'),
      h('input', { type: 'text', class: 'tname', maxlength: 20, placeholder: i ? '例：○○中（なくてもOK）' : '例：致遠館（なくてもOK）', value: t.name || '',
        onchange: (e) => { t.name = e.target.value.trim(); setupChanged(); headName.textContent = label(); } })));
    // 色
    const sw = h('div', { class: 'swatches', role: 'radiogroup', 'aria-label': 'ユニフォームの色' });
    BT.COLORS.forEach((c) => {
      const on = t.color.toLowerCase() === c.hex.toLowerCase();
      sw.append(h('button', { class: 'sw' + (on ? ' on' : ''), style: { background: c.hex }, title: c.name, 'aria-label': c.name, role: 'radio', 'aria-checked': on ? 'true' : 'false', dataset: { color: c.name },
        onclick: () => { t.color = c.hex; t.colorName = c.name; setupChanged(); redraw(); } }));
    });
    sw.append(h('input', { type: 'color', class: 'swc', title: 'ほかの色', value: t.color, onchange: (e) => { t.color = e.target.value; t.colorName = BT.nearestColorName(e.target.value); setupChanged(); redraw(); } }));
    card.append(h('div', { class: 'field' }, h('span', null, `ユニフォームの色：${t.colorName}`), sw));
    if (T[0].color.toLowerCase() === T[1].color.toLowerCase()) card.append(h('p', { class: 'note warn' }, '⚠ 自分と相手が同じ色です。見分けやすいように、どちらかを変えてください。'));
    // 背番号
    const count = h('span', null, '');
    const noText = h('input', { type: 'text', class: 'nostext', inputmode: 'numeric', placeholder: '直接入れる（例：4-15, 23）', onchange: (e) => setNos(BT.parseNumbers(e.target.value)) });
    const presets = [['4〜15', '4-15'], ['4〜18', '4-18'], ['1〜15', '1-15'], ['0〜20', '0-20']];
    card.append(h('div', { class: 'field' }, count,
      h('div', { class: 'row presets' },
        presets.map(([lab, txt]) => h('button', { class: 'btn small', dataset: { preset: txt }, onclick: () => setNos(BT.parseNumbers(txt)) }, lab)),
        h('button', { class: 'btn small', onclick: () => setNos([]) }, '全部はずす')),
      noText));
    const grid = h('div', { class: 'nogrid', role: 'group', 'aria-label': '背番号を選ぶ' });
    const moreBtn = h('button', { class: 'linkbtn', onclick: () => { S.more[i] = !S.more[i]; fillGrid(); } }, '');
    const names = h('div', { class: 'namesbox' });
    card.append(grid, moreBtn, names);
    // マスを並べる（0・00・1〜30。「31〜99 も出す」で 99 まで。31 以上を選んでいれば、その番号も）
    function fillGrid() {
      const on = new Set(t.players.map((p) => p.no));
      const shown = ['0', '00'].concat(Array.from({ length: S.more[i] ? 99 : 30 }, (_, k) => String(k + 1)));
      t.players.forEach((p) => { if (!shown.includes(p.no)) shown.push(p.no); });
      grid.innerHTML = '';
      BT.sortNos(shown).forEach((no) => grid.append(h('button', { class: 'nb' + (on.has(no) ? ' on' : ''), dataset: { no }, 'aria-pressed': on.has(no) ? 'true' : 'false',
        onclick: () => { const cur = new Set(t.players.map((p) => p.no)); if (cur.has(no)) cur.delete(no); else cur.add(no); setNos(Array.from(cur)); } }, no)));
      moreBtn.textContent = S.more[i] ? '31〜99 をかくす' : '31〜99 も出す';
    }
    // 名前（任意）
    function fillNames() {
      names.innerHTML = '';
      if (!t.players.length) return;
      const det = h('details', { class: 'names' }, h('summary', null, `選手の名前を入れる（なくてもOK）${t.players.some((p) => p.name) ? '・' + t.players.filter((p) => p.name).length + '人入力ずみ' : ''}`),
        h('div', { class: 'namelist' }, t.players.map((p) => h('label', { class: 'nm' }, h('b', null, '#' + p.no),
          h('input', { type: 'text', maxlength: 12, placeholder: '名前・ニックネーム', value: p.name || '', onchange: (e) => { p.name = e.target.value.trim().slice(0, 12); setupChanged(); } })))));
      det.open = !!S.namesOpen && S.namesOpen[i];
      det.addEventListener('toggle', () => { S.namesOpen = S.namesOpen || [false, false]; S.namesOpen[i] = det.open; });
      names.append(det);
    }
    /* 背番号を変えた：マスの印・人数・文字の欄・名前の欄を、その場で書き換える */
    function setNos(list) {
      const before = t.players.map((p) => p.no).join(',');
      t.players = BT.playersFromNos(list, t.players);
      setupChanged();
      const on = new Set(t.players.map((p) => p.no));
      if (t.players.some((p) => !grid.querySelector(`.nb[data-no="${p.no}"]`))) fillGrid();
      else grid.querySelectorAll('.nb').forEach((b) => { const v = on.has(b.dataset.no); b.classList.toggle('on', v); b.setAttribute('aria-pressed', v ? 'true' : 'false'); });
      count.textContent = `背番号：${t.players.length ? t.players.length + '人' : 'まだ選んでいません'}`;
      if (document.activeElement !== noText) noText.value = BT.formatNumbers(t.players.map((p) => p.no));
      if (before !== t.players.map((p) => p.no).join(',')) fillNames();
    }
    fillGrid();
    fillNames();
    count.textContent = `背番号：${t.players.length ? t.players.length + '人' : 'まだ選んでいません'}`;
    noText.value = BT.formatNumbers(t.players.map((p) => p.no));
    return card;
  }

  /* ========== 記録の画面 ==========
     選手（背番号）ごとに1行。行の「2P」「3P」「FT」「リバ」を押せば、その選手のプレーとして1回で記録する（時刻は押した瞬間）。
     「パスミス」「★ あとで見る」は画面の下に1つずつ。チーム・選手は決めずに、いつでも押せる。
     画面は、いちど作ったら作り直さず、数字（得点・回数）だけを書き換える
     （押している間にボタンが入れ替わると、Safari ではタップにならないため） */
  /* そのチームの行：背番号の小さい順＋「？」（だれか分からないとき。背番号がないチームは、この1行だけ） */
  /* 選手の行のボタン（設定：シュートの失敗・リバの分け方・アシスト・スティール・ターンオーバー・ファウルを足す。ふだんは 2P・3P・FT・リバ） */
  const rowTypes = () => BT.rowTypes({ miss: !!S.prefs.btnMiss, foul: !!S.prefs.btnFoul, ast: !!S.prefs.btnAst, stl: !!S.prefs.btnStl, tov: !!S.prefs.btnTov, rebSplit: !!S.prefs.rebSplit });
  const rowSpec = () => BT.rowSpec(rowTypes());
  function rowsOf(tm) {
    const rows = S.game.teams[tm].players.map((p) => ({ no: p.no, name: p.name }));
    if (S.prefs.unknown !== false || !rows.length) rows.push({ no: null, name: '' });
    return rows;
  }
  function buildLive() {
    const g = S.game;
    document.body.dataset.view = 'live';
    const V = $('#view');
    V.innerHTML = '';
    const L = S.L = { panels: [], btns: [], gb: {} };
    // 時計：ふだんは、スタートからの時間（押すとメニュー）。設定で「試合時間」をオンにすると、試合時間（押すと、止まる・動く）と、その下に小さくスタートからの時間
    L.clock = h('button', { class: 'clock', id: 'clock', title: 'スタートからの時間', onclick: clockTap }, h('span', { class: 'recdot' }), h('i', { class: 'gcst', 'aria-hidden': 'true' }),
      h('span', { class: 'tcol' }, h('span', { class: 'tval', id: 'tval' }, '0:00'), h('small', { class: 'tsub', id: 'tsub', hidden: true })));
    L.start = h('button', { class: 'startbtn', id: 'btnStart', onclick: start }, '▶ スタート');
    L.period = h('button', { class: 'period', id: 'btnPeriod', 'aria-label': 'ピリオド', onclick: openPeriod }, '1Q');
    L.score = [0, 1].map((tm) => h('span', { class: 'sc', id: 'score' + tm, style: { '--tc': g.teams[tm].color, '--tink': BT.inkOn(g.teams[tm].color) } }, '0'));
    // 撮影中は、カメラの小さな映像（押すと撮影の画面）
    L.camThumb = h('video', { class: 'camthumb', muted: true, playsinline: true, autoplay: true });
    L.camBtn = h('button', { class: 'cambtn', id: 'btnCam', hidden: true, 'aria-label': '撮影の画面を開く', onclick: openCamera }, L.camThumb, h('i', { class: 'camdot' }));
    L.camThumb.addEventListener('resize', onCamResize);
    const bar = L.bar = h('header', { class: 'lbar' }, L.clock, L.start, L.period,
      h('div', { class: 'score', 'aria-label': '得点' }, L.score[0], h('span', { class: 'dash' }, '−'), L.score[1]),
      L.camBtn,
      h('button', { class: 'menubtn', id: 'btnMenu', 'aria-label': 'メニュー', onclick: openMenu }, h('span', null, '≡'), h('small', null, 'メニュー')));
    // 撮影中の大きなワイプ（中・大）。ボタンに重ならないよう、横長の画面なら右側・縦長なら上に置く（置き場所と大きさは layoutWipe）
    L.wipeVid = h('video', { class: 'wipev', muted: true, playsinline: true, autoplay: true });
    L.wipeVid.muted = true; L.wipeVid.playsInline = true;
    L.wipeTag = h('span', { class: 'wipetag', id: 'wipeTag' });
    L.wipeSmall = h('button', { class: 'wipesz', id: 'btnWipeSmall', 'aria-label': 'ワイプを小さくする', onclick: () => setWipe(-1) }, '－');
    L.wipeBig = h('button', { class: 'wipesz', id: 'btnWipeBig', 'aria-label': 'ワイプを大きくする', onclick: () => setWipe(1) }, '＋');
    L.wipeBox = h('div', { class: 'wipebox', id: 'wipeBox' },
      h('button', { class: 'wipeopen', id: 'btnWipe', 'aria-label': '撮影の画面を開く', onclick: openCamera }, L.wipeVid),
      L.wipeTag, h('div', { class: 'wipectl' }, L.wipeSmall, L.wipeBig));
    L.wipe = h('aside', { class: 'wipe', id: 'wipe', hidden: true, 'aria-label': 'カメラの映像' }, L.wipeBox);
    const P = L.panelsEl = h('main', { class: 'panels' }, [0, 1].map(buildPanel));
    L.cover = h('div', { class: 'cover', id: 'cover', hidden: true });
    // 画面の下：パスミス・★（チーム・選手は決めない）と、いま記録したもの・取り消す
    const gbtn = (type, id, label, sub) => {
      const cnt = h('i', { class: 'cnt', hidden: true });
      const el = h('button', { class: 'gb k-' + BT.TYPE[type].kind, id, dataset: { gtype: type }, 'aria-label': `${BT.TYPE[type].label}（チーム・選手は決めない）`, onclick: (e) => record(null, null, type, e.currentTarget) },
        h('b', null, label), sub ? h('small', null, sub) : null, cnt);
      L.gb[type] = { el, cnt };
      return el;
    };
    L.last = h('div', { class: 'lastbar', id: 'lastbar' });
    L.gbar = h('footer', { class: 'gbar' }, gbtn('pass', 'btnPass', 'パスミス'), gbtn('mark', 'btnMark', '★', 'あとで見る'), L.last);
    L.stage = h('div', { class: 'stagewrap' }, P, L.cover);
    L.root = h('div', { class: 'live' }, bar, L.wipe, L.stage, L.gbar);
    if (rvMode()) rvBuild();                // 動画を見ながら記録する：映像・位置のバー・操作のボタン、「2P → 14番」の入力
    L.root.addEventListener('click', onPanelClick);        // 選手のボタン（相手チームの枠は、ワイプ「特大」で映像の下に移るので、記録の画面全体で受ける）
    V.append(L.root);
    updateLive();
    layoutLive();
    updateCamUI();
  }
  function buildPanel(tm) {
    const g = S.game, t = g.teams[tm];
    const tsc = h('span', { class: 'tsc' }, '0');
    const head = h('div', { class: 'thead' }, h('b', { class: 'tname' }, BT.teamName(g, tm)), tsc,
      h('button', { class: 'tadd', dataset: { add: '1' }, title: '名簿にない背番号を足す', 'aria-label': `${BT.teamName(g, tm)} の背番号を足す` }, '＋番号'));
    const roster = h('div', { class: 'roster', role: 'group', 'aria-label': `${BT.teamName(g, tm)} の選手` });
    const sec = h('section', { class: 'team', id: 'panel' + tm, dataset: { team: tm }, style: { '--tc': t.color, '--tink': BT.inkOn(t.color) } }, head, roster);
    S.L.panels[tm] = { sec, head, tsc, roster, n: 0 };
    fillRoster(tm);
    return sec;
  }
  /* 選手の行を並べる（名簿が変わったときにも呼ぶ） */
  function fillRoster(tm) {
    const L = S.L, P = L.panels[tm], g = S.game;
    P.roster.innerHTML = '';
    L.btns = L.btns.filter((b) => b.team !== tm);
    const rows = rowsOf(tm);
    const teamOnly = rows.length === 1 && rows[0].no == null;
    P.n = rows.length;
    rows.forEach((r) => {
      const no = r.no == null ? '' : r.no;
      const who = r.no != null ? `${r.no}番${r.name ? ' ' + r.name : ''}` : teamOnly ? 'チーム' : 'だれか（番号なし）';
      const row = h('div', { class: 'prow' + (r.no == null ? ' unk' : '') + (teamOnly ? ' teamonly' : ''), dataset: { no } },
        h('div', { class: 'pno' }, h('b', null, r.no != null ? r.no : teamOnly ? 'チーム' : '？'),
          r.no != null ? (S.prefs.names && r.name ? h('small', null, r.name) : null) : teamOnly ? null : h('small', null, 'だれか')));
      rowTypes().forEach((type) => {
        const d = BT.TYPE[type];
        const cnt = h('i', { class: 'cnt', hidden: true });
        const lab = d.btnShort ? [h('b', { class: 'bl' }, d.btn), h('b', { class: 'bs' }, d.btnShort)] : h('b', null, d.btn);
        // l2：2段の行（ボタンが多いとき）で、下の段に置くボタン（シュート以外）
        const el = h('button', { class: 'pb k-' + type + (d.kind === 'miss' ? ' miss' : '') + (d.shot ? '' : ' l2'), dataset: { type, no }, 'aria-label': `${BT.teamName(g, tm)} ${who} ${d.label}` }, lab, cnt);
        row.append(el);
        L.btns.push({ team: tm, type, key: tm + ':' + no + ':' + type, el, cnt });
      });
      P.roster.append(row);
    });
  }

  /* 画面の大きさに合わせて並べ方を決める（BT.planLayout：2チームを左右か上下か・チームの中を何列にするか）。
     行の高さは css の minmax（足りないときは、行を縦にすべらせる） */
  function layoutLive() {
    const L = S.L;
    if (!L || !L.root || !L.root.isConnected) return;
    const live = L.root, P = L.panelsEl;
    live.classList.toggle('short', (live.clientHeight || root.innerHeight) < 430);
    if (L.rvBox) layoutRv();
    layoutWipe();
    const n = [L.panels[0].n, L.panels[1].n], headH = L.panels[0].head.offsetHeight || 22, spec = rowSpec();
    if (L.rvBox) {
      // 動画を見ながら記録：選手ごとの行か「2P → 14番」か（自動：行が縦にすべらずに入るなら行）
      const want = S.prefs.rvInput;
      let mode = want === 'rows' || want === 'pick' ? want : null;
      if (!mode) { const p0 = BT.planLayout(L.stage.clientWidth, L.stage.clientHeight, n, headH, spec); mode = !p0.scroll && p0.size >= 34 ? 'rows' : 'pick'; }
      if (mode !== L.inMode && S.rv) S.rv.pick = null;
      L.inMode = mode;
      L.panelsEl.hidden = mode !== 'rows';
      L.pick.hidden = mode !== 'pick';
      live.classList.toggle('rv-pick', mode === 'pick');
      L.rvInput.setAttribute('aria-pressed', mode === 'pick' ? 'true' : 'false');
      if (mode === 'pick') { layoutPick(); return; }
    }
    let plan;
    if (L.oppMoved) {
      // ワイプ「特大」：自分のチームは残りの広さに・相手チームは映像の下の枠に、それぞれ並べる
      const os = L.panels[1].sec;
      const teams = [BT.planTeam(P.clientWidth - 2 * BT.LAYOUT.pad, P.clientHeight, n[0], headH, 3, spec), BT.planTeam(os.offsetWidth, os.offsetHeight, n[1], headH, 4, spec)];
      plan = { arr: 'x', teams, scroll: teams.some((t) => t.scroll) };
    } else plan = BT.planLayout(P.clientWidth, P.clientHeight, n, headH, spec);
    const cols = spec.weights.map((w) => `minmax(0, ${w}fr)`).join(' ');      // 行のボタンの幅の割合（「×」は細め）
    // 長い文字のボタン（狭いと短い文字に替えるもの）のうち、いちばん長い文字の幅（全角で数えて。なければ「ファウル」の 4）
    const longs = spec.types.map((t) => BT.TYPE[t]).filter((d) => d && d.btnShort).map((d) => BT.textEm(d.btn));
    const longEm = longs.length ? Math.max(...longs) : 4;
    live.classList.toggle('lay-side', plan.arr !== 'stack');
    live.classList.toggle('lay-stack', plan.arr === 'stack');
    L.plan = plan;
    plan.teams.forEach((T, tm) => {
      const sec = L.panels[tm].sec;
      const two = T.lines === 2, lineH = two ? T.lineH : T.rowH;        // 2段の行：上の段にシュート・下の段にそれ以外（幅はみな同じ）
      const unit = Math.max(BT.LAYOUT.rmin, Math.min(T.bw, lineH));
      sec.classList.toggle('two', two);
      sec.style.setProperty('--m', spec.m2);
      sec.style.setProperty('--cols', two ? `repeat(${spec.m2}, minmax(0, 1fr))` : cols);
      sec.style.setProperty('--c', T.c);
      sec.style.setProperty('--r', T.r);
      sec.style.setProperty('--nw', T.nw + 'px');
      sec.style.setProperty('--base', Math.ceil(T.base) + 'px');
      const bf = Math.round(BT.clamp(unit * 0.44, 13, 24));
      sec.style.setProperty('--bf', bf + 'px');
      const ff = Math.min(bf, Math.floor((T.bw - 6) / longEm));           // 長い文字（「ファウル」「スティール」など）が入る文字の大きさ
      sec.style.setProperty('--ff', ff + 'px');
      sec.style.setProperty('--nf', Math.round(BT.clamp(Math.min(Math.max(lineH, BT.LAYOUT.rmin) * 0.56, T.nw * 0.5), 14, 30)) + 'px');
      sec.classList.toggle('roomy', T.rowH >= 40 && T.nw >= 46);      // 名前を出す余裕（高さと、背番号の欄の幅）
      sec.classList.toggle('narrowb', (T.bwMin || T.bw) < 48);
      sec.classList.toggle('shortlab', ff < 12);                         // 入らないときは「ファウル」→「F」
      sec.classList.toggle('scroll', lineH < BT.LAYOUT.rmin);
    });
  }

  function onPanelClick(e) {
    const b = e.target.closest('button');
    if (!b) return;
    const sec = b.closest('.team');
    if (!sec) return;
    const tm = Number(sec.dataset.team);
    if (b.dataset.type) record(tm, b.dataset.no === '' ? null : b.dataset.no, b.dataset.type, b);
    else if (b.dataset.add) openKeypad(tm);
  }
  function canRecord() {
    if (rvMode()) {
      if (!rvReady()) { say(S.rv ? '動画を読み込んでいます…' : '先に動画を選んでください（映像の所の「🎬 動画を選ぶ」）', 'warn'); return false; }
      if (S.game.endedAt) { say('記録は終えています（≡ メニュー →「続きを記録する」）', 'warn'); return false; }
      return true;
    }
    if (!S.game.startedAt) { say('先に「▶ スタート」を押してください', 'warn'); return false; }
    if (S.game.endedAt) { say('試合は終わっています', 'warn'); return false; }
    return true;
  }
  /* 1回で記録する：tm＝チーム（null はチームなし）・no＝背番号（null は番号なし）。時刻は押した瞬間（tAt があれば、その時刻） */
  function record(tm, no, type, btn, tAt) {
    if (!canRecord()) return;
    const t0 = now();
    const key = tm + ':' + no + ':' + type;
    if (S.lastTap.key === key && t0 - S.lastTap.at < 450) return;        // 二度押し（同じボタンを 0.45 秒以内）は1回に
    S.lastTap = { key, at: t0 };
    const ev = BT.addEvent(S.game, { t: tAt != null ? tAt : elapsed(), type, team: tm, no });
    S.redo = [];
    save();
    flash(btn);
    feel(BT.TYPE[type].kind);
    updateLive(BT.TYPE[type].pts ? tm : null);
    // シュートの場所：記録したあとで聞く（時刻は押した瞬間のまま。デモの台本の途中では聞かない）
    if (shotLocOn() && !S.demoMode && BT.isLocShot(type)) askShotLoc(ev);
  }

  /* 表示を書き換える（bump：得点が動いたチーム） */
  function setCnt(el, n) {
    const s = n ? String(n) : '';
    if (el.textContent !== s) el.textContent = s;
    el.hidden = !n;
  }
  function updateLive(bump) {
    const g = S.game, L = S.L;
    if (!L) return;
    const started = !!g.startedAt, ended = !!g.endedAt;
    L.start.hidden = started || rvMode();
    { const lab = camOn() && !camRec() ? '● 録画＋スタート' : '▶ スタート'; if (L.start.textContent !== lab) L.start.textContent = lab; L.start.classList.toggle('rec', camOn() && !camRec()); }
    L.clock.hidden = !started;
    L.clock.classList.toggle('ended', ended);
    tickClock(true);
    L.period.textContent = BT.periodLabel(started ? curPeriod() : (g.startPeriod || 1));
    const sc = rvMode() ? BT.score(g, elapsed() + 0.05) : BT.score(g);          // 動画を見ながら：いまの動画の時刻までの得点
    L.score[0].parentNode.classList.toggle('big3', Math.max(sc[0], sc[1]) >= 100);
    [0, 1].forEach((tm) => {
      L.score[tm].textContent = sc[tm];
      L.panels[tm].tsc.textContent = sc[tm];
      if (bump === tm) { flash(L.score[tm]); flash(L.panels[tm].tsc); }
    });
    // ボタンの右上の数（その選手が、そのプレーを何回したか）
    const tl = BT.tally(g);
    L.btns.forEach((b) => {
      const c = tl[b.key] || 0;
      setCnt(b.cnt, c);
      if (b.type === 'foul' && b.el.dataset.no !== '') { b.cnt.classList.toggle('f4', c === 4); b.cnt.classList.toggle('f5', c >= 5); }   // 4つ目は黄・5つ目（退場）は赤
    });
    BT.GLOBAL_TYPES.forEach((type) => setCnt(L.gb[type].cnt, tl['*:' + type] || 0));
    L.gbar.classList.toggle('off', !started || ended);
    // スタートの前・試合が終わったあとは、パネルの上に大きなボタンを出す
    L.cover.innerHTML = '';
    if (!started) {
      const cam = camOn(), recNow = camRec();
      L.cover.append(h('div', { class: 'cover-card' },
        h('button', { class: 'startbig' + (cam && !recNow ? ' recstart' : ''), id: 'btnStartBig', onclick: start },
          cam ? (recNow ? '▶ 記録をスタート' : [h('span', { class: 'rdot' }), '録画と記録をスタート']) : '▶ スタート'),
        h('p', null, h('b', null, 'ティップオフ（試合開始のジャンプボール）の瞬間'), 'に押してください。'),
        h('p', { class: 'note' }, cam ? (recNow ? '録画中です。押すと、記録の時計が動き出します（録画は続けたまま）。' : '押した瞬間に、録画と記録の時計が同時に始まります。') : '時計が動き出し、そこからの時間でプレーを記録します。あとで動画と合わせるときの目印にもなります。'),
        coverCam(),
        h('button', { class: 'btn small', onclick: openPeriod }, `${BT.periodLabel(g.startPeriod || 1)} から始める（変える）`)));
    } else if (ended) {
      L.cover.append(h('div', { class: 'cover-card' },
        h('b', { class: 'endtitle' }, rvMode() ? '記録を終えました' : '試合終了'),
        h('div', { class: 'endscore', id: 'endScore' }, h('span', null, BT.teamName(g, 0)), h('b', null, BT.score(g).join(' − ')), h('span', null, BT.teamName(g, 1))),
        h('button', { class: 'btn primary huge', id: 'btnToHub', onclick: () => go('game') }, '📄 試合のページへ（集計・切り出し・書き出し）'),
        h('div', { class: 'row center' },
          h('button', { class: 'btn', id: 'btnCoverHome', onclick: () => go('home') }, '🏠 ホームへ'),
          h('button', { class: 'btn', onclick: reopen }, '▶ 続きを記録する（まちがえて終えたとき）'))));
    }
    L.cover.hidden = started && !ended;
    renderLast();
    if (L.rvBox) { L.rvKey = ''; L.seekKey = ''; rvSync(); rvPickMarks(); }
  }
  let lastClock = '';
  function tickClock(force) {
    const L = S.L;
    if (!L || !S.game || !S.game.startedAt) return;
    const rv = rvMode();
    const c = gcNow();
    const tt = BT.fmtTime(elapsed(), rv);                 // スタートからの時間（動画を見ながら：動画の時刻）
    const s = c ? BT.gcText(c) : tt;
    const key = c ? `${s}|${tt}|${c.period}${c.done ? 'd' : c.running ? 'r' : 's'}` : s;
    if (force || key !== lastClock) {
      lastClock = key;
      const el = $('#tval'), sub = $('#tsub');
      el.textContent = s;
      el.classList.toggle('long', s.length > 5);
      L.clock.classList.toggle('gc', !!c);
      L.clock.classList.toggle('stopped', !!c && !c.running && !c.done);
      L.clock.classList.toggle('done', !!c && c.done);
      sub.hidden = !c;
      if (c) sub.textContent = (rv ? '🎬 ' : '⏱ ') + tt;
      const tip = c ? `試合時間 ${BT.gcLabel(c)}（${c.done ? '終わり' : c.running ? '動いています。押すと止まります' : '止まっています。押すと動きます'}）・${rv ? '動画の時刻' : 'スタートから'} ${tt}` : rv ? '動画の時刻' : 'スタートからの時間';
      if (L.clock.title !== tip) { L.clock.title = tip; if (c) L.clock.setAttribute('aria-label', tip); else L.clock.removeAttribute('aria-label'); }
    }
    // 残り 0:00 になった瞬間（試合を見ながら記録しているとき）：1回だけ知らせる
    if (c && !rv && !S.game.endedAt) {
      const was = L.gcPrev;
      if (c.done && was && was.running && was.period === c.period) { feel('undo'); say(`${BT.periodLabel(c.period)} の試合時間が終わりました（次のピリオドは、となりのボタンから）`, 'ok', 5000); }
      L.gcPrev = { period: c.period, running: c.running };
    }
  }
  /* 時計を押した：試合時間が出ているときは、止める・動かす（記録の時刻＝スタートからの時間・動画は、止まらない）。出ていなければメニュー */
  function clockTap() {
    const g = S.game;
    if (!gcShown() || g.endedAt) { openMenu(); return; }
    ensureClock(g);
    const c = BT.gcToggle(g, elapsed());
    if (!c) { say(`${BT.periodLabel(curPeriod())} の試合時間は終わっています（次のピリオドは、となりのボタンから。そこで時間も直せます）`, 'warn', 5000); return; }
    save();
    feel(c.running ? 'made' : 'undo');
    tickClock(true);
    say(c.running ? `▶ 試合時間を動かしました（${BT.gcLabel(c)}）` : `⏸ 試合時間を止めました（${BT.gcLabel(c)}）`, 'ok', 2500);
  }
  function tick() {
    if (camRec() && S.camSheet) S.camSheet.draw(true);
    if (S.view !== 'live' || !S.game || !S.L) return;
    if (S.L.rvBox) { rvTick(); return; }
    tickClock();
    if (camRec() && !S.L.wipe.hidden) wipeTag();
  }

  /* 記録の画面のお知らせ：ボタンを隠さないよう、画面の下（いま記録したものの所）に出す（ほかの画面・小窓の上では、ふつうのお知らせ） */
  function say(text, kind, ms, action) {
    if (S.view !== 'live' || !S.L || BT.ui.sheetOpen()) return BT.ui.toast(text, kind, ms, action);
    clearTimeout(S.msgTimer);
    S.msg = { text, kind: kind || '', action };
    S.msgTimer = setTimeout(() => { S.msg = null; if (S.L) renderLast(); }, ms || 2800);
    renderLast();
    return null;
  }

  /* 画面の下：いちばん新しい記録と「取り消す」 */
  const undoBtn = () => h('button', { class: 'btn undo', id: 'btnUndo', 'aria-label': 'いちばん新しい記録を取り消す', onclick: undo }, h('b', null, '↶'), h('small', null, '取り消す'));
  function renderLast() {
    const g = S.game, el = S.L.last;
    el.innerHTML = '';
    if (S.L.rvBox && rvLastbar(el)) return;
    if (S.msg) {
      const m = S.msg;
      // （DOM の append は null を「null」という文字にするので、ないものは渡さない）
      el.append(...[h('div', { class: 'lastev msg ' + m.kind, role: 'status', 'aria-live': 'polite' }, h('span', { class: 'mt' }, m.text)),
        m.action ? h('button', { class: 'btn undo act', id: 'btnMsgAct', onclick: () => { S.msg = null; clearTimeout(S.msgTimer); m.action.onClick(); if (S.L) renderLast(); } }, m.action.label)
          : (g.events.length > 1 ? undoBtn() : null)].filter(Boolean));
      return;
    }
    if (!g.startedAt) { el.append(h('div', { class: 'lastev hint' }, h('span', { class: 'mt' }, 'スタートを押すと、記録できます'))); return; }
    const ev = g.events[g.events.length - 1];
    if (!ev) return;
    const d = BT.TYPE[ev.type];
    const per = ev.type === 'period';
    const nm = !per && ev.no != null ? BT.playerName(g, ev.team, ev.no) : '';
    const who = per ? '' : ev.team == null ? 'チームなし' : `${BT.teamName(g, ev.team)} ${ev.no != null ? '#' + ev.no + (nm ? ' ' + nm : '') : '番号なし'}`;
    // 動画を見ながら：押すと、その記録を直す（📍 映像で時刻を合わせる）
    const tapEdit = S.L.rvBox ? { role: 'button', tabindex: '0', id: 'lastEv', title: 'この記録を直す', onclick: () => openEdit(ev.id) } : { role: 'status' };
    el.append(...[
      h('div', Object.assign({ class: 'lastev' + (S.L.rvBox ? ' tap' : ''), 'aria-live': 'polite', style: { '--tc': per || ev.team == null ? 'var(--line2)' : teamColor(ev.team) } }, tapEdit),
        h('div', { class: 'l1' }, h('b', { class: 'lt' }, BT.fmtTime(ev.t)), h('span', { class: 'll' }, per ? `${BT.periodLabel(ev.period)} 開始` : (d.short || d.label) + (d.pts ? ` +${d.pts}` : ''))),
        per ? null : h('div', { class: 'lw' }, who)),
      g.events.length > 1 ? undoBtn() : null].filter(Boolean));
  }
  function undo() {
    const g = S.game;
    const ev = g.events[g.events.length - 1];
    if (!ev) return;
    if (g.events.length === 1 && ev.type === 'period') { say(rvMode() ? 'まだ記録はありません' : 'スタートは「≡ メニュー」から取り消せます', 'warn', 4000); return; }
    g.events.pop();
    S.redo.push(ev);
    save();
    feel('undo');
    updateLive();
    say(`取り消し：${BT.eventText(g, ev, ev.no == null)}`, 'warn', 4500, { label: '↷ やり直す', onClick: redo });
  }
  function redo() {
    const ev = S.redo.pop();
    if (!ev || !S.game) return;
    S.game.events.push(ev);
    S.game.seq = Math.max(S.game.seq || 0, Number(String(ev.id).slice(1)) || 0);
    save();
    updateLive();
    say('やり直しました', 'ok');
  }

  /* ---------- スタート・終了 ---------- */
  function start() {
    const g = S.game;
    if (!g || g.startedAt) return;
    const t0 = now();
    g.startedAt = t0;
    g.date = BT.ymdAt(t0, g.tz);
    BT.addEvent(g, { t: 0, type: 'period', period: g.startPeriod || 1 });
    delete g.startPeriod;
    if (clockOn()) g.gc = BT.newClock(S.prefs.periodLen, false);         // 試合時間：スタートと同時に動き出す
    save();
    feel('made');
    BT.store.persist();
    BT.ui.keepAwake(true).then((ok) => {
      if (!ok && !S.warnedWake) { S.warnedWake = true; say('自動ロックを止められません（設定で長めに）', 'warn', 6000); }
    });
    guard();
    updateLive();
    // 撮影の準備ができていて、まだ録画していなければ、録画も始める
    if (camOn() && !camRec()) camStart().then(() => { if (camRec()) say('録画も始めました', 'ok', 2500); });
  }
  function cancelStart() {
    const g = S.game;
    g.startedAt = null; g.endedAt = null; g.events = []; g.seq = 0;
    delete g.gc;
    S.redo = [];
    BT.ui.keepAwake(false);
    save();
    updateLive();
    say('スタートを取り消しました', 'ok');
  }
  async function endGame() {
    const g = S.game;
    rvPause();
    g.endedAt = now();
    save();
    updateLive();
    // 撮影していたら、録画を止めて仕上げ、カメラを閉じる
    if (camOn()) {
      say('動画を仕上げています…', '', 15000);
      const v = await camClose();
      if (!(v && v.rotateLost)) say(videoCount(g) ? '動画を保存しました' : '試合を終えました', 'ok', 3000);      // （向きを書けなかった知らせは消さない）
    }
    BT.ui.keepAwake(false);
    BT.cloud.push(g, true);          // 終えたら、すぐクラウドへ
    if (S.guarded && root.history) { S.guarded = false; S.skipPop = true; try { history.back(); } catch (e) { S.skipPop = false; } }
    // 試合のページへ。試合を見ながら記録した試合は「動画のトリミングを行いますか？」
    go('game');
    if (BT.isReview(g)) BT.ui.toast('記録を終えました。集計・場面・書き出しは、この画面からできます', 'ok', 5000);
    else if (g.events.some((e) => e.type !== 'period')) askTrim(g);
  }
  function reopen() {
    S.game.endedAt = null;
    save();
    BT.ui.keepAwake(true);
    guard();
    updateLive();
    say(rvMode() ? '続きを記録できます' : '続きを記録できます（時計は進んだまま）', 'ok', 4000);
  }

  /* 記録の途中で「戻る」（スワイプ・戻るボタン）で、うっかりページを離れないように */
  function guard() {
    if (S.guarded || !root.history || !history.pushState) return;
    history.pushState({ btap: 1 }, '');
    S.guarded = true;
  }
  function onPop() {
    if (S.skipPop) { S.skipPop = false; return; }
    S.guarded = false;
    if (BT.ui.sheetOpen()) { BT.ui.closeSheet(); guard(); return; }
    if (S.view === 'live' && S.game && S.game.startedAt && !S.game.endedAt) {
      guard();
      say('記録中です（終えるときは ≡ メニューから）', 'warn', 4000);
      return;
    }
    if (S.view === 'setup' && S.setupFor === 'edit' && S.game) { go(editBack()); if (editBack() === 'live' && S.game.startedAt && !S.game.endedAt) guard(); return; }
    if (S.view === 'trim' && S.game) { go('game'); return; }
    if (S.view === 'live' && S.game && S.game.endedAt) { go('game'); return; }
    if (S.view !== 'home') go('home');
  }

  /* ---------- ピリオド ---------- */
  function openPeriod() {
    const g = S.game;
    rvPause();
    const started = !!g.startedAt;
    const cur = started ? curPeriod() : (g.startPeriod || 1);
    const pick = (p) => {
      s.close();
      if (!started) { g.startPeriod = p; save(); updateLive(); return; }
      const ev = BT.addEvent(g, { t: elapsed(), type: 'period', period: p });
      S.redo = [];
      save(); feel('made'); updateLive();
      say(`${BT.periodLabel(p)} を始めました（${BT.fmtTime(ev.t)}）`, 'ok');
    };
    const others = [1, 2, 3, 4, 5, 6].filter((p) => p !== cur + 1);
    // 試合時間（設定でオンのとき）：いまの時間と、ずれたときの手直し（出ている数字を、押した分だけ動かす）・止める／動かす
    const c = started && !g.endedAt ? gcNow() : null;
    const adj = (d, lab) => h('button', { class: 'btn small', dataset: { gcadj: String(d) }, onclick: () => {
      const cc = gcNow();
      BT.gcSet(g, elapsed(), cc.left != null ? cc.used - d : cc.used + d);
      save(); tickClock(true); openPeriod();
    } }, lab);
    const gcBox = !c ? null : h('div', { class: 'gcbox', id: 'gcBox' },
      h('b', { id: 'gcNowText' }, `試合時間：${BT.gcLabel(c)}`, h('small', null, c.done ? '（終わり）' : c.running ? '（動いています）' : '（止まっています）')),
      h('div', { class: 'gcadj' }, adj(-60, '−1分'), adj(-10, '−10秒'), adj(-1, '−1秒'), adj(60, '+1分'), adj(10, '+10秒'), adj(1, '+1秒')),
      h('div', { class: 'row' }, h('button', { class: 'btn', id: 'btnGcToggle', disabled: c.done, onclick: () => { clockTap(); openPeriod(); } }, c.running ? '⏸ 試合時間を止める' : '▶ 試合時間を動かす')),
      h('p', { class: 'note' }, `会場の時計とずれたら、上のボタンで合わせます（${c.left != null ? '残りの時間' : '進んだ時間'}を、押した分だけ動かします）。次のピリオドを始めると、${c.len ? BT.fmtTime(c.len) + ' に' : '0:00 に'}戻って動き出します。ピリオドの長さは「設定」の「試合時間」で変えられます。`));
    const s = BT.ui.sheet({
      title: started ? `ピリオド（いまは ${BT.periodLabel(cur)}）` : '始めるピリオド',
      body: h('div', { class: 'periodbox' },
        gcBox,
        started ? h('button', { class: 'btn primary huge', id: 'btnNextPeriod', onclick: () => pick(cur + 1) }, `${BT.periodLabel(cur + 1)} を始める`) : null,
        h('div', { class: 'row pgrid' }, (started ? others : [1, 2, 3, 4, 5]).map((p) => h('button', { class: 'btn' + (!started && p === cur ? ' on' : ''), onclick: () => pick(p) }, started ? `${BT.periodLabel(p)} にする` : BT.periodLabel(p)))),
        h('p', { class: 'note' }, rvMode() ? '動画を、次のピリオドが始まる所（ティップオフ・最初のスローイン）まで動かしてから押します。その動画の時刻が、ピリオドの始まりになります。あとで「記録の一覧」で直せます。' : started ? '次のピリオドが始まる瞬間に押します。始まった時刻が記録に残り、動画で場面を探すときの目印にもなります。押し忘れたら、あとで「記録の一覧」でピリオドの時刻を直せます（それより後の記録は、自動でそのピリオドになります）。' : 'スタートを押したときのピリオドです（途中から記録するときに）。'))
    });
  }

  /* ---------- 番号を足す（記録の途中で、名簿にない番号が出たとき） ---------- */
  function openKeypad(tm) {
    const g = S.game;
    let val = '';
    const disp = h('div', { class: 'kdisp', id: 'kdisp' }, '　');
    const show = () => { disp.textContent = val ? '#' + val : '番号を入れる'; disp.classList.toggle('empty', !val); };
    const press = (k) => {
      if (k === '⌫') val = val.slice(0, -1);
      else if (k === '00') val = '00';
      else if (val === '00' || val.length >= 2) val = k;
      else val = val === '0' ? k : val + k;
      show();
    };
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', '⌫'];
    const s = BT.ui.sheet({
      title: `${BT.teamName(g, tm)} の背番号を足す`, cls: 'keypad',
      body: h('div', null, disp, h('div', { class: 'keys' }, keys.map((k) => h('button', { class: 'key', dataset: { key: k }, onclick: () => press(k) }, k))),
        h('p', { class: 'note' }, '足した番号の行が、番号の順のところに入ります。')),
      foot: [h('button', { class: 'btn', onclick: () => s.close() }, 'やめる'), h('button', { class: 'btn primary', id: 'btnKeyOk', onclick: () => {
        const no = BT.normNo(val);
        if (no == null) { BT.ui.toast('0〜99 の番号を入れてください', 'warn'); return; }
        const t = g.teams[tm];
        const had = t.players.some((p) => p.no === no);
        if (!had) t.players = BT.cleanPlayers(t.players.concat([{ no, name: '' }]));
        save();
        s.close();
        rebuildRoster(tm);
        say(had ? `#${no} はもう並んでいます` : `#${no} を足しました`, had ? 'warn' : 'ok');
      } }, '足す')]
    });
    show();
  }
  function rebuildRoster(tm) {
    if (!S.L || !S.L.panels[tm]) return;
    fillRoster(tm);
    fillPickNos(tm);
    updateLive();
    layoutLive();
  }

  /* ========== 撮影しながら記録する（この端末のカメラ） ==========
     カメラの録画（camera.js）を、記録の画面から動かす。録画を始めた時刻を記録と同じ時計で持つので、
     あとで「✂️ 場面を切り出す」（js/trim.js）で、時刻あわせなしで場面を切り出せる。 */
  const camOn = () => !!(S.cam && S.cam.state !== 'off');
  const camRec = () => !!(S.cam && S.cam.rec);
  const mb = (n) => (n >= 1e9 ? (n / 1e9).toFixed(2) + 'GB' : Math.max(0, Math.round((n || 0) / 1e6)) + 'MB');
  const clockOf = (ms) => (ms ? BT.hmsAt(ms, S.game ? S.game.tz : BT.localTz()).slice(0, 5) : '');
  const videoCount = (g) => (g.videos || []).filter((v) => !v.gone).length;
  function camEnsure() {
    if (S.cam) return S.cam;
    const C = S.cam = BT.camera.create();
    C.on('state', () => { updateCamUI(); if (S.L) updateLive(); });
    C.on('start', (seg) => upsertVideo(seg));
    C.on('done', (v) => { upsertVideo(v); if (S.L) updateLive(); });
    C.on('progress', () => updateCamUI(true));
    // 保存できない（空きが足りない など）・録画のエラー：録画を止めて、そこまでを仕上げる（このあとの分は保存できないため）
    C.on('error', (e) => {
      if (S.camErrAt && Date.now() - S.camErrAt < 3000) return;
      S.camErrAt = Date.now();
      const kind = (e && e.kind) || BT.vstore.kindOf(e);
      const stopWith = (msg) => { if (camRec()) camStop(true).then(() => say(msg, 'err', 12000)); else say(msg, 'err', 12000); };
      if (kind === 'quota') {
        // 本当にいっぱい：このサイトのブラウザの保存場所（iPhone 本体の空きとは別）。そこまでを仕上げて止める
        stopWith('録画を止めました：このサイトのブラウザの保存場所がいっぱいです（iPhone 本体の空きとは別の場所）。撮った動画を「📲 写真に保存」で写真アプリに入れてから、🗑 でこのアプリの中から消すと空きます');
        return;
      }
      // 保存が一度とぎれた（画面を消した・ほかのアプリに切りかえた など）：ここまでを仕上げて、新しい動画として続ける（1分に2回まで）
      const t = Date.now();
      S.camRetry = (S.camRetry || []).filter((x) => t - x < 60000);
      if (camRec() && S.camRetry.length < 2) {
        S.camRetry.push(t);
        camSplit('保存が一度とぎれたので（画面を消した・ほかのアプリに切りかえた など）、ここから新しい動画として録画を続けています');
        return;
      }
      stopWith('録画を止めました：動画をうまく保存できませんでした' + (e && (e.name || e.message) ? '（' + [e.name, e.message].filter(Boolean).join('：') + '）' : '') + '。もう一度「● 録画」を押してください（容量の問題ではありません）');
    });
    C.on('notice', (t) => say(t, 'warn', 5000));
    C.on('trackended', () => onCamLost());
    return C;
  }
  /* 試合の記録に、動画の情報（ファイル名・録画を始めた時刻・長さ）を入れる（書き出す JSON にも入る。中身は入れない） */
  function upsertVideo(v) {
    const g = S.game;
    if (!g || v.gameId !== g.id) return;
    g.videos = g.videos || [];
    const o = { vid: v.vid, n: v.n, startedAt: v.startedAt, endedAt: v.endedAt, duration: v.duration, bytes: v.bytes, mime: v.plan ? 'video/mp4' : v.mime, name: v.name, w: v.w, h: v.h, status: v.status };
    if (v.gone) o.gone = true;
    const i = g.videos.findIndex((x) => x.vid === v.vid);
    if (i >= 0) Object.assign(g.videos[i], o); else g.videos.push(o);
    save();
  }
  async function camOpen() {
    if (!BT.camera.supported()) { BT.ui.toast('この端末・ブラウザでは撮影できません（カメラか録画に対応していません）', 'err', 7000); return false; }
    if (!BT.vstore.supported()) { BT.ui.toast('このブラウザには動画を保存できません（プライベートブラウズ など）', 'err', 7000); return false; }
    const C = camEnsure();
    try { await C.open({ quality: S.prefs.camQuality || '720', audio: S.prefs.camAudio !== false }); } catch (e) {
      const denied = e && (e.name === 'NotAllowedError' || e.name === 'SecurityError');
      BT.ui.toast(denied ? 'カメラの使用が許可されていません。端末の設定（iPhone は 設定 → Safari → カメラ）で、許可してください' : 'カメラを開けませんでした' + (e && e.message ? '（' + e.message + '）' : ''), 'err', 9000);
      return false;
    }
    updateCamUI();
    return true;
  }
  async function camStart() {
    const g = S.game;
    if (!g || S.camBusy || camRec()) return;
    S.camBusy = true;
    try {
      if (!S.cam || !S.cam.live()) { if (!(await camOpen())) return; }
      const [w, h] = rawDims();
      S.camRawLand = w && h ? w >= h : null;          // 録画を始めたときの映像の向き（途中で向きが変わったら、別の動画にする）
      await S.cam.start({ gameId: g.id, n: (g.videos || []).length + 1, base: BT.fileBase(g), rotate: effRot() });
      BT.store.persist();
      BT.ui.keepAwake(true);
      guard();
    } catch (e) { BT.ui.toast('録画を始められませんでした' + (e && e.message ? '：' + e.message : ''), 'err', 7000); } finally { S.camBusy = false; updateCamUI(); if (S.L) updateLive(); }
  }
  async function camStop(quiet) {
    if (!camRec()) return null;
    S.camBusy = true;
    updateCamUI();
    if (!quiet) say('動画を仕上げています…', '', 15000);
    try {
      const v = await S.cam.stop();
      if (v && v.empty) say('録画が短すぎて、動画にできませんでした', 'warn', 4000);
      else if (v && v.rotateLost) say(`動画${v.n}を保存しました。ただし、このブラウザでは動画に向きを書けなかったので、横倒しのまま再生されます`, 'warn', 9000);
      else if (!quiet && v) say(`動画${v.n}を保存しました（${BT.fmtTime(v.duration || 0)}・${mb(v.bytes)}）`, 'ok', 4000);
      return v;
    } finally { S.camBusy = false; updateCamUI(); if (S.L) updateLive(); }
  }
  async function camClose() {
    if (!S.cam) return null;
    const v = await camStop(true);
    await S.cam.close();
    updateCamUI();
    return v;
  }
  /* 画面を離れていた（ほかのアプリ・画面を消した）あと：その間は録画が止まっていることがあるので、新しい動画として続ける */
  async function camSplit(msg) {
    if (!camRec() || S.camBusy) return;
    await camStop(true);
    await camStart();
    if (camRec()) say(msg || '画面を離れていた間は、録画が止まっていたかもしれないので、ここから新しい動画として録画しています', 'warn', 7000);
  }
  /* 映像の大きさ（向き）が変わった：iPhone などを回した。録画中なら、ここから別の動画にする（1本の動画の中で向きが変わらないように） */
  function onCamResize() {
    updateCamUI();
    if (!camRec() || S.camBusy || S.camRawLand == null) return;
    const [w, h] = rawDims();
    if (w && h && (w >= h) !== S.camRawLand) camSplit('映像の向きが変わったので、ここから新しい動画として録画しています');
  }
  async function onCamLost() {
    if (camRec()) await camStop(true);
    if (S.cam) await S.cam.close();
    say('カメラが止まりました（ほかのアプリが使った など）。≡ メニューの「撮影」から再開できます', 'warn', 8000);
  }
  /* 上の帯の小さな映像・撮影の画面の表示を書き換える（progress：数字だけ） */
  /* ---------- 撮る向き ----------
     ・ふつうは、端末を横に向ければ、画面も映像も横になる（画面の向きのロックを外しているとき）
     ・画面の向きのロックをしたまま横に倒すと、画面は縦のまま・映像は横倒しで届く。そのときは「アプリごと横向き」：
       アプリの画面を CSS で 90° 回し（uiRot）、録画には「回して映す」向きを書く（fmp4 の行列。中身は回さない）
     ・それでも映像の向きが合わないとき（端末による違い）は「↻ 映像を回す」で直す（見えている小さな映像が、録れる動画の向き） */
  const rotActive = () => ['90', '270'].includes(document.documentElement.dataset.rot || '');
  /* 録画に書く向き（時計回りの角度） */
  function effRot() {
    if (rotActive()) return S.prefs.camRotF != null ? S.prefs.camRotF : S.prefs.uiRot === 90 ? 270 : 90;
    return S.prefs.camRot || 0;
  }
  /* カメラから届く映像の大きさ（回す前） */
  function rawDims() {
    const v = S.L && S.L.camThumb;
    if (v && v.videoWidth && v.videoHeight) return [v.videoWidth, v.videoHeight];
    const st = S.cam ? S.cam.settings() : {};
    return [st.width || 0, st.height || 0];
  }
  /* 録れる動画の向きが、選んだ向き（横・縦）と合っているか */
  function orientOK() {
    const [w0, h0] = rawDims();
    if (!w0 || !h0) return true;
    const [w, h] = effRot() % 180 ? [h0, w0] : [w0, h0];
    return S.prefs.camOrient === 'port' ? h >= w : w >= h;
  }
  /* アプリごと横向き：記録の画面で、撮影中、端末が縦（画面の向きのロック）のときだけ */
  function applyRot() {
    const de = document.documentElement;
    const want = S.view === 'live' && camOn() && S.prefs.uiRot && root.innerHeight > root.innerWidth ? S.prefs.uiRot : 0;
    const before = de.dataset.rot || '';
    if (want) { de.dataset.rot = String(want); de.style.setProperty('--rvw', root.innerWidth + 'px'); de.style.setProperty('--rvh', root.innerHeight + 'px'); } else delete de.dataset.rot;
    if ((de.dataset.rot || '') !== before && S.L) layoutLive();      // 画面の縦横が入れかわったので、並べ直す
  }
  function setUiRot(r) {
    if (camRec()) { say('録画を止めると変えられます', 'warn'); return; }
    S.prefs.uiRot = r; S.prefs.camRotF = null; savePrefs();
    applyRot(); layoutLive(); updateCamUI(); if (S.L) updateLive();
  }
  function turnVideo() {
    if (camRec()) { say('録画を止めると変えられます', 'warn'); return; }
    const next = (effRot() + 90) % 360;
    if (rotActive()) S.prefs.camRotF = next; else S.prefs.camRot = next;
    savePrefs(); updateCamUI(); if (S.L) updateLive();
  }
  /* 小さな映像・大きな映像を、録れる動画の向きに回して、入れ物いっぱいに映す */
  function fitPreview(box, video, rot, cover) {
    if (!box || !video) return;
    const bw = box.clientWidth, bh = box.clientHeight;
    if (!bw || !bh) return;
    const side = rot % 180 !== 0;
    video.style.width = (side ? bh : bw) + 'px';
    video.style.height = (side ? bw : bh) + 'px';
    video.style.objectFit = cover ? 'cover' : 'contain';
    video.style.transform = `translate(-50%, -50%) rotate(${rot}deg)`;
  }
  /* ---------- 大きなワイプ（中・大） ----------
     記録の画面に、カメラの映像を大きく映す。選手のボタンに重ならないよう、映像の場所を先に取り、
     ボタンは残りの広さで並べ直す（planLayout。ボタンは少し小さくなる）。
       横長の画面（iPad・スマホの横向き）：右側の列。下の帯（パスミス・★・いま記録したもの）も映像の下へ移し、ボタンの行に高さを回す
       縦長の画面：上の帯の下（縦長の動画なら右側の列）
     映像の面積は、記録の画面の 中 約 10%・大 約 20%（横は画面の 45% まで・縦は残りの高さに収まるまで）。
     中は、選手のボタンの行が縦にすべるようになるなら、すべらない大きさまで小さくする（大は、すべっても大きく）。小は、上の帯の中の小さな映像。
     特大は、相手チームの枠を小さくして映像の下に置き、その列（帯）いっぱいに映像を映す。自分のチームは残りの広さに */
  const WIPES = ['s', 'm', 'l', 'x'];
  const WIPE_AREA = { m: 0.1, l: 0.2 };
  const wipeSize = () => (S.view === 'live' && camOn() && S.cam.stream && ['m', 'l', 'x'].includes(S.prefs.camWipe) ? S.prefs.camWipe : null);
  /* 相手チームの枠を、ワイプの中（特大）か、ふつうの場所（2チームの並び）に置く */
  function placeOpp(inWipe) {
    const L = S.L, sec = L.panels[1].sec;
    L.oppMoved = inWipe;
    if (!inWipe) { sec.style.height = ''; sec.classList.remove('oppone'); }
    if (sec.parentNode !== (inWipe ? L.wipe : L.panelsEl)) (inWipe ? L.wipe : L.panelsEl).append(sec);
  }
  const shownRot = () => (camRec() && S.cam.seg ? S.cam.seg.rotate : effRot());        // 映す向き（録画中は、その動画の向き）
  /* 録れる動画の、横÷縦 */
  function wipeAr() {
    const [w0, h0] = rawDims();
    return w0 && h0 ? (shownRot() % 180 ? h0 / w0 : w0 / h0) : 16 / 9;
  }
  const wipeKey = () => { const sz = wipeSize(); return sz ? sz + ':' + wipeAr().toFixed(3) : ''; };
  function layoutWipe() {
    const L = S.L, live = L.root, sz = wipeSize();
    L.wipeKey = wipeKey();
    L.wipeOn = false; L.wipeFallback = false;
    const off = () => { ['side', 'col', 'top', 'x'].forEach((m) => live.classList.remove('dk-' + m)); L.wipe.hidden = true; };
    off();
    if (sz !== 'x') placeOpp(false);
    if (!sz) return;
    const K = BT.LAYOUT;
    const ar = wipeAr();
    const lc = getComputedStyle(live);
    const W = live.clientWidth - parseFloat(lc.paddingLeft) - parseFloat(lc.paddingRight);
    const H = live.clientHeight - parseFloat(lc.paddingTop) - parseFloat(lc.paddingBottom);
    const barH = L.bar.offsetHeight, gH0 = L.gbar.offsetHeight;          // ワイプがないときの、上の帯・下の帯の高さ
    const x = sz === 'x';
    const mode = W >= H ? 'side' : !x && ar < 1 ? 'col' : 'top';
    live.classList.add('dk-' + mode);
    if (x) { live.classList.add('dk-x'); placeOpp(true); }
    if (x) L.panels[1].sec.classList.toggle('oppone', L.panels[1].n <= 1);     // 相手チームが1行だけ（名簿なし）
    L.wipe.hidden = false;
    const gH = L.gbar.offsetHeight;                                      // 横長の画面では、下の帯はワイプの下の列に移る（高さが変わる）
    const wc = getComputedStyle(L.wipe);
    const padX = parseFloat(wc.paddingLeft) + parseFloat(wc.paddingRight), padY = parseFloat(wc.paddingTop) + parseFloat(wc.paddingBottom);
    const gap = parseFloat(wc.columnGap || wc.gap) || 0;                 // 特大：映像と相手チームの枠のすきま
    const n = [L.panels[0].n, L.panels[1].n], headH = L.panels[0].head.offsetHeight || 22, spec = rowSpec();
    const rest = H - barH - gH - padY;
    const MINW = 120;
    let vw;
    if (x) {
      // 特大：映像と、その下に相手チームの枠（小さく。名簿なしなら1行・名簿ありでも2行は見せて、あとは縦にすべらせる）。
      // 横長の画面は右の列（上の帯の下から画面の下まで。下の帯は自分のチームの下）、縦長の画面は上の帯の下の帯
      const oppH = 2 * K.border + headH + 2 * K.rpad + (n[1] <= 1 ? 32 : 2 * 32 + K.rgap);
      let fits;
      if (mode === 'side') {
        // 列の幅は画面の 55% まで（相手チームが1行だけなら 62% まで。相手の枠に空きを作らず、映像を大きく）
        vw = Math.min(W * (n[1] <= 1 ? 0.62 : 0.55) - padX, Math.max(60, H - barH - padY - gap - oppH) * ar);
        fits = (w) => !BT.planTeam(W - w - padX - 2 * K.pad, H - barH - gH, n[0], headH, 3, spec).scroll;
      } else {
        vw = Math.min(W - padX, Math.max(60, rest * 0.4) * ar);
        fits = (w) => !BT.planTeam(W - 2 * K.pad, rest - w / ar - gap - oppH, n[0], headH, 3, spec).scroll;
      }
      vw = Math.max(MINW, vw);
      // 自分のチームの行が縦にすべるようになるなら、すべらない大きさまで映像を小さく（もともとすべるなら、そのまま）
      if (!fits(vw) && fits(MINW)) {
        let a = MINW, b = vw;
        for (let i = 0; i < 10; i++) { const mid = (a + b) / 2; if (fits(mid)) a = mid; else b = mid; }
        vw = a;
      }
      L.oppH = oppH;
      if (mode === 'top') {
        // 縦長の画面：残りの高さに余裕があれば、相手チームの行を多めに見せる（残りの 30% まで。自分のチームの行がすべらない範囲で）
        const free = rest - vw / ar - gap;
        for (let hh = Math.max(oppH, free * 0.3); hh > oppH; hh -= 8) {
          if (!BT.planTeam(W - 2 * K.pad, free - hh, n[0], headH, 3, spec).scroll) { L.oppH = hh; break; }
        }
      }
    } else {
      const maxW = (mode === 'top' ? W : W * 0.45) - padX;
      const maxH = mode === 'top' ? Math.min(rest * 0.4, rest - 120) : rest;
      vw = Math.max(MINW, Math.min(Math.sqrt(WIPE_AREA[sz] * W * H * ar), maxW, Math.max(60, maxH) * ar));
      if (sz === 'm') {
        // 中：選手のボタンの行が縦にすべるようにならない（もともとすべるときは、ボタンが小さくなりすぎない）大きさまで。
        // ボタンの並べ方は、残りの広さで planLayout を試して決める
        const planFor = (w) => BT.planLayout(mode === 'top' ? W : W - w - padX, mode === 'side' ? H - barH : H - barH - gH - (mode === 'top' ? w / ar + padY : 0), n, headH, spec);
        const base = BT.planLayout(W, H - barH - gH0, n, headH, spec);
        const fits = (w) => { const p = planFor(w); return (base.scroll || !p.scroll) && p.size >= Math.min(base.size, 28); };
        if (!fits(vw)) {
          // いちばん小さくしても入らない（小さなスマホに、2チームとも大勢）：上の帯の小さな映像のまま（撮影の画面で、わけを知らせる）
          if (!fits(MINW)) { off(); L.wipeFallback = true; return; }
          let lo = MINW, hi = vw;
          for (let i = 0; i < 10; i++) { const mid = (lo + hi) / 2; if (fits(mid)) lo = mid; else hi = mid; }
          vw = lo;
        }
      }
    }
    L.wipeOn = true;
    L.wipeBox.classList.toggle('tiny', vw < 220);          // 小さめのワイプ：「－」「＋」も小さく
    L.wipeBox.style.width = Math.floor(vw) + 'px';
    L.wipeBox.style.height = Math.floor(vw / ar) + 'px';
    // 縦長の画面の特大：相手チームの枠の高さを決めておく（中身の行の数で、帯が伸びないように）
    L.panels[1].sec.style.height = x && mode === 'top' ? Math.round(L.oppH) + 'px' : '';
    fitPreview(L.wipeBox, L.wipeVid, shownRot(), true);
  }
  /* ワイプの大きさを変える（v：'s' | 'm' | 'l'、または ＋1・−1） */
  function setWipe(v) {
    const cur = Math.max(0, WIPES.indexOf(S.prefs.camWipe));
    const next = typeof v === 'number' ? WIPES[BT.clamp(cur + v, 0, WIPES.length - 1)] : v;
    if (!WIPES.includes(next) || next === S.prefs.camWipe) return;
    S.prefs.camWipe = next;
    savePrefs();
    layoutLive();
    updateCamUI();
    if (next === 's' && S.L && !S.camSheet) say('ワイプを小さくしました（上の帯の映像を押すと、撮影の画面で大きくできます）', 'ok', 4000);
    if (next === 'x' && S.L && !S.camSheet) say('特大：相手チームの欄を小さくして、映像の下に移しました', 'ok', 4500);
  }
  /* ワイプの左下：録画中なら、録画の時間 */
  function wipeTag() {
    const t = S.L.wipeTag, rec = camRec();
    const s = rec ? `● 録画 ${BT.fmtTime(S.cam.elapsed())}` : S.camBusy || S.cam.state === 'finishing' ? '仕上げ中…' : '録画していません';
    if (t.textContent !== s) t.textContent = s;
    t.classList.toggle('rec', rec);
  }
  function updateCamUI(progress) {
    const L = S.L;
    applyRot();
    if (L && L.camBtn) {
      const on = !!(camOn() && S.cam.stream);
      if (wipeKey() !== L.wipeKey) layoutLive();        // ワイプが出た・消えた・大きさや縦横が変わった：置き場所とボタンの並べ方をやり直す
      const big = !!(on && L.wipeOn);
      L.camBtn.hidden = !on || big;
      L.camBtn.classList.toggle('rec', camRec());
      L.camBtn.classList.toggle('warn', on && !orientOK());
      // 上の帯の小さな映像は、隠れていても映像をつないでおく（映像の大きさで、カメラの向きが変わったことが分かるため）
      if (on && L.camThumb.srcObject !== S.cam.stream) { L.camThumb.srcObject = S.cam.stream; L.camThumb.muted = true; const p = L.camThumb.play(); if (p && p.catch) p.catch(() => {}); }
      if (!on && L.camThumb.srcObject) L.camThumb.srcObject = null;
      if (on && !big) {
        const [w, h] = rawDims();
        const rot = shownRot();
        if (w && h) L.camBtn.style.setProperty('--ar', String(rot % 180 ? h / w : w / h));
        fitPreview(L.camBtn, L.camThumb, rot, true);
      }
      if (big) {
        if (L.wipeVid.srcObject !== S.cam.stream) { L.wipeVid.srcObject = S.cam.stream; L.wipeVid.muted = true; const p = L.wipeVid.play(); if (p && p.catch) p.catch(() => {}); }
        L.wipeBox.classList.toggle('rec', camRec());
        L.wipeBox.classList.toggle('warn', !orientOK());
        L.wipeBig.disabled = S.prefs.camWipe === 'x';
        wipeTag();
        fitPreview(L.wipeBox, L.wipeVid, shownRot(), true);
      } else if (L.wipeVid.srcObject) L.wipeVid.srcObject = null;
    }
    if (S.camSheet) S.camSheet.draw(progress);
  }
  async function storageText() {
    const e = await BT.vstore.estimate();
    if (!e || !e.quota) return '';
    const free = Math.max(0, e.quota - e.usage);
    const q = BT.camera.QUALITY[S.prefs.camQuality || '720'];
    const hours = free / 1e9 / q.perHour;
    return `動画をためる場所（このブラウザの中）の空き ${mb(free)}（${q.label.replace(/（.*/, '')} で約 ${hours >= 10 ? Math.floor(hours) : hours.toFixed(1)} 時間）${hours < 1.2 ? '・⚠ 1試合ぶん入らないかもしれません。撮った動画を写真に保存して、このアプリの中から消すと空きます' : ''}`;
  }
  /* 撮影の画面（大きな映像・撮る向き・録画と記録を同時にスタート・録画を始める／止める・空き容量） */
  async function openCamera() {
    if (!camOn() && !(await camOpen())) return;
    const C = S.cam;
    const big = h('video', { class: 'campv', muted: true, playsinline: true, autoplay: true });
    big.muted = true; big.playsInline = true; big.srcObject = C.stream;
    { const p = big.play(); if (p && p.catch) p.catch(() => {}); }
    const pvbox = h('div', { class: 'campvw' }, big);
    const stat = h('div', { class: 'camstat', id: 'camStat', role: 'status' });
    const info = h('div', { class: 'note', id: 'camInfo' });
    const orient = h('div', { class: 'camorient', id: 'camOrient' });
    const wipeRow = h('div', { class: 'row wiperow', id: 'camWipe' });
    const store = h('div', { class: 'note', id: 'camStore' });
    const acts = h('div', { class: 'camacts' });
    let lastKey = '';
    /* 大きな映像の入れ物：録れる動画の縦横の比で、画面に収まる大きさ */
    const fitBig = () => {
      const [w0, h0] = rawDims();
      const rot = camRec() && S.cam.seg ? S.cam.seg.rotate : effRot();
      const ar = w0 && h0 ? (rot % 180 ? h0 / w0 : w0 / h0) : 16 / 9;
      const appH = (S.L && S.L.root && S.L.root.clientHeight) || root.innerHeight;
      const maxW = pvbox.parentNode ? pvbox.parentNode.clientWidth : 600, maxH = Math.max(140, appH * 0.42);
      let bw = maxW, bh = bw / ar;
      if (bh > maxH) { bh = maxH; bw = bh * ar; }
      pvbox.style.width = Math.round(bw) + 'px'; pvbox.style.height = Math.round(bh) + 'px';
      fitPreview(pvbox, big, rot, false);
    };
    const draw = (progress) => {
      if (!S.cam) return;
      const rec = camRec(), busy = !!S.camBusy || S.cam.state === 'finishing';
      const seg = S.cam.seg, started = !!S.game.startedAt, ended = !!S.game.endedAt;
      stat.className = 'camstat' + (rec ? ' rec' : '');
      stat.textContent = busy && !rec ? '動画を仕上げています…' : rec ? `● 録画中 ${BT.fmtTime(S.cam.elapsed())}・${mb(seg ? seg.bytes : 0)}（動画${seg ? seg.n : ''}）` : S.cam.state === 'off' ? 'カメラは切れています' : 'カメラの準備ができています（まだ録画していません）';
      const [w0, h0] = rawDims();
      const rot = rec && seg ? seg.rotate : effRot();
      const [w, hh] = rot % 180 ? [h0, w0] : [w0, h0];
      info.textContent = `${w || '?'}×${hh || '?'}（${w >= hh ? '横向き' : '縦向き'}）・${S.cam.opts && S.cam.opts.audio ? '音あり' : '音なし'}`;
      fitBig();
      if (progress) return;
      const ok = orientOK(), land = S.prefs.camOrient !== 'port';
      const fb = !!(S.L && S.L.wipeFallback);
      const key = [rec, busy, S.cam.state, started, ended, ok, land, rotActive(), S.prefs.uiRot, rot, S.prefs.camWipe, fb].join();
      if (key === lastKey) return;
      lastKey = key;
      // 記録の画面のワイプ（カメラの映像）の大きさ
      wipeRow.innerHTML = '';
      wipeRow.append(h('b', null, 'ワイプの大きさ'),
        ...[['s', '小'], ['m', '中'], ['l', '大'], ['x', '特大']].map(([v, lab]) => h('button', { class: 'btn small' + ((S.prefs.camWipe || 'm') === v ? ' on' : ''), dataset: { wipe: v }, 'aria-pressed': String((S.prefs.camWipe || 'm') === v), onclick: () => setWipe(v) }, lab)),
        h('span', { class: 'note' }, fb
          ? 'この画面の大きさと人数では、中にすると選手のボタンが入りきらないので、上の帯に小さく映しています。大にすると大きく映せます（行を縦にすべらせて選びます）'
          : '記録の画面に映す映像。中・大は、選手のボタンに重ならない所に出します（中はボタンの行がすべらない大きさまで・大はもっと大きく）。特大は、相手チームの欄を小さくして映像の下に移し、その分、映像を大きく映します（自分のチームのボタンは広いまま）'));
      // 撮る向き
      orient.innerHTML = '';
      orient.append(h('div', { class: 'row' }, h('b', null, '撮る向き'),
        [['land', '横向き（コート全体）'], ['port', '縦向き']].map(([v, lab]) => h('button', { class: 'btn small' + ((S.prefs.camOrient || 'land') === v ? ' on' : ''), dataset: { orient: v }, disabled: rec,
          onclick: () => { S.prefs.camOrient = v; if (v === 'port') S.prefs.uiRot = 0; savePrefs(); applyRot(); layoutLive(); updateCamUI(); if (S.L) updateLive(); } }, lab))));
      if (rotActive()) {
        orient.append(h('div', { class: 'orientbox ok' },
          h('p', null, `📱 アプリごと横向きにしています（スマホの上側を${S.prefs.uiRot === 90 ? '左' : '右'}に向けて使う）。画面の文字がさかさまなら、反対向きを選んでください。`),
          h('div', { class: 'row' },
            h('button', { class: 'btn small', id: 'btnRotFlip', disabled: rec, onclick: () => setUiRot(S.prefs.uiRot === 90 ? 270 : 90) }, '上下を入れかえる'),
            h('button', { class: 'btn small', id: 'btnRotOff', disabled: rec, onclick: () => setUiRot(0) }, '元に戻す（縦の画面）'))));
      } else if (!ok) {
        orient.append(h('div', { class: 'orientbox warn', id: 'orientWarn' },
          h('p', null, h('b', null, land ? '⚠ いまは縦向きの映像です。スマホを横向きにしてください。' : '⚠ いまは横向きの映像です。端末を縦向きにしてください。')),
          land ? [
            h('p', { class: 'note' }, '横にしても画面が回らないとき（画面の向きのロック中）は、アプリごと横向きにできます：'),
            h('div', { class: 'row' },
              h('button', { class: 'btn', id: 'btnRot90', disabled: rec, onclick: () => setUiRot(90) }, '⟲ 上側を左にして使う'),
              h('button', { class: 'btn', id: 'btnRot270', disabled: rec, onclick: () => setUiRot(270) }, '⟳ 上側を右にして使う'))
          ] : null));
      }
      orient.append(h('div', { class: 'row turnrow' },
        h('span', { class: 'note' }, '上の映像の向きが、録れる動画の向きです。横倒し・さかさまのときは'),
        h('button', { class: 'btn small', id: 'btnTurn', disabled: rec, onclick: turnVideo }, '↻ 映像を回す')));
      // 回して映す向きは、MP4 の目次に書く。WebM（Firefox など）には書けないので、先に知らせる
      if (rot && /webm/.test(rec && seg ? seg.mime : BT.camera.pickMime(!!(S.cam.opts && S.cam.opts.audio)))) {
        orient.append(h('p', { class: 'orientbox warn', id: 'rotWebm' }, '⚠ このブラウザの録画（WebM）には向きを書けないので、動画は横倒しのまま保存されます。画面の向きのロックを外して端末を横にするか、Safari・Chrome で開いてください。'));
      }
      if (rec) orient.append(h('p', { class: 'note' }, '向きは、録画を止めると変えられます。'));
      // ボタン
      acts.innerHTML = '';
      if (rec) {
        if (!started) acts.append(h('button', { class: 'btn startboth', id: 'btnCamBoth', onclick: () => { BT.ui.closeSheet(); start(); } }, '▶ 記録もスタート（ティップオフで押す）'));
        acts.append(h('button', { class: 'btn danger-fill', id: 'btnCamStop', disabled: busy, onclick: () => camStop() }, '■ 録画を止める'));
      } else if (S.cam.state !== 'off') {
        if (!started) {
          acts.append(h('button', { class: 'btn startboth rec', id: 'btnCamBoth', disabled: busy, onclick: () => { BT.ui.closeSheet(); start(); } }, h('span', { class: 'rdot' }), '録画と記録を同時にスタート'),
            h('p', { class: 'note bothnote' }, 'ティップオフ（試合開始のジャンプボール）の瞬間に押すと、録画と記録の時計が同時に始まります。'));
        }
        acts.append(h('div', { class: 'row' },
          h('button', { class: 'btn' + (started ? ' recbtn' : ''), id: 'btnCamRec', disabled: busy || ended, onclick: () => camStart() }, started ? '● 録画を始める' : '● 録画だけ先に始める（ウォーミングアップから撮る）'),
          h('button', { class: 'btn', id: 'btnCamOff', disabled: busy, onclick: () => { camClose().then(() => BT.ui.closeSheet()); } }, 'カメラを切る')));
      }
    };
    S.camSheet = { draw };
    big.addEventListener('resize', () => draw());
    BT.ui.sheet({
      title: '📹 撮影しながら記録', cls: 'camsheet',
      body: h('div', null, pvbox, stat, info, wipeRow, orient, acts, store,
        h('ul', { class: 'camnotes note' },
          h('li', null, '「試合を終える」で、録画も止まります。動画はこの端末（このブラウザ）に保存され、終わったあと「📹 撮影した動画で切り出す」で、時刻あわせなしで場面を切り出せます'),
          h('li', null, '録画を止めて、また始めると、別の動画になります（どれも、記録と時刻が合っています）'),
          h('li', null, 'ほかのアプリに切りかえたり、画面を消したりすると、録画は止まります（戻ると、新しい動画として続けます）'),
          h('li', null, '電池をたくさん使います。電源につないでおくと安心です'))),
      onClose: () => { big.srcObject = null; S.camSheet = null; }
    });
    draw();
    requestAnimationFrame(() => draw());
    storageText().then((t) => { store.textContent = t; });
  }
  /* スタート前の札の中：撮影 */
  function coverCam() {
    if (!BT.camera.supported()) return null;
    if (!camOn()) return h('button', { class: 'btn camon', id: 'btnCamOn', onclick: openCamera }, '📹 撮影しながら記録する（この端末のカメラ）');
    return h('div', { class: 'covercam' + (camRec() ? ' rec' : '') + (orientOK() ? '' : ' warn') },
      h('span', null, !orientOK() ? '⚠ 縦向きの映像です（撮影の画面で向きを設定）' : camRec() ? `● 録画中 ${BT.fmtTime(S.cam.elapsed())}` : '📹 カメラの準備OK'),
      h('button', { class: 'btn small', id: 'btnCamSheet', onclick: openCamera }, '撮影の画面'));
  }
  /* 撮影した動画の一覧（試合のあと・書き出す） */
  function videoItems(g) {
    const vs = (g.videos || []).filter((v) => !v.gone);
    if (!vs.length) return null;
    return h('div', { class: 'vlist' }, vs.map((v) => h('div', { class: 'vitem', dataset: { vid: v.vid } },
      h('div', { class: 'vt' }, h('b', null, `📹 動画${v.n}`), h('small', null, `${clockOf(v.startedAt)}から・${BT.fmtTime(v.duration || 0)}・${mb(v.bytes)}${v.status === 'recording' ? '・録画中' : ''}`)),
      h('div', { class: 'row vacts' },
        h('button', { class: 'btn small primary', dataset: { clip: v.vid }, disabled: v.status === 'recording', onclick: () => toClips(g, v) }, '🎬 場面を切り出す'),
        h('button', { class: 'btn small' + (v.savedAt ? ' done' : ''), dataset: { savevid: v.vid }, disabled: v.status === 'recording', onclick: () => saveVideo(g, v) }, v.savedAt ? '✓ 保存した' : BT.ui.canShareFiles() ? '📲 写真に保存' : '⬇ 保存'),
        h('button', { class: 'btn small danger', title: 'この端末から消す', 'aria-label': `動画${v.n}をこの端末から消す`, disabled: v.status === 'recording', onclick: () => deleteVideo(g, v) }, '🗑')))));
  }
  function toClips(g, v) {
    if (!S.game || S.game.id !== g.id) setGame(g);
    openTrim({ vid: v.vid });
  }
  /* 動画を、この端末の写真アプリ（またはファイル）へ。iPhone・iPad は共有シートの「ビデオを保存」で写真に入る（iCloud 写真を使っていれば iCloud にも） */
  async function saveVideo(g, v) {
    BT.ui.toast('動画を用意しています…', '', 3000);
    let f = null;
    try { f = await BT.vstore.file(v.vid); } catch (e) { f = null; }
    if (!f) { BT.ui.toast('この動画は、この端末にはもうありません', 'err', 5000); return; }
    const r = await BT.ui.shareOrDownload(f.name || v.name, f, true);
    if (r !== 'downloaded' && r !== 'shared') return;
    v.savedAt = Date.now();
    save();
    if (S.L) updateLive();
    BT.ui.toast(r === 'shared'
      ? '「ビデオを保存」を選んでいれば、写真アプリに入っています（iCloud 写真を使っていれば iCloud にも）。写真アプリで確かめたら、🗑 でこのアプリの中から消すと、次の試合の分が空きます'
      : `保存しました：${f.name || v.name}（「ファイル」アプリのダウンロード）。確かめたら、🗑 でこのアプリの中から消すと空きます`, 'ok', 9000);
  }
  function deleteVideo(g, v) {
    BT.ui.confirm(`動画${v.n}をこの端末から消しますか？`, `${BT.fmtTime(v.duration || 0)}・${mb(v.bytes)}。消すと元に戻せません（保存した動画・記録は残ります）。`, '消す', async () => {
      try { await BT.vstore.remove(v.vid); } catch (e) { /* もうない */ }
      v.gone = true;
      save();
      if (S.L) updateLive();
      BT.ui.toast('消しました', 'ok');
    }, true);
  }

  /* ========== 動画を見ながら記録する（撮った動画を読み込んで、動画の時刻で記録する） ==========
     記録の t は「動画の時刻」。動画は止めたり、戻したり、コマ送りしたりしながら記録できる（リアルタイムでなくてよい）。
     動画の中身は持たない（ファイル名・大きさ・長さだけ）。続きを記録するときは、同じ動画をもう一度選ぶ。
     試合の startedAt と、videos の1本（file: true）の startedAt を同じにしておくので、
     記録を終えたあと「✂️ 場面を切り出す」（js/trim.js）で、同じ動画のまま時刻あわせなしで場面を切り出せる。
     入力は2通り：選手ごとの行（ふつうの記録と同じ）か、「2P → 14番」（プレーと背番号を1つずつ選ぶ。どちらが先でもよい）。
     自動のときは、選手ごとの行が縦にすべらずに入るなら行、入らなければ「2P → 14番」 */
  const RV_RATES = [1, 0.5, 0.25, 2];
  const PICK_KEEP = 20;          // 選びかけ（プレーか背番号の片方だけ押した）を覚えておく、動画の時刻の幅（秒）
  const FPS_STD = [24, 25, 30, 48, 50, 60, 90, 100, 120, 240];
  const NOTES = () => root.BS && root.BS.notes;
  function rvMode() { return !!(S.game && BT.isReview(S.game)); }
  const rvReady = () => !!(S.rv && S.rv.ready && S.game && S.rv.gameId === S.game.id);
  /* 動画のいまの時刻（0.1 秒まで）。動画がまだないときは、前に見ていた所 */
  function rvNow() {
    if (rvReady()) return Math.round(S.rv.el.currentTime * 10) / 10;
    return (S.game && S.game.rvPos) || 0;
  }
  const pickTypeLabel = (type) => { const d = BT.TYPE[type]; return d.kind === 'miss' ? BT.TYPE[d.shot].btn + '×' : d.btn; };

  /* 動画のファイルを1つ選んでもらう */
  function pickVideo(cb) {
    if (S.demoFile) { const f = S.demoFile; setTimeout(() => cb(f), 0); return; }      // デモ：見本の動画を使う（js/demo.js）
    const stale = document.getElementById('rvFile');
    if (stale) stale.remove();                 // 前に、選ばずにやめたもの
    const inp = h('input', { type: 'file', id: 'rvFile', accept: 'video/*,.mp4,.mov,.m4v,.webm', style: { display: 'none' } });
    inp.addEventListener('change', () => { const f = inp.files && inp.files[0]; inp.remove(); if (f) cb(f); });
    inp.addEventListener('cancel', () => inp.remove());
    document.body.appendChild(inp);
    inp.click();
  }
  /* 試合の準備から：動画を選んで、記録の画面へ */
  function toReview() {
    pickVideo((file) => {
      if (!S.draft) return;
      const T = S.draft.teams;
      saveTeams();
      const g = BT.newGame({ teams: T, title: (S.draft.title || '').trim() });
      if (S.demoMode) g.demo = true;
      S.draft = null;
      const t0 = now();
      Object.assign(g, { mode: 'video', src: { name: file.name, size: file.size || null, duration: null, w: null, h: null }, startedAt: t0, date: BT.ymdAt(t0, g.tz), notes: [], rvPos: 0 });
      BT.addEvent(g, { t: 0, type: 'period', period: 1 });
      if (clockOn()) g.gc = BT.newClock(S.prefs.periodLen, true);         // 試合時間：動画のはじめは止めておく（ティップオフの所で、時間を押して動かす）
      g.videos = [{ vid: 'file1', n: 1, startedAt: t0, endedAt: null, duration: null, name: file.name, mime: file.type || '', w: null, h: null, bytes: file.size || null, status: 'done', gone: true, file: true }];
      BT.store.saveGame(g);
      BT.store.persist();
      openGame(g);
      rvAttach(file);
    });
  }
  const rvPick = () => pickVideo(rvAttach);
  /* 動画をつなぐ（前の動画は外す） */
  function rvAttach(file) {
    const g = S.game;
    if (!g || !rvMode()) return;
    rvRelease();
    const el = document.createElement('video');
    el.className = 'rvv';
    el.playsInline = true; el.setAttribute('playsinline', ''); el.setAttribute('webkit-playsinline', '');
    el.preload = 'auto';
    const R = S.rv = { gameId: g.id, file, url: URL.createObjectURL(file), el, ready: false, dur: 0, ar: 0, fps: 0, rate: 1, pick: null, adj: null, raf: 0 };
    el.addEventListener('loadedmetadata', () => rvMeta(R));
    ['play', 'pause', 'seeked', 'ratechange', 'ended'].forEach((ev) => el.addEventListener(ev, () => { if (S.rv === R) rvSync(); }));
    el.addEventListener('play', () => { if (S.rv === R) { rvLoop(); rvFpsProbe(R); } });
    el.addEventListener('pause', () => { if (S.rv === R && R.ready) save(); });
    el.addEventListener('error', () => {
      if (S.rv !== R) return;
      rvRelease();
      if (S.L) rvSync();
      say('この動画は、このブラウザでは再生できませんでした（iPhone で撮った動画なら、写真アプリから選び直してください）', 'err', 9000);
    });
    el.src = R.url;
    try { el.load(); } catch (e) { /* 古いブラウザ */ }
    rvMount();
    if (S.L) rvSync();
  }
  /* 長さ・大きさが分かった：記録に動画の情報を入れ、前に見ていた所へ */
  function rvMeta(R) {
    if (S.rv !== R) return;
    const g = S.game, el = R.el;
    R.ready = true;
    R.dur = isFinite(el.duration) ? el.duration : 0;
    R.ar = el.videoWidth && el.videoHeight ? el.videoWidth / el.videoHeight : 16 / 9;
    el.playbackRate = R.rate;
    const src = g.src = g.src || {};
    const plays = g.events.some((e) => e.type !== 'period');
    const same = !src.duration || !R.dur || Math.abs(src.duration - R.dur) <= Math.max(1.5, src.duration * 0.005);
    R.match = same || !plays;
    if (!same && !plays) g.rvPos = 0;          // まだ記録がなくて、別の動画に替えた：前の動画で見ていた所は使わない（記録がある試合では、元の所を覚えたままにする）
    if (R.match) {
      Object.assign(src, { name: R.file.name, size: R.file.size || null, duration: Math.round(R.dur * 100) / 100 || null, w: el.videoWidth || null, h: el.videoHeight || null });
      const v = (g.videos || []).find((x) => x.file);
      if (v) Object.assign(v, { name: src.name, bytes: src.size, duration: src.duration, w: src.w, h: src.h, mime: R.file.type || v.mime || '' });
    } else {
      say(`⚠ 記録したときの動画と長さが違います（前：${BT.fmtTime(src.duration)}・いま：${BT.fmtTime(R.dur)}）。同じ動画を選ぶと、記録の時刻が合います`, 'warn', 10000, { label: '選び直す', onClick: rvPick });
    }
    const pos = R.match && g.rvPos > 0 && g.rvPos < R.dur - 0.5 ? g.rvPos : 0;
    el.currentTime = pos || 0.001;          // （iPhone は、時刻を決めないと最初のコマを映さない）
    save();
    if (S.L) { layoutLive(); rvSync(); }
  }
  /* 動画を外す（試合の一覧へ戻る・別の試合を開く・別の動画を選ぶとき）。見ていた所は覚えておく */
  function rvRelease() {
    const R = S.rv;
    if (!R) return;
    try { R.el.pause(); } catch (e) { /* 無視 */ }
    if (R.ready && R.match && S.game && S.game.id === R.gameId) { S.game.rvPos = Math.round(R.el.currentTime * 10) / 10; }
    S.rv = null;
    if (S.game && S.game.id === R.gameId) save();
    cancelAnimationFrame(R.raf);
    try { R.el.removeAttribute('src'); R.el.load(); } catch (e) { /* 無視 */ }
    R.el.remove();
    try { URL.revokeObjectURL(R.url); } catch (e) { /* 無視 */ }
  }
  /* 記録の画面を作り直しても、同じ動画の要素をそのまま使う（止めずに入れかえる） */
  function rvMount() {
    const L = S.L, R = S.rv;
    if (!L || !L.rvStage || !R) return;
    if (R.el.parentNode !== L.rvStage) L.rvStage.insertBefore(R.el, L.rvStage.firstChild);
  }
  function rvToggle() {
    if (!rvReady()) { if (!S.rv) rvPick(); return; }
    const el = S.rv.el;
    if (el.paused || el.ended) { const p = el.play(); if (p && p.catch) p.catch(() => {}); } else el.pause();
  }
  function rvPause() { if (rvReady() && !S.rv.el.paused) S.rv.el.pause(); }
  /* t 秒から再生する（ボタンを押した、その操作の中で呼ぶ） */
  function rvPlayFrom(t) {
    if (!rvReady()) return;
    const el = S.rv.el;
    el.currentTime = BT.clamp(t, 0, Math.max(0, (S.rv.dur || 0) - 0.05));
    const p = el.play();
    if (p && p.catch) p.catch(() => {});
    rvSync();
  }
  /* t 秒へ（動いたら resolve） */
  function rvSeekTo(t) {
    if (!rvReady()) return Promise.resolve();
    const el = S.rv.el, end = Math.max(0, (S.rv.dur || el.duration || 0) - 0.01);
    t = BT.clamp(t, 0, end);
    return new Promise((res) => {
      let done = false;
      const fin = () => { if (done) return; done = true; el.removeEventListener('seeked', fin); rvSync(); res(); };
      el.addEventListener('seeked', fin);
      setTimeout(fin, 900);
      el.currentTime = t;
    });
  }
  const rvSeekBy = (d) => (rvReady() ? rvSeekTo(S.rv.el.currentTime + d) : Promise.resolve());
  /* 1コマずつ（コマの真ん中の時刻へ。1秒のコマ数は、再生したときに測る。分からなければ 30） */
  function rvStep(d) {
    if (!rvReady()) return Promise.resolve();
    const el = S.rv.el;
    if (!el.paused) el.pause();
    const fps = S.rv.fps || 30;
    const n = Math.floor(el.currentTime * fps + 1e-3);
    return rvSeekTo((n + d + 0.5) / fps);
  }
  function rvRateNext() {
    const R = S.rv;
    if (!R) return;
    R.rate = RV_RATES[(RV_RATES.indexOf(R.rate) + 1) % RV_RATES.length];
    R.el.playbackRate = R.rate;
    if (R.ready && !R.el.paused) rvFpsProbe(R);          // （×1 以下に戻したら、コマ数を測る）
    rvSync();
  }
  /* 1秒のコマ数を測る（再生中のコマとコマの時刻の差のうち、いちばん小さいもの → よくあるコマ数に丸める） */
  function rvFpsProbe(R) {
    const el = R.el;
    if (R.fpsDone || R.fpsBusy || typeof el.requestVideoFrameCallback !== 'function') return;
    R.fpsBusy = true;
    let last = null, n = 0;
    R.fpsBest = R.fpsBest || Infinity;
    const cb = (t, meta) => {
      if (S.rv !== R) return;
      // 速い再生（×2）では、映らないコマがあって差が大きく出るので、測らない（×1 以下で再生したときに測る）
      if (el.playbackRate > 1) { R.fpsBusy = false; return; }
      if (last != null && meta.mediaTime > last + 1e-4) R.fpsBest = Math.min(R.fpsBest, meta.mediaTime - last);
      last = meta.mediaTime;
      if (R.fpsBest < 1) { const f = 1 / R.fpsBest; R.fps = FPS_STD.reduce((a, b) => (Math.abs(b - f) < Math.abs(a - f) ? b : a)); }
      if (++n >= 60) { R.fpsDone = true; R.fpsBusy = false; return; }
      if (el.paused || el.ended) { R.fpsBusy = false; return; }
      el.requestVideoFrameCallback(cb);
    };
    el.requestVideoFrameCallback(cb);
  }
  /* 再生中は、コメント・位置の線を、なめらかに描き直す */
  function rvLoop() {
    const R = S.rv;
    if (!R || R.raf) return;
    const step = () => {
      R.raf = 0;
      if (S.rv !== R || !S.L) return;
      rvDrawNotes();
      if (R.el.paused || R.el.ended) return;
      rvDrawSeek();
      R.raf = requestAnimationFrame(step);
    };
    R.raf = requestAnimationFrame(step);
  }

  /* ---------- 記録の画面の中の動画（映像・位置のバー・操作のボタン） ---------- */
  function rvBuild() {
    const L = S.L;
    L.root.classList.add('rv');
    L.rvNotes = h('canvas', { class: 'rvnotes', 'aria-hidden': 'true' });
    L.rvCover = h('div', { class: 'rvcover', id: 'rvCover' });
    L.rvStage = h('div', { class: 'rvstage', id: 'rvStage' }, L.rvNotes, L.rvCover);
    // 映像を押すと、再生・一時停止
    L.rvStage.addEventListener('click', (e) => { if (!e.target.closest('button')) rvToggle(); });
    L.rvSeek = h('canvas', { class: 'rvseek', id: 'rvSeek', role: 'slider', 'aria-label': '動画の位置（指でなぞって動かす）' });
    const b = (id, label, aria, fn, cls) => h('button', { class: 'rvb' + (cls ? ' ' + cls : ''), id, 'aria-label': aria, title: aria, onclick: fn }, label);
    L.rvPlay = b('rvPlay', '▶', '再生・一時停止', rvToggle, 'play');
    L.rvBack = b('rvBack', '−5', '5秒もどる', () => rvSeekBy(-5));
    L.rvFwd = b('rvFwd', '+5', '5秒すすむ', () => rvSeekBy(5));
    L.rvPrev = h('button', { class: 'rvb step', id: 'rvPrev', 'aria-label': '1コマもどる', title: '1コマもどる（押し続けると続けて）' }, h('b', null, '◀'), h('small', null, 'コマ'));
    L.rvNext = h('button', { class: 'rvb step', id: 'rvNext', 'aria-label': '1コマすすむ', title: '1コマすすむ（押し続けると続けて）' }, h('b', null, '▶'), h('small', null, 'コマ'));
    holdRepeat(L.rvPrev, () => rvStep(-1));
    holdRepeat(L.rvNext, () => rvStep(1));
    L.rvRate = b('rvRate', '×1', '再生の速さ（×1・×0.5・×0.25・×2）', rvRateNext, 'rate');
    L.rvNote = b('rvNote', '💬', 'この場面にコメント・スタンプを入れる', () => openNote(), 'note');
    L.rvInput = b('rvInput', [h('b', null, '⇄'), h('small', null, '入力')], '入力の仕方を切りかえる（選手ごとの行／2P → 14番）', toggleRvInput, 'inp');
    L.rvCtl = h('div', { class: 'rvctl' }, L.rvBack, L.rvPrev, L.rvPlay, L.rvNext, L.rvFwd, L.rvRate, L.rvNote, L.rvInput);
    L.rvBox = h('section', { class: 'rvbox', id: 'rvBox', 'aria-label': '動画' }, L.rvStage, L.rvSeek, L.rvCtl);
    L.root.insertBefore(L.rvBox, L.wipe);
    L.pick = buildPick();
    L.stage.insertBefore(L.pick, L.cover);
    rvSeekEvents(L.rvSeek);
    rvMount();
    rvColors();
    lastClock = '';          // 時計の説明（動画の時刻）を、次の表示で付け直す
  }
  /* 位置のバーの色（画面の色に合わせる） */
  function rvColors() {
    const L = S.L, cs = getComputedStyle(document.body);
    L.rvCol = { track: cs.getPropertyValue('--line2').trim() || '#888', done: cs.getPropertyValue('--accent').trim() || '#2563eb', text: cs.getPropertyValue('--text').trim() || '#000' };
    L.seekKey = '';
  }
  /* 押し続けると続けて（0.4 秒押したら、前の移動が終わるたびに次のコマへ） */
  function holdRepeat(btn, fn) {
    let timer = 0, held = false, ptrAt = 0;
    const stop = () => { if (held) ptrAt = Date.now(); held = false; clearTimeout(timer); };
    btn.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      e.preventDefault();
      held = true;
      ptrAt = Date.now();
      fn();
      const rep = () => { if (!held) return; Promise.resolve(fn()).then(() => { if (held) timer = setTimeout(rep, 40); }); };
      timer = setTimeout(rep, 400);
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => btn.addEventListener(ev, stop));
    // キーボード（Enter・スペース）で押したとき。指・マウスで押したあとの click は、もう動かしたので使わない
    // （指の click も detail が 0 のことがあるので、押した・離した時刻で見分ける。長押しして離したあとの click も）
    btn.addEventListener('click', () => { if (Date.now() - ptrAt > 700) fn(); });
  }
  /* 位置のバー：指でなぞって動かす（なぞっている間は止める） */
  function rvSeekEvents(cv) {
    let drag = false, was = false;
    const at = (e) => {
      const r = cv.getBoundingClientRect();
      return BT.clamp((e.clientX - r.left - 8) / Math.max(1, r.width - 16), 0, 1) * S.rv.dur;
    };
    const move = (e) => { if (!drag || !rvReady()) return; S.rv.el.currentTime = at(e); rvTick(true); };
    cv.addEventListener('pointerdown', (e) => {
      if (!rvReady() || !S.rv.dur) return;
      e.preventDefault();
      drag = true;
      try { cv.setPointerCapture(e.pointerId); } catch (err) { /* 無視 */ }
      was = !S.rv.el.paused;
      if (was) S.rv.el.pause();
      move(e);
    });
    cv.addEventListener('pointermove', move);
    const end = () => { if (!drag) return; drag = false; if (was && rvReady()) { const p = S.rv.el.play(); if (p && p.catch) p.catch(() => {}); } };
    cv.addEventListener('pointerup', end);
    cv.addEventListener('pointercancel', end);
  }
  /* 映像の大きさ：縦長の画面は上（幅いっぱい・高さは画面の約 1/3。iPad は 4 割）、横長の画面は左の列（幅の 6 割まで） */
  function layoutRv() {
    const L = S.L, live = L.root, g = S.game;
    const lc = getComputedStyle(live);
    const W = live.clientWidth - parseFloat(lc.paddingLeft) - parseFloat(lc.paddingRight);
    const H = live.clientHeight - parseFloat(lc.paddingTop) - parseFloat(lc.paddingBottom);
    const side = W > H * 1.2 && W >= 600;
    live.classList.toggle('rv-side', side);
    const src = g.src || {};
    const ar = (S.rv && S.rv.ar) || (src.w && src.h ? src.w / src.h : 16 / 9);
    const ctlH = L.rvSeek.offsetHeight + L.rvCtl.offsetHeight + 6;
    let vw;
    if (side) vw = Math.min(W * 0.6, (H - L.bar.offsetHeight - ctlH - 6) * ar);
    else vw = Math.min(W - 8, H * (H >= 900 ? 0.42 : 0.34) * ar);
    vw = Math.floor(Math.max(160, vw));
    // （横長の画面で縦長の動画：映像は細くても、下の操作のボタン 8 つが押せる幅は取る）
    L.rvBox.style.width = side ? Math.max(vw + 12, Math.min(340, Math.floor(W * 0.6))) + 'px' : '';
    L.rvStage.style.width = vw + 'px';
    L.rvStage.style.height = Math.floor(vw / ar) + 'px';
    L.seekKey = '';
    rvDrawSeek();
    rvDrawNotes(true);
  }
  /* 表示を合わせる（再生・止める・動かした・速さ） */
  function rvSync() {
    const L = S.L, R = S.rv;
    if (!L || !L.rvBox) return;
    const ready = rvReady();
    const playing = ready && !R.el.paused && !R.el.ended;
    L.rvPlay.textContent = playing ? '⏸' : '▶';
    L.rvPlay.classList.toggle('on', playing);
    L.rvRate.textContent = '×' + (R ? R.rate : 1);
    L.rvRate.classList.toggle('on', !!R && R.rate !== 1);
    [L.rvBack, L.rvFwd, L.rvPrev, L.rvNext, L.rvRate].forEach((x) => { x.disabled = !ready; });
    rvCover();
    rvTick(true);
    rvDrawNotes(true);
  }
  /* 動画がないとき（続きを記録する・読み込み中）：映像の所に「動画を選ぶ」 */
  function rvCover() {
    const L = S.L, g = S.game, R = S.rv, c = L.rvCover;
    const ready = rvReady();
    const key = ready ? 'ok' : R ? 'loading' : 'pick';
    if (c.dataset.k === key) return;
    c.dataset.k = key;
    c.innerHTML = '';
    c.hidden = ready;
    if (ready) return;
    if (R) { c.append(h('p', null, '動画を読み込んでいます…')); return; }
    const src = g.src || {};
    const plays = g.events.some((e) => e.type !== 'period');
    c.append(h('button', { class: 'btn primary', id: 'btnRvPick', onclick: rvPick }, plays ? '🎬 動画を選んで、続きを記録する' : '🎬 動画を選ぶ'),
      src.name ? h('p', null, `記録した動画：${src.name}${src.duration ? `（${BT.fmtTime(src.duration)}）` : ''}${g.rvPos ? `・${BT.fmtTime(g.rvPos)} まで見ました` : ''}`) : null,
      plays ? h('p', { class: 'small' }, '動画の中身は保存していません。同じ動画をもう一度選ぶと、続きから記録できます') : null);
  }
  /* 時計・得点（いまの動画の時刻までの得点）・ピリオド・位置のバー */
  function rvTick(force) {
    const L = S.L, g = S.game;
    if (!L || !L.rvBox || !g) return;
    if (BT.ui.sheetOpen()) rvPause();          // 小窓を開いている間は、映像が隠れるので止めておく
    tickClock(force);
    const t = elapsed();
    // 選びかけ（「2P → 番号は？」）のまま、動画が 20 秒より大きく動いたら、やめる（あとで押した番号と、くっつけて記録しないように）
    const pk = S.rv && S.rv.pick;
    if (pk && Math.abs(t - pk.t) > PICK_KEEP) {
      S.rv.pick = null;
      rvPickMarks();
      say(`選びかけ（${pk.type ? pickTypeLabel(pk.type) : pk.no != null ? '#' + pk.no : '番号なし'}）をやめました：動画が ${PICK_KEEP} 秒より大きく動いたので`, 'warn', 4500);
    }
    const sc = BT.score(g, t + 0.05), per = BT.periodAt(g, t);
    const key = sc.join('-') + '|' + per;
    if (force || key !== L.rvKey) {
      L.rvKey = key;
      L.period.textContent = BT.periodLabel(per);
      [0, 1].forEach((tm) => {
        L.score[tm].textContent = sc[tm];
        L.panels[tm].tsc.textContent = sc[tm];
        if (L.pickT) L.pickT[tm].tsc.textContent = sc[tm];
      });
    }
    rvDrawSeek();
    if (!(S.rv && S.rv.raf)) rvDrawNotes();
  }
  function fitCanvas(cv) {
    const dpr = Math.min(3, root.devicePixelRatio || 1), W = cv.clientWidth, H = cv.clientHeight;
    if (!W || !H) return null;
    const w = Math.round(W * dpr), hh = Math.round(H * dpr);
    if (cv.width !== w || cv.height !== hh) { cv.width = w; cv.height = hh; }
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, W, H };
  }
  /* 位置のバー：記録（チームの色の印）・ピリオドの始まり（白い線）・コメント（黄色の丸）・いまの位置 */
  function rvDrawSeek() {
    const L = S.L, cv = L && L.rvSeek, g = S.game;
    if (!cv || !cv.isConnected || !g) return;
    const dur = rvReady() ? S.rv.dur : (g.src && g.src.duration) || 0;
    const t = rvReady() ? S.rv.el.currentTime : g.rvPos || 0;
    const key = [cv.clientWidth, cv.clientHeight, dur, Math.round(t * 4), g.events.length, g.seq, (g.notes || []).length, g.notesRev || 0].join(':');
    if (key === L.seekKey) return;
    L.seekKey = key;
    const f = fitCanvas(cv);
    if (!f) return;
    const { ctx, W, H } = f, x0 = 8, w = W - 16, cy = H / 2 + 3, col = L.rvCol;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = col.track;
    ctx.fillRect(x0, cy - 3, w, 6);
    if (!(dur > 0)) return;
    const X = (s) => x0 + BT.clamp(s / dur, 0, 1) * w;
    ctx.fillStyle = col.done;
    ctx.fillRect(x0, cy - 3, X(t) - x0, 6);
    g.events.forEach((e) => {
      const x = X(e.t);
      if (e.type === 'period') { ctx.fillStyle = col.text; ctx.fillRect(x - 1, cy - 9, 2, 18); return; }
      ctx.fillStyle = e.team === 0 || e.team === 1 ? g.teams[e.team].color : e.type === 'mark' ? '#facc15' : '#94a3b8';
      ctx.fillRect(x - 1.5, cy - 7, 3, 14);
      ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = 0.75;          // （白いユニフォームの印も見えるように、ふちを付ける）
      ctx.strokeRect(x - 1.5, cy - 7, 3, 14);
    });
    (g.notes || []).forEach((n) => { ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.arc(X(n.t), 4, 3.5, 0, Math.PI * 2); ctx.fill(); });
    const x = X(t);
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = col.done; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(x, cy, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
  /* 映像の上に、いま出ているコメント・スタンプ（バスケ得点クリップで書き出す動画と同じ絵。スマホの小さな画面では大きめに） */
  function rvDrawNotes(force) {
    const L = S.L, cv = L && L.rvNotes, g = S.game, N = NOTES();
    if (!cv || !cv.isConnected || !g || !N) return;
    const t = rvReady() ? S.rv.el.currentTime : -1;
    const act = t >= 0 ? N.activeAt(g.notes || [], t) : [];
    if (!act.length && !L.notesShown && !force) return;
    const f = fitCanvas(cv);
    if (!f) return;
    f.ctx.clearRect(0, 0, f.W, f.H);
    L.notesShown = act.length > 0;
    if (act.length) N.draw(f.ctx, f.W, f.H, g.notes, t, 0, 0, BT.clamp(300 / f.H, 1, 1.8));
  }

  /* ---------- 入力の仕方（選手ごとの行／2P → 14番） ---------- */
  /* null（自動）| 'rows' | 'pick' */
  function toggleRvInput() {
    S.prefs.rvInput = S.L && S.L.inMode === 'pick' ? 'rows' : 'pick';
    savePrefs();
    if (S.rv) S.rv.pick = null;
    layoutLive();
    renderLast();
    say(S.prefs.rvInput === 'pick' ? '入力：プレー → 背番号（「2P」→「14」のように1つずつ選ぶ）' : '入力：選手ごとの行（行のボタンを1回押す）', 'ok', 3500);
  }
  /* 「2P → 14番」の入力：チームごとに、プレーのボタンの列と、背番号のボタン */
  function buildPick() {
    const g = S.game, L = S.L;
    L.pickT = [];
    const box = h('div', { class: 'pick', id: 'pick', hidden: true });
    [0, 1].forEach((tm) => {
      const t = g.teams[tm];
      const tsc = h('span', { class: 'tsc' }, '0');
      const types = h('div', { class: 'ptypes', role: 'group', 'aria-label': `${BT.teamName(g, tm)} のプレー` }, rowTypes().map((type) => {
        const d = BT.TYPE[type];
        return h('button', { class: 'pt k-' + type + (d.kind === 'miss' ? ' miss' : ''), dataset: { ptype: type }, 'aria-label': `${BT.teamName(g, tm)} ${d.label}` }, h('b', null, pickTypeLabel(type)));
      }));
      const nos = h('div', { class: 'pnos', role: 'group', 'aria-label': `${BT.teamName(g, tm)} の背番号` });
      const sec = h('section', { class: 'pteam', id: 'pick' + tm, dataset: { team: tm }, style: { '--tc': t.color, '--tink': BT.inkOn(t.color) } },
        h('div', { class: 'thead' }, h('b', { class: 'tname' }, BT.teamName(g, tm)), tsc,
          h('button', { class: 'tadd', dataset: { add: '1' }, title: '名簿にない背番号を足す', 'aria-label': `${BT.teamName(g, tm)} の背番号を足す` }, '＋番号')),
        types, nos);
      L.pickT[tm] = { sec, tsc, types, nos };
      fillPickNos(tm);
      box.append(sec);
    });
    box.addEventListener('click', onPickClick);
    return box;
  }
  function fillPickNos(tm) {
    const L = S.L, P = L.pickT && L.pickT[tm];
    if (!P) return;
    P.nos.innerHTML = '';
    const rows = rowsOf(tm);
    const teamOnly = rows.length === 1 && rows[0].no == null;
    P.teamOnly = teamOnly;                     // 背番号のないチーム：プレーを押すだけで、チームの記録にする（番号のボタンは出さない）
    P.nos.hidden = teamOnly;
    P.sec.classList.toggle('teamonly', teamOnly);
    rows.forEach((r) => {
      const who = r.no != null ? `${r.no}番${r.name ? ' ' + r.name : ''}` : teamOnly ? 'チーム' : 'だれか（番号なし）';
      P.nos.append(h('button', { class: 'pn' + (r.no == null ? ' unk' : '') + (teamOnly ? ' teamonly' : ''), dataset: { pno: r.no == null ? '' : r.no }, 'aria-label': `${BT.teamName(S.game, tm)} ${who}` },
        h('b', null, r.no != null ? r.no : teamOnly ? 'チーム' : '？'), r.no != null && S.prefs.names && r.name ? h('small', null, r.name) : null));
    });
  }
  /* 横に余裕があれば2チームを左右に、なければ上下に */
  function layoutPick() {
    const L = S.L;
    L.pick.classList.toggle('two', L.stage.clientWidth >= 520);
    rvPickMarks();
  }
  /* プレーと背番号を、どちらから選んでもよい。2つそろったら記録する（時刻は、はじめに押したとき） */
  function onPickClick(e) {
    const b = e.target.closest('button');
    if (!b) return;
    const sec = b.closest('.pteam');
    if (!sec) return;
    const tm = Number(sec.dataset.team);
    if (b.dataset.add) { openKeypad(tm); return; }
    const isType = b.dataset.ptype != null, isNo = b.dataset.pno != null;
    if (!isType && !isNo) return;
    if (!canRecord()) return;
    const R = S.rv, p = R.pick;
    R.adj = null;                 // 時刻あわせの途中なら、やめる
    const val = isType ? b.dataset.ptype : b.dataset.pno === '' ? null : b.dataset.pno;
    if (isType && S.L.pickT[tm].teamOnly) {          // 背番号のないチーム：すぐ記録
      if (p && p.team === tm) R.pick = null;
      record(tm, null, val, b);
      rvPickMarks();
      return;
    }
    if (p && p.team === tm) {
      if (isType && p.no !== undefined) { R.pick = null; record(tm, p.no, val, b, p.t); flash(p.btn); rvPickMarks(); return; }
      if (isNo && p.type) { R.pick = null; record(tm, val, p.type, b, p.t); flash(p.btn); rvPickMarks(); return; }
      // 同じボタンをもう一度：やめる。同じ側の別のボタン：選びなおす（時刻は、はじめのまま）
      if ((isType && p.type === val) || (isNo && p.no === val)) { R.pick = null; feel('undo'); rvPickMarks(); renderLast(); return; }
      R.pick = isType ? { team: tm, type: val, t: p.t, btn: b } : { team: tm, no: val, t: p.t, btn: b };
    } else R.pick = isType ? { team: tm, type: val, t: elapsed(), btn: b } : { team: tm, no: val, t: elapsed(), btn: b };
    BT.ui.haptic();
    rvPickMarks();
    renderLast();
  }
  /* 選んでいるボタンに印・相手の側を光らせる */
  function rvPickMarks() {
    const L = S.L, p = S.rv && S.rv.pick;
    if (!L || !L.pickT) return;
    L.pickT.forEach((P, tm) => {
      const on = !!(p && p.team === tm);
      P.sec.classList.toggle('armed', on);
      P.sec.classList.toggle('want-no', on && !!p.type);
      P.sec.classList.toggle('want-type', on && p.no !== undefined);
      P.types.querySelectorAll('.pt').forEach((x) => x.classList.toggle('sel', on && p.type === x.dataset.ptype));
      P.nos.querySelectorAll('.pn').forEach((x) => x.classList.toggle('sel', on && p.no !== undefined && (p.no == null ? '' : p.no) === x.dataset.pno));
    });
  }
  /* 画面の下：選びかけ（「2P → 背番号を選ぶ」）・時刻あわせの途中 */
  function rvLastbar(el) {
    const R = S.rv, g = S.game;
    if (!R) return false;
    if (R.adj) {
      const e = BT.findEvent(g, R.adj);
      if (!e) { R.adj = null; return false; }
      const d = BT.TYPE[e.type];
      const what = e.type === 'period' ? `${BT.periodLabel(e.period)} の始まり` : `${e.no != null ? '#' + e.no + ' ' : ''}${d.short || d.label}`;
      el.append(h('div', { class: 'lastev msg adj' }, h('span', { class: 'mt' }, `📍 ${what}（${BT.fmtTime(e.t, true)}）：「◀ コマ ▶」で映像を合わせて ✓`)),
        h('button', { class: 'btn undo act', id: 'btnAdjCancel', onclick: () => { R.adj = null; renderLast(); } }, 'やめる'),
        h('button', { class: 'btn undo act ok', id: 'btnAdjOk', onclick: rvAdjDone }, '✓ この時刻'));
      return true;
    }
    if (R.pick) {
      const p = R.pick, tn = BT.teamName(g, p.team);
      const what = p.type ? `${pickTypeLabel(p.type)} → 番号は？` : `${p.no != null ? '#' + p.no : '番号なし'} → プレーは？`;
      el.append(h('div', { class: 'lastev msg pickmsg', id: 'pickMsg', style: { '--tc': teamColor(p.team) } }, h('div', { class: 'l1' }, h('b', { class: 'lt' }, BT.fmtTime(p.t, true)), h('span', { class: 'll' }, what)), h('div', { class: 'lw' }, tn)),
        h('button', { class: 'btn undo act', id: 'btnPickCancel', onclick: () => { R.pick = null; rvPickMarks(); renderLast(); } }, 'やめる'));
      return true;
    }
    return false;
  }
  /* 📍 映像で時刻を合わせる：その記録の時刻へ動画を動かして止め、コマ送りで合わせたら「✓」 */
  function rvAdjust(id) {
    const e = BT.findEvent(S.game, id);
    if (!e || !rvReady()) return;
    BT.ui.closeSheet(true);
    S.rv.pick = null;
    rvPickMarks();
    S.rv.adj = id;
    rvPause();
    rvSeekTo(e.t).then(() => renderLast());
    renderLast();
  }
  function rvAdjDone() {
    const R = S.rv, e = R && BT.findEvent(S.game, R.adj);
    if (R) R.adj = null;
    if (!e || !rvReady()) { renderLast(); return; }
    e.t = rvNow();
    save();
    updateLive();
    say(`時刻を ${BT.fmtTime(e.t, true)} にしました`, 'ok');
  }

  /* ---------- 💬 コメント・スタンプ（その場面から数秒、映像の上に出す。バスケ得点クリップで書き出す動画にも入る） ---------- */
  function openNote(id) {
    const g = S.game, N = NOTES();
    if (!N) return;
    if (!rvReady() && !id) { say('先に動画を選んでください', 'warn'); return; }
    rvPause();
    g.notes = g.notes || [];
    const old = id ? g.notes.find((n) => n.id === id) : null;
    const d = old ? JSON.parse(JSON.stringify(old)) : { t: rvNow(), dur: N.DUR, text: '', stamps: [], tags: [] };
    const timeLab = h('span', null, '');
    const showTime = () => { timeLab.textContent = `時刻：${BT.fmtTime(d.t, true)}（ここから ${d.dur} 秒、映像の上に出ます）`; };
    const stampBtns = N.STAMPS.map((x) => h('button', { class: 'stamp' + (d.stamps.includes(x.s) ? ' on' : ''), dataset: { stamp: x.s }, title: x.l, 'aria-label': x.l, 'aria-pressed': d.stamps.includes(x.s) ? 'true' : 'false',
      onclick: (e) => { const i = d.stamps.indexOf(x.s); if (i >= 0) d.stamps.splice(i, 1); else if (d.stamps.length < 6) d.stamps.push(x.s); const on = d.stamps.includes(x.s); e.currentTarget.classList.toggle('on', on); e.currentTarget.setAttribute('aria-pressed', on ? 'true' : 'false'); } }, x.s));
    const text = h('input', { type: 'text', id: 'noteText', maxlength: N.MAX_TEXT, placeholder: '例：ヘルプが遅い！もっと早く寄ろう #ヘルプ', value: d.text || '' });
    const tagBtns = N.TAGS.map((w) => h('button', { class: 'btn small tagb' + (d.tags.includes(w) ? ' on' : ''), dataset: { tag: w }, onclick: (e) => { const i = d.tags.indexOf(w); if (i >= 0) d.tags.splice(i, 1); else d.tags.push(w); e.currentTarget.classList.toggle('on', d.tags.includes(w)); } }, '#' + w));
    const durBtns = h('div', { class: 'row' }, N.DURS.map((s) => h('button', { class: 'btn small' + (d.dur === s ? ' on' : ''), dataset: { dur: s }, onclick: (e) => { d.dur = s; durBtns.querySelectorAll('button').forEach((x) => x.classList.toggle('on', Number(x.dataset.dur) === s)); showTime(); } }, `${s}秒`)));
    showTime();
    const body = h('div', { class: 'notebox' },
      h('div', { class: 'field' }, timeLab, old ? h('div', { class: 'row' },
        h('button', { class: 'btn small', onclick: () => { s.close(); rvSeekTo(d.t); } }, '🎬 この場面を見る'),
        rvReady() ? h('button', { class: 'btn small', id: 'btnNoteNow', onclick: () => { d.t = rvNow(); showTime(); } }, 'いまの映像の時刻にする') : null) : null),
      h('div', { class: 'field' }, h('span', null, 'スタンプ（6つまで）'), h('div', { class: 'stamps' }, stampBtns)),
      h('label', { class: 'field' }, h('span', null, 'コメント（なくてもOK）'), text),
      h('div', { class: 'field' }, h('span', null, 'タグ'), h('div', { class: 'row tagrow' }, tagBtns)),
      h('div', { class: 'field' }, h('span', null, '出す長さ'), durBtns));
    const s = BT.ui.sheet({
      title: old ? '💬 コメントを直す' : '💬 コメント・スタンプを入れる', body, cls: 'notesheet',
      foot: [
        old ? h('button', { class: 'btn danger', id: 'btnNoteDel', onclick: () => { g.notes = g.notes.filter((n) => n.id !== id); g.notesRev = (g.notesRev || 0) + 1; save(); s.close(); rvSync(); say('コメントを消しました', 'ok'); } }, '🗑 消す') : null,
        h('button', { class: 'btn', onclick: () => s.close() }, 'やめる'),
        h('button', { class: 'btn primary', id: 'btnNoteSave', onclick: () => {
          d.text = text.value.trim();
          const n = N.clean(Object.assign({}, d, { id: old ? old.id : N.nextId(g.notes), at: old ? old.at : now() }));
          if (!n) { BT.ui.toast('スタンプを選ぶか、コメントを書いてください', 'warn'); return; }
          g.notes = g.notes.filter((x) => x.id !== n.id).concat([n]).sort((a, b) => a.t - b.t);
          g.notesRev = (g.notesRev || 0) + 1;
          save();
          s.close();
          rvSync();
          say(old ? 'コメントを直しました' : `💬 ${BT.fmtTime(n.t, true)} にコメントを入れました`, 'ok');
        } }, '保存')].filter(Boolean)
    });
  }
  /* コメントの一覧（押すと、その場面へ・直す） */
  function openNotes() {
    const g = S.game, list = (g.notes || []).slice().sort((a, b) => a.t - b.t);
    BT.ui.sheet({
      title: `💬 コメントの一覧（${list.length}件）`, wide: true,
      body: h('div', null,
        list.length ? h('div', { class: 'loglist' }, list.map((n) => h('button', { class: 'lrow nrow', dataset: { note: n.id }, onclick: () => { if (rvReady()) rvSeekTo(n.t); openNote(n.id); } },
          h('b', { class: 'lt' }, BT.fmtTime(n.t, true)),
          h('span', { class: 'nst' }, n.stamps.join('')),
          h('span', { class: 'ntx' }, n.text || ''),
          n.tags.length ? h('small', { class: 'lname' }, n.tags.map((w) => '#' + w).join(' ')) : null)))
          : h('p', { class: 'note' }, 'まだコメントはありません。動画の下の「💬」で、その場面にコメント・スタンプを入れられます。'),
        h('p', { class: 'note' }, 'コメントは記録に入ります。記録を終えたあと「🎬 場面を見る・動画にする」で、切り出した動画・動画全体の書き出しにも入ります。'))
    });
  }

  /* ---------- シュートの場所（設定でオンのとき。コートの図は js/shot.js） ----------
     記録は先にすませ（時刻は押した瞬間で決まる）、そのあとで場所を聞く。「あとで」でも記録はなくならない。
     試合を見ながら記録するときは、小窓が選手のボタンをふさぐので、BT.shot.WAIT（6 秒）押さなければ自動で閉じる。
     動画を見ながら記録するときは閉じない（小窓を開いている間は、動画が止まっている） */
  /* 設定でオン、かつ場面パックで使えるとき（お試しの試合・購入コード。js/license.js。スイッチが off のあいだは、いつも使える） */
  function shotLocOn() { return !!S.prefs.shotLoc && BT.license.can('shot', S.game); }
  const courtNow = () => (S.prefs.courtType === 'mini' ? 'mini' : 'std');
  const shotWho = (g, e) => (e.no != null ? '#' + e.no : BT.teamName(g, e.team));
  function setLoc(e, x, y) { e.x = BT.locRound(x); e.y = BT.locRound(y); }
  function askShotLoc(ev) {
    const g = S.game, d = BT.TYPE[ev.type], court = courtNow(), live = !rvMode();
    let timer = 0;
    const tapped = (x, y) => {
      const e = BT.findEvent(g, ev.id);
      s.close();
      if (!e || S.game !== g) return;
      setLoc(e, x, y);
      BT.license.use('shot', g);          // 場所を付けた試合を、お試しの 1 試合に数える
      g.court = court;
      save();
      say(`📍 ${BT.shotZone(e.x, e.y, court).label}`, 'ok', 2500);
    };
    const svg = BT.shot.court({ court, onTap: tapped, label: 'コートの図（ゴールが上）。打った場所を押す' });
    const body = h('div', { class: 'shotpick' + (live ? ' timed' : ''), id: 'shotPick' },
      h('div', { class: 'shotcourt' }, svg),
      h('div', { class: 'shotside' },
        h('p', { class: 'note' }, '打った場所を1回押してください（ゴールが上）'),
        live ? h('div', { class: 'shotwait', 'aria-hidden': 'true' }, h('i', { style: { animationDuration: BT.shot.WAIT + 'ms' } })) : null,
        h('button', { class: 'btn', id: 'shotLater', onclick: () => s.close() }, 'あとで')));
    const s = BT.ui.sheet({ title: `${shotWho(g, ev)} ${d.label}：どこから？`, body, cls: 'shotsheet', onClose: () => clearTimeout(timer) });
    if (live) timer = setTimeout(() => s.close(), BT.shot.WAIT);
  }
  /* 記録を直す：場所の欄（小さなコート。押すと場所を付ける・動かす） */
  function locField(e, changed) {
    const g = S.game, court = g.court ? BT.courtOf(g) : courtNow(), has = BT.hasLoc(e);
    // 直したあとも、小窓の同じ所（場所の欄）が見えるように
    const again = () => { const sb = $('.sheet-body'), y = sb ? sb.scrollTop : 0; changed(); const nb = $('.sheet-body'); if (nb) nb.scrollTop = y; };
    const svg = BT.shot.court({ court, label: 'コートの図。押した所を、この記録の場所にする', shots: has ? [{ x: e.x, y: e.y, made: BT.TYPE[e.type].made, color: teamColor(e.team) }] : [],
      onTap: (x, y) => { setLoc(e, x, y); BT.license.use('shot', g); if (!g.court) g.court = court; again(); } });
    return h('div', { class: 'field locfield', id: 'evLoc' },
      h('span', null, has ? `場所：📍 ${BT.shotZone(e.x, e.y, court).label}（押すと動かせます）` : '場所：まだありません（コートを押すと付けられます）'),
      h('div', { class: 'locrow' }, h('div', { class: 'loccourt' }, svg),
        has ? h('button', { class: 'btn small', id: 'btnLocClear', onclick: () => { delete e.x; delete e.y; again(); } }, '場所を消す') : null));
  }
  /* 集計：シュートの場所（チーム・選手で絞る。図と、ゾーンごとの表） */
  function shotBlock(g) {
    if (!BT.hasShotLoc(g)) return null;
    if (!S.shotView || S.shotView.id !== g.id) S.shotView = { id: g.id, team: BT.shotStats(g, { team: 0 }).located || !BT.shotStats(g, { team: 1 }).located ? 0 : 1, no: null };
    const V = S.shotView;
    const box = h('section', { class: 'teamstat shotstats', id: 'shotStats' });
    const draw = () => {
      box.innerHTML = '';
      const tm = V.team, color = g.teams[tm].color;
      const all = BT.shotStats(g, { team: tm });
      const nos = BT.sortNos(Array.from(new Set(all.shots.filter((x) => x.e.no != null).map((x) => x.e.no))));
      if (V.no != null && !nos.includes(V.no)) V.no = null;
      const r = V.no != null ? BT.shotStats(g, { team: tm, no: V.no }) : all;
      const withA = BT.hasMisses(g);
      const svg = BT.shot.court({ court: r.court, label: 'シュートの場所の図', shots: r.shots.map((x) => ({ x: x.x, y: x.y, made: x.made, color })) });
      const tot = r.zones.reduce((a, z) => ({ made: a.made + z.made, att: a.att + z.att }), { made: 0, att: 0 });
      const zrow = (z, cls) => h('tr', { class: (cls || '') + (z.att ? '' : ' zero'), dataset: z.id ? { zone: z.id } : {} }, h('th', null, z.label),
        withA ? [h('td', { class: 'zm' }, `${z.made}/${z.att}`), h('td', { class: 'zp' }, BT.pct(z.made, z.att))] : h('td', { class: 'zm' }, String(z.made)));
      box.append(
        h('h3', null, '📍 シュートの場所'),
        h('div', { class: 'row shotteams' }, [0, 1].map((t) => h('button', { class: 'btn small' + (t === tm ? ' on' : ''), dataset: { shotteam: t }, onclick: () => { V.team = t; V.no = null; draw(); } },
          h('i', { class: 'chip', style: { background: g.teams[t].color } }), BT.teamName(g, t)))),
        h('div', { class: 'row shotnos' },
          h('button', { class: 'btn small' + (V.no == null ? ' on' : ''), dataset: { shotno: '' }, onclick: () => { V.no = null; draw(); } }, '全員'),
          nos.map((no) => h('button', { class: 'btn small' + (V.no === no ? ' on' : ''), dataset: { shotno: no }, onclick: () => { V.no = no; draw(); } }, '#' + no))),
        h('div', { class: 'shotgrid' },
          h('div', { class: 'shotchart' }, svg),
          h('table', { class: 'per zones', id: 'zoneTable' },
            h('thead', null, h('tr', null, h('th', null, 'ゾーン'), withA ? [h('th', null, '成功/打った数'), h('th', null, '成功率')] : h('th', null, '成功'))),
            h('tbody', null, r.zones.map((z) => zrow(z)), zrow({ label: '合計', made: tot.made, att: tot.att }, 'tot')))),
        h('p', { class: 'note', id: 'shotNote' }, `場所あり ${r.located}本・場所なし ${r.unlocated}本。● 入った` + (withA ? '・× 外れ' : '') + '（場所なしのシュートは、図と表には入りません）。'));
    };
    draw();
    return box;
  }

  /* ---------- メニュー ---------- */
  function openMenu() {
    const g = S.game, rv = rvMode();
    rvPause();
    const plays = g.events.filter((e) => e.type !== 'period').length;
    const item = (icon, label, sub, fn, cls) => h('button', { class: 'mitem' + (cls ? ' ' + cls : ''), onclick: () => { s.close(); fn(); } }, h('span', { class: 'mi' }, icon), h('span', { class: 'mt' }, h('b', null, label), sub ? h('small', null, sub) : null));
    const s = BT.ui.sheet({
      title: g.startedAt ? `メニュー（${rv ? '動画 ' : ''}${BT.fmtTime(elapsed())}・${plays}件の記録）` : 'メニュー',
      body: h('div', { class: 'menu' },
        item('📋', '記録の一覧', rv ? '番号・プレー・時刻を直す、消す、その場面を見る' : '番号・プレー・時刻を直す、消す', openLog),
        rv ? item('💬', `コメントの一覧（${(g.notes || []).length}件）`, 'コメント・スタンプを見る、直す', openNotes) : null,
        item('📊', '集計', '選手ごとの得点・リバウンド・パスミスなど', openStats),
        rv ? item('🎬', '動画を選び直す', S.rv && S.rv.file ? `いま：${S.rv.file.name}` : '記録した動画をもう一度選ぶ', rvPick)
          : item('📹', camRec() ? '撮影（録画中）' : '撮影しながら記録', camRec() ? '録画を止める・画質・空き容量' : 'この端末のカメラで録画（時刻は自動で合う）', openCamera),
        item('👥', 'チーム・背番号を直す', '名前・色・背番号', () => { S.setupFor = 'edit'; S.editBack = 'live'; go('setup'); }),
        item('🎛', '設定', '名前の表示・「？」の行・音・画面の色', openSettings),
        item('💾', '書き出す', '動画の切り出し用のファイル・CSV', () => openExport(g)),
        g.startedAt && !g.endedAt ? (rv ? item('⏹', '記録を終える', '集計を見る（あとで「続きを記録する」で戻せます）', () => BT.ui.confirm('記録を終えますか？', 'まちがえて終えたときは「続きを記録する」で戻せます。', '終える', endGame))
          : item('⏹', '試合を終える', '時計を止めて、集計を見る', () => BT.ui.confirm('試合を終えますか？', '時計が止まります。まちがえて終えたときは「続きを記録する」で戻せます。', '終える', endGame))) : null,
        g.endedAt ? item('▶', '続きを記録する', 'まちがえて終えたとき', reopen) : null,
        g.startedAt && !plays && !rv ? item('↺', 'スタートを取り消す', 'まちがえて押したとき（記録がまだないときだけ）', () => BT.ui.confirm('スタートを取り消しますか？', '時計が 0:00 に戻ります。', '取り消す', cancelStart)) : null,
        item('❓', '使い方', null, help),
        g.endedAt ? item('📄', '試合のページへ', '集計・場面の切り出し・書き出し', () => go('game'), 'strong') : null,
        item('🏠', 'ホームへ', camRec() ? '録画を止めて、ホームへ（記録は保存されています）' : g.startedAt && !g.endedAt ? '記録は保存されています。ホームの「続きを記録する」で戻れます' : null, () => (camOn() ? camClose().then(() => go('home')) : go('home')))),
      onClose: null
    });
  }

  /* ---------- 記録の一覧・直す ---------- */
  /* filter：null＝すべて・0／1＝そのチーム・'none'＝チームなし（画面の下のパスミス・★） */
  function openLog(filter) {
    const g = S.game;
    const f = filter === 0 || filter === 1 || filter === 'none' ? filter : null;
    const evs = BT.sorted(g).reverse().filter((e) => f == null || e.type === 'period' || (f === 'none' ? e.team == null : e.team === f));
    const anyFree = g.events.some((e) => e.type !== 'period' && e.team == null);
    const row = (e) => {
      const d = BT.TYPE[e.type];
      return h('button', { class: 'lrow' + (e.type === 'period' ? ' per' : ''), dataset: { id: e.id }, onclick: () => openEdit(e.id) },
        h('b', { class: 'lt' }, BT.fmtTime(e.t), g.gc && e.type !== 'period' ? h('small', { class: 'lgt' }, BT.gcText(BT.gameClock(g, e.t))) : null),
        e.type === 'period' ? h('span', { class: 'lp' }, `── ${BT.periodLabel(e.period)} 開始 ──`) : [
          e.team == null ? h('i', { class: 'chip neutral' }) : h('i', { class: 'chip', style: { background: teamColor(e.team) } }),
          h('span', { class: 'lno' }, e.no != null ? '#' + e.no : '—'),
          h('span', { class: 'llabel k-' + d.kind }, d.label + (d.pts ? ` +${d.pts}` : ''), BT.hasLoc(e) ? h('small', { class: 'lzone' }, '📍 ' + BT.shotZone(e.x, e.y, BT.courtOf(g)).label) : null),
          h('small', { class: 'lname' }, e.team == null ? 'チームなし' : e.no != null ? BT.playerName(g, e.team, e.no) : '番号なし')
        ]);
    };
    const tabs = [[null, 'すべて'], [0, BT.teamName(g, 0)], [1, BT.teamName(g, 1)]];
    if (anyFree || f === 'none') tabs.push(['none', 'チームなし']);
    const s = BT.ui.sheet({
      title: `記録の一覧（${g.events.filter((e) => e.type !== 'period').length}件）`, wide: true,
      body: h('div', null,
        h('div', { class: 'row tabsrow' },
          tabs.map(([v, lab]) => h('button', { class: 'btn small' + (f === v ? ' on' : ''), onclick: () => openLog(v) }, lab))),
        h('p', { class: 'note' }, 'タップすると、番号・プレー・時刻を直したり、消したりできます。新しい記録が上です。' + (g.gc ? `時刻の下の小さな数字は、試合時間（${g.gc.len ? 'そのピリオドの残り' : 'そのピリオドで進んだ時間'}）です。` : '')),
        evs.length ? h('div', { class: 'loglist' }, evs.map(row)) : h('p', { class: 'note' }, 'まだ記録はありません。'))
    });
    return s;
  }
  function openEdit(id) {
    const g = S.game;
    const e = BT.findEvent(g, id);
    if (!e) return;
    rvPause();
    const changed = () => { save(); if (S.L) updateLive(); openEdit(id); };
    const nudge = (d) => h('button', { class: 'btn small', onclick: () => { e.t = Math.max(0, Math.round((e.t + d) * 10) / 10); changed(); } }, (d > 0 ? '+' : '−') + Math.abs(d) + '秒');
    const body = h('div', { class: 'edit' });
    body.append(h('div', { class: 'field' }, h('span', { id: 'evTime' }, `時刻（${rvMode() ? '動画の時刻' : 'スタートから'}）：${BT.fmtTime(e.t, true)}` + (g.gc && e.type !== 'period' ? `・試合時間 ${BT.gcLabel(BT.gameClock(g, e.t))}` : '')), h('div', { class: 'row' }, nudge(-5), nudge(-1), nudge(-0.5), nudge(0.5), nudge(1), nudge(5))));
    // 動画を見ながら：その場面を見る・映像を見ながらコマ送りで時刻を合わせる・いまの映像の時刻にする
    if (rvMode() && rvReady()) {
      body.append(h('div', { class: 'row rvedit' },
        h('button', { class: 'btn small', id: 'btnEvSee', onclick: () => { BT.ui.closeSheet(true); rvPlayFrom(Math.max(0, e.t - 2)); } }, '🎬 この場面を見る（2秒前から）'),
        h('button', { class: 'btn small primary', id: 'btnEvAdj', onclick: () => rvAdjust(id) }, '📍 映像で時刻を合わせる（コマ送り）'),
        h('button', { class: 'btn small', id: 'btnEvNow', onclick: () => { e.t = rvNow(); changed(); } }, `いまの映像の時刻（${BT.fmtTime(rvNow(), true)}）にする`)));
    }
    if (e.type === 'period') {
      body.append(h('div', { class: 'field' }, h('span', null, 'ピリオド'), h('div', { class: 'row' }, [1, 2, 3, 4, 5, 6].map((p) => h('button', { class: 'btn small' + (e.period === p ? ' on' : ''), onclick: () => { e.period = p; changed(); } }, BT.periodLabel(p))))));
    } else {
      // チーム（得点のプレーは、チームなしにできない）
      const pts = !!(BT.TYPE[e.type] && BT.TYPE[e.type].pts);
      const teamBtn = (tm, label) => h('button', { class: 'btn' + (e.team === tm ? ' on' : ''), dataset: { eteam: tm == null ? 'none' : String(tm) }, onclick: () => { if (e.team !== tm) { e.team = tm; e.no = null; changed(); } } },
        tm == null ? h('i', { class: 'chip neutral' }) : h('i', { class: 'chip', style: { background: teamColor(tm) } }), label);
      body.append(h('div', { class: 'field' }, h('span', null, 'チーム'), h('div', { class: 'row' },
        teamBtn(0, BT.teamName(g, 0)), teamBtn(1, BT.teamName(g, 1)), pts && e.team != null ? null : teamBtn(null, 'チームなし'))));
      if (e.team != null) {
        const players = g.teams[e.team].players.map((p) => p.no);
        if (e.no != null && !players.includes(e.no)) players.push(e.no);
        body.append(h('div', { class: 'field' }, h('span', null, '背番号'), h('div', { class: 'row nopick' },
          h('button', { class: 'btn small' + (e.no == null ? ' on' : ''), onclick: () => { e.no = null; changed(); } }, '番号なし'),
          BT.sortNos(players).map((no) => h('button', { class: 'btn small nobtn' + (e.no === no ? ' on' : ''), onclick: () => { e.no = no; changed(); } }, '#' + no)))));
      }
      body.append(h('div', { class: 'field' }, h('span', null, 'プレー'), h('div', { class: 'row typepick' },
        BT.editTypes(e.type, rowTypes()).map((id) => { const d = BT.TYPE[id]; return h('button', { class: 'btn small k-' + d.kind + (e.type === id ? ' on' : ''), dataset: { etype: id }, onclick: () => { e.type = id; if (d.pts && e.team == null) e.team = 0; if (!BT.isLocShot(id)) { delete e.x; delete e.y; } changed(); } }, d.label); }))));
      if (BT.isLocShot(e.type) && (shotLocOn() || BT.hasLoc(e))) body.append(locField(e, changed));
      if (e.team == null) body.append(h('p', { class: 'note' }, '「チームなし」は、画面の下のボタン（パスミス・★）で記録したものです。チーム・背番号を付けることもできます。'));
    }
    BT.ui.sheet({
      title: e.type === 'period' ? 'ピリオドの始まりを直す' : '記録を直す', body,
      foot: [
        h('button', { class: 'btn danger', id: 'btnDelEv', onclick: () => {
          if (g.events.length === 1 && e.type === 'period') { BT.ui.toast('スタートの記録は消せません', 'warn'); return; }
          BT.removeEvent(g, id); save(); if (S.L) updateLive(); openLog(); BT.ui.toast('消しました', 'ok');
        } }, '🗑 消す'),
        h('button', { class: 'btn', onclick: () => openLog() }, '← 一覧へ'),
        h('button', { class: 'btn primary', onclick: () => BT.ui.closeSheet() }, 'とじる')]
    });
  }

  /* ---------- 集計 ---------- */
  const COLS = [
    ['pts', '得点'], ['fg2', '2P'], ['fg3', '3P'], ['ft', 'FT'], ['reb', 'リバウンド'], ['oreb', 'OR'], ['dreb', 'DR'], ['ast', 'アシスト'], ['stl', 'スティール'], ['blk', 'ブロック'],
    ['pass', 'パスミス'], ['tov', 'ターンオーバー'], ['foul', 'ファウル'], ['mark', '★']
  ];
  /* withA：「成功/打った数」で出す（外れの記録があるときだけ。ないときは入れた本数）。
     split：「Oリバ」「Dリバ」で記録した試合（OR・DR の列を出し、リバウンドの列は合計だけ。分けていない試合は「合計（うちオフェンス）」） */
  function cell(s, key, withA, split) {
    if (key === 'fg2' || key === 'fg3' || key === 'ft') { const m = s[key + 'm'], a = s[key + 'a']; return !a ? '' : withA ? `${m}/${a}` : String(m); }
    if (key === 'reb') return s.reb ? (s.oreb && !split ? `${s.reb}（${s.oreb}）` : String(s.reb)) : '';
    return s[key] ? String(s[key]) : '';
  }
  function hasCol(st, key) {
    const any = (s) => (key === 'fg2' || key === 'fg3' || key === 'ft' ? s[key + 'a'] : s[key]);
    return st.some((x) => any(x.total));
  }
  function statsBody(game) {
    const g = game || S.game;
    const st = BT.stats(g);
    const per = BT.periodScores(g);
    const withA = BT.hasMisses(g);
    const split = BT.hasRebSplit(g);
    const cols = COLS.filter(([k]) => k === 'pts' || ((k === 'oreb' || k === 'dreb') ? split && hasCol(st, 'reb') : hasCol(st, k)));
    const table = (x) => {
      const rows = x.rows.filter((r) => !BT.isEmpty(r.s));
      const idle = x.rows.filter((r) => BT.isEmpty(r.s));
      return h('div', { class: 'boxwrap' }, h('table', { class: 'box' },
        h('thead', null, h('tr', null, h('th', null, '#'), h('th', { class: 'nm' }, '名前'), cols.map(([, lab]) => h('th', null, lab)))),
        h('tbody', null,
          rows.map((r) => h('tr', null, h('td', { class: 'no' }, r.no), h('td', { class: 'nm' }, r.name || ''), cols.map(([k]) => h('td', null, cell(r.s, k, withA, split))))),
          !BT.isEmpty(x.unknown) ? h('tr', { class: 'unk' }, h('td', { class: 'no' }, '—'), h('td', { class: 'nm' }, '番号なし'), cols.map(([k]) => h('td', null, cell(x.unknown, k, withA, split)))) : null,
          h('tr', { class: 'tot' }, h('td', { class: 'no' }), h('td', { class: 'nm' }, '合計'), cols.map(([k]) => h('td', null, cell(x.total, k, withA, split)))))),
        idle.length ? h('p', { class: 'note' }, `記録なし：${idle.map((r) => '#' + r.no).join(' ')}`) : null);
    };
    const t = st.map((x) => x.total);
    const fg = (s) => BT.pct(s.fg2m + s.fg3m, s.fg2a + s.fg3a);
    const pf = BT.periodFouls(g);
    // チームファウル（ピリオドごと。5つ目から相手にフリースロー）
    const foulTable = pf.size ? h('div', { class: 'boxwrap' }, h('table', { class: 'per fouls', id: 'teamFouls' },
      h('thead', null, h('tr', null, h('th', null, 'チームファウル'), per.map((p) => h('th', null, p.label)))),
      h('tbody', null, [0, 1].map((tm) => h('tr', null, h('th', null, h('i', { class: 'chip', style: { background: teamColor(tm) } }), BT.teamName(g, tm)),
        per.map((p) => { const f = (pf.get(p.period) || [0, 0])[tm]; return h('td', { class: f >= 5 ? 'bonus' : null }, String(f)); })))))) : null;
    const free = BT.teamlessStats(g);
    const freeText = BT.TYPES.filter((d) => free[d.id] > 0 && !d.shot && d.kind !== 'reb').map((d) => `${d.label} ${free[d.id]}`).concat(free.reb ? [`リバウンド ${free.reb}`] : []).join('・');
    return h('div', { class: 'stats' },
        h('div', { class: 'boxwrap' }, h('table', { class: 'per' },
          h('thead', null, h('tr', null, h('th', null, ''), per.map((p) => h('th', null, p.label)), h('th', null, '計'))),
          h('tbody', null, [0, 1].map((tm) => h('tr', null, h('th', null, h('i', { class: 'chip', style: { background: teamColor(tm) } }), BT.teamName(g, tm)), per.map((p) => h('td', null, String(p.pts[tm]))), h('td', { class: 'sum' }, String(BT.score(g)[tm]))))))),
        foulTable,
        [0, 1].map((tm) => h('section', { class: 'teamstat' },
          h('h3', null, h('i', { class: 'chip', style: { background: teamColor(tm) } }), BT.teamName(g, tm), h('small', null, ` 得点 ${t[tm].pts}` + (withA ? `・シュート成功率 ${fg(t[tm])}${t[tm].fta ? '・FT ' + BT.pct(t[tm].ftm, t[tm].fta) : ''}` : ''))),
          table(st[tm]))),
        shotBlock(g),
        freeText ? h('section', { class: 'teamstat free' }, h('h3', null, h('i', { class: 'chip neutral' }), 'チームなし', h('small', null, '（画面の下のボタン）')), h('p', { class: 'freeline' }, freeText)) : null,
        h('p', { class: 'note' }, (withA ? '2P・3P・FT は「成功/打った数」。' + (split ? '' : 'リバウンドの（ ）は、うちオフェンスリバウンド（同じチームが外したシュートの、10 秒以内のリバウンド）。') : '2P・3P・FT は、入れた本数です（設定で「シュートの失敗」のボタンを出すと、成功率も出ます）。') + (split ? 'OR はオフェンスリバウンド・DR はディフェンスリバウンド（リバウンドは合計。分けずに「リバ」で記録した分は OR・DR には入りません' + (withA ? '。ただし、同じチームが外したシュートの 10 秒以内のリバは OR に数えます' : '') + '）。' : '') + (pf.size ? 'チームファウルは、ピリオドごとの数（5つ目からは赤。相手にフリースロー）。' : '') + '「番号なし」は「？」の行で記録したプレー、「チームなし」は画面の下のボタン（パスミス・★）で記録したものです（どちらも一覧から番号を付けられます）。'));
  }
  function openStats() {
    const g = S.game;
    BT.ui.sheet({
      title: '集計', wide: true, body: statsBody(g),
      foot: [h('button', { class: 'btn', onclick: () => openExport(g) }, '💾 書き出す'), h('button', { class: 'btn primary', onclick: () => BT.ui.closeSheet() }, 'とじる')]
    });
  }

  /* ---------- 書き出す ---------- */
  function exportBody(game) {
    const g = game || S.game;
    const base = BT.fileBase(g);
    const share = BT.ui.canShareFiles();
    const go2 = async (kind) => {
      let name, blob;
      if (kind === 'json') { name = base + '.json'; blob = new Blob([JSON.stringify(BT.exportData(g), null, 1)], { type: 'application/json' }); }
      else if (kind === 'csv') { name = base + '_一覧.csv'; blob = new Blob(['\ufeff' + BT.eventsCSV(g)], { type: 'text/csv' }); }
      else { name = base + '_集計.csv'; blob = new Blob(['\ufeff' + BT.boxCSV(g)], { type: 'text/csv' }); }
      const r = await BT.ui.shareOrDownload(name, blob, share);
      if (r === 'downloaded') BT.ui.toast(`保存しました：${name}`, 'ok', 4000);
      else if (r === 'shared') BT.ui.toast('送りました', 'ok');
    };
    return h('div', { class: 'export' },
      h('button', { class: 'xitem', id: 'btnExpBox', onclick: () => go2('box') }, h('b', null, '📊 選手ごとの集計（CSV）'), h('small', null, '得点・シュート（成功/打った数）・リバウンド・パスミスなど。Excel・Numbers・Google スプレッドシートで開けます')),
      h('button', { class: 'xitem', id: 'btnExpCsv', onclick: () => go2('csv') }, h('b', null, '📋 記録の一覧（CSV）'), h('small', null, '時刻・チーム・背番号・プレー・その時点の得点')),
      h('button', { class: 'xitem', id: 'btnExpJson', onclick: () => go2('json') }, h('b', null, '🗂 記録のファイル（JSON）'), h('small', null, 'このアプリで開き直せるファイル（ほかの端末・パソコンへ渡すとき。クラウドを使っていれば、合言葉だけでも渡せます）')),
      h('p', { class: 'note' }, share ? 'スマホでは「共有」が開きます（AirDrop・「ファイル」に保存・LINE など）。' : 'ダウンロードのフォルダに保存します。'),
      videoCount(g) ? h('h4', { class: 'vhead' }, '📹 撮影した動画（MP4）') : null,
      videoItems(g));
  }
  function openExport(game) {
    const g = game || S.game;
    BT.ui.sheet({ title: '書き出す', body: exportBody(g) });
  }

  /* ---------- 設定 ---------- */
  function openSettings() {
    const p = S.prefs;
    const body = h('div', { class: 'settings' });
    const chk = (key, label, after) => h('label', { class: 'chk' }, h('input', { type: 'checkbox', dataset: { pref: key }, checked: p[key] !== false, onchange: (e) => { p[key] = e.target.checked; savePrefs(); if (after) after(); } }), label);
    const off = (key, label, after) => h('label', { class: 'chk' }, h('input', { type: 'checkbox', dataset: { pref: key }, checked: !!p[key], onchange: (e) => { p[key] = e.target.checked; savePrefs(); if (after) after(); } }), label);
    const pend = BT.cloud.pending();
    body.append(h('section', { class: 'field', id: 'setCloud' }, h('span', null, '☁️ クラウドに記録を残す'),
      chk('cloud', 'この端末だけでなく、クラウドにも記録を残す（おすすめ。端末の保存が消えても、ほかの端末でも見られます）', () => { S.cloudFetched = false; if (p.cloud !== false) BT.cloud.flush(); openSettings(); }),
      p.cloud !== false ? [
        h('div', { class: 'keybox' }, h('small', null, 'この端末の合言葉'), h('b', { id: 'cloudKey' }, BT.cloud.showKey())),
        h('p', { class: 'note' }, 'ほかの端末（パソコン・タブレット）で、この合言葉を入れると、同じ記録が見られます（試合はスマホで記録して、パソコンで動画から切り出す、など）。合言葉を知っている人は記録を見られるので、チームの外の人には教えないでください。'),
        h('div', { class: 'row' },
          h('button', { class: 'btn small', id: 'btnKeyCopy', onclick: () => copyText(BT.cloud.showKey(), '合言葉をコピーしました') }, '📋 合言葉をコピー'),
          h('button', { class: 'btn small', id: 'btnKeyLink', onclick: shareKeyLink }, '🔗 ほかの端末で開くリンク'),
          h('button', { class: 'btn small', id: 'btnKeyEnter', onclick: enterKey }, '⌨ ほかの端末の合言葉を入れる')),
        h('p', { class: 'note' }, pend ? `送る待ち：${pend}件（電波がつながったら送ります） ` : '✓ 全部の記録を送りました', pend ? h('button', { class: 'linkbtn', onclick: () => { BT.cloud.flush(); setTimeout(openSettings, 1500); } }, 'いま送る') : null)] : null));
    body.append(h('section', { class: 'field', id: 'setButtons' }, h('span', null, '選手のボタン'),
      h('p', { class: 'note' }, 'いつもある：2P・3P・FT（どれも成功）・リバ。下を選ぶと、選手ごとの行にボタンが増えます（1つずつは少し小さくなります）。'),
      off('btnMiss', 'シュートの失敗（2P・3P・FT の「×」）も記録する → 集計にシュート成功率が出ます', refresh),
      off('rebSplit', 'リバウンドを「Oリバ」（オフェンス）と「Dリバ」（ディフェンス）に分けて記録する', refresh),
      off('btnAst', 'アシスト（得点につながったパス）も記録する', refresh),
      off('btnStl', 'スティールも記録する', refresh),
      off('btnTov', 'ターンオーバー（ボールを失ったミス）も記録する → だれのミスかが残ります', refresh),
      off('btnFoul', 'ファウルも記録する（5つ目で赤くなります）', refresh)));
    body.append(h('section', { class: 'field', id: 'setShotLoc' }, h('span', null, 'シュートの場所'),
      off('shotLoc', '2P・3P を記録したあと、コートの図で打った場所も聞く → 集計に、場所ごとの数', refresh),
      h('div', { class: 'row' }, [['std', 'ふつう：3P の線あり'], ['mini', 'ミニバス：3P の線なし']].map(([v, lab]) => h('button', { class: 'btn small' + ((p.courtType === 'mini' ? 'mini' : 'std') === v ? ' on' : ''), dataset: { court: v }, onclick: () => { p.courtType = v; savePrefs(); refresh(); openSettings(); } }, lab))),
      h('p', { class: 'note' }, '試合を見ながら記録しているときは「あとで」で飛ばせます（6 秒押さなければ自動で閉じます。記録は残ります）。撮った動画を見ながら記録するときに、特に向いています。フリースローは聞きません。'),
      BT.license.can('shot', S.game) ? null : h('p', { class: 'note warn', id: 'shotLocLock' }, '🔒 シュートの場所は、場面パックの機能です。お試しの 3 試合を使ったので、いまはオンにしても聞きません（この下の「🔑 場面パック」で、購入コードを入れられます）。')));
    const curLen = BT.GC_LENS.includes(+p.periodLen) ? +p.periodLen : 600;
    body.append(h('section', { class: 'field', id: 'setClock' }, h('span', null, '試合時間（止められる時計）'),
      off('gameClock', '試合時間を出す（時間を押すと、止まる・動く）', () => { if (p.gameClock && S.game && S.game.startedAt && !S.game.endedAt) { ensureClock(S.game); save(); } refresh(); openSettings(); }),
      p.gameClock ? h('div', { class: 'row' }, [[600, '10分（一般・高校）'], [480, '8分（中学）'], [360, '6分（ミニバス）'], [300, '5分'], [0, '決めない（進んだ時間を数える）']].map(([len, lab]) => h('button', { class: 'btn small' + (curLen === len ? ' on' : ''), dataset: { gclen: String(len) }, onclick: () => {
        p.periodLen = len; savePrefs();
        if (S.game && S.game.gc && !S.game.endedAt) { S.game.gc.len = len; S.game.gc.ot = BT.gcOtOf(len); save(); }
        refresh(); openSettings();
      } }, lab))) : null,
      h('p', { class: 'note' }, '笛で止まったら時間を押して止め、再開したら押して動かします。スタートからの時間（動画と合わせるための時計）は、止まらずに進むので、小さく下に出します。ピリオドの長さを選ぶと、残りの時間を数えます（延長は、10分のピリオドなら 5分・ほかは 3分）。ずれたら、となりの「1Q」のボタンから直せます。' +
        '撮った動画を見ながら記録するときは、動画の時刻とは別に、試合時間が進みます（はじめは止まっています。ティップオフの所で時間を押します。動画を戻すと、その時刻の試合時間に戻ります）。')));
    body.append(h('section', { class: 'field' }, h('span', null, '記録の画面'),
      chk('names', '背番号の下に、選手の名前も出す（行の高さに余裕があるとき）', refresh),
      chk('unknown', '「？」の行を出す（だれか分からないときに、チームだけで記録する）', refresh),
      h('p', { class: 'note' }, '背番号を入れていないチームは、「？」の行だけ（チームとして記録）になります。')));
    body.append(h('section', { class: 'field', id: 'setRvInput' }, h('span', null, '動画を見ながら記録するときの入力'),
      h('div', { class: 'row' }, [[null, '自動'], ['pick', '2P → 14番（プレーと背番号を1つずつ）'], ['rows', '選手ごとの行']].map(([v, lab]) => h('button', { class: 'btn small' + ((p.rvInput || null) === v ? ' on' : ''), dataset: { rvinput: v || 'auto' }, onclick: () => { p.rvInput = v; savePrefs(); if (S.L) layoutLive(); openSettings(); } }, lab))),
      h('p', { class: 'note' }, '自動：選手ごとの行が画面に入りきるなら行、入らないとき（スマホの縦など）は「2P → 14番」。動画の下の「⇄」でも切りかえられます。')));
    body.append(h('section', { class: 'field' }, h('span', null, '音'),
      chk('sound', '押したときに音を出す（「ピッ」）', () => { if (p.sound) BT.ui.beep(880, 60); })));
    if (BT.camera.supported()) {
      body.append(h('section', { class: 'field' }, h('span', null, '撮影（この端末のカメラ）'),
        h('div', { class: 'row' }, Object.keys(BT.camera.QUALITY).map((k) => h('button', { class: 'btn small' + ((p.camQuality || '720') === k ? ' on' : ''), dataset: { camq: k }, onclick: () => { p.camQuality = k; savePrefs(); openSettings(); } }, BT.camera.QUALITY[k].label))),
        chk('camAudio', '録画に音も入れる（笛・声援）'),
        h('p', { class: 'note' }, `1時間あたり、720p で約 ${BT.camera.QUALITY['720'].perHour}GB・1080p で約 ${BT.camera.QUALITY['1080'].perHour}GB。次にカメラを開いたときから変わります。`)));
    }
    body.append(h('section', { class: 'field' }, h('span', null, '画面の色'),
      h('div', { class: 'row' }, [['auto', '端末に合わせる'], ['light', '明るい'], ['dark', '暗い']].map(([v, lab]) => h('button', { class: 'btn small' + (p.theme === v ? ' on' : ''), onclick: () => { p.theme = v; savePrefs(); applyTheme(); openSettings(); } }, lab)))));
    body.append(h('p', { class: 'note' }, BT.ui.wakeSupported() ? (BT.ui.awake() ? '💡 記録の途中は、画面が自動で消えないようにしています。' : '💡 記録を始めると、画面が自動で消えないようにします。') : '💡 この端末では、画面が自動で消えるのを止められません。端末の「自動ロック」を長めにしてください。'));
    function refresh() { if (S.L) buildLive(); }
    if (BT.license.enabled()) body.append(BT.license.ui.settings(openSettings));
    BT.ui.sheet({ title: '設定', body });
  }

  /* ---------- 合言葉（クラウド） ---------- */
  function copyText(text, msg) {
    const done = () => BT.ui.toast(msg || 'コピーしました', 'ok');
    try { if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).then(done, () => BT.ui.toast(text, '', 8000)); return; } } catch (e) { /* 次へ */ }
    BT.ui.toast(text, '', 8000);
  }
  function keyLink() { return `${location.origin}${location.pathname}#k=${BT.cloud.key()}`; }
  async function shareKeyLink() {
    const url = keyLink();
    try { if (navigator.share) { await navigator.share({ title: BT.APP + '（合言葉）', url }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
    copyText(url, 'リンクをコピーしました。ほかの端末で開いてください');
  }
  function enterKey(preset) {
    const inp = h('input', { type: 'text', id: 'keyInput', class: 'keyinput', autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', placeholder: 'XXXX-XXXX-XXXX-XXXX', value: typeof preset === 'string' ? preset : '' });
    const s = BT.ui.sheet({
      title: 'ほかの端末の合言葉を入れる',
      body: h('div', { class: 'settings' }, h('p', null, 'ほかの端末の「設定」に出ている合言葉（16 文字）を入れてください。この端末の記録は消えずに、その合言葉の側にも送られます。'), inp,
        h('p', { class: 'note' }, `いまの合言葉：${BT.cloud.showKey()}（もとに戻すときは、これを入れます）`)),
      foot: [h('button', { class: 'btn', onclick: () => s.close() }, 'やめる'), h('button', { class: 'btn primary', id: 'btnKeySet', onclick: () => {
        if (!BT.cloud.setKey(inp.value)) { BT.ui.toast('合言葉は 16 文字です（2〜9 と A〜Z。I・L・O はありません）', 'warn', 5000); return; }
        s.close();
        S.cloudList = null; S.cloudFetched = false;
        BT.ui.toast('合言葉を切りかえました。その合言葉の記録を読み込みます', 'ok', 4000);
        if (S.view === 'home') renderHome(); else go('home');
      } }, '切りかえる')]
    });
    setTimeout(() => { try { inp.focus(); } catch (e) { /* 無視 */ } }, 50);
  }

  /* ---------- デモ（js/demo.js） ---------- */
  function openDemo() { if (BT.demo) BT.demo.menu(); }

  /* ---------- 使い方 ---------- */
  function help() {
    BT.ui.sheet({
      title: '使い方', wide: true,
      body: h('div', { class: 'help' },
        h('div', { class: 'row helpdemo' }, h('button', { class: 'btn primary', onclick: () => { BT.ui.closeSheet(true); openDemo(); } }, '▶ 使い方のデモを見る（自動で動きます）')),
        h('h4', null, '2つの始め方'),
        h('ol', null,
          h('li', null, h('b', null, '🏀 試合を見ながら記録する'), '：試合の準備（チーム・背番号）→ ティップオフで「▶ スタート」→ プレーが起きたら、その選手の行のボタンを1回タップ →「≡ メニュー」→「試合を終える」。終えると「動画のトリミングを行いますか？」と聞くので、「はい、動画を選ぶ」→ 動画を選ぶ → 時刻を合わせる → 場面を見る・動画にする。動画がまだなら「あとで」（ホームの「✂️ 切り出し待ち」から、いつでも続きができます）'),
          h('li', null, h('b', null, '🎬 撮った動画を見ながら記録する'), '：先に動画を選んで、止めたり戻したりしながら記録します。記録を終えると、すぐに試合のページで集計・書き出し・「🎬 場面を見る・動画にする」（時刻あわせはいりません）')),
        h('h4', null, '画面の行き来'),
        h('ul', null,
          h('li', null, h('b', null, '🏠 ホーム'), '：どの画面にも「🏠」のボタンがあります（記録の途中は「≡ メニュー」→「🏠 ホームへ」。記録は保存されたままです）'),
          h('li', null, h('b', null, '📄 試合のページ'), '：試合を終えると開きます。ホームの「これまでの試合」を押しても開きます。集計・書き出し・場面の切り出し・記録を直す・続きを記録する、はここから'),
          h('li', null, h('b', null, '✂️ 場面を切り出す'), '：① 動画を選ぶ → ② 記録と動画の時刻を合わせる → ③ 場面を選んで、見る・動画にする。終わったら「✓ 終わる」で試合のページへ')),
        h('h4', null, '記録の画面'),
        h('ul', null,
          h('li', null, h('b', null, '選手ごとの行'), '：背番号の小さい順に、上から並びます。行の「2P」「3P」「FT」（どれも成功）と「リバ」（リバウンド）を押すと、その選手の記録になります'),
          h('li', null, h('b', null, '「？」の行'), '：だれか分からないとき。チームの記録になります（あとで一覧から番号を付けられます）'),
          h('li', null, h('b', null, '画面の下の「パスミス」「★ あとで見る」'), '：だれのかは決めずに、時刻だけを残します。いつでも押せます'),
          h('li', null, 'ボタンの右上の小さな数は、その選手がそのプレーをした回数です'),
          h('li', null, h('b', null, 'ボタンを足す'), '：「≡ メニュー」→「設定」の「選手のボタン」で、シュートの失敗（×）・Oリバ／Dリバ・アシスト・スティール・ターンオーバー・ファウルを出せます'),
          h('li', null, 'まちがえたら「↶ 取り消す」。どの記録も「≡ メニュー」→「記録の一覧」で直せます。名簿にない背番号は「＋番号」で足せます'),
          h('li', null, 'ピリオドは、時計の右の「1Q」を押して「2Q を始める」。時計は止まらずに進みます（試合の時計ではなく、スタートからの時間。動画と同じように進むので、あとで動画と合わせられます）'),
          h('li', null, h('b', null, '試合時間（止められる時計）'), '：「設定」の「試合時間」をオンにすると、時計が試合時間（残り 10:00 から など）になり、押すと止まる・動きます。スタートからの時間は、その下に小さく出て、止まらずに進みます。ずれたら「1Q」のボタンから直せます。動画を見ながら記録するときも、動画の時刻とは別に進みます')),
        h('h4', null, '時刻を合わせる（試合を見ながら記録したとき）'),
        h('ul', null,
          h('li', null, '記録の1つ（ふつうは「スタート」）を選び、動画をその瞬間（ジャンプボール）で止めて「⏱ この瞬間が、選んだ記録」'),
          h('li', null, 'iPhone で撮った動画なら「📅 撮影時刻から合わせる（目安）」も出ます'),
          h('li', null, '場面がずれていたら「↔ 指でずらして合わせる」：場面の枠（色の帯）を指で左右に動かすと、記録した瞬間のコマが上に出ます。プレーの瞬間で離して「✓ これで合わせる」')),
        h('h4', null, '撮影しながら記録する（この端末のカメラ）'),
        h('p', null, '「📹 撮影しながら記録する」（スタート前の札・≡ メニュー）で、録画しながら同じ画面で記録できます。ティップオフの瞬間に、赤い「● 録画と記録をスタート」を押すと、録画と記録が同時に始まります（ウォーミングアップから撮るときは、撮影の画面の「● 録画だけ先に始める」）。「試合を終える」で録画も止まります。録画を始めた時刻が分かっているので、試合のあと「📹 撮影した動画で切り出す」で、時刻あわせなしで場面を切り出せます。'),
        h('ul', null,
          h('li', null, h('b', null, '撮った動画は、試合のあと「📲 写真に保存」'), '：共有の画面で「ビデオを保存」を選ぶと、iPhone の写真アプリに入ります（iCloud 写真を使っていれば iCloud にも）。「ファイルに保存」なら iCloud Drive などへ'),
          h('li', null, '録画のあいだ、動画はいったん、このブラウザの中にためます。写真に保存したら、🗑 でこのアプリの中から消すと、次の試合の分が空きます'),
          h('li', null, '画面を消したり、ほかのアプリに切りかえたりして保存が一度とぎれたときは、自動で新しい動画として録画を続けます（「容量がいっぱい」ではありません）')),
        h('ul', null,
          h('li', null, h('b', null, '撮る向き'), '：撮影の画面で「横向き（コート全体）」か「縦向き」を選びます。横向きなら、端末を横にしてください'),
          h('li', null, h('b', null, '画面の向きのロックをしたまま'), '横に置くときは、撮影の画面の「⟲ 上側を左にして使う」「⟳ 上側を右にして使う」で、アプリごと横向きになり、横向きの動画が録れます'),
          h('li', null, '撮影の画面の映像の向きが、録れる動画の向きです。横倒し・さかさまのときは「↻ 映像を回す」で直せます'),
          h('li', null, h('b', null, 'ワイプ（記録の画面のカメラの映像）'), '：映像の右上の「＋」「－」か、撮影の画面の「ワイプの大きさ」で、小・中・大・特大。中・大は、選手のボタンに重ならない所（横長の画面なら右側）に出し、ボタンは残りの広さに並べ直します。中は、ボタンの行が縦にすべらない大きさまで。大は、もっと大きく（人数が多いと、行を縦にすべらせて選びます）。映像を押すと撮影の画面'),
          h('li', null, h('b', null, '特大'), '：相手チームの欄を小さくして映像の下に移し、その分、映像をいちばん大きく映します。自分のチームのボタンは広いまま（パスミス・★はその下）。相手の人数が多いと、相手の行は縦にすべらせて選びます')),
        h('h4', null, '撮った動画を見ながら記録する'),
        h('p', null, '試合の一覧の「🎬 撮った動画を見ながら記録する」（または試合の準備のいちばん下）で、チームを選んでから動画を選びます。記録の時刻は「動画の時刻」なので、動画を止めたり、戻したり、ゆっくり再生したりしながら、落ち着いて記録できます。'),
        h('ul', null,
          h('li', null, h('b', null, '動画の下のボタン'), '：−5秒・◀コマ（1コマもどる）・▶／⏸・コマ▶（1コマすすむ）・+5秒・速さ（×1・×0.5・×0.25・×2）・💬 コメント。コマ送りは押し続けると続けて動きます。映像を押しても、再生・一時停止。その下の細いバーを指でなぞると、好きな所へ'),
          h('li', null, h('b', null, '「2P → 14番」'), '：スマホなど、選手ごとの行が入りきらない画面では、プレー（2P・3P・FT・リバ…）と背番号を1つずつ選びます。どちらが先でもかまいません（「14」→「2P」でも）。時刻は、はじめに押したときです。「⇄」で選手ごとの行に切りかえられます'),
          h('li', null, h('b', null, '時刻をぴったりに'), '：画面の下の「いま記録したもの」を押す（または「記録の一覧」で選ぶ）→「📍 映像で時刻を合わせる」→ コマ送りで合わせて「✓ この時刻」'),
          h('li', null, h('b', null, '💬 コメント・スタンプ'), '：その場面から数秒、映像の上に出ます。場面を切り出して書き出す動画にも入ります'),
          h('li', null, '得点は、いま映っている時刻までの得点です。ピリオドは、動画をその始まりまで動かしてから「1Q」を押して決めます'),
          h('li', null, '動画の中身は保存しません。続きを記録するときは、同じ動画をもう一度選びます（見ていた所から始まります）'),
          h('li', null, 'キーボード：スペース 再生／一時停止・← → 5秒・, . 1コマ')),
        h('h4', null, '📍 シュートの場所（設定）'),
        h('p', null, '「設定」の「シュートの場所」をオンにすると、2P・3P を記録したあとにコートの図が出ます。打った場所を1回押すと、その記録に場所が付きます（「あとで」で飛ばしても、記録は残ります。試合を見ながら記録しているときは、6 秒で自動で閉じます）。場所は「記録の一覧」から付けたり、動かしたり、消したりできます。集計に、場所の図とゾーン（ゴール下・ペイント・ミドル・3P のコーナー／ウィング／トップ）ごとの数が出ます。ミニバスのコートを選ぶと、3P の線がなく、遠いシュートは「ロング」になります。'),
        h('h4', null, '☁️ 記録の保存'),
        h('ul', null,
          h('li', null, '記録は1つ押すたびに、この端末に保存し、クラウドにも送ります（記録の途中は数秒ごと。電波がないときは、つながったら送ります）'),
          h('li', null, '「⚙ 設定」の合言葉を、ほかの端末で入れると、同じ記録が見られます'),
          h('li', null, '動画そのものは送りません（動画は、この端末の中だけで扱います）')),
        h('h4', null, 'うまく使うコツ'),
        h('ul', null,
          h('li', null, '画面が消えないように、記録中は自動で止めています（できない端末では、自動ロックを長めに）'),
          h('li', null, 'iPhone は「共有」→「ホーム画面に追加」すると、画面いっぱいに使えます'),
          h('li', null, 'キーボード（動画の画面）：スペース 再生／一時停止・← → 5秒・, . 1コマ')))
    });
  }

  /* ---------- 起動 ---------- */
  function init() {
    takeFrom();
    applyTheme();
    if (root.matchMedia) { try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme); } catch (e) { /* 古いブラウザ */ } }
    // iPhone で :active（押している間の見た目）を効かせる
    document.addEventListener('touchstart', () => {}, { passive: true });
    // 長押しのメニュー・ダブルタップの拡大を出さない（記録の画面）
    document.addEventListener('contextmenu', (e) => { if (S.view === 'live' && e.target.closest && e.target.closest('.panels, .lbar, .gbar')) e.preventDefault(); });
    document.addEventListener('dblclick', (e) => { if (S.view === 'live') e.preventDefault(); }, { passive: false });
    root.addEventListener('popstate', onPop);
    root.addEventListener('beforeunload', (e) => { if (camRec() || (S.view === 'live' && S.game && S.game.startedAt && !S.game.endedAt)) { e.preventDefault(); e.returnValue = ''; } });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && BT.ui.sheetOpen()) { BT.ui.closeSheet(); return; }
      // 動画を見ながら記録：スペース 再生／一時停止・← → 5秒（Shift で 1秒）・, . 1コマ
      if (S.view !== 'live' || !S.L || !S.L.rvBox || BT.ui.sheetOpen() || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      const k = e.key;
      // （押したボタンにフォーカスが残っていると、スペースでそのボタンも押されてしまうので外す）
      if (k === ' ' && document.activeElement && document.activeElement.tagName === 'BUTTON') document.activeElement.blur();
      if (k === ' ' || k === 'k') rvToggle();
      else if (k === 'ArrowLeft') rvSeekBy(e.shiftKey ? -1 : -5);
      else if (k === 'ArrowRight') rvSeekBy(e.shiftKey ? 1 : 5);
      else if (k === ',') rvStep(-1);
      else if (k === '.') rvStep(1);
      else return;
      e.preventDefault();
    });
    setInterval(tick, 200);
    let rq = 0;
    const relayout = () => { cancelAnimationFrame(rq); rq = requestAnimationFrame(() => { applyRot(); layoutLive(); updateCamUI(); }); };
    root.addEventListener('resize', relayout);
    root.addEventListener('orientationchange', () => setTimeout(relayout, 250));
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { if (camRec()) S.camHiddenAt = Date.now(); if (rvReady()) save(); return; }
      tick();
      // 画面を離れていたあいだは、録画が止まっていることがある（iPhone など）→ 新しい動画として続ける
      if (S.camHiddenAt) { const away = Date.now() - S.camHiddenAt; S.camHiddenAt = 0; if (away > 1500) camSplit(); }
    });
    // オフラインでも開けるように（https で公開しているときだけ。手元のテストでは使わない）
    if (root.location && location.protocol === 'https:' && navigator.serviceWorker) navigator.serviceWorker.register('sw.js').catch(() => {});
    // 記録中の試合があれば、そのまま続きから
    // 送り残しの記録があれば、クラウドへ
    BT.cloud.on(() => { const el = $('#hubCloud'); if (el && S.view === 'game' && S.game) { const cs = BT.cloud.status(S.game.id); el.className = 'cloud ' + cs.s; el.textContent = cs.s === 'ok' ? '☁️ クラウドに保存ずみ' : cs.s === 'wait' ? (cs.busy ? '☁️ 送っています…' : '☁️ 送る待ち（つながったら送ります）') : '🔒 この端末だけに保存'; } const n = $('#cloudNote'); if (n) n.textContent = cloudNoteText(); });
    BT.cloud.flush();
    // 記録中の試合があれば、そのまま続きから（デモの途中で閉じた試合は消す）
    BT.store.games().filter((x) => x.demo).forEach((x) => BT.store.deleteGame(x.id));
    const cur = BT.store.current();
    const g = cur ? BT.store.loadGame(cur) : null;
    if (g && g.startedAt && !g.endedAt && !g.demo) openGame(g);
    else go('home');
    // 合言葉のリンク（#k=…）で開いたとき：この端末の合言葉を切りかえるか聞く
    const m = /[#&]k=([0-9A-Za-z-]{16,24})/.exec(location.hash || '');
    if (m) {
      try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* 無視 */ }
      const k = BT.cloud.normKey(m[1]);
      if (k && k !== BT.cloud.key()) enterKey(BT.cloud.showKey(k));
    }
  }

  BT.app = { S, init, growHref, growFrom, start, undo, redo, record, openMenu, openLog, openEdit, openStats, openExport, openSettings, openPeriod, openKeypad, endGame, reopen, newGame, go, resume, openCamera, camStart, camStop, camClose, camSplit, setUiRot, turnVideo, effRot, orientOK, setWipe,
    rvAttach, rvToggle, rvSeekTo, rvStep, rvNow, rvAdjust, openNote, openNotes, toggleRvInput, layoutLive,
    setGame, openGame, openHub, openTrim, askTrim, renderGame, renderHome, toLive, toReview, save, rvMode, rvReady, elapsed, enterKey, help, deleteGame, shotLocOn, askShotLoc };
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  }
})(typeof window !== 'undefined' ? window : globalThis);
