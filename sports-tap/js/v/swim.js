/* スポーツ タップ記録 — 水泳の画面（準備のレーンと名前・記録の画面・結果）
   上の帯：時計（いまの組のスタートからの時間。0.01 秒）・▶ スタート・「2組目」・種目と距離・メニュー
   レーンの行：レーン番号・名前・何回目のタッチか・スプリットとラップ（ゴールならタイムと順位）・「…」・大きな「タッチ」ボタン
   下の帯：次の組へ・いま記録したもの・取り消す
   次の組の準備ができてスタートを待つ間は、レーンの行の場所に「▶ 2組目 スタート」の札を出す。 */
(function (root) {
  'use strict';
  const ST = root.ST;
  const { h } = ST.ui;
  const SP = () => ST.SPORTS.swim;

  /* いまの組（スタート前・次の組を待っている間は、これから泳ぐ組 game.pending） */
  function stateOf(g, t) {
    const sp = SP();
    if (!g.startedAt) { const p = g.pending || { heat: 1, lanes: sp.cleanLanes([], g.opts.lanes), spec: sp.specOf(g.opts) }; return { before: true, P: p }; }
    if (sp.waiting(g)) return { waiting: true, P: g.pending, H: sp.heatAt(g, t) };
    const H = sp.heatAt(g, t) || sp.heats(g)[0];
    if (!H) return { before: true, P: g.pending || { heat: 1, lanes: sp.cleanLanes([], g.opts.lanes), spec: sp.specOf(g.opts) } };      // （組の始まりの記録がない：直したとき）
    return { H };
  }
  /* 要素を足す（DOM の append は null を「null」という文字にするので、ないものは渡さない） */
  const put = (el, ...kids) => el.append(...kids.filter((k) => k != null && k !== false));
  const raw = (ctx) => (ctx.game.startedAt ? ((ctx.game.endedAt || Date.now()) - ctx.game.startedAt) / 1000 : 0);

  function build(ctx) {
    const g = ctx.game, sp = SP();
    const L = { rows: new Map(), key: '' };
    // 上の帯
    L.tv = h('span', { class: 'swtv', id: 'tval' }, '0.00');
    L.clock = h('button', { class: 'clock swclock', id: 'clock', title: 'いまの組のスタートからの時間', onclick: ctx.openMenu }, h('span', { class: 'recdot' }), L.tv);
    const startB = ctx.ui.startBtn();
    L.heatBtn = h('button', { class: 'period swheat', id: 'btnHeat', 'aria-label': '組', onclick: () => openHeats(ctx, L) }, '1組目');
    L.ev1 = h('b', null, ''); L.ev2 = h('small', null, '');
    L.ev = h('div', { class: 'swev', id: 'swEvent' }, L.ev1, L.ev2);
    const bar = h('header', { class: 'lbar' }, L.clock, startB.el, L.heatBtn, L.ev, ctx.ui.menuBtn());
    // レーン
    L.lanes = h('main', { class: 'swlanes', id: 'swLanes', role: 'group', 'aria-label': 'レーン' });
    L.banner = h('div', { class: 'swbanner', id: 'swBanner', hidden: true });
    L.wait = h('div', { class: 'swwait', id: 'swWait', hidden: true });
    L.next = h('button', { class: 'gb swnext', id: 'btnNextHeat', onclick: () => openNext(ctx, L) }, h('b', null, '次の組へ'), h('small', null, '名前を入れかえる'));
    const rootEl = h('div', { class: 'live fam-swim' + (ctx.sprefs.side === 'left' ? ' sw-left' : '') }, bar,
      h('div', { class: 'stagewrap swstage' }, h('div', { class: 'swcol' }, L.banner, L.lanes, L.wait), ctx.ui.cover()), ctx.ui.footer([L.next]));
    L.root = rootEl;
    rootEl.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b || !L.lanes.contains(b)) return;
      const ln = Number(b.dataset.lane);
      if (b.classList.contains('swtouch')) touch(ctx, L, ln, b);
      else if (b.classList.contains('swmore')) laneMenu(ctx, L, ln);
    });

    /* レーンの行を並べる（組・名前・並び順が変わったとき） */
    function fill() {
      const st = stateOf(g, ctx.elapsed());
      const lanes = st.H && !st.waiting ? st.H.lanes : st.P.lanes;
      const spec = st.H && !st.waiting ? st.H.spec : st.P.spec;
      const circle = spec.mode === 'circle';
      L.lanes.innerHTML = '';
      L.rows = new Map();
      const list = lanes.slice();
      if (ctx.sprefs.order === 'desc') list.reverse();
      list.forEach((ln) => {
        const name = h('b', { class: 'swnm' }, ln.name || (circle ? `${ln.lane}番目に出る人` : `レーン ${ln.lane}`));
        const team = h('small', { class: 'swteam' }, ln.team || '');
        const stat = h('div', { class: 'swstat' });
        const big = h('b', { class: 'swbig' }, circle ? 'ゴール' : 'タッチ');
        const sub = h('small', { class: 'swsub' }, '');
        const btn = h('button', { class: 'swtouch', dataset: { lane: ln.lane }, 'aria-label': `${circle ? ln.lane + '番目' : 'レーン' + ln.lane}${ln.name ? ' ' + ln.name : ''} の${circle ? 'ゴール' : 'タッチ'}` }, big, sub);
        const row = h('div', { class: 'swrow' + (ln.name ? '' : ' noname'), dataset: { lane: ln.lane } },
          h('div', { class: 'swl' }, h('b', null, String(ln.lane)), h('small', null, circle ? '番目' : 'レーン')),
          h('div', { class: 'swinfo' }, h('div', { class: 'swwho' }, name, team), stat),
          h('button', { class: 'swmore', dataset: { lane: ln.lane }, 'aria-label': `レーン${ln.lane}のメニュー（失格・取り消し・名前）` }, '…'),
          btn);
        L.rows.set(ln.lane, { row, stat, big, sub, btn });
        L.lanes.append(row);
      });
      L.key = keyOf();
      layout();
    }
    function keyOf() {
      const st = stateOf(g, ctx.elapsed());
      const x = st.H && !st.waiting ? st.H : null;
      return [st.before ? 'b' : st.waiting ? 'w' + st.P.heat : 'h' + (x ? x.id : ''), JSON.stringify(x ? x.lanes : st.P.lanes), x ? x.spec.mode : st.P.spec.mode, ctx.sprefs.order].join('|');
    }
    function layout() {
      if (!rootEl.isConnected) return;
      const n = Math.max(1, L.rows.size);
      const H = L.lanes.clientHeight || 400;
      const rowH = (H - 8 - (n - 1) * 5) / n;
      rootEl.classList.toggle('short', (rootEl.clientHeight || root.innerHeight) < 430);
      L.lanes.style.setProperty('--rh', Math.max(48, Math.min(130, rowH)) + 'px');
      L.lanes.classList.toggle('tight', rowH < 62);
      L.lanes.classList.toggle('roomy', rowH >= 84);
    }

    /* 表示を書き換える */
    function update() {
      if (keyOf() !== L.key) fill();
      startB.update();
      const t = ctx.elapsed();
      const st = stateOf(g, t);
      const spec = st.H && !st.waiting ? st.H.spec : st.P.spec;
      const hno = st.H && !st.waiting ? st.H.heat : st.P.heat;
      const unit = sp.unitOf(spec);
      L.heatBtn.textContent = `${hno}${unit}目`;
      L.ev1.textContent = sp.specText(spec, true).trim();
      L.ev2.textContent = spec.mode === 'circle' ? `${spec.pool}mプール・${(st.H && !st.waiting ? st.H.lanes : st.P.lanes).length}人` : `${spec.pool}mプール・タッチ${sp.touchesOf(spec)}回`;
      L.lanes.hidden = !!st.waiting;
      L.wait.hidden = !st.waiting;
      if (st.waiting) renderWait(ctx, L, st.P);
      const done = st.H && !st.waiting ? sp.heatDone(g, st.H, t) : false;
      L.next.hidden = !!st.waiting;
      L.next.classList.toggle('ready', !!done);
      L.banner.hidden = !(done && !g.endedAt);
      if (done && !g.endedAt) {
        L.banner.innerHTML = '';
        L.banner.append(h('span', null, `🏁 ${hno}${unit}目 全員が終わりました`), h('button', { class: 'btn small', onclick: ctx.openStats }, '結果を見る'), h('button', { class: 'btn small primary', id: 'btnBannerNext', onclick: () => openNext(ctx, L) }, `次の${unit}へ →`));
      }
      if (!st.waiting) rows(st, t);
      tickClock();
      layout();          // （上の「全員が終わりました」の帯が出る・消えると、行の高さが変わる）
    }
    /* レーンの行の中身 */
    function rows(st, t) {
      const H = st.H && !st.waiting ? st.H : null;
      if (!H) { L.rows.forEach((r) => { r.stat.textContent = st.before ? 'スタート前' : ''; r.sub.textContent = ''; }); return; }
      const rs = sp.results(g, H);
      if (H.spec.mode === 'circle') {
        rs.forEach((x, idx) => {
          const r = L.rows.get(x.lane);
          if (!r) return;
          const now = sp.circleNow(H, idx, t, x);
          const last = x.reps.filter((y) => y.time != null).pop();
          r.row.classList.toggle('flag', !!x.flag);
          r.row.classList.toggle('done', !x.flag && x.done >= H.spec.reps);
          r.stat.innerHTML = '';
          if (x.flag) { r.stat.append(h('span', { class: 'swflag' }, sp.FLAG[x.flag])); r.big.textContent = sp.FLAG_SHORT[x.flag]; r.sub.textContent = ''; return; }
          const cur = now.before ? h('span', { class: 'swrun wait' }, `スタートまで ${ST.fmtTime(Math.max(0, now.start - t))}`)
            : now.finished ? h('span', { class: 'swrun fin' }, '全部 泳ぎました')
              : now.swimming ? h('span', { class: 'swrun', dataset: { since: now.start } }, `${now.r}本目 ${ST.fmtRace(t - now.start)}`)
                : h('span', { class: 'swrun wait' }, now.next != null ? `次（${now.r + 1}本目）まで ${ST.fmtTime(Math.max(0, now.next - t))}` : '');
          r.stat.append(cur, h('span', { class: 'swsplit' }, last ? `${last.r}本目 ${ST.fmtRace(last.time)}` : '', x.avg != null ? h('small', null, ` 平均 ${ST.fmtRace(x.avg)}`) : null));
          r.big.textContent = x.done >= H.spec.reps ? '✓' : 'ゴール';
          r.sub.textContent = `${x.done}/${H.spec.reps}本`;
        });
        return;
      }
      rs.forEach((x) => {
        const r = L.rows.get(x.lane);
        if (!r) return;
        r.row.classList.toggle('flag', !!x.flag);
        r.row.classList.toggle('done', x.done && !x.flag);
        if (x.done || x.flag) r.row.classList.remove('last');
        r.row.classList.toggle('first', x.rank === 1 && !x.flag);
        r.stat.innerHTML = '';
        if (x.flag) {
          put(r.stat, h('span', { class: 'swflag' }, sp.FLAG[x.flag]), x.done ? h('small', null, ` ${ST.fmtRace(x.time)}`) : null);
          r.big.textContent = sp.FLAG_SHORT[x.flag]; r.sub.textContent = '';
          return;
        }
        if (x.done) {
          put(r.stat, h('span', { class: 'swtime' }, ST.fmtRace(x.time)), h('span', { class: 'swrank' }, `${x.rank}位`),
            x.need > 1 ? h('small', { class: 'swlaps' }, x.laps.map((l) => ST.fmtRace(l)).join(' / ')) : null);
          r.big.textContent = '✓'; r.sub.textContent = 'ゴール';
          return;
        }
        const n = x.splits.length;
        if (n) r.stat.append(h('span', { class: 'swsplit' }, `${n * H.spec.pool}m ${ST.fmtRace(x.splits[n - 1])}`), h('small', null, `（ラップ ${ST.fmtRace(x.laps[n - 1])}）`));
        else r.stat.append(h('span', { class: 'swsplit dim' }, 'まだタッチなし'));
        r.row.classList.toggle('last', n + 1 >= x.need);
        r.big.textContent = n + 1 >= x.need ? 'ゴール' : 'タッチ';
        r.sub.textContent = `${n}/${x.need}`;
      });
    }
    /* 時計（いまの組のタイム）：画面の書き換えごとに（0.01 秒まで動いて見えるよう、requestAnimationFrame で） */
    function tickClock() {
      const st = stateOf(g, ctx.elapsed());
      let txt = '0.00';
      const H = st.H && !st.waiting ? st.H : null;
      let paused = !g.startedAt || !!st.waiting || !!g.endedAt;
      if (H) {
        const rs = sp.results(g, H);
        const fin = H.spec.mode !== 'circle' && sp.heatDone(g, H, null) && rs.some((x) => x.done);
        if (fin) { txt = ST.fmtRace(Math.max(...rs.filter((x) => x.done).map((x) => x.time))); paused = true; }
        else txt = ST.fmtRace(Math.max(0, raw(ctx) - H.start));
      }
      if (L.tv.textContent !== txt) L.tv.textContent = txt;
      L.clock.classList.toggle('paused', paused);
      L.clock.hidden = !g.startedAt;
    }
    let rq = 0, lastRows = 0;
    const loop = () => {
      rq = root.requestAnimationFrame ? requestAnimationFrame(loop) : 0;
      if (!rootEl.isConnected) return;
      tickClock();
      // 練習の「泳いでいる時間」「スタートまで」は 0.1 秒ごと
      const now = Date.now();
      if (now - lastRows > 90) { lastRows = now; const st = stateOf(g, ctx.elapsed()); if (st.H && !st.waiting && st.H.spec.mode === 'circle') rows(st, raw(ctx)); }
    };
    if (root.requestAnimationFrame) rq = requestAnimationFrame(loop);
    fill();
    L.update = update;
    L.layout = layout;
    L.tick = () => { tickClock(); const st = stateOf(g, ctx.elapsed()); if (st.H && !st.waiting && st.H.spec.mode === 'circle') rows(st, raw(ctx)); else if (st.H && !st.waiting) { /* レースは記録したときだけ */ } };
    L.refresh = () => { fill(); update(); };
    L.destroy = () => { if (rq && root.cancelAnimationFrame) cancelAnimationFrame(rq); rq = 0; };
    return L;
  }

  /* タッチ（壁にさわった瞬間） */
  function touch(ctx, L, ln, btn) {
    const g = ctx.game, sp = SP();
    if (!ctx.canRecord()) return;
    const t = ctx.elapsed();
    const st = stateOf(g, t);
    if (st.waiting) { ctx.say('先に、次の組の「▶ スタート」を押してください', 'warn'); return; }
    const H = st.H;
    if (!H) return;
    const rs = sp.results(g, H);
    if (H.spec.mode === 'circle') {
      const idx = H.lanes.findIndex((x) => x.lane === ln);
      const x = rs[idx];
      if (!x) return;
      if (x.flag) { ctx.say(`${ln}番目は ${sp.FLAG[x.flag]} にしています（「…」で取り消せます）`, 'warn'); return; }
      const now = sp.circleNow(H, idx, t, x);
      if (now.before) { ctx.say(`${ln}番目は、まだスタートしていません（1本目は ${ST.fmtTime(now.start)} から）`, 'warn'); return; }
      if (x.done >= H.spec.reps && now.finished) { ctx.say(`${ln}番目は、もう ${H.spec.reps}本 泳ぎました`, 'warn'); return; }
    } else {
      const x = rs.find((y) => y.lane === ln);
      if (x && x.flag) { ctx.say(`レーン${ln}は ${sp.FLAG[x.flag]} にしています（「…」で取り消せます）`, 'warn'); return; }
      if (x && x.done) { ctx.say(`レーン${ln}は、もうゴールしています（${ST.fmtRace(x.time)}）`, 'warn'); return; }
    }
    const e = ctx.record({ type: 'touch', lane: ln }, btn, { key: 'touch:' + ln, dedupeMs: 1000 });
    if (e) {
      const info = sp.touchInfo(g, e);
      if (info && info.goal && info.rank === 1) ctx.feel('made');
    }
  }

  /* レーンの「…」：失格・棄権・欠場・いちばん新しいタッチの取り消し・名前 */
  function laneMenu(ctx, L, ln) {
    const g = ctx.game, sp = SP();
    const st = stateOf(g, ctx.elapsed());
    const H = st.H && !st.waiting ? st.H : null;
    const target = H ? H.e.lanes : st.P.lanes;
    const lane = target.find((x) => x.lane === ln) || { lane: ln, name: '', team: '' };
    const body = h('div', { class: 'swsheet' });
    body.append(nameInputs([lane], (i, k, v) => { lane[k] = v; ctx.save(); L.refresh(); }, H && H.spec.mode === 'circle'));
    if (H && g.startedAt) {
      const flags = sp.flagsIn(g, H);
      const f = flags.get(ln);
      const flagBtn = (type) => h('button', { class: 'btn' + (f && f.type === type ? ' on' : ''), dataset: { flag: type }, onclick: () => {
        s.close();
        if (f) ST.removeEvent(g, f.id);
        if (!f || f.type !== type) ctx.record({ type, lane: ln, heat: H.heat }, null, { force: true, nodedupe: true });
        else { ctx.save(); ctx.update(); }
        ctx.say(!f || f.type !== type ? `レーン${ln}：${sp.FLAG[type]}` : `レーン${ln}：${sp.FLAG[type]} を取り消しました`, 'ok');
      } }, f && f.type === type ? `${sp.FLAG[type]} を取り消す` : sp.FLAG[type]);
      body.append(h('div', { class: 'field' }, h('span', null, '失格・棄権・欠場'), h('div', { class: 'row' }, ['dq', 'dnf', 'dns'].map(flagBtn)),
        h('p', { class: 'note' }, '順位から外します（タイムは残ります）。もう一度押すと取り消せます。')));
      const ts = sp.touchesIn(g, H).get(ln) || [];
      if (ts.length) {
        const last = ts[ts.length - 1];
        body.append(h('div', { class: 'field' }, h('span', null, 'タッチ'),
          h('button', { class: 'btn', id: 'btnUndoLane', onclick: () => {
            s.close();
            ST.removeEvent(g, last.id);
            ctx.save(); ctx.update();
            ctx.say(`レーン${ln}のタッチを取り消しました（${ST.fmtRace(last.t - H.start)}）`, 'warn', 5000, { label: '↷ 戻す', onClick: () => { g.events.push(last); ctx.save(); ctx.update(); } });
          } }, `いちばん新しいタッチを取り消す（${ST.fmtRace(last.t - H.start)}）`),
          h('p', { class: 'note' }, '時刻を少しだけ直すときは「≡ メニュー」→「記録の一覧」から。')));
      }
    }
    const s = ST.ui.sheet({ title: `${H && H.spec.mode === 'circle' ? ln + '番目' : 'レーン' + ln}${lane.name ? ' ' + lane.name : ''}`, body, foot: [h('button', { class: 'btn primary', onclick: () => ST.ui.closeSheet() }, 'とじる')] });
  }

  /* 名前・学校の入れる欄。onChange(i, 'name'|'team', 値) */
  function nameInputs(lanes, onChange, circle) {
    return h('div', { class: 'swnames' }, lanes.map((ln, i) => h('div', { class: 'swnrow', dataset: { lane: ln.lane } },
      h('b', { class: 'swnl' }, circle ? `${ln.lane}番目` : `L${ln.lane}`),
      h('input', { type: 'text', class: 'swin-name', maxlength: 16, placeholder: '名前', value: ln.name || '', onchange: (e) => onChange(i, 'name', e.target.value.trim().slice(0, 16)) }),
      h('input', { type: 'text', class: 'swin-team', maxlength: 16, placeholder: '学校など', value: ln.team || '', onchange: (e) => onChange(i, 'team', e.target.value.trim().slice(0, 16)) }))));
  }

  /* 種目・距離などのボタン（準備の画面と同じ選び方）。spec を書きかえて onChange */
  function specButtons(spec, onChange) {
    const sp = SP();
    const box = h('div', { class: 'swspec' });
    const draw = () => {
      box.innerHTML = '';
      sp.optFields.filter((f) => !f.hidden || !f.hidden(spec)).forEach((f) => {
        box.append(h('div', { class: 'field' }, h('span', null, f.label), h('div', { class: 'row optrow', dataset: { opt: f.key } },
          f.choices.map(([v, lab]) => h('button', { class: 'btn small' + (String(spec[f.key]) === String(v) ? ' on' : ''), dataset: { v: String(v) }, onclick: () => { spec[f.key] = v; draw(); if (onChange) onChange(f.key); } }, lab)))));
      });
    };
    draw();
    return box;
  }

  /* 次の組へ（種目・距離・名前を決めて、スタートを待つ） */
  function openNext(ctx, L, edit) {
    const g = ctx.game, sp = SP();
    if (!g.startedAt) { ctx.say('先に「▶ スタート」で1組目を始めてください', 'warn'); return; }
    const t = ctx.elapsed();
    const last = sp.heats(g).slice(-1)[0];
    const editing = edit && sp.waiting(g);
    const base = editing ? g.pending : { heat: sp.lastHeatNo(g) + 1, lanes: last.lanes, spec: last.spec };
    const spec = Object.assign({}, base.spec, { lanes: base.lanes.length });
    let lanes = sp.cleanLanes(base.lanes.map((x) => ({ name: x.name, team: x.team })), spec.lanes);
    const notDone = last && !editing && !sp.heatDone(g, last, t);
    const namesBox = h('div');
    const drawNames = () => {
      lanes = sp.cleanLanes(lanes, spec.lanes);
      namesBox.innerHTML = '';
      namesBox.append(nameInputs(lanes, (i, k, v) => { lanes[i][k] = v; }, spec.mode === 'circle'));
    };
    const unit = sp.unitOf(spec);
    const body = h('div', { class: 'swsheet swnext-sheet' },
      notDone ? h('p', { class: 'note warn' }, `⚠ ${last.heat}${sp.unitOf(last.spec)}目に、まだ終わっていないレーンがあります（このまま次へ進めます。あとからでもタッチは直せます）。`) : null,
      h('h4', null, '種目・距離'),
      specButtons(spec, (key) => { if (key === 'lanes' || key === 'mode') drawNames(); }),
      h('h4', null, '名前'),
      h('div', { class: 'row' },
        h('button', { class: 'btn small', id: 'btnSameNames', onclick: () => { lanes = sp.cleanLanes(last.lanes.map((x) => ({ name: x.name, team: x.team })), spec.lanes); drawNames(); } }, '前の組と同じ名前'),
        h('button', { class: 'btn small', id: 'btnClearNames', onclick: () => { lanes = sp.cleanLanes([], spec.lanes); drawNames(); } }, '名前を消す')),
      namesBox);
    drawNames();
    ST.ui.sheet({
      title: editing ? `${base.heat}${unit}目を直す` : `次の組（${base.heat}${unit}目）`, wide: true, body,
      foot: [h('button', { class: 'btn', onclick: () => ST.ui.closeSheet() }, 'やめる'),
        h('button', { class: 'btn primary', id: 'btnNextReady', onclick: () => {
          const s2 = sp.specOf(spec);
          g.pending = { heat: base.heat, lanes: sp.cleanLanes(lanes, spec.lanes), spec: s2 };
          Object.assign(g.opts, s2, { lanes: spec.lanes });
          const pr = ctx.sprefs;
          pr.lanes = sp.cleanLanes(lanes, sp.MAXLANES).map((x) => ({ name: x.name, team: x.team }));
          ctx.savePrefs();
          ctx.save();
          ST.ui.closeSheet();
          L.refresh();
          ctx.say(`${base.heat}${sp.unitOf(s2)}目の準備ができました。スタートの合図で「▶ スタート」`, 'ok', 4000);
        } }, '準備できた（スタートを待つ）')]
    });
  }
  /* 次の組のスタートを待つ札 */
  function renderWait(ctx, L, P) {
    const g = ctx.game, sp = SP();
    const unit = sp.unitOf(P.spec);
    L.wait.innerHTML = '';
    const named = P.lanes.filter((x) => x.name);
    L.wait.append(h('div', { class: 'cover-card swwaitcard' },
      h('b', { class: 'endtitle' }, `${P.heat}${unit}目：${sp.specText(P.spec)}`),
      h('p', { class: 'note' }, P.spec.mode === 'circle' ? `${P.spec.pool}mプール・${P.lanes.length}人` : `${P.spec.pool}mプール・タッチ${sp.touchesOf(P.spec)}回・${P.lanes.length}レーン`),
      named.length ? h('p', { class: 'swwaitnames' }, named.map((x) => `L${x.lane} ${x.name}`).join('　')) : null,
      h('button', { class: 'startbig', id: 'btnHeatStart', onclick: (e) => {
        const ev = ctx.record(Object.assign({ type: 'heat', heat: P.heat, lanes: sp.cleanLanes(P.lanes) }, P.spec), e.currentTarget, { key: 'heat:' + P.heat, dedupeMs: 1500 });
        if (ev) { L.refresh(); ctx.say(`${P.heat}${unit}目 スタート`, 'ok'); }
      } }, `▶ ${P.heat}${unit}目 スタート`),
      h('p', null, h('b', null, 'スタートの合図（ピッ）の瞬間'), 'に押してください。'),
      h('div', { class: 'row center' },
        h('button', { class: 'btn small', onclick: () => openNext(ctx, L, true) }, '種目・名前を直す'),
        h('button', { class: 'btn small', id: 'btnCancelNext', onclick: () => { g.pending = null; ctx.save(); L.refresh(); ctx.say('前の組に戻りました', 'ok'); } }, `やめる（${P.heat - 1}${unit}目に戻る）`))));
  }

  /* 組の一覧（上の帯の「2組目」） */
  function openHeats(ctx, L) {
    const g = ctx.game, sp = SP();
    const hs = sp.heats(g);
    const s = ST.ui.sheet({
      title: '組', wide: true,
      body: h('div', { class: 'swsheet' },
        hs.length ? h('div', { class: 'loglist' }, hs.map((H) => {
          const rs = sp.activeRows(sp.results(g, H));
          const top = H.spec.mode === 'circle' ? `${rs.length}人` : rs.filter((x) => x.rank === 1).map((x) => `1位 ${x.name || 'L' + x.lane} ${ST.fmtRace(x.time)}`).join('・') || `${rs.length}人`;
          return h('div', { class: 'lrow per swhrow' }, h('b', { class: 'lt' }, `${H.heat}${sp.unitOf(H.spec)}目`), h('span', null, `${sp.specText(H.spec)}（${ST.fmtTime(H.start)} スタート）・${top}`));
        })) : h('p', { class: 'note' }, 'まだ始まっていません。'),
        sp.waiting(g) ? h('p', { class: 'note' }, `${g.pending.heat}${sp.unitOf(g.pending.spec)}目：スタート待ち（${sp.specText(g.pending.spec)}）`) : null),
      foot: [h('button', { class: 'btn', onclick: () => { s.close(); ctx.openStats(); } }, '📊 結果'),
        g.startedAt && !sp.waiting(g) ? h('button', { class: 'btn primary', onclick: () => { s.close(); openNext(ctx, L); } }, '次の組へ') : null,
        h('button', { class: 'btn', onclick: () => ST.ui.closeSheet() }, 'とじる')]
    });
  }

  /* ---------- 準備の画面：レーンと名前 ---------- */
  function setup(ctx, T, o) {
    const sp = SP();
    const edit = o && o.edit;
    const target = () => {
      if (!edit) return null;
      const g = T;
      if (g.startedAt && !sp.waiting(g)) { const last = sp.heats(g).slice(-1)[0]; return last ? last.e : null; }
      return g.pending || null;
    };
    const lanesOf = () => {
      if (!edit) return T.lanes;
      const x = target();
      return x ? x.lanes : [];
    };
    const card = h('section', { class: 'card swsetup', id: 'swSetup' });
    const draw = () => {
      card.innerHTML = '';
      const circle = T.opts.mode === 'circle';
      const n = T.opts.lanes;
      if (!edit) T.lanes = sp.cleanLanes(T.lanes, sp.MAXLANES);
      else { const x = target(); if (x) x.lanes = sp.cleanLanes(x.lanes, n); }
      const shown = lanesOf().slice(0, n);
      card.append(...[h('h2', null, circle ? `泳ぐ人（${n}人・スタートの順）` : `レーンと名前（${n}レーン）`),
        h('p', { class: 'note' }, circle ? '同じレーンで、上から順にスタートします（ずれは「人ごとのスタートのずれ」）。名前はなくても大丈夫です。' : '名前・学校は、なくても大丈夫です（入れた名前は、次の計測でも入っています）。2組目からは、記録の画面の「次の組へ」で入れかえます。'),
        edit && T.startedAt ? h('p', { class: 'note' }, `いまの組（${sp.heats(T).length ? sp.heats(T).slice(-1)[0].heat : 1}${sp.unitOf(T.opts)}目）の名前を直します。`) : null,
        nameInputs(shown, (i, k, v) => {
          shown[i][k] = v;
          if (!edit) { const pr = ctx.sprefs; pr.lanes = T.lanes.map((x) => ({ name: x.name, team: x.team })); ctx.savePrefs(); }
          else if (o.changed) o.changed();
        }, circle),
        h('div', { class: 'row' }, h('button', { class: 'btn small', id: 'btnClearAll', onclick: () => {
          lanesOf().forEach((x) => { x.name = ''; x.team = ''; });
          if (!edit) { const pr = ctx.sprefs; pr.lanes = []; ctx.savePrefs(); } else if (o.changed) o.changed();
          draw();
        } }, '名前を全部消す')),
        circle ? null : h('p', { class: 'note' }, `タッチの回数：${sp.touchesOf(T.opts)}回（${T.opts.dist}m ÷ ${T.opts.pool}m）${T.opts.dist < T.opts.pool ? '・⚠ プールより短い距離です' : ''}`),
        h('p', { class: 'note' }, '種目・距離・プール・レーンの数は、下の「種目・距離」で選びます。')].filter(Boolean));      // （DOM の append は null を「null」という文字にするので、ないものは渡さない）
    };
    draw();
    // 種目・距離・レーンの数を変えたら（骨組みの「試合の形式」）：名前の欄を作り直す。記録中なら、いまの組（次の組）にも入れる
    sp.onOpts = (T2, key) => {
      if (edit) {
        const x = target();
        const g = T2;
        const s2 = sp.specOf(g.opts);
        if (x && x.type === 'heat') { Object.assign(x, s2); x.lanes = sp.cleanLanes(x.lanes, g.opts.lanes); }
        else if (x) { x.spec = s2; x.lanes = sp.cleanLanes(x.lanes, g.opts.lanes); }
        ctx.save();
      }
      draw();
    };
    return card;
  }

  /* ---------- 結果（集計） ---------- */
  function stats(ctx, g) {
    const sp = SP();
    const hs = sp.heats(g);
    if (!hs.length) return h('p', { class: 'note' }, 'まだ記録はありません（▶ スタートで1組目が始まります）。');
    const box = h('div', { class: 'swstats' });
    hs.slice().reverse().forEach((H) => {
      const rs = sp.activeRows(sp.results(g, H));
      const unit = sp.unitOf(H.spec);
      box.append(h('h3', null, `${H.heat}${unit}目：${sp.specText(H.spec)}`, h('small', null, ` ${H.spec.pool}mプール・${ST.fmtTime(H.start)} スタート`)));
      if (H.spec.mode === 'circle') {
        const R = H.spec.reps;
        box.append(h('div', { class: 'boxwrap' }, h('table', { class: 'box swtable' },
          h('thead', null, h('tr', null, h('th', null, '順'), h('th', { class: 'nm' }, '名前'), Array.from({ length: R }, (_, i) => h('th', null, `${i + 1}本`)), h('th', null, '平均'), h('th', null, 'ベスト'))),
          h('tbody', null, rs.map((x) => h('tr', { class: x.flag ? 'unk' : null }, h('td', { class: 'no' }, String(x.lane)), h('td', { class: 'nm' }, x.name || '', x.team ? h('small', null, ` ${x.team}`) : null),
            x.reps.map((r) => h('td', { class: r.time != null && r.time === x.best ? 'best' : null }, r.time != null ? ST.fmtRace(r.time) : '')),
            h('td', { class: 'sum' }, x.flag ? sp.FLAG_SHORT[x.flag] : x.avg != null ? ST.fmtRace(x.avg) : ''), h('td', null, x.best != null ? ST.fmtRace(x.best) : '')))))));
        return;
      }
      const need = sp.touchesOf(H.spec);
      const order = rs.slice().sort((a, b) => (a.rank || 99) - (b.rank || 99) || a.lane - b.lane);
      box.append(h('div', { class: 'boxwrap' }, h('table', { class: 'box swtable' },
        h('thead', null, h('tr', null, h('th', null, '順位'), h('th', null, 'L'), h('th', { class: 'nm' }, '名前'), h('th', null, 'タイム'), need > 1 ? Array.from({ length: need }, (_, i) => h('th', null, `${(i + 1) * H.spec.pool}m`)) : null)),
        h('tbody', null, order.map((x) => h('tr', { class: x.flag || !x.done ? 'unk' : x.rank === 1 ? 'win' : null },
          h('td', { class: 'no' }, x.flag ? sp.FLAG_SHORT[x.flag] : x.rank ? String(x.rank) : '—'), h('td', null, String(x.lane)),
          h('td', { class: 'nm' }, x.name || '', x.team ? h('small', null, ` ${x.team}`) : null),
          h('td', { class: 'sum' }, x.done ? ST.fmtRace(x.time) : x.splits.length ? '途中' : ''),
          need > 1 ? Array.from({ length: need }, (_, i) => h('td', { class: 'swsp' }, x.splits[i] != null ? [ST.fmtRace(x.splits[i]), h('small', null, ST.fmtRace(x.laps[i]))] : '')) : null))))));
    });
    // 同じ種目の組をまとめた総合順位（2組以上あるときだけ）
    sp.overall(g).filter((gr) => gr.heats > 1 && gr.rows.length).forEach((gr) => {
      box.append(h('h3', { class: 'swall' }, `総合順位：${gr.label}`, h('small', null, ` ${gr.heats}組`)),
        h('div', { class: 'boxwrap' }, h('table', { class: 'box swtable' },
          h('thead', null, h('tr', null, h('th', null, '順位'), h('th', { class: 'nm' }, '名前'), h('th', null, '組'), h('th', null, 'L'), h('th', null, 'タイム'))),
          h('tbody', null, gr.rows.map((x) => h('tr', { class: x.rank === 1 ? 'win' : null }, h('td', { class: 'no' }, String(x.rank)), h('td', { class: 'nm' }, x.name || `（${x.heat}組 L${x.lane}）`, x.team ? h('small', null, ` ${x.team}`) : null), h('td', null, `${x.heat}組`), h('td', null, String(x.lane)), h('td', { class: 'sum' }, ST.fmtRace(x.time))))))));
    });
    box.prepend(h('p', { class: 'note' }, 'タイムは、タッチのボタンを押した瞬間から計ったものです（人が押すので、0.1〜0.2 秒くらいずれることがあります）。スプリットの下の小さな数はラップ。'));
    return box;
  }

  /* 記録を直すとき：タッチのレーン・失格の組とレーン */
  function editExtra(ctx, e, body, changed) {
    const g = ctx.game, sp = SP();
    if (e.type === 'heat') {
      body.append(h('div', { class: 'field' }, h('span', null, `${e.heat}${sp.unitOf(e)}目：${sp.specText(sp.specOf(e))}`),
        h('p', { class: 'note' }, '時刻を直すと、この組のタイムが全部変わります（スタートの合図に合わせて直してください）。名前・距離は「≡ メニュー」→「種目・名前を直す」（いまの組）から。')));
      return;
    }
    const H = e.type === 'touch' ? sp.heatAt(g, e.t) : sp.heatByNo(g, e.heat);
    if (e.type === 'touch') {
      const info = sp.touchInfo(g, e);
      body.append(h('p', { class: 'note swinfo-edit' }, `${H ? H.heat + sp.unitOf(H.spec) + '目・' : ''}${sp.touchText(info)}`));
    } else {
      const hs = sp.heats(g);
      body.append(h('div', { class: 'field' }, h('span', null, '組'), h('div', { class: 'row' }, hs.map((x) => h('button', { class: 'btn small' + (x.heat === e.heat ? ' on' : ''), onclick: () => { e.heat = x.heat; changed(); } }, `${x.heat}${sp.unitOf(x.spec)}目`)))));
    }
    const lanes = H ? H.lanes : [];
    body.append(h('div', { class: 'field' }, h('span', null, H && H.spec.mode === 'circle' ? '泳ぐ順' : 'レーン'), h('div', { class: 'row nopick' },
      lanes.map((x) => h('button', { class: 'btn small nobtn' + (x.lane === e.lane ? ' on' : ''), dataset: { elane: x.lane }, onclick: () => { e.lane = x.lane; changed(); } }, `L${x.lane}${x.name ? ' ' + x.name : ''}`)))));
  }

  function coverExtra(ctx) {
    const g = ctx.game, sp = SP();
    const P = g.pending || { lanes: sp.cleanLanes([], g.opts.lanes), spec: sp.specOf(g.opts) };
    return h('p', { class: 'note swcover' }, `1${sp.unitOf(P.spec)}目：${sp.specText(P.spec)}（${P.spec.pool}mプール${P.spec.mode === 'circle' ? '' : '・タッチ' + sp.touchesOf(P.spec) + '回'}）・${P.lanes.length}${P.spec.mode === 'circle' ? '人' : 'レーン'}`);
  }
  function endSummary(ctx) {
    const g = ctx.game, sp = SP();
    return h('div', { class: 'endscore' }, h('b', { class: 'swend' }, sp.scoreText(g)));
  }
  function menuItems(ctx) {
    const g = ctx.game, sp = SP();
    const L = ctx.S.L;
    if (!g.startedAt) return [];
    return sp.waiting(g)
      ? [{ icon: '➡', label: `${g.pending.heat}${sp.unitOf(g.pending.spec)}目を直す`, sub: 'スタート待ちの組の種目・名前', fn: () => openNext(ctx, L, true) }]
      : [{ icon: '➡', label: '次の組へ', sub: '種目・名前を決めて、次のスタートを待つ', fn: () => openNext(ctx, L) }, { icon: '🏁', label: '組の一覧', sub: '組ごとの種目と1位', fn: () => openHeats(ctx, L) }];
  }
  function settings(ctx, refresh) {
    // （ctx.sprefs は読むたびに作り直されるので、押したときに読み直してから書く）
    const pick = (key, list) => h('div', { class: 'row' }, list.map(([v, lab]) => h('button', { class: 'btn small' + (ctx.sprefs[key] === v ? ' on' : ''), dataset: { swpref: key + ':' + v }, onclick: (e) => { ctx.sprefs[key] = v; ctx.savePrefs(); e.currentTarget.parentNode.querySelectorAll('.btn').forEach((b) => b.classList.toggle('on', b === e.currentTarget)); if (refresh) refresh(); } }, lab)));
    return h('section', { class: 'field swset' }, h('span', null, 'レーンの並び'),
      pick('order', [['asc', 'レーン1 を上に'], ['desc', 'レーン1 を下に']]),
      h('span', null, 'タッチのボタン'),
      pick('side', [['right', '右側'], ['left', '左側（左手で押す）']]),
      h('p', { class: 'note' }, 'プールサイドで見ている向きに合わせると、押しまちがいが減ります。'));
  }

  ST.addView('swim', { setup, build, stats, editExtra, coverExtra, endSummary, menuItems, settings });
})(typeof window !== 'undefined' ? window : globalThis);
