/* 大会の設定：名前・主題・日程・会場・主催・問い合わせ先・振込先・色・メール送信・暗証番号
   入力を変えると、すぐ保存する（data-k="info.no" のように、どこに入れるかを書いておく） */
(function () {
  'use strict';
  const { html, icon } = T;

  const get = (obj, path) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
  const set = (obj, path, v) => { const ks = path.split('.'); let o = obj; for (const k of ks.slice(0, -1)) { if (o[k] == null) o[k] = {}; o = o[k]; } o[ks[ks.length - 1]] = v; };

  // 1つの入力欄
  const inp = (ev, k, label, o = {}) => {
    const v = get(ev, k);
    const id = 'ev_' + k.replace(/\./g, '_');
    let el;
    if (o.type === 'textarea') el = html`<textarea id="${id}" data-k="${k}" rows="${o.rows || 3}" placeholder="${o.ph || ''}">${v || ''}</textarea>`;
    else if (o.type === 'check') el = html`<label class="check"><input type="checkbox" id="${id}" data-k="${k}" ${v ? T.raw('checked') : ''}> <span>${o.text || ''}</span></label>`;
    else el = html`<input id="${id}" data-k="${k}" type="${o.type || 'text'}" value="${v == null ? '' : v}" placeholder="${o.ph || ''}" ${o.type === 'number' ? T.raw('inputmode="numeric"') : ''}>`;
    return html`<div class="field ${o.full || o.type === 'textarea' ? 'full' : ''}"><label class="flabel" for="${id}">${label}</label>${el}${o.help ? html`<p class="help">${o.help}</p>` : ''}</div>`;
  };

  T.page('admin', 'event', {
    title: '大会の設定', nav: '大会の設定', icon: 'gear', group: '大会', order: 10,
    lead: '公開サイトのホーム・冊子・メールの差しこみ（{{大会名}} など）に使われます。変えると、すぐ保存されます。',
    head() { return html`<a class="btn" href="#/" target="_blank" rel="noopener">${icon('eye')} 公開サイトで見る</a>`; },
    render() {
      const ev = T.ev(), i = ev.info;
      const o = i.office || {};
      return html`<div class="ev-form">
        <section class="card">
          <div class="card-head"><h2>大会の名前</h2></div>
          <div class="fgrid">
            ${inp(ev, 'info.no', '回数（数字だけ）', { type: 'number', ph: '109' })}
            ${inp(ev, 'info.name', '大会名', { ph: '全国算数・数学教育研究（佐賀）大会', help: '「（」の前で2行に分けてホームに出ます。' })}
            ${inp(ev, 'info.short', '短い名前', { ph: '佐賀大会', help: 'メニュー・名札の帯に出ます。' })}
            ${inp(ev, 'info.org', '主催団体', { ph: '公益社団法人 日本数学教育学会' })}
            ${inp(ev, 'info.orgShort', '主催団体（略称）', { ph: '日数教' })}
            ${inp(ev, 'info.nameEn', '英語の名前（ホームの飾り）', { ph: 'The 109th National Conference …' })}
            ${inp(ev, 'info.catch', 'キャッチコピー', { ph: '問いがつながる、学びがひらく。', full: true })}
          </div>
        </section>

        <section class="card">
          <div class="card-head"><h2>大会主題</h2></div>
          <div class="fgrid">
            ${inp(ev, 'info.theme', '主題', { full: true })}
            ${inp(ev, 'info.subtheme', '副題', { full: true })}
            ${inp(ev, 'info.themeNote', '主題の趣旨', { type: 'textarea', rows: 5 })}
          </div>
        </section>

        <section class="card">
          <div class="card-head"><h2>日程と申込</h2></div>
          <div class="fgrid">
            ${inp(ev, 'info.start', '大会の初日', { type: 'date' })}
            ${inp(ev, 'info.end', '大会の最終日', { type: 'date' })}
            ${inp(ev, 'info.city', '開催地（ホームに大きく出る）', { ph: '佐賀県佐賀市' })}
            ${inp(ev, 'info.applyOpen', '申込の受付開始', { type: 'date' })}
            ${inp(ev, 'info.applyClose', '申込の締切', { type: 'date' })}
            ${inp(ev, 'info.capacity', '定員（人）', { type: 'number', help: '空なら、定員なし。' })}
            ${inp(ev, 'info.codePrefix', '受付番号の頭の文字', { ph: 'SG', help: '英大文字1〜4字。例：SG → SG-0001。' })}
          </div>
          <p class="small muted" style="margin:12px 0 0">プログラム（日ごとの時間割）は <a href="#/admin/program">プログラム・分科会</a>、参加費の金額は <a href="#/admin/form">申込フォーム</a> の選択肢で決めます。</p>
        </section>

        <section class="card">
          <div class="card-head"><h2>会場</h2><span class="spacer"></span><button class="btn sm" data-act="addVenue">${icon('plus')} 会場を足す</button></div>
          <div class="list">${i.venues.map((v, k) => html`<div class="item"><span class="chip pri">${k + 1}</span><div class="item-main"><div class="item-title">${v.name}</div><div class="item-meta"><span>${v.role || ''}</span><span>${v.address || ''}</span></div></div><div class="item-actions">
            <button class="icon-btn" data-act="mvVenue" data-k="${k}" data-d="-1" title="上へ" aria-label="上へ" ${k === 0 ? T.raw('disabled') : ''}>↑</button>
            <button class="icon-btn" data-act="editVenue" data-k="${k}" title="直す" aria-label="直す">${icon('edit')}</button></div></div>`)}</div>
        </section>

        <section class="card">
          <div class="card-head"><h2>主催・共催・後援</h2><span class="spacer"></span><button class="btn sm" data-act="addHost">${icon('plus')} 足す</button></div>
          <div class="list">${(i.hosts || []).map((h, k) => html`<div class="item"><div class="item-main"><div class="item-meta"><span>${h.role}</span></div><div class="item-title">${h.names}</div></div><div class="item-actions"><button class="icon-btn" data-act="editHost" data-k="${k}" aria-label="直す">${icon('edit')}</button></div></div>`)}</div>
        </section>

        <section class="card">
          <div class="card-head"><h2>問い合わせ先（事務局）</h2></div>
          <div class="fgrid">
            ${inp(ev, 'info.office.name', '名前', { ph: '佐賀大会実行委員会 事務局' })}
            ${inp(ev, 'info.office.person', '担当', { ph: '事務局長 ○○' })}
            ${inp(ev, 'info.office.email', 'メール', { type: 'email' })}
            ${inp(ev, 'info.office.tel', '電話（受付時間も）')}
            ${inp(ev, 'info.office.address', '所在地', { full: true })}
          </div>
          <p class="small muted" style="margin:10px 0 0">メールの {{事務局}} には「${[o.name, o.email, o.tel].filter(Boolean).join('　')}」が入ります。</p>
        </section>

        <section class="card">
          <div class="card-head"><h2>参加費の振込先</h2></div>
          ${inp(ev, 'info.bank', 'マイページと申込のあとの画面に出ます', { type: 'textarea', rows: 4 })}
        </section>

        <section class="card">
          <div class="card-head"><h2>見た目（色の組み合わせ）</h2></div>
          <div class="theme-pick">${Object.entries(T.THEMES).map(([k, th]) => html`<button class="theme-sw ${i.color === k ? 'on' : ''}" data-act="setColor" data-c="${k}" aria-pressed="${i.color === k}">
            <span class="sw" style="background:linear-gradient(135deg, ${th.ink}, ${th.deep} 55%, ${th.primary})"><i style="background:${th.accent}"></i></span><span>${th.name}</span></button>`)}</div>
        </section>

        <section class="card">
          <div class="card-head"><h2>${icon('mail')} メールを本当に送る（Gmail・Apps Script）</h2><span class="spacer"></span><button class="btn sm" data-act="gasHelp">${icon('help')} 設定のしかた</button></div>
          <div class="fgrid">
            ${inp(ev, 'info.mailFrom', '差出人の名前', { ph: '佐賀大会実行委員会 事務局' })}
            ${inp(ev, 'info.mailGasUrl', 'Apps Script のウェブアプリのURL', { type: 'url', ph: 'https://script.google.com/macros/s/…/exec', help: '空のあいだは、メールは「送信の記録」とマイページに残るだけです（サンプルの動き）。' })}
            ${inp(ev, 'info.mailGasKey', '合言葉（スクリプトの KEY と同じもの）', { type: 'password' })}
          </div>
        </section>

        <section class="card">
          <div class="card-head"><h2>${icon('lock')} 管理と公開</h2></div>
          <div class="fgrid">
            ${inp(ev, 'info.pin', '管理画面の暗証番号', { help: 'サンプル用の簡単なしくみです。本番では、学校・学会のアカウントでのログインに置きかえます。' })}
            ${inp(ev, 'info.siteUrl', '公開サイトのURL', { type: 'url', ph: 'https://…', help: 'メールの {{マイページ}}・{{サイト}} と、チラシのQRに使います。空なら、いま開いているURL。' })}
            ${inp(ev, 'info.youtubeChannel', '大会のYouTubeチャンネル', { type: 'url' })}
            ${inp(ev, 'info.sample', 'サンプルの印', { type: 'check', text: '公開サイトに「SAMPLE」の札を出す・ログイン画面に暗証番号を出す' })}
          </div>
          <div class="card-head" style="margin-top:16px"><h3>公開サイトの下のリンク</h3><span class="spacer"></span><button class="btn sm" data-act="addLink">${icon('plus')} 足す</button></div>
          <div class="list">${(i.links || []).map((l, k) => html`<div class="item"><div class="item-main"><div class="item-title">${l.label}</div><div class="item-meta"><span>${l.url}</span></div></div><button class="icon-btn" data-act="editLink" data-k="${k}" aria-label="直す">${icon('edit')}</button></div>`)}</div>
        </section>
      </div>`;
    },
    mount(root) {
      root.addEventListener('change', (e) => {
        const el = e.target.closest('[data-k]');
        if (!el || !el.matches('input,textarea,select')) return;
        const ev = T.ev();
        let v = el.type === 'checkbox' ? el.checked : el.value.trim();
        if (el.type === 'number') v = v === '' ? '' : Number(v);
        if (el.dataset.k === 'info.codePrefix') v = String(v).toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4) || 'A';
        if (el.dataset.k === 'info.pin' && !v) { T.toast('暗証番号を空にはできません', 'bad'); el.value = ev.info.pin; return; }
        set(ev, el.dataset.k, v);
        T.save();
        T.toast('保存しました');
        if (['info.no', 'info.name', 'info.short'].includes(el.dataset.k)) T.refresh();
      });
    },
    acts: {
      setColor(el) { T.ev().info.color = el.dataset.c; T.save(); T.applyTheme(); T.refresh(); },
      gasHelp() { if (T.showGasHelp) T.showGasHelp(); else T.toast('設定のしかたは、一斉連絡の画面にあります'); },
      addVenue() { editVenue(-1); },
      editVenue(el) { editVenue(Number(el.dataset.k)); },
      mvVenue(el) { const vs = T.ev().info.venues, k = Number(el.dataset.k); if (k > 0) { [vs[k - 1], vs[k]] = [vs[k], vs[k - 1]]; T.save(); T.refresh(); } },
      addHost() { editList('hosts', -1, [{ k: 'role', label: '役割', placeholder: '主催・共催・後援・協賛 など', required: true }, { k: 'names', label: '名前（いくつもあるときは「、」で）', required: true, full: true }], '主催など'); },
      editHost(el) { editList('hosts', Number(el.dataset.k), [{ k: 'role', label: '役割', required: true }, { k: 'names', label: '名前', required: true, full: true }], '主催など'); },
      addLink() { editList('links', -1, [{ k: 'label', label: '表示する文字', required: true }, { k: 'url', label: 'URL', type: 'url', required: true }], 'リンク'); },
      editLink(el) { editList('links', Number(el.dataset.k), [{ k: 'label', label: '表示する文字', required: true }, { k: 'url', label: 'URL', type: 'url', required: true }], 'リンク'); },
    },
  });

  function editVenue(k) {
    const ev = T.ev();
    const v = k >= 0 ? ev.info.venues[k] : {};
    T.editRecord({
      title: k >= 0 ? '会場を直す' : '会場を足す', value: v,
      fields: [
        { k: 'name', label: '会場名', required: true, full: true },
        { k: 'role', label: '使い方（部会など）', placeholder: '中学校部会・高等学校部会' },
        { k: 'address', label: '所在地' },
        { k: 'access', label: '交通・アクセス', type: 'textarea', rows: 3 },
        { k: 'map', label: '地図のURL（なくてもよい）', type: 'url', full: true, help: '空なら、会場名と所在地で Google マップを探すリンクになります。' },
      ],
      onSave(r) { if (k >= 0) Object.assign(v, r); else ev.info.venues.push(Object.assign({ id: T.uid('v') }, r)); T.save(); T.refresh(); T.toast('保存しました'); },
      onDelete: k >= 0 ? () => { ev.info.venues.splice(k, 1); T.save(); T.refresh(); } : null,
    });
  }
  function editList(key, k, fields, name) {
    const ev = T.ev();
    const list = ev.info[key] = ev.info[key] || [];
    const v = k >= 0 ? list[k] : {};
    T.editRecord({
      title: name + (k >= 0 ? 'を直す' : 'を足す'), value: v, fields,
      onSave(r) { if (k >= 0) Object.assign(v, r); else list.push(r); T.save(); T.refresh(); },
      onDelete: k >= 0 ? () => { list.splice(k, 1); T.save(); T.refresh(); } : null,
    });
  }
})();
