/* バスケ シーン — ③ スタッツ（コーチがスマホで見る数字）・📺 反省会の画面（みんなで見る）・🖼 画像で保存（チームのグループに送る）
   考え方：数字は、自分のチームのもの。相手は得点だけ。数字を押すと、その場面（② 場面）が続けて再生される。
   記録のないもの（行・列・タイル）は出さない。0 ばかりの行・NaN は出さない。

   ■ SC.stats
     画面を持たない部分（node のテストからも使える：tests/unit-stats.cjs）
       model(game)                 数字のまとめ { names, score, periods, withA, split, rows, unknown, total, cols, tiles, idle, empty, … }
       highlights(m)               「よかったところ」：得点・リバウンド・アシスト・スティールの多い 3人（同じ数は全員）
       cellOf(col, s, withA)       表の1マス → { text, n（並べかえの値）, zero }
       jumpArg(types, nos, team, title)   場面へ行くときの setTab('scenes', …) の arg
       cellJump(m, row, col) / rowJump(m, row) / tileJump(m, tile) / hlJump(m, hl, item)
       fitText(text, maxW, measure) / colWidths(want, avail, flexIdx, flexMax) / imageTable(m) / layoutImage(m, measure)
     画面（ブラウザだけ）
       openReport() / closeReport() / reportOpen()   反省会の画面
       image() → Promise<Blob>（PNG・幅 1600 px）/ saveImage() / csv() → 文字（BOM 付き）/ saveCSV()
   ■ 場面へ：SC.app.setTab('scenes', { filter: { types, nos, team }, title, play: 'reel' })
     types：BT.TYPE の id の配列（null は全部）/ nos：背番号の文字列の配列（'' は番号なし。null は全員）/ team：0 自分・1 相手 */
(function (root) {
  'use strict';
  const BT = root.BT;
  const SC = root.SC = root.SC || {};
  const ST = SC.stats = SC.stats || {};

  /* ========== 数字のまとめ（画面を持たない） ========== */
  const FG = ['fg2', 'fg2x', 'fg3', 'fg3x'];
  /* 表の列。short：表の見出し（せまい所）・label：場面の名前・タイル / shot：[成功, 本数] / pct：成功率 / sum：値 */
  const COLS = [
    { k: 'pts', short: '得点', label: '得点', types: ['fg2', 'fg3', 'ft'], sum: (s) => s.pts },
    { k: 'fg2', short: '2P', label: '2P', types: ['fg2', 'fg2x'], shot: ['fg2m', 'fg2a'] },
    { k: 'fg3', short: '3P', label: '3P', types: ['fg3', 'fg3x'], shot: ['fg3m', 'fg3a'] },
    { k: 'ft', short: 'FT', label: 'フリースロー', types: ['ft', 'ftx'], shot: ['ftm', 'fta'] },
    { k: 'fg', short: 'FG%', label: 'シュート', types: FG, pct: true },
    { k: 'reb', short: 'リバ', label: 'リバウンド', types: ['reb', 'oreb', 'dreb'], sum: (s) => s.reb },
    { k: 'oreb', short: 'Oリバ', label: 'オフェンスリバウンド', types: ['oreb'], sum: (s) => s.oreb, split: true },
    { k: 'dreb', short: 'Dリバ', label: 'ディフェンスリバウンド', types: ['dreb'], sum: (s) => s.dreb, split: true },
    { k: 'ast', short: 'アシスト', label: 'アシスト', types: ['ast'], sum: (s) => s.ast },
    { k: 'stl', short: 'スティール', label: 'スティール', types: ['stl'], sum: (s) => s.stl },
    { k: 'blk', short: 'ブロック', label: 'ブロック', types: ['blk'], sum: (s) => s.blk },
    { k: 'to', short: 'TO', label: 'ターンオーバー', types: ['tov', 'pass'], sum: (s) => s.to },
    { k: 'foul', short: 'ファウル', label: 'ファウル', types: ['foul'], sum: (s) => s.foul }
  ];
  ST.COLS = COLS;
  const COL = {};
  COLS.forEach((c) => { COL[c.k] = c; });
  /* 反省会の表：ふだん出す列（ほかは「くわしく」） */
  ST.REPORT_COLS = ['pts', 'shot', 'reb', 'ast', 'to'];
  /* 反省会の「シュート」（2P＋3P） */
  const SHOT = { k: 'shot', short: 'シュート', label: 'シュート', types: FG, shot: ['fgm', 'fga'] };
  COL.shot = SHOT;

  const DATA_KEYS = ['pts', 'fg2a', 'fg3a', 'fta', 'reb', 'ast', 'stl', 'blk', 'tov', 'pass', 'foul'];
  const hasData = (s) => DATA_KEYS.some((k) => s[k] > 0);
  /* BT.stats の1人分に、ターンオーバー（tov ＋ チームの付いたパスミス）と、2P＋3P（fgm・fga）を足したもの */
  function plus(s) { const o = Object.assign({}, s); o.to = (s.tov || 0) + (s.pass || 0); o.fgm = s.fg2m + s.fg3m; o.fga = s.fg2a + s.fg3a; return o; }
  const pctText = (m, a) => (a > 0 ? Math.round(100 * m / a) + '%' : '—');
  ST.pctText = pctText;

  /* 1マス：成功/本数（失敗の記録があるとき）・入った本数（ないとき）・成功率・数 */
  function cellOf(col, s, withA) {
    if (col.shot) {
      const m = s[col.shot[0]] || 0, a = s[col.shot[1]] || 0;
      return { text: withA ? `${m}/${a}` : String(m), n: m + a / 1000, zero: a === 0 };
    }
    if (col.pct) {
      const m = s.fgm != null ? s.fgm : s.fg2m + s.fg3m, a = s.fga != null ? s.fga : s.fg2a + s.fg3a;
      return { text: pctText(m, a), n: a > 0 ? m / a + a / 1e6 : -1, zero: a === 0 };
    }
    const v = col.sum(s) || 0;
    return { text: String(v), n: v, zero: v === 0 };
  }
  ST.cellOf = cellOf;

  /* その列を出すか（合計に記録があるか）。得点はいつも */
  function colHas(c, t, withA, split) {
    if (c.k === 'pts') return true;
    if (c.split) return split && t.reb > 0;
    if (c.shot) return t[c.shot[1]] > 0;
    if (c.pct) return withA && t.fg2a + t.fg3a > 0;
    return c.sum(t) > 0;
  }

  function model(game) {
    const st = BT.stats(game)[0];
    const withA = BT.hasMisses(game), split = BT.hasRebSplit(game);
    const per = BT.periodScores(game);
    const rows = st.rows.filter((r) => hasData(r.s)).map((r) => ({ kind: 'p', no: r.no, name: r.name || '', s: plus(r.s) }));
    const unknown = hasData(st.unknown) ? { kind: 'u', no: '', name: '', s: plus(st.unknown) } : null;
    const total = { kind: 't', no: null, name: '', s: plus(st.total) };
    const t = total.s;
    const cols = COLS.filter((c) => colHas(c, t, withA, split));
    const tiles = [];
    const tile = (id, label, value, sub, types, more) => tiles.push(Object.assign({ id, label, value, sub: sub || '', types }, more || {}));
    if (withA) {
      if (t.fga > 0) tile('fg', 'シュート成功率', pctText(t.fgm, t.fga), `${t.fgm}/${t.fga}`, FG);
      [['fg2', '2P'], ['fg3', '3P'], ['ft', 'フリースロー']].forEach(([k, lab]) => {
        const c = COL[k], m = t[c.shot[0]], a = t[c.shot[1]];
        if (a > 0) tile(k, lab, pctText(m, a), `${m}/${a}`, c.types);
      });
      if (t.fga > 0 && t.fg3a > 0) tile('efg', 'eFG%', pctText(t.fg2m + 1.5 * t.fg3m, t.fga), '3P を 1.5 本に', FG, { tabOnly: true });
    } else {
      [['fg2', '2P'], ['fg3', '3P'], ['ft', 'フリースロー']].forEach(([k, lab]) => {
        const c = COL[k], m = t[c.shot[0]];
        if (m > 0) tile(k, lab, `${m}本`, '入った本数', [k]);
      });
    }
    if (t.reb > 0) tile('reb', 'リバウンド', String(t.reb), split ? `Oリバ ${t.oreb}・Dリバ ${t.dreb}` : '', COL.reb.types);
    ['ast', 'stl', 'blk', 'to', 'foul'].forEach((k) => { const c = COL[k]; if (c.sum(t) > 0) tile(k, c.label, String(c.sum(t)), k === 'to' ? 'パスミスも入れて' : '', c.types); });
    const score = BT.score(game);
    return {
      date: game.date || '', names: [BT.teamName(game, 0), BT.teamName(game, 1)], colors: [(game.teams[0] || {}).color || '#2f6fed', (game.teams[1] || {}).color || '#d93636'],
      score, periods: per.length > 1 ? per : [], withA, split, rows, unknown, total, cols, tiles,
      idle: st.rows.filter((r) => !hasData(r.s)).map((r) => r.no),
      empty: !rows.length && !unknown, located: BT.hasShotLoc(game) ? BT.shotStats(game, { team: 0 }).located : 0
    };
  }
  ST.model = model;

  /* 並べかえ：k の列の値の大きい順（dir 1 は小さい順）。同じなら背番号の順。'no' は背番号の順 */
  ST.sortRows = function (m, k, dir) {
    const d = dir || -1;
    if (k === 'no') return m.rows.slice().sort((a, b) => d * BT.cmpNo(a.no, b.no));
    const c = COL[k] || COL.pts;
    const n = (r) => cellOf(c, r.s, m.withA).n;
    return m.rows.slice().sort((a, b) => (d < 0 ? n(b) - n(a) : n(a) - n(b)) || BT.cmpNo(a.no, b.no));
  };

  /* よかったところ：多い 3人（3人目と同じ数の人も、みんな入れる）。だれも記録がなければ出さない */
  const HL = [['pts', '得点', '点'], ['reb', 'リバウンド', ''], ['ast', 'アシスト', ''], ['stl', 'スティール', '']];
  function top3(rows, k) {
    const pos = rows.map((r) => ({ no: r.no, name: r.name, v: r.s[k] || 0 })).filter((x) => x.v > 0).sort((a, b) => (b.v - a.v) || BT.cmpNo(a.no, b.no));
    if (!pos.length) return [];
    const thr = pos[Math.min(2, pos.length - 1)].v;
    return pos.filter((x) => x.v >= thr).map((x) => Object.assign(x, { rank: 1 + pos.filter((y) => y.v > x.v).length }));
  }
  ST.top3 = top3;
  ST.highlights = function (m) {
    return HL.map(([k, label, unit]) => ({ k, label, unit, types: COL[k].types, items: top3(m.rows, k) })).filter((x) => x.items.length);
  };

  /* ---------- 場面へ ---------- */
  const jumpArg = (types, nos, team, title) => ({ filter: { types: types ? types.slice() : null, nos: nos ? nos.slice() : null, team: team === 0 || team === 1 ? team : null }, title, play: 'reel' });
  ST.jumpArg = jumpArg;
  const whoOf = (m, row) => (row.kind === 'p' ? `#${row.no}${row.name ? ' ' + row.name : ''}` : row.kind === 'u' ? '番号なし' : m.names[0]);
  const nosOf = (row) => (row.kind === 'p' ? [row.no] : row.kind === 'u' ? [''] : null);
  ST.whoOf = whoOf;
  ST.cellJump = (m, row, col) => jumpArg(col.types, nosOf(row), 0, `${whoOf(m, row)} の ${col.label}`);
  ST.rowJump = (m, row) => jumpArg(null, nosOf(row), 0, row.kind === 't' ? `${m.names[0]} の 全部のプレー` : whoOf(m, row));
  ST.tileJump = (m, tile) => jumpArg(tile.types, null, 0, `${m.names[0]} の ${tile.label === 'シュート成功率' || tile.id === 'efg' ? 'シュート' : tile.label}`);
  ST.hlJump = (m, hl, it) => jumpArg(hl.types, [it.no], 0, `${whoOf(m, { kind: 'p', no: it.no, name: it.name })} の ${hl.label}`);

  /* ---------- 画像の並べ方（数だけ。描くのは drawImage） ---------- */
  /* 幅 maxW に入るように、後ろを「…」にする（measure(文字) → 幅） */
  function fitText(text, maxW, measure) {
    const s = String(text == null ? '' : text);
    if (measure(s) <= maxW) return s;
    const ch = Array.from(s);
    let lo = 0, hi = ch.length;
    while (lo < hi) { const mid = Math.ceil((lo + hi) / 2); if (measure(ch.slice(0, mid).join('') + '…') <= maxW) lo = mid; else hi = mid - 1; }
    return lo ? ch.slice(0, lo).join('') + '…' : (measure('…') <= maxW ? '…' : '');
  }
  ST.fitText = fitText;
  /* 列の幅：want（ほしい幅）の合計が avail より小さければ、余りを flexIdx の列に（flexMax まで）、残りは数の列に等しく。
     大きければ、そのまま（画像の幅を広げる）→ { widths, total } */
  function colWidths(want, avail, flexIdx, flexMax) {
    const w = want.map((x) => Math.ceil(x));
    let total = w.reduce((a, b) => a + b, 0);
    let extra = avail - total;
    if (extra > 0) {
      const f = flexIdx != null && flexIdx >= 0 ? Math.min(extra, Math.max(0, (flexMax || Infinity) - w[flexIdx])) : 0;
      if (f > 0) { w[flexIdx] += f; extra -= f; }
      const rest = w.map((_, i) => i).filter((i) => i !== flexIdx && i > 1);
      if (extra > 0 && rest.length) { const each = Math.floor(extra / rest.length); rest.forEach((i) => { w[i] += each; }); }
      total = w.reduce((a, b) => a + b, 0);
    }
    return { widths: w, total };
  }
  ST.colWidths = colWidths;
  /* 画像の表の中身（背番号の順・番号なし・合計） */
  function imageTable(m) {
    const head = ['#', '名前'].concat(m.cols.map((c) => c.short));
    const line = (row) => [row.kind === 'p' ? row.no : row.kind === 'u' ? '—' : '', row.kind === 'p' ? row.name : row.kind === 'u' ? '番号なし' : '合計'].concat(m.cols.map((c) => cellOf(c, row.s, m.withA).text));
    const rows = ST.sortRows(m, 'no', 1).map(line);
    if (m.unknown) rows.push(line(m.unknown));
    rows.push(line(m.total));
    return { head, rows, kinds: ST.sortRows(m, 'no', 1).map(() => 'p').concat(m.unknown ? ['u'] : [], ['t']) };
  }
  ST.imageTable = imageTable;
  /* 画像の大きさと、それぞれの置き場所。measure(文字, px, 太字) → 幅 */
  const IMG = { W: 1600, P: 56, titleH: 56, scoreH: 210, gap: 36, secH: 52, perHead: 50, perRow: 60, tileH: 156, tileGap: 16, tilePerRow: 5, headH: 58, rowH: 56, rowHSmall: 46, many: 16, footH: 40, cellPx: 28, headPx: 22 };
  ST.IMG = IMG;
  function layoutImage(m, measure) {
    const K = IMG;
    let W = K.W;
    const L = { P: K.P };
    // 表の列の幅（先に決める。入りきらなければ、画像を広げる）
    let table = null;
    if (!m.empty) {
      const tb = imageTable(m);
      const want = tb.head.map((hd, i) => {
        const cells = tb.rows.map((r) => r[i]);
        const cw = Math.max(measure(hd, K.headPx, true), ...cells.map((t) => measure(t, K.cellPx, i !== 1)));
        if (i === 1) return BT.clamp(cw + 36, 200, 380);
        return Math.max(i === 0 ? 76 : 92, cw + 36);
      });
      const cw = colWidths(want, W - 2 * K.P, 1, 440);
      if (cw.total > W - 2 * K.P) W = cw.total + 2 * K.P;
      const rowH = tb.rows.length > K.many ? K.rowHSmall : K.rowH;
      table = { widths: cw.widths, total: cw.total, x: Math.round((W - cw.total) / 2), headH: K.headH, rowH, n: tb.rows.length, tb };
    }
    let y = K.P;
    L.title = { y, h: K.titleH }; y += K.titleH + 12;
    L.score = { y, h: K.scoreH }; y += K.scoreH + K.gap;
    if (m.periods.length) {
      const labW = 300, colW = 120, sumW = 130;
      const w = labW + m.periods.length * colW + sumW;
      L.per = { y, h: K.perHead + 2 * K.perRow, labW, colW, sumW, w: Math.min(w, W - 2 * K.P), x: Math.round((W - Math.min(w, W - 2 * K.P)) / 2), headH: K.perHead, rowH: K.perRow };
      y += L.per.h + K.gap;
    } else L.per = null;
    const tiles = m.tiles.filter((t) => !t.tabOnly);
    if (tiles.length) {
      const perRow = Math.min(K.tilePerRow, tiles.length) || 1;
      const rows = Math.ceil(tiles.length / perRow);
      const tw = (W - 2 * K.P - (perRow - 1) * K.tileGap) / perRow;
      L.tiles = { y, secH: K.secH, perRow, rows, w: tw, h: K.tileH, gap: K.tileGap, list: tiles };
      y += K.secH + rows * K.tileH + (rows - 1) * K.tileGap + K.gap;
    } else L.tiles = null;
    if (table) {
      L.table = Object.assign(table, { y, secH: K.secH });
      y += K.secH + table.headH + table.n * table.rowH + K.gap;
    } else {
      L.table = null;
      L.empty = { y, h: 90 };
      y += 90 + K.gap;
    }
    L.foot = { y, h: K.footH };
    y += K.footH + K.P - 16;
    L.W = Math.ceil(W);
    L.H = Math.ceil(y);
    return L;
  }
  ST.layoutImage = layoutImage;
  /* 「2026-11-20」→「2026年11月20日」 */
  ST.dateText = (d) => { const x = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d || ''); return x ? `${x[1]}年${Number(x[2])}月${Number(x[3])}日` : String(d || ''); };

  /* ========== 画面（ブラウザだけ） ========== */
  if (typeof document === 'undefined' || !SC.app || !BT.ui) return;
  const app = SC.app;
  const { h } = BT.ui;
  let pane = null;
  let sort = { k: 'pts', dir: -1 };
  let shotNo = null;
  let rep = null;
  let more = false;
  let busy = false;

  const go = (arg) => { if (rep) closeReport(); app.setTab('scenes', arg); };
  const toastSaved = (r, name) => { if (r === 'downloaded') BT.ui.toast(`保存しました：${name}`, 'ok', 4000); else if (r === 'shared') BT.ui.toast('送りました', 'ok'); };

  /* ---------- ③ スタッツのタブ ---------- */
  function render() {
    if (!pane) return;
    const g = app.S.game;
    const keep = { y: pane.scrollTop, x: (pane.querySelector('.st-tblwrap') || {}).scrollLeft || 0 };
    pane.innerHTML = '';
    if (!g) return;
    const m = model(g);
    const box = h('div', { class: 'st-tab', id: 'stTab' },
      scoreCard(m),
      m.empty ? h('section', { class: 'st-card st-empty', id: 'stEmpty' }, h('p', null, 'まだ記録がありません。'), h('p', { class: 'note' }, '「① 記録」で記録すると、ここにチームと選手の数字が出ます。')) : [teamCard(m), playersCard(m), shotCard(g, m)],
      actions());
    pane.append(box);
    pane.scrollTop = keep.y;
    const tw = pane.querySelector('.st-tblwrap');
    if (tw) tw.scrollLeft = keep.x;
  }
  function perTable(m, cls) {
    if (!m.periods.length) return null;
    return h('div', { class: 'st-perwrap' }, h('table', { class: 'st-per ' + (cls || ''), id: cls === 'st-rper' ? 'stRPer' : 'stPer' },
      h('thead', null, h('tr', null, h('th', null, ''), m.periods.map((p) => h('th', null, p.label)), h('th', { class: 'st-sum' }, '計'))),
      h('tbody', null, [0, 1].map((tm) => h('tr', { class: tm ? 'st-opp' : 'st-us' },
        h('th', null, h('i', { class: 'st-dot', style: { background: m.colors[tm] } }), h('span', null, m.names[tm])),
        m.periods.map((p) => h('td', null, String(p.pts[tm]))), h('td', { class: 'st-sum' }, String(m.score[tm])))))));
  }
  function scoreCard(m) {
    return h('section', { class: 'st-card st-score', id: 'stScore' },
      h('div', { class: 'st-sline' },
        h('span', { class: 'st-sname st-us' }, h('i', { class: 'st-dot', style: { background: m.colors[0] } }), h('span', null, m.names[0])),
        h('b', { class: 'st-snum', id: 'stScoreNum' }, `${m.score[0]} − ${m.score[1]}`),
        h('span', { class: 'st-sname st-opp' }, h('span', null, m.names[1]))),
      perTable(m));
  }
  function teamCard(m) {
    const tiles = m.tiles;
    return h('section', { class: 'st-card', id: 'stTeam' },
      h('h3', { class: 'st-h' }, h('i', { class: 'st-dot', style: { background: m.colors[0] } }), `${m.names[0]} の数字`),
      tiles.length ? h('div', { class: 'st-tiles' }, tiles.map((t) => h('button', { class: 'st-tile', dataset: { tile: t.id }, 'aria-label': `${t.label} ${t.value}。場面を見る`, onclick: () => go(ST.tileJump(m, t)) },
        h('span', { class: 'st-tl' }, t.label), h('b', { class: 'st-tv' }, t.value), t.sub ? h('small', { class: 'st-ts' }, t.sub) : null, h('i', { class: 'st-go', 'aria-hidden': 'true' }, '▶')))) : null,
      !m.withA ? h('p', { class: 'note', id: 'stNoMiss' }, 'シュートの成功率は、「シュートの失敗」も記録すると出ます（⚙ 設定の「記録するもの」）。') : null);
  }
  function playersCard(m) {
    const rows = ST.sortRows(m, sort.k, sort.dir);
    const mark = (k) => (sort.k === k ? (sort.dir < 0 ? ' ▼' : ' ▲') : '');
    const aria = (k) => (sort.k === k ? (sort.dir < 0 ? 'descending' : 'ascending') : null);
    const th = (k, lab, cls) => h('th', { class: cls || null, 'aria-sort': aria(k) }, h('button', { class: 'st-sort' + (sort.k === k ? ' on' : ''), dataset: { sort: k }, onclick: () => { if (sort.k === k) sort.dir = -sort.dir; else sort = { k, dir: k === 'no' ? 1 : -1 }; render(); } }, lab + mark(k)));
    const line = (row) => h('tr', { class: 'st-' + row.kind, dataset: { no: row.kind === 'p' ? row.no : row.kind === 'u' ? '?' : '*' } },
      h('td', { class: 'st-c-no' }, h('button', { class: 'st-who', dataset: { jumprow: '1' }, 'aria-label': `${whoOf(m, row)} の場面を見る`, onclick: () => go(ST.rowJump(m, row)) }, row.kind === 'p' ? row.no : row.kind === 'u' ? '—' : '')),
      h('td', { class: 'st-c-nm' }, h('button', { class: 'st-who', dataset: { jumprow: '1' }, onclick: () => go(ST.rowJump(m, row)) }, h('span', null, row.kind === 'p' ? row.name : row.kind === 'u' ? '番号なし' : '合計'), h('i', { class: 'st-go', 'aria-hidden': 'true' }, '▶'))),
      m.cols.map((c) => { const v = cellOf(c, row.s, m.withA); return h('td', { class: 'st-c-v' + (v.zero ? ' st-zero' : '') }, v.zero ? v.text : h('button', { class: 'st-cell', dataset: { col: c.k }, onclick: () => go(ST.cellJump(m, row, c)) }, v.text)); }));
    const sortName = sort.k === 'no' ? '背番号の順' : `${(COL[sort.k] || COL.pts).label}の${sort.dir < 0 ? '多い' : '少ない'}順`;
    return h('section', { class: 'st-card', id: 'stPlayers' },
      h('h3', { class: 'st-h' }, '選手', h('small', { class: 'st-sortnow', id: 'stSortNow' }, sortName)),
      h('div', { class: 'st-tblwrap' }, h('table', { class: 'st-tbl', id: 'stTable' },
        h('thead', null, h('tr', null, th('no', '#', 'st-c-no'), h('th', { class: 'st-c-nm' }, '名前'), m.cols.map((c) => th(c.k, c.short, 'st-c-v')))),
        h('tbody', null, rows.map(line), m.unknown ? line(m.unknown) : null, line(m.total)))),
      h('p', { class: 'note' }, '名前・数字を押すと、その場面を続けて再生します（② 場面）。見出しを押すと、並べかえます。' + (m.withA ? '2P・3P・FT は「成功/本数」。' : '2P・3P・FT は、入った本数。') + (m.cols.some((c) => c.k === 'to') ? 'TO は、ターンオーバー（パスミスも入れて）。' : '')),
      m.idle.length ? h('p', { class: 'note', id: 'stIdle' }, `記録なし：${m.idle.map((n) => '#' + n).join(' ')}`) : null);
  }
  /* シュートの場所（自分のチームだけ。選手で しぼれる） */
  function shotView(g, no, ids) {
    const all = BT.shotStats(g, { team: 0 });
    const r = no != null ? BT.shotStats(g, { team: 0, no }) : all;
    const withA = BT.hasMisses(g), color = g.teams[0].color;
    const svg = BT.shot.court({ court: r.court, label: 'シュートの場所の図（ゴールが上）', shots: r.shots.map((x) => ({ x: x.x, y: x.y, made: x.made, color })) });
    const zs = r.zones.filter((z) => z.att > 0);
    const tot = r.zones.reduce((a, z) => ({ made: a.made + z.made, att: a.att + z.att }), { made: 0, att: 0 });
    const zrow = (z, cls) => h('tr', { class: cls || null, dataset: z.id ? { zone: z.id } : {} }, h('th', null, z.label),
      withA ? [h('td', null, `${z.made}/${z.att}`), h('td', null, BT.pct(z.made, z.att))] : h('td', null, String(z.made)));
    return h('div', { class: 'st-shotgrid' },
      h('div', { class: 'st-court' }, svg),
      h('div', null, h('table', { class: 'st-zones', id: ids.table },
        h('thead', null, h('tr', null, h('th', null, 'ゾーン'), withA ? [h('th', null, '成功/本数'), h('th', null, '成功率')] : h('th', null, '入った本数'))),
        h('tbody', null, zs.map((z) => zrow(z)), zrow({ label: '合計', made: tot.made, att: tot.att }, 'st-t'))),
        h('p', { class: 'note', id: ids.note }, `場所あり ${r.located}本` + (r.unlocated ? `・場所なし ${r.unlocated}本（図と表には入りません）` : '') + '。● 入った' + (withA ? '・× 外れ' : '') + '。')));
  }
  function shotCard(g, m) {
    if (!m.located) return null;
    const all = BT.shotStats(g, { team: 0 });
    const nos = BT.sortNos(Array.from(new Set(all.shots.filter((x) => x.e.no != null).map((x) => x.e.no))));
    if (shotNo != null && !nos.includes(shotNo)) shotNo = null;
    const chip = (no, lab) => h('button', { class: 'btn small' + (shotNo === no ? ' on' : ''), 'aria-pressed': shotNo === no ? 'true' : 'false', dataset: { shotno: no == null ? '' : no }, onclick: () => { shotNo = no; render(); } }, lab);
    return h('section', { class: 'st-card', id: 'stShots' },
      h('h3', { class: 'st-h' }, '📍 シュートの場所'),
      h('div', { class: 'row st-chips' }, chip(null, '全員'), nos.map((no) => chip(no, '#' + no))),
      shotView(g, shotNo, { table: 'stZones', note: 'stShotNote' }));
  }
  function actions() {
    return h('section', { class: 'st-actions', id: 'stActions' },
      h('button', { class: 'btn primary st-big', id: 'stOpenReport', onclick: () => openReport() }, '📺 反省会の画面'),
      h('div', { class: 'row' },
        h('button', { class: 'btn', id: 'stImage', onclick: () => saveImage() }, '🖼 画像で保存'),
        h('button', { class: 'btn', id: 'stCsv', onclick: () => saveCSV() }, '📊 CSV')),
      h('p', { class: 'note' }, '反省会の画面は、iPad・テレビ・プロジェクターで、みんなで見るための大きな画面です。画像は、チームのグループに送れます。'));
  }

  /* ---------- 📺 反省会の画面 ---------- */
  const SIZES = [['s', '小'], ['m', '中'], ['l', '大']];
  const curSize = () => { const v = app.S.prefs && app.S.prefs.reportSize; return v === 's' || v === 'l' ? v : 'm'; };
  function openReport() {
    if (!app.S.game) return;
    BT.ui.closeSheet(true);
    if (!rep) {
      rep = h('div', { class: 'st-report', id: 'stReport', role: 'dialog', 'aria-modal': 'true', 'aria-label': '反省会の画面', tabindex: '-1' });
      document.body.append(rep);
      document.body.classList.add('st-rep-on');
      app.pause();
      const tb = document.querySelector('#toasts'); if (tb) tb.textContent = '';      // 前のお知らせ（「保存しました」など）を、みんなで見る画面に残さない
      app.S.overlay = closeReport;          // ブラウザの「戻る」で、ホームへ行かずに、この画面を閉じる（土台の約束）
    }
    drawReport();
    rep.scrollTop = 0;
    try { rep.focus({ preventScroll: true }); } catch (e) { /* 無視 */ }
  }
  function closeReport() {
    if (!rep) return;
    rep.remove();
    rep = null;
    if (app.S.overlay === closeReport) app.S.overlay = null;
    document.body.classList.remove('st-rep-on');
  }
  function drawReport() {
    const g = app.S.game;
    if (!rep || !g) return;
    const m = model(g);
    const keep = rep.scrollTop;
    rep.dataset.size = curSize();
    rep.innerHTML = '';
    const play = (lab) => h('span', { class: 'st-play st-noprint' }, '▶ 場面', h('span', { class: 'st-wide' }, 'を見る'), lab ? h('span', { class: 'st-vh' }, lab) : null);
    const tiles = m.tiles.filter((t) => !t.tabOnly);
    const hls = ST.highlights(m);
    const rcols = ST.REPORT_COLS.map((k) => COL[k]).filter((c) => c.k === 'pts' || (c.k === 'shot' ? m.total.s.fga > 0 : colHas(c, m.total.s, m.withA, m.split)));
    const extra = m.cols.filter((c) => !ST.REPORT_COLS.includes(c.k) && c.k !== 'pts');
    const cols = more ? rcols.concat(extra) : rcols;
    /* 見出し：広い画面では長い名前、せまい画面（スマホ）では短い名前（css の .st-wide・.st-narrow） */
    const FULL = { shot: m.withA ? 'シュート（成功/本数）' : 'シュート（入った本数）', to: 'ターンオーバー', reb: 'リバウンド' };
    const SHORT = { shot: m.withA ? 'シュート' : 'シュート', to: 'TO', reb: 'リバ' };
    const colHead = (c) => (FULL[c.k] ? [h('span', { class: 'st-wide' }, FULL[c.k]), h('span', { class: 'st-narrow', 'aria-hidden': 'true' }, SHORT[c.k])] : c.short);
    const line = (row) => h('tr', { class: 'st-' + row.kind, dataset: { no: row.kind === 'p' ? row.no : row.kind === 'u' ? '?' : '*' } },
      h('td', { class: 'st-c-no' }, row.kind === 'p' ? h('b', { class: 'st-jersey' }, row.no) : row.kind === 'u' ? '—' : ''),
      h('td', { class: 'st-c-nm' }, row.kind === 'p' ? row.name || '' : row.kind === 'u' ? '番号なし' : '合計'),
      cols.map((c) => { const v = cellOf(c, row.s, m.withA); return h('td', { class: 'st-c-v' + (v.zero ? ' st-zero' : ''), dataset: { col: c.k } }, v.text); }),
      h('td', { class: 'st-c-go st-noprint' }, h('button', { class: 'st-rgo', dataset: { jumprow: '1' }, 'aria-label': `${whoOf(m, row)} の場面を見る`, onclick: () => go(ST.rowJump(m, row)) }, h('span', { class: 'st-play' }, '▶', h('span', { class: 'st-wide' }, ' 場面を見る')))));
    rep.append(
      h('header', { class: 'st-rbar st-noprint' },
        h('b', { class: 'st-rtitle' }, '📺 反省会'),
        h('div', { class: 'st-rsize', role: 'group', 'aria-label': '文字の大きさ' }, h('span', null, '文字'),
          SIZES.map(([v, lab]) => h('button', { class: 'st-rbtn' + (curSize() === v ? ' on' : ''), 'aria-pressed': curSize() === v ? 'true' : 'false', dataset: { size: v }, onclick: () => { app.S.prefs.reportSize = v; app.savePrefs(); drawReport(); } }, lab))),
        h('span', { class: 'st-spacer' }),
        h('button', { class: 'st-rbtn', id: 'stRImage', onclick: () => saveImage() }, '🖼', h('span', { class: 'st-wide' }, ' 画像で保存')),
        h('button', { class: 'st-rbtn', id: 'stRPrint', onclick: () => { try { root.print(); } catch (e) { /* 無視 */ } } }, '🖨', h('span', { class: 'st-wide' }, ' 印刷・PDF')),
        h('button', { class: 'st-rbtn st-rclose', id: 'stRClose', 'aria-label': '閉じる', onclick: closeReport }, '✕ 閉じる')),
      h('main', { class: 'st-rmain' },
        h('section', { class: 'st-rhead', id: 'stRHead' },
          h('p', { class: 'st-rdate' }, `${ST.dateText(m.date)} の試合`),
          h('div', { class: 'st-rscore', id: 'stRScore' },
            h('div', { class: 'st-rteam st-us' }, h('span', { class: 'st-rname' }, h('i', { class: 'st-dot', style: { background: m.colors[0] } }), h('span', null, m.names[0])), h('b', { class: 'st-rnum' }, String(m.score[0]))),
            h('span', { class: 'st-rdash', 'aria-hidden': 'true' }, '−'),
            h('div', { class: 'st-rteam st-opp' }, h('span', { class: 'st-rname' }, h('span', null, m.names[1])), h('b', { class: 'st-rnum' }, String(m.score[1])))),
          perTable(m, 'st-rper')),
        m.empty ? h('section', { class: 'st-rsec', id: 'stREmpty' }, h('p', { class: 'st-rmsg' }, 'まだ記録がありません。「① 記録」で記録すると、ここに数字が出ます。')) : null,
        tiles.length ? h('section', { class: 'st-rsec', id: 'stRTeam' }, h('h2', null, 'チームの数字'),
          h('div', { class: 'st-rtiles' }, tiles.map((t) => h('button', { class: 'st-rtile', dataset: { tile: t.id }, onclick: () => go(ST.tileJump(m, t)) },
            h('span', { class: 'st-tl' }, t.label), h('b', { class: 'st-tv' }, t.value), t.sub ? h('small', { class: 'st-ts' }, t.sub) : null, play())))) : null,
        hls.length ? h('section', { class: 'st-rsec', id: 'stRHl' }, h('h2', null, 'よかったところ'),
          h('div', { class: 'st-hls' }, hls.map((hl) => h('div', { class: 'st-hl', dataset: { hl: hl.k } }, h('h3', null, hl.label, h('small', null, '　多かった人')),
            h('ol', null, hl.items.map((it) => h('li', null, h('button', { class: 'st-hlrow', dataset: { no: it.no }, onclick: () => go(ST.hlJump(m, hl, it)) },
              h('b', { class: 'st-jersey' }, it.no), h('span', { class: 'st-hlname' }, it.name || ''), h('b', { class: 'st-hlv' }, String(it.v), hl.unit ? h('small', null, hl.unit) : null), h('span', { class: 'st-go st-noprint', 'aria-hidden': 'true' }, '▶'))))))))) : null,
        !m.empty ? h('section', { class: 'st-rsec', id: 'stRPlayers' }, h('h2', null, '選手', extra.length ? h('button', { class: 'st-rbtn st-more st-noprint', id: 'stMore', 'aria-pressed': more ? 'true' : 'false', onclick: () => { more = !more; drawReport(); } }, more ? 'たたむ' : 'くわしく') : null),
          h('div', { class: 'st-rtblwrap' }, h('table', { class: 'st-rtbl', id: 'stRTable' },
            h('thead', null, h('tr', null, h('th', { class: 'st-c-no' }, '#'), h('th', { class: 'st-c-nm' }, '名前'), cols.map((c) => h('th', { class: 'st-c-v', dataset: { col: c.k }, title: FULL[c.k] || c.label }, colHead(c))), h('th', { class: 'st-c-go st-noprint' }, ''))),
            h('tbody', null, ST.sortRows(m, 'no', 1).map(line), m.unknown ? line(m.unknown) : null, line(m.total)))),
          h('p', { class: 'st-rnote' }, '背番号の順。シュートは 2P＋3P' + (m.withA ? '（成功/本数）。' : '（入った本数）。') + (cols.some((c) => c.k === 'to') ? 'ターンオーバーは、パスミスも入れて。' : ''))) : null,
        m.located ? h('section', { class: 'st-rsec', id: 'stRShots' }, h('h2', null, 'シュートの場所'), shotView(g, null, { table: 'stRZones', note: 'stRShotNote' })) : null,
        h('footer', { class: 'st-rfoot' }, SC.APP || 'バスケ シーン')));
    rep.scrollTop = keep;
  }

  /* ---------- 🖼 画像（canvas に描く。iOS でも動くように、foreignObject は使わない） ---------- */
  function fontFamily() { try { return getComputedStyle(document.body).fontFamily || 'sans-serif'; } catch (e) { return 'sans-serif'; } }
  function drawImage(m) {
    const c = document.createElement('canvas');
    let ctx = c.getContext('2d');
    const F = fontFamily();
    const font = (px, b) => `${b ? '800' : '500'} ${px}px ${F}`;
    const meas = (t, px, b) => { ctx.font = font(px, b); return ctx.measureText(String(t)).width; };
    const L = layoutImage(m, meas);
    c.width = L.W; c.height = L.H;
    ctx = c.getContext('2d');
    const INK = '#0f172a', MUTED = '#475569', LINE = '#d6dce6', SOFT = '#eef2f8', ACC = '#1d4ed8';
    const text = (t, x, y, px, b, color, align, maxW) => {
      const s = maxW ? fitText(t, maxW, (v) => meas(v, px, b)) : String(t);
      ctx.font = font(px, b); ctx.fillStyle = color || INK; ctx.textAlign = align || 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(s, x, y);
    };
    const rect = (x, y, w, hh, color, r) => { ctx.fillStyle = color; ctx.beginPath(); if (r && ctx.roundRect) ctx.roundRect(x, y, w, hh, r); else ctx.rect(x, y, w, hh); ctx.fill(); };
    const W = L.W, P = L.P;
    rect(0, 0, W, L.H, '#ffffff');
    rect(0, 0, W, 14, m.colors[0]);
    // 題
    text(`${ST.dateText(m.date)} の試合`, P, L.title.y + L.title.h / 2, 34, true, MUTED, 'left', W - 2 * P);
    // 得点
    const sy = L.score.y, sh = L.score.h;
    rect(P, sy, W - 2 * P, sh, SOFT, 24);
    const mid = W / 2;
    text('−', mid, sy + sh / 2 + 6, 110, true, MUTED, 'center');
    const side = (W - 2 * P) / 2 - 120;
    text(String(m.score[0]), mid - 90, sy + sh / 2 + 10, 150, true, INK, 'right');
    text(String(m.score[1]), mid + 90, sy + sh / 2 + 10, 150, true, INK, 'left');
    const nameW = side - meas(String(Math.max(m.score[0], m.score[1])), 150, true) - 40;
    rect(P + 28, sy + sh / 2 - 26, 16, 52, m.colors[0], 6);
    text(m.names[0], P + 56, sy + sh / 2, 48, true, INK, 'left', Math.max(80, nameW));
    text(m.names[1], W - P - 28, sy + sh / 2, 48, true, MUTED, 'right', Math.max(80, nameW));
    // ピリオド
    if (L.per) {
      const p = L.per;
      rect(p.x, p.y, p.w, p.headH, SOFT, 10);
      m.periods.forEach((q, i) => text(q.label, p.x + p.labW + i * p.colW + p.colW / 2, p.y + p.headH / 2, 26, true, MUTED, 'center'));
      text('計', p.x + p.labW + m.periods.length * p.colW + p.sumW / 2, p.y + p.headH / 2, 26, true, MUTED, 'center');
      [0, 1].forEach((tm) => {
        const yy = p.y + p.headH + tm * p.rowH;
        if (tm) { ctx.fillStyle = LINE; ctx.fillRect(p.x, yy, p.w, 2); }
        text(m.names[tm], p.x + 16, yy + p.rowH / 2, 28, true, tm ? MUTED : INK, 'left', p.labW - 28);
        m.periods.forEach((q, i) => text(String(q.pts[tm]), p.x + p.labW + i * p.colW + p.colW / 2, yy + p.rowH / 2, 32, false, INK, 'center'));
        text(String(m.score[tm]), p.x + p.labW + m.periods.length * p.colW + p.sumW / 2, yy + p.rowH / 2, 34, true, INK, 'center');
      });
    }
    // チームの数字
    if (L.tiles) {
      const T = L.tiles;
      text(`${m.names[0]} の数字`, P, T.y + T.secH / 2 - 4, 32, true, INK, 'left', W - 2 * P);
      T.list.forEach((t, i) => {
        const col = i % T.perRow, row = Math.floor(i / T.perRow);
        const x = P + col * (T.w + T.gap), y = T.y + T.secH + row * (T.h + T.gap);
        rect(x, y, T.w, T.h, SOFT, 18);
        rect(x, y + 18, 8, T.h - 36, ACC, 4);
        text(t.label, x + 28, y + 34, 26, true, MUTED, 'left', T.w - 44);
        text(t.value, x + 28, y + 88, 60, true, INK, 'left', T.w - 44);
        if (t.sub) text(t.sub, x + 28, y + 134, 22, false, MUTED, 'left', T.w - 44);
      });
    }
    // 選手
    if (L.table) {
      const tb = L.table, d = tb.tb;
      text('選手', P, tb.y + tb.secH / 2 - 4, 32, true, INK, 'left');
      const y0 = tb.y + tb.secH;
      rect(tb.x, y0, tb.total, tb.headH, INK, 10);
      let x = tb.x;
      const xs = tb.widths.map((w) => { const a = x; x += w; return a; });
      const px = tb.rowH < IMG.rowH ? 25 : IMG.cellPx;
      d.head.forEach((hd, i) => text(hd, i === 1 ? xs[i] + 16 : xs[i] + tb.widths[i] / 2, y0 + tb.headH / 2, IMG.headPx, true, '#ffffff', i === 1 ? 'left' : 'center', tb.widths[i] - 12));
      d.rows.forEach((r, j) => {
        const y = y0 + tb.headH + j * tb.rowH, kind = d.kinds[j];
        if (kind === 't') { rect(tb.x, y, tb.total, tb.rowH, '#e2e8f0'); ctx.fillStyle = INK; ctx.fillRect(tb.x, y, tb.total, 3); }
        else if (j % 2) rect(tb.x, y, tb.total, tb.rowH, '#f6f8fb');
        r.forEach((cell, i) => {
          const isZero = i > 1 && (cell === '0' || cell === '0/0' || cell === '—');
          text(cell, i === 1 ? xs[i] + 16 : xs[i] + tb.widths[i] / 2, y + tb.rowH / 2, px, i === 0 || kind === 't' || i === 2, isZero ? '#94a3b8' : INK, i === 1 ? 'left' : 'center', tb.widths[i] - 16);
        });
      });
      ctx.fillStyle = LINE; ctx.fillRect(tb.x, y0 + tb.headH + d.rows.length * tb.rowH, tb.total, 2);
    } else if (L.empty) {
      text('まだ記録がありません', W / 2, L.empty.y + L.empty.h / 2, 34, true, MUTED, 'center');
    }
    const note = [m.withA ? '2P・3P・FT は 成功/本数' : '2P・3P・FT は 入った本数', m.cols.some((x) => x.k === 'to') ? 'TO は ターンオーバー' : ''].filter(Boolean).join('　');
    if (!m.empty) text(note, P, L.foot.y + L.foot.h / 2, 22, false, MUTED, 'left', W - 2 * P - 260);
    text(SC.APP || 'バスケ シーン', W - P, L.foot.y + L.foot.h / 2, 22, true, '#94a3b8', 'right');
    return new Promise((resolve, reject) => {
      try { c.toBlob((b) => (b ? resolve(b) : reject(new Error('画像を作れませんでした'))), 'image/png'); } catch (e) { reject(e); }
    });
  }
  function image() {
    const g = app.S.game;
    if (!g) return Promise.reject(new Error('試合がありません'));
    return drawImage(model(g));
  }
  async function saveImage() {
    const g = app.S.game;
    if (!g || busy) return null;
    busy = true;
    try {
      const blob = await image();
      const name = BT.fileBase(g) + '_スタッツ.png';
      const r = await BT.ui.shareOrDownload(name, blob, BT.ui.canShareFiles());
      toastSaved(r, name);
      return r;
    } catch (e) { BT.ui.toast('画像を作れませんでした：' + ((e && e.message) || e), 'err', 6000); return null; } finally { busy = false; }
  }
  const csv = () => '\ufeff' + BT.boxCSV(app.S.game);
  async function saveCSV() {
    const g = app.S.game;
    if (!g) return null;
    const name = BT.fileBase(g) + '_スタッツ.csv';
    const r = await BT.ui.shareOrDownload(name, new Blob([csv()], { type: 'text/csv' }), BT.ui.canShareFiles());
    toastSaved(r, name);
    return r;
  }

  /* ---------- 土台とのやりとり ---------- */
  const showing = () => !!(pane && app.S.view === 'work' && app.S.tab === 'stats');
  app.on('change', () => { if (!app.S.game) return; if (showing()) render(); if (rep) drawReport(); });
  app.on('open', () => { closeReport(); sort = { k: 'pts', dir: -1 }; shotNo = null; more = false; });
  app.on('home', () => { closeReport(); pane = null; });
  // 反省会の画面を開いているとき：Esc で閉じる。ほかのキー（スペース・矢印）は、うしろの動画に渡さない（画面のスクロールに使う）
  root.addEventListener('keydown', (e) => {
    if (!rep) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeReport(); return; }
    e.stopPropagation();
  }, true);
  app.panel('stats', {
    mount(el) { pane = el; el.innerHTML = ''; },
    show(arg) { render(); if (arg && arg.report) openReport(); },
    hide() {},
    badge() { return ''; }
  });

  Object.assign(ST, { render, openReport, closeReport, reportOpen: () => !!rep, image, saveImage, csv, saveCSV, drawImage });
})(typeof window !== 'undefined' ? window : globalThis);
