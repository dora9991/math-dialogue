/* 連絡のテンプレート：件名・本文のひな形。{{氏名}} などの差しこみが使える。
   申込のときに自動で送る確認メールは ev.form.confirmTemplate（テンプレートの id）。 */
(function () {
  'use strict';
  const { html, icon } = T;
  const CATS = ['申込', '入金', '当日', '大会後', '発表', 'その他'];
  const cats = (ev) => { const s = new Set(CATS); for (const t of ev.templates) if (t.cat) s.add(t.cat); return [...s]; };
  const samplePerson = (ev) => T.active(ev)[0] || ev.people[0] || null;

  const FIELDS = [
    { k: 'name', label: 'テンプレートの名前', required: true, placeholder: '例：1週間前のご案内' },
    { k: 'cat', label: '分類', placeholder: '申込・入金・当日 など', help: '一覧のまとまりになります。新しい分類も書けます。' },
    { k: 'subject', label: '件名', full: true, required: true, placeholder: '【{{大会名}}】…' },
    { k: 'body', label: '本文', type: 'textarea', rows: 12, required: true },
  ];

  async function edit(t) {
    const ev = T.ev();
    const isNew = !t;
    await T.editRecord({
      title: isNew ? 'テンプレートを足す' : 'テンプレートを直す', wide: true,
      fields: FIELDS, value: t || { cat: 'その他', subject: '【{{大会名}}】', body: '{{氏名}} 様\n\n\n\n{{事務局}}' },
      extra: String(html`${T.varChips('in-modal')}<p class="help">押すと、さいごにさわった欄（件名か本文）のカーソルの位置に入ります。</p><datalist id="tpl-cats">${cats(ev).map((c) => html`<option value="${c}">`)}</datalist>`),
      onOpen(w) {
        const cat = w.querySelector('[name="cat"]');
        if (cat) cat.setAttribute('list', 'tpl-cats');
        T.bindVarChips(w, '[name="subject"],[name="body"]', '[name="body"]');
      },
      onDelete: isNew ? null : () => {
        if (ev.form.confirmTemplate === t.id) ev.form.confirmTemplate = '';
        T.removeFrom(ev.templates, t.id);
        T.logIt(`テンプレート「${t.name}」を削除`, T.who());
        T.save(); T.refresh(); T.toast('削除しました');
      },
      onSave(v) {
        v.cat = v.cat || 'その他';
        if (isNew) { ev.templates.push(Object.assign({ id: T.uid('t') }, v)); T.logIt(`テンプレート「${v.name}」を追加`, T.who()); }
        else Object.assign(t, v);
        T.save(); T.refresh(); T.toast('保存しました');
      },
    });
  }

  function preview(t) {
    const ev = T.ev();
    const p = samplePerson(ev);
    const r = p ? T.mail.render(t, p, ev) : { subject: T.merge(t.subject, T.vars(null, ev)), body: T.merge(t.body, T.vars(null, ev)) };
    T.modal({
      title: '見本：' + t.name, wide: true,
      body: String(html`<p class="small muted">${p ? `${T.pname(p)} さん（${p.code}）に差しこんだ見本です。` : '参加者がいないので、大会の情報だけを差しこんだ見本です。'}</p>
        <div class="mail-sheet"><div class="mail-subj">${T.markVars(r.subject)}</div><div class="mail-text">${T.markVars(r.body)}</div></div>`),
      actions: [{ label: '閉じる', value: 'cancel' }, { label: 'このテンプレートで送る', kind: 'primary', value: 'send' }],
    }).then((v) => { if (v === 'send') useIt(t.id); });
  }
  const useIt = (id) => { T.ui.mailPreset = { templateId: id }; T.go('admin/mail'); };

  T.page('admin', 'templates', {
    title: 'テンプレート', icon: 'template', group: '連絡', order: 20,
    lead: 'よく送る連絡のひな形です。{{氏名}}・{{受付番号}}・{{マイページ}} などは、送るときに1人ずつの内容に置きかわります。',
    head() { return html`<button class="btn primary" data-act="add">${icon('plus')} テンプレートを足す</button>`; },
    render() {
      const ev = T.ev();
      const st = T.uiState('templates', { cat: '' });
      const all = cats(ev).filter((c) => ev.templates.some((t) => (t.cat || 'その他') === c));
      const shown = st.cat ? all.filter((c) => c === st.cat) : all;
      return html`<div class="toolbar">
          <div class="seg" role="group" aria-label="分類">
            <button data-act="cat" data-v="" aria-pressed="${!st.cat}">すべて（${ev.templates.length}）</button>
            ${all.map((c) => html`<button data-act="cat" data-v="${c}" aria-pressed="${st.cat === c}">${c}</button>`)}
          </div>
        </div>
        ${ev.templates.length ? html`<div class="tpl-grid">${shown.flatMap((c) => ev.templates.filter((t) => (t.cat || 'その他') === c)).map((t) => html`<article class="card tpl-card">
            <div class="tpl-top">
              <span class="chip">${t.cat || 'その他'}</span>
              ${ev.form.confirmTemplate === t.id ? html`<span class="chip pri" title="申込フォームの設定で決めています">${icon('send')} 申込のとき自動で送る</span>` : ''}
            </div>
            <h3>${t.name}</h3>
            <div class="tpl-subj">${T.markVars(t.subject)}</div>
            <div class="tpl-body">${T.markVars(t.body)}</div>
            <div class="row tpl-actions">
              <button class="btn sm primary" data-act="use" data-id="${t.id}">${icon('send')} このテンプレートで送る</button>
              <button class="btn sm" data-act="preview" data-id="${t.id}">${icon('eye')} 見本</button>
              <span class="spacer"></span>
              <button class="btn sm ghost" data-act="dup" data-id="${t.id}" title="複製">${icon('copy')}<span class="sr">複製</span></button>
              <button class="btn sm ghost" data-act="edit" data-id="${t.id}">${icon('edit')} 直す</button>
            </div>
          </article>`)}</div>` : html`<div class="empty">テンプレートがありません。「テンプレートを足す」から作れます。</div>`}`;
    },
    acts: {
      add() { edit(null); },
      cat(el) { T.uiState('templates', {}).cat = el.dataset.v; T.refresh(); },
      edit(el) { edit(T.find(T.ev().templates, el.dataset.id)); },
      preview(el) { preview(T.find(T.ev().templates, el.dataset.id)); },
      use(el) { useIt(el.dataset.id); },
      dup(el) {
        const ev = T.ev();
        const t = T.find(ev.templates, el.dataset.id);
        const c = Object.assign(T.clone(t), { id: T.uid('t'), name: t.name + '（コピー）' });
        ev.templates.splice(ev.templates.indexOf(t) + 1, 0, c);
        T.save(); T.refresh(); T.toast('複製しました');
      },
    },
  });
})();
