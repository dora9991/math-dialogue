/* 時数：クラスごと・教科ごとの授業時数を自動で数える。
   ・累計（年度のはじめ〜えらんだ週まで）／年度末の見込み（これからの週は基本時間割と行事から計算）／計画との差／学年内の差
   ・行事で減ったコマ、入れ替え・変更もすべて反映される */
(function () {
  const K = window.K;
  const u = K.u;
  const m = K.m;
  const V = (K.views = K.views || {});
  const ui = { mode: 'cum', by: 'group', until: null, term: '' };

  // 中学校の標準授業時数（学校教育法施行規則 別表第二）
  const STD = { 国: [140, 140, 105], 社: [105, 105, 140], 数: [140, 105, 140], 理: [105, 140, 140], 英: [140, 140, 140], 音: [45, 35, 35], 美: [45, 35, 35], 体: [105, 105, 105], 技家: [70, 70, 35], 道: [35, 35, 35], 総: [50, 70, 70], 学: [35, 35, 35] };

  const MODES = [
    ['cum', '累計（実施）'],
    ['proj', '年度末の見込み'],
    ['plan', '計画'],
    ['diff', '見込み − 計画'],
    ['gap', '学年内の差（累計）'],
  ];

  function data() {
    const until = ui.until || defaultUntil();
    let from = m.fyStart();
    let to = until;
    let toProj = m.fyEnd();
    if (ui.term) {
      const t = m.st.terms.find((x) => x.id === ui.term);
      if (t) {
        from = t.start;
        to = until < t.end ? until : t.end;
        toProj = t.end;
      }
    }
    const conv = (c) => (ui.by === 'group' ? m.byGroup(c) : c);
    return { until, cum: conv(m.countRange(from, to)), proj: conv(m.countRange(from, toProj)), from, to };
  }
  function defaultUntil() {
    const t = u.today();
    const sun = u.add(u.monday(t), 6);
    return sun < m.fyStart() ? m.fyStart() : sun > m.fyEnd() ? m.fyEnd() : sun;
  }
  const plan = (cid, key) => {
    const c = m.cls(cid);
    const g = m.st.targets[c.g] || {};
    return g[key] != null && g[key] !== '' ? Number(g[key]) : null;
  };

  function rowsKeys(d) {
    const used = new Set();
    [d.cum, d.proj].forEach((x) => Object.values(x).forEach((r) => Object.keys(r).forEach((k) => used.add(k))));
    if (ui.by === 'group') {
      Object.values(m.st.targets).forEach((g) => Object.keys(g).forEach((k) => g[k] && used.add(k)));
      return m.groups().filter((g) => used.has(g)).concat([...used].filter((k) => !m.groups().includes(k)));
    }
    return m.st.subjects.filter((s) => s.counted && used.has(s.code)).map((s) => s.code);
  }

  function table(d, forPrint) {
    const cls = m.st.classes;
    const keys = rowsKeys(d);
    const gsep = (i) => (i > 0 && cls[i - 1].g !== cls[i].g ? ' gsep' : '');
    const val = (cid, k) => {
      const cum = (d.cum[cid] || {})[k] || 0;
      const proj = (d.proj[cid] || {})[k] || 0;
      const p = plan(cid, k);
      if (ui.mode === 'cum') return { v: cum };
      if (ui.mode === 'proj') return { v: proj, cls: p != null && !ui.term ? (proj < p ? 'lack' : proj > p ? 'over' : '') : '' };
      if (ui.mode === 'plan') return { v: p == null ? '' : p };
      if (ui.mode === 'diff') {
        if (p == null || ui.term) return { v: '' };
        const x = proj - p;
        return { v: x > 0 ? '+' + x : x, cls: x < 0 ? 'lack' : x > 0 ? 'over' : '' };
      }
      // 学年内の差
      const c = m.cls(cid);
      const mx = Math.max(...cls.filter((y) => y.g === c.g).map((y) => (d.cum[y.id] || {})[k] || 0));
      const x = cum - mx;
      return { v: x === 0 ? '0' : x, cls: x <= -2 ? 'gap2' : x === -1 ? 'gap1' : '' };
    };
    let html = `<table class="cnt"><tr><th class="l">${ui.by === 'group' ? '教科' : '記号'}</th>${cls.map((c, i) => `<th class="${gsep(i)}">${c.id}</th>`).join('')}</tr>`;
    keys.forEach((k) => {
      const sj = m.subject(k);
      html += `<tr><td class="l">${u.esc(k)}${sj && sj.name !== k && ui.by !== 'group' ? ` <span class="muted small">${u.esc(sj.name)}</span>` : ''}</td>${cls
        .map((c, i) => {
          const x = val(c.id, k);
          return `<td class="${x.cls || ''}${x.v === 0 || x.v === '0' ? ' zero' : ''}${gsep(i)}">${x.v}</td>`;
        })
        .join('')}</tr>`;
    });
    if (ui.mode === 'cum' || ui.mode === 'proj' || ui.mode === 'plan') {
      html += `<tr class="sum"><td class="l">計</td>${cls
        .map((c, i) => {
          const sum = keys.reduce((a, k) => a + (Number(val(c.id, k).v) || 0), 0);
          return `<td class="${gsep(i)}">${sum}</td>`;
        })
        .join('')}</tr>`;
    }
    return html + '</table>';
  }

  function termTable() {
    const cls = m.st.classes;
    let html = `<table class="cnt"><tr><th class="l">期間</th><th>日付</th><th>授業日数</th>${cls.map((c) => `<th>${c.id}</th>`).join('')}</tr>`;
    m.st.terms.forEach((t) => {
      if (!t.start || !t.end) return;
      const c = m.countRange(t.start, t.end);
      html += `<tr><td class="l">${u.esc(t.name)}</td><td>${u.md(t.start)}〜${u.md(t.end)}</td><td>${m.schoolDays(t.start, t.end)}</td>${cls.map((x) => `<td>${Object.values(c[x.id] || {}).reduce((a, b) => a + b, 0)}</td>`).join('')}</tr>`;
    });
    return html + '</table>';
  }

  function planEditor() {
    const gs = m.grades();
    const keys = m.groups();
    return `<table class="cnt"><tr><th class="l">教科</th>${gs.map((g) => `<th>${g}年</th>`).join('')}</tr>
      ${keys.map((k) => `<tr><td class="l">${u.esc(k)}</td>${gs.map((g) => `<td><input type="number" min="0" step="1" data-plan="${g}|${u.esc(k)}" value="${(m.st.targets[g] || {})[k] ?? ''}" style="width:64px"></td>`).join('')}</tr>`).join('')}</table>`;
  }

  V.hours = {
    title: '時数',
    render(el) {
      const d = data();
      const weeks = m.weeks().filter((w) => w.no);
      el.innerHTML = `<div class="view">
        <div class="card row">
          ${MODES.map(([k, t]) => `<button class="btn small ${ui.mode === k ? 'on' : ''}" data-mode="${k}">${t}</button>`).join('')}
          <span style="width:12px"></span>
          <select data-by><option value="group" ${ui.by === 'group' ? 'selected' : ''}>教科でまとめる（理a・理b→理）</option><option value="code" ${ui.by === 'code' ? 'selected' : ''}>時間割の記号のまま</option></select>
          <select data-term><option value="">年間</option>${m.st.terms.map((t) => `<option value="${t.id}" ${ui.term === t.id ? 'selected' : ''}>${u.esc(t.name)}</option>`).join('')}</select>
          <span class="small">累計は</span><select data-until>${weeks.map((w) => `<option value="${u.add(w.mon, 6)}" ${u.add(w.mon, 6) === d.until ? 'selected' : ''}>第${w.no}週（${u.md(w.mon)}〜）まで</option>`).join('')}</select>
          <span style="flex:1"></span>
          <button class="btn primary" data-act="print">印刷・PDF</button>
        </div>
        <div class="card">
          <h2>${MODES.find((x) => x[0] === ui.mode)[1]}　<span class="small muted">${ui.mode === 'cum' || ui.mode === 'gap' ? `${u.md(d.from)}〜${u.md(d.to)}` : ''}</span></h2>
          <p class="help">${
            ui.mode === 'gap'
              ? '同じ学年でいちばん多いクラスとの差。<b>-1</b>（薄い橙）・<b>-2以下</b>（濃い橙）のクラスは、時間数の調整が必要かもしれません。'
              : ui.mode === 'proj' || ui.mode === 'diff'
                ? 'これからの週は、基本時間割と年間行事（学年・校時つき）から計算した見込みです。赤＝計画より少ない、青＝多い。'
                : '週行事の時間割（入れ替え・行事を反映したもの）から数えています。'
          }</p>
          <div style="overflow:auto">${table(d)}</div>
        </div>
        <div class="card"><h3>期間ごとの授業日数・時数（見込みをふくむ）</h3><div style="overflow:auto">${termTable()}</div></div>
        <div class="card"><h3>計画時数（学年ごと・年間）</h3>
          <p class="help">「見込み − 計画」に使います。教科のまとまりは「設定」の教科一覧で変えられます。</p>
          <div class="row" style="margin-bottom:8px"><button class="btn small" data-act="std">中学校の標準授業時数を入れる</button><button class="btn small" data-act="fromproj">いまの見込みを計画にする</button></div>
          <div style="overflow:auto">${planEditor()}</div>
        </div></div>`;
      const root = el.firstElementChild;
      root.addEventListener('click', (e) => {
        const b = e.target.closest('[data-mode]');
        if (b) {
          ui.mode = b.dataset.mode;
          return V.hours.render(el);
        }
        const a = e.target.closest('[data-act]');
        if (!a) return;
        if (a.dataset.act === 'print') K.print.direct({ kind: 'hours' });
        if (a.dataset.act === 'std')
          K.store.commit('標準授業時数を入れる', (st) => {
            m.grades().forEach((g) => {
              const t = (st.targets[g] = st.targets[g] || {});
              Object.entries(STD).forEach(([k, arr]) => arr[g - 1] != null && (t[k] = arr[g - 1]));
            });
          });
        if (a.dataset.act === 'fromproj') {
          const pr = m.byGroup(m.countRange(m.fyStart(), m.fyEnd()));
          K.store.commit('見込みを計画にする', (st) => {
            m.grades().forEach((g) => {
              const t = (st.targets[g] = st.targets[g] || {});
              const ids = m.st.classes.filter((c) => c.g === g).map((c) => c.id);
              m.groups().forEach((k) => {
                const v = Math.max(...ids.map((id) => (pr[id] || {})[k] || 0));
                if (v) t[k] = v;
              });
            });
          });
        }
      });
      root.querySelector('[data-by]').addEventListener('change', (e) => {
        ui.by = e.target.value;
        V.hours.render(el);
      });
      root.querySelector('[data-term]').addEventListener('change', (e) => {
        ui.term = e.target.value;
        V.hours.render(el);
      });
      root.querySelector('[data-until]').addEventListener('change', (e) => {
        ui.until = e.target.value;
        V.hours.render(el);
      });
      root.querySelectorAll('[data-plan]').forEach((inp) =>
        inp.addEventListener('change', () => {
          const [g, k] = inp.dataset.plan.split('|');
          K.store.commit('計画時数', (st) => {
            const t = (st.targets[g] = st.targets[g] || {});
            if (inp.value === '') delete t[k];
            else t[k] = Number(inp.value);
          });
        })
      );
    },
    printPages() {
      const d = data();
      const title = `${m.st.school.name ? m.st.school.name + '　' : ''}授業時数（${MODES.find((x) => x[0] === ui.mode)[1]}${ui.mode === 'cum' || ui.mode === 'gap' ? `：${u.md(d.from)}〜${u.md(d.to)}` : ''}）`;
      return { pages: [`<div class="page land"><div class="fitbox"><div class="print-doc"><h2>${u.esc(title)}</h2>${table(d, true)}<h3>期間ごと</h3>${termTable()}</div></div></div>`], land: true };
    },
  };
})();
