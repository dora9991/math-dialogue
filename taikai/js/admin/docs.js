/* 資料（PDF）：ファイルを入れる（ボタン・ドラッグ）、分類・見られる人、開く・見る・ダウンロード・差しかえ・並べかえ・削除
   ファイルの中身は T.files（このブラウザの IndexedDB）、一覧の情報は ev.docs に入れる。 */
(function () {
  'use strict';
  const { html, icon } = T;

  const CATS = ['案内', '発表', '会場', '当日', 'その他'];
  const ACCEPT = 'application/pdf,image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt';
  const LIMIT = 20 * 1024 * 1024;
  const VIS_CHIP = { public: 'ok', member: 'info', staff: 'warn' };
  const VIS_SHORT = { public: 'だれでも', member: '参加者だけ', staff: '運営だけ' };

  const kindOf = (d) => {
    const n = (d.fileName || '').toLowerCase(), t = d.type || '';
    if (t === 'application/pdf' || n.endsWith('.pdf')) return ['PDF', 'pdf'];
    if (t.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/.test(n)) return ['画像', 'img'];
    if (/\.docx?$/.test(n)) return ['Word', 'doc'];
    if (/\.xlsx?$|\.csv$/.test(n)) return ['Excel', 'xls'];
    if (/\.pptx?$/.test(n)) return ['PPT', 'ppt'];
    return ['ファイル', 'other'];
  };
  const isPdf = (d) => kindOf(d)[1] === 'pdf';
  const baseName = (n) => String(n || '').replace(/\.[^.]+$/, '');

  const docFields = () => [
    { k: 'title', label: '題名', required: true, full: true },
    { k: 'cat', label: '分類', type: 'select', options: CATS },
    { k: 'visibility', label: '見られる人', type: 'select', options: Object.entries(T.VIS) },
    { k: 'note', label: '説明（一覧に小さく出る）', full: true, placeholder: '例：日程・会場・参加費（仮）' },
  ];

  async function addFiles(files) {
    const ev = T.ev();
    for (const file of files) {
      if (!file) continue;
      if (file.size > LIMIT && !(await T.confirm(`「${file.name}」は ${T.size(file.size)} あります。ブラウザの保存場所には限りがあるので、20MB より小さくする（PDF を圧縮する・分ける）のがおすすめです。このまま入れますか？`, { ok: '入れる' }))) continue;
      const v = await T.editRecord({
        title: '資料を入れる', lead: `${file.name}（${T.size(file.size)}）`,
        fields: docFields(), value: { title: baseName(file.name), cat: '案内', visibility: 'public', note: '' }, saveLabel: '入れる',
      });
      if (!v) continue;
      const doc = { id: T.uid('doc'), title: v.title, cat: v.cat, note: v.note, fileName: file.name, size: file.size, type: file.type || '', visibility: v.visibility, at: T.now(), hasFile: true };
      await T.files.put(T.fileKey(ev.id, doc.id), file);
      ev.docs.push(doc);
      T.logIt(`資料「${doc.title}」を入れました`, T.who());
      T.save(); T.refresh();
      T.toast('入れました：' + doc.title);
    }
  }

  function itemHtml(d, i, ev) {
    const [kl, kc] = kindOf(d);
    const same = ev.docs.filter((x) => (x.cat || 'その他') === (d.cat || 'その他'));
    const k = same.indexOf(d);
    return html`<li class="doc-item item">
      <span class="doc-icon k-${kc}" aria-hidden="true">${kl}</span>
      <div class="item-main">
        <div class="item-title">${d.title}</div>
        <div class="item-meta">
          <span class="chip ${VIS_CHIP[d.visibility] || ''}">${VIS_SHORT[d.visibility] || d.visibility}</span>
          ${d.hasFile ? html`<span>${d.size ? T.size(d.size) : ''}</span>` : html`<span class="chip bad">ファイルなし</span>`}
          <span>${T.dot(d.at)}</span>
          <span class="doc-fname">${d.fileName || ''}</span>
        </div>
        ${d.note ? html`<div class="small muted">${d.note}</div>` : ''}
      </div>
      <div class="item-actions doc-acts">
        ${d.hasFile && isPdf(d) ? html`<button class="btn sm" data-act="view" data-id="${d.id}">${icon('eye')} 見る</button>` : ''}
        ${d.hasFile ? html`<button class="icon-btn" data-act="open" data-id="${d.id}" title="新しいタブで開く" aria-label="新しいタブで開く">${icon('external')}</button><button class="icon-btn" data-act="dl" data-id="${d.id}" title="ダウンロード" aria-label="ダウンロード">${icon('download')}</button>` : ''}
        <button class="icon-btn" data-act="replace" data-id="${d.id}" title="ファイルを差しかえる" aria-label="ファイルを差しかえる">${icon('swap')}</button>
        <button class="icon-btn" data-act="up" data-id="${d.id}" ${k === 0 ? T.raw('disabled') : ''} title="上へ" aria-label="上へ">↑</button>
        <button class="icon-btn" data-act="down" data-id="${d.id}" ${k === same.length - 1 ? T.raw('disabled') : ''} title="下へ" aria-label="下へ">↓</button>
        <button class="icon-btn" data-act="edit" data-id="${d.id}" title="直す" aria-label="直す">${icon('edit')}</button>
        <button class="icon-btn danger-ic" data-act="del" data-id="${d.id}" title="削除" aria-label="削除">${icon('trash')}</button>
      </div>
    </li>`;
  }

  // 同じ分類の中で、となりと入れかえる
  function move(id, dir) {
    const ev = T.ev();
    const d = T.find(ev.docs, id);
    if (!d) return;
    const same = ev.docs.filter((x) => (x.cat || 'その他') === (d.cat || 'その他'));
    const other = same[same.indexOf(d) + dir];
    if (!other) return;
    const a = ev.docs.indexOf(d), b = ev.docs.indexOf(other);
    [ev.docs[a], ev.docs[b]] = [ev.docs[b], ev.docs[a]];
    T.save(); T.refresh();
  }

  T.page('admin', 'docs', {
    title: '資料（PDF）', icon: 'file', group: '広報', order: 20,
    lead: '案内・要項・会場図などのファイルを載せます。「参加者だけ」にした資料は、マイページに入った人だけが見られます。',
    head() { return html`<a class="btn" href="#/docs" target="_blank" rel="noopener">${icon('external')} 公開の資料ページ</a><button class="btn primary" data-act="pick">${icon('upload')} ファイルを入れる</button>`; },
    render() {
      const ev = T.ev();
      const cats = [...CATS, ...[...new Set(ev.docs.map((d) => d.cat || 'その他'))].filter((c) => !CATS.includes(c))];
      const groups = cats.map((c) => [c, ev.docs.filter((d) => (d.cat || 'その他') === c)]).filter(([, l]) => l.length);
      const total = T.sum(ev.docs, (d) => d.size || 0);
      return html`<div class="drop-zone" data-drop>
          ${icon('upload', 'drop-ic')}
          <div><b>ここにファイルをドラッグ</b>、または <button class="btn sm" data-act="pick">ファイルを選ぶ</button></div>
          <div class="small muted">PDF のほか、画像・Word・Excel・PowerPoint も入れられます（1つ 20MB まで がめやす）</div>
        </div>
        <p class="note small" style="margin:12px 0 18px">いまは、ファイルを<b>このブラウザの中</b>に保存しています（${ev.docs.length} 件・${T.size(total || 0)}）。ほかの端末からは見えません。本番では、サーバー（Google ドライブなど）に置く形にします。</p>
        ${groups.length ? groups.map(([c, list]) => html`<h2 class="section-title">${c}<span class="chip">${list.length}</span></h2><ul class="list doc-list">${list.map((d) => itemHtml(d, ev.docs.indexOf(d), ev))}</ul>`) : html`<div class="empty">まだ資料がありません。上の枠にファイルをドラッグしてください。</div>`}`;
    },
    mount(root) {
      const z = root.querySelector('[data-drop]');
      if (!z) return;
      const on = (e) => { e.preventDefault(); z.classList.add('drag-over'); };
      const off = () => z.classList.remove('drag-over');
      z.addEventListener('dragenter', on);
      z.addEventListener('dragover', on);
      z.addEventListener('dragleave', off);
      z.addEventListener('drop', (e) => { e.preventDefault(); off(); addFiles([...(e.dataTransfer && e.dataTransfer.files ? e.dataTransfer.files : [])]); });
    },
    acts: {
      async pick() { const f = await T.pickFile(ACCEPT); if (f) addFiles([f]); },
      open(el) { const d = T.find(T.ev().docs, el.dataset.id); if (d) T.openFile(T.ev().id, d); },
      async dl(el) {
        const ev = T.ev(), d = T.find(ev.docs, el.dataset.id);
        const blob = d && (await T.files.get(T.fileKey(ev.id, d.id)));
        if (!blob) return T.toast('このブラウザにはファイルがありません', 'bad');
        T.download(d.fileName || d.title + '.pdf', blob);
      },
      async view(el) {
        const ev = T.ev(), d = T.find(ev.docs, el.dataset.id);
        const blob = d && (await T.files.get(T.fileKey(ev.id, d.id)));
        if (!blob) return T.toast('このブラウザにはファイルがありません', 'bad');
        const url = URL.createObjectURL(blob.type ? blob : new Blob([blob], { type: 'application/pdf' }));
        await T.modal({
          title: d.title, wide: true, cls: 'doc-modal',
          body: String(html`<iframe class="doc-frame" src="${url}" title="${d.title}"></iframe><p class="small muted" style="margin:8px 0 0">うまく出ないときは「新しいタブで開く」を使ってください。</p>`),
          actions: [{ label: '閉じる', value: 'cancel' }],
        });
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      },
      async edit(el) {
        const ev = T.ev(), d = T.find(ev.docs, el.dataset.id);
        if (!d) return;
        await T.editRecord({
          title: '資料を直す', lead: d.fileName ? `${d.fileName}${d.size ? `（${T.size(d.size)}）` : ''}` : '', fields: docFields(), value: d,
          onSave(v) { Object.assign(d, v); T.logIt(`資料「${d.title}」を直しました`, T.who()); T.save(); T.refresh(); T.toast('保存しました'); },
          onDelete() { del(d); },
        });
      },
      async replace(el) {
        const ev = T.ev(), d = T.find(ev.docs, el.dataset.id);
        if (!d) return;
        const file = await T.pickFile(ACCEPT);
        if (!file) return;
        if (file.size > LIMIT && !(await T.confirm(`${T.size(file.size)} あります。このまま差しかえますか？`, { ok: '差しかえる' }))) return;
        await T.files.put(T.fileKey(ev.id, d.id), file);
        Object.assign(d, { fileName: file.name, size: file.size, type: file.type || '', at: T.now(), hasFile: true });
        T.logIt(`資料「${d.title}」のファイルを差しかえました`, T.who());
        T.save(); T.refresh();
        T.toast('差しかえました');
      },
      up(el) { move(el.dataset.id, -1); },
      down(el) { move(el.dataset.id, 1); },
      async del(el) {
        const d = T.find(T.ev().docs, el.dataset.id);
        if (d && (await T.confirm(`資料「${d.title}」を削除します。ファイルも消えます。よろしいですか？`, { danger: true, ok: '削除する' }))) del(d);
      },
    },
  });

  function del(d) {
    const ev = T.ev();
    T.removeFrom(ev.docs, d.id);
    T.files.del(T.fileKey(ev.id, d.id));
    T.logIt(`資料「${d.title}」を削除しました`, T.who());
    T.save(); T.refresh();
    T.toast('削除しました');
  }
})();
