/* アドリブ・ラボ：①コード譜タブ（入力欄・コードパレット・演奏設定・小節のならび・役割の詳細） */
(function () {
  'use strict';
  const AL = window.AL;
  const { T, C, A, L, S, B, Au, P, U } = AL;
  const { h, $, $$ } = U;
  const App = AL.App;
  const mod = T.mod;
  const el = {};
  let rangeMode = false, rangeAnchor = null, curRoot = 'C', paletteOpen = false;

  const st = () => App.st;
  const ROOTS = [['C', 'C'], ['Db', 'D♭'], ['D', 'D'], ['Eb', 'E♭'], ['E', 'E'], ['F', 'F'], ['F#', 'F♯'], ['G', 'G'], ['Ab', 'A♭'], ['A', 'A'], ['Bb', 'B♭'], ['B', 'B']];
  const QUALS = [
    ['maj7', 'maj7'], ['m7', 'm7'], ['7', '7'], ['m7b5', 'm7♭5'], ['o7', '°7'], ['6', '6'], ['m6', 'm6'], ['m(maj7)', 'm(maj7)'],
    ['7b9', '7♭9'], ['7#9', '7♯9'], ['7#11', '7♯11'], ['7b13', '7♭13'], ['7alt', '7alt'], ['7sus4', '7sus4'],
    ['maj9', 'maj9'], ['m9', 'm9'], ['9', '9'], ['13', '13'], ['maj7#11', 'maj7♯11'], ['69', '6/9'], ['', '（そのまま）'], ['m', 'm'], ['sus4', 'sus4'], ['aug', 'aug'],
  ];
  const STRUCT = [['|', '｜小節線'], ['%', '％くり返し'], ['N.C.', 'N.C.'], ['|:', '|: くり返し始め'], [':|', ':| くり返し終わり'], ['[1', '[1 1番かっこ'], ['[2', '[2 2番かっこ'], ['*A', '*A セクション'], ['\n', '改行']];

  /* ---------------- 組み立て ---------------- */
  function presetOptions() {
    const opts = [['', 'サンプルをえらぶ…']];
    P.CATS.forEach(c => { opts.push({ group: c.jp, items: P.LIST.filter(p => p.cat === c.id).map(p => [p.id, p.title]) }); });
    return opts;
  }

  function build() {
    const root = $('#tab-chart');
    U.clear(root);

    /* --- カード1：コード譜 --- */
    el.preset = U.select(presetOptions(), st().presetId, id => { if (id) App.loadPreset(id); else el.preset.value = st().presetId; }, { id: 'presetSel', 'aria-label': 'サンプルのコード進行をえらぶ' });
    el.saved = U.select([['', 'マイ譜面…']], '', v => { if (v) openSaved(v); el.saved.value = ''; }, { id: 'savedSel', 'aria-label': '保存した譜面を開く' });
    el.title = h('input', { type: 'text', class: 'ttl', id: 'chartTitle', maxlength: 60, placeholder: '曲名（書き出しに使います）', value: st().title, 'aria-label': '曲名', oninput: () => { st().title = el.title.value; App.save(); } });
    el.text = h('textarea', { id: 'chartText', class: 'code', rows: 5, spellcheck: 'false', autocapitalize: 'off', autocomplete: 'off', autocorrect: 'off', 'aria-label': 'コード譜（| で小節を区切る）', placeholder: '| Dm7 | G7 | Cmaj7 | % |', oninput: onTextInput });
    el.text.value = st().text;
    el.errs = h('ul', { class: 'errs', 'aria-live': 'polite' });
    el.paletteBox = h('div', { class: 'palette', hidden: true });
    el.paletteBtn = h('button', { type: 'button', class: 'btn sm', 'aria-expanded': 'false', onclick: togglePalette }, '🎹 コードパレット');
    const fmtBtn = h('button', { type: 'button', class: 'btn sm', title: '1行4小節にそろえて書きなおす', onclick: () => { const t = C.formatText(App.chart, 4); if (t) { el.text.value = t; App.setText(t, { keepPreset: true }); } } }, '整える');
    const saveBtn = h('button', { type: 'button', class: 'btn sm', onclick: saveCurrent }, '保存');
    const delBtn = h('button', { type: 'button', class: 'btn sm ghost', onclick: deleteSaved }, '削除');
    const copyBtn = h('button', { type: 'button', class: 'btn sm', onclick: () => copyText(el.text.value, 'コード譜をコピーしました') }, 'コピー');
    const shareBtn = h('button', { type: 'button', class: 'btn sm', title: 'このコード譜を開くリンクをコピー', onclick: () => copyText(App.shareUrl(), '共有リンクをコピーしました') }, 'リンク');
    root.appendChild(h('div', { class: 'card' },
      h('div', { class: 'card-h' }, h('h2', null, 'コード譜'), h('div', { class: 'row gap' }, el.preset)),
      h('div', { class: 'row gap wrap mt' }, el.title, el.saved, saveBtn, delBtn),
      h('div', { class: 'mt' }, el.text),
      el.errs,
      h('div', { class: 'row gap wrap mt' }, el.paletteBtn, fmtBtn, copyBtn, shareBtn),
      el.paletteBox,
      h('details', { class: 'help mt' }, h('summary', null, '書き方のヒント'),
        h('ul', null,
          h('li', null, h('code', null, '| Dm7 | G7 | Cmaj7 | % |'), '　縦線で小節を区切ります。', h('code', null, '%'), ' は「前の小節と同じ」。'),
          h('li', null, h('code', null, '| Dm7 G7 |'), '　1小節に複数のコードを書くと、均等に分けます（2つなら2拍ずつ）。', h('code', null, '| C . . G |'), ' のように、', h('code', null, '.'), ' で前のコードを1拍のばせます。'),
          h('li', null, h('code', null, '|: A :|'), '　くり返し。', h('code', null, '[1'), '・', h('code', null, '[2'), ' で1番かっこ・2番かっこ。', h('code', null, '*A'), ' でセクション名。'),
          h('li', null, 'コードの書き方：', h('code', null, 'Cmaj7  Dm7  G7b9  Bm7b5  Bo7  C6  Cm(maj7)  G7alt  F#m7b5  C/E  N.C.')),
          h('li', null, '縦線をまったく書かないと、1語＝1小節として読みます。'))),
    ));

    /* --- カード2：演奏設定 --- */
    el.style = U.select(Object.keys(B.STYLES).map(id => [id, B.STYLES[id].jp]), st().style, v => App.setStyle(v), { id: 'styleSel', 'aria-label': '伴奏のスタイル' });
    el.styleNote = h('p', { class: 'f-hint' });
    el.keySel = h('select', { id: 'keySel', 'aria-label': 'キー（コード譜をまるごと移調）', onchange: () => App.transposeTo(+el.keySel.value) });
    const keyDown = h('button', { type: 'button', class: 'btn sm', 'aria-label': '半音下げる', title: '半音下げる', onclick: () => App.transposeBy(-1) }, '♭');
    const keyUp = h('button', { type: 'button', class: 'btn sm', 'aria-label': '半音上げる', title: '半音上げる', onclick: () => App.transposeBy(1) }, '♯');
    el.keyNote = h('p', { class: 'f-hint' });
    el.swing = h('input', { type: 'range', class: 'rng', id: 'swingRng', min: 50, max: 72, step: 1, 'aria-label': 'スウィングの深さ', oninput: () => { App.set({ swing: +el.swing.value / 100 }); updateSwingLabel(); } });
    el.swingVal = h('span', { class: 'val' });
    el.swingReset = h('button', { type: 'button', class: 'btn sm ghost', onclick: () => { App.set({ swing: null }); refreshSettings(); } }, '標準にもどす');
    el.countIn = U.seg([[0, 'なし'], [1, '1小節'], [2, '2小節']], st().countIn, v => App.set({ countIn: v }), 'カウントイン');
    el.click = U.switchEl('メトロノーム（クリック）', st().click, v => App.set({ click: v }));
    el.perRow = U.seg([[2, '2'], [3, '3'], [4, '4'], [6, '6'], [8, '8']], st().perRow, v => { App.set({ perRow: v }); renderGrid(); }, '1行の小節数');
    root.appendChild(h('div', { class: 'card' },
      h('div', { class: 'card-h' }, h('h2', null, '演奏の設定')),
      h('div', { class: 'fields' },
        U.field('伴奏のスタイル', el.style, null),
        h('div', { class: 'field' }, h('label', { class: 'f-label', for: 'keySel' }, 'キー（まるごと移調）'), h('div', { class: 'row gap' }, keyDown, el.keySel, keyUp), el.keyNote),
        h('div', { class: 'field' }, h('label', { class: 'f-label' }, 'スウィングの深さ'), h('div', { class: 'row gap' }, el.swing, el.swingVal), h('div', { class: 'row gap' }, el.swingReset, h('p', { class: 'f-hint' }, '50% は均等な8分音符、67% で3連符のハネ。'))),
        U.field('カウントイン', el.countIn, null),
        h('div', { class: 'field' }, el.click),
        U.field('譜面の1行あたりの小節数', el.perRow, null),
      ), el.styleNote));

    /* --- カード3：譜面（小節のならび） --- */
    el.keyInfo = h('div', { class: 'keyinfo' });
    el.rangeBtn = h('button', { type: 'button', class: 'btn sm', 'aria-pressed': 'false', onclick: toggleRangeMode, title: '2か所の小節をタップして、その範囲だけをくり返し練習' }, '範囲をえらぶ');
    el.rangeInfo = h('span', { class: 'range-info' });
    el.grid = h('div', { class: 'grid', id: 'chartGrid', role: 'list', 'aria-label': 'コード譜' });
    el.legend = h('div', { class: 'legend' },
      h('span', { class: 'chip tone-t' }, 'T トニック'), h('span', { class: 'chip tone-sd' }, 'SD サブドミナント'), h('span', { class: 'chip tone-d' }, 'D ドミナント'), h('span', { class: 'chip tone-x' }, 'そのほか'),
      h('span', { class: 'muted' }, '　色つきの線は「ひとかたまり」のコード進行（ここにリックを当てます）'));
    root.appendChild(h('div', { class: 'card' },
      h('div', { class: 'card-h' }, h('h2', null, '譜面と、コードの役割'), h('div', { class: 'row gap' }, el.rangeInfo, el.rangeBtn)),
      el.keyInfo, el.grid, el.legend,
      h('p', { class: 'hint' }, 'コードをタップすると、下に役割とスケールが出ます。小節をダブルクリック（またはダブルタップ）すると、そこから再生します。')));

    /* --- カード4：選んだコードの詳細 --- */
    el.detail = h('div', { class: 'card detail', id: 'chordDetail', 'aria-live': 'polite' });
    root.appendChild(el.detail);

    buildPalette();
    refreshSavedList();
  }

  /* ---------------- 入力欄 ---------------- */
  const pushText = U.debounce(() => { const v = el.text.value; if (v !== st().text) App.setText(v); }, 260);
  function onTextInput() { pushText(); }

  function insertAtCursor(txt) {
    const ta = el.text, a = ta.selectionStart == null ? ta.value.length : ta.selectionStart, b = ta.selectionEnd == null ? a : ta.selectionEnd;
    const before = ta.value.slice(0, a), after = ta.value.slice(b);
    const nl = txt === '\n';
    const pre = nl ? '' : (before && !/\s$/.test(before) ? ' ' : '');
    const post = nl ? '' : (after && !/^\s/.test(after) ? ' ' : (after ? '' : ' '));
    ta.value = before + pre + txt + post + after;
    const caret = (before + pre + txt + post).length;
    ta.focus(); ta.setSelectionRange(caret, caret);
    pushText();
  }
  function backspaceToken() {
    const ta = el.text, a = ta.selectionStart == null ? ta.value.length : ta.selectionStart;
    let before = ta.value.slice(0, a);
    const after = ta.value.slice(a);
    before = before.replace(/\s+$/, '').replace(/[^\s]+$/, '').replace(/[ \t]+$/, '');
    ta.value = before + (before && !/\s$/.test(before) ? ' ' : '') + after.replace(/^[ \t]+/, '');
    ta.focus(); ta.setSelectionRange(before.length, before.length);
    pushText();
  }
  function buildPalette() {
    const box = U.clear(el.paletteBox);
    const rootBtns = ROOTS.map(([v, l]) => h('button', { type: 'button', class: 'pal-b root', 'aria-pressed': String(v === curRoot), data: { v }, onclick: () => { curRoot = v; rootBtns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === curRoot))); } }, l));
    box.appendChild(h('p', { class: 'pal-t' }, '① ルートをえらぶ　② 種類を押すと入力欄に入ります'));
    box.appendChild(h('div', { class: 'pal-row' }, rootBtns));
    box.appendChild(h('div', { class: 'pal-row' }, QUALS.map(([v, l]) => h('button', { type: 'button', class: 'pal-b', onclick: () => insertAtCursor(curRoot + v) }, h('span', { class: 'pr' }, ROOTS.find(r => r[0] === curRoot)[1].slice(0, 1)), l))));
    box.appendChild(h('div', { class: 'pal-row' }, STRUCT.map(([v, l]) => h('button', { type: 'button', class: 'pal-b st', onclick: () => insertAtCursor(v) }, l)), h('button', { type: 'button', class: 'pal-b st', onclick: backspaceToken }, '⌫ ひとつ消す')));
  }
  function togglePalette() {
    paletteOpen = !paletteOpen;
    el.paletteBox.hidden = !paletteOpen;
    el.paletteBtn.setAttribute('aria-expanded', String(paletteOpen));
  }
  function copyText(text, msg) {
    const done = () => U.toast(msg);
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, () => fallbackCopy(text, done));
    else fallbackCopy(text, done);
  }
  function fallbackCopy(text, done) {
    const ta = h('textarea', { style: { position: 'fixed', left: '-9999px' } }); ta.value = text;
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); done(); } catch (e) { U.toast('コピーできませんでした'); }
    ta.remove();
  }

  /* ---------------- 保存した譜面（このブラウザの中だけ） ---------------- */
  const savedList = () => U.store.get('saved', []);
  function refreshSavedList() {
    const list = savedList();
    U.clear(el.saved);
    el.saved.appendChild(h('option', { value: '' }, list.length ? 'マイ譜面（' + list.length + '）…' : 'マイ譜面（まだありません）'));
    list.forEach(s => el.saved.appendChild(h('option', { value: s.id }, s.title || '（名前なし）')));
  }
  function saveCurrent() {
    const title = (st().title || '').trim() || window.prompt('この譜面の名前をつけてください', '') || '';
    if (!title.trim()) return;
    st().title = title.trim(); el.title.value = st().title;
    const list = savedList();
    const rec = { id: 's' + Date.now().toString(36), title: st().title, text: st().text, style: st().style, tempo: st().tempo };
    const same = list.findIndex(s => s.title === rec.title);
    if (same >= 0) { rec.id = list[same].id; list[same] = rec; } else list.unshift(rec);
    U.store.set('saved', list.slice(0, 60));
    refreshSavedList();
    el.saved.value = '';
    U.toast('「' + rec.title + '」を保存しました（このブラウザの中だけ）');
  }
  function openSaved(id) {
    const s = savedList().find(x => x.id === id);
    if (!s) return;
    st().title = s.title; st().style = B.STYLES[s.style] ? s.style : st().style; st().tempo = s.tempo || st().tempo; st().keyOverride = null; st().range = null;
    el.title.value = s.title;
    App.setText(s.text);
    App.emit('settings');
  }
  function deleteSaved() {
    const list = savedList();
    if (!list.length) { U.toast('保存した譜面はまだありません'); return; }
    const t = (st().title || '').trim();
    const idx = list.findIndex(s => s.title === t);
    if (idx < 0) { U.toast('消す譜面を「曲名」に入れてから押してください（今の曲名と同じ名前の譜面を消します）'); return; }
    if (!window.confirm('「' + t + '」を削除しますか？')) return;
    list.splice(idx, 1);
    U.store.set('saved', list);
    refreshSavedList();
    U.toast('削除しました');
  }

  /* ---------------- 設定の表示 ---------------- */
  function updateSwingLabel() { el.swingVal.textContent = Math.round(App.swing() * 100) + '%'; el.swingReset.hidden = st().swing == null; }
  function refreshSettings() {
    if (!el.style) return;
    el.style.value = st().style;
    el.styleNote.textContent = B.STYLES[st().style].note + (B.STYLES[st().style].bpb === 3 ? '（3拍子：1小節＝3拍で読みます）' : '');
    el.swing.value = Math.round(App.swing() * 100);
    updateSwingLabel();
    el.countIn.set(st().countIn);
    el.click.input.checked = !!st().click;
    el.perRow.set(st().perRow);
    el.title.value = st().title || '';
    el.preset.value = st().presetId || '';
    // キーの選択肢（いまの調のモードで綴る）
    const key = App.an.key;
    U.clear(el.keySel);
    for (let pc = 0; pc < 12; pc++) {
      const sp = T.keySpell(pc, key.mode);
      el.keySel.appendChild(h('option', { value: pc }, T.spellStr(sp, true) + (key.mode === 'minor' ? ' マイナー' : ' メジャー')));
    }
    el.keySel.value = String(key.tonicPc);
    el.keyNote.textContent = '今の読みとり：' + key.name + (key.auto ? '（自動）' : '（指定）') + '。選ぶと、コード譜の文字ごと移調します。';
  }

  function refreshKeyInfo() {
    const an = App.an, box = U.clear(el.keyInfo);
    if (!App.hasChords) return;
    const cand = (an.key.candidates || []).filter((k, i, arr) => arr.findIndex(x => x.tonicPc === k.tonicPc && x.mode === k.mode) === i).slice(0, 4);
    box.appendChild(h('span', { class: 'ki' }, h('b', null, 'キー：'), an.key.name, h('span', { class: 'muted' }, an.key.auto ? '（自動で推定）' : '（指定）')));
    if (an.form) box.appendChild(h('span', { class: 'ki' }, h('b', null, '形式：'), an.form.name));
    box.appendChild(h('span', { class: 'ki' }, h('b', null, '長さ：'), App.chart.chorusBars + '小節' + (App.bpb === 3 ? '（3拍子）' : '')));
    if (cand.length > 1) {
      const alt = h('span', { class: 'ki alt' }, h('b', null, 'キーの読みかえ：'));
      cand.forEach(k => {
        const cur = k.tonicPc === an.key.tonicPc && k.mode === an.key.mode;
        alt.appendChild(h('button', { type: 'button', class: 'chip btnchip', 'aria-pressed': String(cur), title: 'このキーとして役割を読みなおす（音は変わりません）', onclick: () => App.setKeyOverride(cur && !an.key.auto ? null : { tonicPc: k.tonicPc, mode: k.mode }) }, k.name));
      });
      if (!an.key.auto) alt.appendChild(h('button', { type: 'button', class: 'chip btnchip', onclick: () => App.setKeyOverride(null) }, '自動にもどす'));
      box.appendChild(alt);
    }
  }

  /* ---------------- 小節のならび ---------------- */
  function chipEl(c) {
    return h('span', { class: 'chip tone-' + (c.tone || 'x') + ' k-' + c.kind, title: c.sub || null }, c.label);
  }
  function renderGrid() {
    const chart = App.chart, an = App.an, grid = U.clear(el.grid);
    grid.style.setProperty('--cols', st().perRow);
    if (!chart.bars.length) {
      grid.appendChild(h('p', { class: 'empty' }, 'まだコードがありません。上の入力欄に、たとえば ', h('code', null, '| Dm7 | G7 | Cmaj7 | % |'), ' と書くか、サンプルをえらんでください。'));
      return;
    }
    const badMap = {};
    chart.errors.forEach(e => { if (e.bar != null) badMap[e.bar - 1] = e.msg; });
    chart.bars.forEach((bar, bi) => {
      const cell = h('div', { class: 'bar' + (bar.repeatStart ? ' rs' : '') + (bar.repeatEnd ? ' re' : '') + (bar.copy ? ' copy' : ''), role: 'listitem', data: { bar: bi } });
      const top = h('div', { class: 'bar-top' });
      if (bar.section) top.appendChild(h('span', { class: 'sect' }, bar.section));
      if (bar.ending) top.appendChild(h('span', { class: 'ending' }, bar.ending + '.'));
      top.appendChild(h('span', { class: 'bno' }, String(bi + 1)));
      cell.appendChild(top);
      const chords = h('div', { class: 'chords' });
      bar.chords.forEach((c, k) => {
        const slotIdx = App.cellSlot[bi][k], hsIdx = slotIdx >= 0 ? App.slot2hs[slotIdx] : null;
        const info = hsIdx != null ? an.chords[hsIdx] : null;
        const hs = hsIdx != null ? App.hs[hsIdx] : null;
        const firstOfHs = hs && hs.parts[0] === slotIdx, lastOfHs = hs && hs.parts[hs.parts.length - 1] === slotIdx;
        const ph = hsIdx != null ? App.phraseOf[hsIdx] : null;
        const cc = h('div', { class: 'cc' + (c.chord && c.chord.bad ? ' bad' : '') + (bar.copy ? ' cp' : '') + (ph && ph.color >= 0 ? ' ph c' + ph.color + (ph.first && firstOfHs ? ' first' : '') + (ph.last && lastOfHs ? ' last' : '') : ''), style: { flexGrow: c.dur }, data: { bar: bi, k: k, hs: hsIdx == null ? '' : hsIdx }, title: c.chord && c.chord.bad ? '読めないコード：' + c.src : null });
        cc.appendChild(bar.copy ? h('span', { class: 'cs pct', title: '前の小節と同じ' }, '%') : U.chordHtml(c.chord, c.src));
        const chipsBox = h('div', { class: 'chips' });
        if (info && firstOfHs && !bar.copy) (info.chips || []).forEach(ch => chipsBox.appendChild(chipEl(ch)));
        cc.appendChild(chipsBox);
        if (ph && ph.color >= 0 && ph.first && firstOfHs && ph.match) cc.appendChild(h('span', { class: 'ph-l' }, App.patLabel(ph.match.id)));
        chords.appendChild(cc);
      });
      cell.appendChild(chords);
      grid.appendChild(cell);
    });
    renderRange();
    markSel();
  }
  function onGridClick(e) {
    const cc = e.target.closest('.cc'), bar = e.target.closest('.bar');
    if (!bar) return;
    const bi = +bar.dataset.bar;
    if (rangeMode) { rangeClick(bi); return; }
    if (e.shiftKey && App.sel.bar != null) { App.setRange({ a: Math.min(App.sel.bar, bi), b: Math.max(App.sel.bar, bi) }); return; }
    const hs = cc && cc.dataset.hs !== '' ? +cc.dataset.hs : null;
    App.select({ hs, bar: bi });
  }
  function onGridDbl(e) {
    const bar = e.target.closest('.bar');
    if (!bar || rangeMode) return;
    App.playFromBar(+bar.dataset.bar);
  }
  function rangeClick(bi) {
    if (rangeAnchor == null) { rangeAnchor = bi; App.setRange({ a: bi, b: bi }); }
    else { App.setRange({ a: Math.min(rangeAnchor, bi), b: Math.max(rangeAnchor, bi) }); rangeAnchor = null; setRangeMode(false); }
  }
  function setRangeMode(on) {
    rangeMode = on; rangeAnchor = null;
    el.rangeBtn.setAttribute('aria-pressed', String(on));
    el.rangeBtn.textContent = on ? '範囲：はじめとおわりの小節をタップ' : '範囲をえらぶ';
    el.grid.classList.toggle('picking', on);
  }
  function toggleRangeMode() { setRangeMode(!rangeMode); }
  function renderRange() {
    const r = st().range;
    $$('.bar', el.grid).forEach(b => {
      const i = +b.dataset.bar;
      b.classList.toggle('inrange', !!r && i >= Math.min(r.a, r.b) && i <= Math.max(r.a, r.b));
    });
    U.clear(el.rangeInfo);
    if (r) {
      const a = Math.min(r.a, r.b) + 1, b = Math.max(r.a, r.b) + 1;
      el.rangeInfo.appendChild(h('span', { class: 'chip btnchip', 'aria-pressed': 'true' }, 'くり返し範囲：' + (a === b ? a + '小節目' : a + '〜' + b + '小節目')));
      el.rangeInfo.appendChild(h('button', { type: 'button', class: 'btn sm ghost', onclick: () => { App.setRange(null); setRangeMode(false); } }, '解除'));
    }
  }

  /* ---------------- 選択・再生位置の表示 ---------------- */
  function markSel() {
    $$('.cc.sel', el.grid).forEach(c => c.classList.remove('sel'));
    const i = App.sel.hs;
    if (i == null) return;
    $$('.cc', el.grid).forEach(c => { if (c.dataset.hs === String(i)) c.classList.add('sel'); });
  }
  function onSel() { markSel(); renderDetail(); }
  let lastBarEl = null, lastCcEl = null, lastScrollBar = -1;
  function onPos(pos) {
    if (lastBarEl) { lastBarEl.classList.remove('playing'); lastBarEl = null; }
    if (lastCcEl) { lastCcEl.classList.remove('now'); lastCcEl = null; }
    if (!pos || pos.countIn || App.playKind !== 'main') { lastScrollBar = -1; return; }
    const src = App.chart.order[pos.bar];
    if (src == null) return;
    const barEl = el.grid.querySelector('.bar[data-bar="' + src + '"]');
    if (!barEl) return;
    barEl.classList.add('playing'); lastBarEl = barEl;
    const bar = App.chart.bars[src];
    let k = 0;
    bar.chords.forEach((c, j) => { if (c.beat <= pos.beatInBar + 1e-6) k = j; });
    const cc = barEl.querySelector('.cc[data-k="' + k + '"]');
    if (cc) { cc.classList.add('now'); lastCcEl = cc; }
    if (App.tab === 'chart' && lastScrollBar !== src) {
      lastScrollBar = src;
      const r = barEl.getBoundingClientRect(), vh = window.innerHeight || 700;
      if (r.top < 70 || r.bottom > vh - 90) barEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }

  /* ---------------- 役割の詳細 ---------------- */
  function previewScale(chord, scaleId) {
    const sc = T.SCALES[scaleId];
    if (!sc || !chord || chord.nc) return;
    const rootPc = chord.rootPc, r = 60 + ((rootPc + 5) % 12) - 5;
    const semis = sc.f.split(' ').map(d => T.parseDegree(d).semis);
    const up = semis.map(x => r + x).concat([r + 12]);
    const seq = up.concat(up.slice(0, -1).reverse());
    const solo = seq.map((m, i) => ({ t: i * 0.5, dur: 0.46, midi: m, vel: i === 0 || i === up.length - 1 ? 92 : 80 }));
    App.playPreview({ id: 'scale:' + scaleId, chords: [{ src: chord.src, dur: 8 }], solo, swing: 0.5, tempo: 112, bpb: 4 });
  }
  function noteNames(chord, scaleId) {
    return T.scaleNotes(chord.root, scaleId).map(sp => T.spellStr(sp, true)).join(' ');
  }
  function renderDetail() {
    const box = U.clear(el.detail), i = App.sel.hs, info = i != null ? App.an.chords[i] : null;
    if (!info) {
      box.appendChild(h('div', { class: 'card-h' }, h('h2', null, '選んだコードの役割')));
      box.appendChild(h('p', { class: 'muted' }, App.hasChords ? '上の譜面でコードをタップすると、そのコードの役割（ひとつとは限りません）・合うスケール・使えるリックがここに出ます。' : 'コードを入力すると、ここに役割が出ます。'));
      return;
    }
    const hs = App.hs[i], chord = hs.chord;
    const barNo = hs.bar + 1;
    box.appendChild(h('div', { class: 'detail-h' },
      h('div', { class: 'big-cs' }, U.chordHtml(chord, hs.src)),
      h('div', null,
        h('div', { class: 'dh-line' }, h('b', null, info.roman), h('span', { class: 'muted' }, '　' + (T.CLASS_JP ? T.CLASS_JP[chord.cls] || '' : ''))),
        h('div', { class: 'muted small' }, barNo + '小節目・' + (hs.dur % 1 === 0 ? hs.dur : hs.dur.toFixed(1)) + '拍')),
      h('div', { class: 'grow' }),
      h('button', { type: 'button', class: 'btn', onclick: () => { const b = hs.bar; App.play({ fromBar: b, toBar: App.chart.order.length }); } }, '▶ ここから再生')));
    if (chord.nc || chord.bad) { box.appendChild(h('p', { class: 'muted' }, chord.bad ? 'このコードは読みとれませんでした。' : 'ノーコード（休み）です。')); return; }

    // 役割
    box.appendChild(h('h3', null, 'このコードの役割（' + info.roles.length + 'つ）'));
    const roles = h('div', { class: 'roles' });
    info.roles.forEach(r => {
      roles.appendChild(h('div', { class: 'role tone-' + (r.tone || 'x') },
        h('div', { class: 'role-h' }, h('span', { class: 'chip tone-' + (r.tone || 'x') }, r.label), h('b', null, r.title), r.kind === 'pattern' && r.primary ? h('span', { class: 'badge' }, 'この区切りでリックを当てる') : null),
        h('p', null, r.text)));
    });
    box.appendChild(roles);

    // スケール
    if (info.scales.length) {
      box.appendChild(h('h3', null, '合うスケール'));
      const list = h('div', { class: 'scales' });
      info.scales.forEach((id, k) => {
        const sc = T.SCALES[id]; if (!sc) return;
        const playing = App.playKind === 'preview' && App.previewId === 'scale:' + id;
        list.appendChild(h('div', { class: 'scale' + (k === 0 ? ' first' : '') },
          h('button', { type: 'button', class: 'mini-play', 'aria-label': sc.jp + 'を鳴らす', title: '伴奏つきで鳴らす', onclick: () => previewScale(chord, id) }, '▶'),
          h('div', { class: 'sc-body' }, h('b', null, sc.jp), h('div', { class: 'sc-notes' }, noteNames(chord, id)), h('div', { class: 'muted small' }, sc.use))));
      });
      box.appendChild(list);
    }

    // 提案：このコード（かたまり）に合うリック。楽譜つき・聴ける・ソロに採用できる
    const sg = App.suggest ? App.suggest(i, 6) : null;
    if (sg && sg.list.length) {
      box.appendChild(h('h3', null, 'ソロの提案：このコードに合うリック'));
      box.appendChild(h('p', { class: 'muted small' }, sg.ctxJp + ' 用のリック全 ' + sg.total + ' 本から、いまの難しさに近い順に ' + sg.list.length + ' 本。'));
      const cards = h('div', { class: 'cands' });
      const V = App.lickView;
      const cw = el.detail.clientWidth || 640, cols = cw >= 760 ? 2 : 1, miniW = Math.max(260, Math.floor((cw - 36 - (cols - 1) * 10) / cols - 28));
      sg.list.forEach(l => {
        const pl = V.placeLickAt(App.solo, sg.d, l), isCur = l.id === sg.current;
        const tags = h('div', { class: 'tags' }, h('span', { class: 'chip lvl' + l.lvl }, 'Lv.' + l.lvl));
        l.tags.slice(0, 4).forEach(t => tags.appendChild(h('span', { class: 'chip tag' }, t)));
        cards.appendChild(h('div', { class: 'cand' + (isCur ? ' cur' : '') },
          h('div', { class: 'cand-h' },
            h('button', { type: 'button', class: 'mini-play', 'aria-label': l.name + 'を聴く', onclick: () => V.previewLickAt(App.solo, sg.d, l) }, '▶'),
            h('b', { class: 'cand-name' }, l.name), h('div', { class: 'grow' }),
            isCur ? h('span', { class: 'badge' }, 'いまのソロで使用中')
              : sg.di >= 0 ? h('button', { type: 'button', class: 'btn sm primary', onclick: () => { App.swapLick(sg.di, l.id); U.toast('ソロの ' + (sg.di + 1) + ' 番目のフレーズを差しかえました'); } }, 'ソロに採用') : null),
          tags,
          h('div', { class: 'mini-score', html: V.miniNotation(pl, miniW) }),
          App.lickDesc(l) ? h('p', { class: 'muted small' }, App.lickDesc(l)) : null));
      });
      box.appendChild(cards);
      box.appendChild(h('div', { class: 'row gap wrap mt' },
        sg.di >= 0 ? h('button', { type: 'button', class: 'btn', onclick: () => { App.select({ dec: sg.di }); App.showTab('solo'); } }, 'ソロの楽譜で見る・ほかの候補も見る') : null));
    }

    // リックの種類
    const pools = info.pools || [];
    const ph = App.phraseOf[i];
    box.appendChild(h('h3', null, 'このコードに使えるリックの種類（辞典）'));
    const lk = h('div', { class: 'lickrefs' });
    if (ph && ph.match) {
      const m = ph.match, ctx = S.ctxOfMatch(m), n = L.byCtx[ctx] ? L.byCtx[ctx].length : 0;
      const di = App.solo.decisions.findIndex(d => d.i0 <= i && i < d.i0 + d.n);
      lk.appendChild(h('div', { class: 'lref' },
        h('div', null, h('b', null, m.pattern.jp), h('span', { class: 'muted' }, '　のフレーズ用 ' + n + '本'), h('div', { class: 'muted small' }, hs.src + 'を含む ' + m.n + ' コードのかたまり。ソロではここに1本のリックを当てます。')),
        h('div', { class: 'row gap' },
          di >= 0 ? h('button', { type: 'button', class: 'btn sm', onclick: () => { App.select({ dec: di }); App.showTab('solo'); } }, 'ソロでこのフレーズを見る') : null,
          h('button', { type: 'button', class: 'btn sm', onclick: () => App.openDict && App.openDict(ctx) }, '辞典で見る'))));
    }
    pools.forEach(p => {
      const cx = L.CTX[p.ctx], n = L.byCtx[p.ctx] ? L.byCtx[p.ctx].length : 0;
      if (!cx) return;
      lk.appendChild(h('div', { class: 'lref' },
        h('div', null, h('b', null, cx.jp), h('span', { class: 'muted' }, '　' + n + '本'), h('div', { class: 'muted small' }, cx.note)),
        h('div', { class: 'row gap' }, h('button', { type: 'button', class: 'btn sm', onclick: () => App.openDict && App.openDict(p.ctx) }, '辞典で見る'))));
    });
    box.appendChild(lk);
  }

  /* ---------------- イベントの受けとり ---------------- */
  function onChart() {
    // 入力欄からの変更なら、すでに同じ文字になっている。移調・サンプル読みこみなど、ほかからの変更のときだけ書きかえる
    if (el.text.value !== st().text) el.text.value = st().text;
    // エラー表示
    U.clear(el.errs);
    App.chart.errors.slice(0, 5).forEach(e => el.errs.appendChild(h('li', null, e.msg)));
    if (App.chart.errors.length > 5) el.errs.appendChild(h('li', null, '…ほか ' + (App.chart.errors.length - 5) + ' 件'));
    refreshSettings();
    refreshKeyInfo();
    renderGrid();
    renderDetail();
  }
  function onInit() {
    build();
    el.grid.addEventListener('click', onGridClick);
    el.grid.addEventListener('dblclick', onGridDbl);
    window.addEventListener('resize', U.debounce(() => { /* グリッドは CSS で伸縮 */ }, 200));
  }
  App.on('init', onInit);
  App.on('chart', onChart);
  App.on('sel', onSel);
  App.on('range', renderRange);
  App.on('pos', onPos);
  App.on('settings', () => { if (el.style) { refreshSettings(); } });
  App.on('playstate', () => { if (App.sel.hs != null) renderDetail(); });
  App.on('solo', () => { if (el.detail && App.sel.hs != null) renderDetail(); });
})();
