# Classroom formative assessment, 振り返り, and 学級経営/行事 tools in Japanese GIGA-school classrooms (with global analogs)

Compiled 2026-10-14 for kazu (math teacher, 佐賀県立致遠館中学校・高等学校; solo developer of free math web tools).

> **Read first: method and reliability.**
> 1. **No full-page reads.** WebFetch failed DNS on every host. curl through the session proxy returned **403 (org egress policy)** for mext.go.jp, manabi-mirai.mext.go.jp, leadingdxschool.mext.go.jp, ntt.com, prtimes.jp, resemom.jp, kahoot.com, schooltakt.com and wikipedia. I did not try to get around this. **Every "Cited Finding" below comes from search-engine extracts of the cited URL, not from reading the page.** Spot-check the key numbers before publishing.
> 2. **Search budget ran out.** The shared per-turn WebSearch budget (200 calls across all agents) was used up after about 45 of my queries. These planned sub-topics were therefore **never searched**: mental-health check-in vendors (シャボテンログ / RAMPS / こころの天気 / STANDBY), 学級通信 makers, Japanese gamified class-management tools, event-reflection sharing practice, the **direct competitor check for 感想ひろば**, 学習eポータル / OneRoster / LTI details, the item-level results of the FY2025 校務DX checklist, and the evidence on metacognition. They are listed under **Gaps**. A few are followed by leads from background knowledge, clearly labelled **UNVERIFIED**.
> 3. **Dating.** Each fact carries its date where the extract showed one. **(pre-2025)** marks facts that may be outdated.
> 4. **kazu's own tools** are cited from local repo files under `/home/user/math-dialogue/`, not from the web.

---

## 1. Platforms: who runs quizzes, formative assessment and 振り返り in Japanese public schools?

### Takeaway
By reported scale, three Japanese 授業支援 platforms lead:
- ロイロノート・スクール: 14,000+ schools, including overseas (2025-09)
- ミライシード: 10,000+ schools, about 30% of 小中 (2024-12)
- スクールタクト: 2,500+ schools (2026-02)

They run on a Google-dominated device stack (ChromeOS is 60% of 2nd-phase GIGA devices, 2025) and on 学習eポータル such as まなびポケット (1,200+ municipalities, 2025-01). In 2026 the incumbents are bundling AI at no extra charge (LoiLo AI announced 2026-09; スクールタクト 振り返りAI分析(β) and TUNE). No source showed any general platform grading free-response math answers by equivalence.

### Cited Findings

**Japanese 授業支援 / learning platforms**

ロイロノート・スクール (LoiLo)
- 「国内外14,000校以上」 and about 290万人 users per day, as of 2025-09 (LoiLo recruiting pages) — [Wantedly 1](https://sg.wantedly.com/projects/2346983); [Wantedly 2](https://sg.wantedly.com/projects/2373558).
- Earlier figure: 国内外1万校 (2022-04, **pre-2025**) — [リセマム/PR TIMES](https://resemom.jp/release/prtimes/20220403/80689.html).
- 2026-09-19: LoiLo announced an AI-feature policy for ロイロノート・スクール.
  - It is built on 「4つの柱」 and is 「先生を支え、子どもたちの学びを広げる」.
  - All features are planned at 「追加料金なし」.
  - LoiLo is recruiting 「生成AI実証校」.
  - Context it cites: the 中教審 素案 for the next 学習指導要領 (2026-08) emphasises AI use.
  - The extract cut off before the content of the four pillars.
  - [DIME/LoiLo PR](https://dime.jp/company_news/detail/?pr=2714506)
- Price is not published. Contracts are mainly per school or municipality, and conditions vary — [appmatch](https://appmatch.jp/gsc-muw23106/) (undated).
- Municipal example: 亀岡市 trialled ロイロ in FY2022 and adopted it fully from FY2023 — [京都府教委 資料 R5](<https://www.kyoto-be.ne.jp/soumu/cms/wp-content/uploads/2025/10/令和５年度-亀岡市-学力向上③.pdf>); [R6 事業資料](<https://www.kyoto-be.ne.jp/soumu/cms/wp-content/uploads/2026/01/令和６年度-亀岡市-授業支援ソフト「ロイロノート」の導入事業.pdf>).
- 中学数学 example: at 同志社中学校, students drew circle/angle figures and linear/quadratic graphs in GeoGebra and submitted them via ロイロノート (undated) — [同志社中](https://jhs.js.doshisha.ac.jp/manabiproject/manabi-mathematics/%e6%95%b0%e5%ad%a6%e3%82%bd%e3%83%95%e3%83%88geogebra%e3%81%ab%e6%8c%91%e6%88%a6%ef%bc%81).

スクールタクト (コードタクト)
- 「国公私立問わず2,500校を超える小学校から大学、学習塾に導入」 (PR 2026-02-25; self-reported) — [リセマム/PR TIMES](https://resemom.jp/release/prtimes/20260225/172419.html).
- Churn signal: 港区's 区民の声 page (updated 2026-08-31) records that the スクールタクト contract used in 区立小学校 until last year ended this year — [港区](https://www.city.minato.tokyo.jp/kouchou/kuse/kocho/ikenshokai49/4603.html).
- AI features are covered in §2: 振り返りAI分析(β) and TUNE(β).

ミライシード (Benesse: オクリンク / ムーブノート / ドリルパーク)
- 10,000+ schools, about 30% of all 小中学校, used by 340万人+ students (as of 2024-12) — [リセマム/PR TIMES 2025-01-06](https://resemom.jp/release/prtimes/20250106/132479.html).
- A case-study site gives 約1万校, 334万人+ students and 6万人+ teachers — [AI総研](https://www.ai-souken.com/case/248).
- Procurement example: 前橋市's FY2026 spec covers 21,970 licences, valid 2026-04-01 to 2027-03-31, as 「１年更新の非永続ライセンス」. The unit price was not in the extract — [前橋市 仕様書](https://www.city.maebashi.gunma.jp/material/files/group/95/siyousyomiraisi-do2026.pdf).

まなびポケット (学習eポータル; NTT Com, now NTTドコモビジネス)
- 600万 IDs reached 2024-09. 「全国の1,200以上の自治体、14,000校以上」 had applied (PR 2025-01-14) — [NTT Com](https://www.ntt.com/about-us/press-releases/news/article/2025/0114.html).
- Earlier: 400万 IDs in 2022-10 and 500万 in 2023-02 — [NTT Com 2023-02-17](https://www.ntt.com/about-us/press-releases/news/article/2023/0217.html).
- The 2025-07 terms name the provider as NTTドコモビジネス — [campaign terms 2025](https://manabipocket.ed-cl.com/wp/wp-content/uploads/2025/07/learning_e-portal_campaign_terms2025.pdf).

Classi
- A Benesse HD × SoftBank joint venture founded in 2014; paid service from 2015-04 (**pre-2025**) — [weblio](https://www.weblio.jp/content/Classi); [リセマム 2016](https://resemom.jp/release/prtimes/20160616/19592.html).
- **No current school count was found.** A techwave URL slug suggests 「高校導入40%」, but the article body could not be read — [techwave](https://techwave.jp/archives/classi-achieved-install-to-highschool-40-percent.html) (unverified).
- Third-party 2026 price pages contradict each other and should not be used — [app-tatsujin 1](https://app-tatsujin.com/?p=32606); [app-tatsujin 2](https://app-tatsujin.com/?p=68938).

MetaMoJi ClassRoom
- 大分県教育庁 introduced it in all 県立高校 (press release 2026-03-13). The 県 document says 「全生徒・教職員が使えるようにする」 — [大分県資料](https://pref.oita.jp/uploaded/attachment/2237029.pdf); [PR TIMES keyword page](https://prtimes.jp/topics/keywords/MetaMoJi%20ClassRoom).
- Major update on 2026-02-19 — [リセマム](https://resemom.jp/release/prtimes/20260219/171837.html).
- ClassRoom 3 now includes the 小学校用「メタモジドリル」 free as a standard feature (2026-03-27) — [リセマム](https://resemom.jp/release/prtimes/20260327/176267.html).
- It links with まなびポケット (date not in extract) — [PR TIMES](https://prtimes.jp/main/html/rd/p/000000409.000004007.html).
- No national adoption count was found.

SKYMENU Cloud (Sky)
- Comes in Professional and Devicecontrol editions — [ITreview](https://www.itreview.jp/products/skymenu/profile).
- Devicecontrol gained a student web-access check on 2026-03-31 — [クラウドWatch](https://cloud.watch.impress.co.jp/docs/news/2098946.html).
- Sky is piloting its 校務 app 「SKYMENU Mobile」 with **武雄市教育委員会 (佐賀県)** — [北海道新聞/PR](https://www.hokkaido-np.co.jp/article/1356450/) — and with 倉吉市立西郷小学校 (2026-09) — [共同通信PRワイヤー](https://kyodonewsprwire.jp/release/202609145832).
- No adoption count was found.

**Device and cloud stack (context for Google and Microsoft tools)**
- MM総研 survey (2025-06 to 07; 1,249 of 1,741 municipal boards answered). OS share of 2nd-phase GIGA student devices:
  - **ChromeOS 60%** (+18pt)
  - **iPadOS 31%** (+2pt)
  - **Windows 10%** (−19pt)
  - For comparison, phase 1 (MEXT, 2021-07) was ChromeOS 40%, Windows 30.9%, iOS about 29%.
  - [helentech](https://helentech.jp/news-71040/); [iPhone Mania](https://iphone-mania.jp/news-394878/)
- Google Forms quiz mode grades short-answer (記述式) items by **exact match** (case-insensitive). Every accepted variant must be entered in the answer key — [Qualtir](https://qualtir.com/ja/blog/google-forms-online-exams-timed-assessments).
  - A 札幌市立中央中学校 guide tells teachers to register both 全角 and 半角 variants and to tick 「その他の回答をすべて不正解にする」 — [札幌市立中央中](https://www16.sapporo-c.ed.jp/chuo-j/attach/get2/2539/0).
  - The Forms API auto-grading guide names checkbox, radio and dropdown question types — [Google Developers](https://developers.google.com/workspace/forms/api/guides/setup-grading?hl=ja).
- The standalone Microsoft Math Solver was **retired on 2025-07-07**. Users are pointed to OneNote's math assistant — [Wikipedia](https://en.wikipedia.org/wiki/Microsoft_Math_Solver); [AlternativeTo](https://alternativeto.net/software/microsoft-math/about); [Microsoft Q&A community reply](https://learn.microsoft.com/en-us/answers/a/9508912) (a volunteer post, not an official notice).

**Global quiz and response tools (Japan data where found)**

Kahoot!
- In Japan, 100M+ participants in the past 12 months and 200,000+ teachers (company PR 2026-05, announcing a Universal Music partnership for English learning) — [Kahoot!](https://kahoot.com/kahoot-news/kahoot-partners-universal-music-english-learning-japanese-classrooms/).
- Student-led sessions doubled year on year (executive comment) — [The Licensing Letter](https://thelicensingletter.com/?p=41148).
- Kahoot! markets itself against the GIGA第2期 KPIs (blog 2025-03-28) — [Kahoot! JP blog](<https://kahoot.com/blog/2025/03/28/教師や学校がgigaスクール第2期のkpiを達成するのを支/>).
- Its Japanese back-to-school page promotes AI generation of quizzes — [Kahoot! JP](https://kahoot.com/ja/back-to-school/).
- All of these are vendor numbers.

Quizizz → Wayground
- Rebrand announced 2025-06-24, with new AI features. The company claims about 90% of US schools — [THE Journal](https://thejournal.com/Articles/2025/06/24/Quizizz-Rebrands-as-Wayground-Announces-New-AI-Features.aspx?p=1).
- Accounts and content were unchanged — [Teesside Univ. blog](https://blogs.tees.ac.uk/lteonline/2025/06/26/quizizz-is-now-wayground-what-this-means-for-teesside-university-staff/).
- No Japan figures were found.

Desmos Classroom → Amplify Classroom (2025-06)
- The free activity library and Activity Builder stay free.
- Polypad is on the Discover page.
- The paid core curriculum is "Amplify Desmos Math".
- [Amplify blog](https://amplify.com/blog/technology-in-the-math-classroom/amplify-and-desmos/); [Amplify migration FAQ](https://go.info.amplify.com/fy25_desmosclassroom_platformmigration_national_faqpage); [UNL notice](https://newsroom.unl.edu/announce/nebraska-science/18831/101774)
- No Japan figures were found.

Padlet
- The free tier is capped at **3 padlets** with 20MB uploads.
- The Classroom plan is quoted at $160/yr (Padlet Help, via FitGap) or $199/yr (Capterra and Teachfloor). Capterra lists school plans "from $1,000 for 10 teachers". **The sources conflict.**
- [FitGap](https://us.fitgap.com/products/padlet); [Capterra 2026](https://www.capterra.com/p/207199/Padlet/pricing/); [Teachfloor](https://www.teachfloor.com/blog/what-is-padlet)

Snorkl
- Students solve on a whiteboard and record a spoken explanation.
- The AI judges both correctness and how strong the explanation is, and gives time-stamped feedback.
- When the answer is wrong it asks a follow-up question; students can retry; teachers review the feedback.
- [AVID Open Access](https://avidopenaccess.org/resource/snorkl-for-automated-ai-generated-student-feedback); [Ditch That Textbook](https://ditchthattextbook.com/snorkl/); [Illustrative Mathematics blog](https://illustrativemathematics.org/how-to-use-instant-feedback-on-student-thinking-to-offer-responsive-instruction/); [snorkl.app](https://snorkl.app)
- Promotional sources only; no independent evaluation was found.

**Summary table.** Cells marked (inf.) are my inferences; empty facts mean nothing was found.

| Product | Japan adoption (date) | School price | Typical 中学数学 use | Limitations / notes |
|---|---|---|---|---|
| ロイロノート・スクール | 14,000+ schools incl. overseas (2025-09) | Not public; per school/municipality | Card submission; e.g. GeoGebra graphs submitted to 提出箱 (同志社中) | Free AI features coming (2026-09). No equivalence grading seen (inf.) |
| スクールタクト | 2,500+ schools (2026-02) | Not found | Real-time sharing and comments (inf.); 振り返りAI分析(β) | Contract ended in 港区's 区立小 (2026) |
| ミライシード | 10,000+ schools ≈30% of 小中; 340万 students (2024-12) | Annual, non-perpetual licences (前橋 FY2026) | ドリルパーク AI drill; オクリンク submission (inf.) | Input methods vary per item; handwritten 途中式 memo (§3) |
| まなびポケット | 1,200+ municipalities, 14,000+ schools, 6M IDs (2025-01) | Not found | Portal/SSO hub, not a quiz tool (inf.) | — |
| Classi | Not found (2015–16 data only) | Not found (third-party prices conflict) | High-school oriented (inf.) | Data stale |
| MetaMoJi ClassRoom | All 大分県立高校 (2026-03); no national count | Not found | Handwriting-centric shared notebook (inf.) | Free 小学校 drill added 2026-03 |
| SKYMENU Cloud | Not found | Not found | Presentation / device control (inf.) | 校務 app pilot in 武雄市 (佐賀) |
| Google Classroom / Forms | ChromeOS = 60% of 2nd-phase devices (2025) | Not checked | Forms quizzes (inf.) | Exact-match short answer; every variant (全角/半角) must be listed |
| Microsoft Teams / Forms | Windows = 10% of 2nd-phase devices (2025) | Not checked | — | Math Solver retired 2025-07-07 |
| Kahoot! | 200k+ teachers, 100M+ participants per year in Japan (vendor, 2026-05) | Not found | Game-style review (inf.) | Vendor numbers |
| Wayground (ex-Quizizz) | Not found | Not found | — | Renamed 2025-06 |
| Amplify Classroom (ex-Desmos) | Not found | Activity Builder free | Graph-based activities | Renamed 2025-06; English-centric (inf.) |
| Padlet | Not found | Free 3 boards; $160–199/yr Classroom | Walls for ideas and reflections (inf.) | Free cap is small |
| Snorkl | Not found | Not found | Explain-your-thinking with AI feedback | Promotional evidence only |
| Mentimeter, Slido, Socrative, Plickers, Formative | **Not searched** | — | — | See Gaps |

### Inferences
- **The stack has layers.** Device/cloud (Google is the majority) → 学習eポータル (まなびポケット etc.) → 授業支援 (ロイロ / ミライシード / スクールタクト / MetaMoJi / SKYMENU) → AI drills (ドリルパーク, Qubena…). A teacher's quick quiz in 中学数学 probably happens in Google Forms (Chromebook majority) or in the platform's submission box. I did **not** find survey data on actual 中学数学 quiz practice.
- **Contracts are municipal and renewed yearly.** Examples: 前橋's non-perpetual one-year licences, and 港区 dropping スクールタクト. Teacher-made tools that live outside platform contracts (a URL plus a QR code) are not affected when a platform is switched.
- **Generic AI feedback is becoming a free extra.** LoiLo's AI is planned at no extra cost, and スクールタクト offers reflection AI and TUNE. A solo developer cannot win on "has AI". The defensible ground is math-specific pedagogy (equivalence, form rules, misconceptions), transparency, and zero setup.
- **Two OSes must work.** With ChromeOS at 60% and iPad at 31%, a tool must work in Chrome and in iPad Safari. The 全角/半角 problems documented for Google Forms are a real pain point for math answers. kazu's custom keyboard plus normalising parser addresses exactly this (inf.).

### Gaps
- No verified adoption numbers for Classi (current), MetaMoJi (national) or SKYMENU Cloud. No data on Google/Microsoft Forms use in 中学数学. No Japan data for Mentimeter, Slido, Socrative, Plickers or Formative (not searched).
- No unit prices for ロイロ, スクールタクト or ミライシード.
- MEXT's GIGA usage-survey summaries showed up in search but were **blocked (403)**. They likely contain usage-frequency data and are worth reading manually:
  - `https://manabi-mirai.mext.go.jp/upload/2025_chousa_point.pdf`
  - `.../2025_chousa_hosoku.pdf`
  - a **Saga-specific** file, `.../41saga_2025chousa.pdf`
- UNVERIFIED lead: Plickers (paper answer cards scanned by the teacher's phone) is the best-known global analog for an "offline / printable fallback". Check its current pricing and status.

---

## 2. 振り返り practice, automated reflection analysis, mental-health check-ins, evidence

### Takeaway
Japanese schools are actively experimenting with AI analysis of 振り返り:
- LEADING DX schools use generative AI or NotebookLM.
- スクールタクト's 振り返りAI分析(β) analyses reflections along "5つの観点".
- A 2025 スクールタクト pilot extracts 「成長の兆し」.

Most published practice is **teacher-side** analysis. Only one 小学校 sends AI comments back to students. No source showed immediate rule-based 問い返し to students, or detection of copy-pasted reflections. Mental-health check-ins (心の健康観察) are a separate, policy-funded category (MEXT/MHLW; 地方財政措置 FY2025–2027).

### Cited Findings
**スクールタクト**
- 「振り返りAI分析(β版)」: a free official 実践事例集 explains 「振り返りの5つの観点」 as analysis axes, with 小・中・高 cases (date not in extract) — [ASCII](https://ascii.jp/elem/000/004/171/4171325/).
- In a 2025 training report, teachers saw AI sort pupils' reflections into 「事実・感想・考察など」 and then discussed how to give feedback — [パナソニック教育財団 2025](https://www.pef.or.jp/db/pdf/2025/2025_20.pdf).
- コードタクト 教育総研 pilot (PR 2025-08-18): 「児童生徒の振り返りの記述をAIが分析し、『成長の兆し』や『教訓化』につながる学びのヒントなどを抽出」 — [リセマム/PR TIMES](https://resemom.jp/release/prtimes/20250818/154119.html).
- FY2025 plan: five pilots with five schools (PR 2025-06-20) — [リセマム/PR TIMES](https://resemom.jp/release/prtimes/20250620/148117.html).
- 2026-08: スクールタクト released 「TUNE(β版)」, a conversational AI for students. It is distinct from the reflection analysis — [ASCII](https://ascii.jp/elem/000/004/374/4374680/).

**Public-school practice (LEADING DX and others)**
- 札幌市立中央中学校 (リーディングDXスクール; uploaded 2025-07)
  - Generative AI and teachers each evaluated students' 振り返り, and the results were compared.
  - The AI comments were usable by teachers.
  - Valid evaluation required clearer 発問 and clearer target competencies.
  - [LEADING DX](https://leadingdxschool.mext.go.jp/wp/wp-content/uploads/2025/07/C101210110022_format2.pdf)
- 奈良市立若草中学校 (FY2024 LEADING DX)
  - Teachers ran existing 「めあて・振り返りシート」 through NotebookLM.
  - It surfaced つまずき they had missed, which they fed into the next lesson.
  - [LEADING DX](https://leadingdxschool.mext.go.jp/files/achieve_r6/ai/C129210000032_A1.pdf)
- 霞ヶ浦北小学校 (茨城; uploaded 2025-07)
  - Pupils send goals and reflections to generative AI, which replies with a comment by mail to each pupil.
  - Teachers can see the same content.
  - [LEADING DX](https://leadingdxschool.mext.go.jp/wp/wp-content/uploads/2025/07/B108223000014_format2.pdf)
- 東京都教育委員会 material (2026-01, high school)
  - Reflecting through dialogue with AI turned 「１対40」 reflection into 「（１対１）×40」.
  - [都教委](https://www.kyoiku.metro.tokyo.lg.jp/documents/d/kyoiku/kaihatsu_sidousiryou2). Search also returned [this 都 file](https://infoedu.metro.tokyo.lg.jp/file/fcd9178702871925fb7155688a964d15.pdf); I could not confirm which of the two contains the quote.

**心の健康観察 (mental-health check-ins)**
- MEXT aims for nationwide 心の健康観察 using 1人1台端末. These tools fall under 地方財政措置 within the 学校ICT環境整備3か年計画 (FY2025–2027) (MEXT document 2026-07-07) — [MEXT](https://www.mext.go.jp/content/20260707-mext_jidou01-000050895_7.pdf).
- MHLW framed it as a new FY2024 project for early detection of SOS signals — [MHLW](https://www.mhlw.go.jp/content/12200000/001144395.pdf).
- Municipal rollouts:
  - 岡山市: all 小中・義務教育学校 from 2024, about 5万人 students — [KSB](https://news.ksb.co.jp/article/15179894)
  - 鳥取市: all schools from FY2025 — [鳥取市](https://www.city.tottori.lg.jp/www/contents/1744270233184/simple/3.pdf)
  - Discussed in the 埼玉県議会 in 2026-06 — [埼玉県議会](https://www.pref.saitama.lg.jp/e1601/gikai-gaiyou/r0806/4/d/0402.html)
- **No national implementation rate was found.**

**Local data on device use**
- 熊本市 FY2025 tablet-use survey (published 2026-03) — [熊本市](https://www.city.kumamoto.jp/kiji00325530/3_25530_up_lagi14ya.pdf).
- 仙台市 FY2022: the share of teachers using devices 「毎日+週3〜4日」 rose from 51.0% to 53.9% (**pre-2025**) — [仙台市](https://www.city.sendai.jp/johokasuishin/kurashi/manabu/kyoiku/inkai/kanren/documents/03tyosa1.pdf).

**kazu's design, for comparison (local, not web)**
- Rule-based check on six viewpoints: 比例・反比例の言葉を使ったまとめ, つまづきの自覚, 次の一手, 問いの発生, 前回との接続, 学び方の工夫.
- Flags: ⚠要フォロー (including SOS words), ⭐得意サイン, 📋 suspected copy reuse.
- Immediately returns one randomized 問い返し: 6 variants for つまづき, 4 for 質問, 4 for 理解, 5 for 意欲, plus 16 encouragement messages.
- Analysis runs client-side; only the result goes to the server.
- `/home/user/math-dialogue/quiz/README.md` (lines 50–57).

### Inferences
- **The closest commercial analog to kazu's reflection engine is スクールタクト 振り返りAI分析(β).** Inferred differences:
  - Theirs is AI-based, generic (5 viewpoints such as 事実/感想/考察), inside a paid platform, and aimed at teacher insight.
  - kazu's is rule-based and transparent, tied to the math unit, free, and returns a 問い返し to the **student** within seconds.
- **Teachers want help reading 30–40 reflections, and validity depends on clear 発問 and targets** (札幌, 奈良). This supports tying the reflection viewpoints to each lesson's めあて and to the 発問の木.
- **Copy-paste or template reflections (形骸化) were not addressed by any tool found.** This may be distinctive, but it is **not exhaustively verified**.
- **kazu's ⚠SOS keyword flag overlaps with 心の健康観察**, which is now policy-funded and served by dedicated vendors. Safer positioning: a "learning-difficulty flag" that points SOS cases to the school's official channel. It should not be presented as a mental-health tool.

### Gaps
- **Not searched (budget):** シャボテンログ, RAMPS, こころの天気-type check-in tools, STANDBY (anonymous bullying reports), Microsoft Reflect. Vendors, adoption and prices are unknown here.
- No evidence was gathered on copy-paste detection in any product.
- The names of スクールタクト's 5 viewpoints were not in the extract; only 事実・感想・考察 appear as examples.
- **Evidence on reflection quality and metacognition was not searched.** UNVERIFIED lead: the EEF Teaching & Learning Toolkit rates "metacognition and self-regulation" as high-impact (about +7 months). Verify on educationendowmentfoundation.org.uk before citing.

---

## 3. Math-specific digital assessment: formula input, equivalence grading, handwriting, graph input

### Takeaway
Within what could be verified, free-response math input graded by equivalence is **still rare** in Japanese K-12 tools:
- Google Forms grades by exact match.
- The national CBT (all subjects from FY2027) is limited to auto-scorable 選択式 and 短答式.
- STACK, the main open engine for formula equivalence, is used in universities.
- Microsoft's free Math Solver was retired in 2025.
- Drill products use their own per-item input.

Handwriting recognition does exist (e.g. ミライシード eライブラリ手書きex). But no source showed **teacher-authored** equivalence grading inside school platforms, or misconception-level analytics.

### Cited Findings
**National assessment moving to CBT**
- 2025: 中学理科 was the first CBT subject. 2026: 中学英語 CBT. **From FY2027 all subjects are CBT and paper booklets are abolished** (report dated 2025-04-17) — [千葉日報](https://www.chibanippo.co.jp/newspack/20250417/1427953).
- In FY2026, 中学 国語・数学 were still paper — [MEXT 2026-06-08](https://www.mext.go.jp/content/20260608-mxt_chousa02-000050213-01.pdf).
- CBT items will be auto-scorable 「選択式、および短答式」; no 記述式 — [沖縄県 R8 仕様書](https://www.pref.okinawa.jp/_res/projects/default_project/_page_/001/041/388/r8siyousyo.pdf).
- **No math input specification for 2027 was found.**
- MEXCBT auto-scoring is used for instant feedback in practice (a 小学校 example covering 国語・算数・理科; undated) — [千葉県 事例](https://www.pref.chiba.lg.jp/kyouiku/shidou/gakuryoku/documents/6kimitusirituseiwashou.pdf).

**STACK on Moodle**
- Auto-grades formulas, with partial credit and feedback.
- The Japanese localisation and community are led by 中村泰之 (名古屋大学).
- Reports involve 北里大, 龍谷大, 静岡大, 大阪大 and 大阪公立大.
- Workshops: JSiSE 2025 and MoodleMoot Japan 2026, covering problem authoring through data analysis.
- Authoring is still 「試行錯誤が多い」. A 2025 report describes an iOS app for smartphone use.
- [JSiSE 2025 PC4](https://www.jsise.org/taikai/2025/program/contents/pdf/PC4.pdf); [JSiSE 東海支部 2025](https://www.jsise.org/wp-content/uploads/2026/02/2025_tokai_a04.pdf); [KAKEN 18H01069](https://kaken.nii.ac.jp/en/grant/KAKENHI-PROJECT-18H01069/)
- **No high-school adoption was found.**

**Research on input and grading pitfalls**
- Both text-based and structure-based formula input burden learners. MathTOUCH, implemented on STACK, made input 1.2–1.6× faster (2015, **pre-2025**) — [IPSJ 論文誌](https://ipsj.ixsq.nii.ac.jp/record/142541/files/IPSJ-TCE0103004.pdf).
- **Equivalence pitfall.** A 会津大学 report on auto-grading written math answers notes that pure equivalence checking wrongly accepts answers that break 文字式 conventions, so grading must respect writing rules (2020, **pre-2025**) — [会津大学](https://www.jc.u-aizu.ac.jp/news/management/gr/2020/19.pdf).
- Handwriting (2022, **pre-2025**): many items that should take formula answers have been replaced by other formats. Better handwriting recognition now makes handwritten-input CBT on Moodle practical — [IEICE](https://www.ieice.org/ken/paper/202201225CI0/).

**Drill products**
- ミライシード ドリルパーク: the AI drill offers several input methods depending on the item, and 途中式 can be kept as a handwritten memo (名古屋市 guide, 2026-04) — [名古屋市](https://deragiga.city.nagoya.jp/wp-content/uploads/2026/04/student_drillpark_guide_v1.pdf); [manual](https://manabipocket.ed-cl.com/index.php/download_file/view/895).
- 「eライブラリ手書きex」 recognises characters handwritten in the answer box, then the student checks the result with a 判定 button (2024 manual) — [manual](https://manabipocket.ed-cl.com/wp/wp-content/uploads/2024/04/53f27d856547c43a15b5e05d777ffd3a.pdf).
- Qubena (COMPASS)
  - 170+ municipalities, about 2,300 小中, 1M+ users (page dated 2024, **pre-2025**) — [AIsmiley](https://aismiley.co.jp/ai_news/ai-support-study-suit-student-level/).
  - Provides detailed learning data to municipalities via 学習eポータル (2023-06, **pre-2025**) — [リセマム](https://resemom.jp/release/prtimes/20230623/100101.html).
  - Analyses 解答・解答プロセス・スピード・集中度 (2016 white paper, **old**) — [総務省 白書](https://www.soumu.go.jp/johotsusintokei/whitepaper/ja/h28/html/nc133230.html).
  - The answer-input method was not found.
- atama+
  - No adoption by a public-school municipality was found.
  - 2025: used for pre-enrolment math at 広島工業大学 — [リセマム 2025-01-21](https://resemom.jp/release/prtimes/20250121/133566.html).
  - Mainly cram schools, e.g. 鷗州塾's 中学数学 group classes, about 40 of 120–150 minutes a week — [リセマム 2020-12](https://resemom.jp/release/prtimes/20201215/67629.html) (attribution inferred from date; **pre-2025**).

**Other math tools**
- GeoGebra
  - Free for non-commercial use including schools; materials can be shared by URL or QR code (2023, **pre-2025**) — [琉球大学](https://www.lib.u-ryukyu.ac.jp/lib_uploadfile/learning_support/2023/2023-003_GeoGebra.pdf).
  - 中学 practice at 習志野市立第一中: GeoGebra diagram reading, with progress tracked in ClassNoteBook (2025-07) — [LEADING DX](https://leadingdxschool.mext.go.jp/wp/wp-content/uploads/2025/07/C112210001824_format2.pdf).
  - 広島大学附属東雲中 study of GeoGebra's effectiveness (2024) — [広大リポジトリ](https://ir.lib.hiroshima-u.ac.jp/00055250).
- ClassPad.net (Casio)
  - Free for teachers and students; freehand geometry and calculation; "Natural Display" for math input and output (2018, **old**) — [THE Journal](https://thejournal.com/articles/2018/04/19/casio-launches-free-public-beta-of-allinone-math-tool.aspx).
  - Japanese school case study (2025-09; a 国語-context case) — [Casio](https://classpad.net/content/dam/casio/global/classpad-net/school/casestudy/B5_donyujirei_2025-vol06_20250904.pdf).
- Global analogs covered in §1: Snorkl (AI feedback on explanations, follow-up question, retry) and Amplify Classroom (free graph-based Activity Builder). Microsoft Math Solver retired 2025-07-07.

### Inferences
- **On the key question:** yes, equivalence-graded free response is likely still rare for **teacher-made** quizzes in Japanese public schools. The bottleneck is not the math engine (STACK exists). It is:
  1. authoring and input UX that suits 中学生 on Chromebook or iPad;
  2. **pedagogically correct equivalence rules**: when should 4/10 or 2x+3x count as "not finished"? This is the 会津大学 pitfall.
- **The FY2027 national CBT (auto-scored 短答式) will raise demand** for practice typing numeric and formula answers under CBT conditions. kazu's math keyboard and parser fit this. MEXCBT's actual input UI should be checked so conventions match.
- **Graph input.** Drag-to-graph input exists in Desmos/Amplify-type tools and GeoGebra. In Japanese public-school platforms, no **auto-graded** graph input was found (inferred; not searched exhaustively).
- **Misconception analytics.** No Japanese platform found shows teachers a breakdown by misconception, as opposed to per-question accuracy. The only related claim is Qubena's "解答プロセス" analysis (2016).

### Gaps
- MEXCBT's math input UI (fractions, √, exponents) was not found.
- Answer-input details were not found for Qubena, スタディサプリ, ClassPad.net quizzes, or MetaMoJi's handwriting-to-math recognition.
- Mathpix and Formative's math auto-grading were not searched.

---

## 4. Data integration: 学習eポータル, MEXCBT, standards, SSO. Can small tools plug in?

### Takeaway
The evidence from this session is thin. 学習eポータル such as まなびポケット are the hubs (1,200+ municipalities), and vendors (MetaMoJi, Qubena) announce links into them. I could **not** verify the current standards (学習eポータル標準モデル, OneRoster Japan Profile, LTI, 教育データ標準) or the onboarding route for a small outside tool.

### Cited Findings
- まなびポケット scale: see §1 — [NTT Com](https://www.ntt.com/about-us/press-releases/news/article/2025/0114.html).
- MetaMoJi ClassRoom 3 links with まなびポケット — [PR TIMES](https://prtimes.jp/main/html/rd/p/000000409.000004007.html).
- Qubena, as 学習eポータル content, provides learning data to municipalities (2023-06, **pre-2025**) — [リセマム](https://resemom.jp/release/prtimes/20230623/100101.html).
- 岡山市, from FY2024: one learning product combining an AI drill and 授業支援 under a single account, across all 市立小中 (product not named in extract) — [ベネッセ VIEW next](https://view-next.benesse.jp/view_section/bkn-board/article32425) (attribution likely, not confirmed).
- MEXCBT auto-scoring in school practice: see §3 — [千葉県](https://www.pref.chiba.lg.jp/kyouiku/shidou/gakuryoku/documents/6kimitusirituseiwashou.pdf).

### Inferences
- For a solo developer, deep integration (OneRoster rostering, LTI launch, e-portal certification) is probably too heavy. The practical route is to stay **outside**: QR or URL, no roster, and Excel/CSV export (which kazu already has).
- Staying outside means no SSO. kazu's "school code + attendance number + password" covers this, but the identity guarantee is weaker. The README already accepts this as a low-risk teaching aid.

### Gaps
- UNVERIFIED leads from background knowledge, to verify:
  - the 学習eポータル標準モデル (MEXT / ICT CONNECT 21) specifies links to MEXCBT and digital content;
  - the OneRoster (1EdTech) Japan Profile handles roster exchange;
  - LTI 1.3 handles tool launch;
  - L-Gate (内田洋行) is another major 学習eポータル;
  - the national CBT runs on MEXCBT.
- Whether a non-commercial individual developer can register content with an e-portal, and at what cost, is unknown.
- The current version of 教育データ標準 and the use of 学習指導要領コード were not verified.

---

## 5. School-life tools: 席替え, 学級通信, event-reflection sharing, gamified class management (感想ひろば competitor check)

### Takeaway
In the limited search:
- 席替え tools were mostly small **iOS apps** (free with in-app purchases, or paid), and their support for fixed seats or eyesight constraints is unclear.
- Classcraft, the reference product for gamified class management, has reportedly been discontinued.

I could not search 学級通信 makers, Japanese gamified class tools, event-reflection sharing, or animated class-voice products. **"No direct competitor" for 感想ひろば is therefore unverified.**

### Cited Findings
- Let's席替え〜学校の先生もラクラク席替え〜: iPhone app, free with in-app purchases; fixed-seat support not stated — [App Store](https://apps.apple.com/jp/app/id1531555002).
- 瞬速!席替え抽選: iPad, US$4.99; enter the number of students and the layout (rows, columns, empty seats) — [App Store](https://apps.apple.com/us/app/%E7%9E%AC%E9%80%9F-%E5%B8%AD%E6%9B%BF%E3%81%88%E6%8A%BD%E9%81%B8/id6738973589).
- 席替えするよ (いちごプラス): allows manual placement of specific students — [App Store](https://apps.apple.com/us/app/%E3%81%84%E3%81%A1%E3%81%94%E3%83%97%E3%83%A9%E3%82%B9%E5%B8%AD%E6%9B%BF%E3%81%88%E3%81%99%E3%82%8B%E3%82%88/id1603062396).
- None of the listings found explicitly mentions eyesight (視力) constraints (per extract).
- Classcraft: a competitor's blog (LiveSchool) says Classcraft "has recently been discontinued" and its new HMH version has no behaviour-management components. No official date was found — [LiveSchool](https://www.whyliveschool.com/blog/liveschool-vs-classcraft-comparison-guide).
- G2 names ClassDojo as the top Classcraft alternative and describes it as a K-8 communication platform for teachers, students and families — [G2](https://www.g2.com/products/classcraft/competitors/alternatives).
- Padlet's free plan is capped at 3 boards, which matters for event-reflection "walls" — [FitGap](https://us.fitgap.com/products/padlet).

### Inferences
- **Seat change.** iOS-only apps do not suit ChromeOS-majority (60%) classrooms. A **web** seat tool with constraints (fixed or priority seats, pairs to separate, avoiding the same neighbour twice, a fairness history) is a plausible niche. Web-based 席替え sites were not checked.
- **Event reflections.** The generic alternative, a Padlet wall, has a small free cap and is a non-playful posting wall. 感想ひろば's anonymous characters moving in an event scene is a different idea. Whether a Japanese product already does this was **not checked**.

### Gaps
- **Not searched (budget):**
  - web 席替え sites (e.g. constraint-aware generators);
  - 学級通信 makers and AI drafting;
  - ClassDojo use in Japan;
  - Japanese gamified class-management tools;
  - 行事 reflection sharing (ロイロ, word clouds, digital 卒業文集 or 寄せ書き);
  - **any product showing class voices as animated scenes: the direct competitor check for 感想ひろば was NOT done.**
- UNVERIFIED lead: HMH sunset the original Classcraft product on 2024-06-30. Verify the date before citing.

---

## 6. Context: teacher workload and 校務DX

### Takeaway
The latest full official data, the 教員勤務実態調査 2022 (finalised 2024-04), show 中学校 teachers on site 11h01m per weekday, down 31 minutes from 2016. 成績処理 averages only about 12 minutes a day, which suggests assessment work comes in peaks rather than daily. 校務DX self-checks continue every year: the FY2025 round ran in 2025-11/12 with a 98.6% response rate. Vendors are piloting 校務 apps, including in Saga (武雄市).

### Cited Findings
- 教員勤務実態調査 令和4年度 確定値, 中学校教諭 (**pre-2025**, but still the latest full national survey found) — [MEXT 2024-04-04](https://www.mext.go.jp/content/20240404-mxt_zaimu01-100003067-1.pdf):
  - weekday 在校等時間 **11:01** (H28: 11:32);
  - weekend 2:18 (H28: 3:22);
  - **成績処理 on weekdays 12 minutes** (H28: 13);
  - the weekend drop came mainly from 学校行事 and 部活動.
- 校務DXチェックリスト
  - FY2025 (令和7年度) self-assessment ran 2025-11-05 to 12-10, with a 98.6% response from 公立義務教育諸学校 and 100% from 設置者 — [MEXT 2026-03-06](https://www.mext.go.jp/content/20260306-mxt_shuukyo01-000048038_3.pdf).
  - FY2024: preliminary results 2024-12-26, final results on the MEXT page — [MEXT](https://www.mext.go.jp/a_menu/shotou/zyouhou/detail/mext_02597.html); [MEXT 2025-03-26](https://www.mext.go.jp/content/20250326-mxt_jogai01-000033278_0.pdf).
  - A 杉並区 report quotes FY2025 national values, such as the share of schools contacting students via cloud services — [杉並区](https://www.city.suginami.tokyo.jp/documents/25091/houkoku02.pdf).
- 校務 apps in pilot: SKYMENU Mobile in 武雄市 (佐賀) and 倉吉市 (2026) — [北海道新聞/PR](https://www.hokkaido-np.co.jp/article/1356450/); [共同通信PRワイヤー](https://kyodonewsprwire.jp/release/202609145832).
- LoiLo frames its free AI as 「先生を支え」 (2026-09-19) — [DIME/LoiLo PR](https://dime.jp/company_news/detail/?pr=2714506).

### Inferences
- Average daily 成績処理 time is small, so the biggest value of small tools probably lies in:
  1. instant auto-grading that prevents an end-of-unit backlog;
  2. turning 30–40 reflections into a short "who needs follow-up" list;
  3. the work after a 行事: collecting and sharing 感想, writing 学級通信.

  The third has not been quantified.

### Gaps
- Not found:
  - national workload data newer than 2022;
  - minutes spent preparing 行事;
  - surveys of which small tasks teachers most want automated;
  - item-level FY2025 校務DX results (e.g. the share using デジタル採点).
- UNVERIFIED lead: the 給特法 amendment (enacted 2025-06) raises the 教職調整額 in steps from 4% to 10% starting 2026 and targets about 30 hours a month of 時間外在校等時間. Verify before citing.

---

## 7. Open niches for a solo teacher-developer

### Takeaway
This section is mostly inference from the verified landscape. Incumbents look weak in five places:
1. math-specific short-answer practice whose equivalence checking also respects answer form, aligned with the FY2027 CBT;
2. reflection → instant student 問い返し loops with transparent rules and copy-paste awareness;
3. playful, anonymous, no-login visualisations of class voices for 行事;
4. web seat tools with constraints for Chromebook classrooms;
5. fork-able templates with printable or offline fallbacks.

### Cited Findings (anchors for the niches)
- Google Forms grades by exact match, so every variant (全角/半角) must be listed — [Qualtir](https://qualtir.com/ja/blog/google-forms-online-exams-timed-assessments); [札幌市立中央中](https://www16.sapporo-c.ed.jp/chuo-j/attach/get2/2539/0).
- All subjects go CBT in FY2027, with auto-scored 選択式/短答式 only — [千葉日報](https://www.chibanippo.co.jp/newspack/20250417/1427953); [沖縄県](https://www.pref.okinawa.jp/_res/projects/default_project/_page_/001/041/388/r8siyousyo.pdf).
- The free Microsoft Math Solver was retired 2025-07-07 — [Wikipedia](https://en.wikipedia.org/wiki/Microsoft_Math_Solver).
- Incumbents are adding AI: LoiLo (free) and スクールタクト (振り返りAI分析β, TUNE) — [DIME](https://dime.jp/company_news/detail/?pr=2714506); [ASCII](https://ascii.jp/elem/000/004/374/4374680/).
- Teachers are already analysing reflections with AI — [札幌中央中](https://leadingdxschool.mext.go.jp/wp/wp-content/uploads/2025/07/C101210110022_format2.pdf); [奈良若草中](https://leadingdxschool.mext.go.jp/files/achieve_r6/ai/C129210000032_A1.pdf).
- Licences are yearly and contracts churn — [前橋市](https://www.city.maebashi.gunma.jp/material/files/group/95/siyousyomiraisi-do2026.pdf); [港区](https://www.city.minato.tokyo.jp/kouchou/kuse/kocho/ikenshokai49/4603.html).
- OS mix: ChromeOS 60%, iPad 31% — [helentech](https://helentech.jp/news-71040/).
- Seat apps found are iOS-only — [App Store](https://apps.apple.com/jp/app/id1531555002).
- Padlet's free tier holds 3 boards — [FitGap](https://us.fitgap.com/products/padlet).
- Sharing math materials by URL or QR is established practice (GeoGebra) — [琉球大学](https://www.lib.u-ryukyu.ac.jp/lib_uploadfile/learning_support/2023/2023-003_GeoGebra.pdf).
- Global pattern to borrow: Snorkl's "explain → AI feedback → follow-up question → retry" — [AVID](https://avidopenaccess.org/resource/snorkl-for-automated-ai-generated-student-feedback).

### Inferences
- **Niche A: math short answers graded by equivalence *and* form.** Platforms either grade by exact match (Forms) or are closed drills. A free, teacher-editable item bank with per-item equivalence and form rules, on a CBT-like keyboard, has no verified equivalent in Japanese schools.
- **Niche B: reflection loops that reply to the student.** Incumbents analyse reflections for the teacher, after the fact. An instant, explainable 問い返し to the student is rare. Transparent rules also make school approval easier than sending student text to an LLM.
- **Niche C: anonymous, playful class-voice visualisation.** Generic walls (Padlet, ロイロ cards) are not designed as fun, anonymous, event-themed "scenes". Competitor status is unverified.
- **Niche D: constraint-aware web seat tool** for Chromebook classrooms. Competitor status of web tools is unverified.
- **Niche E: "forkable + printable".** Yearly licence churn favours tools that live outside platforms. A template other teachers can copy, change and redeploy, with a one-page security explanation and a print fallback, enables kazu's "multiplication" model.

### Gaps
- Whether QR, no-login, no-name designs pass school security policies was **not verified**. Not checked: 教育情報セキュリティポリシーに関するガイドライン (latest revision), MEXT's 生成AI guideline, and Supabase data-residency requirements.
- Teacher demand for niches C and D is not quantified.

---

## Gaps and opportunities for kazu

### Takeaway
kazu's assets sit in places where the verified landscape is thin:
- free-response math graded by equivalence (rare);
- reflection analysis that replies to the **student** (incumbents focus on the teacher);
- anonymous, playful 行事 visualisation (no competitor found, but not checked);
- iOS-dominated seat apps.

The strongest move fits his philosophy: make each tool **forkable and approvable** (template, security sheet, print fallback) rather than adding more features alone.

### Cited Findings (kazu's assets — local repo, for grounding)
- **小テスト+振り返り**: `/home/user/math-dialogue/quiz/README.md`
  - QR distribution; no names stored; ID = school code + 4-digit attendance number + hashed password.
  - Teacher-controlled 配布; one attempt per day (enforced by a DB unique constraint).
  - Parser equivalence (`2/5` = `0.4`); grid/hyperbola drag input.
  - Six-viewpoint reflection rules with ⚠/⭐/📋 flags and randomized 問い返し.
  - Dashboard: per-question view, Excel export, projector mode; study-time ranking.
- **応用チャレンジ**: `/home/user/math-dialogue/applied/README.md`
  - 8 めあて sets × 5–10 problems; unlimited retries; per-problem mistake view.
  - Equivalence covers `y=3x` vs `3x`. No names: a 4-digit number only; RLS plus security-definer RPCs.
- **家庭学習ノート**: `/home/user/math-dialogue/home/README.md`
  - Self-reported minutes plus an auto-timer (pauses when the tab is hidden).
  - Tracks redo and challenge counts; 61 problems.
- **感想ひろば**: `/home/user/math-dialogue/event-voices/README.md`
  - Event scenes for 体育大会, 宿泊研修 and 文化発表会; real data of 71 per event in the repo.
  - `xlsx-to-data.py` reads Google Forms xlsx row by row (a guard against counting multi-line cells as several people).
  - Distributed by an unguessable URL plus QR, with no names.

### Inferences — concrete openings

**1. Position 小テスト / 応用チャレンジ as 「全国学調CBT(2027〜)短答式に慣れる」 practice.**
- From FY2027 all national-assessment subjects are CBT, with auto-scored 短答式 ([千葉日報](https://www.chibanippo.co.jp/newspack/20250417/1427953), [沖縄県](https://www.pref.okinawa.jp/_res/projects/default_project/_page_/001/041/388/r8siyousyo.pdf)).
- Add a "CBT-like" mode that uses the same item types (integers, fractions, simple expressions) and a mock timer.
- Once MEXCBT's math input UI is verified, publish an input-conventions table so students practise the real conventions.

**2. Make "equivalent ≠ finished" a feature: rules that check form as well as value.**
- For each item: 「同値ならOK」 / 「既約分数・同類項整理まで要求」 / 「小数不可」.
- When an answer is equivalent but not simplified (e.g. `4/10`), return a 問い返し (「約分できるかな?」) rather than a plain ×.
- This fixes the pitfall the 会津大学 report identifies ([会津大学](https://www.jc.u-aizu.ac.jp/news/management/gr/2020/19.pdf)).
- It is also the step Google Forms cannot do ([Qualtir](https://qualtir.com/ja/blog/google-forms-online-exams-timed-assessments)).

**3. Turn per-question error analysis into misconception analysis by linking the 発問の木.**
- Tag typical wrong answers with misconception IDs, e.g. `5/2` for `2/5` → reciprocal confusion; sign errors on `y=-3x`.
- Show teachers 「誤概念別」 counts, plus the matching 補助発問 from the 発問の木.
- No Japanese platform found offers misconception-level analytics; the only adjacent claim is Qubena's 2016 解答プロセス analysis.
- This also links the Socratic dialogue app and the quiz, mirroring Snorkl's "follow-up question when wrong" ([AVID](https://avidopenaccess.org/resource/snorkl-for-automated-ai-generated-student-feedback)).

**4. Publish the reflection engine as an open, forkable 「振り返りルーブリック・パック」.**
- Contents: the 6 viewpoints, keyword lists (`REFL_KW`) and message banks (`REFL_MSG`) as JSON, one pack per unit or subject.
- Differentiation from スクールタクト 振り返りAI分析(β) ([ASCII](https://ascii.jp/elem/000/004/171/4171325/)):
  - transparent and editable rules;
  - an instant 問い返し to the **student**;
  - no transfer of student text to AI vendors;
  - vocabulary specific to the unit.
- Add a per-student timeline of "viewpoint coverage" so growth in metacognition is visible (the EEF evidence is unverified here).
- Optional, teacher-only: export anonymized reflections as CSV for NotebookLM or Gemini analysis, as 奈良市立若草中 did ([LEADING DX](https://leadingdxschool.mext.go.jp/files/achieve_r6/ai/C129210000032_A1.pdf)). This adds no API keys or cost to the tool.

**5. Lead with copy-paste detection as a distinctive anti-形骸化 feature.**
- No product found addresses reused or template reflections (not exhaustively verified).
- Extend it to show similarity to the previous reflection, with a gentle prompt: 「今日だけの新しい言葉を1つ足してみよう」.

**6. Re-scope the SOS flag.** 心の健康観察 is now policy-funded and handled by dedicated tools ([MEXT](https://www.mext.go.jp/content/20260707-mext_jidou01-000050895_7.pdf)). Keep ⚠ as a **learning** follow-up flag. For SOS words, show the teacher a "school procedure" reminder and do not claim mental-health screening (lower liability, easier approval).

**7. Turn 感想ひろば into a no-code template generator.**
- Run the current `xlsx-to-data.py` logic in the **browser** (client-side xlsx parsing, nothing uploaded).
- The teacher picks a scene template (体育大会 / 宿泊研修 / 文化祭 / 修学旅行 / 合唱コンクール / 卒業) and gets either:
  - a **single self-contained HTML file** (works offline, on a USB stick, or attached in Classroom or ロイロ), or
  - a hosted unguessable URL plus QR.
- Add moderation: a teacher hide/approve step, an NG-word filter, and a detector for personal names inside comments (comments are anonymous but may mention classmates).
- Add a **printable poster** (selected comments plus QR) for 学級通信 and hallway display.
- The nearest generic alternative, Padlet, has a 3-board free cap ([FitGap](https://us.fitgap.com/products/padlet)).
- **Before publicising, run the direct-competitor search that this session could not.**

**8. Rebuild 座席ルーレット as a constraint-aware, web-first, printable tool.**
- Seat apps found are iOS-only and do not clearly support constraints ([App Store](https://apps.apple.com/jp/app/id1531555002)), while classrooms are 60% Chromebook ([helentech](https://helentech.jp/news-71040/)).
- Features:
  - fixed seats and priority front seats (視力・聴覚・配慮);
  - pairs to keep apart;
  - "avoid the same neighbour as last time", with a fairness history kept in the browser;
  - roulette animation for the projector;
  - one-click A4 seating chart.
- Names stay optional and local only, matching kazu's no-names principle.

**9. Build a "multiplication kit" for other teachers.**
- A GitHub template repository; `schema.sql`; a one-page deploy guide (Supabase + Cloudflare Pages).
- A 「問題データ作成シート」 (spreadsheet → `quizdata.js` converter) so teachers can swap in their own unit without coding.
- A **one-page 「セキュリティ説明シート」** for 校長 and 情報担当: what is stored (school code, attendance number, hashed password, answers), what is **not** (names), where it is stored, retention, and deletion.
- Approval friction is the likely bottleneck; the governing guideline could not be verified this session.

**10. Pitch the tools as platform-agnostic companions.**
- The QR or URL can be posted inside ロイロ, スクールタクト or Google Classroom, so the tools keep working when municipalities switch platforms on yearly licences ([前橋市](https://www.city.maebashi.gunma.jp/material/files/group/95/siyousyomiraisi-do2026.pdf), [港区](https://www.city.minato.tokyo.jp/kouchou/kuse/kocho/ikenshokai49/4603.html)).
- Do not compete with platforms. Fill the math-specific gaps they leave.

**11. Connect 家庭学習ノート to the reflection engine.**
- A weekly "plan → do → reflect" card for home study, reusing the viewpoint rules (次の一手, 学び方の工夫). This supports self-regulated learning.
- Review whether the public study-time **ranking** is appropriate for every school culture: offer an option to show it anonymously or turn it off (inf.).

**12. Use the 297-hour lesson set as the item-bank backbone, licensed CC BY.**
- Generate quiz and 応用 items aligned to each lesson's めあて.
- Invite other teachers to contribute items and misconception tags; this is the "multiplication" route.

**13. Use the Saga angle.**
- A Saga-specific MEXT GIGA survey exists (`manabi-mirai.mext.go.jp/upload/41saga_2025chousa.pdf`, blocked this session).
- 武雄市 is piloting a 校務 app ([北海道新聞/PR](https://www.hokkaido-np.co.jp/article/1356450/)).
- Both suggest local interest in DX. A 佐賀県内 teacher network could be the first group of other teachers to adopt and modify the tools (inf.).

### Gaps (verify before acting)
- **Direct competitors** for 感想ひろば (animated class-voice scenes) and for constraint-aware **web** 席替え tools: not searched.
- Rules for QR, no-login, no-name and external-cloud (Supabase) tools: not verified. This includes the latest 教育情報セキュリティポリシーに関するガイドライン and the policies of 佐賀県教委 and 致遠館.
- MEXCBT's math input conventions for the FY2027 CBT: not found.
- Evidence linking reflection prompts or 問い返し to metacognitive gains (EEF etc.): not verified.
- Mental-health check-in tools (シャボテンログ, RAMPS, こころの天気, STANDBY): not researched, so overlaps with kazu's SOS flag cannot be mapped precisely.
- Data on which small tasks teachers most want automated (e.g. 学級通信, 行事 aftermath, 所見): not found.
