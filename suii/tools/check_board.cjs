// 使い方: node suii/tools/check_board.cjs <ページの html（リポジトリの 中）...> [--shots <フォルダ>]
//  黒板の ページを ヘッドレスで 開き、最後の ステップまで「つぎへ」で 進める。
//  ・ページの エラー・コンソールの エラー（「答えがちがう：…」＝ CH.check の 不一致 を ふくむ）を 出す
//  ・--shots を つけると、ステップごとの 写真（1280×720）を とる（目で 確かめる 用）
const { chromium } = require('playwright');
const path = require('path'); const fs = require('fs'); const http = require('http');
const args = process.argv.slice(2); const si = args.indexOf('--shots'); const shots = si >= 0 ? args[si + 1] : null;
const pages = args.filter((a, i) => a.endsWith('.html') && (si < 0 || i !== si + 1));
const ROOT = path.resolve(__dirname, '../..');
const srv = http.createServer((q, r) => {
  const p = path.join(ROOT, decodeURIComponent(q.url.split('?')[0].split('#')[0]));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); }
  const ext = path.extname(p); r.writeHead(200, { 'Content-Type': { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml' }[ext] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(r);
});
(async () => {
  await new Promise((ok) => srv.listen(0, '127.0.0.1', ok)); const port = srv.address().port;
  const b = await chromium.launch(); let bad = 0;
  for (const pg of pages) {
    const rel = path.relative(ROOT, path.resolve(pg)).split(path.sep).join('/');
    const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); const errs = [];
    p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
    p.on('console', (m) => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
    await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
    await p.goto(`http://127.0.0.1:${port}/${rel}`); await p.waitForTimeout(800);
    const total = +(await p.textContent('#pt').catch(() => '0')); let n = 0, guard = 0;
    if (shots) fs.mkdirSync(shots, { recursive: true });
    const base = path.basename(rel, '.html');
    while (guard++ < total * 3 + 5) {
      await p.waitForTimeout(250);
      const cur = +(await p.textContent('#pn'));
      if (shots && cur !== n) { n = cur; await p.waitForTimeout(900); await p.screenshot({ path: path.join(shots, `${base}-${String(cur).padStart(2, '0')}.png`) }); }
      const dis = await p.$eval('#next', (e) => e.disabled).catch(() => true);
      if (dis) break;
      await p.keyboard.press('ArrowRight');
    }
    const last = +(await p.textContent('#pn'));
    const ok = errs.length === 0 && total > 0 && last === total;
    if (!ok) bad++;
    console.log(`${ok ? 'OK ' : 'NG '} ${rel}  ステップ ${last}/${total}  エラー ${errs.length}`);
    errs.slice(0, 10).forEach((e) => console.log('   ' + e));
    await p.close();
  }
  await b.close(); srv.close(); console.log(bad ? `NG ${bad} ページ` : 'すべて OK'); process.exit(bad ? 1 : 0);
})();
