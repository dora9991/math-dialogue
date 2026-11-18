#!/usr/bin/env node
/* スライドを手元で 1920×1080 に描いて、はみ出しを調べ、PNG にする（公開はしない）。
   使い方：NODE_PATH=$(npm root -g) node tools/slide-preview.cjs <スライドのフォルダ（slides-src/<単元>）> <出力フォルダ> [id …]
   調べること：下に近い／右にはみ出し／横にあふれ／小さい字（24px 未満）。画像は img/<名前>.png（slides/img/）を読む。 */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..');
const [dir, out, ...only] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const imgBase = 'file://' + path.join(root, 'slides') + '/';
(async () => {
  const b = await chromium.launch(); const page = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.html') && (!only.length || only.includes(f.replace('.html', '')))).sort();
  const warns = [], tmp = path.join(out, '_tmp.html');
  for (const f of files) {
    let html = fs.readFileSync(path.join(dir, f), 'utf8');
    html = html.replace(/src="img\//g, `src="${imgBase}img/`);
    fs.writeFileSync(tmp, `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:#888}section{width:1920px;height:1080px;box-sizing:border-box;position:relative;overflow:hidden}aside{display:none}p,h1,h2,h3,ul,ol{margin:0}table{border-collapse:collapse}th,td{border:2px solid #b9c1cc;padding:6px 14px}</style></head><body>${html}</body></html>`);
    await page.goto('file://' + tmp);
    await page.waitForTimeout(150);
    const r = await page.evaluate(() => {
      const s = document.querySelector('section'), res = [], sr = s.getBoundingClientRect();
      for (const e of s.querySelectorAll('*')) {
        if (e.tagName === 'ASIDE') continue;
        const cs = getComputedStyle(e), q = e.getBoundingClientRect();
        if (!q.width) continue;
        const pinned = cs.position === 'absolute';
        if (!pinned && q.bottom > sr.top + 925) res.push('下に近い/はみ出し ' + e.tagName + ' bottom=' + Math.round(q.bottom - sr.top) + ' ' + (e.textContent || '').slice(0, 24));
        if (q.right > sr.left + 1795) res.push('右にはみ出し ' + e.tagName + ' right=' + Math.round(q.right - sr.left) + ' ' + (e.textContent || '').slice(0, 24));
        if (e.scrollWidth > e.clientWidth + 2 && cs.overflow !== 'visible') res.push('横にあふれ ' + e.tagName);
        const fs = parseFloat(cs.fontSize); if (e.children.length === 0 && e.textContent.trim() && fs < 24) res.push('小さい字 ' + fs + ' ' + e.textContent.slice(0, 12));
        if (e.tagName === 'IMG' && !(e.complete && e.naturalWidth)) res.push('画像が読めない ' + e.getAttribute('src'));
      }
      return res;
    });
    await page.screenshot({ path: path.join(out, f.replace('.html', '.png')) });
    if (r.length) warns.push(f + '\n   ' + r.slice(0, 6).join('\n   '));
  }
  try { fs.unlinkSync(tmp); } catch (e) { /* なし */ }
  console.log(warns.length ? warns.join('\n') : '指摘なし（' + files.length + '枚）');
  await b.close();
})();
