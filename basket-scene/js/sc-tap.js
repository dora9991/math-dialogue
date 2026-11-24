/* バスケ シーン — タブ「① 記録」（動画を見ながら、プレーと背番号をタップ）
   ・自分のチーム：プレー1つ ＋ 背番号1つ（どちらが先でもよい）で1つの記録。時刻は「はじめに押したとき」の動画の時刻
   ・相手：「+1」「+2」「+3」を1回押すだけ（team: 1・no: null・ft / fg2 / fg3）
   ・★ あとで見る：1回押すだけ（チームなし）
   ・下の帯：いちばん新しい記録（取り消す・やり直す・▶ 見る。帯を押すと直す小窓）
   ・📋 記録の一覧 → 押すと直す小窓（SC.tap.edit(id)。② 場面からも呼ぶ）
   ・シュートの場所（設定でオン）：2P・3P（×も）のあと、コートの図を1回押す

   ■ 記録の形（BT.addEvent）
     自分のプレー  { t, type: 'fg2'|'fg2x'|'fg3'|'fg3x'|'ft'|'ftx'|'oreb'|'dreb'|'reb'|'ast'|'stl'|'blk'|'tov'|'foul', team: 0, no: '7' | null（？）}
                   シュートの場所を押したら x・y（0〜1・0.001 まで）。game.court がなければ prefs.courtType
     相手の得点    { t, type: 'ft'|'fg2'|'fg3', team: 1, no: null }
     ★ あとで見る  { t, type: 'mark', team: null, no: null }

   SC.tap.logic（画面を持たない部分。node のテストからも読める）：plays(rec)・numCols(n, W, min, gap)・step(pick, tap, t)・OPP */
(function (root) {
  'use strict';
  const BT = root.BT, BS = root.BS;
  const SC = root.SC = root.SC || {};
  const KEEP = 20;           // 選びかけを覚えておく、動画の時刻の幅（秒）

  /* ---------- 画面を持たない部分 ---------- */
  /* 設定で入っているプレーのボタン（この順） */
  function plays(rec) {
    const r = rec || {};
    const on = (k) => r[k] !== false;
    const out = ['fg2'];
    if (on('miss')) out.push('fg2x');
    out.push('fg3');
    if (on('miss')) out.push('fg3x');
    out.push('ft');
    if (on('miss')) out.push('ftx');
    if (on('reb')) { if (on('rebSplit')) out.push('oreb', 'dreb'); else out.push('reb'); }
    if (on('ast')) out.push('ast');
    if (on('stl')) out.push('stl');
    if (on('blk')) out.push('blk');
    if (on('tov')) out.push('tov');
    if (on('foul')) out.push('foul');
    return out;
  }
  /* n こ のボタンを、幅 W に並べるときの列の数（1つの幅は min 以上。段ごとの数が、なるべくそろうように） */
  function numCols(n, W, min, gap) {
    if (n <= 0) return 1;
    const maxC = Math.max(1, Math.floor((W + gap) / (min + gap)));
    const rows = Math.ceil(n / maxC);
    return Math.ceil(n / rows);
  }
  /* 選びかけ pick（{ type, no, has（'type'|'no'）, t } | null）に、tap（{ type } | { no }）を足す。
     → { pick: 次の選びかけ | null, rec: 記録するもの { type, no, t } | null, cancel: 取りやめたか } */
  function step(pick, tap, t) {
    const isType = Object.prototype.hasOwnProperty.call(tap, 'type');
    if (!pick) return { pick: isType ? { type: tap.type, has: 'type', t } : { no: tap.no, has: 'no', t }, rec: null, cancel: false };
    if (isType) {
      if (pick.has === 'type') return pick.type === tap.type ? { pick: null, rec: null, cancel: true } : { pick: Object.assign({}, pick, { type: tap.type }), rec: null, cancel: false };
      return { pick: null, rec: { type: tap.type, no: pick.no, t: pick.t }, cancel: false };
    }
    if (pick.has === 'no') return pick.no === tap.no ? { pick: null, rec: null, cancel: true } : { pick: Object.assign({}, pick, { no: tap.no }), rec: null, cancel: false };
    return { pick: null, rec: { type: pick.type, no: tap.no, t: pick.t }, cancel: false };
  }
  const OPP = { 1: 'ft', 2: 'fg2', 3: 'fg3' };
  const logic = { KEEP, plays, numCols, step, OPP };
  if (!SC.app || typeof document === 'undefined') { SC.tap = { logic }; return; }

  /* ---------- 画面 ---------- */
  const A = SC.app, S = A.S, { h } = BT.ui;
  const fmt = BT.fmtTime, ft = (t) => BT.fmtTime(t, true);
  /* ボタンの文字：[ふつう, 狭いとき, 読み上げ] */
  const LAB = {
    fg2: ['2P', '2P', '2P 成功'], fg2x: ['2P×', '2P×', '2P 失敗'], fg3: ['3P', '3P', '3P 成功'], fg3x: ['3P×', '3P×', '3P 失敗'],
    ft: ['FT', 'FT', 'フリースロー 成功'], ftx: ['FT×', 'FT×', 'フリースロー 失敗'],
    oreb: ['Oリバ', 'OR', 'オフェンスリバウンド'], dreb: ['Dリバ', 'DR', 'ディフェンスリバウンド'], reb: ['リバ', 'リバ', 'リバウンド'],
    ast: ['アシスト', 'AS', 'アシスト'], stl: ['スティール', 'ST', 'スティール'], blk: ['ブロック', 'BLK', 'ブロック'],
    tov: ['ターンオーバー', 'TO', 'ターンオーバー'], foul: ['ファウル', 'F', 'ファウル']
  };
  const lab = (type) => (LAB[type] || [(BT.TYPE[type] || {}).label || type])[0];
  const P = { el: null, root: null, pick: null, playing: false, redo: [], gid: null, watching: null, ro: null, flash: null };

  const game = () => S.game;
  const hasNo = (g) => g.teams[0].players.length > 0;
  const nos = (g) => BT.sortNos(g.teams[0].players.map((p) => p.no));
  const who = (g, e) => {
    if (e.team === 1) return BT.teamName(g, 1);
    if (e.team === 0) return e.no != null ? '#' + e.no + (BT.playerName(g, 0, e.no) ? ' ' + BT.playerName(g, 0, e.no) : '') : hasNo(g) ? '？' : BT.teamName(g, 0);
    return '';
  };
  const what = (e) => (BT.TYPE[e.type] || { label: e.type }).label;
  const pickText = (pk) => (pk.has === 'type' ? lab(pk.type) : pk.no != null ? '#' + pk.no : '？');
  const winOf = (e) => BS.taplog.winFor(S.prefs.win, (BS.taplog.TYPES[e.type] || { grp: 'mark' }).grp);
  const records = (g) => g.events.filter((e) => e.type !== 'period');
  const last = (g) => { const r = records(g); return r[r.length - 1] || null; };

  /* ---------- 記録する ---------- */
  function needVideo() {
    if (A.hasVideo()) return false;
    BT.ui.toast('記録するには、先に試合の動画を選んでください', 'warn', 4000, { label: '動画を選ぶ', onClick: () => A.pickVideo() });
    return true;
  }
  function add(ev) {
    const g = game();
    if (P.gid !== g.id) { P.gid = g.id; P.redo = []; }
    const e = BT.addEvent(g, ev);
    P.redo = [];
    BT.ui.haptic();
    A.save();
    P.flash = e.id;
    drawLast();
    return e;
  }
  function resume() { const w = P.playing; P.playing = false; if (w && A.hasVideo()) A.play(); }
  function tapOurs(tap) {
    if (needVideo()) return;
    const was = P.pick;
    const t = A.now();
    if (!was && S.prefs.autoPause && A.hasVideo() && !S.media.paused) { P.playing = true; A.pause(); }
    const r = step(was, tap, t);
    P.pick = r.pick;
    if (r.rec) {
      const e = add({ t: r.rec.t, type: r.rec.type, team: 0, no: r.rec.no });
      if (S.prefs.shotLoc && BT.isLocShot(e.type)) askLoc(e);
      else resume();
    } else if (r.cancel) resume();
    drawPick();
  }
  function dropPick(why) {
    const pk = P.pick;
    if (!pk) return;
    P.pick = null;
    P.playing = false;
    drawPick();
    BT.ui.toast(`選びかけ（${pickText(pk)}）をやめました${why ? '：' + why : ''}`, 'warn', 4000);
  }
  function tapOpp(pts) {
    if (needVideo()) return;
    add({ t: A.now(), type: OPP[pts], team: 1, no: null });
  }
  function tapMark() {
    if (needVideo()) return;
    add({ t: A.now(), type: 'mark', team: null, no: null });
  }
  function undo() {
    const g = game(), e = g && last(g);
    if (!e) return;
    if (P.gid !== g.id) { P.gid = g.id; P.redo = []; }
    BT.removeEvent(g, e.id);
    P.redo.push(e);
    A.save();
    drawLast();
    BT.ui.toast(`取り消しました：${fmt(e.t)} ${who(g, e)} ${what(e)}`.replace(/\s+/g, ' '), 'ok', 3500, { label: 'やり直す', onClick: redo });
  }
  function redo() {
    const g = game();
    if (!g || P.gid !== g.id || !P.redo.length) return;
    const e = P.redo.pop();
    g.events.push(e);
    A.save();
    P.flash = e.id;
    drawLast();
  }
  /* その記録の場面を、その場で再生（もう一度押すと止める） */
  function watch(e, after) {
    if (!e) return;
    if (P.watching === e.id) { A.stopRange(); return; }
    if (!A.hasVideo()) { needVideo(); return; }
    const w = winOf(e);
    P.watching = e.id;
    drawLast();
    A.playRange(e.t - w.lead, e.t + w.lag).then((r) => { if (P.watching === e.id) P.watching = null; drawLast(); if (after) after(r); });
  }

  /* ---------- シュートの場所 ---------- */
  function courtNow(g) { return g.court ? BT.courtOf(g) : S.prefs.courtType === 'mini' ? 'mini' : 'std'; }
  function setLoc(g, e, x, y) { e.x = BT.locRound(x); e.y = BT.locRound(y); if (!g.court) g.court = S.prefs.courtType === 'mini' ? 'mini' : 'std'; }
  function askLoc(ev) {
    const g = game(), court = courtNow(g);
    if (A.hasVideo() && !S.media.paused) { P.playing = true; A.pause(); }
    let done = false;
    const fin = () => { if (done) return; done = true; resume(); };
    const svg = BT.shot.court({ court, label: 'コートの図（ゴールが上）。打った場所を押す', onTap: (x, y) => {
      const e = BT.findEvent(g, ev.id);
      if (e && S.game === g) { setLoc(g, e, x, y); A.save(); drawLast(); BT.ui.toast('📍 ' + BT.shotZone(e.x, e.y, BT.courtOf(g)).label, 'ok', 2500); }
      s.close();
    } });
    const body = h('div', { class: 'tp-shot', id: 'tpShot' },
      h('div', { class: 'tp-court tp-shotcourt' }, svg),
      h('div', { class: 'tp-shotside' },
        h('p', { class: 'note' }, '打った場所を1回押してください（ゴールが上）'),
        h('button', { class: 'btn', id: 'tpShotLater', onclick: () => s.close() }, 'あとで')));
    const s = BT.ui.sheet({ title: `${who(g, ev)} ${what(ev)}：どこから？`, body, cls: 'tp-shotsheet', onClose: fin });
  }

  /* ---------- 直す小窓 ---------- */
  function openSheet() { A.stopRange(); A.pause(); }
  function edit(id, opts) {
    const g = game();
    const e = g && BT.findEvent(g, id);
    if (!e || e.type === 'period') return false;
    const o = opts || {};
    openSheet();
    const box = h('div', { class: 'tp-edit', id: 'tpEdit', dataset: { eid: e.id } });
    const changed = () => { A.save(); drawLast(); draw(); };
    const s = BT.ui.sheet({ title: '記録を直す', body: box, cls: 'tp-sheet',
      foot: [o.back ? h('button', { class: 'btn', id: 'tpEditBack', onclick: () => list() }, '‹ 一覧にもどる') : null, h('button', { class: 'btn primary', id: 'tpEditDone', onclick: () => s.close() }, '閉じる')].filter(Boolean) });
    function nudge(d) { e.t = Math.round(BT.clamp(e.t + d, 0, A.dur() || Infinity) * 10) / 10; changed(); }
    function draw() {
      const keep = s.body.scrollTop;
      box.innerHTML = '';
      const opp = e.team === 1, ours = e.team === 0;
      const sec = (title, ...kids) => h('section', { class: 'tp-esec' }, h('h4', null, title), ...kids);
      box.append(h('p', { class: 'tp-esum', id: 'tpEditSum' },
        h('b', null, ft(e.t)), h('span', { class: 'tp-per' }, BT.periodLabel(BT.periodAt(g, e.t))), h('span', null, `${who(g, e)} ${what(e)}`.trim()),
        BT.hasLoc(e) ? h('span', { class: 'tp-zone' }, '📍 ' + BT.shotZone(e.x, e.y, BT.courtOf(g)).label) : null));
      if (opp) {
        box.append(sec(`${BT.teamName(g, 1)}の得点`, h('div', { class: 'tp-egrid tp-e3' }, [1, 2, 3].map((p) => h('button', { class: 'btn tp-ebtn' + (OPP[p] === e.type ? ' on' : ''), dataset: { epts: p }, 'aria-pressed': OPP[p] === e.type ? 'true' : 'false', onclick: () => { e.type = OPP[p]; changed(); } }, '+' + p)))));
      }
      if (ours) {
        const list = nos(g).map((no) => [no, '#' + no]).concat([[null, hasNo(g) ? '？' : 'チーム']]);
        if (e.no != null && !list.some(([n]) => n === e.no)) list.unshift([e.no, '#' + e.no]);
        box.append(sec('背番号', h('div', { class: 'tp-egrid tp-enos' }, list.map(([no, l]) => h('button', { class: 'btn tp-ebtn' + (e.no === no ? ' on' : ''), dataset: { eno: no == null ? '' : no }, 'aria-pressed': e.no === no ? 'true' : 'false', onclick: () => { e.no = no; changed(); } }, l)))));
        const types = plays(S.prefs.rec);
        if (!types.includes(e.type)) types.push(e.type);
        box.append(sec('プレー', h('div', { class: 'tp-egrid tp-etypes' }, types.map((ty) => h('button', { class: 'tp-pt tp-k-' + ty + (BT.TYPE[ty].made === false ? ' tp-miss' : '') + (e.type === ty ? ' tp-sel' : ''), dataset: { etype: ty }, 'aria-pressed': e.type === ty ? 'true' : 'false', 'aria-label': (LAB[ty] || [])[2] || what({ type: ty }), onclick: () => { e.type = ty; if (!BT.isLocShot(ty)) { delete e.x; delete e.y; } changed(); } }, ty === 'tov' ? h('b', null, 'ターン', h('br'), 'オーバー') : h('b', null, lab(ty)))))));
      }
      const nb = (d) => h('button', { class: 'btn tp-nudge', dataset: { nudge: String(d) }, onclick: () => nudge(d) }, (d > 0 ? '+' : '−') + Math.abs(d));
      box.append(sec('時刻（動画の時刻）',
        h('div', { class: 'tp-time' }, nb(-5), nb(-1), nb(-0.5), h('b', { class: 'tp-tnow', id: 'tpEditTime' }, ft(e.t)), nb(0.5), nb(1), nb(5)),
        h('div', { class: 'tp-erow' },
          h('button', { class: 'btn', id: 'tpNow', disabled: !A.hasVideo(), onclick: () => { e.t = A.now(); changed(); } }, `いまの動画の時刻にする（${ft(A.now())}）`),
          h('button', { class: 'btn', id: 'tpEditWatch', disabled: !A.hasVideo(), onclick: () => { s.close(); watch(e, (r) => { if (r === 'end' && !BT.ui.sheetOpen() && BT.findEvent(g, e.id)) edit(e.id, o); }); } }, '▶ この場面を見る'))));
      if (ours && BT.isLocShot(e.type) && (S.prefs.shotLoc || BT.hasLoc(e) || o.loc)) box.append(locField(g, e, changed));
      else if (ours && BT.isLocShot(e.type)) box.append(h('button', { class: 'linkbtn', id: 'tpLocOpen', onclick: () => { o.loc = true; draw(); } }, '📍 シュートの場所を付ける'));
      box.append(h('div', { class: 'tp-erow tp-edel' }, h('button', { class: 'btn danger', id: 'tpDel', onclick: () => del(e) }, '🗑 この記録を消す')));
      s.body.scrollTop = keep;
    }
    draw();
    return true;
  }
  function locField(g, e, changed) {
    const court = courtNow(g), has = BT.hasLoc(e);
    const svg = BT.shot.court({ court, label: 'コートの図。押した所を、この記録の場所にする', shots: has ? [{ x: e.x, y: e.y, made: !!BT.TYPE[e.type].made, color: g.teams[0].color }] : [],
      onTap: (x, y) => { setLoc(g, e, x, y); changed(); } });
    return h('section', { class: 'tp-esec', id: 'tpEditLoc' },
      h('h4', null, has ? `場所：📍 ${BT.shotZone(e.x, e.y, court).label}（押すと動かせます）` : '場所：まだありません（コートを押すと付けられます）'),
      h('div', { class: 'tp-locrow' }, h('div', { class: 'tp-court tp-loccourt' }, svg),
        has ? h('button', { class: 'btn small', id: 'tpLocClear', onclick: () => { delete e.x; delete e.y; changed(); } }, '場所を消す') : null));
  }
  function del(e) {
    const g = game();
    const i = g.events.indexOf(e);
    BT.removeEvent(g, e.id);
    A.save();
    drawLast();
    BT.ui.closeSheet();
    BT.ui.toast(`消しました：${fmt(e.t)} ${who(g, e)} ${what(e)}`.replace(/\s+/g, ' '), 'ok', 4500, { label: 'もとに戻す', onClick: () => { if (S.game !== g || BT.findEvent(g, e.id)) return; g.events.splice(Math.min(i, g.events.length), 0, e); A.save(); drawLast(); } });
  }

  /* ---------- 背番号を足す（記録の途中で、名簿にない番号が出たとき。設定の「チーム・背番号」と同じマス） ---------- */
  function addNo() {
    const g = game();
    if (!g) return;
    A.stopRange();
    const t = g.teams[0];
    const grid = A.ui.noGrid(() => t.players.map((p) => p.no), (list) => { t.players = BT.playersFromNos(list, t.players); SC.store.saveTeam(t); A.save(); A.emit('team'); });
    const s = BT.ui.sheet({
      title: '背番号を足す',
      body: h('div', { class: 'sc-form' }, grid.el, h('p', { class: 'note' }, '押した番号が、記録のボタンに入ります（もう一度押すと外れます。記録ずみのものは消えません）。')),
      foot: [h('button', { class: 'btn primary', id: 'tpAddDone', onclick: () => s.close() }, '閉じる')]
    });
  }

  /* ---------- 記録の一覧 ---------- */
  function list() {
    const g = game();
    if (!g) return;
    openSheet();
    const rs = records(g).map((e, i) => ({ e, i })).sort((a, b) => (b.e.t - a.e.t) || (b.i - a.i)).map((x) => x.e);
    const lastId = (last(g) || {}).id;
    const row = (e) => h('button', { class: 'tp-lrow' + (e.team === 1 ? ' tp-opp' : e.team == null ? ' tp-free' : '') + (e.id === lastId ? ' tp-new' : ''), dataset: { eid: e.id }, onclick: () => edit(e.id, { back: true }) },
      h('span', { class: 'tp-lt' }, fmt(e.t)), h('span', { class: 'tp-per' }, BT.periodLabel(BT.periodAt(g, e.t))),
      h('span', { class: 'tp-lw' }, h('i', { class: 'tp-dot tp-k-' + e.type, 'aria-hidden': 'true' }), who(g, e) ? h('b', null, who(g, e)) : null, ' ', what(e),
        BT.hasLoc(e) ? h('small', { class: 'tp-zone' }, '📍 ' + BT.shotZone(e.x, e.y, BT.courtOf(g)).label) : null),
      h('span', { class: 'tp-arr', 'aria-hidden': 'true' }, '›'));
    BT.ui.sheet({ title: `記録の一覧（${rs.length}件）`, cls: 'tp-sheet',
      body: h('div', { class: 'tp-list', id: 'tpListSheet' }, rs.length ? [h('p', { class: 'note' }, '動画の時刻の新しい順。押すと直せます。'), rs.map(row)] : h('p', { class: 'note' }, 'まだ記録はありません。プレーと背番号をタップすると、ここに並びます。')) });
  }

  /* ---------- パネル ---------- */
  function build() {
    const el = P.el, g = game();
    if (!el) return;
    if (P.ro) { P.ro.disconnect(); P.ro = null; }
    el.innerHTML = '';
    if (!g) return;
    const rec = S.prefs.rec || {};
    const types = plays(rec);
    const shots = types.filter((t) => BT.TYPE[t].shot), other = types.filter((t) => !BT.TYPE[t].shot);
    const pt = (type) => h('button', { class: 'tp-pt tp-k-' + type + (BT.TYPE[type].made === false ? ' tp-miss' : ''), dataset: { type }, 'aria-label': LAB[type][2], title: LAB[type][2], onclick: () => tapOurs({ type }) }, h('b', null, LAB[type][0]));
    const numBtn = (no, label, aria) => h('button', { class: 'tp-no' + (no == null ? ' tp-unk' : ''), dataset: { no: no == null ? '' : no }, 'aria-label': aria, title: aria, onclick: () => tapOurs({ no }) }, label);
    const roster = nos(g);
    const W = P.W = {};
    W.hint = h('p', { class: 'tp-hint', id: 'tpHint', 'aria-live': 'polite' });
    W.plays = h('div', { class: 'tp-plays', role: 'group', 'aria-label': 'プレー' },
      h('div', { class: 'tp-prow', style: { '--tp-n': shots.length } }, shots.map(pt)),
      other.length ? h('div', { class: 'tp-prow', style: { '--tp-n': other.length } }, other.map(pt)) : null);
    W.nos = h('div', { class: 'tp-nos', role: 'group', 'aria-label': '背番号' },
      roster.map((no) => numBtn(no, no, '#' + no + (BT.playerName(g, 0, no) ? ' ' + BT.playerName(g, 0, no) : ''))),
      numBtn(null, roster.length ? '？' : 'チーム', roster.length ? '番号が分からない（？）' : 'チーム（背番号なし）'));
    W.opp = h('div', { class: 'tp-opprow', id: 'tpOpp', role: 'group', 'aria-label': '相手の得点' },
      h('span', { class: 'tp-opplab' }, h('i', { class: 'chip', style: { background: g.teams[1].color } }), h('span', null, BT.teamName(g, 1), h('span', { class: 'tp-full' }, 'の得点'))),
      [1, 2, 3].map((p) => h('button', { class: 'tp-op', dataset: { opp: p }, 'aria-label': `${BT.teamName(g, 1)}の得点 +${p}`, onclick: () => tapOpp(p) }, '+' + p)));
    W.more = h('div', { class: 'tp-more' },
      rec.mark !== false ? h('button', { class: 'tp-mark', id: 'tpMark', 'aria-label': '★ あとで見る（いまの場面に印）', title: '★ あとで見る', onclick: tapMark }, '★', h('span', { class: 'tp-full' }, ' あとで見る')) : null,
      h('button', { class: 'tp-listbtn', id: 'tpList', 'aria-label': '📋 記録の一覧', title: '記録の一覧', onclick: list }, '📋', h('span', { class: 'tp-full' }, ' 記録の一覧')),
      h('button', { class: 'tp-addno', id: 'tpAddNo', 'aria-label': '背番号を足す', title: '名簿にない背番号を足す', onclick: addNo }, '＋', h('span', { class: 'tp-full' }, ' 番号')));
    W.lastMain = h('button', { class: 'tp-lastmain', id: 'tpLast', 'aria-label': 'いちばん新しい記録（押すと直せます）', onclick: () => { const e = last(game()); if (e) edit(e.id); } });
    W.undo = h('button', { class: 'tp-lb', id: 'tpUndo', 'aria-label': 'いちばん新しい記録を取り消す', onclick: undo }, '↶ 取り消す');
    W.redo = h('button', { class: 'tp-lb', id: 'tpRedo', 'aria-label': '取り消した記録をやり直す', hidden: true, onclick: redo }, '↷');
    W.watch = h('button', { class: 'tp-lb tp-watch', id: 'tpWatch', 'aria-label': 'この場面を見る', onclick: () => watch(last(game())) }, '▶ 見る');
    W.last = h('div', { class: 'tp-last', id: 'tpLastBar' }, W.lastMain, W.redo, W.undo, W.watch);
    W.in = h('div', { class: 'tp-in' }, W.hint, W.plays, W.nos, W.opp, W.more);
    P.root = h('div', { class: 'tp' + (A.hasVideo() ? '' : ' tp-off'), id: 'tpRoot' }, W.in, W.last);
    el.append(P.root);
    drawPick();
    drawLast();
    if (root.ResizeObserver) { P.ro = new ResizeObserver(() => fit()); P.ro.observe(el); }
    fit();
  }
  /* 大きさに合わせる：背番号の列の数・ボタンの文字（狭いときは短く）・ボタンの高さ（余れば大きく）・低い画面では行をまとめる */
  function fit() {
    const W = P.W, el = P.el;
    if (!W || !el || !P.root || !el.clientWidth) return;
    const cs = getComputedStyle(el);
    const w = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const H = el.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    const R = P.root;
    const low = H < 330;
    R.classList.toggle('tp-low', low);
    // 低い画面（スマホの横）：選びかけは、下の帯の中に出す（上の1行ぶんを、ボタンに回す）
    if (low && W.hint.parentNode !== W.last) W.last.prepend(W.hint);
    else if (!low && W.hint.parentNode !== W.in) W.in.prepend(W.hint);
    const gap = H < 330 ? 4 : 6;
    R.style.setProperty('--tp-gap', gap + 'px');
    const n = W.nos.children.length;
    const cols = numCols(n, w, 40, gap);
    W.nos.style.setProperty('--tp-cols', cols);
    // プレーのボタンの文字：入らなければ短く
    W.plays.querySelectorAll('.tp-prow').forEach((row) => {
      const k = row.children.length, bw = (w - (k - 1) * gap) / k;
      Array.from(row.children).forEach((b) => { const L = LAB[b.dataset.type]; const full = BT.textEm(L[0]) * 15 + 10 <= bw; b.firstChild.textContent = full ? L[0] : L[1]; b.classList.toggle('tp-short', !full); });
    });
    // 高さ：40〜56px。まず小さくして測り、余ったぶんをボタンの段に分ける
    const base = H < 330 ? 40 : 44;
    R.style.setProperty('--tp-bh', base + 'px');
    const rows = W.plays.children.length + Math.ceil(n / cols);
    const used = W.in.offsetHeight + W.last.offsetHeight + gap * 2;
    const extra = H - used;
    const bh = extra > 0 ? Math.min(w >= 480 ? 64 : 56, base + Math.floor(extra / (rows + 1))) : base;
    R.style.setProperty('--tp-bh', bh + 'px');
  }
  function drawPick() {
    const W = P.W, g = game();
    if (!W || !g) return;
    const pk = P.pick;
    W.hint.innerHTML = '';
    W.hint.classList.toggle('tp-on', !!pk);
    P.root.classList.toggle('tp-picking', !!pk);
    if (!pk) {
      W.hint.append(h('i', { class: 'chip', style: { background: g.teams[0].color } }), h('b', null, BT.teamName(g, 0)),
        h('span', null, hasNo(g) ? 'プレーと背番号をタップ（どちらが先でも）' : 'プレー → 「チーム」をタップ'));
    } else {
      W.hint.append(h('b', null, pickText(pk)), h('span', null, pk.has === 'type' ? ' → 番号は？' : ' → プレーは？'), h('small', { class: 'tp-ht' }, fmt(pk.t)),
        h('button', { class: 'tp-cancel', id: 'tpCancel', onclick: () => { P.pick = null; resume(); drawPick(); } }, '× やめる'));
    }
    W.plays.classList.toggle('tp-want', !!pk && pk.has === 'no');
    W.nos.classList.toggle('tp-want', !!pk && pk.has === 'type');
    W.plays.querySelectorAll('.tp-pt').forEach((b) => { const on = !!pk && pk.has === 'type' && pk.type === b.dataset.type; b.classList.toggle('tp-sel', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    W.nos.querySelectorAll('.tp-no').forEach((b) => { const on = !!pk && pk.has === 'no' && (pk.no == null ? '' : pk.no) === b.dataset.no; b.classList.toggle('tp-sel', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
  }
  function drawLast() {
    const W = P.W, g = game();
    if (!W || !g) return;
    const e = last(g);
    W.lastMain.innerHTML = '';
    if (e) {
      W.lastMain.append(h('span', { class: 'tp-lt' }, fmt(e.t)),
        h('span', { class: 'tp-lw' }, h('i', { class: 'tp-dot tp-k-' + e.type, 'aria-hidden': 'true' }), who(g, e) ? h('b', null, who(g, e)) : null, ' ', what(e),
          BT.hasLoc(e) ? h('small', { class: 'tp-zone' }, ' 📍 ' + BT.shotZone(e.x, e.y, BT.courtOf(g)).label) : null),
        h('span', { class: 'tp-ed', 'aria-hidden': 'true' }, '✎'));
    } else W.lastMain.append(h('span', { class: 'tp-lw tp-none' }, 'まだ記録はありません'));
    W.lastMain.disabled = !e;
    W.undo.disabled = !e;
    W.watch.disabled = !e;
    W.redo.hidden = !(P.gid === g.id && P.redo.length);
    const on = !!e && P.watching === e.id;
    W.watch.textContent = on ? '■ 止める' : '▶ 見る';
    W.watch.classList.toggle('tp-on', on);
    if (e && P.flash === e.id) { P.flash = null; W.last.classList.remove('tp-flash'); void W.last.offsetWidth; W.last.classList.add('tp-flash'); }
  }

  A.panel('tap', {
    mount(el) { P.el = el; P.pick = null; P.playing = false; P.watching = null; build(); },
    show() { if (P.W) fit(); },
    hide() { if (P.pick) dropPick('ほかのタブを開いたので'); },
    badge() { return ''; }
  });
  A.on('open', () => { P.redo = []; P.gid = S.game ? S.game.id : null; P.pick = null; });
  A.on('change', () => { if (S.game && P.W) drawLast(); });
  const rebuild = () => { if (S.game && P.el) { const pk = P.pick; build(); P.pick = pk; drawPick(); } };
  A.on('prefs', rebuild);
  A.on('team', rebuild);          // 背番号・名前・色を変えた（設定・「＋」）：番号のボタンを作りなおす
  A.on('media', () => { if (P.root) P.root.classList.toggle('tp-off', !A.hasVideo()); });
  A.on('range', (r) => { if (!r && P.watching) { P.watching = null; drawLast(); } });
  A.on('time', (t) => {
    const pk = P.pick;
    if (pk && S.game && Math.abs(t - pk.t) > KEEP) dropPick(`動画が ${KEEP} 秒より大きく動いたので`);
  });

  /* ---------- 設定 ---------- */
  const REC = [
    ['miss', 'シュートの失敗（2P×・3P×・FT×）', '成功率が出ます'],
    ['reb', 'リバウンド', '外れたシュートのボールを取った'],
    ['ast', 'アシスト', '得点につながったパス'],
    ['stl', 'スティール', '相手のボールをうばった'],
    ['blk', 'ブロック', '相手のシュートを止めた'],
    ['tov', 'ターンオーバー', 'パスミス・トラベリングなどで、ボールを失った'],
    ['foul', 'ファウル', 'だれが何回したか'],
    ['mark', '★ あとで見る', 'だれのプレーか決めずに、場面に印だけ']
  ];
  const lbl = (t, s) => h('span', { class: 'tp-sl' }, h('b', null, t), s ? h('small', null, s) : null);
  A.settings({ id: 'rec', title: '① 記録するもの', order: 20, render(box, redraw) {
    const p = S.prefs, rec = p.rec = p.rec || {};
    const grid = h('div', { class: 'tp-set' });
    REC.forEach(([k, t, s]) => {
      grid.append(A.ui.check(rec, k, lbl(t, s), k === 'reb' ? redraw : null));
      if (k === 'reb' && rec.reb !== false) grid.append(h('div', { class: 'tp-sub' }, A.ui.check(rec, 'rebSplit', lbl('Oリバ（攻め）と Dリバ（守り）に分ける', 'オフにすると「リバ」1つ'))));
    });
    box.append(h('p', { class: 'note' }, '自分のチームのボタンです。いらないものを外すと、ボタンが減って押しやすくなります。2P・3P・FT は、いつもあります。'), grid,
      h('div', { class: 'tp-set' },
        A.ui.check(p, 'shotLoc', lbl('シュートの場所も記録する', '2P・3P のあと、コートの図で打った所を1回押します'), redraw),
        p.shotLoc ? h('div', { class: 'tp-sub' }, h('small', { class: 'note' }, 'コート'), A.ui.choice(p.courtType === 'mini' ? 'mini' : 'std', [['std', 'ふつう'], ['mini', 'ミニバス（3P の線なし）']], (v) => { p.courtType = v; A.savePrefs(); redraw(); }, 'courttype')) : null,
        A.ui.check(p, 'autoPause', lbl('タップしたら動画を止める', 'プレーか背番号を押すと止まり、記録すると、また動きます'))));
  } });

  SC.tap = { logic, edit: (id) => edit(id), list, state: () => ({ pick: P.pick ? Object.assign({}, P.pick) : null, redo: P.redo.length, watching: P.watching }) };
})(typeof window !== 'undefined' ? window : globalThis);
