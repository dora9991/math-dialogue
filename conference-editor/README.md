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

## 保存先は2通り（`config.js` の `BACKEND`）

| BACKEND | 保存先 | 使う場面 |
|---|---|---|
| `"local"`（初期値） | このブラウザの中 | 自分ひとりで使う／試す。ログイン不要。他の端末とは共有されない |
| `"supabase"` | Supabase | 事務局の数人でログインして共同編集する |

## すぐ試す（ローカルモード）

```bash
python3 -m http.server 8797 --directory conference-editor
# 編集画面  http://localhost:8797/
# 公開側の見本  http://localhost:8797/demo.html   （編集画面で「公開する」を押した内容が入る）
```

## 共同編集にする（Supabase）

**大会ごとに新しい Supabase プロジェクトを作る**ことをすすめる（名義・引き継ぎ・個人情報の分離のため。無料枠で作れる）。

1. Supabase で新しいプロジェクトを作る。
2. **SQL Editor** に `supabase/schema.sql` を貼って Run（再実行しても壊れない）。
3. **Authentication → Providers → Email** で「Allow new users to sign up」を **OFF** にする（知らない人がアカウントを作れないように）。
4. **Authentication → URL Configuration** で、Site URL に編集画面のURLを入れ、Redirect URLs にも同じURLを追加する。
5. **Authentication → Email Templates → Magic Link** の本文に `{{ .Token }}` を足す（メールに6桁のコードが載る）。
   会社のメールはリンクを自動で開いて無効にしてしまうことがあるので、**コード入力でもログインできる**ようにしてある。
6. **Authentication → Users → Invite user** で、編集者のメールアドレスを招待する。
7. 同じメールアドレス（**小文字**）を、SQL Editor で登録する。
   ```sql
   insert into conf_editors (email) values ('someone@example.com');
   ```
8. **Project Settings → API** の Project URL と anon（publishable）キーを `config.js` に書き、`BACKEND` を `"supabase"` にする。

登録されていない人は、ログインできても編集画面に入れない（中身が読めない）。

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
| 編集者（`conf_editors` に載っている人） | 下書きの読み書き。公開は `conf_publish()` 経由だけ（`published` を直接は書き換えられない） |

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
