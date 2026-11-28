// 使い方: node build-chunks_h1.mjs <出力フォルダ>   out/h1?.json（全部）から、科目ごとの公開用ファイル（h1suushiki.js など8つ）と lessons.json を作る
import fs from 'node:fs'; import crypto from 'node:crypto';
const OUT = process.argv[2]; fs.mkdirSync(OUT, { recursive: true });
const KEY = { m1a: 'h1suushiki', m1b: 'h1shugo', m1c: 'h1niji', m1d: 'h1zukei', m1e: 'h1data', ma1: 'h1baai', ma2: 'h1seishitsu', ma3: 'h1seisu' };
const idx = JSON.parse(fs.readFileSync('in/index.json', 'utf8'));
const items = []; for (const f of fs.readdirSync('out').filter(f => /^h1[a-z]\.json$/.test(f))) items.push(...JSON.parse(fs.readFileSync('out/' + f, 'utf8')));
const by = {}; for (const it of items) (by[it.l.replace(/-\d+$/, '')] ||= []).push(it);
const lessons = {}, files = {};
for (const p of Object.keys(by).sort()) {
  const arr = by[p], talks = {}, map = {};
  for (const l of [...new Set(arr.map(x => x.l))].sort()) {
    const m = idx.find(t => t.id === l); if (!m) throw new Error('index に無い授業: ' + l);
    const pool = { 1: [], 2: [], 3: [], 4: [] };
    for (const it of arr.filter(x => x.l === l).sort((a, b) => a.id.localeCompare(b.id))) { pool[it.d].push(it.id); map[it.id] = it; }
    talks[l] = { u: m.u, pool, review: [] }; lessons[l] = { f: KEY[p], u: m.u, n: [1, 2, 3, 4].map(d => pool[d].length) };
  }
  const src = `const n=1,$=${JSON.stringify(KEY[p])},t=${JSON.stringify(talks)},u=${JSON.stringify(map)},a={v:1,key:$,talks:t,items:u};export{a as default,u as items,$ as key,t as talks,n as v};\n`;
  const h = crypto.createHash('sha256').update(src).digest('base64url').slice(0, 8);
  const name = `${KEY[p]}-${h}.js`; fs.writeFileSync(`${OUT}/${name}`, src); files[KEY[p]] = name;
  console.log(`${p} ${Object.keys(talks).length} 本・${arr.length} 問 → ${name} (${(src.length / 1024).toFixed(0)}KB)`);
}
fs.writeFileSync(`${OUT}/lessons.json`, JSON.stringify({ lessons, files }, null, 1));
console.log('授業', Object.keys(lessons).length, '本・問題', items.length);
