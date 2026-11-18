/* バスケ タップ記録 — ▶ 使い方のデモ
   見本の試合（demo/demo.json）と見本の動画（demo/demo.mp4。tools/make-demo-video.cjs で作る）を使って、
   アプリを自動で動かしながら、画面の下の帯で説明する。指のマーク（👆）が押すボタンへ動き、光った枠で場所を示す。
     ① 🏀 試合を見ながら記録 → 試合を終える →「動画のトリミングを行いますか？」→ 動画を選ぶ → 時刻を合わせる（↔ 指でずらす）→ 場面 → 試合のページ → ホーム
     ② 🎬 撮った動画を見ながら記録 → 記録を終える → 試合のページ（集計・書き出し）→ 場面を見る・動画にする → ホーム
   デモの試合は、クラウドに送らず（game.demo）、終わると消す。自分のチームの名簿も変えない（app.js の S.demoMode）。
   帯のボタン：⏸ 止める／▶ 続ける・⏭ 次へ（説明を待たずに進む）・✕ やめる。 */
(function (root) {
  'use strict';
  const BT = root.BT;
  const { h, $ } = BT.ui;
  const STOP = { stop: true };
  let D = null;              // 動いている間の状態
  let assets = null;         // { meta, file }

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const A = () => BT.app;
  const S = () => BT.app.S;

  /* ---------- 見本（動画と、起きたこと） ---------- */
  async function load() {
    if (assets) return assets;
    const r1 = await fetch('demo/demo.json', { cache: 'force-cache' });
    if (!r1.ok) throw new Error('見本の試合を読めませんでした');
    const meta = await r1.json();
    const r2 = await fetch('demo/' + (meta.file || 'demo.mp4'), { cache: 'force-cache' });
    if (!r2.ok) throw new Error('見本の動画を読めませんでした');
    const blob = await r2.blob();
    let file;
    try { file = new File([blob], '見本の試合.mp4', { type: 'video/mp4', lastModified: 1767225600000 }); } catch (e) { file = blob; file.name = '見本の試合.mp4'; }
    assets = { meta, file };
    return assets;
  }
  /* デモのチーム（ブルー＝自分・レッド＝相手） */
  function demoTeams(meta) {
    const cols = [{ color: '#2f6fed', colorName: '青' }, { color: '#d93636', colorName: '赤' }];
    return meta.teams.slice(0, 2).map((t, i) => Object.assign({ name: t.name.replace(/ウィングス|ホークス/, ''), players: BT.cleanPlayers(t.players.map((p) => ({ no: p.no, name: p.name }))) }, cols[i]));
  }

  /* ---------- 画面の上の帯・指・枠 ---------- */
  function mount() {
    const E = {};
    E.text = h('div', { class: 'dtext', id: 'demoText', 'aria-live': 'polite' });
    E.step = h('span', { class: 'dstep' });
    E.prog = h('i');
    E.pause = h('button', { class: 'btn', id: 'demoPause', onclick: togglePause }, '⏸ 止める');
    E.next = h('button', { class: 'btn primary', id: 'demoNext', onclick: () => { if (D) { D.skip = true; if (D.paused) togglePause(); } } }, '⏭ 次へ');
    E.stop = h('button', { class: 'btn', id: 'demoStop', onclick: () => stop() }, '✕ やめる');
    E.bar = h('div', { class: 'demo-bar', id: 'demoBar', role: 'region', 'aria-label': '使い方のデモ' }, E.text,
      h('div', { class: 'drow' }, E.step, h('span', { class: 'dprog' }, E.prog), E.pause, E.next, E.stop));
    E.finger = h('div', { class: 'demo-finger', 'aria-hidden': 'true' }, '👆');
    E.ring = h('div', { class: 'demo-ring', 'aria-hidden': 'true' });
    document.body.append(E.ring, E.finger, E.bar);
    document.body.classList.add('demo-on');
    return E;
  }
  function unmount() {
    if (!D || !D.E) return;
    const E = D.E;
    [E.bar, E.finger, E.ring].forEach((el) => el.remove());
    document.body.classList.remove('demo-on');
  }
  function togglePause() {
    if (!D) return;
    D.paused = !D.paused;
    D.E.pause.textContent = D.paused ? '▶ 続ける' : '⏸ 止める';
  }
  function say(html, n) {
    D.E.text.innerHTML = html;
    if (n != null) { D.E.step.textContent = `${n} / ${D.total}`; D.E.prog.style.width = Math.round(100 * n / D.total) + '%'; }
  }
  /* 待つ（⏸ の間は止まる。⏭ で先へ。✕ でやめる） */
  async function wait(ms) {
    const end = Date.now() + ms;
    while (Date.now() < end || (D && D.paused)) {
      if (!D || D.stop) throw STOP;
      if (D.skip) { D.skip = false; return; }
      await sleep(70);
    }
    if (!D || D.stop) throw STOP;
  }
  const readTime = (html) => Math.min(7000, 1500 + String(html).replace(/<[^>]+>/g, '').length * 55);
  /* 要素が出てくるまで待つ */
  async function find(sel, ms) {
    const end = Date.now() + (ms || 5000);
    for (;;) {
      if (!D || D.stop) throw STOP;
      const el = typeof sel === 'function' ? sel() : document.querySelector(sel);
      if (el && el.getClientRects().length && !el.closest('[hidden]')) return el;
      if (Date.now() > end) throw new Error('画面の部品が見つかりませんでした（' + (typeof sel === 'string' ? sel : '…') + '）');
      await sleep(80);
    }
  }
  function rectOf(el) {
    try { el.scrollIntoView({ block: 'center', inline: 'nearest' }); } catch (e) { /* 古いブラウザ */ }
    return el.getBoundingClientRect();
  }
  /* 枠と指を、その要素へ */
  function point(el, noFinger) {
    D.target = el; D.noFinger = !!noFinger;
    const r = rectOf(el);
    place(r, noFinger);
    // 帯が、指している所に重なるときは、上に出す
    const E = D.E, barH = E.bar.offsetHeight + 24;
    E.bar.classList.toggle('top', r.bottom > root.innerHeight - barH && r.top > barH + 40);
    return r;
  }
  /* 枠と指を、その場所に置く（画面が動いても付いていくよう、少しごとに置き直す：track） */
  function place(r, noFinger) {
    const E = D.E, pad = 5;
    Object.assign(E.ring.style, { left: r.left - pad + 'px', top: r.top - pad + 'px', width: r.width + pad * 2 + 'px', height: r.height + pad * 2 + 'px' });
    E.ring.classList.add('on');
    if (!noFinger) { E.finger.style.transform = `translate(${Math.round(r.left + r.width / 2)}px, ${Math.round(r.top + r.height / 2)}px)`; E.finger.classList.add('on'); } else E.finger.classList.remove('on');
  }
  function track() {
    if (!D || !D.target || D.dragging) return;
    const el = D.target;
    if (!el.isConnected || !el.getClientRects().length) return;
    place(el.getBoundingClientRect(), D.noFinger);
  }
  function unpoint() { if (!D) return; D.target = null; D.E.ring.classList.remove('on'); D.E.finger.classList.remove('on'); }
  async function press(el) {
    const r = el.getBoundingClientRect();
    const f = D.E.finger;
    f.classList.remove('press'); void f.offsetWidth; f.classList.add('press');
    const tap = h('div', { class: 'demo-tap', style: { left: r.left + r.width / 2 + 'px', top: r.top + r.height / 2 + 'px' } });
    document.body.append(tap);
    setTimeout(() => tap.remove(), 600);
    await sleep(160);
    if (!D || D.stop) throw STOP;
    el.click();
  }
  /* 1つの手順：説明 → （その場所を指す）→（押す）→（ほかのこと）→ 読む時間だけ待つ */
  async function step(o) {
    D.n++;
    say(o.say, D.n);
    let el = null;
    if (o.at) {
      el = await find(o.at, o.findMs);
      point(el, o.noFinger);
      await wait(o.pre != null ? o.pre : 1000);
    } else unpoint();
    if (o.tap && el) await press(el);
    if (o.run) await o.run(el);
    await wait(o.wait != null ? o.wait : o.tap ? Math.max(900, readTime(o.say) - 1200) : readTime(o.say));
  }

  /* ---------- 記録の画面を動かす ---------- */
  /* ⏩ 早送り：記録の時計を、t 秒まで進める（スタートの時刻を前にずらす） */
  function ff(t) {
    const g = S().game;
    if (!g || !g.startedAt) return;
    const cur = BT.elapsed(g, Date.now());
    if (t > cur) g.startedAt -= Math.round((t - cur) * 1000);
  }
  /* 選手の行のボタン（リバは、設定で Oリバ・Dリバに分けているときは、そちら） */
  function rowBtn(tm, no, type) {
    const q = (ty) => document.querySelector(`#panel${tm} button[data-no="${no}"][data-type="${ty}"]`);
    return q(type) || (type === 'reb' ? q('dreb') || q('oreb') : null);
  }
  const rvPicking = () => { const p = $('#pick'); return !!(p && !p.hidden); };
  /* 動画を見ながら記録：「2P → 5番」の画面なら2つ押す。選手ごとの行なら1つ */
  async function tapPlay(tm, no, type, text) {
    if (rvPicking()) {
      const ty = (t) => document.querySelector(`#pick${tm} [data-ptype="${t}"]`);
      await step({ say: text + '<br><small>→ プレー（<b>' + (BT.TYPE[type] ? BT.TYPE[type].btn : type) + '</b>）を押してから、背番号（<b>' + no + '</b>）。どちらが先でもかまいません</small>', at: () => ty(type) || (type === 'reb' ? ty('dreb') : null), tap: true, wait: 700 });
      await step({ say: text + '<br><small>→ 背番号 <b>' + no + '</b></small>', at: `#pick${tm} [data-pno="${no}"]`, tap: true, wait: 1400 });
    } else {
      await step({ say: text, at: () => rowBtn(tm, no, type), tap: true });
    }
  }
  async function menuItem(label) {
    await step({ say: '「≡ メニュー」を開きます', at: '#btnMenu', tap: true, wait: 700 });
    await step({ say: `「${label}」`, at: () => Array.from(document.querySelectorAll('.mitem')).find((b) => b.textContent.includes(label)), tap: true, wait: 600 });
    await step({ say: '確かめの小窓で「終える」', at: () => Array.from(document.querySelectorAll('#sheet .sheet-foot .btn')).find((b) => b.textContent.trim() === '終える'), tap: true, wait: 900 });
  }
  /* 試合の準備：見本のチーム・背番号を入れて、画面を作り直す */
  async function fillTeams() {
    const s = S();
    if (s.draft) { s.draft.teams = demoTeams(assets.meta); s.draft.title = '使い方のデモ'; }
    A().go('setup');
    await sleep(200);
  }
  /* ↔ の目盛りを、指で d 秒ぶん動かす（指のマークも一緒に動かす） */
  async function dragRuler(d) {
    const cv = await find('#adjRuler');
    const r = rectOf(cv);
    D.target = cv; D.noFinger = true; place(r, true);
    D.dragging = true;
    const pps = r.width / 10;         // 目盛り ±5 秒
    const x0 = r.left + r.width / 2, y = r.top + 32;
    const f = D.E.finger;
    const ev = (type, x) => cv.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, pointerId: 31, pointerType: 'touch', isPrimary: true, button: 0, buttons: type === 'pointerup' ? 0 : 1 }));
    f.style.transition = 'transform 0.08s linear';
    f.style.transform = `translate(${Math.round(x0)}px, ${Math.round(y)}px)`;
    await wait(500);
    ev('pointerdown', x0);
    const N = 24;
    for (let i = 1; i <= N; i++) {
      const x = x0 + d * pps * (i / N);
      ev('pointermove', x);
      f.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
      await sleep(55);
      if (!D || D.stop) throw STOP;
    }
    ev('pointerup', x0 + d * pps);
    f.style.transition = '';
    D.dragging = false;
  }

  /* ========== ① 試合を見ながら記録 → 動画から場面を切り出す ========== */
  async function scriptLive() {
    const ev = assets.meta.events;
    const lead = assets.meta.lead || 3;
    const tOf = (kind, tm, no) => { const e = ev.find((x) => x.kind === kind && x.team === tm && String(x.no) === String(no)); return e ? e.v - lead + 1.0 : null; };      // 人がタップするのは、プレーの約1秒あと
    D.total = 31;
    await step({ say: 'これは <b>🏀 試合を見ながら記録する</b> のデモです。ベンチやスタンドで、試合を見ながらタップして記録します。', at: '#btnNew', tap: true });
    await fillTeams();
    await step({ say: 'チーム名・ユニフォームの色・背番号を選びます。背番号は「4〜15」などのボタンでまとめて選べます（自分のチームは、次から自動で入ります）。', at: '.teams2', noFinger: true });
    await step({ say: '準備ができたら「<b>記録の画面へ</b>」', at: '#btnToLive', tap: true });
    await step({ say: 'ティップオフ（試合開始のジャンプボール）の瞬間に「<b>▶ スタート</b>」。左上の時計が動き出し、そこからの時間で記録します。', at: '#btnStartBig', tap: true });
    await step({ say: '選手1人＝1行。プレーが起きたら、<b>その選手の行のボタンを1回タップ</b>するだけです。<br><small>⏩ ここからは、少しずつ早送りします</small>', at: '#panel0', noFinger: true });
    ff(tOf('dreb', 0, 15) || 19.8);
    await step({ say: '#15 がリバウンド！ → 15番の行の「<b>リバ</b>」', at: () => rowBtn(0, '15', 'reb'), tap: true });
    ff(tOf('fg2', 0, 5) || 27.2);
    await step({ say: '#5 が 2P を決めた！ → 5番の行の「<b>2P</b>」', at: () => rowBtn(0, '5', 'fg2'), tap: true });
    ff(tOf('fg3', 1, 6) || 40.2);
    await step({ say: '相手の #6 が 3P！ → 相手チームの 6番の行の「<b>3P</b>」（得点も自動で数えます）', at: () => rowBtn(1, '6', 'fg3'), tap: true });
    ff(tOf('fg2', 0, 15) || 51.3);
    await step({ say: '#15 が 2P！', at: () => rowBtn(0, '15', 'fg2'), tap: true });
    ff(60.5);
    await step({ say: 'だれのプレーか決めずに、あとで見たい場面には、画面の下の「<b>★ あとで見る</b>」（「パスミス」も同じ）。時刻だけが残ります。', at: '#btnMark', tap: true });
    ff(tOf('fg3', 0, 5) || 70.5);
    await step({ say: '#5 が 3P！', at: () => rowBtn(0, '5', 'fg3'), tap: true });
    await step({ say: '押しまちがえたら「<b>↶ 取り消す</b>」で、いちばん新しい記録を取り消せます（このデモでは取り消しません）。', at: '#btnUndo', noFinger: true });
    await menuItem('試合を終える');
    await step({ say: '記録は、この端末とクラウドに保存されます（デモの記録は残しません）。<br>試合を終えると「<b>動画のトリミングを行いますか？</b>」と聞かれます。', at: '#sheet .sheet-card', noFinger: true });
    await step({ say: '動画がまだ用意できていないときは「<b>あとで</b>」で大丈夫。記録は消えず、ホームの「✂️ 切り出し待ち」から、いつでも続きができます。', at: '#askLater', noFinger: true });
    await step({ say: '今回は「<b>はい、動画を選ぶ</b>」', at: '#askTrimYes', tap: true });
    await step({ say: '① 試合の動画を選びます（iPhone・iPad は写真アプリから）。デモでは見本の動画を使います。', at: '#tPick', tap: true, wait: 2200 });
    await find(() => BT.trim.state && BT.trim.state.media && BT.trim.state.media.ready ? $('#tSyncHere') : null, 9000);
    await step({ say: '② 記録と動画の時刻を合わせます。合わせる記録は「<b>スタート</b>」のまま。', at: '#tSyncPick', noFinger: true });
    await step({ say: '動画を、ジャンプボールの瞬間で止めます（映像の下のバーをなぞる・コマ送り）。', at: '#tViewer', noFinger: true, run: async () => { await BT.trim.state.media.seek(lead + 0.8); } });
    await step({ say: '「<b>⏱ この瞬間が、選んだ記録</b>」を押すと、ほかの記録の場面も全部決まります。', at: '#tSyncHere', tap: true });
    await step({ say: '場面が少しずれているときは「<b>↔ 指でずらして合わせる</b>」。', at: '#tAdjust', tap: true, wait: 1200 });
    await step({ say: '場面の枠（色の帯）を<b>指で左右に動かす</b>と、記録した瞬間のコマが上に出ます。プレーの瞬間で指を離します。', at: '#adjRuler', noFinger: true, pre: 600, run: () => dragRuler(-0.8), wait: 2600 });
    await step({ say: '「<b>✓ これで合わせる</b>」', at: '#adjOk', tap: true });
    await step({ say: '③ 記録した場面が並びました。<b>▶</b> で1場面ずつ見られます。', at: '#tList [data-play]', tap: true, wait: 4800 });
    await step({ say: '「選手」で <b>#5</b> を選ぶと、#5 の場面だけに絞れます（チーム・プレーでも絞れます）。', at: '[data-fplayer="0:5"]', tap: true });
    await step({ say: '「<b>▶ 続けて再生</b>」でまとめて見たり、「<b>🎬 動画にする</b>」で1本の動画（MP4）にしたりできます。スマホは「📲 写真に保存」で写真アプリへ。', at: '#tExport', noFinger: true });
    await step({ say: '終わったら「<b>✓ 終わる</b>」で、試合のページへ。', at: '#tDone', tap: true });
    await step({ say: '試合のページ：<b>集計</b>・<b>CSV の書き出し</b>・場面の切り出しは、いつでもここから。', at: '.hubstats', noFinger: true });
    await step({ say: '「<b>🏠 ホームへ戻る</b>」でホームへ。どの画面にも 🏠 があります。', at: '#hubHome2', tap: true });
  }

  /* ========== ② 撮った動画を見ながら記録 → 集計・場面・動画 ========== */
  async function scriptReview() {
    const ev = assets.meta.events;
    const vOf = (kind, tm, no) => { const e = ev.find((x) => x.kind === kind && x.team === tm && String(x.no) === String(no)); return e ? e.v : null; };
    D.total = 26;
    S().demoFile = assets.file;
    await step({ say: 'これは <b>🎬 撮った動画を見ながら記録する</b> のデモです。撮っておいた試合の動画を、止めたり戻したりしながら記録します。', at: '#btnNewReview', tap: true });
    await fillTeams();
    await step({ say: 'チームと背番号を選んだら「<b>🎬 動画を選んで、記録の画面へ</b>」（デモでは見本の動画を使います）。', at: '#btnToReview', tap: true, wait: 1800 });
    await find(() => (A().rvReady() ? $('#rvPlay') : null), 9000);
    if (!rvPicking()) D.total = 22;          // 選手ごとの行（iPad など）は、1回押すだけ
    await step({ say: '上に動画、下に記録のボタン。時計は<b>動画の時刻</b>です。動画を再生して、プレーが起きたら止めて記録します。', at: '#rvBox', noFinger: true });
    const v1 = vOf('fg2', 0, 5) || 29.2;
    await A().rvSeekTo(v1 - 3);
    await step({ say: '▶ で再生…', at: '#rvPlay', tap: true, wait: 3300 });
    await step({ say: 'シュートが入ったところで、⏸ で止めます。', at: '#rvPlay', tap: true, wait: 900 });
    await tapPlay(0, '5', 'fg2', '#5 の 2P！');
    await step({ say: '<b>コマ送り</b>（◀コマ・コマ▶）で、ぴったりの瞬間も選べます。<b>−5・+5</b> で戻す・進める、速さ（×0.5 など）も変えられます。', at: '#rvNext', noFinger: true });
    await A().rvSeekTo((vOf('fg3', 1, 6) || 42.2) + 0.6);
    await tapPlay(1, '6', 'fg3', '相手の #6 の 3P！');
    await step({ say: '「<b>💬</b>」で、その場面にコメント・スタンプも入れられます（動画の中に数秒出ます）。', at: '#rvNote', noFinger: true });
    await A().rvSeekTo((vOf('fg2', 0, 15) || 53.3) + 0.6);
    await tapPlay(0, '15', 'fg2', '#15 の 2P！');
    await A().rvSeekTo((vOf('fg3', 0, 5) || 72.5) + 0.6);
    await tapPlay(0, '5', 'fg3', '#5 の 3P！');
    await menuItem('記録を終える');
    await step({ say: '記録を終えると、すぐに<b>試合のページ</b>。集計がもう出ています。', at: '.hubstats', noFinger: true });
    await step({ say: '<b>CSV</b>（Excel で開ける集計・記録の一覧）も、ここから書き出せます。', at: '.hubexport', noFinger: true });
    await step({ say: '「<b>🎬 場面を見る・動画にする</b>」で、記録した場面を切り出します。', at: '#hubTrim', tap: true, wait: 2200 });
    await find(() => (BT.trim.state && BT.trim.state.media && BT.trim.state.media.ready ? $('#tSyncOk') : null), 9000);
    await step({ say: '動画を見ながら記録したので、時刻は<b>はじめからぴったり</b>。合わせる必要はありません。', at: '#tSyncOk', noFinger: true });
    await step({ say: '「<b>▶ 続けて再生</b>」で、記録した場面をまとめて見られます。', at: '#tReel', tap: true, wait: 6000 });
    await step({ say: '「<b>🎬 動画にする</b>」で1本の動画に。できた動画は、この画面で見て「⬇ 保存する」「📲 写真に保存」できます。', at: '#tExport', noFinger: true });
    await step({ say: '終わったら「<b>✓ 終わる</b>」→ 試合のページ →「🏠 ホームへ戻る」。', at: '#tDone', tap: true });
    await step({ say: 'ホームへ戻ります。', at: '#hubHome2', tap: true });
  }

  /* ========== 始める・終わる ========== */
  async function run(kind) {
    if (D) return;
    BT.ui.closeSheet(true);
    D = { kind, n: 0, total: 1, paused: false, skip: false, stop: false, prevCurrent: BT.store.current(), E: null, target: null };
    D.E = mount();
    D.timer = setInterval(track, 250);
    say('見本の試合と動画を用意しています…');
    try {
      await load();
      if (!D || D.stop) throw STOP;
      const s = S();
      s.demoMode = true;
      if (s.view !== 'home') A().go('home');
      await sleep(300);
      if (kind === 'review') await scriptReview(); else await scriptLive();
      unpoint();
      await finish(true);
    } catch (e) {
      if (e === STOP) { await finish(false); return; }
      console.error('[demo]', e);
      await finish(false);
      BT.ui.toast('デモを続けられませんでした：' + (e && e.message || e), 'err', 7000);
    }
  }
  async function finish(done) {
    if (!D) return;
    const d = D;
    D.stop = true;
    const s = S();
    // デモの試合を消して、もとの状態に
    try { if (BT.trim.active()) BT.trim.close(true); } catch (e) { /* 無視 */ }
    BT.ui.closeSheet(true);
    const demoIds = BT.store.games().filter((g) => g.demo).map((g) => g.id);
    if (s.game && (s.game.demo || demoIds.includes(s.game.id))) demoIds.push(s.game.id);
    if (s.game && s.game.demo) { s.game = null; }
    demoIds.forEach((id) => BT.store.deleteGame(id));
    s.demoMode = false; s.demoFile = null;
    BT.store.setCurrent(d.prevCurrent && BT.store.loadGame(d.prevCurrent) ? d.prevCurrent : null);
    clearInterval(d.timer);
    unmount();
    D = null;
    A().go('home');
    if (done) {
      BT.ui.sheet({
        title: 'デモはおしまいです',
        body: h('div', { class: 'demo-pick' }, h('p', null, d.kind === 'review' ? '撮った動画があるときは「🎬 撮った動画を見ながら記録する」から始めてください。' : '実際の試合では「🏀 試合を見ながら記録する」から始めてください。'),
          h('p', { class: 'note' }, 'デモの記録は消しました。使い方は、右上の「？」でも見られます。')),
        foot: [h('button', { class: 'btn', onclick: () => { BT.ui.closeSheet(true); menu(); } }, 'ほかのデモを見る'), h('button', { class: 'btn primary', onclick: () => BT.ui.closeSheet() }, 'とじる')]
      });
    }
  }
  function stop() { if (D) { D.stop = true; D.skip = true; } }

  /* デモを選ぶ小窓 */
  function menu() {
    if (D) return;
    const s = BT.ui.sheet({
      title: '▶ 使い方のデモ',
      body: h('div', { class: 'demo-pick' },
        h('p', { class: 'note' }, '見本の試合と動画で、アプリが自動で動きます。下の帯の「⏸ 止める」「⏭ 次へ」「✕ やめる」で、止めたり進めたりできます。デモの記録は残りません。'),
        h('button', { class: 'xitem', id: 'demoLive', onclick: () => { s.close(); run('live'); } }, h('b', null, '🏀 試合を見ながら記録 → 動画から場面を切り出す'), h('small', null, '準備 → タップで記録 → 試合を終える →「動画のトリミングを行いますか？」→ 時刻を合わせる → 場面を見る（約2分半）')),
        h('button', { class: 'xitem', id: 'demoReview', onclick: () => { s.close(); run('review'); } }, h('b', null, '🎬 撮った動画を見ながら記録 → 集計・場面・動画'), h('small', null, '動画を選ぶ → 止めながら記録 → 記録を終える → 集計・CSV → 場面を見る・動画にする（約2分）')))
    });
  }

  BT.demo = { menu, run, stop, active: () => !!D, file: () => (D && assets ? assets.file : null) };
})(typeof window !== 'undefined' ? window : globalThis);
