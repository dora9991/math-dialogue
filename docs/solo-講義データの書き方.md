# 数学ラボ ソロ — 講義（ホー先生の解説）の書き方

単元ごとの解説は `src/solo/lectures/` に **1単元＝1ファイル** で置く。
書いたら `src/solo/lectures/index.js` に import を1行足すだけで、その単元の「講義」タブに出る。
解説がまだ無い単元は、要点（`points`）＋例題が代わりに出る。

見本：`E5-bunsu.js`（小5 分数のたし算）／`J1-u2.js`（中1 正負の数のたし算）／`HI-niji.js`（高1 平方完成）

## ファイルの形

```js
// 中1「正の数・負の数の加法」— ホー先生の解説
export default {
  unitId: "J1-u2",          // 単元ID（マップの単元と同じ。下の「単元IDの調べ方」）
  title: "正の数・負の数のたし算",
  minutes: 6,               // だいたいの所要時間（ボタンに出る）
  slides: [
    { say: "先生のことば", board: ["黒板の1行目", "2行目"] },
    { check: { q: "問い", choices: ["A", "B", "C"], ans: "B", ok: "正解のときの言葉", ng: "まちがえたときの言葉" } },
    { point: "大事なポイント（黄色い枠）" },
    { example: { q: "例題", steps: ["1行目", "2行目"], ans: "答え" } },
    { yt: "YouTube動画ID" },
  ],
};
```

1枚のスライドに `say` `board` `point` `example` `check` `yt` を **いくつ組み合わせてもよい**（上から順に表示）。

| キー | 表示 |
|---|---|
| `say` | 先生（🦉 ホー先生）の吹き出し |
| `board` | 黒板（緑の板に白い字）。配列の1要素＝1行 |
| `point` | 黄色い「ポイント」枠 |
| `example` | 例題。「解き方を見る」をタップするたびに `steps` が1行ずつ出て、最後に `ans` |
| `check` | 理解チェック（3択くらい）。選ぶと正誤と `ok` / `ng` の言葉が出る |
| `yt` | YouTube の埋め込み（動画IDだけ書く） |

数式は問題データと同じく `$...$`（KaTeX）。JS の文字列ではバックスラッシュを2つ（`"$\\frac{1}{2}$"`）。

## 解説動画（ホー先生）を単元に紐づける

動画は `src/solo/lectures/videos.js` に、単元IDと YouTube の動画IDで登録する。登録した単元の「講義」タブに「ホー先生の解説動画」が出る（スライドの解説がある単元でも出る）。

```js
export const VIDEOS = {
  "J1-u2": [{ title: "正の数・負の数のたし算", yt: "YouTubeの動画ID" }],
};
```

## 会話授業（ホー先生とポンタ）を単元に紐づける

中学校の単元（`J1-…` `J2-…` `J3-…`）の「講義」タブに、**ホー先生とポンタの会話授業**（黒板の前で掛け合い、4択に答えながら進む授業）へのリンクが出る。授業は公開サイト（math-talk）にあり、ここでは「どの単元に、どの授業を出すか」だけ決める。授業は新しいタブで開く。

- `src/solo/lectures/talk.js` … `UNIT_LESSONS`（単元ID → 授業IDの並び）。授業を足す・動かすときはここを直す。同じ授業を複数の単元に書いてもよい。
- `src/solo/lectures/talk-data.js` … 授業のIDと題名の一覧（**自動生成**。`python3 scripts/solo-talk-data.py <math-dialogue のルート> src/solo/lectures/talk-data.js`）。元は `hyojun-navi/data/plan1.js`（中1）と `talk-g2/`・`talk-g3/` の `problems/unit-lessons-g*.json`。
- 単元に書かなかった同じ章の授業は、「同じ章のほかの授業」にまとめて出る。章の応用問題10本・入試レベル3本は「応用問題・入試レベル」に出る（中1の6章 空間図形には無い）。
- **公開していない学年は何も出ない**。`talk.js` の `PUBLISHED` を、公開できた学年から `true` にする（中3は、公開サイトを作ったら `TALK_SITE.J3` のアドレスを確かめて `true` に）。
- 授業を開くアドレスは `{サイト}play.html?l={授業ID}`（`talkUrl()`）。
- 登録後は `node scripts/solo-verify.mjs` で確認（単元ID・授業IDが実在するか、中学の全単元に授業を割り当てているか）。

## 解説づくりの方針（対話授業と同じ考え方）

1. **核心はすぐ言わない**：まず `check` で予想させる（まちがえてOK）
2. **具体 → 一般**：ピザ・数直線・平行移動など、目に見えるものから入って、最後にルールを `point` でまとめる
3. **よくあるまちがいを、先に一緒に踏む**：`check` の誤答に典型ミスを入れ、`ng` でやさしく理由を言う
4. **例題は1行ずつ**：`steps` は途中式を省略しない
5. **最後のスライドで要点をまとめて「演習へ」** につなぐ（ボタンは自動で出る）

## 単元IDの調べ方

```bash
node -e "import('./src/solo/content/elem/e5.js').then(m=>m.UNITS.forEach(u=>console.log(u.id,u.name)))"
```

中学は `J学年-元の単元ID`（例 `J1-u2` `J2-g2c3u1` `J3-g3c1u4`）、小学校は `E学年-…`、高校は `HI-` `HA-` `HII-` `HB-` `HC-` `HIII-`。
アプリのマップで単元をタップして「この単元を学ぶ」を開いたときの URL ではなく、データの `id` を使う。

## 検査

```bash
node scripts/solo-verify.mjs      # 問題データと一緒に講義もすべて検査（数式・正解の入れ忘れ）
```

## 先生の名前・アイコン

`src/solo/lectures/index.js` の `TEACHER = { name: "ホー先生", icon: "🦉" }` を変えると、アプリ全体の先生が変わる。
