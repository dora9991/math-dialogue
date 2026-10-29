/* スポーツ タップ記録 — チームの行で記録する種目の画面（サッカー・フットサル・ハンドボール・ラグビー）
   上の帯：時計（いまのピリオドが始まってからの時間）・ピリオド・得点・メニュー
   2つのチーム：選手1人＝1行（背番号＋ボタン）。いちばん下に「？」（だれか分からない）と「チーム」の行（CK・FK・タイムアウトなど）
   下の帯：★ あとで見る（チーム・選手は決めない）・いま記録したもの・取り消す
   並べ方は ST.planLayout（バスケ タップ記録と同じ：画面の大きさと人数から、ボタンがいちばん押しやすいもの）。 */
(function (root) {
  'use strict';
  const ST = root.ST;
  const { h } = ST.ui;

  function build(ctx) {
    const g = ctx.game, sp = ctx.sport;
    const L = { panels: [], btns: [], gb: {}, rowKey: '' };
    const clock = ctx.ui.clockBtn();
    const startB = ctx.ui.startBtn();
    L.period = h('button', { class: 'period', id: 'btnPeriod', 'aria-label': 'ピリオド', onclick: () => openPeriod(ctx) }, '');
    L.score = [0, 1].map((tm) => h('span', { class: 'sc', id: 'score' + tm, style: { '--tc': g.teams[tm].color, '--tink': ST.inkOn(g.teams[tm].color) } }, '0'));
    L.so = h('span', { class: 'sosc', id: 'soScore', hidden: true });
    const bar = h('header', { class: 'lbar' }, clock.el, startB.el, L.period,
      h('div', { class: 'score', 'aria-label': '得点' }, L.score[0], h('span', { class: 'dash' }, '−'), L.score[1], L.so),
      ctx.ui.menuBtn());
    const P = L.panelsEl = h('main', { class: 'panels' }, [0, 1].map((tm) => buildPanel(tm)));
    const gl = (sp.globalTypes || []).map((type) => {
      const d = sp.TYPE[type];
      const cnt = h('i', { class: 'cnt', hidden: true });
      const parts = String(d.btn).split(' ');
      const el = h('button', { class: 'gb k-' + d.kind, id: 'btn_' + type, dataset: { gtype: type }, 'aria-label': `${d.label}（チーム・選手は決めない）`, onclick: (e) => ctx.record({ type, team: null, no: null }, e.currentTarget) },
        h('b', null, parts[0]), parts[1] ? h('small', null, parts.slice(1).join(' ')) : null, cnt);
      L.gb[type] = { el, cnt };
      return el;
    });
    const rootEl = h('div', { class: 'live fam-team' }, bar, h('div', { class: 'stagewrap' }, P, ctx.ui.cover()), ctx.ui.footer(gl));
    rootEl.addEventListener('click', (e) => onClick(ctx, L, e));
    L.root = rootEl;

    function buildPanel(tm) {
      const t = g.teams[tm];
      const tsc = h('span', { class: 'tsc' }, '0');
      const fouls = h('span', { class: 'tfoul', hidden: true });
      const short = h('span', { class: 'tshort', hidden: true });
      const head = h('div', { class: 'thead' }, h('b', { class: 'tname' }, ST.teamName(g, tm)), short, fouls, tsc,
        h('button', { class: 'tadd', dataset: { add: '1' }, title: '名簿にない背番号を足す', 'aria-label': `${ST.teamName(g, tm)} の背番号を足す` }, '＋番号'));
      const roster = h('div', { class: 'roster', role: 'group', 'aria-label': `${ST.teamName(g, tm)} の選手` });
      const sec = h('section', { class: 'team', id: 'panel' + tm, dataset: { team: tm }, style: { '--tc': t.color, '--tink': ST.inkOn(t.color) } }, head, roster);
      L.panels[tm] = { sec, head, tsc, fouls, short, roster, n: 0, rows: new Map() };
      return sec;
    }
    const period = () => (g.startedAt ? sp.clockAt(g, ctx.elapsed()).p : (g.startPeriod || 1));
    function rowKey() { return sp.rowTypes(ctx.sprefs, period()).join(',') + '|' + sp.teamTypesOf(ctx.sprefs, period()).join(',') + '|' + g.teams.map((t) => t.players.map((p) => p.no).join('.')).join('/'); }
    function fillAll() {
      L.btns = [];
      [0, 1].forEach((tm) => fillRoster(tm));
      L.rowKey = rowKey();
    }
    /* 選手の行を並べる（名簿・ボタンの組み合わせ・PK戦に入ったときにも呼ぶ） */
    function fillRoster(tm) {
      const Pn = L.panels[tm], pr = ctx.sprefs, p = period();
      Pn.roster.innerHTML = '';
      Pn.rows = new Map();
      L.btns = L.btns.filter((b) => b.team !== tm);
      const types = sp.rowTypes(pr, p), ttypes = sp.teamTypesOf(pr, p);
      const rows = g.teams[tm].players.map((x) => ({ no: x.no, name: x.name }));
      const teamOnly = !rows.length;
      if (pr.unknown !== false || teamOnly) rows.push({ no: null, name: '' });
      if (ttypes.length) rows.push({ team: true });
      Pn.n = rows.length;
      rows.forEach((r) => {
        if (r.team) {
          const row = h('div', { class: 'prow trow', style: { '--tk': ttypes.length } }, h('div', { class: 'pno' }, h('b', null, 'チーム')));
          ttypes.forEach((type) => row.append(btn(tm, null, type, `${ST.teamName(g, tm)} チームの ${sp.TYPE[type].label}`, true)));
          Pn.roster.append(row);
          return;
        }
        const no = r.no == null ? '' : r.no;
        const who = r.no != null ? `${r.no}番${r.name ? ' ' + r.name : ''}` : teamOnly ? 'チーム' : 'だれか（番号なし）';
        const nameEl = r.no != null ? h('small', { class: 'pnm' }, pr.names && r.name ? r.name : '') : teamOnly ? null : h('small', null, 'だれか');
        const row = h('div', { class: 'prow' + (r.no == null ? ' unk' : '') + (teamOnly ? ' teamonly' : ''), dataset: { no } },
          h('div', { class: 'pno' }, h('b', null, r.no != null ? r.no : teamOnly ? 'チーム' : '？'), nameEl, r.no != null ? h('small', { class: 'ptag' }) : null));
        types.forEach((type) => row.append(btn(tm, r.no, type, `${ST.teamName(g, tm)} ${who} ${sp.TYPE[type].label}`)));
        if (r.no != null) Pn.rows.set(r.no, { row, name: r.name, tag: row.querySelector('.ptag'), nm: nameEl });
        Pn.roster.append(row);
      });
    }
    function btn(tm, no, type, aria, teamRow) {
      const d = sp.TYPE[type];
      const cnt = h('i', { class: 'cnt', hidden: true });
      const lab = d.btnShort ? [h('b', { class: 'bl' }, d.btn), h('b', { class: 'bs' }, d.btnShort)] : h('b', null, d.btn);
      const col = d.col || '#475569';
      const el = h('button', { class: 'pb k-' + d.kind + (d.kind === 'miss' ? ' miss' : '') + (d.btn === '×' ? ' x1' : ''), dataset: { type, no: no == null ? '' : no }, style: { '--bc': col, '--bink': ST.inkOn(col) }, 'aria-label': aria }, lab, cnt);
      L.btns.push({ team: tm, type, key: tm + ':' + (no == null ? '' : no) + ':' + type, el, cnt, teamRow: !!teamRow });
      return el;
    }

    /* 画面の大きさに合わせて並べ方を決める */
    function layout() {
      if (!rootEl.isConnected) return;
      rootEl.classList.toggle('short', (rootEl.clientHeight || root.innerHeight) < 430);
      const types = sp.rowTypes(ctx.sprefs, period());
      const weights = types.map((x) => sp.weight(x));
      const spec = ST.rowSpec(weights);
      const n = [L.panels[0].n, L.panels[1].n], headH = L.panels[0].head.offsetHeight || 24;
      const plan = ST.planLayout(P.clientWidth, P.clientHeight, n, headH, spec);
      const cols = weights.map((w) => `minmax(0, ${w}fr)`).join(' ');
      rootEl.classList.toggle('lay-side', plan.arr !== 'stack');
      rootEl.classList.toggle('lay-stack', plan.arr === 'stack');
      L.plan = plan;
      // 上下に重ねるとき：行の少ないチーム（相手の「チーム」の行だけ など）は、その行が楽に押せる高さに決め、残りを多いほうに
      const small = plan.arr === 'stack' ? plan.teams.map((T) => T.r <= 3 && plan.teams.some((o) => o.r > T.r * 2)) : [false, false];
      plan.teams.forEach((T, tm) => {
        const sec = L.panels[tm].sec;
        sec.style.flex = small[tm] ? `0 0 ${Math.ceil(T.base + T.r * Math.min(ST.LAYOUT.rmax, Math.max(T.rowH, 44)))}px` : '';
        const unit = Math.max(ST.LAYOUT.rmin, Math.min(T.bw, T.rowH));
        sec.style.setProperty('--cols', cols);
        sec.style.setProperty('--c', T.c);
        sec.style.setProperty('--r', T.r);
        sec.style.setProperty('--nw', T.nw + 'px');
        sec.style.setProperty('--base', Math.ceil(T.base) + 'px');
        const bf = Math.round(ST.clamp(unit * 0.42, 13, 24));
        sec.style.setProperty('--bf', bf + 'px');
        sec.style.setProperty('--nf', Math.round(ST.clamp(Math.min(Math.max(T.rowH, ST.LAYOUT.rmin) * 0.56, T.nw * 0.5), 14, 30)) + 'px');
        sec.classList.toggle('roomy', T.rowH >= 40 && T.nw >= 46);
        sec.classList.toggle('narrowb', (T.bwMin || T.bw) < 48);
        sec.classList.toggle('scroll', T.rowH < ST.LAYOUT.rmin);
        // ボタンごとの文字の大きさ：その幅に、呼び名（「ゴール」「タイムアウト」）が入る大きさ。小さくなりすぎるときは短い呼び名（btnShort）
        const ttypes = sp.teamTypesOf(ctx.sprefs, period());
        const teamBw = ttypes.length ? (T.cellW - T.nw - ttypes.length * ST.LAYOUT.bgap) / ttypes.length : 0;
        L.btns.filter((b) => b.team === tm).forEach((b) => {
          const d = sp.TYPE[b.type];
          const w = (b.teamRow ? teamBw : T.bw * sp.weight(b.type)) - (d.kind === 'miss' ? 10 : 6);
          let fz = Math.min(bf, Math.floor(w / textEm(d.btn)));
          const useShort = !!d.btnShort && fz < 12;
          if (useShort) fz = Math.min(bf, Math.floor(w / textEm(d.btnShort)));
          b.el.classList.toggle('useshort', useShort);
          b.el.style.setProperty('--fz', Math.max(9, fz) + 'px');
        });
      });
    }

    let lastClock = '', lastPen = '';
    function clockText() {
      if (!g.startedAt) return '0:00';
      const c = sp.clockAt(g, ctx.elapsed());
      if (c.p === sp.SO) return ST.fmtTime(c.sec);
      return c.over ? `${Math.round(c.len / 60)}+${ST.fmtTime(c.over)}` : ST.fmtTime(c.sec);
    }
    function periodText() {
      if (!g.startedAt) return sp.periodName(g.startPeriod || 1);
      const c = sp.clockAt(g, ctx.elapsed());
      if (c.ended) return c.p === 1 ? 'HT' : `${c.name}終了`;
      return c.name;
    }
    /* 退場・一時退場の表示（1 秒ごと） */
    function penaltyView() {
      const t = ctx.elapsed();
      const pen = sp.penalties(g, t);
      const key = JSON.stringify([Array.from(pen.outs), pen.susp.map((x) => [x.team, x.no, Math.ceil(x.rem)]), pen.short]);
      if (key === lastPen) return;
      lastPen = key;
      [0, 1].forEach((tm) => {
        const Pn = L.panels[tm];
        Pn.rows.forEach((r, no) => {
          const s = pen.susp.find((x) => x.team === tm && x.no === no);
          const out = pen.outs.has(tm + ':' + no);
          r.row.classList.toggle('out', out && !s);
          r.row.classList.toggle('susp', !!s);
          r.tag.textContent = s ? ST.fmtTime(s.rem) : out ? '退場' : '';
          if (r.nm) r.nm.hidden = !!(s || out);
        });
        const mine = pen.susp.filter((x) => x.team === tm);
        const n = pen.short[tm];
        Pn.short.hidden = !n;
        if (n) Pn.short.textContent = `−${n}` + (mine.length ? ' ' + ST.fmtTime(Math.min(...mine.map((x) => x.rem))) : '');
      });
    }
    function tick() {
      const s = clockText();
      if (s !== lastClock) { lastClock = s; clock.set(s); const c = g.startedAt ? sp.clockAt(g, ctx.elapsed()) : null; clock.el.classList.toggle('over', !!(c && c.over)); clock.el.classList.toggle('paused', !!(c && c.ended)); }
      const pt = periodText();
      if (L.period.textContent !== pt) { L.period.textContent = pt; L.period.classList.toggle('brk', pt.length > 3); }
      if (g.startedAt) penaltyView();
    }
    function update(bump) {
      if (rowKey() !== L.rowKey) { fillAll(); layout(); }
      startB.update();
      lastClock = ''; lastPen = '';
      tick();
      const sc = sp.score(g), so = sp.soScore(g);
      L.score[0].parentNode.classList.toggle('big3', Math.max(sc[0], sc[1]) >= 100);
      [0, 1].forEach((tm) => {
        L.score[tm].textContent = sc[tm];
        L.panels[tm].tsc.textContent = sc[tm];
        if (bump === tm) { ctx.flash(L.score[tm]); ctx.flash(L.panels[tm].tsc); }
      });
      L.so.hidden = !so;
      if (so) L.so.textContent = `${sp.shootoutShort} ${so[0]}−${so[1]}`;
      const tl = ST.tally(g);
      L.btns.forEach((b) => { const c = tl[b.key] || 0; setCnt(b.cnt, c); });
      (sp.globalTypes || []).forEach((type) => setCnt(L.gb[type].cnt, tl['*:' + type] || 0));
      // 累積ファウル（フットサル）：5つで黄・6つ目から赤（第2PK）
      const f = g.startedAt ? sp.foulsNow(g, ctx.elapsed()) : null;
      [0, 1].forEach((tm) => {
        const el = L.panels[tm].fouls;
        el.hidden = !sp.teamFoul;
        if (!sp.teamFoul) return;
        const n = f ? f[tm] : 0;
        el.textContent = `累積${n}`;
        el.classList.toggle('w', n >= sp.teamFoul.warn && n < sp.teamFoul.limit);
        el.classList.toggle('x', n >= sp.teamFoul.limit);
      });
    }
    fillAll();
    L.update = update;
    L.layout = layout;
    L.tick = tick;
    L.refresh = () => { fillAll(); layout(); };
    L.fillRoster = (tm) => { fillRoster(tm); L.rowKey = rowKey(); layout(); update(); };
    return L;
  }
  /* 文字の幅（全角 1・半角 0.62。文字の大きさの何倍か） */
  function textEm(s) { let w = 0; for (const ch of String(s || '')) w += /[\x20-\x7e]/.test(ch) ? 0.62 : 1; return Math.max(1.2, w); }
  function setCnt(el, n) {
    const s = n ? String(n) : '';
    if (el.textContent !== s) el.textContent = s;
    el.hidden = !n;
  }
  function onClick(ctx, L, e) {
    const b = e.target.closest('button');
    if (!b) return;
    const sec = b.closest('.team');
    if (!sec) return;
    const tm = Number(sec.dataset.team);
    if (b.dataset.type) ctx.record({ type: b.dataset.type, team: tm, no: b.dataset.no === '' ? null : b.dataset.no }, b);
    else if (b.dataset.add) openKeypad(ctx, L, tm);
  }

  /* ---------- ピリオド（前半を終える・後半を始める・延長・PK戦） ---------- */
  function openPeriod(ctx) {
    const g = ctx.game, sp = ctx.sport;
    const started = !!g.startedAt;
    const SO = sp.SO;
    const all = [1, 2, 3, 4].concat(sp.shootout ? [SO] : []);
    const startP = (p) => {
      s.close();
      if (!started) { g.startPeriod = p; ctx.save(); ctx.update(); return; }
      const ev = ST.addEvent(g, { t: ctx.elapsed(), type: 'period', period: p });
      ctx.S.redo = [];
      ctx.save(); ctx.feel('made'); ctx.update();
      ctx.say(`${sp.periodName(p)}を始めました（${ST.fmtTime(ev.t)}）`, 'ok');
    };
    const endP = (p) => {
      s.close();
      const ev = ST.addEvent(g, { t: ctx.elapsed(), type: 'pend', period: p });
      ctx.S.redo = [];
      ctx.save(); ctx.feel('made'); ctx.update();
      ctx.say(`${sp.periodName(p)}を終えました（${ST.fmtTime(ev.t)}）`, 'ok');
    };
    let body;
    if (!started) {
      body = h('div', { class: 'periodbox' },
        h('div', { class: 'row pgrid' }, all.map((p) => h('button', { class: 'btn' + (p === (g.startPeriod || 1) ? ' on' : ''), onclick: () => startP(p) }, sp.periodName(p)))),
        h('p', { class: 'note' }, 'スタートを押したときのピリオドです（途中から記録するときに）。'));
    } else {
      const c = sp.clockAt(g, ctx.elapsed());
      const next = c.p === SO ? null : c.p >= 4 ? (sp.shootout ? SO : null) : c.p + 1;
      const mains = [];
      if (!c.ended && c.p !== SO) mains.push(h('button', { class: 'btn primary huge', id: 'btnEndPeriod', onclick: () => endP(c.p) }, `${c.name}を終える`));
      if (next) mains.push(h('button', { class: 'btn huge' + (c.ended ? ' primary' : ''), id: 'btnNextPeriod', onclick: () => startP(next) }, `${sp.periodName(next)}を始める`));
      if (c.p === 2 && sp.shootout) mains.push(h('button', { class: 'btn huge', id: 'btnShootout', onclick: () => startP(SO) }, `${sp.shootout}を始める`));
      body = h('div', { class: 'periodbox' }, mains,
        h('div', { class: 'row pgrid' }, all.filter((p) => p !== c.p && p !== next && !(c.p === 2 && p === SO)).map((p) => h('button', { class: 'btn', onclick: () => startP(p) }, `${sp.periodName(p)}にする`))),
        h('p', { class: 'note' }, `ピリオドが始まる瞬間・終わる瞬間（笛）に押します。時計は「いまのピリオドが始まってからの時間」で、${sp.periodName(1)}の長さ（${g.opts.len}分）を過ぎると「${g.opts.len}+0:30」のように出ます。押し忘れても、あとで「記録の一覧」で時刻を直せます（それより後の記録は、自動でそのピリオドになります）。`));
    }
    const s = ST.ui.sheet({ title: started ? `ピリオド（いまは ${sp.clockAt(g, ctx.elapsed()).name}）` : '始めるピリオド', body });
  }

  /* ---------- 番号を足す（記録の途中で、名簿にない番号が出たとき） ---------- */
  function openKeypad(ctx, L, tm) {
    const g = ctx.game;
    let val = '';
    const disp = h('div', { class: 'kdisp', id: 'kdisp' }, '　');
    const show = () => { disp.textContent = val ? '#' + val : '番号を入れる'; disp.classList.toggle('empty', !val); };
    const press = (k) => {
      if (k === '⌫') val = val.slice(0, -1);
      else if (k === '00') val = '00';
      else if (val === '00' || val.length >= 2) val = k;
      else val = val === '0' ? k : val + k;
      show();
    };
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', '⌫'];
    const s = ST.ui.sheet({
      title: `${ST.teamName(g, tm)} の背番号を足す`, cls: 'keypad',
      body: h('div', null, disp, h('div', { class: 'keys' }, keys.map((k) => h('button', { class: 'key', dataset: { key: k }, onclick: () => press(k) }, k))),
        h('p', { class: 'note' }, '足した番号の行が、番号の順のところに入ります。')),
      foot: [h('button', { class: 'btn', onclick: () => s.close() }, 'やめる'), h('button', { class: 'btn primary', id: 'btnKeyOk', onclick: () => {
        const no = ST.normNo(val);
        if (no == null) { ST.ui.toast('0〜99 の番号を入れてください', 'warn'); return; }
        const t = g.teams[tm];
        const had = t.players.some((p) => p.no === no);
        if (!had) t.players = ST.cleanPlayers(t.players.concat([{ no, name: '' }]));
        ctx.save();
        s.close();
        L.fillRoster(tm);
        ctx.say(had ? `#${no} はもう並んでいます` : `#${no} を足しました`, had ? 'warn' : 'ok');
      } }, '足す')]
    });
    show();
  }

  /* ---------- 集計 ---------- */
  function stats(ctx, g) {
    const sp = ST.sportOf(g);
    const st = sp.stats(g);
    const per = sp.periodScores(g);
    const cols = sp.usedCols(st);
    const so = sp.soScore(g);
    const chip = (tm) => h('i', { class: 'chip', style: { background: g.teams[tm].color } });
    const table = (x) => {
      const rows = x.rows.filter((r) => !sp.isEmpty(r));
      const idle = x.rows.filter((r) => sp.isEmpty(r));
      return h('div', { class: 'boxwrap' }, h('table', { class: 'box' },
        h('thead', null, h('tr', null, h('th', null, '#'), h('th', { class: 'nm' }, '名前'), cols.map((c) => h('th', null, c.label)))),
        h('tbody', null,
          rows.map((r) => h('tr', null, h('td', { class: 'no' }, r.no), h('td', { class: 'nm' }, r.name || ''), cols.map((c) => h('td', null, sp.colValue(c, r))))),
          !sp.isEmpty(x.unknown) ? h('tr', { class: 'unk' }, h('td', { class: 'no' }, '—'), h('td', { class: 'nm' }, '番号なし・チーム'), cols.map((c) => h('td', null, sp.colValue(c, x.unknown)))) : null,
          h('tr', { class: 'tot' }, h('td', { class: 'no' }), h('td', { class: 'nm' }, '合計'), cols.map((c) => h('td', null, sp.colValue(c, x.total)))))),
        idle.length ? h('p', { class: 'note' }, `記録なし：${idle.map((r) => '#' + r.no).join(' ')}`) : null);
    };
    const pf = sp.teamFouls(g);
    const foulTable = sp.teamFoul && pf.size ? h('div', { class: 'boxwrap' }, h('table', { class: 'per fouls', id: 'teamFouls' },
      h('thead', null, h('tr', null, h('th', null, sp.teamFoul.label), Array.from(pf.keys()).sort().map((p) => h('th', null, p === 2 && sp.teamFoul.carry ? `${sp.periodName(2)}（延長も）` : sp.periodName(p))))),
      h('tbody', null, [0, 1].map((tm) => h('tr', null, h('th', null, chip(tm), ST.teamName(g, tm)),
        Array.from(pf.keys()).sort().map((p) => { const f = pf.get(p)[tm]; return h('td', { class: f >= sp.teamFoul.limit ? 'bonus' : null }, String(f)); })))))) : null;
    // シュートの決定率（シュートを数える種目）
    const shotLine = (tm) => {
      const t = st[tm].total.c;
      const made = (sp.TYPES || []).filter((d) => d.shot && d.kind === 'made').reduce((m, d) => m + (t[d.id] || 0), 0);
      const all = (sp.TYPES || []).filter((d) => d.shot).reduce((m, d) => m + (t[d.id] || 0), 0);
      return all ? `・シュート ${all}本（決定率 ${ST.pct(made, all)}）` : '';
    };
    const kickLine = (tm) => {
      const t = st[tm].total.c;
      const made = (sp.TYPES || []).filter((d) => d.kick && d.kind === 'made').reduce((m, d) => m + (t[d.id] || 0), 0);
      const all = (sp.TYPES || []).filter((d) => d.kick).reduce((m, d) => m + (t[d.id] || 0), 0);
      const anyMiss = (sp.TYPES || []).some((d) => d.kick && d.kind === 'miss' && t[d.id]);
      return all && anyMiss ? `・キック ${made}/${all}（成功率 ${ST.pct(made, all)}）` : '';
    };
    const tl = ST.tally(g);
    const free = (sp.globalTypes || []).filter((x) => tl['-::' + x]).map((x) => `${sp.TYPE[x].label} ${tl['-::' + x]}`).join('・');
    return h('div', null,
      h('div', { class: 'boxwrap' }, h('table', { class: 'per' },
        h('thead', null, h('tr', null, h('th', null, ''), per.map((p) => h('th', null, p.label)), h('th', null, '計'), so ? h('th', null, sp.shootout) : null)),
        h('tbody', null, [0, 1].map((tm) => h('tr', null, h('th', null, chip(tm), ST.teamName(g, tm)), per.map((p) => h('td', null, String(p.pts[tm]))), h('td', { class: 'sum' }, String(sp.score(g)[tm])), so ? h('td', { class: 'sum' }, String(so[tm])) : null))))),
      foulTable,
      [0, 1].map((tm) => h('section', { class: 'teamstat' },
        h('h3', null, chip(tm), ST.teamName(g, tm), h('small', null, ` 得点 ${st[tm].total.pts}${shotLine(tm)}${kickLine(tm)}`)),
        table(st[tm]))),
      free ? h('section', { class: 'teamstat free' }, h('h3', null, h('i', { class: 'chip neutral' }), 'チームなし'), h('p', { class: 'freeline' }, free)) : null,
      h('p', { class: 'note' }, (sp.statsNote || '「成功/打った数」は、失敗のボタン（×）も使ったときに出ます。') + '時刻は「記録の一覧」で確かめられます。'));
  }

  ST.addView('team', { build, stats });
})(typeof window !== 'undefined' ? window : globalThis);
