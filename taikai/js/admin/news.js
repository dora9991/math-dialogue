/* お知らせ：公開サイトのホームと #/news に出る。固定（いちばん上）・公開/下書き・メールでも知らせる */
(function () {
  'use strict';
  const { html, icon } = T;
  const CATS = ['重要', 'お知らせ', '申込', '資料', '配信', '当日'];

  T.page('admin', 'news', {
    title: 'お知らせ', icon: 'megaphone', group: '広報', order: 10,
    lead: '公開サイトのホームと「お知らせ」のページに、新しい順に出ます。固定したものは、いちばん上に出ます。',
    head() { return html`<a class="btn" href="#/news" target="_blank" rel="noopener">${icon('eye')} 公開サイトで見る</a><button class="btn primary" data-act="add">${icon('plus')} お知らせを書く</button>`; },
    render() {
      const ev = T.ev();
      const list = ev.news.slice().sort((a, b) => (b.pinned - a.pinned) || (a.date < b.date ? 1 : -1));
      if (!list.length) return html`<div class="empty">お知らせはまだありません。<br><button class="btn primary" data-act="add" style="margin-top:10px">${icon('plus')} 書く</button></div>`;
      return html`<div class="list">${list.map((n) => html`<div class="item ${n.published ? '' : 'draft'}">
        <div class="item-main">
          <div class="item-meta"><span class="num">${T.dot(n.date)}</span><span class="chip ${n.cat === '重要' ? 'bad' : 'pri'}">${n.cat}</span>${n.pinned ? html`<span class="chip gold">${icon('pushpin')} 固定</span>` : ''}${n.published ? html`<span class="chip ok">公開中</span>` : html`<span class="chip">下書き</span>`}</div>
          <div class="item-title">${n.title}</div>
          <p class="small muted clamp2">${n.body}</p>
        </div>
        <div class="item-actions">
          <button class="btn sm ghost" data-act="pin" data-id="${n.id}" title="${n.pinned ? '固定をやめる' : 'いちばん上に固定'}">${n.pinned ? '固定をやめる' : '固定'}</button>
          <button class="btn sm ghost" data-act="pub" data-id="${n.id}">${n.published ? '下書きにもどす' : '公開する'}</button>
          <button class="btn sm ghost" data-act="mail" data-id="${n.id}" title="この内容で一斉連絡">${icon('mail')}</button>
          <button class="btn sm" data-act="edit" data-id="${n.id}">${icon('edit')} 直す</button>
        </div>
      </div>`)}</div>`;
    },
    acts: {
      add() { edit(null); },
      edit(el) { edit(T.find(T.ev().news, el.dataset.id)); },
      pin(el) { const n = T.find(T.ev().news, el.dataset.id); n.pinned = !n.pinned; T.save(); T.refresh(); },
      pub(el) { const n = T.find(T.ev().news, el.dataset.id); n.published = !n.published; T.logIt(`お知らせ「${n.title}」を${n.published ? '公開' : '下書きに'}`, T.who()); T.save(); T.refresh(); },
      mail(el) {
        const n = T.find(T.ev().news, el.dataset.id);
        T.ui.mailPreset = { subject: `【{{大会名}}】${n.title}`, body: `{{氏名}} 様\n\n${n.body.replace(/\*\*/g, '')}\n\nくわしくは大会ホームページをご覧ください。\n{{サイト}}\n\n{{事務局}}` };
        T.go('admin/mail');
      },
    },
  });

  function edit(n) {
    const ev = T.ev();
    T.editRecord({
      title: n ? 'お知らせを直す' : 'お知らせを書く', wide: true,
      value: n || { date: T.today(), cat: 'お知らせ', published: true, pinned: false },
      fields: [
        { k: 'date', label: '日付', type: 'date', required: true },
        { k: 'cat', label: '分類', type: 'select', options: CATS },
        { k: 'title', label: '題名', required: true, full: true },
        { k: 'body', label: '本文', type: 'textarea', rows: 8, help: '**太字** と、URL（自動でリンクになる）が使えます。' },
        { k: 'published', label: '', type: 'check', text: '公開する（外すと下書き）' },
        { k: 'pinned', label: '', type: 'check', text: 'いちばん上に固定する' },
      ],
      onSave(v) {
        if (n) Object.assign(n, v); else ev.news.push(Object.assign({ id: T.uid('n') }, v));
        T.logIt(`お知らせ「${v.title}」を${n ? '直しました' : '書きました'}`, T.who());
        T.save(); T.refresh(); T.toast('保存しました');
      },
      onDelete: n ? () => { T.removeFrom(ev.news, n.id); T.save(); T.refresh(); } : null,
    });
  }
})();
