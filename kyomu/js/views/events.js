/* 行事の入力（年間・月・週で同じデータを使う）。
   ・学年や校時を入れると、その時間の時間割が自動で埋まる（例：1年 5〜6校時 文化発表会準備）
   ・休業日／○曜校時（曜日の振りかえ）／職員の予定（会議・出張。だれがを書くと、その先生の授業に注意が出る）
   ・まとめて入力：「10/3 全校 1-6 体育大会」のように1行ずつ書いて、まとめて登録 */
(function () {
  const K = window.K;
  const u = K.u;
  const m = K.m;
  const E = (K.ev = {});

  const KINDS = [
    ['event', '行事（生徒）'],
    ['staff', '職員の予定（会議・出張）'],
    ['holiday', '休業日（授業なし）'],
    ['swap', '○曜校時（曜日の振りかえ）'],
    ['short', '短縮日課（○校時まで）'],
  ];

  function slotOptions(sel, withAll) {
    const opts = m.st.slots.map((s) => `<option value="${s.id}" ${sel === s.id ? 'selected' : ''}>${s.id === 'am' ? '朝（C）' : s.id === 'pm' ? '帰り（C）' : s.label + '校時'}</option>`);
    return (withAll ? `<option value="">（時間割に入れない）</option><option value="all" ${sel === 'all' ? 'selected' : ''}>終日（全部の校時）</option>` : '') + opts.join('');
  }
  function targetBoxes(targets) {
    const t = targets && targets.length ? targets : ['all'];
    const g = m.grades();
    return `<label class="chk"><input type="checkbox" data-tg="all" ${t.includes('all') ? 'checked' : ''}>全校</label>
      ${g.map((x) => `<label class="chk"><input type="checkbox" data-tg="g${x}" ${t.includes('g' + x) ? 'checked' : ''}>${x}年</label>`).join('')}
      <details style="display:inline-block;margin-left:6px"><summary class="small muted">クラスで選ぶ</summary>
      ${m.st.classes.map((c) => `<label class="chk small"><input type="checkbox" data-tg="${c.id}" ${t.includes(c.id) ? 'checked' : ''}>${c.id}</label>`).join(' ')}</details>`;
  }
  function countOptions(sel) {
    const subs = m.st.subjects.filter((s) => s.counted);
    return `<option value="">数えない</option>${subs.map((s) => `<option value="${u.esc(s.code)}" ${sel === s.code ? 'selected' : ''}>${u.esc(s.code)}（${u.esc(s.name)}）</option>`).join('')}`;
  }

  E.open = (preset) => E.form(Object.assign({ id: '', kind: 'event', date: u.today(), end: '', title: '', targets: ['all'], from: '', to: '', countAs: '行事', inYear: true, inMonth: true }, preset || {}));
  E.edit = (id) => {
    const e = m.st.events.find((x) => x.id === id);
    if (e) E.form(u.clone(e));
  };

  E.form = (e) => {
    const isNew = !e.id;
    const md = u.modal(
      `<h3>${isNew ? '行事を追加' : '行事を直す'}</h3>
      <div class="form">
        <label>種類</label><select data-f="kind">${KINDS.map(([k, t]) => `<option value="${k}" ${e.kind === k ? 'selected' : ''}>${t}</option>`).join('')}</select>
        <label>名前</label><input type="text" data-f="title" value="${u.esc(e.title)}" placeholder="例：文化発表会準備">
        <label>日付</label><div class="row"><input type="date" data-f="date" value="${e.date}"> 〜 <input type="date" data-f="end" value="${e.end || ''}"><span class="small muted">（1日だけなら右は空）</span></div>
        <label data-k="short">何校時まで</label><div data-k="short"><select data-f="upTo">${m.st.slots.filter((x) => x.counted).map((x) => `<option value="${x.id}" ${e.upTo === x.id ? 'selected' : ''}>${x.label}校時まで</option>`).join('')}</select> <span class="small muted">（それより後の校時は時間割が空になり、時数に数えない）</span></div>
        <label data-k="swap">何曜の時間割</label><div data-k="swap"><select data-f="swapWd">${[1, 2, 3, 4, 5].map((w) => `<option value="${w}" ${Number(e.swapWd) === w ? 'selected' : ''}>${u.WD[w]}曜校時</option>`).join('')}</select></div>
        <label data-k="event staff">だれが</label><div data-k="event staff" class="row">${targetBoxes(e.targets)}</div>
        <label data-k="staff">先生の名前</label><div data-k="staff"><input type="text" data-f="who" value="${u.esc(e.who || '')}" placeholder="例：山田、佐藤（その時間の授業に注意が出ます）" style="width:100%"></div>
        <label data-k="event staff">時間</label><div data-k="event staff" class="row"><select data-f="from">${slotOptions(e.from, true)}</select> 〜 <select data-f="to"><option value="">（同じ）</option>${slotOptions(e.to, false)}</select></div>
        <label data-k="event">時間割の欄</label><div data-k="event" class="row"><input type="text" data-f="short" value="${u.esc(e.short || '')}" placeholder="短い名前（空なら名前）" style="width:180px"><label class="chk small"><input type="checkbox" data-f="noText" ${e.noText ? 'checked' : ''}>欄は空のまま</label></div>
        <label data-k="event">時数</label><div data-k="event"><select data-f="countAs">${countOptions(e.countAs == null ? '行事' : e.countAs)}</select> <span class="small muted">として数える</span></div>
        <label>場所・メモ</label><input type="text" data-f="place" value="${u.esc(e.place || '')}" placeholder="例：体育館（週行事では（ ）で出ます）">
        <label>載せる表</label><div class="row"><label class="chk"><input type="checkbox" data-f="inYear" ${e.inYear !== false ? 'checked' : ''}>年間行事</label><label class="chk"><input type="checkbox" data-f="inMonth" ${e.inMonth !== false ? 'checked' : ''}>月行事</label><label class="chk"><input type="checkbox" data-f="inWeek" ${e.inWeek !== false ? 'checked' : ''}>週行事の行事欄</label></div>
      </div>
      <div class="preview" data-pv></div>
      <div class="btns">${isNew ? '' : '<button class="btn danger" data-del style="margin-right:auto">消す</button>'}<button class="btn" data-close>やめる</button><button class="btn primary" data-ok>${isNew ? '追加' : '保存'}</button></div>`,
      { wide: false }
    );
    const el = md.el;
    const q = (k) => el.querySelector(`[data-f="${k}"]`);
    const read = () => {
      const x = Object.assign({}, e);
      ['kind', 'title', 'date', 'end', 'from', 'to', 'short', 'place', 'who', 'countAs', 'upTo'].forEach((k) => (x[k] = q(k).value.trim()));
      x.swapWd = Number(q('swapWd').value);
      x.noText = q('noText').checked;
      x.inYear = q('inYear').checked;
      x.inMonth = q('inMonth').checked;
      x.inWeek = q('inWeek').checked;
      const tg = [...el.querySelectorAll('[data-tg]:checked')].map((b) => b.dataset.tg);
      x.targets = tg.includes('all') || !tg.length ? ['all'] : tg;
      if (x.end && x.end <= x.date) x.end = '';
      if (x.kind === 'swap' && !x.title) x.title = `${u.WD[x.swapWd]}曜校時`;
      if (!x.from) x.to = '';
      if (x.kind !== 'event') delete x.countAs;
      if (x.kind !== 'staff') delete x.who;
      if (x.kind !== 'short') delete x.upTo;
      if (x.kind === 'short' && !x.title) x.title = `${m.slot(x.upTo).label}校時まで`;
      return x;
    };
    const sync = () => {
      const k = q('kind').value;
      el.querySelectorAll('[data-k]').forEach((n) => (n.style.display = n.dataset.k.split(' ').includes(k) ? '' : 'none'));
      preview();
    };
    const preview = () => {
      const x = read();
      el.querySelector('[data-pv]').innerHTML = E.previewHtml(x);
    };
    el.addEventListener('change', sync);
    el.addEventListener('input', u.debounce(preview, 150));
    el.querySelector('[data-tg="all"]').addEventListener('change', (ev) => {
      if (ev.target.checked) el.querySelectorAll('[data-tg]').forEach((b) => b !== ev.target && (b.checked = false));
    });
    el.querySelectorAll('[data-tg]:not([data-tg="all"])').forEach((b) =>
      b.addEventListener('change', () => b.checked && (el.querySelector('[data-tg="all"]').checked = false))
    );
    sync();
    el.querySelector('[data-ok]').addEventListener('click', async () => {
      const x = read();
      if (!x.title) return u.toast('名前を入れてください');
      if (!x.date) return u.toast('日付を入れてください');
      const hit = E.overrideHits(x);
      let drop = false;
      if (hit.length) drop = await u.confirm(`この行事の時間に、手で変えたコマが ${hit.length} こあります（入れ替えなど）。\n行事を優先して、それらを消しますか？\n（「やめる」なら手で変えたコマはそのまま残ります）`, '行事を優先');
      K.store.commit(isNew ? '行事を追加' : '行事を直す', (st) => {
        if (!x.id) x.id = u.uid();
        delete x.imported;
        const i = st.events.findIndex((y) => y.id === x.id);
        if (i >= 0) st.events[i] = x;
        else st.events.push(x);
        if (drop) hit.forEach((k) => delete st.ovr[k]);
      });
      md.close();
      u.toast(isNew ? '追加しました（年間・月・週の表に出ます）' : '保存しました');
    });
    const del = el.querySelector('[data-del]');
    if (del)
      del.addEventListener('click', async () => {
        if (!(await u.confirm(`「${e.title}」を消します。`, '消す'))) return;
        K.store.commit('行事を消す', (st) => (st.events = st.events.filter((y) => y.id !== e.id)));
        md.close();
      });
  };

  // その行事で、どのコマがどう埋まるか（減る授業）
  E.affected = (x) => {
    const out = [];
    if (x.kind !== 'event' || !x.from || !x.date) return out;
    const end = x.end && x.end > x.date ? x.end : x.date;
    u.range(x.date, end).forEach((d) => {
      const day = m.day(d);
      if (!day.school) return;
      m.eventSlots(x, day.layout).forEach((s) => {
        m.st.classes.forEach((c) => {
          if (!m.targets(x, c.id)) return;
          const r = m.cell(d, s, c.id);
          out.push({ d, s, c: c.id, t: r.src === 'ev' && r.ev.id === x.id ? m.under(d, s, c.id).t : r.t, src: r.src });
        });
      });
    });
    return out;
  };
  E.overrideHits = (x) => E.affected(x).filter((a) => m.st.ovr[m.ck(a.d, a.s, a.c)]).map((a) => m.ck(a.d, a.s, a.c));

  E.previewHtml = (x) => {
    if (x.kind === 'holiday') return `${u.esc(x.date)}${x.end ? '〜' + x.end : ''} は授業のない日になります（時間割は空・授業日数に数えない）。`;
    if (x.kind === 'swap') return `${u.esc(x.date)} は <b>${u.WD[x.swapWd]}曜日の時間割</b>で動きます。`;
    if (x.kind === 'short') return `${u.esc(x.date)}${x.end ? '〜' + x.end : ''} は <b>${u.esc(m.slot(x.upTo) ? m.slot(x.upTo).label : '')}校時まで</b>。それより後の時間割は空になり、時数にも数えません。`;
    if (x.kind === 'staff') return `出張等の欄に「${u.esc(x.title)}${x.who ? ' ' + u.esc(x.who) : ''}」と出ます。${x.who ? 'この先生の授業がその時間にあると、⚠ が出ます。' : ''}`;
    if (!x.from) return '行事欄に名前が出ます（時間割は変わりません）。校時を選ぶと、その時間の時間割が自動で埋まります。';
    const list = E.affected(x);
    if (!list.length) return 'この日は授業のない日か、対象のコマがありません。';
    const by = {};
    list.forEach((a) => {
      if (!a.t) return;
      const k = `${a.c}`;
      (by[k] = by[k] || []).push(a.t);
    });
    const lost = Object.entries(by).map(([c, ts]) => `${c}：${ts.join('・')}`);
    return `<b>${list.length}コマ</b>が「${u.esc(x.noText ? '（空）' : x.short || x.title)}」になります（${x.countAs ? u.esc(x.countAs) + 'として数える' : '時数に数えない'}）。<br>${lost.length ? `<span class="muted">なくなる授業 … ${u.esc(lost.join('　'))}</span>` : ''}`;
  };

  /* ---------- まとめて入力 ---------- */
  // 1行 = 1つの行事。例：
  //   4/6 全校 1-6 始業式
  //   10/3〜10/4 2年 職場体験 #総
  //   11/3 休 文化の日
  //   9/24 火曜校時
  //   職員: 9/24 ①-② 教務会議 山田、佐藤
  E.parseLine = (line, fy) => {
    let s = u.norm(line).replace(/\t+/g, ' ');
    if (!s) return null;
    const x = { kind: 'event', targets: ['all'], from: '', to: '', countAs: '行事', inYear: true, inMonth: true };
    if (/^(職員|先生|出張)[:：]/.test(s)) {
      x.kind = 'staff';
      s = s.replace(/^(職員|先生|出張)[:：]\s*/, '');
    }
    const dm = /^(?:(\d{4})[-/年])?(\d{1,2})[/月](\d{1,2})日?(?:\([^)]*\))?(?:\s*[~〜～-]\s*(?:(\d{1,2})[/月])?(\d{1,2})日?(?:\([^)]*\))?)?\s*/.exec(s);
    if (!dm) return { error: '日付が読めません', line };
    const mo = Number(dm[2]);
    const yy = dm[1] ? Number(dm[1]) : mo >= 4 ? fy : fy + 1;
    x.date = `${yy}-${u.pad(mo)}-${u.pad(Number(dm[3]))}`;
    if (dm[5]) {
      const mo2 = dm[4] ? Number(dm[4]) : mo;
      const y2 = mo2 >= 4 ? fy : fy + 1;
      x.end = `${dm[1] ? yy : y2}-${u.pad(mo2)}-${u.pad(Number(dm[5]))}`;
    }
    s = s.slice(dm[0].length);
    // 時数の数え方  #総
    const cm = /\s#(\S+)\s*$/.exec(' ' + s);
    if (cm) {
      x.countAs = cm[1] === 'なし' ? '' : cm[1];
      s = (' ' + s).slice(0, cm.index).trim();
    }
    // 種類
    if (/^(休|休業|休み)\s/.test(s)) {
      x.kind = 'holiday';
      s = s.replace(/^(休|休業|休み)\s*/, '');
    }
    const sh = /^(?:短縮\s*([1-7])|([1-7])\s*校時まで)\s*/.exec(s);
    if (sh) {
      x.kind = 'short';
      x.upTo = sh[1] || sh[2];
      s = s.slice(sh[0].length);
      x.title = s || `${x.upTo}校時まで`;
      delete x.countAs;
      return x;
    }
    const sw = /^([月火水木金])曜校時/.exec(s);
    if (sw) {
      x.kind = 'swap';
      x.swapWd = u.WD.indexOf(sw[1]);
      x.title = s;
      return x;
    }
    // 対象
    const tg = [];
    let tm;
    while ((tm = /^(全校|全学年|中?([1-9])年|([1-9])[-・]([1-9]))(?:[、,・]|\s+)/.exec(s + ' '))) {
      // 「5-6」のように、クラスに無いものは校時として読む
      if (tm[3] && !m.cls(`${tm[3]}-${tm[4]}`)) break;
      if (tm[1] === '全校' || tm[1] === '全学年') tg.push('all');
      else if (tm[2]) tg.push('g' + tm[2]);
      else tg.push(`${tm[3]}-${tm[4]}`);
      s = (s + ' ').slice(tm[0].length).trim();
    }
    if (tg.length && !tg.includes('all')) x.targets = tg;
    // 校時  1-6 / ⑤⑥ / 5・6校時 / 5限 / 終日
    const circ = '①②③④⑤⑥⑦';
    const pm = /^(終日|(\d)(?:\s*[-〜~・]\s*(\d))?\s*(?:校時|限)?|([①-⑦])(?:\s*[-〜~・]?\s*([①-⑦]))?)(?:\s+|$)/.exec(s);
    if (pm && pm[0].trim()) {
      if (pm[1] === '終日') x.from = 'all';
      else if (pm[2]) {
        x.from = pm[2];
        x.to = pm[3] || '';
      } else if (pm[4]) {
        x.from = String(circ.indexOf(pm[4]) + 1);
        x.to = pm[5] ? String(circ.indexOf(pm[5]) + 1) : '';
      }
      s = s.slice(pm[0].length).trim();
    }
    // 職員の予定：うしろの名前（、で区切られた語）を「だれが」に
    if (x.kind === 'staff') {
      const wm = /\s+([^\s]+(?:[、,][^\s]+)+)$/.exec(s);
      if (wm) {
        x.who = wm[1];
        s = s.slice(0, wm.index).trim();
      }
    }
    // 場所（ ）
    const plm = /[（(]([^）)]+)[）)]$/.exec(s);
    if (plm && x.kind === 'event') {
      x.place = plm[1];
      s = s.slice(0, plm.index).trim();
    }
    x.title = s;
    if (!x.title) return { error: '名前がありません', line };
    if (x.kind !== 'event') delete x.countAs;
    return x;
  };

  E.bulk = () => {
    const fy = m.st.school.year;
    const md = u.modal(
      `<h3>行事をまとめて入力</h3>
      <p class="help">1行に1つ。<b>日付 → 対象 → 校時 → 名前</b> の順に書きます（対象・校時はなくてもよい）。Excel の年間行事予定から「日付」と「行事名」の列をコピーして貼りつけてもOK。<br>
      例：<code>10/3 全校 1-6 体育大会</code>　<code>10/14〜10/16 2年 5-6校時 職場体験 #総</code>　<code>11/3 休 文化の日</code>　<code>9/24 火曜校時</code>　<code>7/13〜7/16 短縮4 三者面談</code>　<code>職員: 9/24 ④ 運営委員会 山田、佐藤</code><br>
      <code>#総</code> は「総合として数える」、<code>#なし</code> は時数に数えない（ふつうは「行事」として数えます）。</p>
      <textarea data-b style="min-height:180px" placeholder="4/6 全校 1-6 始業式"></textarea>
      <div class="preview" data-pv>ここに読み取った結果が出ます</div>
      <div class="btns"><button class="btn" data-close>やめる</button><button class="btn primary" data-ok disabled>登録する</button></div>`,
      { wide: true }
    );
    const ta = md.el.querySelector('[data-b]');
    let parsed = [];
    const pv = () => {
      parsed = ta.value.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => E.parseLine(l, fy));
      const ok = parsed.filter((x) => x && !x.error);
      md.el.querySelector('[data-ok]').disabled = !ok.length;
      md.el.querySelector('[data-ok]').textContent = `${ok.length}件を登録する`;
      md.el.querySelector('[data-pv]').innerHTML = parsed.length
        ? `<table class="cnt" style="width:100%"><tr><th>日付</th><th>種類</th><th>対象</th><th>校時</th><th class="l">名前</th><th>時数</th></tr>${parsed
            .map((x) =>
              x.error
                ? `<tr><td colspan="6" class="l" style="color:#b3261e">✕ ${u.esc(x.line)}（${x.error}）</td></tr>`
                : `<tr><td>${u.mdw(x.date)}${x.end ? '〜' + u.md(x.end) : ''}</td><td>${{ event: '行事', staff: '職員', holiday: '休業', swap: '振替', short: '短縮' }[x.kind]}</td><td>${u.esc(m.targetLabel(x))}</td><td>${x.kind === 'short' ? x.upTo + 'まで' : x.from === 'all' ? '終日' : x.from ? x.from + (x.to ? '〜' + x.to : '') : '—'}</td><td class="l">${u.esc(x.title)}${x.place ? '（' + u.esc(x.place) + '）' : ''}${x.who ? ' ／ ' + u.esc(x.who) : ''}</td><td>${x.kind === 'event' && x.from ? u.esc(x.countAs || 'なし') : ''}</td></tr>`
            )
            .join('')}</table>`
        : 'ここに読み取った結果が出ます';
    };
    ta.addEventListener('input', u.debounce(pv, 200));
    md.el.querySelector('[data-ok]').addEventListener('click', () => {
      const ok = parsed.filter((x) => x && !x.error);
      K.store.commit('行事をまとめて登録', (st) => ok.forEach((x) => st.events.push(Object.assign({ id: u.uid() }, x))));
      md.close();
      u.toast(`${ok.length}件の行事を登録しました`);
    });
  };
})();
