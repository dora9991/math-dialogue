#!/usr/bin/env bash
# run-tests.sh — 宿題の DB（hw.sql）を、手もとの PostgreSQL 16 で確かめる。
#   使いかた：  bash run-tests.sh          （このフォルダで。何度流してもよい。テスト用データベース kotsu_hw_test は毎回作りなおす）
#   手順：クラスタ（port 54331）を用意・起動 → 空のデータベース → base-hw.sql（本番の写し）→ snapshot.sql → hw.sql（1回目）→ 検算データ作成 → test-hw.sql → test-rollback.sql（rollback-hw.sql）
#   終わりの値：全部通れば 0、失敗があれば 1。ログは work/test.log と work/results.tsv。本番には何もしない（接続しない）。
set -euo pipefail
cd "$(dirname "$0")"
PGBIN=/usr/lib/postgresql/16/bin
DATA=/var/lib/postgresql/kotsu-hw
SOCK=/var/lib/postgresql/kotsu-hw-sock
PORT=54331
DB=${HW_DB:-kotsu_hw_test}
HW_SQL=${HW_SQL:-hw.sql}          # 変えると、別の hw.sql（たとえば、わざと壊したもの）を、同じテストで確かめられる
PSQL="$PGBIN/psql -h 127.0.0.1 -p $PORT -U postgres -X -v ON_ERROR_STOP=1"
mkdir -p work

# 1. クラスタ
if [ ! -d "$DATA" ]; then
  runuser -u postgres -- "$PGBIN/initdb" -D "$DATA" --auth=trust -E UTF8 --locale=C.UTF-8 > /dev/null
fi
if ! "$PGBIN/pg_isready" -q -h 127.0.0.1 -p $PORT; then
  mkdir -p "$SOCK"; chown postgres "$SOCK"
  runuser -u postgres -- "$PGBIN/pg_ctl" -D "$DATA" -o "-p $PORT -c listen_addresses=127.0.0.1 -c unix_socket_directories=$SOCK" -l "$DATA/server.log" -w start > /dev/null
fi

# 2〜4. データベース・本番の写し・変更前のようす・hw.sql（1回目。apply_migration と同じく、1つのトランザクション）
$PSQL -d postgres -q -c "drop database if exists $DB" -c "create database $DB" 2> /dev/null
# 本番（PostgreSQL 17.6・Supabase）に近づける：jit=off・work_mem≒2MB・並列 1（pg_settings で確認した値）
$PSQL -d postgres -q -c "alter database $DB set jit = off" -c "alter database $DB set work_mem = '2184kB'" -c "alter database $DB set max_parallel_workers_per_gather = 1"
$PSQL -d $DB -q -f base-hw.sql
$PSQL -d $DB -q -f snapshot.sql
$PSQL -d $DB -q -1 -f "$HW_SQL"

# 5. 検算データ（基準の実装 ../progress.mjs が、expect を作る）
node make-vectors.mjs work 2000 > work/vectors-stat.json

# 6. テスト
set +e
$PSQL -d $DB -v hw_sql="$HW_SQL" -f test-hw.sql 2>&1 | tee work/test.log
rc=${PIPESTATUS[0]}

# 7. 元にもどす（rollback-hw.sql）と、やりなおし
if [ $rc -eq 0 ]; then
  $PSQL -d $DB -v hw_sql="$HW_SQL" -f test-rollback.sql 2>&1 | tee -a work/test.log
  rc=${PIPESTATUS[0]}
fi
set -e
exit $rc
