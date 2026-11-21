// 使い方: node build-chunks.mjs <出力フォルダ>   out/k3?.json（全部）から、章ごとの公開用ファイル（g3tenkai.js など8つ）と index 用の情報（lessons.json）を作る
import fs from 'node:fs'; import crypto from 'node:crypto';
const OUT = process.argv[2]; fs.mkdirSync(OUT, { recursive: true });
const KEY = { 1: 'g3tenkai', 2: 'g3heihou', 3: 'g3niji', 4: 'g3kansu', 5: 'g3soji', 6: 'g3en', 7: 'g3sanpei', 8: 'g3hyohon' };
const idx = JSON.parse(fs.readFileSync('in/index.json', 'utf8'));
const items = []; for (const f of fs.readdirSync('out').filter(f => /^k3[a-z]\.json$/.test(f))) items.push(...JSON.parse(fs.readFileSync('out/' + f, 'utf8')));
const byCh = {}; for (const it of items) (byCh[it.l.match(/^g3u(\d)/)[1]] ||= []).push(it);
const lessons = {}, files = {};
for (const ch of Object.keys(byCh).sort()) {
  const arr = byCh[ch], talks = {}, map = {};
  const ids = [...new Set(arr.map(x => x.l))].sort();
  for (const l of ids) {
    const m = idx.find(t => t.id === l); if (!m) throw new Error('index に無い授業: ' + l);
    const pool = { 1: [], 2: [], 3: [], 4: [] };
    for (const it of arr.filter(x => x.l === l).sort((a, b) => a.id.localeCompare(b.id))) { pool[it.d].push(it.id); map[it.id] = it; }
    talks[l] = { u: m.u, pool, review: [] }; lessons[l] = { f: KEY[ch], u: m.u, n: [1, 2, 3, 4].map(d => pool[d].length) };
  }
  const src = `const n=1,$=${JSON.stringify(KEY[ch])},t=${JSON.stringify(talks)},u=${JSON.stringify(map)},a={v:1,key:$,talks:t,items:u};export{a as default,u as items,$ as key,t as talks,n as v};\n`;
  const h = crypto.createHash('sha256').update(src).digest('base64url').slice(0, 8);
  const name = `${KEY[ch]}-${h}.js`; fs.writeFileSync(`${OUT}/${name}`, src); files[KEY[ch]] = name;
  console.log(`第${ch}章 ${ids.length} 本・${arr.length} 問 → ${name} (${(src.length / 1024).toFixed(0)}KB)`);
}
fs.writeFileSync(`${OUT}/lessons.json`, JSON.stringify({ lessons, files }, null, 1));
console.log('授業', Object.keys(lessons).length, '本・問題', items.length);
