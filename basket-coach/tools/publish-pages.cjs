#!/usr/bin/env node
/* 公開：GitHub Pages（gh-pages ブランチ）の basket-coach/index.html だけを足す・差し替える。
   ほかの公開物（数学ラボ本体・basket-tap・seitoshido-navi など）には触らない。
   使い方：  node tools/publish-pages.cjs          … 1ファイル版を作り直して、gh-pages に足して push する
            node tools/publish-pages.cjs --dry    … gh-pages の作業用コピーにコミットするところまで（push しない）
   公開先：https://dora9991.github.io/math-dialogue/basket-coach/（反映まで1〜2分）
   ※ npm run deploy（vite build → gh-pages）は gh-pages を丸ごと入れかえるので、main にない公開物が消える。
     このツールだけを更新するときは、こちらを使う。
   ※ 公開すると、URL を知っている人はだれでも開ける（検索に出ないよう noindex は入っている）。
     記録・動画チェックの結果・会話は、開いた人の端末の中だけに残る（公開されるのはアプリとデータだけ。動画はどこにも送らない）。 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const repo = path.resolve(root, '..');
const dry = process.argv.includes('--dry');
const git = (args, cwd = repo) => execFileSync('git', args, { cwd, stdio: ['ignore', 'pipe', 'inherit'] }).toString().trim();

execFileSync(process.execPath, [path.join(__dirname, 'bundle.cjs')], { stdio: 'inherit' });
const built = path.join(root, 'basket-coach-all-in-one.html');
const src = git(['rev-parse', '--short', 'HEAD']);
const branch = git(['rev-parse', '--abbrev-ref', 'HEAD']);

git(['fetch', '-q', 'origin', 'gh-pages']);
const wt = fs.mkdtempSync(path.join(os.tmpdir(), 'basket-coach-pages-'));
git(['worktree', 'add', '-q', '--detach', wt, 'FETCH_HEAD']);
try {
  fs.mkdirSync(path.join(wt, 'basket-coach'), { recursive: true });
  fs.copyFileSync(built, path.join(wt, 'basket-coach', 'index.html'));
  git(['add', 'basket-coach/index.html'], wt);
  if (!git(['status', '--porcelain'], wt)) { console.log('公開中のものと同じなので、何もしませんでした'); process.exit(0); }
  git(['commit', '-q', '-m', `バスケ・グロウ（バスケ育成アプリ）を /basket-coach/ に公開（basket-coach/index.html だけを足す・差し替える。ほかの公開物は変えない）\n\n元のファイルは ${branch}（${src}）の basket-coach/basket-coach-all-in-one.html（node basket-coach/tools/bundle.cjs で作った1ファイル版）。`], wt);
  console.log('gh-pages にコミットしました：' + git(['log', '-1', '--format=%h %s'], wt));
  if (dry) console.log('--dry なので push はしていません');
  else { git(['push', 'origin', 'HEAD:gh-pages'], wt); console.log('公開しました：https://dora9991.github.io/math-dialogue/basket-coach/（反映まで1〜2分）'); }
} finally {
  git(['worktree', 'remove', '--force', wt]);
}
