# みせびらき（起業ツール一式）

一人で事業を始める人のための、ブラウザだけで動くツール一式。
ホームページとそのエディター、動画エディター、集客窓口、SNS投稿プランナー、マネタイズ計画、見積書・請求書、カレンダー、リーンキャンバス、開業ロードマップを、ひとつの画面にまとめた。
ツールどうしはつながっている（ホームページの問い合わせ → 集客窓口 → 予約はカレンダー → 成約したら見積書）。

最初は、架空の教室「ひらめき数学舎」のサンプルで全部が動いている。ダッシュボードの「自分の事業で始める」で、自分の事業に切りかえる。

## 開き方

| どこで | どうする | 保存先 |
|---|---|---|
| 手元のパソコン・スマホ | `startup-kit-all-in-one.html` をダウンロードして、ダブルクリック（1ファイルで全部入り） | そのブラウザ（localStorage） |
| フォルダごと | `index.html` をブラウザで開く（ビルドもサーバーも要らない） | そのブラウザ |
| Claude の Artifact | `node tools/bundle.cjs --artifact` でできる `dist/artifact.html` を公開する | 持ち主のアカウント（端末をまたいで同じ内容） |

Artifact で開いたときだけ、AI の提案ボタン（文章案・返信の下書き・投稿案など）が出る。手元で開いたときは出ない。

> ブラウザに保存しているときは、ブラウザのデータを消すと消える。ダッシュボードの「バックアップを書き出す」で、ときどき JSON に書き出しておく（「バックアップから戻す」で戻せる）。

## ツール

| ツール | ファイル | できること |
|---|---|---|
| ダッシュボード | `js/apps/dashboard.js` | 今日・明日やること、今月の数字（売上・未入金・問い合わせ・投稿）、売上の推移、道具箱、バックアップ |
| ホームページ | `js/apps/site.js` | お客さんが見るページを、PC・スマホの幅で確かめる。公開用の HTML（1ファイル）を書き出す。QRコード |
| ホームページエディター | `js/apps/editor.js` | セクションの追加・並べかえ・文章・写真・テーマ・文字、見ながら直す。元に戻す／やり直す |
| 動画エディター | `js/apps/video.js` | 切る・つなぐ・テロップ・タイトル・BGM。縦（リール・ショート）／横／正方形で書き出す |
| 集客窓口 | `js/apps/inbox.js` | 問い合わせフォームの設定と送信先、受付箱（返信・商談・成約の管理）、取り込み、分析、チラシ用QR、返信テンプレート |
| SNS投稿プランナー | `js/apps/sns.js` | 下書き・予約・投稿済みの管理、SNSごとの文字数、投稿の型、投稿リズム |
| マネタイズ計画 | `js/apps/money.js` | 収入の柱を組み立てて12〜24か月を試算、損益分岐、時間の上限、目標から逆算、計画書の例 |
| 見積書・請求書 | `js/apps/invoice.js` | インボイス制度に合わせた見積書・請求書・領収書。PDF・画像で保存 |
| カレンダー | `js/apps/calendar.js` | 予定・予約枠・投稿日・入金期限をひとつに。祝日、Googleカレンダー用CSV |
| リーンキャンバス | `js/apps/canvas.js` | 事業の骨組みとペルソナを1枚に。画像で保存 |
| 開業ロードマップ | `js/apps/roadmap.js` | 兼業の確認・開業届・青色申告から、最初の売上、確定申告まで。いまの一歩をひとつだけ示す |

## 問い合わせを本当に受け取るには

ホームページのフォームは、集客窓口の「フォーム設定」で送信先を決めるまで、どこにも届かない（試し用）。

| 送信先 | 向いている人 | 準備 |
|---|---|---|
| メールで受け取る | まず手軽に | メールアドレスを入れるだけ。送る人のメールアプリが開く方式 |
| Googleスプレッドシートに貯める（おすすめ） | 無料で、取りこぼしなく | `gas/inquiry.gs` をスプレッドシートの Apps Script に貼って、ウェブアプリとして公開し、URLを入れる。届くたびにメールでも知らせる |
| フォームサービス（Formspree など） | すでに使っている | 送信先URLを入れる |
| Googleフォームへ案内 | Googleフォームで作りたい | フォームのURLを入れる |

届いた問い合わせは、集客窓口の「まとめて取り込む」で CSV から受付箱に入れられる。

## ホームページを公開するには

エディターで「公開用HTMLを書き出す」→ できた `index.html` を、次のどれかに置く（どれも無料から使える）。

- Netlify Drop（ドラッグするだけ）
- Cloudflare Pages（このリポジトリの `ikkan/` と同じやり方）
- GitHub Pages

画像は HTML の中に埋めこまれているので、ファイルは1つでよい。

## 構成

```
startup-kit/
├── index.html            … 本体（CSS とスクリプトを順に読むだけ）
├── css/kit.css           … 見た目の土台（色はすべて変数。ダーク表示も）
├── js/kit.js             … 共通の土台（保存・画面の切り替え・部品・書き出し・AI・グラフ・QR）
├── js/site-render.js     … ホームページの描画（プレビュー・エディター・書き出しで同じものを使う）
├── js/apps/*.js          … ツール（1ファイル1ツール）
├── js/start.js           … 起動
├── vendor/qrcode.js      … QRコード（MIT, Kazuhiko Arase。applied/vendor と同じもの）
├── gas/inquiry.gs        … 問い合わせを受け取る Google Apps Script
├── tools/bundle.cjs      … 1つの HTML にまとめる（all-in-one と Artifact 用）
├── tools/check.cjs       … 動作確認（Playwright で全ツールを開いて、エラー・はみ出しを調べ、画面を撮る）
└── startup-kit-all-in-one.html … まとめたもの（tools/bundle.cjs で作る。手で直さない）
```

### ツールを足す・直すときの約束

- 1ツール＝`js/apps/<id>.js` の `Kit.app({ id, title, group, icon, mount(root, params) })` ひとつ。`index.html` に `<script>` を1行足す。
- 保存は `Kit.store` だけを使う（手元では localStorage、Artifact では db に自動で切りかわる）。ひとつもの は `get/set`、ならぶもの は `list/put/remove`。
- サンプルは `Kit.store.sample(名前, 値)` で登録する。最初に書きかえた時点で保存される（開いただけでは書かない）。
- 色は `css/kit.css` の変数だけを使う（ダーク表示がそろう）。`alert` `confirm` `prompt` は使わない（Artifact では動かない）→ `Kit.toast` `Kit.confirm` `Kit.ask`。
- ファイルの保存は `Kit.download`。印刷ボタンには `local-only` を付ける（Artifact では印刷できない）。AI のボタンは `Kit.ai.button`（使えない画面では出ない）。
- 直したら `node tools/bundle.cjs` で all-in-one を作り直す。

## 動作確認

```bash
cd startup-kit
node tools/check.cjs                  # 全ツール × PC/スマホ × ライト/ダーク。エラーと横はみ出しを調べ、tools/_out/ に画面を保存
node tools/check.cjs --app inbox --fresh   # 1ツールだけ、初めて開いた状態で
node tools/bundle.cjs                 # all-in-one を作り直す
node tools/bundle.cjs --artifact      # Artifact 用（dist/artifact.html）
```

Claude Code なら `startup-kit` プレビュー（`.claude/launch.json` 登録済み）でも開ける。手動なら：

```bash
python3 -m http.server 8786 --directory startup-kit
```

## 注意

- 開業ロードマップ・見積書・マネタイズ計画の「計画書の例」に書いた手続きや税の話は、一般的な目安。期限や条件は変わることがあるので、税務署・自治体・勤め先の最新の案内で確かめる。公立学校の先生など公務員は、兼業に許可が要る場合がある。
- 「ひらめき数学舎」「数野 ひかる」など、サンプルに出てくる名前はすべて架空。
