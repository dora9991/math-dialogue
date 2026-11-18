/* スポーツ タップ記録 — バレーボールの画面
   上の帯：時計（スタートからの時間）・いまのセット・いまのセットの点（大きく。🏐 がサーブのチーム）・取ったセット数・メニュー
   2つのチーム：選手1人＝1行（背番号＋「アタック」「ブロック」「サーブ」「ミス」）。下に「？」（だれか分からない）と「チーム」の行（得点・タイムアウト）
   チームの帯の「🏐」：サーブのチームの印。押すと、そのチームのサーブに入れかえる（'srv' の記録）
   下の帯：★ あとで見る・いま記録したもの・取り消す
   並べ方は ST.planLayout（チームの種目と同じ）。点・セット・サーブ権は、記録から計算する（sp.replay）。 */
(function (root) {
  'use strict';
  const ST = root.ST;
  const { h } = ST.ui;

  function build(ctx) {
    const g = ctx.game, sp = ctx.sport;
    const L = { panels: [], btns: [], gb: {}, rowKey: '', rallies: -1 };
    const clock = ctx.ui.clockBtn();
    const startB = ctx.ui.startBtn();
    // 「第1セット」と、取ったセット数（2段）。押すと、セットごとの点の小窓
    L.setLab = h('span', { class: 'setlab', id: 'setLabel' }, '第1セット');
    L.sets = h('b', { class: 'setsc', id: 'setScore' }, '0−0');
    L.setBtn = h('button', { class: 'period setbtn', id: 'btnSet', 'aria-label': 'セット（取ったセット数）', onclick: () => openSets(ctx) }, L.setLab, L.sets);
    L.score = [0, 1].map((tm) => h('span', { class: 'sc', id: 'score' + tm, style: { '--tc': g.teams[tm].color, '--tink': ST.inkOn(g.teams[tm].color) } }, '0'));
    const bar = h('header', { class: 'lbar' }, clock.el, startB.el, L.setBtn,
      h('div', { class: 'score', 'aria-label': 'いまのセットの点' }, L.score[0], h('span', { class: 'dash' }, '−'), L.score[1]),
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
    const rootEl = h('div', { class: 'live fam-volley' }, bar, h('div', { class: 'stagewrap' }, P, ctx.ui.cover()), ctx.ui.footer(gl));
    rootEl.addEventListener('click', (e) => onClick(ctx, L, e));
    L.root = rootEl;

    function buildPanel(tm) {
      const t = g.teams[tm];
      const tsc = h('span', { class: 'tsc' }, '0');
      const srv = h('button', { class: 'srvb', dataset: { srv: String(tm) }, title: 'サーブの印（押すと、このチームのサーブに入れかえる）', 'aria-label': `${ST.teamName(g, tm)} のサーブにする` }, '🏐');
      const head = h('div', { class: 'thead' }, srv, h('b', { class: 'tname' }, ST.teamName(g, tm)), tsc,
        h('button', { class: 'tadd', dataset: { add: '1' }, title: '名簿にない背番号を足す', 'aria-label': `${ST.teamName(g, tm)} の背番号を足す` }, '＋番号'));
      const roster = h('div', { class: 'roster', role: 'group', 'aria-label': `${ST.teamName(g, tm)} の選手` });
      const sec = h('section', { class: 'team', id: 'panel' + tm, dataset: { team: tm }, style: { '--tc': t.color, '--tink': ST.inkOn(t.color) } }, head, roster);
      L.panels[tm] = { sec, head, tsc, srv, roster, n: 0 };
      return sec;
    }
    function rowKey() { return sp.rowTypes(ctx.sprefs).join(',') + '|' + sp.teamTypesOf(ctx.sprefs).join(',') + '|' + (ctx.sprefs.unknown !== false) + '|' + g.teams.map((t) => t.players.map((p) => p.no + p.name).join('.')).join('/'); }
    function fillAll() {
      L.btns = [];
      [0, 1].forEach((tm) => fillRoster(tm));
      L.rowKey = rowKey();
    }
    function fillRoster(tm) {
      const Pn = L.panels[tm], pr = ctx.sprefs;
      Pn.roster.innerHTML = '';
      L.btns = L.btns.filter((b) => b.team !== tm);
      const types = sp.rowTypes(pr), ttypes = sp.teamTypesOf(pr);
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
        const nameEl = r.no != null ? (pr.names && r.name ? h('small', { class: 'pnm' }, r.name) : null) : teamOnly ? null : h('small', null, 'だれか');
        const row = h('div', { class: 'prow' + (r.no == null ? ' unk' : '') + (teamOnly ? ' teamonly' : ''), dataset: { no } },
          h('div', { class: 'pno' }, h('b', null, r.no != null ? r.no : teamOnly ? 'チーム' : '？'), nameEl));
        types.forEach((type) => row.append(btn(tm, r.no, type, `${ST.teamName(g, tm)} ${who} ${sp.TYPE[type].label}`)));
        Pn.roster.append(row);
      });
    }
    function btn(tm, no, type, aria, teamRow) {
      const d = sp.TYPE[type];
      const cnt = h('i', { class: 'cnt', hidden: true });
      const lab = d.btnShort ? [h('b', { class: 'bl' }, d.btn), h('b', { class: 'bs' }, d.btnShort)] : h('b', null, d.btn);
      const col = d.col || '#475569';
      const el = h('button', { class: 'pb k-' + d.kind + (d.kind === 'miss' ? ' miss' : ''), dataset: { type, no: no == null ? '' : no }, style: { '--bc': col, '--bink': ST.inkOn(col) }, 'aria-label': aria }, lab, cnt);
      L.btns.push({ team: tm, type, key: tm + ':' + (no == null ? '' : no) + ':' + type, el, cnt, teamRow: !!teamRow });
      return el;
    }

    /* 画面の大きさに合わせて並べ方を決める（チームの種目と同じ） */
    function layout() {
      if (!rootEl.isConnected) return;
      rootEl.classList.toggle('short', (rootEl.clientHeight || root.innerHeight) < 430);
      const types = sp.rowTypes(ctx.sprefs);
      const weights = types.map(() => 1);
      const spec = ST.rowSpec(weights);
      const n = [L.panels[0].n, L.panels[1].n], headH = L.panels[0].head.offsetHeight || 24;
      const plan = ST.planLayout(P.clientWidth, P.clientHeight, n, headH, spec);
      const cols = weights.map((w) => `minmax(0, ${w}fr)`).join(' ');
      rootEl.classList.toggle('lay-side', plan.arr !== 'stack');
      rootEl.classList.toggle('lay-stack', plan.arr === 'stack');
      L.plan = plan;
      const ttypes = sp.teamTypesOf(ctx.sprefs);
      plan.teams.forEach((T, tm) => {
        const sec = L.panels[tm].sec;
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
        sec.classList.toggle('narrowb', (T.bwMin || T.bw) < 56);       // 回数は文字の下に（右上だと「アタ」に重なるため）
        sec.classList.toggle('scroll', T.rowH < ST.LAYOUT.rmin);
        // ボタンごとの文字の大きさ（「アタック」が入る大きさ。小さくなりすぎるときは短い呼び名）
        const teamBw = ttypes.length ? (T.cellW - T.nw - ttypes.length * ST.LAYOUT.bgap) / ttypes.length : 0;
        L.btns.filter((b) => b.team === tm).forEach((b) => {
          const d = sp.TYPE[b.type];
          const w = (b.teamRow ? teamBw : T.bw) - (d.kind === 'miss' ? 10 : 6);
          let fz = Math.min(bf, Math.floor(w / textEm(d.btn)));
          const useShort = !!d.btnShort && fz < 12;
          if (useShort) fz = Math.min(bf, Math.floor(w / textEm(d.btnShort)));
          b.el.classList.toggle('useshort', useShort);
          b.el.style.setProperty('--fz', Math.max(9, fz) + 'px');
        });
      });
    }

    let lastClock = '';
    function tick() {
      const s = g.startedAt ? ST.fmtTime(ctx.elapsed()) : '0:00';
      if (s !== lastClock) { lastClock = s; clock.set(s); }
    }
    function update() {
      if (rowKey() !== L.rowKey) { fillAll(); layout(); }
      startB.update();
      lastClock = '';
      tick();
      const rp = sp.replay(g);
      const setLabel = rp.done ? '試合終了' : `第${rp.set}セット`;
      if (L.setLab.textContent !== setLabel) L.setLab.textContent = setLabel;
      L.sets.textContent = `${rp.sets[0]}−${rp.sets[1]}`;
      L.sets.title = `取ったセット ${rp.sets[0]}−${rp.sets[1]}`;
      const shown = rp.done && rp.log.length ? rp.log[rp.log.length - 1].pts : rp.pts;
      [0, 1].forEach((tm) => {
        L.score[tm].textContent = shown[tm];
        L.panels[tm].tsc.textContent = shown[tm];
        const serving = !rp.done && rp.server === tm;
        L.score[tm].classList.toggle('srv', serving);
        L.panels[tm].sec.classList.toggle('serving', serving);
        L.panels[tm].srv.classList.toggle('on', serving);
        L.panels[tm].srv.setAttribute('aria-pressed', String(serving));
      });
      // 点が動いたら、点を取ったチームを光らせる
      if (L.rallies >= 0 && rp.rallies.length > L.rallies) {
        const w = rp.rallies[rp.rallies.length - 1].winner;
        ctx.flash(L.score[w]); ctx.flash(L.panels[w].tsc);
      }
      L.rallies = rp.rallies.length;
      const tl = ST.tally(g);
      L.btns.forEach((b) => setCnt(b.cnt, tl[b.key] || 0));
      (sp.globalTypes || []).forEach((type) => setCnt(L.gb[type].cnt, tl['*:' + type] || 0));
    }
    fillAll();
    L.update = update;
    L.layout = layout;
    L.tick = tick;
    L.refresh = () => { fillAll(); layout(); };
    L.fillRoster = (tm) => { fillRoster(tm); L.rowKey = rowKey(); layout(); update(); };
    return L;
  }
  function textEm(s) { let w = 0; for (const ch of String(s || '')) w += /[\x20-\x7e]/.test(ch) ? 0.62 : 1; return Math.max(1.2, w); }
  function setCnt(el, n) {
    const s = n ? String(n) : '';
    if (el.textContent !== s) el.textContent = s;
    el.hidden = !n;
  }

  /* 押したとき：選手のボタン → 記録（セット・試合が決まったら、下の帯で知らせる）／🏐 → サーブを入れかえる／＋番号 */
  function onClick(ctx, L, e) {
    const b = e.target.closest('button');
    if (!b) return;
    const sec = b.closest('.team');
    if (!sec) return;
    const g = ctx.game, sp = ctx.sport;
    const tm = Number(sec.dataset.team);
    if (b.dataset.type) {
      const d = sp.TYPE[b.dataset.type];
      if (d.pt && g.startedAt && !g.endedAt && sp.replay(g).done) {
        ctx.say('試合は決まっています（終えるときは ≡ メニューの「試合を終える」）', 'warn', 6000, { label: '試合を終える', onClick: ctx.endGame });
        return;
      }
      const ev = ctx.record({ type: b.dataset.type, team: tm, no: b.dataset.no === '' ? null : b.dataset.no }, b);
      if (ev && d.pt) announce(ctx, ev);
    } else if (b.dataset.srv != null) setServer(ctx, tm, b);
    else if (b.dataset.add) openKeypad(ctx, L, tm);
  }
  /* セット・試合が決まったことを知らせる */
  function announce(ctx, ev) {
    const g = ctx.game, sp = ctx.sport;
    const rp = sp.replay(g);
    const inf = rp.info[ev.id];
    if (!inf || !inf.ended) return;
    const name = ST.teamName(g, inf.winner);
    if (inf.match) ctx.say(`試合終了：${name}の勝ち（セット ${inf.sets[0]}−${inf.sets[1]}）。≡ メニューの「試合を終える」で集計`, 'ok', 10000, { label: '試合を終える', onClick: ctx.endGame });
    else ctx.say(`第${inf.set}セット ${inf.pts[0]}−${inf.pts[1]} で${name}。次の点から第${inf.set + 1}セット（サーブ：${ST.teamName(g, rp.server)}）`, 'ok', 6000);
  }
  /* サーブを入れかえる（スタート前は、最初のサーブを選ぶ） */
  function setServer(ctx, tm, btn) {
    const g = ctx.game, sp = ctx.sport;
    if (!g.startedAt) { g.opts.first = tm; ctx.save(); ctx.update(); return; }
    if (g.endedAt) { ctx.say('試合は終わっています', 'warn'); return; }
    const rp = sp.replay(g);
    if (rp.server === tm) { ctx.say(`いまは${ST.teamName(g, tm)}のサーブです（入れかえるときは、相手の帯の 🏐）`, 'warn', 4000); return; }
    const ev = ctx.record({ type: 'srv', team: tm }, btn, { key: 'srv:' + tm });
    if (ev) ctx.say(`サーブを${ST.teamName(g, tm)}に入れかえました`, 'ok', 3500);
  }

  /* スタート前の札：最初のサーブを選ぶ */
  function coverExtra(ctx) {
    const g = ctx.game;
    const first = g.opts.first || 0;
    return h('div', { class: 'firstsrv' }, h('b', null, '最初のサーブ：'),
      [0, 1].map((tm) => h('button', { class: 'btn small fsb' + (first === tm ? ' on' : ''), id: 'btnFirst' + tm, 'aria-pressed': String(first === tm), style: { '--tc': g.teams[tm].color }, onclick: () => { g.opts.first = tm; const pr = ctx.sprefs; pr.opts = Object.assign({}, g.opts); ctx.savePrefs(); ctx.save(); ctx.update(); } },
        first === tm ? '🏐 ' : '', ST.teamName(g, tm))));
  }
  /* 試合のあとの札：セットの数と、セットごとの点 */
  function endSummary(ctx) {
    const g = ctx.game, sp = ctx.sport;
    const rp = sp.replay(g);
    return h('div', { class: 'endvb' },
      h('div', { class: 'endscore' }, h('span', null, ST.teamName(g, 0)), h('b', null, `${rp.sets[0]} − ${rp.sets[1]}`), h('span', null, ST.teamName(g, 1))),
      rp.log.length ? h('p', { class: 'note' }, rp.log.map((x) => `第${x.set}セット ${x.pts[0]}−${x.pts[1]}`).join('・')) : null);
  }

  /* セットの小窓（上の帯の「第1セット」） */
  function openSets(ctx) {
    const g = ctx.game, sp = ctx.sport;
    const rp = sp.replay(g);
    const o = g.opts;
    const body = h('div', { class: 'periodbox' },
      setTable(g, rp),
      g.startedAt && !rp.done ? h('p', null, `いま：第${rp.set}セット ${rp.pts[0]}−${rp.pts[1]}・サーブ ${ST.teamName(g, rp.server)}（目標 ${sp.target(o, rp.set)}点）`) : null,
      g.startedAt && !g.endedAt && !rp.done ? h('button', { class: 'btn', id: 'btnSwapSrv', onclick: () => { s.close(); setServer(ctx, 1 - rp.server); } }, `🏐 サーブを${ST.teamName(g, 1 - rp.server)}に入れかえる`) : null,
      h('p', { class: 'note' }, `セットは記録から自動で決まります（${(sp.FMT[o.fmt] || sp.FMT['6']).name}：${sp.target(o, 1)}点${o.sets > 1 && sp.target(o, o.sets) !== sp.target(o, 1) ? '・最終セット' + sp.target(o, o.sets) + '点' : ''}${o.deuce ? '・2点差がつくまで' : ''}）。サーブ権も、ラリーを取ったチームに自動で移ります。違うときは、チームの帯の 🏐 で入れかえます。`));
    const s = ST.ui.sheet({ title: rp.done ? '試合終了' : `第${rp.set}セット`, body });
  }
  function setTable(g, rp) {
    const cols = rp.log.map((x) => ({ label: `第${x.set}セット`, pts: x.pts, win: x.winner }));
    if (!rp.done && (rp.pts[0] || rp.pts[1] || !rp.log.length)) cols.push({ label: `第${rp.set}セット（途中）`, pts: rp.pts, cur: true });
    const chip = (tm) => h('i', { class: 'chip', style: { background: g.teams[tm].color } });
    return h('div', { class: 'boxwrap' }, h('table', { class: 'per vsets', id: 'setTable' },
      h('thead', null, h('tr', null, h('th', null, ''), cols.map((c) => h('th', null, c.label)), h('th', null, 'セット'))),
      h('tbody', null, [0, 1].map((tm) => h('tr', null, h('th', null, chip(tm), ST.teamName(g, tm)),
        cols.map((c) => h('td', { class: c.win === tm ? 'won' : null }, String(c.pts[tm]))), h('td', { class: 'sum' }, String(rp.sets[tm])))))));
  }

  /* ---------- 番号を足す ---------- */
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

  /* ---------- 一覧で直す：サーブ権の記録は、チームを入れかえられる ---------- */
  function editExtra(ctx, e, body, changed) {
    if (e.type !== 'srv') return;
    const g = ctx.game;
    body.append(h('div', { class: 'field' }, h('span', null, 'ここからサーブするチーム'), h('div', { class: 'row' },
      [0, 1].map((tm) => h('button', { class: 'btn' + (e.team === tm ? ' on' : ''), dataset: { eteam: String(tm) }, onclick: () => { if (e.team !== tm) { e.team = tm; changed(); } } },
        h('i', { class: 'chip', style: { background: g.teams[tm].color } }), ST.teamName(g, tm))))));
  }

  /* ---------- 設定：「？」の行 ---------- */
  function settings(ctx, refresh) {
    const pr = ctx.sprefs;
    return h('section', { class: 'field' }, h('span', null, '「？」の行'),
      h('label', { class: 'chk' }, h('input', { type: 'checkbox', dataset: { pref: 'unknown' }, checked: pr.unknown !== false, onchange: (ev) => { pr.unknown = ev.target.checked; ctx.savePrefs(); refresh(); } }),
        '「？」の行を出す（だれか分からないときに、チームだけで記録する）'));
  }

  /* ---------- 集計 ---------- */
  function stats(ctx, g) {
    const sp = ST.sportOf(g);
    const st = sp.stats(g);
    const rp = st.rp;
    const chip = (tm) => h('i', { class: 'chip', style: { background: g.teams[tm].color } });
    const cols = sp.COLS.filter((c) => c.key === 'pts' || st.teams.some((x) => c.f(x.total)));
    const table = (x) => {
      const rows = x.rows.filter((r) => !sp.isEmpty(r));
      const idle = x.rows.filter((r) => sp.isEmpty(r));
      const line = (cls, no, nm, s) => h('tr', { class: cls }, h('td', { class: 'no' }, no), h('td', { class: 'nm' }, nm), cols.map((c) => h('td', null, c.f(s) ? String(c.f(s)) : '')));
      return h('div', { class: 'boxwrap' }, h('table', { class: 'box' },
        h('thead', null, h('tr', null, h('th', null, '#'), h('th', { class: 'nm' }, '名前'), cols.map((c) => h('th', null, c.label)))),
        h('tbody', null,
          rows.map((r) => line(null, r.no, r.name || '', r)),
          !sp.isEmpty(x.unknown) ? line('unk', '—', '番号なし', x.unknown) : null,
          !sp.isEmpty(x.teamRow) ? line('unk', '—', 'チーム', x.teamRow) : null,
          line('tot', '', '合計', x.total))),
        idle.length ? h('p', { class: 'note' }, `記録なし：${idle.map((r) => '#' + r.no).join(' ')}`) : null);
    };
    const rally = (x) => h('div', { class: 'rally' },
      h('span', null, `取ったラリー ${x.won}`),
      h('span', null, `サイドアウト率 ${ST.pct(x.recv.won, x.recv.n)}（${x.recv.won}/${x.recv.n}）`),
      h('span', null, `ブレイク率 ${ST.pct(x.serve.won, x.serve.n)}（${x.serve.won}/${x.serve.n}）`),
      h('span', null, `相手のミスでの得点 ${x.oppErr}`),
      Object.keys(x.tos).length ? h('span', null, `タイムアウト ${Object.keys(x.tos).sort().map((s) => `第${s}セット ${x.tos[s]}`).join('・')}`) : null);
    const tl = ST.tally(g);
    const free = (sp.globalTypes || []).filter((x) => tl['-::' + x]).map((x) => `${sp.TYPE[x].label} ${tl['-::' + x]}`).join('・');
    return h('div', null,
      setTable(g, rp),
      st.teams.map((x) => h('section', { class: 'teamstat' },
        h('h3', null, chip(x.team), ST.teamName(g, x.team), h('small', null, ` セット ${rp.sets[x.team]}・得点 ${x.won}`)),
        rally(x),
        table(x))),
      free ? h('section', { class: 'teamstat free' }, h('h3', null, h('i', { class: 'chip neutral' }), 'チームなし'), h('p', { class: 'freeline' }, free)) : null,
      h('p', { class: 'note' }, '得点は、アタック・ブロック・サーブエース（と、チームの行の「得点」）。ミスは相手の点になった数です。サイドアウト率は相手のサーブのラリーを取った割合、ブレイク率は自分のサーブのラリーを取った割合です。'));
  }

  ST.addView('volley', { build, stats, coverExtra, endSummary, editExtra, settings });
})(typeof window !== 'undefined' ? window : globalThis);
