/* バスケ育成チャット：画面。データ（BC）と動画（BCV）を見て描く。
   タブ：#chat（会話）・#library（図鑑）・#videos（動画）。項目は #<id>（例：#d-mikan）でシートが開く。
   この端末に残すもの（localStorage）：会話（bc.log）・条件（bc.profile）・お気に入り（bc.favs）・動画の紐付け（bc.links・bc.urls）。 */
(function () {
  const BC = window.BC, BCV = window.BCV;
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

  const S = {
    tab: 'chat',
    profile: store.get('bc.profile', {}),
    log: store.get('bc.log', []),
    favs: new Set(store.get('bc.favs', [])),
    lib: { q: '', kind: 'issue', skill: '' },
    vid: { q: '', filter: 'all', limit: 120 },
    sheet: null,
    sheetExtra: null,
  };
  const saveLog = () => { S.log = S.log.slice(-60); store.set('bc.log', S.log); };

  /* ---------- 絵（アイコン） ---------- */
  const I = {
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16v11H9l-5 4z"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h6a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4zM20 4h-6a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h6z"/></svg>',
    film: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M10 9.5v5l4.5-2.5z" fill="currentColor"/></svg>',
    plan: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3h6v3H9zM8.5 11h7M8.5 15h4.5"/></svg>',
    close: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    star: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/></svg>',
    starOn: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/></svg>',
    send: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>',
    search: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>',
    sliders: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/></svg>',
    ball: '<svg class="logo-mark" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="14" fill="var(--ball)"/><path d="M2 16h28M16 2v28M6.2 6.2c5 5.2 5 14.4 0 19.6M25.8 6.2c-5 5.2-5 14.4 0 19.6" fill="none" stroke="var(--sheet)" stroke-width="1.6"/></svg>',
    face: '<svg class="bot-face" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="var(--ball)"/><path d="M1 12h22M12 1v22M4.3 4.3c3.9 4.1 3.9 11.3 0 15.4M19.7 4.3c-3.9 4.1-3.9 11.3 0 15.4" fill="none" stroke="var(--sheet)" stroke-width="1.3"/></svg>',
  };

  /* ---------- 小さな部品 ---------- */
  const lv = (n) => `<span class="lv" title="レベル：${esc(BC.LEVELS[n] || '')}">${[1, 2, 3].map((i) => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</span>`;
  const people = (d) => (d.n === 1 ? '<span class="solo">ひとりでできる</span>' : `<span>${d.n}人〜</span>`);
  function chip(it, extra = '') {
    if (!it) return '';
    return `<button type="button" class="chip k-${it.kind_}" data-open="${it.id}"><span class="k-dot"></span>${esc(labelOf(it))}${extra}</button>`;
  }
  const chips = (list) => (list.length ? `<div class="chips">${list.map((x) => chip(x)).join('')}</div>` : '');
  function drillCard(d) {
    return `<button type="button" class="card k-drill" data-open="${d.id}">
      <span class="card-h"><span class="k-dot"></span><span>${esc(d.name)}</span>${S.favs.has(d.id) ? '<span class="star">★</span>' : ''}</span>
      <span class="meta">${people(d)}<span class="num">${d.minutes}分</span><span>${esc(BC.PLACES[d.place] || '')}</span>${lv(d.level)}${BC.motionFor && BC.motionFor(d.id) ? '<span class="badge">動きあり</span>' : ''}</span>
      <span class="card-sub">${md(d.aim)}</span></button>`;
  }
  function viewCard(v) {
    return `<button type="button" class="card k-view" data-open="${v.id}">
      <span class="card-h"><span class="k-dot"></span><span>${esc(v.name)}</span></span>
      ${v.cue ? `<span class="card-cue">${esc(v.cue)}</span>` : ''}
      <span class="card-sub">${md((v.checks || [])[0] || v.summary)}</span></button>`;
  }
  function tacticCard(t) {
    return `<button type="button" class="card k-tactic lib-tactic" data-open="${t.id}">
      ${t.diagram ? BC.courtThumb(t.diagram) : '<span></span>'}
      <span style="display:flex;flex-direction:column;gap:3px;min-width:0">
        <span class="card-h"><span class="k-dot"></span><span>${esc(t.name)}</span>${S.favs.has(t.id) ? '<span class="star">★</span>' : ''}</span>
        <span class="meta"><span>${esc(BC.TCATS[t.cat] || '')}・${esc(t.kind || '')}</span>${lv(t.level)}</span>
        <span class="card-sub">${md(t.summary)}</span></span></button>`;
  }
  function issueCard(i) {
    return `<button type="button" class="card k-issue" data-ask="${i.id}">
      <span class="card-h"><span class="k-dot"></span><span>${esc(i.title)}</span></span>
      <span class="card-sub">${md(i.summary)}</span></button>`;
  }
  const cardOf = (it) => ({ drill: drillCard, view: viewCard, tactic: tacticCard, issue: issueCard }[it.kind_](it));
  const condText = (c) => {
    const p = [];
    if (c.level) p.push(BC.LEVELS[c.level]);
    if (c.n) p.push(c.n === 1 ? 'ひとり' : c.n < 5 ? `${c.n}人` : 'チーム');
    if (c.who === 'coach') p.push('指導者・保護者');
    else if (c.who === 'player') p.push('選手');
    return p.join('・');
  };

  /* ---------- 動画のかたまり ---------- */
  const ytLink = (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent('バスケ ' + q)}`;
  function videoBlock(ids, skills, query, opt = {}) {
    const max = opt.max || 4;
    const yt = `<a class="chip chip-ghost" href="${ytLink(query)}" target="_blank" rel="noopener">YouTube で「${esc(query)}」を探す ↗</a>`;
    if (!BCV.files.length) {
      return `<div class="empty-vid"><p>手元の解説動画のフォルダをつなぐと、ここに関係する動画が出ます。</p>
        <div class="chips"><button type="button" class="chip chip-soft" data-act="pick-folder">動画フォルダをつなぐ</button>${BCV.saved ? `<button type="button" class="chip" data-act="reconnect">前のフォルダ「${esc(BCV.saved.name)}」につなぐ</button>` : ''}${yt}</div></div>`;
    }
    const { direct, near } = BCV.videosFor(ids, skills, max);
    if (!direct.length && !near.length) {
      return `<div class="empty-vid"><p>つないだ動画の中に、合いそうなものが見つかりませんでした。動画のタブで、手で紐付けることもできます。</p><div class="chips"><a class="chip" href="#videos">動画のタブへ</a>${yt}</div></div>`;
    }
    const cards = direct.map((x) => vidCard(x.v, x.via ? `${x.manual ? '紐付け' : '名前が一致'}：${labelOf(get(x.via) || {})}` : '')).concat(near.map((x) => vidCard(x.v, `同じテーマ：${skillName(x.skill)}`)));
    return `<div class="vids">${cards.join('')}</div><div class="chips">${yt}</div>`;
  }
  function vidCard(v, why) {
    return `<button type="button" class="vid" data-play="${esc(v.key)}">
      <span class="vid-thumb">${thumbHTML(v)}</span>
      <span class="vid-body"><span class="vid-name">${esc(v.name.replace(/\.[^.]+$/, ''))}</span>
      <span class="vid-folder">${esc(v.folder || '')}</span>${why ? `<span class="vid-why">${esc(why)}</span>` : ''}</span></button>`;
  }
  const thumbHTML = (v) => (v.kind === 'url' ? `<span class="small">URL</span>` : `<span data-thumb="${esc(v.key)}">${I.film}</span>${v.duration ? `<span class="vid-dur num">${BCV.fmtDur(v.duration)}</span>` : ''}`);
  function fillThumbs(root) {
    root.querySelectorAll('[data-thumb]').forEach((el) => {
      const v = BCV.byKey[el.dataset.thumb];
      if (!v) return;
      BCV.thumb(v).then((src) => {
        if (src && el.isConnected) {
          el.outerHTML = `<img src="${src}" alt="" loading="lazy">${v.duration ? `<span class="vid-dur num">${BCV.fmtDur(v.duration)}</span>` : ''}`;
        }
      });
    });
  }

  /* ---------- 会話の答え ---------- */
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
  function botHTML(m, idx) {
    const b = m.bot;
    let body = '';
    if (b.type === 'hello') body = helloHTML();
    else if (b.type === 'issue') body = issueHTML(get(b.id), b, idx);
    else if (b.type === 'item') body = itemAnsHTML(get(b.id), b);
    else if (b.type === 'skill') body = skillHTML(b.skill);
    else if (b.type === 'plan') body = planHTML(b, idx);
    else body = noneHTML();
    if (!body) body = noneHTML();
    return `<div class="msg msg-bot" data-i="${idx}"><div class="bot-head">${I.face}コーチ</div><div class="bot-card">${body}</div></div>`;
  }
  const EXAMPLES = ['シュートが入らない', 'ドリブル中にボールを取られる', 'ディフェンスで抜かれる', 'ゾーンを攻略できない', 'リバウンドが取れない', '速攻が出ない', '試合で緊張する', 'うまい子とはじめての子の差が大きい'];
  function helloHTML() {
    const L = BC.lists;
    const groups = Object.entries(BC.GROUPS).map(([g, name]) => `<div class="sec"><h3 class="sec-h">${esc(name)}</h3><div class="chips">${BC.skills.filter((s) => s.group === g).map((s) => `<button type="button" class="chip" data-skill="${s.id}">${esc(s.name)}</button>`).join('')}</div></div>`).join('');
    return `<div class="hello">
      <h1>困っていること・うまくなりたいことを、書いてください</h1>
      <p class="lead-sub">考えられる原因と、見るポイント（改善の視点）、練習メニュー、関係する戦術、手元の解説動画を出します。「60分の練習メニューを作って」のように書くと、練習プランも組みます。</p>
      <div class="stats"><span><b>${L.issue.length}</b>困りごと</span><span><b>${L.view.length}</b>改善の視点</span><span><b>${L.drill.length}</b>練習メニュー</span><span><b>${L.tactic.length}</b>戦術</span><span><b>${BCV.files.length}</b>動画</span></div>
      <div class="sec"><h3 class="sec-h">たとえば</h3><div class="chips">${EXAMPLES.map((t) => `<button type="button" class="chip chip-soft" data-say="${esc(t)}">${esc(t)}</button>`).join('')}<button type="button" class="chip chip-go" data-say="60分の練習メニューを作って">60分の練習メニューを作って</button></div></div>
      ${groups}
    </div>`;
  }
  function issueHTML(it, b, idx, full) {
    if (!it) return '';
    const ctx = b.ctx || {};
    const opt = { n: ctx.n || S.profile.n, level: ctx.level || S.profile.level };
    const { ok, rest } = BC.drillsFor(it, opt);
    const showN = full ? 99 : 4;
    const shown = ok.slice(0, showN);
    const hidden = ok.slice(showN).concat(rest);
    const views = items(it.views);
    const tactics = items(it.tactics);
    const cond = condText(Object.assign({}, S.profile, ctx));
    const vidIds = [it.id, ...views.map((v) => v.id), ...shown.map((d) => d.id), ...tactics.map((t) => t.id)];
    const causes = (it.causes || []).map((c) => `<li><span class="c-text">${md(c.text)}</span>${c.check ? `<span class="c-check">${md(c.check)}</span>` : ''}${(c.views || []).length ? chips(items(c.views)) : ''}</li>`).join('');
    const alts = items(b.alts || []);
    const next = items(it.next || []);
    return `
      ${b.weak ? '<p class="lead-sub">もしかして、これのことですか？</p>' : ''}
      <div class="eyebrow"><span class="k-dot k-issue"></span>困りごと・${esc(skillName(it.skill))}</div>
      <h2 class="issue-title">${esc(it.title)}</h2>
      ${it.empathy ? `<p class="lead">${md(it.empathy)}</p>` : ''}
      <p class="lead-sub">${md(it.summary)}</p>
      ${it.ask && !full ? `<div class="ask"><p>${md(it.ask.q)}</p><div class="chips">${it.ask.options.filter((o) => get(o.to)).map((o) => `<button type="button" class="chip" data-ask="${o.to}" data-label="${esc(o.label)}">${esc(o.label)}</button>`).join('')}</div></div>` : ''}
      ${causes ? `<section class="sec"><h3 class="sec-h">考えられる原因</h3><ul class="causes">${causes}</ul></section>` : ''}
      ${views.length ? `<section class="sec"><h3 class="sec-h">改善の視点<span class="count">見るポイント</span></h3><div class="cards two">${views.slice(0, full ? 99 : 4).map(viewCard).join('')}</div>${!full && views.length > 4 ? `<button type="button" class="more-btn" data-open="${it.id}">ほかの視点も見る（あと${views.length - 4}）</button>` : ''}</section>` : ''}
      <section class="sec"><h3 class="sec-h">おすすめの練習メニュー${cond ? `<span class="count">条件：${esc(cond)}</span>` : ''}</h3>
        ${shown.length ? `<div class="cards">${shown.map(drillCard).join('')}</div>` : '<p class="lead-sub">条件に合う練習が見つかりませんでした。下の「ほかの練習」を見てください。</p>'}
        ${hidden.length ? `<details><summary class="more-btn">ほかの練習（${hidden.length}）${rest.length ? '・条件に合わないものも含む' : ''}</summary><div class="cards" style="margin-top:8px">${hidden.map(drillCard).join('')}</div></details>` : ''}
      </section>
      ${tactics.length ? `<section class="sec"><h3 class="sec-h">関係する戦術</h3>${chips(tactics)}</section>` : ''}
      <section class="sec"><h3 class="sec-h">動画</h3>${videoBlock(vidIds, it.skills, it.title)}</section>
      ${it.tip ? `<p class="tip">${md(it.tip)}</p>` : ''}
      ${full ? '' : `<div class="chips">
        <button type="button" class="chip chip-go" data-plan="${it.id}" data-i="${idx}">この内容で練習プランを作る</button>
        ${next.map((n) => `<button type="button" class="chip" data-ask="${n.id}"><span class="k-dot k-issue"></span>${esc(n.title)}</button>`).join('')}
        ${alts.length ? alts.map((a) => `<button type="button" class="chip chip-ghost" data-ask="${a.id}">もしかして：${esc(labelOf(a))}</button>`).join('') : ''}
      </div>`}`;
  }
  function itemAnsHTML(it, b) {
    if (!it) return '';
    const kindName = BC.KINDS[it.kind_].name;
    const rel = items(b.related || []);
    const alts = items(b.alts || []).filter((x) => x.id !== it.id);
    return `<div class="eyebrow"><span class="k-dot k-${it.kind_}"></span>${esc(kindName)}${it.skills && it.skills[0] ? '・' + esc(skillName(it.skills[0])) : ''}</div>
      <h2 class="issue-title">${esc(labelOf(it))}</h2>
      <p class="lead-sub">${md(it.summary || it.aim || '')}</p>
      ${it.kind_ === 'tactic' && it.diagram ? `<button type="button" class="card" data-open="${it.id}" style="padding:6px;max-width:220px">${BC.courtThumb(it.diagram)}</button>` : ''}
      <div class="chips"><button type="button" class="chip chip-go" data-open="${it.id}">くわしく見る</button>${alts.map((a) => chip(a)).join('')}</div>
      ${rel.length ? `<section class="sec"><h3 class="sec-h">この${esc(kindName)}が役に立つ困りごと</h3><div class="chips">${rel.map((r) => `<button type="button" class="chip" data-ask="${r.id}"><span class="k-dot k-issue"></span>${esc(r.title)}</button>`).join('')}</div></section>` : ''}
      <section class="sec"><h3 class="sec-h">動画</h3>${videoBlock([it.id], it.skills || [], labelOf(it), { max: 3 })}</section>`;
  }
  function skillHTML(sid) {
    const s = BC.skillMap[sid];
    if (!s) return '';
    const iss = BC.lists.issue.filter((i) => i.skill === sid);
    const drills = BC.lists.drill.filter((d) => (d.skills || [])[0] === sid).filter((d) => BC.fits(d, S.profile)).slice(0, 4);
    const views = BC.lists.view.filter((v) => v.skill === sid);
    return `<div class="eyebrow">テーマ</div><h2 class="issue-title">${esc(s.name)}</h2>
      <p class="lead-sub">「${esc(s.name)}」のことですね。いちばん近い困りごとはどれですか？</p>
      ${iss.length ? `<div class="cards">${iss.map(issueCard).join('')}</div>` : ''}
      ${views.length ? `<section class="sec"><h3 class="sec-h">改善の視点</h3>${chips(views)}</section>` : ''}
      ${drills.length ? `<section class="sec"><h3 class="sec-h">練習メニュー</h3><div class="cards">${drills.map(drillCard).join('')}</div></section>` : ''}`;
  }
  function noneHTML() {
    return `<p class="lead">うまく読み取れませんでした。</p>
      <p class="lead-sub">困っている場面を、もう少し具体的に書いてみてください（例：「試合になるとシュートが入らない」「ゾーンをされると攻め方がわからない」「ひとりでできる練習」）。テーマから選ぶこともできます。</p>
      <div class="chips">${BC.skills.map((s) => `<button type="button" class="chip" data-skill="${s.id}">${esc(s.name)}</button>`).join('')}</div>`;
  }
  function planOf(b) {
    const ctx = b.ctx || {};
    return BC.plan({ minutes: b.minutes, n: ctx.n || S.profile.n, level: ctx.level || S.profile.level, focus: b.focus, skills: b.skills });
  }
  function planHTML(b, idx) {
    const p = planOf(b);
    const focus = items(p.focus);
    const ctx = Object.assign({}, S.profile, b.ctx || {});
    let t = 0;
    const blocks = p.blocks.map((bl) => `<div class="plan-block"><div class="plan-block-h">${esc(bl.name)}</div>${bl.items.map((x) => {
      const start = t;
      t += x.min;
      return `<button type="button" class="plan-row" data-open="${x.drill.id}"><span class="plan-time"><span class="num">${Math.floor(start / 60)}:${String(start % 60).padStart(2, '0')}</span><small>${x.min}分</small></span>
        <span><span class="plan-name">${esc(x.drill.name)}</span><br><span class="plan-pt">${md((x.drill.points || [])[0] || x.drill.aim)}</span></span></button>`;
    }).join('')}</div>`).join('');
    const nOpts = [[1, 'ひとり'], [3, '2〜4人'], [8, 'チーム']];
    return `<div class="plan">
      <div class="eyebrow">練習プラン</div>
      <div class="plan-head"><span class="plan-total">${p.minutes}<small>分</small></span><span class="lead-sub">${focus.length ? 'テーマ：' + esc(focus.map((f) => f.title).join('・')) : 'テーマなし（基本をひととおり）'}${condText(ctx) ? '　条件：' + esc(condText(ctx)) : ''}</span></div>
      <div class="chips">
        <div class="seg" role="group" aria-label="時間">${[30, 45, 60, 90, 120].map((m) => `<button type="button" data-planmin="${m}" data-i="${idx}" aria-pressed="${m === p.minutes}">${m}分</button>`).join('')}</div>
        <div class="seg" role="group" aria-label="人数">${nOpts.map(([n, l]) => `<button type="button" data-plann="${n}" data-i="${idx}" aria-pressed="${(ctx.n || 0) === n || (n === 3 && ctx.n > 1 && ctx.n < 5) || (n === 8 && ctx.n >= 5)}">${l}</button>`).join('')}</div>
      </div>
      ${blocks || '<p class="lead-sub">条件に合う練習が見つかりませんでした。人数やレベルの条件をゆるめてみてください。</p>'}
      <p class="lead-sub">メニューを押すと、手順とポイントが見られます。${focus.length ? '' : '困りごとを書いてから「この内容で練習プランを作る」を押すと、それに合わせて組みます。'}</p>
      <div class="chips"><button type="button" class="chip chip-go" data-pledit="${idx}">プランの画面で直す・保存・タイマー</button><button type="button" class="chip chip-soft" data-copyplan="${idx}">テキストでコピー（LINE などに貼れる）</button></div>
    </div>`;
  }

  /* ---------- 画面：会話 ---------- */
  function renderChat() {
    if (!S.log.length) S.log.push({ bot: { type: 'hello' } });
    const html = S.log.map((m, i) => (m.me != null ? `<div class="msg msg-me" data-i="${i}"><div class="bubble-me">${esc(m.me)}</div></div>` : botHTML(m, i))).join('');
    const main = document.getElementById('main');
    main.className = '';
    main.innerHTML = `<div class="log">${html}</div>${S.log.length > 1 ? '<button type="button" class="reset" data-act="clear">会話をはじめからにする</button>' : ''}`;
    fillThumbs(main);
  }
  function scrollToMsg(i) {
    const el = document.querySelector(`.msg[data-i="${i}"]`);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - (document.querySelector('.top').offsetHeight + 12);
    window.scrollTo({ top: Math.max(0, y), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }
  function push(me, bot) {
    if (S.tab !== 'chat') { try { history.pushState(null, '', '#chat'); } catch (e) { /* なくてもよい */ } setTab('chat'); }
    S.log.push({ me });
    S.log.push({ bot });
    if (bot.type === 'issue') S.lastIssue = bot.id;
    saveLog();
    if (S.tab === 'chat') renderChat();
    const i = S.log.length - 2;
    requestAnimationFrame(() => scrollToMsg(i));
  }
  function send(text) {
    text = String(text || '').trim();
    if (!text) return;
    const ans = BC.answer(text, { profile: S.profile, lastIssue: S.lastIssue || lastIssueInLog() });
    push(text, serialize(ans));
  }
  const lastIssueInLog = () => { for (let i = S.log.length - 1; i >= 0; i--) if (S.log[i].bot && S.log[i].bot.type === 'issue') return S.log[i].bot.id; return null; };

  /* ---------- 画面：図鑑 ---------- */
  function libResults() {
    const q = S.lib.q.trim();
    if (q) {
      const n = BC.norm(q);
      const hits = BC.search(q).map((h) => h.item);
      const extra = BC.all().filter((it) => !hits.includes(it) && BC.norm([labelOf(it), ...(it.alias || []), ...(it.words || []), it.summary || '', it.aim || '', it.cue || ''].join(' ')).includes(n));
      return hits.concat(extra);
    }
    if (S.lib.kind === 'fav') return BC.all().filter((it) => S.favs.has(it.id));
    return BC.lists[S.lib.kind].filter((it) => !S.lib.skill || (it.skills || []).includes(S.lib.skill));
  }
  function libListHTML() {
    const res = libResults();
    let list = '';
    if (S.lib.q.trim() || S.lib.kind === 'fav') {
      list = res.length ? `<p class="lib-count">${res.length}件</p><div class="rows">${res.slice(0, 80).map(cardOf).join('')}</div>` : `<p class="lead-sub">${S.lib.kind === 'fav' && !S.lib.q ? '練習メニューや戦術のシートで ☆ を押すと、ここに集まります。' : '見つかりませんでした。ほかの言葉で探してみてください。'}</p>`;
    } else if (S.lib.kind === 'tactic') {
      list = Object.entries(BC.TCATS).map(([c, name]) => {
        const ts = res.filter((t) => t.cat === c);
        return ts.length ? `<h2 class="group-h">${esc(name)}（${ts.length}）</h2><div class="rows">${ts.map(tacticCard).join('')}</div>` : '';
      }).join('');
    } else {
      list = BC.skills.map((s) => {
        const xs = res.filter((it) => (it.skills || [])[0] === s.id);
        return xs.length ? `<h2 class="group-h">${esc(s.name)}（${xs.length}）</h2><div class="rows">${xs.map(cardOf).join('')}</div>` : '';
      }).join('');
    }
    return list;
  }
  function libFilters() {
    const L = BC.lists;
    const kinds = [['issue', '困りごと', L.issue.length], ['view', '改善の視点', L.view.length], ['drill', '練習メニュー', L.drill.length], ['tactic', '戦術', L.tactic.length], ['fav', '★ お気に入り', S.favs.size]];
    return `<div class="kinds" role="tablist">${kinds.map(([k, name, n]) => `<button type="button" class="chip" data-libkind="${k}" aria-pressed="${S.lib.kind === k && !S.lib.q}">${esc(name)} <small>${n}</small></button>`).join('')}</div>
      ${!S.lib.q && S.lib.kind !== 'fav' && S.lib.kind !== 'tactic' ? `<div class="kinds"><button type="button" class="chip" data-libskill="" aria-pressed="${!S.lib.skill}">すべてのテーマ</button>${BC.skills.map((s) => `<button type="button" class="chip" data-libskill="${s.id}" aria-pressed="${S.lib.skill === s.id}">${esc(s.name)}</button>`).join('')}</div>` : ''}`;
  }
  function renderLibList() {
    const f = document.getElementById('lib-filters'), l = document.getElementById('lib-list');
    if (!f || !l) return renderLibrary();
    f.innerHTML = libFilters();
    l.innerHTML = libListHTML();
  }
  function renderLibrary() {
    const main = document.getElementById('main');
    main.className = 'no-composer';
    main.innerHTML = `<h1 class="page-h">図鑑</h1>
      <p class="page-lead">困りごと・改善の視点・練習メニュー・戦術を、テーマごとに。押すと中身が開きます。</p>
      <div class="search">${I.search}<input id="lib-q" type="search" placeholder="ことばで探す（例：ボックスアウト、ゾーン、ひとり）" value="${esc(S.lib.q)}" autocomplete="off"></div>
      <div id="lib-filters">${libFilters()}</div>
      <div id="lib-list">${libListHTML()}</div>`;
  }

  /* ---------- 画面：動画 ---------- */
  function vidList() {
    const q = BC.norm(S.vid.q);
    return BCV.files.filter((v) => {
      const t = BCV.tags(v);
      if (S.vid.filter === 'none' && t.items.length) return false;
      if (S.vid.filter === 'manual' && !BCV.links[v.key]) return false;
      if (q && !BC.norm(v.key + ' ' + v.name + ' ' + t.items.map((x) => labelOf(get(x.id) || {})).join(' ')).includes(q)) return false;
      return true;
    });
  }
  function vidListHTML() {
    const list = vidList();
    const rows = list.slice(0, S.vid.limit).map((v) => {
      const t = BCV.tags(v);
      const tags = t.items.slice(0, 6).map((x) => { const it = get(x.id); return it ? `<span class="tag${x.manual ? ' manual' : ''}"><span class="k-dot k-${it.kind_}"></span>${esc(labelOf(it))}</span>` : ''; }).join('') +
        (t.items.length > 6 ? `<span class="tag">ほか${t.items.length - 6}</span>` : '') +
        (!t.items.length ? (t.skills.length ? t.skills.slice(0, 3).map((s) => `<span class="tag none">テーマ：${esc(skillName(s))}</span>`).join('') : '<span class="tag none">紐付けなし</span>') : '');
      return `<div class="vrow"><button type="button" class="vid" data-play="${esc(v.key)}" style="border:0"><span class="vid-thumb">${thumbHTML(v)}</span></button>
        <div class="vrow-body"><button type="button" class="vrow-name" data-play="${esc(v.key)}">${esc(v.name)}</button>
        <span class="vid-folder">${esc(v.folder || '')}${!BCV.playable(v) ? '・このブラウザでは再生できない形式かもしれません' : ''}</span>
        <div class="tagchips">${tags}</div></div></div>`;
    }).join('');
    return `<div class="kinds">${[['all', 'すべて'], ['none', '紐付けなし'], ['manual', '手で直したもの']].map(([k, l]) => `<button type="button" class="chip" data-vidfilter="${k}" aria-pressed="${S.vid.filter === k}">${l}</button>`).join('')}</div>
        <p class="lib-count">${list.length}本</p>
        <div>${rows}</div>
        ${list.length > S.vid.limit ? `<button type="button" class="btn" data-act="vid-more" style="margin-top:10px">もっと見る（あと${list.length - S.vid.limit}）</button>` : ''}`;
  }
  function renderVidList() {
    const el = document.getElementById('vid-list');
    if (!el) return renderVideos();
    el.innerHTML = vidListHTML();
    fillThumbs(el);
  }
  function renderVideos() {
    const c = BCV.count();
    const main = document.getElementById('main');
    main.className = 'no-composer';
    main.innerHTML = `<h1 class="page-h">動画</h1>
      <p class="page-lead">手元のバスケ解説動画のフォルダをつなぐと、フォルダ名とファイル名から、困りごと・視点・練習・戦術に自動で紐付けます。動画はこの端末の中だけで扱い、どこにも送りません。</p>
      <div style="display:flex;flex-direction:column;gap:12px">
      <section class="panel">
        <p class="status">${c.files ? `つないだフォルダ：<b>${esc(BCV.dirName)}</b>・動画 <b class="num">${c.files}</b> 本（紐付けあり <b class="num">${c.linked}</b> 本）` : 'まだ動画フォルダをつないでいません。'}</p>
        <div class="btns">
          <button type="button" class="btn btn-go" data-act="pick-folder">${c.files ? 'ほかのフォルダを選ぶ' : '動画フォルダを選ぶ'}</button>
          ${BCV.saved && !c.files ? `<button type="button" class="btn" data-act="reconnect">前のフォルダ「${esc(BCV.saved.name)}」につなぐ</button>` : ''}
          <button type="button" class="btn" data-act="pick-files">動画ファイルを選ぶ（スマホ）</button>
        </div>
        <p class="small">${BCV.canPickDir ? 'このブラウザでは、次からは「前のフォルダにつなぐ」を押すだけで開けます。' : 'このブラウザでは、ページを開くたびにフォルダを選びなおします（Chrome・Edge のパソコンなら、次から1回でつながります）。'}サブフォルダの中も探します。</p>
      </section>
      <details class="panel"><summary class="panel-h">自動で紐付くファイル名のつけ方</summary>
        <p class="small">フォルダ名とファイル名に、困りごと・視点・練習メニュー・戦術の<b>名前か別名</b>が入っていると紐付きます。テーマの言葉（シュート・ドリブル・リバウンドなど）だけのときは「同じテーマ」として出ます。</p>
        <ul class="d-list small"><li>シュート/フォームシューティング.mp4 → 練習「フォームシューティング」</li><li>練習メニュー/マイカンドリル 左右交互.mov → 練習「マイカンドリル」</li><li>戦術/ピック&ロールの守り方.mp4 → 戦術「ピック＆ロールの守り方」</li><li>2-3ゾーン 攻略.mp4 → 戦術「2-3ゾーン」</li></ul>
        <p class="small">合わないものは、動画を開いて「紐付けを直す」で外したり足したりできます。</p></details>
      ${BCV.files.length ? `<section>
        <div class="search">${I.search}<input id="vid-q" type="search" placeholder="動画の名前・紐付けで探す" value="${esc(S.vid.q)}" autocomplete="off"></div>
        <div id="vid-list">${vidListHTML()}</div>
      </section>` : ''}
      <details class="panel"><summary class="panel-h">URL の動画を足す（YouTube など）</summary>
        <p class="small">題名に練習や戦術の名前が入っていると、自動で紐付きます。押すと新しいタブで開きます。</p>
        <label class="field">題名<input id="url-title" type="text" placeholder="例：マイカンドリルのやり方"></label>
        <label class="field">URL<input id="url-url" type="url" placeholder="https://"></label>
        <div class="btns"><button type="button" class="btn" data-act="add-url">足す</button></div></details>
      <details class="panel"><summary class="panel-h">紐付けを残す・ほかの端末へ移す</summary>
        <p class="small">手で直した紐付けは、この端末のブラウザに残ります。ほかの端末やブラウザで使うときは、書き出して読みこみます。動画フォルダのいちばん上に <b>basket-coach-links.json</b> という名前で置くと、フォルダをつないだときに自動で読みこみます。</p>
        <div class="btns">
          <button type="button" class="btn" data-act="export-copy">書き出す（コピー）</button>
          <button type="button" class="btn" data-act="export-file">ファイルに保存</button>
          ${BCV.dirHandle ? '<button type="button" class="btn" data-act="export-folder">動画フォルダに保存</button>' : ''}
        </div>
        <label class="field">読みこむ（書き出した文字を貼る）<textarea id="import-text" placeholder='{"app":"basket-coach", …}'></textarea></label>
        <div class="btns"><button type="button" class="btn" data-act="import">読みこむ</button></div></details>
      </div>`;
    fillThumbs(main);
  }

  /* ---------- シート ---------- */
  function sec(title, inner) { return inner ? `<section class="d-sec"><h3>${esc(title)}</h3>${inner}</section>` : ''; }
  const ul = (xs, cls = '') => (xs && xs.length ? `<ul class="d-list ${cls}">${xs.map((x) => `<li>${md(x)}</li>`).join('')}</ul>` : '');
  const ol = (xs) => (xs && xs.length ? `<ol class="d-list steps">${xs.map((x) => `<li><span>${md(x)}</span></li>`).join('')}</ol>` : '');
  const ngRows = (xs) => (xs && xs.length ? `<div class="ng">${xs.map(([a, b]) => `<div class="ng-row"><div class="bad">${md(a)}</div><div class="fix">${md(b)}</div></div>`).join('')}</div>` : '');
  function backIssues(it) {
    const iss = BC.backlinks(it.id).filter((x) => x.kind_ === 'issue');
    return iss.length ? `<div class="chips">${iss.map((r) => `<button type="button" class="chip" data-ask="${r.id}"><span class="k-dot k-issue"></span>${esc(r.title)}</button>`).join('')}</div>` : '';
  }
  function sheetHTML(it) {
    const k = it.kind_;
    const head = `<div class="eyebrow"><span class="k-dot k-${k}"></span>${esc(BC.KINDS[k].name)}${(it.skills || [])[0] ? '・' + esc(skillName(it.skills[0])) : ''}</div>
      <h2 class="d-title">${esc(labelOf(it))}</h2>${(it.alias || []).length ? `<p class="d-alias">別名：${esc(it.alias.join('、'))}</p>` : ''}`;
    const vids = sec('動画', videoBlock([it.id], it.skills || [], labelOf(it), { max: 6 }) + (BCV.files.length ? `<div class="chips"><button type="button" class="chip" data-act="link-here" data-id="${it.id}">この${esc(BC.KINDS[k].name)}に動画を紐付ける</button></div><div id="link-here"></div>` : ''));
    if (k === 'issue') {
      return head.replace(/<h2 class="d-title">/, '<h2 class="d-title">') + `<div class="bot-card" style="border:0;padding:0">${issueHTML(it, { ctx: {} }, -1, true).replace(/<div class="eyebrow">[\s\S]*?<\/h2>/, '')}</div>
        <div class="chips"><button type="button" class="chip chip-go" data-ask="${it.id}">この困りごとをチャットで相談する</button><button type="button" class="chip" data-plan="${it.id}">練習プランを作る</button></div>
        ${sec('つぎに見るとよい困りごと', items(it.next).length ? `<div class="chips">${items(it.next).map((n) => `<button type="button" class="chip" data-ask="${n.id}"><span class="k-dot k-issue"></span>${esc(n.title)}</button>`).join('')}</div>` : '')}`;
    }
    if (k === 'drill') {
      const facts = [['人数', it.n === 1 ? 'ひとりでできる' : `<span class="num">${it.n}</span>人から`], ['時間', `<span class="num">${it.minutes}</span>分`], ['場所', esc(BC.PLACES[it.place] || '')], ['レベル', esc(BC.LEVELS[it.level] || '')], ['きつさ', '●'.repeat(it.intensity) + '<span style="opacity:.3">' + '●'.repeat(3 - it.intensity) + '</span>'], ['種類', esc(BC.PHASES[it.phase] || '')]];
      return `${head}
        <p class="d-summary">${md(it.aim)}</p>
        <dl class="facts">${facts.map(([a, b]) => `<div><dt>${a}</dt><dd>${b}</dd></div>`).join('')}</dl>
        ${(it.equip || []).length ? `<p class="lead-sub">用具：${esc(it.equip.join('、'))}</p>` : ''}
        ${BC.motionFor(it.id) ? sec('動き（棒人間）', '<div data-anim></div>') : ''}
        ${it.diagram ? '<div data-court></div>' : ''}
        ${sec('準備・並び方', it.setup ? `<p style="margin:0">${md(it.setup)}</p>` : '')}
        ${sec('進め方', ol(it.steps))}
        ${sec('ポイント', ul(it.points))}
        ${sec('よくある失敗と直し方', ngRows(it.ng))}
        ${(it.easier || []).length || (it.harder || []).length ? `<div class="pair">${(it.easier || []).length ? `<div class="box good"><h4>やさしくするには</h4>${ul(it.easier).replace('d-list ', '')}</div>` : ''}${(it.harder || []).length ? `<div class="box weak"><h4>むずかしくするには</h4>${ul(it.harder).replace('d-list ', '')}</div>` : ''}</div>` : ''}
        ${sec('改善の視点', chips(items(it.views)))}
        ${sec('関係する戦術', chips(items(it.tactics)))}
        ${sec('この練習が役に立つ困りごと', backIssues(it))}
        ${vids}`;
    }
    if (k === 'view') {
      return `${head}
        ${it.cue ? `<p class="cue-big">「${esc(it.cue)}」</p>` : ''}
        <p class="d-summary">${md(it.summary)}</p>
        ${BC.motionFor(it.id) ? sec('動き（棒人間）', '<div data-anim></div>') : ''}
        ${sec('見るポイント', ul(it.checks, 'check'))}
        ${it.good ? `<div class="box good"><h4>うまくいっているとき</h4><p style="margin:0;font-size:var(--fs-s)">${md(it.good)}</p></div>` : ''}
        ${sec('よくある崩れと直し方', ngRows(it.ng))}
        ${sec('この視点を直す練習', items(it.drills).length ? `<div class="cards">${items(it.drills).map(drillCard).join('')}</div>` : '')}
        ${sec('この視点が役に立つ困りごと', backIssues(it))}
        ${vids}`;
    }
    // 戦術
    const facts = [['分類', esc(BC.TCATS[it.cat] || '')], ['種類', esc(it.kind || '')], ['レベル', esc(BC.LEVELS[it.level] || '')]];
    return `${head}
      <dl class="facts">${facts.map(([a, b]) => `<div><dt>${a}</dt><dd>${b}</dd></div>`).join('')}</dl>
      <p class="d-summary">${md(it.summary)}</p>
      ${it.diagram ? '<div data-court></div>' : ''}
      ${sec('動き方', ol(it.how))}
      ${sec('成功のポイント', ul(it.points))}
      ${(it.good || []).length || (it.weak || []).length ? `<div class="pair">${(it.good || []).length ? `<div class="box good"><h4>強み・向いているチーム</h4>${ul(it.good).replace('d-list ', '')}</div>` : ''}${(it.weak || []).length ? `<div class="box weak"><h4>弱み・気をつけること</h4>${ul(it.weak).replace('d-list ', '')}</div>` : ''}</div>` : ''}
      ${sec(it.cat === 'defense' ? 'この守りをされたら（攻め方）' : '相手にされたら・対策', ul(it.counter))}
      ${it.note ? `<p class="note">${md(it.note)}</p>` : ''}
      ${sec('練習メニュー', items(it.drills).length ? `<div class="cards">${items(it.drills).map(drillCard).join('')}</div>` : '')}
      ${sec('改善の視点', chips(items(it.views)))}
      ${sec('関連する戦術', chips(items(it.related)))}
      ${sec('この戦術が役に立つ困りごと', backIssues(it))}
      ${vids}`;
  }
  function openSheet(html, bar) {
    closeSheetDom();
    document.body.classList.add('sheet-open');
    const back = document.createElement('div');
    back.className = 'sheet-back';
    back.dataset.act = 'close';
    const sh = document.createElement('div');
    sh.className = 'sheet';
    sh.setAttribute('role', 'dialog');
    sh.setAttribute('aria-modal', 'true');
    sh.innerHTML = `<div class="sheet-bar">${bar}<div class="right">${S.sheet && BC.get(S.sheet) ? `<button type="button" class="icon-btn" data-act="fav" aria-pressed="${S.favs.has(S.sheet)}" aria-label="お気に入り">${S.favs.has(S.sheet) ? I.starOn : I.star}</button>` : ''}<button type="button" class="icon-btn" data-act="close" aria-label="閉じる">${I.close}</button></div></div><div class="sheet-body">${html}</div>`;
    document.body.append(back, sh);
    const cv = sh.querySelector('[data-court]');
    const it = S.sheet && BC.get(S.sheet);
    if (cv && it && it.diagram) BC.court(cv, it.diagram, { label: labelOf(it) });
    const an = sh.querySelector('[data-anim]');
    if (an && it && BC.motionFor(it.id)) BC.anim(an, BC.motionFor(it.id));
    fillThumbs(sh);
    sh.querySelector('.sheet-body').scrollTop = 0;
    setTimeout(() => { const b = sh.querySelector('[data-act="close"]'); if (b && !matchMedia('(min-width: 900px)').matches) b.focus({ preventScroll: true }); }, 0);
  }
  function closeSheetDom() {
    document.querySelectorAll('.sheet, .sheet-back').forEach((e) => e.remove());
    document.body.classList.remove('sheet-open');
  }
  function showItem(id) {
    const it = get(id);
    if (!it) return false;
    S.sheet = id;
    openSheet(sheetHTML(it), `<span class="kind"><span class="k-dot k-${it.kind_}"></span>${esc(BC.KINDS[it.kind_].name)}</span>`);
    return true;
  }
  function closeSheet() {
    const was = S.sheet;
    S.sheet = null;
    closeSheetDom();
    document.querySelectorAll('.run.run-hide').forEach((r) => r.classList.remove('run-hide'));
    if (was && location.hash.slice(1) === was) {
      try { history.replaceState(null, '', '#' + S.tab); } catch (e) { location.hash = S.tab; }
    }
  }
  // 動画を見るシート
  async function showVideo(key) {
    const v = BCV.byKey[key];
    if (!v) return;
    S.sheet = null;
    S.video = key;
    const t = BCV.tags(v);
    const tagList = t.items.map((x) => { const it = get(x.id); return it ? `<span class="chip k-${it.kind_}" style="padding-right:4px"><button type="button" style="border:0;background:none;padding:0;display:inline-flex;align-items:center;gap:6px" data-open="${it.id}"><span class="k-dot"></span>${esc(labelOf(it))}</button><button type="button" class="icon-btn" style="width:24px;height:24px" data-unlink="${it.id}" aria-label="紐付けを外す">${I.close}</button></span>` : ''; }).join('');
    const player = v.kind === 'url'
      ? `<p><a class="btn btn-go" href="${esc(v.url)}" target="_blank" rel="noopener">開く ↗</a></p><p class="small">${esc(v.url)}</p>`
      : BCV.playable(v) ? '<video class="player" controls playsinline preload="metadata"></video>' : '<p class="note">このブラウザでは再生できない形式かもしれません（MP4 にすると確実です）。</p><video class="player" controls playsinline preload="metadata"></video>';
    openSheet(`<h2 class="d-title" style="font-size:var(--fs-xl)">${esc(v.name)}</h2>
      ${v.folder ? `<p class="d-alias">${esc(v.folder)}</p>` : ''}
      ${player}
      <section class="d-sec"><h3>紐付いている項目</h3>${tagList ? `<div class="chips">${tagList}</div>` : '<p class="lead-sub" style="margin:0">まだありません。</p>'}
        ${t.removed.length ? `<p class="small">外した自動の紐付け：${t.removed.map((id) => `<button type="button" class="chip chip-ghost" data-relink="${id}">${esc(labelOf(get(id) || {}))} を戻す</button>`).join(' ')}</p>` : ''}</section>
      <section class="d-sec"><h3>紐付けを直す</h3>
        <div class="search">${I.search}<input id="link-q" type="search" placeholder="困りごと・練習・戦術の名前で探す" autocomplete="off"></div>
        <div id="link-res" class="rows"></div></section>
      ${v.kind === 'url' ? `<div class="btns"><button type="button" class="btn" data-act="del-url" data-key="${esc(v.key)}">この URL を一覧から消す</button></div>` : ''}`,
      `<span class="kind">${I.film.replace('<svg', '<svg width="16" height="16"')}動画</span>`);
    if (v.kind === 'file') {
      const el = document.querySelector('.sheet video');
      if (el) {
        const src = await BCV.src(v);
        if (src) { el.src = src; el.addEventListener('loadedmetadata', () => { v.duration = el.duration; }, { once: true }); }
      }
    }
    linkSearch('');
  }
  function linkSearch(q) {
    const box = document.getElementById('link-res');
    if (!box) return;
    const v = BCV.byKey[S.video];
    if (!v) return;
    const has = new Set(BCV.tags(v).items.map((x) => x.id));
    let res = q.trim() ? BC.search(q).map((h) => h.item) : [];
    if (q.trim() && res.length < 8) {
      const n = BC.norm(q);
      res = res.concat(BC.all().filter((it) => !res.includes(it) && BC.norm(labelOf(it) + (it.alias || []).join('')).includes(n)));
    }
    box.innerHTML = res.slice(0, 10).map((it) => `<button type="button" class="card k-${it.kind_}" data-${has.has(it.id) ? 'unlink' : 'link'}="${it.id}"><span class="card-h"><span class="k-dot"></span><span>${esc(labelOf(it))}</span><span class="star">${has.has(it.id) ? '外す' : '＋ 紐付ける'}</span></span><span class="meta"><span>${esc(BC.KINDS[it.kind_].name)}</span></span></button>`).join('') || (q.trim() ? '<p class="small">見つかりません。</p>' : '<p class="small">名前を入れると、候補が出ます。</p>');
  }
  // 項目のシートの中で、その項目に動画を紐付ける
  function linkHere(id) {
    const box = document.getElementById('link-here');
    if (!box) return;
    const q = (document.getElementById('lh-q') || {}).value || '';
    const n = BC.norm(q);
    const list = BCV.files.filter((v) => !n || BC.norm(v.key).includes(n)).slice(0, 30);
    box.innerHTML = `<div class="search" style="margin-top:8px">${I.search}<input id="lh-q" type="search" placeholder="動画の名前で探す" value="${esc(q)}" autocomplete="off" data-id="${id}"></div>
      <div class="rows">${list.map((v) => { const on = BCV.tags(v).items.some((x) => x.id === id); return `<button type="button" class="card" data-lh="${esc(v.key)}" data-id="${id}" data-on="${on ? 1 : 0}"><span class="card-h"><span>${esc(v.name)}</span><span class="star">${on ? '外す' : '＋ 紐付ける'}</span></span><span class="meta"><span>${esc(v.folder || '')}</span></span></button>`; }).join('')}</div>`;
  }

  // 条件のシート
  function showCond() {
    S.sheet = null;
    const p = S.profile;
    const row = (key, label, opts) => `<div class="cond-row"><span>${label}</span><div class="chips">${opts.map(([v, l]) => `<button type="button" class="chip" data-cond="${key}" data-v="${v}" aria-pressed="${String(p[key] || '') === String(v)}">${l}</button>`).join('')}</div></div>`;
    openSheet(`<div class="cond"><h2 class="d-title" style="font-size:var(--fs-xl)">条件</h2>
      <p class="lead-sub" style="margin:0">練習メニューは、この条件に合うものを先に出します。チャットの文に「ひとりで」「ミニバス」「中学」などと書くと、その回だけ条件が変わります。</p>
      ${row('who', 'だれが使う？', [['player', '選手'], ['coach', '指導者・保護者'], ['', '決めない']])}
      ${row('level', 'レベル', [[1, 'はじめて・ミニバス'], [2, '中学・高校'], [3, '上級'], ['', '決めない']])}
      ${row('n', '練習する人数', [[1, 'ひとり'], [3, '2〜4人'], [8, '5人以上（チーム）'], ['', '決めない']])}
      <p class="small">条件と会話・お気に入り・動画の紐付けは、この端末のブラウザの中だけに残ります。</p>
      <div class="btns"><button type="button" class="btn" data-act="clear">会話をはじめからにする</button></div></div>`, '<span class="kind">条件</span>');
  }

  /* ---------- 画面：練習プラン ----------
     PL：いま作っているプラン（条件とデータ）。plans：保存したプラン。どちらもこの端末（localStorage）に残す。 */
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
    const seg = (key, opts) => `<div class="seg" role="group">${opts.map(([v, l]) => `<button type="button" data-plc="${key}" data-v="${v}" aria-pressed="${String(PL[key] == null ? '' : PL[key]) === String(v)}">${l}</button>`).join('')}</div>`;
    const themes = PL.focus.map(get).filter(Boolean).map((i) => `<span class="chip chip-soft"><span class="k-dot k-issue"></span>${esc(i.title)}<button type="button" class="chip-x" data-plthdel="${i.id}" aria-label="${esc(i.title)}を外す">×</button></span>`)
      .concat(PL.skills.map((sid) => `<span class="chip chip-soft">${esc(skillName(sid))}<button type="button" class="chip-x" data-plthdel="s:${sid}" aria-label="外す">×</button></span>`)).join('');
    return `<section class="panel">
      <div class="cond-row"><span>テーマ（困りごと・技能）</span><div class="chips">${themes || '<span class="small">なし（基本をひととおり入れます）</span>'}</div>
        <div class="search">${I.search}<input id="pl-q" type="search" placeholder="テーマを足す（例：シュート、ゾーン、緊張）" autocomplete="off"></div>
        <div id="pl-sug" class="chips">${plSugHTML('')}</div></div>
      <div class="cond-row"><span>時間</span>${seg('minutes', [[30, '30分'], [45, '45分'], [60, '60分'], [90, '90分'], [120, '120分']])}</div>
      <div class="cond-row"><span>人数</span>${seg('n', [[1, 'ひとり'], [3, '2〜4人'], [8, '5人以上'], ['', '決めない']])}</div>
      <div class="cond-row"><span>レベル</span>${seg('level', [[1, 'はじめて・ミニバス'], [2, '中学・高校'], [3, '上級'], ['', '決めない']])}</div>
      <div class="cond-row"><span>場所</span>${seg('place', [['', '体育館'], ['hoop', 'ゴール1つ'], ['any', '家（ゴールなし）']])}</div>
      <div class="btns"><button type="button" class="btn btn-go" data-pl="make">${PL.data ? 'この条件で作り直す' : 'プランを作る'}</button></div>
    </section>`;
  }
  function plSugHTML(q) {
    let list = [];
    if (q.trim()) {
      const sk = BC.skills.filter((x) => BC.norm(x.name + (x.words || []).join(' ')).includes(BC.norm(q)) || BC.skillsIn(q).includes(x));
      list = sk.filter((x) => !PL.skills.includes(x.id)).slice(0, 3).map((x) => `<button type="button" class="chip" data-plthadd="s:${x.id}">＋ ${esc(x.name)}（テーマ）</button>`);
      list = list.concat(BC.search(q, { kinds: ['issue'] }).filter((h) => !PL.focus.includes(h.item.id)).slice(0, 6).map((h) => `<button type="button" class="chip" data-plthadd="${h.item.id}"><span class="k-dot k-issue"></span>＋ ${esc(h.item.title)}</button>`));
    } else {
      list = ['i-shoot-miss', 'i-drb-stolen', 'i-def-beat', 'i-reb-lose', 'i-fb-none', 'i-pass-steal'].filter((id) => get(id) && !PL.focus.includes(id)).map((id) => `<button type="button" class="chip" data-plthadd="${id}"><span class="k-dot k-issue"></span>＋ ${esc(get(id).title)}</button>`);
    }
    return list.join('') || '<span class="small">見つかりません</span>';
  }
  function plPickerHTML(key) {
    const q = (document.getElementById('pl-pq') || {}).value || '';
    const n = BC.norm(q);
    const list = BC.planAlternatives(PL.data, key, null).filter((d) => !n || BC.norm(d.name + (d.alias || []).join('') + (d.words || []).join('')).includes(n)).slice(0, 12);
    return `<div class="pl-pick"><div class="search">${I.search}<input id="pl-pq" type="search" placeholder="練習メニューを探す" value="${esc(q)}" autocomplete="off" data-b="${key}"></div>
      <div class="rows">${list.map((d) => `<button type="button" class="card" data-pl="pick" data-b="${key}" data-id="${d.id}"><span class="card-h"><span class="k-dot k-drill"></span><span>${esc(d.name)}</span><span class="star">＋ 足す</span></span><span class="meta">${people(d)}<span class="num">${d.minutes}分</span>${lv(d.level)}</span></button>`).join('') || '<p class="small">条件に合う練習が見つかりません。</p>'}</div></div>`;
  }
  function plPlanHTML() {
    const data = PL.data;
    if (!data) return `<section class="panel"><p class="lead-sub">テーマと条件を選んで「プランを作る」を押すと、ウォームアップからしめくくりまで組みます。チャットで作ったプランも、ここで直せます。</p></section>`;
    const total = plTotal(data);
    let t = 0;
    const blocks = data.blocks.map((b) => {
      const sum = b.items.reduce((u, x) => u + x.min, 0);
      const rows = b.items.map((x, i) => {
        const d = get(x.id);
        if (!d) return '';
        const start = t;
        t += x.min;
        const at = `data-b="${b.key}" data-i="${i}"`;
        return `<div class="pl-row">
          <button type="button" class="pl-main" data-open="${d.id}"><span class="plan-time"><span class="num">${fmt(start)}</span></span>
            <span class="pl-text"><span class="plan-name">${esc(d.name)}${BC.motionFor(d.id) ? ' <span class="badge">動き</span>' : ''}</span><span class="plan-pt">${md((d.points || [])[0] || d.aim)}</span></span></button>
          <div class="pl-ctl">
            <button type="button" class="ib" data-pl="minus" ${at} aria-label="1分へらす">−</button><span class="num pl-min">${x.min}分</span><button type="button" class="ib" data-pl="plus" ${at} aria-label="1分ふやす">＋</button>
            <span class="pl-sp"></span>
            <button type="button" class="ib" data-pl="swap" ${at} aria-label="ほかのメニューに入れかえる" title="入れかえる">↻</button>
            <button type="button" class="ib" data-pl="up" ${at} aria-label="上へ">↑</button><button type="button" class="ib" data-pl="down" ${at} aria-label="下へ">↓</button>
            <button type="button" class="ib" data-pl="del" ${at} aria-label="外す">×</button>
          </div></div>`;
      }).join('');
      return `<div class="plan-block"><div class="plan-block-h"><span>${esc(b.name)}</span><span class="num">${sum}分</span></div>${rows}
        <button type="button" class="more-btn" data-pl="add" data-b="${b.key}">${plPick === b.key ? '閉じる' : '＋ メニューを足す'}</button>${plPick === b.key ? plPickerHTML(b.key) : ''}</div>`;
    }).join('');
    const cond = condText({ n: data.n, level: data.level }) + (data.place === 'any' ? '・家' : data.place === 'hoop' ? '・ゴール1つ' : '');
    return `<section class="panel plan">
      <div class="plan-head"><span class="plan-total">${total}<small>分</small></span><span class="lead-sub">テーマ：${esc(plTheme(data))}${cond ? '　条件：' + esc(cond) : ''}${total !== data.minutes ? `　（予定 ${data.minutes}分）` : ''}</span></div>
      <div class="btns"><button type="button" class="btn btn-go" data-pl="run">▶ 練習をはじめる（タイマー）</button></div>
      ${blocks}
      <p class="small">↻ で同じ種類のほかのメニューに入れかえ、− ＋ で時間を変えられます。メニューを押すと、手順と動きが見られます。</p>
      <label class="field">名前<input id="pl-name" type="text" value="${esc(PL.name || plName(data))}"></label>
      <div class="btns"><button type="button" class="btn" data-pl="save">保存する</button><button type="button" class="btn" data-pl="copy">テキストでコピー</button></div>
    </section>`;
  }
  function plSavedHTML() {
    if (!plans.length) return '';
    return `<section class="panel"><h2 class="panel-h">保存したプラン</h2><div class="rows">${plans.map((p) => `<div class="card pl-saved">
      <span class="card-h"><span>${esc(p.name)}</span></span>
      <span class="meta"><span class="num">${plTotal(p.data)}分</span><span>${esc(plTheme(p.data))}</span><span>${esc(new Date(p.saved).toLocaleDateString('ja-JP'))}</span></span>
      <span class="btns"><button type="button" class="btn" data-pl="open" data-id="${p.id}">開く</button><button type="button" class="btn" data-pl="run-saved" data-id="${p.id}">▶ はじめる</button><button type="button" class="btn" data-pl="rm" data-id="${p.id}">${plDel === p.id ? 'もう一度押すと消えます' : '消す'}</button></span></div>`).join('')}</div></section>`;
  }
  function renderPlan() {
    const main = document.getElementById('main');
    main.className = 'no-composer';
    main.innerHTML = `<h1 class="page-h">練習プラン</h1>
      <p class="page-lead">テーマと条件を選ぶと、ウォームアップ → 技術 → 対人・ゲーム → しめくくり の順に組みます。入れかえ・時間の調整・保存ができ、タイマーで練習を進められます。</p>
      <div style="display:flex;flex-direction:column;gap:12px"><div id="pl-cond">${plCondHTML()}</div><div id="pl-plan">${plPlanHTML()}</div><div id="pl-saved">${plSavedHTML()}</div></div>`;
  }
  function plRefresh(part) {
    if (S.tab !== 'plan') return;
    if (!part || part === 'cond') { const e = document.getElementById('pl-cond'); if (e) e.innerHTML = plCondHTML(); }
    if (!part || part === 'plan') { const e = document.getElementById('pl-plan'); if (e) e.innerHTML = plPlanHTML(); }
    if (!part || part === 'saved') { const e = document.getElementById('pl-saved'); if (e) e.innerHTML = plSavedHTML(); }
  }
  function plFind(key, i) { const b = PL.data.blocks.find((x) => x.key === key); return b ? { b, x: b.items[+i] } : {}; }

  // タイマー（練習中の画面）
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
  function runStart(data) {
    const items = data.blocks.flatMap((b) => b.items.map((x) => ({ id: x.id, min: x.min, block: b.name }))).filter((x) => get(x.id));
    if (!items.length) return;
    runEnd();
    RUN = { items, i: 0, left: items[0].min * 60, paused: false, last: Date.now(), done: false };
    try { RUN.ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { /* なし */ }
    try { if (navigator.wakeLock) navigator.wakeLock.request('screen').then((w) => { if (RUN) RUN.wake = w; else w.release(); }).catch(() => {}); } catch (e) { /* 画面が消えないようにできなくても進む */ }
    runRender(true);
    RUN.timer = setInterval(runTick, 250);
  }
  function runGo(i) {
    if (!RUN) return;
    RUN.i = Math.max(0, Math.min(RUN.items.length - 1, i));
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
      else { RUN.done = true; runRender(true); }
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
      el.innerHTML = RUN.done ? `<div class="run-top"><span>練習プラン</span><button type="button" class="icon-btn" data-run="end" aria-label="閉じる">${I.close}</button></div>
        <div class="run-body run-done"><p class="run-name">おつかれさまでした</p><p class="lead-sub">${RUN.items.length}メニュー・${total}分。最後に、今日できたことを1つずつ話してみましょう。</p>
        <div class="btns"><button type="button" class="btn" data-run="restart">はじめからもう一度</button><button type="button" class="btn btn-go" data-run="end">閉じる</button></div></div>`
        : `<div class="run-top"><span>${esc(x.block)}・${RUN.i + 1} / ${RUN.items.length}</span><button type="button" class="icon-btn" data-run="end" aria-label="タイマーを終わる">${I.close}</button></div>
        <div class="run-body">
          <button type="button" class="run-name" data-run="open">${esc(d.name)}</button>
          <div class="run-clock num" id="run-clock"></div>
          <div class="run-bar"><i id="run-prog"></i></div>
          ${BC.motionFor(d.id) ? '<div class="run-anim" data-anim></div>' : ''}
          <ul class="run-pts">${(d.points || []).slice(0, 3).map((p) => `<li>${md(p)}</li>`).join('')}</ul>
          <p class="run-next">${next ? `次：${esc(get(next.id).name)}（${next.min}分）` : '次：おわり'}</p>
        </div>
        <div class="run-ctl"><button type="button" class="btn" data-run="prev">◀ 前</button><button type="button" class="btn btn-go" data-run="pause" id="run-pause"></button><button type="button" class="btn" data-run="next">次 ▶</button></div>`;
      const a = el.querySelector('[data-anim]');
      if (a) BC.anim(a, BC.motionFor(d.id), { points: false });
    }
    if (RUN.done) return;
    const left = Math.max(0, Math.ceil(RUN.left));
    const c = document.getElementById('run-clock');
    if (c) c.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
    const pr = document.getElementById('run-prog');
    if (pr) pr.style.width = `${(100 * (1 - RUN.left / (x.min * 60))).toFixed(1)}%`;
    const pb = document.getElementById('run-pause');
    if (pb) pb.textContent = RUN.paused ? '▶ 再開' : '⏸ 一時停止';
  }
  function runEnd() {
    if (!RUN) return;
    clearInterval(RUN.timer);
    try { if (RUN.wake) RUN.wake.release(); } catch (e) { /* なし */ }
    try { if (RUN.ac) RUN.ac.close(); } catch (e) { /* なし */ }
    RUN = null;
    document.querySelectorAll('.run').forEach((e) => e.remove());
  }

  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-pl],[data-plc],[data-plthadd],[data-plthdel],[data-run],[data-pledit]');
    if (!t) return;
    const d = t.dataset;
    if (d.pledit != null) {
      const m = S.log[+d.pledit];
      if (!m || !m.bot) return;
      const ctx = Object.assign({}, S.profile, m.bot.ctx || {});
      const p = planOf(m.bot);
      Object.assign(PL, { minutes: m.bot.minutes, n: ctx.n || null, level: ctx.level || null, place: ctx.place || null, focus: (m.bot.focus || []).slice(), skills: (m.bot.skills || []).slice(), name: '' });
      PL.data = BC.planData(p, PL);
      PL.data.focus = PL.focus.slice(); PL.data.skills = PL.skills.slice(); PL.data.place = PL.place;
      savePL();
      location.hash = 'plan';
      return;
    }
    if (d.plc) {
      PL[d.plc] = d.v === '' ? null : isNaN(+d.v) ? d.v : +d.v;
      savePL();
      plRefresh('cond');
      return;
    }
    if (d.plthadd) {
      if (d.plthadd.startsWith('s:')) { const sid = d.plthadd.slice(2); if (!PL.skills.includes(sid)) PL.skills.push(sid); }
      else if (!PL.focus.includes(d.plthadd)) PL.focus.push(d.plthadd);
      savePL();
      plRefresh('cond');
      const q = document.getElementById('pl-q'); if (q) q.focus();
      return;
    }
    if (d.plthdel) {
      if (d.plthdel.startsWith('s:')) PL.skills = PL.skills.filter((x) => x !== d.plthdel.slice(2));
      else PL.focus = PL.focus.filter((x) => x !== d.plthdel);
      savePL();
      plRefresh('cond');
      return;
    }
    if (d.run) {
      if (!RUN && d.run !== 'end') return;
      if (d.run === 'end') runEnd();
      else if (d.run === 'pause') { RUN.paused = !RUN.paused; runRender(false); }
      else if (d.run === 'next') { if (RUN.i < RUN.items.length - 1) runGo(RUN.i + 1); else { RUN.done = true; runRender(true); } }
      else if (d.run === 'prev') runGo(RUN.i - 1);
      else if (d.run === 'restart') runGo(0);
      else if (d.run === 'open') { RUN.paused = true; const id = RUN.items[RUN.i].id; runRender(false); document.querySelector('.run').classList.add('run-hide'); showItem(id); }
      return;
    }
    const act = d.pl;
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
        if (!alts.length) { toast('入れかえられる練習が見つかりません（条件をゆるめてみてください）'); return; }
        seen.add(alts[0].id);
        x.id = alts[0].id;
        x.min = Math.max(3, Math.min(x.min, alts[0].minutes * 2));
        toast('「' + alts[0].name + '」に入れかえました');
      }
      savePL();
      plRefresh('plan');
      return;
    }
    if (act === 'add') { plPick = plPick === d.b ? null : d.b; plRefresh('plan'); const q = document.getElementById('pl-pq'); if (q) q.focus(); return; }
    if (act === 'pick') {
      const b = PL.data.blocks.find((x) => x.key === d.b), dr = get(d.id);
      if (b && dr) { b.items.push({ id: dr.id, min: dr.minutes || 8 }); savePL(); toast('「' + dr.name + '」を足しました'); }
      plRefresh('plan');
      return;
    }
    if (act === 'run') { runStart(PL.data); return; }
    if (act === 'copy') { const name = (document.getElementById('pl-name') || {}).value || plName(PL.data); copy(name + '\n' + BC.planText(BC.planFromData(PL.data)).replace(/^【練習プラン \d+分】/, `【練習プラン ${plTotal(PL.data)}分】`), '練習プランをコピーしました'); return; }
    if (act === 'save') {
      const name = ((document.getElementById('pl-name') || {}).value || '').trim() || plName(PL.data);
      PL.name = name;
      plans.unshift({ id: 'p' + Date.now().toString(36), name, saved: Date.now(), data: JSON.parse(JSON.stringify(PL.data)) });
      plans = plans.slice(0, 50);
      savePlans(); savePL();
      toast('「' + name + '」を保存しました');
      plRefresh('saved');
      return;
    }
    if (act === 'open' || act === 'run-saved') {
      const p = plans.find((x) => x.id === d.id);
      if (!p) return;
      PL.data = JSON.parse(JSON.stringify(p.data));
      Object.assign(PL, { minutes: p.data.minutes, n: p.data.n, level: p.data.level, place: p.data.place, focus: (p.data.focus || []).slice(), skills: (p.data.skills || []).slice(), name: p.name });
      savePL();
      if (act === 'run-saved') { runStart(PL.data); plRefresh(); return; }
      plRefresh();
      const e2 = document.getElementById('pl-plan'); if (e2) e2.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
  });
  document.addEventListener('input', (e) => {
    if (e.target.id === 'pl-q') { const s2 = document.getElementById('pl-sug'); if (s2) s2.innerHTML = plSugHTML(e.target.value); }
    else if (e.target.id === 'pl-pq') {
      const pick = e.target.closest('.pl-pick');
      if (pick) { const rows = pick.querySelector('.rows'); const tmp = document.createElement('div'); tmp.innerHTML = plPickerHTML(e.target.dataset.b); rows.innerHTML = tmp.querySelector('.rows').innerHTML; }
    }
  });

  /* ---------- 枠と、タブの切りかえ ---------- */
  function shell() {
    app.innerHTML = `
      <header class="top"><div class="top-in">
        <a class="logo" href="#chat">${I.ball}<span class="logo-text">バスケ育成チャット</span></a>
        <nav class="top-nav" aria-label="画面">${tabs()}</nav>
        <button type="button" class="cond-btn" data-act="cond">${I.sliders}<span id="cond-text"></span></button>
      </div></header>
      <main id="main"></main>
      <form class="composer" id="composer" autocomplete="off"><div class="composer-in">
        <label class="sr" for="say">困っていること・うまくなりたいこと</label>
        <textarea id="say" rows="1" placeholder="例：試合になるとシュートが入らない" enterkeyhint="send"></textarea>
        <button type="submit" class="send" aria-label="送る" disabled>${I.send}</button>
      </div></form>
      <nav class="tab" aria-label="画面"><div class="tab-in">${tabs(true)}</div></nav>`;
  }
  const tabs = (icons) => [['chat', 'チャット', I.chat], ['plan', 'プラン', I.plan], ['library', '図鑑', I.book], ['videos', '動画', I.film]].map(([k, l, ic]) => `<a href="#${k}" data-tab="${k}">${icons ? ic : ''}${l}</a>`).join('');
  function setTab(tab) {
    S.tab = tab;
    document.querySelectorAll('[data-tab]').forEach((a) => (a.dataset.tab === tab ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
    document.getElementById('composer').hidden = tab !== 'chat';
    if (tab === 'chat') renderChat();
    else if (tab === 'plan') renderPlan();
    else if (tab === 'library') renderLibrary();
    else renderVideos();
  }
  function updateCond() {
    const t = condText(S.profile);
    document.getElementById('cond-text').textContent = t ? '条件：' + t : '条件を決める';
  }
  function route() {
    const h = decodeURIComponent(location.hash.slice(1));
    if (['chat', 'plan', 'library', 'videos'].includes(h)) {
      if (S.sheet || S.video) { S.sheet = null; S.video = null; closeSheetDom(); }
      if (h !== S.tab || !document.getElementById('main').innerHTML) { setTab(h); window.scrollTo(0, h === 'chat' && S.log.length > 1 ? document.body.scrollHeight : 0); }
      return;
    }
    if (h && BC.get(h)) {
      if (!document.getElementById('main').innerHTML) setTab(S.tab);
      showItem(h);
      return;
    }
    if (!document.getElementById('main').innerHTML) setTab('chat');
  }
  function rerender() {
    if (S.tab === 'chat') renderChat();
    else if (S.tab === 'plan') renderPlan();
    else if (S.tab === 'library') renderLibrary();
    else renderVideos();
  }
  let toastT;
  function toast(msg) {
    document.querySelectorAll('.toast').forEach((t) => t.remove());
    const t = document.createElement('div');
    t.className = 'toast';
    t.setAttribute('role', 'status');
    t.textContent = msg;
    document.body.appendChild(t);
    clearTimeout(toastT);
    toastT = setTimeout(() => t.remove(), 2600);
  }
  async function copy(text, okMsg) {
    try { await navigator.clipboard.writeText(text); toast(okMsg || 'コピーしました'); }
    catch (e) {
      S.sheet = null;
      openSheet(`<p class="lead-sub">コピーできなかったので、下の文字を選んでコピーしてください。</p><label class="field"><textarea id="copy-box" style="min-height:16em">${esc(text)}</textarea></label>`, '<span class="kind">コピー</span>');
      const b = document.getElementById('copy-box'); b.focus(); b.select();
    }
  }
  function download(name, text) {
    try {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
      a.download = name;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
      toast('保存しました（ダウンロードを確かめてください）');
    } catch (e) { copy(text); }
  }

  /* ---------- 操作 ---------- */
  document.addEventListener('click', async (e) => {
    const t = e.target.closest('[data-open],[data-ask],[data-say],[data-skill],[data-plan],[data-planmin],[data-plann],[data-copyplan],[data-play],[data-act],[data-libkind],[data-libskill],[data-vidfilter],[data-cond],[data-link],[data-unlink],[data-relink],[data-lh]');
    if (!t) return;
    const d = t.dataset;
    if (d.open) {
      e.preventDefault();
      if (location.hash.slice(1) === d.open) showItem(d.open); else location.hash = d.open;
      return;
    }
    if (d.ask) {
      const it = get(d.ask);
      if (!it) return;
      closeSheet();
      if (it.kind_ === 'issue') push(d.label || it.title, { type: 'issue', id: it.id, alts: [], ctx: {} });
      else push(d.label || labelOf(it), { type: 'item', id: it.id, alts: [], related: BC.issuesFor(it.id).slice(0, 4).map((x) => x.id), ctx: {} });
      return;
    }
    if (d.say) { closeSheet(); send(d.say); return; }
    if (d.skill) { const s = BC.skillMap[d.skill]; if (s) push(s.name, { type: 'skill', skill: s.id, ctx: {} }); return; }
    if (d.plan) {
      const it = get(d.plan);
      closeSheet();
      const prev = d.i != null ? (S.log[+d.i] || {}).bot : null;
      push(`「${it ? it.title : ''}」の練習プランを作って`, { type: 'plan', minutes: 60, focus: [d.plan], skills: [], ctx: (prev && prev.ctx) || {} });
      return;
    }
    if (d.planmin || d.plann) {
      const m = S.log[+d.i];
      if (!m || !m.bot) return;
      if (d.planmin) m.bot.minutes = +d.planmin;
      if (d.plann) m.bot.ctx = Object.assign({}, m.bot.ctx, { n: +d.plann });
      saveLog();
      const y = window.scrollY;
      renderChat();
      window.scrollTo(0, y);
      return;
    }
    if (d.copyplan) { const m = S.log[+d.copyplan]; if (m && m.bot) copy(BC.planText(planOf(m.bot)), '練習プランをコピーしました'); return; }
    if (d.play) { showVideo(d.play); return; }
    if (d.libkind) { S.lib.kind = d.libkind; S.lib.q = ''; S.lib.skill = ''; const q = document.getElementById('lib-q'); if (q) q.value = ''; renderLibList(); return; }
    if (t.hasAttribute('data-libskill')) { S.lib.skill = d.libskill; renderLibList(); return; }
    if (d.vidfilter) { S.vid.filter = d.vidfilter; renderVidList(); return; }
    if (d.cond) {
      const v = d.v === '' ? undefined : isNaN(+d.v) ? d.v : +d.v;
      if (v === undefined) delete S.profile[d.cond]; else S.profile[d.cond] = v;
      store.set('bc.profile', S.profile);
      updateCond();
      showCond();
      if (S.tab === 'chat') renderChat();
      return;
    }
    if (d.link || d.unlink || d.relink) {
      const v = BCV.byKey[S.video];
      if (!v) return;
      BCV.setLink(v.key, d.link || d.unlink || d.relink, !d.unlink);
      const q = (document.getElementById('link-q') || {}).value || '';
      await showVideo(v.key);
      const inp = document.getElementById('link-q');
      if (inp) { inp.value = q; linkSearch(q); }
      return;
    }
    if (d.lh) { BCV.setLink(d.lh, d.id, d.on !== '1'); linkHere(d.id); return; }
    switch (d.act) {
      case 'close': closeSheet(); if (S.video) { S.video = null; } break;
      case 'cond': showCond(); break;
      case 'fav': {
        if (!S.sheet) break;
        S.favs.has(S.sheet) ? S.favs.delete(S.sheet) : S.favs.add(S.sheet);
        store.set('bc.favs', [...S.favs]);
        t.setAttribute('aria-pressed', S.favs.has(S.sheet));
        t.innerHTML = S.favs.has(S.sheet) ? I.starOn : I.star;
        toast(S.favs.has(S.sheet) ? 'お気に入りに入れました（図鑑の ★）' : 'お気に入りから外しました');
        break;
      }
      case 'clear': S.log = []; S.lastIssue = null; saveLog(); closeSheet(); if (S.tab !== 'chat') location.hash = 'chat'; else renderChat(); window.scrollTo(0, 0); break;
      case 'pick-folder': case 'pick-files': case 'reconnect': {
        const r = await (d.act === 'pick-folder' ? BCV.pickFolder() : d.act === 'pick-files' ? BCV.pickFiles() : BCV.reconnect());
        if (r.message) toast(r.message);
        else if (r.ok) toast(`動画 ${r.count} 本をつなぎました`);
        rerender();
        if (S.sheet) showItem(S.sheet);
        break;
      }
      case 'vid-more': S.vid.limit += 200; renderVidList(); break;
      case 'add-url': {
        const r = BCV.addUrl(document.getElementById('url-title').value, document.getElementById('url-url').value);
        toast(r.ok ? 'URL の動画を足しました' : r.message);
        if (r.ok) renderVideos();
        break;
      }
      case 'del-url': BCV.removeUrl(d.key); closeSheet(); renderVideos(); break;
      case 'export-copy': copy(BCV.exportText(), '紐付けをコピーしました'); break;
      case 'export-file': download('basket-coach-links.json', BCV.exportText()); break;
      case 'export-folder': { const r = await BCV.saveToFolder(); toast(r.ok ? '動画フォルダに basket-coach-links.json を保存しました' : r.message); break; }
      case 'import': {
        const r = await BCV.importText(document.getElementById('import-text').value);
        toast(r.ok ? `紐付けを ${r.count} 本分 読みこみました` : r.message);
        if (r.ok) renderVideos();
        break;
      }
      case 'link-here': linkHere(d.id); break;
      default: break;
    }
  });
  document.addEventListener('input', (e) => {
    if (e.target.id === 'lib-q') { S.lib.q = e.target.value; renderLibList(); }
    else if (e.target.id === 'vid-q') { S.vid.q = e.target.value; renderVidList(); }
    else if (e.target.id === 'link-q') linkSearch(e.target.value);
    else if (e.target.id === 'lh-q') linkHere(e.target.dataset.id);
    else if (e.target.id === 'say') {
      const ta = e.target;
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight + 2, 160) + 'px';
      document.querySelector('.send').disabled = !ta.value.trim();
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.target.id === 'say' && e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      document.getElementById('composer').requestSubmit();
    }
    if (e.key === 'Escape' && document.querySelector('.sheet')) closeSheet();
  });
  document.addEventListener('submit', (e) => {
    if (e.target.id !== 'composer') return;
    e.preventDefault();
    const ta = document.getElementById('say');
    const text = ta.value;
    ta.value = '';
    ta.style.height = 'auto';
    document.querySelector('.send').disabled = true;
    send(text);
  });
  window.addEventListener('hashchange', route);

  /* ---------- はじめ ---------- */
  shell();
  updateCond();
  BCV.onchange = () => { /* 紐付けが変わったら、今の画面を描きなおす（会話は位置を保つ） */ };
  BCV.init().then(() => { if (S.tab === 'videos') renderVideos(); else if (S.tab === 'chat') { const y = window.scrollY; renderChat(); window.scrollTo(0, y); } });
  route();
  if (!location.hash && S.log.length > 1) requestAnimationFrame(() => window.scrollTo(0, document.body.scrollHeight));
  // 検査用（tools/look.cjs）
  window.BCAPP = { S, send, showItem, setTab, rerender, PL, runStart, runEnd, getRun: () => RUN };
})();
