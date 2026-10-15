/* 指導案メーカー：一覧画面・上のバー・新規作成・様式と書式・出力・点検・保存 */
(function () {
  const SD = window.SD;
  const U = SD.U;
  const UI = SD.ui;
  const { h, icon } = UI;
  const S = SD.S;
  const ED = SD.ed;
  const $ = (s, r = document) => r.querySelector(s);

  document.getElementById('docCss').textContent = SD.docCss();

  // ───────── 保存 ─────────
  const saveNow = () => {
    if (!S.plan) return;
    const ok = SD.savePlan(S.plan);
    S.saveState = ok ? 'saved' : 'error';
    SD.updateTopbarState();
    if (!ok) UI.toast('保存できませんでした（ブラウザの保存容量が足りない可能性があります）。「出力」→「ファイルに保存」で保存してください。', { ms: 8000 });
  };
  const saveSoon = U.debounce(saveNow, 700);
  SD.dirty = () => { S.saveState = 'dirty'; SD.updateTopbarState(); saveSoon(); };
  window.addEventListener('beforeunload', () => { if (S.saveState === 'dirty') saveSoon.flush(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && S.saveState === 'dirty') saveSoon.flush(); });

  // ───────── 上のバー ─────────
  SD.renderTopbar = () => {
    const tb = $('#topbar');
    tb.innerHTML = '';
    tb.className = `tb-${S.view} mode-${S.mode}`;
    const brand = h('button', { type: 'button', class: 'brand', title: '指導案の一覧へ', onClick: () => SD.goHome() }, h('span', { class: 'logo' }, '案'), h('span', { class: 'bn' }, '指導案メーカー'));
    if (S.view !== 'edit') {
      tb.append(brand, h('span', { class: 'grow' }),
        UI.btn('ファイルから開く', () => SD.importFile(), { cls: 'sm ghost', icon: 'folder' }),
        UI.btn('使い方', () => SD.helpDialog(), { cls: 'sm ghost', icon: 'help' }));
      return;
    }
    const nameInp = h('input', { class: 'tb-name', id: 'tbName', value: S.plan.name || '', placeholder: SD.planName(Object.assign({}, S.plan, { name: '' })), 'aria-label': '指導案の名前（一覧に出る名前）', title: '一覧に出る名前（空なら自動）',
      onInput: (e) => SD.textEdit('name', (p) => { p.name = e.target.value; }) });
    const checks = SD.check(S.plan).filter((c) => c.lv === 'warn').length;
    tb.append(
      h('button', { type: 'button', class: 'iconbtn tb-back', title: '一覧にもどる', 'aria-label': '一覧にもどる', onClick: () => SD.goHome() }, icon('left')),
      brand,
      h('button', { type: 'button', class: 'iconbtn tb-outline', title: '項目の一覧', 'aria-label': '項目の一覧', onClick: () => { S.outlineOpen = !S.outlineOpen; S.sideOpen = false; ED.syncDrawers(); } }, icon('list')),
      nameInp,
      h('span', { class: 'tb-save', id: 'tbSave' }),
      h('span', { class: 'grow' }),
      h('button', { type: 'button', class: 'iconbtn', id: 'tbUndo', title: '元に戻す（⌘Z / Ctrl+Z）', 'aria-label': '元に戻す', onClick: SD.undoAct }, icon('undo')),
      h('button', { type: 'button', class: 'iconbtn', id: 'tbRedo', title: 'やり直す（⇧⌘Z / Ctrl+Y）', 'aria-label': 'やり直す', onClick: SD.redoAct }, icon('redo')),
      h('button', { type: 'button', class: 'iconbtn tb-view', title: '表示の設定（文字の大きさ・文例の候補・画面の案内）', 'aria-label': '表示の設定', onClick: (e) => SD.viewMenu(e.currentTarget) }, h('span', { class: 'tb-aa' }, 'Aa')),
      h('span', { class: 'tb-sep' }),
      UI.btn('様式・書式', () => SD.openPatternDialog('pattern'), { cls: 'sm ghost tb-style', icon: 'layout', title: '様式パターンの切りかえ・マイ様式・文字の大きさや余白' }),
      h('button', { type: 'button', class: 'btn sm ghost tb-check', id: 'tbCheck', title: '書き忘れ・時間の合計などを点検', onClick: () => SD.checkDialog() }, icon('check'), h('span', null, '点検'), checks ? h('b', { class: 'badge warn' }, checks) : null),
      h('div', { class: 'seg tb-mode', role: 'group', 'aria-label': '表示' },
        h('button', { type: 'button', class: `seg-b ${S.mode === 'edit' ? 'on' : ''}`, title: '編集だけを広く', onClick: () => SD.setMode('edit') }, icon('edit'), h('span', null, '編集')),
        window.innerWidth >= 1100 ? h('button', { type: 'button', class: `seg-b ${S.mode === 'split' ? 'on' : ''}`, title: '編集しながら、右に仕上がりを出す', onClick: () => SD.setMode('split') }, icon('cols'), h('span', null, '並べて')) : null,
        h('button', { type: 'button', class: `seg-b ${S.mode === 'preview' ? 'on' : ''}`, title: 'A4の印刷イメージを大きく', onClick: () => SD.setMode('preview') }, icon('eye'), h('span', null, '印刷イメージ'))),
      h('button', { type: 'button', class: 'btn sm primary', onClick: (e) => SD.outputMenu(e.currentTarget) }, icon('down-file'), h('span', null, '出力')),
      h('button', { type: 'button', class: 'iconbtn tb-side', title: '文例', 'aria-label': '文例', onClick: () => { S.sideOpen = !S.sideOpen; S.outlineOpen = false; ED.syncDrawers(); } }, icon('book')),
      // せまい画面では、様式・点検・やり直しをこのメニューにまとめる
      h('button', { type: 'button', class: 'iconbtn tb-more', title: 'そのほか', 'aria-label': 'そのほかの操作', onClick: (e) => UI.menu(e.currentTarget, [
        { label: '様式・書式', icon: 'layout', onClick: () => SD.openPatternDialog('pattern') },
        { label: `点検（${SD.check(S.plan).filter((c) => c.lv === 'warn').length}件）`, icon: 'check', onClick: () => SD.checkDialog() },
        { label: 'やり直す', icon: 'redo', disabled: !S.redo.length, onClick: SD.redoAct },
        { label: '次の空欄へ', icon: 'next', onClick: () => ED.gotoNextBlank() },
        { sep: true },
        { label: '表示の設定（文字の大きさなど）', icon: 'layout', onClick: () => setTimeout(() => SD.viewMenu(document.querySelector('.tb-more')), 0) },
        { label: '使い方', icon: 'help', onClick: () => SD.helpDialog() },
      ], { alignRight: true }) }, icon('more')));
    SD.updateTopbarState();
  };
  // 表示の設定：文字を大きく／書いている途中に文例の候補／画面の案内
  SD.applyBigText = () => document.documentElement.classList.toggle('big-ui', !!SD.prefs().bigText);
  SD.viewMenu = (anchor) => {
    const pr = SD.prefs();
    UI.menu(anchor, [
      { head: '表示の設定' },
      { label: '文字を大きくする', icon: 'check', on: !!pr.bigText, sub: pr.bigText ? 'いま：大きい文字' : 'いま：ふつうの文字', onClick: () => { SD.setPrefs({ bigText: !pr.bigText }); SD.applyBigText(); if (S.view === 'edit') ED.render(); } },
      { label: '書いている途中に文例の候補を出す', icon: 'check', on: pr.suggest !== false, sub: pr.suggest !== false ? 'いま：出す（Tabで入れる）' : 'いま：出さない', onClick: () => { SD.setPrefs({ suggest: pr.suggest === false }); ED.hideSuggest && ED.hideSuggest(); UI.toast(pr.suggest === false ? '候補を出すようにしました' : '候補を出さないようにしました'); } },
      { sep: true },
      { label: '画面の案内をもう一度見る', icon: 'help', onClick: () => SD.tour && SD.tour() },
      { label: '使い方', icon: 'book', onClick: () => SD.helpDialog() },
    ], { alignRight: true, cls: 'menu-wide' });
  };
  SD.updateTopbarState = () => {
    const sv = $('#tbSave');
    if (sv) {
      sv.className = `tb-save ${S.saveState}`;
      sv.textContent = { saved: '保存済み', dirty: '保存中…', error: '保存できません' }[S.saveState] || '';
    }
    const un = $('#tbUndo'); if (un) un.disabled = !S.undo.length;
    const re = $('#tbRedo'); if (re) re.disabled = !S.redo.length;
    const nm = $('#tbName'); if (nm && S.plan && !S.plan.name) nm.placeholder = SD.planName(S.plan);
    const ck = $('#tbCheck');
    if (ck && S.plan) {
      const n = SD.check(S.plan).filter((c) => c.lv === 'warn').length;
      const b = ck.querySelector('.badge');
      if (n && !b) ck.append(h('b', { class: 'badge warn' }, n)); else if (n && b) b.textContent = n; else if (!n && b) b.remove();
    }
  };
  SD.setMode = (m) => {
    S.mode = m;
    S.sideOpen = false;
    SD.setPrefs({ lastMode: m === 'split' ? 'split' : 'edit' });
    ED.render();
    if (m === 'preview') $('#edCenter').scrollTop = 0;
  };

  // ───────── 一覧（ホーム） ─────────
  SD.goHome = () => {
    if (S.saveState === 'dirty') saveSoon.flush();
    const fab = document.getElementById('bankFab'); if (fab) fab.remove();
    S.view = 'home'; S.plan = null; S.undo = []; S.redo = []; S.target = null; S.mode = 'edit';
    history.replaceState(null, '', location.pathname);
    SD.renderTopbar();
    renderHome();
  };
  SD.openPlan = (plan, o = {}) => {
    S.view = 'edit'; S.plan = plan; S.undo = []; S.redo = []; S.target = null; S.bankSig = ''; S.mode = o.mode || (SD.prefs().lastMode === 'split' && window.innerWidth >= 1100 ? 'split' : 'edit');
    S.collapsed = new Set(); S.setOpen = null; S.tableView = {};
    S.saveState = 'saved';
    history.replaceState(null, '', `#/plan/${plan.id}`);
    ED.render();
    if (o.fresh) saveNow();
  };
  function renderHome() {
    const main = $('#main');
    main.className = 'view-home';
    main.innerHTML = '';
    const plans = SD.listPlans();
    const hero = h('section', { class: 'hero' },
      h('div', { class: 'hero-t' },
        h('h1', null, '指導案を、選んでつくる。'),
        h('p', null, '様式パターンを選ぶ → 使う項目・表の列を選ぶ → 文例をクリック。単元を選ぶと目標・評価規準・指導計画まで下書きが入ります。Word・PDFで出力できます。')),
      h('div', { class: 'hero-acts' },
        h('button', { type: 'button', class: 'btn primary big', onClick: () => SD.newPlanDialog() }, icon('plus'), h('span', null, '新しい指導案をつくる')),
        h('button', { type: 'button', class: 'btn big', onClick: () => SD.openSample() }, icon('eye'), h('span', null, '見本を開く'))));
    const steps = h('ol', { class: 'steps' },
      [['様式を選ぶ', '細案・略案・問題解決型・本時案・単元計画など。自分の学校の形は「マイ様式」に保存。'],
        ['項目と列を選ぶ', '左の一覧でチェック。表の列はチップで出し入れ。見出しの言葉も自由に変えられます。'],
        ['文例で埋める', '欄をクリックすると右に合う文例。22単元の目標・評価規準・つまずき（174件）入り。'],
        ['出力する', 'Word（.docx）・PDF・書式つきコピー。AIで清書するためのプロンプトも。']]
        .map(([t, d], i) => h('li', null, h('b', null, U.zen(i + 1)), h('div', null, h('strong', null, t), h('span', null, d)))));
    // 前回のつづき（いちばん新しい指導案をすぐ開く／次の時間をつくる）
    let resume = null;
    if (plans.length) {
      const e = plans[0];
      resume = h('section', { class: 'resume' },
        h('div', { class: 'rs-l' }, h('div', { class: 'rs-k' }, '前回のつづき'), h('div', { class: 'rs-t' }, e.name || '無題の指導案'), h('div', { class: 'rs-m' }, [e.pattern, `更新 ${U.fmtTime(e.updated)}`].filter(Boolean).join('・'))),
        h('div', { class: 'rs-acts' },
          UI.btn('開く', () => { const p = SD.loadPlan(e.id); if (p) SD.openPlan(p); }, { cls: '', icon: 'edit' }),
          e.unit ? UI.btn(`次の時間（第${U.num(e.lessonNo, 0) + 1}時）をつくる`, () => SD.nextLesson(e.id), { cls: 'primary', icon: 'next' }) : null));
    }
    const list = h('section', { class: 'plans' });
    const head = h('div', { class: 'sec-h' }, h('h2', null, '保存した指導案'), h('span', { class: 'muted' }, plans.length ? `${plans.length}件・このブラウザに保存` : ''));
    list.append(head);
    if (!plans.length) list.append(h('p', { class: 'muted empty' }, 'まだありません。「新しい指導案をつくる」から始めてください。'));
    else {
      const grid = h('div', { class: 'plan-grid' });
      const card = (e) => h('div', { class: 'plan-card' },
        h('button', { type: 'button', class: 'pc-main', onClick: () => { const p = SD.loadPlan(e.id); if (p) SD.openPlan(p); else UI.toast('読みこめませんでした'); } },
          h('div', { class: 'pc-t' }, e.name || '無題の指導案'),
          h('div', { class: 'pc-m' }, [e.pattern, e.grade ? `中${e.grade}` : '', e.unit].filter(Boolean).join('・')),
          h('div', { class: 'pc-d' }, `更新 ${U.fmtTime(e.updated)}`)),
        h('div', { class: 'pc-acts' },
          UI.btn('次の時間', () => SD.nextLesson(e.id), { cls: 'sm ghost', icon: 'next', title: 'この指導案をもとに、次の時間の指導案をつくる' }),
          h('button', { type: 'button', class: 'iconbtn', title: 'そのほかの操作', 'aria-label': 'そのほかの操作', onClick: (ev) => UI.menu(ev.currentTarget, [
            { label: '複製する', icon: 'dup', onClick: () => { const p = SD.loadPlan(e.id); if (!p) return; const c = U.clone(p); c.id = U.uid(); c.name = p.name ? `${p.name}（コピー）` : ''; c.created = Date.now(); SD.savePlan(c); renderHome(); UI.toast('複製しました'); } },
            { label: 'ファイルに保存（.json）', icon: 'down-file', onClick: () => { const p = SD.loadPlan(e.id); if (p) SD.exportJson(p); } },
            { label: 'Wordで出力（.docx）', icon: 'down-file', onClick: () => { const p = SD.loadPlan(e.id); if (p) SD.exportDocx(p); } },
            { sep: true },
            { label: '削除する', icon: 'trash', danger: true, onClick: async () => { if (await UI.confirm('削除しますか？', `「${e.name}」を削除します。元に戻せません。`, { ok: '削除する', danger: true })) { SD.deletePlan(e.id); renderHome(); } } },
          ], { alignRight: true }) }, icon('more'))));
      const draw = (q) => {
        grid.innerHTML = '';
        const qs = String(q || '').trim();
        const hit = plans.filter((e) => !qs || [e.name, e.unit, e.pattern].join(' ').includes(qs));
        hit.forEach((e) => grid.append(card(e)));
        if (!hit.length) grid.append(h('p', { class: 'muted empty' }, '見つかりませんでした。'));
      };
      if (plans.length >= 6) head.append(h('input', { class: 'inp home-q', type: 'search', placeholder: 'さがす（単元名・様式など）', 'aria-label': '保存した指導案をさがす', onInput: (ev) => draw(ev.target.value) }));
      draw('');
      list.append(grid);
    }
    const mine = SD.myPatterns();
    const pats = h('section', { class: 'plans' }, h('div', { class: 'sec-h' }, h('h2', null, 'マイ様式'), h('span', { class: 'muted' }, '指導案の編集画面の「様式・書式」→「マイ様式」で、今の項目の構成を保存できます。')),
      mine.length ? h('div', { class: 'chip-row' }, mine.map((p) => h('button', { type: 'button', class: 'chip', onClick: () => SD.newPlanDialog({ patternId: p.id }) }, icon('layout'), p.name))) : h('p', { class: 'muted empty' }, 'まだありません。'));
    const foot = h('footer', { class: 'home-foot' },
      h('p', null, '保存はこのブラウザの中だけです。ほかのPCで続きをするときは「出力」→「ファイルに保存（.json）」でファイルにして、「ファイルから開く」で読みこみます。'),
      h('p', null, '文例は学習指導要領（平成29年告示）の内容をもとにしたたたき台です。学校の様式や教科書に合わせて、必ず授業者が確かめてから使ってください。'));
    main.append(h('div', { class: 'home' }, hero, resume, steps, list, pats, foot));
  }
  SD.renderHome = renderHome;

  // ───────── 新しい指導案 ─────────
  // その単元で前に作った指導案のいちばん後ろの時間の「次」をすすめる
  SD.suggestLessonNo = (unit) => {
    if (!unit) return 1;
    const nos = SD.listPlans().filter((e) => e.unit === unit).map((e) => U.num(e.lessonNo, 0));
    return nos.length ? Math.max(...nos) + 1 : 1;
  };
  SD.newPlanDialog = (o = {}) => {
    const prefs = SD.prefs();
    const lastUnitOk = prefs.lastUnit && SD.unitByName(prefs.lastUnit) && SD.unitByName(prefs.lastUnit).g === (prefs.lastGrade || 1);
    const st = {
      patternId: o.patternId || prefs.lastPattern || 'saian', grade: prefs.lastGrade || 1,
      unit: lastUnitOk ? prefs.lastUnit : '', lessonNo: 1, minutes: prefs.minutes || 50,
      flowId: null, fill: true, navi: true,
    };
    st.lessonNo = SD.suggestLessonNo(st.unit);
    const allPats = SD.patterns.concat(SD.myPatterns().map((p) => Object.assign({ mine: true, tags: ['マイ様式'] }, p)));
    const body = h('div', { class: 'np' });
    const secTitles = (p) => (p.skeleton ? p.skeleton.filter((x) => x.on && x.kind !== 'header').map((x) => x.title) : p.sections.filter((k) => k !== 'header').map((k) => SD.sectionDefs[k].title));
    const draw = () => {
      body.innerHTML = '';
      const pat = allPats.find((p) => p.id === st.patternId) || SD.patterns[0];
      if (st.flowId == null) st.flowId = pat.flow || '';
      // ① 授業
      const units = SD.unitsOf(st.grade);
      const u = SD.unitByName(st.unit);
      const lessonOpts = [];
      if (u) { let at = 1; for (const [t, hh] of u.plan) { for (let k = 0; k < hh; k += 1) { lessonOpts.push({ n: at, t }); at += 1; } } }
      const navi = SD.navi.ok && u ? SD.navi.lessonsFor(u.name) : [];
      const maxNo = navi.length || lessonOpts.length;
      if (maxNo && st.lessonNo > maxNo) st.lessonNo = maxNo;
      const prevNos = st.unit ? SD.listPlans().filter((e) => e.unit === st.unit).map((e) => U.num(e.lessonNo, 0)) : [];
      body.append(h('h3', { class: 'np-h' }, h('b', null, '１'), 'どの授業？', h('small', null, '空でもつくれます。あとから変えられます')));
      body.append(h('div', { class: 'np-row' },
        h('div', { class: 'seg', role: 'group', 'aria-label': '学年' }, [1, 2, 3].map((g) => h('button', { type: 'button', class: `seg-b ${st.grade === g ? 'on' : ''}`, 'aria-pressed': st.grade === g ? 'true' : 'false', onClick: () => { st.grade = g; st.unit = ''; st.lessonNo = 1; draw(); } }, `中${g}`))),
        h('select', { class: 'inp np-unit', 'aria-label': '単元', onChange: (e) => { st.unit = e.target.value; st.lessonNo = SD.suggestLessonNo(st.unit); draw(); } },
          h('option', { value: '' }, '単元を選ぶ'), units.map((x) => h('option', { value: x.name, selected: x.name === st.unit }, x.name))),
        h('label', { class: 'set-inl' }, '本時',
          navi.length
            ? h('select', { class: 'inp np-lesson', 'aria-label': '本時', onChange: (e) => { st.lessonNo = +e.target.value; } }, navi.map((l) => h('option', { value: l.no, selected: l.no === st.lessonNo }, `第${l.no}時　${l.title}`)))
            : lessonOpts.length
              ? h('select', { class: 'inp np-lesson', 'aria-label': '本時', onChange: (e) => { st.lessonNo = +e.target.value; } }, lessonOpts.map((x) => h('option', { value: x.n, selected: x.n === st.lessonNo }, `第${x.n}時　${x.t}`)))
              : h('span', { class: 'set-inl' }, '第', h('input', { class: 'inp xs', type: 'number', min: 1, value: st.lessonNo, 'aria-label': '本時は第何時か', onInput: (e) => { st.lessonNo = U.num(e.target.value, 1); } }), '時')),
        h('label', { class: 'set-inl' }, h('input', { class: 'inp xs', type: 'number', min: 10, max: 120, step: 5, value: st.minutes, 'aria-label': '授業時間', onInput: (e) => { st.minutes = U.num(e.target.value, 50) || 50; } }), '分')));
      if (prevNos.length) body.append(h('p', { class: 'np-hint' }, icon('check'), `この単元はこれまでに第${[...new Set(prevNos)].sort((x, y) => x - y).join('・')}時をつくっています。次の第${SD.suggestLessonNo(st.unit)}時を選んであります。`));
      // ② 様式
      body.append(h('h3', { class: 'np-h' }, h('b', null, '２'), 'どの様式？', h('small', null, '迷ったら：ふだんの授業は「略案」、研究授業は「細案」か「問題解決型」')));
      body.append(h('div', { class: 'pat-grid compact' }, allPats.map((p) => h('button', {
        type: 'button', class: `pat-card ${st.patternId === p.id ? 'on' : ''}`, 'aria-pressed': st.patternId === p.id ? 'true' : 'false', 'aria-label': `様式：${p.name}`, title: p.desc || '',
        onClick: () => { st.patternId = p.id; st.flowId = p.flow != null ? (p.flow || '') : st.flowId; draw(); },
      }, h('div', { class: 'pat-t' }, st.patternId === p.id ? icon('check') : null, p.name), h('div', { class: 'pat-tags' }, (p.tags || []).map((t) => h('span', null, t))), p.desc ? h('p', null, p.desc) : null))));
      body.append(h('p', { class: 'pat-sum' }, h('b', null, `「${pat.name}」に入る項目：`), secTitles(pat).join('・'), h('span', { class: 'muted' }, '（あとから足したり外したりできます）')));
      // ③ 展開の型
      const hasTenkai = pat.skeleton ? pat.skeleton.some((x) => x.key === 'tenkai' && x.on) : pat.sections.includes('tenkai');
      const useNavi = navi.length && st.navi;
      if (hasTenkai) {
        body.append(h('h3', { class: 'np-h' }, h('b', null, '３'), '本時の展開の型', h('small', null, '行と時間のひな形が入ります')));
        if (useNavi) body.append(h('p', { class: 'np-hint' }, icon('book'), '中1 授業ナビの、この時間の流れ（課題・問題・発問）が入ります。型を選ぶときは、下の「授業ナビ」のチェックを外してください。'));
        else {
          body.append(h('div', { class: 'flow-chips' },
            SD.flows.map((f) => h('button', { type: 'button', class: `chip big ${st.flowId === f.id ? 'on' : ''}`, title: f.desc, 'aria-label': `展開の型：${f.name}（${f.sub}）`, 'aria-pressed': st.flowId === f.id ? 'true' : 'false', onClick: () => { st.flowId = f.id; draw(); } }, st.flowId === f.id ? icon('check') : null, h('span', null, f.name, h('small', null, f.sub)))),
            h('button', { type: 'button', class: `chip big ${!st.flowId ? 'on' : ''}`, 'aria-label': '展開の型：空のまま', 'aria-pressed': !st.flowId ? 'true' : 'false', onClick: () => { st.flowId = ''; draw(); } }, !st.flowId ? icon('check') : null, h('span', null, '空のまま', h('small', null, '自分で行を足す')))));
        }
      }
      // 自動で入れる
      body.append(h('div', { class: 'np-opts' },
        h('label', { class: 'chk' }, h('input', { type: 'checkbox', checked: st.fill && !!u, disabled: !u, onChange: (e) => { st.fill = e.target.checked; } }), u ? `「${u.name}」の目標・評価規準・単元観・指導計画と、本時の目標などの下書きを入れる` : '単元を選ぶと、目標・評価規準・指導計画などの下書きも入ります'),
        navi.length ? h('label', { class: 'chk' }, h('input', { type: 'checkbox', checked: st.navi, onChange: (e) => { st.navi = e.target.checked; draw(); } }), '中1 授業ナビのデータから、本時の課題・問題・展開・板書を下書きする') : null));
    };
    draw();
    const create = () => {
      const pat = allPats.find((p) => p.id === st.patternId) || SD.patterns[0];
      const plan = SD.newPlan({ pattern: pat, grade: st.grade, unit: st.unit, lessonNo: st.lessonNo, minutes: st.minutes });
      if (pat.skeleton) { plan.style = Object.assign(SD.defaultStyle(), pat.style || {}); plan.titleBase = pat.titleBase || ''; plan.titleSuffix = pat.titleSuffix || ''; }
      const u = SD.unitByName(st.unit);
      const nl = u && st.navi && SD.navi.ok ? SD.navi.lessonsFor(u.name).find((l) => l.no === st.lessonNo) : null;
      if (u && st.fill) { SD.fillUnit(plan, true); if (nl) SD.navi.alignPlan(plan); SD.fillLesson(plan, true); }
      if (st.flowId && !nl) SD.applyFlow(plan, st.flowId, 'replace');
      if (nl) { SD.navi.alignPlan(plan); SD.navi.applyLesson(plan, nl, true); }
      SD.setPrefs({ lastPattern: pat.id, lastGrade: st.grade, lastUnit: st.unit, minutes: st.minutes });
      SD.openPlan(plan, { fresh: true });
      if (!SD.prefs().tourDone && SD.tour) setTimeout(() => SD.tour(), 400);
      else UI.toast('下書きができました。欄をクリックして書きこみ、右の文例で仕上げます。', { ms: 4500 });
    };
    UI.modal({
      title: '新しい指導案をつくる', body, cls: 'lg np-modal',
      actions: [{ label: 'やめる' }, { label: 'この内容でつくる', primary: true, icon: 'next', onClick: create }],
    });
  };

  // 次の時間：同じ単元・様式で、本時の部分を入れなおす
  SD.nextLesson = async (id) => {
    const p = SD.loadPlan(id);
    if (!p) return;
    const c = U.clone(p);
    c.id = U.uid(); c.name = ''; c.created = Date.now();
    c.meta.lessonNo = U.num(p.meta.lessonNo, 1) + 1;
    c.meta.topic = '';
    c.meta.date = '';
    // 本時の中身は空にして、型は残す
    for (const s of c.sections) {
      if (['honji_goal', 'mondai'].includes(s.key)) s.items = [''];
      if (['honji_kadai'].includes(s.key)) s.text = '';
      if (s.key === 'board') s.parts.forEach((x) => { x.text = ''; });
      if (s.key === 'honji_eval') s.rows = [];
      if (s.key === 'tenkai') s.rows.forEach((r) => { const keep = { phase: r.phase, min: r.min }; r.f = {}; Object.assign(r, keep); });
    }
    SD.fillLesson(c, false);
    const nl = SD.navi.ok ? SD.navi.lessonsFor(c.meta.unit).find((l) => l.no === c.meta.lessonNo) : null;
    if (nl) SD.navi.applyLesson(c, nl, true);
    else if (SD.sec(c, 'tenkai') && SD.sec(c, 'tenkai').flowId) SD.applyFlow(c, SD.sec(c, 'tenkai').flowId, 'replace');
    SD.openPlan(c, { fresh: true });
    UI.toast(`第${c.meta.lessonNo}時の指導案をつくりました（単元の部分はそのまま、本時の部分を入れなおしました）`, { ms: 5000 });
  };

  // ───────── 見本（中身は js/sample.js） ─────────
  SD.openSample = () => { SD.openPlan(SD.buildSample(), { fresh: true }); if (!SD.prefs().tourDone && SD.tour) setTimeout(() => SD.tour(), 400); };

  // ───────── 様式・書式 ─────────
  SD.openPatternDialog = (tab = 'pattern') => {
    const body = h('div', { class: 'pd' });
    let cur = tab;
    const tabs = h('div', { class: 'tabs', role: 'tablist' });
    const pane = h('div', { class: 'pd-pane' });
    let dlg;
    const drawTabs = () => {
      tabs.innerHTML = '';
      [['pattern', '様式を選ぶ'], ['mine', 'マイ様式'], ['style', '書式（番号・文字・余白）']].forEach(([k, l]) => tabs.append(h('button', { type: 'button', role: 'tab', class: `tab ${cur === k ? 'on' : ''}`, 'aria-selected': cur === k ? 'true' : 'false', onClick: () => { cur = k; drawTabs(); drawPane(); } }, l)));
    };
    const drawPane = () => {
      pane.innerHTML = '';
      if (cur === 'pattern') {
        pane.append(h('p', { class: 'muted' }, '様式を切りかえると、項目のならびと表の列が変わります。書いた中身は同じ項目に引きつぎます（新しい様式にない項目は、外した状態で残ります）。'));
        const pats = SD.patterns.concat(SD.myPatterns().map((p) => Object.assign({ mine: true, tags: ['マイ様式'] }, p)));
        pane.append(h('div', { class: 'pat-grid' }, pats.map((p) => h('button', { type: 'button', class: `pat-card ${S.plan.patternId === p.id ? 'on' : ''}`, 'aria-label': `様式：${p.name}`, onClick: async () => {
          if (!(await UI.confirm('様式を切りかえますか？', `「${p.name}」にします。あとで「元に戻す」でもどせます。`, { ok: '切りかえる' }))) return;
          SD.act((pl) => SD.applyPattern(pl, p), { all: true });
          dlg.close();
          UI.toast(`様式を「${p.name}」にしました`, { action: { label: '元に戻す', onClick: SD.undoAct } });
        } }, h('div', { class: 'pat-t' }, p.name), h('div', { class: 'pat-tags' }, (p.tags || []).map((t) => h('span', null, t))), p.desc ? h('p', null, p.desc) : null))));
      } else if (cur === 'mine') {
        const name = h('input', { class: 'inp', placeholder: '例：〇〇中学校の研究授業の様式', value: '' });
        pane.append(h('p', { class: 'muted' }, '今の指導案の「項目のならび・見出しの言葉・表の列・書式」を、中身をのぞいてマイ様式として保存します。次から「新しい指導案をつくる」で選べます。'),
          h('div', { class: 'np-row' }, name, UI.btn('マイ様式として保存', () => {
            const nm = name.value.trim() || `${S.plan.patternName || '様式'}（自分用）`;
            const all = SD.myPatterns();
            all.push({ id: `my_${U.uid()}`, name: nm, desc: '自分で保存した様式', skeleton: SD.toSkeleton(S.plan), style: U.clone(S.plan.style), titleBase: S.plan.titleBase || '', titleSuffix: S.plan.titleSuffix || '', flow: (SD.sec(S.plan, 'tenkai') || {}).flowId || '' });
            SD.setMyPatterns(all);
            UI.toast(`マイ様式「${nm}」を保存しました`);
            drawPane();
          }, { cls: 'primary', icon: 'star' })));
        const mine = SD.myPatterns();
        pane.append(h('h4', { class: 'pd-h4' }, `保存したマイ様式（${mine.length}）`));
        if (!mine.length) pane.append(h('p', { class: 'muted' }, 'まだありません。'));
        mine.forEach((p, i) => pane.append(h('div', { class: 'my-row' }, icon('layout'), h('span', { class: 'grow' }, p.name),
          UI.btn('名前を変える', async () => { const v = await UI.prompt('マイ様式の名前', p.name); if (!v) return; const all = SD.myPatterns(); all[i].name = v; SD.setMyPatterns(all); drawPane(); }, { cls: 'sm ghost' }),
          UI.btn('ファイルに保存', () => UI.download(new Blob([JSON.stringify({ app: 'shidoan-maker', type: 'pattern', pattern: p }, null, 1)], { type: 'application/json' }), `${UI.safeName(p.name)}.様式.json`), { cls: 'sm ghost' }),
          UI.btn('削除', async () => { if (!(await UI.confirm('削除しますか？', `マイ様式「${p.name}」を削除します。`, { ok: '削除する', danger: true }))) return; const all = SD.myPatterns(); all.splice(i, 1); SD.setMyPatterns(all); drawPane(); }, { cls: 'sm ghost danger' }))));
        pane.append(h('div', { class: 'np-row' }, UI.btn('様式のファイルを読みこむ', async () => {
          const f = await UI.pickFile('.json,application/json');
          if (!f) return;
          try {
            const o = JSON.parse(await f.text());
            if (o.type !== 'pattern' || !o.pattern || !o.pattern.skeleton) throw new Error('bad');
            const all = SD.myPatterns(); all.push(Object.assign(o.pattern, { id: `my_${U.uid()}` })); SD.setMyPatterns(all);
            UI.toast('マイ様式を読みこみました'); drawPane();
          } catch (e) { UI.toast('様式のファイルではないようです'); }
        }, { cls: 'sm', icon: 'folder' })));
      } else {
        const st = S.plan.style;
        const row = (label, ctrl, note) => h('div', { class: 'st-row' }, h('span', { class: 'st-lab' }, label), ctrl, note ? h('span', { class: 'muted' }, note) : null);
        const sel = (key, opts, parse = (v) => v) => h('select', { class: 'inp', onChange: (e) => SD.act((p) => { p.style[key] = parse(e.target.value); }, { all: true }) }, opts.map(([v, l]) => h('option', { value: v, selected: String(st[key]) === String(v) }, l)));
        pane.append(
          row('見出しの番号（1段目）', sel('n1', [['zen', '１　単元名'], ['han', '1　単元名'], ['zendot', '１．単元名'], ['dot', '1．単元名'], ['roman', 'Ⅰ　単元名'], ['none', '番号なし']])),
          row('見出しの番号（2段目）', sel('n2', [['zenparen', '（１）単元観'], ['paren', '(1) 単元観'], ['circle', '① 単元観'], ['kana', 'ア　単元観'], ['none', '番号なし']])),
          row('文字の大きさ', sel('fs', [9, 9.5, 10, 10.5, 11, 12].map((v) => [v, `${v}pt`]), Number), '10.5pt がWordのふつうの大きさ'),
          row('表の文字の大きさ', sel('tblfs', [[0, '自動（本文より少し小さく）'], ...[8, 8.5, 9, 9.5, 10, 10.5].map((v) => [v, `${v}pt`])], Number)),
          row('表題の大きさ', sel('tfs', [12, 13, 14, 16, 18].map((v) => [v, `${v}pt`]), Number)),
          row('余白（上下）', h('span', { class: 'set-inl' }, sel('mt', [8, 10, 12, 15, 20, 25].map((v) => [v, `上 ${v}mm`]), Number), sel('mb', [8, 10, 12, 15, 20, 25].map((v) => [v, `下 ${v}mm`]), Number))),
          row('余白（左右）', h('span', { class: 'set-inl' }, sel('ml', [10, 12, 15, 17, 20, 25].map((v) => [v, `左 ${v}mm`]), Number), sel('mr', [10, 12, 15, 17, 20, 25].map((v) => [v, `右 ${v}mm`]), Number))),
          row('教科', h('input', { class: 'inp', value: S.plan.meta.subject, onChange: (e) => { SD.act((p) => { p.meta.subject = e.target.value || '数学'; }, { all: true }); SD.setPrefs({ subject: e.target.value || '数学' }); } }), '表題の「〇〇科学習指導案」に入ります'),
          row('表題の後ろ', h('input', { class: 'inp', value: S.plan.titleSuffix || '', placeholder: '例：（略案）', onChange: (e) => SD.act((p) => { p.titleSuffix = e.target.value; }, { all: true }) })));
      }
    };
    drawTabs(); drawPane();
    body.append(tabs, pane);
    dlg = UI.modal({ title: '様式・書式', body, cls: 'lg', actions: [{ label: '閉じる', primary: true }] });
  };

  // ───────── 点検 ─────────
  SD.checkDialog = () => {
    const list = SD.check(S.plan);
    const body = h('div', { class: 'ck' });
    if (!list.length) body.append(h('p', { class: 'ck-ok' }, icon('check'), '気になるところは見つかりませんでした。'));
    for (const c of list) {
      body.append(h('button', { type: 'button', class: `ck-item ${c.lv}`, onClick: () => { dlg.close(); if (S.mode === 'preview') SD.setMode(SD.prefs().lastMode === 'split' && window.innerWidth >= 1100 ? 'split' : 'edit'); S.collapsed.delete(c.sid); ED.expandCard(c.sid); setTimeout(() => ED.scrollToSection(c.sid, true), 60); } },
        c.lv === 'warn' ? icon('alert') : icon('help'), h('span', null, c.msg), h('small', null, 'ここへ')));
    }
    body.append(h('p', { class: 'muted ck-note' }, '点検は「〇〇」の残り・空の項目・時間の合計・評価の書き忘れ・本時と指導計画のずれを見ます。内容の正しさは授業者が確かめてください。'));
    const dlg = UI.modal({ title: `点検（${list.length}件）`, body, cls: 'md', actions: [{ label: '閉じる', primary: true }] });
  };

  // ───────── 出力 ─────────
  SD.outputMenu = (anchor) => {
    UI.menu(anchor, [
      { label: '印刷・PDFに保存', icon: 'print', key: '⌘P', sub: '印刷画面で「PDFに保存」を選ぶとPDFになります', onClick: () => SD.print() },
      { label: 'Wordファイル（.docx）', icon: 'down-file', sub: 'Word・Googleドキュメント・Pagesで開けます', onClick: () => SD.exportDocx(S.plan) },
      { label: '書式つきでコピー', icon: 'copy', sub: '学校のWordの様式に貼りつけるときに', onClick: () => SD.copyRich() },
      { label: 'テキストでコピー', icon: 'copy', onClick: async () => { const ok = await UI.copyText(SD.renderPlain(S.plan)); UI.toast(ok ? 'テキストをコピーしました' : 'コピーできませんでした'); } },
      { label: 'AIで清書するためのプロンプトをコピー', icon: 'spark', sub: 'ChatGPT・Claude などに貼りつけて仕上げる', onClick: async () => { const ok = await UI.copyText(SD.aiPrompt(S.plan)); UI.toast(ok ? 'プロンプトをコピーしました。AIのチャットに貼りつけてください' : 'コピーできませんでした', { ms: 4000 }); } },
      { sep: true },
      { label: 'ファイルに保存（.json）', icon: 'folder', sub: 'ほかのPCで開く・同僚にわたす', onClick: () => SD.exportJson(S.plan) },
    ], { alignRight: true, cls: 'menu-wide' });
  };
  SD.fileBase = (plan) => UI.safeName(SD.planName(plan).replace(/^見本：/, ''));
  SD.exportDocx = (plan) => {
    try {
      const blob = SD.buildDocx(plan);
      UI.download(blob, `${SD.fileBase(plan)}.docx`);
      UI.toast('Wordファイルを書き出しました');
    } catch (e) { console.error(e); UI.toast('Wordファイルを作れませんでした'); }
  };
  SD.exportJson = (plan) => {
    UI.download(new Blob([JSON.stringify({ app: 'shidoan-maker', type: 'plan', v: 1, plan }, null, 1)], { type: 'application/json' }), `${SD.fileBase(plan)}.指導案.json`);
    UI.toast('ファイルに保存しました');
  };
  SD.importFile = async () => {
    const f = await UI.pickFile('.json,application/json');
    if (!f) return;
    try {
      const o = JSON.parse(await f.text());
      if (o.type === 'pattern' && o.pattern) {
        const all = SD.myPatterns(); all.push(Object.assign(o.pattern, { id: `my_${U.uid()}` })); SD.setMyPatterns(all);
        UI.toast(`マイ様式「${o.pattern.name}」を読みこみました`);
        if (S.view === 'home') renderHome();
        return;
      }
      const plan = o.plan || o;
      if (!plan.sections || !plan.meta) throw new Error('bad');
      plan.id = U.uid();
      SD.migrate(plan);
      SD.savePlan(plan);
      SD.openPlan(plan);
      UI.toast('指導案を読みこみました');
    } catch (e) { UI.toast('指導案メーカーのファイルではないようです'); }
  };
  SD.print = () => {
    const pa = $('#printArea');
    pa.innerHTML = SD.renderDoc(S.plan, 'print');
    const st = S.plan.style;
    $('#pageCss').textContent = `@page{size:A4 portrait;margin:${st.mt}mm ${st.mr}mm ${st.mb}mm ${st.ml}mm}`;
    const t = document.title;
    document.title = SD.fileBase(S.plan);
    setTimeout(() => { window.print(); document.title = t; }, 30);
  };
  window.addEventListener('beforeprint', () => {
    if (!S.plan) return;
    const pa = $('#printArea');
    if (!pa.innerHTML) pa.innerHTML = SD.renderDoc(S.plan, 'print');
    const st = S.plan.style;
    $('#pageCss').textContent = `@page{size:A4 portrait;margin:${st.mt}mm ${st.mr}mm ${st.mb}mm ${st.ml}mm}`;
  });
  window.addEventListener('afterprint', () => { $('#printArea').innerHTML = ''; });

  // 書式つきコピー：見た目をstyle属性に書きこんでから貼りつけ用にする
  SD.copyRich = async () => {
    const holder = h('div', { style: 'position:fixed;left:-99999px;top:0;width:180mm;background:#fff' });
    holder.innerHTML = SD.renderDoc(S.plan, 'print');
    document.body.append(holder);
    const props = ['font-weight', 'font-size', 'text-align', 'text-indent', 'padding-left', 'margin-left', 'margin-top', 'margin-bottom', 'vertical-align', 'background-color', 'border-top', 'border-right', 'border-bottom', 'border-left', 'padding-top', 'padding-right', 'padding-bottom', 'width'];
    holder.querySelectorAll('*').forEach((el) => {
      const cs = getComputedStyle(el);
      const keep = props.filter((p) => {
        if (p === 'width') return el.tagName === 'TABLE' || el.tagName === 'COL';
        if (p.startsWith('border')) return /^(TD|TH|TABLE)$/.test(el.tagName);
        if (p === 'background-color') return cs[p] !== 'rgba(0, 0, 0, 0)';
        return true;
      }).map((p) => `${p}:${cs.getPropertyValue(p)}`);
      el.setAttribute('style', `${keep.join(';')};font-family:'ＭＳ 明朝','MS Mincho','Yu Mincho',serif`);
    });
    holder.querySelectorAll('table').forEach((t) => { t.setAttribute('border', '1'); t.setAttribute('cellspacing', '0'); t.setAttribute('cellpadding', '3'); t.style.borderCollapse = 'collapse'; });
    holder.querySelectorAll('.d-info').forEach((t) => { t.setAttribute('border', '0'); });
    const html = holder.innerHTML;
    holder.remove();
    const ok = await UI.copyHtml(html, SD.renderPlain(S.plan));
    UI.toast(ok ? '書式つきでコピーしました。Wordなどに貼りつけてください' : 'コピーできませんでした', { ms: 4000 });
  };

  // ───────── 使い方 ─────────
  SD.helpDialog = () => {
    const dlgH = UI.modal({
      title: '使い方', cls: 'md', actions: [{ label: '閉じる', primary: true }],
      body: h('div', { class: 'help' },
        h('h4', null, '1. つくる'), h('p', null, '「新しい指導案をつくる」で様式・単元・本時・展開の型を選ぶと、目標・評価規準・指導計画・展開の下書きが入ります。'),
        h('h4', null, '2. 選ぶ'), h('p', null, '左の「指導案の項目」でチェックを入れた項目だけが指導案に入ります。⋮⋮ をドラッグで順番を変更。見出しの言葉は各カードの上で自由に変えられます。表は「列を選ぶ」のチップで列を出し入れします。'),
        h('h4', null, '3. 埋める'), h('p', null, '入力欄をクリックすると、右に合う文例が出ます。クリックで入ります。「〇〇」は本時の題材に置きかわります。表のセルで ⌘Enter（Ctrl+Enter）を押すと下に行が増えます。'),
        h('h4', null, '4. 仕上げる'), h('p', null, '「印刷イメージ」でA4の見た目とページの区切りを確認。「点検」で書き忘れや時間の合計を確認。「出力」からWord・PDF・コピー。'),
        h('h4', null, '保存について'), h('p', null, '変更は自動でこのブラウザに保存されます。別のPCや同僚とのやりとりは「ファイルに保存（.json）」を使ってください。'),
        h('h4', null, '速く書くコツ'), h('p', null, '書いている途中に文例の候補が出ます（Tab で入れる・↑↓で選ぶ）。文例の「〇」「〜」は選んだ状態で入るので、そのまま打てば書きかわります（Tab で次の〇へ）。左上の「次へ」（⌘J）で、まだ空の項目に順にとべます。'),
        h('h4', null, 'キーボード'), h('p', null, '⌘Z／Ctrl+Z：元に戻す　⇧⌘Z／Ctrl+Y：やり直す　⌘J／Ctrl+J：次の空欄へ　⌘Enter：表に行を足す　⌘P／Ctrl+P：印刷'),
        h('p', { class: 'help-tour' }, UI.btn('画面の案内をもう一度見る', () => { dlgH.close(); setTimeout(() => SD.tour && SD.tour(), 200); }, { cls: 'sm', icon: 'help' }))),
    });
  };

  // ───────── キーボード ─────────
  document.addEventListener('keydown', (e) => {
    if (S.view !== 'edit') return;
    const mod = e.metaKey || e.ctrlKey;
    if (!mod) return;
    const k = e.key.toLowerCase();
    if (k === 'z' && !e.shiftKey) { e.preventDefault(); SD.undoAct(); }
    else if ((k === 'z' && e.shiftKey) || k === 'y') { e.preventDefault(); SD.redoAct(); }
    else if (k === 'p') { e.preventDefault(); SD.print(); }
    else if (k === 's') { e.preventDefault(); saveSoon.flush(); UI.toast('保存しました'); }
    else if (k === 'j') { e.preventDefault(); ED.gotoNextBlank(); }
  });

  // ───────── はじめ ─────────
  SD.applyBigText();
  const start = () => {
    const m = location.hash.match(/^#\/plan\/(\w+)/);
    if (m) {
      const p = SD.loadPlan(m[1]);
      if (p) { SD.openPlan(p); return; }
    }
    if (/^#\/sample/.test(location.hash)) { SD.openSample(); return; }
    S.view = 'home';
    SD.renderTopbar();
    renderHome();
  };
  start();
  SD.navi.load().then((ok) => {
    if (!ok) return;
    if (S.view === 'edit' && S.plan) { ED.renderSettings(); S.bankSig = ''; ED.renderBank(true); }
  });
})();
