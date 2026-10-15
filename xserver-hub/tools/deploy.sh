#!/bin/bash
# ハブを Xserver に置く・更新する（Xserver に SSH でログインして、サーバーの上で動かす）。
#
#   はじめて：
#     mkdir -p ~/src && cd ~/src && git clone --depth 1 https://github.com/dora9991/math-dialogue.git
#     bash ~/src/math-dialogue/xserver-hub/tools/deploy.sh --public-dir=$HOME/example.com/public_html/hub
#   更新：
#     cd ~/src/math-dialogue && git pull && bash xserver-hub/tools/deploy.sh
#
# やること：
#   1) PHP のファイルを全部、文法チェック（1つでも壊れていたら、置かない）
#   2) メンテナンス中にする（毎分の処理も止まる。LINE の Webhook は受け付け続ける）
#   3) プログラム（app/）を ~/hub/app へ。新しいものを横に作ってから、名前を入れ替える
#      ・~/hub/config（設定と秘密）と ~/hub/var（ログ・バックアップ）には触らない
#   4) 画面の部品（public/）を公開フォルダへ。index.php は HUB_ROOT を ~/hub にしたものを作ってから入れ替える
#   5) 設定があれば：データベースの更新（流す前に自動でバックアップ）→ 健康診断
#   6) メンテナンスを終える
#
# 指定：--root=…（既定 ~/hub）／--public-dir=…（はじめての1回だけ。~/hub/config/deploy.env に覚える）
#       PHP=/usr/bin/php8.3 bash deploy.sh のように、使う PHP を決められる（既定は、入っている中でいちばん新しいもの）

set -Eeuo pipefail   # -E：関数の中で失敗しても、下の「途中で止まりました」を出す
umask 077

die() { echo "$*" >&2; exit 1; }

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ROOT="${HOME}/hub"
PUBLIC_DIR=""
for a in "$@"; do
  case "$a" in
    --root=*) ROOT="${a#--root=}" ;;
    --public-dir=*) PUBLIC_DIR="${a#--public-dir=}" ;;
    -h|--help) awk 'NR > 1 && /^#/ { sub(/^# ?/, ""); print; next } NR > 1 { exit }' "$0"; exit 0 ;;
    *) die "知らない指定です: $a（--help で使い方）" ;;
  esac
done
[ -f "$HERE/app/bootstrap.php" ] && [ -f "$HERE/public/index.php" ] || die "ハブのソース（$HERE）が見つかりません"

# ~ で始まる指定を、ホームに直す（--public-dir=~/… は bash が展開しないため）
ROOT="${ROOT/#\~/$HOME}"
PUBLIC_DIR="${PUBLIC_DIR/#\~/$HOME}"
case "$ROOT$PUBLIC_DIR" in *"'"*|*'\'*|*'|'*|*'&'*) die "場所の名前に ' \\ | & は使えません" ;; esac

# ---- 置き場所（プログラムと秘密）：公開フォルダの外 ----
in_public() { case "$1/" in */public_html/*|*/www/*) return 0 ;; esac; return 1; }
! in_public "$ROOT" || die "プログラムの場所（$ROOT）が公開フォルダの中です。公開フォルダの外（例：~/hub）にしてください"
mkdir -p "$ROOT"
ROOT="$(cd "$ROOT" && pwd -P)"
! in_public "$ROOT" || die "プログラムの場所（$ROOT）が公開フォルダの中です（リンクの先を含めて）。公開フォルダの外にしてください"
mkdir -p "$ROOT/config" "$ROOT/var/log" "$ROOT/var/backup" "$ROOT/var/export"
chmod 700 "$ROOT" "$ROOT/config" "$ROOT/var" "$ROOT/var/log" "$ROOT/var/backup" "$ROOT/var/export"

# ---- 公開フォルダ：はじめての1回に覚えて、次からはそれを使う ----
ENVFILE="$ROOT/config/deploy.env"
if [ -z "$PUBLIC_DIR" ] && [ -f "$ENVFILE" ]; then
  PUBLIC_DIR="$(sed -n 's/^PUBLIC_DIR=//p' "$ENVFILE" | head -n 1)"
fi
[ -n "$PUBLIC_DIR" ] || die "はじめての1回は、公開フォルダを --public-dir=… で指定してください（例：--public-dir=\$HOME/example.com/public_html/hub）"
(umask 022 && mkdir -p "$PUBLIC_DIR")
PUBLIC_DIR="$(cd "$PUBLIC_DIR" && pwd -P)"
[ "$PUBLIC_DIR" != "$HOME" ] && [ "$PUBLIC_DIR" != "/" ] || die "公開フォルダに $PUBLIC_DIR は使えません"
case "$PUBLIC_DIR/" in "$ROOT"/*) die "公開フォルダを $ROOT の中にはできません" ;; esac
case "$ROOT/" in "$PUBLIC_DIR"/*) die "$ROOT が公開フォルダ（$PUBLIC_DIR）の中です" ;; esac
# ほかのサイト（WordPress など）が入っているフォルダには置かない（.htaccess と index.php を上書きしてしまうため）
for f in .htaccess index.php; do
  if [ -f "$PUBLIC_DIR/$f" ] && ! grep -q 'xserver-hub' "$PUBLIC_DIR/$f"; then
    die "$PUBLIC_DIR/$f は、ハブのものではありません。ハブ専用の空のフォルダ（サブドメインなど）を指定してください"
  fi
done
printf 'PUBLIC_DIR=%s\n' "$PUBLIC_DIR" > "$ENVFILE"
chmod 600 "$ENVFILE"

# ---- 使う PHP（Xserver は /usr/bin/php8.x。コマンドの php は古いことがある） ----
if [ -z "${PHP:-}" ]; then
  for v in 8.5 8.4 8.3 8.2 8.1; do
    if [ -x "/usr/bin/php$v" ]; then PHP="/usr/bin/php$v"; break; fi
  done
  PHP="${PHP:-php}"
fi
command -v "$PHP" >/dev/null 2>&1 || die "PHP（$PHP）が見つかりません。PHP=/usr/bin/php8.3 のように指定してください"
"$PHP" -r 'exit(PHP_VERSION_ID >= 80100 ? 0 : 1);' || die "PHP 8.1 以上が要ります（$PHP は $("$PHP" -r 'echo PHP_VERSION;')）。PHP=/usr/bin/php8.3 のように指定してください"
echo "PHP：$("$PHP" -r 'echo PHP_VERSION;')（$PHP）"
miss="$("$PHP" -r 'foreach (["pdo_mysql", "openssl", "curl", "mbstring", "json"] as $e) { if (!extension_loaded($e)) echo $e, " "; }')"
[ -z "$miss" ] || die "PHP の拡張が足りません：$miss"

hub() { "$PHP" "$ROOT/app/bin/hub" "$@"; }

echo "1) 文法チェック…"
bad=0
while IFS= read -r -d '' f; do
  if ! out="$("$PHP" -l "$f" 2>&1)"; then echo "$out" >&2; bad=1; fi
done < <(find "$HERE/app" "$HERE/public" -name '*.php' -print0; printf '%s\0' "$HERE/app/bin/hub")
[ "$bad" = 0 ] || die "壊れたファイルがあるので、置くのをやめました（いまのハブは、そのまま動いています）"

HAVE_CONFIG=0
[ -f "$ROOT/config/config.php" ] && HAVE_CONFIG=1
MAINT=0
if [ "$HAVE_CONFIG" = 1 ] && [ -f "$ROOT/app/bin/hub" ]; then
  echo "2) メンテナンス中にします"
  if hub maintenance:on; then MAINT=1; fi
fi
on_error() {
  echo "" >&2
  echo "❌ 途中で止まりました（上のメッセージを見てください）。" >&2
  if [ "$MAINT" = 1 ]; then
    echo "   いまはメンテナンス中のままです（管理画面と API は 503。LINE の Webhook は受け付けています）。" >&2
    echo "   原因を直して、もう一度 deploy.sh を動かしてください（docs/04_日々の運用.md「更新が失敗したら」）。" >&2
    echo "   直す前に再開するなら：$PHP $ROOT/app/bin/hub maintenance:off" >&2
  fi
}
trap on_error ERR

echo "3) プログラムを置きます：$ROOT/app"
rm -rf "$ROOT/app.new" "$ROOT/app.old"
cp -R "$HERE/app" "$ROOT/app.new"
find "$ROOT/app.new" -type d -exec chmod 700 {} +
find "$ROOT/app.new" -type f -exec chmod 600 {} +
chmod 700 "$ROOT/app.new/bin/hub"
if [ -d "$ROOT/app" ]; then mv "$ROOT/app" "$ROOT/app.old"; fi
mv "$ROOT/app.new" "$ROOT/app"
rm -rf "$ROOT/app.old"

echo "4) 画面の部品を置きます：$PUBLIC_DIR"
(
  umask 022
  # index.php 以外を先に（古い部品は消さない：開いたままの画面が、古い部品を読みに来ることがあるため）
  if command -v rsync >/dev/null 2>&1; then
    rsync -a --chmod=D755,F644 --exclude=/index.php "$HERE/public/" "$PUBLIC_DIR/"
  else
    tar -C "$HERE/public" --exclude=./index.php -cf - . | tar -C "$PUBLIC_DIR" -xf -
    find "$PUBLIC_DIR" -type d -exec chmod 755 {} + && find "$PUBLIC_DIR" -type f -exec chmod 644 {} +
  fi
  # index.php：HUB_ROOT を書き換えたものを横に作り、確かめてから入れ替える
  sed "s|^const HUB_ROOT = '__HUB_ROOT__';\$|const HUB_ROOT = '${ROOT}';|" "$HERE/public/index.php" > "$PUBLIC_DIR/.index.php.new"
  grep -qF "const HUB_ROOT = '${ROOT}';" "$PUBLIC_DIR/.index.php.new" || { rm -f "$PUBLIC_DIR/.index.php.new"; echo "index.php の HUB_ROOT を書き換えられませんでした" >&2; exit 1; }
  "$PHP" -l "$PUBLIC_DIR/.index.php.new" >/dev/null
  chmod 644 "$PUBLIC_DIR/.index.php.new"
  mv -f "$PUBLIC_DIR/.index.php.new" "$PUBLIC_DIR/index.php"
)

if [ "$HAVE_CONFIG" = 0 ]; then
  trap - ERR
  cat <<EOF

✅ 置きました。まだ設定がありません。続けて（docs/02_Xserver初期設定.md の 5 から）：
  $PHP $ROOT/app/bin/hub init                    … 質問に答えて設定を作る（鍵は自動で作る）
  $PHP $ROOT/app/bin/hub migrate                 … データベースを作る
  $PHP $ROOT/app/bin/hub admin:create-owner あなたのメール
  $PHP $ROOT/app/bin/hub doctor --online         … 健康診断
そのあと、サーバーパネルの「Cron設定」に、毎分（分・時・日・月・曜日をすべて *）：
  $PHP $ROOT/app/bin/hub tick
EOF
  exit 0
fi

echo "5) データベースの更新…"
hub migrate
echo "   健康診断…"
hub doctor || echo "   ⚠️ 健康診断で ❌ が出ています。上を見て直してください（ハブは動かします）"

echo "6) メンテナンスを終えます"
hub maintenance:off
trap - ERR
echo "✅ おわりました。"
