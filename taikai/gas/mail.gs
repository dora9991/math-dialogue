/**
 * 大会運営キット 一斉連絡：管理画面から届いたメールを、Gmail で1通ずつ送るスクリプト（Google Apps Script）
 * 管理画面の「一斉連絡」で「Gmail で送る」を選ぶと、1人ずつ差しこんだ件名・本文が、ここへ届きます。
 * 送ったメールは、このスプレッドシートの「送信の記録」シートに1行ずつ残ります。
 *
 * ※ このスクリプトは、サンプルを作った環境では動かせていません（未検証）。本番の前に、運営の数人だけで必ず試してください。
 *
 * 設定のしかた（10分ほど）
 *  1. Googleスプレッドシートを新しく作る（名前は自由。例：大会 メール送信の記録）
 *     ※ 送信に使うアカウント（事務局・学校のアカウント）で作る。そのアカウントの Gmail から送られます
 *  2. メニューの「拡張機能」→「Apps Script」を開く
 *  3. はじめから書いてある文字をすべて消して、このスクリプトを貼り付ける
 *  4. すぐ下の KEY に、自分たちだけの合言葉（8文字以上）を書いて保存する
 *  5. 右上の「デプロイ」→「新しいデプロイ」→ 種類の歯車から「ウェブアプリ」を選ぶ
 *  6. 次のユーザーとして実行：自分　／　アクセスできるユーザー：全員　にして「デプロイ」
 *  7. 許可を求められたら、送信に使うアカウントで許可する
 *     （「Google はこのアプリを確認していません」と出たら「詳細」→「（プロジェクト名）に移動」）
 *  8. 出てきた「ウェブアプリのURL」（/exec で終わる）と、KEY に書いた合言葉を、
 *     管理画面の「大会の設定」→「メールを本当に送る（Gmail・Apps Script）」に入れる
 *  9. 一斉連絡で、相手を運営の数人だけにしぼって「Gmail で送る」を試す
 * あとで直したときは「デプロイを管理」→ 鉛筆の印 → バージョン「新バージョン」→「デプロイ」（URLは変わりません）
 *
 * 1日に送れる数には上限があります（ふつうの Gmail は100通ほど、Google Workspace は1500通ほど。
 * 正確な数は Google の案内「Apps Script の割り当て」で確かめてください）。残りが足りないときは、送らずに知らせます。
 */
const KEY = 'ここに合言葉';          // 管理画面の「大会の設定」に入れる合言葉と同じにする。人に教えない
const LOG_SHEET = '送信の記録';      // 送った記録を残すシートの名前
const MAX_PER_REQUEST = 100;        // 1回に受け取る数の上限（管理画面は50通ずつ送ってくる）
const MAX = { to: 200, subject: 250, body: 20000, from: 100 };

// 管理画面から送られてきたとき
function doPost(e) {
  let req = {};
  try { req = JSON.parse((e && e.postData && e.postData.contents) || '{}'); } catch (err) { return json_({ ok: false, error: '送られてきた中身が読めません' }); }
  if (KEY.length < 8 || KEY === 'ここに合言葉') return json_({ ok: false, error: 'スクリプトの KEY（合言葉）が設定されていません' });
  if (String(req.key || '') !== KEY) return json_({ ok: false, error: '合言葉がちがいます' });

  const mails = Array.isArray(req.mails) ? req.mails : [];
  if (!mails.length) return json_({ ok: false, error: '送るメールがありません' });
  if (mails.length > MAX_PER_REQUEST) return json_({ ok: false, error: `1回に送れるのは ${MAX_PER_REQUEST} 通までです` });

  const remaining = MailApp.getRemainingDailyQuota();
  if (remaining < mails.length) {
    return json_({ ok: false, remaining: remaining, error: `今日送れる残りは ${remaining} 通です（${mails.length} 通は送れません）。日を分けて送ってください` });
  }

  const opts = {};
  const from = clean_(req.from, MAX.from);
  const replyTo = clean_(req.replyTo, MAX.to);
  if (from) opts.name = from;
  if (isEmail_(replyTo)) opts.replyTo = replyTo;

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  let sent = 0;
  const failed = [];
  const rows = [];
  try {
    mails.forEach(function (m) {
      const to = clean_(m && m.to, MAX.to);
      const subject = clean_(m && m.subject, MAX.subject);
      const body = clean_(m && m.body, MAX.body);
      if (!isEmail_(to) || !subject) { failed.push(to || '（宛先なし）'); return; }
      try {
        GmailApp.sendEmail(to, subject, body, opts);
        sent++;
        rows.push([new Date(), to, subject, '送信']);
      } catch (err) {
        failed.push(to);
        rows.push([new Date(), to, subject, 'エラー：' + err]);
      }
    });
  } finally {
    lock.releaseLock();
  }
  try { log_(rows); } catch (err) { console.error(err); }

  return json_({
    ok: failed.length === 0,
    sent: sent,
    failed: failed,
    remaining: MailApp.getRemainingDailyQuota(),
    error: failed.length ? `${failed.length} 通は送れませんでした（${failed.slice(0, 3).join('、')}${failed.length > 3 ? ' ほか' : ''}）` : '',
  });
}

// ブラウザで URL を開いたとき（動いているかの確認だけ）
function doGet() {
  return ContentService.createTextOutput('大会運営キットのメール送信の受け口です。今日送れる残り：' + MailApp.getRemainingDailyQuota() + ' 通');
}

// 送った記録をスプレッドシートに残す（スプレッドシートから作ったときだけ）
function log_(rows) {
  if (!rows.length) return;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return;
  let sh = ss.getSheetByName(LOG_SHEET);
  if (!sh) { sh = ss.insertSheet(LOG_SHEET); sh.appendRow(['日時', '宛先', '件名', '結果']); sh.setFrozenRows(1); }
  sh.getRange(sh.getLastRow() + 1, 1, rows.length, 4).setValues(rows.map(function (r) { return r.map(cell_); }));
}

function isEmail_(s) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(s || '')); }
function clean_(v, max) { return String(v == null ? '' : v).replace(/\r\n?/g, '\n').slice(0, max); }
// スプレッドシートで式として動かないように（= + - @ ではじまる文字の前に ' をつける）
function cell_(v) { return typeof v === 'string' && /^[=+\-@]/.test(v) ? "'" + v : v; }
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
