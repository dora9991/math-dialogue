#!/bin/bash
# バスケ タップ記録（と、その記録を読み込むバスケ得点クリップ）を GitHub Pages（dora9991/math-dialogue の gh-pages ブランチ）に出す。
#   公開先: https://dora9991.github.io/math-dialogue/basket-tap/ ・ https://dora9991.github.io/math-dialogue/basket-clips/
# ほかの公開物（hs-board・solo・shidoan-maker など）にはさわらない。gh-pages の basket-tap/ フォルダの中と、basket-clips/index.html だけを入れかえる。
# force push はしない。先に node basket-tap/build.mjs と node basket-clips/build.mjs で public/ を作り直しておくこと。
# 使い方: bash basket-tap/tools/deploy-ghpages.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"   # math-dialogue
WORK="$(mktemp -d "${TMPDIR:-/tmp}/btap-ghp.XXXXXX")"
cleanup() { cd "$ROOT"; git worktree remove --force "$WORK/ghp" >/dev/null 2>&1 || true; rm -rf "$WORK"; }
trap cleanup EXIT

for f in public/basket-tap/index.html public/basket-tap/manifest.webmanifest public/basket-tap/sw.js public/basket-clips/index.html; do
  [ -f "$ROOT/$f" ] || { echo "$f がありません。先に build.mjs を実行してください"; exit 1; }
done

cd "$ROOT"
git fetch origin gh-pages --quiet
git worktree add --detach "$WORK/ghp" origin/gh-pages >/dev/null

# basket-tap/ の中だけを public/basket-tap/ と同じにする（このフォルダの外は消さない）
rm -rf "$WORK/ghp/basket-tap"
mkdir -p "$WORK/ghp/basket-tap" "$WORK/ghp/basket-clips"
cp -R "$ROOT/public/basket-tap/." "$WORK/ghp/basket-tap/"
find "$WORK/ghp/basket-tap" -name '.DS_Store' -delete
cp "$ROOT/public/basket-clips/index.html" "$WORK/ghp/basket-clips/index.html"

cd "$WORK/ghp"
git add -A -- basket-tap basket-clips/index.html
if git diff --cached --quiet; then
  echo "変更はありません（公開中と同じ）"
  exit 0
fi
git diff --cached --stat | tail -12
git commit -q -m "バスケ タップ記録を /basket-tap/ に公開・バスケ得点クリップを更新（basket-tap/ と basket-clips/index.html だけを入れかえ。ほかの公開物は変えない）" \
  -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push origin HEAD:gh-pages
echo "公開しました: https://dora9991.github.io/math-dialogue/basket-tap/ ・ https://dora9991.github.io/math-dialogue/basket-clips/ （反映まで1〜2分）"
