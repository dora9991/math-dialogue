// sample.mjs — テンプレートから、問題を何問かつくって表示する（目で確かめる用）
//   node ikkan/kotsu/sample.mjs ikkan/kotsu/content/kukan-03.js [何問ずつか=2] [テンプレートid（省略可。例 03d04）]
import path from "node:path";
import { pathToFileURL } from "node:url";
const [file, n = "2", only] = process.argv.slice(2);
const mod = await import(pathToFileURL(path.resolve(file)).href);
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
for (const u of mod.UNITS) {
  console.log(`# ${u.id} ${u.name}`);
  for (const L of Object.keys(u.levels)) {
    for (const tpl of u.levels[L]) {
      if (only && tpl.id !== only) continue;
      for (let i = 0; i < +n; i++) {
        let p; do { p = tpl.build(rnd); } while (p && p.skip);
        console.log(`[L${L} ${tpl.id}] ${p.q}`);
        if (p.choices) console.log(`   選択肢: ${p.choices.join(" / ")}`);
        console.log(`   答え: ${p.ans}${p.unit ? " " + p.unit : ""}   ヒント: ${p.hint}`);
        console.log(`   解説: ${p.steps.join(" ／ ")}`);
      }
    }
  }
}
