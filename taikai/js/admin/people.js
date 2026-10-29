/* 参加者・入金：一覧（検索・絞りこみ・入金の切りかえ・まとめて操作）／集計／1人の詳細の窓（T.openPerson）
   手入力で追加・CSV の書き出しと読みこみ・名札と受付名簿の印刷（#/print/badges・#/print/roster）も、ここにある。 */
(function () {
  'use strict';
  const { html, icon } = T;

  const st = T.uiState('people', { tab: 'list', q: '', bu: '', kind: '', paid: '', ci: '', cancel: '', limit: 100, sel: new Set(), opened: '' });

  // 受付をする日（プログラムの日。なければ大会の初日を1日だけ）。受付の画面・名簿でも使う
  T.checkinDays = (ev = T.ev()) => (ev.program.days.length ? ev.program.days : [{ id: 'main', date: ev.info.start || T.today(), label: '当日' }]);
  const fieldOf = (ev, id) => ev.form.fields.find((f) => f.id === id);
  const optsOf = (ev, id) => ((fieldOf(ev, id) || {}).options || []).map((o) => o.v);
  const inputFields = (ev) => ev.form.fields.filter((f) => f.type !== 'heading');
  const checked = (p) => Object.keys(p.checkin || {}).filter((k) => p.checkin[k]);

  function payChip(p, ev) {
    const fee = T.fee(p, ev);
    if (!fee) return html`<span class="chip">不要</span>`;
    return p.paid ? html`<span class="chip ok">${icon('check')}入金済み</span>` : html`<span class="chip warn">未入金</span>`;
  }

  function filtered(ev) {
    const q = st.q.trim().toLowerCase();
    return ev.people.filter((p) => {
      if (st.cancel === '' && p.status === 'cancel') return false;
      if (st.cancel === 'only' && p.status !== 'cancel') return false;
      if (st.bu && T.pv(p, 'bu') !== st.bu) return false;
      if (st.kind && T.pv(p, 'kind') !== st.kind) return false;
      if (st.paid) {
        const fee = T.fee(p, ev);
        if (st.paid === 'paid' && !(fee && p.paid)) return false;
        if (st.paid === 'unpaid' && !(fee && !p.paid)) return false;
        if (st.paid === 'free' && fee) return false;
      }
      if (st.ci === 'yes' && !checked(p).length) return false;
      if (st.ci === 'no' && checked(p).length) return false;
      if (q) {
        const hay = [p.code, T.pv(p, 'name'), T.pv(p, 'kana'), T.pv(p, 'org'), T.pv(p, 'email')].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    }).sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0)); // 新しい申込が上
  }

  /* ───────── 入金 ───────── */
  async function setPaid(p, val, o = {}) {
    const ev = T.ev();
    p.paid = !!val;
    p.paidAt = val ? T.now() : '';
    T.logIt(`${p.code} ${T.pname(p)}：${val ? '入金済みにしました' : '未入金に戻しました'}`, T.who());
    T.save();
    if (o.refresh !== false) T.refresh();
    if (val && o.ask !== false) await askPaidMail([p]);
  }
  async function askPaidMail(list) {
    const ev = T.ev();
    const tpl = T.find(ev.templates, 't2');
    if (!tpl || !list.length) return;
    const ok = await T.confirm(`「${tpl.name}」のメールを${list.length > 1 ? `${list.length}人に` : ''}送りますか？`, { title: '入金確認のメール', ok: '送る' });
    if (!ok) return;
    const rec = await T.mail.send({ subject: tpl.subject, body: tpl.body, to: list.map((p) => p.id), method: 'auto', templateId: tpl.id });
    T.save();
    T.toast(rec.error ? '記録しましたが、送信できませんでした：' + rec.error : '入金確認のメールを記録しました' + (rec.sent ? '（送信ずみ）' : ''), rec.error ? 'warn' : 'ok');
  }

  /* ───────── 一覧 ───────── */
  function listHtml(ev) {
    const rows = filtered(ev);
    const shown = rows.slice(0, st.limit);
    const days = T.checkinDays(ev);
    const selN = [...st.sel].filter((id) => T.find(ev.people, id)).length;
    const allOn = shown.length && shown.every((p) => st.sel.has(p.id));
    const sel = (k, v, label, opts) => html`<select data-filter="${k}" aria-label="${label}"><option value="">${label}</option>${opts.map(([ov, ol]) => html`<option value="${ov}" ${v === ov ? T.raw('selected') : ''}>${ol}</option>`)}</select>`;
    return html`
      <div class="toolbar">
        ${T.searchBox('people', st.q, '氏名・ふりがな・受付番号・所属・メール')}
        ${sel('bu', st.bu, '部会：すべて', optsOf(ev, 'bu').map((v) => [v, v]))}
        ${sel('kind', st.kind, '区分：すべて', optsOf(ev, 'kind').map((v) => [v, v]))}
        ${sel('paid', st.paid, '入金：すべて', [['unpaid', '未入金'], ['paid', '入金済み'], ['free', '支払い不要']])}
        ${sel('ci', st.ci, '受付：すべて', [['yes', '受付済み'], ['no', 'まだ']])}
        <select data-filter="cancel" aria-label="取消"><option value="" ${st.cancel === '' ? T.raw('selected') : ''}>取消を除く</option><option value="all" ${st.cancel === 'all' ? T.raw('selected') : ''}>取消もふくむ</option><option value="only" ${st.cancel === 'only' ? T.raw('selected') : ''}>取消だけ</option></select>
        <span class="muted small">${rows.length}人</span>
      </div>
      ${selN ? html`<div class="pp-bulk" role="region" aria-label="選んだ人への操作">
        <b>${selN}人を選んでいます</b>
        <button class="btn sm primary" data-act="bulkPaid">${icon('yen')} 入金済みにする</button>
        <button class="btn sm" data-act="bulkMail">${icon('mail')} 選んだ人に一斉連絡</button>
        <button class="btn sm" data-act="bulkBadges">${icon('print')} 名札を印刷</button>
        <button class="btn sm ghost" data-act="selClear">選ぶのをやめる</button>
      </div>` : ''}
      ${rows.length ? html`<div class="tbl-wrap pp-wrap"><table class="tbl pp-table">
        <thead><tr>
          <th class="pp-ck"><input type="checkbox" data-selall aria-label="表示している人をすべて選ぶ" ${allOn ? T.raw('checked') : ''}></th>
          <th>受付番号</th><th>氏名</th><th>所属</th><th>部会</th><th>区分</th><th class="right">参加費</th><th>入金</th><th>受付</th><th>申込日</th>
        </tr></thead>
        <tbody>${shown.map((p) => {
          const fee = T.fee(p, ev);
          const ci = days.filter((d) => p.checkin && p.checkin[d.id]);
          return html`<tr class="click ${p.status === 'cancel' ? 'is-cancel' : ''} ${st.sel.has(p.id) ? 'is-sel' : ''}" data-pid="${p.id}">
            <td class="pp-ck"><input type="checkbox" data-sel="${p.id}" aria-label="${T.pname(p)} を選ぶ" ${st.sel.has(p.id) ? T.raw('checked') : ''}></td>
            <td class="mono nowrap">${p.code}</td>
            <td class="pp-name"><b>${T.pname(p)}</b><small>${T.pv(p, 'kana') || ''}</small>${p.status === 'cancel' ? html` <span class="chip bad">取消</span>` : ''}${T.pv(p, 'needs') ? html` <span class="chip info" title="${T.pv(p, 'needs')}">配慮</span>` : ''}</td>
            <td class="pp-org">${T.pv(p, 'org') || ''}<small>${T.pv(p, 'pref') || ''}</small></td>
            <td class="nowrap">${(T.pv(p, 'bu') || '').replace('部会', '')}</td>
            <td class="nowrap small">${T.pv(p, 'kind') || ''}</td>
            <td class="right num nowrap">${fee ? T.yen(fee) : '—'}</td>
            <td class="nowrap">${fee && p.status !== 'cancel' ? html`<button class="pp-pay ${p.paid ? 'on' : ''}" data-act="togglePaid" data-id="${p.id}" title="押すと切りかえ">${payChip(p, ev)}</button>` : payChip(p, ev)}</td>
            <td class="nowrap">${ci.length ? ci.map((d) => html`<span class="chip ok">${T.md(d.date).replace(/（.）/, '')}</span> `) : html`<span class="faint">—</span>`}</td>
            <td class="nowrap small muted">${T.md(p.createdAt)}</td>
          </tr>`;
        })}</tbody>
      </table></div>
      ${rows.length > shown.length ? html`<div class="row" style="justify-content:center;margin-top:12px"><button class="btn" data-act="more">もっと見る（あと ${rows.length - shown.length}人）</button></div>` : ''}`
      : html`<div class="empty">条件に合う人はいません。</div>`}`;
  }

  /* ───────── 集計 ───────── */
  function aggHtml(ev) {
    const act = T.active(ev);
    const n = act.length || 1;
    const fields = ev.form.fields.filter((f) => ['select', 'radio', 'checks'].includes(f.type) && (f.options || []).length);
    const paidSum = T.sum(act.filter((p) => p.paid), (p) => T.fee(p, ev));
    const unpaidSum = T.sum(act.filter((p) => !p.paid), (p) => T.fee(p, ev));
    const days = T.checkinDays(ev);
    const card = (title, rows, note, total) => {
      const max = Math.max(1, ...rows.map((r) => r[1]));
      return html`<div class="card flat pp-agg"><div class="card-head"><h3>${title}</h3><span class="spacer"></span>${note ? html`<span class="muted small">${note}</span>` : ''}</div>
        <table class="agg-table">${rows.map(([label, c, sub]) => html`<tr><th>${label}</th><td class="agg-bar"><div class="bar"><span style="width:${(c / max) * 100}%"></span></div></td><td class="num right nowrap"><b>${c}</b>人${sub ? html`<small class="muted"> ${sub}</small>` : ''}</td></tr>`)}</table>
        ${total ? html`<p class="small muted" style="margin:8px 0 0">${total}</p>` : ''}</div>`;
    };
    const blocks = fields.map((f) => {
      const counts = new Map(f.options.map((o) => [o.v, 0]));
      for (const p of act) { const v = p.a[f.id]; for (const x of [].concat(v == null ? [] : v)) if (counts.has(x)) counts.set(x, counts.get(x) + 1); }
      let rows = [...counts.entries()].map(([k, c]) => [k, c, Math.round((c / n) * 100) + '%']);
      if (rows.length > 12) rows = rows.filter((r) => r[1] > 0).sort((a, b) => b[1] - a[1]);
      const fee = f.options.some((o) => o.fee);
      const feeTotal = fee ? T.sum(f.options, (o) => (o.fee || 0) * (counts.get(o.v) || 0)) : 0;
      return card(f.short ? `${f.label}` : f.label, rows, f.type === 'checks' ? 'いくつでも選べる項目' : '', fee ? `この項目の金額の合計：${T.yen(feeTotal)}` : '');
    });
    const ciRows = days.map((d) => [`${T.md(d.date)} ${d.label || ''}`, act.filter((p) => p.checkin && p.checkin[d.id]).length, '']);
    return html`
      <div class="stats" style="margin-bottom:16px">
        <div class="stat"><div class="stat-label">参加費の合計（取消を除く）</div><div class="stat-value">${T.yen(paidSum + unpaidSum)}</div></div>
        <div class="stat"><div class="stat-label">入金済み</div><div class="stat-value" style="color:var(--ok)">${T.yen(paidSum)}</div></div>
        <div class="stat"><div class="stat-label">未入金</div><div class="stat-value" style="color:var(--warn)">${T.yen(unpaidSum)}</div></div>
      </div>
      <div class="grid2">${blocks}${card('当日の受付', ciRows, '', '')}</div>
      <p class="help" style="margin-top:12px">申込フォームの「選ぶ」項目（プルダウン・ボタン・チェック）を、自動で数えています。項目を足すと、ここにも出ます。</p>`;
  }

  T.page('admin', 'people', {
    title: '参加者・入金', nav: '参加者・入金', icon: 'users', group: '参加者', order: 20,
    lead: '申込の一覧・入金の確認・名札や名簿の印刷。行を押すと、その人の詳しい内容が出ます。',
    head() {
      return html`<button class="btn sm" data-act="addManual">${icon('plus')} 手入力で追加</button>
        <button class="btn sm" data-act="exportCsv">${icon('download')} CSV 書き出し</button>
        <button class="btn sm" data-act="importCsv">${icon('upload')} CSV 読みこみ</button>
        <a class="btn sm" href="#/print/badges?back=admin/people">${icon('print')} 名札</a>
        <a class="btn sm" href="#/print/roster?back=admin/people">${icon('print')} 受付名簿</a>`;
    },
    render() {
      const ev = T.ev();
      const act = T.active(ev);
      const withFee = act.filter((p) => T.fee(p, ev) > 0);
      const paid = withFee.filter((p) => p.paid);
      const unpaid = withFee.filter((p) => !p.paid);
      const ci = act.filter((p) => checked(p).length);
      const cancel = ev.people.filter((p) => p.status === 'cancel');
      return html`
        <div class="stats pp-stats">
          <div class="stat"><div class="stat-label">${icon('users')} 申込（取消を除く）</div><div class="stat-value">${act.length}<small>人</small></div>${ev.info.capacity ? html`<div class="stat-sub">定員 ${T.num(ev.info.capacity)}人の ${T.pct(act.length, ev.info.capacity)}</div>` : ''}</div>
          <div class="stat"><div class="stat-label">${icon('check')} 入金済み</div><div class="stat-value">${paid.length}<small>人</small></div><div class="stat-sub">${T.yen(T.sum(paid, (p) => T.fee(p, ev)))}</div></div>
          <div class="stat"><div class="stat-label">${icon('yen')} 未入金</div><div class="stat-value" style="color:var(--warn)">${unpaid.length}<small>人</small></div><div class="stat-sub">${T.yen(T.sum(unpaid, (p) => T.fee(p, ev)))}</div></div>
          <div class="stat"><div class="stat-label">${icon('scan')} 受付済み</div><div class="stat-value">${ci.length}<small>人</small></div><div class="stat-sub">${T.pct(ci.length, act.length)}</div></div>
          <div class="stat"><div class="stat-label">${icon('x')} 取消</div><div class="stat-value">${cancel.length}<small>人</small></div></div>
        </div>
        <div class="tabs" role="tablist" style="margin-top:18px">
          <button class="tab" role="tab" data-act="tab" data-tab="list" aria-selected="${st.tab === 'list'}">${icon('list')} 一覧</button>
          <button class="tab" role="tab" data-act="tab" data-tab="agg" aria-selected="${st.tab === 'agg'}">${icon('chart')} 集計</button>
        </div>
        ${st.tab === 'agg' ? aggHtml(ev) : listHtml(ev)}`;
    },
    mount(root, r) {
      T.bindSearch(root, 'people', (v) => { st.q = v; st.limit = 100; });
      root.querySelectorAll('[data-filter]').forEach((el) => el.addEventListener('change', () => { st[el.dataset.filter] = el.value; st.limit = 100; T.refresh(); }));
      root.querySelectorAll('[data-sel]').forEach((el) => el.addEventListener('change', () => { if (el.checked) st.sel.add(el.dataset.sel); else st.sel.delete(el.dataset.sel); T.refresh(); }));
      const all = root.querySelector('[data-selall]');
      if (all) all.addEventListener('change', () => {
        const shown = filtered(T.ev()).slice(0, st.limit);
        for (const p of shown) { if (all.checked) st.sel.add(p.id); else st.sel.delete(p.id); }
        T.refresh();
      });
      const tb = root.querySelector('.pp-table tbody');
      if (tb) tb.addEventListener('click', (e) => {
        if (e.target.closest('input,button,a,label')) return;
        const tr = e.target.closest('tr[data-pid]');
        if (tr) T.openPerson(tr.dataset.pid);
      });
      // #/admin/people?open=<id> で開いたとき
      if (r.q.open && st.opened !== r.q.open) {
        st.opened = r.q.open;
        history.replaceState(null, '', '#/admin/people');
        setTimeout(() => T.openPerson(r.q.open), 0);
      }
    },
    acts: {
      tab(el) { st.tab = el.dataset.tab; T.refresh(); },
      more() { st.limit += 100; T.refresh(); },
      selClear() { st.sel.clear(); T.refresh(); },
      async togglePaid(el) { const p = T.find(T.ev().people, el.dataset.id); if (p) await setPaid(p, !p.paid); },
      async bulkPaid() {
        const ev = T.ev();
        const list = [...st.sel].map((id) => T.find(ev.people, id)).filter((p) => p && p.status !== 'cancel' && T.fee(p, ev) > 0 && !p.paid);
        if (!list.length) return T.toast('選んだ人の中に、未入金の人はいません', 'warn');
        if (!(await T.confirm(`${list.length}人を「入金済み」にします。よろしいですか？`, { ok: '入金済みにする' }))) return;
        for (const p of list) await setPaid(p, true, { refresh: false, ask: false });
        st.sel.clear();
        T.refresh();
        T.toast(`${list.length}人を入金済みにしました`);
        await askPaidMail(list);
      },
      bulkMail() {
        const ids = [...st.sel].filter((id) => T.find(T.ev().people, id));
        T.ui.mailPreset = { ids };
        T.go('admin/mail');
      },
      bulkBadges() { T.go(`print/badges?ids=${[...st.sel].join(',')}&back=admin/people`); },
      addManual() { addManual(); },
      exportCsv() { exportCsv(); },
      importCsv() { importCsv(); },
    },
  });

  /* ───────── 1人の詳細の窓 ───────── */
  function detailHtml(p, ev, mode) {
    const fee = T.fee(p, ev);
    const lines = T.feeLines(p.a, ev);
    const days = T.checkinDays(ev);
    const mails = T.mail.forPerson(p.id, ev);
    const threads = ev.threads.filter((t) => t.pid === p.id);
    if (mode === 'edit') {
      return html`<form class="pd-edit" onsubmit="return false">
        <p class="help">申込の答えを直します。参加費は選んだものから計算しなおします。</p>
        ${T.formHtml(ev.form.fields, p.a, { admin: true })}
        <div class="pd-fee" data-fee></div>
        <div class="row end" style="margin-top:14px"><button type="button" class="btn" data-p="view">やめる</button><button type="button" class="btn primary" data-p="saveEdit">${icon('check')} 保存する</button></div>
      </form>`;
    }
    return html`
      <div class="row pd-chips">
        <span class="mono chip pri">${p.code}</span>
        ${p.status === 'cancel' ? html`<span class="chip bad">取消</span>` : html`<span class="chip ok">申込</span>`}
        <span class="chip">${T.pv(p, 'kind') || ''}</span><span class="chip">${T.pv(p, 'bu') || ''}</span>
        <span class="muted small">申込：${T.dateJa(p.createdAt)} ${T.time(p.createdAt)}</span>
      </div>
      <div class="pd-grid">
        <div class="pd-main">
          <h3 class="pd-h">申込の内容</h3>
          <dl class="pd-dl">${inputFields(ev).map((f) => html`<div><dt>${f.label}</dt><dd>${T.answerText(f, p.a[f.id]) || html`<span class="faint">—</span>`}</dd></div>`)}</dl>

          <h3 class="pd-h">参加費</h3>
          ${lines.length ? html`<ul class="fee-lines">${lines.map((l) => html`<li><span>${l.label}</span><b>${T.yen(l.fee)}</b></li>`)}</ul>` : ''}
          <div class="pd-pay">
            <div><span class="muted small">合計</span> <b class="pd-total">${T.yen(fee)}</b> ${payChip(p, ev)}${p.paid && p.paidAt ? html` <span class="muted small">${T.dateJa(p.paidAt)}</span>` : ''}</div>
            ${fee && p.status !== 'cancel' ? html`<button class="btn sm ${p.paid ? '' : 'primary'}" data-p="paid">${p.paid ? '未入金に戻す' : html`${icon('yen')} 入金済みにする`}</button>` : ''}
          </div>

          <h3 class="pd-h">当日の受付</h3>
          <div class="pd-days">${days.map((d) => {
            const t = p.checkin && p.checkin[d.id];
            return html`<div class="pd-day ${t ? 'on' : ''}"><span>${T.md(d.date)} <small class="muted">${d.label || ''}</small></span>
              ${t ? html`<b class="ok-text">${icon('check')} ${T.time(t)}</b>` : html`<span class="faint">まだ</span>`}
              ${p.status !== 'cancel' ? html`<button class="btn sm ghost" data-p="ci" data-day="${d.id}">${t ? '取り消す' : '受付する'}</button>` : ''}</div>`;
          })}</div>

          <h3 class="pd-h">運営のメモ</h3>
          <textarea class="pd-memo" rows="2" placeholder="例：10/18 電話で弁当の変更を受けた">${p.memo || ''}</textarea>
          <div class="row end" style="margin-top:6px"><button class="btn sm" data-p="memo">メモを保存</button></div>

          <h3 class="pd-h">届いたメール（${mails.length}）</h3>
          ${mails.length ? html`<div class="pd-mails">${mails.map((m) => html`<details><summary><span class="muted small nowrap">${T.dt(m.at)}</span> ${m.subject}</summary><pre class="pd-pre">${m.body}</pre></details>`)}</div>` : html`<p class="muted small">まだありません。</p>`}

          <h3 class="pd-h">問い合わせ（${threads.length}）</h3>
          ${threads.length ? html`<ul class="pd-threads">${threads.map((t) => html`<li><a href="#/admin/inbox/${t.id}" data-p="go">${t.subject}</a> <span class="chip ${t.status === 'open' ? 'bad' : t.status === 'doing' ? 'warn' : 'ok'}">${{ open: '未対応', doing: '対応中', done: '完了' }[t.status] || t.status}</span> <span class="muted small">${T.dt(t.at)}</span></li>`)}</ul>` : html`<p class="muted small">ありません。</p>`}
        </div>
        <aside class="pd-side">
          <div class="pd-qr">${T.raw(T.qrSvg(T.qrText(p), { label: p.code + ' の受付用QR' }))}<b class="mono">${p.code}</b><small class="muted">本人用QR（受付で読む）</small></div>
          <div class="pd-links">
            <button class="btn sm" data-p="copyUrl">${icon('copy')} マイページのURL</button>
            <a class="btn sm" href="${T.mypageUrl(p, ev)}" target="_blank" rel="noopener">${icon('external')} マイページを開く</a>
            <a class="btn sm" href="#/print/badges?ids=${p.id}&back=admin/people" data-p="go">${icon('print')} 名札</a>
          </div>
          <p class="help">合言葉：<span class="mono">${p.token}</span>（QRとマイページのURLに入っています。人に見せない）</p>
        </aside>
      </div>
      <div class="pd-foot row">
        <button class="btn sm" data-p="edit">${icon('edit')} 答えを直す</button>
        <span class="spacer"></span>
        ${p.status === 'cancel' ? html`<button class="btn sm" data-p="uncancel">取消を戻す</button>` : html`<button class="btn sm danger ghost" data-p="cancel">${icon('x')} 取消にする</button>`}
      </div>`;
  }

  T.openPerson = (pid) => {
    const ev = T.ev();
    const p = T.find(ev.people, pid);
    if (!p) return T.toast('その人は見つかりません', 'bad');
    let changed = false, mode = 'view', wrapEl = null;
    const draw = () => {
      const body = wrapEl.querySelector('.modal-body');
      body.innerHTML = String(detailHtml(p, ev, mode));
      wrapEl.querySelector('.modal-head h2').textContent = `${p.code}　${T.pname(p)}`;
      if (mode === 'edit') { const f = body.querySelector('form'); T.bindFee(f, ev.form.fields, body.querySelector('[data-fee]')); }
    };
    const onClick = async (e) => {
      const b = e.target.closest('[data-p]');
      if (!b) return;
      const k = b.dataset.p;
      if (k === 'go') { wrapEl.closeWith(null); return; }
      e.preventDefault();
      if (k === 'paid') { await setPaid(p, !p.paid, { refresh: false }); changed = true; }
      else if (k === 'ci') {
        const d = b.dataset.day;
        if (p.checkin[d]) delete p.checkin[d]; else p.checkin[d] = T.now();
        T.logIt(`${p.code} ${T.pname(p)}：受付を${p.checkin[d] ? '手で記録' : '取り消し'}（${d}）`, T.who());
        T.save(); changed = true;
      } else if (k === 'memo') { p.memo = wrapEl.querySelector('.pd-memo').value.trim(); T.save(); changed = true; T.toast('メモを保存しました'); }
      else if (k === 'copyUrl') { T.copy(T.mypageUrl(p, ev), 'マイページのURLをコピーしました'); return; }
      else if (k === 'edit') mode = 'edit';
      else if (k === 'view') mode = 'view';
      else if (k === 'saveEdit') {
        const { a, missing } = T.readForm(wrapEl.querySelector('form'), ev.form.fields);
        if (missing.length) { T.toast('足りないもの：' + missing.join('、'), 'bad'); return; }
        p.a = Object.assign({}, p.a, a);
        T.logIt(`${p.code} ${T.pname(p)}：申込の内容を直しました`, T.who());
        T.save(); changed = true; mode = 'view'; T.toast('保存しました');
      } else if (k === 'cancel') {
        if (!(await T.confirm(`${T.pname(p)} さんの申込を「取消」にします。名札・名簿・一斉連絡の対象から外れます。`, { ok: '取消にする', danger: true }))) return;
        p.status = 'cancel'; T.logIt(`${p.code} ${T.pname(p)}：申込を取消にしました`, T.who()); T.save(); changed = true;
      } else if (k === 'uncancel') { p.status = 'ok'; T.logIt(`${p.code} ${T.pname(p)}：取消を戻しました`, T.who()); T.save(); changed = true; }
      draw();
    };
    return T.modal({
      title: `${p.code}　${T.pname(p)}`, wide: true, cls: 'pd-modal', body: '',
      onOpen(w) { wrapEl = w; draw(); w.addEventListener('click', onClick); },
    }).then(() => { if (changed && T.current && T.current.where === 'admin') T.refresh(); });
  };

  /* ───────── 手入力で追加 ───────── */
  async function addManual() {
    const ev = T.ev();
    let made = null;
    const tpl = T.find(ev.templates, ev.form.confirmTemplate || 't1');
    await T.modal({
      title: '手入力で追加（電話・FAX・紙の申込）', wide: true,
      body: String(html`<form onsubmit="return false" class="pd-edit">
        <p class="lead">受付番号と本人用のQRは、追加すると自動でできます。</p>
        ${T.formHtml(ev.form.fields, {}, { admin: true })}
        <div class="pd-fee" data-fee></div>
        <label class="check" style="margin-top:10px"><input type="checkbox" name="__paid"> <span>参加費は受けとり済み（入金済みにする）</span></label><br>
        ${tpl ? html`<label class="check"><input type="checkbox" name="__mail" checked> <span>「${tpl.name}」のメールを送る（メールアドレスがあるとき）</span></label>` : ''}
      </form>`),
      actions: [{ label: 'やめる', value: 'cancel' }, { label: '追加する', kind: 'primary', value: 'add' }],
      onOpen(w) { T.bindFee(w.querySelector('form'), ev.form.fields, w.querySelector('[data-fee]')); },
      validate(v, w) {
        const form = w.querySelector('form');
        const { a, missing } = T.readForm(form, ev.form.fields);
        if (missing.length) { T.toast('足りないもの：' + missing.join('、'), 'bad'); return false; }
        made = { a, paid: form.querySelector('[name="__paid"]').checked, mail: !!(form.querySelector('[name="__mail"]') || {}).checked };
        return true;
      },
    });
    if (!made) return;
    const p = { id: T.uid('p'), code: T.newCode(ev), token: T.newToken(), createdAt: T.now(), a: made.a, paid: made.paid, paidAt: made.paid ? T.now() : '', checkin: {}, status: 'ok', memo: '手入力で追加（' + T.who() + '）', via: 'manual' };
    ev.people.push(p);
    T.logIt(`${p.code} ${T.pname(p)}：手入力で追加しました`, T.who());
    if (made.mail && tpl && p.a.email) await T.mail.send({ subject: tpl.subject, body: tpl.body, to: [p.id], method: 'auto', templateId: tpl.id });
    T.save();
    T.refresh();
    T.toast(`${p.code} で追加しました`);
    T.openPerson(p.id);
  }

  /* ───────── CSV ───────── */
  function exportCsv() {
    const ev = T.ev();
    const rows = filtered(ev);
    const fields = inputFields(ev);
    const days = T.checkinDays(ev);
    const head = ['受付番号', '申込日時', '状態', ...fields.map((f) => f.label), '参加費', '入金', '入金日', ...days.map((d) => `受付 ${T.md(d.date)}`), 'メモ'];
    const out = [head];
    for (const p of rows) {
      out.push([
        p.code, T.ymd(p.createdAt) + ' ' + T.time(p.createdAt), p.status === 'cancel' ? '取消' : '申込',
        ...fields.map((f) => T.answerText(f, p.a[f.id])),
        T.fee(p, ev), T.fee(p, ev) ? (p.paid ? '入金済み' : '未入金') : '不要', p.paidAt ? T.ymd(p.paidAt) : '',
        ...days.map((d) => (p.checkin && p.checkin[d.id] ? T.time(p.checkin[d.id]) : '')), p.memo || '',
      ]);
    }
    T.download(`${ev.id}-参加者-${T.today()}.csv`, T.csv(out), 'text/csv;charset=utf-8');
    T.toast(`${rows.length}人を書き出しました（いまの絞りこみの条件で）`);
  }

  const SPECIAL = [['__skip', '（取りこまない）'], ['__code', '受付番号'], ['__created', '申込日時'], ['__paid', '入金'], ['__memo', 'メモ']];
  const norm = (s) => String(s || '').replace(/[\s　（）()・:：「」]/g, '').toLowerCase();
  function guess(label, ev) {
    const n = norm(label);
    if (!n) return '__skip';
    if (/受付番号|^code$/.test(n)) return '__code';
    if (/タイムスタンプ|申込日|timestamp/.test(n)) return '__created';
    if (/^入金$|入金状況|支払/.test(n)) return '__paid';
    if (/^メモ$|備考/.test(n)) return '__memo';
    const fs = inputFields(ev);
    const exact = fs.find((f) => norm(f.label) === n);
    if (exact) return exact.id;
    const part = fs.find((f) => norm(f.label).includes(n) || n.includes(norm(f.label)));
    if (part) return part.id;
    if (/氏名|名前/.test(n)) return 'name';
    if (/メール|mail/.test(n)) return 'email';
    if (/所属|学校/.test(n)) return 'org';
    return '__skip';
  }

  async function importCsv() {
    const ev = T.ev();
    const file = await T.pickFile('.csv,text/csv');
    if (!file) return;
    let text = await T.readFile(file, 'text');
    if (/�/.test(text)) {
      // UTF-8 で読めないとき（Excel の「CSV（コンマ区切り）」は Shift_JIS のことがある）
      try { const buf = await T.readFile(file, 'buffer'); text = new TextDecoder('shift_jis').decode(buf); } catch (e) { /* そのまま */ }
    }
    const rows = T.parseCsv(text);
    if (rows.length < 2) return T.toast('CSV に、見出しの行とデータの行が必要です', 'bad');
    const head = rows[0];
    const data = rows.slice(1);
    const map = head.map((h) => guess(h, ev));
    const fs = inputFields(ev);
    const emails = new Set(ev.people.map((p) => String(p.a.email || '').toLowerCase()).filter(Boolean));
    const opt = (sel) => html`${SPECIAL.map(([k, l]) => html`<option value="${k}" ${sel === k ? T.raw('selected') : ''}>${l}</option>`)}<optgroup label="申込フォームの項目">${fs.map((f) => html`<option value="${f.id}" ${sel === f.id ? T.raw('selected') : ''}>${f.label}</option>`)}</optgroup>`;
    const emailCol = () => map.indexOf('email');
    const dupCount = () => { const i = emailCol(); return i < 0 ? 0 : data.filter((r) => emails.has(String(r[i] || '').trim().toLowerCase())).length; };
    let skipDup = true;
    const v = await T.modal({
      title: 'CSV の読みこみ', wide: true,
      body: String(html`<p class="lead"><b>${file.name}</b>：${data.length}行。左の見出しを、どの項目に入れるか確かめてください（見出しの名前から自動で合わせています）。</p>
        <div class="tbl-wrap"><table class="tbl imp-table"><thead><tr><th>CSV の見出し</th><th>入れる項目</th><th>1行目の値</th></tr></thead><tbody>
        ${head.map((h, i) => html`<tr><td><b>${h || '（空）'}</b></td><td><select data-col="${i}">${opt(map[i])}</select></td><td class="small muted">${(data[0] || [])[i] || ''}</td></tr>`)}
        </tbody></table></div>
        <p class="small" data-dup style="margin-top:10px"></p>
        <label class="check"><input type="checkbox" data-skipdup checked> <span>同じメールアドレスの人が、もういるときは取りこまない</span></label>
        <p class="help">受付番号の列がないとき（または同じ番号があるとき）は、新しい番号をつけます。チェックの項目（いくつでも）は「、」で区切って入れてください。</p>`),
      actions: [{ label: 'やめる', value: 'cancel' }, { label: '取りこむ', kind: 'primary', value: 'go' }],
      onOpen(w) {
        const upd = () => { const d = dupCount(); w.querySelector('[data-dup]').textContent = d ? `すでにいるメールアドレス：${d}件` : ''; };
        w.querySelectorAll('[data-col]').forEach((s) => s.addEventListener('change', () => { map[+s.dataset.col] = s.value; upd(); }));
        w.querySelector('[data-skipdup]').addEventListener('change', (e) => { skipDup = e.target.checked; });
        upd();
      },
    });
    if (v !== 'go') return;
    const codes = new Set(ev.people.map((p) => p.code));
    let added = 0, skipped = 0;
    for (const r of data) {
      const a = {};
      let code = '', created = '', paid = false, memo = '';
      head.forEach((h, i) => {
        const k = map[i], val = String(r[i] == null ? '' : r[i]).trim();
        if (k === '__skip' || val === '') return;
        if (k === '__code') code = val.toUpperCase();
        else if (k === '__created') created = val;
        else if (k === '__paid') paid = /^(済|入金済|入金済み|はい|true|1|yes|○)$/i.test(val);
        else if (k === '__memo') memo = val;
        else {
          const f = fs.find((x) => x.id === k);
          if (!f) return;
          if (f.type === 'checks') a[k] = val.split(/[、,，;；\n]/).map((x) => x.trim()).filter(Boolean);
          else if (f.type === 'consent') a[k] = !/^(いいえ|false|0|no|×)$/i.test(val);
          else if (f.type === 'number') a[k] = Number(val) || 0;
          else a[k] = val;
        }
      });
      if (!a.name && !a.email) { skipped++; continue; }
      if (skipDup && a.email && emails.has(a.email.toLowerCase())) { skipped++; continue; }
      if (!code || codes.has(code)) code = T.newCode(ev);
      codes.add(code);
      if (a.email) emails.add(a.email.toLowerCase());
      const d = created ? new Date(created.replace(/\//g, '-').replace(' ', 'T')) : null;
      ev.people.push({ id: T.uid('p'), code, token: T.newToken(), createdAt: d && !isNaN(d) ? d.toISOString() : T.now(), a, paid, paidAt: paid ? T.now() : '', checkin: {}, status: 'ok', memo: memo || `CSV から取りこみ（${file.name}）`, via: 'csv' });
      added++;
    }
    T.logIt(`CSV から ${added}人を取りこみました（${file.name}）`, T.who());
    T.save();
    T.refresh();
    T.toast(`${added}人を取りこみました${skipped ? `（${skipped}行は取りこまず）` : ''}`);
  }

  /* ───────── 印刷：名札（A4 10面・91×55mm） ───────── */
  const buOptions = (ev, cur, extra = '') => html`<select data-pfilter="bu" aria-label="部会">${[['', '全部の部会'], ...optsOf(ev, 'bu').map((v) => [v, v])].map(([v, l]) => html`<option value="${v}" ${cur === v ? T.raw('selected') : ''}>${l}</option>`)}</select>${T.raw(extra)}`;
  const bindPrintFilter = (id, r) => {
    document.querySelectorAll('.print-bar [data-pfilter]').forEach((el) => el.addEventListener('change', () => {
      const q = Object.assign({}, r.q, { [el.dataset.pfilter]: el.value });
      if (!q.back) q.back = 'admin/people';
      const qs = Object.entries(q).filter(([, v]) => v !== '' && v != null).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
      T.go(`print/${id}?${qs}`);
    }));
  };
  const chunk = (arr, n) => { const out = []; for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n)); return out; };
  const kanaSort = (a, b) => String(T.pv(a, 'kana') || T.pv(a, 'name') || '').localeCompare(String(T.pv(b, 'kana') || T.pv(b, 'name') || ''), 'ja');

  T.page('print', 'badges', {
    admin: true, title: '名札（A4 10面）', cls: 'badges-root',
    hint: 'A4 10面（91×55mm）の名刺ラベル用紙に合わせています。印刷の設定で「倍率 100%」「余白なし」にしてください。',
    tools(r) {
      const ev = T.ev();
      return html`${buOptions(ev, r.q.bu || '')}<select data-pfilter="blank" aria-label="空欄の名札"><option value="">空欄の名札：なし</option>${[2, 4, 10, 20].map((n) => html`<option value="${n}" ${String(r.q.blank) === String(n) ? T.raw('selected') : ''}>空欄を ${n}枚 足す</option>`)}</select>`;
    },
    render(r) {
      const ev = T.ev();
      const ids = (r.q.ids || '').split(',').filter(Boolean);
      let list = T.active(ev);
      if (ids.length) list = list.filter((p) => ids.includes(p.id));
      if (r.q.bu) list = list.filter((p) => T.pv(p, 'bu') === r.q.bu);
      list = list.slice().sort((a, b) => (optsOf(ev, 'bu').indexOf(T.pv(a, 'bu')) - optsOf(ev, 'bu').indexOf(T.pv(b, 'bu'))) || kanaSort(a, b));
      const blanks = Array.from({ length: Number(r.q.blank) || 0 }, () => null);
      const all = list.concat(blanks);
      if (!all.length) return html`<section class="sheet"><p>名札にする人がいません。</p></section>`;
      const title = (ev.info.no ? `第${ev.info.no}回 ` : '') + (ev.info.short || ev.info.name);
      const badge = (p) => html`<div class="badge ${p ? '' : 'blank'}">
        <div class="badge-band"><span>${title}</span><b>${p ? (T.pv(p, 'bu') || '') : ''}</b></div>
        <div class="badge-body">
          <div class="badge-who">
            ${p ? html`<div class="badge-kana">${T.pv(p, 'kana') || ''}</div><div class="badge-name">${T.pname(p)}</div><div class="badge-org">${T.pv(p, 'org') || ''}</div>` : html`<div class="badge-kana">&nbsp;</div><div class="badge-name blank-line"></div><div class="badge-org blank-line"></div>`}
          </div>
          ${p ? html`<div class="badge-qr">${T.raw(T.qrSvg(T.qrText(p), { margin: 1 }))}<span class="mono">${p.code}</span></div>` : ''}
        </div>
        ${p && T.pv(p, 'kind') && T.pv(p, 'kind') !== '会員' ? html`<div class="badge-kind">${T.pv(p, 'kind')}</div>` : ''}
      </div>`;
      return html`${chunk(all, 10).map((pg) => html`<section class="sheet badge-sheet">${pg.map(badge)}</section>`)}`;
    },
    mount(root, r) { bindPrintFilter('badges', r); },
  });

  /* ───────── 印刷：受付名簿（50音順・部会ごと） ───────── */
  T.page('print', 'roster', {
    admin: true, title: '受付名簿', cls: 'roster-root',
    hint: '受付の機械が止まったときの予備。ふりがなの50音順・部会ごと。',
    tools(r) { return buOptions(T.ev(), r.q.bu || ''); },
    render(r) {
      const ev = T.ev();
      const days = T.checkinDays(ev);
      const bus = optsOf(ev, 'bu');
      const act = T.active(ev);
      const groups = (r.q.bu ? [r.q.bu] : bus.concat(['']))
        .map((bu) => ({ bu: bu || 'そのほか', list: act.filter((p) => (bu ? T.pv(p, 'bu') === bu : !bus.includes(T.pv(p, 'bu')))).sort(kanaSort) }))
        .filter((g) => g.list.length);
      if (!groups.length) return html`<section class="sheet"><p>名簿にする人がいません。</p></section>`;
      const PER = 34;
      const sheets = [];
      for (const g of groups) chunk(g.list, PER).forEach((rows, i, arr) => sheets.push({ g, rows, i, n: arr.length, start: i * PER }));
      return html`${sheets.map((s, si) => html`<section class="sheet roster-sheet">
        <header class="roster-head"><div><b>${T.eventTitle(ev)}</b>　受付名簿</div><div class="muted">${T.period(ev)}　出力：${T.dateJa(T.today())}</div></header>
        <h2 class="roster-title">${s.g.bu}${s.n > 1 ? html` <small>（${s.i + 1}/${s.n}）</small>` : ''} <small>${s.g.list.length}人</small></h2>
        <table class="roster">
          <thead><tr><th class="r-no">No</th><th class="r-code">受付番号</th><th>氏名（ふりがな）</th><th>所属</th><th class="r-fee">参加費</th><th class="r-paid">入金</th>${days.map((d) => html`<th class="r-day">${T.md(d.date).replace(/（.）/, '')}</th>`)}<th class="r-memo">メモ</th></tr></thead>
          <tbody>${s.rows.map((p, k) => {
            const fee = T.fee(p, ev);
            return html`<tr><td class="r-no">${s.start + k + 1}</td><td class="r-code mono">${p.code}</td><td class="r-name"><b>${T.pname(p)}</b><small>${T.pv(p, 'kana') || ''}</small></td><td class="r-org">${T.pv(p, 'org') || ''}</td><td class="r-fee">${fee ? T.yen(fee) : '—'}</td><td class="r-paid">${fee ? (p.paid ? '済' : html`<b>未</b>`) : '—'}</td>${days.map((d) => html`<td class="r-day">${p.checkin && p.checkin[d.id] ? '✓' : '□'}</td>`)}<td class="r-memo"></td></tr>`;
          })}</tbody>
        </table>
        <footer class="roster-foot">${si + 1} / ${sheets.length}</footer>
      </section>`)}`;
    },
    mount(root, r) { bindPrintFilter('roster', r); },
  });
})();
