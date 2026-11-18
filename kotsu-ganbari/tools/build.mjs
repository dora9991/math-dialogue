// 使い方: node tools/build.mjs   → manifest.json（一覧用）を作る
import { readdirSync, writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
const here = dirname(fileURLToPath(import.meta.url)), root = join(here, ".."), qdir = join(root, "q");
const out = [];
for (const f of readdirSync(qdir).filter((f) => /^q\d\d\.js$/.test(f)).sort()) {
  const sc = (await import(pathToFileURL(join(qdir, f)).href)).default;
  out.push({ n: sc.n, title: sc.title, steps: sc.steps.length });
}
out.sort((a, b) => a.n - b.n);
writeFileSync(join(root, "manifest.json"), JSON.stringify(out) + "\n");
console.log(`manifest.json：${out.length}問`);
