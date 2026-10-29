#!/bin/bash
# スポーツ タップ記録を GitHub Pages（dora9991/math-dialogue の gh-pages ブランチ）に出す。
#   公開先: https://dora9991.github.io/math-dialogue/sports-tap/
# ほかの公開物（basket-tap など）にはさわらない。gh-pages の sports-tap/ フォルダの中だけを入れかえる。
# force push はしない。先に node sports-tap/build.mjs で public/sports-tap/ を作り直しておくこと。
# 使い方: bash sports-tap/tools/deploy-ghpages.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"   # math-dialogue
WORK="$(mktemp -d "${TMPDIR:-/tmp}/stap-ghp.XXXXXX")"
cleanup() { cd "$ROOT"; git worktree remove --force "$WORK/ghp" >/dev/null 2>&1 || true; rm -rf "$WORK"; }
trap cleanup EXIT

for f in public/sports-tap/index.html public/sports-tap/manifest.webmanifest public/sports-tap/sw.js; do
  [ -f "$ROOT/$f" ] || { echo "$f がありません。先に node sports-tap/build.mjs を実行してください"; exit 1; }
done

cd "$ROOT"
git fetch origin gh-pages --quiet
git worktree add --detach "$WORK/ghp" origin/gh-pages >/dev/null

# sports-tap/ の中だけを public/sports-tap/ と同じにする（このフォルダの外は消さない）
rm -rf "$WORK/ghp/sports-tap"
mkdir -p "$WORK/ghp/sports-tap"
cp -R "$ROOT/public/sports-tap/." "$WORK/ghp/sports-tap/"
find "$WORK/ghp/sports-tap" -name '.DS_Store' -delete

cd "$WORK/ghp"
git add -A -- sports-tap
if git diff --cached --quiet; then
  echo "変更はありません（公開中と同じ）"
  exit 0
fi
git diff --cached --stat | tail -12
git commit -q -m "スポーツ タップ記録を /sports-tap/ に公開（sports-tap/ だけを入れかえ。ほかの公開物は変えない）"
git push origin HEAD:gh-pages
echo "公開しました: https://dora9991.github.io/math-dialogue/sports-tap/ （反映まで1〜2分）"
