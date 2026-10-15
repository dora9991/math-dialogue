/* 指導案の「項目」「表の列」「様式パターン」「展開の型」の定義。
   項目(section)の種類 kind：header 表題と基本情報 / heading 見出しだけ / text 文章 / list 箇条書き /
   table 表 / kanten 観点別の評価規準 / board 板書計画 / pagebreak 改ページ */
window.SD = window.SD || {};

SD.sectionDefs = {
  header:      { kind: 'header', title: '表題・基本情報', hint: '日時・場所・学級・授業者など。使う行だけチェックを入れます。行の名前（日時→日　時 など）も変えられます。' },
  unit_name:   { kind: 'text', title: '単元名', bind: 'unit', inline: true, hint: '教科書の章の名前を書きます。上の「授業の設定」で単元を選ぶと自動で入ります。' },
  unit_goal:   { kind: 'list', title: '単元の目標', bank: 'goal_unit', style: 'paren', hint: '「知識及び技能」「思考力、判断力、表現力等」「学びに向かう力、人間性等」の3つの柱で書くのが基本です。' },
  unit_eval:   { kind: 'kanten', title: '単元の評価規準', layout: 'h', hint: '3観点それぞれの「おおむね満足できる」姿を、文末「〜している」「〜することができる」で書きます。' },
  views:       { kind: 'heading', title: '単元について' },
  tangenkan:   { kind: 'text', title: '単元観（教材観）', level: 2, bank: 'tangenkan', hint: 'この単元の価値、これまでの学習や今後の学習とのつながり（系統性）を書きます。' },
  seitokan:    { kind: 'text', title: '生徒観', level: 2, bank: 'seitokan', hint: 'よい面と課題の両方を書きます。小テストやアンケートの数値を入れると説得力が増します。' },
  shidokan:    { kind: 'text', title: '指導観', level: 2, bank: 'shidokan', hint: '単元観と生徒観を受けて、どんな手立てで指導するかを書きます。' },
  kenkyu:      { kind: 'text', title: '研究主題との関わり', bank: 'kenkyu', hint: '校内研究の主題や仮説と、本時の手立てがどうつながるかを書きます。' },
  plan:        { kind: 'table', role: 'plan', title: '単元の指導計画と評価計画', opts: { total: true }, hint: '時数を入れると「時」の欄（1〜3 など）が自動で計算されます。本時の行は色がつきます。知・思・態の欄はクリックで ○ → ◎ → 空 と切りかわります。' },
  honji:       { kind: 'heading', title: '本時の学習', opts: { pos: true } },
  honji_goal:  { kind: 'list', title: '本時の目標', level: 2, bank: 'goal_lesson', style: 'none', hint: '「〜することができる」の形で、評価できる具体的な姿を書きます。' },
  honji_kadai: { kind: 'text', title: '本時の課題（めあて）', level: 2, bank: 'meate' },
  honji_eval:  { kind: 'table', role: 'hyoka', title: '本時の評価規準', level: 2, hint: '観点ごとに「おおむね満足できる状況」と評価方法、努力を要する生徒への手立てを書きます。' },
  junbi:       { kind: 'text', title: '準備物', level: 2, bank: 'junbi', inline: true, sep: '、' },
  mondai:      { kind: 'list', title: '本時で扱う問題', level: 2, bank: 'mondai', style: 'bullet' },
  tenkai:      { kind: 'table', role: 'tenkai', title: '本時の展開', level: 2, opts: { num: true }, hint: '列は「列を選ぶ」で出し入れできます。セルをクリックすると右に文例が出ます。行頭の記号（○・◆など）は自動でつきます（行の最初に全角スペースを入れるとつきません）。' },
  board:       { kind: 'board', title: '板書計画', level: 2, hint: '黒板を左・中・右に分けて書きます。区切りの数は変えられます。' },
  tsumazuki:   { kind: 'list', title: '予想されるつまずきと手立て', level: 2, bank: 'tsumazuki', style: 'bullet' },
  hairyo:      { kind: 'list', title: '個別の配慮を要する生徒への支援', level: 2, bank: 'hairyo', style: 'bullet' },
  ict:         { kind: 'list', title: 'ICTの活用', level: 2, bank: 'ict', style: 'bullet' },
  free_text:   { kind: 'text', title: '自由記述', multi: true },
  free_list:   { kind: 'list', title: '箇条書き', multi: true, style: 'bullet' },
  free_table:  { kind: 'table', role: 'free', title: '表', multi: true },
  heading:     { kind: 'heading', title: '見出し', multi: true },
  pagebreak:   { kind: 'pagebreak', title: '改ページ', multi: true },
};

/* 「項目を追加」に出す並び */
SD.sectionCatalog = [
  { group: '単元について', keys: ['unit_name', 'unit_goal', 'unit_eval', 'views', 'tangenkan', 'seitokan', 'shidokan', 'kenkyu', 'plan'] },
  { group: '本時について', keys: ['honji', 'honji_goal', 'honji_kadai', 'honji_eval', 'junbi', 'mondai', 'tenkai', 'board', 'tsumazuki', 'hairyo', 'ict'] },
  { group: '自由に足す', keys: ['free_text', 'free_list', 'free_table', 'heading', 'pagebreak'] },
];

/* 表の中身の「部品」。列は部品を1つ以上ならべたもの（例：学習活動と予想される生徒の反応 = 活動＋発問＋反応）。
   mark は各行の頭につく記号（行の最初が記号や全角スペースならつかない）。 */
SD.parts = {
  katsudo:  { label: '学習活動', bank: 'katsudo', mark: '' },
  naiyo:    { label: '学習内容', bank: 'naiyo', mark: '・' },
  hatsumon: { label: '主な発問', bank: 'hatsumon', mark: '○' },
  hanno:    { label: '予想される生徒の反応', bank: 'hanno', mark: '・' },
  ryuiten:  { label: '指導上の留意点', bank: 'ryuiten', mark: '・' },
  shien:    { label: '教師の支援・手立て', bank: 'shien', mark: '・' },
  hyoka:    { label: '評価', bank: 'hyoka', mark: '◆' },
  keitai:   { label: '学習形態', bank: 'keitai', mark: '' },
  ict:      { label: 'ICTの活用', bank: 'ict', mark: '・' },
  hairyo:   { label: '個別の支援', bank: 'hairyo', mark: '・' },
  junbi:    { label: '準備物', bank: 'junbi', mark: '' },
  biko:     { label: '備考', mark: '' },
  // 指導計画
  p_naiyo:  { label: '学習内容', bank: 'plan_naiyo', mark: '' },
  p_nerai:  { label: 'ねらい・主な学習活動', bank: 'plan_nerai', mark: '・' },
  p_kijun:  { label: '評価規準', bank: 'eval_all', mark: '' },
  p_hoho:   { label: '評価方法', bank: 'hoho', mark: '' },
  // 本時の評価
  h_kanten: { label: '観点', bank: 'kanten_name', mark: '' },
  h_kijun:  { label: '評価規準', bank: 'eval_lesson', mark: '' },
  h_hoho:   { label: '評価方法', bank: 'hoho', mark: '' },
  h_a:      { label: '十分満足できる状況', bank: 'hyoka_a', mark: '' },
  h_c:      { label: '努力を要する生徒への手立て', bank: 'hyoka_c', mark: '' },
};

/* 表ごとの列のカタログ。type：phase 段階 / min 時間(分) / range 時(自動) / hours 時数 / mark ○◎ / 省略=文章 */
SD.cols = {
  tenkai: [
    { key: 'dankai', label: '段階', w: 9, type: 'phase' },
    { key: 'jikan', label: '時間', w: 7, type: 'min' },
    { key: 'katsudo', label: '学習活動', w: 30, parts: ['katsudo'] },
    { key: 'naiyo', label: '学習内容', w: 20, parts: ['naiyo'] },
    { key: 'hatsumon', label: '主な発問', w: 24, parts: ['hatsumon'] },
    { key: 'hanno', label: '予想される生徒の反応', w: 24, parts: ['hanno'] },
    { key: 'katsudo_hanno', label: '学習活動（Ｔ：主な発問　Ｓ：予想される生徒の反応）', w: 42, parts: ['katsudo', 'hatsumon', 'hanno'], marks: { hatsumon: 'Ｔ：', hanno: 'Ｓ：' } },
    { key: 'ryuiten', label: '指導上の留意点', w: 28, parts: ['ryuiten'] },
    { key: 'shien', label: '教師の支援・手立て', w: 28, parts: ['shien'] },
    { key: 'ryuiten_hyoka', label: '指導上の留意点（・）と評価（◆）', w: 34, parts: ['ryuiten', 'hyoka'] },
    { key: 'hyoka', label: '評価（方法）', w: 20, parts: ['hyoka'] },
    { key: 'keitai', label: '形態', w: 7, parts: ['keitai'] },
    { key: 'ict', label: 'ICTの活用', w: 16, parts: ['ict'] },
    { key: 'hairyo', label: '個別の支援', w: 18, parts: ['hairyo'] },
    { key: 'junbi', label: '準備物', w: 10, parts: ['junbi'] },
    { key: 'biko', label: '備考', w: 10, parts: ['biko'] },
  ],
  plan: [
    { key: 'ji', label: '時', w: 9, type: 'range' },
    { key: 'jisu', label: '時数', w: 5, type: 'hours' },
    { key: 'naiyo', label: '学習内容', w: 24, parts: ['p_naiyo'] },
    { key: 'nerai', label: 'ねらい・主な学習活動', w: 30, parts: ['p_nerai'] },
    { key: 'chi', label: '知', w: 4, type: 'mark' },
    { key: 'shi', label: '思', w: 4, type: 'mark' },
    { key: 'tai', label: '態', w: 4, type: 'mark' },
    { key: 'kijun', label: '評価規準', w: 38, parts: ['p_kijun'] },
    { key: 'hoho', label: '評価方法', w: 12, parts: ['p_hoho'] },
    { key: 'biko', label: '備考', w: 10, parts: ['biko'] },
  ],
  hyoka: [
    { key: 'kanten', label: '観点', w: 14, parts: ['h_kanten'] },
    { key: 'kijun', label: '評価規準（おおむね満足できる状況）', w: 40, parts: ['h_kijun'] },
    { key: 'hoho', label: '評価方法', w: 13, parts: ['h_hoho'] },
    { key: 'a', label: '十分満足できる状況', w: 30, parts: ['h_a'] },
    { key: 'c', label: '努力を要する生徒への手立て', w: 32, parts: ['h_c'] },
  ],
  free: [
    { key: 'c1', label: '項目１', w: 30, parts: ['c1'] },
    { key: 'c2', label: '項目２', w: 30, parts: ['c2'] },
    { key: 'c3', label: '項目３', w: 30, parts: ['c3'] },
  ],
};

/* 表題の下に並べる基本情報の行 */
SD.headerLines = [
  { k: 'date', label: '日時' },
  { k: 'place', label: '場所' },
  { k: 'klass', label: '学級' },
  { k: 'teacher', label: '授業者' },
  { k: 'school', label: '学校名' },
  { k: 'unit', label: '単元名' },
  { k: 'position', label: '本時' },
];

/* 様式パターン。sections=最初からONの項目（この順）、extras=OFFで入れておく項目、cols=表で使う列（この順）。 */
SD.patterns = [
  {
    id: 'saian', name: '細案（研究授業用）', tags: ['研究授業', '提出用'],
    desc: '単元観・生徒観・指導観、指導計画、本時の展開、板書計画までそろった本格的な指導案。',
    sections: ['header', 'unit_name', 'unit_goal', 'unit_eval', 'views', 'tangenkan', 'seitokan', 'shidokan', 'plan', 'honji', 'honji_goal', 'honji_eval', 'junbi', 'tenkai', 'board'],
    extras: ['kenkyu', 'honji_kadai', 'mondai', 'tsumazuki', 'hairyo', 'ict'],
    header: ['date', 'place', 'klass', 'teacher'],
    cols: { tenkai: ['dankai', 'jikan', 'katsudo', 'hanno', 'ryuiten', 'hyoka'], plan: ['ji', 'naiyo', 'chi', 'shi', 'tai', 'kijun', 'hoho'], hyoka: ['kanten', 'kijun', 'hoho', 'c'] },
    flow: 'kihon',
  },
  {
    id: 'ryakuan', name: '略案（A4 1枚）', tags: ['日常の授業', '授業参観'],
    desc: '本時の目標と展開を中心にした1枚の指導案。表題の下に単元名と本時の位置を入れます。',
    sections: ['header', 'honji_goal', 'junbi', 'tenkai'],
    extras: ['honji_kadai', 'honji_eval', 'board', 'tsumazuki', 'hairyo'],
    header: ['date', 'klass', 'teacher', 'unit', 'position'],
    titleSuffix: '（略案）',
    cols: { tenkai: ['dankai', 'jikan', 'katsudo', 'ryuiten_hyoka'], hyoka: ['kanten', 'kijun', 'hoho'] },
    style: { fs: 10, mt: 12, mb: 12 },
    flow: 'kihon',
  },
  {
    id: 'mondai', name: '問題解決型（数学）', tags: ['研究授業', '数学'],
    desc: '「つかむ→見通す→自力解決→練り上げる→まとめる→振り返る」の流れで展開を書く指導案。',
    sections: ['header', 'unit_name', 'unit_goal', 'unit_eval', 'views', 'tangenkan', 'seitokan', 'shidokan', 'plan', 'honji', 'honji_goal', 'honji_eval', 'mondai', 'tenkai', 'board'],
    extras: ['kenkyu', 'honji_kadai', 'junbi', 'tsumazuki', 'hairyo', 'ict'],
    header: ['date', 'place', 'klass', 'teacher'],
    cols: { tenkai: ['dankai', 'jikan', 'katsudo_hanno', 'shien', 'hyoka'], plan: ['ji', 'naiyo', 'chi', 'shi', 'tai', 'kijun', 'hoho'], hyoka: ['kanten', 'kijun', 'hoho', 'c'] },
    flow: 'mondai',
  },
  {
    id: 'honji', name: '本時案（本時の学習だけ）', tags: ['授業研究', '日常の授業'],
    desc: '本時の目標・評価・展開・板書計画だけの指導案。発問と予想される反応を分けて書けます。',
    sections: ['header', 'unit_name', 'honji_goal', 'honji_eval', 'junbi', 'tenkai', 'board'],
    extras: ['honji_kadai', 'mondai', 'tsumazuki', 'hairyo', 'ict'],
    header: ['date', 'place', 'klass', 'teacher', 'position'],
    cols: { tenkai: ['dankai', 'jikan', 'katsudo', 'hatsumon', 'hanno', 'ryuiten', 'hyoka'], hyoka: ['kanten', 'kijun', 'hoho', 'c'] },
    flow: 'kihon',
  },
  {
    id: 'tangen', name: '単元指導計画', tags: ['年間計画', '評価計画'],
    desc: '単元の目標・評価規準と、1時間ごとの学習内容・評価の計画をまとめた表。',
    sections: ['header', 'unit_name', 'unit_goal', 'unit_eval', 'views', 'tangenkan', 'plan'],
    extras: ['seitokan', 'shidokan', 'kenkyu'],
    header: ['klass', 'teacher'],
    title: '単元指導計画',
    cols: { plan: ['ji', 'naiyo', 'nerai', 'chi', 'shi', 'tai', 'kijun', 'hoho'] },
    flow: null,
  },
  {
    id: 'kobetsu', name: '個別最適・協働型（ICT活用）', tags: ['ICT', '個別最適な学び'],
    desc: '学習形態・ICTの活用・個別の支援の列を加えた指導案。一人一台端末を使う授業向け。',
    sections: ['header', 'unit_name', 'unit_goal', 'unit_eval', 'views', 'tangenkan', 'seitokan', 'shidokan', 'plan', 'honji', 'honji_goal', 'honji_eval', 'junbi', 'tenkai', 'hairyo', 'board'],
    extras: ['kenkyu', 'honji_kadai', 'mondai', 'tsumazuki', 'ict'],
    header: ['date', 'place', 'klass', 'teacher'],
    cols: { tenkai: ['dankai', 'jikan', 'katsudo', 'keitai', 'shien', 'ict', 'hyoka'], plan: ['ji', 'naiyo', 'chi', 'shi', 'tai', 'kijun', 'hoho'], hyoka: ['kanten', 'kijun', 'hoho', 'c'] },
    flow: 'ict',
  },
  {
    id: 'blank', name: '白紙から', tags: ['自由'],
    desc: '表題・本時の目標・展開だけから始めて、必要な項目を自分で足していきます。',
    sections: ['header', 'honji_goal', 'tenkai'],
    extras: ['unit_name', 'unit_goal', 'unit_eval', 'views', 'tangenkan', 'seitokan', 'shidokan', 'plan', 'honji_eval', 'junbi', 'board'],
    header: ['date', 'klass', 'teacher'],
    cols: { tenkai: ['dankai', 'jikan', 'katsudo', 'ryuiten'], plan: ['ji', 'naiyo', 'chi', 'shi', 'tai', 'kijun', 'hoho'], hyoka: ['kanten', 'kijun', 'hoho'] },
    flow: null,
  },
];

/* 展開の型（本時の展開の行のひな形）。m=分（50分の授業での配分。45分などは自動で比例配分）。 */
SD.flows = [
  {
    id: 'kihon', name: '基本型', sub: '導入・展開・まとめ',
    desc: '課題把握→自力解決→交流→全体共有→まとめ。どの授業にも使える形。',
    rows: [
      { p: '導入', m: 5, katsudo: '前時の学習を振り返る。', hatsumon: '前の時間は、どんなことを学んだかな？', hanno: '前時の方法を思い出す。', ryuiten: '前時の板書やノートを振り返らせ、既習事項を確認する。', shien: '既習事項を想起できるよう掲示物を用意する。', keitai: '一斉' },
      { p: '導入', m: 5, katsudo: '本時の課題を知り、めあてを確認する。', hatsumon: 'これまでの方法で解けるだろうか？', hanno: '今までの方法ではうまくいかない。\n〜がわかればできそうだ。', ryuiten: '既習との違いに気付かせ、めあてを生徒の言葉で確認する。', shien: 'めあてを全員で確認する。', keitai: '一斉' },
      { p: '展開', m: 10, katsudo: '課題について個人で考える。', hatsumon: 'どうしてそう考えたのか、説明できるかな？', hanno: '図や式を使って考える。\n手が止まってしまう。', ryuiten: '机間指導で考えを把握し、つまずいている生徒には既習事項を想起させる。', shien: 'つまずいている生徒にはヒントカードを渡す。', keitai: '個人', ict: 'タブレットに考えを書き込ませる。' },
      { p: '展開', m: 8, katsudo: 'ペアやグループで考えを伝え合う。', hatsumon: '友達の考えと、どこが同じでどこが違うかな？', hanno: '自分と違う考え方に気付く。', ryuiten: '根拠を明らかにして説明し合うよう促す。', shien: '考えを比べる視点を与える。', keitai: 'ペア' },
      { p: '展開', m: 12, katsudo: '全体で考えを共有し、比較・検討する。', hatsumon: 'どの方法がいつでも使えるかな？', hanno: 'どの考えも〜している。', ryuiten: '複数の考えを意図的に取り上げ、共通点や相違点を話し合わせる。', shien: '根拠を問い返して思考を促す。', hyoka: '既習事項と関連付けて、〇〇の方法を考え説明している。【思】（発言・ノート）', keitai: '全体', ict: '全員の考えを一覧で表示して比べる。' },
      { p: 'まとめ', m: 5, katsudo: '本時の学習をまとめる。', hatsumon: '今日わかったことは何かな？', hanno: '〇〇は、〜すればよい。', ryuiten: 'めあてに対応させて、生徒の言葉でまとめる。', shien: 'キーワードを使ってまとめさせる。', keitai: '一斉' },
      { p: 'まとめ', m: 5, katsudo: '適用問題に取り組み、学習を振り返る。', ryuiten: '振り返りの視点（わかったこと・つまずき・次にどうするか）を示す。', shien: '振り返りの観点を示す。', hyoka: '〇〇を正しく求めることができる。【知】（適用問題）', keitai: '個人' },
    ],
  },
  {
    id: 'mondai', name: '問題解決型', sub: 'つかむ→見通す→自力解決→練り上げる→まとめる→振り返る',
    desc: '数学の研究授業で多い形。生徒の考えを比べて練り上げる時間を長めにとります。',
    rows: [
      { p: 'つかむ', m: 5, katsudo: '問題を知り、気付いたことや疑問を出し合う。', hatsumon: '何がわかれば解決できそうかな？', hanno: '〜がわかればよい。\nどうやって求めればいいのだろう。', shien: '問題場面を提示し、既習との違いに気付かせる。', ryuiten: '問題場面を提示し、既習との違いに気付かせる。' },
      { p: 'つかむ', m: 3, katsudo: '本時の課題（めあて）をつくる。', hanno: '〇〇の方法を考えよう。', shien: '生徒の疑問を基に課題を設定する。', ryuiten: '生徒の疑問を基に課題を設定する。' },
      { p: '見通す', m: 5, katsudo: '解決の見通しをもつ。', hatsumon: '前の授業で習ったことが使えないかな？', hanno: '図に表せばわかりそうだ。\n前の時間の考えが使えそうだ。', shien: '方法の見通しと結果の見通しを発表させ、板書に残す。', ryuiten: '方法の見通しと結果の見通しを発表させ、板書に残す。' },
      { p: '自力解決', m: 10, katsudo: '自分の考えをノートに書く。', hanno: '（考えＡ）\n（考えＢ）\n手が止まってしまう。', shien: '机間指導で考えを把握し、指名の順番を決めておく。\n手が止まっている生徒にはヒントカードを渡す。', ryuiten: '机間指導で考えを把握し、指名の順番を決めておく。' },
      { p: '練り上げる', m: 15, katsudo: '考えを発表し、比較・検討する。', hatsumon: 'それぞれの考えに共通していることは何だろう？\nいつでも使える方法はどれかな？', hanno: 'どの考えも〜している。', shien: '考えの根拠を問い返し、共通点に着目させる。', ryuiten: '考えの根拠を問い返し、共通点に着目させる。', hyoka: '既習事項と関連付けて、〇〇の方法を考え説明している。【思】（発言・ノート）' },
      { p: 'まとめる', m: 5, katsudo: 'わかったことをまとめる。', hanno: '〇〇は、〜すればよい。', shien: '生徒の言葉を生かしてまとめる。', ryuiten: '生徒の言葉を生かしてまとめる。' },
      { p: '振り返る', m: 7, katsudo: '適用問題を解き、学習を振り返る。', shien: '振り返りの視点（わかったこと・使った考え・次に考えたいこと）を示す。', ryuiten: '振り返りの視点を示し、自分の言葉で書かせる。', hyoka: '〇〇を正しく求めることができる。【知】（適用問題）' },
    ],
  },
  {
    id: 'kougi', name: '講義・演習型', sub: '小テスト→講義→演習→振り返り',
    desc: '家庭学習チェック・ペア学習・小テストで始め、講義15分・演習15分で進める習得型の授業。',
    rows: [
      { p: '導入', m: 2, katsudo: '家庭学習の取り組みを確認し合う。', ryuiten: '取り組んだ内容と時間を記録させ、ペアで確認させる。', keitai: 'ペア' },
      { p: '導入', m: 3, katsudo: 'ペア学習（基本問題を口頭で答え合う）に取り組む。', ryuiten: '1分間で答えられた数を記録させ、役割を交代して行う。', keitai: 'ペア' },
      { p: '導入', m: 7, katsudo: '前時の内容の小テストに取り組み、相互採点する。', ryuiten: '早く終わった生徒にはチャレンジ問題を示す。', hyoka: '前時の内容を理解している。【知】（小テスト）', keitai: '個人' },
      { p: '展開', m: 15, katsudo: 'めあてを確認し、本時の課題について考える。', hatsumon: '前の授業で習ったことが使えないかな？\nなぜそうなるのかな？', hanno: '〇〇を使えばできそうだ。', ryuiten: '肝心な部分は教師が言わず、発問で気付かせる。気付けない場合に備えて補助発問を用意する。', keitai: '一斉' },
      { p: '展開', m: 15, katsudo: 'プリントの演習問題に取り組み、大問ごとに丸つけをする。', ryuiten: '答えを教卓に置き、いつでも確かめられるようにする。\nわからないときは友達や教師に質問してよいことを伝える。', hyoka: '〇〇を正しく求めることができる。【知】（演習プリント）', keitai: '個人・教え合い' },
      { p: '展開', m: 3, katsudo: 'つまずきの多かった問題の解説を聞く。', ryuiten: '机間指導で把握したつまずきを取り上げて解説する。', keitai: '一斉' },
      { p: 'まとめ', m: 5, katsudo: '振り返りシートに記入する。', ryuiten: 'よかったこと・つまずき・これからどうするかを書かせる。', hyoka: '学習を振り返り、次の学習に生かそうとしている。【態】（振り返りシート）', keitai: '個人' },
    ],
  },
  {
    id: 'kyodo', name: '協働学習型', sub: '個人→グループ→全体',
    desc: 'グループで考えをまとめ、全体で比べる時間を中心にした授業。',
    rows: [
      { p: '導入', m: 5, katsudo: '本時の課題を知り、めあてを確認する。', hatsumon: 'どんな答えになりそうか、予想してみよう。', hanno: '〜くらいになりそう。', ryuiten: '課題の条件を全員で確認する。', keitai: '一斉' },
      { p: '展開', m: 8, katsudo: '課題について個人で考える。', hanno: '図や式を使って考える。', ryuiten: 'グループ活動の前に、自分の考えをもたせる。', keitai: '個人' },
      { p: '展開', m: 15, katsudo: 'グループで考えを出し合い、ホワイトボードにまとめる。', hatsumon: 'グループで一番わかりやすい説明はどれかな？', hanno: '友達の考えのよさに気付く。', ryuiten: '司会・記録・発表の役割を決め、全員が発言できるようにする。', keitai: 'グループ' },
      { p: '展開', m: 10, katsudo: 'グループの考えを発表し、全体で比べる。', hatsumon: 'それぞれの考えに共通していることは何だろう？', ryuiten: '考えの共通点や相違点に着目させる。', hyoka: '根拠を明らかにして、考えを説明している。【思】（発言・ホワイトボード）', keitai: '全体' },
      { p: 'まとめ', m: 7, katsudo: '本時の学習をまとめ、適用問題に取り組む。', ryuiten: 'めあてに対応させてまとめる。', hyoka: '〇〇を正しく求めることができる。【知】（適用問題）', keitai: '個人' },
      { p: 'まとめ', m: 5, katsudo: '振り返りを書く。', ryuiten: 'グループ活動で学んだことも振り返らせる。', keitai: '個人' },
    ],
  },
  {
    id: 'shujuku', name: '習熟・演習型', sub: '基本→選択問題→確認テスト',
    desc: '単元の終わりや練習の時間向け。習熟の程度に応じて問題を選ばせます。',
    rows: [
      { p: '導入', m: 5, katsudo: '本時の目標と進め方を確認する。', ryuiten: '自分の課題を意識して問題を選ぶよう伝える。', keitai: '一斉' },
      { p: '展開', m: 10, katsudo: '基本問題に取り組み、解き方を確認する。', ryuiten: '全員が基本の解き方を確認できるようにする。', keitai: '個人' },
      { p: '展開', m: 20, katsudo: '自分の課題に合わせて問題を選び、取り組む。', ryuiten: '基本・標準・発展の3段階の問題を用意し、自分で選ばせる。\nつまずいている生徒には個別に支援する。', keitai: '個人・教え合い', hairyo: '基本問題には途中式の書き方の例を示す。' },
      { p: '展開', m: 8, katsudo: '確認テストに取り組む。', hyoka: '〇〇を正しく求めることができる。【知】（確認テスト）', keitai: '個人' },
      { p: 'まとめ', m: 7, katsudo: '答え合わせをして、学習を振り返る。', ryuiten: 'できるようになったことと、次の課題を書かせる。', hyoka: '学習を振り返り、次の学習に生かそうとしている。【態】（振り返りシート）', keitai: '個人' },
    ],
  },
  {
    id: 'ict', name: 'ICT活用型', sub: '端末で考え→共有→自分に合った練習',
    desc: '一人一台端末で考えを共有し、デジタルドリルで習熟を図る授業。',
    rows: [
      { p: '導入', m: 5, katsudo: '本時の課題を知り、めあてを確認する。', hatsumon: '何がわかれば解決できそうかな？', ryuiten: '課題の条件を確認する。', ict: '電子黒板で問題場面を提示する。', keitai: '一斉' },
      { p: '展開', m: 12, katsudo: '端末を使って、課題について個人で考える。', hanno: '図や式を使って考える。', shien: 'つまずいている生徒にはヒントカードを示す。', ict: 'デジタルワークシートに考えを書き込ませる。', keitai: '個人' },
      { p: '展開', m: 15, katsudo: '全員の考えを見比べ、全体で話し合う。', hatsumon: 'それぞれの考えに共通していることは何だろう？', shien: '考えを比べる視点を与える。', ict: '全員の画面を一覧で表示して比べる。', hyoka: '根拠を明らかにして、考えを説明している。【思】（発言・端末の記録）', keitai: '全体' },
      { p: 'まとめ', m: 13, katsudo: '自分に合った問題に取り組む。', shien: '習熟の程度に応じて問題を選ばせる。', ict: 'デジタルドリルで問題に取り組ませる。', hyoka: '〇〇を正しく求めることができる。【知】（ドリルの記録）', keitai: '個人', hairyo: '基本の問題から始めるよう助言する。' },
      { p: 'まとめ', m: 5, katsudo: '振り返りを入力する。', shien: '振り返りの視点を示す。', ict: 'フォームで振り返りを集める。', keitai: '個人' },
    ],
  },
];
