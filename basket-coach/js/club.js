/* クラブの画面：コーチがつくった級（きゅう）に チャレンジ → 写真をつけて提出 → コーチが評価・認定 → ひろばで いいね。
   サーバーは Supabase（club/schema.sql の bg_* 関数）。接続先は js/club-config.js（BC.CLUB_CONFIG）。
   BC.club.render(el, ctx, sub)
     sub（#club/…）：''（ホーム）・'feed'（ひろば）・'task/<id>'（課題）・'coach'（コーチのログイン）・'create'（クラブをつくる）・
       コーチだけ：'review'（確認）・'members'・'member/<id>'・'design'（級をつくる）・'settings'・'cards'（ログインカード）
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
      return coachHome();
    }
    const [a, b] = S.sub.split('/');
    if (a === 'feed') return feedPage();
    if (a === 'task') return taskPage(b);
    return kidHome();
  };
  const paint = (html) => { if (S.el) { S.el.innerHTML = html; hydratePhotos(S.el); hydrateArt(S.el); } };
  // 練習メニューの小さな絵（app.js の drillArt を使う）
  function hydrateArt() { /* drillArt は HTML を返すので、描くときに入れている */ }
  const rerender = () => C.render(S.el, X, S.sub);
  function go(hash) { if (location.hash.slice(1) === hash) rerender(); else location.hash = hash; }

  /* ---------- ログインしていない ---------- */
  function welcomePage() {
    const msg = S.msg; S.msg = '';
    paint(`<section class="cl-hero">
        <div class="cl-hero-ic">${ic('trophy')}</div>
        <h1 class="page-h">クラブ</h1>
        <p>コーチが つくった <b>級（きゅう）</b>に チャレンジ！ 写真をつけて送ると、コーチが見て「合格」を返してくれます。クラブの なかまと、がんばったことを 見せあって「いいね」できます。</p>
      </section>
      ${msg ? `<p class="cl-msg">${esc(msg)}</p>` : ''}
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
        <div class="field"><span class="field-l">級（きゅう）</span>
          <p class="small">10級 → 1級 の テンプレート（各級に 課題が4つ）で はじめます。課題・回数・写真の有無は、あとで「級をつくる」で 自由に直せます。</p></div>
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
    ls.set('bc.club.cache', { me: j.me, club: S.sess.club, next: nextLevel(j), at: Date.now() });
    setBadge(noticeCount(j));
    return j;
  }
  const noticeCount = (h) => (h.me.role === 'coach' ? (h.counts.pending || 0) + (h.counts.waiting || 0) + (h.counts.ready || 0) : (h.notices.reviews || 0) + (h.notices.certs || 0) + (h.notices.reacts || 0));
  function setBadge(n) { S.badge = n; if (C.onBadge) C.onBadge(n); }
  const certSet = (h) => new Set((h.certs || []).map((c) => c.level_id));
  const latestSub = (h, taskId) => (h.subs || []).find((s) => s.task_id === taskId) || null;
  const passed = (h, taskId) => (h.subs || []).some((s) => s.task_id === taskId && s.status === 'pass');
  // いまの目標の級：まだ認定されていない いちばん下の級
  function nextLevel(h) {
    if (!h || !h.levels) return null;
    const cs = certSet(h);
    const l = h.levels.find((x) => !cs.has(x.id));
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
          <p class="center">${esc(h.me.nickname)}さん、<b>${esc(l.name)}</b>に 合格しました！</p>
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
  async function kidHome() {
    if (!S.home) paint(loading());
    const h = await loadHome();
    if (!h.ok) return welcomeOr(h);
    celebrateNew(h);
    const cs = certSet(h);
    const cur = h.levels.find((x) => !cs.has(x.id));
    const n = h.notices;
    const notice = [n.reviews && `コーチから 返事が <b>${n.reviews}</b>つ`, n.certs && `級の合格が <b>${n.certs}</b>つ`, n.reacts && `ひろばで スタンプが <b>${n.reacts}</b>こ`].filter(Boolean);
    const taskRow = (t, open) => {
      const s = latestSub(h, t.id);
      const ok = passed(h, t.id);
      const d = drill(t.drill_id);
      return `<a class="row-card cl-task${ok ? ' ok' : ''}" href="#club/task/${t.id}">${d && X.drillArt ? X.drillArt(d) : `<span class="thumb art-ic">${ic('target')}</span>`}
        <span class="rc-body"><span class="rc-title">${esc(t.title)}</span><span class="rc-sub cl-goal">${ic('target')}${esc(BC.kyuGoal(t))}</span>
        ${s && s.comment && s.status !== 'pending' ? `<span class="cl-coach-mini">${ic('whistle')}${esc(s.comment)}</span>` : ''}</span>
        ${ok ? pill('pass') : s ? pill(s.status) : pill(null)}</a>`;
    };
    const ladder = h.levels.slice().reverse().map((l) => {
      const st = cs.has(l.id) ? 'done' : cur && l.id === cur.id ? 'now' : 'lock';
      const done = l.tasks.filter((t) => passed(h, t.id)).length;
      return `<details class="cl-step ${st}"><summary><span class="cl-step-k" style="${kv(l.color)}">${esc(l.name)}</span>
        <span class="cl-step-t">${st === 'done' ? `${ic('check')}合格` : st === 'now' ? `いまの目標 <b class="num">${done}</b>/${l.tasks.length}` : `${ic('flag')}${esc(l.note || '')}`}</span></summary>
        <div class="rows">${l.tasks.map((t) => taskRow(t)).join('') || '<p class="empty">課題はまだありません</p>'}</div></details>`;
    }).join('');
    paint(`<section class="cl-me">
        <div class="cl-me-top">${kyuBadge(h.me.kyu, 'big')}<div><p class="cl-club">${esc(h.club.name)}</p><p class="cl-name">${esc(h.me.nickname)}<small>（${h.me.no}ばん）</small></p></div></div>
        ${cur ? `<p class="cl-next">つぎは <b>${esc(cur.name)}</b>：課題 <b class="num">${cur.tasks.filter((t) => passed(h, t.id)).length}</b> / ${cur.tasks.length} 合格</p>
          <div class="xpbar cl-bar"><i style="width:${cur.tasks.length ? Math.round(100 * cur.tasks.filter((t) => passed(h, t.id)).length / cur.tasks.length) : 0}%"></i></div>` : '<p class="cl-next">すべての級に 合格！ すごい！</p>'}
      </section>
      ${notice.length ? `<button type="button" class="cl-notice" data-cl="seen">${ic('star')}<span>${notice.join('・')}</span><small>OK</small></button>` : ''}
      <nav class="cl-tabs"><a href="#club" aria-current="page">${ic('trophy')}級にチャレンジ</a><a href="#club/feed">${ic('people')}みんなの ひろば</a></nav>
      ${cur ? `<section class="sec cl-cur"><h2 class="sec-h">${ic('target')}${esc(cur.name)}の 課題</h2><p class="small">課題をえらんで、できたら「送る」。写真をつけると、コーチが見やすいよ。</p>
        <div class="rows">${cur.tasks.map((t) => taskRow(t)).join('')}</div></section>` : ''}
      <section class="sec"><h2 class="sec-h">${ic('up')}級の かいだん</h2><div class="cl-ladder">${ladder}</div></section>
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
    const cur = h.levels.find((x) => !cs.has(x.id));
    const canSend = !passed(h, t.id) && cur && cur.id === l.id;
    const subs = (h.subs || []).filter((s) => s.task_id === t.id);
    const d = drill(t.drill_id);
    const checks = (X.checks ? X.checks() : []).slice(0, 6);
    const up = S.upload && S.upload.task === t.id ? S.upload : null;
    paint(`${backLink('#club', '級にもどる')}
      <p class="eyebrow">${kyuBadge(l)} 級の課題</p>
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
    if (!isCoach()) rpc('bg_seen', { p_token: tok() }).then(() => { if (S.home) { S.home.notices.reacts = 0; setBadge(noticeCount(S.home)); } });
    drawFeed();
  }
  function postCard(p) {
    const me = S.sess.me;
    const mine = p.member && p.member.id === me.id;
    const st = p.status !== 'shown' ? `<span class="cl-st ${p.status === 'waiting' ? 'wait' : 'retry'}">${p.status === 'waiting' ? 'コーチの確認まち' : 'かくされています'}</span>` : '';
    const body = p.kind === 'cert'
      ? `<div class="cl-cert" style="${kv(p.meta.color)}"><span class="cl-cert-k">${esc(p.meta.level || '')}</span><span><b>${esc(p.member.nickname)}さんが ${esc(p.meta.level || '')}に 合格！</b>${p.meta.comment ? `<small>${ic('whistle', 'inline')}${esc(p.meta.by || 'コーチ')}：${esc(p.meta.comment)}</small>` : ''}</span></div>`
      : `${p.kind === 'share' ? `<p class="cl-share">${ic(p.meta.type === 'badge' ? 'medal' : p.meta.type === 'check' ? 'camera' : p.meta.type === 'streak' ? 'fire' : 'trophy')}<span>${esc(p.meta.label || '')}</span></p>` : ''}
         ${p.body ? `<p class="cl-body">${esc(p.body)}</p>` : ''}${photoTag(p.photo_id)}`;
    return `<article class="card cl-post${p.kind === 'cert' ? ' cert' : ''}" data-post="${p.id}">
      <header class="cl-post-h">${avatar(p.member)}<span class="cl-post-who"><b>${esc(p.member.nickname)}</b>${p.member.role === 'coach' ? '<span class="cl-st">コーチ</span>' : kyuBadge(p.member.kyu, 'small')}</span><span class="small">${esc(ago(p.created_at))}</span>${st}</header>
      ${body}
      <footer class="cl-stamps">${STAMPS.map(([k, label, e]) => `<button type="button" class="cl-stamp" data-cl="react" data-id="${p.id}" data-k="${k}" aria-pressed="${(p.mine || []).includes(k)}" ${p.status === 'hidden' ? 'disabled' : ''}><span aria-hidden="true">${e}</span>${label}<b class="num">${(p.reacts || {})[k] || ''}</b></button>`).join('')}</footer>
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
      ${isCoach() ? '<h1 class="page-h">ひろば</h1>' : `<nav class="cl-tabs"><a href="#club">${ic('trophy')}級にチャレンジ</a><a href="#club/feed" aria-current="page">${ic('people')}みんなの ひろば</a></nav>`}
      <section class="card cl-compose">
        <label class="sr" for="cl-post">がんばったこと</label>
        <textarea id="cl-post" maxlength="140" rows="2" placeholder="${isCoach() ? 'クラブのみんなへ ひとこと' : 'きょう がんばったことを 書こう'}"></textarea>
        ${shares.length ? `<div class="chips">${shares.map((s, i) => `<button type="button" class="chip" data-cl="share" data-i="${i}">${ic(s.type === 'badge' ? 'medal' : s.type === 'check' ? 'camera' : 'trophy', 'inline')}${esc(s.label)}</button>`).join('')}</div>` : ''}
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
    paint(`<section class="cl-me coach">
        <div class="cl-me-top">${avatar(h.me)}<div><p class="cl-club">${esc(h.club.name)}</p><p class="cl-name">${esc(h.me.nickname)}<small>（コーチ）</small></p></div></div>
        <p class="cl-code">クラブコード <b class="num">${esc(h.club.code)}</b><button type="button" class="link-btn" data-cl="copy" data-v="${esc(h.club.code)}">コピー</button></p>
      </section>
      <section class="cl-tiles">
        <a class="cl-tile${c.pending ? ' hot' : ''}" href="#club/review"><b class="num">${c.pending}</b><span>確認まちの 提出</span></a>
        <a class="cl-tile${c.ready ? ' hot' : ''}" href="#club/review"><b class="num">${c.ready}</b><span>認定できる 級</span></a>
        <a class="cl-tile${c.waiting ? ' hot' : ''}" href="#club/feed"><b class="num">${c.waiting}</b><span>ひろばの 確認まち</span></a>
        <a class="cl-tile" href="#club/members"><b class="num">${c.kids}</b><span>子ども</span></a>
      </section>
      <div class="rows">
        <a class="row-card more-row" href="#club/review"><span class="thumb art-ic">${ic('check')}</span><span class="rc-body"><span class="rc-title">確認・評価・級の認定</span><span class="rc-sub">写真を見て「合格」「もう一度」。課題がそろった子に 級を認定</span></span>${ic('next', 'rc-go')}</a>
        <a class="row-card more-row" href="#club/members"><span class="thumb art-ic">${ic('people')}</span><span class="rc-body"><span class="rc-title">メンバー・ログインカード</span><span class="rc-sub">子どもを登録して、カードをわたす。あいことばの作りなおし</span></span>${ic('next', 'rc-go')}</a>
        <a class="row-card more-row" href="#club/design"><span class="thumb art-ic">${ic('trophy')}</span><span class="rc-body"><span class="rc-title">級をつくる</span><span class="rc-sub">${h.levels.length}つの級・課題と回数を 自由に</span></span>${ic('next', 'rc-go')}</a>
        <a class="row-card more-row" href="#club/feed"><span class="thumb art-ic">${ic('chat')}</span><span class="rc-body"><span class="rc-title">ひろば</span><span class="rc-sub">子どもの投稿・合格のお知らせ。確認して出す・かくす</span></span>${ic('next', 'rc-go')}</a>
        <a class="row-card more-row" href="#club/settings"><span class="thumb art-ic">${ic('sliders')}</span><span class="rc-body"><span class="rc-title">せってい</span><span class="rc-sub">投稿のルール・写真・合言葉・ログアウト</span></span>${ic('next', 'rc-go')}</a>
      </div>
      ${c.kids ? '' : `<section class="card"><h2 class="sec-h">${ic('flag')}はじめに</h2><ol class="steps"><li><span>「メンバー」で 子どもを登録する（ニックネームでOK）</span></li><li><span>ログインカードを 印刷して わたす</span></li><li><span>「級をつくる」で、課題と回数を クラブに合わせる</span></li></ol></section>`}`);
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
        <p>${esc(r.level.name)}の 課題が ぜんぶ合格しました。</p>
        <input type="text" class="cl-in" maxlength="200" placeholder="ひとこと（例：よくがんばったね！）" data-for="${r.member.id}:${r.level.id}">
        <button type="button" class="btn primary" data-cl="grant" data-m="${r.member.id}" data-l="${r.level.id}">${ic('trophy')}${esc(r.level.name)} 合格にする</button></div>`).join('');
    const pend = j.pending.map((s) => {
      const t = s.task;
      const met = s.count != null && BC.kyuMet(t, s.count);
      return `<article class="card cl-q" data-sub="${s.id}">
        <header class="cl-post-h">${avatar(s.member)}<span class="cl-post-who"><b>${esc(s.member.nickname)}</b><small>${s.member.no}ばん・${esc(ago(s.created_at))}</small></span>${kyuBadge(s.member.kyu, 'small')}</header>
        <p class="cl-q-task">${kyuBadge(t.level, 'small')}<b>${esc(t.title)}</b></p>
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
        <label class="field"><span class="field-l">ニックネーム（本名でなくてOK）</span><input name="nick" maxlength="12" required></label>
        <label class="field"><span class="field-l">学年</span><select name="grade"><option value="">（えらばない）</option>${Object.entries(GRADES).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></label>
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
        <div class="cl-levels">${S.home.levels.map((l) => `<button type="button" class="cl-lv${certs.has(l.id) ? ' on' : ''}" style="${kv(l.color)}" data-cl="${certs.has(l.id) ? 'uncert' : 'cert'}" data-m="${k.id}" data-l="${l.id}">${esc(l.name)}<small>${certs.has(l.id) ? '合格' : '—'}</small></button>`).join('')}</div></section>
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

  /* ---------- コーチ：級をつくる ---------- */
  const UNITS = ['回', '本', '秒', '往復', 'セット', '分', '周', 'm', '点'];
  async function designPage() {
    if (!S.home) { paint(loading()); const j = await loadHome(); if (!j.ok) return welcomeOr(j); }
    if (!S.draft) S.draft = JSON.parse(JSON.stringify(S.home.levels));
    drawDesign();
  }
  function drawDesign() {
    const D = S.draft;
    const drills = (BC.lists && BC.lists.drill) || [];
    paint(`${backLink('#club', 'コーチのページ')}<h1 class="page-h">級をつくる</h1>
      <p class="small">下の級から じゅんに。課題の 目標（回数・本数・秒）を クラブに合わせて変えられます。「練習メニュー」をえらぶと、子どもは やりかたとアニメーションを見られます。</p>
      <datalist id="cl-drills">${drills.map((d) => `<option value="${esc(d.id)}">${esc(d.name)}</option>`).join('')}</datalist>
      ${D.map((l, i) => `<section class="card cl-dlv" style="${kv(l.color)}">
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
      <div class="btns"><button type="button" class="btn" data-cl="ladd">${ic('plus')}級を 足す（いちばん上に）</button><button type="button" class="btn" data-cl="ltpl">テンプレートに もどす</button></div>
      <div class="do-bar cl-save"><button type="button" class="btn big" data-cl="dreset">やめる</button><button type="button" class="btn primary big" data-cl="dsave">${ic('save')}ほぞんする</button></div>
      <p class="small">課題を消しても、合格した記録は のこります（子どもの画面からは 見えなくなります）。</p>`);
  }
  function readDesignInputs() {
    if (!S.el || !S.draft) return;
    S.el.querySelectorAll('[data-d]').forEach((el) => {
      const i = +el.dataset.i, j = el.dataset.j != null ? +el.dataset.j : null, k = el.dataset.d;
      const l = S.draft[i];
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
        ${tg('cert_posts', '級の合格を ひろばで お知らせ', 'みんなで おめでとうを言える', true)}
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

  /* ---------- ホームのカード・お知らせ ---------- */
  C.homeHTML = function () {
    if (!C.ready()) return '';
    const cache = ls.get('bc.club.cache', null);
    if (!S.sess || !cache) return `<a class="card cta cl-cta" href="#club">${ic('trophy')}<b>クラブ</b><small>コーチがつくった級に チャレンジ。ログインカードを もらった人は ここから</small></a>`;
    const me = cache.me, nx = cache.next;
    if (me.role === 'coach') return `<a class="card cl-homecard" href="#club">${ic('whistle')}<span><b>${esc(cache.club.name)}</b><small>コーチのページ${S.badge ? `・<b>${S.badge}</b>件 まっています` : ''}</small></span>${ic('next', 'rc-go')}</a>`;
    return `<a class="card cl-homecard" href="#club">${kyuBadge(me.kyu)}<span><b>${esc(cache.club.name)}</b><small>${nx ? `つぎは ${esc(nx.name)}：課題 ${nx.done}/${nx.total} 合格` : 'すべての級に 合格！'}${S.badge ? `・<b class="cl-red">お知らせ ${S.badge}</b>` : ''}</small></span>${ic('next', 'rc-go')}</a>`;
  };
  C.refresh = async function () {
    if (!C.ready() || !S.sess) return 0;
    const j = await loadHome();
    return j && j.ok ? S.badge : 0;
  };
  C.badge = () => S.badge;
  C.session = () => S.sess;

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
        if (S.home) { S.home.notices = { reviews: 0, certs: 0, reacts: 0 }; setBadge(0); }
        t.remove();
        break;
      case 'copy':
        try { await navigator.clipboard.writeText(d.v); X.toast && X.toast('コピーしました'); } catch (err) { /* なし */ }
        break;
      case 'cnt': {
        const inp = document.getElementById('cl-count');
        if (inp) { inp.value = Math.max(0, (+inp.value || 0) + +d.d); const f = findTask(S.home, (document.querySelector('[data-cl="send"]') || {}).dataset.task); if (f) updateMet(f.task); }
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
        X.toast && X.toast(`${j.member.nickname}さんを ${j.member.kyu ? j.member.kyu.name : ''}に 認定しました`);
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
      // 級をつくる
      case 'tnum': { readDesignInputs(); const tk = S.draft[+d.i].tasks[+d.j]; tk.target = Math.max(1, Math.min(9999, (+tk.target || 1) + +d.d)); drawDesign(); break; }
      case 'tadd': readDesignInputs(); S.draft[+d.i].tasks.push({ title: '', drill_id: '', target: 10, unit: '回', cond: '', how: '', photo: 'opt' }); drawDesign(); break;
      case 'tdel': readDesignInputs(); S.draft[+d.i].tasks.splice(+d.j, 1); drawDesign(); break;
      case 'lcolor': readDesignInputs(); S.draft[+d.i].color = d.c; drawDesign(); break;
      case 'lup': case 'ldown': {
        readDesignInputs();
        const i = +d.i, j2 = d.cl === 'lup' ? i - 1 : i + 1;
        if (j2 >= 0 && j2 < S.draft.length) [S.draft[i], S.draft[j2]] = [S.draft[j2], S.draft[i]];
        drawDesign();
        break;
      }
      case 'ldel': readDesignInputs(); if (S.draft.length > 1) S.draft.splice(+d.i, 1); drawDesign(); break;
      case 'ladd': readDesignInputs(); S.draft.push({ name: '', color: '#888888', note: '', tasks: [] }); drawDesign(); break;
      case 'ltpl': S.draft = JSON.parse(JSON.stringify(BC.KYU_TEMPLATE)).map((l, i) => Object.assign(l, { id: (S.home.levels[i] || {}).id })); drawDesign(); break;
      case 'dreset': S.draft = null; go('club'); break;
      case 'dsave': {
        readDesignInputs();
        const j = await rpc('bg_levels_save', { p_token: tok(), p_levels: S.draft });
        if (!j.ok) { X.toast && X.toast(errMsg(j)); break; }
        S.draft = JSON.parse(JSON.stringify(j.levels));
        S.home.levels = j.levels;
        X.toast && X.toast('ほぞんしました');
        drawDesign();
        break;
      }
      default: break;
    }
  });
  document.addEventListener('input', (e) => {
    if (!S.el || !S.el.contains(e.target)) return;
    if (e.target.id === 'cl-count') { const f = findTask(S.home, (document.querySelector('[data-cl="send"]') || {}).dataset.task); if (f) updateMet(f.task); }
  });
  document.addEventListener('change', async (e) => {
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
      j = await rpc('bg_club_create', { p_name: v('name'), p_pass: f.elements.pass.value, p_coach: v('coach'), p_levels: BC.KYU_TEMPLATE || [] });
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
