/* 基本時間割：1学期・2学期前期・2学期後期・3学期後期（設定で増やせる）ごとに、月〜金の時間割を決める。
   週行事は、その日が入る期間の基本時間割から始まり、行事・入れ替えで変わる。 */
(function () {
  const K = window.K;
  const u = K.u;
  const m = K.m;
  const ops = K.ops;
  const V = (K.views = K.views || {});
  const ui = { term: null, sel: [], zoom: Number(localStorage.getItem('kyomu-zoom') || 1.15) };
  const isSel = (wd, s, c) => ui.sel.some((x) => x.wd === wd && x.s === s && x.c === c);

  function baseCounts(termId) {
    const b = m.base(termId);
    const out = {};
    for (let wd = 1; wd <= 5; wd++)
      (m.st.daySlots[wd] || []).forEach((s) => {
        const sl = m.slot(s);
        if (!sl || !sl.counted) return;
        m.st.classes.forEach((c) => {
          const x = b.cells[`${wd}|${s}|${c.id}`];
          const sj = x && m.subject(x.t);
          if (!sj || !sj.counted) return;
          const row = (out[c.id] = out[c.id] || {});
          row[sj.code] = (row[sj.code] || 0) + 1;
        });
      });
    return out;
  }

  function countTable(termId) {
    const data = baseCounts(termId);
    const cls = m.st.classes;
    const used = new Set();
    Object.values(data).forEach((r) => Object.keys(r).forEach((k) => used.add(k)));
    const order = m.st.subjects.filter((s) => s.counted && used.has(s.code)).map((s) => s.code);
    const gsep = (i) => (i > 0 && cls[i - 1].g !== cls[i].g ? ' gsep' : '');
    return `<table class="cnt"><tr><th class="l">教科</th>${cls.map((c, i) => `<th class="${gsep(i)}">${c.id}</th>`).join('')}</tr>
      ${order.map((k) => `<tr><td class="l">${u.esc(k)}</td>${cls.map((c, i) => `<td class="${(data[c.id] || {})[k] ? '' : 'zero'}${gsep(i)}">${(data[c.id] || {})[k] || 0}</td>`).join('')}</tr>`).join('')}
      <tr class="sum"><td class="l">計</td>${cls.map((c, i) => `<td class="${gsep(i)}">${Object.values(data[c.id] || {}).reduce((a, b) => a + b, 0)}</td>`).join('')}</tr></table>`;
  }

  V.base = {
    title: '基本時間割',
    open(p) {
      if (p && p[0] && m.st.terms.some((t) => t.id === p[0])) ui.term = p[0];
      if (!ui.term || !m.st.terms.some((t) => t.id === ui.term)) {
        const t = m.termOf(u.today());
        ui.term = (t || m.st.terms[0]).id;
      }
    },
    render(el) {
      const term = m.st.terms.find((t) => t.id === ui.term);
      const hooks = {
        cellAttr: (wd, s, cs) => `data-wd="${wd}" data-s="${s}" data-c="${cs.map((c) => c.id).join(',')}" draggable="true"`,
        cellClass: (wd, s, cs) => (cs.some((c) => isSel(wd, s, c.id)) ? ' sel' : ''),
        lineAttr: (kind, wd, r) => (kind === 'st' ? `data-line="st" data-wd="${wd}" data-r="${r}"` : ''),
      };
      const others = m.st.terms.filter((t) => t.id !== ui.term);
      el.innerHTML = `<div class="view">
        <div class="card row">
          ${m.st.terms.map((t) => `<button class="btn ${t.id === ui.term ? 'on' : ''}" data-term="${t.id}">${u.esc(t.name)}</button>`).join('')}
          <span class="small muted">${term && term.start ? `${u.mdw(term.start)}〜${u.mdw(term.end)}` : '期間の日付が未設定'}（日付は「設定」で）</span>
          <span style="flex:1"></span>
          ${others.length ? `<select data-copy><option value="">ほかの期間からコピー…</option>${others.map((t) => `<option value="${t.id}">${u.esc(t.name)}の基本時間割をコピー</option>`).join('')}</select>` : ''}
          <button class="btn small" data-act="zout">－</button><button class="btn small" data-act="zin">＋</button>
          <button class="btn primary" data-act="print">印刷・PDF</button>
        </div>
        <div class="wk" style="padding:0">
          <div>
            <div class="paper-wrap"><div class="zoomer" style="zoom:${ui.zoom}">${K.sheet.page(K.sheet.base(ui.term, { hooks }))}</div></div>
            <div class="card"><h3>週の時数（この基本時間割）</h3><div style="overflow:auto">${countTable(ui.term)}</div></div>
          </div>
          <div class="side">${inspector()}</div>
        </div></div>`;
      K.sheet.fitPages(el);
      bind(el.firstElementChild, el);
    },
    printPages() {
      return { pages: [K.sheet.page(K.sheet.base(ui.term, {}))], land: false };
    },
  };

  function inspector() {
    if (!ui.sel.length)
      return `<div class="card insp"><h3>基本時間割をつくる</h3><p class="help">
        ・コマをクリックで選び、右の教科を押す（Shift で横に広げる、Ctrl/⌘ で追加）<br>
        ・<b>ドラッグで入れ替え</b><br>
        ・朝の読書・総合など学年でまとめるコマは「学年でまとめる」<br>
        ・「出張等」の欄に書いた定例の会議（④運営委員会 など）は、毎週の週行事に出ます（クリックで書く）</p></div>`;
    const x = ui.sel[0];
    const b = m.base(ui.term);
    const cur = (b.cells[`${x.wd}|${x.s}|${x.c}`] || {}).t || '';
    const subs = m.st.subjects.filter((s) => s.counted && s.code !== '行事');
    const sameRow = ui.sel.every((y) => y.wd === x.wd && y.s === x.s);
    const merged = !!(b.cells[`${x.wd}|${x.s}|${x.c}`] || {}).m;
    return `<div class="card insp">
      <div class="where">${ui.sel.length > 1 ? `${ui.sel.length}コマを選択中` : `${u.WD[x.wd]}曜 ${m.slotName(x.s)}　${x.c}`}</div>
      ${ui.sel.length === 1 ? `<div class="now">${u.esc(cur || '（空き）')}</div>` : ''}
      <div class="grid-btn">${subs.map((s) => `<button data-set="${u.esc(s.code)}" class="${cur === s.code ? 'cur' : ''}" title="${u.esc(s.name)}">${u.esc(s.code)}</button>`).join('')}</div>
      <div class="grid-btn">${['読書', 'C', '自習', ''].map((t) => `<button data-set="${u.esc(t)}">${t ? u.esc(t) : '空き'}</button>`).join('')}</div>
      <div class="row"><input type="text" data-free placeholder="ほかの文字" style="flex:1"><button class="btn small" data-act="free">入れる</button></div>
      ${sameRow ? `<div class="sec row"><b class="small">1くくり</b><button class="btn small" data-merge="grade">${m.cls(x.c).g}年でまとめる</button><button class="btn small" data-merge="all">全校でまとめる</button>${ui.sel.length > 1 ? '<button class="btn small" data-merge="sel">選んだクラスで</button>' : ''}${merged ? '<button class="btn small" data-act="unmerge">まとめを解除</button>' : ''}</div>` : ''}
    </div>`;
  }

  function bind(root, el) {
    const redraw = () => V.base.render(el);
    root.addEventListener('click', async (e) => {
      const t = e.target.closest('[data-term]');
      if (t) {
        ui.sel = [];
        return K.app.go('base', t.dataset.term);
      }
      const a = e.target.closest('[data-act]');
      if (a) {
        if (a.dataset.act === 'print') return K.print.direct({ kind: 'base' });
        if (a.dataset.act === 'zin' || a.dataset.act === 'zout') {
          ui.zoom = Math.max(0.6, Math.min(2, Math.round((ui.zoom + (a.dataset.act === 'zin' ? 0.1 : -0.1)) * 10) / 10));
          localStorage.setItem('kyomu-zoom', ui.zoom);
          return redraw();
        }
        if (a.dataset.act === 'free') return ops.baseSet(ui.term, ui.sel, root.querySelector('[data-free]').value.trim());
        if (a.dataset.act === 'unmerge') {
          const x = ui.sel[0];
          return ops.baseUnmerge(ui.term, x.wd, x.s, m.st.classes.map((c) => c.id));
        }
      }
      const sb = e.target.closest('[data-set]');
      if (sb) return ops.baseSet(ui.term, ui.sel, sb.dataset.set);
      const mb = e.target.closest('[data-merge]');
      if (mb) {
        const x = ui.sel[0];
        const g = m.cls(x.c).g;
        const cls = mb.dataset.merge === 'grade' ? m.st.classes.filter((c) => c.g === g).map((c) => c.id) : mb.dataset.merge === 'all' ? m.st.classes.map((c) => c.id) : ui.sel.map((y) => y.c);
        const cur = (m.base(ui.term).cells[`${x.wd}|${x.s}|${x.c}`] || {}).t || '';
        const text = await u.ask('まとめた枠に入れる文字', cur, { help: '例：読書・総' });
        if (text == null) return;
        ops.baseMerge(ui.term, x.wd, x.s, cls, text.trim());
        ui.sel = cls.map((c) => ({ wd: x.wd, s: x.s, c }));
        return;
      }
      const td = e.target.closest('td');
      if (!td) return;
      if (td.classList.contains('c') && td.dataset.wd) {
        const wd = Number(td.dataset.wd);
        const s = td.dataset.s;
        const cs = td.dataset.c.split(',');
        const cells = cs.map((c) => ({ wd, s, c }));
        if (e.shiftKey && ui.sel.length && ui.sel[0].wd === wd && ui.sel[0].s === s) {
          const ids = m.st.classes.map((c) => c.id);
          const i0 = ids.indexOf(ui.sel[0].c);
          const i1 = ids.indexOf(cs[cs.length - 1]);
          ui.sel = ids.slice(Math.min(i0, i1), Math.max(i0, i1) + 1).map((c) => ({ wd, s, c }));
        } else if (e.ctrlKey || e.metaKey) ui.sel = ui.sel.concat(cells);
        else ui.sel = cells;
        return redraw();
      }
      if (td.dataset.line === 'st') {
        const wd = td.dataset.wd;
        const r = td.dataset.r;
        const b = m.base(ui.term);
        const cur = b.staff[`${wd}|${r}`] || '';
        const v = await u.ask(`${u.WD[wd]}曜 ${Number(r) + 1}行目の「出張等」`, cur, { help: '毎週の定例（④運営委員会 など）。空にすると消します。' });
        if (v == null) return;
        K.store.commit('定例の書きこみ', () => {
          if (v.trim()) b.staff[`${wd}|${r}`] = v.trim();
          else delete b.staff[`${wd}|${r}`];
        });
      }
    });
    const cp = root.querySelector('[data-copy]');
    if (cp)
      cp.addEventListener('change', async () => {
        const from = cp.value;
        if (!from) return;
        const ft = m.st.terms.find((t) => t.id === from);
        if (!(await u.confirm(`「${ft.name}」の基本時間割を、いまの期間にコピーします（いまの内容は上書き）。`, 'コピーする'))) return (cp.value = '');
        K.store.commit('基本時間割をコピー', (st) => (st.bases[ui.term] = u.clone(st.bases[from] || { cells: {}, staff: {} })));
      });
    // ドラッグで入れ替え
    const sheet = root.querySelector('.xs');
    let from = null;
    sheet.addEventListener('dragstart', (e) => {
      const td = e.target.closest('td.c');
      if (!td || !td.dataset.wd) return;
      from = { wd: Number(td.dataset.wd), s: td.dataset.s, c: td.dataset.c.split(',')[0] };
      e.dataTransfer.setData('text/plain', 'swap');
    });
    sheet.addEventListener('dragover', (e) => {
      if (from && e.target.closest('td.c')) e.preventDefault();
    });
    sheet.addEventListener('drop', (e) => {
      const td = e.target.closest('td.c');
      if (!from || !td || !td.dataset.wd) return;
      e.preventDefault();
      const cs = td.dataset.c.split(',');
      const to = { wd: Number(td.dataset.wd), s: td.dataset.s, c: cs.includes(from.c) ? from.c : cs[0] };
      ops.baseSwap(ui.term, from, to);
      from = null;
    });
    const free = root.querySelector('[data-free]');
    if (free) free.addEventListener('keydown', (e) => e.key === 'Enter' && ops.baseSet(ui.term, ui.sel, free.value.trim()));
  }
})();
