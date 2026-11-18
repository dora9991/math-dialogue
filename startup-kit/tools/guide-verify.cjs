#!/usr/bin/env node
/* 案内の確認：ツアーと「やりたいこと」の的（CSSセレクタ）が、本当に画面にあるかを調べる。
   使い方：  node tools/guide-verify.cjs                    … 全アプリ（PC とスマホ）
            node tools/guide-verify.cjs --app inbox,sns    … 指定したアプリだけ
            node tools/guide-verify.cjs --shots            … 的に枠を付けた画面を tools/_out/guide-*.png に保存
   初めて開いた状態（サンプル表示）で調べる。 */
const path = require('path');
const { open, closeAll, OUT } = require('./check.cjs');

(async () => {
  const args = process.argv.slice(2);
  const get = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
  const shots = args.includes('--shots');
  const widths = args.includes('--phone') ? [true] : args.includes('--pc') ? [false] : [false, true];
  let failed = 0, total = 0;
  for (const phone of widths) {
    const { page, errs, close } = await open({ app: 'dashboard', fresh: true, phone, wait: 600 });
    const all = await page.evaluate(() => ({ helps: Guide.allHelp().map(([id, h]) => [id, h.tour || []]), tasks: Guide.allTasks() }));
    const want = get('--app') ? get('--app').split(',') : null;
    const items = [];
    for (const [id, tour] of all.helps) {
      if (want && !want.includes(id)) continue;
      tour.forEach((s, i) => items.push({ kind: 'tour', app: id, n: i + 1, label: s.title, target: phone && s.targetPhone ? s.targetPhone : s.target, skip: phone && s.skipOnPhone, params: s.params || {} }));
    }
    for (const t of all.tasks) {
      if (want && !want.includes(t.app)) continue;
      items.push({ kind: 'task', app: t.app, n: t.id, label: t.title, target: phone && t.targetPhone ? t.targetPhone : t.target, skip: phone && t.skipOnPhone, params: t.params || {} });
    }
    for (const it of items) {
      total++;
      const where = `${phone ? 'スマホ' : 'PC'} ${it.kind === 'tour' ? 'ツアー' : 'やりたいこと'} ${it.app} ${it.n}「${it.label}」`;
      if (it.skip) { console.log('--  ' + where + '（スマホでは出さない）'); continue; }
      if (!it.target) { console.log('OK  ' + where + '（的なし：画面を開くだけ）'); continue; }
      await page.evaluate(([a, p]) => Kit.go(a, p), [it.app, it.params]);
      await page.waitForSelector('.app-' + it.app, { timeout: 6000 }).catch(() => {});
      await page.waitForTimeout(450);
      const r = await page.evaluate((sel) => {
        let els;
        try { els = [...document.querySelectorAll(sel)]; } catch (e) { return { bad: 'セレクタの書き方が正しくない' }; }
        const vis = els.filter((el) => { const b = el.getBoundingClientRect(); return b.width > 4 && b.height > 4 && getComputedStyle(el).visibility !== 'hidden'; });
        if (!vis.length) return { bad: els.length ? '見えていない（' + els.length + '個あるが大きさ0か非表示）' : '見つからない' };
        const b = vis[0].getBoundingClientRect();
        return { n: vis.length, w: Math.round(b.width), h: Math.round(b.height) };
      }, it.target);
      if (r.bad) { failed++; console.log('NG  ' + where + '  ' + it.target + ' → ' + r.bad); continue; }
      console.log(`OK  ${where}  ${it.target} → ${r.n}個（最初 ${r.w}×${r.h}）`);
      if (shots) {
        await page.evaluate((sel) => { const el = [...document.querySelectorAll(sel)].find((e) => e.getBoundingClientRect().width > 4); el.scrollIntoView({ block: 'center' }); el.style.outline = '3px solid #e25a33'; el.style.outlineOffset = '2px'; window.__gv = el; }, it.target);
        await page.waitForTimeout(150);
        await page.screenshot({ path: path.join(OUT, `guide-${it.app}-${phone ? 'phone' : 'pc'}-${it.kind}-${it.n}.png`) });
        await page.evaluate(() => { if (window.__gv) { window.__gv.style.outline = ''; window.__gv.style.outlineOffset = ''; } });
      }
    }
    if (errs.length) { failed++; console.log('NG  コンソールのエラー：\n    ' + errs.join('\n    ')); }
    await close();
  }
  await closeAll();
  console.log(failed ? `\n${failed} / ${total} 件に問題あり` : `\nすべて OK（${total} 件）`);
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
