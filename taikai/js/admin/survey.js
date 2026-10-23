/* アンケート：一覧（回答率）、作る・直す（質問の追加・並べかえ・見本）、結果（横棒・平均・自由記述・CSV）、会場で映すQR
   #/admin/survey … 一覧　#/admin/survey/<id> … 作る・直す　#/admin/survey/<id>/results … 結果
   答えは sv.responses に {id, pid, at, a:{質問id: 答え}}。公開の答える画面は #/survey/<id>（公開サイト側）。 */
(function () {
  'use strict';
  const { html, icon } = T;

  const QT = Object.fromEntries(T.Q_TYPES);
  const TARGET = { all: '申込者みんな', checked: '当日受付をした人' };
  const svUrl = (sv) => T.siteUrl() + '#/survey/' + sv.id;
  const pop = (sv, ev) => (sv.target === 'checked' ? T.active(ev).filter((p) => Object.keys(p.checkin || {}).length > 0) : T.active(ev));
  const isEmpty = (x) => (Array.isArray(x) ? !x.length : x === '' || x == null);

  function rateHtml(sv, ev) {
    const n = sv.responses.length, d = pop(sv, ev).length;
    const pct = d ? Math.min(100, Math.round((n / d) * 100)) : 0;
    return html`<div class="sv-rate"><div class="kpi-line"><b class="sv-n">${T.num(n)}</b><span class="muted small">件 ／ ${TARGET[sv.target] || ''} ${T.num(d)} 人（回答率 ${d ? pct + '%' : '—'}）</span></div><div class="bar" title="回答率 ${d ? pct + '%' : '—'}"><span style="width:${pct}%"></span></div></div>`;
  }

  /* ── 一覧 ── */
  function listView(ev) {
    if (!ev.surveys.length) return html`<div class="empty">まだアンケートがありません。「新しく作る」から作ってください。</div>`;
    return html`<div class="grid2">${ev.surveys.map((sv) => html`<section class="card sv-card">
      <div class="card-head"><h3>${sv.title}</h3></div>
      <div class="row tight" style="margin-bottom:10px">
        ${sv.open ? html`<span class="chip ok"><span class="dot"></span>受付中</span>` : html`<span class="chip">受付していない</span>`}
        <span class="chip">${TARGET[sv.target] || ''}</span>
        ${sv.anonymous ? html`<span class="chip info">名前を伏せて集計</span>` : ''}
        <span class="chip">質問 ${sv.questions.length}</span>
      </div>
      ${sv.lead ? html`<p class="small muted">${sv.lead}</p>` : ''}
      ${rateHtml(sv, ev)}
      <div class="row" style="margin-top:12px">
        <a class="btn sm primary" href="#/admin/survey/${sv.id}/results">${icon('chart')} 結果</a>
        <a class="btn sm" href="#/admin/survey/${sv.id}">${icon('edit')} 直す</a>
        <button class="btn sm" data-act="qr" data-id="${sv.id}">${icon('qr')} QR</button>
        <button class="btn sm ghost" data-act="toggle" data-id="${sv.id}">${sv.open ? '受付を止める' : '受付を始める'}</button>
        <span class="spacer"></span>
        <button class="icon-btn" data-act="dup" data-id="${sv.id}" title="複製" aria-label="複製">${icon('copy')}</button>
        <button class="icon-btn danger-ic" data-act="del" data-id="${sv.id}" title="削除" aria-label="削除">${icon('trash')}</button>
      </div>
    </section>`)}</div>`;
  }

  /* ── 作る・直す ── */
  const SV_FIELDS = [
    { k: 'title', label: '題名', required: true, full: true },
    { k: 'lead', label: '説明（いちばん上に出る）', type: 'textarea', rows: 2 },
    { k: 'target', label: '答える人', type: 'select', options: Object.entries(TARGET), help: '「当日受付をした人」にすると、受付のあとでマイページに出ます。' },
    { k: 'open', label: '受付', type: 'check', text: '受付中にする（公開サイトで答えられる）' },
    { k: 'anonymous', label: '集計のしかた', type: 'check', text: '名前を伏せて集計する（結果・CSV に名前を出さない）' },
  ];
  function editView(sv, ev) {
    const has = sv.responses.length;
    return html`<div class="sv-edit">
      <div class="stack">
        <form class="card" data-form="svSettings">
          <div class="card-head"><h3>アンケートの設定</h3></div>
          ${T.fieldsHtml(SV_FIELDS, sv)}
          <div class="row end" style="margin-top:12px"><button class="btn primary">${icon('check')} 保存する</button></div>
        </form>
        <section class="card">
          <div class="card-head"><h3>質問（${sv.questions.length}）</h3><span class="spacer"></span><button class="btn sm primary" data-act="qadd">${icon('plus')} 質問を足す</button></div>
          ${has ? html`<p class="note warn small">すでに ${has} 件の回答があります。選択肢の文字を変えたり、質問を消したりすると、前の回答と集計が合わなくなります。</p>` : ''}
          ${sv.questions.length ? html`<ol class="q-items">${sv.questions.map((q, i) => html`<li class="q-item">
            <span class="q-no">Q${i + 1}</span>
            <div class="item-main">
              <div><b>${q.label}</b> <span class="chip">${QT[q.type] || q.type}</span>${q.required ? html` <span class="chip bad">必須</span>` : ''}</div>
              ${q.options && q.options.length && q.type !== 'scale' && q.type !== 'text' ? html`<div class="small muted">${q.options.join('／')}</div>` : ''}
              ${q.type === 'scale' ? html`<div class="small muted">1「${q.min || 'そう思わない'}」〜 5「${q.max || 'そう思う'}」</div>` : ''}
            </div>
            <div class="item-actions">
              <button class="icon-btn" data-act="qup" data-i="${i}" ${i === 0 ? T.raw('disabled') : ''} title="上へ" aria-label="上へ">↑</button>
              <button class="icon-btn" data-act="qdown" data-i="${i}" ${i === sv.questions.length - 1 ? T.raw('disabled') : ''} title="下へ" aria-label="下へ">↓</button>
              <button class="icon-btn" data-act="qedit" data-i="${i}" title="直す" aria-label="直す">${icon('edit')}</button>
              <button class="icon-btn danger-ic" data-act="qdel" data-i="${i}" title="削除" aria-label="削除">${icon('trash')}</button>
            </div>
          </li>`)}</ol>` : html`<div class="empty">質問がありません。</div>`}
        </section>
      </div>
      <section class="card sv-preview">
        <div class="card-head"><h3>答える画面（見本）</h3><span class="spacer"></span><a class="btn sm ghost" href="#/survey/${sv.id}" target="_blank" rel="noopener">${icon('external')} 開く</a></div>
        <h4 class="sv-prev-title">${sv.title}</h4>
        ${sv.lead ? html`<p class="small muted">${sv.lead}</p>` : ''}
        <form onsubmit="return false" aria-label="アンケートの見本">${T.surveyHtml(sv)}</form>
      </section>
    </div>`;
  }

  async function editQ(sv, i) {
    const isNew = i == null;
    const q = isNew ? { type: 'radio', label: '', options: [], required: false } : sv.questions[i];
    const fields = [
      { k: 'label', label: '質問の文', required: true, full: true },
      { k: 'type', label: '答え方', type: 'select', options: T.Q_TYPES },
      { k: 'required', label: '必須', type: 'check', text: '答えないと送れないようにする' },
      { k: 'options', label: '選択肢（1行に1つ）', type: 'textarea', rows: 5 },
      { k: 'min', label: '「1」のことば', placeholder: 'そう思わない' },
      { k: 'max', label: '「5」のことば', placeholder: 'そう思う' },
    ];
    await T.editRecord({
      title: isNew ? '質問を足す' : '質問を直す', fields,
      value: Object.assign({}, q, { options: (q.options || []).join('\n') }),
      onOpen(wrap) {
        const sel = wrap.querySelector('[name=type]');
        const box = (k) => wrap.querySelector(`[name=${k}]`).closest('.field');
        const sync = () => { const t = sel.value; box('options').classList.toggle('hidden', !['radio', 'checks'].includes(t)); box('min').classList.toggle('hidden', t !== 'scale'); box('max').classList.toggle('hidden', t !== 'scale'); };
        sel.addEventListener('change', sync);
        sync();
      },
      check(v) {
        if (['radio', 'checks'].includes(v.type) && !v.options.split(/\r?\n/).some((s) => s.trim())) { T.toast('選択肢を1つ以上入れてください', 'bad'); return false; }
      },
      onSave(v) {
        const nq = { id: q.id || T.uid('q'), type: v.type, label: v.label, required: v.required };
        if (['radio', 'checks'].includes(v.type)) nq.options = [...new Set(v.options.split(/\r?\n/).map((s) => s.trim()).filter(Boolean))];
        if (v.type === 'scale') { if (v.min) nq.min = v.min; if (v.max) nq.max = v.max; }
        if (isNew) sv.questions.push(nq); else sv.questions[i] = nq;
        T.logIt(`アンケート「${sv.title}」の質問を${isNew ? '足しました' : '直しました'}`, T.who());
        T.save(); T.refresh();
      },
      onDelete: isNew ? null : () => { sv.questions.splice(i, 1); T.save(); T.refresh(); },
    });
  }

  /* ── 結果 ── */
  const barRow = (label, n, base, title) => {
    const pct = base ? Math.round((n / base) * 100) : 0;
    return html`<div class="res-row" title="${title || label}：${n}人（${pct}%）"><span class="res-label">${label}</span><span class="bar res-bar"><span style="width:${pct}%"></span></span><span class="res-val num"><b>${n}</b>人 <span class="muted">${pct}%</span></span></div>`;
  };
  function qResult(q, i, sv, ev) {
    const ans = sv.responses.map((r) => ({ r, v: (r.a || {})[q.id] })).filter((x) => !isEmpty(x.v));
    const n = ans.length;
    let body;
    if (q.type === 'scale') {
      const counts = [1, 2, 3, 4, 5].map((k) => ans.filter((x) => Number(x.v) === k).length);
      const avg = n ? T.sum(ans, (x) => Number(x.v)) / n : 0;
      body = html`<div class="res-avg"><span class="muted small">平均</span> <b class="num">${n ? avg.toFixed(2) : '—'}</b> <span class="muted small">／ 5（${n}人）</span></div>
        <div class="res-bars">${[5, 4, 3, 2, 1].map((k) => barRow(`${k}${k === 5 ? `（${q.max || 'そう思う'}）` : k === 1 ? `（${q.min || 'そう思わない'}）` : ''}`, counts[k - 1], n))}</div>`;
    } else if (q.type === 'radio' || q.type === 'checks') {
      const opts = q.options || [];
      const extra = new Map();
      for (const x of ans) for (const v of [].concat(x.v)) if (!opts.includes(v)) extra.set(v, (extra.get(v) || 0) + 1);
      body = html`<div class="res-bars">${opts.map((o) => barRow(o, ans.filter((x) => [].concat(x.v).includes(o)).length, n))}${[...extra].map(([o, c]) => barRow(`${o}（選択肢にない答え）`, c, n))}</div>
        ${q.type === 'checks' ? html`<p class="help">いくつでも選べる質問なので、％は「この質問に答えた ${n} 人」に対する割合です（足すと100%をこえます）。</p>` : ''}`;
    } else {
      const list = ans.filter((x) => String(x.v).trim()).sort((a, b) => String(b.r.at).localeCompare(String(a.r.at)));
      body = list.length ? html`<ul class="answers">${list.map((x) => { const p = !sv.anonymous && x.r.pid ? T.find(ev.people, x.r.pid) : null; return html`<li><p>${T.text(x.v)}</p><div class="tiny muted">${p ? `${T.pname(p)}（${T.pv(p, 'org') || ''}）・` : ''}${T.dt(x.r.at)}</div></li>`; })}</ul>` : html`<p class="muted small">まだ書かれた答えはありません。</p>`;
    }
    return html`<section class="card res-card"><div class="card-head"><h3><span class="q-no">Q${i + 1}</span> ${q.label}</h3><span class="spacer"></span><span class="chip">${QT[q.type] || q.type}・${n}人が回答</span></div>${body}</section>`;
  }
  function resultsView(sv, ev) {
    const last = sv.responses.reduce((m, r) => (r.at > m ? r.at : m), '');
    return html`<div class="stack">
      <div class="stats">
        <div class="stat"><div class="stat-label">回答</div><div class="stat-value">${T.num(sv.responses.length)}<small>件</small></div><div class="stat-sub">${sv.open ? '受付中' : '受付していない'}</div></div>
        <div class="stat"><div class="stat-label">答える人（${TARGET[sv.target] || ''}）</div><div class="stat-value">${T.num(pop(sv, ev).length)}<small>人</small></div><div class="stat-sub">取消を除く</div></div>
        <div class="stat"><div class="stat-label">回答率</div><div class="stat-value">${T.pct(sv.responses.length, pop(sv, ev).length)}</div><div class="stat-sub">${last ? '最後の回答 ' + T.dt(last) : 'まだ回答がありません'}</div></div>
      </div>
      ${sv.anonymous ? html`<p class="note small">このアンケートは「名前を伏せて集計」です。結果と CSV に名前を出しません。</p>` : ''}
      ${sv.questions.map((q, i) => qResult(q, i, sv, ev))}
    </div>`;
  }

  function csvOf(sv, ev) {
    const head = ['回答日時', ...(sv.anonymous ? [] : ['受付番号', '氏名', '所属']), ...sv.questions.map((q, i) => `Q${i + 1} ${q.label}`)];
    const rows = sv.responses.slice().sort(T.by('at')).map((r) => {
      const p = r.pid ? T.find(ev.people, r.pid) : null;
      return [T.ymd(r.at) + ' ' + T.time(r.at), ...(sv.anonymous ? [] : [p ? p.code : '', p ? T.pname(p) : '', p ? T.pv(p, 'org') || '' : '']), ...sv.questions.map((q) => { const v = (r.a || {})[q.id]; return Array.isArray(v) ? v.join('、') : v == null ? '' : v; })];
    });
    return T.csv([head, ...rows]);
  }

  function showQr(sv) {
    const url = svUrl(sv);
    T.modal({
      title: 'アンケートのQRコード', wide: true, cls: 'qr-modal',
      body: String(html`<div class="qr-screen"><div class="qr-big">${T.raw(T.qrSvg(url, { label: 'アンケートのQRコード', level: 'Q' }))}</div><div><p class="eyebrow-s">${T.eventTitle()}</p><h3 class="qr-title">${sv.title}</h3><p>スマホのカメラで読みとって、答えてください。</p><p class="mono small fb-url">${url}</p><button class="btn sm" data-op="copyurl">${icon('copy')} URLをコピー</button></div></div><p class="help">会場のスクリーンに映すときは、この窓を開いたまま、ブラウザを全画面（F11）にしてください。</p>`),
      onOpen(wrap) { wrap.querySelector('[data-op="copyurl"]').addEventListener('click', () => T.copy(url, 'URLをコピーしました')); },
      actions: [{ label: '閉じる', value: 'cancel' }],
    });
  }

  const cur = (r) => { const id = (r.arg || '').split('/')[0]; return id ? T.find(T.ev().surveys, id) : null; };
  const mode = (r) => ((r.arg || '').split('/')[1] === 'results' ? 'results' : (r.arg ? 'edit' : 'list'));

  T.page('admin', 'survey', {
    title: 'アンケート', icon: 'chart', group: '連絡', order: 40,
    lead: '事前・大会後のアンケートを作り、公開サイトやマイページで答えてもらいます。結果はその場で集計されます。',
    head(r) {
      const sv = cur(r), m = mode(r);
      if (!sv) return html`<button class="btn primary" data-act="create">${icon('plus')} 新しく作る</button>`;
      const back = html`<a class="btn ghost" href="#/admin/survey">${icon('back')} 一覧</a>`;
      if (m === 'results') return html`${back}<button class="btn" data-act="qr" data-id="${sv.id}">${icon('qr')} QR</button><button class="btn" data-act="remind" data-id="${sv.id}">${icon('mail')} まだ答えていない人に連絡</button><button class="btn" data-act="csv" data-id="${sv.id}">${icon('download')} CSV</button><a class="btn primary" href="#/admin/survey/${sv.id}">${icon('edit')} 直す</a>`;
      return html`${back}<button class="btn" data-act="qr" data-id="${sv.id}">${icon('qr')} QR</button><a class="btn primary" href="#/admin/survey/${sv.id}/results">${icon('chart')} 結果を見る</a>`;
    },
    render(r) {
      const ev = T.ev();
      const sv = cur(r);
      if (r.arg && !sv) return html`<div class="empty">このアンケートは見つかりません。<a href="#/admin/survey">一覧へ</a></div>`;
      if (!sv) return listView(ev);
      const crumb = html`<p class="small muted sv-crumb">${mode(r) === 'results' ? '結果' : '作る・直す'}：<b>${sv.title}</b> ${sv.open ? html`<span class="chip ok">受付中</span>` : html`<span class="chip">受付していない</span>`}</p>`;
      return html`${crumb}${mode(r) === 'results' ? resultsView(sv, ev) : editView(sv, ev)}`;
    },
    acts: {
      create() {
        const ev = T.ev();
        const sv = { id: T.uid('sv'), title: '新しいアンケート', lead: '', open: false, anonymous: false, target: 'all', questions: [{ id: T.uid('q'), type: 'scale', label: '満足度', min: '不満', max: '満足', required: true }, { id: T.uid('q'), type: 'text', label: '感想・ご意見', required: false }], responses: [] };
        ev.surveys.push(sv);
        T.logIt('アンケートを新しく作りました', T.who());
        T.save();
        T.go('admin/survey/' + sv.id);
      },
      dup(el) {
        const ev = T.ev(), sv = T.find(ev.surveys, el.dataset.id);
        if (!sv) return;
        const c = T.clone(sv);
        Object.assign(c, { id: T.uid('sv'), title: sv.title + '（コピー）', responses: [], open: false });
        ev.surveys.splice(ev.surveys.indexOf(sv) + 1, 0, c);
        T.save(); T.refresh(); T.toast('複製しました（回答は空です）');
      },
      async del(el) {
        const ev = T.ev(), sv = T.find(ev.surveys, el.dataset.id);
        if (!sv || !(await T.confirm(`「${sv.title}」を削除します。${sv.responses.length ? `回答 ${sv.responses.length} 件も消えます。` : ''}よろしいですか？`, { danger: true, ok: '削除する' }))) return;
        T.removeFrom(ev.surveys, sv.id);
        T.logIt(`アンケート「${sv.title}」を削除しました`, T.who());
        T.save(); T.go('admin/survey');
      },
      toggle(el) {
        const sv = T.find(T.ev().surveys, el.dataset.id);
        if (!sv) return;
        sv.open = !sv.open;
        T.logIt(`アンケート「${sv.title}」の受付を${sv.open ? '始めました' : '止めました'}`, T.who());
        T.save(); T.refresh(); T.toast(sv.open ? '受付を始めました' : '受付を止めました');
      },
      qr(el) { const sv = T.find(T.ev().surveys, el.dataset.id); if (sv) showQr(sv); },
      csv(el) { const ev = T.ev(), sv = T.find(ev.surveys, el.dataset.id); if (sv) T.download(`アンケート_${sv.title}_${T.today()}.csv`, csvOf(sv, ev), 'text/csv;charset=utf-8'); },
      remind(el) { T.ui.mailPreset = { surveyUnanswered: el.dataset.id, templateId: 't5' }; T.go('admin/mail'); },
      qadd() { const sv = cur(T.current); if (sv) editQ(sv, null); },
      qedit(el) { const sv = cur(T.current); if (sv) editQ(sv, Number(el.dataset.i)); },
      qup(el) { const sv = cur(T.current), i = Number(el.dataset.i); if (sv && i > 0) { [sv.questions[i - 1], sv.questions[i]] = [sv.questions[i], sv.questions[i - 1]]; T.save(); T.refresh(); } },
      qdown(el) { const sv = cur(T.current), i = Number(el.dataset.i); if (sv && i < sv.questions.length - 1) { [sv.questions[i + 1], sv.questions[i]] = [sv.questions[i], sv.questions[i + 1]]; T.save(); T.refresh(); } },
      async qdel(el) {
        const sv = cur(T.current), i = Number(el.dataset.i), q = sv && sv.questions[i];
        if (!q || !(await T.confirm(`質問「${q.label}」を削除します。よろしいですか？`, { danger: true, ok: '削除する' }))) return;
        sv.questions.splice(i, 1);
        T.save(); T.refresh();
      },
    },
    forms: {
      svSettings(_, form) {
        const sv = cur(T.current);
        if (!sv) return;
        const v = T.readFields(form, SV_FIELDS);
        if (!v.title) { T.toast('題名を入れてください', 'bad'); return; }
        Object.assign(sv, v);
        T.logIt(`アンケート「${sv.title}」の設定を直しました`, T.who());
        T.save(); T.refresh(); T.toast('保存しました');
      },
    },
  });
})();
