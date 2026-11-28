process.env.PORT = process.env.PORT || '8857';
const L = require('../time/t_lib.cjs'); const fs = require('fs');
const lessons = JSON.parse(fs.readFileSync('dist/lessons.json', 'utf8')).lessons;
const idx = Object.fromEntries(JSON.parse(fs.readFileSync('in/index.json', 'utf8')).map(t => [t.id, t]));
const items = {}; for (const f of fs.readdirSync('out').filter(f => /^h1[a-z]\.json$/.test(f))) for (const it of JSON.parse(fs.readFileSync('out/' + f, 'utf8'))) items[it.id] = it;
let fail = 0; const ok = (n, c, i) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + n + (i !== undefined ? '  ' + JSON.stringify(i) : '')); if (!c) fail++; };
const openHub = (b, unitId) => L.open(b, { state: { profile: { name: 'テスト', grade: 'H1', goal: { tier: 'std', track: '', uni: '' } } }, routeState: { name: 'hub', unitId } });
(async () => {
  const b = await L.launch();
  const units = [...new Set(Object.values(lessons).flatMap(v => v.u))].sort();
  const seen = new Set(); const perUnit = {}; const errs = [];
  for (const u of units) {
    const p = await openHub(b, u); p.on('pageerror', e => errs.push(String(e))); await p.waitForTimeout(500);
    const rows = await p.evaluate(() => [...document.querySelectorAll('.tp-row .tp-name')].map(e => e.innerText.trim()));
    perUnit[u] = rows; rows.forEach(r => seen.add(r)); await p.context().close();
  }
  const want = new Set(Object.keys(lessons).map(id => idx[id].t));
  const missing = [...want].filter(t => !seen.has(t));
  ok(`高1 の ${units.length} 単元を開いて、一覧が出る`, units.every(u => (perUnit[u] || []).length > 0), units.filter(u => !(perUnit[u] || []).length));
  ok(`94本の授業の演習が、どれかの単元に出る（出ない授業 ${missing.length}）`, missing.length === 0, missing.slice(0, 5));
  // 章（科目）ごとに 1本ずつ、実際に解く
  for (const [id, lv] of [['m1a-04', 2], ['m1b-03', 4], ['m1c-06', 3], ['m1d-05', 2], ['m1e-04', 1], ['ma1-07', 4], ['ma2-05', 2], ['ma3-04', 3]]) {
    const v = lessons[id], title = idx[id].t;
    const p = await openHub(b, v.u[0]); const pe = []; p.on('pageerror', e => pe.push(String(e))); await p.waitForTimeout(500);
    const clicked = await p.evaluate(([title, lv]) => { const row = [...document.querySelectorAll('.tp-row')].find(r => r.querySelector('.tp-name').innerText.trim() === title); const bt = row && row.querySelector('.tp-b.L' + lv); if (bt) { bt.click(); return true; } return false; }, [title, lv]);
    if (!clicked) { ok(`${id} L${lv}：ボタンがある`, false); await p.context().close(); continue; }
    await p.waitForSelector('.qcard', { timeout: 8000 });
    for (let k = 0; k < 5; k++) {
      await L.run(p, 3000); await L.answer(p, true); await L.waitFeedback(p); await L.run(p, 600); await L.next(p);
      if (k < 4) { await L.waitNewQ(p); await L.run(p, 600); }
    }
    await L.run(p, 1500);
    const res = await p.evaluate(() => document.body.innerText);
    ok(`${id}（${title.slice(0, 16)}…）L${lv}：5問とけて、結果の画面`, /結果/.test(res) && /5\s*問中/.test(res), res.match(/5\s*問中\s*\d+\s*問正解/));
    ok(`${id}：コンソールのエラーなし`, pe.length === 0, pe);
    await p.context().close();
  }
  ok('一覧の表示でも、コンソールのエラーなし', errs.length === 0, errs.slice(0, 3));
  await b.close(); console.log('FAILS', fail); process.exit(fail ? 1 : 0);
})();
