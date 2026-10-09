# きょうだいメカバトル（ソース）

ジョイメカファイト風の対戦格闘ゲーム。ロボ8体、ひとり／2人／CPU／ネット対戦（ロールバック方式）。
公開用の1枚HTMLは `public/mecha-battle/index.html`（このフォルダのソースから `build.py` で生成したもの）。

## 構成

- `src/` … ゲーム本体（`build.py` が `ORDER` の順に連結して1枚のHTMLにする）
  - `core.js` `chars.js` `sim.js` `ai.js` … 決定的なシミュレーション（整数のみ・乱数は xorshift）
  - `art.js` `render.js` `stages.js` … ドット絵を手続き生成して描画
  - `audio.js` … WebAudio の効果音とBGM
  - `rollback.js` `net.js` … ロールバック通信とPeerJS（WebRTC）の部屋コード
  - `scenes.js` `main.js` `input.js` `page.html` … 画面・入力・起動
  - `vendor/` … PeerJS（MIT）
- `build.py` … ビルド
- `test/` … 動作確認（`mechanics` / `rollback-test` / `sim-test` はNodeだけで動く。`online*` `soak` `phone*` `audio` はPlaywright(Chromium)が必要）

## ビルド

日本語ドットフォント DotGothic16（SIL OFL）から、使う文字だけを切り出して埋め込みます。
フォント本体は大きいのでリポジトリには入れていません。Google Fonts 版の
`DotGothic16-Regular.ttf` と `OFL.txt` を `dist/` に置いてから実行してください。

```
pip install fonttools brotli
python3 build.py        # dist/site/index.html と dist/site/LICENSES.txt ができる
cp dist/site/index.html dist/site/LICENSES.txt ../../public/mecha-battle/
```

## テスト

```
cd test/node && npm install        # peer / peerjs（ローカルの部屋サーバ用）
cd ../.. && node test/mechanics.js && node test/rollback-test.js
node test/phone-lock.js                    # スマホで拡大・スライドしないか（要Playwright）
node test/jump-gauge.js                    # ジャンプの最高点がゲージにかからないか（要Playwright）
python3 build.py && node test/online.js   # ブラウザ2つでオンライン通し（要Playwright）
```

※ テストは `dist/standalone.html`（`build.py` が生成）を開きます。

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
