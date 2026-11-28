# 宿題機能（データベース部分）引き継ぎ — hw.sql

作成：2026-11-18。契約：`HW-CONTRACT.md`（4．RPC・3．進み具合の式・7．検算データ）。
**本番には何も書きこんでいない**（本番は `select` で調べただけ）。作ったものは、手もとの PostgreSQL 16 のテスト用データベースで確かめた。

## 0. 出来たもの（このフォルダ）

| ファイル | 中身 |
|---|---|
| `hw.sql` | **本番に入れる変更**。表 1つ・関数 15こ。何度流しても同じ（冪等）。`begin/commit` は書いていない（apply_migration が包む） |
| `rollback-hw.sql` | 元にもどす SQL（`drop`）。手もとで「入れる → もどす → また入れる」まで確認ずみ |
| `base-hw.sql` | 本番の関係する表・関数の**写し**（データなし）。手もと用（本番には入れない）。本番の定義をそのまま使った |
| `snapshot.sql` `make-vectors.mjs` | テストの道具（hw.sql の前後で、既存のものが変わっていないことの確認／検算データ・ランダムデータの作成） |
| `test-hw.sql` `test-rollback.sql` `run-tests.sh` | テスト。`bash run-tests.sh`（約 25秒。毎回データベースを作りなおす。ポート 54331） |
| `mutation-check.sh` | 「テストが本当にまちがいを見つけるか」の確認。hw.sql をわざと 1か所ずつ壊して、テストが失敗することを見る |

## 1. 本番に入れる手順

1. **事前の確認**（読むだけ）：`select to_regclass('kotsu.homework')` が null、`select count(*) from pg_proc where pronamespace='kotsu'::regnamespace and proname like any (array['hw\_%','\_hw%'])` が 0。
2. **入れる**：Supabase の `apply_migration`（project `mtzhbiadzqjhvhzzdsbn`）に、`name = "kotsu_homework"`、`query = hw.sql の全文` を渡す。約 40KB。途中で止まっても、もう一度流してよい（冪等）。
   - 実行するユーザーが `postgres` であること（既存の関数の持ち主が postgres。`select proowner::regrole from pg_proc where proname='hw_t_list'` で確認）。
3. **入ったかの確認**（読むだけ）：
   - 関数 15こ：`select proname, proacl::text, prosecdef from pg_proc where pronamespace='kotsu'::regnamespace and (proname like 'hw\_%' or proname like '\_hw%') order by 1;`
     公開 7つ（`hw_t_*`・`hw_s_list`）は `{postgres=X/postgres,anon=X/postgres,authenticated=X/postgres}` ＋ `prosecdef = true`。内部 8つ（`_hw_*`）は `{postgres=X/postgres}` だけ。
   - 表：`select relrowsecurity, relacl::text from pg_class where oid='kotsu.homework'::regclass;` → `true`、`{postgres=arwdDxtm/postgres}`（anon・authenticated に何も無い）。
4. **動作の確認**（公開キーで。本番の先生のトークンが必要）：
   `POST https://mtzhbiadzqjhvhzzdsbn.supabase.co/rest/v1/rpc/hw_t_list`（`Content-Profile: kotsu`・`apikey`・`Authorization: Bearer <publishable key>`、本文 `{"p_token":"でたらめな40字"}`）→ `{"error":"auth"}`。先生の本物のトークンなら `{"ok":true,"items":[]}`。
   PostgREST の関数一覧は、`notify pgrst, 'reload schema'`（hw.sql の最後）と Supabase の DDL 検知で更新される。`PGRST202`（見つからない）が出たら、Dashboard の「Reload schema」。
5. 先生のページ（gh-pages）・生徒の画面の公開は、そのあと。**入れる前に公開すると**、先生のページは「宿題の機能が、サーバーにまだ入っていません」と出る（`PGRST202`）。

## 2. 表と関数の一覧

### 表 `kotsu.homework`（契約どおりの列）
`id uuid pk default gen_random_uuid()`・`org_id uuid → orgs (cascade)`・`class_id uuid null → classes (cascade)`・`user_ids uuid[] null`・`title text`・`unit_id text null`・`n int null`・`min int null`・`start_date date`・`due_date date`・`note text null`・`created_by uuid null → users (set null)`・`created_at timestamptz default now()`・`closed boolean default false`。
- `created_by` は **null を許す**（契約は「uuid」。先生のアカウントを消しても宿題を残すため `on delete set null`）。
- 外部キーは、既存の表と同じ流儀（`a_class_delete`・`a_user_delete` が、宿題があっても失敗しないことをテストで確認）。クラスを消すと そのクラス宛ての宿題も消える。
- 制約：クラス宛て（`class_id` あり・`user_ids` なし）か個人宛て（`user_ids` 1〜500人・null なし）のどちらか／`n` か `min` のどちらかは必須／`unit_id` と `n` は組／`n` 1〜200・`min` 1〜240／`start_date <= due_date` かつ 期間は最長 60日（両端をふくむ：`due_date - start_date <= 59`）／題 1〜100字・ひとこと 1〜200字／`unit_id` は `^[A-Za-z0-9][A-Za-z0-9._-]{0,39}$`。
- 索引：`(org_id, class_id, created_at desc)`・`(org_id, created_at desc)`・`(created_by, created_at desc)`・`gin(user_ids) where user_ids is not null`。
- RLS 有効・ポリシーなし・anon / authenticated に権限なし（既存の表とまったく同じ）。

### 公開の関数（すべて `SECURITY DEFINER`・`search_path = kotsu, extensions, public`）
どれも、中でトークンを確かめ、エラーは `{"error": "<コード>"}`（HTTP 200）で返す。PostgREST のエラー（引数の型がちがう など）は HTTP 400／404。

| 関数 | 引数（名前は契約どおり） | 返り |
|---|---|---|
| `hw_t_create` | `p_token, p_class, p_users, p_title, p_unit, p_n, p_min, p_start, p_due, p_note`（`p_token` 以外は default null。`p_start` が null なら今日） | `{ok:true, id}` |
| `hw_t_list` | `p_token, p_class default null, p_limit default 60`（1〜200） | `{ok, items:[{id,title,class_id,class_name,user_ids,unit_id,n,min,start_date,due_date,note,created_at,closed,total,done,partial,none,missed}]}`（新しい順） |
| `hw_t_detail` | `p_token, p_id` | `{ok, hw:{…list の項目と同じ…}, students:[{id,no,nick,login,count,correct,sec,pct,status,done_at}]}`（出席番号順） |
| `hw_t_grid` | `p_token, p_class, p_from default null, p_to default null, p_limit default 40`（1〜40） | `{ok, hws:[{id,title,start_date,due_date,unit_id,n,min}]（古い順）, students:[{id,no,nick,cells:{<hwId>:{pct,status}}}]}` |
| `hw_t_close` | `p_token, p_id, p_closed default true` | `{ok:true}` |
| `hw_t_delete` | `p_token, p_id` | `{ok:true}` |
| `hw_s_list` | `p_token` | `{ok, items:[{id,title,unit_id,n,min,start_date,due_date,note,created_at,closed}]}` |

### 内部の関数（`postgres` だけが実行できる。既存の `_org_json` などと同じ）
`_hw_progress(hw, st, p_now)`（進み具合 1組・基準の実装と同じ結果。`p_now` でテストできる）／`_hw_stats(ids, p_now)`（複数の宿題の進み具合を**まとめて**計算。一覧とマス目が使う）／`_hw_eval(hw, p_now)`（1件の宿題の対象の生徒と進み）／`_hw_can(t, hw)`（先生がその宿題を見られるか）／`_hw_mine(t)`（先生が担当するクラスの生徒）／`_hw_item(hw)`（宿題 1件の JSON）／`_hw_truthy(v)`・`_hw_secnum(v)`（log の ok・daily の sec の読みかた。JS と同じ）。

## 3. 権限の表

| 呼ぶ人 | `hw_t_*` | `hw_s_list` |
|---|---|---|
| 管理者（admin） | 自分の学校の、すべてのクラス・すべての宿題・すべての生徒。ほかの学校は `forbidden` | `role` |
| 先生（teacher） | `class_teachers` に入っているクラスの宿題（クラス宛て）、と、担当クラスの生徒が入っている個人宛て。担当外のクラス・ほかの学校は `forbidden`。個人宛てにほかのクラスの生徒がまざっていても、先生に見えるのは**自分のクラスの生徒だけ**（詳細・人数） | `role` |
| 生徒 | `role` | 自分の分だけ（いまの `class_students` のクラス宛て＋個人宛て） |
| でたらめ・短い・null・期限切れ・停止中（`users.active=false`）のトークン | `auth` | `auth` |
| 塾・学校が止まっている（`orgs.active=false`） | `org_off` | `org_off` |
| 運営（`sessions.kind='op'`）のトークン | `auth`（`_who` は `kind='user'` だけ） | `auth` |

`anon` / `authenticated` が直接できること：**関数を呼ぶだけ**（表は読めない・書けない。内部の関数は呼べない）。

エラーコード：`auth`・`role`・`org_off`（既存の `_who`・`_staff` と同じ）／`bad_args`・`not_found`・`forbidden`（契約）／`hw_limit`（1日 60件）・`full`（学校の宿題 20000件）・`not_deletable`（消せない）。
`forbidden` と `not_found`：存在するが権限がない（ほかの学校・担当外）→ `forbidden`。存在しない id → `not_found`。個人宛ての生徒は、存在しない id も `forbidden`（存在を教えない）。

## 4. 契約から変えた所・決めたこと（**契約に反映するなら、ここ**）

1. **`hw_t_delete`**：作ってから 24時間以内、**または** まだだれも取り組んでいないものだけ消せる。それ以外は `{error:"not_deletable"}`（画面は「締める」を案内）。「取り組み」＝ **n の宿題は、対象の生徒がその単元を期間中に 1問でも解いた／min の宿題は、期間中の学習時間が 1秒でもある**（n だけの宿題で、ほかの単元の学習時間は数えない）。（先生のページの模擬は「count>0 または sec>0」としていたが、n の宿題がほかの単元の学習で消せなくなるので、こう決めた。）自動で closed にはしない。
2. **エラー**：生徒のトークンで先生の関数、先生のトークンで `hw_s_list` は、`auth` でなく **`role`**（既存の `_staff`・`s_notes` と同じ。先生のページはもう `role` を「このアカウントでは使えません」と扱っている）。契約の「`auth`（または `forbidden`）」とは別のコード。
3. **期間**：最長 60日（両端をふくむ）。`p_start` は 今日の前後 365日以内。**先生のページの入力（期間は最長 1年）は、60日に直す必要がある**（超えると `bad_args`）。
4. **単元 ID**：`^[A-Za-z0-9][A-Za-z0-9._-]{0,39}$` の形だけ確かめる（データベースには単元の一覧がない）。**`unit_name` は返さない**（契約の `unit_name?`）。画面が自分の単元の一覧から出す。
5. **題が空**：自動で作る（「`<単元ID> N問`」「`<単元ID> N問・M分`」「`M分 学習`」）。単元の名前が無いので単元 ID が入る。先生のページは自分で題を作って送る。
6. **`hw_t_list`**：`missed` ＝ 期限をすぎて、まったく取り組まなかった人数（`none` に入れない）。`partial` は期限後も `partial`。**やめた（active=false）生徒は、対象に入れない**（`total`・マス目・詳細すべて）。個人宛ては `class_name` が null。
7. **`hw_t_detail`**：`hw` に、一覧と同じ人数（total・done・partial・none・missed）も入れた。
8. **`hw_t_grid`**：**締めた宿題は出さない**。開始日の新しい順に 40件（`p_limit`、最大 40）を取り、古い順で返す。個人宛ては、その生徒がクラスにいれば入る（`cells` は対象の生徒だけ）。クラスの生徒は、出席番号順（`no` なしは最後）。
9. **`hw_s_list`**：`closed` でなく `due_date >= 今日(JST) - 14日` のもの（**ちょうど 14日前は出る・15日前は出ない**）。期限の近い順（`due_date` 昇順）。最大 50件（超えたら、期限の遅いほうを残す）。進み具合・クラス・先生の情報は返さない。
10. **上限**：1人の先生が 24時間に出せるのは 60件（`hw_limit`。表の行を数える。既存の `t_note_send` と同じ方式で、`_rate_*` は使わない）。1つの学校の宿題は 20000件まで（`full`）。
11. **入力の検証**：`n` 1〜200・`min` 1〜240（はみ出しは切りつめず `bad_args`）・題 100字・ひとこと 200字（超えたら `bad_args`。前後の空白は取る）。制御文字（題は改行・タブも）は `bad_args`。個人宛ては 重複をまとめる・500人まで。クラス宛てと個人宛ての両方・どちらも無い → `bad_args`。アーカイブずみのクラスには出せない（`not_found`）。
12. **監査**：宿題を出す・消すと、`kotsu.audit` に `hw_create`・`hw_delete` を残す（管理者の「監査」画面に出る。題・クラス・人数だけ。生徒の名前は入れない）。

## 5. 既存のものとの関係

- **使うだけ**（定義は書きかえない）：`_staff`・`_who`（トークン）・`_can_class`・`_can_see`・`_err`・`_audit`、表 `orgs`・`users`・`classes`・`class_teachers`・`class_students`・`states`・`sessions`。
- **既存の関数・表は 1つも変わっていない**：hw.sql の前後で、既存の関数の定義・権限と、既存の表の列・制約・索引・権限が同じことを、テストで確認（`pg_get_functiondef` の md5 など）。
- **本名**：`users.name_enc` は一切読まない・出さない（テストで、どの返りにも本名が出ないことを確認）。出すのは `no`・`nick`・`login`（`login` は詳細だけ。マス目・一覧・生徒の画面には出さない）。
  - （参考：既存の `t_home`・`t_class` は、`name_enc`（暗号化された本名。先生の端末で復号する）を返している。宿題の関数は、これと関係なく動く。）
- **既存の `a_class_students` は、本番でも動かないはず**（本題ではないが、見つけたので）：本番の定義の `insert … select … from jsonb_array_elements(p_rows) r` の `r` が、plpgsql の変数 `r` とぶつかり、本番の `plpgsql.variable_conflict = error` のもとで `column reference "r" is ambiguous` になる。本番の定義をそのまま写した手もとでは、そのエラーになった（本番で呼ぶと書きこみになるので、本番では試していない）。クラスの生徒の入れかえに使う画面があるなら要確認。宿題の機能とは関係ない（テストでは、同じ動きを SQL で直接行った）。

## 6. 進み具合の計算（契約 3.）と、その確かめ

- `_hw_progress`（1組ずつ。詳細・消せるかの判定が使う）と `_hw_stats`（まとめて。一覧・マス目が使う）の 2つの実装がある。**どちらも、基準の実装 `progress.mjs` と同じ結果**：
  - 検算データ 10件（`vectors.json`）：全項目（count・correct・sec・pct・done・done_at・status・phase）が `expect` と一致。
  - **ランダム 2000件**（`make-vectors.mjs`。窓の端・ちょうどの時刻・小数・文字列の sec・壊れた state・配列でない log などをふくむ。種を固定）を、基準の実装に通して `expect` を作り、SQL と照合：全件一致。`_hw_stats` は、表の制約に合う約 1960件で一致。
  - 規模のデータ（200人・150件）で、一覧の人数・マス目の全マスが、詳細（`_hw_progress`）と一致。
- 日本時間は +9時間の固定なので、窓は整数のミリ秒で計算する（`start_ms`＝start_date 0:00 JST、`end_ms`＝due_date 23:59:59.999 JST）。`phase` は `p_now`（既定 `now()`）で決める。
- `pct` は `floor(pct*1000+0.5)/1000`（JS の `Math.round(pct*1000)/1000` と同じ）、`status` は丸める前の値で決める。
- JS との違い（実データでは起きない）：`log[].t` が**文字列**の解答は数えない（JS は数に直して比べる）。`daily[].sec` の文字列は、10進の数字だけ読む（`"0x10"`・`"1e3"` は 0）。

## 7. 本番のスキーマで分かったこと（読み取りだけで確認）

- PostgreSQL 17.6。拡張 pgcrypto は `extensions` スキーマ。**PostgREST は `anon`（公開キー）の役割で実行し、`anon` の `statement_timeout` は 3秒（`authenticated` は 8秒）**。`jit=off`・`work_mem` 約 2MB・`shared_buffers` 224MB（小さい構成）。
- すべての `kotsu` の表：RLS 有効・ポリシー 0・anon／authenticated に権限なし（`{postgres=arwdDxtm/postgres}`）。公開の関数：`SECURITY DEFINER`・`search_path=kotsu, extensions, public`・`{postgres=X/postgres,anon=X/postgres,authenticated=X/postgres}`。内部（`_`）の関数：`{postgres=X/postgres}`・security invoker。
- トークン：`kotsu.sessions(token_hash = sha256(token), user_id, kind 'user'|'op', expires_at)`。`_who` は `kind='user'`・未期限・`users.active`・`orgs.active` を確かめ、10分に 1回 `last_seen` と期限（先生 30日・生徒 180日）を延ばす。先生＝`role in ('admin','teacher')`。
- 先生が触れるクラス：`_can_class` ＝ 同じ学校のクラスで、管理者、または `class_teachers` に自分がいる。生徒の閲覧 `_can_see` ＝ 管理者は学校の生徒すべて／先生は 担当の（アーカイブされていない）クラスの生徒。
- エラーの返しかた：`_err(code)`（errcode P0001・message=code）で投げる流儀（`t_*`・`a_*`・`me`）と、`{error}` を返す流儀（`login`・`fb_send`）が混在。契約は `{error}` なので、宿題の関数は「中で `_err` を投げ、最後に受けて `{error}` で返す」。
- `kotsu.states`：`user_id pk`・`state jsonb`・`summary jsonb`・`rev`・`size`・`app_ver`・`updated_at`。92行・平均 31KB・最大 143KB。`state` のキー：`log`（配列。最大 400件。**12/92 人が 400件に達していて、400件が 2日ぶんだけの人もいる**）・`daily`（`{"YYYY-MM-DD": {n,c,xp,sec,lv}}`。いちばん多い人で 20日・いちばん古いキー 2026-10-23）ほか。`log[]` は `{t（ms の数）,u（単元ID。`J1-d1`・`E1-100`・`J2-g2c1u1` など）,L,ok（真偽）,h,d（秒）,k?,s?,g?}`。単元は 110 種。`states` に、`log`・`daily` 用の索引はない（主キーだけ）。
- 学校 1・先生 1・管理者 1・クラス 3・生徒 105（全員がちょうど 1つのクラスに入り、出席番号は重ならない）。

## 8. 危険点・気をつけること

1. **anon は 3秒で止まる**（上の 7.）。本番の機械は手もとより遅いかもしれない。手もとの計測（3. の表）は、最悪の「学年まるごと 200人 × 60件」でも 0.5秒前後。それでも、**一覧・マス目は「対象の生徒の state を全部読む」**ので、1回で読む量は `生徒数 × state の大きさ（最大 143KB）`。学校が大きくなったら（数百人のクラス）、まず `p_limit` を小さくする。
2. **進み具合は生徒の `log`（直近 400件）と `daily` から、その場で計算する**（契約の考えかた）。そのため：
   - **期限のあとに 400問以上解くと、期限内の記録が `log` から押し出されて、達成が「未達成」に戻って見える**ことがある。いま 400件に達している生徒が 12/92 人。**終わった宿題ほど、数字が劣化する。「これまでの取り組み」（マス目）は、古いほど信用できない**。
   - 対策の案（契約を変えるので、決めてほしい）：生徒の画面が、達成した瞬間に `state` に `hwDone: {<宿題id>: "YYYY-MM-DD"}` を書き（すでに `state_push` で同期される）、サーバーはそれを「達成ずみ（上書きしない）」として読む。DB 側は `_hw_stats`・`_hw_progress` に数行足すだけ。
   - `daily` も、古い日が消える（いちばん古いキーが 26日前）。min の宿題の期間が長いと、古い日の `sec` が 0 に見える。
3. **進み具合は、生徒の端末が送った `state` をそのまま使う**（`state_push` は中身を確かめない）。生徒が `state` を書きかえれば、達成を偽れる。この機能の範囲では防げない（成績ではなく励ましの機能、という前提）。
4. `daily` のキーは「端末の現地の日付」で、宿題の期間は日本時間（生徒の画面の引き継ぎ文書にも同じ注意）。日本時間でない端末では、深夜の数時間ぶん `sec` の日付がずれる。
5. **題・ひとことは、生のまま保存して返す**（HTML の無害化はしない）。先生のページも生徒の画面も、`textContent`（または React のテキスト）で出し、`innerHTML` に入れないこと。
6. **単元 ID は、データベースでは「形」しか確かめない**。存在しない単元 ID を直接送ると、達成できない宿題ができる（先生のページは単元の一覧から選ぶので、ふつうは起きない）。
7. 1日 60件の上限は、行数を数える方式（同時に何本も送ると、数件は超えうる）。
8. `hw_t_list` などの先生の関数は、`_staff` → `_who` が `sessions.last_seen` を更新することがある（10分に 1回）。既存の `t_home` などと同じ。
9. 管理者の「監査」に `hw_create`・`hw_delete` が出る。その画面が、知らない `action` の文字をそのまま出すかは確かめていない。
10. `apply_migration` を、`postgres` 以外で実行すると、関数の持ち主が変わり、`proacl` の見え方が変わる。入れたあとに `proowner` を確かめる。

## 9. 元にもどす

`rollback-hw.sql` の全文を `apply_migration`（または SQL エディタ）で流す。**宿題の行は消える**（先に `select * from kotsu.homework` で控える）。既存の関数・表には さわらない。

```sql
drop function if exists kotsu.hw_t_create(text, uuid, uuid[], text, text, integer, integer, date, date, text);
drop function if exists kotsu.hw_t_list(text, uuid, integer);
drop function if exists kotsu.hw_t_detail(text, uuid);
drop function if exists kotsu.hw_t_grid(text, uuid, date, date, integer);
drop function if exists kotsu.hw_t_close(text, uuid, boolean);
drop function if exists kotsu.hw_t_delete(text, uuid);
drop function if exists kotsu.hw_s_list(text);
drop function if exists kotsu._hw_stats(uuid[], timestamptz);
drop function if exists kotsu._hw_eval(kotsu.homework, timestamptz);
drop function if exists kotsu._hw_progress(kotsu.homework, jsonb, timestamptz);
drop function if exists kotsu._hw_can(kotsu.users, kotsu.homework);
drop function if exists kotsu._hw_mine(kotsu.users);
drop function if exists kotsu._hw_item(kotsu.homework);
drop function if exists kotsu._hw_truthy(jsonb);
drop function if exists kotsu._hw_secnum(jsonb);
drop table if exists kotsu.homework;
notify pgrst, 'reload schema';
```

## 10. テストの結果と計測

（run-tests.sh の最後の実行。詳しくは `work/test.log`・`work/results.tsv`）

**357 件すべて通過（失敗 0）**、元にもどす・やりなおし 6件も通過。約 20秒。

| グループ | 件 | 見ているもの |
|---|---|---|
| 準備・0.権限の形・0.既存の関数 | 22 | 公開 7つ・内部 8つの `proacl`／表の RLS・権限／anon・authenticated が内部の関数・表に触れない（`permission denied`）／**既存の関数 25件・既存の表 10つが hw.sql の前後で 1つも変わっていない**／足した関数がちょうど 15こ |
| 1.検算データ | 33 | **`vectors.json` の 10件が全項目 `expect` と一致**（SQL 直接 10＋実際の RPC（hw_t_detail・hw_t_grid）20）／**ランダム 2000件**（基準の `progress.mjs` で作った expect）が全件一致 |
| 2.権限（出す・トークン・見える範囲） | 107 | 先生は自分のクラスだけ／管理者は学校内／ほかの学校・担当外は `forbidden`／存在しない id は `not_found`／個人宛て（担当外・ほかの学校・生徒でない人・存在しない id）／生徒のトークンで先生の関数は `role`／先生のトークンで `hw_s_list` は `role`／でたらめ・短い・null・空・期限切れ・停止中は `auth`／塾の停止は `org_off`／一覧・詳細・マス目・締める・消すの見える範囲 |
| 3.集計・マス目・本名・state_push | 34 | 一覧の人数＝詳細／期限切れは `missed`／開始日より前・別の単元・やめた生徒を数えない／マス目（個人宛ては対象の人だけ・締めた宿題は出ない・p_from/p_to）／個人宛てに複数クラスの生徒がまざるとき先生には自分のクラスの生徒だけ／**どの返りにも本名（`name_enc`）が出ない**／実際の `state_push` で送った記録が反映される |
| 4.入力の検証・制約・上限 | 89 | `bad_args` 38通り／境界で通る 22通り（n 1・200、min 1・240、期間ちょうど 60日、題 100字、ひとこと 200字、日本語・絵文字・引用符 など）／自動の題／**DB の制約を直接 insert でも守る 16通り**／1日 60件（`hw_limit`）／学校 20000件（`full`） |
| 5.生徒の一覧・大量・締める | 23 | その生徒（クラス宛て＋個人宛て）の分だけ／**期限ちょうど 14日前は出る・15日前は出ない**／締めた・ほかのクラス・ほかの学校は出ない／項目は契約どおり（進み具合・クラスは無い）／120件あっても 50件まで／締める・再開 |
| 6.消す・7.クラスを移る・消える | 25 | 24時間以内は消せる／1日より後で取り組みがあれば `not_deletable`／取り組みが無ければ消せる／**クラスを移ると対象も移る（クラス宛て）・個人宛ては変わらない**／`a_class_delete`・`a_user_delete` が宿題があっても失敗しない（クラス宛ては消える・先生が消えても宿題は残る・生徒が消えると対象から外れる） |
| 8.冪等 | 6 | hw.sql をもう 1回流す（トランザクションなし）と、関数・表・制約・索引・権限の md5 も、宿題の行も、まったく同じ |
| 9.規模・9b.集合の計算 | 18 | 学校 S（生徒 200・state 平均 約 45KB・宿題 150件）：40人×40件のマス目の全マス、150件すべての一覧の人数が、詳細と同じ／anon の 3秒制限のまま止まらない／**集合で計算する `_hw_stats` が、検算データ＋ランダムのうち約 1960件で基準と一致、`_hw_progress` とも一致** |

**テストが本当に効いているかの確認**（`mutation-check.sh`）：hw.sql をわざと 1か所ずつ壊した 25通り（窓の端・達成日・正解数・やめた生徒・権限の確かめを外す・14日の境界・締めた宿題・消せる条件・上限・検証の境界・本名・anon の権限 など）のすべてで、テストが失敗した（1つは壊れていない変更だったので直して再確認）。


### 計測（手もと：PostgreSQL 16・jit off・work_mem 2MB。3回のうちいちばん速い値・ミリ秒）

| 呼び出し | ミリ秒 |
|---|---|
| `hw_t_grid`：1クラス 40人 × 宿題 40件（先生 ST／管理者） | 121／139 |
| `hw_t_list`：学校 200人。先生 ST の担当（SC1 を指定） | 113 |
| `hw_t_list`：学校 200人。管理者・学校全体・既定 60件 | 254 |
| `hw_t_list`：学校 200人。管理者・学校全体・`p_limit=200`（150件すべて） | 289 |
| `hw_t_list`：先生 ST の全体（担当 2クラス・既定 60件） | 189 |
| `hw_t_detail`：40人 | 16 |
| `hw_s_list`：生徒 1人 | 0.4 |
| `hw_t_create`・`hw_t_close` | 0.8・0.6 |
| ストレス：学年まるごと 1クラス（200人）の `hw_t_grid`（200人 × 40件）| 326 |
| ストレス：同じクラスの `hw_t_list`（200人 × 60件） | 423 |
| ストレス：`hw_t_detail`（200人） | 44 |

（修正前：`hw_t_list` は 60件で 3.3秒・150件で 10.6秒、`hw_t_grid` は 460ms だった。進み具合を 1組ずつ計算していたため。集合で計算する `_hw_stats` に直して、上の値になった。）

読みかた：本番の anon は 3秒で止まる。手もとの値の 3〜5倍までは余裕がある。`hw_t_list` は「その先生が見られる宿題を新しい順に p_limit 件」を毎回計算する（p_limit 既定 60）。画面は、最初に 60件、必要なら増やす、で十分。
