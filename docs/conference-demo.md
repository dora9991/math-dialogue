# 研究大会サイトのデモ（`public/conference-demo/`）

研究大会の案内サイトの**サンプル**。サイトの一番上に「これはサンプルです。実際の研究大会とは関係ありません。」と出している。
団体名・日程・会場・参加費・過去の大会・開催地の歴史スポットは、**すべて架空**（実在の団体・大会の情報は入れていない）。

公開すると、次のURLで見られる（`npm run deploy` のあと）。

```
https://dora9991.github.io/math-dialogue/conference-demo/
```

```
public/conference-demo/index.html        本文とCSS
public/conference-demo/data/archive.js   アーカイブ配信（YouTube）の一覧（いまは空）
public/conference-demo/js/archive.js     アーカイブの表示と動画プレーヤー
```

## 中身を変える

- 本文は `index.html` を書き換える。決まっていない項目は `<span class="tbd">調整中</span>`。
- アーカイブ配信は、`data/archive.js` の `videos` に動画IDを足すと、一覧に並び、クリックで再生できる（日ごとの絞り込み・再生リストにも対応）。

## 検索に出さない

`<meta name="robots" content="noindex,nofollow">` を入れてある。検索に出したいときは、この1行を消す。

## やめるとき

`public/conference-demo/` を消して、もう一度 `npm run deploy` する。

## 実在の大会のサイトにするとき

このデモを実在の大会に使い回さない。実在の団体名や日程を入れるなら、上部の「サンプル」バナーも外すことになり、**主催者の了承**が要る。
