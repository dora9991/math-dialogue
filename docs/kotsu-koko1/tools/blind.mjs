// 使い方: node blind.mjs <担当名...>   例: node blind.mjs k3a k3b
// out/<担当名>.json から、答えを伏せた問題ファイル blind/<担当名>.txt と、答え合わせ用の blind/<担当名>.key.json を作る。
import fs from 'node:fs';
const L = 'ABCD';
for (const tag of process.argv.slice(2)) {
  const items = JSON.parse(fs.readFileSync(`out/${tag}.json`, 'utf8'));
  const key = {}; let txt = `# 問題 ${items.length} 問（4択）。各問題の「### id」の下に、問題文と選択肢 A〜D。\n\n`;
  for (const it of items) {
    key[it.id] = L[it.c.findIndex(x => x.k === 1)];
    txt += `### ${it.id}\n${it.q}\n` + it.c.map((x, i) => `${L[i]}. ${x.t}`).join('\n') + '\n\n';
  }
  fs.writeFileSync(`blind/${tag}.txt`, txt); fs.writeFileSync(`keys/${tag}.key.json`, JSON.stringify(key));
  console.log(tag, items.length, '問');
}
