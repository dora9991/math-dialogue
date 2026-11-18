/* スポーツ タップ記録 — バレーボール。画面を持たない部分
   ラリーポイント制：記録1つ＝ラリー1つの結果。どちらのチームの点かは、記録の種類で決まる
     「アタック」「ブロック」「サーブ」（サービスエース）・チームの行の「得点」 → その選手（チーム）の点（pt: 'own'）
     「ミス」（サーブミス・アタックミス・その他のミス） → 相手の点（pt: 'opp'）
     「レシーブ」「タイムアウト」「★ あとで見る」 → 点は動かない
   セット・セットの点・サーブ権は、どれも記録から計算する（replay）。取り消し・一覧で直すと、自動で正しくなる。

   ■ この種目の記録（core.js の形に足すもの）
     type 'srv'：サーブ権を入れかえた（team：そこからサーブするチーム）。ふだんは要らない（ラリーを取ったチームが次にサーブ）。
       最終セットの最初のサーブ（トスで決まる）や、まちがいを直すときに、チームの帯の「🏐」を押して残す
   ■ 試合の形式（opts）
     fmt：'6' 6人制（25点・最終セット15点）／'9' 9人制（21点）／'j' 小学生（21点・最終セット15点）
     sets：3（2セット先取）・5（3セット先取）・1（1セットだけ）
     deuce：1 ＝ 2点差がつくまで（デュース）・0 ＝ 先に取ったほう
     first：最初のセットで最初にサーブするチーム（0 自分・1 相手）。2セット目からは交互 */
(function (root) {
  'use strict';
  const ST = root.ST;

  const C = { atk: '#15803d', blk: '#7c3aed', ace: '#0e7490', rec: '#1d4ed8', err: '#dc2626', pt: '#166534', to: '#475569' };
  const TYPES = [
    { id: 'atk', btn: 'アタック', btnShort: 'アタ', label: 'アタック決定', short: 'アタック', pt: 'own', kind: 'made', col: C.atk },
    { id: 'blk', btn: 'ブロック', btnShort: 'ブロ', label: 'ブロック決定', short: 'ブロック', pt: 'own', kind: 'made', col: C.blk },
    { id: 'ace', btn: 'サーブ', btnShort: 'サー', label: 'サービスエース', short: 'サーブ', pt: 'own', kind: 'made', col: C.ace },
    { id: 'rec', btn: 'レシーブ', btnShort: 'レシ', label: 'よいレシーブ', short: 'レシーブ', kind: 'good', col: C.rec },
    { id: 'err', btn: 'ミス', label: 'ミス（相手の点）', short: 'ミス', pt: 'opp', kind: 'miss', col: C.err, err: true },
    { id: 'serr', btn: 'サーブミス', btnShort: 'Sミス', label: 'サーブミス（相手の点）', short: 'サーブミス', pt: 'opp', kind: 'miss', col: C.err, err: true },
    { id: 'aerr', btn: 'アタックミス', btnShort: 'Aミス', label: 'アタックミス（相手の点）', short: 'アタックミス', pt: 'opp', kind: 'miss', col: C.err, err: true },
    { id: 'oerr', btn: 'その他ミス', btnShort: '他ミス', label: 'その他のミス（ネット・タッチなど。相手の点）', short: 'その他のミス', pt: 'opp', kind: 'miss', col: C.err, err: true },
    { id: 'pt', btn: '得点', label: '得点（理由なし）', short: '得点', pt: 'own', kind: 'made', col: C.pt },
    { id: 'to', btn: 'タイムアウト', btnShort: 'TO', label: 'タイムアウト', kind: 'set', col: C.to },
    { id: 'mark', btn: '★ あとで見る', label: '★ あとで見る', kind: 'mark', global: true },
    { id: 'srv', label: 'サーブ権', meta: true, noTeam: true, kind: 'meta' }
  ];
  const FMT = {
    '6': { name: '6人制', pts: 25, last: 15 },
    '9': { name: '9人制', pts: 21, last: 21 },
    'j': { name: '小学生', pts: 21, last: 15 }
  };
  const need = (o) => Math.floor((o.sets || 3) / 2) + 1;        // 何セット取れば勝ちか
  /* そのセットの目標の点（最終セットだけ短い形式がある） */
  function target(o, set) {
    const f = FMT[o.fmt] || FMT['6'];
    return set >= (o.sets || 3) && (o.sets || 3) > 1 ? f.last : f.pts;
  }
  function setWon(o, set, p) {
    const T = target(o, set);
    const hi = Math.max(p[0], p[1]), lo = Math.min(p[0], p[1]);
    if (hi < T) return false;
    return o.deuce === 0 ? true : hi - lo >= 2;
  }
  /* そのセットの、最初にサーブするチーム（1セット目は opts.first。あとは交互） */
  const firstServer = (o, set) => ((o.first || 0) + (set - 1)) % 2;

  /* ---------- 記録から、セット・点・サーブを計算する ----------
     戻り値：{ set（いまのセット）, pts（いまのセットの点）, sets（取ったセット数）, server（いまサーブするチーム）,
              log（終わったセット [{ set, pts, winner, t }]）, done（試合が決まった）, winner,
              info（記録の id → { set, pts（そのラリーのあとの点）, server（そのラリーでサーブしたチーム）, winner（点を取ったチーム）, ended（そのラリーでセットが決まった）}）,
              rallies（ラリーごと [{ server, winner, set }]） } */
  function replay(game, until) {
    const o = game.opts || {};
    const st = { set: 1, pts: [0, 0], sets: [0, 0], server: firstServer(o, 1), log: [], done: false, winner: null, info: {}, rallies: [] };
    ST.sorted(game).forEach((e) => {
      if (until != null && e.t > until + 1e-9) return;
      if (e.type === 'srv') { if (e.team === 0 || e.team === 1) st.server = e.team; return; }
      const d = TYPES_BY[e.type];
      if (!d || !d.pt || (e.team !== 0 && e.team !== 1) || st.done) { st.info[e.id] = { set: st.set, pts: st.pts.slice(), server: st.server, winner: null, after: st.done }; return; }
      const winner = d.pt === 'own' ? e.team : 1 - e.team;
      const server = st.server;
      st.pts[winner]++;
      st.rallies.push({ server, winner, set: st.set, id: e.id });
      const inf = { set: st.set, pts: st.pts.slice(), server, winner, ended: false };
      st.server = winner;
      if (setWon(o, st.set, st.pts)) {
        inf.ended = true;
        st.log.push({ set: st.set, pts: st.pts.slice(), winner, t: e.t });
        st.sets[winner]++;
        inf.sets = st.sets.slice();
        if (st.sets[winner] >= need(o)) { st.done = true; st.winner = winner; inf.match = true; }
        else { st.set++; st.pts = [0, 0]; st.server = firstServer(o, st.set); }
      }
      st.info[e.id] = inf;
    });
    return st;
  }
  const TYPES_BY = {};
  TYPES.forEach((d) => { TYPES_BY[d.id] = d; });

  /* ---------- 行のボタン ---------- */
  const isOn = (sprefs, key, def) => { const r = (sprefs && sprefs.rows) || {}; return r[key] != null ? !!r[key] : !!def; };
  function rowTypes(sprefs) {
    const out = ['atk', 'blk', 'ace'];
    if (isOn(sprefs, 'rec')) out.push('rec');
    if (isOn(sprefs, 'errs')) out.push('serr', 'aerr', 'oerr'); else out.push('err');
    return out;
  }
  const teamTypes = (sprefs) => (isOn(sprefs, 'team', true) ? ['pt', 'to'] : []);

  /* ---------- 集計 ---------- */
  function stats(game) {
    const sp = ST.SPORTS.volley;
    const rp = replay(game);
    const teams = [0, 1].map((tm) => {
      const team = game.teams[tm] || ST.blankTeam(tm);
      const byNo = new Map();
      const blank = () => ({ c: {}, pts: 0, errs: 0 });
      team.players.forEach((p) => byNo.set(p.no, Object.assign({ no: p.no, name: p.name }, blank())));
      const unknown = blank(), teamRow = blank(), total = blank();
      (game.events || []).forEach((e) => {
        const d = sp.TYPE[e.type];
        if (!d || d.meta || e.team !== tm) return;
        let s;
        if (e.no != null) {
          if (!byNo.has(e.no)) byNo.set(e.no, Object.assign({ no: e.no, name: '', extra: true }, blank()));
          s = byNo.get(e.no);
        } else s = sp.teamTypesAll.includes(e.type) ? teamRow : unknown;
        const inf = rp.info[e.id] || {};
        [s, total].forEach((x) => {
          x.c[e.type] = (x.c[e.type] || 0) + 1;
          if (d.pt === 'own' && inf.winner != null) x.pts++;
          if (d.err) x.errs++;
        });
      });
      const rows = Array.from(byNo.values()).sort((a, b) => ST.cmpNo(a.no, b.no));
      // ラリー：サーブのとき（ブレイク）・相手のサーブのとき（サイドアウト）
      const srv = rp.rallies.filter((r) => r.server === tm), rcv = rp.rallies.filter((r) => r.server !== tm);
      const brk = srv.filter((r) => r.winner === tm).length, so = rcv.filter((r) => r.winner === tm).length;
      const won = rp.rallies.filter((r) => r.winner === tm).length;
      // 相手のミスでの得点
      const oppErr = (game.events || []).filter((e) => e.team === 1 - tm && (sp.TYPE[e.type] || {}).err && (rp.info[e.id] || {}).winner === tm).length;
      const tos = {};
      (game.events || []).forEach((e) => { if (e.type === 'to' && e.team === tm) { const s = (rp.info[e.id] || {}).set || 1; tos[s] = (tos[s] || 0) + 1; } });
      return { team: tm, rows, unknown, teamRow, total, won, serve: { n: srv.length, won: brk }, recv: { n: rcv.length, won: so }, oppErr, tos };
    });
    return { rp, teams };
  }
  /* 集計の表の列 */
  const COLS = [
    { key: 'pts', label: '得点', f: (s) => s.pts },
    { key: 'atk', label: 'アタック', f: (s) => s.c.atk || 0 },
    { key: 'blk', label: 'ブロック', f: (s) => s.c.blk || 0 },
    { key: 'ace', label: 'サーブエース', f: (s) => s.c.ace || 0 },
    { key: 'rec', label: 'レシーブ', f: (s) => s.c.rec || 0 },
    { key: 'errs', label: 'ミス', f: (s) => s.errs },
    { key: 'serr', label: 'サーブミス', f: (s) => s.c.serr || 0 },
    { key: 'aerr', label: 'アタックミス', f: (s) => s.c.aerr || 0 },
    { key: 'oerr', label: 'その他ミス', f: (s) => s.c.oerr || 0 }
  ];
  const isEmpty = (s) => !Object.keys(s.c).length;

  /* ---------- 名前・CSV ---------- */
  const setScoresText = (rp) => rp.log.map((x) => `${x.pts[0]}−${x.pts[1]}`).join('・');
  function score(game) { return replay(game).sets.slice(); }
  function scoreText(game) {
    const rp = replay(game);
    if (!rp.log.length) return `${rp.pts[0]} − ${rp.pts[1]}（第${rp.set}セット）`;
    const cur = !rp.done && (rp.pts[0] || rp.pts[1]) ? `・第${rp.set}セット ${rp.pts[0]}−${rp.pts[1]}` : '';
    return `${rp.sets[0]} − ${rp.sets[1]}（${setScoresText(rp)}${cur}）`;
  }
  function eventText(game, e) {
    if (e.type === 'srv') return `サーブ権：${ST.teamName(game, e.team)}`;
    return null;
  }
  /* 記録の一覧・下の帯：「アタック決定（第1セット 12−10）」 */
  function logText(game, e) {
    const d = TYPES_BY[e.type];
    if (!d) return e.type;
    const inf = replay(game).info[e.id];
    if (!d.pt || !inf || inf.winner == null) return d.label;
    return `${d.short || d.label}（第${inf.set}セット ${inf.pts[0]}−${inf.pts[1]}）`;
  }
  function lastText(game, e) {
    const d = TYPES_BY[e.type];
    if (!d) return e.type;
    if (d.meta) return eventText(game, e);
    const inf = replay(game).info[e.id];
    if (!d.pt || !inf || inf.winner == null) return d.short || d.label;
    return `${d.short || d.label} → ${inf.pts[0]}−${inf.pts[1]}`;
  }
  function csvEvents(game) {
    const rp = replay(game);
    const n0 = ST.teamName(game, 0), n1 = ST.teamName(game, 1);
    const rows = [['No', '時刻', 'スタートからの秒', 'セット', 'チーム', '背番号', '名前', '記録', '点を取ったチーム', 'サーブしたチーム', `${n0}の点`, `${n1}の点`, 'セットが決まった']];
    let n = 0;
    ST.sorted(game).forEach((e) => {
      const d = TYPES_BY[e.type] || { label: e.type };
      const inf = rp.info[e.id] || {};
      if (d.meta) { rows.push(['', ST.fmtTime(e.t), e.t, '', ST.teamName(game, e.team), '', '', eventText(game, e), '', '', '', '', '']); return; }
      rows.push([++n, ST.fmtTime(e.t), e.t, inf.set || '', ST.teamName(game, e.team), e.no != null ? e.no : '', e.no != null ? ST.playerName(game, e.team, e.no) : '', d.label,
        inf.winner != null ? ST.teamName(game, inf.winner) : '', inf.winner != null ? ST.teamName(game, inf.server) : '',
        inf.pts ? inf.pts[0] : '', inf.pts ? inf.pts[1] : '', inf.ended ? `第${inf.set}セット終了（セット ${inf.sets[0]}−${inf.sets[1]}）` : '']);
    });
    return rows;
  }
  function csvBox(game) {
    const st = stats(game);
    const rows = [['チーム', '背番号', '名前'].concat(COLS.map((c) => c.label))];
    st.teams.forEach((x) => {
      const name = ST.teamName(game, x.team);
      x.rows.forEach((r) => rows.push([name, r.no, r.name].concat(COLS.map((c) => c.f(r)))));
      if (!isEmpty(x.unknown)) rows.push([name, '番号なし', ''].concat(COLS.map((c) => c.f(x.unknown))));
      if (!isEmpty(x.teamRow)) rows.push([name, 'チーム（得点・タイムアウト）', ''].concat(COLS.map((c) => c.f(x.teamRow))));
      rows.push([name, '合計', ''].concat(COLS.map((c) => c.f(x.total))));
    });
    rows.push([]);
    rows.push(['チーム', '取ったラリー', 'サーブのラリー', 'うち取った（ブレイク）', 'ブレイク率', '相手のサーブのラリー', 'うち取った（サイドアウト）', 'サイドアウト率', '相手のミスでの得点', 'タイムアウト']);
    st.teams.forEach((x) => rows.push([ST.teamName(game, x.team), x.won, x.serve.n, x.serve.won, ST.pct(x.serve.won, x.serve.n), x.recv.n, x.recv.won, ST.pct(x.recv.won, x.recv.n), x.oppErr, Object.values(x.tos).reduce((a, b) => a + b, 0)]));
    return rows;
  }

  ST.addSport({
    id: 'volley', name: 'バレーボール', icon: '🏐', family: 'volley', prec: 10, hasTeams: true, rowNames: true,
    desc: 'ラリーポイント。アタック・ブロック・サーブ・ミスで点とセットが自動で進む。サーブ権・サイドアウト率',
    TYPES,
    unit: '試合',
    startHint: '最初のサーブ（試合開始の笛）の瞬間',
    presets: [['1〜12', '1-12'], ['1〜14', '1-14'], ['1〜18', '1-18']],
    rosterLabel: '背番号',
    statsSub: 'セットごとの点・選手ごとの得点とミス・サイドアウト率',
    defaultOpts: () => ({ fmt: '6', sets: 3, deuce: 1, first: 0 }),
    optFields: [
      { key: 'fmt', label: '形式', choices: [['6', '6人制（25点・最終セット15点）'], ['9', '9人制（21点）'], ['j', '小学生（21点・最終セット15点）']] },
      { key: 'sets', label: 'セット数', choices: [[3, '3セットマッチ（2セット先取）'], [5, '5セットマッチ（3セット先取）'], [1, '1セットだけ']] },
      { key: 'deuce', label: '同点で目標の点に近づいたとき', choices: [[1, '2点差がつくまで（デュース）'], [0, '先に目標の点を取ったほう']] },
      { key: 'first', label: '最初のサーブ（第1セット）', choices: [[0, '自分のチーム'], [1, '相手のチーム']], note: '2セット目からは、最初のサーブを交互にします。最終セット（トスで決める）などで違うときは、記録の画面のチームの帯の「🏐」を押して入れかえます' }
    ],
    optsEditNote: '試合の途中で形式を変えると、セットの区切りも記録から計算し直します。',
    toggles: [
      { key: 'errs', label: 'ミスの種類を分ける（サーブミス・アタックミス・その他のミス）' },
      { key: 'rec', label: 'レシーブ（よいレシーブ。点は動かない）' },
      { key: 'team', label: 'チームの行（得点（理由なし）・タイムアウト）', def: true }
    ],
    togglesNote: 'いつもある：アタック・ブロック・サーブ（どれも自分の点）・ミス（相手の点）。下を選ぶと、ボタンが増えます（1つずつは少し小さくなります）。',
    teamTypesAll: ['pt', 'to'],
    globalTypes: ['mark'],
    steps: [
      ['チームと背番号を選ぶ', '「1〜12」などのボタンでまとめて。自分のチームは次から自動で入ります。相手の背番号は入れなくても大丈夫です（チームの1行になります）'],
      ['最初のサーブのチームを選んで ▶ スタート', '最初のサーブ（試合開始の笛）の瞬間に。時計が動き出します'],
      ['ラリーが終わったら、決めた選手（ミスした選手）のボタンを1回', '「7」の行の「アタック」。ミスは「ミス」（相手の点）。点・セット・サーブ権は自動で進みます'],
      ['セットが決まると、次の点から次のセット', '試合が決まったら「≡ メニュー」→「試合を終える」で集計']
    ],
    help: [['記録の画面', [
      '選手の行：「アタック」「ブロック」「サーブ」（サービスエース）は、その選手のチームの点。「ミス」は、相手の点になります',
      '「？」の行：だれか分からないとき（設定で消せます）。「チーム」の行：「得点」（理由が分からない点）・「タイムアウト」',
      '上の帯：時計の右が、いまのセット。真ん中がいまのセットの点（大きく）と、取ったセット数（小さく）。🏐 がサーブのチーム',
      '画面の下の「★ あとで見る」：だれのかは決めずに、時刻だけを残します（動画で見返すときの目印）',
      'ボタンを足す：「≡ メニュー」→「設定」で、ミスの種類（サーブミス・アタックミス・その他のミス）・レシーブを出せます'
    ]], ['セットとサーブ権', [
      'セットは、記録から自動で決まります（6人制は25点・最終セット15点、9人制は21点。2点差がつくまで）。決まると画面の下に「第1セット 25−23 で〇〇」と出て、次の点から次のセットです',
      'サーブ権も自動：ラリーを取ったチームが、次にサーブします。セットの最初のサーブは交互です',
      '最終セット（トスで決める）などで違うときは、チームの帯の「🏐」を押すと、そのチームのサーブに入れかえます（記録に残り、一覧で直せます）',
      '取り消し・一覧で直すと、点・セット・サーブ権も自動で計算し直します'
    ]], ['集計', [
      'セットごとの点、選手ごとの得点（アタック・ブロック・サーブエース）とミス',
      'サイドアウト率：相手のサーブのラリーを取った割合。ブレイク率：自分のサーブのラリーを取った割合',
      '相手のミスでの得点・タイムアウトの数（セットごと）'
    ]]],
    replay, target, setWon, firstServer, need, FMT,
    rowTypes, teamTypesOf: teamTypes, weight: () => 1,
    score, scoreText, eventText, logText, lastText,
    typeLabel: (game, e) => (TYPES_BY[e.type] || { label: e.type }).label,
    whoText: (game, e) => {
      if (e.team == null) return 'チームなし';
      const nm = e.no != null ? ST.playerName(game, e.team, e.no) : '';
      return `${ST.teamName(game, e.team)} ${e.no != null ? '#' + e.no + (nm ? ' ' + nm : '') : ['pt', 'to'].includes(e.type) ? '（チーム）' : '番号なし'}`;
    },
    editTypes: (game, e) => {
      const d = TYPES_BY[e.type] || {};
      if (d.meta) return [];
      const ids = ['atk', 'blk', 'ace', 'rec', 'err', 'serr', 'aerr', 'oerr', 'pt', 'to', 'mark'];
      if (!ids.includes(e.type)) ids.push(e.type);
      return ids;
    },
    stats, COLS, isEmpty, csvEvents, csvBox,
    cleanEvent: (e) => (e.type === 'srv' ? ((e.team === 0 || e.team === 1) ? { team: e.team } : null) : {}),
    exportExtra: (game, g) => {
      const rp = replay(game);
      g.sets = rp.log.map((x) => ({ set: x.set, score: x.pts, winner: x.winner }));
      g.events.forEach((e) => { const inf = rp.info[e.id]; if (inf) { e.set = inf.set; if (inf.winner != null) { e.pointTo = inf.winner; e.server = inf.server; e.after = inf.pts; } } });
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
