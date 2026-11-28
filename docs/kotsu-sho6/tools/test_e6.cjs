process.env.PORT = process.env.PORT || '8867';
const L = require('../time/t_lib.cjs'); const fs = require('fs');
const lessons = JSON.parse(fs.readFileSync('dist/lessons.json', 'utf8')).lessons;
const idx = Object.fromEntries(JSON.parse(fs.readFileSync('in/index.json', 'utf8')).map(t => [t.id, t]));
const items = {}; for (const f of fs.readdirSync('out').filter(f => /^e6[a-f]\.json$/.test(f))) for (const it of JSON.parse(fs.readFileSync('out/' + f, 'utf8'))) items[it.id] = it;
let fail = 0; const ok = (n, c, i) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + n + (i !== undefined ? '  ' + JSON.stringify(i) : '')); if (!c) fail++; };
const openHub = (b, unitId) => L.open(b, { state: { profile: { name: 'テスト', grade: 'E6', goal: { tier: 'std', track: '', uni: '' } } }, routeState: { name: 'hub', unitId } });
(async () => {
  const b = await L.launch();
  const units = [...new Set(Object.values(lessons).flatMap(v => v.u))].sort();
  const seen = new Set(); const perUnit = {}; const errs = [];
  for (const u of units) {
    const p = await openHub(b, u); p.on('pageerror', e => errs.push(String(e))); await p.waitForTimeout(500);
    const rows = await p.evaluate(() => [...document.querySelectorAll('.tp-row .tp-name')].map(e => (e=>{const c=e.cloneNode(true);c.querySelectorAll('rt,rp').forEach(x=>x.remove());return c.textContent.trim()})(e)));
    perUnit[u] = rows; rows.forEach(r => seen.add(r)); await p.context().close();
  }
  const want = new Set(Object.keys(lessons).map(id => idx[id].t));
  const missing = [...want].filter(t => !seen.has(t));
  ok(`小6 の ${units.length} 単元を開いて、一覧が出る`, units.every(u => (perUnit[u] || []).length > 0), units.filter(u => !(perUnit[u] || []).length));
  ok(`56本の授業の演習が、どれかの単元に出る（出ない授業 ${missing.length}）`, missing.length === 0, missing.slice(0, 5));
  // 章（科目）ごとに 1本ずつ、実際に解く
  for (const [id, lv] of [['taisho-02', 1], ['moji-03', 2], ['bkake-02', 3], ['bwari-03', 4], ['hi-02', 2], ['shuku-03', 1], ['en-02', 3], ['kakuchu-02', 2], ['hirei-03', 4], ['baai-02', 1], ['data-02', 3], ['data-04', 2]]) {
    const v = lessons[id], title = idx[id].t;
    const p = await openHub(b, v.u[0]); const pe = []; p.on('pageerror', e => pe.push(String(e))); await p.waitForTimeout(500);
    const clicked = await p.evaluate(([title, lv]) => { const row = [...document.querySelectorAll('.tp-row')].find(r => (e=>{const c=e.cloneNode(true);c.querySelectorAll('rt,rp').forEach(x=>x.remove());return c.textContent.trim()})(r.querySelector('.tp-name')) === title); const bt = row && row.querySelector('.tp-b.L' + lv); if (bt) { bt.click(); return true; } return false; }, [title, lv]);
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
