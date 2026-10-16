// 集客窓口：問い合わせフォームの設定と、受付箱（返信・商談・成約まで）
(function () {
  'use strict';
  const { h } = Kit;

  /* ───────── 決まりごと ───────── */
  const STATUS = [
    { v: 'new', label: '新規', chip: 'blue' },
    { v: 'replied', label: '返信済み', chip: '' },
    { v: 'talking', label: '商談中', chip: 'warn' },
    { v: 'won', label: '成約', chip: 'ok' },
    { v: 'lost', label: '見送り', chip: 'line' },
  ];
  const ST = {};
  STATUS.forEach((s) => { ST[s.v] = s; });
  const CHANNEL = { form: 'ホームページのフォーム', manual: '手入力', import: '取り込み', 'site-demo': 'ホームページ（試し送信）' };
  const VIA = ['電話', '対面', 'SNSのDM', 'メール', 'その他'];
  const PLACEHOLDERS = ['お名前', 'ご用件', '希望日時', '屋号', '代表者', '署名'];
  const LINK_PRESETS = ['チラシ', '名刺', 'Instagram', 'X', '公民館の掲示', '体験会', 'ご紹介カード'];
  const TABS = [
    { v: 'inbox', label: '受付箱', short: '受付箱' },
    { v: 'form', label: 'フォーム設定', short: 'フォーム' },
    { v: 'stats', label: '分析', short: '分析' },
    { v: 'links', label: 'QR・リンク', short: 'QR' },
    { v: 'replies', label: '返信テンプレート', short: '返信文' },
  ];
  const PERIODS = [{ value: 'month', label: '今月' }, { value: 'last', label: '先月' }, { value: '3m', label: '3か月' }, { value: '12m', label: '12か月' }];
  const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

  // 送信先の種類（ホームページのフォームがどこへ送るか）
  const DELIVERY = [
    { v: 'demo', label: 'まだ決めていない（試し用）', desc: 'ホームページの見た目を確かめるための設定です。',
      warn: '公開したページでは問い合わせが届きません。公開する前に、下のどれかに切りかえてください。' },
    { v: 'mailto', label: 'メールで受け取る', desc: '送信ボタンを押すと、送る人のメールアプリが開き、内容が入ったメールをあなたあてに送ってもらう方式です。いちばん簡単です。',
      note: 'メールアプリを使っていない人（ブラウザでだけメールを見る人など）は送れません。',
      inbox: '届いたメールを見て、受付箱の「問い合わせを記録」から入れます。' },
    { v: 'gas', label: 'Googleスプレッドシートに貯める', badge: '無料・おすすめ', desc: '問い合わせがGoogleスプレッドシートに1行ずつ貯まり、届くたびにメールで知らせが来ます。はじめに10分ほどの設定がいります。',
      inbox: 'スプレッドシートをCSVで保存して、受付箱の「まとめて取り込む」から入れます。' },
    { v: 'url', label: 'フォームサービス（Formspreeなど）', desc: 'Formspree などの、フォームを受け付けるサービスに送ります。サービスに登録して、もらった送信先のURLを貼ってください。',
      note: '無料のプランは、月に受けられる件数に上限があります。',
      inbox: 'サービスの画面からCSVを書き出して、受付箱の「まとめて取り込む」から入れます。' },
    { v: 'google', label: 'Googleフォームへ案内する', desc: 'ホームページには案内のボタンだけを置き、Googleフォームに移って書いてもらいます。ここで決めた項目は使われず、Googleフォームの項目になります。',
      inbox: '回答をスプレッドシートにつないでCSVで保存し、受付箱の「まとめて取り込む」から入れます。' },
  ];
  const URL_FIELD = {
    gas: { label: 'ウェブアプリのURL', ph: 'https://script.google.com/macros/s/…/exec' },
    url: { label: '送信先のURL', ph: 'https://formspree.io/f/…' },
    google: { label: 'GoogleフォームのURL', ph: 'https://forms.gle/…' },
  };

  // スプレッドシートに貼るスクリプト（gas/inquiry.gs と同じ内容）
  const GAS_SCRIPT = String.raw`/**
 * みせびらき 集客窓口：ホームページの問い合わせフォームを受け取るスクリプト（Google Apps Script）
 * 届いた問い合わせを、このスプレッドシートの「お問い合わせ」シートに1行ずつ貯め、メールで知らせます。
 *
 * 設定のしかた（10分ほど）
 *  1. Googleスプレッドシートを新しく作る（名前は自由。例：お問い合わせ）
 *  2. メニューの「拡張機能」→「Apps Script」を開く
 *  3. はじめから書いてある文字をすべて消して、このスクリプトを貼り付ける
 *  4. すぐ下の NOTIFY_EMAIL に知らせを受け取るメール、TOKEN に自分だけの合言葉（8文字以上）を書いて保存する
 *  5. 右上の「デプロイ」→「新しいデプロイ」→ 種類の歯車から「ウェブアプリ」を選ぶ
 *  6. 次のユーザーとして実行：自分　／　アクセスできるユーザー：全員　にして「デプロイ」
 *  7. 許可を求められたら自分のアカウントで許可する
 *     （「Google はこのアプリを確認していません」と出たら「詳細」→「（プロジェクト名）に移動」）
 *  8. 出てきた「ウェブアプリのURL」（/exec で終わる）をコピーして、集客窓口のフォーム設定に貼る
 * あとで直したときは「デプロイを管理」→ 鉛筆の印 → バージョン「新バージョン」→「デプロイ」（URLは変わりません）
 */
const NOTIFY_EMAIL = 'you@example.com'; // 知らせを受け取るメール（空にすると知らせない）
const TOKEN = 'ここに合言葉';           // 受付箱へ取り込むときの合言葉。人に教えない
const SHEET_NAME = 'お問い合わせ';
const HEADERS = ['受付日時', 'ご用件', 'お名前', 'メール', '電話', '希望日時', 'どこで知ったか', '内容', 'ページ'];
const KEYS = ['kind', 'name', 'email', 'phone', 'date', 'source', 'message', 'page'];
const MAX = { kind: 100, name: 100, email: 200, phone: 40, date: 60, source: 100, message: 5000, page: 500 };

// フォームから送られてきたとき
function doPost(e) {
  const p = readPayload_(e);
  // 人には見えない欄（website）が埋まっていたら機械の自動送信。受け取ったふりだけして捨てる
  if (p.website) return json_({ ok: true });
  const v = {};
  KEYS.forEach(function (k) { v[k] = clean_(p[k], MAX[k]); });
  if (!v.name && !v.email && !v.message) return json_({ ok: false, error: 'empty' });
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    sheet_().appendRow([new Date()].concat(KEYS.map(function (k) { return cell_(v[k]); })));
  } finally {
    lock.releaseLock();
  }
  // 知らせのメールが送れなくても、受付は済んでいる
  try { notify_(v); } catch (err) { console.error(err); }
  return json_({ ok: true });
}

// 受付箱から取り込むとき。?token=合言葉 が合っているときだけ一覧を返す
function doGet(e) {
  const t = e && e.parameter ? String(e.parameter.token || '') : '';
  if (TOKEN.length < 8 || t !== TOKEN) {
    return ContentService.createTextOutput('みせびらき 集客窓口の受付です。お問い合わせは、ホームページのフォームからお送りください。');
  }
  const rows = sheet_().getDataRange().getDisplayValues();
  return json_({ ok: true, header: rows[0] || HEADERS, rows: rows.slice(1) });
}

// JSON でも、ふつうのフォーム送信でも読めるようにする
function readPayload_(e) {
  let p = {};
  if (e && e.postData && e.postData.contents) {
    try { p = JSON.parse(e.postData.contents); } catch (err) { p = {}; }
  }
  if (!p || typeof p !== 'object' || Array.isArray(p)) p = {};
  const q = (e && e.parameter) || {};
  Object.keys(q).forEach(function (k) { if (p[k] == null) p[k] = q[k]; });
  return p;
}

// 前後の空白をとり、長すぎる分は切る
function clean_(s, max) {
  return String(s == null ? '' : s).replace(/\r\n?/g, '\n').trim().slice(0, max);
}

// = + - @ で始まると式として動いてしまう。0 で始まる数字は 0 が消える。先頭に ' をつけて文字のまま入れる
function cell_(s) {
  return /^[=+\-@]/.test(s) || /^0\d+$/.test(s) ? "'" + s : s;
}

// 「お問い合わせ」シート。なければ作って、見出しを入れる
function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  }
  return sh;
}

// 届いたことをメールで知らせる（返信すると、そのまま相手に届く）
function notify_(v) {
  if (!NOTIFY_EMAIL || NOTIFY_EMAIL === 'you@example.com') return;
  const one = function (s) { return String(s).replace(/\s+/g, ' '); };
  const subject = '【お問い合わせ】' + one(v.kind || 'ホームページから') + '（' + one(v.name || 'お名前なし') + ' 様）';
  const body = [
    'ホームページのフォームから、お問い合わせが届きました。',
    '',
    'ご用件：' + v.kind,
    'お名前：' + v.name,
    'メール：' + v.email,
    '電話：' + v.phone,
    '希望日時：' + v.date,
    'どこで知ったか：' + v.source,
    '',
    '内容：',
    v.message,
    '',
    '送られたページ：' + v.page,
    '一覧（スプレッドシート）：' + SpreadsheetApp.getActiveSpreadsheet().getUrl(),
  ].join('\n');
  const opt = {};
  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.email)) opt.replyTo = v.email;
  MailApp.sendEmail(NOTIFY_EMAIL, subject, body, opt);
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
`;

  /* ───────── サンプルと、ひな形 ───────── */
  const isoAt = (days, hh, mm) => { const d = Kit.addDays(Kit.today(), days); d.setHours(hh, mm || 0, 0, 0); return d.toISOString(); };
  const hoursAgo = (n) => new Date(Date.now() - n * 3600000).toISOString();

  const FORM_SAMPLE = {
    title: 'お問い合わせ・ご予約',
    lead: '無料体験レッスンのご予約、講座や出張ワークショップのご相談など、お気軽にどうぞ。2日以内にメールでお返事します。',
    kinds: ['無料体験レッスンの予約', 'ご相談・お問い合わせ', '出張ワークショップの依頼', 'その他'],
    fields: { phone: false, date: true, source: true },
    sources: ['Instagram', 'X', '検索', 'ご紹介', 'チラシ・掲示', 'その他'],
    thanks: '送信しました。お問い合わせありがとうございます。内容を確かめて、2日以内にメールでお返事します。',
    privacy: 'いただいたお名前・連絡先は、お問い合わせへのお返事のためだけに使い、ほかの目的には使いません。',
    sourceParam: 'from',
    delivery: { type: 'demo', to: '', url: '' },
    links: [],
    linkBase: '',
  };
  // サンプルを片付けたあとの、どの事業でも使えるフォーム
  const FORM_BLANK = {
    title: 'お問い合わせ',
    lead: 'ご質問・ご相談など、お気軽にお送りください。内容を確かめて、メールでお返事します。',
    kinds: ['ご相談・お問い合わせ', 'ご予約', 'その他'],
    fields: { phone: false, date: false, source: true },
    sources: ['Instagram', 'X', '検索', 'ご紹介', 'チラシ', 'その他'],
    thanks: '送信しました。お問い合わせありがとうございます。内容を確かめて、ご連絡します。',
    privacy: 'いただいたお名前・連絡先は、お問い合わせへのお返事のためだけに使います。',
    sourceParam: 'from',
    delivery: { type: 'demo', to: '', url: '' },
    links: [],
    linkBase: '',
  };

  // ホームページの部品が持っているひな形があれば、それに合わせる（サンプルを片付けたあと、どちらの画面で見ても同じフォームに）
  if (window.SiteRender && window.SiteRender.FORM_BLANK && typeof window.SiteRender.FORM_BLANK === 'object') {
    Object.assign(FORM_BLANK, Kit.clone(window.SiteRender.FORM_BLANK), { links: [], linkBase: '' });
  }

  const REPLIES_SAMPLE = {
    sign: '',
    items: [
      { id: 'rp-trial', title: '体験レッスンの日程調整', body: '{お名前} 様\n\nはじめまして。{屋号}の{代表者}です。\n無料体験レッスンのお申し込み、ありがとうございます。\n\nご希望の{希望日時}で、体験レッスンをお受けできます。\nご都合が合わない場合は、次の候補からもお選びいただけます。\n\n・〇月〇日（〇）〇時から\n・〇月〇日（〇）〇時から\n\nレッスンはオンラインで行います。参加のしかたは前日までにお送りします。\nどこでつまずいているのかを、当日いっしょに見つけていきましょう。\n\n{署名}' },
      { id: 'rp-price', title: '料金のご案内', body: '{お名前} 様\n\nお問い合わせいただき、ありがとうございます。{屋号}の{代表者}です。\n料金についてご案内します。\n\n・オンライン個別レッスン（60分）：4,000円\n・大人の学び直し講座（全6回）：18,000円\n・メンバーシップ「ひらめき部」：月額980円\n\nお支払いは、お申し込みのあとにお送りする請求書から、銀行振込でお願いしています。\nまずは無料の体験レッスンから始めることもできます。\n\n{署名}' },
      { id: 'rp-ws', title: '出張ワークショップのお見積り前の確認', body: '{お名前} 様\n\n出張ワークショップのご相談をいただき、ありがとうございます。{屋号}の{代表者}です。\nお見積りをお出しする前に、いくつか教えてください。\n\n1. ご希望の日時（候補がいくつかあれば、あわせて）\n2. 会場の場所と、プロジェクターなどの設備\n3. 参加される方の人数と学年\n4. ねらい（数学を楽しむ会、授業の補い、保護者向け など）\n5. ご予算の目安（あれば）\n\n90分・30名まででしたら、30,000円からお受けしています。\nいただいた内容をもとに、3日以内にお見積りをお送りします。\n\n{署名}' },
      { id: 'rp-decline', title: '丁寧にお断りする', body: '{お名前} 様\n\nお問い合わせいただき、ありがとうございます。{屋号}の{代表者}です。\n\nせっかくご連絡をいただいたのですが、ご希望の内容（{ご用件}）は、〇〇のため、今回はお受けすることが難しい状況です。\nご期待に沿えず、申し訳ありません。\n\nオンラインの個別レッスンや教材でしたらお力になれますので、よろしければまたご連絡ください。\n\n{署名}' },
      { id: 'rp-thanks', title: 'ご利用のお礼', body: '{お名前} 様\n\nこのたびは{屋号}のレッスンを受けていただき、ありがとうございました。{代表者}です。\n\n〇〇の問題で、自分から図をかいて考えていた姿が、とても印象に残っています。\nこの調子で、次の回もいっしょに考えていきましょう。\n\n気になることがあれば、いつでもお気軽にご相談ください。\n\n{署名}' },
    ],
  };
  // サンプルを片付けたあとの、どの事業でも使える返信のひな形
  const REPLIES_BLANK = {
    sign: '',
    items: [
      { id: 'rp-date', title: '日程の調整', body: '{お名前} 様\n\nはじめまして。{屋号}の{代表者}です。\nこのたびはお問い合わせいただき、ありがとうございます。\n\nご希望の{希望日時}で承れます。\nご都合が変わった場合は、次の候補からもお選びいただけます。\n\n・〇月〇日（〇）〇時から\n・〇月〇日（〇）〇時から\n\n当日のくわしいご案内は、前日までにお送りします。\nご不明な点があれば、このメールにそのままご返信ください。\n\n{署名}' },
      { id: 'rp-price', title: '料金のご案内', body: '{お名前} 様\n\nお問い合わせいただき、ありがとうございます。{屋号}の{代表者}です。\n料金についてご案内します。\n\n・〇〇：〇〇円\n・〇〇：〇〇円\n\nお支払い方法は〇〇です。\nほかにも気になる点があれば、お気軽にお知らせください。\n\n{署名}' },
      { id: 'rp-estimate', title: 'お見積り前の確認', body: '{お名前} 様\n\nご相談いただき、ありがとうございます。{屋号}の{代表者}です。\nお見積りをお出しする前に、いくつか教えてください。\n\n1. ご希望の日時や納期\n2. 場所（または、お届け先）\n3. 人数や数量\n4. ご予算の目安（あれば）\n\nいただいた内容をもとに、〇日ほどでお見積りをお送りします。\n\n{署名}' },
      { id: 'rp-decline', title: '丁寧にお断りする', body: '{お名前} 様\n\nお問い合わせいただき、ありがとうございます。{屋号}の{代表者}です。\n\nせっかくご連絡をいただいたのですが、今回のご依頼（{ご用件}）は、〇〇のため、お受けすることが難しい状況です。\nご期待に沿えず、申し訳ありません。\n\nまたお力になれることがあれば、いつでもご連絡ください。\n\n{署名}' },
      { id: 'rp-thanks', title: 'ご利用のお礼', body: '{お名前} 様\n\nこのたびは{屋号}をご利用いただき、ありがとうございました。{代表者}です。\n\n〇〇\n\nこれからも、気になることがあれば、いつでもお気軽にご相談ください。\nよろしければ、ご感想をひとことお聞かせいただけるとうれしいです。\n\n{署名}' },
    ],
  };

  // 例の問い合わせ（日付はいつ開いても今に合わせる）
  const SAMPLE_LEADS = [
    { id: 's-lead-1', name: '山田 さくら', email: 'sakura.yamada@example.com', phone: '', kind: '無料体験レッスンの予約',
      message: '中2の娘のことで相談です。数学に苦手意識があり、テストの前になると落ちこんでしまいます。\n図を使って考える授業に興味があり、まずは体験レッスンを受けてみたいです。平日の夕方だと助かります。',
      preferredAt: Kit.rel(5) + 'T17:00', source: 'Instagram', status: 'new', value: 16000, tags: ['中学生', '保護者'], notes: [],
      nextAt: '', meetingAt: '', channel: 'form', createdAt: hoursAgo(2) },
    { id: 's-lead-2', name: '伊藤 ひなた', email: 'hinata.ito@example.com', phone: '090-0000-0001', kind: '無料体験レッスンの予約',
      message: 'みどり台公民館のチラシを見ました。高1の息子が二次関数でつまずいています。オンラインでも大丈夫でしょうか。',
      preferredAt: Kit.rel(4), source: 'チラシ・掲示', status: 'new', value: 0, tags: ['高校生'], notes: [],
      nextAt: '', meetingAt: '', channel: 'form', createdAt: isoAt(-1, 21, 12) },
    { id: 's-lead-3', name: '佐藤 健', email: 'ken.sato@example.com', phone: '', kind: 'ご相談・お問い合わせ',
      message: '40代の会社員です。仕事でデータを扱うようになり、高校の数学を学び直したいと思っています。大人の学び直し講座は、平日の夜にも受けられますか。',
      preferredAt: '', source: '検索', status: 'replied', value: 18000, tags: ['大人の学び直し'],
      notes: [{ at: isoAt(-3, 20, 40), text: '講座の日程表と料金をメールで送った。返事待ち。' }],
      nextAt: Kit.rel(-1), meetingAt: '', channel: 'form', createdAt: isoAt(-4, 19, 5), repliedAt: isoAt(-3, 20, 30) },
    { id: 's-lead-4', name: 'さくら台中学校 PTA（田中 みどり）', email: 'pta.sakuradai@example.com', phone: '090-0000-0002', kind: '出張ワークショップの依頼',
      message: 'PTA主催の親子講座で、90分の数学ワークショップをお願いできないかと考えています。対象は中学生と保護者で30名ほどです。11月の土曜日の午前を考えています。',
      preferredAt: '', source: 'ご紹介', status: 'talking', value: 30000, tags: ['学校', 'ワークショップ'],
      notes: [{ at: isoAt(-8, 13, 0), text: '電話で返事。11月の土曜の午前で調整する。' }, { at: isoAt(-5, 16, 20), text: '会場は家庭科室、プロジェクターあり。打ち合わせの日を決めた。' }],
      nextAt: Kit.rel(3), meetingAt: Kit.rel(3) + 'T10:00', channel: 'manual', via: '電話', createdAt: isoAt(-9, 12, 45), repliedAt: isoAt(-8, 13, 0), talkingAt: isoAt(-5, 16, 20) },
    { id: 's-lead-5', name: '鈴木 まなぶ', email: 'manabu.suzuki@example.com', phone: '', kind: '無料体験レッスンの予約',
      message: '高校受験に向けて、関数の文章題を基礎からやり直したいです。体験レッスンをお願いします。',
      preferredAt: Kit.rel(-18) + 'T16:00', source: 'X', status: 'won', value: 16000, tags: ['中学生'],
      notes: [{ at: isoAt(-18, 17, 30), text: '体験レッスン。図で考えるやり方が合っている様子。' }, { at: isoAt(-15, 10, 0), text: '月4回の個別レッスンに申し込み。' }],
      nextAt: '', meetingAt: '', channel: 'form', createdAt: isoAt(-22, 18, 10), repliedAt: isoAt(-21, 9, 15), talkingAt: isoAt(-18, 17, 30), closedAt: isoAt(-15, 10, 0) },
    { id: 's-lead-6', name: '高橋 ゆう', email: 'yu.takahashi@example.com', phone: '', kind: 'ご相談・お問い合わせ',
      message: '中学校で数学を教えています。授業ツールのテンプレート集を、学年でまとめて使いたいのですが、学校での購入はできますか。',
      preferredAt: '', source: 'X', status: 'lost', value: 9000, tags: ['先生'],
      notes: [{ at: isoAt(-36, 15, 0), text: '今年度は予算がないとのこと。来年度の4月にまた声をかける。' }],
      nextAt: '', meetingAt: '', channel: 'form', createdAt: isoAt(-40, 11, 30), repliedAt: isoAt(-39, 8, 50), closedAt: isoAt(-36, 15, 0) },
    { id: 's-lead-7', name: '中村 あおい', email: 'aoi.nakamura@example.com', phone: '', kind: 'その他',
      message: 'メンバーシップ「ひらめき部」の月1回のオンライン会は、録画で見ることもできますか。',
      preferredAt: '', source: 'Instagram', status: 'won', value: 980, tags: ['ひらめき部'],
      notes: [{ at: isoAt(-55, 9, 0), text: '録画ありと返信。その日のうちに入会。' }],
      nextAt: '', meetingAt: '', channel: 'form', createdAt: isoAt(-56, 22, 15), repliedAt: isoAt(-55, 9, 0), closedAt: isoAt(-55, 18, 0) },
    { id: 's-lead-8', name: '小林 みのる', email: 'minoru.kobayashi@example.com', phone: '', kind: 'ご相談・お問い合わせ',
      message: '定年のあとに、数学をもう一度やってみたいと思っています。まったくの初心者でも講座についていけますか。',
      preferredAt: '', source: 'ご紹介', status: 'talking', value: 18000, tags: ['大人の学び直し'],
      notes: [{ at: isoAt(-70, 10, 0), text: '第1回だけ見学してから決めたいとのこと。' }],
      nextAt: Kit.rel(6), meetingAt: '', channel: 'form', createdAt: isoAt(-72, 14, 20), repliedAt: isoAt(-71, 9, 30), talkingAt: isoAt(-70, 10, 0) },
  ];

  // ほかのアプリ（ダッシュボード・カレンダー・ホームページ）から読んでも、同じサンプルが見えるように
  if (typeof Kit.store.sample === 'function') {
    Kit.store.sample('leads', SAMPLE_LEADS);
    Kit.store.sample('form', FORM_SAMPLE);
    Kit.store.sample('replies', REPLIES_SAMPLE);
  }

  /* ───────── 小物 ───────── */
  const pad2 = (n) => String(n).padStart(2, '0');
  const DAY = 86400000;
  const todayYmd = () => Kit.ymd();
  const localYmd = (iso) => { const d = new Date(iso); return isNaN(d) ? '' : Kit.ymd(d); };
  const uniq = (arr) => [...new Set(arr.filter((x) => x != null && String(x).trim() !== '').map((x) => String(x).trim()))];
  const reachedReply = (l) => l.status === 'replied' || l.status === 'talking' || l.status === 'won' || !!l.repliedAt;
  const reachedTalk = (l) => l.status === 'talking' || l.status === 'won' || !!l.talkingAt;
  const agoNear = (iso) => { const t = new Date(iso).getTime(); return t && Date.now() - t < 30 * DAY ? Kit.ago(iso) : ''; };
  const sampleChip = () => h('span', { class: 'chip sample' }, 'サンプル');
  const statusChip = (st) => { const s = ST[st] || ST.new; return h('span', { class: 'chip ib-st' + (s.chip ? ' ' + s.chip : '') }, h('span', { class: 'dot' }), s.label); };
  const vh = (forId, text) => h('label', { class: 'ib-vh', for: forId }, text);
  const hasFormPage = () => !!(window.SiteRender && typeof window.SiteRender.formPage === 'function');

  // 'YYYY-MM-DD' / 'YYYY-MM-DDTHH:mm' → '10/19(月) 17:00'
  function fmtWhen(s) {
    if (!s) return '';
    const t = /T(\d{2}:\d{2})/.exec(s);
    return Kit.fmtDate(s.slice(0, 10)) + (t ? ' ' + t[1] : '');
  }
  // 手紙の中の日付：'10月19日（月）17:00'
  function fmtLetter(s) {
    if (!s) return '';
    const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(s);
    if (!m) return String(s);
    const d = new Date(+m[1], +m[2] - 1, +m[3]);
    const y = d.getFullYear() !== new Date().getFullYear() ? d.getFullYear() + '年' : '';
    return y + (d.getMonth() + 1) + '月' + d.getDate() + '日（' + Kit.WDAY[d.getDay()] + '）' + (m[4] ? ' ' + (+m[4]) + ':' + m[5] : '');
  }
  // CSV の日時：'2026/10/14 09:30'
  function fmtStamp(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return '';
    return d.getFullYear() + '/' + pad2(d.getMonth() + 1) + '/' + pad2(d.getDate()) + ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes());
  }

  // 足りない項目を埋める（古いデータや、ほかの画面から来たものでも安心して使えるように）
  function normLead(l) {
    const x = Object.assign({ name: '', email: '', phone: '', kind: '', message: '', preferredAt: '', source: '', status: 'new', value: 0, tags: [], notes: [], nextAt: '', meetingAt: '', channel: 'form' }, l);
    if (!ST[x.status]) x.status = 'new';
    ['name', 'email', 'phone', 'kind', 'message', 'source', 'preferredAt', 'nextAt', 'meetingAt'].forEach((k) => { x[k] = x[k] == null ? '' : String(x[k]); });
    x.tags = Array.isArray(x.tags) ? x.tags.filter(Boolean).map(String) : [];
    x.notes = Array.isArray(x.notes) ? x.notes.filter((n) => n && n.text) : [];
    x.value = Math.max(0, Number(x.value) || 0);
    return x;
  }
  function normForm(f) {
    f = f && typeof f === 'object' ? f : {};
    const out = Object.assign(Kit.clone(FORM_BLANK), f);
    out.fields = Object.assign({}, FORM_BLANK.fields, f.fields);
    out.delivery = Object.assign({ type: 'demo', to: '', url: '' }, f.delivery);
    if (!DELIVERY.some((d) => d.v === out.delivery.type)) out.delivery.type = 'demo';
    out.delivery.urls = Object.assign({}, out.delivery.urls);
    if (out.delivery.url && out.delivery.urls[out.delivery.type] == null) out.delivery.urls[out.delivery.type] = out.delivery.url;
    ['title', 'lead', 'thanks', 'privacy', 'linkBase'].forEach((k) => { out[k] = out[k] == null ? '' : String(out[k]); });
    out.kinds = Array.isArray(out.kinds) ? out.kinds.map(String) : [];
    out.sources = Array.isArray(out.sources) ? out.sources.map(String) : [];
    out.links = Array.isArray(out.links) ? out.links.filter((x) => x && x.url) : [];
    out.sourceParam = String(out.sourceParam || 'from');
    return out;
  }
  // 保存・ホームページに渡す形（空の選択肢をのぞく）
  function cleanForm(f) {
    const out = Kit.clone(f);
    delete out._sample;
    out.kinds = uniq(out.kinds);
    out.sources = uniq(out.sources);
    return out;
  }
  function normReplies(r) {
    r = r && typeof r === 'object' ? r : {};
    const out = {
      sign: String(r.sign || ''),
      items: Array.isArray(r.items) ? r.items.filter((t) => t && typeof t === 'object').map((t) => ({ id: String(t.id || Kit.uid('rp')), title: String(t.title || ''), body: String(t.body || '') })) : [],
    };
    if (r._sample) out._sample = true;
    return out;
  }

  // 署名（事業プロフィールから）と、テンプレートの差し込み。わからないところは 〇〇 にして、書きかえてもらう
  const autoSign = (p) => { const lines = [p.name, p.owner, p.email, p.url].filter(Boolean); return lines.length ? '────────────\n' + lines.join('\n') : ''; };
  function fillTpl(text, lead, p, sign) {
    const v = { お名前: lead.name, ご用件: lead.kind, 希望日時: fmtLetter(lead.preferredAt), 屋号: p.name, 代表者: p.owner, 署名: sign };
    return String(text || '').replace(/\{(お名前|ご用件|希望日時|屋号|代表者|署名)\}/g, (_, k) => v[k] || (k === '署名' ? '' : '〇〇')).replace(/\s+$/, '');
  }

  // 集客リンク：base?from=<配り先>（# より前に入れる。同じ名前があれば置きかえる）
  function linkFor(base, param, label) {
    base = String(base || '').trim();
    if (!base || !label) return base;
    const i = base.indexOf('#');
    const hash = i >= 0 ? base.slice(i) : '';
    let b = i >= 0 ? base.slice(0, i) : base;
    if (/^https?:\/\/[^/?#]+$/i.test(b)) b += '/';
    const p = param.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    b = b.replace(new RegExp('([?&])' + p + '=[^&]*(&|$)'), (m, a, z) => (z ? a : '')).replace(/[?&]$/, '');
    return b + (b.includes('?') ? '&' : '?') + param + '=' + encodeURIComponent(label) + hash;
  }

  /* ───────── 表の読み込み（CSV・TSV・スプレッドシートからの貼り付け） ───────── */
  function parseDelim(text, d) {
    const rows = [];
    let row = [], cell = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
      else if (c === '"' && cell === '') q = true;
      else if (c === d) { row.push(cell); cell = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
      else cell += c;
    }
    if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
    return rows.filter((r) => r.some((c) => String(c).trim() !== ''));
  }
  function parseTable(text) {
    text = String(text || '').replace(/^﻿/, '');
    const nl = text.search(/\r?\n/);
    const first = nl < 0 ? text : text.slice(0, nl);
    return parseDelim(text, first.split('\t').length > first.split(',').length ? '\t' : ',');
  }
  async function readText(file) {
    const buf = await file.arrayBuffer();
    try { return new TextDecoder('utf-8', { fatal: true }).decode(buf); }
    catch (e) { try { return new TextDecoder('shift_jis').decode(buf); } catch (e2) { return new TextDecoder().decode(buf); } }
  }

  // 見出しの名前から、どの列が何かを当てる
  const MAP_FIELDS = [
    { k: 'name', label: 'お名前', syn: ['お名前', '氏名', '名前', 'name', 'ニックネーム'] },
    { k: 'email', label: 'メール', syn: ['メールアドレス', 'メール', 'email', 'mail', 'eメール'] },
    { k: 'phone', label: '電話', syn: ['電話番号', '電話', 'tel', 'phone', '携帯'] },
    { k: 'kind', label: 'ご用件', syn: ['ご用件', '用件', '種類', 'kind', '件名', 'subject'] },
    { k: 'message', label: '内容', syn: ['お問い合わせ内容', '内容', '本文', 'message', 'メッセージ', 'ご質問', 'ご相談'] },
    { k: 'date', label: '希望日時', syn: ['希望日時', '希望日', 'date', 'preferred'] },
    { k: 'source', label: 'どこで知ったか', syn: ['どこで知った', 'どこで知り', 'source', 'きっかけ'] },
    { k: 'at', label: '受付日時', syn: ['タイムスタンプ', '受付日時', '送信日時', '日時', '日付', 'timestamp', 'at', 'created', 'submitted'] },
  ];
  const normH = (s) => String(s || '').toLowerCase().replace(/[\s　_\-・:：（）()「」『』"'？?。、.]/g, '');
  function autoMap(header) {
    const cand = [];
    header.forEach((col, ci) => {
      const hn = normH(col);
      if (!hn) return;
      for (const f of MAP_FIELDS) {
        for (const s of f.syn) {
          const sn = normH(s);
          let sc = 0;
          if (hn === sn) sc = 100 + sn.length;
          else if ((/[^\x00-\x7f]/.test(sn) || sn.length >= 5) && hn.includes(sn)) sc = 10 + sn.length;
          if (sc) cand.push({ ci, k: f.k, sc });
        }
      }
    });
    cand.sort((a, b) => b.sc - a.sc);
    const map = {}, used = new Set();
    for (const c of cand) { if (map[c.k] != null || used.has(c.ci)) continue; map[c.k] = c.ci; used.add(c.ci); }
    return map;
  }
  // 受付日時：'2026/10/01 10:15:30'・'10/1/2026 10:15'・ISO など → ISO（読めなければ ''）
  function parseWhen(s) {
    s = String(s || '').trim();
    if (!s) return '';
    let m = /^(\d{4})[/\-.年](\d{1,2})[/\-.月](\d{1,2})日?(?:[\sT]+(\d{1,2})[:時](\d{1,2})?分?(?::(\d{1,2}))?)?\s*$/.exec(s);
    let d = null;
    if (m) d = new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0));
    else if ((m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?\s*$/.exec(s))) d = new Date(+m[3], +m[1] - 1, +m[2], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0));
    else { const t = Date.parse(s); if (!isNaN(t)) d = new Date(t); }
    if (!d || isNaN(d) || d.getFullYear() < 2000 || d.getFullYear() > 2100) return '';
    return d.toISOString();
  }
  // 希望日時：読めれば 'YYYY-MM-DD' か 'YYYY-MM-DDTHH:mm'。読めなければ null（本文に書き足す）
  function parsePreferred(s) {
    s = String(s || '').trim();
    if (!s) return '';
    const m = /^(\d{4})[/\-.年](\d{1,2})[/\-.月](\d{1,2})日?(?:[^\d]+(\d{1,2})[:時](\d{1,2})?)?/.exec(s);
    if (!m) return null;
    const d = new Date(+m[1], +m[2] - 1, +m[3]);
    if (isNaN(d) || d.getMonth() !== +m[2] - 1) return null;
    const ymd = m[1] + '-' + pad2(m[2]) + '-' + pad2(m[3]);
    return m[4] != null && +m[4] < 24 ? ymd + 'T' + pad2(m[4]) + ':' + pad2(m[5] || 0) : ymd;
  }
  const dupKey = (l) => String(l.email || '').trim().toLowerCase() + '|' + String(l.message || '').replace(/\s+/g, ' ').trim();
  function rowToLead(r, map) {
    const get = (k) => (map[k] != null ? String(r[map[k]] == null ? '' : r[map[k]]).trim() : '');
    const l = { name: get('name'), email: get('email'), phone: get('phone'), kind: get('kind'), message: get('message'), source: get('source'),
      preferredAt: '', status: 'new', value: 0, tags: [], notes: [], nextAt: '', meetingAt: '', channel: 'import' };
    const pd = get('date'), pp = parsePreferred(pd);
    if (pp === null) l.message = (l.message ? l.message + '\n\n' : '') + '希望日時：' + pd;
    else l.preferredAt = pp;
    const at = parseWhen(get('at'));
    if (at) l.createdAt = at;
    return l;
  }
  // QR の画像のファイル名：英数字だけにする（日本語の名前は保存のしかたによっては消えてしまう）
  function qrName(label) {
    const a = String(label || '').normalize('NFKC').replace(/[^\w-]+/g, '').slice(0, 30);
    if (a) return 'qr-' + a + '.png';
    let n = 0;
    for (const c of String(label || 'homepage')) n = (n * 31 + c.codePointAt(0)) >>> 0;
    return 'qr-' + Kit.ymd().replace(/-/g, '') + '-' + n.toString(36).slice(-4) + '.png';
  }
  const colName = (i) => (i >= 26 ? colName(Math.floor(i / 26) - 1) : '') + String.fromCharCode(65 + (i % 26));

  function checkUrl(type, v) {
    if (!v) return { empty: true, msg: type === 'gas' ? '設定のしかたの最後に出てくるURLを貼ります' : type === 'google' ? 'Googleフォームの送信ボタンから、リンクのURLをコピーして貼ります' : 'サービスでもらった送信先のURLを貼ります' };
    if (!/^https:\/\//i.test(v)) return { msg: 'https:// で始まるURLを貼ってください' };
    if (type === 'gas') {
      if (/\/dev(\?|$)/.test(v)) return { msg: 'これはテスト用のURL（/dev）です。新しいデプロイで出てくる /exec で終わるURLを貼ってください' };
      if (/script\.google\.com\/(home|d\/)/.test(v) || /\/edit/.test(v)) return { msg: 'これはスクリプトを書く画面のURLです。デプロイしたときに出る /exec で終わるURLを貼ってください' };
      if (!/^https:\/\/script\.google\.com\/(a\/macros\/[^/]+|macros)\/s\/[\w-]+\/exec/.test(v)) return { msg: 'https://script.google.com/macros/s/…/exec の形か、確かめてください' };
      return { ok: true, msg: 'よさそうです。ホームページを公開し直したら、一度ためしに送ってみてください' };
    }
    if (type === 'google') {
      if (/\/edit(\?|#|$)/.test(v)) return { msg: 'これは質問を作る画面のURLです。送信ボタンから、リンクのURLをコピーしてください' };
      if (!/^https:\/\/(docs\.google\.com\/forms\/|forms\.gle\/)/.test(v)) return { msg: 'Googleフォームのリンク（forms.gle/… など）か、確かめてください' };
      return { ok: true, msg: 'よさそうです' };
    }
    return { ok: true, msg: 'よさそうです。ホームページを公開し直したら、一度ためしに送ってみてください' };
  }

  // 書きかえると少しあとで保存。画面を離れるときは、すぐ保存する
  function saver(fn, ms) {
    let t = 0, pending = false;
    const run = () => { clearTimeout(t); if (!pending) return; pending = false; fn(); };
    const s = () => { pending = true; clearTimeout(t); t = setTimeout(run, ms); };
    s.flush = run;
    return s;
  }

  Kit.css('inbox', `
.app-inbox { container: ib / inline-size; }
.ib-vh { position: absolute !important; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
.ib-tabs { margin-bottom: 16px; }
.ib-tabs .ib-tab-s { display: none; }
.ib-badge { display: inline-block; min-width: 18px; padding: 0 5px; margin-left: 6px; border-radius: 9px; background: var(--shu); color: var(--on-shu); font-size: 11px; font-weight: 700; line-height: 18px; text-align: center; vertical-align: 1px; font-variant-numeric: tabular-nums; }
@container ib (max-width: 560px) {
  .ib-tabs .ib-tab-l { display: none; }
  .ib-tabs .ib-tab-s { display: inline; }
  .ib-tabs > button { padding: 9px 11px; }
}
.ib-note { display: flex; flex-wrap: wrap; gap: 8px 10px; align-items: center; padding: 10px 14px; margin-bottom: 12px; border: 1px solid var(--line); border-radius: var(--r); background: var(--surface); font-size: 13.5px; color: var(--ink-2); }
.ib-note > svg { flex: none; width: 18px; height: 18px; color: var(--ink-3); }
.ib-note > .grow { flex: 1 1 220px; }
.ib-note.warn { background: var(--warn-wash); border-color: color-mix(in srgb, var(--warn) 35%, var(--line)); color: var(--ink); }
.ib-note.warn > svg { color: var(--warn); }
.ib-ok { color: var(--ok) !important; }
.ib-bad { color: var(--bad) !important; font-weight: 700; }
.ib-warn { color: var(--warn) !important; font-weight: 700; }

/* 受付箱 */
.ib-tools { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 10px; }
.ib-break { flex-basis: 100%; height: 0; }
.ib-break2, .ib-tools .ib-s, .ib-iofoot { display: none; }
.ib-search { position: relative; flex: 1 1 240px; min-width: 0; }
.ib-search input { padding-left: 34px; }
.ib-search svg { position: absolute; left: 10px; top: 50%; width: 17px; height: 17px; transform: translateY(-50%); color: var(--ink-3); pointer-events: none; }
.ib-tools select { width: auto; flex: none; }
.ib-filters { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
.ib-filters button.chip { flex: none; min-height: 36px; padding: 3px 12px; font-size: 13px; gap: 6px; }
.ib-filters .ib-n { font-variant-numeric: tabular-nums; opacity: .75; }
.ib-iofoot { margin-top: 14px; }
@container ib (max-width: 560px) {
  .ib-wide, .ib-tools .ib-io, .ib-break, .ib-tools .ib-l { display: none; }
  .ib-tools .ib-s { display: inline; }
  .ib-tools .ib-search { order: 1; flex: 1 1 160px; }
  .ib-tools .btn.primary { order: 2; }
  .ib-break2 { display: block; order: 3; flex-basis: 100%; height: 0; }
  .ib-tools select { order: 4; }
  .ib-tools .seg { order: 5; margin-left: auto; }
  .ib-tools select[hidden] ~ .seg { margin-left: 0; }
  .ib-filters { flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; padding-bottom: 2px; }
  .ib-filters::-webkit-scrollbar { display: none; }
  .ib-iofoot { display: flex; }
}
.ib-split { display: grid; gap: 16px; grid-template-columns: minmax(0, 1fr); align-items: start; }
.ib-list.list > .list-item { display: block; padding: 12px 14px; }
.ib-list.list > .list-item.is-sel { background: var(--gosu-wash); box-shadow: inset 3px 0 0 var(--gosu); }
.ib-r-top { display: flex; align-items: baseline; gap: 8px; min-width: 0; }
.ib-r-name { flex: 1; min-width: 0; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ib-r-time { flex: none; font-size: 12px; color: var(--ink-3); }
.ib-r-kind { font-size: 13px; color: var(--ink-2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin: 1px 0 6px; }
.ib-chips { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; }
.ib-due { display: flex; flex-wrap: wrap; gap: 2px 12px; margin-top: 6px; }
.ib-due > span { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: var(--ink-3); }
.ib-due svg { width: 14px; height: 14px; flex: none; }
.ib-due .over { color: var(--bad); font-weight: 700; }
.ib-due .today { color: var(--warn); font-weight: 700; }
.ib-more { display: block; width: 100%; padding: 10px 14px; border: 0; background: transparent; color: var(--gosu); font: inherit; font-size: 13px; cursor: pointer; }
.ib-detailpane > .empty { padding: 48px 18px; }
@container ib (min-width: 760px) {
  .ib-split { grid-template-columns: minmax(280px, 360px) minmax(0, 1fr); }
  .ib-detailpane { position: sticky; top: 12px; max-height: calc(100vh - 24px); max-height: calc(100dvh - 24px); overflow: auto; border-radius: var(--r); }
  .ib-back { display: none; }
  @media (max-width: 999px) {
    .ib-detailpane { top: calc(var(--top-h) + 12px); max-height: calc(100vh - var(--top-h) - 24px); max-height: calc(100dvh - var(--top-h) - 24px); }
  }
}
@container ib (max-width: 759.98px) {
  .ib-split.is-detail .ib-listpane, .ib-split:not(.is-detail) .ib-detailpane { display: none; }
  .ib-inbox.is-detail .ib-listonly { display: none; }
}

/* くわしく */
.ib-detail.card { padding: 18px; }
.ib-back { margin: -6px 0 8px -8px; }
.ib-d-head { display: flex; flex-wrap: wrap; gap: 8px 12px; align-items: flex-start; }
.ib-d-name { font-size: 20px; font-weight: 700; line-height: 1.35; overflow-wrap: anywhere; outline: none; }
.ib-d-sub { font-size: 13px; color: var(--ink-3); margin-top: 2px; }
.ib-msg { margin-top: 14px; padding: 12px 14px; border-radius: var(--r-sm); background: var(--surface-2); white-space: pre-wrap; overflow-wrap: anywhere; font-size: 14.5px; line-height: 1.85; }
.ib-sec { display: grid; gap: 10px; margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--line); min-width: 0; }
.ib-sec-h { font-size: 12.5px; font-weight: 700; color: var(--ink-3); letter-spacing: .04em; margin: 0; }
.ib-dl { display: grid; grid-template-columns: 7.5em minmax(0, 1fr); gap: 6px 12px; margin: 0; font-size: 14px; }
.ib-dl dt { color: var(--ink-3); font-size: 13px; padding-top: 5px; }
.ib-dl dd { margin: 0; min-width: 0; overflow-wrap: anywhere; padding-top: 3px; }
.ib-contact { display: flex; flex-wrap: wrap; align-items: center; gap: 2px 6px; min-width: 0; }
.ib-contact .ib-sel { font-variant-numeric: tabular-nums; overflow-wrap: anywhere; min-width: 0; }
.ib-contact a { font-size: 12.5px; }
.ib-acts { margin-top: 14px; }
.ib-calslot { display: contents; }
.ib-steps { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 3px; }
.ib-step { display: inline-flex; align-items: center; justify-content: center; gap: 4px; min-width: 0; min-height: 40px; padding: 4px 6px; border: 1px solid var(--line-strong); background: var(--surface); color: var(--ink-2); font: inherit; font-size: 13px; line-height: 1.2; cursor: pointer; }
.ib-step:first-child { border-radius: 8px 0 0 8px; }
.ib-step:last-child { border-radius: 0 8px 8px 0; }
.ib-step span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ib-step svg { width: 14px; height: 14px; flex: none; }
.ib-step:hover { background: var(--surface-2); color: var(--ink); }
.ib-step.done { background: var(--gosu-wash); color: var(--gosu); border-color: color-mix(in srgb, var(--gosu) 30%, var(--line)); }
.ib-step[aria-pressed="true"] { background: var(--gosu); border-color: var(--gosu); color: var(--on-gosu); font-weight: 700; cursor: default; }
.ib-step.st-won[aria-pressed="true"] { background: var(--ok-wash); border-color: var(--ok); color: var(--ok); }
.ib-step.st-lost[aria-pressed="true"] { background: var(--surface-3); border-color: var(--line-strong); color: var(--ink); }
@container ib (max-width: 420px) { .ib-step svg { display: none; } .ib-step { padding: 4px 2px; font-size: 12.5px; } }
.ib-fields { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(min(100%, 190px), 1fr)); }
.ib-fields > .field { align-content: start; }
.ib-quick { display: flex; flex-wrap: wrap; gap: 4px; }
.ib-tags { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.ib-tags:empty { display: none; }
.ib-tag { padding-right: 3px; min-height: 28px; }
.ib-tag button { display: inline-grid; place-items: center; width: 24px; height: 24px; padding: 0; border: 0; border-radius: 50%; background: transparent; color: inherit; cursor: pointer; }
.ib-tag button:hover { background: var(--surface-3); }
.ib-tag button svg { width: 12px; height: 12px; }
.ib-tagadd { display: flex; gap: 6px; max-width: 360px; }
.ib-noteadd { display: grid; gap: 6px; }
.ib-noteadd .btn-row { justify-content: flex-end; }
.ib-tl { list-style: none; margin: 4px 0 0; padding: 0; }
.ib-tl li { position: relative; padding: 0 0 14px 22px; min-width: 0; }
.ib-tl li::before { content: ""; position: absolute; left: 3px; top: 8px; width: 9px; height: 9px; border-radius: 50%; background: var(--gosu); }
.ib-tl li::after { content: ""; position: absolute; left: 7px; top: 20px; bottom: 0; width: 1px; background: var(--line); }
.ib-tl li:last-child { padding-bottom: 0; }
.ib-tl li:last-child::after { display: none; }
.ib-tl li.sys::before { background: var(--surface); border: 2px solid var(--line-strong); }
.ib-tl-at { display: flex; align-items: center; gap: 8px; min-height: 26px; font-size: 12px; color: var(--ink-3); }
.ib-tl-at .btn { margin-left: auto; }
.ib-tl-text { white-space: pre-wrap; overflow-wrap: anywhere; font-size: 14px; }
.ib-tl li.sys .ib-tl-text { color: var(--ink-2); font-size: 13px; }

/* 流れで見る */
.ib-board { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(176px, 1fr); gap: 10px; overflow-x: auto; padding-bottom: 8px; scroll-snap-type: x proximity; }
@container ib (max-width: 560px) { .ib-board { grid-auto-columns: 80%; } }
.ib-col { display: flex; flex-direction: column; gap: 8px; min-width: 0; min-height: 260px; padding: 10px; border: 1px solid var(--line); border-radius: var(--r); background: var(--surface-2); scroll-snap-align: start; transition: background .12s, border-color .12s; }
.ib-col.is-over { border-color: var(--gosu); background: var(--gosu-wash); }
.ib-col-h { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--ink-2); }
.ib-col-h .ib-col-sum { margin-left: auto; font-size: 12px; color: var(--ink-3); }
.ib-col-empty { padding: 18px 6px; text-align: center; border: 1px dashed var(--line-strong); border-radius: var(--r-sm); }
.ib-card { display: grid; gap: 6px; min-width: 0; padding: 10px; border: 1px solid var(--line); border-radius: var(--r-sm); background: var(--surface); box-shadow: var(--shadow-1); }
.ib-card[draggable="true"] { cursor: grab; }
.ib-card.is-drag { opacity: .45; }
.ib-card-open { display: grid; gap: 2px; min-width: 0; padding: 0; border: 0; background: transparent; color: inherit; font: inherit; text-align: left; cursor: pointer; }
.ib-card-open:hover .ib-card-name { color: var(--gosu); }
.ib-card-name { font-weight: 700; font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ib-card-kind { font-size: 12.5px; color: var(--ink-2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ib-card-meta { font-size: 12px; color: var(--ink-3); }
.ib-card select { min-height: 36px; padding: 4px 28px 4px 8px; font-size: 13px; }

/* フォーム設定 */
.ib-fgrid { display: grid; gap: 16px; grid-template-columns: minmax(0, 1fr); align-items: start; }
.ib-fprev { display: grid; gap: 12px; }
@container ib (min-width: 880px) {
  .ib-fgrid { grid-template-columns: minmax(0, 1fr) minmax(320px, 420px); }
  .ib-fprev { position: sticky; top: 12px; max-height: calc(100vh - 24px); max-height: calc(100dvh - 24px); overflow: auto; }
  .ib-jump { display: none; }
  @media (max-width: 999px) {
    .ib-fprev { top: calc(var(--top-h) + 12px); max-height: calc(100vh - var(--top-h) - 24px); max-height: calc(100dvh - var(--top-h) - 24px); }
  }
}
.ib-saved { font-size: 12.5px; color: var(--ink-3); }
.ib-opts { display: grid; gap: 6px; }
.ib-opt { display: flex; gap: 2px; align-items: center; min-width: 0; }
.ib-opt input { flex: 1 1 auto; margin-right: 4px; }
.ib-optadd { display: flex; gap: 6px; }
.ib-checks { display: grid; gap: 4px; }
.ib-check { display: flex; align-items: center; gap: 10px; min-height: 36px; font-size: 14px; color: var(--ink); cursor: pointer; }
.ib-check.fixed { color: var(--ink-3); cursor: default; }
.ib-check.fixed svg { width: 17px; height: 17px; color: var(--ink-3); }
.ib-dv { display: grid; gap: 8px; }
.ib-dv-item { border: 1px solid var(--line); border-radius: var(--r); background: var(--surface); }
.ib-dv-item.is-on { border-color: var(--gosu); box-shadow: inset 0 0 0 1px var(--gosu); }
.ib-dv-opt { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 2px 10px; padding: 12px 14px; cursor: pointer; font-weight: 400; }
.ib-dv-opt input { margin: 3px 0 0; }
.ib-dv-t { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; font-size: 14.5px; font-weight: 700; color: var(--ink); }
.ib-dv-d { grid-column: 2; font-size: 13px; line-height: 1.65; color: var(--ink-2); }
.ib-dv-more { display: grid; gap: 10px; padding: 0 14px 14px 41px; }
@container ib (max-width: 560px) { .ib-dv-more { padding-left: 14px; } }
.ib-dv-warn { display: flex; gap: 8px; align-items: flex-start; padding: 8px 10px; border-radius: var(--r-sm); background: var(--warn-wash); color: var(--ink); font-size: 13px; }
.ib-dv-warn svg { flex: none; width: 16px; height: 16px; margin-top: 2px; color: var(--warn); }
.ib-fp { display: grid; gap: 12px; }
.ib-fp-title { font-family: var(--font-display); font-size: 21px; font-weight: 800; letter-spacing: .03em; line-height: 1.4; }
.ib-fp-lead { font-size: 14px; color: var(--ink-2); white-space: pre-wrap; }
.ib-fp-req { display: inline-block; margin-left: 6px; padding: 0 6px; border-radius: 4px; background: var(--surface-3); color: var(--ink-2); font-size: 11px; font-weight: 700; line-height: 18px; vertical-align: 1px; }
.ib-fp-privacy { font-size: 12.5px; color: var(--ink-3); white-space: pre-wrap; }
.ib-fp-thanks { padding: 16px; border-radius: var(--r); background: var(--ok-wash); color: var(--ink); white-space: pre-wrap; }
.ib-frame { display: block; width: 100%; height: 680px; border: 1px solid var(--line); border-radius: var(--r); background: var(--surface); }
.ib-code { margin: 0; padding: 10px 12px; max-height: 340px; overflow: auto; border: 1px solid var(--line-strong); border-radius: 8px; background: var(--surface-2); color: var(--ink); font-family: var(--font-mono); font-size: 12px; line-height: 1.55; white-space: pre; tab-size: 2; }
.ib-howto { margin: 0; padding-left: 1.5em; display: grid; gap: 6px; font-size: 14px; color: var(--ink-2); }

/* 分析 */
.ib-period { display: flex; flex-wrap: wrap; gap: 8px 12px; align-items: center; }
.ib-kpis { display: grid; gap: 10px; grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr)); }
@container ib (max-width: 560px) { .ib-kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); } .ib-kpis .kpi { padding: 12px; } .ib-kpis .kpi-value { font-size: 21px; } }
.ib-conv { display: flex; flex-wrap: wrap; gap: 4px 14px; margin-top: 12px; font-size: 13px; color: var(--ink-2); }
.ib-conv b { color: var(--ink); font-variant-numeric: tabular-nums; }

/* QR・リンク */
.ib-qgrid { display: grid; gap: 16px; grid-template-columns: minmax(0, 1fr); align-items: start; }
@container ib (min-width: 760px) { .ib-qgrid { grid-template-columns: minmax(0, 1fr) 300px; } }
.ib-presets { display: flex; flex-wrap: wrap; gap: 6px; }
.ib-presets button.chip { min-height: 36px; padding: 3px 12px; font-size: 13px; }
.ib-url { padding: 10px 12px; border-radius: var(--r-sm); background: var(--surface-2); font-family: var(--font-mono); font-size: 12.5px; line-height: 1.6; overflow-wrap: anywhere; word-break: break-all; }
.ib-qrbox { display: grid; justify-items: center; gap: 12px; text-align: center; }
.ib-qr { display: block; width: 220px; height: 220px; image-rendering: pixelated; border-radius: 6px; border: 1px solid var(--line); }
.ib-links.list > .list-item { align-items: center; flex-wrap: wrap; }
.ib-links canvas { flex: none; width: 56px; height: 56px; image-rendering: pixelated; border-radius: 4px; border: 1px solid var(--line); }
.ib-link-main { flex: 1 1 200px; min-width: 0; display: grid; gap: 2px; }
.ib-link-url { font-family: var(--font-mono); font-size: 12px; color: var(--ink-3); overflow-wrap: anywhere; word-break: break-all; }

/* 返信テンプレート */
.ib-tpl { display: grid; gap: 16px; grid-template-columns: minmax(0, 1fr); align-items: start; }
@container ib (min-width: 820px) { .ib-tpl { grid-template-columns: minmax(220px, 280px) minmax(0, 1fr); } }
.ib-tpl-list.list > .list-item { align-items: center; padding: 10px 14px; }
.ib-tpl-list.list > .list-item.is-sel { background: var(--gosu-wash); box-shadow: inset 3px 0 0 var(--gosu); font-weight: 700; }
.ib-ph { display: flex; flex-wrap: wrap; gap: 6px; }
.ib-ph button.chip { min-height: 32px; padding: 3px 10px; }
.ib-tpl-body, .ib-rp-body { min-height: 300px; line-height: 1.8; }
.ib-pre { white-space: pre-wrap; overflow-wrap: anywhere; padding: 12px 14px; border-radius: var(--r-sm); background: var(--surface-2); font-size: 14px; line-height: 1.8; max-height: 420px; overflow: auto; }
.ib-rp-warn { display: flex; gap: 6px; align-items: center; color: var(--warn); font-weight: 700; }
.ib-rp-warn svg { width: 16px; height: 16px; flex: none; }
.ib-inline { display: flex; gap: 6px; align-items: center; min-width: 0; }
.ib-inline > input { flex: 1 1 auto; min-width: 0; }

/* まとめて取り込む */
.ib-map { display: grid; gap: 8px 12px; grid-template-columns: repeat(auto-fit, minmax(min(100%, 190px), 1fr)); }
.ib-imp td { max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ib-imp tr.is-skip td { color: var(--ink-3); }
.ib-file { display: none; }

/* 指で触る画面では、押せる所を大きく */
@media (pointer: coarse) {
  .app-inbox .btn.sm, .ib-modal .btn.sm, .app-inbox .seg > button { min-height: 36px; }
  .app-inbox .btn.icon.sm, .ib-modal .btn.icon.sm { width: 36px; min-width: 36px; }
  .ib-tag button { width: 36px; height: 36px; }
  .ib-ph button.chip { min-height: 36px; }
}
`);

  Kit.app({
    id: 'inbox', title: '集客窓口', group: 'gather', icon: 'inbox', order: 20,
    desc: '問い合わせフォームと、受付箱（返信・商談の管理）',
    docs: ['form', 'replies'],
    colls: ['leads'],
    async mount(root, params) {
      params = params || {};
      const S = {
        tab: TABS.some((t) => t.v === params.tab) ? params.tab : params.lead ? 'inbox' : Kit.pref.get('inbox:tab', 'inbox'),
        leads: [], form: null, replies: null, profile: null, site: null,
        filter: 'all', q: '', sort: Kit.pref.get('inbox:sort', 'new'), view: Kit.pref.get('inbox:view', 'list'),
        sel: null, period: Kit.pref.get('inbox:period', '3m'), pv: Kit.pref.get('inbox:preview', 'simple'),
        linkLabel: 'チラシ', tplSel: null,
      };
      if (!TABS.some((t) => t.v === S.tab)) S.tab = 'inbox';
      if (!PERIODS.some((p) => p.value === S.period)) S.period = '3m';
      let dead = false, writing = 0, bulk = false, openOnPhone = false;
      let inboxUI = null, modalDetail = null, sampleHost = null, tabsEl = null, panel = null;
      const modals = new Set();
      const getLead = (id) => S.leads.find((x) => x.id === id);
      const narrow = () => root.clientWidth < 760;

      /* ───── 読み込み ───── */
      async function loadLeads() { S.leads = (await Kit.store.list('leads', { sample: SAMPLE_LEADS })).map(normLead); }
      async function loadDocs() {
        S.form = normForm(await Kit.store.get('form', { sample: FORM_SAMPLE, blank: FORM_BLANK }));
        S.replies = normReplies(await Kit.store.get('replies', { sample: REPLIES_SAMPLE, blank: REPLIES_BLANK }));
        S.profile = await Kit.profile.get();
        try { S.site = (await Kit.store.get('site')) || null; } catch (e) { S.site = null; }
      }
      await Promise.all([loadLeads(), loadDocs()]);
      if (params.lead) {
        if (getLead(params.lead)) { S.sel = params.lead; S.view = 'list'; S.tab = 'inbox'; openOnPhone = true; }
        else setTimeout(() => Kit.toast('その問い合わせは見つかりませんでした', { type: 'bad' }), 0);
      }

      /* ───── 保存 ───── */
      function putLocal(l) { const i = S.leads.findIndex((x) => x.id === l.id); if (i >= 0) S.leads[i] = l; else S.leads.push(l); }
      async function saveLead(l) {
        writing++;
        try { const saved = normLead(await Kit.store.put('leads', l)); putLocal(saved); return saved; }
        finally { writing--; }
      }
      // fn が false を返したら保存しない
      async function patchLead(id, fn) {
        const cur = getLead(id);
        if (!cur) return null;
        const next = Kit.clone(cur);
        if (fn(next) === false) return null;
        return saveLead(next);
      }
      // 状態を変えるとき、はじめて返信・商談に進んだ日時も残す（分析の「返信までの日数」に使う）
      function applyStatus(x, st, now) {
        x.status = st;
        if ((st === 'replied' || st === 'talking' || st === 'won') && !x.repliedAt) x.repliedAt = now;
        if ((st === 'talking' || st === 'won') && !x.talkingAt) x.talkingAt = now;
        x.closedAt = st === 'won' || st === 'lost' ? now : '';
      }
      async function changeStatus(id, st) {
        const prev = getLead(id);
        if (!prev || prev.status === st) return;
        const now = new Date().toISOString();
        await patchLead(id, (x) => applyStatus(x, st, now));
        Kit.toast(ST[st].label + 'にしました', { action: { label: 'もとに戻す', onClick: async () => { await saveLead(prev); redrawDetails(); } } });
      }
      function redrawDetails() { if (inboxUI && inboxUI.redrawDetail) inboxUI.redrawDetail(); if (modalDetail) modalDetail.draw(); }
      const saveForm = saver(() => {
        writing++;
        Kit.store.set('form', cleanForm(S.form)).finally(() => { writing--; });
        if (S.form._sample) { delete S.form._sample; renderSampleBar(); }
        Kit.$$('.ib-saved', root).forEach((el) => { el.textContent = '保存しました（' + fmtStamp(new Date().toISOString()).slice(11) + '）'; });
      }, 500);
      const saveReplies = saver(() => {
        writing++;
        const r = Kit.clone(S.replies);
        delete r._sample;
        Kit.store.set('replies', r).finally(() => { writing--; });
        if (S.replies._sample) { delete S.replies._sample; renderSampleBar(); }
        Kit.$$('.ib-saved', root).forEach((el) => { el.textContent = '保存しました（' + fmtStamp(new Date().toISOString()).slice(11) + '）'; });
      }, 500);

      // 開いたダイアログは、画面を離れるときに閉じる
      function modal(o) {
        const m = Kit.modal(Object.assign({}, o, { onClose: (v) => { modals.delete(m); if (o.onClose) o.onClose(v); } }));
        m.el.classList.add('ib-modal');
        modals.add(m);
        return m;
      }
      const go = (id, p) => { for (const m of [...modals]) m.close(); Kit.go(id, p); };

      /* ───── 外枠（見出し・サンプルの帯・タブ） ───── */
      function render() {
        Kit.clear(root);
        root.append(Kit.appHead({ title: '集客窓口', desc: '問い合わせを受けて、返信・商談・成約まで見守る場所です。フォームとQRコードもここで作れます。' }));
        sampleHost = h('div');
        tabsEl = h('div', { class: 'tabs ib-tabs', role: 'tablist', 'aria-label': '集客窓口の画面', onkeydown: onTabKey });
        panel = h('div', { class: 'ib-panel', id: 'ib-panel', role: 'tabpanel' });
        root.append(sampleHost, tabsEl, panel);
        renderSampleBar();
        renderTabs();
        renderPanel();
      }
      function renderSampleBar() {
        if (!sampleHost) return;
        Kit.clear(sampleHost);
        if (!(S.leads.some((l) => l.sample) || S.form._sample || S.replies._sample)) return;
        sampleHost.append(Kit.sampleBar('受付箱・フォーム・返信文は例（ひらめき数学舎）です。そのまま書きかえて使えます。', async () => {
          const ok = await Kit.confirm({ title: 'サンプルを片付けますか', body: '例の問い合わせを消します。まだ書きかえていないフォームと返信テンプレートは、どの事業でも使えるひな形になります。ほかの画面のサンプルも、まとめて片付きます。自分で入れたものは消えません。', ok: '片付ける' });
          if (!ok || dead) return;
          writing++;
          try { await Kit.store.samplesOff(); } finally { writing--; }
          await Promise.all([loadLeads(), loadDocs()]);
          S.sel = null;
          render();
          Kit.toast('サンプルを片付けました');
        }));
      }
      function renderTabs() {
        if (!tabsEl) return;
        const nNew = S.leads.filter((l) => l.status === 'new').length;
        Kit.clear(tabsEl);
        for (const t of TABS) {
          const on = S.tab === t.v;
          tabsEl.append(h('button', { type: 'button', role: 'tab', id: 'ib-tab-' + t.v, 'aria-selected': String(on), 'aria-controls': 'ib-panel', tabindex: on ? '0' : '-1', onclick: () => setTab(t.v) },
            h('span', { class: 'ib-tab-l' }, t.label), h('span', { class: 'ib-tab-s' }, t.short),
            t.v === 'inbox' && nNew ? h('span', { class: 'ib-badge', title: '返信がまだの問い合わせ' }, String(nNew)) : null));
        }
      }
      function onTabKey(e) {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        const i = TABS.findIndex((t) => t.v === S.tab);
        const n = TABS[(i + (e.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length];
        setTab(n.v);
        const b = tabsEl.querySelector('#ib-tab-' + n.v);
        if (b) b.focus();
      }
      function setTab(v) {
        if (S.tab === v) return;
        saveForm.flush(); saveReplies.flush();
        S.tab = v;
        Kit.pref.set('inbox:tab', v);
        renderTabs();
        renderPanel();
      }
      function renderPanel() {
        if (!panel) return;
        Kit.clear(panel);
        inboxUI = null;
        panel.setAttribute('aria-labelledby', 'ib-tab-' + S.tab);
        if (S.tab === 'inbox') renderInbox(panel);
        else if (S.tab === 'form') renderForm(panel);
        else if (S.tab === 'stats') renderStats(panel);
        else if (S.tab === 'links') renderLinks(panel);
        else renderReplies(panel);
      }

      /* ───── 受付箱 ───── */
      function searched() {
        const q = S.q.trim().toLowerCase();
        if (!q) return S.leads.slice();
        return S.leads.filter((l) => [l.name, l.email, l.phone, l.kind, l.message, l.tags.join(' ')].join('\n').toLowerCase().includes(q));
      }
      function sortLeads(arr) {
        const byNew = (a, b) => String(b.createdAt).localeCompare(String(a.createdAt));
        if (S.sort === 'next') return arr.sort((a, b) => { const x = a.nextAt || '9999', y = b.nextAt || '9999'; return x < y ? -1 : x > y ? 1 : byNew(a, b); });
        return arr.sort(byNew);
      }
      function dueNode(l) {
        const out = [];
        if (l.nextAt) {
          const t = todayYmd();
          if (l.nextAt < t) out.push(h('span', { class: 'over' }, Kit.icon('clock'), '連絡予定 ' + Kit.fmtDate(l.nextAt) + ' を過ぎています'));
          else if (l.nextAt === t) out.push(h('span', { class: 'today' }, Kit.icon('clock'), '今日 連絡する日です'));
          else out.push(h('span', null, Kit.icon('clock'), '次の連絡 ' + Kit.fmtDate(l.nextAt)));
        }
        if (l.meetingAt && l.meetingAt.slice(0, 10) >= todayYmd()) out.push(h('span', null, Kit.icon('calendar'), '予約 ' + fmtWhen(l.meetingAt)));
        return out.length ? h('div', { class: 'ib-due' }, out) : null;
      }
      function noticeNode() {
        if (S.form.delivery.type !== 'demo') return null;
        return h('div', { class: 'ib-note warn ib-listonly', role: 'note' }, Kit.icon('warn'),
          h('div', { class: 'grow' }, h('strong', null, 'フォームの送信先がまだ決まっていません。'), h('span', { class: 'ib-wide' }, ' 公開したホームページから送られても、ここには届きません。')),
          Kit.btn('送信先を決める', () => setTab('form'), { sm: true }));
      }

      function renderInbox(host) {
        const wrap = h('div', { class: 'ib-inbox' });
        host.append(wrap);
        const ui = (inboxUI = {});
        if (!S.leads.length) {
          wrap.append(noticeNode(), Kit.empty({
            title: 'まだ問い合わせはありません',
            body: 'ホームページのフォームから届いた問い合わせや、電話・SNSで受けた問い合わせを、ここで返信から成約まで見守ります。',
            actions: [Kit.btn('問い合わせを記録', () => openLeadForm(), { kind: 'primary', icon: 'plus' }), Kit.btn('まとめて取り込む', openImport, { icon: 'upload' }), Kit.btn('フォームを整える', () => setTab('form'), { icon: 'edit' })],
          }));
          ui.refresh = () => { if (S.leads.length) renderPanel(); };
          return;
        }
        let split = null, listPane = null, detailPane = null, detailDraw = null, listY = 0, limit = 200;
        const recBtn = Kit.btn('問い合わせを記録', () => openLeadForm(), { kind: 'primary', icon: 'plus', title: '問い合わせを記録' });
        recBtn.querySelector('span').className = 'ib-l';
        recBtn.append(h('span', { class: 'ib-s' }, '記録'));
        const qIn = h('input', { type: 'search', id: 'ib-q', placeholder: '名前・メール・内容でさがす', autocomplete: 'off', enterkeyhint: 'search' });
        qIn.value = S.q;
        qIn.addEventListener('input', Kit.debounce(() => { S.q = qIn.value; limit = 200; updateCounts(); drawBody(); }, 150));
        const sortSel = h('select', { id: 'ib-sort' }, h('option', { value: 'new' }, '新しい順'), h('option', { value: 'next' }, '次の連絡日順'));
        sortSel.value = S.sort === 'next' ? 'next' : 'new';
        sortSel.addEventListener('change', () => { S.sort = sortSel.value; Kit.pref.set('inbox:sort', S.sort); drawBody(); });
        const viewSeg = Kit.seg([{ value: 'list', label: '一覧' }, { value: 'flow', label: '流れで見る' }], S.view, (v) => { S.view = v; Kit.pref.set('inbox:view', v); drawBody(); }, { label: '見せ方' });
        const tools = h('div', { class: 'ib-tools ib-listonly' },
          recBtn,
          Kit.btn('まとめて取り込む', openImport, { icon: 'upload', class: 'ib-io' }),
          Kit.btn('CSVで書き出す', exportCsv, { icon: 'download', kind: 'ghost', class: 'ib-io' }),
          h('span', { class: 'ib-break', 'aria-hidden': 'true' }),
          h('div', { class: 'ib-search' }, vh('ib-q', 'さがす'), Kit.icon('search'), qIn),
          h('span', { class: 'ib-break2', 'aria-hidden': 'true' }),
          vh('ib-sort', '並べ方'), sortSel, viewSeg);
        const ioFoot = h('div', { class: 'btn-row ib-iofoot ib-listonly' },
          Kit.btn('まとめて取り込む', openImport, { icon: 'upload', sm: true }),
          Kit.btn('CSVで書き出す', exportCsv, { icon: 'download', sm: true, kind: 'ghost' }));
        const filters = h('div', { class: 'ib-filters ib-listonly', role: 'group', 'aria-label': '状態でしぼる' });
        const fBtns = [{ v: 'all', label: 'すべて' }].concat(STATUS).map((s) => h('button', {
          type: 'button', class: 'chip', dataset: { v: s.v }, 'aria-pressed': String(S.filter === s.v),
          onclick: () => { S.filter = s.v; limit = 200; fBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === s.v))); drawBody(); },
        }, s.label, h('span', { class: 'ib-n' }, '')));
        filters.append(...fBtns);
        const body = h('div');
        wrap.append(noticeNode(), tools, filters, body, ioFoot);

        function updateCounts() {
          const base = searched();
          fBtns.forEach((b) => { b.querySelector('.ib-n').textContent = String(b.dataset.v === 'all' ? base.length : base.filter((l) => l.status === b.dataset.v).length); });
        }
        function rowNode(l) {
          const on = l.id === S.sel;
          return h('button', { type: 'button', class: 'list-item ib-row' + (on ? ' is-sel' : ''), 'aria-current': on ? 'true' : null, dataset: { id: l.id }, onclick: () => openLead(l.id) },
            h('div', { class: 'ib-r-top' }, h('span', { class: 'ib-r-name' }, l.name || '（お名前なし）'), h('span', { class: 'ib-r-time', title: Kit.fmtDateTime(l.createdAt) }, Kit.ago(l.createdAt))),
            h('div', { class: 'ib-r-kind' }, l.kind || l.message.slice(0, 40) || '—'),
            h('div', { class: 'ib-chips' }, statusChip(l.status), l.source ? h('span', { class: 'chip line' }, l.source) : null, l.sample ? sampleChip() : null),
            dueNode(l));
        }
        function drawList() {
          if (!listPane) return;
          const arr = sortLeads(searched().filter((l) => S.filter === 'all' || l.status === S.filter));
          Kit.clear(listPane);
          if (!arr.length) {
            listPane.append(Kit.empty({ title: S.q ? '見つかりませんでした' : 'この状態の問い合わせはありません', body: S.q ? 'ことばを変えるか、しぼりこみを「すべて」にしてみてください。' : null }));
            return;
          }
          const list = h('div', { class: 'list ib-list' }, arr.slice(0, limit).map(rowNode));
          if (arr.length > limit) list.append(h('button', { type: 'button', class: 'ib-more', onclick: () => { limit += 200; drawList(); } }, 'もっと見る（あと' + (arr.length - limit) + '件）'));
          listPane.append(list);
        }
        function drawDetail() {
          if (!detailPane) return;
          if (!S.sel || !getLead(S.sel)) {
            detailDraw = null;
            Kit.clear(detailPane);
            detailPane.append(Kit.empty({ title: '問い合わせを選んでください', body: '一覧から選ぶと、ここに内容と返信・メモが出ます。' }));
            return;
          }
          detailPane.dataset.sel = S.sel;
          detailDraw = detailInto(detailPane, S.sel, { onBack: backToList, onDeleted: () => { S.sel = null; backToList(); drawBody(); } });
        }
        function openLead(id) {
          S.sel = id;
          for (const b of listPane.querySelectorAll('.ib-row')) {
            const on = b.dataset.id === id;
            b.classList.toggle('is-sel', on);
            if (on) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
          }
          drawDetail();
          if (narrow()) {
            listY = window.scrollY;
            split.classList.add('is-detail');
            wrap.classList.add('is-detail');
            const top = Kit.$('.mb-top');
            window.scrollTo(0, Math.max(0, split.getBoundingClientRect().top + window.scrollY - (top ? top.offsetHeight : 0) - 12));
            const hd = detailPane.querySelector('.ib-d-name');
            if (hd) hd.focus({ preventScroll: true });
          } else detailPane.scrollTop = 0;
        }
        function backToList() {
          if (!split) return;
          split.classList.remove('is-detail');
          wrap.classList.remove('is-detail');
          drawList();
          window.scrollTo(0, listY);
          const b = listPane.querySelector('.ib-row.is-sel');
          if (b) b.focus({ preventScroll: true });
        }
        // しぼりこみ・並べかえ・見せ方の切りかえで描き直す（同じ問い合わせを開いていれば、書きかけのメモごと残す）
        function drawBody() {
          Kit.clear(body);
          filters.hidden = S.view === 'flow';
          sortSel.hidden = S.view === 'flow';
          if (S.view === 'flow') { split = listPane = detailPane = detailDraw = null; drawBoard(body, sortLeads(searched())); return; }
          split = h('div', { class: 'ib-split' });
          listPane = h('div', { class: 'ib-listpane' });
          const keep = detailPane && detailDraw && detailPane.dataset.sel === S.sel;
          if (!keep) { detailPane = h('div', { class: 'ib-detailpane' }); detailDraw = null; }
          split.append(listPane, detailPane);
          body.append(split);
          if (!S.sel && !narrow()) { const first = sortLeads(searched().filter((l) => S.filter === 'all' || l.status === S.filter))[0]; if (first) S.sel = first.id; }
          drawList();
          if (S.sel && narrow() && openOnPhone) { split.classList.add('is-detail'); wrap.classList.add('is-detail'); }
          openOnPhone = false;
          if (!keep || detailPane.dataset.sel !== S.sel) drawDetail();
        }
        ui.refresh = (ext) => {
          if (!S.leads.length) { renderPanel(); return; }
          updateCounts();
          if (S.view === 'flow') { drawBody(); return; }
          drawList();
          if (!ext || !detailPane) return;
          const l = S.sel && getLead(S.sel);
          if (!l) { S.sel = null; if (split && split.classList.contains('is-detail')) backToList(); drawDetail(); }
          else if (detailDraw && detailPane.dataset.stamp !== (l.updatedAt || '')) detailDraw();
        };
        ui.redrawDetail = () => { if (detailDraw) detailDraw(); };
        updateCounts();
        drawBody();
      }

      // 流れで見る（状態ごとの列。PC はドラッグ、スマホはカードの切りかえで移す）
      function drawBoard(host, arr) {
        const canDrag = !(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
        let dragId = null;
        host.append(h('p', { class: 'small muted', style: { marginBottom: '8px' } }, canDrag ? 'カードを横の列へ動かすと、状態が変わります。カードの下の切りかえでも変えられます。' : 'カードの下の切りかえで、状態を変えられます。横にずらすと、ほかの列も見られます。'));
        const board = h('div', { class: 'ib-board' });
        for (const s of STATUS) {
          const items = arr.filter((l) => l.status === s.v);
          const sum = Kit.sum(items, (l) => l.value);
          const col = h('section', { class: 'ib-col', dataset: { st: s.v }, 'aria-label': s.label + ' ' + items.length + '件' },
            h('div', { class: 'ib-col-h' }, statusChip(s.v), h('span', { class: 'num' }, items.length + '件'), sum ? h('span', { class: 'ib-col-sum num', title: '見込み金額の合計' }, Kit.yenShort(sum)) : null),
            items.length ? items.map((l) => cardNode(l)) : h('p', { class: 'ib-col-empty small muted' }, canDrag ? 'ここへ動かせます' : 'まだありません'));
          if (canDrag) {
            col.addEventListener('dragover', (e) => { if (!dragId) return; e.preventDefault(); e.dataTransfer.dropEffect = 'move'; col.classList.add('is-over'); });
            col.addEventListener('dragleave', (e) => { if (!col.contains(e.relatedTarget)) col.classList.remove('is-over'); });
            col.addEventListener('drop', (e) => { e.preventDefault(); col.classList.remove('is-over'); const id = dragId || e.dataTransfer.getData('text/plain'); dragId = null; if (id) changeStatus(id, s.v); });
          }
          board.append(col);
        }
        host.append(board);
        function cardNode(l) {
          const sel = h('select', { id: 'ib-k-' + l.id, 'aria-label': (l.name || 'この問い合わせ') + ' の状態' }, STATUS.map((s) => h('option', { value: s.v, selected: s.v === l.status }, s.label)));
          sel.addEventListener('change', () => changeStatus(l.id, sel.value));
          const card = h('div', { class: 'ib-card', draggable: canDrag ? 'true' : null, dataset: { id: l.id } },
            h('button', { type: 'button', class: 'ib-card-open', onclick: () => openDetailModal(l.id) },
              h('span', { class: 'ib-card-name' }, l.name || '（お名前なし）'),
              h('span', { class: 'ib-card-kind' }, l.kind || l.message.slice(0, 30) || '—'),
              h('span', { class: 'ib-card-meta num' }, [l.value ? Kit.yen(l.value) : '', Kit.ago(l.createdAt)].filter(Boolean).join('・'))),
            l.sample || l.source ? h('div', { class: 'ib-chips' }, l.source ? h('span', { class: 'chip line' }, l.source) : null, l.sample ? sampleChip() : null) : null,
            dueNode(l), sel);
          if (canDrag) {
            card.addEventListener('dragstart', (e) => { dragId = l.id; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', l.id); card.classList.add('is-drag'); });
            card.addEventListener('dragend', () => { dragId = null; card.classList.remove('is-drag'); Kit.$$('.ib-col.is-over', board).forEach((c) => c.classList.remove('is-over')); });
          }
          return card;
        }
      }
      function openDetailModal(id) {
        const host = h('div');
        const m = modal({ title: '問い合わせ', body: host, wide: true, onClose: () => { modalDetail = null; } });
        modalDetail = { id, draw: detailInto(host, id, { inModal: true, onDeleted: () => m.close() }) };
      }

      /* ───── くわしく（一覧の右・スマホは全面・流れで見るはダイアログ） ───── */
      function detailInto(host, id, o) {
        const draw = () => {
          const lead = getLead(id);
          const ae = document.activeElement;
          const focusId = ae && host.contains(ae) && ae.id ? ae.id : null;
          const draftEl = host.querySelector('#ib-note-new');
          const draft = draftEl ? draftEl.value : '';
          const scroll = host.scrollTop;
          Kit.clear(host);
          if (!lead) { host.append(Kit.empty({ title: 'この問い合わせは見つかりません', body: '消されたか、ほかの画面で書きかえられました。' })); return; }
          host.dataset.stamp = lead.updatedAt || '';
          host.append(detailNode(lead, o, draw));
          const nd = host.querySelector('#ib-note-new');
          if (nd && draft) nd.value = draft;
          if (focusId) { const f = host.querySelector('#' + focusId); if (f) f.focus({ preventScroll: true }); }
          host.scrollTop = scroll;
        };
        draw();
        return draw;
      }
      function detailNode(l, o, redraw) {
        const id = l.id;
        const el = h('article', { class: 'ib-detail' + (o.inModal ? '' : ' card') });
        if (o.onBack) el.append(h('div', { class: 'ib-back' }, Kit.btn('一覧にもどる', o.onBack, { icon: 'left', kind: 'ghost', sm: true })));
        const near = agoNear(l.createdAt);
        el.append(h('div', { class: 'ib-d-head' },
          h('div', { class: 'grow' },
            h('h2', { class: 'ib-d-name', tabindex: '-1' }, l.name || '（お名前なし）'),
            h('div', { class: 'ib-d-sub' }, (l.kind || 'ご用件なし') + '　受付 ' + Kit.fmtDateTime(l.createdAt) + (near ? '（' + near + '）' : ''))),
          h('div', { class: 'ib-chips' }, l.sample ? sampleChip() : null, statusChip(l.status))));
        el.append(h('div', { class: 'ib-msg' }, l.message || '（内容は書かれていません）'));

        // 連絡先と、問い合わせの中身
        const dl = h('dl', { class: 'ib-dl' });
        const row = (k, v) => dl.append(h('dt', null, k), h('dd', null, v));
        const copyBtn = (text, what) => Kit.btn('', () => Kit.copy(text, what + 'をコピーしました'), { icon: 'copy', sm: true, kind: 'ghost', title: what + 'をコピー' });
        if (l.email) row('メール', h('div', { class: 'ib-contact' }, h('span', { class: 'ib-sel' }, l.email), copyBtn(l.email, 'メールアドレス'), h('a', { href: 'mailto:' + l.email }, 'メールアプリで開く')));
        if (l.phone) row('電話', h('div', { class: 'ib-contact' }, h('span', { class: 'ib-sel' }, l.phone), copyBtn(l.phone, '電話番号'), h('a', { href: 'tel:' + l.phone.replace(/[^\d+]/g, '') }, '電話をかける')));
        if (!l.email && !l.phone) row('連絡先', h('span', { class: 'muted' }, 'まだありません。編集から入れられます。'));
        row('希望日時', l.preferredAt ? fmtWhen(l.preferredAt) : h('span', { class: 'muted' }, 'なし'));
        row('どこで知ったか', l.source || h('span', { class: 'muted' }, 'わからない'));
        row('受付方法', (CHANNEL[l.channel] || l.channel || '—') + (l.via ? '（' + l.via + '）' : ''));
        el.append(h('div', { class: 'ib-sec' }, dl));

        // すること
        const calSlot = h('span', { class: 'ib-calslot' });
        const drawCal = () => { Kit.clear(calSlot); const cur = getLead(id); if (cur && cur.meetingAt) calSlot.append(Kit.btn('カレンダーで見る', () => go('calendar', { date: cur.meetingAt.slice(0, 10) }), { icon: 'calendar' })); };
        drawCal();
        el.append(h('div', { class: 'btn-row ib-acts' },
          Kit.btn('返信文をつくる', () => openReply(id, redraw), { kind: 'primary', icon: 'mail' }),
          Kit.btn('見積書をつくる', () => go('invoice', { fromLead: id }), { icon: 'receipt' }),
          calSlot,
          Kit.btn('編集', () => openLeadForm(getLead(id), redraw), { icon: 'edit', kind: 'ghost' }),
          Kit.btn('', () => delLead(id, o.onDeleted), { icon: 'trash', kind: 'ghost', title: 'この問い合わせを消す' })));

        // 状態（押すとすぐ切りかわる）
        const steps = h('div', { class: 'ib-steps', role: 'group', 'aria-label': '状態を切りかえる' }, STATUS.map((s) => {
          const cur = l.status === s.v;
          const done = !cur && (s.v === 'new' || (s.v === 'replied' && reachedReply(l)) || (s.v === 'talking' && reachedTalk(l)));
          return h('button', {
            type: 'button', id: 'ib-step-' + s.v, class: 'ib-step st-' + s.v + (done ? ' done' : ''), 'aria-pressed': String(cur), title: cur ? 'いまの状態' : s.label + 'にする',
            onclick: async () => { if (cur) return; await changeStatus(id, s.v); redraw(); },
          }, done ? Kit.icon('check') : null, h('span', null, s.label));
        }));
        el.append(h('div', { class: 'ib-sec' }, h('h3', { class: 'ib-sec-h' }, '状態'), steps));

        // これから（見込み金額・次の連絡・予約）
        const vIn = h('input', { type: 'number', id: 'ib-d-value', min: '0', step: '1000', inputmode: 'numeric', placeholder: '0' });
        vIn.value = l.value ? String(l.value) : '';
        const vHint = h('span', null, l.value ? Kit.yen(l.value) : '成約したら、いくらになりそうか');
        vIn.addEventListener('input', () => { vHint.textContent = vIn.value ? Kit.yen(Math.max(0, +vIn.value || 0)) : '成約したら、いくらになりそうか'; });
        vIn.addEventListener('change', () => patchLead(id, (x) => { const v = Math.max(0, Math.round(+vIn.value || 0)); if (x.value === v) return false; x.value = v; }));
        const nIn = h('input', { type: 'date', id: 'ib-d-next' });
        nIn.value = l.nextAt || '';
        const nHint = h('span');
        const drawNHint = () => {
          const v = nIn.value, t = todayYmd();
          nHint.className = v && v < t ? 'ib-bad' : v === t ? 'ib-warn' : '';
          nHint.textContent = !v ? '決めておくと、一覧で知らせます' : v < t ? '連絡する日を過ぎています' : v === t ? '今日が連絡する日です' : Kit.fmtDate(v, 'M月D日(W)') + 'に連絡する';
        };
        drawNHint();
        const setNext = (v) => { nIn.value = v; drawNHint(); patchLead(id, (x) => { if (x.nextAt === v) return false; x.nextAt = v; }); };
        nIn.addEventListener('change', () => setNext(nIn.value));
        const quick = h('div', { class: 'ib-quick' }, [['明日', 1], ['3日後', 3], ['1週間後', 7]].map(([t, n]) => Kit.btn(t, () => setNext(Kit.rel(n)), { sm: true, kind: 'ghost' })), Kit.btn('なし', () => setNext(''), { sm: true, kind: 'ghost' }));
        const mIn = h('input', { type: 'datetime-local', id: 'ib-d-meet' });
        mIn.value = l.meetingAt || '';
        mIn.addEventListener('change', async () => { await patchLead(id, (x) => { if (x.meetingAt === mIn.value) return false; x.meetingAt = mIn.value; }); drawCal(); });
        el.append(h('div', { class: 'ib-sec' }, h('h3', { class: 'ib-sec-h' }, 'これから'), h('div', { class: 'ib-fields' },
          Kit.field({ label: '見込み金額（円）', input: vIn, hint: vHint }),
          h('div', { class: 'field' }, h('label', { for: 'ib-d-next' }, '次に連絡する日'), nIn, quick, h('div', { class: 'hint' }, nHint)),
          Kit.field({ label: '予約・商談の日時', input: mIn, hint: 'カレンダーに出ます' }))));

        // タグ
        const tagsBox = h('div', { class: 'ib-tags' });
        const tIn = h('input', { type: 'text', id: 'ib-d-tag', placeholder: '例：中学生', list: 'ib-tag-list', enterkeyhint: 'done', autocomplete: 'off' });
        const drawTags = () => {
          Kit.clear(tagsBox);
          const cur = getLead(id);
          for (const t of cur ? cur.tags : []) {
            tagsBox.append(h('span', { class: 'chip ib-tag' }, t, h('button', { type: 'button', title: t + ' を外す', 'aria-label': t + ' を外す', onclick: async () => { await patchLead(id, (x) => { x.tags = x.tags.filter((y) => y !== t); }); drawTags(); tIn.focus(); } }, Kit.icon('close'))));
          }
        };
        const addTag = async () => {
          const t = tIn.value.trim().replace(/^#/, '');
          if (!t) { tIn.focus(); return; }
          tIn.value = '';
          await patchLead(id, (x) => { if (x.tags.includes(t)) return false; x.tags.push(t); });
          drawTags();
          tIn.focus();
        };
        tIn.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); addTag(); } });
        drawTags();
        el.append(h('div', { class: 'ib-sec' }, h('h3', { class: 'ib-sec-h' }, 'タグ'), tagsBox,
          h('div', { class: 'ib-tagadd' }, vh('ib-d-tag', 'タグを足す'), tIn, Kit.btn('足す', addTag, { sm: true, icon: 'plus' }),
            h('datalist', { id: 'ib-tag-list' }, uniq(S.leads.flatMap((x) => x.tags)).map((t) => h('option', { value: t }))))));

        // メモと経過（新しい順）
        const noteIn = h('textarea', { id: 'ib-note-new', rows: 2, placeholder: '話したこと、次にやることなど' });
        const tl = h('ol', { class: 'ib-tl' });
        const drawTl = () => {
          Kit.clear(tl);
          const cur = getLead(id);
          if (!cur) return;
          for (const ev of timeline(cur)) {
            tl.append(h('li', { class: ev.sys ? 'sys' : null },
              h('div', { class: 'ib-tl-at' }, h('span', null, Kit.fmtDateTime(ev.at)), ev.note ? Kit.btn('', () => delNote(ev.note), { icon: 'trash', sm: true, kind: 'ghost', title: 'このメモを消す' }) : null),
              h('div', { class: 'ib-tl-text' }, ev.text)));
          }
        };
        const addNote = async () => {
          const t = noteIn.value.trim();
          if (!t) { noteIn.focus(); return; }
          await patchLead(id, (x) => { x.notes.push({ at: new Date().toISOString(), text: t }); });
          noteIn.value = '';
          drawTl();
          Kit.toast('メモを追加しました');
        };
        const delNote = async (n) => {
          await patchLead(id, (x) => { x.notes = x.notes.filter((y) => !(y.at === n.at && y.text === n.text)); });
          drawTl();
          Kit.toast('メモを消しました', { action: { label: 'もとに戻す', onClick: async () => { await patchLead(id, (x) => { x.notes.push(n); x.notes.sort((a, b) => String(a.at).localeCompare(String(b.at))); }); drawTl(); } } });
        };
        noteIn.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); addNote(); } });
        drawTl();
        el.append(h('div', { class: 'ib-sec' }, h('h3', { class: 'ib-sec-h' }, 'メモと経過'),
          h('div', { class: 'ib-noteadd' }, vh('ib-note-new', 'メモ'), noteIn, h('div', { class: 'btn-row' }, Kit.btn('メモを追加', addNote, { icon: 'plus', sm: true }))), tl));
        return el;
      }
      function timeline(l) {
        const ev = l.notes.map((n) => ({ at: n.at, text: n.text, note: n }));
        ev.push({ at: l.createdAt, text: '受付（' + (CHANNEL[l.channel] || '—') + (l.via ? '・' + l.via : '') + '）', sys: true });
        if (l.repliedAt) ev.push({ at: l.repliedAt, text: '返信済みにしました', sys: true });
        if (l.talkingAt) ev.push({ at: l.talkingAt, text: '商談中にしました', sys: true });
        if (l.closedAt && (l.status === 'won' || l.status === 'lost')) ev.push({ at: l.closedAt, text: l.status === 'won' ? '成約しました' : '見送りにしました', sys: true });
        return ev.sort((a, b) => String(b.at).localeCompare(String(a.at)));
      }
      async function delLead(id, after) {
        const l = getLead(id);
        if (!l) return;
        const ok = await Kit.confirm({ title: 'この問い合わせを消しますか', body: (l.name || 'この問い合わせ') + ' の内容とメモが消えます。もとに戻せません。', ok: '消す', danger: true });
        if (!ok || dead) return;
        writing++;
        try { await Kit.store.remove('leads', id); } finally { writing--; }
        S.leads = S.leads.filter((x) => x.id !== id);
        if (S.sel === id) S.sel = null;
        Kit.toast('消しました');
        if (after) after();
      }

      /* ───── 返信文をつくる ───── */
      function openReply(id, after) {
        const lead = getLead(id);
        if (!lead) return;
        const R = S.replies;
        const sign = () => R.sign || autoSign(S.profile);
        let used = '';
        const tSel = h('select', { id: 'ib-rp-tpl' }, R.items.map((t) => h('option', { value: t.id }, t.title || '（名前なし）')));
        const subj = h('input', { type: 'text', id: 'ib-rp-subj' });
        const body = h('textarea', { id: 'ib-rp-body', class: 'ib-rp-body', rows: 14 });
        const warn = h('p', { class: 'small ib-rp-warn', hidden: true }, Kit.icon('warn'), h('span', null, '〇 のところを書きかえてから送ってください。'));
        const check = () => { warn.hidden = !/〇/.test(body.value); };
        const fill = () => {
          const t = R.items.find((x) => x.id === tSel.value);
          used = t ? t.title : '';
          body.value = t ? fillTpl(t.body, lead, S.profile, sign()) : (lead.name ? lead.name + ' 様\n\n\n\n' : '') + sign();
          check();
        };
        subj.value = '【' + (S.profile.name || 'お問い合わせ') + '】お問い合わせの件' + (lead.kind ? '（' + lead.kind + '）' : '');
        tSel.addEventListener('change', fill);
        body.addEventListener('input', check);
        const aiBtn = Kit.ai.button('AIで返信の下書き', async () => {
          const ctx = await Kit.ai.context();
          const memo = lead.notes.map((n) => '・' + n.text).join('\n');
          const prompt = ctx + '\n\nあなたは上の事業の代表者' + (S.profile.owner ? '（' + S.profile.owner + '）' : '') + 'です。次のお問い合わせに返すメールの本文を書いてください。\n\n【お問い合わせ】\nお名前：' + (lead.name || '不明') + '\nご用件：' + (lead.kind || 'なし') + '\n希望日時：' + (fmtLetter(lead.preferredAt) || 'なし') + '\n内容：\n' + (lead.message || '（なし）') +
            (memo ? '\n\n【これまでのメモ】\n' + memo : '') +
            '\n\n【書き方】\n・最初の行は「' + (lead.name || '〇〇') + ' 様」\n・ていねいで温かい、やさしいことばで。300〜500字ほど\n・決まっていない日時・金額・URLは作らず「〇〇」と書く\n・署名は書かない（あとで付けます）\n・本文だけを書く（件名や説明はいらない）';
          used = 'AIの下書き';
          body.value = '';
          const text = await Kit.ai.ask(prompt, { onText: ({ text }) => { body.value = text; } });
          body.value = String(text || body.value).trim() + (sign() ? '\n\n' + sign() : '');
          check();
        }, { sm: true });
        const mail = h('a', { href: 'mailto:' + lead.email, class: 'small' }, 'メールアプリで開く');
        mail.addEventListener('click', () => { mail.href = 'mailto:' + lead.email + '?subject=' + encodeURIComponent(subj.value) + '&body=' + encodeURIComponent(body.value); });
        const content = h('div', { class: 'stack' },
          R.items.length
            ? h('div', { class: 'row', style: { alignItems: 'flex-end' } }, h('div', { class: 'grow', style: { flex: '1 1 240px' } }, Kit.field({ label: 'テンプレート', input: tSel })), aiBtn)
            : h('div', { class: 'row' }, h('p', { class: 'small muted grow' }, '返信テンプレートがありません。返信テンプレートのタブで作れます。'), aiBtn),
          lead.email
            ? h('div', { class: 'field' }, h('label', null, '宛先'), h('div', { class: 'ib-contact' }, h('span', { class: 'ib-sel' }, lead.email), Kit.btn('', () => Kit.copy(lead.email, 'メールアドレスをコピーしました'), { icon: 'copy', sm: true, kind: 'ghost', title: 'メールアドレスをコピー' })))
            : h('p', { class: 'small muted' }, 'メールアドレスがありません。電話やSNSで返すときは、本文をコピーして使ってください。'),
          h('div', { class: 'field' }, h('label', { for: 'ib-rp-subj' }, '件名'), h('div', { class: 'ib-inline' }, subj, Kit.btn('', () => Kit.copy(subj.value, '件名をコピーしました'), { icon: 'copy', title: '件名をコピー' }))),
          h('div', { class: 'field' }, h('label', { for: 'ib-rp-body' }, '本文（このまま書きかえられます）'), body),
          warn,
          h('div', { class: 'btn-row' }, Kit.btn('本文をコピー', () => Kit.copy(body.value, '本文をコピーしました'), { kind: 'primary', icon: 'copy' }), lead.email ? mail : null));
        const acts = [{ label: '閉じる', kind: 'ghost' }];
        if (lead.status === 'new') {
          acts.push({ label: '返信済みにする', onClick: async () => {
            const now = new Date().toISOString();
            await patchLead(id, (x) => { applyStatus(x, 'replied', now); x.notes.push({ at: now, text: '返信しました' + (used ? '（' + used + '）' : '') }); });
            Kit.toast('返信済みにしました');
            if (after) after();
          } });
        }
        modal({ title: '返信文をつくる', wide: true, body: content, actions: acts });
        fill();
      }

      /* ───── 問い合わせを記録・直す ───── */
      function openLeadForm(existing, after) {
        const ed = existing ? Kit.clone(existing) : null;
        const isManual = !ed || ed.channel === 'manual';
        const via = h('select', { id: 'ib-m-via' }, VIA.map((v) => h('option', { value: v }, v)));
        via.value = ed ? (ed.via && VIA.includes(ed.via) ? ed.via : 'その他') : '電話';
        const day = h('input', { type: 'date', id: 'ib-m-day' });
        day.value = ed ? localYmd(ed.createdAt) : todayYmd();
        const name = h('input', { type: 'text', id: 'ib-m-name', autocomplete: 'off', placeholder: '例：山田 さくら' });
        const email = h('input', { type: 'email', id: 'ib-m-email', autocomplete: 'off', placeholder: 'name@example.com' });
        const phone = h('input', { type: 'tel', id: 'ib-m-phone', autocomplete: 'off', placeholder: '090-0000-0000' });
        const kinds = uniq(S.form.kinds.concat(ed ? [ed.kind] : []));
        const kind = h('select', { id: 'ib-m-kind' }, h('option', { value: '' }, '（選ばない）'), kinds.map((k) => h('option', { value: k }, k)));
        const msg = h('textarea', { id: 'ib-m-msg', rows: 4, placeholder: '聞いたこと、相手の希望など' });
        const pd = h('input', { type: 'date', id: 'ib-m-pd' });
        const pt = h('input', { type: 'time', id: 'ib-m-pt' });
        const sources = uniq(S.form.sources.concat(ed ? [ed.source] : []));
        const src = h('select', { id: 'ib-m-src' }, h('option', { value: '' }, 'わからない'), sources.map((s) => h('option', { value: s }, s)));
        const st = h('select', { id: 'ib-m-st' }, STATUS.map((s) => h('option', { value: s.v }, s.label)));
        if (ed) {
          name.value = ed.name; email.value = ed.email; phone.value = ed.phone; kind.value = ed.kind; msg.value = ed.message; src.value = ed.source;
          if (ed.preferredAt) { pd.value = ed.preferredAt.slice(0, 10); pt.value = (ed.preferredAt.split('T')[1] || '').slice(0, 5); }
        } else kind.value = kinds[0] || '';
        const body = h('div', { class: 'stack' },
          h('div', { class: 'grid cols-2' }, isManual ? Kit.field({ label: '受けた方法', input: via }) : null, Kit.field({ label: '受けた日', input: day })),
          Kit.field({ label: 'お名前（必須）', input: name, hint: 'わからなければ、SNSの名前などでもかまいません' }),
          h('div', { class: 'grid cols-2' }, Kit.field({ label: 'メール', input: email }), Kit.field({ label: '電話', input: phone })),
          Kit.field({ label: 'ご用件', input: kind }),
          Kit.field({ label: '内容', input: msg }),
          h('div', { class: 'grid cols-2' }, Kit.field({ label: '希望の日', input: pd }), Kit.field({ label: '希望の時刻（任意）', input: pt })),
          h('div', { class: 'grid cols-2' }, Kit.field({ label: 'どこで知ったか', input: src }), ed ? null : Kit.field({ label: '状態', input: st })));
        modal({
          title: ed ? '問い合わせを直す' : '問い合わせを記録', wide: true, body,
          actions: [{ label: 'やめる', kind: 'ghost' }, {
            label: ed ? '保存する' : '記録する', kind: 'primary', onClick: async () => {
              const nm = name.value.trim(), em = email.value.trim();
              if (!nm) { Kit.toast('お名前を入れてください', { type: 'bad' }); name.focus(); return false; }
              if (em && !/^[^@\s]+@[^@\s]+$/.test(em)) { Kit.toast('メールアドレスの形を確かめてください', { type: 'bad' }); email.focus(); return false; }
              const base = ed || { status: 'new', value: 0, tags: [], notes: [], nextAt: '', meetingAt: '', channel: 'manual' };
              const l = Object.assign(Kit.clone(base), { name: nm, email: em, phone: phone.value.trim(), kind: kind.value, message: msg.value.trim(), preferredAt: pd.value ? pd.value + (pt.value ? 'T' + pt.value : '') : '', source: src.value });
              if (isManual) l.via = via.value;
              const d = day.value || todayYmd();
              if (!ed || localYmd(ed.createdAt) !== d) {
                const t = ed ? new Date(ed.createdAt) : new Date();
                const nd = Kit.parseYmd(d);
                nd.setHours(t.getHours(), t.getMinutes(), t.getSeconds());
                l.createdAt = nd.toISOString();
              }
              if (!ed && st.value !== 'new') applyStatus(l, st.value, new Date().toISOString());
              const saved = await saveLead(l);
              Kit.toast(ed ? '保存しました' : '記録しました');
              if (ed) { if (after) after(); }
              else showLead(saved.id);
              return true;
            },
          }],
        });
      }
      // 記録したものを受付箱で開く
      function showLead(id) {
        S.filter = 'all';
        S.q = '';
        if (S.tab !== 'inbox') { S.tab = 'inbox'; Kit.pref.set('inbox:tab', 'inbox'); renderTabs(); }
        S.sel = id;
        if (S.view === 'flow') { renderPanel(); return; }
        openOnPhone = true;
        renderPanel();
      }

      /* ───── まとめて取り込む ───── */
      function planImport(rows, map) {
        const seen = new Set(S.leads.map(dupKey).filter((k) => k !== '|'));
        const items = [], add = [];
        let dup = 0, empty = 0;
        for (const r of rows) {
          const l = rowToLead(r, map);
          if (!l.name && !l.email && !l.message && !l.phone) { empty++; items.push({ l, skip: '空の行' }); continue; }
          const k = dupKey(l);
          if (k !== '|' && seen.has(k)) { dup++; items.push({ l, skip: '重複のため飛ばす' }); continue; }
          if (k !== '|') seen.add(k);
          items.push({ l });
          add.push(l);
        }
        return { items, add, dup, empty };
      }
      function openImport() {
        let table = null, map = {};
        const ta = h('textarea', { id: 'ib-imp-text', rows: 5, spellcheck: 'false', placeholder: 'Googleフォームやスプレッドシートの表を、見出しの行ごとコピーして貼り付けます' });
        const file = h('input', { type: 'file', id: 'ib-imp-file', class: 'ib-file', accept: '.csv,.tsv,.txt,text/csv,text/tab-separated-values,text/plain' });
        const fileName = h('span', { class: 'small muted' });
        const fileBtn = Kit.btn('CSVファイルを選ぶ', () => file.click(), { icon: 'upload' });
        const hdr = h('input', { type: 'checkbox', id: 'ib-imp-hdr', checked: true });
        const out = h('div', { class: 'stack' });
        let okBtn = null;
        const updateOk = (n) => { if (!okBtn) return; okBtn.disabled = !n; okBtn.textContent = n ? n + '件を取り込む' : '取り込む'; };
        const header = () => (hdr.checked ? table[0] : table[0].map((_, i) => '列' + (i + 1)));
        const rows = () => (hdr.checked ? table.slice(1) : table);
        const setRows = (r) => {
          if (!r.length) { table = null; draw(); return; }
          const w = Math.max(...r.map((x) => x.length));
          table = r.map((x) => { const y = x.slice(); while (y.length < w) y.push(''); return y; });
          map = hdr.checked ? autoMap(table[0]) : {};
          draw();
        };
        const draw = () => {
          Kit.clear(out);
          if (!table) { updateOk(0); return; }
          const hd = header();
          const mapBox = h('div', { class: 'ib-map' }, MAP_FIELDS.map((f) => {
            const s = h('select', { id: 'ib-map-' + f.k }, h('option', { value: '' }, '（使わない）'), hd.map((x, i) => h('option', { value: String(i) }, colName(i) + '列：' + (String(x).trim() || '（見出しなし）').slice(0, 30))));
            s.value = map[f.k] != null ? String(map[f.k]) : '';
            s.addEventListener('change', () => { if (s.value === '') delete map[f.k]; else map[f.k] = +s.value; drawPreview(); });
            return Kit.field({ label: f.label, input: s });
          }));
          const pv = h('div', { class: 'stack tight' });
          out.append(h('div', { class: 'ib-sec-h' }, '列の対応（見出しの名前から当てています。違っていたら直してください）'), mapBox, pv);
          const drawPreview = () => {
            const res = planImport(rows(), map);
            Kit.clear(pv);
            const cut = (s, n) => (s.length > n ? s.slice(0, n) + '…' : s);
            pv.append(h('div', { class: 'ib-sec-h' }, 'はじめの5行'),
              h('div', { class: 'tbl-wrap' }, h('table', { class: 'tbl ib-imp' },
                h('thead', null, h('tr', null, ['受付日時', 'お名前', 'メール', 'ご用件', '内容', 'どこで知ったか', '取り込み'].map((t) => h('th', null, t)))),
                h('tbody', null, res.items.slice(0, 5).map((it) => h('tr', { class: it.skip ? 'is-skip' : null },
                  h('td', null, it.l.createdAt ? fmtStamp(it.l.createdAt) : '（今の日時）'), h('td', null, it.l.name), h('td', null, it.l.email), h('td', null, it.l.kind), h('td', { title: it.l.message }, cut(it.l.message.replace(/\s+/g, ' '), 40)), h('td', null, it.l.source),
                  h('td', null, it.skip ? it.skip : '取り込む')))))),
              h('p', { class: 'small ink-2' }, '全部で' + res.items.length + '行。取り込むのは' + res.add.length + '件です。' + (res.dup ? '同じメールで同じ内容の' + res.dup + '件は、重複として飛ばします。' : '') + (res.empty ? '空の行（' + res.empty + '行）も飛ばします。' : '')));
            updateOk(res.add.length);
          };
          drawPreview();
        };
        ta.addEventListener('input', Kit.debounce(() => setRows(parseTable(ta.value)), 250));
        hdr.addEventListener('change', () => { if (table) { map = hdr.checked ? autoMap(table[0]) : {}; draw(); } });
        file.addEventListener('change', async () => {
          const fl = file.files && file.files[0];
          if (!fl) return;
          try {
            const text = await readText(fl);
            ta.value = text.length <= 100000 ? text : '';
            fileName.textContent = fl.name;
            setRows(parseTable(text));
          } catch (e) { Kit.toast('ファイルを読めませんでした。CSVファイルか確かめてください', { type: 'bad' }); }
          file.value = '';
        });

        // スプレッドシートから直接（手元のブラウザで開いたときだけ。Artifact ではほかのサイトにつなげない）
        const gasUrl = S.form.delivery.type === 'gas' ? S.form.delivery.url : '';
        const tokenIn = h('input', { type: 'password', id: 'ib-imp-token', autocomplete: 'off', placeholder: 'スクリプトの TOKEN に書いた合言葉' });
        tokenIn.value = Kit.pref.get('inbox:gasToken', '');
        const gasBox = h('details', { class: 'help local-only' }, h('summary', null, 'スプレッドシートから取り込む'),
          gasUrl
            ? h('div', { class: 'stack', style: { marginTop: '10px' } },
              Kit.field({ label: '合言葉', input: tokenIn, hint: 'この端末にだけ覚えておきます' }),
              h('div', { class: 'btn-row' }, Kit.btn('スプレッドシートから読み込む', async () => {
                const tok = tokenIn.value.trim();
                if (!tok) { Kit.toast('合言葉を入れてください', { type: 'bad' }); tokenIn.focus(); return; }
                let data = null;
                try {
                  const res = await fetch(gasUrl + (gasUrl.includes('?') ? '&' : '?') + 'token=' + encodeURIComponent(tok));
                  const txt = await res.text();
                  try { data = JSON.parse(txt); } catch (e) { data = null; }
                  if (!data) { Kit.toast('合言葉が違うか、スクリプトが古いようです。スクリプトの TOKEN と同じ合言葉を入れてください', { type: 'bad', ms: 7000 }); return; }
                } catch (e) { Kit.toast('読み込めませんでした。ネットにつながっているか、URLが合っているかを確かめてください', { type: 'bad', ms: 7000 }); return; }
                if (!data.ok || !Array.isArray(data.rows)) { Kit.toast('一覧を受け取れませんでした', { type: 'bad' }); return; }
                Kit.pref.set('inbox:gasToken', tok);
                hdr.checked = true;
                setRows([data.header || []].concat(data.rows));
                fileName.textContent = 'スプレッドシートから' + data.rows.length + '行';
              }, { icon: 'refresh' })))
            : h('p', { class: 'small muted', style: { marginTop: '8px' } }, 'フォームの送信先を、Googleスプレッドシートに貯める にすると、ここから直接読み込めます。'));

        const body = h('div', { class: 'stack' },
          h('p', { class: 'small ink-2' }, 'Googleフォーム・スプレッドシート・Formspree などから書き出した表を、まとめて受付箱に入れます。同じメールで同じ内容のものは、重複として飛ばします。'),
          h('div', { class: 'row' }, fileBtn, fileName, file),
          Kit.field({ label: 'または、表を貼り付ける', input: ta }),
          h('label', { class: 'check', for: 'ib-imp-hdr' }, hdr, '1行目は見出し'),
          gasBox, out);
        const m = modal({
          title: 'まとめて取り込む', wide: true, body,
          actions: [{ label: 'やめる', kind: 'ghost' }, {
            label: '取り込む', kind: 'primary', onClick: async () => {
              if (!table) return false;
              const res = planImport(rows(), map);
              if (!res.add.length) { Kit.toast('取り込めるものがありません', { type: 'bad' }); return false; }
              await doImport(res);
              return true;
            },
          }],
        });
        okBtn = m.el.querySelector('.modal-f .btn.primary');
        updateOk(0);
        setTimeout(() => fileBtn.focus(), 60);
      }
      async function doImport(res) {
        bulk = true;
        writing++;
        try { for (const l of res.add) await Kit.store.put('leads', l); }
        finally { bulk = false; writing--; }
        await loadLeads();
        S.filter = 'all';
        S.q = '';
        S.sel = null;
        if (S.tab !== 'inbox') { S.tab = 'inbox'; Kit.pref.set('inbox:tab', 'inbox'); }
        renderTabs();
        renderSampleBar();
        renderPanel();
        Kit.toast(res.add.length + '件を取り込みました' + (res.dup ? '（重複の' + res.dup + '件は飛ばしました）' : ''));
      }

      /* ───── CSV で書き出す ───── */
      async function exportCsv() {
        const rows = [['受付日時', '状態', 'お名前', 'メール', '電話', 'ご用件', '内容', '希望日時', 'どこで知ったか', '見込み金額', '次に連絡する日', '予約・商談の日時', 'タグ', 'メモ', '受付方法']];
        const arr = S.leads.slice().sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
        for (const l of arr) {
          rows.push([fmtStamp(l.createdAt), ST[l.status].label, l.name, l.email, l.phone, l.kind, l.message, l.preferredAt.replace('T', ' '), l.source, l.value || '', l.nextAt, l.meetingAt.replace('T', ' '), l.tags.join(' '),
            l.notes.map((n) => fmtStamp(n.at) + ' ' + n.text).join('\n'), (CHANNEL[l.channel] || l.channel) + (l.via ? '（' + l.via + '）' : '')]);
        }
        const ok = await Kit.download('leads-' + todayYmd() + '.csv', Kit.csv(rows));
        if (ok) Kit.toast(arr.length + '件をCSVで書き出しました');
      }

      /* ───── フォーム設定 ───── */
      function formPreview(f) {
        const box = h('div', { class: 'ib-fp' });
        box.append(h('div', { class: 'ib-fp-title' }, f.title || 'お問い合わせ'), f.lead ? h('p', { class: 'ib-fp-lead' }, f.lead) : null);
        if (f.delivery.type === 'google') {
          box.append(h('div', { class: 'btn-row' }, f.delivery.url
            ? h('a', { class: 'btn primary', href: f.delivery.url, target: '_blank', rel: 'noopener' }, Kit.icon('external'), h('span', null, 'フォームを開いて問い合わせる'))
            : h('span', { class: 'btn primary', 'aria-disabled': 'true' }, 'フォームを開いて問い合わせる')),
          h('p', { class: 'small muted' }, 'Googleフォームに移って書いてもらいます。'));
          return box;
        }
        const req = () => h('span', { class: 'ib-fp-req' }, '必須');
        const fld = (label, input, id, must) => h('div', { class: 'field' }, h('label', { for: id }, label, must ? req() : null), input);
        const form = h('form', { class: 'stack', novalidate: true });
        if (f.kinds.length) form.append(fld('ご用件', h('select', { id: 'ib-fp-kind' }, f.kinds.map((k) => h('option', null, k))), 'ib-fp-kind'));
        form.append(fld('お名前', h('input', { type: 'text', id: 'ib-fp-name', autocomplete: 'off' }), 'ib-fp-name', true));
        form.append(fld('メールアドレス', h('input', { type: 'email', id: 'ib-fp-email', autocomplete: 'off' }), 'ib-fp-email', true));
        if (f.fields.phone) form.append(fld('電話番号', h('input', { type: 'tel', id: 'ib-fp-phone', autocomplete: 'off' }), 'ib-fp-phone'));
        if (f.fields.date) form.append(fld('ご希望の日時', h('input', { type: 'datetime-local', id: 'ib-fp-date' }), 'ib-fp-date'));
        if (f.fields.source && f.sources.length) form.append(fld('どこで知りましたか', h('select', { id: 'ib-fp-source' }, h('option', { value: '' }, '選んでください'), f.sources.map((s) => h('option', null, s))), 'ib-fp-source'));
        form.append(fld('お問い合わせ内容', h('textarea', { id: 'ib-fp-msg', rows: 4 }), 'ib-fp-msg', true));
        if (f.privacy) form.append(h('p', { class: 'ib-fp-privacy' }, f.privacy));
        form.append(h('div', null, h('button', { type: 'submit', class: 'btn primary' }, Kit.icon('send'), h('span', null, '送信する'))));
        const thanks = h('div', { class: 'stack', hidden: true }, h('div', { class: 'ib-fp-thanks', role: 'status' }, f.thanks || '送信しました。'), h('div', null, Kit.btn('フォームにもどす', () => { thanks.hidden = true; form.hidden = false; }, { sm: true, kind: 'ghost' })));
        form.addEventListener('submit', (e) => { e.preventDefault(); form.hidden = true; thanks.hidden = false; });
        box.append(form, thanks);
        return box;
      }
      // ホームページの画像（ロゴなど）。書き出しとプレビューで使う
      async function siteImages() {
        if (!S.images) {
          const T = window.SiteRender && window.SiteRender.tools;
          try { S.images = T && typeof T.imagesMap === 'function' ? T.imagesMap(await Kit.store.list('images')) : {}; } catch (e) { S.images = {}; }
        }
        return S.images;
      }
      // プレビューで試しに送られた問い合わせを、受付箱に入れる（ホームページの画面と同じ扱い）
      async function receiveDemo(d) {
        const T = window.SiteRender && window.SiteRender.tools;
        if (T && typeof T.receiveInquiry === 'function') { await T.receiveInquiry(d); return; }
        d = d && typeof d === 'object' ? d : {};
        const s = (v, n) => String(v == null ? '' : v).trim().slice(0, n);
        const date = s(d.date, 16);
        await Kit.store.put('leads', normLead({ name: s(d.name, 80) || '（お名前なし）', email: s(d.email, 120), phone: s(d.phone, 40), kind: s(d.kind, 80), message: s(d.message, 5000),
          preferredAt: /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/.test(date) ? date : '', source: s(d.source, 60), channel: 'site-demo' }));
        Kit.toast('受付箱に届きました（試し送信）');
      }
      let frameEl = null;
      const onFrameMsg = (e) => {
        if (!frameEl || e.source !== frameEl.contentWindow) return;
        const m = e.data;
        if (m && typeof m === 'object' && m.type === 'mise:inquiry') receiveDemo(m.data);
      };
      window.addEventListener('message', onFrameMsg);
      async function exportFormPage() {
        if (!hasFormPage()) return;
        let html = '';
        const images = await siteImages();
        try { html = window.SiteRender.formPage(cleanForm(S.form), S.profile, S.site || undefined, { mode: 'export', images }); }
        catch (e) { Kit.toast('フォームのページを作れませんでした', { type: 'bad' }); return; }
        const ok = await Kit.download('form.html', html);
        if (ok) Kit.toast('form.html を書き出しました');
      }
      function openGasHelp() {
        const code = h('pre', { class: 'ib-code', id: 'ib-gas-code', tabindex: '0', 'aria-label': 'スクリプト（inquiry.gs）' }, GAS_SCRIPT);
        const body = h('div', { class: 'stack' },
          h('p', { class: 'small ink-2' }, '無料のGoogleアカウントで使えます。10分ほどで終わります。'),
          h('ol', { class: 'ib-howto' }, [
            'Googleスプレッドシートを新しく作ります（名前は自由。例：お問い合わせ）。',
            'メニューの「拡張機能」から「Apps Script」を開きます。',
            'はじめから書いてある文字をすべて消して、下のスクリプトを貼り付けます。',
            'スクリプトの上のほうにある NOTIFY_EMAIL に知らせを受け取るメールアドレスを、TOKEN に自分だけの合言葉（8文字以上）を書いて、保存します。',
            '右上の「デプロイ」から「新しいデプロイ」を選び、種類の歯車から「ウェブアプリ」を選びます。',
            '次のユーザーとして実行は「自分」、アクセスできるユーザーは「全員」にして、「デプロイ」を押します。',
            '許可を求められたら、自分のアカウントを選んで許可します。「Google はこのアプリを確認していません」と出たら、「詳細」から「（プロジェクト名）に移動」を選びます。',
            '出てきた「ウェブアプリのURL」（/exec で終わるもの）をコピーして、この画面の「ウェブアプリのURL」に貼ります。',
          ].map((t) => h('li', null, t))),
          h('div', { class: 'row between' }, h('strong', { class: 'small' }, 'スクリプト（inquiry.gs）'), Kit.btn('スクリプトをコピー', () => Kit.copy(GAS_SCRIPT, 'スクリプトをコピーしました'), { icon: 'copy', sm: true, kind: 'primary' })),
          code,
          h('details', { class: 'help' }, h('summary', null, 'うまくいかないとき'), h('ul', null, [
            '届いたかどうかは、スプレッドシートの「お問い合わせ」シートで確かめられます。',
            'メールが来ないときは、NOTIFY_EMAIL のつづりと、迷惑メールのフォルダを確かめてください。',
            'スクリプトを直したときは「デプロイを管理」から鉛筆の印を押し、バージョンを「新バージョン」にしてデプロイします。URLは変わりません。',
            '受付箱にまとめて入れるときは、スプレッドシートの「ファイル」→「ダウンロード」→「カンマ区切り形式（.csv）」で保存して、受付箱の「まとめて取り込む」から入れます。',
          ].map((t) => h('li', null, t)))));
        modal({ title: 'Googleスプレッドシートに貯める設定', wide: true, body, actions: [{ label: '閉じる', kind: 'ghost' }] });
      }

      function renderForm(host) {
        const f = S.form;
        let pvHost = null;
        const drawPv = async () => {
          if (!pvHost || dead) return;
          const cf = cleanForm(f);
          if (hasFormPage() && S.pv === 'site') {
            const images = await siteImages();
            if (!pvHost || dead) return;
            let html = '';
            try { html = window.SiteRender.formPage(cf, S.profile, S.site || undefined, { mode: 'preview', images }); }
            catch (e) { Kit.clear(pvHost); frameEl = null; pvHost.append(h('p', { class: 'small ib-bad' }, 'ホームページの見た目を作れませんでした。かんたん表示で確かめてください。')); return; }
            if (frameEl && pvHost.contains(frameEl)) { frameEl.srcdoc = html; return; }
            Kit.clear(pvHost);
            frameEl = h('iframe', { class: 'ib-frame', title: 'フォームの見え方（ホームページの見た目）', srcdoc: html, sandbox: 'allow-scripts allow-forms allow-popups' });
            pvHost.append(frameEl, h('p', { class: 'small muted', style: { marginTop: '8px' } }, 'ここで送信すると、試しの問い合わせとして受付箱に入ります。'));
          } else { Kit.clear(pvHost); frameEl = null; pvHost.append(formPreview(cf)); }
        };
        const pvLater = Kit.debounce(drawPv, 400);
        const changed = () => { pvLater(); saveForm(); };
        const card = (title, ...kids) => h('section', { class: 'card stack' }, h('h2', { class: 'ib-sec-h', style: { fontSize: '14px', color: 'var(--ink)' } }, title), ...kids);

        // 見出しと説明
        const title = h('input', { type: 'text', id: 'ib-f-title', placeholder: '例：お問い合わせ・ご予約' });
        title.value = f.title;
        title.addEventListener('input', () => { f.title = title.value; changed(); });
        const lead = h('textarea', { id: 'ib-f-lead', rows: 3, placeholder: 'どんなことを送ってほしいか、いつごろお返事するか' });
        lead.value = f.lead;
        lead.addEventListener('input', () => { f.lead = lead.value; changed(); });

        // 入力する欄
        const srcBox = h('div', { class: 'stack tight', hidden: !f.fields.source },
          h('div', { class: 'small ink-2' }, 'どこで知ったかの選択肢'),
          optEditor(f.sources, { id: 'ib-f-src', label: 'どこで知ったか', placeholder: '例：駅前のチラシ', addLabel: '選択肢を足す', onChange: changed }));
        const chk = (key, label, hint) => {
          const c = h('input', { type: 'checkbox', id: 'ib-f-' + key, checked: !!f.fields[key] });
          c.addEventListener('change', () => { f.fields[key] = c.checked; if (key === 'source') srcBox.hidden = !c.checked; changed(); });
          return h('label', { class: 'ib-check', for: 'ib-f-' + key }, c, h('span', null, label, hint ? h('span', { class: 'small muted' }, '　' + hint) : null));
        };

        // 送信のあと
        const thanks = h('textarea', { id: 'ib-f-thanks', rows: 3 });
        thanks.value = f.thanks;
        thanks.addEventListener('input', () => { f.thanks = thanks.value; changed(); });
        const privacy = h('textarea', { id: 'ib-f-privacy', rows: 3 });
        privacy.value = f.privacy;
        privacy.addEventListener('input', () => { f.privacy = privacy.value; changed(); });

        // 送信先
        const dvBox = h('div', { class: 'ib-dv', role: 'radiogroup', 'aria-label': '送信先' });
        const dvMore = (d) => {
          const box = h('div', { class: 'ib-dv-more' });
          if (d.warn) box.append(h('div', { class: 'ib-dv-warn', role: 'note' }, Kit.icon('warn'), h('span', null, d.warn)));
          if (d.v === 'mailto') {
            const to = h('input', { type: 'email', id: 'ib-dv-to', placeholder: 'you@example.com', autocomplete: 'off' });
            to.value = f.delivery.to || '';
            const hint = h('span');
            const test = () => { const v = to.value.trim(); hint.className = !v || !EMAIL_RE.test(v) ? 'ib-bad' : 'ib-ok'; hint.textContent = !v ? '受け取るメールアドレスを入れてください' : EMAIL_RE.test(v) ? 'このアドレスあてに届きます' : 'メールアドレスの形を確かめてください'; };
            to.addEventListener('input', () => { f.delivery.to = to.value.trim(); test(); changed(); });
            test();
            box.append(Kit.field({ label: '受け取るメールアドレス', input: to, hint }));
          }
          if (URL_FIELD[d.v]) {
            const u = h('input', { type: 'url', id: 'ib-dv-url-' + d.v, placeholder: URL_FIELD[d.v].ph, inputmode: 'url', autocomplete: 'off', spellcheck: 'false' });
            u.value = f.delivery.url || '';
            const hint = h('span');
            const test = () => { const r = checkUrl(d.v, u.value.trim()); hint.className = r.ok ? 'ib-ok' : r.empty ? '' : 'ib-bad'; hint.textContent = r.msg; };
            u.addEventListener('input', () => { const v = u.value.trim(); f.delivery.url = v; f.delivery.urls[d.v] = v; test(); changed(); });
            test();
            box.append(Kit.field({ label: URL_FIELD[d.v].label, input: u, hint }));
            if (d.v === 'gas') box.append(h('div', { class: 'btn-row' }, Kit.btn('設定のしかた', openGasHelp, { icon: 'info' }), Kit.btn('スクリプトをコピー', () => Kit.copy(GAS_SCRIPT, 'スクリプトをコピーしました'), { icon: 'copy', kind: 'ghost' })));
          }
          if (d.note) box.append(h('p', { class: 'small muted' }, d.note));
          if (d.inbox) box.append(h('p', { class: 'small ink-2' }, h('strong', null, '受付箱に入れるには：'), d.inbox));
          return box;
        };
        const drawDv = () => {
          Kit.clear(dvBox);
          for (const d of DELIVERY) {
            const on = f.delivery.type === d.v;
            const r = h('input', { type: 'radio', name: 'ib-dv', id: 'ib-dv-' + d.v, value: d.v, checked: on });
            r.addEventListener('change', () => { if (r.checked) setType(d.v); });
            const item = h('div', { class: 'ib-dv-item' + (on ? ' is-on' : '') },
              h('label', { class: 'ib-dv-opt', for: 'ib-dv-' + d.v }, r, h('span', { class: 'ib-dv-t' }, d.label, d.badge ? h('span', { class: 'chip blue' }, d.badge) : null), h('span', { class: 'ib-dv-d' }, d.desc)));
            if (on) item.append(dvMore(d));
            dvBox.append(item);
          }
        };
        const setType = (v) => {
          f.delivery.type = v;
          f.delivery.url = f.delivery.urls[v] || '';
          if (v === 'mailto' && !f.delivery.to) f.delivery.to = S.profile.email || '';
          drawDv();
          changed();
          const r = dvBox.querySelector('#ib-dv-' + v);
          if (r) r.focus();
        };
        drawDv();

        const left = h('div', { class: 'stack' },
          h('div', { class: 'row between' }, h('span', { class: 'ib-saved', 'aria-live': 'polite' }, '書きかえると、自動で保存します'), h('a', { href: '#ib-preview', class: 'small ib-jump', onclick: (e) => { e.preventDefault(); const p = Kit.$('#ib-preview'); if (p) p.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); } }, '見え方を確かめる')),
          f._sample ? h('p', { class: 'small ink-2' }, sampleChip(), '　例のフォームです。自分の事業に合わせて書きかえてください。') : null,
          card('見出しと説明', Kit.field({ label: '見出し', input: title }), Kit.field({ label: '説明', input: lead, hint: '返事までの目安を書いておくと、送る人が安心します' })),
          card('ご用件の選択肢', h('p', { class: 'small muted' }, 'フォームのいちばん上で選んでもらいます。なくしてもかまいません。'), optEditor(f.kinds, { id: 'ib-f-kind', label: 'ご用件', placeholder: '例：体験の予約', addLabel: 'ご用件を足す', onChange: changed })),
          card('入力する欄',
            h('div', { class: 'ib-checks' },
              h('div', { class: 'ib-check fixed' }, Kit.icon('check'), h('span', null, 'お名前・メールアドレス・お問い合わせ内容', h('span', { class: 'small' }, '　いつも出ます'))),
              chk('phone', '電話番号', '任意で書いてもらう'),
              chk('date', 'ご希望の日時', '予約や相談の日を聞く'),
              chk('source', 'どこで知りましたか', '分析に使えます')),
            srcBox),
          card('送信のあと', Kit.field({ label: '送信したあとに出すことば', input: thanks }), Kit.field({ label: '個人情報の扱い', input: privacy, hint: '送信ボタンの上に小さく出ます' })),
          card('送信先', h('p', { class: 'small muted' }, 'ホームページのフォームに書かれた内容を、どこで受け取るかを決めます。'), dvBox),
          h('div', { class: 'stack tight' },
            h('div', { class: 'btn-row' },
              Kit.btn('ホームページで確認', () => go('site'), { icon: 'globe' }),
              Kit.btn('フォームだけのページを書き出す', exportFormPage, { icon: 'download', disabled: !hasFormPage() })),
            h('p', { class: 'small muted' }, hasFormPage()
              ? 'フォームだけのページ（form.html）は、ホームページとは別に置いたり、SNSのプロフィールからつないだりできます。'
              : 'フォームだけのページの書き出しは、ホームページの部品が読み込まれると使えます。')));
        pvHost = h('div');
        const right = h('section', { class: 'card ib-fprev', id: 'ib-preview' },
          h('div', { class: 'card-h', style: { marginBottom: 0 } }, h('h2', null, '見え方'), h('span', { class: 'small muted' }, '送信を押すと、送ったあとの表示も見られます')),
          hasFormPage() ? Kit.seg([{ value: 'simple', label: 'かんたん表示' }, { value: 'site', label: 'ホームページの見た目で確認' }], S.pv === 'site' ? 'site' : 'simple', (v) => { S.pv = v; Kit.pref.set('inbox:preview', v); drawPv(); }, { label: '見え方の切りかえ' }) : null,
          pvHost);
        host.append(h('div', { class: 'ib-fgrid' }, left, right));
        drawPv();
      }
      // 選択肢の並び（書きかえ・上下・消す・足す）。arr をそのまま書きかえる
      function optEditor(arr, o) {
        const box = h('div', { class: 'ib-opts' });
        const draw = (focusId) => {
          Kit.clear(box);
          arr.forEach((v, i) => {
            const inp = h('input', { type: 'text', id: o.id + '-' + i, 'aria-label': o.label + ' ' + (i + 1) });
            inp.value = v;
            inp.addEventListener('input', () => { arr[i] = inp.value; o.onChange(); });
            const move = (d) => { const j = i + d; [arr[i], arr[j]] = [arr[j], arr[i]]; o.onChange(); draw(o.id + '-' + j + (d < 0 ? (j > 0 ? '-up' : '-down') : (j < arr.length - 1 ? '-down' : '-up'))); };
            box.append(h('div', { class: 'ib-opt' }, inp,
              Object.assign(Kit.btn('', () => move(-1), { icon: 'up', sm: true, kind: 'ghost', title: '上へ', disabled: i === 0 }), { id: o.id + '-' + i + '-up' }),
              Object.assign(Kit.btn('', () => move(1), { icon: 'down', sm: true, kind: 'ghost', title: '下へ', disabled: i === arr.length - 1 }), { id: o.id + '-' + i + '-down' }),
              Kit.btn('', () => { arr.splice(i, 1); o.onChange(); draw(o.id + '-new'); }, { icon: 'trash', sm: true, kind: 'ghost', title: '消す' })));
          });
          const add = h('input', { type: 'text', id: o.id + '-new', placeholder: o.placeholder, enterkeyhint: 'done', autocomplete: 'off' });
          const doAdd = () => {
            const v = add.value.trim();
            if (!v) { add.focus(); return; }
            if (arr.map((x) => x.trim()).includes(v)) { Kit.toast('同じものがもうあります'); add.select(); return; }
            arr.push(v);
            o.onChange();
            draw(o.id + '-new');
          };
          add.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); doAdd(); } });
          box.append(h('div', { class: 'ib-optadd' }, vh(o.id + '-new', o.addLabel), add, Kit.btn('足す', doAdd, { icon: 'plus', sm: true })));
          if (focusId) { const el = box.querySelector('#' + focusId); if (el) el.focus(); }
        };
        draw();
        return box;
      }

      /* ───── 分析 ───── */
      function periodRange(p) {
        const t = Kit.today(), first = new Date(t.getFullYear(), t.getMonth(), 1);
        if (p === 'last') { const a = Kit.addMonths(first, -1); return [Kit.ymd(a), Kit.ymd(Kit.addDays(first, -1))]; }
        if (p === '3m') return [Kit.ymd(Kit.addMonths(first, -2)), Kit.ymd(t)];
        if (p === '12m') return [Kit.ymd(Kit.addMonths(first, -11)), Kit.ymd(t)];
        return [Kit.ymd(first), Kit.ymd(t)];
      }
      function renderStats(host) {
        if (!S.leads.length) {
          host.append(Kit.empty({ title: 'まだ数字がありません', body: '問い合わせが入ると、数・成約率・どこから来たかが、ここに出ます。',
            actions: [Kit.btn('問い合わせを記録', () => openLeadForm(), { kind: 'primary', icon: 'plus' }), Kit.btn('まとめて取り込む', openImport, { icon: 'upload' })] }));
          return;
        }
        const [from, to] = periodRange(S.period);
        const inP = S.leads.filter((l) => { const d = localYmd(l.createdAt); return d >= from && d <= to; });
        const n = inP.length;
        const won = inP.filter((l) => l.status === 'won').length;
        const talking = inP.filter((l) => l.status === 'talking');
        const allTalking = S.leads.filter((l) => l.status === 'talking');
        const days = inP.filter((l) => l.repliedAt && l.createdAt).map((l) => Math.max(0, (new Date(l.repliedAt) - new Date(l.createdAt)) / DAY)).filter((x) => Number.isFinite(x));
        const avg = days.length ? days.reduce((a, b) => a + b, 0) / days.length : NaN;
        const kpi = (label, value, sub) => h('div', { class: 'kpi' }, h('div', { class: 'kpi-label' }, label), h('div', { class: 'kpi-value num' }, value), sub ? h('div', { class: 'kpi-sub' }, sub) : null);
        const waiting = inP.filter((l) => l.status === 'new').length;

        const wrap = h('div', { class: 'stack' });
        wrap.append(h('div', { class: 'ib-period' }, Kit.seg(PERIODS, S.period, (v) => { S.period = v; Kit.pref.set('inbox:period', v); renderPanel(); }, { label: '期間' }),
          h('span', { class: 'small muted' }, Kit.fmtDate(from, 'YYYY年M月D日') + '〜' + Kit.fmtDate(to, 'M月D日') + 'に受けた問い合わせ')));
        wrap.append(h('div', { class: 'ib-kpis' },
          kpi('問い合わせ', n + '件', waiting ? 'うち返信待ち ' + waiting + '件' : '返信待ちはありません'),
          kpi('成約', won + '件', n ? '成約率 ' + Kit.pct(won / n) : '—'),
          kpi('見込み金額（商談中）', Kit.yen(Kit.sum(talking, (l) => l.value)), talking.length + '件' + (allTalking.length !== talking.length ? '・全期間では ' + Kit.yen(Kit.sum(allTalking, (l) => l.value)) : '')),
          kpi('返信までの平均', Number.isFinite(avg) ? (avg < 1 ? Math.max(1, Math.round(avg * 24)) + '時間' : Kit.num(avg, 1) + '日') : '—', days.length ? days.length + '件の平均' : 'まだ返信の記録がありません')));

        // 流れ（どこまで進んだか）と、どこから来たか
        const funnelEl = h('div'), srcEl = h('div');
        wrap.append(h('div', { class: 'grid cols-2' },
          h('section', { class: 'card' }, h('div', { class: 'card-h' }, h('h2', null, '問い合わせから成約まで')), funnelEl),
          h('section', { class: 'card' }, h('div', { class: 'card-h' }, h('h2', null, 'どこから来たか')), srcEl)));
        if (!n) {
          funnelEl.append(h('p', { class: 'small muted' }, 'この期間の問い合わせはありません。'));
          srcEl.append(h('p', { class: 'small muted' }, 'この期間の問い合わせはありません。'));
        } else {
          const f1 = inP.filter(reachedReply).length, f2 = inP.filter(reachedTalk).length;
          Kit.chart.hbars(funnelEl, { items: [{ label: '新規', value: n }, { label: '返信', value: f1 }, { label: '商談', value: f2 }, { label: '成約', value: won }], format: (v) => v + '件' });
          const rate = (a, b) => (b ? Kit.pct(a / b) : '—');
          funnelEl.append(h('div', { class: 'ib-conv' },
            h('span', null, '新規→返信 ', h('b', null, rate(f1, n))), h('span', null, '返信→商談 ', h('b', null, rate(f2, f1))), h('span', null, '商談→成約 ', h('b', null, rate(won, f2)))));
          const cnt = new Map();
          inP.forEach((l) => { const k = l.source || 'わからない'; cnt.set(k, (cnt.get(k) || 0) + 1); });
          Kit.chart.hbars(srcEl, { items: [...cnt.entries()].sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value })), format: (v) => v + '件' });
          srcEl.append(h('p', { class: 'small muted', style: { marginTop: '12px' } }, 'QR・リンクで配り先ごとのリンクを作ると、ここで分かれて見えます。'));
        }

        // 月ごとの問い合わせ（成約・進行中・見送りの積み上げ）
        const nM = S.period === '12m' ? 12 : 6;
        const first = new Date(Kit.today().getFullYear(), Kit.today().getMonth(), 1);
        const months = [];
        for (let i = nM - 1; i >= 0; i--) months.push(Kit.addMonths(first, -i));
        const yms = months.map((d) => Kit.ym(d));
        const count = (pred) => yms.map((ym) => S.leads.filter((l) => localYmd(l.createdAt).slice(0, 7) === ym && pred(l)).length);
        const monthEl = h('div');
        wrap.append(h('section', { class: 'card' }, h('div', { class: 'card-h' }, h('h2', null, '月ごとの問い合わせ'), h('span', { class: 'small muted' }, 'いまの状態で色分け')), monthEl));
        host.append(wrap);
        Kit.chart.bars(monthEl, {
          labels: months.map((d) => (d.getMonth() + 1) + '月'),
          series: [
            { name: '成約', values: count((l) => l.status === 'won'), color: 'var(--series-1)' },
            { name: '進行中', values: count((l) => l.status === 'new' || l.status === 'replied' || l.status === 'talking'), color: 'var(--series-2)' },
            { name: '見送り', values: count((l) => l.status === 'lost'), color: 'var(--chart-axis)' },
          ],
          stacked: true, height: 210, format: (v) => (+v || 0) + '件', tick: (v) => (Number.isInteger(v) ? String(v) : ''), title: '月ごとの問い合わせ',
        });
      }

      /* ───── QR・リンク ───── */
      function renderLinks(host) {
        const f = S.form;
        const param = f.sourceParam || 'from';
        const defBase = (S.site && S.site.publishedUrl) || S.profile.url || '';
        const cur = { url: '', label: '' };
        const baseIn = h('input', { type: 'url', id: 'ib-q-base', placeholder: 'https://', inputmode: 'url', autocomplete: 'off', spellcheck: 'false' });
        baseIn.value = f.linkBase || defBase;
        const baseHint = h('span');
        const labelIn = h('input', { type: 'text', id: 'ib-q-label', placeholder: '例：駅前のチラシ', autocomplete: 'off' });
        labelIn.value = S.linkLabel;
        const presets = h('div', { class: 'ib-presets', role: 'group', 'aria-label': 'よく使う配り先' }, LINK_PRESETS.map((p) => h('button', { type: 'button', class: 'chip', 'aria-pressed': 'false', onclick: () => { labelIn.value = p; upd(); } }, p)));
        const urlBox = h('div', { class: 'ib-url', id: 'ib-q-url' });
        const qrHost = h('div', { class: 'ib-qrbox' });
        const srcNote = h('div');
        const btnCopy = Kit.btn('リンクをコピー', () => cur.url && Kit.copy(cur.url, 'リンクをコピーしました'), { icon: 'copy' });
        const btnSave = Kit.btn('このリンクを保存', () => saveLink(), { icon: 'save' });
        const btnPng = Kit.btn('QRコードを画像で保存', () => cur.url && dlPng(cur.url, cur.label), { icon: 'download', kind: 'primary' });
        const upd = () => {
          const base = baseIn.value.trim(), label = labelIn.value.trim();
          S.linkLabel = label;
          presets.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.textContent === label)));
          const bad = !base ? 'ホームページのURLを入れてください' : !/^https?:\/\/[^\s/]+\.[^\s]/i.test(base) ? 'https:// で始まるURLを入れてください' : '';
          baseHint.className = bad ? 'ib-bad' : '';
          baseHint.textContent = bad || (f.linkBase ? 'ここで書きかえたURLを使っています' : S.site && S.site.publishedUrl ? 'ホームページを公開したURLから入れています' : defBase ? '事業プロフィールのURLから入れています。公開したら書きかえてください' : '');
          cur.url = bad ? '' : linkFor(base, param, label);
          cur.label = label;
          urlBox.textContent = cur.url || '—';
          [btnCopy, btnSave, btnPng].forEach((b) => { b.disabled = !cur.url; });
          Kit.clear(qrHost);
          if (cur.url) {
            try {
              const c = Kit.qr(cur.url, { cell: 8, margin: 4 });
              c.className = 'ib-qr';
              c.setAttribute('role', 'img');
              c.setAttribute('aria-label', (label || 'ホームページ') + ' 用のQRコード');
              qrHost.append(c, h('div', { class: 'small muted' }, label ? label + ' 用' : '配り先なし'));
            } catch (e) { qrHost.append(h('p', { class: 'small ib-bad' }, 'QRコードを作れませんでした。URLが長すぎるかもしれません。')); }
          } else qrHost.append(h('div', { class: 'empty' }, h('p', { class: 'small' }, 'URLを入れると、ここにQRコードが出ます。')));
          Kit.clear(srcNote);
          if (label) {
            const inList = f.sources.map((s) => s.trim()).includes(label);
            srcNote.append(h('p', { class: 'small ink-2' }, 'このリンクから来た人の問い合わせには、どこで知ったかに「' + label + '」が入ります。',
              inList || !f.fields.source ? null : h('span', null, 'フォームの選択肢にはまだないので、加えておくとほかの人も選べます。　',
                Kit.btn('選択肢にも加える', () => { f.sources.push(label); saveForm(); upd(); Kit.toast('選択肢に加えました'); }, { sm: true, kind: 'ghost', icon: 'plus' }))));
          }
        };
        baseIn.addEventListener('input', () => { const v = baseIn.value.trim(); f.linkBase = v === defBase ? '' : v; saveForm(); upd(); });
        labelIn.addEventListener('input', upd);
        const dlPng = async (url, label) => {
          let blob = null;
          try { blob = await Kit.img.toBlob(Kit.qr(url, { cell: 12, margin: 4 }), 'image/png'); } catch (e) { blob = null; }
          if (!blob) { Kit.toast('画像にできませんでした', { type: 'bad' }); return; }
          const ok = await Kit.download(qrName(label), blob);
          if (ok) Kit.toast('QRコードを保存しました');
        };
        const savedBox = h('div');
        const saveLink = () => {
          if (!cur.url) return;
          if (f.links.some((x) => x.url === cur.url)) { Kit.toast('このリンクは、もう保存してあります'); return; }
          f.links.unshift({ id: Kit.uid('lk'), label: cur.label || '配り先なし', url: cur.url, at: new Date().toISOString() });
          saveForm();
          drawSaved();
          Kit.toast('リンクを保存しました');
        };
        const drawSaved = () => {
          Kit.clear(savedBox);
          if (!f.links.length) { savedBox.append(h('p', { class: 'small muted' }, 'まだ保存したリンクはありません。チラシや名刺ごとに保存しておくと、あとで同じQRコードをすぐ出せます。')); return; }
          const list = h('div', { class: 'list ib-links' });
          for (const lk of f.links) {
            let qr = null;
            try { qr = Kit.qr(lk.url, { cell: 2, margin: 2 }); qr.setAttribute('aria-hidden', 'true'); } catch (e) { qr = null; }
            const n = S.leads.filter((l) => l.source === lk.label).length;
            list.append(h('div', { class: 'list-item' }, qr,
              h('div', { class: 'ib-link-main' }, h('strong', null, lk.label), h('span', { class: 'ib-link-url' }, lk.url),
                h('span', { class: 'small muted' }, 'この名前の問い合わせ ' + n + '件・' + Kit.fmtDate(localYmd(lk.at), 'YYYY/M/D') + ' に作成')),
              h('div', { class: 'btn-row' },
                Kit.btn('', () => Kit.copy(lk.url, 'リンクをコピーしました'), { icon: 'copy', sm: true, title: 'リンクをコピー' }),
                Kit.btn('', () => dlPng(lk.url, lk.label), { icon: 'download', sm: true, title: 'QRコードを画像で保存' }),
                Kit.btn('', async () => {
                  if (!(await Kit.confirm({ title: 'このリンクを一覧から消しますか', body: '配ったチラシのQRコードは、消してもそのまま使えます。', ok: '消す', danger: true }))) return;
                  f.links = f.links.filter((x) => x.id !== lk.id);
                  saveForm();
                  drawSaved();
                }, { icon: 'trash', sm: true, kind: 'ghost', title: '一覧から消す' }))));
          }
          savedBox.append(list);
        };
        host.append(h('div', { class: 'stack' },
          h('p', { class: 'small ink-2', style: { maxWidth: '64ch' } }, '配る場所ごとにリンクを分けておくと、どのチラシや名刺から問い合わせが来たかが、分析のどこから来たかに出ます。ホームページのフォームでは、どこで知ったかの欄が最初から選ばれた状態になります。'),
          h('div', { class: 'ib-qgrid' },
            h('section', { class: 'card stack' },
              Kit.field({ label: 'ホームページのURL', input: baseIn, hint: baseHint }),
              h('div', { class: 'field' }, h('label', { for: 'ib-q-label' }, 'どこで配るか'), presets, labelIn),
              srcNote,
              h('div', { class: 'field' }, h('label', { for: 'ib-q-url' }, 'できたリンク'), urlBox),
              h('div', { class: 'btn-row' }, btnCopy, btnSave)),
            h('section', { class: 'card stack' }, qrHost, h('div', { class: 'btn-row', style: { justifyContent: 'center' } }, btnPng))),
          h('h2', { class: 'section-title', style: { margin: '10px 0 0' } }, '保存したリンク'),
          savedBox));
        upd();
        drawSaved();
      }

      /* ───── 返信テンプレート ───── */
      function renderReplies(host) {
        const R = S.replies;
        if (!R.items.some((t) => t.id === S.tplSel)) S.tplSel = R.items.length ? R.items[0].id : null;
        const ex = (S.sel && getLead(S.sel)) || S.leads[0] || { name: '山田 さくら', kind: 'ご相談・お問い合わせ', preferredAt: Kit.rel(3) + 'T10:00' };
        const listBox = h('div', { class: 'stack tight' });
        const edBox = h('div', { class: 'stack' });
        let curPv = null;
        const changed = () => saveReplies();
        const drawList = () => {
          Kit.clear(listBox);
          listBox.append(h('div', { class: 'list ib-tpl-list' }, R.items.map((t) => h('button', { type: 'button', class: 'list-item' + (t.id === S.tplSel ? ' is-sel' : ''), 'aria-current': t.id === S.tplSel ? 'true' : null, dataset: { id: t.id }, onclick: () => { S.tplSel = t.id; drawList(); drawEd(); } }, h('span', { class: 'ellipsis' }, t.title || '（名前なし）')))),
            h('div', null, Kit.btn('テンプレートを足す', () => {
              const t = { id: Kit.uid('rp'), title: '新しいテンプレート', body: '{お名前} 様\n\nお問い合わせいただき、ありがとうございます。{屋号}の{代表者}です。\n\n\n\n{署名}' };
              R.items.push(t);
              S.tplSel = t.id;
              changed();
              drawList();
              drawEd();
              const ti = Kit.$('#ib-t-title', root);
              if (ti) { ti.focus(); ti.select(); }
            }, { icon: 'plus', sm: true })));
          if (!R.items.length) listBox.prepend(h('p', { class: 'small muted' }, 'テンプレートがありません。'));
        };
        const drawEd = () => {
          Kit.clear(edBox);
          const i = R.items.findIndex((x) => x.id === S.tplSel);
          const t = R.items[i];
          curPv = null;
          if (!t) { edBox.append(Kit.empty({ title: 'テンプレートを選んでください', body: 'よく送る返信をひな形にしておくと、受付箱からすぐ返せます。' })); return; }
          const ti = h('input', { type: 'text', id: 'ib-t-title' });
          ti.value = t.title;
          const ta = h('textarea', { id: 'ib-t-body', class: 'ib-tpl-body', rows: 14 });
          ta.value = t.body;
          const pv = h('div', { class: 'ib-pre', id: 'ib-t-preview' });
          const drawPv = () => { pv.textContent = fillTpl(ta.value, ex, S.profile, R.sign || autoSign(S.profile)); };
          curPv = drawPv;
          ti.addEventListener('input', () => {
            t.title = ti.value;
            const b = listBox.querySelector('[data-id="' + t.id + '"] span');
            if (b) b.textContent = t.title || '（名前なし）';
            changed();
          });
          ta.addEventListener('input', Kit.debounce(() => { t.body = ta.value; drawPv(); changed(); }, 200));
          const insert = (ph) => {
            const s = ta.selectionStart == null ? ta.value.length : ta.selectionStart, e = ta.selectionEnd == null ? s : ta.selectionEnd;
            ta.value = ta.value.slice(0, s) + ph + ta.value.slice(e);
            ta.focus();
            ta.setSelectionRange(s + ph.length, s + ph.length);
            t.body = ta.value;
            drawPv();
            changed();
          };
          const move = (d) => { const j = i + d; [R.items[i], R.items[j]] = [R.items[j], R.items[i]]; changed(); drawList(); drawEd(); };
          edBox.append(
            h('div', { class: 'row between' }, h('span', { class: 'ib-saved', 'aria-live': 'polite' }, '書きかえると、自動で保存します'),
              h('div', { class: 'btn-row' },
                Kit.btn('', () => move(-1), { icon: 'up', sm: true, kind: 'ghost', title: '上へ', disabled: i === 0 }),
                Kit.btn('', () => move(1), { icon: 'down', sm: true, kind: 'ghost', title: '下へ', disabled: i === R.items.length - 1 }),
                Kit.btn('消す', async () => {
                  if (!(await Kit.confirm({ title: 'このテンプレートを消しますか', body: (t.title || '名前なし') + ' を消します。もとに戻せません。', ok: '消す', danger: true }))) return;
                  R.items = R.items.filter((x) => x.id !== t.id);
                  S.tplSel = R.items.length ? R.items[Math.max(0, i - 1)].id : null;
                  changed();
                  drawList();
                  drawEd();
                }, { icon: 'trash', sm: true, kind: 'ghost' }))),
            S.replies._sample ? h('p', { class: 'small ink-2' }, sampleChip(), '　例のテンプレートです。自分のことばに書きかえて使ってください。') : null,
            Kit.field({ label: 'テンプレートの名前（自分用）', input: ti }),
            h('div', { class: 'field' }, h('span', { class: 'small ink-2' }, '差し込み（押すと、本文のカーソルの所に入ります）'),
              h('div', { class: 'ib-ph' }, PLACEHOLDERS.map((p) => h('button', { type: 'button', class: 'chip line', onmousedown: (e) => e.preventDefault(), onclick: () => insert('{' + p + '}') }, '{' + p + '}')))),
            Kit.field({ label: '本文', input: ta, hint: 'わからない所は 〇〇 にしておくと、返信をつくるときに知らせます' }),
            h('div', { class: 'field' }, h('span', { class: 'small ink-2' }, '当てはめた例（' + (ex.name || '') + ' さんあて）'), pv));
          drawPv();
        };
        // 署名
        const signIn = h('textarea', { id: 'ib-t-sign', rows: 5 });
        signIn.value = R.sign || autoSign(S.profile);
        const signHint = h('span');
        const drawSignHint = () => { signHint.textContent = R.sign ? '自分で書いた署名を使っています' : '事業プロフィール（屋号・代表者・メール・URL）から作っています'; };
        drawSignHint();
        signIn.addEventListener('input', () => { R.sign = signIn.value.trim() === autoSign(S.profile).trim() ? '' : signIn.value; drawSignHint(); changed(); if (curPv) curPv(); });
        host.append(h('div', { class: 'stack' },
          h('div', { class: 'ib-tpl' }, h('div', null, listBox), h('section', { class: 'card' }, edBox)),
          h('section', { class: 'card stack' },
            h('div', { class: 'card-h', style: { marginBottom: 0 } }, h('h2', null, '署名'), h('span', { class: 'small muted' }, '{署名} の所に入ります')),
            Kit.field({ label: '署名', input: signIn, hint: signHint }),
            h('div', { class: 'btn-row' },
              Kit.btn('プロフィールから作り直す', () => { R.sign = ''; signIn.value = autoSign(S.profile); drawSignHint(); changed(); drawEd(); }, { icon: 'refresh', sm: true }),
              Kit.btn('事業プロフィールを編集', async () => { const p = await Kit.profile.edit(); if (p && !dead) { S.profile = await Kit.profile.get(); if (!R.sign) signIn.value = autoSign(S.profile); drawEd(); } }, { icon: 'user', sm: true, kind: 'ghost' })))));
        drawList();
        drawEd();
      }

      /* ───── ほかの画面での変化を受け取る ───── */
      let tick = 0;
      async function onLeads() {
        if (bulk) return;
        const ext = writing === 0;
        const my = ++tick;
        const list = await Kit.store.list('leads', { sample: SAMPLE_LEADS });
        if (dead || my !== tick) return;
        S.leads = list.map(normLead);
        renderTabs();
        renderSampleBar();
        if (S.tab === 'inbox' && inboxUI) inboxUI.refresh(ext);
        else if (S.tab === 'stats' && ext) renderPanel();
        if (ext && modalDetail) modalDetail.draw();
      }
      async function onDocs() {
        if (writing) return;
        await loadDocs();
        if (dead) return;
        renderSampleBar();
        if (S.tab !== 'stats') renderPanel();
      }
      async function onProfile() {
        S.profile = await Kit.profile.get();
      }
      const offs = [Kit.store.on('coll:leads', onLeads), Kit.store.on('doc:form', onDocs), Kit.store.on('doc:replies', onDocs), Kit.store.on('doc:profile', onProfile)];

      render();

      return () => {
        dead = true;
        offs.forEach((off) => off());
        window.removeEventListener('message', onFrameMsg);
        saveForm.flush();
        saveReplies.flush();
        for (const m of [...modals]) m.close();
      };
    },
  });
})();
