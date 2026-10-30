/* デモ用の見本の学校（「見本中学校」）。先生の名前も時間割もすべて架空。
   毎回おなじ時間割になるように、決まった乱数で作る。 */
(function () {
  const K = window.K;
  const u = K.u;
  const m = K.m;
  const DD = (K.demoData = {});

  // 決まった順番で出る乱数
  function rng(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const shuffle = (arr, r) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  // 学年ごとの週の時数（固定のコマ：月3 道・木7 学・金5〜6 総 をのぞく 27 コマ）
  const COUNTS = {
    1: { 国: 4, 社: 3, 数: 4, 理: 3, 英: 4, 音: 2, 美: 1, 体: 3, 技: 1, 家: 1, 書: 1 },
    2: { 国: 4, 社: 3, 数: 4, 理: 4, 英: 4, 音: 1, 美: 1, 体: 3, 技: 1, 家: 1, 英ALT: 1 },
    3: { 国: 3, 社: 4, 数: 4, 理: 4, 英: 4, 音: 1, 美: 1, 体: 3, 技家: 1, 探: 1, 英ALT: 1 },
  };
  // 担当（架空）
  const T = {
    国: ['山田', '鈴木', '高橋'],
    社: ['伊藤', '伊藤', '渡辺'],
    数: ['中村', '小川', '加藤'],
    理: ['吉田', '山本', '森'],
    英: ['池田', '前田', '岡田'],
    英ALT: [null, '前田', '岡田'],
    音: ['長谷川', '長谷川', '長谷川'],
    美: ['村上', '村上', '村上'],
    体: ['近藤・坂本', '近藤・坂本', '近藤・坂本'],
    技: ['遠藤', '遠藤', null],
    家: ['青木', '青木', null],
    技家: [null, null, '原田'],
    書: ['山田', null, null],
  };
  const HR = { '1-1': '山田', '1-2': '中村', '1-3': '吉田', '2-1': '鈴木', '2-2': '小川', '2-3': '山本', '3-1': '高橋', '3-2': '加藤', '3-3': '森' };

  function makeTimetable(classes, daySlots) {
    const free = [];
    for (let wd = 1; wd <= 5; wd++)
      daySlots[wd].forEach((s) => {
        if (s === 'am' || s === 'pm' || s === '7') return;
        if (wd === 1 && s === '3') return;
        if (wd === 5 && (s === '5' || s === '6')) return;
        free.push(`${wd}|${s}`);
      });
    const teacherOf = (cid, sj) => {
      if (sj === '探') return [HR[cid]];
      const g = Number(cid[0]);
      const t = T[sj] && T[sj][g - 1];
      return t ? t.split('・') : [];
    };
    for (let seed = 1; seed < 400; seed++) {
      const r = rng(seed * 7919);
      const cells = {};
      const busy = {}; // slot -> Set(先生)
      const mark = (slot, names) => names.forEach((n) => (busy[slot] = busy[slot] || new Set()).add(n));
      const isBusy = (slot, names) => names.some((n) => busy[slot] && busy[slot].has(n));
      const left = {};
      classes.forEach((c) => (left[c.id] = Object.assign({}, COUNTS[c.g])));
      let ok = true;
      // 体育は学年そろって同じ時間（先生は学年をまたいで同じなので、学年どうしはずらす）
      for (const g of [1, 2, 3]) {
        const ids = classes.filter((c) => c.g === g).map((c) => c.id);
        const cand = shuffle(free, r).filter((sl) => !isBusy(sl, teacherOf(ids[0], '体')));
        const days = new Set();
        const pick = [];
        for (const sl of cand) {
          const wd = sl.split('|')[0];
          if (days.has(wd)) continue;
          pick.push(sl);
          days.add(wd);
          if (pick.length === 3) break;
        }
        if (pick.length < 3) ok = false;
        pick.forEach((sl) => {
          ids.forEach((id) => {
            cells[`${sl}|${id}`] = '体';
            left[id].体--;
          });
          mark(sl, teacherOf(ids[0], '体'));
        });
      }
      if (!ok) continue;
      // のこりを、先生が重ならないように埋める
      for (const sl of shuffle(free, r)) {
        const wd = sl.split('|')[0];
        for (const c of shuffle(classes, r)) {
          if (cells[`${sl}|${c.id}`]) continue;
          const today = free.filter((x) => x.split('|')[0] === wd).map((x) => cells[`${x}|${c.id}`]);
          const opts = Object.entries(left[c.id])
            .filter(([sj, n]) => n > 0 && !isBusy(sl, teacherOf(c.id, sj)))
            .sort((a, b) => b[1] - a[1] + (today.includes(a[0]) ? 2 : 0) - (today.includes(b[0]) ? 2 : 0) + (r() - 0.5) * 0.5);
          if (!opts.length) {
            ok = false;
            break;
          }
          const sj = opts[0][0];
          cells[`${sl}|${c.id}`] = sj;
          left[c.id][sj]--;
          mark(sl, teacherOf(c.id, sj));
        }
        if (!ok) break;
      }
      if (ok) return { cells, teacherOf };
    }
    return null;
  }

  DD.make = (year) => {
    const st = m.blank(year);
    st.school.name = '見本中学校';
    st.opt.printDate = true;
    const tt = makeTimetable(st.classes, st.daySlots);
    const base = { cells: {}, staff: { '2|5': '④運営委員会', '2|7': '⑥1年会議', '3|2': '①教育相談', '4|2': '①2年会議', '4|6': '⑤3年会議' } };
    for (let wd = 1; wd <= 5; wd++)
      st.daySlots[wd].forEach((s) =>
        st.classes.forEach((c) => {
          const k = `${wd}|${s}|${c.id}`;
          if (s === 'am') base.cells[k] = { t: '読書', m: `am${wd}g${c.g}` };
          else if (s === 'pm') base.cells[k] = { t: 'C' };
          else if (s === '7') base.cells[k] = { t: '学' };
          else if (wd === 1 && s === '3') base.cells[k] = { t: '道' };
          else if (wd === 5 && (s === '5' || s === '6')) base.cells[k] = { t: '総' };
          else if (tt) base.cells[k] = { t: tt.cells[`${wd}|${s}|${c.id}`] || '' };
        })
      );
    // 後期は、技術と家庭の時間を入れかえた形
    const late = u.clone(base);
    Object.values(late.cells).forEach((x) => {
      if (x.t === '技') x.t = '家';
      else if (x.t === '家') x.t = '技';
    });
    st.bases = { t1: u.clone(base), t2: u.clone(base), t3: late, t4: u.clone(late) };
    // 担当表
    if (tt)
      st.classes.forEach((c) => {
        Object.keys(T).forEach((sj) => {
          const n = tt.teacherOf(c.id, sj);
          if (n.length) st.teach[`${c.id}|${sj}`] = n.join('・');
        });
        ['道', '学', '総', '探'].forEach((sj) => (st.teach[`${c.id}|${sj}`] = HR[c.id]));
      });
    // 計画時数（標準授業時数）
    const STD = { 国: [140, 140, 105], 社: [105, 105, 140], 数: [140, 105, 140], 理: [105, 140, 140], 英: [140, 140, 140], 音: [45, 35, 35], 美: [45, 35, 35], 体: [105, 105, 105], 技家: [70, 70, 35], 道: [35, 35, 35], 総: [50, 70, 70], 学: [35, 35, 35] };
    [1, 2, 3].forEach((g) => {
      st.targets[g] = {};
      Object.entries(STD).forEach(([k, v]) => (st.targets[g][k] = v[g - 1]));
    });
    // 行事（見本）
    const t1 = st.terms[0].start;
    const t3 = st.terms[2].start;
    const ev = (o) => st.events.push(Object.assign({ id: u.uid(), kind: 'event', targets: ['all'], inYear: true, inMonth: true, countAs: '行事' }, o));
    ev({ date: t1, title: '始業式', from: '1', to: '2' });
    ev({ date: u.add(t1, 1), title: '入学式', targets: ['g1'], from: 'all', noText: false });
    ev({ date: u.add(t1, 22), title: '体育大会', from: 'all' });
    ev({ date: st.terms[1].start, title: '始業式', from: '1', to: '2' });
    ev({ date: u.add(st.terms[1].start, 9), title: '文化祭', from: 'all' });
    ev({ date: t3, title: '後期始業式', from: '1' });
    st.events.push({ id: u.uid(), kind: 'staff', date: u.add(t3, 1), title: '職員会議', from: '7', targets: ['all'], inYear: false, inMonth: true });
    ev({ date: u.add(t3, 9), title: '避難訓練', from: '5', place: '運動場' });
    ev({ date: u.add(t3, 16), title: '中間考査', from: 'all', noText: false, countAs: '' });
    ev({ date: st.terms[1].end, title: '前期終業式', from: '6' });
    // 少しだけ過去の週の変更（時数の「学年内の差」が見えるように）
    const mon0 = u.monday(u.add(t3, 7));
    const put = (d, s, c, t) => (st.ovr[`${d}|${s}|${c}`] = { t, mk: 'o' });
    put(u.add(mon0, 1), '2', '1-2', '自習');
    put(u.add(mon0, 2), '4', '1-2', '自習');
    put(u.add(mon0, 3), '1', '2-3', '自習');
    st.savedAt = new Date().toISOString();
    return st;
  };

  // デモで使う週（後期の、平日がぜんぶ授業日で行事のない週）
  DD.week = () => {
    const t3 = m.st.terms[2];
    let mon = u.monday(u.add(t3.start, 14));
    for (let k = 0; k < 10; k++, mon = u.add(mon, 7)) {
      const ok = [0, 1, 2, 3, 4].every((i) => {
        const day = m.day(u.add(mon, i));
        return day.school && !day.events.some((e) => e.kind !== 'staff');
      });
      if (ok) return mon;
    }
    return u.monday(u.add(t3.start, 14));
  };
})();
