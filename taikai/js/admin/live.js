/* 配信（YouTube）：ライブ・アーカイブ・紹介動画の一覧、URL から動画を読む（サムネイル・埋めこみの見本）、
   「いま配信中」の切りかえ（公開サイトのホームに LIVE の帯が出る）、大会チャンネルの URL */
(function () {
  'use strict';
  const { html, icon } = T;

  const KIND = { live: 'ライブ', archive: 'アーカイブ', info: '紹介' };
  const VIS = { public: 'だれでも', member: '参加者だけ（マイページ）', hidden: '非公開（下書き）' };
  const VIS_CHIP = { public: 'ok', member: 'info', hidden: 'warn' };

  const when = (v) => (v ? T.dateJa(v.slice(0, 10), { year: false }) + (v.length > 10 ? ' ' + v.slice(11, 16) : '') : '');
  const sorted = (list) => list.slice().sort((a, b) => (a.when ? 0 : 1) - (b.when ? 0 : 1) || String(a.when || '').localeCompare(String(b.when || '')));

  const fields = () => [
    { k: 'title', label: '題名', required: true, full: true },
    { k: 'url', label: 'YouTube の URL', full: true, placeholder: 'https://www.youtube.com/watch?v=… や https://youtu.be/…', help: 'ライブのURL（youtube.com/live/…）でも、動画のID（11文字）だけでもかまいません。まだ決まっていなければ空のままで。' },
    { k: 'kind', label: '種類', type: 'select', options: Object.entries(KIND) },
    { k: 'when', label: '日時（予定）', type: 'datetime' },
    { k: 'visibility', label: '見られる人', type: 'select', options: Object.entries(VIS) },
    { k: 'note', label: '説明', type: 'textarea', rows: 2 },
  ];

  // URL の欄の下に、読めた動画の見本を出す
  function previewHtml(url) {
    const s = String(url || '').trim();
    if (!s) return html`<p class="small muted">URL を入れると、ここに動画の見本が出ます。</p>`;
    const id = T.ytId(s);
    if (!id) return html`<p class="note warn small">YouTube の動画として読めません。URL をもう一度確かめてください（YouTube 以外の URL は、公開サイトでは「リンク」として出ます）。</p>`;
    return html`<div class="yt-prev"><img src="${T.ytThumb(id)}" alt="" loading="lazy" onerror="this.style.visibility='hidden'"><div><p class="small" style="margin:0">動画の ID：<b class="mono">${id}</b></p><button type="button" class="btn sm" data-op="embed" data-id="${id}">${icon('play')} 埋めこみで確かめる</button></div></div><div class="yt-embed"></div>`;
  }

  async function edit(v) {
    const ev = T.ev();
    const isNew = !v;
    const val = v || { title: '', url: '', kind: 'live', when: '', visibility: 'public', note: '', onAir: false };
    await T.editRecord({
      title: isNew ? '動画を足す' : '動画を直す', wide: true,
      fields: fields(), value: val,
      extra: String(html`<div class="field full"><span class="flabel">見本</span><div class="yt-preview" data-yt>${previewHtml(val.url)}</div></div>`),
      onOpen(wrap) {
        const input = wrap.querySelector('[name=url]');
        const box = wrap.querySelector('[data-yt]');
        input.addEventListener('input', T.debounce(() => { box.innerHTML = String(previewHtml(input.value)); }, 250));
        wrap.addEventListener('click', (e) => {
          const b = e.target.closest('[data-op="embed"]');
          if (!b) return;
          box.querySelector('.yt-embed').innerHTML = String(html`<iframe src="${T.ytEmbed(b.dataset.id)}" title="動画の見本" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>`);
        });
      },
      check(r) {
        if (r.url && !T.ytId(r.url)) T.toast('YouTube の動画として読めない URL です（このまま保存します）', 'warn');
      },
      onSave(r) {
        if (isNew) { ev.videos.push(Object.assign({ id: T.uid('v'), onAir: false }, r)); T.logIt(`配信「${r.title}」を足しました`, T.who()); }
        else { Object.assign(v, r); T.logIt(`配信「${r.title}」を直しました`, T.who()); }
        T.save(); T.refresh();
        T.toast(isNew ? '足しました' : '保存しました');
      },
      onDelete: isNew ? null : () => { T.removeFrom(ev.videos, v.id); T.logIt(`配信「${v.title}」を削除しました`, T.who()); T.save(); T.refresh(); T.toast('削除しました'); },
    });
  }

  function itemHtml(v) {
    const id = T.ytId(v.url);
    return html`<li class="vid-item item ${v.onAir ? 'on-air' : ''}">
      <div class="vid-thumb">${id ? html`<img src="${T.ytThumb(id)}" alt="" loading="lazy" onerror="this.style.visibility='hidden'"><span class="vid-play">${icon('play')}</span>` : html`<span class="vid-none">URL<br>未設定</span>`}</div>
      <div class="item-main">
        <div class="item-title">${v.onAir ? html`<span class="live-chip"><span class="dot"></span>LIVE</span> ` : ''}${v.title}</div>
        <div class="item-meta">
          <span class="chip pri">${KIND[v.kind] || v.kind}</span>
          <span class="chip ${VIS_CHIP[v.visibility] || ''}">${VIS[v.visibility] || v.visibility}</span>
          ${v.when ? html`<span>${icon('clock')} ${when(v.when)}</span>` : html`<span class="faint">日時 未定</span>`}
          ${v.url && !id ? html`<span class="chip bad">YouTube として読めない URL</span>` : ''}
        </div>
        ${v.note ? html`<div class="small muted">${v.note}</div>` : ''}
      </div>
      <div class="item-actions vid-acts">
        <button class="btn sm ${v.onAir ? 'danger' : ''}" data-act="air" data-id="${v.id}">${v.onAir ? '配信を終える' : html`${icon('play')} 配信中にする`}</button>
        ${id ? html`<a class="icon-btn" href="https://www.youtube.com/watch?v=${id}" target="_blank" rel="noopener" title="YouTube で開く" aria-label="YouTube で開く">${icon('external')}</a>` : ''}
        <button class="icon-btn" data-act="edit" data-id="${v.id}" title="直す" aria-label="直す">${icon('edit')}</button>
        <button class="icon-btn danger-ic" data-act="del" data-id="${v.id}" title="削除" aria-label="削除">${icon('trash')}</button>
      </div>
    </li>`;
  }

  T.page('admin', 'live', {
    title: '配信（YouTube）', icon: 'video', group: '広報', order: 30,
    lead: 'YouTube のライブ配信・アーカイブ・紹介動画を、公開サイトの「配信」ページに載せます。',
    head() { return html`<a class="btn" href="#/live" target="_blank" rel="noopener">${icon('external')} 公開の配信ページ</a><button class="btn primary" data-act="add">${icon('plus')} 動画を足す</button>`; },
    render() {
      const ev = T.ev();
      const on = ev.videos.filter((v) => v.onAir);
      const groups = ['live', 'archive', 'info'].map((k) => [k, sorted(ev.videos.filter((v) => (v.kind || 'info') === k))]).filter(([, l]) => l.length);
      const others = ev.videos.filter((v) => !KIND[v.kind]);
      return html`${on.length ? html`<div class="note bad live-now"><b><span class="live-chip"><span class="dot"></span>LIVE</span> いま配信中：</b>${on.map((v) => v.title).join('、')}<br><span class="small">公開サイトのホームのいちばん上に「LIVE 配信中」の帯が出ています。終わったら「配信を終える」を押してください。</span></div>` : ''}
        ${groups.length || others.length ? html`${groups.map(([k, list]) => html`<h2 class="section-title">${KIND[k]}<span class="chip">${list.length}</span></h2><ul class="list">${list.map(itemHtml)}</ul>`)}${others.length ? html`<h2 class="section-title">そのほか</h2><ul class="list">${others.map(itemHtml)}</ul>` : ''}` : html`<div class="empty">まだ動画がありません。「動画を足す」から入れてください。</div>`}
        <div class="grid2" style="margin-top:24px">
          <form class="card" data-form="channel">
            <div class="card-head"><h3>${icon('video')} 大会の YouTube チャンネル</h3></div>
            <div class="fgrid"><div class="field full"><label class="flabel" for="yt-ch">チャンネルの URL</label><input id="yt-ch" name="youtubeChannel" type="url" value="${ev.info.youtubeChannel || ''}" placeholder="https://www.youtube.com/@…"><p class="help">公開サイトの「配信」ページに「チャンネルを見る」のリンクが出ます。</p></div></div>
            <div class="row end" style="margin-top:10px"><button class="btn primary">${icon('check')} 保存する</button></div>
          </form>
          <div class="note small">
            <p><b>参加者だけに見せたい動画</b>は、YouTube で「限定公開」にして、ここで「見られる人」を「参加者だけ」にします（マイページに入った人にだけ出ます）。</p>
            <p>ただし限定公開の URL は、<b>知っている人ならだれでも見られます</b>。URL が広まると止められません。本当に閉じたいときは、別の配信の方法（参加者だけが入れる会議室・有料の配信サービスなど）が必要です。</p>
            <p>ライブ配信の URL は、YouTube Studio で配信の予約をすると、前もって決まります。予約したらすぐ、ここに入れておくと安心です。</p>
          </div>
        </div>`;
    },
    acts: {
      add() { edit(null); },
      edit(el) { const v = T.find(T.ev().videos, el.dataset.id); if (v) edit(v); },
      air(el) {
        const v = T.find(T.ev().videos, el.dataset.id);
        if (!v) return;
        v.onAir = !v.onAir;
        if (v.onAir && !T.ytId(v.url)) T.toast('URL がまだありません。公開サイトには題名だけ出ます', 'warn');
        else T.toast(v.onAir ? '「配信中」にしました。公開サイトに LIVE の帯が出ます' : '配信を終えました');
        T.logIt(`配信「${v.title}」を${v.onAir ? '配信中にしました' : '終えました'}`, T.who());
        T.save(); T.refresh();
      },
      async del(el) {
        const ev = T.ev(), v = T.find(ev.videos, el.dataset.id);
        if (!v || !(await T.confirm(`「${v.title}」を削除します。よろしいですか？`, { danger: true, ok: '削除する' }))) return;
        T.removeFrom(ev.videos, v.id);
        T.logIt(`配信「${v.title}」を削除しました`, T.who());
        T.save(); T.refresh();
      },
    },
    forms: {
      channel(v) {
        const ev = T.ev();
        ev.info.youtubeChannel = (v.youtubeChannel || '').trim();
        T.save(); T.refresh();
        T.toast('保存しました');
      },
    },
  });
})();
