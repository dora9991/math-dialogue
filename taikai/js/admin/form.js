/* 申込フォーム：項目の追加・並べかえ・直す・隠す、公開の見え方の見本（参加費の合計も動く）、申込の期間・定員・確認メール、申込ページのQR */
(function () {
  'use strict';
  const { html, icon } = T;

  const TYPE_LABEL = Object.fromEntries(T.FIELD_TYPES);
  const HAS_OPTS = ['select', 'radio', 'checks'];
  const ui = () => T.uiState('form', { tab: 'fields' });

  // その選択肢を選んでいる人の数
  const chose = (ev, fid, v) => ev.people.filter((p) => { const a = p.a ? p.a[fid] : undefined; return Array.isArray(a) ? a.includes(v) : a === v; }).length;
  const applyUrl = () => T.siteUrl() + '#/apply';

  function status(ev) {
    const i = ev.info, t = T.today();
    if (i.applyOpen && t < i.applyOpen) return html`<span class="chip info">受付前（${T.md(i.applyOpen)} から）</span>`;
    if (i.applyClose && t > i.applyClose) return html`<span class="chip bad">締め切りました</span>`;
    return html`<span class="chip ok"><span class="dot"></span>受付中${i.applyClose ? `（${T.md(i.applyClose)} まで）` : ''}</span>`;
  }

  function fieldsTab(ev) {
    const fields = ev.form.fields;
    return html`<div class="fb-layout">
      <section class="fb-list">
        <div class="row between fb-list-head"><h2 class="section-title" style="margin:0">項目（${fields.length}）</h2><button class="btn sm primary" data-act="add">${icon('plus')} 項目を足す</button></div>
        <ol class="fb-items">${fields.map((f, i) => {
          const opts = f.options || [];
          const sum = HAS_OPTS.includes(f.type) ? opts.slice(0, 6).map((o) => o.v + (o.fee ? `（${T.yen(o.fee)}）` : '')).join('／') + (opts.length > 6 ? ` ほか${opts.length - 6}` : '') : f.type === 'consent' ? f.text || '' : f.help || '';
          return html`<li class="fb-item ${f.hidden ? 'is-hidden' : ''} ${f.type === 'heading' ? 'is-heading' : ''}">
            <span class="fb-no">${i + 1}</span>
            <div class="fb-main">
              <div class="fb-title"><b>${f.label}</b>
                <span class="chip">${TYPE_LABEL[f.type] || f.type}</span>
                ${f.required ? html`<span class="chip bad">必須</span>` : ''}
                ${f.core ? html`<span class="chip pri" title="受付・名札・集計で使うので、消せません">${icon('lock')} システムで使う</span>` : ''}
                ${f.hidden ? html`<span class="chip warn">隠す</span>` : ''}
              </div>
              ${sum ? html`<div class="fb-sum small muted">${sum}</div>` : ''}
            </div>
            <div class="fb-acts">
              <button class="icon-btn" data-act="up" data-i="${i}" ${i === 0 ? T.raw('disabled') : ''} aria-label="上へ" title="上へ">↑</button>
              <button class="icon-btn" data-act="down" data-i="${i}" ${i === fields.length - 1 ? T.raw('disabled') : ''} aria-label="下へ" title="下へ">↓</button>
              ${f.core ? '' : html`<button class="btn sm ghost fb-hide" data-act="hide" data-i="${i}" title="${f.hidden ? '公開の申込ページに出す' : '公開の申込ページに出さない'}">${f.hidden ? '出す' : '隠す'}</button>`}
              <button class="icon-btn" data-act="edit" data-i="${i}" aria-label="直す" title="直す">${icon('edit')}</button>
              ${f.core ? '' : html`<button class="icon-btn danger-ic" data-act="del" data-i="${i}" aria-label="削除" title="削除">${icon('trash')}</button>`}
            </div>
          </li>`;
        })}</ol>
        <p class="help">「隠す」にした項目は、公開の申込ページに出ません（前の答えは残ります）。金額のある選択肢は、参加費の合計に足されます。</p>
      </section>
      <section class="fb-preview card">
        <div class="card-head"><h3>公開の見え方（見本）</h3><span class="spacer"></span><a class="btn sm ghost" href="#/apply" target="_blank" rel="noopener">${icon('external')} 開く</a></div>
        ${ev.form.lead ? html`<p class="small muted">${T.text(ev.form.lead)}</p>` : ''}
        <form class="fb-form" onsubmit="return false" aria-label="申込フォームの見本">${T.formHtml(fields)}</form>
        <div class="fb-fee-box"><div class="fb-fee-title small muted">参加費（見本で選んだもの）</div><div id="fb-fee"></div></div>
      </section>
    </div>`;
  }

  function settingsTab(ev) {
    const i = ev.info;
    const n = T.active(ev).length;
    const cap = Number(i.capacity) || 0;
    const tpls = [['', '（送らない）'], ...ev.templates.map((t) => [t.id, t.name])];
    return html`<div class="grid2 fb-settings">
      <form class="card" data-form="settings">
        <div class="card-head"><h3>申込の期間・定員・文</h3><span class="spacer"></span>${status(ev)}</div>
        ${T.fieldsHtml([
          { k: 'applyOpen', label: '受付の開始', type: 'date' },
          { k: 'applyClose', label: '受付の締切', type: 'date' },
          { k: 'capacity', label: '定員（人）', type: 'number', help: '0 か空なら、定員なし。定員に達すると、申込ページは「満員」になります。' },
          { k: 'confirmTemplate', label: '申込のあとに自動で送るメール', type: 'select', options: tpls, help: '「テンプレート」の画面で中身を直せます。' },
          { k: 'lead', label: 'フォームの上の説明', type: 'textarea', rows: 3 },
          { k: 'doneMessage', label: '申込が終わったときの文', type: 'textarea', rows: 3 },
        ], { applyOpen: i.applyOpen, applyClose: i.applyClose, capacity: i.capacity, confirmTemplate: ev.form.confirmTemplate || '', lead: ev.form.lead, doneMessage: ev.form.doneMessage })}
        <div class="row end" style="margin-top:14px"><button class="btn primary">${icon('check')} 保存する</button></div>
      </form>
      <div class="stack">
        <section class="card">
          <div class="card-head"><h3>申込の数</h3></div>
          <div class="kpi-line"><span class="stat-value">${T.num(n)}</span><span class="muted">人${cap ? ` ／ 定員 ${T.num(cap)} 人` : '（定員なし）'}</span></div>
          ${cap ? html`<div class="bar" style="margin-top:8px" title="${T.pct(n, cap)}"><span style="width:${Math.min(100, Math.round((n / cap) * 100))}%"></span></div><p class="small muted" style="margin:6px 0 0">定員の ${T.pct(n, cap)}（取消を除く）</p>` : ''}
        </section>
        <section class="card">
          <div class="card-head"><h3>公開の申込ページ</h3></div>
          <div class="fb-share">
            <button class="fb-qr-mini" data-act="qr" aria-label="QRコードを大きく出す">${T.raw(T.qrSvg(applyUrl(), { label: '申込ページのQRコード' }))}</button>
            <div class="stack s8" style="min-width:0">
              <p class="mono small fb-url">${applyUrl()}</p>
              <div class="row">
                <a class="btn sm" href="#/apply" target="_blank" rel="noopener">${icon('external')} 開く</a>
                <button class="btn sm" data-act="copy" data-text="${applyUrl()}" data-msg="申込ページのURLをコピーしました">${icon('copy')} URLをコピー</button>
                <button class="btn sm" data-act="qr">${icon('qr')} QRを大きく</button>
              </div>
              <p class="help">チラシ・案内文書に、このQRを入れると、スマホからすぐ申し込めます。本番のURL（公開サイトのアドレス）は「大会の設定」で決めます。</p>
            </div>
          </div>
        </section>
      </div>
    </div>`;
  }

  /* ── 項目を直す窓 ── */
  function optRow(o, ev, fid) {
    const n = o.orig && fid ? chose(ev, fid, o.orig) : 0;
    return html`<div class="opt-row" data-orig="${o.orig || ''}" data-n="${n}">
      <input type="text" class="opt-v" value="${o.v}" placeholder="選択肢" aria-label="選択肢の文字">
      <input type="number" class="opt-f" value="${o.fee || ''}" placeholder="金額" min="0" step="100" aria-label="金額（円）">
      <span class="opt-btns">
        <button type="button" class="icon-btn" data-op="oup" aria-label="上へ">↑</button>
        <button type="button" class="icon-btn" data-op="odown" aria-label="下へ">↓</button>
        <button type="button" class="icon-btn danger-ic" data-op="odel" aria-label="この選択肢を消す">${icon('trash')}</button>
      </span>
      ${n ? html`<p class="opt-warn small hidden"></p>` : ''}
    </div>`;
  }

  async function editField(idx, newType) {
    const ev = T.ev();
    const isNew = idx == null;
    const f = isNew ? { id: T.uid('f'), type: newType || 'text', label: '', required: false } : ev.form.fields[idx];
    const typeOpts = T.FIELD_TYPES.filter(([k]) => !f.core || k === f.type || (HAS_OPTS.includes(f.type) && HAS_OPTS.includes(k)));
    const body = html`<form class="fe-form" onsubmit="return false">
      ${f.core ? html`<p class="note small">${icon('lock')} この項目は、受付・名札・集計で使うので、消したり、種類を大きく変えたりはできません（ラベル・説明・選択肢は直せます）。</p>` : ''}
      <div class="fgrid">
        <div class="field full"><label class="flabel" for="fe-label">ラベル<span class="req">必須</span></label><input id="fe-label" name="label" value="${f.label}" required></div>
        <div class="field"><label class="flabel" for="fe-type">種類</label><select id="fe-type" name="type">${typeOpts.map(([k, l]) => html`<option value="${k}" ${k === f.type ? T.raw('selected') : ''}>${l}</option>`)}</select></div>
        <div class="field" data-show="input"><label class="flabel">&nbsp;</label><label class="check"><input type="checkbox" name="required" ${f.required ? T.raw('checked') : ''}> <span>必須にする</span></label></div>
        <div class="field full" data-show="input"><label class="flabel" for="fe-help">説明（入力欄の下に小さく出る）</label><input id="fe-help" name="help" value="${f.help || ''}"></div>
        <div class="field" data-show="text"><label class="flabel" for="fe-ph">入力例（うすく出る字）</label><input id="fe-ph" name="placeholder" value="${f.placeholder || ''}"></div>
        <div class="field" data-show="opts"><label class="flabel" for="fe-short">短い名前</label><input id="fe-short" name="short" value="${f.short || ''}" placeholder="例：弁当"><p class="help">参加費の内訳に「弁当：8/5（木）」のように出ます。</p></div>
        <div class="field full" data-show="consent"><label class="flabel" for="fe-text">同意の文</label><textarea id="fe-text" name="text" rows="3">${f.text || ''}</textarea></div>
      </div>
      <div class="opt-box" data-show="opts">
        <div class="row between"><b class="small">選択肢と金額</b><span class="help" style="margin:0">金額は参加費に足されます（空なら 0 円）</span></div>
        <div class="opt-list">${(f.options || []).map((o) => optRow({ v: o.v, fee: o.fee, orig: o.v }, ev, isNew ? null : f.id))}</div>
        <div class="row"><button type="button" class="btn sm" data-op="oadd">${icon('plus')} 選択肢を足す</button><button type="button" class="btn sm ghost" data-op="obulk">まとめて入れる</button></div>
        <div class="opt-rename note warn small hidden"></div>
      </div>
    </form>`;
    let out = null;
    const v = await T.modal({
      title: isNew ? '項目を足す' : '項目を直す', wide: true, body: String(body),
      actions: [{ label: 'やめる', value: 'cancel' }, { label: isNew ? '足す' : '保存する', kind: 'primary', value: 'save' }],
      onOpen(wrap) {
        const form = wrap.querySelector('form');
        const typeSel = form.querySelector('[name=type]');
        const list = form.querySelector('.opt-list');
        const sync = () => {
          const t = typeSel.value;
          form.querySelectorAll('[data-show]').forEach((el) => {
            const k = el.dataset.show;
            const on = k === 'input' ? t !== 'heading' : k === 'text' ? ['text', 'email', 'tel', 'number', 'textarea'].includes(t) : k === 'opts' ? HAS_OPTS.includes(t) : k === 'consent' ? t === 'consent' : true;
            el.classList.toggle('hidden', !on);
          });
          if (HAS_OPTS.includes(t) && !list.children.length) list.insertAdjacentHTML('beforeend', String(optRow({ v: '' }, ev, null)));
          renameCheck();
        };
        // 申込者が選んでいる選択肢の文字を変えた・消したときの注意
        const renameCheck = () => {
          let renamed = 0, removed = 0;
          list.querySelectorAll('.opt-row').forEach((row) => {
            const n = Number(row.dataset.n) || 0;
            const w = row.querySelector('.opt-warn');
            const changed = row.dataset.orig && row.querySelector('.opt-v').value.trim() !== row.dataset.orig;
            if (w) { w.classList.toggle('hidden', !changed); w.textContent = `「${row.dataset.orig}」を選んだ人が ${n} 人います。文字を変えると、前の申込と合わなくなります。`; }
            if (changed) renamed += n;
          });
          const kept = new Set([...list.querySelectorAll('.opt-row')].map((r) => r.dataset.orig).filter(Boolean));
          const gone = (wrap.removedOrigs || []).filter((o) => !kept.has(o));
          removed = gone.reduce((s, o) => s + (isNew ? 0 : chose(ev, f.id, o)), 0);
          const box = form.querySelector('.opt-rename');
          const show = HAS_OPTS.includes(typeSel.value) && (renamed || removed);
          box.classList.toggle('hidden', !show);
          if (show) {
            const was = box.querySelector('input') ? box.querySelector('input').checked : true;
            box.innerHTML = String(html`${renamed ? html`<label class="check"><input type="checkbox" name="rewrite" ${was ? T.raw('checked') : ''}> <span>前の申込の答えも、新しい文字に書きかえる（${renamed} 人ぶん）</span></label>` : ''}${removed ? html`<p style="margin:4px 0 0">消す選択肢を選んだ人が ${removed} 人います。その人の答えは、そのまま残ります。</p>` : ''}`);
          }
        };
        typeSel.addEventListener('change', sync);
        list.addEventListener('input', renameCheck);
        wrap.addEventListener('click', async (e) => {
          const b = e.target.closest('[data-op]');
          if (!b) return;
          const row = b.closest('.opt-row');
          if (b.dataset.op === 'oadd') { list.insertAdjacentHTML('beforeend', String(optRow({ v: '' }, ev, null))); list.lastElementChild.querySelector('input').focus(); }
          if (b.dataset.op === 'odel' && row) { if (row.dataset.orig) (wrap.removedOrigs = wrap.removedOrigs || []).push(row.dataset.orig); row.remove(); }
          if (b.dataset.op === 'oup' && row && row.previousElementSibling) row.parentNode.insertBefore(row, row.previousElementSibling);
          if (b.dataset.op === 'odown' && row && row.nextElementSibling) row.parentNode.insertBefore(row.nextElementSibling, row);
          if (b.dataset.op === 'obulk') {
            const ta = document.createElement('div');
            ta.className = 'opt-bulk';
            ta.innerHTML = String(html`<label class="flabel" for="fe-bulk">1行に1つ（金額は「,」のあとに。例：8/5（木）,1000）</label><textarea id="fe-bulk" rows="5"></textarea><div class="row end" style="margin-top:6px"><button type="button" class="btn sm primary" data-op="obulkok">足す</button></div>`);
            if (!form.querySelector('.opt-bulk')) b.closest('.row').after(ta);
            ta.querySelector('textarea').focus();
          }
          if (b.dataset.op === 'obulkok') {
            const tx = form.querySelector('#fe-bulk').value.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
            for (const line of tx) { const m = line.match(/^(.*?)[,，、\t]\s*(\d+)\s*円?$/); list.insertAdjacentHTML('beforeend', String(optRow(m ? { v: m[1].trim(), fee: Number(m[2]) } : { v: line }, ev, null))); }
            [...list.querySelectorAll('.opt-row')].forEach((r) => { if (!r.querySelector('.opt-v').value.trim() && !r.dataset.orig && list.children.length > 1) r.remove(); });
            form.querySelector('.opt-bulk').remove();
          }
          renameCheck();
        });
        sync();
      },
      validate(val, wrap) {
        if (val !== 'save') return true;
        const form = wrap.querySelector('form');
        const label = form.querySelector('[name=label]').value.trim();
        if (!label) { T.toast('ラベルを入れてください', 'bad'); form.querySelector('[name=label]').focus(); return false; }
        const type = form.querySelector('[name=type]').value;
        const rows = [...form.querySelectorAll('.opt-row')].map((r) => ({ v: r.querySelector('.opt-v').value.trim(), fee: Number(r.querySelector('.opt-f').value) || 0, orig: r.dataset.orig }));
        const opts = rows.filter((o) => o.v);
        if (HAS_OPTS.includes(type)) {
          if (!opts.length) { T.toast('選択肢を1つ以上入れてください', 'bad'); return false; }
          const dup = opts.map((o) => o.v).find((x, k, a) => a.indexOf(x) !== k);
          if (dup) { T.toast(`選択肢「${dup}」が2つあります`, 'bad'); return false; }
        }
        const rw = form.querySelector('[name=rewrite]');
        out = {
          label, type,
          required: !!(form.querySelector('[name=required]') || {}).checked,
          help: form.querySelector('[name=help]').value.trim(),
          placeholder: form.querySelector('[name=placeholder]').value.trim(),
          short: form.querySelector('[name=short]').value.trim(),
          text: form.querySelector('[name=text]').value.trim(),
          opts, rewrite: !!(rw && rw.checked),
        };
        return true;
      },
    });
    if (v !== 'save' || !out) return;
    const nf = Object.assign({}, f, { label: out.label, type: f.core && !HAS_OPTS.includes(f.type) ? f.type : out.type, required: out.type === 'heading' ? false : out.required });
    for (const k of ['help', 'placeholder', 'short', 'text']) { if (out[k]) nf[k] = out[k]; else delete nf[k]; }
    if (HAS_OPTS.includes(nf.type)) {
      nf.options = out.opts.map((o) => (o.fee ? { v: o.v, fee: o.fee } : { v: o.v }));
      if (out.rewrite && !isNew) {
        const map = new Map(out.opts.filter((o) => o.orig && o.orig !== o.v).map((o) => [o.orig, o.v]));
        let n = 0;
        for (const p of ev.people) {
          const a = p.a ? p.a[f.id] : undefined;
          if (Array.isArray(a)) { if (a.some((x) => map.has(x))) { p.a[f.id] = a.map((x) => (map.has(x) ? map.get(x) : x)); n++; } }
          else if (map.has(a)) { p.a[f.id] = map.get(a); n++; }
        }
        if (n) T.toast(`${n} 人の答えを書きかえました`);
      }
    } else delete nf.options;
    if (nf.type !== 'consent') delete nf.text;
    if (isNew) {
      const fs = ev.form.fields;
      const last = fs[fs.length - 1];
      if (last && last.type === 'consent') fs.splice(fs.length - 1, 0, nf); else fs.push(nf);
      T.logIt(`申込フォームに項目「${nf.label}」を足しました`, T.who());
    } else {
      ev.form.fields[idx] = nf;
      T.logIt(`申込フォームの項目「${nf.label}」を直しました`, T.who());
    }
    T.save(); T.refresh();
    T.toast(isNew ? '項目を足しました' : '保存しました');
  }

  async function addField() {
    // 種類を先に選ぶ
    const v = await T.modal({
      title: '項目を足す', body: String(html`<p class="lead">どんな項目にしますか。</p><div class="fe-types">${T.FIELD_TYPES.map(([k, l]) => html`<button class="btn" data-value="${k}">${l}</button>`)}</div>`),
      onOpen(wrap) { wrap.querySelectorAll('.fe-types [data-value]').forEach((b) => b.addEventListener('click', () => wrap.closeWith(b.dataset.value))); },
    });
    if (v) editField(null, v);
  }

  T.page('admin', 'form', {
    title: '申込フォーム', icon: 'form', group: '参加者', order: 10,
    lead: '公開サイトの「参加申込」に出る項目を作ります。選択肢に金額をつけると、参加費が自動で計算されます。',
    head() { return html`<a class="btn" href="#/apply" target="_blank" rel="noopener">${icon('external')} 公開の申込ページ</a><button class="btn" data-act="qr">${icon('qr')} QR</button>`; },
    render() {
      const ev = T.ev();
      const tab = ui().tab;
      return html`<div class="tabs" role="tablist">
          <button class="tab" role="tab" aria-selected="${tab === 'fields'}" data-act="tab" data-tab="fields">項目と見本</button>
          <button class="tab" role="tab" aria-selected="${tab === 'settings'}" data-act="tab" data-tab="settings">期間・定員・公開</button>
        </div>
        ${tab === 'settings' ? settingsTab(ev) : fieldsTab(ev)}`;
    },
    mount(root) {
      const form = root.querySelector('.fb-form');
      const out = root.querySelector('#fb-fee');
      if (form && out) T.bindFee(form, T.ev().form.fields, out);
    },
    acts: {
      tab(el) { ui().tab = el.dataset.tab; T.refresh(); },
      add() { addField(); },
      edit(el) { editField(Number(el.dataset.i)); },
      up(el) { const fs = T.ev().form.fields, i = Number(el.dataset.i); if (i > 0) { [fs[i - 1], fs[i]] = [fs[i], fs[i - 1]]; T.save(); T.refresh(); } },
      down(el) { const fs = T.ev().form.fields, i = Number(el.dataset.i); if (i < fs.length - 1) { [fs[i + 1], fs[i]] = [fs[i], fs[i + 1]]; T.save(); T.refresh(); } },
      hide(el) {
        const f = T.ev().form.fields[Number(el.dataset.i)];
        if (!f || f.core) return;
        f.hidden = !f.hidden;
        T.logIt(`申込フォームの項目「${f.label}」を${f.hidden ? '隠しました' : '出しました'}`, T.who());
        T.save(); T.refresh();
      },
      async del(el) {
        const ev = T.ev(), i = Number(el.dataset.i), f = ev.form.fields[i];
        if (!f || f.core) return;
        const n = ev.people.filter((p) => { const a = p.a && p.a[f.id]; return Array.isArray(a) ? a.length : a != null && a !== '' && a !== false; }).length;
        if (!(await T.confirm(`項目「${f.label}」を消します。${n ? `この項目に答えた人が ${n} 人います（答えはデータに残りますが、画面には出なくなります）。` : ''}よろしいですか？${f.type !== 'heading' ? '（残しておきたいときは「隠す」が使えます）' : ''}`, { danger: true, ok: '消す' }))) return;
        ev.form.fields.splice(i, 1);
        T.logIt(`申込フォームの項目「${f.label}」を消しました`, T.who());
        T.save(); T.refresh();
      },
      qr() {
        const url = applyUrl();
        T.modal({
          title: '申込ページのQRコード', cls: 'qr-modal',
          body: String(html`<div class="qr-big">${T.raw(T.qrSvg(url, { label: '申込ページのQRコード', level: 'Q' }))}</div><p class="center"><b>${T.eventTitle()}</b><br>参加申込はこちら</p><p class="mono small center fb-url">${url}</p>`),
          actions: [{ label: '閉じる', value: 'cancel' }],
        });
      },
    },
    forms: {
      settings(v) {
        const ev = T.ev();
        if (v.applyOpen && v.applyClose && v.applyOpen > v.applyClose) { T.toast('締切が開始より前になっています', 'bad'); return; }
        ev.info.applyOpen = v.applyOpen || '';
        ev.info.applyClose = v.applyClose || '';
        ev.info.capacity = v.capacity === '' ? '' : Math.max(0, Number(v.capacity) || 0);
        ev.form.confirmTemplate = v.confirmTemplate || '';
        ev.form.lead = v.lead || '';
        ev.form.doneMessage = v.doneMessage || '';
        T.logIt('申込の期間・定員・文を直しました', T.who());
        T.save(); T.refresh();
        T.toast('保存しました');
      },
    },
  });
})();
