#!/usr/bin/env node
/* 公開：GitHub Pages（gh-pages ブランチ）の contents/index.html だけを足す・差し替える。
   ほかの公開物（数学ラボ本体・basket-tap・seitoshido-navi など）には触らない。
   使い方：  node contents/tools/publish-pages.cjs          … 1ファイル版を作り直して、gh-pages に足して push する
            node contents/tools/publish-pages.cjs --dry    … gh-pages の作業用コピーにコミットするところまで（push しない）
   公開先：https://dora9991.github.io/math-dialogue/contents/（反映まで1〜2分）
   ※ npm run deploy（vite build → gh-pages）は gh-pages を丸ごと入れかえるので、main にない公開物が消える。
     このツールだけを更新するときは、こちらを使う。
   ※ 公開すると、URL を知っている人はだれでも開ける（検索に出ないよう noindex は入っている）。
     一覧に出るのは、公開してよい道具のURLと、GitHub のソースへのリンクだけ。限定配布の道具のURLは載せていない。
     公開の前に、node contents/tools/check.cjs で、限定配布・自分用の道具に live／file が入っていないことを確かめる。 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const repo = path.resolve(root, '..');
const dry = process.argv.includes('--dry');
const git = (args, cwd = repo) => execFileSync('git', args, { cwd, stdio: ['ignore', 'pipe', 'inherit'] }).toString().trim();

// まちがい（✗）があるときは公開しない
execFileSync(process.execPath, [path.join(__dirname, 'check.cjs')], { stdio: 'inherit' });
execFileSync(process.execPath, [path.join(__dirname, 'bundle.cjs')], { stdio: 'inherit' });
const built = path.join(root, 'contents-all-in-one.html');
const src = git(['rev-parse', '--short', 'HEAD']);
const branch = git(['rev-parse', '--abbrev-ref', 'HEAD']);

git(['fetch', '-q', 'origin', 'gh-pages']);
const wt = fs.mkdtempSync(path.join(os.tmpdir(), 'contents-pages-'));
git(['worktree', 'add', '-q', '--detach', wt, 'FETCH_HEAD']);
try {
  fs.mkdirSync(path.join(wt, 'contents'), { recursive: true });
  fs.copyFileSync(built, path.join(wt, 'contents', 'index.html'));
  git(['add', 'contents/index.html'], wt);
  if (!git(['status', '--porcelain'], wt)) { console.log('公開中のものと同じなので、何もしませんでした'); process.exit(0); }
  git(['commit', '-q', '-m', `コンテンツ一覧ブラウザを /contents/ に公開（contents/index.html だけを足す・差し替える。ほかの公開物は変えない）\n\n元のファイルは ${branch}（${src}）の contents/contents-all-in-one.html（node contents/tools/bundle.cjs で作った1ファイル版）。`], wt);
  console.log('gh-pages にコミットしました：' + git(['log', '-1', '--format=%h %s'], wt));
  if (dry) console.log('--dry なので push はしていません');
  else { git(['push', 'origin', 'HEAD:gh-pages'], wt); console.log('公開しました：https://dora9991.github.io/math-dialogue/contents/（反映まで1〜2分）'); }
} finally {
  git(['worktree', 'remove', '--force', wt]);
}
