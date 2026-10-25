/* バスケ・グロウ：画面。小学生・中学生が、自分で使って上達するためのアプリ。
   データ（BC）・人の動き（BC.motion）・成長（BC.grow）・動画チェック（BC.check）・ケガとテーピング（BC.aids・BC.tapes）を見て描く。
   タブ：#home（ホーム）・#practice（れんしゅう）・#check（チェック）・#log（きろく）・#more（もっと）
   ページ：#s/<技能 id>・#<項目 id>（d-… 練習メニュー・v-… 見るポイント・i-… なやみ・t-… 戦術）・#aid・#aid/<a-…>・#tape/<tp-…>・
          #plan（プランをつくる）・#chat（コーチにそうだん）・#lib（ずかん）・#settings（せってい）・#hello（はじめての人）・#check/<種類>・#check/rec/<id>
   この端末に残すもの（localStorage）：プロフィール bc.me・やったこと bc.acts・動画チェック bc.checks・会話 bc.log・プラン bc.pl / bc.plans・
     お気に入り bc.favs・見るポイントのチェック bc.vchk・きょうのメニューの長さ bc.menuMin */
(function () {
  const BC = window.BC;
  const G = BC.grow;
  const app = document.getElementById('app');
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const md = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
  const plain = (s) => String(s || '').replace(/\*\*/g, '');
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* 保存できない環境でも動く */ } },
  };
  const get = (id) => BC.get(id);
  const items = (ids) => (ids || []).map(get).filter(Boolean);
  const skillName = (id) => (BC.skillMap[id] || {}).name || '';
  const labelOf = (it) => (it.kind_ === 'issue' ? it.title : it.name);
  const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  const S = {
    me: store.get('bc.me', null),
    acts: store.get('bc.acts', []),
    log: store.get('bc.log', []),
    favs: new Set(store.get('bc.favs', [])),
    vchk: store.get('bc.vchk', {}),
    menuMin: store.get('bc.menuMin', 15),
    seed: 0,
    tab: 'home',
    page: '',
    hash: null,
    lib: { q: '', kind: 'issue', skill: '' },
    dfilter: null,
    calMonth: 0,
  };
  const checks = () => store.get('bc.checks', []);
  const sum = () => G.summary(S.acts, Date.now(), checks());
  const saveLog = () => { S.log = S.log.slice(-60); store.set('bc.log', S.log); };
  const prof = () => S.me || {};
  const cond = () => ({ n: prof().n || 1, level: prof().level || null, place: prof().place || null });

  /* ---------- 絵（アイコン） ---------- */
  const P = {
    home: '<path d="M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    ball: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3v18M5.6 5.6c3.6 3.8 3.6 9 0 12.8M18.4 5.6c-3.6 3.8-3.6 9 0 12.8"/>',
    camera: '<path d="M4 7h3l2-2.5h6L17 7h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.6"/>',
    chart: '<path d="M5 20v-8M12 20V5M19 20v-5M3 20h18"/>',
    more: '<circle cx="5" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="19" cy="12" r="1.6" fill="currentColor"/>',
    back: '<path d="m15 5-7 7 7 7"/>',
    next: '<path d="m9 5 7 7-7 7"/>',
    play: '<path d="M8 5v14l11-7z" fill="currentColor" stroke="none"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    fire: '<path d="M12 3c.8 3.5 5 5.2 5 10a5 5 0 0 1-10 0c0-2.2 1-3.6 2.2-4.6.1 1.9 1 3 2.2 3.2-.3-3.3-.4-5.6.6-8.6z"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    people: '<circle cx="9" cy="8" r="3"/><path d="M3.5 20c0-3.3 2.5-5.5 5.5-5.5s5.5 2.2 5.5 5.5"/><circle cx="17" cy="9" r="2.4"/><path d="M15.8 14.6c2.6.1 4.7 2 4.7 5.4"/>',
    person: '<circle cx="12" cy="7.5" r="3.5"/><path d="M5 20.5c0-4 3-6.5 7-6.5s7 2.5 7 6.5"/>',
    house: '<path d="M4 11 12 5l8 6v9H4z"/><path d="M10 20v-5h4v5"/>',
    hoop: '<path d="M4 4h16v7H4z"/><path d="M9 11h6"/><path d="m8 11 1.5 9h5L16 11"/>',
    shield: '<path d="M12 3 19 6v6c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6z"/>',
    shoe: '<path d="M3 16.5c0-3.5 1.2-7.5 3-9.5l3 2.2c1.2.9 3 .9 4 0l1-.9 7 5v3.2a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 16.5z"/><path d="M3.2 15h17.6"/>',
    list: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1" fill="currentColor"/><circle cx="4.5" cy="12" r="1" fill="currentColor"/><circle cx="4.5" cy="18" r="1" fill="currentColor"/>',
    grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
    crown: '<path d="m3 18 1.8-10 5 4.5L12 5l2.2 7.5 5-4.5L21 18z"/><path d="M3.5 21h17"/>',
    medal: '<circle cx="12" cy="15" r="5"/><path d="M8 3l3.2 7M16 3l-3.2 7"/><path d="m12 13 .8 1.6 1.7.2-1.3 1.2.4 1.7-1.6-.9-1.6.9.4-1.7-1.3-1.2 1.7-.2z" fill="currentColor" stroke="none"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3 7 7M17 17l1.7 1.7M5.3 18.7 7 17M17 7l1.7-1.7"/>',
    aid: '<rect x="3.5" y="5.5" width="17" height="14" rx="3"/><path d="M12 9v7M8.5 12.5h7"/><path d="M9 5.5V4h6v1.5"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    chat: '<path d="M4 5h16v11H9.5L5 20v-4H4z"/>',
    book: '<path d="M4 4h6a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4zM20 4h-6a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h6z"/>',
    sliders: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
    timer: '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 10v3.5l2.2 1.8M9.5 2.5h5"/>',
    shuffle: '<path d="M3 7h4.5l9 10H21M3 17h4.5l2.4-2.7M14.1 9.7 16.5 7H21"/><path d="m18.5 4.5 2.5 2.5-2.5 2.5M18.5 14.5l2.5 2.5-2.5 2.5"/>',
    trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5.2c0 2.4 1.2 3.8 3 4M16 6h2.8c0 2.4-1.2 3.8-3 4M12 13v4M8.5 20.5h7M10 17h4v3.5h-4z"/>',
    plan: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3h6v3H9zM8.5 11h7M8.5 15h4.5"/>',
    bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.8 10.6c.7.6 1 1.3 1 2.4h5.6c0-1.1.3-1.8 1-2.4A6 6 0 0 0 12 3z"/>',
    warn: '<path d="M12 4 21.5 20h-19z"/><path d="M12 10v4.5M12 17.2v.3"/>',
    phone: '<path d="M5.5 3.5h3.2l1.8 4.6-2.4 1.6a11 11 0 0 0 6.2 6.2l1.6-2.4 4.6 1.8v3.2a1.6 1.6 0 0 1-1.7 1.6C10.5 19.6 4.4 13.5 3.9 5.2a1.6 1.6 0 0 1 1.6-1.7z"/>',
    heart: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.2 4.2 0 0 1 12 7.2a4.2 4.2 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z"/>',
    tape: '<circle cx="11" cy="12" r="7.5"/><circle cx="11" cy="12" r="2.8"/><path d="M18.5 12H22v4h-6"/>',
    eye: '<path d="M2 12s3.8-6.5 10-6.5S22 12 22 12s-3.8 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor"/>',
    whistle: '<path d="M3 10.5h9.5l6-3.5 2 3.4-4.4 2.6A5.5 5.5 0 1 1 3 10.5z"/><circle cx="8.5" cy="14" r="1.5"/>',
    pencil: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
    bolt: '<path d="M13 2.5 5 13.5h6l-1 8 8-11h-6z"/>',
    flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
    pin: '<path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
    up: '<path d="m6 15 6-6 6 6"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    trash: '<path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13"/>',
    save: '<path d="M5 4h11l3 3v13H5z"/><path d="M8 4v5h7V4M8 20v-6h8v6"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
    pause: '<path d="M8 5h3v14H8zM13 5h3v14h-3z" fill="currentColor" stroke="none"/>',
    gift: '<rect x="4" y="9" width="16" height="11" rx="1.5"/><path d="M3 9h18M12 9v11M12 9S10.5 4 8 4.5 7 8.5 12 9zM12 9s1.5-5 4-4.5S17 8.5 12 9z"/>',
  };
  const ic = (name, cls = '') => `<svg class="ic${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || P.ball}</svg>`;
  const LOGO = '<svg class="logo-mark" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="14" fill="var(--ball)"/><path d="M2 16h28M16 2v28M6.2 6.2c5 5.2 5 14.4 0 19.6M25.8 6.2c-5 5.2-5 14.4 0 19.6" fill="none" stroke="var(--sheet)" stroke-width="1.8"/></svg>';
  const FACE = {
    3: '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="21" fill="var(--ok-soft)" stroke="var(--ok)" stroke-width="2.5"/><circle cx="17" cy="20" r="2.6" fill="var(--ok)"/><circle cx="31" cy="20" r="2.6" fill="var(--ok)"/><path d="M14.5 28c2.4 5.2 16.6 5.2 19 0" fill="none" stroke="var(--ok)" stroke-width="3" stroke-linecap="round"/></svg>',
    2: '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="21" fill="var(--warn-soft)" stroke="var(--warn)" stroke-width="2.5"/><circle cx="17" cy="20" r="2.6" fill="var(--warn)"/><circle cx="31" cy="20" r="2.6" fill="var(--warn)"/><path d="M16 30.5c3 2 13 2 16 0" fill="none" stroke="var(--warn)" stroke-width="3" stroke-linecap="round"/></svg>',
    1: '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="21" fill="var(--bad-soft)" stroke="var(--bad)" stroke-width="2.5"/><path d="M13.5 19.5l6 2M34.5 19.5l-6 2" stroke="var(--bad)" stroke-width="3" stroke-linecap="round"/><path d="M16 32c3-3.4 13-3.4 16 0" fill="none" stroke="var(--bad)" stroke-width="3" stroke-linecap="round"/></svg>',
  };
  const RATE = { 3: 'できた！', 2: 'まあまあ', 1: 'むずかしかった' };

  /* ---------- 技能の絵（人のアニメーションの1コマ） ---------- */
  const SKILL_ART = {
    shoot: ['shoot', 0.42, null], finish: ['layup', 0.62, null], dribble: ['pound', 0.2, null], pass: ['chestpass', 0.45, null],
    foot: ['jumpstop', 0.62, null], attack: ['crossover', 0.3, null], offball: ['speed', 0.3, null], rebound: ['boxout', 0.6, null],
    defball: ['stance', 0.3, null], defteam: ['closeout', 0.72, null], transition: ['speed', 0.6, null], teamoff: ['chestpass', 0.3, null],
    body: ['lunge', 0.3, null], iq: null, mind: null, coach: null,
  };
  const SKILL_ICON = { iq: 'bulb', mind: 'heart', coach: 'whistle', body: 'bolt', teamoff: 'people', defteam: 'shield', transition: 'bolt' };
  // 人の絵がちょうど入る範囲（小さな絵用。aspect は 横 ÷ たて）
  const boxCache = {};
  function personBox(mid, t, aspect = 1) {
    const key = mid + '@' + t + '@' + aspect;
    if (boxCache[key]) return boxCache[key];
    const fr = BC.motionFrame(BC.motions[mid], t);
    let x0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const k of fr.sk) {
      for (const p of [k.head, k.sh, k.hip, k.r.hand, k.l.hand, k.r.elb, k.l.elb, k.r.knee, k.l.knee, k.r.ank, k.l.ank, ...k.r.foot, ...k.l.foot]) {
        x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]);
      }
      y1 = Math.max(y1, k.head[1] + 0.16);
    }
    // 人の近くのボールだけ入れる
    for (const b of fr.balls) if (b[0] > x0 - 0.45 && b[0] < x1 + 0.45 && b[1] < y1 + 0.4) { x0 = Math.min(x0, b[0] - 0.14); x1 = Math.max(x1, b[0] + 0.14); y1 = Math.max(y1, b[1] + 0.14); }
    x0 -= 0.16; x1 += 0.16; y1 += 0.08;
    let y0 = -0.08;
    const w = x1 - x0, h = y1 - y0;
    if (w / h < aspect) { const d = (h * aspect - w) / 2; x0 -= d; x1 += d; } else { const d = w / aspect - h; y1 += d * 0.6; y0 -= d * 0.4; }
    return (boxCache[key] = [x0, x1, y0, y1]);
  }
  function skillArt(sid, cls = 'art', aspect = 1.25) {
    const a = SKILL_ART[sid];
    if (a && BC.motions[a[0]]) return `<span class="${cls}">${BC.motionSVG(a[0], a[1], { box: personBox(a[0], a[1], aspect), noScene: true })}</span>`;
    return `<span class="${cls} art-ic">${ic(SKILL_ICON[sid] || 'ball')}</span>`;
  }
  function drillArt(d, cls = 'thumb') {
    const mid = BC.motionFor && BC.motionFor(d.id);
    if (mid) {
      const clip = BC.motions[mid];
      const t = clip.still != null ? clip.still : 0.3;
      return `<span class="${cls}">${BC.motionSVG(mid, t, { box: personBox(mid, t, 1), noScene: true })}</span>`;
    }
    return `<span class="${cls} art-ic">${ic(SKILL_ICON[(d.skills || [])[0]] || 'ball')}</span>`;
  }

  /* ---------- 小さな部品 ---------- */
  const stars = (n, max = 3) => `<span class="stars" aria-label="${n} / ${max}">${Array.from({ length: max }, (_, i) => `<i class="${i < n ? 'on' : ''}">★</i>`).join('')}</span>`;
  const LV_WORD = { 1: 'はじめて', 2: 'なれてきた', 3: 'じょうきゅう' };
  const pills = (d) => [
    d.n === 1 ? `<span class="pill solo">${ic('person')}ひとりでOK</span>` : `<span class="pill">${ic('people')}${d.n}人〜</span>`,
    `<span class="pill">${ic('clock')}<b class="num">${d.minutes}</b>分</span>`,
    d.place === 'any' ? `<span class="pill">${ic('house')}家でもOK</span>` : d.place === 'hoop' ? `<span class="pill">${ic('hoop')}ゴール</span>` : `<span class="pill">${ic('pin')}${esc(BC.PLACES[d.place] || '')}</span>`,
    `<span class="pill lvp">${stars(d.level)}</span>`,
  ].join('');
  function drillRow(d, extra = '') {
    if (!d) return '';
    return `<a class="row-card" href="#${d.id}">${drillArt(d)}<span class="rc-body"><span class="rc-title">${esc(d.name)}${S.favs.has(d.id) ? ' <span class="fav-mark">★</span>' : ''}</span><span class="rc-meta">${pills(d)}</span>${extra}</span>${ic('next', 'rc-go')}</a>`;
  }
  function issueRow(i) {
    return `<a class="row-card issue" href="#${i.id}"><span class="thumb art-ic t-issue">${ic('bulb')}</span><span class="rc-body"><span class="rc-title">${esc(i.title)}</span><span class="rc-sub">${esc(skillName(i.skill))}</span></span>${ic('next', 'rc-go')}</a>`;
  }
  function viewCard(v) {
    return `<a class="cue-card" href="#${v.id}"><span class="cue-text">${v.cue ? '「' + esc(v.cue) + '」' : esc(v.name)}</span><span class="cue-name">${esc(v.name)}</span></a>`;
  }
  function tacticRow(t) {
    return `<a class="row-card" href="#${t.id}"><span class="thumb court-th">${t.diagram ? BC.courtThumb(t.diagram) : ic('grid')}</span><span class="rc-body"><span class="rc-title">${esc(t.name)}</span><span class="rc-meta"><span class="pill">${esc(BC.TCATS[t.cat] || '')}</span><span class="pill">${esc(t.kind || '')}</span><span class="pill lvp">${stars(t.level)}</span></span></span>${ic('next', 'rc-go')}</a>`;
  }
  const itemRow = (it) => (it.kind_ === 'drill' ? drillRow(it) : it.kind_ === 'issue' ? issueRow(it) : it.kind_ === 'tactic' ? tacticRow(it) : `<a class="row-card" href="#${it.id}"><span class="thumb art-ic t-view">${ic('eye')}</span><span class="rc-body"><span class="rc-title">${esc(it.name)}</span><span class="rc-sub">${it.cue ? '「' + esc(it.cue) + '」' : esc(skillName(it.skill))}</span></span>${ic('next', 'rc-go')}</a>`);
  const sec = (title, inner, cls = '') => (inner ? `<section class="sec ${cls}"><h2 class="sec-h">${title}</h2>${inner}</section>` : '');
  const ul = (xs, cls = '') => (xs && xs.length ? `<ul class="list ${cls}">${xs.map((x) => `<li>${md(x)}</li>`).join('')}</ul>` : '');
  const ol = (xs) => (xs && xs.length ? `<ol class="steps">${xs.map((x) => `<li><span>${md(x)}</span></li>`).join('')}</ol>` : '');
  const ngCards = (xs) => (xs && xs.length ? `<div class="ng">${xs.map(([a, b]) => `<div class="ng-row"><p class="ng-bad"><b>${ic('close')}</b>${md(a)}</p><p class="ng-fix"><b>${ic('check')}</b>${md(b)}</p></div>`).join('')}</div>` : '');
  const back = (label = 'もどる') => `<button type="button" class="back-btn" data-act="back">${ic('back')}${esc(label)}</button>`;

  /* ---------- 成長：やったことを残す ---------- */
  function addActs(list) {
    const before = sum();
    for (const a of list) S.acts.push(Object.assign({ at: Date.now() }, a));
    if (S.acts.length > 3000) S.acts = S.acts.slice(-3000);
    store.set('bc.acts', S.acts);
    const after = sum();
    const xp = after.xp - before.xp;
    const news = G.newBadges(before, after);
    const up = after.level > before.level;
    if (xp > 0) xpToast(xp, list);
    if (up || news.length) setTimeout(() => celebrate(up ? after : null, news), xp > 0 ? 900 : 0);
    refreshTop();
    return { before, after, xp, news, up };
  }
  function xpToast(xp, list) {
    const sk = [...new Set(list.map((a) => a.skill).filter(Boolean))].map(skillName).join('・');
    toast(`+${xp} XP${sk ? '（' + sk + '）' : ''}`, 'xp');
  }
  function celebrate(lv, news) {
    const html = `${lv ? `<div class="cel-lv"><span class="cel-big num">Lv.${lv.level}</span><b>レベルアップ！</b><span>${esc(lv.rank)}</span></div>` : ''}
      ${news.map((b) => `<div class="cel-badge">${badgeIcon(b, true)}<b>${esc(b.name)}</b><small>${esc(b.text)}</small></div>`).join('')}`;
    modal(`<div class="celebrate${reduceMotion() ? '' : ' pop'}">${confetti()}<h2 class="modal-h">やったね！</h2>${html}<div class="btns"><button type="button" class="btn primary big" data-act="modal-close">つづける</button></div></div>`);
  }
  const confetti = () => (reduceMotion() ? '' : `<div class="confetti" aria-hidden="true">${Array.from({ length: 18 }, (_, i) => `<i style="--i:${i};--x:${(i * 37) % 100}%"></i>`).join('')}</div>`);
  const BADGE_COLOR = { first: 'ok', menu1: 'o', streak3: 'ball', streak7: 'ball', streak30: 'gold', drill10: 'o', drill50: 'gold', uniq10: 'ok', min300: 'o', check1: 'o', good5: 'gold', shooter: 'ball', handler: 'ball', defender: 'x', allround: 'gold', early: 'gold', lv5: 'ok', lv10: 'gold' };
  const badgeIcon = (b, got) => `<span class="badge-ic c-${BADGE_COLOR[b.id] || 'ok'}${got ? '' : ' off'}">${ic(b.icon === 'list' ? 'list' : b.icon)}</span>`;

  /* ---------- 画面のわく ---------- */
  const TABS = [['home', 'ホーム', 'home'], ['practice', 'れんしゅう', 'ball'], ['check', 'チェック', 'camera'], ['log', 'きろく', 'chart'], ['more', 'もっと', 'more']];
  function shell() {
    app.innerHTML = `
      <header class="top"><div class="top-in">
        <a class="logo" href="#home">${LOGO}<span class="logo-text">バスケ・グロウ</span></a>
        <nav class="top-nav" aria-label="画面">${TABS.map(([k, l, i]) => `<a href="#${k}" data-tab="${k}">${ic(i)}${l}</a>`).join('')}</nav>
        <a class="lv-chip" href="#log" id="lv-chip"></a>
      </div></header>
      <main id="main"></main>
      <nav class="tab" aria-label="画面"><div class="tab-in">${TABS.map(([k, l, i]) => `<a href="#${k}" data-tab="${k}">${ic(i)}<span>${l}</span></a>`).join('')}</div></nav>`;
  }
  function refreshTop() {
    const c = document.getElementById('lv-chip');
    if (!c) return;
    const s = sum();
    c.innerHTML = `<span class="num">Lv.${s.level}</span>${s.streak ? `<span class="lv-fire">${ic('fire')}<span class="num">${s.streak}</span></span>` : ''}`;
    c.setAttribute('aria-label', `レベル ${s.level}・${s.streak}日れんぞく`);
  }
  function setTabMark(tab) {
    S.tab = tab;
    document.querySelectorAll('[data-tab]').forEach((a) => (a.dataset.tab === tab ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
  }
  const main = () => document.getElementById('main');
  function show(html, tab, cls = '') {
    const m = main();
    m.className = cls;
    m.innerHTML = html;
    setTabMark(tab);
    hydrate(m);
  }
  // 描いたあとに動くもの（アニメーション・作戦図・テーピングの図）
  function hydrate(root) {
    root.querySelectorAll('[data-anim]').forEach((el) => {
      if (el.dataset.done) return;
      el.dataset.done = 1;
      BC.anim(el, el.dataset.anim, { points: el.dataset.points !== '0', compact: el.dataset.compact === '1', autoplay: el.dataset.auto !== '0', at: el.dataset.at ? +el.dataset.at : undefined });
    });
    root.querySelectorAll('[data-court]').forEach((el) => { const it = get(el.dataset.court); if (it && it.diagram && !el.dataset.done) { el.dataset.done = 1; BC.court(el, it.diagram, { label: labelOf(it) }); } });
    root.querySelectorAll('[data-tape]').forEach((el) => {
      if (!BC.drawTape || el.dataset.done) return;
      el.dataset.done = 1;
      try { BC.drawTape(el, el.dataset.tape, +el.dataset.step, el.dataset.thumb ? { anim: false, labels: false } : {}); } catch (e) { el.textContent = ''; }
    });
  }

  /* ---------- はじめての人（#hello） ---------- */
  const GRADES = [['e12', '小1・2', 1], ['e34', '小3・4', 1], ['e56', '小5・6', 1], ['j1', '中1', 2], ['j2', '中2', 2], ['j3', '中3', 2], ['h', '高校', 2], ['a', 'おとな', null]];
  const GOALS = ['shoot', 'dribble', 'finish', 'pass', 'defball', 'rebound', 'foot', 'body'];
  const PLACES = [['any', '家（ゴールなし）', 'house'], ['hoop', 'ゴールがある所', 'hoop'], ['', '体育館', 'pin']];
  const NS = [[1, 'ひとり'], [3, '2〜4人'], [8, 'チーム']];
  let draft = null;
  function renderHello(edit) {
    const d = (draft = draft || Object.assign({ name: '', grade: '', goals: [], place: 'any', n: 1 }, S.me || {}));
    const seg = (key, opts, multi) => `<div class="pick">${opts.map(([v, l, i]) => {
      const on = multi ? d[key].includes(v) : String(d[key]) === String(v);
      return `<button type="button" class="pick-b" data-hello="${key}" data-v="${v}" aria-pressed="${on}">${i ? ic(i) : ''}${esc(l)}</button>`;
    }).join('')}</div>`;
    show(`<div class="hello">
      ${edit ? back() : ''}
      <div class="hello-hero" data-anim="pound" data-compact="1" data-points="0"></div>
      <h1 class="hello-h">${edit ? 'せってい' : '<span>バスケ・グロウへ</span> <span>ようこそ！</span>'}</h1>
      ${edit ? '' : '<p class="hello-sub">あなたに合った練習メニューを出したり、動画で自分の動きを チェックしたりできます。練習するたびに 経験値がたまって、レベルが上がります。</p>'}
      <label class="field"><span class="field-l">ニックネーム</span><input id="hello-name" type="text" maxlength="12" value="${esc(d.name)}" placeholder="例：けんた" autocomplete="nickname"></label>
      <div class="field"><span class="field-l">学年</span>${seg('grade', GRADES.map(([v, l]) => [v, l]))}</div>
      <div class="field"><span class="field-l">うまくなりたいこと（3つまで）</span>${seg('goals', GOALS.map((s) => [s, skillName(s)]), true)}</div>
      <div class="field"><span class="field-l">ふだん、どこで練習する？</span>${seg('place', PLACES)}</div>
      <div class="field"><span class="field-l">何人で練習する？</span>${seg('n', NS)}</div>
      <p class="small">入れたことは、この スマホ（パソコン）の中だけに のこります。どこにも送りません。</p>
      <div class="btns"><button type="button" class="btn primary big" data-act="hello-done">${edit ? 'ほぞんする' : 'はじめる！'}</button></div>
      ${edit ? settingsExtra() : ''}
    </div>`, edit ? 'more' : 'home', 'page-hello');
  }
  function settingsExtra() {
    const th = document.documentElement.dataset.theme || '';
    return `<section class="sec"><h2 class="sec-h">画面の色</h2><div class="pick">${[['', 'じどう'], ['light', 'あかるい'], ['dark', 'くらい']].map(([v, l]) => `<button type="button" class="pick-b" data-theme="${v}" aria-pressed="${th === v}">${l}</button>`).join('')}</div></section>
      <section class="sec"><h2 class="sec-h">データ</h2>
        <p class="small">きろく（経験値・バッジ・動画チェックの結果）は、この端末のブラウザの中にあります。機種を変えるときは「書き出す」で保存し、新しい端末で「読みこむ」をしてください。</p>
        <div class="btns"><button type="button" class="btn" data-act="export">${ic('save')}書き出す</button><label class="btn">${ic('copy')}読みこむ<input type="file" accept="application/json,.json" id="import-file" hidden></label></div>
        <div class="btns"><button type="button" class="btn danger" data-act="reset">${S.resetArm ? 'もう一度押すと、ぜんぶ消えます' : 'ぜんぶ消して、はじめからにする'}</button></div>
      </section>`;
  }
  function helloDone() {
    const d = draft || {};
    d.name = (document.getElementById('hello-name') || {}).value || d.name || '';
    d.name = d.name.trim().slice(0, 12);
    const g = GRADES.find((x) => x[0] === d.grade);
    d.level = g ? g[2] : null;
    d.n = +d.n || 1;
    if (!S.me) d.since = Date.now();
    S.me = Object.assign({}, S.me || {}, d);
    store.set('bc.me', S.me);
    draft = null;
    toast(S.me.since && Date.now() - S.me.since < 5000 ? 'よろしくね！' : 'ほぞんしました');
    location.hash = 'home';
  }

  /* ---------- ホーム ---------- */
  const ROLE = { warm: 'じゅんび', main: 'メイン', game: 'ゲーム', cool: 'ストレッチ' };
  const todayMenu = () => G.today(Object.assign({}, prof(), { n: prof().n || 1 }), S.menuMin, S.seed);
  function commonIssues() {
    const goals = prof().goals || [];
    const pick = [];
    for (const g of goals) for (const i of BC.lists.issue.filter((x) => x.skill === g && x.who !== 'coach').slice(0, 2)) pick.push(i.id);
    for (const id of ['i-shoot-miss', 'i-drb-stolen', 'i-def-beat', 'i-layup-miss', 'i-pass-steal', 'i-nerve', 'i-reb-lose', 'i-home']) if (!pick.includes(id)) pick.push(id);
    return items(pick).slice(0, 6);
  }
  // 今週（月〜日）の練習した日
  function weekHTML(s) {
    const now = new Date();
    const dow = (now.getDay() + 6) % 7;
    const n = [...Array(7).keys()].filter((i) => s.days.has(G.day(new Date(now.getFullYear(), now.getMonth(), now.getDate() - dow + i).getTime()))).length;
    return `<div class="week" aria-label="今週 ${n}日 練習した">${'月火水木金土日'.split('').map((w, i) => {
      const k = G.day(new Date(now.getFullYear(), now.getMonth(), now.getDate() - dow + i).getTime());
      const on = s.days.has(k);
      return `<span class="wk${on ? ' on' : ''}${i === dow ? ' today' : ''}"><i>${on ? ic('check') : ''}</i><small>${w}</small></span>`;
    }).join('')}<span class="wk-n">今週 <b class="num">${n}</b>日</span></div>`;
  }
  function renderHome() {
    const s = sum();
    const t = todayMenu();
    const today = G.day(Date.now());
    const doneToday = S.acts.some((a) => a.type === 'menu' && G.day(a.at) === today);
    const name = prof().name ? esc(prof().name) + 'さん' : '';
    const got = G.badges(s).filter((b) => b.got);
    const hour = new Date().getHours();
    const hi = hour < 10 ? 'おはよう' : hour < 18 ? 'こんにちは' : 'こんばんは';
    show(`
      <section class="hero">
        <div class="hero-top">
          <div class="hero-who"><p class="hero-hi">${hi}${name ? '、' + name : '！'}</p>
            <p class="hero-rank"><span class="lvl">Lv.<b class="num">${s.level}</b></span><span class="rank">${esc(s.rank)}</span></p></div>
          <a class="streak${s.streak ? ' on' : ''}" href="#log">${ic('fire')}<b class="num">${s.streak}</b><small>日れんぞく</small></a>
        </div>
        <div class="xpbar" role="progressbar" aria-valuemin="0" aria-valuemax="${s.prog.span}" aria-valuenow="${s.prog.cur}"><i style="width:${Math.round(s.prog.ratio * 100)}%"></i></div>
        <p class="xp-note">あと <b class="num">${s.prog.toNext}</b> XP で Lv.${s.level + 1}${s.today ? `<span>きょう <b class="num">+${s.today}</b> XP</span>` : ''}</p>
        ${weekHTML(s)}
      </section>

      <section class="card today${doneToday ? ' done' : ''}">
        <div class="today-h"><h2 class="sec-h">${ic('target')}きょうのメニュー</h2>
          <div class="seg seg-s" role="group" aria-label="時間">${[10, 15, 20, 30].map((m) => `<button type="button" data-menumin="${m}" aria-pressed="${S.menuMin === m}">${m}分</button>`).join('')}</div></div>
        ${doneToday ? `<p class="today-done">${ic('trophy')}きょうのメニュー クリア！ もう1回やっても OK。</p>` : ''}
        <p class="today-skill">${skillArt(t.skill, 'today-art', 1)}<span><b>${esc(skillName(t.skill))}</b> を中心に <b class="num">${t.min}</b>分</span></p>
        <ol class="today-list">${t.items.map((x) => { const d = get(x.id); return `<li><a class="today-item" href="#${d.id}">${drillArt(d)}<span class="ti-body"><b>${esc(d.name)}</b><small><span class="role r-${x.role}">${ROLE[x.role]}</span><span class="num">${x.min}</span>分</small></span>${ic('next', 'rc-go')}</a></li>`; }).join('')}</ol>
        ${t.note ? `<p class="small">${esc(t.note)}</p>` : ''}
        <div class="btns"><button type="button" class="btn primary big" data-act="menu-start">${ic('play')}スタート</button><button type="button" class="btn" data-act="menu-shuffle">${ic('shuffle')}ほかのメニュー</button></div>
      </section>

      <section class="card ask">
        <h2 class="sec-h">${ic('chat')}なやみを書いてね</h2>
        <form class="ask-form" data-form="ask" autocomplete="off"><input name="q" type="search" placeholder="例：シュートが入らない" aria-label="なやみ" enterkeyhint="search"><button type="submit" class="btn primary">${ic('search')}<span class="sr">さがす</span></button></form>
        <div class="issue-tiles">${commonIssues().map((i) => `<a class="issue-tile" href="#${i.id}">${esc(i.title)}</a>`).join('')}</div>
      </section>

      <section class="duo">
        <a class="card cta cta-check" href="#check">${ic('camera')}<b>動画でチェック</b><small>シュート・ドリブルなどを AI で見る</small></a>
        <a class="card cta cta-aid" href="#aid">${ic('aid')}<b>ケガをしたら</b><small>手当てのしかた・テーピング</small></a>
      </section>

      ${got.length ? `<section class="sec"><h2 class="sec-h">${ic('medal')}とったバッジ <a class="sec-more" href="#log">ぜんぶ見る</a></h2><div class="badge-row">${got.slice(-6).reverse().map((b) => `<span class="badge-mini">${badgeIcon(b, true)}<small>${esc(b.name)}</small></span>`).join('')}</div></section>` : ''}
    `, 'home', 'page-home');
  }

  /* ---------- れんしゅう ---------- */
  const GROUP_NAME = { solo: 'じぶんの わざ', team: 'チームの うごき', base: 'あたま・からだ・こころ' };
  function renderPractice() {
    const s = sum();
    const goals = prof().goals || [];
    const tile = (sk) => {
      const xp = s.skills[sk.id] || 0;
      return `<a class="skill-tile${goals.includes(sk.id) ? ' goal' : ''}" href="#s/${sk.id}">${skillArt(sk.id)}<span class="st-name">${esc(sk.name)}</span>${stars(G.stars(xp), 5)}</a>`;
    };
    const groups = Object.keys(GROUP_NAME).map((g) => {
      const list = BC.skills.filter((x) => x.group === g && (g !== 'base' || x.id !== 'coach' || prof().grade === 'a'));
      return `<section class="sec"><h2 class="sec-h">${GROUP_NAME[g]}</h2><div class="skill-grid">${list.map(tile).join('')}</div></section>`;
    }).join('');
    show(`<h1 class="page-h">れんしゅう</h1>
      <form class="ask-form" data-form="ask" autocomplete="off"><input name="q" type="search" placeholder="なにを れんしゅうする？" aria-label="さがす" enterkeyhint="search"><button type="submit" class="btn primary">${ic('search')}<span class="sr">さがす</span></button></form>
      <section class="duo">
        <a class="card cta" href="#plan">${ic('plan')}<b>プランをつくる</b><small>時間とテーマから。タイマーつき</small></a>
        <a class="card cta" href="#lib">${ic('book')}<b>ずかん</b><small>なやみ・ポイント・メニュー・戦術</small></a>
      </section>
      ${groups}`, 'practice', 'page-practice');
  }

  /* ---------- 技能のページ（#s/<id>） ---------- */
  const CHECK_OF = { shoot: 'shoot', dribble: 'dribble', defball: 'defense', body: 'landing', foot: 'landing' };
  function renderSkill(sid) {
    const sk = BC.skillMap[sid];
    if (!sk) return renderPractice();
    const s = sum();
    const xp = s.skills[sid] || 0;
    const st = G.stars(xp), nx = G.starNext(xp);
    const views = BC.lists.view.filter((v) => v.skill === sid);
    const iss = BC.lists.issue.filter((i) => i.skill === sid && (i.who !== 'coach' || prof().grade === 'a'));
    const all = BC.lists.drill.filter((d) => (d.skills || []).includes(sid)).sort((a, b) => ((a.skills[0] === sid ? 0 : 1) - (b.skills[0] === sid ? 0 : 1)) || a.level - b.level);
    const f = S.dfilter || (prof().n === 1 ? 'solo' : 'all');
    const c = cond();
    const shown = all.filter((d) => (f === 'solo' ? d.n === 1 : f === 'home' ? d.place === 'any' : true)).filter((d) => !c.level || d.level <= c.level + 1);
    const tactics = BC.lists.tactic.filter((t) => (t.skills || []).includes(sid));
    const art = SKILL_ART[sid];
    show(`${back()}
      <section class="skill-hero">
        ${art && BC.motions[art[0]] ? `<div class="sh-anim" data-anim="${art[0]}" data-compact="1" data-points="0" data-at="${art[1]}"></div>` : `<div class="sh-anim sh-ic">${ic(SKILL_ICON[sid] || 'ball')}</div>`}
        <div class="sh-text"><h1 class="page-h">${esc(sk.name)}</h1>${stars(st, 5)}<p class="small">経験値 <b class="num">${xp}</b>${nx != null ? `・あと <b class="num">${nx}</b> で ★${st + 1}` : '・★ ぜんぶ！'}</p></div>
      </section>
      ${CHECK_OF[sid] ? `<a class="card cta cta-check wide" href="#check/${CHECK_OF[sid]}">${ic('camera')}<b>動画でチェック</b><small>${esc(sk.name)}の動きを AI で見て、◎○△ で教えます</small></a>` : ''}
      ${sec(`${ic('eye')}ここがポイント`, views.length ? `<div class="cue-grid">${views.slice(0, 6).map(viewCard).join('')}</div>` : '')}
      ${sec(`${ic('bulb')}なやみから えらぶ`, iss.length ? `<div class="rows">${iss.map(issueRow).join('')}</div>` : '')}
      <section class="sec"><h2 class="sec-h">${ic('list')}れんしゅうメニュー</h2>
        <div class="seg" role="group" aria-label="しぼりこみ">${[['solo', 'ひとりでできる'], ['home', '家でできる'], ['all', 'ぜんぶ']].map(([v, l]) => `<button type="button" data-dfilter="${v}" aria-pressed="${f === v}">${l}</button>`).join('')}</div>
        <div class="rows">${shown.map((d) => drillRow(d)).join('') || '<p class="empty">この しぼりこみでは、メニューがありません。「ぜんぶ」を見てね。</p>'}</div>
      </section>
      ${sec(`${ic('grid')}戦術（チームの作戦）`, tactics.length ? `<div class="rows">${tactics.map(tacticRow).join('')}</div>` : '')}
    `, 'practice', 'page-skill');
  }

  /* ---------- 項目のページ ---------- */
  function favBtn(id) { return `<button type="button" class="icon-btn fav" data-act="fav" data-id="${id}" aria-pressed="${S.favs.has(id)}" aria-label="お気に入り">${ic('star')}</button>`; }
  function backIssues(it) {
    const iss = BC.backlinks(it.id).filter((x) => x.kind_ === 'issue' && (x.who !== 'coach' || prof().grade === 'a'));
    return iss.length ? `<div class="rows">${iss.slice(0, 6).map(issueRow).join('')}</div>` : '';
  }
  function renderDrill(d) {
    const mid = BC.motionFor(d.id);
    const doneN = S.acts.filter((a) => a.type === 'drill' && a.id === d.id).length;
    const pts = d.points || [];
    show(`<div class="page-bar">${back()}${favBtn(d.id)}</div>
      <p class="eyebrow">${ic('list')}れんしゅうメニュー・${esc(skillName((d.skills || [])[0]))}</p>
      <h1 class="page-h">${esc(d.name)}</h1>
      <div class="pills">${pills(d)}<span class="pill">きつさ ${'●'.repeat(d.intensity || 1)}<span class="dim">${'●'.repeat(3 - (d.intensity || 1))}</span></span></div>
      ${mid ? `<div class="anim-box" data-anim="${mid}"></div>` : ''}
      <p class="aim">${md(d.aim)}</p>
      ${sec(`${ic('list')}やりかた`, ol(d.steps))}
      ${sec(`${ic('star')}ここがポイント`, ul(pts.slice(0, 3), 'pts') + (pts.length > 3 ? `<details class="more"><summary>ほかのポイント（${pts.length - 3}）</summary>${ul(pts.slice(3), 'pts')}</details>` : ''))}
      ${sec(`${ic('warn')}よくある しっぱい`, ngCards(d.ng))}
      ${(d.easier || []).length || (d.harder || []).length ? `<div class="duo">${(d.easier || []).length ? `<div class="box easy"><h3>${ic('down')}かんたんにする</h3>${ul(d.easier)}</div>` : ''}${(d.harder || []).length ? `<div class="box hard"><h3>${ic('up')}むずかしくする</h3>${ul(d.harder)}</div>` : ''}</div>` : ''}
      <div class="do-bar"><button type="button" class="btn big" data-act="drill-timer" data-id="${d.id}">${ic('timer')}<span class="btn-2l">タイマー<small>${d.minutes}分</small></span></button><button type="button" class="btn primary big" data-act="drill-done" data-id="${d.id}">${ic('check')}やった！</button></div>
      ${doneN ? `<p class="small center">これまでに <b class="num">${doneN}</b> 回やりました</p>` : ''}
      <details class="adult"><summary>${ic('whistle')}くわしく（準備・コーチ向け）</summary>
        ${d.setup ? sec('準備・ならび方', `<p>${md(d.setup)}</p>`) : ''}
        ${(d.equip || []).length ? sec('つかう物', `<p>${esc(d.equip.join('、'))}</p>`) : ''}
        ${d.diagram ? `<div data-court="${d.id}"></div>` : ''}
        ${sec('見るポイント', items(d.views).length ? `<div class="cue-grid">${items(d.views).map(viewCard).join('')}</div>` : '')}
        ${sec('関係する戦術', items(d.tactics).length ? `<div class="rows">${items(d.tactics).map(tacticRow).join('')}</div>` : '')}
      </details>
      ${sec(`${ic('bulb')}このメニューが役に立つ なやみ`, backIssues(d))}
    `, 'practice', 'page-item');
  }
  function renderView(v) {
    const mid = BC.motionFor(v.id);
    const chk = (S.vchk[v.id] || {}).on || [];
    show(`<div class="page-bar">${back()}${favBtn(v.id)}</div>
      <p class="eyebrow">${ic('eye')}見るポイント・${esc(skillName(v.skill))}</p>
      <h1 class="page-h">${esc(v.name)}</h1>
      ${v.cue ? `<p class="cue-big">「${esc(v.cue)}」</p>` : ''}
      ${mid ? `<div class="anim-box" data-anim="${mid}"></div>` : ''}
      <p class="aim">${md(v.summary)}</p>
      <section class="sec"><h2 class="sec-h">${ic('check')}じぶんで チェック</h2><p class="small">できていたら、タップして ✓ をつけよう。</p>
        <div class="checklist">${(v.checks || []).map((c, i) => `<button type="button" class="chk" data-vchk="${v.id}" data-i="${i}" aria-pressed="${chk.includes(i)}"><span class="chk-box">${ic('check')}</span><span>${md(c)}</span></button>`).join('')}</div></section>
      ${v.good ? `<div class="box easy"><h3>${ic('star')}うまくいっているとき</h3><p>${md(v.good)}</p></div>` : ''}
      ${sec(`${ic('warn')}よくある くずれと 直し方`, ngCards(v.ng))}
      ${sec(`${ic('list')}直すための れんしゅう`, items(v.drills).length ? `<div class="rows">${items(v.drills).map((d) => drillRow(d)).join('')}</div>` : '')}
      ${sec(`${ic('bulb')}このポイントが役に立つ なやみ`, backIssues(v))}
    `, 'practice', 'page-item');
  }
  function renderIssue(it) {
    const c = cond();
    const { ok, rest } = BC.drillsFor(it, c);
    const first = ok[0] || rest[0];
    const others = ok.slice(1, 6);
    const more = ok.slice(6).concat(rest.filter((d) => d !== first));
    const views = items(it.views);
    const causes = (it.causes || []).map((x) => `<li><p class="c-text">${md(x.text)}</p>${x.check ? `<p class="c-check">${ic('search')}${md(x.check)}</p>` : ''}</li>`).join('');
    show(`<div class="page-bar">${back()}</div>
      <p class="eyebrow">${ic('bulb')}なやみ・${esc(skillName(it.skill))}</p>
      <h1 class="page-h">${esc(it.title)}</h1>
      ${it.empathy ? `<p class="empathy">${md(it.empathy)}</p>` : ''}
      <p class="aim">${md(it.summary)}</p>
      ${it.ask ? `<section class="sec ask-box"><h2 class="sec-h">${md(it.ask.q)}</h2><div class="pick">${it.ask.options.filter((o) => get(o.to)).map((o) => `<a class="pick-b" href="#${o.to}">${esc(o.label)}</a>`).join('')}</div></section>` : ''}
      ${first ? `<section class="sec first"><h2 class="sec-h">${ic('flag')}まずは これをやってみよう</h2>${drillRow(first)}</section>` : ''}
      ${sec(`${ic('eye')}見るポイント`, views.length ? `<div class="cue-grid">${views.slice(0, 6).map(viewCard).join('')}</div>` : '')}
      ${sec(`${ic('search')}こんな 原因かも`, causes ? `<ul class="causes">${causes}</ul>` : '')}
      ${sec(`${ic('list')}ほかの れんしゅうメニュー`, others.length ? `<div class="rows">${others.map((d) => drillRow(d)).join('')}</div>` + (more.length ? `<details class="more"><summary>もっと見る（${more.length}）</summary><div class="rows">${more.map((d) => drillRow(d)).join('')}</div></details>` : '') : '')}
      ${it.tip ? `<p class="tip">${ic('bulb')}<span>${md(it.tip)}</span></p>` : ''}
      ${items(it.tactics).length ? sec(`${ic('grid')}関係する戦術`, `<div class="rows">${items(it.tactics).map(tacticRow).join('')}</div>`) : ''}
      ${sec(`${ic('next')}つぎに見るとよい なやみ`, items(it.next).length ? `<div class="rows">${items(it.next).map(issueRow).join('')}</div>` : '')}
      <div class="btns"><button type="button" class="btn" data-act="plan-issue" data-id="${it.id}">${ic('plan')}このなやみで 練習プランをつくる</button></div>
    `, 'practice', 'page-item');
  }
  function renderTactic(t) {
    show(`<div class="page-bar">${back()}${favBtn(t.id)}</div>
      <p class="eyebrow">${ic('grid')}戦術・${esc(BC.TCATS[t.cat] || '')}・${esc(t.kind || '')}</p>
      <h1 class="page-h">${esc(t.name)}</h1>
      <div class="pills"><span class="pill lvp">${stars(t.level)}</span>${(t.alias || []).length ? `<span class="pill alias">別名：${esc(t.alias.slice(0, 3).join('、'))}</span>` : ''}</div>
      <p class="aim">${md(t.summary)}</p>
      ${t.diagram ? `<div data-court="${t.id}"></div>` : ''}
      ${sec('動き方', ol(t.how))}
      ${sec('うまくいくポイント', ul(t.points, 'pts'))}
      ${(t.good || []).length || (t.weak || []).length ? `<div class="duo">${(t.good || []).length ? `<div class="box easy"><h3>強み</h3>${ul(t.good)}</div>` : ''}${(t.weak || []).length ? `<div class="box hard"><h3>弱み・気をつけること</h3>${ul(t.weak)}</div>` : ''}</div>` : ''}
      ${sec(t.cat === 'defense' ? 'この守りをされたら（攻め方）' : '相手にされたら・対策', ul(t.counter))}
      ${t.note ? `<p class="note">${md(t.note)}</p>` : ''}
      ${sec('れんしゅうメニュー', items(t.drills).length ? `<div class="rows">${items(t.drills).map((d) => drillRow(d)).join('')}</div>` : '')}
      ${sec('見るポイント', items(t.views).length ? `<div class="cue-grid">${items(t.views).map(viewCard).join('')}</div>` : '')}
      ${sec('関係する戦術', items(t.related).length ? `<div class="rows">${items(t.related).map(tacticRow).join('')}</div>` : '')}
    `, 'practice', 'page-item');
  }

  /* ---------- ケガ・テーピング ---------- */
  function phoneList() {
    const ph = (BC.aidCommon && BC.aidCommon.phones) || [{ num: '119', name: '救急車', text: '命にかかわるとき' }];
    return `<div class="phones">${ph.map((p) => `<a class="phone" href="tel:${encodeURIComponent(String(p.num).replace(/[^0-9#]/g, ''))}"><b class="num">${esc(p.num)}</b><span><b>${esc(p.name)}</b><small>${esc(p.text)}</small></span></a>`).join('')}</div>`;
  }
  function renderAidHome() {
    if (!BC.aids) return show(`${back()}<h1 class="page-h">ケガをしたら</h1><p>じゅんび中です。</p>`, 'more');
    const urgent = BC.aids.filter((a) => a.urgent), rest = BC.aids.filter((a) => !a.urgent);
    const aidRow = (a) => `<a class="row-card aid${a.urgent ? ' urgent' : ''}" href="#aid/${a.id}"><span class="thumb art-ic t-aid">${ic(a.urgent ? 'warn' : 'aid')}</span><span class="rc-body"><span class="rc-title">${esc(a.name)}</span>${a.urgent ? '<span class="rc-sub urgent-t">すぐ大人をよぶ・119 も考える</span>' : ''}</span>${ic('next', 'rc-go')}</a>`;
    show(`${back()}
      <h1 class="page-h">${ic('aid')}ケガをしたら</h1>
      <section class="card emergency"><h2 class="sec-h">${ic('phone')}こまったら 電話</h2>${phoneList()}
        ${(BC.aidCommon && BC.aidCommon.rules || []).length ? `<ul class="list">${BC.aidCommon.rules.map((r) => `<li>${md(r)}</li>`).join('')}</ul>` : ''}</section>
      <form class="ask-form" data-form="aid" autocomplete="off"><input name="q" type="search" placeholder="どこが どうした？（例：足首をひねった）" aria-label="ケガをさがす" enterkeyhint="search"><button type="submit" class="btn primary">${ic('search')}<span class="sr">さがす</span></button></form>
      <div id="aid-res"></div>
      ${sec(`${ic('warn')}すぐに大人をよぶケガ`, urgent.length ? `<div class="rows">${urgent.map(aidRow).join('')}</div>` : '')}
      ${sec(`${ic('aid')}よくあるケガ`, `<div class="rows">${rest.map(aidRow).join('')}</div>`)}
      ${sec(`${ic('tape')}テーピング（図つき）`, (BC.tapes || []).length ? `<div class="rows">${BC.tapes.map((tp) => `<a class="row-card" href="#tape/${tp.id}"><span class="thumb tape-th" data-tape="${tp.id}" data-step="${(tp.steps || []).length}" data-thumb="1"></span><span class="rc-body"><span class="rc-title">${esc(tp.name)}</span><span class="rc-sub">${esc(plain(tp.purpose || '')).slice(0, 40)}</span></span>${ic('next', 'rc-go')}</a>`).join('')}</div>` : '')}
      <p class="small">このページは、手当ての基本を知るためのものです。いたみが強いとき・心配なときは、かならず大人に伝えて、病院で見てもらってください。</p>
    `, 'more', 'page-aid');
  }
  function renderAid(a) {
    const tapes = (a.taping || []).map((id) => BC.tapeById && BC.tapeById[id]).filter(Boolean);
    show(`<div class="page-bar">${back()}</div>
      <p class="eyebrow">${ic('aid')}ケガの手当て</p>
      <h1 class="page-h">${esc(a.name)}</h1>
      ${(a.call || []).length ? `<section class="card emergency"><h2 class="sec-h">${ic('phone')}こんなときは すぐ 119（救急車）</h2>${ul(a.call)}${phoneList()}</section>` : ''}
      ${sec(`${ic('list')}その場で やること`, ol(a.steps), 'aid-steps')}
      ${sec(`${ic('close')}やってはいけないこと`, ul(a.dont, 'dont'))}
      ${(a.doctor || []).length ? `<section class="sec box hard"><h3>${ic('aid')}その日のうちに 病院へ行くサイン</h3>${ul(a.doctor)}</section>` : ''}
      ${a.back ? sec(`${ic('ball')}練習に もどるまで`, Array.isArray(a.back) ? ul(a.back) : `<p>${md(a.back)}</p>`) : ''}
      ${tapes.length ? sec(`${ic('tape')}テーピング`, `<div class="rows">${tapes.map((tp) => `<a class="row-card" href="#tape/${tp.id}"><span class="thumb tape-th" data-tape="${tp.id}" data-step="${(tp.steps || []).length}" data-thumb="1"></span><span class="rc-body"><span class="rc-title">${esc(tp.name)}</span></span>${ic('next', 'rc-go')}</a>`).join('')}</div>`) : ''}
      ${a.note ? `<p class="note">${md(a.note)}</p>` : ''}
      <p class="small">いたみや はれが強いとき・心配なときは、かならず大人に伝えて、病院で見てもらってください。</p>
    `, 'more', 'page-aid');
  }
  let tapeStep = 0;
  function renderTape(tp) {
    const steps = tp.steps || [];
    tapeStep = Math.max(0, Math.min(steps.length - 1, tapeStep));
    const st = steps[tapeStep] || {};
    const aids = BC.aidsForTape ? BC.aidsForTape(tp.id) : [];
    show(`<div class="page-bar">${back()}</div>
      <p class="eyebrow">${ic('tape')}テーピング</p>
      <h1 class="page-h">${esc(tp.name)}</h1>
      <p class="aim">${md(tp.purpose || '')}</p>
      ${tp.who ? `<p class="note">${md(tp.who)}</p>` : ''}
      ${sec('用意するもの', ul(tp.materials))}
      ${sec('巻く前に', ul(tp.before))}
      <section class="sec tape-steps"><h2 class="sec-h">${ic('list')}巻きかた <span class="num step-n">${tapeStep + 1} / ${steps.length}</span></h2>
        <div class="tape-fig" data-tape="${tp.id}" data-step="${tapeStep}"></div>
        <p class="tape-name"><b class="num">${tapeStep + 1}</b>${esc(st.name || '')}</p>
        <p class="tape-text">${md(st.text || '')}</p>
        <div class="btns tape-nav"><button type="button" class="btn" data-tapestep="${tapeStep - 1}" ${tapeStep <= 0 ? 'disabled' : ''}>${ic('back')}まえ</button><button type="button" class="btn primary" data-tapestep="${tapeStep + 1}" ${tapeStep >= steps.length - 1 ? 'disabled' : ''}>つぎ${ic('next')}</button></div>
        <div class="tape-dots">${steps.map((x, i) => `<button type="button" data-tapestep="${i}" aria-label="${i + 1}" aria-current="${i === tapeStep}"></button>`).join('')}</div>
      </section>
      ${sec(`${ic('check')}巻いたあとに たしかめる`, ul(tp.after))}
      ${sec(`${ic('warn')}気をつけること`, ul(tp.cautions))}
      ${aids.length ? sec('このテーピングを使うケガ', `<div class="rows">${aids.map((a) => `<a class="row-card" href="#aid/${a.id}"><span class="thumb art-ic t-aid">${ic('aid')}</span><span class="rc-body"><span class="rc-title">${esc(a.name)}</span></span>${ic('next', 'rc-go')}</a>`).join('')}</div>`) : ''}
    `, 'more', 'page-aid');
  }

  /* ---------- きろく ---------- */
  function calendarHTML(s) {
    const now = new Date();
    const base = new Date(now.getFullYear(), now.getMonth() + S.calMonth, 1);
    const y = base.getFullYear(), m = base.getMonth();
    const first = new Date(y, m, 1).getDay();
    const days = new Date(y, m + 1, 0).getDate();
    const xpDay = {};
    for (const a of S.acts) { const k = G.day(a.at); xpDay[k] = (xpDay[k] || 0) + (a.xp || 0); }
    const todayK = G.day(Date.now());
    let cells = '';
    for (let i = 0; i < first; i++) cells += '<span class="cal-c empty"></span>';
    for (let d = 1; d <= days; d++) {
      const k = G.day(new Date(y, m, d).getTime());
      const on = s.days.has(k);
      const lvl = on ? Math.min(3, 1 + Math.floor((xpDay[k] || 0) / 40)) : 0;
      cells += `<span class="cal-c${on ? ' on l' + lvl : ''}${k === todayK ? ' today' : ''}" title="${m + 1}/${d}${on ? '・' + (xpDay[k] || 0) + ' XP' : ''}"><span class="num">${d}</span></span>`;
    }
    return `<div class="cal"><div class="cal-h"><button type="button" class="icon-btn" data-cal="-1" aria-label="前の月">${ic('back')}</button><b>${y}年 ${m + 1}月</b><button type="button" class="icon-btn" data-cal="1" aria-label="次の月" ${S.calMonth >= 0 ? 'disabled' : ''}>${ic('next')}</button></div>
      <div class="cal-w">${'日月火水木金土'.split('').map((w) => `<span>${w}</span>`).join('')}</div><div class="cal-g">${cells}</div></div>`;
  }
  function renderLog() {
    const s = sum();
    const bs = G.badges(s);
    const goals = prof().goals || [];
    const sk = BC.skills.filter((x) => (s.skills[x.id] || 0) > 0 || goals.includes(x.id)).sort((a, b) => (s.skills[b.id] || 0) - (s.skills[a.id] || 0));
    const cs = checks();
    const recent = S.acts.filter((a) => a.type === 'drill').slice(-40).reverse();
    const byDay = {};
    for (const a of recent) (byDay[G.day(a.at)] = byDay[G.day(a.at)] || []).push(a);
    show(`<h1 class="page-h">きろく</h1>
      <section class="card lvcard">
        <div class="lv-big"><span class="num">Lv.${s.level}</span><b>${esc(s.rank)}</b></div>
        <div class="xpbar"><i style="width:${Math.round(s.prog.ratio * 100)}%"></i></div>
        <p class="xp-note">経験値 <b class="num">${s.xp}</b> XP・あと <b class="num">${s.prog.toNext}</b> で Lv.${s.level + 1}</p>
      </section>
      <section class="stats">
        <div><b class="num">${s.days.size}</b><small>練習した日</small></div>
        <div><b class="num">${s.minutes}</b><small>練習した分</small></div>
        <div><b class="num">${s.drills}</b><small>やったメニュー</small></div>
        <div><b class="num">${s.best}</b><small>いちばん長い れんぞく</small></div>
      </section>
      ${sec(`${ic('fire')}練習した日`, calendarHTML(s))}
      ${sec(`${ic('star')}わざのレベル`, sk.length ? `<div class="skill-bars">${sk.map((x) => { const xp = s.skills[x.id] || 0; const st = G.stars(xp); const nx = G.starNext(xp); return `<a class="sbar" href="#s/${x.id}"><span class="sbar-n">${esc(x.name)}</span>${stars(st, 5)}<span class="sbar-x num">${xp} XP</span><span class="sbar-b"><i style="width:${nx == null ? 100 : Math.round((100 * (xp - [0, 30, 80, 160, 300][st])) / ([30, 80, 160, 300, 500][st] - [0, 30, 80, 160, 300][st]))}%"></i></span></a>`; }).join('')}</div>` : '<p class="empty">練習メニューの「やった！」を押すと、ここに たまっていきます。</p>')}
      ${sec(`${ic('medal')}バッジ <small class="num">${bs.filter((b) => b.got).length} / ${bs.length}</small>`, `<div class="badges">${bs.map((b) => `<div class="badge${b.got ? ' got' : ''}">${badgeIcon(b, b.got)}<b>${esc(b.name)}</b><small>${esc(b.text)}</small></div>`).join('')}</div>`)}
      ${sec(`${ic('camera')}動画チェックの きろく`, cs.length && BC.check && BC.check.summaryHTML ? `<div class="rows">${cs.slice(0, 10).map((r) => BC.check.summaryHTML(r)).join('')}</div>` : '<p class="empty">「チェック」で動画を調べると、ここに のこります。</p>')}
      ${sec(`${ic('list')}さいきんの練習`, recent.length ? Object.entries(byDay).map(([k, list]) => `<div class="day-log"><h3 class="day-h">${k.slice(5).replace('-', '/')}</h3>${list.map((a) => { const d = get(a.id); return d ? `<a class="log-row" href="#${d.id}"><span class="face-s">${FACE[a.rate || 2]}</span><span class="lr-name">${esc(d.name)}</span><span class="lr-meta num">${a.min || ''}分・+${a.xp}</span></a>${a.note ? `<p class="lr-note">${esc(a.note)}</p>` : ''}` : ''; }).join('')}</div>`).join('') : '<p class="empty">まだ ありません。ホームの「きょうのメニュー」から はじめてみよう。</p>')}
    `, 'log', 'page-log');
  }

  /* ---------- もっと ---------- */
  function renderMore() {
    const row = (href, icon, title, sub) => `<a class="row-card more-row" href="${href}"><span class="thumb art-ic">${ic(icon)}</span><span class="rc-body"><span class="rc-title">${title}</span><span class="rc-sub">${sub}</span></span>${ic('next', 'rc-go')}</a>`;
    show(`<h1 class="page-h">もっと</h1>
      <div class="rows">
        ${row('#chat', 'chat', 'コーチに そうだん', 'なやみを書くと、原因・見るポイント・練習メニューを答えます')}
        ${row('#plan', 'plan', '練習プランを つくる', '時間・人数・テーマから組んで、タイマーで進める')}
        ${row('#lib', 'book', 'ずかん', 'なやみ・見るポイント・練習メニュー・戦術をさがす')}
        ${row('#aid', 'aid', 'ケガ・テーピング', '手当てのしかた・テーピングの巻きかた（図つき）')}
        ${row('#settings', 'sliders', 'せってい', 'ニックネーム・学年・目標・練習する場所・画面の色・データ')}
        ${row('#about', 'whistle', 'おとなの方へ', 'このアプリの使い方・データの保存について')}
      </div>`, 'more', 'page-more');
  }
  function renderAbout() {
    const L = BC.lists;
    show(`${back()}<h1 class="page-h">おとなの方へ</h1>
      <div class="prose">
        <p>バスケ・グロウは、小学生・中学生が自分で使って上達していくための練習アプリです。指導者・保護者の方も使えます。</p>
        <ul class="list">
          <li><b>れんしゅう</b>：技能ごとに、見るポイント（${L.view.length}）・なやみ（${L.issue.length}）・練習メニュー（${L.drill.length}）・戦術（${L.tactic.length}）をまとめています。多くのメニューに、体のある人のアニメーション（よい形と、よくない形のくらべ）があります。</li>
          <li><b>きょうのメニュー</b>：目標と練習する場所・人数から、10〜30分のメニューを毎日自動で組みます。タイマーで進め、終わったら「できた・まあまあ・むずかしかった」を記録します。</li>
          <li><b>チェック</b>：スマホでとった動画から、AI（MediaPipe）が体の点を読み、ひざ・ひじの角度や腰の高さ・タイミングを ◎○△ で示します。チームの動き（広がり・ペイントの人数など）も調べられます。<b>動画は端末の中だけで処理し、どこにも送りません。</b>AI の部品（約10MB）だけ、はじめにインターネットから読みこみます。</li>
          <li><b>きろく</b>：経験値・レベル・つづけた日数・バッジで、がんばりが目に見えるようにしています。点数や順位で他の人とくらべる機能はありません。</li>
          <li><b>ケガ・テーピング</b>：手当ての基本と、テーピングの巻きかたを図で示します。診断や治療の代わりにはなりません。</li>
        </ul>
        <p>記録や設定は、このブラウザの中（localStorage）だけに保存されます。アカウントはなく、外へ送る通信はありません（AI の部品とフォントの読みこみを除く）。</p>
      </div>`, 'more', 'page-more');
  }

  /* ---------- ずかん（#lib） ---------- */
  function libResults() {
    const q = S.lib.q.trim();
    if (q) {
      const n = BC.norm(q);
      const hits = BC.search(q).map((h) => h.item);
      const extra = BC.all().filter((it) => !hits.includes(it) && BC.norm([labelOf(it), ...(it.alias || []), ...(it.words || []), it.summary || '', it.aim || '', it.cue || ''].join(' ')).includes(n));
      return hits.concat(extra);
    }
    if (S.lib.kind === 'fav') return BC.all().filter((it) => S.favs.has(it.id));
    return BC.lists[S.lib.kind].filter((it) => !S.lib.skill || (it.skills || [it.skill]).includes(S.lib.skill)).filter((it) => it.kind_ !== 'issue' || it.who !== 'coach' || prof().grade === 'a');
  }
  function libListHTML() {
    const list = libResults();
    if (!list.length) return `<p class="empty">${S.lib.kind === 'fav' && !S.lib.q ? 'まだ ありません。メニューやポイントの ★ を押すと、ここに入ります。' : '見つかりませんでした。ことばを かえてみてね。'}</p>`;
    return `<p class="small">${list.length} 件</p><div class="rows">${list.slice(0, 80).map(itemRow).join('')}</div>`;
  }
  function renderLib() {
    const kinds = [['issue', 'なやみ'], ['view', '見るポイント'], ['drill', '練習メニュー'], ['tactic', '戦術'], ['fav', '★ お気に入り']];
    show(`${back()}<h1 class="page-h">ずかん</h1>
      <div class="search-box">${ic('search')}<input id="lib-q" type="search" placeholder="ことばで さがす（例：ピボット、ゾーン）" value="${esc(S.lib.q)}" autocomplete="off"></div>
      <div class="seg wrap" role="group">${kinds.map(([k, l]) => `<button type="button" data-libkind="${k}" aria-pressed="${S.lib.kind === k && !S.lib.q}">${l}</button>`).join('')}</div>
      ${S.lib.kind !== 'fav' ? `<div class="chips">${[['', 'ぜんぶ'], ...BC.skills.map((x) => [x.id, x.name])].map(([v, l]) => `<button type="button" class="chip" data-libskill="${v}" aria-pressed="${S.lib.skill === v}">${esc(l)}</button>`).join('')}</div>` : ''}
      <div id="lib-list">${libListHTML()}</div>`, 'more', 'page-lib');
  }

  /* ---------- コーチにそうだん（#chat） ---------- */
  function serialize(ans) {
    const c = {};
    if (ans.ctx) for (const k of ['n', 'level', 'who']) if (ans.ctx[k]) c[k] = ans.ctx[k];
    switch (ans.type) {
      case 'issue': return { type: 'issue', id: ans.issue.id, alts: (ans.alts || []).map((x) => x.id), weak: !!ans.weak, ctx: c };
      case 'item': return { type: 'item', id: ans.item.id, alts: (ans.alts || []).map((x) => x.id), related: (ans.related || []).map((x) => x.id), ctx: c };
      case 'skill': return { type: 'skill', skill: ans.skill.id, ctx: c };
      case 'plan': return { type: 'plan', minutes: ans.plan.minutes, focus: ans.plan.focus, skills: ans.plan.skills, ctx: c };
      default: return { type: 'none', ctx: c };
    }
  }
  const EXAMPLES = ['シュートが入らない', 'ドリブル中にボールを取られる', 'ディフェンスで抜かれる', 'リバウンドが取れない', '家でできる練習', '試合で緊張する'];
  function botHTML(b) {
    if (b.type === 'hello') return `<p>こんにちは！ バスケのなやみ・うまくなりたいことを、書いてね。原因と、見るポイントと、練習メニューを いっしょに考えます。</p><div class="chips">${EXAMPLES.map((t) => `<button type="button" class="chip" data-say="${esc(t)}">${esc(t)}</button>`).join('')}</div>`;
    if (b.type === 'issue') {
      const it = get(b.id);
      if (!it) return noneBot();
      const { ok, rest } = BC.drillsFor(it, Object.assign({}, cond(), b.ctx || {}));
      const ds = ok.concat(rest).slice(0, 3);
      return `${b.weak ? '<p class="small">もしかして、これのことかな？</p>' : ''}<p class="bot-title">${esc(it.title)}</p>${it.empathy ? `<p>${md(it.empathy)}</p>` : ''}<p>${md(it.summary)}</p>
        ${it.ask ? `<p><b>${md(it.ask.q)}</b></p><div class="chips">${it.ask.options.filter((o) => get(o.to)).map((o) => `<button type="button" class="chip" data-ask="${o.to}" data-label="${esc(o.label)}">${esc(o.label)}</button>`).join('')}</div>` : ''}
        ${items(it.views).length ? `<p class="bot-sub">${ic('eye')}見るポイント</p><div class="cue-grid">${items(it.views).slice(0, 4).map(viewCard).join('')}</div>` : ''}
        ${ds.length ? `<p class="bot-sub">${ic('list')}おすすめの練習</p><div class="rows">${ds.map((d) => drillRow(d)).join('')}</div>` : ''}
        <div class="chips"><a class="chip chip-go" href="#${it.id}">くわしく見る</a>${items(b.alts).map((a) => `<button type="button" class="chip" data-ask="${a.id}">もしかして：${esc(labelOf(a))}</button>`).join('')}</div>`;
    }
    if (b.type === 'item') {
      const it = get(b.id);
      if (!it) return noneBot();
      return `<p class="bot-title">${esc(labelOf(it))}</p><p>${md(it.summary || it.aim || '')}</p>${itemRow(it)}${items(b.related).length ? `<p class="bot-sub">これが役に立つ なやみ</p><div class="rows">${items(b.related).map(issueRow).join('')}</div>` : ''}`;
    }
    if (b.type === 'skill') {
      const sk = BC.skillMap[b.skill];
      if (!sk) return noneBot();
      const iss = BC.lists.issue.filter((i) => i.skill === sk.id && i.who !== 'coach');
      return `<p>「${esc(sk.name)}」のことだね。いちばん近い なやみは どれ？</p><div class="rows">${iss.map(issueRow).join('')}</div><a class="chip chip-go" href="#s/${sk.id}">${esc(sk.name)}のページへ</a>`;
    }
    if (b.type === 'plan') {
      return `<p>練習プランを つくるね。プランの画面で、時間や人数を えらんでから「プランをつくる」を押してね。</p><a class="btn primary" href="#plan">${ic('plan')}プランの画面へ</a>`;
    }
    return noneBot();
  }
  const noneBot = () => `<p>うまく 読みとれませんでした。こまっている場面を、もう少し くわしく書いてみてね（例：「試合になるとシュートが入らない」）。わざから えらぶこともできます。</p><div class="chips">${BC.skills.filter((s) => s.group !== 'base' || s.id === 'body' || s.id === 'mind').map((s) => `<button type="button" class="chip" data-skill="${s.id}">${esc(s.name)}</button>`).join('')}</div>`;
  function renderChat() {
    if (!S.log.length) S.log.push({ bot: { type: 'hello' } });
    show(`${back()}<h1 class="page-h">コーチに そうだん</h1>
      <div class="chat-log">${S.log.map((m, i) => (m.me != null ? `<div class="msg me" data-i="${i}"><p>${esc(m.me)}</p></div>` : `<div class="msg bot" data-i="${i}"><span class="bot-face">${LOGO}</span><div class="bot-card">${botHTML(m.bot)}</div></div>`)).join('')}</div>
      ${S.log.length > 1 ? '<button type="button" class="link-btn" data-act="chat-clear">会話をはじめからにする</button>' : ''}
      <form class="composer" data-form="chat" autocomplete="off"><textarea name="q" rows="1" placeholder="例：試合になるとシュートが入らない" aria-label="なやみ" enterkeyhint="send"></textarea><button type="submit" class="btn primary" aria-label="送る">${ic('up')}</button></form>`, 'more', 'page-chat');
  }
  function chatPush(me, bot) {
    S.log.push({ me });
    S.log.push({ bot });
    saveLog();
    renderChat();
    requestAnimationFrame(() => { const el = document.querySelector(`.msg[data-i="${S.log.length - 2}"]`); if (el) el.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'start' }); });
  }
  const lastIssue = () => { for (let i = S.log.length - 1; i >= 0; i--) if (S.log[i].bot && S.log[i].bot.type === 'issue') return S.log[i].bot.id; return null; };
  function chatSend(text) {
    text = String(text || '').trim();
    if (!text) return;
    const ans = BC.answer(text, { profile: Object.assign({ who: 'player' }, cond()), lastIssue: lastIssue() });
    chatPush(text, serialize(ans));
  }
  // ホーム・れんしゅうの「さがす」：いちばん近いページへ
  function askGo(text) {
    text = String(text || '').trim();
    if (!text) return;
    const ans = BC.answer(text, { profile: Object.assign({ who: 'player' }, cond()) });
    if (ans.type === 'issue') location.hash = ans.issue.id;
    else if (ans.type === 'item') location.hash = ans.item.id;
    else if (ans.type === 'skill') location.hash = 's/' + ans.skill.id;
    else if (ans.type === 'plan') { PL.focus = ans.plan.focus || []; PL.skills = ans.plan.skills || []; PL.minutes = ans.plan.minutes || 60; savePL(); location.hash = 'plan'; }
    else { S.lib.q = text; location.hash = 'lib'; }
  }

  /* ---------- 練習プラン（#plan） ---------- */
  const PL = Object.assign({ minutes: 60, n: null, level: null, place: null, focus: [], skills: [], data: null, name: '' }, store.get('bc.pl', {}));
  let plans = store.get('bc.plans', []);
  const savePL = () => store.set('bc.pl', PL);
  const savePlans = () => store.set('bc.plans', plans);
  const plSeen = {};
  let plPick = null, plDel = null;
  const fmt = (m) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
  const plTotal = (data) => data.blocks.reduce((t, b) => t + b.items.reduce((u, x) => u + x.min, 0), 0);
  const plTheme = (data) => (data.focus || []).map(get).filter(Boolean).map((i) => i.title).concat((data.skills || []).map(skillName).filter(Boolean)).join('・') || '基本をひととおり';
  const plName = (data) => { const d = new Date(); return `${d.getMonth() + 1}/${d.getDate()} ${plTheme(data)} ${plTotal(data)}分`; };
  function plMake() {
    const p = BC.plan({ minutes: PL.minutes, n: PL.n, level: PL.level, place: PL.place, focus: PL.focus, skills: PL.skills });
    PL.data = BC.planData(p, PL);
    PL.data.focus = PL.focus.slice();
    PL.data.skills = PL.skills.slice();
    PL.data.place = PL.place;
    PL.name = '';
    plPick = null;
    savePL();
  }
  function plCondHTML() {
    const seg = (key, opts) => `<div class="seg wrap" role="group">${opts.map(([v, l]) => `<button type="button" data-plc="${key}" data-v="${v}" aria-pressed="${String(PL[key] == null ? '' : PL[key]) === String(v)}">${l}</button>`).join('')}</div>`;
    const themes = PL.focus.map(get).filter(Boolean).map((i) => `<span class="chip on">${esc(i.title)}<button type="button" class="chip-x" data-plthdel="${i.id}" aria-label="${esc(i.title)}を外す">×</button></span>`)
      .concat(PL.skills.map((sid) => `<span class="chip on">${esc(skillName(sid))}<button type="button" class="chip-x" data-plthdel="s:${sid}" aria-label="外す">×</button></span>`)).join('');
    return `<section class="card pl-cond">
      <div class="field"><span class="field-l">テーマ（なやみ・わざ）</span><div class="chips">${themes || '<span class="small">なし（基本をひととおり入れます）</span>'}</div>
        <div class="search-box">${ic('search')}<input id="pl-q" type="search" placeholder="テーマを足す（例：シュート、ゾーン、緊張）" autocomplete="off"></div>
        <div id="pl-sug" class="chips">${plSugHTML('')}</div></div>
      <div class="field"><span class="field-l">時間</span>${seg('minutes', [[30, '30分'], [45, '45分'], [60, '60分'], [90, '90分'], [120, '120分']])}</div>
      <div class="field"><span class="field-l">人数</span>${seg('n', [[1, 'ひとり'], [3, '2〜4人'], [8, '5人以上'], ['', '決めない']])}</div>
      <div class="field"><span class="field-l">レベル</span>${seg('level', [[1, 'はじめて・ミニバス'], [2, '中学・高校'], [3, '上級'], ['', '決めない']])}</div>
      <div class="field"><span class="field-l">場所</span>${seg('place', [['', '体育館'], ['hoop', 'ゴール1つ'], ['any', '家（ゴールなし）']])}</div>
      <div class="btns"><button type="button" class="btn primary big" data-pl="make">${PL.data ? 'この条件で 作りなおす' : 'プランをつくる'}</button></div>
    </section>`;
  }
  function plSugHTML(q) {
    let list = [];
    if (q.trim()) {
      const sk = BC.skills.filter((x) => BC.norm(x.name + (x.words || []).join(' ')).includes(BC.norm(q)) || BC.skillsIn(q).includes(x));
      list = sk.filter((x) => !PL.skills.includes(x.id)).slice(0, 3).map((x) => `<button type="button" class="chip" data-plthadd="s:${x.id}">＋ ${esc(x.name)}</button>`);
      list = list.concat(BC.search(q, { kinds: ['issue'] }).filter((h) => !PL.focus.includes(h.item.id)).slice(0, 6).map((h) => `<button type="button" class="chip" data-plthadd="${h.item.id}">＋ ${esc(h.item.title)}</button>`));
    } else {
      list = ['i-shoot-miss', 'i-drb-stolen', 'i-def-beat', 'i-reb-lose', 'i-fb-none', 'i-pass-steal'].filter((id) => get(id) && !PL.focus.includes(id)).map((id) => `<button type="button" class="chip" data-plthadd="${id}">＋ ${esc(get(id).title)}</button>`);
    }
    return list.join('') || '<span class="small">見つかりません</span>';
  }
  function plPickerHTML(key) {
    const q = (document.getElementById('pl-pq') || {}).value || '';
    const n = BC.norm(q);
    const list = BC.planAlternatives(PL.data, key, null).filter((d) => !n || BC.norm(d.name + (d.alias || []).join('') + (d.words || []).join('')).includes(n)).slice(0, 12);
    return `<div class="pl-pick"><div class="search-box">${ic('search')}<input id="pl-pq" type="search" placeholder="練習メニューをさがす" value="${esc(q)}" autocomplete="off" data-b="${key}"></div>
      <div class="rows">${list.map((d) => `<button type="button" class="row-card" data-pl="pick" data-b="${key}" data-id="${d.id}">${drillArt(d)}<span class="rc-body"><span class="rc-title">${esc(d.name)}</span><span class="rc-meta">${pills(d)}</span></span>${ic('plus', 'rc-go')}</button>`).join('') || '<p class="empty">条件に合う練習が見つかりません。</p>'}</div></div>`;
  }
  function plPlanHTML() {
    const data = PL.data;
    if (!data) return `<p class="empty">テーマと条件をえらんで「プランをつくる」を押すと、じゅんび運動から しめくくりまで組みます。</p>`;
    const total = plTotal(data);
    let t = 0;
    const blocks = data.blocks.map((b) => {
      const sumMin = b.items.reduce((u, x) => u + x.min, 0);
      const rows = b.items.map((x, i) => {
        const d = get(x.id);
        if (!d) return '';
        const start = t;
        t += x.min;
        const at = `data-b="${b.key}" data-i="${i}"`;
        return `<div class="pl-row">
          <a class="pl-main" href="#${d.id}"><span class="pl-time num">${fmt(start)}</span>${drillArt(d)}<span class="pl-text"><b>${esc(d.name)}</b><small>${md(plain((d.points || [])[0] || d.aim)).slice(0, 90)}</small></span></a>
          <div class="pl-ctl">
            <button type="button" class="ib" data-pl="minus" ${at} aria-label="1分へらす">${ic('minus')}</button><span class="num pl-min">${x.min}分</span><button type="button" class="ib" data-pl="plus" ${at} aria-label="1分ふやす">${ic('plus')}</button>
            <span class="pl-sp"></span>
            <button type="button" class="ib" data-pl="swap" ${at} aria-label="ほかのメニューに入れかえる">${ic('shuffle')}</button>
            <button type="button" class="ib" data-pl="up" ${at} aria-label="上へ">${ic('up')}</button><button type="button" class="ib" data-pl="down" ${at} aria-label="下へ">${ic('down')}</button>
            <button type="button" class="ib" data-pl="del" ${at} aria-label="外す">${ic('trash')}</button>
          </div></div>`;
      }).join('');
      return `<div class="pl-block"><h3 class="pl-bh"><span>${esc(b.name)}</span><span class="num">${sumMin}分</span></h3>${rows}
        <button type="button" class="link-btn" data-pl="add" data-b="${b.key}">${plPick === b.key ? '閉じる' : '＋ メニューを足す'}</button>${plPick === b.key ? plPickerHTML(b.key) : ''}</div>`;
    }).join('');
    return `<section class="card pl-plan">
      <div class="pl-head"><span class="pl-total num">${total}<small>分</small></span><span class="small">テーマ：${esc(plTheme(data))}${total !== data.minutes ? `（予定 ${data.minutes}分）` : ''}</span></div>
      <div class="btns"><button type="button" class="btn primary big" data-pl="run">${ic('play')}タイマーで はじめる</button></div>
      ${blocks}
      <p class="small">${ic('shuffle', 'inline')}で ほかのメニューに入れかえ、− ＋ で時間をかえられます。</p>
      <label class="field"><span class="field-l">名前</span><input id="pl-name" type="text" value="${esc(PL.name || plName(data))}"></label>
      <div class="btns"><button type="button" class="btn" data-pl="save">${ic('save')}ほぞん</button><button type="button" class="btn" data-pl="copy">${ic('copy')}文字でコピー</button></div>
    </section>`;
  }
  function plSavedHTML() {
    if (!plans.length) return '';
    return `<section class="sec"><h2 class="sec-h">ほぞんしたプラン</h2><div class="rows">${plans.map((p) => `<div class="card pl-saved">
      <b>${esc(p.name)}</b><span class="small"><span class="num">${plTotal(p.data)}分</span>・${esc(plTheme(p.data))}</span>
      <span class="btns"><button type="button" class="btn" data-pl="open" data-id="${p.id}">ひらく</button><button type="button" class="btn primary" data-pl="run-saved" data-id="${p.id}">${ic('play')}はじめる</button><button type="button" class="btn" data-pl="rm" data-id="${p.id}">${plDel === p.id ? 'もう一度押すと消えます' : '消す'}</button></span></div>`).join('')}</div></section>`;
  }
  function renderPlan() {
    // はじめて開いたときだけ、プロフィールの人数・レベルを入れておく（あとで「決めない」にしてもよい）
    if (!PL.init && S.me) { PL.init = true; PL.n = prof().n || null; PL.level = prof().level || null; savePL(); }
    show(`${back()}<h1 class="page-h">練習プランを つくる</h1>
      <p class="page-lead">じゅんび運動 → わざの練習 → 対人・ゲーム → しめくくり の順に組みます。入れかえ・時間の調整・ほぞんができて、タイマーで進められます。</p>
      <div class="stack"><div id="pl-cond">${plCondHTML()}</div><div id="pl-plan">${plPlanHTML()}</div><div id="pl-saved">${plSavedHTML()}</div></div>`, 'practice', 'page-plan');
  }
  function plRefresh(part) {
    if (S.page !== 'plan') return;
    if (!part || part === 'cond') { const e = document.getElementById('pl-cond'); if (e) e.innerHTML = plCondHTML(); }
    if (!part || part === 'plan') { const e = document.getElementById('pl-plan'); if (e) e.innerHTML = plPlanHTML(); }
    if (!part || part === 'saved') { const e = document.getElementById('pl-saved'); if (e) e.innerHTML = plSavedHTML(); }
  }
  function plFind(key, i) { const b = PL.data.blocks.find((x) => x.key === key); return b ? { b, x: b.items[+i] } : {}; }

  /* ---------- タイマー（練習中の画面） ---------- */
  let RUN = null;
  function beep() {
    try {
      const ac = RUN && RUN.ac;
      if (!ac) return;
      [0, 0.22].forEach((d) => {
        const o = ac.createOscillator(), g = ac.createGain();
        o.frequency.value = 880; o.connect(g); g.connect(ac.destination);
        g.gain.setValueAtTime(0.0001, ac.currentTime + d); g.gain.exponentialRampToValueAtTime(0.3, ac.currentTime + d + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + d + 0.18);
        o.start(ac.currentTime + d); o.stop(ac.currentTime + d + 0.2);
      });
    } catch (e) { /* 音が出なくても進む */ }
    try { if (navigator.vibrate) navigator.vibrate([150, 80, 150]); } catch (e) { /* なし */ }
  }
  // kind：'menu'（きょうのメニュー）| 'plan' | 'drill'
  function runStart(list, kind) {
    const its = list.filter((x) => get(x.id));
    if (!its.length) return;
    runEnd();
    RUN = { items: its, i: 0, left: its[0].min * 60, paused: false, last: Date.now(), done: false, kind, reached: 0 };
    try { RUN.ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { /* なし */ }
    try { if (navigator.wakeLock) navigator.wakeLock.request('screen').then((w) => { if (RUN) RUN.wake = w; else w.release(); }).catch(() => {}); } catch (e) { /* 画面が消えないようにできなくても進む */ }
    runRender(true);
    RUN.timer = setInterval(runTick, 250);
  }
  const planItems = (data) => data.blocks.flatMap((b) => b.items.map((x) => ({ id: x.id, min: x.min, block: b.name })));
  function runGo(i) {
    if (!RUN) return;
    RUN.i = Math.max(0, Math.min(RUN.items.length - 1, i));
    RUN.reached = Math.max(RUN.reached, RUN.i);
    RUN.left = RUN.items[RUN.i].min * 60;
    RUN.done = false;
    RUN.last = Date.now();
    runRender(true);
  }
  function runTick() {
    if (!RUN) return;
    const now = Date.now();
    if (!RUN.paused && !RUN.done) RUN.left -= (now - RUN.last) / 1000;
    RUN.last = now;
    if (!RUN.done && RUN.left <= 0) {
      beep();
      if (RUN.i < RUN.items.length - 1) runGo(RUN.i + 1);
      else { RUN.done = true; RUN.reached = RUN.items.length; runRender(true); }
      return;
    }
    runRender(false);
  }
  function runRender(full) {
    if (!RUN) return;
    let el = document.querySelector('.run');
    if (!el) { el = document.createElement('div'); el.className = 'run'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', '練習のタイマー'); document.body.appendChild(el); full = true; }
    const x = RUN.items[RUN.i], d = get(x.id), next = RUN.items[RUN.i + 1];
    const total = RUN.items.reduce((t, y) => t + y.min, 0);
    if (full) {
      el.innerHTML = RUN.done ? `<div class="run-top"><span>おわり！</span><button type="button" class="icon-btn" data-run="end" aria-label="閉じる">${ic('close')}</button></div>
        <div class="run-body run-done">${confetti()}<p class="run-name">おつかれさま！</p><p class="run-sum"><b class="num">${RUN.items.length}</b>メニュー・<b class="num">${total}</b>分</p>
          <p>どうだった？</p>${rateButtons('run')}
          <label class="field"><span class="field-l">ひとことメモ（なくてもOK）</span><input id="run-note" type="text" maxlength="60" placeholder="例：左手のドリブルが 前より できた"></label></div>`
        : `<div class="run-top"><span>${esc(x.block || ROLE[x.role] || '')} ${RUN.i + 1} / ${RUN.items.length}</span><button type="button" class="icon-btn" data-run="stop" aria-label="タイマーを終わる">${ic('close')}</button></div>
        <div class="run-body">
          <p class="run-name">${esc(d.name)}</p>
          <div class="run-clock num" id="run-clock"></div>
          <div class="run-bar"><i id="run-prog"></i></div>
          ${BC.motionFor(d.id) ? `<div class="run-anim" data-anim="${BC.motionFor(d.id)}" data-points="0" data-compact="1"></div>` : ''}
          <ul class="run-pts">${(d.points || []).slice(0, 3).map((p) => `<li>${md(p)}</li>`).join('')}</ul>
          <details class="run-steps"><summary>やりかた</summary>${ol(d.steps)}</details>
          <p class="run-next">${next ? `つぎ：${esc(get(next.id).name)}（${next.min}分）` : 'つぎ：おわり'}</p>
        </div>
        <div class="run-ctl"><button type="button" class="btn" data-run="prev">${ic('back')}まえ</button><button type="button" class="btn primary" data-run="pause" id="run-pause"></button><button type="button" class="btn" data-run="next">つぎ${ic('next')}</button></div>`;
      hydrate(el);
    }
    if (RUN.done) return;
    const left = Math.max(0, Math.ceil(RUN.left));
    const c = document.getElementById('run-clock');
    if (c) c.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
    const pr = document.getElementById('run-prog');
    if (pr) pr.style.width = `${(100 * (1 - RUN.left / (x.min * 60))).toFixed(1)}%`;
    const pb = document.getElementById('run-pause');
    if (pb) pb.innerHTML = RUN.paused ? `${ic('play')}つづける` : `${ic('pause')}休む`;
  }
  function runEnd() {
    if (!RUN) return;
    clearInterval(RUN.timer);
    try { if (RUN.wake) RUN.wake.release(); } catch (e) { /* なし */ }
    try { if (RUN.ac) RUN.ac.close(); } catch (e) { /* なし */ }
    RUN = null;
    document.querySelectorAll('.run').forEach((e) => e.remove());
  }
  // とちゅうでやめる：やったところまでを記録するか聞く
  function runStop() {
    if (!RUN) return;
    const doneN = RUN.i + (RUN.left <= RUN.items[RUN.i].min * 30 ? 1 : 0);
    if (doneN <= 0) { runEnd(); return; }
    RUN.items = RUN.items.slice(0, doneN);
    RUN.done = true;
    RUN.partial = true;
    runRender(true);
  }
  const rateButtons = (key, id = '') => `<div class="rate">${[3, 2, 1].map((r) => `<button type="button" class="rate-b r${r}" data-rate="${r}" data-for="${key}" data-id="${id}">${FACE[r]}<b>${RATE[r]}</b></button>`).join('')}</div>`;
  function runFinish(rate) {
    if (!RUN) return;
    const note = ((document.getElementById('run-note') || {}).value || '').trim();
    const list = RUN.items.map((x) => { const d = get(x.id); return { type: 'drill', id: x.id, skill: (d.skills || [])[0], min: x.min, rate, xp: G.drillXP(x.min, rate) }; });
    if (note && list.length) list[list.length - 1].note = note;
    if (RUN.kind === 'menu' && !RUN.partial) list.push({ type: 'menu', id: 'today', skill: list[0] && list[0].skill, xp: G.XP.menu });
    runEnd();
    addActs(list);
    rerender();
  }

  /* ---------- 小さな画面（モーダル・トースト） ---------- */
  function modal(html) {
    closeModal();
    const m = document.createElement('div');
    m.className = 'modal';
    m.setAttribute('role', 'dialog');
    m.setAttribute('aria-modal', 'true');
    m.innerHTML = `<div class="modal-back" data-act="modal-close"></div><div class="modal-card">${html}</div>`;
    document.body.appendChild(m);
    const f = m.querySelector('button, input, a');
    if (f) setTimeout(() => f.focus({ preventScroll: true }), 30);
  }
  function closeModal() { document.querySelectorAll('.modal').forEach((e) => e.remove()); }
  function rateDrill(id) {
    const d = get(id);
    if (!d) return;
    modal(`<h2 class="modal-h">やった！</h2><p class="center"><b>${esc(d.name)}</b></p>
      <label class="field"><span class="field-l">何分やった？</span><div class="seg" role="group">${[3, 5, 10, 15].map((m) => `<button type="button" data-rmin="${m}" aria-pressed="${m === Math.min(15, d.minutes || 5) || (m === 5 && ![3, 5, 10, 15].includes(Math.min(15, d.minutes || 5)))}">${m}分</button>`).join('')}</div></label>
      <p class="center">どうだった？</p>${rateButtons('drill', id)}
      <label class="field"><span class="field-l">ひとことメモ（なくてもOK）</span><input id="rate-note" type="text" maxlength="60" placeholder="例：10回中 7回できた"></label>`);
  }
  let toastT;
  function toast(msg, kind = '') {
    document.querySelectorAll('.toast').forEach((t) => t.remove());
    const t = document.createElement('div');
    t.className = 'toast' + (kind ? ' ' + kind : '');
    t.setAttribute('role', 'status');
    t.innerHTML = kind === 'xp' ? `${ic('star')}<b>${esc(msg)}</b>` : esc(msg);
    document.body.appendChild(t);
    clearTimeout(toastT);
    toastT = setTimeout(() => t.remove(), 2600);
  }
  async function copy(text, okMsg) {
    try { await navigator.clipboard.writeText(text); toast(okMsg || 'コピーしました'); }
    catch (e) { modal(`<p>コピーできなかったので、下の文字をえらんでコピーしてね。</p><textarea class="copy-box">${esc(text)}</textarea><div class="btns"><button type="button" class="btn" data-act="modal-close">とじる</button></div>`); }
  }
  function download(name, text) {
    try {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
      a.download = name;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
      toast('書き出しました（ダウンロードを見てね）');
    } catch (e) { copy(text); }
  }
  const KEYS = ['bc.me', 'bc.acts', 'bc.checks', 'bc.log', 'bc.pl', 'bc.plans', 'bc.favs', 'bc.vchk', 'bc.menuMin'];

  /* ---------- チェック（動画分析は js/check.js） ---------- */
  const checkCtx = {
    open: (id) => { location.hash = id; },
    toast: (m) => toast(m),
    addXP: (skill, n, why) => addActs([{ type: 'check', id: why || 'check', skill, xp: n }]),
    store,
    get profile() { return { name: prof().name, grade: prof().grade }; },
  };
  function renderCheck(sub) {
    const m = main();
    m.className = 'page-check';
    setTabMark('check');
    if (!BC.check || !BC.check.render) { m.innerHTML = '<h1 class="page-h">チェック</h1><p>じゅんび中です。</p>'; return; }
    const opt = {};
    if (sub && sub.startsWith('rec/')) opt.record = sub.slice(4);
    else if (sub) opt.mode = sub;
    m.innerHTML = '';
    BC.check.render(m, checkCtx, opt);
  }

  /* ---------- 道すじ（ハッシュ） ---------- */
  const TOP = ['home', 'practice', 'check', 'log', 'more'];
  const stack = []; // この中で開いたページの順（もどるボタン用）
  function route() {
    closeModal();
    const h = decodeURIComponent(location.hash.slice(1)) || 'home';
    if (!S.me && h !== 'hello' && h !== 'about') { location.replace('#hello'); return; }
    if (h !== S.hash) {
      if (TOP.includes(h) || h === 'hello') stack.length = 0;
      if (stack.length > 1 && stack[stack.length - 2] === h) stack.pop(); else stack.push(h);
      if (h.startsWith('tape/')) tapeStep = 0;
      S.hash = h;
    }
    S.page = h.split('/')[0];
    if (S.page !== 'hello' && S.page !== 'settings') draft = null; // 保存しなかった入力は捨てる
    document.body.classList.toggle('onboarding', h === 'hello');
    if (h === 'home') renderHome();
    else if (h === 'practice') renderPractice();
    else if (h === 'log') renderLog();
    else if (h === 'more') renderMore();
    else if (h === 'check' || h.startsWith('check/')) renderCheck(h.slice(6));
    else if (h === 'hello') renderHello(false);
    else if (h === 'settings') renderHello(true);
    else if (h === 'about') renderAbout();
    else if (h === 'lib') renderLib();
    else if (h === 'chat') renderChat();
    else if (h === 'plan') renderPlan();
    else if (h === 'aid') renderAidHome();
    else if (h.startsWith('aid/') && BC.aidById && BC.aidById[h.slice(4)]) renderAid(BC.aidById[h.slice(4)]);
    else if (h.startsWith('tape/') && BC.tapeById && BC.tapeById[h.slice(5)]) renderTape(BC.tapeById[h.slice(5)]);
    else if (h.startsWith('s/')) renderSkill(h.slice(2));
    else if (get(h)) {
      const it = get(h);
      if (it.kind_ === 'drill') renderDrill(it);
      else if (it.kind_ === 'view') renderView(it);
      else if (it.kind_ === 'issue') renderIssue(it);
      else renderTactic(it);
    } else renderHome();
    if (!(h === 'chat' && S.log.length > 1)) window.scrollTo(0, 0);
    else requestAnimationFrame(() => window.scrollTo(0, document.body.scrollHeight));
    refreshTop();
  }
  const rerender = () => { const y = window.scrollY; route(); window.scrollTo(0, y); };
  function goBack() {
    if (stack.length > 1) history.back();
    else location.hash = S.tab || 'home';
  }

  /* ---------- 操作 ---------- */
  document.addEventListener('click', async (e) => {
    const t = e.target.closest('[data-act],[data-hello],[data-theme],[data-menumin],[data-dfilter],[data-vchk],[data-rate],[data-rmin],[data-tapestep],[data-cal],[data-libkind],[data-libskill],[data-say],[data-ask],[data-skill],[data-pl],[data-plc],[data-plthadd],[data-plthdel],[data-run]');
    if (!t) return;
    const d = t.dataset;
    if (d.hello) {
      const dr = draft || (draft = Object.assign({ name: '', grade: '', goals: [], place: 'any', n: 1 }, S.me || {}));
      dr.name = (document.getElementById('hello-name') || {}).value || dr.name;
      if (d.hello === 'goals') {
        const g = dr.goals.slice();
        const i = g.indexOf(d.v);
        if (i >= 0) g.splice(i, 1); else { g.push(d.v); if (g.length > 3) g.shift(); }
        dr.goals = g;
      } else dr[d.hello] = d.hello === 'n' ? +d.v : d.v;
      const y = window.scrollY;
      renderHello(S.page === 'settings');
      window.scrollTo(0, y);
      return;
    }
    if (t.hasAttribute('data-theme')) {
      const v = d.theme;
      if (v) document.documentElement.dataset.theme = v; else delete document.documentElement.dataset.theme;
      store.set('bc.theme', v);
      document.querySelectorAll('[data-theme]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.theme === v));
      return;
    }
    if (d.menumin) { S.menuMin = +d.menumin; store.set('bc.menuMin', S.menuMin); rerender(); return; }
    if (d.dfilter) { S.dfilter = d.dfilter; rerender(); return; }
    if (d.cal) { S.calMonth = Math.min(0, S.calMonth + +d.cal); rerender(); return; }
    if (d.tapestep != null) { tapeStep = +d.tapestep; const y = window.scrollY; route(); window.scrollTo(0, y); return; }
    if (d.vchk) {
      const rec = S.vchk[d.vchk] || { on: [] };
      const i = +d.i;
      rec.on = rec.on.includes(i) ? rec.on.filter((x) => x !== i) : rec.on.concat(i);
      S.vchk[d.vchk] = rec;
      store.set('bc.vchk', S.vchk);
      t.setAttribute('aria-pressed', rec.on.includes(i));
      const v = get(d.vchk);
      const today = G.day(Date.now());
      if (v && rec.on.length === (v.checks || []).length && !S.acts.some((a) => a.type === 'view' && a.id === v.id && G.day(a.at) === today)) {
        addActs([{ type: 'view', id: v.id, skill: v.skill, xp: G.XP.view }]);
      }
      return;
    }
    if (d.rmin) { t.parentElement.querySelectorAll('[data-rmin]').forEach((b) => b.setAttribute('aria-pressed', b === t)); return; }
    if (d.rate) {
      const r = +d.rate;
      if (d.for === 'run') { runFinish(r); return; }
      const dr = get(d.id);
      const sel = document.querySelector('.modal [data-rmin][aria-pressed="true"]');
      const min = sel ? +sel.dataset.rmin : dr.minutes || 5;
      const note = ((document.getElementById('rate-note') || {}).value || '').trim();
      closeModal();
      addActs([{ type: 'drill', id: dr.id, skill: (dr.skills || [])[0], min, rate: r, xp: G.drillXP(min, r), note: note || undefined }]);
      rerender();
      return;
    }
    if (d.say) { chatSend(d.say); return; }
    if (d.ask) { const it = get(d.ask); if (it) chatPush(d.label || labelOf(it), it.kind_ === 'issue' ? { type: 'issue', id: it.id, alts: [], ctx: {} } : { type: 'item', id: it.id, alts: [], related: BC.issuesFor(it.id).slice(0, 4).map((x) => x.id), ctx: {} }); return; }
    if (d.skill) { const sk = BC.skillMap[d.skill]; if (sk) chatPush(sk.name, { type: 'skill', skill: sk.id, ctx: {} }); return; }
    if (d.libkind) { S.lib.kind = d.libkind; S.lib.q = ''; S.lib.skill = ''; renderLib(); return; }
    if (t.hasAttribute('data-libskill')) { S.lib.skill = d.libskill; const l = document.getElementById('lib-list'); if (l) l.innerHTML = libListHTML(); document.querySelectorAll('[data-libskill]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.libskill === d.libskill)); return; }
    if (d.run) {
      if (!RUN) return;
      if (d.run === 'end') runEnd();
      else if (d.run === 'stop') runStop();
      else if (d.run === 'pause') { RUN.paused = !RUN.paused; runRender(false); }
      else if (d.run === 'next') { if (RUN.i < RUN.items.length - 1) runGo(RUN.i + 1); else { RUN.done = true; runRender(true); } }
      else if (d.run === 'prev') runGo(RUN.i - 1);
      return;
    }
    if (d.plc) { PL[d.plc] = d.v === '' ? null : isNaN(+d.v) ? d.v : +d.v; savePL(); plRefresh('cond'); return; }
    if (d.plthadd) {
      if (d.plthadd.startsWith('s:')) { const sid = d.plthadd.slice(2); if (!PL.skills.includes(sid)) PL.skills.push(sid); }
      else if (!PL.focus.includes(d.plthadd)) PL.focus.push(d.plthadd);
      savePL(); plRefresh('cond');
      return;
    }
    if (d.plthdel) {
      if (d.plthdel.startsWith('s:')) PL.skills = PL.skills.filter((x) => x !== d.plthdel.slice(2));
      else PL.focus = PL.focus.filter((x) => x !== d.plthdel);
      savePL(); plRefresh('cond');
      return;
    }
    if (d.pl) { planAct(d.pl, d, t); return; }
    switch (d.act) {
      case 'back': goBack(); break;
      case 'hello-done': helloDone(); break;
      case 'menu-start': { const m = todayMenu(); runStart(m.items.map((x) => ({ id: x.id, min: x.min, role: x.role })), 'menu'); break; }
      case 'menu-shuffle': S.seed++; rerender(); break;
      case 'drill-timer': { const dr = get(d.id); if (dr) runStart([{ id: dr.id, min: dr.minutes || 5 }], 'drill'); break; }
      case 'drill-done': rateDrill(d.id); break;
      case 'fav': {
        const id = d.id;
        S.favs.has(id) ? S.favs.delete(id) : S.favs.add(id);
        store.set('bc.favs', [...S.favs]);
        t.setAttribute('aria-pressed', S.favs.has(id));
        toast(S.favs.has(id) ? 'お気に入りに入れました（ずかんの ★）' : 'お気に入りから外しました');
        break;
      }
      case 'plan-issue': PL.focus = [d.id]; PL.skills = []; PL.data = null; savePL(); location.hash = 'plan'; break;
      case 'chat-clear': S.log = []; saveLog(); renderChat(); break;
      case 'modal-close': closeModal(); break;
      case 'export': {
        const data = {};
        for (const k of KEYS) { const v = store.get(k, null); if (v != null) data[k] = v; }
        download(`basket-grow-${G.day(Date.now())}.json`, JSON.stringify({ app: 'basket-grow', v: 1, data }));
        break;
      }
      case 'reset':
        if (!S.resetArm) { S.resetArm = true; const y = window.scrollY; renderHello(true); window.scrollTo(0, y); setTimeout(() => { S.resetArm = false; }, 6000); break; }
        for (const k of KEYS) try { localStorage.removeItem(k); } catch (err) { /* なし */ }
        location.hash = 'hello';
        location.reload();
        break;
      default: break;
    }
  });
  function planAct(act, d) {
    if (act === 'make') { plMake(); plRefresh(); const e2 = document.getElementById('pl-plan'); if (e2) e2.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    if (!PL.data && !['open', 'rm', 'run-saved'].includes(act)) return;
    if (['minus', 'plus', 'swap', 'up', 'down', 'del'].includes(act)) {
      const { b, x } = plFind(d.b, d.i);
      if (!b || !x) return;
      const i = +d.i;
      if (act === 'minus') x.min = Math.max(1, x.min - 1);
      if (act === 'plus') x.min = Math.min(60, x.min + 1);
      if (act === 'up' && i > 0) [b.items[i - 1], b.items[i]] = [b.items[i], b.items[i - 1]];
      if (act === 'down' && i < b.items.length - 1) [b.items[i + 1], b.items[i]] = [b.items[i], b.items[i + 1]];
      if (act === 'del') b.items.splice(i, 1);
      if (act === 'swap') {
        const slot = d.b + ':' + i;
        const seen = (plSeen[slot] = plSeen[slot] || new Set([x.id]));
        let alts = BC.planAlternatives(PL.data, d.b, x.id).filter((a) => !seen.has(a.id));
        if (!alts.length) { seen.clear(); seen.add(x.id); alts = BC.planAlternatives(PL.data, d.b, x.id); }
        if (!alts.length) { toast('入れかえられる練習が見つかりません'); return; }
        seen.add(alts[0].id);
        x.id = alts[0].id;
        x.min = Math.max(3, Math.min(x.min, alts[0].minutes * 2));
        toast('「' + alts[0].name + '」に入れかえました');
      }
      savePL(); plRefresh('plan');
      return;
    }
    if (act === 'add') { plPick = plPick === d.b ? null : d.b; plRefresh('plan'); return; }
    if (act === 'pick') {
      const b = PL.data.blocks.find((x) => x.key === d.b), dr = get(d.id);
      if (b && dr) { b.items.push({ id: dr.id, min: dr.minutes || 8 }); savePL(); toast('「' + dr.name + '」を足しました'); }
      plRefresh('plan');
      return;
    }
    if (act === 'run') { runStart(planItems(PL.data), 'plan'); return; }
    if (act === 'copy') { const name = (document.getElementById('pl-name') || {}).value || plName(PL.data); copy(name + '\n' + BC.planText(BC.planFromData(PL.data)).replace(/^【練習プラン \d+分】/, `【練習プラン ${plTotal(PL.data)}分】`), '練習プランをコピーしました'); return; }
    if (act === 'save') {
      const name = ((document.getElementById('pl-name') || {}).value || '').trim() || plName(PL.data);
      PL.name = name;
      plans.unshift({ id: 'p' + Date.now().toString(36), name, saved: Date.now(), data: JSON.parse(JSON.stringify(PL.data)) });
      plans = plans.slice(0, 50);
      savePlans(); savePL();
      toast('「' + name + '」をほぞんしました');
      plRefresh('saved');
      return;
    }
    if (act === 'open' || act === 'run-saved') {
      const p = plans.find((x) => x.id === d.id);
      if (!p) return;
      PL.data = JSON.parse(JSON.stringify(p.data));
      Object.assign(PL, { minutes: p.data.minutes, n: p.data.n, level: p.data.level, place: p.data.place, focus: (p.data.focus || []).slice(), skills: (p.data.skills || []).slice(), name: p.name });
      savePL();
      if (act === 'run-saved') { runStart(planItems(PL.data), 'plan'); plRefresh(); return; }
      plRefresh();
      return;
    }
    if (act === 'rm') {
      if (plDel !== d.id) { plDel = d.id; plRefresh('saved'); return; }
      plans = plans.filter((x) => x.id !== d.id);
      plDel = null;
      savePlans();
      toast('消しました');
      plRefresh('saved');
    }
  }
  document.addEventListener('submit', (e) => {
    const f = e.target.closest('[data-form]');
    if (!f) return;
    e.preventDefault();
    const q = f.elements.q;
    const v = q ? q.value : '';
    if (f.dataset.form === 'ask') askGo(v);
    else if (f.dataset.form === 'chat') { q.value = ''; chatSend(v); }
    else if (f.dataset.form === 'aid') aidSearch(v);
  });
  function aidSearch(q) {
    const box = document.getElementById('aid-res');
    if (!box || !BC.findAids) return;
    const res = BC.findAids(q).slice(0, 5);
    box.innerHTML = q.trim() ? (res.length ? `<div class="rows">${res.map(({ aid: a }) => `<a class="row-card aid${a.urgent ? ' urgent' : ''}" href="#aid/${a.id}"><span class="thumb art-ic t-aid">${ic(a.urgent ? 'warn' : 'aid')}</span><span class="rc-body"><span class="rc-title">${esc(a.name)}</span></span>${ic('next', 'rc-go')}</a>`).join('')}</div>` : '<p class="empty">見つかりませんでした。下の一覧から さがしてね。こまったら、すぐ大人に伝えよう。</p>') : '';
  }
  document.addEventListener('input', (e) => {
    const id = e.target.id;
    if (id === 'lib-q') { S.lib.q = e.target.value; const l = document.getElementById('lib-list'); if (l) l.innerHTML = libListHTML(); }
    else if (id === 'pl-q') { const s2 = document.getElementById('pl-sug'); if (s2) s2.innerHTML = plSugHTML(e.target.value); }
    else if (id === 'pl-pq') { const pick = e.target.closest('.pl-pick'); if (pick) { const tmp = document.createElement('div'); tmp.innerHTML = plPickerHTML(e.target.dataset.b); pick.querySelector('.rows').innerHTML = tmp.querySelector('.rows').innerHTML; } }
    else if (id === 'hello-name' && draft) draft.name = e.target.value;
    else if (e.target.name === 'q' && e.target.closest('[data-form="chat"]')) { const ta = e.target; ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight + 2, 160) + 'px'; }
  });
  document.addEventListener('change', async (e) => {
    if (e.target.id !== 'import-file' || !e.target.files[0]) return;
    try {
      const j = JSON.parse(await e.target.files[0].text());
      if (!j || j.app !== 'basket-grow' || !j.data) throw new Error('形がちがう');
      for (const [k, v] of Object.entries(j.data)) if (KEYS.includes(k)) store.set(k, v);
      toast('読みこみました');
      setTimeout(() => location.reload(), 600);
    } catch (err) { toast('読みこめませんでした（バスケ・グロウで書き出したファイルを えらんでね）'); }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { if (document.querySelector('.modal')) closeModal(); }
    const ta = e.target.closest && e.target.closest('[data-form="chat"] textarea');
    if (ta && e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); ta.form.requestSubmit(); }
  });
  window.addEventListener('hashchange', route);

  /* ---------- はじめ ---------- */
  const th = store.get('bc.theme', '');
  if (th) document.documentElement.dataset.theme = th;
  shell();
  route();
  // 検査用（tools/look.cjs）
  window.BCAPP = { S, route, runStart, runEnd, getRun: () => RUN, addActs, sum, todayMenu, PL, store };
})();
