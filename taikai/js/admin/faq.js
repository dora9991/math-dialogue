/* Q&A：よくある質問。公開サイトの #/faq に、分類ごとに出る（公開にしたものだけ）。
   並び順は ev.faq の順。分類の中で「上へ・下へ」で入れかえる。 */
(function () {
  'use strict';
  const { html, icon } = T;
  const st = () => T.uiState('faq', { cat: '', q: '' });
  const catsOf = (ev) => [...new Set(ev.faq.map((f) => f.cat || 'その他'))];

  async function edit(f) {
    const ev = T.ev();
    const isNew = !f;
    await T.editRecord({
      title: isNew ? 'Q&A を足す' : 'Q&A を直す', wide: true,
      fields: [
        { k: 'cat', label: '分類', placeholder: '申込・参加費／当日 など', help: '公開サイトでは、分類ごとにまとまって出ます。' },
        { k: 'published', label: '公開', type: 'check', text: '公開サイトに出す' },
        { k: 'q', label: '質問', type: 'textarea', rows: 2, required: true },
        { k: 'a', label: '答え', type: 'textarea', rows: 6, required: true, help: '**太字** と改行が使えます。URL はリンクになります。' },
      ],
      value: f || { cat: st().cat || (catsOf(ev)[0] || 'その他'), published: true },
      extra: String(html`<datalist id="faq-cats">${catsOf(ev).map((c) => html`<option value="${c}">`)}</datalist>`),
      onOpen(w) { const c = w.querySelector('[name="cat"]'); if (c) c.setAttribute('list', 'faq-cats'); },
      onDelete: isNew ? null : () => { T.removeFrom(ev.faq, f.id); T.logIt(`Q&A「${f.q.slice(0, 20)}」を削除`, T.who()); T.save(); T.refresh(); T.toast('削除しました'); },
      onSave(v) {
        v.cat = v.cat || 'その他';
        if (isNew) { ev.faq.push(Object.assign({ id: T.uid('q') }, v)); T.logIt(`Q&A「${v.q.slice(0, 20)}」を追加`, T.who()); }
        else Object.assign(f, v);
        T.save(); T.refresh(); T.toast('保存しました');
      },
    });
  }

  // 同じ分類の中で、となりと入れかえる
  function move(id, dir) {
    const ev = T.ev();
    const i = ev.faq.findIndex((x) => x.id === id);
    if (i < 0) return;
    const cat = ev.faq[i].cat || 'その他';
    let j = i + dir;
    while (j >= 0 && j < ev.faq.length && (ev.faq[j].cat || 'その他') !== cat) j += dir;
    if (j < 0 || j >= ev.faq.length) return;
    [ev.faq[i], ev.faq[j]] = [ev.faq[j], ev.faq[i]];
    T.save(); T.refresh();
  }

  T.page('admin', 'faq', {
    title: 'Q&A', icon: 'help', group: '広報', order: 40,
    lead: 'よくある質問です。公開にしたものが、公開サイトの「Q&A」に分類ごとに出ます。問い合わせの画面から、やり取りをそのまま Q&A にすることもできます。',
    head() { return html`<a class="btn ghost" href="#/faq" target="_blank" rel="noopener">${icon('external')} 公開サイトで見る</a><button class="btn primary" data-act="add">${icon('plus')} Q&amp;A を足す</button>`; },
    render() {
      const ev = T.ev(), s = st();
      const q = s.q.trim().toLowerCase();
      const cats = catsOf(ev);
      if (s.cat && !cats.includes(s.cat)) s.cat = '';
      const list = ev.faq.filter((f) => (!s.cat || (f.cat || 'その他') === s.cat) && (!q || (f.q + ' ' + f.a + ' ' + f.cat).toLowerCase().includes(q)));
      const pub = ev.faq.filter((f) => f.published).length;
      return html`<div class="toolbar">
          ${T.searchBox('faq', s.q, '質問・答えでさがす')}
          <select data-faq-cat aria-label="分類"><option value="">すべての分類（${ev.faq.length}）</option>${cats.map((c) => html`<option ${s.cat === c ? T.raw('selected') : ''}>${c}</option>`)}</select>
          <span class="small muted">公開 ${pub}・非公開 ${ev.faq.length - pub}</span>
        </div>
        ${!ev.faq.length ? html`<div class="empty">Q&A がありません。「Q&A を足す」から作れます。</div>`
          : !list.length ? html`<div class="empty">見つかりませんでした。</div>`
            : cats.filter((c) => list.some((f) => (f.cat || 'その他') === c)).map((c) => {
              const inCat = list.filter((f) => (f.cat || 'その他') === c);
              const allInCat = ev.faq.filter((f) => (f.cat || 'その他') === c);
              return html`<h2 class="section-title">${icon('tag')} ${c} <span class="chip">${inCat.length}</span></h2>
              <div class="list">${inCat.map((f) => {
                const k = allInCat.indexOf(f);
                return html`<article class="item afaq-item ${f.published ? '' : 'is-off'}">
                  <div class="afaq-move">
                    <button class="icon-btn" data-act="up" data-id="${f.id}" aria-label="上へ" ${k === 0 ? T.raw('disabled') : ''}>${T.raw('<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 15l6-6 6 6"/></svg>')}</button>
                    <button class="icon-btn" data-act="down" data-id="${f.id}" aria-label="下へ" ${k === allInCat.length - 1 ? T.raw('disabled') : ''}>${T.raw('<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>')}</button>
                  </div>
                  <div class="item-main">
                    <div class="afaq-q"><span class="qa-mark q">Q</span><b>${f.q}</b></div>
                    <div class="afaq-a"><span class="qa-mark a">A</span><span>${T.text(f.a)}</span></div>
                  </div>
                  <div class="item-actions afaq-acts">
                    <button class="btn sm ${f.published ? '' : 'ghost'}" data-act="toggle" data-id="${f.id}" aria-pressed="${!!f.published}" title="押すと切りかわります">${f.published ? html`<span class="dot ok-dot"></span> 公開中` : html`<span class="dot off-dot"></span> 非公開`}</button>
                    <button class="btn sm ghost" data-act="edit" data-id="${f.id}">${icon('edit')} 直す</button>
                  </div>
                </article>`;
              })}</div>`;
            })}`;
    },
    mount(root) {
      T.bindSearch(root, 'faq', (v) => { st().q = v; });
      const sel = root.querySelector('[data-faq-cat]');
      if (sel) sel.addEventListener('change', () => { st().cat = sel.value; T.refresh(); });
    },
    acts: {
      add() { edit(null); },
      edit(el) { edit(T.find(T.ev().faq, el.dataset.id)); },
      up(el) { move(el.dataset.id, -1); },
      down(el) { move(el.dataset.id, 1); },
      toggle(el) {
        const f = T.find(T.ev().faq, el.dataset.id);
        f.published = !f.published;
        T.save(); T.refresh();
        T.toast(f.published ? '公開しました' : '非公開にしました');
      },
    },
  });
})();
