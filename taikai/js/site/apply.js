/* 参加申込：フォーム → 確認の窓 → 受付（受付番号・本人用QR・確認メール）→ #/done */
(function () {
  'use strict';
  const { html, icon } = T;

  T.page('site', 'apply', {
    title: '参加申込', en: 'REGISTRATION', order: 80,
    lead: () => T.ev().form.lead || '',
    render() {
      const ev = T.ev(), i = ev.info;
      const st = T.applyState(ev);
      if (!st.open) return html`<div class="wrap narrow s-body"><div class="card done-card"><span class="done-ic warn">${icon('clock')}</span><h2>${st.label}</h2><p>${st.note}</p><a class="btn" href="#/">ホームへ</a></div></div>`;
      const me = T.me(ev);
      return html`<div class="wrap s-body apply-wrap">
        <form class="card s-form" data-form="apply" novalidate>
          ${me ? html`<div class="note warn"><p>このブラウザでは、すでに <b>${T.pname(me)}</b> さん（${me.code}）がマイページに入っています。別の人の申込を続けてもかまいません（申込のあと、マイページはその人に切りかわります）。</p></div>` : ''}
          ${T.formHtml(ev.form.fields)}
          <div class="apply-foot">
            <p class="small muted">「確認する」を押すと、入力した内容と参加費の合計が出ます。</p>
            <button class="btn gold lg">確認する ${icon('arrow')}</button>
          </div>
        </form>
        <aside class="apply-side">
          <div class="card">
            <h3 class="side-h">${icon('yen')} 参加費</h3>
            <div id="fee-box"></div>
            <p class="help">お支払いは、申込のあとにマイページでご案内します。</p>
          </div>
          <div class="card">
            <h3 class="side-h">${icon('qr')} 申込のあと</h3>
            <ol class="mini-steps"><li>受付番号と、本人用のQRコードが出ます</li><li>確認のメールが届きます</li><li>マイページで、申込内容・参加費・お知らせを確かめられます</li><li>当日はQRコードで受付</li></ol>
          </div>
          <p class="small muted">申込の締切：${i.applyClose ? T.dateJa(i.applyClose) : '—'}</p>
        </aside>
      </div>`;
    },
    mount(root) {
      const form = root.querySelector('form[data-form="apply"]');
      const box = root.querySelector('#fee-box');
      if (form && box) T.bindFee(form, T.ev().form.fields, box);
      if (form) form.addEventListener('change', (e) => { const f = e.target.closest('.field'); if (f) f.classList.remove('err'); });
    },
    forms: {
      async apply(_v, form) {
        const ev = T.ev();
        const fields = ev.form.fields;
        const { a, missing } = T.readForm(form, fields);
        form.querySelectorAll('.field.err').forEach((x) => x.classList.remove('err'));
        if (missing.length) {
          for (const f of fields) {
            const v = a[f.id];
            const empty = Array.isArray(v) ? !v.length : v === '' || v === false || v == null;
            if ((f.required && empty) || (f.id === 'email' && v && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v))) { const el = form.querySelector(`[data-field="${f.id}"]`); if (el) el.classList.add('err'); }
          }
          const first = form.querySelector('.field.err');
          if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
          T.toast('入力が足りません：' + missing.slice(0, 3).join('、') + (missing.length > 3 ? ' ほか' : ''), 'bad');
          return;
        }
        // 確認の窓
        const lines = T.feeLines(a, ev);
        const total = T.sum(lines, (l) => l.fee);
        const ok = await T.modal({
          title: '申込内容の確認', wide: true,
          body: String(html`<table class="kv">${fields.filter((f) => f.type !== 'heading' && f.type !== 'consent').map((f) => html`<tr><th>${f.label}</th><td>${T.answerText(f, a[f.id]) || html`<span class="muted">—</span>`}</td></tr>`)}
            <tr><th>参加費</th><td><b class="num" style="font-size:1.2em">${T.yen(total)}</b>${lines.length ? html`<br><small class="muted">${lines.map((l) => `${l.label} ${T.yen(l.fee)}`).join('／')}</small>` : ''}</td></tr></table>
            <p class="small muted" style="margin-top:12px">この内容で申し込みます。あとから変えたいときは、マイページの「問い合わせ」からお知らせください。</p>`),
          actions: [{ label: '直す', value: 'cancel' }, { label: 'この内容で申し込む', kind: 'primary', value: 'ok' }],
        });
        if (ok !== 'ok') return;
        // 同じメールの申込がある
        const dup = T.active(ev).find((p) => (p.a.email || '').toLowerCase() === a.email.toLowerCase() && p.a.name === a.name);
        if (dup && !(await T.confirm(`同じお名前・メールアドレスの申込が、すでにあります（受付番号 ${dup.code}）。もう一度申し込みますか？\n（申込内容を変えたいときは、マイページの問い合わせからお知らせください）`, { ok: '申し込む' }))) return;
        const p = { id: T.uid('p'), code: T.newCode(ev), token: T.newToken(), createdAt: T.now(), a, paid: false, paidAt: '', checkin: {}, status: 'ok', memo: '' };
        ev.people.push(p);
        T.logIt(`参加申込：${a.name}（${p.code}）`, a.name);
        // 確認のメール（テンプレートが決まっていれば）
        const tpl = T.find(ev.templates, ev.form.confirmTemplate);
        if (tpl) await T.mail.send({ subject: tpl.subject, body: tpl.body, to: [p.id], method: 'auto', templateId: tpl.id, by: '自動' }, ev);
        T.save(true);
        T.meLogin(p, ev);
        T.go('done');
      },
    },
  });

  /* ── 申込が終わったところ ── */
  T.page('site', 'done', {
    title: '申込が終わりました', en: 'THANK YOU', order: 81,
    render() {
      const ev = T.ev();
      const p = T.me(ev);
      if (!p) return html`<div class="wrap narrow s-body"><p>申込の情報が見つかりません。<a href="#/mypage">マイページ</a>から入ってください。</p></div>`;
      const fee = T.fee(p, ev);
      return html`<div class="wrap narrow s-body">
        <div class="card done-card">
          <span class="done-ic">${icon('check')}</span>
          <h2>お申し込みありがとうございました</h2>
          <p>${ev.form.doneMessage || ''}</p>
          <div class="ticket">
            <div class="ticket-qr">${T.raw(T.qrSvg(T.qrText(p), { label: '本人用のQRコード' }))}</div>
            <div class="ticket-info"><span class="k">受付番号</span><b class="code mono">${p.code}</b><span class="k">お名前</span><b>${T.pname(p)}</b><span class="k">部会</span><b>${p.a.bu || ''}</b></div>
          </div>
          <div class="row" style="justify-content:center;margin-top:14px">
            <a class="btn primary lg" href="#/mypage">${icon('user')} マイページへ</a>
            <a class="btn lg" href="#/print/ticket?back=done">${icon('print')} 受付票を印刷</a>
          </div>
          <p class="small muted" style="margin-top:12px">スマホの方は、この画面をスクリーンショットで保存しておくと、当日すぐに出せます。</p>
        </div>
        ${fee ? html`<div class="card" style="margin-top:16px"><h3 class="side-h">${icon('yen')} 参加費 ${T.yen(fee)} のお支払い</h3><p>${T.text(ev.info.bank || 'お支払いの方法は、追ってお知らせします。')}</p></div>` : ''}
      </div>`;
    },
  });
})();
