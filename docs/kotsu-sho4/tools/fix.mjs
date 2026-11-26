// 使い方: node fix.mjs <担当名> <問題id> <新しい問題文>   out/<担当名>.json と out/<担当名>/<授業>.json の問題文を直す
import fs from 'node:fs';
const [tag, id, q] = process.argv.slice(2);
const f = `out/${tag}.json`; const a = JSON.parse(fs.readFileSync(f, 'utf8')); const it = a.find(x => x.id === id); if (!it) throw new Error('id なし ' + id);
it.q = q; fs.writeFileSync(f, JSON.stringify(a, null, 1));
const lesson = id.replace(/-L\d-\d\d$/, ''); const g = `out/${tag}/${lesson}.json`;
if (fs.existsSync(g)) { const b = JSON.parse(fs.readFileSync(g, 'utf8')); const j = b.find(x => x.id === id); if (j) { j.q = q; fs.writeFileSync(g, JSON.stringify(b, null, 1)); } }
console.log('直した:', id, '→', q);
