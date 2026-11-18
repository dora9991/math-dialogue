# コンテンツ一覧ブラウザ（contents）

つくった道具（このリポジトリのアプリ・教材）を、**探す・開く・配る**ための一覧ページ。
ことばで探す／分類・だれが使う・配りかたで絞る。カードごとに「開く」「1ファイル版」「ソース」と、開き方の説明が出る。

- ブラウザだけで動く（外部ライブラリなし・通信なし）。`file://` で `index.html` を開いても動く
- 絞りこみは URL の `#` に残る（例：`#cat=basket` ／ `#q=印刷&who=teacher`）。そのまま共有できる
- スマホ・ダークモード対応

## 開き方

| どこで | どうする |
|---|---|
| 手元 | `contents-all-in-one.html` をダブルクリック（1ファイルで全部入り）。フォルダごとあるなら `index.html` |
| サーバーつき | `python3 -m http.server 8795 --directory contents` → http://127.0.0.1:8795/ |
| 公開 | https://dora9991.github.io/math-dialogue/contents/ （下の「公開」をしたあと） |

## 道具を足す・直す

`data/items.js` に **1ブロック足す**だけ（書き方は、そのファイルの先頭に書いてある）。

```bash
node contents/tools/check.cjs     # 書き方・リンク先・載せ忘れの検査（まちがいがあれば終了コード 1）
node contents/tools/bundle.cjs    # 1ファイル版（contents-all-in-one.html）を作り直す。できたファイルは手で直さない
```

`check.cjs` が調べること：必須の項目と書きまちがい／`dir`・`file` が実在するか／`live` の先があるか／
**限定配布・自分用に `live`・`file` が書かれていないか**／リポジトリ直下に**一覧にないアプリのフォルダ**がないか（載せ忘れ）。

## 公開

```bash
node contents/tools/publish-pages.cjs --dry   # gh-pages の作業用コピーにコミットするところまで（push しない）
node contents/tools/publish-pages.cjs         # gh-pages の contents/index.html だけを足して push
```

ほかの公開物には触らない（`basket-coach` / `seitoshido-navi` と同じ流儀）。
`npm run deploy` は gh-pages を丸ごと入れかえて、main にない公開物を消すので、使わない。
検査でまちがいがあるときは、公開しない。

## 一覧の考え方

- **分類**は、道具の性質で束ねた5つ：生徒の学びを作る／先生の負担を減らす／体験・あそび／バスケ／暮らしと創作
- **状態**：使える形（READMEに使い方まで書いてある）／育成中（作者の読み直しや授業での試用がこれから）／例・サンプル（直して使う）／旧版（あとの版に発展した）。READMEの書きぶりから付けたので、実感と違えば `data/items.js` の `status` を直す
- **配りかた**：
  - **公開**＝ウェブ公開、または1ファイル版の配布。「開く」は、gh-pages ブランチに実際に入っているものだけ
  - **限定配布**＝生徒にQRなどで配る道具（応用チャレンジ・家庭学習ノート・授業ライブ・小テスト・感想ひろば）。**公開URLは載せない**（URLを広げない運用のため）。ソースへのリンクだけ
  - **自分用**＝ひびの手帳。公開URLなし

## 載せていないもの

- **未マージのPRの作品**（taikai・gym-booking・xserver-hub・basket-navi など）：main に入ったら足す
- **`public/lesson-demo.html`**（動画学習モードの19chデモ）：「許可確認用」の、ほかの方のコンテンツを使ったデモなので、一覧には載せていない
- **gh-pages にあるが main にソースがないもの**（`solo`・`solo-lab`・`shidoan-maker`・`taikai`・`chienkan-fc-…`）：足すときは、ソースのあるブランチを確かめてから

## ファイル構成

```
contents/
├── index.html / css/contents.css / js/app.js   画面（データを読んでカードを並べる）
├── data/items.js                               ★一覧のデータ（ここだけ足せばよい）
├── tools/check.cjs                             データの検査
├── tools/bundle.cjs                            1ファイル版を作る
├── tools/publish-pages.cjs                     gh-pages に公開（contents/ だけ足す）
└── contents-all-in-one.html                    できあがりの1ファイル版
```
