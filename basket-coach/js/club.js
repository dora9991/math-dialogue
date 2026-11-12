/* クラブの画面：コーチがつくった級（きゅう）に チャレンジ → 写真をつけて提出 → コーチが評価・認定 → ひろばで いいね。
   サーバーは Supabase（club/schema.sql の bg_* 関数）。接続先は js/club-config.js（BC.CLUB_CONFIG）。
   BC.club.render(el, ctx, sub)
     sub（#club/…）：''（ホーム）・'feed'（ひろば）・'task/<id>'（課題）・'coach'（コーチのログイン）・'create'（クラブをつくる）・
       コーチだけ：'review'（確認）・'members'・'member/<id>'・'design'（級をつくる）・'settings'・'cards'（ログインカード）
       v2：子ども 'quests'（自主練）・'quest/<id>'・'events'（予定）／コーチ 'quests'・'quest/<id>'・'quest-new'・'quest-edit/<id>'・
           'events'・'event/<id>'・'event-new'・'event-edit/<id>'・'applies'（体験・入団の申し込み）／だれでも 'apply/<コード>'（申し込みページ）
     ctx：{ toast, modal, closeModal, ic, drillArt, addActs, confetti, shares, checks }（app.js から）
   BC.club.homeHTML() … ホームに出す小さなカード（ログインしていれば、いまの級と お知らせ）
   BC.club.refresh() … お知らせの数を読みなおす（タブの赤い点）。BC.club.onBadge = (n) => … で知らせる
   この端末に残すもの（localStorage）：bc.club（ログインのトークン・クラブ・自分）・bc.club.seen（お祝いした合格）・bc.club.cache（ホームの級の表示用） */
(function () {
  const BC = window.BC;
  const C = (BC.club = BC.club || {});
  const KEY = 'bc.club';
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const S = { sess: null, home: null, feed: null, feedEnd: false, queue: null, members: null, draft: null, pins: {}, upload: null, photos: {}, el: null, sub: '', busy: false, badge: 0, msg: '' };
  let X = {};
  const ic = (n, cls) => (X.ic ? X.ic(n, cls) : '');
  const ls = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* なし */ } },
  };
  S.sess = ls.get(KEY, null);

  /* ---------- 通信 ---------- */
  const cfg = () => BC.CLUB_CONFIG || {};
  C.ready = () => !!(cfg().url && cfg().key);
  async function rpc(fn, args) {
    const { url, key } = cfg();
    let r;
    try {
      r = await fetch(`${url}/rest/v1/rpc/${fn}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: key, Authorization: `Bearer ${key}` },
        body: JSON.stringify(args || {}),
      });
    } catch (e) { return { error: 'net' }; }
    /* 404：サーバー側（club/schema.sql）が まだ入っていない */
    if (!r.ok) return { error: r.status === 404 ? 'setup' : 'http', status: r.status };
    const j = await r.json().catch(() => null);
    if (j && j.error === 'auth' && S.sess) { setSess(null); S.msg = 'ログインが切れました。もう一度 ログインしてね。'; }
    return j || { error: 'http' };
  }
  const tok = () => (S.sess ? S.sess.token : '');
  const ERR = {
    net: 'インターネットに つながっていないみたい。つながる所で もう一度。',
    http: 'サーバーと うまく話せませんでした。少しまってから もう一度。',
    setup: 'クラブの サーバーを じゅんびしています。もう少し まってね。',
    auth: 'ログインが切れました。もう一度 ログインしてね。',
    bad_login: 'クラブコード・ばんごう・あいことば（コーチは合言葉）の どれかが ちがいます。',
    locked: 'まちがいが続いたので、少し時間をおいてから ためしてね。',
    weak_password: '合言葉は 8文字以上で、かんたんすぎないものに してください。',
    bad_name: '名前を入れてください。',
    bad_coach: 'コーチの名前を入れてください。',
    need_photo: 'この課題は、写真が必要です。',
    no_photo: '写真は のせられません。',
    bad_photo: '写真を読みこめませんでした。べつの写真で ためしてね。',
    photo_big: '写真が大きすぎます。',
    photo_full: 'クラブの写真が いっぱいです。コーチに伝えてね。',
    ng_word: 'だれかが いやな気持ちになる ことばが あるみたい。やさしい ことばで 書きなおそう。',
    no_link: 'URL（リンク）は のせられません。',
    private_info: '電話番号のような 長い数字は のせられません。',
    empty: 'なにか 書いてね。',
    not_coach: 'コーチだけが できます。',
    not_kid: 'コーチは 提出できません。',
    too_many: 'これ以上 ふやせません。',
    bad_task: 'その課題は もうありません（コーチが直したのかも）。',
    bad_count: '数を たしかめてね。',
    bad_member: 'そのメンバーは いません。',
    bad_level: 'その級は ありません。',
    bad_levels: '級を1つ以上 つくってください。',
    bad_sub: 'その提出は ありません。',
    bad_post: 'その投稿は ありません。',
    bad_date: '日付を たしかめてください。',
    bad_quest: 'その自主練は ありません（おわったのかも）。',
    not_yet: 'この自主練は まだ はじまっていません。',
    quest_over: 'この自主練は もう おわりました。',
    today_full: 'きょうは もう 3回 きろくしました。また あした！',
    bad_log: 'その記録は ありません。',
    bad_event: 'その予定は ありません。',
    event_closed: 'しめきりを すぎています。コーチに 伝えてね。',
    full: '定員が いっぱいです。',
    bad_answer: 'こたえを えらんでね。',
    bad_contact: '連絡先は、電話番号（10〜13けた）か メールアドレスを 入れてください。',
    bad_kind: '申し込みの 種類を えらんでください。',
    closed: 'いまは 申し込みを 受けつけていません。',
    bad_apply: 'その申し込みは ありません。',
    bad_track: 'その級の種類は ありません。',
    last_track: 'さいごの 1種類は しまえません。',
  };
  const errMsg = (j) => ERR[(j && j.error) || 'http'] || 'うまくいきませんでした。もう一度 ためしてね。';

  function setSess(s) {
    S.sess = s;
    ls.set(KEY, s);
    if (!s) { S.home = S.feed = S.queue = S.members = S.draft = null; S.photos = {}; ls.set('bc.club.cache', null); setBadge(0); }
  }
  const isCoach = () => S.sess && S.sess.me && S.sess.me.role === 'coach';

  /* ---------- 小さな部品 ---------- */
  // 級の色（帯の色）と、その上の字の色（明るい色には黒い字）
  function kv(color) {
    const m = /^#?([0-9a-f]{6})$/i.exec(color || '');
    const c = m ? '#' + m[1] : '#888888';
    const n = parseInt(c.slice(1), 16);
    const light = (0.299 * (n >> 16 & 255) + 0.587 * (n >> 8 & 255) + 0.114 * (n & 255)) / 255 > 0.62;
    return `--k:${c};--kt:${light ? '#1f2328' : '#fff'};--ks:${light ? 'none' : '0 1px 1px rgba(0,0,0,.35)'}`;
  }
  const kyuBadge = (k, cls = '') => (k ? `<span class="cl-kyu ${cls}" style="${kv(k.color)}">${esc(k.name)}</span>` : `<span class="cl-kyu none ${cls}">級なし</span>`);
  const avatar = (m) => `<span class="cl-av${m && m.role === 'coach' ? ' coach' : ''}" style="${kv((m && m.kyu && m.kyu.color) || '#9aa3ab')}">${m && m.role === 'coach' ? ic('whistle') : esc(String((m && m.nickname) || '?').slice(0, 1))}</span>`;
  const GRADES = { e12: '小1・2', e34: '小3・4', e56: '小5・6', j1: '中1', j2: '中2', j3: '中3', h: '高校', a: 'おとな' };
  function ago(ts) {
    const t = new Date(ts).getTime(), d = (Date.now() - t) / 1000;
    if (d < 60) return 'たった今';
    if (d < 3600) return `${Math.floor(d / 60)}分まえ`;
    if (d < 86400) return `${Math.floor(d / 3600)}時間まえ`;
    if (d < 172800) return 'きのう';
    const x = new Date(t);
    return `${x.getMonth() + 1}/${x.getDate()}`;
  }
  const STATUS = { pending: ['確認まち', 'wait'], pass: ['合格', 'pass'], retry: ['もう一度', 'retry'] };
  const pill = (st) => (st ? `<span class="cl-st ${STATUS[st][1]}">${STATUS[st][0]}</span>` : '<span class="cl-st">まだ</span>');
  const STAMPS = [['like', 'いいね', '👍'], ['nice', 'ナイス', '👏'], ['wow', 'すごい', '🌟'], ['cheer', 'がんばれ', '💪']];
  const loading = () => `<div class="cl-loading" role="status"><span class="cl-spin"></span>よみこみ中…</div>`;
  const backLink = (href, label) => `<a class="back-btn" href="${href}">${ic('back')}${esc(label || 'もどる')}</a>`;
  const drill = (id) => (id && BC.get ? BC.get(id) : null);
  // v2 の部品
  const STAMPS_COACH = [['clap', '拍手', '👏'], ['good', 'いいね', '👍'], ['angry', '怒り', '😠']];
  const KINDS = { practice: '練習', game: '練習試合', tournament: '大会', camp: '合宿', trial: '体験会', other: 'その他' };
  const ANSWERS = [['yes', '参加する', 'check'], ['maybe', 'まだ わからない', 'clock'], ['no', '参加しない', 'close']];
  const WD = ['日', '月', '火', '水', '木', '金', '土'];
  function fmtDay(v) { // 'YYYY-MM-DD' → 「11/14（土）」
    if (!v) return '';
    const [y, m, d] = String(v).slice(0, 10).split('-').map(Number);
    return `${m}/${d}（${WD[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]}）`;
  }
  const addDays = (v, n) => { const [y, m, d] = String(v).slice(0, 10).split('-').map(Number); return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10); };
  // 日本の「きょう」（サーバーの today があれば それ）
  const today = () => (S.home && S.home.today) || new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
  const daysLeft = (end) => Math.round((Date.parse(String(end).slice(0, 10) + 'T00:00:00Z') - Date.parse(today() + 'T00:00:00Z')) / 86400e3);
  const tracksOf = (h) => (h && h.tracks) || [];
  const levelsOf = (h, tid) => ((h && h.levels) || []).filter((l) => !tid || l.track_id === tid);
  const trackName = (h, tid) => (tracksOf(h).find((t) => t.id === tid) || {}).name || '';
  // 「ドリブル 7級」（メインの「総合」は 級だけ）
  const kyuLabel = (k, tname) => { const tn = tname != null ? tname : k && k.track; return k ? `${tn && tn !== '総合' ? tn + ' ' : ''}${k.name}` : ''; };
  const stampOf = (k) => STAMPS_COACH.find((x) => x[0] === k) || ['', '', ''];
  // コーチの 拍手・いいね・怒り（だれが）
  const creactRow = (list) => (list && list.length ? `<div class="cl-creacts">${list.map((r) => `<span class="cl-creact ${esc(r.stamp)}"><span aria-hidden="true">${stampOf(r.stamp)[2]}</span><b>${esc(stampOf(r.stamp)[1])}</b><small>${esc(r.by)}</small>${r.comment ? `<span class="cl-creact-c">「${esc(r.comment)}」</span>` : ''}</span>`).join('')}</div>` : '');
  const creactBtns = (kind, id, list) => {
    const mine = (list || []).find((r) => S.sess && r.coach_id === S.sess.me.id);
    return `<div class="cl-cbtns" role="group" aria-label="コーチから">${ic('whistle', 'inline')}${STAMPS_COACH.map(([k, label, e]) => `<button type="button" class="cl-cbtn ${k}" data-cl="creact" data-kind="${kind}" data-id="${id}" data-k="${k}" aria-pressed="${!!(mine && mine.stamp === k)}"><span aria-hidden="true">${e}</span>${label}</button>`).join('')}</div>`;
  };

  /* ---------- 写真：小さくしてから送る（長い辺 960px・300KB まで） ---------- */
  async function shrink(file) {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((ok, ng) => { const i = new Image(); i.onload = () => ok(i); i.onerror = ng; i.src = url; });
      for (const max of [960, 800, 640]) {
        const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
        const cv = document.createElement('canvas');
        cv.width = Math.max(1, Math.round(img.naturalWidth * k));
        cv.height = Math.max(1, Math.round(img.naturalHeight * k));
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
        for (const q of [0.8, 0.68, 0.56]) {
          const d = cv.toDataURL('image/jpeg', q);
          const b64 = d.slice(d.indexOf(',') + 1);
          if (b64.length * 0.75 < 280000) return { b64, mime: 'image/jpeg', url: d };
        }
      }
      return null;
    } catch (e) { return null; } finally { URL.revokeObjectURL(url); }
  }
  // 写真の表示（あとから読みこむ）
  const photoTag = (id, cls = '') => (id ? `<button type="button" class="cl-photo ${cls}" data-cl="zoom" data-id="${esc(id)}" aria-label="写真を大きく"><span class="cl-photo-in" data-photo="${esc(id)}"><span class="cl-spin"></span></span></button>` : '');
  async function hydratePhotos(root) {
    const els = [...root.querySelectorAll('[data-photo]')];
    for (const el of els) {
      const id = el.dataset.photo;
      if (!S.photos[id]) {
        const j = await rpc('bg_photo', { p_token: tok(), p_id: id });
        S.photos[id] = j && j.ok ? `data:${j.mime};base64,${j.data}` : 'x';
      }
      if (el.isConnected) el.innerHTML = S.photos[id] === 'x' ? '<span class="cl-photo-x">写真を見られません</span>' : `<img src="${S.photos[id]}" alt="写真">`;
    }
  }

  /* ---------- 画面の入り口 ---------- */
  C.render = function (el, ctx, sub) {
    X = ctx || X;
    S.el = el;
    S.sub = sub || '';
    if (!C.ready()) { el.innerHTML = `<h1 class="page-h">クラブ</h1><p class="empty">このアプリでは、クラブの機能が まだ使えません（接続先が ありません）。</p>`; return; }
    if (S.sub.startsWith('apply/')) return applyPublicPage(S.sub.slice(6)); // 保護者の申し込みページ（ログインなし）
    if (!S.sess) {
      if (S.sub === 'create') return createPage();
      if (S.sub === 'coach') return coachLoginPage();
      return welcomePage();
    }
    if (isCoach()) {
      const [a, b] = S.sub.split('/');
      if (a === 'review') return reviewPage();
      if (a === 'members') return membersPage();
      if (a === 'member') return memberPage(b);
      if (a === 'design') return designPage();
      if (a === 'settings') return settingsPage();
      if (a === 'cards') return cardsPage();
      if (a === 'feed') return feedPage();
      if (a === 'quests') return coachQuestsPage();
      if (a === 'quest') return coachQuestPage(b);
      if (a === 'quest-new') return questFormPage(null);
      if (a === 'quest-edit') return questFormPage(b);
      if (a === 'events') return coachEventsPage();
      if (a === 'event') return coachEventPage(b);
      if (a === 'event-new') return eventFormPage(null);
      if (a === 'event-edit') return eventFormPage(b);
      if (a === 'applies') return appliesPage();
      return coachHome();
    }
    const [a, b] = S.sub.split('/');
    if (a === 'feed') return feedPage();
    if (a === 'task') return taskPage(b);
    if (a === 'quests') return kidQuestsPage();
    if (a === 'quest') return questPage(b);
    if (a === 'events') return kidEventsPage();
    return kidHome();
  };
  const paint = (html) => { if (S.el) { S.el.innerHTML = html; hydratePhotos(S.el); hydrateArt(S.el); } };
  // 練習メニューの小さな絵（app.js の drillArt を使う）
  function hydrateArt() { /* drillArt は HTML を返すので、描くときに入れている */ }
  const rerender = () => C.render(S.el, X, S.sub);
  function go(hash) { if (location.hash.slice(1) === hash) rerender(); else location.hash = hash; }

  /* ---------- ログインしていない ---------- */
  // クラブのサーバー（club/schema.sql）が まだ入っていないか（404）。クラブのページを ひらいたときだけ 1回しらべる
  async function serverReady() {
    if (S.ready == null) { const j = await rpc('bg_apply_info', { p_code: 'ZZZZZZZZ' }); S.ready = !(j && j.error === 'setup'); }
    return S.ready;
  }
  function probeBanner() {
    serverReady().then((ok) => {
      const el = document.getElementById('cl-probe');
      if (el && !ok) el.innerHTML = `<p class="cl-msg">${ic('warn')}<span>クラブの サーバーを じゅんびしています。コーチの じゅんびが おわるまで、クラブは まだ 使えません。ほかの機能（これ1つ・れんしゅう・チェック）は いつもどおり 使えます。</span></p>`;
    });
  }
  function welcomePage() {
    const msg = S.msg; S.msg = '';
    paint(`<section class="cl-hero">
        <div class="cl-hero-ic">${ic('trophy')}</div>
        <h1 class="page-h">クラブ</h1>
        <p>コーチが つくった <b>級（きゅう）</b>に チャレンジ！ 写真をつけて送ると、コーチが見て「合格」を返してくれます。クラブの なかまと、がんばったことを 見せあって「いいね」できます。</p>
      </section>
      ${msg ? `<p class="cl-msg">${esc(msg)}</p>` : ''}
      <div id="cl-probe"></div>
      <section class="card">
        <h2 class="sec-h">${ic('person')}子どもの ログイン</h2>
        <p class="small">コーチから もらった ログインカードを 見て 入れてね。</p>
        <form class="cl-form" data-clform="kid" autocomplete="off">
          <label class="field"><span class="field-l">クラブコード</span><input name="code" inputmode="latin" autocapitalize="characters" maxlength="6" placeholder="例：K7X2QP" required></label>
          <label class="field"><span class="field-l">ばんごう</span><input name="no" inputmode="numeric" pattern="[0-9]*" maxlength="3" placeholder="例：12" required></label>
          <label class="field"><span class="field-l">あいことば（6けたの数字）</span><input name="pin" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="current-password" required></label>
          <button type="submit" class="btn primary big">${ic('next')}ログイン</button>
        </form>
      </section>
      <section class="card">
        <h2 class="sec-h">${ic('whistle')}コーチの方</h2>
        <div class="btns"><a class="btn" href="#club/coach">コーチとして ログイン</a><a class="btn" href="#club/create">クラブを つくる</a></div>
        <p class="small">子どものアカウントは、コーチがつくります（メールアドレスは いりません）。記録や写真は、クラブの中だけで見られます。</p>
      </section>`);
    probeBanner();
  }
  function coachLoginPage() {
    paint(`${backLink('#club')}<h1 class="page-h">コーチの ログイン</h1>
      <form class="card cl-form" data-clform="coach" autocomplete="on">
        <label class="field"><span class="field-l">クラブコード</span><input name="code" maxlength="6" autocapitalize="characters" required></label>
        <label class="field"><span class="field-l">あなたの名前（例：たなかコーチ）</span><input name="name" maxlength="12" autocomplete="nickname" required></label>
        <label class="field"><span class="field-l">コーチの合言葉</span><input name="pass" type="password" autocomplete="current-password" required></label>
        <button type="submit" class="btn primary big">ログイン</button>
        <p class="small">はじめての名前なら、そのクラブのコーチが1人ふえます（同じ合言葉を知っているコーチだけ）。</p>
      </form>`);
  }
  function createPage() {
    paint(`${backLink('#club')}<h1 class="page-h">クラブを つくる</h1>
      <form class="card cl-form" data-clform="create" autocomplete="off">
        <label class="field"><span class="field-l">クラブの名前</span><input name="name" maxlength="30" placeholder="例：さくらミニバス" required></label>
        <label class="field"><span class="field-l">あなたの名前（コーチ）</span><input name="coach" maxlength="12" placeholder="例：たなかコーチ" required></label>
        <label class="field"><span class="field-l">コーチの合言葉（8文字以上）</span><input name="pass" type="password" autocomplete="new-password" minlength="8" required></label>
        <label class="field"><span class="field-l">もう一度</span><input name="pass2" type="password" autocomplete="new-password" minlength="8" required></label>
        <fieldset class="field"><legend class="field-l">級（きゅう）の 種類</legend>
          <p class="small">「総合」（10級 → 1級・各級に 課題4つ）に くわえて、スキルごとの級（各級に 課題2つ）も つくれます。課題・回数・写真の有無は、あとで「級をつくる」で 自由に直せます。</p>
          <div class="cl-pick-list">${(BC.KYU_TRACKS || []).map((t) => `<label class="cl-pick-k"><input type="checkbox" name="tr" value="${t.key}" checked>${esc(t.name)}（${t.levels.length}級）</label>`).join('')}</div></fieldset>
        <button type="submit" class="btn primary big">${ic('plus')}つくる</button>
        <p class="small">合言葉は わすれないように。ほかのコーチにも、この合言葉で入ってもらいます。<br>子どもの記録・写真は、このクラブの中だけで使われます。保護者の方の了解をとってから はじめてください。</p>
      </form>`);
  }

  /* ---------- 子ども：ホーム（級にチャレンジ） ---------- */
  async function loadHome() {
    const j = await rpc('bg_home', { p_token: tok() });
    if (!j.ok) return j;
    S.home = j;
    S.sess.me = j.me; S.sess.club = { id: j.club.id, code: j.club.code, name: j.club.name };
    ls.set(KEY, S.sess);
    ls.set('bc.club.cache', { me: j.me, club: S.sess.club, next: nextLevel(j), q: activeQuests(j).filter((q) => q.n < q.times).length, at: Date.now() });
    setBadge(noticeCount(j));
    return j;
  }
  const noticeCount = (h) => (h.me.role === 'coach'
    ? (h.counts.pending || 0) + (h.counts.waiting || 0) + (h.counts.ready || 0) + (h.counts.applies || 0)
    : (h.notices.reviews || 0) + (h.notices.certs || 0) + (h.notices.reacts || 0) + (h.notices.coach || 0) + (h.notices.quests || 0) + (h.notices.events || 0));
  // 自主練のじょうたい：soon（これから）・now（いま）・over（おわり）
  const qState = (q) => (q.archived || String(q.end_on) < today() ? 'over' : String(q.start_on) > today() ? 'soon' : 'now');
  const activeQuests = (h) => ((h && h.quests) || []).filter((q) => qState(q) === 'now');
  function setBadge(n) { S.badge = n; if (C.onBadge) C.onBadge(n); }
  // 「見た」で消えるお知らせ（予定の へんじ は、答えるまで のこす）
  function clearNotices(h) { if (h && h.notices) for (const k of ['reviews', 'certs', 'reacts', 'coach', 'quests']) h.notices[k] = 0; }
  const certSet = (h) => new Set((h.certs || []).map((c) => c.level_id));
  const latestSub = (h, taskId) => (h.subs || []).find((s) => s.task_id === taskId) || null;
  const passed = (h, taskId) => (h.subs || []).some((s) => s.task_id === taskId && s.status === 'pass');
  // いまの目標の級：まだ認定されていない いちばん下の級
  function nextLevel(h, tid) {
    if (!h || !h.levels) return null;
    const cs = certSet(h);
    const l = levelsOf(h, tid || (tracksOf(h)[0] || {}).id).find((x) => !cs.has(x.id));
    if (!l) return null;
    const done = l.tasks.filter((t) => passed(h, t.id)).length;
    return { id: l.id, name: l.name, color: l.color, done, total: l.tasks.length };
  }
  // 新しい合格・認定のお祝い（この端末で1回だけ）と、経験値
  function celebrateNew(h) {
    const seen = ls.get('bc.club.seen', null);
    const passIds = (h.subs || []).filter((s) => s.status === 'pass').map((s) => s.id);
    const certIds = (h.certs || []).map((c) => c.level_id);
    if (!seen || seen.club !== h.club.id || seen.member !== h.me.id) {
      // はじめて開いた端末：いまある分は お祝いしない
      ls.set('bc.club.seen', { club: h.club.id, member: h.me.id, pass: passIds, cert: certIds });
      return;
    }
    const newPass = passIds.filter((id) => !seen.pass.includes(id));
    const newCert = certIds.filter((id) => !seen.cert.includes(id));
    ls.set('bc.club.seen', { club: h.club.id, member: h.me.id, pass: passIds, cert: certIds });
    const acts = [];
    for (const id of newPass) {
      const s = h.subs.find((x) => x.id === id);
      const t = findTask(h, s.task_id);
      acts.push({ type: 'pass', id: s.task_id, skill: t && drill(t.task.drill_id) ? (drill(t.task.drill_id).skills || [])[0] : null, xp: 10 });
    }
    for (const id of newCert) acts.push({ type: 'kyu', id, xp: 50 });
    if (acts.length && X.addActs) X.addActs(acts, { quiet: true });
    if (newCert.length && X.modal) {
      const l = h.levels.find((x) => x.id === newCert[newCert.length - 1]);
      const c = h.certs.find((x) => x.level_id === (l && l.id));
      if (l) {
        X.modal(`<div class="celebrate pop">${X.confetti ? X.confetti() : ''}<h2 class="modal-h">ごうかく！</h2>
          <div class="cl-cert-big" style="${kv(l.color)}"><span>${esc(l.name)}</span></div>
          <p class="center">${esc(h.me.nickname)}さん、<b>${esc(kyuLabel(l, trackName(h, l.track_id)))}</b>に 合格しました！</p>
          ${c && c.comment ? `<p class="cl-coach-c">${ic('whistle')}${esc(c.comment)}</p>` : ''}
          <p class="center small">経験値 +50</p>
          <div class="btns"><button type="button" class="btn primary big" data-act="modal-close">やったね！</button></div></div>`);
      }
    } else if (newPass.length && X.toast) {
      X.toast(`コーチが「合格」をくれたよ！（${newPass.length}）`, 'xp');
    }
  }
  function findTask(h, taskId) {
    for (const l of h.levels || []) for (const t of l.tasks) if (t.id === taskId) return { level: l, task: t };
    return null;
  }
  // 子どもの タブ（級・自主練・ひろば・予定）。数字は「まだの自主練」「答えていない予定」
  function kidTabs(cur) {
    const h = S.home || {};
    const qn = activeQuests(h).filter((q) => q.n < q.times).length;
    const en = (h.notices && h.notices.events) || 0;
    const tab = (href, key, icon, label, dot) => `<a href="${href}"${cur === key ? ' aria-current="page"' : ''}>${ic(icon)}<span>${label}</span>${dot ? `<b class="cl-tdot num">${dot}</b>` : ''}</a>`;
    return `<nav class="cl-tabs four">${tab('#club', 'kyu', 'trophy', '級', 0)}${tab('#club/quests', 'quests', 'bolt', '自主練', qn)}${tab('#club/feed', 'feed', 'people', 'ひろば', 0)}${tab('#club/events', 'events', 'flag', '予定', en)}</nav>`;
  }
  function noticeBar(h) {
    const n = h.notices || {};
    const items = [n.reviews && `コーチから 返事が <b>${n.reviews}</b>つ`, n.certs && `級の合格が <b>${n.certs}</b>つ`,
      n.coach && `コーチの 拍手・いいね など <b>${n.coach}</b>`, n.quests && `新しい 自主練が <b>${n.quests}</b>つ`, n.reacts && `ひろばで スタンプが <b>${n.reacts}</b>こ`].filter(Boolean);
    return `${items.length ? `<button type="button" class="cl-notice" data-cl="seen">${ic('star')}<span>${items.join('・')}</span><small>OK</small></button>` : ''}
      ${n.events ? `<a class="cl-notice ev" href="#club/events">${ic('flag')}<span>予定の へんじが <b>${n.events}</b>つ まだです</span>${ic('next')}</a>` : ''}`;
  }
  async function kidHome() {
    if (!S.home) paint(loading());
    const h = await loadHome();
    if (!h.ok) return welcomeOr(h);
    celebrateNew(h);
    const tracks = tracksOf(h);
    if (!S.track || !tracks.some((t) => t.id === S.track)) S.track = (tracks[0] || {}).id;
    const tid = S.track, tname = trackName(h, tid);
    const lv = levelsOf(h, tid);
    const cs = certSet(h);
    const cur = lv.find((x) => !cs.has(x.id));
    const kyuOf = (id) => ((h.kyus || []).find((k) => k.track_id === id) || {}).level || null;
    const taskRow = (t) => {
      const s = latestSub(h, t.id);
      const ok = passed(h, t.id);
      const d = drill(t.drill_id);
      return `<a class="row-card cl-task${ok ? ' ok' : ''}" href="#club/task/${t.id}">${d && X.drillArt ? X.drillArt(d) : `<span class="thumb art-ic">${ic('target')}</span>`}
        <span class="rc-body"><span class="rc-title">${esc(t.title)}</span><span class="rc-sub cl-goal">${ic('target')}${esc(BC.kyuGoal(t))}</span>
        ${s && s.comment && s.status !== 'pending' ? `<span class="cl-coach-mini">${ic('whistle')}${esc(s.comment)}</span>` : ''}</span>
        ${ok ? pill('pass') : s ? pill(s.status) : pill(null)}</a>`;
    };
    const ladder = lv.slice().reverse().map((l) => {
      const st = cs.has(l.id) ? 'done' : cur && l.id === cur.id ? 'now' : 'lock';
      const done = l.tasks.filter((t) => passed(h, t.id)).length;
      return `<details class="cl-step ${st}"><summary><span class="cl-step-k" style="${kv(l.color)}">${esc(l.name)}</span>
        <span class="cl-step-t">${st === 'done' ? `${ic('check')}合格` : st === 'now' ? `いまの目標 <b class="num">${done}</b>/${l.tasks.length}` : `${ic('flag')}${esc(l.note || '')}`}</span></summary>
        <div class="rows">${l.tasks.map((t) => taskRow(t)).join('') || '<p class="empty">課題はまだありません</p>'}</div></details>`;
    }).join('');
    const done = cur ? cur.tasks.filter((t) => passed(h, t.id)).length : 0;
    const chips = tracks.length > 1 ? `<div class="cl-tracks" role="tablist" aria-label="級の種類">${tracks.map((t) => `<button type="button" class="cl-track" role="tab" aria-selected="${t.id === tid}" data-cl="track" data-id="${t.id}">${ic(t.icon || 'trophy')}<span>${esc(t.name)}</span>${kyuBadge(kyuOf(t.id), 'small')}</button>`).join('')}</div>` : '';
    paint(`<section class="cl-me">
        <div class="cl-me-top">${kyuBadge(h.me.kyu, 'big')}<div><p class="cl-club">${esc(h.club.name)}</p><p class="cl-name">${esc(h.me.nickname)}<small>（${h.me.no}ばん）</small></p></div></div>
        ${cur ? `<p class="cl-next">つぎは <b>${esc(kyuLabel(cur, tname))}</b>：課題 <b class="num">${done}</b> / ${cur.tasks.length} 合格</p>
          <div class="xpbar cl-bar"><i style="width:${cur.tasks.length ? Math.round(100 * done / cur.tasks.length) : 0}%"></i></div>` : `<p class="cl-next">${esc(tname)}の 級に ぜんぶ合格！ すごい！</p>`}
      </section>
      ${noticeBar(h)}
      ${kidTabs('kyu')}
      ${chips}
      ${cur ? `<section class="sec cl-cur"><h2 class="sec-h">${ic('target')}${esc(kyuLabel(cur, tname))}の 課題</h2><p class="small">課題をえらんで、できたら「送る」。写真をつけると、コーチが見やすいよ。</p>
        <div class="rows">${cur.tasks.map((t) => taskRow(t)).join('')}</div></section>` : ''}
      <section class="sec"><h2 class="sec-h">${ic('up')}${esc(tname)}の 級の かいだん</h2><div class="cl-ladder">${ladder}</div></section>
      <p class="center"><button type="button" class="link-btn" data-cl="logout">ログアウト（この端末から）</button></p>`);
  }
  function welcomeOr(j) {
    if (!S.sess) return welcomePage();
    paint(`<p class="cl-msg">${esc(errMsg(j))}</p><div class="btns"><button type="button" class="btn" data-cl="retry">もう一度</button></div>`);
  }

  /* ---------- 子ども：課題のページ（提出） ---------- */
  async function taskPage(id) {
    if (!S.home) { paint(loading()); const j = await loadHome(); if (!j.ok) return welcomeOr(j); }
    const h = S.home;
    const f = findTask(h, id);
    if (!f) return paint(`${backLink('#club')}<p class="empty">その課題は ありません（コーチが直したのかも）。</p>`);
    const { level: l, task: t } = f;
    const cs = certSet(h);
    const cur = levelsOf(h, l.track_id).find((x) => !cs.has(x.id));
    const canSend = !passed(h, t.id) && cur && cur.id === l.id;
    const subs = (h.subs || []).filter((s) => s.task_id === t.id);
    const d = drill(t.drill_id);
    const checks = (X.checks ? X.checks() : []).slice(0, 6);
    const up = S.upload && S.upload.task === t.id ? S.upload : null;
    paint(`${backLink('#club', '級にもどる')}
      <p class="eyebrow">${kyuBadge(l)} ${esc(trackName(h, l.track_id))}の 課題</p>
      <h1 class="page-h">${esc(t.title)}</h1>
      <section class="cl-goal-big"><span class="small">目標</span><b>${esc(BC.kyuGoal(t))}</b>${passed(h, t.id) ? `<span class="cl-st pass">${ic('check')}合格</span>` : ''}</section>
      ${t.how ? `<p class="cl-coach-c">${ic('whistle')}<span><b>コーチから：</b>${esc(t.how)}</span></p>` : ''}
      ${d ? `<section class="sec"><h2 class="sec-h">${ic('list')}やりかた</h2><a class="row-card" href="#${d.id}">${X.drillArt ? X.drillArt(d) : ''}<span class="rc-body"><span class="rc-title">${esc(d.name)}</span><span class="rc-sub">アニメーションと やりかたを見る</span></span>${ic('next', 'rc-go')}</a></section>` : ''}
      ${canSend ? `<section class="card cl-send">
        <h2 class="sec-h">${ic('up')}きろくを 送る</h2>
        <div class="field"><span class="field-l">${/以内/.test(t.cond) ? 'タイム（秒）' : 'なん' + esc(t.unit) + ' できた？'}</span>
          <div class="cl-count"><button type="button" class="ib" data-cl="cnt" data-d="-1" aria-label="へらす">${ic('minus')}</button>
          <input id="cl-count" type="number" inputmode="numeric" min="0" max="99999" value="${t.target}" aria-label="数">
          <button type="button" class="ib" data-cl="cnt" data-d="1" aria-label="ふやす">${ic('plus')}</button><span class="cl-unit">${esc(t.unit)}</span></div>
          <p class="small" id="cl-met"></p></div>
        ${t.photo !== 'none' ? `<div class="field"><span class="field-l">写真${t.photo === 'need' ? '（必要）' : '（あると コーチが見やすい）'}</span>
          ${up ? `<div class="cl-preview"><img src="${up.url}" alt="えらんだ写真"><button type="button" class="btn" data-cl="unphoto">${ic('close')}はずす</button></div>` : ''}
          <label class="btn cl-pick">${ic('camera')}${up ? 'べつの写真にする' : '写真を とる・えらぶ'}<input type="file" accept="image/*" id="cl-file" data-task="${t.id}" hidden></label>
          <p class="small">顔が うつっていなくても だいじょうぶ（フォームが分かれば OK）。写真は 本人とコーチだけが見られます。</p></div>` : ''}
        ${checks.length ? `<div class="field"><span class="field-l">動画チェックの けっかを つける（なくてもOK）</span>
          <select id="cl-check"><option value="">つけない</option>${checks.map((c, i) => `<option value="${i}">${esc(checkLabel(c))}</option>`).join('')}</select></div>` : ''}
        <label class="field"><span class="field-l">ひとこと（なくてもOK）</span><input id="cl-note" type="text" maxlength="100" placeholder="例：左手は あと少し"></label>
        <button type="button" class="btn primary big" data-cl="send" data-task="${t.id}">${ic('up')}コーチに 送る</button>
      </section>` : !passed(h, t.id) ? `<p class="cl-msg">${ic('flag')}この課題は、前の級に 合格すると 送れるように なります。</p>` : ''}
      <section class="sec"><h2 class="sec-h">${ic('clock')}送った きろく</h2>
        ${subs.length ? `<div class="rows">${subs.map((s) => `<div class="card cl-sub">
          <div class="cl-sub-h">${pill(s.status)}<span class="num">${s.count == null ? '' : s.count + esc(t.unit)}</span><span class="small">${esc(ago(s.created_at))}</span>
            ${s.status === 'pending' ? `<button type="button" class="link-btn" data-cl="cancel" data-id="${s.id}">とりけす</button>` : ''}</div>
          ${s.note ? `<p class="small">${esc(s.note)}</p>` : ''}
          ${s.check ? `<p class="small">${ic('camera', 'inline')}${esc(checkLabel(s.check))}</p>` : ''}
          ${photoTag(s.photo_id, 'small')}
          ${s.comment ? `<p class="cl-coach-c">${ic('whistle')}<span>${esc(s.comment)}</span></p>` : ''}</div>`).join('')}</div>` : '<p class="empty">まだ 送っていません。</p>'}
      </section>`);
    updateMet(t);
  }
  const checkLabel = (c) => `${c.label || c.mode || '動画チェック'}${c.score != null ? ' ' + c.score + '点' : ''}${c.metrics ? '（' + c.metrics.filter((m) => m.status === 'good').length + '◎）' : ''}`;
  function updateMet(t) {
    const el = document.getElementById('cl-met'), inp = document.getElementById('cl-count');
    if (!el || !inp) return;
    const n = inp.value;
    el.innerHTML = n === '' ? '' : BC.kyuMet(t, n) ? `${ic('check', 'inline')}目標に とどいています！` : '目標まで あと少し。とどいていなくても、送って コーチに見てもらえます。';
  }
  async function send(taskId) {
    const f = findTask(S.home, taskId);
    if (!f || S.busy) return;
    const t = f.task;
    const cnt = (document.getElementById('cl-count') || {}).value;
    const note = (document.getElementById('cl-note') || {}).value || '';
    const sel = (document.getElementById('cl-check') || {}).value;
    const up = S.upload && S.upload.task === taskId ? S.upload : null;
    if (t.photo === 'need' && !up) return X.toast && X.toast('この課題は 写真が必要です');
    let check = null;
    if (sel !== '' && sel != null && X.checks) {
      const c = X.checks()[+sel];
      if (c) check = { mode: c.mode, label: c.label || (BC.check && BC.check.MODES && BC.check.MODES[c.mode] ? BC.check.MODES[c.mode].name : c.mode), score: c.score, metrics: (c.metrics || []).map((m) => ({ label: m.label, value: m.value, status: m.status })) };
    }
    S.busy = true;
    const btn = document.querySelector('[data-cl="send"]');
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="cl-spin"></span>送っています…'; }
    const j = await rpc('bg_submit', { p_token: tok(), p_task_id: taskId, p_count: cnt === '' ? null : Math.max(0, Math.round(+cnt)), p_note: note,
      p_photo: up ? up.b64 : '', p_mime: up ? up.mime : '', p_check: check });
    S.busy = false;
    if (!j.ok) { if (btn) { btn.disabled = false; btn.innerHTML = `${ic('up')}コーチに 送る`; } return X.toast && X.toast(errMsg(j)); }
    S.upload = null;
    X.toast && X.toast('送ったよ！ コーチの確認を まってね');
    await loadHome();
    rerender();
  }

  /* ---------- ひろば ---------- */
  async function feedPage(more) {
    if (!S.feed || !more) paint(loading());
    const before = more && S.feed && S.feed.length ? S.feed[S.feed.length - 1].created_at : null;
    const j = await rpc('bg_feed', { p_token: tok(), p_before: before, p_limit: 20 });
    if (!j.ok) return welcomeOr(j);
    S.feed = more ? (S.feed || []).concat(j.posts) : j.posts;
    S.feedEnd = j.posts.length < 20;
    if (!S.home) await loadHome();
    if (!isCoach()) rpc('bg_seen', { p_token: tok() }).then(() => { if (S.home) { clearNotices(S.home); setBadge(noticeCount(S.home)); } });
    drawFeed();
  }
  function postCard(p) {
    const me = S.sess.me;
    const mine = p.member && p.member.id === me.id;
    const st = p.status !== 'shown' ? `<span class="cl-st ${p.status === 'waiting' ? 'wait' : 'retry'}">${p.status === 'waiting' ? 'コーチの確認まち' : 'かくされています'}</span>` : '';
    const body = p.kind === 'cert'
      ? `<div class="cl-cert" style="${kv(p.meta.color)}"><span class="cl-cert-k">${esc(p.meta.level || '')}</span><span><b>${esc(p.member.nickname)}さんが ${esc(kyuLabel({ name: p.meta.level || '' }, p.meta.track || ''))}に 合格！</b>${p.meta.comment ? `<small>${ic('whistle', 'inline')}${esc(p.meta.by || 'コーチ')}：${esc(p.meta.comment)}</small>` : ''}</span></div>`
      : p.kind === 'quest'
      ? `<div class="cl-cert quest"><span class="cl-cert-k">${ic('bolt')}</span><span><b>${esc(p.member.nickname)}さんが 自主練「${esc(p.meta.title || '')}」を クリア！</b><small>${esc(String(p.meta.target || ''))}${esc(p.meta.unit || '')} を ${esc(String(p.meta.times || ''))}回</small></span></div>`
      : `${p.kind === 'share' ? `<p class="cl-share">${ic(p.meta.type === 'badge' ? 'medal' : p.meta.type === 'check' ? 'camera' : p.meta.type === 'streak' ? 'fire' : p.meta.type === 'focus' ? 'target' : 'trophy')}<span>${esc(p.meta.label || '')}</span></p>` : ''}
         ${p.body ? `<p class="cl-body">${esc(p.body)}</p>` : ''}${photoTag(p.photo_id)}`;
    return `<article class="card cl-post${p.kind === 'cert' || p.kind === 'quest' ? ' cert' : ''}" data-post="${p.id}">
      <header class="cl-post-h">${avatar(p.member)}<span class="cl-post-who"><b>${esc(p.member.nickname)}</b>${p.member.role === 'coach' ? '<span class="cl-st">コーチ</span>' : kyuBadge(p.member.kyu, 'small')}</span><span class="small">${esc(ago(p.created_at))}</span>${st}</header>
      ${body}
      ${creactRow(p.coach)}
      <footer class="cl-stamps">${STAMPS.map(([k, label, e]) => `<button type="button" class="cl-stamp" data-cl="react" data-id="${p.id}" data-k="${k}" aria-pressed="${(p.mine || []).includes(k)}" ${p.status === 'hidden' ? 'disabled' : ''}><span aria-hidden="true">${e}</span>${label}<b class="num">${(p.reacts || {})[k] || ''}</b></button>`).join('')}</footer>
      ${isCoach() && p.status !== 'hidden' ? creactBtns('post', p.id, p.coach) : ''}
      ${mine || isCoach() ? `<div class="cl-post-ctl">${isCoach() && p.status !== 'shown' ? `<button type="button" class="btn" data-cl="mod" data-id="${p.id}" data-s="shown">${ic('check')}みんなに出す</button>` : ''}
        ${isCoach() && p.status === 'shown' && !mine ? `<button type="button" class="link-btn" data-cl="mod" data-id="${p.id}" data-s="hidden">かくす</button>` : ''}
        <button type="button" class="link-btn" data-cl="delpost" data-id="${p.id}">消す</button></div>` : ''}
    </article>`;
  }
  function drawFeed() {
    const c = S.home ? S.home.club : { settings: {} };
    const photos = (c.settings || {}).photos !== false;
    const shares = (X.shares ? X.shares() : []).slice(0, 4);
    const up = S.upload && S.upload.task === 'post' ? S.upload : null;
    paint(`${isCoach() ? backLink('#club', 'コーチのページ') : ''}
      ${isCoach() ? '<h1 class="page-h">ひろば</h1><p class="small">コーチは、投稿に 👏拍手・👍いいね・😠怒り を つけられます（みんなに見えます）。</p>' : kidTabs('feed')}
      <section class="card cl-compose">
        <label class="sr" for="cl-post">がんばったこと</label>
        <textarea id="cl-post" maxlength="140" rows="2" placeholder="${isCoach() ? 'クラブのみんなへ ひとこと' : 'きょう がんばったことを 書こう'}"></textarea>
        ${shares.length ? `<div class="chips">${shares.map((s, i) => `<button type="button" class="chip" data-cl="share" data-i="${i}">${ic(s.type === 'badge' ? 'medal' : s.type === 'check' ? 'camera' : s.type === 'focus' ? 'target' : 'trophy', 'inline')}${esc(s.label)}</button>`).join('')}</div>` : ''}
        ${up ? `<div class="cl-preview"><img src="${up.url}" alt="えらんだ写真"><button type="button" class="btn" data-cl="unphoto">${ic('close')}はずす</button></div>` : ''}
        <div class="btns">${photos ? `<label class="btn">${ic('camera')}写真<input type="file" accept="image/*" id="cl-file" data-task="post" hidden></label>` : ''}<button type="button" class="btn primary" data-cl="post">${ic('plus')}のせる</button></div>
        <p class="small">${isCoach() ? '' : 'やさしい ことばで。わるぐち・リンク・電話番号は のせられません。'}${photos && !isCoach() && (c.settings || {}).review_photos !== false ? '写真つきは、コーチが見てから みんなに出ます。' : ''}${(c.settings || {}).review_posts ? '投稿は、コーチが見てから みんなに出ます。' : ''}</p>
      </section>
      <div class="cl-feed">${S.feed.length ? S.feed.map(postCard).join('') : '<p class="empty">まだ 投稿は ありません。さいしょの 1つを 書いてみよう！</p>'}</div>
      ${S.feed.length && !S.feedEnd ? '<div class="btns"><button type="button" class="btn" data-cl="more">もっと見る</button></div>' : ''}`);
  }
  async function doPost(share) {
    if (S.busy) return;
    const body = (document.getElementById('cl-post') || {}).value || '';
    const up = S.upload && S.upload.task === 'post' ? S.upload : null;
    if (!body.trim() && !up && !share) return X.toast && X.toast('なにか 書いてね');
    S.busy = true;
    const j = await rpc('bg_post', { p_token: tok(), p_body: body, p_photo: up ? up.b64 : '', p_mime: up ? up.mime : '', p_meta: share || null });
    S.busy = false;
    if (!j.ok) return X.toast && X.toast(errMsg(j));
    S.upload = null;
    X.toast && X.toast(j.status === 'waiting' ? 'のせたよ！ コーチが見てから みんなに出るよ' : 'のせたよ！');
    feedPage();
  }

  /* ---------- コーチ：ホーム ---------- */
  async function coachHome() {
    if (!S.home) paint(loading());
    const h = await loadHome();
    if (!h.ok) return welcomeOr(h);
    const c = h.counts;
    const row = (href, icon, title, sub, n) => `<a class="row-card more-row" href="${href}"><span class="thumb art-ic">${ic(icon)}</span><span class="rc-body"><span class="rc-title">${title}${n ? ` <b class="cl-tdot num">${n}</b>` : ''}</span><span class="rc-sub">${sub}</span></span>${ic('next', 'rc-go')}</a>`;
    paint(`<section class="cl-me coach">
        <div class="cl-me-top">${avatar(h.me)}<div><p class="cl-club">${esc(h.club.name)}</p><p class="cl-name">${esc(h.me.nickname)}<small>（コーチ）</small></p></div></div>
        <p class="cl-code">クラブコード <b class="num">${esc(h.club.code)}</b><button type="button" class="link-btn" data-cl="copy" data-v="${esc(h.club.code)}">コピー</button></p>
      </section>
      <section class="cl-tiles six">
        <a class="cl-tile${c.pending ? ' hot' : ''}" href="#club/review"><b class="num">${c.pending}</b><span>確認まちの 提出</span></a>
        <a class="cl-tile${c.ready ? ' hot' : ''}" href="#club/review"><b class="num">${c.ready}</b><span>認定できる 級</span></a>
        <a class="cl-tile${c.unrated ? ' hot' : ''}" href="#club/quests"><b class="num">${c.logs_today || 0}</b><span>きょうの 自主練${c.unrated ? `<small>まだ反応 ${c.unrated}</small>` : ''}</span></a>
        <a class="cl-tile${c.applies ? ' hot' : ''}" href="#club/applies"><b class="num">${c.applies || 0}</b><span>新しい 申し込み</span></a>
        <a class="cl-tile${c.waiting ? ' hot' : ''}" href="#club/feed"><b class="num">${c.waiting}</b><span>ひろばの 確認まち</span></a>
        <a class="cl-tile" href="#club/members"><b class="num">${c.kids}</b><span>子ども</span></a>
      </section>
      <div class="rows">
        ${row('#club/review', 'check', '確認・評価・級の認定', '写真を見て「合格」「もう一度」。課題がそろった子に 級を認定', c.pending + c.ready)}
        ${row('#club/quests', 'bolt', '自主練', `「何を・何回・いつまでに」を出す。いま ${c.quests || 0}つ。拍手・いいね・怒りで 返事`, 0)}
        ${row('#club/events', 'flag', '予定・参加の申し込み', `練習試合・大会・合宿など。参加する・しないを 集める（これから ${c.events || 0}つ）`, 0)}
        ${row('#club/applies', 'pencil', '体験・入団の申し込み', '保護者の方が リンクから 申し込めます', c.applies || 0)}
        ${row('#club/members', 'people', 'メンバー・ログインカード', '子どもを登録して、カードをわたす。あいことばの作りなおし', 0)}
        ${row('#club/design', 'trophy', '級をつくる', `${tracksOf(h).length}種類・${h.levels.length}の級（${tracksOf(h).map((t) => esc(t.name)).join('・')}）`, 0)}
        ${row('#club/feed', 'chat', 'ひろば', '子どもの投稿・合格のお知らせ。確認して出す・かくす', c.waiting)}
        ${row('#club/settings', 'sliders', 'せってい', '投稿のルール・写真・合言葉・ログアウト', 0)}
      </div>
      ${BC.links ? `<h2 class="sec-h cl-links-h">${ic('flag')}試合と 保護者会</h2><p class="small">べつのページが開きます。タップ記録の「バスケ・グロウ」から、このページに戻れます。</p><div class="rows cl-links">${BC.links.rows(row, 'grow-club')}</div>` : ''}
      ${c.kids ? '' : `<section class="card"><h2 class="sec-h">${ic('flag')}はじめに</h2><ol class="steps"><li><span>「メンバー」で 子どもを登録する（ニックネームでOK）</span></li><li><span>ログインカードを 印刷して わたす</span></li><li><span>「級をつくる」で、課題と回数を クラブに合わせる</span></li><li><span>「自主練」で、家でやる練習と 回数を出す</span></li></ol></section>`}`);
  }

  /* ---------- コーチ：確認・評価・認定 ---------- */
  const QUICK = ['いいね！', 'フォームがきれい！', 'あと少し！', 'ひざをもっと曲げよう', '目線を上げよう', '左手もがんばろう', 'つぎの級も がんばろう！'];
  async function reviewPage() {
    paint(loading());
    const j = await rpc('bg_queue', { p_token: tok() });
    if (!j.ok) return welcomeOr(j);
    S.queue = j;
    drawQueue();
  }
  function drawQueue() {
    const j = S.queue;
    const ready = j.ready.map((r) => `<div class="card cl-ready">
        <div class="cl-post-h">${avatar(r.member)}<span class="cl-post-who"><b>${esc(r.member.nickname)}</b><small>${r.member.no}ばん</small></span>${kyuBadge(r.level)}</div>
        <p>${esc(kyuLabel(r.level))}の 課題が ぜんぶ合格しました。</p>
        <input type="text" class="cl-in" maxlength="200" placeholder="ひとこと（例：よくがんばったね！）" data-for="${r.member.id}:${r.level.id}">
        <button type="button" class="btn primary" data-cl="grant" data-m="${r.member.id}" data-l="${r.level.id}">${ic('trophy')}${esc(kyuLabel(r.level))} 合格にする</button></div>`).join('');
    const pend = j.pending.map((s) => {
      const t = s.task;
      const met = s.count != null && BC.kyuMet(t, s.count);
      return `<article class="card cl-q" data-sub="${s.id}">
        <header class="cl-post-h">${avatar(s.member)}<span class="cl-post-who"><b>${esc(s.member.nickname)}</b><small>${s.member.no}ばん・${esc(ago(s.created_at))}</small></span>${kyuBadge(s.member.kyu, 'small')}</header>
        <p class="cl-q-task">${kyuBadge(t.level, 'small')}${t.level && t.level.track && t.level.track !== '総合' ? `<span class="cl-chip">${esc(t.level.track)}</span>` : ''}<b>${esc(t.title)}</b></p>
        <p class="cl-q-count">目標 ${esc(BC.kyuGoal(t))} → <b class="num">${s.count == null ? '—' : s.count}${esc(t.unit)}</b> ${met ? `<span class="cl-st pass">${ic('check')}とどいた</span>` : s.count != null ? '<span class="cl-st retry">とどかない</span>' : ''}</p>
        ${s.note ? `<p class="small">「${esc(s.note)}」</p>` : ''}
        ${photoTag(s.photo_id)}
        ${s.check ? `<p class="small">${ic('camera', 'inline')}${esc(checkLabel(s.check))}${s.check.metrics ? '：' + s.check.metrics.map((m) => `${m.label}${m.status === 'good' ? '◎' : m.status === 'ok' ? '○' : m.status === 'bad' ? '△' : ''}`).map(esc).join('・') : ''}</p>` : ''}
        <div class="chips">${QUICK.map((q) => `<button type="button" class="chip" data-cl="quick" data-v="${esc(q)}">${esc(q)}</button>`).join('')}</div>
        <textarea class="cl-in" rows="2" maxlength="200" placeholder="コーチから ひとこと" data-comment="${s.id}"></textarea>
        <div class="cl-q-btns"><button type="button" class="btn" data-cl="review" data-id="${s.id}" data-s="retry">${ic('back')}もう一度</button><button type="button" class="btn primary" data-cl="review" data-id="${s.id}" data-s="pass">${ic('check')}合格</button></div>
      </article>`;
    }).join('');
    paint(`${backLink('#club', 'コーチのページ')}<h1 class="page-h">確認・評価</h1>
      ${j.ready.length ? `<section class="sec"><h2 class="sec-h">${ic('trophy')}認定できる級</h2><div class="rows">${ready}</div></section>` : ''}
      <section class="sec"><h2 class="sec-h">${ic('check')}確認まち <small class="num">${j.pending.length}</small></h2>${pend ? `<div class="rows">${pend}</div>` : '<p class="empty">確認まちは ありません。</p>'}</section>
      ${j.recent.length ? `<details class="more"><summary>さいきん評価したもの（${j.recent.length}）</summary><div class="rows">${j.recent.map((s) => `<div class="cl-recent">${pill(s.status)}<b>${esc(s.member.nickname)}</b><span>${esc(s.task.title)}</span><span class="small">${esc(ago(s.reviewed_at))}</span></div>`).join('')}</div></details>` : ''}
      <section class="sec"><h2 class="sec-h">${ic('medal')}級を直接 認定する</h2><p class="small">課題の提出がなくても、練習で見て 認定できます：「メンバー」→ 子どもをえらぶ。</p></section>`);
  }

  /* ---------- コーチ：メンバー ---------- */
  async function loadMembers() {
    const j = await rpc('bg_members_list', { p_token: tok() });
    if (j.ok) S.members = j.members;
    return j;
  }
  async function membersPage() {
    paint(loading());
    const j = await loadMembers();
    if (!j.ok) return welcomeOr(j);
    if (!S.home) await loadHome();
    const kids = S.members.filter((m) => m.role === 'kid');
    const coaches = S.members.filter((m) => m.role === 'coach');
    paint(`${backLink('#club', 'コーチのページ')}<h1 class="page-h">メンバー</h1>
      <form class="card cl-form" data-clform="addkid" autocomplete="off">
        <h2 class="sec-h">${ic('plus')}子どもを 登録</h2>
        ${S.prefill ? `<p class="cl-msg">${ic('pencil', 'inline')}申し込みから：名前は ニックネームに 直してから 登録してください。</p>` : ''}
        <label class="field"><span class="field-l">ニックネーム（本名でなくてOK）</span><input name="nick" maxlength="12" required value="${esc(S.prefill ? S.prefill.nick : '')}"></label>
        <label class="field"><span class="field-l">学年</span><select name="grade"><option value="">（えらばない）</option>${Object.entries(GRADES).map(([k, v]) => `<option value="${k}" ${S.prefill && S.prefill.grade === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
        <button type="submit" class="btn primary">${ic('plus')}登録して ログインカードを出す</button>
      </form>
      <section class="sec"><h2 class="sec-h">${ic('people')}子ども <small class="num">${kids.length}</small></h2>
        ${kids.length ? `<div class="rows">${kids.map((k) => `<a class="row-card cl-mem" href="#club/member/${k.id}">${avatar(k)}<span class="rc-body"><span class="rc-title">${k.no}. ${esc(k.nickname)} ${kyuBadge(k.kyu, 'small')}</span>
          <span class="rc-sub">${esc(GRADES[k.grade] || '')} 合格 ${k.passes}${k.pending ? `・確認まち ${k.pending}` : ''}${k.last ? `・さいご ${esc(ago(k.last))}` : ''}</span></span>${ic('next', 'rc-go')}</a>`).join('')}</div>
          <div class="btns"><a class="btn" href="#club/cards">${ic('list')}ログインカードを 印刷</a></div>` : '<p class="empty">まだ いません。上で 登録してね。</p>'}
      </section>
      <section class="sec"><h2 class="sec-h">${ic('whistle')}コーチ</h2><p class="small">${coaches.map((x) => esc(x.nickname)).join('・')}</p>
        <p class="small">ほかのコーチは、クラブコード <b>${esc(S.sess.club.code)}</b> と 合言葉で「コーチとして ログイン」すると ふえます。</p></section>`);
  }
  function pinCard(k, pin) {
    return `<div class="cl-card"><p class="cl-card-h">${ic('ball')}バスケ・グロウ <small>${esc(S.sess.club.name)}</small></p>
      <p class="cl-card-n">${esc(k.nickname)} さん</p>
      <dl><div><dt>クラブコード</dt><dd class="num">${esc(S.sess.club.code)}</dd></div><div><dt>ばんごう</dt><dd class="num">${k.no}</dd></div><div><dt>あいことば</dt><dd class="num">${esc(pin)}</dd></div></dl>
      <p class="cl-card-f">アプリの「クラブ」から ログイン。このカードは ほかの人に見せないでね。</p></div>`;
  }
  async function memberPage(id) {
    if (!S.members) { paint(loading()); const j = await loadMembers(); if (!j.ok) return welcomeOr(j); }
    if (!S.home) await loadHome();
    const k = S.members.find((m) => m.id === id);
    if (!k) return paint(`${backLink('#club/members', 'メンバー')}<p class="empty">いません。</p>`);
    const certs = new Set(k.certs || []);
    const pin = S.pins[k.id];
    paint(`${backLink('#club/members', 'メンバー')}
      <h1 class="page-h">${avatar(k)} ${k.no}. ${esc(k.nickname)}</h1>
      ${pin ? `<section class="sec"><h2 class="sec-h">${ic('list')}ログインカード</h2>${pinCard(k, pin)}<div class="btns"><a class="btn" href="#club/cards">${ic('list')}印刷する</a></div></section>` : ''}
      <form class="card cl-form" data-clform="editkid" data-id="${k.id}">
        <label class="field"><span class="field-l">ニックネーム</span><input name="nick" maxlength="12" value="${esc(k.nickname)}"></label>
        <label class="field"><span class="field-l">学年</span><select name="grade"><option value="">（えらばない）</option>${Object.entries(GRADES).map(([g, v]) => `<option value="${g}" ${k.grade === g ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
        <button type="submit" class="btn">${ic('save')}ほぞん</button>
      </form>
      <section class="sec"><h2 class="sec-h">${ic('trophy')}級の認定</h2><p class="small">押すと、その級に 合格／とり消し。課題の提出がなくても、練習で見て 認定できます。</p>
        ${tracksOf(S.home).map((tr) => `<h3 class="cl-trh">${ic(tr.icon || 'trophy', 'inline')}${esc(tr.name)}</h3>
        <div class="cl-levels">${levelsOf(S.home, tr.id).map((l) => `<button type="button" class="cl-lv${certs.has(l.id) ? ' on' : ''}" style="${kv(l.color)}" data-cl="${certs.has(l.id) ? 'uncert' : 'cert'}" data-m="${k.id}" data-l="${l.id}">${esc(l.name)}<small>${certs.has(l.id) ? '合格' : '—'}</small></button>`).join('')}</div>`).join('')}</section>
      <section class="sec"><h2 class="sec-h">${ic('person')}ログイン</h2>
        <p class="small">あいことばを わすれたときは、作りなおして 新しいカードをわたしてください（前の端末は ログアウトします）。</p>
        <div class="btns"><button type="button" class="btn" data-cl="repin" data-id="${k.id}">${ic('shuffle')}あいことばを 作りなおす</button></div></section>
      <section class="sec"><h2 class="sec-h">${ic('trash')}消す</h2>
        <p class="small">このメンバーの 提出・写真・投稿・認定が すべて消えます。もとに もどせません。</p>
        <div class="btns"><button type="button" class="btn danger" data-cl="delkid" data-id="${k.id}">${S.armDel === k.id ? 'もう一度 押すと 消えます' : 'このメンバーを 消す'}</button></div></section>`);
  }
  async function cardsPage() {
    if (!S.members) { paint(loading()); const j = await loadMembers(); if (!j.ok) return welcomeOr(j); }
    const kids = S.members.filter((m) => m.role === 'kid');
    const have = kids.filter((k) => S.pins[k.id]);
    paint(`<div class="cl-noprint">${backLink('#club/members', 'メンバー')}<h1 class="page-h">ログインカード</h1>
      <p class="small">あいことばは、登録したときと 作りなおしたときにしか 見られません（サーバーには、まぜた形でしか 残していません）。カードがない子は、えらんで「作りなおして カードにする」を押してください（その子の前の端末は ログアウトします）。</p>
      <div class="cl-pick-list">${kids.map((k) => `<label class="cl-pick-k"><input type="checkbox" value="${k.id}" ${S.pins[k.id] ? 'checked disabled' : ''}>${k.no}. ${esc(k.nickname)}${S.pins[k.id] ? ' <small>（カードあり）</small>' : ''}</label>`).join('')}</div>
      <div class="btns"><button type="button" class="btn" data-cl="repin-many">${ic('shuffle')}えらんだ子の あいことばを 作りなおして カードにする</button>
      ${have.length ? `<button type="button" class="btn primary" data-cl="print">${ic('list')}印刷する（${have.length}まい）</button>` : ''}</div></div>
      <div class="cl-print">${have.map((k) => pinCard(k, S.pins[k.id])).join('')}</div>`);
  }

  /* ---------- コーチ：級をつくる（級の種類ごと） ---------- */
  const UNITS = ['回', '本', '秒', '往復', 'セット', '分', '周', 'm', '点'];
  const ICON_LABEL = { trophy: 'トロフィー', ball: 'ボール', hoop: 'ゴール', people: 'なかま', shield: 'たて', bolt: 'いなずま', star: 'ほし', target: 'まと', fire: 'ほのお', shoe: 'くつ' };
  const clone = (x) => JSON.parse(JSON.stringify(x));
  // その種類の テンプレート（名前が同じもの。メインは「総合」）
  const tplFor = (name, main) => { const t = (BC.KYU_TRACKS || []).find((x) => x.name === name); return t ? t.levels : main ? BC.KYU_TEMPLATE : null; };
  async function designPage() {
    if (!S.home) { paint(loading()); const j = await loadHome(); if (!j.ok) return welcomeOr(j); }
    if (!S.draft) {
      const tracks = tracksOf(S.home);
      const tr = tracks.find((t) => t.id === S.dtrack) || tracks[0];
      S.dtrack = tr ? tr.id : null;
      S.draft = tr ? { id: tr.id, name: tr.name, icon: tr.icon || 'trophy', levels: clone(levelsOf(S.home, tr.id)) } : { id: null, name: '総合', icon: 'trophy', levels: clone(BC.KYU_TEMPLATE) };
    }
    drawDesign();
  }
  function drawDesign() {
    const D = S.draft;
    const tracks = tracksOf(S.home);
    const isMain = !!(D.id && tracks[0] && tracks[0].id === D.id);
    const drills = (BC.lists && BC.lists.drill) || [];
    const tabs = `<div class="cl-tracks" role="tablist" aria-label="級の種類">${tracks.map((t) => `<button type="button" class="cl-track" role="tab" aria-selected="${D.id === t.id}" data-cl="dtrack" data-id="${t.id}">${ic(t.icon || 'trophy')}<span>${esc(t.name)}</span></button>`).join('')}
      ${tracks.length < 8 ? `<button type="button" class="cl-track add" role="tab" aria-selected="${!D.id}" data-cl="dnew">${ic('plus')}<span>種類を足す</span></button>` : ''}</div>`;
    if (S.dpick) {
      return paint(`${backLink('#club', 'コーチのページ')}<h1 class="page-h">級をつくる</h1>${tabs}
        <section class="card"><h2 class="sec-h">${ic('plus')}級の種類を 足す</h2><p class="small">スキルごとの級（ドリブル7級・シュート9級 …）を つくれます。テンプレートから えらぶか、白紙から。</p>
        <div class="rows">${(BC.KYU_TRACKS || []).map((t, i) => { const have = tracks.some((x) => x.name === t.name); return `<button type="button" class="row-card cl-tpl" data-cl="dpick" data-i="${i}" ${have ? 'disabled' : ''}><span class="thumb art-ic">${ic(t.icon)}</span><span class="rc-body"><span class="rc-title">${esc(t.name)}</span><span class="rc-sub">${t.levels.length}級・各級に 課題${t.levels[0].tasks.length}つ${have ? '（もう あります）' : ''}</span></span></button>`; }).join('')}
          <button type="button" class="row-card cl-tpl" data-cl="dpick" data-i="-1"><span class="thumb art-ic">${ic('pencil')}</span><span class="rc-body"><span class="rc-title">白紙から</span><span class="rc-sub">10級 だけで はじめて、あとで 足す</span></span></button></div></section>`);
    }
    paint(`${backLink('#club', 'コーチのページ')}<h1 class="page-h">級をつくる</h1>${tabs}
      <section class="card cl-form"><div class="cl-dt-g">
        <label><span>種類の 名前</span><input class="cl-in" value="${esc(D.name)}" maxlength="12" data-d="tname" placeholder="例：ドリブル"></label>
        <label><span>アイコン</span><select class="cl-in" data-d="ticon">${(BC.KYU_TRACK_ICONS || ['trophy']).map((k) => `<option value="${k}" ${D.icon === k ? 'selected' : ''}>${ICON_LABEL[k] || k}</option>`).join('')}</select></label></div>
        <p class="small">${isMain ? 'いちばん左の種類（メイン）の級は、子どもの 名前のとなりや ホームに出ます。' : D.id ? 'スキルごとの級。子どもは「級」のタブで 種類を えらんで チャレンジします。' : '新しい種類です。「ほぞんする」で できあがります。'}</p></section>
      <p class="small">下の級から じゅんに。課題の 目標（回数・本数・秒）を クラブに合わせて変えられます。「練習メニュー」をえらぶと、子どもは やりかたとアニメーションを見られます。</p>
      <datalist id="cl-drills">${drills.map((d) => `<option value="${esc(d.id)}">${esc(d.name)}</option>`).join('')}</datalist>
      ${D.levels.map((l, i) => `<section class="card cl-dlv" style="${kv(l.color)}">
        <div class="cl-dlv-h"><span class="cl-step-k">${esc(l.name || '?')}</span>
          <input class="cl-in" value="${esc(l.name)}" maxlength="12" data-d="lname" data-i="${i}" aria-label="級の名前">
          <span class="pl-sp"></span><button type="button" class="ib" data-cl="lup" data-i="${i}" aria-label="下へ">${ic('down')}</button><button type="button" class="ib" data-cl="ldown" data-i="${i}" aria-label="上へ">${ic('up')}</button><button type="button" class="ib" data-cl="ldel" data-i="${i}" aria-label="この級を消す">${ic('trash')}</button></div>
        <div class="cl-colors">${['#e9e5dc', '#f2c94c', '#f2994a', '#27ae60', '#56ccf2', '#2f80ed', '#9b51e0', '#a0522d', '#d63a3a', '#222222'].map((c) => `<button type="button" class="cl-color" style="--c:${c}" data-cl="lcolor" data-i="${i}" data-c="${c}" aria-pressed="${l.color === c}" aria-label="色"></button>`).join('')}</div>
        <input class="cl-in" value="${esc(l.note || '')}" maxlength="40" placeholder="ひとこと（例：はじめの一歩）" data-d="lnote" data-i="${i}">
        ${l.tasks.map((t, j) => `<div class="cl-dt">
          <div class="cl-dt-h"><b class="num">${j + 1}</b><input class="cl-in" value="${esc(t.title)}" maxlength="40" placeholder="課題の名前" data-d="title" data-i="${i}" data-j="${j}">
            <button type="button" class="ib" data-cl="tdel" data-i="${i}" data-j="${j}" aria-label="課題を消す">${ic('trash')}</button></div>
          <div class="cl-dt-g">
            <label><span>じょうけん</span><input class="cl-in" value="${esc(t.cond || '')}" maxlength="20" placeholder="10本中・30秒で・以内" data-d="cond" data-i="${i}" data-j="${j}"></label>
            <label><span>目標</span><span class="cl-count sm"><button type="button" class="ib" data-cl="tnum" data-i="${i}" data-j="${j}" data-d="-1" aria-label="へらす">${ic('minus')}</button><b class="num">${t.target}</b><button type="button" class="ib" data-cl="tnum" data-i="${i}" data-j="${j}" data-d="1" aria-label="ふやす">${ic('plus')}</button></span></label>
            <label><span>単位</span><select class="cl-in" data-d="unit" data-i="${i}" data-j="${j}">${UNITS.map((u) => `<option ${t.unit === u ? 'selected' : ''}>${u}</option>`).join('')}</select></label>
            <label><span>写真</span><select class="cl-in" data-d="photo" data-i="${i}" data-j="${j}"><option value="need" ${t.photo === 'need' ? 'selected' : ''}>必要</option><option value="opt" ${t.photo === 'opt' ? 'selected' : ''}>あってもよい</option><option value="none" ${t.photo === 'none' ? 'selected' : ''}>なし</option></select></label>
          </div>
          <label class="cl-dt-l"><span>練習メニュー</span><input class="cl-in" list="cl-drills" value="${esc(t.drill_id || '')}" placeholder="d-pound など（えらぶ）" data-d="drill_id" data-i="${i}" data-j="${j}"><small>${esc((drills.find((d) => d.id === t.drill_id) || {}).name || '')}</small></label>
          <label class="cl-dt-l"><span>コーチから（見るところ）</span><input class="cl-in" value="${esc(t.how || '')}" maxlength="200" data-d="how" data-i="${i}" data-j="${j}"></label>
          <p class="cl-dt-goal">子どもには「目標 <b>${esc(BC.kyuGoal(t))}</b>」と出ます</p>
        </div>`).join('')}
        ${l.tasks.length < 12 ? `<button type="button" class="link-btn" data-cl="tadd" data-i="${i}">＋ 課題を足す</button>` : ''}
      </section>`).join('')}
      <div class="btns"><button type="button" class="btn" data-cl="ladd">${ic('plus')}級を 足す（いちばん上に）</button>
        ${tplFor(D.name, isMain || !D.id) ? `<button type="button" class="btn" data-cl="ltpl">テンプレートに もどす</button>` : ''}
        ${D.id && tracks.length > 1 ? `<button type="button" class="btn danger" data-cl="tremove">${S.armTrack === D.id ? 'もう一度 押すと しまいます' : 'この種類を しまう'}</button>` : ''}</div>
      <div class="do-bar cl-save"><button type="button" class="btn big" data-cl="dreset">やめる</button><button type="button" class="btn primary big" data-cl="dsave">${ic('save')}${D.id ? 'ほぞんする' : 'この種類を つくる'}</button></div>
      <p class="small">課題を消しても、合格した記録は のこります（子どもの画面からは 見えなくなります）。種類を しまっても、認定の記録は のこります。</p>`);
  }
  function readDesignInputs() {
    if (!S.el || !S.draft) return;
    S.el.querySelectorAll('[data-d]').forEach((el) => {
      const k = el.dataset.d;
      if (k === 'tname') { S.draft.name = el.value; return; }
      if (k === 'ticon') { S.draft.icon = el.value; return; }
      const i = +el.dataset.i, j = el.dataset.j != null ? +el.dataset.j : null;
      const l = S.draft.levels[i];
      if (!l) return;
      if (k === 'lname') l.name = el.value;
      else if (k === 'lnote') l.note = el.value;
      else if (j != null && l.tasks[j]) l.tasks[j][k] = el.value;
    });
  }

  /* ---------- コーチ：せってい ---------- */
  async function settingsPage() {
    if (!S.home) { paint(loading()); const j = await loadHome(); if (!j.ok) return welcomeOr(j); }
    const c = S.home.club, s = c.settings || {};
    const tg = (k, label, note, def) => `<label class="cl-toggle"><input type="checkbox" name="${k}" ${(s[k] == null ? def : s[k]) ? 'checked' : ''}><span><b>${label}</b><small>${note}</small></span></label>`;
    paint(`${backLink('#club', 'コーチのページ')}<h1 class="page-h">せってい</h1>
      <form class="card cl-form" data-clform="settings">
        <label class="field"><span class="field-l">クラブの名前</span><input name="name" maxlength="30" value="${esc(c.name)}"></label>
        <span class="field-l">ひろばの ルール</span>
        ${tg('review_posts', 'すべての投稿を、コーチが見てから出す', '小さい子が多いクラブに', false)}
        ${tg('review_photos', '写真つきの投稿は、コーチが見てから出す', 'おすすめ', true)}
        ${tg('photos', 'ひろばに 写真を のせられる', 'オフにすると、文とスタンプだけ', true)}
        ${tg('cert_posts', '級の合格・自主練のクリアを ひろばで お知らせ', 'みんなで おめでとうを言える', true)}
        <button type="submit" class="btn primary">${ic('save')}ほぞん</button>
      </form>
      <form class="card cl-form" data-clform="pass" autocomplete="off">
        <h2 class="sec-h">${ic('person')}コーチの合言葉を 変える</h2>
        <label class="field"><span class="field-l">いまの合言葉</span><input name="old" type="password" autocomplete="current-password" required></label>
        <label class="field"><span class="field-l">新しい合言葉（8文字以上）</span><input name="new" type="password" autocomplete="new-password" minlength="8" required></label>
        <button type="submit" class="btn">変える（ほかのコーチの端末は ログアウト）</button>
      </form>
      <section class="card"><h2 class="sec-h">${ic('aid')}子どもの 安全のために</h2>
        <ul class="list"><li>保護者の方に、クラブで使うこと・写真を送ることを 伝えて、了解をとってから はじめてください。</li>
        <li>名前は ニックネームで。顔の写真は いりません（フォームが分かれば十分）。</li>
        <li>子どもどうしは、文を送りあえません（スタンプだけ）。投稿は いつでも かくせます。</li>
        <li>提出の写真は、評価から45日で 自動で消えます。メンバーを消すと、その子のデータは すべて消えます。</li></ul></section>
      <div class="btns"><button type="button" class="btn" data-cl="logout">${ic('back')}この端末から ログアウト</button></div>
      <form class="card cl-form danger-zone" data-clform="delclub" autocomplete="off">
        <h2 class="sec-h">${ic('trash')}クラブを 消す</h2>
        <p class="small">このクラブの メンバー・級・提出・写真・投稿が すべて消えます。もとに もどせません。</p>
        <label class="field"><span class="field-l">コーチの合言葉</span><input name="pass" type="password" autocomplete="current-password" required></label>
        <button type="submit" class="btn danger">クラブを 消す</button>
      </form>`);
  }

  /* ---------- 自主練（コーチのクエスト） ---------- */
  const qGoal = (q) => `${q.target}${q.unit} を ${q.times}回`;
  const qPeriod = (q) => `${fmtDay(q.start_on)} 〜 ${fmtDay(q.end_on)}`;
  function qWhen(q) {
    const st = qState(q), left = daysLeft(q.end_on);
    return st === 'soon' ? `${fmtDay(q.start_on)}から` : st === 'over' ? 'おわりました' : left === 0 ? 'きょうまで！' : `のこり ${left}日（${fmtDay(q.end_on)}まで）`;
  }
  // 自主練のカード（子ども：自分の回数／コーチ：クリアした人数）
  function questCard(q, coach) {
    const st = qState(q);
    const done = !coach && q.n >= q.times;
    const pct = coach ? (q.kids ? Math.round(100 * q.cleared / q.kids) : 0) : Math.min(100, Math.round(100 * q.n / q.times));
    const d = drill(q.drill_id);
    return `<a class="card cl-quest ${st}${done ? ' clear' : ''}" href="#club/quest/${q.id}">
      <span class="cl-quest-h">${d && X.drillArt ? X.drillArt(d) : `<span class="thumb art-ic">${ic('bolt')}</span>`}
        <span class="rc-body"><span class="rc-title">${esc(q.title)}</span><span class="rc-sub">${ic('target', 'inline')}${esc(qGoal(q))}</span><span class="rc-sub">${ic('clock', 'inline')}${esc(qWhen(q))}</span></span>
        ${coach ? `<span class="cl-quest-n"><b class="num">${q.cleared}</b>/${q.kids}<small>クリア</small></span>`
          : done ? `<span class="cl-st pass">${ic('check')}クリア</span>` : `<span class="cl-quest-n"><b class="num">${q.n}</b>/${q.times}<small>回</small></span>`}</span>
      <span class="xpbar cl-bar"><i style="width:${pct}%"></i></span>
      ${coach ? `<span class="small">きょうの記録 <b class="num">${q.today}</b>・まだ反応していない <b class="num">${q.unrated}</b></span>`
        : q.coach ? `<span class="small">${ic('whistle', 'inline')}コーチの 反応 <b class="num">${q.coach}</b></span>` : ''}
    </a>`;
  }
  async function kidQuestsPage() {
    if (!S.home) paint(loading());
    const h = await loadHome();
    if (!h.ok) return welcomeOr(h);
    const qs = h.quests || [];
    const now = qs.filter((q) => qState(q) !== 'over'), over = qs.filter((q) => qState(q) === 'over');
    paint(`${noticeBar(h)}${kidTabs('quests')}
      <section class="sec"><h2 class="sec-h">${ic('bolt')}コーチからの 自主練</h2>
        <p class="small">家や公園で やったら「きろくする」。決められた回数に とどいたら クリア！ 経験値も もらえるよ。</p>
        ${now.length ? `<div class="rows">${now.map((q) => questCard(q)).join('')}</div>` : '<p class="empty">いまは 自主練は ありません。</p>'}</section>
      ${over.length ? `<details class="more"><summary>おわった 自主練（${over.length}）</summary><div class="rows">${over.map((q) => questCard(q)).join('')}</div></details>` : ''}`);
  }
  // 子ども：1つの自主練（きろくする）
  async function questPage(id) {
    if (!S.quest || !S.quest.quest || S.quest.quest.id !== id) paint(loading());
    const j = await rpc('bg_quest', { p_token: tok(), p_id: id });
    if (!j.ok) return paint(`${backLink('#club/quests', '自主練')}<p class="empty">${esc(errMsg(j))}</p>`);
    S.quest = j;
    const q = j.quest, st = qState(q);
    const todayN = j.logs.filter((g) => g.day === j.today).length;
    const can = st === 'now' && todayN < 3;
    const up = S.upload && S.upload.task === 'q:' + q.id ? S.upload : null;
    const d = drill(q.drill_id);
    paint(`${backLink('#club/quests', '自主練')}
      <p class="eyebrow">${ic('bolt', 'inline')}コーチからの 自主練</p>
      <h1 class="page-h">${esc(q.title)}</h1>
      <section class="cl-goal-big"><span class="small">目標</span><b>${esc(qGoal(q))}</b><span class="small">${esc(qPeriod(q))}</span></section>
      <section class="cl-qprog"><b class="num">${j.n}</b><span>/ ${q.times} 回</span>${j.n >= q.times ? `<span class="cl-st pass">${ic('check')}クリア</span>` : ''}
        <span class="xpbar cl-bar"><i style="width:${Math.min(100, Math.round(100 * j.n / q.times))}%"></i></span></section>
      ${q.how ? `<p class="cl-coach-c">${ic('whistle')}<span><b>コーチから：</b>${esc(q.how)}</span></p>` : ''}
      ${d ? `<section class="sec"><h2 class="sec-h">${ic('list')}やりかた</h2><a class="row-card" href="#${d.id}">${X.drillArt ? X.drillArt(d) : ''}<span class="rc-body"><span class="rc-title">${esc(d.name)}</span><span class="rc-sub">アニメーションと やりかたを見る</span></span>${ic('next', 'rc-go')}</a></section>` : ''}
      ${can ? `<section class="card cl-send">
        <h2 class="sec-h">${ic('plus')}きょうの 自主練を きろくする</h2>
        <div class="field"><span class="field-l">なん${esc(q.unit)} できた？</span>
          <div class="cl-count"><button type="button" class="ib" data-cl="cnt" data-d="-1" aria-label="へらす">${ic('minus')}</button>
          <input id="cl-count" type="number" inputmode="numeric" min="0" max="99999" value="${q.target}" aria-label="数">
          <button type="button" class="ib" data-cl="cnt" data-d="1" aria-label="ふやす">${ic('plus')}</button><span class="cl-unit">${esc(q.unit)}</span></div></div>
        ${q.photo !== 'none' ? `<div class="field"><span class="field-l">写真${q.photo === 'need' ? '（必要）' : '（なくてもOK）'}</span>
          ${up ? `<div class="cl-preview"><img src="${up.url}" alt="えらんだ写真"><button type="button" class="btn" data-cl="unphoto">${ic('close')}はずす</button></div>` : ''}
          <label class="btn cl-pick">${ic('camera')}${up ? 'べつの写真にする' : '写真を とる・えらぶ'}<input type="file" accept="image/*" id="cl-file" data-task="q:${q.id}" hidden></label>
          <p class="small">写真は 本人とコーチだけが見られます。</p></div>` : ''}
        <label class="field"><span class="field-l">ひとこと（なくてもOK）</span><input id="cl-note" type="text" maxlength="100" placeholder="例：左手が つかれた"></label>
        <button type="button" class="btn primary big" data-cl="qlog" data-id="${q.id}">${ic('check')}きろくする</button>
      </section>` : `<p class="cl-msg">${st === 'soon' ? `${esc(fmtDay(q.start_on))}から きろくできます。` : st === 'over' ? 'この自主練は おわりました。' : 'きょうは もう 3回 きろくしました。また あした！'}</p>`}
      <section class="sec"><h2 class="sec-h">${ic('clock')}きろく</h2>
        ${j.logs.length ? `<div class="rows">${j.logs.map((g) => `<div class="card cl-sub">
          <div class="cl-sub-h"><span class="num">${g.count == null ? '' : g.count + esc(q.unit)}</span><span class="small">${esc(fmtDay(g.day))}・${esc(ago(g.created_at))}</span>
            ${g.day === j.today ? `<button type="button" class="link-btn" data-cl="qdel" data-id="${g.id}">とりけす</button>` : ''}</div>
          ${g.note ? `<p class="small">${esc(g.note)}</p>` : ''}${photoTag(g.photo_id, 'small')}${creactRow(g.coach)}</div>`).join('')}</div>` : '<p class="empty">まだ きろくは ありません。</p>'}</section>`);
  }
  async function questLog(id) {
    const q = S.quest && S.quest.quest;
    if (!q || S.busy) return;
    const cnt = (document.getElementById('cl-count') || {}).value;
    const note = (document.getElementById('cl-note') || {}).value || '';
    const up = S.upload && S.upload.task === 'q:' + id ? S.upload : null;
    if (q.photo === 'need' && !up) return X.toast && X.toast('この自主練は 写真が必要です');
    S.busy = true;
    const btn = document.querySelector('[data-cl="qlog"]');
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="cl-spin"></span>きろくしています…'; }
    const j = await rpc('bg_quest_log', { p_token: tok(), p_quest_id: id, p_count: cnt === '' || cnt == null ? null : Math.max(0, Math.round(+cnt)), p_note: note,
      p_photo: up ? up.b64 : '', p_mime: up ? up.mime : '' });
    S.busy = false;
    if (!j.ok) { if (btn) { btn.disabled = false; btn.innerHTML = `${ic('check')}きろくする`; } return X.toast && X.toast(errMsg(j)); }
    S.upload = null;
    const acts = [{ type: 'qlog', id, xp: 5 }];
    if (j.just_cleared) acts.push({ type: 'quest', id, xp: 30 });
    if (X.addActs) X.addActs(acts, { quiet: true });
    S.home = null;
    await questPage(id);
    if (j.just_cleared && X.modal) {
      X.modal(`<div class="celebrate pop">${X.confetti ? X.confetti() : ''}<h2 class="modal-h">自主練 クリア！</h2>
        <div class="cl-cert-big quest"><span>${ic('bolt')}</span></div>
        <p class="center"><b>${esc(q.title)}</b><br>${esc(qGoal(q))}、やりきった！</p>
        <p class="center small">経験値 +35</p>
        <div class="btns"><button type="button" class="btn primary big" data-act="modal-close">やったね！</button></div></div>`);
    } else if (X.toast) X.toast(`きろくしたよ！（${j.n} / ${j.times}回）経験値 +5`, 'xp');
  }

  // コーチ：自主練の一覧
  const QUEST_TPL = [
    { title: 'ドリブル 100回', drill_id: 'd-pound', target: 100, unit: '回', times: 5, days: 7, how: '右50回・左50回。顔を上げて' },
    { title: 'かべパス 50回', drill_id: 'd-wallpass', target: 50, unit: '回', times: 3, days: 7, how: '両手でとって、両手で出す' },
    { title: 'シュート 30本', drill_id: 'd-formshoot', target: 30, unit: '本', times: 3, days: 7, how: '入った数も ひとことに 書いてね' },
    { title: 'ハンドリング 3分', drill_id: 'd-handling', target: 3, unit: '分', times: 5, days: 7, how: 'ボールを落とさずに' },
    { title: '2ボール・ドリブル 1分', drill_id: 'd-2ball', target: 60, unit: '秒', times: 5, days: 14, how: '' },
    { title: '体幹トレーニング', drill_id: 'd-core', target: 3, unit: 'セット', times: 4, days: 14, how: '' },
  ];
  async function coachQuestsPage() {
    paint(loading());
    const j = await rpc('bg_quest_list', { p_token: tok() });
    if (!j.ok) return welcomeOr(j);
    if (S.home) S.home.today = j.today;
    const now = j.quests.filter((q) => qState(q) !== 'over'), over = j.quests.filter((q) => qState(q) === 'over');
    paint(`${backLink('#club', 'コーチのページ')}<h1 class="page-h">自主練</h1>
      <p class="small">「何を・何回・いつまでに」を出すと、子どもは 1回ずつ きろくします（写真も）。👏拍手・👍いいね・😠怒り で 返事できます。</p>
      <div class="btns"><a class="btn primary" href="#club/quest-new">${ic('plus')}自主練を 出す</a></div>
      <section class="sec"><h2 class="sec-h">${ic('bolt')}出している 自主練</h2>${now.length ? `<div class="rows">${now.map((q) => questCard(q, true)).join('')}</div>` : '<p class="empty">まだ ありません。上の「自主練を 出す」から。</p>'}</section>
      ${over.length ? `<details class="more"><summary>おわった 自主練（${over.length}）</summary><div class="rows">${over.map((q) => questCard(q, true)).join('')}</div></details>` : ''}`);
  }
  // コーチ：1つの自主練（子どもごとの回数・きろく・反応）
  function logBlock(g, q) {
    return `<div class="cl-qlog" data-log="${g.id}">
      <p class="cl-sub-h"><span class="num">${g.count == null ? '' : g.count + esc(q.unit)}</span><span class="small">${esc(fmtDay(g.day))}・${esc(ago(g.created_at))}</span></p>
      ${g.note ? `<p class="small">「${esc(g.note)}」</p>` : ''}${photoTag(g.photo_id, 'small')}
      ${creactRow(g.coach)}
      <input type="text" class="cl-in sm" maxlength="100" placeholder="ひとこと（なくてもOK）" data-ccomment="${g.id}" aria-label="ひとこと">
      ${creactBtns('log', g.id, g.coach)}</div>`;
  }
  async function coachQuestPage(id) {
    paint(loading());
    const j = await rpc('bg_quest', { p_token: tok(), p_id: id });
    if (!j.ok) return paint(`${backLink('#club/quests', '自主練')}<p class="empty">${esc(errMsg(j))}</p>`);
    S.quest = j;
    if (S.home) S.home.today = j.today;
    const q = j.quest;
    const kids = j.kids.slice().sort((a, b) => b.n - a.n || a.member.no - b.member.no);
    const cleared = kids.filter((k) => k.n >= q.times).length;
    const me = S.sess.me.id;
    paint(`${backLink('#club/quests', '自主練')}
      <p class="eyebrow">${ic('bolt', 'inline')}自主練${q.members ? `（${q.members.length}人に）` : '（全員に）'}</p>
      <h1 class="page-h">${esc(q.title)}</h1>
      <p class="cl-ev-when">${ic('target', 'inline')}${esc(qGoal(q))}　${ic('clock', 'inline')}${esc(qPeriod(q))}・${esc(qWhen(q))}</p>
      ${q.how ? `<p class="cl-coach-c">${ic('whistle')}<span>${esc(q.how)}</span></p>` : ''}
      <p class="cl-qsum">クリア <b class="num">${cleared}</b> / ${kids.length}人</p>
      <div class="rows">${kids.map((k) => `<details class="card cl-qkid"${k.logs.some((g) => !g.coach.some((r) => r.coach_id === me)) ? ' open' : ''}>
        <summary>${avatar(k.member)}<span class="rc-body"><b>${esc(k.member.nickname)}</b><span class="xpbar cl-bar sm"><i style="width:${Math.min(100, Math.round(100 * k.n / q.times))}%"></i></span></span>
          <span class="num">${k.n}/${q.times}</span>${k.n >= q.times ? `<span class="cl-st pass">${ic('check')}クリア</span>` : ''}</summary>
        ${k.logs.length ? k.logs.map((g) => logBlock(g, q)).join('') : '<p class="small">まだ きろくは ありません。</p>'}
      </details>`).join('') || '<p class="empty">対象の子どもが いません。</p>'}</div>
      <div class="btns"><a class="btn" href="#club/quest-edit/${q.id}">${ic('pencil')}直す</a>${q.archived ? '' : `<button type="button" class="btn" data-cl="qclose" data-id="${q.id}">この自主練を おわりにする</button>`}</div>`);
  }
  // コーチ：自主練を出す・直す
  async function questFormPage(id) {
    paint(loading());
    if (!S.home) { const h = await loadHome(); if (!h.ok) return welcomeOr(h); }
    if (!S.members) { const m = await loadMembers(); if (!m.ok) return welcomeOr(m); }
    let q = null;
    if (id) { const j = await rpc('bg_quest', { p_token: tok(), p_id: id }); if (!j.ok) return paint(`${backLink('#club/quests', '自主練')}<p class="empty">${esc(errMsg(j))}</p>`); q = j.quest; }
    const f = q || { title: '', drill_id: '', target: 100, unit: '回', times: 5, start_on: today(), end_on: addDays(today(), 6), photo: 'opt', how: '', members: null };
    const kids = S.members.filter((m) => m.role === 'kid');
    const drills = (BC.lists && BC.lists.drill) || [];
    paint(`${backLink(id ? '#club/quest/' + id : '#club/quests', '自主練')}<h1 class="page-h">${id ? '自主練を 直す' : '自主練を 出す'}</h1>
      ${id ? '' : `<p class="small">よく使う形から えらぶと、下に 入ります。</p><div class="chips">${QUEST_TPL.map((t, i) => `<button type="button" class="chip" data-cl="qtpl" data-i="${i}">${esc(t.title)}</button>`).join('')}</div>`}
      <form class="card cl-form" data-clform="quest" data-id="${id || ''}" autocomplete="off">
        <label class="field"><span class="field-l">なにを（名前）</span><input name="title" maxlength="40" value="${esc(f.title)}" placeholder="例：ドリブル 100回" required></label>
        <label class="field"><span class="field-l">練習メニュー（やりかたとアニメーション。なくてもOK）</span><input name="drill" list="cl-drills" value="${esc(f.drill_id || '')}" placeholder="d-pound など（えらぶ）"></label>
        <datalist id="cl-drills">${drills.map((d) => `<option value="${esc(d.id)}">${esc(d.name)}</option>`).join('')}</datalist>
        <div class="cl-dt-g">
          <label><span>1回で</span><input class="cl-in" name="target" type="number" inputmode="numeric" min="1" max="10000" value="${f.target}" required></label>
          <label><span>単位</span><select class="cl-in" name="unit">${UNITS.map((u) => `<option ${f.unit === u ? 'selected' : ''}>${u}</option>`).join('')}</select></label>
          <label><span>何回 やる？</span><input class="cl-in" name="times" type="number" inputmode="numeric" min="1" max="100" value="${f.times}" required></label>
          <label><span>写真</span><select class="cl-in" name="photo"><option value="opt" ${f.photo === 'opt' ? 'selected' : ''}>あってもよい</option><option value="need" ${f.photo === 'need' ? 'selected' : ''}>必要</option><option value="none" ${f.photo === 'none' ? 'selected' : ''}>なし</option></select></label>
        </div>
        <div class="cl-dt-g">
          <label><span>はじめ</span><input class="cl-in" name="start" type="date" value="${esc(String(f.start_on).slice(0, 10))}" required></label>
          <label><span>おわり</span><input class="cl-in" name="end" type="date" value="${esc(String(f.end_on).slice(0, 10))}" required></label>
        </div>
        <div class="chips">${[[6, '1週間'], [13, '2週間'], [29, '1か月']].map(([n, l]) => `<button type="button" class="chip" data-cl="qspan" data-n="${n}">${l}</button>`).join('')}</div>
        <label class="field"><span class="field-l">コーチから（やりかた・見るところ）</span><input name="how" maxlength="200" value="${esc(f.how || '')}" placeholder="例：右50回・左50回。顔を上げて"></label>
        <fieldset class="field"><legend class="field-l">だれに</legend>
          <label class="cl-radio"><input type="radio" name="who" value="all" ${f.members ? '' : 'checked'}>子ども 全員</label>
          <label class="cl-radio"><input type="radio" name="who" value="some" ${f.members ? 'checked' : ''}>えらぶ</label>
          <div class="cl-pick-list" data-who ${f.members ? '' : 'hidden'}>${kids.map((k) => `<label class="cl-pick-k"><input type="checkbox" name="m" value="${k.id}" ${f.members && f.members.includes(k.id) ? 'checked' : ''}>${k.no}. ${esc(k.nickname)}</label>`).join('') || '<p class="small">まだ 子どもが いません。</p>'}</div>
        </fieldset>
        <p class="small">子どもは 1日 3回まで きろくできます。きろくは コーチ全員が見て、拍手・いいね・怒りで 返事できます。</p>
        <button type="submit" class="btn primary big">${ic('save')}${id ? 'ほぞんする' : 'この自主練を 出す'}</button>
      </form>`);
  }

  /* ---------- 予定と、参加の申し込み ---------- */
  const eventWhen = (e) => `${fmtDay(e.day)}${e.time ? ' ' + e.time : ''}`;
  function eventHead(e) {
    return `<p class="cl-ev-kind"><span class="cl-chip">${esc(KINDS[e.kind] || 'その他')}</span>${e.open ? (e.deadline ? `<span class="small">しめきり ${esc(fmtDay(e.deadline))}</span>` : '') : '<span class="cl-st">しめきりました</span>'}</p>
      <h3 class="cl-ev-t">${esc(e.title)}</h3>
      <p class="cl-ev-when">${ic('clock', 'inline')}${esc(eventWhen(e))}${e.place ? `　${ic('pin', 'inline')}${esc(e.place)}` : ''}</p>`;
  }
  function eventCardKid(e) {
    const mine = e.mine && e.mine.answer;
    const full = e.capacity > 0 && e.yes >= e.capacity && mine !== 'yes';
    return `<article class="card cl-event${e.open ? '' : ' closed'}" data-ev="${e.id}">
      ${eventHead(e)}
      ${e.note ? `<p class="small cl-pre">${esc(e.note)}</p>` : ''}
      ${e.capacity ? `<p class="small">定員 ${e.capacity}人（いま ${e.yes}人）${full ? '・いっぱいです' : ''}</p>` : ''}
      <div class="cl-answers" role="group" aria-label="参加">${ANSWERS.map(([k, label, icon]) => `<button type="button" class="cl-ans ${k}" data-cl="answer" data-id="${e.id}" data-a="${k}" aria-pressed="${mine === k}" ${!e.open || (k === 'yes' && full) ? 'disabled' : ''}>${ic(icon, 'inline')}${label}</button>`).join('')}</div>
      ${mine ? `<p class="small">${e.mine.by_coach ? 'コーチが 入れました' : 'こたえました'}：<b>${ANSWERS.find((x) => x[0] === mine)[1]}</b>${e.mine.note ? `（${esc(e.mine.note)}）` : ''}</p>` : e.open ? '<p class="small cl-red">まだ 答えていません</p>' : ''}
    </article>`;
  }
  async function kidEventsPage() {
    if (!S.home) paint(loading());
    const h = await loadHome();
    if (!h.ok) return welcomeOr(h);
    drawKidEvents();
  }
  function drawKidEvents() {
    const evs = S.home.events || [];
    paint(`${noticeBar(S.home)}${kidTabs('events')}
      <section class="sec"><h2 class="sec-h">${ic('flag')}予定と 参加の 申し込み</h2>
        <p class="small">練習試合・大会・合宿などに「参加する・しない」を 答えてね。おうちの人と いっしょに 決めよう。</p>
        ${evs.length ? `<div class="rows">${evs.map(eventCardKid).join('')}</div>` : '<p class="empty">いまは 予定は ありません。</p>'}</section>`);
  }
  async function coachEventsPage() {
    paint(loading());
    const j = await rpc('bg_event_list', { p_token: tok() });
    if (!j.ok) return welcomeOr(j);
    const t = j.today;
    const up = j.events.filter((e) => e.day >= t), past = j.events.filter((e) => e.day < t);
    const card = (e) => `<a class="card cl-event${e.open ? '' : ' closed'}" href="#club/event/${e.id}">${eventHead(e)}
      <p class="cl-ev-count"><span class="yes">参加 <b class="num">${e.yes}</b></span><span class="maybe">未定 <b class="num">${e.maybe}</b></span><span class="no">不参加 <b class="num">${e.no}</b></span><span>まだ <b class="num">${Math.max(0, e.kids - e.yes - e.no - e.maybe)}</b></span>${e.capacity ? `<span>定員 ${e.capacity}</span>` : ''}</p></a>`;
    paint(`${backLink('#club', 'コーチのページ')}<h1 class="page-h">予定・参加の申し込み</h1>
      <p class="small">練習試合・大会・合宿などを出すと、子どもが「参加する・しない・まだわからない」を答えます。しめきり・定員も 決められます。</p>
      <div class="btns"><a class="btn primary" href="#club/event-new">${ic('plus')}予定を 出す</a></div>
      <section class="sec"><h2 class="sec-h">${ic('flag')}これからの 予定</h2>${up.length ? `<div class="rows">${up.map(card).join('')}</div>` : '<p class="empty">まだ ありません。</p>'}</section>
      ${past.length ? `<details class="more"><summary>おわった予定（${past.length}）</summary><div class="rows">${past.map(card).join('')}</div></details>` : ''}`);
  }
  async function coachEventPage(id) {
    if (!S.event || S.event.event.id !== id) paint(loading());
    const j = await rpc('bg_event', { p_token: tok(), p_id: id });
    if (!j.ok) return paint(`${backLink('#club/events', '予定')}<p class="empty">${esc(errMsg(j))}</p>`);
    S.event = j;
    const e = j.event;
    const groups = [['yes', '参加する'], ['maybe', 'まだ わからない'], ['no', '参加しない'], [null, 'まだ 答えていない']];
    paint(`${backLink('#club/events', '予定')}
      <section class="card cl-event${e.open ? '' : ' closed'}">${eventHead(e)}
        ${e.note ? `<p class="small cl-pre">${esc(e.note)}</p>` : ''}
        <p class="small">${e.deadline ? `しめきり ${esc(fmtDay(e.deadline))}` : 'しめきり：当日まで'}${e.capacity ? `・定員 ${e.capacity}人` : ''}${e.members ? `・${e.members.length}人に` : '・全員に'}</p></section>
      <p class="small">○×△ を押すと、コーチが かわりに 答えを入れられます（電話や 口で聞いたとき）。</p>
      ${groups.map(([a, label]) => { const ks = j.kids.filter((k) => (k.answer || null) === a); return `<section class="sec cl-egroup ${a || 'none'}"><h2 class="sec-h">${label} <small class="num">${ks.length}</small></h2>
        ${ks.length ? `<div class="rows">${ks.map((k) => `<div class="cl-entry">${avatar(k.member)}<span class="rc-body"><b>${esc(k.member.nickname)}</b>${k.note ? `<small>「${esc(k.note)}」</small>` : ''}${k.by_coach ? '<small>（コーチが入れた）</small>' : ''}</span>
          <span class="cl-entry-set">${ANSWERS.map(([x, l]) => `<button type="button" class="ib cl-ans-sm ${x}" data-cl="eset" data-m="${k.member.id}" data-a="${x}" aria-pressed="${k.answer === x}" aria-label="${l}">${x === 'yes' ? '○' : x === 'no' ? '×' : '△'}</button>`).join('')}</span></div>`).join('')}</div>` : '<p class="small">—</p>'}</section>`; }).join('')}
      <div class="btns"><button type="button" class="btn" data-cl="ecopy">${ic('copy')}一覧を コピー</button>
        <button type="button" class="btn" data-cl="eclose" data-c="${e.closed ? '0' : '1'}">${e.closed ? 'また ひらく' : 'しめきる'}</button>
        <a class="btn" href="#club/event-edit/${e.id}">${ic('pencil')}直す</a>
        <button type="button" class="btn danger" data-cl="edel">消す</button></div>`);
  }
  async function eventFormPage(id) {
    paint(loading());
    if (!S.home) { const h = await loadHome(); if (!h.ok) return welcomeOr(h); }
    if (!S.members) { const m = await loadMembers(); if (!m.ok) return welcomeOr(m); }
    let e = null;
    if (id) { const j = await rpc('bg_event', { p_token: tok(), p_id: id }); if (!j.ok) return paint(`${backLink('#club/events', '予定')}<p class="empty">${esc(errMsg(j))}</p>`); e = j.event; }
    const f = e || { title: '', kind: 'game', day: addDays(today(), 7), time: '', place: '', note: '', deadline: addDays(today(), 5), capacity: 0, members: null };
    const kids = S.members.filter((m) => m.role === 'kid');
    paint(`${backLink(id ? '#club/event/' + id : '#club/events', '予定')}<h1 class="page-h">${id ? '予定を 直す' : '予定を 出す'}</h1>
      <form class="card cl-form" data-clform="event" data-id="${id || ''}" autocomplete="off">
        <label class="field"><span class="field-l">名前</span><input name="title" maxlength="40" value="${esc(f.title)}" placeholder="例：練習試合 vs さくらミニバス" required></label>
        <label class="field"><span class="field-l">種類</span><select name="kind">${Object.entries(KINDS).map(([k, v]) => `<option value="${k}" ${f.kind === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
        <div class="cl-dt-g">
          <label><span>日</span><input class="cl-in" name="day" type="date" value="${esc(String(f.day).slice(0, 10))}" required></label>
          <label><span>時間</span><input class="cl-in" name="time" maxlength="20" value="${esc(f.time || '')}" placeholder="9:00〜12:00"></label>
        </div>
        <label class="field"><span class="field-l">場所</span><input name="place" maxlength="40" value="${esc(f.place || '')}" placeholder="例：中央体育館"></label>
        <label class="field"><span class="field-l">お知らせ（持ち物・集合など）</span><textarea name="note" rows="3" maxlength="300">${esc(f.note || '')}</textarea></label>
        <div class="cl-dt-g">
          <label><span>しめきり（なくてもOK）</span><input class="cl-in" name="deadline" type="date" value="${esc(f.deadline ? String(f.deadline).slice(0, 10) : '')}"></label>
          <label><span>定員（0は なし）</span><input class="cl-in" name="capacity" type="number" inputmode="numeric" min="0" max="500" value="${f.capacity || 0}"></label>
        </div>
        <fieldset class="field"><legend class="field-l">だれに</legend>
          <label class="cl-radio"><input type="radio" name="who" value="all" ${f.members ? '' : 'checked'}>子ども 全員</label>
          <label class="cl-radio"><input type="radio" name="who" value="some" ${f.members ? 'checked' : ''}>えらぶ（例：高学年だけ）</label>
          <div class="cl-pick-list" data-who ${f.members ? '' : 'hidden'}>${kids.map((k) => `<label class="cl-pick-k"><input type="checkbox" name="m" value="${k.id}" ${f.members && f.members.includes(k.id) ? 'checked' : ''}>${k.no}. ${esc(k.nickname)}${k.grade ? ` <small>${esc(GRADES[k.grade] || '')}</small>` : ''}</label>`).join('') || '<p class="small">まだ 子どもが いません。</p>'}</div>
        </fieldset>
        <p class="small">リンク（URL）と 電話番号は のせられません（子どもが見る画面のため）。</p>
        <button type="submit" class="btn primary big">${ic('save')}${id ? 'ほぞんする' : 'この予定を 出す'}</button>
      </form>`);
  }

  /* ---------- 体験・入団の申し込み ---------- */
  const APPLY_KIND = { trial: '体験したい', join: '入団したい', question: 'しつもん' };
  const APPLY_ST = { new: ['新着', 'wait'], contacted: ['連絡した', 'pass'], done: ['おわり', ''] };
  // 申し込みのリンク（手元の ファイルで開いているときは、公開ページの アドレスにする）
  const PUBLIC_URL = 'https://dora9991.github.io/math-dialogue/basket-coach/';
  const applyUrl = (code) => `${/^https?:$/.test(location.protocol) ? location.origin + location.pathname : PUBLIC_URL}#club/apply/${code}`;
  async function appliesPage() {
    if (!S.applies) paint(loading());
    const j = await rpc('bg_apply_list', { p_token: tok() });
    if (!j.ok) return welcomeOr(j);
    S.applies = j;
    const url = j.code ? applyUrl(j.code) : '';
    paint(`${backLink('#club', 'コーチのページ')}<h1 class="page-h">体験・入団の申し込み</h1>
      <form class="card cl-form" data-clform="applyset">
        <label class="cl-toggle"><input type="checkbox" name="open" ${j.open ? 'checked' : ''}><span><b>申し込みを 受けつける</b><small>オンにすると、申し込みの リンクから 保護者の方が 申し込めます</small></span></label>
        <label class="field"><span class="field-l">申し込みページに出す お知らせ（練習日・場所・持ち物など）</span><textarea name="note" rows="3" maxlength="300" placeholder="例：土曜 9時〜12時・中央体育館。体育館シューズと 水とうを 持ってきてください">${esc(j.note || '')}</textarea></label>
        <button type="submit" class="btn primary">${ic('save')}ほぞん</button>
      </form>
      ${url ? `<section class="card cl-applylink"><h2 class="sec-h">${ic('copy')}申し込みの リンク${j.open ? '' : '<span class="cl-st">受けつけて いません</span>'}</h2>
        <p class="cl-url">${esc(url)}</p>
        <div class="btns"><button type="button" class="btn" data-cl="copy" data-v="${esc(url)}">${ic('copy')}コピー</button>${navigator.share ? `<button type="button" class="btn" data-cl="sharelink" data-v="${esc(url)}">送る（LINE など）</button>` : ''}<a class="btn" href="${esc(url)}" target="_blank" rel="noopener">ひらいて みる</a></div>
        <p class="small">このリンクでは ログインは できません（クラブコードとは べつです）。入力された 名前・連絡先は、このクラブのコーチだけが見られ、90日で 自動で消えます。</p>
        <button type="button" class="link-btn" data-cl="newcode">リンクを 作りなおす</button></section>` : ''}
      <section class="sec"><h2 class="sec-h">${ic('list')}とどいた 申し込み <small class="num">${j.applies.length}</small></h2>
        ${j.applies.length ? `<div class="rows">${j.applies.map(applyCard).join('')}</div>` : '<p class="empty">まだ ありません。</p>'}</section>`);
  }
  function applyCard(a) {
    const tel = /^[0-9+() -]+$/.test(a.contact);
    const href = tel ? 'tel:' + a.contact.replace(/[^0-9+]/g, '') : 'mailto:' + a.contact;
    return `<article class="card cl-apply ${a.status}">
      <p class="cl-ev-kind"><span class="cl-chip">${APPLY_KIND[a.kind] || ''}</span><span class="cl-st ${APPLY_ST[a.status][1]}">${APPLY_ST[a.status][0]}</span><span class="small">${esc(ago(a.created_at))}</span></p>
      <h3 class="cl-ev-t">${esc(a.child)}${a.kana ? ` <small>（${esc(a.kana)}）</small>` : ''}${a.grade ? ` <small>${esc(GRADES[a.grade] || '')}</small>` : ''}</h3>
      <p class="small">保護者：${esc(a.guardian)}　連絡先：<a href="${esc(href)}">${esc(a.contact)}</a></p>
      ${a.message ? `<p class="cl-body">${esc(a.message)}</p>` : ''}
      <div class="btns">${a.status !== 'contacted' ? `<button type="button" class="btn" data-cl="amark" data-id="${a.id}" data-s="contacted">${ic('phone')}連絡した</button>` : ''}${a.status !== 'done' ? `<button type="button" class="btn" data-cl="amark" data-id="${a.id}" data-s="done">${ic('check')}おわり</button>` : ''}
        ${a.kind !== 'question' ? `<button type="button" class="btn primary" data-cl="amember" data-id="${a.id}">${ic('plus')}メンバーにする</button>` : ''}
        <button type="button" class="link-btn" data-cl="adel" data-id="${a.id}">消す</button></div>
    </article>`;
  }
  // 保護者の 申し込みページ（ログインなし。#club/apply/コード）
  async function applyPublicPage(code) {
    if (S.applied === code) {
      return paint(`<section class="cl-hero"><div class="cl-hero-ic">${ic('check')}</div><h1 class="page-h">申し込みました</h1>
        <p>${esc(S.appliedClub || 'クラブ')}の コーチから 連絡が きます。しばらく おまちください。</p></section>`);
    }
    paint(loading());
    const j = await rpc('bg_apply_info', { p_code: code });
    if (!j.ok) return paint(`<h1 class="page-h">申し込み</h1><p class="cl-msg">${j.error === 'closed' ? 'このクラブは いま 申し込みを 受けつけていません（リンクが 古いのかもしれません）。' : esc(errMsg(j))}</p>`);
    paint(`<section class="cl-hero"><div class="cl-hero-ic">${ic('ball')}</div><h1 class="page-h">${esc(j.club)}</h1><p>体験・入団の 申し込み</p></section>
      ${j.note ? `<section class="card"><h2 class="sec-h">${ic('flag')}クラブから</h2><p class="cl-pre">${esc(j.note)}</p></section>` : ''}
      <form class="card cl-form" data-clform="apply" data-code="${esc(code)}">
        <fieldset class="field"><legend class="field-l">申し込みの 種類</legend>
          ${Object.entries(APPLY_KIND).map(([k, l], i) => `<label class="cl-radio"><input type="radio" name="kind" value="${k}" ${i === 0 ? 'checked' : ''}>${l}</label>`).join('')}</fieldset>
        <label class="field"><span class="field-l">お子さんの 名前</span><input name="child" maxlength="20" required autocomplete="off"></label>
        <label class="field"><span class="field-l">ふりがな（なくてもOK）</span><input name="kana" maxlength="30" autocomplete="off"></label>
        <label class="field"><span class="field-l">学年</span><select name="grade"><option value="">（えらばない）</option>${Object.entries(GRADES).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></label>
        <label class="field"><span class="field-l">保護者の方の 名前</span><input name="guardian" maxlength="20" required autocomplete="name"></label>
        <label class="field"><span class="field-l">連絡先（電話番号 か メールアドレス）</span><input name="contact" maxlength="60" required></label>
        <label class="field"><span class="field-l">希望の日・しつもん など（なくてもOK）</span><textarea name="message" rows="3" maxlength="300"></textarea></label>
        <label class="cl-check"><input type="checkbox" name="agree" required><span>入力した内容は、このクラブの コーチだけが見て、連絡のために 使います。90日で 自動で消えます。</span></label>
        <button type="submit" class="btn primary big">${ic('next')}申し込む</button>
      </form>`);
  }

  /* ---------- ホームのカード・お知らせ ---------- */
  C.homeHTML = function () {
    if (!C.ready()) return '';
    const cache = ls.get('bc.club.cache', null);
    if (!S.sess || !cache) return `<a class="card cta cl-cta" href="#club">${ic('trophy')}<b>クラブ</b><small>コーチがつくった級に チャレンジ。ログインカードを もらった人は ここから</small></a>`;
    const me = cache.me, nx = cache.next;
    if (me.role === 'coach') return `<a class="card cl-homecard" href="#club">${ic('whistle')}<span><b>${esc(cache.club.name)}</b><small>コーチのページ${S.badge ? `・<b>${S.badge}</b>件 まっています` : ''}</small></span>${ic('next', 'rc-go')}</a>`;
    return `<a class="card cl-homecard" href="#club">${kyuBadge(me.kyu)}<span><b>${esc(cache.club.name)}</b><small>${nx ? `つぎは ${esc(nx.name)}：課題 ${nx.done}/${nx.total} 合格` : 'すべての級に 合格！'}${cache.q ? `・自主練 ${cache.q}つ` : ''}${S.badge ? `・<b class="cl-red">お知らせ ${S.badge}</b>` : ''}</small></span>${ic('next', 'rc-go')}</a>`;
  };
  C.refresh = async function () {
    if (!C.ready() || !S.sess) return 0;
    const j = await loadHome();
    return j && j.ok ? S.badge : 0;
  };
  C.badge = () => S.badge;
  C.session = () => S.sess;
  // アプリの記録（{ type, label }）を、そのまま ひろばに のせる（「今週の これ1つ」の のびなど）
  C.postShare = async (share) => {
    if (!C.ready() || !S.sess) return { ok: false, error: 'auth' };
    const j = await rpc('bg_post', { p_token: tok(), p_body: '', p_photo: '', p_mime: '', p_meta: { type: share.type, label: share.label } });
    if (j && j.ok) S.feed = null;
    return j;
  };

  /* ---------- 操作 ---------- */
  document.addEventListener('click', async (e) => {
    const t = e.target.closest('[data-cl]');
    if (!t || !S.el || !S.el.contains(t)) return;
    const d = t.dataset;
    switch (d.cl) {
      case 'retry': rerender(); break;
      case 'logout':
        await rpc('bg_logout', { p_token: tok() });
        setSess(null);
        go('club');
        break;
      case 'seen':
        await rpc('bg_seen', { p_token: tok() });
        if (S.home) { clearNotices(S.home); setBadge(noticeCount(S.home)); }
        t.remove();
        break;
      case 'copy':
        try { await navigator.clipboard.writeText(d.v); X.toast && X.toast('コピーしました'); } catch (err) { /* なし */ }
        break;
      case 'cnt': {
        const inp = document.getElementById('cl-count');
        if (inp) { inp.value = Math.max(0, (+inp.value || 0) + +d.d); const f = S.home && findTask(S.home, (document.querySelector('[data-cl="send"]') || {}).dataset.task); if (f) updateMet(f.task); }
        break;
      }
      case 'unphoto': S.upload = null; rerender(); break;
      case 'send': send(d.task); break;
      case 'cancel': {
        const j = await rpc('bg_sub_cancel', { p_token: tok(), p_id: d.id });
        if (!j.ok) X.toast && X.toast(errMsg(j));
        await loadHome(); rerender();
        break;
      }
      case 'zoom': {
        const src = S.photos[d.id];
        if (src && src !== 'x' && X.modal) X.modal(`<img class="cl-zoom" src="${src}" alt="写真"><div class="btns"><button type="button" class="btn" data-act="modal-close">とじる</button></div>`);
        break;
      }
      case 'post': doPost(); break;
      case 'share': { const s = (X.shares ? X.shares() : [])[+d.i]; if (s) doPost({ type: s.type, label: s.label }); break; }
      case 'more': feedPage(true); break;
      case 'react': {
        const on = t.getAttribute('aria-pressed') !== 'true';
        const j = await rpc('bg_react', { p_token: tok(), p_post_id: d.id, p_stamp: d.k, p_on: on });
        if (!j.ok) { X.toast && X.toast(errMsg(j)); break; }
        const i = S.feed.findIndex((p) => p.id === d.id);
        if (i >= 0) {
          S.feed[i] = Object.assign({}, S.feed[i], { reacts: j.post.reacts, mine: j.post.mine });
          const card = S.el.querySelector(`[data-post="${d.id}"]`);
          if (card) { const tmp = document.createElement('div'); tmp.innerHTML = postCard(S.feed[i]); card.replaceWith(tmp.firstElementChild); hydratePhotos(S.el); }
        }
        break;
      }
      case 'mod': {
        const j = await rpc('bg_post_mod', { p_token: tok(), p_id: d.id, p_status: d.s });
        X.toast && X.toast(j.ok ? (d.s === 'shown' ? 'みんなに出しました' : 'かくしました') : errMsg(j));
        feedPage();
        break;
      }
      case 'delpost': {
        if (S.armPost !== d.id) { S.armPost = d.id; t.textContent = 'もう一度 押すと 消えます'; break; }
        S.armPost = null;
        const j = await rpc('bg_post_delete', { p_token: tok(), p_id: d.id });
        X.toast && X.toast(j.ok ? '消しました' : errMsg(j));
        feedPage();
        break;
      }
      case 'quick': {
        const box = t.closest('.cl-q').querySelector('[data-comment]');
        if (box) box.value = (box.value ? box.value + ' ' : '') + d.v;
        break;
      }
      case 'review': {
        const box = S.el.querySelector(`[data-comment="${d.id}"]`);
        const j = await rpc('bg_review', { p_token: tok(), p_id: d.id, p_status: d.s, p_comment: box ? box.value : '' });
        if (!j.ok) { X.toast && X.toast(errMsg(j)); break; }
        X.toast && X.toast(d.s === 'pass' ? '合格にしました' : '「もう一度」を返しました');
        const q = await rpc('bg_queue', { p_token: tok() });
        if (q.ok) S.queue = q;
        drawQueue();
        break;
      }
      case 'grant': {
        const inp = S.el.querySelector(`[data-for="${d.m}:${d.l}"]`);
        const j = await rpc('bg_grant', { p_token: tok(), p_member_id: d.m, p_level_id: d.l, p_comment: inp ? inp.value : '' });
        if (!j.ok) { X.toast && X.toast(errMsg(j)); break; }
        X.toast && X.toast(`${j.member.nickname}さんを ${kyuLabel(j.level)}に 認定しました`);
        S.home = null;
        reviewPage();
        break;
      }
      case 'cert': case 'uncert': {
        const j = await rpc(d.cl === 'cert' ? 'bg_grant' : 'bg_cert_remove', d.cl === 'cert'
          ? { p_token: tok(), p_member_id: d.m, p_level_id: d.l, p_comment: '' }
          : { p_token: tok(), p_member_id: d.m, p_level_id: d.l });
        if (!j.ok) { X.toast && X.toast(errMsg(j)); break; }
        await loadMembers();
        memberPage(d.m);
        break;
      }
      case 'repin': {
        const k = S.members.find((m) => m.id === d.id);
        const j = await rpc('bg_member_update', { p_token: tok(), p_member_id: d.id, p_nickname: k.nickname, p_grade: k.grade, p_reset_pin: true });
        if (!j.ok) { X.toast && X.toast(errMsg(j)); break; }
        S.pins[d.id] = j.pin;
        memberPage(d.id);
        break;
      }
      case 'repin-many': {
        const ids = [...S.el.querySelectorAll('.cl-pick-k input:checked:not(:disabled)')].map((x) => x.value);
        if (!ids.length) { X.toast && X.toast('子どもを えらんでね'); break; }
        for (const id of ids) {
          const k = S.members.find((m) => m.id === id);
          const j = await rpc('bg_member_update', { p_token: tok(), p_member_id: id, p_nickname: k.nickname, p_grade: k.grade, p_reset_pin: true });
          if (j.ok) S.pins[id] = j.pin;
        }
        cardsPage();
        break;
      }
      case 'print': window.print(); break;
      case 'delkid': {
        if (S.armDel !== d.id) { S.armDel = d.id; memberPage(d.id); break; }
        S.armDel = null;
        const j = await rpc('bg_member_remove', { p_token: tok(), p_member_id: d.id });
        X.toast && X.toast(j.ok ? '消しました' : errMsg(j));
        S.members = null;
        go('club/members');
        break;
      }
      // 級をつくる（S.draft = { id, name, icon, levels }）
      case 'tnum': { readDesignInputs(); const tk = S.draft.levels[+d.i].tasks[+d.j]; tk.target = Math.max(1, Math.min(9999, (+tk.target || 1) + +d.d)); drawDesign(); break; }
      case 'tadd': readDesignInputs(); S.draft.levels[+d.i].tasks.push({ title: '', drill_id: '', target: 10, unit: '回', cond: '', how: '', photo: 'opt' }); drawDesign(); break;
      case 'tdel': readDesignInputs(); S.draft.levels[+d.i].tasks.splice(+d.j, 1); drawDesign(); break;
      case 'lcolor': readDesignInputs(); S.draft.levels[+d.i].color = d.c; drawDesign(); break;
      case 'lup': case 'ldown': {
        readDesignInputs();
        const L = S.draft.levels, i = +d.i, j2 = d.cl === 'lup' ? i - 1 : i + 1;
        if (j2 >= 0 && j2 < L.length) [L[i], L[j2]] = [L[j2], L[i]];
        drawDesign();
        break;
      }
      case 'ldel': readDesignInputs(); if (S.draft.levels.length > 1) S.draft.levels.splice(+d.i, 1); drawDesign(); break;
      case 'ladd': readDesignInputs(); S.draft.levels.push({ name: '', color: '#888888', note: '', tasks: [] }); drawDesign(); break;
      case 'ltpl': {
        readDesignInputs();
        const tracks = tracksOf(S.home);
        const tpl = tplFor(S.draft.name, !S.draft.id || (tracks[0] && tracks[0].id === S.draft.id));
        if (tpl) { const old = S.draft.levels; S.draft.levels = clone(tpl).map((l, i) => Object.assign(l, { id: (old[i] || {}).id })); }
        drawDesign();
        break;
      }
      case 'dtrack': { const tr = tracksOf(S.home).find((x) => x.id === d.id); if (!tr) break; S.dpick = false; S.dtrack = tr.id; S.armTrack = null; S.draft = { id: tr.id, name: tr.name, icon: tr.icon || 'trophy', levels: clone(levelsOf(S.home, tr.id)) }; drawDesign(); break; }
      case 'dnew': S.dpick = true; S.draft = { id: null, name: '', icon: 'star', levels: [] }; drawDesign(); break;
      case 'dpick': {
        const t = (BC.KYU_TRACKS || [])[+d.i];
        S.dpick = false;
        S.draft = t ? { id: null, name: t.name, icon: t.icon, levels: clone(t.levels) } : { id: null, name: '', icon: 'star', levels: [{ name: '10級', color: '#e9e5dc', note: '', tasks: [{ title: '', drill_id: '', target: 10, unit: '回', cond: '', how: '', photo: 'opt' }] }] };
        drawDesign();
        break;
      }
      case 'tremove': {
        if (S.armTrack !== S.draft.id) { S.armTrack = S.draft.id; drawDesign(); break; }
        S.armTrack = null;
        const j = await rpc('bg_track_remove', { p_token: tok(), p_track_id: S.draft.id });
        if (!j.ok) { X.toast && X.toast(errMsg(j)); break; }
        S.home.tracks = j.tracks; S.home.levels = j.levels;
        S.draft = null; S.dtrack = null;
        X.toast && X.toast('しまいました（認定の記録は のこっています）');
        designPage();
        break;
      }
      case 'dreset': S.draft = null; S.dpick = false; go('club'); break;
      case 'dsave': {
        readDesignInputs();
        if (!S.draft.name.trim()) { X.toast && X.toast('種類の 名前を 入れてください'); break; }
        const j = await rpc('bg_track_save', { p_token: tok(), p_track_id: S.draft.id, p_name: S.draft.name, p_icon: S.draft.icon, p_levels: S.draft.levels });
        if (!j.ok) { X.toast && X.toast(errMsg(j)); break; }
        S.home.tracks = j.tracks; S.home.levels = j.levels;
        const tr = j.tracks.find((x) => x.id === j.track_id);
        S.dtrack = j.track_id;
        S.draft = { id: j.track_id, name: tr ? tr.name : S.draft.name, icon: tr ? tr.icon : S.draft.icon, levels: clone(levelsOf(S.home, j.track_id)) };
        X.toast && X.toast('ほぞんしました');
        drawDesign();
        break;
      }
      // 子ども：級の種類をえらぶ
      case 'track': S.track = d.id; kidHome(); break;
      // コーチの 拍手・いいね・怒り
      case 'creact': {
        const on = t.getAttribute('aria-pressed') !== 'true';
        const box = d.kind === 'log' ? S.el.querySelector(`[data-ccomment="${d.id}"]`) : null;
        const j = await rpc('bg_coach_react', { p_token: tok(), p_post_id: d.kind === 'post' ? d.id : null, p_log_id: d.kind === 'log' ? d.id : null, p_stamp: on ? d.k : '', p_comment: box ? box.value : '' });
        if (!j.ok) { X.toast && X.toast(errMsg(j)); break; }
        if (d.kind === 'post') {
          const i = (S.feed || []).findIndex((p) => p.id === d.id);
          if (i >= 0) {
            S.feed[i] = Object.assign({}, S.feed[i], { coach: j.coach });
            const card = S.el.querySelector(`[data-post="${d.id}"]`);
            if (card) { const tmp = document.createElement('div'); tmp.innerHTML = postCard(S.feed[i]); card.replaceWith(tmp.firstElementChild); hydratePhotos(S.el); }
          }
        } else if (S.quest && S.quest.kids) {
          for (const k of S.quest.kids) for (const g of k.logs) if (g.id === d.id) g.coach = j.coach;
          const el = S.el.querySelector(`[data-log="${d.id}"]`);
          const g = S.quest.kids.flatMap((k) => k.logs).find((x) => x.id === d.id);
          if (el && g) { const tmp = document.createElement('div'); tmp.innerHTML = logBlock(g, S.quest.quest); el.replaceWith(tmp.firstElementChild); hydratePhotos(S.el); }
        }
        if (on) X.toast && X.toast(d.k === 'angry' ? '😠 怒りを つけました（みんなに見えます）' : `${stampOf(d.k)[2]} ${stampOf(d.k)[1]}を つけました`);
        break;
      }
      // 自主練（子ども）
      case 'qlog': questLog(d.id); break;
      case 'qdel': {
        if (S.armLog !== d.id) { S.armLog = d.id; t.textContent = 'もう一度 押すと 消えます'; break; }
        S.armLog = null;
        const j = await rpc('bg_quest_log_delete', { p_token: tok(), p_id: d.id });
        X.toast && X.toast(j.ok ? 'とりけしました' : errMsg(j));
        S.home = null;
        rerender();
        break;
      }
      // 自主練（コーチ）
      case 'qtpl': {
        const q = QUEST_TPL[+d.i], f = S.el.querySelector('[data-clform="quest"]');
        if (!q || !f) break;
        f.elements.title.value = q.title; f.elements.drill.value = q.drill_id; f.elements.target.value = q.target; f.elements.unit.value = q.unit;
        f.elements.times.value = q.times; f.elements.how.value = q.how;
        f.elements.end.value = addDays(f.elements.start.value || today(), q.days - 1);
        break;
      }
      case 'qspan': { const f = S.el.querySelector('[data-clform="quest"]'); if (f) f.elements.end.value = addDays(f.elements.start.value || today(), +d.n); break; }
      case 'qclose': {
        if (S.armQ !== d.id) { S.armQ = d.id; t.textContent = 'もう一度 押すと おわります'; break; }
        S.armQ = null;
        const j = await rpc('bg_quest_close', { p_token: tok(), p_id: d.id });
        X.toast && X.toast(j.ok ? 'おわりにしました' : errMsg(j));
        go('club/quests');
        break;
      }
      // 予定（子ども）
      case 'answer': {
        const ev = ((S.home && S.home.events) || []).find((e) => e.id === d.id);
        const cur = ev && ev.mine ? ev.mine.answer : null;
        const ans = cur === d.a ? '' : d.a;
        const j = await rpc('bg_entry', { p_token: tok(), p_event_id: d.id, p_answer: ans, p_note: '' });
        if (!j.ok) { X.toast && X.toast(errMsg(j)); break; }
        await loadHome();
        X.toast && X.toast(ans ? `「${ANSWERS.find((x) => x[0] === ans)[1]}」と 答えました` : '答えを とりけしました');
        drawKidEvents();
        break;
      }
      // 予定（コーチ）
      case 'eset': {
        const k = S.event.kids.find((x) => x.member.id === d.m);
        const ans = k && k.answer === d.a ? '' : d.a;
        const j = await rpc('bg_entry_set', { p_token: tok(), p_event_id: S.event.event.id, p_member_id: d.m, p_answer: ans, p_note: '' });
        if (!j.ok) { X.toast && X.toast(errMsg(j)); break; }
        coachEventPage(S.event.event.id);
        break;
      }
      case 'ecopy': {
        const e = S.event.event;
        const names = (a) => S.event.kids.filter((k) => (k.answer || null) === a).map((k) => k.member.nickname);
        const txt = `【${KINDS[e.kind] || ''}】${e.title}\n${fmtDay(e.day)}${e.time ? ' ' + e.time : ''}${e.place ? ' ' + e.place : ''}\n`
          + [['yes', '参加'], ['maybe', 'まだわからない'], ['no', '参加しない'], [null, 'まだ答えていない']].map(([a, l]) => { const n = names(a); return `${l}（${n.length}）：${n.join('、')}`; }).join('\n');
        try { await navigator.clipboard.writeText(txt); X.toast && X.toast('一覧を コピーしました'); } catch (err) { X.toast && X.toast('コピーできませんでした'); }
        break;
      }
      case 'eclose': {
        const j = await rpc('bg_event_close', { p_token: tok(), p_id: S.event.event.id, p_closed: d.c === '1' });
        X.toast && X.toast(j.ok ? (d.c === '1' ? 'しめきりました' : 'また ひらきました') : errMsg(j));
        coachEventPage(S.event.event.id);
        break;
      }
      case 'edel': {
        const id = S.event.event.id;
        if (S.armEv !== id) { S.armEv = id; t.textContent = 'もう一度 押すと 消えます'; break; }
        S.armEv = null;
        const j = await rpc('bg_event_delete', { p_token: tok(), p_id: id });
        X.toast && X.toast(j.ok ? '消しました' : errMsg(j));
        go('club/events');
        break;
      }
      // 申し込み（コーチ）
      case 'amark': {
        const j = await rpc('bg_apply_mark', { p_token: tok(), p_id: d.id, p_status: d.s });
        if (!j.ok) { X.toast && X.toast(errMsg(j)); break; }
        S.home = null;
        appliesPage();
        break;
      }
      case 'adel': {
        if (S.armApply !== d.id) { S.armApply = d.id; t.textContent = 'もう一度 押すと 消えます'; break; }
        S.armApply = null;
        const j = await rpc('bg_apply_delete', { p_token: tok(), p_id: d.id });
        X.toast && X.toast(j.ok ? '消しました' : errMsg(j));
        S.home = null;
        appliesPage();
        break;
      }
      case 'amember': {
        const a = ((S.applies && S.applies.applies) || []).find((x) => x.id === d.id);
        if (!a) break;
        S.prefill = { nick: a.child.replace(/\s+/g, '').slice(0, 12), grade: a.grade, apply: a.id };
        go('club/members');
        break;
      }
      case 'newcode': {
        if (!S.armCode) { S.armCode = true; t.textContent = 'もう一度 押すと 作りなおします（前のリンクは 使えなくなります）'; break; }
        S.armCode = false;
        const j = await rpc('bg_apply_setup', { p_token: tok(), p_open: null, p_note: null, p_new_code: true });
        X.toast && X.toast(j.ok ? 'リンクを 作りなおしました' : errMsg(j));
        appliesPage();
        break;
      }
      case 'sharelink': {
        try { await navigator.share({ title: `${(S.sess.club || {}).name || 'クラブ'}の 体験・入団の申し込み`, url: d.v }); } catch (err) { /* とじた */ }
        break;
      }
      default: break;
    }
  });
  document.addEventListener('input', (e) => {
    if (!S.el || !S.el.contains(e.target)) return;
    if (e.target.id === 'cl-count') { const f = S.home && findTask(S.home, (document.querySelector('[data-cl="send"]') || {}).dataset.task); if (f) updateMet(f.task); }
  });
  document.addEventListener('change', async (e) => {
    if (e.target.name === 'who' && S.el && S.el.contains(e.target)) {
      const box = e.target.closest('form').querySelector('[data-who]');
      if (box) box.hidden = e.target.value !== 'some';
      return;
    }
    if (e.target.id !== 'cl-file' || !e.target.files || !e.target.files[0]) return;
    const task = e.target.dataset.task;
    X.toast && X.toast('写真を じゅんび中…');
    const r = await shrink(e.target.files[0]);
    if (!r) { X.toast && X.toast('写真を読みこめませんでした'); return; }
    // 書きかけの文・数は のこす
    const keep = { post: (document.getElementById('cl-post') || {}).value, note: (document.getElementById('cl-note') || {}).value, count: (document.getElementById('cl-count') || {}).value };
    S.upload = Object.assign(r, { task });
    if (task === 'post') drawFeed(); else rerender();
    setTimeout(() => {
      if (keep.post && document.getElementById('cl-post')) document.getElementById('cl-post').value = keep.post;
      if (keep.note && document.getElementById('cl-note')) document.getElementById('cl-note').value = keep.note;
      if (keep.count && document.getElementById('cl-count')) document.getElementById('cl-count').value = keep.count;
    }, 0);
  });
  document.addEventListener('submit', async (e) => {
    const f = e.target.closest('[data-clform]');
    if (!f) return;
    e.preventDefault();
    if (S.busy) return;
    const v = (n) => (f.elements[n] ? f.elements[n].value.trim() : '');
    const kind = f.dataset.clform;
    const btn = f.querySelector('button[type="submit"]');
    const done = () => { S.busy = false; if (btn) btn.disabled = false; };
    S.busy = true;
    if (btn) btn.disabled = true;
    let j;
    if (kind === 'kid') {
      j = await rpc('bg_kid_login', { p_code: v('code').toUpperCase(), p_no: parseInt(v('no'), 10) || 0, p_pin: v('pin') });
      done();
      if (!j.ok) return X.toast && X.toast(errMsg(j));
      setSess({ token: j.token, club: { id: j.club.id, code: j.club.code, name: j.club.name }, me: j.me });
      X.toast && X.toast(`ようこそ、${j.me.nickname}さん！`);
      return go('club');
    }
    if (kind === 'coach') {
      j = await rpc('bg_coach_login', { p_code: v('code').toUpperCase(), p_pass: f.elements.pass.value, p_name: v('name') });
      done();
      if (!j.ok) return X.toast && X.toast(errMsg(j));
      setSess({ token: j.token, club: { id: j.club.id, code: j.club.code, name: j.club.name }, me: j.me });
      return go('club');
    }
    if (kind === 'create') {
      if (f.elements.pass.value !== f.elements.pass2.value) { done(); return X.toast && X.toast('合言葉が 2つで ちがっています'); }
      const keys = [...f.querySelectorAll('input[name="tr"]:checked')].map((x) => x.value);
      j = await rpc('bg_club_create', { p_name: v('name'), p_pass: f.elements.pass.value, p_coach: v('coach'), p_levels: BC.KYU_TEMPLATE || [] });
      if (j.ok) {
        // スキルごとの級（えらんだ種類）
        for (const t of (BC.KYU_TRACKS || []).filter((x) => keys.includes(x.key))) await rpc('bg_track_save', { p_token: j.token, p_track_id: null, p_name: t.name, p_icon: t.icon, p_levels: t.levels });
      }
      done();
      if (!j.ok) return X.toast && X.toast(errMsg(j));
      setSess({ token: j.token, club: { id: j.club.id, code: j.club.code, name: j.club.name }, me: j.me });
      X.toast && X.toast('クラブを つくりました！');
      return go('club');
    }
    if (kind === 'addkid') {
      j = await rpc('bg_member_add', { p_token: tok(), p_nickname: v('nick'), p_grade: v('grade') });
      done();
      if (!j.ok) return X.toast && X.toast(errMsg(j));
      if (S.prefill && S.prefill.apply) { await rpc('bg_apply_mark', { p_token: tok(), p_id: S.prefill.apply, p_status: 'done' }); S.home = null; }
      S.prefill = null;
      S.pins[j.member.id] = j.pin;
      await loadMembers();
      return go('club/member/' + j.member.id);
    }
    if (kind === 'editkid') {
      j = await rpc('bg_member_update', { p_token: tok(), p_member_id: f.dataset.id, p_nickname: v('nick'), p_grade: v('grade'), p_reset_pin: false });
      done();
      X.toast && X.toast(j.ok ? 'ほぞんしました' : errMsg(j));
      await loadMembers();
      return memberPage(f.dataset.id);
    }
    if (kind === 'settings') {
      const st = {};
      for (const k of ['review_posts', 'review_photos', 'photos', 'cert_posts']) st[k] = !!(f.elements[k] && f.elements[k].checked);
      j = await rpc('bg_club_update', { p_token: tok(), p_name: v('name'), p_settings: st, p_old_pass: '', p_new_pass: '' });
      done();
      if (j.ok && S.home) { S.home.club = j.club; S.sess.club.name = j.club.name; ls.set(KEY, S.sess); }
      return X.toast && X.toast(j.ok ? 'ほぞんしました' : errMsg(j));
    }
    if (kind === 'pass') {
      j = await rpc('bg_club_update', { p_token: tok(), p_name: '', p_settings: {}, p_old_pass: f.elements.old.value, p_new_pass: f.elements.new.value });
      done();
      if (j.ok) f.reset();
      return X.toast && X.toast(j.ok ? '合言葉を 変えました' : errMsg(j));
    }
    if (kind === 'quest' || kind === 'event') {
      const who = (f.querySelector('input[name="who"]:checked') || {}).value;
      const members = who === 'some' ? [...f.querySelectorAll('input[name="m"]:checked')].map((x) => x.value) : null;
      if (who === 'some' && !members.length) { done(); return X.toast && X.toast('子どもを えらんでね'); }
      const id = f.dataset.id || null;
      if (kind === 'quest') {
        j = await rpc('bg_quest_save', { p_token: tok(), p_id: id, p_title: v('title'), p_drill_id: v('drill'), p_target: parseInt(v('target'), 10) || 0, p_unit: v('unit'),
          p_times: parseInt(v('times'), 10) || 0, p_start: v('start') || null, p_end: v('end') || null, p_photo: v('photo'), p_how: v('how'), p_members: members });
        done();
        if (!j.ok) return X.toast && X.toast(errMsg(j));
        X.toast && X.toast(id ? 'ほぞんしました' : '自主練を 出しました');
        S.home = null;
        return go('club/quest/' + j.quest.id);
      }
      j = await rpc('bg_event_save', { p_token: tok(), p_id: id, p_title: v('title'), p_kind: v('kind'), p_day: v('day') || null, p_time: v('time'), p_place: v('place'),
        p_note: f.elements.note.value, p_deadline: v('deadline') || null, p_capacity: parseInt(v('capacity'), 10) || 0, p_members: members });
      done();
      if (!j.ok) return X.toast && X.toast(errMsg(j));
      X.toast && X.toast(id ? 'ほぞんしました' : '予定を 出しました');
      S.home = null;
      return go('club/event/' + j.event.id);
    }
    if (kind === 'applyset') {
      j = await rpc('bg_apply_setup', { p_token: tok(), p_open: !!f.elements.open.checked, p_note: f.elements.note.value, p_new_code: false });
      done();
      X.toast && X.toast(j.ok ? (j.open ? '申し込みを 受けつけています' : '受けつけを 止めました') : errMsg(j));
      return appliesPage();
    }
    if (kind === 'apply') {
      j = await rpc('bg_apply', { p_code: f.dataset.code, p_kind: (f.querySelector('input[name="kind"]:checked') || {}).value || 'trial', p_child: v('child'), p_kana: v('kana'),
        p_grade: v('grade'), p_guardian: v('guardian'), p_contact: v('contact'), p_message: f.elements.message.value });
      done();
      if (!j.ok) return X.toast && X.toast(errMsg(j));
      S.applied = f.dataset.code; S.appliedClub = j.club;
      return applyPublicPage(f.dataset.code);
    }
    if (kind === 'delclub') {
      if (S.armClub !== true) { S.armClub = true; done(); if (btn) btn.textContent = 'もう一度 押すと、すべて消えます'; return; }
      S.armClub = false;
      j = await rpc('bg_club_delete', { p_token: tok(), p_pass: f.elements.pass.value });
      done();
      if (!j.ok) return X.toast && X.toast(errMsg(j));
      setSess(null);
      X.toast && X.toast('クラブを消しました');
      return go('club');
    }
    done();
  });
})();
