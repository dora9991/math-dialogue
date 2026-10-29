#!/bin/bash
# スポーツ タップ記録・サッカー タップ記録を GitHub Pages（dora9991/math-dialogue の gh-pages ブランチ）に出す。
#   公開先: https://dora9991.github.io/math-dialogue/sports-tap/ ・ https://dora9991.github.io/math-dialogue/soccer-tap/
# ほかの公開物（basket-tap・basket-clips など）にはさわらない。gh-pages の sports-tap/ と soccer-tap/ フォルダの中だけを入れかえる。
# force push はしない。先に node sports-tap/build.mjs で public/ を作り直しておくこと。
# 使い方: bash sports-tap/tools/deploy-ghpages.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"   # math-dialogue
WORK="$(mktemp -d "${TMPDIR:-/tmp}/stap-ghp.XXXXXX")"
cleanup() { cd "$ROOT"; git worktree remove --force "$WORK/ghp" >/dev/null 2>&1 || true; rm -rf "$WORK"; }
trap cleanup EXIT

APPS="sports-tap soccer-tap"
for a in $APPS; do
  for f in index.html manifest.webmanifest sw.js; do
    [ -f "$ROOT/public/$a/$f" ] || { echo "public/$a/$f がありません。先に node sports-tap/build.mjs を実行してください"; exit 1; }
  done
done

cd "$ROOT"
git fetch origin gh-pages --quiet
git worktree add --detach "$WORK/ghp" origin/gh-pages >/dev/null

# sports-tap/・soccer-tap/ の中だけを public/ と同じにする（このフォルダの外は消さない）
for a in $APPS; do
  rm -rf "$WORK/ghp/$a"
  mkdir -p "$WORK/ghp/$a"
  cp -R "$ROOT/public/$a/." "$WORK/ghp/$a/"
  find "$WORK/ghp/$a" -name '.DS_Store' -delete
done

cd "$WORK/ghp"
git add -A -- $APPS
if git diff --cached --quiet; then
  echo "変更はありません（公開中と同じ）"
  exit 0
fi
git diff --cached --stat | tail -12
git commit -q -m "スポーツ タップ記録を /sports-tap/、サッカー タップ記録を /soccer-tap/ に公開（この2つのフォルダだけを入れかえ。ほかの公開物は変えない）" \
  -m "${COMMIT_TRAILER:-Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>}"
git push origin HEAD:gh-pages
echo "公開しました: https://dora9991.github.io/math-dialogue/sports-tap/ ・ https://dora9991.github.io/math-dialogue/soccer-tap/ （反映まで1〜2分）"
