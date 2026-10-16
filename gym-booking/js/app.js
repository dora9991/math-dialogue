/* 体育館よやく：画面。状態（st）を書きかえたら render() で全部を描き直す。
   操作は data-act（クリック）・data-ch（変更）・data-form（送信）で受ける。ルールの計算は rules.js・lottery.js・actions.js にある。 */
(function () {
  'use strict';
  const GB = window.GB, D = GB.date, A = GB.act;
  const ENV = window.GB_ENV || {};
  const root = document.getElementById('app');

  let st = GB.store.load();
  if (st) A.settle(st); else { st = GB.sample(); GB.store.save(st); }
  const ui = Object.assign({ view: 'guide', orgId: 'o1', orgTab: 'home', facId: 'f1', orgMonth: null, schoolFac: 'f1', schoolTab: 'cal', schoolMonth: null, adminTab: 'overview', runMonth: null, csvMonth: null, regForm: {} }, GB.store.loadUi() || {});
  Object.assign(ui, { sheet: null, clockOpen: false, confirmReset: false, verified: {}, seed: '' });

  /* ---- 小さな道具 ---- */
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const O = id => GB.find(st.orgs, id), F = id => GB.find(st.facilities, id);
  const dn = id => { const d = GB.find(st.districts, id); return d ? d.name : '市外'; };
  const idn = id => +String(id).replace(/\D/g, '');
  const COLS = { am: '午前', pm: '午後', after: '放課後', night: '夜' };
  const NEED = { full: '全面', half: '半面' };
  const APP = { applied: ['申込中', 'wait'], won: ['当選', 'ok'], lost: ['落選', ''], invalid: ['対象外', 'bad'], withdrawn: ['取り下げ', ''] };
  const BK = { pending: ['確定待ち', 'wait'], confirmed: ['確定', 'ok'], used: ['使った', ''], noshow: ['使わなかった', 'bad'], cancelled: ['取り消し', ''], expired: ['取り消し（未確定）', ''], displaced: ['取り消し（学校・大会）', ''] };
  const PH_TONE = { apply: 'wait', closed: 'wait', drawing: 'wait', confirm: 'ok', firstCity: 'ok', firstAll: 'ok' };
  const pill = (t, tone = '') => `<span class="pill ${tone}">${esc(t)}</span>`;
  const attrs = data => Object.entries(data).map(([k, v]) => `data-${k}="${esc(v)}"`).join(' ');
  const btn = (label, act, data = {}, cls = '', disabled = false) =>
    `<button type="button" class="btn ${cls}" data-act="${act}" ${attrs(data)}${disabled ? ' disabled' : ''}>${label}</button>`;
  const sel = (ch, options, value, extra = '') =>
    `<select data-ch="${ch}" ${extra}>${options.map(([v, l]) => `<option value="${esc(v)}"${String(v) === String(value) ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
  const court = (need, half) => `<svg class="court" viewBox="0 0 26 16" aria-hidden="true"><rect class="bg" x="1" y="1" width="24" height="14" rx="1.5"/>` +
    (need === 'full' ? '<rect class="on" x="1" y="1" width="24" height="14" rx="1.5"/>' : `<rect class="on" x="${half === 'B' ? 13 : 1}" y="1" width="12" height="14"/>`) +
    '<line x1="13" y1="1" x2="13" y2="15"/><circle cx="13" cy="8" r="2.6"/></svg>';
  const slotOf = (f, date, slotId) => GB.slot(st, f, date, slotId) || { label: COLS[slotId] || slotId, start: '', end: '' };
  const when = x => { const f = F(x.facilityId), s = f ? slotOf(f, x.date, x.slotId) : null; return `${GB.mdw(x.date)} ${s ? esc(s.label) : ''}`; };
  const monthsFor = () => { const out = []; for (let m = D.ym(st.clock); m <= GB.lotteryMonth(st); m = D.addMonths(m, 1)) out.push(m); return out; };
  const pickMonth = (m, fallback) => monthsFor().includes(m) ? m : fallback;
  const logCache = new WeakMap();
  const runLog = run => { if (!logCache.has(run)) logCache.set(run, GB.draw(run.input, run.seed).log); return logCache.get(run); };
  const newSeed = m => `${m}-${1000 + Math.floor(Math.random() * 9000)}`;
  // デモ：日付を進めて確定の締切を過ぎるとき、ほかの団体の当選は確定したことにする（1割ほどは確定しないまま＝取り消しの例）
  function othersConfirm(to) {
    let n = 0;
    for (const b of st.bookings) {
      if (b.status !== 'pending' || b.orgId === ui.orgId || to <= GB.schedule(st, D.ym(b.date)).confirmEnd || idn(b.id) % 10 === 0) continue;
      b.status = 'confirmed';
      n++;
    }
    return n;
  }
  function moveClock(to) {
    if (to < st.clock) return A.setClock(st, to);
    const n = othersConfirm(to), r = A.setClock(st, to);
    if (r.ok && n) r.msg += `。ほかの団体の当選 ${n} 件は、締切までに確定したことにしました`;
    return r;
  }

  /* ---- 保存・お知らせ ---- */
  const toastEl = document.createElement('div');
  toastEl.className = 'toast';
  toastEl.setAttribute('role', 'status');
  toastEl.setAttribute('aria-live', 'polite');
  document.body.appendChild(toastEl);
  let toastTimer = 0;
  function toast(msg, ok = true) {
    toastEl.textContent = msg;
    toastEl.className = `toast show${ok ? '' : ' bad'}`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastEl.className = 'toast'; }, 4200);
  }
  function save() {
    GB.store.save(st);
    const { sheet, clockOpen, confirmReset, verified, seed, ...keep } = ui;
    GB.store.saveUi(keep);
  }
  function done(r) { if (r && r.msg) toast(r.msg, r.ok !== false); save(); render(); return r; }

  /* ---- 上の帯 ---- */
  function topbar() {
    const views = [['guide', 'しくみ'], ['org', '団体'], ['school', '学校'], ['admin', '市役所']];
    return `<header class="top"><div class="top-in">
      <div class="brand"><svg class="logo" viewBox="0 0 40 26" aria-hidden="true"><rect x="1.5" y="1.5" width="37" height="23" rx="2"/><line x1="20" y1="1.5" x2="20" y2="24.5"/><circle cx="20" cy="13" r="4.5"/><path d="M1.5 7.5h5a5.5 5.5 0 0 1 0 11h-5M38.5 7.5h-5a5.5 5.5 0 0 0 0 11h5"/></svg>
        <div><div class="name">体育館よやく</div><div class="sub">佐賀市への提案用の試作（サンプルデータ）</div></div></div>
      <nav class="views" aria-label="画面の切りかえ">${views.map(([v, l]) => `<button type="button" class="view${ui.view === v ? ' on' : ''}" data-act="view" data-v="${v}"${ui.view === v ? ' aria-current="page"' : ''}>${l}</button>`).join('')}</nav>
      <div class="clock"><span class="k">きょう（デモ）</span><b class="mono">${st.clock.slice(0, 4)}年 ${GB.mdw(st.clock)}</b>${btn(ui.clockOpen ? '閉じる' : '日付を進める', 'clock', {}, 'sm ghost')}</div>
    </div>${ui.clockOpen ? clockPanel() : ''}<div class="floor" aria-hidden="true"></div></header>`;
  }
  function clockPanel() {
    const marks = [];
    for (const m of [...monthsFor(), D.addMonths(GB.lotteryMonth(st), 1)]) {
      const sc = GB.schedule(st, m), lab = GB.ymLabel(m);
      marks.push([D.add(sc.applyStart, 2), `${lab}の申込期間のなか`], [sc.draw, `${lab}の抽選日`], [D.add(sc.confirmEnd, 1), `${lab}の先着が始まる`]);
      if (sc.firstAll !== sc.firstCity) marks.push([sc.firstAll, `${lab}の先着（だれでも）`]);
    }
    const L = GB.lotteryMonth(st);
    marks.push([D.on(L, 10), `${+L.slice(5)}月10日（利用月）`]);
    const seen = new Set();
    const list = marks.filter(([d]) => d > st.clock && !seen.has(d) && seen.add(d)).sort((a, b) => a[0] < b[0] ? -1 : 1).slice(0, 6);
    return `<div class="clock-panel"><div class="clock-in">
      <p>デモ用に「きょう」を進めると、申込 → 抽選 → 確定 → 先着 → 利用 の流れを試せます。確定の締切を過ぎるとき、いま団体の画面でえらんでいる団体のほかは、当選を確定したことにします（1割ほどは確定しないまま取り消しになります）。</p>
      <div class="row-btn">${list.map(([d, l]) => btn(`${GB.mdw(d)}<small>${esc(l)}</small>`, 'setclock', { d }, 'sm ghost stack')).join('')}</div>
      <form class="inline" data-form="clock"><label>日付をえらぶ <input type="date" name="d" id="clock-date" min="${D.add(st.clock, 1)}" value="${D.add(st.clock, 1)}"></label><button class="btn sm">この日にする</button></form>
      <div class="reset">${ui.confirmReset ? `<span>入力した内容は消えます。</span>${btn('サンプルに戻す', 'reset', {}, 'sm warn')}${btn('やめる', 'reset-no', {}, 'sm ghost')}` : btn('最初からやり直す', 'reset-ask', {}, 'sm ghost')}</div>
    </div></div>`;
  }

  /* ---- しくみ（ルールの説明。いまの設定から作る） ---- */
  function guideView() {
    const s = st.settings, L = GB.lotteryMonth(st), sc = GB.schedule(st, L), base = s.lead === 1 ? '前月' : '2か月前の月';
    const prio = [];
    for (const k of Object.keys(s.slots)) for (const dt of ['weekday', 'holiday']) for (const x of s.slots[k][dt]) if (x.prio && x.prio.length)
      prio.push(`${GB.KINDS[k]}の${dt === 'weekday' ? '平日' : '土日祝'}の${x.label}（${GB.time(x)}）は、${x.prio.map(t => GB.TYPE_SHORT[t]).join('・')}`);
    const policy = { none: '使えません', first: '抽選のあとに残ったコマだけ、先着で使えます', lottery: '抽選にも申し込めます' }[s.commercialSchool];
    const afterSlot = (s.slots.school.weekday || []).find(x => x.id === 'after') || { prio: [] };
    const exParts = [s.tickets.youth, s.bonusDistrict, ...((afterSlot.prio || []).includes('youth') ? [s.bonusPriority] : [])].filter(n => n > 0);
    const ex = exParts.reduce((a, n) => a + n, 0), other = s.tickets.general;
    const sameAsSaga = s.lead === 1 && s.applyStart === 1 && s.applyEnd === 9 && s.drawDay === 10 && s.confirmEnd === 15 && s.firstCity === 16;
    return `
    <section class="hero">
      <p class="eyebrow">部活動の地域展開にそなえて</p>
      <h1>体育館を、くじと上限で分け合う</h1>
      <p class="lead">部活動の地域展開で、平日の夕方と休日に体育館を使いたい団体が増えます。先着順のままだと、受付が始まった瞬間に予約が集中し、早く操作できた団体だけが取れてしまいます。この試作では、市役所・学校・団体が同じ画面を見ながら、決まったルールで体育館を分け合います。</p>
      <div class="row-btn">${btn('団体の画面で申し込んでみる', 'go', { v: 'org', tab: 'cal' })}${btn('市役所の画面で抽選してみる', 'go', { v: 'admin', tab: 'lottery' }, 'ghost')}</div>
    </section>

    <section class="block">
      <h2>3つの段階で、順に決める</h2>
      <div class="layers">
        <article class="layer"><p class="step">1　年に1回</p><h3>定期枠</h3><p>認定地域クラブの平日の練習など、毎週決まった活動の土台です。学校ごとの調整会議で決め、毎年見直します。1団体 週 ${s.maxRegular} コマまで、体育館のコマの ${s.regularMax}％ までにします。</p></article>
        <article class="layer"><p class="step">2　毎月</p><h3>抽選</h3><p>利用月の${base} ${s.applyStart}〜${s.applyEnd} 日に申し込み、${s.drawDay} 日に抽選します。申し込んだ順番は関係ないので、受付開始の瞬間に急ぐ必要はありません。</p></article>
        <article class="layer"><p class="step">3　抽選のあと</p><h3>先着</h3><p>${s.confirmEnd} 日までに確定されなかったコマと、残ったコマを、${s.firstCity} 日から先着で予約できます。利用日の ${s.bookUntil} 日前までです。</p></article>
      </div>
      <p class="callout">学校行事と大会は、いつでも最優先です。あとから入ったときは、予約していた団体に自動でお知らせが届き、違反にはなりません。</p>
    </section>

    <section class="block">
      <h2>${GB.ymLabel(L)}の日程</h2>
      ${timeline(L)}
      <p class="muted small">${sameAsSaga ? '日程は、佐賀市の体育施設のオンライン予約（前月 1〜9 日に抽選の申込、10 日に抽選、11〜15 日に確定、16 日から先着）にそろえています。市役所の「ルール」で変えられます。' : '日程は、市役所の「ルール」で変えてあります（既定値は、佐賀市の体育施設のオンライン予約と同じ日程です）。'}</p>
    </section>

    <section class="block two">
      <div>
        <h2>くじの本数</h2>
        <p>当たる確率は、くじの本数に比例します。区分ごとの基本の本数に、条件に合うと本数が加わります。</p>
        <div class="tw"><table class="plain">
          <thead><tr><th>区分</th><th class="num">基本</th></tr></thead>
          <tbody>${Object.keys(GB.TYPES).map(t => `<tr><td>${GB.TYPES[t]}</td><td class="num">${s.tickets[t]} 本</td></tr>`).join('')}</tbody>
        </table></div>
        <div class="tw"><table class="plain">
          <thead><tr><th>加わる条件</th><th class="num">本数</th></tr></thead>
          <tbody>
            <tr><td>活動している地区の体育館に申し込む</td><td class="num">＋${s.bonusDistrict} 本</td></tr>
            <tr><td>優先時間帯に、その対象の団体が申し込む</td><td class="num">＋${s.bonusPriority} 本</td></tr>
            <tr><td>前の月の抽選で1つも当たらなかった（${s.lossMax} 回ぶんまで）</td><td class="num">＋${s.bonusLoss} 本ずつ</td></tr>
          </tbody>
        </table></div>
        ${prio.length ? `<p class="small">優先時間帯：${prio.map(esc).join('。')}。</p>` : ''}
      </div>
      <div class="example">
        <h3>たとえば</h3>
        <p>中部の子どもの団体が、中部の中学校の平日の放課後に申し込むと、くじは ${exParts.join('＋')}＝<b>${ex} 本</b>。ほかの地区の一般の団体（${other} 本）と取り合うと、当たる確率は ${ex}/${ex + other} と ${other}/${ex + other} です。</p>
        <div class="kuji demo" aria-hidden="true"><div class="track"><div class="bar"><div class="seg win" style="flex-grow:${ex}"><b>中部の子どもの団体</b><span class="mono">1–${ex}</span></div><div class="seg" style="flex-grow:${other}"><b>ほかの地区</b><span class="mono">${ex + 1}–${ex + other}</span></div></div></div></div>
        <p class="small muted">落選が続いた団体のくじを増やす方法は、スポーツ施設では例が少なく、市営住宅の「優遇抽選」（落選が続くとくじが増える）を参考にしました。</p>
      </div>
    </section>

    <section class="block two">
      <div>
        <h2>上限</h2>
        <ul class="facts">
          <li><b class="mono">${s.maxApps}</b> 件<span>抽選に申し込めるのは 1 か月 ${s.maxApps} 件まで</span></li>
          <li><b class="mono">${s.maxWins}</b> コマ<span>抽選で当たるのは 1 か月 ${s.maxWins} コマまで。上限に達した団体は、残りのコマのくじから外れます</span></li>
          <li><b class="mono">${s.maxTotal}</b> コマ<span>抽選と先着を合わせて 1 か月 ${s.maxTotal} コマまで（定期枠は別）</span></li>
          <li><b class="mono">${s.maxPerDay}</b> コマ<span>1 日に使えるのは ${s.maxPerDay} コマまで（定期枠もふくむ）</span></li>
        </ul>
      </div>
      <div>
        <h2>約束ごと</h2>
        <ul class="dots">
          <li>当選したら、${s.confirmEnd} 日までに「確定」します。確定しないと取り消され、先着に回ります。</li>
          <li>キャンセルは、利用日の ${s.freeCancelDays} 日前までなら違反になりません。それより後は違反 ${s.ptLate} 点です。</li>
          <li>予約したのに連絡なしで使わなかったときは、違反 ${s.ptNoShow} 点です（学校が利用を確認します）。</li>
          <li>違反が ${s.ptLimit} 点になると、${s.suspendMonths} か月のあいだ、抽選の申込と先着の予約ができません。</li>
        </ul>
      </div>
    </section>

    <section class="block two">
      <div>
        <h2>使える団体</h2>
        <ul class="dots">
          <li>学校体育館を使えるのは、市内に住む・通う・働く人でつくる団体です（学校開放の規則）。</li>
          <li>市外の団体は、抽選に${s.outsideLottery ? '申し込めます' : '申し込めません'}。市の体育館の先着は ${s.firstAll} 日から予約できます。</li>
          <li>営利目的の団体（民間スクールなど）は、学校体育館を${policy}。市の体育館は抽選・先着とも使えます（くじは ${s.tickets.commercial} 本）。</li>
          <li>団体の登録は、市役所が承認してから使えます。</li>
        </ul>
      </div>
      <div>
        <h2>公平さを確かめる</h2>
        <ul class="dots">
          <li>抽選は「シード」という言葉や数字から作る乱数で行います。同じ申込と同じシードなら、だれが何度やっても同じ結果になります。</li>
          <li>市役所は、抽選のあとにシードを公開します。本番では、公開の場でサイコロを振るなどして決めます。</li>
          <li>区分ごと・地区ごとの申込数と当選率を、毎月公開します。</li>
          <li>コマごとの申込の件数が見えるので、混んでいるコマを避けて申し込めます。</li>
        </ul>
      </div>
    </section>

    <section class="block note">
      <h2>この試作について</h2>
      <ul class="dots">
        <li>データはすべてサンプルです。実在の施設・団体ではありません。佐賀市の公式のものでもありません。</li>
        <li>このページはブラウザの中だけで動きます。入力した内容は、ほかの人には見えません。</li>
        <li>上の「日付を進める」で、申込 → 抽選 → 確定 → 先着の流れを試せます。いまの「きょう」では、${GB.ymLabel(L)}が「${GB.PHASE[GB.phase(st, L)]}」です（申込は ${GB.md(sc.applyStart)}〜${GB.md(sc.applyEnd)}）。</li>
      </ul>
    </section>`;
  }

  function timeline(m) {
    const sc = GB.schedule(st, m), t = st.clock, run = !!sc.run;
    const state = (a, b) => t > b ? 'done' : t >= a ? 'now' : 'next';
    const baseEnd = D.on(sc.base, 31);
    const steps = [
      ['抽選の申込', `${GB.md(sc.applyStart)}〜${GB.md(sc.applyEnd)}`, run ? 'done' : state(sc.applyStart, sc.applyEnd)],
      ['抽選', GB.md(sc.draw), run ? 'done' : t > sc.applyEnd ? 'now' : 'next'],
      ['当選の確定', `${GB.md(sc.draw)}〜${GB.md(sc.confirmEnd)}`, run ? state(sc.draw, sc.confirmEnd) : 'next'],
      [sc.firstAll === sc.firstCity ? '先着' : '先着（市内）', `${GB.md(sc.firstCity)}〜`, run ? state(sc.firstCity, sc.firstAll === sc.firstCity ? baseEnd : D.add(sc.firstAll, -1)) : 'next'],
    ];
    if (sc.firstAll !== sc.firstCity) steps.push(['先着（だれでも）', `${GB.md(sc.firstAll)}〜`, run ? state(sc.firstAll, baseEnd) : 'next']);
    steps.push(['利用', `${+m.slice(5)}月`, state(`${m}-01`, D.on(m, 31))]);
    return `<ol class="tl">${steps.map(([l, d, k]) => `<li class="${k}"><b>${l}</b><span class="mono">${d}</span>${k === 'now' ? '<em>いまここ</em>' : ''}</li>`).join('')}</ol>`;
  }

  /* ---- 時間割（体育館 × 月） ---- */
  function calendar(f, m, role) {
    const sl = st.settings.slots[f.kind] || st.settings.slots.school;
    const ids = Object.keys(COLS).filter(id => sl.weekday.some(x => x.id === id) || sl.holiday.some(x => x.id === id));
    const idx = {};
    for (const a of st.apps) if (a.facilityId === f.id && a.month === m && a.status !== 'withdrawn') (idx[`${a.date}|${a.slotId}`] = idx[`${a.date}|${a.slotId}`] || []).push(a);
    const rows = D.list(m).map(date => {
      const wd = D.wd(date), hol = GB.holiday(date), slots = GB.slotsOn(st, f, date);
      const tone = wd === 0 || hol ? 'sun' : wd === 6 ? 'sat' : '';
      const dc = `<div class="dc ${tone}"><b class="mono">${+date.slice(8)}</b><span>${D.WD[wd]}${hol ? `・${esc(hol)}` : ''}</span>${date === st.clock ? '<i>きょう</i>' : ''}</div>`;
      if (!slots.length) return `<div class="row closed">${dc}<div class="closed-msg">休館日</div></div>`;
      return `<div class="row${date < st.clock ? ' past' : ''}">${dc}${ids.map(id => { const s = slots.find(x => x.id === id); return s ? cell(f, date, s, role, idx[`${date}|${id}`] || []) : '<div class="cell none" aria-hidden="true"></div>'; }).join('')}</div>`;
    });
    return `<div class="cal" style="--cols:${ids.length}"><div class="row head" aria-hidden="true"><div></div>${ids.map(id => `<div class="ch">${COLS[id]}</div>`).join('')}</div>${rows.join('')}</div>`;
  }
  function cell(f, date, s, role, apps) {
    const occ = GB.occupancy(st, f, date, s.id), ph = GB.phase(st, D.ym(date)), me = role === 'org' ? ui.orgId : null;
    const pre = ['before', 'apply', 'closed', 'drawing'].includes(ph);
    const lines = [], badges = [];
    let tone = 'free';
    if (occ.block) { tone = 'block'; lines.push(`<span class="u">${esc(occ.block.reason)}</span>`); }
    else {
      const seen = new Set();
      for (const u of occ.units) {
        const it = occ.by[u];
        if (it && seen.has(it)) continue;
        if (it) seen.add(it);
        const both = it && occ.units.length > 1 && occ.by.A === occ.by.B;
        const lab = occ.units.length > 1 ? `<i>${both ? '全' : u}</i>` : '';
        if (!it) { lines.push(`<span class="u open">${lab}空き</span>`); continue; }
        const mine = me && it.orgId === me, pend = it.kind === 'booking' && it.ref.status === 'pending';
        const name = role === 'org' && !mine ? (it.kind === 'regular' ? '定期枠' : '予約あり') : `${it.kind === 'regular' ? '定期 ' : ''}${O(it.orgId) ? O(it.orgId).name : ''}`;
        lines.push(`<span class="u ${it.kind === 'regular' ? 'reg' : pend ? 'pend' : 'bk'}${mine ? ' mine' : ''}">${lab}${esc(mine ? (it.kind === 'regular' ? 'あなた（定期）' : pend ? 'あなた（確定待ち）' : 'あなた') : name)}</span>`);
        if (mine) tone = pend ? 'pend' : 'mine';
      }
      if (tone === 'free' && !occ.free.length) tone = 'full';
    }
    if (pre && !occ.block) {
      const live = apps.filter(a => a.status === 'applied');
      const mineApp = me && live.find(a => a.orgId === me);
      if (live.length && (role !== 'org' || st.settings.showCounts)) badges.push(`<span class="cnt${live.length > 1 ? ' hot' : ''}">申込 ${live.length}</span>`);
      if (mineApp) { badges.push('<span class="me">申込済み</span>'); if (tone === 'free') tone = 'applied'; }
    } else if (role === 'org' && !occ.block) {
      const mineApp = apps.find(a => a.orgId === me && ['won', 'lost', 'invalid'].includes(a.status));
      if (mineApp && mineApp.status !== 'won') badges.push(`<span class="me lost">${APP[mineApp.status][0]}</span>`);
      if ((ph === 'firstCity' || ph === 'firstAll') && occ.free.length && (tone === 'free' || tone === 'full') && ['full', 'half'].some(n => !GB.blocker(st, me, f.id, date, s.id, n, 'book'))) { tone = 'can'; badges.push('<span class="me ok">予約できる</span>'); }
    }
    const label = `${GB.mdw(date)} ${s.label} ${GB.time(s)}`;
    return `<button type="button" class="cell t-${tone}" data-act="open" data-f="${f.id}" data-d="${date}" data-s="${s.id}" aria-label="${esc(label)}"><span class="tm"><b>${esc(s.label)}</b><span class="mono">${GB.time(s)}</span></span><span class="ls">${lines.join('')}</span>${badges.length ? `<span class="bd">${badges.join('')}</span>` : ''}</button>`;
  }
  function legend(role) {
    const items = role === 'org'
      ? [['free', '空きがある'], ['applied', '抽選に申込済み'], ['can', '先着で予約できる'], ['mine', 'あなたの予約・定期枠'], ['pend', '当選（確定待ち）'], ['full', 'ほかの団体で埋まっている'], ['block', '学校行事・大会']]
      : [['free', '空きがある'], ['full', '埋まっている'], ['block', '学校行事・大会']];
    const text = role === 'org' ? '' : '<li><span class="u reg">紺の字</span>＝定期枠</li><li><span class="u pend">黄の字</span>＝当選の確定待ち</li>';
    return `<ul class="legend">${items.map(([t, l]) => `<li><i class="sw t-${t}"></i>${l}</li>`).join('')}${text}</ul>`;
  }
  function monthSwitch(cur, ch) {
    return `<div class="seg" role="group" aria-label="月">${monthsFor().map(m => `<button type="button" class="${m === cur ? 'on' : ''}" data-act="${ch}" data-m="${m}"${m === cur ? ' aria-pressed="true"' : ' aria-pressed="false"'}>${+m.slice(5)}月</button>`).join('')}</div>`;
  }
  function facSelect(ch, value, filter = () => true) {
    const list = st.facilities.filter(filter);
    return sel(ch, list.map(f => [f.id, `${dn(f.districtId)}｜${f.name}`]), value, `id="${ch}"`);
  }

  /* ---- まだ抽選していない月のお知らせ ---- */
  function pendingBanner() {
    return monthsFor().filter(m => GB.phase(st, m) === 'drawing').map(m =>
      `<div class="banner"><p><b>${GB.ymLabel(m)}の抽選がまだです。</b>本番では抽選日（${GB.md(GB.schedule(st, m).draw)}）に自動で行います。</p>${btn('いま抽選する', 'quickdraw', { m })}</div>`).join('');
  }

  /* ---- 団体の画面 ---- */
  function orgView() {
    const o = O(ui.orgId) || st.orgs[0];
    ui.orgId = o.id;
    const tabs = [['home', 'ホーム'], ['cal', '空きと申込'], ['list', '申込と予約']];
    const opts = st.orgs.map(x => [x.id, `${x.name}（${GB.TYPE_SHORT[x.type]}・${dn(x.districtId)}${x.status !== 'approved' ? '・承認待ち' : ''}）`]);
    return `<div class="subbar"><label class="pick">団体 ${sel('org', opts, o.id, 'id="org-pick"')}</label>
      <nav class="tabs" aria-label="団体の画面">${tabs.map(([k, l]) => `<button type="button" class="tab${ui.orgTab === k ? ' on' : ''}" data-act="orgtab" data-tab="${k}">${l}</button>`).join('')}</nav></div>
      ${pendingBanner()}
      ${ui.orgTab === 'cal' ? orgCal(o) : ui.orgTab === 'list' ? orgList(o) : orgHome(o)}`;
  }
  function orgHome(o) {
    const s = st.settings;
    const regs = st.regulars.filter(r => r.orgId === o.id && r.to >= st.clock);
    const pend = st.bookings.filter(b => b.orgId === o.id && b.status === 'pending').sort((a, b) => a.date < b.date ? -1 : 1);
    const notes = st.notices.filter(n => n.orgId === o.id).slice(0, 10);
    const cards = monthsFor().map(m => {
      const ph = GB.phase(st, m), sc = GB.schedule(st, m);
      const lines = {
        before: `抽選の申込は ${GB.md(sc.applyStart)}〜${GB.md(sc.applyEnd)} です。`,
        apply: `抽選の申込期間です（${GB.md(sc.applyStart)}〜${GB.md(sc.applyEnd)}）。申込 <b class="mono">${GB.appCount(st, o.id, m)}/${s.maxApps}</b> 件。`,
        closed: `申込を締め切りました。${GB.md(sc.draw)} に抽選します。`,
        drawing: '抽選を待っています。',
        confirm: `抽選が終わりました。当選は ${GB.md(sc.confirmEnd)} までに確定してください。`,
        settle: `先着の予約は ${GB.md(sc.firstCity)} からです。`,
        firstCity: `先着の受付中です（市内の団体）。この月 <b class="mono">${GB.monthCount(st, o.id, m)}/${s.maxTotal}</b> コマ。`,
        firstAll: `先着の受付中です。この月 <b class="mono">${GB.monthCount(st, o.id, m)}/${s.maxTotal}</b> コマ。`,
      }[ph];
      return `<li><div><b>${GB.ymLabel(m)}</b> ${pill(GB.PHASE[ph], PH_TONE[ph] || '')}</div><p>${lines}</p>${btn('時間割を見る', 'gocal', { m }, 'sm ghost')}</li>`;
    }).join('');
    return `<div class="grid2">
      <section class="card">
        <h2>${esc(o.name)}</h2>
        <p class="chips">${pill(GB.TYPES[o.type], o.type === 'club' ? 'reg' : '')}${pill(`${dn(o.districtId)}${o.inCity ? '' : '（学校体育館は使えません）'}`)}${o.status !== 'approved' ? pill('承認待ち', 'wait') : ''}${GB.suspended(st, o) ? pill(`${GB.md(o.suspendUntil)} まで停止中`, 'bad') : ''}</p>
        <dl class="kv">
          <dt>違反点数</dt><dd><span class="meter" style="--v:${Math.min(100, (o.points || 0) / s.ptLimit * 100)}"></span> <b class="mono">${o.points || 0}/${s.ptLimit}</b> 点</dd>
          <dt>前の抽選</dt><dd>${o.lossStreak ? `${o.lossStreak} 回続けて1つも当たらなかった（次の抽選のくじ ＋${Math.min(o.lossStreak, s.lossMax) * s.bonusLoss} 本）` : '—'}</dd>
          <dt>定期枠</dt><dd>${regs.length ? regs.map(r => `${D.WD[r.weekday]}曜 ${COLS[r.slotId]}・${esc(F(r.facilityId).name)}（${NEED[r.need]}）`).join('<br>') : 'なし'}</dd>
        </dl>
        ${o.status !== 'approved' ? '<p class="callout">市役所が登録を承認すると、申込と予約ができます（市役所の画面の「団体」で承認できます）。</p>' : ''}
      </section>
      <section class="card"><h2>いまの受付</h2><ul class="months">${cards}</ul></section>
    </div>
    ${pend.length ? `<section class="card attn"><h2>当選の確定（${pend.length} 件）</h2><p>確定の締切までに確定しないと、当選は取り消されます。</p><ul class="rows">${pend.map(b => `<li><span>${court(b.need, b.half)} ${when(b)}・${esc(F(b.facilityId).name)}<small>${GB.md(GB.schedule(st, D.ym(b.date)).confirmEnd)} まで</small></span><span class="row-btn">${btn('確定する', 'confirm', { id: b.id }, 'sm')}${btn('辞退する', 'cancel', { id: b.id }, 'sm ghost')}</span></li>`).join('')}</ul>${pend.length > 1 ? btn('まとめて確定する', 'confirm-all', {}, 'ghost') : ''}</section>` : ''}
    <section class="card"><h2>お知らせ</h2>${notes.length ? `<ul class="notes">${notes.map(n => `<li><span class="mono">${GB.md(n.at)}</span><p>${esc(n.text)}</p></li>`).join('')}</ul>` : '<p class="muted">まだありません。</p>'}</section>`;
  }
  function orgCal(o) {
    const m = ui.orgMonth = pickMonth(ui.orgMonth, GB.lotteryMonth(st));
    const f = F(ui.facId) || st.facilities[0];
    ui.facId = f.id;
    const ph = GB.phase(st, m), sc = GB.schedule(st, m), s = st.settings;
    const msg = {
      before: `${GB.ymLabel(m)}の抽選の申込は ${GB.md(sc.applyStart)} からです。`,
      apply: `${GB.ymLabel(m)}は抽選の申込期間です（${GB.md(sc.applyStart)}〜${GB.md(sc.applyEnd)}）。コマを押して申し込みます。申し込んだ順番は関係ありません。申込 ${GB.appCount(st, o.id, m)}/${s.maxApps} 件。`,
      closed: `${GB.ymLabel(m)}の申込は締め切りました。${GB.md(sc.draw)} に抽選します。`,
      drawing: `${GB.ymLabel(m)}の抽選を待っています。`,
      confirm: `${GB.ymLabel(m)}の抽選が終わりました。当選したコマは ${GB.md(sc.confirmEnd)} までに確定してください。`,
      settle: `${GB.ymLabel(m)}の先着の予約は ${GB.md(sc.firstCity)} からです。`,
      firstCity: `${GB.ymLabel(m)}は先着の受付中です（市内の団体）。空いているコマは、押してすぐ予約できます。この月 ${GB.monthCount(st, o.id, m)}/${s.maxTotal} コマ。`,
      firstAll: `${GB.ymLabel(m)}は先着の受付中です。空いているコマは、押してすぐ予約できます。この月 ${GB.monthCount(st, o.id, m)}/${s.maxTotal} コマ。`,
    }[ph];
    return `<div class="toolbar"><label class="pick">体育館 ${facSelect('fac', f.id)}</label>${monthSwitch(m, 'orgmonth')}</div>
      <p class="phase ${PH_TONE[ph] || ''}">${pill(GB.PHASE[ph], PH_TONE[ph] || '')} ${esc(msg)}</p>
      ${legend('org')}
      ${calendar(f, m, 'org')}`;
  }
  function orgList(o) {
    const apps = st.apps.filter(a => a.orgId === o.id).sort((a, b) => a.date < b.date ? 1 : a.date > b.date ? -1 : 0);
    const bks = st.bookings.filter(b => b.orgId === o.id).sort((a, b) => a.date < b.date ? 1 : a.date > b.date ? -1 : 0);
    const appRows = apps.map(a => {
      const f = F(a.facilityId), [t, tone] = APP[a.status];
      const tk = a.tickets || (a.status === 'applied' && f ? GB.tickets(st, o, f, GB.slot(st, f, a.date, a.slotId)).total : null);
      return `<tr><td class="mono">${GB.ymLabel(a.month)}</td><td>${when(a)}</td><td>${esc(f.name)}</td><td>${court(a.need)} ${NEED[a.need]}</td><td class="num">${tk ? `${tk} 本` : '—'}</td><td>${pill(t, tone)}</td><td class="wrap">${esc(a.reason || '')}</td><td>${a.status === 'applied' && GB.phase(st, a.month) === 'apply' ? btn('取り下げ', 'withdraw', { id: a.id }, 'sm ghost') : ''}</td></tr>`;
    }).join('');
    const bkRows = bks.map(b => {
      const f = F(b.facilityId), [t, tone] = BK[b.status];
      const act = b.status === 'pending' ? btn('確定', 'confirm', { id: b.id }, 'sm') + btn('辞退', 'cancel', { id: b.id }, 'sm ghost') : b.status === 'confirmed' && b.date > st.clock ? btn('キャンセル', 'cancel', { id: b.id }, 'sm warn') : '';
      return `<tr><td>${when(b)}</td><td>${esc(f.name)}</td><td>${court(b.need, b.half)} ${b.half ? `${b.half}面` : NEED[b.need]}</td><td>${b.source === 'lottery' ? '抽選' : '先着'}</td><td>${pill(t, tone)}</td><td><span class="row-btn">${act}</span></td></tr>`;
    }).join('');
    const regs = st.regulars.filter(r => r.orgId === o.id);
    return `<section class="card"><h2>抽選の申込</h2>${apps.length ? `<div class="tw"><table><thead><tr><th>月</th><th>日・コマ</th><th>体育館</th><th>区画</th><th class="num">くじ</th><th>結果</th><th>わけ</th><th></th></tr></thead><tbody>${appRows}</tbody></table></div>` : '<p class="muted">まだ申し込んでいません。「空きと申込」から申し込めます。</p>'}</section>
      <section class="card"><h2>予約</h2>${bks.length ? `<div class="tw"><table><thead><tr><th>日・コマ</th><th>体育館</th><th>区画</th><th>方法</th><th>状態</th><th></th></tr></thead><tbody>${bkRows}</tbody></table></div>` : '<p class="muted">まだ予約はありません。</p>'}</section>
      <section class="card"><h2>定期枠</h2>${regs.length ? `<ul class="dots">${regs.map(r => `<li>${D.WD[r.weekday]}曜 ${COLS[r.slotId]}・${esc(F(r.facilityId).name)}（${NEED[r.need]}、${GB.md(r.from)}〜${r.to.slice(0, 4)}/${GB.md(r.to)}）</li>`).join('')}</ul>` : '<p class="muted">定期枠はありません（年度はじめの調整会議で決めます）。</p>'}</section>`;
  }

  /* ---- 学校の画面 ---- */
  function schoolView() {
    const schools = st.facilities.filter(f => f.kind === 'school');
    const f = schools.find(x => x.id === ui.schoolFac) || schools[0];
    if (!f) return '<p class="muted">学校体育館が登録されていません。</p>';
    ui.schoolFac = f.id;
    const tabs = [['cal', '予定'], ['block', '学校で使う日'], ['check', '利用の確認']];
    const waiting = st.bookings.filter(b => b.facilityId === f.id && b.status === 'confirmed' && b.date <= st.clock).length;
    return `<div class="subbar"><label class="pick">学校 ${facSelect('school', f.id, x => x.kind === 'school')}</label>
      <nav class="tabs" aria-label="学校の画面">${tabs.map(([k, l]) => `<button type="button" class="tab${ui.schoolTab === k ? ' on' : ''}" data-act="schooltab" data-tab="${k}">${l}${k === 'check' && waiting ? ` <span class="num-badge">${waiting}</span>` : ''}</button>`).join('')}</nav></div>
      ${ui.schoolTab === 'block' ? schoolBlocks(f) : ui.schoolTab === 'check' ? schoolCheck(f) : schoolCal(f)}`;
  }
  function schoolCal(f) {
    const m = ui.schoolMonth = pickMonth(ui.schoolMonth, D.ym(st.clock));
    return `<div class="toolbar">${monthSwitch(m, 'schoolmonth')}</div>
      <p class="phase">コマを押すと、だれが使うかの確認と、学校で使う日の登録ができます。学校開放の運営委員会（地域の方）が使う想定にもできます。</p>
      ${legend('school')}${calendar(f, m, 'school')}`;
  }
  function schoolBlocks(f) {
    const list = st.blocks.filter(b => b.facilityId === f.id && b.date >= st.clock).sort((a, b) => a.date < b.date ? -1 : 1);
    const slotOpts = [['', '終日'], ...Object.keys(COLS).filter(id => ['weekday', 'holiday'].some(dt => (st.settings.slots.school[dt] || []).some(x => x.id === id))).map(id => [id, COLS[id]])];
    return `<section class="card"><h2>学校で使う日を登録する</h2>
      <form class="form" data-form="block-tab"><input type="hidden" name="f" value="${f.id}">
        <label>日付 <input type="date" name="d" id="blk-date" min="${D.add(st.clock, 1)}" required></label>
        <label>コマ <select name="s" id="blk-slot">${slotOpts.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select></label>
        <label class="grow">理由 <input name="reason" id="blk-reason2" value="学校行事" maxlength="30"></label>
        <button class="btn">登録する</button>
      </form>
      <p class="muted small">入っていた予約・申込・定期枠の団体には、自動でお知らせが届きます（違反にはなりません）。</p></section>
      <section class="card"><h2>これからの登録</h2>${list.length ? `<div class="tw"><table><thead><tr><th>日付</th><th>コマ</th><th>理由</th><th>登録</th><th></th></tr></thead><tbody>${list.map(b => `<tr><td>${GB.mdw(b.date)}</td><td>${b.slotId ? COLS[b.slotId] : '終日'}</td><td>${esc(b.reason)}</td><td>${b.kind === 'school' ? '学校' : '市役所'}</td><td>${b.kind === 'school' ? btn('取り消す', 'unblock', { id: b.id }, 'sm ghost') : ''}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">登録はありません。</p>'}</section>`;
  }
  function schoolCheck(f) {
    const wait = st.bookings.filter(b => b.facilityId === f.id && b.status === 'confirmed' && b.date <= st.clock).sort((a, b) => a.date < b.date ? -1 : 1);
    const doneList = st.bookings.filter(b => b.facilityId === f.id && ['used', 'noshow'].includes(b.status)).sort((a, b) => a.date < b.date ? 1 : -1).slice(0, 12);
    const s = st.settings;
    return `<section class="card"><h2>利用の確認（${wait.length} 件）</h2><p>予約した団体が実際に使ったかを記録します。「使わなかった」にすると、その団体に違反 ${s.ptNoShow} 点がつきます。</p>
      ${wait.length > 1 ? `<div class="row-btn">${btn(`${wait.length} 件をまとめて「使った」にする`, 'use-all', { f: f.id }, 'ghost')}</div>` : ''}
      ${wait.length ? `<ul class="rows">${wait.map(b => `<li><span>${when(b)}・<b>${esc(O(b.orgId).name)}</b>（${b.half ? `${b.half}面` : NEED[b.need]}）</span><span class="row-btn">${btn('使った', 'use', { id: b.id, v: 1 }, 'sm')}${btn('使わなかった', 'use', { id: b.id, v: 0 }, 'sm warn')}</span></li>`).join('')}</ul>` : '<p class="muted">確認を待っている予約はありません。日付を進めると、使い終わった予約がここに出ます。</p>'}</section>
      <section class="card"><h2>確認ずみ</h2>${doneList.length ? `<ul class="rows">${doneList.map(b => `<li><span>${when(b)}・${esc(O(b.orgId).name)}</span>${pill(BK[b.status][0], BK[b.status][1])}</li>`).join('')}</ul>` : '<p class="muted">まだありません。</p>'}</section>`;
  }

  /* ---- 市役所の画面 ---- */
  function adminView() {
    const tabs = [['overview', '概要'], ['cal', '予定'], ['lottery', '抽選'], ['orgs', '団体'], ['facilities', '施設'], ['regular', '定期枠・大会'], ['rules', 'ルール'], ['data', 'データ']];
    const pending = st.orgs.filter(o => o.status !== 'approved').length;
    const body = { cal: adminCal, lottery: adminLottery, orgs: adminOrgs, facilities: adminFacilities, regular: adminRegular, rules: adminRules, data: adminData }[ui.adminTab] || adminOverview;
    return `<div class="subbar"><nav class="tabs" aria-label="市役所の画面">${tabs.map(([k, l]) => `<button type="button" class="tab${ui.adminTab === k ? ' on' : ''}" data-act="admintab" data-tab="${k}">${l}${k === 'orgs' && pending ? ` <span class="num-badge">${pending}</span>` : ''}</button>`).join('')}</nav></div>
      ${pendingBanner()}${body()}`;
  }
  function adminCal() {
    const f = F(ui.adminFac) || st.facilities[0];
    ui.adminFac = f.id;
    const m = ui.adminMonth = pickMonth(ui.adminMonth, D.ym(st.clock));
    return `<div class="toolbar"><label class="pick">体育館 ${facSelect('adminfac', f.id)}</label>${monthSwitch(m, 'adminmonth')}</div>
      <p class="phase">コマを押すと、申込の一覧（くじの本数つき）と、くじの結果を見られます。大会などの優先確保もここからできます。</p>
      ${legend('admin')}${calendar(f, m, 'admin')}`;
  }
  function adminOverview() {
    const L = GB.lotteryMonth(st), ym = D.ym(st.clock);
    const apps = st.apps.filter(a => a.month === L && a.status !== 'withdrawn');
    const keys = {};
    for (const a of apps) keys[`${a.facilityId}|${a.date}|${a.slotId}`] = (keys[`${a.facilityId}|${a.date}|${a.slotId}`] || 0) + 1;
    const contested = Object.values(keys).filter(n => n > 1).length;
    const now = st.bookings.filter(b => D.ym(b.date) === ym);
    const cnt = k => now.filter(b => k.includes(b.status)).length;
    return `<section class="card"><h2>${GB.ymLabel(L)}の流れ</h2>${timeline(L)}</section>
      <div class="tiles">
        <div class="tile"><span>${GB.ymLabel(L)}の申込</span><b class="mono">${apps.length}</b><small>件</small></div>
        <div class="tile"><span>申し込んだ団体</span><b class="mono">${new Set(apps.map(a => a.orgId)).size}</b><small>団体</small></div>
        <div class="tile"><span>取り合いのコマ</span><b class="mono">${contested}</b><small>コマ（申込 2 件以上）</small></div>
        <div class="tile"><span>承認待ちの団体</span><b class="mono">${st.orgs.filter(o => o.status !== 'approved').length}</b><small>団体</small></div>
      </div>
      <section class="card"><h2>混み具合（${GB.ymLabel(L)}）</h2><p class="small muted">大きな数字は、申込の区画数 ÷ 抽選にかけられる区画数（月の平均。学校行事・大会・定期枠はのぞく）。「取り合い」は、空きより申込が多く、だれかが落選するコマの数です。</p>${heat(L)}</section>
      <section class="card"><h2>${+ym.slice(5)}月の利用</h2><ul class="facts row">
        <li><b class="mono">${cnt(['confirmed', 'pending'])}</b> コマ<span>これからの予約</span></li>
        <li><b class="mono">${cnt(['used'])}</b> コマ<span>使った</span></li>
        <li><b class="mono">${now.filter(b => b.status === 'confirmed' && b.date <= st.clock).length}</b> コマ<span>学校の確認待ち</span></li>
        <li><b class="mono">${cnt(['noshow'])}</b> コマ<span>使わなかった</span></li>
      </ul></section>`;
  }
  function heat(m) {
    const kinds = [...new Set(st.facilities.map(f => f.kind))];
    const cols = [];
    for (const dt of ['weekday', 'holiday']) for (const id of Object.keys(COLS))
      if (kinds.some(k => ((st.settings.slots[k] || {})[dt] || []).some(x => x.id === id))) cols.push([dt, id]);
    const want = {}, bare = { ...st, bookings: [] };
    for (const a of st.apps) if (a.month === m && a.status !== 'withdrawn') {
      const k = `${a.facilityId}|${a.date}|${a.slotId}`;
      want[k] = (want[k] || 0) + (a.need === 'full' ? GB.units(F(a.facilityId)).length : 1);
    }
    const rows = st.facilities.map(f => {
      const tds = cols.map(([dt, id]) => {
        let supply = 0, need = 0, fights = 0, exists = false;
        for (const d of D.list(m)) {
          if (GB.dayType(d) !== dt || !GB.slot(st, f, d, id)) continue;
          exists = true;
          const free = GB.occupancy(bare, f, d, id).free.length, w = want[`${f.id}|${d}|${id}`] || 0;
          supply += free; need += w;
          if (w > free) fights++;
        }
        if (!exists) return '<td class="na">—</td>';
        const r = supply ? need / supply : (need ? 9 : 0), v = Math.round(Math.min(1, r / 1.5) * 80);
        return `<td style="--v:${v}"${v > 46 ? ' class="hot"' : ''}><b class="mono">${r.toFixed(1)}</b><small>${fights ? `取り合い ${fights}` : `${need}/${supply}`}</small></td>`;
      }).join('');
      return `<tr><th scope="row">${esc(f.name)}</th>${tds}</tr>`;
    }).join('');
    return `<div class="tw"><table class="heat"><thead><tr><th></th>${cols.map(([dt, id]) => `<th>${dt === 'weekday' ? '平日' : '土日祝'}<br>${COLS[id]}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>`;
  }
  function adminLottery() {
    const L = GB.lotteryMonth(st);
    const months = [...new Set([...st.runs.map(r => r.month), ...monthsFor().filter(m => GB.phase(st, m) !== 'before')])].sort();
    const m = ui.runMonth = months.includes(ui.runMonth) ? ui.runMonth : (months.includes(L) ? L : months[months.length - 1]);
    const sc = GB.schedule(st, m), run = sc.run;
    const seg = `<div class="seg" role="group" aria-label="月">${months.map(x => `<button type="button" class="${x === m ? 'on' : ''}" data-act="runmonth" data-m="${x}" aria-pressed="${x === m}">${+x.slice(5)}月分</button>`).join('')}</div>`;
    if (!run) {
      const apps = st.apps.filter(a => a.month === m && a.status === 'applied');
      if (!ui.seed) ui.seed = newSeed(m);
      const ph = GB.phase(st, m);
      return `<div class="toolbar">${seg}</div><section class="card"><h2>${GB.ymLabel(m)}の抽選</h2>
        <p>${pill(GB.PHASE[ph], PH_TONE[ph] || '')} 申込 <b class="mono">${apps.length}</b> 件（${new Set(apps.map(a => a.orgId)).size} 団体）。抽選日は ${GB.md(sc.draw)} です。</p>
        <form class="form" data-form="draw"><input type="hidden" name="m" value="${m}">
          <label class="grow">シード（抽選に使う言葉や数字） <input name="seed" id="seed" value="${esc(ui.seed)}" maxlength="40" required></label>
          <button class="btn">${st.clock < sc.draw ? `申込を締め切って抽選する（きょうを ${GB.md(sc.draw)} にします）` : '抽選する'}</button>
        </form>
        <p class="small muted">シードは、抽選のあとに公開します。同じ申込と同じシードなら、だれがやっても同じ結果になります。本番では、公開の場でサイコロを振るなどしてシードを決めます。</p></section>`;
    }
    const res = Object.entries(run.results);
    const count = k => res.filter(([, r]) => r.status === k).length;
    const by = { type: {}, district: {} }, perOrg = {};
    for (const [appId, r] of res) {
      const a = GB.find(st.apps, appId), o = a && O(a.orgId);
      if (!o) continue;
      for (const [g, k] of [['type', o.type], ['district', o.districtId || '']]) { const x = by[g][k] = by[g][k] || { apps: 0, won: 0, lost: 0, invalid: 0 }; x.apps++; x[r.status]++; }
      const y = perOrg[o.id] = perOrg[o.id] || { apps: 0, won: 0, ok: 0 }; y.apps++; if (r.status === 'won') y.won++; if (r.status !== 'invalid') y.ok++;
    }
    const rate = x => x.won + x.lost ? `${Math.round(x.won / (x.won + x.lost) * 100)}％` : '—';
    const table = (g, label) => `<div class="tw"><table class="plain"><thead><tr><th>${label}</th><th class="num">申込</th><th class="num">当選</th><th class="num">当選率</th></tr></thead><tbody>${Object.entries(by[g]).map(([k, x]) => `<tr><td>${g === 'type' ? GB.TYPES[k] : esc(dn(k))}</td><td class="num">${x.apps}</td><td class="num">${x.won}</td><td class="num">${rate(x)}</td></tr>`).join('')}</tbody></table></div>`;
    const zero = Object.entries(perOrg).filter(([, y]) => y.ok && !y.won).map(([id]) => O(id));
    const log = runLog(run), groups = {};
    for (const e of log) (groups[e.key] = groups[e.key] || []).push(e);
    const hot = Object.entries(groups).filter(([, es]) => es[0].cands.length > 1).sort((a, b) => b[1][0].cands.length - a[1][0].cands.length || (a[0] < b[0] ? -1 : 1)).slice(0, 10);
    const v = ui.verified[m];
    return `<div class="toolbar">${seg}</div>
      <div class="tiles">
        <div class="tile"><span>申込</span><b class="mono">${res.length}</b><small>件</small></div>
        <div class="tile ok"><span>当選</span><b class="mono">${count('won')}</b><small>件</small></div>
        <div class="tile"><span>落選</span><b class="mono">${count('lost')}</b><small>件</small></div>
        <div class="tile"><span>対象外</span><b class="mono">${count('invalid')}</b><small>件</small></div>
      </div>
      <section class="card"><h2>${GB.ymLabel(m)}の抽選の記録</h2>
        <dl class="kv"><dt>シード</dt><dd><code>${esc(run.seed)}</code></dd><dt>抽選した日</dt><dd>${GB.mdw(run.at)}</dd><dt>確定の締切</dt><dd>${GB.mdw(run.confirmBy)}</dd></dl>
        <div class="row-btn">${btn('同じシードでやり直して確かめる', 'verify', { m })}</div>
        ${v === undefined ? '' : `<p class="${v ? 'okmsg' : 'badmsg'}">${v ? `やり直しても、${res.length} 件すべて同じ結果になりました。` : '結果がちがいます。記録が書きかえられた可能性があります。'}</p>`}
      </section>
      <div class="grid2"><section class="card"><h2>区分ごと</h2>${table('type', '区分')}</section><section class="card"><h2>地区ごと</h2>${table('district', '地区')}</section></div>
      <section class="card"><h2>1つも当たらなかった団体</h2>${zero.length ? `<p>${zero.map(o => esc(o.name)).join('、')}</p><p class="small muted">次の抽選では、くじが ${st.settings.bonusLoss} 本ずつ増えます。</p>` : '<p class="muted">ありません。申し込んだ団体は、どこも1コマ以上当たりました。</p>'}</section>
      <section class="card"><h2>取り合いになったコマ</h2><p class="small muted">くじの本数のぶんだけ番号を持ち、引いた番号の持ち主が当たります。</p>
        ${hot.length ? hot.map(([key, es]) => { const [fid, d, sid] = key.split('|'), f = F(fid); return `<div class="hot-slot"><h3>${GB.mdw(d)} ${slotOf(f, d, sid).label}・${esc(f.name)}</h3>${es.map(e => kuji(e, 'admin')).join('')}</div>`; }).join('') : '<p class="muted">取り合いはありませんでした。</p>'}
      </section>`;
  }
  function adminOrgs() {
    const dOpts = [...st.districts.map(d => [d.id, d.name]), ['', '市外']];
    const s = st.settings;
    const rows = st.orgs.map(o => `<tr><td>${esc(o.name)}</td>
      <td>${sel('org-type', Object.entries(GB.TYPES), o.type, `data-id="${o.id}" aria-label="区分"`)}</td>
      <td>${sel('org-dist', dOpts, o.inCity ? o.districtId : '', `data-id="${o.id}" aria-label="地区"`)}</td>
      <td>${o.status === 'approved' ? pill('承認済み', 'ok') : btn('承認する', 'approve', { id: o.id }, 'sm')}${GB.suspended(st, o) ? ' ' + pill(`${GB.md(o.suspendUntil)} まで停止`, 'bad') : ''}</td>
      <td class="num">${o.points || 0}/${s.ptLimit}${o.points ? ' ' + btn('0 にする', 'resetpts', { id: o.id }, 'sm ghost') : ''}</td>
      <td class="num">${o.lossStreak || 0}</td></tr>`).join('');
    return `<section class="card"><h2>登録団体（${st.orgs.length}）</h2><div class="tw"><table><thead><tr><th>団体</th><th>区分</th><th>地区</th><th>状態</th><th class="num">違反点数</th><th class="num">続けてはずれ</th></tr></thead><tbody>${rows}</tbody></table></div>
      <p class="small muted">区分を「認定地域クラブ」にするのは、市が部活動の受け皿として認定したクラブです。オンライン化すると登録の申請が急に増えることがあるので（港区の例）、登録の条件（人数・市内に住む人の割合など）を先に決めておきます。</p></section>
      <section class="card"><h2>団体を登録する</h2><form class="form" data-form="addorg">
        <label class="grow">名前 <input name="name" id="org-name" maxlength="40" required placeholder="例：東部ジュニアバレー"></label>
        <label>区分 <select name="type" id="org-type">${Object.entries(GB.TYPES).map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select></label>
        <label>地区 <select name="dist" id="org-dist">${dOpts.map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select></label>
        <button class="btn">登録する（承認待ちになります）</button></form></section>`;
  }
  function adminFacilities() {
    const dOpts = st.districts.map(d => [d.id, d.name]);
    const rows = st.facilities.map(f => `<tr>
      <td><input data-ch="fac-name" data-id="${f.id}" value="${esc(f.name)}" aria-label="施設の名前" maxlength="40"></td>
      <td>${sel('fac-kind', Object.entries(GB.KINDS), f.kind, `data-id="${f.id}" aria-label="種類"`)}</td>
      <td>${sel('fac-dist', dOpts, f.districtId, `data-id="${f.id}" aria-label="地区"`)}</td>
      <td>${sel('fac-areas', [[1, '全面だけ'], [2, '半面ずつ（A・B）']], f.areas, `data-id="${f.id}" aria-label="区画"`)}</td>
      <td class="num">${GB.regularShare(st, f)}％</td></tr>`).join('');
    return `<section class="card"><h2>体育館（${st.facilities.length}）</h2><div class="tw"><table><thead><tr><th>名前</th><th>種類</th><th>地区</th><th>区画</th><th class="num">定期枠の割合</th></tr></thead><tbody>${rows}</tbody></table></div>
      <p class="small muted">名前はその場で書きかえられます。デモで実際の体育館の名前を入れて見せるときに使ってください。</p></section>
      <section class="card"><h2>体育館を足す</h2><form class="form" data-form="addfac">
        <label class="grow">名前 <input name="name" id="fac-name" maxlength="40" required placeholder="例：西部中学校 体育館"></label>
        <label>種類 <select name="kind" id="fac-kind">${Object.entries(GB.KINDS).map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select></label>
        <label>地区 <select name="dist" id="fac-dist">${dOpts.map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select></label>
        <label>区画 <select name="areas" id="fac-areas"><option value="2">半面ずつ（A・B）</option><option value="1">全面だけ</option></select></label>
        <button class="btn">足す</button></form></section>`;
  }
  function adminRegular() {
    const s = st.settings;
    const rf = ui.regForm = Object.assign({ f: st.facilities[0].id, w: 1, s: '', n: 'full', o: st.orgs[0].id }, ui.regForm);
    const fac = F(rf.f) || st.facilities[0];
    const dt = +rf.w === 0 || +rf.w === 6 ? 'holiday' : 'weekday';
    const slotOpts = (s.slots[fac.kind][dt] || []).map(x => [x.id, `${x.label} ${GB.time(x)}`]);
    if (!slotOpts.some(([id]) => id === rf.s)) rf.s = slotOpts.length ? slotOpts[0][0] : '';
    const regs = st.regulars.filter(r => r.to >= st.clock).sort((a, b) => a.facilityId.localeCompare(b.facilityId) || a.weekday - b.weekday);
    const events = st.blocks.filter(b => b.kind === 'event' && b.date >= st.clock).sort((a, b) => a.date < b.date ? -1 : 1);
    const evFac = F(ui.evFac) || st.facilities[st.facilities.length - 1];
    return `<section class="card"><h2>定期枠（${regs.length}）</h2>
      <p class="small muted">年度はじめの調整会議で決めた、毎週の枠です。1団体 週 ${s.maxRegular} コマまで、各体育館のコマの ${s.regularMax}％ まで。平日の定期枠は祝日には休みです。</p>
      <div class="tw"><table><thead><tr><th>体育館</th><th>曜日</th><th>コマ</th><th>区画</th><th>団体</th><th>期間</th><th></th></tr></thead><tbody>
      ${regs.map(r => `<tr><td>${esc(F(r.facilityId).name)}</td><td>${D.WD[r.weekday]}曜</td><td>${COLS[r.slotId]}</td><td>${r.half ? `${r.half}面` : NEED[r.need]}</td><td>${esc(O(r.orgId).name)}</td><td class="mono">〜${r.to.slice(0, 4)}/${GB.md(r.to)}</td><td>${btn('削除', 'delreg', { id: r.id }, 'sm ghost')}</td></tr>`).join('')}
      </tbody></table></div>
      <p class="chips">${st.facilities.map(f => pill(`${f.name.replace(/ 体育館$/, '')} ${GB.regularShare(st, f)}％`, GB.regularShare(st, f) > s.regularMax ? 'bad' : '')).join('')}</p>
      <h3>定期枠を足す</h3>
      <form class="form" data-form="addreg">
        <label>体育館 ${sel('reg-f', st.facilities.map(f => [f.id, f.name]), rf.f, 'id="reg-f" name="f"')}</label>
        <label>曜日 ${sel('reg-w', [1, 2, 3, 4, 5, 6, 0].map(w => [w, `${D.WD[w]}曜`]), rf.w, 'id="reg-w" name="w"')}</label>
        <label>コマ ${sel('reg-s', slotOpts, rf.s, 'id="reg-s" name="s"')}</label>
        <label>区画 ${sel('reg-n', fac.areas > 1 ? [['full', '全面'], ['half', '半面']] : [['full', '全面']], rf.n, 'id="reg-n" name="n"')}</label>
        <label class="grow">団体 ${sel('reg-o', st.orgs.filter(o => o.status === 'approved').map(o => [o.id, o.name]), rf.o, 'id="reg-o" name="o"')}</label>
        <button class="btn">足す</button>
      </form></section>
      <section class="card"><h2>大会・市の行事（優先確保）</h2>
      ${events.length ? `<div class="tw"><table><thead><tr><th>日付</th><th>体育館</th><th>コマ</th><th>理由</th><th></th></tr></thead><tbody>${events.map(b => `<tr><td>${GB.mdw(b.date)}</td><td>${esc(F(b.facilityId).name)}</td><td>${b.slotId ? COLS[b.slotId] : '終日'}</td><td>${esc(b.reason)}</td><td>${btn('取り消す', 'unblock', { id: b.id }, 'sm ghost')}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">これからの優先確保はありません。</p>'}
      <form class="form" data-form="addevent">
        <label>体育館 ${sel('ev-f', st.facilities.map(f => [f.id, f.name]), evFac.id, 'id="ev-f" name="f"')}</label>
        <label>日付 <input type="date" name="d" id="ev-d" min="${D.add(st.clock, 1)}" required></label>
        <label>コマ <select name="s" id="ev-s"><option value="">終日</option>${Object.keys(COLS).filter(id => ['weekday', 'holiday'].some(dt => (s.slots[evFac.kind][dt] || []).some(x => x.id === id))).map(id => `<option value="${id}">${COLS[id]}</option>`).join('')}</select></label>
        <label class="grow">理由 <input name="reason" id="ev-r" value="大会" maxlength="30"></label>
        <button class="btn">確保する</button>
      </form><p class="small muted">入っていた予約・申込・定期枠の団体には、自動でお知らせが届きます。</p></section>`;
  }
  function adminRules() {
    const s = st.settings;
    const num = (k, label, unit, v = k.split('.').reduce((o, p) => o[p], s)) =>
      `<label class="num-in"><span>${label}</span><span><input type="number" inputmode="numeric" min="0" step="1" data-ch="set" data-k="${k}" id="set-${k.replace(/\./g, '-')}" value="${v}"> ${unit}</span></label>`;
    const slotRows = [];
    for (const k of Object.keys(s.slots)) for (const dt of ['weekday', 'holiday']) s.slots[k][dt].forEach((x, i) => {
      const base = `slots.${k}.${dt}.${i}`;
      slotRows.push(`<tr><td>${GB.KINDS[k]}</td><td>${dt === 'weekday' ? '平日' : '土日祝'}</td><td>${esc(x.label)}</td>
        <td><input type="time" data-ch="set" data-k="${base}.start" value="${x.start}" aria-label="${GB.KINDS[k]} ${x.label} 開始" id="set-${base.replace(/\./g, '-')}-start"> – <input type="time" data-ch="set" data-k="${base}.end" value="${x.end}" aria-label="${GB.KINDS[k]} ${x.label} 終了" id="set-${base.replace(/\./g, '-')}-end"></td>
        <td class="checks">${Object.keys(GB.TYPES).map(t => `<label><input type="checkbox" data-ch="prio" data-k="${base}" data-t="${t}"${(x.prio || []).includes(t) ? ' checked' : ''}> ${GB.TYPE_SHORT[t]}</label>`).join('')}</td></tr>`);
    });
    return `<p class="phase">ここで変えた内容は、すぐに「しくみ」の説明と、申込・抽選の判定に反映されます。</p>
      <div class="grid2">
        <section class="card"><h2>日程（利用月の${s.lead === 1 ? '前月' : '2か月前の月'}の日にち）</h2><div class="nums">
          <label class="num-in"><span>抽選する月</span><span>${sel('lead', [[1, '利用月の前月'], [2, '利用月の2か月前']], s.lead, 'id="set-lead"')}</span></label>
          ${num('applyStart', '申込の開始', '日')}${num('applyEnd', '申込の締切', '日')}${num('drawDay', '抽選日', '日')}${num('confirmEnd', '確定の締切', '日')}${num('firstCity', '先着（市内の団体）', '日から')}${num('firstAll', '先着（だれでも）', '日から')}${num('bookUntil', '先着の予約の締切', '日前まで')}
        </div></section>
        <section class="card"><h2>上限</h2><div class="nums">
          ${num('maxApps', '抽選の申込', '件／月')}${num('maxWins', '抽選の当選', 'コマ／月')}${num('maxTotal', '抽選＋先着の合計', 'コマ／月')}${num('maxPerDay', '1日に使える', 'コマ')}${num('maxRegular', '定期枠（1団体）', 'コマ／週')}${num('regularMax', '定期枠（体育館ごと）', '％まで')}
        </div></section>
        <section class="card"><h2>くじの本数</h2><div class="nums">
          ${Object.keys(GB.TYPES).map(t => num(`tickets.${t}`, GB.TYPES[t], '本')).join('')}
          ${num('bonusDistrict', '地区内の体育館', '本 加える')}${num('bonusPriority', '優先時間帯', '本 加える')}${num('bonusLoss', '前の月に全部はずれ', '本 加える')}${num('lossMax', '「全部はずれ」を数える上限', '回')}
        </div></section>
        <section class="card"><h2>違反と停止</h2><div class="nums">
          ${num('freeCancelDays', '違反にならないキャンセル', '日前まで')}${num('ptLate', '直前のキャンセル', '点')}${num('ptNoShow', '無断で使わなかった', '点')}${num('ptLimit', '停止になる点数', '点')}${num('suspendMonths', '停止の長さ', 'か月')}
        </div></section>
        <section class="card"><h2>使える団体</h2><div class="nums">
          <label class="num-in"><span>営利の団体と学校体育館</span><span>${sel('commercial', [['none', '使えない'], ['first', '抽選のあとの先着だけ'], ['lottery', '抽選も使える']], s.commercialSchool, 'id="set-commercial"')}</span></label>
          <label class="num-in"><span>市外の団体の抽選</span><span><label><input type="checkbox" data-ch="flag" data-k="outsideLottery" id="set-outside"${s.outsideLottery ? ' checked' : ''}> 申し込める</label></span></label>
          <label class="num-in"><span>コマごとの申込の件数</span><span><label><input type="checkbox" data-ch="flag" data-k="showCounts" id="set-counts"${s.showCounts ? ' checked' : ''}> 団体に見せる</label></span></label>
        </div></section>
      </div>
      <section class="card"><h2>コマと優先時間帯</h2><p class="small muted">チェックした区分は、そのコマでくじが ${s.bonusPriority} 本増えます。</p>
        <div class="tw"><table><thead><tr><th>施設</th><th>日</th><th>コマ</th><th>時間</th><th>優先する区分</th></tr></thead><tbody>${slotRows.join('')}</tbody></table></div></section>
      <div class="row-btn">${btn('ルールを既定に戻す', 'rules-default', {}, 'ghost')}</div>`;
  }
  function adminData() {
    const m = ui.csvMonth = pickMonth(ui.csvMonth, D.ym(st.clock));
    const LIVE = ['pending', 'confirmed', 'used', 'noshow'];
    const lines = [['日付', '曜日', 'コマ', '時間', '体育館', '区画', '団体', '区分', '方法', '状態']];
    for (const b of st.bookings.filter(b => D.ym(b.date) === m && LIVE.includes(b.status)).sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0)) {
      const f = F(b.facilityId), s = slotOf(f, b.date, b.slotId), o = O(b.orgId);
      lines.push([b.date, D.WD[D.wd(b.date)], s.label, GB.time(s), f.name, b.half ? `${b.half}面` : NEED[b.need], o.name, GB.TYPE_SHORT[o.type], b.source === 'lottery' ? '抽選' : '先着', BK[b.status][0]]);
    }
    const csv = lines.map(r => r.map(c => /[",\n]/.test(String(c)) ? `"${String(c).replace(/"/g, '""')}"` : c).join(',')).join('\n');
    const json = JSON.stringify(st);
    return `<section class="card"><h2>予約の一覧（CSV）</h2><div class="toolbar">${monthSwitch(m, 'csvmonth')}</div>
      <textarea id="csv-out" readonly rows="8">${esc(csv)}</textarea>
      <div class="row-btn">${btn('コピーする', 'copy', { t: 'csv-out' })}${ENV.artifact ? '' : btn('ファイルに保存', 'download', { t: 'csv-out', name: `体育館よやく_${m}.csv` }, 'ghost')}</div></section>
      <section class="card"><h2>全部のデータ（JSON）</h2><p class="small muted">この試作のデータは、このブラウザの中にだけあります。ほかのパソコンに移すときは、ここでコピーして、移したい先の「読み込む」に貼りつけます。</p>
      <textarea id="json-out" readonly rows="4">${esc(json)}</textarea>
      <div class="row-btn">${btn('コピーする', 'copy', { t: 'json-out' })}${ENV.artifact ? '' : btn('ファイルに保存', 'download', { t: 'json-out', name: '体育館よやく_データ.json' }, 'ghost')}</div>
      <form class="form" data-form="import"><label class="grow">読み込む（JSON を貼りつける）<textarea name="json" id="json-in" rows="3" required></textarea></label><button class="btn ghost">読み込む</button></form></section>
      <section class="card"><h2>サンプルに戻す</h2><p>入力した内容を消して、最初のサンプルの状態に戻します。</p>
      <div class="row-btn">${ui.confirmReset ? `${btn('消してサンプルに戻す', 'reset', {}, 'warn')}${btn('やめる', 'reset-no', {}, 'ghost')}` : btn('サンプルに戻す', 'reset-ask', {}, 'ghost')}</div></section>`;
  }

  /* ---- コマの詳しい画面（下から出る） ---- */
  function sheetView() {
    const { f: facId, d: date, s: slotId } = ui.sheet, f = F(facId), sl = f && GB.slot(st, f, date, slotId);
    if (!sl) { ui.sheet = null; return ''; }
    const m = D.ym(date), ph = GB.phase(st, m), sc = GB.schedule(st, m), occ = GB.occupancy(st, f, date, slotId);
    const role = ui.view, me = role === 'org' ? O(ui.orgId) : null;
    const apps = st.apps.filter(a => a.facilityId === facId && a.date === date && a.slotId === slotId && a.status !== 'withdrawn').sort((a, b) => idn(a.id) - idn(b.id));
    const names = {};
    let k = 0;
    for (const a of apps) if (!(a.orgId in names)) names[a.orgId] = me && a.orgId === me.id ? 'あなた' : role === 'org' ? `団体${'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[k++] || k}` : (O(a.orgId) || {}).name;
    const parts = [unitsBlock(f, occ, role, me), lotteryBlock(f, date, sl, apps, ph, sc, role, me, names)];
    if (role === 'org') parts.push(orgActions(f, date, sl, apps, ph, sc, me));
    else if (role === 'school') parts.push(schoolActions(f, date, sl, occ));
    else if (role === 'admin') parts.push(adminActions(f, date, sl, occ));
    return `<div class="sheet-bg" data-act="close"></div>
      <section class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-h">
        <header class="sheet-h"><div><h2 id="sheet-h" tabindex="-1">${GB.mdw(date)} ${esc(sl.label)} <span class="mono">${GB.time(sl)}</span></h2>
        <p>${esc(f.name)}・${f.areas > 1 ? '半面ずつ使える（A面・B面）' : '全面だけ'}　${pill(`${GB.ymLabel(m)}：${GB.PHASE[ph]}`, PH_TONE[ph] || '')}</p></div>
        <button type="button" class="x" data-act="close" aria-label="閉じる">×</button></header>
        ${parts.join('')}
      </section>`;
  }
  function unitsBlock(f, occ, role, me) {
    if (occ.block) return `<div class="sec"><p class="blockmsg">${esc(occ.block.reason)}（${occ.block.kind === 'school' ? '学校' : '市役所'}が登録）のため、このコマは使えません。</p></div>`;
    const rows = [], seen = new Set();
    for (const u of occ.units) {
      const it = occ.by[u];
      if (it && seen.has(it)) continue;
      if (it) seen.add(it);
      const lab = occ.units.length === 1 || (it && occ.by.A === occ.by.B) ? '全面' : `${u}面`;
      let txt = '<span class="muted">空き</span>';
      if (it) {
        const mine = me && it.orgId === me.id;
        const name = role === 'org' && !mine ? 'ほかの団体' : mine ? 'あなた' : esc(O(it.orgId).name);
        txt = it.kind === 'regular' ? `${pill('定期枠', 'reg')} ${name}` : `${pill(it.ref.source === 'lottery' ? '抽選' : '先着')} ${name} ${pill(BK[it.ref.status][0], BK[it.ref.status][1])}`;
      }
      rows.push(`<li><span class="ul">${court(lab === '全面' ? 'full' : 'half', u)} ${lab}</span>${txt}</li>`);
    }
    return `<div class="sec"><h3>いまの状態</h3><ul class="units">${rows.join('')}</ul></div>`;
  }
  function lotteryBlock(f, date, sl, apps, ph, sc, role, me, names) {
    const s = st.settings, out = [], pre = ['before', 'apply', 'closed', 'drawing'].includes(ph);
    if (sl.prio && sl.prio.length) out.push(`<p class="note">優先時間帯：${sl.prio.map(t => GB.TYPE_SHORT[t]).join('・')}は、くじ ＋${s.bonusPriority} 本</p>`);
    if (me) { const t = GB.tickets(st, me, f, sl); out.push(`<p>あなたのくじ：<b class="mono">${t.total} 本</b>（${t.parts.map(p => `${esc(p[0])} ${p[1]}`).join('＋')}）</p>`); }
    if (pre) {
      const live = apps.filter(a => a.status === 'applied');
      if (role !== 'org' || s.showCounts) {
        const nf = live.filter(a => a.need === 'full').length;
        out.push(`<p>抽選の申込：<b class="mono">${live.length} 件</b>${live.length ? `（全面 ${nf}・半面 ${live.length - nf}）` : ''}</p>`);
      }
      if (role !== 'org' && live.length) out.push(`<div class="tw"><table class="plain"><thead><tr><th>団体</th><th>区画</th><th class="num">くじ</th><th>内訳</th></tr></thead><tbody>${live.map(a => { const t = GB.tickets(st, O(a.orgId), f, sl); return `<tr><td>${esc(names[a.orgId])}</td><td>${NEED[a.need]}</td><td class="num">${t.total}</td><td>${t.parts.map(p => `${esc(p[0])} ${p[1]}`).join('＋')}</td></tr>`; }).join('')}</tbody></table></div>`);
      const mine = me && live.find(a => a.orgId === me.id);
      if (mine && s.showCounts) {
        const occ = GB.occupancy(st, f, date, sl.id);
        const cands = live.map(a => ({ id: a.id, need: a.need, tickets: GB.tickets(st, O(a.orgId), f, sl).total }));
        out.push(`<p>いまの申込で計算した、当たる見込み：<b class="mono">約 ${GB.odds(cands, occ.units.length, occ.free.length, mine.id)}％</b><br><small class="muted">このコマだけで考えた目安です（1か月・1日の上限は入れていません）。</small></p>`);
      }
    } else if (sc.run) {
      const key = `${f.id}|${date}|${sl.id}`, log = runLog(sc.run).filter(e => e.key === key);
      if (log.length) out.push(`<h3>くじの結果</h3>${log.map(e => kuji(e, role, names)).join('')}`);
      else if (apps.length) out.push('<p class="muted">このコマは、くじを引く前に決まりました（申込が対象外だったか、上限に達していたため）。</p>');
      const mine = me && apps.find(a => a.orgId === me.id);
      if (mine) out.push(`<p>あなたの申込：${pill(APP[mine.status][0], APP[mine.status][1])} ${esc(mine.reason || '')}</p>`);
    }
    return out.length ? `<div class="sec">${out.join('')}</div>` : '';
  }
  function kuji(e, role, names = {}) {
    const nm = appId => { const a = GB.find(st.apps, appId); return a ? esc(names[a.orgId] || (O(a.orgId) || {}).name || '') : ''; };
    if (e.cands.length === 1) return `<p class="kuji1">${nm(e.win)} だけが申し込んでいたので、当選${e.half ? `（${e.half}面）` : ''}。</p>`;
    let acc = 0;
    const segs = e.cands.map(([appId, t]) => { const from = acc + 1; acc += t; return `<div class="seg${appId === e.win ? ' win' : ''}" style="flex-grow:${t}"><b>${nm(appId)}</b><span class="mono">${from === acc ? from : `${from}–${acc}`}</span></div>`; }).join('');
    return `<div class="kuji"><div class="track"><div class="bar">${segs}</div><i class="pin" style="left:${((e.n - 0.5) / e.total * 100).toFixed(2)}%"></i></div>
      <p class="cap">くじ ${e.total} 本から <b class="mono">${e.n} 番</b>を引いた → <b>${nm(e.win)}</b>${e.half ? `（${e.half}面）` : ''}</p></div>`;
  }
  function choice(title, act, f, date, sl, mode) {
    const rows = (f.areas > 1 ? ['full', 'half'] : ['full']).map(n => ({ n, why: GB.blocker(st, ui.orgId, f.id, date, sl.id, n, mode) }));
    const whys = [...new Set(rows.filter(r => r.why).map(r => r.why))];
    return `<div class="row-btn">${rows.map(r => btn(`${court(r.n)} ${title}（${NEED[r.n]}）`, act, { f: f.id, d: date, s: sl.id, n: r.n }, r.n === 'half' ? 'ghost' : '', !!r.why)).join('')}</div>${whys.length ? `<ul class="why">${whys.map(w => `<li>${esc(w)}</li>`).join('')}</ul>` : ''}`;
  }
  function orgActions(f, date, sl, apps, ph, sc, me) {
    const s = st.settings, out = [];
    const mineApp = apps.find(a => a.orgId === me.id && a.status === 'applied');
    const bk = st.bookings.find(b => b.orgId === me.id && b.facilityId === f.id && b.date === date && b.slotId === sl.id && ['pending', 'confirmed'].includes(b.status));
    if (ph === 'apply') {
      if (mineApp) out.push(`<p>${pill('申込済み', 'wait')} ${NEED[mineApp.need]}で申し込んでいます。</p><div class="row-btn">${btn('申込を取り下げる', 'withdraw', { id: mineApp.id }, 'ghost')}</div>`);
      else out.push(choice('抽選に申し込む', 'apply', f, date, sl, 'apply'));
    } else if (ph === 'before') out.push(`<p class="muted">抽選の申込は ${GB.md(sc.applyStart)}〜${GB.md(sc.applyEnd)} です。</p>`);
    else if (ph === 'closed' || ph === 'drawing') out.push(`<p class="muted">${GB.md(sc.draw)} の抽選を待っています。</p>`);
    if (bk && bk.status === 'pending') out.push(`<p>${pill('当選', 'ok')} ${GB.md(sc.confirmEnd)} までに確定してください。</p><div class="row-btn">${btn('当選を確定する', 'confirm', { id: bk.id })}${btn('辞退する', 'cancel', { id: bk.id }, 'ghost')}</div>`);
    else if (bk && bk.date > st.clock) {
      const late = D.diff(bk.date, st.clock) < s.freeCancelDays;
      out.push(`<p>${pill('予約あり', 'ok')} ${late ? `<span class="warn">いまキャンセルすると違反 ${s.ptLate} 点です（利用日の ${s.freeCancelDays} 日前を過ぎています）。</span>` : `利用日の ${s.freeCancelDays} 日前までは、キャンセルしても違反になりません。`}</p><div class="row-btn">${btn('キャンセルする', 'cancel', { id: bk.id }, 'warn')}</div>`);
    }
    if ((ph === 'firstCity' || ph === 'firstAll') && !bk) out.push(choice('先着で予約する', 'book', f, date, sl, 'book'));
    return out.length ? `<div class="sec act">${out.join('')}</div>` : '';
  }
  function blockForm(kind, f, date) {
    const def = kind === 'school' ? '学校行事' : '大会';
    return `<form class="form" data-form="sheet-block"><input type="hidden" name="kind" value="${kind}"><input type="hidden" name="f" value="${f.id}"><input type="hidden" name="d" value="${date}">
      <label class="grow">理由 <input name="reason" id="sheet-reason" value="${def}" maxlength="30"></label>
      <div class="row-btn"><button class="btn" name="scope" value="slot">このコマを${kind === 'school' ? '学校で使う' : '確保する'}</button><button class="btn ghost" name="scope" value="day">この日を終日${kind === 'school' ? ' 学校で使う' : ' 確保する'}</button></div></form>
      <p class="small muted">入っていた予約・申込・定期枠の団体には、自動でお知らせが届きます（違反にはなりません）。</p>`;
  }
  function useButtons(f, date, sl) {
    return st.bookings.filter(b => b.facilityId === f.id && b.date === date && b.slotId === sl.id && b.status === 'confirmed' && b.date <= st.clock)
      .map(b => `<p>${esc(O(b.orgId).name)}は使いましたか？</p><div class="row-btn">${btn('使った', 'use', { id: b.id, v: 1 }, 'sm')}${btn('使わなかった', 'use', { id: b.id, v: 0 }, 'sm warn')}</div>`).join('');
  }
  function schoolActions(f, date, sl, occ) {
    if (f.kind !== 'school') return '<div class="sec act"><p class="muted">市の体育館です。学校の画面からは登録できません。</p></div>';
    const out = [];
    if (occ.block) out.push(occ.block.kind === 'school' ? `<div class="row-btn">${btn('学校の使用を取り消す', 'unblock', { id: occ.block.id }, 'warn')}</div>` : `<p class="muted">市役所が登録した「${esc(occ.block.reason)}」です。</p>`);
    else if (date > st.clock) out.push(blockForm('school', f, date));
    out.push(useButtons(f, date, sl));
    return `<div class="sec act">${out.join('')}</div>`;
  }
  function adminActions(f, date, sl, occ) {
    const out = [];
    if (occ.block) out.push(occ.block.kind === 'event' ? `<div class="row-btn">${btn('優先確保を取り消す', 'unblock', { id: occ.block.id }, 'warn')}</div>` : `<p class="muted">学校が登録した「${esc(occ.block.reason)}」です。</p>`);
    else if (date > st.clock) out.push(blockForm('event', f, date));
    out.push(useButtons(f, date, sl));
    return `<div class="sec act">${out.join('')}</div>`;
  }

  /* ---- 描く ---- */
  function render() {
    const view = { org: orgView, school: schoolView, admin: adminView }[ui.view] || guideView;
    root.innerHTML = `${topbar()}<main class="wrap" id="main">${view()}</main>${ui.sheet ? sheetView() : ''}`;
    document.body.classList.toggle('locked', !!ui.sheet);
  }

  /* ---- 操作 ---- */
  const settingsCopy = () => JSON.parse(JSON.stringify(st.settings));
  const setPath = (obj, path, v) => { const ks = path.split('.'), last = ks.pop(); ks.reduce((o, k) => o[k], obj)[last] = v; };
  const ACT = {
    view: d => { ui.view = d.v; ui.sheet = null; save(); render(); window.scrollTo(0, 0); },
    go: d => { ui.view = d.v; if (d.v === 'org') ui.orgTab = d.tab; if (d.v === 'admin') ui.adminTab = d.tab; save(); render(); window.scrollTo(0, 0); },
    gocal: d => { ui.orgTab = 'cal'; ui.orgMonth = d.m; save(); render(); window.scrollTo(0, 0); },
    orgtab: d => { ui.orgTab = d.tab; save(); render(); },
    schooltab: d => { ui.schoolTab = d.tab; save(); render(); },
    admintab: d => { ui.adminTab = d.tab; ui.confirmReset = false; save(); render(); },
    orgmonth: d => { ui.orgMonth = d.m; save(); render(); },
    schoolmonth: d => { ui.schoolMonth = d.m; save(); render(); },
    csvmonth: d => { ui.csvMonth = d.m; render(); },
    adminmonth: d => { ui.adminMonth = d.m; save(); render(); },
    runmonth: d => { ui.runMonth = d.m; ui.seed = ''; render(); },
    clock: () => { ui.clockOpen = !ui.clockOpen; ui.confirmReset = false; render(); },
    setclock: d => { const r = moveClock(d.d); ui.clockOpen = false; done(r); },
    'reset-ask': () => { ui.confirmReset = true; render(); },
    'reset-no': () => { ui.confirmReset = false; render(); },
    reset: () => { st = GB.sample(); ui.confirmReset = false; ui.clockOpen = false; ui.sheet = null; ui.verified = {}; ui.seed = ''; done({ ok: true, msg: 'サンプルの状態に戻しました' }); },
    open: d => { ui.sheet = { f: d.f, d: d.d, s: d.s }; render(); const h = document.getElementById('sheet-h'); if (h) h.focus(); },
    close: () => { ui.sheet = null; render(); },
    apply: d => done(A.apply(st, ui.orgId, d.f, d.d, d.s, d.n)),
    withdraw: d => done(A.withdraw(st, d.id)),
    book: d => done(A.book(st, ui.orgId, d.f, d.d, d.s, d.n)),
    confirm: d => done(A.confirm(st, d.id)),
    'confirm-all': () => {
      const list = st.bookings.filter(b => b.orgId === ui.orgId && b.status === 'pending');
      const ok = list.map(b => A.confirm(st, b.id)).filter(r => r.ok).length;
      done({ ok: ok > 0, msg: ok ? `${ok} 件を確定しました` : '確定できる当選はありません（締切を過ぎています）' });
    },
    cancel: d => done(A.cancel(st, d.id)),
    use: d => done(A.markUse(st, d.id, d.v === '1')),
    'use-all': d => {
      const list = st.bookings.filter(b => b.facilityId === d.f && b.status === 'confirmed' && b.date <= st.clock);
      list.forEach(b => A.markUse(st, b.id, true));
      done({ ok: true, msg: `${list.length} 件を「使った」にしました` });
    },
    unblock: d => done(A.removeBlock(st, d.id)),
    quickdraw: d => done(A.runLottery(st, d.m, newSeed(d.m))),
    verify: d => { const run = GB.schedule(st, d.m).run; ui.verified[d.m] = !!run && GB.verifyRun(run); render(); },
    approve: d => { const o = O(d.id); if (o) o.status = 'approved'; done({ ok: true, msg: `「${o.name}」を承認しました` }); },
    resetpts: d => { const o = O(d.id); if (o) o.points = 0; done({ ok: true, msg: '違反点数を 0 にしました' }); },
    delreg: d => done(A.removeRegular(st, d.id)),
    'rules-default': () => done(A.setSettings(st, GB.defaults())),
    copy: (d, el) => {
      const ta = document.getElementById(d.t);
      if (!ta) return;
      const fallback = () => { ta.focus(); ta.select(); toast('選びました。コピーの操作（Ctrl+C や長押し）でコピーしてください'); };
      try { navigator.clipboard.writeText(ta.value).then(() => toast('コピーしました'), fallback); } catch (e) { fallback(); }
    },
    download: d => {
      const ta = document.getElementById(d.t);
      if (!ta) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob(['﻿' + ta.value], { type: d.name.endsWith('.csv') ? 'text/csv' : 'application/json' }));
      a.download = d.name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    },
  };
  const CH = {
    org: el => { ui.orgId = el.value; save(); render(); },
    fac: el => { ui.facId = el.value; save(); render(); },
    school: el => { ui.schoolFac = el.value; save(); render(); },
    adminfac: el => { ui.adminFac = el.value; save(); render(); },
    'org-type': el => { const o = O(el.dataset.id); o.type = el.value; done({ ok: true, msg: `「${o.name}」の区分を変えました` }); },
    'org-dist': el => { const o = O(el.dataset.id); o.inCity = !!el.value; o.districtId = el.value || null; done({ ok: true, msg: `「${o.name}」の地区を変えました` }); },
    'fac-name': el => { const f = F(el.dataset.id), v = el.value.trim(); if (v) f.name = v; done({ ok: !!v, msg: v ? '名前を変えました' : '名前を入れてください' }); },
    'fac-kind': el => {
      const f = F(el.dataset.id);
      if (st.bookings.some(b => b.facilityId === f.id && b.date > st.clock && ['pending', 'confirmed'].includes(b.status)) || st.regulars.some(r => r.facilityId === f.id)) return done({ ok: false, msg: '予約や定期枠が入っているので、種類は変えられません' });
      f.kind = el.value; done({ ok: true, msg: '種類を変えました' });
    },
    'fac-dist': el => { F(el.dataset.id).districtId = el.value; done({ ok: true, msg: '地区を変えました' }); },
    'fac-areas': el => {
      const f = F(el.dataset.id), n = +el.value;
      if (n < 2 && (st.bookings.some(b => b.facilityId === f.id && b.half && b.date >= st.clock && ['pending', 'confirmed'].includes(b.status)) || st.regulars.some(r => r.facilityId === f.id && r.need === 'half') || st.apps.some(a => a.facilityId === f.id && a.need === 'half' && a.status === 'applied')))
        return done({ ok: false, msg: '半面の予約・申込・定期枠があるので、全面だけにはできません' });
      f.areas = n; done({ ok: true, msg: '区画を変えました' });
    },
    'reg-f': el => { ui.regForm.f = el.value; render(); },
    'reg-w': el => { ui.regForm.w = +el.value; render(); },
    'reg-s': el => { ui.regForm.s = el.value; },
    'reg-n': el => { ui.regForm.n = el.value; },
    'reg-o': el => { ui.regForm.o = el.value; },
    'ev-f': el => { ui.evFac = el.value; render(); },
    lead: el => { const s = settingsCopy(); s.lead = +el.value; done(A.setSettings(st, s)); },
    commercial: el => { const s = settingsCopy(); s.commercialSchool = el.value; done(A.setSettings(st, s)); },
    flag: el => { const s = settingsCopy(); s[el.dataset.k] = el.checked; done(A.setSettings(st, s)); },
    set: el => {
      const s = settingsCopy(), k = el.dataset.k;
      if (el.type === 'time') {
        if (!/^\d{2}:\d{2}$/.test(el.value)) return done({ ok: false, msg: '時刻を入れてください' });
        setPath(s, k, el.value);
        const x = k.split('.').slice(0, -1).reduce((o, p) => o[p], s);
        if (x.start >= x.end) return done({ ok: false, msg: '終わりの時刻は、始まりより後にしてください' });
      } else setPath(s, k, el.value === '' ? NaN : Number(el.value));
      done(A.setSettings(st, s));
    },
    prio: el => {
      const s = settingsCopy(), x = el.dataset.k.split('.').reduce((o, p) => o[p], s);
      x.prio = el.checked ? [...new Set([...(x.prio || []), el.dataset.t])] : (x.prio || []).filter(t => t !== el.dataset.t);
      done(A.setSettings(st, s));
    },
  };
  const FORM = {
    clock: fd => { const r = moveClock(fd.get('d')); if (r.ok) ui.clockOpen = false; done(r); },
    draw: fd => { ui.seed = fd.get('seed'); const r = A.runLottery(st, fd.get('m'), fd.get('seed')); if (r.ok) ui.seed = ''; done(r); },
    'sheet-block': (fd, sub) => {
      const r = A.addBlock(st, { facilityId: fd.get('f'), date: fd.get('d'), slotId: sub === 'day' ? null : ui.sheet.s, kind: fd.get('kind'), reason: fd.get('reason') });
      done(r);
    },
    'block-tab': fd => done(A.addBlock(st, { facilityId: fd.get('f'), date: fd.get('d'), slotId: fd.get('s') || null, kind: 'school', reason: fd.get('reason') })),
    addevent: fd => done(A.addBlock(st, { facilityId: fd.get('f'), date: fd.get('d'), slotId: fd.get('s') || null, kind: 'event', reason: fd.get('reason') })),
    addorg: fd => done(A.addOrg(st, { name: fd.get('name'), type: fd.get('type'), districtId: fd.get('dist') || null, inCity: !!fd.get('dist') })),
    addfac: fd => {
      const name = String(fd.get('name') || '').trim();
      if (!name) return done({ ok: false, msg: '名前を入れてください' });
      st.facilities.push({ id: `f${++st.seq}`, name, kind: fd.get('kind'), districtId: fd.get('dist'), areas: +fd.get('areas') });
      done({ ok: true, msg: `「${name}」を足しました` });
    },
    addreg: fd => {
      Object.assign(ui.regForm, { f: fd.get('f'), w: +fd.get('w'), s: fd.get('s'), n: fd.get('n'), o: fd.get('o') });
      done(A.addRegular(st, { facilityId: fd.get('f'), orgId: fd.get('o'), weekday: fd.get('w'), slotId: fd.get('s'), need: fd.get('n') }));
    },
    import: fd => {
      let x = null;
      try { x = JSON.parse(fd.get('json')); } catch (e) { /* 下で知らせる */ }
      if (!x || x.v !== 1 || !x.settings || !Array.isArray(x.orgs) || !Array.isArray(x.bookings)) return done({ ok: false, msg: '読み込めませんでした。「全部のデータ」でコピーした JSON を、そのまま貼りつけてください' });
      st = x; A.settle(st); ui.verified = {};
      done({ ok: true, msg: 'データを読み込みました' });
    },
  };

  root.addEventListener('click', e => {
    const el = e.target.closest('[data-act]');
    if (!el || !root.contains(el) || el.disabled) return;
    const fn = ACT[el.dataset.act];
    if (fn) { e.preventDefault(); fn(el.dataset, el); }
  });
  root.addEventListener('change', e => {
    const el = e.target.closest('[data-ch]');
    if (el && CH[el.dataset.ch]) CH[el.dataset.ch](el);
  });
  root.addEventListener('submit', e => {
    const form = e.target.closest('form[data-form]');
    if (!form) return;
    e.preventDefault();
    const fn = FORM[form.dataset.form];
    if (fn) fn(new FormData(form), e.submitter ? e.submitter.value : '');
  });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (ui.sheet) { ui.sheet = null; render(); }
    else if (ui.clockOpen) { ui.clockOpen = false; render(); }
  });

  render();
})();
