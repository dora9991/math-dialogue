/* 一斉連絡：相手をしぼる → テンプレートと差しこみで文を作る → 1人ずつの見本を見る → 送り方を選んで送る
   ・送り方：サンプル（記録だけ。マイページの「運営からのメール」に出る）／Gmail（Apps Script。gas/mail.gs）／
            メールソフト（BCC。差しこみなし）／CSV（差しこみ済みの件名・本文。差しこみ機能のあるメールソフト用）
   ・ほかの画面から相手や文を渡すとき：T.ui.mailPreset = { ids, templateId, surveyUnanswered, subject, body } → T.go('admin/mail')
   ・ここで作る共通の部品：T.varChips()（差しこみのボタン）、T.insertAtCursor(入力欄, 文字)、T.showGasHelp()（Gmail の設定のしかた） */
(function () {
  'use strict';
  const { html, icon } = T;

  // 人ごとにちがう差しこみ（これがあると、公開のお知らせには載せられない・BCC では差しこめない）
  const PERSONAL = ['氏名', '所属', '受付番号', '参加区分', '部会', '参加費', '入金状況', 'マイページ'];
  const hasPersonal = (s) => PERSONAL.some((k) => new RegExp('\\{\\{\\s*' + k + '\\s*\\}\\}').test(s || ''));
  const leftovers = (s) => [...new Set(String(s || '').match(/\{\{[^{}]+\}\}/g) || [])];
  const METHOD_HELP = {
    sample: '本当には送らず、記録だけ残します。相手のマイページの「運営からのメール」に出ます。',
    gas: 'Google の Apps Script（gas/mail.gs）を通して、Gmail から1人ずつ差しこんで送ります。',
    bcc: 'ふだんのメールソフトで、BCC にまとめて送ります。差しこみ（{{氏名}} など）はできません。',
    csv: '1人ずつ差しこんだ件名・本文を CSV に書き出します。差しこみ機能のあるメールソフトで送るとき用。',
  };

  /* ───────── 共通の部品 ───────── */
  T.varChips = (cls = '') => html`<div class="var-chips ${cls}" role="group" aria-label="差しこみ"><span class="var-chips-label">差しこみ：</span>${T.VARS.map(([k, d]) => html`<button type="button" class="var-chip" data-var="${k}" title="${d}">{{${k}}}</button>`)}</div>`;
  T.insertAtCursor = (el, text) => {
    if (!el) return;
    const s = el.selectionStart == null ? el.value.length : el.selectionStart;
    const e = el.selectionEnd == null ? s : el.selectionEnd;
    el.value = el.value.slice(0, s) + text + el.value.slice(e);
    el.focus();
    try { el.setSelectionRange(s + text.length, s + text.length); } catch (err) { /* なにもしない */ }
    el.dispatchEvent(new Event('input', { bubbles: true }));
  };
  // 差しこみのボタンを、root の中の入力欄につなぐ（さいごにさわった欄へ。なければ fallback へ）
  T.bindVarChips = (root, fieldSel, fallbackSel) => {
    let last = null;
    root.addEventListener('focusin', (e) => { if (e.target.matches(fieldSel)) last = e.target; });
    root.addEventListener('click', (e) => {
      const b = e.target.closest('[data-var]');
      if (!b) return;
      e.preventDefault();
      T.insertAtCursor(last && root.contains(last) ? last : root.querySelector(fallbackSel), '{{' + b.dataset.var + '}}');
    });
  };
  // {{…}} を目立たせた文（エスケープずみ）
  T.markVars = (s) => T.raw(T.esc(s || '').replace(/\{\{([^{}]+)\}\}/g, '<mark class="var-left">{{$1}}</mark>'));

  T.showGasHelp = () => T.modal({
    title: 'Gmail で送る設定のしかた（Apps Script）', wide: true,
    body: String(html`<div class="gas-help">
      <p>管理画面から、Gmail を使って1人ずつ差しこんだメールを送れるようにします（10分ほど）。送るのは、設定した人の Gmail（学校や事務局のアカウント）です。</p>
      <ol>
        <li>Google ドライブで、Googleスプレッドシートを新しく作る（名前の例：大会 メール送信の記録）。送った記録が、このシートに残ります。</li>
        <li>メニューの「拡張機能」→「Apps Script」を開く。</li>
        <li>はじめから書いてある文字をすべて消して、このキットの <code>gas/mail.gs</code> の中身を貼り付ける。</li>
        <li>スクリプトの上のほうの <code>KEY</code> に、自分たちだけの合言葉（8文字以上）を書いて保存する。</li>
        <li>右上の「デプロイ」→「新しいデプロイ」→ 種類の歯車から「ウェブアプリ」。<br>次のユーザーとして実行：<b>自分</b>　／　アクセスできるユーザー：<b>全員</b> にして「デプロイ」。</li>
        <li>許可を求められたら、送信に使うアカウントで許可する（「Google はこのアプリを確認していません」と出たら「詳細」→「（プロジェクト名）に移動」）。</li>
        <li>出てきた「ウェブアプリのURL」（/exec で終わる）と、合言葉を、管理画面の「大会の設定」の「メールを本当に送る（Gmail・Apps Script）」に入れる。</li>
        <li><b>まずは運営のメンバー数人だけ</b>にしぼって送り、届くか・文字化けしないかを確かめる。</li>
      </ol>
      <div class="note warn"><p><b>1日に送れる数には上限があります。</b>ふつうの Gmail は1日100通ほど、Google Workspace（学校・組織のアカウント）は1日1500通ほどです。正確な数は、Google の案内（Apps Script の「割り当て」）で確かめてください。上限をこえる人数には、日を分けて送るか、CSV の書き出しを使います。</p></div>
      <p class="small muted">あとでスクリプトを直したときは「デプロイを管理」→ 鉛筆の印 → バージョン「新バージョン」→「デプロイ」（URL は変わりません）。<br>このスクリプトは、サンプルを作った環境では試せていません（未検証）。本番の前に、必ず少人数で試してください。</p>
    </div>`),
    actions: [{ label: '閉じる', value: 'cancel' }, ...(T.go ? [{ label: '大会の設定をひらく', kind: 'primary', value: 'go' }] : [])],
  }).then((v) => { if (v === 'go') T.go('admin/event'); });

  /* ───────── 相手をしぼる ───────── */
  const filterFields = (ev) => ev.form.fields.filter((f) => ['select', 'radio', 'checks'].includes(f.type) && (f.options || []).length);
  function recipients(ev, st) {
    const base = T.active(ev);
    if (st.mode === 'pick') { const set = new Set(st.ids); return base.filter((p) => set.has(p.id)); }
    if (st.mode !== 'filter') return base;
    const f = st.f;
    const sv = f.survey ? T.find(ev.surveys, f.survey) : null;
    return base.filter((p) => {
      for (const fd of filterFields(ev)) {
        const v = f['fd_' + fd.id];
        if (!v) continue;
        const pv = p.a[fd.id];
        if (v === '__none') { if (Array.isArray(pv) ? pv.length : pv) return false; continue; }
        if (Array.isArray(pv) ? !pv.includes(v) : pv !== v) return false;
      }
      if (f.paid === 'unpaid' && T.paid(p, ev)) return false;
      if (f.paid === 'paid' && !(p.paid && T.fee(p, ev) > 0)) return false;
      if (f.paid === 'free' && T.fee(p, ev) !== 0) return false;
      const ci = p.checkin || {};
      if (f.checkin === 'any' && !Object.keys(ci).length) return false;
      if (f.checkin === 'none' && Object.keys(ci).length) return false;
      if (f.checkin && f.checkin.startsWith('in:') && !ci[f.checkin.slice(3)]) return false;
      if (f.checkin && f.checkin.startsWith('out:') && ci[f.checkin.slice(4)]) return false;
      if (sv) {
        if (sv.target === 'checked' && !Object.keys(ci).length) return false;
        if (T.answered(sv, p.id)) return false;
      }
      return true;
    });
  }

  function state() {
    const st = T.uiState('mail', { tab: 'new', mode: 'all', f: {}, ids: [], subject: '', body: '', templateId: '', method: 'sample', toNews: false, idx: 0, log: 'manual' });
    const pre = T.ui.mailPreset;
    if (pre) {
      delete T.ui.mailPreset;
      const ev = T.ev();
      st.tab = 'new';
      if (pre.ids && pre.ids.length) { st.mode = 'pick'; st.ids = pre.ids.slice(); }
      if (pre.surveyUnanswered) { st.mode = 'filter'; st.f = { survey: pre.surveyUnanswered }; }
      const t = pre.templateId && T.find(ev.templates, pre.templateId);
      if (t) { st.templateId = t.id; st.subject = t.subject; st.body = t.body; }
      if (pre.subject != null) st.subject = pre.subject;
      if (pre.body != null) st.body = pre.body;
      st.idx = 0;
    }
    if (st.mode === 'pick' && !st.ids.length) st.mode = 'all';
    return st;
  }

  /* ───────── 画面：新しく送る ───────── */
  function compose(ev, st) {
    const list = recipients(ev, st);
    const gasReady = !!ev.info.mailGasUrl;
    if (st.method === 'gas' && !gasReady) st.method = 'sample';
    const fsel = (key, label, opts) => html`<div class="field"><label class="flabel" for="mf_${key}">${label}</label><select id="mf_${key}" data-f="${key}">${opts.map(([v, l]) => html`<option value="${v}" ${String(st.f[key] || '') === v ? T.raw('selected') : ''}>${l}</option>`)}</select></div>`;
    const days = ev.program.days || [];
    const tplGroups = groupBy(ev.templates, (t) => t.cat || 'その他');
    const noEmail = list.filter((p) => !p.a.email).length;
    return html`<div class="mail-compose">
      <div class="mail-steps">
        <section class="card">
          <div class="card-head"><span class="step-no">1</span><h2>送る相手</h2></div>
          <div class="seg" role="group" aria-label="送る相手の選び方">
            <button data-act="mode" data-v="all" aria-pressed="${st.mode === 'all'}">申込者みんな</button>
            <button data-act="mode" data-v="filter" aria-pressed="${st.mode === 'filter'}">条件でしぼる</button>
            ${st.ids.length ? html`<button data-act="mode" data-v="pick" aria-pressed="${st.mode === 'pick'}">えらんだ人（${st.ids.length}）</button>` : ''}
          </div>
          ${st.mode === 'filter' ? html`<div class="fgrid mail-filters">
            ${filterFields(ev).map((fd) => fsel('fd_' + fd.id, fd.short && fd.type !== 'radio' ? fd.short : fd.label, [['', '（すべて）'], ...fd.options.map((o) => [o.v, o.v]), ...(fd.type === 'checks' ? [['__none', '（どれも選んでいない）']] : [])]))}
            ${fsel('paid', '入金', [['', '（すべて）'], ['unpaid', '未入金の人だけ'], ['paid', '入金済みの人だけ'], ['free', '参加費のない人だけ']])}
            ${fsel('checkin', '当日の受付', [['', '（すべて）'], ['any', 'どれかの日に受付済み'], ['none', 'まだ受付していない'], ...days.flatMap((d) => [['in:' + d.id, T.md(d.date) + ' 受付済み'], ['out:' + d.id, T.md(d.date) + ' 未受付']])])}
            ${fsel('survey', 'アンケートに答えていない人', [['', '（しぼらない）'], ...ev.surveys.map((s) => [s.id, s.title])])}
          </div>
          <div class="row"><button class="btn sm ghost" data-act="clearFilter">${icon('x')} 条件をはずす</button></div>` : ''}
          ${st.mode === 'pick' ? html`<p class="small muted">参加者の画面でえらんだ人に送ります。<a href="#/admin/people">参加者の画面でえらびなおす</a></p>` : ''}
          <div class="recip-count">
            <span>${icon('users')} <b class="num">${list.length}</b> 人に送ります</span>
            <span class="small muted">取消の人は入りません${noEmail ? `・メールアドレスのない人 ${noEmail} 人` : ''}</span>
            <button class="btn sm" data-act="showRecipients" ${list.length ? '' : T.raw('disabled')}>${icon('eye')} 相手を見る</button>
          </div>
        </section>

        <section class="card">
          <div class="card-head"><span class="step-no">2</span><h2>文</h2></div>
          <div class="field"><label class="flabel" for="m-tpl">テンプレート</label>
            <select id="m-tpl" data-tpl><option value="">（テンプレートを使わない）</option>${[...tplGroups].map(([cat, ts]) => html`<optgroup label="${cat}">${ts.map((t) => html`<option value="${t.id}" ${t.id === st.templateId ? T.raw('selected') : ''}>${t.name}</option>`)}</optgroup>`)}</select>
            <p class="help"><a href="#/admin/templates">テンプレートを直す・足す</a></p></div>
          <div class="field"><label class="flabel" for="m-subj">件名</label><input id="m-subj" type="text" data-subj value="${st.subject}" placeholder="【{{大会名}}】…"></div>
          <div class="field"><label class="flabel" for="m-body">本文</label>${T.varChips()}<textarea id="m-body" data-body rows="13" placeholder="{{氏名}} 様&#10;&#10;…">${st.body}</textarea>
            <p class="help">{{氏名}} のような差しこみは、送るときに1人ずつの内容に置きかわります。押すと、カーソルの位置に入ります。</p></div>
        </section>

        <section class="card">
          <div class="card-head"><span class="step-no">3</span><h2>送り方</h2></div>
          <div class="methods" role="radiogroup" aria-label="送り方">
            ${['sample', 'gas', 'bcc', 'csv'].map((m) => html`<label class="method ${m === 'gas' && !gasReady ? 'off' : ''}">
              <input type="radio" name="m-method" value="${m}" ${st.method === m ? T.raw('checked') : ''} ${m === 'gas' && !gasReady ? T.raw('disabled') : ''}>
              <span><b>${T.mail.METHODS[m]}</b><small>${METHOD_HELP[m]}${m === 'gas' && !gasReady ? html` <button type="button" class="linkish" data-act="gasHelp">設定のしかた</button>（まだ設定されていません）` : ''}</small></span>
            </label>`)}
          </div>
          <label class="check news-check"><input type="checkbox" data-news ${st.toNews ? T.raw('checked') : ''}> <span>公開サイトの「お知らせ」にも載せる</span></label>
          <div class="mail-live" aria-live="polite"></div>
          <div class="row end"><button class="btn primary lg" data-act="send">${icon('send')} <span data-send-label></span></button></div>
        </section>
      </div>

      <aside class="card mail-preview" aria-label="見本">
        <div class="card-head"><h2>${icon('eye')} 見本（1人ずつの差しこみ）</h2></div>
        <div data-preview></div>
      </aside>
    </div>`;
  }

  function groupBy(arr, f) { const m = new Map(); for (const x of arr) { const k = f(x); if (!m.has(k)) m.set(k, []); m.get(k).push(x); } return m; }

  // 入力のたびに、見本・警告・ボタンの文字だけを描きなおす（入力欄はそのまま）
  function updateLive(root) {
    const ev = T.ev(), st = state();
    const list = recipients(ev, st);
    if (st.idx >= list.length) st.idx = Math.max(0, list.length - 1);
    const p = list[st.idx];
    const pv = root.querySelector('[data-preview]');
    if (pv) {
      if (!p) pv.innerHTML = String(html`<div class="empty">送る相手がいません。</div>`);
      else {
        const m = T.mail.render({ subject: st.subject, body: st.body }, p, ev);
        pv.innerHTML = String(html`<div class="pv-nav">
            <button class="icon-btn" data-act="pvPrev" aria-label="前の人" ${st.idx <= 0 ? T.raw('disabled') : ''}>${icon('back')}</button>
            <span class="small num">${st.idx + 1} / ${list.length} 人目</span>
            <button class="icon-btn" data-act="pvNext" aria-label="次の人" ${st.idx >= list.length - 1 ? T.raw('disabled') : ''}>${icon('arrow')}</button>
          </div>
          <div class="mail-sheet">
            <div class="mail-to"><span class="muted">宛先</span> ${T.pname(p)} &lt;${p.a.email || 'メールなし'}&gt; <span class="chip">${p.code}</span></div>
            <div class="mail-subj">${m.subject ? T.markVars(m.subject) : html`<span class="faint">（件名なし）</span>`}</div>
            <div class="mail-text">${m.body ? T.markVars(m.body) : html`<span class="faint">（本文なし）</span>`}</div>
          </div>`);
      }
    }
    // 警告
    const warns = [];
    const vars = T.vars(p || null, ev);
    const unknown = leftovers(st.subject + '\n' + st.body).filter((v) => vars[v.slice(2, -2).trim()] == null && !PERSONAL.includes(v.slice(2, -2).trim()));
    if (unknown.length) warns.push(['bad', `知らない差しこみがあります：${unknown.join('、')}（このまま送られます）`]);
    if (st.method === 'bcc' && hasPersonal(st.subject + st.body)) warns.push(['warn', 'BCC では1人ずつの差しこみ（{{氏名}} など）ができません。差しこみをはずすか、Gmail・CSV で送ってください。']);
    const personal = hasPersonal(st.subject + st.body);
    const news = root.querySelector('[data-news]');
    if (news) {
      news.disabled = personal;
      if (personal) { news.checked = false; st.toNews = false; }
      news.closest('label').title = personal ? '{{氏名}} のような、人ごとの差しこみがある文は、公開のお知らせに載せられません' : '';
    }
    if (personal) warns.push(['info', '人ごとの差しこみがあるので、公開サイトのお知らせには載せられません。']);
    if (st.method === 'gas' && list.length > 100) warns.push(['warn', `${list.length} 人に送ります。Gmail には1日に送れる数の上限があります（ふつうの Gmail は100通ほど）。`]);
    const live = root.querySelector('.mail-live');
    if (live) live.innerHTML = String(html`${warns.map(([k, t]) => html`<div class="note ${k === 'info' ? '' : k}"><p>${t}</p></div>`)}`);
    const lab = root.querySelector('[data-send-label]');
    if (lab) lab.textContent = { sample: `${list.length} 人に送る（サンプル：記録だけ）`, gas: `${list.length} 人に Gmail で送る`, bcc: 'BCC で送る準備をする', csv: `${list.length} 人ぶんを CSV に書き出す` }[st.method];
  }

  /* ───────── 画面：送信の記録 ───────── */
  function history(ev, st) {
    const all = ev.mails.slice().sort(T.by('at', -1));
    const auto = all.filter((m) => m.method === 'auto');
    const manual = all.filter((m) => m.method !== 'auto');
    const list = st.log === 'auto' ? auto : st.log === 'all' ? all : manual;
    const ev0 = T.vars(null, ev);
    return html`<div class="toolbar">
        <div class="seg" role="group" aria-label="しぼりこみ">
          <button data-act="logFilter" data-v="manual" aria-pressed="${st.log === 'manual'}">一斉連絡（${manual.length}）</button>
          <button data-act="logFilter" data-v="auto" aria-pressed="${st.log === 'auto'}">自動（${auto.length}）</button>
          <button data-act="logFilter" data-v="all" aria-pressed="${st.log === 'all'}">すべて（${all.length}）</button>
        </div>
        <span class="small muted">自動＝申込のときの確認メール・問い合わせへの回答</span>
      </div>
      ${list.length ? html`<div class="list mlog-list">${list.map((m) => html`<button class="item mlog" data-act="openLog" data-id="${m.id}">
        <span class="mlog-date num">${T.dt(m.at)}</span>
        <span class="item-main">
          <span class="item-title">${T.merge(m.subject, ev0) || '（件名なし）'}</span>
          <span class="item-meta"><span>${icon('users')} ${(m.to || []).length} 人</span><span>${T.mail.METHODS[m.method] || m.method}</span><span>${m.by || ''}</span></span>
        </span>
        ${statusChip(m)}
      </button>`)}</div>` : html`<div class="empty">まだ送った記録はありません。</div>`}`;
  }
  const statusChip = (m) => (m.error ? html`<span class="chip bad">送れなかった</span>`
    : m.method === 'gas' || (m.method === 'auto' && m.sent) ? html`<span class="chip ok">送信済み</span>`
      : m.method === 'csv' ? html`<span class="chip info">CSV</span>`
        : m.method === 'bcc' ? html`<span class="chip info">BCC</span>`
          : html`<span class="chip">記録だけ</span>`);

  async function openLog(id) {
    const ev = T.ev();
    const m = T.find(ev.mails, id);
    if (!m) return;
    const people = (m.to || []).map((pid) => T.find(ev.people, pid)).filter(Boolean);
    const first = people[0];
    const r = first ? T.mail.render(m, first, ev) : { subject: m.subject, body: m.body };
    const v = await T.modal({
      title: '送信の記録', wide: true,
      body: String(html`<dl class="mlog-meta">
          <dt>送った日時</dt><dd>${T.dateJa(m.at)} ${T.time(m.at)}</dd>
          <dt>送り方</dt><dd>${T.mail.METHODS[m.method] || m.method} ${statusChip(m)}</dd>
          <dt>送った人</dt><dd>${m.by || '—'}</dd>
          <dt>相手</dt><dd>${people.length} 人</dd>
          ${m.error ? html`<dt>エラー</dt><dd class="bad-text">${m.error}</dd>` : ''}
        </dl>
        <h3 class="sub-h">見本（${first ? T.pname(first) + ' さんへ' : '相手なし'}）</h3>
        <div class="mail-sheet"><div class="mail-subj">${T.markVars(r.subject)}</div><div class="mail-text">${T.markVars(r.body)}</div></div>
        <h3 class="sub-h">相手（${people.length} 人）</h3>
        <div class="tbl-wrap recip-tbl"><table class="tbl"><thead><tr><th>受付番号</th><th>氏名</th><th>所属</th><th>メール</th></tr></thead><tbody>
          ${people.map((p) => html`<tr><td class="mono">${p.code}</td><td>${T.pname(p)}</td><td>${p.a.org || ''}</td><td class="small">${p.a.email || ''}</td></tr>`)}
        </tbody></table></div>`),
      actions: [{ label: '閉じる', value: 'cancel' }, { label: 'この文で、もう一度つくる', kind: 'primary', value: 'reuse' }],
    });
    if (v === 'reuse') {
      const st = state();
      Object.assign(st, { tab: 'new', subject: m.subject, body: m.body, templateId: m.templateId || '', idx: 0 });
      T.refresh();
      T.toast('文をうつしました。相手と送り方を選んでください');
    }
  }

  /* ───────── 送る ───────── */
  async function send() {
    const ev = T.ev(), st = state();
    const list = recipients(ev, st);
    if (!list.length) return T.toast('送る相手がいません', 'bad');
    if (!st.subject.trim() || !st.body.trim()) return T.toast('件名と本文を入れてください', 'bad');
    const ids = list.map((p) => p.id);
    const ev0 = T.vars(null, ev);
    const subjShown = T.merge(st.subject, ev0);

    if (st.method === 'bcc') return bccModal(ev, st, list);
    if (st.method === 'csv') {
      const rows = [['受付番号', '氏名', 'メール', '所属', '件名', '本文']];
      for (const p of list) { const r = T.mail.render(st, p, ev); rows.push([p.code, T.pname(p), p.a.email || '', p.a.org || '', r.subject, r.body]); }
      T.download(`一斉連絡_${T.today()}_${list.length}人.csv`, T.csv(rows), 'text/csv;charset=utf-8');
      await T.mail.send({ subject: st.subject, body: st.body, to: ids, method: 'csv', templateId: st.templateId, by: T.who(), note: 'CSV を書き出し' }, ev);
      return done(ev, st, `CSV を書き出しました（${list.length} 人）。記録にも残しました`, subjShown, list.length, 'CSV');
    }
    const label = st.method === 'gas' ? 'Gmail で本当に送ります' : 'サンプルなので、本当には送らず、記録だけ残します';
    if (!(await T.confirm(`${list.length} 人に「${subjShown}」を送ります（${label}）。よろしいですか？`, { ok: '送る', title: '送る前の確認' }))) return;
    const btn = document.querySelector('[data-act="send"]');
    if (btn) { btn.disabled = true; btn.querySelector('[data-send-label]').textContent = '送っています…'; }
    const rec = await T.mail.send({ subject: st.subject, body: st.body, to: ids, method: st.method, templateId: st.templateId, by: T.who() }, ev);
    if (rec.error) {
      T.toast('Gmail で送れませんでした：' + rec.error + '（記録には残しました）', 'bad');
      T.logIt(`一斉連絡「${subjShown}」を送れなかった（${list.length}人）`, T.who());
      T.save(); st.tab = 'log'; st.log = 'manual'; T.refresh();
      return;
    }
    done(ev, st, st.method === 'gas' ? `${list.length} 人に送りました` : `${list.length} 人に送りました（サンプル：記録だけ）`, subjShown, list.length, T.mail.METHODS[st.method]);
  }
  function done(ev, st, msg, subjShown, n, how) {
    if (st.toNews && !hasPersonal(st.subject + st.body)) {
      const vars = T.vars(null, ev);
      ev.news.unshift({ id: T.uid('n'), date: T.today(), cat: 'お知らせ', title: T.merge(st.subject, vars).replace(/^【[^】]*】\s*/, ''), body: T.merge(st.body, vars), pinned: false, published: true });
      msg += '。お知らせにも載せました';
    }
    T.logIt(`一斉連絡「${subjShown}」（${n}人・${how}）`, T.who());
    T.save();
    Object.assign(st, { tab: 'log', log: 'manual', subject: '', body: '', templateId: '', toNews: false, idx: 0 });
    T.toast(msg);
    T.refresh();
  }
  async function bccModal(ev, st, list) {
    const emails = [...new Set(list.map((p) => p.a.email).filter(Boolean))];
    const chunks = [];
    for (let i = 0; i < emails.length; i += 50) chunks.push(emails.slice(i, i + 50));
    const vars = T.vars(null, ev);
    const subject = T.merge(st.subject, vars), body = T.merge(st.body, vars);
    const left = leftovers(subject + body);
    const v = await T.modal({
      title: 'メールソフト（BCC）で送る', wide: true,
      body: String(html`<p>メールソフトで新しいメールを作り、<b>宛先は自分（事務局）</b>、<b>BCC</b> に下のアドレスを貼り付けて送ります。BCC にすると、ほかの人のアドレスは見えません。</p>
        ${left.length ? html`<div class="note warn"><p>差しこみが残っています：${left.join('、')}。BCC では1人ずつ置きかえられないので、文から消してから送ってください。</p></div>` : ''}
        <h3 class="sub-h">件名</h3><div class="copy-row"><code class="copy-text">${subject}</code><button class="btn sm" data-copy="subject">${icon('copy')} コピー</button></div>
        <h3 class="sub-h">本文</h3><div class="copy-row"><pre class="copy-text pre">${body}</pre><button class="btn sm" data-copy="body">${icon('copy')} コピー</button></div>
        <h3 class="sub-h">BCC のアドレス（${emails.length} 件・50件ずつ）</h3>
        <p class="help">1通の BCC が多すぎると、迷惑メールあつかいになることがあります。50件ずつに分けて送ってください。</p>
        <div class="chunks">${chunks.map((c, i) => html`<div class="chunk"><b>${i + 1} 通目</b><span class="small muted">${c.length} 件（${c[0]} ほか）</span><button class="btn sm" data-copy="chunk" data-i="${i}">${icon('copy')} コピー</button></div>`)}</div>`),
      actions: [{ label: '閉じる', value: 'cancel' }, { label: '送ったので、記録に残す', kind: 'primary', value: 'log' }],
      onOpen(w) {
        w.addEventListener('click', (e) => {
          const b = e.target.closest('[data-copy]');
          if (!b) return;
          const k = b.dataset.copy;
          if (k === 'subject') T.copy(subject, '件名をコピーしました');
          else if (k === 'body') T.copy(body, '本文をコピーしました');
          else { T.copy(chunks[+b.dataset.i].join(', '), `${+b.dataset.i + 1} 通目の BCC（${chunks[+b.dataset.i].length} 件）をコピーしました`); b.classList.add('done'); }
        });
      },
    });
    if (v === 'log') {
      await T.mail.send({ subject: st.subject, body: st.body, to: list.map((p) => p.id), method: 'bcc', templateId: st.templateId, by: T.who(), note: 'メールソフト（BCC）で送信' }, ev);
      done(ev, st, `記録に残しました（${list.length} 人・BCC）`, subject, list.length, 'BCC');
    }
  }

  /* ───────── ページ ───────── */
  T.page('admin', 'mail', {
    title: '一斉連絡', icon: 'mail', group: '連絡', order: 10,
    lead: '相手をしぼり、テンプレートと差しこみ（{{氏名}} など）で、1人ずつの文にして送ります。送った記録は、相手のマイページにも出ます。',
    head() { return html`<button class="btn" data-act="gasHelp">${icon('help')} Gmail で送る設定</button>`; },
    render() {
      const ev = T.ev(), st = state();
      return html`<div class="tabs" role="tablist">
          <button class="tab" role="tab" data-act="tab" data-v="new" aria-selected="${st.tab === 'new'}">${icon('send')} 新しく送る</button>
          <button class="tab" role="tab" data-act="tab" data-v="log" aria-selected="${st.tab === 'log'}">${icon('list')} 送信の記録（${ev.mails.length}）</button>
        </div>
        ${st.tab === 'log' ? history(ev, st) : compose(ev, st)}`;
    },
    mount(root) {
      const st = state();
      if (st.tab !== 'new') return;
      root.querySelectorAll('[data-f]').forEach((el) => el.addEventListener('change', () => { st.f[el.dataset.f] = el.value; st.idx = 0; T.refresh(); }));
      const subj = root.querySelector('[data-subj]'), body = root.querySelector('[data-body]');
      subj.addEventListener('input', () => { st.subject = subj.value; updateLive(root); });
      body.addEventListener('input', () => { st.body = body.value; updateLive(root); });
      T.bindVarChips(root, '[data-subj],[data-body]', '[data-body]');
      root.querySelector('[data-tpl]').addEventListener('change', async (e) => {
        const ev = T.ev();
        const t = T.find(ev.templates, e.target.value);
        if (!t) { st.templateId = ''; return; }
        if (st.body.trim() && st.body !== t.body && !(await T.confirm('いまの件名・本文を、テンプレートで置きかえますか？', { ok: '置きかえる' }))) { e.target.value = st.templateId; return; }
        Object.assign(st, { templateId: t.id, subject: t.subject, body: t.body });
        T.refresh();
      });
      root.querySelectorAll('[name="m-method"]').forEach((el) => el.addEventListener('change', () => { st.method = el.value; updateLive(root); }));
      const news = root.querySelector('[data-news]');
      news.addEventListener('change', () => { st.toNews = news.checked; });
      updateLive(root);
    },
    acts: {
      tab(el) { state().tab = el.dataset.v; T.refresh(); },
      mode(el) { const st = state(); st.mode = el.dataset.v; st.idx = 0; T.refresh(); },
      clearFilter() { const st = state(); st.f = {}; st.idx = 0; T.refresh(); },
      logFilter(el) { state().log = el.dataset.v; T.refresh(); },
      pvPrev() { const st = state(); st.idx = Math.max(0, st.idx - 1); updateLive(document.querySelector('.page-body')); },
      pvNext() { const st = state(); st.idx += 1; updateLive(document.querySelector('.page-body')); },
      gasHelp() { T.showGasHelp(); },
      openLog(el) { openLog(el.dataset.id); },
      send() { send(); },
      showRecipients() {
        const ev = T.ev();
        const list = recipients(ev, state());
        T.modal({
          title: `送る相手（${list.length} 人）`, wide: true,
          body: String(html`<div class="tbl-wrap recip-tbl"><table class="tbl"><thead><tr><th>受付番号</th><th>氏名</th><th>所属</th><th>部会</th><th>入金</th><th>メール</th></tr></thead><tbody>
            ${list.map((p) => html`<tr><td class="mono">${p.code}</td><td>${T.pname(p)}</td><td>${p.a.org || ''}</td><td class="small">${p.a.bu || ''}</td><td>${T.fee(p, ev) === 0 ? html`<span class="chip">なし</span>` : p.paid ? html`<span class="chip ok">済</span>` : html`<span class="chip warn">未</span>`}</td><td class="small">${p.a.email || ''}</td></tr>`)}
          </tbody></table></div>`),
          actions: [{ label: '閉じる', value: 'cancel' }],
        });
      },
    },
  });
})();
