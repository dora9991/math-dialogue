/* データの形と、そこから「その日・その時間・そのクラスに何が入るか」を決める計算。
   画面のファイルは、ここの関数を通してだけデータを読む。

   決まり（強い順）：
     1. 手で変えたコマ（入れ替え・変更・まとめ）…… ovr
     2. 行事で埋まるコマ（年間行事に「学年・校時」を入れたもの）…… events
     3. 基本時間割（その日が入る期間の時間割。○曜校時ならその曜日の分）…… bases
*/
(function () {
  const K = window.K;
  const u = K.u;
  const m = (K.m = {});

  /* ---------- はじめの形 ---------- */
  const SUBJECTS = [
    ['国', '国語', '国'], ['社', '社会', '社'], ['数', '数学', '数'], ['理', '理科', '理'],
    ['理a', '理科a', '理'], ['理b', '理科b', '理'], ['理c', '理科c', '理'], ['英', '英語', '英'],
    ['英ALT', '英語ALT', '英'], ['音', '音楽', '音'], ['美', '美術', '美'], ['体', '保健体育', '体'],
    ['技', '技術', '技家'], ['家', '家庭', '技家'], ['技家', '技術・家庭', '技家'], ['書', '書写', '書'],
    ['トライ', 'トライ', 'トライ'], ['探', '探究', '探'], ['学', '学級活動', '学'], ['道', '道徳', '道'],
    ['総', '総合的な学習', '総'], ['自習', '自習', '自習'], ['行事', '学校行事', '行事'],
  ];
  const NOT_COUNTED = [['読書', '朝読書'], ['C', 'ショートホームルーム']];
  const JOINT = { 体: 1, 総: 1, 行事: 1 };
  const TERM_NAMES = ['1学期', '2学期前期', '2学期後期', '3学期後期'];

  m.blank = (year) => {
    const y = year || u.fy(u.today());
    const classes = [];
    for (let g = 1; g <= 3; g++) for (let c = 1; c <= 3; c++) classes.push({ id: `${g}-${c}`, g, label: `${u.toZen(g)}・${u.toZen(c)}` });
    const slots = [{ id: 'am', label: 'C', counted: false }];
    for (let i = 1; i <= 7; i++) slots.push({ id: String(i), label: String(i), counted: true });
    slots.push({ id: 'pm', label: 'C', counted: false });
    const six = ['am', '1', '2', '3', '4', '5', '6', 'pm'];
    const terms = [
      [`${y}-04-06`, `${y}-07-17`], [`${y}-08-26`, `${y}-10-09`],
      [`${y}-10-13`, `${y}-12-23`], [`${y + 1}-01-07`, `${y + 1}-03-23`],
    ].map(([start, end], i) => ({ id: 't' + (i + 1), name: TERM_NAMES[i], start, end }));
    const bases = {};
    terms.forEach((t) => (bases[t.id] = { cells: {}, staff: {} }));
    return {
      v: 1,
      school: { name: '', year: y, title: '週　　　週　行　事' },
      classes,
      slots,
      daySlots: { 0: six, 1: six, 2: six, 3: six, 4: ['am', '1', '2', '3', '4', '5', '6', '7'], 5: six, 6: six },
      lunchAfter: '4', // この校時の下に太い線（昼休み）
      subjects: SUBJECTS.map(([code, name, group]) => ({ code, name, group, counted: true, joint: !!JOINT[code] }))
        .concat(NOT_COUNTED.map(([code, name]) => ({ code, name, group: '', counted: false, joint: true }))),
      terms,
      bases,
      events: [],
      ovr: {},
      log: [],
      lines: {},
      memo: {},
      weekMeta: {},
      teach: {},
      targets: {},
      opt: { mark: true, showStaff: true, firstHeaderColor: true, printDate: true, backupDated: false },
      savedAt: '',
      backupAt: '',
    };
  };

  /* 読みこんだデータの形をそろえる（古いバックアップや一部欠けても動くように） */
  m.normalize = (s) => {
    const b = m.blank(s && s.school && s.school.year);
    const st = Object.assign({}, b, s || {});
    st.school = Object.assign({}, b.school, st.school || {});
    st.opt = Object.assign({}, b.opt, st.opt || {});
    ['events', 'log'].forEach((k) => Array.isArray(st[k]) || (st[k] = []));
    ['ovr', 'lines', 'memo', 'weekMeta', 'teach', 'targets', 'bases'].forEach((k) => (st[k] && typeof st[k] === 'object') || (st[k] = {}));
    st.terms.forEach((t) => st.bases[t.id] || (st.bases[t.id] = { cells: {}, staff: {} }));
    Object.values(st.bases).forEach((bs) => {
      bs.cells = bs.cells || {};
      bs.staff = bs.staff || {};
    });
    return st;
  };

  /* ---------- いまのデータ（store.js が入れる） ---------- */
  m.st = null;
  let cache = {};
  m.touch = () => (cache = {}); // データが変わったら計算の控えを捨てる

  const memo = (bucket, key, fn) => {
    const b = cache[bucket] || (cache[bucket] = new Map());
    if (b.has(key)) return b.get(key);
    const v = fn();
    b.set(key, v);
    return v;
  };

  /* ---------- 名簿・校時・教科 ---------- */
  m.cls = (id) => m.st.classes.find((c) => c.id === id);
  m.grades = () => [...new Set(m.st.classes.map((c) => c.g))];
  m.slot = (id) => m.st.slots.find((s) => s.id === id);
  m.slotIndex = (id) => m.st.slots.findIndex((s) => s.id === id);
  m.slotName = (id) => {
    if (id === 'am') return '朝';
    if (id === 'pm') return '帰り';
    const s = m.slot(id);
    return s ? `${s.label}限` : id;
  };
  m.clsName = (id) => id; // 「1-1」の形で書く
  m.subject = (text) => {
    const k = u.key(text);
    if (!k) return null;
    return memo('subj', k, () => m.st.subjects.find((s) => u.key(s.code) === k) || m.st.subjects.find((s) => u.key(s.name) === k) || null);
  };

  /* ---------- 期間・その日の様子 ---------- */
  m.termOf = (d) => m.st.terms.find((t) => t.start && t.end && d >= t.start && d <= t.end) || null;
  m.base = (termId) => m.st.bases[termId] || (m.st.bases[termId] = { cells: {}, staff: {} });

  m.eventsOn = (d) =>
    memo('evOn', d, () =>
      m.st.events
        .filter((e) => e.date && d >= e.date && d <= (e.end && e.end >= e.date ? e.end : e.date))
        .sort((a, b) => (m.slotIndex(a.from) - m.slotIndex(b.from)) || (a.title > b.title ? 1 : -1))
    );

  m.targets = (e, clsId) => {
    const t = e.targets && e.targets.length ? e.targets : ['all'];
    if (t.includes('all')) return true;
    const c = m.cls(clsId);
    return t.includes(clsId) || (c && t.includes('g' + c.g));
  };
  m.targetLabel = (e) => {
    const t = e.targets && e.targets.length ? e.targets : ['all'];
    if (t.includes('all')) return '全校';
    return t.map((x) => (x[0] === 'g' ? `${x.slice(1)}年` : x)).join('・');
  };

  // その日の情報：授業がある日か、どの基本時間割の何曜日を使うか、並ぶ校時
  m.day = (d) =>
    memo('day', d, () => {
      const wd = u.dow(d);
      const evs = m.eventsOn(d);
      const swap = evs.find((e) => e.kind === 'swap');
      const off = evs.find((e) => e.kind === 'holiday');
      const hol = u.holiday(d);
      const term = m.termOf(d);
      const weekday = wd >= 1 && wd <= 5;
      let school = !!term && (weekday || !!swap);
      let offName = '';
      if (school && hol && !swap) {
        school = false;
        offName = hol;
      }
      if (school && off) {
        school = false;
        offName = off.title;
      }
      const baseWd = swap && swap.swapWd != null && swap.swapWd !== '' ? Number(swap.swapWd) : wd;
      const layout = weekday ? m.st.daySlots[wd] : m.st.daySlots[baseWd >= 1 && baseWd <= 5 ? baseWd : 1];
      // 短縮日課など、その日だけ「授業なし」にした校時
      const offSlots = new Set(((m.st.lines[d] || {}).off || []).filter(Boolean));
      evs.filter((e) => e.kind === 'short' && e.upTo).forEach((e) => {
        const lim = m.slotIndex(e.upTo);
        (layout || []).forEach((s) => m.slotIndex(s) > lim && s !== 'pm' && offSlots.add(s));
      });
      return { d, wd, weekday, school, term, baseWd, layout: layout || [], offSlots, hol, offName, swap, events: evs };
    });

  m.eventSlots = (e, layout) => {
    if (!e.from) return [];
    if (e.from === 'all') return layout.slice();
    const a = m.slotIndex(e.from);
    const b = m.slotIndex(e.to || e.from);
    return layout.filter((s) => {
      const i = m.slotIndex(s);
      return i >= Math.min(a, b) && i <= Math.max(a, b);
    });
  };

  /* ---------- コマの中身 ---------- */
  m.ck = (d, s, c) => `${d}|${s}|${c}`;

  // 基本時間割のコマ（曜日 wd・校時 s・クラス c）
  m.baseCell = (termId, wd, s, c) => {
    const b = m.st.bases[termId];
    return (b && b.cells[`${wd}|${s}|${c}`]) || null;
  };

  // 手で変えたものを除いた中身（行事 → 基本）
  m.under = (d, s, c) =>
    memo('under', m.ck(d, s, c), () => {
      const day = m.day(d);
      if (!day.school || day.offSlots.has(s)) return { t: '', m: '', src: 'off' };
      const ev = day.events.find((e) => e.kind === 'event' && e.from && m.targets(e, c) && m.eventSlots(e, day.layout).includes(s));
      if (ev) return ev.noText ? { t: '', m: '', src: 'ev', ev } : { t: ev.short || ev.title, m: 'ev:' + ev.id, src: 'ev', ev };
      let cell = m.baseCell(day.term.id, day.baseWd, s, c);
      if (!cell && day.baseWd !== day.wd && !(m.st.daySlots[day.baseWd] || []).includes(s)) cell = m.baseCell(day.term.id, day.wd, s, c);
      return cell ? { t: cell.t || '', m: cell.m || '', src: 'base' } : { t: '', m: '', src: 'base' };
    });

  // 実際の中身
  m.cell = (d, s, c) =>
    memo('cell', m.ck(d, s, c), () => {
      const under = m.under(d, s, c);
      const o = m.st.ovr[m.ck(d, s, c)];
      if (o && under.src !== 'off') {
        return { t: o.t || '', m: o.m || '', src: 'ovr', mk: o.mk || '', bg: o.bg || '', b: !!o.b, red: !!o.red, under, changed: (o.t || '') !== under.t };
      }
      return Object.assign({}, under, { under, changed: false });
    });

  // 時数として何に数えるか（教科の記号を返す。数えないなら ''）
  m.countCode = (r) => {
    if (r.src === 'off') return '';
    if (r.src === 'ev') return r.ev.countAs || '';
    const sj = m.subject(r.t);
    return sj && sj.counted ? sj.code : '';
  };

  /* ---------- 週 ---------- */
  m.fyStart = () => `${m.st.school.year}-04-01`;
  m.fyEnd = () => `${m.st.school.year + 1}-03-31`;
  // 授業のある週に 1 から番号をふる（夏休みなど授業のない週は飛ばす）
  m.weeks = () =>
    memo('weeks', 'all', () => {
      const out = [];
      let n = 0;
      for (let mon = u.monday(m.fyStart()); mon <= m.fyEnd(); mon = u.add(mon, 7)) {
        const has = u.range(mon, u.add(mon, 6)).some((d) => m.day(d).school);
        out.push({ mon, no: has ? ++n : 0 });
      }
      return out;
    });
  m.weekNo = (mon) => {
    const w = m.weeks().find((x) => x.mon === mon);
    return w ? w.no : 0;
  };

  /* ---------- 時数 ---------- */
  m.countDay = (d, into) => {
    const day = m.day(d);
    if (!day.school) return into;
    day.layout.forEach((s) => {
      const sl = m.slot(s);
      if (!sl) return;
      m.st.classes.forEach((c) => {
        const code = m.countCode(m.cell(d, s, c.id));
        if (!code) return;
        // 朝・帰りの C の行は、ふつうは数えない。ただし授業（教科）を入れたときは数える（自習は数えない）
        if (!sl.counted) {
          const sj = m.subject(code);
          if (!sj || (sj.group || sj.code) === '自習' || code === '行事') return;
        }
        const row = into[c.id] || (into[c.id] = {});
        row[code] = (row[code] || 0) + 1;
      });
    });
    return into;
  };
  m.countRange = (from, to) =>
    memo('count', from + '~' + to, () => {
      const out = {};
      if (from > to) return out;
      u.range(from, to).forEach((d) => m.countDay(d, out));
      return out;
    });
  // 教科のまとまり（理a・理b → 理 など）で足しなおす
  m.byGroup = (counts) => {
    const out = {};
    Object.entries(counts).forEach(([cid, row]) => {
      const o = (out[cid] = {});
      Object.entries(row).forEach(([code, n]) => {
        const sj = m.subject(code);
        const g = (sj && sj.group) || code;
        o[g] = (o[g] || 0) + n;
      });
    });
    return out;
  };
  m.groups = () => [...new Set(m.st.subjects.filter((s) => s.counted).map((s) => s.group || s.code))];
  m.schoolDays = (from, to) => u.range(from, to).filter((d) => m.day(d).school).length;

  /* ---------- 先生 ---------- */
  m.splitNames = (s) => u.norm(s).split(/[、,，・\/／\s]+/).filter(Boolean);
  m.teachersOf = (clsId, text) => {
    const sj = m.subject(text);
    const v = m.st.teach[`${clsId}|${sj ? sj.code : u.norm(text)}`];
    return v ? m.splitNames(v) : [];
  };
  m.allTeachers = () => {
    const set = new Set();
    Object.values(m.st.teach).forEach((v) => m.splitNames(v).forEach((n) => set.add(n)));
    return [...set].sort((a, b) => a.localeCompare(b, 'ja'));
  };
  // 出張・不在（職員の予定に「だれが」を書いたもの）
  m.absent = (d, s) =>
    memo('absent', d + '|' + s, () => {
      const set = new Set();
      const day = m.day(d);
      day.events.forEach((e) => {
        if (e.kind !== 'staff' || !e.who) return;
        const slots = e.from ? m.eventSlots(e, day.layout) : day.layout;
        if (slots.includes(s)) m.splitNames(e.who).forEach((n) => set.add(n));
      });
      return set;
    });
  // その時間に、同じ先生が2つのクラスに入っていないか・不在の先生の授業がないか
  m.issues = (d, s) =>
    memo('issues', d + '|' + s, () => {
      const out = {};
      const day = m.day(d);
      if (!day.school) return out;
      const who = {};
      m.st.classes.forEach((c) => {
        const r = m.cell(d, s, c.id);
        if (!r.t || r.src === 'ev') return;
        m.teachersOf(c.id, r.t).forEach((n) => (who[n] = who[n] || []).push({ c: c.id, r }));
      });
      const add = (cid, msg) => (out[cid] = out[cid] || []).push(msg);
      Object.entries(who).forEach(([n, list]) => {
        if (list.length < 2) return;
        const sameMerge = list.every((x) => x.r.m && x.r.m === list[0].r.m);
        const sj = m.subject(list[0].r.t);
        const joint = sj && sj.joint && list.every((x) => u.key(x.r.t) === u.key(list[0].r.t));
        if (sameMerge || joint) return;
        list.forEach((x) => add(x.c, `${n}先生が同じ時間に ${list.map((y) => y.c).join('・')}`));
      });
      const abs = m.absent(d, s);
      if (abs.size)
        Object.entries(who).forEach(([n, list]) => {
          if (abs.has(n)) list.forEach((x) => add(x.c, `${n}先生は不在（出張など）`));
        });
      return out;
    });

  /* ---------- 記録の文（出張等の欄に出す） ---------- */
  m.dateWord = (d, ref) => (u.month(d) === u.month(ref) && d.slice(0, 4) === ref.slice(0, 4) ? `${u.day(d)}日` : u.md(d));
  m.shortCls = (id) => id;
})();
