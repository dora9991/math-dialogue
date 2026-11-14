/* バスケ タップ記録 — これまでの試合の集計（画面を持たない部分。core.js のあとに読む。node のテストからも読める）
   画面は js/totals.js。数え方（画面の下の説明と同じ）：
   ・得点・リバウンド・アシスト・スティール・ファウルは、試合ごとの BT.stats を、選んだチームの側で足す
   ・ターンオーバー ＝ 選手の行の「ターンオーバー」（tov）＋ チームの付いた「パスミス」（pass）。チームなしのパスミスは、どちらにも数えない
   ・シュートの成功率は、外れも記録した試合（BT.hasMisses）だけで計算する（ほかの試合は入れた本数しかなく、打った数が分からない）。
     入れた本数・得点は、全部の試合から
   ・勝ち負けは、試合の最後の得点（BT.score）。同じなら引き分け
   ・1試合あたり ＝ 試合の数で割る（選手は、その番号の記録が1つでもある試合の数）
   ・「直近5試合」は、そのチームの試合のうち、スタートした時刻（なければ作った時刻）の新しい 5 試合

   ■ 使い方
     const list = BT.agg.eligible(games)                    … 集計に使える試合（デモでない・記録が1つ以上）
     const tm = BT.agg.teams(list, myName)                  → { list: [{ key, label, n, n0 }], def: key }
     const all = BT.agg.gamesFor(list, key)                 → [{ game, side }]（新しい順）
     const used = BT.agg.pick(all, { recent: 5, exclude })  → 集計に入れる試合
     const r = BT.agg.compute(used)                         → まとめ・選手ごと・試合ごと・ピリオドごと（下の compute の説明）
     BT.agg.shots(used, { court, no }) / BT.agg.trend(r, metric) / BT.agg.playersCSV(r) / BT.agg.gamesCSV(r) */
(function (root) {
  'use strict';
  const BT = root.BT;
  const A = {};

  const SH_KEYS = ['fg2m', 'fg2a', 'fg3m', 'fg3a', 'ftm', 'fta'];
  const SUM_KEYS = BT.STAT_KEYS.concat(['to']);
  const zeroS = () => { const o = {}; SUM_KEYS.forEach((k) => { o[k] = 0; }); return o; };
  const zeroSh = () => { const o = {}; SH_KEYS.forEach((k) => { o[k] = 0; }); return o; };
  function addTo(dst, src, keys) { keys.forEach((k) => { dst[k] += src[k] || 0; }); }
  /* BT.stats の1人分（またはチームの合計）に、ターンオーバー（tov ＋ チームの付いたパスミス）を足したもの */
  function withTo(s) { const o = Object.assign(zeroS(), s); o.to = (s.tov || 0) + (s.pass || 0); return o; }
  A.withTo = withTo;

  /* ---------- 試合を選ぶ ---------- */
  A.plays = (game) => (game && game.events || []).filter((e) => e.type !== 'period').length;
  A.when = (game) => (game && (game.startedAt || game.createdAt)) || 0;
  A.eligible = (games) => (games || []).filter((g) => g && !g.demo && Array.isArray(g.events) && Array.isArray(g.teams) && A.plays(g) > 0);
  const nameOf = (game, side) => String(((game.teams || [])[side] || {}).name || '').trim();
  A.BLANK = '';                                 // 自分の側の名前がない試合（まとめて「自分（名前なし）」）
  A.BLANK_LABEL = '自分（名前なし）';
  A.label = (key) => (key === A.BLANK ? A.BLANK_LABEL : key);
  /* その試合で、選んだチームはどちらの側か（0・1。入らなければ null） */
  A.sideOf = function (game, key) {
    if (key === A.BLANK) return nameOf(game, 0) ? null : 0;
    if (nameOf(game, 0) === key) return 0;
    if (nameOf(game, 1) === key) return 1;
    return null;
  };
  /* 選べるチーム（どちらかの側に出てくる名前。試合の多い順）。
     def：自分の側（teams[0]）にいちばん多く出てくる名前（同じなら、自分のチームとして覚えている名前 → 新しい試合の名前） */
  A.teams = function (games, myName) {
    const map = new Map();
    const get = (key) => { if (!map.has(key)) map.set(key, { key, label: A.label(key), n: 0, n0: 0, last: 0 }); return map.get(key); };
    games.forEach((g) => {
      const n0 = nameOf(g, 0), n1 = nameOf(g, 1), t = A.when(g);
      const a = get(n0); a.n++; a.n0++; a.last = Math.max(a.last, t);
      if (n1 && n1 !== n0) { const b = get(n1); b.n++; b.last = Math.max(b.last, t); }
    });
    const list = Array.from(map.values()).sort((a, b) => (b.n - a.n) || (b.n0 - a.n0) || (b.last - a.last));
    const mine = String(myName || '').trim();
    const def = list.slice().sort((a, b) => (b.n0 - a.n0) || ((mine && b.key === mine ? 1 : 0) - (mine && a.key === mine ? 1 : 0)) || (b.last - a.last))[0];
    return { list: list.map(({ key, label, n, n0 }) => ({ key, label, n, n0 })), def: def ? def.key : null };
  };
  /* そのチームの試合（新しい順）：[{ game, side }] */
  A.gamesFor = (games, key) => games.map((game) => ({ game, side: A.sideOf(game, key) })).filter((x) => x.side != null).sort((a, b) => A.when(b.game) - A.when(a.game));
  /* 直近 n 試合（0 ならすべて）にしぼってから、外した試合（exclude：id の配列か Set）を除く */
  A.recent = (list, n) => (n > 0 ? list.slice(0, n) : list.slice());
  A.pick = function (list, opt) {
    const o = opt || {};
    const ex = o.exclude instanceof Set ? o.exclude : new Set(o.exclude || []);
    return A.recent(list, o.recent || 0).filter((x) => !ex.has(x.game.id));
  };

  /* ---------- 割合 ---------- */
  A.ratio = (m, a) => (a > 0 ? m / a : null);
  /* 成功率（0〜1 か null）：fg2・fg3・ft・fg（2P＋3P）・efg（3P を 1.5 本に） */
  A.rates = (sh) => ({
    fg2: A.ratio(sh.fg2m, sh.fg2a), fg3: A.ratio(sh.fg3m, sh.fg3a), ft: A.ratio(sh.ftm, sh.fta),
    fg: A.ratio(sh.fg2m + sh.fg3m, sh.fg2a + sh.fg3a), efg: A.ratio(sh.fg2m + 1.5 * sh.fg3m, sh.fg2a + sh.fg3a)
  });
  A.fmtPct = (v) => (v == null || !isFinite(v) ? '—' : Math.round(v * 100) + '%');
  A.fmtAvg = (v) => (v == null || !isFinite(v) ? '—' : (Math.round(v * 10) / 10).toFixed(1));
  A.fmtDiff = (v) => (v == null || !isFinite(v) ? '—' : (v > 0.04 ? '+' : v < -0.04 ? '−' : '±') + (Math.round(Math.abs(v) * 10) / 10).toFixed(1));
  const shOf = (s) => { const o = zeroSh(); addTo(o, s, SH_KEYS); return o; };

  /* ---------- 集計 ----------
     entries：[{ game, side }] → {
       n（試合）, nMiss（外れも記録した試合）, w, l, d,
       pf・pa（得点・失点の合計）, us・op（自分・相手の合計。STAT_KEYS ＋ to）, usSh・opSh（成功率用：外れも記録した試合だけの 2P・3P・FT）,
       players: [{ no, name, games, s, sh }]（背番号の順）, unknown（番号なし。なければ null）, total（チームの合計。games ＝ n）,
       games: [{ id, date, when, title, opp, side, pf, pa, res: 'W'|'L'|'D', miss, going, s, o, sh, osh }]（新しい順）,
       periods: { n（ピリオドを記録した試合）, rows: [{ period, label, n, pf, pa }] },
       color（新しい試合の、選んだ側のユニフォームの色）
     } */
  A.compute = function (entries) {
    const list = (entries || []).slice().sort((a, b) => A.when(b.game) - A.when(a.game));
    const r = { n: list.length, nMiss: 0, w: 0, l: 0, d: 0, pf: 0, pa: 0, us: zeroS(), op: zeroS(), usSh: zeroSh(), opSh: zeroSh(), players: [], unknown: null, total: null, games: [], periods: { n: 0, rows: [] }, color: null };
    const byNo = new Map();
    const unk = { no: null, name: '', games: 0, s: zeroS(), sh: zeroSh() };
    const perMap = new Map();
    list.forEach(({ game, side }) => {
      const other = 1 - side;
      const st = BT.stats(game);
      const miss = BT.hasMisses(game);
      const sc = BT.score(game);
      const us = withTo(st[side].total), op = withTo(st[other].total);
      addTo(r.us, us, SUM_KEYS); addTo(r.op, op, SUM_KEYS);
      if (miss) { r.nMiss++; addTo(r.usSh, us, SH_KEYS); addTo(r.opSh, op, SH_KEYS); }
      const pf = sc[side], pa = sc[other];
      r.pf += pf; r.pa += pa;
      const res = pf > pa ? 'W' : pf < pa ? 'L' : 'D';
      if (res === 'W') r.w++; else if (res === 'L') r.l++; else r.d++;
      if (!r.color) r.color = ((game.teams || [])[side] || {}).color || null;
      r.games.push({ id: game.id, date: game.date || '', when: A.when(game), title: game.title || '', opp: BT.teamName(game, other), side, pf, pa, res, miss, going: !!(game.startedAt && !game.endedAt), s: us, o: op, sh: miss ? shOf(us) : null, osh: miss ? shOf(op) : null });
      // 選手（背番号ごと）。名前は、新しい試合の名前（空でないもの）
      st[side].rows.forEach((row) => {
        if (BT.isEmpty(row.s)) return;
        if (!byNo.has(row.no)) byNo.set(row.no, { no: row.no, name: '', games: 0, s: zeroS(), sh: zeroSh() });
        const p = byNo.get(row.no);
        p.games++;
        if (!p.name && row.name) p.name = row.name;
        const s = withTo(row.s);
        addTo(p.s, s, SUM_KEYS);
        if (miss) addTo(p.sh, s, SH_KEYS);
      });
      if (!BT.isEmpty(st[side].unknown)) {
        unk.games++;
        const s = withTo(st[side].unknown);
        addTo(unk.s, s, SUM_KEYS);
        if (miss) addTo(unk.sh, s, SH_KEYS);
      }
      // ピリオド：ピリオドを進めた試合（2 以上の 'period' がある）だけ（進めていない試合は、全部が 1Q に入ってしまうので）
      if ((game.events || []).some((e) => e.type === 'period' && e.period >= 2)) {
        r.periods.n++;
        BT.periodScores(game).forEach((p) => {
          if (!perMap.has(p.period)) perMap.set(p.period, { period: p.period, label: BT.periodLabel(p.period), n: 0, pf: 0, pa: 0 });
          const x = perMap.get(p.period);
          x.n++; x.pf += p.pts[side]; x.pa += p.pts[other];
        });
      }
    });
    r.players = Array.from(byNo.values()).sort((a, b) => BT.cmpNo(a.no, b.no));
    r.unknown = unk.games ? unk : null;
    r.total = { no: null, name: '合計', games: r.n, s: r.us, sh: r.usSh };
    r.periods.rows = Array.from(perMap.values()).sort((a, b) => a.period - b.period);
    return r;
  };

  /* ---------- シュートの場所 ----------
     選んだ側のシュート（場所のあるもの）を、全部の試合から。opt：{ court（'std'|'mini'。なければ、多いほう）, no（背番号。なければ全員） }
     → { court, courts: { std, mini }（場所のある試合の数）, zones: [{ id, label, made, att, madeAll }]（made・att は外れも記録した試合だけ。madeAll は全部）,
         shots: [{ x, y, made, no }]（図に打つ点。全部の試合）, nos（場所のある番号）, located, nGames（その場所の図に入る試合）, nMissGames（そのうち外れも記録した試合）, best, worst } */
  A.MIN_ZONE = 5;
  A.courtCounts = function (entries) {
    const c = { std: 0, mini: 0 };
    entries.forEach(({ game, side }) => { if ((game.events || []).some((e) => e.team === side && BT.hasLoc(e))) c[BT.courtOf(game)]++; });
    return c;
  };
  A.shots = function (entries, opt) {
    const o = opt || {};
    const courts = A.courtCounts(entries);
    const court = o.court === 'mini' || o.court === 'std' ? o.court : courts.mini > courts.std ? 'mini' : 'std';
    const zones = BT.SHOT_ZONES(court).map((z) => ({ id: z.id, label: z.label, made: 0, att: 0, madeAll: 0 }));
    const by = {};
    zones.forEach((z) => { by[z.id] = z; });
    const shots = [], nos = new Set();
    let nGames = 0, nMissGames = 0;
    entries.forEach(({ game, side }) => {
      if (BT.courtOf(game) !== court) return;
      const evs = (game.events || []).filter((e) => e.team === side && BT.hasLoc(e));
      if (!evs.length) return;
      nGames++;
      const miss = BT.hasMisses(game);
      if (miss) nMissGames++;
      evs.forEach((e) => {
        if (e.no != null) nos.add(e.no);
        if (o.no != null && e.no !== String(o.no)) return;
        const made = !!BT.TYPE[e.type].made;
        const z = by[BT.shotZone(e.x, e.y, court).id];
        if (made) z.madeAll++;
        if (miss) { z.att++; if (made) z.made++; }
        shots.push({ x: e.x, y: e.y, made, no: e.no });
      });
    });
    // いちばん入る・入らないゾーン（外れも記録した試合で、MIN_ZONE 本以上打ったゾーンだけ）
    const ok = zones.filter((z) => z.att >= A.MIN_ZONE).map((z) => Object.assign({ rate: z.made / z.att }, z));
    const best = ok.slice().sort((a, b) => (b.rate - a.rate) || (b.att - a.att))[0] || null;
    const worst = ok.length >= 2 ? ok.slice().sort((a, b) => (a.rate - b.rate) || (b.att - a.att))[0] : null;
    return { court, courts, zones, shots, nos: BT.sortNos(Array.from(nos)), located: shots.length, nGames, nMissGames, best, worst: worst && best && worst.id !== best.id ? worst : null };
  };

  /* ---------- 試合ごとの流れ（グラフ） ----------
     metric：'pts'（得点と失点）| 'fg'（シュート成功率。外れも記録した試合だけ。ほかは null）| 'to'（ターンオーバー）
     → [{ id, date, values: [..] }]（古い順） */
  A.METRICS = [
    { id: 'pts', label: '得点と失点', series: ['得点', '失点'], pct: false },
    { id: 'fg', label: 'シュート成功率', series: ['シュート成功率'], pct: true },
    { id: 'to', label: 'ターンオーバー', series: ['ターンオーバー'], pct: false }
  ];
  A.trend = function (r, metric) {
    return r.games.slice().reverse().map((g) => {
      let values;
      if (metric === 'fg') values = [g.sh ? A.rates(g.sh).fg : null];
      else if (metric === 'to') values = [g.s.to];
      else values = [g.pf, g.pa];
      return { id: g.id, date: g.date, opp: g.opp, values };
    });
  };

  /* ---------- CSV（先頭の BOM は呼び出し側で） ---------- */
  function cell(v) { const s = v == null ? '' : String(v); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
  const csv = (rows) => rows.map((x) => x.map(cell).join(',')).join('\r\n') + '\r\n';
  A.csv = csv;
  const pctCell = (v) => (v == null ? '' : Math.round(v * 1000) / 10);
  const avgCell = (v, n) => (n ? Math.round(v / n * 10) / 10 : '');
  /* 選手ごと（合計の数。成功率は、外れも記録した試合だけで） */
  A.playersCSV = function (r) {
    const head = ['背番号', '名前', '試合数', '得点', '1試合平均得点', '2P成功', '3P成功', 'FT成功',
      '2P成功（外れも記録した試合）', '2P試投（外れも記録した試合）', '2P成功率%', '3P成功（外れも記録した試合）', '3P試投（外れも記録した試合）', '3P成功率%',
      'FT成功（外れも記録した試合）', 'FT試投（外れも記録した試合）', 'FT成功率%', 'FG成功率%', 'eFG%',
      'リバウンド', 'うちオフェンス', 'アシスト', 'スティール', 'ターンオーバー', 'ファウル'];
    const line = (no, name, p) => {
      const rt = A.rates(p.sh);
      return [no, name, p.games, p.s.pts, avgCell(p.s.pts, p.games), p.s.fg2m, p.s.fg3m, p.s.ftm,
        p.sh.fg2m, p.sh.fg2a, pctCell(rt.fg2), p.sh.fg3m, p.sh.fg3a, pctCell(rt.fg3), p.sh.ftm, p.sh.fta, pctCell(rt.ft), pctCell(rt.fg), pctCell(rt.efg),
        p.s.reb, p.s.oreb, p.s.ast, p.s.stl, p.s.to, p.s.foul];
    };
    const rows = [head];
    r.players.forEach((p) => rows.push(line(p.no, p.name, p)));
    if (r.unknown) rows.push(line('番号なし', '', r.unknown));
    rows.push(line('合計', '', r.total));
    return csv(rows);
  };
  /* 試合ごと（新しい順） */
  A.gamesCSV = function (r) {
    const head = ['日付', '相手', '得点', '失点', '勝敗', '外れの記録', '2P成功', '2P試投', '3P成功', '3P試投', 'FT成功', 'FT試投', 'FG成功率%', '3P成功率%', 'FT成功率%', 'リバウンド', 'アシスト', 'スティール', 'ターンオーバー', 'ファウル', '相手のリバウンド', '相手のターンオーバー'];
    const rows = [head];
    r.games.forEach((g) => {
      const rt = g.sh ? A.rates(g.sh) : {};
      rows.push([g.date, g.opp, g.pf, g.pa, g.res === 'W' ? '勝ち' : g.res === 'L' ? '負け' : '引き分け', g.miss ? 'あり' : 'なし',
        g.s.fg2m, g.miss ? g.s.fg2a : '', g.s.fg3m, g.miss ? g.s.fg3a : '', g.s.ftm, g.miss ? g.s.fta : '',
        pctCell(rt.fg), pctCell(rt.fg3), pctCell(rt.ft), g.s.reb, g.s.ast, g.s.stl, g.s.to, g.s.foul, g.o.reb, g.o.to]);
    });
    return csv(rows);
  };

  BT.agg = A;
})(typeof window !== 'undefined' ? window : globalThis);
