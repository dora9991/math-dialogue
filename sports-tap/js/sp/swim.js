/* スポーツ タップ記録 — 水泳（画面を持たない部分）
   部活の記録会・練習で、ストップウォッチの代わりに使う。レーンごとの大きな「タッチ」ボタンを、壁にさわった瞬間に押す。
   時刻は 0.01 秒まで（game.prec = 100）。人がタップするので、本当のタッチから 0.1〜0.2 秒くらいずれることがある。

   ■ 水泳の記録（core.js の形に足すもの。どれもチーム・背番号は使わない：noTeam）
     'heat'  ：組（練習はセット）の始まり＝スタートの合図 { heat: 組の番号, lanes: [{ lane, name, team }], mode, stroke, dist, pool, reps, cycle, gap }
               組ごとに、種目・距離・名前を持つ（1回の記録会で、ちがう種目の組を続けて計れる）
     'touch' ：レーンのタッチ { lane }（壁にさわった瞬間。最後のタッチがゴール）
               どの組のタッチかは「その時刻より前の、いちばん新しい 'heat'」で決める（時刻を直せば、自動で正しくなる）
     'dq'・'dnf'・'dns'：失格・棄権（途中でやめた）・欠場 { lane, heat }（判定はあとから出ることがあるので、組の番号を持つ）
   ■ タイム
     レース：スプリット＝タッチの時刻 − その組のスタート。ラップ＝となりのスプリットの差。タッチの回数＝距離 ÷ プールの長さ
     練習（サークル）：本ごとのスタート＝セットのスタート ＋（本 − 1）× サークル ＋（泳ぐ順 − 1）× スタートの間隔。
       タッチ（ゴール）は、その時刻にいちばん新しく始まった本のもの（同じ本に2回あれば、あとのほう）
   ■ まだ始めていない次の組：game.pending = { heat, lanes, spec }（「次の組へ」で作り、「▶ スタート」で 'heat' になる） */
(function (root) {
  'use strict';
  const ST = root.ST;

  const STROKES = [['fr', '自由形'], ['ba', '背泳ぎ'], ['br', '平泳ぎ'], ['fly', 'バタフライ'], ['im', '個人メドレー'], ['relay', 'リレー']];
  const STROKE = {};
  STROKES.forEach(([k, v]) => { STROKE[k] = v; });
  const DISTS = [25, 50, 100, 200, 400, 800, 1500];
  const CYCLES = [30, 40, 45, 50, 60, 70, 75, 80, 90, 100, 105, 120, 150, 180, 240, 300];
  const MAXLANES = 10;
  const SPEC_KEYS = ['mode', 'stroke', 'dist', 'pool', 'reps', 'cycle', 'gap'];
  const r2 = (x) => Math.round(x * 100) / 100;

  const cycleText = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  /* 組の種目の呼び名：「自由形 50m」「練習 50m×8（1:00）」 */
  function specText(spec, short) {
    if (!spec) return '';
    if (spec.mode === 'circle') return `${short ? '' : '練習 '}${spec.dist}m×${spec.reps}（${cycleText(spec.cycle)}${spec.gap ? '・' + spec.gap + '秒おき' : ''}）`;
    return `${STROKE[spec.stroke] || ''} ${spec.dist}m`;
  }
  /* タッチの回数（距離 ÷ プールの長さ。25m をプール 50m で泳ぐときは1回） */
  const touchesOf = (spec) => Math.max(1, Math.round((spec.dist || 50) / (spec.pool || 25)));
  const specOf = (o) => { const s = {}; SPEC_KEYS.forEach((k) => { s[k] = o[k]; }); return s; };
  const unitOf = (spec) => (spec && spec.mode === 'circle' ? 'セット' : '組');

  /* レーン（名前・学校）をそろえる。n 本にそろえる（足りなければ空のレーン） */
  function cleanLanes(list, n) {
    const out = [];
    const src = Array.isArray(list) ? list : [];
    const count = n != null ? ST.clamp(Math.round(n) || 1, 1, MAXLANES) : ST.clamp(src.length || 1, 1, MAXLANES);
    for (let i = 0; i < count; i++) {
      const x = src[i] || {};
      out.push({ lane: i + 1, name: String(x.name || '').trim().slice(0, 16), team: String(x.team || '').trim().slice(0, 16) });
    }
    return out;
  }

  /* ---------- 組（記録から計算する） ---------- */
  /* 組の並び：[{ e, heat, start, end（次の組の始まり。なければ Infinity）, spec, lanes }]（始まった順） */
  function heats(game) {
    const list = ST.sorted(game).filter((e) => e.type === 'heat').map((e) => ({ e, id: e.id, heat: e.heat, start: e.t, spec: specOf(e), lanes: cleanLanes(e.lanes) }));
    list.forEach((x, i) => { x.end = i + 1 < list.length ? list[i + 1].start : Infinity; });
    return list;
  }
  function heatAt(game, t) {
    const hs = heats(game);
    let cur = null;
    hs.forEach((x) => { if (x.start <= t + 1e-9) cur = x; });
    return cur;
  }
  const heatByNo = (game, n) => heats(game).find((x) => x.heat === n) || null;
  const lastHeatNo = (game) => heats(game).reduce((m, x) => Math.max(m, x.heat), 0);
  /* 次の組の準備ができていて、まだスタートしていない */
  const waiting = (game) => !!(game.pending && game.pending.heat > lastHeatNo(game));

  /* 組の中のタッチ：レーン → [タッチの記録]（時刻の順） */
  function touchesIn(game, H) {
    const m = new Map();
    ST.sorted(game).forEach((e) => {
      if (e.type !== 'touch' || e.t < H.start - 1e-9 || e.t >= H.end - 1e-9) return;
      if (!m.has(e.lane)) m.set(e.lane, []);
      m.get(e.lane).push(e);
    });
    return m;
  }
  /* 組の中の失格・棄権・欠場：レーン → 記録（あとのものが勝つ） */
  function flagsIn(game, H) {
    const m = new Map();
    ST.sorted(game).forEach((e) => { if ((e.type === 'dq' || e.type === 'dnf' || e.type === 'dns') && e.heat === H.heat) m.set(e.lane, e); });
    return m;
  }

  /* レースの結果：[{ lane, name, team, touches, need, splits, laps, done, time, flag, rank }]（レーンの順） */
  function raceResults(game, H) {
    const need = touchesOf(H.spec);
    const tm = touchesIn(game, H), fl = flagsIn(game, H);
    const lanes = H.lanes.slice();
    tm.forEach((_, ln) => { if (!lanes.some((x) => x.lane === ln)) lanes.push({ lane: ln, name: '', team: '' }); });
    lanes.sort((a, b) => a.lane - b.lane);
    const rows = lanes.map((L) => {
      const ts = (tm.get(L.lane) || []).slice(0, need);
      const splits = ts.map((e) => r2(e.t - H.start));
      const laps = splits.map((s, i) => r2(i ? s - splits[i - 1] : s));
      const done = splits.length >= need;
      const f = fl.get(L.lane);
      return { lane: L.lane, name: L.name, team: L.team, touches: ts, need, splits, laps, done, time: done ? splits[need - 1] : null, flag: f ? f.type : null, flagId: f ? f.id : null, rank: null };
    });
    const ranked = rows.filter((x) => x.done && !x.flag).sort((a, b) => a.time - b.time);
    ranked.forEach((x, i) => { x.rank = i && Math.abs(x.time - ranked[i - 1].time) < 0.005 ? ranked[i - 1].rank : i + 1; });
    return rows;
  }
  /* 練習（サークル）の結果：[{ lane, name, team, reps: [{ r, start, time }], done（何本泳いだか）, avg, best, flag }] */
  function repStart(H, idx, r) { return r2(H.start + r * H.spec.cycle + idx * (H.spec.gap || 0)); }
  function circleResults(game, H) {
    const tm = touchesIn(game, H), fl = flagsIn(game, H);
    const R = H.spec.reps || 1;
    return H.lanes.map((L, idx) => {
      const reps = Array.from({ length: R }, (_, r) => ({ r: r + 1, start: repStart(H, idx, r), time: null, id: null }));
      (tm.get(L.lane) || []).forEach((e) => {
        let r = Math.floor((e.t - H.start - idx * (H.spec.gap || 0) + 1e-9) / H.spec.cycle);
        if (r < 0) return;                               // 自分のスタートより前（押しまちがい）
        r = Math.min(r, R - 1);
        reps[r].time = r2(e.t - reps[r].start);
        reps[r].id = e.id;
      });
      const times = reps.filter((x) => x.time != null).map((x) => x.time);
      const f = fl.get(L.lane);
      return { lane: L.lane, name: L.name, team: L.team, reps, done: times.length, avg: times.length ? r2(times.reduce((a, b) => a + b, 0) / times.length) : null, best: times.length ? Math.min(...times) : null, flag: f ? f.type : null, flagId: f ? f.id : null };
    });
  }
  const results = (game, H) => (H.spec.mode === 'circle' ? circleResults(game, H) : raceResults(game, H));
  /* その組は、全員が終わったか（レース：ゴール・失格など／練習：最後の本が始まってからサークル1つぶん過ぎた か 全部の本を泳いだ） */
  function heatDone(game, H, t) {
    const rs = results(game, H);
    if (!rs.length) return false;
    if (H.spec.mode === 'circle') return rs.every((x) => x.flag || x.done >= H.spec.reps || (t != null && t >= x.reps[x.reps.length - 1].start + H.spec.cycle));
    return rs.every((x) => x.flag || x.done || (!x.name && !x.touches.length && rs.some((y) => y.name)));
  }
  /* 名前のないレーン（だれも泳いでいない）は、名前のあるレーンがあれば、結果から外す */
  function activeRows(rs) {
    const named = rs.some((x) => x.name);
    return rs.filter((x) => !named || x.name || (x.touches && x.touches.length) || (x.reps && x.done) || x.flag);
  }
  /* 練習で、いまの本：{ r（1〜）, start, next（次の本のスタート）, swimming（泳いでいる）} */
  function circleNow(H, idx, t, row) {
    const R = H.spec.reps || 1;
    const rel = t - H.start - idx * (H.spec.gap || 0);
    if (rel < 0) return { r: 1, start: repStart(H, idx, 0), before: true };
    const r = Math.min(Math.floor(rel / H.spec.cycle), R - 1);
    const done = row && row.reps[r] && row.reps[r].time != null;
    const end = r >= R - 1 && done;
    return { r: r + 1, start: repStart(H, idx, r), next: r + 1 < R ? repStart(H, idx, r + 1) : null, swimming: !done, finished: end };
  }

  /* 種目と距離ごとの総合順位（レースの組をまとめる）：[{ key, label, rows: [{ heat, lane, name, team, time, rank }] }] */
  function overall(game) {
    const groups = new Map();
    heats(game).forEach((H) => {
      if (H.spec.mode === 'circle') return;
      const key = `${H.spec.stroke}:${H.spec.dist}:${H.spec.pool}`;
      if (!groups.has(key)) groups.set(key, { key, label: specText(H.spec) + (H.spec.pool === 50 ? '（長水路）' : ''), rows: [], heats: 0 });
      const gr = groups.get(key);
      gr.heats++;
      raceResults(game, H).forEach((x) => { if (x.done && !x.flag) gr.rows.push({ heat: H.heat, lane: x.lane, name: x.name, team: x.team, time: x.time }); });
    });
    const out = Array.from(groups.values());
    out.forEach((gr) => {
      gr.rows.sort((a, b) => a.time - b.time);
      gr.rows.forEach((x, i) => { x.rank = i && Math.abs(x.time - gr.rows[i - 1].time) < 0.005 ? gr.rows[i - 1].rank : i + 1; });
    });
    return out;
  }

  /* ---------- 名前・時刻 ---------- */
  const laneName = (H, ln) => { const L = H && H.lanes.find((x) => x.lane === ln); return L ? L.name : ''; };
  const FLAG = { dq: '失格（DQ）', dnf: '棄権（DNF）', dns: '欠場（DNS）' };
  const FLAG_SHORT = { dq: 'DQ', dnf: 'DNF', dns: 'DNS' };
  /* タッチの中身：{ H, idx（何回目・何本目）, need, split, lap, goal, rank } */
  function touchInfo(game, e) {
    const H = heatAt(game, e.t);
    if (!H) return null;
    if (H.spec.mode === 'circle') {
      const idx = H.lanes.findIndex((x) => x.lane === e.lane);
      const row = circleResults(game, H)[idx];
      const rep = row ? row.reps.find((x) => x.id === e.id) : null;
      return { H, circle: true, rep: rep ? rep.r : null, time: rep ? rep.time : null, extra: !rep };
    }
    const rs = raceResults(game, H);
    const row = rs.find((x) => x.lane === e.lane);
    const i = row ? row.touches.findIndex((x) => x.id === e.id) : -1;
    if (i < 0) return { H, extra: true, split: r2(e.t - H.start) };
    return { H, idx: i + 1, need: row.need, split: row.splits[i], lap: row.laps[i], goal: i + 1 === row.need, rank: i + 1 === row.need ? row.rank : null, flag: row.flag };
  }
  function eventText(game, e) {
    if (e.type === 'heat') return `${e.heat}${unitOf(e)}目 スタート（${specText(specOf(e))}）`;
    const H = e.type === 'touch' ? heatAt(game, e.t) : heatByNo(game, e.heat);
    const who = `${H ? H.heat + unitOf(H.spec) + ' ' : ''}L${e.lane}${laneName(H, e.lane) ? ' ' + laneName(H, e.lane) : ''}`;
    if (FLAG[e.type]) return `${who} ${FLAG[e.type]}`;
    const info = touchInfo(game, e);
    return `${who} ${touchText(info)}`;
  }
  function touchText(info) {
    if (!info) return 'タッチ';
    if (info.circle) return info.rep ? `${info.rep}本目 ${ST.fmtRace(info.time)}` : 'タッチ（本の前）';
    if (info.extra) return `タッチ（多い） ${ST.fmtRace(info.split)}`;
    if (info.goal) return `ゴール ${ST.fmtRace(info.split)}${info.rank ? `（${info.rank}位）` : ''}`;
    return `${info.idx}/${info.need} ${ST.fmtRace(info.split)}（ラップ ${ST.fmtRace(info.lap)}）`;
  }

  /* ---------- CSV ---------- */
  function csvEvents(game) {
    const rows = [['No', '時刻（スタートから）', 'スタートからの秒', '組', '種目', 'レーン', '名前', '学校・チーム', '記録', '何回目・何本目', 'スプリット・タイム', 'ラップ']];
    let n = 0;
    ST.sorted(game).forEach((e) => {
      if (e.type === 'heat') { rows.push(['', ST.fmtTime(e.t, 2), e.t, `${e.heat}${unitOf(e)}目`, specText(specOf(e)), '', '', '', 'スタート', '', '', '']); return; }
      const H = e.type === 'touch' ? heatAt(game, e.t) : heatByNo(game, e.heat);
      const L = H ? H.lanes.find((x) => x.lane === e.lane) || {} : {};
      const base = [++n, ST.fmtTime(e.t, 2), e.t, H ? `${H.heat}${unitOf(H.spec)}目` : '', H ? specText(H.spec) : '', e.lane, L.name || '', L.team || ''];
      if (FLAG[e.type]) { rows.push(base.concat([FLAG[e.type], '', '', ''])); return; }
      const info = touchInfo(game, e);
      if (!info) { rows.push(base.concat(['タッチ', '', '', ''])); return; }
      if (info.circle) rows.push(base.concat(['ゴール', info.rep ? `${info.rep}本目` : '', info.time != null ? ST.fmtRace(info.time) : '', '']));
      else if (info.extra) rows.push(base.concat(['タッチ（多い）', '', ST.fmtRace(info.split), '']));
      else rows.push(base.concat([info.goal ? 'ゴール' : 'タッチ', `${info.idx}/${info.need}`, ST.fmtRace(info.split), ST.fmtRace(info.lap)]));
    });
    return rows;
  }
  /* 結果（1人1行）：レースは順位・タイム・スプリット、練習は本ごとのタイム */
  function csvBox(game) {
    const hs = heats(game);
    const race = hs.filter((H) => H.spec.mode !== 'circle'), circ = hs.filter((H) => H.spec.mode === 'circle');
    const rows = [];
    if (race.length) {
      const maxN = Math.max(...race.map((H) => touchesOf(H.spec)));
      const pools = new Set(race.map((H) => H.spec.pool));
      const pool = pools.size === 1 ? race[0].spec.pool : 0;
      const sh = Array.from({ length: maxN }, (_, i) => (pool ? `${(i + 1) * pool}m` : `タッチ${i + 1}`));
      rows.push(['組', '種目', 'プール', 'レーン', '名前', '学校・チーム', '組の順位', 'タイム', '状態'].concat(sh, maxN > 1 ? sh.map((x) => 'ラップ ' + x) : []));
      race.forEach((H) => activeRows(raceResults(game, H)).forEach((x) => {
        const sp = Array.from({ length: maxN }, (_, i) => (x.splits[i] != null ? ST.fmtRace(x.splits[i]) : ''));
        const lp = Array.from({ length: maxN }, (_, i) => (x.laps[i] != null ? ST.fmtRace(x.laps[i]) : ''));
        rows.push([`${H.heat}組目`, specText(H.spec), `${H.spec.pool}m`, x.lane, x.name, x.team, x.rank || '', x.time != null && !x.flag ? ST.fmtRace(x.time) : '', x.flag ? FLAG[x.flag] : x.done ? '' : '途中'].concat(sp, maxN > 1 ? lp : []));
      }));
    }
    if (circ.length) {
      if (rows.length) rows.push([]);
      const maxR = Math.max(...circ.map((H) => H.spec.reps || 1));
      rows.push(['セット', '練習', '泳ぐ順', '名前', '学校・チーム', '泳いだ本数', '平均', 'ベスト', '状態'].concat(Array.from({ length: maxR }, (_, i) => `${i + 1}本目`)));
      circ.forEach((H) => circleResults(game, H).forEach((x) => {
        rows.push([`${H.heat}セット目`, specText(H.spec), x.lane, x.name, x.team, x.done, x.avg != null ? ST.fmtRace(x.avg) : '', x.best != null ? ST.fmtRace(x.best) : '', x.flag ? FLAG[x.flag] : ''].concat(Array.from({ length: maxR }, (_, i) => (x.reps[i] && x.reps[i].time != null ? ST.fmtRace(x.reps[i].time) : ''))));
      }));
    }
    if (!rows.length) rows.push(['まだ記録はありません']);
    return rows;
  }

  /* ---------- 種目の定義 ---------- */
  const sp = {
    id: 'swim', name: '水泳', icon: '🏊', family: 'swim', prec: 100, hasTeams: false, noSavedTeams: true, keepFirst: true,
    desc: 'レーンごとに、壁にタッチした瞬間をタップ。0.01秒のタイム・スプリット・ラップ・順位。組を続けて計れる・練習（サークル）も',
    unit: '計測', endTitle: '計測終了', statsSub: '組ごとの順位・タイム・スプリット', setupTitle: '計測の準備', setupEditTitle: '種目・名前を直す', setupEditSub: '距離・プール・レーンの名前',
    optsTitle: '種目・距離', titleHint: '例：記録会・夏の大会・朝練', noTeamText: ' ', typeWord: '記録',
    startHint: 'スタートの合図（ピッ）の瞬間',
    optsEditNote: 'ここで変えると、いまの組の種目・距離・レーンの数も変わります（次の組からは「次の組へ」で決められます）。',
    defaultPrefs: () => ({ lanes: [], order: 'asc', side: 'right' }),
    TYPES: [
      { id: 'heat', label: '組のスタート', meta: true, noTeam: true, kind: 'meta' },
      { id: 'touch', label: 'タッチ', noTeam: true, kind: 'made' },
      { id: 'dq', label: '失格（DQ）', noTeam: true, kind: 'bad' },
      { id: 'dnf', label: '棄権（DNF）', noTeam: true, kind: 'bad' },
      { id: 'dns', label: '欠場（DNS）', noTeam: true, kind: 'bad' }
    ],
    defaultOpts: () => ({ mode: 'race', stroke: 'fr', dist: 50, pool: 25, lanes: 6, reps: 8, cycle: 60, gap: 5 }),
    optFields: [
      { key: 'mode', label: '計るもの', choices: [['race', 'レース（記録会・大会）'], ['circle', '練習（サークル）']] },
      { key: 'stroke', label: '泳ぎ方', choices: STROKES, hidden: (o) => o.mode === 'circle' },
      { key: 'dist', label: '距離（練習は1本の距離）', choices: DISTS.map((d) => [d, d + 'm']) },
      { key: 'pool', label: 'プール', choices: [[25, '25m（短水路）'], [50, '50m（長水路）']], note: 'タッチの回数＝距離 ÷ プールの長さ（50m を 25m プールで泳ぐなら2回：25m のスプリットと、ゴール）' },
      { key: 'lanes', label: 'レーンの数（練習は人数）', choices: Array.from({ length: MAXLANES }, (_, i) => [i + 1, String(i + 1)]) },
      { key: 'reps', label: '本数', choices: [2, 3, 4, 5, 6, 8, 10, 12, 15, 16, 20].map((n) => [n, n + '本']), hidden: (o) => o.mode !== 'circle' },
      { key: 'cycle', label: 'サークル（1本ごとのスタートの間隔）', choices: CYCLES.map((s) => [s, cycleText(s)]), hidden: (o) => o.mode !== 'circle' },
      { key: 'gap', label: '人ごとのスタートのずれ（同じレーンで、何秒おきに出るか）', choices: [[0, 'いっしょ'], [5, '5秒おき'], [10, '10秒おき'], [15, '15秒おき'], [20, '20秒おき']], hidden: (o) => o.mode !== 'circle' }
    ],
    STROKES, DISTS, CYCLES, MAXLANES, SPEC_KEYS,
    specText, specOf, touchesOf, unitOf, cycleText, cleanLanes, heats, heatAt, heatByNo, lastHeatNo, waiting,
    touchesIn, flagsIn, raceResults, circleResults, results, heatDone, activeRows, circleNow, overall, touchInfo, touchText, laneName, FLAG, FLAG_SHORT, repStart,
    score: () => [0, 0],
    sideNames: (game) => [specText(game.opts), ''],
    scoreText(game) {
      const hs = heats(game);
      const kinds = Array.from(new Set(hs.map((H) => specText(H.spec))));
      const swimmers = hs.reduce((m, H) => m + activeRows(results(game, H)).length, 0);
      const head = kinds.length ? kinds.slice(0, 2).join('・') + (kinds.length > 2 ? ' ほか' : '') : specText(game.opts);
      return hs.length ? `${head}・${hs.length}${unitOf(hs[0].spec)}・${swimmers}人` : head;
    },
    lineText: (g) => g.scoreText || '',
    fileWho: (game) => ST.safeName(specText(game.opts).replace(/\s/g, '')),
    initDraft(draft, pr) { draft.lanes = cleanLanes(pr.lanes, draft.opts.lanes); },
    fromDraft(g, D) { g.pending = { heat: 1, lanes: cleanLanes(D.lanes, g.opts.lanes), spec: specOf(g.opts) }; },
    onStart(game) {
      const p = game.pending || { heat: 1, lanes: cleanLanes([], game.opts.lanes), spec: specOf(game.opts) };
      ST.addEvent(game, Object.assign({ t: 0, type: 'heat', heat: 1, lanes: cleanLanes(p.lanes) }, p.spec));
      game.pending = { heat: 1, lanes: cleanLanes(p.lanes), spec: Object.assign({}, p.spec) };
    },
    timeText(game, e) {
      if (e.type === 'heat') return ST.fmtTime(e.t, 2);
      const H = e.type === 'touch' ? heatAt(game, e.t) : heatByNo(game, e.heat);
      if (!H) return ST.fmtTime(e.t, 2);
      if (e.type !== 'touch') return `${H.heat}${unitOf(H.spec)}`;
      const info = touchInfo(game, e);
      const sec = info && info.circle ? info.time : info ? info.split : null;
      return `${H.heat}${unitOf(H.spec)} ${sec != null ? ST.fmtRace(sec) : '—'}`;
    },
    whoText(game, e) {
      if (e.type === 'heat') return '';
      const H = e.type === 'touch' ? heatAt(game, e.t) : heatByNo(game, e.heat);
      const L = H ? H.lanes.find((x) => x.lane === e.lane) : null;
      return `${H && H.spec.mode === 'circle' ? e.lane + '番目' : 'レーン' + e.lane}${L && L.name ? ' ' + L.name : ''}${L && L.team ? '（' + L.team + '）' : ''}`;
    },
    lastText(game, e) {
      if (e.type === 'heat') return eventText(game, e);
      if (FLAG[e.type]) return `L${e.lane} ${FLAG[e.type]}`;
      // （時刻は左に出るので、ここには何回目と順位・ラップだけ）
      const info = touchInfo(game, e);
      if (!info) return `L${e.lane} タッチ`;
      if (info.circle) return `L${e.lane} ${info.rep ? info.rep + '本目' : 'タッチ（本の前）'}`;
      if (info.extra) return `L${e.lane} タッチ（多い）`;
      if (info.goal) return `L${e.lane} ゴール${info.rank ? `（${info.rank}位）` : ''}`;
      return `L${e.lane} ${info.idx}/${info.need}（ラップ ${ST.fmtRace(info.lap)}）`;
    },
    logWho: (game, e) => { const H = e.type === 'touch' ? heatAt(game, e.t) : heatByNo(game, e.heat); const nm = laneName(H, e.lane); return `L${e.lane}${nm ? ' ' + nm : ''}`; },
    logText: (game, e) => (FLAG[e.type] ? FLAG[e.type] : touchText(touchInfo(game, e))),
    eventText,
    typeLabel: (game, e) => (FLAG[e.type] || (e.type === 'heat' ? '組のスタート' : 'タッチ')),
    editTypes: (game, e) => (FLAG[e.type] ? ['dq', 'dnf', 'dns'] : []),
    cleanEvent(e) {
      if (e.type === 'heat') {
        if (!isFinite(e.heat) || e.heat < 1) return null;
        const base = sp.defaultOpts();
        const o = {};
        SPEC_KEYS.forEach((k) => { o[k] = e[k] != null ? e[k] : base[k]; });
        const s = ST.cleanOpts(sp, Object.assign({}, base, o));
        return Object.assign({ heat: Math.round(e.heat), lanes: cleanLanes(e.lanes) }, specOf(s));
      }
      if (!isFinite(e.lane) || e.lane < 1 || e.lane > 99) return null;
      if (e.type === 'touch') return { lane: Math.round(e.lane) };
      return isFinite(e.heat) && e.heat >= 1 ? { lane: Math.round(e.lane), heat: Math.round(e.heat) } : null;
    },
    importExtra(obj, g) {
      const p = obj.pending;
      if (p && isFinite(p.heat) && p.heat >= 1) g.pending = { heat: Math.round(p.heat), lanes: cleanLanes(p.lanes), spec: specOf(ST.cleanOpts(sp, Object.assign({}, sp.defaultOpts(), p.spec || {}))) };
    },
    exportExtra(game, g) {
      g.heats = heats(game).map((H) => ({
        heat: H.heat, start: H.start, event: specText(H.spec), spec: H.spec,
        results: activeRows(results(game, H)).map((x) => (H.spec.mode === 'circle'
          ? { lane: x.lane, name: x.name, team: x.team, reps: x.reps.map((r) => r.time), avg: x.avg, best: x.best, flag: x.flag }
          : { lane: x.lane, name: x.name, team: x.team, time: x.time, rank: x.rank, splits: x.splits, laps: x.laps, flag: x.flag }))
      }));
    },
    csvEvents, csvBox,
    exports: [
      { key: 'csv', suffix: '_一覧', label: '📋 記録の一覧（CSV）', desc: '組・レーン・名前・何回目のタッチ・スプリット・ラップ。Excel・Numbers・Google スプレッドシートで開けます', rows: csvEvents },
      { key: 'box', suffix: '_結果', label: '🏁 結果（CSV）', desc: '1人1行：組の順位・タイム・スプリット・ラップ（練習は本ごとのタイム・平均・ベスト）', rows: csvBox }
    ],
    steps: [
      ['種目・距離・プール・レーンの数を選ぶ', '名前は入れなくても大丈夫（入れた名前は、次も入っています）'],
      ['スタートの合図（ピッ）で ▶ スタート', 'いまの組のタイムが、0.01 秒まで動き出します'],
      ['壁にタッチした瞬間に、そのレーンの「タッチ」', '25m ごとのスプリットとラップが残り、最後のタッチがゴール（タイムと順位）'],
      ['全員ゴールしたら「次の組へ」', '名前を入れかえて、次のスタートの合図で ▶ スタート。何組でも続けて計れます']
    ],
    help: [
      ['記録の画面', [
        'レーンの行：右の大きなボタンを、そのレーンの選手が壁にさわった瞬間に押します。押すたびに「2/4」のように何回目か、スプリット（スタートからの時間）とラップ（前のタッチからの時間）が出ます',
        '最後のタッチがゴールです。タイムと、その組の順位が大きく出ます（ボタンは「ゴール」になります）',
        '同じレーンのボタンを 1 秒以内に2回押したときは、1回として数えます',
        'レーンの「…」：失格（DQ）・棄権（DNF）・欠場（DNS）、そのレーンのいちばん新しいタッチの取り消し、名前の変更',
        '上の時計は、いまの組のスタートからの時間です'
      ]],
      ['組（ヒート）', [
        '「次の組へ」で、次の組の種目・距離と名前を決めます（「前の組と同じ名前」「名前を消す」も選べます）。スタートの合図で「▶ 2組目 スタート」',
        '組ごとに種目・距離を変えられるので、記録会のいくつもの種目を1つの記録で計れます。集計には、組ごとの順位と、同じ種目の組をまとめた総合順位が出ます'
      ]],
      ['練習（サークル）', [
        '「計るもの」で「練習（サークル）」を選ぶと、「50m×8本・1:00 サークル・5秒おき」のような練習のタイムを、人ごと・本ごとに計れます',
        'スタートは1回だけ（1本目の最初の人）。2本目からのスタートは、サークルとずれから自動で決まります。ゴールした瞬間に、その人の「ゴール」を押します',
        '集計に、本ごとのタイム・平均・ベストが出ます'
      ]],
      ['タイムの正確さ（正直なところ）', [
        '人がタップするので、本当のタッチから 0.1〜0.2 秒くらい遅れたり早まったりします。大会の公式記録（タッチ板・計時員）の代わりにはなりません。練習や記録会の目安として使ってください',
        '時刻は、押した瞬間の端末の時計で 0.01 秒まで残します。押しまちがえたら、記録の一覧で 0.01 秒ずつ直せます'
      ]]
    ]
  };
  ST.addSport(sp);
})(typeof window !== 'undefined' ? window : globalThis);
