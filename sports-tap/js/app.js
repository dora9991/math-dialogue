/* スポーツ タップ記録 — アプリの骨組み（どの種目でも同じ部分）
   種目を選ぶ（picker）→ 種目のホーム（home：記録中の試合・これまでの試合）→ 試合の準備（setup）→ 記録（live）。
   記録の画面の中身は、種目の画面（ST.VIEWS[種目の family]）が作る。骨組みは、時刻・保存・取り消し・一覧で直す・集計・書き出し・設定を受け持つ。
   記録の画面は、いちど作ったら作り直さず、表示だけを書き換える（押している間にボタンが入れ替わると、Safari ではタップにならないため）。 */
(function (root) {
  'use strict';
  const ST = root.ST;
  const { h, $ } = ST.ui;
  const BASKET_URL = '../basket-tap/';

  const S = {
    view: 'picker',
    sport: null,            // いま選んでいる種目の id
    game: null,
    prefs: ST.store.prefs(),
    draft: null,            // 新しい試合の準備中 { sport, title, teams, opts }
    setupFor: 'new',        // 'new' | 'edit'（記録中の試合のチーム・形式を直す）
    more: [false, false],
    L: null,                // 記録の画面（種目の画面が返したもの）
    redo: [],
    lastTap: { key: '', at: 0 },
    guarded: false
  };
  const now = () => Date.now();
  const sport = () => ST.SPORTS[(S.game && S.game.sport) || S.sport] || null;
  const viewOf = (sp) => (sp && ST.VIEWS[sp.family]) || {};
  const sprefs = (id) => ST.store.sportPrefs(S.prefs, id || (sport() || {}).id);
  const elapsed = () => ST.elapsed(S.game, now());

  /* ---------- 小さな道具 ---------- */
  function save() {
    if (!S.game) return;
    if (!ST.store.saveGame(S.game) && !S.saveWarned) {
      S.saveWarned = true;
      ST.ui.toast('このブラウザに保存できません（プライベートブラウズ・空きが足りない など）。記録は続けられますが、終わったら必ず「書き出す」でファイルに残してください', 'err', 9000);
    }
  }
  function applyTheme() {
    const t = S.prefs.theme;
    if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme;
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', getComputedStyle(document.body).getPropertyValue('--bg').trim() || '#0b0f17');
  }
  function savePrefs() { ST.store.savePrefs(S.prefs); }
  function feel(kind) {
    ST.ui.haptic();
    if (S.prefs.sound) ST.ui.beep(kind === 'made' ? 1046 : kind === 'undo' ? 440 : 784, 55);
  }
  function flash(el) {
    if (!el) return;
    el.classList.remove('hit');
    void el.offsetWidth;
    el.classList.add('hit');
  }
  const teamColor = (tm) => (S.game && S.game.teams[tm] ? S.game.teams[tm].color : '#888');
  /* 種目を選んだことを、URL（?s=soccer）にも残す（ブックマーク・ホーム画面に追加したときに、その種目から開けるように） */
  function setSport(id) {
    S.sport = id || null;
    if (id) { S.prefs.last = id; savePrefs(); }
    try {
      const u = new URL(root.location.href);
      if (id) u.searchParams.set('s', id); else u.searchParams.delete('s');
      if (u.href !== root.location.href) history.replaceState(history.state, '', u.href);
    } catch (e) { /* file:// など */ }
    const sp = ST.SPORTS[id];
    document.title = sp ? `${sp.name} タップ記録` : ST.APP;
  }

  /* ---------- 画面の切り替え ---------- */
  function go(view) {
    S.view = view;
    ST.ui.closeSheet(true);
    if (S.L && S.L.destroy) S.L.destroy();
    S.L = null;
    if (view === 'picker') renderPicker();
    else if (view === 'home') renderHome();
    else if (view === 'setup') renderSetup();
    else if (view === 'live') buildLive();
    root.scrollTo(0, 0);
  }
  function openGame(game) {
    S.game = game;
    S.redo = [];
    setSport(game.sport);
    ST.store.setCurrent(game.id);
    go('live');
    if (game.startedAt && !game.endedAt) { ST.ui.keepAwake(true); guard(); }
  }

  /* ========== 種目を選ぶ ========== */
  function renderPicker() {
    document.body.dataset.view = 'picker';
    ST.ui.keepAwake(false);
    const V = $('#view');
    V.innerHTML = '';
    const going = goingGame();
    V.append(
      h('header', { class: 'hbar' },
        h('div', { class: 'brand' }, h('span', { class: 'logo', 'aria-hidden': 'true' }, '⏱'), h('div', null, h('b', null, ST.APP), h('small', null, '試合を見ながらタップで記録。種目ごとに、ルールに合ったボタンと集計'))),
        h('button', { class: 'btn icon', id: 'btnHelp', 'aria-label': '使い方', onclick: helpPicker }, '？')),
      h('main', { class: 'home' },
        going ? goingCard(going) : null,
        h('section', { class: 'card' }, h('h2', null, '種目を選ぶ'),
          h('div', { class: 'sports', id: 'sportGrid' },
            ST.SPORT_ORDER.map((id) => {
              const sp = ST.SPORTS[id];
              const n = ST.store.games(id).length;
              return h('button', { class: 'sportbtn', dataset: { sport: id }, onclick: () => { setSport(id); go('home'); } },
                h('span', { class: 'si', 'aria-hidden': 'true' }, sp.icon), h('span', { class: 'st' }, h('b', null, sp.name), h('small', null, sp.desc)), n ? h('i', { class: 'sn' }, `${n}試合`) : null);
            }),
            h('a', { class: 'sportbtn basket', href: BASKET_URL }, h('span', { class: 'si', 'aria-hidden': 'true' }, '🏀'), h('span', { class: 'st' }, h('b', null, 'バスケットボール'), h('small', null, '専用のアプリ「バスケ タップ記録」（撮影しながら記録・動画の切り出しも）')), h('i', { class: 'sn' }, '別のアプリ')))),
        h('section', { class: 'card steps3' },
          h('h2', null, 'どの種目でも同じ使い方'),
          h('ol', null,
            h('li', null, h('b', null, 'チームと背番号（選手・レーン）を選ぶ'), h('span', null, '自分のチームは、次の試合から自動で入ります')),
            h('li', null, h('b', null, '試合が始まる瞬間に ▶ スタート'), h('span', null, '時計が動き出し、押した瞬間の時刻で記録が残ります')),
            h('li', null, h('b', null, 'プレーが起きたら、ボタンを1回タップ'), h('span', null, 'まちがえたら「↶ 取り消す」。あとで一覧から直せます')),
            h('li', null, h('b', null, '集計を見る・書き出す'), h('span', null, '選手ごとの集計、Excel で開ける CSV。記録の時刻は、試合の動画と合わせて見返すときの目印に')))),
        h('section', { class: 'card tools' }, h('h2', null, '記録のファイルを開く'),
          h('p', null, '「書き出す」で保存した記録のファイル（JSON）を、この端末で開き直せます（どの種目でも）。'),
          h('div', { class: 'row' }, h('button', { class: 'btn', onclick: importFile }, '📂 記録のファイルを開く'))),
        h('p', { class: 'note' }, '🔒 記録はこの端末のブラウザの中だけに保存します（どこにも送りません）。大事な試合は「書き出す」でファイルにも残してください（iPhone などは、長く開かないサイトの保存を消すことがあります）。')));
  }
  function goingGame() {
    const curId = ST.store.current();
    const g = curId ? ST.store.games().find((x) => x.id === curId) : null;
    return g && g.startedAt && !g.endedAt && ST.SPORTS[g.sport] ? g : null;
  }
  function goingCard(g) {
    return h('section', { class: 'card going' },
      h('div', { class: 'going-h' }, h('span', { class: 'recdot' }), h('b', null, `記録中の試合があります（${ST.SPORTS[g.sport].icon} ${ST.SPORTS[g.sport].name}）`)),
      gameLine(g),
      h('button', { class: 'btn primary huge', id: 'btnResume', onclick: () => resume(g.id) }, '続きを記録する'));
  }

  /* ========== 種目のホーム（試合の一覧） ========== */
  function renderHome() {
    const sp = sport();
    if (!sp) { go('picker'); return; }
    document.body.dataset.view = 'home';
    ST.ui.keepAwake(false);
    const V = $('#view');
    V.innerHTML = '';
    const list = ST.store.games(sp.id);
    const going = goingGame();
    V.append(
      h('header', { class: 'hbar' },
        h('button', { class: 'btn small', id: 'btnSports', onclick: () => { setSport(null); go('picker'); } }, '← 種目'),
        h('div', { class: 'brand' }, h('span', { class: 'logo', 'aria-hidden': 'true' }, sp.icon), h('div', null, h('b', null, `${sp.name} タップ記録`), h('small', null, sp.desc))),
        h('button', { class: 'btn icon', id: 'btnHelp', 'aria-label': '使い方', onclick: () => help(sp) }, '？')),
      h('main', { class: 'home' },
        going ? goingCard(going) : null,
        h('button', { class: 'btn ' + (going ? '' : 'primary ') + 'huge', id: 'btnNew', onclick: newGame }, `＋ 新しい${sp.unit || '試合'}を記録する`),
        list.length ? h('section', { class: 'card' }, h('h2', null, `これまでの${sp.unit || '試合'}`), h('div', { class: 'games' }, list.map(gameRow))) : h('section', { class: 'card steps3' },
          h('h2', null, 'つかいかた'),
          h('ol', null, (sp.steps || []).map(([b, s]) => h('li', null, h('b', null, b), h('span', null, s))))),
        h('section', { class: 'card tools' }, h('h2', null, '記録のファイルを開く'),
          h('div', { class: 'row' }, h('button', { class: 'btn', onclick: importFile }, '📂 記録のファイルを開く'))),
        h('p', { class: 'note' }, '🔒 記録はこの端末のブラウザの中だけに保存します（どこにも送りません）。')));
  }
  function gameLine(g) {
    const when = g.startedAt ? `${g.date} ${new Date(g.startedAt).toTimeString().slice(0, 5)}` : `${g.date}（まだスタートしていません）`;
    const sp = ST.SPORTS[g.sport] || {};
    return h('div', { class: 'gline' },
      h('span', { class: 'when' }, when),
      sp.lineText ? h('span', { class: 'vs' }, sp.lineText(g)) :
        h('span', { class: 'vs' }, h('i', { class: 'chip', style: { background: g.colors[0] } }), g.names[0], h('b', null, ` ${g.scoreText || ''} `), g.names[1], h('i', { class: 'chip', style: { background: g.colors[1] } })),
      g.title ? h('span', { class: 'gtitle' }, g.title) : null);
  }
  function gameRow(g) {
    return h('div', { class: 'grow', dataset: { id: g.id } },
      h('button', { class: 'gopen', onclick: () => resume(g.id) }, gameLine(g), h('small', { class: 'note' }, `${g.n}件の記録${g.endedAt ? '' : g.startedAt ? '・記録中' : ''}`)),
      h('button', { class: 'btn small', title: '書き出す', onclick: () => { const game = ST.store.loadGame(g.id); if (game) openExport(game); } }, '書き出す'),
      h('button', { class: 'btn small danger', title: '消す', onclick: () => ST.ui.confirm('この記録を消しますか？', `${g.date} ${g.names[0]} ${g.scoreText || ''} ${g.names[1]}（${g.n}件の記録）。消すと元に戻せません。書き出したファイルは残ります。`, '消す', () => { ST.store.deleteGame(g.id); renderHome(); ST.ui.toast('消しました', 'ok'); }, true) }, '消す'));
  }
  function resume(id) {
    const g = ST.store.loadGame(id);
    if (!g) { ST.ui.toast('この記録が見つかりませんでした', 'err'); go(S.sport ? 'home' : 'picker'); return; }
    openGame(g);
  }
  async function importFile() {
    const f = await ST.ui.pickText();
    if (!f) return;
    try {
      const g = ST.importData(f.text);
      if (ST.store.loadGame(g.id)) g.id = ST.uid('g');
      ST.store.saveGame(g);
      openGame(g);
      ST.ui.toast('記録のファイルを開きました', 'ok');
    } catch (e) { ST.ui.toast('開けませんでした：' + e.message, 'err', 6000); }
  }

  /* ========== 試合の準備 ========== */
  function newGame() {
    const sp = sport();
    const pr = sprefs(sp.id);
    const mine = ST.store.myTeam(sp.id);
    const keep = !!sp.orderedRoster;
    S.draft = { sport: sp.id, title: '', opts: ST.cleanOpts(sp, pr.opts), teams: [mine ? { name: mine.name, color: mine.color, colorName: mine.colorName, players: ST.cleanPlayers(mine.players, keep) } : ST.blankTeam(0), ST.blankTeam(1)] };
    if (S.draft.teams[0].color === S.draft.teams[1].color) Object.assign(S.draft.teams[1], S.draft.teams[0].color === '#2f6fed' ? { color: '#d93636', colorName: '赤' } : {});
    if (sp.initDraft) sp.initDraft(S.draft, pr);
    S.setupFor = 'new';
    S.more = [false, false];
    go('setup');
  }
  const setupTarget = () => (S.setupFor === 'edit' ? S.game : S.draft);
  function setupChanged() { if (S.setupFor === 'edit') save(); }

  function renderSetup() {
    document.body.dataset.view = 'setup';
    const sp = sport();
    const V = $('#view');
    V.innerHTML = '';
    const edit = S.setupFor === 'edit';
    const T = setupTarget();
    const view = viewOf(sp);
    const custom = view.setup ? view.setup(ctx, T, { edit, changed: setupChanged }) : null;
    V.append(
      h('header', { class: 'hbar' },
        h('button', { class: 'btn', onclick: () => (edit ? go('live') : go('home')) }, edit ? '← 記録へ戻る' : '← 戻る'),
        h('b', { class: 'htitle' }, edit ? `${sp.icon} ${sp.setupEditTitle || 'チーム・形式を直す'}` : `${sp.icon} ${sp.name}：${sp.setupTitle || '試合の準備'}`),
        h('span', { class: 'spacer' })),
      h('main', { class: 'setup' },
        custom || [
          h('p', { class: 'lead' }, `${sp.rosterLabel || '背番号'}は、下の番号をタップして選びます（「${(sp.presets && sp.presets[0] && sp.presets[0][0]) || '1〜11'}」などのボタンで、まとめて選べます）。名前はなくても大丈夫です。`),
          h('div', { class: 'teams2' }, [0, 1].map((i) => teamCard(i)))],
        optsCard(sp, T, edit),
        edit ? null : h('section', { class: 'card' },
          h('label', { class: 'field' }, h('span', null, 'メモ（なくてもOK）'),
            h('input', { type: 'text', id: 'gameTitle', maxlength: 40, placeholder: sp.titleHint || '例：練習試合・新人戦 1回戦', value: S.draft.title, oninput: (e) => { S.draft.title = e.target.value; } }))),
        h('div', { class: 'gobar' },
          edit ? h('button', { class: 'btn primary huge', onclick: () => { saveTeams(); go('live'); } }, '記録へ戻る')
            : h('button', { class: 'btn primary huge', id: 'btnToLive', onclick: toLive }, '記録の画面へ →'))));
  }
  /* 試合の形式（前半の長さ・セット数 など）。ボタンで選ぶ */
  function optsCard(sp, T, edit) {
    const fields = (sp.optFields || []).filter((f) => !f.hidden || !f.hidden(T.opts));
    if (!fields.length) return null;
    const card = h('section', { class: 'card', id: 'optsCard' }, h('h2', null, sp.optsTitle || '試合の形式'));
    fields.forEach((f) => {
      const row = h('div', { class: 'row optrow', dataset: { opt: f.key } });
      f.choices.forEach(([v, lab]) => row.append(h('button', { class: 'btn small' + (String(T.opts[f.key]) === String(v) ? ' on' : ''), dataset: { v: String(v) }, 'aria-pressed': String(String(T.opts[f.key]) === String(v)),
        onclick: () => { T.opts[f.key] = v; if (!edit) { const pr = sprefs(sp.id); pr.opts = Object.assign({}, T.opts); savePrefs(); } setupChanged(); const fresh = optsCard(sp, T, edit); card.replaceWith(fresh); if (sp.onOpts) sp.onOpts(T, f.key); } }, lab)));
      card.append(h('div', { class: 'field' }, h('span', null, f.label), row, f.note ? h('p', { class: 'note' }, f.note) : null));
    });
    if (edit && sp.optsEditNote) card.append(h('p', { class: 'note' }, sp.optsEditNote));
    return card;
  }
  function saveTeams() {
    const sp = sport();
    const T = setupTarget().teams;
    if (sp.noSavedTeams) return;
    if (T[0].name) ST.store.saveTeam(sp.id, T[0], true);
    if (T[1].name) ST.store.saveTeam(sp.id, T[1], false);
  }
  function toLive() {
    const sp = sport();
    const D = S.draft;
    if (sp.checkDraft) { const msg = sp.checkDraft(D); if (msg) { ST.ui.toast(msg, 'warn', 5000); return; } }
    saveTeams();
    const pr = sprefs(sp.id);
    pr.opts = Object.assign({}, D.opts);
    savePrefs();
    const g = ST.newGame({ sport: sp.id, teams: D.teams, title: (D.title || '').trim(), opts: D.opts });
    if (sp.fromDraft) sp.fromDraft(g, D);
    S.draft = null;
    ST.store.saveGame(g);
    openGame(g);
  }

  /* チームのカード（名前・色・背番号・名前）。文字の欄を変えたときは、カードを作り直さずに、その場で書き換える */
  function teamCard(i) {
    const sp = sport();
    const T = setupTarget().teams;
    const t = T[i];
    const card = h('section', { class: 'card teamcard', id: 'team' + i, style: { '--tc': t.color, '--tink': ST.inkOn(t.color) } });
    const redraw = () => { [0, 1].forEach((k) => { const old = document.getElementById('team' + k); if (old) old.replaceWith(teamCard(k)); }); };
    const label = () => (t.name || '').trim() || (i ? '相手のチーム' : '自分のチーム');
    const headName = h('b', null, label());
    card.append(h('div', { class: 'tc-head' }, h('span', { class: 'tc-band' }, i ? '相手' : '自分'), headName));
    const saved = sp.noSavedTeams ? [] : ST.store.teams(sp.id).filter((x) => x.name !== t.name || JSON.stringify(x.players.map((p) => p.no)) !== JSON.stringify(t.players.map((p) => p.no)));
    if (saved.length) {
      card.append(h('div', { class: 'savedrow' }, h('span', { class: 'note' }, '前のチームから：'),
        saved.slice(0, 8).map((x) => h('button', { class: 'btn small chipbtn', onclick: () => { Object.assign(t, { name: x.name, color: x.color, colorName: x.colorName, players: ST.cleanPlayers(x.players, !!sp.orderedRoster) }); setupChanged(); redraw(); } },
          h('i', { class: 'chip', style: { background: x.color } }), x.name, h('small', null, ` ${x.players.length}人`)))));
    }
    card.append(h('label', { class: 'field' }, h('span', null, 'チーム名'),
      h('input', { type: 'text', class: 'tname', maxlength: 20, placeholder: i ? '例：○○中（なくてもOK）' : '例：致遠館（なくてもOK）', value: t.name || '',
        onchange: (e) => { t.name = e.target.value.trim(); setupChanged(); headName.textContent = label(); } })));
    const sw = h('div', { class: 'swatches', role: 'radiogroup', 'aria-label': 'ユニフォームの色' });
    ST.COLORS.forEach((c) => {
      const on = t.color.toLowerCase() === c.hex.toLowerCase();
      sw.append(h('button', { class: 'sw' + (on ? ' on' : ''), style: { background: c.hex }, title: c.name, 'aria-label': c.name, role: 'radio', 'aria-checked': on ? 'true' : 'false', dataset: { color: c.name },
        onclick: () => { t.color = c.hex; t.colorName = c.name; setupChanged(); redraw(); } }));
    });
    sw.append(h('input', { type: 'color', class: 'swc', title: 'ほかの色', value: t.color, onchange: (e) => { t.color = e.target.value; t.colorName = ST.nearestColorName(e.target.value); setupChanged(); redraw(); } }));
    card.append(h('div', { class: 'field' }, h('span', null, `ユニフォームの色：${t.colorName}`), sw));
    if (T[0].color.toLowerCase() === T[1].color.toLowerCase()) card.append(h('p', { class: 'note warn' }, '⚠ 自分と相手が同じ色です。見分けやすいように、どちらかを変えてください。'));
    const count = h('span', null, '');
    const noText = h('input', { type: 'text', class: 'nostext', inputmode: 'numeric', placeholder: '直接入れる（例：1-11, 23）', onchange: (e) => setNos(ST.parseNumbers(e.target.value)) });
    const presets = sp.presets || [['1〜11', '1-11']];
    card.append(h('div', { class: 'field' }, count,
      h('div', { class: 'row presets' },
        presets.map(([lab, txt]) => h('button', { class: 'btn small', dataset: { preset: txt }, onclick: () => setNos(ST.parseNumbers(txt)) }, lab)),
        h('button', { class: 'btn small', onclick: () => setNos([]) }, '全部はずす')),
      noText));
    const grid = h('div', { class: 'nogrid', role: 'group', 'aria-label': '背番号を選ぶ' });
    const moreBtn = h('button', { class: 'linkbtn', onclick: () => { S.more[i] = !S.more[i]; fillGrid(); } }, '');
    const names = h('div', { class: 'namesbox' });
    card.append(grid, moreBtn, names);
    if (i === 1 && sp.oppHint) card.append(h('p', { class: 'note' }, sp.oppHint));
    function fillGrid() {
      const on = new Set(t.players.map((p) => p.no));
      const shown = ['0', '00'].concat(Array.from({ length: S.more[i] ? 99 : 30 }, (_, k) => String(k + 1)));
      t.players.forEach((p) => { if (!shown.includes(p.no)) shown.push(p.no); });
      grid.innerHTML = '';
      ST.sortNos(shown).forEach((no) => grid.append(h('button', { class: 'nb' + (on.has(no) ? ' on' : ''), dataset: { no }, 'aria-pressed': on.has(no) ? 'true' : 'false',
        onclick: () => { const cur = new Set(t.players.map((p) => p.no)); if (cur.has(no)) cur.delete(no); else cur.add(no); setNos(Array.from(cur)); } }, no)));
      moreBtn.textContent = S.more[i] ? '31〜99 をかくす' : '31〜99 も出す';
    }
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
    function setNos(list) {
      const before = t.players.map((p) => p.no).join(',');
      t.players = ST.playersFromNos(list, t.players);
      setupChanged();
      const on = new Set(t.players.map((p) => p.no));
      if (t.players.some((p) => !grid.querySelector(`.nb[data-no="${p.no}"]`))) fillGrid();
      else grid.querySelectorAll('.nb').forEach((b) => { const v = on.has(b.dataset.no); b.classList.toggle('on', v); b.setAttribute('aria-pressed', v ? 'true' : 'false'); });
      count.textContent = `${sp.rosterLabel || '背番号'}：${t.players.length ? t.players.length + '人' : 'まだ選んでいません'}`;
      if (document.activeElement !== noText) noText.value = ST.formatNumbers(t.players.map((p) => p.no));
      if (before !== t.players.map((p) => p.no).join(',')) fillNames();
    }
    fillGrid();
    fillNames();
    count.textContent = `${sp.rosterLabel || '背番号'}：${t.players.length ? t.players.length + '人' : 'まだ選んでいません'}`;
    noText.value = ST.formatNumbers(t.players.map((p) => p.no));
    return card;
  }

  /* ========== 記録の画面 ==========
     中身は種目の画面（view.build）。骨組みは、上の帯の部品・下の帯（いま記録したもの・取り消す）・スタート前と試合のあとの札を貸す */
  function buildLive() {
    const sp = sport();
    const view = viewOf(sp);
    document.body.dataset.view = 'live';
    document.body.dataset.family = sp.family;
    const V = $('#view');
    V.innerHTML = '';
    S.parts = { last: null, cover: null };
    S.L = view.build(ctx);
    V.append(S.L.root);
    updateLive();
    if (S.L.layout) S.L.layout();
  }
  function rebuild() { if (S.view === 'live' && S.game) { if (S.L && S.L.destroy) S.L.destroy(); buildLive(); } }
  function canRecord(quiet) {
    if (!S.game.startedAt) { if (!quiet) say(`先に「▶ スタート」を押してください`, 'warn'); return false; }
    if (S.game.endedAt) { if (!quiet) say(`${sport().unit || '試合'}は終わっています`, 'warn'); return false; }
    return true;
  }
  /* 1回で記録する。ev：{ type, team, no, …}（t を入れなければ、押した瞬間）。opts.key：二度押しを見分ける文字（同じボタンを 0.45 秒以内は1回に） */
  function record(ev, btn, opts) {
    opts = opts || {};
    if (!opts.force && !canRecord()) return null;
    const t0 = now();
    const key = opts.key != null ? opts.key : [ev.type, ev.team, ev.no].join(':');
    if (!opts.nodedupe && S.lastTap.key === key && t0 - S.lastTap.at < (opts.dedupeMs || 450)) return null;
    S.lastTap = { key, at: t0 };
    // 前の注意（「先にスタートを」など）は、記録できたら消す（いま記録したものが見えるように）
    if (S.msg) { S.msg = null; clearTimeout(S.msgTimer); }
    const e = ST.addEvent(S.game, Object.assign({ t: elapsed() }, ev));
    S.redo = [];
    save();
    flash(btn);
    const d = ST.typeOf(S.game, ev.type) || {};
    feel(d.kind);
    updateLive(d.pts ? e.team : null);
    return e;
  }
  function updateLive(bump) {
    if (!S.L) return;
    if (S.L.update) S.L.update(bump);
    updateCover();
    renderLast();
  }
  function tick() {
    if (S.view !== 'live' || !S.game || !S.L) return;
    if (S.L.tick) S.L.tick();
  }

  /* 上の帯の部品（種目の画面が並べる） */
  function clockBtn(id) {
    const tv = h('span', { class: 'tval', id: id || 'tval' }, '0:00');
    const el = h('button', { class: 'clock', id: 'clock', title: 'スタートからの時間', onclick: openMenu }, h('span', { class: 'recdot' }), tv);
    return { el, set(text) { if (tv.textContent !== text) { tv.textContent = text; tv.classList.toggle('long', text.length > 5); tv.classList.toggle('xlong', text.length > 7); } el.hidden = !S.game.startedAt; el.classList.toggle('ended', !!S.game.endedAt); } };
  }
  function startBtn() {
    const el = h('button', { class: 'startbtn', id: 'btnStart', onclick: start }, '▶ スタート');
    return { el, update() { el.hidden = !!S.game.startedAt; } };
  }
  function menuBtn() { return h('button', { class: 'menubtn', id: 'btnMenu', 'aria-label': 'メニュー', onclick: openMenu }, h('span', null, '≡'), h('small', null, 'メニュー')); }
  /* 下の帯：いま記録したもの・取り消す（左に、種目の「いつでも押せる」ボタンを並べられる） */
  function footer(left) {
    const last = h('div', { class: 'lastbar', id: 'lastbar' });
    const el = h('footer', { class: 'gbar' }, left || [], last);
    S.parts.last = last;
    S.parts.gbar = el;
    return el;
  }
  /* スタートの前・試合のあとに、記録のボタンの上に出す札 */
  function cover() {
    const el = h('div', { class: 'cover', id: 'cover', hidden: true });
    S.parts.cover = el;
    return el;
  }
  function updateCover() {
    const el = S.parts && S.parts.cover;
    if (S.parts && S.parts.gbar) S.parts.gbar.classList.toggle('off', !S.game.startedAt || !!S.game.endedAt);
    if (!el) return;
    const g = S.game, sp = sport(), view = viewOf(sp);
    const started = !!g.startedAt, ended = !!g.endedAt;
    el.innerHTML = '';
    if (!started) {
      el.append(h('div', { class: 'cover-card' },
        h('button', { class: 'startbig', id: 'btnStartBig', onclick: start }, '▶ スタート'),
        h('p', null, h('b', null, sp.startHint || '試合が始まる瞬間'), 'に押してください。'),
        h('p', { class: 'note' }, '時計が動き出し、そこからの時間で記録します。あとで動画と合わせるときの目印にもなります。'),
        view.coverExtra ? view.coverExtra(ctx) : null));
    } else if (ended) {
      el.append(h('div', { class: 'cover-card' },
        h('b', { class: 'endtitle' }, sp.endTitle || '試合終了'),
        view.endSummary ? view.endSummary(ctx) : h('div', { class: 'endscore' }, h('span', null, ST.teamName(g, 0)), h('b', null, ST.scoreText(g)), h('span', null, ST.teamName(g, 1))),
        h('div', { class: 'row center' },
          h('button', { class: 'btn primary', onclick: openStats }, '📊 集計を見る'),
          h('button', { class: 'btn primary', onclick: () => openExport(g) }, '💾 書き出す')),
        h('button', { class: 'btn small', onclick: reopen }, '続きを記録する（まちがえて終えたとき）')));
    }
    el.hidden = started && !ended;
  }

  /* 記録の画面のお知らせ：画面の下（いま記録したものの所）に出す */
  function say(text, kind, ms, action) {
    if (S.view !== 'live' || !S.L || !S.parts || !S.parts.last || ST.ui.sheetOpen()) return ST.ui.toast(text, kind, ms, action);
    clearTimeout(S.msgTimer);
    S.msg = { text, kind: kind || '', action };
    S.msgTimer = setTimeout(() => { S.msg = null; if (S.L) renderLast(); }, ms || 2800);
    renderLast();
    return null;
  }
  const undoBtn = () => h('button', { class: 'btn undo', id: 'btnUndo', 'aria-label': 'いちばん新しい記録を取り消す', onclick: undo }, h('b', null, '↶'), h('small', null, '取り消す'));
  function renderLast() {
    const el = S.parts && S.parts.last;
    if (!el) return;
    const g = S.game, sp = sport();
    el.innerHTML = '';
    const canUndo = g.events.length > (sp.keepFirst ? 1 : 0);
    if (S.msg) {
      const m = S.msg;
      // 「取り消す」は、いつも同じ場所（右のはし）に置く（続けて2回押すと、2つ取り消せるように。「やり直す」などは、その左）
      el.append(...[h('div', { class: 'lastev msg ' + m.kind, role: 'status', 'aria-live': 'polite' }, h('span', { class: 'mt' }, m.text)),
        m.action ? h('button', { class: 'btn undo act', id: 'btnMsgAct', onclick: () => { S.msg = null; clearTimeout(S.msgTimer); m.action.onClick(); if (S.L) renderLast(); } }, m.action.label) : null,
        canUndo ? undoBtn() : null].filter(Boolean));
      return;
    }
    if (!g.startedAt) { el.append(h('div', { class: 'lastev hint' }, h('span', { class: 'mt' }, 'スタートを押すと、記録できます'))); return; }
    const ev = g.events[g.events.length - 1];
    if (!ev) return;
    const d = ST.typeOf(g, ev.type) || {};
    const nm = ev.no != null && ev.team != null ? ST.playerName(g, ev.team, ev.no) : '';
    const who = d.meta ? '' : sp.whoText ? sp.whoText(g, ev) : ev.team == null ? 'チームなし' : `${ST.teamName(g, ev.team)} ${ev.no != null ? '#' + ev.no + (nm ? ' ' + nm : '') : sp.noNoText || '番号なし'}`;
    const label = sp.lastText ? sp.lastText(g, ev) : d.meta ? ST.eventText(g, ev) : (d.short || ST.typeLabel(g, ev)) + (d.pts ? ` +${d.pts}` : '');
    el.append(...[
      h('div', { class: 'lastev', role: 'status', 'aria-live': 'polite', style: { '--tc': d.meta || ev.team == null ? 'var(--line2)' : teamColor(ev.team) } },
        h('div', { class: 'l1' }, h('b', { class: 'lt' }, timeText(ev)), h('span', { class: 'll' }, label)),
        who ? h('div', { class: 'lw' }, who) : null),
      canUndo ? undoBtn() : null].filter(Boolean));
  }
  /* 記録の時刻の見せ方（種目が決める：「前半 23:41」など。なければスタートからの時間） */
  function timeText(e) {
    const sp = sport();
    return sp.timeText ? sp.timeText(S.game, e) : ST.fmtTime(e.t, S.game.prec >= 100 ? 2 : 0);
  }
  function undo() {
    const g = S.game, sp = sport();
    const ev = g.events[g.events.length - 1];
    if (!ev) return;
    if (sp.keepFirst && g.events.length === 1) { say('スタートは「≡ メニュー」から取り消せます', 'warn', 4000); return; }
    g.events.pop();
    S.redo.push(ev);
    save();
    feel('undo');
    updateLive();
    say(`取り消し：${ST.eventText(g, ev, true)}`, 'warn', 4500, { label: '↷ やり直す', onClick: redo });
  }
  function redo() {
    const ev = S.redo.pop();
    if (!ev || !S.game) return;
    S.game.events.push(ev);
    S.game.seq = Math.max(S.game.seq || 0, Number(String(ev.id).slice(1)) || 0);
    save();
    updateLive();
    say('やり直しました', 'ok', 3500, S.redo.length ? { label: '↷ やり直す', onClick: redo } : null);
  }

  /* ---------- スタート・終了 ---------- */
  function start() {
    const g = S.game, sp = sport();
    if (!g || g.startedAt) return;
    if (sp.canStart) { const msg = sp.canStart(g); if (msg) { say(msg, 'warn', 5000); return; } }
    const t0 = now();
    g.startedAt = t0;
    g.date = ST.ymdAt(t0, g.tz);
    if (sp.onStart) sp.onStart(g);
    save();
    feel('made');
    ST.store.persist();
    ST.ui.keepAwake(true).then((ok) => { if (!ok && !S.warnedWake) { S.warnedWake = true; say('自動ロックを止められません（設定で長めに）', 'warn', 6000); } });
    guard();
    if (S.L && S.L.onStart) S.L.onStart();
    updateLive();
  }
  function cancelStart() {
    const g = S.game;
    g.startedAt = null; g.endedAt = null; g.events = []; g.seq = 0;
    S.redo = [];
    ST.ui.keepAwake(false);
    save();
    rebuild();
    say('スタートを取り消しました', 'ok');
  }
  function endGame() {
    const g = S.game;
    g.endedAt = now();
    save();
    ST.ui.keepAwake(false);
    updateLive();
    openStats();
  }
  function reopen() {
    S.game.endedAt = null;
    save();
    ST.ui.keepAwake(true);
    guard();
    updateLive();
    say('続きを記録できます（時計は進んだまま）', 'ok', 4000);
  }

  /* 記録の途中で「戻る」（スワイプ・戻るボタン）で、うっかりページを離れないように */
  function guard() {
    if (S.guarded || !root.history || !history.pushState) return;
    history.pushState({ stap: 1 }, '');
    S.guarded = true;
  }
  function onPop() {
    S.guarded = false;
    if (ST.ui.sheetOpen()) { ST.ui.closeSheet(); guard(); return; }
    if (S.view === 'live' && S.game && S.game.startedAt && !S.game.endedAt) { guard(); say('記録中です（終えるときは ≡ メニューから）', 'warn', 4000); return; }
    if (S.view === 'setup' && S.setupFor === 'edit' && S.game) { go('live'); if (S.game.startedAt && !S.game.endedAt) guard(); return; }
    if (S.view === 'live' || S.view === 'setup') go('home');
    else if (S.view === 'home') { setSport(null); go('picker'); }
  }

  /* ---------- メニュー ---------- */
  function openMenu() {
    const g = S.game, sp = sport(), view = viewOf(sp);
    const plays = g.events.filter((e) => !(ST.typeOf(g, e.type) || {}).meta).length;
    const item = (icon, label, sub, fn, cls) => h('button', { class: 'mitem' + (cls ? ' ' + cls : ''), onclick: () => { s.close(); fn(); } }, h('span', { class: 'mi' }, icon), h('span', { class: 'mt' }, h('b', null, label), sub ? h('small', null, sub) : null));
    const extra = view.menuItems ? view.menuItems(ctx) : [];
    const s = ST.ui.sheet({
      title: g.startedAt ? `メニュー（${ST.fmtTime(elapsed())}・${plays}件の記録）` : 'メニュー',
      body: h('div', { class: 'menu' },
        extra.map((x) => item(x.icon, x.label, x.sub, x.fn)),
        item('📋', '記録の一覧', '時刻・選手・記録を直す、消す', () => openLog()),
        item('📊', '集計', sp.statsSub || '選手ごとの記録', openStats),
        item('👥', sp.setupEditTitle || 'チーム・形式を直す', sp.setupEditSub || '名前・色・背番号・試合の形式', () => { S.setupFor = 'edit'; go('setup'); }),
        item('🎛', '設定', 'ボタンの組み合わせ・名前の表示・音・画面の色', openSettings),
        item('💾', '書き出す', '記録のファイル（JSON）・CSV', () => openExport(g)),
        g.startedAt && !g.endedAt ? item('⏹', `${sp.unit || '試合'}を終える`, '時計を止めて、集計を見る', () => ST.ui.confirm(`${sp.unit || '試合'}を終えますか？`, '時計が止まります。まちがえて終えたときは「続きを記録する」で戻せます。', '終える', endGame)) : null,
        g.endedAt ? item('▶', '続きを記録する', 'まちがえて終えたとき', reopen) : null,
        g.startedAt && !plays ? item('↺', 'スタートを取り消す', 'まちがえて押したとき（記録がまだないときだけ）', () => ST.ui.confirm('スタートを取り消しますか？', '時計が 0:00 に戻ります。', '取り消す', cancelStart)) : null,
        item('❓', '使い方', null, () => help(sp)),
        item('🏠', `${sp.name}のホームへ`, g.startedAt && !g.endedAt ? '記録は保存されています。あとで続きから記録できます' : null, () => go('home')))
    });
  }

  /* ---------- 記録の一覧・直す ---------- */
  function openLog(filter) {
    const g = S.game, sp = sport();
    const f = filter === 0 || filter === 1 || filter === 'none' ? filter : null;
    const isMeta = (e) => !!(ST.typeOf(g, e.type) || {}).meta;
    const evs = ST.sorted(g).reverse().filter((e) => f == null || isMeta(e) || (f === 'none' ? e.team == null : e.team === f));
    const anyFree = g.events.some((e) => !isMeta(e) && e.team == null);
    const row = (e) => {
      const d = ST.typeOf(g, e.type) || { label: e.type, kind: '' };
      if (d.meta) return h('button', { class: 'lrow per', dataset: { id: e.id }, onclick: () => openEdit(e.id) }, h('b', { class: 'lt' }, ST.fmtTime(e.t)), h('span', { class: 'lp' }, `── ${ST.eventText(g, e)} ──`));
      return h('button', { class: 'lrow', dataset: { id: e.id }, onclick: () => openEdit(e.id) },
        h('b', { class: 'lt' }, timeText(e)),
        e.team == null ? h('i', { class: 'chip neutral' }) : h('i', { class: 'chip', style: { background: teamColor(e.team) } }),
        h('span', { class: 'lno' }, sp.logWho ? sp.logWho(g, e) : e.no != null ? '#' + e.no : '—'),
        h('span', { class: 'llabel k-' + d.kind }, (sp.logText ? sp.logText(g, e) : ST.typeLabel(g, e)) + (d.pts ? ` +${d.pts}` : '')),
        h('small', { class: 'lname' }, e.team == null ? (sp.noTeamText || 'チームなし') : e.no != null ? ST.playerName(g, e.team, e.no) : (sp.noNoText || '番号なし')));
    };
    const tabs = sp.hasTeams ? [[null, 'すべて'], [0, ST.teamName(g, 0)], [1, ST.teamName(g, 1)]] : [[null, 'すべて']];
    if (sp.hasTeams && (anyFree || f === 'none')) tabs.push(['none', 'チームなし']);
    ST.ui.sheet({
      title: `記録の一覧（${g.events.filter((e) => !isMeta(e)).length}件）`, wide: true,
      body: h('div', null,
        tabs.length > 1 ? h('div', { class: 'row tabsrow' }, tabs.map(([v, lab]) => h('button', { class: 'btn small' + (f === v ? ' on' : ''), onclick: () => openLog(v) }, lab))) : null,
        h('p', { class: 'note' }, 'タップすると、時刻・選手・記録を直したり、消したりできます。新しい記録が上です。'),
        evs.length ? h('div', { class: 'loglist' }, evs.map(row)) : h('p', { class: 'note' }, 'まだ記録はありません。'))
    });
  }
  function openEdit(id) {
    const g = S.game, sp = sport(), view = viewOf(sp);
    const e = ST.findEvent(g, id);
    if (!e) return;
    const d = ST.typeOf(g, e.type) || {};
    const changed = () => { save(); if (S.L) { if (S.L.refresh) S.L.refresh(); updateLive(); } openEdit(id); };
    const fine = g.prec >= 100;
    const steps = fine ? [-1, -0.1, -0.01, 0.01, 0.1, 1] : [-5, -1, -0.5, 0.5, 1, 5];
    const nudge = (dt) => h('button', { class: 'btn small', onclick: () => { e.t = Math.max(0, ST.round(g, e.t + dt)); changed(); } }, (dt > 0 ? '+' : '−') + Math.abs(dt) + '秒');
    const body = h('div', { class: 'edit' });
    body.append(h('div', { class: 'field' }, h('span', null, `時刻（スタートから）：${ST.fmtTime(e.t, fine ? 2 : 1)}${sp.timeText && !d.meta ? '・' + sp.timeText(g, e) : ''}`), h('div', { class: 'row' }, steps.map(nudge))));
    if (view.editExtra) view.editExtra(ctx, e, body, changed);
    if (!d.meta && !d.noTeam && sp.hasTeams && !sp.noTeamEdit) {
      const pts = !!d.pts;
      const teamBtn = (tm, label) => h('button', { class: 'btn' + (e.team === tm ? ' on' : ''), dataset: { eteam: tm == null ? 'none' : String(tm) }, onclick: () => { if (e.team !== tm) { e.team = tm; e.no = null; changed(); } } },
        tm == null ? h('i', { class: 'chip neutral' }) : h('i', { class: 'chip', style: { background: teamColor(tm) } }), label);
      body.append(h('div', { class: 'field' }, h('span', null, 'チーム'), h('div', { class: 'row' },
        teamBtn(0, ST.teamName(g, 0)), teamBtn(1, ST.teamName(g, 1)), pts && e.team != null ? null : teamBtn(null, 'チームなし'))));
      if (e.team != null && !sp.noNoEdit) {
        const players = g.teams[e.team].players.map((p) => p.no);
        if (e.no != null && !players.includes(e.no)) players.push(e.no);
        body.append(h('div', { class: 'field' }, h('span', null, '背番号'), h('div', { class: 'row nopick' },
          h('button', { class: 'btn small' + (e.no == null ? ' on' : ''), onclick: () => { e.no = null; changed(); } }, '番号なし'),
          ST.sortNos(players).map((no) => h('button', { class: 'btn small nobtn' + (e.no === no ? ' on' : ''), onclick: () => { e.no = no; changed(); } }, '#' + no)))));
      }
    }
    const types = sp.editTypes ? sp.editTypes(g, e, sprefs()) : [];
    if (types.length > 1) {
      body.append(h('div', { class: 'field' }, h('span', null, sp.typeWord || 'プレー'), h('div', { class: 'row typepick' },
        types.map((tid) => { const td = sp.TYPE[tid]; return h('button', { class: 'btn small k-' + td.kind + (e.type === tid ? ' on' : ''), dataset: { etype: tid }, onclick: () => { e.type = tid; if (td.pts && e.team == null && sp.hasTeams) e.team = 0; changed(); } }, td.label); }))));
    }
    ST.ui.sheet({
      title: d.meta ? `${ST.eventText(g, e)}の時刻を直す` : '記録を直す', body,
      foot: [
        h('button', { class: 'btn danger', id: 'btnDelEv', onclick: () => {
          if (sp.keepFirst && ST.sorted(g)[0] === e) { ST.ui.toast('スタートの記録は消せません（時刻は直せます）', 'warn'); return; }
          ST.removeEvent(g, id); save(); if (S.L) { if (S.L.refresh) S.L.refresh(); updateLive(); } openLog(); ST.ui.toast('消しました', 'ok');
        } }, '🗑 消す'),
        h('button', { class: 'btn', onclick: () => openLog() }, '← 一覧へ'),
        h('button', { class: 'btn primary', onclick: () => ST.ui.closeSheet() }, 'とじる')]
    });
  }

  /* ---------- 集計 ---------- */
  function openStats() {
    const g = S.game, sp = sport(), view = viewOf(sp);
    ST.ui.sheet({
      title: '集計', wide: true,
      body: h('div', { class: 'stats' }, view.stats ? view.stats(ctx, g) : h('p', null, ST.scoreText(g))),
      foot: [h('button', { class: 'btn', onclick: () => openExport(g) }, '💾 書き出す'), h('button', { class: 'btn primary', onclick: () => ST.ui.closeSheet() }, 'とじる')]
    });
  }

  /* ---------- 書き出す ---------- */
  function exportsOf(sp) {
    if (sp.exports) return sp.exports;
    return [
      { key: 'csv', suffix: '_一覧', label: '📋 記録の一覧（CSV）', desc: '時刻・チーム・背番号・記録・その時点の得点。Excel・Numbers・Google スプレッドシートで開けます', rows: sp.csvEvents },
      { key: 'box', suffix: '_集計', label: '📊 選手ごとの集計（CSV）', desc: '選手ごとの得点・シュート・カードなど', rows: sp.csvBox }
    ].filter((x) => x.rows);
  }
  function openExport(game) {
    const g = game || S.game;
    const sp = ST.sportOf(g);
    const base = ST.fileBase(g);
    const share = ST.ui.canShareFiles();
    const go2 = async (x) => {
      let name, blob;
      if (x === 'json') { name = base + '.json'; blob = new Blob([JSON.stringify(ST.exportData(g), null, 1)], { type: 'application/json' }); }
      else { name = base + x.suffix + '.csv'; blob = new Blob(['﻿' + ST.csv(x.rows(g))], { type: 'text/csv' }); }
      const r = await ST.ui.shareOrDownload(name, blob, share);
      if (r === 'downloaded') ST.ui.toast(`保存しました：${name}`, 'ok', 4000);
      else if (r === 'shared') ST.ui.toast('送りました', 'ok');
    };
    ST.ui.sheet({
      title: '書き出す',
      body: h('div', { class: 'export' },
        h('button', { class: 'xitem', id: 'btnExpJson', onclick: () => go2('json') }, h('b', null, '🗂 記録のファイル（JSON）'), h('small', null, 'この記録アプリで開き直せるファイル。時刻つきなので、ほかのアプリ（動画の切り出しなど）でも使えます')),
        exportsOf(sp).map((x) => h('button', { class: 'xitem', id: 'btnExp_' + x.key, onclick: () => go2(x) }, h('b', null, x.label), h('small', null, x.desc))),
        h('p', { class: 'note' }, share ? 'スマホでは「共有」が開きます（AirDrop・「ファイル」に保存・LINE など）。' : 'ダウンロードのフォルダに保存します。'))
    });
  }

  /* ---------- 設定 ---------- */
  function openSettings() {
    const p = S.prefs, sp = sport(), view = viewOf(sp), pr = sprefs(sp.id);
    const body = h('div', { class: 'settings' });
    const box = (obj, key, label, defOn, after) => h('label', { class: 'chk' }, h('input', { type: 'checkbox', dataset: { pref: key }, checked: obj[key] != null ? !!obj[key] : !!defOn, onchange: (e) => { obj[key] = e.target.checked; savePrefs(); if (after) after(); } }), label);
    if (sp.toggles && sp.toggles.length) {
      body.append(h('section', { class: 'field', id: 'setButtons' }, h('span', null, sp.togglesTitle || '選手のボタン'),
        h('p', { class: 'note' }, sp.togglesNote || `いつもある：${(sp.base || []).map((x) => sp.TYPE[x].btn || sp.TYPE[x].label).join('・')}。下を選ぶと、ボタンが増えます（1つずつは少し小さくなります）。`),
        sp.toggles.map((tg) => box(pr.rows, tg.key, tg.label, tg.def, refresh))));
    }
    if (sp.family === 'team' || sp.rowNames) {
      body.append(h('section', { class: 'field' }, h('span', null, '記録の画面'),
        box(pr, 'names', '背番号の下に、選手の名前も出す（行の高さに余裕があるとき）', true, refresh),
        sp.family === 'team' ? box(pr, 'unknown', '「？」の行を出す（だれか分からないときに、チームだけで記録する）', true, refresh) : null));
    }
    if (view.settings) body.append(view.settings(ctx, refresh));
    body.append(h('section', { class: 'field' }, h('span', null, '音'),
      box(p, 'sound', '押したときに音を出す（「ピッ」）', false, () => { if (p.sound) ST.ui.beep(880, 60); })));
    body.append(h('section', { class: 'field' }, h('span', null, '画面の色'),
      h('div', { class: 'row' }, [['auto', '端末に合わせる'], ['light', '明るい'], ['dark', '暗い']].map(([v, lab]) => h('button', { class: 'btn small' + (p.theme === v ? ' on' : ''), onclick: () => { p.theme = v; savePrefs(); applyTheme(); openSettings(); } }, lab)))));
    body.append(h('p', { class: 'note' }, ST.ui.wakeSupported() ? '💡 記録の途中は、画面が自動で消えないようにしています。' : '💡 この端末では、画面が自動で消えるのを止められません。端末の「自動ロック」を長めにしてください。'));
    function refresh() { if (S.view === 'live') rebuild(); }
    ST.ui.sheet({ title: `設定（${sp.name}）`, body });
  }

  /* ---------- 使い方 ---------- */
  function help(sp) {
    sp = sp || sport();
    ST.ui.sheet({
      title: `使い方（${sp.name}）`, wide: true,
      body: h('div', { class: 'help' },
        h('ol', null, (sp.steps || []).map(([b, s]) => h('li', null, h('b', null, b), '：', s))),
        (sp.help || []).map(([title, items]) => [h('h4', null, title), h('ul', null, items.map((x) => h('li', null, x)))]),
        h('h4', null, 'まちがえたとき'),
        h('ul', null,
          h('li', null, '画面の下の「↶ 取り消す」で、いちばん新しい記録を取り消し（「やり直す」で戻せます）'),
          h('li', null, '「≡ メニュー」→「記録の一覧」で、どの記録でも、時刻・選手・記録を直したり消したりできます')),
        h('h4', null, 'うまく使うコツ'),
        h('ul', null,
          h('li', null, '記録の途中は、画面が自動で消えないようにしています（できない端末では、自動ロックを長めに）'),
          h('li', null, 'iPhone は「共有」→「ホーム画面に追加」すると、画面いっぱいに使えます（この種目の画面から追加すると、次からこの種目で開きます）'),
          h('li', null, '時計は止まらずに進みます（スタートからの時間）。試合の動画と同じように進むので、あとで動画と合わせて見返せます'),
          h('li', null, '大事な記録は、終わったら「書き出す」でファイルに残してください')),
        h('p', { class: 'note' }, '🔒 記録はこの端末のブラウザの中だけに保存します。どこにも送りません。'))
    });
  }
  function helpPicker() {
    ST.ui.sheet({
      title: '使い方', wide: true,
      body: h('div', { class: 'help' },
        h('p', null, '「バスケ タップ記録」と同じしくみ（試合を見ながら、押した瞬間の時刻つきで記録する）を、ほかの種目に合わせたものです。'),
        h('ul', null, ST.SPORT_ORDER.map((id) => { const sp = ST.SPORTS[id]; return h('li', null, h('b', null, `${sp.icon} ${sp.name}`), '：', sp.desc); })),
        h('p', { class: 'note' }, '🔒 記録はこの端末のブラウザの中だけに保存します。どこにも送りません。'))
    });
  }

  /* ---------- 種目の画面に貸すもの ---------- */
  const ctx = {
    ST, h, $, S,
    get game() { return S.game; },
    get sport() { return sport(); },
    get sprefs() { return sprefs(); },
    get prefs() { return S.prefs; },
    now, elapsed, record, save, savePrefs, say, undo, redo, start, flash, feel, canRecord, rebuild, openMenu, openLog, openEdit, openStats, openExport, openSettings, endGame, timeText,
    update: (bump) => updateLive(bump),
    ui: { clockBtn, startBtn, menuBtn, footer, cover },
    teamColor
  };
  ST.ctx = ctx;

  /* ---------- 起動 ---------- */
  function init() {
    applyTheme();
    if (root.matchMedia) { try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme); } catch (e) { /* 古いブラウザ */ } }
    document.addEventListener('touchstart', () => {}, { passive: true });
    document.addEventListener('contextmenu', (e) => { if (S.view === 'live' && e.target.closest && e.target.closest('.live')) e.preventDefault(); });
    document.addEventListener('dblclick', (e) => { if (S.view === 'live') e.preventDefault(); }, { passive: false });
    root.addEventListener('popstate', onPop);
    root.addEventListener('beforeunload', (e) => { if (S.view === 'live' && S.game && S.game.startedAt && !S.game.endedAt) { e.preventDefault(); e.returnValue = ''; } });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && ST.ui.sheetOpen()) ST.ui.closeSheet(); });
    setInterval(tick, 100);
    let rq = 0;
    const relayout = () => { cancelAnimationFrame(rq); rq = requestAnimationFrame(() => { if (S.view === 'live' && S.L && S.L.layout) S.L.layout(); }); };
    root.addEventListener('resize', relayout);
    root.addEventListener('orientationchange', () => setTimeout(relayout, 250));
    document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
    if (root.location && location.protocol === 'https:' && navigator.serviceWorker) navigator.serviceWorker.register('sw.js').catch(() => {});
    // URL の ?s=種目 → その種目のホーム。記録中の試合があれば、そのまま続きから
    let want = null;
    try { want = new URL(root.location.href).searchParams.get('s'); } catch (e) { want = null; }
    if (want && !ST.SPORTS[want]) want = null;
    const cur = ST.store.current();
    const g = cur ? ST.store.loadGame(cur) : null;
    if (g && g.startedAt && !g.endedAt && (!want || want === g.sport)) { openGame(g); return; }
    const sid = want || (ST.SPORTS[S.prefs.last] ? S.prefs.last : null);
    if (want) { setSport(sid); go('home'); }
    else { setSport(null); go('picker'); }
  }

  ST.app = { S, init, start, undo, redo, openMenu, openLog, openEdit, openStats, openExport, openSettings, endGame, reopen, newGame, go, resume, setSport, rebuild, ctx };
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  }
})(typeof window !== 'undefined' ? window : globalThis);
