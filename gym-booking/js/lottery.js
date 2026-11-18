/* 体育館よやく：抽選。画面を持たない。
   ・乱数は「シード」（文字列）から作る。同じ申込と同じシードなら、だれが何度やっても同じ結果になる（あとから再現して確かめられる）。
   ・コマごとに、くじを引く。当たる確率は、くじの本数に比例する（7本と2本なら 7/9 と 2/9）。
   ・コマを引く順番も乱数で決める。1か月の当選の上限・1日のコマ数の上限に達した団体は、そのあとのコマのくじから外れる。
   ・半面に分けられる体育館は、半面ずつ（A面・B面）引く。同じコマで1団体が2区画当たることはない。 */
(function (G) {
  'use strict';
  const GB = G.GB = G.GB || {};
  const idn = id => +String(id).replace(/\D/g, '');

  // シードの文字列から、0 以上 1 未満の乱数を順に返す関数を作る（cyrb53 でまぜて、mulberry32 で出す）
  GB.rng = seed => {
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0; i < seed.length; i++) {
      const c = seed.charCodeAt(i);
      h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    let a = h1 >>> 0;
    return () => {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  // 抽選に入れる申込を、くじの本数つきで並べる。これを run.input に残すので、あとから同じ抽選をやり直せる
  GB.lotteryInput = (st, ym) => {
    const s = st.settings, items = [], invalid = [], capacity = {}, dayUsed = {}, count = {};
    const apps = st.apps.filter(a => a.month === ym && a.status === 'applied').sort((a, b) => idn(a.id) - idn(b.id));
    for (const a of apps) {
      count[a.orgId] = (count[a.orgId] || 0) + 1;
      const why = count[a.orgId] > s.maxApps ? `申込の上限（${s.maxApps} 件）をこえた分です` : GB.blocker(st, a.orgId, a.facilityId, a.date, a.slotId, a.need, 'draw');
      if (why) { invalid.push({ appId: a.id, reason: why }); continue; }
      const org = GB.find(st.orgs, a.orgId), fac = GB.find(st.facilities, a.facilityId);
      const key = `${fac.id}|${a.date}|${a.slotId}`;
      if (!capacity[key]) { const occ = GB.occupancy(st, fac, a.date, a.slotId); capacity[key] = { units: occ.units.length, free: occ.free }; }
      const t = GB.tickets(st, org, fac, GB.slot(st, fac, a.date, a.slotId));
      items.push({ appId: a.id, orgId: a.orgId, key, date: a.date, need: a.need, tickets: t.total, parts: t.parts });
      const d = dayUsed[a.orgId] = dayUsed[a.orgId] || {};
      if (d[a.date] === undefined) d[a.date] = GB.orgDayCount(st, a.orgId, a.date);
    }
    return { month: ym, items, invalid, capacity, dayUsed, maxWins: s.maxWins, maxPerDay: s.maxPerDay };
  };

  // 抽選する。input と seed だけで決まる（状態は変えない）
  GB.draw = (input, seed) => {
    const rnd = GB.rng(`${seed}|${input.month}`);
    const items = input.items.map(x => ({ ...x, state: 'applied', seen: false, skip: '' }));
    const byKey = {};
    for (const it of items) (byKey[it.key] = byKey[it.key] || []).push(it);
    const keys = Object.keys(byKey).sort().map(k => [k, rnd()]).sort((a, b) => a[1] - b[1]).map(x => x[0]);   // コマを引く順番
    const free = {};
    for (const k of keys) free[k] = input.capacity[k].free.slice();
    const wins = {}, day = JSON.parse(JSON.stringify(input.dayUsed || {})), log = [];
    const used = (o, d) => (day[o] && day[o][d]) || 0;
    const fits = it => it.need === 'full' ? free[it.key].length === input.capacity[it.key].units : free[it.key].length > 0;
    keys.forEach((k, order) => {
      const here = new Set();                                          // このコマで当たった団体
      for (;;) {
        const cands = [];
        for (const it of byKey[k]) {
          if (it.state !== 'applied' || here.has(it.orgId)) continue;
          const w = (wins[it.orgId] || 0) >= input.maxWins ? 'cap' : used(it.orgId, it.date) >= input.maxPerDay ? 'day' : fits(it) ? '' : 'fit';
          if (w) { if (!it.skip) it.skip = w; } else cands.push(it);
        }
        if (!cands.length) break;
        const total = cands.reduce((a, c) => a + c.tickets, 0);
        const n = 1 + Math.floor(rnd() * total);                      // 1〜total の番号を引く
        let acc = 0, win = cands[cands.length - 1];
        for (const c of cands) c.seen = true;
        for (const c of cands) { acc += c.tickets; if (n <= acc) { win = c; break; } }
        win.state = 'won';
        win.half = win.need === 'full' || input.capacity[k].units < 2 ? null : free[k][0];
        free[k] = win.need === 'full' ? [] : free[k].slice(1);
        wins[win.orgId] = (wins[win.orgId] || 0) + 1;
        (day[win.orgId] = day[win.orgId] || {})[win.date] = used(win.orgId, win.date) + 1;
        here.add(win.orgId);
        log.push({ order: order + 1, key: k, n, total, cands: cands.map(c => [c.appId, c.tickets]), win: win.appId, half: win.half });
      }
    });
    const results = {};
    const CAP = `当選の上限（1か月 ${input.maxWins} コマ）に達したため`, DAY = `同じ日に、ほかのコマが当たったため（1日 ${input.maxPerDay} コマまで）`;
    for (const it of items) {
      if (it.state === 'won') { results[it.appId] = { status: 'won', half: it.half, tickets: it.tickets }; continue; }
      const reason = it.seen ? 'くじではずれ' : it.skip === 'day' ? DAY : it.skip === 'cap' ? CAP : 'くじではずれ';
      results[it.appId] = { status: 'lost', reason, tickets: it.tickets };
    }
    for (const x of input.invalid) results[x.appId] = { status: 'invalid', reason: x.reason };
    return { results, log, wins };
  };

  // 1つのコマだけを何度も引いてみて、当たる見込み（％）を出す（上限などは考えない目安）
  GB.odds = (cands, units, freeUnits, appId, times = 2000) => {
    const rnd = GB.rng(`odds|${appId}|${cands.length}`);
    let hit = 0;
    for (let t = 0; t < times; t++) {
      let left = freeUnits, pool = cands.slice();
      while (pool.length) {
        pool = pool.filter(c => c.need === 'full' ? left === units : left > 0);
        if (!pool.length) break;
        const total = pool.reduce((a, c) => a + c.tickets, 0);
        let n = rnd() * total, w = pool[pool.length - 1];
        for (const c of pool) { n -= c.tickets; if (n < 0) { w = c; break; } }
        if (w.id === appId) { hit++; break; }
        left -= w.need === 'full' ? units : 1;
        pool = pool.filter(c => c !== w);
      }
    }
    return Math.round(hit / times * 100);
  };

  // 残っている記録（input と seed）から抽選をやり直して、同じ結果になるかを確かめる
  GB.verifyRun = run => {
    const again = GB.draw(run.input, run.seed).results;
    const ids = Object.keys(run.results);
    return ids.length === Object.keys(again).length && ids.every(id => JSON.stringify(again[id]) === JSON.stringify(run.results[id]));
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = GB;
})(typeof window !== 'undefined' ? window : globalThis);
