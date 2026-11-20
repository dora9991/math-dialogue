/* 問い合わせ：公開サイト・マイページから届いた問い合わせと、電話・メールで受けたものを、1か所でやり取りする。
   左に一覧、右にやり取り（#/admin/inbox/<id>）。スマホでは一覧 → やり取りの切りかえ。
   返信は T.thread.reply（申込者なら、マイページの「運営からのメール」にも出る）。 */
(function () {
  'use strict';
  const { html, icon } = T;
  const STATUS = { open: ['未対応', 'bad'], doing: ['対応中', 'warn'], done: ['完了', 'ok'] };
  const ORDER = { open: 0, doing: 1, done: 2 };
  const lastAt = (th) => (th.msgs.length ? th.msgs[th.msgs.length - 1].at : th.at);
  const statusChip = (s) => html`<span class="chip ${STATUS[s] ? STATUS[s][1] : ''}">${STATUS[s] ? STATUS[s][0] : s}</span>`;
  const st = () => T.uiState('inbox', { status: 'active', q: '', drafts: {} });

  function filtered(ev) {
    const s = st();
    const q = s.q.trim().toLowerCase();
    return ev.threads
      .filter((th) => (s.status === 'all' ? true : s.status === 'active' ? th.status !== 'done' : th.status === s.status))
      .filter((th) => !q || [th.subject, th.name, th.email, th.cat, ...th.msgs.map((m) => m.text)].join(' ').toLowerCase().includes(q))
      .sort((a, b) => ORDER[a.status] - ORDER[b.status] || (lastAt(a) < lastAt(b) ? 1 : -1));
  }

  function listPane(ev, cur) {
    const s = st();
    const n = (k) => ev.threads.filter((t) => (k === 'active' ? t.status !== 'done' : k === 'all' ? true : t.status === k)).length;
    const list = filtered(ev);
    return html`<div class="th-pane">
      <div class="th-tools">
        <div class="seg" role="group" aria-label="状態">
          ${[['active', '要対応'], ['open', '未対応'], ['doing', '対応中'], ['done', '完了'], ['all', 'すべて']].map(([k, l]) => html`<button data-act="status" data-v="${k}" aria-pressed="${s.status === k}">${l} ${n(k)}</button>`)}
        </div>
        ${T.searchBox('inbox', s.q, '件名・名前・内容でさがす')}
      </div>
      ${list.length ? html`<ul class="th-list">${list.map((th) => {
        const last = th.msgs[th.msgs.length - 1] || { text: '' };
        return html`<li><a class="th-item ${cur && cur.id === th.id ? 'on' : ''} ${th.status === 'open' ? 'unread' : ''}" href="#/admin/inbox/${th.id}">
          <span class="th-row">${statusChip(th.status)}<b class="th-subj">${th.subject}</b><span class="th-time">${T.ago(lastAt(th))}</span></span>
          <span class="th-row small muted"><span>${th.name || '（名前なし）'}${th.pid ? '' : '・申込なし'}</span><span>${th.cat || ''}</span>${th.who ? html`<span>${icon('user')} ${th.who}</span>` : ''}</span>
          <span class="th-last">${last.from === 's' ? '↩ ' : ''}${last.text}</span>
        </a></li>`;
      })}</ul>` : html`<div class="empty small">${ev.threads.length ? 'この条件の問い合わせはありません。' : 'まだ問い合わせはありません。'}</div>`}
    </div>`;
  }

  function detail(ev, th) {
    if (!th) return html`<div class="th-detail th-none"><div class="empty">左の一覧から、問い合わせを選んでください。</div></div>`;
    const p = th.pid ? T.find(ev.people, th.pid) : null;
    const staff = ev.staff.map((x) => x.name);
    if (th.who && !staff.includes(th.who)) staff.unshift(th.who);
    return html`<div class="th-detail">
      <div class="th-head">
        <a class="btn sm ghost th-back" href="#/admin/inbox">${icon('back')} 一覧へ</a>
        <h2>${th.subject}</h2>
        <div class="th-controls">
          <label><span class="small muted">状態</span><select data-th="status">${Object.entries(STATUS).map(([k, [l]]) => html`<option value="${k}" ${th.status === k ? T.raw('selected') : ''}>${l}</option>`)}</select></label>
          <label><span class="small muted">担当</span><select data-th="who"><option value="">（決めていない）</option>${staff.map((n) => html`<option ${th.who === n ? T.raw('selected') : ''}>${n}</option>`)}</select></label>
          <label><span class="small muted">分類</span><select data-th="cat">${[...new Set([...T.THREAD_CATS, th.cat].filter(Boolean))].map((c) => html`<option ${th.cat === c ? T.raw('selected') : ''}>${c}</option>`)}</select></label>
        </div>
      </div>
      <div class="th-person">
        ${p ? html`<span class="chip pri mono">${p.code}</span><b>${T.pname(p)}</b><span class="muted small">${p.a.org || ''}</span>
            ${T.fee(p, ev) === 0 ? html`<span class="chip">参加費なし</span>` : p.paid ? html`<span class="chip ok">入金済み</span>` : html`<span class="chip warn">未入金 ${T.yen(T.fee(p, ev))}</span>`}
            ${p.status === 'cancel' ? html`<span class="chip bad">取消</span>` : ''}
            <button class="btn sm" data-act="openPerson" data-id="${p.id}">${icon('user')} 参加者の詳細</button>`
          : html`<b>${th.name || '（名前なし）'}</b><span class="muted small">${th.email || 'メールなし'}</span><span class="chip">申込していない人</span>${th.email ? html`<button class="btn sm ghost" data-act="copy" data-text="${th.email}" data-msg="メールアドレスをコピーしました">${icon('copy')} アドレス</button>` : ''}`}
      </div>
      <div class="chat" aria-label="やり取り">
        ${th.msgs.map((m) => html`<div class="bubble ${m.from === 's' ? 's' : 'p'}">
          <div class="bubble-meta">${m.from === 's' ? (m.name || '運営') : (th.name || '問い合わせた人')}・${T.dt(m.at)}</div>
          <div class="bubble-text">${T.text(m.text)}</div>
        </div>`)}
      </div>
      <div class="reply-box">
        <div class="row reply-tools">
          <label class="small muted" for="rp-tpl">テンプレート</label>
          <select id="rp-tpl" data-reply-tpl><option value="">（差しこむ）</option>${ev.templates.map((t) => html`<option value="${t.id}">${t.cat ? `［${t.cat}］` : ''}${t.name}</option>`)}</select>
        </div>
        <textarea data-reply rows="5" placeholder="返信を書く…" aria-label="返信">${st().drafts[th.id] || ''}</textarea>
        ${p ? html`<p class="help">送ると、${T.pname(p)} さんのマイページの「問い合わせ」と「運営からのメール」に出ます。</p>`
          : html`<p class="help">申込をしていない人なので、マイページには出ません。返信は、ふだんのメールソフトから ${th.email || '相手'} へ送ってください（ここには記録だけ残ります）。</p>`}
        <div class="row">
          <button class="btn primary" data-act="reply">${icon('send')} 返信する</button>
          <button class="btn" data-act="replyDone">${icon('check')} 返信して完了にする</button>
          <span class="spacer"></span>
          <button class="btn ghost" data-act="toFaq">${icon('help')} Q&amp;A に載せる</button>
        </div>
      </div>
    </div>`;
  }

  async function doReply(done) {
    const ev = T.ev();
    const th = T.find(ev.threads, T.current.arg);
    const ta = document.querySelector('[data-reply]');
    const text = ta ? ta.value.trim() : '';
    if (!th) return;
    if (!text) { T.toast('返信を書いてください', 'bad'); if (ta) ta.focus(); return; }
    T.thread.reply(th, text, T.who(), ev);
    delete st().drafts[th.id];
    if (!th.who) th.who = T.who();
    if (done) th.status = 'done';
    T.logIt(`問い合わせ「${th.subject}」に返信${done ? '（完了）' : ''}`, T.who());
    T.save(); T.refresh();
    T.toast(th.pid ? '返信しました（マイページにも出ます）' : '記録しました。メールソフトからも送ってください');
    if (!th.pid && th.email) T.copy(text, '返信の文をコピーしました（メールソフトに貼り付けてください）');
  }

  async function addManual() {
    const ev = T.ev();
    await T.editRecord({
      title: '電話・メールで受けた問い合わせを記録', wide: true,
      lead: '受付番号を入れると、その申込者と結びつきます（名前・メールは自動で入ります）。',
      fields: [
        { k: 'code', label: '受付番号（わかれば）', placeholder: (ev.info.codePrefix || 'A') + '-0001' },
        { k: 'cat', label: '分類', type: 'select', options: T.THREAD_CATS, default: 'その他' },
        { k: 'name', label: '名前' },
        { k: 'email', label: 'メールアドレス', type: 'email' },
        { k: 'subject', label: '件名', full: true, required: true },
        { k: 'text', label: '内容', type: 'textarea', rows: 5, required: true },
        { k: 'how', label: '受けた方法', type: 'select', options: ['電話', 'メール', '直接', 'その他'], default: '電話' },
      ],
      check(v, form) {
        if (!v.code) { if (!v.name) { T.toast('名前か受付番号を入れてください', 'bad'); return false; } return true; }
        const p = ev.people.find((x) => x.code.toUpperCase() === v.code.trim().toUpperCase());
        if (!p) { T.toast('その受付番号の申込者がいません', 'bad'); const el = form.querySelector('[name="code"]'); if (el) el.focus(); return false; }
        return true;
      },
      onSave(v) {
        const p = v.code ? ev.people.find((x) => x.code.toUpperCase() === v.code.trim().toUpperCase()) : null;
        const th = T.thread.create({ pid: p ? p.id : null, name: p ? T.pname(p) : v.name, email: p ? p.a.email : v.email, subject: v.subject, cat: v.cat, text: `（${v.how}で受付：${T.who()}）\n${v.text}` }, ev);
        T.logIt(`問い合わせ「${v.subject}」を記録（${v.how}）`, T.who());
        T.save();
        T.go('admin/inbox/' + th.id);
      },
    });
  }

  async function toFaq() {
    const ev = T.ev();
    const th = T.find(ev.threads, T.current.arg);
    if (!th) return;
    const q = (th.msgs.find((m) => m.from === 'p') || {}).text || th.subject;
    const ans = [...th.msgs].reverse().find((m) => m.from === 's');
    const faqCats = [...new Set([...ev.faq.map((f) => f.cat).filter(Boolean), th.cat, 'その他'])];
    await T.editRecord({
      title: 'Q&A に載せる', wide: true,
      lead: 'やり取りから下書きを作りました。個人の名前や受付番号が入っていないか確かめて、だれにでも通じる文に直してください。',
      fields: [
        { k: 'cat', label: '分類', type: 'select', options: faqCats, default: th.cat },
        { k: 'published', label: '公開', type: 'check', text: '公開サイトに出す', default: false },
        { k: 'q', label: '質問', type: 'textarea', rows: 2, required: true, default: q },
        { k: 'a', label: '答え', type: 'textarea', rows: 5, required: true, default: ans ? ans.text : '' },
      ],
      value: { cat: th.cat, q, a: ans ? ans.text : '', published: false },
      saveLabel: 'Q&A に足す',
      onSave(v) {
        ev.faq.push({ id: T.uid('q'), cat: v.cat, q: v.q, a: v.a, published: !!v.published });
        T.logIt(`問い合わせから Q&A を追加「${v.q.slice(0, 20)}」`, T.who());
        T.save();
        T.toast(v.published ? 'Q&A に足して、公開しました' : 'Q&A に足しました（まだ公開していません）');
      },
    });
  }

  T.page('admin', 'inbox', {
    title: '問い合わせ', icon: 'chat', group: '連絡', order: 30,
    lead: '公開サイト・マイページから届いた問い合わせです。担当を決めて返信し、終わったら「完了」に。よくある質問は Q&A に載せましょう。',
    head() { return html`<button class="btn" data-act="addManual">${icon('plus')} 電話・メールで受けたものを記録</button>`; },
    render(r) {
      const ev = T.ev();
      const th = r.arg ? T.find(ev.threads, r.arg) : null;
      return html`<div class="inbox ${th ? 'has-cur' : ''}">${listPane(ev, th)}${detail(ev, th)}</div>`;
    },
    mount(root, r) {
      T.bindSearch(root, 'inbox', (v) => { st().q = v; });
      const ev = T.ev();
      const th = r.arg ? T.find(ev.threads, r.arg) : null;
      if (!th) return;
      root.querySelectorAll('[data-th]').forEach((el) => el.addEventListener('change', () => {
        const k = el.dataset.th;
        th[k] = el.value;
        T.logIt(`問い合わせ「${th.subject}」の${{ status: '状態', who: '担当', cat: '分類' }[k]}を「${k === 'status' ? STATUS[el.value][0] : el.value || 'なし'}」に`, T.who());
        T.save(); T.refresh();
      }));
      const tpl = root.querySelector('[data-reply-tpl]'), ta = root.querySelector('[data-reply]');
      ta.addEventListener('input', () => { st().drafts[th.id] = ta.value; });
      tpl.addEventListener('change', () => {
        const t = T.find(ev.templates, tpl.value);
        tpl.value = '';
        if (!t) return;
        const p = th.pid ? T.find(ev.people, th.pid) : null;
        const vars = T.vars(p, ev);
        if (!p) vars['氏名'] = th.name || '';
        T.insertAtCursor(ta, T.merge(t.body, vars));
      });
      const chat = root.querySelector('.chat');
      if (chat) chat.scrollTop = chat.scrollHeight;
    },
    acts: {
      status(el) { st().status = el.dataset.v; T.refresh(); },
      reply() { doReply(false); },
      replyDone() { doReply(true); },
      toFaq() { toFaq(); },
      addManual() { addManual(); },
      openPerson(el) { if (T.openPerson) T.openPerson(el.dataset.id); else T.go('admin/people?open=' + el.dataset.id); },
    },
  });
})();
