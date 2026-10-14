/* バスケ得点クリップ — 見つけた得点を「入れた（自分）／入れられた（相手）」に分けて、5秒の区間（クリップ）にする
   DOM 非依存（node のテストからも読み込める）。

   どちらのチームの得点かは「どちらのゴールに入ったか」で決める。
   バスケは、前半・後半それぞれで、チームが攻めるゴールが決まっている（ハーフタイムで入れ替わる。延長は後半と同じ向き）。
   なので「動画のはじめに、そのゴールを攻めていたチーム」と「後半の始まり（あれば）」が分かれば、全部の得点のチームが決まる。
   ユニフォームの色を映像から見分けるより、ずっと確実（選手どうしが重なっても、照明が変わっても間違えない）。

   チームの番号：0 = 自分、1 = 相手。
   setup  : { hoopTeam: [ゴールA を攻めるチーム, ゴールB を攻めるチーム]（動画のはじめ）, halfT: 後半の始まり（秒）| null }
   result : 自動解析の結果 { shots: [{ t（ボールがリングを通った時刻）, hoop, made, sure }], spans, ... }
   edits  : 手直し { fix: { id: 0|1 }（チームを手で決めた）, off: { id: true }（再生・書き出しから外す）, added: [{ id, t, team }]（手で足した得点） } */
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

  function emptyEdits() { return { fix: {}, off: {}, added: [] }; }

  /* 得点の一覧（時刻順）。{ id, t, team, auto, hoop, unsure, fixed, on, half } */
  function items(result, setup, edits) {
    const E = edits || emptyEdits();
    const out = [];
    ((result && result.shots) || []).forEach((s) => {
      if (!s.made) return;
      const id = shotId(s);
      const fixed = E.fix && (E.fix[id] === 0 || E.fix[id] === 1);
      out.push({ id, t: s.t, team: fixed ? E.fix[id] : baseTeam(s, setup), auto: true, hoop: s.hoop, unsure: s.sure === false, fixed, on: !(E.off && E.off[id]) });
    });
    (E.added || []).forEach((a) => out.push({ id: a.id, t: a.t, team: a.team, auto: false, hoop: null, unsure: false, fixed: true, on: !(E.off && E.off[a.id]) }));
    out.sort((a, b) => a.t - b.t);
    out.forEach((it) => { it.half = setup && setup.halfT != null ? (it.t >= setup.halfT ? 2 : 1) : 0; });
    return out;
  }

  /* そのチームの得点だけを、クリップ（区間）にする。win: { lead, lag }、duration: 動画の長さ（秒） */
  function clipsOf(list, team, win, duration) {
    const w = Object.assign({}, WIN, win || {});
    const end = duration > 0 ? duration : Infinity;
    const mine = list.filter((it) => it.team === team);
    return mine.map((it, i) => ({
      id: it.id, at: it.t, team, n: i + 1, total: mine.length, on: it.on, unsure: it.unsure, auto: it.auto, fixed: it.fixed, half: it.half,
      t0: Math.max(0, it.t - w.lead), t1: Math.min(end, it.t + w.lag)
    }));
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

  /* 解析をやり直したとき、前の結果に付けた手直し（チーム・外す）を、新しい結果の「同じ得点」（同じゴールで、時刻の差が 1.5 秒以内）へ移す */
  function carryEdits(oldResult, newResult, edits) {
    const E = edits || emptyEdits();
    const next = { fix: {}, off: {}, added: (E.added || []).slice() };
    const oldMade = ((oldResult && oldResult.shots) || []).filter((s) => s.made);
    const newMade = ((newResult && newResult.shots) || []).filter((s) => s.made);
    const map = {};
    oldMade.forEach((o) => {
      let best = null;
      newMade.forEach((n) => { const d = Math.abs(n.t - o.t); if (n.hoop === o.hoop && d < 1.5 && (!best || d < best.d)) best = { d, id: shotId(n) }; });
      if (best) map[shotId(o)] = best.id;
    });
    const manual = new Set(next.added.map((a) => a.id));
    Object.keys(E.fix || {}).forEach((id) => { if (map[id]) next.fix[map[id]] = E.fix[id]; });
    Object.keys(E.off || {}).forEach((id) => { if (map[id]) next.off[map[id]] = true; else if (manual.has(id)) next.off[id] = true; });
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

  BS.clips = { WIN, HALF_GAP, shotId, baseTeam, emptyEdits, items, clipsOf, reel, suggestHalf, carryEdits, coverage };
})(typeof window !== 'undefined' ? window : globalThis);
