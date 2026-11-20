/* 受付（QR）：カメラ・QRリーダー・受付番号・名前で探す、の4つの入口で受付をする。
   受付は p.checkin[日の id] = 時刻。結果の枠と数字だけを部分的に書きかえる（カメラを止めないため）。 */
(function () {
  'use strict';
  const { html, icon } = T;

  const st = T.uiState('checkin', { day: '', last: null, result: null, q: '' });
  const cam = { stream: null, timer: 0, detector: null, video: null, canvas: null, lastText: '', lastAt: 0, want: false };

  const days = () => T.checkinDays(T.ev());
  function curDay() {
    const ds = days();
    let d = ds.find((x) => x.id === st.day);
    if (!d) d = ds.find((x) => x.date === T.today()) || ds.find((x) => /研究大会/.test(x.label || '')) || ds[0];
    st.day = d.id;
    return d;
  }
  const isIn = (p, d) => !!(p.checkin && p.checkin[d.id]);
  const lunchOf = (p, d) => {
    const v = T.pv(p, 'lunch');
    if (!Array.isArray(v) || !v.length) return false;
    const md = T.md(d.date);
    const short = md.replace(/（.）/, '');
    return v.some((x) => x.includes(md) || x.startsWith(short + '（') || x.startsWith(short + ' '));
  };

  /* ───────── 音 ───────── */
  let ac = null;
  function beep(kind) {
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === 'suspended') ac.resume();
      const tones = kind === 'ok' ? [[880, 0, 0.09], [1320, 0.1, 0.12]] : kind === 'warn' ? [[660, 0, 0.12], [660, 0.16, 0.12]] : [[220, 0, 0.32]];
      for (const [f, t, len] of tones) {
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = kind === 'bad' ? 'square' : 'sine';
        o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, ac.currentTime + t);
        g.gain.exponentialRampToValueAtTime(0.18, ac.currentTime + t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + t + len);
        o.connect(g).connect(ac.destination);
        o.start(ac.currentTime + t);
        o.stop(ac.currentTime + t + len + 0.02);
      }
    } catch (e) { /* 音が出せなくても受付はできる */ }
    try { if (navigator.vibrate) navigator.vibrate(kind === 'ok' ? 60 : [80, 60, 80]); } catch (e) { /* なにもしない */ }
  }

  /* ───────── 受付する ───────── */
  // text：QR の中身か受付番号。src：camera / reader / manual
  function handle(text, src) {
    const ev = T.ev();
    const d = curDay();
    const q = T.parseQr(text);
    if (!q) return show({ kind: 'bad', title: '読めない形です', msg: `「${String(text).slice(0, 40)}」は、この大会のQR・受付番号ではありません。` });
    const p = ev.people.find((x) => x.code === q.code);
    if (!p) return show({ kind: 'bad', title: '見つかりません', msg: `受付番号 ${q.code} の申込はありません。別の大会のQRかもしれません。名前で探してください。` });
    if (q.token && q.token !== p.token) return show({ kind: 'bad', title: '合言葉がちがいます', msg: `${q.code} のQRですが、合言葉が合いません。古いQRか、作りかえられたQRかもしれません。本人確認のうえ、名前で探して受付してください。`, pid: p.id });
    if (p.status === 'cancel') return show({ kind: 'bad', title: '取消された申込です', msg: `${T.pname(p)} さん（${p.code}）の申込は取消になっています。事務局に確認してください。`, pid: p.id });
    if (isIn(p, d)) return show({ kind: 'already', title: 'すでに受付ずみです', pid: p.id, at: p.checkin[d.id] });
    p.checkin = p.checkin || {};
    p.checkin[d.id] = T.now();
    st.last = { pid: p.id, day: d.id };
    T.logIt(`受付：${p.code} ${T.pname(p)}（${T.md(d.date)}${src === 'camera' ? '・カメラ' : src === 'reader' ? '・リーダー' : '・手入力'}）`, T.who());
    T.save();
    const unpaid = T.fee(p, ev) > 0 && !p.paid;
    show({ kind: unpaid ? 'warn' : 'ok', title: unpaid ? '受付しました（参加費が未入金です）' : '受付しました', pid: p.id, at: p.checkin[d.id] });
  }

  function show(res) {
    st.result = res;
    beep(res.kind === 'ok' ? 'ok' : res.kind === 'bad' ? 'bad' : 'warn');
    paint();
  }

  /* ───────── 部分的な書きかえ ───────── */
  function resultHtml() {
    const r = st.result;
    if (!r) return html`<div class="ci-result idle"><div class="ci-r-icon">${icon('qr')}</div><div><b>QRコードをかざしてください</b><p class="muted small">カメラ・QRリーダー・受付番号の入力・名前で探す、のどれでも受付できます。</p></div></div>`;
    const ev = T.ev();
    const d = curDay();
    const p = r.pid ? T.find(ev.people, r.pid) : null;
    const fee = p ? T.fee(p, ev) : 0;
    const needs = p && T.pv(p, 'needs');
    const lunch = p ? lunchOf(p, d) : false;
    const ic = { ok: 'check', warn: 'yen', already: 'clock', bad: 'x' }[r.kind];
    return html`<div class="ci-result ${r.kind}" role="status" aria-live="polite">
      <div class="ci-r-top"><span class="ci-r-icon">${icon(ic)}</span><b class="ci-r-title">${r.title}</b>${r.at ? html`<span class="ci-r-at">${T.time(r.at)}</span>` : ''}</div>
      ${p ? html`<div class="ci-r-person">
        <div class="ci-r-kana">${T.pv(p, 'kana') || ''}</div>
        <div class="ci-r-name">${T.pname(p)} <small class="mono">${p.code}</small></div>
        <div class="ci-r-org">${T.pv(p, 'org') || ''}</div>
        <div class="row ci-r-chips">
          ${T.pv(p, 'bu') ? html`<span class="chip pri">${T.pv(p, 'bu')}</span>` : ''}
          ${T.pv(p, 'section') ? html`<span class="chip">${T.pv(p, 'section')}</span>` : ''}
          ${T.pv(p, 'kind') ? html`<span class="chip">${T.pv(p, 'kind')}</span>` : ''}
          <span class="chip ${lunch ? 'gold' : ''}">${lunch ? '弁当あり' : '弁当なし'}</span>
        </div>
        ${needs ? html`<div class="ci-r-needs">${icon('flag')} 配慮：${needs}</div>` : ''}
        ${r.kind === 'warn' ? html`<div class="ci-r-collect">受付で参加費 <b>${T.yen(fee)}</b> を集金してください。<button class="btn sm primary" data-act="collect" data-id="${p.id}">${icon('yen')} 集金した（入金済みにする）</button></div>` : ''}
      </div>` : r.msg ? '' : ''}
      ${r.msg ? html`<p class="ci-r-msg">${r.msg}</p>` : ''}
      ${(r.kind === 'ok' || r.kind === 'warn') && st.last && st.last.pid === r.pid ? html`<div class="row end"><button class="btn sm ghost" data-act="undo">${icon('back')} この受付を取り消す</button></div>` : ''}
      ${p && r.kind !== 'ok' && r.kind !== 'warn' ? html`<div class="row end"><button class="btn sm ghost" data-act="person" data-id="${p.id}">${icon('user')} 詳しく見る</button></div>` : ''}
    </div>`;
  }

  function statsHtml() {
    const ev = T.ev();
    const act = T.active(ev);
    return html`<div class="ci-days" role="tablist" aria-label="受付する日">${days().map((d) => {
      const n = act.filter((p) => isIn(p, d)).length;
      return html`<button class="ci-day ${d.id === st.day ? 'on' : ''}" role="tab" aria-selected="${d.id === st.day}" data-act="day" data-id="${d.id}">
        <span class="ci-day-date">${T.md(d.date)}</span><span class="ci-day-label">${d.label || ''}</span>
        <span class="ci-day-n"><b>${n}</b> / ${act.length}</span>
        <span class="bar ok"><span style="width:${act.length ? (n / act.length) * 100 : 0}%"></span></span>
      </button>`;
    })}</div>`;
  }

  function recentHtml() {
    const ev = T.ev();
    const d = curDay();
    const list = T.active(ev).filter((p) => isIn(p, d)).sort((a, b) => (a.checkin[d.id] < b.checkin[d.id] ? 1 : -1)).slice(0, 10);
    if (!list.length) return html`<p class="muted small">この日の受付は、まだありません。</p>`;
    return html`<ul class="ci-recent">${list.map((p) => html`<li><span class="mono muted">${T.time(p.checkin[d.id])}</span> <b>${T.pname(p)}</b> <span class="muted small">${p.code}・${T.pv(p, 'org') || ''}</span>${T.fee(p, ev) && !p.paid ? html` <span class="chip warn">未入金</span>` : ''}</li>`)}</ul>`;
  }

  function searchHtml() {
    const q = st.q.trim().toLowerCase();
    if (!q) return html`<p class="muted small">氏名・ふりがな・受付番号・所属の一部を入れてください。</p>`;
    const ev = T.ev();
    const d = curDay();
    const hits = ev.people.filter((p) => [p.code, T.pv(p, 'name'), T.pv(p, 'kana'), T.pv(p, 'org')].join(' ').toLowerCase().includes(q)).slice(0, 8);
    if (!hits.length) return html`<p class="muted small">見つかりません。</p>`;
    return html`<ul class="ci-hits">${hits.map((p) => html`<li>
      <div class="ci-hit-main"><b>${T.pname(p)}</b> <small class="muted">${T.pv(p, 'kana') || ''}</small><br><span class="small muted">${p.code}・${T.pv(p, 'org') || ''}・${T.pv(p, 'bu') || ''}</span></div>
      ${p.status === 'cancel' ? html`<span class="chip bad">取消</span>` : isIn(p, d) ? html`<span class="chip ok">${icon('check')} ${T.time(p.checkin[d.id])}</span>` : html`<button class="btn sm primary" data-act="ciPerson" data-id="${p.id}">受付</button>`}
    </li>`)}</ul>`;
  }

  function paint() {
    const set = (sel, h) => { const el = document.querySelector(sel); if (el) el.innerHTML = String(h); };
    set('#ci-result', resultHtml());
    set('#ci-stats', statsHtml());
    set('#ci-recent', recentHtml());
    set('#ci-hits', searchHtml());
  }

  /* ───────── カメラ ───────── */
  const camOk = () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) && window.isSecureContext !== false;
  function camMsg(text, kind = '') {
    const el = document.getElementById('ci-cam-msg');
    if (el) { el.textContent = text; el.className = 'ci-cam-msg ' + kind; el.hidden = !text; }
  }
  function camButtons() {
    const b = document.getElementById('ci-cam-btn');
    if (b) b.innerHTML = String(cam.stream ? html`${icon('x')} カメラを止める` : html`${icon('camera')} カメラで読む`);
    const w = document.querySelector('.ci-video-wrap');
    if (w) w.classList.toggle('on', !!cam.stream);
  }
  function stopCam() {
    clearTimeout(cam.timer);
    if (cam.stream) cam.stream.getTracks().forEach((t) => t.stop());
    cam.stream = null;
    if (cam.video) { try { cam.video.srcObject = null; } catch (e) { /* なにもしない */ } }
    camButtons();
  }
  async function startCam() {
    if (!camOk()) { camMsg('この開き方ではカメラが使えません（https のページで開いてください）。QRリーダーか、受付番号の入力・名前で探す、で受付できます。', 'bad'); return; }
    cam.video = document.getElementById('ci-video');
    cam.canvas = cam.canvas || document.createElement('canvas');
    if (!cam.video) return;
    camMsg('カメラを準備しています…');
    try {
      cam.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
    } catch (e) {
      cam.stream = null;
      camMsg(e && e.name === 'NotAllowedError' ? 'カメラの使用が許可されませんでした。ブラウザの設定でカメラを許可するか、QRリーダー・受付番号の入力で受付してください。' : 'カメラが見つからないか、使えません。QRリーダー・受付番号の入力で受付できます。', 'bad');
      camButtons();
      return;
    }
    // 画面が描きかわっていたら止める
    if (!document.getElementById('ci-video')) { stopCam(); return; }
    cam.video.srcObject = cam.stream;
    try { await cam.video.play(); } catch (e) { /* なにもしない */ }
    cam.detector = null;
    try {
      if ('BarcodeDetector' in window) {
        const fm = await window.BarcodeDetector.getSupportedFormats();
        if (fm.includes('qr_code')) cam.detector = new window.BarcodeDetector({ formats: ['qr_code'] });
      }
    } catch (e) { cam.detector = null; }
    if (!cam.detector && !window.jsQR) { camMsg('QRを読む部品がありません。受付番号の入力で受付してください。', 'bad'); stopCam(); return; }
    camMsg('');
    camButtons();
    tick();
  }
  async function tick() {
    if (!cam.stream) return;
    const v = cam.video;
    let text = null;
    if (v && v.readyState >= 2 && v.videoWidth) {
      try {
        if (cam.detector) {
          const codes = await cam.detector.detect(v);
          if (codes && codes[0]) text = codes[0].rawValue;
        } else {
          const scale = Math.min(1, 640 / v.videoWidth);
          const w = Math.round(v.videoWidth * scale), h = Math.round(v.videoHeight * scale);
          const c = cam.canvas; c.width = w; c.height = h;
          const ctx = c.getContext('2d', { willReadFrequently: true });
          ctx.drawImage(v, 0, 0, w, h);
          const img = ctx.getImageData(0, 0, w, h);
          const r = window.jsQR(img.data, w, h, { inversionAttempts: 'dontInvert' });
          if (r && r.data) text = r.data;
        }
      } catch (e) { /* 1こまぶん読めなくても続ける */ }
    }
    if (text) {
      const now = Date.now();
      if (!(text === cam.lastText && now - cam.lastAt < 2000)) handle(text, 'camera');
      cam.lastText = text; cam.lastAt = now;
    }
    if (cam.stream) cam.timer = setTimeout(tick, cam.detector ? 120 : 180);
  }
  // 画面を離れたら止める
  window.addEventListener('hashchange', () => { const r = T.route(); if (!(r.where === 'admin' && r.id === 'checkin')) { cam.want = false; stopCam(); } });
  document.addEventListener('visibilitychange', () => { if (document.hidden && cam.stream) { stopCam(); cam.want = true; } });

  T.page('admin', 'checkin', {
    title: '受付（QR）', icon: 'scan', group: '参加者', order: 30,
    lead: '本人用のQRコードを読むと受付します。QRが出せない人は、受付番号か名前で探して受付します。',
    head() { return html`<button class="btn sm" data-act="testQr">${icon('qr')} テスト用：参加者のQRを出す</button><a class="btn sm" href="#/print/roster?back=admin/checkin">${icon('print')} 紙の受付名簿</a>`; },
    render() {
      // 描きなおすと video がなくなるので、いったん止めて mount でつけなおす
      const wasOn = !!cam.stream || cam.want;
      stopCam();
      cam.want = wasOn;
      const d = curDay();
      return html`
        <div id="ci-stats">${statsHtml()}</div>
        <div class="ci-grid">
          <div class="card ci-scan">
            <div class="ci-video-wrap">
              <video id="ci-video" playsinline muted></video>
              <div class="ci-frame" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
              <div class="ci-idle" aria-hidden="true">${icon('camera')}<span>カメラは止まっています</span></div>
            </div>
            <p id="ci-cam-msg" class="ci-cam-msg" hidden></p>
            <div class="row" style="margin-top:10px"><button class="btn primary" id="ci-cam-btn" data-act="cam">${icon('camera')} カメラで読む</button><span class="muted small">${T.md(d.date)} ${d.label || ''} の受付</span></div>
            <form class="ci-input" data-form="code" autocomplete="off">
              <label class="flabel" for="ci-code">QRリーダー・受付番号</label>
              <div class="row ci-input-row"><input id="ci-code" name="code" placeholder="例：SG-0012（リーダーで読むと自動で入ります）" autocomplete="off" autocapitalize="characters" spellcheck="false"><button class="btn">受付</button></div>
              <p class="help">USB・Bluetooth のQRリーダーは、この欄を選んでおくと、読んだときに自動で受付します（読み取りのあとに Enter が送られる設定で）。</p>
            </form>
          </div>
          <div class="ci-side">
            <div id="ci-result">${resultHtml()}</div>
            <div class="card flat"><div class="card-head"><h3>${icon('search')} 名前で探す</h3></div>
              <input type="search" id="ci-q" value="${st.q}" placeholder="氏名・ふりがな・受付番号・所属" aria-label="名前で探す" autocomplete="off">
              <div id="ci-hits">${searchHtml()}</div>
            </div>
            <div class="card flat"><div class="card-head"><h3>${icon('clock')} 最近の受付（${T.md(d.date)}）</h3></div><div id="ci-recent">${recentHtml()}</div></div>
          </div>
        </div>
        <div class="note" style="margin-top:16px"><p>受付の記録は、いまは<b>この端末（ブラウザ）の中だけ</b>に残ります。入口を2か所以上にして、何台かの端末で受付するには、データをサーバー（スプレッドシートなど）につなぐ必要があります。</p></div>`;
    },
    mount(root) {
      const q = root.querySelector('#ci-q');
      if (q) q.addEventListener('input', () => { st.q = q.value; const el = document.getElementById('ci-hits'); if (el) el.innerHTML = String(searchHtml()); });
      if (!camOk()) camMsg('この開き方ではカメラが使えません（https のページで開くと使えます）。QRリーダー・受付番号の入力・名前で探す、で受付できます。', 'warn');
      if (cam.want) startCam();
      const code = root.querySelector('#ci-code');
      if (code && !cam.want && window.matchMedia('(pointer:fine)').matches) code.focus({ preventScroll: true });
    },
    forms: {
      code(v, form) {
        const s = String(v.code || '').trim();
        if (!s) return;
        handle(s, /TAIKAI:/i.test(s) ? 'reader' : 'manual');
        form.reset();
        const el = form.querySelector('input'); if (el) el.focus();
      },
    },
    acts: {
      cam() { if (cam.stream) { cam.want = false; stopCam(); } else { cam.want = true; beepUnlock(); startCam(); } },
      day(el) { st.day = el.dataset.id; st.result = null; st.last = null; T.refresh(); },
      ciPerson(el) {
        const p = T.find(T.ev().people, el.dataset.id);
        if (p) handle(p.code, 'manual');
      },
      undo() {
        const l = st.last;
        if (!l) return;
        const p = T.find(T.ev().people, l.pid);
        if (p && p.checkin) { delete p.checkin[l.day]; T.logIt(`受付を取り消し：${p.code} ${T.pname(p)}`, T.who()); T.save(); }
        st.last = null;
        st.result = null;
        T.toast('受付を取り消しました');
        paint();
      },
      collect(el) {
        const p = T.find(T.ev().people, el.dataset.id);
        if (!p) return;
        p.paid = true; p.paidAt = T.now();
        T.logIt(`${p.code} ${T.pname(p)}：受付で集金（入金済み）`, T.who());
        T.save();
        st.result = Object.assign({}, st.result, { kind: 'ok', title: '受付しました（集金ずみ）' });
        paint();
      },
      person(el) { if (T.openPerson) T.openPerson(el.dataset.id); },
      testQr() { testQr(); },
    },
  });

  // iPhone などでは、押したときに音の準備をしておかないと鳴らない
  function beepUnlock() { try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume(); } catch (e) { /* なにもしない */ } }

  function testQr() {
    const ev = T.ev();
    const act = T.active(ev).slice().sort((a, b) => (a.code > b.code ? 1 : -1));
    if (!act.length) return T.toast('参加者がいません', 'warn');
    const qrOf = (p) => html`<div class="ci-test-qr">${T.raw(T.qrSvg(T.qrText(p), { label: p.code }))}</div><p class="center"><b>${T.pname(p)}</b> <span class="mono">${p.code}</span><br><span class="small muted">${T.qrText(p)}</span></p>`;
    T.modal({
      title: 'テスト用：参加者のQR',
      body: String(html`<p class="lead">別の端末（スマホ・タブレット）でこの画面を開き、受付の端末のカメラにかざして試せます。</p>
        <select data-testqr aria-label="参加者">${act.map((p) => html`<option value="${p.id}">${p.code}　${T.pname(p)}</option>`)}</select>
        <div data-testqr-out style="margin-top:12px">${qrOf(act[0])}</div>`),
      onOpen(w) {
        const s = w.querySelector('[data-testqr]');
        s.addEventListener('change', () => { const p = T.find(ev.people, s.value); w.querySelector('[data-testqr-out]').innerHTML = String(qrOf(p)); });
      },
    });
  }
})();
