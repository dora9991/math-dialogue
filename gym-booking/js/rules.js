/* 体育館よやく：ルールの計算（日付・祝日・日程・くじの本数・空き区画・申込や予約ができるか）。画面を持たない。
   ブラウザでは window.GB に入る。Node では require すると同じものが返る（tools/test.cjs で検査する）。 */
(function (G) {
  'use strict';
  const GB = G.GB = G.GB || {};

  /* ---- 日付（'YYYY-MM-DD' の文字列であつかう。時差に左右されないよう UTC で計算する） ---- */
  const pad = n => String(n).padStart(2, '0');
  const utc = s => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10));
  const ymd = t => { const d = new Date(t); return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`; };
  const D = GB.date = {
    pad,
    add: (s, n) => ymd(utc(s) + n * 864e5),
    diff: (a, b) => Math.round((utc(a) - utc(b)) / 864e5),            // a − b（日）
    wd: s => new Date(utc(s)).getUTCDay(),                             // 0＝日 … 6＝土
    ym: s => s.slice(0, 7),
    addMonths: (ym, n) => { const t = +ym.slice(0, 4) * 12 + +ym.slice(5, 7) - 1 + n; return `${Math.floor(t / 12)}-${pad(t % 12 + 1)}`; },
    days: ym => new Date(Date.UTC(+ym.slice(0, 4), +ym.slice(5, 7), 0)).getUTCDate(),
    on: (ym, d) => `${ym}-${pad(Math.min(d, D.days(ym)))}`,            // その月の d 日（月末をこえたら月末）
    list: ym => Array.from({ length: D.days(ym) }, (_, i) => `${ym}-${pad(i + 1)}`),
    WD: ['日', '月', '火', '水', '木', '金', '土'],
  };
  GB.md = s => `${+s.slice(5, 7)}/${+s.slice(8, 10)}`;
  GB.mdw = s => `${GB.md(s)}（${D.WD[D.wd(s)]}）`;
  GB.ymLabel = ym => `${+ym.slice(5, 7)}月分`;

  /* ---- 祝日（内閣府の決まりどおりに計算する。春分・秋分は 1980〜2099 年の近似式） ---- */
  const holCache = {};
  function holidays(y) {
    if (holCache[y]) return holCache[y];
    const H = {}, put = (m, d, name) => { H[`${y}-${pad(m)}-${pad(d)}`] = name; };
    const monday = (m, n) => 1 + (8 - new Date(Date.UTC(y, m - 1, 1)).getUTCDay()) % 7 + (n - 1) * 7;   // m 月の第 n 月曜
    const eq = base => Math.floor(base + 0.242194 * (y - 1980) - Math.floor((y - 1980) / 4));
    put(1, 1, '元日'); put(1, monday(1, 2), '成人の日'); put(2, 11, '建国記念の日'); put(2, 23, '天皇誕生日');
    put(3, eq(20.8431), '春分の日'); put(4, 29, '昭和の日'); put(5, 3, '憲法記念日'); put(5, 4, 'みどりの日'); put(5, 5, 'こどもの日');
    put(7, monday(7, 3), '海の日'); put(8, 11, '山の日'); put(9, monday(9, 3), '敬老の日'); put(9, eq(23.2488), '秋分の日');
    put(10, monday(10, 2), 'スポーツの日'); put(11, 3, '文化の日'); put(11, 23, '勤労感謝の日');
    for (const d of Object.keys(H).sort()) {                          // 国民の休日：祝日にはさまれた日
      const m = D.add(d, 1);
      if (!H[m] && H[D.add(d, 2)] && D.wd(m) !== 0) H[m] = '国民の休日';
    }
    for (const d of Object.keys(H).sort()) if (D.wd(d) === 0) {      // 振替休日：日曜の祝日のあと、最初の祝日でない日
      let m = D.add(d, 1);
      while (H[m]) m = D.add(m, 1);
      H[m] = '振替休日';
    }
    return (holCache[y] = H);
  }
  GB.holiday = s => holidays(+s.slice(0, 4))[s] || '';
  GB.dayType = s => (D.wd(s) === 0 || D.wd(s) === 6 || GB.holiday(s)) ? 'holiday' : 'weekday';

  /* ---- 区分と、ルールの既定値（市役所の「ルール」画面で変えられる） ---- */
  GB.TYPES = { club: '認定地域クラブ', youth: '子どもの団体', general: '一般の団体', commercial: '民間スクール等（営利）' };
  GB.TYPE_SHORT = { club: '認定地域クラブ', youth: '子ども', general: '一般', commercial: '営利' };
  GB.KINDS = { school: '学校体育館', city: '市の体育館' };
  const slot = (id, label, start, end, prio = []) => ({ id, label, start, end, prio });
  // 日程の既定値は、佐賀市の体育施設の予約（前月1〜9日に抽選申込・10日抽選・11〜15日に確定・16日から先着）にそろえた
  GB.defaults = () => ({
    lead: 1,                 // 何か月前に抽選するか（1＝利用月の前月）
    applyStart: 1, applyEnd: 9, drawDay: 10, confirmEnd: 15, firstCity: 16, firstAll: 16,
    bookUntil: 3,            // 先着の予約は、利用日の何日前まで
    maxApps: 10,             // 抽選の申込（1団体・1か月）
    maxWins: 4,              // 抽選で当たる上限（1団体・1か月）
    maxTotal: 8,             // 抽選と先着の合計（1団体・1か月。定期枠は数えない）
    maxRegular: 2,           // 定期枠は 1 団体につき週何コマまで
    maxPerDay: 1,            // 1日に使えるコマ（1団体。定期枠もふくむ）
    tickets: { club: 3, youth: 3, general: 2, commercial: 1 },   // くじの本数（区分ごとの基本）
    bonusDistrict: 2,        // 地区内の体育館
    bonusPriority: 2,        // 優先時間帯に、その対象の区分が申し込んだとき
    bonusLoss: 1, lossMax: 2,            // 前回の抽選で1つも当たらなかった：1回につき +1（2回ぶんまで）
    outsideLottery: false,   // 市外の団体も抽選に申し込めるか（学校体育館は、規則で市内の団体だけ）
    commercialSchool: 'none',            // 営利の団体と学校体育館：'none' 使えない／'first' 抽選のあとの空きだけ（先着）／'lottery' 抽選も
    regularMax: 50,          // 定期枠は、1週間のコマ（区画）の何％まで
    freeCancelDays: 7,       // 利用日の何日前までのキャンセルは違反にしない
    ptLate: 1, ptNoShow: 2, ptLimit: 3, suspendMonths: 1,
    showCounts: true,        // 団体に、コマごとの申込の件数を見せる（混んでいるコマを避けてもらう）
    closed: ['12-29', '12-30', '12-31', '01-01', '01-02', '01-03'],
    slots: {
      school: {
        weekday: [slot('after', '放課後', '17:00', '19:00', ['club', 'youth']), slot('night', '夜', '19:00', '21:00')],
        holiday: [slot('am', '午前', '09:00', '12:00'), slot('pm', '午後', '13:00', '17:00'), slot('night', '夜', '18:00', '21:00')],
      },
      city: {
        weekday: [slot('am', '午前', '09:00', '12:00'), slot('pm', '午後', '13:00', '17:00'), slot('night', '夜', '18:00', '21:00')],
        holiday: [slot('am', '午前', '09:00', '12:00'), slot('pm', '午後', '13:00', '17:00'), slot('night', '夜', '18:00', '21:00')],
      },
    },
  });

  // 日程の決まりとして成り立っているか（成り立たないときは、問題の文の配列）
  GB.checkSettings = s => {
    const out = [], days = [s.applyStart, s.applyEnd, s.drawDay, s.confirmEnd, s.firstCity, s.firstAll];
    if (days.some(d => !Number.isInteger(d) || d < 1 || d > 28)) out.push('日程の日にちは 1〜28 の整数にしてください');
    else if (!(s.applyStart <= s.applyEnd && s.applyEnd < s.drawDay && s.drawDay <= s.confirmEnd && s.confirmEnd < s.firstCity && s.firstCity <= s.firstAll))
      out.push('日程は「申込の開始 ≦ 申込の締切 ＜ 抽選日 ≦ 確定の締切 ＜ 先着（市内） ≦ 先着（だれでも）」の順にしてください');
    if (![1, 2].includes(s.lead)) out.push('抽選は、利用月の 1 か月前か 2 か月前にしてください');
    for (const k of ['maxApps', 'maxWins', 'maxTotal', 'maxPerDay', 'maxRegular', 'ptLimit', 'suspendMonths'])
      if (!Number.isInteger(s[k]) || s[k] < 1) out.push('上限と停止の数は 1 以上の整数にしてください');
    if (s.maxWins > s.maxTotal) out.push('抽選の当選の上限は、合計の上限以下にしてください');
    for (const t of Object.keys(GB.TYPES)) if (!Number.isInteger(s.tickets[t]) || s.tickets[t] < 1) out.push('区分ごとのくじの本数は 1 以上の整数にしてください');
    for (const k of ['bonusDistrict', 'bonusPriority', 'bonusLoss', 'lossMax', 'freeCancelDays', 'ptLate', 'ptNoShow', 'bookUntil'])
      if (!Number.isInteger(s[k]) || s[k] < 0) out.push('加える本数・日数・点数は 0 以上の整数にしてください');
    if (!(s.regularMax >= 0 && s.regularMax <= 100)) out.push('定期枠の割合は 0〜100 ％にしてください');
    return [...new Set(out)];
  };

  /* ---- 施設・コマ・定期枠 ---- */
  GB.find = (list, id) => list.find(x => x.id === id) || null;
  GB.units = fac => fac.areas >= 2 ? ['A', 'B'] : ['A'];
  GB.closed = (st, date) => (st.settings.closed || []).includes(date.slice(5));
  GB.slotsOn = (st, fac, date) => GB.closed(st, date) ? [] : ((st.settings.slots[fac.kind] || st.settings.slots.school)[GB.dayType(date)] || []);
  GB.slot = (st, fac, date, slotId) => GB.slotsOn(st, fac, date).find(s => s.id === slotId) || null;
  GB.time = s => `${s.start.replace(/^0/, '')}–${s.end.replace(/^0/, '')}`;
  // 定期枠がその日にあるか（平日の定期枠は、祝日には休み）
  GB.regularOn = (r, date) => D.wd(date) === r.weekday && date >= r.from && date <= r.to && (GB.dayType(date) === 'holiday') === (r.weekday === 0 || r.weekday === 6);

  /* ---- 空き区画：学校行事・大会 → 定期枠 → 予約 の順にふさぐ ---- */
  const LIVE = GB.LIVE = ['pending', 'confirmed', 'used', 'noshow'];
  GB.occupancy = (st, fac, date, slotId) => {
    const units = GB.units(fac), by = {};
    const block = st.blocks.find(b => b.facilityId === fac.id && b.date === date && (!b.slotId || b.slotId === slotId)) || null;
    const put = (half, item) => { for (const u of half ? [half] : units) if (!by[u]) by[u] = item; };
    for (const r of st.regulars) if (r.facilityId === fac.id && r.slotId === slotId && GB.regularOn(r, date)) put(r.need === 'half' ? (r.half || 'A') : null, { kind: 'regular', orgId: r.orgId, ref: r });
    for (const b of st.bookings) if (b.facilityId === fac.id && b.date === date && b.slotId === slotId && LIVE.includes(b.status)) put(b.half, { kind: 'booking', orgId: b.orgId, ref: b });
    return { block, by, units, free: block ? [] : units.filter(u => !by[u]) };
  };
  GB.fits = (occ, need) => need === 'full' ? occ.free.length === occ.units.length : occ.units.length > 1 && occ.free.length > 0;

  /* ---- くじの本数（区分の基本 ＋ 地区内 ＋ 優先時間帯 ＋ 前回はずれ） ---- */
  GB.tickets = (st, org, fac, slot) => {
    const s = st.settings, parts = [[GB.TYPE_SHORT[org.type], +s.tickets[org.type] || 0]];
    if (org.districtId && org.districtId === fac.districtId) parts.push(['地区内', +s.bonusDistrict || 0]);
    if (slot && (slot.prio || []).includes(org.type)) parts.push(['優先時間帯', +s.bonusPriority || 0]);
    const n = Math.min(org.lossStreak || 0, +s.lossMax || 0);
    if (n) parts.push([`前回はずれ${n > 1 ? `（${n}回）` : ''}`, n * (+s.bonusLoss || 0)]);
    const list = parts.filter(p => p[1] > 0);
    return { total: Math.max(1, list.reduce((a, p) => a + p[1], 0)), parts: list };
  };

  /* ---- 月の日程と、いまの段階 ---- */
  GB.lotteryMonth = st => D.addMonths(D.ym(st.clock), st.settings.lead);
  GB.schedule = (st, ym) => {
    const s = st.settings, base = D.addMonths(ym, -s.lead), run = st.runs.find(r => r.month === ym) || null;
    const sc = { month: ym, base, run, applyStart: D.on(base, s.applyStart), applyEnd: D.on(base, s.applyEnd), draw: D.on(base, s.drawDay),
      confirmEnd: D.on(base, s.confirmEnd), firstCity: D.on(base, s.firstCity), firstAll: D.on(base, s.firstAll) };
    if (run && run.confirmBy > sc.confirmEnd) {                        // 抽選が遅れたときは、確定と先着を後ろにずらす
      sc.confirmEnd = run.confirmBy;
      if (sc.firstCity <= sc.confirmEnd) sc.firstCity = D.add(sc.confirmEnd, 1);
      if (sc.firstAll < sc.firstCity) sc.firstAll = sc.firstCity;
    }
    return sc;
  };
  GB.PHASE = { before: '受付前', apply: '抽選の申込期間', closed: '締切後（抽選待ち）', drawing: '抽選待ち', confirm: '当選の確定期間', settle: '先着の受付前', firstCity: '先着（市内の団体）', firstAll: '先着（だれでも）' };
  GB.phase = (st, ym, today = st.clock) => {
    const sc = GB.schedule(st, ym);
    if (today < sc.applyStart) return 'before';
    if (!sc.run) return today <= sc.applyEnd ? 'apply' : today < sc.draw ? 'closed' : 'drawing';
    if (today <= sc.confirmEnd) return 'confirm';
    if (today < sc.firstCity) return 'settle';
    return today < sc.firstAll ? 'firstCity' : 'firstAll';
  };

  /* ---- 数える ---- */
  GB.regularsOn = (st, date) => st.regulars.filter(r => GB.regularOn(r, date) && (() => { const f = GB.find(st.facilities, r.facilityId); return f && GB.slot(st, f, date, r.slotId); })());
  GB.orgDayCount = (st, orgId, date) =>
    GB.regularsOn(st, date).filter(r => r.orgId === orgId).length + st.bookings.filter(b => b.orgId === orgId && b.date === date && LIVE.includes(b.status)).length;
  GB.monthCount = (st, orgId, ym) => st.bookings.filter(b => b.orgId === orgId && D.ym(b.date) === ym && LIVE.includes(b.status)).length;
  GB.appCount = (st, orgId, ym) => st.apps.filter(a => a.orgId === orgId && a.month === ym && a.status === 'applied').length;
  GB.suspended = (st, org) => !!(org.suspendUntil && st.clock < org.suspendUntil);
  // 定期枠が、1週間のコマ（区画の数でかぞえる）の何％を使っているか（祝日は考えない）
  GB.regularShare = (st, fac, extra = 0) => {
    const sl = st.settings.slots[fac.kind] || st.settings.slots.school, n = GB.units(fac).length;
    const total = (sl.weekday.length * 5 + sl.holiday.length * 2) * n;
    const used = st.regulars.filter(r => r.facilityId === fac.id && r.to >= st.clock).reduce((a, r) => a + (r.need === 'half' ? 1 : n), 0) + extra;
    return total ? Math.round(used / total * 100) : 0;
  };

  /* ---- 申込・予約ができない理由（できるときは ''）。
          mode：'apply' 抽選の申込／'draw' 抽選のときの確かめ直し／'book' 先着の予約 ---- */
  GB.blocker = (st, orgId, facId, date, slotId, need, mode) => {
    const s = st.settings, org = GB.find(st.orgs, orgId), fac = GB.find(st.facilities, facId);
    if (!org || !fac) return '団体または施設が見つかりません';
    if (org.status !== 'approved') return '団体の登録がまだ承認されていません（市役所の承認が必要です）';
    if (GB.suspended(st, org)) return `違反点数が上限に達したため、${GB.md(org.suspendUntil)} まで申込と予約を止めています`;
    const sl = GB.slot(st, fac, date, slotId);
    if (!sl) return 'この日は休館日か、このコマがありません';
    if (need === 'half' && fac.areas < 2) return 'この体育館は半面に分けられません';
    const ym = D.ym(date), sc = GB.schedule(st, ym), ph = GB.phase(st, ym), school = fac.kind === 'school';
    if (school && !org.inCity) return '学校体育館を使えるのは、市内に住む・通う・働く人の団体です（学校開放の規則）';
    if (mode === 'book') {
      if (D.diff(date, st.clock) < Math.max(1, s.bookUntil)) return `先着の予約は、利用日の ${Math.max(1, s.bookUntil)} 日前までです`;
      if (ph !== 'firstCity' && ph !== 'firstAll') return `この月の先着の予約は、抽選のあと ${GB.md(sc.firstCity)} からです`;
      if (!org.inCity && ph === 'firstCity') return `市外の団体は ${GB.md(sc.firstAll)} から予約できます`;
      if (school && org.type === 'commercial' && s.commercialSchool === 'none') return '営利目的の団体は、学校体育館を使えません';
    } else {
      if (mode === 'apply' && ph !== 'apply') return ph === 'before' ? `この月の抽選の申込は ${GB.md(sc.applyStart)}〜${GB.md(sc.applyEnd)} です` : 'この月の抽選の申込は締め切りました';
      if (!org.inCity && !s.outsideLottery) return `市外の団体は抽選に申し込めません（${GB.md(sc.firstAll)} からの先着予約は使えます）`;
      if (school && org.type === 'commercial' && s.commercialSchool !== 'lottery')
        return s.commercialSchool === 'none' ? '営利目的の団体は、学校体育館を使えません' : '営利目的の団体は、学校体育館の抽選には申し込めません（抽選のあとの先着予約は使えます）';
    }
    if (mode === 'apply') {
      if (st.apps.some(a => a.orgId === orgId && a.facilityId === facId && a.date === date && a.slotId === slotId && a.status === 'applied')) return 'このコマには申し込み済みです';
      if (GB.appCount(st, orgId, ym) >= s.maxApps) return `抽選の申込は 1 か月 ${s.maxApps} 件までです`;
    }
    if (GB.orgDayCount(st, orgId, date) >= s.maxPerDay) return `この日はすでに使う予定があります（1日 ${s.maxPerDay} コマまで）`;
    if (mode === 'book' && GB.monthCount(st, orgId, ym) >= s.maxTotal) return `1 か月に使えるのは ${s.maxTotal} コマまでです（定期枠は別）`;
    const occ = GB.occupancy(st, fac, date, slotId);
    if (occ.block) return `${occ.block.reason}のため使えません`;
    if (!GB.fits(occ, need)) return need === 'full' && occ.free.length ? '半面しか空いていないので、全面は使えません' : '空いていません';
    return '';
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = GB;
})(typeof window !== 'undefined' ? window : globalThis);
