import { pathToFileURL } from 'node:url';
import fs from 'node:fs';
const GP = process.argv[2];
const f = fs.readdirSync(GP + '/assets').find(x => /^hs\.data-/.test(x));
const { HS_LESSONS } = await import(pathToFileURL(GP + '/assets/' + f));
const units = JSON.parse(fs.readFileSync('units.json', 'utf8'));
const H1 = HS_LESSONS.filter(t => /^(m1[a-e]|ma[1-3])-/.test(t.id));
const groups = {};
for (const t of H1) (groups[t.id.replace(/-\d+$/, '')] ||= []).push(t);
const CODE = { m1a: 'A', m1b: 'B', m1c: 'C', m1d: 'D', m1e: 'E', ma1: 'F', ma2: 'G', ma3: 'H' };
fs.mkdirSync('in', { recursive: true });
for (const [p, arr] of Object.entries(groups)) {
  const order = arr.map(t => `${t.id}  ${t.t}（${t.n}）`);
  const out = arr.map(t => ({
    id: t.id, no: Number(t.id.slice(-2)), title: t.t, section: t.n, subject: t.g, units: (t.u || []).map(u => ({ id: u, ...units[u] })),
    groupCode: CODE[p], groupOrder: order,
  }));
  fs.writeFileSync(`in/${p}.json`, JSON.stringify(out, null, 1));
  console.log(p, arr.length, '本', [...new Set(arr.flatMap(t => t.u))].join(','));
}
fs.writeFileSync('in/index.json', JSON.stringify(H1.map(t => ({ id: t.id, t: t.t, n: t.n, g: t.g, u: t.u })), null, 1));
console.log('合計', H1.length);
