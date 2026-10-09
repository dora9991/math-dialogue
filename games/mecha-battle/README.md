# きょうだいメカバトル（ソース）

ジョイメカファイト風の対戦格闘ゲーム。ロボ16体（最初の8体＋あとから足した8体）、ひとり／2人／CPU／ネット対戦（ロールバック方式）。
公開用の1枚HTMLは `public/mecha-battle/index.html`（このフォルダのソースから `build.py` で生成したもの）。

## 構成

- `src/` … ゲーム本体（`build.py` が `ORDER` の順に連結して1枚のHTMLにする）
  - `core.js` `chars.js` `chars2.js` `sim.js` `ai.js` … 決定的なシミュレーション（整数のみ・乱数は xorshift）。`chars.js`=最初の8体、`chars2.js`=あとから足した8体
  - `art.js` `art2.js` `render.js` `render2.js` `stages.js` `stages2.js` … ドット絵を手続き生成して描画（`*2.js` が、あとから足した8体ぶん）
  - `audio.js` … WebAudio の効果音とBGM
  - `rollback.js` `net.js` … ロールバック通信とPeerJS（WebRTC）の部屋コード
  - `scenes.js` `main.js` `input.js` `page.html` … 画面・入力・起動
  - `vendor/` … PeerJS（MIT）
- `build.py` … ビルド
- `test/` … 動作確認（`mechanics` / `rollback-test` / `sim-test` / `data` / `balance` / `analyze` はNodeだけで動く。`online*` `soak` `phone*` `audio` `jump-gauge` はPlaywright(Chromium)が必要）

## ビルド

日本語ドットフォント DotGothic16（SIL OFL）から、使う文字だけを切り出して埋め込みます。
フォント本体は大きいのでリポジトリには入れていません。Google Fonts 版の
`DotGothic16-Regular.ttf` と `OFL.txt` を `dist/` に置いてから実行してください。

**元のTTFが無いとき**は、公開中の `public/mecha-battle/index.html` に埋め込まれている切り出し済みフォントを使い回します
（全ひらがな・カタカナと、これまでに使った漢字だけが入っています）。使う文字がそこに無いと、足りない文字を挙げてビルドが止まります。
新しい文字・せつめい文は、ひらがな・カタカナで書けばそのまま通ります（`▲▼` などの記号もフォントに無いので、図形で描くこと）。

```
pip install fonttools brotli
python3 build.py        # dist/site/index.html と dist/site/LICENSES.txt ができる
cp dist/site/index.html dist/site/LICENSES.txt ../../public/mecha-battle/
```

## テスト

```
cd test/node && npm install        # peer / peerjs（ローカルの部屋サーバ用）
cd ../.. && node test/mechanics.js && node test/rollback-test.js && node test/data.js
node test/balance.js [試合数=8] [CPUレベル=2]   # 全員vs全員をCPU同士で戦わせた勝率（目安。人間とCPUでは動きがちがう）
node test/analyze.js poporo [試合数]            # 1体について、技ごとの 出した/当たった/ダメージ を数える
node test/phone-lock.js                    # スマホで拡大・スライドしないか（要Playwright）
node test/jump-gauge.js                    # ジャンプの最高点がゲージにかからないか（要Playwright）
python3 build.py && node test/online.js   # ブラウザ2つでオンライン通し（要Playwright）
```

※ テストは `dist/standalone.html`（`build.py` が生成）を開きます。

## キャラを足すとき

`chars2.js`（データ）→ `art2.js`（ドット絵4パーツ）→ `render2.js`（構え・飛び道具・演出）→ `stages2.js`（ステージ）の順に書き、
`scenes.js` の選択画面セルの色（`stCol`）にステージの色を足します。足りないものは `node test/data.js` が教えてくれます。
あとから足した8体で増えた仕組み：飛び道具の `ax`（加速／ブレーキ→もどってくる）、フェーズの `turn`（相手のほうへ向きなおる）、
フェーズの `heal`（HP回復・1ラウンド2回まで）、技の演出を登録表（`FX_DRAW` / `PROJ_DRAW` / `FXL_DRAW`）から探す仕組み。

## 遊び方（ネット対戦）

1. 片方が「ネットたいせん → へやをつくる」で4文字のコードを作る
2. もう片方が同じコードを入れる（または招待リンクを開く）
3. 同じ画面でキャラを選んで対戦。通信が遅れたら自動で巻き戻して合わせる

## 調整できる数値

- **ジャンプ**（`src/chars.js` の各キャラの `jump: { h, t, d }`）
  - `h` … いちばん高いところ（px）。体力ゲージ（上の黒い帯）に頭がかからない高さにそろえてあります
  - `t` … 地面を離れてから着地するまでのフレーム数（60で1秒）。**小さいほど「さっと」、大きいほど「ふんわり」**（いまは 26〜64）
  - `d` … 前にジャンプしたとき、横に進む距離（px）
  - ここから、整数の初速と重力を自動で作ります（高さの誤差は1px以内、滞空は `t` どおり）。`h` を変えたら `node test/jump-gauge.js`（要Playwright）で、ゲージにかからないか・低すぎないかを確かめられます
  - 技の中のジャンプ（ライジングパンチなど）と、吹っ飛びの重力は、ジャンプとは別（`stats.grav`）です
- 対戦の動き（物理・技の数値など）を変えたら、`src/net.js` の `NET_PROTOCOL` を +1 してください。ちがうバージョンのページどうしは、つないだ直後にはじかれます（ずれたまま遊ばないように）
