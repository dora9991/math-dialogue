/* バスケ得点クリップ — 画面（動画を選ぶ → チームの色 → ゴールを教える → 解析 → 入れた／入れられたを見る・動画にする）
   ゴールの指定と解析の実行は「バスケ分析スタジオ」の ui-auto.js から持ってきたもの（解析エンジンは同じファイル）。 */
(function (root) {
  'use strict';
  const BS = root.BS;
  const { h, $ } = BS.ui;
  const C = BS.clips;

  /* ユニフォームの色（よくある色）。白・黒も選べるように、見本には枠を付ける */
  const COLORS = [
    { name: '白', hex: '#f4f4f4' }, { name: '黒', hex: '#222222' }, { name: '赤', hex: '#d93636' }, { name: '青', hex: '#2f6fed' },
    { name: '紺', hex: '#1f2f6e' }, { name: '水色', hex: '#45b0e6' }, { name: '緑', hex: '#2e9e5b' }, { name: '黄', hex: '#f2c230' },
    { name: 'オレンジ', hex: '#f08a24' }, { name: '紫', hex: '#7d4cc9' }, { name: 'ピンク', hex: '#e86aa6' }, { name: 'グレー', hex: '#8a8f98' }
  ];
  const HOOP = ['ゴールA', 'ゴールB'];
  const HOOP_COL = ['#22c55e', '#e879f9'];
  const ICON = ['🏀', '🛡'];
  const WHAT = ['入れた', '入れられた'];

  const S = {
    media: null, key: null, st: BS.store.fresh(),
    marking: null, running: null, live: null,
    tab: 0, openSetup: false, openHow: null, openMaybe: false,
    reel: { active: false, list: [], i: -1, label: '', team: 0 },
    exporting: null, out: [null, null],
    thumbs: {}, thumbJob: null, saveTimer: 0, debug: false, lastLog: null,
    finding: null, autoGoals: true       // finding：ゴールを自動で探している途中（findGoals）。autoGoals：動画を開いたら自動で探すか（テストで止める）
  };

  /* ---------- 小さな道具 ---------- */
  const duration = () => (S.media ? S.media.duration : 0) || 0;
  const now = () => (S.media ? S.media.time : 0);
  const teamName = (i) => { const t = S.st.teams[i] || {}; return (t.name || '').trim() || t.colorName || (i ? '相手' : '自分'); };
  const teamTag = (i) => `${teamName(i)}（${i ? '相手' : '自分'}）`;
  const teamColor = (i) => (S.st.teams[i] && S.st.teams[i].color) || (i ? '#2f6fed' : '#f4f4f4');
  const setupOf = () => ({ hoopTeam: S.st.hoopTeam, halfT: S.st.halfT });
  const list = () => C.items(S.st.result, setupOf(), S.st.edits);
  const clipsFor = (team) => C.clipsOf(list(), team, S.st.win, duration());
  const marksKey = () => JSON.stringify(S.st.hoops.map((m) => (m ? [m.t, m.box, m.rim] : null))) + (S.st.fixed ? '|fixed' : '');
  const stale = () => !!(S.st.result && S.st.result.marks !== marksKey());
  const halfLabel = (it) => (it.half === 2 ? '後半' : it.half === 1 ? '前半' : '');
  function save() {
    clearTimeout(S.saveTimer);
    S.saveTimer = setTimeout(() => { if (S.key) BS.store.save(S.key, S.st); }, 150);
  }
  function hexRGB(hex) { const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex || ''); return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [128, 128, 128]; }
  /* 自由に選んだ色の呼び名：いちばん近い見本の色の名前 */
  function nearestName(hex) {
    const [r, g, b] = hexRGB(hex);
    let best = null;
    COLORS.forEach((c) => { const [r2, g2, b2] = hexRGB(c.hex); const d = (r - r2) ** 2 + (g - g2) ** 2 + (b - b2) ** 2; if (!best || d < best.d) best = { d, name: c.name }; });
    return best.name;
  }

  /* ---------- 動画を開く ---------- */
  function openFile(file) {
    if (!file) return;
    const okType = /^video\//.test(file.type || '') || /\.(mp4|mov|m4v|webm|mkv)$/i.test(file.name || '');
    if (!okType) { BS.ui.toast('動画ファイル（MP4・MOV など）を選んでください', 'err'); return; }
    if (S.running) { BS.ui.toast('解析中です。中止してから開いてください', 'warn'); return; }
    if (S.exporting) { BS.ui.toast('書き出し中です。終わってから開いてください', 'warn'); return; }
    stopReel(true);
    cancelMarking();
    cancelFind();
    if (S.thumbJob) S.thumbJob.cancel = true;
    if (S.media) S.media.destroy();
    const m = BS.createVideoMedia(file);
    S.media = m;
    S.key = BS.store.videoKey(file);
    const saved = BS.store.load(S.key);
    S.st = saved || BS.store.fresh();
    S.thumbs = {}; S.out = [null, null]; S.tab = 0; S.openSetup = false; S.openHow = null; S.live = null;
    const slot = $('#mediaSlot');
    slot.innerHTML = '';
    slot.appendChild(m.el);
    m.on('time', onTime);
    m.on('play', updatePlayBtn);
    m.on('pause', updatePlayBtn);
    m.on('ready', () => {
      render(); drawTimeline(); drawOverlay();
      if (S.st.result) makeThumbs();
      // ゴールがまだなら、自動で探す（前に探した動画・自分で教えた動画では探さない。ゴールの絵だけ作る）
      if (!S.st.hoops.some(Boolean) && !S.st.autoTried && S.autoGoals !== false) findGoals(); else makeHoopThumbs();
    });
    m.on('error', () => BS.ui.toast('この動画は、このブラウザでは再生できないようです（MP4・MOV をお試しください）', 'err', 7000));
    m.on('notice', (t) => BS.ui.toast(t, 'warn', 6000));
    document.body.classList.add('has-video');
    if (saved && saved.result) BS.ui.toast('前に解析した結果を開きました（同じ動画です）', 'ok', 4000);
    render(); drawTimeline(); updatePlayBtn();
  }
  function pickFile() { const inp = $('#fileVideo'); inp.value = ''; inp.click(); }

  /* ---------- 再生 ---------- */
  function play() { if (S.media) S.media.play(); }
  function pause() { if (S.media) S.media.pause(); }
  // （書き出し中は、映像を書き出しの処理が動かしているので、ボタンやキーでは動かさない）
  function toggle() { if (!S.media || S.exporting) return; if (S.media.paused) play(); else pause(); }
  function seek(t, fromReel) {
    if (!S.media || S.exporting) return Promise.resolve();
    if (!fromReel && S.reel.active) stopReel(true);
    return S.media.seek(BS.clamp(t, 0, duration() || t));
  }
  let lastTimeText = '';
  function onTime(t) {
    const tt = $('#timeText');
    const s = `${BS.fmtTime(t)} / ${BS.fmtTime(duration())}`;
    if (tt && s !== lastTimeText) { lastTimeText = s; tt.textContent = s; }
    reelTick(t);
    drawTimeline();
    if (!S.running) drawOverlay();
  }
  function updatePlayBtn() {
    // 記号は span に入れ、変わったときだけ書き換える（押している間に中身が入れ替わると、Safari ではクリックにならない）
    const ico = $('#btnPlay .ico'), mark = !S.media || S.media.paused ? '▶' : '⏸';
    if (ico && ico.textContent !== mark) ico.textContent = mark;
  }

  /* ---------- 画面（右のパネル） ---------- */
  function render() {
    const P = $('#panel');
    if (!P) return;
    const keepScroll = P.scrollTop;
    P.innerHTML = '';
    const hasRes = !!(S.st.result && S.media);
    if (hasRes && !S.running) {
      P.append(resultsCard());
      const d = h('details', { class: 'setupfold' }, h('summary', null, '設定を変える（動画・チームの色・ゴール・後半）'),
        stepVideo(), stepTeams(), stepGoals(), stepRun());
      d.open = !!S.openSetup || !!S.marking;
      d.querySelector('summary').addEventListener('click', () => { S.openSetup = !d.open; });
      P.append(d);
    } else {
      P.append(stepVideo(), stepTeams(), stepGoals(), stepRun());
    }
    P.scrollTop = keepScroll;
  }
  function stepHead(n, title, sub, done) {
    return h('div', { class: 'step-h' }, h('span', { class: 'num' + (done ? ' done' : '') }, done ? '✓' : String(n)), h('b', null, title), sub ? h('small', null, sub) : null);
  }

  /* ① 動画 */
  function stepVideo() {
    const m = S.media;
    const card = h('section', { class: 'card step', id: 'stepVideo' }, stepHead(1, '試合の動画を選ぶ', null, !!m));
    if (!m) {
      card.append(
        h('p', null, 'スマホやビデオカメラで撮った試合の動画（MP4・MOV）を選びます。'),
        h('div', { class: 'row' }, h('button', { class: 'btn primary big', onclick: pickFile }, '🎬 動画を選ぶ'), h('span', { class: 'note' }, 'ここへドラッグ＆ドロップでも開けます')),
        h('p', { class: 'note' }, '🔒 動画はこの端末の中だけで扱います。インターネットには送りません。'));
    } else {
      const f = m.file;
      card.append(h('div', { class: 'row' },
        h('span', { class: 'fname', title: f.name || '' }, f.name || String(f)),
        h('span', { class: 'note' }, duration() ? `長さ ${BS.fmtTime(duration())}` : '読み込み中…'),
        h('button', { class: 'btn small', onclick: pickFile }, '別の動画を選ぶ')));
    }
    return card;
  }

  /* ② チームの色 */
  function stepTeams() {
    const card = h('section', { class: 'card step', id: 'stepTeams' }, stepHead(2, 'どっちの色が自分のチーム？', 'ユニフォームの色', !!S.media));
    [0, 1].forEach((i) => {
      const T = S.st.teams[i];
      const sw = h('div', { class: 'swatches', role: 'radiogroup', 'aria-label': i ? '相手のチームの色' : '自分のチームの色' });
      COLORS.forEach((c) => {
        const on = T.color.toLowerCase() === c.hex.toLowerCase();
        sw.append(h('button', {
          class: 'sw' + (on ? ' on' : ''), style: { background: c.hex }, title: c.name, 'aria-label': c.name, role: 'radio', 'aria-checked': on ? 'true' : 'false', dataset: { team: i, color: c.name },
          onclick: () => setTeamColor(i, c.hex, c.name)
        }));
      });
      const custom = h('input', { type: 'color', class: 'swc', title: 'ほかの色', value: T.color, onchange: (e) => setTeamColor(i, e.target.value, nearestName(e.target.value)) });
      sw.append(custom);
      const name = h('input', { type: 'text', class: 'tname', placeholder: 'チーム名（なくてもOK）', value: T.name || '', maxlength: 20,
        onchange: (e) => { T.name = e.target.value.trim(); save(); render(); drawTimeline(); } });
      card.append(h('div', { class: 'teamrow' },
        h('div', { class: 'tlabel' }, h('span', { class: 'chip', style: { background: T.color } }), h('b', null, i ? '相手' : '自分'), h('span', { class: 'note' }, `${T.colorName}${T.name ? '・' + T.name : ''}`)),
        sw, name));
    });
    if (S.st.teams[0].color.toLowerCase() === S.st.teams[1].color.toLowerCase()) card.append(h('p', { class: 'note warn' }, '⚠ 自分と相手が同じ色になっています。見分けやすいように、どちらかを変えてください（解析には影響しません）。'));
    card.append(h('p', { class: 'note' }, 'どちらのチームの得点かは、ボールが入った「ゴール」で決めます（前半・後半で攻めるゴールは決まっているため）。色は、画面と書き出す動画の表示に使います。'));
    return card;
  }
  function setTeamColor(i, hex, name) {
    S.st.teams[i].color = hex; S.st.teams[i].colorName = name;
    save(); render(); drawTimeline();
  }

  /* ③ ゴール */
  function stepGoals() {
    const st = S.st;
    const nMark = st.hoops.filter(Boolean).length;
    const card = h('section', { class: 'card step', id: 'stepGoals' }, stepHead(3, 'ゴール', '自動で探します・合っているか見るだけ', nMark >= 2 && !S.finding));
    if (!S.media) { card.append(h('p', { class: 'note' }, '動画を選ぶと、ゴールを自動で探します。')); return card; }
    if (S.finding) {
      const f = S.finding;
      card.append(h('div', { class: 'finding' },
        h('b', null, '🔍 ゴールを探しています… '), h('span', { class: 'note', id: 'findLabel' }, f.n ? `${f.i} / ${f.n}` : ''),
        h('div', { class: 'progress' }, h('i', { id: 'findBar', style: { width: (f.n ? 100 * f.i / f.n : 0).toFixed(0) + '%' } })),
        h('button', { class: 'btn small', id: 'btnFindStop', onclick: cancelFind }, 'やめて、自分で教える')));
    }
    if (S.marking) {
      const mk = S.marking;
      card.append(h('div', { class: 'markcard' },
        h('b', null, `${HOOP[mk.i]} を教える：`),
        mk.step === 0 ? ' 映像を、このゴールがはっきり映っている場面で止めて、リング（輪）のあたりをタップ（クリック）してください。リングの左端から右端までなぞっても指定できます。' : ' 拡大しました。リング（輪）の左端から右端まで、ドラッグでなぞってください。',
        h('div', { class: 'row', style: { marginTop: '6px' } },
          mk.step === 1 ? h('button', { class: 'btn small', onclick: () => { mk.step = 0; mk.view = null; render(); drawOverlay(); } }, '拡大をやめる') : null,
          h('button', { class: 'btn small', onclick: cancelMarking }, 'やめる'),
          h('span', { class: 'note' }, 'Esc でもやめられます'))));
    }
    const HOW = { auto: '自動で見つけました', tap: 'タップした所から見つけました', trace: 'なぞって指定しました' };
    [0, 1].forEach((i) => {
      const m = st.hoops[i];
      const att = h('div', { class: 'attack' }, h('span', { class: 'note' }, '動画のはじめに、このゴールを攻めているのは？'),
        h('div', { class: 'row' }, [0, 1].map((tm) => h('button', {
          class: 'btn small teambtn' + (st.hoopTeam[i] === tm ? ' on' : ''), dataset: { hoop: i, team: tm },
          onclick: () => { st.hoopTeam[i] = tm; st.hoopTeam[1 - i] = 1 - tm; save(); render(); drawTimeline(); }
        }, h('span', { class: 'chip', style: { background: teamColor(tm) } }), teamTag(tm)))));
      const state = m ? `✓ ${HOW[m.how] || '指定ずみ'}（${BS.fmtTime(m.t)} のコマ）` : S.finding ? '探しています…' : st.autoTried ? '自動では見つかりませんでした' : 'まだです';
      card.append(h('div', { class: 'goal' + (m ? ' done' : '') },
        h('div', { class: 'goal-h' }, h('b', { style: { color: HOOP_COL[i] } }, '■ '), h('b', null, HOOP[i]), h('span', { class: 'note' }, state)),
        m && S.thumbs['hoop' + i] ? h('div', { class: 'thumbrow' }, S.thumbs['hoop' + i], h('span', { class: 'note' }, '黄色の線が、リング（輪）にぴったり重なっていれば OK です。ずれていたら「ちがう・直す」')) : null,
        h('div', { class: 'row' },
          h('button', { class: 'btn small ' + (m ? '' : 'primary'), id: 'btnMark' + i, disabled: !!S.running, onclick: () => startMarking(i) }, m ? 'ちがう・直す' : 'このゴールを教える'),
          m ? h('button', { class: 'btn small', onclick: () => seek(m.t) }, 'このコマへ') : null),
        att));
    });
    if (!S.finding && !S.running) {
      card.append(h('div', { class: 'row' },
        h('button', { class: 'btn small', id: 'btnFind', onclick: () => findGoals() }, '🔍 もう一度、自動で探す'),
        h('span', { class: 'note' }, '自分で教えたゴールは、そのままです')));
    }
    const how = h('details', { class: 'howto' }, h('summary', null, '自動で見つからない・ずれているとき'),
      h('ol', null,
        h('li', null, 'そのゴールの「ちがう・直す」（まだのときは「このゴールを教える」）を押す'),
        h('li', null, '映像の下のバーを動かして、そのゴールが', h('b', null, 'はっきり映っている場面'), 'で止める'),
        h('li', null, h('b', null, 'リング（輪）のあたりをタップ'), '（クリック）する。リングを見つけると、黄色の線で示します'),
        h('li', null, '見つからないときは拡大されるので、', h('b', null, 'リングの左端から右端まで'), 'をドラッグでなぞる')),
      h('p', { class: 'note' }, 'ゴールの裏から撮った映像でも、同じように教えられます（ガラスのボード越しに見えるリングをタップ）。'));
    how.open = S.openHow != null ? S.openHow : false;
    how.querySelector('summary').addEventListener('click', () => { S.openHow = !how.open; });
    card.append(how);
    // カメラの種類（三脚で固定してコート全体を撮った映像は、ゴールを追わずに見張る）
    card.append(h('label', { class: 'switch' },
      h('input', { type: 'checkbox', id: 'optFixed', checked: !!st.fixed, disabled: !!S.running, onchange: (e) => { st.fixed = e.target.checked; save(); render(); drawOverlay(); } }),
      ' 三脚で固定して、コート全体（両方のゴール）を映したまま撮った（360°・広角カメラなど）'));
    // 後半（攻めるゴールが入れ替わる）
    const half = h('details', { class: 'half' },
      h('summary', null, st.halfT != null ? `後半の始まり：${BS.fmtTime(st.halfT)}（ここから攻めるゴールが入れ替わります）` : '1本の動画に、前半と後半の両方が入っているとき'),
      h('p', { class: 'note' }, 'ハーフタイムで攻めるゴールが入れ替わります。後半が始まる場面で映像を止めて、ボタンを押してください。クォーターごとに分けて撮った動画なら、ここは使わず、動画ごとに上の「攻めているのは？」を選びます。'),
      h('div', { class: 'row' },
        h('button', { class: 'btn small', id: 'btnHalf', onclick: () => setHalf(now()) }, st.halfT != null ? 'いまの位置を後半の始まりにする' : 'いまの位置から後半にする'),
        st.halfT != null ? h('button', { class: 'btn small', onclick: () => setHalf(null) }, '取り消す') : null,
        h('span', { class: 'note' }, `いまの位置：${BS.fmtTime(now())}`)));
    half.open = st.halfT != null;
    card.append(half);
    return card;
  }
  function setHalf(t) {
    S.st.halfT = t == null ? null : Math.round(t * 10) / 10;
    save(); render(); drawTimeline();
    BS.ui.toast(t == null ? '後半の設定を取り消しました' : `${BS.fmtTime(t)} から後半にしました（攻めるゴールが入れ替わります）`, 'ok');
  }

  /* ④ 解析 */
  function stepRun() {
    const nMark = S.st.hoops.filter(Boolean).length;
    const card = h('section', { class: 'card step', id: 'stepRun' }, stepHead(4, '得点シーンを探す', null, !!S.st.result && !stale()));
    if (!S.media) { card.append(h('p', { class: 'note' }, '動画を選んで、ゴールを確かめると、ここで探せます。')); return card; }
    if (S.running) {
      card.append(h('b', null, '探しています… '), h('span', { id: 'runLabel', class: 'note' }, ''),
        h('div', { class: 'progress' }, h('i', { id: 'runBar' })),
        h('div', { class: 'note', id: 'runLive' }, ''),
        h('p', { class: 'note' }, '動画を最初から最後まで調べています。終わるまで、このページは開いたままにしてください（ほかのタブを見ていても進みます）。'),
        h('button', { class: 'btn small danger', onclick: cancelRun }, '中止'));
      return card;
    }
    card.append(h('div', { class: 'row' },
      h('button', { class: 'btn primary big', id: 'btnRun', disabled: !nMark || !!S.finding, onclick: () => run() }, S.st.result ? '⚡ もう一度探す' : '⚡ 得点シーンを探す'),
      h('span', { class: 'note' }, nMark ? `目安 ${BS.fmtTime(duration() / 3)}（パソコンの速さで変わります）${nMark === 1 ? '。ゴールが1つだけなので、もう片方のゴールの得点は見つかりません' : ''}` : S.finding ? 'ゴールを探しています。終わるまでお待ちください' : '先に ③ でゴールを教えてください')));
    if (stale()) card.append(h('p', { class: 'note warn' }, '⚠ ゴールの指定を変えました。もう一度探すと、新しい指定で探し直します。'));
    return card;
  }

  /* ⑤ 結果 */
  function resultsCard() {
    const card = h('section', { class: 'card results', id: 'results' });
    const its = list();
    const n = [0, 1].map((tm) => its.filter((it) => it.team === tm).length);
    card.append(h('div', { class: 'tabs2', role: 'tablist' }, [0, 1].map((tm) => h('button', {
      class: 'tab2' + (S.tab === tm ? ' on' : ''), role: 'tab', 'aria-selected': S.tab === tm ? 'true' : 'false', id: 'tab' + tm,
      style: { '--team': teamColor(tm) }, onclick: () => { S.tab = tm; render(); }
    },
    h('span', { class: 'big' }, `${ICON[tm]} ${WHAT[tm]}`),
    h('span', { class: 'cnt' }, h('b', null, String(n[tm])), '本'),
    h('small', null, h('span', { class: 'chip', style: { background: teamColor(tm) } }), `${teamTag(tm)}の得点`)))));
    if (stale()) card.append(h('p', { class: 'note warn' }, '⚠ ゴールの指定を変えました。下の「設定を変える」の ④ で、もう一度探してください。'));

    // 1場面の長さ
    const w = S.st.win;
    const num = (key, max) => h('input', { type: 'number', min: 0, max, step: 0.5, value: w[key], class: 'num', id: 'win' + key,
      onchange: (e) => { const v = Number(e.target.value); if (isFinite(v) && v >= 0 && v <= max) { w[key] = v; save(); } render(); } });
    card.append(h('div', { class: 'winrow' }, '1場面の長さ：入った瞬間の 前 ', num('lead', 20), ' 秒 ＋ 後 ', num('lag', 10), ` 秒（＝ ${+(w.lead + w.lag).toFixed(1)} 秒）`));

    // 一覧
    const cl = clipsFor(S.tab);
    const box = h('div', { class: 'cliplist', id: 'clipList' });
    if (!cl.length) box.append(h('p', { class: 'note empty' }, S.tab === 0 ? `${teamTag(0)}の得点は見つかりませんでした。自分と相手が逆なら、下の「⇄ 入れ替える」を押してください。` : `${teamTag(1)}の得点は見つかりませんでした。`));
    cl.forEach((c) => box.append(clipRow(c)));
    card.append(box);

    // 入っていたかも？：解析で「外れ」と判定したシュート（このチームが打ったもの）。リングで弾んでから入った得点は、ここに入っていることがある
    const mb = C.maybes(S.st.result, setupOf(), S.st.edits, its).filter((m) => m.team === S.tab);
    if (mb.length) {
      const det = h('details', { class: 'maybes', id: 'maybes' },
        h('summary', null, `🤔 入っていたかも？（${teamTag(S.tab)}の「外れ」と判定したシュート ${mb.length}本）`),
        h('p', { class: 'note' }, 'リングに当たって弾んでから入った得点は、ここに入っていることがあります。▶ で確かめて、入っていたら「入っていた」を押すと、上の一覧に入ります。'),
        h('div', { class: 'mblist' }, mb.map(mayRow)));
      det.open = !!S.openMaybe;
      det.querySelector('summary').addEventListener('click', () => { S.openMaybe = !det.open; });
      card.append(det);
    }

    // 続けて再生・動画にする
    const on = cl.filter((c) => c.on);
    const segs = C.reel(cl);
    const secs = segs.reduce((s, c) => s + (c.t1 - c.t0), 0);
    const exp = S.exporting;
    card.append(h('div', { class: 'row acts' },
      h('button', { class: 'btn primary', id: 'btnReel', disabled: !on.length || !!exp, onclick: () => playReel(S.tab) }, `▶ 続けて再生（${on.length}本・${BS.fmtTime(secs)}）`),
      h('button', { class: 'btn good', id: 'btnExport', disabled: !on.length || !!exp, onclick: () => doExport(S.tab) }, '🎬 動画にする'),
      h('label', { class: 'switch' }, h('input', { type: 'checkbox', checked: S.st.captions !== false, onchange: (e) => { S.st.captions = e.target.checked; save(); } }), ' 動画に「入れた 3/12」などの文字を入れる')));
    card.append(exportBox(S.tab));

    // 直す・足す
    const tools = h('div', { class: 'tools' });
    const marked = S.st.hoops.map((m, i) => (m ? i : -1)).filter((i) => i >= 0);
    tools.append(h('div', { class: 'tool' },
      h('div', null, h('b', null, '自分と相手が逆になっていたら'), h('br'),
        h('span', { class: 'note' }, marked.map((i) => `${HOOP[i]} に入った得点 → ${teamTag(S.st.hoopTeam[i])}`).join('、') + (S.st.halfT != null ? `（${BS.fmtTime(S.st.halfT)} から後半：入れ替わる）` : '（動画のはじめ）'))),
      h('button', { class: 'btn small', id: 'btnSwap', onclick: swapTeams }, '⇄ 入れ替える')));
    const sug = C.suggestHalf(S.st.result, duration());
    const sugKey = sug ? sug.from + '-' + sug.to : null;
    if (sug && S.st.halfT == null && S.st.halfNo !== sugKey) {
      tools.append(h('div', { class: 'tool hint', id: 'halfHint' },
        h('div', null, h('b', null, `⏸ ${BS.fmtTime(sug.from)}〜${BS.fmtTime(sug.to)} の間、シュートが1本もありません`), h('br'),
          h('span', { class: 'note' }, 'ハーフタイムなら、そのあとは攻めるゴールが入れ替わります。')),
        h('div', { class: 'row' },
          h('button', { class: 'btn small', onclick: () => { seek(sug.to - 8); play(); } }, '▶ 見てみる'),
          h('button', { class: 'btn small primary', id: 'btnHalfYes', onclick: () => setHalf(sug.at) }, 'ここから後半にする'),
          h('button', { class: 'btn small', onclick: () => { S.st.halfNo = sugKey; save(); render(); } }, 'ちがう'))));
    }
    tools.append(h('div', { class: 'tool' },
      h('div', null, h('b', null, '見つからなかった得点を足す'), h('br'),
        h('span', { class: 'note' }, `映像を、ボールがリングを通った瞬間で止めてから押します（いま ${BS.fmtTime(now())}）`)),
      h('div', { class: 'row' },
        h('button', { class: 'btn small', id: 'btnAdd0', onclick: () => addManual(0) }, `＋ ${WHAT[0]}`),
        h('button', { class: 'btn small', id: 'btnAdd1', onclick: () => addManual(1) }, `＋ ${WHAT[1]}`))));
    const cov = C.coverage(S.st.result, duration(), 2);
    const covText = marked.map((i) => `${HOOP[i]} ${Math.round(cov[i] * 100)}%`).join('・');
    tools.append(h('p', { class: 'note' }, S.st.fixed
      ? `ゴールを見張れた時間：${covText}。リングが人で隠れた一瞬の得点は見つかりません。`
      : `ゴールが画面に映っていた時間：${covText}。映っていない間の得点は見つかりません（足したいときは上の「＋」で）。`));
    if (its.some((it) => it.unsure && it.auto)) tools.append(h('p', { class: 'note' }, '「要確認」の印は、ネットの動きをはっきり確かめられなかった得点です（リングの手前を落ちただけかもしれません）。外れていたら、左のチェックを外すと再生・書き出しに入りません。'));
    card.append(tools);
    return card;
  }
  function clipRow(c) {
    const it = list().find((x) => x.id === c.id) || {};
    const playing = S.reel.active && S.reel.list[S.reel.i] && S.reel.list[S.reel.i].ids.includes(c.id);
    const img = h('img', { class: 'thumb', alt: '', dataset: { thumb: c.id } });
    if (S.thumbs[c.id]) img.src = S.thumbs[c.id];
    const row = h('div', { class: 'clip' + (c.on ? '' : ' off') + (playing ? ' playing' : ''), dataset: { id: c.id }, style: { '--team': teamColor(c.team) } },
      h('input', { type: 'checkbox', checked: c.on, title: '続けて再生・動画にするときに入れる', 'aria-label': `${c.n}番目を入れる`, onchange: (e) => setOn(c.id, e.target.checked), onclick: (e) => e.stopPropagation() }),
      h('span', { class: 'ix' }, String(c.n)),
      img,
      h('div', { class: 'ct' },
        h('b', null, BS.fmtTime(c.at)),
        h('span', { class: 'note' }, [halfLabel(it), it.hoop != null ? HOOP[it.hoop] : ''].filter(Boolean).join('・')),
        h('span', { class: 'tags' },
          c.unsure && c.auto ? h('span', { class: 'tag warn', title: 'ネットの動きを確かめられなかった得点です' }, '要確認') : null,
          !c.auto ? h('span', { class: 'tag' }, '手で足した') : c.promoted ? h('span', { class: 'tag' }, '外れ→入っていた') : c.fixed ? h('span', { class: 'tag' }, '手で直した') : null)),
      h('div', { class: 'cops' },
        h('button', { class: 'btn small', title: 'この場面を見る', onclick: (e) => { e.stopPropagation(); playOne(c); } }, '▶'),
        h('button', { class: 'btn small', title: c.team ? '「入れた」に移す（自分の得点だった）' : '「入れられた」に移す（相手の得点だった）', dataset: { move: c.id }, onclick: (e) => { e.stopPropagation(); moveTeam(c.id); } }, c.team ? '⇄ 入れたへ' : '⇄ 入れられたへ'),
        h('button', { class: 'btn small', title: 'この場面だけを動画にする', disabled: !!S.exporting, onclick: (e) => { e.stopPropagation(); doExport(c.team, c); } }, '⬇'),
        !c.auto ? h('button', { class: 'btn small', title: 'この場面を消す', onclick: (e) => { e.stopPropagation(); removeManual(c.id); } }, '🗑') : null,
        c.promoted ? h('button', { class: 'btn small', title: '「外れ」に戻す（下の「入っていたかも？」に戻ります）', dataset: { unpromote: c.id }, onclick: (e) => { e.stopPropagation(); unpromote(c.id); } }, '↩') : null));
    row.addEventListener('click', () => playOne(c));
    return row;
  }
  function setOn(id, on) {
    const E = S.st.edits;
    if (on) delete E.off[id]; else E.off[id] = true;
    save(); render(); drawTimeline();
  }
  function moveTeam(id) {
    const it = list().find((x) => x.id === id);
    if (!it) return;
    const to = 1 - it.team;
    const E = S.st.edits;
    if (it.auto) {
      const shot = S.st.result.shots.find((s) => C.shotId(s) === id);
      if (shot && C.baseTeam(shot, setupOf()) === to) delete E.fix[id]; else E.fix[id] = to;
    } else {
      const a = E.added.find((x) => x.id === id);
      if (a) a.team = to;
    }
    save(); render(); drawTimeline();
    BS.ui.toast(`${BS.fmtTime(it.t)} の得点を「${WHAT[to]}」に移しました`, 'ok');
  }
  function swapTeams() {
    S.st.hoopTeam = [1 - S.st.hoopTeam[0], 1 - S.st.hoopTeam[1]];
    save(); render(); drawTimeline();
    BS.ui.toast('自分と相手を入れ替えました（手で直した場面はそのまま）', 'ok');
  }
  function addManual(team) {
    if (!S.media) return;
    const t = Math.round(now() * 100) / 100;
    if (list().some((it) => Math.abs(it.t - t) < 1)) { BS.ui.toast('この位置には、もう得点があります', 'warn'); return; }
    const id = 'm' + Date.now().toString(36);
    S.st.edits.added.push({ id, t, team });
    S.tab = team;
    save(); render(); drawTimeline(); makeThumbs();
    BS.ui.toast(`${BS.fmtTime(t)} を「${WHAT[team]}」に足しました`, 'ok');
  }
  function mayRow(m) {
    return h('div', { class: 'mb', dataset: { may: m.id } },
      h('b', null, BS.fmtTime(m.t)),
      h('span', { class: 'note' }, [halfLabel(m), m.hoop != null ? HOOP[m.hoop] : ''].filter(Boolean).join('・')),
      h('span', { class: 'spacer' }),
      h('button', { class: 'btn small', title: 'この場面を見る（入ったかどうかが分かるように、少し長めに）', onclick: () => playMaybe(m) }, '▶'),
      h('button', { class: 'btn small primary', dataset: { promote: m.id }, onclick: () => promote(m.id) }, '入っていた'));
  }
  function playMaybe(m) {
    const w = S.st.win;
    const seg = { id: m.id, at: m.t, team: m.team, n: 0, total: 0, on: true, half: m.half, maybe: true, t0: Math.max(0, m.t - w.lead), t1: Math.min(duration() || Infinity, m.t + w.lag + C.PROMOTE_TAIL) };
    startReel(C.reel([seg]), m.team);
  }
  function promote(id) {
    S.st.edits.promote = S.st.edits.promote || {};
    S.st.edits.promote[id] = true;
    save(); render(); drawTimeline(); makeThumbs();
    const it = list().find((x) => x.id === id);
    if (it) BS.ui.toast(`${BS.fmtTime(it.t)} を「${WHAT[it.team]}」に入れました`, 'ok');
  }
  function unpromote(id) {
    if (S.st.edits.promote) delete S.st.edits.promote[id];
    delete S.st.edits.off[id];
    save(); render(); drawTimeline();
    BS.ui.toast('「外れ」に戻しました', 'ok');
  }
  function removeManual(id) {
    const E = S.st.edits;
    E.added = E.added.filter((a) => a.id !== id);
    delete E.off[id];
    save(); render(); drawTimeline();
  }

  /* ---------- 続けて再生 ---------- */
  function segLabel(seg) { return seg.maybe ? '🤔 入っていたかも？' : `${ICON[seg.team]} ${WHAT[seg.team]} ${seg.n} / ${seg.total}`; }
  function playReel(team) {
    const segs = C.reel(clipsFor(team));
    if (!segs.length) { BS.ui.toast('再生する場面がありません', 'warn'); return; }
    startReel(segs, team);
  }
  function playOne(c) { startReel(C.reel([Object.assign({}, c, { on: true })]), c.team); }
  function startReel(segs, team) {
    if (!S.media || S.exporting) return;
    cancelMarking();
    S.reel = { active: true, list: segs, i: -1, team };
    startSeg(0);
  }
  function startSeg(i) {
    const R = S.reel;
    R.i = i;
    const seg = R.list[i];
    seek(seg.t0, true).then(() => { if (S.reel === R && R.active && R.i === i) play(); });
    updateReelUI();
  }
  function stepReel(d) {
    const R = S.reel;
    if (!R.active) return;
    const j = R.i + d;
    if (j < 0) startSeg(0);
    else if (j >= R.list.length) stopReel();
    else startSeg(j);
  }
  function stopReel(silent) {
    if (!S.reel.active) return;
    S.reel.active = false;
    pause();
    updateReelUI();
    if (!silent) BS.ui.toast('続けて再生を終わりました', 'ok');
  }
  function reelTick(t) {
    const R = S.reel;
    if (!R.active || S.exporting) return;
    const seg = R.list[R.i];
    if (!seg) { stopReel(true); return; }
    if (t >= seg.t1 - 0.03 || (S.media && S.media.el.ended)) {
      if (R.i + 1 < R.list.length) startSeg(R.i + 1);
      else { R.active = false; pause(); updateReelUI(); if (R.list.length > 1) BS.ui.toast(`${WHAT[R.team]}を最後まで再生しました`, 'ok'); }
    }
  }
  function updateReelUI() {
    const R = S.reel;
    const bar = $('#reelBar'), badge = $('#ovBadge');
    if (!R.active) {
      bar.hidden = true; badge.hidden = true;
      document.querySelectorAll('.clip.playing').forEach((r) => r.classList.remove('playing'));
      return;
    }
    const seg = R.list[R.i];
    bar.hidden = false;
    $('#reelLabel').textContent = seg.maybe ? '入っていたかも？' : `${WHAT[R.team]} ${R.i + 1}/${R.list.length}`;
    badge.innerHTML = '';
    badge.style.setProperty('--team', teamColor(seg.team));
    badge.append(h('b', null, segLabel(seg)), h('span', null, `${seg.half ? (seg.half === 2 ? '後半・' : '前半・') : ''}${BS.fmtTime(seg.at)}`));
    badge.hidden = false;
    document.querySelectorAll('.clip').forEach((r) => r.classList.toggle('playing', seg.ids.includes(r.dataset.id)));
  }

  /* ---------- 動画にする ---------- */
  function baseName() { const f = S.media && S.media.file; const n = (f && f.name) || 'game'; return n.replace(/\.[^.]+$/, '').replace(/[\\/:*?"<>|\s]+/g, '_').slice(0, 40); }
  function exportBox(team) {
    const box = h('div', { class: 'exportbox', id: 'exportBox' });
    const sup = BS.exportSupport();
    const exp = S.exporting;
    if (!sup) { box.append(h('p', { class: 'note' }, 'このブラウザは動画の書き出しに対応していません（Chrome・Edge・Safari の新しい版で使えます）。続けて再生は使えます。')); return box; }
    if (exp) {
      box.append(h('b', null, `🎬 ${exp.single ? 'この場面を' : WHAT[exp.team] + 'を'}動画にしています… `), h('span', { id: 'expLabel', class: 'note' }, ''),
        h('div', { class: 'progress' }, h('i', { id: 'expBar' })),
        h('p', { class: 'note' }, '実際の長さの時間がかかります。このタブを表示したままにしてください（別のタブにすると止まります）。'),
        h('button', { class: 'btn small danger', onclick: () => exp.ctrl.abort() }, '中止'));
      return box;
    }
    const r = S.out[team];
    if (r) {
      box.append(h('div', { class: 'row' }, h('b', null, '✅ 動画ができました '),
        h('span', { class: 'note' }, `${r.ext.toUpperCase()}・${(r.blob.size / 1048576).toFixed(1)}MB・約${Math.round(r.seconds)}秒${r.audio ? '' : '・音声なし'}`)),
        h('video', { src: r.url, controls: true, playsinline: true, class: 'outvideo' }),
        h('div', { class: 'row' },
          h('a', { class: 'btn primary', href: r.url, download: r.name, id: 'btnDownload' }, '⬇ 保存する'),
          h('span', { class: 'note' }, r.ext === 'webm' ? 'WebM 形式です。iPhone で見るときは、MP4 に変換が必要なことがあります。' : 'MP4 形式です。スマホ・LINE でも見られます。')));
    } else {
      box.append(h('p', { class: 'note' }, `選んだ場面をつないで、1本の動画（${sup.ext.toUpperCase()}）にします。音声も入ります。できる動画と同じくらいの時間がかかります。`));
    }
    return box;
  }
  async function doExport(team, single) {
    if (S.exporting || !S.media) return;
    stopReel(true);
    cancelMarking();
    const segs = single ? C.reel([Object.assign({}, single, { on: true })]) : C.reel(clipsFor(team));
    if (!segs.length) { BS.ui.toast('動画にする場面がありません', 'warn'); return; }
    const clips = segs.map((seg) => ({ t0: seg.t0, t1: seg.t1, label: segLabel(seg), sub: `${seg.half ? (seg.half === 2 ? '後半・' : '前半・') : ''}${BS.fmtTime(seg.at)}`, color: teamColor(seg.team) }));
    const ctrl = new AbortController();
    S.exporting = { team, ctrl, single: !!single };
    S.out[team] = null;
    render();
    const title = [`${ICON[team]} ${WHAT[team]}ところ`, `${teamTag(0)} vs ${teamTag(1)}`, `${segs.length}シーン`];
    try {
      const res = await BS.exportReel(S.media, clips, {
        title, end: [`${WHAT[team]}ところ ${segs.length}シーン`, `${teamTag(0)} vs ${teamTag(1)}`],
        accent: teamColor(team), captions: S.st.captions !== false, cards: !single
      }, (frac, label) => {
        const bar = $('#expBar'), lab = $('#expLabel');
        if (bar) bar.style.width = (frac * 100).toFixed(1) + '%';
        if (lab) lab.textContent = `${label}（${Math.round(frac * 100)}%）`;
      }, ctrl.signal);
      if (res) {
        res.name = `${baseName()}_${WHAT[team]}${single ? '_' + BS.fmtTime(single.at).replace(/:/g, '-') : '_' + segs.length + '本'}.${res.ext}`;
        S.out[team] = res;
        S.tab = team;
        BS.ui.toast('動画ができました。「⬇ 保存する」で保存できます', 'ok', 5000);
      } else BS.ui.toast('書き出しを中止しました', 'warn');
    } catch (err) {
      console.error('[export]', err);
      BS.ui.toast('書き出しに失敗しました：' + err.message, 'err', 8000);
    }
    S.exporting = null;
    render();
  }

  /* ---------- サムネイル（場面の小さな絵） ---------- */
  /* ゴールの絵：指定したコマの、リングのまわりを拡大して、リングを黄色で描く。src：描く映像（省略時は画面の映像。いまのコマ） */
  function hoopThumb(i, src) {
    const m = S.st.hoops[i];
    if (!m || !S.media) return null;
    const W = S.media.width, H = S.media.height, rw = m.rim.w;
    const x0 = Math.max(0, m.rim.cx - 2.2 * rw), x1 = Math.min(W, m.rim.cx + 2.2 * rw);
    const y0 = Math.max(0, m.rim.cy - 1.6 * rw), y1 = Math.min(H, m.rim.cy + 1.3 * rw);
    const sw = x1 - x0, sh = y1 - y0;
    if (sw < 4 || sh < 4) return null;
    const k = Math.min(220 / sw, 150 / sh);
    const cv = document.createElement('canvas');
    cv.width = Math.round(sw * k * 2); cv.height = Math.round(sh * k * 2);
    cv.style.width = Math.round(sw * k) + 'px'; cv.style.height = Math.round(sh * k) + 'px';
    cv.className = 'hoopthumb';
    const g = cv.getContext('2d');
    try { g.drawImage(src || S.media.el, x0, y0, sw, sh, 0, 0, cv.width, cv.height); } catch (e) { return null; }
    const q = cv.width / sw;
    const cx = (m.rim.cx - x0) * q, cy = (m.rim.cy - y0) * q, a = rw / 2 * q, b = (m.rim.b || rw * 0.14) * q;
    // 黄色の楕円（見やすいよう、黒いふちどり）
    [['rgba(0,0,0,0.65)', 6], ['#fde047', 3]].forEach(([col, lw]) => { g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); g.ellipse(cx, cy, Math.max(2, a), Math.max(2, b), 0, 0, Math.PI * 2); g.stroke(); });
    return cv;
  }
  /* 見えない別の <video>（指定したコマの絵・ゴールの自動検出に使う。再生中の映像を動かさない） */
  function hiddenVideo() {
    const v = document.createElement('video');
    v.muted = true; v.playsInline = true; v.preload = 'auto';
    v.style.cssText = 'position:fixed;left:-10px;top:-10px;width:2px;height:2px;opacity:0;pointer-events:none';
    document.body.appendChild(v);
    const once = (ev, ms) => new Promise((res) => { let done = false; const f = () => { if (done) return; done = true; v.removeEventListener(ev, f); res(); }; v.addEventListener(ev, f); setTimeout(f, ms); });
    return { v, once, close() { v.removeAttribute('src'); v.load(); v.remove(); } };
  }
  /* ゴールの絵を、そのコマへ移って作る（開き直したとき・自動で見つけたとき） */
  async function makeHoopThumbs() {
    if (!S.media) return;
    const media = S.media;
    const todo = [0, 1].filter((i) => S.st.hoops[i] && !S.thumbs['hoop' + i]);
    if (!todo.length) return;
    const hv = hiddenVideo();
    try {
      hv.v.src = media.url;
      await hv.once('loadeddata', 8000);
      for (const i of todo) {
        const m = S.st.hoops[i];
        if (!m || S.media !== media) break;
        hv.v.currentTime = m.t;
        await hv.once('seeked', 4000);
        const cv = hoopThumb(i, hv.v);
        if (cv && S.st.hoops[i] === m) S.thumbs['hoop' + i] = cv;
      }
    } catch (e) { /* 絵がなくても使える */ }
    hv.close();
    if (S.media === media && !S.marking) render();
  }

  /* ---------- ゴールの自動検出（goalfind.js） ----------
     動画全体から間をあけて取り出したコマ（12〜36 コマ）で、リング（オレンジの細い輪）とその下のネットを探し、
     何コマにも同じ見た目で映っているもの2つを、ゴールA・B にする。自分で教えたゴールはそのまま、残りだけ入れ替える */
  async function findGoals() {
    if (!S.media || !S.media.ready || S.finding || S.running || S.exporting || !BS.goalfind) return;
    const media = S.media, key = S.key, st = S.st;
    cancelMarking();
    const keepIdx = [0, 1].filter((i) => st.hoops[i] && st.hoops[i].how !== 'auto');
    if (keepIdx.length >= 2) { BS.ui.toast('ゴールは2つとも、自分で教えたものを使っています', 'warn'); return; }
    const job = S.finding = { cancel: false, i: 0, n: 0 };
    render();
    const hv = hiddenVideo();
    let goals = [], ok = false;
    try {
      hv.v.src = media.url;
      await hv.once('loadeddata', 8000);
      const W = media.width, H = media.height, dur = duration();
      const k = Math.max(1, W / 1280);
      const cw = Math.round(W / k), ch = Math.round(H / k);
      const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
      const g = cv.getContext('2d', { willReadFrequently: true });
      const grab = async (t) => { hv.v.currentTime = t; await hv.once('seeked', 4000); g.drawImage(hv.v, 0, 0, cw, ch); return g.getImageData(0, 0, cw, ch).data; };
      // 自分で教えたゴールの見た目（同じゴールを、もう1つのゴールとして選ばないため）
      const known = [];
      for (const i of keepIdx) { const m = st.hoops[i]; known.push(BS.goalfind.known(await grab(m.t), cw, ch, m.rim, k, m.t)); }
      const n = job.n = BS.clamp(Math.round(dur / 6), 12, 36);
      const all = [];
      for (let j = 0; j < n && !job.cancel; j++) {
        const t = Math.min(Math.max(0, dur - 0.5), (j + 0.5) * dur / n);
        all.push(...BS.goalfind.scanFrame(await grab(t), cw, ch, t));
        job.i = j + 1;
        const bar = $('#findBar'), lab = $('#findLabel');
        if (bar) bar.style.width = (100 * job.i / n).toFixed(0) + '%';
        if (lab) lab.textContent = `${job.i} / ${n}`;
        await yieldNow();
      }
      if (!job.cancel) {
        goals = BS.goalfind.pickGoals(all, k, W, H, known);
        // 追跡に使う枠は、そのコマの、リングのまわりで模様のはっきりした所に
        for (const gm of goals) { await grab(gm.t); gm.box = boxAround(hv.v, gm.rim); }
        ok = true;
      }
    } catch (e) { console.warn('[goals]', e); }
    hv.close();
    if (S.finding === job) S.finding = null;
    if (!ok || job.cancel || S.key !== key || S.media !== media) { render(); return; }
    st.autoTried = true;
    const free = [0, 1].filter((i) => !keepIdx.includes(i));
    free.forEach((i) => { st.hoops[i] = null; delete S.thumbs['hoop' + i]; });
    goals.forEach((gm, j) => { const i = free[j]; if (i != null) st.hoops[i] = { id: i === 0 ? 'A' : 'B', t: +gm.t.toFixed(3), box: gm.box, rim: gm.rim, how: 'auto' }; });
    save();
    render(); drawOverlay();
    makeHoopThumbs();
    const nF = goals.length;
    if (nF >= free.length) BS.ui.toast('ゴールを見つけました。③ の絵で、黄色の線がリングに重なっているか確かめてください', 'ok', 7000);
    else if (nF) BS.ui.toast(`ゴールを ${nF} つ見つけました。もう1つは、③ の「このゴールを教える」で、リングをタップしてください`, 'warn', 8000);
    else BS.ui.toast('ゴールを自動では見つけられませんでした。③ の「このゴールを教える」で、リングをタップしてください', 'warn', 8000);
  }
  function cancelFind() { if (S.finding) S.finding.cancel = true; }

  /* 得点の場面の絵は、見えない別の <video> でその時刻へ移って描く（再生中の映像を動かさない） */
  async function makeThumbs() {
    if (!S.media) return;
    if (S.thumbJob) S.thumbJob.cancel = true;
    const job = { cancel: false };
    S.thumbJob = job;
    const todo = list().filter((it) => !S.thumbs[it.id]);
    if (!todo.length) return;
    const v = document.createElement('video');
    v.muted = true; v.playsInline = true; v.preload = 'auto';
    v.style.cssText = 'position:fixed;left:-10px;top:-10px;width:2px;height:2px;opacity:0;pointer-events:none';
    document.body.appendChild(v);
    const once = (ev, ms) => new Promise((res) => { let done = false; const f = () => { if (done) return; done = true; v.removeEventListener(ev, f); res(); }; v.addEventListener(ev, f); setTimeout(f, ms); });
    try {
      v.src = S.media.url;
      await once('loadeddata', 8000);
      const cv = document.createElement('canvas');
      cv.width = 192; cv.height = 108;
      const g = cv.getContext('2d');
      for (const it of todo) {
        if (job.cancel) break;
        v.currentTime = Math.max(0, it.t - 0.3);
        await once('seeked', 4000);
        if (job.cancel) break;
        const vw = v.videoWidth || 16, vh = v.videoHeight || 9;
        const k = Math.min(cv.width / vw, cv.height / vh);
        g.fillStyle = '#000'; g.fillRect(0, 0, cv.width, cv.height);
        try { g.drawImage(v, (cv.width - vw * k) / 2, (cv.height - vh * k) / 2, vw * k, vh * k); } catch (e) { continue; }
        S.thumbs[it.id] = cv.toDataURL('image/jpeg', 0.72);
        document.querySelectorAll(`img[data-thumb="${it.id}"]`).forEach((img) => { img.src = S.thumbs[it.id]; });
      }
    } catch (e) { /* 絵が作れなくても、ほかは使える */ }
    v.removeAttribute('src'); v.load(); v.remove();
  }

  /* ---------- ゴールを教える（映像の上で、リングをタップ／なぞる） ----------
     タップ：そのまわりからリングを探す（goalfind.js の fitAt）。見つからないときは拡大して、なぞってもらう。
     なぞる：リングの左端から右端までのドラッグ。どちらも、追跡に使う枠はリングから決める（バックボードを囲む必要はない） */
  function setOverlayActive(on) { const cv = $('#overlay'); cv.style.pointerEvents = on ? 'auto' : 'none'; cv.style.cursor = on ? 'crosshair' : 'default'; }
  function startMarking(i) {
    if (!S.media || S.running || S.exporting) return;
    if (S.finding) cancelFind();
    stopReel(true);
    pause();
    S.openSetup = true;
    S.marking = { i, step: 0, drag: null, view: null };
    setOverlayActive(true);
    render(); drawOverlay();
    const mc = document.querySelector('.markcard');
    if (mc && mc.scrollIntoView) mc.scrollIntoView({ block: 'nearest' });
  }
  function cancelMarking() {
    if (!S.marking) return;
    S.marking = null; setOverlayActive(false);
    render(); drawOverlay();
  }
  /* 映像の画素 ⇄ 画面上の位置。ふだんは映像全体（黒帯つき）、拡大しているときは mk.view の範囲を画面いっぱいに */
  function mapping(r) {
    const W = S.media.width, H = S.media.height;
    const mk = S.marking;
    if (mk && mk.view) return { s: r.width / mk.view.w, ox: 0, oy: 0, vx: mk.view.x, vy: mk.view.y };
    const s = Math.min(r.width / W, r.height / H);
    return { s, ox: (r.width - W * s) / 2, oy: (r.height - H * s) / 2, vx: 0, vy: 0 };
  }
  function toSrc(ev) {
    const r = $('#overlay').getBoundingClientRect();
    const m = mapping(r);
    return { x: BS.clamp(m.vx + (ev.clientX - r.left - m.ox) / m.s, 0, S.media.width), y: BS.clamp(m.vy + (ev.clientY - r.top - m.oy) / m.s, 0, S.media.height) };
  }
  /* 映像の画素 → ブラウザの画面座標（テストから、いまの表示での位置を知るため） */
  function toScreen(x, y) {
    const r = $('#overlay').getBoundingClientRect();
    const m = mapping(r);
    return { x: r.left + m.ox + (x - m.vx) * m.s, y: r.top + m.oy + (y - m.vy) * m.s };
  }
  /* 指定した所のまわりを、映像の横幅の 1/7 ほどの範囲で拡大して見せる（リングの上の板が見切れないよう、少し上を中心に） */
  function viewAround(pt) {
    const r = $('#overlay').getBoundingClientRect();
    const W = S.media.width, H = S.media.height;
    const vw = Math.min(W, Math.max(200, W / 7));
    const vh = Math.min(H, vw * r.height / r.width);
    return { x: BS.clamp(pt.x - vw / 2, 0, Math.max(0, W - vw)), y: BS.clamp(pt.y - vh * 0.55, 0, Math.max(0, H - vh)), w: vw, h: vh };
  }
  /* タップした所（映像の画素）のまわりのリング。大きな動画でも細かい画素のまま、まわりだけを切り出して調べる。見つからなければ null */
  function fitAtTap(p) {
    if (!BS.goalfind) return null;
    const W = S.media.width, H = S.media.height;
    const half = Math.min(Math.max(W, H) / 2, Math.max(160, W * 0.16));
    const x0 = Math.max(0, Math.round(p.x - half)), y0 = Math.max(0, Math.round(p.y - half));
    const x1 = Math.min(W, Math.round(p.x + half)), y1 = Math.min(H, Math.round(p.y + half));
    const sw = x1 - x0, sh = y1 - y0;
    if (sw < 32 || sh < 32) return null;
    const k = Math.min(1, 900 / Math.max(sw, sh));
    const cw = Math.round(sw * k), ch = Math.round(sh * k);
    const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
    const g = cv.getContext('2d', { willReadFrequently: true });
    try { g.drawImage(S.media.el, x0, y0, sw, sh, 0, 0, cw, ch); } catch (e) { return null; }
    const c = BS.goalfind.fitAt(g.getImageData(0, 0, cw, ch).data, cw, ch, (p.x - x0) * k, (p.y - y0) * k, { radius: Math.max(80, 0.3 * Math.min(cw, ch)) });
    if (!c) return null;
    return { cx: x0 + c.cx / k, cy: y0 + c.cy / k, w: 2 * c.a / k, b: +(c.b / k).toFixed(1) };
  }
  /* 追跡に使う枠：src（canvas に描けるもの。いまのコマ）の、リングのまわりで縦と横の模様がはっきりした所（goalfind.boardBox） */
  function boxAround(src, rim) {
    const W = S.media.width, H = S.media.height;
    const k = Math.max(1, W / 1280), cw = Math.round(W / k), ch = Math.round(H / k);
    const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
    const g = cv.getContext('2d', { willReadFrequently: true });
    try { g.drawImage(src, 0, 0, cw, ch); } catch (e) { return BS.goalfind.boxFromRim(rim, W, H); }
    const gray = BS.vision.toGray(g.getImageData(0, 0, cw, ch).data, cw, ch, 'rgba');
    const b = BS.goalfind.boardBox(gray, cw, ch, { cx: rim.cx / k, cy: rim.cy / k, w: rim.w / k });
    return { x: b.x * k, y: b.y * k, w: b.w * k, h: b.h * k };
  }
  /* ゴール i を、いまのコマのリング rim（映像の画素）で指定する。how: 'tap' | 'trace' */
  function setGoal(i, rim, how) {
    const W = S.media.width, H = S.media.height;
    S.st.hoops[i] = { id: i === 0 ? 'A' : 'B', t: Math.round(now() * 1000) / 1000, box: S.boxMode === 'rim' ? BS.goalfind.boxFromRim(rim, W, H) : boxAround(S.media.el, rim), rim, how };      // S.boxMode：比べるとき用
    save();
    S.marking = null; setOverlayActive(false);
    S.thumbs['hoop' + i] = hoopThumb(i);
    const both = S.st.hoops.filter(Boolean).length >= 2;
    if (S.st.fixed ? rim.w < 14 : rim.w / W < 0.0125) BS.ui.toast(`${HOOP[i]} を指定しました。ただしリングが小さく映っています。もっと大きく映っている場面があれば、そこで指定し直すと見つけやすくなります`, 'warn', 8000);
    else BS.ui.toast(`${HOOP[i]} を指定しました（黄色の線がリング）${both ? '。④ の「得点シーンを探す」を押してください' : '。もう1つのゴールも、映っている場面で同じように'}`, 'ok', 5000);
    render(); drawOverlay();
  }
  function onDown(ev) { if (!S.marking) return; ev.preventDefault(); const p = toSrc(ev); S.marking.drag = { a: p, b: p }; $('#overlay').setPointerCapture(ev.pointerId); drawOverlay(); }
  function onMove(ev) { if (!S.marking || !S.marking.drag) return; S.marking.drag.b = toSrc(ev); drawOverlay(); }
  function onUp(ev) {
    const mk = S.marking;
    if (!mk || !mk.drag) return;
    mk.drag.b = toSrc(ev);
    const { a, b } = mk.drag;
    mk.drag = null;
    const mp = mapping($('#overlay').getBoundingClientRect());
    if (Math.hypot(a.x - b.x, a.y - b.y) * mp.s < 8) {
      // タップ：そのまわりからリングを探す
      const rim = fitAtTap(b);
      if (rim) { setGoal(mk.i, rim, 'tap'); return; }
      if (!mk.view) { mk.view = viewAround(b); mk.step = 1; render(); }
      BS.ui.toast('ここではリングを見つけられませんでした。リングの左端から右端まで、ドラッグでなぞってください', 'warn', 6000);
      drawOverlay();
      return;
    }
    // なぞった：リングの左端から右端
    const w = Math.hypot(a.x - b.x, a.y - b.y);
    const rim = { cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, w };
    // 小さく映っているリングを拡大せずになぞると、ずれやすい。拡大して、もう一度なぞってもらう
    if (!mk.view && w * mp.s < 36) {
      mk.view = viewAround({ x: rim.cx, y: rim.cy }); mk.step = 1;
      BS.ui.toast('リングが小さいので拡大しました。もう一度、リングの左端から右端までなぞってください', 'warn', 5000);
      render(); drawOverlay();
      return;
    }
    setGoal(mk.i, rim, 'trace');
  }
  function drawOverlay() {
    const cv = $('#overlay');
    if (!cv) return;
    const r = cv.getBoundingClientRect();
    const dpr = root.devicePixelRatio || 1;
    if (cv.width !== Math.round(r.width * dpr) || cv.height !== Math.round(r.height * dpr)) { cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr); }
    const g = cv.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, r.width, r.height);
    if (!S.media || !S.media.ready) return;
    const W = S.media.width, H = S.media.height;
    const mp = mapping(r);
    const sc = mp.s, ox = mp.ox - mp.vx * mp.s, oy = mp.oy - mp.vy * mp.s;
    const X = (x) => ox + x * sc, Y = (y) => oy + y * sc;
    const rect = (b, col, lab) => { g.strokeStyle = col; g.lineWidth = 2; g.strokeRect(X(b.x), Y(b.y), b.w * sc, b.h * sc); if (lab) { g.fillStyle = col; g.font = 'bold 12px sans-serif'; g.fillText(lab, X(b.x) + 3, Y(b.y) - 4); } };
    const rimLine = (rm, col) => { g.strokeStyle = col; g.lineWidth = 3; g.beginPath(); g.moveTo(X(rm.cx - rm.w / 2), Y(rm.cy)); g.lineTo(X(rm.cx + rm.w / 2), Y(rm.cy)); g.stroke(); };
    const mk = S.marking;
    if (mk) {
      if (mk.view) {
        g.fillStyle = '#000'; g.fillRect(0, 0, r.width, r.height);
        try { g.drawImage(S.media.el, mk.view.x, mk.view.y, mk.view.w, mk.view.h, 0, 0, r.width, r.height); } catch (e) { /* まだ描けるコマがない */ }
      } else { g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, 0, r.width, r.height); }
      if (mk.drag) {
        const { a, b } = mk.drag;
        g.strokeStyle = '#fbbf24'; g.lineWidth = 3; g.beginPath(); g.moveTo(X(a.x), Y(a.y)); g.lineTo(X(b.x), Y(b.y)); g.stroke();
      }
      g.fillStyle = 'rgba(0,0,0,0.66)'; g.fillRect(0, 0, r.width, 28);
      g.fillStyle = '#fde047'; g.font = 'bold 13.5px sans-serif';
      g.fillText(mk.view ? `${HOOP[mk.i]}：🔍 拡大中　リング（輪）の左端 → 右端 を、ドラッグでなぞる` : `${HOOP[mk.i]}：リング（輪）のあたりをタップ（または、左端 → 右端 をなぞる）`, 10, 19);
      return;
    }
    if (S.live) {
      if (S.live.preview) { g.fillStyle = '#000'; g.fillRect(0, 0, r.width, r.height); try { g.drawImage(S.live.preview, X(0), Y(0), W * sc, H * sc); } catch (e) { /* 閉じた絵 */ } }
      const idx = (S.running && S.running.idx) || [0, 1];
      S.live.status.forEach((s, i) => {
        if (!s.tracked) return;
        const hi = idx[i] != null ? idx[i] : i;
        rect(s.box, HOOP_COL[hi], HOOP[hi]);
        rimLine(s.rim, '#fde047');
        (s.balls || []).forEach((c) => { g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.arc(X(s.rim.cx + c.x * s.rim.w), Y(s.rim.cy + c.y * s.rim.w), 0.3 * s.rim.w * sc, 0, Math.PI * 2); g.stroke(); });
      });
      return;
    }
    // 指定ずみのゴール（指定したコマにいるとき、または全景カメラのときに表示。設定を開いているときだけ）
    const setupVisible = !S.st.result || S.openSetup;
    if (setupVisible) S.st.hoops.forEach((m, i) => {
      if (!m || !(S.st.fixed || Math.abs(now() - m.t) < 0.2)) return;
      g.strokeStyle = '#fde047'; g.lineWidth = 3; g.beginPath(); g.ellipse(X(m.rim.cx), Y(m.rim.cy), Math.max(2, m.rim.w / 2 * sc), Math.max(2, (m.rim.b || m.rim.w * 0.14) * sc), 0, 0, Math.PI * 2); g.stroke();
      g.fillStyle = HOOP_COL[i]; g.font = 'bold 12px sans-serif'; g.fillText(HOOP[i], X(m.rim.cx - m.rim.w / 2), Y(m.rim.cy) - Math.max(6, (m.rim.b || m.rim.w * 0.14) * sc) - 4);
    });
  }

  /* ---------- 解析（できれば Worker で、だめなら画面側で同じコードを動かす） ---------- */
  function yieldNow() {       // setTimeout はタブが裏に回ると遅くなるので MessageChannel で一息つく
    return new Promise((r) => { const ch = new MessageChannel(); ch.port1.onmessage = () => r(); ch.port2.postMessage(0); });
  }
  async function openEngine(cfgA, onEvent) {
    const make = (useWorker) => {
      let worker = null, core = null, seq = 0, dead = null, source = null;
      const pend = new Map();
      /* Worker が「ファイルのここを読んで」と頼んできたとき（Worker の中からは読めない環境）に、画面側で読んで渡す */
      const serveRead = (m) => {
        const reply = (o, tr) => { const msg = Object.assign({ cmd: 'data', rid: m.rid }, o); if (worker) worker.postMessage(msg, tr || []); else core.handle(msg, receive); };
        if (!source || typeof source.slice !== 'function') { reply({ error: 'ファイルがありません' }); return; }
        source.slice(m.a, m.b).arrayBuffer().then((buf) => reply({ buf }, [buf]), (err) => reply({ error: String((err && err.message) || err) }));
      };
      const receive = (m) => {
        if (m.ev === 'read') { serveRead(m); return; }
        if (m.ev) { onEvent(m); return; }
        const p = pend.get(m.id);
        if (!p) return;
        pend.delete(m.id);
        if (m.ok) p.resolve(m); else p.reject(Object.assign(new Error(m.error), { code: m.code }));
      };
      if (useWorker) {
        const code = ['vision', 'auto', 'mp4', 'autoEngine'].map((k) => '(' + BS.src[k].toString() + ')(self);').join('\n') + '\nBS.autoEngine.serve(self);';
        const url = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
        worker = new Worker(url);
        worker.onmessage = (e) => receive(e.data);
        worker.onerror = (e) => { dead = new Error(e.message || 'Worker error'); pend.forEach((p) => p.reject(dead)); pend.clear(); };
      } else {
        core = BS.autoEngine.create({
          makeCanvas: (w, hh) => { const c = document.createElement('canvas'); c.width = w; c.height = hh; return c; },
          transferable: false, preview: (c) => c
        });
      }
      return {
        kind: useWorker ? 'worker' : 'local',
        call(cmd, payload, transfer) {
          return new Promise((resolve, reject) => {
            if (dead) { reject(dead); return; }
            const m = Object.assign({ id: ++seq, cmd }, payload || {});
            if (payload && payload.file) source = payload.file;
            pend.set(m.id, { resolve, reject });
            if (worker) worker.postMessage(m, transfer || []); else core.handle(m, receive);
          });
        },
        cancel() { if (worker) worker.postMessage({ cmd: 'cancel' }); else core.cancel(); },
        close() { if (worker) worker.terminate(); }
      };
    };
    if (typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined') {
      let eng = null;
      try { eng = make(true); await eng.call('init', { cfg: cfgA }); return eng; }
      catch (err) { console.warn('[auto] Worker を使えないので画面側で解析します', err); if (eng) eng.close(); }
    }
    const eng = make(false);
    await eng.call('init', { cfg: cfgA });
    return eng;
  }

  /* WebCodecs で直接読めない動画：<video> を等速で再生しながら、表示されたコマを送る。
     表示されているコマしか取れないので、このタブを表示している間だけ進む（裏に回ると一時停止）。 */
  async function runVideoPlayback(eng, media, marks, st, onLive) {
    const v = media.el;
    if (!v.requestVideoFrameCallback) throw new Error('このブラウザは、この動画形式の解析に対応していません');
    const prevRate = v.playbackRate, prevMuted = v.muted;
    for (let k = 0; k < marks.length; k++) {
      await media.seek(marks[k].t);
      await new Promise((r) => setTimeout(r, 250));
      const bm = await createImageBitmap(v);
      await eng.call('tpl', { i: k, image: bm }, eng.kind === 'worker' ? [bm] : []);
    }
    await media.seek(0);
    v.muted = true; v.playbackRate = 1;      // 等速。2倍速だと表示の間に合わないコマが出て、調べる間隔が不ぞろいになる（判定は約15コマ/秒で合わせてある）
    const dur = media.duration, MIN_STEP = BS.autoEngine.MIN_STEP;
    let inflight = 0, lastT = -1, frames = 0, gaps = 0, holdQueue = false, holdHidden = false, lastPrev = 0, failed = null;
    const resume = () => { if (!holdQueue && !holdHidden && !st.cancel) v.play().catch(() => {}); };
    await new Promise((resolve) => {
      let over = false;
      const onVis = () => { if (document.hidden) { holdHidden = true; v.pause(); } else if (holdHidden) { holdHidden = false; resume(); } };
      const end = () => { if (over) return; over = true; v.removeEventListener('ended', end); document.removeEventListener('visibilitychange', onVis); resolve(); };
      v.addEventListener('ended', end);
      document.addEventListener('visibilitychange', onVis);
      const onFrame = (nowMs, meta) => {
        if (over) return;
        if (st.cancel || failed) { v.pause(); end(); return; }
        const t = meta.mediaTime;
        if (t - lastT >= MIN_STEP) {
          if (lastT >= 0 && t - lastT > 0.11) gaps++;
          lastT = t; frames++; inflight++;
          const preview = nowMs - lastPrev > 200;
          if (preview) lastPrev = nowMs;
          createImageBitmap(v)
            .then((bm) => eng.call('frame', { t, image: bm, preview }, eng.kind === 'worker' ? [bm] : []))
            .then((r) => { inflight--; onLive(t, r.live); if (holdQueue && inflight <= 2) { holdQueue = false; resume(); } })
            .catch((err) => { inflight--; failed = err; });
          if (inflight > 6 && !holdQueue) { holdQueue = true; v.pause(); }
        }
        if (t >= dur - 0.15) { end(); return; }
        v.requestVideoFrameCallback(onFrame);
      };
      v.requestVideoFrameCallback(onFrame);
      if (document.hidden) holdHidden = true; else v.play().catch(() => end());
    });
    v.pause();
    while (inflight > 0) await yieldNow();
    v.playbackRate = prevRate; v.muted = prevMuted;
    if (failed) throw failed;
    const res = (await eng.call('finish')).result;
    res.mode = 'playback'; res.gaps = gaps; res.pushed = frames;
    return res;
  }

  async function run(opts) {
    if (S.running || !S.media || S.finding) return;
    opts = opts || {};
    const st0 = S.st;
    const marks = st0.hoops.filter(Boolean);
    if (!marks.length) return;
    const media = S.media;
    stopReel(true);
    cancelMarking();
    media.pause();
    const idx = st0.hoops.map((m, i) => (m ? i : -1)).filter((i) => i >= 0);
    const st = S.running = { cancel: false, n: [0, 0], t: 0, eng: null, idx };
    render();
    const dur = opts.t1 != null ? Math.min(opts.t1, duration()) : duration();
    const t0w = performance.now();
    const onLive = (t, live, preview) => {
      st.t = t;
      for (const e of live.events) if (e.made) st.n[C.baseTeam({ hoop: idx[e.hoop], t: e.t }, setupOf())]++;
      const old = S.live && S.live.preview;
      const pv = preview || live.preview || null;
      if (pv && old && old !== pv && typeof old.close === 'function') old.close();
      S.live = { status: live.status, preview: pv || old || null };
      const bar = $('#runBar'), lab = $('#runLabel'), lv = $('#runLive');
      const sec = Math.max(0.5, (performance.now() - t0w) / 1000);
      if (bar) bar.style.width = (BS.clamp(t / dur, 0, 1) * 100).toFixed(1) + '%';
      if (lab) lab.textContent = `${BS.fmtTime(t)} / ${BS.fmtTime(dur)}（${(t / sec).toFixed(1)}倍速）`;
      if (lv) lv.textContent = `見つけた得点：${WHAT[0]} ${st.n[0]}・${WHAT[1]} ${st.n[1]}`;
      drawOverlay();
    };
    let eng = null, res = null;
    try {
      // S.debug：検証用（コマごとのボール候補の記録を S.lastLog に残す。tests/rim-check.cjs が使う）
      const cfgA = { srcW: media.width, srcH: media.height, fixed: !!st0.fixed, hoops: marks.map((m) => ({ id: m.id, box: m.box, rim: m.rim })), debug: !!S.debug, rimOcclusion: S.rimOcclusion, fastScale: S.fastScale };
      eng = st.eng = await openEngine(cfgA,
        (m) => { if (m.ev === 'progress') onLive(m.t, m.live, m.preview); else if (m.ev === 'info') st.info = m; });
      try {
        st.mode = 'decode';
        const src = typeof media.file === 'string' ? { url: new URL(media.file, root.location.href).href } : { file: media.file };
        res = (await eng.call('decode', Object.assign({ marks: marks.map((m, i) => ({ i, t: m.t })), t0: 0, t1: opts.t1, debug: !!S.debug }, src))).result;
      } catch (err) {
        if (err.code !== 'unsupported') throw err;
        console.warn('[auto] ファイルを直接読めないので、再生しながら解析します：', err.message);
        BS.ui.toast('この動画形式は直接読めないので、再生しながら探します（動画と同じ長さの時間がかかります。このタブを表示したままにしてください）', 'warn', 9000);
        st.mode = 'playback';
        // 再生しながら調べるときは、コマの間隔が不ぞろい（飛ぶ）ので、ゴールの大きさの追従は、もとの動き（2コマに1回・1段ずつ）にする
        // （毎コマ・2段まで動かすと、飛んだコマの間に大きさがずれて、別の所に張り付くことがあった）
        await eng.call('init', { cfg: Object.assign({}, cfgA, { fastScale: S.fastScale != null ? S.fastScale : false }) });
        res = await runVideoPlayback(eng, media, marks, st, onLive);
      }
      if (st.cancel) throw Object.assign(new Error('中止しました'), { code: 'cancelled' });
      if (res.log) { S.lastLog = { idx, log: res.log }; delete res.log; }
      apply(res, idx, dur, st.mode, (performance.now() - t0w) / 1000);
    } catch (err) {
      if (err.code === 'cancelled' || st.cancel) BS.ui.toast('探すのを中止しました', 'warn');
      else { console.error('[auto]', err); BS.ui.toast('うまく探せませんでした：' + err.message, 'err', 9000); }
    }
    if (eng) eng.close();
    if (S.live && S.live.preview && typeof S.live.preview.close === 'function') S.live.preview.close();
    S.running = null; S.live = null;
    render(); drawOverlay(); drawTimeline();
    return res;
  }
  function cancelRun() { const st = S.running; if (!st) return; st.cancel = true; if (st.eng) st.eng.cancel(); }
  function apply(res, idx, until, mode, wall) {
    const mapMask = (m) => { let o = 0; idx.forEach((hi, i) => { if (m & (1 << i)) o |= 1 << hi; }); return o; };
    const result = {
      shots: res.shots.map((s) => ({ t: +s.t.toFixed(2), hoop: idx[s.hoop], made: !!s.made, sure: s.sure !== false, conf: s.conf })),
      spans: (res.spans || []).filter((sp) => sp[2]).map((sp) => [+sp[0].toFixed(1), +sp[1].toFixed(1), mapMask(sp[2])]),
      mode, frames: res.frames, wall: Math.round(wall), dur: +duration().toFixed(1), until: +until.toFixed(1), marks: marksKey(), at: Date.now()
    };
    if (S.st.result) S.st.edits = C.carryEdits(S.st.result, result, S.st.edits);
    S.st.result = result;
    S.thumbs = Object.fromEntries(Object.entries(S.thumbs).filter(([k]) => k.startsWith('hoop')));
    S.out = [null, null]; S.tab = 0; S.openSetup = false;
    save();
    const its = list();
    const n0 = its.filter((it) => it.team === 0).length, n1 = its.length - n0;
    BS.ui.toast(`見つかりました：${WHAT[0]} ${n0}本・${WHAT[1]} ${n1}本`, 'ok', 6000);
    makeThumbs();
  }

  /* ---------- タイムライン（映像の下のバー。得点の位置に印） ---------- */
  function drawTimeline() {
    const cv = $('#timeline');
    if (!cv) return;
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
    // 後半
    if (S.st.halfT != null) {
      const x = X(S.st.halfT);
      g.strokeStyle = 'rgba(255,255,255,0.45)'; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(x, 0); g.lineTo(x, Hh); g.stroke(); g.setLineDash([]);
      g.fillStyle = '#cbd5e1'; g.font = 'bold 10px sans-serif'; g.fillText('後半', Math.min(x + 3, w - 26), 10);
    }
    // 得点（上の段：入れた、下の段：入れられた）
    if (S.st.result) {
      list().forEach((it) => {
        const x = X(it.t), y = it.team ? 22 : 6;
        g.globalAlpha = it.on ? 1 : 0.3;
        g.fillStyle = teamColor(it.team); g.fillRect(x - 2, y, 4, 12);
        g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 1; g.strokeRect(x - 2, y, 4, 12);
        g.globalAlpha = 1;
      });
    }
    // 再生位置
    const x = X(now());
    g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, Hh); g.stroke();
  }
  function initTimeline() {
    const cv = $('#timeline');
    let dragging = false;
    const toT = (ev) => { const r = cv.getBoundingClientRect(); return BS.clamp((ev.clientX - r.left) / r.width, 0, 1) * duration(); };
    cv.addEventListener('pointerdown', (ev) => { if (!S.media || S.running || S.exporting) return; dragging = true; cv.setPointerCapture(ev.pointerId); seek(toT(ev)); });
    cv.addEventListener('pointermove', (ev) => { if (dragging) seek(toT(ev)); });
    cv.addEventListener('pointerup', () => { dragging = false; });
  }

  /* ---------- 使い方 ---------- */
  function help() {
    BS.ui.modal({
      title: '使い方', body: h('div', { class: 'help' },
        h('ol', null,
          h('li', null, h('b', null, '試合の動画を選ぶ'), '（MP4・MOV。ドラッグ＆ドロップでも）'),
          h('li', null, h('b', null, 'どっちの色が自分のチームか'), 'を選ぶ（相手の色も）'),
          h('li', null, h('b', null, 'ゴールを教える'), '：ゴールが大きく映っている場面で止めて、板を囲む → リングをなぞる。2つとも。', h('br'), '「動画のはじめに、このゴールを攻めているのは？」で、自分か相手かを選ぶ'),
          h('li', null, h('b', null, '「得点シーンを探す」'), '：ボールがリングを通った場面を、動画の最初から最後まで探します'),
          h('li', null, h('b', null, '🏀 入れた／🛡 入れられた'), 'を切り替えて、▶ で1本ずつ、「▶ 続けて再生」でまとめて見る。「🎬 動画にする」で1本の動画に')),
        h('h4', null, 'どちらのチームの得点か'),
        h('p', null, 'ボールが入った「ゴール」で決めます。前半・後半それぞれ、チームが攻めるゴールは決まっているからです。1本の動画に後半も入っているときは、後半の始まりを教えてください（解析のあとに、ハーフタイムらしい場面を教えてくれることもあります）。逆になっていたら「⇄ 入れ替える」、1本だけ違うなら、その場面の「⇄」で直せます。'),
        h('h4', null, '見つからなかった得点があるとき'),
        h('p', null, 'リングに当たって弾んでから入った得点は、「外れ」と判定されることがあります。一覧の下の「🤔 入っていたかも？」を開いて ▶ で確かめ、入っていたら「入っていた」を押してください。そこにもないときは、ボールが入った瞬間で止めて「＋」で足せます。'),
        h('h4', null, 'うまく見つけるための撮り方'),
        h('ul', null,
          h('li', null, 'ゴール（リングとネット）が画面に入るように撮る。シュートの瞬間にゴールが映っていないと見つけられません'),
          h('li', null, '高い位置から、少し引きぎみに。横 1280 画素（720p）以上の画質で'),
          h('li', null, 'オレンジ〜茶色のボールを想定しています')),
        h('h4', null, 'できないこと'),
        h('ul', null,
          h('li', null, '審判の判定（笛で取り消された得点など）は分かりません。外れていたら、チェックを外してください'),
          h('li', null, '2点・3点・フリースローの区別はしません（どれも「入れた／入れられた」の1場面になります）')),
        h('p', { class: 'note' }, '🔒 動画はこの端末の中だけで扱い、どこにも送りません。チームの色・ゴールの指定・結果は、このブラウザに保存されます（同じ動画を開き直すと続きから）。得点の検出には「バスケ分析スタジオ」と同じしくみを使っています。')),
      buttons: [{ label: '閉じる', cls: 'primary' }]
    });
  }

  /* ---------- キー操作 ---------- */
  function onKey(e) {
    if (BS.ui.modalOpen()) { if (e.code === 'Escape') BS.ui.closeModal(); return; }
    const tag = (e.target && e.target.tagName) || '';
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(tag) && e.target.type !== 'checkbox') return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.code === 'Escape') { if (S.marking) cancelMarking(); else if (S.reel.active) stopReel(); return; }
    if (!S.media) return;
    if (e.code === 'Space') { e.preventDefault(); toggle(); }
    else if (e.code === 'ArrowLeft') { e.preventDefault(); seek(now() - (e.shiftKey ? 10 : 2)); }
    else if (e.code === 'ArrowRight') { e.preventDefault(); seek(now() + (e.shiftKey ? 10 : 2)); }
    else if (e.code === 'Comma') seek(now() - 1 / 30);
    else if (e.code === 'Period') seek(now() + 1 / 30);
  }

  /* ---------- 起動 ---------- */
  function init() {
    const ov = $('#overlay');
    ov.addEventListener('pointerdown', onDown);
    ov.addEventListener('pointermove', onMove);
    ov.addEventListener('pointerup', onUp);
    $('#btnOpen').addEventListener('click', pickFile);
    $('#btnHelp').addEventListener('click', help);
    $('#fileVideo').addEventListener('change', (e) => { const f = e.target.files && e.target.files[0]; if (f) openFile(f); });
    $('#btnPlay').addEventListener('click', toggle);
    $('#btnBack').addEventListener('click', () => seek(now() - 5));
    $('#btnFwd').addEventListener('click', () => seek(now() + 5));
    $('#btnPrevF').addEventListener('click', () => seek(now() - 1 / 30));
    $('#btnNextF').addEventListener('click', () => seek(now() + 1 / 30));
    $('#speedSel').addEventListener('change', (e) => { if (S.media) S.media.rate = Number(e.target.value); });
    $('#reelPrev').addEventListener('click', () => stepReel(-1));
    $('#reelStop').addEventListener('click', () => stopReel());
    $('#reelNext').addEventListener('click', () => stepReel(1));
    initTimeline();
    document.addEventListener('keydown', onKey);
    // ドラッグ＆ドロップ
    let depth = 0;
    const drop = $('#ovDrop');
    root.addEventListener('dragenter', (e) => { if (e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files')) { depth++; drop.hidden = false; } });
    root.addEventListener('dragleave', () => { depth = Math.max(0, depth - 1); if (!depth) drop.hidden = true; });
    root.addEventListener('dragover', (e) => { e.preventDefault(); });
    root.addEventListener('drop', (e) => {
      e.preventDefault(); depth = 0; drop.hidden = true;
      const f = e.dataTransfer && Array.from(e.dataTransfer.files || []).find((x) => /^video\//.test(x.type) || /\.(mp4|mov|m4v|webm|mkv)$/i.test(x.name));
      if (f) openFile(f); else BS.ui.toast('動画ファイル（MP4・MOV など）をドロップしてください', 'err');
    });
    root.addEventListener('resize', () => { drawOverlay(); drawTimeline(); });
    root.addEventListener('beforeunload', (e) => { if (S.running || S.exporting) { e.preventDefault(); e.returnValue = ''; } });
    render(); drawTimeline();
  }

  BS.app = { S, init, openFile, run, cancelRun, render, toScreen, startMarking, cancelMarking, findGoals, cancelFind, list, clipsFor, maybes: () => C.maybes(S.st.result, setupOf(), S.st.edits, list()), promote, unpromote, playReel, stopReel, doExport, swapTeams, setHalf, addManual, moveTeam, seek, duration, makeThumbs };
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  }
})(typeof window !== 'undefined' ? window : globalThis);
