# 宿題機能の約束ごと（契約）— DB・先生のページ・生徒の画面が、これで揃う

先生がクラス（または生徒）に、**「この小単元の問題を N 問解く」「M 分間解く」**（または両方）の宿題を出す。生徒がそれを達成すると「🎉 達成しました！」と出る。先生は、宿題を出す・宿題の達成を見る（チェック）・これまでの宿題の取り組みをマス目の一覧で見る。

## 1. 考え方（いちばん大事）
**進み具合は、生徒の学習の記録（state）から計算する。新しい書きこみの道は作らない。**
生徒の state（`localStorage mathlab-solo-v1` ＝ サーバーの `kotsu.states` に同期ずみ）には、すでに：
- `log`: 直近400件の解答 `[{t: 解いた時刻(ms), u: 単元ID, L: レベル, ok: 正解か, d: 秒, …}]`（新しい順）
- `daily`: `{ "YYYY-MM-DD": { n: 解いた数, c: 正解数, xp, sec: 学習時間（秒） } }`
が入っている。生徒の画面（クライアント）も、サーバー（先生の画面用の集計）も、**同じ式**で進み具合を出す。

## 2. 宿題のデータ
`kotsu.homework`（DB）：
| 列 | 型 | 意味 |
|---|---|---|
| id | uuid（既定 gen_random_uuid） | |
| org_id | uuid | 学校（塾） |
| class_id | uuid null | クラス全員に出す。null なら user_ids の生徒だけ |
| user_ids | uuid[] null | 個人に出す（class_id が null のとき） |
| title | text | 題（例：「正負の数の加法 10問」。空なら自動で作る） |
| unit_id | text null | 小単元ID（例 `J1-u1`）。n と組 |
| n | int null | 解く問題数（まちがいも数える） |
| min | int null | 学習時間（分） |
| start_date / due_date | date | 期間（日本時間。両端をふくむ） |
| note | text null | 先生のひとこと（200字） |
| created_by | uuid | 先生のユーザー |
| created_at | timestamptz | |
| closed | boolean | 先生が締めた（取り消した）宿題 |
- `n` か `min` の少なくとも1つ。`unit_id` があるときだけ `n` を指定できる（`unit_id` なしで `n` はだめ）。`n` は 1〜200、`min` は 1〜240。
- `unit_id` はあるが `n` が null のときは、「その単元に取り組む」だけの宿題とはせず、拒否する（`bad_args`）。

## 3. 進み具合の式（クライアントとサーバーで同じ）
日付はすべて日本時間（Asia/Tokyo）。`start_ms` ＝ start_date の 0:00:00 JST、`end_ms` ＝ due_date の 23:59:59.999 JST。
- `count` ＝ `log` のうち `e.u === unit_id` かつ `start_ms ≤ e.t ≤ end_ms` の件数。`correct` ＝そのうち `e.ok` が真の件数。（`unit_id` が null なら count は使わない）
- `sec` ＝ `start_date`〜`due_date` の各日 D について `daily[D].sec` の合計（秒）。
- 達成 `done` ＝ （`n` が null または `count ≥ n`）かつ（`min` が null または `sec ≥ min×60`）。
- `doneAt`（達成した日）＝ n の条件：`log` を古い順に並べて n 件目の日（JST）。min の条件：日ごとの `sec` を日付順に足して `min×60` に初めて届いた日。両方あるときは、遅いほう。
- 進み具合の割合 `pct` ＝ 設定されている条件の割合の最小値（`min(count/n, sec/(min×60))`、上限100%）。
- 状態：`status` ＝ `done`（達成）／`partial`（`pct`>0 で未達成）／`none`（`pct`=0）。`phase` ＝ `upcoming`（今日が start_date より前）／`active`（期間中）／`ended`（due_date をすぎた）。マス目の色は、`phase` が `upcoming` なら白、それ以外は `status`（緑／黄／赤）。
- 宿題を出す前に解いた分は数えない（`start_date` の 0:00 JST から）。`start_date` は、出した日（今日）以降でも、今日より前でもよい（先生が決める。既定は今日）。

## 4. RPC（PostgREST。`POST {SUPABASE}/rpc/<名前>`、ヘッダ `Content-Type: application/json`・`Content-Profile: kotsu`・`apikey`・`Authorization: Bearer <publishable key>`。エラーは `{"error":"auth"|"bad_args"|"not_found"|"forbidden"…}`）
SUPABASE ＝ `https://mtzhbiadzqjhvhzzdsbn.supabase.co/rest/v1`、publishable key ＝ `sb_publishable_mq8nUqxVfGtnNHp5UCUtCA_9-x1xn7E`。
権限：すべて SECURITY DEFINER で、中でトークンを確かめる。`revoke all … from public; grant execute … to anon, authenticated;`（既存の関数と同じ形）。

### 先生（スタッフのトークン `p_token`。先生の画面のログインと同じ）
- `hw_t_create(p_token text, p_class uuid, p_users uuid[], p_title text, p_unit text, p_n int, p_min int, p_start date, p_due date, p_note text) → {ok:true, id}`
  - 先生は、自分の担当のクラス（または自分のクラスの生徒）にだけ出せる。管理者は学校内のすべて。ほかの学校・担当外は `forbidden`。
- `hw_t_list(p_token text, p_class uuid default null, p_limit int default 60) → {ok, items:[{id, title, class_id, class_name, user_ids, unit_id, unit_name?, n, min, start_date, due_date, note, created_at, closed, total, done, partial, none}]}`（新しい順。`total` ＝対象の生徒数。`done/partial/none` は、いまの進み具合の人数。期間外の未達成は `none` に入れず `missed` を別に `missed` として返す）
- `hw_t_detail(p_token text, p_id uuid) → {ok, hw:{…}, students:[{id, no, nick, login, count, correct, sec, pct, status, done_at}]}`（クラスの出席番号 `no` 順。`login` は先生にだけ見える。生徒の本名は出さない）
- `hw_t_grid(p_token text, p_class uuid, p_from date default null, p_to date default null, p_limit int default 40) → {ok, hws:[{id,title,start_date,due_date,unit_id,n,min}（古い順）], students:[{id,no,nick, cells:{<hwId>: {pct, status}}}]}`（クラスの生徒 × 宿題。マス目一覧用）
- `hw_t_close(p_token text, p_id uuid, p_closed boolean default true) → {ok:true}`（取り消し／再開）
- `hw_t_delete(p_token text, p_id uuid) → {ok:true}`（出した直後のまちがい用。作ってから 1日以内、または 取り組みが 0 のものだけ消せる、でもよい。決めて報告）

### 生徒（生徒のトークン `p_token`。コツコツくんのログインと同じ）
- `hw_s_list(p_token text) → {ok, items:[{id, title, unit_id, unit_name?, n, min, start_date, due_date, note, created_at, closed}]}`
  - その生徒が対象の宿題のうち、`closed` でなく、`due_date` が 14日以内（またはまだ先）のもの。クラス全員宛て（その生徒が `class_students` に入っているクラス）と、個人宛て。
  - 進み具合は返さない（クライアントが state から計算する）。

## 5. 先生の画面（新しい専用ページ）
`solo/teacher/homework/`（gh-pages に置く、プレーンな JS のページ。React は使わない）。先生のログイン情報は、先生の画面と同じ localStorage キー（`kotsu-staff-v1` ＝ `{token, user:{role, nick, id}, org:{code,name}, server}`。`server` が公開サーバーのURLと同じときだけ使う）から読む。ログインしていないときは、「先生の画面でログインしてください」と案内（`../`）。
- 「宿題を出す」：クラス（または生徒を選ぶ）、小単元（学年→章→単元の選択。検索つき）、N問、M分、期間、ひとこと。
- 「いまの宿題」：一覧（達成◯人／一部◯人／まだ◯人）。1件を開くと、生徒ごとの進み（バー、○/△/×、達成日）。「締める」。
- 「これまでの取り組み」（マス目）：行＝生徒（出席番号順）、列＝宿題（日付順）。色：達成（緑）／一部（黄）／まだ（赤）／期間中（薄い灰）／未来（白）。クラスの切りかえ。スマホでも横スクロールで見られる。

## 6. 生徒の画面（solo のバンドルへのパッチ）
- ホームに「📌 先生からの宿題」のカード（宿題があるときだけ）：題、期限、進みのバー、「あと○問」「あと○分」。達成ずみは「🎉 達成しました！」。
- 解いているとき：達成した瞬間に、画面の上に「🎉 宿題を達成しました！（○○）」を出す（1つの宿題につき1回。`localStorage` に出したことを記録）。
- 問題画面のチップに、その単元の宿題があるとき「📌 宿題 あと3問」。
- 宿題は `hw_s_list` で、アプリを開いたとき・ホームに来たとき・画面にもどったときに（間隔をあけて）取りにいく。取れないとき（オフライン）は、前回の結果（localStorage）を使う。

## 7. 進み具合の「基準の実装」と検算データ（これが唯一の正解。SQL も、生徒の画面も、これと同じ結果にする）
- `progress.mjs`：`progress(hw, state, nowMs)` → `{count, correct, sec, pct, done, doneAt, status, phase}`（純粋な関数。日本時間）。
- `vectors.json`：検算データ（`{name, hw, state, nowMs, expect}` の配列）。実装は、全部のデータで `expect` と同じ結果になること。
  - `pct` は小数第3位までの比較でよい。`doneAt` は `YYYY-MM-DD`（日本時間）または null。

---

## 付録：データベースを作ったあとに、確定した点（2026-11-18）

契約から変わった点・決めた点は、`db/HANDOFF-hw-db.md` の「4．契約から変えた所・決めたこと」にまとめた。画面の作りに関わるもの：

- **期間は最長60日**（両端をふくむ）。開始日は、きょうの前後1年以内。超えると `bad_args`。
- **`hw_t_delete`**：作ってから24時間以内、または取り組みが 0 のものだけ消せる。n の宿題は「その単元を期間中に1問でも解いた生徒がいる」、min の宿題は「期間中の学習時間が1秒でもある生徒がいる」を「取り組み」とする。それ以外は `not_deletable`。
- **エラー**：役割ちがいは `role`（`auth`/`forbidden` ではない）。追加：`org_off`・`hw_limit`（1日60件）・`full`（学校20000件）。
- **`hw_t_grid`**：締めた宿題は出さない。開始日の新しい順に最大40件を取り、古い順で返す。
- **`hw_s_list`**：締めていない、期限が「きょう−14日」以降のもの。期限の近い順に最大50件。進み具合は返さない。
- **`unit_name` は返さない**（画面が `units.json` から出す）。やめた（active=false）生徒は対象に入れない。

未決の1点（`db/HANDOFF-hw-db.md` の「8．危険点」の2）：進み具合は生徒の `log`（直近400件）から、その場で計算するため、期限のあとに400問以上解くと、期限内の記録が押し出されて、終わった宿題が「未達成」に戻って見えることがある。対策の案は「生徒の画面が、達成した瞬間に `state` へ `hwDone` を書き、サーバーが『達成ずみ』として読む」。関数は `create or replace` なので、あとから足せる。
