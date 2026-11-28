

## 公開の記録（2026-11-18）

- 本番のデータベース：表 `homework` と関数を、小さな塊に分けて入れた（`db/hw.sql` を分けたもの）。**`hw_t_delete`（消す）だけは、まだ**（`delete from` を含むため、Supabase 側が確認を出す。確認の返事が間に合わず、時間切れになった）。入れるときは、`db/hw.sql` の `hw_t_delete` と、その権限（`revoke`／`grant`）の部分だけを流す。それまでは「締める」を使う（画面は、消せないことを案内する）。
- gh-pages：先生のページ `solo/teacher/homework/`、先生の画面の入り口（`patch_teacher_hw.py.txt`：担当のクラスの画面のボタンと、クラスの画面の見出し「📌 宿題を出す・見る」）、生徒の画面（学習時間＋AIのおすすめ＋宿題＋ご意見ばこの文言）。
- 入り口の試験：`check-entry.mjs.txt`（localStorage／sessionStorage のどちらのログインでも、同じタブで引きつがれる）。12件 OK。
- 本体に入れるときは、先生の画面の変更（`patch_teacher_hw.py.txt` の 3か所）も、本体のソースに入れること。
