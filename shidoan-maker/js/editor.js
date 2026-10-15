/* 指導案メーカー：編集画面（左＝項目の一覧、中＝項目ごとの編集カード／印刷イメージ、右＝文例） */
(function () {
  const SD = window.SD;
  const U = SD.U;
  const UI = SD.ui;
  const { h, icon } = UI;
  const $ = (s, r = document) => r.querySelector(s);

  // ───────── 状態・変更・元に戻す ─────────
  const S = SD.S = {
    view: 'home', plan: null, mode: 'edit', target: null, undo: [], redo: [], lastEdit: { t: 0, k: '' },
    saveState: 'saved', zoom: 1, bankQ: '', bankSig: '', sideOpen: false, outlineOpen: false, hints: {},
    collapsed: new Set(), setOpen: null, tableView: {},
  };
  const ED = SD.ed = {};

  const pushHist = () => {
    S.undo.push(JSON.stringify(S.plan));
    if (S.undo.length > 120) S.undo.shift();
    S.redo.length = 0;
    SD.updateTopbarState && SD.updateTopbarState();
  };
  SD.pushHist = pushHist;
  // 形が変わる変更（項目のON/OFF・行の追加など）
  SD.act = (fn, o = {}) => {
    pushHist();
    fn(S.plan);
    SD.dirty();
    if (o.all) ED.render();
    else {
      if (o.card) [].concat(o.card).forEach((id) => ED.renderCard(id));
      if (o.settings) ED.renderSettings();
      if (o.outline !== false) ED.renderOutline();
      ED.refreshPreview();
    }
  };
  // 文字の入力（1.5秒以上あいたら、元に戻すの区切りをつくる）
  SD.textEdit = (key, fn) => {
    const now = Date.now();
    if (now - S.lastEdit.t > 1500 || S.lastEdit.k !== key) pushHist();
    S.lastEdit = { t: now, k: key };
    fn(S.plan);
    SD.dirty();
    ED.refreshPreviewSoon();
    ED.refreshOutlineSoon();
  };
  SD.undoAct = () => {
    if (!S.undo.length) return;
    S.redo.push(JSON.stringify(S.plan));
    S.plan = JSON.parse(S.undo.pop());
    S.lastEdit = { t: 0, k: '' };
    ED.render(); SD.dirty();
  };
  SD.redoAct = () => {
    if (!S.redo.length) return;
    S.undo.push(JSON.stringify(S.plan));
    S.plan = JSON.parse(S.redo.pop());
    S.lastEdit = { t: 0, k: '' };
    ED.render(); SD.dirty();
  };

  const findSec = (id) => S.plan.sections.find((s) => s.id === id);
  const secLabel = (s) => (s.kind === 'header' ? '表題・基本情報' : s.kind === 'pagebreak' ? '改ページ' : s.title || '（見出しなし）');

  // ───────── 全体 ─────────
  ED.render = () => {
    const oldFab = document.getElementById('bankFab'); if (oldFab) oldFab.remove();
    const main = $('#main');
    const oldCenter = $('#edCenter');
    const keep = oldCenter ? oldCenter.scrollTop : 0;
    main.innerHTML = '';
    main.className = 'view-edit';
    const outline = h('aside', { class: `ed-outline scroll-y ${S.outlineOpen ? 'open' : ''}`, id: 'edOutline', 'aria-label': '指導案の項目' });
    const center = h('section', { class: 'ed-center scroll-y', id: 'edCenter' });
    const side = h('aside', { class: `ed-side ${S.sideOpen ? 'open' : ''}`, id: 'edSide', 'aria-label': '文例' });
    if (S.mode === 'split' && window.innerWidth < 1100) S.mode = 'edit';
    const prev = S.mode === 'split' ? h('aside', { class: 'ed-prev', id: 'edPrev', 'aria-label': '仕上がり（印刷イメージ）' }) : null;
    const shell = h('div', { class: `ed mode-${S.mode}` }, outline, center, prev, side, h('div', { class: 'drawer-scrim', onClick: () => { S.sideOpen = false; S.outlineOpen = false; ED.syncDrawers(); } }));
    main.append(shell, h('datalist', { id: 'phaseList' }, SD.phaseNames.map((p) => h('option', { value: p }))));
    ED.renderOutline();
    ED.renderCenter();
    if (prev) ED.renderPrev();
    ED.renderBank(true);
    SD.renderTopbar();
    center.scrollTop = keep;
    // 幅が変わったら表の列幅を合わせなおす
    if (window.ResizeObserver) {
      if (ED.ro) ED.ro.disconnect();
      let lastW = center.clientWidth;
      const refit = U.debounce(() => {
        const w = center.clientWidth;
        if (Math.abs(w - lastW) < 24 || S.mode === 'preview') return;
        lastW = w;
        S.plan.sections.filter((s) => s.on && s.kind === 'table').forEach((s) => ED.renderCard(s.id));
      }, 180);
      ED.ro = new ResizeObserver(refit);
      ED.ro.observe(center);
    }
  };
  ED.syncDrawers = () => {
    const o = $('#edOutline'); const s = $('#edSide');
    if (o) o.classList.toggle('open', S.outlineOpen);
    if (s) s.classList.toggle('open', S.sideOpen);
    const sh = $('.ed'); if (sh) sh.classList.toggle('drawer-on', S.outlineOpen || S.sideOpen);
    ED.syncFab();
  };
  // せまい画面で文例のある欄にいるときだけ出す「文例」ボタン（押しても入力欄のフォーカスは外れない）
  ED.syncFab = () => {
    let fab = document.getElementById('bankFab');
    const want = S.view === 'edit' && S.target && S.target.bank && !S.sideOpen && ((S.mode === 'edit' && window.innerWidth <= 1180) || S.mode === 'split');
    if (!want) { if (fab) fab.remove(); return; }
    if (!fab) {
      fab = h('button', { id: 'bankFab', type: 'button', class: 'bank-fab', onClick: () => { S.sideOpen = true; S.outlineOpen = false; ED.syncDrawers(); } }, icon('book'), h('span', null, '文例'));
      fab.addEventListener('mousedown', (e) => e.preventDefault());
      document.body.append(fab);
    }
  };
  window.addEventListener('resize', U.debounce(() => ED.syncFab(), 150));

  // ───────── 左：項目の一覧 ─────────
  // 上＝指導案に入れている項目（番号・ドラッグで並べかえ・●○で書けているか）／下＝使っていない項目（クリックで入れる）
  const STATUS_TIP = { ok: '書けています', empty: 'まだ空です', ph: '「〇〇」など、書きかえる所が残っています' };
  ED.renderOutline = () => {
    const ol = $('#edOutline');
    if (!ol) return;
    const keep = ol.scrollTop;
    ol.innerHTML = '';
    const nums = SD.numbering(S.plan);
    const onSecs = S.plan.sections.filter((s) => s.on);
    const offSecs = S.plan.sections.filter((s) => !s.on);
    const stats = onSecs.map((s) => SD.secStatus(S.plan, s));
    const nEmpty = stats.filter((x) => x === 'empty').length;
    const nPh = stats.filter((x) => x === 'ph').length;
    const allClosed = onSecs.filter((s) => s.kind !== 'pagebreak').every((s) => S.collapsed.has(s.id));
    const head = h('div', { class: 'ol-h' },
      h('div', { class: 'ol-t' }, h('span', null, '指導案の項目'),
        h('button', { type: 'button', class: 'ol-fold', title: allClosed ? 'すべてのカードをひらく' : 'すべてのカードをたたむ', onClick: () => ED.foldAll(!allClosed) }, icon(allClosed ? 'down' : 'up'), allClosed ? 'ひらく' : 'たたむ')),
      h('button', { type: 'button', class: 'ol-pat', title: '様式パターンを変える・マイ様式として保存する', onClick: () => SD.openPatternDialog('pattern') }, icon('layout'), h('span', null, S.plan.patternName || '様式'), icon('down')),
      (nEmpty || nPh)
        ? h('button', { type: 'button', class: 'ol-next', title: 'まだ書けていない項目へ順にとびます（⌘J）', onClick: () => ED.gotoNextBlank() },
          h('span', { class: 'ol-next-l' }, nEmpty ? h('span', null, h('i', { class: 'dot st-empty' }), `空欄 ${nEmpty}`) : null, nPh ? h('span', null, h('i', { class: 'dot st-ph' }), `〇〇 ${nPh}`) : null),
          h('span', { class: 'ol-next-r' }, '次へ', icon('next')))
        : h('div', { class: 'ol-done' }, icon('check'), 'ぜんぶの項目が書けています'));
    const ul = h('ul', { class: 'ol-list' });
    onSecs.forEach((s, i) => {
      const active = S.target && S.target.secId === s.id;
      const st = stats[i];
      ul.append(h('li', { class: `ol-item lv${s.level} on k-${s.kind} ${active ? 'active' : ''}`, 'data-sid': s.id },
        h('span', { class: 'ol-grip', title: 'ドラッグで順番を変える' }, icon('grip')),
        s.kind === 'header' ? h('span', { class: 'ol-lock', title: '表題はいつも入ります' }) : h('input', {
          type: 'checkbox', checked: true, title: 'チェックを外すと指導案から外れます（中身は残ります）', 'aria-label': `${secLabel(s)}を指導案から外す`,
          onChange: () => { SD.act(() => { s.on = false; }, { all: true }); UI.toast(`「${secLabel(s)}」を外しました（下の「使っていない項目」にあります）`, { action: { label: '元に戻す', onClick: SD.undoAct } }); },
        }),
        h('button', { type: 'button', class: 'ol-name', onClick: () => { S.collapsed.delete(s.id); if (S.mode === 'edit' && !document.getElementById(`card-${s.id}`)) ED.renderCenter(); else ED.expandCard(s.id); ED.scrollToSection(s.id, true); if (window.innerWidth <= 820) { S.outlineOpen = false; ED.syncDrawers(); } } },
          h('span', { class: 'ol-num' }, (nums[s.id] || '').trim()), h('span', { class: 'ol-lab' }, secLabel(s)),
          st === 'na' ? null : h('i', { class: `dot st-${st}`, title: STATUS_TIP[st] })),
        h('button', { type: 'button', class: 'iconbtn ol-more', title: 'この項目の操作', 'aria-label': `${secLabel(s)}の操作`, onClick: (e) => ED.sectionMenu(s, e.currentTarget) }, icon('more'))));
    });
    // 見えている（入れている）項目だけで並べかえ → 全体の並びに反映
    UI.sortable(ul, 'li', '.ol-grip', (from, to) => SD.act((p) => {
      const mv = onSecs[from]; const ref = onSecs[to];
      if (!mv || !ref || mv === ref) return;
      p.sections.splice(p.sections.indexOf(mv), 1);
      let idx = p.sections.indexOf(ref);
      if (to > from) idx += 1;
      p.sections.splice(idx, 0, mv);
    }, { all: true }));
    const parts = [head, ul];
    if (offSecs.length) {
      const open = SD.prefs().olOffOpen !== false;
      const offBox = h('div', { class: `ol-off ${open ? 'open' : ''}` },
        h('button', { type: 'button', class: 'ol-off-h', 'aria-expanded': open ? 'true' : 'false', onClick: () => { SD.setPrefs({ olOffOpen: !open }); ED.renderOutline(); } },
          icon(open ? 'down' : 'next'), h('span', null, `使っていない項目（${offSecs.length}）`), h('small', null, 'クリックで入れる')));
      if (open) {
        offBox.append(h('div', { class: 'ol-off-list' }, offSecs.map((s) => h('button', {
          type: 'button', class: 'ol-off-item', title: `「${secLabel(s)}」を指導案に入れる${SD.hasContent(s) ? '（書いた中身が残っています）' : ''}`,
          onClick: () => { SD.act(() => { s.on = true; }, { all: true }); setTimeout(() => ED.scrollToSection(s.id, true), 30); },
        }, icon('plus'), h('span', null, secLabel(s)), SD.hasContent(s) ? h('i', { class: 'dot st-ok', title: '中身があります' }) : null))));
      }
      parts.push(offBox);
    }
    parts.push(h('button', { type: 'button', class: 'btn ol-add', onClick: (e) => ED.addSectionMenu(e.currentTarget) }, icon('plus'), h('span', null, '新しい項目を足す')),
      h('p', { class: 'ol-tip' }, '⋮⋮ をドラッグで順番を変えられます。', h('br'), '見出しの言葉はカードの上で変えられます。'));
    ol.append(...parts);
    ol.scrollTop = keep;
  };
  // まだ書けていない項目へ（いま編集中の項目の次から、ぐるっと一周さがす）
  ED.gotoNextBlank = () => {
    const onSecs = S.plan.sections.filter((s) => s.on);
    const cur = S.target && S.target.secId ? onSecs.findIndex((s) => s.id === S.target.secId) : -1;
    for (let k = 1; k <= onSecs.length; k += 1) {
      const s = onSecs[(cur + k) % onSecs.length];
      const st = SD.secStatus(S.plan, s);
      if (st === 'empty' || st === 'ph') {
        if (S.mode === 'preview') SD.setMode(SD.prefs().lastMode === 'split' && window.innerWidth >= 1100 ? 'split' : 'edit');
        S.collapsed.delete(s.id);
        ED.expandCard(s.id);
        setTimeout(() => {
          ED.scrollToSection(s.id, false);
          const card = document.getElementById(`card-${s.id}`);
          if (!card) return;
          const fields = [...card.querySelectorAll('.card-b textarea, .card-b .hd-vals input.inp')];
          let f = fields.find((x) => /〇〇|○○|〇[％%名人問点割]/.test(x.value)) || fields.find((x) => !x.value.trim()) || fields[0];
          if (f) {
            const m = f.value.match(/〇〇|○○|〇/);
            setTimeout(() => { ED.focusEl(f, null, true); if (m) f.setSelectionRange(m.index, m.index + m[0].length); }, 320);
          }
        }, 40);
        return;
      }
    }
    UI.toast('ぜんぶの項目が書けています');
  };
  // カードをたたむ・ひらく
  ED.expandCard = (id) => { if (S.collapsed.delete(id)) ED.renderCard(id); };
  ED.foldAll = (close) => {
    S.collapsed = new Set(close ? S.plan.sections.filter((s) => s.on && s.kind !== 'pagebreak').map((s) => s.id) : []);
    ED.renderCenter();
    ED.renderOutline();
  };

  ED.sectionMenu = (s, anchor) => {
    const i = S.plan.sections.indexOf(s);
    const move = (d) => SD.act((p) => { const j = i + d; if (j < 0 || j >= p.sections.length) return; p.sections.splice(i, 1); p.sections.splice(j, 0, s); }, { all: true });
    const items = [
      { label: '上へ', icon: 'up', onClick: () => move(-1), disabled: i === 0 },
      { label: '下へ', icon: 'down', onClick: () => move(1), disabled: i === S.plan.sections.length - 1 },
    ];
    if (!['header', 'pagebreak'].includes(s.kind)) {
      items.push({ sep: true });
      items.push(s.level === 1
        ? { label: '1段下げる（（１）の見出しにする）', icon: 'next', onClick: () => SD.act(() => { s.level = 2; }, { all: true }) }
        : { label: '1段上げる（１の見出しにする）', icon: 'left', onClick: () => SD.act(() => { s.level = 1; }, { all: true }) });
      items.push({ label: s.num === false ? '見出しに番号をつける' : '見出しの番号をつけない', icon: 'list', onClick: () => SD.act(() => { s.num = s.num === false; }, { all: true }) });
      items.push({ label: 'この項目の前で改ページ', icon: 'check', on: s.pb, onClick: () => SD.act(() => { s.pb = !s.pb; }, { card: s.id }) });
    }
    if (s.kind === 'table') items.push({ label: '列を選ぶ・名前を変える…', icon: 'cols', onClick: () => ED.colsDialog(s) });
    items.push({ sep: true });
    if (s.kind !== 'header') items.push({ label: '複製する', icon: 'dup', onClick: () => SD.act((p) => { const c = U.clone(s); c.id = U.uid(); if (c.rows) c.rows.forEach((r) => { r.id = U.uid(); }); p.sections.splice(i + 1, 0, c); }, { all: true }) });
    if (s.on && s.kind !== 'header') items.push({ label: '指導案から外す（中身は残す）', icon: 'eye', onClick: () => SD.act(() => { s.on = false; }, { all: true }) });
    if (s.kind !== 'header') {
      items.push({
        label: '削除する', icon: 'trash', danger: true,
        onClick: () => {
          SD.act((p) => { p.sections.splice(i, 1); }, { all: true });
          UI.toast(`「${secLabel(s)}」を削除しました`, { action: { label: '元に戻す', onClick: SD.undoAct } });
        },
      });
    }
    UI.menu(anchor, items, { alignRight: true });
  };

  ED.addSectionMenu = (anchor) => {
    const items = [];
    for (const grp of SD.sectionCatalog) {
      items.push({ head: grp.group });
      for (const k of grp.keys) {
        const d = SD.sectionDefs[k];
        const exist = S.plan.sections.find((s) => s.key === k);
        items.push({
          label: d.title, icon: exist && exist.on ? 'check' : 'plus',
          sub: exist && !d.multi ? (exist.on ? '（入っています・もう1つ追加）' : '（外してあります → 入れる）') : '',
          onClick: () => {
            if (exist && !exist.on && !d.multi) { SD.act(() => { exist.on = true; }, { all: true }); setTimeout(() => ED.scrollToSection(exist.id, true), 30); return; }
            ED.addSection(k);
          },
        });
      }
    }
    UI.menu(anchor, items, { cls: 'menu-tall' });
  };
  ED.addSection = (key) => {
    const ns = SD.makeSection(key, { on: true });
    const d = SD.sectionDefs[key];
    if (d.kind === 'table' && d.role === 'tenkai') {
      const pat = SD.patterns.find((p) => p.id === S.plan.patternId);
      const keys = (pat && pat.cols && pat.cols.tenkai) || ['dankai', 'jikan', 'katsudo', 'ryuiten'];
      ns.cols.forEach((c) => { c.on = keys.includes(c.key); });
    }
    if (d.kind === 'table' && d.role === 'plan') ns.cols.forEach((c) => { c.on = ['ji', 'naiyo', 'chi', 'shi', 'tai', 'kijun', 'hoho'].includes(c.key); });
    if (d.kind === 'table' && d.role === 'hyoka') ns.cols.forEach((c) => { c.on = ['kanten', 'kijun', 'hoho', 'c'].includes(c.key); });
    SD.act((p) => {
      // 入れる位置：いま編集中の項目のうしろ。なければ決まった順番の位置
      let at = -1;
      if (S.target && S.target.secId) at = p.sections.findIndex((s) => s.id === S.target.secId) + 1;
      if (at <= 0) {
        const ci = SD.canonOrder.indexOf(key);
        at = p.sections.length;
        if (ci >= 0) { const j = p.sections.findIndex((s) => SD.canonOrder.indexOf(s.key) > ci); if (j >= 0) at = j; }
      }
      const prev = p.sections[at - 1];
      if (prev && (prev.level === 2 || prev.key === 'honji' || prev.key === 'views') && !['header'].includes(key) && d.level === 2) ns.level = 2;
      else if (!d.level || d.level === 1) ns.level = 1;
      else ns.level = p.sections.some((s) => s.on && (s.key === 'honji' || s.key === 'views')) ? 2 : 1;
      p.sections.splice(at, 0, ns);
    }, { all: true });
    setTimeout(() => ED.scrollToSection(ns.id, true), 30);
  };

  ED.scrollToSection = (id, focus) => {
    if (S.mode === 'preview') {
      const el = document.querySelector(`#pvPaper [data-sid="${id}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    const card = document.getElementById(`card-${id}`);
    if (!card) return;
    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    card.classList.remove('flash'); void card.offsetWidth; card.classList.add('flash');
    if (focus) {
      const f = card.querySelector('.card-b textarea, .card-b input:not([type=checkbox])');
      if (f) setTimeout(() => ED.focusEl(f, null, true), 350);
    }
  };

  // ───────── 中：授業の設定 ─────────
  ED.renderSettings = () => {
    const old = $('#setBar');
    if (old) old.replaceWith(ED.settingsBar());
  };
  ED.settingsBar = () => {
    const m = S.plan.meta;
    const units = SD.unitsOf(m.grade);
    const known = units.some((u) => u.name === m.unit);
    const total = SD.totalHours(S.plan);
    const planSec = SD.secs(S.plan, 'plan').find((s) => s.rows.length);
    const naviOn = SD.navi.ok && SD.navi.lessonsFor(m.unit).length > 0;

    const gradeSel = h('select', { class: 'inp sm', 'aria-label': '学年', onChange: (e) => {
      const g = +e.target.value;
      SD.act((p) => { p.meta.grade = g; }, { settings: true, all: true });
    } }, [1, 2, 3].map((g) => h('option', { value: g, selected: +m.grade === g }, `中${g}`)));

    const unitSel = h('select', { class: 'inp', 'aria-label': '単元', onChange: async (e) => {
      const v = e.target.value;
      if (v === '__free') { SD.act((p) => { p.meta.unit = ''; }, { all: true }); setTimeout(() => { const f = $('#unitFree'); if (f) f.focus(); }, 50); return; }
      await ED.changeUnit(v);
    } },
      h('option', { value: '', selected: !m.unit }, '（単元を選ぶ）'),
      units.map((u) => h('option', { value: u.name, selected: u.name === m.unit }, u.name)),
      h('option', { value: '__free', selected: !!m.unit && !known }, 'その他（自由に入力）'));
    const unitFree = !known && m.unit !== undefined && (m.unit || unitSel.value === '__free')
      ? h('input', { id: 'unitFree', class: 'inp', value: m.unit, placeholder: '単元名', onInput: (e) => { SD.textEdit('unit', (p) => { p.meta.unit = e.target.value; }); ED.syncUnitName(); } })
      : null;

    const noInp = h('input', { class: 'inp xs', type: 'number', min: 1, max: 99, value: m.lessonNo, 'aria-label': '本時は第何時か', onChange: (e) => ED.changeLessonNo(U.num(e.target.value, 1)) });
    const totalEl = planSec
      ? h('span', { class: 'set-static', title: '指導計画の表の時数の合計' }, `全${total}時間`)
      : h('label', { class: 'set-inl' }, '全', h('input', { class: 'inp xs', type: 'number', min: 1, value: m.totalHours, 'aria-label': '全時数', onChange: (e) => SD.act((p) => { p.meta.totalHours = U.num(e.target.value, 0) || ''; }, { all: true }) }), '時間');
    const minInp = h('input', { class: 'inp xs', type: 'number', min: 10, max: 120, step: 5, value: m.minutes, 'aria-label': '授業時間（分）', onChange: (e) => SD.act((p) => { p.meta.minutes = U.num(e.target.value, 50) || 50; }, { all: true }) });
    const topicInp = h('input', { class: 'inp', value: m.topic, placeholder: '例：減法', 'aria-label': '本時の題材', onInput: (e) => { SD.textEdit('topic', (p) => { p.meta.topic = e.target.value; }); SD.updateTopbarState(); } });

    const fillBtn = UI.btn('単元の中身を入れる', () => ED.fillUnitAsk(), { cls: 'sm', icon: 'wand', title: '単元の目標・評価規準・単元観・指導計画などを入れる', disabled: !SD.unitByName(m.unit) });
    const lessonBtn = UI.btn('本時の下書き', (e) => ED.lessonMenu(e.currentTarget), { cls: 'sm', icon: 'spark', title: '本時の目標・評価・展開などの下書きを入れる' });

    // ふだんは1行の要約にしておく（単元が決まっていないときだけ最初から開く）
    if (S.setOpen == null) S.setOpen = !m.unit;
    if (!S.setOpen) {
      const no = U.num(m.lessonNo, 1);
      const step = (d) => h('button', { type: 'button', class: 'iconbtn set-step', title: d < 0 ? '前の時間にする' : '次の時間にする', 'aria-label': d < 0 ? '前の時間' : '次の時間', disabled: d < 0 ? no <= 1 : (total && no >= total), onClick: () => ED.changeLessonNo(no + d) }, icon(d < 0 ? 'left' : 'next'));
      return h('div', { class: 'setbar compact', id: 'setBar' },
        h('div', { class: 'set-sum' },
          h('span', { class: 'set-t' }, '授業'),
          h('span', { class: 'set-sum-v' }, `中${m.grade}`, h('b', null, m.unit || '（単元なし）')),
          h('span', { class: 'set-sum-no' }, step(-1), h('b', null, `第${no}時`), total ? h('small', null, `／全${total}`) : null, step(1)),
          h('span', { class: 'set-sum-v' }, `${m.minutes}分`),
          m.topic ? h('span', { class: 'set-sum-v topic', title: m.topic }, `題材：${m.topic}`) : null,
          h('button', { type: 'button', class: 'btn sm ghost set-edit', title: '学年・単元・本時・授業時間・題材を変える', onClick: () => { S.setOpen = true; ED.renderSettings(); } }, icon('edit'), h('span', null, '変える'))),
        h('div', { class: 'set-row acts' }, fillBtn, lessonBtn, naviOn ? h('span', { class: 'set-note' }, icon('book'), '中1 授業ナビのデータが使えます') : null));
    }

    return h('div', { class: 'setbar', id: 'setBar' },
      h('div', { class: 'set-t' }, '授業の設定', m.unit ? h('button', { type: 'button', class: 'btn sm ghost set-close', onClick: () => { S.setOpen = false; ED.renderSettings(); } }, icon('up'), h('span', null, 'たたむ')) : null),
      h('div', { class: 'set-row' },
        h('label', { class: 'set-f' }, h('span', null, '学年'), gradeSel),
        h('label', { class: 'set-f grow' }, h('span', null, '単元'), unitSel, unitFree),
        h('div', { class: 'set-f' }, h('span', null, '本時'), h('span', { class: 'set-inl' }, '第', noInp, '時', h('span', { class: 'set-of' }, '／'), totalEl)),
        h('label', { class: 'set-f' }, h('span', null, '授業'), h('span', { class: 'set-inl' }, minInp, '分')),
        h('label', { class: 'set-f grow' }, h('span', null, '本時の題材'), topicInp)),
      h('div', { class: 'set-row acts' }, fillBtn, lessonBtn,
        naviOn ? h('span', { class: 'set-note' }, icon('book'), '中1 授業ナビのデータが使えます') : null));
  };
  ED.syncUnitName = () => {
    document.querySelectorAll('[data-bind="unit"]').forEach((el) => { if (document.activeElement !== el) el.value = S.plan.meta.unit; });
  };

  ED.changeUnit = async (name) => {
    const u = SD.unitByName(name);
    SD.act((p) => { p.meta.unit = name; if (u) p.meta.grade = u.g; }, { all: true });
    if (!u) return;
    const hasAny = S.plan.sections.some((s) => ['unit_goal', 'unit_eval', 'tangenkan', 'plan'].includes(s.key) && SD.hasContent(s));
    const how = hasAny
      ? await UI.choose('単元の中身を入れますか？', `「${name}」の単元の目標・評価規準・単元観・指導計画などを入れます。すでに書いてある欄があります。`, [
        { label: '入れない', value: 'none' }, { label: '空の欄だけ入れる', value: 'empty' }, { label: 'すべて入れかえる', value: 'all', primary: true }])
      : 'all';
    if (!how || how === 'none') return;
    SD.act((p) => { SD.fillUnit(p, how === 'all'); p.meta.topic = ''; SD.fillLesson(p, how === 'all'); }, { all: true });
    UI.toast(`「${name}」の中身を入れました`, { action: { label: '元に戻す', onClick: SD.undoAct } });
  };
  ED.fillUnitAsk = async () => {
    const how = await UI.choose('単元の中身を入れる', `「${S.plan.meta.unit}」の単元の目標・評価規準・単元観・指導計画・つまずきを入れます。`, [
      { label: 'やめる', value: null }, { label: '空の欄だけ入れる', value: 'empty' }, { label: 'すべて入れかえる', value: 'all', primary: true }]);
    if (!how) return;
    SD.act((p) => SD.fillUnit(p, how === 'all'), { all: true });
    UI.toast('単元の中身を入れました', { action: { label: '元に戻す', onClick: SD.undoAct } });
  };
  ED.changeLessonNo = async (n) => {
    const m = S.plan.meta;
    const no = Math.max(1, Math.round(n));
    if (no === U.num(m.lessonNo, 1)) return;
    // 題材が「自動で入ったもの」なら、新しい時間の題材に変える（授業ナビがあればそちらの題材）
    const naviOf = (k) => (SD.navi.ok ? SD.navi.lessonsFor(m.unit).find((l) => l.no === k) : null);
    const autoTopic = (p, k) => { const nl = naviOf(k); return nl ? SD.navi.topicOf(nl) : SD.topicFor(p, k).replace(/（.*?）/g, ''); };
    const oldAuto = new Set([autoTopic(S.plan, U.num(m.lessonNo, 1)), SD.topicFor(S.plan, U.num(m.lessonNo, 1)).replace(/（.*?）/g, '')]);
    SD.act((p) => {
      p.meta.lessonNo = no;
      const t = autoTopic(p, no);
      if (t && (!p.meta.topic || oldAuto.has(p.meta.topic))) p.meta.topic = t;
    }, { all: true });
    // 本時の中身がすでにあって、新しい時間の下書きが作れるなら、入れかえるか聞く
    const navi = naviOf(no);
    const canDraft = navi || SD.unitByName(m.unit);
    const hasHonji = S.plan.sections.some((s) => s.on && ['honji_goal', 'tenkai', 'honji_eval', 'board'].includes(s.key) && SD.hasContent(s));
    if (!canDraft || !hasHonji) return;
    const how = await UI.choose(`第${no}時の内容に入れかえますか？`, `本時の目標・評価・${navi ? '展開・板書' : '展開'}を、第${no}時（${S.plan.meta.topic || ''}）の下書きに入れかえます。単元の部分（単元観・指導計画など）はそのままです。`, [
      { label: '番号だけ変える', value: 'no' }, { label: '入れかえる', value: 'yes', primary: true }]);
    if (how !== 'yes') return;
    SD.act((p) => {
      if (navi) { SD.navi.alignPlan(p); SD.navi.applyLesson(p, navi, true); return; }
      SD.fillLesson(p, true);
      const ten = SD.sec(p, 'tenkai');
      if (ten && ten.flowId) SD.applyFlow(p, ten.flowId, 'replace');
    }, { all: true });
    UI.toast(`第${no}時の下書きに入れかえました`, { action: { label: '元に戻す', onClick: SD.undoAct } });
  };
  ED.lessonMenu = (anchor) => {
    const m = S.plan.meta;
    const items = [
      { label: 'この時間に合わせて、目標・評価・めあてを入れる', icon: 'wand', sub: '空の欄だけ埋めます', onClick: () => { SD.act((p) => SD.fillLesson(p, false), { all: true }); UI.toast('本時の目標・評価などを入れました', { action: { label: '元に戻す', onClick: SD.undoAct } }); } },
      { label: '展開の型を入れる…', icon: 'list', sub: '基本型・問題解決型・講義演習型など', onClick: () => ED.flowDialog() },
    ];
    const lessons = SD.navi.ok ? SD.navi.lessonsFor(m.unit) : [];
    if (lessons.length) {
      const cur = lessons.find((l) => l.no === U.num(m.lessonNo, 0));
      items.push({ sep: true }, { head: '中1 授業ナビから' });
      if (cur) items.push({ label: `第${cur.no}時「${cur.title}」を下書きにする`, icon: 'book', sub: '目標・課題・問題・展開・板書を入れかえます', onClick: () => ED.applyNavi(cur) });
      items.push({ label: 'ほかの時間を選んで下書きにする…', icon: 'book', onClick: () => ED.naviDialog() });
      items.push({ label: '指導計画を「1時間1行」にする', icon: 'list', sub: `授業ナビの${lessons.length}時間分`, onClick: () => ED.naviPlanRows() });
    }
    UI.menu(anchor, items);
  };
  ED.applyNavi = (l) => {
    let aligned = false;
    SD.act((p) => { aligned = SD.navi.alignPlan(p); SD.navi.applyLesson(p, l, true); }, { all: true });
    UI.toast(`授業ナビ 第${l.no}時の内容を下書きに入れました${aligned ? '（指導計画も授業ナビの1時間1行にそろえました）' : ''}`, { action: { label: '元に戻す', onClick: SD.undoAct }, ms: 6000 });
  };
  ED.naviPlanRows = () => {
    const rows = SD.navi.planRows(S.plan.meta.unit);
    if (!rows.length) return;
    SD.act((p) => { for (const s of SD.secs(p, 'plan')) s.rows = U.clone(rows).map((r) => Object.assign(r, { id: U.uid() })); p.meta.totalHours = rows.length; }, { all: true });
    UI.toast(`指導計画を${rows.length}時間分の行にしました`, { action: { label: '元に戻す', onClick: SD.undoAct } });
  };
  ED.naviDialog = () => {
    const lessons = SD.navi.lessonsFor(S.plan.meta.unit);
    const list = h('div', { class: 'navi-list' }, lessons.map((l) => h('button', {
      type: 'button', class: `navi-item ${l.no === U.num(S.plan.meta.lessonNo, 0) ? 'on' : ''}`,
      onClick: () => { m.close(); ED.applyNavi(l); },
    }, h('b', null, `第${l.no}時`), h('span', null, l.title), h('small', null, l.sub || ''))));
    const m = UI.modal({ title: '授業ナビから本時を選ぶ', sub: `${S.plan.meta.unit}（${lessons.length}時間）`, body: list, cls: 'md' });
  };

  ED.flowDialog = () => {
    const sec = SD.sec(S.plan, 'tenkai');
    if (!sec) { UI.toast('「本時の展開」の項目がありません。左の「項目を追加」から入れてください。'); return; }
    let pick = sec.flowId || (SD.patterns.find((p) => p.id === S.plan.patternId) || {}).flow || 'kihon';
    const total = U.num(S.plan.meta.minutes, 50) || 50;
    const cards = h('div', { class: 'flow-grid' });
    const draw = () => {
      cards.innerHTML = '';
      for (const f of SD.flows) {
        const mins = SD.scaleMinutes(f.rows.map((r) => r.m), total);
        const bar = h('div', { class: 'flow-bar' }, f.rows.map((r, i) => h('span', { class: `fb pg-${pgClass(r.p)}`, style: `flex:${mins[i]}`, title: `${r.p} ${mins[i]}分：${r.katsudo}` })));
        cards.append(h('button', { type: 'button', class: `flow-card ${pick === f.id ? 'on' : ''}`, onClick: () => { pick = f.id; draw(); } },
          h('div', { class: 'fc-t' }, f.name, h('small', null, f.sub)), bar, h('p', null, f.desc),
          h('ol', { class: 'fc-rows' }, f.rows.map((r, i) => h('li', null, h('b', null, `${r.p}`), ` ${mins[i]}分　${r.katsudo}`)))));
      }
    };
    draw();
    UI.modal({
      title: '展開の型を入れる', sub: `本時の展開の行をひな形で入れます（${total}分に合わせて時間を配分）。題材の「${S.plan.meta.topic || '〇〇'}」が文に入ります。`,
      body: cards, cls: 'lg',
      actions: [
        { label: 'やめる' },
        { label: '今の行の後ろに足す', onClick: () => { SD.act((p) => SD.applyFlow(p, pick, 'append'), { all: true }); } },
        { label: '入れかえる', primary: true, onClick: () => { SD.act((p) => SD.applyFlow(p, pick, 'replace'), { all: true }); UI.toast('展開の型を入れました', { action: { label: '元に戻す', onClick: SD.undoAct } }); } },
      ],
    });
  };

  // ───────── 中：カード ─────────
  ED.renderCenter = () => {
    const c = $('#edCenter');
    if (!c) return;
    c.innerHTML = '';
    c.append(ED.settingsBar());
    if (S.mode === 'preview') { c.append(ED.previewPane()); return; }
    const cards = h('div', { class: 'cards', id: 'edCards' });
    for (const s of S.plan.sections) if (s.on) cards.append(ED.card(s));
    cards.append(h('div', { class: 'cards-end' },
      h('button', { type: 'button', class: 'btn', onClick: (e) => ED.addSectionMenu(e.currentTarget) }, icon('plus'), h('span', null, '項目を追加')),
      h('button', { type: 'button', class: 'btn', onClick: () => SD.setMode('preview') }, icon('eye'), h('span', null, '印刷イメージを見る'))));
    c.append(cards);
    UI.autosizeAll(cards);
  };
  ED.renderCard = (id) => {
    const old = document.getElementById(`card-${id}`);
    const s = findSec(id);
    if (!old || !s) return;
    const focused = document.activeElement && old.contains(document.activeElement) ? document.activeElement.dataset.path : null;
    const nu = ED.card(s);
    old.replaceWith(nu);
    UI.autosizeAll(nu);
    if (focused) { const f = nu.querySelector(`[data-path="${CSS.escape(focused)}"]`); if (f) f.focus({ preventScroll: true }); }
  };
  // すべてのカードの番号だけ更新
  ED.refreshNumbers = () => {
    const nums = SD.numbering(S.plan);
    document.querySelectorAll('.card[data-sid]').forEach((c) => { const n = c.querySelector('.card-num'); if (n) n.textContent = (nums[c.dataset.sid] || '').trim(); });
  };

  const pgClass = (phase) => ({ 導入: 'a', 展開: 'b', まとめ: 'c' }[SD.phaseGroupOf(phase)] || 'x');

  ED.card = (s) => {
    const nums = SD.numbering(S.plan);
    const def = SD.sectionDefs[s.key] || {};
    const el = h('article', { class: `card k-${s.kind} lv${s.level} ${s.pb ? 'has-pb' : ''}`, id: `card-${s.id}`, 'data-sid': s.id });
    if (s.kind === 'pagebreak') {
      el.append(h('div', { class: 'pb-card' }, h('span', null, 'ここで改ページ'), ED.cardTools(s)));
      return el;
    }
    const titleEl = s.kind === 'header'
      ? h('div', { class: 'card-t0' }, '表題・基本情報')
      : h('input', {
        class: 'card-title', value: s.title, 'aria-label': '見出し', 'data-path': `${s.id}:title`, title: '見出しの文字は自由に変えられます',
        onInput: (e) => { SD.textEdit(`title:${s.id}`, () => { s.title = e.target.value; }); const lab = document.querySelector(`.ol-item[data-sid="${s.id}"] .ol-lab`); if (lab) lab.textContent = e.target.value; },
        onFocus: () => ED.setTarget(null, s),
      });
    const closed = S.collapsed.has(s.id);
    const fold = h('button', { type: 'button', class: 'iconbtn card-fold', title: closed ? 'ひらく' : 'たたむ', 'aria-label': closed ? 'カードをひらく' : 'カードをたたむ', 'aria-expanded': closed ? 'false' : 'true',
      onClick: () => { if (closed) S.collapsed.delete(s.id); else S.collapsed.add(s.id); ED.renderCard(s.id); ED.renderOutline(); } }, icon(closed ? 'next' : 'down'));
    const head = h('header', { class: 'card-h' },
      fold,
      s.kind === 'header' ? null : h('span', { class: 'card-num' }, (nums[s.id] || '').trim()),
      titleEl,
      s.pb ? h('span', { class: 'badge' }, '改ページ') : null,
      ED.cardTools(s, def));
    el.append(head);
    if (closed) {
      el.classList.add('closed');
      el.append(h('button', { type: 'button', class: 'card-sum', title: 'クリックでひらく', onClick: () => { S.collapsed.delete(s.id); ED.renderCard(s.id); ED.renderOutline(); } }, ED.summary(s)));
      return el;
    }
    if (def.hint && S.hints[s.key]) el.append(h('div', { class: 'card-hint' }, def.hint));
    const body = h('div', { class: 'card-b' });
    switch (s.kind) {
      case 'header': body.append(ED.headerBody(s)); break;
      case 'heading': body.append(ED.headingBody(s)); break;
      case 'text': body.append(ED.textBody(s, def)); break;
      case 'list': body.append(ED.listBody(s, def)); break;
      case 'kanten': body.append(ED.kantenBody(s)); break;
      case 'table': body.append(ED.tableBody(s)); break;
      case 'board': body.append(ED.boardBody(s)); break;
      default: break;
    }
    el.append(body);
    return el;
  };
  // たたんだカードに出す1行の要約
  ED.summary = (s) => {
    const cut = (t, n = 70) => { const x = String(t || '').replace(/\s+/g, ' ').trim(); return x.length > n ? `${x.slice(0, n)}…` : x; };
    switch (s.kind) {
      case 'header': return cut(`${SD.docTitle(S.plan)}／${s.lines.filter((l) => l.on).map((l) => `${l.label} ${SD.headerValue(S.plan, l) || '（未記入）'}`).join('・')}`);
      case 'text': return cut(s.bind === 'unit' || s.key === 'unit_name' ? S.plan.meta.unit : s.text) || '（まだ空です）';
      case 'list': { const it = s.items.filter(U.nonEmpty); return it.length ? `${it.length}つ：${cut(it[0], 56)}` : '（まだ空です）'; }
      case 'kanten': return ['chi', 'shi', 'tai'].map((k) => `${SD.KSHORT[k]} ${U.lines(s.f[k]).filter((l) => l.trim()).length}つ`).join('・');
      case 'board': return cut(s.parts.map((p) => U.lines(p.text).filter((l) => l.trim())[0] || '').filter(Boolean).join('／')) || '（まだ空です）';
      case 'table': {
        if (s.role === 'tenkai') { const sum = s.rows.reduce((a, r) => a + U.num(r.min, 0), 0); return `${s.rows.length}行・合計${sum}分／${S.plan.meta.minutes}分　${cut(s.rows.map((r) => r.phase).filter((v, i, a) => v && a.indexOf(v) === i).join('→'), 40)}`; }
        if (s.role === 'plan') return `${s.rows.length}行・全${SD.totalHours(S.plan)}時間・本時は第${S.plan.meta.lessonNo}時`;
        return `${s.rows.length}行`;
      }
      case 'heading': return '見出しだけの項目';
      default: return '';
    }
  };
  ED.cardTools = (s, def = {}) => h('div', { class: 'card-tools' },
    def.hint ? h('button', { type: 'button', class: `iconbtn ${S.hints[s.key] ? 'on' : ''}`, title: '書き方のヒント', 'aria-label': '書き方のヒント', onClick: () => { S.hints[s.key] = !S.hints[s.key]; ED.renderCard(s.id); } }, icon('help')) : null,
    h('button', { type: 'button', class: 'iconbtn', title: '指導案から外す（中身は残ります）', 'aria-label': '指導案から外す', onClick: () => { SD.act(() => { s.on = false; }, { all: true }); UI.toast(`「${secLabel(s)}」を外しました（左の一覧でチェックすると戻ります）`, { action: { label: '元に戻す', onClick: SD.undoAct } }); }, disabled: s.kind === 'header' }, icon('eye')),
    h('button', { type: 'button', class: 'iconbtn', title: 'この項目の操作', 'aria-label': 'この項目の操作', onClick: (e) => ED.sectionMenu(s, e.currentTarget) }, icon('more')));

  // 入力欄（textarea）を作る共通部品
  function area(o) {
    const ta = h('textarea', {
      class: `ta ${o.cls || ''}`, rows: o.rows || 1, placeholder: o.ph || '', value: o.value || '', 'data-path': o.path, 'aria-label': o.aria || o.ph || '',
      'data-bind': o.bind || null, spellcheck: 'false',
    });
    ta.addEventListener('input', (e) => {
      SD.textEdit(o.path, () => o.set(ta.value)); UI.autosize(ta); if (o.after) o.after(ta.value);
      if (!e.isComposing) ED.updateSuggest(ta);
    });
    ta.addEventListener('compositionend', () => setTimeout(() => ED.updateSuggest(ta), 0));
    ta.addEventListener('focus', () => ED.setTarget(Object.assign({ el: ta, path: o.path }, o.target || {}), o.sec));
    ta.addEventListener('blur', () => setTimeout(() => { if (SG.el === ta && document.activeElement !== ta) ED.hideSuggest(); }, 120));
    // 候補の箱・〇へのジャンプを先に処理する（処理したら、ほかのキー操作は動かさない）
    ta.addEventListener('keydown', (e) => { if (ED.suggestKey(e, ta)) { e.preventDefault(); e.stopImmediatePropagation(); } });
    if (o.onKey) ta.addEventListener('keydown', (e) => o.onKey(e, ta));
    return ta;
  }
  ED.area = area;

  // ───────── 書いている途中に文例の候補を出す ─────────
  // 例：「机間」と打つと「机間指導で考えを把握し…」が出る。Tab で入れる・↑↓で選ぶ・Esc で閉じる。
  const SG = { box: null, list: [], idx: 0, el: null, from: 0, to: 0, explicit: false, mute: false };
  const PH_RE = /〇〇|○○|〇|～|〜/;
  ED.hideSuggest = () => { if (SG.box) SG.box.remove(); SG.box = null; SG.list = []; SG.el = null; SG.explicit = false; };
  ED.updateSuggest = (el) => {
    if (SG.mute) { SG.mute = false; return; }
    const t = S.target;
    if (SD.prefs().suggest === false || !t || !t.bank || t.el !== el || el.selectionStart !== el.selectionEnd) { ED.hideSuggest(); return; }
    const v = el.value; const caret = el.selectionStart;
    const ls = v.lastIndexOf('\n', caret - 1) + 1;
    let from = ls;
    const lead = v.slice(ls, caret).match(/^([\s　・○◎●◆◇■□☆★※]|[ＴＳTS][：:])*/);
    if (lead) from += lead[0].length;
    if (t.mode === 'sentence') { const k = v.lastIndexOf('。', caret - 1); if (k + 1 > from) from = k + 1; }
    if (t.mode === 'word') { const k = Math.max(v.lastIndexOf('、', caret - 1), v.lastIndexOf('・', caret - 1)); if (k + 1 > from) from = k + 1; }
    const q = v.slice(from, caret).trim();
    if (q.length < 2) { ED.hideSuggest(); return; }
    const seen = new Set(); const hits = [];
    for (const g of SD.getBank(S.plan, t)) {
      for (const it of g.items) {
        const txt = SD.fillPh(S.plan, it.t);
        if (seen.has(txt) || txt === q) continue;
        seen.add(txt);
        const at = txt.indexOf(q);
        if (at >= 0) hits.push({ txt, raw: it.t, sub: it.sub || g.name, at });
      }
    }
    if (!hits.length) { ED.hideSuggest(); return; }
    hits.sort((a, b) => (a.at === 0 ? 0 : 1) - (b.at === 0 ? 0 : 1) || a.at - b.at);
    SG.list = hits.slice(0, 6); SG.el = el; SG.from = from; SG.to = caret; SG.q = q;
    if (!SG.explicit) SG.idx = 0;
    SG.idx = Math.min(SG.idx, SG.list.length - 1);
    ED.drawSuggest();
  };
  ED.drawSuggest = () => {
    if (!SG.box) {
      SG.box = h('div', { class: 'sug', role: 'listbox', 'aria-label': '文例の候補' });
      document.body.append(SG.box);
    }
    const box = SG.box;
    box.innerHTML = '';
    box.append(h('div', { class: 'sug-h' }, '文例の候補', h('span', null, h('kbd', null, 'Tab'), 'で入れる　', h('kbd', null, '↑↓'), 'で選ぶ　', h('kbd', null, 'Esc'), 'で閉じる')));
    SG.list.forEach((c, i) => {
      const it = h('div', { class: `sug-i ${i === SG.idx ? 'on' : ''}`, role: 'option', 'aria-selected': i === SG.idx ? 'true' : 'false' },
        h('span', { class: 'sug-t' }, c.txt.slice(0, c.at), h('mark', null, c.txt.slice(c.at, c.at + SG.q.length)), c.txt.slice(c.at + SG.q.length)),
        c.sub ? h('small', null, c.sub) : null);
      it.addEventListener('mousedown', (e) => { e.preventDefault(); ED.acceptSuggest(i); });
      box.append(it);
    });
    const r = SG.el.getBoundingClientRect();
    const w = Math.min(520, Math.max(300, r.width));
    let left = Math.min(r.left, window.innerWidth - w - 8);
    let top = r.bottom + 4;
    box.style.width = `${w}px`; box.style.left = `${Math.max(8, left)}px`; box.style.top = `${top}px`;
    const bh = box.offsetHeight;
    if (top + bh > window.innerHeight - 8) box.style.top = `${Math.max(8, r.top - bh - 4)}px`;
  };
  ED.acceptSuggest = (i) => {
    const c = SG.list[i]; const el = SG.el;
    if (!c || !el) return;
    const v = el.value;
    const nv = v.slice(0, SG.from) + c.txt + v.slice(SG.to);
    const end = SG.from + c.txt.length;
    ED.hideSuggest();
    SG.mute = true;
    el.value = nv;
    el.setSelectionRange(end, end);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    SG.mute = false;
    UI.autosize(el);
    ED.selectPlaceholder(el, SG.from, end);
  };
  // 入れた文の中の「〇」「〜」を選んでおく（そのまま打てば書きかわる）
  ED.selectPlaceholder = (el, from, to) => {
    const seg = el.value.slice(from, to);
    const m = seg.match(PH_RE);
    if (!m) return false;
    el.setSelectionRange(from + m.index, from + m.index + m[0].length);
    if (!SD.prefs().phTip) { SD.setPrefs({ phTip: true }); UI.toast('「〇」「〜」を選んであります。そのまま打つと書きかわります（Tabで次の〇へ）', { ms: 5000 }); }
    return true;
  };
  // キー操作：候補の箱が出ているとき → ↑↓・Tab・Enter・Esc／出ていないとき → Tab で次の〇へ
  ED.suggestKey = (e, el) => {
    if (e.isComposing || e.keyCode === 229) return false;
    const open = SG.box && SG.el === el && SG.list.length;
    if (open) {
      if (e.key === 'ArrowDown') { SG.idx = (SG.idx + 1) % SG.list.length; SG.explicit = true; ED.drawSuggest(); return true; }
      if (e.key === 'ArrowUp') { SG.idx = (SG.idx - 1 + SG.list.length) % SG.list.length; SG.explicit = true; ED.drawSuggest(); return true; }
      if (e.key === 'Tab' && !e.shiftKey) { ED.acceptSuggest(SG.idx); return true; }
      if (e.key === 'Enter' && SG.explicit && !e.shiftKey && !e.metaKey && !e.ctrlKey) { ED.acceptSuggest(SG.idx); return true; }
      if (e.key === 'Escape') { ED.hideSuggest(); return true; }
      if (['ArrowLeft', 'ArrowRight', 'Home', 'End', 'Enter'].includes(e.key)) ED.hideSuggest();
      return false;
    }
    if (e.key === 'Tab' && !e.shiftKey && !e.metaKey && !e.ctrlKey && !e.altKey) {
      const v = el.value; const at = el.selectionEnd;
      const m = v.slice(at).match(PH_RE);
      if (m) { el.setSelectionRange(at + m.index, at + m.index + m[0].length); return true; }
    }
    return false;
  };
  document.addEventListener('scroll', () => ED.hideSuggest(), true);
  window.addEventListener('resize', () => ED.hideSuggest());

  // 表題・基本情報
  ED.headerBody = (s) => {
    const m = S.plan.meta;
    const wrap = h('div', { class: 'hd' });
    const titleInp = h('input', {
      class: 'inp hd-title', value: s.docTitle || '', placeholder: SD.docTitle(Object.assign({}, S.plan, { sections: S.plan.sections.map((x) => (x === s ? Object.assign({}, x, { docTitle: '' }) : x)) })),
      'aria-label': '表題', 'data-path': `${s.id}:docTitle`,
      onInput: (e) => SD.textEdit(`${s.id}:docTitle`, () => { s.docTitle = e.target.value; }),
      onFocus: () => ED.setTarget(null, s),
    });
    wrap.append(h('div', { class: 'hd-row' }, h('span', { class: 'hd-lab' }, '表題'), titleInp, h('span', { class: 'hd-note' }, '空欄なら学年・組・教科から自動')));
    const inp = (key, o = {}) => h('input', {
      class: `inp ${o.cls || ''}`, value: m[key] ?? '', placeholder: o.ph || '', type: o.type || 'text', 'aria-label': o.aria || key, 'data-path': `meta:${key}`, 'data-bind': key === 'unit' ? 'unit' : null, min: o.min,
      onInput: (e) => { SD.textEdit(`meta:${key}`, (p) => { p.meta[key] = e.target.value; }); if (o.after) o.after(e.target.value); },
      onFocus: () => ED.setTarget(null, s),
    });
    const datePick = h('input', { type: 'date', class: 'date-pick', 'aria-label': 'カレンダーから選ぶ', title: 'カレンダーから選ぶ',
      onChange: (e) => { const v = ED.wareki(e.target.value); if (!v) return; SD.act((p) => { p.meta.date = v; }, { card: s.id }); } });
    const valueEditor = (l) => {
      switch (l.k) {
        case 'date': return h('div', { class: 'hd-vals' }, inp('date', { ph: '令和8年10月15日（木）', cls: 'grow', aria: '日付' }), h('label', { class: 'date-btn', title: 'カレンダーから選ぶ' }, '📅', datePick),
          h('span', { class: 'set-inl' }, '第', h('select', { class: 'inp xs', 'aria-label': '校時', onChange: (e) => SD.act((p) => { p.meta.period = e.target.value; }, { card: s.id }) }, ['', 1, 2, 3, 4, 5, 6, 7].map((v) => h('option', { value: v, selected: String(m.period) === String(v) }, v === '' ? '−' : v))), '校時'));
        case 'place': return h('div', { class: 'hd-vals' }, inp('place', { ph: '1年2組教室', cls: 'grow', aria: '場所' }));
        case 'klass': return h('div', { class: 'hd-vals' }, h('span', { class: 'set-inl' }, `第${m.grade}学年`, inp('klass', { cls: 'xs', ph: '2', aria: '組' }), '組'),
          h('span', { class: 'set-inl' }, '男子', inp('boys', { cls: 'xs', ph: '16', aria: '男子の人数', type: 'number', min: 0 }), '名'),
          h('span', { class: 'set-inl' }, '女子', inp('girls', { cls: 'xs', ph: '16', aria: '女子の人数', type: 'number', min: 0 }), '名'));
        case 'teacher': return h('div', { class: 'hd-vals' }, inp('teacher', { ph: '授業者の名前', cls: 'grow', aria: '授業者', after: (v) => SD.setPrefs({ teacher: v }) }));
        case 'school': return h('div', { class: 'hd-vals' }, inp('school', { ph: '〇〇市立〇〇中学校', cls: 'grow', aria: '学校名', after: (v) => SD.setPrefs({ school: v }) }));
        case 'unit': return h('div', { class: 'hd-vals' }, inp('unit', { ph: '単元名', cls: 'grow', aria: '単元名', after: () => ED.syncUnitName() }));
        case 'position': return h('div', { class: 'hd-vals' }, h('span', { class: 'hd-auto' }, SD.headerValue(S.plan, l) || '（授業の設定の「本時」から自動）'));
        case 'custom': return h('div', { class: 'hd-vals' }, h('input', { class: 'inp grow', value: l.v || '', placeholder: '内容', 'aria-label': `${l.label}の内容`, onInput: (e) => SD.textEdit(`hd:${s.id}:${s.lines.indexOf(l)}`, () => { l.v = e.target.value; }) }));
        default: return h('span');
      }
    };
    // 入れている行だけ並べる。外した行は下の「行を足す」から戻す
    const list = h('div', { class: 'hd-lines' });
    const onLines = s.lines.filter((l) => l.on);
    onLines.forEach((l) => {
      const i = s.lines.indexOf(l);
      list.append(h('div', { class: 'hd-line on' },
        h('span', { class: 'hd-grip', title: 'ドラッグで順番を変える' }, icon('grip')),
        h('input', { class: 'inp hd-lab-inp', value: l.label, 'aria-label': '行の名前', title: '行の名前（例：授業者→指導者）', onInput: (e) => SD.textEdit(`hdl:${s.id}:${i}`, () => { l.label = e.target.value; }) }),
        valueEditor(l),
        h('button', { type: 'button', class: 'iconbtn', 'aria-label': `${l.label}の行を外す`, title: l.k === 'custom' ? 'この行を消す' : 'この行を表題から外す（下の「行を足す」で戻せます）', onClick: () => SD.act(() => { if (l.k === 'custom') s.lines.splice(s.lines.indexOf(l), 1); else l.on = false; }, { card: s.id }) }, icon('x'))));
    });
    UI.sortable(list, '.hd-line', '.hd-grip', (from, to) => SD.act(() => {
      const mv = onLines[from]; const ref = onLines[to];
      if (!mv || !ref || mv === ref) return;
      s.lines.splice(s.lines.indexOf(mv), 1);
      let idx = s.lines.indexOf(ref);
      if (to > from) idx += 1;
      s.lines.splice(idx, 0, mv);
    }, { card: s.id }));
    const offLines = s.lines.filter((l) => !l.on);
    const add = h('div', { class: 'hd-add' }, h('span', { class: 'hd-add-l' }, '行を足す'),
      offLines.map((l) => h('button', { type: 'button', class: 'chip', onClick: () => SD.act(() => {
        // ふつうの並び（日時・場所・学級…）の位置に戻す
        const order = SD.headerLines.map((x) => x.k);
        const ci = (k) => { const x = order.indexOf(k); return x < 0 ? 999 : x; };
        s.lines.splice(s.lines.indexOf(l), 1);
        l.on = true;
        let at = -1;
        s.lines.forEach((x, j) => { if (x.on && ci(x.k) < ci(l.k)) at = j; });
        s.lines.splice(at + 1, 0, l);
      }, { card: s.id }) }, icon('plus'), l.label)),
      h('button', { type: 'button', class: 'chip ghost', onClick: () => SD.act(() => { s.lines.push({ k: 'custom', label: '指導助言者', v: '', on: true }); }, { card: s.id }) }, icon('plus'), '自由な行（指導助言者など）'),
      h('span', { class: 'grow' }),
      h('label', { class: 'set-inl hd-align' }, '並べ方', h('select', { class: 'inp sm', onChange: (e) => SD.act(() => { s.align = e.target.value; }, { card: s.id }) },
        h('option', { value: 'right', selected: s.align !== 'left' }, '右に寄せる'), h('option', { value: 'left', selected: s.align === 'left' }, '左に寄せる'))));
    wrap.append(list, add);
    return wrap;
  };
  ED.wareki = (iso) => {
    const d = new Date(`${iso}T00:00:00`);
    if (Number.isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const era = y >= 2019 ? `令和${y - 2018 === 1 ? '元' : y - 2018}年` : `平成${y - 1988}年`;
    return `${era}${d.getMonth() + 1}月${d.getDate()}日（${'日月火水木金土'[d.getDay()]}）`;
  };

  ED.headingBody = (s) => {
    const wrap = h('div', { class: 'heading-b' });
    if (s.key === 'honji') {
      wrap.append(h('label', { class: 'chk' }, h('input', { type: 'checkbox', checked: !!(s.opts && s.opts.pos), onChange: (e) => SD.act(() => { s.opts.pos = e.target.checked; }, { card: s.id }) }), `見出しに本時の位置をつける（例：本時の学習（${S.plan.meta.lessonNo}／${SD.totalHours(S.plan) || '○'}時））`));
    } else wrap.append(h('p', { class: 'muted' }, '見出しだけの項目です。下の項目を「1段下げる」と、この見出しの中の（１）（２）…になります。'));
    return wrap;
  };

  ED.textBody = (s, def) => {
    const bound = s.bind === 'unit' || s.key === 'unit_name';
    const wrap = h('div', { class: 'text-b' });
    const bank = def.bank || `free_${s.key}`;
    const ta = area({
      sec: s, path: `${s.id}:text`, value: bound ? S.plan.meta.unit : s.text, rows: bound ? 1 : 3, bind: bound ? 'unit' : null,
      ph: bound ? '単元名（授業の設定の単元と同じになります）' : placeholderFor(s),
      set: (v) => { if (bound) S.plan.meta.unit = v; else s.text = v; },
      after: () => { if (bound) { const f = $('#unitFree'); if (f) f.value = S.plan.meta.unit; } count.textContent = `${(bound ? S.plan.meta.unit : s.text).length}字`; },
      target: { bank: bound ? null : bank, mode: def.sep ? 'word' : 'sentence', sep: def.sep, ctx: s.title },
    });
    const count = h('span', { class: 'count' }, `${(bound ? S.plan.meta.unit : s.text || '').length}字`);
    wrap.append(ta, h('div', { class: 'card-foot' },
      bound ? null : h('button', { type: 'button', class: 'btn sm ghost', onClick: () => { ta.focus(); ED.openSide(); } }, icon('book'), h('span', null, '文例')),
      h('label', { class: 'chk' }, h('input', { type: 'checkbox', checked: !!s.inline, onChange: (e) => SD.act(() => { s.inline = e.target.checked; }, { card: s.id }) }), '見出しと同じ行に書く'),
      h('span', { class: 'grow' }), count));
    return wrap;
  };
  function placeholderFor(s) {
    return ({ tangenkan: 'この単元の価値や、前後の学習とのつながりを書きます。右の文例をクリックすると入ります。', seitokan: '生徒のよい面と課題を書きます。', shidokan: 'どんな手立てで指導するかを書きます。', kenkyu: '研究主題と本時の手立てのつながりを書きます。', junbi: '教科書、ワークシート、…', honji_kadai: '本時の課題（めあて）' }[s.key]) || '文章を入力';
  }

  ED.listBody = (s, def) => {
    if (!s.items || !s.items.length) s.items = [''];
    const wrap = h('div', { class: 'list-b' });
    const bank = def.bank || `free_${s.key}`;
    const items = h('div', { class: 'li-items' });
    const mark = (i) => ({ bullet: '・', paren: `（${U.zen(i + 1)}）`, circle: U.circled(i + 1), num: `${U.zen(i + 1)}`, none: '' }[s.style] || '');
    s.items.forEach((it, i) => {
      const ta = area({
        sec: s, path: `${s.id}:item:${i}`, value: it, rows: 1, ph: i === 0 ? (s.key === 'honji_goal' ? '〜することができる。' : '入力（Enterで次の行、右の文例をクリックでも入ります）') : '',
        set: (v) => { s.items[i] = v; },
        target: { bank, mode: 'item', index: i, ctx: s.title },
        onKey: (e, el) => {
          if (e.isComposing || e.keyCode === 229) return; // 日本語入力の確定の Enter は無視
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const pos = el.selectionStart;
            const before = el.value.slice(0, pos); const after = el.value.slice(el.selectionEnd);
            SD.act(() => { s.items[i] = before; s.items.splice(i + 1, 0, after); }, { card: s.id });
            ED.focusPath(`${s.id}:item:${i + 1}`, 0);
          } else if (e.key === 'Backspace' && el.selectionStart === 0 && el.selectionEnd === 0 && i > 0) {
            e.preventDefault();
            const prevLen = s.items[i - 1].length;
            SD.act(() => { s.items[i - 1] += s.items[i]; s.items.splice(i, 1); }, { card: s.id });
            ED.focusPath(`${s.id}:item:${i - 1}`, prevLen);
          }
        },
      });
      items.append(h('div', { class: 'li-row' },
        h('span', { class: 'li-mark' }, mark(i)), ta,
        h('button', { type: 'button', class: 'iconbtn', title: 'この行を削除', 'aria-label': 'この行を削除', onClick: () => SD.act(() => { s.items.splice(i, 1); if (!s.items.length) s.items.push(''); }, { card: s.id }) }, icon('x'))));
    });
    wrap.append(items, h('div', { class: 'card-foot' },
      UI.btn('行を追加', () => { SD.act(() => { s.items.push(''); }, { card: s.id }); ED.focusPath(`${s.id}:item:${s.items.length - 1}`, 0); }, { cls: 'sm', icon: 'plus' }),
      h('button', { type: 'button', class: 'btn sm ghost', onClick: () => { const f = items.querySelector('textarea'); if (f) f.focus(); ED.openSide(); } }, icon('book'), h('span', null, '文例')),
      h('span', { class: 'grow' }),
      h('label', { class: 'set-inl' }, '行頭', h('select', { class: 'inp sm', 'aria-label': '行頭の記号', onChange: (e) => SD.act(() => { s.style = e.target.value; }, { card: s.id }) },
        [['none', 'なし'], ['bullet', '・'], ['paren', '（１）'], ['circle', '①'], ['num', '１']].map(([v, l]) => h('option', { value: v, selected: s.style === v }, l))))));
    return wrap;
  };
  // プログラムからフォーカスするとき：ウィンドウにフォーカスがないと focus イベントが来ないので、自分で知らせる
  ED.focusEl = (el, caret, noScroll) => {
    if (!el) return;
    el.focus({ preventScroll: !!noScroll });
    if (caret != null && el.setSelectionRange) { const c = caret < 0 ? el.value.length : caret; try { el.setSelectionRange(c, c); } catch (e) { /* 数値の欄など */ } }
    if (!document.hasFocus() || document.activeElement !== el) el.dispatchEvent(new FocusEvent('focus'));
  };
  // 描きなおしは同期なので、すぐにフォーカスする（タイマーで遅らせると、速く打った文字が前の欄に入る）
  ED.focusPath = (path, caret) => {
    const el = document.querySelector(`[data-path="${CSS.escape(path)}"]`);
    if (el) ED.focusEl(el, caret);
    else setTimeout(() => ED.focusEl(document.querySelector(`[data-path="${CSS.escape(path)}"]`), caret), 30);
  };

  ED.kantenBody = (s) => {
    const wrap = h('div', { class: 'kanten-b' });
    const grid = h('div', { class: `kanten-grid ${s.layout === 'v' ? 'v' : 'h'}` });
    for (const k of ['chi', 'shi', 'tai']) {
      grid.append(h('div', { class: 'kanten-col' }, h('div', { class: 'kanten-h' }, SD.KNAME[k]),
        area({ sec: s, path: `${s.id}:f:${k}`, value: s.f[k], rows: 3, ph: '1行に1つ。2つ以上あると①②がつきます。', set: (v) => { s.f[k] = v; }, target: { bank: `eval_${k}`, mode: 'line', ctx: `${s.title}（${SD.KNAME[k]}）` } })));
    }
    wrap.append(grid, h('div', { class: 'card-foot' },
      h('div', { class: 'seg' }, ['h', 'v'].map((v) => h('button', { type: 'button', class: `seg-b ${s.layout === v || (v === 'h' && s.layout !== 'v') ? 'on' : ''}`, onClick: () => SD.act(() => { s.layout = v; }, { card: s.id }) }, v === 'h' ? '横に3列' : '縦に3行')))));
    return wrap;
  };

  ED.boardBody = (s) => {
    const wrap = h('div', { class: 'board-b' });
    const grid = h('div', { class: 'board-grid', style: `grid-template-columns:repeat(${s.parts.length},minmax(0,1fr))` });
    s.parts.forEach((p, i) => {
      grid.append(h('div', { class: 'board-part' },
        h('input', { class: 'inp sm board-lab', value: p.label, 'aria-label': `区切り${i + 1}の名前`, onInput: (e) => SD.textEdit(`${s.id}:bl:${i}`, () => { p.label = e.target.value; }) }),
        area({ sec: s, path: `${s.id}:part:${i}`, value: p.text, rows: 6, ph: i === 0 ? 'めあて・課題' : i === s.parts.length - 1 ? 'まとめ・練習問題' : '生徒の考え', set: (v) => { p.text = v; }, target: { bank: 'board', mode: 'line', ctx: `${s.title}（${p.label}）` } })));
    });
    wrap.append(grid, h('div', { class: 'card-foot' },
      h('span', { class: 'set-inl' }, '区切り', h('div', { class: 'seg' }, [1, 2, 3, 4].map((n) => h('button', { type: 'button', class: `seg-b ${s.parts.length === n ? 'on' : ''}`, onClick: () => SD.act(() => {
        while (s.parts.length < n) s.parts.push({ label: `区切り${s.parts.length + 1}`, text: '' });
        if (s.parts.length > n) { const extra = s.parts.splice(n); const t = extra.map((x) => x.text).filter(U.nonEmpty).join('\n'); if (t) s.parts[n - 1].text += `\n${t}`; }
      }, { card: s.id }) }, n)))),
      h('label', { class: 'chk' }, h('input', { type: 'checkbox', checked: !!s.showLabels, onChange: (e) => SD.act(() => { s.showLabels = e.target.checked; }, { card: s.id }) }), '区切りの名前も印刷する')));
    return wrap;
  };

  // ───────── 表 ─────────
  const FIXED_PX = { phase: 88, min: 62, range: 58, hours: 56, mark: 40 };
  // 列の幅：カードの幅に収まるように配分する（文章の列は最低100px。入りきらないときだけ横にスクロール）
  const colWidths = (s, cols) => {
    const center = document.getElementById('edCenter');
    const pad = window.innerWidth <= 820 ? 20 : 40;
    const avail = Math.max(420, (center ? center.clientWidth : 800) - pad - 32 - (s.level === 2 && window.innerWidth > 820 ? 22 : 0) - 68);
    const fixed = cols.filter((c) => c.type).reduce((a, c) => a + FIXED_PX[c.type], 0);
    const texts = cols.filter((c) => !c.type);
    const rest = Math.max(texts.length * 100, avail - fixed);
    // 最低幅に届かない列は100pxにして、残りをほかの列で分ける
    const out = new Map();
    let pool = texts.slice(); let left = rest;
    for (let guard = 0; guard < 5 && pool.length; guard += 1) {
      const sw = pool.reduce((a, c) => a + (+c.w || 20), 0) || 1;
      const small = pool.filter((c) => (left * (+c.w || 20)) / sw < 100);
      if (!small.length) { pool.forEach((c) => out.set(c, Math.floor((left * (+c.w || 20)) / sw))); pool = []; break; }
      small.forEach((c) => { out.set(c, 100); left -= 100; });
      pool = pool.filter((c) => !small.includes(c));
    }
    return cols.map((c) => (c.type ? FIXED_PX[c.type] : out.get(c) || 100));
  };
  // 縦ならびにするか：自分で選んだらそれ、そうでなければ「文章の列が140pxより細くなる」とき
  ED.useStack = (s, cols) => {
    const pick = S.tableView[s.id];
    if (pick) return pick === 'stack';
    if (window.innerWidth <= 820) return true;
    const texts = cols.filter((c) => !c.type);
    if (!texts.length) return false;
    const center = document.getElementById('edCenter');
    const avail = (center ? center.clientWidth : 800) - 40 - 32 - (s.level === 2 ? 22 : 0) - 68 - cols.filter((c) => c.type).reduce((a, c) => a + FIXED_PX[c.type], 0);
    return avail / texts.length < 140;
  };
  ED.tableBody = (s) => {
    const wrap = h('div', { class: 'table-b' });
    const cat = s.cols.map((c) => SD.colInfo(s, c));
    // 使っている列だけ並べる（×で外す）。ほかの列は「列を足す」から
    const chips = h('div', { class: 'col-chips', role: 'group', 'aria-label': '表の列' },
      h('span', { class: 'chips-lab' }, '列'),
      cat.map((c, i) => (c.on ? h('span', { class: 'chip on col-on', title: COL_DESC[`${s.role}.${c.key}`] || '' }, c.label,
        h('button', { type: 'button', class: 'chip-x', title: 'この列を外す（中身は消えません）', 'aria-label': `${c.label}の列を外す`, onClick: () => SD.act(() => ED.toggleCol(s, i), { card: s.id }) }, icon('x'))) : null)),
      cat.some((c) => !c.on) ? h('button', { type: 'button', class: 'chip ghost add', onClick: (e) => ED.addColMenu(s, e.currentTarget) }, icon('plus'), '列を足す') : null,
      h('button', { type: 'button', class: 'chip ghost', onClick: () => ED.colsDialog(s) }, icon('cols'), '並べかえ・名前・記号'),
      h('span', { class: 'grow' }),
      h('div', { class: 'seg view-seg', role: 'group', 'aria-label': '表の見せ方' }, [['table', '表'], ['stack', '縦ならび']].map(([v, l]) => h('button', {
        type: 'button', class: `seg-b ${(ED.useStack(s, cat.filter((c) => c.on)) ? 'stack' : 'table') === v ? 'on' : ''}`, title: v === 'table' ? '表の形で編集する' : '行ごとに縦に並べて編集する（列が多いとき・画面がせまいときに）',
        onClick: () => { S.tableView[s.id] = v; ED.renderCard(s.id); },
      }, l))));
    wrap.append(chips);
    const cols = cat.filter((c) => c.on);
    const acts = s.role === 'tenkai' ? SD.activityNumbers(s) : {};
    const ranges = s.role === 'plan' ? SD.planRanges(s) : [];
    const lessonNo = U.num(S.plan.meta.lessonNo, 0);
    // 列がせまくなりすぎるとき（並べて表示・タブレット・スマホ）は、行ごとのカードに縦に並べる
    const stack = ED.useStack(s, cols);
    if (stack) {
      const list = h('div', { class: `rows-stack role-${s.role}` });
      s.rows.forEach((r, i) => {
        const range = ranges[i];
        const hon = s.role === 'plan' && range && lessonNo >= range.from && lessonNo <= range.to && range.h > 0;
        const headCols = cols.filter((c) => c.type);
        const bodyCols = cols.filter((c) => !c.type);
        const head = h('div', { class: 'rs-head' },
          h('span', { class: 'row-grip', title: 'ドラッグで行を並べかえ' }, icon('grip')), h('span', { class: 'row-no' }, `${i + 1}`),
          headCols.map((c) => { const td = ED.gridCell(s, c, r, i, { acts, range, hon }); const box = h('span', { class: `rs-hc t-${c.type}`, title: c.label }, h('small', null, c.label)); while (td.firstChild) box.append(td.firstChild); return box; }),
          h('span', { class: 'grow' }),
          h('button', { type: 'button', class: 'iconbtn', title: 'この下に行を足す（⌘Enter）', 'aria-label': `${i + 1}行目の下に行を足す`, onClick: () => ED.addRow(s, i) }, icon('plus')),
          h('button', { type: 'button', class: 'iconbtn', title: 'この行の操作', 'aria-label': `${i + 1}行目の操作`, onClick: (e) => ED.rowMenu(s, i, e.currentTarget) }, icon('more')));
        const row = h('div', { class: `rs-row ${s.role === 'tenkai' ? `pg-${pgClass(r.phase)}` : ''} ${hon ? 'hon' : ''}`, 'data-rid': r.id }, head,
          bodyCols.map((c) => { const td = ED.gridCell(s, c, r, i, { acts, range, hon }); const box = h('div', { class: 'rs-field' }, h('div', { class: 'rs-lab' }, c.label)); while (td.firstChild) box.append(td.firstChild); return box; }));
        list.append(row);
      });
      UI.sortable(list, '.rs-row', '.row-grip', (from, to) => SD.act(() => { const [x] = s.rows.splice(from, 1); s.rows.splice(to, 0, x); }, { card: s.id }));
      wrap.append(list);
    } else {
    const widths = colWidths(s, cols);
    const table = h('table', { class: `grid role-${s.role}`, style: `width:${34 + 34 + widths.reduce((a, b) => a + b, 0)}px` });
    table.append(h('colgroup', null, h('col', { style: 'width:34px' }), cols.map((c, ci) => h('col', { style: `width:${widths[ci]}px` })), h('col', { style: 'width:34px' })));
    table.append(h('thead', null, h('tr', null, h('th', { class: 'g-h0' }), cols.map((c) => h('th', { title: c.label }, c.label)), h('th'))));
    const tbody = h('tbody');
    s.rows.forEach((r, i) => {
      const range = ranges[i];
      const hon = s.role === 'plan' && range && lessonNo >= range.from && lessonNo <= range.to && range.h > 0;
      const tr = h('tr', { class: `${s.role === 'tenkai' ? `pg-${pgClass(r.phase)}` : ''} ${hon ? 'hon' : ''}`, 'data-rid': r.id });
      tr.append(h('td', { class: 'g-grip' }, h('span', { class: 'row-grip', title: 'ドラッグで行を並べかえ' }, icon('grip')), h('span', { class: 'row-no' }, i + 1),
        h('button', { type: 'button', class: 'row-add', title: 'この下に行を足す（⌘Enter）', 'aria-label': `${i + 1}行目の下に行を足す`, onClick: () => ED.addRow(s, i) }, icon('plus'))));
      for (const c of cols) tr.append(ED.gridCell(s, c, r, i, { acts, range, hon }));
      tr.append(h('td', { class: 'g-more' }, h('button', { type: 'button', class: 'iconbtn', title: 'この行の操作', 'aria-label': `${i + 1}行目の操作`, onClick: (e) => ED.rowMenu(s, i, e.currentTarget) }, icon('more'))));
      tbody.append(tr);
    });
    UI.sortable(tbody, 'tr', '.row-grip', (from, to) => SD.act(() => { const [x] = s.rows.splice(from, 1); s.rows.splice(to, 0, x); }, { card: s.id }));
    table.append(tbody);
    wrap.append(h('div', { class: 'grid-wrap' }, table));
    }
    if (!s.rows.length) wrap.append(h('p', { class: 'muted empty-rows' }, s.role === 'tenkai' ? '行がありません。「展開の型を入れる」で一気に入れるか、「行を追加」してください。' : s.role === 'plan' ? '行がありません。「単元の中身を入れる」で単元の計画が入ります。' : '行がありません。'));
    // 下の操作
    const foot = h('div', { class: 'card-foot' },
      UI.btn('行を追加', () => ED.addRow(s, s.rows.length - 1), { cls: 'sm', icon: 'plus' }));
    if (s.role === 'tenkai') {
      foot.append(UI.btn('展開の型を入れる', () => ED.flowDialog(), { cls: 'sm', icon: 'list' }));
      const sum = s.rows.reduce((a, r) => a + U.num(r.min, 0), 0);
      const total = U.num(S.plan.meta.minutes, 50);
      foot.append(h('span', { class: 'grow' }),
        sum !== total && s.rows.length ? UI.btn(`合計を${total}分にそろえる`, () => ED.balanceMinutes(s), { cls: 'sm', icon: 'wand', title: '今の時間の割合のまま、合計が授業時間になるように直します' }) : null,
        h('span', { class: `sum ${sum === total ? 'ok' : 'ng'}`, title: '時間の合計' }, sum === total ? icon('check') : icon('alert'), `合計 ${sum}／${total}分`));
    } else if (s.role === 'plan') {
      if (SD.unitByName(S.plan.meta.unit)) foot.append(UI.btn('単元の計画を入れる', () => SD.act((p) => { s.rows = SD.planRowsFromUnit(SD.unitByName(p.meta.unit)); }, { all: true }), { cls: 'sm', icon: 'wand' }));
      foot.append(h('span', { class: 'grow' }), h('span', { class: 'sum' }, `全${SD.totalHours(S.plan)}時間・本時は第${lessonNo}時`));
    }
    wrap.append(foot);
    return wrap;
  };

  const COL_DESC = {
    'tenkai.dankai': '導入・展開・まとめ など', 'tenkai.jikan': '行ごとの時間（分）', 'tenkai.katsudo': '生徒がすること', 'tenkai.naiyo': '何を学ぶか',
    'tenkai.hatsumon': '先生の問いかけ', 'tenkai.hanno': '生徒の答え・つまずき', 'tenkai.katsudo_hanno': '活動・発問（Ｔ）・反応（Ｓ）を1つの列に',
    'tenkai.ryuiten': '指導で気をつけること', 'tenkai.shien': '先生の手立て', 'tenkai.ryuiten_hyoka': '留意点（・）と評価（◆）を1つの列に',
    'tenkai.hyoka': '評価の観点と方法', 'tenkai.keitai': '一斉・ペア・グループ など', 'tenkai.ict': '端末・電子黒板の使い方', 'tenkai.hairyo': '配慮が必要な生徒への支援',
    'tenkai.junbi': 'その場面で使う物', 'tenkai.biko': '自由なメモ',
    'plan.ji': '第何時か（時数から自動）', 'plan.jisu': 'その内容の時間数', 'plan.naiyo': '学習内容', 'plan.nerai': 'ねらい・主な学習活動',
    'plan.chi': '知識・技能を見る時間に○', 'plan.shi': '思考・判断・表現を見る時間に○', 'plan.tai': '主体的な態度を見る時間に○', 'plan.kijun': '評価規準', 'plan.hoho': '評価方法', 'plan.biko': '自由なメモ',
    'hyoka.kanten': '観点', 'hyoka.kijun': 'おおむね満足できる状況（B）', 'hyoka.hoho': 'ノート・発言など', 'hyoka.a': '十分満足できる状況（A）', 'hyoka.c': 'Cの生徒への手立て',
  };
  ED.addColMenu = (s, anchor) => {
    const items = [{ head: '足す列を選ぶ（あとで ✕ で外せます）' }];
    s.cols.forEach((c, i) => {
      if (c.on) return;
      const info = SD.colInfo(s, c);
      const hasData = s.rows.some((r) => (info.parts || []).some((p) => U.nonEmpty(r.f[p])));
      items.push({ label: info.label, icon: 'plus', sub: `${COL_DESC[`${s.role}.${c.key}`] || ''}${hasData ? '（書いた中身があります）' : ''}`, onClick: () => SD.act(() => ED.toggleCol(s, i), { card: s.id }) });
    });
    UI.menu(anchor, items, { cls: 'menu-tall' });
  };
  // 列を入れるときは、カタログの順番でふさわしい位置（例：主な発問は学習活動のあと）に置く
  ED.toggleCol = (s, i) => {
    const col = s.cols[i];
    if (col.on) { col.on = false; return; }
    const order = (SD.cols[s.role] || []).map((c) => c.key);
    const ci = (k) => { const x = order.indexOf(k); return x < 0 ? 999 : x; };
    s.cols.splice(i, 1);
    col.on = true;
    let at = -1;
    s.cols.forEach((c, j) => { if (c.on && ci(c.key) < ci(col.key)) at = j; });
    if (at < 0) { const firstOn = s.cols.findIndex((c) => c.on); at = firstOn < 0 ? -1 : firstOn - 1; }
    s.cols.splice(at + 1, 0, col);
  };
  ED.gridCell = (s, c, r, i, ctx) => {
    const path = `${s.id}:r:${r.id}:${c.key}`;
    switch (c.type) {
      case 'phase': {
        const inp = h('input', { class: 'g-inp phase', list: 'phaseList', value: r.phase || '', 'aria-label': `${i + 1}行目の段階`, 'data-path': path, placeholder: '段階',
          onInput: (e) => { SD.textEdit(path, () => { r.phase = e.target.value; }); const row = e.target.closest('tr, .rs-row'); if (row) { row.classList.remove('pg-a', 'pg-b', 'pg-c', 'pg-x'); row.classList.add(`pg-${pgClass(r.phase)}`); } },
          onChange: () => ED.renderCard(s.id),
          onFocus: () => ED.setTarget(null, s) });
        return h('td', { class: 'g-phase' }, inp);
      }
      case 'min': {
        const inp = h('input', { class: 'g-inp num', type: 'number', min: 0, max: 120, value: r.min ?? '', 'aria-label': `${i + 1}行目の時間（分）`, 'data-path': path,
          onInput: (e) => { SD.textEdit(path, () => { r.min = e.target.value; }); ED.updateSum(s); }, onFocus: () => ED.setTarget(null, s) });
        return h('td', { class: 'g-min' }, h('div', { class: 'g-unit' }, inp, h('span', null, '分')));
      }
      case 'range': return h('td', { class: 'g-range' }, ctx.range && ctx.range.h > 0 ? (ctx.range.from === ctx.range.to ? `${ctx.range.from}` : `${ctx.range.from}〜${ctx.range.to}`) : '', ctx.hon ? h('div', { class: 'hon-tag' }, '本時') : null);
      case 'hours': {
        const inp = h('input', { class: 'g-inp num', type: 'number', min: 0, max: 40, value: r.hours ?? 1, 'aria-label': `${i + 1}行目の時数`, 'data-path': path,
          onChange: (e) => SD.act(() => { r.hours = Math.max(0, Math.round(U.num(e.target.value, 1))); }, { card: s.id, settings: true }), onFocus: () => ED.setTarget(null, s) });
        return h('td', { class: 'g-min' }, inp);
      }
      case 'mark': {
        const v = r.f[c.key] || '';
        return h('td', { class: 'g-mark' }, h('button', { type: 'button', class: `mark-btn ${v ? 'on' : ''}`, title: 'クリックで ○ → ◎ → 空', 'aria-label': `${i + 1}行目の${c.label}：${v || 'なし'}`, onClick: () => SD.act(() => { r.f[c.key] = v === '' ? '○' : v === '○' ? '◎' : ''; }, { card: s.id }) }, v || '　'));
      }
      default: {
        const parts = c.parts || [c.key];
        const td = h('td', { class: 'g-text' });
        // セルの空いているところをクリックしても入力できるように
        td.addEventListener('mousedown', (e) => {
          if (e.target.closest('textarea, button, input')) return;
          const tas = td.querySelectorAll('textarea');
          const ta = tas[tas.length - 1];
          if (!ta) return;
          e.preventDefault();
          ta.focus();
          ta.setSelectionRange(ta.value.length, ta.value.length);
        });
        parts.forEach((p) => {
          const pd = SD.parts[p] || { label: c.label, bank: null, mark: '' };
          const mark = SD.partMark(s, c.key, p);
          const box = h('div', { class: `g-part p-${p}` });
          if (parts.length > 1) box.append(h('div', { class: 'g-plab' }, `${mark ? `${mark.replace(/[：:]$/, '')}　` : ''}${pd.label}`));
          if (p === 'katsudo' && ctx.acts && ctx.acts[r.id] && s.opts.num !== false) box.classList.add('has-no'), box.dataset.no = U.zen(ctx.acts[r.id]);
          const mode = p === 'keitai' || p === 'h_kanten' ? 'replace' : ['p_hoho', 'h_hoho'].includes(p) ? 'word' : 'line';
          box.append(area({
            sec: s, path: `${path}:${p}`, value: r.f[p] || '', rows: 1, cls: 'g-ta', aria: `${i + 1}行目の${pd.label}`,
            ph: mark && parts.length === 1 ? `${mark}…` : '',
            set: (v) => { r.f[p] = v; if (p === 'katsudo') ED.refreshActNumbers(s); },
            target: { bank: pd.bank || `free_${s.role}_${p}`, mode, sep: '・', phase: r.phase, rowKanten: r.f.h_kanten, ctx: `${s.title}　${i + 1}行目${r.phase ? `（${r.phase}）` : ''}・${pd.label}`, rowId: r.id, part: p },
            onKey: (e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !e.isComposing) { e.preventDefault(); ED.addRow(s, i, `${c.key}:${p}`); } },
          }));
          td.append(box);
        });
        return td;
      }
    }
  };
  ED.refreshActNumbers = (s) => {
    const acts = SD.activityNumbers(s);
    const card = document.getElementById(`card-${s.id}`);
    if (!card) return;
    card.querySelectorAll('[data-rid]').forEach((tr) => {
      const box = tr.querySelector('.g-part.p-katsudo');
      if (!box) return;
      const n = acts[tr.dataset.rid];
      box.classList.toggle('has-no', !!n && s.opts.num !== false);
      box.dataset.no = n ? U.zen(n) : '';
    });
  };
  ED.updateSum = (s) => {
    const card = document.getElementById(`card-${s.id}`);
    const el = card && card.querySelector('.sum');
    if (!el) return;
    const sum = s.rows.reduce((a, r) => a + U.num(r.min, 0), 0);
    const total = U.num(S.plan.meta.minutes, 50);
    el.className = `sum ${sum === total ? 'ok' : 'ng'}`;
    el.innerHTML = '';
    el.append(sum === total ? icon('check') : icon('alert'), `合計 ${sum}／${total}分`);
  };
  // 今の時間の割合のまま、合計を授業時間にする（時間が空の行だけのときは、行の数で分ける）
  ED.balanceMinutes = (s) => {
    const total = U.num(S.plan.meta.minutes, 50) || 50;
    SD.act(() => {
      const idx = s.rows.map((r, i) => (U.num(r.min, 0) > 0 ? i : -1)).filter((i) => i >= 0);
      const use = idx.length ? idx : s.rows.map((r, i) => i);
      const base = use.map((i) => (idx.length ? U.num(s.rows[i].min, 0) : 1));
      const mins = SD.scaleMinutes(base, total);
      use.forEach((i, k) => { s.rows[i].min = mins[k]; });
    }, { card: s.id });
    UI.toast(`時間の合計を${total}分にそろえました`, { action: { label: '元に戻す', onClick: SD.undoAct } });
  };
  ED.addRow = (s, i, focusKey) => {
    const r0 = s.rows[i];
    const nr = SD.makeRow({}, { phase: r0 ? r0.phase : '', min: '', hours: 1 });
    if (s.role === 'hyoka') nr.f.h_kanten = '';
    SD.act(() => { s.rows.splice(i + 1, 0, nr); }, { card: s.id });
    const cols = s.cols.filter((c) => c.on).map((c) => SD.colInfo(s, c));
    const first = focusKey || (() => { const c = cols.find((x) => !x.type); return c ? `${c.key}:${(c.parts || [c.key])[0]}` : null; })();
    if (first) ED.focusPath(`${s.id}:r:${nr.id}:${first}`, 0);
  };
  ED.rowMenu = (s, i, anchor) => {
    const r = s.rows[i];
    const items = [
      { label: '上に行を追加', icon: 'up', onClick: () => ED.addRow(s, i - 1) },
      { label: '下に行を追加', icon: 'down', onClick: () => ED.addRow(s, i), key: '⌘↵' },
      { label: '行を複製', icon: 'dup', onClick: () => SD.act(() => { const c = U.clone(r); c.id = U.uid(); s.rows.splice(i + 1, 0, c); }, { card: s.id }) },
      { sep: true },
      { label: '上へ', icon: 'up', disabled: i === 0, onClick: () => SD.act(() => { s.rows.splice(i, 1); s.rows.splice(i - 1, 0, r); }, { card: s.id }) },
      { label: '下へ', icon: 'down', disabled: i === s.rows.length - 1, onClick: () => SD.act(() => { s.rows.splice(i, 1); s.rows.splice(i + 1, 0, r); }, { card: s.id }) },
    ];
    if (s.role === 'plan') {
      const rg = SD.planRanges(s)[i];
      items.push({ sep: true }, { label: `この行を本時にする（第${rg.from}時）`, icon: 'star', onClick: () => { SD.act((p) => { p.meta.lessonNo = rg.from; p.meta.topic = String(r.f.p_naiyo || '').split('\n')[0].replace(/（.*?）/g, '').trim(); }, { all: true }); UI.toast(`本時を第${rg.from}時にしました`); } });
    }
    items.push({ sep: true }, { label: '行を削除', icon: 'trash', danger: true, onClick: () => { SD.act(() => { s.rows.splice(i, 1); }, { card: s.id, settings: s.role === 'plan' }); UI.toast('行を削除しました', { action: { label: '元に戻す', onClick: SD.undoAct } }); } });
    UI.menu(anchor, items, { alignRight: true });
  };

  // 列の並べかえ・名前・記号
  ED.colsDialog = (s) => {
    const work = U.clone(s.cols);
    const marks = Object.assign({}, s.marks);
    const opts = Object.assign({}, s.opts);
    const list = h('div', { class: 'cols-list' });
    const draw = () => {
      list.innerHTML = '';
      work.forEach((c, i) => {
        const info = SD.colInfo(s, c);
        const def = SD.colDef(s.role, c.key);
        const partsEls = (info.parts || []).filter((p) => !info.type).map((p) => {
          const cur = marks[`${c.key}.${p}`] != null ? marks[`${c.key}.${p}`] : SD.partMark({ role: s.role, marks: {} }, c.key, p);
          return h('label', { class: 'mark-set', title: '各行の頭につく記号' }, `${SD.partLabel(p)}の行頭`,
            h('select', { class: 'inp xs', onChange: (e) => { marks[`${c.key}.${p}`] = e.target.value; } },
              ['', '・', '○', '◎', '●', '◆', '☆', 'Ｔ：', 'Ｓ：', '※'].map((mk) => h('option', { value: mk, selected: cur === mk }, mk === '' ? 'なし' : mk))));
        });
        list.append(h('div', { class: `col-row ${c.on ? 'on' : 'off'}` },
          h('span', { class: 'col-grip', title: 'ドラッグで並べかえ' }, icon('grip')),
          h('input', { type: 'checkbox', checked: c.on, 'aria-label': `${info.label}を表示`, onChange: (e) => { c.on = e.target.checked; draw(); } }),
          h('input', { class: 'inp', value: c.label || '', placeholder: def ? def.label : '列の名前', 'aria-label': '列の名前', onInput: (e) => { c.label = e.target.value; } }),
          h('label', { class: 'set-inl', title: '列の幅' }, '幅', h('select', { class: 'inp xs', onChange: (e) => { c.w = e.target.value ? +e.target.value : undefined; } },
            h('option', { value: '', selected: !c.w }, '標準'), [5, 8, 12, 16, 20, 25, 30, 36, 42, 50].map((w) => h('option', { value: w, selected: c.w === w }, `${w}`)))),
          h('div', { class: 'col-marks' }, partsEls),
          !def ? h('button', { type: 'button', class: 'iconbtn', 'aria-label': 'この列を削除', title: 'この列を削除', onClick: () => { work.splice(i, 1); draw(); } }, icon('trash')) : h('span', { class: 'iconbtn-sp' })));
      });
    };
    draw();
    UI.sortable(list, '.col-row', '.col-grip', (from, to) => { const [x] = work.splice(from, 1); work.splice(to, 0, x); draw(); });
    const extra = h('div', { class: 'cols-extra' });
    if (s.role === 'tenkai') {
      const ck = (k, label, def = false) => h('label', { class: 'chk' }, h('input', { type: 'checkbox', checked: opts[k] != null ? !!opts[k] : def, onChange: (e) => { opts[k] = e.target.checked; } }), label);
      extra.append(ck('num', '学習活動に番号（１　２　３…）をつける', true), ck('phaseTime', '段階の欄に時間の合計も書く（例：導入（10分））'), ck('timeMerge', '「時間」の欄を段階ごとにまとめる'));
    }
    const addCol = UI.btn('自由な列を追加', async () => {
      const name = await UI.prompt('列の名前', '備考');
      if (!name) return;
      const key = `x_${U.uid()}`;
      work.push({ key, label: name, on: true, w: 16 });
      draw();
    }, { cls: 'sm', icon: 'plus' });
    UI.modal({
      title: `「${s.title}」の列`, sub: 'チェックした列だけが表に出ます。⋮⋮ をドラッグで並べかえ。名前を空にすると標準の名前になります。',
      body: h('div', null, list, h('div', { class: 'cols-foot' }, addCol), extra), cls: 'md',
      actions: [{ label: 'やめる' }, { label: 'この列にする', primary: true, onClick: () => SD.act(() => { s.cols = work; s.marks = marks; s.opts = opts; }, { card: s.id }) }],
    });
  };

  // ───────── 右：文例 ─────────
  ED.setTarget = (t, sec) => {
    const prevSec = S.target && S.target.secId;
    if (!t) { S.target = { secId: sec ? sec.id : null, bank: null }; }
    else S.target = Object.assign({}, t, { secId: sec ? sec.id : null });
    if (prevSec !== S.target.secId) {
      document.querySelectorAll('.ol-item.active').forEach((x) => x.classList.remove('active'));
      const li = document.querySelector(`.ol-item[data-sid="${S.target.secId}"]`);
      if (li) li.classList.add('active');
    }
    ED.renderBank();
    ED.syncFab();
    if (S.mode === 'split' && prevSec !== S.target.secId) ED.revealInPrev(S.target.secId);
  };
  ED.openSide = () => { if (window.innerWidth <= 1180 || S.mode === 'split') { S.sideOpen = true; ED.syncDrawers(); } };

  ED.renderBank = (force) => {
    const side = $('#edSide');
    if (!side) return;
    const t = S.target;
    const sig = t && t.bank ? `${t.bank}|${SD.phaseGroupOf(t.phase) || ''}|${t.rowKanten || ''}|${S.plan.meta.unit}|${S.plan.meta.topic}|${S.plan.meta.lessonNo}` : 'none';
    if (!force && sig === S.bankSig) {
      const ctx = side.querySelector('.bk-ctx'); if (ctx && t) ctx.textContent = t.ctx || '';
      return;
    }
    const sameBank = sig === S.bankSig;
    const oldList = side.querySelector('.bk-list');
    const keepScroll = sameBank && oldList ? oldList.scrollTop : 0;
    S.bankSig = sig;
    side.innerHTML = '';
    const close = h('button', { type: 'button', class: 'iconbtn side-x', 'aria-label': '文例を閉じる', onClick: () => { S.sideOpen = false; ED.syncDrawers(); } }, icon('x'));
    if (!t || !t.bank) {
      side.append(h('div', { class: 'bk-empty' }, close,
        h('div', { class: 'bk-e-ic' }, icon('book')),
        h('h3', null, '文例'),
        h('p', null, '入力欄をクリックすると、その欄に合う文例がここに出ます。クリックするだけで入ります。'),
        h('ul', { class: 'bk-tips' },
          h('li', null, '「〇〇」は本時の題材（なければ単元名）に置きかわります。'),
          h('li', null, '表のセルでは、その行の段階（導入・展開・まとめ）に合う文例が上に出ます。'),
          h('li', null, 'よく使う文は「マイ文例に登録」で自分の文例になります。'),
          h('li', null, '元に戻すは ⌘Z（Ctrl+Z）。'))));
      return;
    }
    const groups = SD.getBank(S.plan, t);
    const q = h('input', { class: 'inp bk-q', type: 'search', placeholder: '文例をさがす', value: S.bankQ, 'aria-label': '文例をさがす', onInput: (e) => { S.bankQ = e.target.value; drawList(); } });
    const listEl = h('div', { class: 'bk-list scroll-y' });
    const drawList = () => {
      listEl.innerHTML = '';
      const qs = S.bankQ.trim();
      let n = 0;
      for (const g of groups) {
        const items = g.items.filter((it) => !qs || it.t.includes(qs) || (it.sub || '').includes(qs));
        if (!items.length) continue;
        const sec = h('section', { class: `bk-g ${g.mine ? 'mine' : ''}` }, h('h4', null, g.name, h('small', null, items.length)));
        const fieldVal = (t.el && t.el.isConnected ? t.el.value : '') || '';
        for (const it of items) {
          const shown = SD.fillPh(S.plan, it.t);
          const used = shown.length > 4 && fieldVal.includes(shown);
          const b = h('button', { type: 'button', class: `bk-item ${used ? 'used' : ''}`, title: used ? 'この欄にもう入っています（もう一度入れることもできます）' : 'クリックで入れる' },
            h('span', { class: 'bk-t' }, shown), it.sub ? h('span', { class: 'bk-sub' }, it.sub) : null, used ? h('span', { class: 'bk-used' }, icon('check'), '入っています') : null,
            g.mine ? h('span', { class: 'bk-del', role: 'button', title: 'マイ文例から削除', 'aria-label': 'マイ文例から削除', onClick: (e) => { e.stopPropagation(); ED.removeMyPhrase(t.bank, it.t); } }, icon('x')) : null);
          b.addEventListener('mousedown', (e) => e.preventDefault());
          b.addEventListener('click', () => ED.insertPhrase(it.t));
          sec.append(b);
          n += 1;
        }
        listEl.append(sec);
      }
      if (!n) listEl.append(h('p', { class: 'muted bk-none' }, qs ? '見つかりませんでした。' : 'この欄の文例はまだありません。よく使う文を書いたら、下の「マイ文例に登録」で登録できます。'));
    };
    drawList();
    const saveBtn = h('button', { type: 'button', class: 'btn sm', onClick: () => ED.saveMyPhrase() }, icon('star'), h('span', null, '選んだ文をマイ文例に登録'));
    saveBtn.addEventListener('mousedown', (e) => e.preventDefault());
    side.append(h('div', { class: 'bk-h' }, close, h('div', { class: 'bk-title' }, icon('book'), SD.bankTitle(t.bank)), h('div', { class: 'bk-ctx' }, t.ctx || '')), q, listEl, h('div', { class: 'bk-f' }, saveBtn));
    if (keepScroll) listEl.scrollTop = keepScroll;
  };

  ED.insertPhrase = (raw) => {
    const t = S.target;
    if (!t) return;
    let el = t.el && t.el.isConnected ? t.el : document.querySelector(`[data-path="${CSS.escape(t.path || '')}"]`);
    if (!el) return;
    const text = SD.fillPh(S.plan, raw);
    const v = el.value;
    const a = el.selectionStart ?? v.length; const b = el.selectionEnd ?? a;
    let nv; let caret;
    switch (t.mode) {
      case 'sentence': {
        const pre = v.slice(0, a); const post = v.slice(b);
        const ins = text;
        nv = pre + ins + post; caret = pre.length + ins.length;
        break;
      }
      case 'word': {
        const sep = t.sep || '、';
        const base = v.replace(new RegExp(`[${sep}\\s]*$`), '');
        nv = base ? base + sep + text : text; caret = nv.length;
        break;
      }
      case 'replace': nv = text; caret = nv.length; break;
      case 'item': {
        const sec = findSec(t.secId);
        if (sec && U.nonEmpty(v)) {
          const idx = t.index + 1;
          SD.act(() => { sec.items.splice(idx, 0, text); }, { card: sec.id });
          ED.focusPath(`${sec.id}:item:${idx}`, -1);
          const ni = document.querySelector(`[data-path="${CSS.escape(`${sec.id}:item:${idx}`)}"]`);
          if (ni) ED.selectPlaceholder(ni, 0, ni.value.length);
          return;
        }
        nv = text; caret = nv.length;
        break;
      }
      default: { // line
        const lineStart = v.lastIndexOf('\n', a - 1) + 1;
        let lineEnd = v.indexOf('\n', a); if (lineEnd < 0) lineEnd = v.length;
        const cur = v.slice(lineStart, lineEnd);
        if (!cur.trim()) { nv = v.slice(0, lineStart) + text + v.slice(lineEnd); caret = lineStart + text.length; } else { nv = `${v.slice(0, lineEnd)}\n${text}${v.slice(lineEnd)}`; caret = lineEnd + 1 + text.length; }
      }
    }
    el.focus({ preventScroll: true });
    el.value = nv;
    try { el.setSelectionRange(caret, caret); } catch (e) { /* 入力欄の種類によっては不可 */ }
    SG.mute = true;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    SG.mute = false;
    UI.autosize(el);
    el.classList.remove('pulse'); void el.offsetWidth; el.classList.add('pulse');
    try { ED.selectPlaceholder(el, caret - text.length, caret); } catch (e) { /* 数値の欄など */ }
    ED.renderBank(true);
  };

  ED.saveMyPhrase = async () => {
    const t = S.target;
    if (!t || !t.bank) return;
    const el = t.el && t.el.isConnected ? t.el : document.querySelector(`[data-path="${CSS.escape(t.path || '')}"]`);
    let txt = el ? el.value.slice(el.selectionStart, el.selectionEnd) : '';
    if (!txt.trim() && el) {
      const v = el.value; const a = el.selectionStart;
      const ls = v.lastIndexOf('\n', a - 1) + 1; let le = v.indexOf('\n', a); if (le < 0) le = v.length;
      txt = v.slice(ls, le);
    }
    const v2 = await UI.prompt('マイ文例に登録', txt.trim(), { msg: `「${SD.bankTitle(t.bank)}」の文例として保存します。本時の題材や単元名の部分を「〇〇」にしておくと、ほかの授業でも使えます。`, multiline: true, ok: '登録' });
    if (!v2 || !v2.trim()) return;
    const all = SD.myPhrases();
    all[t.bank] = [v2.trim()].concat((all[t.bank] || []).filter((x) => x !== v2.trim())).slice(0, 80);
    SD.setMyPhrases(all);
    ED.renderBank(true);
    UI.toast('マイ文例に登録しました');
    if (el) el.focus({ preventScroll: true });
  };
  ED.removeMyPhrase = (bank, txt) => {
    const all = SD.myPhrases();
    all[bank] = (all[bank] || []).filter((x) => x !== txt);
    SD.setMyPhrases(all);
    ED.renderBank(true);
  };

  // ───────── 印刷イメージ ─────────
  ED.previewPane = () => {
    const st = S.plan.style;
    // 倍率を自分で変えていなければ、画面の幅に合わせる（A4＝210mm≒794px）
    if (!S.zoomUser) {
      const c = document.getElementById('edCenter');
      const avail = (c ? c.clientWidth : 900) - (window.innerWidth <= 820 ? 20 : 40) - 36;
      S.zoom = Math.max(0.4, Math.min(1, Math.floor((avail / 794) * 20) / 20));
    }
    const paper = h('div', { class: 'pv-paper', id: 'pvPaper', style: `padding:${st.mt}mm ${st.mr}mm ${st.mb}mm ${st.ml}mm;zoom:${S.zoom}` });
    paper.innerHTML = SD.renderDoc(S.plan, 'preview');
    paper.addEventListener('click', (e) => {
      const sec = e.target.closest('[data-sid]');
      if (!sec) return;
      SD.setMode('edit');
      setTimeout(() => ED.scrollToSection(sec.dataset.sid, true), 60);
    });
    const info = h('span', { class: 'pv-info', id: 'pvInfo' }, '');
    const zoom = (d) => { S.zoomUser = true; S.zoom = Math.max(0.4, Math.min(1.6, Math.round((S.zoom + d) * 10) / 10)); paper.style.zoom = S.zoom; zl.textContent = `${Math.round(S.zoom * 100)}%`; ED.markPages(); };
    const zl = h('span', { class: 'pv-zoom' }, `${Math.round(S.zoom * 100)}%`);
    const bar = h('div', { class: 'pv-bar' },
      UI.btn('編集にもどる', () => SD.setMode('edit'), { cls: 'sm', icon: 'edit' }),
      info, h('span', { class: 'grow' }),
      h('span', { class: 'pv-tip' }, '文をクリックするとその項目の編集へ'),
      h('button', { type: 'button', class: 'btn sm zoom-b', 'aria-label': '縮小', title: '縮小', onClick: () => zoom(-0.1) }, '−'), zl, h('button', { type: 'button', class: 'btn sm zoom-b', 'aria-label': '拡大', title: '拡大', onClick: () => zoom(0.1) }, '＋'),
      UI.btn('印刷・PDF', () => SD.print(), { cls: 'sm primary', icon: 'print' }));
    const wrap = h('div', { class: 'pv' }, bar, h('div', { class: 'pv-stage' }, paper));
    setTimeout(ED.markPages, 30);
    return wrap;
  };
  ED.refreshPreview = () => {
    if (S.mode === 'split') { ED.refreshPrev(); return; }
    if (S.mode !== 'preview') return;
    const paper = $('#pvPaper');
    if (!paper) return;
    paper.innerHTML = SD.renderDoc(S.plan, 'preview');
    ED.markPages();
  };
  // 並べて表示：右に、いま書いている指導案の仕上がりを出す（書いている項目をうすく光らせる）
  ED.renderPrev = () => {
    const box = $('#edPrev');
    if (!box) return;
    box.innerHTML = '';
    const st = S.plan.style;
    const paper = h('div', { class: 'pv-paper sp-paper', id: 'spPaper', style: `padding:${st.mt}mm ${st.mr}mm ${st.mb}mm ${st.ml}mm` });
    const info = h('span', { class: 'sp-info', id: 'spInfo' });
    box.append(h('div', { class: 'sp-bar' }, icon('eye'), h('b', null, '仕上がり'), info, h('span', { class: 'grow' }), h('span', { class: 'sp-tip' }, '文をクリックでその項目へ')), h('div', { class: 'sp-stage scroll-y', id: 'spStage' }, paper));
    paper.addEventListener('click', (e) => {
      const sec = e.target.closest('[data-sid]');
      if (!sec) return;
      S.collapsed.delete(sec.dataset.sid);
      ED.expandCard(sec.dataset.sid);
      ED.scrollToSection(sec.dataset.sid, true);
    });
    ED.refreshPrev();
  };
  ED.refreshPrev = () => {
    const paper = $('#spPaper'); const stage = $('#spStage');
    if (!paper || !stage) return;
    const keep = stage.scrollTop;
    // 右のらんの幅に合わせて縮小（A4＝210mm≒794px）
    const z = Math.max(0.3, Math.min(1, (stage.clientWidth - 28) / 794));
    paper.style.zoom = z;
    paper.innerHTML = SD.renderDoc(S.plan, 'preview');
    stage.scrollTop = keep;
    if (S.target && S.target.secId) ED.revealInPrev(S.target.secId, true);
    const info = $('#spInfo');
    if (info) info.textContent = `A4・${Math.round(z * 100)}%`;
  };
  ED.revealInPrev = (sid, quiet) => {
    const paper = $('#spPaper'); const stage = $('#spStage');
    if (!paper || !stage) return;
    paper.querySelectorAll('.sp-hl').forEach((x) => x.classList.remove('sp-hl'));
    const el = sid && paper.querySelector(`[data-sid="${sid}"]`);
    if (!el) return;
    el.classList.add('sp-hl');
    const z = parseFloat(paper.style.zoom) || 1;
    const top = el.offsetTop * z + paper.offsetTop - 16;
    const visTop = stage.scrollTop; const visBot = visTop + stage.clientHeight;
    const elBot = top + el.offsetHeight * z;
    if (!quiet || top < visTop || top > visBot - 40) {
      if (top < visTop || elBot > visBot || !quiet) stage.scrollTo({ top: Math.max(0, top), behavior: quiet ? 'auto' : 'smooth' });
    }
  };
  ED.refreshPreviewSoon = U.debounce(() => ED.refreshPreview(), 250);
  ED.refreshOutlineSoon = U.debounce(() => { if (S.view === 'edit' && S.plan) ED.renderOutline(); }, 450);

  // ページの区切りのめやすを引く（印刷と同じく、表の行はページをまたがない）
  ED.markPages = () => {
    const paper = $('#pvPaper');
    if (!paper) return;
    paper.querySelectorAll('.pv-break').forEach((x) => x.remove());
    const st = S.plan.style;
    const mm = 96 / 25.4;
    const pageH = (297 - st.mt - st.mb) * mm;
    const doc = paper.querySelector('.sd-doc');
    if (!doc) return;
    const base = doc.getBoundingClientRect().top;
    const z = S.zoom || 1;
    // 区切りを考える単位：見出し／表の見出し行／表の行／段落／そのほかのかたまり
    const units = [];
    const walk = (el) => {
      for (const c of el.children) {
        if (c.matches('table.d-tbl, table.d-board')) {
          const th = c.querySelector(':scope > thead');
          const theadH = th ? th.getBoundingClientRect().height / z : 0;
          c.querySelectorAll(':scope > thead > tr').forEach((tr) => units.push({ el: tr, kind: 'thead' }));
          c.querySelectorAll(':scope > tbody > tr').forEach((tr, i) => units.push({ el: tr, kind: 'row', first: i === 0, theadH }));
        } else if (c.matches('.d-sec, .d-b, .tbl')) walk(c);
        else units.push({ el: c, kind: c.matches('.d-h, .d-title') ? 'heading' : c.matches('p, .li') ? 'para' : 'block' });
      }
    };
    walk(doc);
    let pageTop = 0; let pages = 1;
    const marks = [];
    const lineH = parseFloat(getComputedStyle(doc).fontSize) * 1.6 || 18;
    let keep = null; // 直前の見出し（次のかたまりといっしょに次のページへ行く）
    for (const u of units) {
      const r = u.el.getBoundingClientRect();
      const top = (r.top - base) / z; const bot = (r.bottom - base) / z;
      const pbSec = u.el.closest('.pb-before');
      const forced = pbSec && u.el === pbSec.querySelector('.d-h, .d-title');
      if (u.el.classList.contains('d-pagebreak')) { pageTop = bot; pages += 1; marks.push({ y: top, n: pages, forced: true }); keep = null; continue; }
      if (forced && top > pageTop + 4) { pageTop = top; pages += 1; marks.push({ y: top, n: pages, forced: true }); }
      while (bot - pageTop > pageH + 0.5) {
        const room = pageTop + pageH - top; // このページに残っている高さ
        let y;
        if (u.kind === 'para' && room >= 2 * lineH) y = top + Math.floor(room / lineH) * lineH; // 段落は2行以上入れば途中で分かれる
        else if (keep != null && keep > pageTop + 1 && (u.kind !== 'row' || u.first)) y = keep; // 見出しごと次のページへ
        else y = top > pageTop + 1 ? top : pageTop + pageH;
        if (y <= pageTop + 1) y = pageTop + pageH;
        pages += 1; marks.push({ y, n: pages });
        // 表の途中で次のページになったら、見出し行がくり返されるぶん下がる
        pageTop = u.kind === 'row' && !u.first && u.theadH ? y - u.theadH : y;
      }
      if (u.kind === 'heading') keep = top;
      else if (u.kind !== 'thead') keep = null;
    }
    const docTop = (doc.getBoundingClientRect().top - paper.getBoundingClientRect().top) / z;
    for (const mk of marks) {
      paper.append(h('div', { class: `pv-break ${mk.forced ? 'forced' : ''}`, style: `top:${docTop + mk.y - 6}px` }, h('span', null, `${mk.n}ページ目`)));
    }
    const info = $('#pvInfo');
    if (info) {
      info.textContent = `A4・約${pages}ページ（めやす）`;
      info.className = `pv-info ${S.plan.patternId === 'ryakuan' && pages > 1 ? 'ng' : ''}`;
      if (S.plan.patternId === 'ryakuan' && pages > 1) info.textContent += '　略案は1枚におさめるのがふつうです（書式で文字を小さくできます）';
    }
    S.pages = pages;
  };
})();
