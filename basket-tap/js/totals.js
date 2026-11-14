/* バスケ タップ記録 — 📊 これまでの集計（ホームから開く画面。view 'totals'）
   保存してある試合（デモでない・記録が1つ以上）をまとめて見る。計算は js/agg.js（BT.agg）。
   上から：チーム・試合のしぼり方 → まとめ → 選手ごと → シュートの場所 → 試合ごと（グラフ） → ピリオドごと → 相手とのくらべ → 書き出す → 数え方。
   どこを押しても、画面ぜんぶを作り直す（数はいつも同じ試合の組から）。 */
(function (root) {
  'use strict';
  const BT = root.BT;
  const A = BT.agg;
  const { h, $ } = BT.ui;
  const SVGNS = 'http://www.w3.org/2000/svg';

  /* 画面の状態（開き直すと、しぼり方だけ覚えておく） */
  const T = {
    key: undefined,            // 選んだチーム（A.teams の key）
    recent: 0,                 // 0：すべて・5・10
    excl: new Set(),           // 外した試合の id
    per: false,                // 選手ごと：1試合あたり
    sort: { k: 'pts', dir: -1 },
    no: null,                  // シュートの場所：背番号（null は全員）
    court: null,               // シュートの場所：'std' | 'mini'（null は多いほう）
    metric: 'pts',             // グラフ
    pt: null,                  // グラフで選んでいる試合の id
    cloud: new Map(),          // クラウドから読んだ試合（この端末には保存しない）
    cloudList: null, cloudBusy: false, cloudAsked: false
  };

  /* ---------- 試合を集める ---------- */
  function localGames() {
    return BT.store.games().filter((s) => !s.demo).map((s) => BT.store.loadGame(s.id)).filter(Boolean);
  }
  function allGames() {
    const list = localGames();
    const ids = new Set(list.map((g) => g.id));
    T.cloud.forEach((g, id) => { if (!ids.has(id)) list.push(g); });
    return A.eligible(list);
  }
  /* クラウドにだけある試合（この端末にない・まだ読んでいない・デモでない） */
  function cloudOnly() {
    if (!T.cloudList) return [];
    const local = new Set(BT.store.games().map((g) => g.id));
    return T.cloudList.filter((c) => c && c.id && !local.has(c.id) && !T.cloud.has(c.id) && !(c.summary && c.summary.demo) && (!c.summary || (c.summary.n || 0) > 0));
  }
  function askCloud() {
    if (T.cloudAsked || !BT.cloud.enabled()) return;
    T.cloudAsked = true;
    BT.cloud.list().then((list) => { T.cloudList = Array.isArray(list) ? list : []; if (cloudOnly().length && inView()) render(); }).catch(() => { T.cloudList = []; });
  }
  async function loadCloud() {
    const want = cloudOnly();
    if (!want.length || T.cloudBusy) return;
    T.cloudBusy = true;
    render();
    let got = 0, bad = 0;
    for (const c of want) {
      let g = null;
      try { g = await BT.cloud.get(c.id); } catch (e) { g = null; }
      if (g && Array.isArray(g.events)) { T.cloud.set(c.id, g); got++; } else bad++;
    }
    T.cloudBusy = false;
    if (got) BT.ui.toast(`クラウドから ${got} 試合を入れました（この端末には保存していません）`, 'ok', 4000);
    if (bad) BT.ui.toast(`${bad} 試合は読み込めませんでした（電波を確かめて、もう一度）`, 'err', 5000);
    if (inView()) render();
  }
  const inView = () => !!(BT.app && BT.app.S && BT.app.S.view === 'totals');

  /* ---------- 小さな道具 ---------- */
  const pct = A.fmtPct, avg = A.fmtAvg;
  const dateText = (d, full) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d || ''); if (!m) return d || ''; const md = `${Number(m[2])}/${Number(m[3])}`; return full ? `${m[1]}/${md}` : md; };
  const RES = { W: '勝ち', L: '負け', D: '引き分け' };
  const chipBtn = (label, on, data, onclick, extra) => h('button', Object.assign({ class: 'btn small' + (on ? ' on' : ''), 'aria-pressed': on ? 'true' : 'false', dataset: data, onclick }, extra || {}), label);
  function rerender(fn) { return () => { fn(); render(); }; }
  function svgEl(tag, attrs, text) {
    const e = document.createElementNS(SVGNS, tag);
    for (const k in attrs || {}) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    return e;
  }

  /* ========== 画面 ========== */
  let keepY = 0;
  function render() {
    const first = document.body.dataset.view !== 'totals';
    keepY = first ? 0 : (root.scrollY || 0);
    document.body.dataset.view = 'totals';
    const V = $('#view');
    V.innerHTML = '';
    const games = allGames();
    const tm = A.teams(games, (BT.store.myTeam() || {}).name);
    if (T.key === undefined || !tm.list.some((t) => t.key === T.key)) { T.key = tm.def; T.no = null; T.court = null; }
    const all = T.key == null ? [] : A.gamesFor(games, T.key);
    const win = A.recent(all, T.recent);
    const used = A.pick(all, { recent: T.recent, exclude: T.excl });
    const R = A.compute(used);
    const label = T.key == null ? '' : A.label(T.key);
    const main = h('main', { class: 'ttmain', id: 'totals' });
    V.append(
      h('header', { class: 'hbar' },
        h('button', { class: 'btn', id: 'btnTotalsHome', onclick: () => BT.app.go('home') }, '🏠 ホーム'),
        h('b', { class: 'htitle' }, '📊 これまでの集計'),
        h('span', { class: 'spacer' })),
      main);
    if (!games.length) {
      main.append(h('section', { class: 'card tt-empty', id: 'ttNone' },
        h('h2', null, 'まだ集計できる試合がありません'),
        h('p', null, '試合を記録すると、ここで、これまでの試合をまとめて見られます（シュート成功率・選手ごと・場所ごとなど）。'),
        cloudCard()));
      afterRender();
      return;
    }
    main.append(filters(tm, all, win, used, label));
    const cc = cloudCard();
    if (cc) main.append(cc);
    if (!used.length) {
      main.append(h('section', { class: 'card tt-empty', id: 'ttEmpty' },
        h('h2', null, '集計に入れる試合がありません'),
        h('p', null, '下の「試合ごと」の表で、入れたい試合にチェックを付けてください。'),
        h('div', { class: 'row' }, h('button', { class: 'btn primary', id: 'ttAll', onclick: rerender(() => { T.excl.clear(); T.recent = 0; }) }, 'すべての試合を入れる'))));
      main.append(gamesCard(win, R, label));
      afterRender();
      return;
    }
    main.append(...[
      summaryCard(R, label),
      playersCard(R),
      shotCard(used, R),
      gamesCard(win, R, label),
      periodCard(R),
      compareCard(R, label),
      exportCard(R, label),
      h('p', { class: 'note tt-how', id: 'ttHow' }, howText(R))].filter(Boolean));
    afterRender();
  }
  function afterRender() {
    drawTrend();
    root.scrollTo(0, keepY);
  }

  /* ---------- チーム・試合のしぼり方 ---------- */
  function filters(tm, all, win, used, label) {
    const out = h('section', { class: 'card tt-filters', id: 'ttFilters' });
    if (tm.list.length > 1) {
      const sel = h('select', { id: 'ttTeam', 'aria-label': '集計するチーム', onchange: (e) => { T.key = tm.list[Number(e.target.value)].key; T.no = null; T.court = null; T.pt = null; render(); } },
        tm.list.map((t, i) => h('option', { value: String(i), selected: t.key === T.key }, `${t.label}（${t.n}試合）`)));
      out.append(h('label', { class: 'tt-team' }, h('span', null, 'チーム'), sel));
    } else {
      out.append(h('div', { class: 'tt-team' }, h('span', null, 'チーム'), h('b', null, label)));
    }
    out.append(h('div', { class: 'row tt-range', role: 'group', 'aria-label': '試合のしぼり方' },
      [[0, 'すべて'], [5, '直近5試合'], [10, '直近10試合']].map(([n, lab]) => chipBtn(lab, T.recent === n, { recent: String(n) }, rerender(() => { T.recent = n; T.pt = null; })))));
    const off = win.length - used.length;
    out.append(h('p', { class: 'tt-count', id: 'ttCount' },
      h('b', null, `${used.length} 試合`), 'を集計しています',
      ` （${label}の試合 ${all.length}${T.recent && all.length > win.length ? `・うち直近 ${win.length}` : ''}${off ? `・表でチェックを外した ${off}` : ''}）`));
    return out;
  }
  function cloudCard() {
    askCloud();
    const list = cloudOnly();
    if (!list.length && !T.cloudBusy) return null;
    return h('div', { class: 'tt-cloud', id: 'ttCloudRow' },
      h('button', { class: 'btn', id: 'ttCloud', disabled: T.cloudBusy, onclick: loadCloud }, T.cloudBusy ? '☁️ 読み込んでいます…' : `☁️ クラウドにだけある ${list.length} 試合も入れる`),
      h('small', { class: 'note' }, 'ほかの端末で記録した試合も、集計に入れます（この端末には保存しません）'));
  }

  /* ---------- まとめ ---------- */
  function summaryCard(R, label) {
    const rt = A.rates(R.usSh);
    const tiles = [];
    const tile = (id, lab, val, sub) => tiles.push(h('div', { class: 'tt-tile', dataset: { tile: id } }, h('span', { class: 'tl' }, lab), h('b', { class: 'tv' }, val), sub ? h('small', { class: 'ts' }, sub) : null));
    tile('n', '試合数', `${R.n}`, R.nMiss && R.nMiss < R.n ? `外れも記録 ${R.nMiss}` : null);
    tile('wl', '勝ち・負け・引き分け', `${R.w}勝 ${R.l}敗${R.d ? ` ${R.d}分` : ''}`, null);
    tile('pts', '平均得点 − 平均失点', `${avg(R.pf / R.n)} − ${avg(R.pa / R.n)}`, `差 ${A.fmtDiff((R.pf - R.pa) / R.n)}`);
    const sh = R.usSh;
    if (sh.fg2a + sh.fg3a) {
      tile('fg', 'シュート成功率', pct(rt.fg), `${sh.fg2m + sh.fg3m}/${sh.fg2a + sh.fg3a}`);
      if (sh.fg2a) tile('fg2', '2P 成功率', pct(rt.fg2), `${sh.fg2m}/${sh.fg2a}`);
      if (sh.fg3a) tile('fg3', '3P 成功率', pct(rt.fg3), `${sh.fg3m}/${sh.fg3a}`);
    }
    if (sh.fta) tile('ft', 'FT 成功率', pct(rt.ft), `${sh.ftm}/${sh.fta}`);
    if (sh.fg2a + sh.fg3a) tile('efg', 'eFG%', pct(rt.efg), '3P を 1.5 本に');
    [['reb', 'リバウンド'], ['ast', 'アシスト'], ['stl', 'スティール'], ['to', 'ターンオーバー'], ['foul', 'ファウル']].forEach(([k, lab]) => {
      if (R.us[k]) tile(k, `${lab}（1試合）`, avg(R.us[k] / R.n), `合計 ${R.us[k]}`);
    });
    return h('section', { class: 'card', id: 'ttSummary' },
      h('h2', null, `まとめ（${label}）`),
      h('div', { class: 'tt-tiles' }, tiles),
      basisNote(R, 'ttBasis'));
  }
  /* 成功率が、どの試合から出ているか */
  function basisNote(R, id) {
    if (R.nMiss === R.n) return null;
    if (!R.nMiss) return h('p', { class: 'note', id }, `外れ（シュートの失敗）を記録した試合がないので、成功率は出せません（入れた本数：2P ${R.us.fg2m}・3P ${R.us.fg3m}・FT ${R.us.ftm}）。設定で「シュートの失敗」のボタンを出して記録すると、成功率も出ます。`);
    return h('p', { class: 'note', id }, `成功率は、外れも記録した ${R.nMiss} 試合で計算しています（ほかの ${R.n - R.nMiss} 試合は、入れた本数だけの記録です）。`);
  }

  /* ---------- 選手ごと ---------- */
  function playersCard(R) {
    const per = T.per;
    const anyMiss = R.nMiss > 0;
    const showShot = (k) => R.us[k + 'm'] > 0 || R.usSh[k + 'a'] > 0;
    const div = (p, v) => (per ? (p.games ? v / p.games : null) : v);
    const num = (p, v) => (!v ? '' : per ? avg(div(p, v)) : String(v));          // 0 は空に（試合ごとの集計と同じ）
    const shotCell = (p, k) => {
      const m = p.sh[k + 'm'], a = p.sh[k + 'a'], all = p.s[k + 'm'];
      if (!anyMiss || !a) return all ? h('span', { class: 'sm' }, num(p, all)) : h('span', { class: 'tt-dash' }, '—');
      if (per) return [h('span', { class: 'sm' }, avg(div(p, all))), h('span', { class: 'sp' }, pct(m / a))];
      const extra = all - m;
      return [h('span', { class: 'sm' }, `${m}/${a}`), h('span', { class: 'sp' }, pct(m / a)), extra > 0 ? h('span', { class: 'sx', title: '外れを記録していない試合で入れた本数' }, `+${extra}`) : null];
    };
    const rate = (k) => (p) => A.rates(p.sh)[k];
    const cols = [
      { k: 'no', lab: '背番号', cls: 'no', val: (p) => p.no, cmp: true, cell: (p) => (p.no != null ? p.no : '') },
      { k: 'name', lab: '名前', cls: 'nm', val: (p) => p.name || '', cell: (p) => p.name || '' },
      { k: 'games', lab: '試合', val: (p) => p.games, cell: (p) => String(p.games) },
      { k: 'pts', lab: per ? '得点（1試合）' : '得点', val: (p) => div(p, p.s.pts), cell: (p) => (per ? avg(div(p, p.s.pts)) : String(p.s.pts)) },
      per ? null : { k: 'avg', lab: '1試合平均', val: (p) => (p.games ? p.s.pts / p.games : null), cell: (p) => avg(p.games ? p.s.pts / p.games : null) },
      showShot('fg2') ? { k: 'fg2', lab: '2P', val: anyMiss ? rate('fg2') : (p) => p.s.fg2m, cell: (p) => shotCell(p, 'fg2'), shot: true } : null,
      showShot('fg3') ? { k: 'fg3', lab: '3P', val: anyMiss ? rate('fg3') : (p) => p.s.fg3m, cell: (p) => shotCell(p, 'fg3'), shot: true } : null,
      showShot('ft') ? { k: 'ft', lab: 'FT', val: anyMiss ? rate('ft') : (p) => p.s.ftm, cell: (p) => shotCell(p, 'ft'), shot: true } : null,
      anyMiss && R.usSh.fg2a + R.usSh.fg3a ? { k: 'fg', lab: 'FG%', val: rate('fg'), cell: (p) => pct(rate('fg')(p)) } : null,
      anyMiss && R.usSh.fg2a + R.usSh.fg3a ? { k: 'efg', lab: 'eFG%', val: rate('efg'), cell: (p) => pct(rate('efg')(p)) } : null,
      R.us.reb ? { k: 'reb', lab: 'リバウンド', val: (p) => div(p, p.s.reb), cell: (p) => [num(p, p.s.reb), p.s.oreb && !per ? h('span', { class: 'sx' }, `（${p.s.oreb}）`) : null] } : null,
      R.us.ast ? { k: 'ast', lab: 'アシスト', val: (p) => div(p, p.s.ast), cell: (p) => num(p, p.s.ast) } : null,
      R.us.stl ? { k: 'stl', lab: 'スティール', val: (p) => div(p, p.s.stl), cell: (p) => num(p, p.s.stl) } : null,
      R.us.to ? { k: 'to', lab: 'ターンオーバー', val: (p) => div(p, p.s.to), cell: (p) => num(p, p.s.to) } : null,
      R.us.foul ? { k: 'foul', lab: 'ファウル', val: (p) => div(p, p.s.foul), cell: (p) => num(p, p.s.foul) } : null
    ].filter(Boolean);
    if (!cols.some((c) => c.k === T.sort.k)) T.sort = { k: 'pts', dir: -1 };
    const sc = cols.find((c) => c.k === T.sort.k);
    const rows = R.players.slice().sort((a, b) => {
      let d;
      if (sc.cmp) d = BT.cmpNo(a.no, b.no) * T.sort.dir;
      else {
        const x = sc.val(a), y = sc.val(b);
        if (x == null || y == null) d = x == null && y == null ? 0 : x == null ? 1 : -1;      // 数のないもの（—）は、いつも下
        else d = (typeof x === 'string' ? x.localeCompare(y, 'ja') : x - y) * T.sort.dir;
      }
      return d || BT.cmpNo(a.no, b.no);
    });
    const th = (c) => {
      const on = c.k === T.sort.k;
      return h('th', { class: c.cls || null, 'aria-sort': on ? (T.sort.dir < 0 ? 'descending' : 'ascending') : null },
        h('button', { class: 'tt-sort' + (on ? ' on' : ''), dataset: { sort: c.k }, onclick: rerender(() => { T.sort = on ? { k: c.k, dir: -T.sort.dir } : { k: c.k, dir: c.cmp || c.k === 'name' ? 1 : -1 }; }) },
          c.lab, h('span', { class: 'arr', 'aria-hidden': 'true' }, on ? (T.sort.dir < 0 ? '▼' : '▲') : '')));
    };
    const tr = (p, cls) => h('tr', { class: cls || null, dataset: p.no != null ? { no: p.no } : {} }, cols.map((c) => h('td', { class: (c.cls || '') + (c.shot ? ' shot' : '') || null, dataset: { k: c.k } }, c.k === 'no' && p.no == null ? '—' : c.cell(p))));
    const unk = R.unknown ? Object.assign({}, R.unknown, { name: '番号なし' }) : null;
    const tot = Object.assign({}, R.total, { name: '合計' });
    return h('section', { class: 'card', id: 'ttPlayers' },
      h('div', { class: 'tt-head' }, h('h2', null, '選手ごと'),
        h('div', { class: 'row', role: 'group', 'aria-label': '数の出し方' },
          chipBtn('合計', !per, { per: '0' }, rerender(() => { T.per = false; })),
          chipBtn('1試合あたり', per, { per: '1' }, rerender(() => { T.per = true; })))),
      h('p', { class: 'note tt-scrollhint' }, '表は横にすべらせると、ほかの列（2P・3P・リバウンドなど）も見られます。'),
      h('div', { class: 'boxwrap' }, h('table', { class: 'box tt-box', id: 'ttPlayerTable' },
        h('thead', null, h('tr', null, cols.map(th))),
        h('tbody', null, rows.map((p) => tr(p)), unk ? tr(unk, 'unk') : null, tr(tot, 'tot')))),
      h('p', { class: 'note' }, `見出しを押すと、その順に並べかえます（いまは「${sc.lab}」の${T.sort.dir < 0 ? '多い' : '少ない'}順）。` +
        (anyMiss ? '2P・3P・FT は「成功/打った数」と成功率' + (R.nMiss < R.n ? `（外れも記録した ${R.nMiss} 試合で計算。＋の数は、ほかの試合で入れた本数）` : '') + '。' : '2P・3P・FT は、入れた本数です。') +
        (R.us.oreb && !per ? 'リバウンドの（ ）は、うちオフェンスリバウンド。' : '') + '「試合」は、その番号の記録がある試合の数（1試合あたりは、この数で割ります）。'));
  }

  /* ---------- シュートの場所 ---------- */
  function shotCard(used, R) {
    const courts = A.courtCounts(used);
    if (!courts.std && !courts.mini) return null;
    if (T.court && !courts[T.court]) T.court = null;
    let S = A.shots(used, { court: T.court, no: T.no });
    if (T.no != null && !S.nos.includes(T.no)) { T.no = null; S = A.shots(used, { court: T.court }); }
    const withA = S.nMissGames > 0;
    const color = R.color || '#2563eb';
    const svg = BT.shot.court({ court: S.court, label: 'シュートの場所の図（これまでの試合）', shots: S.shots.map((x) => ({ x: x.x, y: x.y, made: x.made, color })) });
    const tot = S.zones.reduce((a, z) => ({ made: a.made + z.made, att: a.att + z.att, madeAll: a.madeAll + z.madeAll }), { made: 0, att: 0, madeAll: 0 });
    const zrow = (z, cls) => h('tr', { class: (cls || '') + ((withA ? z.att : z.madeAll) ? '' : ' zero'), dataset: z.id ? { zone: z.id } : {} }, h('th', null, z.label),
      withA ? [h('td', { class: 'zm' }, `${z.made}/${z.att}`), h('td', { class: 'zp' }, pct(A.ratio(z.made, z.att)))] : h('td', { class: 'zm' }, String(z.madeAll)));
    let insight = null;
    if (S.best) {
      const r = (z) => `${z.label}（${pct(z.made / z.att)}・${z.made}/${z.att}）`;
      insight = S.worst ? `読み取り：いちばん入っているのは ${r(S.best)}、いちばん入っていないのは ${r(S.worst)}。` : `読み取り：5本以上打ったゾーンは ${r(S.best)} だけです。`;
    }
    return h('section', { class: 'card', id: 'ttShots' },
      h('h2', null, '📍 シュートの場所'),
      courts.std && courts.mini ? h('div', { class: 'row tt-courts', role: 'group', 'aria-label': 'コート' },
        chipBtn(`ふつうのコート（${courts.std}試合）`, S.court === 'std', { court: 'std' }, rerender(() => { T.court = 'std'; T.no = null; })),
        chipBtn(`ミニバス（${courts.mini}試合）`, S.court === 'mini', { court: 'mini' }, rerender(() => { T.court = 'mini'; T.no = null; }))) : null,
      S.nos.length ? h('div', { class: 'row shotnos', role: 'group', 'aria-label': '選手' },
        chipBtn('全員', T.no == null, { shotno: '' }, rerender(() => { T.no = null; })),
        S.nos.map((no) => chipBtn('#' + no, T.no === no, { shotno: no }, rerender(() => { T.no = no; })))) : null,
      h('div', { class: 'shotgrid' },
        h('div', { class: 'shotchart' }, svg),
        h('div', null,
          h('table', { class: 'per zones', id: 'ttZoneTable' },
            h('thead', null, h('tr', null, h('th', null, 'ゾーン'), withA ? [h('th', null, '成功/打った数'), h('th', null, '成功率')] : h('th', null, '成功'))),
            h('tbody', null, S.zones.map((z) => zrow(z)), zrow({ label: '合計', made: tot.made, att: tot.att, madeAll: tot.madeAll }, 'tot'))),
          insight ? h('p', { class: 'tt-insight', id: 'ttInsight' }, insight) : null)),
      h('p', { class: 'note', id: 'ttShotNote' }, `場所を記録したシュート ${S.located}本（${S.nGames}試合）。● 入った` + (withA ? '・× 外れ' : '') + '。' +
        (withA && S.nMissGames < S.nGames ? `表の成功率は、外れも記録した ${S.nMissGames} 試合だけで計算しています（図の点は全部の試合）。` : '') +
        (!withA ? '外れを記録した試合がないので、表は入れた本数です。' : '') + (insight ? '' : withA ? '「読み取り」は、5本以上打ったゾーンがあると出ます。' : '')));
  }

  /* ---------- 試合ごと（表とグラフ） ---------- */
  function gamesCard(win, R, label) {
    const W = A.compute(win);
    const anyMiss = W.games.some((g) => g.miss);
    const full = new Set(W.games.map((g) => g.date.slice(0, 4))).size > 1;
    const showReb = W.games.some((g) => g.s.reb), showTo = W.games.some((g) => g.s.to);
    const head = [h('th', { class: 'ck' }, h('span', { class: 'sr' }, '集計に入れる')), h('th', null, '日付'), h('th', { class: 'nm' }, '相手'), h('th', null, 'スコア'), h('th', null, '勝敗'),
      anyMiss ? [h('th', null, 'FG%'), h('th', null, '3P%'), h('th', null, 'FT%')] : null, showReb ? h('th', null, 'リバウンド') : null, showTo ? h('th', null, 'ターンオーバー') : null];
    const rows = W.games.map((g) => {
      const inc = !T.excl.has(g.id);
      const rt = g.sh ? A.rates(g.sh) : null;
      const cb = h('input', { type: 'checkbox', checked: inc, 'aria-label': `${g.date} ${g.opp} 戦を集計に入れる`, dataset: { game: g.id }, onchange: (e) => { if (e.target.checked) T.excl.delete(g.id); else T.excl.add(g.id); T.pt = null; render(); } });
      return h('tr', { class: inc ? null : 'off', dataset: { id: g.id } },
        h('td', { class: 'ck' }, h('label', { class: 'tt-check' }, cb)),
        h('td', null, dateText(g.date, full), g.going ? h('span', { class: 'sx' }, ' 記録中') : null, T.cloud.has(g.id) ? h('span', { class: 'sx', title: 'クラウドから読んだ試合' }, ' ☁️') : null),
        h('td', { class: 'nm' }, g.opp),
        h('td', { class: 'tt-sc' }, `${g.pf} − ${g.pa}`),
        h('td', { class: 'res ' + g.res }, RES[g.res]),
        anyMiss ? [h('td', null, rt ? pct(rt.fg) : '—'), h('td', null, rt ? pct(rt.fg3) : '—'), h('td', null, rt ? pct(rt.ft) : '—')] : null,
        showReb ? h('td', null, String(g.s.reb)) : null, showTo ? h('td', null, String(g.s.to)) : null);
    });
    return h('section', { class: 'card', id: 'ttGames' },
      h('h2', null, '試合ごと'),
      R.n ? trendBlock(R, label) : null,
      h('div', { class: 'boxwrap' }, h('table', { class: 'box tt-games', id: 'ttGameTable' }, h('thead', null, h('tr', null, head)), h('tbody', null, rows))),
      h('p', { class: 'note' }, '新しい順。チェックを外すと、その試合を集計から外します（ほかの表・グラフも計算し直します）。' + (anyMiss && W.games.some((g) => !g.miss) ? '成功率の「—」は、外れを記録していない試合です。' : '')));
  }
  function trendBlock(R, label) {
    const m = A.METRICS.find((x) => x.id === T.metric) || A.METRICS[0];
    return h('div', { class: 'tt-trend', id: 'ttTrend' },
      h('div', { class: 'row', role: 'group', 'aria-label': 'グラフに出すもの' },
        A.METRICS.map((x) => chipBtn(x.label, x.id === m.id, { metric: x.id }, rerender(() => { T.metric = x.id; })))),
      h('div', { class: 'tt-chart', id: 'ttChart', dataset: { metric: m.id } }),
      h('p', { class: 'tt-readout', id: 'ttReadout', 'aria-live': 'polite' }));
  }
  /* グラフ（試合の古い順の折れ線）。画面に置いてから、その幅で描く */
  function drawTrend() {
    const box = $('#ttChart');
    if (!box) return;
    const used = A.pick(A.gamesFor(allGames(), T.key), { recent: T.recent, exclude: T.excl });
    const R = A.compute(used);
    const m = A.METRICS.find((x) => x.id === T.metric) || A.METRICS[0];
    const pts = A.trend(R, m.id);
    const readout = $('#ttReadout');
    box.innerHTML = '';
    const has = pts.filter((p) => p.values.some((v) => v != null));
    if (has.length < 2) {
      box.append(h('p', { class: 'note tt-nochart' }, m.id === 'fg' ? '外れも記録した試合が 2 試合以上になると、グラフが出ます。' : '2 試合以上になると、グラフが出ます。'));
      if (readout) readout.textContent = '';
      return;
    }
    const W = Math.max(200, Math.round(box.clientWidth || 300)), H = W < 420 ? 190 : W < 800 ? 220 : 260;
    const L = 36, Rr = 34, Tp = 14, B = 30;
    const iw = W - L - Rr, ih = H - Tp - B;
    let max = 0;
    pts.forEach((p) => p.values.forEach((v) => { if (v != null) max = Math.max(max, v); }));
    let ticks;
    if (m.pct) ticks = [0, 0.25, 0.5, 0.75, 1];
    else {
      const step = [1, 2, 5, 10, 20, 25, 50, 100].find((s) => Math.ceil(max / s) <= 4) || 100;
      const top = Math.max(step, Math.ceil(max / step) * step);
      ticks = []; for (let v = 0; v <= top + 1e-9; v += step) ticks.push(v);
    }
    const yMax = ticks[ticks.length - 1];
    const n = pts.length;
    const X = (i) => L + (n === 1 ? iw / 2 : (i * iw) / (n - 1));
    const Y = (v) => Tp + ih - (v / yMax) * ih;
    const fmt = (v) => (m.pct ? Math.round(v * 100) + '%' : String(Math.round(v * 10) / 10));
    const svg = svgEl('svg', { class: 'tt-svg', viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: 'img', tabindex: '0', 'aria-label': `${m.label}のグラフ（試合の古い順。左右の矢印キーで試合を選べます）` });
    // 目盛り（横線）と、縦の数
    ticks.forEach((v) => {
      svg.append(svgEl('line', { class: 'grid' + (v === 0 ? ' base' : ''), x1: L, x2: W - Rr + 6, y1: Y(v), y2: Y(v) }));
      svg.append(svgEl('text', { class: 'ax', x: L - 6, y: Y(v) + 4, 'text-anchor': 'end' }, m.pct ? Math.round(v * 100) + '%' : String(v)));
    });
    // 横の日付（重ならない数だけ。最初と最後は必ず）
    const every = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(iw / 44))));
    pts.forEach((p, i) => {
      if (i % every && i !== n - 1) return;
      if (i !== n - 1 && n - 1 - i < every && i !== 0) return;
      svg.append(svgEl('text', { class: 'ax', x: X(i), y: H - 10, 'text-anchor': i === 0 && n > 1 ? 'start' : i === n - 1 && n > 1 ? 'end' : 'middle' }, dateText(p.date)));
    });
    const cross = svgEl('line', { class: 'cross', x1: 0, x2: 0, y1: Tp, y2: Tp + ih, visibility: 'hidden' });
    svg.append(cross);
    // 線と点（自分：● 丸・相手：■ 四角。色だけに頼らない）
    m.series.forEach((name, si) => {
      let d = '', pen = false;
      pts.forEach((p, i) => { const v = p.values[si]; if (v == null) { pen = false; return; } d += (pen ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1); pen = true; });
      svg.append(svgEl('path', { class: 'ln s' + si, d }));
    });
    m.series.forEach((name, si) => {
      pts.forEach((p, i) => {
        const v = p.values[si];
        if (v == null) return;
        if (si === 0) svg.append(svgEl('circle', { class: 'tt-pt s0', cx: X(i), cy: Y(v), r: 4.5 }));
        else svg.append(svgEl('rect', { class: 'tt-pt s1', x: X(i) - 4.5, y: Y(v) - 4.5, width: 9, height: 9, rx: 1.5 }));
      });
    });
    // 最後の値（右はし）。2本が近いときは、上と下に分ける
    const lastIdx = (si) => { for (let i = n - 1; i >= 0; i--) if (pts[i].values[si] != null) return i; return -1; };
    const ends = m.series.map((name, si) => { const i = lastIdx(si); return i < 0 ? null : { si, i, v: pts[i].values[si], y: Y(pts[i].values[si]) }; }).filter(Boolean);
    if (ends.length === 2 && Math.abs(ends[0].y - ends[1].y) < 14) { const hi = ends[0].v >= ends[1].v ? 0 : 1; ends[hi].y -= 7; ends[1 - hi].y += 7; }
    ends.forEach((e) => svg.append(svgEl('text', { class: 'endv', x: X(e.i) + 8, y: e.y + 4 }, fmt(e.v))));
    const sel = svgEl('g', { class: 'tt-sel' });
    svg.append(sel);
    box.append(svg);
    // 凡例（2本のとき）
    if (m.series.length > 1) {
      box.append(h('div', { class: 'tt-legend' }, m.series.map((name, si) => h('span', { class: 'lg' },
        h('i', { class: 'tt-key s' + si, 'aria-hidden': 'true' }), si === 0 ? `${name}（${A.label(T.key)}）` : `${name}（相手の得点）`))));
    }
    // 選んだ試合の読み取り（押す・なぞる・矢印キー）
    let cur = Math.max(0, pts.findIndex((p) => p.id === T.pt));
    if (!pts.some((p) => p.id === T.pt)) cur = n - 1;
    const show = (i, mark) => {
      cur = BT.clamp(i, 0, n - 1);
      const p = pts[cur];
      T.pt = p.id;
      const vals = m.series.map((name, si) => `${name} ${p.values[si] == null ? '—（外れの記録なし）' : fmt(p.values[si])}`).join('・');
      if (readout) readout.textContent = `${dateText(p.date)} ${p.opp} 戦：${vals}`;
      if (mark) { cross.setAttribute('x1', X(cur)); cross.setAttribute('x2', X(cur)); cross.setAttribute('visibility', 'visible'); }
    };
    const at = (ev) => {
      const r = svg.getBoundingClientRect();
      const x = (ev.clientX - r.left) * (W / r.width);
      show(Math.round(n === 1 ? 0 : ((x - L) / iw) * (n - 1)), true);
    };
    svg.addEventListener('pointerdown', at);
    svg.addEventListener('click', at);
    svg.addEventListener('pointermove', (ev) => { if (ev.pointerType === 'mouse' || ev.buttons) at(ev); });
    svg.addEventListener('keydown', (ev) => {
      if (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight') { ev.preventDefault(); show(cur + (ev.key === 'ArrowLeft' ? -1 : 1), true); }
    });
    show(cur, T.pt != null && pts.some((p) => p.id === T.pt) && cur !== n - 1);
  }

  /* ---------- ピリオドごと ---------- */
  function periodCard(R) {
    const P = R.periods;
    if (!P.n) return null;
    const rows = P.rows;
    const cell = (v) => h('td', null, avg(v));
    return h('section', { class: 'card', id: 'ttPeriods' },
      h('h2', null, 'ピリオドごと（1試合の平均）'),
      h('div', { class: 'boxwrap' }, h('table', { class: 'per tt-per', id: 'ttPeriodTable' },
        h('thead', null, h('tr', null, h('th', null, ''), rows.map((p) => h('th', null, p.label)))),
        h('tbody', null,
          h('tr', null, h('th', null, '得点'), rows.map((p) => cell(p.pf / p.n))),
          h('tr', null, h('th', null, '失点'), rows.map((p) => cell(p.pa / p.n))),
          h('tr', { class: 'diff' }, h('th', null, '差'), rows.map((p) => { const d = (p.pf - p.pa) / p.n; return h('td', { class: d > 0.04 ? 'up' : d < -0.04 ? 'down' : null }, A.fmtDiff(d)); }))))),
      h('p', { class: 'note' }, (P.n < R.n ? `ピリオドを進めて記録した ${P.n} 試合の平均です（進めていない試合は、全部が 1Q に入ってしまうので入れません）。` : `${P.n} 試合の平均です。`) +
        (rows.some((p) => p.n < P.n) ? '試合によってないピリオド（延長など）は、そのピリオドのある試合だけで割っています。' : '')));
  }

  /* ---------- 相手とのくらべ ---------- */
  function compareCard(R, label) {
    const u = A.rates(R.usSh), o = A.rates(R.opSh);
    const rowsDef = [
      ['pts', '得点', R.us.pts / R.n, R.op.pts / R.n, 1, avg],
      ['fg', 'FG%', u.fg, o.fg, 1, pct],
      ['fg3', '3P%', u.fg3, o.fg3, 1, pct],
      ['ft', 'FT%', u.ft, o.ft, 1, pct],
      ['reb', 'リバウンド', R.us.reb / R.n, R.op.reb / R.n, 1, avg],
      ['to', 'ターンオーバー', R.us.to / R.n, R.op.to / R.n, -1, avg],
      ['foul', 'ファウル', R.us.foul / R.n, R.op.foul / R.n, -1, avg]
    ].filter(([k, , a, b]) => (a != null || b != null) && (a || b || k === 'pts'));
    return h('section', { class: 'card', id: 'ttCompare' },
      h('h2', null, '相手とのくらべ（1試合あたり）'),
      h('div', { class: 'boxwrap' }, h('table', { class: 'per tt-cmp', id: 'ttCompareTable' },
        h('thead', null, h('tr', null, h('th', null, ''), h('th', null, label), h('th', null, '相手'))),
        h('tbody', null, rowsDef.map(([k, lab, a, b, better, f]) => {
          const win = a != null && b != null && a !== b ? ((a - b) * better > 0 ? 0 : 1) : -1;
          return h('tr', { dataset: { k } }, h('th', null, lab, better < 0 ? h('small', { class: 'sx' }, ' ↓') : null),
            h('td', { class: win === 0 ? 'better' : null }, f(a)), h('td', { class: win === 1 ? 'better' : null }, f(b)));
        })))),
      h('p', { class: 'note' }, '相手は、どの試合の相手もまとめて数えています。太字は、よいほう（↓ は、少ないほうがよいもの）。' + (R.nMiss < R.n && R.nMiss ? `成功率は、外れも記録した ${R.nMiss} 試合で計算。` : '')));
  }

  /* ---------- 書き出す ---------- */
  function exportCard(R, label) {
    const share = BT.ui.canShareFiles();
    const today = BT.ymdAt(Date.now(), BT.localTz());
    const base = ['バスケ集計', BT.safeName(label) || '自分', today].join('_');
    const go2 = async (kind) => {
      const name = `${base}_${kind === 'p' ? '選手ごと' : '試合ごと'}.csv`;
      const blob = new Blob(['﻿' + (kind === 'p' ? A.playersCSV(R) : A.gamesCSV(R))], { type: 'text/csv' });
      const r = await BT.ui.shareOrDownload(name, blob, share);
      if (r === 'downloaded') BT.ui.toast(`保存しました：${name}`, 'ok', 4000);
      else if (r === 'shared') BT.ui.toast('送りました', 'ok');
    };
    return h('section', { class: 'card', id: 'ttExport' },
      h('h2', null, '💾 書き出す'),
      h('div', { class: 'export' },
        h('button', { class: 'xitem', id: 'ttExpPlayers', onclick: () => go2('p') }, h('b', null, '📊 選手ごとの集計（CSV）'), h('small', null, `いま集計している ${R.n} 試合の、背番号ごとの合計と成功率`)),
        h('button', { class: 'xitem', id: 'ttExpGames', onclick: () => go2('g') }, h('b', null, '📋 試合ごとの集計（CSV）'), h('small', null, '日付・相手・得点・失点・成功率・リバウンド・ターンオーバーなど')),
        h('p', { class: 'note' }, (share ? 'スマホでは「共有」が開きます。' : 'ダウンロードのフォルダに保存します。') + 'Excel・Numbers・Google スプレッドシートで開けます。')));
  }

  /* ---------- 数え方 ---------- */
  function howText() {
    return '数え方：得点・リバウンド・アシスト・スティール・ファウルは、試合ごとの集計を足したものです。' +
      'ターンオーバーは、選手の「ターンオーバー」と、チームを付けた「パスミス」を足した数です（チームを決めていないパスミスは、どちらにも入れません）。' +
      'シュートの成功率は、外れ（シュートの失敗）も記録した試合だけで計算します（入れた本数だけの試合では、打った数が分からないため）。入れた本数と得点は、全部の試合から数えます。' +
      'eFG% は、3P を 1.5 本として数えた成功率です。勝ち負けは、試合の最後の得点で決めます（記録の途中の試合は、いまの得点）。' +
      '1試合あたりは、試合の数で割ります（選手は、その背番号の記録がある試合の数）。選手は、選んだチームの背番号で分けています。' +
      '「直近5試合」は、スタートした時刻の新しい 5 試合です。デモの試合は入りません。';
  }

  /* ---------- 開く ---------- */
  function open() {
    T.cloudAsked = false; T.cloudList = null;
    render();
  }
  let rq = 0;
  if (root.addEventListener) root.addEventListener('resize', () => { cancelAnimationFrame(rq); rq = requestAnimationFrame(() => { if (inView()) drawTrend(); }); });

  BT.totals = { render, open, state: T };
})(typeof window !== 'undefined' ? window : globalThis);
