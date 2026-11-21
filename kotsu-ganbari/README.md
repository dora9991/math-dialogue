# がんばりまっしょいプリント 解説動画（コツコツくん）

期末テスト対策プリント（問1〜42）の、音声なしの解説動画。図が1手ずつかかれ、字幕と式が出る。
公開先：`https://dora9991.github.io/math-dialogue/solo/ganbari/`（gh-pages の `solo/ganbari/`）。

## ファイル
| | |
|---|---|
| `index.html` `app.js` `style.css` | 一覧と、動画の画面（`#9` で問9を開く） |
| `player.js` | 再生エンジン（SVG で図を描く・字幕・式のボード） |
| `dsl.js` `geo.js` | 場面を書くための部品・計算の道具 |
| `q/qNN.js` | 問NNの場面（1問1ファイル）。書き方は `AUTHORING.md` |
| `manifest.json` | 一覧用（`node tools/build.mjs` が `q/` から作る） |
| `tools/check.mjs` | 場面の検査（形・点の参照・座標・長さ） |
| `tools/shots.mjs` | 各コマの画像を作る（`node tools/shots.mjs 9 27 --out 出力先`） |
| `tools/flow-test.mjs` | 一覧→動画→最後まで再生→つぎ、の通し確認 |
| `tools/deploy.mjs` | 公開用のコピー（`node tools/deploy.mjs <gh-pages の solo/ganbari>`） |

## 直すとき
1. `q/qNN.js` を直す → `node tools/check.mjs NN` → `node tools/shots.mjs NN --out /tmp/x` で画像を見る。
2. `node tools/flow-test.mjs /tmp/x` で通し確認。
3. `node tools/deploy.mjs <gh-pages>/solo/ganbari` でコピーして、gh-pages に push（公開は先生の確認のあとで）。

## 答えの確かめ
全42問の答えは、動画を作った人とは別に、写真だけから独立に解き直して照合ずみ（全問一致）。
解釈が分かれる所：問6（回転の中心：点Oか、どこでもよいか。動画は両方を出す）、問23(2)（六角柱／正六角柱）、問39(2)（囲まれた部分＝三角形の外側の帯）、問18（まっすぐ立った三角柱）。

## 11/30 までのホームのリンク
ホーム最上部のリンクは、公開中のアプリ（ビルド済み JS）への文字列の置きかえで入れている（本体のソースは別）。
`docs/kotsu-ganbari/` の引き継ぎメモを参照。11/30（日本時間）をすぎると出なくなる。
