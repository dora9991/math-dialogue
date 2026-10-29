/* 月行事：1か月を1日1行で。年間行事と同じデータ（ここで足した行事は、年間・週にも出る）。 */
(function () {
  const K = window.K;
  const u = K.u;
  const m = K.m;
  const V = (K.views = K.views || {});
  let ym = null; // 'YYYY-MM'

  const MONTHS = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];
  const ymOf = (mo) => `${mo >= 4 ? m.st.school.year : m.st.school.year + 1}-${u.pad(mo)}`;

  function evHtml(e, d) {
    const fill = e.kind === 'event' && e.from ? ' fill' : '';
    const tg = e.kind === 'event' || e.kind === 'staff' ? m.targetLabel(e) : '';
    const time = e.from === 'all' ? '終日' : e.from ? `${m.slotName(e.from)}${e.to && e.to !== e.from ? '〜' + m.slotName(e.to) : ''}` : '';
    const cont = e.end && e.end > e.date ? (d === e.date ? `〜${u.md(e.end)}` : '（つづき）') : '';
    return `<span class="evi k-${e.kind}${fill}" data-ev="${e.id}" title="クリックで直す">${tg && tg !== '全校' ? `<span class="tg">${u.esc(tg)}</span>` : ''}${u.esc(e.title.replace(/\n/g, ' '))}${e.place ? `（${u.esc(e.place)}）` : ''}${e.who ? ` ${u.esc(e.who)}` : ''}${time ? ` <span class="tg">${time}</span>` : ''}${cont ? ` <span class="tg">${cont}</span>` : ''}</span>`;
  }

  function monthTable(y, mo, forPrint) {
    const first = `${y}-${u.pad(mo)}-01`;
    const last = u.add(`${mo === 12 ? y + 1 : y}-${u.pad(mo === 12 ? 1 : mo + 1)}-01`, -1);
    let rows = '';
    let days = 0;
    u.range(first, last).forEach((d) => {
      const day = m.day(d);
      const wd = u.dow(d);
      if (day.school) days++;
      const evs = day.events.filter((e) => e.inMonth !== false);
      const stu = evs.filter((e) => e.kind !== 'staff');
      const stf = evs.filter((e) => e.kind === 'staff');
      const cls = [wd === 0 ? 'sun' : wd === 6 ? 'sat' : '', day.hol ? 'hol' : '', !day.school && wd >= 1 && wd <= 5 ? 'off' : '', wd === 0 || wd === 6 ? 'we' : ''].join(' ');
      const wk = wd === 1 || d === first ? m.weekNo(u.monday(d)) : '';
      const note = !day.school && !day.term && !day.hol && wd >= 1 && wd <= 5 ? '休業期間' : '';
      rows += `<tr class="${cls}" data-d="${d}">
        <td class="d">${u.day(d)}</td><td class="w">${u.WD[wd]}</td><td class="wk">${wk ? `第${wk}週` : ''}</td>
        <td class="evs" data-add="event">${day.hol ? `<span class="evi k-holiday">${u.esc(day.hol)}</span>` : ''}${stu.map((e) => evHtml(e, d)).join('')}${note ? `<span class="tg muted">${note}</span>` : ''}</td>
        <td class="evs" data-add="staff">${stf.map((e) => evHtml(e, d)).join('')}</td>
        <td class="w">${day.school ? '○' : ''}</td>
      </tr>`;
    });
    return {
      html: `<table class="mon"><tr><th>日</th><th>曜</th><th>週</th><th>行事</th><th>職員の予定（会議・出張）</th><th>授業日</th></tr>${rows}
        <tr><td colspan="5" style="text-align:right;font-weight:700">授業日数</td><td class="w" style="font-weight:700">${days}</td></tr></table>`,
      days,
    };
  }

  V.month = {
    title: '月行事',
    open(p) {
      if (p && p[0]) ym = p[0];
      if (!ym) {
        const t = u.today();
        ym = t >= m.fyStart() && t <= m.fyEnd() ? t.slice(0, 7) : m.fyStart().slice(0, 7);
      }
    },
    render(el) {
      const [y, mo] = ym.split('-').map(Number);
      const t = monthTable(y, mo);
      el.innerHTML = `<div class="view">
        <div class="card row">
          ${MONTHS.map((x) => `<button class="btn small ${x === mo ? 'on' : ''}" data-mo="${x}">${x}月</button>`).join('')}
          <span style="flex:1"></span>
          <button class="btn" data-act="add">＋行事</button>
          <button class="btn" data-act="bulk">まとめて入力</button>
          <button class="btn primary" data-act="print">印刷・PDF</button>
        </div>
        <div class="card">
          <h2>${y}年${mo}月の行事</h2>
          <p class="help">行のあいているところをクリックで、その日に行事を追加。行事の名前をクリックで直す。<b>■</b> は時間割の枠を埋める行事（学年・校時つき）。ここで直すと年間行事・週行事にも反映されます。</p>
          ${t.html}
        </div></div>`;
      el.firstElementChild.addEventListener('click', (e) => {
        const mb = e.target.closest('[data-mo]');
        if (mb) return K.app.go('month', ymOf(Number(mb.dataset.mo)));
        const a = e.target.closest('[data-act]');
        if (a && a.dataset.act === 'add') K.ev.open({ date: `${ym}-01` });
        if (a && a.dataset.act === 'bulk') K.ev.bulk();
        if (a && a.dataset.act === 'print') K.print.direct({ kind: 'month' });
        const ev = e.target.closest('[data-ev]');
        if (ev) return K.ev.edit(ev.dataset.ev);
        const td = e.target.closest('td[data-add]');
        if (td) K.ev.open({ date: td.parentElement.dataset.d, kind: td.dataset.add });
      });
    },
    printPages() {
      const [y, mo] = ym.split('-').map(Number);
      const t = monthTable(y, mo, true);
      const title = `${m.st.school.name ? m.st.school.name + '　' : ''}${y}年${mo}月　行事予定`;
      return { pages: [`<div class="page a4p-std"><div class="fitbox"><div class="print-doc"><h2 style="text-align:center">${u.esc(title)}</h2>${t.html}</div></div></div>`], land: false };
    },
  };
})();
