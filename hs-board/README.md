# 高校数学 黒板解説（hs-board）

入試レベルの問題を、黒板に1行ずつ書きながら解説するブラウザ教材。中学の「ホー先生とポンタ」（lesson-navi/video/talk）の高校版で、**キャラクターなし・声なし**。途中に「発問」（4択）と「考えてみよう」（ノートで解いてから答えを見る＋自己評価）が入る。

- 目次：`index.html`　再生：`play.html?s=<ID>`
- 手元で見る：プレビュー名 `hs-board`（`python3 -m http.server 8830 --directory hs-board`）。file:// で開いても動く。
- 数式は KaTeX（`vendor/katex` に同梱）。黒板の字は Google Fonts の Klee One（つながらないときは丸ゴシック）。

## いまある解説（熊大レベル・すべて自作問題）
| ID | 分野 | 内容 |
|---|---|---|
| ku-calc-01 | 数学Ⅱ 微分・積分 | 3次関数の接線・もう1つの共有点・1/12 公式の面積 |
| ku-seq-01 | 数学B 数列 | 漸化式 aₙ₊₁＝3aₙ−4n＋2 と Σk·aₖ（等差×等比） |
| ku-vec-01 | 数学C ベクトル | 三角形の中の交点・直線 AB との交点・大きさ |
| ku-prob-01 | 数学A 確率 | 同じ色の玉がふえる袋と条件付き確率 |

答えは python3（sympy）で検算ずみ。実際の入試問題は写していない（数値・設定とも自作）。

## 操作
Enter／クリック＝つぎへ（書いている途中なら先に書き終える）、←＝もどる、1〜4＝発問に答える、H＝ヒント、Q＝問題文、A＝自動送り（発問では止まる）。途中の場所と最高点はその端末に記録。

## 台本の書き方（scenes/<ID>.js）
```js
HB.lesson({ id, field, title, level, time,
  problem: { lead: '問題文（$…$ で数式）', parts: ['(1) …', '(2) …'], src: '※ …' },
  points: ['結果画面に出すポイント', …],
  cols: [0.56, 0.44],              // 左右の列の幅（ページごとに clear と一緒に変えられる）
  steps: [
    { part: '(1)', say: '下の字幕', add: [黒板に足す物…], draw: [{ fig: '図のid', items: [図の部品…] }] },
    { clear: true, cols: [1], … },   // 新しいページ
    { ask: { type: 'choice', q: '発問', opts: ['…', …], ok: 0, why: { 1: 'その誤答の理由', … }, good: '正解の説明', add: [答えたあと黒板に足す物] } },
    { ask: { type: 'think', q: '考えてみよう', hint: '…', ans: '答え', after: '補足', add: […] } },
    { end: true, say: '…' }           // 最後：成績カード
  ] });
```
- 黒板の物（add）：`{t:'h',text}` 見出し／`{t:'m',tex,note}` 数式の行／`{t:'p',text}` 文／`{t:'box',label,text|tex,c}` 枠／`{t:'ans',label,text|tex}` 答えの枠／`{t:'prob'}` 問題文／`{t:'tbl',rows}` 表／`{t:'fig',id,view:[x0,y0,x1,y1],w,h,items}` 図。共通：`col`（0 左・1 右）、`size`（sm・xs・lg）、`c`（y 黄・p 桃・b 青・g 緑）、`id`（`hl:['id']` で光らせる）。
- 字の中：`$…$` 数式、`{{…}}` 桃、`[[y:…]]` 黄、`**…**` 太字、`\n` 改行。数式の中は `\ans{}` `\hy{}` `\hb{}` `\hg{}` で色。
- 図の部品：`axes`（tx・ty で目もり）／`fn`（f:'x**3-6*x**2+9*x'）／`line`（m,n）／`area`（f,g,a,b でぬる）／`seg`・`vec`／`poly`／`pt`（name,dir）／`label`（vec:true で矢印つき）／`arc`。図の w:h は view の縦横比にそろえる。

## 検査（音なし・ヘッドレス Chrome）
```bash
node hs-board/tools/check.mjs                 # 全部
node hs-board/tools/check.mjs ku-vec-01 --shots <フォルダ>   # 1本＋各ステップの写真と1枚まとめ
```
数式エラー・黒板からのはみ出し・字幕にかくれる所・通しテスト（正解／まちがい）・もどる を調べる。✗ と ⚠ を全部なくしてから公開する。
