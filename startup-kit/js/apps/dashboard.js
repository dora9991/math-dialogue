// ダッシュボード：今日やること・今月の数字・道具箱・バックアップ。ほかのツールのデータを読むだけ（書かない）
(function () {
  'use strict';
  const { h } = Kit;

  Kit.css('dashboard', `
    .db-top { display: grid; gap: 16px; grid-template-columns: 1fr; }
    @media (min-width: 980px) { .db-top { grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr); } }
    .db-h2 { font-size: 15px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
    .db-h2 .chip { font-weight: 500; }
    .db-todo { margin-top: 10px; }
    .db-todo .list-item { align-items: center; }
    .db-todo-ic { flex: none; width: 32px; height: 32px; border-radius: 8px; display: grid; place-items: center; background: var(--gosu-wash); color: var(--gosu); }
    .db-todo-ic svg { width: 17px; height: 17px; }
    .db-todo-ic.bad { background: var(--bad-wash); color: var(--bad); }
    .db-todo-ic.shu { background: var(--shu-wash); color: var(--shu); }
    .db-todo-main { flex: 1; min-width: 0; }
    .db-todo-main b { font-weight: 700; }
    .db-todo-sub { font-size: 12.5px; color: var(--ink-3); }
    .db-kpis { display: grid; gap: 10px; grid-template-columns: repeat(2, minmax(0, 1fr)); margin-top: 10px; }
    .db-kpis .kpi { padding: 12px 14px; }
    .db-kpis .kpi-value { font-size: 23px; }
    .db-kpis .meter { margin-top: 6px; }
    .db-group { display: grid; gap: 8px; }
    .db-group + .db-group { margin-top: 16px; }
    .db-group-label { font-size: 12px; letter-spacing: .16em; color: var(--ink-3); font-weight: 700; }
    .db-tools { display: grid; gap: 10px; grid-template-columns: repeat(auto-fill, minmax(min(100%, 230px), 1fr)); }
    .db-tool { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 2px 12px; align-items: start; text-align: left; padding: 14px; border-radius: var(--r); background: var(--surface); border: 1px solid var(--line); color: var(--ink); font: inherit; cursor: pointer; transition: border-color .12s, transform .06s; }
    .db-tool:hover { border-color: var(--gosu); }
    .db-tool:active { transform: translateY(1px); }
    .db-tool-ic { grid-row: span 3; width: 36px; height: 36px; border-radius: 9px; display: grid; place-items: center; background: var(--gosu-wash); color: var(--gosu); }
    .db-tool-ic svg { width: 19px; height: 19px; }
    .db-tool-title { font-weight: 700; font-size: 15px; }
    .db-tool-desc { font-size: 12.5px; color: var(--ink-3); line-height: 1.5; }
    .db-tool-stat { font-size: 13px; color: var(--ink-2); margin-top: 4px; font-variant-numeric: tabular-nums; }
    .db-flow { display: flex; flex-wrap: wrap; gap: 6px; align-items: stretch; }
    .db-flow-step { flex: 1 1 140px; display: grid; gap: 2px; padding: 10px 12px; border-radius: 8px; background: var(--surface-2); border: 0; color: var(--ink); font: inherit; text-align: left; cursor: pointer; min-width: 0; }
    .db-flow-step:hover { background: var(--gosu-wash); }
    .db-flow-no { font-family: var(--font-display); font-weight: 800; color: var(--gosu); font-size: 13px; }
    .db-flow-name { font-weight: 700; font-size: 14px; }
    .db-flow-tool { font-size: 12px; color: var(--ink-3); }
    .db-backup .btn-row { margin-top: 10px; }
    .db-welcome { display: grid; gap: 8px; }
  `);

  const GROUP_LABEL = { make: 'つくる', gather: 'あつめる', earn: 'かせぐ', plan: 'ととのえる' };
  const ST_LABEL = { new: '新規', replied: '返信済み', talking: '商談中', won: '成約', lost: '見送り' };
  const PLATFORM = { instagram: 'Instagram', x: 'X', threads: 'Threads', facebook: 'Facebook', line: 'LINE', youtube: 'YouTube', tiktok: 'TikTok', note: 'note' };

  // 繰り返しの予定が、その日にあるか
  function occursOn(ev, ymd) {
    if (!ev || !ev.date) return false;
    if (ev.date === ymd) return true;
    if (!ev.repeat || ev.repeat === 'none' || ymd < ev.date) return false;
    if (ev.repeatUntil && ymd > ev.repeatUntil) return false;
    const a = Kit.parseYmd(ev.date), b = Kit.parseYmd(ymd);
    if (ev.repeat === 'weekly') return a.getDay() === b.getDay();
    if (ev.repeat === 'monthly') return a.getDate() === b.getDate();
    return false;
  }
  const inMonth = (s, ym) => typeof s === 'string' && s.slice(0, 7) === ym;
  const dayTag = (ymd, today) => {
    const n = Kit.daysBetween(today, ymd);
    if (n < 0) return h('span', { class: 'chip bad' }, '期限切れ');
    if (n === 0) return h('span', { class: 'chip shu' }, '今日');
    if (n === 1) return h('span', { class: 'chip blue' }, '明日');
    return h('span', { class: 'chip' }, Kit.fmtDate(ymd, 'M/D(W)'));
  };

  // 売上の実績：入金済みの請求書（入金日の月）＋請求書から作ったものではない領収書（発行日の月）
  function salesByMonth(invoices) {
    const m = {};
    for (const d of invoices) {
      if (d.type === 'invoice' && d.status === 'paid' && d.paidAt) m[d.paidAt.slice(0, 7)] = (m[d.paidAt.slice(0, 7)] || 0) + (+d.total || 0);
      if (d.type === 'receipt' && !d.fromInvoice && d.issueDate) m[d.issueDate.slice(0, 7)] = (m[d.issueDate.slice(0, 7)] || 0) + (+d.total || 0);
    }
    return m;
  }
  function planByMonth(plan) {
    const out = {};
    if (!plan || !window.MoneyPlan || typeof window.MoneyPlan.project !== 'function') return out;
    try { const r = window.MoneyPlan.project(plan); for (const mo of r.months || []) out[mo.ym] = mo.revenue; } catch (e) { console.error(e); }
    return out;
  }

  Kit.app({
    id: 'dashboard', title: 'ダッシュボード', group: 'home', icon: 'home', order: 1,
    desc: '今日やること・数字・各ツールへの入口',
    async mount(root) {
      let alive = true;
      const rerender = Kit.debounce(() => { if (alive) render(); }, 120);
      const off = Kit.store.on('*', rerender);

      async function render() {
        const [profile, leads, events, posts, invoices, plan, site, canvases, road] = await Promise.all([
          Kit.profile.get(),
          Kit.store.list('leads'), Kit.store.list('events'), Kit.store.list('posts'), Kit.store.list('invoices'),
          Kit.store.get('plan'), Kit.store.get('site'), Kit.store.list('canvases'),
          window.Roadmap ? window.Roadmap.progress() : null,
        ]);
        if (!alive) return;
        const today = Kit.ymd(), tomorrow = Kit.rel(1), ym = Kit.ym();
        Kit.clear(root);

        root.append(Kit.appHead({
          title: profile.name || 'あなたの事業',
          desc: Kit.fmtDate(today, 'YYYY年M月D日(W)') + '。今日やることと、今月の数字です。',
          actions: [Kit.btn('事業プロフィール', () => Kit.profile.edit(), { icon: 'user' }), Kit.btn('バックアップ', () => root.querySelector('#db-backup').scrollIntoView({ behavior: 'smooth' }), { icon: 'save', kind: 'ghost' })],
        }));

        if (Kit.store.samplesShown()) {
          root.append(h('div', { class: 'sample-bar', role: 'note' },
            h('span', null, h('strong', null, 'サンプル表示中'), '　「ひらめき数学舎」という架空の教室の例で、全部のツールを動かしています。気軽にさわってみてください。'),
            h('div', { class: 'btn-row' },
              Kit.btn('自分の事業で始める', startOwn, { sm: true, kind: 'primary', icon: 'store' }),
              Kit.btn('サンプルを片付ける', clearSamples, { sm: true, kind: 'ghost', icon: 'trash' }))));
        }

        /* ── 今日やること ── */
        const todo = [];
        const fresh = leads.filter((l) => l.status === 'new');
        if (fresh.length) todo.push({ rank: 1, icon: 'inbox', tone: 'shu', text: h('span', null, '返信を待っている問い合わせ ', h('b', null, fresh.length + '件')), sub: fresh.slice(0, 3).map((l) => (l.name || '名前なし') + 'さん').join('、'), go: () => Kit.go('inbox', fresh.length === 1 ? { lead: fresh[0].id } : {}) });
        for (const l of leads) {
          if (l.status === 'won' || l.status === 'lost') continue;
          if (l.nextAt && l.nextAt <= tomorrow) todo.push({ rank: l.nextAt < today ? 0 : 2, icon: 'mail', tone: l.nextAt < today ? 'bad' : '', text: h('span', null, h('b', null, (l.name || '名前なし') + 'さん'), 'に連絡する'), sub: (l.kind || '') + (l.value ? '・見込み ' + Kit.yen(l.value) : ''), tag: dayTag(l.nextAt, today), go: () => Kit.go('inbox', { lead: l.id }) });
          if (l.meetingAt) {
            const d = l.meetingAt.slice(0, 10);
            if (d === today || d === tomorrow) todo.push({ rank: 2, icon: 'user', text: h('span', null, h('b', null, (l.name || '') + 'さん'), 'と ' + (l.kind || '予約・打ち合わせ')), sub: l.meetingAt.slice(11, 16) || '', tag: dayTag(d, today), go: () => Kit.go('inbox', { lead: l.id }) });
          }
        }
        for (const day of [today, tomorrow]) {
          const evs = events.filter((e) => occursOn(e, day)).sort((a, b) => String(a.start || '').localeCompare(String(b.start || '')));
          for (const e of evs) todo.push({ rank: day === today ? 3 : 5, icon: 'calendar', text: h('span', null, e.title || '予定'), sub: e.allDay || !e.start ? '終日' + (e.place ? '・' + e.place : '') : e.start + (e.end ? '〜' + e.end : '') + (e.place ? '・' + e.place : ''), tag: dayTag(day, today), go: () => Kit.go('calendar', { date: day }) });
        }
        for (const p of posts) {
          if (p.status === 'posted' || !p.date || p.date > tomorrow) continue;
          const late = p.date < today;
          todo.push({ rank: late ? 4 : 3, icon: 'megaphone', tone: late ? 'bad' : '', text: h('span', null, '投稿：', h('b', null, p.title || String(p.text || '').slice(0, 24) || '（本文なし）')), sub: (p.platforms || []).map((x) => PLATFORM[x] || x).join('・') + (p.time ? '・' + p.time : ''), tag: dayTag(p.date, today), go: () => Kit.go('sns', { post: p.id }) });
        }
        for (const d of invoices) {
          if (d.type !== 'invoice' || d.status !== 'sent' || !d.dueDate) continue;
          const n = Kit.daysBetween(today, d.dueDate);
          if (n > 7) continue;
          todo.push({ rank: n < 0 ? 0 : 4, icon: 'receipt', tone: n < 0 ? 'bad' : '', text: h('span', null, n < 0 ? '入金が遅れています：' : '入金の期限：', h('b', null, (d.client && d.client.name) || '宛先なし')), sub: Kit.yen(d.total) + '・' + (d.number || ''), tag: dayTag(d.dueDate, today), go: () => Kit.go('invoice', { doc: d.id }) });
        }
        if (road && road.next) todo.push({ rank: 6, icon: 'flag', tone: 'shu', text: h('span', null, 'いまの一歩：', h('b', null, road.next.title)), sub: '開業ロードマップ ' + road.done + ' / ' + road.total, go: () => Kit.go('roadmap', { step: road.next.id }) });
        todo.sort((a, b) => a.rank - b.rank);

        const todoList = h('div', { class: 'list db-todo' });
        const SHOW = 6;
        const item = (t) => h('button', { type: 'button', class: 'list-item', onclick: t.go },
          h('span', { class: 'db-todo-ic' + (t.tone ? ' ' + t.tone : '') }, Kit.icon(t.icon)),
          h('span', { class: 'db-todo-main' }, h('span', { class: 'ellipsis', style: { display: 'block' } }, t.text), t.sub ? h('span', { class: 'db-todo-sub ellipsis', style: { display: 'block' } }, t.sub) : null),
          t.tag || null);
        todo.slice(0, SHOW).forEach((t) => todoList.append(item(t)));
        const todoCard = h('section', { class: 'card', 'aria-label': '今日やること' },
          h('h2', { class: 'db-h2' }, '今日・明日やること', todo.length ? h('span', { class: 'chip' }, todo.length + '件') : null),
          todo.length ? todoList : h('p', { class: 'small muted', style: { marginTop: '10px' } }, '今日・明日の予定や、返信待ちはありません。ひと息つけます。'));
        if (todo.length > SHOW) {
          const more = Kit.btn('ほかに ' + (todo.length - SHOW) + '件', () => { todo.slice(SHOW).forEach((t) => todoList.append(item(t))); more.remove(); }, { sm: true, kind: 'ghost', icon: 'down' });
          more.style.marginTop = '8px';
          todoCard.append(more);
        }

        /* ── 今月の数字 ── */
        const sales = salesByMonth(invoices);
        const planned = planByMonth(plan);
        const salesNow = sales[ym] || 0, planNow = planned[ym];
        const unpaid = invoices.filter((d) => d.type === 'invoice' && d.status === 'sent');
        const leadsNow = leads.filter((l) => inMonth(l.createdAt, ym));
        const won = leads.filter((l) => l.status === 'won' && inMonth(l.closedAt || l.updatedAt || l.createdAt, ym)).length;
        const talking = leads.filter((l) => l.status === 'talking').length;
        const postsNow = posts.filter((p) => inMonth(p.date, ym));
        const posted = postsNow.filter((p) => p.status === 'posted').length;
        const rate = planNow ? salesNow / planNow : null;
        const kpi = (label, value, sub, extra) => h('div', { class: 'kpi' }, h('span', { class: 'kpi-label' }, label), h('span', { class: 'kpi-value' }, value), sub ? h('span', { class: 'kpi-sub' }, sub) : null, extra || null);
        const numbers = h('section', { class: 'card', 'aria-label': '今月の数字' },
          h('h2', { class: 'db-h2' }, Kit.fmtDate(today, 'M') + '月の数字'),
          h('div', { class: 'db-kpis' },
            kpi('売上（入金済み）', Kit.yen(salesNow), planNow ? '計画 ' + Kit.yenShort(planNow) + '・' + Kit.pct(Math.min(rate, 9.99)) : '計画はまだありません',
              planNow ? h('div', { class: 'meter' + (rate >= 1 ? ' ok' : ''), role: 'progressbar', 'aria-label': '計画に対する売上', 'aria-valuenow': Math.round(Math.min(rate, 1) * 100), 'aria-valuemin': 0, 'aria-valuemax': 100 }, h('i', { style: { width: Math.min(100, rate * 100).toFixed(1) + '%' } })) : null),
            kpi('未入金', Kit.yen(Kit.sum(unpaid, (d) => d.total)), unpaid.length ? unpaid.length + '件の請求書' : 'ありません'),
            kpi('問い合わせ', leadsNow.length + '件', '成約 ' + won + '・商談中 ' + talking),
            kpi('SNS投稿', posted + ' / ' + postsNow.length, '投稿済み / 今月の予定')));

        root.append(h('div', { class: 'db-top' }, todoCard, numbers));

        /* ── 売上の推移（実績と計画） ── */
        // 過去3か月〜先2か月。実績は棒、計画は線（計画のない月は線を描かない）
        const months = [];
        for (let i = -3; i <= 2; i++) months.push(Kit.ym(Kit.addMonths(Kit.parseYmd(ym + '-01'), i)));
        const hasPlan = months.some((m) => planned[m] != null);
        const hasSales = months.some((m) => sales[m]);
        const chartBox = h('div');
        const trend = h('section', { class: 'card', style: { marginTop: '16px' }, 'aria-label': '売上の推移' },
          h('div', { class: 'card-h' }, h('h2', null, '売上の実績と計画'), h('span', { class: 'spacer' }), Kit.btn('計画を開く', () => Kit.go('money'), { sm: true, kind: 'ghost', icon: 'yen' })),
          hasPlan || hasSales ? chartBox : h('p', { class: 'small muted' }, '入金済みの請求書がたまると、ここに月ごとの売上が出ます。マネタイズ計画を作ると、計画の線も重なります。'));
        root.append(trend);
        if (hasPlan || hasSales) {
          Kit.chart.bars(chartBox, {
            labels: months.map((m) => +m.slice(5) + '月'),
            series: [{ name: '売上（実績）', values: months.map((m) => (m > ym ? null : sales[m] || 0)) }],
            lines: hasPlan ? [{ name: '計画', values: months.map((m) => (planned[m] == null ? null : planned[m])), color: 'var(--series-2)' }] : [],
            format: Kit.yen, tick: Kit.yenShort, height: 200,
          });
        }

        /* ── 道具箱 ── */
        const stat = {
          site: () => (site ? (site.sections || []).filter((s) => !s.hidden).length + 'セクション' + (site.publishedUrl ? '・公開中' : '・まだ公開していません') : 'まだ作っていません'),
          editor: () => (site && site._sample ? 'サンプルを書きかえて使えます' : '文章・写真・色を直す'),
          video: () => '縦・横・正方形に書き出し',
          inbox: () => '新規 ' + fresh.length + '件・商談中 ' + talking + '件',
          sns: () => '予約 ' + posts.filter((p) => p.status === 'scheduled').length + '件・ネタ ' + posts.filter((p) => p.status === 'idea').length + '件',
          money: () => { try { if (!plan || !window.MoneyPlan) return '収入の柱を組み立てる'; const r = window.MoneyPlan.project(plan); const last = r.months[r.months.length - 1]; return (r.months.length) + 'か月目の月商 ' + Kit.yenShort(last ? last.revenue : 0); } catch (e) { return '収入の柱を組み立てる'; } },
          invoice: () => (unpaid.length ? '未入金 ' + Kit.yen(Kit.sum(unpaid, (d) => d.total)) : '未入金はありません'),
          calendar: () => { let n = 0; for (let i = 0; i < 7; i++) { const d = Kit.rel(i); n += events.filter((e) => occursOn(e, d)).length; } return 'この7日の予定 ' + n + '件'; },
          canvas: () => (canvases.length ? canvases.length + '枚' : 'まだありません'),
          roadmap: () => (road ? road.done + ' / ' + road.total + ' 済み' : '開業までの手順'),
        };
        const tools = h('section', { style: { marginTop: '24px' }, 'aria-label': '道具箱' }, h('h2', { class: 'section-title' }, '道具箱'));
        for (const g of ['make', 'gather', 'earn', 'plan']) {
          const apps = Kit.apps().filter((a) => a.group === g);
          if (!apps.length) continue;
          tools.append(h('div', { class: 'db-group' }, h('div', { class: 'db-group-label' }, GROUP_LABEL[g]),
            h('div', { class: 'db-tools' }, apps.map((a) => h('button', { type: 'button', class: 'db-tool', onclick: () => Kit.go(a.id) },
              h('span', { class: 'db-tool-ic' }, Kit.icon(a.icon)),
              h('span', { class: 'db-tool-title' }, a.title),
              h('span', { class: 'db-tool-desc' }, a.desc || ''),
              h('span', { class: 'db-tool-stat' }, stat[a.id] ? stat[a.id]() : ''))))));
        }
        root.append(tools);

        /* ── つかう順番の例 ── */
        const FLOW = [
          ['骨組み', 'リーンキャンバス', 'canvas'], ['数字', 'マネタイズ計画', 'money'], ['お店の顔', 'ホームページ・動画', 'editor'],
          ['発信', 'SNS投稿プランナー', 'sns'], ['受付', '集客窓口・カレンダー', 'inbox'], ['いただく', '見積書・請求書', 'invoice'],
        ];
        root.append(h('section', { style: { marginTop: '24px' }, 'aria-label': 'つかう順番の例' },
          h('h2', { class: 'section-title' }, 'つかう順番の例'),
          h('p', { class: 'small ink-2', style: { marginBottom: '10px' } }, 'ツールどうしはつながっています。ホームページの問い合わせは集客窓口に届き、予約はカレンダーに、成約したら見積書へ。'),
          h('div', { class: 'db-flow' }, FLOW.map(([name, tool, id], i) => h('button', { type: 'button', class: 'db-flow-step', onclick: () => Kit.go(id) },
            h('span', { class: 'db-flow-no' }, String(i + 1)), h('span', { class: 'db-flow-name' }, name), h('span', { class: 'db-flow-tool' }, tool))))));

        /* ── 保存とバックアップ ── */
        const where = Kit.store.mode === 'db' ? 'あなたのアカウントに保存しています。ほかの端末で開いても同じ内容です。'
          : Kit.env.artifact ? '共有されたページとして開いているため、このブラウザだけに保存しています。'
            : Kit.store.mode === 'memory' ? 'この環境では保存できません。閉じる前にバックアップを書き出してください。'
              : 'このブラウザに保存しています。ブラウザのデータを消すと消えるので、ときどきバックアップを書き出してください。';
        root.append(h('section', { class: 'card db-backup', id: 'db-backup', style: { marginTop: '24px' }, 'aria-label': '保存とバックアップ' },
          h('h2', { class: 'db-h2' }, Kit.icon('save', 18), '保存とバックアップ'),
          h('p', { class: 'small ink-2', style: { marginTop: '6px' } }, where),
          h('p', { class: 'small muted' }, 'バックアップ（JSON）には、すべてのツールの内容と画像が入ります。動画の素材ファイルは入りません。'),
          h('div', { class: 'btn-row' },
            Kit.btn('バックアップを書き出す', backup, { icon: 'download' }),
            Kit.btn('バックアップから戻す', restore, { icon: 'upload' }),
            Kit.btn('すべて消して最初から', wipe, { icon: 'trash', kind: 'danger' }))));
      }

      async function startOwn() {
        const p = await Kit.profile.edit();
        if (!p) return;
        const yes = await Kit.confirm({ title: 'サンプルも片付けますか', body: 'ひらめき数学舎の例（問い合わせ・予定・請求書など）を消して、空の状態から始めます。自分で入力したものは残ります。', ok: '片付ける', cancel: 'あとで' });
        if (yes) { await Kit.store.samplesOff(); Kit.toast('サンプルを片付けました'); }
        render();
      }
      async function clearSamples() {
        const yes = await Kit.confirm({ title: 'サンプルを片付けますか', body: 'すべてのツールから、ひらめき数学舎の例を消します。自分で入力・編集したものは残ります。', ok: '片付ける' });
        if (!yes) return;
        await Kit.store.samplesOff();
        Kit.toast('サンプルを片付けました');
        render();
      }
      async function backup() {
        await Kit.store.flush();
        const data = await Kit.store.exportAll();
        const p = await Kit.profile.get();
        const ok = await Kit.download('misebiraki-' + Kit.safeName(p.name || 'backup') + '-' + Kit.ymd() + '.json', JSON.stringify(data, null, 1));
        if (ok) Kit.toast('バックアップを書き出しました');
      }
      async function restore() {
        const f = await Kit.img.pick('application/json,.json');
        if (!f) return;
        let data;
        try { data = JSON.parse(await f.text()); } catch (e) { Kit.toast('ファイルを読めませんでした。みせびらきのバックアップ（.json）を選んでください', { type: 'bad' }); return; }
        if (!data || data.app !== 'misebiraki') { Kit.toast('みせびらきのバックアップではありません', { type: 'bad' }); return; }
        const n = Object.values(data.colls || {}).reduce((s, a) => s + (a ? a.length : 0), 0);
        const yes = await Kit.confirm({ title: 'バックアップから戻しますか', body: Kit.fmtDate(String(data.exportedAt || '').slice(0, 10), 'YYYY年M月D日') + 'のバックアップ（' + n + '件のデータ）で、いまの内容を置きかえます。', ok: '戻す', danger: true });
        if (!yes) return;
        try { await Kit.store.importAll(data); Kit.toast('バックアップから戻しました'); render(); }
        catch (e) { Kit.toast('戻せませんでした：' + ((e && e.message) || e), { type: 'bad' }); }
      }
      async function wipe() {
        const yes = await Kit.confirm({ title: 'すべて消しますか', body: 'すべてのツールの内容と画像を消して、最初の状態（サンプル表示）に戻します。元に戻せないので、先にバックアップを書き出しておくと安心です。', ok: 'すべて消す', danger: true });
        if (!yes) return;
        await Kit.store.wipeAll();
        Kit.toast('すべて消しました');
        render();
      }

      await render();
      return () => { alive = false; off(); rerender.cancel(); };
    },
  });
})();
