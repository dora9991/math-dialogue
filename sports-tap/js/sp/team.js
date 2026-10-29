/* スポーツ タップ記録 — チームの行で記録する種目（サッカー・フットサル・ハンドボール・ラグビー）。画面を持たない部分
   記録の画面は、バスケ タップ記録と同じ「選手1人＝1行」。行のボタンを1回押せば、その選手のプレーとして時刻つきで残る。
   種目ごとに違うのは、ボタン（得点の種類・ミス・カード）と、試合の進み方（前半・後半・延長・PK戦）・一時退場・累積ファウル。

   ■ この種目たちの記録（core.js の形に足すもの）
     type 'period'：ピリオド（前半・後半…）の始まり { period }。'pend'：その終わり { period }（ハーフタイムの間は時計を止めて見せる）
     ピリオドの番号：1 前半・2 後半・3 延長前半・4 延長後半・9 PK戦（7mTC）
     その時刻のピリオドは「その時刻より前の、いちばん新しい 'period'」（periodAt）。始めた時刻を直せば、それより後の記録は全部そのピリオドになる。
   ■ 時計
     画面の時計は「いまのピリオドが始まってからの時間」（サッカーの「前半 23 分」と同じ）。前半の長さ（opts.len 分）を過ぎると「40+1:23」。
     記録の t は、どれも「スタートからの秒」（止まらない。動画と合わせられる）。 */
(function (root) {
  'use strict';
  const ST = root.ST;
  const SO = 9;                // PK戦・7mTC のピリオドの番号

  /* ---------- ボタンの色（どの種目も同じ考え：得点は緑系・ミスは白地にふち・カードは黄と赤） ---------- */
  const C = { goal: '#15803d', shot: '#0f766e', ast: '#1d4ed8', foul: '#a16207', yc: '#eab308', rc: '#dc2626', save: '#7c3aed', tf: '#c2410c', set: '#475569', try: '#15803d', con: '#0e7490', pg: '#7c3aed', dg: '#b45309', tackle: '#1d4ed8', pen: '#a16207', so: '#15803d' };

  /* 共通の記録 */
  const COMMON = [
    { id: 'period', label: 'ピリオド開始', meta: true, noTeam: true, kind: 'meta' },
    { id: 'pend', label: 'ピリオド終了', meta: true, noTeam: true, kind: 'meta' },
    { id: 'mark', btn: '★ あとで見る', label: '★ あとで見る', kind: 'mark', global: true },
    { id: 'sog', btn: '成功', label: '成功', kind: 'made', col: C.so, so: true },
    { id: 'sox', btn: '×', label: '失敗', kind: 'miss', col: C.so, so: true, of: 'sog' }
  ];

  /* ピリオドの名前 */
  function periodName(sp, p) {
    if (p === SO) return sp.shootout || 'PK戦';
    return sp.periodNames[p - 1] || `第${p}ピリオド`;
  }
  /* ピリオドの長さ（秒）。1・2 は opts.len 分、3・4（延長）は opts.elen 分。PK戦は時計なし */
  function periodLen(sp, game, p) {
    if (p === SO) return 0;
    const o = game.opts || {};
    return (p <= 2 ? o.len : o.elen || 0) * 60;
  }

  /* ---------- ピリオド（記録から計算する） ---------- */
  /* ピリオドの並び：[{ p, start, end（終わっていなければ null） }]（始まった順） */
  function periods(game) {
    const list = [];
    ST.sorted(game).forEach((e) => {
      if (e.type === 'period') list.push({ p: e.period, start: e.t, end: null, id: e.id });
      else if (e.type === 'pend') { const cur = list[list.length - 1]; if (cur && cur.end == null && e.t >= cur.start) cur.end = e.t; }
    });
    return list;
  }
  /* 記録ごとのピリオド（Map：記録の id → ピリオド）。時刻の順に見ていくので、同じ時刻のときは「足した順」で決まる
     （前半の最後のファウルと、後半の始まりが同じ秒でも、ファウルは前半） */
  function periodMap(game) {
    const m = new Map();
    let p = 1;
    ST.sorted(game).forEach((e) => { if (e.type === 'period') p = e.period; m.set(e.id, p); });
    return m;
  }
  function periodAt(game, t) {
    let p = 1, best = -Infinity;
    (game.events || []).forEach((e) => { if (e.type === 'period' && e.t <= t + 1e-9 && e.t >= best) { best = e.t; p = e.period; } });
    return p;
  }
  /* いまの時計：{ p, name, sec（ピリオドが始まってからの秒）, len, over（長さを過ぎた秒）, ended（ピリオドが終わっている）} */
  function clockAt(sp, game, t) {
    const ps = periods(game).filter((x) => x.start <= t + 1e-9);
    const cur = ps[ps.length - 1];
    if (!cur) return { p: game.startPeriod || 1, name: periodName(sp, game.startPeriod || 1), sec: 0, len: periodLen(sp, game, 1), over: 0, ended: false, before: true };
    const ended = cur.end != null && cur.end <= t + 1e-9;
    const sec = Math.max(0, (ended ? cur.end : t) - cur.start);
    const len = periodLen(sp, game, cur.p);
    return { p: cur.p, name: periodName(sp, cur.p), sec, len, over: len && sec > len ? sec - len : 0, ended };
  }
  /* 試合が進んでいた時間（ピリオドの間だけ。ハーフタイムは数えない）。一時退場の残り時間に使う */
  function playTime(game, t) {
    let s = 0;
    periods(game).forEach((x) => { if (x.p === SO) return; const a = x.start, b = x.end == null ? t : Math.min(x.end, t); if (b > a) s += b - a; });
    return s;
  }

  /* ---------- 一時退場・退場 ---------- */
  /* t の時点で：outs（もう出られない選手 'チーム:番号'）, susp（一時退場中 [{ team, no, rem, label }]）, short（チームごとの人数の少なさ） */
  function penalties(sp, game, t) {
    const now = playTime(game, t);
    const outs = new Set(), susp = [];
    const cnt = {};
    ST.sorted(game).forEach((e) => {
      if (e.t > t + 1e-9 || e.team == null) return;
      const d = sp.TYPE[e.type];
      if (!d || !(d.susp || d.suspOpt || d.out || d.teamSusp || d.yellow)) return;
      const key = e.team + ':' + (e.no == null ? '' : e.no);
      cnt[key] = cnt[key] || { yc: 0, susp: 0 };
      if (d.yellow) cnt[key].yc++;
      const dsusp = d.susp || (d.suspOpt ? ((game.opts || {})[d.suspOpt] || 0) * 60 : 0);    // ラグビーのシンビン：試合の形式の長さ
      if (dsusp) cnt[key].susp++;
      let out = !!d.out;
      if (sp.twoYellowOut && d.yellow && cnt[key].yc >= 2) out = true;           // サッカー：警告 2 回で退場
      if (sp.suspOut && dsusp && cnt[key].susp >= sp.suspOut) out = true;        // ハンドボール：3 回目の 2 分間退場で失格
      if (out && e.no != null) outs.add(key);
      const dur = dsusp || d.teamSusp || (out && sp.outTeamSusp) || 0;
      if (dur) {
        const rem = dur - (now - playTime(game, e.t));
        if (rem > 0) susp.push({ team: e.team, no: e.no, rem, label: d.short || d.label, id: e.id });
      }
    });
    const short = [0, 0];
    susp.forEach((x) => { short[x.team]++; });
    // 退場（ずっと出られない）で、チームの人数が試合の終わりまで減る種目（サッカー・ラグビーのレッド）
    if (sp.redShort) outs.forEach((k) => { const tm = Number(k.split(':')[0]); if (!susp.some((x) => x.team === tm && k === tm + ':' + x.no)) short[tm]++; });
    return { outs, susp, short };
  }

  /* ---------- 累積ファウル（フットサル） ---------- */
  /* ピリオドごとのチームファウル Map(ピリオド → [自分, 相手])。carry：後半の数を延長にも続ける */
  function teamFouls(sp, game) {
    const tf = sp.teamFoul;
    const map = new Map();
    if (!tf) return map;
    const pm = periodMap(game);
    (game.events || []).forEach((e) => {
      if (e.type !== tf.type || (e.team !== 0 && e.team !== 1)) return;
      let p = pm.get(e.id);
      if (p === SO) return;
      if (tf.carry && p > 2) p = 2;
      if (!map.has(p)) map.set(p, [0, 0]);
      map.get(p)[e.team]++;
    });
    return map;
  }
  function foulsNow(sp, game, t) {
    const tf = sp.teamFoul;
    if (!tf) return null;
    let p = periodAt(game, t);
    if (tf.carry && p > 2) p = 2;
    return (teamFouls(sp, game).get(p) || [0, 0]).slice();
  }

  /* ---------- 得点 ---------- */
  function score(game) {
    const sp = ST.sportOf(game);
    const s = [0, 0];
    (game.events || []).forEach((e) => { const d = sp.TYPE[e.type]; if (d && d.pts && (e.team === 0 || e.team === 1)) s[e.team] += d.pts; });
    return s;
  }
  function shootout(game) {
    const s = [0, 0], a = [0, 0];
    (game.events || []).forEach((e) => { if ((e.type === 'sog' || e.type === 'sox') && (e.team === 0 || e.team === 1)) { a[e.team]++; if (e.type === 'sog') s[e.team]++; } });
    return a[0] + a[1] ? s : null;
  }
  function scoreText(game) {
    const sp = ST.sportOf(game);
    const s = score(game), so = shootout(game);
    return `${s[0]} − ${s[1]}` + (so ? `（${sp.shootoutShort || 'PK'} ${so[0]}−${so[1]}）` : '');
  }

  /* ---------- 行のボタン ---------- */
  /* 選手の行に並ぶ種類（いつもある base ＋ 設定で選んだもの。並びは rowOrder）。PK戦の間は「成功」「×」だけ */
  function rowTypes(sp, sprefs, p) {
    if (p === SO) return ['sog', 'sox'];
    const on = new Set(sp.base);
    (sp.toggles || []).forEach((tg) => { if (tg.row !== 'team' && isOn(sprefs, tg)) tg.types.forEach((x) => on.add(x)); });
    return sp.rowOrder.filter((x) => on.has(x));
  }
  /* チームの行（チームとしての記録：CK・FK・タイムアウト…）。設定で消せる。PK戦の間はなし */
  function teamTypes(sp, sprefs, p) {
    if (p === SO || !sp.teamTypes || !sp.teamTypes.length) return [];
    const tg = (sp.toggles || []).find((x) => x.row === 'team');
    return !tg || isOn(sprefs, tg) ? sp.teamTypes.slice() : [];
  }
  function isOn(sprefs, tg) { const r = (sprefs && sprefs.rows) || {}; return r[tg.key] != null ? !!r[tg.key] : !!tg.def; }
  const WEIGHT = (sp, id) => ((sp.TYPE[id] || {}).kind === 'miss' ? 0.75 : 1);
  /* 一覧で直すときに選べる種類 */
  function editTypes(sp, game, e, sprefs) {
    const d = sp.TYPE[e.type] || {};
    if (d.so) return ['sog', 'sox'];
    const ids = [];
    const add = (x) => { if (!ids.includes(x) && sp.TYPE[x]) ids.push(x); };
    rowTypes(sp, sprefs, 1).forEach(add);
    (sp.teamTypes || []).forEach(add);
    (sp.globalTypes || []).forEach(add);
    if (!ids.includes(e.type)) add(e.type);
    return ids;
  }

  /* ---------- 集計 ---------- */
  /* 選手ごと：[{ team, rows: [{ no, name, c（種類 → 回数）, pts }], unknown: { c, pts }, teamRow: { c }, total: { c, pts } }] */
  function stats(game) {
    const sp = ST.sportOf(game);
    return [0, 1].map((tm) => {
      const team = game.teams[tm] || ST.blankTeam(tm);
      const byNo = new Map();
      const blank = () => ({ c: {}, pts: 0 });
      team.players.forEach((p) => byNo.set(p.no, Object.assign({ no: p.no, name: p.name }, blank())));
      const unknown = blank(), total = blank();
      (game.events || []).forEach((e) => {
        const d = sp.TYPE[e.type];
        if (!d || d.meta || e.team !== tm) return;
        let s = unknown;
        if (e.no != null) {
          if (!byNo.has(e.no)) byNo.set(e.no, Object.assign({ no: e.no, name: '', extra: true }, blank()));
          s = byNo.get(e.no);
        }
        [s, total].forEach((x) => { x.c[e.type] = (x.c[e.type] || 0) + 1; x.pts += d.pts || 0; });
      });
      const rows = Array.from(byNo.values()).sort((a, b) => ST.cmpNo(a.no, b.no));
      return { team: tm, rows, unknown, total };
    });
  }
  /* 集計の表の列：{ key, label, n（数える種類）, a（打った数に入れる種類。あれば「成功/打った数」）, pts（得点） }。記録のある列だけ出す */
  function colValue(col, s) {
    if (col.pts) return s.pts ? String(s.pts) : '';
    const n = (col.n || []).reduce((m, t) => m + (s.c[t] || 0), 0);
    if (col.a) { const a = col.a.reduce((m, t) => m + (s.c[t] || 0), 0); return a ? `${n}/${a}` : ''; }
    return n ? String(n) : '';
  }
  function usedCols(sp, st) {
    return sp.cols.filter((col) => col.pts || st.some((x) => colValue(col, x.total) !== ''));
  }
  const isEmpty = (s) => !Object.keys(s.c).length;
  /* ピリオドごとの得点 [{ p, label, pts: [自分, 相手] }]（PK戦は入れない） */
  function periodScores(game) {
    const sp = ST.sportOf(game);
    const map = new Map();
    const get = (p) => { if (!map.has(p)) map.set(p, { p, label: periodName(sp, p), pts: [0, 0] }); return map.get(p); };
    const pm = periodMap(game);
    (game.events || []).forEach((e) => {
      if (e.type === 'period') { if (e.period !== SO) get(e.period); return; }
      const d = sp.TYPE[e.type];
      if (!d || d.meta || d.so) return;
      const p = pm.get(e.id);
      if (p === SO) return;
      const row = get(p);
      if (d.pts && e.team != null) row.pts[e.team] += d.pts;
    });
    if (!map.size) get(1);
    return Array.from(map.values()).sort((a, b) => a.p - b.p);
  }

  /* ---------- 名前・CSV ---------- */
  function eventText(game, e, withTeam) {
    const sp = ST.sportOf(game);
    if (e.type === 'period') return `${periodName(sp, e.period)} 開始`;
    if (e.type === 'pend') return `${periodName(sp, e.period)} 終了`;
    return null;
  }
  function typeLabel(game, e) {
    const sp = ST.sportOf(game);
    const d = sp.TYPE[e.type];
    if (!d) return e.type;
    if (d.so) return `${sp.shootout || 'PK戦'} ${d.label}`;
    return d.label;
  }
  /* ピリオドの時間の呼び名：「前半 23:41」「後半 40+1:05」 */
  function clockText(sp, game, t) {
    const c = clockAt(sp, game, t);
    if (c.p === SO) return c.name;
    return `${c.name} ${c.over ? Math.round(c.len / 60) + '+' + ST.fmtTime(c.over) : ST.fmtTime(c.sec)}`;
  }
  function csvEvents(game) {
    const sp = ST.sportOf(game);
    const rows = [['No', '時刻', 'スタートからの秒', 'ピリオド', 'ピリオドの時間', 'チーム', '背番号', '名前', '記録', '得点', `${ST.teamName(game, 0)}の得点`, `${ST.teamName(game, 1)}の得点`]];
    const s = [0, 0];
    let n = 0;
    const pm = periodMap(game);
    ST.sorted(game).forEach((e) => {
      const d = sp.TYPE[e.type] || { label: e.type };
      if (d.meta) { rows.push(['', ST.fmtTime(e.t), e.t, periodName(sp, e.period), '', '', '', '', eventText(game, e), '', s[0], s[1]]); return; }
      if (e.team != null && d.pts) s[e.team] += d.pts;
      const c = clockAt(sp, game, e.t);
      const ct = c.p === SO ? '' : c.over ? Math.round(c.len / 60) + '+' + ST.fmtTime(c.over) : ST.fmtTime(c.sec);
      rows.push([++n, ST.fmtTime(e.t), e.t, periodName(sp, pm.get(e.id)), ct, ST.teamName(game, e.team), e.no != null ? e.no : '', e.no != null ? ST.playerName(game, e.team, e.no) : '', typeLabel(game, e), d.pts || '', s[0], s[1]]);
    });
    return rows;
  }
  function csvBox(game) {
    const sp = ST.sportOf(game);
    const st = stats(game);
    const cols = sp.cols.concat(sp.shootout ? [{ key: 'so', label: sp.shootout, n: ['sog'], a: ['sog', 'sox'] }] : []);
    const rows = [['チーム', '背番号', '名前'].concat(cols.map((c) => c.label))];
    st.forEach((x) => {
      const name = ST.teamName(game, x.team);
      x.rows.forEach((r) => rows.push([name, r.no, r.name].concat(cols.map((c) => colValue(c, r)))));
      if (!isEmpty(x.unknown)) rows.push([name, '番号なし・チーム', ''].concat(cols.map((c) => colValue(c, x.unknown))));
      rows.push([name, '合計', ''].concat(cols.map((c) => colValue(c, x.total))));
    });
    return rows;
  }

  /* ---------- 種目をつくる ---------- */
  function teamSport(def) {
    const sp = Object.assign({
      family: 'team', prec: 10, hasTeams: true, periodNames: ['前半', '後半', '延長前半', '延長後半'], SO,
      globalTypes: ['mark']
    }, def);
    sp.TYPES = COMMON.concat(def.TYPES);
    sp.TYPE = {};
    sp.TYPES.forEach((d) => { sp.TYPE[d.id] = d; });
    sp.defaultOpts = () => Object.assign({ len: def.lenDefault, elen: def.elenDefault }, def.moreOpts ? def.moreOpts() : {});
    sp.optFields = [
      { key: 'len', label: `${sp.periodNames[0]}・${sp.periodNames[1]}の長さ`, choices: def.lenChoices.map((m) => [m, `${m}分`]), note: def.lenNote },
      { key: 'elen', label: '延長の長さ（1本）', choices: def.elenChoices.map((m) => [m, `${m}分`]) }
    ].concat(def.moreFields || []);
    sp.onStart = (game) => { ST.addEvent(game, { t: 0, type: 'period', period: game.startPeriod || 1 }); delete game.startPeriod; };
    sp.periodName = (p) => periodName(sp, p);
    sp.periodLen = (game, p) => periodLen(sp, game, p);
    sp.periods = periods; sp.periodAt = periodAt; sp.periodMap = periodMap;
    sp.clockAt = (game, t) => clockAt(sp, game, t);
    sp.clockText = (game, t) => clockText(sp, game, t);
    sp.playTime = playTime;
    sp.penalties = (game, t) => penalties(sp, game, t);
    sp.teamFouls = (game) => teamFouls(sp, game);
    sp.foulsNow = (game, t) => foulsNow(sp, game, t);
    sp.score = score; sp.soScore = shootout; sp.scoreText = scoreText;
    sp.rowTypes = (sprefs, p) => rowTypes(sp, sprefs, p);
    sp.teamTypesOf = (sprefs, p) => teamTypes(sp, sprefs, p);
    sp.weight = (id) => WEIGHT(sp, id);
    sp.editTypes = (game, e, sprefs) => editTypes(sp, game, e, sprefs);
    sp.stats = stats; sp.colValue = colValue; sp.usedCols = (st) => usedCols(sp, st); sp.isEmpty = isEmpty;
    sp.periodScores = periodScores;
    sp.eventText = eventText; sp.typeLabel = typeLabel;
    sp.csvEvents = csvEvents; sp.csvBox = csvBox;
    sp.cleanEvent = (e) => {
      if (e.type === 'period' || e.type === 'pend') return isFinite(e.period) && e.period >= 1 ? { period: Math.min(SO, Math.round(e.period)) } : null;
      return {};
    };
    sp.keepFirst = true;               // スタートの記録（前半の始まり）は、取り消し・消すができない（時刻は直せる）
    sp.startHint = `${def.start || 'キックオフ'}（試合開始）の瞬間`;
    sp.timeText = (game, e) => ((sp.TYPE[e.type] || {}).meta ? ST.fmtTime(e.t) : clockText(sp, game, e.t));
    sp.whoText = (game, e) => {
      if (e.team == null) return 'チームなし';
      const nm = e.no != null ? ST.playerName(game, e.team, e.no) : '';
      return `${ST.teamName(game, e.team)} ${e.no != null ? '#' + e.no + (nm ? ' ' + nm : '') : (sp.teamTypes || []).includes(e.type) ? '（チーム）' : '番号なし'}`;
    };
    const first = (sp.TYPE[sp.base[0]] || {}).btn || '';
    sp.steps = def.steps || [
      ['チームと背番号を選ぶ', '「' + sp.presets[0][0] + '」などのボタンでまとめて。自分のチームは次から自動で入ります。相手の背番号は入れなくても大丈夫です（チームの1行になります）'],
      [`${def.start || 'キックオフ'}で ▶ スタート`, '時計（前半が始まってからの時間）が動き出します'],
      ['選手の行のボタンを1回タップ', `「10」の行の「${first}」を押すだけ。押した瞬間の時刻で残ります`],
      ['前半が終わったら「前半」→「前半を終える」', '後半の始まりで「後半を始める」。延長' + (sp.shootout ? `・${sp.shootout}` : '') + 'も同じところから']
    ];
    sp.help = [['記録の画面', [
      '選手の行：背番号の小さい順に上から並びます。行のボタンを押すと、その選手の記録になります（ボタンの右上の小さな数は、その選手の回数）',
      '「？」の行：だれか分からないとき。チームの記録になります（あとで一覧から番号を付けられます）',
      sp.teamTypes && sp.teamTypes.length ? `「チーム」の行：${sp.teamTypes.map((x) => sp.TYPE[x].label).join('・')}など、チームとしての記録` : null,
      '画面の下の「★ あとで見る」：だれのかは決めずに、時刻だけを残します。あとで動画で見返すときの目印に',
      `ボタンを足す：「≡ メニュー」→「設定」で、${(sp.toggles || []).filter((x) => x.row !== 'team').map((x) => x.label.replace(/（.*$/, '')).join('・')}のボタンを出せます`,
      '名簿にない背番号は、チームの帯の「＋番号」で足せます'
    ].filter(Boolean)], ['時計とピリオド', [
      `時計は「いまのピリオドが始まってからの時間」です。${sp.periodNames[0]}の長さを過ぎると「40+1:23」のように、過ぎた時間が出ます`,
      `時計の右の「${sp.periodNames[0]}」を押して「${sp.periodNames[0]}を終える」「${sp.periodNames[1]}を始める」。押し忘れても、あとで一覧で時刻を直せます`,
      sp.shootout ? `${sp.shootout}：「${sp.periodNames[1]}」または「延長後半」から「${sp.shootout}を始める」。選手の行のボタンが「成功」「×」に変わり、得点の横に結果が出ます` : null,
      'ハーフタイムの間も、記録の時刻（スタートからの時間）は止まらずに進みます（動画と同じ時間の流れ）'
    ].filter(Boolean)]].concat(def.moreHelp || []);
    sp.exportExtra = (game, g) => {
      g.periodNames = {};
      [1, 2, 3, 4, SO].forEach((p) => { g.periodNames[p] = periodName(sp, p); });
      const pm = periodMap(game);
      g.events.forEach((e) => { if (e.type !== 'period' && e.type !== 'pend') e.period = pm.get(e.id); });
      const so = shootout(game);
      if (so) g.shootout = so;
    };
    return ST.addSport(sp);
  }
  ST.teamSport = teamSport;

  /* ========== サッカー ========== */
  teamSport({
    id: 'soccer', name: 'サッカー', icon: '⚽', desc: 'ゴール・シュート・アシスト・カード・CK／FK。前半・後半とアディショナルタイム、PK戦',
    lenChoices: [45, 40, 35, 30, 25, 20, 15, 12, 10], lenDefault: 40, lenNote: '高校 40 分・中学 30〜35 分・一般 45 分・8人制（小学生）15〜20 分',
    elenChoices: [15, 10, 5], elenDefault: 10,
    shootout: 'PK戦', shootoutShort: 'PK', twoYellowOut: true, redShort: true,
    presets: [['1〜11', '1-11'], ['1〜18', '1-18'], ['1〜20', '1-20'], ['1〜25', '1-25']],
    start: 'キックオフ',
    TYPES: [
      { id: 'goal', btn: 'ゴール', label: 'ゴール', pts: 1, kind: 'made', col: C.goal, shot: true },
      { id: 'shot', btn: 'シュート', btnShort: '×', label: 'シュート（外れ・止められた）', short: 'シュート', kind: 'miss', col: C.goal, shot: true, of: 'goal' },
      { id: 'ast', btn: 'アシスト', btnShort: 'A', label: 'アシスト', kind: 'good', col: C.ast },
      { id: 'save', btn: 'セーブ', label: 'セーブ（GK）', kind: 'good', col: C.save },
      { id: 'foul', btn: 'ファウル', btnShort: 'F', label: 'ファウル', kind: 'foul', col: C.foul },
      { id: 'yc', btn: '警告', label: '警告（イエロー）', kind: 'card', col: C.yc, yellow: true },
      { id: 'rc', btn: '退場', label: '退場（レッド）', kind: 'card', col: C.rc, out: true },
      { id: 'ck', btn: 'CK', label: 'コーナーキック', kind: 'set', col: C.set },
      { id: 'fk', btn: 'FK', label: 'フリーキック', kind: 'set', col: C.set },
      { id: 'off', btn: 'オフサイド', btnShort: 'OS', label: 'オフサイド', kind: 'set', col: C.set }
    ],
    base: ['goal', 'shot'],
    rowOrder: ['goal', 'shot', 'ast', 'save', 'foul', 'yc', 'rc'],
    teamTypes: ['ck', 'fk', 'off'],
    toggles: [
      { key: 'ast', label: 'アシスト', types: ['ast'] },
      { key: 'card', label: '警告・退場（イエロー・レッド。警告2回で退場の印）', types: ['yc', 'rc'] },
      { key: 'foul', label: 'ファウル', types: ['foul'] },
      { key: 'save', label: 'セーブ（GK）', types: ['save'] },
      { key: 'team', label: 'チームの行（CK・FK・オフサイド）', types: ['ck', 'fk', 'off'], row: 'team', def: true }
    ],
    cols: [
      { key: 'pts', label: '得点', pts: true }, { key: 'shot', label: 'シュート', n: ['goal', 'shot'] }, { key: 'ast', label: 'アシスト', n: ['ast'] },
      { key: 'save', label: 'セーブ', n: ['save'] }, { key: 'foul', label: 'ファウル', n: ['foul'] }, { key: 'yc', label: '警告', n: ['yc'] }, { key: 'rc', label: '退場', n: ['rc'] },
      { key: 'ck', label: 'CK', n: ['ck'] }, { key: 'fk', label: 'FK', n: ['fk'] }, { key: 'off', label: 'オフサイド', n: ['off'] }
    ],
    moreHelp: [['サッカーのしくみ', [
      'シュート：「ゴール」と「シュート」（外れ・止められた）で、集計にシュート数と決定率が出ます',
      '警告・退場：設定で出せます。警告2回で、その選手の行に「退場」の印。チームの帯に「−1」（1人少ない）',
      'オウンゴールは、相手チームの「？」の行の「ゴール」で記録してください（得点は相手に入ります）'
    ]]]
  });

  /* ========== フットサル ========== */
  teamSport({
    id: 'futsal', name: 'フットサル', icon: '🥅', desc: 'ゴール・シュート・ファウル。前半・後半の累積ファウル（6つ目から第2PK）・タイムアウト',
    lenChoices: [20, 15, 12, 10, 8], lenDefault: 20, lenNote: '公式は 20 分（プレーイングタイム）。この時計は止まらずに進みます',
    elenChoices: [5, 3], elenDefault: 5,
    shootout: 'PK戦', shootoutShort: 'PK', twoYellowOut: true, outTeamSusp: 120,
    teamFoul: { type: 'foul', warn: 5, limit: 6, carry: true, label: '累積ファウル' },
    presets: [['1〜12', '1-12'], ['1〜14', '1-14'], ['1〜15', '1-15']],
    start: 'キックオフ',
    TYPES: [
      { id: 'goal', btn: 'ゴール', label: 'ゴール', pts: 1, kind: 'made', col: C.goal, shot: true },
      { id: 'shot', btn: 'シュート', btnShort: '×', label: 'シュート（外れ・止められた）', short: 'シュート', kind: 'miss', col: C.goal, shot: true, of: 'goal' },
      { id: 'foul', btn: 'ファウル', btnShort: 'F', label: 'ファウル', kind: 'foul', col: C.foul },
      { id: 'ast', btn: 'アシスト', btnShort: 'A', label: 'アシスト', kind: 'good', col: C.ast },
      { id: 'yc', btn: '警告', label: '警告（イエロー）', kind: 'card', col: C.yc, yellow: true },
      { id: 'rc', btn: '退場', label: '退場（レッド。チームは2分間 1人少ない）', short: '退場', kind: 'card', col: C.rc, out: true },
      { id: 'to', btn: 'タイムアウト', btnShort: 'TO', label: 'タイムアウト', kind: 'set', col: C.set },
      { id: 'ck', btn: 'CK', label: 'コーナーキック', kind: 'set', col: C.set }
    ],
    base: ['goal', 'shot', 'foul'],
    rowOrder: ['goal', 'shot', 'ast', 'foul', 'yc', 'rc'],
    teamTypes: ['ck', 'to'],
    toggles: [
      { key: 'ast', label: 'アシスト', types: ['ast'] },
      { key: 'card', label: '警告・退場（退場はチームが2分間 1人少ない時間を表示）', types: ['yc', 'rc'] },
      { key: 'team', label: 'チームの行（CK・タイムアウト）', types: ['ck', 'to'], row: 'team', def: true }
    ],
    cols: [
      { key: 'pts', label: '得点', pts: true }, { key: 'shot', label: 'シュート', n: ['goal', 'shot'] }, { key: 'ast', label: 'アシスト', n: ['ast'] },
      { key: 'foul', label: 'ファウル', n: ['foul'] }, { key: 'yc', label: '警告', n: ['yc'] }, { key: 'rc', label: '退場', n: ['rc'] },
      { key: 'ck', label: 'CK', n: ['ck'] }, { key: 'to', label: 'タイムアウト', n: ['to'] }
    ],
    moreHelp: [['フットサルのしくみ', [
      '累積ファウル：チームの帯に「累積3」のように出ます。5つで黄、6つ目から赤（次のファウルから第2PK）。後半の数は延長にも続きます（前半の数は後半に持ち越しません）',
      '退場：その選手の行に「退場」。チームの帯に、1人少ない残りの時間（2分）を出します（相手が得点したら、そこで戻れます。記録の時計は止まらないので目安です）'
    ]]]
  });

  /* ========== ハンドボール ========== */
  teamSport({
    id: 'handball', name: 'ハンドボール', icon: '🤾', desc: 'ゴール・シュートの成功率・7mスロー・セーブ・2分間退場（残り時間を表示）',
    lenChoices: [30, 25, 20, 15, 10], lenDefault: 30, lenNote: '一般・高校 30 分・中学 25 分・小学生 15〜20 分',
    elenChoices: [5, 3], elenDefault: 5,
    shootout: '7mTC', shootoutShort: '7mTC', suspOut: 3,
    presets: [['1〜14', '1-14'], ['1〜16', '1-16'], ['1〜20', '1-20']],
    start: 'スローオフ',
    TYPES: [
      { id: 'goal', btn: 'ゴール', label: 'ゴール', pts: 1, kind: 'made', col: C.goal, shot: true },
      { id: 'shotx', btn: '×', label: 'シュート失敗', kind: 'miss', col: C.goal, shot: true, of: 'goal' },
      { id: 'g7', btn: '7m', label: '7mスロー成功', short: '7m成功', pts: 1, kind: 'made', col: C.con, shot: true },
      { id: 'x7', btn: '×', label: '7mスロー失敗', short: '7m失敗', kind: 'miss', col: C.con, shot: true, of: 'g7' },
      { id: 'save', btn: 'セーブ', label: 'セーブ（GK）', kind: 'good', col: C.save },
      { id: 'tf', btn: 'TF', label: 'テクニカルフォールト', short: 'TF', kind: 'bad', col: C.tf },
      { id: 'yc', btn: '警告', label: '警告', kind: 'card', col: C.yc, yellow: true },
      { id: 's2', btn: '2分', label: '2分間退場', kind: 'card', col: C.foul, susp: 120 },
      { id: 'dq', btn: '失格', label: '失格（チームは2分間 1人少ない）', short: '失格', kind: 'card', col: C.rc, out: true, teamSusp: 120 },
      { id: 'to', btn: 'タイムアウト', btnShort: 'TO', label: 'チームタイムアウト', kind: 'set', col: C.set }
    ],
    base: ['goal', 'shotx'],
    rowOrder: ['goal', 'shotx', 'g7', 'x7', 'save', 'tf', 'yc', 's2', 'dq'],
    teamTypes: ['to'],
    toggles: [
      { key: 'g7', label: '7mスロー（成功・失敗）', types: ['g7', 'x7'] },
      { key: 'save', label: 'セーブ（GK）', types: ['save'] },
      { key: 'tf', label: 'テクニカルフォールト（TF）', types: ['tf'] },
      { key: 'pen', label: '警告・2分間退場・失格（2分間退場は残り時間を表示。3回目で失格の印）', types: ['yc', 's2', 'dq'], def: true },
      { key: 'team', label: 'チームの行（タイムアウト）', types: ['to'], row: 'team', def: true }
    ],
    cols: [
      { key: 'pts', label: '得点', pts: true }, { key: 'shot', label: 'シュート', n: ['goal', 'g7'], a: ['goal', 'shotx', 'g7', 'x7'] }, { key: 'g7', label: '7m', n: ['g7'], a: ['g7', 'x7'] },
      { key: 'save', label: 'セーブ', n: ['save'] }, { key: 'tf', label: 'TF', n: ['tf'] }, { key: 'yc', label: '警告', n: ['yc'] }, { key: 's2', label: '2分', n: ['s2'] }, { key: 'dq', label: '失格', n: ['dq'] },
      { key: 'to', label: 'タイムアウト', n: ['to'] }
    ],
    moreHelp: [['ハンドボールのしくみ', [
      'シュートの成功率：「ゴール」と「×」（シュート失敗）で、集計に「成功/打った数」と決定率が出ます。7mスローは設定で別のボタンにできます',
      '2分間退場：その選手の行に残りの時間（2:00 から減る）、チームの帯に「−1 1:34」のように1人少ない時間を出します。3回目で失格の印。失格は、チームが2分間 1人少ない時間を出します',
      '記録の時計は止まりません（タイムアウトの間も進みます）。2分の残りは目安です'
    ]]]
  });

  /* ========== ラグビー ========== */
  teamSport({
    id: 'rugby', name: 'ラグビー', icon: '🏉', desc: 'トライ 5・ゴール 2・PG 3・DG 3。キックの成功率・タックル・反則・シンビン（残り時間を表示）',
    lenChoices: [40, 35, 30, 25, 20, 15, 10, 7], lenDefault: 30, lenNote: '一般 40 分・高校 30 分・中学 20〜25 分・7人制 7 分',
    elenChoices: [10, 5], elenDefault: 10,
    shootout: null, redShort: true,
    presets: [['1〜15', '1-15'], ['1〜23', '1-23'], ['1〜12', '1-12'], ['1〜7', '1-7']],
    start: 'キックオフ',
    moreOpts: () => ({ sin: 10 }),
    moreFields: [{ key: 'sin', label: 'シンビン（一時退出）の長さ', choices: [[10, '10分'], [5, '5分'], [2, '2分（7人制）']] }],
    TYPES: [
      { id: 'try', btn: 'トライ', label: 'トライ', pts: 5, kind: 'made', col: C.try },
      { id: 'con', btn: 'ゴール', label: 'ゴール（コンバージョン）', short: 'ゴール', pts: 2, kind: 'made', col: C.con, kick: true },
      { id: 'conx', btn: '×', label: 'ゴール失敗', kind: 'miss', col: C.con, kick: true, of: 'con' },
      { id: 'pg', btn: 'PG', label: 'ペナルティゴール', short: 'PG', pts: 3, kind: 'made', col: C.pg, kick: true },
      { id: 'pgx', btn: '×', label: 'PG失敗', kind: 'miss', col: C.pg, kick: true, of: 'pg' },
      { id: 'dg', btn: 'DG', label: 'ドロップゴール', short: 'DG', pts: 3, kind: 'made', col: C.dg, kick: true },
      { id: 'dgx', btn: '×', label: 'DG失敗', kind: 'miss', col: C.dg, kick: true, of: 'dg' },
      { id: 'tk', btn: 'タックル', btnShort: 'TK', label: 'タックル', kind: 'good', col: C.tackle },
      { id: 'tkx', btn: '×', label: 'タックルミス', kind: 'miss', col: C.tackle, of: 'tk' },
      { id: 'pen', btn: '反則', label: '反則（ペナルティ）', short: '反則', kind: 'foul', col: C.pen },
      { id: 'yc', btn: 'シンビン', btnShort: 'SB', label: 'シンビン（イエロー）', short: 'シンビン', kind: 'card', col: C.yc, suspOpt: 'sin' },
      { id: 'rc', btn: '退場', label: '退場（レッド）', kind: 'card', col: C.rc, out: true },
      { id: 'ptry', btn: '認定トライ', btnShort: '認定T', label: '認定トライ', pts: 7, kind: 'made', col: C.try },
      { id: 'scrum', btn: 'スクラム', btnShort: 'SC', label: 'スクラム', kind: 'set', col: C.set },
      { id: 'lo', btn: 'ラインアウト', btnShort: 'LO', label: 'ラインアウト', kind: 'set', col: C.set }
    ],
    base: ['try', 'con', 'pg', 'dg'],
    rowOrder: ['try', 'con', 'conx', 'pg', 'pgx', 'dg', 'dgx', 'tk', 'tkx', 'pen', 'yc', 'rc'],
    teamTypes: ['scrum', 'lo', 'ptry'],
    toggles: [
      { key: 'kickx', label: 'キックの失敗（ゴール・PG・DG の「×」）→ キックの成功率', types: ['conx', 'pgx', 'dgx'] },
      { key: 'tk', label: 'タックル（成功・ミス）', types: ['tk', 'tkx'] },
      { key: 'pen', label: '反則', types: ['pen'] },
      { key: 'card', label: 'シンビン・退場（シンビンは残り時間を表示）', types: ['yc', 'rc'] },
      { key: 'team', label: 'チームの行（スクラム・ラインアウト・認定トライ）', types: ['scrum', 'lo', 'ptry'], row: 'team', def: true }
    ],
    cols: [
      { key: 'pts', label: '得点', pts: true }, { key: 'try', label: 'トライ', n: ['try', 'ptry'] },
      { key: 'con', label: 'ゴール', n: ['con'], a: ['con', 'conx'] }, { key: 'pg', label: 'PG', n: ['pg'], a: ['pg', 'pgx'] }, { key: 'dg', label: 'DG', n: ['dg'], a: ['dg', 'dgx'] },
      { key: 'tk', label: 'タックル', n: ['tk'], a: ['tk', 'tkx'] }, { key: 'pen', label: '反則', n: ['pen'] }, { key: 'yc', label: 'シンビン', n: ['yc'] }, { key: 'rc', label: '退場', n: ['rc'] },
      { key: 'scrum', label: 'スクラム', n: ['scrum'] }, { key: 'lo', label: 'ラインアウト', n: ['lo'] }
    ],
    moreHelp: [['ラグビーのしくみ', [
      '得点：トライ 5・ゴール（コンバージョン）2・PG 3・DG 3・認定トライ 7（チームの行）。得点は自動で足し算します',
      'キックの成功率：設定で「キックの失敗」を出すと、ゴール・PG・DG のとなりに「×」。集計に「成功/蹴った数」とキックの成功率が出ます',
      'シンビン：その選手の行に残りの時間（試合の形式で 10分・5分・2分）、チームの帯に「−1 8:12」のように出します。ハーフタイムの間は減りません'
    ]]]
  });
})(typeof window !== 'undefined' ? window : globalThis);
