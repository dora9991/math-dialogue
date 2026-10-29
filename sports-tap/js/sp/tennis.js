/* スポーツ タップ記録 — テニス（硬式・ソフトテニス）。画面を持たない部分
   記録1つ＝ポイント1つ。どちらの側がポイントを取ったか（とその理由：エース・ウィナー・相手のミス・ダブルフォルト）を時刻つきで残す。
   ゲーム・セット・試合・サーブ権は、すべて記録から計算する（取り消し・直しをすると、自動で正しくなる）。

   ■ この種目の記録（core.js の形に足すもの）
     team：側（0 = 自分の側・1 = 相手の側）。no：その側の何人目の選手か（'1'・'2'。シングルスは '1'）。「ポイント」（理由なし）は no なし
     type：'ace' エース・'win' ウィナー（→ その側のポイント）／'err' ミス・'df' ダブルフォルト（→ 相手の側のポイント）／
           'pt' ポイント（理由なし。その側のポイント）／'flt' フォルト（1stサーブ。ポイントは動かない）／'mark' ★ あとで見る
     game.serve：{ side: 最初のゲームでサーブする側（0・1）, p: [自分の側で最初にサーブする人, 相手の側で最初にサーブする人]（'1'・'2'） }
   ■ 試合の形式（opts）
     kind：'hard' 硬式 | 'soft' ソフトテニス / fmt：'single' | 'double'
     硬式：sets（1・3・5 セットマッチ）, games（6 ふつう・4 ショートセット・8 プロセット。同じ数でタイブレーク 7 ポイント）, adv（'ad' | 'noad'）, final（'set' | 'mtb' 最終セットを 10 ポイントのマッチタイブレークに）
     ソフトテニス：sgames（5・7・9 ゲームマッチ）。ゲームは 4 ポイント先取（3−3 からデュース）。ゲームが並んだら（7ゲームマッチなら 3−3）ファイナルゲーム（7 ポイント先取・2 ポイント差）
   ■ サーブ
     ゲームごとに交代（タイブレーク・ファイナルゲームも1つのゲームとして数える → 次のセットの最初のサーブも、この交代のまま決まる）。
     タイブレーク（硬式）：1 ポイント目のあと、2 ポイントずつ交代。ファイナルゲーム（ソフトテニス）：2 ポイントずつ交代。 */
(function (root) {
  'use strict';
  const ST = root.ST;

  const C = { ace: '#7c3aed', win: '#15803d', err: '#b91c1c', df: '#c2410c', pt: '#334155', flt: '#64748b' };
  const TYPES = [
    { id: 'ace', btn: 'エース', sub: 'サーブで', label: 'サービスエース', short: 'エース', kind: 'made', col: C.ace, to: 'self', serve: true },
    { id: 'win', btn: 'ウィナー', sub: '決めた', label: 'ウィナー', kind: 'made', col: C.win, to: 'self' },
    { id: 'err', btn: 'ミス', sub: '相手の点', label: 'ミス', kind: 'miss', col: C.err, to: 'opp' },
    { id: 'df', btn: 'ダブル', sub: 'フォルト', label: 'ダブルフォルト', kind: 'miss', col: C.df, to: 'opp', serve: true },
    { id: 'flt', btn: 'フォルト', sub: '1stサーブ', label: 'フォルト（1stサーブ）', short: 'フォルト', kind: 'miss', col: C.flt, serve: true },
    { id: 'pt', btn: 'ポイント', sub: '理由なし', label: 'ポイント', kind: 'made', col: C.pt, to: 'self', side: true },
    { id: 'mark', btn: '★ あとで見る', label: '★ あとで見る', kind: 'mark', global: true }
  ];
  const TYPE = {};
  TYPES.forEach((d) => { TYPE[d.id] = d; });

  /* ---------- 形式 ---------- */
  function rules(o) {
    o = o || {};
    if (o.kind === 'soft') {
      const n = Number(o.sgames) || 7;
      return { soft: true, matchGames: n, need: Math.ceil(n / 2), finalPts: 7 };
    }
    const sets = Number(o.sets) || 3, G = Number(o.games) || 6;
    return { soft: false, sets, need: Math.ceil(sets / 2), G, noAd: o.adv === 'noad', tbPts: 7, mtb: o.final === 'mtb' && sets > 1, mtbPts: 10 };
  }
  ST.tennisRules = rules;

  /* 側の名前（選手の名前・なければ学校名・なければ「自分」「相手」）と、選手の名前 */
  function sideName(game, s) {
    const t = game.teams[s] || {};
    const names = (t.players || []).map((p) => (p.name || '').trim()).filter(Boolean);
    if (names.length) return names.join('・');
    return (t.name || '').trim() || (s ? '相手' : '自分');
  }
  function pName(game, s, no) {
    const p = ((game.teams[s] || {}).players || []).find((x) => x.no === no);
    return (p && (p.name || '').trim()) || (isDouble(game) ? `${s ? '相手' : '自分'}の${no}人目` : sideName(game, s));
  }
  const isDouble = (game) => (game.opts || {}).fmt === 'double';

  /* ---------- 記録から、ゲーム・セット・サーブを計算する ----------
     戻り値：{ R, sets: [{ g: [a, b], tb: [a, b] | null, mtb }], g: [いまのセットのゲーム], p: [いまのゲームのポイント], tb: null | 'tb' | 'mtb' | 'final',
              k: 試合の何ゲーム目か（0〜）, sw: 取ったセット, over, winner, server（次のポイントでサーブする側）, serverNo（ダブルスの硬式：サーブする人の目安）,
              snap: { 記録の id → そのポイントのあとのようす }, stats } */
  const cache = { key: '', val: null };
  function replay(game) {
    const evs = ST.sorted(game);
    const key = JSON.stringify([game.opts, game.serve, evs.map((e) => [e.id, e.type, e.team, e.no, e.t])]);
    if (cache.key === key && cache.game === game.id) return cache.val;
    const R = rules(game.opts);
    const first = game.serve && (game.serve.side === 1) ? 1 : 0;
    const firstNo = (game.serve && Array.isArray(game.serve.p) ? game.serve.p : ['1', '1']).map((x) => (x === '2' ? '2' : '1'));
    const st = { R, sets: [], g: [0, 0], p: [0, 0], tb: null, k: 0, sw: [0, 0], over: false, winner: null, snap: {} };
    const stats = {
      won: [0, 0], servePts: [0, 0], serveWon: [0, 0], svcGames: [0, 0], held: [0, 0], breaks: [0, 0],
      firstSv: [0, 0], firstIn: [0, 0], anyFault: false, games: [0, 0]
    };
    const faulted = [false, false];       // いまのポイントで、1stサーブがフォルトだったか（側ごと）
    const gameServer = () => (st.k % 2 === 0 ? first : 1 - first);
    function serverNow() {
      const gs = gameServer();
      if (!st.tb) return gs;
      const i = st.p[0] + st.p[1];
      const block = R.soft ? Math.floor(i / 2) : Math.floor((i + 1) / 2);
      return block % 2 === 0 ? gs : 1 - gs;
    }
    /* ダブルスの硬式：サーブする人の目安（その側の何回目のサービスゲームか、で交代。タイブレークは 2 ポイントずつの順番） */
    function serverNoNow() {
      if (R.soft || game.opts.fmt !== 'double') return null;
      let turn = st.k;
      if (st.tb) { const i = st.p[0] + st.p[1]; turn = st.k + Math.floor((i + 1) / 2); }
      const side = turn % 2 === 0 ? first : 1 - first;
      const j = Math.floor(turn / 2);
      const a = firstNo[side], b = a === '1' ? '2' : '1';
      return j % 2 === 0 ? a : b;
    }
    function winGame(w) {
      const srv = gameServer();
      const wasTb = st.tb;
      if (!wasTb) { stats.svcGames[srv]++; if (w === srv) stats.held[srv]++; else stats.breaks[w]++; }
      stats.games[w]++;
      st.k++;
      const pts = st.p.slice();
      st.p = [0, 0];
      const res = { game: true, set: false, match: false, tb: wasTb };
      if (R.soft) {
        st.g[w]++;
        st.tb = null;
        if (wasTb === 'final' || st.g[w] >= R.need) { st.over = true; st.winner = w; res.match = true; res.set = true; }
        else if (st.g[0] === R.need - 1 && st.g[1] === R.need - 1) st.tb = 'final';
        return res;
      }
      if (wasTb === 'mtb') {
        st.sets.push({ g: w ? [0, 1] : [1, 0], tb: pts, mtb: true });
        st.sw[w]++; st.tb = null; st.g = [0, 0]; res.set = true;
      } else if (wasTb === 'tb') {
        st.g[w]++;
        st.sets.push({ g: st.g.slice(), tb: pts });
        st.sw[w]++; st.g = [0, 0]; st.tb = null; res.set = true;
      } else {
        st.g[w]++;
        const o = 1 - w;
        if (st.g[w] >= R.G && st.g[w] - st.g[o] >= 2) { st.sets.push({ g: st.g.slice(), tb: null }); st.sw[w]++; st.g = [0, 0]; res.set = true; }
        else if (st.g[0] === R.G && st.g[1] === R.G) st.tb = 'tb';
      }
      if (st.sw[w] >= R.need) { st.over = true; st.winner = w; res.match = true; }
      else if (res.set && R.mtb && st.sw[0] === R.need - 1 && st.sw[1] === R.need - 1) st.tb = 'mtb';
      return res;
    }
    evs.forEach((e) => {
      const d = TYPE[e.type];
      if (!d) return;
      if (e.type === 'flt') {
        stats.anyFault = true;
        if (!st.over && (e.team === 0 || e.team === 1)) faulted[e.team] = true;
        st.snap[e.id] = { fault: true, server: serverNow() };
        return;
      }
      if (!d.to || (e.team !== 0 && e.team !== 1)) return;
      if (st.over) { st.snap[e.id] = { after: true }; return; }
      const srv = serverNow(), srvNo = serverNoNow();
      const before = { g: st.g.slice(), p: st.p.slice(), tb: st.tb, setNo: st.sets.length + 1, k: st.k };
      const w = d.to === 'self' ? e.team : 1 - e.team;
      stats.won[w]++;
      stats.servePts[srv]++;
      if (w === srv) stats.serveWon[srv]++;
      stats.firstSv[srv]++;
      if (!(faulted[srv] || e.type === 'df')) stats.firstIn[srv]++;
      faulted[0] = faulted[1] = false;
      st.p[w]++;
      let done = false;
      if (st.tb) {
        const target = st.tb === 'mtb' ? R.mtbPts : st.tb === 'final' ? R.finalPts : R.tbPts;
        if (st.p[w] >= target && st.p[w] - st.p[1 - w] >= 2) done = true;
      } else if (!R.soft && R.noAd) done = st.p[w] >= 4;
      else done = st.p[w] >= 4 && st.p[w] - st.p[1 - w] >= 2;
      const res = done ? winGame(w) : { game: false };
      st.snap[e.id] = { winner: w, server: srv, serverNo: srvNo, before, res, after: false, g: st.g.slice(), p: st.p.slice(), sets: st.sets.map((x) => ({ g: x.g.slice(), tb: x.tb, mtb: x.mtb })), tb: st.tb, over: st.over, setNo: st.sets.length + (st.over ? 0 : 1) };
    });
    st.server = serverNow();
    st.serverNo = serverNoNow();
    st.stats = stats;
    cache.key = key; cache.game = game.id; cache.val = st;
    return st;
  }

  /* ---------- 呼び方 ---------- */
  const HARD = ['0', '15', '30', '40'];
  /* いまのゲームのポイントの表示：[自分の側, 相手の側]（「40」「AD」・タイブレークは数） */
  function pointCells(R, p, tb) {
    if (tb) return [String(p[0]), String(p[1])];
    const [a, b] = p;
    if (a >= 3 && b >= 3 && !(!R.soft && R.noAd)) {
      const base = R.soft ? '3' : '40';
      if (a === b) return [base, base];
      return a > b ? ['AD', base] : [base, 'AD'];
    }
    if (R.soft) return [String(Math.min(a, 3)), String(Math.min(b, 3))];
    return [HARD[Math.min(a, 3)], HARD[Math.min(b, 3)]];
  }
  /* 呼び名（デュース・アドバンテージ ○○・タイブレーク …）。names：側の名前 */
  function callText(R, p, tb, names) {
    if (tb === 'tb') return 'タイブレーク';
    if (tb === 'mtb') return 'マッチタイブレーク';
    if (tb === 'final') return 'ファイナルゲーム';
    const [a, b] = p;
    if (!R.soft && R.noAd && a === 3 && b === 3) return 'デサイディングポイント';
    if (a >= 3 && b >= 3) return a === b ? 'デュース' : `アドバンテージ ${names[a > b ? 0 : 1]}`;
    return '';
  }
  /* 「40−15」のような、いまのゲームのポイント（側の順） */
  function pointText(R, p, tb) { const c = pointCells(R, p, tb); return `${c[0]}−${c[1]}`; }
  function setText(x) {
    if (x.mtb) return `[${x.tb[0]}−${x.tb[1]}]`;
    let s = `${x.g[0]}−${x.g[1]}`;
    if (x.tb) s += `(${Math.min(x.tb[0], x.tb[1])})`;
    return s;
  }
  function setsText(st) { return st.sets.map(setText).join(' '); }

  /* ---------- 得点（core の score・scoreText） ---------- */
  function score(game) { const st = replay(game); return st.R.soft ? st.g.slice() : st.sw.slice(); }
  function scoreText(game) {
    const st = replay(game);
    if (st.R.soft) return `${st.g[0]}−${st.g[1]}`;
    const cur = !st.over && (st.g[0] + st.g[1] > 0 || st.p[0] + st.p[1] > 0) ? `${st.g[0]}−${st.g[1]}` : '';
    return [setsText(st), cur].filter(Boolean).join(' ') || '0−0';
  }

  /* ---------- 集計 ---------- */
  /* 選手ごと：[{ side, rows: [{ no, name, c }], total: { c }, side: {…} }] */
  function stats(game) {
    const st = replay(game);
    return [0, 1].map((s) => {
      const players = (game.teams[s].players || []).map((p) => ({ no: p.no, name: pName(game, s, p.no), c: {} }));
      const total = { c: {} }, sideOnly = { c: {} };
      (game.events || []).forEach((e) => {
        const d = TYPE[e.type];
        if (!d || d.global || e.team !== s) return;
        const r = e.no != null ? players.find((x) => x.no === e.no) : null;
        [r ? r.c : sideOnly.c, total.c].forEach((c) => { c[e.type] = (c[e.type] || 0) + 1; });
      });
      const S = st.stats;
      return { side: s, name: sideName(game, s), rows: players, sideOnly, total, won: S.won[s], servePts: S.servePts[s], serveWon: S.serveWon[s], svcGames: S.svcGames[s], held: S.held[s], breaks: S.breaks[s], firstSv: S.firstSv[s], firstIn: S.firstIn[s], games: S.games[s] };
    });
  }

  /* ---------- 名前・CSV ---------- */
  function snapText(game, e) {
    const st = replay(game);
    const sn = st.snap[e.id];
    if (!sn) return '';
    if (sn.fault) return '';
    if (sn.after) return '（試合のあと）';
    const names = [sideName(game, 0), sideName(game, 1)];
    if (sn.res.match) return `試合終了 ${names[sn.winner]}の勝ち`;
    if (sn.res.set && !st.R.soft) { const last = sn.sets[sn.sets.length - 1]; return `セット ${names[sn.winner]} ${setText(last)}`; }
    if (sn.res.game) return `ゲーム ${names[sn.winner]}（${sn.g[0]}−${sn.g[1]}）`;
    const call = callText(st.R, sn.p, sn.tb, names);
    return call && !sn.tb ? call : pointText(st.R, sn.p, sn.tb);
  }
  function csvEvents(game) {
    const st = replay(game);
    const names = [sideName(game, 0), sideName(game, 1)];
    const rows = [['No', '時刻', 'スタートからの秒', 'セット', 'ゲーム（そのセットの何ゲーム目）', 'サーブ', '側', '選手', '記録', 'ポイントを取った側', 'ポイント（あと）', 'ゲーム数（あと）', 'セット（あと）', 'できごと']];
    let n = 0;
    ST.sorted(game).forEach((e) => {
      const d = TYPE[e.type] || { label: e.type };
      const sn = st.snap[e.id] || {};
      const who = e.team != null && e.no != null ? pName(game, e.team, e.no) : '';
      if (!sn.before) {
        rows.push([++n, ST.fmtTime(e.t), e.t, '', '', sn.server != null ? names[sn.server] : '', e.team != null ? names[e.team] : '', who, d.label, '', '', '', '', sn.after ? '試合のあと' : '']);
        return;
      }
      const b = sn.before;
      const ev = sn.res.match ? '試合終了' : sn.res.set ? 'セット' : sn.res.game ? 'ゲーム' : '';
      rows.push([++n, ST.fmtTime(e.t), e.t, st.R.soft ? '' : b.setNo, b.g[0] + b.g[1] + 1, names[sn.server] + (sn.serverNo ? `（${pName(game, sn.server, sn.serverNo)}）` : ''), names[e.team], who, d.label, names[sn.winner],
        sn.res.game ? '' : pointText(st.R, sn.p, sn.tb), `${sn.g[0]}−${sn.g[1]}`, sn.sets.map(setText).join(' '), ev]);
    });
    return rows;
  }
  function csvBox(game) {
    const st = stats(game);
    const keys = [['ace', 'エース'], ['win', 'ウィナー'], ['err', 'ミス'], ['df', 'ダブルフォルト'], ['flt', 'フォルト（1st）'], ['pt', 'ポイント（理由なし）']];
    const rows = [['側', '選手'].concat(keys.map((k) => k[1]), ['取ったポイント', 'サーブのポイント（取った/全部）', '1stサーブ（入った/全部）', 'サービスゲーム（キープ/全部）', 'ブレイク'])];
    st.forEach((x) => {
      x.rows.forEach((r) => rows.push([x.name, r.name].concat(keys.map((k) => r.c[k[0]] || 0), ['', '', '', '', ''])));
      rows.push([x.name, '合計'].concat(keys.map((k) => x.total.c[k[0]] || 0), [x.won, `${x.serveWon}/${x.servePts}`, `${x.firstIn}/${x.firstSv}`, `${x.held}/${x.svcGames}`, x.breaks]));
    });
    return rows;
  }

  /* ---------- 種目の登録 ---------- */
  ST.addSport({
    id: 'tennis', name: 'テニス', icon: '🎾', family: 'tennis', prec: 10, hasTeams: true,
    desc: '硬式・ソフトテニス。ポイントの取り方（エース・ウィナー・ミス・ダブルフォルト）から、ゲーム・セット・サーブを自動で',
    unit: '試合',
    TYPES,
    base: ['ace', 'win', 'err', 'df'],
    toggles: [{ key: 'flt', label: 'フォルト（1stサーブ）のボタン → 1stサーブの入った割合', types: ['flt'] }],
    togglesTitle: '選手のボタン',
    togglesNote: 'いつもある：エース・ウィナー・ミス・DF（ダブルフォルト）と、側ごとの「ポイント」。フォルトを出すと、1stサーブが入った割合が集計に出ます（ポイントは動きません）。',
    noTeamEdit: true, noNoEdit: true, noSavedTeams: false,
    noNoText: '（側のポイント）',
    setupTitle: '試合の準備', setupEditTitle: '選手・形式を直す', setupEditSub: '名前・色・最初のサーブ・試合の形式',
    titleHint: '例：県総体 1回戦・練習試合',
    statsSub: 'セットごとのゲーム・エース・ダブルフォルト・1stサーブ・キープとブレイク',
    startHint: '最初のサーブの瞬間',
    optsEditNote: '試合の途中で形式を変えると、これまでのポイントから、ゲーム・セットを数え直します。',
    defaultOpts: () => ({ kind: 'hard', fmt: 'single', sets: 3, games: 6, adv: 'ad', final: 'set', sgames: 7 }),
    optFields: [
      { key: 'kind', label: '種類', choices: [['hard', '硬式テニス'], ['soft', 'ソフトテニス']] },
      { key: 'fmt', label: 'シングルス・ダブルス', choices: [['single', 'シングルス'], ['double', 'ダブルス']] },
      { key: 'sets', label: 'セット数', choices: [[1, '1セットマッチ'], [3, '3セットマッチ'], [5, '5セットマッチ']], hidden: (o) => o.kind === 'soft' },
      { key: 'games', label: '1セットのゲーム数', choices: [[6, '6ゲーム（ふつう）'], [4, '4ゲーム（ショートセット）'], [8, '8ゲーム（プロセット）']], note: '同じゲーム数で並んだら（6−6・4−4・8−8）、7ポイントのタイブレーク', hidden: (o) => o.kind === 'soft' },
      { key: 'adv', label: 'デュース', choices: [['ad', 'アドバンテージあり'], ['noad', 'ノーアド（40−40 は次の1ポイントで決める）']], hidden: (o) => o.kind === 'soft' },
      { key: 'final', label: '最終セット', choices: [['set', 'ふつうのセット'], ['mtb', '10ポイントのマッチタイブレーク']], hidden: (o) => o.kind === 'soft' || Number(o.sets) === 1 },
      { key: 'sgames', label: 'ゲーム数', choices: [[5, '5ゲームマッチ（3ゲーム先取）'], [7, '7ゲームマッチ（4ゲーム先取）'], [9, '9ゲームマッチ（5ゲーム先取）']], note: 'ゲームは4ポイント先取（3−3 からデュース）。ゲームが並ぶと（7ゲームマッチなら 3−3）、ファイナルゲーム（7ポイント先取・2ポイント差）', hidden: (o) => o.kind !== 'soft' }
    ],
    initGame: (g) => { if (!g.serve) g.serve = { side: 0, p: ['1', '1'] }; },
    fromDraft: (g, D) => { g.serve = cleanServe(D.serve); },
    importExtra: (obj, g) => { g.serve = cleanServe(obj.serve); },
    exportExtra: (game, g) => {
      const st = replay(game);
      g.tennis = { sets: st.sets, games: st.g, points: st.p, setsWon: st.sw, over: st.over, winner: st.winner, rules: st.R };
      g.events.forEach((e) => { const sn = st.snap[e.id]; if (sn && sn.winner != null) { e.won = sn.winner; e.server = sn.server; } });
    },
    cleanEvent: (e) => ({}),
    sideNames: (game) => [sideName(game, 0), sideName(game, 1)],
    fileWho: (game) => ST.safeName(sideName(game, 0)) + 'vs' + ST.safeName(sideName(game, 1)),
    score, scoreText,
    editTypes: (game, e) => (e.type === 'mark' ? ['mark'] : ['ace', 'win', 'err', 'df', 'pt', 'flt']),
    whoText: (game, e) => {
      if (e.team == null) return 'チームなし';
      return e.no != null ? pName(game, e.team, e.no) : `${sideName(game, e.team)}（側のポイント）`;
    },
    lastText: (game, e) => {
      const d = TYPE[e.type] || { label: e.type };
      const s = snapText(game, e);
      return (d.short || d.label) + (s ? ` → ${s}` : '');
    },
    logWho: () => '',
    logText: (game, e) => { const d = TYPE[e.type] || { label: e.type }; const s = snapText(game, e); return d.label + (s ? ` → ${s}` : ''); },
    csvEvents, csvBox,
    exports: [
      { key: 'csv', suffix: '_一覧', label: '📋 ポイントの一覧（CSV）', desc: '時刻・サーブ・取った側と理由・その時点のポイント・ゲーム・セット。Excel・Numbers・Google スプレッドシートで開けます', rows: csvEvents },
      { key: 'box', suffix: '_集計', label: '📊 選手ごとの集計（CSV）', desc: 'エース・ウィナー・ミス・ダブルフォルト・1stサーブ・キープとブレイク', rows: csvBox }
    ],
    steps: [
      ['形式と選手を選ぶ', '硬式かソフトテニスか・シングルスかダブルス・セット数（ゲーム数）。選手の名前と、最初にサーブする人も'],
      ['最初のサーブの瞬間に ▶ スタート', '時計が動き出します（試合の動画と同じ時間の流れ）'],
      ['ポイントが決まったら、その理由のボタンを1回', '「エース」「ウィナー」はその選手の側のポイント、「ミス」「DF」は相手の側のポイント。理由を付けないときは、側の「ポイント」'],
      ['ゲーム・セット・サーブは自動', 'ポイントから数えます。まちがえたら「↶ 取り消す」。試合が決まると、終える案内が出ます']
    ],
    help: [['記録の画面', [
      '上の帯：時計・いまのセット（ソフトテニスはゲーム数の形式）と呼び名（デュース・アドバンテージ・タイブレーク など）',
      'その下のスコア：セットごとのゲーム数と、いまのゲームのポイント（大きい数字）。● がサーブする側（ダブルスの硬式は、サーブする人の名前も目安で出します）',
      '選手の行：「エース」「ウィナー」（その側のポイント）・「ミス」「DF」（相手のポイント）。エース・DF・フォルトは、サーブする側だけ押せます',
      '側の「ポイント」：理由を付けずに、その側のポイントにします（相手のミスか分からないとき など）',
      '画面の下の「★ あとで見る」：ポイントにせず、時刻だけを残します'
    ]], ['ルールのしくみ', [
      '硬式：0・15・30・40・デュース・アドバンテージ（ノーアドも選べます）。6ゲーム先取・2ゲーム差、6−6 で7ポイントのタイブレーク。最終セットを10ポイントのマッチタイブレークにもできます',
      'ソフトテニス：4ポイント先取（3−3 からデュース）。7ゲームマッチなら4ゲーム先取で、3−3 になるとファイナルゲーム（7ポイント先取・2ポイント差）',
      'サーブはゲームごとに交代。タイブレーク（硬式）は1ポイント目のあと2ポイントずつ、ファイナルゲーム（ソフトテニス）は2ポイントずつ交代します',
      'ゲーム・セットはポイントの記録から数えるので、「記録の一覧」で直したり取り消したりすると、自動で正しくなります'
    ]]]
  });
  function cleanServe(s) {
    s = s && typeof s === 'object' ? s : {};
    const p = Array.isArray(s.p) ? s.p : ['1', '1'];
    return { side: s.side === 1 ? 1 : 0, p: [p[0] === '2' ? '2' : '1', p[1] === '2' ? '2' : '1'] };
  }
  const sp = ST.SPORTS.tennis;
  sp.replay = replay; sp.rules = rules; sp.sideName = sideName; sp.pName = pName; sp.isDouble = isDouble;
  sp.pointCells = pointCells; sp.callText = callText; sp.pointText = pointText; sp.setText = setText; sp.setsText = setsText;
  sp.stats = stats; sp.snapText = snapText; sp.cleanServe = cleanServe;
})(typeof window !== 'undefined' ? window : globalThis);
