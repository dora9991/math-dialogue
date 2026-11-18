// ============================================================
// deploy-solo-lab.mjs — 数学ラボ ソロ（lab）だけを、gh-pages に「足す」
//
//   npm run deploy:lab            … ビルドして、/solo-lab/ を公開する
//   node scripts/deploy-solo-lab.mjs --dry   … 何を足すかを表示するだけ（公開しない）
//
//  ふつうの `npm run deploy`（gh-pages -d dist）は、gh-pages の中身をすべて入れ替える。
//  そのため、同じサイトに別の版（/solo/ のコツコツくん、メカバトルなど）があると、消してしまう。
//  この方法は、次のものだけを gh-pages に「足す」（既存のファイルは消さない・上書きしない）：
//    ・solo-lab/index.html
//    ・そのページが読み込むファイル（assets/ の中の、ハッシュつきの名前のもの）
//  ハッシュつきの名前なので、ほかの版のファイルと名前がぶつかることはない（同じ名前なら同じ中身）。
//  公開先：https://<ユーザー>.github.io/math-dialogue/solo-lab/
// ============================================================
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ghpages from "gh-pages";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const ASSETS = path.join(DIST, "assets");
const ENTRY = path.join(DIST, "solo-lab", "index.html");
const dry = process.argv.includes("--dry");

if (!fs.existsSync(ENTRY)) {
  console.error("✗ dist/solo-lab/index.html がない。先に `npm run build` をする（または `npm run deploy:lab`）");
  process.exit(1);
}

// 1. solo-lab/index.html から、読み込まれるファイルを芋づる式に集める
const names = fs.readdirSync(ASSETS);
const need = new Set();
const queue = [ENTRY];
while (queue.length) {
  const text = fs.readFileSync(queue.pop(), "utf8");
  for (const n of names) {
    if (need.has(n) || !text.includes(n)) continue;
    need.add(n);
    if (/\.(js|css)$/.test(n)) queue.push(path.join(ASSETS, n));
  }
}

// 2. 足すものだけを、一時フォルダにそろえる
const stage = fs.mkdtempSync(path.join(os.tmpdir(), "solo-lab-"));
fs.mkdirSync(path.join(stage, "solo-lab"), { recursive: true });
fs.mkdirSync(path.join(stage, "assets"), { recursive: true });
fs.copyFileSync(ENTRY, path.join(stage, "solo-lab", "index.html"));
let bytes = 0;
for (const n of need) {
  fs.copyFileSync(path.join(ASSETS, n), path.join(stage, "assets", n));
  bytes += fs.statSync(path.join(ASSETS, n)).size;
}
console.log(`足すもの：solo-lab/index.html ＋ assets/ の ${need.size} ファイル（${(bytes / 1024 / 1024).toFixed(1)}MB）`);
for (const n of [...need].sort()) if (/^solo-lab.*\.(js|css)$/.test(n)) console.log(`  ・${n}`);

if (dry) {
  console.log(`（--dry なので公開しない。そろえた場所：${stage}）`);
  process.exit(0);
}

// 3. gh-pages に足す（add: true … 既存のファイルは消さない）
ghpages.publish(
  stage,
  { add: true, dotfiles: false, message: "数学ラボ ソロ（lab）を /solo-lab/ に公開（足すだけ。ほかの公開物は変えない）" },
  (err) => {
    fs.rmSync(stage, { recursive: true, force: true });
    if (err) { console.error("✗ 公開に失敗：", err); process.exit(1); }
    console.log("✓ 公開した → https://dora9991.github.io/math-dialogue/solo-lab/");
  },
);
