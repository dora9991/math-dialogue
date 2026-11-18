import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
const GP = process.argv[2];
const td = await import(pathToFileURL(GP + '/assets/talks.data-BA_oYR5S.js'));
const idx = td.TALKS.filter(t => /^g3u\d+-\d+$/.test(t.id));
console.log('J3 lessons in index:', idx.length);
const files = fs.readdirSync(GP + '/assets').filter(f => /^g3u\d-/.test(f));
const kinds = new Map();
const txt = (v) => Array.isArray(v) ? v.map(txt).join('') : (v && typeof v === 'object') ? (v.b != null ? txt(v.b) : (v.t != null ? txt(v.t) : JSON.stringify(v))) : String(v ?? '');
const render = (it, qs) => {
  kinds.set(it.k, (kinds.get(it.k) || 0) + 1);
  if (it.k === 'q') { const q = qs.find(x => x.id === it.id); return q ? `【授業中の問】${q.q} 選択肢:${q.opts.join(' / ')} 正解:${q.opts[q.ans]}` : ''; }
  if (it.k === 'box') return `[${it.label}] ` + (it.lines || []).map(l => txt(l)).join(' ／ ');
  if (it.k === 'fig') return '(図あり)';
  return `(${it.k}) ` + JSON.stringify(it).slice(0, 200);
};
const byCh = {};
for (const f of files) {
  const m = await import(pathToFileURL(GP + '/assets/' + f));
  const ch = f.match(/^g3u(\d)/)[1];
  const out = [];
  for (const [id, sh] of Object.entries(m.SHEETS)) {
    const meta = idx.find(t => t.id === id) || {};
    const body = (sh.secs || []).map(s => `■${s.h}\n` + (s.items || []).map(it => render(it, sh.qs || [])).filter(Boolean).join('\n')).join('\n');
    out.push({ id, kick: sh.kick, title: sh.title, meate: sh.meate, group: meta.g, units: meta.u, talkTitle: meta.t, talkFocus: meta.n, body, ownQuestions: (sh.qs || []).map(q => ({ q: q.q, opts: q.opts, ans: q.opts[q.ans] })) });
  }
  out.sort((a, b) => a.id.localeCompare(b.id));
  byCh[ch] = out;
  fs.writeFileSync(`in/g3u${ch}.json`, JSON.stringify(out, null, 1));
}
console.log('kinds', [...kinds]);
for (const ch of Object.keys(byCh).sort()) console.log('chapter', ch, byCh[ch].length, '本', 'units:', [...new Set(byCh[ch].flatMap(l => l.units || []))].join(','), '|', byCh[ch][0].group);
fs.writeFileSync('in/index.json', JSON.stringify(idx, null, 1));
