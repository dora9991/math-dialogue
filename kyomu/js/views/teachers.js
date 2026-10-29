/* 先生：担当表（どのクラスのどの教科をだれが持つか）と、先生ごとの週の時間割・全員の空き時間。
   担当表を入れると、入れ替えのときに「その先生があいているか」を見て、入れ替えられるコマを光らせる。 */
(function () {
  const K = window.K;
  const u = K.u;
  const m = K.m;
  const V = (K.views = K.views || {});
  const ui = { tab: 'matrix', who: '', mon: null };

  function assignTable() {
    const cls = m.st.classes;
    const used = new Set();
    Object.values(m.st.bases).forEach((b) => Object.values(b.cells).forEach((x) => {
      const sj = m.subject(x.t);
      if (sj && sj.counted) used.add(sj.code);
    }));
    const subs = m.st.subjects.filter((s) => s.counted && s.code !== '行事' && (used.has(s.code) || Object.keys(m.st.teach).some((k) => k.endsWith('|' + s.code))));
    return `<table class="cnt" data-assign><tr><th class="l">教科</th>${cls.map((c) => `<th>${c.id}</th>`).join('')}</tr>
      ${subs.map((s, r) => `<tr><td class="l">${u.esc(s.code)}</td>${cls.map((c, i) => `<td style="padding:1px"><input type="text" data-t="${c.id}|${u.esc(s.code)}" data-rc="${r},${i}" value="${u.esc(m.st.teach[`${c.id}|${s.code}`] || '')}" style="width:74px;padding:2px 4px" list="tnames"></td>`).join('')}</tr>`).join('')}
      </table><datalist id="tnames">${m.allTeachers().map((n) => `<option value="${u.esc(n)}">`).join('')}</datalist>`;
  }

  // 先生ごとの、その週のコマ { d|s: [ {c, t} ] }
  function teacherWeek(name, mon) {
    const out = {};
    for (let i = 0; i < 5; i++) {
      const d = u.add(mon, i);
      const day = m.day(d);
      if (!day.school) continue;
      day.layout.forEach((s) => {
        m.st.classes.forEach((c) => {
          const r = m.cell(d, s, c.id);
          if (m.teachersOf(c.id, r.t).includes(name)) (out[d + '|' + s] = out[d + '|' + s] || []).push({ c: c.id, t: r.t });
        });
      });
    }
    return out;
  }

  function matrix(mon, forPrint) {
    const names = m.allTeachers();
    if (!names.length) return '<p class="help">先に「担当表」に先生の名前を入れてください。</p>';
    const days = [0, 1, 2, 3, 4].map((i) => u.add(mon, i));
    const cols = [];
    days.forEach((d) => {
      const day = m.day(d);
      (day.school ? day.layout : m.st.daySlots[u.dow(d)] || []).forEach((s) => {
        const sl = m.slot(s);
        if (sl && sl.counted) cols.push({ d, s, school: day.school });
      });
    });
    let html = `<table class="cnt" style="font-size:12px"><tr><th class="l" rowspan="2">先生</th>${days.map((d) => `<th colspan="${cols.filter((c) => c.d === d).length}">${u.mdw(d)}</th>`).join('')}<th rowspan="2">コマ数</th></tr>
      <tr>${cols.map((c, i) => `<th class="${i && cols[i - 1].d !== c.d ? 'gsep' : ''}">${u.esc(m.slot(c.s).label)}</th>`).join('')}</tr>`;
    names.forEach((n) => {
      const w = teacherWeek(n, mon);
      let count = 0;
      html += `<tr><td class="l"><a href="#teachers" data-who="${u.esc(n)}">${u.esc(n)}</a></td>${cols
        .map((c, i) => {
          const list = w[c.d + '|' + c.s] || [];
          const abs = m.absent(c.d, c.s).has(n);
          count += list.length ? 1 : 0;
          const bad = list.length > 1 && !list.every((x) => u.key(x.t) === u.key(list[0].t) && (m.subject(x.t) || {}).joint);
          return `<td class="${i && cols[i - 1].d !== c.d ? 'gsep' : ''}${bad || (abs && list.length) ? ' lack' : abs ? ' gap1' : ''}" title="${u.esc(list.map((x) => x.c + ' ' + x.t).join('、'))}${abs ? '（不在）' : ''}">${!c.school ? '<span class="muted">−</span>' : list.length ? u.esc(list.map((x) => x.c).join('・')) : abs ? '不在' : ''}</td>`;
        })
        .join('')}<td>${count}</td></tr>`;
    });
    return html + '</table>';
  }

  function personal(name, mon) {
    if (!name) return '<p class="help">先生を選んでください。</p>';
    const w = teacherWeek(name, mon);
    const days = [0, 1, 2, 3, 4].map((i) => u.add(mon, i));
    const slots = m.st.slots.filter((s) => days.some((d) => (m.day(d).layout || []).includes(s.id)));
    return `<table class="cnt" style="font-size:13px"><tr><th></th>${days.map((d) => `<th>${u.mdw(d)}</th>`).join('')}</tr>
      ${slots.map((s) => `<tr><th>${u.esc(m.slotName(s.id))}</th>${days.map((d) => {
        const day = m.day(d);
        if (!day.school) return `<td class="zero">${u.esc(day.offName || '')}</td>`;
        const list = w[d + '|' + s.id] || [];
        const abs = m.absent(d, s.id).has(name);
        return `<td class="${list.length > 1 ? 'lack' : abs ? 'gap1' : ''}">${list.map((x) => `${x.c} ${u.esc(x.t)}`).join('<br>')}${abs ? '<br><span class="small">不在</span>' : ''}</td>`;
      }).join('')}</tr>`).join('')}</table>`;
  }

  V.teachers = {
    title: '先生',
    render(el) {
      if (!ui.mon) ui.mon = (K.views.week.mon && K.views.week.mon()) || u.monday(u.today());
      const names = m.allTeachers();
      const weeks = m.weeks().filter((w) => w.no);
      el.innerHTML = `<div class="view">
        <div class="card row">
          <button class="btn ${ui.tab === 'matrix' ? 'on' : ''}" data-tab2="matrix">全員の週（空き時間）</button>
          <button class="btn ${ui.tab === 'one' ? 'on' : ''}" data-tab2="one">先生ごと</button>
          <button class="btn ${ui.tab === 'assign' ? 'on' : ''}" data-tab2="assign">担当表</button>
          <span style="flex:1"></span>
          ${ui.tab !== 'assign' ? `<select data-mon>${weeks.map((w) => `<option value="${w.mon}" ${w.mon === ui.mon ? 'selected' : ''}>第${w.no}週（${u.md(w.mon)}〜）</option>`).join('')}</select>` : ''}
          ${ui.tab === 'one' ? `<select data-who><option value="">先生を選ぶ</option>${names.map((n) => `<option ${n === ui.who ? 'selected' : ''}>${u.esc(n)}</option>`).join('')}</select>` : ''}
          ${ui.tab !== 'assign' ? '<button class="btn primary" data-act="print">印刷・PDF</button>' : ''}
        </div>
        <div class="card">
          ${ui.tab === 'assign' ? `<h2>担当表</h2><p class="help">クラス×教科ごとに、担当の先生の名前を入れます（2人なら「山田・佐藤」）。Excel の表をコピーして、左上のマスを選んで貼りつけることもできます。<br>入れると：①入れ替えのとき、先生があいているコマが緑に光る　②同じ先生が同じ時間に2クラスにいると赤い枠　③職員の予定に「だれが」を書くと、その先生の授業に⚠</p><div style="overflow:auto">${assignTable()}</div>`
          : ui.tab === 'one' ? `<h2>${u.esc(ui.who || '先生ごとの時間割')}</h2>${personal(ui.who, ui.mon)}`
          : `<h2>全員の週　<span class="small muted">第${m.weekNo(ui.mon)}週</span></h2><p class="help">空いているマス＝その時間は授業なし。自習監督や代わりの先生を探すときに。赤＝同じ時間に2クラス／不在なのに授業あり。</p><div style="overflow:auto">${matrix(ui.mon)}</div>`}
        </div></div>`;
      const root = el.firstElementChild;
      root.addEventListener('click', (e) => {
        const t = e.target.closest('[data-tab2]');
        if (t) {
          ui.tab = t.dataset.tab2;
          return V.teachers.render(el);
        }
        const w = e.target.closest('[data-who]');
        if (w && w.tagName === 'A') {
          e.preventDefault();
          ui.who = w.dataset.who;
          ui.tab = 'one';
          return V.teachers.render(el);
        }
        if (e.target.closest('[data-act="print"]')) K.print.direct({ kind: 'teachers' });
      });
      const ms = root.querySelector('[data-mon]');
      if (ms)
        ms.addEventListener('change', () => {
          ui.mon = ms.value;
          V.teachers.render(el);
        });
      const ws = root.querySelector('select[data-who]');
      if (ws)
        ws.addEventListener('change', () => {
          ui.who = ws.value;
          V.teachers.render(el);
        });
      const tb = root.querySelector('[data-assign]');
      if (tb) {
        tb.addEventListener('change', (e) => {
          const inp = e.target.closest('[data-t]');
          if (!inp) return;
          K.store.commit('担当表', (st) => {
            if (inp.value.trim()) st.teach[inp.dataset.t] = inp.value.trim();
            else delete st.teach[inp.dataset.t];
          });
        });
        // Excel から表を貼りつけ
        tb.addEventListener('paste', (e) => {
          const inp = e.target.closest('[data-rc]');
          const text = (e.clipboardData || window.clipboardData).getData('text');
          if (!inp || !/[\t\n]/.test(text)) return;
          e.preventDefault();
          const [r0, c0] = inp.dataset.rc.split(',').map(Number);
          const rows = text.replace(/\r/g, '').replace(/\n$/, '').split('\n').map((l) => l.split('\t'));
          K.store.commit('担当表を貼りつけ', (st) => {
            rows.forEach((cols, dr) =>
              cols.forEach((v, dc) => {
                const t = tb.querySelector(`[data-rc="${r0 + dr},${c0 + dc}"]`);
                if (!t) return;
                if (v.trim()) st.teach[t.dataset.t] = v.trim();
                else delete st.teach[t.dataset.t];
              })
            );
          });
        });
      }
    },
    printPages() {
      const title = `${ui.tab === 'one' ? ui.who + '先生' : '全員'}の時間割　第${m.weekNo(ui.mon)}週（${u.md(ui.mon)}〜${u.md(u.add(ui.mon, 4))}）`;
      return { pages: [`<div class="page land"><div class="fitbox"><div class="print-doc"><h2>${u.esc(title)}</h2>${ui.tab === 'one' ? personal(ui.who, ui.mon) : matrix(ui.mon, true)}</div></div></div>`], land: true };
    },
  };
})();
