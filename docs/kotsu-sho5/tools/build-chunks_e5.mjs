// 使い方: node build-chunks_e1.mjs <出力フォルダ> [out の担当ファイルの正規表現]
// out/e5?.json から、担当ごとの公開用ファイル（e5 の 公開用ファイル）と lessons.json を作る
import fs from 'node:fs'; import crypto from 'node:crypto';
const OUT = process.argv[2]; fs.mkdirSync(OUT, { recursive: true });
const pat = new RegExp(process.argv[3] || '^e5[a-h]\\.json$');
const KEY = {"e5a": "e5tai", "e5b": "e5heikin", "e5c": "e5shosu", "e5d": "e5bunsu", "e5e": "e5tani", "e5f": "e5wariai", "e5g": "e5zukei", "e5h": "e5enshu"};
const idx = JSON.parse(fs.readFileSync('in/index.json', 'utf8'));
const lessons = {}, files = {}; let total = 0;
for (const f of fs.readdirSync('out').filter(f => pat.test(f)).sort()) {
  const team = f.replace(/\.json$/, '').replace(/^dummy-/, ''); const key = KEY[team]; if (!key) throw new Error('キーが無い: ' + f);
  const arr = JSON.parse(fs.readFileSync('out/' + f, 'utf8')); total += arr.length;
  const talks = {}, map = {};
  for (const l of [...new Set(arr.map(x => x.l))].sort()) {
    const m = idx.find(t => t.id === l); if (!m) throw new Error('index に無い授業: ' + l);
    const pool = { 1: [], 2: [], 3: [], 4: [] };
    for (const it of arr.filter(x => x.l === l).sort((a, b) => a.id.localeCompare(b.id))) { pool[it.d].push(it.id); map[it.id] = it; }
    talks[l] = { u: m.u, pool, review: [] }; lessons[l] = { f: key, u: m.u, n: [1, 2, 3, 4].map(d => pool[d].length) };
  }
  const src = `const n=1,$=${JSON.stringify(key)},t=${JSON.stringify(talks)},u=${JSON.stringify(map)},a={v:1,key:$,talks:t,items:u};export{a as default,u as items,$ as key,t as talks,n as v};\n`;
  const h = crypto.createHash('sha256').update(src).digest('base64url').slice(0, 8);
  const name = `${key}-${h}.js`; fs.writeFileSync(`${OUT}/${name}`, src); files[key] = name;
  console.log(`${team} ${Object.keys(talks).length} 本・${arr.length} 問 → ${name} (${(src.length / 1024).toFixed(0)}KB)`);
}
fs.writeFileSync(`${OUT}/lessons.json`, JSON.stringify({ lessons, files }, null, 1));
console.log('授業', Object.keys(lessons).length, '本・問題', total);
