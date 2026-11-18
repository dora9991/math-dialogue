/* 「今週の これ1つ」の画面（BC.focusUI）。しくみは js/focus.js、測るテストは data/focus.js。
   BC.focusUI.init(ctx)            … app.js が最初に1回（ctx：{ ic, esc, toast, modal, closeModal, addActs, sum, acts, checks, log, prof, drillArt, get, skillName, runStart, copy, rerender, confetti, store }）
   BC.focusUI.render(el, sub)      … ページ #focus・#focus/<きろくの id>・#focus/pick・#focus/measure（el に描く）
   BC.focusUI.homeHTML()           … ホームに出すカード
   BC.focusUI.menuFocus()          … きょうのメニュー用（BC.focus.forMenu の返り値）
   BC.focusUI.logHTML()            … きろくのページに出す「これ1つの のび」
   BC.focusUI.reflectHTML(技能の一覧) / readReflect(root) / saveReflect(note) … 練習のあとの ふり返り（おわりの画面・やった！の画面に つける）
   BC.focusUI.shareItem()          … ひろばに のせる ひとこと（なければ null）
   ページの流れ（#focus）：1 のびしろを3つ出す → 2 30秒チャレンジで 測る → 3 目標をきめる → ホームへ
   #focus/measure：測りなおし → のびを見る（#focus/<id>）。 */
(function () {
  const BC = window.BC;
  const F = BC.focus;
  const G = BC.grow;
  const U = (BC.focusUI = {});
  let X = {};
  const KEY = 'bc.focus';
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ic = (n, c) => (X.ic ? X.ic(n, c) : '');
  const S = { state: null, el: null, flow: null, timer: null, audio: null, sub: '' };

  U.init = (ctx) => { X = ctx || {}; S.state = F.load(X.store.get(KEY, null)); };
  const save = () => X.store.set(KEY, S.state);
  U.state = () => S.state || F.empty();
  U.reload = () => { S.state = F.load(X.store.get(KEY, null)); };
  const now = () => Date.now();
  // 'YYYY-MM-DD' → '11/9'
  const md = (k) => { const [, m, d] = String(k).split('-').map(Number); return `${m}/${d}`; };
  // その週の「これ1つ」が、いま 自己ベスト（これまでで いちばんよく、きじゅんより のびている）か
  const isPB = (item) => { const m = F.summary(item); return m.tried && m.gain > 0 && F.bestOf(S.state, item.test) === m.last; };
  const me = () => (X.prof ? X.prof() : {}) || {};
  const acts = () => (X.acts ? X.acts() : []);
  const cur = () => F.current(S.state, now());
  const skillName = (id) => (X.skillName ? X.skillName(id) : id);
  const paint = (html) => { if (S.el) { S.el.innerHTML = html; if (X.hydrate) X.hydrate(S.el); } };
  const back = (href, label) => `<a class="back-btn" href="${href}">${ic('back')}${esc(label || 'もどる')}</a>`;
  const backStep = (to, label) => `<button type="button" class="back-btn" data-fc="back" data-to="${to}">${ic('back')}${esc(label || 'もどる')}</button>`;
  const rerender = () => U.render(S.el, S.sub);

  /* ---------- 小さな部品 ---------- */
  const testIcon = (t) => (t.kind === 'time' || t.kind === 'hold' ? 'timer' : t.kind === 'make' ? 'hoop' : 'bolt');
  // 数の言い方：「30秒で つけた回数」
  const whatLine = (t) => `${esc(t.what)}${t.better === 'less' ? '（少ないほど いい）' : '（多いほど いい）'}`;
  const fmt = (t, v) => esc(F.fmt(t, v));
  const stepBtns = (id, t) => `<div class="fc-step"><button type="button" class="ib" data-fc="num" data-id="${id}" data-d="-1" aria-label="へらす">${ic('minus')}</button>
    <input id="${id}" class="fc-num num" type="number" inputmode="${t.kind === 'time' ? 'decimal' : 'numeric'}" min="0" ${t.kind === 'make' ? `max="${t.of}"` : ''} step="${F.step(t)}" aria-label="数">
    <button type="button" class="ib" data-fc="num" data-id="${id}" data-d="1" aria-label="ふやす">${ic('plus')}</button><span class="fc-unit">${t.kind === 'make' ? `/ ${t.of}${esc(t.unit)}` : esc(t.unit)}</span></div>`;
  const numVal = (id, t) => { const el = document.getElementById(id); return el ? F.clamp(t, el.value) : 0; };
  const setNum = (id, t, v) => { const el = document.getElementById(id); if (el) el.value = t.kind === 'time' ? F.clamp(t, v).toFixed(1) : String(F.clamp(t, v)); };

  /* ---------- 測るタイマー（30秒チャレンジ・ストップウォッチ） ---------- */
  function stopTimer() {
    if (S.timer) { clearInterval(S.timer.id); S.timer = null; }
    try { if (S.audio) S.audio.close(); } catch (e) { /* なし */ }
    S.audio = null;
  }
  function beep(n = 2) {
    try {
      const ac = S.audio;
      if (ac) for (let i = 0; i < n; i++) {
        const o = ac.createOscillator(), g = ac.createGain();
        o.frequency.value = 880; o.connect(g); g.connect(ac.destination);
        const t0 = ac.currentTime + i * 0.22;
        g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.3, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18);
        o.start(t0); o.stop(t0 + 0.2);
      }
    } catch (e) { /* 音が出なくても進む */ }
    try { if (navigator.vibrate) navigator.vibrate(n > 1 ? [150, 80, 150] : 100); } catch (e) { /* なし */ }
  }
  const clockEl = () => document.getElementById('fc-clock');
  // kind 'count'：3・2・1 → secs 秒のカウントダウン → おわったら 数をきく。'time'/'hold'：ストップウォッチ
  function startTimer(t) {
    stopTimer();
    try { S.audio = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { /* なし */ }
    const T = { t0: Date.now(), phase: t.kind === 'count' ? 'ready' : 'run', t, done: false };
    S.timer = T;
    T.id = setInterval(() => tick(), 100);
    paintTimer();
  }
  function tick() {
    const T = S.timer;
    if (!T) return;
    const el = (Date.now() - T.t0) / 1000;
    if (T.phase === 'ready') {
      if (el >= 3) { T.phase = 'run'; T.t0 = Date.now(); beep(1); }
    } else if (T.t.kind === 'count' && el >= T.t.secs) {
      T.phase = 'end'; T.done = true; clearInterval(T.id); beep(2);
    }
    paintTimer();
    if (T.phase === 'end') U.afterTimer();
  }
  function stopWatch() {
    const T = S.timer;
    if (!T || T.phase !== 'run') return;
    const v = (Date.now() - T.t0) / 1000;
    T.phase = 'end'; T.done = true; T.value = v; clearInterval(T.id); beep(1);
    paintTimer();
    U.afterTimer();
  }
  function paintTimer() {
    const T = S.timer, c = clockEl();
    if (!T || !c) return;
    const el = (Date.now() - T.t0) / 1000;
    const box = document.getElementById('fc-timer');
    if (box) box.dataset.phase = T.phase;
    if (T.phase === 'ready') c.textContent = String(Math.max(1, 3 - Math.floor(el)));
    else if (T.t.kind === 'count') c.textContent = T.phase === 'end' ? '0' : String(Math.max(0, Math.ceil(T.t.secs - el)));
    else c.textContent = (T.phase === 'end' ? T.value : el).toFixed(1);
    const lab = document.getElementById('fc-clock-l');
    if (lab) lab.textContent = T.phase === 'ready' ? 'よーい…' : T.phase === 'run' ? (T.t.kind === 'count' ? 'スタート！ 数えながら やろう' : 'はかっています…') : 'おしまい！';
    const bar = document.getElementById('fc-bar');
    if (bar) bar.style.width = T.t.kind === 'count' && T.phase !== 'ready' ? `${Math.min(100, (100 * el) / T.t.secs).toFixed(1)}%` : '0%';
    const go = document.getElementById('fc-go');
    if (go) go.hidden = T.phase !== 'idle';
    const stop = document.getElementById('fc-stop');
    if (stop) stop.hidden = !(T.phase === 'run' && T.t.kind !== 'count');
    const cancel = document.getElementById('fc-cancel');
    if (cancel) { cancel.hidden = false; cancel.textContent = T.phase === 'end' ? 'やりなおす' : 'やめる'; }
  }
  // タイマーが おわった → 数を入れる欄に（ストップウォッチは 自動で入る）
  U.afterTimer = () => {
    if (!S.flow || !S.timer) return;
    const t = S.timer.t;
    const box = document.getElementById('fc-enter');
    if (box) box.hidden = false;
    if (S.timer.value != null) setNum('fc-val', t, S.timer.value);
    const go = document.getElementById('fc-go');
    if (go) go.hidden = true;
    const val = document.getElementById('fc-val');
    if (val && t.kind !== 'time' && t.kind !== 'hold') { val.focus({ preventScroll: true }); val.select(); }
  };

  /* ---------- 流れ：のびしろ → 測る → 目標 ---------- */
  function startFlow(opt = {}) {
    stopTimer();
    const cand = F.candidates({ me: me(), acts: acts(), checks: X.checks ? X.checks() : [], log: X.log ? X.log() : [], state: S.state, now: now() });
    S.flow = { step: opt.test ? 'measure' : 'pick', cand, test: opt.test || null, value: null, goal: null, redo: opt.redo || null, more: false };
  }
  function pickStep() {
    const f = S.flow;
    const c = cur();
    const skillsAll = [...new Set(F.tests().filter((t) => F.available(t, me())).map((t) => t.skill))];
    const shown = new Set(f.cand.map((x) => x.skill));
    const more = skillsAll.filter((s) => !shown.has(s));
    const card = (x, i) => {
      const t = F.test(x.test);
      return `<button type="button" class="fc-cand" data-fc="cand" data-i="${i}">
        <span class="fc-cand-ic">${ic(testIcon(t))}</span>
        <span class="fc-cand-body"><b>${esc(skillName(x.skill))}</b><span class="fc-cand-test">${esc(t.name)}</span>
          <span class="fc-why">${ic('bulb', 'inline')}${esc(x.reason)}</span></span>${ic('next', 'rc-go')}</button>`;
    };
    paint(`${back('#home', 'ホーム')}
      <p class="eyebrow">${ic('target')}今週の これ1つ</p>
      <h1 class="page-h">のびしろを さがそう</h1>
      <p class="small">きょうまでの 練習・動画チェック・そうだんから、いま のばすと よさそうな所を 3つ 出したよ。<b>1つだけ</b> えらんで、30秒で 今の自分を 測ろう。くらべるのは「前の自分」だけ。</p>
      ${c ? `<p class="cl-msg fc-warn">${ic('warn')}今週は すでに「${esc(F.test(c.test).name)}」を えらんでいます。えらびなおすと、前のは「かえた」として のこります。</p>` : ''}
      <div class="fc-cands">${f.cand.map(card).join('')}</div>
      ${more.length ? `<details class="fc-more"${f.more ? ' open' : ''}><summary>ほかの 技能から えらぶ</summary><div class="chips">${more.map((s) => `<button type="button" class="chip" data-fc="skill" data-s="${s}">${esc(skillName(s))}</button>`).join('')}</div></details>` : ''}`);
  }
  // 技能の中で どの測り方にするか
  function skillTests(skill) {
    const list = F.testsFor(skill, me());
    const f = S.flow;
    f.skillPick = skill;
    paint(`${backStep('pick', 'のびしろ')}
      <p class="eyebrow">${ic('target')}今週の これ1つ</p>
      <h1 class="page-h">${esc(skillName(skill))}：どれで 測る？</h1>
      <div class="rows">${list.map((t) => `<button type="button" class="row-card fc-row" data-fc="test" data-id="${t.id}"><span class="thumb art-ic">${ic(testIcon(t))}</span><span class="rc-body"><span class="rc-title">${esc(t.name)}</span><span class="rc-sub">${whatLine(t)}</span></span>${ic('next', 'rc-go')}</button>`).join('')}</div>`);
  }
  function measureStep() {
    const f = S.flow;
    const t = F.test(f.test);
    const last = F.lastFor(S.state, t.id);
    const redo = f.redo ? F.item(S.state, f.redo) : null;
    const prevBest = F.bestOf(S.state, t.id);
    paint(`${redo ? back('#home', 'ホーム') : backStep('pick', 'のびしろ')}
      <p class="eyebrow">${ic(testIcon(t))}${redo ? '測りなおし' : '30秒チャレンジ'}・${esc(skillName(t.skill))}</p>
      <h1 class="page-h">${esc(t.name)}</h1>
      <p class="fc-what">${whatLine(t)}</p>
      <section class="card fc-how"><h2 class="sec-h">${ic('list')}はかりかた</h2><ol class="steps">${t.how.map((x) => `<li><span>${esc(x)}</span></li>`).join('')}</ol>
        ${t.note ? `<p class="small fc-note">${ic('warn', 'inline')}${esc(t.note)}</p>` : ''}
        <p class="small">${ic('heart', 'inline')}いたい日・つかれている日は むりしないで、あとにしよう。</p></section>
      ${redo ? `<p class="small">前の 数：<b class="num">${fmt(t, redo.tries[redo.tries.length - 1].v)}</b>${prevBest != null ? `・自己ベスト <b class="num">${fmt(t, prevBest)}</b>` : ''}</p>`
        : last ? `<p class="small">前に 測った数：<b class="num">${fmt(t, F.summary(last).last)}</b></p>` : ''}
      ${t.kind === 'make' ? '' : `<section class="card fc-timer" id="fc-timer" data-phase="idle">
        <div class="fc-clock num" id="fc-clock" aria-live="off">${t.kind === 'count' ? t.secs : '0.0'}</div>
        <p class="fc-clock-l" id="fc-clock-l">${t.kind === 'count' ? `${t.secs}秒の タイマー。おしまいの 音が なるよ` : 'スタートを 押すと はかりはじめます'}</p>
        <div class="fc-bar"><i id="fc-bar"></i></div>
        <div class="btns"><button type="button" class="btn primary big" id="fc-go" data-fc="go">${ic('play')}スタート</button>
          <button type="button" class="btn primary big" id="fc-stop" data-fc="stop" hidden>${ic('pause')}ストップ</button>
          <button type="button" class="btn" id="fc-cancel" data-fc="cancel" hidden>やめる</button></div></section>`}
      <section class="card fc-enter" id="fc-enter" ${t.kind === 'make' ? '' : 'hidden'}>
        <h2 class="sec-h">${ic('pencil')}${t.kind === 'make' ? `${t.of}${esc(t.unit)}中 いくつ？` : '数を 入れよう'}</h2>
        ${stepBtns('fc-val', t)}
        <p class="small">${t.kind === 'time' || t.kind === 'hold' ? 'ストップウォッチの 時間が 入ります（直してもOK）。' : '数えまちがえても だいじょうぶ。いちばん 近い数で。'}</p>
        <button type="button" class="btn primary big" data-fc="measured">${ic('check')}これで きめる</button></section>
      ${t.kind === 'make' ? '' : `<p class="center"><button type="button" class="link-btn" data-fc="manual">タイマーを つかわずに 数を入れる</button></p>`}`);
    const el = document.getElementById('fc-val');
    if (el) setNum('fc-val', t, f.value != null ? f.value : t.kind === 'make' ? Math.round(t.of / 2) : last ? F.summary(last).last : 0);
  }
  function goalStep() {
    const f = S.flow;
    const t = F.test(f.test);
    const base = f.value;
    if (f.goal == null) f.goal = F.suggestGoal(t, base);
    const dr = t.drills.map((id) => (X.get ? X.get(id) : null)).filter(Boolean);
    const maxed = t.kind === 'make' && base >= t.of;
    paint(`${backStep('measure', 'はかりなおす')}
      <p class="eyebrow">${ic('target')}今週の これ1つ・${esc(skillName(t.skill))}</p>
      <h1 class="page-h">${esc(t.name)}</h1>
      <section class="card fc-base"><p class="small">いまの 自分（きじゅん）</p><p class="fc-big num">${fmt(t, base)}</p><p class="small">${esc(t.what)}</p></section>
      <section class="card"><h2 class="sec-h">${ic('flag')}1週間の 目標</h2>
        ${maxed ? `<p class="cl-msg">${ic('star')}もう まん点だね！ むずかしい 測りかたに かえると、まだまだ のびるよ。</p>` : ''}
        ${stepBtns('fc-goal', t)}
        <p class="small">いまより ${t.better === 'less' ? '少し はやく' : '少し 多く'}。「むりなく 届く」くらいが ちょうどいい。あとで 直せるよ。</p></section>
      <section class="card"><h2 class="sec-h">${ic('list')}この1週間の 練習</h2>
        <p class="small">ホームの「きょうのメニュー」が、この練習を 中心に 組まれます。</p>
        <div class="rows">${dr.map((d) => `<a class="row-card" href="#${d.id}">${X.drillArt ? X.drillArt(d) : ''}<span class="rc-body"><span class="rc-title">${esc(d.name)}</span><span class="rc-sub">${esc(d.aim || '')}</span></span>${ic('next', 'rc-go')}</a>`).join('')}</div></section>
      <div class="btns"><button type="button" class="btn primary big" data-fc="decide">${ic('check')}この これ1つで いく！</button></div>`);
    setNum('fc-goal', t, f.goal);
  }

  /* ---------- 決める・測りなおす ---------- */
  function decide() {
    const f = S.flow;
    const t = F.test(f.test);
    const goal = numVal('fc-goal', t);
    const r = F.start(S.state, { test: t.id, value: f.value, goal, now: now() });
    if (!r.item) return;
    S.state = r.state;
    save();
    stopTimer();
    S.flow = null;
    location.hash = 'home';
    if (X.addActs) X.addActs([{ type: 'focus', id: t.id, skill: t.skill, xp: G.XP.focus, v: f.value }]);
  }
  function retryMeasured() {
    const f = S.flow;
    const item = F.item(S.state, f.redo);
    const t = F.test(item.test);
    const r = F.addTry(S.state, item.id, f.value, now());
    if (!r.item) return;
    S.state = r.state;
    save();
    stopTimer();
    const list = [{ type: 'try', id: t.id, skill: t.skill, xp: G.XP.try, v: f.value }];
    if (r.pb) list.push({ type: 'pb', id: t.id, skill: t.skill, xp: G.XP.pb, v: f.value });
    S.flow = null;
    S.justPB = r.pb ? item.id : null;
    location.hash = 'focus/' + item.id;
    if (X.addActs) X.addActs(list);
  }

  /* ---------- のびを見る ---------- */
  function spark(item) {
    const t = F.test(item.test);
    // その技能の このテストの ぜんぶの測定（古い順）
    const pts = [];
    for (const x of S.state.items) if (x.test === item.test) for (const y of x.tries) pts.push(y);
    pts.sort((a, b) => a.at - b.at);
    if (pts.length < 2) return '';
    const vs = pts.map((p) => p.v), lo = Math.min(...vs), hi = Math.max(...vs), span = hi - lo || 1;
    const W = 300, H = 72, pad = 8;
    const xy = (p, i) => [pad + (i * (W - 2 * pad)) / (pts.length - 1), H - pad - ((p.v - lo) / span) * (H - 2 * pad)];
    const line = pts.map((p, i) => xy(p, i).join(',')).join(' ');
    const best = F.bestOf(S.state, item.test);
    return `<svg class="fc-spark" viewBox="0 0 ${W} ${H}" role="img" aria-label="これまでの 測定：${pts.map((p) => F.fmt(t, p.v)).join('、')}"><polyline points="${line}" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      ${pts.map((p, i) => { const [x, y] = xy(p, i); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${p.v === best ? 5.5 : 3.5}" class="${p.v === best ? 'best' : ''}"/>`; }).join('')}</svg>`;
  }
  function resultPage(id) {
    const item = F.item(S.state, id);
    if (!item) { location.hash = 'home'; return; }
    const m = F.summary(item), t = m.test;
    const pb = S.justPB === item.id || isPB(item);
    const v = F.verdict(item, pb);
    const days = F.practiceDays(item, acts());
    const isNow = cur() && cur().id === item.id;
    const notes = item.notes.slice().reverse();
    const tries = item.tries;
    paint(`${back('#home', 'ホーム')}
      <p class="eyebrow">${ic('target')}${esc(md(item.week))} の週の これ1つ・${esc(skillName(item.skill))}</p>
      <h1 class="page-h">${esc(t.name)}</h1>
      <section class="card fc-result ${v.key}">
        ${pb ? `<div class="fc-confetti">${X.confetti ? X.confetti() : ''}</div>` : ''}
        ${m.tried ? `<div class="fc-arrow"><span class="fc-from num">${fmt(t, m.base)}</span><span class="fc-to-i">${ic('next')}</span><span class="fc-to num">${fmt(t, m.last)}</span></div>
          <p class="fc-gain">${m.gain > 0 ? `<b>${m.last > m.base ? '+' : '−'}${esc(F.amount(t, m.last - m.base))}</b> のびた！` : m.gain === 0 ? 'おなじ' : `${esc(F.amount(t, m.last - m.base))} ${m.last > m.base ? '多い' : '少ない'}`}${pb ? '<span class="cl-st pass">自己ベスト！</span>' : ''}${m.reached ? '<span class="cl-st pass">目標クリア</span>' : ''}</p>`
          : `<div class="fc-arrow"><span class="fc-to num">${fmt(t, m.base)}</span></div><p class="fc-gain">いまの 自分（きじゅん）</p>`}
        <p class="fc-verdict">${esc(v.text)}</p>
        <div class="fc-goal-row"><span class="small">目標 <b class="num">${fmt(t, m.goal)}</b></span><span class="xpbar fc-bar2"><i style="width:${Math.round(m.ratio * 100)}%"></i></span></div>
        ${spark(item)}
      </section>
      <section class="stats fc-stats"><div><b class="num">${days.size}</b><small>これ1つの 練習日</small></div><div><b class="num">${tries.length - 1}</b><small>測りなおし</small></div><div><b class="num">${fmt(t, F.bestOf(S.state, t.id))}</b><small>自己ベスト</small></div></section>
      ${notes.length ? `<section class="sec"><h2 class="sec-h">${ic('pencil')}ふり返り</h2><div class="rows">${notes.map((n) => `<div class="card fc-note-c"><p class="small">${esc(md(G.day(n.at)))}</p>${n.good ? `<p>${ic('check', 'inline')}${esc(n.good)}</p>` : ''}${n.next ? `<p>${ic('flag', 'inline')}つぎは：${esc(n.next)}</p>` : ''}</div>`).join('')}</div></section>` : ''}
      <div class="btns">
        ${isNow && !item.closed ? `<button type="button" class="btn primary" data-fc="retest" data-id="${item.id}">${ic('timer')}もういちど 測る</button>` : ''}
        <button type="button" class="btn" data-fc="share" data-id="${item.id}">${ic('copy')}コーチ・おうちの人に 見せる</button>
        ${BC.club && BC.club.session && BC.club.session() ? `<button type="button" class="btn" data-fc="club" data-id="${item.id}">${ic('trophy')}ひろばに のせる</button>` : ''}
      </div>
      <div class="btns"><button type="button" class="btn big" data-fc="next" data-id="${item.id}">${ic('target')}つぎの これ1つを えらぶ</button>
        ${item.tries.length > 1 || !isNow ? `<button type="button" class="btn" data-fc="again" data-id="${item.id}">${ic('shuffle')}同じ テストで つづける</button>` : ''}</div>
      <p class="center"><button type="button" class="link-btn" data-fc="del" data-id="${item.id}">${S.armDel === item.id ? 'もう一度 押すと この きろくを 消します' : 'この きろくを 消す'}</button></p>`);
    S.justPB = null;
  }

  /* ---------- ページ ---------- */
  U.render = function (el, sub) {
    S.el = el;
    const fresh = !S.open;      // べつのページから 来たとき
    S.open = true;
    S.sub = sub || '';
    if (!S.state) S.state = F.load(X.store.get(KEY, null));
    if (!sub || sub === 'pick') {
      if (fresh || !S.flow || S.flow.redo) startFlow();
      const f = S.flow;
      if (f.step === 'pick') return f.skillPick ? skillTests(f.skillPick) : pickStep();
      return f.step === 'measure' ? measureStep() : goalStep();
    }
    if (sub === 'measure') {
      const c = cur() || F.pending(S.state, now());
      if (!c) { location.hash = 'focus'; return; }
      if (fresh || !S.flow || S.flow.redo !== c.id) startFlow({ test: c.test, redo: c.id });
      return measureStep();
    }
    return resultPage(sub);
  };
  const toStep = (step) => { S.flow.step = step; stopTimer(); rerender(); };

  /* ---------- ホームのカード ---------- */
  U.homeHTML = function () {
    if (!S.state) S.state = F.load(X.store.get(KEY, null));
    const c = cur();
    const pend = F.pending(S.state, now());
    if (!c) {
      return `<section class="card fc-home cta-new">
        <h2 class="sec-h">${ic('target')}今週の これ1つ</h2>
        <p>1週間で <b>1つだけ</b>、「きのうの自分」を こえよう。のびしろを 3つ 出すよ。30秒で 今の自分を 測って、1週間後に もういちど。</p>
        ${pend ? `<p class="small fc-pend">${ic('flag', 'inline')}先週：「${esc(F.test(pend.test).name)}」 ${fmt(F.test(pend.test), pend.tries[0].v)} から スタート。<a href="#focus/measure">測りなおして のびを見る</a></p>` : ''}
        <div class="btns"><a class="btn primary big" href="#focus">${ic('next')}これ1つを きめる</a></div></section>`;
    }
    const m = F.summary(c), t = m.test;
    const days = F.practiceDays(c, acts());
    const fm = F.forMenu(S.state, acts(), me(), now());
    const dl = Math.max(0, Math.round((Date.parse(F.addDays(c.week, 6) + 'T00:00:00') - Date.parse(G.day(now()) + 'T00:00:00')) / 86400000));
    return `<section class="card fc-home on">
      <div class="fc-home-h"><h2 class="sec-h">${ic('target')}今週の これ1つ</h2><a class="sec-more" href="#focus">かえる</a></div>
      <p class="fc-test"><b>${esc(t.name)}</b><small>${esc(skillName(c.skill))}・${esc(t.what)}</small></p>
      <div class="fc-nums"><span class="fc-n"><small>きじゅん</small><b class="num">${fmt(t, m.base)}</b></span>
        ${m.tried ? `<span class="fc-n now"><small>いま</small><b class="num">${fmt(t, m.last)}</b></span>` : ''}
        <span class="fc-n goal"><small>目標</small><b class="num">${fmt(t, m.goal)}</b></span></div>
      <div class="xpbar fc-bar2" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(m.ratio * 100)}"><i style="width:${Math.round(m.ratio * 100)}%"></i></div>
      <p class="small">${m.reached ? `${ic('check', 'inline')}目標に とどいた！ ` : ''}これ1つの 練習：<b class="num">${days.size}</b>日・のこり <b class="num">${dl}</b>日${dl === 0 ? '（きょうまで）' : ''}</p>
      ${fm && fm.cue ? `<p class="fc-cue">${ic('flag', 'inline')}前の ふり返りから：<b>${esc(fm.cue)}</b></p>` : ''}
      ${fm && fm.easy ? `<p class="small fc-easy">${ic('heart', 'inline')}「むずかしかった」が つづいたね。きょうは「かんたんにする」やり方から。</p>` : ''}
      <div class="btns"><button type="button" class="btn primary" data-fc-home="five">${ic('play')}5分だけ これ1つ</button>
        <a class="btn" href="#focus/measure">${ic('timer')}${m.tried ? 'もういちど 測る' : '測りなおす'}</a>
        ${m.tried ? `<a class="btn" href="#focus/${c.id}">${ic('chart')}のびを見る</a>` : ''}</div></section>`;
  };
  // 5分だけ：これ1つの練習で 短い タイマー
  function fiveMin() {
    const c = cur();
    const fm = c && F.forMenu(S.state, acts(), me(), now());
    if (!fm) return;
    const ids = fm.drills.slice(0, 2);
    const list = ids.length > 1 ? [{ id: ids[0], min: 3, role: 'main', focus: true }, { id: ids[1], min: 2, role: 'main', focus: true }] : [{ id: ids[0], min: 5, role: 'main', focus: true }];
    if (X.runStart) X.runStart(list, 'focus');
  }
  U.hasFocus = () => !!(S.state && cur());
  U.menuFocus = () => F.forMenu(S.state || F.empty(), acts(), me(), now());

  /* ---------- 練習のあとの ふり返り（おわりの画面・やった！の画面に つける） ---------- */
  const GOOD = ['回数が ふえた', 'ミスが へった', '顔を 上げられた', 'リズムが よかった', 'さいごまで やりきった', 'フォームが きれいだった', '新しいことが できた', 'ていねいに できた'];
  // skills：その練習の技能の一覧（これ1つの技能が ふくまれるときだけ 出す）。出さないときは ''
  U.reflectHTML = function (skills) {
    const c = S.state && cur();
    if (!c || c.closed || (skills && !skills.includes(c.skill))) return '';
    const t = F.test(c.test);
    const done = c.notes.some((n) => G.day(n.at) === G.day(now()));
    return `<section class="fc-reflect" data-fc-reflect="${c.id}">
      <h3 class="fc-reflect-h">${ic('pencil')}ふり返り（30秒）<small>${esc(t.name)}</small></h3>${done ? '<p class="small">きょうの ふり返りは もう あるよ。かえると 書きかわります。</p>' : ''}
      <p class="fc-q">できたことは？ <small>1つ</small></p>
      <div class="chips" data-fc-good>${GOOD.map((x) => `<button type="button" class="chip" data-fc-chip="good" data-v="${esc(x)}" aria-pressed="false">${esc(x)}</button>`).join('')}</div>
      <p class="fc-q">つぎに 意識することは？ <small>1つ</small></p>
      <div class="chips" data-fc-next>${t.cues.map((x) => `<button type="button" class="chip" data-fc-chip="next" data-v="${esc(x)}" aria-pressed="false">${esc(x)}</button>`).join('')}</div>
    </section>`;
  };
  U.readReflect = function (root) {
    const out = { good: '', next: '' };
    if (!root) return out;
    for (const k of ['good', 'next']) { const b = root.querySelector(`[data-fc-chip="${k}"][aria-pressed="true"]`); if (b) out[k] = b.dataset.v; }
    const box = root.querySelector('[data-fc-reflect]');
    out.id = box ? box.dataset.fcReflect : null;
    return out;
  };
  // 返り値：{ xp acts } 経験値の acts（なければ []）
  U.saveReflect = function (note) {
    if (!note || !note.id || (!note.good && !note.next)) return [];
    const item = F.item(S.state, note.id);
    if (!item) return [];
    const had = item.notes.some((n) => G.day(n.at) === G.day(now()));
    S.state = F.addNote(S.state, note.id, note, now());
    save();
    return had ? [] : [{ type: 'reflect', id: item.id, skill: item.skill, xp: G.XP.reflect }];
  };

  /* ---------- きろくのページ ---------- */
  U.logHTML = function () {
    if (!S.state) S.state = F.load(X.store.get(KEY, null));
    const hist = F.history(S.state).filter((x) => !x.changed || x.tries.length > 1).slice(0, 6);
    if (!hist.length) return `<section class="sec"><h2 class="sec-h">${ic('target')}これ1つの のび</h2><p class="empty">「今週の これ1つ」を きめて 30秒で 測ると、1週間ごとの のびが ここに たまります。</p><div class="btns"><a class="btn" href="#focus">${ic('next')}これ1つを きめる</a></div></section>`;
    const bests = F.bests(S.state);
    const row = (x) => {
      const m = F.summary(x), t = m.test;
      return `<a class="row-card fc-hist" href="#focus/${x.id}"><span class="thumb art-ic">${ic(testIcon(t))}</span><span class="rc-body"><span class="rc-title">${esc(t.name)}${x.changed ? ' <small>（かえた）</small>' : ''}</span>
        <span class="rc-sub">${esc(md(x.week))}の週・${fmt(t, m.base)}${m.tried ? ` → <b>${fmt(t, m.last)}</b>` : ''}${m.reached ? '・目標クリア' : ''}</span></span>
        ${m.tried ? `<span class="cl-st ${m.gain > 0 ? 'pass' : ''}">${m.gain > 0 ? (m.last > m.base ? '+' : '−') + esc(F.amount(t, m.last - m.base)) : m.gain === 0 ? 'おなじ' : '…'}</span>` : '<span class="cl-st">まだ</span>'}</a>`;
    };
    return `<section class="sec"><h2 class="sec-h">${ic('target')}これ1つの のび</h2>
      <div class="rows">${hist.map(row).join('')}</div>
      <details class="more"><summary>自己ベスト（${Object.keys(bests).length}）</summary><div class="fc-bests">${Object.entries(bests).map(([id, v]) => { const t = F.test(id); return `<span class="fc-best"><small>${esc(t.name)}</small><b class="num">${fmt(t, v)}</b></span>`; }).join('')}</div></details></section>`;
  };

  /* ---------- ひろばに のせる ひとこと ---------- */
  U.shareItem = function () {
    if (!S.state) S.state = F.load(X.store.get(KEY, null));
    const h = F.history(S.state).find((x) => !x.changed);
    if (!h) return null;
    return { type: 'focus', label: F.clubLabel(h, isPB(h)) };
  };

  /* ---------- 操作 ---------- */
  document.addEventListener('click', async (e) => {
    const home = e.target.closest('[data-fc-home]');
    if (home) { if (home.dataset.fcHome === 'five') fiveMin(); return; }
    const chip = e.target.closest('[data-fc-chip]');
    if (chip) {
      const on = chip.getAttribute('aria-pressed') !== 'true';
      chip.parentElement.querySelectorAll('[data-fc-chip]').forEach((b) => b.setAttribute('aria-pressed', 'false'));
      chip.setAttribute('aria-pressed', on ? 'true' : 'false');
      return;
    }
    const t = e.target.closest('[data-fc]');
    if (!t || !S.el || !S.el.contains(t)) return;
    const d = t.dataset;
    const f = S.flow;
    switch (d.fc) {
      case 'back': f.skillPick = null; if (d.to === 'pick') f.value = null; toStep(d.to); break;
      case 'cand': { const x = f.cand[+d.i]; f.test = x.test; f.skillPick = null; f.value = null; toStep('measure'); break; }
      case 'skill': skillTests(d.s); break;
      case 'test': f.test = d.id; f.skillPick = null; f.value = null; toStep('measure'); break;
      case 'go': startTimer(F.test(f.test)); break;
      case 'stop': stopWatch(); break;
      case 'cancel': stopTimer(); measureStep(); break;
      case 'manual': { stopTimer(); const box = document.getElementById('fc-enter'); if (box) { box.hidden = false; const el = document.getElementById('fc-val'); if (el) { el.focus({ preventScroll: true }); el.select(); } } break; }
      case 'num': {
        const id = d.id, tt = F.test(f.test);
        const el = document.getElementById(id);
        if (el && tt) setNum(id, tt, (Number(el.value) || 0) + +d.d * F.step(tt));
        break;
      }
      case 'measured': {
        const tt = F.test(f.test);
        f.value = numVal('fc-val', tt);
        if (f.redo) { retryMeasured(); break; }
        f.goal = null;
        toStep('goal');
        break;
      }
      case 'decide': decide(); break;
      case 'retest': S.open = true; startFlow({ test: F.item(S.state, d.id).test, redo: d.id }); location.hash = 'focus/measure'; break;
      case 'next': S.open = true; startFlow(); location.hash = 'focus'; if (S.sub === '') rerender(); break;
      case 'again': {
        const it = F.item(S.state, d.id);
        S.open = true;
        startFlow({ test: it.test });
        location.hash = 'focus';
        if (S.sub === '') rerender();
        break;
      }
      case 'share': {
        const it = F.item(S.state, d.id);
        const text = F.shareText(it, isPB(it)) + '\n（バスケ・グロウ）';
        if (navigator.share) { try { await navigator.share({ text }); break; } catch (err) { if (err && err.name === 'AbortError') break; } }
        if (X.copy) X.copy(text, 'コピーしました。LINE などに はりつけてね');
        break;
      }
      case 'club': {
        const it = F.item(S.state, d.id);
        const item = { type: 'focus', label: F.clubLabel(it, isPB(it)) };
        if (BC.club && BC.club.postShare) {
          const j = await BC.club.postShare(item);
          if (X.toast) X.toast(j && j.ok ? 'ひろばに のせたよ！' : 'のせられませんでした（クラブに ログインしているか たしかめてね）');
        }
        break;
      }
      case 'del': {
        if (S.armDel !== d.id) { S.armDel = d.id; rerender(); break; }
        S.armDel = null;
        S.state = F.remove(S.state, d.id);
        save();
        location.hash = 'home';
        break;
      }
      default: break;
    }
  });
  // これ1つの ページを はなれたら、タイマーと 途中の流れを すてる
  window.addEventListener('hashchange', () => { if (!/^#focus/.test(location.hash)) { stopTimer(); S.flow = null; S.open = false; } });
})();
