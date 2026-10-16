/* ひびの手帳 ― 裏側（Google Apps Script）
   ────────────────────────────────────────────────────────────────────
   ・データは Google ドライブの「ひびの手帳」フォルダに置く（_system/db.json）。写真・PDF もここ。
   ・スマホのアプリと、iPhone のショートカットから POST で呼ばれる（合言葉＝トークンが要る）。
     アプリは、パスキー（Face ID・Touch ID）でもログインできる（passkey.login だけは合言葉なしで呼べて、署名を確かめてから合言葉を返す）。
   ・Claude の朝の整理とは、ドライブのファイルで受け渡しする（Claude からこのスクリプトは直接呼べないため）。
       アプリ → Claude ：_system の Google ドキュメント「claudeへ」（中身は JSON。このスクリプトが書きかえる）
       Claude → アプリ ：_system/claudeから/*.json（Claude が毎朝つくる。このスクリプトが取り込む）
   ・日付をつけたメモ・写真を、iPhone のカレンダーで購読できる形（ICS）でも出す。

   はじめに一度だけ：
     1. このファイルの中身を Apps Script のエディタに貼る → 関数「setup」を選んで ▷実行 → 許可する
     2. デプロイ → 新しいデプロイ → 種類「ウェブアプリ」・実行するユーザー「自分」・アクセスできるユーザー「全員」
     3. 関数「showSetupInfo」を実行 → ログに出た URL と合言葉を、アプリの「設定」に入れる
     4. アプリで「パスキーを作る」→ ほかの iPhone・iPad・Mac は、Face ID・Touch ID でログインできる（URL と合言葉は要らない）
   くわしくは hibi/README.md。
   ──────────────────────────────────────────────────────────────────── */

var HIBI = {
  VERSION: '1.1.0',
  TZ: 'Asia/Tokyo',
  ROOT: 'ひびの手帳',          // マイドライブ直下のフォルダ
  INBOX: '受信箱',             // ここに写真・PDF を入れる（Claude が毎朝読む）
  PENDING: '確認待ち',         // Claude が決めきれなかったもの（アプリで選ぶと移る）
  ORGANIZED: '整理済み',       // 分類ごとのフォルダ
  SYSTEM: '_system',           // アプリと Claude のやりとり（さわらなくてよい）
  OUTBOX: 'claudeから',
  APPLIED: '取り込み済み',
  THUMBS: 'サムネイル',
  ORIGINALS: '元ファイル',     // HEIC を JPEG にしたときの元の写真
  BACKUP: 'バックアップ',
  DB: 'db.json',
  EXPORT: 'claudeへ',
  APP_URL: ''                  // アプリを公開した URL（例 https://hibi-techo.pages.dev/）。入れると setup のログに「接続リンク」が出る
};

var MAX_UPLOAD_ = 45 * 1024 * 1024;
var MAX_FILE_RETURN_ = 8 * 1024 * 1024;
var CONFIDENT_ = 0.75;
var FOLDERS_ = null;

/* ───── 入口 ───── */

function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.feed === 'ics') {
    if (!p.key || p.key !== prop_('FEED_KEY')) return ContentService.createTextOutput('forbidden').setMimeType(ContentService.MimeType.TEXT);
    return ContentService.createTextOutput(buildIcs_(loadDb_())).setMimeType(ContentService.MimeType.ICAL);
  }
  if (p.action === 'ping') return json_({ ok: true, data: { app: 'hibi', version: HIBI.VERSION } });
  return HtmlService.createHtmlOutput('<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<p style="font:16px/1.7 sans-serif;padding:24px">ひびの手帳の「裏側」です。<br>アプリの「設定」に、このページの URL（/exec で終わる）と合言葉を入れてください。</p>');
}

function doPost(e) {
  var req = parseRequest_(e);
  if (req.action === 'passkey.login') {
    try { return json_(passkeyLogin_(req)); } catch (err) {
      console.error(err && err.stack ? err.stack : err);
      return json_({ ok: false, error: 'passkey_failed' });
    }
  }
  var token = prop_('TOKEN');
  if (!token || !req.token || req.token !== token) return json_({ ok: false, error: 'unauthorized' });
  var fn = ACTIONS_[req.action];
  if (!fn) return json_({ ok: false, error: 'unknown_action: ' + req.action });
  try {
    return json_({ ok: true, data: fn(req) });
  } catch (err) {
    console.error(err && err.stack ? err.stack : err);
    return json_({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

var ACTIONS_ = {
  'ping': function () { return { app: 'hibi', version: HIBI.VERSION, now: nowIso_() }; },
  'bootstrap': actBootstrap_,
  'memo.save': actMemoSave_,
  'memo.delete': actMemoDelete_,
  'item.upload': actItemUpload_,
  'item.update': actItemUpdate_,
  'item.delete': actItemDelete_,
  'item.thumbs': actItemThumbs_,
  'item.file': actItemFile_,
  'proposal.answer': actProposalAnswer_,
  'proposal.dismiss': actProposalDismiss_,
  'ios.sync': actIosSync_,
  'settings.save': actSettingsSave_,
  'sync.run': actSyncRun_,
  'passkey.add': actPasskeyAdd_,
  'passkey.list': function () { return { passkeys: passkeyList_() }; },
  'passkey.remove': actPasskeyRemove_,
  'feed.info': function () { return { key: prop_('FEED_KEY') }; }
};

/* ───── はじめに一度だけ ───── */

/** フォルダ・データ・合言葉・1時間ごとの見回りをつくる。何度実行してもよい（あるものは使い回す） */
function setup() {
  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty('TOKEN')) props.setProperty('TOKEN', 'hb_' + uid_() + uid_() + uid_());
  if (!props.getProperty('FEED_KEY')) props.setProperty('FEED_KEY', 'fk_' + uid_() + uid_());
  withDb_(function (db) {
    db.settings.categories.forEach(function (c) { categoryFolder_(c.name); });
    scanFolders_(db, true);
    writeExport_(db);
    touch_(db);
  });
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'hourly') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('hourly').timeBased().everyHours(1).create();
  showSetupInfo();
}

/** アプリに入れる URL と合言葉を、ログに出す（デプロイしたあとに実行する） */
function showSetupInfo() {
  var url = '';
  try { url = ScriptApp.getService().getUrl() || ''; } catch (e) { url = ''; }
  var token = prop_('TOKEN'), key = prop_('FEED_KEY');
  var db = loadDb_();
  var appUrl = db.settings.appUrl || HIBI.APP_URL;
  var lines = [
    '── ひびの手帳 ──',
    'ウェブアプリの URL：' + (url || '（まだデプロイしていない。デプロイしてから、もう一度 showSetupInfo を実行）'),
    url && /\/dev$/.test(url) ? '  ※ /dev で終わるときは、デプロイの画面に出た /exec で終わる URL を使う' : '',
    '合言葉（トークン）：' + token,
    url ? 'カレンダー購読用 URL：' + url + '?feed=ics&key=' + key : '',
    url && appUrl ? '接続リンク（iPhone で開く）：' + appUrl.replace(/#.*$/, '') + '#connect=' + base64url_(JSON.stringify({ u: url, t: token })) : '',
    'ドライブのフォルダ：' + folders_().root.getUrl()
  ];
  lines.filter(Boolean).forEach(function (s) { console.log(s); });
  return lines.filter(Boolean).join('\n');
}

/** 合言葉を作りなおす（漏れたかもしれないとき）。アプリとショートカットの合言葉も入れなおす */
function resetToken() {
  PropertiesService.getScriptProperties().setProperty('TOKEN', 'hb_' + uid_() + uid_() + uid_());
  PropertiesService.getScriptProperties().setProperty('FEED_KEY', 'fk_' + uid_() + uid_());
  showSetupInfo();
}

/** パスキーを全部使えなくする（端末をなくしたとき）。合言葉も変えるときは、続けて resetToken も実行する */
function clearPasskeys() {
  savePasskeys_([]);
  console.log('パスキーを全部消しました。アプリでは、URL と合言葉でつないでから、作りなおせます。');
}

/** 1時間ごと：Claude の結果を取り込む・ドライブに直接入れたファイルを見つける・Claude へのデータを新しくする */
function hourly() {
  withDb_(function (db) {
    var n = applyOutbox_(db);
    var s = scanFolders_(db, true);
    var o = ocrPending_(db, 8);
    if (n || s) ensurePendingProposals_(db);
    if (db.exportDirty || n || s || o) writeExport_(db);
    backupDaily_(db);
  });
}

/* ───── 動作（アプリ・ショートカットから） ───── */

function actBootstrap_(req) {
  return withDb_(function (db) {
    var n = hasOutbox_() ? applyOutbox_(db) : 0;
    var s = scanFolders_(db, false);
    if (n || s) { ensurePendingProposals_(db); db.exportDirty = true; }
    if (req.rev != null && Number(req.rev) === Number(db.rev) && !db.__dirty) return { unchanged: true };
    return state_(db);
  });
}

function actMemoSave_(req) {
  var m = req.memo || {};
  return withDb_(function (db) {
    var now = nowIso_();
    var memo = m.id ? findById_(db.memos, m.id) : null;
    if (!memo) {
      if (!m.text || !String(m.text).trim()) throw new Error('メモが見つかりません（消したかもしれません）');
      memo = { id: validId_(m.id, 'm_') || ('m_' + uid_()), text: '', title: '', important: false, dates: [], category: '', categorySource: '',
        tags: [], archived: false, createdAt: validIso_(m.createdAt) || now, updatedAt: now };
      db.memos.push(memo);
    }
    if (m.text != null) memo.text = clip_(String(m.text), 5000);
    if (m.title != null) memo.title = clip_(m.title, 60);
    if (m.important != null) memo.important = truthy_(m.important);
    if (m.dates != null) memo.dates = normDates_(m.dates);
    if (m.category != null) {
      var c = validCategory_(db, m.category);
      memo.category = c; memo.categorySource = c ? 'manual' : '';
      if (c) { memo.needsDecision = false; memo.suggestedCategory = ''; removeProposalsFor_(db, { type: 'memo', id: memo.id }); }
      else memo.claudeAt = '';
    }
    if (m.tags != null) memo.tags = normTags_(m.tags);
    if (m.archived != null) memo.archived = truthy_(m.archived);
    memo.updatedAt = now;
    db.exportDirty = true;
    touch_(db);
    return { memo: memo };
  });
}

function actMemoDelete_(req) {
  return withDb_(function (db) {
    var before = db.memos.length;
    db.memos = db.memos.filter(function (m) { return m.id !== req.id; });
    removeProposalsFor_(db, { type: 'memo', id: req.id });
    if (db.memos.length !== before) { db.exportDirty = true; touch_(db); }
    return { deleted: before - db.memos.length };
  });
}

function actItemUpload_(req) {
  var data = String(req.data || '').replace(/^data:[^,]*,/, '').replace(/\s+/g, '');
  if (!data) throw new Error('ファイルの中身（data）が空です');
  var bytes = Utilities.base64Decode(data);
  if (bytes.length > MAX_UPLOAD_) throw new Error('ファイルが大きすぎます（45MB まで）');
  var mime = detectMime_(bytes, req.mime, req.ext || extOf_(req.name));
  var name = fileName_(req.name, req.ext, mime);
  return withDb_(function (db) {
    var cat = validCategory_(db, req.category);
    var folder = cat ? categoryFolder_(cat) : folders_().inbox;
    var file = folder.createFile(Utilities.newBlob(bytes, mime, name));
    var item = registerFile_(db, file, req.source === 'shortcut' ? 'shortcut' : 'app', cat ? 'organized' : 'inbox');
    item.dates = normDates_(req.dates);
    item.note = clip_(req.note || '', 1000);
    item.important = truthy_(req.important);
    if (req.title) item.title = clip_(req.title, 80);
    if (cat) { item.category = cat; item.categorySource = 'manual'; }
    if (req.thumb) saveThumb_(item, req.thumb);
    db.exportDirty = true;
    touch_(db);
    return { item: item };
  });
}

function actItemUpdate_(req) {
  return withDb_(function (db) {
    var item = findById_(db.items, req.id);
    if (!item) throw new Error('見つかりません（' + req.id + '）');
    applyPatch_(db, { type: 'file', itemId: item.id }, req.patch || {});
    db.exportDirty = true;
    touch_(db);
    return { item: item };
  });
}

function actItemDelete_(req) {
  return withDb_(function (db) {
    var item = findById_(db.items, req.id);
    if (!item) return { deleted: 0 };
    var f = safeFile_(item.fileId);
    if (f) f.setTrashed(true);
    var t = item.thumbFileId && safeFile_(item.thumbFileId);
    if (t) t.setTrashed(true);
    db.items = db.items.filter(function (x) { return x.id !== item.id; });
    removeProposalsFor_(db, { type: 'file', itemId: item.id });
    db.exportDirty = true;
    touch_(db);
    return { deleted: 1 };
  });
}

/** サムネイル（小さい画像）を data URL で返す。なければドライブのサムネイルから作って保存する。1回 12 件まで */
function actItemThumbs_(req) {
  var ids = (Array.isArray(req.ids) ? req.ids : String(req.ids || '').split(',')).slice(0, 12);
  return withDb_(function (db) {
    var out = {};
    ids.forEach(function (id) {
      var item = findById_(db.items, id);
      if (!item) return;
      var blob = null;
      if (item.thumbFileId) { var t = safeFile_(item.thumbFileId); blob = t ? t.getBlob() : null; }
      if (!blob) { blob = makeThumb_(item); if (blob) touch_(db); }
      if (blob) out[id] = 'data:' + (blob.getContentType() || 'image/jpeg') + ';base64,' + Utilities.base64Encode(blob.getBytes());
    });
    return { thumbs: out };
  });
}

function actItemFile_(req) {
  var db = loadDb_();
  var item = findById_(db.items, req.id);
  if (!item) throw new Error('見つかりません');
  var f = safeFile_(item.fileId);
  if (!f) throw new Error('ドライブにファイルがありません（ゴミ箱に入れた？）');
  var url = f.getUrl();
  if (f.getSize() > MAX_FILE_RETURN_) return { tooLarge: true, url: url };
  var blob = f.getBlob();
  return { mime: blob.getContentType(), name: f.getName(), url: url, data: Utilities.base64Encode(blob.getBytes()) };
}

function actProposalAnswer_(req) {
  return withDb_(function (db) {
    var p = findById_(db.proposals, req.id);
    if (!p || p.status !== 'open') throw new Error('この確認はもう終わっています');
    var i = Number(req.option);
    var opt = p.options[i];
    if (!opt) throw new Error('選んだものが見つかりません');
    var target = applyPatch_(db, p.target, opt.patch || {});
    p.status = 'done';
    p.answer = { option: i, label: opt.label, at: nowIso_() };
    db.decisions.push({ at: nowIso_(), kind: p.kind, question: p.question, answer: opt.label });
    if (db.decisions.length > 60) db.decisions = db.decisions.slice(-60);
    if (truthy_(req.remember) && p.rule && db.settings.rules.indexOf(p.rule) < 0) {
      db.settings.rules.push(p.rule);
      if (db.settings.rules.length > 80) db.settings.rules = db.settings.rules.slice(-80);
    }
    db.exportDirty = true;
    touch_(db);
    return { proposal: p, ios: opt.ios || null, item: target && target.item || null, memo: target && target.memo || null, rules: db.settings.rules };
  });
}

function actProposalDismiss_(req) {
  return withDb_(function (db) {
    var p = findById_(db.proposals, req.id);
    if (!p || p.status !== 'open') return { proposal: p || null };
    p.status = 'dismissed';
    p.answer = { option: -1, label: '却下', at: nowIso_() };
    db.decisions.push({ at: nowIso_(), kind: p.kind, question: p.question, answer: '（却下）' });
    if (db.decisions.length > 60) db.decisions = db.decisions.slice(-60);
    // 分類の確認を却下したものは、もう聞かない（確認待ちのまま。アプリの「資料」から自分で決められる）
    var rec = p.target && p.target.type === 'file' ? findById_(db.items, p.target.itemId) : p.target && p.target.type === 'memo' ? findById_(db.memos, p.target.id) : null;
    if (rec && p.kind === 'category') rec.noAsk = true;
    db.exportDirty = true;
    touch_(db);
    return { proposal: p };
  });
}

var IOS_MAX_EVENTS = 8000, IOS_MAX_REMINDERS = 3000;

/** iPhone のショートカットから：カレンダーの予定とリマインダーの一覧を受け取る。
    予定は、送られてきた期間（from〜to）の分だけを入れかえ、ほかの日の予定は残す。だから、はじめに長い期間（たとえば1年前〜1年後）を
    1回送っておけば、毎朝の短い同期（きのう〜60日後）のあとも、前後の月の予定はカレンダーに残る。
    リマインダーは「終わっていないもの全部」が来るので、まるごと入れかえる */
function actIosSync_(req) {
  var events = req.events != null ? parseList_(req.events).map(normEvent_).filter(Boolean) : null;
  var reminders = req.reminders != null ? parseList_(req.reminders).map(normReminder_).filter(Boolean) : null;
  // 中身が来ているのに1件も読めないときは、形がちがう（ショートカットの「辞書」の作り方など）。いまのデータは消さない
  if (events && !events.length && looksFilled_(req.events)) throw new Error('予定の形が読めませんでした（ショートカットの「辞書」の種類が「テキスト」か、「変数に追加」の入力が「辞書」か確かめてください）');
  if (reminders && !reminders.length && looksFilled_(req.reminders)) throw new Error('リマインダーの形が読めませんでした（ショートカットの「辞書」を確かめてください）');
  return withDb_(function (db) {
    db.ios = db.ios || { events: [], reminders: [] };
    var range = null;
    if (events) {
      range = syncRange_(req, events);
      var all = (db.ios.events || []).filter(function (e) { return e.d0 < range.from || e.d0 > range.to; }).concat(events);
      all.sort(function (a, b) { var x = a.d0 + ' ' + (a.t0 || ''), y = b.d0 + ' ' + (b.t0 || ''); return x < y ? -1 : x > y ? 1 : 0; });
      // 多すぎるときは、いちばん古い予定から捨てる
      db.ios.events = all.length > IOS_MAX_EVENTS ? all.slice(all.length - IOS_MAX_EVENTS) : all;
    }
    if (reminders) db.ios.reminders = reminders.slice(0, IOS_MAX_REMINDERS);
    db.ios.syncedAt = nowIso_();
    touch_(db);
    writeExport_(db);
    var md = function (ymd) { return Number(ymd.slice(5, 7)) + '/' + Number(ymd.slice(8)); };
    return { events: events ? events.length : null, reminders: reminders ? reminders.length : null, syncedAt: db.ios.syncedAt,
      from: range ? range.from : null, to: range ? range.to : null, total: db.ios.events.length,
      message: '予定 ' + (events ? events.length + '件（' + md(range.from) + '〜' + md(range.to) + '）' : '-') + '・リマインダー ' + (reminders ? reminders.length : '-') +
        '件を同期しました（ひびの手帳の予定は、全部で ' + db.ios.events.length + '件）' };
  });
}

/** 入れかえる期間。ショートカットが from・to（「はじめ」「おわり」）を送ってきたら、その期間。
    来ないとき（前のつくり方のショートカット）は、送られてきた予定の最初の日〜最後の日と、いつもの「きのう〜60日後」を合わせた期間 */
function syncRange_(req, events) {
  var f = parseDateLoose_(req.from), t = parseDateLoose_(req.to);
  if (f && t && f.ymd <= t.ymd) return { from: f.ymd, to: t.ymd };
  var from = addDays_(today_(), -1), to = addDays_(today_(), 60);
  events.forEach(function (e) { if (e.d0 < from) from = e.d0; if (e.d0 > to) to = e.d0; });
  return { from: from, to: to };
}

function actSettingsSave_(req) {
  return withDb_(function (db) {
    db.settings = normSettings_(Object.assign({}, db.settings, req.settings || {}));
    db.settings.categories.forEach(function (c) { categoryFolder_(c.name); });
    db.exportDirty = true;
    writeExport_(db);
    touch_(db);
    return { settings: db.settings };
  });
}

/** 「今すぐ取り込む」：Claude の結果の取り込み・フォルダの見回り・Claude へのデータの更新を、いま行う */
function actSyncRun_() {
  return withDb_(function (db) {
    var n = applyOutbox_(db);
    var s = scanFolders_(db, true);
    ocrPending_(db, 4);
    ensurePendingProposals_(db);
    writeExport_(db);
    touch_(db);
    var st = state_(db);
    st.result = { applied: n, found: s };
    return st;
  });
}

/* ───── パスキー（Face ID・Touch ID でログイン） ─────
   ・作る：つながっている端末から（合言葉つき）。公開鍵だけを、スクリプトのプロパティ PASSKEYS にしまう。
   ・ログイン：合言葉なしで呼べる。つなぎ元・顔や指紋で確かめた印・時刻・署名（ES256）を確かめてから、合言葉を返す。
   ・どの裏側につなぐかは、アプリがパスキーの「ユーザー ID」に入れておく（新しい端末は、そこから URL を知る）。 */

var PASSKEY_MAX_ = 10;
var PASSKEY_SKEW_MS_ = 10 * 60 * 1000;   // 端末と Google の時計のずれは、ここまで許す

function passkeys_() {
  try { var a = JSON.parse(prop_('PASSKEYS') || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; }
}
function savePasskeys_(list) {
  var props = PropertiesService.getScriptProperties();
  if (list.length) props.setProperty('PASSKEYS', JSON.stringify(list)); else props.deleteProperty('PASSKEYS');
}
/** 一覧を書きかえる（同時に来たログイン・追加で、消し合わないように鍵をかける） */
function updatePasskeys_(fn) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try { var list = fn(passkeys_()); savePasskeys_(list); return list; } finally { lock.releaseLock(); }
}
/** アプリに見せるのは、名前と日付だけ */
function passkeyList_() {
  return passkeys_().map(function (p) { return { id: p.id, name: p.name, createdAt: p.createdAt, lastUsedAt: p.lastUsedAt || '' }; });
}

function actPasskeyAdd_(req) {
  var id = String(req.id || ''), x = String(req.x || ''), y = String(req.y || '');
  var rpId = String(req.rpId || '').toLowerCase(), origin = String(req.origin || '');
  if (!/^[A-Za-z0-9_-]{16,1400}$/.test(id)) throw new Error('パスキーの ID が読めません');
  if (!/^[A-Za-z0-9_-]{43}$/.test(x) || !/^[A-Za-z0-9_-]{43}$/.test(y)) throw new Error('パスキーの鍵の形が読めません（ES256 の鍵だけ使えます）');
  if (!/^(https:\/\/[a-z0-9.-]+(:\d+)?|http:\/\/(localhost|127\.0\.0\.1)(:\d+)?)$/.test(origin)) throw new Error('アプリの URL（origin）が読めません');
  var host = origin.replace(/^https?:\/\//, '').replace(/:\d+$/, '');
  if (!/^[a-z0-9.-]{1,253}$/.test(rpId) || (host !== rpId && host.slice(-rpId.length - 1) !== '.' + rpId)) throw new Error('rpId と アプリの URL が合いません');
  es256Ready_();
  if (!p256OnCurve_(b64uBig_(x), b64uBig_(y))) throw new Error('パスキーの鍵が正しくありません');
  var rec = { id: id, x: x, y: y, rpId: rpId, origin: origin, name: clip_(String(req.name || '').trim() || 'パスキー', 40), createdAt: nowIso_(), lastUsedAt: '' };
  updatePasskeys_(function (list) { return list.filter(function (p) { return p.id !== id; }).concat([rec]).slice(-PASSKEY_MAX_); });
  return { passkeys: passkeyList_() };
}

function actPasskeyRemove_(req) {
  var removed = 0;
  updatePasskeys_(function (list) { var left = list.filter(function (p) { return p.id !== req.id; }); removed = list.length - left.length; return left; });
  return { passkeys: passkeyList_(), removed: removed };
}

/** 合言葉のかわりに、パスキーの署名で確かめる。だれでも呼べるので、確かめ終わるまで何も渡さない */
function passkeyLogin_(req) {
  var fail = function (code) { return { ok: false, error: code }; };
  var p = null;
  passkeys_().forEach(function (k) { if (k.id === req.id) p = k; });
  if (!p) return fail('passkey_unknown');
  try { es256Ready_(); } catch (e) { return fail('passkey_unsupported'); }
  var cdj, ad, sig, cd, ch;
  try {
    cdj = b64uBytes_(req.clientDataJSON); ad = b64uBytes_(req.authenticatorData); sig = b64uBytes_(req.signature);
    cd = JSON.parse(Utilities.newBlob(cdj).getDataAsString('UTF-8'));
    ch = Utilities.newBlob(b64uBytes_(cd.challenge)).getDataAsString('UTF-8');
  } catch (e) { return fail('passkey_failed'); }
  if (!cd || cd.type !== 'webauthn.get' || cd.origin !== p.origin || cd.crossOrigin === true || ad.length < 37) return fail('passkey_failed');
  // 合図（challenge）はアプリが作る「hb1.時刻.使い捨ての番号」。古いもの・一度使ったものは受けない
  var m = /^hb1\.(\d{13})\.([0-9a-f]{32})$/.exec(ch);
  if (!m) return fail('passkey_failed');
  if (Math.abs(Date.now() - Number(m[1])) > PASSKEY_SKEW_MS_) return fail('passkey_stale');
  var cache = null;
  try { cache = CacheService.getScriptCache(); } catch (e) { cache = null; }
  if (cache && cache.get('pk_' + m[2])) return fail('passkey_stale');
  // このサイト（rpId）のパスキーか・押した印（UP）と、顔・指紋・パスコードで確かめた印（UV）があるか
  var rp = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, p.rpId, Utilities.Charset.UTF_8);
  for (var i = 0; i < 32; i++) if ((rp[i] & 0xff) !== (ad[i] & 0xff)) return fail('passkey_failed');
  if ((ad[32] & 0x05) !== 0x05) return fail('passkey_failed');
  var signed = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, ad.concat(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, cdj)));
  if (!es256Verify_(p.x, p.y, signed, sig)) return fail('passkey_failed');
  if (cache) { try { cache.put('pk_' + m[2], '1', 1800); } catch (e) { /* 使い捨ての印が残せなくても、時刻で古いものは止まる */ } }
  try { updatePasskeys_(function (list) { list.forEach(function (k) { if (k.id === p.id) k.lastUsedAt = nowIso_(); }); return list; }); }
  catch (e) { console.warn('パスキーの「最後に使った日」を書けなかった：' + e); }   // ログインは止めない
  return { ok: true, data: { token: prop_('TOKEN'), name: p.name } };
}

/* ── 署名（ES256 = P-256 の ECDSA と SHA-256）を確かめる。Apps Script には確かめる関数がないので、BigInt で計算する ── */

var P256_ = null, ES256_OK_ = false;
function p256_() {
  if (!P256_) {
    var B = BigInt;
    P256_ = {
      p: B('0xffffffff00000001000000000000000000000000ffffffffffffffffffffffff'),
      n: B('0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551'),
      b: B('0x5ac635d8aa3a93e7b3ebbd55769886bc651d06b0cc53b0f63bce3c3e27d2604b'),
      gx: B('0x6b17d1f2e12c4247f8bce6e563a440f277037d812deb33a0f4a13945d898c296'),
      gy: B('0x4fe342e2fe1a7f9b8ee7eb4a7c0f9e162bce33576b315ececbb6406837bf51f5'),
      k0: B(0), k1: B(1), k2: B(2), k3: B(3), k4: B(4), k8: B(8)
    };
  }
  return P256_;
}
/** 使う前に一度、決まった答えのある署名で確かめる（BigInt がない・計算がおかしい裏側では、パスキーを使わせない） */
function es256Ready_() {
  if (ES256_OK_) return true;
  if (typeof BigInt !== 'function') throw new Error('この Apps Script では BigInt が使えません（V8 の実行環境にしてください）');
  var x = 'ywbmJP9le-Ib5wjqHpZ09yWLR2IFY_fBwz5Zuwz619g', y = 'yh73JEpbHMFc65lSiKviHvQn_78K3uhXovzW-lRKYx8';
  var h = b64uBytes_('yjxFjK6ZPaYjRJBGtulP3Q2WKVgYtXN84Jd2Y9nqHfU');
  var s = b64uBytes_('MEYCIQD5U73PJBitvswEM2ihNzQ8Zf2RqAx8kFzVjp9VO5GltgIhALSH-xSEAd-D8KYss3jefTGuMC-d-5rMU4sAsQdqfbh5');
  var bad = h.slice(); bad[31] = bad[31] ^ 1;
  if (!es256Verify_(x, y, h, s) || es256Verify_(x, y, bad, s)) throw new Error('署名の確かめ方が、この Apps Script では正しく動きません');
  ES256_OK_ = true;
  return true;
}

function es256Verify_(xB64, yB64, hash, der) {
  var c = p256_();
  var x = b64uBig_(xB64), y = b64uBig_(yB64);
  if (!p256OnCurve_(x, y)) return false;
  var rs = derSig_(der);
  if (!rs) return false;
  var r = rs[0], s = rs[1];
  if (r <= c.k0 || r >= c.n || s <= c.k0 || s >= c.n) return false;
  var w = p256Inv_(s, c.n);
  if (w === null) return false;
  var z = bytesBig_(hash);
  var R = p256MulAdd_(z * w % c.n, r * w % c.n, [x, y, c.k1]);
  if (!R) return false;
  var zi = p256Inv_(R[2], c.p);
  if (zi === null) return false;
  return R[0] * (zi * zi % c.p) % c.p % c.n === r;
}

function p256Mod_(a, m) { var r = a % m; return r < P256_.k0 ? r + m : r; }
function p256OnCurve_(x, y) {
  var c = p256_(), p = c.p;
  if (x < c.k0 || x >= p || y < c.k0 || y >= p) return false;
  return p256Mod_(y * y % p - (x * x % p * x % p - c.k3 * x + c.b), p) === c.k0;
}
/** 点の2倍（ヤコビ座標・a = -3）。null は無限遠点 */
function p256Dbl_(P) {
  var c = P256_, p = c.p;
  if (!P || P[1] === c.k0) return null;
  var X = P[0], Y = P[1], Z = P[2];
  var delta = Z * Z % p, gamma = Y * Y % p, beta = X * gamma % p;
  var alpha = c.k3 * p256Mod_(X - delta, p) % p * ((X + delta) % p) % p;
  var X3 = p256Mod_(alpha * alpha - c.k8 * beta, p);
  var Z3 = p256Mod_((Y + Z) * (Y + Z) - gamma - delta, p);
  var Y3 = p256Mod_(alpha * p256Mod_(c.k4 * beta - X3, p) - c.k8 * (gamma * gamma % p), p);
  return [X3, Y3, Z3];
}
/** 点の足し算（ヤコビ座標） */
function p256Add_(P, Q) {
  if (!P) return Q;
  if (!Q) return P;
  var c = P256_, p = c.p;
  var Z1Z1 = P[2] * P[2] % p, Z2Z2 = Q[2] * Q[2] % p;
  var U1 = P[0] * Z2Z2 % p, U2 = Q[0] * Z1Z1 % p;
  var S1 = P[1] * Q[2] % p * Z2Z2 % p, S2 = Q[1] * P[2] % p * Z1Z1 % p;
  var H = p256Mod_(U2 - U1, p), R = p256Mod_(S2 - S1, p);
  if (H === c.k0) return R === c.k0 ? p256Dbl_(P) : null;
  var I = c.k4 * H % p * H % p, J = H * I % p, V = U1 * I % p;
  R = c.k2 * R % p;
  var X3 = p256Mod_(R * R - J - c.k2 * V, p);
  var Y3 = p256Mod_(R * p256Mod_(V - X3, p) - c.k2 * (S1 * J % p), p);
  var Z3 = p256Mod_(((P[2] + Q[2]) * (P[2] + Q[2]) - Z1Z1 - Z2Z2) % p * H, p);
  return [X3, Y3, Z3];
}
/** u1・G + u2・Q を、ビットを上から一度だけたどって求める */
function p256MulAdd_(u1, u2, Q) {
  var c = P256_, G = [c.gx, c.gy, c.k1], GQ = p256Add_(G, Q);
  var a = u1.toString(2), b = u2.toString(2), n = Math.max(a.length, b.length), R = null;
  while (a.length < n) a = '0' + a;
  while (b.length < n) b = '0' + b;
  for (var i = 0; i < n; i++) {
    R = p256Dbl_(R);
    var ba = a.charAt(i) === '1', bb = b.charAt(i) === '1';
    if (ba && bb) R = p256Add_(R, GQ); else if (ba) R = p256Add_(R, G); else if (bb) R = p256Add_(R, Q);
  }
  return R;
}
/** 逆数（拡張ユークリッド）。ないときは null */
function p256Inv_(a, m) {
  var c = p256_(), t = c.k0, nt = c.k1, r = m, nr = p256Mod_(a, m);
  while (nr !== c.k0) {
    var q = r / nr, tmp = t - q * nt;
    t = nt; nt = tmp;
    tmp = r - q * nr; r = nr; nr = tmp;
  }
  if (r !== c.k1) return null;
  return t < c.k0 ? t + m : t;
}
/** DER の署名（SEQUENCE { INTEGER r, INTEGER s }）→ [r, s]。形がちがえば null */
function derSig_(bytes) {
  var b = [];
  for (var k = 0; k < bytes.length; k++) b.push(bytes[k] & 0xff);
  if (b.length < 8 || b.length > 72 || b[0] !== 0x30 || b[1] !== b.length - 2) return null;
  var i = 2, out = [];
  for (var j = 0; j < 2; j++) {
    if (b[i++] !== 0x02) return null;
    var len = b[i++];
    if (!len || len > 33 || i + len > b.length) return null;
    out.push(bytesBig_(b.slice(i, i + len)));
    i += len;
  }
  return i === b.length ? out : null;
}
function bytesBig_(bytes) {
  var hex = '';
  for (var i = 0; i < bytes.length; i++) { var v = bytes[i] & 0xff; hex += (v < 16 ? '0' : '') + v.toString(16); }
  return BigInt('0x' + (hex || '0'));
}
function b64uBytes_(s) {
  s = String(s == null ? '' : s);
  if (!/^[A-Za-z0-9_-]*$/.test(s) || s.length % 4 === 1) throw new Error('base64url が読めません');
  return Utilities.base64DecodeWebSafe(s + '==='.slice((s.length + 3) % 4));
}
function b64uBig_(s) { return bytesBig_(b64uBytes_(s)); }

/* ───── データ（db.json） ───── */

function emptyDb_() {
  return { schema: 'hibi-db/1', rev: 0, memos: [], items: [], proposals: [], briefings: {}, ios: { events: [], reminders: [], syncedAt: '' },
    settings: defaultSettings_(), decisions: [], applied: [], lastRun: null, exportDirty: true, createdAt: nowIso_() };
}

function defaultSettings_() {
  return {
    categories: [
      { name: '学校・授業', hint: '勤務校・授業・教材・校務・研修・同僚とのやりとり' },
      { name: '家族・子ども', hint: '子どもの園や学校のおたより・行事・持ち物・家族の予定' },
      { name: '手続き・お金', hint: '役所・保険・税・支払い・領収書・契約・申込書' },
      { name: '健康', hint: '病院・薬・健診・体調' },
      { name: '創作・音楽', hint: '作曲・演奏・ゲームやアプリづくり・執筆' },
      { name: '研究・学び', hint: '数学の研究・読書・勉強・講座' },
      { name: 'コミュニティ', hint: '教員コミュニティ・発信・イベント' },
      { name: '暮らし・買い物', hint: '買い物・家のこと・食事・お出かけ' },
      { name: 'その他', hint: 'どれにも当てはまらないもの' }
    ],
    rules: [],
    briefing: {
      news: ['日本の今日の主なニュース', '教育・学校に関するニュース', '佐賀県のニュース'],
      ai: ['生成AIの新しい動き（Claude・Anthropic を含む）', '教育でのAIの使い方'],
      gmailQuery: 'in:inbox -category:promotions -category:social',
      maxNews: 5, maxAi: 5, maxGmail: 8
    },
    shortcuts: { sync: 'ひびの手帳 同期', send: 'ひびの手帳へ送る', add: 'ひびの手帳から登録' },
    appUrl: ''
  };
}

function normSettings_(s) {
  var d = defaultSettings_();
  s = s || {};
  var cats = (Array.isArray(s.categories) ? s.categories : []).map(function (c) {
    if (typeof c === 'string') c = { name: c, hint: '' };
    var name = clip_(String(c && c.name || '').replace(/[\\/]/g, '・').trim(), 20);
    return name ? { name: name, hint: clip_(c.hint || '', 80) } : null;
  }).filter(Boolean);
  var seen = {};
  cats = cats.filter(function (c) { if (seen[c.name]) return false; seen[c.name] = 1; return true; }).slice(0, 20);
  var b = Object.assign({}, d.briefing, s.briefing || {});
  var lines = function (v, n) { return (Array.isArray(v) ? v : String(v || '').split('\n')).map(function (x) { return clip_(String(x).trim(), 80); }).filter(Boolean).slice(0, n); };
  var num = function (v, def, max) { var n = Math.round(Number(v)); return isFinite(n) && n >= 0 ? Math.min(n, max) : def; };
  return {
    categories: cats.length ? cats : d.categories,
    rules: lines(s.rules, 80),
    briefing: { news: lines(b.news, 8), ai: lines(b.ai, 8), gmailQuery: clip_(b.gmailQuery || d.briefing.gmailQuery, 200),
      maxNews: num(b.maxNews, 5, 10), maxAi: num(b.maxAi, 5, 10), maxGmail: num(b.maxGmail, 8, 15) },
    shortcuts: { sync: clip_((s.shortcuts && s.shortcuts.sync) || d.shortcuts.sync, 40), send: clip_((s.shortcuts && s.shortcuts.send) || d.shortcuts.send, 40),
      add: clip_((s.shortcuts && s.shortcuts.add) || d.shortcuts.add, 40) },
    appUrl: safeUrl_(s.appUrl) || ''
  };
}

function normalizeDb_(db) {
  var e = emptyDb_();
  Object.keys(e).forEach(function (k) { if (db[k] == null) db[k] = e[k]; });
  db.settings = normSettings_(db.settings);
  if (!db.ios.events) db.ios.events = [];
  if (!db.ios.reminders) db.ios.reminders = [];
  return db;
}

function dbFile_() {
  var f = folders_();
  var id = prop_('DB_ID'), file = id ? safeFile_(id) : null;
  if (!file) {
    var it = f.system.getFilesByName(HIBI.DB);
    while (it.hasNext()) { var x = it.next(); if (!x.isTrashed()) { file = x; break; } }
  }
  if (!file) file = f.system.createFile(HIBI.DB, JSON.stringify(emptyDb_()), 'application/json');
  setProp_('DB_ID', file.getId());
  return file;
}

function loadDb_() {
  var text = dbFile_().getBlob().getDataAsString('UTF-8');
  var db;
  try { db = JSON.parse(text.replace(/^\uFEFF/, '')); } catch (e) {
    // 壊れたデータで上書きしないよう、ここで止める（_system/バックアップ に毎日の控えがある）
    throw new Error('db.json が読めません。_system/バックアップ から戻してください（' + e.message + '）');
  }
  return normalizeDb_(db);
}

function saveDb_(db) { dbFile_().setContent(JSON.stringify(db)); }

/** ロックをかけて読み→変更→保存。fn の中で touch_(db) したときだけ保存する */
function withDb_(fn) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var db = loadDb_();
    var res = fn(db);
    if (db.__dirty) {
      delete db.__dirty;
      db.rev = (Number(db.rev) || 0) + 1;
      db.updatedAt = nowIso_();
      saveDb_(db);
      if (res && typeof res === 'object' && !Array.isArray(res)) res.rev = db.rev;
    }
    return res;
  } finally {
    lock.releaseLock();
  }
}

function touch_(db) { db.__dirty = true; }

function state_(db) {
  var f = folders_();
  var days = Object.keys(db.briefings).sort().slice(-14), briefings = {};
  days.forEach(function (d) { briefings[d] = db.briefings[d]; });
  return {
    rev: db.rev, version: HIBI.VERSION, serverTime: nowIso_(), today: today_(),
    settings: db.settings, memos: db.memos, items: db.items,
    proposals: db.proposals.filter(function (p) { return p.status === 'open'; }),
    briefings: briefings, ios: db.ios, lastRun: db.lastRun, exportedAt: db.exportedAt || '', outboxErrors: (db.outboxErrors || []).slice(-5),
    folders: { root: f.root.getId(), inbox: f.inbox.getId(), pending: f.pending.getId() },
    passkeys: passkeyList_()
  };
}

function backupDaily_(db) {
  var today = today_();
  if (db.backupAt === today) return;
  var f = folders_();
  var dir = childFolder_(f.system, HIBI.BACKUP);
  dir.createFile('db-' + today + '.json', JSON.stringify(db), 'application/json');
  var files = [], it = dir.getFiles();
  while (it.hasNext()) { var x = it.next(); if (!x.isTrashed()) files.push(x); }
  files.sort(function (a, b) { return a.getName() < b.getName() ? 1 : -1; });
  files.slice(7).forEach(function (x) { x.setTrashed(true); });
  db.backupAt = today;
  touch_(db);
}

/* ───── フォルダ ───── */

function folders_() {
  if (FOLDERS_) return FOLDERS_;
  var props = PropertiesService.getScriptProperties();
  var ids = {}, changed = false;
  try { ids = JSON.parse(props.getProperty('FOLDERS') || '{}'); } catch (e) { ids = {}; }
  function get(key, name, parent) {
    var folder = null;
    if (ids[key]) { try { folder = DriveApp.getFolderById(ids[key]); if (folder.isTrashed()) folder = null; } catch (e) { folder = null; } }
    if (!folder) { folder = childFolder_(parent, name); ids[key] = folder.getId(); changed = true; }
    return folder;
  }
  var root = get('root', HIBI.ROOT, DriveApp.getRootFolder());
  var system = get('system', HIBI.SYSTEM, root);
  var outbox = get('outbox', HIBI.OUTBOX, system);
  FOLDERS_ = {
    root: root, system: system, outbox: outbox,
    inbox: get('inbox', HIBI.INBOX, root),
    pending: get('pending', HIBI.PENDING, root),
    organized: get('organized', HIBI.ORGANIZED, root),
    applied: get('applied', HIBI.APPLIED, outbox),
    thumbs: get('thumbs', HIBI.THUMBS, system),
    originals: get('originals', HIBI.ORIGINALS, system)
  };
  if (changed) props.setProperty('FOLDERS', JSON.stringify(ids));
  return FOLDERS_;
}

/** parent の中の name フォルダ（ゴミ箱は除く）。なければつくる */
function childFolder_(parent, name) {
  var it = parent.getFoldersByName(name);
  while (it.hasNext()) { var f = it.next(); if (!f.isTrashed()) return f; }
  return parent.createFolder(name);
}

var CAT_CACHE_ = {};
function categoryFolder_(name) {
  if (CAT_CACHE_[name]) return CAT_CACHE_[name];
  var props = PropertiesService.getScriptProperties();
  var map = {};
  try { map = JSON.parse(props.getProperty('CAT_FOLDERS') || '{}'); } catch (e) { map = {}; }
  var folder = null;
  if (map[name]) { try { folder = DriveApp.getFolderById(map[name]); if (folder.isTrashed()) folder = null; } catch (e) { folder = null; } }
  if (!folder) {
    folder = childFolder_(folders_().organized, name);
    map[name] = folder.getId();
    props.setProperty('CAT_FOLDERS', JSON.stringify(map));
  }
  CAT_CACHE_[name] = folder;
  return folder;
}

/** 受信箱（full のときは確認待ち・整理済みも）を見て、知らないファイルを登録し、置き場所が変わったものを直す */
function scanFolders_(db, full) {
  var f = folders_();
  var known = {};
  db.items.forEach(function (i) { known[i.fileId] = i; });
  var n = 0;
  function scan(folder, status, category) {
    var it = folder.getFiles();
    while (it.hasNext()) {
      var file = it.next();
      if (file.isTrashed()) continue;
      var item = known[file.getId()];
      if (full && status === 'inbox' && isHeic_(file) && (!item || hoursSince_(item.createdAt) < 48)) {
        // HEIC は Claude が読めないので JPEG にする。ドライブのプレビューができるまでは、1時間ごとの見回りでやり直す（48時間まで）
        var jpg = convertHeic_(file, folder);
        if (jpg) {
          if (item) { item.fileId = jpg.getId(); item.name = jpg.getName(); item.mime = jpg.getMimeType(); item.size = jpg.getSize(); }
          else item = registerFile_(db, jpg, 'drive', status);
          item.originalFileId = file.getId();
          known[jpg.getId()] = item;
          n++;
        } else if (!item) {
          item = registerFile_(db, file, 'drive', status);
          known[file.getId()] = item;
          n++;
        }
        continue;
      }
      if (!item) {
        item = registerFile_(db, file, 'drive', status);
        if (category) { item.category = category; item.categorySource = 'folder'; }
        known[item.fileId] = item;
        n++;
      } else {
        if (item.status !== status && item.status !== 'archived') { item.status = status; n++; }
        if (category && item.category !== category && item.categorySource !== 'manual') { item.category = category; item.categorySource = item.categorySource || 'folder'; n++; }
      }
    }
  }
  scan(f.inbox, 'inbox');
  if (full) {
    scan(f.pending, 'pending');
    db.settings.categories.forEach(function (c) { scan(categoryFolder_(c.name), 'organized', c.name); });
  }
  if (n) { db.exportDirty = true; touch_(db); }
  return n;
}

function registerFile_(db, file, source, status) {
  var mime = file.getMimeType();
  var item = {
    id: 'i_' + uid_(), fileId: file.getId(), name: file.getName(), mime: mime,
    kind: /^image\//.test(mime) ? 'photo' : mime === 'application/pdf' ? 'pdf' : 'file',
    size: file.getSize(), title: stripExt_(file.getName()), summary: '', text: '', note: '',
    category: '', categorySource: '', tags: [], dates: [], dateNotes: {}, important: false,
    status: status || 'inbox', source: source || 'drive', createdAt: iso_(file.getDateCreated()), updatedAt: nowIso_()
  };
  db.items.push(item);
  return item;
}

function moveTo_(fileId, folder) {
  var file = safeFile_(fileId);
  if (!file) return false;
  var parents = file.getParents();
  while (parents.hasNext()) { if (parents.next().getId() === folder.getId()) return true; }
  file.moveTo(folder);
  return true;
}

function hasOutbox_() {
  var it = folders_().outbox.getFiles();
  while (it.hasNext()) { if (!it.next().isTrashed()) return true; }
  return false;
}

/* ───── Claude との受け渡し ───── */

/** _system/claudeから にある Claude の結果（JSON）を取り込み、取り込み済み に移す。取り込んだ数を返す */
function applyOutbox_(db) {
  var f = folders_();
  var it = f.outbox.getFiles(), files = [];
  while (it.hasNext()) { var x = it.next(); if (!x.isTrashed()) files.push(x); }
  files.sort(function (a, b) { return a.getName() < b.getName() ? -1 : 1; });
  var n = 0;
  files.forEach(function (file) {
    var id = file.getId();
    if (db.applied.indexOf(id) < 0) {
      var out = readClaudeJson_(file);
      if (out) { applyClaudeOut_(db, out); n++; }
      else {
        db.outboxErrors = (db.outboxErrors || []).concat([{ at: nowIso_(), name: file.getName() }]).slice(-10);
        touch_(db);
      }
      db.applied.push(id);
      if (db.applied.length > 400) db.applied = db.applied.slice(-400);
    }
    try { file.moveTo(f.applied); } catch (e) { /* 移せなくても、applied に記録したので二重には取り込まない */ }
  });
  if (n) { db.exportDirty = true; touch_(db); }
  return n;
}

function readClaudeJson_(file) {
  var text = '';
  try {
    if (file.getMimeType() === MimeType.GOOGLE_DOCS) text = DocumentApp.openById(file.getId()).getBody().getText();
    else text = file.getBlob().getDataAsString('UTF-8');
  } catch (e) { return null; }
  text = String(text).replace(/^\uFEFF/, '');
  var a = text.indexOf('{'), b = text.lastIndexOf('}');
  if (a < 0 || b < a) return null;
  try { return JSON.parse(text.slice(a, b + 1)); } catch (e) { return null; }
}

function applyClaudeOut_(db, out) {
  var date = normDate_(out.date) || today_();
  var at = validIso_(out.runAt) || nowIso_();
  var counts = { files: 0, memos: 0, proposals: 0 };
  if (out.briefing && typeof out.briefing === 'object') {
    db.briefings[date] = Object.assign(sanitizeBriefing_(out.briefing), { runAt: at });
    var keys = Object.keys(db.briefings).sort();
    keys.slice(0, Math.max(0, keys.length - 60)).forEach(function (k) { delete db.briefings[k]; });
  }
  (Array.isArray(out.files) ? out.files : []).forEach(function (r) { if (applyFileResult_(db, r)) counts.files++; });
  (Array.isArray(out.memos) ? out.memos : []).forEach(function (r) { if (applyMemoResult_(db, r)) counts.memos++; });
  (Array.isArray(out.proposals) ? out.proposals : []).forEach(function (p) { if (addProposal_(db, p)) counts.proposals++; });
  ensurePendingProposals_(db);
  db.lastRun = { at: at, date: date, files: counts.files, memos: counts.memos, proposals: counts.proposals, notes: clip_(out.notes || '', 400) };
  touch_(db);
}

function applyFileResult_(db, r) {
  if (!r || !r.fileId) return false;
  var file = safeFile_(r.fileId);
  var item = findItemByFile_(db, r.fileId);
  if (!item) { if (!file) return false; item = registerFile_(db, file, 'drive', 'inbox'); }
  if (r.title) item.title = clip_(r.title, 80);
  if (r.summary) item.summary = clip_(r.summary, 500);
  if (r.text) item.text = clip_(r.text, 2000);
  if (Array.isArray(r.tags)) item.tags = normTags_(r.tags);
  if (Array.isArray(r.labels)) item.labels = normTags_(r.labels);
  var cat = validCategory_(db, r.category);
  var confident = r.status ? r.status === 'organized' : !!cat && (r.confidence == null || Number(r.confidence) >= CONFIDENT_);
  if (confident && r.important === true) item.important = true;
  if (confident) addDates_(item, r.dates);
  else item.suggestedDates = normDateList_(r.dates);
  item.claude = { at: nowIso_(), confidence: r.confidence == null ? null : Number(r.confidence) };
  if (item.categorySource === 'manual') {
    // 自分で決めた分類はそのまま
  } else if (confident && cat) {
    item.category = cat; item.categorySource = 'claude'; item.status = 'organized'; item.suggestedCategory = '';
    if (file) moveTo_(item.fileId, categoryFolder_(cat));
  } else if (item.status !== 'archived') {
    item.status = 'pending'; item.suggestedCategory = cat || '';
    if (file) moveTo_(item.fileId, folders_().pending);
  }
  item.updatedAt = nowIso_();
  return true;
}

function applyMemoResult_(db, r) {
  var memo = r && findById_(db.memos, r.id);
  if (!memo) return false;
  if (r.title) memo.title = clip_(r.title, 60);
  if (Array.isArray(r.tags)) memo.tags = normTags_(r.tags);
  var cat = validCategory_(db, r.category);
  var confident = r.status ? r.status === 'organized' : !!cat && (r.confidence == null || Number(r.confidence) >= CONFIDENT_);
  if (memo.categorySource !== 'manual') {
    if (confident && cat) { memo.category = cat; memo.categorySource = 'claude'; memo.needsDecision = false; memo.suggestedCategory = ''; }
    else { memo.needsDecision = true; memo.suggestedCategory = cat || ''; }
  }
  if (confident) addDates_(memo, r.dates);
  memo.claudeAt = nowIso_();
  return true;
}

/** Claude の提案を、アプリに出す「確認してほしいこと」に加える（同じ相手・同じ種類の古い提案は置きかえる） */
function addProposal_(db, p) {
  if (!p || !p.question || !Array.isArray(p.options) || !p.options.length) return false;
  var target = normTarget_(db, p.target);
  if (!target) return false;
  var options = p.options.slice(0, 6).map(function (o) {
    if (typeof o === 'string') o = { label: o };
    return o && o.label ? { label: clip_(o.label, 60), patch: sanitizePatch_(db, o.patch), ios: sanitizeIos_(o.ios) } : null;
  }).filter(Boolean);
  if (!options.length) return false;
  var prop = {
    id: 'p_' + uid_(), createdAt: nowIso_(), kind: clip_(p.kind || 'other', 20), question: clip_(p.question, 200),
    context: clip_(p.context || '', 600), target: target, options: options, rule: p.rule ? clip_(p.rule, 160) : '', status: 'open'
  };
  db.proposals = db.proposals.filter(function (x) { return !(x.status === 'open' && x.kind === prop.kind && sameTarget_(x.target, target)); });
  db.proposals.push(prop);
  // 終わった提案は 200 件まで残す
  var done = db.proposals.filter(function (x) { return x.status !== 'open'; });
  if (done.length > 200) {
    var drop = {}; done.slice(0, done.length - 200).forEach(function (x) { drop[x.id] = 1; });
    db.proposals = db.proposals.filter(function (x) { return !drop[x.id]; });
  }
  return true;
}

/** 決めきれなかったもの（確認待ち）に提案がなければ、分類を選ぶ提案をつくる */
function ensurePendingProposals_(db) {
  var cats = db.settings.categories.map(function (c) { return c.name; });
  function catOptions(suggested) {
    var list = suggested && cats.indexOf(suggested) >= 0 ? [suggested] : [];
    cats.forEach(function (c) { if (list.indexOf(c) < 0 && list.length < 5) list.push(c); });
    return list.map(function (c) { return { label: c, patch: { category: c } }; });
  }
  db.items.forEach(function (i) {
    if (i.status !== 'pending' || i.categorySource === 'manual' || i.noAsk) return;
    var t = { type: 'file', itemId: i.id, fileId: i.fileId };
    if (hasOpenProposal_(db, t)) return;
    addProposal_(db, { kind: 'category', target: t, question: '「' + (i.title || i.name) + '」はどの分類にしますか？',
      context: i.summary || 'Claude では決めきれませんでした。', options: catOptions(i.suggestedCategory) });
  });
  db.memos.forEach(function (m) {
    if (!m.needsDecision || m.categorySource === 'manual' || m.archived || m.noAsk) return;
    var t = { type: 'memo', id: m.id };
    if (hasOpenProposal_(db, t)) return;
    addProposal_(db, { kind: 'category', target: t, question: 'このメモはどの分類にしますか？', context: clip_(m.text, 120), options: catOptions(m.suggestedCategory) });
  });
}

function normTarget_(db, t) {
  t = t || {};
  var type = String(t.type || 'none');
  if (type === 'file') {
    var item = t.itemId ? findById_(db.items, t.itemId) : findItemByFile_(db, t.fileId || t.id);
    if (!item) {
      var file = safeFile_(t.fileId || t.id);
      if (!file) return null;
      item = registerFile_(db, file, 'drive', 'pending');
    }
    return { type: 'file', itemId: item.id, fileId: item.fileId };
  }
  if (type === 'memo') return findById_(db.memos, t.id) ? { type: 'memo', id: t.id } : null;
  if (type === 'mail') return { type: 'mail', threadId: clip_(t.threadId || t.id || '', 40), url: safeUrl_(t.url) || '', subject: clip_(t.subject || '', 120) };
  return { type: 'none' };
}

function sameTarget_(a, b) {
  if (!a || !b || a.type !== b.type) return false;
  if (a.type === 'file') return a.itemId === b.itemId;
  if (a.type === 'memo') return a.id === b.id;
  if (a.type === 'mail') return !!a.threadId && a.threadId === b.threadId;
  return false;
}

function hasOpenProposal_(db, t) {
  return db.proposals.some(function (p) { return p.status === 'open' && sameTarget_(p.target, t); });
}

function removeProposalsFor_(db, t) {
  db.proposals = db.proposals.filter(function (p) { return !(p.status === 'open' && sameTarget_(p.target, t)); });
}

function sanitizePatch_(db, p) {
  p = p || {};
  var out = {};
  if (p.category != null) { var c = validCategory_(db, p.category); if (c) out.category = c; }
  if (p.dates != null) out.dates = normDates_(p.dates);
  if (p.addDates != null) out.addDates = normDateList_(p.addDates);
  if (p.removeDates != null) out.removeDates = normDates_(p.removeDates);
  if (p.important != null) out.important = truthy_(p.important);
  if (p.title) out.title = clip_(p.title, 80);
  if (p.tags != null) out.tags = normTags_(p.tags);
  if (p.archive != null) out.archive = truthy_(p.archive);
  return out;
}

function sanitizeIos_(x) {
  if (!x || typeof x !== 'object') return null;
  var type = x.type === 'event' ? 'event' : x.type === 'reminder' ? 'reminder' : null;
  if (!type || !x.title) return null;
  var out = { type: type, title: clip_(x.title, 120), notes: clip_(x.notes || '', 500) };
  if (type === 'reminder') { var d = parseDateLoose_(x.due); out.due = d ? d.ymd + (d.hm ? ' ' + d.hm : '') : ''; }
  else {
    var s = parseDateLoose_(x.start), e = parseDateLoose_(x.end);
    if (!s) return null;
    out.allDay = truthy_(x.allDay) || !s.hm;
    out.start = s.ymd + (out.allDay ? '' : ' ' + (s.hm || '09:00'));
    out.end = e ? e.ymd + (out.allDay ? '' : ' ' + (e.hm || s.hm || '10:00')) : (out.allDay ? s.ymd : s.ymd + ' ' + addHour_(s.hm || '09:00'));
    out.location = clip_(x.location || '', 120);
  }
  return out;
}

/** 提案で選んだもの・アプリでの変更を、ファイルやメモに当てる。{item} か {memo} を返す */
function applyPatch_(db, target, patch) {
  if (!target || !patch) return null;
  var now = nowIso_();
  if (target.type === 'file') {
    var item = findById_(db.items, target.itemId);
    if (!item) return null;
    if (patch.category != null) {
      var cat = validCategory_(db, patch.category);
      if (cat) {
        item.category = cat; item.categorySource = 'manual'; item.suggestedCategory = '';
        if (item.status !== 'archived') item.status = 'organized';
        moveTo_(item.fileId, categoryFolder_(cat));
      } else if (patch.category === '') {
        item.category = ''; item.categorySource = ''; item.status = 'inbox';
        moveTo_(item.fileId, folders_().inbox);
      }
    }
    commonPatch_(item, patch);
    if (patch.note != null) item.note = clip_(patch.note, 1000);
    if (patch.archive != null) item.status = truthy_(patch.archive) ? 'archived' : (item.category ? 'organized' : 'inbox');
    item.updatedAt = now;
    return { item: item };
  }
  if (target.type === 'memo') {
    var memo = findById_(db.memos, target.id);
    if (!memo) return null;
    if (patch.category != null) {
      var c = validCategory_(db, patch.category);
      memo.category = c; memo.categorySource = c ? 'manual' : ''; memo.needsDecision = false; memo.suggestedCategory = '';
    }
    commonPatch_(memo, patch);
    if (patch.archive != null) memo.archived = truthy_(patch.archive);
    memo.updatedAt = now;
    return { memo: memo };
  }
  return null;
}

function commonPatch_(rec, patch) {
  if (patch.dates != null) rec.dates = normDates_(patch.dates);
  if (patch.addDates != null) addDates_(rec, patch.addDates);
  if (patch.removeDates != null) {
    var rm = normDates_(patch.removeDates);
    rec.dates = (rec.dates || []).filter(function (d) { return rm.indexOf(d) < 0; });
  }
  if (patch.important != null) rec.important = truthy_(patch.important);
  if (patch.title) rec.title = clip_(patch.title, 80);
  if (patch.tags != null) rec.tags = normTags_(patch.tags);
}

function sanitizeBriefing_(b) {
  function list(a, n, map) { return (Array.isArray(a) ? a : []).slice(0, n).map(map).filter(Boolean); }
  function news(x) { return x && x.title ? { title: clip_(x.title, 140), summary: clip_(x.summary || '', 400), source: clip_(x.source || '', 60), url: safeUrl_(x.url) || '' } : null; }
  return {
    summary: clip_(b.summary || '', 800),
    gmail: list(b.gmail, 15, function (x) {
      return x && (x.subject || x.summary) ? { subject: clip_(x.subject || '', 140), from: clip_(x.from || '', 80), summary: clip_(x.summary || '', 400),
        action: clip_(x.action || '', 40), due: normDate_(x.due) || '', url: safeUrl_(x.url) || '', threadId: clip_(x.threadId || '', 40) } : null;
    }),
    ai: list(b.ai, 10, news),
    news: list(b.news, 10, news),
    notes: clip_(b.notes || '', 400)
  };
}

/** Claude が読むデータを、Google ドキュメント「claudeへ」に書く */
function writeExport_(db) {
  var f = folders_();
  var doc = null, id = prop_('EXPORT_DOC_ID');
  if (id) { var x = safeFile_(id); if (x) { try { doc = DocumentApp.openById(id); } catch (e) { doc = null; } } }
  if (!doc) {
    var it = f.system.getFilesByName(HIBI.EXPORT);
    while (it.hasNext()) { var y = it.next(); if (!y.isTrashed() && y.getMimeType() === MimeType.GOOGLE_DOCS) { doc = DocumentApp.openById(y.getId()); break; } }
  }
  if (!doc) {
    doc = DocumentApp.create(HIBI.EXPORT);
    DriveApp.getFileById(doc.getId()).moveTo(f.system);
  }
  setProp_('EXPORT_DOC_ID', doc.getId());
  var text = '（このドキュメントは「ひびの手帳」が自動で書きかえます。Claude の朝の整理が読みます。手で直さないでください）\n' +
    JSON.stringify(buildExport_(db), null, 1);
  doc.getBody().setText(text);
  doc.saveAndClose();
  db.exportDirty = false;
  db.exportedAt = nowIso_();
  touch_(db);
}

function buildExport_(db) {
  var f = folders_();
  var today = today_(), tomorrow = addDays_(today, 1);
  var catFolders = {};
  db.settings.categories.forEach(function (c) { catFolders[c.name] = categoryFolder_(c.name).getId(); });
  var memos = db.memos.filter(function (m) {
    return !m.archived && !m.category && m.categorySource !== 'manual' && !m.claudeAt && !hasOpenProposal_(db, { type: 'memo', id: m.id });
  }).slice(-40).map(function (m) {
    return { id: m.id, text: clip_(m.text, 600), dates: m.dates, important: m.important, createdAt: m.createdAt };
  });
  var hints = db.items.filter(function (i) { return i.status === 'inbox'; }).slice(0, 25)
    .map(function (i) { return { fileId: i.fileId, name: i.name, createdAt: i.createdAt, note: i.note, dates: i.dates, ocr: clip_(i.ocr || '', 1500) }; });
  return {
    schema: 'hibi-export/1',
    generatedAt: nowIso_(),
    timezone: HIBI.TZ,
    today: today,
    folders: { root: f.root.getId(), inbox: f.inbox.getId(), pending: f.pending.getId(), organized: f.organized.getId(), outbox: f.outbox.getId(), categories: catFolders },
    categories: db.settings.categories,
    rules: db.settings.rules,
    briefing: db.settings.briefing,
    memosToClassify: memos,
    inboxHints: hints,
    pendingCount: db.items.filter(function (i) { return i.status === 'pending'; }).length,
    openProposals: db.proposals.filter(function (p) { return p.status === 'open'; }).slice(-30).map(function (p) { return { kind: p.kind, target: p.target, question: p.question }; }),
    recentDecisions: db.decisions.slice(-20),
    agenda: {
      syncedAt: db.ios.syncedAt || '',
      today: eventsOn_(db, today), tomorrow: eventsOn_(db, tomorrow),
      reminders: db.ios.reminders.filter(function (r) { return r.due && r.due <= addDays_(today, 3); }).slice(0, 30)
    },
    lastRun: db.lastRun
  };
}

function eventsOn_(db, ymd) {
  return db.ios.events.filter(function (e) { return e.d0 <= ymd && ymd <= e.d1; }).slice(0, 30)
    .map(function (e) { return { title: e.title, time: e.allDay ? '終日' : e.t0 + (e.t1 ? '-' + e.t1 : ''), cal: e.cal, loc: e.loc }; });
}

/* ───── カレンダー購読（ICS） ───── */

function buildIcs_(db) {
  var lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//hibi-techo//ja', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'X-WR-CALNAME:ひびの手帳', 'X-WR-TIMEZONE:' + HIBI.TZ, 'REFRESH-INTERVAL;VALUE=DURATION:PT1H', 'X-PUBLISHED-TTL:PT1H'];
  var stamp = Utilities.formatDate(new Date(), 'UTC', "yyyyMMdd'T'HHmmss'Z'");
  var appUrl = (db.settings.appUrl || HIBI.APP_URL || '').replace(/#.*$/, '');
  var from = addDays_(today_(), -60), to = addDays_(today_(), 400);
  function add(uid, ymd, summary, desc) {
    if (ymd < from || ymd > to) return;
    lines.push('BEGIN:VEVENT', 'UID:' + uid + '@hibi', 'DTSTAMP:' + stamp, 'DTSTART;VALUE=DATE:' + ymd.replace(/-/g, ''),
      'DTEND;VALUE=DATE:' + addDays_(ymd, 1).replace(/-/g, ''), 'SUMMARY:' + icsText_(summary), 'TRANSP:TRANSPARENT');
    if (desc) lines.push('DESCRIPTION:' + icsText_(desc));
    if (appUrl) lines.push('URL:' + appUrl + '#/day/' + ymd);
    lines.push('END:VEVENT');
  }
  db.memos.forEach(function (m) {
    if (m.archived) return;
    (m.dates || []).forEach(function (d) { add(m.id + '-' + d, d, (m.important ? '★' : '') + '📝 ' + memoTitle_(m), clip_(m.text, 1000)); });
  });
  db.items.forEach(function (i) {
    if (i.status === 'archived') return;
    (i.dates || []).forEach(function (d) {
      add(i.id + '-' + d, d, (i.important ? '★' : '') + (i.kind === 'pdf' ? '📄 ' : '📷 ') + (i.title || i.name),
        [i.dateNotes && i.dateNotes[d], i.summary, i.note].filter(Boolean).join('\n'));
    });
  });
  lines.push('END:VCALENDAR');
  return lines.map(foldLine_).join('\r\n') + '\r\n';
}

function icsText_(s) {
  return String(s == null ? '' : s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/** ICS の1行は 75 バイトまで（UTF-8）。こえたら折り返す（続きの行は空白で始める） */
function foldLine_(line) {
  var out = [], cur = '', bytes = 0, limit = 75;
  Array.from(line).forEach(function (ch) {
    var c = ch.codePointAt(0), b = c < 0x80 ? 1 : c < 0x800 ? 2 : c < 0x10000 ? 3 : 4;
    if (bytes + b > limit) { out.push(cur); cur = ' '; bytes = 1; limit = 75; }
    cur += ch; bytes += b;
  });
  out.push(cur);
  return out.join('\r\n');
}

/* ───── iPhone から届く予定・リマインダー ───── */

/** 配列・1件の辞書・JSON の文字列・「辞書を改行でつないだ文字列」のどれでも受け取る */
function parseList_(v) {
  if (v == null || v === '') return [];
  if (Array.isArray(v)) {
    var out = [];
    v.forEach(function (x) { if (typeof x === 'string') out = out.concat(parseList_(x)); else if (x && typeof x === 'object') out.push(x); });
    return out;
  }
  if (typeof v === 'object') return [v];
  var s = String(v).trim();
  if (!s) return [];
  try { var j = JSON.parse(s); return Array.isArray(j) ? parseList_(j) : (j && typeof j === 'object' ? [j] : []); } catch (e) { /* 次へ */ }
  try { return parseList_(JSON.parse('[' + s.replace(/\}\s*\n\s*\{/g, '},{') + ']')); } catch (e) { /* 次へ */ }
  return s.split(/\n/).map(function (line) { try { return JSON.parse(line); } catch (e) { return null; } }).filter(function (x) { return x && typeof x === 'object'; });
}

function looksFilled_(v) {
  if (v == null) return false;
  if (Array.isArray(v)) return v.length > 0;
  var s = String(v).trim();
  return !!s && s !== '[]' && s !== '{}';
}

function pick_(o, keys) {
  for (var i = 0; i < keys.length; i++) { if (o[keys[i]] != null && o[keys[i]] !== '') return o[keys[i]]; }
  return null;
}

function normEvent_(e) {
  if (!e || typeof e !== 'object') return null;
  var s = parseDateLoose_(pick_(e, ['start', 'startDate', '開始日', '開始']));
  if (!s) return null;
  var en = parseDateLoose_(pick_(e, ['end', 'endDate', '終了日', '終了'])) || s;
  var allDay = truthy_(pick_(e, ['allDay', 'all_day', 'isAllDay', '終日']));
  if (!allDay && s.hm === '00:00' && (en.hm === '00:00' || en.hm === '23:59') && en.ymd > s.ymd) allDay = true;
  if (!s.hm) allDay = true;
  var d1 = en.ymd;
  if (en.hm === '00:00' && en.ymd > s.ymd) d1 = addDays_(en.ymd, -1);   // 0:00 終わり（翌日の 0 時）は前の日まで
  if (d1 < s.ymd) d1 = s.ymd;
  var title = String(pick_(e, ['title', 'タイトル', 'name', 'summary']) || '').trim();
  return { title: clip_(title || '（無題）', 120), d0: s.ymd, d1: d1, t0: allDay ? '' : s.hm, t1: allDay ? '' : en.hm, allDay: allDay,
    cal: clip_(pick_(e, ['cal', 'calendar', 'カレンダー']) || '', 40),
    loc: clip_(String(pick_(e, ['loc', 'location', '場所']) || '').replace(/\s*\n\s*/g, ' '), 120) };
}

function normReminder_(r) {
  if (!r || typeof r !== 'object') return null;
  var title = String(pick_(r, ['title', 'タイトル', 'name']) || '').trim();
  if (!title) return null;
  var d = parseDateLoose_(pick_(r, ['due', 'dueDate', '期日', '日時']));
  var p = String(pick_(r, ['prio', 'priority', '優先度']) || '').trim().toLowerCase();
  var prio = /high|高|^[1-4]$|^!!!/.test(p) ? 3 : /medium|中|^5$|^!!$/.test(p) ? 2 : /low|低|^[6-9]$|^!$/.test(p) ? 1 : 0;
  return { title: clip_(title, 160), due: d ? d.ymd : '', dueTime: d && d.hm && d.hm !== '00:00' ? d.hm : '', list: clip_(pick_(r, ['list', 'リスト']) || '', 40),
    prio: prio, flag: truthy_(pick_(r, ['flag', 'flagged', 'isFlagged', 'フラグ'])), notes: clip_(pick_(r, ['notes', 'メモ']) || '', 200) };
}

/* ───── サムネイル・ファイル ───── */

function saveThumb_(item, dataUrl) {
  try {
    var m = /^data:([^;,]+)?(?:;base64)?,(.*)$/.exec(String(dataUrl));
    var b64 = m ? m[2] : String(dataUrl);
    var bytes = Utilities.base64Decode(b64.replace(/\s+/g, ''));
    if (bytes.length > 300 * 1024) return;
    var old = item.thumbFileId && safeFile_(item.thumbFileId);
    if (old) old.setTrashed(true);
    var t = folders_().thumbs.createFile(Utilities.newBlob(bytes, (m && m[1]) || 'image/jpeg', item.id + '.jpg'));
    item.thumbFileId = t.getId();
  } catch (e) { console.warn('サムネイルを保存できなかった', e); }
}

function makeThumb_(item) {
  var f = safeFile_(item.fileId);
  if (!f) return null;
  var blob = null;
  try { blob = f.getThumbnail(); } catch (e) { blob = null; }
  if (!blob && item.kind === 'photo' && f.getSize() < 400 * 1024 && /jpe?g|png|gif|webp/.test(item.mime)) blob = f.getBlob();
  if (!blob) return null;
  var t = folders_().thumbs.createFile(blob.setName(item.id + '.' + (/png/.test(blob.getContentType()) ? 'png' : 'jpg')));
  item.thumbFileId = t.getId();
  return t.getBlob();
}

/** 受信箱・確認待ちの写真と PDF に、Google の文字認識（OCR）をかけて item.ocr に入れる。1回 limit 件まで。かけた数を返す
    （Claude のドライブの道具だけだと、入れたばかりの写真の文字が読めないことがあるため。Claude には claudeへ で渡す） */
function ocrPending_(db, limit) {
  var start = Date.now(), n = 0;
  for (var i = 0; i < db.items.length && n < limit; i++) {
    var it = db.items[i];
    if (it.ocrAt || (it.status !== 'inbox' && it.status !== 'pending')) continue;
    if (!/^image\/(jpe?g|png|gif)$|^application\/pdf$/.test(it.mime)) continue;
    if (Date.now() - start > 200000) break;   // 1回の実行は 6 分まで。余裕を残す
    var file = safeFile_(it.fileId);
    it.ocr = file ? ocrText_(file) : '';
    it.ocrAt = nowIso_();
    n++;
  }
  if (n) { db.exportDirty = true; touch_(db); }
  return n;
}

/** ファイルを Google ドキュメントに変えるときの文字認識で、中の文字を読む（2MB まで。読めなければ ''）。変えたドキュメントは捨てる */
function ocrText_(file) {
  try {
    var blob = file.getBlob();
    var bytes = blob.getBytes();
    if (bytes.length > 2 * 1024 * 1024) return '';
    var boundary = 'hibi' + uid_();
    var meta = { name: 'hibi-ocr-' + file.getId(), mimeType: MimeType.GOOGLE_DOCS, parents: [folders_().system.getId()] };
    var head = '--' + boundary + '\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n' + JSON.stringify(meta) +
      '\r\n--' + boundary + '\r\nContent-Type: ' + (blob.getContentType() || 'application/octet-stream') + '\r\n\r\n';
    var payload = Utilities.newBlob(head).getBytes().concat(bytes).concat(Utilities.newBlob('\r\n--' + boundary + '--').getBytes());
    var res = UrlFetchApp.fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&ocrLanguage=ja&fields=id', {
      method: 'post', contentType: 'multipart/related; boundary=' + boundary, payload: payload,
      headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() }, muteHttpExceptions: true });
    if (res.getResponseCode() !== 200) return '';
    var id = JSON.parse(res.getContentText()).id;
    var text = '';
    try { text = DocumentApp.openById(id).getBody().getText(); }
    finally { try { DriveApp.getFileById(id).setTrashed(true); } catch (e) { /* 捨てられなくても先へ */ } }
    return clip_(String(text).replace(/^[\s-]+/, '').replace(/\n{3,}/g, '\n\n').trim(), 4000);
  } catch (e) {
    console.warn('文字を読めなかった', e);
    return '';
  }
}

function isHeic_(file) { return /hei[cf]/i.test(file.getMimeType()) || /\.hei[cf]$/i.test(file.getName()); }

/** HEIC（iPhone の写真の形式）は Claude が読めないので、ドライブのプレビュー画像から JPEG をつくる。元の写真は _system/元ファイル へ */
function convertHeic_(file, folder) {
  try {
    var auth = { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() };
    var meta = JSON.parse(UrlFetchApp.fetch('https://www.googleapis.com/drive/v3/files/' + file.getId() + '?fields=thumbnailLink',
      { headers: auth, muteHttpExceptions: true }).getContentText() || '{}');
    if (!meta.thumbnailLink) return null;   // まだプレビューができていない（次の見回りでもう一度）
    var res = UrlFetchApp.fetch(meta.thumbnailLink.replace(/=s\d+[^=]*$/, '=s2048'), { headers: auth, muteHttpExceptions: true });
    if (res.getResponseCode() !== 200) return null;
    var blob = res.getBlob();
    var type = blob.getContentType() || 'image/jpeg';
    var jpg = folder.createFile(blob.setName(stripExt_(file.getName()) + (/png/.test(type) ? '.png' : '.jpg')));
    file.moveTo(folders_().originals);
    return jpg;
  } catch (e) {
    console.warn('HEIC を変換できなかった', e);
    return null;
  }
}

function detectMime_(bytes, mime, ext) {
  var b = function (i) { return bytes[i] & 0xff; };
  var asc = function (i, n) { var s = ''; for (var k = 0; k < n; k++) s += String.fromCharCode(b(i + k)); return s; };
  if (bytes.length > 4) {
    if (b(0) === 0xff && b(1) === 0xd8 && b(2) === 0xff) return 'image/jpeg';
    if (b(0) === 0x89 && asc(1, 3) === 'PNG') return 'image/png';
    if (asc(0, 4) === '%PDF') return 'application/pdf';
    if (asc(0, 3) === 'GIF') return 'image/gif';
    if (asc(0, 4) === 'RIFF' && asc(8, 4) === 'WEBP') return 'image/webp';
    if (asc(4, 4) === 'ftyp' && /heic|heix|hevc|mif1|msf1|heis/.test(asc(8, 4))) return 'image/heic';
  }
  if (mime && /^[\w.+-]+\/[\w.+-]+$/.test(mime)) return mime;
  var map = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', pdf: 'application/pdf', heic: 'image/heic', gif: 'image/gif', webp: 'image/webp' };
  return map[String(ext || '').toLowerCase().replace(/^\./, '')] || 'application/octet-stream';
}

function fileName_(name, ext, mime) {
  var base = String(name || '').trim().replace(/[\\/:*?"<>|\r\n]+/g, '_').slice(0, 80);
  if (!base) base = (/^image\//.test(mime) ? '写真_' : '資料_') + Utilities.formatDate(new Date(), HIBI.TZ, 'yyyyMMdd_HHmmss');
  var want = { 'image/jpeg': 'jpg', 'image/png': 'png', 'application/pdf': 'pdf', 'image/heic': 'heic', 'image/gif': 'gif', 'image/webp': 'webp' }[mime] ||
    String(ext || '').replace(/^\./, '').toLowerCase();
  if (want && !new RegExp('\\.' + want + '$', 'i').test(base) && !(want === 'jpg' && /\.jpe?g$/i.test(base))) base = stripExt_(base) + '.' + want;
  return base;
}

/* ───── 小道具 ───── */

function json_(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }

function parseRequest_(e) {
  var req = {};
  var body = e && e.postData && e.postData.contents;
  if (body) {
    try { req = JSON.parse(body); } catch (err) { req = {}; }
    if (!req || typeof req !== 'object' || Array.isArray(req)) req = {};
  }
  var p = (e && e.parameter) || {};
  Object.keys(p).forEach(function (k) { if (req[k] == null) req[k] = p[k]; });
  return req;
}

function prop_(k) { return PropertiesService.getScriptProperties().getProperty(k) || ''; }
function setProp_(k, v) { if (prop_(k) !== v) PropertiesService.getScriptProperties().setProperty(k, v); }
function uid_() { return Utilities.getUuid().replace(/-/g, '').slice(0, 12); }
function nowIso_() { return Utilities.formatDate(new Date(), HIBI.TZ, "yyyy-MM-dd'T'HH:mm:ssXXX"); }
function iso_(d) { return d ? Utilities.formatDate(d, HIBI.TZ, "yyyy-MM-dd'T'HH:mm:ssXXX") : nowIso_(); }
function today_() { return Utilities.formatDate(new Date(), HIBI.TZ, 'yyyy-MM-dd'); }
function clip_(s, n) { s = s == null ? '' : String(s); return s.length > n ? s.slice(0, n - 1) + '…' : s; }
function truthy_(v) { return v === true || v === 1 || /^(true|yes|1|はい|on|オン|y)$/i.test(String(v == null ? '' : v).trim()); }
function findById_(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }
function findItemByFile_(db, fileId) { for (var i = 0; i < db.items.length; i++) if (db.items[i].fileId === fileId) return db.items[i]; return null; }
function validId_(id, prefix) { return typeof id === 'string' && id.indexOf(prefix) === 0 && /^[a-z]_[A-Za-z0-9_-]{6,40}$/.test(id) ? id : ''; }
function validIso_(s) { return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s) ? s : ''; }
function stripExt_(n) { return String(n || '').replace(/\.[A-Za-z0-9]{1,5}$/, ''); }
function extOf_(n) { var m = /\.([A-Za-z0-9]{1,5})$/.exec(String(n || '')); return m ? m[1].toLowerCase() : ''; }
function base64url_(s) { return Utilities.base64EncodeWebSafe(s, Utilities.Charset.UTF_8).replace(/=+$/, ''); }
function memoTitle_(m) { return clip_(m.title || String(m.text || '').split('\n')[0].trim() || 'メモ', 40); }
function safeUrl_(u) { u = String(u || '').trim(); return /^https?:\/\/[^\s<>"']+$/i.test(u) ? u.slice(0, 500) : ''; }
function hoursSince_(iso) { var t = new Date(iso).getTime(); return isNaN(t) ? 1e9 : (Date.now() - t) / 3600000; }
function addHour_(hm) { var p = String(hm).split(':'); var h = Math.min(23, Number(p[0]) + 1); return (h < 10 ? '0' : '') + h + ':' + (p[1] || '00'); }

function safeFile_(id) {
  if (!id) return null;
  try { var f = DriveApp.getFileById(id); return f.isTrashed() ? null : f; } catch (e) { return null; }
}

function validCategory_(db, name) {
  name = String(name || '').trim();
  if (!name) return '';
  var cats = db.settings.categories;
  for (var i = 0; i < cats.length; i++) if (cats[i].name === name) return name;
  return '';
}

function normTags_(v) {
  var list = Array.isArray(v) ? v : String(v || '').split(/[,、\s]+/);
  var out = [];
  list.forEach(function (t) { t = clip_(String(t).replace(/^#/, '').trim(), 20); if (t && out.indexOf(t) < 0) out.push(t); });
  return out.slice(0, 10);
}

/** 日付の一覧を 'YYYY-MM-DD' の並びにする（重複なし・昇順・30 件まで） */
function normDates_(v) {
  return normDateList_(v).map(function (x) { return x.date; }).filter(function (d, i, a) { return a.indexOf(d) === i; }).sort().slice(0, 30);
}

/** [{date, reason}] にする。'2026-10-30'・'10/30'・{date:'…', reason:'…'}・'2026-10-30,2026-11-06' のどれでもよい */
function normDateList_(v) {
  if (v == null || v === '') return [];
  var list = Array.isArray(v) ? v : String(v).split(/[,、\n]+|\s{2,}/);
  var out = [];
  list.forEach(function (x) {
    var raw = x && typeof x === 'object' && !(x instanceof Date) ? x.date : x;
    var d = parseDateLoose_(raw);
    if (d) out.push({ date: d.ymd, reason: x && typeof x === 'object' && x.reason ? clip_(x.reason, 60) : '' });
  });
  return out;
}

function addDates_(rec, v) {
  var list = normDateList_(v);
  if (!list.length) return;
  rec.dates = normDates_((rec.dates || []).concat(list.map(function (x) { return x.date; })));
  list.forEach(function (x) { if (x.reason) { rec.dateNotes = rec.dateNotes || {}; rec.dateNotes[x.date] = x.reason; } });
}

function normDate_(v) { var d = parseDateLoose_(v); return d ? d.ymd : ''; }

/** いろいろな書き方の日付・日時を {ymd:'2026-10-30', hm:'09:30' or ''} にする。読めなければ null */
function parseDateLoose_(v) {
  if (v == null || v === '') return null;
  if (Object.prototype.toString.call(v) === '[object Date]') {
    return isNaN(v.getTime()) ? null : { ymd: Utilities.formatDate(v, HIBI.TZ, 'yyyy-MM-dd'), hm: Utilities.formatDate(v, HIBI.TZ, 'HH:mm') };
  }
  var s = String(v).trim().replace(/[０-９]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0xfee0); }).replace(/[：]/g, ':').replace(/[／]/g, '/');
  // 時差つきの ISO 8601（ショートカットの「ISO 8601」の形）は、日本時間に直す
  if (/^\d{4}-\d{2}-\d{2}T\d{1,2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})$/.test(s)) {
    var d = new Date(s.replace(/([+-]\d{2})(\d{2})$/, '$1:$2'));
    if (!isNaN(d.getTime())) return { ymd: Utilities.formatDate(d, HIBI.TZ, 'yyyy-MM-dd'), hm: Utilities.formatDate(d, HIBI.TZ, 'HH:mm') };
  }
  var y, mo, da, h = null, mi = 0;
  var m = /^(\d{4})[-/.年](\d{1,2})[-/.月](\d{1,2})日?/.exec(s);
  if (m) { y = +m[1]; mo = +m[2]; da = +m[3]; }
  else {
    m = /^(\d{1,2})[/月](\d{1,2})日?/.exec(s);
    if (!m) return null;
    y = +Utilities.formatDate(new Date(), HIBI.TZ, 'yyyy'); mo = +m[1]; da = +m[2];
  }
  var rest = s.slice(m[0].length);
  var t = /(\d{1,2})(?::|時)(\d{2})?/.exec(rest.replace(/[(（][^)）]*[)）]/g, ' '));
  if (t) { h = +t[1]; mi = t[2] ? +t[2] : 0; if (/午後|PM/i.test(rest) && h < 12) h += 12; }
  if (mo < 1 || mo > 12 || da < 1 || da > 31 || (h != null && (h > 24 || mi > 59))) return null;
  var check = new Date(Date.UTC(y, mo - 1, da));
  if (check.getUTCMonth() !== mo - 1) return null;
  var p2 = function (n) { return (n < 10 ? '0' : '') + n; };
  return { ymd: y + '-' + p2(mo) + '-' + p2(da), hm: h == null ? '' : p2(Math.min(h, 23)) + ':' + p2(mi) };
}

function addDays_(ymd, n) {
  var p = String(ymd).split('-');
  var d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2] + n));
  return d.getUTCFullYear() + '-' + ('0' + (d.getUTCMonth() + 1)).slice(-2) + '-' + ('0' + d.getUTCDate()).slice(-2);
}
