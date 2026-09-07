# 家庭学習ノート（1年4章 比例と反比例 試作）

家でやった数学の自主学習を「見える化」するツール。ゲーム要素なし。
演習プリントのめあて（4章1〜8限目）に対応した問題を、数式キーボードで入力して解く。

## 画面

| ファイル | 役割 |
|---|---|
| `index.html` | 生徒用。プリント＋難易度を選ぶ → 1問ずつ演習（○×＋解説、間違えたら「もう一度」）→ **学習おわり／× で「今日は何分 勉強しましたか？」**（ボタン＋自由入力）→ 記録（可視化）。何度でもやり直せる。 |
| `analyze.html` | 先生／保護者用。PIN。生徒別／プリント別／**問題別（間違い情報）**／学習時間の推移。Excel 出力。 |

## 記録している4つ

1. **何問解いたか**（`solved` = 異なる問題数）
2. **難しい問題にチャレンジしたか**（`challenge_count` = level="応用" を解いた数、応用チャレンジ率）
3. **やり直しをしたか**（`redo_count` = ×のあと「もう一度」を押して2回以上取り組んだ問題数）
4. **何分やったか**（`reported_minutes` = 生徒の自己申告。`auto_seconds` = 画面を開いていた時間の自動計測を目安として併記。タブが隠れている間はカウントしない）

## 学習時間の聞き方

- 演習画面の「おわりにする」ボタン、またはヘッダーの「やめる／×」で、
  **「今日は、家で何分 勉強しましたか？」** 画面に入る。
- 5/10/15/20/25/30/40/45/60 分のボタン ＋ 数値入力。「だいたい ○分でした」と自動計測を目安表示。
- タブをそのまま閉じた場合は `navigator.sendBeacon` で自己申告なし（`self_reported=false`）のセッションだけ保存。

## データ

- `studydata.js` … 比例・反比例の問題プール（**61問**、8プリント × 基本/標準/応用）。
  出典：演習プリント／`pipeline/p_pr`／`applied/problems.js`（応用チャレンジ）／自作。全問が模範解答で自己採点OK。
- `engine.js` … 数式パーサ＋採点（`quiz` / `applied` と同一）。表記ゆれ（`1/2` と `0.5`、`y=3x` と `3x` 等）を吸収。

## Supabase（math-labo-second に相乗り、`study_` 接頭辞）

- `study_sessions` … 1回の家庭学習（生徒・プリント・レベル・日付・申告分・自動秒・解いた数・正解数・応用数・やり直し数）
- `study_items` … 1問ごとの記録（problem_id・レベル・解答・正誤・やり直しか・試行回・設問文）
- `study_settings` … 教師PIN（初期 `0000`）
- RPC：`study_submit`（生徒）/ `study_my_history`（生徒・PIN不要）/ `study_verify_pin` `study_get_sessions` `study_get_items` `study_set_pin`（教師）
- 既存の `quiz_*` / `applied_*` / `attempts` / `feedback` とは衝突しない。

## セットアップ

1. `config.js` … `quiz` / `applied` と同じ publishable キーで設定済み。
2. `schema.sql` … Supabase の SQL Editor に貼って Run。
3. 教師PIN変更：`select study_set_pin('0000', '新しいPIN');`

## ローカル確認

```
python3 -m http.server 8785 --directory home
```
→ `http://localhost:8785/`（生徒）／ `.../analyze.html`（先生）

## 公開（Cloudflare Pages）

`quiz` / `applied` と同じく静的サイト。`home/` をそのままデプロイ。

## 試作の割り切り

- 問題は 61 問（プロトタイプ）。`applied/problems.js` と一部重複しているので、将来は共通の問題バンクに寄せる想定。
- 名簿を持たないため「未提出の生徒」は出せない（一度でも学習した生徒だけ集計）。
- 図を見て答える問題（作図・グラフ描画）は入れていない（数式キーボード入力に特化）。
