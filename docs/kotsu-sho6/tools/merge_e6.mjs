// 使い方: node merge_e1.mjs <担当名>   out/<担当名>/*.json（授業ごと）を、out/<担当名>.json にまとめる
import fs from 'node:fs';
const tag = process.argv[2]; const dir = `out/${tag}`; const all = [];
for (const f of fs.readdirSync(dir).filter(f => /^[a-z0-9]+-\d\d\.json$/.test(f)).sort()) all.push(...JSON.parse(fs.readFileSync(`${dir}/${f}`, 'utf8')));
fs.writeFileSync(`out/${tag}.json`, JSON.stringify(all, null, 1)); console.log(tag, all.length, '問');
