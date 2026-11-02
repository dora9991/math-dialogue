#!/bin/bash
# 保存領域チェック（storage-check/index.html）を GitHub Pages（gh-pages ブランチの storage-check/）に出す。
#   公開先: https://dora9991.github.io/math-dialogue/storage-check/
# ほかの公開物にはさわらない（gh-pages の storage-check/ の中だけを入れかえる）。force push はしない。
# 使い方: bash storage-check/deploy-ghpages.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORK="$(mktemp -d "${TMPDIR:-/tmp}/storage-check-ghp.XXXXXX")"
cleanup() { cd "$ROOT"; git worktree remove --force "$WORK/ghp" >/dev/null 2>&1 || true; rm -rf "$WORK"; }
trap cleanup EXIT
cd "$ROOT"
git fetch origin gh-pages --quiet
git worktree add --detach "$WORK/ghp" origin/gh-pages >/dev/null
rm -rf "$WORK/ghp/storage-check"
mkdir -p "$WORK/ghp/storage-check"
cp "$ROOT/storage-check/index.html" "$WORK/ghp/storage-check/index.html"
cd "$WORK/ghp"
git add -A -- storage-check
if git diff --cached --quiet; then echo "変更はありません（公開中と同じ）"; exit 0; fi
git diff --cached --stat | tail -5
git commit -q -m "保存領域チェックを /storage-check/ に公開（storage-check/ だけを入れかえ。ほかの公開物は変えない）" \
  -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push origin HEAD:gh-pages
echo "公開しました: https://dora9991.github.io/math-dialogue/storage-check/ （反映まで1〜2分）"
