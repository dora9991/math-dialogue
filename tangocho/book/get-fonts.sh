#!/usr/bin/env bash
# 本（PDF）に使う書体を、book/fonts/ にそろえる。  使い方：bash book/get-fonts.sh
#   ・Noto Sans JP・Noto Serif JP（Google Fonts。SIL Open Font License 1.1）… 可変フォントを取ってきて、静的な太さ（400/500/700/900）に切り出す
#     → PDF に、ふつうの TrueType として埋め込める（可変フォントのままだと、Type 3 になる）
#   ・BIZ UD ゴシック（モリサワ。SIL Open Font License 1.1）… 「≒」など、Noto JP（Google 版）にない字の代用
# 要るもの：curl、python3（fontTools・brotli。無ければ、このスクリプトが一時的な venv に入れる）
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
fonts="$here/fonts"
tmp="$(mktemp -d)"
mkdir -p "$fonts"
base="https://raw.githubusercontent.com/google/fonts/main/ofl"
curl -fsSL -o "$tmp/sans.ttf"  "$base/notosansjp/NotoSansJP%5Bwght%5D.ttf"
curl -fsSL -o "$tmp/serif.ttf" "$base/notoserifjp/NotoSerifJP%5Bwght%5D.ttf"
curl -fsSL -o "$fonts/BIZUDGothic-Regular.ttf" "$base/bizudgothic/BIZUDGothic-Regular.ttf"
curl -fsSL -o "$fonts/BIZUDGothic-Bold.ttf"    "$base/bizudgothic/BIZUDGothic-Bold.ttf"
if ! python3 -c "import fontTools" 2>/dev/null; then
  python3 -m venv "$tmp/venv" && "$tmp/venv/bin/pip" install -q fonttools brotli
  py="$tmp/venv/bin/python"
else
  py=python3
fi
cat > "$tmp/instance.py" <<'PY'
import sys
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
src, wght, out = sys.argv[1], float(sys.argv[2]), sys.argv[3]
instancer.instantiateVariableFont(TTFont(src), {"wght": wght}, inplace=False, updateFontNames=True).save(out)
PY
for w in 400 500 700 900; do "$py" "$tmp/instance.py" "$tmp/sans.ttf"  "$w" "$fonts/NotoSansJP-$w.ttf" & done
for w in 400 700 900;     do "$py" "$tmp/instance.py" "$tmp/serif.ttf" "$w" "$fonts/NotoSerifJP-$w.ttf" & done
wait
rm -rf "$tmp"
echo "できた：$fonts"
