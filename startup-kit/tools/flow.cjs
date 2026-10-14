#!/usr/bin/env node
/* つながりの確認：ツールどうしの受け渡しを、本物のブラウザで通しで試す。
   ・初めて開いた状態で、ダッシュボードに各ツールのサンプルが集まっているか
   ・ホームページの試し送信 → 集客窓口に届くか
   ・問い合わせ → 見積書（宛先が入るか）／予約日時 → カレンダーに出るか
   ・サンプルを片付けたあと、全ツールがエラーなく空の状態で開けるか
   ・バックアップの書き出し → すべて消す → 戻す、で元どおりになるか
   使い方：  node tools/flow.cjs */
const fs = require('fs');
const path = require('path');
const { open, closeAll, OUT } = require('./check.cjs');

const APPS = ['dashboard', 'site', 'editor', 'video', 'inbox', 'sns', 'money', 'invoice', 'calendar', 'canvas', 'roadmap'];
let failed = 0;
const ok = (cond, msg) => { console.log((cond ? 'OK  ' : 'NG  ') + msg); if (!cond) failed++; };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const { page, errs, close } = await open({ app: 'dashboard', fresh: true, wait: 800 });
  const wait = (ms) => page.waitForTimeout(ms);
  const go = async (id, params) => { await page.evaluate(([i, p]) => Kit.go(i, p), [id, params || null]); await page.waitForSelector('.app-' + id); await wait(500); };

  // 1. ダッシュボードにサンプルが集まる
  const todo = await page.$$eval('.db-todo .list-item', (els) => els.length);
  ok(todo >= 3, `ダッシュボードの「やること」にサンプルが出る（${todo}件）`);
  const counts = await page.evaluate(async () => ({
    leads: (await Kit.store.list('leads')).length, events: (await Kit.store.list('events')).length,
    posts: (await Kit.store.list('posts')).length, invoices: (await Kit.store.list('invoices')).length,
    canvases: (await Kit.store.list('canvases')).length, plan: !!(await Kit.store.get('plan')), site: !!(await Kit.store.get('site')), form: !!(await Kit.store.get('form')),
  }));
  ok(counts.leads && counts.events && counts.posts && counts.invoices && counts.canvases && counts.plan && counts.site && counts.form, 'どのツールのサンプルも、ほかのツールから読める ' + JSON.stringify(counts));
  ok(await page.evaluate(() => !!window.MoneyPlan && typeof MoneyPlan.project === 'function'), 'MoneyPlan.project がある');
  await page.screenshot({ path: path.join(OUT, 'flow-1-dashboard.png'), fullPage: true });

  // 2. ホームページの試し送信 → 受付箱
  const before = counts.leads;
  await go('site');
  await page.evaluate(() => window.postMessage({ type: 'mise:inquiry', data: { kind: 'ご相談・お問い合わせ', name: '通し 確認', email: 'flow@example.com', message: 'つながりの確認です', source: 'チラシ', page: 'test', at: new Date().toISOString() } }, '*'));
  await wait(600);
  const after = await page.evaluate(async () => (await Kit.store.list('leads')).filter((l) => l.email === 'flow@example.com'));
  ok(after.length >= 1, `ホームページからの試し送信が受付箱に届く（${before}件 → ${before + after.length}件）`);
  const leadId = after[0] && after[0].id;

  // 3. 問い合わせ → 見積書、予約 → カレンダー
  if (leadId) {
    await go('inbox', { lead: leadId });
    ok(await page.isVisible('text=通し 確認'), '集客窓口で、届いた問い合わせが開ける');
    await page.screenshot({ path: path.join(OUT, 'flow-2-inbox.png') });
    await go('invoice', { fromLead: leadId });
    const prefilled = await page.evaluate(() => Array.from(document.querySelectorAll('.app-invoice input')).some((i) => i.value.includes('通し 確認')));
    ok(prefilled, '問い合わせから見積書を作ると、宛先に名前が入る');
    await page.screenshot({ path: path.join(OUT, 'flow-3-invoice.png') });
    const meet = await page.evaluate(async (id) => { const l = await Kit.store.getItem('leads', id); const d = Kit.rel(2); l.meetingAt = d + 'T15:00'; await Kit.store.put('leads', l); return d; }, leadId);
    await go('calendar', { date: meet });
    const seen = await page.evaluate(() => document.querySelector('.app-calendar').textContent.includes('通し 確認'));
    ok(seen, '予約の日時を入れると、カレンダーに出る');
    await page.screenshot({ path: path.join(OUT, 'flow-4-calendar.png') });
  }

  // 4. サンプルを片付けても、全ツールが開ける
  await page.evaluate(async () => { await Kit.store.samplesOff(); await Kit.store.flush(); });
  for (const id of APPS) {
    const n = errs.length;
    await go(id);
    ok(errs.length === n, `サンプルを片付けたあと「${id}」がエラーなく開ける`);
  }
  await go('dashboard');
  await page.screenshot({ path: path.join(OUT, 'flow-5-empty-dashboard.png'), fullPage: true });

  // 5. バックアップ → すべて消す → 戻す
  const snap = await page.evaluate(async () => { await Kit.store.put('events', { title: 'バックアップ確認', date: Kit.rel(3), allDay: true, cat: 'work' }); await Kit.store.flush(); return Kit.store.exportAll(); });
  await page.evaluate(async () => { await Kit.store.wipeAll(); });
  const wiped = await page.evaluate(async () => (await Kit.store.list('events')).some((e) => e.title === 'バックアップ確認'));
  await page.evaluate(async (d) => { await Kit.store.importAll(d); }, snap);
  const back = await page.evaluate(async () => (await Kit.store.list('events')).some((e) => e.title === 'バックアップ確認'));
  ok(!wiped && back, 'バックアップから戻すと、消したデータが元どおりになる');

  ok(errs.length === 0, 'コンソールにエラーがない' + (errs.length ? '\n    ' + errs.join('\n    ') : ''));
  await close();

  // 6. まとめた1ファイルでも動く
  const allInOne = path.join(__dirname, '..', 'startup-kit-all-in-one.html');
  if (fs.existsSync(allInOne)) {
    const r = await open({ file: 'startup-kit-all-in-one.html', app: 'dashboard', fresh: true, wait: 800 });
    for (const id of APPS) { await r.page.evaluate((i) => Kit.go(i), id); await r.page.waitForSelector('.app-' + id).catch(() => r.errs.push('開けない: ' + id)); await r.page.waitForTimeout(250); }
    ok(r.errs.length === 0, 'all-in-one でも全ツールがエラーなく開ける' + (r.errs.length ? '\n    ' + r.errs.join('\n    ') : ''));
    await r.close();
  }
  await closeAll();
  console.log(failed ? `\n${failed} 件に問題あり` : '\nすべて OK');
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
