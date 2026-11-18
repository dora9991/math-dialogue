# 引き継ぎメモ：学習時間の数え方の改善（コツコツくん solo）

元のソース（`src/solo`）に入れ直す人向け。ビルド済みJSへのパッチ（`patch_time.py`）で動作確認ずみ。
このメモの「ソースの形」は、パッチと同じ動きになるように書き直したもの。minify後の名前は `（）` に書いた。

- 対象：公開中の `solo-uaZYllIo.js`（= `named/solo-new.js`）
- パッチ：`patch_time.py`（`python3 patch_time.py solo-new.js solo-time.js`。各 old が1回だけ出ることを assert）
- テスト：`run_all.sh`（Playwright。模擬の時計。結果は `test-results.txt`）
- 変えていないもの：`du`（解答の記録）・`xp`/バッジ・ご意見ばこ・`Vs()/wr()`・`fb_send`・`y0`（summary）・ほかの人の「がんばりまっしょい」のリンク（`e.jsx(Fs,{right:…})` の直後）

## 0. 数値のまとめ

| 項目 | 値 | 置き場所 |
|---|---|---|
| 1問を解く時間の上限 | 180秒（そのまま） | `Y4` |
| 読む時間の上限（正解のあと） | 20秒 | `ktRd` |
| 読む時間の上限（まちがい・わからない） | 90秒 | `ktRd` |
| 読む時間を足さない（直前の解答が） | 5分より前 | `ktRd` |
| 1回の sec の全体の上限 | 前の解答からの経過時間（`Z4()`） | `t5` |
| アクティブ時間：最後の操作から | 45秒以内（診断・模試・分析は150秒以内） | `ktStart` |
| アクティブ時間：数える間隔／flush | 1秒／30秒ごと・ルートを離れるとき・pagehide・visibilitychange(hidden) | `ktStart` |
| 1日の上限（授業 `les`） | 40分 = 2400秒 | `ktCap` |
| 〃（診断・模試・分析 `tst`） | 60分 = 3600秒 | `ktCap` |
| 〃（ホーム・一覧・マップ・記録・単元 `nav`） | 10分 = 600秒（全部で共有） | `ktCap` |
| 〃（ふりかえり `ref`） | 5分 = 300秒 | `ktCap` |
| 〃（ご意見ばこ `fb`） | 3分 = 180秒 | `ktCap` |
| 〃（全部あわせて） | 90分 = 5400秒（問題を解く時間は別） | `ktAll` |
| 〃（解説動画のページ `vid`） | 40分 = 2400秒（全部あわせての 90分に含まれる）。1つの動画は1日に長さの2倍まで | 動画ページ `kotsu-ganbari/credit.js` |
| 上限の保存 | localStorage `kotsu-time-credit-v1` = `{d:"YYYY-MM-DD", s:{les,tst,nav,ref,fb,vid: 秒}, at: 最後に数えた時刻(ms), v:{問番号:秒}}` | `ktGrant`（本体）／`credit.js`（動画ページ） |
| ひとことを出す期間 | 14日（既読）。未読は いつのでも出す | `ktNote` |

ルート → 種類：`lesson`・`exam`・`unit`で`talk`あり → `les` ／ `diag diagIntro diagResult mock ana anaIntro anaResult` → `tst` ／ `home plist hub map unit records sum print ai` → `nav` ／ `reflnote` → `ref` ／ `feedback` → `fb` ／ それ以外（`practice` `run` `settings` `onboard` `editProfile`）→ 数えない。

## 1. 新しいモジュール `kotsuTime`（パッチでは `const Y4=…` のブロックに入っている）

```ts
// ── 見えている時間の追跡（ページ全体で1つ）──
let hiddenTotal = 0, hiddenSince = document.hidden ? Date.now() : 0;
document.addEventListener('visibilitychange', () => {
  const now = Date.now();
  if (document.hidden) { if (!hiddenSince) hiddenSince = now; }
  else if (hiddenSince) { hiddenTotal += now - hiddenSince; hiddenSince = 0; }
});
const hiddenMs = (now = Date.now()) => hiddenTotal + (hiddenSince ? Math.max(0, now - hiddenSince) : 0);   // ktHid

// Yi()：見えているか。フォーカスは見ない（画面分割・別アプリ併用で数えない問題の対策）
export const isVisible = () => !document.hidden;                                                           // Yi

// ── 解答の時間 ──
let lastOwn: {t:number, ok:boolean, hid:number, epoch:number} | null = null;                              // ktLk
let routeEpoch = 0;                                                                                       // ktEp（ルートが変わるたびに +1）

// e5(now, correct)：最後の解答時刻（タブ共有）＋ 自分の最後の解答（正誤・見えていなかった時間・epoch）を記録
export function recordAnswerTime(now = Date.now(), correct?: boolean) {
  ownLast = Math.max(ownLast, now);
  try { if (now >= (Number(localStorage.getItem(LAST_KEY)) || 0)) localStorage.setItem(LAST_KEY, String(now)); } catch {}
  lastOwn = { t: now, ok: !!correct, hid: hiddenMs(now), epoch: routeEpoch };
}

// 問題が表示された時刻 shownAt に「読む時間」(ms) を決める（ktRd）
export function readingCredit(shownAt: number): number {
  const k = lastOwn;
  if (!k || k.epoch !== routeEpoch) return 0;            // ルートが変わったら足さない（単元えらび等は別の計測が数える＝二重にしない）
  if (lastAnswerAt() > k.t) return 0;                     // 別のタブがもっと後に解答した → 足さない
  const gap = shownAt - k.t;
  if (gap < 0 || gap > 5 * 60_000) return 0;              // 直前の解答が5分より前
  const visible = Math.max(0, gap - (hiddenMs(shownAt) - k.hid));   // 見えていた間だけ
  return Math.min(visible, k.ok ? 20_000 : 90_000);
}

// t5(shownAt, answeredAt, hiddenDuringSolve, prevAnswerAt, readingMs) → 秒
export function answerSeconds(shownAt, answeredAt, hiddenDuringSolve = 0, prevAnswerAt = 0, readingMs = 0) {
  let solve = Math.max(0, answeredAt - shownAt - Math.max(0, hiddenDuringSolve));
  if (prevAnswerAt > 0 && prevAnswerAt <= answeredAt) solve = Math.min(solve, answeredAt - prevAnswerAt);
  let total = Math.min(180_000, solve) + Math.max(0, readingMs);
  if (prevAnswerAt > 0 && prevAnswerAt <= answeredAt) total = Math.min(total, answeredAt - prevAnswerAt);   // ← 前の解答からの実際の経過時間をこえない
  return Math.round(total / 1000);
}
```

### 問題コンポーネント（`L0`）への入れ方

```tsx
const readRef = useRef(0);                      // ktR：この問題の「読む時間」(ms)
// 問題が表示されたとき（key が変わる effect の中。H.current = Date.now() の直後）
readRef.current = (mode === 'diag' || mode === 'mock') ? 0 : readingCredit(shownAtRef.current);
// 答えたとき（ye）
const sec = answerSeconds(shownAtRef.current, now, hiddenDuring, lastAnswerAt(), readRef.current);
recordAnswerTime(now, !!result.correct);        // わからない（gaveUp）は correct=false → 90秒上限
onAnswer({ correct, hinted, gaveUp, sec, choice });   // sec は読む時間をふくむ。du は変えない
// 見た目：問題の見出しの行（回数のチップの右）に、診断・模試以外で
<span className="chip kt-today" title="今日 学習した時間">⏱ 今日 {formatMinutes(todaySec)}</span>
```

- `du()` はそのまま：`sec` が `daily.sec` に足され、ログの `d`（= `Math.min(300, Math.round(sec))`）も同じ値になる。`lv` の「速すぎる挑戦レベルは数えない」判定（`d<3`）も `sec`（読む時間込み）で見る。
- 診断（`dp`）・分析（`xp`）・模試（`sp`）は、この `sec` を `daily` に足さない（今までどおり）。ここは下のルート計測が担当（二重に数えない）。
- **`Yi()` の変更**が、解く時間・`R.current`（非表示の間の開始時刻）の判定にも効く：`document.hasFocus()` を見ない。たくさんのタブで交互に解く不正は `Z4()` の「同じ時刻は1回だけ」で今までどおり防げる。

## 2. アプリ全体（`jp`）：問題以外の画面の「アクティブ時間」

```ts
// 数える条件：画面が見えている && 最後の操作（pointerdown/keydown/scroll/touchstart）から 45秒以内（診断・模試・分析は150秒）
//            && そのルートの種類に上限が残っている && 全体 5400秒に残りがある
//            && その時刻を、ほかのタブが まだ数えていない（credit.at より後）
// iframe（ホー先生の授業のプレイヤー）の中の操作は親に届かない：
//   ・プレイヤーからの postMessage {src:'ho-talk'|'ho-sho'|'hs-board', ev:'start'|'step'|'answer'|'result'} を「操作」とみなす
//   ・window の blur で document.activeElement が IFRAME（iframe の中をタップした）も「操作」とみなす
// 問題を解くルート（practice/run）は数えない（解答の sec が担当）。
// 他のタブが 190秒以内に解答していたら（Z4() > 自分の最後の解答 && Z4() > このページを読みこんだ時刻）、数えない（解答中の二重計上をふせぐ）。

export function startActiveTimer(getRoute: () => Route, addSeconds: (sec: number, final: boolean) => void): () => void { … }   // ktStart
export function grantActive(kind: Kind, from: number, to: number): number { … }                                              // ktGrant（localStorage に保存。複数タブ・再読みこみでも上限をこえない）
```

`App`（`jp`）での使い方：

```tsx
// effect（v2＝同期の visibilitychange を登録する effect より「先」に置く。hidden のとき flush → 同期が最新の sec を送る）
useEffect(() => startActiveTimer(() => routeRef.current, (sec, final) => {
  const s = stateRef.current; if (!s?.profile || !s.daily) return;
  const next = { ...s, daily: addDaily(s, { sec }) };       // us(s,{sec})
  setState(next);                                            // h(next)
  if (final) saveState(next);                                // cu(next)：pagehide では React の effect が間に合わないので、同期的に保存
}), []);

// render の中（switch(route.name) の直前）
if (prevRoute !== route) { prevRoute = route; routeEpoch++; }   // ktRt / ktEp
todaySecForQuestionChip = Math.round(state.daily[today()]?.sec || 0);   // ktTd
```

- flush の中身は `us(state,{sec})` だけ。`xp`・`n`・`totals` には触らない。
- 日付がかわったら（`credit.d` が今日でない）上限はリセット。
- `localStorage` が使えないとき（プライベート窓など）は、メモリの `ktMem` で、そのページの中だけ上限を守る。

## 3. 診断・模試の n・c（4）

- 診断 `pu(state, result)`：`daily: us(state, { xp: 100, n: result.summary.total, c: result.summary.correct })`
- 模試：`W5`（採点）の戻り値に `ans`（答えた数。「とばす」`gaveUp` は数えない）と `okN`（正解数）を足す → `X5`（`state.mock` に記録するところ）で `ans>0` のとき `daily: us(state, { n: res.ans, c: res.okN })`
- `totals`・`xp`・`units`・`log` は変えない。`sec` は足さない（ルート計測が担当）。
- 副作用（意図どおり）：`daily.n` が増えるので、「今日 ○問」・連続日数・今日の目標の「問題数」に診断・模試の分も入る。バッジ判定 `ds()` は呼んでいない（totals.n が変わらないため）。

## 4. 「⏱ 今日 ○分」（5）

```ts
const formatMinutes = (sec) => { sec = Math.max(0, Math.floor(sec||0)); if (sec < 60) return sec ? '1分未満' : '0分';
  const m = Math.floor(sec/60); return m < 60 ? `${m}分` : `${Math.floor(m/60)}時間${m%60}分`; };   // ktFm
```
- ホーム（`B2` = 小学生・中学生のホーム）：`hero-chips` の3つ目 `⏱ 今日 {formatMinutes(state.daily[today()]?.sec)}`（小学生は「今日」にふりがな）
- ホーム（`I2` = 高校生・既卒のホーム）：「今日の問題」の枠の下に小さく `⏱ 今日 …`
- 記録ページ（`R5`）：「学習時間（合計）」の下に `今日 …分`
- 問題画面（上のL0）
- summary（`y0` = `kA`）は変えていない：`ds[日付]`・`d28.sec`・`d7.sec` が `daily.sec` から出る。時間だけの日（`n=0`）は `ds` には出て `dd` には出ない（`dd` は `n>0` の日だけ）。

## 5. 先生からのひとこと（6）

- `ktNote(n)`：`now - n.at < 14日`
- 隠す＝「既読 かつ 14日より前」。出す＝「未読（いつのでも）」＋「14日以内」。
- ホームのカード（`s1`）：未読があれば「ひらく」（今までどおり）。ひらいたら、**ひらく前の未読を、そのまま（最大6件）見せる**（以前は「ひらく」→既読になった瞬間に、14日（7日）より前の未読はカードごと消えて、読めなかった）。未読がなければ 14日以内の最新の1件。既読の新しいものが他にもあれば「前のひとことも見る」（今までどおり records へ）。古い既読は `ふるいひとこと N こ ▸`（小さな下線のボタン）で、開けば全部見える。出す物が何もなければ、カードごと出さない。
- 記録ページ（`R2`）：未読（マウント時の未読は、既読にしたあとも出し続ける）＋14日以内を出し、古い既読は `ふるいひとこと N こ ▸`。
- **`Zl(...)`（既読にする処理）は そのまま**：`s1` は「ひらく」で `Zl(未読の id すべて)`、`R2` は 表示時（effect）に `Zl(未読の id)`。

## 6. マップ（7）

`O2`：小学生モード（`kid` = プロフィールが E1〜E6）で、行を `E` だけにしていた 2か所を「高校（H）以外」に：
- `g = kid ? GRADES.filter(v => v[0] !== 'H') : GRADES`（以前は `v[0] === 'E'`）
- 単元のシート `H2`：`このあとに学ぶ単元` の `!kid || f.grade[0] !== 'H'`（以前は `=== 'E'`）
- 元の仕様が「小学生には中学を見せない」意図なら、この2行はもどせば元のとおり（他と独立）。

## 7. 入れたあとの確認（`run_all.sh` と同じ場面）

1. 解答→15秒→次の問題で解答：sec = 解く＋読む（正解20上限・まちがい90上限・5分より前は足さない）／1回の sec ≦ 前の解答からの経過
2. 非表示は数えない／`hasFocus=false` でも数える／タブ2つで交互に解いても合計が実時間をこえない
3. plist 12分＋20秒おき操作 → 600秒／放置 → 45秒／ふりかえり300・ご意見ばこ180・授業2400・全体5400／再読みこみでも上限が二重にならない
4. 模試・診断：`daily` の `n`・`c`・`sec` が増える／`xp`・`totals`・`units`・`log` は変わらない
5. ホームに「⏱ 今日 ○分」・問題画面・記録ページ／`y0` の `ds`・`d28.sec`・`d7.sec` に反映
6. ひとこと：古い既読は出ない／「ふるいひとこと N こ ▸」／未読は ひらいたあとも残る／`s_note_read` が呼ばれる
7. 通常の解答の流れでエラーなし／ページを隠した直後の `state_push` に最新の sec が乗る

## 8. 気づいた危険

- **複数タブの state の上書き**（もともとある）：`state` は各タブのメモリ。最後に保存したタブが勝つ。タブを2つ同時に操作すると、時間も（解答と同じく）片方が失われることがある（取りすぎにはならない。`credit` は実時間をこえない）。
- **iframe の授業の「操作」**：プレイヤー（外部の `math-talk.pages.dev` / `ho-sansu.pages.dev` / `dora9991.github.io/.../hs-board`）が `postMessage` を送る形が変わったら、授業の時間が数えられなくなる（45秒で止まる）。プレイヤーが自動で進むなら、その間も数える（上限40分）。
- 練習・テストの**最後の解答のあと**（結果画面・解説を読む時間）は、次の問題が同じルートで出ないので、数えない（取りこぼし。最大でも20〜90秒/回）。
- 読む時間は「見えている間」だけ。見えているが何もしていない時間も、上限（20/90秒）までは数える。放置で稼げるのは、1解答あたり最大 20〜90秒（解答そのものが必要）。
- 診断・模試・分析の問題時間は、ルート計測（操作から150秒）で数える。画面を出したまま150秒ごとに触るだけでも、`tst` の60分まで数えられる（上限があるのでずるの旨みは小さい）。
- ログの `d` が読む時間をふくむ：先生の画面の「当てずっぽうかも」（`d<=3` の数）は、「解説を読んだあとすぐ答えた」ものを「速い」と見なさなくなる（読む時間ぶん `d` が大きくなる）。
- `daily` に `n=0` で `sec` だけの日ができる（ホームを見ただけの日）：連続日数・「学習した日」は `n>0` を見ているので変わらない。電子黒板の `ds`/`d28.sec` には出る。
