#!/bin/bash
# 高校数学 黒板解説（hs-board）を GitHub Pages（dora9991/math-dialogue の gh-pages ブランチ）の /hs-board/ に出す。
#   公開先: https://dora9991.github.io/math-dialogue/hs-board/
# ほかの公開物（shidoan-maker・solo・mecha-battle など）にはさわらない。gh-pages の hs-board/ フォルダの中だけを入れかえる。
# 出すのは index.html・play.html・css・js・scenes・vendor だけ（README・tools は出さない）。force push はしない。
# 使い方: bash hs-board/tools/deploy-ghpages.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"   # math-dialogue
SRC="$ROOT/hs-board"
WORK="$(mktemp -d "${TMPDIR:-/tmp}/hsboard-ghp.XXXXXX")"
DEST="$WORK/ghp/hs-board"
STAMP="$(date +%Y%m%d%H%M)"

cleanup() { cd "$ROOT"; git worktree remove --force "$WORK/ghp" >/dev/null 2>&1 || true; rm -rf "$WORK"; }
trap cleanup EXIT

cd "$ROOT"
git fetch origin gh-pages --quiet
git worktree add --detach "$WORK/ghp" origin/gh-pages >/dev/null

# hs-board/ の中だけを、出すファイルと同じにする（このフォルダの外は消さない）
mkdir -p "$DEST"
rsync -a --delete --exclude '.DS_Store' \
  --include 'index.html' --include 'play.html' --include 'css/***' --include 'js/***' --include 'scenes/***' --include 'vendor/***' --exclude '*' \
  "$SRC/" "$DEST/"

# 古いJS・CSSがブラウザに残らないように、読みこみに版の印をつける（公開する index.html・play.html だけ）
for f in index.html play.html; do
  sed -i '' -E "s#(src|href)=\"((js|css)/[^\"?]+\.(js|css))\"#\1=\"\2?v=$STAMP\"#g" "$DEST/$f"
done

cd "$WORK/ghp"
git add -A -- hs-board
if git diff --cached --quiet; then
  echo "変更はありません（公開中と同じ）"
  exit 0
fi
git diff --cached --stat | tail -3
git commit -q -m "高校数学 黒板解説を /hs-board/ に公開（hs-board/ だけを入れかえ。ほかの公開物は変えない）" \
  -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
git push origin HEAD:gh-pages
echo "公開しました: https://dora9991.github.io/math-dialogue/hs-board/ （反映まで1〜2分）"
