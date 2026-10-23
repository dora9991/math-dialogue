/* マイページ（受付番号とメールで入る）・アンケートに答える・受付票と領収書の印刷 */
(function () {
  'use strict';
  const { html, icon } = T;

  const TABS = [['qr', '受付QR', 'qr'], ['info', '申込内容', 'form'], ['fee', '参加費', 'yen'], ['mail', '運営からのメール', 'mail'], ['contact', '問い合わせ', 'chat'], ['survey', 'アンケート', 'chart'], ['member', '参加者限定', 'lock']];

  T.page('site', 'mypage', {
    title: 'マイページ', en: 'MY PAGE', order: 85,
    render(r) {
      const ev = T.ev();
      // メールのリンク（?c=受付番号&t=合言葉）から入る
      if (r.q.c && r.q.t) {
        const p = ev.people.find((x) => x.code === String(r.q.c).toUpperCase() && x.token === String(r.q.t).toUpperCase() && x.status !== 'cancel');
        if (p) { T.meLogin(p, ev); setTimeout(() => T.go('mypage'), 0); return html`<div class="wrap s-body"><p>マイページを開いています…</p></div>`; }
      }
      const p = T.me(ev);
      if (!p) return loginView(ev);
      const tab = TABS.some((t) => t[0] === r.q.tab) ? r.q.tab : 'qr';
      const mails = T.mail.forPerson(p.id, ev);
      const threads = ev.threads.filter((t) => t.pid === p.id);
      const surveys = ev.surveys.filter((sv) => T.surveyFor(sv, p));
      const todo = surveys.filter((sv) => !T.answered(sv, p.id)).length;
      const fee = T.fee(p, ev);
      const days = ev.program.days.filter((d) => p.checkin && p.checkin[d.id]);
      const counts = { mail: mails.length, contact: threads.filter((t) => t.msgs[t.msgs.length - 1].from === 's').length ? '!' : '', survey: todo || '' };
      return html`<div class="wrap s-body">
        <div class="me-head card">
          <div class="me-avatar">${T.pname(p).slice(0, 1)}</div>
          <div class="me-who"><b>${T.pname(p)} <small>さん</small></b><span class="muted small">${p.a.org || ''}　${p.a.bu || ''}</span>
            <span class="row tight" style="margin-top:4px"><span class="chip mono">${p.code}</span>${fee ? html`<span class="chip ${p.paid ? 'ok' : 'warn'}">${p.paid ? '入金済み' : '未入金'}</span>` : ''}${days.length ? html`<span class="chip ok">受付ずみ（${days.map((d) => T.md(d.date)).join('・')}）</span>` : ''}</span></div>
          <button class="btn sm ghost" data-act="meOut">${icon('logout')} 出る</button>
        </div>
        <div class="me-tabs" role="tablist">${TABS.map(([k, label, ic]) => html`<button role="tab" aria-selected="${k === tab}" data-act="go" data-to="mypage?tab=${k}">${icon(ic)}<span>${label}</span>${counts[k] ? html`<b class="me-badge">${counts[k]}</b>` : ''}</button>`)}</div>
        <div class="me-body">${VIEWS[tab](ev, p, { mails, threads, surveys, fee })}</div>
      </div>`;
    },
    acts: {
      meOut() { T.meLogout(); T.toast('マイページから出ました'); T.go('mypage'); },
      openMail(el) { el.closest('.mail-item').classList.toggle('open'); },
    },
    forms: {
      login(v, form) {
        const ev = T.ev();
        const code = String(v.code || '').trim().toUpperCase().replace(/^([A-Z]+)(\d)/, '$1-$2');
        const p = ev.people.find((x) => x.code === code && (x.a.email || '').toLowerCase() === String(v.email || '').trim().toLowerCase());
        if (!p) { T.toast('受付番号とメールアドレスの組み合わせが見つかりません', 'bad'); form.querySelector('input').focus(); return; }
        if (p.status === 'cancel') { T.toast('この申込は取り消されています。事務局にお問い合わせください。', 'bad'); return; }
        T.meLogin(p, ev);
        T.toast(T.pname(p) + ' さん、ようこそ');
        T.render();
      },
      newThread(v, form) {
        if (!form.reportValidity()) return;
        const ev = T.ev(), p = T.me(ev);
        T.thread.create({ pid: p.id, name: T.pname(p), email: p.a.email, subject: v.subject, cat: v.cat, text: v.text }, ev);
        T.logIt(`問い合わせ：${v.subject}`, T.pname(p));
        T.save(true);
        T.toast('送りました。回答はこのページに出ます。');
        T.refresh();
      },
      addMsg(v, form) {
        const text = String(v.text || '').trim();
        if (!text) return;
        const ev = T.ev(), p = T.me(ev);
        const th = T.find(ev.threads, form.dataset.id);
        if (!th || th.pid !== p.id) return;
        th.msgs.push({ from: 'p', text, at: T.now() });
        th.status = 'open'; th.at = T.now();
        T.save(true);
        T.refresh();
      },
    },
  });

  function loginView(ev) {
    return html`<div class="wrap narrow s-body">
      <div class="me-login">
        <form class="card s-form" data-form="login">
          <h2 class="side-h">${icon('lock')} マイページに入る</h2>
          ${T.fieldsHtml([
            { k: 'code', label: '受付番号', placeholder: `${ev.info.codePrefix || 'A'}-0001`, required: true, full: true },
            { k: 'email', label: '申込のメールアドレス', type: 'email', required: true, full: true },
          ])}
          <button class="btn primary lg" style="width:100%;margin-top:14px">入る</button>
          <p class="help">受付番号は、申込のときの画面と、確認のメールに書いてあります。わからないときは <a href="#/contact">問い合わせ</a> から。</p>
          ${ev.info.sample ? html`<div class="note warn" style="margin-top:12px"><p>サンプル：受付番号 <b class="mono">SG-0001</b>、メール <b class="mono">hanako@example.com</b> で入れます。</p></div>` : ''}
        </form>
        <div class="me-login-side">
          <h3>マイページでできること</h3>
          <ul class="check-list">
            <li>当日の受付に使う <b>本人用のQRコード</b></li>
            <li>申込内容・参加費の確認、領収書</li>
            <li>運営からのメールを、もう一度読む</li>
            <li>運営への問い合わせと、その回答</li>
            <li>アンケート、参加者限定の資料・配信</li>
          </ul>
          <p class="small muted">まだ申し込んでいない方は <a href="#/apply">参加申込</a> へ。</p>
        </div>
      </div>
    </div>`;
  }

  const VIEWS = {
    qr(ev, p) {
      const days = ev.program.days;
      return html`<div class="me-qr">
        <div class="qr-card">
          <p class="qr-title">${T.eventTitle(ev)}</p>
          <div class="qr-big">${T.raw(T.qrSvg(T.qrText(p), { label: '本人用のQRコード' }))}</div>
          <b class="code mono">${p.code}</b>
          <span class="qr-name">${T.pname(p)}</span>
        </div>
        <div class="stack">
          <div class="note"><p><b>当日は、このQRコードを受付でお見せください。</b><br>画面を明るくすると読みとりやすくなります。スクリーンショットや、印刷した受付票でもかまいません。</p></div>
          <a class="btn lg" href="#/print/ticket?back=mypage">${icon('print')} 受付票を印刷</a>
          ${days.length ? html`<div><h3 class="side-h">受付の記録</h3><ul class="plain">${days.map((d) => html`<li><span class="mono">${T.md(d.date)}</span> ${d.label}：${p.checkin && p.checkin[d.id] ? html`<span class="chip ok">${T.time(p.checkin[d.id])} 受付ずみ</span>` : html`<span class="muted">—</span>`}</li>`)}</ul></div>` : ''}
        </div>
      </div>`;
    },
    info(ev, p) {
      return html`<table class="kv">${ev.form.fields.filter((f) => f.type !== 'heading' && f.type !== 'consent').map((f) => html`<tr><th>${f.label}</th><td>${T.answerText(f, p.a[f.id]) || html`<span class="muted">—</span>`}</td></tr>`)}<tr><th>申込日</th><td>${T.dateJa(p.createdAt)} ${T.time(p.createdAt)}</td></tr></table>
        <p class="small muted" style="margin-top:12px">内容を変えたい・取り消したいときは、<a href="#/mypage?tab=contact">問い合わせ</a>からお知らせください。</p>`;
    },
    fee(ev, p, o) {
      const lines = T.feeLines(p.a, ev);
      return html`<div class="grid2">
        <div class="card flat"><h3 class="side-h">内訳</h3>${lines.length ? html`<ul class="fee-lines">${lines.map((l) => html`<li><span>${l.label}</span><b>${T.yen(l.fee)}</b></li>`)}</ul>` : ''}<div class="fee-total"><span>合計</span><b>${T.yen(o.fee)}</b></div>
          <p style="margin-top:10px">${o.fee === 0 ? html`<span class="chip ok">お支払いはありません</span>` : p.paid ? html`<span class="chip ok">入金済み（${T.dateJa(p.paidAt)}）</span>` : html`<span class="chip warn">未入金</span>`}</p>
          ${p.paid && o.fee ? html`<a class="btn" href="#/print/receipt?back=mypage%3Ftab%3Dfee">${icon('print')} 領収書を出す</a>` : ''}</div>
        ${o.fee && !p.paid ? html`<div class="card flat"><h3 class="side-h">振込先</h3><p>${T.text(ev.info.bank || '追ってお知らせします。')}</p></div>` : ''}
      </div>`;
    },
    mail(ev, p, o) {
      if (!o.mails.length) return html`<p class="muted">運営からのメールは、まだありません。</p>`;
      return html`<ul class="mail-list">${o.mails.map((m) => html`<li class="mail-item"><button class="mail-head" data-act="openMail"><span class="small muted num">${T.dt(m.at)}</span><b>${m.subject}</b>${icon('arrow')}</button><div class="mail-body">${T.text(m.body)}</div></li>`)}</ul>
        <p class="small muted">サンプルでは、メールは実際には送られず、ここに残るだけです。</p>`;
    },
    contact(ev, p, o) {
      return html`<div class="stack">
        ${o.threads.map((th) => html`<div class="card flat thread">
          <div class="row between"><b>${th.subject}</b><span class="chip ${th.status === 'done' ? 'ok' : th.status === 'doing' ? 'info' : 'warn'}">${{ open: '受付', doing: '対応中', done: '完了' }[th.status]}</span></div>
          <div class="msgs">${th.msgs.map((m) => html`<div class="msg ${m.from === 's' ? 'staff' : 'me'}"><small>${m.from === 's' ? (m.name || '運営') : 'あなた'}・${T.dt(m.at)}</small><p>${T.text(m.text)}</p></div>`)}</div>
          <form class="row" data-form="addMsg" data-id="${th.id}"><input name="text" placeholder="続けて送る" aria-label="続けて送る" style="flex:1"><button class="btn sm">${icon('send')} 送る</button></form>
        </div>`)}
        <form class="card s-form" data-form="newThread">
          <h3 class="side-h">${icon('chat')} 新しく問い合わせる</h3>
          ${T.fieldsHtml([{ k: 'cat', label: '分類', type: 'select', options: T.THREAD_CATS }, { k: 'subject', label: '件名', required: true }, { k: 'text', label: '内容', type: 'textarea', rows: 4, required: true }])}
          <div class="row end" style="margin-top:12px"><button class="btn primary">${icon('send')} 送る</button></div>
        </form>
      </div>`;
    },
    survey(ev, p, o) {
      if (!o.surveys.length) return html`<p class="muted">いま答えられるアンケートはありません。</p>`;
      return html`<div class="list">${o.surveys.map((sv) => html`<a class="item linkish" href="#/survey/${sv.id}"><div class="item-main"><b>${sv.title}</b><p class="small muted">${sv.lead || ''}</p></div>${T.answered(sv, p.id) ? html`<span class="chip ok">回答ずみ</span>` : html`<span class="chip warn">未回答</span>`}</a>`)}</div>`;
    },
    member(ev, p) {
      const docs = ev.docs.filter((d) => d.visibility === 'member');
      const vids = ev.videos.filter((v) => v.visibility === 'member');
      return html`${docs.length ? html`<h3 class="side-h">資料</h3><div class="doc-grid one">${docs.map((d) => T.docCard(d, p))}</div>` : ''}
        ${vids.length ? html`<h3 class="side-h" style="margin-top:20px">配信</h3><div class="video-grid">${vids.map((v) => T.videoCard(v))}</div>` : ''}
        ${!docs.length && !vids.length ? html`<p class="muted">参加者限定のものは、まだありません。</p>` : ''}`;
    },
  };
  const mp = T.pages.site.mypage;
  mp.mount = (root) => T.bindVideos(root);

  /* ── アンケートに答える ── */
  T.page('site', 'survey', {
    title: 'アンケート', en: 'SURVEY', order: 86,
    heading(r) { const sv = T.find(T.ev().surveys, r.arg); return sv ? sv.title : 'アンケート'; },
    lead(r) { const sv = T.find(T.ev().surveys, r.arg); return sv ? sv.lead || '' : ''; },
    render(r) {
      const ev = T.ev();
      const sv = T.find(ev.surveys, r.arg);
      if (!sv) return html`<div class="wrap narrow s-body"><p>アンケートが見つかりません。</p></div>`;
      if (!sv.open) return html`<div class="wrap narrow s-body"><div class="card done-card"><span class="done-ic warn">${icon('clock')}</span><h2>いまは受け付けていません</h2><p>受付の期間になったら、お知らせします。</p></div></div>`;
      const p = T.me(ev);
      if (!p && !sv.anonymous) return html`<div class="wrap narrow s-body"><div class="note"><p>このアンケートは、マイページに入ってから答えます。</p></div><p style="margin-top:12px"><a class="btn primary" href="#/mypage">マイページに入る</a></p></div>`;
      if (p && !T.surveyFor(sv, p)) return html`<div class="wrap narrow s-body"><div class="note"><p>このアンケートは、当日に受付をした方が対象です。</p></div></div>`;
      const prev = p ? sv.responses.find((x) => x.pid === p.id) : null;
      return html`<div class="wrap narrow s-body">
        ${prev ? html`<div class="note ok"><p>${T.dt(prev.at)} に回答ずみです。答えなおすと、上書きされます。</p></div>` : ''}
        ${sv.anonymous ? html`<p class="small muted">${icon('lock')} 集計のときは、名前を伏せます。</p>` : ''}
        <form class="card s-form" data-form="answer">${T.surveyHtml(sv, prev ? prev.a : {})}<div class="row end" style="margin-top:16px"><button class="btn gold lg">${icon('send')} 送る</button></div></form>
      </div>`;
    },
    forms: {
      answer(_v, form) {
        const ev = T.ev(), r = T.current;
        const sv = T.find(ev.surveys, r.arg);
        const { a, missing } = T.readSurvey(form, sv);
        if (missing.length) { T.toast('答えていない質問があります：' + missing.join('、'), 'bad'); return; }
        const p = T.me(ev);
        const prev = p ? sv.responses.find((x) => x.pid === p.id) : null;
        if (prev) { prev.a = a; prev.at = T.now(); } else sv.responses.push({ id: T.uid('r'), pid: p ? p.id : null, at: T.now(), a });
        T.save(true);
        document.querySelector('#main .s-body').innerHTML = String(html`<div class="card done-card"><span class="done-ic">${icon('check')}</span><h2>ありがとうございました</h2><p>回答を受け付けました。</p>${p ? html`<a class="btn" href="#/mypage?tab=survey">マイページへ</a>` : html`<a class="btn" href="#/">ホームへ</a>`}</div>`);
        window.scrollTo(0, 0);
      },
    },
  });

  /* ── 受付票（本人用QRを紙で） ── */
  T.page('print', 'ticket', {
    title: '受付票',
    render() {
      const ev = T.ev(), p = T.me(ev);
      if (!p) return html`<section class="sheet"><p>マイページに入ってから開いてください。</p></section>`;
      const lunch = p.a.lunch && p.a.lunch.length ? p.a.lunch.join('・') : 'なし';
      return html`<section class="sheet ticket-sheet">
        <div class="tk">
          <div class="tk-band"><span>${ev.info.org || ''}</span><b>${T.eventTitle(ev)}</b><span>${T.period(ev)}</span></div>
          <div class="tk-main">
            <div class="tk-qr">${T.raw(T.qrSvg(T.qrText(p)))}</div>
            <div class="tk-info">
              <p class="tk-k">受付票</p>
              <p class="tk-code mono">${p.code}</p>
              <p class="tk-name">${T.pname(p)}<small>${p.a.kana || ''}</small></p>
              <table><tr><th>所属</th><td>${p.a.org || ''}</td></tr><tr><th>部会</th><td>${p.a.bu || ''}</td></tr>${p.a.section ? html`<tr><th>分科会</th><td>${p.a.section}</td></tr>` : ''}<tr><th>弁当</th><td>${lunch}</td></tr><tr><th>参加費</th><td>${T.yen(T.fee(p, ev))}（${T.fee(p, ev) === 0 ? 'お支払いなし' : p.paid ? '入金済み' : '未入金'}）</td></tr></table>
            </div>
          </div>
          <p class="tk-note">当日、この受付票（またはスマホのマイページのQRコード）を受付でお見せください。</p>
        </div>
        <p class="cutline">きりとり線</p>
        <div class="tk-notes"><h3>参加の注意</h3><p>${T.text(ev.booklet.notes || '')}</p><h3>問い合わせ</h3><p>${(ev.info.office || {}).name || ''}　${(ev.info.office || {}).email || ''}　${(ev.info.office || {}).tel || ''}</p></div>
      </section>`;
    },
  });

  /* ── 領収書 ── */
  T.page('print', 'receipt', {
    title: '領収書',
    hint: '宛名を直してから印刷できます（PDFに保存も）。',
    render(r) {
      const ev = T.ev(), p = T.me(ev);
      if (!p) return html`<section class="sheet"><p>マイページに入ってから開いてください。</p></section>`;
      if (!p.paid) return html`<section class="sheet"><p>入金の確認が終わると、領収書を出せます。</p></section>`;
      const lines = T.feeLines(p.a, ev);
      const to = r.q.to || T.pname(p);
      return html`<section class="sheet receipt">
        ${ev.info.sample ? html`<p class="rc-sample">サンプル（このまま使えません）</p>` : ''}
        <h1>領　収　書</h1>
        <p class="rc-no">No. ${p.code}　　発行日 ${T.dateJa(T.today(), { dow: false })}</p>
        <p class="rc-to"><span contenteditable="true" class="only-edit">${to}</span>　様</p>
        <p class="rc-amount">${T.yen(T.fee(p, ev))}<small>（税込）</small></p>
        <p>但し　${T.eventTitle(ev)} 参加費として　上記の金額を領収いたしました。</p>
        <table class="rc-lines">${lines.map((l) => html`<tr><td>${l.label}</td><td class="right">${T.yen(l.fee)}</td></tr>`)}</table>
        <p class="small">入金日：${T.dateJa(p.paidAt, { dow: false })}</p>
        <div class="rc-from"><b>${(ev.info.office || {}).name || ''}</b><br>${(ev.info.office || {}).address || ''}<br>${(ev.info.office || {}).person || ''}<span class="rc-seal">印</span></div>
      </section>`;
    },
  });
})();
