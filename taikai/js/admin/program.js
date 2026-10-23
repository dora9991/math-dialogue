/* 管理画面：プログラム・分科会
   ・日程   ev.program.days … [{id, date, label, items:[{id, start, end, title, kind, place, who, note}]}]（items は時刻順に保つ）
   ・分科会 ev.sections     … [{id, bu, no, theme, room, chair, talks:[{id, time, title, presenter, school, abstract}]}]
   公開サイトでは #/program（日程）と #/sections（分科会）に出る。 */
(function () {
  'use strict';
  const { html, icon } = T;

  const BU_DEFAULT = ['小学校部会', '中学校部会', '高等学校部会', '高専・大学部会'];
  const st = () => T.uiState('program', { tab: 'days' });
  const kindOf = (k) => (T.KINDS[k] ? k : 'info');
  const move = (list, i, d) => { const j = i + d; if (j < 0 || j >= list.length) return false; const [x] = list.splice(i, 1); list.splice(j, 0, x); return true; };
  const byTime = (a, b) => String(a.start || '').localeCompare(String(b.start || '')) || String(a.end || '').localeCompare(String(b.end || ''));
  // 申込フォームの分科会の選択肢（sample.js と同じ形）
  T.sectionLabel = (s) => `${String(s.bu || '').replace('部会', '')} ${s.no || ''}（${s.theme || ''}）`;
  const buList = (ev) => {
    const f = ev.form.fields.find((x) => x.id === 'bu');
    const out = [];
    for (const v of [...(f && f.options ? f.options.map((o) => o.v) : []), ...ev.sections.map((s) => s.bu), ...BU_DEFAULT]) if (v && !out.includes(v)) out.push(v);
    return out;
  };
  const syncState = (ev) => {
    const f = ev.form.fields.find((x) => x.id === 'section');
    const want = ev.sections.map(T.sectionLabel);
    const have = f ? (f.options || []).map((o) => o.v) : [];
    return { f, want, have, same: !!f && want.length === have.length && want.every((v, i) => v === have[i]) };
  };

  /* ── 日程 ── */
  const dayFields = [
    { k: 'date', label: '日付', type: 'date', required: true },
    { k: 'label', label: 'この日の名前', placeholder: '研究大会 1日目', help: '公開サイトのタブや、冊子の見出しに出ます。' },
  ];
  const itemFields = () => [
    { k: 'start', label: 'はじまり', type: 'time', required: true },
    { k: 'end', label: 'おわり', type: 'time' },
    { k: 'title', label: '内容', required: true, full: true, placeholder: '基調講演「…」' },
    { k: 'kind', label: '種類', type: 'select', options: Object.entries(T.KINDS), help: '色分けに使います。' },
    { k: 'place', label: '場所', placeholder: '全体会会場' },
    { k: 'who', label: '講師・担当', placeholder: '講師：…' },
    { k: 'note', label: 'ひとこと', full: true, placeholder: 'ライブ配信あり など' },
  ];
  const checkTime = (v) => { if (v.end && v.start && v.end < v.start) { T.toast('おわりの時刻が、はじまりより前です', 'bad'); return false; } return true; };

  function daysView(ev) {
    const days = ev.program.days;
    if (!days.length) return html`<div class="empty">${icon('calendar')} まだ日程がありません。右上の「日を足す」から始めます。</div>`;
    return html`<div class="pg-days">${days.map((d, i) => {
      const items = (d.items || []).slice().sort(byTime);
      return html`<section class="card pg-day">
        <header class="pg-day-head">
          <div class="pg-day-date"><span class="pg-day-no">DAY ${i + 1}</span><b>${T.dateJa(d.date)}</b><span class="muted">${d.label || ''}</span></div>
          <div class="row tight">
            <button class="icon-btn" data-act="dayMove" data-i="${i}" data-d="-1" title="前へ" aria-label="前へ" ${i === 0 ? T.raw('disabled') : ''}>↑</button>
            <button class="icon-btn" data-act="dayMove" data-i="${i}" data-d="1" title="後へ" aria-label="後へ" ${i === days.length - 1 ? T.raw('disabled') : ''}>↓</button>
            <button class="btn sm ghost" data-act="dayEdit" data-id="${d.id}">${icon('edit')} 直す</button>
            <button class="btn sm" data-act="itemAdd" data-day="${d.id}">${icon('plus')} 項目を足す</button>
          </div>
        </header>
        ${items.length ? html`<ol class="pg-tl">${items.map((it) => html`<li class="pg-tl-item">
          <div class="pg-tl-time num"><b>${it.start || ''}</b>${it.end ? html`<span>${it.end}</span>` : ''}</div>
          <div class="pg-tl-dot k-${kindOf(it.kind)}" aria-hidden="true"></div>
          <button class="pg-tl-body" data-act="itemEdit" data-day="${d.id}" data-id="${it.id}" title="押すと直せます">
            <span class="kchip k-${kindOf(it.kind)}">${T.KINDS[kindOf(it.kind)]}</span>
            <span class="pg-tl-title">${it.title}</span>
            ${it.place || it.who || it.note ? html`<span class="pg-tl-meta">${it.place ? html`<span>${icon('pin')} ${it.place}</span>` : ''}${it.who ? html`<span>${icon('user')} ${it.who}</span>` : ''}${it.note ? html`<span>${icon('spark')} ${it.note}</span>` : ''}</span>` : ''}
          </button>
        </li>`)}</ol>` : html`<p class="muted small" style="margin:6px 0 0">この日の項目はまだありません。</p>`}
      </section>`;
    })}</div>`;
  }

  /* ── 分科会 ── */
  const secFields = (ev) => [
    { k: 'bu', label: '部会', type: 'select', options: buList(ev), required: true },
    { k: 'no', label: '分科会の番号・名前', placeholder: '第1分科会', required: true },
    { k: 'theme', label: 'テーマ', placeholder: '数と式', required: true },
    { k: 'room', label: '会場（教室）', placeholder: '致遠館 中学棟 2階 1-1教室' },
    { k: 'chair', label: '司会・助言者', full: true },
  ];
  const talkFields = [
    { k: 'time', label: '時刻', type: 'time' },
    { k: 'title', label: '発表の題名', required: true, full: true },
    { k: 'presenter', label: '発表者' },
    { k: 'school', label: '所属' },
    { k: 'abstract', label: '要旨', type: 'textarea', rows: 4, help: '冊子と公開サイトの分科会のページに出ます。' },
  ];

  function sectionsView(ev) {
    const s = syncState(ev);
    const bus = buList(ev).filter((b) => ev.sections.some((x) => x.bu === b));
    const talks = T.sum(ev.sections, (x) => (x.talks || []).length);
    return html`
      <div class="note ${s.same ? 'ok' : 'warn'} pg-sync">
        <div>${s.same
          ? html`<b>申込フォームの「分科会」の選択肢は、この一覧と同じです。</b>`
          : html`<b>申込フォームの「分科会」の選択肢が、この一覧とちがいます。</b> ${s.f ? html`<span class="small">（フォーム ${s.have.length}件・この一覧 ${s.want.length}件）</span>` : html`<span class="small">（フォームに分科会の項目がありません）</span>`}`}</div>
        <button class="btn sm ${s.same ? '' : 'primary'}" data-act="syncForm">${icon('swap')} 申込フォームの分科会の選択肢を、この一覧に合わせる</button>
      </div>
      <p class="muted small">分科会 ${ev.sections.length}・発表 ${talks}件</p>
      ${!ev.sections.length ? html`<div class="empty">${icon('users')} まだ分科会がありません。右上の「分科会を足す」から始めます。</div>` : ''}
      ${bus.map((bu) => html`<h2 class="section-title">${icon('flag')} ${bu}</h2>
        <div class="pg-secs">${ev.sections.filter((x) => x.bu === bu).map((sec) => {
          const i = ev.sections.indexOf(sec);
          return html`<article class="card pg-sec">
            <header class="pg-sec-head">
              <div class="pg-sec-ttl"><span class="chip pri">${sec.no}</span><h3>${sec.theme}</h3></div>
              <div class="row tight">
                <button class="icon-btn" data-act="secMove" data-i="${i}" data-d="-1" title="前へ" aria-label="前へ">↑</button>
                <button class="icon-btn" data-act="secMove" data-i="${i}" data-d="1" title="後へ" aria-label="後へ">↓</button>
                <button class="btn sm ghost" data-act="secEdit" data-id="${sec.id}">${icon('edit')} 直す</button>
              </div>
            </header>
            <div class="pg-sec-meta">${sec.room ? html`<span>${icon('pin')} ${sec.room}</span>` : ''}${sec.chair ? html`<span>${icon('user')} ${sec.chair}</span>` : ''}</div>
            ${(sec.talks || []).length ? html`<ol class="pg-talks">${sec.talks.map((t, k) => html`<li class="pg-talk">
              <span class="pg-talk-time num">${t.time || '—'}</span>
              <div class="pg-talk-main"><b>${t.title}</b><span class="muted small">${[t.presenter, t.school].filter(Boolean).join('（') + (t.presenter && t.school ? '）' : '')}</span></div>
              <div class="row tight pg-talk-act">
                <button class="icon-btn" data-act="talkMove" data-sec="${sec.id}" data-id="${t.id}" data-d="-1" title="前へ" aria-label="前へ" ${k === 0 ? T.raw('disabled') : ''}>↑</button>
                <button class="icon-btn" data-act="talkMove" data-sec="${sec.id}" data-id="${t.id}" data-d="1" title="後へ" aria-label="後へ" ${k === sec.talks.length - 1 ? T.raw('disabled') : ''}>↓</button>
                <button class="icon-btn" data-act="talkEdit" data-sec="${sec.id}" data-id="${t.id}" title="直す" aria-label="直す">${icon('edit')}</button>
              </div>
            </li>`)}</ol>` : html`<p class="muted small" style="margin:4px 0 8px">発表はまだありません。</p>`}
            <button class="btn sm" data-act="talkAdd" data-sec="${sec.id}">${icon('plus')} 発表を足す</button>
          </article>`;
        })}</div>`)}`;
  }

  T.page('admin', 'program', {
    title: 'プログラム・分科会', nav: 'プログラム', icon: 'calendar', group: '大会', order: 20,
    lead: '日程と分科会の内容。公開サイトの「プログラム」「分科会」と、大会冊子に出ます。',
    head() {
      return st().tab === 'days'
        ? html`<a class="btn ghost" href="#/program" target="_blank" rel="noopener">${icon('eye')} 公開サイトで見る</a><button class="btn primary" data-act="dayAdd">${icon('plus')} 日を足す</button>`
        : html`<a class="btn ghost" href="#/sections" target="_blank" rel="noopener">${icon('eye')} 公開サイトで見る</a><button class="btn primary" data-act="secAdd">${icon('plus')} 分科会を足す</button>`;
    },
    render() {
      const ev = T.ev();
      const s = st();
      const nItems = T.sum(ev.program.days, (d) => (d.items || []).length);
      return html`<div class="tabs" role="tablist">
          <button class="tab" role="tab" aria-selected="${s.tab === 'days'}" data-act="tab" data-tab="days">日程（${ev.program.days.length}日・${nItems}項目）</button>
          <button class="tab" role="tab" aria-selected="${s.tab === 'sections'}" data-act="tab" data-tab="sections">分科会（${ev.sections.length}）</button>
        </div>
        ${s.tab === 'days' ? daysView(ev) : sectionsView(ev)}`;
    },
    acts: {
      tab(el) { st().tab = el.dataset.tab; T.refresh(); },

      /* 日 */
      dayAdd() {
        const ev = T.ev();
        const last = ev.program.days[ev.program.days.length - 1];
        let date = ev.info.start || T.today();
        if (last && last.date) { const d = new Date(last.date + 'T00:00:00'); d.setDate(d.getDate() + 1); date = T.ymd(d); }
        T.editRecord({
          title: '日を足す', fields: dayFields, value: { date, label: '' },
          onSave(v) { ev.program.days.push({ id: T.uid('d'), date: v.date, label: v.label, items: [] }); T.logIt(`プログラムに ${T.md(v.date)} を追加`, T.who()); T.save(); T.refresh(); T.toast('日を足しました'); },
        });
      },
      dayEdit(el) {
        const ev = T.ev();
        const d = T.find(ev.program.days, el.dataset.id);
        if (!d) return;
        T.editRecord({
          title: T.dateJa(d.date) + ' を直す', fields: dayFields, value: d,
          lead: (d.items || []).length ? `削除すると、この日の項目（${d.items.length}件）も消えます。` : '',
          onSave(v) { Object.assign(d, v); T.save(); T.refresh(); T.toast('直しました'); },
          onDelete() { T.removeFrom(ev.program.days, d.id); T.logIt(`プログラムから ${T.md(d.date)} を削除`, T.who()); T.save(); T.refresh(); T.toast('削除しました'); },
        });
      },
      dayMove(el) { const ev = T.ev(); if (move(ev.program.days, Number(el.dataset.i), Number(el.dataset.d))) { T.save(); T.refresh(); } },

      /* 項目 */
      itemAdd(el) {
        const ev = T.ev();
        const d = T.find(ev.program.days, el.dataset.day);
        if (!d) return;
        const items = (d.items || []).slice().sort(byTime);
        const last = items[items.length - 1];
        T.editRecord({
          title: `${T.md(d.date)} に項目を足す`, wide: true, fields: itemFields(), value: { start: (last && (last.end || last.start)) || '09:00', kind: 'section' }, check: checkTime,
          onSave(v) { d.items = d.items || []; d.items.push(Object.assign({ id: T.uid('p') }, v)); d.items.sort(byTime); T.logIt(`プログラムに「${v.title}」を追加`, T.who()); T.save(); T.refresh(); T.toast('足しました'); },
        });
      },
      itemEdit(el) {
        const ev = T.ev();
        const d = T.find(ev.program.days, el.dataset.day);
        const it = d && T.find(d.items, el.dataset.id);
        if (!it) return;
        T.editRecord({
          title: '項目を直す', wide: true, fields: itemFields(), value: it, check: checkTime,
          onSave(v) { Object.assign(it, v); d.items.sort(byTime); T.save(); T.refresh(); T.toast('直しました'); },
          onDelete() { T.removeFrom(d.items, it.id); T.logIt(`プログラムから「${it.title}」を削除`, T.who()); T.save(); T.refresh(); T.toast('削除しました'); },
        });
      },

      /* 分科会 */
      secAdd() {
        const ev = T.ev();
        const bu = (ev.sections[ev.sections.length - 1] || {}).bu || buList(ev)[0];
        const n = ev.sections.filter((x) => x.bu === bu).length + 1;
        T.editRecord({
          title: '分科会を足す', fields: secFields(ev), value: { bu, no: `第${n}分科会` },
          onSave(v) { ev.sections.push(Object.assign({ id: T.uid('s') }, v, { talks: [] })); T.logIt(`分科会「${v.bu} ${v.no}（${v.theme}）」を追加`, T.who()); T.save(); T.refresh(); T.toast('足しました。申込フォームの選択肢も合わせてください'); },
        });
      },
      secEdit(el) {
        const ev = T.ev();
        const sec = T.find(ev.sections, el.dataset.id);
        if (!sec) return;
        T.editRecord({
          title: `${sec.bu} ${sec.no} を直す`, fields: secFields(ev), value: sec,
          lead: (sec.talks || []).length ? `削除すると、この分科会の発表（${sec.talks.length}件）も消えます。` : '',
          onSave(v) { Object.assign(sec, v); T.save(); T.refresh(); T.toast('直しました'); },
          onDelete() { T.removeFrom(ev.sections, sec.id); T.logIt(`分科会「${sec.bu} ${sec.no}」を削除`, T.who()); T.save(); T.refresh(); T.toast('削除しました'); },
        });
      },
      secMove(el) { const ev = T.ev(); if (move(ev.sections, Number(el.dataset.i), Number(el.dataset.d))) { T.save(); T.refresh(); } },

      /* 発表 */
      talkAdd(el) {
        const ev = T.ev();
        const sec = T.find(ev.sections, el.dataset.sec);
        if (!sec) return;
        T.editRecord({
          title: `${sec.no}（${sec.theme}）に発表を足す`, wide: true, fields: talkFields, value: {},
          onSave(v) { sec.talks = sec.talks || []; sec.talks.push(Object.assign({ id: T.uid('t') }, v)); T.logIt(`発表「${v.title}」を追加`, T.who()); T.save(); T.refresh(); T.toast('足しました'); },
        });
      },
      talkEdit(el) {
        const ev = T.ev();
        const sec = T.find(ev.sections, el.dataset.sec);
        const t = sec && T.find(sec.talks, el.dataset.id);
        if (!t) return;
        T.editRecord({
          title: '発表を直す', wide: true, fields: talkFields, value: t,
          onSave(v) { Object.assign(t, v); T.save(); T.refresh(); T.toast('直しました'); },
          onDelete() { T.removeFrom(sec.talks, t.id); T.save(); T.refresh(); T.toast('削除しました'); },
        });
      },
      talkMove(el) {
        const ev = T.ev();
        const sec = T.find(ev.sections, el.dataset.sec);
        if (!sec) return;
        const i = sec.talks.findIndex((x) => x.id === el.dataset.id);
        if (move(sec.talks, i, Number(el.dataset.d))) { T.save(); T.refresh(); }
      },

      /* 申込フォームの選択肢を合わせる */
      async syncForm() {
        const ev = T.ev();
        const s = syncState(ev);
        if (s.same) return T.toast('もう同じです');
        const removed = s.have.filter((v) => !s.want.includes(v));
        const counts = removed.map((v) => [v, ev.people.filter((p) => p.status !== 'cancel' && p.a && p.a.section === v).length]).filter((x) => x[1] > 0);
        const added = s.want.filter((v) => !s.have.includes(v));
        const lines = [];
        if (added.length) lines.push(`足す選択肢：${added.length}件`);
        if (removed.length) lines.push(`消える選択肢：${removed.length}件`);
        if (counts.length) lines.push('', '消える選択肢を選んでいる人がいます（その人の答えは残りますが、フォームの選択肢からは消えます）：', ...counts.map(([v, n]) => `・${v}　${n}人`));
        if (!s.f) lines.push('申込フォームに「参加したい分科会」の項目を新しく足します。');
        const ok = await T.modal({
          title: '申込フォームの分科会の選択肢を合わせる',
          body: html`<p>申込フォームの「分科会」の選択肢を、この一覧（${s.want.length}件）に合わせます。</p><p class="${counts.length ? 'note warn' : 'muted'}" style="white-space:pre-line">${lines.join('\n')}</p>`.toString(),
          actions: [{ label: 'やめる', value: 'cancel' }, { label: '合わせる', kind: counts.length ? 'danger' : 'primary', value: 'ok' }],
        });
        if (ok !== 'ok') return;
        let f = s.f;
        if (!f) {
          f = { id: 'section', type: 'select', label: '参加したい分科会（第1希望）', options: [] };
          const i = ev.form.fields.findIndex((x) => x.id === 'bu');
          ev.form.fields.splice(i >= 0 ? i + 1 : ev.form.fields.length, 0, f);
        }
        const old = new Map((f.options || []).map((o) => [o.v, o]));
        f.options = s.want.map((v) => Object.assign({}, old.get(v) || {}, { v }));
        T.logIt(`申込フォームの分科会の選択肢を合わせた（${s.want.length}件）`, T.who());
        T.save(); T.refresh(); T.toast('申込フォームの選択肢を合わせました');
      },
    },
  });
})();
