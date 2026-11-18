# AI対話型（ソクラテス式）数学チュータリングの競合環境 ― グローバル＋日本／「黒板の横で発問するAI先生」アプリの視点

> **調査日：2026-10-14。信頼度ラベル（レポート執筆者は必ず参照）**
> - 【確認】＝本調査中に一次情報の本文を直接取得して確認したもの（anthropic.com／claude.com／support.claude.com／platform.claude.com、GitHub リポジトリ検索のメタデータ、kazu のローカルリポジトリ）。
> - 【検索】＝本調査中の検索エンジン要約に基づく（出典URLあり。ページ本文は直接開けておらず、二次情報・宣伝情報を含む）。
> - 【記憶】＝調査者の事前知識（〜2026年半ば）。URLは既知の所在。**今回は再検証できていない**ため、最終レポートでは「要確認」とするか断定を避けること。
> - 【推論】＝調査者の推論。 **(旧)**＝2024年以前の情報で古い可能性あり。
> - **調査条件の制約**：全エージェント共有の WebSearch 予算（200回/ターン）が調査途中で尽きた。WebFetch は全ホストで DNS エラー。curl はプロキシ経由で resemom.jp・prtimes.jp・justsystems.com・koubo.jp・mext.go.jp・nier.go.jp・eedi.com・arxiv.org・kaggle.com・openai.com・blog.google・pnas.org・nature.com・worldbank 等が 403（組織ポリシーで遮断）。そのため、研究エビデンス・文科省ガイドライン・データセットの多くは【記憶】扱い。

---

## 1. 2026年10月時点で「答えを言わない」ソクラテス式数学チュータリングを提供する製品（グローバル）

### Takeaway
2026年10月時点で「答えを渡さず問いで導く」モードは、ChatGPT（Study Mode）・Gemini（Guided Learning）・Claude（learning mode）の3大汎用AIすべてに標準搭載され**コモディティ化**している。専門K-12製品は「音声（Skye, Synthesis）」「説明録画＋ホワイトボード（Snorkl）」「誤概念診断（Eedi, Carnegie）」「教師が設定するAI部屋（SchoolAI, MagicSchool）」で差別化しているが、**日本の学習指導要領に沿った、教師が設計した発問の木で対話を制御する製品は見つからず**、専門K-12製品で日本語・日本展開の証拠があるものも見つからなかった。

### Cited Findings

**Khanmigo（Khan Academy）**
- 公式年次報告（SY24-25）：登録ユーザー1億8,960万人、Khanmigo の総利用者（年度中に利用権があった人）200万人 — [Khan Academy Annual Report](https://www.annualreport.khanacademy.org/)【検索】
- 個人・保護者向け：月4ドルまたは年44ドル、保護者アカウントで子ども10人まで追加料金なし。2025年の価格を2026年も維持との2026年5月レビューあり。米国の認証済み教員は無料 — [nibble-app（二次）](https://nibble-app.com/blog/khan-academy-pricing)、[aitoolsbakery（2026年5月、信頼度低）](https://aitoolsbakery.com/?p=6592)【検索】
- 学区向け：Khanmigo付き1生徒15ドル（なしは10ドル）、最低250ライセンス、Clever連携必須（掲載日不明） — [Khan Academy blog](https://blog.khanacademy.org/?p=18400)【検索】。1,000ライセンス以下は年10ドル/生徒からとする第三者情報も — [softwarefinder](https://softwarefinder.com/lms/khan-academy/pricing)【検索・二次】。2026年夏の学区展開に向けて Khanmigo を再設計中との報道（信頼度低） — [aitoolsbakery](https://aitoolsbakery.com/?p=6592)【検索】
- 海外展開例：ベトナムで2025-26年度にベトナム語版 Khanmigo を教員向けに展開 — [Khan Academy Vietnam 年次報告 2025-26](https://kav.edu.vn/wp-content/uploads/2026/09/KAV-Annual-Report-2526.pdf)【検索】。ベトナムで2,234校・69.2万人の生徒が登録（Khan Academy 全体の数字で、Khanmigo 単体ではない可能性） — [ADB 発表資料](https://events.development.asia/system/files/parallel-session-1.7_khan-academy.pdf)【検索】
- 未検証の主張：「130か国で150万人、WestEd 研究で1学期後の代数準備度 +0.15SD（47校）」 — [plainai（2026-04-15、検証不能）](https://plainai.aguidetocloud.com/changes/khanmigo-classroom-results/)【検索・要確認】
- 対象：K-12中心。ソクラテス式（ヒントと誘導の問い）が基本設計 — [taskade まとめ](https://www.taskade.com/blog/ai-math-tutoring)【検索・二次】

**ChatGPT Study Mode（OpenAI）**
- 2025年7月下旬（7/29）開始。答えではなく誘導の問いを返す。**新モデルではなくカスタムのシステム指示で実装**。Free/Plus/Pro/Team で利用可、Edu は数週間後。教員・研究者・教育専門家と共同開発。インタラクティブな問い、トピック別の構成、自由記述の小テスト、過去の会話の記憶 — [PCWorld](https://www.pcworld.com/article/2863281/chatgpt-gets-study-mode-to-guide-students-without-spoon-feeding-answers.html)、[Storyboard18](https://www.storyboard18.com/how-it-works/-77777.htm)、[getcoai](https://getcoai.com/news/chatgpts-new-study-mode-transforms-ai-from-answer-machine-to-tutor)【検索】
- ChatGPT for Teachers：2025-11-19 開始、米国の認証済みK-12教員は**2027年6月まで無料**。GPT-5.1、ファイル・コネクタ、音声・画像。**生徒アカウントはまだない** — [eWeek](https://www.eweek.com/news/chatgpt-for-teachers-launch-openai/)、[OpenAI](https://openai.com/blog/chatgpt-for-teachers)【検索】。カナダのK-12教員にも同様の無料提供 — [Gend](https://www.gend.co/en-ca/blog/free-chatgpt-teachers-enhance-classroom-support)【検索】
- 2026年3月に数学・理科のインタラクティブ可視化を追加（ただしソクラテス式は「プロンプト次第」） — [aimagicx（二次）](https://www.aimagicx.com/blog/ai-tutoring-stem-chatgpt-math-visuals-students-2026)、[ainycity（二次）](https://www.ainycity.com/2026/07/best-ai-math-tutors-solvers.html)【検索】
- 年齢：OpenAI 利用規約は13歳以上・18歳未満は保護者同意 — [OpenAI Terms of Use](https://openai.com/policies/terms-of-use)【記憶】

**Gemini Guided Learning / LearnLM（Google）**
- 2025-08-06 開始。LearnLM（教育特化にチューニングしたモデル群）の能力を Gemini に統合。自由回答型の問いで議論を促し、段階的に分解、画像・図・動画・インタラクティブ小テストを含む — [Google blog](https://blog.google/outreach-initiatives/education/guided-learning/)、[Maginative](https://www.maginative.com/article/google-launches-guided-learning-for-gemini-joining-the-ai-tutor-arms-race/)【検索】
- 2025年5月：LearnLM を Gemini 2.5 に直接組み込み — [Google blog](https://blog.google/outreach-initiatives/education/google-gemini-learnlm-update/)【検索】
- BETT 2026 で Audio Lessons（ポッドキャスト風レッスン生成）を追加 — [Educators Technology（2026年2月）](https://www.educatorstechnology.com/2026/02/google-gemini-for-education.html)【検索・二次】

**Claude（Anthropic）learning mode／Claude for Education**
- 2025年4月に Claude for Education と Learning mode を発表：「答えを渡すのでなく推論過程を導く」「"How would you approach this problem?"」「ソクラテス式の問い」。Northeastern・LSE・Champlain と全学契約、Instructure（Canvas）・Internet2 と提携 — [Anthropic](https://www.anthropic.com/news/introducing-claude-for-education)【確認】
- Northeastern は13キャンパス・5万人規模 — [Maginative](https://www.maginative.com/article/anthropic-launches-claude-for-education-with-learning-mode-to-foster-critical-thinking-in-universities/)【検索】。2026年のガイドでは Dartmouth・Northumbria・UVA・Pitt も挙がる — [Educators Technology（2026年2月）](https://www.educatorstechnology.com/2026/02/claude-for-education.html)【検索・二次】
- 現行の教育ページ：「Claude の learning mode は良い家庭教師のように、答えを自分で見つけられるよう問いかける」 — [claude.com/solutions/education](https://claude.com/solutions/education)【確認】。サイトのナビに「K-12 teachers」ソリューションが存在（中身は取得できず） — [anthropic.com](https://www.anthropic.com/news/introducing-claude-for-education)【確認】
- Learning mode の一般ユーザー向け拡張（Engadget 見出し「Claude's new Learning mode will prompt students to answer questions on their own」） — [Engadget](https://engadget.com/ai/claudes-new-learning-mode-will-prompt-students-to-answer-questions-on-their-own-172057828.html)【検索・詳細未確認】
- 2026年の比較記事（1レビュアーの判断）：Claude の Learning Mode が最も一貫して答えを出さない — [Glasp](https://glasp.ai/articles/ai-study-modes-compared)【検索・独立検証なし】
- **年齢制限**：Claude.ai（消費者向け）は**18歳以上**（または居住地の同意年齢のいずれか高い方）。消費者規約は2025-10-08発効 — [Anthropic Consumer Terms](https://www.anthropic.com/legal/consumer-terms)【確認】
- **API で未成年向けサービスを作ることは条件付きで可能**：年齢確認、コンテンツのモデレーション／フィルタ、監視・報告の仕組み、未成年への安全利用教育などの追加安全策、COPPA 等の法令順守の公表、**AIであることの開示義務**、Anthropic による監査（違反率が高い場合アカウント停止あり）。Anthropic が「子ども向け安全システムプロンプト」を提供する場合がある（2026-03-16 版） — [Claude Help Center](https://support.claude.com/en/articles/9307344-responsible-use-of-anthropic-s-models-guidelines-for-organizations-serving-minors)【確認】
- 利用実態：大学生の57万4,740会話を分析、**約47%が「Direct」（最小限の関与で答えや成果物を求める）**。Learning Mode はこの対策として位置づけ — [Anthropic Education Report（2025年4月）](https://www.anthropic.com/news/anthropic-education-report-how-university-students-use-claude)【確認】。教員側：高等教育関係者の約7万4,000会話を分析（2025-08-27） — [Anthropic](https://www.anthropic.com/news/anthropic-education-report-how-educators-use-claude)【確認】

**Synthesis Tutor**
- 音声で導くAI数学チューター。主対象は5〜11歳（K-5）、5〜14歳とする紹介もあり。内容は初歩的な代数的思考まで。価格は情報源で食い違う（家族プラン年119ドル・月29ドルが最有力、個人年300ドル・永年999ドル等の記載も）。7日間無料体験 — [Homeschool Fox](https://homeschoolfox.com/curriculum/synthesis-tutor)、[aitoolsforkids](https://aitoolsforkids.com/blog/synthesis-tutor-vs-khanmigo-ai-math-tutor-comparison)、[homeschoolfox 比較](https://homeschoolfox.com/compare/khanmigo-vs-synthesis-tutor)【検索・二次】

**Third Space Learning「Skye」**
- 数学教員が作った低価格のAI**音声**数学チューター。生徒は話して聞きながら授業を進める。2024年7月に生徒テスト開始、同年9月に第1期校でパイロット。学校単位の定額で無制限、**初等向けは年£3,500/校から**。英国 Year 3〜6（SATs対策含む）、米国 grade 6〜8（Common Core準拠）。「2025年SATsで Year 6 の93%が到達」などは自社主張で独立評価ではない — [TSL AIチューター](https://thirdspacelearning.com/maths-tutoring/ai-maths-tutor/)、[TSL 初等](https://thirdspacelearning.com/maths-tutoring/primary/ai-tutor)、[TSL 米国中学](https://thirdspacelearning.com/us/math-tutoring/middle-school/)、[How it works](https://thirdspacelearning.com/how-it-works/)【検索】

**Snorkl**
- 生徒が**デジタルホワイトボードに書きながら音声で説明**を録画、AIがその説明にフィードバック。教師が問いと「期待する答え・基準」を設定。AIフィードバックは自動承認／教師承認／オフを選択。**40以上の言語**でフィードバック。COPPA・FERPA準拠を主張 — [Educators Technology（2026年10月）](https://www.educatorstechnology.com/2026/10/snorkl-ai-review-for-teachers.html)、[FLTMAG（2025年11月）](https://fltmag.com/snorkl)、[snorkl.app](https://snorkl.app)、[Tom's Takes](https://tomstakesaitools.substack.com/p/snorkl-multimodal-student-demonstrations)【検索】

**Squirrel AI（松鼠AI）**
- 中国発のアダプティブ学習。2026年に米国でサービス開始予定（中国本体と分離した米国法人、2026年1月時点で米国に独立技術基盤） — [Wikipedia](https://en.wikipedia.org/wiki/Squirrel_AI)【検索】。2026年のIPOを目指す（NASDAQか香港） — [Bloomberg 動画 2025-07-16](https://www.bloomberg.com/news/videos/2025-07-16/squirrel-ai-targets-2026-ipo-says-founder-video)【検索】。2024年7月にマルチモーダル「Large Adaptive Model」と専用ハード — [technode](https://technode.global/?p=81847)【検索・(旧)】。学習センター3,000以上（第三者） — [parse.gl](https://www.parse.gl/brands/squirrelai-com)【検索・二次】

**Carnegie Learning（MATHia／LiveHint AI）**
- LiveHint AI（2023-11-30発表）：中高生向け生成AI数学チューター。25年分の独自データで情報付けしたLLM、「生徒の典型的な誤りを予測」と主張 — [BusinessWire 2023](https://www.businesswire.com/news/home/20231130974040/en)【検索・(旧)】。MATHia は Cognitive Tutor の後継のITS — [2020年論文](https://ceurspt.wikidata.dbis.rwth-aachen.de/Vol-2674/paper08.cermine)【検索・(旧)】。AIは教師の代替でなく補助と位置づけ — [Technical.ly](https://technical.ly/startups/teaching-math-ai-tools-carnegie-learning-pittsburgh-tech)【検索】

**Eedi**
- Eedi × Google DeepMind 探索的研究（2025年11月公表、2025年夏、英国中等5クラス・165人）：AIが対話を主導し専門チューターが承認・編集。即時の誤り訂正 93.0% vs 人間のみ 91.2%、誤概念解消 95.4% vs 94.9%、**転移課題で +10pt vs 人間のみ +4.5pt**。著者自身「予備的」と明言 — [Eedi](https://www.eedi.com/news/new-exploratory-research-from-eedi-and-google-deepmind-reveals-human-in-the-loop-ai-tutoring-outperforms-human-only-support)、[The 74](https://www.the74million.org/article/ai-tutors-with-a-little-human-help-offer-reliable-instruction-study-finds/)、[BusinessWire 2025-11-11](https://www.businesswire.com/news/home/20251111406294/en/)【検索】
- 第2弾RCT：4群・英国中等10校・1,525人。2026年に米国で Imagine Learning とRCT予定 — [Eedi](https://www.eedi.com/news/just-launched---our-second-ai-tutor-rct)、[FutureEd](https://www.future-ed.org/research-notes-two-emerging-strategies-for-using-ai-in-tutoring/)【検索】

**SchoolAI／MagicSchool（教師が設定する生徒向けAI）**
- SchoolAI「Spaces」：教師が境界と振る舞いを設定するAI学習空間。ダッシュボード「Mission Control」で**各生徒がどこで詰まっているか**を表示。教師は事前にAIの応答をプレビュー可。教師は無料で開始、学校・学区はカスタム価格。「約1万4,000会話の2年研究で批判的思考28%向上」は自社主張で未検証 — [SchoolAI ヘルプ](https://help.schoolai.com/en/articles/10270211-getting-started-with-spaces)、[schoolai.com/spaces](https://schoolai.com/spaces)、[tooldirectory（2026-07-24）](https://tooldirectory.ai/tools/schoolai)【検索】
- MagicSchool「student room」：教師が有効化したツールだけを生徒が使え、全やり取りが教師・管理者に記録・可視化。教師向けツール80以上。上位プランで Student Room Insights（セッション監視・リアルタイム警告） — [UBC ブログ](https://blogs.ubc.ca/etec523/?p=11817)、[TSD 学区ページ](https://www.tsd.org/departments/its/digital-tools/magicschool)、[fast.io レビュー2026](https://www.fast.io/resources/magic-ai-review-2026.md)、[aitoolsatlas 比較](https://aitoolsatlas.ai/compare/magicschool-vs-school-ai)【検索】

**2025〜2026年の新規参入・関連**
- Bloomy（YC S26）：スキルごとに Base Camp（例題）→ Climb（ソクラテス式 BloomyBot の誘導演習）→ Summit（補助なし10問テスト）の関門型。数学版は7/31開始予定とされたが未確認。非ランダム化パイロットで「NWEA MAP の期待伸長の1.8倍」主張 — [AI Weekly](https://aiweekly.co/alerts/bloomy-debuts-yc-s26-socratic-ai-tutor-for-k-12-mastery)【検索・単一情報源】
- K12MathLab：K〜8向けソクラテス式数学チューター（ベンダーページ） — [k12mathlab](https://k12mathlab.com/math-tutor)【検索】
- 教育AI向けデータ基盤「Learning Commons knowledge-graph」（2025-09作成）：「The data layer for smarter educational AI」＝学力基準・カリキュラムをAIツールに統合する知識グラフ — [GitHub](https://github.com/learning-commons-org/knowledge-graph)【確認：GitHubメタデータのみ】

### Inferences
- 【推論】比較マトリクス（上記事実の要約。空欄は不明）

| 製品 | 対象 | モダリティ | 教師が作る授業フロー | 誤概念診断 | 日本語・日本 | 価格 | 規模 |
|---|---|---|---|---|---|---|---|
| Khanmigo | K-12中心 | チャット（Khanコンテンツ連動） | 限定的（教師ツールあり） | 弱い | 日本語版の証拠なし | 個人年44ドル／学区15ドル | 200万人（SY24-25） |
| ChatGPT Study Mode | 13歳以上（規約） | 文字・音声・画像 | なし | なし（汎用） | 日本語で使える（推論） | 無料〜 | ChatGPT全体 |
| Gemini Guided Learning | 10代以上（推論） | 文字＋図・動画・小テスト | なし | なし | 日本語で使える（推論） | 無料〜 | Gemini全体 |
| Claude learning mode | Claude.ai は18歳以上／APIは安全策付きで未成年可 | 文字・画像 | なし（APIで自作は可） | なし | 日本語で使える | 無料〜／API従量 | 大学中心 |
| Synthesis Tutor | 5〜11歳 | 音声＋操作教材 | なし | 不明 | 英語のみ（推論） | 年約119ドル（家族） | 不明 |
| Skye（TSL） | 英Y3-6／米G6-8 | 音声 | TSL作成レッスン | 診断・形成的評価 | 英語のみ（推論） | 年£3,500/校〜 | 不明 |
| Snorkl | K-12 | 音声＋ホワイトボード | 教師が問いと基準を設定 | 説明の評価 | 40以上の言語（日本語は未確認） | 不明 | 不明 |
| Squirrel AI | K-12 | アダプティブ | なし | 知識点単位の診断 | 日本展開の証拠なし | 不明 | 学習センター3,000以上（二次） |
| LiveHint AI／MATHia | 中高 | ヒント／ITS | Carnegie教材 | 典型誤答の予測を主張 | 英語 | 学区契約 | 不明 |
| Eedi | 英国中等 | 診断用4択＋チューター対話 | Eedi教材 | 誤概念タグ付き誤答選択肢 | 英語 | 不明 | RCT進行中 |
| SchoolAI／MagicSchool | K-12 | チャット | 教師が部屋・指示を作成（構造化された木ではない） | ダッシュボードで可視化 | 英語中心 | 教師無料〜 | 不明 |

- 【推論】大手3社のソクラテス式は「汎用の振る舞い層（システム指示）」で、教科書・単元・1時間の授業展開には紐づかない。深い誤概念モデルを持つのは Eedi・Carnegie だが英米カリキュラム・英語のみ。
- 【推論】「教師が作るフロー」は SchoolAI/MagicSchool（自由文の指示）や Snorkl（評価基準）にとどまり、**飛ばし条件・誤概念タグ・段階的補助発問を持つ構造化された発問の木**を LLM の制御層に使う製品は見当たらない。kazu の設計は、ASSISTments/CTAT 系の「教師が作る ITS」と LLM の柔軟さの中間に位置する。
- 【推論】日本の中学生が使える選択肢は事実上「汎用AIの学習モード」だけで、しかも Claude.ai は18歳以上、ChatGPT は13歳以上・保護者同意という規約の壁があり、学校で生徒に直接使わせるには自治体の契約・設定が前提になる。

### Gaps
- Khanmigo の日本語版・日本展開、Snorkl の日本語UI/フィードバック、Synthesis の日本展開、Squirrel AI の日本展開、LiveHint AI の2026年の状況、SchoolAI/MagicSchool の利用者数は確認できず（検索予算切れ）。
- **重要な未確認点**：Google Workspace for Education 経由で Gemini（Guided Learning 含む）が日本の公立中学生に有効化されているか（GIGA端末でChromebook採用の自治体では事実上の「無料ソクラテス家庭教師」になり得る）。
- Microsoft Copilot の学習機能、Brisk、MathGPT.ai など他の2025-26年参入は未調査。
- 各製品の手書き（vision）対応の有無は Snorkl 以外は未確認。

---

## 2. 日本市場：中学数学をAIで扱う製品は「対話型」か「アダプティブドリル」か「答えを渡す型」か

### Takeaway
日本の学校向けAI数学は**アダプティブドリル（Qubena、すらら、塾向け atama+）が主流で、対話型ではない**。2026年に入り既存大手が一斉に生成AIの「質問対応」を追加した：atama+（2026年3月、塾向け、写真→解説・ヒント）、スマイルゼミ中学生コース（2026年4月、24時間AI質問＋リアルタイム添削、「対話で導く教材 Coachez」）、東京書籍の教科書準拠「教科書AIワカル」（2026年4月、『新編 新しい数学』の「数と式」のみ）、進研ゼミ高校講座（2026年3月）。いずれも**家庭・塾での「わからないを質問する」補助**で有料・クローズドであり、**授業中に教師が主導する、発問の系列に沿った対話**ではない。一方、答えを示すソルバー系アプリ（QANDA、Gauth、Photomath、多数の「AI数学ソルバー」）は日本の中学生が自由に入手できる。

### Cited Findings

**atama+（atama plus）**
- 全47都道府県の塾・予備校に提供、導入教室数4,500以上（2025年5月時点）。2026年3月に塾向けの**生成AI質問対応機能**を開始：写真を撮ると解説やヒントが得られ、中1〜高3・既卒の全11教科対応。2026年夏に類題出題・添削機能を追加予定。2026年7月にKUMONグループが株主に — [atama plus 会社資料（Speaker Deck）](https://speakerdeck.com/player/7649d5669dbb4a4d990387f722687585)、[koubo.jp](https://koubo.jp/article/52020)【検索】
- 「AI先生」は atama+ の初期からの呼称 — [THE BRIDGE（旧）](https://thebridge.jp/2019/11/the-era-of-ai-sensei)【検索・(旧)】

**Qubena（COMPASS）**
- 全国170以上の自治体・小中学校約2,300校で利用（2023年6月発表） — [リセマム PR 2023-06-23](https://resemom.jp/release/prtimes/20230623/100101.html)【検索・(旧)】。八千代市11校・約5,000人（2021年9月〜） — [AIsmiley](https://aismiley.co.jp/ai_news/qubena-yachiyo-city/)【検索・(旧)】
- 2026年の導入数・生成AI機能は見つからず（検索要約）【検索】

**すらら（すららネット）**
- 国内3,100以上の学校・学習塾、約26万人が利用。「AIを活用したアダプティブな**対話式**ICT教材」と自称（台本型の対話式レクチャーで、生成AIの対話ではない）。流山市の市立中学校10校・約5,500人が2026年4月から「すららドリル」 — [PR TIMES 2026-04-28](https://prtimes.jp/main/html/rd/p/000000610.000003287.html)、[リセマム](https://resemom.jp/release/prtimes/20260428/181430.html)【検索】
- 生成AIを明示した導入情報は見つからず【検索】

**スタディサプリ（リクルート）**
- 中学数学の生成AI対話機能は確認できず。英語アプリ「スタディサプリENGLISH」は2026年3月から生成AIの「双方向型AI英会話」 — [AppBank 2026-04-07（出典推定）](https://www.appbank.net/2026/04/07/iphone-application/2967012.php)【検索】
- 学校の教科書・授業進度に連動したレッスン構成が特徴 — [app-liv](https://app-liv.jp/5353126/)【検索】

**東京書籍の教科書準拠「教科書AIワカル」（教科書出版社の動き）**
- 中学校数学教科書『新編 新しい数学』に対応した生成AI学習サービス。2026-04-27に対応開始、**2026年4月時点は「数と式」領域のみ**。授業や宿題の「わからない」をすぐAIに質問できる — [リセマム PR 2026-04-27](https://resemom.jp/release/prtimes/20260427/181153.html)、[財経新聞](https://www.zaikei.co.jp/releases/3410583/)【検索】
- 個人向け販売は2025年（12月）に開始（「『教科書が、わかる。』を全ての人へ。中学生向け生成AI学習サービスをリリース」） — [PR TIMES](https://prtimes.jp/main/html/rd/p/000000204.000115774.html)【検索】（提供主体は検索要約では東京書籍とされるが、本文未確認）

**スマイルゼミ 中学生コース（ジャストシステム）**
- AIを活用した「24時間質問対応」と「リアルタイム添削指導」を2026-04-01から提供。「**対話で導く教材 Coachez**」を用いて24時間いつでも質問可能 — [ジャストシステム 2025-11-18](https://www.justsystems.com/jp/news/j20251118c.html)【検索】

**進研ゼミ（ベネッセ）**
- 「チャレンジ AI学習コーチ」（2024年）：家庭学習中の疑問をAIにすぐ質問。過去55年の指導データを活用し、**答えを直接教えず、AIとの対話で自己解決力を培う**設計（対象講座は記事から不明。名称から小学講座の可能性＝推論） — [AIsmiley](https://aismiley.co.jp/ai_news/shinkenzemi-generative-ai-learningcoach/)【検索・(旧)】
- 新「進研ゼミ 高校講座」2026-03-25開始：家庭学習向け生成AI活用アプリで「ビジュアル解説」、「AIテスパ」 — [リセマム PR 2026-03-24](https://resemom.jp/release/prtimes/20260324/175833.html)【検索】
- 中学講座の生徒向けAI質問機能（2026年）は確認できず【検索】

**スタディポケット（汎用生成AIの学校向け）**
- 教員向け・生徒向け・英会話の3製品、90自治体・1,000校以上（第三者） — [aipicks](https://aipicks.jp/tool/studypocket)【検索・二次】
- 経済産業省「探究・校務改革支援補助金2025」に採択、2026年3月末まで無料導入可（申込は2025年4月10日まで） — [リセマム PR 2025-03-31](https://resemom.jp/release/prtimes/20250331/140349.html)【検索】
- 山口県の中学校7校・約1,500人で2024年6月から。岐阜市と実証事業 — [ASCII（出典推定。検索結果の ASCII 記事3件のいずれか）](https://ascii.jp/elem/000/004/201/4201366/)【検索・要確認】。2026年度から教員向けを永年無償化する方針（第三者情報、公式未確認） — [aipicks partner](https://aipicks.jp/partners/partner-3589a6)【検索・要確認】

**答えを示す型（写真→解答）**
- QANDA（Mathpresso）：2020年に日本を含む6か国で教育アプリ首位、50か国以上で月間700万人 — [BusinessWire 2020](https://www.businesswire.com/news/home/20201216005262/en/EdTech-Leader-Mathpresso-Announces-7-Million-Monthly-Active-Users-in-over-50-Countries)【検索・(旧)】。「中学生の勉強」アプリランキングで2位（時点不明） — [AppBank](https://www.appbank.net/app-rank/study-app/juniorhighschool-study)【検索】
- Gauth（ByteDance）：日本の利用規模データは見つからず。利用上位地域は米国・ベトナム・英国（Similarweb、アプリID要確認） — [Similarweb](https://similarweb.com/ja/app/apple/919087726)【検索・要確認】
- Photomath：Google が買収（2023年完了） — [Wikipedia](https://en.wikipedia.org/wiki/Photomath)【記憶】
- 日本語の答え提示型アプリが多数：「AI写真数学ソルバー：数学の達人」 — [App Store](https://apps.apple.com/jp/app/ai%E5%86%99%E7%9C%9F%E6%95%B0%E5%AD%A6%E3%82%BD%E3%83%AB%E3%83%90%E3%83%BC-%E6%95%B0%E5%AD%A6%E3%81%AE%E9%81%94%E4%BA%BA-%E3%81%99%E3%81%86%E3%81%8C%E3%81%8F%E3%81%AE%E3%81%9F%E3%81%A4%E3%81%98%E3%82%93/id6596742896)、「AI ワーク：勉強答え そして 宿題答えアプリ」 — [App Store](https://apps.apple.com/jp/app/ai-%E3%83%AF%E3%83%BC%E3%82%AF-%E5%8B%89%E5%BC%B7%E7%AD%94%E3%81%88-%E3%81%9D%E3%81%97%E3%81%A6-%E5%AE%BF%E9%A1%8C%E7%AD%94%E3%81%88%E3%82%A2%E3%83%97%E3%83%AA/id6473525880)、Mathos AI（日本語ページ） — [Mathos](https://www.mathos.ai/ja/feature/ai-tutor)、MathGPTPro（日本語） — [MathGPTPro](https://www.mathgptpro.com/ja)【検索】

**その他（2025〜2026）**
- 金沢工業大学：数学担当「マスコ」・物理担当「カンタ」が対話形式で答えるAIチャットボットを公開（2026年9月、大学向け） — [リセマム 2026-09-08](https://resemom.jp/article/2026/09/08/87465.html)【検索】
- 自治体の生成AI導入率（行政業務）：都道府県87%、指定都市90%、その他市区町村30%（令和6年度末） — [総務省資料](https://www.soumu.go.jp/main_content/001018084.pdf)【検索】

### Inferences
- 【推論】分類表

| 製品 | 型 | 生成AI | 対話の質 | 主な場面 | 規模（判明分） |
|---|---|---|---|---|---|
| Qubena | アダプティブドリル | 確認できず | 低 | 学校（授業・家庭） | 170以上の自治体・約2,300校（2023） |
| すらら／すららドリル | アダプティブ＋台本型レクチャー | 確認できず | 中（台本） | 学校・塾・家庭 | 3,100以上の学校・塾、26万人（2026） |
| atama+ | アダプティブ（塾）＋生成AI質問（2026年3月〜） | あり | 中（写真→解説・ヒント） | 塾 | 4,500以上の教室（2025年5月） |
| スタディサプリ | 映像授業＋演習 | 数学では確認できず | 低 | 家庭・学校 | 不明 |
| 進研ゼミ | 通信教育＋AI学習コーチ／高校講座AI | あり | 中（答えを直接言わない設計を主張） | 家庭 | 不明 |
| スマイルゼミ中学生コース | タブレット通信＋AI質問・添削（2026年4月〜） | あり | 中〜高（「対話で導く」） | 家庭 | 不明 |
| 教科書AIワカル | 教科書準拠Q&A（数と式のみ） | あり | 中（質問応答） | 家庭・個人 | 不明 |
| スタディポケット | 汎用生成AI（学校向け） | あり | 汎用 | 学校 | 90自治体・1,000校以上（二次） |
| QANDA／Gauth／Photomath／各種ソルバー | 答え提示 | あり | 低（答えを示す） | 家庭 | QANDA 2020年首位（旧） |

- 【推論】2026年の動きは「写真で質問→ヒント・解説」という**家庭・塾向けの質問対応**に収束している。**授業中・教師主導・発問の系列で進む対話**という領域は空いている。
- 【推論】最も直接的な将来の競合は**教科書出版社**（教科書AIワカル）。「数と式」から他領域・他学年・学校ライセンスへ広がり、ソクラテス式の流れを加える可能性がある。ただし1社の教科書に紐づくため、kazu は学習指導要領コードで**教科書に依存しない**ことで差別化できる。
- 【推論】日本の中学生は答え提示型ソルバーに容易にアクセスできるため、「答えを言わない」設計だけでは生徒に選ばれにくい。授業の中で使わせる（教師の文脈がある）ことが、ソクラテス式が機能する前提になる。

### Gaps
- Monoxer、Z会のAI機能、Qubena の2026年の数字・生成AI対応、教科書AIワカルの価格・学校版・ソクラテス式かどうか、スマイルゼミの会員数・価格、学習塾チェーン（明光義塾、個別指導系、東進など）の「AI先生」、みんがく等の学校向け生成AI基盤は**未調査**（検索予算切れ）。
- 学校・塾での「1生徒あたり価格」の公的データは見つからなかった。

---

## 3. LLMチューターと学習成果のエビデンス、そして文科省の生成AIガイドライン

### Takeaway
エビデンスはほぼ一貫している：**ガードレールなしの答え提示型LLM利用は、練習中の成績を上げても補助なしの学習成果を下げうる**（Bastani ら PNAS 2025）。一方、**検証済みの解答に基づき教育的に制約されたチューター**は害を避け、大きな効果も出しうる（Harvard 物理RCT、ナイジェリア、ガーナの Rori）。**人間が関与する設計**（Tutor CoPilot、Eedi×DeepMind）も効果を示す。数学の正確さは依然リスクで、「AIに自分で解かせず、検証済みの木・解答に縛る」ことが要。文科省ガイドライン Ver.2.0（2024年12月）は条件付きで児童生徒の利用を認める（発達段階、規約上の年齢制限、個人情報など）。**それ以降の改訂は今回確認できなかった**。

### Cited Findings

**主要研究**
- **Bastani ら（PNAS, 2025）「Generative AI without guardrails can harm learning」**：トルコの高校生約1,000人のフィールド実験。GPT Base（ChatGPT相当）と GPT Tutor（教師設計のプロンプトでヒントを出し答えを渡さない、正解を事前に与える）を比較。練習中の成績は Base +48%、Tutor +127%。その後の**補助なし試験で Base は対照群より −17%**、Tutor は害をほぼ回避。生徒は学習が損なわれたと自覚していなかった。素の GPT-4 は解答を頻繁に誤った — [PNAS](https://www.pnas.org/doi/10.1073/pnas.2422633122)【記憶】
- **Kestin ら（Scientific Reports, 2025）**：Harvard の物理入門、約194人のクロスオーバーRCT。研究に基づく教授法を組み込み、**事前に書かれた段階的解答で誤答を防いだ**GPT-4チューターが、授業内アクティブラーニングに比べ**より短時間で2倍以上の学習**（効果量 約0.73〜1.3SD）。大学生・単発トピックの研究である点に注意 — [Scientific Reports](https://www.nature.com/articles/s41598-025-97652-6)【記憶】
- **世界銀行ナイジェリア（エド州）パイロット**：2024年の6週間の放課後プログラム、教師の指導付きで GPT-4（Microsoft Copilot）を**英語**学習に使用、約0.3SDの効果、費用対効果が高い。**数学ではない** — [World Bank Blog「From chalkboards to chatbots」](https://blogs.worldbank.org/en/education/From-chalkboards-to-chatbots-Transforming-learning-in-Nigeria)【記憶・URL要確認】
- **Tutor CoPilot（Wang ら, 2024）**：チューター900人・K-12生徒1,800人のRCT。AIが**人間チューターに**助言。トピック習得 +4pt、評価の低いチューターの生徒では +9pt。チューターは誘導の問いを増やし、答えを渡すことが減った。費用はチューター1人あたり年約20ドル — [arXiv 2410.03017](https://arxiv.org/abs/2410.03017)【記憶・(旧)】
- **Rori（ガーナ, Henkel ら, 2024）**：WhatsApp上のGPT-4数学チューター、8か月で +0.37SD、生徒1人あたり約5ドル — [arXiv 2402.09809](https://arxiv.org/abs/2402.09809)【記憶・(旧)】
- **LearnLM 技術報告（Google, 2024年12月）**：教育的指示追従。専門家評価で GPT-4o より31%、Claude 3.5 Sonnet より11%、Gemini 1.5 Pro より13%好まれた — [arXiv 2412.16429](https://arxiv.org/abs/2412.16429)【記憶・(旧)】。2025年5月の「arena for learning」評価で Gemini 2.5 Pro が専門家の一対比較の約73%で選好 — [arXiv 2505.24477](https://arxiv.org/abs/2505.24477)【記憶・ID要確認】
- **Eedi × DeepMind（2025年11月）**：人間監督付きAIで転移 +10pt vs 人間のみ +4.5pt（予備的）、第2弾RCT 1,525人 — §1参照【検索】
- **Lehmann ら（2024/25）「AI Meets the Classroom」**：LLMを説明の補完として使うと有益、**練習の代替として使うと有害**。生徒は自分の学習を過大評価 — [arXiv 2409.09047](https://arxiv.org/abs/2409.09047)【記憶】
- **Fan ら（BJET, 2025）「Beware of metacognitive laziness」**：ChatGPTは課題成績を上げたが知識獲得・転移は改善せず — [BJET](https://doi.org/10.1111/bjet.13544)【記憶】
- **Kosmyna ら「Your Brain on ChatGPT」（MIT, 2025年6月, プレプリント, n=54）**：LLMでの作文で脳の関与・所有感が低下 — [arXiv 2506.08872](https://arxiv.org/abs/2506.08872)【記憶・小標本】
- **MathTutorBench（2025）**：教科の専門性と教える力（教授法）はトレードオフになりうる — [arXiv 2502.18940](https://arxiv.org/abs/2502.18940)【記憶】
- **利用実態**：大学生の会話の約47%が「Direct」 — [Anthropic](https://www.anthropic.com/news/anthropic-education-report-how-university-students-use-claude)【確認】
- 主要ベンダーは効果研究を「予備的」と自ら位置づけ（Eedi） — [Eedi](https://www.eedi.com/news/new-exploratory-research-from-eedi-and-google-deepmind-reveals-human-in-the-loop-ai-tutoring-outperforms-human-only-support)【検索】

**文部科学省「初等中等教育段階における生成AIの利活用に関するガイドライン（Ver.2.0）」（2024-12-26）**
- 所在：[文科省「生成AIの利用について」](https://www.mext.go.jp/a_menu/other/mext_02412.html)、[Ver.2.0 PDF](https://www.mext.go.jp/content/20241226-mxt_shuukyo02-000030823_001.pdf)【記憶】
- 要点（すべて【記憶】・要原文確認）：①2023年7月の暫定ガイドライン（Ver.1.0）の改訂版。②「人間中心の利活用」と、情報活用能力の一部としての「生成AIを使いこなす力」の育成。③児童生徒の利用は発達段階に応じ、学習指導要領の資質・能力の育成に資するかで判断（Ver.1.0 は小学生の直接利用に慎重な対応を求めていた）。④**各サービスの利用規約（年齢制限・保護者同意）の順守**、入力データの学習利用オフ等の設定、個人情報・プライバシー、著作権、情報セキュリティへの留意。⑤不適切例（生成物をそのまま自分の成果として提出、定期考査や小テストで使わせる、感性・独創性を発揮させたい場面で安易に使わせる 等）と適切例（誤りを含む回答を教材に性質・限界に気づかせる、英会話の相手、議論を深めるための活用 等）。⑥教師の校務での活用を推進。
- 関連：教育情報セキュリティポリシーに関するガイドライン — [文科省](https://www.mext.go.jp/a_menu/shotou/zyouhou/detail/1397369.htm)【記憶・URL要確認】
- 年齢・規約（確認済みの部分）：Claude.ai は18歳以上 — [Anthropic Consumer Terms](https://www.anthropic.com/legal/consumer-terms)【確認】。API で未成年向けサービスを作る場合の安全策・AI開示義務 — [Claude Help Center](https://support.claude.com/en/articles/9307344-responsible-use-of-anthropic-s-models-guidelines-for-organizations-serving-minors)【確認】。ChatGPT は13歳以上・保護者同意 — [OpenAI Terms](https://openai.com/policies/terms-of-use)【記憶】

### Inferences
- 【推論】kazu の設計（核心は言わない／補助発問の階段／オフライン台本／発問の木に答え・誤概念を事前に持たせる）は、エビデンス上「害を避けて効果を出した」側（Bastani の GPT Tutor、Kestin の事前解答付きチューター）と同じ方向にある。**AIに数学を自力で解かせず、木の expected／misconceptions に縛る**ことが数学の正確さ対策として最も効く。
- 【推論】生徒は答えを引き出そうとする（47% Direct）。「答え教えて」への応答方針、連続失敗時の説明ステップへの移行条件、手書き画像だけ送る抜け道への対策が必要。
- 【推論】生徒は学習を過大評価する（Bastani、Lehmann）→ 対話の後に**補助なしの確認問題**（既存の QR 小テスト）を置き、効果を測る設計が理にかなう。
- 【推論】人間関与の設計（Tutor CoPilot、Eedi×DeepMind）が有望 → 授業中モードで教師ダッシュボードから介入・上書きできることは、エビデンスにも沿う差別化。
- 【推論】ステップ3（二択・4択）は「漏斗型（funneling）」の誘導になりやすい。選択後に「なぜ？」を問う設計（既に指針⑯にある）を必須にすべき。
- 【推論】日本の中学生を対象にしたLLM数学チューターのRCTは今回見つからず、**日本語・日本の授業文脈でのエビデンスは空白**。

### Gaps
- 2025〜2026年のブルッキングス研究所の報告（AIの子どもへのリスクが現時点で利益を上回るとする趣旨）や OECD Digital Education Outlook 2026 は、手がかりはあるが今回確認できず（要検索）。
- 「ソクラテス式 vs 答え提示」を直接比較した2026年の新しいRCT、数学の正答率（日本語）を測った研究は未調査。
- 文科省ガイドラインの Ver.2.0 以降の改訂、中教審（次期学習指導要領）での生成AIの扱い、生成AIパイロット校の最新成果は未確認。
- 日本の教育委員会が、生徒向けに外部LLM API を使うアプリをどう審査しているか（佐賀県を含む）は未調査。

---

## 4. 構造化された「発問」・誤概念データセット（グローバル／日本）― ブルーオーシャン確認

### Takeaway
英語圏には豊富な構造化データがある：Eedi の診断問題と誤概念タグ（Kaggle 2024「Eedi – Mining Misconceptions in Mathematics」）、生徒の説明文の誤概念データ（MAP／MIME）、ASSISTments、MathDial（チューター対話）、NCTE・TalkMoves（授業の発話）。日本では国立教育政策研究所の全国学力・学習状況調査の報告書に誤答分析・解答類型・授業アイディア例があるが PDF 中心。**GitHub 検索では、日本語で機械可読な中学数学の「発問×誤概念」データセットは見つからなかった**（見つかった日本語の発問データセットは高校「情報I」のもの1件のみ）。kazu の中1全122授業の発問の木（中心発問308、想定誤答×誤概念385、補助発問538）は、確認できた範囲では**唯一の存在**。

### Cited Findings

**グローバル**
- Kaggle「Eedi – Mining Misconceptions in Mathematics」：診断用4択問題の誤答選択肢を誤概念（約2,587種）に対応づける課題、評価は MAP@25、2024年9〜12月 — [Kaggle](https://www.kaggle.com/competitions/eedi-mining-misconceptions-in-mathematics)【記憶。コンペとデータページの存在は GitHub メタデータで確認】
- 上位解法は LLM の retriever＋reranker（Qwen2.5）。1位解法リポジトリ（2024-12作成） — [GitHub rbiswasfc](https://github.com/rbiswasfc/eedi-mining-misconceptions)【確認：メタデータ】。5位・8位・10位の解法も公開 — [5位](https://github.com/ebinan92/Eedi-5th-solution)、[10位](https://github.com/shyoulala/Kaggle_Eedi_2024_sayoulala)【確認：メタデータ】
- Eedi の NeurIPS 2020 教育チャレンジ：約11.9万人・約2.76万問・約1,590万回答 — [arXiv 2007.12061](https://arxiv.org/abs/2007.12061)【記憶・(旧)】
- Diagnostic Questions（Craig Barton、Eedi の源流）：各誤答が特定の誤概念を示すよう設計された4択問題 — [diagnosticquestions.com](https://diagnosticquestions.com)【記憶】
- 誤答選択肢（distractor）の自動生成研究（NAACL 2024 Findings） — [GitHub umass-ml4ed](https://github.com/umass-ml4ed/prompt_distractor_generation_NAACL)【確認：メタデータ】
- **MIME データセット（2026-08作成）**：「Misunderstandings in Math Explanations」＝15の数学問題に対する5万2,000件超の生徒の説明を専門家が採点した、誤概念と指導上重要な誤りのベンチマーク — [GitHub scrosseye/mime_dataset](https://github.com/scrosseye/mime_dataset)【確認：メタデータ】
- Kaggle「MAP – Charting Student Math Misunderstandings」（2025年、生徒の説明文から誤概念を分類） — [Kaggle](https://www.kaggle.com/competitions/map-charting-student-math-misunderstandings)【記憶・URL要確認】（MIME との関係は推論）
- MathDial（2023）：多段階の文章題で、教師が「誤概念を持つLLM模擬生徒」を指導した約3,000の対話 — [arXiv 2305.14536](https://arxiv.org/abs/2305.14536)【記憶・(旧)】。MathDial の誤概念をLLMで注釈するリポジトリ（2026-06） — [GitHub](https://github.com/ut6817150/Misconception-LLM-Annotation_Mathdial_Dataset)【確認：メタデータ】
- NCTE Transcripts：小学校算数の授業記録1,660件と教師の発話（問い・取り上げ等）の注釈 — [arXiv 2211.11772](https://arxiv.org/abs/2211.11772)【記憶・(旧)】。TalkMoves（K-12数学授業の talk moves 注釈） — [arXiv 2204.09652](https://arxiv.org/abs/2204.09652)【記憶・(旧)】
- ASSISTments の公開データ（よくある誤答へのフィードバック設計） — [ASSISTments data](https://sites.google.com/site/assistmentsdata/)【記憶・(旧)】
- 中学代数の誤概念ベンチマーク（55の誤概念） — [arXiv 2412.03765](https://arxiv.org/abs/2412.03765)【記憶・ID要確認】
- 教育×LLM論文の網羅リスト — [GitHub awesome-ai-llm4education](https://github.com/GeminiLight/awesome-ai-llm4education)【確認：メタデータ】

**日本**
- 国立教育政策研究所「全国学力・学習状況調査」：報告書（設問ごとの解答類型・誤答分析・学習指導の改善）と「授業アイディア例」を公開。主に PDF — [国立教育政策研究所](https://www.nier.go.jp/kaihatsu/zenkokugakuryoku.html)【記憶】
- 文科省「学習指導要領コード」（教育データ標準）：学習指導要領の内容項目ごとの機械可読コード — [文科省 教育データ標準](https://www.mext.go.jp/a_menu/other/data_00001.htm)【記憶・URL要確認】
- GitHub リポジトリ検索（2026-10-14実施）：「誤概念 数学」＝**0件**。「つまずき 数学」＝1件（「かわの塾 数学つまずき診断」HTMLツール、2026-06） — [GitHub](https://github.com/kawanojuku-cpu/kawanojuku_shindan)【確認】。「発問」＝190件中、データセットは「**高等学校情報Iに関する発問データセット**」（mmi-kit/TutoringData、2021-09作成・2025-04更新）のみ — [GitHub mmi-kit/TutoringData](https://github.com/mmi-kit/TutoringData)【確認：メタデータのみ】
- 教師コミュニティの指導案共有（発問・指示を含む）：TOSSランド — [TOSSランド](https://land.toss-online.com/)【記憶・URL要確認】。構造化・機械可読ではない【推論】
- **kazu の発問の木**：中1全7章122授業、中心発問308、想定誤答×誤概念385、補助発問538。発問の型タグ（②類推63、①目的・願望56、分類→定義化52、③揺さぶり49、正誤判断40、④アハ36）。各ノードに answerType・board・skipIf・expected・misconceptions・aids を持つ JSON — ローカルファイル `/home/user/math-dialogue/src/data/dialogue/questionTrees.json`、スキーマ `/home/user/math-dialogue/docs/発問の木_スキーマとサンプル.md`【確認：ローカル】。出典は「発問バンク_中1数学.xlsx」、各授業に教科書ページ（page）と「原文の学習課題」（hatsumon）を含む — `/home/user/math-dialogue/src/data/dialogue/questionBank.json`【確認：ローカル】

### Inferences
- 【推論】**ブルーオーシャン判定：「日本語・機械可読・中学数学・発問の系列×誤概念」データは、少なくとも GitHub 上には存在しない**。英語圏の Eedi が「誤概念タグ付き診断問題 → 診断 → 個別指導 → 大規模データ → 機械学習コンペ → 研究コミュニティ」という循環を作ったのに対し、日本にはその起点となる公開タクソノミーがない。
- 【推論】Eedi のデータは「1問の誤答→1誤概念」の静的な対応だが、kazu の木は「**発問の系列**（中心発問→飛ばし条件→補助発問の階段）×誤概念」という**対話の動的構造**を持ち、英語圏にも同種の公開データは少ない（MathDial は対話だが授業設計の木ではない）。
- 【推論】公開時の注意：hatsumon・nerai が教科書・指導書の文言の転記なら著作権の確認が必要。教科書ページ番号より学習指導要領コードで紐づけるほうが教科書非依存になる。

### Gaps
- Hugging Face、Kaggle、J-STAGE、国立情報学研究所 IDR、SIGNATE、日本数学教育学会の資料は**未確認**（GitHub 以外は今回検索できなかった）。
- Eedi のデータライセンス（商用・再配布可否）、2,587という誤概念数は要原典確認。
- NIER の誤答分析に機械可読版（CSV等）があるか、個票データ貸与の条件は未確認。
- 筑波大学附属校・日本数学教育学会の発問研究・誤概念研究の体系的な一覧は未調査。

---

## 5. 学校規模でLLMチューターを動かす費用（1生徒・年）と、日本の学校・自治体の支払い方

### Takeaway
2026年10月の Claude 価格で、発問の木をキャッシュして対話する場合、**1セッション（1授業分の対話）あたり Haiku 5.5 で約0.005ドル、Sonnet 5.5 で約0.11ドル、Opus 5.5 で約0.23ドル**。中1数学の全授業（年140時間）で毎回使っても **Haiku 5.5 なら1生徒・年1ドル未満**、Sonnet 5.5 で約16ドル、Opus 5.5 で約32ドル。費用を決めるのは使用量より**モデル選択**。市販のK-12チューターは1生徒年15〜44ドル以上、または1校年£3,500程度。日本の学校向けAI教材は主に自治体予算で導入され、経産省補助金による初年度無料が普及の入口になってきた。

### Cited Findings
- **Claude API 価格（2026-10-14取得、1Mトークンあたりドル）**【確認】 — [Claude 価格表](https://platform.claude.com/docs/en/about-claude/pricing)
  - Claude Haiku 5.5（プロンプト10万トークン以下）：入力0.10／出力0.50、キャッシュ読取0.01、5分キャッシュ書込0.125、1時間書込0.20（10万超は入力0.50／出力2.50）
  - Claude Sonnet 5.5：入力2／出力10、キャッシュ読取0.10、5分書込2.50、1時間書込4
  - Claude Opus 5.5：入力4／出力20、キャッシュ読取0.20、5分書込5、1時間書込8
  - Claude Haiku 4.5：入力1／出力5
  - Batch API は入出力とも50%引き。米国内推論指定は1.1倍
- 画像のトークン数は ⌈幅/28⌉×⌈高さ/28⌉（例：1092×1092px＝1,521トークン） — [Claude Vision ドキュメント](https://platform.claude.com/docs/en/build-with-claude/vision)【確認】
- 比較用の価格：Khanmigo 個人年44ドル — [nibble-app](https://nibble-app.com/blog/khan-academy-pricing)【検索】、学区1生徒15ドル — [Khan Academy blog](https://blog.khanacademy.org/?p=18400)【検索】、Skye 年£3,500/校〜 — [TSL](https://thirdspacelearning.com/maths-tutoring/primary/ai-tutor)【検索】、Synthesis 家族年約119ドル — [Homeschool Fox](https://homeschoolfox.com/curriculum/synthesis-tutor)【検索】、Tutor CoPilot チューター1人年約20ドル — [arXiv 2410.03017](https://arxiv.org/abs/2410.03017)【記憶】、Rori 生徒1人約5ドル — [arXiv 2402.09809](https://arxiv.org/abs/2402.09809)【記憶】
- 他社API（**今回未再検証**、2025年後半〜2026年前半の既知値）：OpenAI GPT-5 入力1.25／出力10、GPT-5 mini 0.25／2、GPT-5 nano 0.05／0.40 — [OpenAI API Pricing](https://openai.com/api/pricing/)【記憶】。Gemini 2.5 Flash 0.30／2.50、2.5 Flash-Lite 0.10／0.40 — [Gemini API Pricing](https://ai.google.dev/gemini-api/docs/pricing)【記憶】
- 中学校数学の標準授業時数：中1＝140、中2＝105、中3＝140単位時間（学校教育法施行規則 別表第二） — [e-Gov 法令検索](https://laws.e-gov.go.jp/law/322M40000080011)【記憶】
- 日本の支払い方の実例：経産省「探究・校務改革支援補助金2025」で初年度無料（スタディポケット） — [リセマム PR 2025-03-31](https://resemom.jp/release/prtimes/20250331/140349.html)【検索】。自治体による一括導入（流山市の中学校10校「すららドリル」、八千代市「Qubena」） — [PR TIMES](https://prtimes.jp/main/html/rd/p/000000610.000003287.html)、[AIsmiley](https://aismiley.co.jp/ai_news/qubena-yachiyo-city/)【検索】。atama+ は塾経由の提供 — [atama plus 会社資料](https://speakerdeck.com/player/7649d5669dbb4a4d990387f722687585)【検索】

### Inferences
- 【推論】**費用試算**（調査者の計算。前提：1セッション＝AIの応答15回、システム指示＋その授業の発問の木＝5,000トークンを1時間キャッシュ、1ターンの新規分250トークン、手書き画像3枚（1000×750px≒972トークン）、出力は1ターン300トークン（Haiku）／400トークン（Sonnet・Opus、思考を含む）。サーバー費・再試行・モデレーション呼び出しは含まない。1ドル＝150円と仮定）

| モデル | 1セッション | 年35回（週1） | 年70回 | 年140回（中1の全授業） | 300人校×140回 |
|---|---|---|---|---|---|
| Haiku 5.5 | 約0.0054ドル | 0.19ドル | 0.38ドル | **0.76ドル** | 約227ドル（約3.4万円） |
| Sonnet 5.5 | 約0.113ドル | 3.95ドル | 7.90ドル | 15.80ドル | 約4,739ドル（約71万円） |
| Opus 5.5 | 約0.226ドル | 7.90ドル | 15.80ドル | 31.59ドル | 約9,478ドル（約142万円） |
| 混合（対話は Haiku、手書き読取だけ Sonnet） | 約0.017ドル | — | — | 約2.44ドル | 約732ドル（約11万円） |

- 【推論】発問の木の生成（中2・中3の245授業、1授業あたり入力2万・出力8,000トークン、Opus 5.5）は通常約59ドル、Batch API で約29ドル。**木の量産コストは無視できるほど小さい**。ボトルネックは教師のレビュー時間。
- 【推論】日本語はトークン数が多めになりやすく、思考トークンも出力課金されるため、実ログでの再計測が必要。それでも「無料で配る」ことは Haiku 級＋オフライン台本なら現実的（1県の中1全員でも年数千ドル規模の見込み）。
- 【推論】支払いモデルの選択肢：(a) 教師が自分のAPIキーを入れる、(b) 自治体・財団の寄付でAPI費を負担、(c) 学校単位で上限付きのプロキシ、(d) オフライン台本のみ（費用ゼロ）。

### Gaps
- 日本の自治体がAIドリル・生成AIに払う1生徒あたり単価（Qubena、すらら、atama+ 等）は見つからなかった。
- 地方財政措置（学習用ソフトウェアの交付税措置）の2025年度以降の枠組み、GIGA第2期でソフトウェアが対象になるかは未確認。
- 2026年10月時点の OpenAI・Gemini 価格と為替は未確認。

---

## 6. 残っているニッチ：教科課程に沿った教師設計の問いの木、黒板中心のUI、授業中の利用、発問設計支援、模擬授業用のAI生徒

### Takeaway
空いているのは次の5つ。(1) **教科課程に沿い教師が設計した発問の木を LLM の制御層にする**（大手は汎用、日本の既存勢はドリル・質問対応）。(2) **生徒の言葉で板書を共につくる黒板中心のUI**（類似製品は見つからず）。(3) **授業中、教師が全体を進めながら AI が詰まった生徒を担当する**使い方と、誤概念で色分けしたリアルタイムダッシュボード（英語圏の SchoolAI／MagicSchool に監視機能はあるが、日本語・数学・誤概念ベースは見当たらない）。(4) **教師向けの発問設計アシスタント**（汎用の教材生成AIはあるが、発問の系列・誤概念・補助発問まで構造化するものは見当たらない）。(5) **模擬授業用のAI生徒**（海外には人間操作型シミュレータとLLM研究があるが、日本語のものは確認できず）。

### Cited Findings
- 監視・教師設定型の生徒AI（英語圏）：SchoolAI「Mission Control」 — [SchoolAI ヘルプ](https://help.schoolai.com/en/articles/10270211-getting-started-with-spaces)【検索】、MagicSchool の student room — [UBC ブログ](https://blogs.ubc.ca/etec523/?p=11817)【検索】
- 教師が基準を作り、AIが説明を評価：Snorkl — [Educators Technology](https://www.educatorstechnology.com/2026/10/snorkl-ai-review-for-teachers.html)【検索】
- 教科書準拠の質問対応（発問の系列ではない）：教科書AIワカル — [リセマム](https://resemom.jp/release/prtimes/20260427/181153.html)【検索】
- 教師向け汎用生成AI：スタディポケット（教員向け） — [aipicks](https://aipicks.jp/tool/studypocket)【検索】、MagicSchool（教師ツール80以上） — [aitoolsatlas](https://aitoolsatlas.ai/compare/magicschool-vs-school-ai)【検索】、ChatGPT for Teachers（米国のみ無料） — [eWeek](https://www.eweek.com/news/chatgpt-for-teachers-launch-openai/)【検索】
- 模擬生徒・学習者シミュレーション：
  - 「学習者シミュレーションを評価する Python ライブラリ」EvalConvoLearn（Renaissance Philanthropy、2026-05作成） — [GitHub](https://github.com/RenaissancePhilanthropy/EvalConvoLearn)【確認：メタデータ】
  - MathDial は「誤概念を持つLLM模擬生徒」を教師が指導して収集 — [arXiv 2305.14536](https://arxiv.org/abs/2305.14536)【記憶】
  - 人間が操作する教員養成シミュレータ：Mursion — [mursion.com](https://www.mursion.com/)【記憶】、TeachLivE（セントラルフロリダ大学）【記憶・URL未確認】
  - LLM研究：TeachTune（多様な生徒プロファイルの模擬生徒で教育エージェントを点検） — [arXiv 2410.04078](https://arxiv.org/abs/2410.04078)【記憶・ID要確認】、SimClass（LLMエージェントで教室を模擬） — [arXiv 2406.19226](https://arxiv.org/abs/2406.19226)【記憶・ID要確認】、GPTeach（TA研修用の模擬生徒、Stanford, 2023）【記憶・URL未確認】
- 日本語の模擬授業AI・AI生徒：今回は検索予算切れで**確認できず**【―】
- kazu は既に「数学ラボ」用に5段階のテスト用ペルソナ（Lv1〜Lv5）を文書化している — `/home/user/math-dialogue/docs/test-personas.md`【確認：ローカル】

### Inferences
- 【推論】ニッチごとの競争の強さ

| ニッチ | 英語圏 | 日本 | kazu の既存資産との適合 |
|---|---|---|---|
| 教科課程に沿う教師設計の発問の木×LLM | 弱（SchoolAI は自由文、Eedi は4択） | **空白**（ドリル・質問対応のみ） | ◎ 発問の木122授業 |
| 黒板中心・生徒の言葉で板書が育つUI | 見当たらず | 見当たらず | ◎ AI対話アプリ、授業ナビの板書計画 |
| 授業中にAIが詰まった生徒を担当、誤概念ダッシュボード | 中（SchoolAI、MagicSchool） | **空白** | ○ 教師ダッシュボード、Supabase |
| 教師向け発問設計アシスタント | 中（汎用の教材生成） | 弱（汎用のみ） | ◎ スキーマ＋122例＋授業ナビ |
| 模擬授業用AI生徒（日本語） | 研究段階＋人間操作型 | **確認できず** | ○ 誤概念385＋ペルソナ |
| 答えを言わない家庭学習の質問対応 | 強（大手3社） | 強（atama+、スマイルゼミ、教科書AIワカル） | △ 正面から戦わない |

- 【推論】家庭学習の「写真で質問」は大手と出版社が占めつつあるため、kazu は**授業の中**（教師・黒板・クラス全体）に軸足を置くのが最も差別化しやすい。

### Gaps
- 日本の教員養成大学・教育センターでの模擬授業AIの事例、「AIによる発問生成」の日本語研究、教科書会社の教師向けAI（指導書AI等）は未調査。
- Gemini／Copilot の Japanese K-12 における教師向け機能の普及度は未確認。

---

## Gaps and opportunities for kazu

### Takeaway
最大の空白は「**日本の授業の発問文化（授業研究）を、機械可読な発問の木として公開し、LLMを“台本の中で”動かす**」こと。英語圏の Eedi に相当する公開の誤概念タクソノミーも、授業中に使う日本語の対話型数学AIも、模擬授業用の日本語AI生徒も見つからなかった。kazu は既にその核（中1全122授業・誤概念385・補助発問538、黒板UI、オフライン台本、ダッシュボード）を持ち、Haiku 級なら1生徒・年1ドル未満で動かせる。勝ち筋は「量産」ではなく、**他の教師が使い・直し・共有できる形（オープン・教科書非依存・安心導入）にする**こと＝kazu の「掛け算」の思想そのもの。

### Cited Findings（機会の根拠）
- 日本語・機械可読の中学数学「発問×誤概念」データは GitHub に見当たらない（「誤概念 数学」0件、唯一の日本語の発問データセットは高校情報I） — [GitHub mmi-kit/TutoringData](https://github.com/mmi-kit/TutoringData)【確認】
- 英語圏では誤概念タグ付き診断問題が大規模研究とコンペを生んだ（Kaggle Eedi 2024、上位解法の公開） — [GitHub rbiswasfc](https://github.com/rbiswasfc/eedi-mining-misconceptions)【確認】、[Kaggle](https://www.kaggle.com/competitions/eedi-mining-misconceptions-in-mathematics)【記憶】
- 日本の2026年の新機能は家庭・塾向けの質問対応（atama+、スマイルゼミ、教科書AIワカル） — [koubo.jp](https://koubo.jp/article/52020)、[ジャストシステム](https://www.justsystems.com/jp/news/j20251118c.html)、[リセマム](https://resemom.jp/release/prtimes/20260427/181153.html)【検索】
- 教師が監視・介入できる生徒AIの需要（英語圏で SchoolAI・MagicSchool が実装） — [SchoolAI](https://schoolai.com/spaces)【検索】
- 人間関与＋AIで転移が伸びた予備的結果（Eedi×DeepMind） — [Eedi](https://www.eedi.com/news/new-exploratory-research-from-eedi-and-google-deepmind-reveals-human-in-the-loop-ai-tutoring-outperforms-human-only-support)【検索】
- 未成年向けに Claude API を使う場合の安全策・AI開示義務 — [Claude Help Center](https://support.claude.com/en/articles/9307344-responsible-use-of-anthropic-s-models-guidelines-for-organizations-serving-minors)【確認】
- Claude Haiku 5.5 は入力0.10／出力0.50ドル（1Mトークン）、キャッシュ読取0.01ドル — [Claude 価格表](https://platform.claude.com/docs/en/about-claude/pricing)【確認】
- kazu の資産：発問の木（122授業・中心発問308・誤概念385・補助発問538）、ペルソナ文書 — ローカル `/home/user/math-dialogue/src/data/dialogue/questionTrees.json`、`/home/user/math-dialogue/docs/test-personas.md`【確認】

### Inferences（具体的な機会。優先度順。すべて【推論】）

1. **「発問の木」を日本初の公開データにする（最優先）**
   - 中身：122授業の JSON を、JSON Schema・検証スクリプト・版管理（変更履歴）・引用方法・オープンライセンス（例：CC BY）付きで公開。各誤概念に**安定ID**（例：M-C2-007）、各授業に**学習指導要領コード**を付ける。
   - 根拠：GitHub 上に同種データなし。Eedi が誤概念データで国際研究の中心になった前例。
   - 先にやること：hatsumon（原文の学習課題）・nerai・教科書ページが教科書・指導書由来なら、自分の言葉に書き換えるか許諾を取る。公開版は教科書ページ番号を外し、学習指導要領コードで紐づける。

2. **「誤概念ID」を全アプリの共通キーにして、日本版 Eedi の循環を無料で作る**
   - AI対話アプリ（誤答→誤概念の診断）、数学ラボ（4択の誤答選択肢＝誤概念→「なぜそれを選んだ？」）、QR小テスト（誤概念ごとのルールベース・フィードバック）、教師ダッシュボード（クラスの誤概念ヒートマップ）、家庭学習ログを1本のIDでつなぐ。
   - 差別化：既存の日本のAIドリルは「単元・スキル」単位で、誤概念単位の公開診断はない。

3. **「授業中モード」＝教師が全体を進め、AIが詰まった子を担当**
   - 授業ナビの中心発問を教師が全体に投げる → 端末上で詰まった生徒だけに AI が補助発問の階段を降ろす → ダッシュボードに誤概念タグがリアルタイムで点灯 →「この子の誤答をクラス全体で取り上げる」ボタン（指針⑨「誤答を燃料に」）。
   - 差別化：atama+・スマイルゼミ・教科書AIワカルは家庭・塾の質問対応。SchoolAI は英語・自由文。日本の授業研究の文化（練り上げ）に合う設計は空白。

4. **教師向け「発問の木デザイナー」（発問設計アシスタント）**
   - 122授業を手本に、Claude が中2・中3（245授業）の木の下書きを作り、教師がGUIで直す。機械検証：スキーマ検証、期待解答の数式チェック、「核心を先に言っていないか」の LLM 判定、指針⑤〜⑯のチェックリスト。
   - 費用：全245授業の下書きは Opus 5.5 の Batch で約30ドル（試算）。ボトルネックは教師のレビュー → 他の教師との分担・共有（「発問の木ひろば」：フォーク・改良・共有）が掛け算になる。

5. **模擬授業・初任者研修用の「AI生徒」**
   - 385の誤概念と既存の5ペルソナから、特定の誤概念を持つAI生徒を生成。初任者・教育実習生が発問・補助発問を練習し、指針⑤〜⑯で自動フィードバック。
   - 同じAI生徒で**AI対話アプリの回帰テスト**（核心を漏らさないか、階段を正しく降りるか、飛ばし条件が効くか）も自動化できる（海外の TeachTune・EvalConvoLearn と同じ発想）。
   - 日本語の模擬授業AIは今回見つからず → 先行者になれる。教員養成大学（例：地元の教育学部）との共同研究が自然。

6. **日本語の「ソクラテス式チューター評価ベンチマーク」**
   - 発問の木を評価セットにし、Claude・GPT・Gemini を「核心漏洩率」「誤概念への応答の適切さ」「日本語での数学の正確さ」で比較・公開。英語圏の MathTutorBench・MathDial に相当する日本語版がない。研究者・企業の参照点になり、kazu の木の価値を外部から示せる。

7. **「安心導入パック」で他の教師が使えるようにする**
   - Claude API を未成年に使うには年齢確認・モデレーション・監視・**AIであることの開示**が求められ、文科省ガイドラインは規約・個人情報の確認を求める（後者は要原文確認）。
   - 同梱物：利用規約・プライバシーポリシーのひな形、保護者向け説明文、教育委員会向けチェックリスト、データ方針（氏名を送らない・仮名ID・保存期間・Supabase の保存場所）、画面上の「AIです」表示、**外部AIを使わないオフライン台本モード**（AI利用が許可されない学校向け）。
   - 個人開発者が最も手薄な部分で、ここを整えることが「他の教師が使う」ための最大の摩擦を取り除く。

8. **費用ゼロに近い運用設計**
   - 既定は Haiku 5.5（1生徒・年1ドル未満）、手書き読取だけ上位モデル（混合で約2.4ドル）、発問の木をプロンプトキャッシュ、オフライン台本を常にフォールバック。教師が自分のAPIキーを入れる方式、または自治体・財団による費用負担のパイロット。

9. **教科書に依存しない対応表**
   - 7社の中1教科書の該当ページと学習指導要領コードの対応表を付け、どの教科書の学校でも使えるようにする。単一教科書に縛られる教科書AIワカルへの対抗軸になる。

10. **「はいちモード」×発問**（許諾を得て）
    - 葉一さんの動画の後に、発問の木から確認の発問を1〜2問だけ AI が投げる → 見るだけの動画を対話で確かめる学びに変える。答えを示すソルバー（QANDA・Gauth）とは逆方向の価値。

11. **「わたしの板書」を学びの成果物にする**
    - 対話で生徒の言葉が載った板書を画像・PDFで残し、ふりかえり（指針⑬）やポートフォリオに使う。感想ひろばのように匿名で「クラスのみんなの考え」を見せる展開も可能。黒板中心で生徒の言葉が育つUIは類似製品を見つけられなかった。

12. **小規模な効果検証で信頼を得る**
    - 1〜2単元で「台本のみ」「Claude モード」「通常授業」を比べ、補助なしの確認問題（QR小テスト）で測る。日本の中学生を対象としたLLM数学チューターのRCTは見つからず、エビデンスの空白自体が信頼の堀になる。育休中のため、同僚・大学との共同実施が現実的。

**警戒すべき動き**：教科書AIワカルの「数と式」以外・他学年・学校版への拡大、atama+ の類題・添削追加（2026年夏予定）、Gemini（Guided Learning）が GIGA 端末で既定の無料チューターになる可能性（未確認）、大手の教師向け無料提供（現状は米国中心）。kazu の守りは「オープン」「教科書非依存」「授業の中」「教師コミュニティによる改良」で、ベンダーが真似しにくい。

### Gaps
- 発問の木の文言（hatsumon・nerai）とページ番号の出典・権利関係（「発問バンク_中1数学.xlsx」の元資料）は未確認。公開前に要確認。
- 佐賀県教育委員会・致遠館で、生徒が外部LLM API を使うアプリの利用可否・手続きは未調査。
- Claude の視覚機能による日本語の手書き数式の読み取り精度（中学生の筆跡）の実測はない。
- 教科書AIワカルが「答えを言わない」設計かどうか、学校向けライセンスの有無は未確認。
- 日本語の模擬授業AI・誤概念データセットの存在は GitHub 以外（Hugging Face、J-STAGE、学会資料）で未確認。最終判断の前に追加検索が必要。
