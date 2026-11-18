# 中学校数学の授業準備教材と教師間の教材共有：現状・海外の類例・AI授業準備ツール・ライセンス（2026-10-14時点）

調査方法の注記（レポート作成者向け）：
- この環境では WebFetch が全ドメインで DNS エラーになった。curl での直接取得も、組織の通信ポリシーで 403 になった（kyoiku-press.com で確認）。そのため**ページ本文はほとんど読めておらず、多くの記述は検索エンジンの抜粋（要約）に基づく**。該当する記述には「(検索抜粋)」と付けた。
- 調査の途中で、共有の Web 検索上限（1ターン200回、全エージェント共通）に達した。そのため、次のものは今回調べられていない（各節の Gaps に記載）：
  - Khanmigo・Diffit・Eduaide・Twinkl・Open Up Resources
  - ロイロノート・スクールタクト・Canva
  - Microsoft Copilot・ChatGPT Edu・ClassPad.net
  - 免許外教科担任の統計、日本の教育委員会による CC 公開の事例
- GitHub の情報は GitHub API で直接確認した。kazu のリポジトリの状態は、ローカルのファイルで確認した。
- 記号：「⚠2024以前」は、2025年より古い情報で、いまは変わっている可能性がある。法律に関する部分は一般的な情報で、法的助言ではない。

## 1. 出版社の教材：2025年度教科書の採択、教師用指導書、指導者用デジタル教科書、学校採用ワーク

### Takeaway
日本の中学数学教師の授業準備は、主に次の2つに支えられている。
- 採択教科書に準拠した「教師用指導書＋指導者用デジタル教科書」。自治体の予算で4年ごとに整備され、1学年あたり数万〜約10万円の規模。
- 学校採用ワークに付いてくるデジタル小テストなど。

どちらも特定の教科書に結びついた有償のライセンス品で、編集して自由に再配布できるものではない。板書の支援は「一部の授業の板書例」にとどまる、という記述しか確認できなかった（啓林館の2021年版）。2025年度の全国の採択シェアは、今回は一次資料で確認できなかった。

### Cited Findings
**採択シェア（全国）**
- 全国の発行者別シェアで最新のものとして確認できたのは、令和3年度（2021年度）使用分だった。数学は啓林館が38.1％で首位。同じ記事で、英語は東京書籍44.5％、歴史的分野は東京書籍52.5％。⚠2024以前 — [教育新聞「来年度使用の中学教科書、東京書籍が道徳、英語などでシェア1位」](https://www.kyoiku-press.com/post-223707/)(検索抜粋)
- 2025年度のシェアとして「啓林館約35％・東京書籍約30％・大日本図書約10％」とする塾のブログ（2026-07-09）がある。ただし根拠が書かれておらず、信頼性は低い — [マナモン](https://manamon-juku.com/2026/07/09/chugaku-sugaku-kyokasho-level/)(検索抜粋)
- 2025年度用の主な教科書の書名：東京書籍『新編 新しい数学』、啓林館『未来へひろがる数学』 — [東京書籍 令和7年度用 中学校教科書](https://ten.tokyo-shoseki.co.jp/text/chu/)、[啓林館 未来へひろがる数学](https://www.shinko-keirin.co.jp/keirinkan/chu_r7/math/)

**採択（地域別の例、2024年夏に採択→2025年度から使用）**
- 啓林館を採択：
  - 名古屋市（令和8年度も令和7年度と同じ） — [名古屋市](https://www.city.nagoya.jp/kodomo/schools/1027693/1016802/1016898/1016899/1041903.html)
  - さいたま市立浦和中・大宮国際中等（令和6年8月1日に採択） — [さいたま市](https://www.city.saitama.lg.jp/006/014/008/003/013/005/p116396.html)
  - 京都市 — [教育開発出版 採択表（近畿）](https://www.kyo-kai.co.jp/juku/chuu/saitaku/2025_area4/index.html)(検索抜粋)
- 東京書籍を採択：
  - 文京区（令和7〜10年度） — [文京区](https://www.city.bunkyo.lg.jp/b049/p002126.html)
  - 練馬区 — [練馬区](https://www.city.nerima.tokyo.jp/kosodatekyoiku/kyoiku/gakko/kyokasho.html)
  - 中央区 — [中央区](https://www.city.chuo.lg.jp/a0051/kosodate/gakkoukyouiku/shouchuugakkou/kyoukasho/kyokasyo.html)
  - 松江市 — [松江市 採択一覧](https://www.city.matsue.lg.jp/material/files/group/111/R7saitakuitirann.pdf)
  - 大阪府立富田林中 — [大阪府](https://www.pref.osaka.lg.jp/documents/136247/g4.pdf)(検索抜粋)
- 学校図書を採択：都立中学校（2025年度使用） — [リセマム 2024-07-29](https://resemom.jp/article/2024/07/29/78191.html)(検索抜粋)
- 東京都教委は、令和7〜10年度の公立中学校の採択結果を地区別に公開している — [東京都教育委員会](https://www.kyoiku.metro.tokyo.lg.jp/school/textbook/adoption_policy_other/adoption_result/adoption_result/results_2024_public)
- **大日本図書について、情報が食い違っている**：
  - 文科省の検定審議会（令和5年度 第3部会）の議事要旨の抜粋では、令和7年度用「中学校 数学1年」の申請者として東京書籍(002)・学校図書(011)・教育出版(017)・啓林館(061)の名前が見え、大日本図書は見当たらなかった — [文科省 議事要旨](https://www.mext.go.jp/b_menu/shingi/tosho/019/124/gijiroku/1416825_00010.htm)(検索抜粋)
  - 一方、別の検索抜粋では、大日本図書の中学数学に令和7年度の教科書番号702・802・902があるとされた — [山ノ内町 資料](https://www.town.yamanouchi.nagano.jp/material/files/group/51/C_sugaku.pdf)(検索抜粋)
  - どちらが正しいかは未解決。

**教師用指導書**
- 啓林館（2025年度版）の指導書「第2部 詳説」の中身と価格 — [啓林館 数学 指導書のご紹介](https://www.shinko-keirin.co.jp/keirinkan/chu_r7/math/feature/shidosho.html)(検索抜粋)
  - 構成：朱註編／指導研究編／コピー資料集／板書ブック／ICT活用ブック／データディスク
  - 価格：「クラウド版指導者用デジタル教科書（教材）期間版」を同梱したセットが1年用で97,000円、同梱しないセットが29,000円（税込か税別かは未確認）
- コピー資料集は、テスト・ワークシートなどをそのままコピーして使える形で収め、氏名・組・番号の欄も付いている — 同上(検索抜粋)
- 2021年度版の案内に書かれていたこと（⚠2024以前） — [啓林館 令和3年度用 数学 指導書のご案内](https://www.shinko-keirin.co.jp/keirinkan/chu/text_2021/math/guidance.html)(検索抜粋)
  - 板書ブックの中身は「いくつかの授業の板書例」「板書のポイント」「板書に関するQ&A」。全時間の板書計画ではない。
  - 付録DVDには、問題データベースから問題を選んでプリントを作る Word アドインと、教科書の問題の Word データが入っていた。
- 2025年度用の教科書デジタルコンテンツには、解説動画を「豊富に追加」した — [啓林館](https://www.shinko-keirin.co.jp/keirinkan/chu_r7/math/)(検索抜粋)
- 教科書会社がウェブで配っている資料：
  - 啓林館「カリキュラム作成資料」（年間指導計画などを作るための資料） — [啓林館](https://www.shinko-keirin.co.jp/keirinkan/chu_r7/math/curriculum.html)
  - 東京書籍「新編 新しい数学 資料ダウンロード」 — [東京書籍](https://ten.tokyo-shoseki.co.jp/text/chu/sugaku/download/)
  - 日本文教出版の中学数学「教科書サポート」資料 — [日文 PDF](https://www.nichibun-g.co.jp/textbooks_support/download/c-sugaku_textbooks_support.pdf)
- 指導書を買う予算の規模：所沢市では、令和7年度が中学校教科書の改訂の年にあたり、教師用指導書をそろえる。小学校と中学校をあわせた指導書の購入予算は29,218,000円 — [所沢市 資料](https://www.city.tokorozawa.saitama.jp/shiseijoho/shichougian/reiwa7nendai1kaiteireikai.files/siryou-R7-038.pdf)(検索抜粋)

**指導者用デジタル教科書**
- 学校図書（学図）のカタログに載っている指導者用（学校ライセンス）の価格。いずれも学年ごとの価格で、校内の指導者用端末なら台数の制限はない（中学数学向けの製品と推定）。
  - 2025年度：教科書使用期間版が税込82,500円（本体75,000円）、1年間版が税込26,400円（本体24,000円） — [学図 2025年度目録](https://gakuto.co.jp/docs/download/pdf/2025_mokuroku.pdf)(検索抜粋)
  - 2026年度：同じ価格 — [学図 2026年度目録](https://gakuto.co.jp/docs/download/pdf/2026_mokuroku2.pdf)(検索抜粋)
  - 2024年度：1年版が税込23,100円 — [学図 2024年度目録](https://gakuto.co.jp/docs/download/pdf/2024_mokuroku2.pdf)(検索抜粋)
- 広島市は、学図の中学数学・指導者用デジタル教科書（教科書使用期間版）を64校分調達した。納期は2025-04-25 — [広島市 調達仕様書](https://ppi.keiyaku.city.hiroshima.lg.jp/PPI_P/DownLoad/202530019500102.pdf)(検索抜粋)

**学校採用ワーク・教材会社**
- 啓林館は、学校採用の『未来へひろがる数学ワーク1〜3年』と、副教材の『未来へひろがる数学問題集』を出している — [ワーク](https://www.shinko-keirin.co.jp/keirinkan/chu/math/gakkousaiyou/work.html)、[問題集](https://www.shinko-keirin.co.jp/keirinkan/supplementary/detail_math_j01.html)
- 市販の教科書準拠ワーク『中学教科書ぴったりトレーニング』（新興出版社啓林館）は、2025年度の新教科書に合わせてリニューアルした — [PR TIMES](https://prtimes.jp/main/html/rd/p/000000263.000032562.html)
- 正進社：ワークに付いているデジタル小テスト「10分単元フォーム」。同じ単元の類題をフォーム形式で出し、採点結果を自動で集計して、教師がいつでも確認できる。文科省の資料で小学校の事例として紹介された（2024-09）。⚠2024以前 — [文科省資料](https://www.mext.go.jp/content/240918-mext_syoto01-000037976_2-2.pdf)(検索抜粋)
- 新学社：数学ワークにデジタルドリルと動画解説が付いており、「学習サポートシステム」から使う。中学数学の PDF も、ダウンロード配布用のサイトで公開している。教師向けの小テスト作成機能は確認できなかった — [新学社 配布PDFの例](https://douga.sing.co.jp/tyu/rom_DL/pdf/HA/sugaku/susit3.pdf)(検索抜粋)

### Inferences
- 教材の価格を並べると、規模がわかる。
  - 啓林館は、デジタル教科書を同梱すると97,000円、同梱しないと29,000円。差額の約68,000円がデジタル教科書の分と考えられる。これは学図のデジタル教科書（期間版・本体75,000円）とほぼ同じ水準。
  - したがって「指導書＋指導者用デジタル教科書」は、1校の1学年で約10万円、3学年で約30万円になる（推定）。
  - こうした教材は自治体がまとめて買い、教科書の改訂（4年ごと）にあわせて入れ替える。教師が個人で編集・共有できる「データ」ではない。
- 出版社の板書支援がどこまでかは、2021年版の記述では「一部の授業の板書例」だった。2025年版で全時間の板書計画が入ったかは未確認。
  - 全時間ぶんの板書計画を、編集できる形で出版社が配っているという証拠は見つからなかった。
  - 全時間の板書計画は、これまで主に市販の書籍（第2節の東洋館シリーズ）が担ってきた領域と考えられる。
- 採択される教科書は地域ごとにばらばら。啓林館（名古屋・京都・さいたま）、東京書籍（文京・練馬・中央・松江）、学校図書（都立中）が混在している。
  - 教科書非依存の教材は、どの採択地区の教師でも使えるのが強み。
  - 一方で、教科書のページや問題番号と対応しない不便がある。
  - 「各社の教科書の単元の順番・時数との対照表」を付けると、この不便が解消する。
- 学校採用ワークのデジタル付録（正進社のフォーム小テスト、新学社のデジタルドリル）は、生徒の練習と小テストの自動化が中心。授業設計（授業構想・板書）までは扱っていない（推定）。

### Gaps
- 2025年度の全国の発行者別採択シェア。時事通信「内外教育」、文教ニュース、教科書協会、文科省の需要数資料を直接確認する必要がある。
- 東京書籍・学校図書・教育出版・数研出版・日本文教出版の指導書の価格と中身。とくに、全時間の板書計画・ワークシート・授業スライドが入っているか。
- 啓林館2025年版の「板書ブック」「指導研究編」が全時間ぶんを扱っているか。
- 教師が指導書をどう評価しているか（アンケートや口コミ）。今回は見つからなかった。
- 浜島書店・日本標準・文理の、学校専売教材の教師向け特典（小テストの作成ソフトなど）。今回は検索で確認できなかった。
- 佐賀県立中学校（致遠館を含む）の数学の採択教科書。今回は未調査。

## 2. 市販の書籍（東洋館出版社・明治図書）と、kazu の教材を出版する現実性

### Takeaway
「全時間の板書」を売りにした定番は、東洋館出版社「板書で見る全単元・全時間の授業のすべて 中学校数学」。確認できたのは2022年3月刊の1年・2年で、各3,520円・約240頁。3年の巻と、2025年の教科書改訂後の新版は見つからなかった。

明治図書は2025〜26年も、中学数学の授業づくりの本を1冊2,000円前後で毎月のように出している。月刊誌『数学教育』も2026年に刊行が続いている。

297時間ぶんの教材をそのまま本にするのは分量的に難しい。「授業構想＋板書計画」を本にして、ワークシートなどはダウンロードで付ける形なら、既存の書籍の型に合う（推論）。

### Cited Findings
- 東洋館『板書で見る全単元・全時間の授業のすべて 数学 中学校2年』 — [絵本ナビ](https://www.ehonnavi.net/ehon00.asp?no=202638)(検索抜粋)
  - 著者：藤原大樹。監修：田中博史・池田敏和。
  - 2022-03-16発売、税込3,520円、238頁。ISBN 9784491047799。
  - 授業で使う表・グラフのデータをダウンロードできる。⚠2024以前
- 同シリーズの中学校1年：2022年3月発売、本体3,200円（税込3,520円）、ISBN 9784491047782。⚠2024以前 — [紀伊國屋書店](https://www.kinokuniya.co.jp/f/dsd-101001018011015-01-?p=2)(検索抜粋)
- このシリーズは「令和3年度全面実施学習指導要領対応 板書シリーズ」として出ている（外国語・中学校2年の例） — [ヨドバシ](https://www.yodobashi.com/product/100000009003546708/)
- 中学校3年の巻は、検索結果（著者の作品一覧を含む）に出てこなかった — [絵本ナビ 池田敏和 作品一覧](https://www.ehonnavi.net/author.asp?n=36000)(検索抜粋)
- 明治図書の中学数学の新刊（2025〜2026年） — [紀伊國屋 明治図書 中学校カテゴリ](https://www.kinokuniya.co.jp/f/dsd-101001018011015-06-)、[丸善ジュンク堂](https://www.maruzenjunkudo.co.jp/products/9784181714246)、[NDLサーチ](https://ndlsearch.ndl.go.jp/en/books/R100000002-I034705710)(検索抜粋。各書名に対応するURLまでは特定できていない)

| 書名 | 著者・編者 | 発売 | 税込価格 |
|---|---|---|---|
| 『中学校数学授業づくりの教科書』 | 藤原大樹 | 2025-04 | 2,090円 |
| 『中学校 学級全員が説明する数学授業』 | 武藤寿彰 | 2025-04 | 2,156円 |
| 『「生徒が主語の学び」を実現する 中学校数学科新発問パターン集』 | 『数学教育』編集部 編 | 2025-07 | 2,420円 |
| 『図解 中学校数学の授業デザイン』 | 山脇雅也 | 2025-09 | 1,980円 |
| 『中学校高等学校数学 ペア学習・グループ学習のデザイン』 | 島智彦 | 2026-02 | 未確認 |
| 『個別最適な学びの授業デザイン 中学校数学』 | 宮﨑裕亮 | 2026-05（NDLの登録） | 未確認 |

- 明治図書で「全時間」「ワークシート集」をうたう中学数学の本は、今回の検索では見つからなかった(検索抜粋)。
- 明治図書の月刊誌『数学教育』は、2026年7月号が2026-06-12に発売されており、刊行が続いている — [丸善ジュンク堂](https://www.maruzenjunkudo.co.jp/products/4912054430763)。創刊は1960年9月 — [CiNii](https://ci.nii.ac.jp/ncid/AN00056512?l=en)

### Inferences
- 東洋館の本は1学年1冊・約240頁で全時間を扱っている。1時間あたりおよそ見開き1つ（2頁）程度と推定できる。
  - kazu の1時間ぶんの教材（授業構想・板書計画・ワークシート・両面の演習プリント・小テスト・スライド）は、この分量をはるかに超える。
  - 本にするなら、「授業構想と板書計画を紙面に載せ、ワークシート・演習・小テスト・スライドはQRコードやダウンロードで付ける」形が、東洋館の中2の巻（データのダウンロードあり）と同じ型になる。
- 東洋館の中学数学シリーズは2022年刊で、2021年度版の教科書の時期のもの。2025年の教科書改訂後の新版は見つからなかった。
  - 学習指導要領（平成29年告示）は変わっていないので、内容としてはそのまま使える。
  - ただし、教科書の新版に合わせた全時間ものに空白がある可能性がある（推論。要確認）。
- 教師が著者になる道筋：
  - 藤原大樹氏は、東洋館（2022年）と明治図書（2025年）の両方で著者になっている。複数の出版社から本を出す教師の著者がいる、という実例。
  - 一般に、雑誌への寄稿や研究会での発表 → 単著、または「監修者（大学教員など）＋編著者＋複数の現場教師」の共著、という道筋が多いと考えられる（推論。今回の調査では出典を確認していない）。
- AI が生成し、まだ授業で試していない教材は、出版社の企画会議では「授業での実践の裏付け」を求められる可能性が高い（推論）。そのため、次の順に進めるのが現実的と考えられる。
  1. 授業で試す。
  2. 『数学教育』などに寄稿したり、研究会で発表したりする。
  3. 監修者（数学教育を専門とする大学教員など）を立てて、企画を提案する。

### Gaps
- 東洋館シリーズの部数・売れ行き。中1の巻の著者構成。中3の巻が本当に出ていないのか（東洋館の公式サイトで確認が必要）。
- 明治図書・東洋館への企画の持ち込み手順。AI を使って書いた原稿に対する出版社の方針。
- そのほかの「全単元・全時間」型の資料（学事出版、日本標準など）。今回は未調査。

## 3. 日本の教師間の共有プラットフォームと教材販売

### Takeaway
日本の教師の教材共有は、主に3つの型に分かれる。
- 事例を共有する型：StuDX Style（文科省）、EDUPEDIA、TOSSランド
- コミュニティ型：SENSEIノート（約2.5万人。2026年も ARROWS が運営）
- 個人が販売する型：note、BOOTH

米国の Teachers Pay Teachers のような、日本の教材売買マーケットは確認できなかった。GitHub 上で日本の教師が教材を共有する文化は、まだ非常に小さい。2025〜26年に「単一 HTML の授業ツール」を公開する教師が現れ始めているが、スターもフォークもほぼゼロ。

### Cited Findings
- SENSEIノート — [sincereed-agent（ARROWSの求人情報、2026-04-28）](https://sincereed-agent.com/offer/arrows/)、[文科省 インタビュー記事](https://www.mext.go.jp/mirashoku/activities/platform_005.html)（掲載時期は不明で、古い可能性がある）(検索抜粋)
  - 2026-04-28の時点で、ARROWS が「SENSEIノート」（コミュニティ）と「SENSEIイベントポータル」を運営している。
  - 文科省の記事では「全国2.5万人の先生がオンラインでつながる」とされ、ファイルを共有する「ひきだし機能」がある。
  - 2014年に正式に公開された（⚠2024以前） — [THE BRIDGE 2014](https://thebridge.jp/en/2014/03/sensei-note-official-launch)
- StuDX Style（文科省）は、全国の学校・自治体の実践事例や記事を紹介するサイト。掲載件数は確認できなかった — [StuDX Style](https://www.mext.go.jp/studxstyle/special/18.html)(検索抜粋)
- TOSS は、2026年に「TOSSサマーセミナー2026」と「第4回AI活用教育賞」の表彰式を開いている。教師の研究団体が、AI の活用を表彰の対象にしている — [PR TIMES](https://prtimes.jp/main/html/rd/p/000000004.000146433.html)
- note と BOOTH での個人販売 — [atsoho（教員の副業）](https://atsoho.com/blog/kyoushi-fukugyo)、[リベシティ記事（本人の申告）](https://library.libecity.com/articles/01K0E735JPNBBYG6WCY5ZMWZ7V)、[atsoho（特商法）](https://atsoho.com/blog/note-course-sales-legal-duties)(検索抜粋)
  - ワークシートや授業案を PDF にして、BOOTH や note で売る方法が紹介されている。
  - 手数料の目安は、note が10〜20％、BOOTH が5.6％＋決済手数料（ブログの情報。最新の料金は各サイトで要確認）。
  - 「教員向けの授業用教材を note で売り、月の利益が平均40万円を超えて退職した」という元教員の体験談がある。本人の申告で、再現できるかは不明。
  - 有料で売る場合は、特定商取引法にもとづく表示の義務が生じる場合が多い。
- 日本の Teachers Pay Teachers のようなマーケットは、今回の検索では見つからなかった。海外では次の例がある(検索抜粋)。
  - Amazon Ignite（2019年発表）：審査に通った教師が無料でデジタル教材を出品でき、手数料は30％。前身の Amazon Inspire は、著作権侵害が多く広まらなかったと報じられた。⚠2024以前 — [THE BRIDGE 2019](https://thebridge.jp/2019/11/amazon-starts-marketplace-for-teachers-to-sell-online-educational-resources-pickupnews)
  - TES（2015）。⚠2024以前 — [THE Journal 2015](https://thejournal.com/articles/2015/08/27/tes-global-expands-online-resource-marketplace-for-teachers.aspx)
  - ClassFlow Marketplace（2016）。⚠2024以前 — [eSchool News 2016](https://www.eschoolnews.com/innovative-teaching/2016/08/02/classflow-marketplace-lets-teachers-buy-and-sell-original-content/)
- GitHub 上の日本の教師の教材リポジトリ（GitHub API で 2026-10-14 に検索。検索語「数学 ワークシート OR プリント 授業」）
  - ヒットは38件だけ。日本語のものは、ほぼすべてスター0・フォーク0だった。
  - 2025〜2026年に作られた例：
    - [1090takatoto/derivative-lesson](https://github.com/1090takatoto/derivative-lesson)（高校数学・微分係数の模擬授業用インタラクティブ教材、単一 HTML、2026-08-15作成）
    - [rickcrick2004-hue/electric-circuit-learning-app](https://github.com/rickcrick2004-hue/electric-circuit-learning-app)（中学理科の電気、2026-09-23作成）
    - [konta545/kazurium](https://github.com/konta545/kazurium)（数を学ぶ授業用ゲーム、2026-09-22作成）
    - [nakajim0720/Teaching-Methodology-Mathematics](https://github.com/nakajim0720/Teaching-Methodology-Mathematics)（教科教育法、2025-10-17作成）
    - kazu 自身の [dora9991/math-dialogue](https://github.com/dora9991/math-dialogue)（2026-06-14作成）
  - 「中学 数学 教材」で検索すると、中国語のリポジトリばかりが上位に並んだ（日本語固有のものはほとんどない）。

### Inferences
- 日本には「編集できる教材データを、フォークして改良し合う」型の共有の場がない。いま共有されているのは、次のようなもの。
  - 事例の紹介（StuDX Style、EDUPEDIA、TOSSランド）
  - SNS 内のファイル（SENSEIノートの「ひきだし」）
  - 個人の有料 PDF（note、BOOTH）
- GitHub を主な配布先にするのは、ほとんどの教師にとって現実的でない。ただし、AI を使ってコードを書く教師が単一 HTML の授業ツールを公開し始めている（2025〜26年）。いずれ「フォークの文化」を持ち込める土台はある。
- 教材の売買マーケットがない日本では、広める手段は次の組み合わせが中心になる（推論）。
  - 無償で公開し、オープンなライセンスを付ける。
  - 研究会（TOSS、数学教育の学会・研究会）、文科省の事例サイト、SNS で配る。
  - 教育委員会や教育センターに採用してもらう。

### Gaps
- TOSSランド・EDUPEDIA の掲載数と、中学数学の件数。
- ロイロノートの授業案ライブラリ、スクールタクトの共有機能、Canva for Education（日本）の教師向けテンプレートの利用状況。今回は検索上限のため未調査。
- 「みんなの教材」型のサービスのいまの状況。日本の教材売買マーケットが実際にあるかどうか（実在するサービス名）。
- note・BOOTH での教材販売の売上を、体験談以外の形で示す資料。

## 4. 海外のオープンカリキュラムと AI 授業準備アシスタント

### Takeaway
- Oak National Academy（英国）：国の資金（2022〜25年に最大4,300万ポンド）で、全教科のカリキュラムを無償で出している。AI 授業アシスタント「Aila」のコードは MIT ライセンスで公開されている。2026年10月に出た EEF のランダム化比較試験では、Aila で授業準備の時間が約24％（週に約49分）減り、教材の質は落ちなかった。ただし、Aila を使った授業は全体の約7％にとどまり、効果は経験の浅い教師や、教科に自信のない教師で大きかった。
- Illustrative Mathematics（米国）：「無償の教材＋認定パートナーによる印刷版・強化版デジタル・研修の販売」で事業を続けている。ライセンスは、旧版の CC BY から、新版（v.360）では非営利の CC BY-NC に移った。
- Teachers Pay Teachers：売上が上位の出品者に極端に集中しており、2026年には AI が作った低品質な教材（AI slop）が問題になっている。
- MagicSchool・Brisk：汎用の AI 生成ツールで、大型の資金調達をして数百万人規模の教師が使っている。

### Cited Findings
**Oak National Academy と Aila**
- EEF の Aila 試験（実施は NFER）。結果は2026年10月上旬に報じられた — [EEF プロジェクトページ](https://educationendowmentfoundation.org.uk/projects-and-evaluation/projects/aila-teacher-choices-trial)、[EdTech Innovation Hub](https://www.edtechinnovationhub.com/news/oaks-aila-saves-primary-teachers-49-minutes-a-week-on-lesson-planning-eef-trial-finds)、[ResultSense 2026-10-06](https://www.resultsense.com/news/2026-10-06-eef-trial-oak-aila-lesson-planning-time/)(検索抜粋)
  - 対象：2025年秋、108校の小学3〜6年担当の教師464人。Aila を使う群と使わない群に無作為に分けた（どちらの群も、ほかの AI は使ってよい）。
  - 時間：週の授業準備時間は、Aila 群が約2.5時間、比較群が約3.3時間（比較群の76％。約24％の減少、週に約49分）。
  - 質：独立した評価者が見て、Aila 群の教材は比較群より劣っていなかった。EEF の判定でエビデンスの確実性は「高い」。
  - 利用状況：Aila 群の81％が一度は開いたが、ふだんの週に Aila を使った授業は約7％。よく使った人ほど時間が減った。
  - 効果が大きかった人：経験の浅い教師、教科に自信のない教師。
  - 意識：「計画の立て方が大きく変わった」と答えたのは5分の1未満。研究者は「Aila はゼロから計画を作るように設計されているが、教師は既存の教材を手直しすることが多い」と指摘している。
  - 注意：対象は小学校で、中学校の数学ではない。
- Aila の公開直後の利用：最初の2か月で1万人が約2.5万件の授業計画を作り、85％が質を「かなり高い」か「非常に高い」と評価した（2024年の公開時期の数字）。⚠2024以前 — [英国政府 AI Knowledge Hub](https://ai.gov.uk/knowledge-hub/tools/aila:-ai-lesson-assistant/)
- Oak の利用規模（2025年） — [Oak's impact](https://www.thenational.academy/about-us/oaks-impact)
  - 2025年1〜7月に約20万人の教師が使い、毎週5.4万人以上が使っている。
  - 67％が「業務負担が全体として減った」と答え、平均で週4時間の削減。
- 利用規模の推計は割れている（2025年9月の独立レビュー） — [Oak 独立レビュー（2025年9月）](https://assets.publishing.service.gov.uk/media/68d54085c908572e81248ce8/Oak_National_Academy_Independent_Review.pdf)(検索抜粋)
  - ImpactEd の評価では「教師の3人に1人が使っている」。ただし、オフラインでの共有を仮定に含めている。
  - 別の調査（School and College Voice）では、2023/24年度に使った教師は12％で、前年より減った。
- 資金
  - 2022〜2025年に最大4,300万ポンド（議会の書面答弁）。⚠2024以前 — [英国議会 書面答弁](https://questions-statements.parliament.uk/written-questions/detail/2023-10-13/201532/)
  - そのうち800万ポンドを、新しい授業教材の購入にあてる計画。⚠2024以前 — [Tes](https://www.tes.com/magazine/news/general/oak-national-academy-ps8-million-budget-set-buying-new-lesson-resources)
- Oak の GitHub（GitHub API で 2026-10-14 に確認）
  - [oaknational/oak-ai-lesson-assistant](https://github.com/oaknational/oak-ai-lesson-assistant)：「Oak's AI Projects including our AI Lesson Planning Assistant (Aila)」。MIT ライセンス、2024-08作成、2026-10-13にも更新、スター35・フォーク6。
  - [oaknational/oak-ai-autoeval-tools](https://github.com/oaknational/oak-ai-autoeval-tools)：授業計画や教材を、LLM を審査役にして自動評価するツール。MIT。
  - [oaknational/oak-curriculum-ontology](https://github.com/oaknational/oak-curriculum-ontology)：Oak のカリキュラムを、イングランドのナショナルカリキュラム（2014）に対応づけて意味的に表したデータ。2026-02作成、knowledge-graph と open-data のタグ付き。
  - [oaknational/oak-open-curriculum-ecosystem](https://github.com/oaknational/oak-open-curriculum-ecosystem)：Oak のカリキュラムデータを API・SDK・MCP アプリで使うためのツール群。2025-07作成、MIT。
  - [oaknational/Oak-Web-Application](https://github.com/oaknational/Oak-Web-Application)：Oak のウェブアプリ本体。MIT。

**Illustrative Mathematics（IM）**
- ライセンス — [IM 利用規約](https://www.illustrativemathematics.org/terms-of-use)(検索抜粋)
  - 旧版の IM K–12 Math は CC BY 4.0（営利・非営利とも利用可）。
  - 新版の IM v.360 は accessim.org で無償公開。CC BY-NC 4.0 で、書面での許可がなければ営利目的の利用はできない。
- 事業モデル — [IM パートナーページ](https://illustrativemathematics.org/partners)、[Tech & Learning](https://www.techlearning.com/news/back-office-business-illustrative-mathematics-selects-kendall-hunt-publishing-as-distributor-of-im-certified-math-curriculum)(検索抜粋。Kendall Hunt の記事は日付不明で、古い可能性あり)
  - 「IM Certified」の配布パートナーは、Imagine Learning、Kendall Hunt、Kiddom の3社。IM の名前と商標を使う権利を持ち、認定の数は限られている。
  - Kendall Hunt は、無償の認定デジタル版の独占配布元で、印刷版と研修も売っている。
  - CC BY の旧版を使って、認定を受けずにカリキュラムを作っている第三者もいる。
  - まとめると、「無償の中核教材＋有償の印刷版・強化版デジタル・研修」の組み合わせ。

**Eureka Math / EngageNY（Great Minds）**
- ライセンスは CC BY-NC-SA 3.0（第三者のサイトの表記。Great Minds 本体のページでは未確認） — [ASSISTments](https://www.assistments.org/copyright-notice/great-minds-copyright-notice)
- 成り立ち：Great Minds がニューヨーク州教育局のために Eureka Math を作り、EngageNY として配布した。Great Minds のパンフレットでは、EngageNY Math を作るために2012年に助成を受けたとされる。⚠2024以前 — [Great Minds パンフレット（issuu）](https://issuu.com/docs/ca7717bc47a644549307d812507f3d5e)(検索抜粋。どのパンフレットかは特定できていない)。OER として教育委員会が採用するときの選択肢の一つとしても挙げられている — [OER Commons「OER Options for District Adoption」](https://oercommons.org/authoring/56715-oer-options-for-district-adoption-goopen-remix/view)(検索結果に出たページで、本文は未確認)
- 米国の教師の50％以上が Eureka Math か EngageNY 版にアクセスしたことがある（RAND の数字。Great Minds のパンフレットでの引用。どのパンフレットかは特定できていない）。⚠2024以前 — [Great Minds パンフレット（issuu）](https://issuu.com/docs/ca7717bc47a644549307d812507f3d5e)(検索抜粋)

**Teachers Pay Teachers（TPT）**
- 2020年の学術研究 — [Koehler et al. 2020（Teachers College Record）](https://spencergreenhalgh.com/research/2020-koehler-et-al-tpt/)。⚠2024以前
  - 教材4,018,173件、出品する教師208,748人、累計ダウンロード15億回、累計売上39億ドル。
  - 売上の81％が、上位1％の出品者に集中していた。
- 規模と運営(検索抜粋) — [Preqin](https://www.preqin.com/data/profile/asset/teachers-pay-teachers/175015)、[Levels.fyi](https://next.levels.fyi/is-is/companies/teachers-pay-teachers)
  - 教師700万人以上が利用。教材数は資料によって「500万点以上」から「10億点」までばらつく。
  - IXL Learning が買収した（Preqin は2023年3月としているが、時期は要確認）。
  - 学校向けのサブスクリプション「TpT School Access」がある。
- 2026-08-03の Chalkbeat の報道 — [Chalkbeat 2026-08-03](https://www.chalkbeat.org/2026/08/03/ai-slop-on-teachers-curriculum-marketplace/)(検索抜粋)
  - TPT に、AI が作ったと見られる、明らかな誤りを含む教材が出回っている。
  - 親会社の IXL は「アルゴリズムで、AI 生成の低品質な教材に関連するストアを見つけ、表示順位を下げている」と述べた。

**AI アシスタント（汎用）**
- MagicSchool
  - 2025年2月に、Valor Equity Partners が主導してシリーズBで4,500万ドルを調達 — [MagicSchool ブログ](https://www.magicschool.ai/blog-posts/series-b-fundraise-for-teacher-ai)、[Dealroom](https://app.dealroom.co/news/feed/magic-school-raises-45m-relocates)
  - 利用者数は資料によって食い違う。
    - 200万人の教育者 — [Signalbase](https://www.trysignalbase.com/news/funding/magicschool-secures-45m-series-b-funding-to-revolutionize-education-with-ai-driven-support-for-2-million-educators)
    - 450万人（2025年初めの報道。検索抜粋）
    - 2026年初めに登録500万人超（第三者のブログで、信頼性は低い） — [fast.io](https://www.fast.io/resources/magic-ai-review-2026.md)
- Brisk Teaching
  - 2025年3月に、Bessemer が主導してシリーズAで1,500万ドルを調達。100か国以上で100万人の教育者が使っている — [Bessemer](https://www.bvp.com/news/giving-teachers-their-time-back-our-investment-in-brisk-teaching)、[GovTech](https://govtech.com/biz/brisk-teaching-raises-15m-for-classroom-ai-technology)
  - 2024年9月にシードで500万ドル（その時点で累計690万ドル） — [OwlVC](https://www.owlvc.com/content-hub/brisk-teaching-raises-6-9m-in-funding-for-ai-education-tool-and-unveils-brisk-boost-ai-powered-activities-for-students-4b34c)

### Inferences
- 無償・オープンなカリキュラムが広まり、続いていくための条件（上の事例から言えること）：
  1. 安定した公的資金や助成金がある（Oak のような政府資金、EngageNY の州の助成）。
  2. 単発の教材ではなく、カリキュラム全体が一貫している（Oak、IM、Eureka）。
  3. 無償の中核の周りに、有償の商売が成り立つ（IM の認定パートナーによる印刷版・研修、Great Minds の販売）。
  4. ライセンスを戦略的に選んでいる。
     - CC BY は、再利用を最大にする（IM の旧版から、第三者版が多数生まれた）。
     - NC（非営利）や SA（継承）は、持続性を守る（IM v.360 は BY-NC、Eureka は BY-NC-SA）。
  5. 効果の証拠がある（EEF のランダム化比較試験）。
  6. 品質を保証した教材群の上に AI を載せ、コードと評価ツールまでオープンにしている（Aila とその自動評価ツールは MIT ライセンス）。
- EEF の結果は、kazu の方針を裏付ける。
  - 「ゼロから生成する AI」は、使われる授業の割合が低かった（約7％）。教師は「既存の教材を手直しする」ことを好んだ。
  - つまり、「完成した、編集できる全時間の教材」と、それを手直しするための AI 支援の組み合わせが合っている。
  - 効果が大きかったのは経験の浅い教師と教科に自信のない教師。日本でいえば、講師・初任者・免許外教科担任にあたる。
- TPT で AI slop が問題になっている（2026年）。そのため、「機械で検算済み」「既存の教材との類似を検査済み」という品質の証明が差別化になる。
- Oak は、カリキュラムを「データ・API・MCP・意味の対応表（オントロジー）」として公開し始めている（2025〜26年）。AI 時代には、教材そのものが、ほかの AI ツールの「根拠データ」になる。

### Gaps
- Khanmigo（教師向け機能と無償化の状況）、Diffit、Eduaide、Twinkl（会員数・料金）、Open Up Resources の事業モデル。今回は検索上限で未調査。
  - 参考（調査前の知識で、未検証）：Khanmigo の教師向け機能は、2024年に Microsoft との提携で米国の教師に無償化された。
- Oak の教材のライセンス（Open Government Licence かどうか）。Aila の機能の詳細（スライド・小テスト・ワークシートを作れるか）。今回は一次資料で未確認。
- TPT の2025年の支払総額。上位の出品者の売上。

## 5. 日本の教員向け生成 AI ツールと文科省の方針

### Takeaway
- 文科省の方針：「初等中等教育段階における生成AIの利活用に関するガイドライン Ver.2.0」（2024-12-26）が現行版。2026年6月の資料では、新しい検討会議が始まったことと、教員研修の動画シリーズを公開したことが書かれている。
- 教師が使える AI の環境は広がっている。
  - スタディポケット：自治体単位で導入する「校務GPT」。2026年度から教員向けを無償化する方針という情報あり（未検証）。
  - Gemini for Education と NotebookLM：対象の教育機関なら無償。宮城県は2025年8月から県立学校の教員に NotebookLM を開放した。
- ただし、中学数学の全時間の教材を根拠にした、日本版の Aila にあたるもの（品質を保証した授業生成）は見つからなかった。

### Cited Findings
- 文科省のガイドライン
  - 現行版は Ver.2.0（2024-12-26公表）。一律に禁止も義務づけもせず、主な読み手は教職員と教育委員会 — [文科省 生成AI関連ページ](https://www.mext.go.jp/zyoukatsu/ai/about.html)、[AI Picks 解説](https://aipicks.jp/glossary/mext-ai-guidelines)(検索抜粋)
  - 改訂の経緯：2023年7月の暫定版 → 2024年7月に検討会議を設置 → セキュアな環境での校務への生成AI活用の実証の成果を反映して Ver.2.0 — 同上(検索抜粋)
  - 教材作成についての具体的な記述は、今回の検索では確認できなかった。
- 2026-06-30付の文科省資料：生成AIの活用のあり方に関する検討会議が始まったこと、教員向け研修動画のシリーズを公開したことが書かれている — [文科省 2026-06-30 資料](https://www.mext.go.jp/content/20260630-mxt_shuukyo01-000050664_2.pdf)(検索抜粋)
- スタディポケット for TEACHER
  - プロンプト不要の「校務GPT」として発表された — [ASCII.jp](https://ascii.jp/elem/000/004/188/4188031/)
  - 導入実績の数字は、資料によって違う(検索抜粋)。
    - 「90自治体・1,000校以上」（比較サイト） — [AI Picks](https://aipicks.jp/tool/studypocket)
    - 「25自治体以上・200校以上」（会社発表の記事。どの記事に載っているかは特定できていない） — [ASCII.jp](https://ascii.jp/elem/000/004/261/4261960/)
  - 2026年度から、教員向けを永年無償にする方針(検索抜粋。提携ページの記述で、中立的な情報源ではない) — [AI Picks パートナーページ](https://aipicks.jp/partners/partner-3589a6)
  - 2024年3月に、月額1,980円の個人プランを開始 — [ASCII.jp](https://ascii.jp/elem/000/004/190/4190564/)(検索抜粋。どの記事かの特定は推定)
  - 2026年5月に、60言語のリアルタイム通訳「スタディポケット AI通訳」を発表。教員向けの体験版は2026-06-01から — [リセマム 2026-05-22](https://resemom.jp/release/prtimes/20260522/185015.html)(検索抜粋)
- Google
  - 対象の教育機関は、Gemini for Education と NotebookLM を無償で導入できる（ただし、確認できたのは高等教育向けのページ） — [Google for Education 日本語](https://edu.google.com/intl/ALL_jp/why-google/higher-ed-solutions/)(検索抜粋)
  - 宮城県（情報教育通信、2025-12-08）：県立学校の教員は、Gemini に加えて、2025-08-13から NotebookLM も使えるようになった。市町村立学校は各市町村教委のルールに従う。生徒が使うには、保護者による生成AI利用の承諾が必要 — [宮城県総合教育センター](https://www.pref.miyagi.jp/documents/41848/2511_45.pdf)(検索抜粋)
  - NotebookLM は35以上の言語に対応し、利用者のデータを AI モデルの学習に使わないと明記されている — [helentech](https://helentech.jp/news-77369/)(検索抜粋)
  - 2026-04-08に、Gemini に「Notebooks」機能が追加され、NotebookLM と連携するようになった — [DXマガジン](https://dxmagazine.jp/news/2620ukre20-2/)(検索抜粋)

### Inferences
- 日本の教師は、汎用の AI（Gemini、NotebookLM、スタディポケット）を「手元の資料を読ませて使う」環境を手に入れつつある。
  - そのため、NotebookLM などに読み込ませやすい形（単元ごとのテキストや JSON）の、信頼できる教材のまとまりには需要が生まれる（推論）。
  - kazu の297時間のデータと、122授業ぶんの「発問の木」のデータベースは、そのまま根拠資料として使える。
- 日本版 Aila（中学数学の全時間を根拠にした授業生成アシスタント）は見当たらない。いまのところ空白地帯（推論。検索漏れの可能性あり）。

### Gaps
- Microsoft Copilot（教育機関向け）、ChatGPT Edu、ClassPad.net（カシオ）が日本の教員にどれだけ使われているか。教科書会社の AI 機能（東京書籍・啓林館など）。今回は検索上限で未調査。
- ガイドライン Ver.2.0 の本文のうち、教員の教材作成と著作権に関する部分。次の版（Ver.3）が出る時期。
- 佐賀県教育委員会の生成AIの方針と、導入しているツール。

## 6. 著作権・ライセンス：AI 支援で作った、教科書に依存しない教材の扱い

### Takeaway
- 著作権法35条の補償金：授業目的公衆送信補償金（SARTRAS）は、中学校で生徒1人あたり年180円。2025年8月に規程が変わったが、金額は据え置き。ただし、kazu のように**自分で作った教材を一般に公開する場合、35条の制度には頼らない**。
- AI で作ったものの著作権：文化庁の「AIと著作権に関する考え方について」（2024-03-15）は、人間の「創作意図」と「創作的寄与」がある場合に著作物性を認める、という整理。侵害かどうかは「類似性」と「依拠性」で判断する。
- オープンライセンスの先例：海外では、教育省が CC BY 4.0 で公開している例（オーストラリア）や、数学のカリキュラムを NC（非営利）付きのライセンスで出す例（IM v.360、Eureka）がある。日本の教育委員会が数学の教材を CC で公開している例は、今回は見つけられなかった。

### Cited Findings
- SARTRAS の補償金
  - 校種ごとに、1人あたりの年額 × 対象者数で計算する包括方式。利用の回数は関係ない。年額は、大学等720円、高等学校等420円、中学校等180円、小学校等120円。計算例：中学校500人なら、180円×500人＋消費税相当で99,000円。⚠2024以前の資料 — [SARTRAS 手続・分配の資料（2021-01-29）](https://sartras.or.jp/wp-content/uploads/tetsuzukibunpai_sartras_20210129.pdf)(検索抜粋)
  - 規程は2025-08-21の理事会決議で一部変更されたが、主に文言の整理で、補償金の額は変えていない — [SARTRAS 補償金規程（2025-08-21）](https://sartras.or.jp/wp-content/uploads/hosyokinkitei_20250821.pdf)、[変更のポイント](https://sartras.or.jp/wp-content/uploads/hosyokinkitei_henkopoint.pdf)(検索抜粋)
  - 利用報告から計算した1回あたりの単価は、中学校を含むどの校種でも、当初の想定をおおむね下回っている — 同上(検索抜粋)
- 文化庁「AIと著作権に関する考え方について」（2024-03-15に取りまとめ。法的な拘束力はない） — [GameBusiness.jp 2024-04-19](https://www.gamebusiness.jp/article/2024/04/19/22981.html)、[AI総研](https://www.ai-souken.com/article/ai-generated-copyright-explanation)、[東京大学 生成AIと著作権 資料](https://genai.t.u-tokyo.ac.jp/assets/materials/01_03_生成AIの注意点・リスク_03_生成AIと著作権.pdf)(検索抜粋)。⚠2024以前（ただし現行の基本文書）
  - AI 生成物に著作物性が認められるには、人間に「創作意図」と「創作的寄与」が必要。寄与の程度は総合的に判断する。
  - 指示（プロンプト）が詳細であるほど、創作的寄与が認められやすくなる。
  - 侵害かどうかは、「類似性」と「依拠性」を順に検討して判断する。
  - 画風・作風・アイデアそのものは、著作権で保護されない。
- 海外の公的機関の例：オーストラリアの各教育省は、ウェブサイトと刊行物を CC BY 4.0 で公開する方針をとっている — [Smartcopying](https://smartcopying.edu.au/?p=3049)
- 日本語の手引き：東京大学「オープン教材を育てよう！−再編集と再配布の手引き−」（大山・平野、2025年11月掲載）。パブリックドメインとオープンライセンス、オープン教材の実例、再編集のしかたを解説している — [東京大学 PDF](https://komex-ex.c.u-tokyo.ac.jp/wp-content/uploads/2025/11/oyama-SY-hirano_create-oer.pdf)
- 数学のカリキュラムのライセンスの先例：IM v.360 は CC BY-NC 4.0、旧版は CC BY 4.0（第4節）。Eureka は CC BY-NC-SA 3.0（第4節）。Oak のコードは MIT（第4節）。

### Inferences（一般的な情報で、法的助言ではない）
- kazu の教材は自分で作ったもので、一般に公開している。そのため、35条（授業の過程での利用。補償金を払えば校内での公衆送信もできる）に頼る場面はない。
  - 注意が要るのは、ほかの教師がフォークして、教科書の紙面や問題を書き足した版を公開する場合。これは35条の範囲外になる可能性が高い。
  - そのため、ライセンスの案内に「教科書・指導書・市販問題集からの転載を含む改変版は公開しない」と注意書きを入れるのがよい（推論）。
- 著作物性について：
  - kazu は、方針（6つの型、毎時間の「考える問い・表現する場面・自分で選ぶ場面」）を決め、詳しい指示を出し、選んで直し、構成を組み、検算もしている。少なくとも、全体の選択と配列（編集著作物）や、手を入れた部分には、創作的寄与を主張できる余地がある（推論）。
  - 一方、AI がほぼそのまま出力した1問1問には、著作物性が認められない可能性がある。
  - それでも、CC ライセンスを付けておけば「自由に使ってよい」という意思がはっきりする。害はない（推論）。
- 教科書と似てしまうリスクについて：
  - 「2x+3=7 を解け」のような定番の問題は、アイデアや事実に近く、保護されにくい（推論）。
  - リスクが集中するのは、教科書に特有の文章題の場面設定・数値の組み合わせ・図・説明の文章をなぞる場合。
  - kazu の重複検査ツール（`hyojun-navi/tools/overlap.py`）は「類似性」を表現のレベルで確かめるのに役立つ。
  - ただし、このツールが比べる相手は「作者の手元の非公開の資料（指導書などを読んで、授業準備用にまとめたもの）」で、同じ文字のならび（既定は14文字）の一致を数える仕組み（ツール冒頭の説明文で確認）。
  - そのため、比べる相手に入っていない教科書・問題集との類似は検出できない。公開時に「何と比べて、どの閾値で検査したか」を書いておくと、誤解されにくい（推論）。
  - 「依拠性」（AI の学習データに教科書が含まれていたかもしれないこと）については、文化庁の文書の扱いを原典で確かめる必要がある（Gaps）。
- ライセンスの選択肢（推論）：

| ライセンス | 長所 | 短所 |
|---|---|---|
| CC BY 4.0 | 広まりやすさが最大。教委・研究会・出版社・塾が自由に再利用できる。「増やす」という kazu の方針に最も合う | 営利企業がそのまま売ることもできる |
| CC BY-SA 4.0 | 改変版もオープンのまま残る | 有償の教材と混ぜたい教委や出版社には使いにくい |
| CC BY-NC-SA 4.0 | 営利目的の利用を止められる | 「営利かどうか」があいまい（塾・印刷代の実費・有償研修など）で、広まりにくい |

- IM や Eureka が NC を選んだのは、事業を守るため。収益の仕組みを持たない kazu には、その理由があまり当てはまらない（推論）。
- コード（JS・CSS・Python のツール）には、Oak にならって MIT が自然（推論）。

### Gaps
- 日本の教育委員会や教育センターが、数学の教材を CC BY などで公開している具体例。今回は見つからず、検索上限で追加調査もできなかった。
  - 参考（調査前の知識で、未検証）：政府標準利用規約（第2.0版）は CC BY 4.0 と互換とされ、自治体のサイトでも採用例がある。
- 文化庁の文書のうち、「依拠性」の推認（AI の学習データに既存の著作物が含まれる場合）に関する記述の原文。
- 教科書著作権協会の、教科書の問題の転載に関する規定。
- 公立学校の教員（育児休業中を含む）の兼業・副業の規定（地方公務員法38条、教育公務員特例法17条）と、職務で作ったものの著作権（職務著作）の扱い。今回は出典で確認できていない。教材を有償で売る前に、任命権者への確認が必要。

## 7. 空白地帯：調べた範囲で、まだ誰も満たしていない領域

### Takeaway
今回確認できた範囲では、次の6つを満たす中学数学の教材はなかった。
1. 無償
2. 編集できる
3. 教科書に依存しない
4. 全学年・全時間がそろっている
5. 答えが機械で検算されている
6. オープンライセンスが付いている

出版社の教材は有償で教科書に縛られる。市販の書籍は2022年版で、編集できるデータではない。日本の共有の場は「事例の紹介」が中心。海外の汎用 AI は「ゼロから作る」型で、日本の学習指導要領に合わせたものではない。

### Cited Findings
- 出版社の指導書とデジタル教科書：有償、教科書準拠、学年ごとのライセンス。板書は「一部の授業の板書例」（2021年版の記述） — [啓林館 指導書](https://www.shinko-keirin.co.jp/keirinkan/chu_r7/math/feature/shidosho.html)、[学図 2025年度目録](https://gakuto.co.jp/docs/download/pdf/2025_mokuroku.pdf)(検索抜粋)
- 全時間の板書の書籍：2022年版の中1・中2しか確認できず、紙の本 — [絵本ナビ](https://www.ehonnavi.net/ehon00.asp?no=202638)
- 共有の場は、事例の紹介とコミュニティが中心 — [StuDX Style](https://www.mext.go.jp/studxstyle/special/18.html)、[文科省 SENSEIノート記事](https://www.mext.go.jp/mirashoku/activities/platform_005.html)
- GitHub での日本の教師の共有は、スター0の個人リポジトリが散らばっている程度（第3節）。
- 「ゼロから生成」型の AI は、使われる授業が少なく（約7％）、教師は既存の教材の手直しを好む — [EEF](https://educationendowmentfoundation.org.uk/projects-and-evaluation/projects/aila-teacher-choices-trial)(検索抜粋)
- 経験の浅い教師や、教科に自信のない教師で効果が大きい — 同上
- 教材の売買市場では、AI で作った誤りの多い教材が問題になっている — [Chalkbeat 2026-08-03](https://www.chalkbeat.org/2026/08/03/ai-slop-on-teachers-curriculum-marketplace/)

### Inferences（空白になっている理由を、証拠とあわせて）
1. **無償・編集可・教科書非依存・答えを機械検算済みの、全時間の教材セット**：
   - 有償の指導書（学年あたり約3〜10万円）と、紙の書籍（3,520円）の間に空白がある。
   - 「検算済み」は、AI slop が出回るなかで品質を示す印になる。
2. **板書を中心にしたワークシートの生成器**：
   - 出版社の板書支援は一部の授業だけ（2021年版の記述）。書籍の板書は紙で、編集できない。
   - 「板書計画 → 生徒が写すワークシート（ikkan 型） → 電子黒板のスライド」を一続きに作る道具は見当たらない。
3. **教師がフォークして改良し合う仕組み**：
   - 日本には、教材の売買市場も、フォークの文化もない。
   - 海外では、IM の CC BY 旧版から第三者版が生まれ、Oak はコードとデータを公開している。日本にこれに当たる場はない。
4. **教員不足の学校向けのパッケージ（講師・免許外教科担任・初任者）**：
   - EEF の結果は、まさにこの層で AI と既製の教材の効果が大きいことを示している。
   - 日本の免許外教科担任の数学の件数は、今回は未取得（Gaps）。
5. **中高一貫6年間の数学の計画**：今回は調査できなかった（Gaps）。致遠館のような県立の中高一貫校が試行の場になりうる。
6. **ワークシートから自動で作る電子黒板用スライド**：
   - 指導者用デジタル教科書は、電子黒板で映す標準の教材だが、教科書に縛られ有償（学年あたり2.6万〜8.25万円）。
   - 自分のプリントと連動したスライドを自動で作るものは、出版社の製品では確認できなかった（推論）。

### Gaps
- 中高一貫校の6年間の数学カリキュラムで、公開されている例や市販品。
- 電子黒板用のスライド教材の市場（ロイロノート、スクールタクト、Canva のテンプレートなど）。
- 免許外教科担任・講師不足についての、文科省の最新の統計。
- いずれも検索上限のため未調査。

## Gaps and opportunities for kazu

### Takeaway
いちばん効果が大きく、すぐできるのは次の2つ。
- **ライセンスを決めて明記すること**：教材は CC BY 4.0（または CC BY-SA 4.0）、コードは MIT。いまはリポジトリの最上位にも、hyojun-navi・ikkan のどちらにも、ライセンスの記載がない。
- **「検算済み・類似検査済み」という品質を、目に見える形で示すこと**。

そのうえで、次を行えば、「増やす」（ほかの教師が使い・直し・共有する）が起こる条件がそろう（推論）。
- 経験の浅い教師・講師・免許外の教師向けのパッケージにする。
- 教科書との対照表を付ける。
- AI に読ませやすい形（NotebookLM 用のパックや MCP）で出す。
- 研究会と教育委員会の経路で配る。

### Cited Findings（kazu の資産の現状。ローカルのリポジトリで確認）
- ライセンスの記載なし：リポジトリ [dora9991/math-dialogue](https://github.com/dora9991/math-dialogue) の最上位に LICENSE ファイルはない（あるのは `public/mecha-battle/LICENSES.txt` だけ）。`hyojun-navi/`・`ikkan/`・`README.md` を「ライセンス」「license」「CC BY」「クリエイティブ」で検索しても、該当なし（2026-10-14にローカルで確認）。
- 授業ナビ 標準版の公開状態（`hyojun-navi/README.md` より）：
  - 公開先は math-hyojun.pages.dev（Cloudflare Pages）。`X-Robots-Tag: noindex` と robots.txt の Disallow で、検索に出にくくしている。
  - 同じデータ（答えつき）が GitHub の公開リポジトリにもあり、こちらは検索に出る。README 自身が「答えを、生徒から完全にかくすことはできない」「小テストを評定に使うときは、数値を変える」と書いている。
  - 全22単元の PDF（約220MB）を `/見本/` で公開している。
  - 検査用のツールがある。
    - `tools/verify.py`・`vcore.py`：sympy で検算する。種類は、式の計算・因数分解・方程式・連立方程式・二次方程式・式の値・関数の式（点を通るか）・変化の割合・数値計算・語句の有無・Python の確かめの式。図形の長さや角が座標と合っているかの検査（geo_check）や、ワークシートが1ページ・演習が表裏に収まっているかといった形の検査もある。
    - `tools/overlap.py`：作者の非公開の準備資料と比べて、同じ文字のならび（既定は14文字）の一致を数える。
- ikkan（板書型ワークシート）：
  - 中1の7単元に、1つずつワークシートがある（`ikkan/data/ws_*.js`）。
  - 全部を1つにまとめた `ikkan-all-in-one.html` をダウンロードしてダブルクリックすれば開ける（ビルドもサーバーも不要）。
  - 紙面は A4、7mm のドット罫、37行。
- 先例として使えるもの：
  - Oak の Aila（MIT）、自動評価ツール（MIT）、カリキュラムの対応表（2026年）、API・SDK・MCP の仕組み（MIT） — [oak-ai-lesson-assistant](https://github.com/oaknational/oak-ai-lesson-assistant)、[oak-ai-autoeval-tools](https://github.com/oaknational/oak-ai-autoeval-tools)、[oak-curriculum-ontology](https://github.com/oaknational/oak-curriculum-ontology)、[oak-open-curriculum-ecosystem](https://github.com/oaknational/oak-open-curriculum-ecosystem)
  - EEF の結果：準備時間が24％減り、効果は経験の浅い教師で大きい — [EEF](https://educationendowmentfoundation.org.uk/projects-and-evaluation/projects/aila-teacher-choices-trial)(検索抜粋)

### Inferences（具体的な提案。すべて推論。法的な点は要確認）
1. **ライセンスを決める（いちばん優先）**
   - 教材（授業構想・板書計画・ワークシート・演習・小テスト・スライド・発問の木のデータベース）は **CC BY 4.0** にする。「改変版もオープンのまま残したい」なら CC BY-SA 4.0。
   - コード（hyojun-navi の js・css・tools、ikkan、math-dialogue）は **MIT** にする。
   - リポジトリの最上位と、各フォルダに LICENSE を置く。あわせて NOTICE を置き、次のことを書く。
     - AI（Claude）で作成し、作者の方針で編集・検算したこと。
     - まだ授業で試していないこと。
     - 教科書・指導書から転載していないこと。
     - 改変版に教科書などの転載を含めて公開しないでほしいこと。
     - 帰属表示の例（「授業ナビ 標準版（kazu）CC BY 4.0」など）。
   - NC を避ける理由：「営利かどうか」があいまいで、塾や有償研修、教委が委託した印刷などで使いにくくなり、広まらなくなる。
2. **品質を「見える化」して、看板にする**
   - 単元ごとの「品質報告」を公開する。中身は、約5,100の答えを sympy で検算した結果、n-gram の重複検査の閾値と結果、AI エージェントによるレビューの記録。
   - TPT の AI slop の問題（2026年）や、汎用の AI 生成ツールとの違いになる。
   - Oak の自動評価ツール（LLM を審査役にする方式、MIT）にならって、授業構想の質を判定する基準（3つの場面がそろっているか、型が合っているか、など）を作ることもできる。
3. **小さな実地試行で証拠を作る**
   - 佐賀県内の講師・初任者・中学数学の教師、5〜10人に、1単元を使ってもらう。
   - EEF と同じように、授業準備の時間（週あたり）と教材の質を、使った場合と使わない場合で比べる。
   - 「経験の浅い教師で、どれだけ時間が減ったか」の数字は、教委・研究会・出版社のどこに持っていっても通じる材料になる。
4. **教員不足の学校向けの「明日の1時間パック」**
   - 中身：年間計画 ＋ 1時間につき A4 1枚（授業構想と板書計画。既存の `#/cards/` の印刷） ＋ ワークシート・小テストの PDF ＋ 板書の台本としての ikkan シート。
   - 対象：講師、免許外教科担任、初任者。
   - 個人に配るより、佐賀県教育センターなどに「県の支援教材」として扱ってもらえれば、一度に多くの学校に届く。
5. **教科書との対照表**
   - 297時間と、2025年度版の各社教科書（東京書籍・啓林館・学校図書・教育出版・数研出版・日本文教出版、大日本図書は要確認）の章・節の順番と時数を対応させた表を作る。
   - 対照に使うのは章の名前と順番だけなので、著作権のリスクは低い（推論）。
   - 採択地区がばらばらでも、どこの教師でも使えるようになる。
6. **板書を中心にしたワークシート生成器にする（ikkan の発展）**
   - hyojun-navi の297時間の板書計画から、ikkan 型のワークシートを自動で作る。いまは中1の7単元だけ。
   - データの形（`ws_*.js`）を公開して、教師が自分でシートを作れるようにする。
   - スライドも同じデータから作れば、「板書計画 → 生徒が写すワークシート → 電子黒板」が一続きになる。これは出版社の製品にない（第7節）。
7. **ITに詳しくない教師でもフォークできるようにする**
   - GitHub を使わない大多数の教師向けに、次の形で配る。
     - 単元ごとに、編集できるファイル（Word・PowerPoint、Google ドキュメント・スライドへの書き出し）。
     - ikkan と同じく、1つのファイルで動く HTML。
   - 直した版を集める場所を用意する。たとえば、Google フォームで受け付けて、kazu が選んでギャラリーに載せる。または SENSEIノートの「ひきだし」を使う。
   - GitHub は、kazu と少数の「AI でコードを書く教師」向けの上流に位置づける。
8. **AI と組み合わせる**
   - 単元ごとに「AI に読ませる授業パック」（Markdown や JSON。NotebookLM・Gemini・Claude で使える）を公開する。宮城県のように NotebookLM を教員に開放した県が出てきている。
   - Oak にならって、授業ナビのデータを API・MCP で提供する。
   - 発問の木のデータベース（中1の122授業、誤概念のタグ付き）は、汎用の「校務GPT」（スタディポケットなど）にはない独自の資産。対話型の授業アプリの「根拠データ」として打ち出す。
9. **学習指導要領との対応表（オントロジー）**
   - 各時間を、学習指導要領の内容の項目（とその番号）に結びつける。Oak のカリキュラム対応表（イングランドの2014年版ナショナルカリキュラムに対応）が先例。
   - 検索、他のツールとの連携、教委への説明に使える。
   - 文科省の「学習指導要領コード」を使えるかは要確認。
10. **答えが見えてしまう問題を、機能に変える**
    - 公開しているリポジトリで答えが見えるのは避けられない（README に書いてある）。
    - そこで、sympy で数値を変えた小テストの A/B/C 版を自動で作る機能にする。「数値を変える」という README の注意を、道具として実装する形。
11. **出版と発信の道筋**
    1. 『数学教育』（明治図書）への寄稿や、研究会での発表。テーマ案は「AI と機械検算でつくる全時間教材」。
    2. TOSS の AI活用教育賞や、StuDX Style（文科省）への事例の提供。
    3. 授業で試した結果をもとに、監修者（たとえば佐賀大学などの数学教育の研究者）と組んで、書籍の企画を出す。案は「板書型ワークシートでつくる中学校数学の全時間（ダウンロード付き）」。紙面は授業構想と板書計画にしぼり、データは CC BY でウェブにも置く。
    4. note や BOOTH での有償販売は、兼業の許可を確認してから。売るとしても、印刷用にまとめた版や寄付の窓口にとどめ、中核の教材は無償のままにする。
12. **中高一貫の6年間の計画**
    - 致遠館を試行の場として、中3と高校数学I・Aのつながり（先取りや重なり）を示す6年間の版を作る。
    - 今回の調査では、競合を確認できなかった領域。
13. **続けていくための仕組み**
    - IM 型（無償の中核教材＋教委向けのカスタマイズや研修）や、公的な助成金を検討する。
    - 公務員の兼業の規定を確かめることが前提。

### Gaps
- 授業ナビは、まだ授業で使われておらず、利用者の反応のデータもない。上の提案の効果は、すべて推論。
- 佐賀県教育委員会・教育センターの、外部教材の扱いと生成AIの方針。今回は未調査。
- 育児休業中の公立学校教員が、教材を有償で配ったり書籍を出したりすることについての、許可の要否と手続き。出典で確認できていない。
- 日本の教委が CC BY で教材を公開している先例。見つかれば、ライセンスを決めるときの説得材料になるが、今回は見つからなかった。
