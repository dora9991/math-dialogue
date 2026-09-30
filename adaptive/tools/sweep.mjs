// ============================================================
// tools/sweep.mjs — 乱数の種をたくさん試して、生成が例外で落ちるものを探す
//   node tools/sweep.mjs [--seeds 2000] [--skill id]
//  verify.mjs は「中身の正しさ」を細かく見る代わりに種の数が少ない。
//  こちらは中身は見ず、生成できるかどうかだけを大量に確かめる。
// ============================================================
import { SKILLS, ALL_IDS } from "../js/data/graph.js";
import { makeItem } from "../js/core/items.js";

const args = process.argv.slice(2);
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const N = Number(opt("--seeds", 2000));
const only = opt("--skill", "");
const fails = new Map();
let total = 0;
for (const id of ALL_IDS) {
  if (only && id !== only) continue;
  const sk = SKILLS[id];
  for (const tpl of sk.tpl) {
    for (const level of [1, 2, 3]) {
      for (let seed = 1; seed <= N; seed++) {
        total++;
        try {
          makeItem(sk, level, seed, tpl.id);
        } catch (e) {
          const key = `${id}/${tpl.id}/L${level}: ${String(e.message).replace(/^\[[^\]]*\]\s*/, "")}`;
          const rec = fails.get(key) || { n: 0, seeds: [] };
          rec.n++;
          if (rec.seeds.length < 3) rec.seeds.push(seed);
          fails.set(key, rec);
        }
      }
    }
  }
}
console.log(`試行 ${total} 回、失敗する種が見つかった型 ${fails.size} 個`);
for (const [k, v] of [...fails].sort((a, b) => b[1].n - a[1].n)) console.log(`  ${v.n}回  ${k}  (例: seed ${v.seeds.join(",")})`);
process.exit(fails.size ? 1 : 0);
