#!/bin/sh
# talk-g3/install-g3.sh — クラウドで書いた中3の台本を、Mac の lesson-navi/video/talk/scenes/ にコピーする。
#  使い方（Mac で）:  sh install-g3.sh "/Users/…/math-dialogue/lesson-navi/video/talk"
#  ・既にあるファイルは上書きしない（スキップして知らせる）。lessons.js には触らない（lessons-g3-rows.txt を手で貼る）。
#  ・コピーするだけ。声づくり（voice-queue.sh）は、check.mjs の検査が通ってから、別に入れる。
set -eu
TALK="${1:?Mac の talk フォルダ（scenes/ と lessons.js がある所）を渡してください}"
HERE="$(cd "$(dirname "$0")" && pwd)"
[ -d "$TALK/scenes" ] || { echo "✗ $TALK/scenes がない"; exit 1; }
n=0; skip=0
for f in "$HERE"/scenes/*.js; do
  b="$(basename "$f")"
  if [ -e "$TALK/scenes/$b" ]; then echo "スキップ（既にある）: $b"; skip=$((skip+1)); else cp "$f" "$TALK/scenes/$b"; n=$((n+1)); fi
done
echo "コピー $n 本、スキップ $skip 本"
echo "次：lessons-g3-rows.txt を lessons.js の配列に貼る → node check.mjs <ID> --shots → sh voice-queue.sh <ID>"
