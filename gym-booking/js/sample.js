/* 体育館よやく：サンプルデータ（実在の施設・団体ではない）。
   「きょう」をいまの月の 5 日にして、
   ・今月分：先月のうちに抽選が終わり、予約が入っている（月のはじめの数日は「使った」まで済んでいる）
   ・来月分：抽選の申込期間のなか（いくつかの団体が申し込み済み）
   という状態を作る。今月分の抽選も、本物の抽選（GB.draw）で決めている。 */
(function (G) {
  'use strict';
  const GB = G.GB = G.GB || {};
  const D = GB.date;

  const districts = [
    { id: 'd1', name: '中部' }, { id: 'd2', name: '北部' }, { id: 'd3', name: '東部' }, { id: 'd4', name: '西部' }, { id: 'd5', name: '南部' },
  ];
  const facilities = [
    { id: 'f1', name: '中部第一中学校 体育館', kind: 'school', districtId: 'd1', areas: 2 },
    { id: 'f2', name: '中部小学校 体育館', kind: 'school', districtId: 'd1', areas: 1 },
    { id: 'f3', name: '北部中学校 体育館', kind: 'school', districtId: 'd2', areas: 2 },
    { id: 'f4', name: '東部中学校 体育館', kind: 'school', districtId: 'd3', areas: 2 },
    { id: 'f5', name: '西部小学校 体育館', kind: 'school', districtId: 'd4', areas: 1 },
    { id: 'f6', name: '南部中学校 体育館', kind: 'school', districtId: 'd5', areas: 2 },
    { id: 'f7', name: '市民体育館 サブアリーナ', kind: 'city', districtId: 'd1', areas: 2 },
  ];
  const org = (id, name, type, districtId, extra = {}) => ({ id, name, type, districtId, inCity: true, status: 'approved', points: 0, suspendUntil: null, lossStreak: 0, ...extra });
  const orgs = [
    org('o1', '中部ミニバス', 'youth', 'd1'),
    org('o2', '中部ジュニアバレー', 'youth', 'd1'),
    org('o3', '北部ミニバス', 'youth', 'd2'),
    org('o4', '東部スポーツ少年団 バスケットボール', 'youth', 'd3'),
    org('o5', '中部地域クラブ バスケットボール', 'club', 'd1'),
    org('o6', '北部地域クラブ バレーボール', 'club', 'd2'),
    org('o7', '東部地域クラブ バスケットボール', 'club', 'd3'),
    org('o8', '南部地域クラブ バドミントン', 'club', 'd5'),
    org('o9', '西部ママさんバレー', 'general', 'd4'),
    org('o10', '中部社会人バスケ', 'general', 'd1'),
    org('o11', '南部ソフトバレー愛好会', 'general', 'd5'),
    org('o12', '（例）民間バスケットボールスクール', 'commercial', 'd1'),
    org('o13', '市外の社会人バドミントン', 'general', null, { inCity: false }),
    org('o14', '中部 親子バドミントン', 'general', 'd1', { status: 'pending' }),
    org('o15', '中部女子ミニバス', 'youth', 'd1'),
    org('o16', '西部ジュニアバドミントン', 'youth', 'd4'),
    org('o17', '中部フットサル同好会', 'general', 'd1'),
    org('o18', '北部シニアバレー', 'general', 'd2'),
  ];
  // 申込のくせ：[施設, 曜日の配列, コマ, 全面/半面, 何件]。どの団体も月の前半の土日に集まりやすい（取り合いが起きる）
  const wants = {
    o1: [['f2', [6], 'am', 'full', 2], ['f1', [6], 'am', 'full', 2], ['f1', [0], 'am', 'full', 2]],
    o2: [['f1', [6], 'am', 'half', 2], ['f7', [6], 'am', 'half', 2], ['f2', [0], 'pm', 'full', 1]],
    o3: [['f3', [6], 'am', 'full', 2], ['f1', [6], 'pm', 'full', 2], ['f3', [0], 'am', 'full', 2]],
    o4: [['f4', [6], 'am', 'full', 2], ['f1', [6], 'am', 'full', 2], ['f1', [3], 'after', 'full', 2]],
    o5: [['f1', [6], 'pm', 'full', 2], ['f1', [3], 'after', 'full', 2], ['f7', [0], 'pm', 'half', 2]],
    o6: [['f3', [6], 'pm', 'half', 2], ['f3', [5], 'after', 'full', 2], ['f3', [6], 'am', 'half', 1]],
    o7: [['f4', [6], 'pm', 'full', 2], ['f4', [3], 'after', 'full', 2], ['f1', [6], 'pm', 'full', 2]],
    o8: [['f6', [6], 'am', 'half', 2], ['f6', [1], 'after', 'half', 2], ['f6', [0], 'pm', 'half', 2]],
    o9: [['f5', [6], 'night', 'full', 2], ['f7', [6], 'am', 'half', 1], ['f1', [1], 'night', 'half', 2]],
    o10: [['f1', [6], 'night', 'full', 2], ['f7', [0], 'pm', 'half', 2], ['f1', [5], 'night', 'full', 2]],
    o11: [['f6', [0], 'am', 'half', 2], ['f6', [4], 'night', 'half', 2], ['f6', [6], 'am', 'half', 1]],
    o12: [['f7', [6], 'am', 'half', 2], ['f7', [0], 'pm', 'half', 2], ['f7', [2], 'night', 'half', 2]],
    o15: [['f2', [6], 'am', 'full', 2], ['f1', [0], 'am', 'full', 2], ['f1', [3], 'after', 'full', 2]],
    o16: [['f5', [6], 'am', 'full', 2], ['f7', [6], 'am', 'half', 2], ['f6', [6], 'am', 'half', 1]],
    o17: [['f7', [0], 'pm', 'half', 2], ['f1', [6], 'night', 'full', 1], ['f7', [2], 'night', 'half', 2]],
    o18: [['f3', [6], 'am', 'half', 2], ['f3', [2], 'night', 'half', 2]],
  };


  function regulars(fy, toYear) {
    const from = `${fy}-04-01`, to = `${toYear}-03-31`;
    const r = (id, facilityId, orgId, weekday, slotId, need = 'full', half = null) => ({ id, facilityId, orgId, weekday, slotId, need, half, from, to });
    return [
      r('r1', 'f1', 'o5', 2, 'after'), r('r2', 'f1', 'o5', 4, 'after'),
      r('r3', 'f3', 'o6', 1, 'after'), r('r4', 'f3', 'o6', 3, 'after'),
      r('r5', 'f4', 'o7', 2, 'after'), r('r6', 'f4', 'o7', 5, 'after'),
      r('r7', 'f2', 'o1', 1, 'night'), r('r8', 'f2', 'o1', 4, 'night'),
      r('r10', 'f5', 'o9', 4, 'night'),
      r('r11', 'f6', 'o8', 2, 'after', 'half', 'A'),
      r('r12', 'f6', 'o11', 3, 'night', 'half', 'A'),
    ];
  }

  // 月のうち、曜日が合う日（休館日や、そのコマがない日はのぞく）
  function datesFor(st, fac, ym, wds, slotId) {
    return D.list(ym).filter(d => wds.includes(D.wd(d)) && GB.slot(st, fac, d, slotId));
  }
  // 申込を作る（申込期間の「きょう」にして、ふつうの申込と同じ確かめをとおす）
  function makeApps(st, ym, rnd) {
    const sc = GB.schedule(st, ym), keep = st.clock;
    for (const [orgId, list] of Object.entries(wants)) {
      for (const [facId, wds, slotId, need, n] of list) {
        const fac = GB.find(st.facilities, facId);
        const pool = datesFor(st, fac, ym, wds, slotId).slice(0, Math.max(n + 1, 3));   // 月の前半の日に集まる
        for (let k = 0; k < n && pool.length; k++) {
          const date = pool.splice(Math.floor(rnd() * pool.length), 1)[0];
          st.clock = D.add(sc.applyStart, Math.floor(rnd() * 4));
          GB.act.apply(st, orgId, facId, date, slotId, need);   // 上限などで申し込めないものは、入らない
        }
      }
    }
    st.clock = keep;
  }

  GB.sample = (now = new Date()) => {
    const ym0 = `${now.getFullYear()}-${D.pad(now.getMonth() + 1)}`;   // いまの月
    const ym1 = D.addMonths(ym0, 1);
    const fy = now.getMonth() + 1 < 4 ? now.getFullYear() - 1 : now.getFullYear();
    const st = {
      v: 1, seq: 100, clock: `${D.addMonths(ym0, -1)}-01`, settings: GB.defaults(),
      districts: districts.map(x => ({ ...x })), facilities: facilities.map(x => ({ ...x })), orgs: orgs.map(x => ({ ...x })),
      regulars: regulars(fy, ym1.slice(5) === '04' ? fy + 2 : fy + 1), blocks: [], apps: [], bookings: [], runs: [], notices: [],   // 3月のデモでは、来年度の分も続ける
    };
    const rnd = GB.rng(`sample|${ym0}`);
    const A = GB.act, sc0 = GB.schedule(st, ym0);

    // 1) 今月分：先月のうちに申込 → 抽選 → ほとんどの団体が確定 → 先着
    A.addBlock(st, { facilityId: 'f7', date: datesFor(st, st.facilities[6], ym0, [0], 'am')[2] || D.on(ym0, 20), kind: 'event', reason: '市の大会（優先確保）' });
    makeApps(st, ym0, rnd);
    A.runLottery(st, ym0, `${ym0}-sample`);
    const pend = st.bookings.filter(b => b.status === 'pending');
    pend.forEach((b, i) => { if (i !== 3) A.confirm(st, b.id); });           // 1件だけ確定しないまま（取り消しの例）
    A.setClock(st, sc0.firstCity);
    const mon = datesFor(st, st.facilities[0], ym0, [1], 'night').find(d => d >= `${ym0}-03` && GB.blocker(st, 'o9', 'f1', d, 'night', 'half', 'book') === '');
    if (mon) A.book(st, 'o9', 'f1', mon, 'night', 'half');
    A.setClock(st, sc0.firstAll);
    const sun = datesFor(st, st.facilities[6], ym0, [0], 'night').filter(d => GB.blocker(st, 'o13', 'f7', d, 'night', 'half', 'book') === '');
    if (sun.length) A.book(st, 'o13', 'f7', sun[sun.length - 1], 'night', 'half');

    // 2) きょう＝今月の 5 日。月のはじめの予約は、学校が「使った」にしてある（2件だけ、まだ確認していない）
    st.clock = `${ym0}-05`;
    A.settle(st);
    const past = st.bookings.filter(b => b.status === 'confirmed' && b.date < st.clock).sort((a, b) => a.date < b.date ? -1 : 1);
    past.forEach((b, i) => { if (i < past.length - 2) b.status = 'used'; });
    GB.find(st.orgs, 'o10').points = 2;                                  // 違反点数の例（前に無断で使わなかったことがある）
    GB.find(st.orgs, 'o3').lossStreak = Math.max(1, GB.find(st.orgs, 'o3').lossStreak);   // 「前回はずれ」の例

    // 3) 来月分：学校行事と大会を先に入れてから、申込期間のなかの申込
    const f1sat = datesFor(st, st.facilities[0], ym1, [6], 'am');
    if (f1sat[1]) A.addBlock(st, { facilityId: 'f1', date: f1sat[1], kind: 'school', reason: '学習発表会' });
    const f3thu = datesFor(st, st.facilities[2], ym1, [4], 'night');
    if (f3thu[0]) A.addBlock(st, { facilityId: 'f3', date: f3thu[0], slotId: 'night', kind: 'school', reason: 'PTA の行事' });
    const f7sun = datesFor(st, st.facilities[6], ym1, [0], 'am');
    if (f7sun[2]) A.addBlock(st, { facilityId: 'f7', date: f7sun[2], kind: 'event', reason: '中学校の大会（優先確保）' });
    const keep = st.clock;
    makeApps(st, ym1, rnd);
    st.clock = keep;

    return st;
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = GB;
})(typeof window !== 'undefined' ? window : globalThis);
