/* 体育館よやく：状態を変える操作（申込・取り下げ・抽選・確定・キャンセル・先着の予約・学校の使用・利用の確認・違反点数・日付）。画面を持たない。
   どの操作も { ok, msg } を返す。msg は画面にそのまま出す文。 */
(function (G) {
  'use strict';
  const GB = G.GB = G.GB || {};
  const D = GB.date, A = GB.act = {};
  const nid = (st, p) => `${p}${++st.seq}`;
  const notify = (st, orgId, text) => { st.notices.unshift({ id: nid(st, 'n'), orgId, at: st.clock, text }); };
  const fail = msg => ({ ok: false, msg });
  const where = (st, x) => {
    const fac = GB.find(st.facilities, x.facilityId), sl = fac && GB.slot(st, fac, x.date, x.slotId);
    return `${GB.mdw(x.date)} ${sl ? sl.label : ''}・${fac ? fac.name : ''}`;
  };
  A.where = where;

  /* ---- 団体：抽選の申込・取り下げ ---- */
  A.apply = (st, orgId, facId, date, slotId, need) => {
    const why = GB.blocker(st, orgId, facId, date, slotId, need, 'apply');
    if (why) return fail(why);
    st.apps.push({ id: nid(st, 'a'), orgId, facilityId: facId, date, slotId, need, month: D.ym(date), status: 'applied', reason: '', at: st.clock });
    return { ok: true, msg: `抽選に申し込みました（${GB.ymLabel(D.ym(date))} ${GB.appCount(st, orgId, D.ym(date))}/${st.settings.maxApps} 件）` };
  };
  A.withdraw = (st, appId) => {
    const a = GB.find(st.apps, appId);
    if (!a || a.status !== 'applied') return fail('この申込は取り下げられません');
    if (GB.phase(st, a.month) !== 'apply') return fail('申込期間が終わったので、取り下げられません');
    a.status = 'withdrawn';
    return { ok: true, msg: '申込を取り下げました' };
  };

  /* ---- 市役所：抽選 ---- */
  A.runLottery = (st, ym, seed) => {
    const s = st.settings, sc0 = GB.schedule(st, ym);
    if (sc0.run) return fail('この月の抽選はもう終わっています');
    if (st.clock < sc0.applyStart) return fail(`この月の申込はまだ始まっていません（${GB.md(sc0.applyStart)} から）`);
    seed = String(seed || '').trim();
    if (!seed) return fail('シード（抽選に使う数字や言葉）を入れてください');
    if (st.clock < sc0.draw) A.setClock(st, sc0.draw);                // デモ：申込を締め切って、抽選日まで進める
    const confirmBy = st.clock > sc0.confirmEnd ? D.add(st.clock, s.confirmEnd - s.drawDay) : sc0.confirmEnd;
    const input = GB.lotteryInput(st, ym), out = GB.draw(input, seed);
    st.runs.push({ month: ym, seed, at: st.clock, confirmBy, input, results: out.results });
    const tally = {};
    for (const app of st.apps) {
      const r = out.results[app.id];
      if (!r || app.month !== ym || app.status !== 'applied') continue;
      app.status = r.status; app.reason = r.reason || ''; app.tickets = r.tickets || null;
      const t = tally[app.orgId] = tally[app.orgId] || { won: 0, lost: 0, invalid: 0 };
      t[r.status]++;
      if (r.status === 'won') st.bookings.push({ id: nid(st, 'b'), orgId: app.orgId, facilityId: app.facilityId, date: app.date, slotId: app.slotId, need: app.need, half: r.half, source: 'lottery', status: 'pending', at: st.clock, appId: app.id });
    }
    let won = 0;
    for (const [orgId, t] of Object.entries(tally)) {
      const org = GB.find(st.orgs, orgId);
      won += t.won;
      if (org && t.won + t.lost) org.lossStreak = t.won ? 0 : (org.lossStreak || 0) + 1;
      notify(st, orgId, `${GB.ymLabel(ym)}の抽選：当選 ${t.won} 件・落選 ${t.lost} 件${t.invalid ? `・対象外 ${t.invalid} 件` : ''}。` + (t.won ? `${GB.md(confirmBy)} までに当選を確定してください（確定しないと取り消されます）。` : ''));
    }
    return { ok: true, msg: `${GB.ymLabel(ym)}を抽選しました（申込 ${input.items.length + input.invalid.length} 件 → 当選 ${won} 件）` };
  };

  /* ---- 団体：当選の確定・辞退・キャンセル・先着の予約 ---- */
  A.confirm = (st, bookingId) => {
    const b = GB.find(st.bookings, bookingId);
    if (!b || b.status !== 'pending') return fail('この当選は確定できません');
    if (st.clock > GB.schedule(st, D.ym(b.date)).confirmEnd) return fail('確定の締切を過ぎています');
    b.status = 'confirmed';
    return { ok: true, msg: `確定しました：${where(st, b)}` };
  };
  A.cancel = (st, bookingId) => {
    const s = st.settings, b = GB.find(st.bookings, bookingId);
    if (!b || !['pending', 'confirmed'].includes(b.status)) return fail('この予約は取り消せません');
    if (b.date <= st.clock) return fail('利用日の当日・過ぎた日の予約は取り消せません（学校か市役所に連絡してください）');
    const was = b.status;
    b.status = 'cancelled';
    if (was === 'pending') return { ok: true, msg: `当選を辞退しました：${where(st, b)}（違反にはなりません）` };
    const left = D.diff(b.date, st.clock);
    if (left < s.freeCancelDays && s.ptLate > 0) {
      penalty(st, GB.find(st.orgs, b.orgId), s.ptLate, `${GB.md(b.date)} の直前のキャンセル`);
      return { ok: true, msg: `キャンセルしました。利用日の ${s.freeCancelDays} 日前を過ぎていたので、違反点数が ${s.ptLate} 点つきました` };
    }
    return { ok: true, msg: `キャンセルしました：${where(st, b)}` };
  };
  A.book = (st, orgId, facId, date, slotId, need) => {
    const why = GB.blocker(st, orgId, facId, date, slotId, need, 'book');
    if (why) return fail(why);
    const fac = GB.find(st.facilities, facId), occ = GB.occupancy(st, fac, date, slotId);
    const b = { id: nid(st, 'b'), orgId, facilityId: facId, date, slotId, need, half: need === 'full' || fac.areas < 2 ? null : occ.free[0], source: 'first', status: 'confirmed', at: st.clock };
    st.bookings.push(b);
    return { ok: true, msg: `予約しました：${where(st, b)}` };
  };

  /* ---- 学校・市役所：学校で使う日／大会の優先確保（入っていた予約には、自動でお知らせ） ---- */
  A.addBlock = (st, { facilityId, date, slotId, kind, reason }) => {
    const fac = GB.find(st.facilities, facilityId);
    if (!fac) return fail('施設をえらんでください');
    if (!date) return fail('日付を入れてください');
    if (date <= st.clock) return fail('明日以降の日付にしてください');
    reason = String(reason || '').trim() || (kind === 'school' ? '学校行事' : '大会');
    if (!GB.slotsOn(st, fac, date).length) return fail('この日は休館日です');
    if (slotId && !GB.slot(st, fac, date, slotId)) return fail('この日に、そのコマはありません');
    const hit = sid => !slotId || sid === slotId;
    if (st.blocks.some(b => b.facilityId === facilityId && b.date === date && (!b.slotId || !slotId || b.slotId === slotId))) return fail('この日（このコマ）は、すでに登録されています');
    st.blocks.push({ id: nid(st, 'k'), facilityId, date, slotId: slotId || null, kind, reason });
    let moved = 0;
    for (const b of st.bookings) if (b.facilityId === facilityId && b.date === date && hit(b.slotId) && ['pending', 'confirmed'].includes(b.status)) {
      b.status = 'displaced'; moved++;
      notify(st, b.orgId, `${where(st, b)} は「${reason}」で使えなくなりました。予約を取り消しました（違反にはなりません）`);
    }
    for (const r of GB.regularsOn(st, date)) if (r.facilityId === facilityId && hit(r.slotId)) {
      moved++;
      notify(st, r.orgId, `定期枠の ${GB.mdw(date)}（${fac.name}）は「${reason}」で使えません`);
    }
    for (const a of st.apps) if (a.facilityId === facilityId && a.date === date && hit(a.slotId) && a.status === 'applied') {
      a.status = 'invalid'; a.reason = `${reason}のため使えなくなりました`; moved++;
      notify(st, a.orgId, `抽選の申込（${where(st, a)}）は「${reason}」が入ったため、抽選の対象外になりました`);
    }
    return { ok: true, msg: `登録しました${moved ? `（${moved} 団体にお知らせしました）` : ''}` };
  };
  A.removeBlock = (st, blockId) => {
    const i = st.blocks.findIndex(b => b.id === blockId);
    if (i < 0) return fail('見つかりません');
    st.blocks.splice(i, 1);
    return { ok: true, msg: '取り消しました（空いたコマは、受付の段階に応じて申込・予約できます）' };
  };

  /* ---- 学校：利用の確認（使わなかったときは違反点数） ---- */
  A.markUse = (st, bookingId, used) => {
    const s = st.settings, b = GB.find(st.bookings, bookingId);
    if (!b || b.status !== 'confirmed') return fail('この予約は確認できません');
    if (b.date > st.clock) return fail('利用日のあとに確認してください');
    b.status = used ? 'used' : 'noshow';
    if (!used && s.ptNoShow > 0) penalty(st, GB.find(st.orgs, b.orgId), s.ptNoShow, `${GB.md(b.date)} の無断の不使用`);
    return { ok: true, msg: used ? '「使った」にしました' : `「使わなかった」にしました（違反点数 ${s.ptNoShow} 点）` };
  };

  function penalty(st, org, pts, why) {
    const s = st.settings;
    if (!org) return;
    org.points = (org.points || 0) + pts;
    notify(st, org.id, `違反点数 +${pts}（${why}）。いま ${org.points}/${s.ptLimit} 点です`);
    if (org.points >= s.ptLimit) {
      org.suspendUntil = D.on(D.addMonths(D.ym(st.clock), s.suspendMonths), +st.clock.slice(8));
      org.points = 0;
      notify(st, org.id, `違反点数が ${s.ptLimit} 点に達したため、${GB.md(org.suspendUntil)} まで抽選の申込と先着の予約を止めます`);
    }
  }
  A.penalty = penalty;

  /* ---- 日付（デモ用に進める）と、日付が変わったときの片づけ ---- */
  A.setClock = (st, date) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) return fail('日付の形がちがいます');
    if (date < st.clock) return fail('日付は戻せません（最初からやり直すときは「サンプルに戻す」）');
    st.clock = date;
    A.settle(st);
    return { ok: true, msg: `きょうを ${GB.mdw(date)} にしました` };
  };
  A.settle = st => {
    for (const run of st.runs) {
      const sc = GB.schedule(st, run.month);
      if (st.clock <= sc.confirmEnd) continue;
      for (const b of st.bookings) if (b.source === 'lottery' && b.status === 'pending' && D.ym(b.date) === run.month) {
        b.status = 'expired';
        notify(st, b.orgId, `${where(st, b)} の当選は、確定の手続きがなかったため取り消しました（空いたコマは先着で予約できます）`);
      }
    }
    for (const o of st.orgs) if (o.suspendUntil && st.clock >= o.suspendUntil) {
      o.suspendUntil = null;
      notify(st, o.id, '申込と予約の停止が終わりました');
    }
  };

  /* ---- 市役所：団体・施設・定期枠・ルール ---- */
  A.addOrg = (st, { name, type, districtId, inCity }) => {
    name = String(name || '').trim();
    if (!name) return fail('団体の名前を入れてください');
    if (st.orgs.some(o => o.name === name)) return fail('同じ名前の団体があります');
    st.orgs.push({ id: nid(st, 'o'), name, type: GB.TYPES[type] ? type : 'general', districtId: inCity ? districtId : null, inCity: !!inCity, status: 'pending', points: 0, suspendUntil: null, lossStreak: 0 });
    return { ok: true, msg: `「${name}」を登録しました（承認待ち）` };
  };
  A.addRegular = (st, { facilityId, orgId, weekday, slotId, need }) => {
    const fac = GB.find(st.facilities, facilityId), org = GB.find(st.orgs, orgId), s = st.settings;
    if (!fac || !org) return fail('施設と団体をえらんでください');
    weekday = +weekday;
    const type = weekday === 0 || weekday === 6 ? 'holiday' : 'weekday';
    if (!(s.slots[fac.kind][type] || []).some(x => x.id === slotId)) return fail('その曜日に、そのコマはありません');
    if (need === 'half' && fac.areas < 2) return fail('この体育館は半面に分けられません');
    const fy = +st.clock.slice(0, 4) - (+st.clock.slice(5, 7) < 4 ? 1 : 0);   // 年度（4月はじまり）
    const from = st.clock, to = `${fy + 1}-03-31`, n = GB.units(fac).length, mine = need === 'half' ? 1 : n;
    const same = st.regulars.filter(r => r.facilityId === facilityId && r.weekday === weekday && r.slotId === slotId && r.to >= st.clock);
    if (same.reduce((a, r) => a + (r.need === 'half' ? 1 : n), 0) + mine > n) return fail('その曜日のそのコマには、もう定期枠があります');
    const clash = st.bookings.find(b => b.facilityId === facilityId && b.slotId === slotId && b.date > st.clock && ['pending', 'confirmed'].includes(b.status) && D.wd(b.date) === weekday && GB.dayType(b.date) === type);
    if (clash) return fail(`その曜日のそのコマには、もう予約が入っている日があります（${GB.md(clash.date)}）。定期枠は年度はじめの調整で決めてください`);
    if (st.regulars.filter(r => r.orgId === orgId && r.to >= st.clock).length >= s.maxRegular) return fail(`定期枠は 1 団体につき週 ${s.maxRegular} コマまでです`);
    const share = GB.regularShare(st, fac, mine);
    if (share > s.regularMax) return fail(`定期枠が 1 週間のコマの ${share}％ になり、上限の ${s.regularMax}％ をこえます`);
    const half = need === 'half' ? (same.some(r => r.half === 'A') ? 'B' : 'A') : null;
    st.regulars.push({ id: nid(st, 'r'), facilityId, orgId, weekday, slotId, need, half, from, to });
    return { ok: true, msg: `定期枠を追加しました（${fac.name}：1 週間のコマの ${share}％）` };
  };
  A.removeRegular = (st, id) => {
    const i = st.regulars.findIndex(r => r.id === id);
    if (i < 0) return fail('見つかりません');
    st.regulars.splice(i, 1);
    return { ok: true, msg: '定期枠を削除しました' };
  };
  A.setSettings = (st, next) => {
    const errs = GB.checkSettings(next);
    if (errs.length) return fail(errs[0]);
    st.settings = next;
    return { ok: true, msg: 'ルールを変えました' };
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = GB;
})(typeof window !== 'undefined' ? window : globalThis);
