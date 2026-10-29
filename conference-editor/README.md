# 大会サイト編集ツール（conference-editor）

研究大会などのサイトで、**お知らせ・大会概要・プログラム**を、項目を入力する形で編集して「公開する」ためのツール。
自分でサーバーを持たない（静的HTML＋Supabase）。ビルド不要。

| 項目 | 中身 |
|---|---|
| お知らせ | 日付・本文・リンク（任意） |
| 大会概要 | 「項目名／内容」の行（会場・開催日程・主催 など） |
| プログラム | 日ごとの見出し・ひとこと・「時刻／内容」の項目 |

- 下書きと公開を分けてある。「下書きを保存」では公開側は変わらず、「公開する」を押したときだけ反映される。
- 本文に **`【調整中】`** と書くと、公開側では「調整中」の札になる。
- 公開側は、まだ一度も公開していない項目や、読み込みに失敗したときは、**元のHTMLをそのまま表示**する（サイトは止まらない）。

## 画面の見かた（どこを編集しているか、分かるように）

- **左：サイトの見取り図。** ページの上から順に、編集できる場所（お知らせ・大会概要・日程と流れ）が並ぶ。いま編集している場所は濃い色になり、「編集中」の札が付く。編集しない部分（ページの上・そのほか）は、薄い点線で出る。押すと、その場所に切り替わる。
- **中：入力欄。** 一番上に「いま編集しているところ」（サイトのどの部分か）が出る。各入力欄には、「サイトでは、ここに出ます」の説明と、書き方の例がある。触ったカードは「編集中」になる。
- **右：サイトでの見え方。** いまの下書きが、サイトと同じ見た目で出る。**入力欄を触ると、該当する行が黄色く光る。** プレビューの行を押すと、その入力欄に移る。書き終えていない行は、点線の薄い行で出る（公開すると、サイトには出ない）。
- 狭い画面（携帯）では、上から「見取り図 → 入力欄 → 見え方」の順に、縦に並ぶ。
- `config.js` に `SITE_URL`（サイトのURL）を書くと、「サイトのこの部分を開く」のリンクが出る。サイト側のセクションIDは、`SITE_ANCHORS` で変えられる（初期値は `news` / `overview` / `schedule`）。

## 保存先は2通り（`config.js` の `BACKEND`）

| BACKEND | 保存先 | 使う場面 |
|---|---|---|
| `"local"` | このブラウザの中 | 自分ひとりで使う／試す。ログイン不要。他の端末とは共有されない |
| `"supabase"` | Supabase | 事務局の数人でログインして共同編集する |

## すぐ試す（ローカルモード）

いまの `config.js` は Supabase（`quiz/` などと同じ数学ラボ2のプロジェクト）につなぐ設定。ローカルで試すときは、`config.js` の `BACKEND` を `"local"` に変える（コミットしない）。

```bash
python3 -m http.server 8797 --directory conference-editor
# 編集画面  http://localhost:8797/
# 公開側の見本  http://localhost:8797/demo.html   （編集画面で「公開する」を押した内容が入る）
```

## 共同編集にする（Supabase）

既存のプロジェクト（会員サイトなど）に足しても、大会ごとに新しいプロジェクトを作ってもよい。足すのは `conf_` で始まる名前のテーブル・関数だけで、既存のものには触れない。

編集者は、メールアドレスではなく**ユーザーID**で判定する。誰でも登録できるプロジェクトで、他人が編集者と同じメールアドレスで登録しても（メール確認をしていない設定でも）、編集者になれないようにするため。

1. Supabase の **SQL Editor** に `supabase/schema.sql` を貼って Run（再実行しても壊れない）。
2. 編集者にしたい人が、そのプロジェクトのユーザーとして存在していること（会員として登録済み、または **Authentication → Users → Invite user**）。その人を、SQL Editor で登録する。
   ```sql
   insert into conf_editors (user_id)
   select id from auth.users where lower(email) = lower('someone@example.com');

   -- 登録できたか確認（1行出れば登録できている。0行なら、そのメールアドレスのユーザーがまだいない）
   select u.email, e.user_id from conf_editors e join auth.users u on u.id = e.user_id;
   ```
   メールアドレスで探して登録するので、そのアカウントが**本人のもの**であることを、先に確認すること（Authentication → Users の一覧で、メールアドレスと作成日時を見る）。
3. **Project Settings → API** の Project URL と anon（publishable）キーを `config.js` に書き、`BACKEND` を `"supabase"` にする。
4. ログインの方法（編集画面から、アカウントを新しく作ることはできない）：
   - **パスワード**：すでにパスワードを持つアカウント（会員サイトのアカウントなど）なら、そのまま使える。Supabase 側の設定は要らない。
   - **メールのリンク／6桁のコード**：**Authentication → URL Configuration** の Redirect URLs に、編集画面のURLを足す（Site URL は変えない）。コードで入るには、**Email Templates → Magic Link** の本文に `{{ .Token }}` を足す。会社のメールはリンクを自動で開いて無効にしてしまうことがあるので、コードでも入れるようにしてある。
     ※ メールのテンプレートはプロジェクト全体で共通。会員サイトでマジックリンクを使っているなら、影響を確認してから変えること。

専用の新しいプロジェクトにする場合は、Authentication → Providers → Email の「Allow new users to sign up」を OFF にすると、さらに安心。

## 公開側のサイトに組み込む

流し込みたい場所に `data-content` を付け、元の内容はそのまま書いておく。

```html
<ul class="news" data-content="news">   <li>…元のお知らせ…</li>   </ul>
<dl class="spec" data-content="overview"> <div><dt>…</dt><dd>…</dd></div> </dl>
<ol class="days" data-content="program">  <li class="day">…元の日程…</li>  </ol>

<script src="…/config.js"></script>
<script src="…/schema.js"></script>
<script src="…/site-content.js"></script>
<script>SiteContent.apply(window.CONF_EDITOR_CONFIG);</script>
```

- 作られるHTMLの形（クラス名）は、`css/site-sample.css` と同じ。参考にした案内サイトの CSS にそのまま合う。
- 文字は textContent で入れる（HTMLとしては解釈しない）。リンクは `http://` と `https://` だけ。
- 公開側から Supabase へは、anon キーで「公開済みの列」だけを読む。下書きは読めない。

## 誰が何をできるか（`supabase/schema.sql` の RLS）

| 立場 | できること |
|---|---|
| 公開側（anon キー） | 公開済みの内容（`key` / `published` / `published_at`）を読むだけ。下書きは読めない。書けない |
| ログイン済みだが編集者ではない人 | 何も読めない・書けない・公開できない |
| 編集者（`conf_editors` に載っている**ユーザーID**の人） | 下書きの読み書き。公開は `conf_publish()` 経由だけ（`published` を直接は書き換えられない） |

- 編集者は**ユーザーID**で判定する。メールアドレスは信用しない（編集者と同じメールアドレスを名乗る別のIDは、何も読めず・書けず・公開できない）。
- 更新者・更新時刻・版番号（`version`）はサーバー側で付ける。改ざんできない。
- 更新のたびに、変更前の内容が `conf_content_history` に残る（画面からはまだ戻せない。Supabase のダッシュボードで見られる）。
- 同時編集は「後勝ち」にせず、版番号で衝突を検出して知らせる。
- 個人情報は入れない（お知らせ・日程・プログラムの文章だけ）。

## 検査

```bash
node conference-editor/test/schema.js      # データの整え方・点検
node conference-editor/test/store.js       # 保存先2つ（Supabase は偽のサーバーに対して）
NODE_PATH=$(npm root -g) node conference-editor/test/e2e.js [スクリーンショットの保存先]   # ブラウザでの通し検査

# 権限（RLS）の検査：実際の Postgres で。捨てていいデータベースに対して実行する
createdb conf_rls_test
psql -v ON_ERROR_STOP=1 -d conf_rls_test -f conference-editor/test/rls.sql    # 最後に ALL OK
```

## 確かめていないこと・注意

- **実物の Supabase には、まだつないでいない。** 権限（RLS）は実際の Postgres 16 で検査したが、Supabase 側の認証（`auth.jwt()`）は代用品で、メール送信・PostgREST を通した動きは、偽のサーバー（`test/fake-supabase.js`）に対してだけ確かめた。最初に実物で通しの確認をすること（ログイン→保存→公開→公開側に出る）。
- 無料プランの Supabase は、一定期間使われないとプロジェクトが一時停止されることがある（条件は公式で確認）。止まっても、公開側は元のHTMLが表示されるのでサイトは止まらない。
- 画像・PDF のアップロード、文字装飾つきの本文編集、履歴から戻す画面は、まだない。
