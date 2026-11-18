/* minibasket/js/analysis.js
   正規化済みの試合データ(core.js の normalizeGame の結果)から、分析値と「気づき」を作る。
   画面にも Node(テスト)にも依存しない純粋な計算。

   できること（スコアシートに書いてあるものだけ）
   ・ピリオド別の得失点、得点の内訳（2点/3点/フリースロー）、選手別得点
   ・フリースロー：成功数（ランニングスコアの●）／機会数（相手のファウルの P1,P2 の数字）→ 成功率
   ・ファウル：選手別、ピリオド別（インクの色＋チームファウル欄から推定）、相手に与えたフリースロー
   ・出場ピリオド、5人の組み合わせ(ラインナップ)ごとの得失点、選手ごとのプラスマイナス（ピリオド単位）
   ・タイムアウト（どのピリオドの何分か）

   できないこと（シートに載っていない）
   ・シュートの試投数・成功率(FG%)、リバウンド、アシスト、ターンオーバー、スティール
   ・同じピリオド内での両チームの得点の「前後関係」（→リードチェンジ・連続得点は出せない）
   ・ピリオドの途中の交代（出場は「ピリオド単位」でしか分からない） */
(function (root, factory) {
  const core = (typeof module === 'object' && module.exports) ? require('./core.js') : root.MB;
  const api = factory(core);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MB = Object.assign(root.MB || {}, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (core) {
  'use strict';
  const { QLABEL, sum } = core;

  const sgn = n => (n > 0 ? '+' + n : String(n));
  const r1 = n => Math.round(n * 10) / 10;
  const pct = (a, b) => (b > 0 ? Math.round((a / b) * 100) : null);
  const byDesc = (f) => (a, b) => f(b) - f(a);

  /** 自チームがどちら側か（チーム名にキーワードを含む方。決められなければ B） */
  function pickMine(g, keyword) {
    if (g.myTeam === 0 || g.myTeam === 1) return g.myTeam;
    const k = (keyword || '').trim();
    if (k) {
      const hit = g.teams.map((t, i) => (t.name.includes(k) ? i : -1)).filter(i => i >= 0);
      if (hit.length === 1) return hit[0];
    }
    return 1;
  }

  // ── 得点の内訳 ──────────────────────────────────────────────
  function scoringOf(t) {
    const r = { FT: { n: 0, pts: 0 }, FG: { n: 0, pts: 0 }, TP: { n: 0, pts: 0 }, total: t.final };
    for (const e of t.events) if (r[e.kind]) { r[e.kind].n++; r[e.kind].pts += e.pts; }
    return r;
  }

  // ── ファウルのピリオド別（推定）────────────────────────────────
  // チームファウル欄は1ピリオド4個までしか数えられない。そこで
  //  ① 欄が3個以下 → その数は正確 ② 赤(1Q・3Q)と黒(2Q・4Q)のインクの色ごとの合計から、足りない分を割り出す
  // 両方のピリオドが4個以上のときは、出場ピリオドで取りうる範囲(lo〜hi)を出す。
  function foulsByQuarter(t) {
    const total = sum(t.players.map(p => p.fouls.length));
    const tally = t.tally.slice(0, 4);
    while (tally.length < 4) tally.push(0);
    const out = tally.map((v, q) => ({ q, tally: v, lo: v, hi: v < 4 ? v : null, exact: v < 4 }));
    const inkOk = total > 0 && t.players.every(p => p.fouls.every(f => f.ink));
    if (!inkOk) return { total, byQ: out, method: 'tally', conflict: false };
    let conflict = false;
    for (const [qa, qb, ink] of [[0, 2, 'red'], [1, 3, 'black']]) {
      const fouls = t.players.flatMap(p => p.fouls.filter(f => f.ink === ink).map(() => p));
      const G = fouls.length;
      const resolved = { [qa]: 0, [qb]: 0 }, amb = { [qa]: 0, [qb]: 0 };
      for (const p of fouls) {
        const cand = [qa, qb].filter(q => p.played[q]);
        if (cand.length === 1) resolved[cand[0]]++;
        else (cand.length ? cand : [qa, qb]).forEach(q => amb[q]++);
      }
      const A = out[qa], B = out[qb];
      if (A.exact && B.exact) { if (A.tally + B.tally !== G) conflict = true; }
      else if (A.exact || B.exact) {
        const [ex, cp] = A.exact ? [A, B] : [B, A];
        cp.lo = G - ex.tally; cp.hi = cp.lo; cp.exact = true;
        if (cp.lo < 4) { conflict = true; cp.lo = cp.hi = Math.max(4, cp.lo); cp.exact = false; }
      } else {
        let loA = Math.max(4, resolved[qa]), loB = Math.max(4, resolved[qb]);
        let hiA = Math.min(G - loB, resolved[qa] + amb[qa]);
        let hiB = Math.min(G - loA, resolved[qb] + amb[qb]);
        loA = Math.max(loA, G - hiB); loB = Math.max(loB, G - hiA);
        A.lo = loA; A.hi = Math.max(loA, hiA); B.lo = loB; B.hi = Math.max(loB, hiB);
        A.exact = A.lo === A.hi; B.exact = B.lo === B.hi;
      }
    }
    return { total, byQ: out, method: 'ink', conflict };
  }

  // ── 選手別 ──────────────────────────────────────────────────
  function playerStats(g, i) {
    const t = g.teams[i], o = g.teams[1 - i];
    const net4 = [0, 1, 2, 3].map(k => t.quarters[k] - o.quarters[k]);
    const cnt4 = [0, 1, 2, 3].map(k => t.players.filter(p => p.played[k]).length);
    const roster = t.players.slice();
    for (const e of t.events) {
      if (!roster.some(p => p.no === e.player)) roster.push({ no: e.player, name: '', marks: ['', '', '', ''], played: [false, false, false, false], partial: [false, false, false, false], fouls: [], synthetic: true });
    }
    return roster.map(p => {
      const ev = t.events.filter(e => e.player === p.no);
      const by = k => sum(ev.filter(e => e.kind === k).map(e => e.pts));
      const ptsByQ = [0, 1, 2, 3].map(q => sum(ev.filter(e => e.q === q).map(e => e.pts)));
      const qCount = p.played.filter(Boolean).length;
      const pm = sum(p.played.map((x, k) => (x ? net4[k] : 0)));
      return {
        no: p.no, name: p.name, marks: p.marks, played: p.played, partial: p.partial, synthetic: !!p.synthetic,
        pts: sum(ev.map(e => e.pts)), fgPts: by('FG'), tpPts: by('TP'), ftPts: by('FT'),
        fgN: ev.filter(e => e.kind === 'FG').length, tpN: ev.filter(e => e.kind === 'TP').length, ftN: ev.filter(e => e.kind === 'FT').length,
        ptsByQ, qCount, pm, pmApprox: p.played.some((x, k) => x && (p.partial[k] || cnt4[k] !== 5)),
        ppq: qCount ? r1(sum(ev.map(e => e.pts)) / qCount) : null,
        fouls: p.fouls, foulCount: p.fouls.length, ftGiven: sum(p.fouls.map(f => f.ft)),
      };
    });
  }

  function lineupsOf(g, i) {
    const t = g.teams[i], o = g.teams[1 - i];
    const out = [];
    for (let k = 0; k < 4; k++) {
      const ps = t.players.filter(p => p.played[k]);
      if (!ps.length) continue;
      out.push({
        q: k, label: QLABEL[k], members: ps.map(p => p.no), pf: t.quarters[k], pa: o.quarters[k], net: t.quarters[k] - o.quarters[k],
        approx: ps.length !== 5 || ps.some(p => p.partial[k]),
      });
    }
    return out;
  }

  // ── 1試合の分析 ──────────────────────────────────────────────
  function analyzeGame(g, my) {
    const op = 1 - my, T = g.teams[my], O = g.teams[op];
    const quarters = [];
    let cm = 0, co = 0;
    for (let k = 0; k < g.nq; k++) {
      cm += T.quarters[k]; co += O.quarters[k];
      quarters.push({ k, label: QLABEL[k], pf: T.quarters[k], pa: O.quarters[k], net: T.quarters[k] - O.quarters[k], cumPf: cm, cumPa: co, cumNet: cm - co });
    }
    const half = (a, b) => ({ pf: sum(T.quarters.slice(a, b)), pa: sum(O.quarters.slice(a, b)) });
    const scoring = { my: scoringOf(T), opp: scoringOf(O) };
    const att = t => sum(t.players.flatMap(p => p.fouls.map(f => f.ft)));
    const ft = {
      my: { made: scoring.my.FT.n, att: att(O) },
      opp: { made: scoring.opp.FT.n, att: att(T) },
    };
    ft.my.pct = pct(ft.my.made, ft.my.att); ft.opp.pct = pct(ft.opp.made, ft.opp.att);
    const players = { my: playerStats(g, my), opp: playerStats(g, op) };
    const lineups = { my: lineupsOf(g, my), opp: lineupsOf(g, op) };
    const fouls = { my: foulsByQuarter(T), opp: foulsByQuarter(O) };
    const timeouts = {
      my: T.timeouts.map(x => ({ ...x, label: x.quarter != null ? QLABEL[x.quarter] : '?', net: x.quarter != null && x.quarter < g.nq ? quarters[x.quarter].net : null })),
      opp: O.timeouts.map(x => ({ ...x, label: x.quarter != null ? QLABEL[x.quarter] : '?', net: x.quarter != null && x.quarter < g.nq ? -quarters[x.quarter].net : null })),
    };
    const used = players.my.filter(p => p.qCount > 0);
    const participation = {
      roster: T.players.length, used: used.length,
      dnp: players.my.filter(p => p.qCount === 0 && !p.synthetic).map(p => p.no),
      four: used.filter(p => p.qCount === 4).map(p => p.no),
      counts: [0, 1, 2, 3].map(k => T.players.filter(p => p.played[k]).length),
    };
    const diff = T.final - O.final;
    const r = {
      game: g, my, opp: op, myName: T.name, oppName: O.name,
      meta: g.meta,
      result: { pf: T.final, pa: O.final, diff, outcome: diff > 0 ? 'W' : diff < 0 ? 'L' : 'D' },
      quarters, halves: { first: half(0, 2), second: half(2, 4) },
      scoring, ft, players, lineups, fouls, timeouts, participation,
      checks: core.validateGame(g),
    };
    r.insights = insightsForGame(r);
    return r;
  }

  // ── 複数試合（自チームの通算）─────────────────────────────────
  function analyzeMany(games, opts) {
    opts = opts || {};
    const reports = games.map(g => analyzeGame(g, pickMine(g, opts.myKeyword)));
    const n = reports.length;
    const A = { n, reports };
    A.record = { w: 0, l: 0, d: 0 };
    reports.forEach(r => { A.record[r.result.outcome === 'W' ? 'w' : r.result.outcome === 'L' ? 'l' : 'd']++; });
    A.pf = sum(reports.map(r => r.result.pf)); A.pa = sum(reports.map(r => r.result.pa)); A.diff = A.pf - A.pa;
    A.avgPf = n ? r1(A.pf / n) : 0; A.avgPa = n ? r1(A.pa / n) : 0;
    A.quarters = [0, 1, 2, 3].map(k => {
      const nets = reports.map(r => r.quarters[k].net);
      const pf = sum(reports.map(r => r.quarters[k].pf)), pa = sum(reports.map(r => r.quarters[k].pa));
      return { k, label: QLABEL[k], pf, pa, net: pf - pa, avgPf: n ? r1(pf / n) : 0, avgPa: n ? r1(pa / n) : 0, avgNet: n ? r1((pf - pa) / n) : 0, nets };
    });
    const addScoring = side => {
      const s = { FT: { n: 0, pts: 0 }, FG: { n: 0, pts: 0 }, TP: { n: 0, pts: 0 } };
      reports.forEach(r => ['FT', 'FG', 'TP'].forEach(k => { s[k].n += r.scoring[side][k].n; s[k].pts += r.scoring[side][k].pts; }));
      return s;
    };
    A.scoring = { my: addScoring('my'), opp: addScoring('opp') };
    A.ft = {
      my: { made: sum(reports.map(r => r.ft.my.made)), att: sum(reports.map(r => r.ft.my.att)) },
      opp: { made: sum(reports.map(r => r.ft.opp.made)), att: sum(reports.map(r => r.ft.opp.att)) },
    };
    A.ft.my.pct = pct(A.ft.my.made, A.ft.my.att); A.ft.opp.pct = pct(A.ft.opp.made, A.ft.opp.att);
    A.fouls = {
      my: { total: sum(reports.map(r => r.fouls.my.total)), perGame: reports.map(r => r.fouls.my.total) },
      opp: { total: sum(reports.map(r => r.fouls.opp.total)), perGame: reports.map(r => r.fouls.opp.total) },
    };
    // 選手ごとの通算（背番号で束ねる）
    const map = new Map();
    reports.forEach((r, gi) => {
      r.players.my.forEach(p => {
        let a = map.get(p.no);
        if (!a) map.set(p.no, a = { no: p.no, name: '', onRoster: 0, games: 0, qCount: 0, pts: 0, fgPts: 0, tpPts: 0, ftPts: 0, fgN: 0, tpN: 0, ftN: 0, fouls: 0, ftGiven: 0, pm: 0, pmApprox: false, foul4: 0, foulOut: 0, qHist: [0, 0, 0, 0], ptsByQ: [0, 0, 0, 0], perGame: [] });
        if (p.name) a.name = p.name;
        a.onRoster++;
        if (p.qCount > 0) a.games++;
        a.qCount += p.qCount; a.pts += p.pts; a.fgPts += p.fgPts; a.tpPts += p.tpPts; a.ftPts += p.ftPts;
        a.fgN += p.fgN; a.tpN += p.tpN; a.ftN += p.ftN; a.fouls += p.foulCount; a.ftGiven += p.ftGiven; a.pm += p.pm; a.pmApprox = a.pmApprox || p.pmApprox;
        if (p.foulCount >= 4) a.foul4++;
        if (p.foulCount >= 5) a.foulOut++;
        p.played.forEach((x, k) => { if (x) a.qHist[k]++; });
        p.ptsByQ.forEach((v, k) => { a.ptsByQ[k] += v; });
        a.perGame[gi] = { pts: p.pts, q: p.qCount, fouls: p.foulCount, pm: p.pm };
      });
    });
    A.players = [...map.values()].map(a => ({ ...a, ppq: a.qCount ? r1(a.pts / a.qCount) : null }))
      .sort((a, b) => b.pts - a.pts || b.qCount - a.qCount || Number(a.no) - Number(b.no));
    // ラインナップ（5人の組み合わせ）：試合をまたいで同じ組み合わせを束ねる
    const lm = new Map();
    reports.forEach((r, gi) => r.lineups.my.forEach(l => {
      const key = l.members.slice().sort((a, b) => Number(a) - Number(b)).join('-');
      let a = lm.get(key);
      if (!a) lm.set(key, a = { key, members: l.members.slice().sort((a, b) => Number(a) - Number(b)), n: 0, pf: 0, pa: 0, approx: false, where: [] });
      a.n++; a.pf += l.pf; a.pa += l.pa; a.approx = a.approx || l.approx; a.where.push({ game: gi, q: l.q });
    }));
    A.lineups = [...lm.values()].map(a => ({ ...a, net: a.pf - a.pa })).sort((a, b) => b.net - a.net);
    // 出場なし
    A.neverPlayed = A.players.filter(p => p.qCount === 0).map(p => p.no);
    A.insights = insightsForMany(A);
    return A;
  }

  // ── 「気づき」の文章 ──────────────────────────────────────────
  const hashNo = ns => ns.map(n => '#' + n).join(' ');
  // ファウル数の表示：確定なら「9」、幅があれば「5〜7」、上限不明なら「4以上」
  const rangeText = x => (x.exact ? String(x.lo) : x.hi == null ? `${x.lo}以上` : `${x.lo}〜${x.hi}`);

  function insightsForGame(r) {
    const L = [], o = r.result;
    const add = (tag, text) => L.push({ tag, text });
    add('result', `${r.myName} ${o.pf} − ${o.pa} ${r.oppName}（${o.outcome === 'W' ? '勝ち' : o.outcome === 'L' ? '負け' : '引き分け'}、${sgn(o.diff)}）。`);
    const qs = r.quarters.slice(0, 4);
    const best = qs.reduce((a, b) => (b.net > a.net ? b : a)), worst = qs.reduce((a, b) => (b.net < a.net ? b : a));
    add('flow', `ピリオド別の得失点差は ${qs.map(q => `${q.label} ${sgn(q.net)}`).join('、')}。最も差を広げたのは${best.label}、最も詰められたのは${worst.label}${worst.net < 0 ? '（このピリオドは負け）' : ''}。`);
    const sc = r.players.my.filter(p => p.pts > 0).sort(byDesc(p => p.pts));
    if (sc.length) {
      const top = sc[0], top2 = sc.slice(0, 2);
      add('scoring', `得点者は${sc.length}人。最多は #${top.no}（${top.pts}点、チームの${pct(top.pts, o.pf)}%）。上位2人で${pct(sum(top2.map(p => p.pts)), o.pf)}%。`);
    }
    const tp = r.players.my.filter(p => p.tpN > 0);
    if (tp.length) add('scoring', `3点シュート：${tp.map(p => `#${p.no}が${p.tpN}本`).join('、')}。`);
    const ft = r.ft;
    if (ft.my.att > 0 || ft.opp.att > 0) {
      add('ft', `フリースローは、機会${ft.my.att}本のうち${ft.my.made}本成功${ft.my.pct != null ? `（${ft.my.pct}%）` : ''}。相手は${ft.opp.att}本のうち${ft.opp.made}本${ft.opp.pct != null ? `（${ft.opp.pct}%）` : ''}。`
        + `（機会は、相手ファウルの P1・P2 の数字の合計です）`);
    }
    const fm = r.fouls.my, fo = r.fouls.opp;
    add('foul', `ファウルは自チーム${fm.total}個、相手${fo.total}個。相手に与えたフリースロー機会は${ft.opp.att}本で、相手はそのうち${ft.opp.made}本（${ft.opp.made}点）を決めました（相手の得点の${pct(ft.opp.made, o.pa) ?? 0}%）。`);
    const heavy = fm.byQ.filter(x => (x.hi ?? x.lo) >= 6 || x.lo >= 6).sort((a, b) => b.lo - a.lo)[0];
    if (heavy) add('foul', `ファウルが多かったのは${QLABEL[heavy.q]}（${rangeText(heavy)}個${fm.method === 'ink' ? '・インクの色から推定' : ''}）。このピリオドの得失点差は${sgn(r.quarters[heavy.q].net)}でした。`);
    const f4 = r.players.my.filter(p => p.foulCount >= 4);
    if (f4.length) add('foul', `4ファウル以上：${f4.map(p => `#${p.no}（${p.foulCount}）`).join('、')}。`);
    if (worst.net <= 0) {
      const lu = r.lineups.my.find(l => l.q === worst.k);
      if (lu) add('lineup', `${worst.label}（${sgn(worst.net)}）の出場：${hashNo(lu.members)}${lu.approx ? '（交代の印があり参考）' : ''}。`);
    }
    const pa = r.participation;
    add('participation', `出場した選手は${pa.used}人（登録${pa.roster}人）。${pa.dnp.length ? `出場の印がないのは ${hashNo(pa.dnp)}（欠席・ケガ等かは記録から分かりません）。` : ''}`);
    return L;
  }

  function insightsForMany(A) {
    const L = [];
    const add = (tag, text) => L.push({ tag, text });
    const n = A.n;
    if (!n) return L;
    add('result', `${n}試合で ${A.record.w}勝${A.record.l}敗${A.record.d ? `${A.record.d}分` : ''}。得点${A.pf}・失点${A.pa}（${sgn(A.diff)}）、平均 ${A.avgPf} − ${A.avgPa}。`);
    // ピリオド別
    const qs = A.quarters;
    const min = qs.reduce((a, b) => (b.avgNet < a.avgNet ? b : a)), max = qs.reduce((a, b) => (b.avgNet > a.avgNet ? b : a));
    add('flow', `ピリオド別の平均得失点差：${qs.map(q => `${q.label} ${sgn(q.avgNet)}`).join('、')}。最も差が出るのは${max.label}、最も縮むのは${min.label}。`);
    const lowCount = qs.map(q => q.nets.filter(v => v <= 0).length);
    if (lowCount[min.k] > 0) add('flow', `${min.label}は${n}試合中${lowCount[min.k]}試合で相手に上回られるか同点でした（${min.nets.map(sgn).join('、')}）。`);
    // 弱いピリオドの顔ぶれ
    if (n >= 2) {
      const c = {};
      A.reports.forEach(r => r.lineups.my.filter(l => l.q === min.k).forEach(l => l.members.forEach(m => { c[m] = (c[m] || 0) + 1; })));
      const list = Object.entries(c).sort((a, b) => b[1] - a[1] || Number(a[0]) - Number(b[0])).map(([m, k]) => `#${m}(${k})`).join(' ');
      add('lineup', `${min.label}に出た選手（延べ回数）：${list}。ほかのピリオドと顔ぶれが違うことが、差の縮み方に関係しているかを見る材料になります。`);
    }
    // 得点
    const sc = A.players.filter(p => p.pts > 0);
    if (sc.length) {
      const top = sc[0], top2 = sc.slice(0, 2);
      add('scoring', `得点者は延べ${sc.length}人。最多は #${top.no}（${top.pts}点、チームの${pct(top.pts, A.pf)}%、${top.qCount}ピリオドで1ピリオドあたり${top.ppq}点）。上位2人で${pct(sum(top2.map(p => p.pts)), A.pf)}%。`);
    }
    const tp = A.players.filter(p => p.tpN > 0);
    if (tp.length) add('scoring', `3点シュート：${sum(tp.map(p => p.tpN))}本（${tp.map(p => `#${p.no}×${p.tpN}`).join('、')}）。`);
    // FT
    add('ft', `フリースローは、機会${A.ft.my.att}本のうち${A.ft.my.made}本成功（${A.ft.my.pct ?? '-'}%）。相手は${A.ft.opp.att}本のうち${A.ft.opp.made}本（${A.ft.opp.pct ?? '-'}%）。決まらなかったのは自チーム${A.ft.my.att - A.ft.my.made}本です。`);
    // ファウル
    add('foul', `ファウルは自チーム合計${A.fouls.my.total}個（1試合平均${r1(A.fouls.my.total / n)}）、相手${A.fouls.opp.total}個（${r1(A.fouls.opp.total / n)}）。相手のフリースロー得点は${A.ft.opp.made}点で、失点の${pct(A.ft.opp.made, A.pa)}%でした。`);
    const f4 = A.players.filter(p => p.foul4 > 0);
    if (f4.length) add('foul', `1試合で4ファウルに達した選手：${f4.map(p => `#${p.no}（${p.foul4}回）`).join('、')}。5ファウル退場は${sum(A.players.map(p => p.foulOut))}回。`);
    const heavy = A.reports.map((r, gi) => ({ gi, h: r.fouls.my.byQ.slice().sort((a, b) => b.lo - a.lo)[0], r })).filter(x => x.h.lo >= 6);
    heavy.forEach(x => add('foul', `${x.r.oppName}戦：${QLABEL[x.h.q]}に${rangeText(x.h)}個のファウル（このピリオドの得失点差${sgn(x.r.quarters[x.h.q].net)}）。`));
    // 出場
    const used = A.players.filter(p => p.qCount > 0);
    const core4 = used.filter(p => p.qCount >= n * 3);
    add('participation', `出場した選手は${used.length}人（登録${A.players.length}人）。${A.neverPlayed.length ? `${n}試合とも出場の印がないのは ${hashNo(A.neverPlayed)}（欠席・ケガ等かは記録から分かりません）。` : '全員が1回以上出場しています。'}`);
    if (core4.length) add('participation', `ほぼ毎試合3ピリオド出ている選手：${hashNo(core4.map(p => p.no))}。`);
    // 注意
    add('note', `${n}試合分の記録なので、傾向というより「目安」として見てください。`);
    return L;
  }

  return { pickMine, analyzeGame, analyzeMany, foulsByQuarter, scoringOf, playerStats, lineupsOf, insightsForGame, insightsForMany, sgn, pct };
});
