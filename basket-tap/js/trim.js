/* バスケ タップ記録 — ✂️ 場面を切り出す（試合の動画から、記録した場面を切り出す）
   前は「バスケ得点クリップ」（別のアプリ）でしていたことを、このアプリの中でする。
     ① 動画を選ぶ（写真アプリ・ファイル・この端末で撮影した動画）
     ② 記録と動画の時刻を合わせる（撮影しながら・動画を見ながら記録した試合は自動。ほかは「⏱ この瞬間が、選んだ記録」→「↔ 指でずらして合わせる」）
     ③ 場面を選んで、見る・動画にする（チーム・プレー・選手で絞り込み・続けて再生・1本の動画に）
   時刻あわせ・絞り込み・自分で足した場面は、試合の記録（game.trims[動画の見分け]）に入れて保存する（この端末とクラウド）。
   動画の中身は保存しない（同じ動画を選び直すと、合わせた時刻のまま開く）。
   元の作り：basket-clips/js/app.js の「バスケ タップ記録の記録から切り出す」「↔ 指でずらして合わせる」「続けて再生」「動画にする」。 */
(function (root) {
  'use strict';
  const BT = root.BT, BS = root.BS;
  const { h, $ } = BT.ui;
  const TL = BS.taplog, NT = BS.notes;

  let T = null;              // 開いている間の状態（閉じると null）
  let wakeOn = false;

  /* ---------- 小さな道具 ---------- */
  const duration = () => (T && T.media ? T.media.duration : 0) || 0;
  const now = () => (T && T.media ? T.media.time : 0);
  const teamColor = (i) => (i == null ? '#9aa3af' : (T.game.teams[i] && T.game.teams[i].color) || (i ? '#2f6fed' : '#f4f4f4'));
  const synced = () => !!(T && T.st && TL.cleanAnchors(T.st.anchors).length);
  const toast = (t, k, ms, a) => BT.ui.toast(t, k, ms, a);
  function winDefault() { return { lead: TL.WIN.lead, lag: TL.WIN.lag, by: JSON.parse(JSON.stringify(TL.WIN_BY)) }; }
  function cleanWin(w) {
    const d = winDefault();
    if (!w || typeof w !== 'object') return d;
    const num = (v, def) => (isFinite(v) && v >= 0 ? +v : def);
    const by = {};
    if (w.by && typeof w.by === 'object') Object.keys(w.by).forEach((k) => { const b = w.by[k]; if (b && isFinite(b.lead) && isFinite(b.lag)) by[k] = { lead: +b.lead, lag: +b.lag }; });
    return { lead: num(w.lead, d.lead), lag: num(w.lag, d.lag), by };
  }
  function freshState(meta) {
    const p = BT.store.prefs();
    return Object.assign({ anchors: [], how: '', view: { teams: [true, true], groups: {}, players: [] }, off: {}, adds: [], win: cleanWin(p.trimWin), captions: true }, meta || {});
  }
  function save() {
    if (!T) return;
    clearTimeout(T.saveTimer);
    T.saveTimer = setTimeout(() => {
      if (!T) return;
      const g = T.game;
      if (T.vkey && T.st) {
        g.trims = g.trims || {};
        g.trims[T.vkey] = T.st;
        g.trimLast = T.vkey;
        if (synced()) g.trimmed = true;
        // 1場面の長さは、次の試合でも使う
        const p = BT.store.prefs(); p.trimWin = T.st.win; BT.store.savePrefs(p);
      }
      T.ctx.save();
    }, 200);
  }
  function modal(o) {
    let s = null;
    const foot = (o.buttons || []).map((b) => h('button', { class: 'btn ' + (b.cls || ''), id: b.id || null, onclick: () => { const r = b.onClick ? b.onClick() : undefined; if (r !== false && s) s.close(); } }, b.label));
    s = BT.ui.sheet({ title: o.title, body: o.body, foot, cls: o.cls, wide: o.wide, onClose: o.onClose });
    return s;
  }
  function keepAwake(on) { wakeOn = on; BT.ui.keepAwake(on); }
  const clockAt = (ms, tz) => BT.hmsAt(ms, tz);
  const vkeyOf = (file, vid) => (vid ? 'cam:' + vid : `${(file && file.name) || 'video'}|${(file && file.size) || 0}`);
  const fmt = (t, x) => BT.fmtTime(t, x);
  /* 子要素を足す（null・false は足さない。DOM の append は null を「null」という文字にするため） */
  const put = (el, ...kids) => { kids.flat(Infinity).forEach((k) => { if (k != null && k !== false) el.append(k); }); return el; };

  /* ========== 開く・閉じる ========== */
  /* ctx：{ game, save(), back()（試合のページへ）, home(), file（すぐ開く動画）, vid（この端末で撮影した動画の id） } */
  function open(ctx) {
    close(true);
    let log = null, err = null;
    try { log = TL.parse(ctx.game, ''); } catch (e) { err = e.message; }
    T = {
      ctx, game: ctx.game, log, err,
      media: null, file: null, vkey: null, vid: null, st: null,
      reel: { active: false, list: [], i: -1, team: 0, title: '' },
      exporting: null, out: null, fullOut: null, thumbs: {}, thumbJob: null, fps: null, meta: null,
      syncEdit: false, syncPick: null, adj: null, adjLast: null, openWinBy: false, saveTimer: 0, offs: []
    };
    build();
    if (ctx.file) openFile(ctx.file, ctx.vidMeta || null);
    else if (ctx.vid) openCamVideo(ctx.vid);
    else render();
  }
  function close(silent) {
    if (!T) return;
    const t = T;
    stopReel(true);
    if (t.exporting && t.exporting.ctrl) t.exporting.ctrl.abort();
    if (t.thumbJob) t.thumbJob.cancel = true;
    clearTimeout(t.saveTimer);
    if (t.vkey && t.st) { t.game.trims = t.game.trims || {}; t.game.trims[t.vkey] = t.st; t.game.trimLast = t.vkey; if (TL.cleanAnchors(t.st.anchors).length) t.game.trimmed = true; if (!silent) t.ctx.save(); }
    if (t.media) t.media.destroy();
    if (t.out) URL.revokeObjectURL(t.out.url);
    if (t.fullOut) URL.revokeObjectURL(t.fullOut.url);
    document.removeEventListener('keydown', onKey);
    root.removeEventListener('resize', onResize);
    if (wakeOn) keepAwake(false);
    T = null;
  }
  const active = () => !!T;

  /* ---------- 画面の骨組み ---------- */
  function build() {
    const V = $('#view');
    V.innerHTML = '';
    document.body.dataset.view = 'trim';
    T.el = {};
    const E = T.el;
    E.slot = h('div', { class: 'tslot', id: 'tSlot' });
    E.notes = h('canvas', { class: 'tnotes', id: 'tNotes', 'aria-hidden': 'true' });
    E.badge = h('div', { class: 'ov-badge', id: 'tBadge', hidden: true });
    E.viewer = h('div', { class: 'tviewer', id: 'tViewer', onclick: (e) => { if (e.target === E.notes || e.target.tagName === 'VIDEO') toggle(); } }, E.slot, E.notes, E.badge);
    E.play = h('button', { class: 'btn tplay', id: 'tPlay', 'aria-label': '再生・一時停止', onclick: toggle }, h('span', { class: 'ico' }, '▶'));
    E.prevF = h('button', { class: 'btn small', id: 'tPrevF', 'aria-label': '1コマ戻る' }, '◀コマ');
    E.nextF = h('button', { class: 'btn small', id: 'tNextF', 'aria-label': '1コマ進む' }, 'コマ▶');
    holdRepeat(E.prevF, () => stepFrame(-1));
    holdRepeat(E.nextF, () => stepFrame(1));
    E.speed = h('select', { id: 'tSpeed', 'aria-label': '再生の速さ', onchange: (e) => { if (T.media) T.media.rate = Number(e.target.value); } },
      [['0.5', '×0.5'], ['1', '×1'], ['2', '×2']].map(([v, l]) => h('option', { value: v, selected: v === '1' }, l)));
    E.time = h('span', { class: 'ttime', id: 'tTime' }, '0:00 / 0:00');
    E.reelLabel = h('span', { id: 'tReelLabel' });
    E.reelBar = h('span', { class: 'reelbar', id: 'tReelBar', hidden: true }, E.reelLabel,
      h('button', { class: 'btn small', 'aria-label': '前の場面', onclick: () => stepReel(-1) }, '⏮'),
      h('button', { class: 'btn small', id: 'tReelStop', 'aria-label': '続けて再生をやめる', onclick: () => stopReel() }, '⏹'),
      h('button', { class: 'btn small', 'aria-label': '次の場面', onclick: () => stepReel(1) }, '⏭'));
    E.transport = h('div', { class: 'ttrans' }, E.play,
      h('button', { class: 'btn small', id: 'tBack5', onclick: () => seek(now() - 5) }, '−5秒'),
      h('button', { class: 'btn small', id: 'tFwd5', onclick: () => seek(now() + 5) }, '+5秒'),
      E.prevF, E.nextF, E.speed, E.time);
    E.timeline = h('canvas', { class: 'ttimeline', id: 'tTimeline', 'aria-label': '動画の位置（なぞって移動）' });
    initTimeline(E.timeline);
    E.stage = h('section', { class: 'tstage', id: 'tStage', hidden: true }, E.viewer, E.transport, E.reelBar, E.timeline);
    E.panel = h('div', { class: 'tpanel', id: 'tPanel' });
    V.append(
      h('header', { class: 'hbar' },
        h('button', { class: 'btn', id: 'tBackGame', 'aria-label': '試合のページへ', onclick: () => T.ctx.back() }, '← ', h('span', { class: 'lbl-wide' }, '試合のページ'), h('span', { class: 'lbl-narrow' }, '試合')),
        h('b', { class: 'htitle' }, '✂️ 場面を切り出す'),
        h('span', { class: 'spacer' }),
        h('button', { class: 'btn', id: 'tHome', 'aria-label': 'ホームへ', onclick: () => T.ctx.home() }, '🏠', h('span', { class: 'lbl-wide' }, ' ホーム'))),
      E.main = h('main', { class: 'trim novideo' }, E.stage, E.panel));
    document.addEventListener('keydown', onKey);
    root.addEventListener('resize', onResize);
  }
  function onResize() { if (!T) return; drawTimeline(); drawNotes(); stageH(); }
  /* 上に貼りつく動画の高さ（狭い画面で、下の操作が動画の下に隠れないように。css の scroll-margin-top） */
  function stageH() { if (T && T.el.main) T.el.main.style.setProperty('--tstageH', (T.el.stage.hidden ? 0 : T.el.stage.offsetHeight) + 'px'); }

  /* ========== 動画を開く ========== */
  function pickFile() {
    const df = BT.demo && BT.demo.file && BT.demo.file();          // 使い方のデモ：見本の動画
    if (df) { openFile(df); return; }
    const inp = h('input', { type: 'file', id: 'tFile', accept: 'video/*,.mp4,.mov,.m4v,.webm', style: { display: 'none' } });
    inp.addEventListener('change', () => { const f = inp.files && inp.files[0]; inp.remove(); if (f) openFile(f); });
    document.body.appendChild(inp);
    inp.click();
  }
  async function openCamVideo(vid) {
    toast('撮影した動画を開いています…', '', 3000);
    let f = null;
    try { f = await BT.vstore.file(vid); } catch (e) { f = null; }
    if (!T) return;
    if (!f) { toast('この動画が、この端末（このブラウザ）に見つかりませんでした。保存した動画を「📂 動画を選ぶ」で開いてください（時刻は自動で合わせます）', 'err', 9000); render(); return; }
    const meta = (T.game.videos || []).find((v) => v.vid === vid) || null;
    openFile(f, meta, vid);
  }
  /* meta：記録の videos の1本（撮影しながら記録した動画）。vid：その id（この端末の中の動画） */
  function openFile(file, meta, vid) {
    if (!T || !file) return;
    const okType = /^video\//.test(file.type || '') || /\.(mp4|mov|m4v|webm|mkv)$/i.test(file.name || '');
    if (!okType) { toast('動画ファイル（MP4・MOV など）を選んでください', 'err'); return; }
    if (T.exporting) { toast('書き出し中です。終わってから開いてください', 'warn'); return; }
    stopReel(true);
    if (T.thumbJob) T.thumbJob.cancel = true;
    if (T.media) T.media.destroy();
    T.offs.forEach((off) => off()); T.offs = [];
    const m = BS.createVideoMedia(file);
    T.media = m; T.file = file; T.vid = vid || null;
    T.vkey = vkeyOf(file, vid);
    T.thumbs = {}; T.out = null; T.fullOut = null; T.meta = null; T.fps = null; T.syncEdit = false; T.syncPick = null;
    const saved = T.game.trims && T.game.trims[T.vkey];
    T.st = saved ? Object.assign(freshState(), saved, { win: cleanWin(saved.win) }) : freshState({ name: file.name || '', size: file.size || null });
    T.restored = !!(saved && TL.cleanAnchors(saved.anchors).length);
    T.camMeta = meta || null;
    readMeta(m);
    T.el.slot.innerHTML = '';
    T.el.slot.appendChild(m.el);
    T.el.stage.hidden = false;
    T.el.main.classList.remove('novideo');
    T.offs.push(m.on('time', onTime), m.on('play', updatePlayBtn), m.on('pause', updatePlayBtn));
    m.on('ready', () => {
      if (!T || T.media !== m) return;
      T.st.duration = Math.round(duration() * 10) / 10;
      if (!synced()) autoSync();
      render(); drawTimeline(); drawNotes(); stageH();
      if (synced()) makeThumbs();
      if (T.restored) toast('前に合わせた時刻で開きました（同じ動画です）', 'ok', 3500);
    });
    m.on('error', () => toast('この動画は、このブラウザでは再生できないようです（MP4・MOV をお試しください）', 'err', 7000));
    m.on('notice', (t) => toast(t, 'warn', 6000));
    save();
    render(); drawTimeline(); updatePlayBtn();
  }
  /* 撮影の始まり（時刻あわせの目安）と、1秒のコマ数を、ファイルの目次から読む */
  async function readMeta(media) {
    const f = media && media.file;
    if (!f || typeof f === 'string' || typeof f.slice !== 'function' || !BS.mp4) return;
    try {
      const moov = await BS.mp4.readMoov(BS.mp4.blobReader(f));
      const r = TL.creationTime(moov);
      if (T && T.media === media && r) { T.meta = r; if (!synced()) render(); }
      try { const tr = BS.mp4.parseMoov(moov); if (T && T.media === media && tr && tr.fps > 5 && tr.fps < 241) T.fps = tr.fps; } catch (e) { /* 映像の目次が読めない */ }
    } catch (e) { /* MP4・MOV でない・読めない */ }
  }

  /* ========== 再生 ========== */
  function play() { if (T && T.media) T.media.play(); }
  function pause() { if (T && T.media) T.media.pause(); }
  function toggle() { if (!T || !T.media || T.exporting) return; if (T.media.paused) play(); else pause(); }
  function seek(t, fromReel) {
    if (!T || !T.media || T.exporting) return Promise.resolve();
    if (!fromReel && T.reel.active) stopReel(true);
    return T.media.seek(BS.clamp(t, 0, duration() || t));
  }
  let lastTimeText = '';
  function onTime(t) {
    if (!T) return;
    const s = `${fmt(t)} / ${fmt(duration())}`;
    if (s !== lastTimeText) { lastTimeText = s; T.el.time.textContent = s; }
    reelTick(t);
    drawTimeline();
    drawNotes();
    const sn = $('#tSyncNow');
    if (sn) sn.textContent = fmt(t, true);
  }
  function stepFrame(d) {
    if (!T || !T.media || T.exporting) return Promise.resolve();
    if (T.reel.active) stopReel(true);
    if (!T.media.paused) pause();
    const fps = T.fps || 30;
    const n = Math.floor(now() * fps + 1e-3);
    return seek((n + d + 0.5) / fps);
  }
  function holdRepeat(btn, fn) {
    let timer = 0, held = false, downAt = 0;
    const stop = () => { held = false; clearTimeout(timer); };
    btn.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      e.preventDefault();
      held = true; downAt = Date.now();
      fn();
      const rep = () => { if (!held) return; Promise.resolve(fn()).then(() => { if (held) timer = setTimeout(rep, 40); }); };
      timer = setTimeout(rep, 400);
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => btn.addEventListener(ev, stop));
    btn.addEventListener('click', () => { if (Date.now() - downAt > 1000) fn(); });
  }
  function updatePlayBtn() {
    if (!T) return;
    const ico = T.el.play.querySelector('.ico'), mark = !T.media || T.media.paused ? '▶' : '⏸';
    if (ico && ico.textContent !== mark) ico.textContent = mark;
    adjPlayBtn();
  }
  function onKey(e) {
    if (!T || !T.media || BT.ui.sheetOpen() || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    const k = e.key;
    if (k === ' ' && document.activeElement && document.activeElement.tagName === 'BUTTON') document.activeElement.blur();
    if (k === ' ' || k === 'k') toggle();
    else if (k === 'ArrowLeft') seek(now() - (e.shiftKey ? 1 : 5));
    else if (k === 'ArrowRight') seek(now() + (e.shiftKey ? 1 : 5));
    else if (k === ',') stepFrame(-1);
    else if (k === '.') stepFrame(1);
    else return;
    e.preventDefault();
  }

  /* ========== 時刻あわせ ========== */
  function autoSync() {
    if (!T.log) return false;
    // 撮影しながら記録した動画（この端末の中の動画）
    if (T.camMeta) {
      const a = TL.videoAnchors(T.log, T.camMeta);
      if (a) return setSync(a, 'camera', `📹 撮影しながら記録した動画（動画${T.camMeta.n}）なので、時刻は自動で合わせました`);
    }
    // 記録の videos のどれか（動画を見ながら記録した動画・保存した撮影の動画）
    const v = TL.matchVideo(T.log, T.file && T.file.name, duration());
    if (v) {
      const a = TL.videoAnchors(T.log, v);
      if (a) return setSync(a, v.file ? 'review' : 'camera', v.file ? null : `📹 撮影しながら記録した動画（動画${v.n}）なので、時刻は自動で合わせました`);
    }
    return false;
  }
  function setSync(anchors, how, msg) {
    T.st.anchors = TL.cleanAnchors(anchors);
    T.st.how = how;
    T.st.at = Date.now();
    T.syncEdit = false;
    afterSync(msg);
    return true;
  }
  function afterSync(msg) {
    T.out = null;
    save(); render(); drawTimeline(); drawNotes(); makeThumbs(true);
    if (msg) toast(msg, 'ok', 5000);
  }
  function metaSuggestion() {
    if (!T.meta || !T.log) return null;
    const r = TL.fromCreation(T.log, T.meta.start, duration());
    return r ? Object.assign(r, { how: T.meta.how, start: T.meta.start }) : null;
  }
  function syncFromMeta() {
    const sug = metaSuggestion();
    if (!sug) { toast('撮影時刻からは合わせられませんでした', 'warn'); return; }
    setSync(sug.anchors, 'meta', '撮影時刻から合わせました（目安）。場面を ▶ で見て、ずれていたら「↔ 指でずらして合わせる」で直してください');
  }
  /* 記録 eventId の瞬間を、動画の v 秒（なければ、いまの位置）にする。mode：'reset'｜'add'（合わせる点を足す）｜'fix'（その記録に効いている点だけ） */
  function syncAt(eventId, v, mode) {
    const e = T.log && T.log.events.find((x) => x.id === eventId);
    if (!e) return;
    const vv = v == null ? now() : v;
    const cur = synced() ? T.st.anchors : [];
    const anchors = mode === 'add' ? TL.setAnchor(cur, e.t, vv, true) : mode === 'fix' ? TL.setAnchor(cur, e.t, vv, false) : TL.setAnchor([], e.t, vv, true);
    setSync(anchors, 'manual', `合わせました：記録の ${fmt(e.t)}（${TL.eventLabel(T.log, e, true)}）＝ 動画の ${fmt(vv, true)}`);
  }
  function nudge(d) {
    if (!synced()) return;
    T.st.anchors = TL.shift(T.st.anchors, d);
    afterSync(null);
    toast(`全部の場面を ${d > 0 ? '後ろへ' : '前へ'} ${Math.abs(d)} 秒ずらしました`, 'ok', 2200);
  }
  function confirmFix(c) {
    modal({
      title: 'この場面で、時刻を合わせ直しますか？',
      body: h('div', null, h('p', null, `いまの映像の位置（${fmt(now(), true)}）を、記録「${c.label}」（記録の ${fmt(c.t)}）の瞬間にします。`),
        h('p', { class: 'note' }, 'ほかの場面も、同じだけずれます。先にこの場面を ▶ で見て、プレーの瞬間で止めてから押してください。')),
      buttons: [{ label: 'やめる' }, { label: '合わせ直す', cls: 'primary', onClick: () => { syncAt(c.id, null, 'fix'); } }]
    });
  }

  /* ---------- ↔ 指でずらして合わせる ----------
     見本の場面の「枠」（色の帯。タップの前○秒〜後○秒）を、目盛りの上で指で左右に動かして合わせる。
     動かしている間は、白い線（記録した瞬間）のコマを小さな画面に出す。「これで合わせる」で、全部の場面を同じだけずらす。 */
  const ADJ_R = [5, 30];
  const ADJ_H = 80;
  const adjRef = () => { const A = T && T.adj; return A ? A.refs.find((c) => c.id === A.ref) || null : null; };
  const adjWin = (c) => TL.winFor(T.st.win, c && c.grp);
  const fmtShift = (d) => (d ? `${d > 0 ? '+' : '−'}${Math.abs(d).toFixed(1)} 秒` : '±0 秒');
  function adjRefs() {
    if (!T.log || !synced()) return [];
    return TL.clips(T.log, T.st.anchors, { teams: [true, true] }, T.st.win, duration(), null).clips;
  }
  function adjDefault(refs) {
    const R = T.reel, seg = R.active ? R.list[R.i] : null;
    const playing = seg && seg.ids ? seg.ids.find((x) => refs.some((c) => c.id === x)) : null;
    if (playing) return playing;
    const t = now();
    const last = refs.find((c) => c.id === T.adjLast);
    if (last && Math.abs(last.at - t) < 20) return last.id;
    const near = (arr) => arr.reduce((b, c) => (!b || Math.abs(c.at - t) < Math.abs(b.at - t) ? c : b), null);
    const c = near(refs.filter((x) => x.grp === 'score')) || near(refs);
    return c ? c.id : null;
  }
  function adjSection(c) {
    const A = TL.cleanAnchors(T.st.anchors);
    if (A.length < 2) return null;
    const k = TL.anchorIndex(A, c.t);
    return `記録の ${k ? fmt(A[k].t) : '0:00'}〜${k + 1 < A.length ? fmt(A[k + 1].t) : '最後'}`;
  }
  function openAdjust(refId) {
    if (!T.media || !synced() || T.exporting) return;
    if (!T.media.ready || !(duration() > 0)) { toast('動画の読み込みが終わるまで、少し待ってください', 'warn'); return; }
    const refs = adjRefs();
    if (!refs.length) { toast('この動画に入っている記録の場面がありません。「合わせ直す」で合わせてください', 'warn', 6000); return; }
    const id = refs.some((c) => c.id === refId) ? refId : adjDefault(refs);
    stopReel(true);
    pause();
    const A = T.adj = { refs, ref: id, d: 0, zoom: 0, view: 0, drag: null, want: null, seeking: false, offs: [] };
    const W = T.media.width, H = T.media.height, ratio = W / H;
    const ruler = h('canvas', { id: 'adjRuler', class: 'adjruler', tabindex: '0', role: 'slider', 'aria-label': '場面の位置（左右に動かしてずらす。← → キーでも）' });
    ruler.addEventListener('pointerdown', adjDown);
    ruler.addEventListener('pointermove', adjMove);
    ruler.addEventListener('pointerup', adjUp);
    ruler.addEventListener('pointercancel', adjUp);
    ruler.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); adjStep((e.key === 'ArrowLeft' ? -1 : 1) * (e.shiftKey ? 1 : 0.1)); } });
    const body = h('div', { class: 'adj' },
      h('p', { class: 'note adjhint' }, '場面の枠（色の帯）を指で左右に動かすと、白い線（記録した瞬間）のコマが上に出ます。プレーの瞬間（得点なら、ボールがリングを通ったところ）で指を離してください。'),
      h('label', { class: 'adjrefrow' }, h('span', { class: 'note' }, '見本の場面'),
        h('select', { id: 'adjRef', class: 'syncpick', onchange: (e) => adjSetRef(e.target.value) },
          refs.map((c) => h('option', { value: c.id, selected: c.id === id }, `${fmt(c.at)}　${c.label}`)))),
      h('div', { class: 'adjpv', style: { aspectRatio: `${W} / ${H}`, '--ar': ratio.toFixed(4) } },
        h('canvas', { id: 'adjPv' }), h('span', { class: 'adjtag', id: 'adjTag' }),
        h('button', { class: 'adjplay', id: 'adjPlay', onclick: adjPlay }, '▶ この場面を見る')),
      ruler,
      h('div', { class: 'adjval' }, h('span', { class: 'note' }, 'ずらす量'), h('b', { id: 'adjVal' }, fmtShift(0)), h('span', { class: 'note', id: 'adjDir' }),
        h('span', { class: 'spacer' }),
        h('span', { class: 'adjzoom' }, h('span', { class: 'note' }, '目盛り'),
          ADJ_R.map((r, i) => h('button', { class: 'btn small' + (i ? '' : ' on'), dataset: { adjzoom: String(i) }, onclick: () => adjZoom(i) }, `±${r}秒`)))),
      h('div', { class: 'row' },
        [-1, -0.1, 0.1, 1].map((d) => h('button', { class: 'btn small', dataset: { adjstep: String(d) }, onclick: () => adjStep(d) }, (d > 0 ? '+' : '−') + Math.abs(d) + '秒')),
        h('button', { class: 'btn small', id: 'adjReset', onclick: () => adjStep(-T.adj.d) }, '元に戻す')),
      h('p', { class: 'note', id: 'adjScope' }));
    modal({ title: '↔ 指でずらして合わせる', body, cls: 'adjcard', wide: true, onClose: adjClose,
      buttons: [{ label: 'やめる', id: 'adjCancel' }, { label: '✓ これで合わせる', cls: 'primary', id: 'adjOk', onClick: adjApply }] });
    A.offs.push(T.media.on('time', adjFrame), T.media.on('play', adjPlayBtn), T.media.on('pause', adjPlayBtn));
    adjSetRef(id, true);
  }
  function adjSetRef(id, first) {
    const A = T.adj, prev = adjRef();
    const c = A && A.refs.find((x) => x.id === id);
    if (!c) return;
    if (!first && prev && TL.anchorIndex(T.st.anchors, prev.t) !== TL.anchorIndex(T.st.anchors, c.t)) A.d = 0;
    A.ref = id; A.view = c.at; T.adjLast = id;
    A.d = adjClamp(A.d);
    if (T.reel.active) stopReel(true);
    const sec = adjSection(c);
    const sc = $('#adjScope');
    if (sc) sc.textContent = sec ? `合わせた場所が ${TL.cleanAnchors(T.st.anchors).length} か所あるので、この場面のある区間（${sec}）の場面だけをずらします。` : '「これで合わせる」で、全部の場面が同じだけずれます。目盛りの数字は、元の位置からの秒数です。';
    adjRecenter(true);
    adjUpdate();
    adjPreview();
  }
  function adjUpdate() {
    const A = T && T.adj, c = adjRef();
    if (!A || !c) return;
    const m = c.at + A.d;
    const val = $('#adjVal'), dir = $('#adjDir'), tag = $('#adjTag'), ok = $('#adjOk');
    if (val) val.textContent = fmtShift(A.d);
    if (dir) dir.textContent = A.d ? `（場面を${A.d > 0 ? '後ろ' : '前'}へ）` : '（いまのまま）';
    if (tag) tag.textContent = `記録した瞬間 ${fmt(m, true)}`;
    if (ok) ok.textContent = A.d ? `✓ これで合わせる（${fmtShift(A.d)}）` : '✓ これで合わせる';
    const r = $('#adjRuler');
    if (r) { r.setAttribute('aria-valuenow', String(A.d)); r.setAttribute('aria-valuetext', fmtShift(A.d)); }
    adjDraw();
  }
  function adjClamp(d) {
    const c = adjRef();
    const end = duration() || Infinity;
    return Math.round(BS.clamp(d, -c.at, Math.max(-c.at, end - c.at)) * 10) / 10;
  }
  function adjStep(dd) {
    const A = T && T.adj;
    if (!A || !adjRef()) return;
    if (T.reel.active) stopReel(true);
    A.d = adjClamp(A.d + dd);
    adjRecenter();
    adjUpdate();
    adjPreview();
  }
  function adjZoom(i) {
    const A = T && T.adj;
    if (!A) return;
    A.zoom = i;
    document.querySelectorAll('[data-adjzoom]').forEach((b) => b.classList.toggle('on', b.dataset.adjzoom === String(i)));
    adjRecenter(true);
    adjUpdate();
  }
  function adjRecenter(instant) {
    const A = T && T.adj, c = adjRef();
    if (!A || !c) return;
    const R = ADJ_R[A.zoom], m = c.at + A.d;
    A.anim = null;
    if (instant) { A.view = Math.abs(A.d) <= R * 0.6 ? c.at : m; return; }
    if (Math.abs(m - A.view) <= R * 0.6) return;
    const from = A.view, t0 = performance.now(), anim = A.anim = {};
    const step = (tt) => {
      if (!T || T.adj !== A || A.drag || A.anim !== anim) return;
      const k = Math.min(1, (tt - t0) / 220);
      A.view = from + (m - from) * (1 - (1 - k) ** 3);
      adjDraw();
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  function adjPreview() {
    const A = T && T.adj, c = adjRef();
    if (!A || !c || !T.media) return;
    A.want = BS.clamp(c.at + A.d, 0, duration());
    if (A.seeking) return;
    A.seeking = true;
    const next = () => {
      if (!T || T.adj !== A || A.want == null || T.reel.active) { A.want = null; A.seeking = false; return; }
      const t = A.want;
      A.want = null;
      seek(t).then(next, next);
    };
    next();
  }
  function adjFrame() {
    adjDrawPv(); adjDraw();
    const A = T && T.adj;
    if (A && !A.raf && T.media && T.media.paused) A.raf = requestAnimationFrame(() => { A.raf = 0; if (T && T.adj === A) adjDrawPv(); });
  }
  function adjDrawPv() {
    const cv = $('#adjPv');
    if (!cv || !T || !T.media) return;
    const dpr = Math.min(2, root.devicePixelRatio || 1);
    const w = Math.max(1, Math.round(cv.clientWidth * dpr)), hh = Math.max(1, Math.round(cv.clientHeight * dpr));
    if (cv.width !== w || cv.height !== hh) { cv.width = w; cv.height = hh; }
    const g = cv.getContext('2d');
    g.fillStyle = '#000'; g.fillRect(0, 0, w, hh);
    const v = T.media.el, vw = v.videoWidth, vh = v.videoHeight;
    if (!vw || !vh || v.readyState < 2) return;
    const k = Math.min(w / vw, hh / vh);
    try { g.drawImage(v, (w - vw * k) / 2, (hh - vh * k) / 2, vw * k, vh * k); } catch (e) { /* まだ絵がない */ }
  }
  function adjDraw() {
    const A = T && T.adj, c = adjRef(), cv = $('#adjRuler');
    if (!A || !c || !cv) return;
    const dpr = root.devicePixelRatio || 1;
    const w = cv.clientWidth || 300, Hh = ADJ_H;
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(Hh * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(Hh * dpr); }
    const g = cv.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, Hh);
    g.fillStyle = '#172033'; g.fillRect(0, 0, w, Hh);
    const R = ADJ_R[A.zoom], v0 = A.view - R, pps = w / (2 * R);
    const X = (t) => (t - v0) * pps;
    const dur = duration();
    g.fillStyle = 'rgba(0,0,0,0.5)';
    if (X(0) > 0) g.fillRect(0, 0, Math.min(w, X(0)), 50);
    if (dur && X(dur) < w) g.fillRect(Math.max(0, X(dur)), 0, w - Math.max(0, X(dur)), 50);
    const major = [0.5, 1, 2, 5, 10, 15, 30, 60].find((s) => s * pps >= (s < 1 ? 44 : 30)) || 60;
    const minor = [major / 10, major / 5, major / 2].find((s) => s * pps >= 7) || major;
    g.font = '11px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    for (let k = Math.ceil((v0 - c.at) / minor - 1e-6), n = 0; n < 1000; k++, n++) {
      const off = Math.round(k * minor * 1000) / 1000, x = X(c.at + off);
      if (!(x <= w + 1)) break;
      const isMajor = Math.abs(off / major - Math.round(off / major)) < 1e-6;
      g.strokeStyle = isMajor ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.4)'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(x, 52); g.lineTo(x, isMajor ? 62 : 57); g.stroke();
      if (isMajor) {
        const lab = off ? `${off > 0 ? '+' : '−'}${+Math.abs(off).toFixed(1)}` : '0';
        g.font = off ? '11px system-ui, sans-serif' : 'bold 12px system-ui, sans-serif';
        const tw = g.measureText(lab).width;
        if (x - tw / 2 >= 1 && x + tw / 2 <= w - 1) { g.fillStyle = off ? '#cbd5e1' : '#fff'; g.fillText(lab, x, 75); }
      }
    }
    const x0 = X(c.at);
    g.strokeStyle = 'rgba(255,255,255,0.45)'; g.setLineDash([3, 3]); g.lineWidth = 1;
    g.beginPath(); g.moveTo(x0, 14); g.lineTo(x0, 52); g.stroke(); g.setLineDash([]);
    const win = adjWin(c), m = c.at + A.d;
    const bx0 = X(Math.max(0, m - win.lead)), bx1 = X(dur ? Math.min(dur, m + win.lag) : m + win.lag);
    const col = teamColor(c.team);
    g.globalAlpha = 0.38; g.fillStyle = col; g.fillRect(bx0, 18, bx1 - bx0, 28); g.globalAlpha = 1;
    g.strokeStyle = col; g.lineWidth = 2; g.strokeRect(bx0, 18, bx1 - bx0, 28);
    g.font = '11px system-ui, sans-serif';
    const hint = '◀ 指で動かす ▶', hw = g.measureText(hint).width, xr = Math.min(bx1, X(m));
    if (xr - bx0 > hw + 14) { g.fillStyle = 'rgba(255,255,255,0.92)'; g.fillText(hint, (bx0 + xr) / 2, 36); }
    const xp = X(now());
    if (Math.abs(now() - m) > 0.05 && xp >= 0 && xp <= w) { g.strokeStyle = '#fbbf24'; g.lineWidth = 2; g.beginPath(); g.moveTo(xp, 14); g.lineTo(xp, 52); g.stroke(); }
    const xm = X(m);
    [['rgba(0,0,0,0.7)', 5], ['#fff', 2.5]].forEach(([s, lw]) => { g.strokeStyle = s; g.lineWidth = lw; g.beginPath(); g.moveTo(xm, 13); g.lineTo(xm, 52); g.stroke(); });
    g.fillStyle = '#fff'; g.font = 'bold 11px system-ui, sans-serif';
    const lab = '記録した瞬間', lw2 = g.measureText(lab).width;
    g.fillText(lab, BS.clamp(xm, lw2 / 2 + 2, w - lw2 / 2 - 2), 11);
  }
  function adjDown(ev) {
    const A = T && T.adj;
    if (!A || (ev.pointerType === 'mouse' && ev.button !== 0)) return;
    ev.preventDefault();
    const cv = ev.currentTarget;
    try { cv.setPointerCapture(ev.pointerId); } catch (e) { /* 指がもう離れている */ }
    try { cv.focus({ preventScroll: true }); } catch (e) { /* 古いブラウザ */ }
    if (T.reel.active) stopReel(true);
    const c = adjRef(), R = ADJ_R[A.zoom];
    A.anim = null;
    if (c && Math.abs(c.at + A.d - A.view) > R * 0.9) { A.view = c.at + A.d; adjDraw(); }
    A.drag = { id: ev.pointerId, x: ev.clientX, d: A.d };
    cv.classList.add('dragging');
  }
  function adjMove(ev) {
    const A = T && T.adj, g = A && A.drag, c = adjRef();
    if (!g || !c || ev.pointerId !== g.id) return;
    const R = ADJ_R[A.zoom], cv = ev.currentTarget;
    const d0 = g.d + (ev.clientX - g.x) * (2 * R) / (cv.clientWidth || 300);
    const d = adjClamp(BS.clamp(d0, A.view - R - c.at, A.view + R - c.at));
    if (d !== A.d) { A.d = d; adjUpdate(); adjPreview(); }
  }
  function adjUp(ev) {
    const A = T && T.adj, g = A && A.drag;
    if (!g || ev.pointerId !== g.id) return;
    A.drag = null;
    ev.currentTarget.classList.remove('dragging');
    adjRecenter();
    adjUpdate();
  }
  function adjPlay() {
    const A = T && T.adj, c = adjRef();
    if (!A || !c) return;
    if (T.reel.active) { stopReel(true); adjPlayBtn(); return; }
    A.want = null;
    const m = c.at + A.d, win = adjWin(c);
    const seg = Object.assign({}, c, { on: true, at: m, t0: Math.max(0, m - win.lead), t1: Math.min(duration(), m + win.lag) });
    startReel(segsOf([seg]), c.team, '見本の場面');
  }
  function adjPlayBtn() {
    const b = $('#adjPlay');
    if (b && T) b.textContent = T.reel.active && T.media && !T.media.paused ? '⏸ 止める' : '▶ この場面を見る';
  }
  function adjApply() {
    const A = T && T.adj, c = adjRef();
    if (!A || !c || !A.d || !synced()) return;
    const d = A.d, sec = adjSection(c);
    const anchors = TL.cleanAnchors(T.st.anchors);
    T.st.anchors = sec ? TL.shiftAt(anchors, c.t, d) : TL.shift(anchors, d);
    if (T.st.how === 'review' || T.st.how === 'camera') T.st.how = 'manual';
    T.adjLast = c.id;
    A.applied = true;
    afterSync(null);
    toast(`${sec ? `${sec} の場面` : '全部の場面'}を ${d > 0 ? '後ろへ' : '前へ'} ${Math.abs(d).toFixed(1)} 秒ずらしました`, 'ok', 3500);
  }
  function adjClose() {
    const A = T && T.adj;
    if (!A) return;
    A.offs.forEach((off) => off());
    T.adj = null;
    if (T.reel.active) stopReel(true);
    if (A.d && !A.applied) toast('ずらしていません（「✓ これで合わせる」を押すと決まります）', 'warn', 3500);
  }

  /* ========== 場面（クリップ） ========== */
  function view() {
    const V = T.st.view || (T.st.view = {});
    if (!Array.isArray(V.teams)) V.teams = [true, true];
    if (!V.groups || typeof V.groups !== 'object') V.groups = {};
    if (!Array.isArray(V.players)) V.players = [];
    return V;
  }
  function clipList() {
    if (!T.log || !synced()) return [];
    return TL.clips(T.log, T.st.anchors, view(), T.st.win, duration(), T.st.off, T.st.adds).clips;
  }
  function segsOf(list) {
    const segs = TL.reel(list);
    return segs.map((seg, i) => {
      const labels = seg.ids.map((id) => (list.find((c) => c.id === id) || {}).label).filter(Boolean);
      return Object.assign(seg, { n: i + 1, total: segs.length, label: labels.length > 2 ? `${labels[0]} → ${labels[1]} ほか${labels.length - 2}件` : labels.join(' → ') });
    });
  }
  function afterFilter() { T.out = null; save(); render(); drawTimeline(); makeThumbs(); }
  function toggleGroup(id) {
    const V = view();
    const present = TL.GROUPS.map((g) => g.id).filter((g) => TL.counts(T.log, V, T.st.adds).grp[g]);
    if (!Object.keys(V.groups).length) V.groups = { [id]: true };
    else {
      if (V.groups[id]) delete V.groups[id]; else V.groups[id] = true;
      if (!Object.keys(V.groups).length || present.every((g) => V.groups[g])) V.groups = {};
    }
    afterFilter();
  }
  function togglePlayer(k) {
    const V = view();
    V.players = V.players.includes(k) ? V.players.filter((x) => x !== k) : V.players.concat([k]);
    afterFilter();
  }
  function setOn(id, on) {
    if (on) delete T.st.off[id]; else T.st.off[id] = true;
    T.out = null;
    save(); render(); drawTimeline();
  }
  /* 続けて再生 */
  function segSub(seg) {
    if (seg.user) return `✋ 自分で足した場面・動画 ${fmt(seg.at)}`;
    return `${seg.period ? TL.periodLabel(seg.period) + '・' : ''}記録 ${seg.t != null ? fmt(seg.t) : ''}${seg.total > 1 ? `・${seg.n} / ${seg.total}` : ''}`;
  }
  function startReel(segs, team, title) {
    if (!T.media || T.exporting || !segs.length) return;
    T.reel = { active: true, list: segs, i: -1, team, title: title || '' };
    startSeg(0);
  }
  function startSeg(i) {
    const R = T.reel;
    R.i = i;
    const seg = R.list[i];
    if (seg.ids) T.adjLast = seg.ids[0];
    seek(seg.t0, true).then(() => { if (T && T.reel === R && R.active && R.i === i) play(); });
    updateReelUI();
  }
  function stepReel(d) {
    const R = T.reel;
    if (!R.active) return;
    const j = R.i + d;
    if (j < 0) startSeg(0); else if (j >= R.list.length) stopReel(); else startSeg(j);
  }
  function stopReel(silent) {
    if (!T || !T.reel.active) return;
    T.reel.active = false;
    pause();
    updateReelUI();
    if (!silent) toast('続けて再生を終わりました', 'ok');
  }
  function reelTick(t) {
    const R = T.reel;
    if (!R.active || T.exporting) return;
    const seg = R.list[R.i];
    if (!seg) { stopReel(true); return; }
    if (t >= seg.t1 - 0.03 || (T.media && T.media.el.ended)) {
      if (R.i + 1 < R.list.length) startSeg(R.i + 1);
      else { R.active = false; pause(); updateReelUI(); if (R.list.length > 1) toast('最後まで再生しました', 'ok'); }
    }
  }
  function updateReelUI() {
    if (!T) return;
    const R = T.reel, E = T.el;
    if (!R.active) {
      E.reelBar.hidden = true; E.badge.hidden = true;
      document.querySelectorAll('.tclip.playing').forEach((r) => r.classList.remove('playing'));
      adjPlayBtn();
      return;
    }
    const seg = R.list[R.i];
    E.reelBar.hidden = false;
    E.reelLabel.textContent = `${R.title || '場面'} ${R.i + 1}/${R.list.length}`;
    E.badge.innerHTML = '';
    E.badge.style.setProperty('--team', teamColor(seg.team));
    E.badge.append(h('b', null, seg.label), h('span', null, segSub(seg)));
    E.badge.hidden = false;
    document.querySelectorAll('.tclip').forEach((r) => r.classList.toggle('playing', seg.ids.includes(r.dataset.id)));
    adjPlayBtn();
  }
  function playAll() {
    const segs = segsOf(clipList());
    if (!segs.length) { toast('再生する場面がありません', 'warn'); return; }
    startReel(segs, segs[0].team, filterTitle());
  }
  function playOne(c) { startReel(segsOf([Object.assign({}, c, { on: true })]), c.team, '場面'); }
  function filterTitle() {
    const V = view();
    const parts = [];
    if (V.teams[0] === false || V.teams[1] === false) parts.push(TL.teamName(T.log, V.teams[0] === false ? 1 : 0));
    if (V.players.length) parts.push(V.players.map((k) => '#' + k.split(':')[1]).join('・'));
    if (Object.keys(V.groups).length) parts.push(TL.GROUPS.filter((g) => V.groups[g.id]).map((g) => g.label).join('・'));
    return parts.length ? parts.join(' ') : '記録の場面';
  }

  /* ---------- ＋ この瞬間を場面に足す ---------- */
  const ADD_TYPES = ['mark', 'fg2', 'fg3', 'ft', 'fg2x', 'fg3x', 'reb', 'ast', 'stl', 'blk', 'pass', 'tov', 'foul'];
  function openAddScene() {
    if (!T.media || !synced() || T.exporting) return;
    if (T.reel.active) stopReel(true);
    pause();
    const at = Math.round(now() * 100) / 100;
    const f = { type: 'mark', team: null, no: '', memo: '' };
    const body = h('div', { class: 'addscene' });
    const draw = () => {
      const d = TL.TYPES[f.type];
      body.innerHTML = '';
      put(body, 
        h('p', { class: 'note' }, `いまの映像の位置（動画 ${fmt(at, true)}）を、プレーの瞬間にします。`),
        h('div', { class: 'frow' }, h('span', { class: 'flab' }, 'プレー'),
          ADD_TYPES.map((t) => h('button', { class: 'fchip' + (f.type === t ? ' on' : ''), dataset: { addtype: t }, onclick: () => { f.type = t; if (TL.TYPES[t].pts && f.team == null) f.team = 0; draw(); } }, TL.TYPES[t].label))),
        h('div', { class: 'frow' }, h('span', { class: 'flab' }, 'チーム'),
          [0, 1, null].map((tm) => h('button', { class: 'fchip' + (f.team === tm ? ' on' : ''), dataset: { addteam: String(tm) }, disabled: tm == null && !!d.pts, onclick: () => { f.team = tm; draw(); } },
            tm == null ? 'チームなし' : [h('i', { class: 'chip', style: { background: teamColor(tm) } }), TL.teamName(T.log, tm)]))),
        h('label', { class: 'frow' }, h('span', { class: 'flab' }, '背番号'),
          h('input', { id: 'addNo', class: 'addno', type: 'text', inputmode: 'numeric', maxlength: 2, value: f.no, disabled: f.team == null, placeholder: f.team == null ? '—' : '任意', oninput: (e) => { f.no = e.target.value; } })),
        h('label', { class: 'frow' }, h('span', { class: 'flab' }, 'メモ'),
          h('input', { id: 'addMemo', class: 'addmemo', type: 'text', maxlength: 30, value: f.memo, placeholder: '任意（例：いいディフェンス）', oninput: (e) => { f.memo = e.target.value; } })));
    };
    draw();
    modal({ title: '＋ この瞬間を場面に足す', body, buttons: [{ label: 'やめる' }, { label: '＋ 足す', cls: 'primary', id: 'addOk', onClick: () => addScene(at, f) }] });
  }
  function addScene(at, f) {
    const no = f.team != null && String(f.no || '').trim() ? TL.normNo(f.no) : null;
    if (f.team != null && String(f.no || '').trim() && no == null) { toast('背番号は 0〜99（00 も）で入れてください', 'warn'); return false; }
    const adds = T.st.adds || (T.st.adds = []);
    const id = 'u' + (adds.reduce((m, a) => Math.max(m, Number(String(a.id).slice(1)) || 0), 0) + 1);
    adds.push({ id, at, type: f.type, team: f.team, no, memo: String(f.memo || '').trim().slice(0, 30) });
    T.out = null;
    save(); render(); drawTimeline(); makeThumbs();
    const seen = clipList().some((c) => c.id === id);
    toast(`場面を足しました：動画 ${fmt(at, true)}・${TL.TYPES[f.type].label}${seen ? '' : '（いまの絞り込みでは見えません）'}`, seen ? 'ok' : 'warn', seen ? 3000 : 6000);
    return true;
  }
  function confirmRemoveScene(c) {
    modal({ title: 'この場面を消しますか？', body: h('p', null, `自分で足した場面「${c.label}」（動画 ${fmt(c.at, true)}）を消します。`),
      buttons: [{ label: 'やめる' }, { label: '🗑 消す', cls: 'danger-fill', onClick: () => {
        T.st.adds = (T.st.adds || []).filter((a) => a.id !== c.id);
        delete T.st.off[c.id]; delete T.thumbs[c.id];
        T.out = null; save(); render(); drawTimeline();
        toast('足した場面を消しました', 'ok');
      } }] });
  }

  /* ========== 動画にする ========== */
  const baseName = () => { const n = (T.file && T.file.name) || BT.fileBase(T.game); return n.replace(/\.[^.]+$/, '').replace(/[\\/:*?"<>|\s]+/g, '_').slice(0, 40); };
  const isIOS = () => { const nav = root.navigator || {}; return /iP(hone|ad|od)/.test(nav.userAgent || '') || (nav.platform === 'MacIntel' && nav.maxTouchPoints > 1); };
  function canShareVideo(r) {
    try { return isIOS() && !!navigator.canShare && navigator.canShare({ files: [new File([r.blob], r.name, { type: r.blob.type || 'video/mp4' })] }); } catch (e) { return false; }
  }
  function shareVideo(r) {
    let f;
    try { f = new File([r.blob], r.name, { type: r.blob.type || 'video/mp4' }); } catch (e) { return; }
    navigator.share({ files: [f], title: r.name }).then(() => toast('共有しました（「ビデオを保存」を選んだときは、写真アプリに入っています）', 'ok', 4500),
      (err) => { if (!err || err.name !== 'AbortError') toast('共有できませんでした。「⬇ 保存する」を使ってください', 'warn', 5000); });
  }
  function saveRow(r, id) {
    return h('div', { class: 'row' },
      h('a', { class: 'btn primary', href: r.url, download: r.name, id }, '⬇ 保存する'),
      canShareVideo(r) ? h('button', { class: 'btn', id: id + 'Share', onclick: () => shareVideo(r) }, '📲 写真に保存') : null,
      h('span', { class: 'note' }, r.ext === 'webm' ? 'WebM 形式です。iPhone で見るときは、MP4 に変換が必要なことがあります。' : 'MP4 形式です。スマホ・LINE でも見られます。'));
  }
  const progress = (frac, lab) => {
    const bar = $('#tExpBar'), el = $('#tExpLabel');
    if (bar) bar.style.width = (frac * 100).toFixed(1) + '%';
    if (el) el.textContent = `${lab}（${Math.round(frac * 100)}%）`;
  };
  /* 動画の上に出すコメント・スタンプ（記録の 💬。動画の時刻にして） */
  function noteList() {
    if (!NT || !synced()) return [];
    const list = (T.game.notes || []).map((n) => { const v = TL.toVideo(n.t, T.st.anchors); return v == null ? null : Object.assign({}, n, { t: Math.round(v * 100) / 100 }); }).filter(Boolean);
    return NT.cleanAll(list);
  }
  async function doExport(single) {
    if (T.exporting || !T.media || !T.log) return;
    stopReel(true);
    const segs = single ? segsOf([Object.assign({}, single, { on: true })]) : segsOf(clipList());
    if (!segs.length) { toast('動画にする場面がありません', 'warn'); return; }
    const clips = segs.map((seg) => ({ t0: seg.t0, t1: seg.t1, label: seg.label, sub: segSub(seg), color: teamColor(seg.team) }));
    const ctrl = new AbortController();
    T.exporting = { kind: 'log', ctrl, single: !!single };
    if (T.out) { URL.revokeObjectURL(T.out.url); T.out = null; }
    keepAwake(true);
    render();
    const ft = single ? single.label : filterTitle();
    const vs = `${TL.teamName(T.log, 0)} vs ${TL.teamName(T.log, 1)}`;
    const t = T;
    try {
      const res = await BS.exportReel(t.media, clips, {
        title: [ft, vs, `${segs.length}シーン`], end: [`${ft} ${segs.length}シーン`, vs],
        accent: teamColor(segs[0].team), captions: t.st.captions !== false, cards: !single, notes: noteList()
      }, progress, ctrl.signal);
      if (T !== t) return;
      if (res) {
        const safe = ft.replace(/[\\/:*?"<>|\s#]+/g, '_').slice(0, 30);
        res.name = `${baseName()}_${safe}${single ? '_' + fmt(single.at).replace(/:/g, '-') : '_' + segs.length + '場面'}.${res.ext}`;
        t.out = res;
        toast('動画ができました。「⬇ 保存する」で保存できます', 'ok', 5000);
      } else toast('書き出しを中止しました', 'warn');
    } catch (err) {
      console.error('[export]', err);
      toast('書き出しに失敗しました：' + err.message, 'err', 8000);
    }
    if (T !== t) return;
    t.exporting = null;
    keepAwake(false);
    render();
  }
  /* 🎞 動画全体を書き出す（コメント・スタンプ入り。動画を見ながら記録した試合で、コメントがあるとき） */
  async function doFullExport() {
    if (T.exporting || !T.media) return;
    stopReel(true);
    const dur = duration();
    if (!(dur > 0)) return;
    const ctrl = new AbortController();
    T.exporting = { kind: 'full', ctrl };
    if (T.fullOut) { URL.revokeObjectURL(T.fullOut.url); T.fullOut = null; }
    keepAwake(true);
    render();
    const t = T;
    try {
      const res = await BS.exportReel(t.media, [{ t0: 0, t1: dur, label: '', sub: '' }], { accent: '#facc15', captions: false, cards: false, notes: noteList(), bitrate: 3000000 },
        (frac) => progress(frac, `動画 ${fmt(frac * dur)} / ${fmt(dur)}`), ctrl.signal);
      if (T !== t) return;
      if (res) { res.name = `${baseName()}_コメント入り_全体.${res.ext}`; t.fullOut = res; toast('動画全体ができました。「⬇ 保存する」で保存できます', 'ok', 6000); }
      else toast('書き出しを中止しました', 'warn');
    } catch (err) {
      console.error('[export]', err);
      toast('書き出しに失敗しました：' + err.message, 'err', 8000);
    }
    if (T !== t) return;
    t.exporting = null;
    keepAwake(false);
    render();
  }

  /* ========== 小さな絵（場面のサムネイル） ========== */
  function hiddenVideo() {
    const v = document.createElement('video');
    v.muted = true; v.playsInline = true; v.preload = 'auto';
    v.style.cssText = 'position:fixed;left:-10px;top:-10px;width:2px;height:2px;opacity:0;pointer-events:none';
    document.body.appendChild(v);
    const once = (ev, ms) => new Promise((res) => { let done = false; const f = () => { if (done) return; done = true; v.removeEventListener(ev, f); res(); }; v.addEventListener(ev, f); setTimeout(f, ms); });
    return { v, once, close() { v.removeAttribute('src'); v.load(); v.remove(); } };
  }
  async function makeThumbs(reset) {
    if (!T || !T.media || !synced()) return;
    if (reset) T.thumbs = {};
    if (T.thumbJob) T.thumbJob.cancel = true;
    const job = T.thumbJob = { cancel: false };
    const todo = clipList().filter((c) => !T.thumbs[c.id]);
    if (!todo.length) return;
    const media = T.media, t = T;
    const hv = hiddenVideo();
    try {
      hv.v.src = media.url;
      await hv.once('loadeddata', 8000);
      const cv = document.createElement('canvas');
      cv.width = 192; cv.height = 108;
      const g = cv.getContext('2d');
      for (const c of todo) {
        if (job.cancel || T !== t || t.media !== media) break;
        hv.v.currentTime = Math.max(0, c.at - 1);
        await hv.once('seeked', 4000);
        if (job.cancel) break;
        const vw = hv.v.videoWidth || 16, vh = hv.v.videoHeight || 9;
        const k = Math.min(cv.width / vw, cv.height / vh);
        g.fillStyle = '#000'; g.fillRect(0, 0, cv.width, cv.height);
        try { g.drawImage(hv.v, (cv.width - vw * k) / 2, (cv.height - vh * k) / 2, vw * k, vh * k); } catch (e) { continue; }
        t.thumbs[c.id] = cv.toDataURL('image/jpeg', 0.72);
        document.querySelectorAll(`img[data-thumb="${c.id}"]`).forEach((img) => { img.src = t.thumbs[c.id]; });
      }
    } catch (e) { /* 絵がなくても使える */ }
    hv.close();
  }

  /* ========== タイムライン（映像の下のバー）・コメントの絵 ========== */
  function drawTimeline() {
    if (!T) return;
    const cv = T.el.timeline;
    const w = cv.clientWidth || 600, Hh = 40;
    const dpr = root.devicePixelRatio || 1;
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(Hh * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(Hh * dpr); }
    const g = cv.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, Hh);
    g.fillStyle = '#172033'; g.fillRect(0, 0, w, Hh);
    const dur = duration();
    if (!dur) return;
    const X = (t) => t / dur * w;
    if (synced()) {
      clipList().forEach((c) => {
        const x = X(c.at), y = c.team == null ? 20 : c.team ? 28 : 12;
        g.globalAlpha = c.on ? 1 : 0.3;
        g.fillStyle = teamColor(c.team); g.beginPath(); g.arc(x, y, 4, 0, Math.PI * 2); g.fill();
        g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 1; g.stroke();
        g.globalAlpha = 1;
      });
      noteList().forEach((n) => {
        const xn = X(n.t);
        g.fillStyle = '#facc15'; g.beginPath(); g.moveTo(xn - 4, 0); g.lineTo(xn + 4, 0); g.lineTo(xn, 6); g.closePath(); g.fill();
      });
    }
    const x = X(now());
    g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, Hh); g.stroke();
  }
  function initTimeline(cv) {
    let dragging = false;
    const toT = (ev) => { const r = cv.getBoundingClientRect(); return BS.clamp((ev.clientX - r.left) / r.width, 0, 1) * duration(); };
    cv.addEventListener('pointerdown', (ev) => { if (!T || !T.media || T.exporting) return; dragging = true; try { cv.setPointerCapture(ev.pointerId); } catch (e) { /* 無視 */ } seek(toT(ev)); });
    cv.addEventListener('pointermove', (ev) => { if (dragging) seek(toT(ev)); });
    cv.addEventListener('pointerup', () => { dragging = false; });
    cv.addEventListener('pointercancel', () => { dragging = false; });
  }
  function drawNotes() {
    if (!T || !NT) return;
    const cv = T.el.notes;
    const r = cv.getBoundingClientRect();
    const dpr = root.devicePixelRatio || 1;
    if (cv.width !== Math.round(r.width * dpr) || cv.height !== Math.round(r.height * dpr)) { cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr); }
    const g = cv.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, r.width, r.height);
    if (!T.media || !T.media.ready) return;
    const notes = noteList();
    if (!notes.length) return;
    const W = T.media.width, H = T.media.height, k = Math.min(r.width / W, r.height / H);
    NT.draw(g, W * k, H * k, notes, now(), (r.width - W * k) / 2, (r.height - H * k) / 2);
  }

  /* ========== 右（下）の操作 ========== */
  function stepHead(n, title, sub, done) {
    return h('div', { class: 'step-h' }, h('span', { class: 'snum' + (done ? ' done' : '') }, done ? '✓' : String(n)), h('b', null, title), sub ? h('span', { class: 'note' }, sub) : null);
  }
  function render() {
    if (!T) return;
    const P = T.el.panel;
    P.innerHTML = '';
    if (T.err) {
      put(P, h('section', { class: 'card' }, h('h2', null, 'この試合には、まだ切り出せる記録がありません'), h('p', { class: 'note' }, T.err),
        h('button', { class: 'btn primary', onclick: () => T.ctx.back() }, '← 試合のページへ')));
      return;
    }
    put(P, videoCard());
    if (T.media) {
      put(P, syncCard());
      if (synced()) put(P, clipsCard());
      if (synced() && noteList().length) put(P, fullCard());
    }
    put(P, h('div', { class: 'tdone' },
      h('button', { class: 'btn primary huge', id: 'tDone', onclick: () => T.ctx.back() }, synced() ? '✓ 終わる（試合のページへ）' : '← 試合のページへ'),
      h('button', { class: 'btn', id: 'tHome2', onclick: () => T.ctx.home() }, '🏠 ホームへ'),
      h('p', { class: 'note' }, synced() ? '合わせた時刻・選んだ場面は、記録と一緒に保存されています。あとで同じ動画を選ぶと、そのまま続きができます。'
        : '動画がまだ用意できていなくても大丈夫です。記録は保存されています（この端末とクラウド）。ホームの「✂️ 切り出し待ち」から、いつでもここに戻れます。')));
  }
  /* ① 動画 */
  function videoCard() {
    const g = T.game;
    const cams = (g.videos || []).filter((v) => !v.gone && !v.file && v.status !== 'recording');
    const card = h('section', { class: 'card step', id: 'tVideoCard' }, stepHead(1, '試合の動画を選ぶ', null, !!T.media));
    if (T.media) {
      put(card, h('div', { class: 'row' }, h('span', { class: 'tvname' }, '🎬 ', h('b', null, (T.file && T.file.name) || '動画'), h('span', { class: 'note' }, `・${fmt(duration())}`)),
        h('span', { class: 'spacer' }), h('button', { class: 'btn small', id: 'tRepick', disabled: !!T.exporting, onclick: pickFile }, '別の動画にする')));
      return card;
    }
    const rv = BT.isReview(g);
    put(card, 
      h('p', { class: 'lead' }, rv ? `記録したときに見ていた動画（${(g.src && g.src.name) || '同じ動画'}）を選んでください。時刻は自動で合います。`
        : '記録した試合の動画を選んでください（iPhone・iPad は写真アプリから）。記録と動画の時刻は、次の②で合わせます。'),
      h('button', { class: 'btn primary huge', id: 'tPick', onclick: pickFile }, '📂 動画を選ぶ'),
      cams.length ? h('div', { class: 'tcams' }, h('b', null, '📹 この端末で撮影した動画（時刻あわせなし）'),
        cams.map((v) => h('button', { class: 'btn', dataset: { camvid: v.vid }, onclick: () => openCamVideo(v.vid) }, `📹 動画${v.n}（${clockOf(v.startedAt)}から・${fmt(v.duration || 0)}）`))) : null,
      h('p', { class: 'note' }, '動画が手元にないとき（まだカメラの中・あとで送ってもらう など）は、下の「← 試合のページへ」で戻ってください。記録は消えません。'));
    return card;
  }
  const clockOf = (ms) => (ms ? BT.hmsAt(ms, T.game.tz).slice(0, 5) : '');
  /* ② 時刻あわせ */
  function syncCard() {
    const log = T.log;
    const done = synced() && !T.syncEdit;
    const card = h('section', { class: 'card step', id: 'tSyncCard' }, stepHead(2, '記録と動画の時刻を合わせる', null, done));
    if (done) {
      const A = TL.cleanAnchors(T.st.anchors);
      const how = { manual: '手で合わせました', meta: '撮影時刻から（目安）', camera: '📹 撮影しながら記録した動画なので、自動でぴったり', review: '🎬 動画を見ながら記録したので、記録の時刻 ＝ 動画の時刻' }[T.st.how] || '';
      put(card, 
        h('p', { class: 'syncok', id: 'tSyncOk' }, T.st.how === 'review' ? '✓ 時刻は合っています' : `✓ 記録の ${fmt(A[0].t)} ＝ 動画の ${fmt(A[0].v, true)}`, h('span', { class: 'note' }, `（${how}${A.length > 1 ? `・ほかに ${A.length - 1} か所で合わせています` : ''}）`)),
        h('div', { class: 'row adjcta' }, h('button', { class: 'btn primary', id: 'tAdjust', disabled: !!T.exporting, onclick: () => openAdjust() }, '↔ 指でずらして合わせる'),
          h('span', { class: 'note' }, '場面がずれているときに。場面の枠を、コマを見ながら指で動かして合わせます')),
        h('div', { class: 'row' }, h('span', { class: 'note' }, '全部の場面をずらす：'),
          [-1, -0.5, 0.5, 1].map((d) => h('button', { class: 'btn small', dataset: { nudge: String(d) }, onclick: () => nudge(d) }, (d > 0 ? '+' : '−') + Math.abs(d) + '秒'))),
        h('div', { class: 'row' }, h('button', { class: 'btn small', id: 'tResync', onclick: () => { T.syncEdit = true; render(); } }, '合わせ直す・合わせる場所を足す')));
      return card;
    }
    put(card, h('p', { class: 'note' }, '記録の時刻は「スタートを押してからの時間」です。動画のどこがその時刻か、を1か所決めると、ほかの記録の場面も全部決まります。'));
    const sug = metaSuggestion();
    if (sug) {
      const v0 = sug.anchors[0].v;
      put(card, h('div', { class: 'syncsug', id: 'tSyncMeta' },
        h('b', null, '📅 撮影時刻から合わせる（目安）'),
        h('p', { class: 'note' }, `動画の撮影の始まり ${clockAt(sug.start, log.tz)}・記録のスタート ${clockAt(log.startedAt, log.tz)} → 記録の 0:00 ＝ 動画の ${v0 < 0 ? '−' : ''}${fmt(Math.abs(v0), true)}。カメラと記録した端末の時計のずれ（ふつう1〜2秒）だけ、ずれることがあります。`),
        h('button', { class: 'btn primary', id: 'tSyncMetaBtn', onclick: syncFromMeta }, 'これで合わせる')));
    }
    const evs = log.events;
    const first = evs.find((e) => e.type === 'period') || evs[0];
    const pick = T.syncPick && evs.some((e) => e.id === T.syncPick) ? T.syncPick : first.id;
    const label = (e) => `${fmt(e.t)}　${e.type === 'period' ? `${TL.periodLabel(e.period)} 開始${e.t === 0 ? '（スタート）' : ''}` : TL.eventLabel(log, e, true)}`;
    const sel = h('select', { id: 'tSyncPick', class: 'syncpick', onchange: (e) => { T.syncPick = e.target.value; } }, evs.map((e) => h('option', { value: e.id, selected: e.id === pick }, label(e))));
    put(card, h('div', { class: 'syncman' },
      h('b', null, sug ? '✋ 手で合わせる' : '✋ 記録の1つと、動画の同じ場面を合わせる'),
      h('ol', null,
        h('li', null, h('div', null, '合わせる記録を選ぶ'), sel,
          h('div', { class: 'note' }, 'いちばん簡単なのは「スタート」（ティップオフの瞬間に押していれば、動画のジャンプボールの瞬間）。得点の記録なら、ボールがリングを通った瞬間です。')),
        h('li', null, '動画を、その場面で止める（映像の下のバーをなぞる・−5秒／+5秒・コマ送り）'),
        h('li', null, h('div', { class: 'row' }, h('button', { class: 'btn primary', id: 'tSyncHere', onclick: () => syncAt($('#tSyncPick').value, null, 'reset') }, '⏱ この瞬間が、選んだ記録'),
          h('span', { class: 'note' }, 'いまの位置 ', h('b', { id: 'tSyncNow' }, fmt(now(), true)))))),
      synced() ? h('div', { class: 'row' },
        h('button', { class: 'btn small', id: 'tSyncAdd', onclick: () => syncAt($('#tSyncPick').value, null, 'add') }, '＋ ここでも合わせる（撮影を途中で止めた動画）'),
        h('button', { class: 'btn small', onclick: () => { T.syncEdit = false; render(); } }, 'やめる（もとのまま）')) : null));
    return card;
  }
  /* ③ 場面 */
  function clipsCard() {
    const log = T.log, V = view();
    const res = TL.clips(log, T.st.anchors, V, T.st.win, duration(), T.st.off, T.st.adds);
    const cl = res.clips;
    const cnt = TL.counts(log, V, T.st.adds);
    const card = h('section', { class: 'card step tclips', id: 'tClips' }, stepHead(3, '場面を選んで、見る・動画にする', `${cl.length}場面`, false));
    put(card, h('div', { class: 'frow' }, h('span', { class: 'flab' }, 'チーム'),
      [0, 1].map((tm) => h('button', { class: 'fchip' + (V.teams[tm] !== false ? ' on' : ''), dataset: { fteam: String(tm) }, 'aria-pressed': V.teams[tm] !== false ? 'true' : 'false',
        onclick: () => { V.teams[tm] = V.teams[tm] === false; if (V.teams[0] === false && V.teams[1] === false) V.teams[1 - tm] = true; afterFilter(); } },
      h('i', { class: 'chip', style: { background: teamColor(tm) } }), TL.teamName(log, tm)))));
    const present = TL.GROUPS.filter((g) => cnt.grp[g.id]);
    const allG = !Object.keys(V.groups).length;
    put(card, h('div', { class: 'frow' }, h('span', { class: 'flab' }, 'プレー'),
      h('button', { class: 'fchip' + (allG ? ' on' : ''), dataset: { fgrp: 'all' }, onclick: () => { V.groups = {}; afterFilter(); } }, 'すべて'),
      present.map((g) => h('button', { class: 'fchip' + (!allG && V.groups[g.id] ? ' on' : ''), dataset: { fgrp: g.id }, onclick: () => toggleGroup(g.id) }, g.label, h('small', null, String(cnt.grp[g.id]))))));
    const pk = Object.keys(cnt.players).sort((a, b) => { const [ta, na] = a.split(':'), [tb, nb] = b.split(':'); return (ta - tb) || (Number(na) - Number(nb)) || (na.length - nb.length); });
    if (pk.length) {
      put(card, h('div', { class: 'frow' }, h('span', { class: 'flab' }, '選手'),
        h('button', { class: 'fchip' + (!V.players.length ? ' on' : ''), dataset: { fplayer: 'all' }, onclick: () => { V.players = []; afterFilter(); } }, '全員'),
        pk.map((k) => {
          const [tm, no] = k.split(':');
          const nm = TL.playerName(log, +tm, no);
          return h('button', { class: 'fchip' + (V.players.includes(k) ? ' on' : ''), dataset: { fplayer: k }, onclick: () => togglePlayer(k) },
            h('i', { class: 'chip', style: { background: teamColor(+tm) } }), '#' + no + (nm ? ' ' + nm : ''), h('small', null, String(cnt.players[k])));
        })));
    }
    put(card, winBox());
    const box = h('div', { class: 'tcliplist', id: 'tList' });
    if (!cl.length) put(box, h('p', { class: 'note empty' }, '選んだ条件の場面はありません。'));
    cl.forEach((c) => put(box, clipRow(c)));
    put(card, box);
    put(card, h('div', { class: 'row' },
      h('button', { class: 'btn small', id: 'tAddScene', disabled: !!T.exporting, onclick: openAddScene }, '＋ この瞬間を場面に足す'),
      h('span', { class: 'note' }, '記録にない場面も、映像を止めたところで足せます')));
    if (res.outside) put(card, h('p', { class: 'note' }, `この動画に入っていない時間の記録：${res.outside}件（撮影していない時間・別の動画の時間。時刻あわせがずれているときも、ここに入ります）`));
    const on = cl.filter((c) => c.on);
    const segs = segsOf(cl);
    const secs = segs.reduce((s2, c) => s2 + (c.t1 - c.t0), 0);
    const exp = T.exporting;
    put(card, h('div', { class: 'row acts' },
      h('button', { class: 'btn primary', id: 'tReel', disabled: !on.length || !!exp, onclick: playAll }, `▶ 続けて再生（${segs.length}場面・${fmt(secs)}）`),
      h('button', { class: 'btn good', id: 'tExport', disabled: !on.length || !!exp, onclick: () => doExport() }, '🎬 動画にする')),
      h('label', { class: 'switch' }, h('input', { type: 'checkbox', checked: T.st.captions !== false, onchange: (e) => { T.st.captions = e.target.checked; save(); } }), ' 動画に「#7 2P成功」などの文字を入れる'));
    if (segs.length < on.length) put(card, h('p', { class: 'note' }, `近い場面（重なる場面）は1つにまとめて再生します（${on.length}件 → ${segs.length}場面）。`));
    put(card, exportBox());
    return card;
  }
  function winBox() {
    const w = T.st.win;
    if (!w.by || typeof w.by !== 'object') w.by = {};
    const cnt = TL.counts(T.log, { teams: [true, true] }).grp;
    (T.st.adds || []).forEach((a) => { const d = TL.TYPES[a.type]; if (d) cnt[d.grp] = (cnt[d.grp] || 0) + 1; });
    const groups = TL.GROUPS.filter((g) => cnt[g.id] || w.by[g.id]);
    const sum = (x) => `（＝ ${+(x.lead + x.lag).toFixed(1)} 秒）`;
    const ups = [];
    const changed = () => { T.out = null; save(); ups.forEach((f) => f()); refreshActs(); drawTimeline(); };
    const field = (get, set, max, id, label) => {
      const el = h('input', { type: 'number', min: 0, max, step: 0.5, value: get(), class: 'num', id, 'aria-label': label,
        onchange: (e) => { const v = Number(e.target.value); if (isFinite(v) && v >= 0 && v <= max) { set(v); changed(); } else e.target.value = get(); } });
      ups.push(() => { if (document.activeElement !== el) el.value = get(); });
      return el;
    };
    const total = h('span', null, sum(w));
    ups.push(() => { total.textContent = sum(w); });
    const head = h('div', { class: 'winrow' }, h('span', null, '1場面の長さ：タップした瞬間の'),
      h('span', { class: 'wbin' }, '前 ', field(() => w.lead, (v) => { w.lead = v; }, 30, 'tWinLead', 'ふつうの長さ：前の秒数'), ' 秒 ＋ 後 ', field(() => w.lag, (v) => { w.lag = v; }, 15, 'tWinLag', 'ふつうの長さ：後の秒数'), ' 秒'), total);
    const byText = h('small', { class: 'note' });
    ups.push(() => {
      const parts = groups.filter((g) => w.by[g.id]).map((g) => { const b = TL.winFor(w, g.id); return `${g.label} 前${b.lead}・後${b.lag}`; });
      byText.textContent = parts.length ? `　${parts.join('、')}` : '　（全部ふつうの長さ）';
    });
    const rows = groups.map((g) => {
      const get = (k) => () => TL.winFor(w, g.id)[k];
      const set = (k) => (v) => { const cur = TL.winFor(w, g.id); cur[k] = v; w.by[g.id] = cur; };
      const tag = h('small', { class: 'wbtag' });
      const row = h('div', { class: 'wbrow', dataset: { wgrp: g.id } }, h('span', { class: 'wblab' }, g.label, tag),
        h('span', { class: 'wbin' }, '前 ', field(get('lead'), set('lead'), 30, `tWin-${g.id}-lead`, `${g.label}：前の秒数`), ' ＋ 後 ', field(get('lag'), set('lag'), 15, `tWin-${g.id}-lag`, `${g.label}：後の秒数`), ' 秒'));
      ups.push(() => { tag.textContent = w.by[g.id] ? '' : 'ふつう'; row.classList.toggle('dflt', !w.by[g.id]); });
      return row;
    });
    const reset = h('button', { class: 'btn small', onclick: () => { const d = winDefault(); w.lead = d.lead; w.lag = d.lag; w.by = d.by; changed(); toast('はじめの長さに戻しました', 'ok', 2500); } }, 'はじめの長さに戻す');
    const det = h('details', { class: 'winby' }, h('summary', null, '⏱ プレーごとに長さを変える', byText), h('div', { class: 'wbgrid' }, rows),
      h('p', { class: 'note' }, '「ふつう」のプレーは、上の長さになります。人がタップするのは、プレーの 1〜2 秒あとなので、前を長めにしています。'), reset);
    det.open = !!T.openWinBy;
    det.querySelector('summary').addEventListener('click', () => { T.openWinBy = !det.open; });
    ups.forEach((f) => f());
    return h('div', { class: 'winbox' }, head, det);
  }
  function refreshActs() {
    const segs = segsOf(clipList());
    const secs = segs.reduce((s2, c) => s2 + (c.t1 - c.t0), 0);
    const b = $('#tReel');
    if (b) b.textContent = `▶ 続けて再生（${segs.length}場面・${fmt(secs)}）`;
    const box = $('#tExportBox');
    if (box) box.replaceWith(exportBox());
  }
  function clipRow(c) {
    const R = T.reel;
    const playing = R.active && R.list[R.i] && R.list[R.i].ids.includes(c.id);
    const img = h('img', { class: 'thumb', alt: '', dataset: { thumb: c.id } });
    if (T.thumbs[c.id]) img.src = T.thumbs[c.id];
    const stop = (fn) => (e) => { e.stopPropagation(); fn(); };
    const row = h('div', { class: 'tclip' + (c.on ? '' : ' off') + (playing ? ' playing' : '') + (c.user ? ' user' : ''), dataset: { id: c.id }, style: { '--team': teamColor(c.team) } },
      h('input', { type: 'checkbox', checked: c.on, title: '続けて再生・動画にするときに入れる', 'aria-label': `${c.n}番目を入れる`, onchange: (e) => setOn(c.id, e.target.checked), onclick: (e) => e.stopPropagation() }),
      img,
      h('div', { class: 'ct' },
        h('b', null, c.label),
        h('span', { class: 'note' }, c.user ? `動画 ${fmt(c.at)}・✋ 自分で足した場面` : `動画 ${fmt(c.at)}・${TL.periodLabel(c.period)}・記録 ${fmt(c.t)}`)),
      h('div', { class: 'cops' },
        h('button', { class: 'btn small', 'aria-label': 'この場面を見る', dataset: { play: c.id }, onclick: stop(() => playOne(c)) }, '▶'),
        c.user ? h('button', { class: 'btn small', 'aria-label': '自分で足した場面を消す', dataset: { unadd: c.id }, disabled: !!T.exporting, onclick: stop(() => confirmRemoveScene(c)) }, '🗑') : [
          h('button', { class: 'btn small', title: '指でずらして、時刻を合わせる（この場面を見本に）', 'aria-label': '指でずらして合わせる', dataset: { adjust: c.id }, disabled: !!T.exporting, onclick: stop(() => openAdjust(c.id)) }, '↔'),
          h('button', { class: 'btn small', title: 'いまの映像の位置を、この記録の瞬間にする', 'aria-label': 'いまの位置で合わせ直す', dataset: { align: c.id }, onclick: stop(() => confirmFix(c)) }, '⌖')],
        h('button', { class: 'btn small', 'aria-label': 'この場面だけを動画にする', disabled: !!T.exporting, onclick: stop(() => doExport(c)) }, '⬇')));
    row.addEventListener('click', () => playOne(c));
    return row;
  }
  function exportBox() {
    const box = h('div', { class: 'exportbox', id: 'tExportBox' });
    const sup = BS.exportSupport();
    const exp = T.exporting;
    if (!sup) { put(box, h('p', { class: 'note' }, 'このブラウザは動画の書き出しに対応していません（Chrome・Edge・Safari の新しい版で使えます）。続けて再生は使えます。')); return box; }
    if (exp && exp.kind === 'log') {
      put(box, h('b', null, `🎬 ${exp.single ? 'この場面を' : '場面を'}動画にしています… `), h('span', { id: 'tExpLabel', class: 'note' }, ''),
        h('div', { class: 'progress' }, h('i', { id: 'tExpBar' })),
        h('p', { class: 'note' }, '実際の長さの時間がかかります。この画面を表示したままにしてください（ほかのアプリに切りかえると止まります）。'),
        h('button', { class: 'btn small danger', id: 'tExpAbort', onclick: () => exp.ctrl.abort() }, '中止'));
      return box;
    }
    const r = T.out;
    if (r) {
      put(box, h('div', { class: 'row' }, h('b', null, '✅ 動画ができました '),
        h('span', { class: 'note' }, `${r.ext.toUpperCase()}・${(r.blob.size / 1048576).toFixed(1)}MB・約${Math.round(r.seconds)}秒${r.audio ? '' : '・音声なし'}`)),
        h('video', { src: r.url, controls: true, playsinline: true, class: 'outvideo' }),
        saveRow(r, 'tDownload'));
    } else put(box, h('p', { class: 'note' }, `選んだ場面をつないで、1本の動画（${sup.ext.toUpperCase()}）にします。音声も入ります。できる動画と同じくらいの時間がかかります。`));
    return box;
  }
  function fullCard() {
    const n = noteList().length;
    const card = h('section', { class: 'card step', id: 'tFull' }, stepHead('💬', `動画全体を書き出す（コメント・スタンプ ${n}件入り）`, null, false));
    const exp = T.exporting;
    if (exp && exp.kind === 'full') {
      put(card, h('b', null, '🎞 動画全体を書き出しています… '), h('span', { id: 'tExpLabel', class: 'note' }, ''), h('div', { class: 'progress' }, h('i', { id: 'tExpBar' })),
        h('button', { class: 'btn small danger', onclick: () => exp.ctrl.abort() }, '中止'));
      return card;
    }
    if (T.fullOut) put(card, h('video', { src: T.fullOut.url, controls: true, playsinline: true, class: 'outvideo' }), saveRow(T.fullOut, 'tFullDownload'));
    else put(card, h('p', { class: 'note' }, `動画のはじめから終わりまで（${fmt(duration())}）を、コメント・スタンプを入れて書き出します。動画と同じだけ時間がかかります。`),
      h('button', { class: 'btn', id: 'tFullExport', disabled: !!exp, onclick: doFullExport }, '🎞 動画全体を書き出す'));
    return card;
  }

  BT.trim = { open, close, active, get state() { return T; }, openAdjust, syncAt, openFile, playOne, playAll, render };
})(typeof window !== 'undefined' ? window : globalThis);
