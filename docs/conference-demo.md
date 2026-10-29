# 研究大会サイトのデモ（`public/conference-demo/`）

研究大会の案内サイトの**サンプル**。サイトの一番上に「これはサンプルです。実際の研究大会とは関係ありません。」と出している。
団体名・日程・会場・参加費・過去の大会・開催地の歴史スポットは、**すべて架空**（実在の団体・大会の情報は入れていない）。

公開済み。次のURLで見られる。

```
https://dora9991.github.io/math-dialogue/conference-demo/
```

## 公開のしくみ（注意）

- 公開は `gh-pages` ブランチで行っている。このブランチには、`main` のビルド（`dist`）に**含まれないフォルダ**（`adlib`・`ikkan`・`hs-board`・`basket-coach`・`solo`・`taikai` など）が入っている。
- **`npm run deploy`（`gh-pages -d dist`）は、`gh-pages` の中身を `dist` で置き換えるため、これらのフォルダが消える。実行しないこと。**
- このデモは、`gh-pages` に `conference-demo/` を**足す**形で公開した（既存のフォルダ・ファイルは変更していない）。`public/` から来た他のツール（`basket-tap` など）と同じ置き方。
- `public/conference-demo/` を `main` に置いてあるのは、`main` と公開の中身をそろえておくため。

```
public/conference-demo/index.html        本文とCSS
public/conference-demo/data/archive.js   アーカイブ配信（YouTube）の一覧（いまは空）
public/conference-demo/js/archive.js     アーカイブの表示と動画プレーヤー
```

## 編集ツールで書き換える（お知らせ・大会概要・日程と流れ）

この3つは、編集ツール（`conference-editor/`）の画面で書き換えて「公開する」と、このデモに出る。

- 公開したものがあれば、それを表示する。**まだ公開していない項目や、読み込めなかったときは、`index.html` に書いてある元の内容**がそのまま表示される。
- 保存先の設定（Supabase の URL とキー）は、`conference-editor/config.js` に書く。デモも同じ設定を読む。
- 公開側から Supabase へは、公開キー（anon）で「公開済みの列」だけを読む。下書きは読めない。
- 編集の手順・守り（誰が書けるか）は `conference-editor/README.md`。

## 中身を変える（編集ツール以外）

- 本文は `index.html` を書き換える。決まっていない項目は `<span class="tbd">調整中</span>`。
- アーカイブ配信は、`data/archive.js` の `videos` に動画IDを足すと、一覧に並び、クリックで再生できる（日ごとの絞り込み・再生リストにも対応）。

## 検索に出さない

`<meta name="robots" content="noindex,nofollow">` を入れてある。検索に出したいときは、この1行を消す。

## やめるとき

`gh-pages` ブランチの `conference-demo/` フォルダを消す（`main` の `public/conference-demo/` も消す）。他のフォルダには触れない。

## 実在の大会のサイトにするとき

このデモを実在の大会に使い回さない。実在の団体名や日程を入れるなら、上部の「サンプル」バナーも外すことになり、**主催者の了承**が要る。
