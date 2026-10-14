# 競合調査ノート：ゲーミフィケーション型の数学練習アプリと動画連動型の自習ツール（日本の中学生向け・海外類例つき）

調査日：2026-10-14。表記ルール：各事実に（日付）を付け、2025年より古い情報には **[2025年以前・要更新]** と付記した。「推論」と明記したものは筆者の解釈であり、確認済みの事実ではない。
調査条件の制約：今回の環境では WebFetch と curl による直接取得がすべて失敗した（DNS エラー／egress 403）。また共有の WebSearch 予算（1ターン200回）を約45回の検索後に使い切ったため、根拠はすべて検索結果の要約に頼っている。一次ページの全文は読めていない。数値は可能な限り一次情報（公式サイト・プレスリリース・論文）の URL に紐づけたが、要約経由である点に留意してほしい。未確認の事項は各節の「Gaps」に回した。

---

## 1. 海外のゲーミフィケーション型数学製品：ビジネスモデル、規模、成功と失敗

### Takeaway
米国 K-12 で実際に多く使われているのは、教師がその場でホストする短時間のクラス対戦型クイズ（Blooket、Gimkit、Kahoot!、Quizizz→Wayground）である。いずれも「無料のコア機能＋教師・学校向けの有料プラン」という形をとる。一方、Prodigy の「教師・学校は無料、保護者が課金」モデルは、有料会員の特典を教室で見せつける構造が「pay-to-win」で格差を生むとして、2021年に FTC へ申し立てられた。また、教師に愛用されていた Classcraft は HMH による買収の後、2024年6月30日に提供を終了した。購入判断の決め手になりつつあるのは、エビデンス（Zearn の ESSA「Strong」評価）である。

### Cited Findings
**Prodigy Math（無料ゲーム＋保護者向け会員課金）**
- 2021-02-19、Fairplay（旧 CCFC）など約21〜22団体が FTC に申し立てた。Prodigy は教師・保護者に「is and always will be free」と伝えながら、子どもには Premium 会員を強く売り込んでいる、という内容である。会員だけが魅力的なアイテムを手に入れ、早くレベルアップできる点も指摘された — [Fairplay](https://fairplayforkids.org/feb-19-2021-advocates-to-ftc-prodigy-math-game-preys-on-kids-and-families/) [2025年以前・要更新]
- 申立書の描写によれば、教室内で会員は雲に乗って移動し、非会員は泥道を歩く。会員か否かが他の子から見えるため、社会経済的な格差を悪化させると批判された — [Axios](https://www.axios.com/prodigy-math-game-ftc-complaint-d693af67-019a-4ff5-9bff-8c73d1277342.html) (2021) [2025年以前・要更新]
- 当時の会員価格は年 $59.88、月払いだと年 $107.40。学力向上の主張には十分な根拠がない、とも申し立てられた — [MediaPost](https://www.mediapost.com/publications/article/360719/ftc-urged-to-investigate-prodigy-math-game-over-al.html) (2021) [2025年以前・要更新]
- Fairplay の2021年次報告は「FTC が申立てを調査中」としている。その後の結論は見つからなかった — [Fairplay 2021 Annual Report](https://fairplayforkids.org/wp-content/uploads/2021/10/2021-Annual-report.pdf) [2025年以前・要更新]
- Prodigy の現在の自己説明（2026年閲覧時点）：教師・学校は無料で、年80万人超の教師が利用し、年5,000万人超の生徒がアクセスしている（いずれも自社の主張）。運営は任意の保護者会員で賄い、データの収益化や第三者広告はしない — [Prodigy teacher platform](https://www.prodigygame.com/main-en/teacher-platform)、[Prodigy rewards](https://www.prodigygame.com/main-en/teachers/rewards)
- 会員プラン（購入ページの2026年時点の表示）は子ども1人あたりで次のとおり。Core（Math）$4.91/月と $9.95/月、Plus（Math & Science）$7.41 と $14.95、Ultra（+English）$9.91 と $19.95。2つの価格のどちらが割引後なのかはページから判別できなかった — [Prodigy Memberships](https://www.prodigygame.com/Memberships/purchase/cart/)

**Classcraft（ゲーミフィケーションで学級経営、2024年に終了）**
- HMH が2023年（5月とされる）に Classcraft を買収した。既存の契約は尊重しつつ、チームと技術を HMH の K-12 製品へ統合する方針だった — [PrivSource](https://www.privsource.com/acquisitions/deal/3AS28W) (2023) [2025年以前・要更新]
- HMH のリリースによると、元の Classcraft は 2024-06-30 で提供を終了した。後継の「HMH Classcraft」は K-8 の英語・数学向けで、HMH Into Math／Into Reading／Into Literature から引いた標準準拠レッスンで一斉授業を行うツールである。リリースには「統合された学級経営機能」という記載もある — [HMH press release](https://www.hmhco.com/about-us/press-releases/hmh-launches-immersive-and-dynamic-learning-experience-with-hmh-classcraft)、[PR Newswire](https://www.prnewswire.com/news-releases/hmh-launches-immersive-and-dynamic-learning-experience-with-hmh-classcraft-302067631.html)、[HMH program page](https://www.hmhco.com/programs/classcraft) (2024)
- 競合の LiveSchool は「新版には行動管理機能がない」と書いている（競合による宣伝記事なので割り引いて読む必要がある） — [LiveSchool](https://www.whyliveschool.com/blog/liveschool-vs-classcraft-comparison-guide)
- 教師ブログ（2024-02-22）は「これまで見た中で最高のエンゲージメント・ゲーミフィケーションツールの終わり」と書き、7/1 にデータが消去されるとしていた。同じブログの 2024-07-22 の記事では「6/30 を過ぎてもサイトは残っていたが、ついに停止した」とあり、終了の実際の時期にはばらつきがあったようだ — [educatoral 2024-02-22](https://educatoral.com/wordpress/2024/02/22/the-end-of-the-best-student-engagement-gamification-tool-ive-ever-seen/)、[educatoral 2024-07-22](https://educatoral.com/wordpress/2024/07/22/classcraft-finally-taken-down/)

**Quizizz → Wayground（2025年に改名）**
- 2025-06-24、Quizizz は Wayground に改名した。CEO の Ankit Gupta は、もはや「クイズ」の枠に収まらず、教師があらゆる教材を探し、持ち込み、作る場になったと説明している。quizizz.com は自動で転送され、アカウントと契約はそのまま続く。新機能は Curriculum Alignment、Lesson Bundles、AI 生成ハブ、Expanded Accommodations、VoyageMath — [THE Journal](https://thejournal.com/Articles/2025/06/24/Quizizz-Rebrands-as-Wayground-Announces-New-AI-Features.aspx)、[Formswrite](https://formswrite.com/blog/quizizz-is-now-wayground) (2025-06)
- 「米国の学校の90%が利用」という数字は会社の主張で、独立した検証は見つからなかった — 同上

**Blooket / Gimkit（教師がホストするクラス対戦ゲーム）**
- Blooket はコア機能が無料。有料の Blooket Plus は年払いで $4.99/月（$59.88/年）、月払いの Plus Flex は $9.99。生徒ごとのレポートは Plus 限定で、学校向けバンドルは約 $550/年から。価格は情報源によって食い違う — [TriviaMaker (2026)](https://triviamaker.com/blooket-vs-gimkit-vs-kahoot/)、[LearnClash (2026-05)](https://learnclash.com/blog/blooket-vs-gimkit)
- Gimkit は機能制限つきの無料 Basic（使えるかどうかは評価が分かれる）と、Gimkit Pro（$14.99/月または $59.88/年）がある。Department ライセンスは $650/年で最大20教師 — [Differentiated Teaching](https://www.differentiatedteaching.com/blooket-vs-gimkit/)、[TriviaMaker](https://triviamaker.com/blooket-vs-gimkit-vs-kahoot/)
- Blooket は 2025-01 に Khanmigo と連携し、AI による問題生成を無料にした。Gimkit の AI 問題生成は 2025-09 に始まり、Pro 限定 — [LearnClash](https://learnclash.com/blog/kahoot-vs-blooket-vs-gimkit)
- 解説記事によれば、Blooket はベンチャーキャピタル（VC）の出資を受けずに成功し、Gimkit は10代の創業者が自己資金で立ち上げた（未検証） — [ValiantCEO](https://valiantceo.com/edtech-startups-winning-playbook-guide/)

**米国での利用実態**
- Instructure の「EdTech Top 40」2025年版は、2024-09-01〜2025-05-31 のアクセスを集計し 2025-06-30 に公開された。Blooket と Gimkit が入っている（順位と、Prodigy・IXL の位置は確認できず） — [District Administration](https://districtadministration.com/briefing/edtech-top-40-familiar-learning-tools-most-popular-learnplatform-instructure/)、[Instructure](https://instructure.com/edtech-top40)
- 2026年版は LTI 起動データ（実際の授業での利用）に指標を変えた。学区は「アクセスできること」ではなく「エビデンス」を求めている、という論調 — [Instructure 2026 PR](https://www.instructure.com/press-release/new-instructure-data-shows-k-12-districts-are-demanding-evidence-not-just-access)。学区は使うアプリの数を減らしているという報道もある — [The Learning Counsel](https://thelearningcounsel.com/articles/districts-are-reducing-app-counts-teachers-are-still-building-instruction/)

**Zearn（非営利、教師1クラスは無料、エビデンスが強み）**
- 非営利団体。教師個人は1クラス35人まで無料で使え、学校・学区は有料アカウントを購入する — [Zearn](https://about.zearn.org/)
- Evidence for ESSA で「Strong」評価。3研究・22,575人で平均効果量は +0.09。Louisiana の4〜8年生では +0.20、Texas の3〜5年生を対象とした RCT は非有意だった — [Evidence for ESSA](https://www.evidenceforessa.org/program/zearn-math/)
- 自社の主張では、米国の小学生の4人に1人、中学生の100万人超が利用している — [Zearn](https://about.zearn.org/why-zearn-math)。州単位の無償化もあり、Ohio の中学生向けは 2025-06-30 まで、South Carolina は 2030年まで — [Ohio Governor](https://governor.ohio.gov/media/news-and-media/governor-dewine-announces-new-tool-to-boost-middle-school-matth-achievement)、[Zearn SC](https://about.zearn.org/south-carolina)

**DragonBox（Kahoot! 傘下）**
- 2019年、Kahoot! が約1,800万ドルで買収した（同社初の買収）。アプリは Numbers、Big Numbers、Algebra 5+、Magnus Kingdom of Chess など — [EdSurge 2019-05-08](https://edsurge.com/news/2019-05-08-game-on-kahoot-snaps-up-dragonbox-for-18-million-for-its-first-acquisition)、[TechCrunch](https://techcrunch.com/?p=1824655)、[共同通信PRワイヤー](https://kyodonewsprwire.jp/release/201905096166) [2025年以前・要更新]
- 韓国 App Store では「DragonBox 제공 Kahoot! 기하학」が Kahoot ASA 名義で保守更新を続けている（日付は不明） — [App Store KR](https://apps.apple.com/KR/app/id1565519368)

**Duolingo Math**
- 2025-05-01 の第1四半期決算説明会で、数学・音楽に続いてチェスを始めると発表した。主な狙いはユーザー数の拡大 — [MarketBeat transcript](https://www.marketbeat.com/earnings/reports/2025-5-1-duolingo-inc-stock)。2025年末の時点でチェスは iOS／Android でリリース済みで、対人戦もある — [Duolingo blog](https://blog.duolingo.com/product-highlights/)

**99math / Boddle / Legends of Learning**
- 99math はエストニア企業で2018年創業。2022-07 に Play Ventures 主導で $2.1M、累計 $3.6M を調達。教室向けのマルチプレイ数学ゲーム — [GamesBeat](https://gamesbeat.com/99math-raises-2-1m-to-make-teaching-and-learning-math-fun/)、[BounceWatch](https://bouncewatch.com/company/99math) [2025年以前・要更新]
- Boddle はカンザスシティの企業で、2022年にシードで $3.0M を調達。Google Classroom／Clever と連携し、フリーミアム型 — [Signalbase](https://www.trysignalbase.com/news/funding/boddle-learning-secures-3m-seed-round-to-revolutionize-k6-education-with-interactive-gaming)、[StartupIntros](https://startupintros.com/orgs/boddle) [2025年以前・要更新]
- Legends of Learning は8ラウンドで累計 $27.32M を調達。直近は 2025-11-19 のシード $0.43M で、米教育省が助成ラウンドに出資している — [CB Insights](https://www.cbinsights.com/company/legends-of-learning/financials)

### Inferences
- 推論：海外で成功しているパターンは3つある。(1) 教師がホストする5〜15分のクラス対戦（導入を決めるのは教師で、授業内で完結する）。(2) コア機能は無料で、教師・学校向けにレポートや人数上限を有料にする。(3) 第三者評価のエビデンス（Zearn）。日本の学校向けドリルは個別最適化した一人学習が主流（3節）なので、(1) の「クラス対抗・先生がホスト」は日本では空いている可能性が高い。
- 推論：失敗のパターンも3つある。(a)「無料」と言いながら子どもに課金を促し、教室で格差を見せてしまう（Prodigy）。(b) 買収後の方針転換でサービスが消え、教師が積み上げた運用やデータが失われる（Classcraft）。(c) クイズ単機能では差別化できず、教材プラットフォームへの転換を迫られる（Wayground）。
- 推論：12〜15歳が実際に触れている海外ツールは、授業で教師が起動する汎用クイズゲーム（Blooket/Gimkit/Kahoot/Wayground）が中心とみられる。ただし年齢別の利用データは今回確認できていない。

### Gaps
- 検索予算が尽きたため、IXL、Mathletics、Matific、Brilliant の価格・規模・評判は未調査。必要なら追加で検索する。
- Prodigy の FTC 申立てがその後どうなったか、Prodigy の売上と会員数は見つからなかった。
- Classcraft 終了の公式な理由は見つからなかった。「買収後に HMH のカリキュラム製品へ集約した」というのは推論にとどまる。
- DragonBox 各アプリの2025〜26年の提供状況（終了・統合の有無）と、Duolingo Math の利用者数は未確認。
- 12〜15歳に限った利用ランキング（米国・日本とも）は見つからなかった。

---

## 2. 研究エビデンス：数学のゲーミフィケーション効果、外発的報酬・ガチャ・ルートボックスのリスク、日本のコンプガチャ規制

### Takeaway
ゲーミフィケーションの学習効果は「小〜中程度でプラス」というのが標準的な結論である（Sailer & Homner 2020 で認知 g=.49）。ただし中学生・数学に絞ったエビデンスは薄く、研究間のばらつきも大きい。ルートボックスと問題ギャンブルの相関は「安定して一貫」しているが、因果関係は確立していない。日本では2012年からコンプガチャ（カード合わせ）が景品表示法で禁止されているが、確率表示は法的な義務ではなく、業界の自主規制である。

### Cited Findings
**ゲーミフィケーションのメタ分析**
- Sailer & Homner（2020, *Educational Psychology Review* 32:77–112）の効果量は次のとおり。認知 g=.49（95%CI .30–.69、19研究、N=1,686）、動機づけ g=.36（.18–.54、16研究、N=2,246）、行動 g=.25（.04–.46、9研究、N=951）。認知の効果は厳密な研究だけに絞っても保たれたが、動機づけと行動の効果は不安定だった — [Springer](https://link.springer.com/article/10.1007/s10648-019-09498-w)、[Augsburg OPUS](https://opus.bibliothek.uni-augsburg.de/opus4/frontdoor/index/index/docId/109056) [2025年以前だが基準となる研究]
- Ratinho ほか（*Educational Psychology Review*、DOI は2025年、掲載は2026年）は、中等・高等教育の数学におけるゲーミフィケーションを扱ったシステマティックレビューとメタ分析。動機づけへの効果は g≈.38。エンゲージメントは妥当性を確かめた尺度が不足していたため、メタ分析できなかった — [Springer](https://link.springer.com/article/10.1007/s10648-025-10108-1)
- Vega ほか（2026, *Jurnal Pendidikan Matematika dan Sains*）は、中等数学の学力について「ゲーミフィケーション対反転授業」を比べた。準実験16研究のうち、ゲーミフィケーションの研究は5本だけ — [JPMS](https://journal.uny.ac.id/index.php/jpms/article/view/96112)
- 高等教育を対象とした2026年のメタ分析（*SAGE Open*）は d=1.12 と大きな効果を報告したが、異質性は I²=98.84% と極めて高い — [SAGE](https://journals.sagepub.com/doi/10.1177/21582440261421375)

**ルートボックス（有償ガチャ）と子ども**
- 16〜18歳（n=1,155）の調査では、ルートボックスへの支出と問題ギャンブルの関連は中〜大程度で、成人より強かった。因果の向きは未解決 — [Royal Society Open Science (2019)](https://royalsocietypublishing.org/rsos/article/6/6/190049/94826/Adolescents-and-loot-boxes-links-with-problem) [2025年以前・要更新]
- Zendle が英国議会に提出した証拠書類では、ルートボックスへの支出は成人でも青年でも問題ギャンブルと関連する。「ルートボックスが原因」か「企業が既存の問題を利用している」かのどちらかだと論じ、規制を求めている — [UK Parliament written evidence](https://committees.parliament.uk/writtenevidence/83/html/)
- 16〜24歳の横断調査では、自分のお金でルートボックスを買った人は問題ギャンブルのオッズが11.4倍だった — [ResearchGate](https://www.researchgate.net/publication/346419236_Loot_Boxes_Gambling_and_Problem_Gambling_Among_Young_People_Results_from_a_Cross-Sectional_Online_Survey) [2025年以前・要更新]
- 英国政府は2022年7月の回答で「因果関係は確立していない」として立法を見送り、業界の自主対応に委ねた。Children's Commissioner はこれを批判している — [House of Commons Library](https://commonslibrary.parliament.uk/research-briefings/cbp-8498/)、[Children's Commissioner](https://www.childrenscommissioner.gov.uk/blog/loot-boxes-and-gambling) [2025年以前・要更新]
- ベルギーは有償ルートボックスを事実上禁止している。2022年のレビューによれば、規制を検討した国は多いが、実際に措置をとった国は少ない — [Current Addiction Reports (2022)](https://link.springer.com/article/10.1007/s40429-022-00424-9) [2025年以前・要更新]

**日本のコンプガチャ規制**
- 消費者庁は 2012-05-18 に見解を公表し、2012-07-01 から適用した。根拠は景品表示法第3条に基づく告示「懸賞による景品類の提供に関する事項の制限」の第5項（カード合わせの禁止） — [ファミ通](https://www.famitsu.com/news/201205/18014911.html)、[4Gamer](https://www.4gamer.net/games/000/G000000/20120518018/) [2025年以前だが現行ルール]
- ガチャで直接得るアイテムは取引の対象なので景品には当たらない。一方、コンプ報酬は「取引に顧客を誘い込む手段」として提供されるため景品類とされた — [ファミ通](https://www.famitsu.com/news/201205/18014911.html)。名称を変えても、同じ仕組みなら規制対象になる — [LegalSearch](https://legalsearch.jp/portal/column/act-against-unjustifiable-premiums-and-misleading-presentations/)
- 日本にはガチャの確率表示を義務づける法律はない。表示は JOGA の自主規制と App Store／Google Play の審査基準に支えられている — [ゲームバイブル](https://game-bible.com/guide/gacha-probability-disclosure-law/)。表示した確率と実際の確率が違っていたケースでは、不当表示として措置命令が出た例がある（CEDEC 2024 の講演レポート） — [4Gamer CEDEC 2024](https://www.4gamer.net/games/999/G999905/20240827021/)。弁護士による2026-03-23 付の解説もある — [さいたま弁護士事務所系コラム](https://www.saitama-bengoshi.com/oyakudachi/20260323-1-2/)

### Inferences
- 推論：効果量は「小〜中」なので、ゲーム化そのものより練習の設計（即時フィードバック、間違いからのやり直し、適切な難度）が本体だと考えるべきである。中学生・数学に限ったエビデンスは薄い。kazu が教室で評価データを出せば、それ自体が価値のある新しい知見になる。
- 推論（法的助言ではない）：kazu のガチャは課金がなく、取引に付随して提供されるものではない。そのため、景表法上の「景品類」に当たらない可能性が高い。それでも、規制の趣旨（子どもの射幸心をあおる仕組みの抑制）に照らせば、次の点を「自主ガイドライン」として公開すると、学校や保護者の信頼材料になる。(1) コンプ報酬（全部集めたら特別報酬）を置かない。(2) 排出率を表示する。(3) 期間限定であおらない。(4) お金や外部特典と交換させない。(5) 報酬はスピードより努力（やり直し・挑戦）に結びつける。
- 推論：ルートボックス研究が対象にしているのは有償のガチャである。無償・学習連動のガチャの効果や害は、研究の空白にあたる。

### Gaps
- 外発的報酬による内発的動機の低下（アンダーマイニング効果、Deci・Koestner・Ryan 1999 のメタ分析など）は今回の検索で確認していない。背景知識としてだけ挙げておき、引用する場合は要検証。
- Li, Hew & Du（2024）のメタ分析は Vega らの参考文献でタイトル（内発的動機は上がるが能力への影響は小さいという趣旨）を見ただけで、数値は未確認。
- リーダーボードやランキングが下位層に与える負の影響の研究は未調査。
- 日本の学習アプリにおけるガチャへの批判や業界ガイドライン（教育分野）は未調査。

---

## 3. 日本の学校市場（GIGA）：中学校で使われるデジタルドリル、学習eポータル、導入規模と価格

### Takeaway
学校で調達されるデジタルドリルは大手の寡占構造になっている。主要製品は、ミライシード（ベネッセ、小中約12,000校、2026-04）、ラインズeライブラリアドバンス（9,000校以上、2024-04 基準）、Qubena（COMPASS、170超の自治体・約2,300校・100万人超、2025年）、navima（TOPPAN、約50自治体、2024年冬）。いずれも「AI による個別最適化と学習データ」を前面に出しており、ゲーム性は従来は補助的な位置づけだったが、ラインズが2025-04にゲーミフィケーションを強化した。入口となる学習eポータルは2社で約7割を握り、公正取引委員会が2025-12に競争政策上の見解を出した。

### Cited Findings
**利用の前提（公的調査）**
- 令和7年度（2025年度）全国学力・学習状況調査では、ICT 機器を週3回以上使う学校が小学校97%、中学校94%だった（二次資料による整理） — [にじいろ（2026年版整理）](https://nijin.jp/digital-drill-school/)、報告書は [国立教育政策研究所 R7 質問調査](https://www.nier.go.jp/25chousakekkahoukoku/report/data/25qn.pdf) (2025-08)

**ミライシード（ベネッセ）／ドリルパーク**
- 公式サイトでは「約12,000校の小中学校で導入」（2026年4月現在）。中核市では62自治体中26で導入 — [ミライシード公式](https://bso.benesse.ne.jp/miraiseed/index.html)
- 2025年3月時点は「10,000校超（全国の小中学校の約30%）、340万人以上」、2024年3月時点は「9,000校超」とされる（検索要約による。元リリースの URL は確定できず） — [リシード 2025-04-25](https://reseed.resemom.jp/article/2025/04/25/10779.html)、[ミライシード公式](https://bso.benesse.ne.jp/miraiseed/index.html)
- ドリルパークは AI 搭載のデジタルドリル。2025年度から、小3〜6向けの英語 AI ドリルと、中1〜3向けの国語・理科・社会の暗記・計算ドリルが加わった — [ドリルパーク](https://bso.benesse.ne.jp/miraiseed/products/drill/index.html)。2015年から提供しており、330万人分のデータを AI に生かしているという — [みんなの教育技術](https://kyoiku.sho.jp/279940/)
- 2024年4月の大型アップデートで「テストパーク」を追加した — [こどもとIT](https://edu.watch.impress.co.jp/docs/news/1574383.html) [2025年以前・要更新]。宮城県の「みやぎの算数教育改善プラン」で採用されている — [PR TIMES](https://prtimes.jp/main/html/rd/p/000001382.000000120.html)

**ラインズeライブラリアドバンス（ラインズ）**
- 全国9,000校以上（2024年4月時点の数字を2025-04 の発表でも使用）。2020年4月時点は6,000校以上 — [教育家庭新聞 2024-04](https://www.kknews.co.jp/news/20240428o02)、[ICT教育ニュース 2025-04-23](https://ict-enews.net/2025/04/23education-2/)
- 2025-04-23、AI 型ドリル搭載教材として「ゲーミフィケーション要素を強化」と発表した（詳細は未取得） — [ICT教育ニュース](https://ict-enews.net/2025/04/23education-2/)
- 島根県松江市は全中学校14校と義務教育学校2校（生徒約4,800人）に一斉導入し、2025年度から利用している — [ICT教育ニュース 2025-11-20](https://ict-enews.net/2025/11/20education/)。愛知県知多市（約6,600人）と兵庫県三木市（約5,000人）も全小中学校に一斉導入した（日付不明） — [ラインズ](https://www.education.jp/news/detail/55)、[ラインズ](https://www.education.jp/news/detail/131)。まなびポケット版もある — [まなびポケット](https://manabipocket.ed-cl.com/feature/lines_advance/)

**Qubena（COMPASS、「学習eポータル＋AI型教材」）**
- 2025年時点で170以上の自治体、約2,300校、100万人以上が利用 — [PR TIMES](https://prtimes.jp/main/html/rd/p/000000115.000024557.html)、[こどもとIT 2025-08](https://edu.watch.impress.co.jp/docs/news/2037165.html)。導入事例ページは「公立・私立小中学校 計2,300校以上」と書いている — [Qubena 導入事例](https://qubena.com/casestudy)。トップページには「220自治体以上」という記載もあり、数字が食い違う — [Qubena](https://qubena.com/)
- 兵庫県高砂市は全市立中学校（約2,300人）で正式採用した（2025-08） — [こどもとIT](https://edu.watch.impress.co.jp/docs/news/2037165.html)。福岡県太宰府市は11校・約6,300人 — [Qubena news](https://qubena.com/news)
- まだ使っていない公立小中学校向けに、2025-09〜2026-03末の無償トライアルを案内している — [デジマド](https://digi-mado.jp/article/117278/)。「探究・校務改革支援補助金2025」の実証先も募集した — [Qubena](https://qubena.com/blog/pr-20250404/)

**navima（TOPPAN）**
- AI 型ドリル「マイドリル」、協働学習ツール「学び合いツール」、「先生用管理ツール」の3つを1つにしたサービス。導入例は大阪市、仙台市、鹿児島市など。デジタル地方創生サービスカタログ（2024年冬版）では約50自治体 — [デジタル庁カタログ](https://digiden-service-catalog.digital.go.jp/education/7957/)、[TOPPAN](https://solution.toppan.co.jp/education/service/navima.html) [2025年以前・要更新]。鹿児島県垂水市の活用事例もある — [TOPPAN](https://solution.toppan.co.jp/education/contents/navima_11.html)

**その他の学校向けサービス**
- スタディサプリは「2025年3月末時点で全国の高校の2校に1校が導入」（中学校の数は不明） — [スタディサプリ法人向け](https://brand.studysapuri.jp/method/btob/)。導入実績2,900校は2022年3月末時点の数字 — [スタディサプリ学校向け](https://teachers.studysapuri.jp/) [2025年以前・要更新]
- Classi は累計210万人超（2023年4月、Classi 調べ） — [Classi](https://classi.jp/about/) [2025年以前・要更新]。Wikipedia によれば 2026-04-01 にベネッセコーポレーションへ吸収合併された — [Wikipedia](https://ja.wikipedia.org/wiki/Classi)（要一次確認）
- Monoxer：横浜市が495校に導入し、教育データや AI ドリルと連携させる（2025年末〜2026年頃の報道とみられる） — [こどもとIT](https://edu.watch.impress.co.jp/docs/news/2098570.html)。鹿児島県鹿屋市は2026年4月から市立小中学校35校・約1万人で使っている — [モノグサ](https://corp.monoxer.com/pr/260305/)
- すらら：「約2,500校の塾や学校」という数字があるが、出典は個人ブログで、学校と塾の内訳は不明 — [ohreisai.net](https://ohreisai.net/surala-hutoukou/)

**学習eポータル（流通の入口）**
- MM総研の調べでは、まなびポケット（NTTドコモビジネス、旧 NTT コミュニケーションズ）が36%、L-Gate（内田洋行）が34%で、上位2社で約7割。3位は国の「実証用学習eポータル」の20%。1,578団体を対象とし、導入率は98% — [こどもとIT](https://edu.watch.impress.co.jp/docs/news/1538700.html)、[MM総研](https://www.m2ri.jp/release/detail.html?id=599)（調査時期は2023年頃とみられる [2025年以前・要更新]）
- 日経は2025年12月に「2社でシェア7割 寡占懸念、公取委が見解表明へ」と報じた — [日本経済新聞](https://www.nikkei.com/article/DGXZQOUA198FA0Z11C25A2000000/)。公取委は 2025-12-23 に、eポータルの選定・更改や、eポータル事業者と教材事業者の取引について、独占禁止法上の考え方を公表した — [日経BP](https://project.nikkeibp.co.jp/pc/atcl/19/06/21/00003/021200696/)
- 問題になりうる行為として、自治体の仕様書で特定の eポータルとの接続を必須にすることや、高額な接続料が挙げられている（Libry CEO による解説） — [note 後藤匠](https://note.com/tgoto/n/ne9212990a252)
- 文部科学省の資料「学習eポータルが目指すもの」（2024-09） — [MEXT](https://www.mext.go.jp/content/240918-mext_syoto01-000037976_2-4.pdf)。L-Gate は MEXCBT との連携機能を拡充した — [EdTechZine](https://edtechzine.jp/article/detail/8160)

### Inferences
- 推論：学校調達のドリルは「自治体による一括導入＋AI 個別最適化＋教師用の管理画面」が標準形で、教師個人が製品を選べる余地は小さい。一方で、ブラウザで動く無料ツールなら、正規ドリルを置き換えずに「授業の補助・家庭学習」として入り込める。
- 推論：ラインズが2025年にゲーミフィケーションを強化したことは、学校向けドリルでもゲーム性が差別化の軸になりつつある兆候である。ただし大手のゲーム化は「バッジやアバター」程度にとどまると予想され、kazu の RPG 型（バトル・仲間・イベント）や、教師がホストするクラス対抗とは重なりにくい。これは機能の詳細を確かめていない推論である。
- 推論：eポータルは寡占状態で、接続料の問題もある。そのため、個人開発の無料ツールを eポータル経由で流通させるのは現時点では難しい。URL や QR で配り、教師コミュニティで広げる方が現実的である。

### Gaps
- 学校向けデジタルドリルの価格（1人あたりの年額など）は今回確認できなかった。比較記事の存在だけは確認した — [スマートライフ・コンサルティング](https://www.smart-life-consulting.com/ai-education/school-digital-drill-comparison/)
- 中学校に限った導入数、各社の市場シェアの一次データ（MM総研のデジタルドリル部門など）、MEXCBT の利用状況、学習者用デジタル教科書（数学）との連携状況は、検索予算が尽きて未調査。
- eboard と各 eポータルの正式な接続状況（4・5節も参照）。
- 自治体のフィルタリングで YouTube が見られない GIGA 端末がどの程度あるかは未調査。kazu の「はいちモード」が学校で使えるかに直結する。

---

## 4. 日本の家庭（コンシューマー）市場：通信教育タブレット、学習アプリ、ゲーム型アプリ

### Takeaway
中学生向けの家庭用デジタル教材は、月額7,000〜11,000円のタブレット型通信教育（進研ゼミ中学講座、スマイルゼミ）が中心である。ゲーム型のヒット作は小学生向け（学研ドラゴンドリル、小1〜4、月300〜600円）に偏っている。中学数学のストアアプリは計算ドリル型が中心で、「授業準拠の本格 RPG」は今回の調査範囲では見当たらなかった。なお依頼文にある「ドラゴンドリル（小学館）」は誤りで、正しくは学研。

### Cited Findings
- 進研ゼミ中学講座のハイブリッドスタイルは、2025年度の12か月一括払いで中1 6,990円、中2 7,140円、中3 7,190円（月額、税込）。毎月払いは8,170／8,290／8,330円。6か月以上続ければタブレット代は0円 — [比較記事](https://thestudy365.com/correspondence-education/sinkenzemi-3/)。公式サイトは2026年4月時点で中1・中2を7,140円（12か月一括）と表示している — [進研ゼミ公式](https://chu.benesse.co.jp/cost/)
- スマイルゼミ中学生コースの標準クラスは、中1が12か月一括で8,580円／月、毎月払いで10,230円。中2・中3の毎月払いは10,560円・10,890円。特進クラスの中1は15,180円（一括）／17,490円（毎月）で、15,840円とする記事もあり数字が食い違う。専用タブレットは10,978円（12か月継続が条件） — [ririmomoblog](https://ririmomoblog.com/smilezemi-juniorhighschool-price/)、[ミツカル教育通信](https://resemom.jp/kyoiku/smile-zemi-price/)、[ダイヤモンド教育](https://diamond.jp/educate/articles/juku-hiyou/400137/)（いずれも2025〜26年の二次資料）
- 学研ドラゴンドリルのアプリは、封印されたドラゴンを復活させるバトル形式の学習アプリで、対象は小1〜4 — [App Store](https://apps.apple.com/jp/app/%E5%AD%A6%E7%A0%94%E3%83%89%E3%83%A9%E3%82%B4%E3%83%B3%E3%83%89%E3%83%AA%E3%83%AB-%E7%AE%97%E6%95%B0-%E5%9B%BD%E8%AA%9E%E3%81%AE%E5%AD%A6%E7%BF%92%E3%82%A2%E3%83%97%E3%83%AA%E3%81%A7%E5%AD%A6%E3%81%BC%E3%81%86/id6444248860)
  - 2023-06 時点で、リリースから3か月半で算数の問題が160万問解かれ、App Store の無料「子供向け6〜8歳」で1位になった — [PR TIMES](https://prtimes.jp/main/html/rd/p/000005101.000002535.html)、[PR TIMES](https://prtimes.jp/main/html/rd/p/000005001.000002535.html) [2025年以前・要更新]
  - 学研は2024-10 に「10万人がハマる」と発信した — [学研公式](https://gkp-koushiki.gakken.jp/2024/10/03/76054/)。紙のシリーズは累計100万部を突破している — [PR TIMES](https://prtimes.jp/main/html/rd/p/000007648.000002535.html)。全コンテンツの開放は月額300〜600円（2024年の情報） — [ちいく村](https://chiiku-baby.jp/dragonwb/) [2025年以前・要更新]
- 中学数学のストアアプリ：「数学トレーニング」（StudySwitch）は中1〜3の計算問題を学年別に収録した無料アプリで、評価4.7（約4.6万件）。教育カテゴリ175位という表示は古いスナップショットの可能性がある — [App Store](https://apps.apple.com/jp/app/%E6%95%B0%E5%AD%A6%E3%83%88%E3%83%AC%E3%83%BC%E3%83%8B%E3%83%B3%E3%82%B0/id1070817345)。2026年のおすすめ記事でも計算ドリル系や角度パズルが中心 — [アプリブ 2026](https://app-liv.jp/education/highschool/0550/)、[m-s-y 2026](https://m-s-y.com/app/ranking/middle-school-study-apps/)
- Monoxer は 2026-09 の発表で、学習塾と日本語学校の2市場で導入シェア No.1 だとした（学校市場での順位は書かれていない）。SAPIX 小学部は2026-02 に導入 — [PR TIMES](https://prtimes.jp/main/html/rd/p/000000194.000029973.html)、[モノグサ](https://corp.monoxer.com/pr/260209/)

### Inferences
- 推論：家庭向けの有料教材は「全教科をそろえること、紙との併用、保護者への報告」で勝負しており、中学数学だけのゲームとは正面から競合しない。月7,000〜11,000円を払えない家庭にとって「無料・広告なし・課金なし」で質の高い中学数学ゲームは空白で、公平性の観点からも意味がある。
- 推論：ゲーム型のヒット（ドラゴンドリル）が小学生向けに集中しているのは、中学生向けでは「学校の進度との同期」と「難しさ」がネックになるためと考えられる。授業ナビの297時間と1時間ずつ同期している kazu の資産は、まさにこのネックを解消できる。

### Gaps
- Z会中学生コース、スタディサプリ（個人向け）、RISU、Think!Think!、すららの家庭向け価格と利用者数は、検索予算が尽きて未調査。
- App Store／Google Play の教育カテゴリにおける2025〜26年の実ランキング（中学数学のゲーム系）も確認できていない。
- 中学生の学習アプリ利用率を示す全国調査は未取得。
- ドラゴンドリルの中学生版（紙・アプリ）の有無は未確認。

---

## 5. YouTube 教師エコシステム（葉一／19ch.tv ほか）と「無料動画＋プリント＋演習」連動型ツール

### Takeaway
葉一の「とある男が授業をしてみた」は登録者約220万人（2026-01）。19ch.tv では2,000本以上の授業動画と授業プリント（PDF）を無料で公開しており、学校や放課後児童クラブで使う場合も「利用申請は不要」としている（塾での教材販売は控えるよう求めている）。ただし、第三者のアプリへの埋め込みについての規定は公開情報では確認できない。その意味で、kazu が個別に得た許可は希少な資産である。「第三者の無料 YouTube 授業＋公式プリント＋手書き＋連動演習＋教師ダッシュボード」を一体化した製品は、今回の検索範囲では見つからなかった。最も近い eboard は、自前の動画とドリルを組み合わせた NPO モデルである。

### Cited Findings
**葉一／19ch.tv**
- 登録者は約220万人（2026年1月現在）。Z会の本の「春の入学・進級を応援してみたキャンペーン」（2026年春、終了済み）で葉一とコラボしている — [Z会の本](https://www.zkai.co.jp/books/el/el-guide/26spring_cp/)。過去の数字は197万人（2023-08-15） — [wikid](https://ja.wikid.org/%E8%91%89%E4%B8%80)、224万人（日付不明） — [ranking.net](https://ranking.net/items/c21f22)
- 19ch.tv は「2,000本以上の勉強動画が無料」で、授業テキスト（PDF）も無料。小・中学校、高校、放課後児童クラブ、子ども教室などで「自由にご利用いただけます」としている — [19ch.tv](https://19ch.tv/)
- 学校・児童クラブなどで使う場合、利用申請は不要。印刷した学習計画表やテキストは生徒に自由に配ってよい。ただし「塾などにおいて、教材としての販売はご遠慮ください」 — [19ch.tv（休校時の案内ページ, 2020年掲載）](https://19ch.tv/js/COVID19.html) [2025年以前・要更新：現在の「教育機関でのご利用方法」ページで再確認が必要]
- 中1〜3と高校受験の数学の動画・プリント一覧が整備されており、小学生向け（例：小5）もある — [19ch 高校受験数学](https://19ch.tv/ex/ex1s.html)、[19ch 小5](https://19ch.tv/s5/s5.html)
- CHANTO WEB のインタビュー（2025-11-13）で、葉一は教科書1冊を丸ごと授業動画にした理由や不登校の子への支援を語り、フリースクールの教員が動画を活用している声も紹介されている — [CHANTO WEB](https://chanto.jp.net/articles/-/1007785?display=b)
- EDIX 東京2023 のインタビューでは、コロナ禍を経て先生や保護者が動画授業を「一つの教育ツール」として選択肢に入れるようになり、以前は講演を聞いてくれなかった校長も関心を示すようになったと語っている — [EDIX](https://www.edix-expo.jp/hub/ja-jp/blog/blog27.html) [2025年以前・要更新]。動画は1本約15分で編集はなく、反復学習に向く — [東洋経済](https://toyokeizai.net/articles/-/391084) [2025年以前・要更新]。過去には「教育を汚すな」といった批判も受けた — [BuzzFeed](https://www.buzzfeed.com/jp/yuyayoshida/haichi1) [2025年以前・要更新]

**その他の無料動画ソース**
- Try IT（家庭教師のトライ）は「永久0円」の映像授業。中学版は学校の教科書を登録すると進度に合ったカリキュラムになり、対応するテキストや問題集も無料で見られる。質問対応は有料 — [Try IT 数学](https://www.try-it.jp/mathematics/)、[Google Play](https://play.google.com/store/apps/details?id=jp.co.trygroup.tryit.student&hl=en_US)、[PR TIMES（開始時）](https://prtimes.jp/main/html/rd/p/000000001.000014618.html) [開始時の情報は2025年以前]。学校の授業で使う条件や埋め込みの可否は、規約本文を確認できなかった。
- NHK for School は「NHK ONE for School」としてアプリ配信されている — [App Store NHK](https://apps.apple.com/jp/developer/nhk-japan-broadcasting-corporation/id307227304)、[NHK ONE (Wikipedia)](https://en.wikipedia.org/wiki/NHK_ONE)。2025年9月末に NHK の無料素材などの公開終了が相次いだという報道見出しもあるが、NHK for School が対象かどうかは未確認（検索要約による）。

**eboard（NPO、無料の ICT 教材）**
- 利用者数は2025年6月に月240,342人。2024年度の年間利用者は203万人を超え、12,000か所以上の学校・教育現場に提供された — [eboard 公式](https://info.eboard.jp/about_us/index.html)、[eboard 団体概要](https://info.eboard.jp/about_us/outline)
- 2026-04 の記事は、eboard を「もうからないけど必要」な無償教材として紹介し、年間利用者を200万人超としている — [おたくま経済新聞](https://otakuma.net/archives/2026042001.html)
- 特別支援教育向けの無償アカウントを、自治体・教育委員会が一括で申請できる仕組みが始まった（9月の投稿、年は不明） — [eboard X](https://x.com/eboard_jp)
- まなびポケットや Classi などのプラットフォームと連携しているという記載がある。ただし学習eポータル標準での正式接続を指すのかどうかは確認できなかった — [Weblio](https://www.weblio.jp/content/Eboard)、[ITトレンド](https://it-trend.jp/e_learning/20072)
- 14自治体を対象にした不登校調査の記事で、学びの選択肢の一つとして触れられている — [ranrun](https://ranrun.jp/social-issues/school-refusal-support-learning-options/)

**kazu 側の現状（ローカル資料）**
- 19ch／葉一への相談メールの下書きでは、次の設計を提示している。動画は YouTube 公式の埋め込みで、再生回数と広告収益は葉一側に入る。プリントは 19ch から読み込んで表示し、保存も再配布もしない。手書きを重ねられる。縦・横のレイアウトを選べ、単元対応の動画一覧がある。停止要請には即応する。デモは中1「正の数・負の数」 — `/home/user/math-dialogue/docs/19ch-相談メール.md`（ローカル）

### Inferences
- 推論：19ch の公開ルールが想定しているのは「学校での視聴と印刷配布」で、第三者アプリへの埋め込みや PDF の読み込み表示は明示されていない。そのため kazu の許可は、他の開発者が簡単にまねできない参入障壁になる。許可の範囲を文書で残しておくべきである。具体的には、埋め込み、PDF の読み込み、手書きの重ね書き、他の教師への配布、他の教師が改変した版、学校での利用、有料化の禁止など。これは kazu の「掛け算」戦略（他の教師が使い、改変し、共有する）にとって決定的に重要である。
- 推論：葉一は商業的な提携（Z会）も、公益的な支援（不登校・フリースクール）も行っている。教師が手作りする非営利の「授業準拠コンパニオン」は、葉一の発信（学びの選択肢を増やす、不登校支援）と合っている。
- 推論：eboard は競合というより補完関係にある。eboard は「自前の動画＋ドリル、学び直し・特別支援・不登校、無償」の層を担っている。kazu の強みは「授業時数との同期、ゲームの層、教師の家庭学習ダッシュボード、葉一動画との連動」である。

### Gaps
- eboard の動画本数、問題数、資金構成（寄付・助成・企業協賛）、eポータル連携の詳細は、一次ページを取得できなかったため未確認。
- 葉一の公式アプリの有無、19ch.tv の現行の「教育機関でのご利用方法」ページの文言は確認できなかった。検索結果に出た App Store の id6740842851 が何のアプリかも特定できていない。
- Try IT、NHK for School、ヨビノリ、eboard 動画の埋め込みや二次利用の規約は未確認。
- 日本で「無料 YouTube 授業と演習を連動させるアプリ」が本当に存在しないかは、網羅的に検証できていない。デキタスやスタディサプリなど、有料で自前の動画を使うサービスは別枠として扱う。

---

## 6. 家庭学習の可視化と自己調整学習ツール

### Takeaway
学習記録ツールの主戦場は大学受験生・高校・塾である（Studyplus は累計1,000万人、Studyplus for School は2,800教室以上、Classi は主に高校）。中学校での家庭学習の把握は、端末の持ち帰りが日常化していない（R6 の中学校で「毎日持ち帰り・毎日利用」は27.4%、二次資料）こともあり、デジタルの定番がない状態とみられる。

### Cited Findings
- Studyplus は 2025-07-01 に累計会員1,000万人を突破した — [PR TIMES](https://prtimes.jp/main/html/rd/p/000000294.000047308.html)、[ICT教育ニュース](https://ict-enews.net/2025/07/02studyplus-13/)
- Studyplus for School は全国の学校・学習塾・予備校2,800教室以上に導入されている（2025-07）。2024-12 時点は2,700教室以上。公式サイトは「2025年3月時点の累計登録校舎で1,700教室以上」と別の基準で表示している — [Studyplus for School](https://for-school.studyplus.co.jp/)、[PR TIMES](https://prtimes.jp/main/html/rd/p/000000294.000047308.html)。学習塾・スクール向け LMS 市場でシェア No.1 を自称 — [PR TIMES](https://prtimes.jp/main/html/rd/p/000000267.000047308.html)。2026年度は東京都立の通信制高校全3校に提供する — [こどもとIT](https://edu.watch.impress.co.jp/docs/news/2114107.html)
- Classi には学習時間の記録・振り返り機能があり、保護者も学習状況を確認できる — [Classi 活用ナビ](https://ed.classi.jp/student_howtouse_classi)、[Classi サポート](https://support.classi.jp/hc/ja/articles/360002246435--%E7%94%9F%E5%BE%92-%E4%BF%9D%E8%AD%B7%E8%80%85-%E7%94%9F%E5%BE%92%E3%81%AE%E5%AD%A6%E7%BF%92%E7%8A%B6%E6%B3%81%E3%82%92%E7%A2%BA%E8%AA%8D%E3%81%97%E3%81%9F%E3%81%84)。2018年には学習記録データを分析して成績向上との関係を検証した — [日本経済新聞](https://www.nikkei.com/article/DGXLRSP484451_V00C18A7000000/) [2025年以前・要更新]
- コクヨは 2025-12-19 に「家庭学習に関する実態調査」（勉強アプリ CarryCampus の利用者が対象）を公表し、中高生の約3割がデジタル端末上に手書きで学習していることを示した — [リセマム](https://resemom.jp/article/img/2025/12/23/84419/389430.html)
- 端末の持ち帰り（令和6年度全国学力調査、中学校、二次資料）：「毎日持ち帰って、毎日利用させている」27.4%、「毎日持ち帰って、時々利用させている」19.0% — [pppt.jp（R6 概要 p.36 の引用）](https://pppt.jp/mext-reiwa-6-status-overview/36)。令和7年度の調査票にも同じ設問があるが、数値は抽出できなかった — [MEXT 算数・数学 WG 資料 (2025-10-17)](https://www.mext.go.jp/content/20251017-mxt_kyoiku01-000045415_12.pdf)
- 2023年の文科省調査では、1人1台端末を週1回以上持ち帰って学習している学校は半数以下だった — [リシード](https://reseed.resemom.jp/article/2023/04/24/6189.html) [2025年以前・要更新]

**kazu 側の現状（ローカル資料）**
- 家庭学習ノートは4つの指標を記録している。解いた問題数、応用問題への挑戦数・挑戦率、×のあとの「もう一度」の回数、自己申告の学習時間（画面を開いていた時間の自動計測を目安として併記）。教師・保護者用の画面は PIN で開き、生徒別・プリント別・問題別に見られ、Excel 出力もできる — `/home/user/math-dialogue/home/README.md`（ローカル）

### Inferences
- 推論：既存の学習記録ツールは「時間と教材の記録」（Studyplus）や「学校全体の連絡と記録」（Classi）が中心である。中学数学に特化して「挑戦」と「やり直し」という努力の指標を測るツールは見当たらない（網羅的な検証ではない）。家庭学習ノートの指標は、自己調整学習の研究でいう「粘り強さ・試行」を見える化しており、点数中心のドリル管理画面とは違う価値を出せる。
- 推論：毎日持ち帰って毎日使う中学校は3割未満（R6）なので、家庭学習ツールはスマホ／家庭の PC からログインなし（QR＋学籍番号＋PIN）で使え、通信が不安定でも動く（PWA／オフライン）必要がある。

### Gaps
- 中学校の教員が家庭学習をどう把握しているか（自学ノートの点検や提出方法、負担）を示す調査データは見つからなかった（未検索部分が大きい）。
- ロイロノート・スクール、Google Classroom、まなびポケット、Microsoft Teams などの家庭学習の記録機能は未調査。
- 集中タイマーや学習時間アプリ（Forest など）の中学生の利用実態は未調査。

---

## 7. 低学力層・数学不安の生徒への支援：製品と研究

### Takeaway
「さかのぼり」（すらら）や「AI による個別最適化」（Qubena）は有料か、学校での調達が前提になる。無料の eboard は学び直し・特別支援・不登校に強いが、ゲームではない。研究では、時間的な圧力が数学不安の高い子の成績を下げる実験結果がある。メタ分析では、スキル練習だけよりも「スキル練習＋不安を下げる要素」の組み合わせの方が不安の低減効果が大きい（g=−1.09 対 −0.37、2026年）。これは kazu の「あんしんモード＋できた！のかいだん」の設計と合っている。

### Cited Findings
**製品**
- すららは学年に関係なく過去の範囲に戻れる構成で、小4〜高3の英語・国語・数学に対応している — [すらら公式](https://surala.jp/grade1/j_truancy.html)。不登校の出席扱いに使える教材として紹介されることが多いが、最終判断は校長の裁量で、認定人数の数字（300人以上／2,500人以上）は記事によってばらばら — [ohreisai.net](https://ohreisai.net/surala-hutoukou/)、[kidshomestudy](https://kidshomestudy.com/surara-futokou/)（いずれも二次資料）
- eboard は特別支援教育向けの無償アカウントの一括申請を受け付けている（5節を参照） — [eboard X](https://x.com/eboard_jp)
- Qubena は AI 型教材で、習熟度に合わせて出題する — [planplan](https://www.planplan.ac/media/digital-educational-tools/)

**数学不安への介入：メタ分析**
- Codding ほか（2023、K-12、17研究、1,786人）：治療的な介入の方が不安を大きく下げた（g=−0.51、スキル介入は −0.32）。学力はスキル介入の方が伸びた（g=0.76、治療的介入は 0.12）。ただし研究の質を統制すると差は有意でなくなった — [PubMed](https://pubmed.ncbi.nlm.nih.gov/37689437/)
- Sammallahti ほか（2023、*Journal of Numerical Cognition*）：12歳を超える対象では不安が中程度に下がった（g=−0.636、年少は −0.218）。学力は年長で g=0.656 だが、年齢差は有意ではない。介入期間が長いほど効果的な傾向がある — [ERIC 全文](https://files.eric.ed.gov/fulltext/EJ1400784.pdf)、[ResearchGate](https://www.researchgate.net/publication/372769621_A_meta-analysis_of_math_anxiety_interventions)
- 中等教育の学業介入のメタ分析（2025、19研究、2,377人）：学業成績は g=0.66 と有意に伸びたが、学業不安は g=−0.13 で有意な低下はなかった — [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC12163233/)
- 子どもから大人までを含むレビュー（2026、51研究、7,673人）：スキル＋不安の組み合わせ型が g=−1.09、不安への対処型が −0.71、スキル型が −0.37 — [NYU IFP 抄録](https://ifp.nyu.edu/2026/journal-article-abstracts/edu0000992/)
- 数学不安と学力の関係のメタ分析（Barroso ほか）があることは確認したが、数値は未取得 — [ResearchGate](https://www.researchgate.net/publication/346551018_A_meta-analysis_of_the_relation_between_math_anxiety_and_math_achievement)

**時間制限（タイムアタック）と不安**
- 実験研究によると、時間的な圧力は認知負荷を高め、特に数学不安の高い人に悪影響を与える。時間制限のない紙の条件では、この悪影響は消えた — [ScienceDirect（IJER, 2017年頃）](https://www.sciencedirect.com/science/article/abs/pii/S0883035516310977) [2025年以前]
- Boaler は「時間制限のあるテストでは、到達度に関係なく少なくとも3分の1の生徒が強いストレスを感じる」とし、時間的な圧力がワーキングメモリを妨げると主張している（提言寄りの資料） — [YouCubed](https://www.youcubed.org/evidence/fluency-without-fear/)、[Boaler PDF](https://www.dyslexicadvantage.org/wp-content/uploads/2015/12/Speed_and_Time_Pressure_Blocks_Working_Memory_.pdf) [2025年以前]
- 反対の見方もある。Namkung ほか（2019）のメタ分析は「時間制限のあるテストと不安・成績の因果関係は、研究が少なくエビデンス不足」としている。Maki（2024、4〜5年生113人）は、時間を公表した課題と隠して計った課題で不安に有意差がなかったと報告した。どちらも Prodigy のブログによる紹介なので、原典の確認が必要 — [Prodigy blog](https://webflow.prodigygame.com/main-en/blog/math-facts-timed-tests-anxiety)

**kazu 側の現状（ローカル資料）**
- ペルソナテストでは、Lv1（最下層）の難易度が×、継続意欲も×。Lv2 は「時間がきつい」。「勝負どころは下位2人」と分析している — `/home/user/math-dialogue/docs/test-personas.md`（ローカル）

### Inferences
- 推論：研究の結論は「不安の高い子に時間的な圧力をかけると成績が下がる」点では一致している。一方、「時間制限が不安を生む」という因果は確立していない。したがって、40秒タイムアタックは Lv1〜2 にはオフを既定にし、自分で選べるようにする設計が妥当である。成績の良い層には爽快感の源として残せる。
- 推論：組み合わせ型の介入（スキル＋不安低減）が最も効果的だという知見は、「できた！のかいだん」（スモールステップ・2択の足場かけ）と「あんしんモード」（時間制限なし・ミスOK）を同時に出す設計の根拠になる。不安を下げる要素として、たとえば「間違いは脳が育つ合図」といった捉え直しの一言や、学び直し動画への即時導線を加えると、さらに研究に沿う。
- 推論：「無料・ゲーム・さかのぼり（小学算数まで）・あんしん」を全部そろえた中学数学ツールは空白の候補である。すららは有料、Qubena は学校調達、eboard はゲームではない。

### Gaps
- 日本の中学生を対象にした数学不安の介入研究や、日本語版の数学不安尺度（短縮版）は未調査。
- 各社の「やさしいモード」（例：ミライシードやラインズの低学力層向け機能）の実態は未調査。
- すららの最新の導入数（IR 資料）は検索予算が尽きて未取得。

---

## 8. Gaps and opportunities for kazu（空白領域と kazu の機会）

### Takeaway
最も有望な空白は「授業と1時間ずつ同期した、無料・広告なし・課金なしの中学数学ゲームの層」である。その層で次の4つを実現し、教師コミュニティが改変・共有して広げる形が考えられる。(1) 間違えたら、許可を得た葉一の無料授業と19ch のプリント（手書きつき）にその場で戻れる。(2) 最下層の生徒には「あんしん」を既定にする。(3) 家庭学習を「努力の指標」で教師と保護者に見せる。(4) 教師コミュニティが改変・共有して広げる。大手（学校調達の AI ドリル、有料の通信教育）とも、海外のクラス対戦ゲームとも、正面からはぶつからない位置である。

### Cited Findings（機会の根拠。詳細は各節）
- 学校向けドリルは大手の寡占で、AI による個別最適化が主訴求。ゲーミフィケーションは2025年に強化され始めた段階（ラインズ） — [ICT教育ニュース 2025-04-23](https://ict-enews.net/2025/04/23education-2/)、[ミライシード公式](https://bso.benesse.ne.jp/miraiseed/index.html)
- 学習eポータルは2社で約7割を占め、公取委が2025-12に見解を出した。接続料の問題も指摘されている — [日本経済新聞](https://www.nikkei.com/article/DGXZQOUA198FA0Z11C25A2000000/)、[note 後藤匠](https://note.com/tgoto/n/ne9212990a252)
- 19ch は学校での利用に申請不要、塾での販売は禁止。2,000本超の動画とプリントがある — [19ch.tv](https://19ch.tv/)、[19ch.tv COVID19](https://19ch.tv/js/COVID19.html)
- Prodigy は課金と教室での格差の見える化で批判された — [Axios](https://www.axios.com/prodigy-math-game-ftc-complaint-d693af67-019a-4ff5-9bff-8c73d1277342.html)。Classcraft は買収後に終了した — [HMH](https://www.hmhco.com/about-us/press-releases/hmh-launches-immersive-and-dynamic-learning-experience-with-hmh-classcraft)
- 米国の学区はエビデンスを要求している — [Instructure 2026](https://www.instructure.com/press-release/new-instructure-data-shows-k-12-districts-are-demanding-evidence-not-just-access)。Zearn は「教師個人は無料＋エビデンス」で広がった — [Zearn](https://about.zearn.org/)、[Evidence for ESSA](https://www.evidenceforessa.org/program/zearn-math/)
- 組み合わせ型の不安介入が最も効果的 — [NYU IFP](https://ifp.nyu.edu/2026/journal-article-abstracts/edu0000992/)。時間的な圧力は不安の高い子に不利 — [ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S0883035516310977)
- 家庭向けの有料教材は月約7,000〜11,000円 — [進研ゼミ](https://chu.benesse.co.jp/cost/)、[ririmomoblog](https://ririmomoblog.com/smilezemi-juniorhighschool-price/)。中学校で毎日持ち帰り・毎日利用は27.4%（R6、二次資料） — [pppt.jp](https://pppt.jp/mext-reiwa-6-status-overview/36)

### Inferences（具体的な機会と、kazu の既存資産との対応。すべて推論）
1. **「はいちモード」を旗艦にし、「授業準拠の動画スタジオ」として位置づける**（数学ラボ＋授業ナビ）
   授業ナビの297時間の各時間に、次の5つを1つの ID で結びつける：葉一の動画（公式埋め込み）、19ch のプリント（読み込み表示＋手書き）、数学ラボの演習セット、QR 小テスト、家庭学習ノートの記録。ID は応用チャレンジの `M1-04-3` 形式を流用する。「今日の授業 → 家で動画 → プリント → 演習 → 記録」が1本でつながる無料ツールは、今回の調査範囲では見つからなかった。eboard は自前の動画、Try IT は自前の動画とテキスト、19ch は動画と PDF のみである。
2. **許可を「掛け算の土台」として文書化する**
   19ch の公開ルールは学校での視聴と印刷までしか想定しておらず、アプリへの埋め込みは明示されていない。そこで葉一側と、次の点の可否を明文化しておく。他の教師が kazu のツールをフォーク・改変・自校配布してよいか、学校の端末で使ってよいか、非営利を条件とするか。他の教師が安心して使える「利用条件ページ」を作れば、それ自体が掛け算の前提条件になる。
3. **誤答を誤概念タグに結びつけ、動画へ案内する（AI 対話授業＋数学ラボ）**
   「発問の木」の誤概念タグを、4択の誤答（ディストラクタ）にひもづける。誤答を選んだら「その誤概念を扱う葉一の動画の該当箇所（YouTube の開始秒）と、補助発問」に案内する。大手ドリルの「正誤＋類題」とは違う、教師の知見そのものを差別化要素にできる。
4. **Lv1〜2 は「あんしん」を既定にし、最初の5分で必ず成功させる**
   最初に短い診断を行い、Lv1〜2 と判定したら次の状態から始める。タイマーなし、2択の足場、さかのぼり先として19ch の小学生向け動画（小5 など）。そのうえで「時間制限ありへの挑戦」は本人が選ぶ。研究的には、組み合わせ型の介入、時間的な圧力の回避、年長生徒への長めの介入が有効とされている。
5. **「やさしいガチャ宣言」を学校採用の信頼材料にする**
   方針を公開ページにまとめる：課金なし、広告なし、コンプ報酬なし、排出率を表示、1日の回数に上限、報酬は努力（やり直し・挑戦・連続学習）で得る、全員が同じ条件（他の子に見せびらかせる有料特典がない）。Prodigy への批判の裏返しであり、2012年のコンプガチャ規制の趣旨にも沿う。
6. **教師がホストする「クラス対抗」ライブモードと、教師によるアンロック制御**
   Blooket／Gimkit 型の5〜10分の授業内イベントを、授業ナビの時間と連動させる。先生が「今日の時間」を選ぶと、その範囲のモンスターやステージだけが解放される。週イベントの「クラス対抗」版（学年内の競争ではなく、クラス全体の合計努力ポイントで協力する形）にすれば、下位層も貢献できる。日本の学校向けドリルは個別学習型なので、ここは空いている。
7. **家庭学習ノートと数学ラボのログを統合し、努力の指標で見せる（保護者ビュー）**
   ゲームのログ（あんしんモードでの解答数、やり直し、学び直しの視聴）を家庭学習ノートの4指標に統合し、保護者向けには「がんばりの見える化」だけを表示する（点数は出さない）。中学数学に特化した「挑戦・やり直し」の可視化は、Studyplus や Classi とは違う価値になる。
8. **「消えない・増える」ことを約束する（Classcraft の教訓）**
   公開リポジトリ（GitHub）、学習データのエクスポート（Excel 出力は実装済み）、自校の Supabase に乗せ替える手順書、問題データの追加方法（`data/` に章ファイルを足す）を教師向けにまとめた「フォーク・ガイド」を整える。買収や個人の事情で消えるリスクを、構造そのもので打ち消せる。
9. **小さなエビデンスを作る**
   育休明けの校内研究や大学との連携で、あんしんモードの前後で数学不安の短い尺度と継続率を比べる。「教師が作り、無料で公開し、検証もしている」ことは、大手やアプリ開発者にはまねしにくい信頼になる。米国でもエビデンスを要求する流れが強まっている。
10. **流通は eポータルの外で（QR／URL＋教師コミュニティ）**
    eポータルへの接続は寡占と接続料の問題で、当面は不利である。QR、URL、ログインなしの PIN 方式で配り、佐賀県内の研修、教科研究会、SNS 上の教師コミュニティで広げる。将来は MEXCBT や eポータル標準への対応を調べる（Gap）。オフラインでも動く PWA にすれば、持ち帰りや家庭の通信環境の差にも強くなる。
11. **家族・きょうだいで遊べるモード**
    保護者が一緒に解く、きょうだいで協力バトルをするなど。有料の通信教育が月約7,000〜11,000円であることを考えると、無料で家族ぐるみで使えるという公平性は、自治体や PTA にも説明しやすい。
12. **YouTube がブロックされる環境への代替手段**
    自治体のフィルタリングで YouTube が見られない端末を想定する（実態は Gap）。プリントと手書きと演習だけでも成り立つ「動画なしの経路」と、家庭の端末で動画を見る導線（QR で家のスマホに送るなど）を用意する。

### Gaps（次に確認すべきこと）
- 共有の WebSearch 予算（1ターン200回）を使い切り、WebFetch／curl での一次ページ取得も環境の制約で失敗したため、以下は未確認のまま残っている。eboard の詳細（動画本数・資金源・eポータル連携）、19ch の現行の教育機関向け規約、Try IT／NHK／ヨビノリの埋め込み規約、MEXCBT・デジタル教科書（数学）の状況、学校向けドリルの価格、IXL／Mathletics／Matific／Brilliant、Z会・スタディサプリ・RISU・Think!Think! の価格と利用者、2025〜26年の App Store／Google Play 教育カテゴリのランキング、中学校教員の家庭学習の把握方法、自治体フィルタリングでの YouTube 可否。続きのメッセージをもらえれば、追加で検索できる。
- kazu の「はいちモード」について、葉一側の許可の正確な範囲（ローカルの下書きでは「相談中」の形式になっている）は、ノートの範囲外のため確認していない。依頼文では「許可済み」とされている。
