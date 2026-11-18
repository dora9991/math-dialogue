/**
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
