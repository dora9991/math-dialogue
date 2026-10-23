/* データ：大会の一覧と切りかえ・新しい大会を作る（いまの大会の設定を引きつぐ）・バックアップ・サンプルに戻す・大会後の個人情報の削除 */
(function () {
  'use strict';
  const { html, icon } = T;

  T.page('admin', 'data', {
    title: 'データと大会の切りかえ', nav: 'データ・大会の切りかえ', icon: 'database', group: 'データ', order: 10,
    lead: 'ほかの研究大会（県の大会・九州大会など）にも、同じしくみで使えます。大会ごとにデータは分かれています。',
    render() {
      const ev = T.ev();
      const events = Object.values(T.db.events);
      return html`
        <section class="card">
          <div class="card-head"><h2>${icon('swap')} 大会の一覧</h2><span class="spacer"></span><button class="btn primary" data-act="newEvent">${icon('plus')} 新しい大会を作る</button></div>
          <div class="list">${events.map((e) => html`<div class="item ${e.id === ev.id ? 'current' : ''}">
            <div class="item-main"><div class="item-title">${T.eventTitle(e)} ${e.id === ev.id ? html`<span class="chip ok">いま開いている・公開中</span>` : ''}</div>
              <div class="item-meta"><span>${T.period(e) || '日程未定'}</span><span>申込 ${T.active(e).length}人</span><span>お知らせ ${e.news.length}</span><span>資料 ${e.docs.length}</span></div></div>
            <div class="item-actions">${e.id !== ev.id ? html`<button class="btn sm" data-act="switch" data-id="${e.id}">開く</button><button class="btn sm danger ghost" data-act="delEvent" data-id="${e.id}">${icon('trash')}</button>` : ''}</div>
          </div>`)}</div>
          <p class="small muted" style="margin:10px 0 0">公開サイトには、いま開いている大会が出ます。</p>
        </section>

        <section class="card">
          <div class="card-head"><h2>${icon('download')} バックアップ</h2></div>
          <p class="small">このブラウザの中にだけ保存しています。ブラウザのデータを消すと消えるので、ときどき書き出してください。</p>
          <div class="row">
            <button class="btn" data-act="exportJson">${icon('download')} 書き出す（JSON）</button>
            <button class="btn" data-act="exportFull">${icon('download')} PDF もふくめて書き出す</button>
            <button class="btn" data-act="importJson">${icon('upload')} バックアップから戻す</button>
          </div>
          <p class="small muted" id="usage" style="margin:10px 0 0"></p>
        </section>

        <section class="card">
          <div class="card-head"><h2>${icon('lock')} 大会のあとに</h2></div>
          <p class="small">申込の個人情報（氏名・メール・電話・所属・配慮事項など）を消し、人数の集計だけを残します。アンケートの回答は、だれの回答かがわからない形で残ります。</p>
          <button class="btn danger" data-act="anonymize">${icon('trash')} この大会の個人情報を消す</button>
        </section>

        <section class="card">
          <div class="card-head"><h2>${icon('spark')} サンプル</h2></div>
          <p class="small">このブラウザの中のデータを全部消して、最初のサンプル（第109回 佐賀大会・仮）に戻します。</p>
          <button class="btn danger ghost" data-act="reset">サンプルに戻す</button>
        </section>

        <section class="card">
          <div class="card-head"><h2>${icon('help')} 本番で使うには</h2></div>
          <ul class="small" style="margin:0;padding-left:1.2em">
            <li>いまは、<b>開いたブラウザの中だけ</b>にデータがあります。参加者の申込を1か所に集め、受付を何台もの端末でするには、サーバー（Googleスプレッドシート＋Apps Script、または Supabase など）につなぎます。<code>js/core.js</code> の「保存先」を差しかえる形にしてあります。</li>
            <li>管理画面のログインは、本番では学校・学会のアカウントに置きかえます。</li>
            <li>個人情報の取り扱い（目的・保存期間・消す時期）を、学会・実行委員会で決めてから公開します。</li>
          </ul>
        </section>`;
    },
    async mount(root, r) {
      const u = root.querySelector('#usage');
      if (u && navigator.storage && navigator.storage.estimate) {
        try { const e = await navigator.storage.estimate(); u.textContent = `このブラウザで使っている量：約 ${T.size(e.usage || 0)}（使える量の目安 ${T.size(e.quota || 0)}）`; } catch (e) { /* なにもしない */ }
      }
      if (r.arg === 'new') { history.replaceState(null, '', '#/admin/data'); newEvent(); }
    },
    acts: {
      newEvent() { newEvent(); },
      switch(el) { T.db.current = el.dataset.id; T.save(true); T.toast('切りかえました：' + T.eventTitle(T.ev())); T.render(); },
      async delEvent(el) {
        const e = T.db.events[el.dataset.id];
        if (!(await T.confirm(`「${T.eventTitle(e)}」を、申込・資料もふくめて消します。元に戻せません。`, { danger: true, ok: '消す' }))) return;
        for (const d of e.docs) await T.files.del(T.fileKey(e.id, d.id));
        delete T.db.events[e.id];
        T.save(true); T.refresh();
      },
      exportJson() { T.download(`taikai-backup-${T.today()}.json`, JSON.stringify(T.db, null, 1), 'application/json'); },
      async exportFull() {
        const copy = T.clone(T.db);
        copy.files = {};
        for (const e of Object.values(T.db.events)) for (const d of e.docs) { const b = await T.files.get(T.fileKey(e.id, d.id)); if (b) copy.files[T.fileKey(e.id, d.id)] = { type: b.type, b64: await T.blobToB64(b) }; }
        T.download(`taikai-backup-full-${T.today()}.json`, JSON.stringify(copy), 'application/json');
      },
      async importJson() {
        const f = await T.pickFile('application/json,.json');
        if (!f) return;
        let d;
        try { d = JSON.parse(await T.readFile(f)); } catch (e) { return T.toast('JSON として読めませんでした', 'bad'); }
        if (!d || !d.events) return T.toast('大会運営キットのバックアップではないようです', 'bad');
        const n = Object.keys(d.events).length;
        if (!(await T.confirm(`バックアップ（大会 ${n}件）で、いまのデータを置きかえます。よろしいですか？`, { danger: true, ok: '置きかえる' }))) return;
        if (d.files) { for (const [k, v] of Object.entries(d.files)) await T.files.put(k, T.b64ToBlob(v.b64, v.type)); delete d.files; }
        T.db = d; for (const e of Object.values(T.db.events)) T.fill(e);
        if (!T.db.events[T.db.current]) T.db.current = Object.keys(T.db.events)[0];
        T.save(true); T.toast('戻しました'); T.render();
      },
      async anonymize() {
        const ev = T.ev();
        if (!(await T.confirm(`「${T.eventTitle(ev)}」の申込 ${ev.people.length}人ぶんの個人情報を消します。人数の集計（部会・区分・都道府県・入金・受付）は残ります。元に戻せません。`, { danger: true, ok: '消す' }))) return;
        // 残すのは「選ぶ」項目（部会・区分・都道府県・弁当など）だけ。名前・メール・電話・所属・自由記述は消す
        const keep = new Set(ev.form.fields.filter((f) => ['select', 'radio', 'checks'].includes(f.type) && !['name', 'email', 'tel', 'org'].includes(f.id)).map((f) => f.id));
        ev.people.forEach((p, k) => { for (const key of Object.keys(p.a)) if (!keep.has(key)) delete p.a[key]; p.a.name = `（消去ずみ ${k + 1}）`; p.memo = ''; p.token = T.newToken(); });
        ev.threads = []; ev.mails = [];
        for (const sv of ev.surveys) sv.responses.forEach((x) => { x.pid = null; });
        T.logIt('大会後の個人情報の削除をしました', T.who());
        T.save(true); T.toast('個人情報を消しました'); T.refresh();
      },
      async reset() {
        if (!(await T.confirm('このブラウザの中のデータを全部消して、サンプルに戻します。元に戻せません。', { danger: true, ok: '戻す' }))) return;
        await T.files.clear();
        T.store.clear();
        T.db = T.sample();
        await T.loadSamplePdfs(T.db);
        T.save(true); T.toast('サンプルに戻しました'); T.render();
      },
    },
  });

  // 新しい大会：いまの大会から引きつぐもの（申込フォーム・テンプレート・Q&A・係・冊子の注意）を選ぶ
  async function newEvent() {
    const cur = T.ev();
    const v = await T.editRecord({
      title: '新しい大会を作る', wide: true,
      lead: '申込・資料・問い合わせなどは引きつぎません。あとから「大会の設定」で直せます。',
      value: { orgShort: cur.info.orgShort, org: cur.info.org, codePrefix: 'A', cForm: true, cTpl: true, cFaq: true, cStaff: true, cColor: true },
      fields: [
        { k: 'no', label: '回数（なければ空）', type: 'number' },
        { k: 'name', label: '大会名', required: true, placeholder: '佐賀県算数・数学教育研究大会' },
        { k: 'short', label: '短い名前', placeholder: '県大会' },
        { k: 'org', label: '主催団体' },
        { k: 'orgShort', label: '主催団体（略称）' },
        { k: 'start', label: '初日', type: 'date' },
        { k: 'end', label: '最終日', type: 'date' },
        { k: 'codePrefix', label: '受付番号の頭の文字', help: '英大文字。例：KEN → KEN-0001' },
        { k: 'cForm', label: '', type: 'check', text: '申込フォームを引きつぐ' },
        { k: 'cTpl', label: '', type: 'check', text: '連絡のテンプレートを引きつぐ' },
        { k: 'cFaq', label: '', type: 'check', text: 'Q&A を引きつぐ' },
        { k: 'cStaff', label: '', type: 'check', text: '係・名簿を引きつぐ' },
        { k: 'cColor', label: '', type: 'check', text: '色・振込先・問い合わせ先を引きつぐ' },
      ],
    });
    if (!v) return;
    const id = T.uid('ev');
    const ev = T.fill({ id, createdAt: T.now(), info: { no: v.no, name: v.name, short: v.short || v.name, org: v.org, orgShort: v.orgShort, start: v.start, end: v.end || v.start, codePrefix: (v.codePrefix || 'A').toUpperCase().replace(/[^A-Z]/g, '') || 'A', venues: [], hosts: v.org ? [{ role: '主催', names: v.org }] : [], links: [], pin: cur.info.pin, color: 'ai' } });
    if (v.cForm) { ev.form = T.clone(cur.form); const s = ev.form.fields.find((f) => f.id === 'section'); if (s) s.options = []; }
    if (v.cTpl) ev.templates = T.clone(cur.templates);
    if (v.cFaq) ev.faq = T.clone(cur.faq);
    if (v.cStaff) ev.staff = T.clone(cur.staff);
    if (v.cColor) Object.assign(ev.info, { color: cur.info.color, bank: cur.info.bank, office: T.clone(cur.info.office), mailFrom: cur.info.mailFrom, mailGasUrl: cur.info.mailGasUrl, mailGasKey: cur.info.mailGasKey });
    ev.booklet = { greetings: [], notes: cur.booklet.notes || '', parts: T.clone(cur.booklet.parts || {}) };
    T.db.events[id] = ev;
    T.db.current = id;
    T.save(true);
    T.toast('作りました：' + T.eventTitle(ev));
    T.go('admin/event');
  }
})();
