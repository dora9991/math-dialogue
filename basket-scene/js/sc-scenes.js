/* バスケ シーン — タブ「② 場面」
   記録した 1 つのプレー ＝ 1 つの場面。記録の時刻は動画の時刻なので、時刻あわせは いらない。
   場面の長さ：[t − 前, t + 後]（前・後は 設定の prefs.win。BS.taplog.winFor）を、動画の長さの中に収める。そこに、場面ごとの手直しを足す。

   ■ 試合に保存するもの（なくてよい。0 に戻ったら消す）
     game.sceneAdj = { [記録の id]: { d0, d1 } }   はじめ・おわりに足す秒（− で前へ・＋ で後ろへ）
     game.sceneOff = { [記録の id]: true }         「続けて再生」「1本の動画」から外した場面

   ■ ほかのタブから使えるもの
     SC.scenes.list(filter)   → 場面の配列（下の scene の形。filter は下の「しぼりこみ」。null は全部）
     SC.scenes.windowOf(ev)   → { t0, t1 }（その記録の場面の、はじめ・おわり。動画の秒）
     SC.app.setTab('scenes', { filter, title, play: 'first' | 'reel' | null, focus: 'e12' })
   しぼりこみ（filter）：{ types: [BT.TYPE の id] | null, nos: ['7', ''（番号なし）] | null, team: 0 | 1 | null }
     team が 0・1 のときは、チームなしの記録（★ など）は入らない。nos を決めたときは、自分のチームの記録だけ。

   DOM なしの部分（SC.scenes.core）は、node のテストからも読める（tests/unit-scenes.cjs）。 */
(function (root) {
  'use strict';
  const BT = root.BT, BS = root.BS;
  const SC = root.SC = root.SC || {};
  const TL = BS.taplog;

  /* ================= 画面を持たない部分 ================= */
  const SCORE = ['fg2', 'fg3', 'ft'], MISS = ['fg2x', 'fg3x', 'ftx'];
  /* しぼりこみのボタン（プレー）。ある記録のものだけを出す */
  const PLAYS = [
    ['all', 'すべて', null, null], ['score', '得点', SCORE, 0], ['shot', 'シュート', SCORE.concat(MISS), 0], ['reb', 'リバウンド', ['reb', 'oreb', 'dreb'], 0],
    ['ast', 'アシスト', ['ast'], 0], ['stl', 'スティール', ['stl'], 0], ['blk', 'ブロック', ['blk'], 0], ['tov', 'ターンオーバー', ['tov'], 0],
    ['foul', 'ファウル', ['foul'], 0], ['pass', 'パスミス', ['pass'], null], ['mark', '★', ['mark'], null], ['opp', '相手の得点', SCORE, 1]
  ].map(([id, label, types, team]) => ({ id, label, types, team }));
  /* 設定の「プレーごとに変える」の並び（まとまりは BS.taplog.TYPES の grp） */
  const WGROUPS = [['score', '得点'], ['miss', 'シュート失敗'], ['reb', 'リバウンド'], ['ast', 'アシスト'], ['stl', 'スティール'], ['blk', 'ブロック'],
    ['tov', 'ターンオーバー'], ['foul', 'ファウル'], ['pass', 'パスミス'], ['mark', '★ あとで見る']];
  const LIM = { lead: 30, lag: 15 };
  const MIN_LEN = 1;
  const r2 = (v) => Math.round(v * 100) / 100;
  const grpOf = (type) => (TL.TYPES[type] || {}).grp || 'mark';
  const isPlay = (e) => !!(e && e.type !== 'period' && TL.TYPES[e.type] && BT.TYPE[e.type]);
  const noKey = (e) => (e.no == null ? '' : String(e.no));

  /* 秒 → 「12秒」「1分24秒」「1時間2分」 */
  function fmtLen(sec) {
    const s = Math.max(0, Math.round(sec || 0));
    if (s < 60) return s + '秒';
    if (s >= 3600) { const hh = Math.floor(s / 3600), mm = Math.floor((s % 3600) / 60); return hh + '時間' + (mm ? mm + '分' : ''); }
    const m = Math.floor(s / 60), r = s % 60;
    return m + '分' + (r ? r + '秒' : '');
  }

  /* しぼりこみをそろえる（形の合わないものは「なし」＝全部） */
  function cleanFilter(f) {
    const o = f || {};
    const types = Array.isArray(o.types) && o.types.length ? o.types.filter((t) => TL.TYPES[t]).map(String) : null;
    const nos = Array.isArray(o.nos) && o.nos.length ? o.nos.map((n) => (n == null ? '' : String(n))) : null;
    const team = o.team === 0 || o.team === 1 ? o.team : null;
    return { types: types && types.length ? types : null, nos, team };
  }
  /* その記録が、しぼりこみに入るか */
  function pass(e, f) {
    if (!f) return true;
    if (f.team === 0 || f.team === 1) { if (e.team !== f.team) return false; }      // ★（チームなし）は、team が null のときだけ
    if (f.types && f.types.indexOf(e.type) < 0) return false;
    if (f.nos) { if (e.team !== 0) return false; if (f.nos.indexOf(noKey(e)) < 0) return false; }
    return true;
  }

  /* 1つの記録の場面の時刻。dur：動画の長さ（0 なら分からない＝おわりは切らない） */
  function windowOf(game, prefs, e, dur) {
    const w = TL.winFor(prefs && prefs.win, grpOf(e.type));
    const a = (game && game.sceneAdj && game.sceneAdj[e.id]) || null;
    const d0 = a && isFinite(a.d0) ? +a.d0 : 0, d1 = a && isFinite(a.d1) ? +a.d1 : 0;
    const end = dur > 0 ? dur : Infinity;
    let t0 = BT.clamp(e.t - w.lead + d0, 0, end), t1 = BT.clamp(e.t + w.lag + d1, 0, end);
    if (t1 < t0 + 0.5) { t1 = Math.min(end, t0 + 0.5); if (t1 < t0 + 0.5) t0 = Math.max(0, t1 - 0.5); }
    return { t0: r2(t0), t1: r2(t1), lead: w.lead, lag: w.lag, d0, d1 };
  }
  /* はじめのまま（手直しなし）の時刻 */
  function baseWindow(game, prefs, e, dur) { return windowOf({ sceneAdj: null }, prefs, e, dur); }

  /* 1つの場面：
     { id, t, type, grp, team, no, period, who（「#7 たけし」| ''）, what（「2P成功」・相手は「相手の得点（2点）」）,
       label（書き出しの札：「#7 たけし 2P成功」「ヒガシの得点（2点）」）, sub（「1Q 2:15」）, color,
       t0, t1, len, lead, lag, adj（{ d0, d1 } | null）, on（false なら外した場面） } */
  function scene(game, prefs, e, dur) {
    const d = BT.TYPE[e.type];
    const tm = e.team === 0 || e.team === 1 ? e.team : null;
    const nm = tm != null && e.no != null ? BT.playerName(game, tm, e.no) : '';
    const who = tm != null && e.no != null ? '#' + e.no + (nm ? ' ' + nm : '') : '';
    const oppPts = tm === 1 && d.pts > 0;
    const what = oppPts ? `相手の得点（${d.pts}点）` : d.label;
    const label = oppPts ? `${BT.teamName(game, 1)}の得点（${d.pts}点）` : BT.eventText(game, e);
    const period = BT.periodAt(game, e.t);
    const w = windowOf(game, prefs, e, dur);
    const adj = game.sceneAdj && game.sceneAdj[e.id] ? { d0: w.d0, d1: w.d1 } : null;
    const color = tm === 1 ? (game.teams[1] && game.teams[1].color) || '#d93636' : tm === 0 ? (game.teams[0] && game.teams[0].color) || '#2f6fed' : '#facc15';
    return { id: e.id, t: e.t, type: e.type, grp: grpOf(e.type), team: tm, no: e.no == null ? null : String(e.no), period, who, what, label,
      sub: `${BT.periodLabel(period)} ${BT.fmtTime(e.t)}`, color, t0: w.t0, t1: w.t1, len: r2(w.t1 - w.t0), lead: w.lead, lag: w.lag, adj,
      on: !(game.sceneOff && game.sceneOff[e.id]) };
  }
  /* しぼりこんだ場面（動画の時刻の順） */
  function list(game, prefs, filter, dur) {
    if (!game) return [];
    const f = filter ? cleanFilter(filter) : null;
    return BT.sorted(game).filter((e) => isPlay(e) && pass(e, f)).map((e) => scene(game, prefs, e, dur));
  }
  /* 続けて再生・書き出しの区間（外した場面は入れない。重なる場面は1つにつなぐ：BS.taplog.reel）
     札：つないだときは「#7 2P失敗 → #5 リバウンド」（3つ以上は「… ほか2」） */
  function reelOf(scenes, maxLen) {
    const byId = {};
    (scenes || []).forEach((s) => { byId[s.id] = s; });
    return TL.reel(scenes || [], maxLen || 24).map((seg) => {
      const ms = seg.ids.map((id) => byId[id]).filter(Boolean);
      const label = ms.length <= 1 ? seg.label : ms.length === 2 ? ms[0].label + ' → ' + ms[1].label : `${ms[0].label} ほか${ms.length - 1}`;
      return Object.assign(seg, { label, t0: r2(seg.t0), t1: r2(seg.t1) });
    });
  }
  /* 続けて見たときの長さ（秒） */
  function total(scenes, maxLen) { return r2(reelOf(scenes, maxLen).reduce((s, x) => s + (x.t1 - x.t0), 0)); }

  /* 手直し：場面のはじめ（k = 'd0'）・おわり（'d1'）を、いまの所から delta 秒動かす。0 に戻ったら消す */
  function adjust(game, prefs, id, k, delta, dur) {
    const e = BT.findEvent(game, id);
    if (!e) return false;
    const w = windowOf(game, prefs, e, dur), b = baseWindow(game, prefs, e, dur);
    const end = dur > 0 ? dur : Infinity;
    let v;
    if (k === 'd0') {
      const t0 = w.t0 + delta;
      if (t0 < -1e-6 || t0 > w.t1 - MIN_LEN + 1e-6) return false;
      v = Math.abs(t0 - b.t0) < 0.05 ? 0 : t0 - (e.t - w.lead);       // はじめのままに戻ったら 0
    } else {
      const t1 = w.t1 + delta;
      if (t1 > end + 1e-6 || t1 < w.t0 + MIN_LEN - 1e-6) return false;
      v = Math.abs(t1 - b.t1) < 0.05 ? 0 : t1 - (e.t + w.lag);
    }
    const A = game.sceneAdj = game.sceneAdj || {};
    const cur = Object.assign({ d0: 0, d1: 0 }, A[id]);
    cur[k] = r2(v);
    if (Math.abs(cur.d0) < 0.05 && Math.abs(cur.d1) < 0.05) delete A[id]; else A[id] = { d0: r2(cur.d0), d1: r2(cur.d1) };
    if (!Object.keys(A).length) delete game.sceneAdj;
    return true;
  }
  /* その場面で、はじめ・おわりを動かせるか（{ s0m, s0p, s1m, s1p }） */
  function canAdjust(game, prefs, e, dur) {
    const w = windowOf(game, prefs, e, dur), end = dur > 0 ? dur : Infinity;
    return { s0m: w.t0 - 1 >= -1e-6, s0p: w.t0 + 1 <= w.t1 - MIN_LEN + 1e-6, s1m: w.t1 - 1 >= w.t0 + MIN_LEN - 1e-6, s1p: w.t1 + 1 <= end + 1e-6 };
  }
  function resetAdj(game, id) { if (game.sceneAdj) { delete game.sceneAdj[id]; if (!Object.keys(game.sceneAdj).length) delete game.sceneAdj; } }
  function setOff(game, id, off) {
    if (off) { game.sceneOff = game.sceneOff || {}; game.sceneOff[id] = true; return; }
    if (game.sceneOff) { delete game.sceneOff[id]; if (!Object.keys(game.sceneOff).length) delete game.sceneOff; }
  }

  /* しぼりこみのボタン：プレー（ある記録のものだけ・数は、選んでいる選手の中で）と、選手（#4・#7…・番号なし） */
  const sameSet = (a, b) => (!a && !b) || (!!a && !!b && a.length === b.length && a.every((x) => b.indexOf(x) >= 0));
  function chips(game, f) {
    const ev = game ? game.events.filter(isPlay) : [];
    const cnt = (ff) => ev.filter((e) => pass(e, ff)).length;
    const plays = PLAYS.map((c) => ({ id: c.id, label: c.label, types: c.types, team: c.team,
      exists: c.id === 'all' || cnt({ types: c.types, team: c.team, nos: null }) > 0, n: cnt({ types: c.types, team: c.team, nos: f.nos }),
      on: sameSet(c.types, f.types) && c.team === f.team })).filter((c) => c.exists);
    const ours = ev.filter((e) => e.team === 0);
    const nos = BT.sortNos(Array.from(new Set(ours.filter((e) => e.no != null).map((e) => String(e.no)))));
    const players = [];
    if (nos.length) {
      players.push({ key: 'all', label: '全員', nos: null, n: cnt({ types: f.types, team: f.team, nos: null }), on: !f.nos });
      nos.forEach((no) => players.push({ key: no, label: '#' + no, name: BT.playerName(game, 0, no), nos: [no], n: cnt({ types: f.types, team: f.team, nos: [no] }), on: sameSet(f.nos, [no]) }));
      if (ours.some((e) => e.no == null)) players.push({ key: 'none', label: '番号なし', nos: [''], n: cnt({ types: f.types, team: f.team, nos: [''] }), on: sameSet(f.nos, ['']) });
    }
    return { plays, players };
  }
  /* しぼりこみの呼び名：「#7 の 得点」「相手の得点」「すべて」 */
  function describe(game, f) {
    const c = PLAYS.find((p) => sameSet(p.types, f.types) && p.team === f.team);
    let what = c ? (c.id === 'all' ? '' : c.label) : (f.types || []).map((t) => (BT.TYPE[t] && (BT.TYPE[t].short || BT.TYPE[t].label)) || t).join('・');
    if (!c && f.team === 1) what = '相手の ' + (what || 'プレー');
    const who = f.nos ? f.nos.map((n) => (n === '' ? '番号なし' : '#' + n + (game && BT.playerName(game, 0, n) ? ' ' + BT.playerName(game, 0, n) : ''))).join('・') : '';
    return [who, what].filter(Boolean).join(' の ') || 'すべて';
  }

  const core = { PLAYS, WGROUPS, LIM, fmtLen, cleanFilter, pass, windowOf, baseWindow, scene, list, reelOf, total, adjust, canAdjust, resetAdj, setOff, chips, describe };
  SC.scenes = { core };
  if (!SC.app || typeof document === 'undefined') return;

  /* ================= 画面 ================= */
  const A = SC.app, S = A.S, { h } = BT.ui;
  const ALL = () => ({ types: null, nos: null, team: null });
  const st = { el: null, f: ALL(), title: null, dirty: true, play: null, exp: null, out: null, byOpen: false };
  let E = {};
  let token = 0;
  const visible = () => !!(st.el && S.tab === 'scenes' && S.W);
  const scenesNow = () => list(S.game, S.prefs, st.f, A.dur());
  const toast = BT.ui.toast;

  /* ---------- 描く ---------- */
  function mount(el) {
    st.el = el; E = {};
    stopPlay(false);
    el.innerHTML = '';
    el.classList.add('sn-pane');
    st.dirty = true;
    render();
  }
  function render() {
    const el = st.el, g = S.game;
    if (!el || !g) return;
    st.dirty = false;
    const keep = el.scrollTop;
    el.innerHTML = '';
    E = { rows: new Map() };
    const all = g.events.filter(isPlay);
    if (!all.length) {
      el.append(h('div', { class: 'sn-empty', id: 'snEmpty' },
        h('div', { class: 'sn-empty-ic', 'aria-hidden': 'true' }, '🎞'),
        h('b', null, 'まだ場面はありません'),
        h('p', null, '「① 記録」で、動画を見ながらプレーをタップすると、その場面が ここに並びます。'),
        h('button', { class: 'btn primary', id: 'snGoTap', onclick: () => A.setTab('tap') }, '① 記録へ')));
      return;
    }
    const vid = A.hasVideo();
    const scs = scenesNow();
    const C = chips(g, st.f);
    const wrap = h('div', { class: 'sn-wrap' });
    if (!vid) {
      wrap.append(h('div', { class: 'sn-banner', id: 'snBanner' },
        h('p', null, h('b', null, '🎬 動画を選ぶと、場面を見られます')),
        g.src && g.src.name ? h('p', { class: 'note' }, `記録した動画：${g.src.name}`) : null,
        h('button', { class: 'btn primary', id: 'snPickVideo', onclick: () => A.pickVideo() }, '🎬 動画を選ぶ')));
    }
    if (st.title) {
      wrap.append(h('div', { class: 'sn-fbar', id: 'snFilterBar' },
        h('span', { class: 'sn-ftitle', id: 'snTitle' }, '🔎 ', h('b', null, st.title)),
        h('button', { class: 'btn small', id: 'snClearFilter', onclick: () => { st.f = ALL(); st.title = null; render(); } }, '× しぼりこみを外す')));
    }
    // しぼりこみ（プレー・選手）
    wrap.append(h('div', { class: 'sn-chips', id: 'snPlays', role: 'group', 'aria-label': 'プレーで しぼりこむ' }, C.plays.map((c) =>
      h('button', { class: 'sn-chip' + (c.on ? ' on' : '') + (c.n ? '' : ' zero'), 'aria-pressed': c.on ? 'true' : 'false', dataset: { snplay: c.id },
        onclick: () => { st.f.types = c.types ? c.types.slice() : null; st.f.team = c.team; st.title = null; render(); } }, c.label, h('small', null, String(c.n))))));
    if (C.players.length) {
      wrap.append(h('div', { class: 'sn-chips', id: 'snNos', role: 'group', 'aria-label': '選手で しぼりこむ' }, C.players.map((c) =>
        h('button', { class: 'sn-chip' + (c.on ? ' on' : '') + (c.n ? '' : ' zero'), 'aria-pressed': c.on ? 'true' : 'false', title: c.name || null, dataset: { snno: c.key },
          onclick: () => { st.f.nos = c.nos ? c.nos.slice() : null; st.title = null; render(); } }, c.label, h('small', null, String(c.n))))));
    }
    // 2つの大きなボタン
    const on = scs.filter((s) => s.on);
    const canExp = !!BS.exportSupport();
    E.playAll = h('button', { class: 'btn primary sn-big', id: 'snPlayAll', disabled: !vid || !on.length || !!st.exp, onclick: () => (st.play && st.play.mode === 'reel' ? stopPlay(true) : playReel(reelOf(on, S.prefs.reelMax), 0)) }, '▶ 続けて再生');
    E.expBtn = h('button', { class: 'btn sn-big', id: 'snExport', disabled: !vid || !on.length || !canExp || !!st.exp, onclick: doExport }, '🎬 1本の動画にする');
    wrap.append(h('div', { class: 'sn-actions' }, E.playAll, E.expBtn));
    const why = !vid ? '動画を選ぶと、使えます' : !on.length ? (scs.length ? '入れる場面がありません（全部 外しています）' : '') : !canExp ? 'このブラウザは「1本の動画にする」に対応していません。Chrome・Safari の新しい版で使えます' : '';
    if (why) wrap.append(h('p', { class: 'note sn-why', id: 'snWhy' }, why));
    // 続けて再生のバー・書き出しの箱
    E.reelBar = h('div', { class: 'sn-reelbar', id: 'snReelBar', hidden: true });
    E.exp = h('div', { class: 'sn-exp', id: 'snExpBox', hidden: true });
    wrap.append(E.reelBar, E.exp);
    // まとめ
    const off = scs.length - on.length;
    wrap.append(h('div', { class: 'sn-sum' },
      h('b', { id: 'snSum' }, `${scs.length} 場面・${fmtLen(total(on, S.prefs.reelMax))}`),
      off ? h('span', { class: 'note' }, `（${off} 場面は外しています）`) : null,
      scs.length ? h('span', { class: 'note sn-hint' }, vid ? '押すと、その場面を見られます' : '') : null));
    // 一覧
    const detail = !!S.prefs.sceneDetail;
    E.list = h('div', { class: 'sn-list' + (detail ? ' detail' : '') + (st.exp ? ' busy' : ''), id: 'snList', role: 'list' });
    const frag = document.createDocumentFragment();
    scs.forEach((s) => {
      const row = h('div', { class: 'sn-row' + (s.on ? '' : ' off') + (s.team === 1 ? ' opp' : ''), role: 'listitem', dataset: { id: s.id }, style: { '--tc': s.color } },
        h('button', { class: 'sn-play', 'aria-label': `${s.label}（${s.sub}）を見る`, onclick: () => playOne(s) },
          h('span', { class: 'sn-tm' }, h('b', null, BT.fmtTime(s.t)), h('small', null, BT.periodLabel(s.period))),
          h('span', { class: 'chip', style: { background: s.color }, 'aria-hidden': 'true' }),
          h('span', { class: 'sn-what' }, s.who ? h('b', null, s.who) : null, h('span', null, s.what), s.on ? null : h('em', { class: 'sn-tag' }, '外した')),
          h('span', { class: 'sn-len' }, fmtLen(s.len), s.adj ? h('i', { title: '手直しした場面' }, '✎') : null),
          h('span', { class: 'sn-ic', 'aria-hidden': 'true' }, '▶')),
        detail ? h('button', { class: 'sn-edit', 'aria-label': 'この場面を手直しする', dataset: { snadj: s.id }, onclick: () => openAdj(s.id) }, '✎') : null);
      E.rows.set(s.id, row);
      frag.append(row);
    });
    E.list.append(frag);
    wrap.append(E.list);
    if (!scs.length) {
      wrap.append(h('div', { class: 'sn-none', id: 'snNone' }, h('p', null, 'この しぼりこみ の場面は、ありません。'),
        h('button', { class: 'btn', onclick: () => { st.f = ALL(); st.title = null; render(); } }, 'すべての場面を見る')));
    }
    el.append(wrap);
    el.scrollTop = keep;
    drawPlay();
    drawExp();
  }

  /* 再生中の場面（行の色・続けて再生のバー）だけを描き直す */
  function drawPlay() {
    if (!E.rows) return;
    const P = st.play;
    const ids = P ? P.ids : [];
    E.rows.forEach((row, id) => {
      const onNow = ids.indexOf(id) >= 0;
      if (row.classList.contains('on') !== onNow) {
        row.classList.toggle('on', onNow);
        const ic = row.querySelector('.sn-ic');
        if (ic) ic.textContent = onNow ? '■' : '▶';
      }
    });
    if (E.playAll) {
      const reel = !!(P && P.mode === 'reel');
      E.playAll.textContent = reel ? '■ 止める' : '▶ 続けて再生';
      E.playAll.classList.toggle('stop', reel);
    }
    const bar = E.reelBar;
    if (!bar) return;
    if (!P || P.mode !== 'reel') { bar.hidden = true; bar.innerHTML = ''; return; }
    const seg = P.segs[P.i];
    bar.hidden = false;
    bar.innerHTML = '';
    bar.append(
      h('div', { class: 'sn-rb-t' }, h('b', { id: 'snReelPos' }, `${P.i + 1} / ${P.segs.length}`), h('span', null, seg ? seg.label : '')),
      h('div', { class: 'sn-rb-b' },
        h('button', { class: 'btn small', id: 'snReelPrev', 'aria-label': '前の場面', disabled: P.i <= 0, onclick: () => jumpReel(-1) }, '⏮'),
        h('button', { class: 'btn small', id: 'snReelNext', 'aria-label': '次の場面', disabled: P.i >= P.segs.length - 1, onclick: () => jumpReel(1) }, '⏭'),
        h('button', { class: 'btn small danger', id: 'snReelStop', onclick: () => stopPlay(true) }, '■ やめる')));
  }
  /* いま再生している行が見えるように（タブの中だけを動かす） */
  function follow(id) {
    const pane = st.el, row = E.rows && E.rows.get(id);
    if (!pane || !row || !visible()) return;
    const r = row.getBoundingClientRect(), p = pane.getBoundingClientRect();
    const top = p.top + (E.reelBar && !E.reelBar.hidden ? E.reelBar.offsetHeight + 6 : 0);
    if (r.top < top) pane.scrollTop += r.top - top - 6;
    else if (r.bottom > p.bottom) pane.scrollTop += r.bottom - p.bottom + 6;
  }

  /* ---------- 見る ---------- */
  function needVideo() { toast('動画を選ぶと、場面を見られます', 'warn', 5000, { label: '動画を選ぶ', onClick: () => A.pickVideo() }); }
  function stopPlay(pause) {
    if (!st.play) return;
    st.play = null; token++;
    A.stopRange();
    if (pause) A.pause();
    drawPlay();
  }
  async function playOne(s) {
    if (st.exp) return;
    if (!A.hasVideo()) { needVideo(); return; }
    if (st.play && st.play.mode === 'one' && st.play.ids[0] === s.id) { stopPlay(true); return; }
    const my = ++token;
    st.play = { mode: 'one', ids: [s.id] };
    drawPlay();
    await A.playRange(s.t0, s.t1);
    if (my !== token) return;
    st.play = null;
    drawPlay();
  }
  async function playReel(segs, from) {
    if (st.exp || !segs.length) return;
    if (!A.hasVideo()) { needVideo(); return; }
    const my = ++token;
    const P = st.play = { mode: 'reel', segs, i: from || 0, ids: [] };
    while (st.play === P && P.i < segs.length) {
      const seg = segs[P.i];
      P.ids = seg.ids;
      drawPlay();
      follow(seg.ids[0]);
      const r = await A.playRange(seg.t0, seg.t1);
      if (my !== token) return;
      if (r !== 'end') break;
      P.i++;
    }
    if (my !== token) return;
    const all = P.i >= segs.length;
    st.play = null;
    drawPlay();
    if (all && segs.length > 1) toast('最後まで見ました', 'ok');
  }
  function jumpReel(d) {
    const P = st.play;
    if (!P || P.mode !== 'reel') return;
    const i = BT.clamp(P.i + d, 0, P.segs.length - 1);
    playReel(P.segs, i);
  }

  /* ---------- 1本の動画にする ---------- */
  function expName() { return BT.safeName(st.title || describe(S.game, st.f)).replace(/#/g, '') || 'すべて'; }
  async function doExport() {
    const g = S.game, m = S.media;
    if (st.exp || !g || !A.hasVideo()) return;
    const segs = reelOf(scenesNow().filter((s) => s.on), S.prefs.reelMax);
    if (!segs.length) { toast('動画にする場面がありません', 'warn'); return; }
    stopPlay(true);
    const clips = segs.map((s) => ({ t0: s.t0, t1: s.t1, label: s.label, sub: s.sub, color: s.color }));
    const secs = clips.reduce((a, c) => a + c.t1 - c.t0, 0) + (S.prefs.cards !== false ? 4.7 : 0);
    const ctrl = new AbortController();
    if (st.out) { try { URL.revokeObjectURL(st.out.url); } catch (e) { /* 無視 */ } st.out = null; }
    const what = st.title || describe(g, st.f), vs = `${BT.teamName(g, 0)} vs ${BT.teamName(g, 1)}`;
    const n = segs.reduce((a, s) => a + s.ids.length, 0);
    st.exp = { ctrl, frac: 0, label: 'はじめの画面', secs };
    render();
    const app = BS.APP;
    BS.APP = SC.APP || app;      // 終わりの画面の下に出るアプリの名前
    try {
      const res = await BS.exportReel(m, clips, {
        title: [what, vs, `${n} 場面`], end: [`${what} ${n} 場面`, vs], accent: (g.teams[0] && g.teams[0].color) || '#2f6fed',
        captions: S.prefs.captions !== false, cards: S.prefs.cards !== false
      }, (frac, label) => { if (st.exp) { st.exp.frac = frac; st.exp.label = label; drawExpProgress(); } }, ctrl.signal);
      if (S.game !== g) return;
      if (res) {
        res.name = `${BT.fileBase(g)}_${expName()}_${n}場面.${res.ext}`;
        st.out = res;
        toast('動画ができました。「⬇ 保存する」で保存できます', 'ok', 5000);
      } else toast('動画づくりを やめました', 'warn');
    } catch (err) {
      console.warn('[scenes export]', err);
      toast('動画を作れませんでした：' + ((err && err.message) || err), 'err', 8000);
    } finally {
      BS.APP = app;
      if (S.game === g) { st.exp = null; render(); }
    }
  }
  function drawExpProgress() {
    const X = st.exp;
    if (!X || !E.exp) return;
    const bar = E.exp.querySelector('#snExpBar'), lab = E.exp.querySelector('#snExpLabel');
    if (bar) bar.style.width = (X.frac * 100).toFixed(1) + '%';
    if (lab) lab.textContent = `${X.label}（${Math.round(X.frac * 100)}%）`;
  }
  function drawExp() {
    const box = E.exp;
    if (!box) return;
    box.innerHTML = '';
    if (st.exp) {
      box.hidden = false;
      box.append(
        h('div', { class: 'sn-exp-h' }, h('b', null, '🎬 動画を作っています'), h('span', { id: 'snExpLabel', class: 'note' }, '')),
        h('div', { class: 'sn-prog', role: 'progressbar', 'aria-label': '動画づくりの進み' }, h('i', { id: 'snExpBar' })),
        h('p', { class: 'note' }, `動画を再生しながら作るので、できる動画と同じくらい（約 ${fmtLen(st.exp.secs)}）かかります。このまま お待ちください。`),
        h('div', { class: 'row' }, h('button', { class: 'btn', id: 'snExpCancel', onclick: () => st.exp && st.exp.ctrl.abort() }, 'やめる')));
      drawExpProgress();
      return;
    }
    if (st.out) {
      const r = st.out;
      box.hidden = false;
      box.append(
        h('div', { class: 'sn-exp-h' }, h('b', null, '✅ 動画ができました'), h('span', { class: 'note' }, `${fmtLen(r.seconds)}・${(r.blob.size / 1048576).toFixed(1)} MB`)),
        h('div', { class: 'row' },
          h('button', { class: 'btn primary', id: 'snExpSave', onclick: saveOut }, '⬇ 保存する'),
          h('button', { class: 'btn', id: 'snExpClose', onclick: () => { try { URL.revokeObjectURL(r.url); } catch (e) { /* 無視 */ } st.out = null; drawExp(); } }, '閉じる')),
        h('p', { class: 'note' }, r.ext === 'webm' ? 'WebM の形です。iPhone で見るときは、MP4 に変えることが あります。' : 'MP4 の形です。スマホ・LINE でも見られます。'));
      return;
    }
    box.hidden = true;
  }
  async function saveOut() {
    const r = st.out;
    if (!r) return;
    const res = await BT.ui.shareOrDownload(r.name, r.blob, BT.ui.canShareFiles());
    if (res === 'downloaded') toast(`保存しました：${r.name}`, 'ok', 4000);
  }

  /* ---------- 場面の手直し（設定で「✎」を出したときだけ） ---------- */
  function openAdj(id) {
    const g = S.game;
    if (!g || !BT.findEvent(g, id)) return;
    const body = h('div', { class: 'sn-adj', id: 'snAdj' });
    const s = BT.ui.sheet({ title: '場面の手直し', body, cls: 'sn-adj-sheet' });
    const changed = () => { A.save(); draw(); };
    const draw = () => {
      const e = BT.findEvent(g, id);
      if (!e || S.game !== g) { s.close(); return; }
      const d = A.dur(), sc = scene(g, S.prefs, e, d), b = baseWindow(g, S.prefs, e, d), can = canAdjust(g, S.prefs, e, d);
      const step = (bid, label, k, delta, ok) => h('button', { class: 'btn', id: bid, disabled: !ok, onclick: () => { if (adjust(g, S.prefs, id, k, delta, d)) changed(); } }, label);
      body.innerHTML = '';
      body.append(
        h('p', { class: 'sn-adj-what' }, h('span', { class: 'chip', style: { background: sc.color } }), h('b', null, sc.label), h('small', { class: 'note' }, `${BT.periodLabel(sc.period)}・記録 ${BT.fmtTime(sc.t)}`)),
        h('div', { class: 'sn-adj-grid' },
          h('span', { class: 'k' }, 'はじめ'), step('snS0m', '◀ 1秒前', 'd0', -1, can.s0m), h('b', { class: 'v', id: 'snAdjT0' }, BT.fmtTime(sc.t0)), step('snS0p', '1秒後 ▶', 'd0', 1, can.s0p),
          h('span', { class: 'k' }, 'おわり'), step('snS1m', '◀ 1秒前', 'd1', -1, can.s1m), h('b', { class: 'v', id: 'snAdjT1' }, BT.fmtTime(sc.t1)), step('snS1p', '1秒後 ▶', 'd1', 1, can.s1p)),
        h('p', { class: 'sn-adj-len' }, '長さ ', h('b', { id: 'snAdjLen' }, fmtLen(sc.len)), sc.adj ? h('span', { class: 'note' }, `（はじめは ${fmtLen(b.t1 - b.t0)}）`) : null,
          sc.on ? null : h('span', { class: 'sn-tag' }, '外しています')),
        h('div', { class: 'row sn-adj-btns' },
          h('button', { class: 'btn primary', id: 'snAdjPlay', onclick: () => playOne(scene(g, S.prefs, e, A.dur())) }, '▶ 見る'),
          h('button', { class: 'btn', id: 'snAdjReset', disabled: !sc.adj, onclick: () => { resetAdj(g, id); changed(); } }, 'はじめに戻す'),
          h('button', { class: 'btn', id: 'snAdjOff', onclick: () => { setOff(g, id, sc.on); changed(); } }, sc.on ? 'この場面を外す' : 'この場面を入れる'),
          SC.tap && typeof SC.tap.edit === 'function' ? h('button', { class: 'btn', id: 'snAdjEdit', onclick: () => { s.close(); SC.tap.edit(id); } }, '記録を直す') : null),
        h('p', { class: 'note' }, '外した場面は、「続けて再生」と「1本の動画」に入りません（一覧には残ります）。'));
    };
    draw();
  }

  /* ---------- 設定：場面の長さ・動画 ---------- */
  function renderSettings(box, redraw) {
    const p = S.prefs;
    p.win = p.win || { lead: 10, lag: 2, by: {} };
    p.win.by = p.win.by || {};
    const outs = [];
    const val = (grp, k) => (grp ? TL.winFor(p.win, grp)[k] : +p.win[k]);
    const set = (grp, k, v) => {
      if (grp) { const cur = TL.winFor(p.win, grp); p.win.by[grp] = { lead: cur.lead, lag: cur.lag }; p.win.by[grp][k] = v; } else p.win[k] = v;
      A.savePrefs();
      outs.forEach((f) => f());
    };
    const stepper = (grp, k) => {
      const id = `snWin-${grp || 'base'}-${k}`;
      const out = h('output', { class: 'sn-sv', id: id + '-v' });
      const minus = h('button', { class: 'btn sn-sb', 'aria-label': (k === 'lead' ? '前' : '後') + 'を 1秒 みじかく', dataset: { d: '-1' }, onclick: () => set(grp, k, Math.max(0, val(grp, k) - 1)) }, '−');
      const plus = h('button', { class: 'btn sn-sb', 'aria-label': (k === 'lead' ? '前' : '後') + 'を 1秒 長く', dataset: { d: '1' }, onclick: () => set(grp, k, Math.min(LIM[k], val(grp, k) + 1)) }, '＋');
      const draw = () => { const v = val(grp, k); out.textContent = v + '秒'; minus.disabled = v <= 0; plus.disabled = v >= LIM[k]; };
      outs.push(draw); draw();
      return h('span', { class: 'sn-step', id }, h('small', null, k === 'lead' ? '前' : '後'), minus, out, plus);
    };
    const by = h('details', { class: 'sn-by', id: 'snWinBy', open: st.byOpen, ontoggle: (e) => { st.byOpen = e.target.open; } },
      h('summary', null, 'プレーごとに変える'),
      h('div', { class: 'sn-bylist' }, WGROUPS.map(([grp, label]) => h('div', { class: 'sn-win', dataset: { grp } }, h('b', null, label), stepper(grp, 'lead'), stepper(grp, 'lag')))));
    box.append(
      h('p', { class: 'note' }, '1つの場面は、記録した所（タップした時刻）の 前 と 後 です。'),
      h('div', { class: 'sn-win base' }, h('b', null, 'ふつうの場面'), stepper(null, 'lead'), stepper(null, 'lag')),
      by,
      h('div', { class: 'row' }, h('button', { class: 'btn small', id: 'snWinReset', onclick: () => { p.win = JSON.parse(JSON.stringify(SC.store.DEFAULTS.win)); A.savePrefs(); redraw(); } }, 'はじめの長さに戻す')),
      A.ui.check(p, 'captions', '動画に、だれの・何のプレーかの札を入れる'),
      A.ui.check(p, 'cards', 'はじめと終わりの札を入れる'),
      A.ui.check(p, 'sceneDetail', '場面ごとの細かい手直し（✎）を出す'));
  }

  /* ---------- 土台とのやりとり ---------- */
  function show(arg) {
    const a = arg || null;
    if (a && a.filter) { st.f = cleanFilter(a.filter); st.title = a.title || describe(S.game, st.f); }
    else if (a && a.title) st.title = a.title;
    if (a && a.focus && S.game && !list(S.game, S.prefs, st.f, A.dur()).some((s) => s.id === a.focus)) { st.f = ALL(); st.title = null; }
    if (a || st.dirty) render();
    if (!a) return;
    if (a.focus && E.rows) {
      const row = E.rows.get(a.focus);
      if (row) {
        row.classList.add('focus');
        setTimeout(() => row.classList.remove('focus'), 2600);
        requestAnimationFrame(() => { const p = st.el.getBoundingClientRect(), r = row.getBoundingClientRect(); st.el.scrollTop += r.top - p.top - Math.max(0, (p.height - r.height) / 2); });
      }
    }
    if (a.play === 'first') { const s = scenesNow()[0]; if (s) playOne(s); }
    else if (a.play === 'reel') { const on = scenesNow().filter((s) => s.on); if (on.length) playReel(reelOf(on, S.prefs.reelMax), 0); }
  }
  function hide() { if (st.play) stopPlay(true); }
  function badge() { const g = S.game; const n = g ? g.events.filter(isPlay).length : 0; return n ? String(n) : ''; }
  const refresh = () => { st.dirty = true; if (visible()) render(); };

  A.panel('scenes', { mount, show, hide, badge });
  A.settings({ id: 'scenes', title: '② 場面の長さ・動画', order: 30, render: renderSettings });
  A.on('change', () => { if (S.game) refresh(); });
  A.on('prefs', () => { if (S.game) refresh(); });
  A.on('media', () => { if (S.game) refresh(); });
  A.on('open', () => {
    token++; st.play = null; st.f = ALL(); st.title = null;
    if (st.exp) { st.exp.ctrl.abort(); st.exp = null; }
    if (st.out) { try { URL.revokeObjectURL(st.out.url); } catch (e) { /* 無視 */ } st.out = null; }
    st.dirty = true;
  });
  A.on('home', () => { token++; st.play = null; if (st.exp) st.exp.ctrl.abort(); });

  SC.scenes = {
    core,
    /* しぼりこんだ場面（filter：{ types, nos, team }。null は全部） */
    list: (filter) => list(S.game, S.prefs, filter || null, A.dur()),
    /* その記録の場面の { t0, t1 } */
    windowOf: (ev) => { const e = ev && typeof ev === 'object' ? ev : S.game && BT.findEvent(S.game, ev); if (!e || !S.game) return null; const w = windowOf(S.game, S.prefs, e, A.dur()); return { t0: w.t0, t1: w.t1 }; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
