/* スポーツ タップ記録 — 野球。画面を持たない部分（記録の種類・試合の流れの計算・集計・CSV）
   スコアをつける人が、試合を見ながら「1球ずつ」と「打席の結果」をタップで記録する。

   ■ 記録（core.js の形に足すもの）
     1球：'b' ボール・'s' ストライク・'f' ファウル  { team: 攻撃のチーム, no: 打者の背番号, slot: 打順（0 から） }
       4つ目のボールは四球、3つ目のストライクは三振として、その打席を終える（別の記録は足さない。取り消せば元に戻る）
     打席の結果：'1b' 単打 … 'dp' 併殺（下の RESULTS）  { team, no, slot }。押すと、次の打者へ
     手で直すもの：'run' ＋1点（いちばん先の走者を消して1点）・'out' アウト＋1（走者のアウト）・
       'base' 走者を置く・消す { base: 0 一塁・1 二塁・2 三塁, on }・'chg' チェンジ（3アウトにする）
     交代など：'pch' 投手の交代 { team: 守りのチーム, no }・'sub' 代打 { team, slot, no }・'bat' 打順を直す（次の打者を決める）{ team, slot }
     先攻のチームは opts.top（0 自分・1 相手）。先発投手は teams[i].pitcher（背番号）。打順は teams[i].players の並び、
     打順の人数は teams[i].order（背番号を入れていない打順も数える。なければ名簿の人数、名簿もなければ 9）。
   ■ イニング・アウト・カウント・走者・得点は、記録を時刻の順にたどって計算する（derive）。
     取り消す・一覧で直すと、全部が自動で正しくなる。
   ■ 走者の動き：自動で動かすのは「確かなものだけ」
     四球・死球・安打・失策・野選は、打者が塁に出て、押し出される走者だけ1つ先へ（押し出しの点も）。三塁打は走者全員、本塁打は打者と走者全員の点。
     犠飛は三塁の走者の1点、犠打は走者全員を1つ先へ（よくある形）、併殺はいちばん後ろの走者を消す（よくある形）。
     それ以外（タッチアップ・盗塁・二塁からの生還…）は、塁をタップして直すか「＋1点」「アウト＋1」で。 */
(function (root) {
  'use strict';
  const ST = root.ST;

  const PITCHES = ['b', 's', 'f'];
  const RESULTS = ['1b', '2b', '3b', 'hr', 'bb', 'hbp', 'e', 'fc', 'k', 'go', 'fo', 'lo', 'sh', 'sf', 'dp'];
  const TYPES = [
    { id: 'b', btn: 'ボール', label: 'ボール', kind: 'pball', pitch: true },
    { id: 's', btn: 'ストライク', label: 'ストライク', kind: 'pstrike', pitch: true },
    { id: 'f', btn: 'ファウル', label: 'ファウル', kind: 'pfoul', pitch: true },
    { id: '1b', btn: '単打', label: '単打（ヒット）', short: '単打', kind: 'hit', hit: 1, reach: 1, ab: true },
    { id: '2b', btn: '二塁打', label: '二塁打', kind: 'hit', hit: 2, reach: 2, ab: true },
    { id: '3b', btn: '三塁打', label: '三塁打', kind: 'hit', hit: 3, reach: 3, ab: true },
    { id: 'hr', btn: '本塁打', label: '本塁打（ホームラン）', short: '本塁打', kind: 'hit', hit: 4, reach: 4, ab: true },
    { id: 'bb', btn: '四球', label: '四球（フォアボール）', short: '四球', kind: 'walk', reach: 1, walk: true },
    { id: 'hbp', btn: '死球', label: '死球（デッドボール）', short: '死球', kind: 'walk', reach: 1, walk: true },
    { id: 'e', btn: '失策', label: '失策（エラーで出塁）', short: '失策', kind: 'reach', reach: 1, ab: true, err: true },
    { id: 'fc', btn: '野選', label: '野選（フィルダースチョイス）', short: '野選', kind: 'reach', reach: 1, ab: true },
    { id: 'k', btn: '三振', label: '三振', kind: 'out', outs: 1, ab: true },
    { id: 'go', btn: 'ゴロ', label: 'ゴロ（アウト）', short: 'ゴロ', kind: 'out', outs: 1, ab: true },
    { id: 'fo', btn: 'フライ', label: 'フライ（アウト）', short: 'フライ', kind: 'out', outs: 1, ab: true },
    { id: 'lo', btn: 'ライナー', label: 'ライナー（アウト）', short: 'ライナー', kind: 'out', outs: 1, ab: true },
    { id: 'sh', btn: '犠打', label: '犠打（送りバント）', short: '犠打', kind: 'sac', outs: 1, adv: 'all' },
    { id: 'sf', btn: '犠飛', label: '犠飛（犠牲フライ）', short: '犠飛', kind: 'sac', outs: 1, adv: 'third' },
    { id: 'dp', btn: '併殺', label: '併殺（ダブルプレー）', short: '併殺', kind: 'out', outs: 2, ab: true, dp: true },
    { id: 'run', btn: '＋1点', label: '得点（＋1点）', short: '＋1点', kind: 'run' },
    { id: 'out', btn: 'アウト＋1', label: 'アウト（走者）', short: 'アウト＋1', kind: 'rout' },
    { id: 'base', label: '走者', kind: 'adj' },
    { id: 'chg', label: 'チェンジ（3アウトにする）', short: 'チェンジ', kind: 'adj' },
    { id: 'pch', label: '投手の交代', short: '投手交代', kind: 'adj' },
    { id: 'sub', label: '代打', kind: 'adj' },
    { id: 'bat', label: '打順を直す', kind: 'adj' }
  ];
  const TYPE = {};
  TYPES.forEach((d) => { TYPE[d.id] = d; });
  const BASE = ['一塁', '二塁', '三塁'];

  const norm = (v) => (v == null || v === '' ? null : ST.normNo(v));
  const cleanOrder = (v) => (Number.isInteger(v) && v >= 1 && v <= 20 ? v : undefined);
  const halfOf = (h) => ({ inning: Math.floor(h / 2) + 1, top: h % 2 === 0 });
  const halfText = (h) => { const x = halfOf(h); return `${x.inning}回${x.top ? '表' : '裏'}`; };
  /* その半イニングに攻撃するチーム（0・1） */
  const batOf = (game, h) => { const top = (game.opts || {}).top === 1 ? 1 : 0; return h % 2 === 0 ? top : 1 - top; };
  /* 打順の人数：準備で決めた人数（teams[i].order。背番号を入れていない打順も数える）。決めていなければ名簿の人数（名簿がなければ 9 人） */
  const slotsOf = (lineup, order) => Math.max(1, order != null && order > 0 ? Math.max(order, lineup.length) : lineup.length || 9);

  /* ---------- 試合の流れ（記録を時刻の順にたどる） ----------
     戻り値 st：
       half（0 = 1回表）, outs, b, s（いまのカウント）, bases（[一塁, 二塁, 三塁]：{ no } | null）,
       score・hits・errs（[自分, 相手]）, line（[チーム][イニング] の得点）, lineup（いまの打順の背番号）, next（次の打順）,
       pitcher（いま投げている投手 [自分, 相手]）, pitchers（[チーム] の投手ごとの記録）, pa（打席の記録）, info（記録ごとの状況 id → {…}） */
  function derive(game) {
    const lineupOf = (tm) => ((game.teams[tm] || {}).players || []).map((p) => p.no);
    const st = {
      half: 0, outs: 0, b: 0, s: 0, bases: [null, null, null],
      score: [0, 0], hits: [0, 0], errs: [0, 0], line: [[], []],
      lineup: [lineupOf(0), lineupOf(1)], order: [0, 1].map((tm) => (game.teams[tm] || {}).order), next: [0, 0],
      pitcher: [norm((game.teams[0] || {}).pitcher), norm((game.teams[1] || {}).pitcher)],
      pitchers: [[], []], pa: [], info: {}
    };
    const pit = (tm) => {
      const no = st.pitcher[tm];
      let P = st.pitchers[tm].find((x) => x.no === no);
      if (!P) { P = { no, pitches: 0, bf: 0, h: 0, k: 0, bb: 0, r: 0, outs: 0 }; st.pitchers[tm].push(P); }
      return P;
    };
    const touch = () => { const b = batOf(game, st.half), i = halfOf(st.half).inning - 1; if (st.line[b][i] == null) st.line[b][i] = 0; };
    const endHalf = () => { touch(); st.half++; st.outs = 0; st.b = 0; st.s = 0; st.bases = [null, null, null]; touch(); };
    const addRuns = (n, inf) => {
      if (!n) return;
      const b = batOf(game, st.half);
      st.score[b] += n;
      const i = halfOf(st.half).inning - 1;
      st.line[b][i] = (st.line[b][i] || 0) + n;
      pit(1 - b).r += n;
      inf.runs = (inf.runs || 0) + n;
    };
    const addOuts = (n) => {
      const b = batOf(game, st.half);
      const P = pit(1 - b);
      const take = Math.min(n, 3 - st.outs);
      P.outs += take;
      st.outs += n;
      if (st.outs >= 3) { endHalf(); return true; }
      return false;
    };
    /* 打者が k 塁（4 は本塁）へ。走者は、前の走者を追いこさない最小の動き（押し出し） */
    const reach = (k, no, inf) => {
      let prev = k, runs = k >= 4 ? 1 : 0;
      const nb = [null, null, null];
      if (k <= 3) nb[k - 1] = { no };
      [0, 1, 2].forEach((i) => {
        const r = st.bases[i];
        if (!r) return;
        const f = Math.max(i + 1, prev + 1);
        prev = f;
        if (f >= 4) runs++; else nb[f - 1] = r;
      });
      st.bases = nb;
      addRuns(runs, inf);
    };
    const endPA = (res, e, inf) => {
      const d = TYPE[res];
      const b = batOf(game, st.half), f = 1 - b;
      const n = slotsOf(st.lineup[b], st.order[b]);
      const slot = Number.isInteger(e.slot) && e.slot >= 0 ? e.slot % n : st.next[b];
      const no = e.no != null ? e.no : st.lineup[b][slot] || null;
      st.next[b] = (slot + 1) % n;
      const P = pit(f);
      P.bf++;
      const pa = { id: e.id, team: e.team === 0 || e.team === 1 ? e.team : b, no, slot, res, pitcher: P.no, half: st.half, runs: 0 };
      st.pa.push(pa);
      st.b = 0; st.s = 0;
      if (d.hit) { st.hits[b]++; P.h++; }
      if (res === 'k') P.k++;
      if (d.walk) P.bb++;
      if (d.err) st.errs[f]++;
      const before = inf.runs || 0;
      if (d.outs) {
        if (!addOuts(d.outs)) {
          if (d.adv === 'all') {                      // 犠打：走者全員を1つ先へ
            let runs = 0;
            const nb = [null, null, null];
            [2, 1, 0].forEach((i) => { const r = st.bases[i]; if (!r) return; if (i === 2) runs++; else nb[i + 1] = r; });
            st.bases = nb;
            addRuns(runs, inf);
          } else if (d.adv === 'third') {             // 犠飛：三塁の走者の1点
            if (st.bases[2]) { st.bases[2] = null; addRuns(1, inf); }
          } else if (d.dp) {                          // 併殺：いちばん後ろの走者を消す
            const i = [0, 1, 2].find((x) => st.bases[x]);
            if (i != null) st.bases[i] = null;
          }
        }
      } else if (d.reach) reach(d.reach, no, inf);
      pa.runs = (inf.runs || 0) - before;
      inf.pa = pa;
    };
    touch();
    ST.sorted(game).forEach((e) => {
      const d = TYPE[e.type];
      if (!d) return;
      const b = batOf(game, st.half), f = 1 - b;
      const inf = { half: st.half, outs: st.outs, bat: b, pitcher: st.pitcher[f], runs: 0 };
      if (d.pitch) {
        const P = pit(f);
        P.pitches++;
        inf.pc = P.pitches;
        if (e.type === 'b') { st.b++; if (st.b >= 4) { inf.auto = 'bb'; endPA('bb', e, inf); } }
        else if (e.type === 's') { st.s++; if (st.s >= 3) { inf.auto = 'k'; endPA('k', e, inf); } }
        else if (st.s < 2) st.s++;
      } else if (RESULTS.includes(e.type)) {
        const P = pit(f);
        P.pitches++;
        inf.pc = P.pitches;
        endPA(e.type, e, inf);
      } else if (e.type === 'run') {
        const i = [2, 1, 0].find((x) => st.bases[x]);
        if (i != null) st.bases[i] = null;
        addRuns(1, inf);
      } else if (e.type === 'out') addOuts(1);
      else if (e.type === 'chg') { if (st.outs < 3) { pit(f).outs += 3 - st.outs; endHalf(); } }
      else if (e.type === 'base') { const i = Number(e.base); if (i >= 0 && i <= 2) st.bases[i] = e.on ? { no: e.no != null ? e.no : null } : null; }
      else if (e.type === 'pch') { if (e.team === 0 || e.team === 1) { st.pitcher[e.team] = e.no; pit(e.team); } }
      else if (e.type === 'sub') { if ((e.team === 0 || e.team === 1) && Number.isInteger(e.slot) && e.slot >= 0) { while (st.lineup[e.team].length <= e.slot) st.lineup[e.team].push(null); st.lineup[e.team][e.slot] = e.no; } }
      else if (e.type === 'bat') { if ((e.team === 0 || e.team === 1) && Number.isInteger(e.slot)) { st.next[e.team] = e.slot % slotsOf(st.lineup[e.team], st.order[e.team]); if (e.team === b) { st.b = 0; st.s = 0; } } }
      inf.outsAfter = st.outs; inf.b = st.b; inf.s = st.s; inf.halfAfter = st.half;
      st.info[e.id] = inf;
    });
    return st;
  }
  /* いまの状況（記録の画面に出すもの） */
  function situation(game) {
    const st = derive(game);
    const bat = batOf(game, st.half), fld = 1 - bat;
    const lineup = st.lineup[bat];
    const n = slotsOf(lineup, st.order[bat]);
    const slot = st.next[bat] % n;
    const P = st.pitchers[fld].find((x) => x.no === st.pitcher[fld]) || { no: st.pitcher[fld], pitches: 0 };
    return Object.assign(st, {
      bat, fld, inning: halfOf(st.half).inning, top: halfOf(st.half).top, halfText: halfText(st.half),
      slot, batter: lineup[slot] || null, nextSlot: (slot + 1) % n, nextBatter: lineup[(slot + 1) % n] || null, nSlots: n,
      pitcherNo: P.no, pitchCount: P.pitches
    });
  }

  /* ---------- 名前 ---------- */
  function annot(st, e) {
    const inf = st.info[e.id];
    if (!inf) return '';
    const parts = [];
    if (inf.auto === 'bb') parts.push('→ 四球');
    if (inf.auto === 'k') parts.push('→ 三振');
    if (TYPE[e.type] && TYPE[e.type].pitch && !inf.auto) parts.push(`${inf.b}-${inf.s}`);
    if (inf.runs) parts.push(`${inf.runs}点`);
    if (inf.halfAfter > inf.half) parts.push('チェンジ');
    return parts.join('・');
  }
  function typeLabel(game, e) {
    const d = TYPE[e.type];
    if (!d) return e.type;
    if (e.type === 'base') return `${BASE[e.base] || ''}${e.on ? 'に走者' : 'の走者を消す'}`;
    if (e.type === 'pch') return `投手の交代 → #${e.no != null ? e.no : '?'}`;
    if (e.type === 'sub') return `代打 ${Number(e.slot) + 1}番 → #${e.no != null ? e.no : '?'}`;
    if (e.type === 'bat') return `打順を直す → ${Number(e.slot) + 1}番`;
    return d.short || d.label;
  }
  function textWithAnnot(game, e, st) {
    const a = annot(st || derive(game), e);
    return typeLabel(game, e) + (a ? `（${a}）` : '');
  }
  const whoOf = (game, e) => {
    if (e.type === 'pch') return `${ST.teamName(game, e.team)} 投手`;
    if (!(TYPE[e.type].pitch || RESULTS.includes(e.type) || e.type === 'sub')) return ST.teamName(game, e.team);
    const nm = e.no != null ? ST.playerName(game, e.team, e.no) : '';
    return `${ST.teamName(game, e.team)} ${Number.isInteger(e.slot) ? e.slot + 1 + '番 ' : ''}${e.no != null ? '#' + e.no : ''}${nm ? ' ' + nm : ''}`.trim();
  };

  /* ---------- 集計 ---------- */
  const zeroBat = () => ({ pa: 0, ab: 0, h: 0, d2: 0, d3: 0, hr: 0, bb: 0, k: 0, sac: 0, runs: 0 });
  function batting(game, st) {
    st = st || derive(game);
    return [0, 1].map((tm) => {
      const order = ((game.teams[tm] || {}).players || []).map((p) => p.no);
      const map = new Map();
      const get = (no) => { const k = no == null ? '?' : no; if (!map.has(k)) map.set(k, { no, name: no != null ? ST.playerName(game, tm, no) : '', s: zeroBat() }); return map.get(k); };
      order.forEach((no) => get(no));
      const total = zeroBat();
      st.pa.filter((x) => x.team === tm).forEach((x) => {
        const d = TYPE[x.res];
        [get(x.no).s, total].forEach((s) => {
          s.pa++;
          if (d.ab) s.ab++;
          if (d.hit) s.h++;
          if (d.hit === 2) s.d2++;
          if (d.hit === 3) s.d3++;
          if (d.hit === 4) s.hr++;
          if (d.walk) s.bb++;
          if (x.res === 'k') s.k++;
          if (d.kind === 'sac') s.sac++;
        });
      });
      const rows = Array.from(map.values()).sort((a, b) => {
        const ia = order.indexOf(a.no), ib = order.indexOf(b.no);
        return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || ST.cmpNo(a.no || '999', b.no || '999');
      }).map((r) => Object.assign(r, { slot: order.indexOf(r.no) }));
      return { team: tm, rows, total };
    });
  }
  /* 打率：「.333」（打数が 0 なら「—」） */
  const avg = (h, ab) => (ab ? (h / ab).toFixed(3).replace(/^0/, '') : '—');
  /* 投球回：アウトの数 → 「5 1/3」 */
  const ipText = (outs) => { const w = Math.floor(outs / 3), r = outs % 3; return r ? `${w ? w + ' ' : ''}${r}/3` : String(w); };

  function scoreText(game) { const s = derive(game).score; return `${s[0]} − ${s[1]}`; }

  /* ---------- CSV ---------- */
  function csvEvents(game) {
    const st = derive(game);
    const rows = [['No', '時刻', 'スタートからの秒', 'イニング', '表裏', 'アウト（前）', '攻撃', '打順', '背番号', '名前', '記録', 'カウント（後）', '投手', 'この記録の得点', `${ST.teamName(game, 0)}の得点`, `${ST.teamName(game, 1)}の得点`]];
    const s = [0, 0];
    let n = 0;
    ST.sorted(game).forEach((e) => {
      const inf = st.info[e.id];
      if (!inf) return;
      const hf = halfOf(inf.half);
      if (inf.runs) s[inf.bat] += inf.runs;
      const isBat = TYPE[e.type].pitch || RESULTS.includes(e.type);
      rows.push([++n, ST.fmtTime(e.t), e.t, hf.inning, hf.top ? '表' : '裏', inf.outs, ST.teamName(game, inf.bat),
        isBat && Number.isInteger(e.slot) ? e.slot + 1 : '', isBat && e.no != null ? e.no : e.type === 'pch' || e.type === 'sub' ? (e.no != null ? e.no : '') : '',
        isBat && e.no != null ? ST.playerName(game, e.team, e.no) : '', textWithAnnot(game, e, st),
        TYPE[e.type].pitch ? `${inf.b}-${inf.s}` : '', inf.pitcher != null ? '#' + inf.pitcher : '', inf.runs || '', s[0], s[1]]);
    });
    return rows;
  }
  function csvBatting(game) {
    const st = derive(game);
    const rows = [['チーム', '打順', '背番号', '名前', '打席', '打数', '安打', '二塁打', '三塁打', '本塁打', '四死球', '三振', '犠打飛', '打率']];
    batting(game, st).forEach((x) => {
      const name = ST.teamName(game, x.team);
      const line = (r, slot, no, nm) => { const s = r; rows.push([name, slot, no, nm, s.pa, s.ab, s.h, s.d2, s.d3, s.hr, s.bb, s.k, s.sac, avg(s.h, s.ab)]); };
      x.rows.forEach((r) => line(r.s, r.slot >= 0 ? r.slot + 1 : '代打など', r.no != null ? r.no : '番号なし', r.name));
      line(x.total, '合計', '', '');
    });
    return rows;
  }
  function csvPitching(game) {
    const st = derive(game);
    const rows = [['チーム', '投手（背番号）', '名前', '投球数', '投球回', '打者', '被安打', '奪三振', '与四死球', '失点']];
    [0, 1].forEach((tm) => st.pitchers[tm].filter((P) => P.pitches || P.bf || P.outs).forEach((P) => {
      rows.push([ST.teamName(game, tm), P.no != null ? P.no : '不明', P.no != null ? ST.playerName(game, tm, P.no) : '', P.pitches, ipText(P.outs), P.bf, P.h, P.k, P.bb, P.r]);
    }));
    return rows;
  }

  ST.addSport({
    id: 'baseball', name: '野球', icon: '⚾', family: 'baseball', unit: '試合',
    desc: '1球ずつ（ボール・ストライク・ファウル）と打席の結果。アウト・イニング・投球数は自動で。スコアボードと打者・投手の集計',
    prec: 10, hasTeams: true, orderedRoster: true, noTeamEdit: true, typeWord: '記録', rosterLabel: '打順',
    startHint: 'プレイボール（試合開始）の瞬間',
    setupTitle: '試合の準備（打順・先発投手）', setupEditTitle: 'チーム・打順を直す', setupEditSub: '名前・色・打順・先発投手・試合の形式',
    statsSub: 'スコアボード・打者ごと・投手ごと（投球数）',
    TYPES, PITCHES, RESULTS, BASE,
    defaultOpts: () => ({ inn: 7, plim: 0, top: 0 }),
    optFields: [
      { key: 'inn', label: 'イニング', choices: [[9, '9回'], [7, '7回'], [6, '6回'], [5, '5回']], note: '高校・一般 9 回・中学 7 回・少年野球 6 回など。決めた回を過ぎても、そのまま延長で記録できます' },
      { key: 'plim', label: '投球数の目安（1人の投手）', choices: [[0, 'なし'], [70, '70球'], [80, '80球'], [100, '100球']], note: '少年野球・中学の投球数の制限に。目安の 10 球前から黄色、目安に届くと赤で知らせます' }
    ],
    toggles: [{ key: 'pitch', label: '1球ずつ記録する（ボール・ストライク・ファウル → カウントと投球数。4ボールで四球・3ストライクで三振）', def: true }],
    togglesTitle: '記録のしかた',
    togglesNote: 'オフにすると、打席の結果だけを記録します（投球数は、結果1つを1球として数えます）。',
    steps: [
      ['チーム・打順・先発投手を決める', '打順は 1番から順に背番号を入れます（名前はなくてもOK）。先攻はどちらかも選びます'],
      ['プレイボールで ▶ スタート', '時計が動き出し、1回表から始まります'],
      ['1球ごとに「ボール」「ストライク」「ファウル」', 'カウントと投手の投球数が進みます。4ボールで四球、3ストライクで三振（自動で次の打者へ）'],
      ['打席の結果を1回タップ', '単打・ゴロ・フライ…を押すと、アウト・走者・得点が進み、次の打者へ。3アウトで自動でチェンジ']
    ],
    help: [['記録の画面', [
      '上の帯：時計・いまのイニング（「3回表」）・カウント（B・S・O）・得点（▲ が攻撃中のチーム）',
      'いまの打者（打順・背番号）を押すと、代打・打順を直す。投手を押すと、投手の交代（そこから投球数を数え直します）',
      '走者：ダイヤモンドの塁を押すと、走者を置く・消す（盗塁・タッチアップ・牽制などは、これで直します）',
      '「＋1点」：いちばん先の走者を消して1点（走者がいなくても1点）。「アウト＋1」：走者のアウト（塁の走者は、押して消してください）',
      '「1球ずつは記録しない」：「≡ メニュー」→「設定」。打席の結果だけを記録し、投球数は結果1つを1球として数えます'
    ]], ['走者の自動の動き（確かなものだけ）', [
      '四球・死球・単打・失策・野選：打者が一塁へ。押し出される走者だけ1つ先へ（満塁なら押し出しの1点）',
      '二塁打・三塁打：打者が二塁・三塁へ。前の走者を追いこさない、いちばん少ない動きだけ（三塁打なら走者全員が生還）。本塁打は打者と走者全員の点',
      '犠飛は三塁の走者の1点。犠打は走者全員を1つ先へ、併殺はいちばん後ろの走者を消します（よくある形。ちがうときは、塁を押して直してください）',
      'それ以外の動き（二塁からの生還・盗塁・暴投など）は、自動では動かしません。塁を押すか「＋1点」で直してください'
    ]], ['投球数と集計', [
      '投球数：ボール・ストライク・ファウルが1球ずつ。打席の結果（ゴロ・ヒット・死球など）も1球として数えます',
      '投球数の目安（試合の形式）：目安の 10 球前から黄色、目安に届くと赤で知らせます（少年野球・中学の投球数の制限に）',
      '集計：スコアボード（イニングごとの得点・安打・失策）、打者ごと（打席・打数・安打・四死球・三振・打率）、投手ごと（投球数・投球回・打者・被安打・奪三振・与四死球・失点）',
      '失点は「その投手が投げている間に入った点」です（前の投手が出した走者の点も、いまの投手に入ります）。自責点・打点は数えていません'
    ]]],
    initDraft: (draft) => { draft.teams.forEach((t) => { if (t.pitcher == null) t.pitcher = null; }); },
    fromDraft: (g, D) => { [0, 1].forEach((i) => { g.teams[i].pitcher = norm(D.teams[i].pitcher); g.teams[i].order = cleanOrder(D.teams[i].order); }); },
    importExtra: (obj, g) => { [0, 1].forEach((i) => { const t = (obj.teams || [])[i] || {}; g.teams[i].pitcher = norm(t.pitcher); g.teams[i].order = cleanOrder(t.order); }); },
    cleanEvent: (e) => {
      const o = {};
      if (Number.isInteger(e.slot) && e.slot >= 0 && e.slot < 30) o.slot = e.slot;
      if (e.type === 'base') { const b = Number(e.base); if (!(b >= 0 && b <= 2)) return null; o.base = b; o.on = !!e.on; }
      if ((e.type === 'sub' || e.type === 'bat') && o.slot == null) return null;
      return o;
    },
    exportExtra: (game, g) => {
      const st = derive(game);
      g.events.forEach((e) => { const inf = st.info[e.id]; if (inf) { const hf = halfOf(inf.half); e.inning = hf.inning; e.half = hf.top ? '表' : '裏'; e.outs = inf.outs; if (inf.auto) e.auto = inf.auto; if (inf.runs) e.runs = inf.runs; } });
      g.linescore = st.line;
      g.hits = st.hits; g.errors = st.errs;
    },
    editTypes: (game, e) => (PITCHES.includes(e.type) ? PITCHES.slice() : RESULTS.includes(e.type) ? RESULTS.slice() : [e.type]),
    timeText: (game, e) => { const inf = derive(game).info[e.id]; return inf ? halfText(inf.half) : ST.fmtTime(e.t); },
    lastText: (game, e) => textWithAnnot(game, e),
    whoText: whoOf,
    logText: (game, e) => textWithAnnot(game, e),
    logWho: (game, e) => (Number.isInteger(e.slot) && (TYPE[e.type].pitch || RESULTS.includes(e.type)) ? `${e.slot + 1}番` : e.type === 'pch' ? '投手' : '—'),
    noNoText: '',
    score: (game) => derive(game).score,
    scoreText,
    exports: [
      { key: 'csv', suffix: '_一覧', label: '📋 記録の一覧（CSV）', desc: '1球・打席の結果ごとに、時刻・イニング・表裏・アウト・打者・結果・カウント・投手・その時点の得点', rows: csvEvents },
      { key: 'bat', suffix: '_打者', label: '📊 打者ごとの集計（CSV）', desc: '打席・打数・安打・二塁打・三塁打・本塁打・四死球・三振・犠打飛・打率', rows: csvBatting },
      { key: 'pit', suffix: '_投手', label: '⚾ 投手ごとの集計（CSV）', desc: '投球数・投球回・打者・被安打・奪三振・与四死球・失点', rows: csvPitching }
    ],
    derive, situation, batting, avg, ipText, halfText, halfOf, batOf, slotsOf, annot, textWithAnnot, csvEvents, csvBatting, csvPitching
  });
})(typeof window !== 'undefined' ? window : globalThis);
