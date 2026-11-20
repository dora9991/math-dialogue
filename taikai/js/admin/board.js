/* 管理画面：運営ボード（日数教本部・実行委員会・会場校・各係の、連絡とやること）
   ・連絡板   ev.board … [{id, ch, author, text, at, pinned, replies:[{author, text, at}]}]
   ・やること ev.tasks … [{id, title, team, who, due, status:'todo'|'doing'|'done', note}]
   ・係・名簿 ev.staff … [{id, name, team, role, email, tel}]
   いまは同じブラウザの中だけで共有。本番で係どうしが別の端末から見るには、保存先をサーバーにする。 */
(function () {
  'use strict';
  const { html, icon } = T;

  const CHANNELS = ['全体', '日数教本部', '実行委員会', '会場校', '受付係', '広報係', '会計', '冊子', '配信', '会場'];
  const STATUS = [['todo', 'まだ'], ['doing', '進行中'], ['done', '終わった']];
  const SLABEL = Object.fromEntries(STATUS);
  const st = () => T.uiState('board', { tab: 'posts', ch: '', team: '', who: '', staffTeam: '' });
  const channels = (ev) => { const out = CHANNELS.slice(); for (const p of ev.board) if (p.ch && !out.includes(p.ch)) out.push(p.ch); return out; };
  const teams = (ev) => { const out = []; for (const x of [...ev.staff.map((s) => s.team), ...ev.tasks.map((t) => t.team)]) if (x && !out.includes(x)) out.push(x); return out; };
  const initial = (name) => String(name || '？').replace(/\s/g, '').slice(0, 1);

  // 期限の札：過ぎた＝赤、7日以内＝黄
  function dueChip(t) {
    if (!t.due) return '';
    if (t.status === 'done') return html`<span class="chip">${T.md(t.due)}</span>`;
    const n = T.daysUntil(t.due);
    if (n < 0) return html`<span class="chip bad">${icon('clock')} ${T.md(t.due)}（${-n}日すぎ）</span>`;
    if (n === 0) return html`<span class="chip bad">${icon('clock')} 今日まで</span>`;
    if (n <= 7) return html`<span class="chip warn">${icon('clock')} ${T.md(t.due)}（あと${n}日）</span>`;
    return html`<span class="chip">${icon('clock')} ${T.md(t.due)}</span>`;
  }
  const soon = (ev) => ev.tasks.filter((t) => t.status !== 'done' && t.due && T.daysUntil(t.due) <= 7).sort(T.by('due'));

  /* ── 連絡板 ── */
  function postsView(ev) {
    const s = st();
    const chs = channels(ev);
    const counts = T.groupCount(ev.board, (p) => p.ch);
    const posts = ev.board.filter((p) => !s.ch || p.ch === s.ch).slice().sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || String(b.at).localeCompare(String(a.at)));
    const me = T.who();
    return html`<div class="bd-layout">
      <nav class="bd-chs" aria-label="チャンネル">
        <button class="bd-ch ${!s.ch ? 'on' : ''}" data-act="ch" data-ch="">すべて<b>${ev.board.length}</b></button>
        ${chs.map((c) => html`<button class="bd-ch ${s.ch === c ? 'on' : ''}" data-act="ch" data-ch="${c}"># ${c}${counts.get(c) ? html`<b>${counts.get(c)}</b>` : ''}</button>`)}
      </nav>
      <div class="bd-main">
        <form class="card bd-compose" data-form="post">
          <div class="bd-compose-row">
            <span class="bd-ava" aria-hidden="true">${initial(me)}</span>
            <textarea name="text" rows="2" placeholder="${me} さんから連絡する（Shift+Enter で改行・Ctrl+Enter で投稿）" required aria-label="連絡の本文"></textarea>
          </div>
          <div class="row">
            <label class="row tight small muted">チャンネル <select name="ch" aria-label="チャンネル">${chs.map((c) => html`<option ${c === (s.ch || '全体') ? T.raw('selected') : ''}>${c}</option>`)}</select></label>
            <span class="spacer"></span>
            <button class="btn primary sm">${icon('send')} 投稿する</button>
          </div>
        </form>
        ${posts.length ? html`<div class="bd-posts">${posts.map((p) => html`<article class="card bd-post ${p.pinned ? 'pinned' : ''}">
          <header class="bd-post-head">
            <span class="bd-ava" aria-hidden="true">${initial(p.author)}</span>
            <div class="bd-post-who"><b>${p.author}</b><span class="muted small"><span class="chip pri"># ${p.ch}</span> <time title="${T.dt(p.at)}">${T.ago(p.at)}</time></span></div>
            <div class="row tight">
              ${p.pinned ? html`<span class="chip gold">${icon('pin')} ピン留め</span>` : ''}
              <button class="icon-btn" data-act="pin" data-id="${p.id}" title="${p.pinned ? 'ピン留めを外す' : 'ピン留め（上に出す）'}" aria-label="${p.pinned ? 'ピン留めを外す' : 'ピン留め'}">${icon('pin')}</button>
              ${p.author === me ? html`<button class="icon-btn" data-act="postDel" data-id="${p.id}" title="削除" aria-label="削除">${icon('trash')}</button>` : ''}
            </div>
          </header>
          <div class="bd-text">${T.text(p.text)}</div>
          ${(p.replies || []).length ? html`<ul class="bd-replies">${p.replies.map((rp) => html`<li><span class="bd-ava sm" aria-hidden="true">${initial(rp.author)}</span><div><b>${rp.author}</b> <time class="muted small" title="${T.dt(rp.at)}">${T.ago(rp.at)}</time><div class="bd-text">${T.text(rp.text)}</div></div></li>`)}</ul>` : ''}
          <form class="bd-reply" data-form="reply"><input type="hidden" name="id" value="${p.id}"><input name="text" placeholder="返信する" aria-label="返信" required><button class="btn sm">返信</button></form>
        </article>`)}</div>` : html`<div class="empty">${s.ch ? `# ${s.ch} の連絡はまだありません。` : 'まだ連絡はありません。'}</div>`}
      </div>
    </div>`;
  }

  /* ── やること ── */
  const taskFields = (ev) => [
    { k: 'title', label: 'やること', required: true, full: true },
    { k: 'team', label: '係', placeholder: '受付' },
    { k: 'who', label: '担当', type: 'select', options: [['', '（まだ決めていない）'], ...ev.staff.map((s) => [s.name, `${s.name}（${s.team || s.role || ''}）`])] },
    { k: 'due', label: '期限', type: 'date' },
    { k: 'status', label: '状態', type: 'select', options: STATUS },
    { k: 'note', label: 'メモ', type: 'textarea', rows: 3 },
  ];
  function tasksView(ev) {
    const s = st();
    const list = ev.tasks.filter((t) => (!s.team || t.team === s.team) && (!s.who || t.who === s.who));
    const whos = []; for (const t of ev.tasks) if (t.who && !whos.includes(t.who)) whos.push(t.who);
    const col = (key) => {
      const items = list.filter((t) => (t.status || 'todo') === key).sort((a, b) => key === 'done' ? String(b.due || '').localeCompare(String(a.due || '')) : String(a.due || '9999').localeCompare(String(b.due || '9999')));
      const i = STATUS.findIndex((x) => x[0] === key);
      return html`<section class="kb-col kb-${key}" aria-label="${SLABEL[key]}">
        <header class="kb-col-head"><b>${SLABEL[key]}</b><span class="chip">${items.length}</span></header>
        <div class="kb-cards">${items.map((t) => {
          const late = t.status !== 'done' && t.due && T.daysUntil(t.due) < 0;
          return html`<article class="kb-card ${late ? 'late' : ''}">
            <button class="kb-title" data-act="taskEdit" data-id="${t.id}">${t.title}</button>
            <div class="kb-meta">${t.team ? html`<span class="chip pri">${t.team}</span>` : ''}${dueChip(t)}</div>
            <div class="kb-foot">
              <span class="small muted">${t.who ? html`${icon('user')} ${t.who}` : '担当なし'}</span>
              <span class="row tight">
                ${i > 0 ? html`<button class="icon-btn sm" data-act="taskMove" data-id="${t.id}" data-d="-1" title="「${SLABEL[STATUS[i - 1][0]]}」にもどす" aria-label="もどす">${icon('back')}</button>` : ''}
                ${i < 2 ? html`<button class="btn sm" data-act="taskMove" data-id="${t.id}" data-d="1" title="「${SLABEL[STATUS[i + 1][0]]}」に進める">${i === 0 ? '始める' : '終わった'} ${icon('arrow')}</button>` : ''}
              </span>
            </div>
          </article>`;
        })}${items.length ? '' : html`<p class="kb-empty">なし</p>`}</div>
      </section>`;
    };
    return html`<div class="toolbar">
        <label class="row tight small muted">係 <select data-filter="team" aria-label="係でしぼりこむ"><option value="">すべて</option>${teams(ev).map((t) => html`<option ${s.team === t ? T.raw('selected') : ''}>${t}</option>`)}</select></label>
        <label class="row tight small muted">担当 <select data-filter="who" aria-label="担当でしぼりこむ"><option value="">すべて</option>${whos.map((w) => html`<option ${s.who === w ? T.raw('selected') : ''}>${w}</option>`)}</select></label>
        ${s.team || s.who ? html`<button class="btn sm ghost" data-act="clearFilter">${icon('x')} しぼりこみを外す</button>` : ''}
      </div>
      <div class="kanban">${STATUS.map(([k]) => col(k))}</div>`;
  }

  /* ── 係・名簿 ── */
  const staffFields = [
    { k: 'name', label: '名前', required: true },
    { k: 'team', label: '係', placeholder: '受付' },
    { k: 'role', label: '役割', placeholder: '受付係 長', full: true },
    { k: 'email', label: 'メール', type: 'email' },
    { k: 'tel', label: '電話', type: 'tel' },
  ];
  function staffView(ev) {
    const s = st();
    const list = ev.staff.filter((x) => !s.staffTeam || x.team === s.staffTeam);
    return html`<div class="toolbar">
        <label class="row tight small muted">係 <select data-filter="staffTeam" aria-label="係でしぼりこむ"><option value="">すべて</option>${teams(ev).map((t) => html`<option ${s.staffTeam === t ? T.raw('selected') : ''}>${t}</option>`)}</select></label>
        <span class="spacer"></span>
        <button class="btn sm" data-act="copyMails">${icon('copy')} ${s.staffTeam ? `「${s.staffTeam}」の` : '係の人の'}メールをまとめてコピー</button>
      </div>
      ${list.length ? html`<div class="tbl-wrap"><table class="tbl">
        <thead><tr><th>名前</th><th>係</th><th>役割</th><th>メール</th><th>電話</th><th></th></tr></thead>
        <tbody>${list.map((x) => html`<tr>
          <td class="nowrap"><b>${x.name}</b></td><td>${x.team ? html`<span class="chip pri">${x.team}</span>` : ''}</td><td>${x.role}</td>
          <td>${x.email ? html`<a href="mailto:${x.email}">${x.email}</a>` : ''}</td><td class="nowrap">${x.tel}</td>
          <td class="act"><button class="btn sm ghost" data-act="staffEdit" data-id="${x.id}">${icon('edit')} 直す</button></td>
        </tr>`)}</tbody></table></div>` : html`<div class="empty">係の人がまだいません。</div>`}
      <p class="help">ここの名前は、管理画面にログインするときの「あなたは」と、やることの「担当」に出ます。</p>`;
  }

  T.page('admin', 'board', {
    title: '運営ボード', icon: 'board', group: '運営', order: 10,
    lead: '日数教本部・実行委員会・会場校・各係の、連絡とやることをひとつの場所に。',
    head() {
      const t = st().tab;
      if (t === 'tasks') return html`<button class="btn primary" data-act="taskAdd">${icon('plus')} やることを足す</button>`;
      if (t === 'staff') return html`<button class="btn primary" data-act="staffAdd">${icon('plus')} 係の人を足す</button>`;
      return '';
    },
    render() {
      const ev = T.ev();
      const s = st();
      const near = soon(ev);
      const open = ev.tasks.filter((t) => t.status !== 'done').length;
      return html`${near.length ? html`<div class="note warn bd-soon">
          <b>${icon('bell')} 期限が近いもの（7日以内・すぎたもの）</b>
          <ul>${near.map((t) => html`<li><button class="linkish" data-act="taskEdit" data-id="${t.id}">${t.title}</button> ${dueChip(t)} <span class="muted small">${t.who || '担当なし'}</span></li>`)}</ul>
        </div>` : ''}
        <div class="tabs" role="tablist">
          <button class="tab" role="tab" aria-selected="${s.tab === 'posts'}" data-act="tab" data-tab="posts">連絡板（${ev.board.length}）</button>
          <button class="tab" role="tab" aria-selected="${s.tab === 'tasks'}" data-act="tab" data-tab="tasks">やること（のこり ${open}）</button>
          <button class="tab" role="tab" aria-selected="${s.tab === 'staff'}" data-act="tab" data-tab="staff">係・名簿（${ev.staff.length}）</button>
        </div>
        ${s.tab === 'tasks' ? tasksView(ev) : s.tab === 'staff' ? staffView(ev) : postsView(ev)}`;
    },
    mount(root) {
      for (const sel of root.querySelectorAll('[data-filter]')) sel.addEventListener('change', () => { st()[sel.dataset.filter] = sel.value; T.refresh(); });
      // Ctrl（⌘）+ Enter で投稿
      const ta = root.querySelector('.bd-compose textarea');
      if (ta) ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); ta.form.requestSubmit(); } });
    },
    acts: {
      tab(el) { st().tab = el.dataset.tab; T.refresh(); },
      ch(el) { st().ch = el.dataset.ch; T.refresh(); },
      clearFilter() { const s = st(); s.team = ''; s.who = ''; T.refresh(); },
      pin(el) { const p = T.find(T.ev().board, el.dataset.id); if (!p) return; p.pinned = !p.pinned; T.save(); T.refresh(); T.toast(p.pinned ? 'ピン留めしました' : 'ピン留めを外しました'); },
      async postDel(el) {
        const ev = T.ev();
        if (!(await T.confirm('この連絡を削除します（返信も消えます）。よろしいですか？', { danger: true, ok: '削除する' }))) return;
        T.removeFrom(ev.board, el.dataset.id); T.save(); T.refresh(); T.toast('削除しました');
      },

      taskAdd() {
        const ev = T.ev();
        const s = st();
        T.editRecord({
          title: 'やることを足す', fields: taskFields(ev), value: { status: 'todo', team: s.team, who: s.who || '' },
          onSave(v) { ev.tasks.push(Object.assign({ id: T.uid('k') }, v)); T.logIt(`やること「${v.title}」を追加`, T.who()); T.save(); T.refresh(); T.toast('足しました'); },
        });
      },
      taskEdit(el) {
        const ev = T.ev();
        const t = T.find(ev.tasks, el.dataset.id);
        if (!t) return;
        T.editRecord({
          title: 'やることを直す', fields: taskFields(ev), value: t,
          onSave(v) { const was = t.status; Object.assign(t, v); if (was !== 'done' && v.status === 'done') T.logIt(`やること「${t.title}」が終わった`, T.who()); T.save(); T.refresh(); T.toast('直しました'); },
          onDelete() { T.removeFrom(ev.tasks, t.id); T.save(); T.refresh(); T.toast('削除しました'); },
        });
      },
      taskMove(el) {
        const ev = T.ev();
        const t = T.find(ev.tasks, el.dataset.id);
        if (!t) return;
        const i = STATUS.findIndex((x) => x[0] === (t.status || 'todo'));
        const j = Math.max(0, Math.min(2, i + Number(el.dataset.d)));
        t.status = STATUS[j][0];
        if (t.status === 'done') T.logIt(`やること「${t.title}」が終わった`, T.who());
        T.save(); T.refresh(); T.toast(`「${SLABEL[t.status]}」にしました`);
      },

      staffAdd() {
        const ev = T.ev();
        T.editRecord({
          title: '係の人を足す', fields: staffFields, value: { team: st().staffTeam },
          onSave(v) { ev.staff.push(Object.assign({ id: T.uid('st') }, v)); T.logIt(`係「${v.team}」に ${v.name} さんを追加`, T.who()); T.save(); T.refresh(); T.toast('足しました'); },
        });
      },
      staffEdit(el) {
        const ev = T.ev();
        const x = T.find(ev.staff, el.dataset.id);
        if (!x) return;
        T.editRecord({
          title: x.name + ' さん', fields: staffFields, value: x,
          onSave(v) { Object.assign(x, v); T.save(); T.refresh(); T.toast('直しました'); },
          onDelete() { T.removeFrom(ev.staff, x.id); T.save(); T.refresh(); T.toast('削除しました'); },
        });
      },
      copyMails() {
        const ev = T.ev();
        const s = st();
        const mails = ev.staff.filter((x) => (!s.staffTeam || x.team === s.staffTeam) && x.email).map((x) => x.email);
        if (!mails.length) return T.toast('メールのある人がいません', 'warn');
        T.copy(mails.join(', '), `${mails.length}人のメールをコピーしました（宛先・BCC に貼れます）`);
      },
    },
    forms: {
      post(v, form) {
        const text = String(v.text || '').trim();
        if (!text) return;
        const ev = T.ev();
        ev.board.push({ id: T.uid('b'), ch: v.ch || '全体', author: T.who(), text, at: T.now(), pinned: false, replies: [] });
        T.save(); form.reset(); T.refresh(); T.toast(`# ${v.ch} に投稿しました`);
      },
      reply(v) {
        const text = String(v.text || '').trim();
        const p = T.find(T.ev().board, v.id);
        if (!p || !text) return;
        p.replies = p.replies || [];
        p.replies.push({ author: T.who(), text, at: T.now() });
        T.save(); T.refresh(); T.toast('返信しました');
      },
    },
  });
})();
