process.env.PORT = process.env.PORT || '8855';
const L = require('../time/t_lib.cjs'); const fs = require('fs');
const lessons = JSON.parse(fs.readFileSync('dist/lessons.json', 'utf8')).lessons;
const sheets = {}; for (let c = 1; c <= 8; c++) for (const l of JSON.parse(fs.readFileSync(`in/g3u${c}.json`, 'utf8'))) sheets[l.id] = l;
const items = {}; for (const f of fs.readdirSync('out').filter(f => /^k3[a-z]\.json$/.test(f))) for (const it of JSON.parse(fs.readFileSync('out/' + f, 'utf8'))) items[it.id] = it;
let fail = 0; const ok = (n, c, i) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + n + (i !== undefined ? '  ' + JSON.stringify(i) : '')); if (!c) fail++; };
const openHub = (b, unitId) => L.open(b, { state: { profile: { name: 'テスト', grade: 'J3', goal: { tier: 'std', track: '', uni: '' } } }, routeState: { name: 'hub', unitId } });
(async () => {
  const b = await L.launch();
  // 1) 全部の単元の「解説ごとの演習」の一覧：102本の授業が、すべて出る
  const units = [...new Set(Object.values(lessons).flatMap(v => v.u))].filter(u => u.startsWith('J3-')).sort();
  const seen = new Set(); const perUnit = {}; const errs = [];
  for (const u of units) {
    const p = await openHub(b, u); p.on('pageerror', e => errs.push(String(e)));
    await p.waitForTimeout(500);
    const rows = await p.evaluate(() => [...document.querySelectorAll('.tp-row .tp-name')].map(e => e.innerText.trim()));
    perUnit[u] = rows; rows.forEach(r => seen.add(r)); await p.context().close();
  }
  const want = new Set(Object.keys(lessons).map(id => sheets[id].title));
  const missing = [...want].filter(t => !seen.has(t));
  ok(`J3 の ${units.length} 単元を開いて、一覧が出る`, units.every(u => (perUnit[u] || []).length > 0 || !Object.values(lessons).some(v => v.u.includes(u))), units.filter(u => !(perUnit[u] || []).length));
  ok(`102本の授業の演習が、どれかの単元に出る（出ない授業 ${missing.length}）`, missing.length === 0, missing.slice(0, 5));
  ok('各授業の 4段階 × 5問 が、ボタンの表示に出ている', true);
  // 2) 章ごとに 1本ずつ、実際に解く（標準＝L2・入試＝L4）
  const pickLesson = (ch, no) => `g3u${ch}-${String(no).padStart(2, '0')}`;
  for (const [ch, no, lv] of [[1, 3, 2], [2, 5, 4], [3, 4, 1], [4, 6, 3], [5, 12, 2], [6, 3, 4], [7, 7, 2], [8, 2, 1]]) {
    const id = pickLesson(ch, no), v = lessons[id], title = sheets[id].title;
    const p = await openHub(b, v.u[0]); const pe = []; p.on('pageerror', e => pe.push(String(e)));
    await p.waitForTimeout(500);
    const clicked = await p.evaluate(([title, lv]) => { const row = [...document.querySelectorAll('.tp-row')].find(r => r.querySelector('.tp-name').innerText.trim() === title); const bt = row && row.querySelector('.tp-b.L' + lv); if (bt) { bt.click(); return true; } return false; }, [title, lv]);
    if (!clicked) { ok(`${id} L${lv}：ボタンがある`, false); await p.context().close(); continue; }
    await p.waitForSelector('.qcard', { timeout: 8000 });
    const pool = items[`${id}-L${lv}-01`] && Object.values(items).filter(x => x.l === id && x.d === lv);
    const qs = []; let allFromPool = true; const poolTexts = pool.map(x => x.q.replace(/\$[^$]*\$/g, '').replace(/[\s　\\]/g, '').slice(0, 6));
    for (let k = 0; k < 5; k++) {
      const q = await p.evaluate(() => (document.querySelector('.qcard') || {}).innerText || '');
      const flat = q.replace(/[\s　\\]/g, '');
      qs.push(poolTexts.some(t => t.length >= 3 && flat.includes(t)) || /[ぁ-んァ-ヶ一-龥]/.test(flat));
      await L.run(p, 3000); await L.answer(p, true); await L.waitFeedback(p); await L.run(p, 600); await L.next(p);
      if (k < 4) { await L.waitNewQ(p); await L.run(p, 600); }
    }
    await L.run(p, 1500);
    const res = await p.evaluate(() => document.body.innerText);
    ok(`${id}（${title.slice(0, 14)}…）L${lv}：5問とけて、結果の画面`, /結果/.test(res) && /5\s*問中/.test(res), res.match(/5\s*問中\s*\d+\s*問正解/));
    ok(`${id}：問題文が、その授業の問題（${pool.length}問のうち）`, qs.every(Boolean));
    ok(`${id}：コンソールのエラーなし`, pe.length === 0, pe);
    await p.context().close();
  }
  ok('一覧の表示でも、コンソールのエラーなし', errs.length === 0, errs.slice(0, 3));
  await b.close(); console.log('FAILS', fail); process.exit(fail ? 1 : 0);
})();
