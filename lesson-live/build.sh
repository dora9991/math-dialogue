#!/bin/sh
# 公開用フォルダ（.deploy/）を作る。テスト・SQL・メモは入れない。
#   sh lesson-live/build.sh && npx wrangler pages deploy lesson-live/.deploy --project-name math-live
set -e
cd "$(dirname "$0")"
rm -rf .deploy
mkdir -p .deploy
cp index.html teacher.html screen.html _headers .deploy/
cp -R css js vendor .deploy/
echo "ok: $(find .deploy -type f | wc -l | tr -d ' ') files → lesson-live/.deploy"
