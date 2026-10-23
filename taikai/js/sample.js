/* サンプルの大会：第109回 全国算数・数学教育研究（佐賀）大会（仮）
   ・回数・日程・会場・参加費・主題などは、すべて「仮」。管理画面の「大会の設定」で直す。
   ・参加者・発表者・学校の名前は、すべて架空（乱数で作っている。実在の人・学校とは関係ない）。
   ・T.sample() が、まっさらな保存データ（db）を返す。管理画面の「データ」→「サンプルに戻す」でも使う。 */
(function () {
  'use strict';

  // 毎回おなじ「でたらめ」を出す（サンプルが開くたびに変わらないように）
  function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  const PREFS = ['北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県', '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県', '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県', '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県', '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'];
  T.PREFS = PREFS;

  const SEI = [['山口', 'やまぐち'], ['田中', 'たなか'], ['中島', 'なかしま'], ['古賀', 'こが'], ['松尾', 'まつお'], ['井上', 'いのうえ'], ['池田', 'いけだ'], ['山下', 'やました'], ['江口', 'えぐち'], ['副島', 'そえじま'], ['大串', 'おおぐし'], ['北島', 'きたじま'], ['吉田', 'よしだ'], ['森', 'もり'], ['原', 'はら'], ['村岡', 'むらおか'], ['峰', 'みね'], ['坂本', 'さかもと'], ['藤井', 'ふじい'], ['石橋', 'いしばし'], ['久保', 'くぼ'], ['野中', 'のなか'], ['宮崎', 'みやざき'], ['西村', 'にしむら'], ['高橋', 'たかはし'], ['佐藤', 'さとう'], ['鈴木', 'すずき'], ['渡辺', 'わたなべ'], ['小川', 'おがわ'], ['今村', 'いまむら'], ['馬場', 'ばば'], ['緒方', 'おがた'], ['陣内', 'じんのうち'], ['光武', 'みつたけ'], ['樋口', 'ひぐち'], ['草場', 'くさば'], ['城島', 'じょうじま'], ['荒木', 'あらき'], ['平川', 'ひらかわ'], ['真崎', 'まさき']];
  const MEI = [['花子', 'はなこ'], ['大輔', 'だいすけ'], ['美咲', 'みさき'], ['健太', 'けんた'], ['陽子', 'ようこ'], ['翔', 'しょう'], ['真由美', 'まゆみ'], ['誠', 'まこと'], ['彩', 'あや'], ['拓也', 'たくや'], ['優子', 'ゆうこ'], ['直樹', 'なおき'], ['恵', 'めぐみ'], ['亮', 'りょう'], ['千尋', 'ちひろ'], ['和也', 'かずや'], ['舞', 'まい'], ['剛', 'つよし'], ['由紀', 'ゆき'], ['浩二', 'こうじ'], ['奈々', 'なな'], ['俊介', 'しゅんすけ'], ['麻衣', 'まい'], ['聡', 'さとし'], ['理恵', 'りえ'], ['悠', 'はるか'], ['康平', 'こうへい'], ['綾香', 'あやか'], ['隆', 'たかし'], ['智美', 'ともみ']];
  const NICK = ['あおば', 'ひかり', 'みどり', 'つばさ', 'すばる', 'みらい', 'かえで', 'ほまれ', 'いずみ', 'そよかぜ', 'はやと', 'さくら', 'あさひ', 'はるかぜ', 'しらぬい', 'ゆめが丘'];
  const CITY = { 佐賀県: ['佐賀市', '唐津市', '鳥栖市', '伊万里市', '武雄市', '小城市'], 福岡県: ['福岡市', '久留米市', '北九州市', '大牟田市'], 長崎県: ['長崎市', '佐世保市', '諫早市'], 熊本県: ['熊本市', '八代市'], 大分県: ['大分市'], 宮崎県: ['宮崎市'], 鹿児島県: ['鹿児島市'], 沖縄県: ['那覇市'], 東京都: ['世田谷区', '八王子市'], 大阪府: ['大阪市', '堺市'], 愛知県: ['名古屋市'], 広島県: ['広島市'], 北海道: ['札幌市'], 神奈川県: ['横浜市'], 兵庫県: ['神戸市'], 京都府: ['京都市'] };

  const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
  const weighted = (r, pairs) => { const t = pairs.reduce((s, p) => s + p[1], 0); let x = r() * t; for (const [v, w] of pairs) { if ((x -= w) < 0) return v; } return pairs[0][0]; };

  function school(r, pref, bu, kind) {
    const nick = pick(r, NICK);
    const city = pick(r, CITY[pref] || [pref.replace(/[都府県]$/, '') + '市']);
    if (kind === '学生') return pick(r, ['有明教育大学 教育学部', '九州みらい大学 理学部', 'しらぬい大学 大学院教育学研究科']);
    if (bu === '小学校部会') return `${city}立${nick}小学校`;
    if (bu === '中学校部会') return r() < 0.12 ? `${pref}立${nick}中学校` : `${city}立${nick}中学校`;
    if (bu === '高等学校部会') return r() < 0.2 ? `私立 ${nick}学園高等学校` : `${pref}立${nick}高等学校`;
    return pick(r, [`${nick}工業高等専門学校`, '有明教育大学', '九州みらい大学']);
  }

  T.sample = function () {
    const r = rng(109);
    const ev = {
      id: 'sg109',
      createdAt: '2026-09-01T09:00:00',
      info: {
        sample: true,
        org: '公益社団法人 日本数学教育学会',
        orgShort: '日数教',
        no: 109,
        name: '全国算数・数学教育研究（佐賀）大会',
        short: '佐賀大会',
        nameEn: 'The 109th National Conference on Mathematics Education — SAGA',
        catch: '問いがつながる、学びがひらく。',
        theme: '数学的に考え、未来を拓く子どもの育成',
        subtheme: '― 問いが生まれ、問いがつながる授業 ―',
        themeNote: '（サンプルの趣旨文）\n子どもが自ら問いを見いだし、仲間との対話を通して考えを深め、学んだことを新しい場面に生かしていく。そうした数学の学びを、日々の授業の中でどう実現するか。\n本大会では、全国の実践と研究を持ち寄り、校種を越えて語り合うことで、これからの算数・数学教育の姿を探ります。',
        start: '2027-08-03',
        end: '2027-08-06',
        city: '佐賀県佐賀市',
        applyOpen: '2026-10-01',
        applyClose: '2027-06-30',
        capacity: 1200,
        codePrefix: 'SG',
        color: 'ai',
        pin: '1234',
        siteUrl: '',
        venues: [
          { id: 'v1', name: '佐賀県立致遠館中学校・高等学校（会場校）', role: '中学校部会・高等学校部会', address: '佐賀県佐賀市（くわしい住所は確定後に掲載）', access: 'JR佐賀駅から、大会シャトルバス（運行の時刻は第2次案内でお知らせします）\n※ 会場校に参加者用の駐車場はありません。公共交通機関をご利用ください。', map: '' },
          { id: 'v2', name: '全体会会場（調整中）', role: '開会式・基調講演・情報交換会', address: '佐賀市内', access: '決まりしだい、お知らせします。', map: '' },
          { id: 'v3', name: '小学校部会・高専・大学部会 会場（調整中）', role: '小学校部会・高専・大学部会', address: '佐賀市内', access: '決まりしだい、お知らせします。', map: '' },
        ],
        hosts: [
          { role: '主催', names: '公益社団法人 日本数学教育学会' },
          { role: '主管', names: '第109回大会 佐賀大会実行委員会（仮）' },
          { role: '後援', names: '（調整中）' },
        ],
        office: { name: '佐賀大会実行委員会 事務局（サンプル）', person: '事務局長　副島 誠', email: 'saga-taikai@example.com', tel: '0952-00-0000（平日 16:00〜18:00）', address: '佐賀県立致遠館中学校・高等学校 内（仮）' },
        bank: '（サンプル）ありあけ銀行　さが支店　普通 0000000\n口座名義：ダイ109カイ サガタイカイ ジッコウイインカイ\n※ 振込人名の前に「受付番号」をつけてください（例：SG0012 サガハナコ）\n※ 振込手数料はご負担ください。',
        links: [{ label: '日本数学教育学会', url: 'https://www.sme.or.jp/' }],
        mailFrom: '佐賀大会実行委員会 事務局',
        mailGasUrl: '',
      },
      news: [], program: { days: [] }, sections: [], form: {}, people: [], faq: [], docs: [], videos: [], surveys: [], templates: [], mails: [], threads: [], board: [], tasks: [], staff: [], log: [], booklet: {},
    };

    /* ── お知らせ ── */
    ev.news = [
      { id: 'n5', date: '2026-10-22', cat: '配信', title: '大会のライブ配信・アーカイブ配信について', body: '基調講演と、各部会のまとめをライブ配信します（予定）。\n配信のURLは「配信」のページに、会期の1週間前に掲載します。分科会の一部は、大会後に参加者限定でアーカイブ配信します。', pinned: false, published: true },
      { id: 'n4', date: '2026-10-15', cat: '資料', title: '研究発表の申込要項（サンプル）を掲載しました', body: '研究発表を希望される方は、「資料」のページから申込要項をご確認ください。\n発表の申込締切は **2027年3月31日（水）** です（仮）。', pinned: false, published: true },
      { id: 'n3', date: '2026-10-01', cat: '申込', title: '参加申込の受付を始めました', body: 'このサイトの「参加申込」から申し込めます。申し込むと **受付番号** と **本人用のQRコード** が出ます。当日はこのQRコードで受付をします。\nマイページから、申込内容の確認・参加費の状況・運営への問い合わせができます。', pinned: true, published: true },
      { id: 'n2', date: '2026-09-20', cat: '重要', title: '第1次案内（開催要項）を掲載しました', body: '「資料」のページに、第1次案内（PDF）を掲載しました。日程・会場・参加費は「仮」のものを含みます。決まりしだい更新します。', pinned: false, published: true },
      { id: 'n1', date: '2026-09-01', cat: 'お知らせ', title: '大会ホームページを開設しました', body: '第109回 全国算数・数学教育研究（佐賀）大会のホームページを開設しました。大会の最新の情報は、このページでお知らせします。', pinned: false, published: true },
    ];

    /* ── 申込フォーム ── */
    ev.form = {
      lead: '申込が終わると、受付番号と本人用のQRコードが出ます。確認のメールも届きます（サンプルでは「送信の記録」に残ります）。',
      doneMessage: 'お申し込みありがとうございました。当日は、下のQRコードを受付でお見せください（印刷でも、スマホの画面でもかまいません）。',
      confirmTemplate: 't1',
      fields: [
        { id: 'h1', type: 'heading', label: '申込者について' },
        { id: 'name', type: 'text', label: '氏名', required: true, core: true, placeholder: '佐賀 花子' },
        { id: 'kana', type: 'text', label: 'ふりがな', required: true, core: true, placeholder: 'さが はなこ' },
        { id: 'email', type: 'email', label: 'メールアドレス', required: true, core: true, help: '受付の知らせ・当日の案内を、このアドレスに送ります。' },
        { id: 'tel', type: 'tel', label: '電話番号（当日つながるもの）', placeholder: '090-0000-0000' },
        { id: 'org', type: 'text', label: '所属（学校名など）', required: true, core: true, placeholder: '佐賀市立○○中学校' },
        { id: 'pref', type: 'select', label: '所属の都道府県', required: true, core: true, options: PREFS.map((v) => ({ v })) },
        { id: 'h2', type: 'heading', label: '参加について' },
        { id: 'kind', type: 'radio', label: '参加区分', short: '参加費', required: true, core: true, options: [{ v: '会員', fee: 4000 }, { v: '一般（非会員）', fee: 6000 }, { v: '学生', fee: 1000 }, { v: '来賓・招待', fee: 0 }], help: '金額は仮です。' },
        { id: 'bu', type: 'select', label: '参加する部会', required: true, core: true, options: [{ v: '小学校部会' }, { v: '中学校部会' }, { v: '高等学校部会' }, { v: '高専・大学部会' }] },
        { id: 'section', type: 'select', label: '参加したい分科会（第1希望）', options: [] },
        { id: 'present', type: 'radio', label: '研究発表', options: [{ v: '発表しない' }, { v: '発表する（別に発表の申込が必要）' }] },
        { id: 'lecture', type: 'checks', label: '講習会（8/3・8/4）', short: '講習会', options: [{ v: '8/3（火）講習会1日目', fee: 2000 }, { v: '8/4（水）講習会2日目', fee: 2000 }] },
        { id: 'lunch', type: 'checks', label: '弁当', short: '弁当', options: [{ v: '8/5（木）', fee: 1000 }, { v: '8/6（金）', fee: 1000 }], help: '会場の近くには飲食店が少ないため、申込をおすすめします。' },
        { id: 'party', type: 'radio', label: '情報交換会（8/5 夜）', short: '情報交換会', options: [{ v: '参加する', fee: 7000 }, { v: '参加しない' }] },
        { id: 'bus', type: 'radio', label: 'シャトルバス（佐賀駅⇔会場校）', options: [{ v: '利用する' }, { v: '利用しない' }] },
        { id: 'needs', type: 'textarea', label: '配慮が必要なこと（車いす・授乳室・食物アレルギーなど）' },
        { id: 'agree', type: 'consent', label: '個人情報の取り扱い', text: '申込の情報は、この大会の運営（受付・連絡・名札・名簿）にだけ使い、大会が終わって1年後に消します。', required: true },
      ],
    };

    /* ── 分科会 ── */
    const SEC = [
      ['s-j1', '中学校部会', '第1分科会', '数と式', '致遠館 中学棟 2階 1-1教室'],
      ['s-j2', '中学校部会', '第2分科会', '図形', '致遠館 中学棟 2階 1-2教室'],
      ['s-j3', '中学校部会', '第3分科会', '関数', '致遠館 中学棟 3階 2-1教室'],
      ['s-j4', '中学校部会', '第4分科会', 'データの活用', '致遠館 中学棟 3階 2-2教室'],
      ['s-h1', '高等学校部会', '第1分科会', '数学Ⅰ・Aの授業づくり', '致遠館 高校棟 2階 視聴覚室'],
      ['s-h2', '高等学校部会', '第2分科会', '探究・課題研究', '致遠館 高校棟 3階 3-1教室'],
      ['s-h3', '高等学校部会', '第3分科会', '評価とICT活用', '致遠館 高校棟 3階 3-2教室'],
      ['s-e1', '小学校部会', '第1分科会', '数と計算・データの活用', '小学校部会 会場（調整中）'],
      ['s-u1', '高専・大学部会', '第1分科会', '数学教育学の研究', '高専・大学部会 会場（調整中）'],
    ];
    const TALKS = {
      's-j1': ['文字式の意味を「説明する」活動を軸にした単元構成', '負の数の乗法を、子どもが納得するまで考える授業', '方程式の解き方を自分で選ぶ力を育てる'],
      's-j2': ['証明の「書き出し」でつまずく生徒への手立て', '作図の手順を言葉で伝え合う活動の効果', 'GeoGebra で予想し、証明で確かめる図形の授業'],
      's-j3': ['表・式・グラフをつなぐ「関数のことば」の指導', '身のまわりの事象を一次関数で捉える探究の単元'],
      's-j4': ['問いを立てるところから始める統計的探究', '箱ひげ図で「比べる理由」を語らせる授業'],
      's-h1': ['二次関数の最大・最小を、問いの連鎖で組み立てる', '場合の数・確率で「数え方の工夫」を共有する授業', '三角比の導入を測量の活動から'],
      's-h2': ['生徒の「なぜ」から始まる課題研究の年間計画', '地域のデータを使った数学探究（佐賀の気象データを例に）'],
      's-h3': ['観点別評価「思考・判断・表現」のルーブリック作り', '1人1台端末で考えの過程を残す授業と評価'],
      's-e1': ['わり算の意味を図でつなぐ授業', 'グラフから読み取ったことを伝え合う活動'],
      's-u1': ['中高接続期における証明の理解の変容', '数学的モデリングの授業設計に関する一考察'],
    };
    ev.sections = SEC.map(([id, bu, no, theme, room]) => ({
      id, bu, no, theme, room,
      chair: pick(r, SEI)[0] + ' ' + pick(r, MEI)[0] + '（司会・助言者 調整中）',
      talks: (TALKS[id] || []).map((title, i) => {
        const pref = weighted(r, [['佐賀県', 4], ['福岡県', 3], ['長崎県', 1], ['熊本県', 1], ['東京都', 1], ['大阪府', 1]]);
        const s = pick(r, SEI), m = pick(r, MEI);
        return { id: id + '-t' + (i + 1), title, presenter: s[0] + ' ' + m[0], school: school(r, pref, bu, '会員').replace(/^/, pref + ' '), time: ['13:00', '13:50', '14:40'][i] || '', abstract: '（サンプルの要旨）' + title + 'について、授業の実際と生徒の変容をもとに報告する。' };
      }),
    }));
    ev.form.fields.find((f) => f.id === 'section').options = ev.sections.map((s) => ({ v: `${s.bu.replace('部会', '')} ${s.no}（${s.theme}）` }));

    /* ── プログラム ── */
    const it = (start, end, title, kind, place, who, note) => ({ id: 'p' + Math.round(r() * 1e8).toString(36), start, end, title, kind, place: place || '', who: who || '', note: note || '' });
    ev.program.days = [
      { id: 'd1', date: '2027-08-03', label: '講習会 1日目', items: [
        it('09:30', '10:00', '受付', 'info', '全体会会場（調整中）'),
        it('10:00', '12:00', '講習Ⅰ「（仮）これからの算数・数学の授業づくり」', 'lecture', '全体会会場（調整中）', '講師：調整中'),
        it('13:00', '15:00', '講習Ⅱ「（仮）数学的活動と評価」', 'lecture', '全体会会場（調整中）', '講師：調整中'),
        it('15:20', '16:30', '講習Ⅲ「（仮）ICTを生かした数学の学び」', 'lecture', '全体会会場（調整中）', '講師：調整中'),
      ] },
      { id: 'd2', date: '2027-08-04', label: '講習会 2日目', items: [
        it('09:30', '11:30', '講習Ⅳ「（仮）数学の歴史と教材」', 'lecture', '全体会会場（調整中）', '講師：調整中'),
        it('12:30', '15:30', '研究協議会・部会別の打ち合わせ（役員・発表者）', 'meeting', '会場校 会議室'),
      ] },
      { id: 'd3', date: '2027-08-05', label: '研究大会 1日目', items: [
        it('08:30', '09:30', '受付（QRコード）', 'info', '各会場'),
        it('09:45', '10:30', '開会式・表彰', 'plenary', '全体会会場（調整中）'),
        it('10:45', '12:00', '基調講演「（演題・仮）数学のことばで世界を見る」', 'keynote', '全体会会場（調整中）', '講師：調整中', 'ライブ配信あり（予定）'),
        it('12:00', '13:00', '昼食・移動', 'break', ''),
        it('13:00', '16:30', '部会別 分科会（研究発表・協議）', 'section', '各部会の会場'),
        it('17:30', '19:30', '情報交換会', 'party', '全体会会場（調整中）', '', '申込制'),
      ] },
      { id: 'd4', date: '2027-08-06', label: '研究大会 2日目', items: [
        it('08:45', '09:00', '受付', 'info', '各会場'),
        it('09:00', '11:30', '部会別 分科会（研究発表・協議）', 'section', '各部会の会場'),
        it('11:45', '12:30', '部会別 まとめ・閉会', 'plenary', '各部会の会場', '', '中学校部会・高等学校部会のまとめはライブ配信（予定）'),
      ] },
    ];

    /* ── Q&A ── */
    ev.faq = [
      { id: 'q1', cat: '申込・参加費', q: '参加費の支払い方法は？', a: '銀行振込です。振込先は、マイページの「参加費」に出ます。振込人名の前に受付番号をつけてください。', published: true },
      { id: 'q2', cat: '申込・参加費', q: '申込内容を変えたい・取り消したいときは？', a: 'マイページの「運営に問い合わせる」から、受付番号を添えてお知らせください。弁当の変更は 7月20日（仮）までです。', published: true },
      { id: 'q3', cat: '申込・参加費', q: '領収書はもらえますか？', a: '入金の確認後、マイページから領収書（PDF）を出せるようにする予定です（サンプルでは準備中）。宛名の指定は問い合わせからお知らせください。', published: true },
      { id: 'q4', cat: '当日', q: '当日の受付はどうすればいいですか？', a: '申込のあとに出る「本人用のQRコード」を受付でお見せください。スマホの画面でも、印刷したものでもかまいません。QRコードが出せないときは、受付番号かお名前をお伝えください。', published: true },
      { id: 'q5', cat: '当日', q: '駐車場はありますか？', a: '会場校には参加者用の駐車場がありません。JR佐賀駅からのシャトルバス・公共交通機関をご利用ください。', published: true },
      { id: 'q6', cat: '当日', q: '昼食はどうすればいいですか？', a: '会場の近くには飲食店が少ないため、申込のときに弁当の申込をおすすめします。', published: true },
      { id: 'q7', cat: '発表', q: '研究発表をしたいのですが？', a: '参加申込とは別に、発表の申込が必要です。「資料」のページの「研究発表 申込要項」をご覧ください。', published: true },
      { id: 'q8', cat: '配信', q: '会場に行けないのですが、オンラインで見られますか？', a: '基調講演と部会のまとめは、ライブ配信を予定しています。「配信」のページをご覧ください。', published: true },
      { id: 'q9', cat: 'その他', q: '出張依頼の文書（公文書）はもらえますか？', a: '第2次案内とあわせて、このサイトに掲載します（予定）。個別に必要なときは、問い合わせからお知らせください。', published: true },
    ];

    /* ── 配信（YouTube） ── */
    ev.videos = [
      { id: 'v1', title: '（サンプル）埋め込みの見え方の確認用 — 本番の動画URLに差しかえてください', url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ', kind: 'info', when: '', note: 'Blender Foundation の短編映画「Big Buck Bunny」を、埋め込みの確認に使っています。', visibility: 'public', onAir: false },
      { id: 'v2', title: '開会式・基調講演（ライブ配信）', url: '', kind: 'live', when: '2027-08-05T09:45', note: 'URLは会期の1週間前に掲載します。', visibility: 'public', onAir: false },
      { id: 'v3', title: '中学校部会 まとめ（ライブ配信）', url: '', kind: 'live', when: '2027-08-06T11:45', note: '', visibility: 'public', onAir: false },
      { id: 'v4', title: '分科会のアーカイブ（参加者限定）', url: '', kind: 'archive', when: '2027-08-20T10:00', note: '大会後に、参加者のマイページから見られるようにします。', visibility: 'member', onAir: false },
    ];

    /* ── 資料（PDF の中身は sample-pdfs.js） ── */
    ev.docs = [
      { id: 'doc-info1', title: '第1次案内（開催要項）', cat: '案内', note: '日程・会場・参加費（仮）', fileName: 'sg109-info1-sample.pdf', visibility: 'public', at: '2026-09-20T10:00:00' },
      { id: 'doc-happyo', title: '研究発表 申込要項', cat: '発表', note: '発表の申込方法・原稿の書き方', fileName: 'sg109-happyo-sample.pdf', visibility: 'public', at: '2026-10-15T10:00:00' },
      { id: 'doc-access', title: '会場案内図', cat: '会場', note: '会場校の教室配置（仮）', fileName: 'sg109-access-sample.pdf', visibility: 'public', at: '2026-10-15T10:05:00' },
      { id: 'doc-member', title: '分科会 発表資料集（参加者限定）', cat: '発表', note: 'マイページに入ると見られます', fileName: 'sg109-member-sample.pdf', visibility: 'member', at: '2026-10-20T10:00:00' },
    ];

    for (const d of ev.docs) { const b = T.SAMPLE_PDFS && T.SAMPLE_PDFS[d.id]; if (b) { d.hasFile = true; d.size = Math.floor((b.length * 3) / 4); } }

    /* ── 連絡のテンプレート ── */
    ev.templates = [
      { id: 't1', cat: '申込', name: '申込受付のお知らせ（自動）', subject: '【{{大会名}}】参加申込を受け付けました（受付番号 {{受付番号}}）', body: '{{氏名}} 様\n\n{{大会名}}への参加申込を受け付けました。\n\n■ 受付番号：{{受付番号}}\n■ 参加区分：{{参加区分}}\n■ 部会：{{部会}}\n■ 参加費：{{参加費}}\n\n当日は、マイページの「本人用QRコード」を受付でお見せください。\nマイページ：{{マイページ}}\n\n会期：{{会期}}\n\n{{事務局}}' },
      { id: 't2', cat: '入金', name: '参加費の入金を確認しました', subject: '【{{大会名}}】参加費の入金を確認しました', body: '{{氏名}} 様\n\n参加費（{{参加費}}）の入金を確認しました。ありがとうございます。\n領収書はマイページから出せます（準備中）。\n\n受付番号：{{受付番号}}\n\n{{事務局}}' },
      { id: 't3', cat: '入金', name: '参加費のお支払いのお願い（未入金の方へ）', subject: '【{{大会名}}】参加費のお支払いについて', body: '{{氏名}} 様\n\n参加費（{{参加費}}）の入金が、まだ確認できていません。\n行き違いでしたら、ご容赦ください。振込先はマイページでご確認いただけます。\n\nマイページ：{{マイページ}}\n\n{{事務局}}' },
      { id: 't4', cat: '当日', name: '1週間前のご案内（QRコード）', subject: '【{{大会名}}】いよいよ来週です（当日の受付について）', body: '{{氏名}} 様\n\n{{大会名}}まで、あと1週間となりました。\n\n■ 当日の受付\nマイページの「本人用QRコード」を受付でお見せください。\nマイページ：{{マイページ}}\n\n■ 会場：{{会場}}\n■ 部会：{{部会}}\n\n公共交通機関でお越しください。\n\n{{事務局}}' },
      { id: 't5', cat: '大会後', name: 'お礼とアンケートのお願い', subject: '【{{大会名}}】ご参加ありがとうございました（アンケートのお願い）', body: '{{氏名}} 様\n\n{{大会名}}にご参加いただき、ありがとうございました。\n今後の大会運営のため、アンケートにご協力ください（3分ほど）。\nマイページ：{{マイページ}}\n\n{{事務局}}' },
      { id: 't6', cat: '発表', name: '発表者へ：原稿提出のお願い', subject: '【{{大会名}}】発表原稿の提出について', body: '{{氏名}} 様（{{所属}}）\n\n研究発表のお申し込み、ありがとうございます。\n発表原稿（A4・2ページ、PDF）を、5月31日（仮）までにご提出ください。\n書き方は「研究発表 申込要項」をご覧ください。\n\n{{事務局}}' },
      { id: 't7', cat: 'その他', name: 'ふつうのお知らせ（ひな形）', subject: '【{{大会名}}】', body: '{{氏名}} 様\n\n\n\n{{事務局}}' },
    ];

    /* ── 参加者（架空・180人） ── */
    const start = new Date('2026-10-01T08:00:00').getTime();
    const N = 180;
    for (let i = 0; i < N; i++) {
      const bu = weighted(r, [['中学校部会', 45], ['高等学校部会', 35], ['小学校部会', 12], ['高専・大学部会', 8]]);
      const kind = weighted(r, [['会員', 60], ['一般（非会員）', 28], ['学生', 8], ['来賓・招待', 4]]);
      const pref = weighted(r, [['佐賀県', 30], ['福岡県', 20], ['長崎県', 8], ['熊本県', 7], ['大分県', 4], ['宮崎県', 3], ['鹿児島県', 4], ['沖縄県', 2], ['東京都', 5], ['大阪府', 4], ['愛知県', 3], ['広島県', 3], ['北海道', 2], ['神奈川県', 3], ['兵庫県', 1], ['京都府', 1]]);
      const s = pick(r, SEI), m = pick(r, MEI);
      const secs = ev.sections.filter((x) => x.bu === bu);
      const sec = secs.length ? pick(r, secs) : null;
      // 申込は、受付開始の直後と、最近に多い
      const t = start + Math.pow(i / N, 1.25) * 21.5 * 86400000 + r() * 7200000;
      const a = {
        name: s[0] + ' ' + m[0], kana: s[1] + ' ' + m[1], email: `t${String(i + 1).padStart(3, '0')}@example.com`, tel: '',
        org: school(r, pref, bu, kind), pref, kind, bu,
        section: sec ? `${sec.bu.replace('部会', '')} ${sec.no}（${sec.theme}）` : '',
        present: r() < 0.08 ? '発表する（別に発表の申込が必要）' : '発表しない',
        lecture: [r() < 0.35 && '8/3（火）講習会1日目', r() < 0.3 && '8/4（水）講習会2日目'].filter(Boolean),
        lunch: [r() < 0.7 && '8/5（木）', r() < 0.6 && '8/6（金）'].filter(Boolean),
        party: r() < 0.38 ? '参加する' : '参加しない',
        bus: r() < 0.55 ? '利用する' : '利用しない',
        needs: r() < 0.03 ? '車いすで参加します。エレベーターのある会場を希望します。' : r() < 0.03 ? '卵のアレルギーがあります。' : '',
        agree: true,
      };
      const p = { id: 'p' + (i + 1), code: 'SG-' + String(i + 1).padStart(4, '0'), token: '', createdAt: new Date(t).toISOString(), a, paid: false, paidAt: '', checkin: {}, status: 'ok', memo: '' };
      const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; for (let k = 0; k < 6; k++) p.token += c[Math.floor(r() * c.length)];
      if (i === 0) Object.assign(p.a, { name: '佐賀 花子', kana: 'さが はなこ', email: 'hanako@example.com', org: '佐賀市立あおば中学校', pref: '佐賀県', kind: '会員', bu: '中学校部会', section: '中学校 第1分科会（数と式）', party: '参加する', lunch: ['8/5（木）', '8/6（金）'] });
      ev.people.push(p);
    }
    ev.seq = N;
    // 入金：申込から日がたった人ほど入金ずみ
    for (const p of ev.people) {
      const age = (new Date('2026-10-23T00:00:00') - new Date(p.createdAt)) / 86400000;
      if (T.fee(p, ev) > 0 && r() < Math.min(0.92, age / 14)) { p.paid = true; p.paidAt = new Date(new Date(p.createdAt).getTime() + (2 + r() * 6) * 86400000).toISOString(); }
    }
    ev.people[0].paid = true; ev.people[0].paidAt = '2026-10-04T10:12:00';
    ev.people[57].status = 'cancel'; ev.people[57].memo = '10/18 本人より取消の連絡（メール）';

    /* ── アンケート ── */
    const THEMES = ['ICT・1人1台端末', '探究・課題研究', '観点別評価', '個別最適な学びと協働的な学び', '数学的活動', '統計教育', '小中・中高の接続', '入試と授業'];
    const pre = {
      id: 'sv1', title: '事前アンケート：関心のあるテーマ', lead: '分科会の運営と、講習会の内容づくりの参考にします（2分ほど）。', open: true, anonymous: false, target: 'all',
      questions: [
        { id: 'q1', type: 'checks', label: '関心のあるテーマ（いくつでも）', options: THEMES, required: true },
        { id: 'q2', type: 'scale', label: 'ライブ配信があれば、見たいと思いますか', min: '見ない', max: 'ぜひ見たい', required: true },
        { id: 'q3', type: 'radio', label: '大会の情報を、いちばん知りたい方法は？', options: ['このホームページ', 'メール', '学校あての文書', 'SNS'], required: false },
        { id: 'q4', type: 'text', label: '大会に期待すること・聞いてみたいこと', required: false },
      ],
      responses: [],
    };
    const VOICES = ['他県の中学校の、証明の指導の工夫を知りたいです。', '1人1台端末をどう授業に生かしているか、具体的な事例を見たい。', '探究の評価のしかたに悩んでいます。', '若手なので、授業づくりの基本から学びたいです。', '佐賀の先生方の実践を楽しみにしています。', '小中の接続について、校種を越えて話したい。', '統計の授業で使える教材がほしいです。', '', '', ''];
    for (let i = 0; i < 64; i++) {
      const p = ev.people[Math.floor(r() * N)];
      pre.responses.push({
        id: 'r' + i, pid: p.id, at: new Date(new Date(p.createdAt).getTime() + 3600000 * (1 + r() * 48)).toISOString(),
        a: { q1: THEMES.filter((x, k) => r() < [0.62, 0.45, 0.4, 0.3, 0.35, 0.22, 0.18, 0.12][k]), q2: weighted(r, [[5, 34], [4, 30], [3, 20], [2, 10], [1, 6]]), q3: weighted(r, [['このホームページ', 50], ['メール', 34], ['学校あての文書', 12], ['SNS', 4]]), q4: pick(r, VOICES) },
      });
    }
    ev.surveys = [pre, {
      id: 'sv2', title: '大会後アンケート', lead: '大会のふり返りと、次の大会の参考にします（3分ほど）。', open: false, anonymous: true, target: 'checked',
      questions: [
        { id: 'q1', type: 'scale', label: '大会全体の満足度', min: '不満', max: '満足', required: true },
        { id: 'q2', type: 'radio', label: 'いちばんよかったプログラム', options: ['基調講演', '分科会（研究発表）', '講習会', '情報交換会'], required: false },
        { id: 'q3', type: 'scale', label: '受付（QRコード）はスムーズでしたか', min: 'いいえ', max: 'はい', required: false },
        { id: 'q4', type: 'text', label: '感想・次の大会へのご意見', required: false },
      ],
      responses: [],
    }];

    /* ── 問い合わせ ── */
    ev.threads = [
      { id: 'th1', pid: 'p12', name: ev.people[11].a.name, email: ev.people[11].a.email, subject: '領収書の宛名について', cat: '申込・参加費', status: 'open', who: '', at: '2026-10-22T19:40:00', msgs: [{ from: 'p', text: '領収書の宛名を学校名にしていただくことはできますか。公費で支払う予定です。', at: '2026-10-22T19:40:00' }] },
      { id: 'th2', pid: 'p31', name: ev.people[30].a.name, email: ev.people[30].a.email, subject: '分科会を変えたい', cat: '申込内容の変更', status: 'doing', who: '受付係 古賀', at: '2026-10-21T08:15:00', msgs: [{ from: 'p', text: '第1希望の分科会を、第2分科会（図形）に変えたいです。', at: '2026-10-21T08:15:00' }, { from: 's', name: '受付係 古賀', text: 'ご連絡ありがとうございます。変更の手続きをしますので、少しお待ちください。', at: '2026-10-21T12:30:00' }] },
      { id: 'th3', pid: null, name: '江口 直樹', email: 'eguchi@example.com', subject: '駐車場はありますか', cat: '当日', status: 'done', who: '事務局 副島', at: '2026-10-12T10:00:00', msgs: [{ from: 'p', text: '車で行く予定ですが、会場に駐車場はありますか。', at: '2026-10-12T10:00:00' }, { from: 's', name: '事務局 副島', text: '会場校には参加者用の駐車場がありません。JR佐賀駅からのシャトルバスをご利用ください。Q&A にも載せました。', at: '2026-10-12T16:20:00' }] },
      { id: 'th4', pid: 'p1', name: '佐賀 花子', email: 'hanako@example.com', subject: '弁当のアレルギー対応', cat: '当日', status: 'open', who: '', at: '2026-10-23T07:05:00', msgs: [{ from: 'p', text: 'えびのアレルギーがあります。弁当の対応はできますか。', at: '2026-10-23T07:05:00' }] },
    ];

    /* ── 送信の記録 ── */
    const unpaid = ev.people.filter((p) => p.status !== 'cancel' && !T.paid(p, ev) && new Date(p.createdAt) < new Date('2026-10-12'));
    ev.mails = [
      { id: 'm1', at: '2026-10-20T17:00:00', subject: '【{{大会名}}】参加費のお支払いについて', body: ev.templates[2].body, to: unpaid.map((p) => p.id), method: 'sample', templateId: 't3', by: '会計 今村' },
    ];

    /* ── 運営：係・連絡板・やること ── */
    ev.staff = [
      { id: 'st1', name: '光武 誠', team: '本部', role: '実行委員長', email: 'chair@example.com', tel: '' },
      { id: 'st2', name: '副島 誠', team: '本部', role: '事務局長', email: 'office@example.com', tel: '' },
      { id: 'st3', name: '日数教 本部事務局', team: '日数教', role: '学会本部（連絡窓口）', email: 'hq@example.com', tel: '' },
      { id: 'st4', name: '草場 健太', team: '会場校', role: '会場校 担当（致遠館）', email: 'chienkan@example.com', tel: '' },
      { id: 'st5', name: '古賀 美咲', team: '受付', role: '受付係 長', email: 'uketsuke@example.com', tel: '' },
      { id: 'st6', name: '今村 陽子', team: '会計', role: '会計', email: 'kaikei@example.com', tel: '' },
      { id: 'st7', name: '陣内 翔', team: '広報', role: '広報・ホームページ', email: 'kouhou@example.com', tel: '' },
      { id: 'st8', name: '樋口 千尋', team: '冊子', role: '大会冊子・要項', email: 'sasshi@example.com', tel: '' },
      { id: 'st9', name: '城島 拓也', team: '配信', role: 'ライブ配信', email: 'haishin@example.com', tel: '' },
      { id: 'st10', name: '真崎 恵', team: '会場', role: '会場・教室割り', email: 'kaijo@example.com', tel: '' },
    ];
    ev.board = [
      { id: 'b1', ch: '日数教本部', author: '日数教 本部事務局', text: '第1次案内の原稿、確認しました。参加費の表記を「会員・非会員」で統一してください。後援の申請状況は来月の役員会で報告をお願いします。', at: '2026-10-20T15:10:00', pinned: true, replies: [{ author: '副島 誠', text: '承知しました。今週中に直した版をこちらに載せます。', at: '2026-10-20T17:45:00' }] },
      { id: 'b2', ch: '会場校', author: '草場 健太', text: '致遠館の教室割り（案）を作りました。中学校部会は中学棟2〜3階、高等学校部会は高校棟でまとめると移動が少なくなります。エレベーターは高校棟のみです。', at: '2026-10-19T18:30:00', pinned: false, replies: [] },
      { id: 'b3', ch: '受付係', author: '古賀 美咲', text: '受付のQRコード読み取りを、タブレット2台で試しました。1人あたり3秒ほどで受付できます。読み取れないときに名前で探す手順も、マニュアルに入れます。', at: '2026-10-22T16:00:00', pinned: false, replies: [{ author: '光武 誠', text: 'ありがとうございます。当日は入口を2列にしましょう。', at: '2026-10-22T18:20:00' }] },
      { id: 'b4', ch: '全体', author: '光武 誠', text: '次回の実行委員会は 11/6（金）16:30〜、会場校の会議室です。各係から、いまの進み具合を1分ずつ報告してください。', at: '2026-10-18T09:00:00', pinned: true, replies: [] },
    ];
    ev.tasks = [
      { id: 'k1', title: '第1次案内の修正版を本部へ送る', team: '本部', who: '副島 誠', due: '2026-10-26', status: 'doing', note: '参加費の表記を統一' },
      { id: 'k2', title: '会場校の教室割り（案）を確定', team: '会場', who: '草場 健太', due: '2026-11-06', status: 'doing', note: '' },
      { id: 'k3', title: '受付ボランティア（生徒・教員）の募集', team: '受付', who: '古賀 美咲', due: '2027-05-31', status: 'todo', note: '1日目 20名・2日目 12名' },
      { id: 'k4', title: '名札・QRコードの印刷テスト', team: '受付', who: '古賀 美咲', due: '2026-11-13', status: 'todo', note: 'A4 10面のラベル用紙で' },
      { id: 'k5', title: '大会冊子の入稿', team: '冊子', who: '樋口 千尋', due: '2027-07-09', status: 'todo', note: '印刷所の締切を確認' },
      { id: 'k6', title: 'ライブ配信の機材・回線の下見', team: '配信', who: '城島 拓也', due: '2026-12-11', status: 'todo', note: '' },
      { id: 'k7', title: '弁当業者の見積もり', team: '会計', who: '今村 陽子', due: '2026-11-30', status: 'todo', note: '' },
      { id: 'k8', title: '大会ホームページの公開', team: '広報', who: '陣内 翔', due: '2026-09-01', status: 'done', note: '' },
      { id: 'k9', title: '後援の申請（県・市の教育委員会）', team: '本部', who: '光武 誠', due: '2026-12-25', status: 'todo', note: '' },
    ];

    /* ── 大会冊子 ── */
    ev.booklet = {
      greetings: [
        { id: 'g1', title: 'ごあいさつ', who: '公益社団法人 日本数学教育学会 会長（サンプル）', body: '（ここに、学会の会長のあいさつ文が入ります。サンプルの文です。）\n第109回全国算数・数学教育研究（佐賀）大会の開催にあたり、ごあいさつ申し上げます。全国から集まった先生方の実践と研究が、子どもたちの学びをより豊かにする力になることを願っています。' },
        { id: 'g2', title: '歓迎のことば', who: '佐賀大会実行委員会 委員長　光武 誠（サンプル）', body: '（ここに、実行委員長のあいさつ文が入ります。サンプルの文です。）\nようこそ佐賀へ。有田焼や唐津焼、バルーンの空で知られる佐賀の地で、校種を越えて数学教育を語り合える日を、実行委員一同、心から楽しみにしております。' },
      ],
      notes: '・名札は会場内で常に着用してください。\n・受付では、本人用のQRコードをお見せください。\n・会場校には駐車場がありません。公共交通機関をご利用ください。\n・分科会の様子を、記録のために撮影することがあります。\n・ごみは各自でお持ち帰りください。',
      parts: { cover: true, greetings: true, outline: true, program: true, sections: true, venues: true, notes: true, roster: false },
    };

    ev.log = [
      { at: '2026-10-22T16:02:00', who: '古賀 美咲', text: '受付のテスト（QRコード）を行いました' },
      { at: '2026-10-20T17:00:00', who: '今村 陽子', text: `未入金の方へ一斉連絡（${unpaid.length}人）` },
      { at: '2026-10-15T10:05:00', who: '陣内 翔', text: '資料「研究発表 申込要項」「会場案内図」を掲載' },
    ];

    const db = { v: 1, current: ev.id, events: { [ev.id]: ev } };
    return db;
  };

  // サンプルの PDF を、ファイルの保存場所（IndexedDB）に入れる（sample-pdfs.js があるときだけ）
  T.loadSamplePdfs = async (db) => {
    if (!T.SAMPLE_PDFS) return;
    for (const ev of Object.values(db.events)) {
      for (const d of ev.docs) {
        const b64 = T.SAMPLE_PDFS[d.id];
        if (!b64) continue;
        const key = T.fileKey(ev.id, d.id);
        if (await T.files.get(key)) continue;
        const blob = T.b64ToBlob(b64, 'application/pdf');
        await T.files.put(key, blob);
        d.size = blob.size;
        d.hasFile = true;
      }
    }
  };
})();
