/* 電子黒板用スライドの検査（開発用）。ブラウザのコンソールで
     const s = document.createElement('script'); s.src = 'tools/slcheck.js'; document.head.appendChild(s);
   と読みこんでから  await slChk(/^souji-/)  や  await slChk(/./, { mode: 'core' })  を実行する。
   over＝文字をいちばん小さくしても入りきらない／small＝字が小さい（×0.7 より小さい）／wide＝横にはみ出す部品／
   clip＝図の字がわくの外／lap＝図の字どうしの重なり／empty＝スライドが1枚もない／n＝枚数の分布 */
window.slChk = async (re, opt) => {
  opt = opt || {};
  const mode = opt.mode === 'core' ? 'core' : 'full';
  const ids = LDB.lessons.map(l => l.id).filter(id => re.test(id));
  const box = document.createElement('div'); box.style.cssText = 'position:absolute;left:-40000px;top:0;visibility:hidden'; box.className = 'sl-all'; document.body.appendChild(box);
  const over = [], small = [], wide = [], clip = [], lap = [], empty = [], counts = {}, fsAll = [];
  let total = 0;
  for (const id of ids) {
    const d = await SLX.deck(id, mode);
    if (!d || !d.slides.length) { empty.push(id); continue; }
    counts[d.slides.length] = (counts[d.slides.length] || 0) + 1; total += d.slides.length;
    d.slides.forEach((s, i) => {
      const tag = `${id}#${i + 1}`;
      if (s.kind === 'body') fsAll.push(s.fs);
      if (s.over) over.push(tag); else if (s.fs < 0.7) small.push(`${tag} ×${s.fs}`);
      box.innerHTML = s.html;
      const body = box.querySelector('.sl-body'), br = body.getBoundingClientRect();
      if (body.scrollHeight > body.clientHeight + 1 && !s.over) over.push(tag + ' (再測定)');
      box.querySelectorAll('.su, .st, .bl').forEach(e => { const r = e.getBoundingClientRect(); if (r.right > br.right + 2) wide.push(`${tag} ${e.className.split(' ').slice(0, 2).join('.')} +${Math.round(r.right - br.right)}px: ${e.textContent.replace(/\s+/g, ' ').slice(0, 18)}`); });
      box.querySelectorAll('.st td, .st th').forEach(c => { if (c.scrollWidth > c.clientWidth + 1) wide.push(`${tag} cell: ${c.textContent.slice(0, 14)}`); });
      box.querySelectorAll('.fsvg').forEach((svg, si) => {
        const vb = svg.viewBox.baseVal; if (!vb || !vb.width) return;
        const ts = [...svg.querySelectorAll('text')].filter(t => !t.classList.contains('noprint')).map(t => { let b; try { b = t.getBBox(); } catch (e) { return null; } return { t: t.textContent, b }; }).filter(Boolean);
        ts.forEach(o => { const b = o.b, dx = Math.max(vb.x - b.x, b.x + b.width - (vb.x + vb.width)), dy = Math.max(vb.y - b.y, b.y + b.height - (vb.y + vb.height)); if (dx > 0.4 || dy > 0.4) clip.push(`${tag} 図${si + 1} "${o.t}" dx=${dx.toFixed(1)} dy=${dy.toFixed(1)}`); });
        for (let a = 0; a < ts.length; a++) for (let c = a + 1; c < ts.length; c++) {
          const p = ts[a].b, r = ts[c].b, ox = Math.min(p.x + p.width, r.x + r.width) - Math.max(p.x, r.x), oy = Math.min(p.y + p.height, r.y + r.height) - Math.max(p.y, r.y);
          if (ox > 0.5 && oy > 0.9 && ox * oy > Math.min(p.width * p.height, r.width * r.height) * 0.2) lap.push(`${tag} 図${si + 1} "${ts[a].t}"×"${ts[c].t}"`);
        }
      });
    });
  }
  box.remove();
  fsAll.sort((a, b) => a - b);
  return { mode, lessons: ids.length, slides: total, avg: +(total / Math.max(1, ids.length)).toFixed(1), n: counts,
    fs: { min: fsAll[0], p10: fsAll[Math.floor(fsAll.length * 0.1)], median: fsAll[Math.floor(fsAll.length / 2)] }, empty, over, small, wide, clip, lap };
};
