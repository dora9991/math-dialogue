/* バスケ タップ記録 — 画面
   試合の一覧（home）→ 試合の準備（setup：チーム名・色・背番号）→ 記録（live）。
   記録の画面は、いちど作ったら作り直さず、表示（数字・色・選んでいる番号）だけを書き換える
   （押している間にボタンが入れ替わると、Safari ではタップにならないため）。 */
(function (root) {
  'use strict';
  const BT = root.BT;
  const { h, $, $$ } = BT.ui;
  const CLIPS_URL = '../basket-clips/';

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
  const elapsed = () => BT.elapsed(S.game, now());
  function save() {
    if (!S.game) return;
    // 保存できないとき（プライベートブラウズ・空きがない）は、記録のたびに出さず、1回だけ知らせる
    if (!BT.store.saveGame(S.game) && !S.saveWarned) {
      S.saveWarned = true;
      BT.ui.toast('このブラウザに保存できません（プライベートブラウズ・空きが足りない など）。記録は続けられますが、終わったら必ず「書き出す」でファイルに残してください', 'err', 9000);
    }
  }
  function applyTheme() {
    const t = S.prefs.theme;
    if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme;
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', getComputedStyle(document.body).getPropertyValue('--bg').trim() || '#0b0f17');
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
    S.view = view;
    BT.ui.closeSheet(true);
    if (view === 'home') renderHome();
    else if (view === 'setup') renderSetup();
    else if (view === 'live') buildLive();
    root.scrollTo(0, 0);
  }
  function openGame(game) {
    S.game = game;
    S.redo = [];
    BT.store.setCurrent(game.id);
    go('live');
    if (game.startedAt && !game.endedAt) { BT.ui.keepAwake(true); guard(); }
  }

  /* ========== 試合の一覧 ========== */
  function renderHome() {
    S.L = null;
    document.body.dataset.view = 'home';
    BT.ui.keepAwake(false);
    const V = $('#view');
    V.innerHTML = '';
    const list = BT.store.games();
    const curId = BT.store.current();
    const cur = curId ? list.find((g) => g.id === curId) : null;
    const going = cur && cur.startedAt && !cur.endedAt ? cur : null;
    V.append(
      h('header', { class: 'hbar' },
        h('div', { class: 'brand' }, h('span', { class: 'logo', 'aria-hidden': 'true' }, '🏀'), h('div', null, h('b', null, BT.APP), h('small', null, '試合を見ながらタップで記録 → 動画の切り出しにも'))),
        h('button', { class: 'btn icon', id: 'btnHelp', 'aria-label': '使い方', onclick: help }, '？')),
      h('main', { class: 'home' },
        going ? h('section', { class: 'card going' },
          h('div', { class: 'going-h' }, h('span', { class: 'recdot' }), h('b', null, '記録中の試合があります')),
          gameLine(going),
          h('button', { class: 'btn primary huge', id: 'btnResume', onclick: () => resume(going.id) }, '続きを記録する')) : null,
        h('button', { class: 'btn ' + (going ? '' : 'primary ') + 'huge', id: 'btnNew', onclick: newGame }, '＋ 新しい試合を記録する'),
        list.length ? h('section', { class: 'card' }, h('h2', null, 'これまでの試合'), h('div', { class: 'games' }, list.map(gameRow))) : h('section', { class: 'card steps3' },
          h('h2', null, 'つかいかた'),
          h('ol', null,
            h('li', null, h('b', null, 'チームと背番号を選ぶ'), h('span', null, '「4〜15」ボタンでまとめて。自分のチームは次から自動で入ります')),
            h('li', null, h('b', null, 'ティップオフで ▶ スタート'), h('span', null, '左上の時計が動き出します')),
            h('li', null, h('b', null, '選手の行のボタンを1回タップ'), h('span', null, '「7」の行の「2P」を押すだけ。パスミス・★ は画面の下でいつでも。押した瞬間の時刻で残ります')))),
        h('section', { class: 'card tools' },
          h('h2', null, '動画から場面を切り出す'),
          h('p', null, '記録した試合のファイル（書き出す → 記録のファイル）を「バスケ得点クリップ」で試合の動画と一緒に開くと、記録した場面（シュート・リバウンド・パスミスなど）を動画から切り出して、続けて見たり、1本の動画にしたりできます。'),
          h('div', { class: 'row' },
            h('a', { class: 'btn', href: CLIPS_URL, target: '_blank', rel: 'noopener' }, '🎬 バスケ得点クリップを開く'),
            h('button', { class: 'btn', onclick: importFile }, '📂 記録のファイルを開く'))),
        h('p', { class: 'note' }, '🔒 記録はこの端末のブラウザの中だけに保存します（どこにも送りません）。大事な試合は「書き出す」でファイルにも残してください（iPhone などは、長く開かないサイトの保存を消すことがあります）。')));
  }
  function gameLine(g) {
    const when = g.startedAt ? `${g.date} ${new Date(g.startedAt).toTimeString().slice(0, 5)}` : `${g.date}（まだスタートしていません）`;
    return h('div', { class: 'gline' },
      h('span', { class: 'when' }, when),
      h('span', { class: 'vs' }, h('i', { class: 'chip', style: { background: g.colors[0] } }), g.names[0], h('b', null, ` ${g.score[0]} − ${g.score[1]} `), g.names[1], h('i', { class: 'chip', style: { background: g.colors[1] } })),
      g.title ? h('span', { class: 'gtitle' }, g.title) : null);
  }
  function gameRow(g) {
    return h('div', { class: 'grow', dataset: { id: g.id } },
      h('button', { class: 'gopen', onclick: () => resume(g.id) }, gameLine(g), h('small', { class: 'note' }, `${g.n}件の記録${g.endedAt ? '' : g.startedAt ? '・記録中' : ''}`)),
      h('button', { class: 'btn small', title: '書き出す', onclick: () => { const game = BT.store.loadGame(g.id); if (game) openExport(game); } }, '書き出す'),
      h('button', { class: 'btn small danger', title: '消す', onclick: () => BT.ui.confirm('この試合を消しますか？', `${g.date} ${g.names[0]} ${g.score[0]} − ${g.score[1]} ${g.names[1]}（${g.n}件の記録）。消すと元に戻せません。書き出したファイルは残ります。`, '消す', () => { BT.store.deleteGame(g.id); renderHome(); BT.ui.toast('消しました', 'ok'); }, true) }, '消す'));
  }
  function resume(id) {
    const g = BT.store.loadGame(id);
    if (!g) { BT.ui.toast('この試合の記録が見つかりませんでした', 'err'); renderHome(); return; }
    openGame(g);
  }
  async function importFile() {
    const f = await BT.ui.pickText();
    if (!f) return;
    try {
      const g = BT.importData(f.text);
      if (BT.store.loadGame(g.id)) g.id = BT.uid('g');      // 同じ試合がもうあるときは、別の試合として開く
      BT.store.saveGame(g);
      openGame(g);
      BT.ui.toast('記録のファイルを開きました', 'ok');
    } catch (e) { BT.ui.toast('開けませんでした：' + e.message, 'err', 6000); }
  }

  /* ========== 試合の準備（チーム名・色・背番号） ========== */
  function newGame() {
    const mine = BT.store.myTeam();
    S.draft = { title: '', teams: [mine ? { name: mine.name, color: mine.color, colorName: mine.colorName, players: BT.cleanPlayers(mine.players) } : BT.blankTeam(0), BT.blankTeam(1)] };
    if (S.draft.teams[0].color === S.draft.teams[1].color) Object.assign(S.draft.teams[1], S.draft.teams[0].color === '#2f6fed' ? { color: '#d93636', colorName: '赤' } : {});
    S.setupFor = 'new';
    S.more = [false, false];
    go('setup');
  }
  const setupTeams = () => (S.setupFor === 'edit' ? S.game.teams : S.draft.teams);
  function setupChanged() { if (S.setupFor === 'edit') save(); }

  function renderSetup() {
    S.L = null;
    document.body.dataset.view = 'setup';
    const V = $('#view');
    V.innerHTML = '';
    const edit = S.setupFor === 'edit';
    V.append(
      h('header', { class: 'hbar' },
        h('button', { class: 'btn', onclick: () => (edit ? go('live') : go('home')) }, edit ? '← 記録へ戻る' : '← 戻る'),
        h('b', { class: 'htitle' }, edit ? 'チーム・背番号を直す' : '試合の準備'),
        h('span', { class: 'spacer' })),
      h('main', { class: 'setup' },
        h('p', { class: 'lead' }, '背番号は、下の番号をタップして選びます（「4〜15」などのボタンで、まとめて選べます）。名前はなくても大丈夫です。'),
        h('div', { class: 'teams2' }, [0, 1].map((i) => teamCard(i))),
        edit ? null : h('section', { class: 'card' },
          h('label', { class: 'field' }, h('span', null, '試合のメモ（なくてもOK）'),
            h('input', { type: 'text', id: 'gameTitle', maxlength: 40, placeholder: '例：練習試合・新人戦 1回戦', value: S.draft.title, oninput: (e) => { S.draft.title = e.target.value; } }))),
        h('div', { class: 'gobar' },
          edit ? h('button', { class: 'btn primary huge', onclick: () => { saveTeams(); go('live'); } }, '記録へ戻る')
            : h('button', { class: 'btn primary huge', id: 'btnToLive', onclick: toLive }, '記録の画面へ →'))));
  }
  function saveTeams() {
    const T = setupTeams();
    if (T[0].name) BT.store.saveTeam(T[0], true);
    if (T[1].name) BT.store.saveTeam(T[1], false);
  }
  function toLive() {
    const T = S.draft.teams;
    saveTeams();
    const g = BT.newGame({ teams: T, title: (S.draft.title || '').trim() });
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
    L.clock = h('button', { class: 'clock', id: 'clock', title: 'スタートからの時間', onclick: openMenu }, h('span', { class: 'recdot' }), h('span', { class: 'tval', id: 'tval' }, '0:00'));
    L.start = h('button', { class: 'startbtn', id: 'btnStart', onclick: start }, '▶ スタート');
    L.period = h('button', { class: 'period', id: 'btnPeriod', 'aria-label': 'ピリオド', onclick: openPeriod }, '1Q');
    L.score = [0, 1].map((tm) => h('span', { class: 'sc', id: 'score' + tm, style: { '--tc': g.teams[tm].color, '--tink': BT.inkOn(g.teams[tm].color) } }, '0'));
    const bar = h('header', { class: 'lbar' }, L.clock, L.start, L.period,
      h('div', { class: 'score', 'aria-label': '得点' }, L.score[0], h('span', { class: 'dash' }, '−'), L.score[1]),
      h('button', { class: 'menubtn', id: 'btnMenu', 'aria-label': 'メニュー', onclick: openMenu }, h('span', null, '≡'), h('small', null, 'メニュー')));
    const P = L.panelsEl = h('main', { class: 'panels' }, [0, 1].map(buildPanel));
    P.addEventListener('click', onPanelClick);
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
    L.root = h('div', { class: 'live' }, bar, h('div', { class: 'stagewrap' }, P, L.cover), L.gbar);
    V.append(L.root);
    updateLive();
    layoutLive();
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
      BT.ROW_TYPES.forEach((type) => {
        const d = BT.TYPE[type];
        const cnt = h('i', { class: 'cnt', hidden: true });
        const el = h('button', { class: 'pb k-' + type, dataset: { type, no }, 'aria-label': `${BT.teamName(g, tm)} ${who} ${d.label}` }, h('b', null, d.btn), cnt);
        row.append(el);
        L.btns.push({ team: tm, key: tm + ':' + no + ':' + type, el, cnt });
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
    live.classList.toggle('short', root.innerHeight < 430);
    const plan = BT.planLayout(P.clientWidth, P.clientHeight, [L.panels[0].n, L.panels[1].n], L.panels[0].head.offsetHeight || 22);
    live.classList.toggle('lay-side', plan.arr === 'side');
    live.classList.toggle('lay-stack', plan.arr === 'stack');
    L.plan = plan;
    plan.teams.forEach((T, tm) => {
      const sec = L.panels[tm].sec;
      const unit = Math.max(BT.LAYOUT.rmin, Math.min(T.bw, T.rowH));
      sec.style.setProperty('--c', T.c);
      sec.style.setProperty('--r', T.r);
      sec.style.setProperty('--nw', T.nw + 'px');
      sec.style.setProperty('--base', Math.ceil(T.base) + 'px');
      sec.style.setProperty('--bf', Math.round(BT.clamp(unit * 0.44, 13, 24)) + 'px');
      sec.style.setProperty('--nf', Math.round(BT.clamp(Math.min(Math.max(T.rowH, BT.LAYOUT.rmin) * 0.56, T.nw * 0.5), 14, 30)) + 'px');
      sec.classList.toggle('roomy', T.rowH >= 40 && T.nw >= 46);      // 名前を出す余裕（高さと、背番号の欄の幅）
      sec.classList.toggle('narrowb', T.bw < 48);
      sec.classList.toggle('scroll', T.rowH < BT.LAYOUT.rmin);
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
    if (!S.game.startedAt) { say('先に「▶ スタート」を押してください', 'warn'); return false; }
    if (S.game.endedAt) { say('試合は終わっています', 'warn'); return false; }
    return true;
  }
  /* 1回で記録する：tm＝チーム（null はチームなし）・no＝背番号（null は番号なし）。時刻は押した瞬間 */
  function record(tm, no, type, btn) {
    if (!canRecord()) return;
    const t0 = now();
    const key = tm + ':' + no + ':' + type;
    if (S.lastTap.key === key && t0 - S.lastTap.at < 450) return;        // 二度押し（同じボタンを 0.45 秒以内）は1回に
    S.lastTap = { key, at: t0 };
    BT.addEvent(S.game, { t: elapsed(), type, team: tm, no });
    S.redo = [];
    save();
    flash(btn);
    feel(BT.TYPE[type].kind);
    updateLive(BT.TYPE[type].pts ? tm : null);
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
    L.start.hidden = started;
    L.clock.hidden = !started;
    L.clock.classList.toggle('ended', ended);
    tickClock(true);
    L.period.textContent = BT.periodLabel(started ? BT.currentPeriod(g, now()) : (g.startPeriod || 1));
    const sc = BT.score(g);
    L.score[0].parentNode.classList.toggle('big3', Math.max(sc[0], sc[1]) >= 100);
    [0, 1].forEach((tm) => {
      L.score[tm].textContent = sc[tm];
      L.panels[tm].tsc.textContent = sc[tm];
      if (bump === tm) { flash(L.score[tm]); flash(L.panels[tm].tsc); }
    });
    // ボタンの右上の数（その選手が、そのプレーを何回したか）
    const tl = BT.tally(g);
    L.btns.forEach((b) => setCnt(b.cnt, tl[b.key] || 0));
    BT.GLOBAL_TYPES.forEach((type) => setCnt(L.gb[type].cnt, tl['*:' + type] || 0));
    L.gbar.classList.toggle('off', !started || ended);
    // スタートの前・試合が終わったあとは、パネルの上に大きなボタンを出す
    L.cover.innerHTML = '';
    if (!started) {
      L.cover.append(h('div', { class: 'cover-card' },
        h('button', { class: 'startbig', id: 'btnStartBig', onclick: start }, '▶ スタート'),
        h('p', null, h('b', null, 'ティップオフ（試合開始のジャンプボール）の瞬間'), 'に押してください。'),
        h('p', { class: 'note' }, '時計が動き出し、そこからの時間でプレーを記録します。あとで動画と合わせるときの目印にもなります。'),
        h('button', { class: 'btn small', onclick: openPeriod }, `${BT.periodLabel(g.startPeriod || 1)} から始める（変える）`)));
    } else if (ended) {
      L.cover.append(h('div', { class: 'cover-card' },
        h('b', { class: 'endtitle' }, '試合終了'),
        h('div', { class: 'endscore' }, h('span', null, BT.teamName(g, 0)), h('b', null, `${sc[0]} − ${sc[1]}`), h('span', null, BT.teamName(g, 1))),
        h('div', { class: 'row center' },
          h('button', { class: 'btn primary', onclick: openStats }, '📊 集計を見る'),
          h('button', { class: 'btn primary', onclick: () => openExport(g) }, '💾 書き出す')),
        h('button', { class: 'btn small', onclick: reopen }, '続きを記録する（まちがえて終えたとき）')));
    }
    L.cover.hidden = started && !ended;
    renderLast();
  }
  let lastClock = '';
  function tickClock(force) {
    const L = S.L;
    if (!L || !S.game || !S.game.startedAt) return;
    const s = BT.fmtTime(elapsed());
    if (force || s !== lastClock) { lastClock = s; const el = $('#tval'); el.textContent = s; el.classList.toggle('long', s.length > 5); }
  }
  function tick() {
    if (S.view !== 'live' || !S.game || !S.L) return;
    tickClock();
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
    if (S.msg) {
      const m = S.msg;
      el.append(h('div', { class: 'lastev msg ' + m.kind, role: 'status', 'aria-live': 'polite' }, h('span', { class: 'mt' }, m.text)),
        m.action ? h('button', { class: 'btn undo act', id: 'btnMsgAct', onclick: () => { S.msg = null; clearTimeout(S.msgTimer); m.action.onClick(); if (S.L) renderLast(); } }, m.action.label)
          : (g.events.length > 1 ? undoBtn() : null));
      return;
    }
    if (!g.startedAt) { el.append(h('div', { class: 'lastev hint' }, h('span', { class: 'mt' }, 'スタートを押すと、記録できます'))); return; }
    const ev = g.events[g.events.length - 1];
    if (!ev) return;
    const d = BT.TYPE[ev.type];
    const per = ev.type === 'period';
    const nm = !per && ev.no != null ? BT.playerName(g, ev.team, ev.no) : '';
    const who = per ? '' : ev.team == null ? 'チームなし' : `${BT.teamName(g, ev.team)} ${ev.no != null ? '#' + ev.no + (nm ? ' ' + nm : '') : '番号なし'}`;
    el.append(
      h('div', { class: 'lastev', role: 'status', 'aria-live': 'polite', style: { '--tc': per || ev.team == null ? 'var(--line2)' : teamColor(ev.team) } },
        h('div', { class: 'l1' }, h('b', { class: 'lt' }, BT.fmtTime(ev.t)), h('span', { class: 'll' }, per ? `${BT.periodLabel(ev.period)} 開始` : (d.short || d.label) + (d.pts ? ` +${d.pts}` : ''))),
        per ? null : h('div', { class: 'lw' }, who)),
      g.events.length > 1 ? undoBtn() : null);
  }
  function undo() {
    const g = S.game;
    const ev = g.events[g.events.length - 1];
    if (!ev) return;
    if (g.events.length === 1 && ev.type === 'period') { say('スタートは「≡ メニュー」から取り消せます', 'warn', 4000); return; }
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
    save();
    feel('made');
    BT.store.persist();
    BT.ui.keepAwake(true).then((ok) => {
      if (!ok && !S.warnedWake) { S.warnedWake = true; say('自動ロックを止められません（設定で長めに）', 'warn', 6000); }
    });
    guard();
    updateLive();
  }
  function cancelStart() {
    const g = S.game;
    g.startedAt = null; g.endedAt = null; g.events = []; g.seq = 0;
    S.redo = [];
    BT.ui.keepAwake(false);
    save();
    updateLive();
    say('スタートを取り消しました', 'ok');
  }
  function endGame() {
    const g = S.game;
    g.endedAt = now();
    BT.ui.keepAwake(false);
    save();
    updateLive();
    openStats();
  }
  function reopen() {
    S.game.endedAt = null;
    save();
    BT.ui.keepAwake(true);
    guard();
    updateLive();
    say('続きを記録できます（時計は進んだまま）', 'ok', 4000);
  }

  /* 記録の途中で「戻る」（スワイプ・戻るボタン）で、うっかりページを離れないように */
  function guard() {
    if (S.guarded || !root.history || !history.pushState) return;
    history.pushState({ btap: 1 }, '');
    S.guarded = true;
  }
  function onPop() {
    S.guarded = false;
    if (BT.ui.sheetOpen()) { BT.ui.closeSheet(); guard(); return; }
    if (S.view === 'live' && S.game && S.game.startedAt && !S.game.endedAt) {
      guard();
      say('記録中です（終えるときは ≡ メニューから）', 'warn', 4000);
      return;
    }
    if (S.view === 'setup' && S.setupFor === 'edit' && S.game) { go('live'); if (S.game.startedAt && !S.game.endedAt) guard(); return; }
    if (S.view !== 'home') go('home');
  }

  /* ---------- ピリオド ---------- */
  function openPeriod() {
    const g = S.game;
    const started = !!g.startedAt;
    const cur = started ? BT.currentPeriod(g, now()) : (g.startPeriod || 1);
    const pick = (p) => {
      s.close();
      if (!started) { g.startPeriod = p; save(); updateLive(); return; }
      const ev = BT.addEvent(g, { t: elapsed(), type: 'period', period: p });
      S.redo = [];
      save(); feel('made'); updateLive();
      say(`${BT.periodLabel(p)} を始めました（${BT.fmtTime(ev.t)}）`, 'ok');
    };
    const others = [1, 2, 3, 4, 5, 6].filter((p) => p !== cur + 1);
    const s = BT.ui.sheet({
      title: started ? `ピリオド（いまは ${BT.periodLabel(cur)}）` : '始めるピリオド',
      body: h('div', { class: 'periodbox' },
        started ? h('button', { class: 'btn primary huge', id: 'btnNextPeriod', onclick: () => pick(cur + 1) }, `${BT.periodLabel(cur + 1)} を始める`) : null,
        h('div', { class: 'row pgrid' }, (started ? others : [1, 2, 3, 4, 5]).map((p) => h('button', { class: 'btn' + (!started && p === cur ? ' on' : ''), onclick: () => pick(p) }, started ? `${BT.periodLabel(p)} にする` : BT.periodLabel(p)))),
        h('p', { class: 'note' }, started ? '次のピリオドが始まる瞬間に押します。始まった時刻が記録に残り、動画で場面を探すときの目印にもなります。押し忘れたら、あとで「記録の一覧」でピリオドの時刻を直せます（それより後の記録は、自動でそのピリオドになります）。' : 'スタートを押したときのピリオドです（途中から記録するときに）。'))
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
    updateLive();
    layoutLive();
  }

  /* ---------- メニュー ---------- */
  function openMenu() {
    const g = S.game;
    const plays = g.events.filter((e) => e.type !== 'period').length;
    const item = (icon, label, sub, fn, cls) => h('button', { class: 'mitem' + (cls ? ' ' + cls : ''), onclick: () => { s.close(); fn(); } }, h('span', { class: 'mi' }, icon), h('span', { class: 'mt' }, h('b', null, label), sub ? h('small', null, sub) : null));
    const s = BT.ui.sheet({
      title: g.startedAt ? `メニュー（${BT.fmtTime(elapsed())}・${plays}件の記録）` : 'メニュー',
      body: h('div', { class: 'menu' },
        item('📋', '記録の一覧', '番号・プレー・時刻を直す、消す', openLog),
        item('📊', '集計', '選手ごとの得点・リバウンド・パスミスなど', openStats),
        item('👥', 'チーム・背番号を直す', '名前・色・背番号', () => { S.setupFor = 'edit'; go('setup'); }),
        item('🎛', '設定', '名前の表示・「？」の行・音・画面の色', openSettings),
        item('💾', '書き出す', '動画の切り出し用のファイル・CSV', () => openExport(g)),
        g.startedAt && !g.endedAt ? item('⏹', '試合を終える', '時計を止めて、集計を見る', () => BT.ui.confirm('試合を終えますか？', '時計が止まります。まちがえて終えたときは「続きを記録する」で戻せます。', '終える', endGame)) : null,
        g.endedAt ? item('▶', '続きを記録する', 'まちがえて終えたとき', reopen) : null,
        g.startedAt && !plays ? item('↺', 'スタートを取り消す', 'まちがえて押したとき（記録がまだないときだけ）', () => BT.ui.confirm('スタートを取り消しますか？', '時計が 0:00 に戻ります。', '取り消す', cancelStart)) : null,
        item('❓', '使い方', null, help),
        item('🏠', '試合の一覧へ', g.startedAt && !g.endedAt ? '記録は保存されています。あとで続きから記録できます' : null, () => go('home'))),
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
        h('b', { class: 'lt' }, BT.fmtTime(e.t)),
        e.type === 'period' ? h('span', { class: 'lp' }, `── ${BT.periodLabel(e.period)} 開始 ──`) : [
          e.team == null ? h('i', { class: 'chip neutral' }) : h('i', { class: 'chip', style: { background: teamColor(e.team) } }),
          h('span', { class: 'lno' }, e.no != null ? '#' + e.no : '—'),
          h('span', { class: 'llabel k-' + d.kind }, d.label + (d.pts ? ` +${d.pts}` : '')),
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
        h('p', { class: 'note' }, 'タップすると、番号・プレー・時刻を直したり、消したりできます。新しい記録が上です。'),
        evs.length ? h('div', { class: 'loglist' }, evs.map(row)) : h('p', { class: 'note' }, 'まだ記録はありません。'))
    });
    return s;
  }
  function openEdit(id) {
    const g = S.game;
    const e = BT.findEvent(g, id);
    if (!e) return;
    const changed = () => { save(); if (S.L) updateLive(); openEdit(id); };
    const nudge = (d) => h('button', { class: 'btn small', onclick: () => { e.t = Math.max(0, Math.round((e.t + d) * 10) / 10); changed(); } }, (d > 0 ? '+' : '−') + Math.abs(d) + '秒');
    const body = h('div', { class: 'edit' });
    body.append(h('div', { class: 'field' }, h('span', null, `時刻（スタートから）：${BT.fmtTime(e.t, true)}`), h('div', { class: 'row' }, nudge(-5), nudge(-1), nudge(-0.5), nudge(0.5), nudge(1), nudge(5))));
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
        BT.editTypes(e.type).map((id) => { const d = BT.TYPE[id]; return h('button', { class: 'btn small k-' + d.kind + (e.type === id ? ' on' : ''), dataset: { etype: id }, onclick: () => { e.type = id; if (d.pts && e.team == null) e.team = 0; changed(); } }, d.label); }))));
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
    ['pts', '得点'], ['fg2', '2P'], ['fg3', '3P'], ['ft', 'FT'], ['reb', 'リバウンド'], ['ast', 'アシスト'], ['stl', 'スティール'], ['blk', 'ブロック'],
    ['pass', 'パスミス'], ['tov', 'ミス'], ['foul', 'ファウル'], ['mark', '★']
  ];
  /* withA：「成功/打った数」で出す（外れの記録があるときだけ。ないときは入れた本数） */
  function cell(s, key, withA) {
    if (key === 'fg2' || key === 'fg3' || key === 'ft') { const m = s[key + 'm'], a = s[key + 'a']; return !a ? '' : withA ? `${m}/${a}` : String(m); }
    if (key === 'reb') return s.reb ? (s.oreb ? `${s.reb}（${s.oreb}）` : String(s.reb)) : '';
    return s[key] ? String(s[key]) : '';
  }
  function hasCol(st, key) {
    const any = (s) => (key === 'fg2' || key === 'fg3' || key === 'ft' ? s[key + 'a'] : s[key]);
    return st.some((x) => any(x.total));
  }
  function openStats() {
    const g = S.game;
    const st = BT.stats(g);
    const per = BT.periodScores(g);
    const withA = BT.hasMisses(g);
    const cols = COLS.filter(([k]) => k === 'pts' || hasCol(st, k));
    const table = (x) => {
      const rows = x.rows.filter((r) => !BT.isEmpty(r.s));
      const idle = x.rows.filter((r) => BT.isEmpty(r.s));
      return h('div', { class: 'boxwrap' }, h('table', { class: 'box' },
        h('thead', null, h('tr', null, h('th', null, '#'), h('th', { class: 'nm' }, '名前'), cols.map(([, lab]) => h('th', null, lab)))),
        h('tbody', null,
          rows.map((r) => h('tr', null, h('td', { class: 'no' }, r.no), h('td', { class: 'nm' }, r.name || ''), cols.map(([k]) => h('td', null, cell(r.s, k, withA))))),
          !BT.isEmpty(x.unknown) ? h('tr', { class: 'unk' }, h('td', { class: 'no' }, '—'), h('td', { class: 'nm' }, '番号なし'), cols.map(([k]) => h('td', null, cell(x.unknown, k, withA)))) : null,
          h('tr', { class: 'tot' }, h('td', { class: 'no' }), h('td', { class: 'nm' }, '合計'), cols.map(([k]) => h('td', null, cell(x.total, k, withA)))))),
        idle.length ? h('p', { class: 'note' }, `記録なし：${idle.map((r) => '#' + r.no).join(' ')}`) : null);
    };
    const t = st.map((x) => x.total);
    const fg = (s) => BT.pct(s.fg2m + s.fg3m, s.fg2a + s.fg3a);
    const free = BT.teamlessStats(g);
    const freeText = BT.TYPES.filter((d) => free[d.id] > 0 && !d.shot && d.id !== 'reb').map((d) => `${d.label} ${free[d.id]}`).concat(free.reb ? [`リバウンド ${free.reb}`] : []).join('・');
    BT.ui.sheet({
      title: '集計', wide: true,
      body: h('div', { class: 'stats' },
        h('div', { class: 'boxwrap' }, h('table', { class: 'per' },
          h('thead', null, h('tr', null, h('th', null, ''), per.map((p) => h('th', null, p.label)), h('th', null, '計'))),
          h('tbody', null, [0, 1].map((tm) => h('tr', null, h('th', null, h('i', { class: 'chip', style: { background: teamColor(tm) } }), BT.teamName(g, tm)), per.map((p) => h('td', null, String(p.pts[tm]))), h('td', { class: 'sum' }, String(BT.score(g)[tm]))))))),
        [0, 1].map((tm) => h('section', { class: 'teamstat' },
          h('h3', null, h('i', { class: 'chip', style: { background: teamColor(tm) } }), BT.teamName(g, tm), h('small', null, ` 得点 ${t[tm].pts}` + (withA ? `・シュート成功率 ${fg(t[tm])}${t[tm].fta ? '・FT ' + BT.pct(t[tm].ftm, t[tm].fta) : ''}` : ''))),
          table(st[tm]))),
        freeText ? h('section', { class: 'teamstat free' }, h('h3', null, h('i', { class: 'chip neutral' }), 'チームなし', h('small', null, '（画面の下のボタン）')), h('p', { class: 'freeline' }, freeText)) : null,
        h('p', { class: 'note' }, (withA ? '2P・3P・FT は「成功/打った数」。リバウンドの（ ）は、うちオフェンスリバウンド（同じチームが外したシュートの、10 秒以内のリバウンド）。' : '2P・3P・FT は、入れた本数です。') + '「番号なし」は「？」の行で記録したプレー、「チームなし」は画面の下のボタン（パスミス・★）で記録したものです（どちらも一覧から番号を付けられます）。')),
      foot: [h('button', { class: 'btn', onclick: () => openExport(g) }, '💾 書き出す'), h('button', { class: 'btn primary', onclick: () => BT.ui.closeSheet() }, 'とじる')]
    });
  }

  /* ---------- 書き出す ---------- */
  function openExport(game) {
    const g = game || S.game;
    const base = BT.fileBase(g);
    const share = BT.ui.canShareFiles();
    const go2 = async (kind) => {
      let name, blob;
      if (kind === 'json') { name = base + '.json'; blob = new Blob([JSON.stringify(BT.exportData(g), null, 1)], { type: 'application/json' }); }
      else if (kind === 'csv') { name = base + '_一覧.csv'; blob = new Blob(['﻿' + BT.eventsCSV(g)], { type: 'text/csv' }); }
      else { name = base + '_集計.csv'; blob = new Blob(['﻿' + BT.boxCSV(g)], { type: 'text/csv' }); }
      const r = await BT.ui.shareOrDownload(name, blob, share);
      if (r === 'downloaded') BT.ui.toast(`保存しました：${name}`, 'ok', 4000);
      else if (r === 'shared') BT.ui.toast('送りました', 'ok');
    };
    BT.ui.sheet({
      title: '書き出す',
      body: h('div', { class: 'export' },
        h('button', { class: 'xitem', id: 'btnExpJson', onclick: () => go2('json') }, h('b', null, '🎬 記録のファイル（JSON）'), h('small', null, '「バスケ得点クリップ」で試合の動画と一緒に開くと、記録した場面を切り出せます。この記録アプリで開き直すこともできます')),
        h('button', { class: 'xitem', id: 'btnExpCsv', onclick: () => go2('csv') }, h('b', null, '📋 記録の一覧（CSV）'), h('small', null, '時刻・チーム・背番号・プレー・その時点の得点。Excel・Numbers・Google スプレッドシートで開けます')),
        h('button', { class: 'xitem', id: 'btnExpBox', onclick: () => go2('box') }, h('b', null, '📊 選手ごとの集計（CSV）'), h('small', null, '得点・シュート（成功/打った数）・リバウンド・パスミスなど')),
        h('p', { class: 'note' }, share ? 'スマホでは「共有」が開きます（AirDrop・「ファイル」に保存・LINE など）。' : 'ダウンロードのフォルダに保存します。'),
        h('p', { class: 'note' }, '同じ端末・同じブラウザの「バスケ得点クリップ」なら、ファイルにしなくても「📲 タップ記録を読み込む」→「この端末で記録した試合」から直接読み込めます。'),
        h('a', { class: 'btn', href: CLIPS_URL, target: '_blank', rel: 'noopener' }, '🎬 バスケ得点クリップを開く'))
    });
  }

  /* ---------- 設定 ---------- */
  function openSettings() {
    const p = S.prefs;
    const body = h('div', { class: 'settings' });
    const chk = (key, label, after) => h('label', { class: 'chk' }, h('input', { type: 'checkbox', dataset: { pref: key }, checked: p[key] !== false, onchange: (e) => { p[key] = e.target.checked; savePrefs(); if (after) after(); } }), label);
    body.append(h('section', { class: 'field' }, h('span', null, '記録の画面'),
      chk('names', '背番号の下に、選手の名前も出す（行の高さに余裕があるとき）', refresh),
      chk('unknown', '「？」の行を出す（だれか分からないときに、チームだけで記録する）', refresh),
      h('p', { class: 'note' }, '背番号を入れていないチームは、「？」の行だけ（チームとして記録）になります。')));
    body.append(h('section', { class: 'field' }, h('span', null, '音'),
      chk('sound', '押したときに音を出す（「ピッ」）', () => { if (p.sound) BT.ui.beep(880, 60); })));
    body.append(h('section', { class: 'field' }, h('span', null, '画面の色'),
      h('div', { class: 'row' }, [['auto', '端末に合わせる'], ['light', '明るい'], ['dark', '暗い']].map(([v, lab]) => h('button', { class: 'btn small' + (p.theme === v ? ' on' : ''), onclick: () => { p.theme = v; savePrefs(); applyTheme(); openSettings(); } }, lab)))));
    body.append(h('p', { class: 'note' }, BT.ui.wakeSupported() ? (BT.ui.awake() ? '💡 記録の途中は、画面が自動で消えないようにしています。' : '💡 記録を始めると、画面が自動で消えないようにします。') : '💡 この端末では、画面が自動で消えるのを止められません。端末の「自動ロック」を長めにしてください。'));
    function refresh() { if (S.L) buildLive(); }
    BT.ui.sheet({ title: '設定', body });
  }

  /* ---------- 使い方 ---------- */
  function help() {
    BT.ui.sheet({
      title: '使い方', wide: true,
      body: h('div', { class: 'help' },
        h('ol', null,
          h('li', null, h('b', null, '試合の準備'), '：チーム名・ユニフォームの色・背番号を選ぶ（「4〜15」ボタンでまとめて。自分のチームは次から自動で入ります）'),
          h('li', null, h('b', null, 'ティップオフの瞬間に「▶ スタート」'), '：左上の時計が動き出します'),
          h('li', null, h('b', null, 'プレーが起きたら、その選手の行のボタンを1回タップ'), '：押した瞬間の時刻で記録されます')),
        h('h4', null, '記録の画面'),
        h('ul', null,
          h('li', null, h('b', null, '選手ごとの行'), '：背番号の小さい順に、上から並びます。行の「2P」「3P」「FT」（どれも成功）と「リバ」（リバウンド）を押すと、その選手の記録になります'),
          h('li', null, h('b', null, '「？」の行'), '：だれか分からないとき。チームの記録になります（あとで一覧から番号を付けられます）'),
          h('li', null, h('b', null, '画面の下の「パスミス」「★ あとで見る」'), '：だれのかは決めずに、時刻だけを残します。いつでも押せます'),
          h('li', null, 'ボタンの右上の小さな数は、その選手がそのプレーをした回数です'),
          h('li', null, '人数が多くて画面に入りきらないときは、行を上下にすべらせて探します（スマホは縦向き、または「ホーム画面に追加」すると広く使えます）')),
        h('h4', null, 'まちがえたとき'),
        h('ul', null,
          h('li', null, '画面の下の「↶ 取り消す」で、いちばん新しい記録を取り消し（「やり直す」で戻せます）'),
          h('li', null, '「≡ メニュー」→「記録の一覧」で、どの記録でも、チーム・番号・プレー・時刻を直したり消したりできます'),
          h('li', null, '名簿にない背番号は、チームの帯の「＋番号」で足せます')),
        h('h4', null, 'ピリオド'),
        h('p', null, '時計の右の「1Q」を押して、次のピリオドが始まる瞬間に「2Q を始める」。時計は止まらずに進みます（試合の時計ではなく、スタートからの時間です。動画と同じように進むので、あとで動画と合わせられます）。'),
        h('h4', null, '動画から場面を切り出す'),
        h('p', null, '「書き出す」→「記録のファイル」を、「バスケ得点クリップ」で試合の動画と一緒に開きます。動画の中の1つの場面（ティップオフなど）で時刻を合わせると、記録したプレーの場面を、選手ごと・プレーごとに切り出して、続けて見たり1本の動画にしたりできます。'),
        h('h4', null, 'うまく使うコツ'),
        h('ul', null,
          h('li', null, '画面が消えないように、記録中は自動で止めています（できない端末では、自動ロックを長めに）'),
          h('li', null, 'iPhone は「共有」→「ホーム画面に追加」すると、画面いっぱいに使えます'),
          h('li', null, '大事な試合は、終わったら「書き出す」でファイルに残してください')),
        h('p', { class: 'note' }, '🔒 記録はこの端末のブラウザの中だけに保存します。どこにも送りません。'))
    });
  }

  /* ---------- 起動 ---------- */
  function init() {
    applyTheme();
    if (root.matchMedia) { try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme); } catch (e) { /* 古いブラウザ */ } }
    // iPhone で :active（押している間の見た目）を効かせる
    document.addEventListener('touchstart', () => {}, { passive: true });
    // 長押しのメニュー・ダブルタップの拡大を出さない（記録の画面）
    document.addEventListener('contextmenu', (e) => { if (S.view === 'live' && e.target.closest && e.target.closest('.panels, .lbar, .gbar')) e.preventDefault(); });
    document.addEventListener('dblclick', (e) => { if (S.view === 'live') e.preventDefault(); }, { passive: false });
    root.addEventListener('popstate', onPop);
    root.addEventListener('beforeunload', (e) => { if (S.view === 'live' && S.game && S.game.startedAt && !S.game.endedAt) { e.preventDefault(); e.returnValue = ''; } });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && BT.ui.sheetOpen()) BT.ui.closeSheet(); });
    setInterval(tick, 200);
    let rq = 0;
    const relayout = () => { cancelAnimationFrame(rq); rq = requestAnimationFrame(layoutLive); };
    root.addEventListener('resize', relayout);
    root.addEventListener('orientationchange', () => setTimeout(relayout, 250));
    document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
    // オフラインでも開けるように（https で公開しているときだけ。手元のテストでは使わない）
    if (root.location && location.protocol === 'https:' && navigator.serviceWorker) navigator.serviceWorker.register('sw.js').catch(() => {});
    // 記録中の試合があれば、そのまま続きから
    const cur = BT.store.current();
    const g = cur ? BT.store.loadGame(cur) : null;
    if (g && g.startedAt && !g.endedAt) openGame(g);
    else go('home');
  }

  BT.app = { S, init, start, undo, redo, openMenu, openLog, openEdit, openStats, openExport, openSettings, openPeriod, openKeypad, endGame, reopen, newGame, go, resume };
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  }
})(typeof window !== 'undefined' ? window : globalThis);
