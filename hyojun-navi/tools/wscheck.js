/* ワークシート・演習プリントの検査（開発用）。ブラウザのコンソールで
     const s = document.createElement('script'); s.src = 'tools/wscheck.js'; document.head.appendChild(s);
   と読みこんでから  await wsChk(/^souji-/)  や  await wsChk(/./, { kind: 'dr' })  を実行する。
   rows＝行あふれ・解答例のはみ出し／txt＝空欄・表・問題文の横はみ出し／clip＝図の字がわくの外／lap＝図の字どうしの重なり
   tight＝自動の行配分なしだと解答例が入りきらない記入欄（2行以上足りないもの） */
window.wsChk = async (re, opt) => {
  opt = opt || {};
  const kind = opt.kind || 'ws', src = kind === 'dr' ? (LDB.drills || {}) : kind === 'qz' ? (LDB.quizzes || {}) : LDB.worksheets;
  const ids = Object.keys(src).filter(k => re.test(k));
  const all = WSX.checkAll(ids, kind);
  const rows = all.filter(x => x.over || x.ansOver).map(x => `${x.id} used=${JSON.stringify(x.used)}/${x.rows}${x.over ? ' OVER' : ''}${x.ansOver ? ' ANSOVER:' + x.ansWhere.join(' | ') : ''}`);
  const base = all.map(x => x.id.replace(/^.*-/, '') + ':' + x.base.join('+') + '→' + x.used.join('+')).join(' ');
  const box = document.createElement('div'); box.style.cssText = 'position:absolute;left:-20000px;top:0;visibility:hidden'; box.className = 'ans-on'; document.body.appendChild(box);
  const txt = [], clip = [], lap = [], tight = []; const mm = px => +(px / 3.7795).toFixed(1);
  for (const id of ids) {
    const ld = await WSX.load(id, kind); const l = LDB.lessons.find(x => x.id === id);
    if (opt.tight) {
      const raw = JSON.parse(JSON.stringify(ld.sheet)); raw.fill = false; box.innerHTML = WSX.pagesHTML(raw, l);
      box.querySelectorAll('.wb-w').forEach(w => { const r = +w.dataset.rows || 1, per = w.clientHeight / r; const need = Math.ceil((w.scrollHeight - 2) / per); if (need > r + 1) tight.push(`${id} W rows=${r} need=${need}: ${w.textContent.replace(/\s+/g, ' ').slice(0, 22)}`); });
    }
    box.innerHTML = WSX.pagesHTML(ld.sheet, l);
    box.querySelectorAll('.bl').forEach(b => { const p = b.closest('.tx') || b.parentElement; const rb = b.getBoundingClientRect(), rp = p.getBoundingClientRect(); if (rb.right > rp.right + 0.5 || rb.left < rp.left - 0.5) txt.push(id + ' BL: ' + b.textContent.slice(0, 24)); if (b.scrollWidth > b.clientWidth + 2) txt.push(id + ' BLANS +' + mm(b.scrollWidth - b.clientWidth) + 'mm: ' + b.textContent.slice(0, 24)); });
    box.querySelectorAll('.wb-t').forEach(t => { const tx = t.querySelector('.tx'); if (tx && tx.scrollWidth > tx.clientWidth + 1) txt.push(id + ' TXW +' + mm(tx.scrollWidth - tx.clientWidth) + 'mm: ' + tx.textContent.slice(0, 24)); });
    box.querySelectorAll('.wb-tab').forEach(t => { const tb = t.querySelector('table'); if (tb && tb.getBoundingClientRect().height > t.getBoundingClientRect().height + 1) txt.push(id + ' TABH'); t.querySelectorAll('td,th').forEach(c => { if (c.scrollWidth > c.clientWidth + 1) txt.push(id + ' CELL +' + mm(c.scrollWidth - c.clientWidth) + 'mm: ' + c.textContent.slice(0, 16)); }); });
    box.querySelectorAll('.wb-fig svg').forEach((svg, si) => {
      const vb = svg.viewBox.baseVal; if (!vb || !vb.width) return;
      const ts = [...svg.querySelectorAll('text')].filter(t => !t.classList.contains('noprint')).map(t => { let b; try { b = t.getBBox(); } catch (e) { return null; } return { t: t.textContent, b }; }).filter(Boolean);
      ts.forEach(o => { const b = o.b; const dx = Math.max(vb.x - b.x, b.x + b.width - (vb.x + vb.width)), dy = Math.max(vb.y - b.y, b.y + b.height - (vb.y + vb.height)); if (dx > 0.4 || dy > 0.4) clip.push(`${id}#${si} "${o.t}" dx=${dx.toFixed(1)} dy=${dy.toFixed(1)}`); });
      for (let i = 0; i < ts.length; i++) for (let j = i + 1; j < ts.length; j++) { const a = ts[i].b, b = ts[j].b; const ox = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x), oy = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y); if (ox > 0.5 && oy > 0.9) { const ar = ox * oy, mn = Math.min(a.width * a.height, b.width * b.height); if (ar > mn * 0.2) lap.push(`${id}#${si} "${ts[i].t}"×"${ts[j].t}"`); } }
    });
  }
  box.remove();
  return { n: ids.length, base: opt.base ? base : undefined, rows, txt, clip, lap, tight };
};
