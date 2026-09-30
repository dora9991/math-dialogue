// ============================================================
// tools/sample.mjs — 単元ごとに問題を数問ずつ画面に出して、目で確かめる
//   node tools/sample.mjs <skillId ...> [--n 2] [--seed 1]
//  ※ 数式は TeX のまま出す。「答え・誤答・解説が数学的に正しいか」を読むための道具。
// ============================================================
import { SKILLS } from "../js/data/graph.js";
import { makeItem, answerText } from "../js/core/items.js";

const args = process.argv.slice(2);
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const n = Number(opt("--n", 2));
const seed0 = Number(opt("--seed", 1));
const ids = args.filter((a, i) => !a.startsWith("--") && !(i > 0 && args[i - 1].startsWith("--")));
for (const id of ids) {
  const sk = SKILLS[id];
  if (!sk) {
    console.log(`?? ${id}`);
    continue;
  }
  console.log(`\n■ ${id}  ${sk.name}`);
  for (const tpl of sk.tpl || []) {
    for (const level of [1, 2, 3]) {
      for (let k = 0; k < n; k++) {
        const it = makeItem(sk, level, seed0 + k, tpl.id);
        console.log(`\n[${tpl.id} L${level} s${seed0 + k}] (${it.kind})${it.fig ? " [図あり]" : ""}`);
        console.log("Q: " + it.q.replace(/\n/g, " ⏎ "));
        if (it.kind === "choice") {
          it.choices.forEach((c, i) => console.log(`   ${"ABCDE"[i]}${c.correct ? "*" : " "} ${c.label}${c.mc ? "   ← " + c.mc : ""}`));
        } else if (it.kind === "num") {
          console.log(`   答え: ${answerText(it)}${it.post ? " " + it.post : ""}   誤答: ${it.wrongs.map(([v, mc]) => `${v.d === 1 ? v.n : v.n + "/" + v.d}(${mc || "-"})`).join(", ")}`);
        } else {
          console.log(`   答え: ${it.fields.map((f) => `${f.pre || ""}${f.id}=${f.value.d === 1 ? f.value.n : f.value.n + "/" + f.value.d}${f.post || ""}`).join(" | ")}   [${it.layout}${it.orderFree ? ",順不同" : ""}]`);
          for (const w of it.wrongs) console.log(`   誤: ${Object.entries(w.values).map(([k2, v]) => `${k2}=${v.d === 1 ? v.n : v.n + "/" + v.d}`).join(", ")} (${w.mc})`);
        }
        console.log("E: " + it.explain.replace(/\n/g, " ⏎ "));
      }
    }
  }
}
