/* 公開サイトと管理画面の両方で使う部品
   ・申込フォーム   T.formHtml(fields, 値) / T.readForm(form, fields) … 公開の申込・管理の手入力・フォーム編集の見本で同じものを使う
   ・アンケート     T.surveyHtml(sv, 値) / T.readSurvey(form, sv)
   ・メール         T.mail.send({...}) … 送信の記録を残す（GAS の URL があれば本当に送る）。T.mail.forPerson(pid) … その人に届いたもの
   ・問い合わせ     T.thread.create({...}) / T.thread.reply(th, 文, だれ) */
(function () {
  'use strict';
  const { html } = T;

  // プログラムの項目の種類（色分けに使う）
  T.KINDS = { info: '受付・案内', lecture: '講習', plenary: '全体会', keynote: '講演', section: '分科会', break: '休憩・移動', party: '交流', meeting: '会議' };
  // 資料・配信を見られる人
  T.VIS = { public: 'だれでも', member: '参加者だけ（マイページ）', staff: '運営だけ' };

  T.FIELD_TYPES = [
    ['text', '1行の文字'], ['textarea', '複数行の文字'], ['email', 'メールアドレス'], ['tel', '電話番号'], ['number', '数'], ['date', '日付'],
    ['select', 'プルダウン（1つ選ぶ）'], ['radio', 'ボタン（1つ選ぶ）'], ['checks', 'チェック（いくつでも）'], ['consent', '同意のチェック'], ['heading', '見出し（入力なし）'],
  ];
  const feeTag = (o) => (o.fee ? html` <span class="fee-tag">＋${T.yen(o.fee)}</span>` : '');

  /* ───────── 申込フォーム ───────── */
  T.formHtml = (fields, v = {}, o = {}) => html`<div class="aform">${fields.map((f) => {
    if (f.hidden && !o.admin) return '';
    if (f.type === 'heading') return html`<h3 class="aform-h">${f.label}</h3>`;
    const id = 'af_' + f.id;
    const val = v[f.id];
    const req = f.required ? T.raw(' required') : '';
    let input;
    const opts = f.options || [];
    switch (f.type) {
      case 'textarea': input = html`<textarea id="${id}" name="${f.id}" rows="3" placeholder="${f.placeholder || ''}"${req}>${val || ''}</textarea>`; break;
      case 'select': input = html`<select id="${id}" name="${f.id}"${req}><option value="">選んでください</option>${opts.map((op) => html`<option value="${op.v}" ${op.v === val ? T.raw('selected') : ''}>${op.v}${op.fee ? `（＋${T.yen(op.fee)}）` : ''}</option>`)}</select>`; break;
      case 'radio': input = html`<div class="opts" role="radiogroup" aria-labelledby="${id}_l">${opts.map((op, i) => html`<label class="opt"><input type="radio" name="${f.id}" value="${op.v}" ${op.v === val ? T.raw('checked') : ''}${i === 0 ? req : ''}><span>${op.v}${feeTag(op)}</span></label>`)}</div>`; break;
      case 'checks': input = html`<div class="opts" role="group" aria-labelledby="${id}_l" data-checks="${f.id}" ${f.required ? T.raw('data-required') : ''}>${opts.map((op) => html`<label class="opt"><input type="checkbox" name="${f.id}" value="${op.v}" ${(val || []).includes(op.v) ? T.raw('checked') : ''}><span>${op.v}${feeTag(op)}</span></label>`)}</div>`; break;
      case 'consent': input = html`<div class="consent"><p>${T.text(f.text || '')}</p><label class="check"><input type="checkbox" name="${f.id}" value="1" ${val ? T.raw('checked') : ''}${req}> <span>同意します</span></label></div>`; break;
      default: input = html`<input id="${id}" name="${f.id}" type="${f.type || 'text'}" value="${val == null ? '' : val}" placeholder="${f.placeholder || ''}" autocomplete="${{ name: 'name', email: 'email', tel: 'tel', org: 'organization' }[f.id] || 'off'}"${req}>`;
    }
    return html`<div class="field ${['textarea', 'radio', 'checks', 'consent'].includes(f.type) ? 'full' : ''}" data-field="${f.id}">
      <label class="flabel" id="${id}_l" for="${['radio', 'checks', 'consent'].includes(f.type) ? '' : id}">${f.label}${f.required ? html`<span class="req">必須</span>` : ''}</label>
      ${input}${f.help ? html`<p class="help">${f.help}</p>` : ''}
    </div>`;
  })}</div>`;

  // フォームから答えを読む。足りないものがあれば missing に（ラベル）
  T.readForm = (form, fields) => {
    const a = {}, missing = [];
    for (const f of fields) {
      if (f.type === 'heading') continue;
      if (f.type === 'checks') a[f.id] = [...form.querySelectorAll(`[name="${f.id}"]:checked`)].map((x) => x.value);
      else if (f.type === 'radio') { const x = form.querySelector(`[name="${f.id}"]:checked`); a[f.id] = x ? x.value : ''; }
      else if (f.type === 'consent') { const x = form.querySelector(`[name="${f.id}"]`); a[f.id] = !!(x && x.checked); }
      else { const x = form.querySelector(`[name="${f.id}"]`); a[f.id] = x ? (f.type === 'number' && x.value !== '' ? Number(x.value) : x.value.trim()) : ''; }
      const empty = Array.isArray(a[f.id]) ? !a[f.id].length : a[f.id] === '' || a[f.id] === false || a[f.id] == null;
      if (f.required && empty) missing.push(f.label);
    }
    if (a.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(a.email)) missing.push('メールアドレス（形がちがいます）');
    return { a, missing };
  };
  // 入力のたびに参加費を出しなおす
  T.bindFee = (form, fields, out) => {
    const upd = () => {
      const { a } = T.readForm(form, fields);
      const lines = T.feeLines(a, { form: { fields } });
      const total = T.sum(lines, (l) => l.fee);
      out.innerHTML = String(lines.length ? html`<ul class="fee-lines">${lines.map((l) => html`<li><span>${l.label}</span><b>${T.yen(l.fee)}</b></li>`)}</ul><div class="fee-total"><span>合計</span><b>${T.yen(total)}</b></div>` : html`<div class="fee-total"><span>合計</span><b>${T.yen(0)}</b></div><p class="help">参加区分などを選ぶと、金額が出ます。</p>`);
    };
    form.addEventListener('change', upd);
    upd();
  };

  /* ───────── アンケート ───────── */
  T.Q_TYPES = [['scale', '5段階'], ['radio', '1つ選ぶ'], ['checks', 'いくつでも選ぶ'], ['text', '自由に書く']];
  T.surveyHtml = (sv, v = {}) => html`<div class="survey-form">${sv.questions.map((q, i) => {
    const name = 'sq_' + q.id;
    const val = v[q.id];
    let input;
    if (q.type === 'scale') input = html`<div class="scale" role="radiogroup" aria-label="${q.label}"><span class="scale-end">${q.min || 'そう思わない'}</span>${[1, 2, 3, 4, 5].map((n) => html`<label class="scale-pt"><input type="radio" name="${name}" value="${n}" ${Number(val) === n ? T.raw('checked') : ''}><span>${n}</span></label>`)}<span class="scale-end">${q.max || 'そう思う'}</span></div>`;
    else if (q.type === 'radio') input = html`<div class="opts">${(q.options || []).map((o) => html`<label class="opt"><input type="radio" name="${name}" value="${o}" ${o === val ? T.raw('checked') : ''}><span>${o}</span></label>`)}</div>`;
    else if (q.type === 'checks') input = html`<div class="opts">${(q.options || []).map((o) => html`<label class="opt"><input type="checkbox" name="${name}" value="${o}" ${(val || []).includes(o) ? T.raw('checked') : ''}><span>${o}</span></label>`)}</div>`;
    else input = html`<textarea name="${name}" rows="3">${val || ''}</textarea>`;
    return html`<fieldset class="sq"><legend><span class="sq-no">Q${i + 1}</span>${q.label}${q.required ? html`<span class="req">必須</span>` : ''}</legend>${input}</fieldset>`;
  })}</div>`;
  T.readSurvey = (form, sv) => {
    const a = {}, missing = [];
    for (const q of sv.questions) {
      const name = 'sq_' + q.id;
      if (q.type === 'checks') a[q.id] = [...form.querySelectorAll(`[name="${name}"]:checked`)].map((x) => x.value);
      else if (q.type === 'text') a[q.id] = (form.querySelector(`[name="${name}"]`) || {}).value || '';
      else { const x = form.querySelector(`[name="${name}"]:checked`); a[q.id] = x ? (q.type === 'scale' ? Number(x.value) : x.value) : ''; }
      const empty = Array.isArray(a[q.id]) ? !a[q.id].length : a[q.id] === '' || a[q.id] == null;
      if (q.required && empty) missing.push('Q' + (sv.questions.indexOf(q) + 1));
    }
    return { a, missing };
  };
  // 答えてよい人か（target：all＝申込者みんな／checked＝当日受付をした人）
  T.surveyFor = (sv, p) => sv.open && (sv.target !== 'checked' || (p && Object.keys(p.checkin || {}).length > 0));
  T.answered = (sv, pid) => sv.responses.some((x) => x.pid === pid);

  /* ───────── メール ───────── */
  T.mail = {
    METHODS: { sample: 'サンプル（記録だけ）', gas: 'Gmail で送信（Apps Script）', bcc: 'メールソフト（BCC）', csv: 'CSV で書き出し', auto: '自動（申込のとき）' },
    // 1人ぶんに差しこむ
    render(m, p, ev = T.ev()) { const vars = T.vars(p, ev); return { subject: T.merge(m.subject, vars), body: T.merge(m.body, vars) }; },
    // その人に届いたもの（新しい順）
    forPerson(pid, ev = T.ev()) { const p = T.find(ev.people, pid); return ev.mails.filter((m) => (m.to || []).includes(pid)).sort(T.by('at', -1)).map((m) => Object.assign({ id: m.id, at: m.at }, T.mail.render(m, p, ev))); },
    // 送る。to は参加者 id の配列。GAS の URL があり、method が gas/auto なら本当に送る
    async send(o, ev = T.ev()) {
      const rec = { id: T.uid('m'), at: T.now(), subject: o.subject, body: o.body, to: o.to.slice(), method: o.method || 'sample', templateId: o.templateId || '', by: o.by || T.who(), note: o.note || '' };
      const url = ev.info.mailGasUrl;
      if (url && (rec.method === 'gas' || rec.method === 'auto')) {
        try {
          const people = o.to.map((id) => T.find(ev.people, id)).filter(Boolean);
          for (let i = 0; i < people.length; i += 50) {
            const mails = people.slice(i, i + 50).map((p) => Object.assign({ to: p.a.email }, T.mail.render(rec, p, ev)));
            const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ key: ev.info.mailGasKey || '', from: ev.info.mailFrom || '', replyTo: (ev.info.office || {}).email || '', mails }) });
            const j = await res.json().catch(() => ({}));
            if (!j.ok) throw new Error(j.error || '送信先から ok が返ってきませんでした');
          }
          rec.sent = true;
        } catch (e) {
          rec.sent = false; rec.error = String(e.message || e);
        }
      }
      ev.mails.push(rec);
      return rec;
    },
  };

  /* ───────── 問い合わせ ───────── */
  T.THREAD_CATS = ['申込・参加費', '申込内容の変更', '当日', '発表', '配信', 'その他'];
  T.thread = {
    create(o, ev = T.ev()) {
      const th = { id: T.uid('th'), pid: o.pid || null, name: o.name || '', email: o.email || '', subject: o.subject || '（件名なし）', cat: o.cat || 'その他', status: 'open', who: '', at: T.now(), msgs: [{ from: 'p', text: o.text || '', at: T.now() }] };
      ev.threads.unshift(th);
      return th;
    },
    reply(th, text, who, ev = T.ev()) {
      th.msgs.push({ from: 's', name: who || T.who(), text, at: T.now() });
      if (th.status === 'open') th.status = 'doing';
      th.at = T.now();
      // 申込者なら、マイページの「運営からのメール」にも出す
      if (th.pid) T.mail.send({ subject: `【{{大会名}}】お問い合わせへの回答：${th.subject}`, body: `{{氏名}} 様\n\nお問い合わせ「${th.subject}」に回答しました。\n\n${text}\n\nマイページの「問い合わせ」からも見られます。\n{{マイページ}}\n\n{{事務局}}`, to: [th.pid], method: 'auto', by: who }, ev);
    },
  };
})();
