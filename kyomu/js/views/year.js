/* 年間行事：4月〜3月を1枚に（日が縦・月が横）。下に月ごとの授業日数。一覧で探す・直す・まとめて入力も。 */
(function () {
  const K = window.K;
  const u = K.u;
  const m = K.m;
  const V = (K.views = K.views || {});
  const MONTHS = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];
  let mode = 'grid';
  let q = '';
  let kind = '';

  function grid(forPrint) {
    const y = m.st.school.year;
    let html = `<table class="yr" style="width:${forPrint ? '100%' : '1560px'}"><colgroup><col style="width:${forPrint ? '3%' : '28px'}">${MONTHS.map(() => `<col>`).join('')}</colgroup><tr><th></th>${MONTHS.map((mo) => `<th>${mo}月</th>`).join('')}</tr>`;
    for (let dn = 1; dn <= 31; dn++) {
      html += `<tr><td class="dn">${dn}</td>`;
      MONTHS.forEach((mo) => {
        const yy = mo >= 4 ? y : y + 1;
        const d = `${yy}-${u.pad(mo)}-${u.pad(dn)}`;
        const dt = new Date(yy, mo - 1, dn);
        if (dt.getMonth() !== mo - 1) {
          html += `<td class="cell na"></td>`;
          return;
        }
        const day = m.day(d);
        const wd = u.dow(d);
        const evs = day.events.filter((e) => e.inYear !== false && e.kind !== 'staff');
        const cls = wd === 0 ? 'sun' : wd === 6 ? 'sat' : day.hol ? 'hol' : !day.school ? 'off' : '';
        const names = [day.hol].concat(evs.filter((e) => !(e.end && e.end > e.date && d !== e.date)).map((e) => (e.kind === 'event' && e.targets && !e.targets.includes('all') ? `${m.targetLabel(e)}:` : '') + e.title.replace(/\n/g, ' ') + (e.end && e.end > e.date ? `〜${u.md(e.end)}` : ''))).filter(Boolean);
        const title = names.join('／');
        html += `<td class="cell ${cls}" data-d="${d}" title="${u.esc(title)}"><span class="wd ${wd === 0 || day.hol ? 'r' : wd === 6 ? 'b' : ''}">${u.WD[wd]}</span>${forPrint ? u.esc(title) : evs.length || day.hol ? names.map((n, i) => (i < 3 ? `<span${i ? ' class="muted"' : ''}>${u.esc(n)}</span>` : '')).join(' ') : ''}</td>`;
      });
      html += '</tr>';
    }
    // 授業日数
    let total = 0;
    html += `<tr class="tot"><td class="dn">授業<br>日数</td>${MONTHS.map((mo) => {
      const yy = mo >= 4 ? y : y + 1;
      const a = `${yy}-${u.pad(mo)}-01`;
      const b = u.add(`${mo === 12 ? yy + 1 : yy}-${u.pad(mo === 12 ? 1 : mo + 1)}-01`, -1);
      const n = m.schoolDays(a, b);
      total += n;
      return `<td>${n}</td>`;
    }).join('')}</tr></table>`;
    const terms = m.st.terms.map((t) => `${u.esc(t.name)} ${t.start && t.end ? m.schoolDays(t.start, t.end) : 0}日`).join('　');
    html += `<p class="small" style="margin:6px 0 0">授業日数：年間 <b>${total}日</b>　（${terms}）</p>`;
    return html;
  }

  function list() {
    const evs = m.st.events
      .filter((e) => (!kind || e.kind === kind) && (!q || u.norm(e.title + (e.place || '') + (e.who || '')).includes(u.norm(q))))
      .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    const KN = { event: '行事', staff: '職員', holiday: '休業', swap: '振替', short: '短縮' };
    return `<div class="row" style="margin-bottom:8px"><input type="text" data-q value="${u.esc(q)}" placeholder="名前で探す"><select data-kind>
      <option value="">すべての種類</option>${Object.entries(KN).map(([k, t]) => `<option value="${k}" ${kind === k ? 'selected' : ''}>${t}</option>`).join('')}</select>
      <span class="muted small">${evs.length}件</span></div>
      <div style="overflow:auto;max-height:70vh"><table class="cnt" style="width:100%"><tr><th>日付</th><th>種類</th><th>対象</th><th>時間</th><th class="l">名前</th><th>時数</th><th>年</th><th>月</th><th>週</th><th></th></tr>
      ${evs.map((e) => `<tr><td>${u.mdw(e.date)}${e.end ? '〜' + u.md(e.end) : ''}</td><td>${KN[e.kind]}</td><td>${u.esc(m.targetLabel(e))}</td>
        <td>${e.from === 'all' ? '終日' : e.from ? m.slotName(e.from) + (e.to && e.to !== e.from ? '〜' + m.slotName(e.to) : '') : ''}</td>
        <td class="l">${u.esc(e.title.replace(/\n/g, ' '))}${e.place ? '（' + u.esc(e.place) + '）' : ''}${e.who ? ' ／ ' + u.esc(e.who) : ''}</td>
        <td>${e.kind === 'event' && e.from ? u.esc(e.countAs || 'なし') : ''}</td>
        <td>${e.inYear !== false ? '○' : ''}</td><td>${e.inMonth !== false ? '○' : ''}</td><td>${e.inWeek !== false ? '○' : ''}</td>
        <td><button class="btn small" data-ev="${e.id}">直す</button></td></tr>`).join('')}</table></div>`;
  }

  V.year = {
    title: '年間行事',
    render(el) {
      el.innerHTML = `<div class="view">
        <div class="card row">
          <button class="btn ${mode === 'grid' ? 'on' : ''}" data-mode="grid">1年を1枚で</button>
          <button class="btn ${mode === 'list' ? 'on' : ''}" data-mode="list">一覧</button>
          <span style="flex:1"></span>
          <button class="btn" data-act="add">＋行事</button>
          <button class="btn" data-act="bulk">まとめて入力（貼りつけ）</button>
          <button class="btn primary" data-act="print">印刷・PDF</button>
        </div>
        <div class="card">
          <h2>${m.st.school.year}年度　年間行事</h2>
          <p class="help">ここで入れた行事は、月行事・週行事に自動で出ます。<b>学年と校時</b>を入れると、その時間の時間割が自動で行事に置きかわり、時数も数えなおされます。セルをクリックでその日の行事を追加・直す。</p>
          <div style="overflow:auto">${mode === 'grid' ? grid() : list()}</div>
        </div></div>`;
      const root = el.firstElementChild;
      root.addEventListener('click', (e) => {
        const b = e.target.closest('[data-mode]');
        if (b) {
          mode = b.dataset.mode;
          return V.year.render(el);
        }
        const a = e.target.closest('[data-act]');
        if (a && a.dataset.act === 'add') K.ev.open({ date: u.today() });
        if (a && a.dataset.act === 'bulk') K.ev.bulk();
        if (a && a.dataset.act === 'print') K.print.direct({ kind: 'year' });
        const ev = e.target.closest('[data-ev]');
        if (ev) return K.ev.edit(ev.dataset.ev);
        const td = e.target.closest('td.cell[data-d]');
        if (td) dayMenu(td.dataset.d);
      });
      const qi = root.querySelector('[data-q]');
      if (qi)
        qi.addEventListener(
          'input',
          u.debounce(() => {
            q = qi.value;
            V.year.render(el);
            const n = el.querySelector('[data-q]');
            n.focus();
            n.setSelectionRange(n.value.length, n.value.length);
          }, 300)
        );
      const ks = root.querySelector('[data-kind]');
      if (ks)
        ks.addEventListener('change', () => {
          kind = ks.value;
          V.year.render(el);
        });
    },
    printPages() {
      const title = `${m.st.school.name ? m.st.school.name + '　' : ''}${m.st.school.year}年度　年間行事予定`;
      return { pages: [`<div class="page land"><div class="fitbox"><div class="print-doc"><h2 style="text-align:center">${u.esc(title)}</h2>${grid(true)}</div></div></div>`], land: true };
    },
  };

  // その日の行事の一覧と追加
  function dayMenu(d) {
    const day = m.day(d);
    const evs = day.events;
    if (!evs.length) return K.ev.open({ date: d });
    const md = u.modal(`<h3>${u.mdw(d)}${day.hol ? '　' + u.esc(day.hol) : ''}</h3>
      <ul class="logs">${evs.map((e) => `<li><button class="btn small" data-ev="${e.id}">直す</button> ${u.esc(e.title.replace(/\n/g, ' '))} <span class="muted small">${u.esc(m.targetLabel(e))}</span></li>`).join('')}</ul>
      <div class="btns"><button class="btn" data-close>閉じる</button><button class="btn" data-week>この週の週行事を開く</button><button class="btn primary" data-add>＋この日に追加</button></div>`);
    md.el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-ev]');
      if (b) {
        md.close();
        K.ev.edit(b.dataset.ev);
      }
      if (e.target.closest('[data-add]')) {
        md.close();
        K.ev.open({ date: d });
      }
      if (e.target.closest('[data-week]')) {
        md.close();
        K.views.week.go(d);
      }
    });
  }
})();
