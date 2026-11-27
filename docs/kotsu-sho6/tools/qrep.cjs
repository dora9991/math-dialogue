// 使い方: node qrep.cjs <tag> <json: {id: [old, new], ...}>  問題文の 一部を 置きかえる（old が ちょうど 1回 ある ことを 確かめる）
const fs = require('fs'); const [tag, js] = process.argv.slice(2); const rep = JSON.parse(js);
const byLes = {}; for (const id of Object.keys(rep)) (byLes[id.replace(/-L\d-\d\d$/, '')] ||= []).push(id);
for (const [les, ids] of Object.entries(byLes)) {
  const f = `out/${tag}/${les}.json`; const a = JSON.parse(fs.readFileSync(f, 'utf8'));
  for (const id of ids) { const it = a.find(x => x.id === id); const [o, n] = rep[id]; if (it.q.split(o).length !== 2) throw new Error(id + ' に 「' + o + '」が 1回 ない: ' + it.q); it.q = it.q.replace(o, n); console.log('ok', id, it.q); }
  fs.writeFileSync(f, JSON.stringify(a, null, 1));
}
