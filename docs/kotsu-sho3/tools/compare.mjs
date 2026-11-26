// 使い方: node compare.mjs <担当名...>   blind/<担当名>.answers.json（{答え:{id:"A"}, 問題あり:[{id,理由}]}）と、blind/<担当名>.key.json を比べる
import fs from 'node:fs';
let bad = 0;
for (const tag of process.argv.slice(2)) {
  const key = JSON.parse(fs.readFileSync(`keys/${tag}.key.json`, 'utf8'));
  const ans = JSON.parse(fs.readFileSync(`blind/${tag}.answers.json`, 'utf8'));
  const a = ans['答え'] || {}; const diff = [], missing = [];
  for (const id of Object.keys(key)) { if (!a[id]) missing.push(id); else if (a[id] !== key[id]) diff.push({ id, 作者: key[id], 解き手: a[id] }); }
  const flagged = ans['問題あり'] || [];
  console.log(`${tag}: ${Object.keys(key).length} 問 / 一致 ${Object.keys(key).length - diff.length - missing.length} / 不一致 ${diff.length} / 未回答 ${missing.length} / 問題あり ${flagged.length}`);
  diff.forEach(d => console.log(`  ✗ ${d.id} 作者=${d.作者} 解き手=${d.解き手}`)); missing.forEach(m => console.log(`  ? ${m} 未回答`)); flagged.forEach(f => console.log(`  ! ${f.id}: ${f.理由}`));
  bad += diff.length + missing.length;
}
process.exit(bad ? 1 : 0);
