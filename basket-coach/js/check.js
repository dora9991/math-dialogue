/* 動画チェックの画面（BC.check）。分析のしくみは js/analyze.js（BC.analyze）。動画は この端末の中だけで しらべる。
   ■ 約束（js/app.js から）
     BC.check.render(el, ctx, opt)  el にチェックの画面を描く。opt：{ mode（入口をとばして、その種類から）, record（保存した記録の id） }
       ctx：{ open(id), toast(msg), addXP(skill, n, why), store: { get(k, def), set(k, v) }, profile: { name, grade } }
       画面の中を進むときは、ハッシュを変えずに el の中だけを描きかえる（「もどる」は el の中のボタン）。
     BC.check.summaryHTML(rec)      きろくタブ用の1件のカード（#check/rec/<id> へのリンク）
     BC.check.MODES                 動きの種類（BC.analyze.MODES に kind・skill・icon を足したもの ＋ team）
   ■ 流れ
     じぶんの動き：とり方 → 動画をえらぶ → はんい → 人をえらぶ → しらべる → 結果
     チームの動き：とり方 → 動画をえらぶ → はんい → コートの4点 → チームの色 → しらべる → 結果
   ■ 保存：ctx.store の 'bc.checks'（新しい順・30件まで）。動画は保存しない（小さな絵だけ）。 */
(function () {
  const BC = window.BC;
  const BA = BC.analyze;
  const CK = (BC.check = BC.check || {});
  const KEY = 'bc.checks';
  const MAXREC = 30;

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const sec1 = (s) => (Math.round(s * 10) / 10).toFixed(1);
  const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#888';

  /* ---------- 絵（アイコン） ---------- */
  const svg = (d, w = 22) => `<svg class="ck-ic" width="${w}" height="${w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const IC = {
    cam: svg('<rect x="2.5" y="6" width="13" height="12" rx="2.5"/><path d="M15.5 10.5l6-3.5v10l-6-3.5z"/>'),
    lock: svg('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>', 18),
    back: svg('<path d="M15 5l-7 7 7 7"/>', 20),
    play: svg('<path d="M7 5l12 7-12 7z" fill="currentColor"/>', 20),
    pause: svg('<path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor" stroke="none"/>', 20),
    prev: svg('<path d="M16 6l-7 6 7 6"/><path d="M7 6v12"/>', 20),
    next: svg('<path d="M8 6l7 6-7 6"/><path d="M17 6v12"/>', 20),
    redo: svg('<path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4.5h4.5"/>', 20),
    eye: svg('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>', 18),
    tap: svg('<path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V11"/><path d="M12 10.5V9a1.5 1.5 0 0 1 3 0v2"/><path d="M15 10.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-.6a6 6 0 0 1-4.6-2.2L4 15.3a1.6 1.6 0 0 1 2.4-2.1L9 15.5"/>', 20),
    film: svg('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4"/>', 18),
    clock: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', 18),
    phone: svg('<rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18.5h2"/>', 18),
    side: svg('<circle cx="12" cy="5" r="2.2"/><path d="M12 7.5v6l-3 7M12 13.5l3 7M12 9.5l4 2"/>', 18),
    front: svg('<circle cx="12" cy="5" r="2.2"/><path d="M12 7.5v6M8 20.5l4-7 4 7M7 10.5l5-2 5 2"/>', 18),
    high: svg('<path d="M4 20l8-14 8 14z"/><path d="M12 6V2.5"/><circle cx="12" cy="2.5" r="0.5"/>', 18),
  };

  /* ---------- 動きの種類 ---------- */
  const SKILL = { shoot: 'shoot', dribble: 'dribble', defense: 'defball', landing: 'body', free: 'body', team: 'teamoff' };
  const MODES = (CK.MODES = {});
  for (const [k, m] of Object.entries(BA.MODES)) MODES[k] = Object.assign({ id: k, kind: 'self', skill: SKILL[k] }, m);
  // 見本の動きがなければ、近い動きで（例：前からの着地 → 横からの着地）
  if (MODES.landing.motion && BC.motions && !BC.motions[MODES.landing.motion]) MODES.landing.motion = 'landing';
  MODES.team = {
    id: 'team', kind: 'team', skill: 'teamoff', name: 'チームの動き', view: 'high', viewText: '高い所から（コートの半分が映るように）',
    motion: null, fps: 4, secs: 60, tip: '試合や 3対3・5対5 の練習を、高い所から 10秒〜1分',
  };
  const TEAM_THUMB = { o: [[-6.3, 1.2], [6.3, 1.2], [-4.6, 6.4], [4.6, 6.4], [0, 8.9]], x: [[-4.9, 2.1], [4.9, 2.1], [-3, 5.2], [3, 5.2], [0, 7.4]] };
  // 絵の範囲：人（とボール）が大きく見えるように、まわりを少しだけ（横:たて ＝ aspect）
  function figBox(id, aspect) {
    const clip = BC.motions[id];
    const fr = BC.motionFrame(clip, clip.still != null ? clip.still : 0.3);
    const s = fr.sk[0];
    const pts = [s.head, s.hip, s.r.hand, s.l.hand, s.r.knee, s.l.knee, ...s.r.foot, ...s.l.foot, ...fr.balls];
    let x0 = Math.min(...pts.map((p) => p[0])) - 0.3, x1 = Math.max(...pts.map((p) => p[0])) + 0.3;
    let y0 = -0.08, y1 = Math.max(...pts.map((p) => p[1])) + 0.32;
    const w = x1 - x0, h = y1 - y0;
    if (w / h < aspect) { const d = (h * aspect - w) / 2; x0 -= d; x1 += d; } else y1 += w / aspect - h;
    return [x0, x1, y0, y1];
  }
  // ホームなどの入口ボタン用の絵（SVG の文字列）
  for (const m of Object.values(MODES)) {
    Object.defineProperty(m, 'icon', {
      enumerable: true, configurable: true,
      get() {
        if (m.id === 'team') return BC.courtThumb ? BC.courtThumb(TEAM_THUMB) : '';
        const id = m.motion || 'stance';
        return BC.motions && BC.motions[id] ? BC.motionSVG(id, null, { cls: 'ck-fig', box: figBox(id, 1.6) }) : '';
      },
    });
  }
  // とり方（短い文。上から順に大事）
  const HOW = {
    shoot: { badges: [[IC.side, '横から'], [IC.clock, '5秒くらい'], [IC.phone, 'スマホを固定']], tips: ['横から とります（シュートする手の がわ から）', '頭から足まで、体ぜんぶが 映るように', 'スマホは 置くか、だれかに 持ってもらう（動かさない）', 'シュート1本（かまえ → 着地まで）で OK'] },
    dribble: { badges: [[IC.side, '横から'], [IC.clock, '5秒くらい'], [IC.phone, 'スマホを固定']], tips: ['横から とります', '頭から足まで、体ぜんぶが 映るように', 'その場で、低いドリブルを 5秒くらい', 'スマホは 動かさない'] },
    defense: { badges: [[IC.front, '前から'], [IC.clock, '10秒まで'], [IC.phone, 'スマホを固定']], tips: ['前から とります', '左右に スライドを 2〜3往復', '左右に動いても 体ぜんぶが 映るように、少し はなれて', 'スマホは 動かさない'] },
    landing: { badges: [[IC.front, '前から'], [IC.clock, '5秒くらい'], [IC.phone, 'スマホを固定']], tips: ['前から とります（ひざが 見えるように）', 'その場で ジャンプ → 着地して 止まる（1回）', '足の先まで 映るように', 'スマホは 動かさない'] },
    free: { badges: [[IC.side, '横か前から'], [IC.clock, '10秒まで'], [IC.phone, 'スマホを固定']], tips: ['どんな動きでも OK', '体ぜんぶが 映るように', 'ひざ・ひじの角度と、腰の高さが 見られます（◎○△ は 出ません）'] },
    team: { badges: [[IC.high, '高い所から'], [IC.clock, '10秒〜1分'], [IC.phone, 'スマホを固定']], tips: ['高い所（2階・観客席など）から とります', 'ゴールのある コートの半分が 映るように', 'スマホは 固定して、ズームも 動かさない', 'ユニフォームの色が ちがう 2チームで'] },
  };
  // 見本のアニメーションの場面（結果の場面ボタンと合わせる）
  const PHASE_ALIAS = { はなす: '放す', 着地: '吸収', いちばん低い: '吸収', とぶ: 'とぶ' };

  /* ---------- 状態 ---------- */
  let CTX = null;
  let S = null;
  const ST = { good: { m: '◎', t: 'よくできている' }, ok: { m: '○', t: 'もう少し' }, bad: { m: '△', t: 'ここを直そう' }, na: { m: '・', t: '目安' } };
  const store = () => (CTX && CTX.store) || {
    get: (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* なし */ } },
  };
  const toast = (m) => { if (CTX && CTX.toast) CTX.toast(m); };
  const records = () => { const r = store().get(KEY, []); return Array.isArray(r) ? r : []; };

  function fresh(mode) {
    cleanup();
    S = { mode: mode || null, step: mode ? 'how' : 'home', root: null, err: '' };
  }
  function cleanup() {
    if (!S) return;
    if (S.abort) S.abort.abort();
    stopLoop();
    if (S.video) { try { S.video.pause(); S.video.removeAttribute('src'); S.video.load(); } catch (e) { /* なし */ } }
    if (S.url) URL.revokeObjectURL(S.url);
  }
  function go(step, err) { S.step = step; S.err = err || ''; paint(); if (S.root) { const top = S.root.getBoundingClientRect().top; if (top < 0) window.scrollTo({ top: window.scrollY + top - 70 }); } }

  CK.render = function (el, ctx, opt = {}) {
    CTX = ctx || CTX;
    if (opt.record) { if (S) S.root = null; showRecord(el, opt.record); return; }
    if (opt.mode && MODES[opt.mode]) { if (!S || S.mode !== opt.mode) fresh(opt.mode); }
    else if (!S) fresh(null);
    S.root = el;
    paint();
  };

  /* ---------- 描く ---------- */
  const SCREENS = {};
  function paint() {
    if (!S || !S.root) return;
    stopLoop();
    const scr = SCREENS[S.step] || SCREENS.home;
    S.root.innerHTML = `<div class="ck" data-step="${S.step}">${scr.html()}</div>`;
    wire(S.root);
    if (scr.mount) scr.mount(S.root.querySelector('.ck'));
  }
  const live = () => S && S.root && S.root.isConnected;
  const backBtn = (to, label) => `<button type="button" class="ck-back" data-ck="${to}">${IC.back}<span>${label}</span></button>`;
  const errBox = () => (S.err ? `<p class="ck-err" role="alert">${esc(S.err)}</p>` : '');
  const modeName = (m) => (MODES[m] ? MODES[m].name : '');

  // ボタンの動き（data-ck）
  function wire(root) {
    if (root._ckWired) return;
    root._ckWired = true;
    root.addEventListener('click', (e) => {
      const b = e.target.closest('[data-ck]');
      if (!b || !root.contains(b)) return;
      const a = b.dataset.ck;
      const act = ACTIONS[a];
      if (act) { e.preventDefault(); act(b, e); }
    });
    root.addEventListener('change', (e) => {
      if (e.target.matches('.ck-file-input')) onFile(e.target);
    });
  }
  const ACTIONS = {
    home: () => { const r = currentRoot(); fresh(null); S.root = r; setHash('#check'); paint(); },
    mode: (b) => { const r = currentRoot(); fresh(b.dataset.mode); S.root = r; setHash('#check/' + b.dataset.mode); paint(); },
    how: () => go('how'),
    range: () => { S.video && S.video.pause(); go('range'); },
    preview: () => previewRange(),
    go: () => (MODES[S.mode].kind === 'team' ? startCalib() : startPerson()),
    stop: () => { if (S.abort) S.abort.abort(); },
    again: (b) => { const r = currentRoot(); fresh(b.dataset.mode || S.mode); S.root = r; paint(); },
    open: (b) => { if (CTX && CTX.open) CTX.open(b.dataset.id); },
    back: () => { if (history.length > 1) history.back(); else location.hash = '#check'; },
    recAgain: (b) => { fresh(b.dataset.mode); location.hash = '#check/' + b.dataset.mode; },
    retryAI: () => (S.step === 'color' ? startColor() : startPerson()),
    calibPreset: (b) => { S.calib = { preset: b.dataset.preset, pts: [] }; S.H = null; S.err = ''; paint(); },
    calibRedo: () => { S.calib.pts = []; S.H = null; paint(); },
    calibOk: () => startColor(),
    autoColor: () => autoColor(),
    colorRedo: () => { S.colors = []; paint(); },
    colorSwap: () => { S.colors.reverse(); paint(); },
    teamGo: () => runTeam(),
  };
  const currentRoot = () => S && S.root;
  // アドレスの # を、画面に合わせて書きかえる（hashchange は起こさない）
  const setHash = (h) => { try { if (/^#check/.test(location.hash) && location.hash !== h) history.replaceState(history.state, '', h); } catch (e) { /* なし */ } };

  /* ---------- 入口 ---------- */
  SCREENS.home = {
    html() {
      const recs = records().slice(0, 3);
      const card = (m) => {
        const h = HOW[m.id];
        return `<button type="button" class="ck-mode${m.id === 'team' ? ' ck-mode-team' : ''}" data-ck="mode" data-mode="${m.id}">
          <span class="ck-mode-fig">${m.icon}</span>
          <span class="ck-mode-txt"><b>${esc(m.name)}</b><small>${h.badges.slice(0, 2).map((x) => esc(x[1])).join('・')}</small></span>
        </button>`;
      };
      return `
        <header class="ck-head">
          <h1 class="ck-title">動画で チェック</h1>
          <p class="ck-lead">スマホで とった動画から、AI が 体の動きを しらべます。</p>
        </header>
        <p class="ck-privacy">${IC.lock}<span><b>動画は、この スマホ（パソコン）の中だけで しらべます。どこにも 送りません。</b>はじめての時だけ、AI の部品（やく 10MB）を インターネットから 読みこみます。</span></p>
        <h2 class="sec-h">じぶんの動き</h2>
        <div class="ck-modes">${['shoot', 'dribble', 'defense', 'landing', 'free'].map((k) => card(MODES[k])).join('')}</div>
        <h2 class="sec-h">チームの動き</h2>
        <div class="ck-modes ck-modes-1">${card(MODES.team)}</div>
        ${recs.length ? `<h2 class="sec-h">これまでの チェック</h2><div class="ck-sums">${recs.map(CK.summaryHTML).join('')}</div>` : ''}`;
    },
  };

  /* ---------- とり方 → 動画をえらぶ ---------- */
  SCREENS.how = {
    html() {
      const m = MODES[S.mode], h = HOW[S.mode];
      const model = m.motion && BC.motions && BC.motions[m.motion];
      return `
        ${backBtn('home', 'ほかの チェック')}
        <h1 class="ck-title">${esc(m.name)}を チェック</h1>
        <div class="ck-how">
          <div class="ck-how-fig">${model ? '<div class="ck-model"></div><p class="ck-cap">見本（正しい形）</p>' : m.id === 'team' ? `<div class="ck-teamfig ck-persp">${perspectiveCourt()}</div><p class="ck-cap">こんなふうに 映るように（ゴールが おくに 見える）</p>` : `<div class="ck-teamfig ck-free">${m.icon}</div>`}</div>
          <div class="ck-how-txt">
            <h2 class="sec-h">とり方</h2>
            <p class="ck-badges">${h.badges.map(([ic, t]) => `<span>${ic}${esc(t)}</span>`).join('')}</p>
            <ol class="ck-tips">${h.tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ol>
          </div>
        </div>
        ${errBox()}
        <label class="btn primary big ck-file">${IC.cam}<span>動画を えらぶ・とる</span><input type="file" accept="video/*" class="ck-file-input"></label>
        ${S.video && S.dur ? `<button type="button" class="btn big" data-ck="range">${IC.film}<span>さっきの動画で つづける</span></button>` : ''}
        <p class="ck-privacy ck-privacy-s">${IC.lock}<span>動画は どこにも 送りません。この中だけで しらべます。</span></p>`;
    },
    mount(root) {
      const m = MODES[S.mode];
      const box = root.querySelector('.ck-model');
      if (box && m.motion) BC.anim(box, m.motion, { points: false, compact: true, autoplay: true });
    },
  };

  function onFile(input) {
    const f = input.files && input.files[0];
    if (!f) return;
    if (S.video) { try { S.video.pause(); } catch (e) { /* なし */ } }
    if (S.url) URL.revokeObjectURL(S.url);
    S.err = '';
    S.file = f;
    S.url = URL.createObjectURL(f);
    const v = document.createElement('video');
    v.className = 'ck-video';
    v.muted = true; v.playsInline = true; v.preload = 'auto';
    v.setAttribute('playsinline', ''); v.setAttribute('muted', '');
    S.video = v; S.dur = 0; S.result = null; S.team = null; S.pickHip = null; S.calib = null; S.H = null; S.colors = [];
    S.primed = false; S.cands = null; S.people0 = null; S.snap = null; S.work = null; S.rate = 1; S.mini = null;
    const fail = () => { if (S.video !== v) return; S.video = null; go('how', 'この動画は、このブラウザでは 開けませんでした。スマホの カメラで とりなおすか、MP4 の動画を えらんでください。'); };
    v.addEventListener('error', fail, { once: true });
    const ready = () => {
      if (!v.videoWidth || !isFinite(v.duration) || !v.duration) return fail();
      S.dur = v.duration;
      const max = MODES[S.mode].secs;
      S.from = 0; S.to = Math.min(S.dur, max);
      go('range');
    };
    v.addEventListener('loadedmetadata', () => {
      // 長さが分からない動画（Infinity）は、いちばん うしろへ シークすると 分かる
      if (v.duration === Infinity) {
        v.addEventListener('durationchange', function dc() { if (isFinite(v.duration)) { v.removeEventListener('durationchange', dc); v.currentTime = 0; ready(); } });
        v.currentTime = 1e101;
      } else ready();
    }, { once: true });
    v.src = S.url;
    v.load();
  }

  /* ---------- はんいを えらぶ ---------- */
  SCREENS.range = {
    html() {
      const m = MODES[S.mode];
      const long = S.dur > m.secs + 0.05;
      return `
        ${backBtn('how', 'もどる')}
        <h1 class="ck-title">どこを しらべる？</h1>
        <div class="ck-stage" style="aspect-ratio:${S.video.videoWidth}/${S.video.videoHeight}"><div class="ck-vslot"></div></div>
        <div class="ck-range">
          <p class="ck-range-sum"><b class="num" data-r="len">${sec1(S.to - S.from)}</b> 秒を しらべます <small>（${sec1(S.from)}秒 〜 ${sec1(S.to)}秒・さいだい ${m.secs}秒）</small></p>
          ${long ? '<p class="ck-note">長い動画なので、しらべる所を えらんでください。</p>' : ''}
          <details class="ck-rangebox"${long ? ' open' : ''}>
            <summary>はんいを かえる</summary>
            <label class="ck-sl"><span>はじめ <b class="num" data-r="from">${sec1(S.from)}</b>秒</span><input type="range" data-rng="from" min="0" max="${Math.round(S.dur * 10)}" value="${Math.round(S.from * 10)}" step="1"></label>
            <label class="ck-sl"><span>おわり <b class="num" data-r="to">${sec1(S.to)}</b>秒</span><input type="range" data-rng="to" min="0" max="${Math.round(S.dur * 10)}" value="${Math.round(S.to * 10)}" step="1"></label>
          </details>
          <button type="button" class="btn" data-ck="preview">${IC.play}<span>この はんいを 見る</span></button>
        </div>
        ${errBox()}
        <button type="button" class="btn primary big" data-ck="go">${m.kind === 'team' ? 'つぎへ（コートの位置）' : 'この はんいを しらべる'}</button>`;
    },
    mount(root) {
      root.querySelector('.ck-vslot').replaceWith(S.video);
      S.video.controls = false;
      seekTo(S.from);
      const max = MODES[S.mode].secs;
      root.querySelectorAll('[data-rng]').forEach((r) => r.addEventListener('input', () => {
        const which = r.dataset.rng;
        let a = (+root.querySelector('[data-rng="from"]').value) / 10, b = (+root.querySelector('[data-rng="to"]').value) / 10;
        if (which === 'from') { if (b - a > max) b = a + max; if (b - a < 0.5) b = Math.min(S.dur, a + 0.5); if (b - a < 0.5) a = b - 0.5; }
        else { if (b - a > max) a = b - max; if (b - a < 0.5) a = Math.max(0, b - 0.5); if (b - a < 0.5) b = a + 0.5; }
        S.from = clamp(a, 0, S.dur); S.to = clamp(b, 0, S.dur);
        root.querySelector('[data-rng="from"]').value = Math.round(S.from * 10);
        root.querySelector('[data-rng="to"]').value = Math.round(S.to * 10);
        root.querySelector('[data-r="from"]').textContent = sec1(S.from);
        root.querySelector('[data-r="to"]').textContent = sec1(S.to);
        root.querySelector('[data-r="len"]').textContent = sec1(S.to - S.from);
        root.querySelector('.ck-range-sum small').textContent = `（${sec1(S.from)}秒 〜 ${sec1(S.to)}秒・さいだい ${max}秒）`;
        S.video.pause();
        seekTo(which === 'from' ? S.from : S.to);
      }));
    },
  };
  function seekTo(t) { try { S.video.currentTime = clamp(t, 0, Math.max(0, S.dur - 0.001)); } catch (e) { /* なし */ } }
  function previewRange() {
    const v = S.video;
    if (!v.paused) { v.pause(); return; }
    seekTo(S.from);
    const stopAt = () => { if (v.currentTime >= S.to - 0.02) { v.pause(); v.removeEventListener('timeupdate', stopAt); } };
    v.addEventListener('timeupdate', stopAt);
    const p = v.play();
    if (p && p.catch) p.catch(() => {});
  }
  // iPhone などで、コマを描けるように一度だけ再生して止める
  async function prime() {
    const v = S.video;
    if (S.primed) return;
    S.primed = true;
    try { const p = v.play(); if (p && p.then) await p; v.pause(); } catch (e) { /* なし */ }
  }

  /* ---------- 作業用のキャンバス（長い辺 640px） ---------- */
  function work() {
    const v = S.video;
    // チームは遠くの人も見つけたいので大きめ（左右2つに分けて、AI に見せる）
    const k = Math.min(1, (MODES[S.mode].kind === 'team' ? 960 : 640) / Math.max(v.videoWidth, v.videoHeight));
    if (!S.work) S.work = document.createElement('canvas');
    S.work.width = Math.round(v.videoWidth * k);
    S.work.height = Math.round(v.videoHeight * k);
    S.wctx = S.work.getContext('2d', { willReadFrequently: true });
    return S.work;
  }
  const grab = () => S.wctx.drawImage(S.video, 0, 0, S.work.width, S.work.height);

  /* ---------- AI の読みこみ ---------- */
  async function loadAI(kind) {
    S.loading = { p: 0, t0: Date.now() };
    paintLoad();
    const tm = setInterval(paintLoad, 500);
    try {
      return await BA.load(kind, (p) => { S.loading.p = p; paintLoad(); });
    } finally {
      clearInterval(tm);
      S.loading = null;
    }
  }
  function paintLoad() {
    if (!live() || !S.loading) return;
    const el = S.root.querySelector('.ck-load');
    if (!el) return;
    const sec = Math.round((Date.now() - S.loading.t0) / 1000);
    el.querySelector('i').style.width = Math.round(S.loading.p * 100) + '%';
    el.querySelector('.ck-load-t').textContent = S.loading.p > 0 && S.loading.p < 1 ? `AI を 読みこみ中… ${Math.round(S.loading.p * 100)}%` : sec > 40 ? '時間が かかっています。インターネットに つながっているか、たしかめてください。' : 'AI を じゅんび中…（はじめての時は 10〜30秒）';
  }
  const loadHTML = () => `<div class="ck-load" aria-live="polite"><span class="ck-spin" aria-hidden="true"></span><p class="ck-load-t">AI を じゅんび中…</p><div class="ck-bar"><i></i></div></div>`;
  const aiFail = (e) => {
    console.warn(e);
    return 'AI の部品を 読みこめませんでした。インターネットに つながっている時に、もう一度 ためしてください。';
  };

  /* ---------- 人をえらぶ（じぶんの動き） ---------- */
  SCREENS.person = {
    html() {
      if (S.err && !S.cands && !S.loading) return `${backBtn('range', 'もどる')}<h1 class="ck-title">AI を 読みこめません</h1>${errBox()}<button type="button" class="btn primary big" data-ck="retryAI">${IC.redo}<span>もう一度 ためす</span></button>`;
      if (S.loading || !S.cands) return `${backBtn('range', 'もどる')}<h1 class="ck-title">人を さがしています</h1>${loadHTML()}`;
      if (!S.cands.length) {
        return `${backBtn('range', 'もどる')}<h1 class="ck-title">人が 見つかりません</h1>
          <p class="ck-note">はじめの コマで、人を 見つけられませんでした。体ぜんぶ（頭から足まで）が 映っている所から はじめてください。</p>
          <div class="ck-stage" style="aspect-ratio:${S.work.width}/${S.work.height}"><canvas class="ck-pickc"></canvas></div>
          <button type="button" class="btn primary big" data-ck="range">はんいを かえる</button>
          <button type="button" class="btn big" data-ck="how">ほかの 動画を えらぶ</button>`;
      }
      return `${backBtn('range', 'もどる')}<h1 class="ck-title">しらべる人を タップ</h1>
        <p class="ck-note">${S.cands.length}人 見つかりました。しらべる人を タップしてください。</p>
        <div class="ck-stage ck-tapzone" style="aspect-ratio:${S.work.width}/${S.work.height}"><canvas class="ck-pickc"></canvas></div>`;
    },
    mount(root) {
      const c = root.querySelector('.ck-pickc');
      if (!c) return;
      drawPick(c);
      if (!S.cands.length) return;
      c.addEventListener('click', (e) => {
        const r = c.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width) * S.work.width, y = ((e.clientY - r.top) / r.height) * S.work.height;
        let best = -1, bd = Infinity;
        S.cands.forEach((lm, i) => {
          const b = BA.boxOf(lm);
          const inside = x >= b[0] - 10 && x <= b[2] + 10 && y >= b[1] - 10 && y <= b[3] + 10;
          const d = Math.hypot((b[0] + b[2]) / 2 - x, (b[1] + b[3]) / 2 - y) - (inside ? 1e4 : 0);
          if (d < bd) { bd = d; best = i; }
        });
        if (best >= 0) { S.pickHip = BA.hipCenter(S.cands[best]); runSelf(); }
      });
    },
  };
  function drawPick(c) {
    const W = S.work.width, H = S.work.height;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = W * dpr; c.height = H * dpr;
    const g = c.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.drawImage(S.snap || S.work, 0, 0, W, H);
    const k = uiK(c, W);
    (S.cands || []).forEach((lm, i) => {
      drawSkeleton(g, lm, 1, 1, { lw: 3 * k });
      const b = BA.boxOf(lm);
      g.lineWidth = 3 * k; g.strokeStyle = '#fff'; g.setLineDash([8 * k, 6 * k]);
      g.strokeRect(b[0] - 8 * k, b[1] - 8 * k, b[2] - b[0] + 16 * k, b[3] - b[1] + 16 * k);
      g.setLineDash([]);
      label(g, String(i + 1), (b[0] + b[2]) / 2, b[1] - 24 * k, { big: true, k });
    });
  }

  async function startPerson() {
    await prime();
    go('person');
    S.cands = null;
    let pose;
    try { pose = await loadAI('pose'); } catch (e) { S.err = aiFail(e); return paint(); }
    if (!S || S.step !== 'person') return;
    work();
    await BA.seek(S.video, S.from);
    grab();
    S.snap = cloneCanvas(S.work);
    const r = pose.detectForVideo(S.work, BA.tick(500));
    S.cands = r.landmarks.map((lm) => BA.toPx(lm, S.work.width, S.work.height));
    if (S.cands.length === 1) { S.pickHip = BA.hipCenter(S.cands[0]); return runSelf(); }
    paint();
  }
  function cloneCanvas(src) { const c = document.createElement('canvas'); c.width = src.width; c.height = src.height; c.getContext('2d').drawImage(src, 0, 0); return c; }
  // 小さな絵（きろくの絵用。幅 168px）
  function miniCopy(src) {
    const c = document.createElement('canvas');
    c.width = 168; c.height = Math.min(240, Math.round((168 * src.height) / src.width));
    c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
    return c;
  }

  /* ---------- しらべる（じぶんの動き） ---------- */
  SCREENS.run = {
    html() {
      const p = S.prog || { i: 0, n: 0 };
      return `<h1 class="ck-title">しらべています…</h1>
        <div class="ck-stage" style="aspect-ratio:${S.work.width}/${S.work.height}"><canvas class="ck-livec"></canvas></div>
        <div class="ck-bar ck-bar-big"><i style="width:${p.n ? Math.round((p.i / p.n) * 100) : 0}%"></i></div>
        <p class="ck-prog" aria-live="polite">コマ <b class="num">${p.i}</b> / <span class="num">${p.n}</span></p>
        <button type="button" class="btn big" data-ck="stop">やめる</button>`;
    },
  };
  function paintProg(people, teamMode) {
    if (!live() || S.step !== 'run') return;
    const root = S.root;
    const p = S.prog;
    const bar = root.querySelector('.ck-bar i'), txt = root.querySelector('.ck-prog');
    if (bar) bar.style.width = Math.round((p.i / p.n) * 100) + '%';
    if (txt) txt.innerHTML = `コマ <b class="num">${p.i}</b> / <span class="num">${p.n}</span>`;
    const c = root.querySelector('.ck-livec');
    if (!c) return;
    const W = S.work.width, H = S.work.height;
    if (c.width !== W) { c.width = W; c.height = H; }
    const g = c.getContext('2d');
    g.drawImage(S.work, 0, 0);
    const k = uiK(c, W);
    if (teamMode) {
      for (const q of people || []) {
        g.lineWidth = 3 * k;
        g.strokeStyle = q.team === 0 ? css('--ck-off') : q.team === 1 ? css('--ck-def') : 'rgba(255,255,255,0.7)';
        g.strokeRect(q.box.x, q.box.y, q.box.w, q.box.h);
      }
    } else for (const lm of people || []) drawSkeleton(g, lm, 1, 1, { lw: 3 * k });
  }

  async function runSelf() {
    const m = MODES[S.mode];
    const fps = m.fps;
    S.prog = { i: 0, n: Math.max(1, Math.floor((S.to - S.from) * fps)) + 1 };
    go('run');
    let pose;
    try { pose = await BA.load('pose'); } catch (e) { return go('range', aiFail(e)); }
    const ac = new AbortController();
    S.abort = ac;
    const poses = [], times = [];
    const W = S.work.width, H = S.work.height;
    S.mini = [];
    try {
      await BA.sample(S.video, {
        from: S.from, to: S.to, fps, signal: ac.signal,
        onFrame: (t) => {
          grab();
          S.mini.push(miniCopy(S.work));
          const r = pose.detectForVideo(S.work, BA.tick(1000 / fps));
          const ps = r.landmarks.map((lm) => BA.toPx(lm, W, H));
          poses.push(ps); times.push(t);
          S.prog.i = poses.length;
          paintProg(ps);
        },
      });
    } catch (e) {
      S.abort = null;
      if (ac.signal.aborted) { toast('やめました'); return go('range'); }
      console.warn(e);
      return go('range', 'とちゅうで うまく しらべられませんでした。もう一度 ためしてください。');
    }
    S.abort = null;
    const first = poses.findIndex((p) => p.length);
    const pick = first >= 0 && S.pickHip ? BA.nearest(poses[first], S.pickHip) : null;
    const tracked = BA.track(poses, pick >= 0 ? pick : null);
    const res = BA.analyzeSelf(tracked, { mode: S.mode, fps, times });
    const score = res.ok ? BA.score(res.metrics || []) : null;
    S.result = { res, tracked, smooth: BA.smooth(tracked), times, fps, score, mode: S.mode, W, H, saved: false };
    if (res.ok) saveSelf();
    go('result');
  }

  /* ---------- 骨格を描く ---------- */
  const BONES = [[11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28], [27, 29], [29, 31], [27, 31], [28, 30], [30, 32], [28, 32]];
  const JOINTS = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
  function drawSkeleton(g, lm, sx, sy, opt = {}) {
    const lw = opt.lw || 3;
    const ok = (p) => p && p[2] > 0.25;
    g.lineCap = 'round'; g.lineJoin = 'round';
    for (const pass of [0, 1]) {
      g.lineWidth = pass ? lw : lw + 3;
      g.strokeStyle = pass ? opt.color || '#fff' : 'rgba(0,0,0,0.55)';
      g.beginPath();
      for (const [a, b] of BONES) {
        const p = lm[a], q = lm[b];
        if (!ok(p) || !ok(q)) continue;
        g.moveTo(p[0] * sx, p[1] * sy); g.lineTo(q[0] * sx, q[1] * sy);
      }
      g.stroke();
    }
    for (const j of JOINTS) {
      const p = lm[j];
      if (!ok(p)) continue;
      g.beginPath(); g.arc(p[0] * sx, p[1] * sy, j === 0 ? lw * 1.6 : lw * 1.2, 0, Math.PI * 2);
      g.fillStyle = '#fff'; g.fill();
      g.lineWidth = 1.5; g.strokeStyle = 'rgba(0,0,0,0.6)'; g.stroke();
    }
  }
  // 文字のラベル。k：キャンバスの1画素が 画面の何 px か の逆数（大きなキャンバスでも、画面で同じ大きさに）
  function label(g, text, x, y, opt = {}) {
    const k = opt.k || 1;
    const fs = (opt.big ? 22 : opt.fs || 15) * k;
    g.font = `700 ${fs}px ${css('--font-body') || 'sans-serif'}`;
    const w = g.measureText(text).width + 14 * k, h = fs + 10 * k;
    const bx = clamp(x - w / 2, 2, g.canvas.width / (g.getTransform().a || 1) - w - 2), by = clamp(y - h / 2, 2, g.canvas.height / (g.getTransform().d || 1) - h - 2);
    g.fillStyle = opt.bg || 'rgba(255,255,255,0.94)';
    g.strokeStyle = opt.edge || 'rgba(0,0,0,0.25)';
    g.lineWidth = k;
    roundRect(g, bx, by, w, h, h / 2); g.fill(); g.stroke();
    g.fillStyle = opt.ink || '#1f2328';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, bx + w / 2, by + h / 2 + 1);
  }
  // キャンバス c（論理の幅 W）が、画面で何 px に見えているか → 大きさをそろえる倍率
  const uiK = (c, W) => { const w = c.getBoundingClientRect().width || 360; return W / w; };
  function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  // 角度のしるし（ひざ・ひじ）
  function angleMark(g, a, b, c, sx, sy, text, col) {
    const ang = BA.ang3(a, b, c);
    const r = 18;
    const t1 = Math.atan2(a[1] * sy - b[1] * sy, a[0] * sx - b[0] * sx), t2 = Math.atan2(c[1] * sy - b[1] * sy, c[0] * sx - b[0] * sx);
    let d = t2 - t1; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
    g.beginPath(); g.arc(b[0] * sx, b[1] * sy, r, t1, t1 + d, d < 0);
    g.lineWidth = 4; g.strokeStyle = col; g.stroke();
    // ラベルは、角の反対がわ（外がわ）に
    const mx = Math.cos(t1 + d / 2), my = Math.sin(t1 + d / 2);
    label(g, `${text} ${Math.round(ang)}°`, b[0] * sx - mx * 46, b[1] * sy - my * 30, { ink: '#14532d' });
  }
  // 結果の動画の上：その時刻の骨格（前後のコマの間をなめらかに）と角度
  function poseAt(R, t) {
    const T = R.times;
    if (!T.length) return null;
    let i = 0;
    while (i < T.length - 1 && T[i + 1] <= t) i++;
    const a = R.smooth[i], b = R.smooth[Math.min(T.length - 1, i + 1)];
    if (!a) return b && Math.abs(T[i + 1] - t) < 0.12 ? b : null;
    if (!b || i === T.length - 1 || T[i + 1] === T[i]) return a;
    const u = clamp((t - T[i]) / (T[i + 1] - T[i]), 0, 1);
    return a.map((p, k) => [p[0] + (b[k][0] - p[0]) * u, p[1] + (b[k][1] - p[1]) * u, Math.min(p[2], b[k][2])]);
  }
  function drawOverlay() {
    if (!S || !S.result) return;
    const R = S.result;
    const c = S.root && S.root.querySelector('.ck-over');
    if (!c) return;
    const rect = c.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.round(rect.width * dpr), h = Math.round(rect.height * dpr);
    if (!w || !h) return;
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    const g = c.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, w, h);
    if (!S.showBones) return;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const lm = poseAt(R, S.video.currentTime);
    if (!lm) return;
    const sx = rect.width / R.W, sy = rect.height / R.H;
    drawSkeleton(g, lm, sx, sy, { lw: 3.5, color: '#fff' });
    const okc = css('--ok');
    const res = R.res;
    const view = res.view || 'side';
    const K = BA.K;
    if (view === 'side') {
      // 横から：見えている方のひざ（シュート・じゆうは ひじも）
      const s = lm[K.lKn][2] >= lm[K.rKn][2] ? 'l' : 'r';
      angleMark(g, lm[K[s + 'Hip']], lm[K[s + 'Kn']], lm[K[s + 'An']], sx, sy, 'ひざ', okc);
      if (R.mode === 'shoot' || R.mode === 'free') {
        const e = R.mode === 'shoot' && res.hand ? res.hand : lm[K.lEl][2] >= lm[K.rEl][2] ? 'l' : 'r';
        angleMark(g, lm[K[e + 'Sh']], lm[K[e + 'El']], lm[K[e + 'Wr']], sx, sy, 'ひじ', okc);
      }
    } else {
      // 前から：ひざの角度は写真では はかれないので、腰の高さ（と、着地では ひざが内に入る角度）
      const f = nearestFeature(R, S.video.currentTime);
      if (f) {
        const hip = [(lm[K.lHip][0] + lm[K.rHip][0]) / 2, (lm[K.lHip][1] + lm[K.rHip][1]) / 2];
        label(g, `腰 ${Math.round(f.hipH * 100)}%`, hip[0] * sx, hip[1] * sy - 4, { ink: '#14532d' });
        if (R.mode === 'landing') {
          for (const s of ['l', 'r']) {
            const v = s === 'l' ? f.fppaL : f.fppaR;
            if (v > 5) label(g, `内へ ${Math.round(v)}°`, lm[K[s + 'Kn']][0] * sx + (s === 'l' ? 40 : -40), lm[K[s + 'Kn']][1] * sy, { ink: '#7f1d1d' });
          }
        }
      }
    }
  }
  function nearestFeature(R, t) {
    const F = R.res.series || [];
    let bi = -1, bd = Infinity;
    R.times.forEach((x, i) => { if (!F[i]) return; const d = Math.abs(x - t); if (d < bd) { bd = d; bi = i; } });
    return bi >= 0 && bd < 0.2 ? F[bi] : null;
  }

  /* ---------- 結果（じぶんの動き） ---------- */
  const headline = (sc) => (sc == null ? 'しらべました！' : sc >= 85 ? 'すばらしい！' : sc >= 65 ? 'いい感じ！' : sc >= 40 ? 'のびしろ たっぷり！' : 'ここから のびる！');
  function ring(score) {
    const r = 34, C = 2 * Math.PI * r, v = score == null ? 0 : clamp(score, 0, 100);
    const col = score == null ? 'var(--line-2)' : v >= 80 ? 'var(--ok)' : v >= 50 ? 'var(--warn)' : 'var(--ball)';
    return `<svg class="ck-ring" viewBox="0 0 84 84" role="img" aria-label="${score == null ? '点数なし' : score + '点'}">
      <circle cx="42" cy="42" r="${r}" class="ck-ring-bg"/>
      <circle cx="42" cy="42" r="${r}" fill="none" stroke="${col}" stroke-width="9" stroke-linecap="round" stroke-dasharray="${(C * v) / 100} ${C}" transform="rotate(-90 42 42)"/>
      <text x="42" y="40" class="ck-ring-n">${score == null ? '−' : score}</text><text x="42" y="60" class="ck-ring-u">${score == null ? '' : '点'}</text></svg>`;
  }
  function metricCard(mt, opt = {}) {
    const st = ST[mt.status] || ST.na;
    const links = (mt.links || []).map((id) => (BC.get ? BC.get(id) : null) ? [id, BC.get(id)] : null).filter(Boolean).slice(0, opt.main ? 3 : 2);
    return `<article class="ck-met ck-${mt.status}${opt.main ? ' ck-met-main' : ''}">
      <header class="ck-met-h"><span class="ck-st" aria-label="${st.t}">${st.m}</span><span class="ck-met-l">${esc(mt.label)}</span><b class="ck-met-v">${esc(mt.value)}</b></header>
      <p class="ck-met-msg">${esc(mt.msg)}</p>
      ${mt.note ? `<p class="ck-met-note">${esc(mt.note)}</p>` : ''}
      <div class="ck-met-act">
        ${opt.seek && mt.at != null && mt.at >= 0 ? `<button type="button" class="chip ck-seek" data-ck="seekAt" data-i="${mt.at}">${IC.eye}<span>見る</span></button>` : ''}
        ${links.length ? `<span class="ck-met-lk">練習</span>${links.map(([id, it]) => `<button type="button" class="chip ck-link" data-ck="open" data-id="${esc(id)}">${esc(it.name || it.title)}</button>`).join('')}` : ''}
      </div>
    </article>`;
  }
  // 1つだけ直す点：△ があれば最初の △、なければ最初の ○
  const mainFix = (ms) => ms.find((m) => m.status === 'bad') || ms.find((m) => m.status === 'ok') || null;

  SCREENS.result = {
    html() {
      const R = S.result;
      const res = R.res;
      const m = MODES[R.mode];
      const ms = (res.metrics || []).filter((x) => x.status !== 'na');
      const goods = ms.filter((x) => x.status === 'good');
      const fix = mainFix(ms);
      const extra = (res.metrics || []).filter((x) => x.status === 'na');
      const cnt = (s) => ms.filter((x) => x.status === s).length;
      return `
        ${backBtn('home', 'ほかの チェック')}
        <h1 class="ck-title">${esc(m.name)}の 結果</h1>
        ${res.ok ? `<div class="ck-sum-top">${ring(R.score)}<div><p class="ck-head2">${headline(R.score)}</p>
          ${ms.length ? `<p class="ck-counts"><span class="ck-good">◎ ${cnt('good')}</span><span class="ck-okk">○ ${cnt('ok')}</span><span class="ck-badd">△ ${cnt('bad')}</span></p>` : '<p class="ck-note">じゆうモードでは、角度と高さを 見られます。</p>'}</div></div>`
          : `<p class="ck-err" role="alert">${esc(res.msg)}</p>`}
        <div class="ck-player">
          <div class="ck-stage" style="aspect-ratio:${R.W}/${R.H}"><div class="ck-vslot"></div><canvas class="ck-over"></canvas></div>
          <div class="ck-ctl">
            <button type="button" class="ck-ib ck-play" data-ck="play" aria-label="再生">${IC.play}</button>
            <button type="button" class="ck-ib" data-ck="stepB" aria-label="前のコマ">${IC.prev}</button>
            <input type="range" class="ck-scrub" min="0" max="1000" value="0" aria-label="時間">
            <button type="button" class="ck-ib" data-ck="stepF" aria-label="次のコマ">${IC.next}</button>
            <button type="button" class="ck-speed num" data-ck="speed" aria-label="速さ">1×</button>
          </div>
          <div class="ck-keys">
            ${(res.keys || []).map((k) => `<button type="button" class="chip ck-key" data-ck="seekAt" data-i="${k.i}">${esc(k.label)}</button>`).join('')}
            <button type="button" class="chip" data-ck="bones" aria-pressed="${S.showBones ? 'true' : 'false'}">骨格</button>
          </div>
        </div>
        ${res.ok && ms.length ? `
          <section class="ck-sec"><h2 class="sec-h">よく できているところ</h2>
            ${goods.length ? `<ul class="ck-goods">${goods.map((x) => `<li><span class="ck-st">◎</span>${esc(x.label)}<small>${esc(x.msg)}</small></li>`).join('')}</ul>` : '<p class="ck-note">さいごまで ちょうせん できたのが すばらしい！ まずは 下の 1つから はじめましょう。</p>'}
          </section>
          ${fix ? `<section class="ck-sec"><h2 class="sec-h">つぎは ここ（1つだけ）</h2>${metricCard(fix, { main: true, seek: true })}</section>` : '<section class="ck-sec"><p class="ck-cheer">ぜんぶ ◎ です！ つぎは、もっと速く・試合に近い形で ためしてみましょう。</p></section>'}
          <section class="ck-sec"><h2 class="sec-h">ぜんぶの 結果</h2><div class="ck-mets">${ms.map((x) => metricCard(x, { seek: true })).join('')}${extra.map((x) => metricCard(x)).join('')}</div></section>` : ''}
        ${res.ok || (res.series && res.series.some(Boolean)) ? `<section class="ck-sec"><h2 class="sec-h">グラフ</h2><div class="ck-charts"></div><p class="ck-note ck-note-s">高さは「脚の長さ」を 100% としたときの高さ（まっすぐ立つと 100% くらい）。グラフを さわると、その時の 動画に うつります。</p></section>` : ''}
        ${m.motion && BC.motions && BC.motions[m.motion] ? `<section class="ck-sec"><h2 class="sec-h">見本と くらべる</h2>
          <div class="ck-cmp"><figure><canvas class="ck-snap"></canvas><figcaption>じぶん</figcaption></figure><figure><div class="ck-model2"></div><figcaption>見本</figcaption></figure></div>
          <p class="ck-note ck-note-s">場面の ボタン（${(res.keys || []).slice(0, 3).map((k) => esc(k.label)).join('・') || '上'}）を おすと、両方が その場面に なります。</p></section>` : ''}
        ${(res.notes || []).length ? `<section class="ck-sec"><h2 class="sec-h">とり方の アドバイス</h2><ul class="ck-notes">${res.notes.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></section>` : ''}
        <div class="ck-end">
          <button type="button" class="btn primary big" data-ck="again" data-mode="${R.mode}">${IC.redo}<span>もう一度 とる</span></button>
          <button type="button" class="btn big" data-ck="home">ほかの チェック</button>
        </div>`;
    },
    mount(root) {
      const R = S.result;
      if (S.showBones == null) S.showBones = true;
      mountPlayer(root, R.times[0] != null ? R.times[0] : S.from, R.times.length ? R.times[R.times.length - 1] : S.to);
      const box = root.querySelector('.ck-model2');
      const m = MODES[R.mode];
      if (box && m.motion) S.model = BC.anim(box, m.motion, { points: false, compact: true, autoplay: false });
      const keys = R.res.keys || [];
      const main = keys.find((k) => /はなす|着地|いちばん低い/.test(k.label)) || keys[0];
      drawCharts(root);
      if (main) seekIndex(main.i, main.label);
      else drawOverlay();
    },
  };
  ACTIONS.seekAt = (b) => { const R = S.result; const k = (R.res.keys || []).find((x) => String(x.i) === b.dataset.i); seekIndex(+b.dataset.i, k ? k.label : null); };
  ACTIONS.bones = (b) => { S.showBones = !S.showBones; b.setAttribute('aria-pressed', String(S.showBones)); drawOverlay(); };

  /* ---------- 再生の部品（じぶん・チーム共通） ---------- */
  function mountPlayer(root, from, to) {
    const v = S.video;
    root.querySelector('.ck-vslot').replaceWith(v);
    v.controls = false;
    v.loop = false;
    v.playbackRate = S.rate || 1;
    S.pFrom = from; S.pTo = to;
    const scrub = root.querySelector('.ck-scrub');
    const playBtn = root.querySelector('.ck-play');
    const sync = () => {
      if (!live()) return;
      if (scrub && document.activeElement !== scrub) scrub.value = Math.round(((v.currentTime - from) / Math.max(0.01, to - from)) * 1000);
      if (playBtn) { playBtn.innerHTML = v.paused ? IC.play : IC.pause; playBtn.setAttribute('aria-label', v.paused ? '再生' : '止める'); }
      if (S.result) { drawOverlay(); playhead(root, v.currentTime); }
      if (S.team && S.team.done) { drawCourt(root, v.currentTime); playhead(root, v.currentTime); }
    };
    S.sync = sync;
    const onTime = () => { if (v.currentTime >= to - 0.01 && !v.paused) { v.pause(); seekTo(from); } };
    v.ontimeupdate = onTime;
    v.onseeked = sync;
    v.onpause = sync;
    v.onplay = () => { sync(); startLoop(); };
    if (scrub) scrub.addEventListener('input', () => { v.pause(); seekTo(from + (scrub.value / 1000) * (to - from)); });
    if (typeof ResizeObserver === 'function') {
      const ro = new ResizeObserver(() => { if (!live()) { ro.disconnect(); return; } sync(); });
      ro.observe(root.querySelector('.ck-stage'));
    }
    sync();
  }
  function startLoop() {
    if (S.raf) return;
    const step = () => {
      S.raf = 0;
      if (!live() || !S.video) return;
      if (S.sync) S.sync();
      if (!S.video.paused) S.raf = requestAnimationFrame(step);
    };
    S.raf = requestAnimationFrame(step);
  }
  function stopLoop() { if (S && S.raf) { cancelAnimationFrame(S.raf); S.raf = 0; } }
  ACTIONS.play = () => {
    const v = S.video;
    if (v.paused) {
      if (v.currentTime >= S.pTo - 0.02 || v.currentTime < S.pFrom - 0.02) seekTo(S.pFrom);
      const p = v.play(); if (p && p.catch) p.catch(() => {});
    } else v.pause();
  };
  ACTIONS.speed = (b) => {
    S.rate = (S.rate || 1) === 1 ? 0.5 : S.rate === 0.5 ? 0.25 : 1;
    S.video.playbackRate = S.rate;
    b.textContent = S.rate === 1 ? '1×' : S.rate === 0.5 ? '½×' : '¼×';
  };
  const curIndex = () => {
    const T = (S.result ? S.result.times : S.team.frames.map((f) => f.t));
    const t = S.video.currentTime;
    let bi = 0, bd = Infinity;
    T.forEach((x, i) => { const d = Math.abs(x - t); if (d < bd) { bd = d; bi = i; } });
    return { i: bi, T };
  };
  ACTIONS.stepB = () => { S.video.pause(); const { i, T } = curIndex(); seekTo(T[Math.max(0, i - 1)]); };
  ACTIONS.stepF = () => { S.video.pause(); const { i, T } = curIndex(); seekTo(T[Math.min(T.length - 1, i + 1)]); };
  function seekIndex(i, keyLabel) {
    const R = S.result;
    if (!R || R.times[i] == null) return;
    S.video.pause();
    seekTo(R.times[i]);
    const root = S.root;
    if (!root) return;
    root.querySelectorAll('.ck-key').forEach((b) => b.setAttribute('aria-current', String(b.dataset.i === String(i))));
    // 見本：同じ名前の場面へ
    if (S.model && keyLabel) {
      const clip = BC.motions[MODES[R.mode].motion];
      const want = PHASE_ALIAS[keyLabel] || keyLabel;
      const ph = (clip.phases || []).find((p) => p.label.includes(want) || want.includes(p.label));
      S.model.pause();
      S.model.draw(ph ? ph.at + 0.04 : clip.still != null ? clip.still : 0.3);
    }
    // じぶんの その場面（絵）
    const snapC = root.querySelector('.ck-snap');
    if (snapC) {
      const once = () => {
        S.video.removeEventListener('seeked', once);
        const W = R.W, H = R.H;
        snapC.width = W; snapC.height = H;
        const g = snapC.getContext('2d');
        g.drawImage(S.video, 0, 0, W, H);
        const lm = poseAt(R, R.times[i]);
        if (lm) drawSkeleton(g, lm, 1, 1, { lw: 3, color: '#fff' });
      };
      if (Math.abs(S.video.currentTime - R.times[i]) < 0.001 && !S.video.seeking) once(); else S.video.addEventListener('seeked', once);
    }
  }

  /* ---------- グラフ（1つのグラフに1つの量。時間が横） ---------- */
  function chartDefs(R) {
    const F = R.res.series || [];
    const T = R.times;
    const view = R.res.view || 'side';
    const hand = R.res.hand || 'r';
    const kneeAvg = (f) => (f.kneeL + f.kneeR) / 2;
    const defs = [{ key: 'hip', title: '腰の高さ', unit: '%', get: (f) => f.hipH * 100 }];
    const DEG = [0, 90, 180]; // ひざ・ひじ：0°〜180°（90° が L字、180° が まっすぐ）
    const mode = R.mode;
    if (mode === 'shoot') { if (view === 'side') defs.push({ key: 'knee', title: 'ひざの角度', unit: '°', fixed: DEG, get: kneeAvg }); defs.push({ key: 'elbow', title: 'ひじの角度（シュートする手）', unit: '°', fixed: DEG, get: (f) => (hand === 'r' ? f.elbowR : f.elbowL) }); }
    else if (mode === 'dribble') defs.push({ key: 'wrist', title: 'ドリブルする手の高さ', unit: '%', get: (f) => f.wrist[hand] * 100 });
    else if (mode === 'defense') defs.push({ key: 'head', title: '頭の高さ', unit: '%', get: (f) => f.headH * 100 });
    else if (mode === 'landing') defs.push(view === 'side' ? { key: 'knee', title: 'ひざの角度', unit: '°', fixed: DEG, get: kneeAvg } : { key: 'fppa', title: 'ひざが内に入る角度', unit: '°', get: (f) => Math.max(f.fppaL, f.fppaR) });
    else { if (view === 'side') defs.push({ key: 'knee', title: 'ひざの角度', unit: '°', fixed: DEG, get: kneeAvg }); defs.push({ key: 'head', title: '頭の高さ', unit: '%', get: (f) => f.headH * 100 }); }
    return defs.map((d) => Object.assign(d, { pts: F.map((f, i) => (f ? [T[i], d.get(f)] : null)).filter((p) => p && isFinite(p[1])) }));
  }
  function niceTicks(lo, hi, n = 3) {
    const span = hi - lo || 1;
    const step0 = span / n, mag = Math.pow(10, Math.floor(Math.log10(step0)));
    const step = [1, 2, 5, 10].map((k) => k * mag).find((s) => s >= step0) || mag * 10;
    const a = Math.floor(lo / step) * step, b = Math.ceil(hi / step) * step;
    const out = [];
    for (let v = a; v <= b + step / 2; v += step) out.push(Math.round(v * 100) / 100);
    return out;
  }
  // 1本の折れ線（または2本：series = [{ name, cls, pts }]）。x は秒。marks：[{ t, label }]
  function lineSVG(width, series, opt) {
    const H = (opt.h || 120) + ((opt.marks || []).length ? 12 : 0), L = 40, Rm = opt.endLabels ? 46 : 12, T = (opt.marks || []).length ? 30 : 12, B = 22;
    const all = series.flatMap((s) => s.pts);
    if (!all.length) return '';
    const x0 = opt.x0, x1 = Math.max(opt.x1, x0 + 0.1);
    let lo = Math.min(...all.map((p) => p[1])), hi = Math.max(...all.map((p) => p[1]));
    if (opt.min != null) lo = Math.min(lo, opt.min);
    if (hi - lo < (opt.minSpan || 10)) { const c = (hi + lo) / 2; lo = c - (opt.minSpan || 10) / 2; hi = c + (opt.minSpan || 10) / 2; }
    const ticks = opt.fixed || niceTicks(lo, hi, 3);
    lo = ticks[0]; hi = ticks[ticks.length - 1];
    const X = (t) => L + ((t - x0) / (x1 - x0)) * (width - L - Rm), Y = (v) => T + (1 - (v - lo) / (hi - lo || 1)) * (H - T - B);
    const f1 = (n) => Math.round(n * 10) / 10;
    let s = `<svg class="ck-chart" width="${width}" height="${H}" viewBox="0 0 ${width} ${H}" role="img" aria-label="${esc(opt.label)}">`;
    for (const tk of ticks) s += `<line class="ck-grid" x1="${L}" x2="${width - Rm}" y1="${f1(Y(tk))}" y2="${f1(Y(tk))}"/><text class="ck-tick" x="${L - 6}" y="${f1(Y(tk))}" text-anchor="end" dominant-baseline="central">${tk}${opt.unit || ''}</text>`;
    const xt = niceTicks(x0, x1, 4).filter((v) => v >= x0 - 1e-6 && v <= x1 + 1e-6);
    for (const v of xt) s += `<text class="ck-tick" x="${f1(X(v))}" y="${H - 6}" text-anchor="middle">${v}秒</text>`;
    // 場面の名前：近くて重なるときは、2段に
    const ends = [-Infinity, -Infinity];
    for (const mk of (opt.marks || []).slice().sort((a, b) => a.t - b.t)) {
      const x = X(mk.t), w = mk.label.length * 11 + 6;
      const row = x - w / 2 > ends[0] + 2 ? 0 : 1;
      ends[row] = x + w / 2;
      const ty = row ? T - 5 : T - 18;
      s += `<line class="ck-mark" x1="${f1(x)}" x2="${f1(x)}" y1="${ty + 3}" y2="${H - B}"/><text class="ck-mark-t" x="${f1(x)}" y="${ty}" text-anchor="middle">${esc(mk.label)}</text>`;
    }
    for (const se of series) {
      // とぎれた所（見失ったコマ）は線を切る
      let d = '', prevT = null;
      for (const p of se.pts) { d += (prevT == null || p[0] - prevT > 0.35 ? 'M' : 'L') + f1(X(p[0])) + ' ' + f1(Y(p[1])); prevT = p[0]; }
      s += `<path class="ck-line ${se.cls || ''}" d="${d}"/>`;
      if (opt.endLabels) { const e = se.pts[se.pts.length - 1]; s += `<text class="ck-end-l" x="${f1(X(e[0]) + 6)}" y="${f1(Y(e[1]))}" dominant-baseline="central">${esc(se.name)}</text>`; }
    }
    s += `<line class="ck-head" x1="0" x2="0" y1="${T - 2}" y2="${H - B}" opacity="0"/><line class="ck-cross" x1="0" x2="0" y1="${T - 2}" y2="${H - B}" opacity="0"/>`;
    s += `<rect class="ck-hit" x="${L}" y="0" width="${width - L - Rm}" height="${H}" fill="transparent"/></svg>`;
    return { svg: s, X, Y, x0, x1, L, Rm };
  }
  function drawCharts(root) {
    const box = root.querySelector('.ck-charts');
    if (!box) return;
    const R = S.result;
    const defs = chartDefs(R);
    const width = Math.max(260, Math.round(box.clientWidth || 340));
    const x0 = R.times[0] || 0, x1 = R.times[R.times.length - 1] || 1;
    const marks = (R.res.keys || []).slice(0, 6).map((k) => ({ t: R.times[k.i], label: k.label }));
    box.innerHTML = defs.map((d) => `<figure class="ck-fig1" data-key="${d.key}"><figcaption>${esc(d.title)}</figcaption><div class="ck-svg"></div><p class="ck-tip" hidden></p></figure>`).join('');
    S.charts = [];
    defs.forEach((d) => {
      const fig = box.querySelector(`[data-key="${d.key}"]`);
      const ch = lineSVG(width, [{ name: d.title, pts: d.pts.map((p) => (d.fixed ? [p[0], clamp(p[1], 0, 180)] : p)) }], { x0, x1, unit: d.unit, marks, label: d.title, minSpan: d.unit === '°' ? 30 : 10, fixed: d.fixed });
      if (!ch) { fig.remove(); return; }
      fig.querySelector('.ck-svg').innerHTML = ch.svg;
      const svgEl = fig.querySelector('svg'), tip = fig.querySelector('.ck-tip');
      const cross = svgEl.querySelector('.ck-cross');
      const pointAt = (clientX) => {
        const r = svgEl.getBoundingClientRect();
        const t = x0 + ((clientX - r.left - ch.L) / (width - ch.L - ch.Rm)) * (x1 - x0);
        let best = null, bd = Infinity;
        for (const p of d.pts) { const dd = Math.abs(p[0] - t); if (dd < bd) { bd = dd; best = p; } }
        return best;
      };
      const show = (e) => {
        const p = pointAt(e.clientX);
        if (!p) return;
        cross.setAttribute('x1', ch.X(p[0])); cross.setAttribute('x2', ch.X(p[0])); cross.setAttribute('opacity', '1');
        tip.hidden = false;
        tip.innerHTML = `<b class="num">${Math.round(p[1])}${d.unit}</b><span>${sec1(p[0])}秒</span>`;
        return p;
      };
      svgEl.addEventListener('pointermove', show);
      svgEl.addEventListener('pointerleave', () => { cross.setAttribute('opacity', '0'); });
      svgEl.addEventListener('pointerdown', (e) => { const p = show(e); if (p) { S.video.pause(); seekTo(p[0]); } });
      S.charts.push({ svgEl, X: ch.X });
    });
  }
  function playhead(root, t) {
    for (const ch of S.charts || []) {
      if (!ch.svgEl.isConnected) continue;
      const l = ch.svgEl.querySelector('.ck-head');
      l.setAttribute('x1', ch.X(t)); l.setAttribute('x2', ch.X(t)); l.setAttribute('opacity', '1');
    }
  }

  /* ---------- 保存 ---------- */
  // きろくの絵：src（小さな絵）に draw で書き足して、30KB 以下の jpeg に
  function thumb(src, draw) {
    if (!src) return '';
    const c = document.createElement('canvas');
    c.width = src.width; c.height = src.height;
    const g = c.getContext('2d');
    try {
      g.drawImage(src, 0, 0);
      if (draw) draw(g, c.width, c.height);
      for (const q of [0.72, 0.55, 0.4]) { const u = c.toDataURL('image/jpeg', q); if (u.length < 30000) return u; }
    } catch (e) { /* なし */ }
    return '';
  }
  const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  function saveSelf() {
    const R = S.result;
    if (R.saved) return;
    R.saved = true;
    const keys = R.res.keys || [];
    const k = keys.find((x) => /はなす|着地|いちばん低い/.test(x.label)) || keys[0];
    const i = k ? k.i : Math.floor(R.times.length / 2);
    const rec = {
      id: newId(), at: Date.now(), kind: 'self', mode: R.mode, score: R.score,
      metrics: (R.res.metrics || []).map((m) => ({ key: m.key, label: m.label, value: m.value, status: m.status, msg: m.msg, links: (m.links || []).slice(0, 3) })),
      note: (R.res.notes || []).join(' '),
      thumb: thumb(S.mini && S.mini[i], (g, W, H) => {
        const lm = poseAt(R, R.times[i]);
        if (lm) drawSkeleton(g, lm, W / R.W, H / R.H, { lw: 2, color: '#fff' });
      }),
    };
    put(rec);
    R.recId = rec.id;
    if (CTX && CTX.addXP) CTX.addXP(MODES[R.mode].skill, 15, '動画チェック');
    toast('きろくに 保存しました（けいけんち +15）');
  }
  function put(rec) {
    const list = records().filter((r) => r.id !== rec.id);
    list.unshift(rec);
    store().set(KEY, list.slice(0, MAXREC));
  }

  /* ============================================================
     チームの動き
     ============================================================ */
  const CAL_POINTS = (preset) => BA.CALIB[preset];
  function startCalib() {
    prime().then(async () => {
      work();
      await BA.seek(S.video, S.from);
      grab();
      S.snap = cloneCanvas(S.work);
      if (!S.calib) S.calib = { preset: 'paint', pts: [] };
      go('calib');
    });
  }
  // コートの線（m）。ゴールが上・エンドラインが y=0
  function courtLines() {
    const L = [];
    const arc = (cx, cy, r, a0, a1, n = 28) => { const out = []; for (let i = 0; i <= n; i++) { const a = a0 + ((a1 - a0) * i) / n; out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } return out; };
    const yj = 1.575 + Math.sqrt(6.75 * 6.75 - 6.6 * 6.6);
    L.push([[-7.5, 0], [7.5, 0]], [[-7.5, 0], [-7.5, 14]], [[7.5, 0], [7.5, 14]], [[-7.5, 14], [7.5, 14]]);
    L.push([[-2.45, 0], [-2.45, 5.8], [2.45, 5.8], [2.45, 0]]);
    L.push(arc(0, 5.8, 1.8, 0, Math.PI * 2, 36));
    // 3P ライン：左のコーナーの直線 → 弧（ゴールから遠い がわ を通る）→ 右のコーナーの直線
    const a0 = Math.atan2(yj - 1.575, -6.6), a1 = Math.atan2(yj - 1.575, 6.6);
    L.push([[-6.6, 0], ...arc(0, 1.575, 6.75, a0, a1, 40), [6.6, 0]]);
    return L;
  }
  // とり方の絵：高い所から見たコート（こう映ると よい）
  function perspectiveCourt() {
    const Hc = BA.homography([[-7.5, 0], [7.5, 0], [7.5, 14], [-7.5, 14]], [[78, 46], [242, 46], [312, 172], [8, 172]]);
    const P = (p) => BA.applyH(Hc, p).map((v) => Math.round(v * 10) / 10);
    const path = (pts, close) => 'M' + pts.map(P).map((q) => q.join(' ')).join(' L') + (close ? ' Z' : '');
    const lines = courtLines().map((l) => `<path class="ck-pc-line" d="${path(l)}"/>`).join('');
    const ppl = (TEAM_THUMB.o.map((p) => [p, 'o']).concat(TEAM_THUMB.x.map((p) => [p, 'x']))).map(([p, t]) => {
      const f = P(p), f2 = P([p[0] + 0.5, p[1]]);
      const h = Math.hypot(f2[0] - f[0], f2[1] - f[1]) * 3.5;
      return { f, h, t };
    }).sort((a, b) => a.f[1] - b.f[1]).map(({ f, h, t }) => `<g class="ck-pc-${t}"><rect x="${f[0] - h * 0.17}" y="${f[1] - h * 0.78}" width="${h * 0.34}" height="${h * 0.62}" rx="${h * 0.12}"/><circle cx="${f[0]}" cy="${f[1] - h * 0.9}" r="${h * 0.13}"/></g>`).join('');
    const rim = P([0, 1.575]);
    return `<svg viewBox="0 0 320 180" role="img" aria-label="高い所から見たコートの絵">
      <rect class="ck-pc-wall" width="320" height="180"/><rect class="ck-pc-ground" y="34" width="320" height="146"/>
      <path class="ck-pc-court" d="${path([[-7.5, 0], [7.5, 0], [7.5, 14], [-7.5, 14]], true)}"/>
      <path class="ck-pc-paint" d="${path([[-2.45, 0], [2.45, 0], [2.45, 5.8], [-2.45, 5.8]], true)}"/>${lines}
      <rect class="ck-pc-board" x="${rim[0] - 9}" y="${rim[1] - 22}" width="18" height="11"/><ellipse class="ck-pc-rim" cx="${rim[0]}" cy="${rim[1] - 9}" rx="4" ry="1.4"/>${ppl}</svg>`;
  }

  SCREENS.calib = {
    html() {
      const cal = S.calib;
      const P = CAL_POINTS(cal.preset);
      const n = cal.pts.length;
      const done = n >= 4 && S.H;
      return `
        ${backBtn('range', 'もどる')}
        <h1 class="ck-title">コートの 4つの点を タップ</h1>
        <div class="ck-seg" role="group" aria-label="タップする点">
          <button type="button" data-ck="calibPreset" data-preset="paint" aria-pressed="${cal.preset === 'paint'}">ペイントの 4つの角</button>
          <button type="button" data-ck="calibPreset" data-preset="half" aria-pressed="${cal.preset === 'half'}">ハーフコートの 4つの角</button>
        </div>
        <div class="ck-calib">
          <div class="ck-mini">${miniCourt(cal.preset, n)}</div>
          <p class="ck-calib-t" aria-live="polite">${done ? 'コートの線と、動画の線が かさなっていますか？' : `<b class="num">${n + 1}</b>. ${esc(P.labels[n] || '')} を タップ`}</p>
        </div>
        <div class="ck-stage ck-tapzone" style="aspect-ratio:${S.work.width}/${S.work.height}"><canvas class="ck-calc"></canvas></div>
        ${errBox()}
        ${done ? `<button type="button" class="btn primary big" data-ck="calibOk">かさなっている → つぎへ</button>` : ''}
        ${n ? `<button type="button" class="btn big" data-ck="calibRedo">${IC.redo}<span>やりなおす</span></button>` : ''}
        <p class="ck-note ck-note-s">${cal.preset === 'paint' ? 'ペイント（ゴールの下の 長方形）の 4つの角です。見えにくい時は「ハーフコートの 4つの角」に。' : 'コートの 角（コーナー）2つと、センターラインの 両はし です。'}</p>`;
    },
    mount(root) {
      const c = root.querySelector('.ck-calc');
      drawCalib(c);
      c.addEventListener('click', (e) => {
        const cal = S.calib;
        if (cal.pts.length >= 4) return;
        const r = c.getBoundingClientRect();
        cal.pts.push([((e.clientX - r.left) / r.width) * S.work.width, ((e.clientY - r.top) / r.height) * S.work.height]);
        if (cal.pts.length === 4) {
          const P = CAL_POINTS(cal.preset).pts;
          S.H = convex(cal.pts) ? BA.homography(cal.pts, P) : null;
          if (!S.H) { S.err = '4つの点の 順番が ちがうかもしれません。図の 番号の順に、もう一度 タップしてください。'; cal.pts = []; }
        }
        paint();
      });
    },
  };
  // 4つの点が、くぼみのない四角形か
  function convex(p) {
    let sign = 0;
    for (let i = 0; i < 4; i++) {
      const a = p[i], b = p[(i + 1) % 4], c = p[(i + 2) % 4];
      const z = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
      if (Math.abs(z) < 1e-6) return false;
      if (!sign) sign = Math.sign(z); else if (Math.sign(z) !== sign) return false;
    }
    return true;
  }
  function miniCourt(preset, n) {
    const P = CAL_POINTS(preset).pts;
    const lines = courtLines().map((l) => `<polyline class="ck-mini-l" points="${l.map((p) => p.map((v) => Math.round(v * 100) / 100).join(',')).join(' ')}"/>`).join('');
    const dots = P.map((p, i) => `<g class="ck-mini-p${i < n ? ' done' : i === n ? ' now' : ''}" transform="translate(${p[0]} ${p[1]})"><circle r="${i === n ? 1.05 : 0.85}"/><text y="0.05">${i + 1}</text></g>`).join('');
    return `<svg viewBox="-8.6 -1.6 17.2 17" role="img" aria-label="タップする点の図"><rect class="ck-mini-f" x="-7.5" y="0" width="15" height="14"/><rect class="ck-mini-pt" x="-2.45" y="0" width="4.9" height="5.8"/>${lines}<line class="ck-mini-goal" x1="-0.9" x2="0.9" y1="1.2" y2="1.2"/><circle class="ck-mini-rim" cx="0" cy="1.575" r="0.3"/>${dots}</svg>`;
  }
  function drawCalib(c) {
    const W = S.work.width, H = S.work.height;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = W * dpr; c.height = H * dpr;
    const g = c.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.drawImage(S.snap, 0, 0, W, H);
    const cal = S.calib;
    const k = uiK(c, W);
    if (S.H && cal.pts.length === 4) {
      const Hi = BA.invertH(S.H);
      g.lineWidth = 2.5 * k; g.strokeStyle = css('--ok'); g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 3 * k;
      for (const l of courtLines()) {
        g.beginPath();
        let on = false;
        for (const p of l) {
          const w = Hi[6] * p[0] + Hi[7] * p[1] + Hi[8];
          if (w <= 0) { on = false; continue; }
          const q = BA.applyH(Hi, p);
          if (!on) g.moveTo(q[0], q[1]); else g.lineTo(q[0], q[1]);
          on = true;
        }
        g.stroke();
      }
      g.shadowBlur = 0;
    }
    cal.pts.forEach((p, i) => {
      g.beginPath(); g.arc(p[0], p[1], 6 * k, 0, Math.PI * 2);
      g.fillStyle = css('--ball'); g.fill(); g.lineWidth = 2 * k; g.strokeStyle = '#fff'; g.stroke();
      label(g, String(i + 1), p[0] + 16 * k, p[1] - 18 * k, { k });
    });
  }

  /* ---------- チームの色 ---------- */
  async function startColor() {
    go('color');
    S.people0 = null;
    let det;
    try { det = await loadAI('person'); } catch (e) { S.err = aiFail(e); return paint(); }
    if (!S || S.step !== 'color') return;
    await BA.seek(S.video, S.from);
    grab();
    S.snap = cloneCanvas(S.work);
    S.people0 = peopleOf(detectPeople(det), false);
    if (!S.colors) S.colors = [];
    paint();
  }
  // 人を見つける。横長の動画は、左右に重なりのある2つに分けて AI に見せる（遠くの小さな人も見つかりやすい）
  function detectPeople(det) {
    const W = S.work.width, H = S.work.height;
    const tiles = W > H * 1.2 ? [[0, 0, Math.round(W * 0.56), H], [Math.round(W * 0.44), 0, W - Math.round(W * 0.44), H]] : [[0, 0, W, H]];
    let out = [];
    for (const [tx, ty, tw, th] of tiles) {
      let src = S.work;
      if (tiles.length > 1) {
        if (!S.tile) S.tile = document.createElement('canvas');
        S.tile.width = tw; S.tile.height = th;
        S.tile.getContext('2d').drawImage(S.work, tx, ty, tw, th, 0, 0, tw, th);
        src = S.tile;
      }
      const r = det.detectForVideo(src, BA.tick(20));
      for (const d of r.detections || []) {
        const c = d.categories && d.categories[0];
        if (!c) continue;
        const b = d.boundingBox;
        out.push({ x: b.originX + tx, y: b.originY + ty, w: b.width, h: b.height, score: c.score });
      }
    }
    // 重なった箱は、点数の高い方だけ（2つに分けた所の重なり）
    out.sort((a, b) => b.score - a.score);
    // 重なりの割合（合わせた広さに対して）と、小さい方の箱が どれだけ入っているか（2つに分けた さかいめで切れた箱）
    const ov = (a, b) => { const x = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)), y = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y)); const i = x * y; return [i / (a.w * a.h + b.w * b.h - i || 1), i / (Math.min(a.w * a.h, b.w * b.h) || 1)]; };
    const keep = [];
    for (const b of out) if (!keep.some((k) => { const [u, c] = ov(k, b); return u > 0.45 || c > 0.7; })) keep.push(b);
    return keep;
  }
  // 見つけた人 → { box, foot（画面）, x, y（コート m）, color }。コートの外の人は のぞく
  function peopleOf(boxes, classify) {
    const out = [];
    const minH = S.work.height * 0.025;
    for (const b of boxes) {
      if (b.score < 0.3 || b.h < minH) continue;
      const box = { x: b.x, y: b.y, w: b.w, h: b.h };
      const c = { score: b.score };
      const foot = [box.x + box.w / 2, box.y + box.h];
      const q = BA.applyH(S.H, foot);
      if (!isFinite(q[0]) || Math.abs(q[0]) > 8.5 || q[1] < -1 || q[1] > 15) continue;
      const col = torso(box);
      const p = { box, foot, x: q[0], y: q[1], color: col, score: c.score };
      if (classify) p.team = col && S.colors.length === 2 ? BA.classify(col, S.colors, 55) : -1;
      out.push(p);
    }
    return out;
  }
  // 胴のあたりの色（上から 20〜45%・幅の 30〜70%）の中央値
  function torso(box) {
    const W = S.work.width, H = S.work.height;
    const x0 = clamp(Math.round(box.x + box.w * 0.3), 0, W - 1), x1 = clamp(Math.round(box.x + box.w * 0.7), 1, W);
    const y0 = clamp(Math.round(box.y + box.h * 0.2), 0, H - 1), y1 = clamp(Math.round(box.y + box.h * 0.45), 1, H);
    if (x1 - x0 < 2 || y1 - y0 < 2) return null;
    const d = S.wctx.getImageData(x0, y0, x1 - x0, y1 - y0).data;
    const R = [], G = [], B = [];
    for (let i = 0; i < d.length; i += 4) { R.push(d[i]); G.push(d[i + 1]); B.push(d[i + 2]); }
    const med = (a) => a.sort((p, q) => p - q)[a.length >> 1];
    return [med(R), med(G), med(B)];
  }
  const rgb = (c) => (c ? `rgb(${c[0]},${c[1]},${c[2]})` : 'transparent');
  SCREENS.color = {
    html() {
      if (S.err && !S.people0 && !S.loading) return `${backBtn('calib', 'もどる')}<h1 class="ck-title">AI を 読みこめません</h1>${errBox()}<button type="button" class="btn primary big" data-ck="retryAI">${IC.redo}<span>もう一度 ためす</span></button>`;
      if (S.loading || !S.people0) return `${backBtn('calib', 'もどる')}<h1 class="ck-title">人を さがしています</h1>${loadHTML()}`;
      const ps = S.people0;
      const n = S.colors.length;
      if (ps.length < 2) {
        return `${backBtn('calib', 'もどる')}<h1 class="ck-title">人が 見つかりません</h1>
          <p class="ck-note">コートの中に、人を ${ps.length}人しか 見つけられませんでした。人が 大きく 映っている動画か、はじめの時間を かえて ためしてください。</p>
          <div class="ck-stage" style="aspect-ratio:${S.work.width}/${S.work.height}"><canvas class="ck-colc"></canvas></div>
          <button type="button" class="btn primary big" data-ck="range">はんいを かえる</button>`;
      }
      const sw = (i, name) => `<span class="ck-swatch${S.colors[i] ? '' : ' empty'}"><i style="background:${rgb(S.colors[i])}"></i>${name}</span>`;
      return `
        ${backBtn('calib', 'もどる')}
        <h1 class="ck-title">チームの 色</h1>
        <p class="ck-calib-t" aria-live="polite">${n === 0 ? '<b class="num">1</b>. <b>攻めている</b> チームの人を 1人 タップ' : n === 1 ? '<b class="num">2</b>. <b>守っている</b> チームの人を 1人 タップ' : 'この色で 分けます。'}</p>
        <p class="ck-swatches">${sw(0, '攻め')}${sw(1, '守り')}</p>
        <div class="ck-stage ck-tapzone" style="aspect-ratio:${S.work.width}/${S.work.height}"><canvas class="ck-colc"></canvas></div>
        ${errBox()}
        ${n === 2 ? `<button type="button" class="btn primary big" data-ck="teamGo">しらべる（${sec1(S.to - S.from)}秒）</button>
          <button type="button" class="btn big" data-ck="colorSwap">攻めと 守りを 入れかえる</button>` : ''}
        <div class="ck-row">
          <button type="button" class="btn" data-ck="autoColor">自動で 分ける</button>
          ${n ? `<button type="button" class="btn" data-ck="colorRedo">${IC.redo}<span>やりなおす</span></button>` : ''}
        </div>
        <p class="ck-note ck-note-s">${ps.length}人 見つかりました。ユニフォームの 胴の色で 分けます。</p>`;
    },
    mount(root) {
      const c = root.querySelector('.ck-colc');
      if (!c) return;
      drawColor(c);
      c.addEventListener('click', (e) => {
        if (S.colors.length >= 2) return;
        const r = c.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width) * S.work.width, y = ((e.clientY - r.top) / r.height) * S.work.height;
        let best = null, bd = Infinity;
        for (const p of S.people0) {
          const b = p.box;
          const inside = x >= b.x - 6 && x <= b.x + b.w + 6 && y >= b.y - 6 && y <= b.y + b.h + 6;
          const d = Math.hypot(b.x + b.w / 2 - x, b.y + b.h / 2 - y) - (inside ? 1e4 : 0);
          if (d < bd) { bd = d; best = p; }
        }
        if (best && best.color) {
          if (S.colors.length === 1 && BA.colorDist(S.colors[0], best.color) < 12) { S.err = '1人目と 同じ色に 見えます。ちがう チームの人を タップしてください。'; return paint(); }
          S.err = '';
          S.colors.push(best.color);
          paint();
        }
      });
    },
  };
  function drawColor(c) {
    const W = S.work.width, H = S.work.height;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = W * dpr; c.height = H * dpr;
    const g = c.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.drawImage(S.snap, 0, 0, W, H);
    const k = uiK(c, W);
    for (const p of S.people0 || []) {
      const t = S.colors.length === 2 && p.color ? BA.classify(p.color, S.colors, 55) : -1;
      g.lineWidth = 3 * k;
      g.strokeStyle = t === 0 ? css('--ck-off') : t === 1 ? css('--ck-def') : 'rgba(255,255,255,0.9)';
      g.strokeRect(p.box.x, p.box.y, p.box.w, p.box.h);
    }
  }
  function autoColor() {
    const cols = (S.people0 || []).map((p) => p.color).filter(Boolean);
    const c2 = BA.cluster2(cols);
    if (!c2 || !c2[0] || !c2[1] || BA.colorDist(c2[0], c2[1]) < 12) { S.err = '2つの色に 分けられませんでした。1人ずつ タップしてください。'; return paint(); }
    S.err = '';
    S.colors = c2;
    paint();
  }

  /* ---------- しらべる（チーム） ---------- */
  async function runTeam() {
    const fps = MODES.team.fps;
    S.prog = { i: 0, n: Math.max(1, Math.floor((S.to - S.from) * fps)) + 1 };
    go('run');
    let det;
    try { det = await BA.load('person'); } catch (e) { return go('color', aiFail(e)); }
    const ac = new AbortController();
    S.abort = ac;
    const frames = [];
    const midI = Math.floor(S.prog.n / 2);
    S.teamMini = null;
    try {
      await BA.sample(S.video, {
        from: S.from, to: S.to, fps, signal: ac.signal,
        onFrame: (t, i) => {
          grab();
          if (i === midI || !S.teamMini) S.teamMini = miniCopy(S.work);
          const people = peopleOf(detectPeople(det), true);
          frames.push({ t, people });
          S.prog.i = frames.length;
          paintProg(people, true);
        },
      });
    } catch (e) {
      S.abort = null;
      if (ac.signal.aborted) { toast('やめました'); return go('color'); }
      console.warn(e);
      return go('color', 'とちゅうで うまく しらべられませんでした。もう一度 ためしてください。');
    }
    S.abort = null;
    BA.courtTrack(frames);
    const tm = BA.teamAnalyze(frames, { teams: 2 });
    const off = BA.teamFindings(tm.teams[0], 'offense'), def = BA.teamFindings(tm.teams[1], 'defense');
    S.team = { frames, tm, off, def, done: true, heat: null, trail: true, saved: false };
    saveTeam();
    go('tresult');
  }

  /* ---------- 結果（チーム） ---------- */
  SCREENS.tresult = {
    html() {
      const T = S.team;
      const all = T.off.concat(T.def).filter((x) => x.status && x.status !== 'na');
      const score = all.length ? BA.score(all) : null;
      T.score = score;
      const card = (f) => metricCard(Object.assign({ value: '' }, f));
      const naOnly = !all.length;
      return `
        ${backBtn('home', 'ほかの チェック')}
        <h1 class="ck-title">チームの動きの 結果</h1>
        ${naOnly ? `<p class="ck-err" role="alert">${esc((T.off[0] || {}).msg || 'はかれませんでした。')}</p>` : `<div class="ck-sum-top">${ring(score)}<div><p class="ck-head2">${headline(score)}</p><p class="ck-note">攻め ${T.tm.teams[0].frames}コマ・守り ${T.tm.teams[1].frames}コマで はかりました。</p></div></div>`}
        <div class="ck-player ck-tplayer">
          <div class="ck-stage" style="aspect-ratio:${S.work.width}/${S.work.height}"><div class="ck-vslot"></div><canvas class="ck-over ck-tover"></canvas></div>
          <div class="ck-ctl">
            <button type="button" class="ck-ib ck-play" data-ck="play" aria-label="再生">${IC.play}</button>
            <button type="button" class="ck-ib" data-ck="stepB" aria-label="前のコマ">${IC.prev}</button>
            <input type="range" class="ck-scrub" min="0" max="1000" value="0" aria-label="時間">
            <button type="button" class="ck-ib" data-ck="stepF" aria-label="次のコマ">${IC.next}</button>
            <button type="button" class="ck-speed num" data-ck="speed" aria-label="速さ">1×</button>
          </div>
          <div class="ck-court"></div>
          <div class="ck-keys">
            <button type="button" class="chip" data-ck="trail" aria-pressed="${T.trail}">動きの あと</button>
            <button type="button" class="chip" data-ck="heat" data-team="0" aria-pressed="${T.heat === 0}">攻めの いた場所</button>
            <button type="button" class="chip" data-ck="heat" data-team="1" aria-pressed="${T.heat === 1}">守りの いた場所</button>
          </div>
          <p class="ck-legend"><span><i class="lg-off"></i>攻め</span><span><i class="lg-def"></i>守り</span><span><i class="lg-unk"></i>分からない（審判など）</span></p>
        </div>
        ${naOnly ? '' : `
          <section class="ck-sec"><h2 class="sec-h">攻め（<span class="ck-swatch-i" style="background:${rgb(S.colors[0])}"></span>）</h2><div class="ck-mets">${T.off.map(card).join('')}</div></section>
          <section class="ck-sec"><h2 class="sec-h">守り（<span class="ck-swatch-i" style="background:${rgb(S.colors[1])}"></span>）</h2><div class="ck-mets">${T.def.map(card).join('')}</div></section>
          <section class="ck-sec"><h2 class="sec-h">広がりの 変わり方</h2><div class="ck-charts ck-tcharts"></div>
            <p class="ck-note ck-note-s">攻め：となりの 味方との きょり。守り：みんなの まん中からの きょり（小さいほど まとまっている）。</p></section>`}
        <div class="ck-end">
          <button type="button" class="btn primary big" data-ck="again" data-mode="team">${IC.redo}<span>ほかの 動画で しらべる</span></button>
          <button type="button" class="btn big" data-ck="home">ほかの チェック</button>
        </div>`;
    },
    mount(root) {
      const T = S.team;
      const fr = T.frames;
      mountPlayer(root, fr.length ? fr[0].t : S.from, fr.length ? fr[fr.length - 1].t : S.to);
      drawTeamChart(root);
      seekTo(fr.length ? fr[Math.floor(fr.length / 2)].t : S.from);
      drawCourt(root, S.video.currentTime);
    },
  };
  ACTIONS.trail = (b) => { S.team.trail = !S.team.trail; b.setAttribute('aria-pressed', String(S.team.trail)); drawCourt(S.root, S.video.currentTime); };
  ACTIONS.heat = (b) => {
    const k = +b.dataset.team;
    S.team.heat = S.team.heat === k ? null : k;
    S.root.querySelectorAll('[data-ck="heat"]').forEach((x) => x.setAttribute('aria-pressed', String(+x.dataset.team === S.team.heat)));
    drawCourt(S.root, S.video.currentTime);
  };
  // 上から見たコート（js/court.js と同じ線と色）
  function courtBase() {
    const inner = BC.courtThumb ? BC.courtThumb({ o: [], x: [] }).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '') : '';
    return inner;
  }
  function peopleAt(t) {
    const fr = S.team.frames;
    if (!fr.length) return [];
    let i = 0;
    while (i < fr.length - 1 && fr[i + 1].t <= t) i++;
    const a = fr[i], b = fr[Math.min(fr.length - 1, i + 1)];
    if (a === b || b.t === a.t) return a.people;
    const u = clamp((t - a.t) / (b.t - a.t), 0, 1);
    const byId = new Map(b.people.map((p) => [p.id, p]));
    return a.people.map((p) => { const q = byId.get(p.id); return q ? Object.assign({}, p, { x: p.x + (q.x - p.x) * u, y: p.y + (q.y - p.y) * u }) : p; });
  }
  function drawCourt(root, t) {
    const box = root && root.querySelector('.ck-court');
    if (!box || !S.team) return;
    const T = S.team;
    const f = (n) => Math.round(n * 100) / 100;
    let heat = '';
    if (T.heat != null) {
      const g = T.tm.heat[T.heat];
      const max = Math.max(1, ...g.flat());
      const cls = T.heat === 0 ? 'ck-heat-off' : 'ck-heat-def';
      g.forEach((row, y) => row.forEach((v, x) => { if (v) heat += `<rect class="${cls}" x="${x - 7.5 + 0.04}" y="${y + 0.04}" width="0.92" height="0.92" rx="0.12" opacity="${f(0.12 + (0.78 * v) / max)}"><title>${v}</title></rect>`; }));
    }
    let trails = '';
    if (T.trail) {
      const tracks = new Map();
      for (const fr of T.frames) {
        if (fr.t > t + 1e-6 || fr.t < t - 2.5) continue;
        for (const p of fr.people) { if (!tracks.has(p.id)) tracks.set(p.id, { team: p.team, pts: [] }); tracks.get(p.id).pts.push([p.x, p.y]); }
      }
      for (const tr of tracks.values()) if (tr.pts.length > 1) trails += `<polyline class="ck-trail ${tr.team === 0 ? 'off' : tr.team === 1 ? 'def' : 'unk'}" points="${tr.pts.map((p) => f(p[0]) + ',' + f(p[1])).join(' ')}"/>`;
    }
    const dots = peopleAt(t).map((p) => (p.team === 0 ? `<circle class="ck-p-off" cx="${f(p.x)}" cy="${f(p.y)}" r="0.42"/>` : p.team === 1 ? `<path class="ck-p-def" d="M${f(p.x - 0.32)} ${f(p.y - 0.32)} L${f(p.x + 0.32)} ${f(p.y + 0.32)} M${f(p.x + 0.32)} ${f(p.y - 0.32)} L${f(p.x - 0.32)} ${f(p.y + 0.32)}"/>` : `<circle class="ck-p-unk" cx="${f(p.x)}" cy="${f(p.y)}" r="0.28"/>`)).join('');
    if (!box.firstChild) box.innerHTML = `<svg class="ck-court-svg" viewBox="-8.6 -1.4 17.2 16.6" role="img" aria-label="上から見たコート"><g class="cv-base">${courtBase()}</g><g class="ck-heat"></g><g class="ck-trails"></g><g class="ck-dots"></g></svg>`;
    box.querySelector('.ck-heat').innerHTML = heat;
    box.querySelector('.ck-trails').innerHTML = trails;
    box.querySelector('.ck-dots').innerHTML = dots;
    // 動画の上：見つけた人の足もと
    const c = root.querySelector('.ck-tover');
    if (c) {
      const rect = c.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.round(rect.width * dpr), h = Math.round(rect.height * dpr);
      if (w && h) {
        if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
        const g = c.getContext('2d');
        g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, w, h);
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
        const sx = rect.width / S.work.width, sy = rect.height / S.work.height;
        const fr = T.frames;
        let i = 0; while (i < fr.length - 1 && fr[i + 1].t <= t) i++;
        if (fr[i] && Math.abs(fr[i].t - t) < 0.5) {
          for (const p of fr[i].people) {
            g.beginPath(); g.ellipse(p.foot[0] * sx, p.foot[1] * sy, 9, 4, 0, 0, Math.PI * 2);
            g.lineWidth = 3; g.strokeStyle = p.team === 0 ? css('--ck-off') : p.team === 1 ? css('--ck-def') : 'rgba(255,255,255,0.8)'; g.stroke();
          }
        }
      }
    }
  }
  function drawTeamChart(root) {
    const box = root.querySelector('.ck-tcharts');
    if (!box) return;
    const T = S.team;
    const per = T.tm.perFrame;
    const off = per.map((f) => (f.team[0].spacing != null ? [f.t, f.team[0].spacing] : null)).filter(Boolean);
    const def = per.map((f) => (f.team[1].spread != null ? [f.t, f.team[1].spread] : null)).filter(Boolean);
    const width = Math.max(260, Math.round(box.clientWidth || 340));
    const fr = T.frames;
    const ch = lineSVG(width, [{ name: '攻め', cls: 'off', pts: off }, { name: '守り', cls: 'def', pts: def }], { x0: fr[0].t, x1: fr[fr.length - 1].t, unit: 'm', min: 0, minSpan: 4, endLabels: true, label: '広がりの 変わり方', h: 150 });
    if (!ch) { box.innerHTML = '<p class="ck-note">3人以上 映っている コマが 少なく、グラフに できませんでした。</p>'; return; }
    box.innerHTML = `<figure class="ck-fig1"><p class="ck-legend"><span><i class="lg-line off"></i>攻め（となりとの きょり）</span><span><i class="lg-line def"></i>守り（まん中からの きょり）</span></p><div class="ck-svg">${ch.svg}</div><p class="ck-tip" hidden></p></figure>`;
    const svgEl = box.querySelector('svg'), tip = box.querySelector('.ck-tip'), cross = svgEl.querySelector('.ck-cross');
    const x0 = fr[0].t, x1 = fr[fr.length - 1].t;
    const at = (clientX) => { const r = svgEl.getBoundingClientRect(); return x0 + ((clientX - r.left - ch.L) / (width - ch.L - ch.Rm)) * (x1 - x0); };
    const near = (pts, t) => pts.reduce((b, p) => (!b || Math.abs(p[0] - t) < Math.abs(b[0] - t) ? p : b), null);
    const show = (e) => {
      const t = at(e.clientX);
      const a = near(off, t), d = near(def, t);
      const tt = (a || d)[0];
      cross.setAttribute('x1', ch.X(tt)); cross.setAttribute('x2', ch.X(tt)); cross.setAttribute('opacity', '1');
      tip.hidden = false;
      tip.innerHTML = `${a ? `<b class="num">${a[1].toFixed(1)}m</b><span>攻め</span>` : ''}${d ? `<b class="num">${d[1].toFixed(1)}m</b><span>守り</span>` : ''}<span>${sec1(tt)}秒</span>`;
      return tt;
    };
    svgEl.addEventListener('pointermove', show);
    svgEl.addEventListener('pointerleave', () => cross.setAttribute('opacity', '0'));
    svgEl.addEventListener('pointerdown', (e) => { const t = show(e); S.video.pause(); seekTo(t); });
    S.charts = [{ svgEl, X: ch.X }];
  }
  function saveTeam() {
    const T = S.team;
    if (T.saved) return;
    T.saved = true;
    const all = T.off.concat(T.def).filter((x) => x.status && x.status !== 'na');
    const fr = T.frames;
    const mid = fr[Math.min(fr.length - 1, Math.floor(S.prog.n / 2))];
    const rec = {
      id: newId(), at: Date.now(), kind: 'team', mode: 'team', score: all.length ? BA.score(all) : null,
      metrics: all.map((m) => ({ key: m.key, label: (T.off.includes(m) ? '攻め：' : '守り：') + m.label, value: m.value, status: m.status, msg: m.msg, links: (m.links || []).slice(0, 3) })),
      findings: { offense: T.off.map((m) => ({ key: m.key, status: m.status, value: m.value })), defense: T.def.map((m) => ({ key: m.key, status: m.status, value: m.value })) },
      note: `攻め ${T.tm.teams[0].frames}コマ・守り ${T.tm.teams[1].frames}コマ`,
      thumb: thumb(S.teamMini, (g, W, H) => {
        if (!mid) return;
        const sx = W / S.work.width, sy = H / S.work.height;
        for (const p of mid.people) { g.beginPath(); g.arc(p.foot[0] * sx, p.foot[1] * sy, 3.2, 0, Math.PI * 2); g.fillStyle = p.team === 0 ? css('--ck-off') : p.team === 1 ? css('--ck-def') : '#fff'; g.fill(); g.lineWidth = 1; g.strokeStyle = '#fff'; g.stroke(); }
      }),
    };
    put(rec);
    if (CTX && CTX.addXP) CTX.addXP('teamoff', 20, 'チームの動画チェック');
    toast('きろくに 保存しました（けいけんち +20）');
  }

  /* ---------- きろく ---------- */
  const fmtDate = (ms) => { const d = new Date(ms); return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`; };
  CK.summaryHTML = function (rec) {
    if (!rec) return '';
    const ms = (rec.metrics || []).filter((m) => m.status && m.status !== 'na');
    return `<a class="ck-sumc" href="#check/rec/${encodeURIComponent(rec.id)}">
      ${rec.thumb ? `<img class="ck-sumc-img" src="${esc(rec.thumb)}" alt="" loading="lazy">` : `<span class="ck-sumc-img ck-sumc-none">${IC.film}</span>`}
      <span class="ck-sumc-main"><b>${esc(modeName(rec.mode) || 'チェック')}</b><small class="num">${esc(fmtDate(rec.at))}</small>
        <span class="ck-dots" aria-label="${ms.map((m) => (ST[m.status] || ST.na).t).join('、')}">${ms.map((m) => `<i class="ck-${m.status}">${(ST[m.status] || ST.na).m}</i>`).join('')}</span></span>
      <span class="ck-sumc-score">${rec.score == null ? '<small>−</small>' : `<b class="num">${rec.score}</b><small>点</small>`}</span>
    </a>`;
  };
  function showRecord(el, id) {
    const rec = records().find((r) => r.id === id);
    el.innerHTML = `<div class="ck" data-step="record">${rec ? `
      ${backBtn('back', 'もどる')}
      <h1 class="ck-title">${esc(modeName(rec.mode))}の チェック</h1>
      <p class="ck-date num">${esc(new Date(rec.at).toLocaleString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }))}</p>
      <div class="ck-sum-top">${rec.thumb ? `<img class="ck-rec-img" src="${esc(rec.thumb)}" alt="その時の動画の絵">` : ''}${ring(rec.score)}</div>
      <section class="ck-sec"><div class="ck-mets">${(rec.metrics || []).map((m) => metricCard(m)).join('')}</div></section>
      ${rec.note && rec.kind === 'self' ? `<section class="ck-sec"><h2 class="sec-h">とり方の アドバイス</h2><p class="ck-note">${esc(rec.note)}</p></section>` : ''}
      <div class="ck-end"><button type="button" class="btn primary big" data-ck="recAgain" data-mode="${esc(rec.mode)}">${IC.redo}<span>もう一度 チェックする</span></button></div>`
      : `${backBtn('back', 'もどる')}<p class="ck-err">この きろくは 見つかりませんでした（消えたかもしれません）。</p>`}</div>`;
    wire(el);
  }

  // 検査用（tools/check-test.cjs）
  CK._state = () => S;
  CK._reset = () => { const r = S && S.root; fresh(null); S.root = r; };
})();
