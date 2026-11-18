// 使い方: node merge.mjs <担当名>   → out/<担当名>/*.json（授業ごとの配列）を、授業の順に並べて out/<担当名>.json にする
import fs from 'node:fs';
const tag = process.argv[2]; if (!tag) { console.error('使い方: node merge.mjs <担当名>'); process.exit(2); }
const dir = `out/${tag}`;
const files = fs.readdirSync(dir).filter(f => /^g3u\d-\d\d\.json$/.test(f)).sort();
const all = [];
for (const f of files) { const a = JSON.parse(fs.readFileSync(`${dir}/${f}`, 'utf8')); if (!Array.isArray(a)) throw new Error(f + ' は配列ではありません'); all.push(...a); }
fs.writeFileSync(`out/${tag}.json`, JSON.stringify(all, null, 1));
console.log(`${files.length} 本・${all.length} 問 → out/${tag}.json`);
console.log('授業：' + files.map(f => f.replace('.json', '')).join(' '));
