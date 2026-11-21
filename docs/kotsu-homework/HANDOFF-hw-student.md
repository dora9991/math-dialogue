# 引き継ぎメモ：先生からの宿題（コツコツくん solo の生徒の画面）

元のソース（`src/solo`）に入れ直す人向け。ビルド済み JS へのパッチ（`patch_hw.py`）で動作確認ずみ。契約は `hw/HW-CONTRACT.md`（3. 進み具合の式・4. `hw_s_list`・6. 生徒の画面）。

- 土台：`study/solo-H6dRn4gC.js`（学習時間のカード・時間の数え方・がんばりまっしょいのリンク込み。**書きかえていない**）
- パッチ：`patch_hw.py`（`python3 patch_hw.py <土台> solo-hw.js`。各 old が1回だけ出ることを assert）。入れる JS の本体は `hw_module.js`（読みやすい形・コメントつき）
- 出来上がり：`solo-hw.js`（**公開していない**）
- テスト：`t1`〜`t8`（Playwright。模擬の RPC `**/rpc/**`）、`hw_lib.cjs`（共通）、`shots.cjs`（画像）。結果は `test-results.txt`
- 「AIのおすすめ」のパッチ（`ai/patch_ai.py`）とは、置きかえる場所が重ならない。`solo-hw.js` の上に `patch_ai.py` を重ねても、`solo-ai.js` の上に `patch_hw.py` を重ねても通り、構文も通る（確認ずみ）

## 0. 置いた場所（minify 後の名前 → 意味）

| 場所 | 変えたこと |
|---|---|
| モジュール（`ktWk` の直後。`hw_module.js` をそのまま） | `ktHwPg`（進み具合）・`ktHwClean`・`ktHwSync`・`ktHwGet`・`ktHwAcct`・`ktHwCalc`・`ktHwWatch`・`ktHwRow`／`ktHwCard`（カード）・`ktHwChip`（チップ）。モジュール変数 `ktHwI`（宿題）・`ktHwP`（いまの state での進み具合。問題画面が読む）ほか。`window.__kkHw={progress:ktHwPg}`（テスト用の公開。消してよい） |
| `jp`（アプリ全体）の中、`ktTn=…;` の直後 | `ktHwP=ktHwCalc(s)`・`useState`（再描画の合図）・`useEffect`×3：①開いたとき（取りにいく＋`visibilitychange`＋アカウントの変化 `y2`）②`r.name==="home"` になったとき取りにいく③`[s.log,s.daily,宿題の一覧]` が変わるたびに `ktHwWatch(s,l,c)`（達成の判定・トースト） |
| `jp` の `default:` の B2／I2 の呼び出し | `onHw:L=>L&&se(L)?Se(L):w("plist")` を渡す（押したときの行き先） |
| ホーム `B2`（**小学〜中学（E/J）**） | 引数に `onHw:ktHwOn`。学習時間のカード（`kt-times`）の直後、`e.jsx(s1,…)` の前に `ktHwCard(s,ktHwOn)` |
| ホーム `I2`（**高校・既卒（H/R）**） | 同じ。ヒーローの直後、`e.jsx(s1,…)` の前 |
| 問題画面 `L0` | `kt-today` のチップの直後に `!h&&ktHwChip(s.unitId)` |

注意：依頼文では「B2＝中学以上・I2＝それ以外」とあったが、実際は **B2＝小学・中学（E/J）、I2＝高校・既卒（H/R）**（`t10_misc` と同じ。画像とテストで確認）。どちらにもカードを置いた。

`it`＝api の `r`（RPC）、`Vs()`＝アカウント `{token, server, org, user:{id,nick,role}, err}`、`y2(cb)`＝アカウント変化の購読（戻り値で解除）、`Se`＝単元を開く（中学以上は hub、それ以外は unit）、`se(id)`＝単元の存在確認、`l`＝トースト。

## 1. ソースの形（パッチと同じ動き）

```ts
// src/solo/homework.ts（新しいモジュール）
const CACHE_KEY = 'kotsu-hw-cache-v1';           // {at, server, user_id, items}
const SEEN_KEY  = 'kotsu-hw-done-seen-v1';       // ["<user_id>:<宿題id>", …] 最大300
type Hw = { id; title; unit_id: string|null; n: number|null; min: number|null; start_date; due_date; note };

// 進み具合：progress.mjs と同じ（日本時間）。vectors.json 全件＋乱数800件で一致を確認
export function progress(hw, state, nowMs): {count, correct, sec, pct, done, doneAt, status, phase}

// サーバーの items → 画面用（id・日付の形・n/min・「n だけで unit_id なし」・closed をはじく。title が空なら「単元名 N問・M分」）
function clean(items): Hw[]

// ログインの様子：生徒（user.role==='student'・token あり・err!=='auth'）だけ。who = "<user.id>@<server>"
// who が変わったら、キャッシュを読みなおす（user_id と server が同じものだけ使う）。ログアウト（アカウントが null）でキャッシュを消す
function sync(): boolean

// hw_s_list を取りにいく（force でなければ前回から60秒以上あけて。開いたとき・ホームに来たとき・visibilitychange(見えた)・アカウント変化）
//   成功（ok で items が配列）→ items を入れかえて、キャッシュに {at, server, user_id, items(最大50件・サーバーの生のまま)}
//   error が auth / org_off → 一覧とキャッシュを捨てる
//   それ以外（offline・404 PGRST202・http_5xx・形がおかしい応答）→ 何もしない＝前回のキャッシュのまま（静か）
export async function fetchHomework(force?: boolean)

// 画面に出す並び：取り組める未達成（期限が近い順）→ 達成ずみ → 期限がすぎた未達成（期限が新しい順）。due が14日より前のものは出さない
export function calc(state): { hw: Hw, p: Progress }[]    // state.log・state.daily・宿題・今日(JST)が同じなら同じ配列を返す（メモ）

// 達成の判定：state か宿題の一覧が変わるたび（useEffect）
//   前回の判定で「未達成」だったものが、いま「達成」→ トースト「🎉 宿題を達成しました！（題）」（複数同時なら「（A・B）」）
//   初めての判定で、もう達成ずみ → トーストなし（カードの「🎉 達成しました！」だけ）。どちらも SEEN_KEY に記録
//   ほかのトースト（バッジ・目標クリア）が出ているときは、2.3秒あとに出す（上書きしない）
export function watch(state, toast, currentToast)
```

UI：`HomeworkCard`（`.card.kt-hw`。見出し「📌 先生からの宿題」。1件＝`button.kt-hw-row`：題・期限・先生のひとこと（3行まで）・`.progress` のバー＋％・「あと○問 ・ あと○分」。達成は緑＋「🎉 達成しました！」。最大5件＋「ほかに ○件」）、`HomeworkChip`（問題画面。`📌 宿題 あと3問`／`あと12分`／両方なら `あと3問 ・ あと12分`）。色は既存のトークン（`--ok`・`--ok-soft`・`--ng`・`--sun-soft`・`--pri-ink`）。

### 表示の決めごと
- 期限：`あと○日`／`きょうまで`（日本時間の今日が due）／`期限がすぎました`（赤）／始まる前は `○月○日から`。達成ずみは期限を出さない
- 残り：N問は `あと(n−count)問`、分は `あと ceil((min×60−sec)/60) 分`。足りている条件は `✓ 10問`／`✓ 30分`（緑）。期限がすぎた未達成は `5/10問`（あと○は出さない）
- 押したとき：N問の宿題（`unit_id` あり）→ `Se(unit_id)`（その単元のページ。中学以上は hub）。分だけ → 学習一覧（`plist`）
- チップ：その単元（`s.unitId`）の N問の宿題（期間中・未達成）、または 分だけの宿題（どの単元でも）。複数あれば、並びの先頭（期限が近いもの）。期間前・期限後・達成ずみは出さない。診断・模試（`!h`）は出さない

## 2. 契約から変えた所・迷った所
1. **並び**：依頼は「未達成を期限が近い順、達成ずみは後ろ」。そのままだと、期限がすぎた未達成（due が一番古い）が先頭に来てしまうので、**期限がすぎた未達成は、達成ずみのさらに後ろ**にした（取り組めるものを上に）。
2. **最初から達成ずみ**のもの（開いた時点・あとから一覧に入ってきた時点）は、トーストを出さず、記録だけして、カードの「🎉」にした（アプリを開くたびにトーストが出るのを避ける）。依頼の「開いたとき1回だけ出してもよい」のほうは採らなかった。
3. **トーストの記録のキー**：契約は「宿題 id を記録」。同じ端末を別の生徒が使うことがあるので、`"<user_id>:<宿題id>"` にした（クラス宛ての宿題は、同じ id を全員が持つため）。
4. **ログアウトでキャッシュを消す**（依頼は auth エラーのときだけ。プライバシーのため追加）。ログインの期限切れ（`Vs().err==="auth"`）のときは、カードを隠して取りにいかない（キャッシュは残す。再ログインで使える）。
5. **クライアント側でも**、`closed`・14日より前に終わったものを出さない（サーバーが返さないはずだが、オフラインのキャッシュが古くなるため）。
6. **`hw_s_list` が無い**ときの扱い：`api` の `it()` は、PostgREST の 404 を `new A(message)`（`PGRST202` というコードではなく、本文の `message` か `http_404`）として投げる。コードで見分けず、`auth`／`org_off` 以外は全部「取れなかった」として静かに前回のキャッシュを使う。**ブラウザの開発者ツールには、404 の行（ネットワーク層）が出る**。アプリのエラーではない（`pageerror` なし・`console.error` はブラウザの「Failed to load resource」だけ）。
7. 診断・模試は `log` に入らないので、宿題の問題数には数えない（サーバーも同じ state から数えるので一致する）。

## 3. 確かめられなかったこと・危険
- **本物の `hw_s_list`**（DB は本番に未公開）。契約どおりの模擬（`{ok:true, items:[…]}`／`{error:"auth"}`）だけ。`unit_name` は、題が空のときの代わりの題にだけ使う。日付は `YYYY-MM-DD` の文字列を想定（`2026-11-20T…` のような時刻つきでも、先頭10文字を使う）。
- `daily` のキーは「端末の現地の日付」（`Mt()`）で、宿題の期間は日本時間。端末が日本時間でないと、深夜の数時間ぶん `sec` の日付がずれることがある（契約どおり。サーバー側も同じ式で、同じずれ方をする）。`n` の数え方は `log`（直近400件）なので、期間中に400問以上解くと古い分が落ちる（n は最大200）。
- `online` イベントでは取りにいかない（開いたまま電波が戻った場合は、次にホームに来るか画面にもどったとき）。
- 同じ端末の2つのタブ：どちらも自分のキャッシュ・トーストを持つ。`kotsu-hw-done-seen-v1` は共有なので、先に見たほうだけがトーストを出す。
- 画面の再描画：宿題があると `jp` の描画のたびに `ktHwCalc`（メモあり。log・daily・一覧が同じなら再計算しない）。400件の `log` で数件の宿題を数える程度で、重くはない。
- 実機（iPhone Safari）では見ていない。`-webkit-line-clamp`（先生のひとこと）と `var(--…)` を使っている。

## 3b. テスト結果（`test-results.txt`）
- 宿題のテスト `t1`〜`t8`：**208 PASS / 0 FAIL**（`run_all.sh`。vectors.json 10件＋乱数800件が基準 `progress.mjs` と完全一致、時間帯 LA・オークランド・UTC でも同じ）
- 既存テスト（`time/` の t1〜t10・`t_unit_grant`・`study/test.cjs`）：パッチ後 133 PASS / 7 FAIL、土台 133 PASS / 7 FAIL。失敗7件は土台でも同じ（学習時間のパッチでヒーローの「⏱ 今日」チップを外したため古い期待が合わない）。**パッチによる回帰なし**

## 4. 変えていないもの
解答の記録 `du`・経験値・バッジ・同期（`state_push`／`state_pull`）・ご意見ばこ（`fb_send`）・時間の数え方（`ktStart` ほか）・動画へのリンク・学習時間のカード・`In(s…)`（AIのおすすめ）。**`mathlab-solo-v1`（state）には何も書き足していない**（宿題のデータは、`kotsu-hw-cache-v1`・`kotsu-hw-done-seen-v1` だけ。`t3_flow` で state のキーが変わらないことを確認）。
