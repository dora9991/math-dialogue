/* minibasket/js/core.js
   スコアシート1試合ぶんのデータ（読み取り結果）の「正規化」と「整合性チェック」。
   ブラウザでも Node でも動く（Node では module.exports、ブラウザでは window.MB に載る）。

   ── 入力の形（読み取りJSON）───────────────────────────────────────────
   { meta:{event,date,venue,time,gameNo},
     teams:[ { side:'A', name, uniform, finalScore, quarterScores:[6,3,6,2],
               timeouts:[{box:2, minute:4}], teamFouls:[0,1,0,0],
               players:[{ no:'28', name:'', marks:['','/','/','/'], fouls:[{type:'P', ft:1, ink:'black'}] }],
               running:[{ total:2, mark:'slash'|'dot', player:'18', playerCircled:false, qEnd:false }] },
             { side:'B', … } ] }
   marks   … 出場時限の4マス。'/'=出場、'\\' 'X'=斜線以外の印（交代などの意味。出場扱いだが「参考値」にする）、''=なし
   fouls   … type は P/T/U/D、ft はフリースロー数（P2 の 2）、ink は 'red'|'black'（赤=1Q・3Q、黒=2Q・4Q）
   running … 得点が入った「マス」だけを小さい順に。mark: dot=●(1点FT) / slash=斜線(2点)。
             playerCircled=選手番号が丸で囲まれている（3点シュート）。qEnd=ピリオド終了の丸・下線がある
   ──────────────────────────────────────────────────────────────────── */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MB = Object.assign(root.MB || {}, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const QLABEL = ['1Q', '2Q', '3Q', '4Q', 'OT', 'OT2', 'OT3'];
  const KIND_LABEL = { FT: 'フリースロー', FG: '2点', TP: '3点' };

  const str = v => (v == null ? '' : String(v).trim());
  const int = (v, d = null) => {
    if (v == null || v === '') return d;
    const n = Number(String(v).replace(/[^\d.-]/g, ''));
    return Number.isFinite(n) ? Math.round(n) : d;
  };
  const sum = a => a.reduce((s, x) => s + x, 0);

  function normMark(m) {
    if (m === true) return '/';
    if (!m) return '';
    const s = String(m).trim();
    if (s === '/' || s === '／') return '/';
    if (s === '\\' || s === '＼' || s === '¥') return '\\';
    if (/^[xX×✕✖]$/.test(s)) return 'X';
    return s === '' ? '' : '/';
  }

  function normFoul(f) {
    if (typeof f === 'string') {
      const m = /^([PTUDC]?)(\d?)\s*(red|black|r|b)?$/i.exec(f.trim());
      f = m ? { type: m[1] || 'P', ft: m[2] ? +m[2] : 0, ink: m[3] } : { type: 'P' };
    }
    const type = (str(f.type).toUpperCase() || 'P').slice(0, 1);
    const ft = Math.max(0, Math.min(3, int(f.ft, 0)));
    const ink = /^r/i.test(str(f.ink)) ? 'red' : /^b/i.test(str(f.ink)) ? 'black' : null;
    return { type, ft, ink };
  }

  function normPlayer(p) {
    let marks = Array.isArray(p.marks) ? p.marks.map(normMark) : [];
    if (!marks.length && Array.isArray(p.quarters)) marks = p.quarters.map(normMark);
    while (marks.length < 4) marks.push('');
    marks = marks.slice(0, 4);
    return {
      no: str(p.no),
      name: str(p.name),
      marks,
      played: marks.map(m => m !== ''),
      partial: marks.map(m => m === '\\' || m === 'X'),
      fouls: (p.fouls || []).map(normFoul),
    };
  }

  function normTeam(r, i) {
    const quarters = (r.quarterScores || []).map(v => int(v, 0));
    const events = (r.running || [])
      .map(e => ({
        total: int(e.total, 0),
        player: str(e.player),
        mark: /dot|●|ft/i.test(str(e.mark)) ? 'dot' : /slash|\/|fg/i.test(str(e.mark)) ? 'slash' : null,
        circled: !!(e.playerCircled || e.circled),
        qEnd: !!e.qEnd,
      }))
      .filter(e => e.total > 0)
      .sort((a, b) => a.total - b.total);
    let prev = 0;
    for (const e of events) {
      e.pts = e.total - prev;
      e.kind = e.pts === 1 ? 'FT' : e.pts === 2 ? 'FG' : e.pts === 3 ? 'TP' : 'ODD';
      e.markKind = e.mark === 'dot' ? 'FT' : e.mark === 'slash' ? (e.circled ? 'TP' : 'FG') : null;
      prev = e.total;
    }
    const final = int(r.finalScore, null);
    return {
      side: str(r.side) || 'AB'[i],
      name: str(r.name),
      uniform: str(r.uniform),
      quarters,
      final: final != null ? final : (quarters.length ? sum(quarters) : (events.length ? events[events.length - 1].total : 0)),
      timeouts: (r.timeouts || []).map(t => {
        const box = int(t.box, 0);
        return { box, minute: int(t.minute, null), quarter: box >= 1 && box <= 4 ? box - 1 : box >= 5 ? 4 : null };
      }).filter(t => t.box > 0),
      tally: (r.teamFouls || []).map(v => int(v, 0)),
      players: (r.players || []).map(normPlayer).filter(p => p.no !== ''),
      events,
    };
  }

  /** 読み取りJSON → 計算しやすい形。各得点に「どのピリオドか(q)」を付ける */
  function normalizeGame(raw) {
    const g = {
      meta: Object.assign({ event: '', date: '', venue: '', time: '', gameNo: '' }, raw.meta || {}),
      teams: [normTeam((raw.teams || [])[0] || {}, 0), normTeam((raw.teams || [])[1] || {}, 1)],
      notes: Array.isArray(raw.notes) ? raw.notes.map(String) : [],
      myTeam: raw.myTeam === 'A' ? 0 : raw.myTeam === 'B' ? 1 : null,   // 画面で自チームを手動で選んだとき
    };
    g.nq = Math.max(4, ...g.teams.map(t => t.quarters.length));
    for (const t of g.teams) {
      while (t.quarters.length < g.nq) t.quarters.push(0);
      t.cum = [];
      t.quarters.reduce((s, v, k) => (t.cum[k] = s + v), 0);
      for (const e of t.events) {
        let q = t.cum.findIndex(c => e.total <= c);
        if (q < 0) q = g.nq - 1;
        e.q = q;
      }
    }
    return g;
  }

  const tn = (g, i) => g.teams[i].name || (i === 0 ? 'チームA' : 'チームB');

  /** 整合性チェック。errors=数字が合わない(読み違いの可能性が高い) / warnings=要確認 / infos=参考 */
  function validateGame(g) {
    const errors = [], warnings = [], infos = [];
    const add = (arr, code, team, msg, extra) => arr.push(Object.assign({ code, team, msg }, extra));
    g.teams.forEach((t, i) => {
      const nm = tn(g, i);
      // 1) ピリオド得点の合計 = 最終得点
      const qs = sum(t.quarters);
      if (qs !== t.final) add(errors, 'SCORE_SUM', i, `${nm}：ピリオド得点の合計(${qs})が最終得点(${t.final})と合いません`);
      // 2) ランニングスコアの最終 = 最終得点
      const last = t.events.length ? t.events[t.events.length - 1].total : 0;
      if (last !== t.final) add(errors, 'RUN_LAST', i, `${nm}：ランニングスコアの最後(${last})が最終得点(${t.final})と合いません`);
      // 3) 得点の増え方
      t.events.forEach((e, k) => {
        if (e.pts <= 0) add(errors, 'RUN_ORDER', i, `${nm}：得点 ${e.total} が重複しています`, { total: e.total });
        else if (e.kind === 'ODD') add(errors, 'RUN_STEP', i, `${nm}：${e.total - e.pts}→${e.total}（+${e.pts}点）は1〜3点ではありません。間の得点の読み落としかも`, { total: e.total });
        else if (e.markKind && e.markKind !== e.kind) add(warnings, 'MARK_MISMATCH', i, `${nm}：得点 ${e.total} の印は「${KIND_LABEL[e.markKind]}」ですが、増えた点数は+${e.pts}です`, { total: e.total });
      });
      // 4) 各ピリオド終了時点の累計が、ランニングスコアにある
      t.cum.forEach((c, k) => {
        if (c > 0 && (k === 0 || c !== t.cum[k - 1]) && !t.events.some(e => e.total === c))
          add(errors, 'Q_BOUNDARY', i, `${nm}：${QLABEL[k]}終了時点の累計(${c})が、ランニングスコアの得点の中にありません`, { q: k });
      });
      // 5) ピリオド終了の丸の位置
      const ends = t.events.filter(e => e.qEnd).map(e => e.total);
      if (ends.length) {
        const want = t.cum.filter((c, k) => c > 0 && (k === 0 || c !== t.cum[k - 1]));
        if (ends.join() !== want.join()) add(warnings, 'QEND_MISMATCH', i, `${nm}：ランニングスコアのピリオド終了の丸(${ends.join('・')})が、ピリオド得点からの累計(${want.join('・')})と合いません`);
      }
      // 6) 得点した選手が登録にいるか／そのピリオドに出場しているか
      const byNo = new Map(t.players.map(p => [p.no, p]));
      for (const e of t.events) {
        const p = byNo.get(e.player);
        if (!p) add(warnings, 'SCORER_UNKNOWN', i, `${nm}：得点 ${e.total} の背番号 #${e.player || '?'} が選手登録にありません`, { total: e.total });
        else if (e.q < 4 && !p.played[e.q]) add(warnings, 'SCORER_NOT_PLAYING', i, `${nm}：得点 ${e.total}（${QLABEL[e.q]}）の #${e.player} は、その出場時限に印がありません`, { total: e.total });
      }
      // 7) ファウル
      for (const p of t.players) {
        if (p.fouls.length > 5) add(warnings, 'FOUL_OVER', i, `${nm}：#${p.no} のファウルが${p.fouls.length}個あります（最大5個）`);
      }
      const foulTotal = sum(t.players.map(p => p.fouls.length));
      const tallyTotal = sum(t.tally);
      if (tallyTotal > foulTotal) add(warnings, 'TALLY_OVER', i, `${nm}：チームファウル欄の合計(${tallyTotal})が、個人ファウルの合計(${foulTotal})より多いです`);
      // 8) 出場メンバー
      for (let k = 0; k < 4; k++) {
        const n = t.players.filter(p => p.played[k]).length;
        if (n > 0 && n < 5) add(warnings, 'LINEUP_LT5', i, `${nm}：${QLABEL[k]}の出場記録が${n}人です。ふつうは5人なので、斜線の見落としがないか確認してください（④は右の太い線に接していて見落としやすい）`, { q: k });
        else if (n > 5) add(infos, 'LINEUP_GT5', i, `${nm}：${QLABEL[k]}の出場記録が${n}人です（途中交代があった、または印の読み違い）`, { q: k });
      }
      const dnp = t.players.filter(p => !p.played.some(Boolean)).map(p => '#' + p.no);
      if (dnp.length) add(infos, 'ROSTER_DNP', i, `${nm}：出場の印がない登録選手：${dnp.join(' ')}（欠席・ケガ等かは記録からは分かりません）`);
      const odd = t.players.flatMap(p => p.partial.map((x, k) => (x ? `#${p.no}の${QLABEL[k]}` : null)).filter(Boolean));
      if (odd.length) add(infos, 'ODD_MARK', i, `${nm}：出場時限に斜線(／)以外の印：${odd.join('、')}。出場扱いにしていますが、プラスマイナスは参考値になります`);
    });
    // 9) 勝敗・見出し
    if (g.teams[0].final === g.teams[1].final) add(infos, 'DRAW', null, '同点です（延長の記録が抜けていないか確認）');
    return { errors, warnings, infos, ok: errors.length === 0 };
  }

  // ── 画面で直すための「テキスト ⇄ データ」変換 ─────────────────────────────
  const foulsToText = fouls => (fouls || []).map(f => `${f.type || 'P'}${f.ft || ''}${f.ink === 'red' ? 'r' : f.ink === 'black' ? 'b' : ''}`).join(' ');
  const parseFoulsText = s => String(s || '').split(/[\s,、]+/).filter(Boolean).map(t => {
    const m = /^([PTUDC])(\d?)([rRbB]?)$/i.exec(t.trim());
    return m ? { type: m[1].toUpperCase(), ft: m[2] ? +m[2] : 0, ink: m[3] ? (/r/i.test(m[3]) ? 'red' : 'black') : null } : null;
  }).filter(Boolean);
  const rawEventsToText = ev => (ev || []).map(e => `${e.total} ${e.mark === 'dot' ? 'FT' : e.playerCircled ? '3P' : 'FG'} ${e.player}${e.qEnd ? ' *' : ''}`).join('\n');
  function parseEventsText(s) {
    const out = [];
    String(s || '').split(/\n|;|；/).forEach(line => {
      const toks = line.split(/[\s,、:：]+/).filter(Boolean);
      if (toks.length < 3) return;
      const total = int(toks[0], 0);
      if (!total) return;
      const k = toks[1].toUpperCase();
      const e = { total, player: String(toks[2]).replace(/^#/, '') };
      if (/^(FT|●|1)$/.test(k)) e.mark = 'dot';
      else if (/^(3P|3|○)$/.test(k)) { e.mark = 'slash'; e.playerCircled = true; } else e.mark = 'slash';
      if (toks.slice(3).some(t => /^(\*|end|終)$/i.test(t))) e.qEnd = true;
      out.push(e);
    });
    return out;
  }
  const timeoutsToText = t => (t || []).map(x => `${x.box}:${x.minute == null ? '' : x.minute}`).join(' ');
  const parseTimeoutsText = s => String(s || '').split(/[\s,、]+/).filter(Boolean).map(t => {
    const m = /^(\d):?(\d*)$/.exec(t);
    return m ? { box: +m[1], minute: m[2] === '' ? null : +m[2] } : null;
  }).filter(Boolean);

  /** 手入力で始めるための空の試合 */
  function emptyRaw(n) {
    n = n || 10;
    const team = side => ({
      side, name: '', uniform: side === 'A' ? '白' : '濃', finalScore: 0, quarterScores: [0, 0, 0, 0], timeouts: [], teamFouls: [0, 0, 0, 0],
      players: Array.from({ length: n }, () => ({ no: '', name: '', marks: ['', '', '', ''], fouls: [] })), running: [],
    });
    return { meta: { event: '', date: '', venue: '', time: '', gameNo: '' }, teams: [team('A'), team('B')], notes: [] };
  }

  /** 試合の表示名（タブや一覧用） */
  function gameTitle(raw) {
    const m = (raw && raw.meta) || {};
    const d = String(m.date || '').replace(/^\d{4}-0?(\d+)-0?(\d+)$/, '$1/$2');
    return [d, m.time, m.gameNo ? `Game${m.gameNo}` : ''].filter(Boolean).join(' ') || '日時不明';
  }

  return { QLABEL, KIND_LABEL, normalizeGame, validateGame, str, int, sum, foulsToText, parseFoulsText, rawEventsToText, parseEventsText, timeoutsToText, parseTimeoutsText, emptyRaw, gameTitle };
});
