/* minibasket/js/app.js — 画面
   流れ：①写真を入れる → ②読み取り結果を確認・修正 → ③分析（この試合／通算）
   写真は端末のメモリの上だけで扱い、保存するのは確認ずみの試合データ（背番号・得点・ファウル・出場）だけ。 */
(function () {
  'use strict';
  const MB = window.MB;
  const { esc, sgn } = MB;
  const Q = MB.QLABEL;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => [...(el || document).querySelectorAll(s)];
  const CFG = Object.assign({ myKeyword: '' }, window.MB_CONFIG || {});

  // ════════ 状態 ════════════════════════════════════════════════════
  const S = {
    step: 'input',          // 'input' | 'review' | 'report'
    settings: { myKeyword: CFG.myKeyword, noNames: false },
    provider: { kind: 'checking' },   // claude | manual
    store: { where: 'memory', dbBlocked: false },   // 保存先（MB.storeInfo）
    items: [],              // 写真 {id,file,url,status,msg,err,rect,tiles,tileUrls,gameId}
    games: [],              // 試合 {id,raw,confirmed,src,photoId}
    sel: null,              // 確認中の試合 id
    tab: 'total',           // 分析のタブ：'total' か 試合 id
    demo: false,
    queue: [], running: false,
    delArm: null,           // 削除の確認待ちの試合 id
    manualText: '',
  };
  let seq = 0;
  const nid = p => p + (++seq);
  const game = id => S.games.find(g => g.id === id);
  const cur = () => game(S.sel);
  const norm = g => MB.normalizeGame(g.raw);

  // ════════ 小さな道具 ═══════════════════════════════════════════════
  let toastTimer;
  function toast(msg) {
    let t = $('.toast'); if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, Math.min(8000, 2400 + msg.length * 110));
  }
  const abbr = n => { const s = String(n || '').replace(/男子|(ミニ)?バスケット(ボール)?(クラブ|スポーツ少年団|チーム)?/g, '').trim(); return s || n || '?'; };
  /** 選手の表示名：背番号＋（あれば）名字。同じ名字がいれば名の1文字目も足す */
  function labeler(players) {
    const fam = p => (p.name || '').trim().split(/[\s　]+/);
    const count = {}; players.forEach(p => { const f = fam(p)[0]; if (f) count[f] = (count[f] || 0) + 1; });
    return p => {
      const [f, g1] = fam(p);
      if (!f) return '#' + p.no;
      return `#${p.no} ${count[f] > 1 && g1 ? f + g1[0] : f}`;
    };
  }
  const fmtDate = m => { const d = String(m.date || '').replace(/^(\d{4})-0?(\d+)-0?(\d+)$/, '$1/$2/$3'); return [d, m.time, m.gameNo ? `Game ${m.gameNo}` : '', m.venue].filter(Boolean).join('　'); };
  const pn = n => (n > 0 ? 'pos' : n < 0 ? 'neg' : '');
  const TAG = { result: '結果', flow: '流れ', scoring: '得点', ft: 'フリースロー', foul: 'ファウル', lineup: '出場メンバー', participation: '出場', note: '注意' };

  async function saveFile(name, text, mime) {
    try {
      if (window.claude && window.claude.use) {
        const dl = await window.claude.use('downloads');
        if (dl) { await dl.save({ filename: name, data: text }); return; }
      }
    } catch (e) { if (e && e.code === 'declined') return; }
    const url = URL.createObjectURL(new Blob([text], { type: mime || 'text/plain' }));
    const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }
  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); toast('コピーしました'); return true; } catch (e) { /* 下で選択 */ }
    const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch (e) { /* noop */ }
    ta.remove(); toast(ok ? 'コピーしました' : 'コピーできませんでした。文字を選んでコピーしてください'); return ok;
  }

  // ════════ グラフの置き場 ═══════════════════════════════════════════
  const CH = new Map(); let chSeq = 0;
  const chart = build => { const id = 'c' + (++chSeq); CH.set(id, build); return `<div class="chart" data-cid="${id}"></div>`; };
  function drawCharts() { $$('[data-cid]').forEach(el => { const b = CH.get(el.dataset.cid); if (b) el.innerHTML = b(Math.floor(el.clientWidth) || 640); }); }
  let rzT; window.addEventListener('resize', () => { clearTimeout(rzT); rzT = setTimeout(drawCharts, 120); });

  const tipEl = document.createElement('div'); tipEl.className = 'tip'; tipEl.hidden = true; tipEl.setAttribute('role', 'tooltip');
  function showTip(t, x, y) {
    const lines = (t.getAttribute('data-tip') || '').split('\n');
    tipEl.textContent = '';
    const b = document.createElement('b'); b.textContent = lines[0]; tipEl.appendChild(b);
    lines.slice(1).forEach(l => { const d = document.createElement('div'); d.textContent = l; tipEl.appendChild(d); });
    tipEl.hidden = false;
    const w = tipEl.offsetWidth, h = tipEl.offsetHeight;
    tipEl.style.left = Math.max(8, Math.min(innerWidth - w - 8, x + 12)) + 'px';
    tipEl.style.top = Math.max(8, (y - h - 12 < 8 ? y + 18 : y - h - 12)) + 'px';
  }
  document.addEventListener('pointermove', e => { const t = e.target.closest && e.target.closest('[data-tip]'); if (t) showTip(t, e.clientX, e.clientY); else tipEl.hidden = true; });
  document.addEventListener('focusin', e => { const t = e.target.closest && e.target.closest('[data-tip]'); if (t) { const r = t.getBoundingClientRect(); showTip(t, r.left + r.width / 2, r.top); } });
  document.addEventListener('focusout', () => { tipEl.hidden = true; });
  document.addEventListener('scroll', () => { tipEl.hidden = true; }, true);

  // ════════ 画面の骨組み ═════════════════════════════════════════════
  function shell() {
    $('#app').innerHTML = `
      <div class="wrap">
        <header class="app-head">
          <div class="brand">
            <h1>ミニバス スコアシート分析</h1>
            <p>スコアシートの写真から、得点・フリースロー・ファウル・出場を読み取って、試合ごと・通算で分析します。</p>
          </div>
          <ol class="steps" id="steps"></ol>
        </header>
        <main id="main" class="sect"></main>
        <footer class="foot">スコアシートに書いてあることだけを使います。シュートの試投数・リバウンド・アシスト・ターンオーバーは記録がないので、分析には含まれません。</footer>
      </div>`;
    document.body.appendChild(tipEl);
  }
  function renderSteps() {
    const has = S.games.some(g => g.confirmed);
    const st = [['input', '写真', true], ['review', '確認', !!cur()], ['report', '分析', has]];
    $('#steps').innerHTML = st.map(([k, l, on], i) => `<li><button data-act="step" data-s="${k}" ${S.step === k ? 'aria-current="step"' : ''} ${on ? '' : 'disabled'}><b>${i + 1}</b>${l}</button></li>`).join('');
  }
  function render() {
    CH.clear(); chSeq = 0;
    renderSteps();
    const m = $('#main');
    m.innerHTML = S.step === 'input' ? viewInput() : S.step === 'review' ? viewReview() : viewReport();
    drawCharts();
  }
  const go = (step, extra) => { S.step = step; Object.assign(S, extra || {}); render(); window.scrollTo({ top: 0 }); };

  // ════════ ① 写真を入れる ═══════════════════════════════════════════
  const providerLabel = () => ({
    claude: 'Claude（このページから）', manual: '手動（ほかのAIにコピーして貼る）', checking: '確認中…',
  }[S.provider.kind]);
  const storeLabel = () => ({ db: 'このアーティファクトの保存領域（自分だけ）', local: 'このブラウザ', memory: 'メモリだけ（閉じると消えます。書き出しで残せます）' }[S.store.where])
    + (S.store.where === 'local' && S.store.dbBlocked ? '（このページには書き込めない権限のため。ほかの端末には出ません）' : '');
  // この表示では Claude を使えないと分かったときの返事。以後は「手動で読み取る」に切り替える
  const NO_CLAUDE = ['not_granted', 'sampling_disabled', 'images_unavailable', 'not_declared', 'capability_disabled', 'capability_removed'];
  function dropClaude(e) {
    if (!(e && NO_CLAUDE.includes(e.code)) || S.provider.kind === 'manual') return false;
    S.provider = { kind: 'manual' };
    S.queue.forEach(q => { if (q.status === 'queued') q.status = 'idle'; }); S.queue = [];
    return true;
  }

  function itemHtml(it) {
    const g = it.gameId ? game(it.gameId) : null;
    let st;
    if (it.status === 'reading') st = `<span class="status busy">${esc(it.msg || '読み取り中…')}</span>`;
    else if (it.status === 'queued') st = '<span class="status">順番待ち…</span>';
    else if (it.status === 'done') st = `<span class="status">読み取り済み${g && g.confirmed ? '（確認ずみ）' : ''}</span>`;
    else if (it.status === 'error') st = `<span class="status" style="color:var(--st-bad)">${esc(it.err)}</span>`;
    else st = `<span class="status">${S.provider.kind === 'manual' ? 'この環境では自動で読み取れません。下の「手動で読み取る」を使ってください' : '未読み取り'}</span>`;
    const acts = [];
    if (it.status === 'reading') acts.push(`<button class="btn" data-act="cancel" data-id="${it.id}">中止</button>`);
    if (it.status === 'done' && g) acts.push(`<button class="btn primary" data-act="open" data-g="${g.id}">確認して分析へ</button>`);
    if ((it.status === 'idle' || it.status === 'error') && S.provider.kind !== 'manual') acts.push(`<button class="btn primary" data-act="read" data-id="${it.id}">読み取る</button>`);
    if (it.status !== 'reading') acts.push(`<button class="btn quiet" data-act="rmItem" data-id="${it.id}">外す</button>`);
    return `<div class="photo" id="${it.id}"><img src="${it.url}" alt="スコアシートの写真"><div class="meta"><span class="name">${esc(it.file.name || '写真')}</span>${st}</div><div class="acts">${acts.join('')}</div></div>`;
  }

  function viewInput() {
    const saved = S.games.filter(g => g.confirmed && g.src !== 'sample');
    const first = !saved.length && !S.items.length && !S.demo;
    return `${first ? `<div class="card"><div class="sect-head"><h2>まず、分析のようすを見る</h2></div>
      <p class="hint">練習試合3試合のサンプル（背番号だけの数字データ。チーム名は仮のもの）を、そのまま分析した画面を開きます。写真を入れる前に、何がわかるかを確かめられます。</p>
      <div class="row"><button class="btn primary" data-act="sample">サンプルで分析を見る</button></div></div>` : ''}
    <div class="card">
      <div class="sect-head"><h2>スコアシートの写真を入れる</h2><span class="hint">読み取り：${esc(providerLabel())}</span></div>
      <div class="drop" id="drop">
        <strong>写真をここにドロップ、または選ぶ（複数OK）</strong>
        <span class="hint">用紙の全体が写るように、真上から撮ると読み取りやすくなります。1枚あたり1〜2分かかります。</span>
        <label class="btn primary">写真を選ぶ<input type="file" id="file" accept="image/*" multiple hidden></label>
      </div>
      <div class="row">
        <label class="f grow">自チームの名前に含まれる言葉<input type="text" id="kw" value="${esc(S.settings.myKeyword)}" placeholder="例：チーム名の一部"></label>
        <label class="chk"><input type="checkbox" id="noNames" ${S.settings.noNames ? 'checked' : ''}>選手の名前は読み取らない（背番号だけ）</label>
      </div>
      <p class="hint">空欄のときは、用紙の右側のチームBを自チームとして分析します。試合ごとに、確認の画面でも選べます。</p>
      ${S.items.length ? `<div class="photos" id="photos">${S.items.map(itemHtml).join('')}</div>` : ''}
      ${S.provider.kind === 'claude' ? '<p class="hint">写真は Claude に送って読み取ります（あなたの Claude の利用枠を使います）。保存されるのは、確認した後の数字のデータだけです。</p>' : ''}
      <details class="fold" ${S.provider.kind === 'manual' ? 'open' : ''}>
        <summary>手動で読み取る（ChatGPT・Gemini・Claudeのチャットなど、ほかのAIを使う）</summary>
        <div class="sect">
          <p class="hint">① 下の指示文をコピーして、ほかのAIに「スコアシートの写真」と一緒に送る　② 返ってきたJSONをここに貼り付ける</p>
          <pre class="prompt" id="promptBox">${esc(MB.buildFullPrompt({ noNames: S.settings.noNames }))}</pre>
          <div class="row"><button class="btn" data-act="copyPrompt">指示文をコピー</button></div>
          <label class="f">AIの返答（JSON）<textarea id="pasteBox" rows="6" placeholder="{ &quot;meta&quot;: …">${esc(S.manualText)}</textarea></label>
          <div class="row"><button class="btn primary" data-act="importPaste">読み込む</button></div>
        </div>
      </details>
    </div>

    <div class="card">
      <div class="sect-head"><h2>保存した試合</h2><span class="hint">保存先：${esc(storeLabel())}</span></div>
      ${saved.length ? `<div class="photos">${saved.map(g => savedRow(g)).join('')}</div>
      <div class="row"><button class="btn primary" data-act="step" data-s="report">分析を見る</button><button class="btn" data-act="exportAll">全部書き出す（JSON）</button></div>`
        : '<p class="hint">まだありません。写真を読み取って「この内容で分析する」を押すと、ここに残ります。</p>'}
      <div class="row">
        <label class="btn">書き出したファイルを取り込む<input type="file" id="importFile" accept=".json,application/json" hidden></label>
        <button class="btn" data-act="blank">手入力で1試合つくる</button>
        <button class="btn" data-act="sample">${S.demo ? 'サンプルをやめる' : 'サンプルで分析を見る（3試合）'}</button>
      </div>
    </div>

    <div class="card">
      <h2>この分析でわかること</h2>
      <ul class="cant" style="color:var(--ink)">
        <li>ピリオドごとの得点・失点・点差、前半と後半</li>
        <li>選手ごとの得点（2点・3点・フリースロー別）</li>
        <li>フリースローの成功数と成功率（機会は相手のファウルの P1・P2 から）</li>
        <li>ファウル数（選手別・ピリオド別）と、相手に与えたフリースロー</li>
        <li>誰がどのピリオドに出たか、5人の組み合わせごとの得失点</li>
        <li>選手ごとのプラスマイナス（ピリオド単位）</li>
        <li>タイムアウトを取ったピリオドと時間</li>
        <li>複数の試合をまとめた、チームと選手の通算</li>
      </ul>
    </div>`;
  }

  function savedRow(g) {
    const n = norm(g), A = n.teams[0], B = n.teams[1];
    const armed = S.delArm === g.id;
    return `<div class="photo" style="grid-template-columns:minmax(0,1fr) auto">
      <div class="meta"><span class="name">${esc(MB.gameTitle(g.raw))}</span><span class="status">${esc(abbr(A.name))} ${A.final} − ${B.final} ${esc(abbr(B.name))}</span></div>
      <div class="acts"><button class="btn" data-act="open" data-g="${g.id}">確認・修正</button><button class="btn" data-act="goTab" data-g="${g.id}">分析</button>
      <button class="btn quiet" data-act="del" data-g="${g.id}">${armed ? 'もう一度押すと削除' : '削除'}</button></div></div>`;
  }

  // ── 写真の受け取りと読み取り ──
  function addFiles(files) {
    const imgs = [...files].filter(f => /^image\//.test(f.type) || /\.(jpe?g|png|webp|heic|heif)$/i.test(f.name));
    if (!imgs.length) { toast('画像ファイルを選んでください'); return; }
    imgs.forEach(f => { const it = { id: nid('p'), file: f, url: URL.createObjectURL(f), status: 'idle' }; S.items.push(it); if (S.provider.kind === 'claude') enqueue(it); });
    render();
  }
  function enqueue(it) { if (it.status === 'reading' || S.queue.includes(it)) return; it.status = 'queued'; S.queue.push(it); pump(); }
  async function pump() {
    if (S.running) return; S.running = true;
    let firstDone = null;
    while (S.queue.length) { const it = S.queue.shift(); await readItem(it); if (it.status === 'done' && !firstDone) firstDone = it; }
    S.running = false;
    if (firstDone && S.step === 'input' && firstDone.gameId) { S.sel = firstDone.gameId; go('review'); }
  }
  function describeError(e) {
    if (e && e.code && MB.ERR_TEXT[e.code]) return MB.ERR_TEXT[e.code];
    return (e && e.message) ? String(e.message) : '読み取りに失敗しました';
  }
  function itemPatch(it) {
    const el = document.getElementById(it.id); if (el) el.outerHTML = itemHtml(it);
    const g = S.step === 'review' ? cur() : null;
    if (g && g.photoId === it.id) {
      if (it.status === 'done' || it.status === 'error') { render(); if (it.status === 'error') toast(it.err); }
      else { const st = $('#rereadStatus'); if (st) st.innerHTML = it.status === 'reading' || it.status === 'queued' ? `<span class="status busy">${esc(it.msg || '順番待ち…')}</span>` : ''; }
    }
  }

  async function readItem(it, opts) {
    opts = opts || {};
    it.status = 'reading'; it.err = ''; it.msg = '写真を準備中…'; itemPatch(it);
    const ctl = new AbortController(); it.ctl = ctl;
    try {
      if (!it.loaded) it.loaded = await MB.loadImage(it.file);
      const keep = opts.keepRect || it.keepRect; it.keepRect = false;
      if (!keep || !it.rect) { const d = MB.detectPaper(it.loaded.img, it.loaded.w, it.loaded.h); it.rect = d.rect; it.detected = d.detected; }
      it.tiles = await MB.makeTiles(it.loaded, it.rect, Object.keys(MB.TILES));
      if (it.tileUrls) Object.values(it.tileUrls).forEach(u => URL.revokeObjectURL(u));
      it.tileUrls = Object.fromEntries(Object.entries(it.tiles).map(([k, t]) => [k, URL.createObjectURL(t.blob)]));
      const hooks = { signal: ctl.signal, noNames: S.settings.noNames, onStatus: m => { it.msg = m; itemPatch(it); } };
      let raw;
      if (S.provider.kind === 'claude') raw = await MB.sampleExtract(S.provider.sample, it.tiles, null, hooks);
      else throw new Error('この環境では自動で読み取れません');
      const g = putGame(MB.coerceRaw(raw), { src: 'photo', photoId: it.id, id: it.gameId });
      it.gameId = g.id; it.status = 'done';
    } catch (e) {
      it.status = e && e.code === 'cancelled' ? 'idle' : 'error';
      it.err = describeError(e);
      if (e && e.code === 'invalid_json' && e.text) { S.manualText = e.text; it.err += '（返答の文章を「手動で読み取る」の欄に入れました）'; }
      if (dropClaude(e)) { it.err += ' このページからの読み取りは使えないので、「手動で読み取る」に切り替えました。'; render(); }
    } finally { it.ctl = null; itemPatch(it); }
  }

  /** 試合データを加える（同じ id・同じ試合キーなら置き換える） */
  function fillDefaults(raw) {
    raw.meta = raw.meta || {}; raw.teams = raw.teams || [];
    for (let i = 0; i < 2; i++) {
      const t = raw.teams[i] = raw.teams[i] || {};
      t.side = t.side || 'AB'[i]; t.name = t.name || ''; t.uniform = t.uniform || '';
      t.quarterScores = (t.quarterScores || []).slice(); while (t.quarterScores.length < 4) t.quarterScores.push(0);
      t.teamFouls = (t.teamFouls || []).slice(); while (t.teamFouls.length < 4) t.teamFouls.push(0);
      t.timeouts = t.timeouts || []; t.players = t.players || []; t.running = t.running || [];
      t.players.forEach(p => { p.no = p.no == null ? '' : String(p.no); p.name = p.name || ''; p.fouls = p.fouls || []; p.marks = (p.marks || []).slice(); while (p.marks.length < 4) p.marks.push(''); });
    }
  }
  function putGame(raw, meta) {
    if (!raw || typeof raw !== 'object' || !raw.teams) throw new Error('試合のデータの形ではありません');
    fillDefaults(raw);
    raw.notes = raw.notes || [];
    const key = MB.makeKey(raw);
    let g = (meta.id && game(meta.id)) || S.games.find(x => x.src !== 'sample' && MB.makeKey(x.raw) === key && x.confirmed);
    if (g) { g.raw = raw; g.src = meta.src || g.src; if (meta.photoId) g.photoId = meta.photoId; g.confirmed = false; }
    else { g = { id: nid('g'), raw, confirmed: !!meta.confirmed, src: meta.src || 'json', photoId: meta.photoId }; S.games.push(g); }
    return g;
  }

  // ════════ ② 確認と修正 ═════════════════════════════════════════════
  const SIDES = ['A', 'B'];
  function issuesHtml(chk) {
    const list = [...chk.errors.map(i => ['err', '!', i]), ...chk.warnings.map(i => ['warn', '?', i]), ...chk.infos.map(i => ['info', 'i', i])];
    const head = chk.errors.length
      ? `<p><b style="color:var(--st-bad)">数字が合わない箇所が${chk.errors.length}件あります。</b>写真と見比べて直すか、読み直してください。</p>`
      : chk.warnings.length ? `<p><b>数字は合っています。確認してほしい点が${chk.warnings.length}件あります。</b></p>`
        : '<p class="okline">✓ 整合性チェックはすべて通りました（ピリオド得点の合計・ランニングスコア・得点者の出場が、見出しの得点と一致）。</p>';
    return head + (list.length ? `<ul class="issues">${list.map(([c, m, i]) => `<li><span class="badge ${c}" aria-hidden="true">${m}</span><span>${esc(i.msg)}</span></li>`).join('')}</ul>` : '');
  }

  function photoPanel(it, g) {
    const r = it.rect || { x: 0, y: 0, w: 1, h: 1 };
    const pct = v => (v * 100).toFixed(1) + '%';
    const L = Math.round(r.x * 100), T = Math.round(r.y * 100), R = Math.round((1 - r.x - r.w) * 100), Bt = Math.round((1 - r.y - r.h) * 100);
    const slider = (k, v, lab) => `<label class="f">${lab}（${v}%）<input type="range" min="0" max="45" value="${v}" data-rng="${k}" data-id="${it.id}"></label>`;
    return `<details class="fold card" id="photoPanel">
      <summary>読み取った写真と、読み取りに使った範囲</summary>
      <div class="sect">
        <div class="paper-box"><img src="${it.url}" alt="スコアシートの写真"><div class="rect" id="rectBox" style="left:${pct(r.x)};top:${pct(r.y)};width:${pct(r.w)};height:${pct(r.h)}"></div></div>
        <p class="hint">青い枠が「用紙」として扱った範囲です。ずれているときは、枠の余白を調整して読み直してください。${it.detected === false ? '（用紙を自動で見つけられなかったので、写真全体を使っています）' : ''}</p>
        <div class="split">${slider('l', L, '左を削る')}${slider('r', R, '右を削る')}${slider('t', T, '上を削る')}${slider('b', Bt, '下を削る')}</div>
        ${it.tileUrls ? `<div class="tiles">${Object.entries(it.tileUrls).map(([k, u]) => `<img src="${u}" alt="${esc(MB.TILES[k].label)}" title="${esc(MB.TILES[k].label)}">`).join('')}</div>` : ''}
        <div class="row"><button class="btn" data-act="reread" data-id="${it.id}" ${S.provider.kind === 'manual' ? 'disabled' : ''}>この範囲で全部読み直す</button><span id="rereadStatus"></span></div>
      </div>
    </details>`;
  }

  function teamForm(g, i) {
    const t = g.raw.teams[i], side = SIDES[i];
    const nm = S.settings.noNames;
    const pr = (t.players || []).map((p, k) => `<tr>
      <td><input type="text" size="3" inputmode="numeric" value="${esc(p.no)}" data-f="teams.${i}.players.${k}.no" aria-label="背番号"></td>
      ${nm ? '' : `<td><input type="text" size="8" value="${esc(p.name)}" data-f="teams.${i}.players.${k}.name" aria-label="名前"></td>`}
      <td><span class="cells">${[0, 1, 2, 3].map(q => { const m = (p.marks || [])[q] || ''; return `<button class="qbtn" data-act="mark" data-t="${i}" data-p="${k}" data-q="${q}" data-odd="${q % 2 === 0 ? 1 : 0}" aria-pressed="${m ? 'true' : 'false'}" title="${Q[q]}の出場（押すごとに ／ → ＼ → ✕ → なし）">${m === '/' ? '／' : m === '\\' ? '＼' : m === 'X' ? '✕' : Q[q][0]}</button>`; }).join('')}</span></td>
      <td><input type="text" size="12" value="${esc(MB.foulsToText(p.fouls))}" data-f="teams.${i}.players.${k}.fouls" aria-label="ファウル" placeholder="なし"></td>
      <td><button class="btn quiet" data-act="delPlayer" data-t="${i}" data-p="${k}" aria-label="この選手を削除">×</button></td></tr>`).join('');
    const num = (path, v, lab) => `<label class="f">${lab}<input type="number" inputmode="numeric" min="0" value="${v == null ? '' : esc(v)}" data-f="${path}" style="width:5.2em"></label>`;
    return `<div class="card">
      <h3><span class="sw" style="display:inline-block;margin-right:6px;background:var(${i === g.myIdx ? '--me' : '--opp'})"></span>チーム${side}${i === g.myIdx ? '（自チーム）' : ''}</h3>
      <div class="row"><label class="f grow">チーム名<input type="text" value="${esc(t.name)}" data-f="teams.${i}.name"></label><label class="f">色<input type="text" size="2" value="${esc(t.uniform)}" data-f="teams.${i}.uniform"></label></div>
      <div class="row">${num(`teams.${i}.finalScore`, t.finalScore, '最終得点')}${[0, 1, 2, 3].map(q => num(`teams.${i}.quarterScores.${q}`, (t.quarterScores || [])[q], Q[q] + 'の得点')).join('')}</div>
      <div class="row">${[0, 1, 2, 3].map(q => num(`teams.${i}.teamFouls.${q}`, (t.teamFouls || [])[q], Q[q] + 'のチームファウル欄(×の数)')).join('')}</div>
      <label class="f">タイムアウト（枠:分。例 2:4 = 2Qの4分）<input type="text" value="${esc(MB.timeoutsToText(t.timeouts))}" data-f="teams.${i}.timeouts"></label>
      <div class="scroll-x"><table class="ptab"><thead><tr><th>背番号</th>${nm ? '' : '<th>名前</th>'}<th>出場</th><th>ファウル</th><th></th></tr></thead><tbody>${pr}</tbody></table></div>
      <div class="row"><button class="btn" data-act="addPlayer" data-t="${i}">＋ 選手を足す</button></div>
      <p class="hint">ファウルの書き方：P2r = フリースロー2本・赤インク、Pb = 本数なし・黒インク（赤は1Q・3Q、黒は2Q・4Q）</p>
      <label class="f">ランニングスコア（1行＝1回の得点：「得点番号　FT／FG／3P　背番号」。ピリオド最後の得点には行の終わりに * ）<textarea class="ev" rows="9" data-f="teams.${i}.running" spellcheck="false">${esc(MB.rawEventsToText(t.running))}</textarea></label>
    </div>`;
  }

  function viewReview() {
    const g = cur(); if (!g) return '<p>確認する試合がありません。</p>';
    const n = norm(g); g.myIdx = MB.pickMine(n, S.settings.myKeyword);
    const chk = MB.validateGame(n);
    const it = S.items.find(x => x.id === g.photoId);
    const pend = S.games.filter(x => x.src === 'photo' && !x.confirmed && x.id !== g.id).length;
    const m = g.raw.meta || {};
    const fld = (k, lab, type, w) => `<label class="f">${lab}<input type="${type || 'text'}" value="${esc(m[k] || '')}" data-f="meta.${k}" ${w ? `style="width:${w}"` : ''}></label>`;
    return `
    <div class="sect-head"><h2>読み取り結果の確認と修正</h2><span class="hint">写真と見比べて、違うところを直してください</span></div>
    ${it ? photoPanel(it, g) : ''}
    <div class="card"><div id="issues">${issuesHtml(chk)}</div>
      ${it && S.provider.kind !== 'manual' ? `<div class="row" id="rereadRow"><button class="btn" data-act="repair" data-scope="info">基本情報を読み直す</button><button class="btn" data-act="repair" data-scope="running">得点（ランニングスコア）を読み直す</button><span class="hint">合わない箇所を伝えて、もう一度読み取ります</span></div>` : ''}
      ${(g.raw.notes || []).length ? `<div class="note"><b>読み取り時のメモ：</b><br>${g.raw.notes.map(esc).join('<br>')}</div>` : ''}
    </div>
    <div class="card"><h3>試合の情報</h3>
      <div class="row">${fld('date', '日付', 'date')}${fld('time', '時刻', 'text', '6em')}${fld('gameNo', 'Game No.', 'text', '5em')}${fld('venue', '会場')}</div>
      <div class="row"><label class="f">自チーム<select data-f="myTeam"><option value="">名前から自動</option><option value="A" ${g.raw.myTeam === 'A' ? 'selected' : ''}>チームA（${esc(abbr(g.raw.teams[0].name))}）</option><option value="B" ${g.raw.myTeam === 'B' ? 'selected' : ''}>チームB（${esc(abbr(g.raw.teams[1].name))}）</option></select></label></div>
    </div>
    <div class="split">${teamForm(g, 0)}${teamForm(g, 1)}</div>
    <div class="row">
      <button class="btn primary" data-act="analyze">この内容で分析する</button>
      ${pend ? `<button class="btn" data-act="nextPending">保存して、次の試合を確認（あと${pend}件）</button>` : ''}
      <button class="btn quiet" data-act="step" data-s="input">写真の画面へ戻る</button>
    </div>`;
  }

  function setPath(obj, path, val) {
    const ks = path.split('.'); let o = obj;
    for (let i = 0; i < ks.length - 1; i++) { const k = /^\d+$/.test(ks[i]) ? +ks[i] : ks[i]; if (o[k] == null) o[k] = /^\d+$/.test(ks[i + 1]) ? [] : {}; o = o[k]; }
    const last = /^\d+$/.test(ks[ks.length - 1]) ? +ks[ks.length - 1] : ks[ks.length - 1]; o[last] = val;
  }
  function onField(el) {
    const g = cur(); if (!g) return;
    const path = el.dataset.f; let v = el.value;
    if (/\.running$/.test(path)) v = MB.parseEventsText(v);
    else if (/\.fouls$/.test(path)) v = MB.parseFoulsText(v);
    else if (/\.timeouts$/.test(path)) v = MB.parseTimeoutsText(v);
    else if (/finalScore$|quarterScores\.\d$|teamFouls\.\d$/.test(path)) v = v === '' ? 0 : MB.int(v, 0);
    else if (path === 'myTeam') { if (v) g.raw.myTeam = v; else delete g.raw.myTeam; render(); return; }
    setPath(g.raw, path, v);
    refreshReview();
  }
  function refreshReview() {
    const g = cur(); if (!g) return;
    const n = norm(g);
    const box = $('#issues'); if (box) box.innerHTML = issuesHtml(MB.validateGame(n));
  }

  async function confirmCurrent(thenReport) {
    const g = cur(); if (!g) return;
    g.raw.notes = g.raw.notes || [];
    g.confirmed = true;
    if (g.src !== 'sample') {
      try {
        const k = MB.makeKey(g.raw); if (g.key && g.key !== k) await MB.remove(g.key);
        const r = await MB.put(k, g.raw); g.key = k; S.store = MB.storeInfo();
        toast(r.where === 'db' ? '保存しました'
          : r.where === 'local' ? (r.fellBack ? '保存しました（このブラウザの中だけ。このページには書き込めない権限のため、ほかの端末には出ません）' : '保存しました（このブラウザ）')
            : '保存しました（メモリだけ。閉じると消えます。「全部書き出す」で残せます）');
      } catch (e) { toast('保存できませんでした（このセッションでは使えます）：' + (e && e.message || '')); }
    }
    if (thenReport) go('report', { tab: g.id });
  }

  async function repair(scope) {
    const g = cur(); if (!g) return; const it = S.items.find(x => x.id === g.photoId);
    if (!it || !it.tiles) { toast('この試合は写真から読み取ったものではないので、読み直せません'); return; }
    const chk = MB.validateGame(norm(g));
    const issues = [...chk.errors, ...chk.warnings].map(i => i.msg);
    if (!issues.length) issues.push('不一致は見つかっていません。念のため、もう一度丁寧に読み直してください。');
    const row = $('#rereadRow'); if (row) row.innerHTML = '<span class="status busy">読み直し中…（1〜2分）</span><button class="btn" data-act="cancelRepair">中止</button>';
    const ctl = new AbortController(); S.repairCtl = ctl;
    try {
      const raw = S.provider.kind === 'claude'
        ? await MB.sampleRepair(S.provider.sample, it.tiles, scope, g.raw, issues, { signal: ctl.signal, noNames: S.settings.noNames })
        : null;
      if (!raw) throw new Error('この環境では読み直せません');
      g.raw = MB.coerceRaw(raw); toast('読み直しました。結果を確認してください');
    } catch (e) { if (!(e && e.code === 'cancelled')) toast(describeError(e) + (dropClaude(e) ? ' 以後は「手動で読み取る」を使ってください。' : '')); }
    S.repairCtl = null; render();
  }

  // ════════ ③ 分析 ═══════════════════════════════════════════════════
  function sortedGames() {
    return S.games.filter(g => g.confirmed).slice().sort((a, b) => MB.gameTitle(a.raw).localeCompare(MB.gameTitle(b.raw), 'ja', { numeric: true }));
  }
  const nameOf = (rep, side) => abbr(rep.game.teams[side === 'my' ? rep.my : rep.opp].name);

  function quarterTable(rep) {
    const my = rep.game.teams[rep.my], op = rep.game.teams[rep.opp];
    const n = rep.game.nq;
    const hd = [...Array(n).keys()].map(k => `<th>${Q[k]}</th>`).join('');
    const row = (arr, cls) => arr.map(v => `<td class="${cls ? pn(v) : ''}">${cls ? sgn(v) : v}</td>`).join('');
    return `<div class="scroll-x"><table class="qtab"><thead><tr><th></th>${hd}<th class="tot">計</th></tr></thead><tbody>
      <tr><td><span class="team-cell"><i class="sw" style="background:var(--me)"></i>${esc(abbr(my.name))}</span></td>${row(my.quarters.slice(0, n))}<td class="tot">${my.final}</td></tr>
      <tr><td><span class="team-cell"><i class="sw" style="background:var(--opp)"></i>${esc(abbr(op.name))}</span></td>${row(op.quarters.slice(0, n))}<td class="tot">${op.final}</td></tr>
      <tr><td>差</td>${row(rep.quarters.map(q => q.net), 1)}<td class="tot ${pn(rep.result.diff)}">${sgn(rep.result.diff)}</td></tr>
      <tr><td>累計の差</td>${row(rep.quarters.map(q => q.cumNet), 1)}<td class="tot"></td></tr>
    </tbody></table></div>`;
  }

  const insightsHtml = list => `<ul class="insights">${list.map(i => `<li><span class="tg">${TAG[i.tag] || ''}</span><span>${esc(i.text)}</span></li>`).join('')}</ul>`;

  function foulChips(p) {
    if (!p.fouls.length) return '<span class="dim">–</span>';
    return `<span class="chips">${p.fouls.map(f => `<span class="chip ${f.ink || 'none'}" title="${f.ink === 'red' ? '赤インク（1Q・3Q）' : f.ink === 'black' ? '黒インク（2Q・4Q）' : 'インク不明'}${f.ft ? `・フリースロー${f.ft}本` : ''}">${esc(f.type)}${f.ft || ''}</span>`).join('')}</span>`;
  }
  function cellsFor(p) {
    return `<span class="cells">${[0, 1, 2, 3].map(k => {
      if (!p.played[k]) return `<span class="cell off">·</span>`;
      const pts = p.ptsByQ[k];
      return `<span class="cell on ${pts > 0 ? 'pts' : ''} ${p.partial[k] ? 'odd' : ''}" data-tip="${esc([`${Q[k]} に出場`, `得点 ${pts}点${p.partial[k] ? '（斜線以外の印あり）' : ''}`].join('\n'))}" tabindex="0">${pts}</span>`;
    }).join('')}</span>`;
  }

  function playersTable(rep, side) {
    const list = rep.players[side].filter(p => p.qCount > 0 || p.pts > 0).slice().sort((a, b) => b.pts - a.pts || b.qCount - a.qCount || Number(a.no) - Number(b.no));
    const lab = labeler(rep.players[side]);
    const rows = list.map(p => `<tr><td class="l"><span class="no">${esc(lab(p))}</span></td><td class="l">${cellsFor(p)}</td><td><b>${p.pts}</b></td><td>${p.ppq == null ? '–' : p.ppq}</td><td class="l">${foulChips(p)}</td><td>${p.qCount ? sgn(p.pm) + (p.pmApprox ? '＊' : '') : '–'}</td></tr>`).join('');
    const dnp = rep.players[side].filter(p => p.qCount === 0 && !p.synthetic).map(p => '#' + p.no);
    return `<div class="scroll-x"><table class="ptable"><thead><tr><th>選手</th><th class="l">出場したピリオド（その得点）</th><th>得点</th><th>1Q平均</th><th class="l">ファウル</th><th>±</th></tr></thead><tbody>${rows}</tbody></table></div>
      ${dnp.length ? `<p class="hint">出場の印がない登録選手：${dnp.join(' ')}（欠席・ケガ等かは記録から分かりません）</p>` : ''}`;
  }

  function foulRows(rep) {
    return rep.game.teams.length && [0, 1, 2, 3].map(k => {
      const f = side => { const x = rep.fouls[side].byQ[k]; return { v: x.lo, hi: x.hi != null && x.hi > x.lo ? x.hi : null, text: x.exact ? String(x.lo) : x.hi == null ? `${x.lo}以上` : `${x.lo}〜${x.hi}` }; };
      return { label: Q[k], a: f('my'), b: f('opp') };
    });
  }

  function viewGameReport(g) {
    const n = norm(g), my = MB.pickMine(n, S.settings.myKeyword);
    const rep = MB.analyzeGame(n, my);
    const T = n.teams[rep.my], O = n.teams[rep.opp], r = rep.result;
    const labMy = labeler(rep.players.my);
    const sc = rep.scoring;
    const scorers = rep.players.my.filter(p => p.pts > 0).slice().sort((a, b) => b.pts - a.pts);
    const pmRows = rep.players.my.filter(p => p.qCount > 0).slice().sort((a, b) => b.pm - a.pm || b.qCount - a.qCount);
    const qline = rep.quarters.slice(0, 4);
    const tiles = (t, o) => `
      <div class="tile"><span class="tl">${esc(abbr(t.name))}の得点の内訳</span><span class="tv">${o.FG.pts + o.TP.pts + o.FT.pts}点</span><span class="ts">2点 ${o.FG.n}本${o.TP.n ? `・3点 ${o.TP.n}本` : ''}・FT ${o.FT.n}本</span></div>`;
    const ftTile = (lab, f) => `<div class="tile"><span class="tl">${lab}のフリースロー</span><span class="tv">${f.made}/${f.att}${f.pct != null ? `<small>（${f.pct}%）</small>` : ''}</span><span class="ts">成功 / 機会</span></div>`;
    const foulTile = (t, ft) => `<div class="tile"><span class="tl">${esc(abbr(t.name))}のファウル</span><span class="tv">${ft.total}個</span><span class="ts">与えたFT機会 ${ft.give}本</span></div>`;
    const lu = rep.lineups.my.map(l => `<tr><td class="l">${l.label}</td><td class="l"><span class="lineup">${l.members.map(m => `<span>#${esc(m)}</span>`).join('')}</span>${l.approx ? '<small> 交代の印あり</small>' : ''}</td><td>${l.pf}</td><td>${l.pa}</td><td class="${pn(l.net)}"><b>${sgn(l.net)}</b></td></tr>`).join('');
    const tos = [...rep.timeouts.my.map(x => ['自', x]), ...rep.timeouts.opp.map(x => ['相手', x])].sort((a, b) => (a[1].quarter ?? 9) - (b[1].quarter ?? 9) || (a[1].minute ?? 0) - (b[1].minute ?? 0));
    const chk = rep.checks;
    const foulCap = `<p class="hint">チームファウル欄は1ピリオド4個までしか数えられないため、赤（1Q・3Q）・黒（2Q・4Q）のインクの色ごとの合計から割り出しています。幅（5〜7など）は、前半・後半の2つのピリオドがどちらも4個以上だったときの、出場メンバーから考えられる範囲です。</p>`;
    return `
    <div class="card">
      <div class="hero">
        <div class="board"><div class="team"><span class="tn" title="${esc(T.name)}"><i class="sw" style="background:var(--me)"></i>${esc(abbr(T.name))}</span></div>
          <div class="mid"><span class="score">${r.pf}</span><span class="dash">−</span><span class="score">${r.pa}</span></div>
          <div class="team opp"><span class="tn" title="${esc(O.name)}"><i class="sw" style="background:var(--opp)"></i>${esc(abbr(O.name))}</span></div></div>
        <div class="result"><span class="big"><span class="pill ${r.outcome === 'W' ? 'w' : ''}">${r.outcome === 'W' ? '勝ち' : r.outcome === 'L' ? '負け' : '引き分け'}</span> ${sgn(r.diff)}</span><small>${esc(fmtDate(n.meta))}</small></div>
      </div>
      ${quarterTable(rep)}
    </div>
    ${g.src === 'sample' ? '<p class="note">これはサンプルです（練習試合3試合を、背番号だけの数字データにしたもの。チーム名は仮のものです）。</p>' : ''}
    <div class="card"><h2>気づき</h2>${insightsHtml(rep.insights)}</div>
    <div class="card"><h2>ピリオドごとの得点</h2>
      ${chart(W => MB.groupedBars({ W, title: 'ピリオドごとの得点', aName: abbr(T.name), bName: abbr(O.name), unit: '点', subLabel: '差', groups: qline.map(q => ({ label: q.label, sub: sgn(q.net), a: { v: q.pf }, b: { v: q.pa } })) }))}
      <h3>ピリオド終了ごとの点差（自チーム目線）</h3>
      ${chart(W => MB.marginLine({ W, title: 'ピリオド終了ごとの点差', points: [{ label: '開始', v: 0, tip: ['0点差', '試合開始'] }, ...qline.map(q => ({ label: `${q.label}終了`, v: q.cumNet, tip: [sgn(q.cumNet), `${q.label}終了時点（${q.cumPf}−${q.cumPa}）`] }))] }))}
      <p class="hint">ピリオドの途中の点差の動きは、スコアシートからは分かりません（得点の記録は、チームごとに別々の列に書かれるため）。</p>
    </div>
    <div class="card"><h2>得点とフリースロー</h2>
      <div class="tiles-row">${tiles(T, sc.my)}${tiles(O, sc.opp)}${ftTile(esc(abbr(T.name)), rep.ft.my)}${ftTile(esc(abbr(O.name)), rep.ft.opp)}</div>
      <p class="hint">FT＝フリースロー。機会は、相手のファウル欄の P1・P2 などの数字の合計です（スコアシートには試投数が書かれないため）。</p>
      ${scorers.length ? `<h3>選手ごとの得点</h3>${chart(W => MB.kindsBar({ W, title: '選手ごとの得点', rows: scorers.map(p => ({ label: labMy(p), ft: p.ftPts, fg: p.fgPts, tp: p.tpPts, ftN: p.ftN, fgN: p.fgN, tpN: p.tpN, total: p.pts })) }))}` : ''}
    </div>
    <div class="card"><h2>選手（${esc(abbr(T.name))}）</h2>${playersTable(rep, 'my')}
      <p class="hint">出場のマスの数字は、そのピリオドに決めた得点です。点線の枠は、出場時限に斜線（／）以外の印があったピリオドです。＊は交代の印などで、プラスマイナスが参考値のもの。</p>
    </div>
    <div class="card"><h2>プラスマイナス</h2>
      ${pmRows.length ? chart(W => MB.plusMinus({ W, title: 'プラスマイナス', rows: pmRows.map(p => ({ label: labMy(p), v: p.pm, q: p.qCount, approx: p.pmApprox })) })) : ''}
      <p class="hint">その選手が出ていたピリオドの、チームの得失点差を足したものです。出場は「ピリオド単位」でしか記録されないため、あくまで目安です（同じピリオドに出た5人は同じ値になります）。</p>
    </div>
    <div class="card"><h2>ファウル</h2>
      <div class="tiles-row">${foulTile(T, { total: rep.fouls.my.total, give: rep.ft.opp.att })}${foulTile(O, { total: rep.fouls.opp.total, give: rep.ft.my.att })}</div>
      ${chart(W => MB.groupedBars({ W, title: 'ピリオドごとのファウル', aName: abbr(T.name), bName: abbr(O.name), unit: '個', groups: foulRows(rep) }))}
      ${foulCap}
    </div>
    <div class="card"><h2>5人の組み合わせ（ピリオドごと）</h2>
      <div class="scroll-x"><table class="ptable"><thead><tr><th>ピリオド</th><th class="l">出場メンバー</th><th>得点</th><th>失点</th><th>差</th></tr></thead><tbody>${lu}</tbody></table></div>
    </div>
    ${tos.length ? `<div class="card"><h2>タイムアウト</h2><div class="scroll-x"><table class="ptable"><thead><tr><th>チーム</th><th>ピリオド</th><th>経過</th><th>その後ピリオド終了時の差（その側から見て）</th></tr></thead><tbody>
      ${tos.map(([w, x]) => `<tr><td class="l">${w}</td><td class="l">${x.label}</td><td>${x.minute == null ? '–' : x.minute + '分'}</td><td>${x.net == null ? '–' : sgn(x.net)}</td></tr>`).join('')}</tbody></table></div>
      <p class="hint">数字は、タイムアウト欄に書かれた分（ピリオドの何分めか）です。両チームの得点の前後関係は記録がないので、取った直後の流れは分かりません。ここではそのピリオド全体の得失点差を示しています。</p></div>` : ''}
    <details class="fold card"><summary>相手チーム（${esc(abbr(O.name))}）の選手</summary>${playersTable(rep, 'opp')}</details>
    <details class="fold card"><summary>読み取りデータの確認（${chk.errors.length ? `<b style="color:var(--st-bad)">要確認 ${chk.errors.length}件</b>` : '整合性OK'}）</summary>${issuesHtml(chk)}
      <div class="row"><button class="btn" data-act="open" data-g="${g.id}">確認・修正へ</button></div></details>
    ${limitsHtml()}
    <div class="row no-print"><button class="btn" data-act="copySummary" data-g="${g.id}">気づきをテキストでコピー</button><button class="btn" data-act="exportOne" data-g="${g.id}">この試合のJSONを書き出す</button></div>`;
  }

  function limitsHtml() {
    return `<div class="card"><h2>この記録からは分からないこと</h2><ul class="cant">
      <li>シュートの試投数・成功率（FG%）。入った得点だけが記録されます</li>
      <li>リバウンド・アシスト・ターンオーバー・スティール</li>
      <li>同じピリオドの中での、両チームの得点の前後関係（リードチェンジ・連続得点）</li>
      <li>ピリオドの途中の交代（出場は「ピリオド単位」の記録です）</li>
      <li>欠席・ケガなど、出場しなかった理由</li></ul></div>`;
  }

  function viewTotalReport() {
    const gs = sortedGames().map(norm);
    if (!gs.length) return '<p>分析する試合がありません。</p>';
    const A = MB.analyzeMany(gs, { myKeyword: S.settings.myKeyword });
    const n = A.n;
    const gl = A.reports.map(r => `${r.meta.time || MB.gameTitle({ meta: r.meta })} vs ${abbr(r.oppName)}`);
    const dnp = A.neverPlayed.map(x => '#' + x);
    const lab = labeler(A.players);
    const scorers = A.players.filter(p => p.pts > 0);
    const pmRows = A.players.filter(p => p.qCount > 0).slice().sort((a, b) => b.pm - a.pm || b.qCount - a.qCount);
    const ptRows = A.players.filter(p => p.qCount > 0 || p.pts > 0).map(p => `<tr><td class="l"><span class="no">${esc(lab(p))}</span></td><td>${p.games}</td><td>${p.qCount}</td><td><b>${p.pts}</b></td><td>${p.ppq == null ? '–' : p.ppq}</td><td>${p.fgN}</td><td>${p.tpN}</td><td>${p.ftN}</td><td>${p.fouls}</td><td>${p.foul4 || '–'}</td><td>${p.qCount ? sgn(p.pm) + (p.pmApprox ? '＊' : '') : '–'}</td><td class="l dim">${A.reports.map((r, gi) => (p.perGame[gi] ? p.perGame[gi].pts : '–')).join(' / ')}</td></tr>`).join('');
    const qRows = A.quarters.map(q => `<td>${q.avgPf}</td>`).join('');
    const perGameRows = A.reports.map((r, gi) => `<tr><td class="l">${esc(gl[gi])}</td>${r.quarters.slice(0, 4).map(q => `<td class="${pn(q.net)}">${sgn(q.net)}</td>`).join('')}<td><b>${r.result.pf}−${r.result.pa}</b></td></tr>`).join('');
    const luRows = A.lineups.map(l => `<tr><td class="l"><span class="lineup">${l.members.map(m => `<span>#${esc(m)}</span>`).join('')}</span></td><td>${l.n}</td><td>${l.pf}</td><td>${l.pa}</td><td class="${pn(l.net)}"><b>${sgn(l.net)}</b></td><td class="l dim">${l.where.map(w => `${w.game + 1}試合目${Q[w.q]}`).join('・')}${l.approx ? ' ＊' : ''}</td></tr>`).join('');
    const foulByGame = A.reports.map((r, gi) => `<tr><td class="l">${esc(gl[gi])}</td><td>${r.fouls.my.total}</td><td>${r.fouls.opp.total}</td>${r.fouls.my.byQ.map(x => `<td>${x.exact ? x.lo : x.hi == null ? x.lo + '以上' : x.lo + '〜' + x.hi}</td>`).join('')}<td>${r.ft.my.made}/${r.ft.my.att}</td><td>${r.ft.opp.made}/${r.ft.opp.att}</td></tr>`).join('');
    return `
    <div class="card">
      <div class="hero">
        <div class="board" style="grid-template-columns:auto auto;justify-content:start;gap:18px">
          <div class="mid"><span class="score">${A.record.w}</span><span class="dash" style="font-size:22px">勝</span><span class="score">${A.record.l}</span><span class="dash" style="font-size:22px">敗${A.record.d ? ` ${A.record.d}分` : ''}</span></div>
        </div>
        <div class="result"><span class="big">得点 ${A.pf} − 失点 ${A.pa}（${sgn(A.diff)}）</span><small>${n}試合の平均 ${A.avgPf} − ${A.avgPa}</small></div>
      </div>
    </div>
    <div class="card"><h2>気づき</h2>${insightsHtml(A.insights)}</div>
    <div class="card"><h2>ピリオドごとの得失点差</h2>
      ${chart(W => MB.quarterDots({ W, title: 'ピリオドごとの得失点差', groups: A.quarters.map((q, k) => ({ label: q.label, dots: A.reports.map((r, gi) => ({ v: q.nets[gi], name: gl[gi] })) })) }))}
      <div class="scroll-x"><table class="ptable"><thead><tr><th>試合</th>${A.quarters.map(q => `<th>${q.label}</th>`).join('')}<th>結果</th></tr></thead><tbody>${perGameRows}
        <tr><td class="l"><b>平均の得点</b></td>${qRows}<td></td></tr><tr><td class="l"><b>平均の失点</b></td>${A.quarters.map(q => `<td>${q.avgPa}</td>`).join('')}<td></td></tr>
        <tr><td class="l"><b>平均の差</b></td>${A.quarters.map(q => `<td class="${pn(q.avgNet)}"><b>${sgn(q.avgNet)}</b></td>`).join('')}<td></td></tr></tbody></table></div>
    </div>
    <div class="card"><h2>選手ごとの通算</h2>
      <div class="scroll-x"><table class="ptable"><thead><tr><th>選手</th><th>出場試合</th><th>出場Q</th><th>得点</th><th>1Q平均</th><th>2点</th><th>3点</th><th>FT</th><th>ファウル</th><th>4F以上</th><th>±</th><th class="l">試合ごとの得点</th></tr></thead><tbody>${ptRows}</tbody></table></div>
      ${dnp.length ? `<p class="hint">${n}試合とも出場の印がない登録選手：${dnp.join(' ')}（欠席・ケガ等かは記録から分かりません）</p>` : ''}
      ${scorers.length ? `<h3>得点の内訳</h3>${chart(W => MB.kindsBar({ W, title: '選手ごとの通算得点', rows: scorers.map(p => ({ label: lab(p), ft: p.ftPts, fg: p.fgPts, tp: p.tpPts, ftN: p.ftN, fgN: p.fgN, tpN: p.tpN, total: p.pts })) }))}` : ''}
    </div>
    <div class="card"><h2>プラスマイナス（通算）</h2>
      ${pmRows.length ? chart(W => MB.plusMinus({ W, title: 'プラスマイナス（通算）', rows: pmRows.map(p => ({ label: lab(p), v: p.pm, q: p.qCount, approx: p.pmApprox })) })) : ''}
      <p class="hint">出ていたピリオドの得失点差の合計です。出場するピリオド数が違う選手を比べるときは、出場Qの数も見てください。</p>
    </div>
    <div class="card"><h2>ファウルとフリースロー</h2>
      <div class="tiles-row"><div class="tile"><span class="tl">自チームのフリースロー</span><span class="tv">${A.ft.my.made}/${A.ft.my.att}<small>（${A.ft.my.pct ?? '–'}%）</small></span><span class="ts">成功 / 機会</span></div>
        <div class="tile"><span class="tl">相手のフリースロー</span><span class="tv">${A.ft.opp.made}/${A.ft.opp.att}<small>（${A.ft.opp.pct ?? '–'}%）</small></span><span class="ts">成功 / 機会</span></div>
        <div class="tile"><span class="tl">ファウル（自／相手）</span><span class="tv">${A.fouls.my.total}／${A.fouls.opp.total}</span><span class="ts">1試合平均 ${(A.fouls.my.total / n).toFixed(1)}／${(A.fouls.opp.total / n).toFixed(1)}</span></div></div>
      <div class="scroll-x"><table class="ptable"><thead><tr><th>試合</th><th>自ファウル</th><th>相手</th>${Q.slice(0, 4).map(q => `<th>${q}</th>`).join('')}<th>自FT</th><th>相手FT</th></tr></thead><tbody>${foulByGame}</tbody></table></div>
      <p class="hint">ピリオド別は自チームのファウル数（インクの色から割り出し。幅があるものは範囲）です。</p>
    </div>
    <div class="card"><h2>5人の組み合わせ</h2>
      <div class="scroll-x"><table class="ptable"><thead><tr><th class="l">出場メンバー</th><th>回数</th><th>得点</th><th>失点</th><th>差</th><th class="l">どのピリオド</th></tr></thead><tbody>${luRows}</tbody></table></div>
      <p class="hint">同じ5人の組み合わせは、試合をまたいでまとめています。1回ぶんは1ピリオドです（回数が少ないので、目安として）。</p>
    </div>
    ${limitsHtml()}
    <div class="row no-print"><button class="btn" data-act="copyTotal">気づきをテキストでコピー</button><button class="btn" data-act="exportAll">全試合をJSONで書き出す</button><button class="btn" data-act="exportCsv">選手の通算をCSVで書き出す</button></div>`;
  }

  function viewReport() {
    const gs = sortedGames();
    if (!gs.length) return '<div class="card"><p>分析する試合がありません。写真を読み取るか、サンプルを開いてください。</p><div class="row"><button class="btn" data-act="step" data-s="input">写真の画面へ</button></div></div>';
    if (S.tab !== 'total' && !gs.some(g => g.id === S.tab)) S.tab = 'total';
    const tabs = [`<button role="tab" data-act="tab" data-t="total" aria-selected="${S.tab === 'total'}"><span class="t1">通算（${gs.length}試合）</span><span class="t2">自チームのまとめ</span></button>`]
      .concat(gs.map(g => { const n = norm(g), my = MB.pickMine(n, S.settings.myKeyword); return `<button role="tab" data-act="tab" data-t="${g.id}" aria-selected="${S.tab === g.id}"><span class="t1">${esc(MB.gameTitle(g.raw))}</span><span class="t2">vs ${esc(abbr(n.teams[1 - my].name))} ${n.teams[my].final}−${n.teams[1 - my].final}</span></button>`; }));
    const body = S.tab === 'total' ? viewTotalReport() : viewGameReport(game(S.tab));
    return `
      <div class="sect-head"><h2>分析</h2>${S.demo ? '<span class="hint">サンプルを表示中</span>' : ''}</div>
      <div class="tabs no-print" role="tablist">${tabs.join('')}</div>
      ${body}`;
  }

  // ════════ 書き出し ═════════════════════════════════════════════════
  function summaryText(rep, title) {
    return `【${title}】\n` + rep.insights.filter(i => i.tag !== 'note').map(i => '・' + i.text).join('\n');
  }
  function csvOfTotals() {
    const A = MB.analyzeMany(sortedGames().map(norm), { myKeyword: S.settings.myKeyword });
    const rows = [['背番号', '名前', '出場試合', '出場Q', '得点', '1Q平均', '2点本数', '3点本数', 'FT本数', 'ファウル', '4ファウル以上の回数', 'プラスマイナス']];
    A.players.forEach(p => rows.push([p.no, p.name, p.games, p.qCount, p.pts, p.ppq == null ? '' : p.ppq, p.fgN, p.tpN, p.ftN, p.fouls, p.foul4, p.pm]));
    return '﻿' + rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\r\n');
  }

  // ════════ イベント ═════════════════════════════════════════════════
  function onClick(e) {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const a = b.dataset.act;
    if (a === 'step') { if (b.dataset.s === 'review' && !cur()) return; go(b.dataset.s); }
    else if (a === 'tab') { S.tab = b.dataset.t; render(); }
    else if (a === 'goTab') go('report', { tab: b.dataset.g });
    else if (a === 'open') { S.sel = b.dataset.g; go('review'); }
    else if (a === 'read') { const it = S.items.find(x => x.id === b.dataset.id); if (it) enqueue(it), render(); }
    else if (a === 'cancel') { const it = S.items.find(x => x.id === b.dataset.id); if (it && it.ctl) it.ctl.abort(); }
    else if (a === 'cancelRepair') { if (S.repairCtl) S.repairCtl.abort(); }
    else if (a === 'rmItem') { S.items = S.items.filter(x => x.id !== b.dataset.id); S.queue = S.queue.filter(x => x.id !== b.dataset.id); render(); }
    else if (a === 'reread') { const it = S.items.find(x => x.id === b.dataset.id); if (it) { it.keepRect = true; enqueue(it); } }
    else if (a === 'repair') repair(b.dataset.scope);
    else if (a === 'mark') {
      const g = cur(), p = g.raw.teams[+b.dataset.t].players[+b.dataset.p], q = +b.dataset.q;
      p.marks = p.marks || ['', '', '', '']; const order = ['', '/', '\\', 'X']; p.marks[q] = order[(order.indexOf(p.marks[q] || '') + 1) % 4];
      b.setAttribute('aria-pressed', p.marks[q] ? 'true' : 'false'); b.textContent = p.marks[q] === '/' ? '／' : p.marks[q] === '\\' ? '＼' : p.marks[q] === 'X' ? '✕' : Q[q][0]; refreshReview();
    }
    else if (a === 'addPlayer') { const g = cur(); g.raw.teams[+b.dataset.t].players.push({ no: '', name: '', marks: ['', '', '', ''], fouls: [] }); render(); }
    else if (a === 'delPlayer') { const g = cur(); g.raw.teams[+b.dataset.t].players.splice(+b.dataset.p, 1); render(); }
    else if (a === 'analyze') confirmCurrent(true);
    else if (a === 'nextPending') { confirmCurrent(false).then(() => { const nx = S.games.find(x => x.src === 'photo' && !x.confirmed); if (nx) { S.sel = nx.id; go('review'); } else go('report', { tab: S.sel }); }); }
    else if (a === 'del') {
      if (S.delArm !== b.dataset.g) { S.delArm = b.dataset.g; render(); return; }
      const g = game(b.dataset.g); S.delArm = null;
      if (g) { MB.remove(g.key || MB.makeKey(g.raw)).catch(() => {}); S.games = S.games.filter(x => x.id !== g.id); toast('削除しました'); }
      render();
    }
    else if (a === 'sample') {
      if (S.demo) { S.games = S.games.filter(g => g.src !== 'sample'); S.demo = false; render(); return; }
      (MB.SAMPLES || []).forEach(raw => S.games.push({ id: nid('g'), raw: JSON.parse(JSON.stringify(raw)), confirmed: true, src: 'sample' }));
      S.demo = true; go('report', { tab: 'total' });
    }
    else if (a === 'blank') { const g = putGame(MB.emptyRaw(10), { src: 'json' }); S.sel = g.id; go('review'); }
    else if (a === 'copyPrompt') copyText(MB.buildFullPrompt({ noNames: S.settings.noNames }));
    else if (a === 'importPaste') {
      try { const raw = MB.coerceRaw(MB.parseLooseJson($('#pasteBox').value)); const g = putGame(raw, { src: 'json' }); S.manualText = ''; S.sel = g.id; go('review'); }
      catch (err) { toast('読み込めませんでした：' + err.message); }
    }
    else if (a === 'copySummary') { const g = game(b.dataset.g); const n = norm(g); copyText(summaryText(MB.analyzeGame(n, MB.pickMine(n, S.settings.myKeyword)), MB.gameTitle(g.raw))); }
    else if (a === 'copyTotal') { const A = MB.analyzeMany(sortedGames().map(norm), { myKeyword: S.settings.myKeyword }); copyText(summaryText(A, `通算 ${A.n}試合`)); }
    else if (a === 'exportOne') { const g = game(b.dataset.g); saveFile(`minibasket-${MB.makeKey(g.raw)}.json`, MB.exportJson([g.raw]), 'application/json'); }
    else if (a === 'exportAll') saveFile('minibasket-games.json', MB.exportJson(sortedGames().map(g => g.raw)), 'application/json');
    else if (a === 'exportCsv') saveFile('minibasket-players.csv', csvOfTotals(), 'text/csv');
  }

  function onChange(e) {
    const t = e.target;
    if (t.id === 'file') { addFiles(t.files); t.value = ''; }
    else if (t.id === 'importFile') {
      const f = t.files[0]; t.value = ''; if (!f) return;
      f.text().then(txt => {
        const raws = MB.parseImport(JSON.parse(txt)); if (!raws.length) throw new Error('試合のデータが見つかりません');
        raws.forEach(raw => { const g = putGame(raw, { src: 'json', confirmed: true }); g.confirmed = true; g.key = MB.makeKey(raw); MB.put(g.key, raw).then(() => { S.store = MB.storeInfo(); }).catch(() => {}); });
        toast(`${raws.length}試合を取り込みました`); go('report', { tab: 'total' });
      }).catch(err => toast('取り込めませんでした：' + err.message));
    }
    else if (t.id === 'kw') { S.settings.myKeyword = t.value.trim(); MB.putSettings(S.settings).catch(() => {}); }
    else if (t.id === 'noNames') { S.settings.noNames = t.checked; MB.putSettings(S.settings).catch(() => {}); render(); }
    else if (t.dataset && t.dataset.f) onField(t);
    else if (t.dataset && t.dataset.rng) { rangeChanged(t); }
  }
  function rangeChanged(t) {
    const it = S.items.find(x => x.id === t.dataset.id); if (!it) return;
    const v = {}; $$('input[data-rng]').forEach(r => { v[r.dataset.rng] = +r.value / 100; });
    const x = v.l, y = v.t, w = Math.max(0.2, 1 - v.l - v.r), h = Math.max(0.2, 1 - v.t - v.b);
    it.rect = { x, y, w, h }; it.detected = true; it.keepRect = true;
    const box = $('#rectBox'); if (box) { box.style.left = x * 100 + '%'; box.style.top = y * 100 + '%'; box.style.width = w * 100 + '%'; box.style.height = h * 100 + '%'; }
  }
  function onInput(e) { if (e.target.id === 'pasteBox') S.manualText = e.target.value; if (e.target.dataset && e.target.dataset.rng) rangeChanged(e.target); }

  document.addEventListener('click', onClick);
  document.addEventListener('change', onChange);
  document.addEventListener('input', onInput);
  document.addEventListener('dragover', e => { const d = e.target.closest && e.target.closest('#drop'); if (d) { e.preventDefault(); d.classList.add('over'); } });
  document.addEventListener('dragleave', e => { const d = e.target.closest && e.target.closest('#drop'); if (d) d.classList.remove('over'); });
  document.addEventListener('drop', e => { const d = e.target.closest && e.target.closest('#drop'); if (d) { e.preventDefault(); d.classList.remove('over'); addFiles(e.dataTransfer.files); } });

  // ════════ 起動 ═════════════════════════════════════════════════════
  async function detectProvider() {
    try {
      if (window.claude && window.claude.use) {
        const sample = await window.claude.use('sample');
        if (sample) {
          let lim = null; try { lim = await sample.limits(); } catch (e) { /* noop */ }
          if (lim && lim.images && lim.images.maxCount >= 3) return { kind: 'claude', sample };
        }
      }
    } catch (e) { /* 次へ */ }
    return { kind: 'manual' };
  }

  async function start() {
    shell(); render();
    S.provider = await detectProvider();
    await MB.init(); S.store = MB.storeInfo();
    try { Object.assign(S.settings, await MB.getSettings()); if (!S.settings.myKeyword) S.settings.myKeyword = CFG.myKeyword; } catch (e) { /* noop */ }
    try { (await MB.list()).forEach(r => S.games.push({ id: nid('g'), raw: r.raw, confirmed: true, src: 'saved', key: r.key })); } catch (e) { /* noop */ }
    if (S.games.length) { S.tab = 'total'; }
    render();
    window.MBApp = { S, go, render };   // 動作確認用
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
