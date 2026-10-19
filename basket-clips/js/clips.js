/* バスケ得点クリップ — 見つけた得点を「入れた（自分）／入れられた（相手）」に分けて、5秒の区間（クリップ）にする
   DOM 非依存（node のテストからも読み込める）。

   どちらのチームの得点かは「どちらのゴールに入ったか」で決める。
   バスケは、前半・後半それぞれで、チームが攻めるゴールが決まっている（ハーフタイムで入れ替わる。延長は後半と同じ向き）。
   なので「動画のはじめに、そのゴールを攻めていたチーム」と「後半の始まり（あれば）」が分かれば、全部の得点のチームが決まる。
   ユニフォームの色を映像から見分けるより、ずっと確実（選手どうしが重なっても、照明が変わっても間違えない）。

   チームの番号：0 = 自分、1 = 相手。
   setup  : { hoopTeam: [ゴールA を攻めるチーム, ゴールB を攻めるチーム]（動画のはじめ）, halfT: 後半の始まり（秒）| null }
   result : 自動解析の結果 { shots: [{ t（ボールがリングを通った時刻）, hoop, made, sure, tier, why }], spans, ... }
            tier（自動の判定の3段）：'made' 入った／'maybe' たぶん入った（人が確かめる）／'miss' 外れ。
            why（たぶん入った、の理由）：'net' ボールは見えなかったがネットが大きく揺れた／'bounce' リングに来たあとネットが揺れた／
            'faint' ボールはリングを通ったが、ネットの動きをはっきり確かめられなかった
   edits  : 手直し { fix: { id: 0|1 }（チームを手で決めた）, off: { id: true }（再生・書き出しから外す）,
                     added: [{ id, t, team, res }]（手で足したシュート。res: 'made'（省略時）|'miss'）,
                     judge: { id: 'made'|'miss' }（使う人が「入った」「外れ」と決めた）, promote: { id: true }（前の版の「入っていた」。judge の made と同じ）,
                     rec: { id: { type: '2'|'3'|'ft', no: 打った人の番号, reb: リバウンドを取ったチーム 0|1, rno: その番号 } }（記録） } */
(function (root) {
  'use strict';
  const BS = root.BS = root.BS || {};

  const WIN = { lead: 4, lag: 1 };      // 入った瞬間の「前 4 秒・後 1 秒」＝ 5 秒

  /* 自動で見つけた得点の id（同じ動画・同じゴールの指定なら、毎回同じになる） */
  const shotId = (s) => 's' + Math.round(s.t * 100) + '_' + s.hoop;

  /* ゴールと時刻から決まるチーム（手直しの前） */
  function baseTeam(shot, setup) {
    const ht = (setup && setup.hoopTeam) || [0, 1];
    const first = ht[shot.hoop] === 0 || ht[shot.hoop] === 1 ? ht[shot.hoop] : shot.hoop;
    const second = setup && setup.halfT != null && shot.t >= setup.halfT;
    return second ? 1 - first : first;
  }

  function emptyEdits() { return { fix: {}, off: {}, added: [], promote: {}, judge: {}, rec: {} }; }

  /* 「外れ」「たぶん入った」と判定したシュートを「入った」にしたとき、場面の後ろを長めにする秒数。
     外れの時刻は「ボールがリングにいちばん近づいた瞬間」で、リングで弾んでから入るまでに 0.5〜1.5 秒かかるため */
  const PROMOTE_TAIL = 1.5;

  /* 自動の判定の3段（'made'・'maybe'・'miss'）。tier のない古い結果は、成功でネットの動きを確かめられたもの → made、
     確かめられなかったもの → maybe、外れ → miss とみなす */
  function autoTier(s) {
    if (s.tier === 'made' || s.tier === 'maybe' || s.tier === 'miss') return s.tier;
    if (s.made) return s.sure === false ? 'maybe' : 'made';
    return 'miss';
  }
  /* 使う人の判定を入れた、最終の判定 */
  function verdict(s, E) {
    const id = shotId(s);
    const j = E && E.judge && E.judge[id];
    if (j === 'made' || j === 'miss') return j;
    if (E && E.promote && E.promote[id]) return 'made';
    return autoTier(s);
  }
  const halfOf = (t, setup) => (setup && setup.halfT != null ? (t >= setup.halfT ? 2 : 1) : 0);
  const teamOf = (s, setup, E) => { const id = shotId(s); return E && E.fix && (E.fix[id] === 0 || E.fix[id] === 1) ? E.fix[id] : baseTeam(s, setup); };

  /* 得点の一覧（時刻順）。{ id, t, team, auto, hoop, unsure, fixed, on, half, promoted, tail }
     promoted：自動では「入った」でなかったものを、使う人が「入った」にした */
  function items(result, setup, edits) {
    const E = edits || emptyEdits();
    const out = [];
    ((result && result.shots) || []).forEach((s) => {
      if (verdict(s, E) !== 'made') return;
      const id = shotId(s);
      const promoted = autoTier(s) !== 'made';
      const fixed = E.fix && (E.fix[id] === 0 || E.fix[id] === 1);
      out.push({ id, t: s.t, team: teamOf(s, setup, E), auto: true, hoop: s.hoop, unsure: !promoted && s.sure === false, fixed, on: !(E.off && E.off[id]), promoted, tail: promoted ? PROMOTE_TAIL : 0 });
    });
    (E.added || []).forEach((a) => { if (a.res !== 'miss') out.push({ id: a.id, t: a.t, team: a.team, auto: false, hoop: null, unsure: false, fixed: true, on: !(E.off && E.off[a.id]) }); });
    out.sort((a, b) => a.t - b.t);
    out.forEach((it) => { it.half = halfOf(it.t, setup); });
    return out;
  }

  /* そのチームの得点だけを、クリップ（区間）にする。win: { lead, lag }、duration: 動画の長さ（秒） */
  function clipsOf(list, team, win, duration) {
    const w = Object.assign({}, WIN, win || {});
    const end = duration > 0 ? duration : Infinity;
    const mine = list.filter((it) => it.team === team);
    return mine.map((it, i) => ({
      id: it.id, at: it.t, team, n: i + 1, total: mine.length, on: it.on, unsure: it.unsure, auto: it.auto, fixed: it.fixed, half: it.half, promoted: !!it.promoted,
      t0: Math.max(0, it.t - w.lead), t1: Math.min(end, it.t + w.lag + (it.tail || 0))
    }));
  }

  /* 判定が tier（'maybe' か 'miss'）のシュート。すでに得点がある場面（同じゴールで 2.5 秒以内＝同じシュートがリングで弾んだもの）は出さない。
     チームは「そのゴールを攻めていたチーム」（＝打ったチーム）。{ id, t, team, hoop, half, why, judged } */
  function byVerdict(tier, result, setup, edits, list) {
    const E = edits || emptyEdits();
    const made = list || items(result, setup, E);
    const out = [];
    ((result && result.shots) || []).forEach((s) => {
      if (verdict(s, E) !== tier) return;
      if (made.some((it) => (it.hoop === s.hoop || it.hoop == null) && Math.abs(it.t - s.t) < 2.5)) return;
      const id = shotId(s);
      out.push({ id, t: s.t, team: teamOf(s, setup, E), hoop: s.hoop, half: halfOf(s.t, setup), why: s.why || null, judged: !!(E.judge && E.judge[id]) });
    });
    return out.sort((a, b) => a.t - b.t);
  }
  /* 「たぶん入った（確認して）」：使う人が ▶ で確かめて「入った」「外れ」を決める */
  function maybes(result, setup, edits, list) { return byVerdict('maybe', result, setup, edits, list); }
  /* 「外れ」と判定したシュート（得点の一覧には出さない。記録では使う） */
  function misses(result, setup, edits, list) { return byVerdict('miss', result, setup, edits, list); }

  /* ---------- 記録（ゴールに来たシュートを全部並べて、人が 2点・3点・フリースロー、打った人・リバウンドの番号を付ける） ----------
     行：{ id, t, team（打ったチーム）, hoop, half, res: 'made'|'miss'|'maybe', auto, why, rec: { type, no, reb, rno } } */
  function record(result, setup, edits) {
    const E = edits || emptyEdits();
    const made = items(result, setup, E);
    const rows = [];
    const rec = (id) => (E.rec && E.rec[id]) || {};
    made.forEach((it) => rows.push({ id: it.id, t: it.t, team: it.team, hoop: it.hoop, half: it.half, res: 'made', auto: it.auto, why: null, rec: rec(it.id) }));
    ['maybe', 'miss'].forEach((tier) => byVerdict(tier, result, setup, E, made).forEach((m) => rows.push({ id: m.id, t: m.t, team: m.team, hoop: m.hoop, half: m.half, res: tier, auto: true, why: m.why, rec: rec(m.id) })));
    (E.added || []).forEach((a) => { if (a.res === 'miss') rows.push({ id: a.id, t: a.t, team: a.team, hoop: null, half: halfOf(a.t, setup), res: 'miss', auto: false, why: null, rec: rec(a.id) }); });
    return rows.sort((a, b) => a.t - b.t);
  }
  const PTS = { 2: 2, 3: 3, ft: 1 };
  /* 記録の集計（「たぶん入った」のまま決めていないものは数えない）。種類（2点・3点・FT）が未入力の成功は 2 点として数え、その本数を guess に。
     戻り値：{ teams: [{ pts, guess, shots: { 2: [成功, 本数], 3: [...], ft: [...], '?': [...] }, oreb, dreb, pending }, ...],
              players: [[{ no, pts, shots, oreb, dreb }, ...]（チームごと、番号順）] } */
  function stats(rows) {
    const blank = () => ({ 2: [0, 0], 3: [0, 0], ft: [0, 0], '?': [0, 0] });
    const teams = [0, 1].map(() => ({ pts: 0, guess: 0, shots: blank(), oreb: 0, dreb: 0, pending: 0 }));
    const players = [{}, {}];
    const pl = (tm, no) => { const k = String(no); return players[tm][k] || (players[tm][k] = { no: k, pts: 0, shots: blank(), oreb: 0, dreb: 0 }); };
    rows.forEach((r) => {
      const T = teams[r.team];
      if (!T) return;
      if (r.res === 'maybe') { T.pending++; return; }
      const type = r.rec.type === '2' || r.rec.type === '3' || r.rec.type === 'ft' ? r.rec.type : '?';
      const made = r.res === 'made' ? 1 : 0;
      const pts = made ? (PTS[type] || 2) : 0;
      T.shots[type][0] += made; T.shots[type][1]++; T.pts += pts;
      if (made && type === '?') T.guess++;
      const P = r.rec.no ? pl(r.team, r.rec.no) : null;
      if (P) { P.shots[type][0] += made; P.shots[type][1]++; P.pts += pts; }
      if (!made && (r.rec.reb === 0 || r.rec.reb === 1)) {
        const off = r.rec.reb === r.team;
        teams[r.rec.reb][off ? 'oreb' : 'dreb']++;
        if (r.rec.rno) pl(r.rec.reb, r.rec.rno)[off ? 'oreb' : 'dreb']++;
      }
    });
    const byNo = (a, b) => (Number(a.no) - Number(b.no)) || String(a.no).localeCompare(String(b.no));
    return { teams, players: players.map((m) => Object.values(m).sort(byNo)) };
  }
  /* 記録を CSV に（Excel で開けるように、使う側で先頭に BOM を付ける）。names: [自分のチーム名, 相手のチーム名]、fmt: 秒 → "m:ss" */
  function recordCSV(rows, names, fmt) {
    const q = (v) => { const x = v == null ? '' : String(v); return /[",\n]/.test(x) ? '"' + x.replace(/"/g, '""') + '"' : x; };
    const RES = { made: '入った', miss: '外れ', maybe: '確認待ち' };
    const TYPE = { 2: '2点', 3: '3点', ft: 'フリースロー' };
    const lines = [['時刻', '前後半', 'ゴール', 'チーム', '結果', '種類', '打った人', 'リバウンドのチーム', 'リバウンドの番号', 'オフェンス／ディフェンス'].join(',')];
    rows.forEach((r) => {
      const rb = r.res !== 'made' && (r.rec.reb === 0 || r.rec.reb === 1) ? r.rec.reb : null;
      lines.push([fmt ? fmt(r.t) : r.t, r.half === 2 ? '後半' : r.half === 1 ? '前半' : '', r.hoop == null ? '' : 'AB'[r.hoop], names[r.team], RES[r.res], TYPE[r.rec.type] || '',
        r.rec.no || '', rb == null ? '' : names[rb], rb == null ? '' : r.rec.rno || '', rb == null ? '' : rb === r.team ? 'オフェンス' : 'ディフェンス'].map(q).join(','));
    });
    return lines.join('\r\n') + '\r\n';
  }

  /* 続けて再生・書き出しするときの区間。外したものは入れない。
     となりの区間と重なるときは、同じところを2回見せないように、重なった分を後ろの区間から削る（ほとんど重なるなら1つにまとめる） */
  function reel(clips) {
    const out = [];
    clips.filter((c) => c.on !== false).slice().sort((a, b) => a.t0 - b.t0).forEach((c) => {
      const seg = Object.assign({}, c, { ids: [c.id] });
      const prev = out[out.length - 1];
      if (prev && seg.t0 < prev.t1) {
        if (seg.t1 - prev.t1 < 0.5) { prev.t1 = Math.max(prev.t1, seg.t1); prev.ids.push(c.id); return; }
        seg.t0 = prev.t1;
      }
      out.push(seg);
    });
    return out;
  }

  /* ハーフタイムらしい「シュートが1本もない長い時間」を探す（後半の始まりの候補）。
     解析で見つけたシュート（成功も失敗も）の間の、いちばん長いすき間が 4 分以上で、動画の真ん中あたり（15〜85%）にあり、
     その前後にシュートが 3 本以上ずつあれば、ハーフタイムとして提案する。決めるのは使う人（提案するだけ） */
  const HALF_GAP = 240;
  function suggestHalf(result, duration) {
    const ts = ((result && result.shots) || []).map((s) => s.t).sort((a, b) => a - b);
    if (ts.length < 6) return null;
    let best = null;
    for (let i = 1; i < ts.length; i++) {
      const gap = ts[i] - ts[i - 1];
      if (!best || gap > best.gap) best = { gap, from: ts[i - 1], to: ts[i], i };
    }
    if (!best || best.gap < HALF_GAP) return null;
    const mid = (best.from + best.to) / 2;
    if (duration > 0 && (mid < duration * 0.15 || mid > duration * 0.85)) return null;
    if (best.i < 3 || ts.length - best.i < 3) return null;
    return { from: best.from, to: best.to, at: Math.round(Math.max(best.from + 1, best.to - 10) * 10) / 10 };
  }

  /* 解析をやり直したとき、前の結果に付けた手直し（チーム・外す・入っていた）を、新しい結果の「同じシュート」（同じゴールで、時刻の差が 1.5 秒以内）へ移す。
     「入っていた」にした外れが、やり直しで得点と判定されたときは、そのまま得点になる（印は残っても害はない） */
  function carryEdits(oldResult, newResult, edits) {
    const E = edits || emptyEdits();
    const next = { fix: {}, off: {}, added: (E.added || []).slice(), promote: {}, judge: {}, rec: {} };
    const oldShots = (oldResult && oldResult.shots) || [];
    const newShots = (newResult && newResult.shots) || [];
    const map = {};
    oldShots.forEach((o) => {
      let best = null;
      newShots.forEach((n) => {
        const d = Math.abs(n.t - o.t) + (n.made === o.made ? 0 : 0.01);      // 同じくらい近ければ、成否が同じものを選ぶ
        if (n.hoop === o.hoop && Math.abs(n.t - o.t) < 1.5 && (!best || d < best.d)) best = { d, id: shotId(n) };
      });
      if (best) map[shotId(o)] = best.id;
    });
    const manual = new Set(next.added.map((a) => a.id));
    Object.keys(E.fix || {}).forEach((id) => { if (map[id]) next.fix[map[id]] = E.fix[id]; });
    Object.keys(E.off || {}).forEach((id) => { if (map[id]) next.off[map[id]] = true; else if (manual.has(id)) next.off[id] = true; });
    Object.keys(E.promote || {}).forEach((id) => { if (map[id]) next.promote[map[id]] = true; });
    Object.keys(E.judge || {}).forEach((id) => { if (map[id]) next.judge[map[id]] = E.judge[id]; });
    Object.keys(E.rec || {}).forEach((id) => { if (map[id]) next.rec[map[id]] = E.rec[id]; else if (manual.has(id)) next.rec[id] = E.rec[id]; });
    return next;
  }

  /* ゴールが映っていた（調べられた）時間の割合。spans: [[開始, 終了, ビット（ゴール i が映っていれば 1<<i）], ...] */
  function coverage(result, duration, nHoops) {
    const out = [];
    const spans = (result && result.spans) || [];
    const dur = duration > 0 ? duration : 1;
    for (let i = 0; i < (nHoops || 2); i++) {
      let sec = 0;
      spans.forEach((sp) => { if (sp[2] & (1 << i)) sec += sp[1] - sp[0] + 1 / 15; });
      out.push(Math.min(1, sec / dur));
    }
    return out;
  }

  BS.clips = { WIN, HALF_GAP, PROMOTE_TAIL, shotId, baseTeam, emptyEdits, autoTier, verdict, items, clipsOf, maybes, misses, record, stats, recordCSV, reel, suggestHalf, carryEdits, coverage };
})(typeof window !== 'undefined' ? window : globalThis);
