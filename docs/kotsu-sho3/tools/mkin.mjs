// 小3の授業の台本（ho-sansu の lessons/<id>.js）から、問題づくり用の入力 in/<担当>.json を作る
import fs from 'node:fs';
const ORDER = ["kimari3", "jikoku3", "hissan3", "wari", "amari3", "ookii3", "kakeh1", "nagasa3", "en3", "shosu3", "bunsu3", "omosa3", "kakeh2", "shiki3", "nito3", "bai3", "bou3"];
const CODE = Object.fromEntries(ORDER.map((u, i) => [u, 'ABCDEFGHIJKLMNOPQ'[i]]));
const TEAM = {"e3a": ["kimari3", "jikoku3", "hissan3"], "e3b": ["wari", "amari3"], "e3c": ["ookii3", "kakeh1"], "e3d": ["nagasa3", "en3"], "e3e": ["shosu3", "bunsu3"], "e3f": ["omosa3", "kakeh2"], "e3g": ["shiki3", "bai3"], "e3h": ["nito3", "bou3"]};
const meta = JSON.parse(fs.readFileSync('lessons_e3.json', 'utf8'));
const byUnit = u => meta.filter(x => x.id.startsWith(u + '-')).sort((a, b) => a.no - b.no);
const all = ORDER.flatMap(byUnit);
const jp = /[ぁ-んァ-ヶ一-龯ー々]/;
const index = [];
for (const [team, units] of Object.entries(TEAM)) {
  const out = [];
  for (const u of units) for (const m of byUnit(u)) {
    const src = fs.readFileSync(`web/lessons/${m.id}.js`, 'utf8');
    const head = (src.match(/^\/\*([\s\S]*?)\*\//) || [, ''])[1].trim();
    const strs = []; const re = /'((?:[^'\\\n]|\\.)*)'|`((?:[^`\\]|\\.)*)`|"((?:[^"\\\n]|\\.)*)"/g; let r;
    while ((r = re.exec(src))) { const t = (r[1] ?? r[2] ?? r[3] ?? '').replace(/\\n/g, ' ').trim(); if (t && jp.test(t) && !/^(fill|stroke|#)/.test(t) && !strs.includes(t)) strs.push(t); }
    const pos = all.findIndex(x => x.id === m.id);
    const rec = { id: m.id, title: m.t, unitName: m.un, unitKey: u, code: CODE[u], no: m.no, min: m.min, appUnits: m.u, summary: head, script: strs, before: all.slice(0, pos).map(x => `${x.id} ${x.t}`), after: all.slice(pos + 1).map(x => `${x.id} ${x.t}`) };
    out.push(rec); index.push({ id: m.id, t: m.t, un: m.un, code: CODE[u], no: m.no, u: m.u, team });
  }
  fs.writeFileSync(`in/${team}.json`, JSON.stringify(out, null, 1));
  console.log(team, out.length, '本', (JSON.stringify(out).length / 1024).toFixed(0) + 'KB');
}
fs.writeFileSync('in/index.json', JSON.stringify(index, null, 1));
console.log('合計', index.length);
