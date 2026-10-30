/* コンテンツ一覧のデータ。ここに1ブロック足すだけで、一覧に増える。
   足したら： node contents/tools/check.cjs   （リンク先・書き忘れ・載せ忘れを調べる）
              node contents/tools/bundle.cjs  （1ファイル版を作り直す）

   項目の書き方（* は必須）
     id*       半角の英数字とハイフン（重複しない）
     title*    カードの見出し
     summary*  1〜2文（120字まで）。READMEに書いてあること以上は言わない
     cat*      分類（下の cats の key）
     who*      だれが使う：kids（生徒・こども）／teacher（先生・コーチ）／me（自分）
     status*   use=使える形／wip=育成中／sample=例・サンプル／legacy=旧版
     access*   open=公開／limited=限定配布／personal=自分用
     live      ウェブの公開先（pages のあとの道すじ。'adlib/'）。
               ※ limited・personal には書かない（生徒に配るURLを一覧に出さないため）
     file      1ファイル版（リポジトリの中の道すじ）。ダウンロードしてダブルクリックで開ける
     dir*      ソースのフォルダ（リポジトリの中の道すじ。'' ならリポジトリのいちばん上）。
               「ソース」を開くと、GitHub がフォルダの README を下に出してくれる
     how*      開き方の短い説明（カードの「開き方」に出る）
     tags      検索に使うことば */
window.CB = {
  pages: 'https://dora9991.github.io/math-dialogue/',
  repo: 'https://github.com/dora9991/math-dialogue/',
  branch: 'main',

  cats: [
    { key: 'learn', label: '生徒の学びを作る' },
    { key: 'teach', label: '先生の負担を減らす' },
    { key: 'event', label: '体験・あそび' },
    { key: 'basket', label: 'バスケ' },
    { key: 'self', label: '暮らしと創作' },
  ],
  who: [
    { key: 'kids', label: '生徒・こども' },
    { key: 'teacher', label: '先生・コーチ' },
    { key: 'me', label: '自分用' },
  ],
  status: [
    { key: 'use', label: '使える形' },
    { key: 'wip', label: '育成中' },
    { key: 'sample', label: '例・サンプル' },
    { key: 'legacy', label: '旧版' },
  ],
  access: [
    { key: 'open', label: '公開' },
    { key: 'limited', label: '限定配布' },
    { key: 'personal', label: '自分用' },
  ],

  // 一覧に載せないフォルダ（アプリではないもの）。check.cjs の「載せ忘れ」の検査から外す
  skip: ['docs', 'public', 'scripts', 'src', 'node_modules', 'dist', 'contents'],

  items: [
    // ───────── 生徒の学びを作る ─────────
    {
      id: 'math-labo',
      title: '数学ラボ（ゲーム学習＋AIと対話する授業）',
      summary: '中学数学のゲーム学習（タイムアタック・間違いノート）と、AI先生と発問でやり取りする対話授業（中1全7章・122授業）。このリポジトリの本体。',
      cat: 'learn', who: ['kids'], status: 'wip', access: 'open',
      live: '/', dir: '',
      how: 'ターミナルで npm install → npm run dev。表示されたURLをブラウザで開く。',
      tags: ['数学', 'ゲーム', 'AI', '対話', '発問', '中学'],
    },
    {
      id: 'tangocho',
      title: '計算単語帳（1分トレーニング）',
      summary: '頭の中で計算できる力を、1分ずつきたえる単語帳。ひとりでも、ペア学習でも。画面で使うことも、紙に印刷して配ることもできる。',
      cat: 'learn', who: ['kids', 'teacher'], status: 'use', access: 'open',
      file: 'tangocho/tangocho-all-in-one.html', dir: 'tangocho',
      how: '1ファイル版をダウンロードして、ダブルクリックでブラウザで開く（印刷もできる）。すぐ印刷するなら pdf/ のPDF。',
      tags: ['計算', '印刷', 'ペア学習', 'PDF'],
    },
    {
      id: 'hs-board',
      title: '高校数学 黒板解説',
      summary: '黒板に1行ずつ書きながら解説するブラウザ教材（数学Ⅰ・A・Ⅱ・B・Ⅲ・C、共通テストと難関大の類題）。途中に発問と「考えてみよう」が入る。',
      cat: 'learn', who: ['kids', 'teacher'], status: 'use', access: 'open',
      live: 'hs-board/', dir: 'hs-board',
      how: '手元では python3 -m http.server 8830 --directory hs-board。index.html を直接開いても動く。',
      tags: ['高校', '数学', '黒板', '共通テスト', '入試'],
    },
    {
      id: 'applied',
      title: '応用チャレンジ（1年4章 比例と反比例）',
      summary: 'ワークシートの各めあてに対応した、入試・実力レベルの応用問題にQRコードから挑戦するツール。記述式は数式を同値判定する。',
      cat: 'learn', who: ['kids', 'teacher'], status: 'use', access: 'limited',
      dir: 'applied',
      how: '先生が index.html を投影し、めあてのQRを生徒が読みとる。結果は先生用ダッシュボード（PIN）で見る。',
      tags: ['QR', '応用', '比例', '反比例', '中1'],
    },
    {
      id: 'home',
      title: '家庭学習ノート（試作）',
      summary: '家でやった数学の自主学習を「見える化」するツール。数式キーボードで解き、解いた数・チャレンジ・やり直し・学習時間を記録する。',
      cat: 'learn', who: ['kids', 'teacher'], status: 'sample', access: 'limited',
      dir: 'home',
      how: '生徒は index.html、先生・保護者は analyze.html（PIN）。',
      tags: ['家庭学習', '自主学習', '記録', '比例'],
    },

    // ───────── 先生の負担を減らす ─────────
    {
      id: 'hyojun-navi',
      title: '授業ナビ 標準版',
      summary: '中1〜中3の授業297時間ぶんの年間計画と教材（授業構想・板書計画・ワークシート・演習プリント・小テスト・スライド）。',
      cat: 'teach', who: ['teacher'], status: 'wip', access: 'open',
      dir: 'hyojun-navi',
      how: 'python3 serve.py → http://127.0.0.1:8811/ （index.html を直接開いても動く）。',
      tags: ['年間計画', '授業構想', '板書', 'ワークシート', 'スライド', '印刷'],
    },
    {
      id: 'ikkan',
      title: '数学ワークシート（板書型）ikkan',
      summary: '黒板に書く授業のためのワークシート。問題の下は空欄にして、「解答を表示」で教師が板書する内容が赤で出る。',
      cat: 'teach', who: ['teacher', 'kids'], status: 'use', access: 'open',
      live: 'ikkan/', file: 'ikkan/ikkan-all-in-one.html', dir: 'ikkan',
      how: 'ウェブで開く。または1ファイル版をダウンロードして、ダブルクリック。',
      tags: ['板書', 'ワークシート', 'スライド', '印刷', '一次関数', '平行と合同'],
    },
    {
      id: 'lesson-live',
      title: '授業ライブ',
      summary: '授業中に生徒の端末をつないだままにする、小テスト・振り返り・授業の反応ボタンのひとまとめ（中1全7章・小テスト45回）。',
      cat: 'teach', who: ['teacher', 'kids'], status: 'use', access: 'limited',
      dir: 'lesson-live',
      how: '生徒は index.html、先生は teacher.html、投影は screen.html。先生が授業を始めるとつながる。',
      tags: ['小テスト', '振り返り', '反応', '投影', 'リアルタイム'],
    },
    {
      id: 'quiz',
      title: '数学小テスト・振り返り（1年4章）',
      summary: '先生のQRから小テストを開いて解答し、結果がアカウントIDごとに蓄積される。氏名は保存しない。授業ライブの前身。',
      cat: 'teach', who: ['teacher', 'kids'], status: 'legacy', access: 'limited',
      dir: 'quiz',
      how: '先生のQRから小テストへ。先生用は teacher.html（PIN）。',
      tags: ['小テスト', 'QR', '比例', '反比例'],
    },
    {
      id: 'sekigae',
      title: '座席ルーレット',
      summary: '席替えのルーレット。優先席（目が悪い生徒）や、エアコン回避などの列の希望に対応。マクロ不要。',
      cat: 'teach', who: ['teacher'], status: 'use', access: 'open',
      live: 'sekigae/', dir: 'public/sekigae',
      how: 'ウェブで開く。名前を入力 → 優先席・列の希望・固定席を決めて、ルーレットを回す。',
      tags: ['席替え', '座席', '学級'],
    },
    {
      id: 'seitoshido-navi',
      title: '生徒指導 対応ナビ',
      summary: '生徒指導の場面で迷ったときの「分かれ道の地図」。問いに答えると、対応の手順・声かけの例・避けたい言葉・連携先・記録が出る。各校に合わせて直して使う「例」。',
      cat: 'teach', who: ['teacher'], status: 'sample', access: 'open',
      live: 'seitoshido-navi/', file: 'seitoshido-navi/seitoshido-navi-all-in-one.html', dir: 'seitoshido-navi',
      how: 'ウェブで開く。または1ファイル版をダウンロードして、ダブルクリック。場面を選ぶか、ことばで探す。',
      tags: ['生徒指導', '声かけ', 'いじめ', '連携', '記録'],
    },

    // ───────── 体験・あそび ─────────
    {
      id: 'event-voices',
      title: '感想ひろば（体育大会・宿泊研修・文化発表会）',
      summary: '学校行事の感想を、その行事らしい背景の中で動き回るイラスト人間として表示。タップすると、感想がふきだしで出る。名前・番号は持たない。',
      cat: 'event', who: ['kids', 'teacher'], status: 'use', access: 'limited',
      dir: 'event-voices',
      how: '行事ごとのページ。URLは校内限定で、QRコードで配る運用。',
      tags: ['行事', '感想', '体育大会', '宿泊研修', '文化発表会', 'QR'],
    },
    {
      id: 'mecha-battle',
      title: 'きょうだいメカバトル',
      summary: 'ジョイメカファイト風の対戦格闘ゲーム。ロボ8体で、ひとり／2人／CPU／ネット対戦（部屋コード）。',
      cat: 'event', who: ['kids'], status: 'use', access: 'open',
      live: 'mecha-battle/', dir: 'games/mecha-battle',
      how: 'ウェブで開く。ネット対戦は、部屋コードを相手に伝える。',
      tags: ['ゲーム', '格闘', '対戦', 'ドット絵'],
    },

    // ───────── バスケ ─────────
    {
      id: 'basket-tap',
      title: 'バスケ タップ記録',
      summary: '試合を見ながら、だれが・何をしたかをタップで記録。時刻つきなので、バスケ得点クリップに動画と一緒に読み込める。',
      cat: 'basket', who: ['teacher'], status: 'use', access: 'open',
      live: 'basket-tap/', dir: 'basket-tap',
      how: 'ウェブで開く。iPhoneは「共有」→「ホーム画面に追加」で画面いっぱいに。記録はその端末の中だけに保存。',
      tags: ['バスケ', '記録', 'スタッツ', 'iPhone'],
    },
    {
      id: 'basket-clips',
      title: 'バスケ得点クリップ',
      summary: '試合動画から、点を入れた場面・入れられた場面を5秒ずつ切り出す。続けて再生したり、1本のMP4に書き出したりできる。',
      cat: 'basket', who: ['teacher'], status: 'use', access: 'open',
      live: 'basket-clips/', dir: 'basket-clips',
      how: 'ウェブで開く → 試合動画を開く（ゴールは自動で探す）。タップ記録の読み込みもできる。',
      tags: ['バスケ', '動画', '切り出し', 'MP4', '得点'],
    },
    {
      id: 'basket-coach',
      title: 'バスケ・グロウ',
      summary: '小学生・中学生が、自分で使って上達していくバスケのアプリ。毎日のメニューで経験値がたまり、動画で動きをチェックでき、ケガの手当てとテーピングも見られる。',
      cat: 'basket', who: ['kids'], status: 'use', access: 'open',
      live: 'basket-coach/', file: 'basket-coach/basket-coach-all-in-one.html', dir: 'basket-coach',
      how: 'ウェブで開く（スマホは「共有」→「ホーム画面に追加」）。または1ファイル版をダブルクリック。',
      tags: ['バスケ', '練習', 'メニュー', '動画分析', 'テーピング', '小学生', '中学生'],
    },
    {
      id: 'minibasket',
      title: 'ミニバス スコアシート分析',
      summary: '公式スコアシート（JBA形式）の写真から、得点・フリースロー・ファウル・出場を読み取り、試合ごと・通算で分析する。',
      cat: 'basket', who: ['teacher'], status: 'use', access: 'open',
      file: 'minibasket/minibasket-all-in-one.html', dir: 'minibasket',
      how: 'Claudeのアーティファクトとして公開して使う。または1ファイル版で手動読み取り（ChatGPT・Geminiにも対応）。',
      tags: ['ミニバス', 'スコアシート', '分析', '写真'],
    },

    // ───────── 暮らしと創作 ─────────
    {
      id: 'adlib',
      title: 'アドリブ・ラボ',
      summary: 'コードを打ちこむと伴奏が鳴り、コードの役割がわかり、合うリックが楽譜と音で出てくる、アドリブ練習アプリ。音はブラウザの中で合成。',
      cat: 'self', who: ['me'], status: 'use', access: 'open',
      live: 'adlib/', file: 'adlib/adlib-all-in-one.html', dir: 'adlib',
      how: 'ウェブで開く（インストール不要）。または1ファイル版をダブルクリック。',
      tags: ['音楽', 'ジャズ', 'アドリブ', 'コード', '楽譜'],
    },
    {
      id: 'hibi',
      title: 'ひびの手帳',
      summary: '予定・リマインダー・メモ・写真・PDFを日付ごとに見る、自分用の手帳。毎朝Claudeが受信箱を整理して、「今日」の画面に届ける。',
      cat: 'self', who: ['me'], status: 'use', access: 'personal',
      dir: 'hibi',
      how: 'Googleのスクリプトを裏側に置いて、iPhoneのホーム画面に追加して使う。手元では node hibi/tools/serve.cjs。',
      tags: ['手帳', '予定', 'メモ', 'iPhone', 'Claude'],
    },
    {
      id: 'startup-kit',
      title: 'みせびらき（起業ツール一式）',
      summary: '一人で事業を始める人のための、ブラウザだけで動くツール一式。ホームページ・動画・集客・SNS・見積書・請求書・カレンダー・開業ロードマップ。',
      cat: 'self', who: ['me', 'teacher'], status: 'use', access: 'open',
      live: 'startup-kit/', file: 'startup-kit/startup-kit-all-in-one.html', dir: 'startup-kit',
      how: 'ウェブで開く（データは開いた人のブラウザの中だけ）。または1ファイル版をダブルクリック。',
      tags: ['起業', 'ホームページ', '見積書', '請求書', 'カレンダー'],
    },
  ],
};
