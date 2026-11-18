/* スポーツ タップ記録 — 撮影しながら記録する（この端末のカメラ）。記録の画面に、どの種目でも同じように付ける
   カメラ・録画・保存・MP4 への組み直しは、バスケ タップ記録と同じ部品（camera.js・vstore.js・fmp4.js）。
   録画を始めた時刻を記録と同じ時計（Date.now）で持つので、あとで動画と記録の時刻を合わせる必要がない
   （記録の t 秒 ＝ 動画の t ＋（記録のスタート − 録画の始まり）秒）。

   記録の画面に足すもの（種目の画面には手を入れない。骨組みが、できあがった画面に差しこむ）
     ・上の帯の小さな映像（メニューの左。押すと撮影の画面）。録画中は赤いふち
     ・ワイプ（大きめの映像）：中・大。横長の画面は右の列、縦長の画面は上の帯の下。記録のボタンは、残りの広さに並べ直す
       （.live に cam-side・cam-top を付けて、grid の場所を足す。種目の画面は自分の入れ物の大きさで並べ直すので、そのまま動く）
     ・スタート前の札の「📹 撮影しながら記録する」・試合のあとの札の動画の一覧（🎬 場面を見る・⬇ 保存・🗑）
   設定：S.prefs.cam = { quality: '720' | '1080', audio, orient: 'land' | 'port', rot（映像の向きの手直し 0・90・180・270）, wipe: 's' | 'm' | 'l' } */
(function (root) {
  'use strict';
  const ST = root.ST;
  const { h } = ST.ui;
  const WIPES = ['s', 'm', 'l'];
  /* 種目ごとの言葉：横向きで撮るもの・スタートの合図 */
  const WIDE = { soccer: 'ピッチ全体', rugby: 'グラウンド全体', baseball: 'グラウンド全体', swim: 'プール全体' };
  const CUE = { soccer: 'キックオフ', futsal: 'キックオフ', handball: 'スローオフ', rugby: 'キックオフ', volley: '最初のサーブ', tennis: '最初のサーブ', baseball: 'プレイボール', swim: 'スタートの合図' };

  function create(api) {
    const S = api.S;
    const P = () => { S.prefs.cam = Object.assign({ quality: '720', audio: true, orient: 'land', rot: 0, wipe: 'm' }, S.prefs.cam || {}); return S.prefs.cam; };
    const M = { cam: null, busy: false, rawLand: null, hiddenAt: 0, errAt: 0, el: null, sheet: null };
    const on = () => !!(M.cam && M.cam.state !== 'off');
    const rec = () => !!(M.cam && M.cam.rec);
    const mb = (n) => (n >= 1e9 ? (n / 1e9).toFixed(2) + 'GB' : Math.max(0, Math.round((n || 0) / 1e6)) + 'MB');
    const clockOf = (ms) => (ms ? ST.hmsAt(ms, S.game ? S.game.tz : ST.localTz()).slice(0, 5) : '');
    const supported = () => ST.camera.supported();
    const videoCount = (g) => ((g && g.videos) || []).filter((v) => !v.gone).length;
    const say = (t, k, ms) => api.say(t, k, ms);

    /* ---------- カメラ ---------- */
    function ensure() {
      if (M.cam) return M.cam;
      const C = M.cam = ST.camera.create();
      C.on('state', () => { refresh(); api.update(); });
      C.on('start', (seg) => upsert(seg));
      C.on('done', (v) => { upsert(v); api.update(); });
      C.on('progress', () => refresh(true));
      C.on('error', (e) => {
        if (M.errAt && Date.now() - M.errAt < 3000) return;
        M.errAt = Date.now();
        const msg = '録画を止めました：保存できませんでした' + (e && e.message ? '（' + e.message + '）' : '') + '。空きを増やしてから、もう一度「● 録画」';
        if (rec()) stopRec(true).then(() => say(msg, 'err', 10000)); else say(msg, 'err', 10000);
      });
      C.on('notice', (t) => say(t, 'warn', 5000));
      C.on('trackended', async () => { if (rec()) await stopRec(true); if (M.cam) await M.cam.close(); say('カメラが止まりました（ほかのアプリが使った など）。≡ メニューの「撮影」から再開できます', 'warn', 8000); });
      return C;
    }
    /* 記録に、動画の情報（ファイル名・録画を始めた時刻・長さ）を入れる（書き出す JSON にも入る。中身は入れない） */
    function upsert(v) {
      const g = S.game;
      if (!g || v.gameId !== g.id) return;
      g.videos = g.videos || [];
      const o = { vid: v.vid, n: v.n, startedAt: v.startedAt, endedAt: v.endedAt, duration: v.duration, bytes: v.bytes, mime: v.plan ? 'video/mp4' : v.mime, name: v.name, w: v.w, h: v.h, status: v.status };
      if (v.gone) o.gone = true;
      const i = g.videos.findIndex((x) => x.vid === v.vid);
      if (i >= 0) Object.assign(g.videos[i], o); else g.videos.push(o);
      api.save();
    }
    async function openCam() {
      if (!supported()) { ST.ui.toast('この端末・ブラウザでは撮影できません（カメラか録画に対応していません）', 'err', 7000); return false; }
      if (!ST.vstore.supported()) { ST.ui.toast('このブラウザには動画を保存できません（プライベートブラウズ など）', 'err', 7000); return false; }
      const C = ensure();
      try { await C.open({ quality: P().quality || '720', audio: P().audio !== false }); } catch (e) {
        const denied = e && (e.name === 'NotAllowedError' || e.name === 'SecurityError');
        ST.ui.toast(denied ? 'カメラの使用が許可されていません。端末の設定（iPhone は 設定 → Safari → カメラ）で、許可してください' : 'カメラを開けませんでした' + (e && e.message ? '（' + e.message + '）' : ''), 'err', 9000);
        return false;
      }
      refresh();
      return true;
    }
    async function startRec() {
      const g = S.game;
      if (!g || M.busy || rec()) return;
      M.busy = true;
      try {
        if (!M.cam || !M.cam.live()) { if (!(await openCam())) return; }
        const [w, hh] = rawDims();
        M.rawLand = w && hh ? w >= hh : null;
        await M.cam.start({ gameId: g.id, n: (g.videos || []).length + 1, base: ST.fileBase(g), rotate: P().rot || 0 });
        ST.store.persist();
        ST.ui.keepAwake(true);
        api.guard();
      } catch (e) { ST.ui.toast('録画を始められませんでした' + (e && e.message ? '：' + e.message : ''), 'err', 7000); } finally { M.busy = false; refresh(); api.update(); }
    }
    async function stopRec(quiet) {
      if (!rec()) return null;
      M.busy = true;
      refresh();
      if (!quiet) say('動画を仕上げています…', '', 15000);
      try {
        const v = await M.cam.stop();
        if (v && v.empty) say('録画が短すぎて、動画にできませんでした', 'warn', 4000);
        else if (v && v.rotateLost) say(`動画${v.n}を保存しました。ただし、このブラウザでは動画に向きを書けなかったので、横倒しのまま再生されます`, 'warn', 9000);
        else if (!quiet && v) say(`動画${v.n}を保存しました（${ST.fmtTime(v.duration || 0)}・${mb(v.bytes)}）`, 'ok', 4000);
        return v;
      } finally { M.busy = false; refresh(); api.update(); }
    }
    async function close() {
      if (!M.cam) return null;
      const v = await stopRec(true);
      await M.cam.close();
      refresh();
      return v;
    }
    /* 画面を離れていた・映像の向きが変わった：ここから新しい動画として続ける（1本の動画の中で、途切れや向きの変わりがないように） */
    async function split(msg) {
      if (!rec() || M.busy) return;
      await stopRec(true);
      await startRec();
      if (rec()) say(msg || '画面を離れていた間は、録画が止まっていたかもしれないので、ここから新しい動画として録画しています', 'warn', 7000);
    }
    /* カメラから届く映像の大きさ（回す前）。上の帯の小さな映像は、隠れていても映像をつないでおく（大きさで、向きが変わったことが分かる） */
    function rawDims() {
      const v = M.el && M.el.thumb;
      if (v && v.videoWidth && v.videoHeight) return [v.videoWidth, v.videoHeight];
      const st = M.cam ? M.cam.settings() : {};
      return [st.width || 0, st.height || 0];
    }
    const shownRot = () => (rec() && M.cam.seg ? M.cam.seg.rotate : P().rot || 0);
    function aspect() { const [w0, h0] = rawDims(); return w0 && h0 ? (shownRot() % 180 ? h0 / w0 : w0 / h0) : 16 / 9; }
    /* 録れる動画の向きが、選んだ向き（横・縦）と合っているか */
    function orientOK() {
      const [w0, h0] = rawDims();
      if (!w0 || !h0) return true;
      const [w, hh] = (P().rot || 0) % 180 ? [h0, w0] : [w0, h0];
      return P().orient === 'port' ? hh >= w : w >= hh;
    }
    function turn() {
      if (rec()) { say('録画を止めると変えられます', 'warn'); return; }
      const p = P();
      p.rot = ((p.rot || 0) + 90) % 360;
      api.savePrefs();
      refresh(); api.update(); layoutNow();
    }
    /* 映像を、録れる動画の向きに回して、入れ物いっぱいに映す */
    function fit(box, video, rot, cover) {
      if (!box || !video) return;
      const bw = box.clientWidth, bh = box.clientHeight;
      if (!bw || !bh) return;
      const side = rot % 180 !== 0;
      video.style.width = (side ? bh : bw) + 'px';
      video.style.height = (side ? bw : bh) + 'px';
      video.style.objectFit = cover ? 'cover' : 'contain';
      video.style.transform = `translate(-50%, -50%) rotate(${rot}deg)`;
    }
    function bind(video) {
      if (!video) return;
      const want = on() && M.cam.stream ? M.cam.stream : null;
      if (video.srcObject !== want) { video.srcObject = want; video.muted = true; if (want) { const p = video.play(); if (p && p.catch) p.catch(() => {}); } }
    }

    /* ---------- 記録の画面に差しこむ ---------- */
    function attach(rootEl) {
      const thumb = h('video', { class: 'camthumb', muted: true, playsinline: true, autoplay: true });
      thumb.muted = true; thumb.playsInline = true;
      const btn = h('button', { class: 'cambtn', id: 'btnCam', hidden: true, 'aria-label': '撮影の画面を開く', onclick: openSheet }, thumb, h('i', { class: 'camdot' }));
      const wv = h('video', { class: 'wipev', muted: true, playsinline: true, autoplay: true });
      wv.muted = true; wv.playsInline = true;
      const tag = h('span', { class: 'wipetag', id: 'wipeTag' });
      const small = h('button', { class: 'wipesz', id: 'btnWipeSmall', 'aria-label': 'ワイプを小さくする', onclick: () => setWipe(-1) }, '－');
      const big = h('button', { class: 'wipesz', id: 'btnWipeBig', 'aria-label': 'ワイプを大きくする', onclick: () => setWipe(1) }, '＋');
      const box = h('div', { class: 'wipebox', id: 'wipeBox' }, h('button', { class: 'wipeopen', id: 'btnWipe', 'aria-label': '撮影の画面を開く', onclick: openSheet }, wv), tag, h('div', { class: 'wipectl' }, small, big));
      const wipe = h('aside', { class: 'wipe', id: 'wipe', hidden: true, 'aria-label': 'カメラの映像' }, box);
      const bar = rootEl.querySelector('.lbar');
      const menu = bar && bar.querySelector('.menubtn');
      if (bar) bar.insertBefore(btn, menu || null);
      rootEl.appendChild(wipe);
      thumb.addEventListener('resize', onResize);
      M.el = { root: rootEl, thumb, btn, wv, tag, small, big, box, wipe, key: '' };
      refresh();
    }
    function onResize() {
      refresh();
      if (!rec() || M.busy || M.rawLand == null) return;
      const [w, hh] = rawDims();
      if (w && hh && (w >= hh) !== M.rawLand) split('映像の向きが変わったので、ここから新しい動画として録画しています');
    }
    const wipeOn = () => !!(M.el && S.view === 'live' && on() && M.cam.stream && ['m', 'l'].includes(P().wipe));
    const wipeKey = () => (wipeOn() ? P().wipe + ':' + aspect().toFixed(3) : '');
    /* ワイプの場所と大きさ。種目の画面の並べ直しは、このあと骨組みが呼ぶ（記録のボタンは残りの広さに） */
    function layout() {
      const E = M.el;
      if (!E || !E.root.isConnected) return;
      const R = E.root;
      E.key = wipeKey();
      R.classList.remove('cam-side', 'cam-top');
      if (!wipeOn()) { E.wipe.hidden = true; return; }
      const sz = P().wipe, ar = aspect();
      const W = R.clientWidth, H = R.clientHeight;
      const mode = W >= H ? 'side' : 'top';
      R.classList.add('cam-' + mode);
      E.wipe.hidden = false;
      const bar = R.querySelector('.lbar'), gbar = R.querySelector('.gbar');
      const rest = H - (bar ? bar.offsetHeight : 60) - (gbar ? gbar.offsetHeight : 60) - 8;
      let vw;
      if (mode === 'side') vw = Math.min(W * (sz === 'l' ? 0.44 : 0.3), Math.max(80, rest - 8) * ar);
      else vw = Math.min(W - 12, Math.max(60, rest * (sz === 'l' ? 0.38 : 0.26)) * ar);
      vw = Math.max(120, Math.floor(vw));
      E.box.style.width = vw + 'px';
      E.box.style.height = Math.floor(vw / ar) + 'px';
      E.box.classList.toggle('tiny', vw < 220);
      fit(E.box, E.wv, shownRot(), true);
    }
    function layoutNow() { if (S.L && S.L.root) { layout(); if (S.L.layout) S.L.layout(); } }
    function setWipe(v) {
      const cur = Math.max(0, WIPES.indexOf(P().wipe));
      const next = typeof v === 'number' ? WIPES[ST.clamp(cur + v, 0, WIPES.length - 1)] : v;
      if (!WIPES.includes(next) || next === P().wipe) return;
      P().wipe = next;
      api.savePrefs();
      layoutNow();
      refresh();
      if (next === 's' && !M.sheet) say('ワイプを小さくしました（上の帯の映像を押すと、撮影の画面で大きくできます）', 'ok', 4000);
    }
    function wipeTag() {
      const E = M.el;
      if (!E) return;
      const r = rec();
      const s = r ? `● 録画 ${ST.fmtTime(M.cam.elapsed())}` : M.busy || (M.cam && M.cam.state === 'finishing') ? '仕上げ中…' : '録画していません';
      if (E.tag.textContent !== s) E.tag.textContent = s;
      E.tag.classList.toggle('rec', r);
    }
    /* 表示を書き換える（progress：数字だけ） */
    function refresh(progress) {
      const E = M.el;
      if (E && E.root.isConnected) {
        const live = !!(on() && M.cam.stream);
        if (wipeKey() !== E.key) layoutNow();       // ワイプが出た・消えた・大きさや縦横が変わった：置き場所と記録のボタンの並べ方をやり直す
        const big = wipeOn();
        E.btn.hidden = !live || big;
        E.btn.classList.toggle('rec', rec());
        E.btn.classList.toggle('warn', live && !orientOK());
        bind(E.thumb);
        if (live && !big) {
          const [w, hh] = rawDims();
          const rot = shownRot();
          if (w && hh) E.btn.style.setProperty('--ar', String(rot % 180 ? hh / w : w / hh));
          fit(E.btn, E.thumb, rot, true);
        }
        if (big) {
          bind(E.wv);
          E.box.classList.toggle('rec', rec());
          E.box.classList.toggle('warn', !orientOK());
          E.big.disabled = P().wipe === 'l';
          wipeTag();
          fit(E.box, E.wv, shownRot(), true);
        } else if (E.wv.srcObject) E.wv.srcObject = null;
      }
      if (M.sheet) M.sheet.draw(progress);
    }
    function tick() {
      if (rec() && M.sheet) M.sheet.draw(true);
      if (rec() && M.el && !M.el.wipe.hidden) wipeTag();
    }

    /* ---------- 撮影の画面 ---------- */
    async function storageText() {
      const e = await ST.vstore.estimate();
      if (!e || !e.quota) return '';
      const free = Math.max(0, e.quota - e.usage);
      const q = ST.camera.QUALITY[P().quality || '720'];
      const hours = free / 1e9 / q.perHour;
      return `空き ${mb(free)}（${q.label.replace(/（.*/, '')} で約 ${hours >= 10 ? Math.floor(hours) : hours.toFixed(1)} 時間）${hours < 1.2 ? '・⚠ 1試合ぶん入らないかもしれません' : ''}`;
    }
    async function openSheet() {
      if (!on() && !(await openCam())) return;
      const C = M.cam, sp = api.sport();
      const big = h('video', { class: 'campv', muted: true, playsinline: true, autoplay: true });
      big.muted = true; big.playsInline = true; big.srcObject = C.stream;
      { const p = big.play(); if (p && p.catch) p.catch(() => {}); }
      const pvbox = h('div', { class: 'campvw' }, big);
      const stat = h('div', { class: 'camstat', id: 'camStat', role: 'status' });
      const info = h('div', { class: 'note', id: 'camInfo' });
      const wipeRow = h('div', { class: 'row wiperow', id: 'camWipe' });
      const orient = h('div', { class: 'camorient', id: 'camOrient' });
      const acts = h('div', { class: 'camacts' });
      const store = h('div', { class: 'note', id: 'camStore' });
      let lastKey = '';
      const fitBig = () => {
        const ar = aspect();
        const appH = (S.L && S.L.root && S.L.root.clientHeight) || root.innerHeight;
        const maxW = pvbox.parentNode ? pvbox.parentNode.clientWidth : 600, maxH = Math.max(140, appH * 0.42);
        let bw = maxW, bh = bw / ar;
        if (bh > maxH) { bh = maxH; bw = bh * ar; }
        pvbox.style.width = Math.round(bw) + 'px'; pvbox.style.height = Math.round(bh) + 'px';
        fit(pvbox, big, shownRot(), false);
      };
      const draw = (progress) => {
        if (!M.cam) return;
        const r = rec(), busy = !!M.busy || M.cam.state === 'finishing';
        const seg = M.cam.seg, g = S.game, started = !!g.startedAt, ended = !!g.endedAt;
        stat.className = 'camstat' + (r ? ' rec' : '');
        stat.textContent = busy && !r ? '動画を仕上げています…' : r ? `● 録画中 ${ST.fmtTime(M.cam.elapsed())}・${mb(seg ? seg.bytes : 0)}（動画${seg ? seg.n : ''}）` : M.cam.state === 'off' ? 'カメラは切れています' : 'カメラの準備ができています（まだ録画していません）';
        const [w0, h0] = rawDims();
        const rot = shownRot();
        const [w, hh] = rot % 180 ? [h0, w0] : [w0, h0];
        info.textContent = `${w || '?'}×${hh || '?'}（${w >= hh ? '横向き' : '縦向き'}）・${M.cam.opts && M.cam.opts.audio ? '音あり' : '音なし'}`;
        fitBig();
        if (progress) return;
        const ok = orientOK(), land = P().orient !== 'port';
        const key = [r, busy, M.cam.state, started, ended, ok, land, rot, P().wipe].join();
        if (key === lastKey) return;
        lastKey = key;
        wipeRow.innerHTML = '';
        wipeRow.append(h('b', null, 'ワイプの大きさ'),
          ...[['s', '小'], ['m', '中'], ['l', '大']].map(([v, lab]) => h('button', { class: 'btn small' + (P().wipe === v ? ' on' : ''), dataset: { wipe: v }, 'aria-pressed': String(P().wipe === v), onclick: () => setWipe(v) }, lab)),
          h('span', { class: 'note' }, '記録の画面に映す映像。小は上の帯の中の小さな映像。中・大は、記録のボタンに重ならない所（横長の画面は右、縦長の画面は上）に出し、ボタンは残りの広さに並べ直します'));
        orient.innerHTML = '';
        orient.append(h('div', { class: 'row' }, h('b', null, '撮る向き'),
          [['land', `横向き（${sp.camWide || WIDE[sp.id] || 'コート全体'}）`], ['port', '縦向き']].map(([v, lab]) => h('button', { class: 'btn small' + ((P().orient || 'land') === v ? ' on' : ''), dataset: { orient: v }, disabled: r,
            onclick: () => { P().orient = v; api.savePrefs(); refresh(); api.update(); } }, lab))));
        if (!ok) {
          orient.append(h('div', { class: 'orientbox warn', id: 'orientWarn' },
            h('p', null, h('b', null, land ? '⚠ いまは縦向きの映像です。端末を横向きにしてください。' : '⚠ いまは横向きの映像です。端末を縦向きにしてください。')),
            land ? h('p', { class: 'note' }, '横にしても画面が回らないときは、画面の向きのロックを外してください（iPhone はコントロールセンターの 🔒）。ロックしたまま撮るときは、下の「↻ 映像を回す」で、録れる動画を横向きにできます（記録のボタンは縦の画面のままです）。') : null));
        }
        orient.append(h('div', { class: 'row turnrow' },
          h('span', { class: 'note' }, '上の映像の向きが、録れる動画の向きです。横倒し・さかさまのときは'),
          h('button', { class: 'btn small', id: 'btnTurn', disabled: r, onclick: turn }, '↻ 映像を回す')));
        if (rot && /webm/.test(r && seg ? seg.mime : ST.camera.pickMime(!!(M.cam.opts && M.cam.opts.audio)))) {
          orient.append(h('p', { class: 'orientbox warn', id: 'rotWebm' }, '⚠ このブラウザの録画（WebM）には向きを書けないので、動画は横倒しのまま保存されます。Safari・Chrome で開いてください。'));
        }
        if (r) orient.append(h('p', { class: 'note' }, '向きは、録画を止めると変えられます。'));
        acts.innerHTML = '';
        if (r) {
          if (!started) acts.append(h('button', { class: 'btn startboth', id: 'btnCamBoth', onclick: () => { ST.ui.closeSheet(); api.start(); } }, `▶ 記録もスタート（${sp.startShort || CUE[sp.id] || '試合開始'}で押す）`));
          acts.append(h('button', { class: 'btn danger-fill', id: 'btnCamStop', disabled: busy, onclick: () => stopRec() }, '■ 録画を止める'));
        } else if (M.cam.state !== 'off') {
          if (!started) {
            acts.append(h('button', { class: 'btn startboth rec', id: 'btnCamBoth', disabled: busy, onclick: () => { ST.ui.closeSheet(); api.start(); } }, h('span', { class: 'rdot' }), '録画と記録を同時にスタート'),
              h('p', { class: 'note bothnote' }, `${sp.startHint || '試合が始まる瞬間'}に押すと、録画と記録の時計が同時に始まります。`));
          }
          acts.append(h('div', { class: 'row' },
            h('button', { class: 'btn' + (started ? ' recbtn' : ''), id: 'btnCamRec', disabled: busy || ended, onclick: () => startRec() }, started ? '● 録画を始める' : '● 録画だけ先に始める（ウォーミングアップから撮る）'),
            h('button', { class: 'btn', id: 'btnCamOff', disabled: busy, onclick: () => { close().then(() => ST.ui.closeSheet()); } }, 'カメラを切る')));
        }
      };
      M.sheet = { draw };
      big.addEventListener('resize', () => draw());
      ST.ui.sheet({
        title: '📹 撮影しながら記録', cls: 'camsheet',
        body: h('div', null, pvbox, stat, info, wipeRow, orient, acts, store,
          h('ul', { class: 'camnotes note' },
            h('li', null, `「${sp.unit || '試合'}を終える」で、録画も止まります。動画はこの端末（このブラウザ）に保存され、終わったあと「🎬 場面を見る」で、記録した場面を見返せます（時刻あわせはいりません）`),
            h('li', null, '録画を止めて、また始めると、別の動画になります（どれも、記録と時刻が合っています）'),
            h('li', null, 'ほかのアプリに切りかえたり、画面を消したりすると、録画は止まります（戻ると、新しい動画として続けます）'),
            h('li', null, '電池をたくさん使います。電源につないでおくと安心です'))),
        onClose: () => { big.srcObject = null; M.sheet = null; }
      });
      draw();
      requestAnimationFrame(() => draw());
      storageText().then((t) => { store.textContent = t; });
    }

    /* ---------- 骨組みから呼ぶもの ---------- */
    /* スタート前の札の中 */
    function coverPart() {
      if (!supported()) return null;
      if (!on()) return h('button', { class: 'btn camon', id: 'btnCamOn', onclick: openSheet }, '📹 撮影しながら記録する（この端末のカメラ）');
      return h('div', { class: 'covercam' + (rec() ? ' rec' : '') + (orientOK() ? '' : ' warn') },
        h('span', null, !orientOK() ? '⚠ 向きが合っていません（撮影の画面で）' : rec() ? `● 録画中 ${ST.fmtTime(M.cam.elapsed())}` : '📹 カメラの準備OK'),
        h('button', { class: 'btn small', id: 'btnCamSheet', onclick: openSheet }, '撮影の画面'));
    }
    /* スタートのボタンの文字（カメラの準備ができていれば、録画も一緒に始める） */
    const startLabel = () => (on() && !rec() ? [h('span', { class: 'rdot' }), '録画と記録をスタート'] : rec() ? '▶ 記録をスタート' : null);
    /* スタートを押した：カメラの準備ができていて、まだ録画していなければ、録画も始める */
    function onStart() { if (on() && !rec()) startRec().then(() => { if (rec()) say('録画も始めました', 'ok', 2500); }); }
    /* 撮影した動画の一覧（試合のあと・書き出す） */
    function videoItems(g) {
      const vs = ((g && g.videos) || []).filter((v) => !v.gone);
      if (!vs.length) return null;
      return h('div', { class: 'vlist' }, vs.map((v) => h('div', { class: 'vitem', dataset: { vid: v.vid } },
        h('div', { class: 'vt' }, h('b', null, `📹 動画${v.n}`), h('small', null, `${clockOf(v.startedAt)}から・${ST.fmtTime(v.duration || 0)}・${mb(v.bytes)}${v.status === 'recording' ? '・録画中' : ''}`)),
        h('div', { class: 'row vacts' },
          h('button', { class: 'btn small primary', dataset: { clip: v.vid }, disabled: v.status === 'recording', onclick: () => api.openReview(g, v.vid) }, '🎬 場面を見る'),
          h('button', { class: 'btn small', dataset: { savevid: v.vid }, disabled: v.status === 'recording', onclick: () => saveVideo(v) }, '⬇ 保存'),
          h('button', { class: 'btn small danger', title: 'この端末から消す', 'aria-label': `動画${v.n}をこの端末から消す`, disabled: v.status === 'recording', onclick: () => deleteVideo(g, v) }, '🗑')))));
    }
    async function saveVideo(v) {
      ST.ui.toast('動画を用意しています…', '', 3000);
      let f = null;
      try { f = await ST.vstore.file(v.vid); } catch (e) { f = null; }
      if (!f) { ST.ui.toast('この動画は、この端末にはもうありません', 'err', 5000); return; }
      const r = await ST.ui.shareOrDownload(f.name || v.name, f, true);
      if (r === 'downloaded') ST.ui.toast(`保存しました：${f.name || v.name}`, 'ok', 5000);
      else if (r === 'shared') ST.ui.toast('送りました（「ビデオを保存」で写真に入ります）', 'ok', 4000);
    }
    function deleteVideo(g, v) {
      ST.ui.confirm(`動画${v.n}をこの端末から消しますか？`, `${ST.fmtTime(v.duration || 0)}・${mb(v.bytes)}。消すと元に戻せません（保存した動画・記録は残ります）。`, '消す', async () => {
        try { await ST.vstore.remove(v.vid); } catch (e) { /* もうない */ }
        v.gone = true;
        api.save();
        api.update();
        ST.ui.toast('消しました', 'ok');
      }, true);
    }
    /* 前回、録画の途中で閉じた動画を、そろっている所までで仕上げる */
    function recover(g) {
      if (rec() || !(g.videos || []).some((v) => v.status === 'recording') || !ST.vstore.supported()) return;
      ST.camera.recover(g.id).then(async (list) => {
        list.forEach(upsert);
        for (const v of g.videos || []) {
          if (v.status !== 'recording' || list.some((x) => x.vid === v.vid)) continue;
          const m = await ST.vstore.getVideo(v.vid).catch(() => null);
          if (m && m.status === 'done') upsert(m); else { v.status = 'done'; v.gone = true; }
        }
        api.save();
        if (list.some((v) => !v.gone)) say('前回の録画を、閉じる前までの分で保存しました', 'ok', 5000);
        api.update();
      }).catch(() => {});
    }
    /* 画面を離れた・戻った */
    function onVisibility(hidden) {
      if (hidden) { if (rec()) M.hiddenAt = Date.now(); return; }
      if (M.hiddenAt) { const away = Date.now() - M.hiddenAt; M.hiddenAt = 0; if (away > 1500) split(); }
    }
    /* 設定の画面 */
    function settingsPart(reopen) {
      if (!supported()) return null;
      const p = P();
      return h('section', { class: 'field', id: 'setCamera' }, h('span', null, '撮影（この端末のカメラ）'),
        h('div', { class: 'row' }, Object.keys(ST.camera.QUALITY).map((k) => h('button', { class: 'btn small' + ((p.quality || '720') === k ? ' on' : ''), dataset: { camq: k }, onclick: () => { p.quality = k; api.savePrefs(); reopen(); } }, ST.camera.QUALITY[k].label))),
        h('label', { class: 'chk' }, h('input', { type: 'checkbox', dataset: { pref: 'camAudio' }, checked: p.audio !== false, onchange: (e) => { p.audio = e.target.checked; api.savePrefs(); } }), '録画に音も入れる（笛・声援）'),
        h('p', { class: 'note' }, `1時間あたり、720p で約 ${ST.camera.QUALITY['720'].perHour}GB・1080p で約 ${ST.camera.QUALITY['1080'].perHour}GB。次にカメラを開いたときから変わります。`));
    }
    const menuItem = () => (supported() ? { icon: '📹', label: rec() ? '撮影（録画中）' : '撮影しながら記録', sub: rec() ? '録画を止める・ワイプの大きさ・空き容量' : 'この端末のカメラで録画（時刻は自動で合う）', fn: openSheet } : null);
    const detach = () => { if (M.el) { M.el.thumb.srcObject = null; M.el.wv.srcObject = null; } M.el = null; };

    return { attach, detach, layout, refresh, tick, coverPart, startLabel, onStart, startRec, stopRec, close, split, videoItems, recover, onVisibility, settingsPart, menuItem, openSheet, setWipe, turn, orientOK, isOn: on, isRec: rec, videoCount, M };
  }

  ST.livecam = { create };
})(typeof window !== 'undefined' ? window : globalThis);
