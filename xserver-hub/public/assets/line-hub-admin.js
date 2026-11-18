// LINE配信ハブの管理画面（持ち運べる部品）。外部ライブラリなし・ビルド不要。
//
//   <line-hub-admin></line-hub-admin>
//   el.api = async (action, params) => 結果            ※ 必須。管理 API（src/admin-rpc.js）の呼び方。失敗は Error（message を画面に出す）で投げる
//   el.refresh()                                       ※ 画面を読み直す
//   el.onTick = async () => {}                         ※ 任意。あれば、送信状況に「今すぐ送信処理を回す」ボタンが出る（デモ用。本番は cron が毎分回す）
//   el.onOpenFriend = (userId) => {}                   ※ 任意。あれば、友だちの詳細に「この人のスマホを開く」ボタンが出る（デモ用）
//   el.addEventListener('lh-changed', …)               ※ 書き込みのあとに飛ぶ（呼び出し側が、自分の表示を読み直したいとき）
//
//   createHttpApi({ url, getToken })                    ※ 管理 API（POST {url}）を呼ぶ api を作る。getToken は Authorization: Bearer に入れるトークンを返す
//
// 作りの方針：
//   ・Shadow DOM の中に閉じる（呼び出し側のサイトの CSS と、お互いに影響しない。会員サイトにも、別の団体の画面にも載せられる）
//   ・表示する文字は、すべて textContent で入れる（友だちの表示名などに含まれる HTML は、ただの文字になる）
//   ・見た目は、:host の CSS 変数（--lh-ink など）で上書きできる。theme="light" / "dark" で明暗を固定できる（既定は OS の設定に従う）

const CSS = `
:host { --lh-bg: #f3f5f7; --lh-card: #ffffff; --lh-ink: #1f2933; --lh-sub: #66727f; --lh-line: #e3e8ee; --lh-soft: #f7f9fb;
  --lh-green: #06c755; --lh-green-d: #049a41; --lh-green-bg: #e7f8ee; --lh-blue: #2563eb; --lh-blue-bg: #e8effd;
  --lh-red: #d92d20; --lh-red-bg: #fdecea; --lh-amber: #b45309; --lh-amber-bg: #fef3e2; --lh-gray-bg: #eef1f4;
  display: block; min-width: 0; max-width: 100%; color: var(--lh-ink); color-scheme: light; font: 14px/1.55 -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Noto Sans JP", sans-serif; }
@media (prefers-color-scheme: dark) { :host(:not([theme="light"])) { color-scheme: dark; --lh-bg: #12171c; --lh-card: #1b222a; --lh-ink: #e7ecf1; --lh-sub: #93a1ae; --lh-line: #2b3541; --lh-soft: #202932;
  --lh-green: #2bd673; --lh-green-d: #1fb85e; --lh-green-bg: #12301f; --lh-blue: #7aa2ff; --lh-blue-bg: #1c2a4a; --lh-red: #ff7a70; --lh-red-bg: #3a1c19; --lh-amber: #f5b25c; --lh-amber-bg: #3a2a12; --lh-gray-bg: #26303a; } }
:host([theme="dark"]) { color-scheme: dark; --lh-bg: #12171c; --lh-card: #1b222a; --lh-ink: #e7ecf1; --lh-sub: #93a1ae; --lh-line: #2b3541; --lh-soft: #202932;
  --lh-green: #2bd673; --lh-green-d: #1fb85e; --lh-green-bg: #12301f; --lh-blue: #7aa2ff; --lh-blue-bg: #1c2a4a; --lh-red: #ff7a70; --lh-red-bg: #3a1c19; --lh-amber: #f5b25c; --lh-amber-bg: #3a2a12; --lh-gray-bg: #26303a; }
* { box-sizing: border-box; }
button, input, select, textarea { font: inherit; color: inherit; }
select { background-color: var(--lh-card); border: 1px solid var(--lh-line); border-radius: 8px; padding: 4px 8px; }
.wrap { background: var(--lh-card); border: 1px solid var(--lh-line); border-radius: 12px; overflow: hidden; }
.top { display: flex; flex-wrap: wrap; gap: 10px 22px; align-items: center; padding: 10px 14px; border-bottom: 1px solid var(--lh-line); background: var(--lh-soft); }
.meter { min-width: 240px; flex: 1 1 240px; } .meter .bar { height: 8px; border-radius: 5px; background: var(--lh-gray-bg); overflow: hidden; display: flex; }
.meter .bar i { display: block; height: 100%; background: var(--lh-green); } .meter .bar i.res { background: repeating-linear-gradient(45deg, #b8c2cc, #b8c2cc 3px, transparent 3px, transparent 6px); }
.meter small { color: var(--lh-sub); font-size: 12px; }
.ctl { display: flex; gap: 14px; align-items: center; flex-wrap: wrap; margin-left: auto; }
.btn { border: 1px solid var(--lh-line); background: var(--lh-card); border-radius: 8px; padding: 6px 12px; cursor: pointer; }
.btn:hover { background: var(--lh-soft); } .btn.pri { background: var(--lh-green); border-color: var(--lh-green); color: #fff; font-weight: 700; } .btn.pri:hover { background: var(--lh-green-d); }
.btn.sm { padding: 3px 9px; font-size: 12.5px; } .btn.danger { color: var(--lh-red); } .btn.pri.danger { background: var(--lh-red); border-color: var(--lh-red); color: #fff; } .btn:disabled { opacity: .5; cursor: not-allowed; }
.sw { position: relative; display: inline-flex; align-items: center; gap: 6px; cursor: pointer; user-select: none; }
.sw input { appearance: none; -webkit-appearance: none; width: 34px; height: 20px; border-radius: 10px; background: #b8c2cc; position: relative; cursor: pointer; transition: .15s; margin: 0; }
.sw input::after { content: ""; position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 50%; background: #fff; transition: .15s; }
.sw input:checked { background: var(--lh-green); } .sw input:checked::after { left: 16px; } .sw.warn input:checked { background: var(--lh-red); }
.tabs { display: flex; gap: 2px; padding: 8px 10px 0; border-bottom: 1px solid var(--lh-line); flex-wrap: wrap; }
.tab { border: 0; background: none; padding: 8px 12px; border-bottom: 3px solid transparent; cursor: pointer; color: var(--lh-sub); font-weight: 600; }
.tab.on { color: var(--lh-ink); border-bottom-color: var(--lh-green); }
.panel { padding: 14px; overflow-x: auto; }
table { width: 100%; border-collapse: collapse; } th, td { text-align: left; padding: 7px 8px; border-bottom: 1px solid var(--lh-line); vertical-align: top; }
th { color: var(--lh-sub); font-weight: 600; font-size: 12px; white-space: nowrap; } tbody tr.click { cursor: pointer; } tbody tr.click:hover { background: var(--lh-soft); }
.badge { display: inline-block; padding: 1px 8px; border-radius: 999px; font-size: 11.5px; background: var(--lh-gray-bg); color: var(--lh-sub); white-space: nowrap; }
.badge.green { background: var(--lh-green-bg); color: var(--lh-green-d); } .badge.blue { background: var(--lh-blue-bg); color: var(--lh-blue); }
.badge.red { background: var(--lh-red-bg); color: var(--lh-red); } .badge.amber { background: var(--lh-amber-bg); color: var(--lh-amber); }
.tagx { display: inline-flex; align-items: center; gap: 3px; background: var(--lh-blue-bg); color: var(--lh-blue); border-radius: 6px; padding: 0 7px; margin: 1px 3px 1px 0; font-size: 12px; }
.tagx button { border: 0; background: none; cursor: pointer; color: inherit; padding: 0 0 0 2px; }
.toolbar { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin-bottom: 10px; }
.toolbar input, .toolbar select, .f input, .f select, .f textarea, .inp { padding: 6px 9px; border-radius: 8px; border: 1px solid var(--lh-line); background: var(--lh-card); }
.item { border: 1px solid var(--lh-line); border-radius: 10px; padding: 10px 12px; margin-bottom: 10px; background: var(--lh-card); }
.item.off { opacity: .55; } .item h3 { margin: 0 0 4px; font-size: 14px; display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.item .sub { color: var(--lh-sub); font-size: 12.5px; } .item .acts { margin-top: 6px; display: flex; gap: 6px; flex-wrap: wrap; }
.steps { margin: 6px 0 0; padding: 0; list-style: none; } .steps li { display: flex; gap: 8px; padding: 3px 0; align-items: baseline; } .steps .when { min-width: 150px; color: var(--lh-sub); font-size: 12.5px; }
.f { display: grid; gap: 10px; } .f label { display: grid; gap: 3px; font-weight: 600; font-size: 12.5px; } .f label span { font-weight: 400; color: var(--lh-sub); }
.f .two { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; } .f textarea { min-height: 90px; font-family: inherit; }
.est { padding: 9px 12px; border-radius: 10px; background: var(--lh-soft); border: 1px solid var(--lh-line); } .est.ok { background: var(--lh-green-bg); border-color: var(--lh-green); } .est.ng { background: var(--lh-red-bg); border-color: var(--lh-red); }
dialog { border: 1px solid var(--lh-line); border-radius: 14px; background: var(--lh-card); color: var(--lh-ink); padding: 0; width: min(720px, 94vw); max-height: 90vh; }
dialog::backdrop { background: rgba(10, 20, 30, .45); }
dialog .dh { padding: 12px 16px; border-bottom: 1px solid var(--lh-line); display: flex; align-items: center; gap: 10px; } dialog .dh h3 { margin: 0; flex: 1; font-size: 15px; }
dialog .db { padding: 14px 16px; overflow: auto; max-height: calc(90vh - 120px); } dialog .df { padding: 10px 16px; border-top: 1px solid var(--lh-line); display: flex; gap: 8px; justify-content: flex-end; align-items: center; }
textarea.json { width: 100%; min-height: 300px; font: 12.5px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace; padding: 10px; border-radius: 8px; border: 1px solid var(--lh-line); background: var(--lh-soft); color: var(--lh-ink); }
.err { color: var(--lh-red); background: var(--lh-red-bg); border-radius: 8px; padding: 6px 10px; margin-top: 8px; white-space: pre-wrap; }
.toasts { position: fixed; right: 16px; bottom: 16px; display: flex; flex-direction: column; gap: 8px; z-index: 20; }
.t { background: #1f2933; color: #fff; padding: 9px 14px; border-radius: 10px; box-shadow: 0 6px 20px rgba(0,0,0,.25); max-width: 420px; white-space: pre-wrap; } .t.err { background: var(--lh-red); }
.muted { color: var(--lh-sub); } .grow { flex: 1; }
.kv { display: grid; grid-template-columns: 110px 1fr; gap: 4px 10px; } .kv dt { color: var(--lh-sub); } .kv dd { margin: 0; }
h4 { margin: 14px 0 6px; font-size: 13px; } .empty { color: var(--lh-sub); padding: 14px 4px; }
.mono { font-family: ui-monospace, Menlo, monospace; font-size: 12px; }
.box { border: 1px solid var(--lh-line); border-radius: 10px; padding: 10px; background: var(--lh-soft); display: grid; gap: 8px; }
.box > .hd { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
.row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.msgrow { display: flex; gap: 6px; align-items: flex-start; } .msgrow textarea { flex: 1; min-width: 0; min-height: 64px; width: 100%; padding: 6px 9px; border-radius: 8px; border: 1px solid var(--lh-line); background: var(--lh-card); font-family: inherit; }
.msgrow .side { display: grid; gap: 4px; }
.fm { display: grid; gap: 12px; } .fm label { display: grid; gap: 3px; font-weight: 600; font-size: 12.5px; } .fm label > span { font-weight: 400; color: var(--lh-sub); }
.fm input, .fm select, .fm textarea { padding: 6px 9px; border-radius: 8px; border: 1px solid var(--lh-line); background: var(--lh-card); } .fm textarea { width: 100%; font-family: inherit; }
.fm input[type=number] { width: 84px; } .fm input[type=time] { width: 120px; } .fm input[type=checkbox] { padding: 0; }
.fm .chk { display: flex; gap: 8px; align-items: center; font-weight: 400; }
.fm details > summary { cursor: pointer; font-weight: 600; font-size: 12.5px; }
.fm h4 { margin: 4px 0 0; }
.banner { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; padding: 8px 14px; font-weight: 600; border-bottom: 1px solid var(--lh-line); }
.banner.red { background: var(--lh-red-bg); color: var(--lh-red); } .banner.amber { background: var(--lh-amber-bg); color: var(--lh-amber); }
.tabs { flex-wrap: nowrap; overflow-x: auto; } .tab { white-space: nowrap; flex: none; }
td.nm { min-width: 7em; white-space: nowrap; }
dialog .df { flex-wrap: wrap; } dialog .df .btn { white-space: nowrap; }
.sw .lbl { font-size: 12px; color: var(--lh-sub); min-width: 2.4em; }
.help h4 { margin: 14px 0 4px; } .help p, .help ul { margin: 4px 0; } .help ul { padding-left: 1.3em; }
.pager { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin: 10px 0 0; } .pager .grow { flex: 1; }
@media (max-width: 680px) {
  table.rt, table.rt tbody { display: block; } table.rt thead { display: none; }
  table.rt tbody { display: grid; gap: 8px; }
  table.rt tr { display: grid; gap: 2px; border: 1px solid var(--lh-line); border-radius: 10px; padding: 8px 10px; background: var(--lh-soft); }
  table.rt td { display: flex; gap: 8px; flex-wrap: wrap; align-items: baseline; border: 0; padding: 1px 0; }
  table.rt td::before { content: attr(data-label); flex: 0 0 5.2em; color: var(--lh-sub); font-size: 12px; }
  table.rt td:empty { display: none; } td.nm { min-width: 0; font-weight: 700; }
}
/* ---- 個別チャット ---- */
.tab .cnt { display: inline-block; min-width: 1.6em; padding: 0 5px; margin-left: 4px; border-radius: 999px; background: var(--lh-red); color: #fff; font-size: 11px; line-height: 1.6; text-align: center; }
.chat { display: grid; grid-template-columns: minmax(220px, 300px) minmax(0, 1fr); border: 1px solid var(--lh-line); border-radius: 12px; overflow: hidden; height: min(74vh, 720px); background: var(--lh-card); }
.rooms { border-right: 1px solid var(--lh-line); display: flex; flex-direction: column; min-height: 0; min-width: 0; }
.rooms .rtool { padding: 8px; display: grid; gap: 6px; border-bottom: 1px solid var(--lh-line); }
.rooms .rtool input, .rooms .rtool select { width: 100%; padding: 6px 9px; border-radius: 8px; border: 1px solid var(--lh-line); background: var(--lh-card); }
.rooms .rlist { overflow-y: auto; flex: 1; min-height: 0; }
.room { display: flex; gap: 9px; padding: 9px 10px; cursor: pointer; border-bottom: 1px solid var(--lh-line); align-items: center; min-width: 0; }
.room:hover { background: var(--lh-soft); } .room.on { background: var(--lh-green-bg); }
.av { width: 36px; height: 36px; border-radius: 50%; background: var(--lh-blue-bg); color: var(--lh-blue); display: grid; place-items: center; font-weight: 700; flex: none; overflow: hidden; font-size: 15px; }
.av img { width: 100%; height: 100%; object-fit: cover; display: block; }
.room .mid { flex: 1; min-width: 0; } .room .rn { font-weight: 700; display: flex; gap: 5px; align-items: center; min-width: 0; }
.room .rn span.nm3 { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.room .pv { color: var(--lh-sub); font-size: 12.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.room .rgt { display: grid; justify-items: end; gap: 3px; font-size: 11px; color: var(--lh-sub); flex: none; }
.unread { background: var(--lh-green); color: #fff; border-radius: 999px; padding: 0 7px; font-size: 11.5px; font-weight: 700; }
.thread { display: flex; flex-direction: column; min-height: 0; min-width: 0; }
.thread .th { padding: 8px 12px; border-bottom: 1px solid var(--lh-line); display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.thread .th b { font-size: 15px; }
.thread .msgs { flex: 1; overflow-y: auto; padding: 12px; background: var(--lh-soft); display: flex; flex-direction: column; gap: 8px; min-height: 0; }
.bw { display: flex; flex-direction: column; max-width: 80%; min-width: 0; } .bw.l { align-self: flex-start; } .bw.r { align-self: flex-end; align-items: flex-end; }
.b { padding: 7px 11px; border-radius: 14px; white-space: pre-wrap; word-break: break-word; overflow-wrap: anywhere; }
.bw.l .b { background: var(--lh-card); border: 1px solid var(--lh-line); border-top-left-radius: 4px; }
.bw.r .b { background: var(--lh-green-bg); border: 1px solid var(--lh-green); border-top-right-radius: 4px; }
.bw.r .b + .b, .bw.l .b + .b { margin-top: 4px; }
.bs { align-self: center; background: var(--lh-gray-bg); color: var(--lh-sub); font-size: 12px; border-radius: 999px; padding: 2px 12px; text-align: center; }
.bmeta { font-size: 11px; color: var(--lh-sub); margin: 2px 4px 0; }
.qr { display: flex; gap: 4px; flex-wrap: wrap; margin-top: 6px; } .qr span { border: 1px solid var(--lh-blue); color: var(--lh-blue); border-radius: 999px; padding: 0 8px; font-size: 12px; background: var(--lh-card); }
.composer { border-top: 1px solid var(--lh-line); padding: 8px; display: grid; gap: 6px; background: var(--lh-card); }
.composer textarea { width: 100%; min-height: 64px; max-height: 40vh; padding: 7px 10px; border-radius: 8px; border: 1px solid var(--lh-line); background: var(--lh-card); font-family: inherit; resize: vertical; }
.composer .crow { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; } .composer .hint { font-size: 12px; color: var(--lh-sub); flex: 1; min-width: 12em; }
.composer .hint.free { color: var(--lh-green-d); font-weight: 700; }
.chat .empty2 { margin: auto; color: var(--lh-sub); padding: 30px; text-align: center; }
.chat .back { display: none; }
@media (max-width: 680px) {
  .chat { grid-template-columns: minmax(0, 1fr); height: auto; }
  .chat .rooms { border-right: 0; } .chat .rooms .rlist { max-height: 62vh; }
  .chat.open .rooms { display: none; } .chat:not(.open) .thread { display: none; }
  .chat .back { display: inline-block; } .thread .msgs { max-height: 58vh; min-height: 40vh; } .bw { max-width: 92%; }
}
/* ---- 属性・アンケート・動画特典・ひな形 ---- */
.bars { display: grid; gap: 4px; margin-top: 6px; } .bar2 { display: grid; grid-template-columns: minmax(6em, 11em) minmax(0, 1fr) 3.5em; gap: 8px; align-items: center; font-size: 12.5px; }
.bar2 .tr { height: 10px; border-radius: 5px; background: var(--lh-gray-bg); overflow: hidden; } .bar2 .tr i { display: block; height: 100%; background: var(--lh-blue); }
.bar2 .lb { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } .bar2 .n { text-align: right; color: var(--lh-sub); }
.chips { display: flex; gap: 6px; flex-wrap: wrap; } .chip { display: inline-flex; align-items: center; gap: 4px; border: 1px solid var(--lh-line); border-radius: 999px; padding: 2px 10px; cursor: pointer; font-size: 12.5px; user-select: none; background: var(--lh-card); }
.chip input { margin: 0; } .chip.on { border-color: var(--lh-blue); background: var(--lh-blue-bg); color: var(--lh-blue); }
.agrp { display: grid; gap: 4px; } .agrp > b { font-size: 12.5px; }
.tpl li { margin: 3px 0; } .tpl .when { display: inline-block; min-width: 7.5em; color: var(--lh-sub); font-size: 12.5px; }
.special { border: 1px dashed var(--lh-blue); background: var(--lh-blue-bg); color: var(--lh-blue); border-radius: 8px; padding: 6px 9px; flex: 1; min-width: 0; }
.special .row { margin-top: 4px; }
.pw { font: 700 20px/1.4 ui-monospace, Menlo, monospace; letter-spacing: 1px; background: var(--lh-soft); border: 1px dashed var(--lh-line); border-radius: 10px; padding: 10px 14px; user-select: all; word-break: break-all; }
/* ---- カレンダー（日時を選ぶ） ---- */
.cal { border: 1px solid var(--lh-line); border-radius: 10px; padding: 8px; background: var(--lh-card); max-width: 360px; }
.cal .ch { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; } .cal .ch b { flex: 1; text-align: center; }
.cal table { table-layout: fixed; } .cal th, .cal td { text-align: center; padding: 2px; border: 0; }
.cal td button { width: 100%; aspect-ratio: 1 / 1; max-height: 40px; border: 1px solid transparent; border-radius: 8px; background: none; cursor: pointer; position: relative; padding: 0; }
.cal td button:hover { background: var(--lh-soft); } .cal td button.sel { background: var(--lh-green); color: #fff; font-weight: 700; }
.cal td button.today { border-color: var(--lh-green); } .cal td button:disabled { opacity: .35; cursor: default; }
.cal td button .dot { position: absolute; left: 50%; bottom: 3px; width: 5px; height: 5px; margin-left: -2.5px; border-radius: 50%; background: var(--lh-amber); }
.cal .sun { color: var(--lh-red); } .cal .sat { color: var(--lh-blue); }
.cal .cmarks { font-size: 12px; color: var(--lh-sub); margin-top: 6px; display: grid; gap: 2px; }

`;

// ---------------------------------------------------------------- 小さな道具
/** 要素を作る。文字は textContent（createTextNode）で入れる＝ HTML として解釈されない */
function h(tag, props, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'value') el.value = v;
    else if (['checked', 'disabled', 'selected', 'open'].includes(k)) el[k] = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat(3)) {
    if (kid == null || kid === false) continue;
    el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return el;
}
/** 子要素を入れ替える（配列は展開。null / false は無視） */
/** 表の各セルに、見出しの文字（data-label）を付ける。スマホ幅では、表を「1行＝1枚のカード」にして、この文字を項目名として見せる（CSS） */
function labelTable(t) {
  const heads = Array.from(t.querySelectorAll('thead th')).map((th) => th.textContent.trim());
  if (!heads.length) return;
  t.classList.add('rt');
  t.querySelectorAll('tbody tr').forEach((tr) => Array.from(tr.children).forEach((td, i) => { if (heads[i] && !td.hasAttribute('data-label')) td.setAttribute('data-label', heads[i]); }));
}
const put = (el, ...kids) => {
  el.replaceChildren(...kids.flat(3).filter((k) => k != null && k !== false).map((k) => (k.nodeType ? k : document.createTextNode(String(k)))));
  el.querySelectorAll?.('table').forEach(labelTable);
};

const fmt = (iso) => (iso ? new Date(iso).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');
const fmtLocalInput = (iso) => new Date(new Date(iso).getTime() + 9 * 3600e3).toISOString().slice(0, 16);
const WD = ['日', '月', '火', '水', '木', '金', '土'];
/** 11月3日(火) 19:00（日本時間） */
const fmtDay = (iso) => { const d = new Date(new Date(iso).getTime() + 9 * 3600e3); return `${d.getUTCMonth() + 1}月${d.getUTCDate()}日(${WD[d.getUTCDay()]}) ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`; };
const fromLocalInput = (v) => (v ? new Date(v + ':00+09:00').toISOString() : null);
const short = (s, n = 22) => {
  s = String(s ?? '').replace(/\s+/g, ' ');
  return s.length > n ? s.slice(0, n) + '…' : s;
};
const list = (s) => String(s).split(/[,、\n]/).map((x) => x.trim()).filter(Boolean);

const MODE = { exact: '完全一致', contains: '含む', regex: '正規表現' };
function describeTrigger(r) {
  if (r.trigger_type === 'follow') return '友だち追加されたとき';
  if (r.trigger_type === 'unfollow') return 'ブロックされたとき';
  const pats = String(r.pattern || '').split('\n').filter(Boolean).map((p) => `「${p}」`).join(' または ');
  if (r.trigger_type === 'tag_added') return `タグ ${pats} が付いたとき`;
  if (r.trigger_type === 'postback') return `ボタン ${pats} が押されたとき`;
  return `キーワード ${pats}（${MODE[r.match_mode]}）`;
}
function describeConditions(c) {
  const p = [];
  (c.tags_all || []).forEach((t) => p.push(`タグ「${t}」あり`));
  if ((c.tags_any || []).length) p.push(`タグ「${c.tags_any.join('」か「')}」のどれか`);
  (c.tags_none || []).forEach((t) => p.push(`タグ「${t}」なし`));
  if (c.member === 'linked') p.push('会員サイト連携済み');
  if (c.member === 'unlinked') p.push('会員サイト未連携');
  if (c.plans?.length) p.push(`プラン：${c.plans.join('・')}`);
  if (c.min_rank != null) p.push(`会員ランク${c.min_rank}以上`);
  Object.entries(c.fields || {}).forEach(([k, v]) => p.push(`${k}＝${v}`));
  Object.entries(c.attrs || {}).forEach(([g, vs]) => { if (vs?.length) p.push(`${g}：${vs.join('・')}`); });
  return p.join('、');
}
function describeAction(a) {
  const first = (m) => short(typeof m?.[0] === 'string' ? m[0] : m?.[0]?.text ?? '');
  switch (a.type) {
    case 'reply': return `返信（${a.messages.length}件）「${first(a.messages)}」${a.messages.map((m) => specialLabel(m)).filter(Boolean).map((l) => `＋［${l}］`).join('')}`;
    case 'push': return `プッシュ「${first(a.messages)}」`;
    case 'tag_add': return `タグを付ける「${a.tag}」`;
    case 'tag_remove': return `タグを外す「${a.tag}」`;
    case 'field_set': return `友だち情報 ${a.key}＝${a.value}`;
    case 'enroll': return `ステップ配信に登録「${a.scenario}」`;
    case 'unenroll': return `ステップ配信を止める「${a.scenario}」`;
    case 'event_apply': return `イベントに申し込む「${a.event}」`;
    case 'notify_admin': return '運営に通知';
    case 'survey_start': return `アンケートを始める「${a.survey}」`;
    case 'bonus_claim': return `動画特典を渡す「${a.offer}」`;
    default: return a.type;
  }
}
function describeStep(s) {
  if (s.anchor === 'fixed') return s.fixedAt ? `${fmtDay(s.fixedAt)}（日時を指定）` : '日時を指定（未入力）';
  const t = s.atTime ? ` ${s.atTime}` : '';
  const m = s.offsetMinutes ? (s.offsetMinutes < 0 ? `${-s.offsetMinutes}分前` : `${s.offsetMinutes}分後`) : '';
  if (s.anchor === 'event') return s.offsetDays ? `イベントの${-s.offsetDays}日前${t}` : `イベントの${m || '開始時'}`;
  if (!s.offsetDays && !s.atTime && !s.offsetMinutes) return '登録直後';
  if (!s.offsetDays && !s.atTime) return `登録の${m}`;
  return `${s.offsetDays}日後${t}${m ? ' ' + m : ''}`;
}
const STATUS_CLASS = { sent: 'green', queued: 'blue', sending: 'blue', failed: 'red', skipped: 'amber', dry_run: 'amber', active: 'green', blocked: 'red', pending: 'blue', completed: 'green', scheduled: 'blue', applied: 'green' };
const STATUS_LABEL = { sent: '送信済み', queued: '待ち', sending: '送信中', failed: '失敗', skipped: '見送り', dry_run: '練習（送らない）', active: '友だち', blocked: 'ブロック', pending: '予定', completed: '完了', stopped: '停止', draft: '下書き', scheduled: '予約', canceled: '取消', applied: '申込済み' };
const statusBadge = (s) => h('span', { class: 'badge ' + (STATUS_CLASS[s] || '') }, STATUS_LABEL[s] || s);
const SOURCE_LABEL = { notification: '会員通知', broadcast: '一斉配信', scenario: 'ステップ配信', rule: 'ルール', reply_fallback: '返信の代わり', manual: '手動', zoom: 'Zoom の出欠', chat: 'チャット', notify: '運営への知らせ', survey: 'アンケート', video_offer: '動画特典', event_picker: '日程を選ぶ' };

const STOP_REASON = { unfollow: 'ブロックされたため止まりました', stop_tag: '「止めるタグ」が付いたため止まりました', rule: 'ルールで止めました', canceled: 'イベントの申込を取り消したため止まりました', replied: '返事があったので止まりました（反応で分かれる）' };
const SKIP_REASON = { past_due: '時刻が過ぎていたため送りません', unfollow: 'ブロックされたため送りません', stop_tag: '「止めるタグ」が付いたため送りません', condition_or_blocked: '送る条件に合わない（またはブロック中）ため送りません', replied: '返事があったので送りません（反応で分かれる）', special_unavailable: 'アンケート・動画特典が見つからないか止めているため送りません', too_late: '予定より大きく遅れたため送りません', event_started: 'イベントが始まったため送りません' };
const ROLE_LABEL = { owner: 'オーナー', admin: '管理者', operator: '担当者（チャット）', viewer: '閲覧のみ' };
const KIND_LABEL2 = { attribute: '属性', survey: 'アンケート', scenario: 'ステップ配信', rule: 'ルール', video: '動画特典' };
/** メッセージの出どころ（scenario:1:10:1 のような記録）→ 日本語 */
const sourceLabel = (src) => SOURCE_LABEL[String(src || '').split(':')[0]] || (src ? String(src) : '');
const AUDIT_LABEL = {
  'tags.add': 'タグを付けた', 'tags.remove': 'タグを外した', 'fields.set': '友だち情報を設定', 'rules.save': 'ルールを保存', 'rules.setEnabled': 'ルールの有効／無効', 'rules.delete': 'ルールを削除',
  'scenarios.save': 'ステップ配信を保存', 'scenarios.setEnabled': 'ステップ配信の有効／無効', 'events.save': 'イベントを保存', 'events.reschedule': 'イベントの日程を変更', 'events.cancelApplication': '申込を取り消し',
  'events.finalizeAttendance': '出欠を確定', 'events.linkZoomParticipant': 'Zoom の参加者を友だちに結んだ', 'broadcasts.create': '一斉配信を作成', 'broadcasts.send': '一斉配信を送信', 'broadcasts.cancel': '一斉配信を取り消し',
  'outbox.cancel': '送信を取り消し', 'outbox.requeue': '失敗した送信をやり直し', testSend: '運営にテスト送信', 'settings.update': '設定を変更',
  'chat.send': 'チャットで送った', 'chat.sendSpecial': 'チャットでアンケート・動画を送った', 'chat.setNeedsReply': '要対応の印', 'attributes.save': '属性を保存', 'attributes.delete': '属性を削除', 'attributes.set': '友だちの属性を設定',
  'surveys.save': 'アンケートを保存', 'surveys.setEnabled': 'アンケートの有効／無効', 'surveys.delete': 'アンケートを削除', 'videos.save': '動画特典を保存', 'videos.setEnabled': '動画特典の有効／無効',
  'templates.apply': 'ひな形から作成', 'scenarios.enrollAudience': 'ステップ配信にまとめて登録', 'events.createSeries': '毎週の日程をまとめて作成',
  'members.add': '運営メンバーを追加', 'members.setRole': '運営メンバーの役割を変更', 'members.remove': '運営メンバーを外した', 'members.resetPassword': '仮パスワードを作り直した', 'account.passwordChanged': 'パスワードを変えた',
};

const RULE_TPL = {
  'キーワードに返信': { name: '新しいキーワード', trigger_type: 'keyword', match_mode: 'exact', pattern: 'キーワード', priority: 100, actions: [{ type: 'reply', messages: ['返信の文章'] }] },
  '友だち追加の歓迎': { name: '歓迎メッセージ', trigger_type: 'follow', priority: 10, actions: [{ type: 'reply', messages: ['{{display_name}}さん、ようこそ！'] }] },
  'キーワードでタグ付け＋返信': { name: '関心タグ', trigger_type: 'keyword', match_mode: 'contains', pattern: '教材\n時短', priority: 100, actions: [{ type: 'tag_add', tag: '関心あり' }, { type: 'reply', messages: ['ありがとうございます。資料をお送りします。'] }] },
  '会員だけに返信': { name: '会員向けの案内', trigger_type: 'keyword', pattern: '会員', priority: 50, conditions: { member: 'linked' }, actions: [{ type: 'reply', messages: ['会員サイトはこちらです。\n{{site_url}}'] }] },
  'キーワードで日程を選んでもらう': { name: '日程の案内', trigger_type: 'keyword', match_mode: 'exact', pattern: '#ZOOM教員会', priority: 50, actions: [{ type: 'reply', messages: ['ZOOM教員会のご案内です。', { type: 'event_picker', keyPrefix: 'kyoinkai-' }] }] },
  'キーワードでアンケートを始める': { name: 'アンケート', trigger_type: 'keyword', match_mode: 'exact', pattern: 'アンケート', priority: 50, actions: [{ type: 'survey_start', survey: '' }] },
};

const TABS = [['chat', 'チャット'], ['friends', '友だち'], ['attrs', '属性・アンケート'], ['rules', 'ルール'], ['scenarios', 'ステップ配信'], ['videos', '動画特典'], ['events', 'イベント'], ['broadcasts', '一斉配信'], ['outbox', '送信状況'], ['settings', '設定'], ['members', '運営メンバー'], ['audit', '操作の記録']];
/** タブを見せるのに要る権限（無い人には、タブを出さない） */
const TAB_PERM = { members: 'members' };

// ---------------------------------------------------------------- フォーム編集の下ごしらえ
// 画面の入力と、ルール・ステップ配信の JSON のあいだの変換。画面（DOM）を持たないので、単体でテストできる。
// 方針：フォームが知っている項目だけを書き換え、知らない項目（条件の plans・fields、画像のメッセージなど）は、そのまま持ち回る。

/** メッセージ1件の文字。文字（text）以外（画像・Flex など）は null＝フォームでは編集しない */
export const messageText = (m) => (typeof m === 'string' ? m : m && m.type === 'text' ? String(m.text ?? '') : null);
/** 文字を書き換えたメッセージ。もとがオブジェクトなら、ほかの項目は残す。もとが文字列なら、文字列のまま */
export const withMessageText = (m, t) => (m && typeof m === 'object' ? { ...m, text: t } : t);
export const textToList = list;
export const listToText = (a) => (Array.isArray(a) ? a.join('、') : '');

/** ステップの「いつ」を、画面の入力に分ける。dir：'after'（後）／'before'（前＝日数・分が負）。mixed：日数と分の向きが逆（フォームでは編集しない） */
export function timingOf(s) {
  const d = Number(s.offsetDays || 0);
  const m = Number(s.offsetMinutes || 0);
  return { anchor: s.anchor === 'event' ? 'event' : 'enrolled', dir: d < 0 || m < 0 ? 'before' : 'after', days: Math.abs(d), minutes: Math.abs(m), atTime: s.atTime || '', mixed: (d > 0 && m < 0) || (d < 0 && m > 0) };
}
/** 画面の入力から、ステップの「いつ」を書き戻す（ほかの項目は残す）。「前」はイベント基準のときだけ */
export function withTiming(s, t) {
  const sign = t.anchor === 'event' && t.dir === 'before' ? -1 : 1;
  const out = { ...s, anchor: t.anchor, offsetDays: sign * Math.trunc(Number(t.days) || 0) || 0, offsetMinutes: sign * Math.trunc(Number(t.minutes) || 0) || 0 };
  if (t.atTime) out.atTime = t.atTime;
  else delete out.atTime;
  return out;
}

/** イベント：保存済みの1件（events.list の行）→ 画面の入力（文字だけ）。e が無ければ、まっさらな入力 */
export function eventToDraft(e) {
  return {
    key: e?.key ?? '', title: e?.title ?? '', startsAt: e?.starts_at ? fmtLocalInput(e.starts_at) : '', url: e?.url ?? '', location: e?.location ?? '',
    capacity: e?.capacity == null ? '' : String(e.capacity), tag: e?.tag ?? '', reminderScenario: e?.reminder_scenario ?? '',
    zoomMeetingId: e?.zoom_meeting_id ?? '', attendMinMinutes: e?.attend_min_minutes == null ? '10' : String(e.attend_min_minutes),
  };
}
/**
 * 画面の入力 → events.save に送る形。空は「入れない」（null）。数字でない定員などは、そのまま送って、サーバーの日本語のエラーで止める。
 * Zoom の番号：入っていれば送る／空にしたら、もとの値を消す（''）／もともと無ければ送らない。orig＝保存済みのイベント
 */
export function draftToEvent(d, orig) {
  const t = (v) => String(v ?? '').trim();
  const nz = (v) => (t(v) === '' ? null : t(v));
  const num = (v) => (/^\d+$/.test(t(v)) ? Number(t(v)) : t(v));
  const out = { key: t(d.key), title: t(d.title), startsAt: fromLocalInput(d.startsAt), url: nz(d.url), location: nz(d.location), capacity: t(d.capacity) === '' ? null : num(d.capacity), tag: nz(d.tag), reminderScenario: nz(d.reminderScenario) };
  if (t(d.zoomMeetingId) !== '') out.zoomMeetingId = t(d.zoomMeetingId);
  else if (orig?.zoom_meeting_id) out.zoomMeetingId = '';
  if (t(d.attendMinMinutes) !== '') out.attendMinMinutes = num(d.attendMinMinutes);
  return out;
}

export const TRIGGER_LABEL = { follow: '友だち追加されたとき', unfollow: 'ブロックされたとき', keyword: 'キーワードが送られたとき', postback: 'ボタンが押されたとき', tag_added: 'タグが付いたとき' };
export const ACTION_LABEL = {
  reply: '返信する（リプライ。通数に数えない）', push: 'すぐ送る（プッシュ。通数に数える）', tag_add: 'タグを付ける', tag_remove: 'タグを外す', field_set: '友だち情報を設定する',
  enroll: 'ステップ配信に登録する', unenroll: 'ステップ配信を止める', event_apply: 'イベントに申し込む', notify_admin: '運営に通知する', member_refresh: '会員情報を取り直す',
  survey_start: 'アンケートを始める（返信。通数に数えない）', bonus_claim: '動画特典を渡す（見た人・期限内だけ）',
};
/** 「やること」を、種類を切り替えたときの、まっさらな形で作る */
export function defaultAction(type, { scenarios = [], events = [], surveys = [], offers = [] } = {}) {
  switch (type) {
    case 'reply': case 'push': return { type, messages: [''] };
    case 'tag_add': case 'tag_remove': return { type, tag: '' };
    case 'field_set': return { type, key: '', value: '' };
    case 'enroll': case 'unenroll': return { type, scenario: scenarios[0]?.name ?? '' };
    case 'event_apply': return { type, event: events[0]?.key ?? '' };
    case 'notify_admin': return { type, text: '{{display_name}}さんから連絡がありました' };
    case 'survey_start': return { type, survey: surveys[0]?.name ?? '' };
    case 'bonus_claim': return { type, offer: offers[0]?.key ?? '' };
    default: return { type };
  }
}

// ---------------------------------------------------------------- 画面を持たない小さな部品（単体でテストできる）
/** 「特別なメッセージ」の印の名前（フォーム・一覧に出す） */
export function specialLabel(m) {
  if (!m || typeof m !== 'object') return null;
  if (m.type === 'survey') return `アンケート「${m.survey}」の質問（ボタンつき）`;
  if (m.type === 'video_offer') return `動画特典「${m.offer}」の動画`;
  if (m.type === 'event_picker') return `日程を選ぶボタン${m.keyPrefix ? `（キーが「${m.keyPrefix}」で始まる日程）` : '（すべての日程）'}`;
  return null;
}

/** 送ったメッセージ（LINE のメッセージの配列）→ 吹き出しの中身。{ text, choices（ボタンの文字）, kind } の配列 */
export function bubbleParts(messages) {
  return (Array.isArray(messages) ? messages : []).map((m) => {
    const choices = (m?.quickReply?.items || []).map((it) => it?.action?.label).filter(Boolean);
    if (m?.type === 'text') return { kind: 'text', text: String(m.text ?? ''), choices };
    if (m?.type === 'video') return { kind: 'video', text: '［動画］', choices };
    if (m?.type === 'image') return { kind: 'image', text: '［画像］', choices };
    if (m?.type === 'template') return { kind: 'template', text: String(m.altText ?? '［ボタン］'), choices: (m.template?.actions || []).map((a) => a?.label).filter(Boolean) };
    if (m?.type === 'flex') return { kind: 'flex', text: String(m.altText ?? '［カード］'), choices };
    if (m?.type === 'sticker') return { kind: 'sticker', text: '［スタンプ］', choices };
    const sp = specialLabel(m);
    if (sp) return { kind: 'special', text: `［${sp}］`, choices };
    return { kind: 'other', text: `［${m?.type ?? 'メッセージ'}］`, choices };
  });
}

/**
 * チャットで送るときの案内（返信の期限内なら無料・過ぎていれば1通）。win＝{ free, secondsLeft }・usage＝今月の通数（dashboard.usage）
 * @returns {{ free: boolean, text: string }}
 */
export function costHint(win, usage) {
  if (win?.free) return { free: true, text: `返信の期限内です（あと${win.secondsLeft}秒）。いま送ると、通数を使いません。` };
  const left = usage ? Math.max(0, (usage.remaining_total ?? 0)) : null;
  return { free: false, text: `送ると1通使います${left != null ? `（今月の残り ${left}通）` : ''}。無料で返したいときは、LINE公式アカウントのアプリのチャットから返せます（その返事は、ここには出ません）。` };
}

/** カレンダーの1か月（日曜はじまり）。[[{y,m,d,ymd,dow,inMonth}, …7], …]（その月の日が1つも無い週は入れない） */
export function calendarMonth(y, m) {
  const first = new Date(Date.UTC(y, m - 1, 1));
  const start = first.getTime() - first.getUTCDay() * 86400e3;
  const weeks = [];
  for (let w = 0; w < 6; w++) {
    const row = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start + (w * 7 + i) * 86400e3);
      const yy = d.getUTCFullYear(), mm = d.getUTCMonth() + 1, dd = d.getUTCDate();
      row.push({ y: yy, m: mm, d: dd, ymd: `${yy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`, dow: i, inMonth: mm === m });
    }
    if (!row.some((d) => d.inMonth)) break;
    weeks.push(row);
  }
  return weeks;
}

/** 属性のチップの選択（{ 校種: Set(['中学校']) }）→ 宛先の条件 attrs（何も選んでいない種類は入れない） */
export function attrsFromSelection(sel) {
  const out = {};
  for (const [g, set] of Object.entries(sel || {})) if (set && set.size) out[g] = [...set];
  return out;
}

/** 管理 API（POST {url}）を呼ぶ api を作る。失敗は Error（.code・.status つき）で投げる */
export function createHttpApi({ url, getToken, fetch: fetchFn = (...a) => globalThis.fetch(...a) }) {
  return async function api(action, params = {}) {
    const token = await getToken();
    let res;
    try {
      res = await fetchFn(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ action, params }),
      });
    } catch (e) {
      throw new Error('サーバーにつながりません。通信の状態を確かめてください');
    }
    let body = null;
    try {
      body = await res.json();
    } catch {
      /* JSON でない応答 */
    }
    if (res.ok && body?.ok) return body.result;
    const err = new Error(body?.error?.message || (res.status === 401 ? 'ログインが必要です' : res.status === 403 ? '管理者ではありません' : `エラーが起きました（${res.status}）`));
    err.code = body?.error?.code;
    err.status = res.status;
    throw err;
  };
}

export class LineHubAdmin extends (globalThis.HTMLElement ?? class {}) {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._api = null;
    this.meta = { adapter: 'null', plans: [] };
    this.dash = null;
    this.me = null; // 自分（me）：役割・できること（perms）・仮パスワードのままか
    this.tab = 'chat';
    this.onTick = null;
    this.onOpenFriend = null;
    this.outbox = { status: '', source: '', period: '', page: 0 }; // 送信状況の絞り込みと、いまのページ
    this._guard = null; // フォームの入力を守る：変更があるかを返す関数（無ければ null）
    this._chat = { q: '', filter: '', userId: null, drafts: new Map() }; // チャット：探す文字・絞り込み・開いている部屋・書きかけ
    this._summary = null; // 新着（chat.summary）
    this._sinceId = null; // デスクトップへの通知：ここまでは知らせた（受け取った行の id）
    this._poll = null;
    this.pollMs = 15000; // 新着を確かめる間隔
  }

  /** この権限があるか（me の perms）。me が無い（古い管理 API）ときは、全部できる扱い */
  can(perm) {
    return !this.me?.perms || this.me.perms.includes(perm);
  }

  set api(fn) {
    this._api = fn;
    if (this.isConnected) this.refresh();
  }
  get api() {
    return this._api;
  }

  connectedCallback() {
    if (this.shadowRoot.childElementCount) return;
    const root = this.shadowRoot;
    root.append(h('style', null, CSS));
    this.$top = h('div', { class: 'top' });
    this.$banner = h('div', { 'data-banners': '' });
    this.$tabs = h('div', { class: 'tabs', role: 'tablist' });
    this.$panel = h('div', { class: 'panel' });
    this.$dlg = h('dialog');
    this.$dlgTitle = h('h3');
    this.$dlgBody = h('div', { class: 'db' });
    this.$dlgFoot = h('div', { class: 'df' });
    this.$dlg.append(h('div', { class: 'dh' }, this.$dlgTitle, h('button', { class: 'btn sm', 'data-dlg-close': '', onclick: () => this.requestClose() }, '閉じる')), this.$dlgBody, this.$dlgFoot);
    this.$dlg.addEventListener('cancel', (e) => { if (this._guard?.()) { e.preventDefault(); this.requestClose(); } }); // Esc キーでも、入力が消える前に確かめる
    this.$toasts = h('div', { class: 'toasts' });
    root.append(h('div', { class: 'wrap' }, this.$top, this.$banner, this.$tabs, this.$panel), this.$dlg, this.$toasts);
    this.renderTabs();
    if (this._api) this.refresh();
    this.startPolling();
  }
  disconnectedCallback() {
    if (this._poll) clearInterval(this._poll);
    this._poll = null;
    if (this._tickTimer) clearInterval(this._tickTimer);
  }
  /** 新着（友だち追加・メッセージ）を、少しずつ確かめる。画面が裏にあるとき・ダイアログを開いているときは、休む */
  startPolling() {
    if (this._poll || !this.pollMs) return;
    this._poll = setInterval(() => {
      if (globalThis.document?.visibilityState === 'hidden') return;
      this.pollChat().catch(() => {});
    }, this.pollMs);
  }
  async pollChat() {
    if (!this._api || this.me?.mustChangePassword) return;
    const first = this._sinceId == null;
    const s = await this.call('chat.summary', first ? {} : { sinceId: this._sinceId });
    const before = this._summary;
    this._summary = s;
    if (!first && s.news?.length) this.notifyNews(s.news);
    this._sinceId = s.maxInId;
    if (!before || before.unreadTotal !== s.unreadTotal || before.unreadRooms !== s.unreadRooms) {
      this.renderTabs();
      this.dispatchEvent(new CustomEvent('lh-unread', { detail: { unreadRooms: s.unreadRooms, unreadTotal: s.unreadTotal, needsReply: s.needsReply }, bubbles: true, composed: true }));
    }
    if (this.tab === 'chat' && !this.$dlg.open && s.news?.length && !first) await this.chatReload({ keepScroll: true });
  }
  /** デスクトップへの通知（このブラウザで「知らせる」をオンにしたときだけ） */
  notifyNews(news) {
    let on = false;
    try { on = globalThis.localStorage?.getItem('lh-notify') === 'on'; } catch { /* 覚えていない */ }
    const N = globalThis.Notification;
    if (!on || !N || N.permission !== 'granted') return;
    for (const n of news.slice(0, 3).reverse()) {
      const who = n.display_name || 'お名前の分からない方';
      const body = n.kind === 'follow' ? `${who}さんが、友だち追加しました` : n.kind === 'unfollow' ? `${who}さんに、ブロックされました` : `${who}さん：${n.text || ''}`;
      try { new N('LINE配信ハブ', { body, tag: `lh-${n.id}` }); } catch { /* 通知できなくてよい */ }
    }
  }

  // ---- 呼び出しと通知 ----
  call(action, params) {
    if (!this._api) throw new Error('api が設定されていません');
    return this._api(action, params ?? {});
  }
  async write(action, params) {
    const r = await this.call(action, params);
    this.dispatchEvent(new CustomEvent('lh-changed', { detail: { action }, bubbles: true, composed: true }));
    return r;
  }
  toast(msg, kind) {
    const t = h('div', { class: 't' + (kind === 'err' ? ' err' : '') }, msg);
    this.$toasts.append(t);
    setTimeout(() => t.remove(), kind === 'err' ? 7000 : 3200);
  }
  /** 失敗を、画面の通知に出す（例外は外に出さない） */
  async act(fn) {
    try {
      return await fn();
    } catch (e) {
      this.toast(e.message, 'err');
    }
  }

  // ---- 全体の表示 ----
  async refresh() {
    if (!this._api) return;
    try {
      this.me = await this.call('me').catch(() => null);
      if (this.me?.mustChangePassword) {
        put(this.$top);
        put(this.$tabs);
        put(this.$panel, h('div', { class: 'est ng', 'data-must-change': '' }, h('b', null, 'はじめに、仮パスワードを、自分のパスワードに変えてください。'), h('div', null, '変えるまでは、ほかの操作はできません（ログインの画面の案内に従ってください）。')));
        return;
      }
      [this.meta, this.dash] = await Promise.all([this.call('meta'), this.call('dashboard')]);
    } catch (e) {
      put(this.$panel, h('div', { class: 'err' }, e.message));
      return;
    }
    this.renderTop();
    this.renderTabs();
    await this.renderTab();
    if (this._summary == null) this.pollChat().catch(() => {});
  }
  /** 上部（通数・スイッチ）だけを読み直す。いま開いているタブの入力は、そのまま */
  async refreshTop() {
    this.dash = await this.call('dashboard');
    this.renderTop();
  }
  planName(code) {
    return this.meta.plans.find((p) => p.code === code)?.name;
  }
  renderTop() {
    const d = this.dash;
    const u = d.usage;
    const pct = (n) => Math.min(100, u.cap ? (n / u.cap) * 100 : 0);
    const kill = h('input', { type: 'checkbox', checked: !d.settings.enabled, onchange: (e) => {
      const stop = e.target.checked; // 非同期のあとでは、e.target は空になる（Shadow DOM の中のイベントの決まり）。先に取っておく
      this.act(async () => {
        await this.write('settings.update', { patch: { enabled: !stop } });
        this.toast(stop ? '送信を止めました（受信と台帳は動いています）' : '送信を再開しました');
        await this.refresh();
      });
    } });
    const dry = h('input', { type: 'checkbox', checked: !!d.settings.dry_run, onchange: (e) => this.act(async () => {
      await this.write('settings.update', { patch: { dry_run: e.target.checked } });
      await this.refresh();
    }) });
    put(this.$top,
      h('div', { class: 'meter' },
        h('div', { class: 'bar' }, h('i', { style: `width:${pct(u.sent)}%` }), h('i', { class: 'res', style: `width:${pct(Math.max(0, Math.min(u.reserve, u.cap - u.sent)))}%` })),
        h('small', { 'data-usage': '' }, `今月の通数 ${u.sent} / ${u.cap}（会員通知の取り置き ${u.reserve}・販促の残り ${u.available_marketing}）`, u.dry_run ? h('span', { class: 'badge amber' }, ` dry-run分 ${u.dry_run}`) : null)),
      h('div', { class: 'ctl' },
        this.can('settings') ? h('label', { class: 'sw warn', title: 'オンにすると、LINEへの送信をすべて止めます（受信と台帳は動きます）' }, kill, h('span', null, '送信を止める')) : null,
        this.can('settings') ? h('label', { class: 'sw', title: 'オンにすると、LINEへは送らず「送るはずだった通数」だけ数えます（練習・動作確認用。dry-run）' }, dry, h('span', null, '練習モード（送らない）')) : null,
        h('button', { class: 'btn sm', title: 'LINE が数えた今月の通数と、こちらの記録を並べて確かめます（LINE に問い合わせるだけで、何も送りません）', onclick: () => this.act(() => this.checkLineQuota()) }, 'LINEと照合'),
        this.me?.role ? h('span', { class: 'badge', 'data-role': this.me.role, title: 'あなたの役割（できることが変わります）' }, `あなた：${ROLE_LABEL[this.me.role] ?? this.me.role}`) : null,
        h('button', { class: 'btn sm', title: '各タブの役割と、よくある作業の手順', 'data-help': '', onclick: () => this.helpDialog() }, '？使い方'),
        h('button', { class: 'btn sm', title: '再読み込み', onclick: () => this.refresh() }, '更新')));
    this.renderBanner();
  }
  /** 送信を止めている・練習モードのときは、画面の上に、はっきり出す（忘れたまま「送ったのに届かない」にならないように） */
  renderBanner() {
    const st = this.dash.settings;
    const back = (patch, msg) => () => this.act(async () => { await this.write('settings.update', { patch }); this.toast(msg); await this.refresh(); });
    put(this.$banner,
      !st.enabled ? h('div', { class: 'banner red', 'data-banner': 'stopped' }, '⚠ 送信を止めています。LINE へは何も送られません（受信と記録は動いています）。', h('button', { class: 'btn sm', onclick: back({ enabled: true }, '送信を再開しました') }, '送信を再開する')) : null,
      st.dry_run ? h('div', { class: 'banner amber', 'data-banner': 'dry' }, '練習モードです。LINE へは送らず、送るはずだった通数だけ数えています。', h('button', { class: 'btn sm', onclick: back({ dry_run: false }, '練習モードをやめました') }, '練習モードをやめる')) : null);
  }
  helpDialog() {
    const sec = (t, ...kids) => [h('h4', null, t), ...kids];
    this.openDialog('使い方', h('div', { class: 'help', 'data-help-body': '' },
      sec('この画面でできること', h('p', null, 'LINE 公式アカウントの友だちを見て、自動で返事をする（ルール）・日にちを決めて自動で送る（ステップ配信）・イベントの申込とリマインド・みんなへの一斉配信を、ここで決めます。')),
      sec('画面の上の見方', h('ul', null,
        h('li', null, h('b', null, '今月の通数'), '：LINE のプランで決まる、今月送れる数です。自分から送る配信（プッシュ・一斉配信・ステップ配信）が数えられます。返信（リプライ）は数えません。'),
        h('li', null, h('b', null, '送信を止める'), '：オンにすると、LINE へは何も送りません（受信と記録は動きます）。止めている間は、上に赤い帯が出ます。'),
        h('li', null, h('b', null, '練習モード'), '：オンにすると、LINE へは送らず、送るはずだった通数だけ数えます。動作の確認用です。'),
        h('li', null, h('b', null, 'LINEと照合'), '：LINE が数えた今月の通数と、こちらの記録を並べます（何も送りません）。'))),
      sec('各タブ', h('ul', null,
        h('li', null, h('b', null, 'チャット'), '：友だち1人＝1部屋。友だち追加だけの人も部屋が出ます（未読になります）。友だちのメッセージから約50秒以内に返すと「返信」で、通数を使いません。それより後は1通使います。'),
        h('li', null, h('b', null, '友だち'), '：一覧・タグ・属性・やり取り。自分を開いて「運営の通知先にする」と、テスト送信や、友だち追加の知らせが自分に届きます。'),
        h('li', null, h('b', null, '属性・アンケート'), '：校種・性別・年代・エリア・役職などを、ボタンのアンケートで聞いて、自動でタグにします（2問目からは返信なので無料）。'),
        h('li', null, h('b', null, 'ルール'), '：「友だち追加されたとき」「キーワードが送られたとき」などに、自動で返事・タグ付け・ステップ配信への登録をします。'),
        h('li', null, h('b', null, 'ステップ配信'), '：登録してから（またはイベントの開始・カレンダーで選んだ日時から）数えて、自動で順に送ります。友だち追加・タグ（例：校種:中学校）で始められ、返事があったら別のステップ配信へ分けられます。'),
        h('li', null, h('b', null, '動画特典'), '：動画を最後まで見た人にだけ、期限つきの特典を案内します。'),
        h('li', null, h('b', null, 'イベント'), '：日時・定員・リマインドを決めます。申込は、ルールの「イベントに申し込む」で受けます。'),
        h('li', null, h('b', null, '一斉配信'), '：宛先（タグなど）を絞って、みんなに送ります。'),
        h('li', null, h('b', null, '送信状況'), '：LINE に送る予定・送った記録・失敗の理由です。まだ送っていないものは、ここで取り消せます。'),
        h('li', null, h('b', null, '設定'), '：月の上限・団体名・運営の通知先。'),
        h('li', null, h('b', null, '運営メンバー'), '：管理画面を使う人と役割（オーナー・管理者・担当者・閲覧のみ）。オーナーだけに見えます。'),
        h('li', null, h('b', null, '操作の記録'), '：誰が・いつ・何をしたかの記録です。'))),
      sec('通数を節約するには', h('ul', null,
        h('li', null, h('b', null, '返信は数えません'), '：キーワード・リッチメニューのボタン・アンケートの答え・日程のボタンへの返事は、すべて無料です。友だち追加の返事に、1問目や案内を添えるのが効きます。'),
        h('li', null, h('b', null, '宛先を絞る'), '：属性やタグで、必要な人にだけ送る（例：関東の飲み会は、エリア:関東の人だけ）。'),
        h('li', null, h('b', null, 'まとめて1回に'), '：吹き出しを5つに分けても、1人1通のままです。'),
        h('li', null, h('b', null, '1人ずつ送っても、通数は同じ'), '：このツール（LINE の API）から送るものは、1人ずつでも、一斉でも、「人数×回数」で数えられます（LINE の公式の数え方）。数えられないのは、人が LINE公式アカウントのアプリのチャットで手で送るものだけです。それを機械で自動にすることは、LINE の規約で禁じられています（公式アカウントが止められる おそれがあります）。'))),
      sec('一斉配信を送る手順', h('ul', null,
        h('li', null, '先に、友だちの詳細で自分を「運営の通知先にする」。'),
        h('li', null, '「一斉配信」で、宛先の条件（空なら全員）とメッセージを入れる。画面に「宛先 ○人 → ○通を使います」と出ます。'),
        h('li', null, h('b', null, 'まず「運営にテスト送信」'), 'で、自分のスマホで見た目を確かめる（1通使います）。'),
        h('li', null, '「今すぐ送る」→ 確認の画面で、人数と文面をもう一度見て「送る」。送ったあとは取り消せません。'))),
      sec('困ったとき', h('ul', null,
        h('li', null, '送ったのに届かない → 「送信状況」で、状態と失敗の理由を見る。上に赤い帯（送信を止めている）や、練習モードの帯が出ていないか確かめる。'),
        h('li', null, '「上限を超えるため送れません」 → 宛先を絞るか、「設定」の月間の上限（LINE のプラン）を確かめる。'),
        h('li', null, 'ルールが動かない → 「ルール」で、スイッチが「有効」か、きっかけの文字が合っているか（全角・半角）を見る。上にあるルールで、先に止まっていないかも。'))),
      sec('変えられないこと', h('p', null, '送ってしまった配信は、取り消せません。迷ったら、まず「運営にテスト送信」か「練習モード」で確かめてください。'))),
      [h('button', { class: 'btn pri', onclick: () => this.closeDialog() }, '閉じる')]);
  }
  /** 「有効」スイッチ（文字つき。画面の読み上げにも、名前が伝わる） */
  enableSwitch(checked, name, onChange) {
    const lbl = h('span', { class: 'lbl' }, checked ? '有効' : '無効');
    return h('label', { class: 'sw', title: checked ? '有効です。オフにすると止まります' : '無効です。オンにすると動きます' }, h('input', { type: 'checkbox', checked, 'aria-label': `${name}を有効にする`, onchange: (e) => { lbl.textContent = e.target.checked ? '有効' : '無効'; onChange(e.target.checked); } }), lbl);
  }
  /** LINE 側が数えた今月の通数と、こちらの記録を並べて見せる */
  async checkLineQuota() {
    const r = await this.call('line.quota');
    if (!r.ok) {
      this.toast(r.message, 'err');
      return;
    }
    const lim = r.line.limit?.type === 'limited' ? `（上限 ${r.line.limit.value}通）` : r.line.limit?.type === 'none' ? '（上限なし）' : '';
    const verdict = r.match ? h('span', { class: 'badge green' }, '一致しています ✔') : h('span', { class: 'badge amber' }, r.diff > 0 ? `LINE 側が ${r.diff}通 多いです` : `LINE 側が ${-r.diff}通 少ないです`);
    this.openDialog('LINE 側の通数との照合',
      h('div', null,
        h('dl', { class: 'kv', 'data-quota': '' }, h('dt', null, 'LINE 側'), h('dd', null, `今月 ${r.line.usage}通 ${lim}`), h('dt', null, 'こちらの記録'), h('dd', null, `今月 ${r.ours.sent}通（${r.ours.ym}）`), h('dt', null, '結果'), h('dd', null, verdict)),
        h('p', { class: 'muted' }, 'リプライ（返信）は、どちらも数えません。LINE 側の数字は、反映に時間がかかることがあります（翌日になることも）。'),
        !r.match && r.diff > 0 ? h('p', { class: 'muted' }, 'こちらの記録にない送信があります。LINE 公式アカウントマネージャーから直接送った配信や、ほかのツールからの送信は、LINE 側にだけ数えられます。') : null,
        !r.match && r.diff < 0 ? h('p', { class: 'muted' }, 'LINE 側の反映待ちか、送れていないものがあるかもしれません。「送信状況」のタブで、状態とエラーを確かめてください。') : null,
        r.ours.dry_run ? h('p', { class: 'muted' }, `練習モード（dry-run）で、送るはずだった通数が ${r.ours.dry_run}通 あります。これは LINE には送っていないので、「今月」の通数には入っていません。`) : null),
      [h('button', { class: 'btn pri', onclick: () => this.closeDialog() }, '閉じる')]);
  }
  /** いま見せるタブ（権限の無いタブ・会員サイトと同居するときの「運営メンバー」は出さない） */
  visibleTabs() {
    return TABS.filter(([id]) => (!TAB_PERM[id] || this.can(TAB_PERM[id])) && !(id === 'members' && (this.me?.adminMode === 'genie' || !this.me)));
  }
  renderTabs() {
    if (!this.$tabs) return;
    const tabs = this.visibleTabs();
    if (!tabs.some(([id]) => id === this.tab)) this.tab = tabs[0]?.[0] ?? 'chat';
    const unread = this._summary?.unreadRooms ?? 0;
    put(this.$tabs, tabs.map(([id, label]) => h('button', { class: 'tab' + (this.tab === id ? ' on' : ''), role: 'tab', 'data-tab': id, 'aria-selected': String(this.tab === id), onclick: async () => {
      this.tab = id;
      this.renderTabs();
      await this.renderTab();
    } }, label, id === 'chat' && unread ? h('span', { class: 'cnt', 'data-unread': String(unread), title: `未読のある部屋 ${unread}` }, String(unread)) : null)));
    this.$tabs.querySelector('.tab.on')?.scrollIntoView?.({ inline: 'nearest', block: 'nearest' }); // 狭い画面で、選んだタブが見えない位置にあるときは、見える位置まで流す
  }
  async renderTab() {
    const fn = { chat: this.tChat, friends: this.tFriends, attrs: this.tAttrs, rules: this.tRules, scenarios: this.tScenarios, videos: this.tVideos, events: this.tEvents, broadcasts: this.tBroadcasts, outbox: this.tOutbox, settings: this.tSettings, members: this.tMembers, audit: this.tAudit }[this.tab];
    if (this._tickTimer && this.tab !== 'chat') { clearInterval(this._tickTimer); this._tickTimer = null; }
    try {
      await fn.call(this, this.$panel);
    } catch (e) {
      put(this.$panel, h('div', { class: 'err' }, e.message));
    }
  }

  // ---- ダイアログ ----
  openDialog(title, body, foot) {
    this._guard = null; // フォームは、開いたあとで、自分の見張りを付ける
    this.$dlgTitle.textContent = title;
    put(this.$dlgBody, body);
    put(this.$dlgFoot, foot || []);
    if (!this.$dlg.open) this.$dlg.showModal();
  }
  closeDialog() {
    this._guard = null;
    if (this.$dlg.open) this.$dlg.close();
  }
  /**
   * 「閉じる」「キャンセル」「Esc」。フォームに、保存していない入力があるときは、閉じる前に確かめる
   * （画面の下を「破棄して閉じる／編集を続ける」に差し替える。フォームの中身は、そのまま残る）
   */
  requestClose() {
    if (!this._guard?.()) return this.closeDialog();
    const keep = Array.from(this.$dlgFoot.childNodes);
    put(this.$dlgFoot,
      h('span', { class: 'muted', style: 'flex:1;min-width:12em', 'data-discard-msg': '' }, '入力した内容は、まだ保存されていません。閉じると消えます。'),
      h('button', { class: 'btn', 'data-keep': '', onclick: () => put(this.$dlgFoot, keep) }, '編集を続ける'),
      h('button', { class: 'btn pri danger', 'data-discard': '', onclick: () => this.closeDialog() }, '破棄して閉じる'));
  }
  askText(title, label, def) {
    return new Promise((resolve) => {
      let done = false;
      const finish = (v) => {
        if (done) return;
        done = true;
        this.closeDialog();
        resolve(v);
      };
      const inp = h('input', { class: 'inp', value: def || '', style: 'width:100%' });
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.isComposing) finish(inp.value); });
      this.openDialog(title, h('label', { class: 'f' }, label, inp), [h('button', { class: 'btn', onclick: () => finish(null) }, 'キャンセル'), h('button', { class: 'btn pri', onclick: () => finish(inp.value) }, 'OK')]);
      this.$dlg.addEventListener('close', () => finish(null), { once: true });
      inp.focus();
      inp.select();
    });
  }
  askConfirm(title, message, okLabel, { danger = false } = {}) {
    return new Promise((resolve) => {
      let done = false;
      const finish = (v) => {
        if (done) return;
        done = true;
        this.closeDialog();
        resolve(v);
      };
      this.openDialog(title, typeof message === 'string' ? h('p', { style: 'margin:0;white-space:pre-wrap' }, message) : message, [
        h('button', { class: 'btn', onclick: () => finish(false) }, 'キャンセル'),
        h('button', { class: 'btn pri' + (danger ? ' danger' : ''), onclick: () => finish(true) }, okLabel || 'OK'),
      ]);
      this.$dlg.addEventListener('close', () => finish(false), { once: true });
    });
  }
  jsonEditor({ title, value, hint, onSave, dirty = false }) {
    const ta = h('textarea', { class: 'json', spellcheck: 'false' });
    ta.value = JSON.stringify(value, null, 2);
    const initial = ta.value;
    const err = h('div', { class: 'err', style: 'display:none' });
    const save = h('button', { class: 'btn pri', onclick: async () => {
      err.style.display = 'none';
      let obj;
      try {
        obj = JSON.parse(ta.value);
      } catch (e) {
        err.textContent = 'JSON の書き方が正しくありません：' + e.message;
        err.style.display = '';
        return;
      }
      try {
        await onSave(obj);
        this.closeDialog();
        await this.refresh();
      } catch (e) {
        err.textContent = e.message;
        err.style.display = '';
      }
    } }, '保存');
    this.openDialog(title, h('div', null, hint ? h('p', { class: 'muted', style: 'margin-top:0' }, hint) : null, ta, err), [h('button', { class: 'btn', onclick: () => this.requestClose() }, 'キャンセル'), save]);
    this._guard = () => dirty || ta.value !== initial; // フォームから切り替えたときは、フォームでの変更も引き継ぐ
  }

  // ---- フォーム編集（ルール・ステップ配信）。JSON は「上級」に残す ----
  /** 文字の入力欄に、いまのカーソルの位置へ文字を入れる */
  insertAtCursor(ta, text) {
    const a = ta.selectionStart ?? ta.value.length;
    const b = ta.selectionEnd ?? ta.value.length;
    ta.setRangeText(text, a, b, 'end');
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    ta.focus();
  }
  /**
   * メッセージ（最大5件）の入力欄。messages の配列を、その場で書き換える。文字以外（画像など）のメッセージは、そのまま残す。
   * opts.vars：差し込み（{{display_name}} など）を使えるか（一斉配信は使えない）
   * opts.specials：{ surveys, offers }。あれば「＋アンケート」「＋動画特典」「＋日程を選ぶボタン」を出す（送る直前に本物のメッセージに置き換わる印）
   */
  messagesEditor(messages, again, opts = {}) {
    const vars = opts.vars !== false;
    const box = h('div', { class: 'fm', 'data-messages': '' });
    messages.forEach((m, i) => {
      const text = messageText(m);
      const del = messages.length > 1 ? h('button', { class: 'btn sm danger', type: 'button', onclick: () => { messages.splice(i, 1); again(); } }, '削除') : null;
      const sp = specialLabel(m);
      if (sp) {
        box.append(h('div', { class: 'msgrow', 'data-special': m.type },
          h('div', { class: 'special' }, `［${sp}］`,
            m.type === 'event_picker' ? h('div', { class: 'row' },
              h('span', null, 'キーの頭'), h('input', { value: m.keyPrefix ?? '', placeholder: 'kyoinkai-', style: 'width:9em', 'data-f': 'keyPrefix', oninput: (e) => { messages[i] = { ...messages[i], keyPrefix: e.target.value.trim() }; } }),
              h('span', null, '文'), h('input', { value: m.text ?? '', placeholder: '参加したい日を、下のボタンから選んでください。', style: 'flex:1;min-width:12em', 'data-f': 'pickerText', oninput: (e) => { messages[i] = { ...messages[i], text: e.target.value || undefined }; } })) : null,
            h('div', { class: 'muted', style: 'font-size:12px;margin-top:2px' }, m.type === 'video_offer' ? '最後まで見た人に、期限つきの特典を案内します（返信なので無料）' : '答え・選んだ日程は、返信で受け取ります（通数に数えない）。この回の最後に置きます')),
          h('div', { class: 'side' }, del)));
        return;
      }
      const ta = text == null ? null : h('textarea', { rows: '3', 'data-msg': String(i), placeholder: '送る文章', value: text, oninput: (e) => { messages[i] = withMessageText(messages[i], e.target.value); } });
      box.append(h('div', { class: 'msgrow' },
        ta ?? h('div', { class: 'muted', style: 'flex:1' }, `（${m?.type ?? '不明'} のメッセージです。ここでは編集できません。「JSON で編集」で変えられます）`),
        h('div', { class: 'side' },
          ta && vars ? h('button', { class: 'btn sm', type: 'button', title: '送るとき、友だちの名前に置き換わります', onclick: () => this.insertAtCursor(ta, '{{display_name}}') }, '名前を入れる') : null,
          del)));
    });
    const lastSpecial = ['survey', 'event_picker'].includes(messages[messages.length - 1]?.type);
    const add = (m) => { if (lastSpecial) { this.toast('アンケート・日程のボタンのあとには、足せません（ボタンが消えるため）。先に、その印を下へ移すか消してください', 'err'); return; } messages.push(m); again(); };
    const sp = opts.specials;
    const pick = (label, list, mk) => (list?.length ? h('select', { class: 'btn sm', 'data-add-special': label, onchange: (e) => { const v = e.target.value; e.target.value = ''; if (v) add(mk(v)); } }, h('option', { value: '' }, label), list.map((x) => h('option', { value: x.value }, x.label))) : null);
    box.append(h('div', { class: 'row' },
      messages.length < 5 ? h('button', { class: 'btn sm', type: 'button', 'data-add-msg': '', onclick: () => add('') }, `＋吹き出しを追加（あと${5 - messages.length}件）`) : h('span', { class: 'muted' }, '1回に送れるのは5件までです'),
      sp && messages.length < 5 ? [
        pick('＋アンケート', (sp.surveys || []).map((x) => ({ value: x.name, label: x.name })), (v) => ({ type: 'survey', survey: v })),
        pick('＋動画特典', (sp.offers || []).map((x) => ({ value: x.key, label: x.name })), (v) => ({ type: 'video_offer', offer: v })),
        h('button', { class: 'btn sm', type: 'button', 'data-add-picker': '', title: '登録してあるイベントの日程をボタンで並べ、カレンダーからも選べるようにします。選ぶと申込まで進みます', onclick: () => add({ type: 'event_picker', keyPrefix: 'kyoinkai-' }) }, '＋日程を選ぶボタン')] : null,
      h('span', { class: 'muted' }, vars ? '吹き出しを増やしても、1人1通のままです。差し込み：{{display_name}}（名前）・{{brand_name}}・{{site_url}}' : '吹き出しを増やしても、1人1通のままです（全員に同じ文面。差し込みは使えません）')));
    return box;
  }

  /**
   * カレンダー（月の表）で日時を選ぶ。value＝ISO の日時（無ければ空）。onChange(iso) で知らせる。
   * その月の、予約した一斉配信・イベント・日時を指定したステップに印（点）を付ける（重ならないように見る）
   */
  calendarPicker({ value = null, onChange, defaultTime = '19:00' }) {
    const box = h('div', { class: 'cal', 'data-calendar': '' });
    const cur = value ? fmtLocalInput(value) : '';
    let sel = cur ? cur.slice(0, 10) : '';
    let time = cur ? cur.slice(11, 16) : defaultTime;
    const today = fmtLocalInput(new Date().toISOString()).slice(0, 10);
    let [y, m] = (sel || today).split('-').map(Number);
    let marks = new Map();
    const emit = () => { if (sel) onChange?.(fromLocalInput(`${sel}T${time}`)); };
    const load = async () => {
      const from = new Date(`${y}-${String(m).padStart(2, '0')}-01T00:00:00+09:00`);
      const to = new Date(Date.UTC(m === 12 ? y + 1 : y, m === 12 ? 0 : m, 1) - 9 * 3600e3);
      try {
        const items = await this.call('calendar.range', { from: from.toISOString(), to: to.toISOString() });
        marks = new Map();
        for (const it of items) (marks.get(it.ymd) ?? marks.set(it.ymd, []).get(it.ymd)).push(it);
      } catch { marks = new Map(); }
      draw();
    };
    const KIND = { broadcast: '一斉配信', event: 'イベント', step: 'ステップ' };
    const draw = () => {
      const weeks = calendarMonth(y, m);
      const dayMarks = sel ? marks.get(sel) ?? [] : [];
      put(box,
        h('div', { class: 'ch' },
          h('button', { class: 'btn sm', type: 'button', 'data-cal-prev': '', onclick: () => { m -= 1; if (m < 1) { m = 12; y -= 1; } load(); } }, '‹'),
          h('b', { 'data-cal-title': '' }, `${y}年${m}月`),
          h('button', { class: 'btn sm', type: 'button', 'data-cal-next': '', onclick: () => { m += 1; if (m > 12) { m = 1; y += 1; } load(); } }, '›')),
        h('table', null,
          h('thead', null, h('tr', null, WD.map((w, i) => h('th', { class: i === 0 ? 'sun' : i === 6 ? 'sat' : '' }, w)))),
          h('tbody', null, weeks.map((row) => h('tr', null, row.map((d) => h('td', null, d.inMonth
            ? h('button', { type: 'button', class: [d.ymd === sel ? 'sel' : '', d.ymd === today ? 'today' : '', d.dow === 0 ? 'sun' : d.dow === 6 ? 'sat' : ''].join(' ').trim(), 'data-day': d.ymd, disabled: d.ymd < today, title: (marks.get(d.ymd) || []).map((x) => `${x.time} ${KIND[x.kind]}「${x.title}」`).join('\n') || null, onclick: () => { sel = d.ymd; emit(); draw(); } },
                String(d.d), marks.get(d.ymd)?.length ? h('span', { class: 'dot' }) : null)
            : null)))))),
        h('div', { class: 'row', style: 'margin-top:6px' }, h('span', null, '時刻'), h('input', { type: 'time', value: time, 'data-cal-time': '', onchange: (e) => { time = e.target.value || defaultTime; emit(); } }),
          h('span', { class: 'muted', 'data-cal-picked': '' }, sel ? `→ ${fmtDay(fromLocalInput(`${sel}T${time}`))} に送ります` : '日付を選んでください')),
        dayMarks.length ? h('div', { class: 'cmarks' }, h('b', null, 'この日の予定'), dayMarks.map((x) => h('span', null, `${x.time}　${KIND[x.kind]}「${x.title}」${x.status === 'disabled' ? '（止めている）' : ''}`))) : null);
    };
    draw();
    load();
    return box;
  }
  /** 「並べ替え・削除」のボタン（配列 arr の i 番目） */
  moveButtons(arr, i, again) {
    const move = (d) => { const j = i + d; if (j < 0 || j >= arr.length) return; [arr[i], arr[j]] = [arr[j], arr[i]]; again(); };
    return [
      h('button', { class: 'btn sm', type: 'button', title: '上へ', disabled: i === 0, 'data-up': '', onclick: () => move(-1) }, '↑'),
      h('button', { class: 'btn sm', type: 'button', title: '下へ', disabled: i === arr.length - 1, 'data-down': '', onclick: () => move(1) }, '↓'),
      h('button', { class: 'btn sm danger', type: 'button', 'data-del': '', onclick: () => { arr.splice(i, 1); again(); } }, '削除'),
    ];
  }

  async ruleForm(orig) {
    const safe = (pr) => pr.catch(() => []);
    const [scenarios, events, tags, surveys, offers] = await Promise.all([safe(this.call('scenarios.list')), safe(this.call('events.list')), safe(this.call('tags.list')), safe(this.call('surveys.list')), safe(this.call('videos.list'))]);
    const { created_at, updated_at, ...base } = orig; // eslint-disable-line no-unused-vars
    const rule = JSON.parse(JSON.stringify({ enabled: true, priority: 100, match_mode: 'exact', stop_after: true, conditions: {}, actions: [], ...base }));
    const title = orig.id ? `ルールを編集：${orig.name}` : 'ルールを追加';
    const initial = JSON.stringify(rule); // 開いたときの内容。違っていれば、閉じる前に確かめる
    const err = h('div', { class: 'err', style: 'display:none' });
    const needsPattern = () => ['keyword', 'postback', 'tag_added'].includes(rule.trigger_type);
    const setCond = (key, value) => {
      if (value == null || (Array.isArray(value) && !value.length) || value === '') delete rule.conditions[key];
      else rule.conditions[key] = value;
    };
    const opt = (v, label, cur) => h('option', { value: v, selected: v === cur }, label);

    const actionFields = (a, i) => {
      switch (a.type) {
        case 'reply': case 'push':
          a.messages = Array.isArray(a.messages) ? a.messages : [''];
          return h('div', null, this.messagesEditor(a.messages, show, { specials: { surveys, offers } }), a.type === 'push' ? h('p', { class: 'muted', style: 'margin:6px 0 0' }, 'プッシュは、通数に数えます（リプライは数えません）。返事には、ふつう「返信する」を使います。') : null);
        case 'survey_start':
          return h('div', { class: 'row' }, h('span', null, 'アンケート'),
            h('select', { 'data-f': 'survey', onchange: (e) => { a.survey = e.target.value; } }, surveys.length ? surveys.map((x) => opt(x.name, `${x.name}${x.enabled ? '' : '（止めている）'}`, a.survey)) : h('option', { value: '' }, '（先にアンケートを作ってください）')),
            h('span', { class: 'muted' }, 'まだ答えていない問いから、返信で始めます（全部答えた人は、最初からやり直し）'));
        case 'bonus_claim':
          return h('div', { class: 'row' }, h('span', null, '動画特典'),
            h('select', { 'data-f': 'offer', onchange: (e) => { a.offer = e.target.value; } }, offers.length ? offers.map((x) => opt(x.key, `${x.name}（${x.key}）`, a.offer)) : h('option', { value: '' }, '（先に動画特典を作ってください）')),
            h('span', { class: 'muted' }, '動画を最後まで見て、期限内の人にだけ、特典を返信で渡します'));
        case 'tag_add': case 'tag_remove':
          return h('div', { class: 'row' }, h('span', null, 'タグ名'), h('input', { value: a.tag ?? '', list: `lh-tags-${i}`, placeholder: '例：関心あり', 'data-f': 'tag', oninput: (e) => { a.tag = e.target.value; } }),
            h('datalist', { id: `lh-tags-${i}` }, tags.map((t) => h('option', { value: t.name }))));
        case 'field_set':
          return h('div', { class: 'row' }, h('span', null, '項目名'), h('input', { value: a.key ?? '', placeholder: '例：学年', 'data-f': 'key', oninput: (e) => { a.key = e.target.value; } }),
            h('span', null, '値'), h('input', { value: a.value ?? '', placeholder: '例：中2', 'data-f': 'value', oninput: (e) => { a.value = e.target.value; } }));
        case 'enroll': case 'unenroll': {
          const names = scenarios.map((x) => x.name);
          if (a.scenario && !names.includes(a.scenario)) names.push(a.scenario);
          return h('div', { class: 'row' }, h('span', null, 'ステップ配信'),
            h('select', { 'data-f': 'scenario', onchange: (e) => { a.scenario = e.target.value; } }, names.length ? names.map((n) => opt(n, scenarios.some((x) => x.name === n) ? n : `${n}（見つかりません）`, a.scenario)) : h('option', { value: '' }, '（先にステップ配信を作ってください）')),
            a.type === 'enroll' && events.length ? [h('span', null, 'イベント基準なら'), h('select', { 'data-f': 'event', onchange: (e) => { if (e.target.value) a.event = e.target.value; else delete a.event; } }, h('option', { value: '' }, '（なし）'), events.map((ev) => opt(ev.key, `${ev.title}（${ev.key}）`, a.event)))] : null);
        }
        case 'event_apply':
          return h('div', null, h('div', { class: 'row' }, h('span', null, 'イベント'),
            h('select', { 'data-f': 'event', onchange: (e) => { a.event = e.target.value; } }, events.length ? events.map((ev) => opt(ev.key, `${ev.title}（${ev.key}）`, a.event)) : h('option', { value: '' }, '（先にイベントを作ってください）'))),
            h('p', { class: 'muted', style: 'margin:6px 0 0' }, '申し込みのあとの返事は、標準の文面です（変えるときは「JSON で編集」）。'));
        case 'notify_admin':
          return h('div', { class: 'row' }, h('span', null, '運営に送る文'), h('input', { style: 'flex:1;min-width:200px', value: a.text ?? '', 'data-f': 'text', oninput: (e) => { a.text = e.target.value; } }));
        default:
          return h('p', { class: 'muted', style: 'margin:0' }, a.type === 'member_refresh' ? '会員サイトの情報（プランなど）を、最新に取り直します。入力はありません。' : '（この種類は、ここでは編集できません。「JSON で編集」で変えられます）');
      }
    };

    const build = () => {
      const trig = h('select', { 'data-f': 'trigger', onchange: (e) => { rule.trigger_type = e.target.value; if (!needsPattern()) rule.pattern = null; else rule.pattern ??= ''; show(); } },
        Object.entries(TRIGGER_LABEL).map(([k, v]) => opt(k, v, rule.trigger_type)));
      const conds = rule.conditions;
      return h('div', { class: 'fm', 'data-form': 'rule' },
        h('label', null, 'ルールの名前', h('input', { value: rule.name ?? '', 'data-f': 'name', placeholder: '例：教材のキーワード返信', oninput: (e) => { rule.name = e.target.value; } })),
        h('label', null, 'きっかけ', trig),
        needsPattern() ? h('label', null, `${{ keyword: 'キーワード', postback: 'ボタンのデータ', tag_added: 'タグ名' }[rule.trigger_type]}`, h('span', null, '1行に1つ。どれかに当てはまれば動きます'),
          h('textarea', { rows: '2', 'data-f': 'pattern', value: rule.pattern ?? '', oninput: (e) => { rule.pattern = e.target.value; } })) : null,
        ['keyword', 'postback'].includes(rule.trigger_type) ? h('label', null, '当てはまり方', h('select', { 'data-f': 'mode', onchange: (e) => { rule.match_mode = e.target.value; } }, Object.entries(MODE).map(([k, v]) => opt(k, k === 'regex' ? `${v}（上級）` : v, rule.match_mode)))) : null,
        h('details', { open: Object.keys(conds).length > 0, 'data-conds': '' }, h('summary', null, '条件（任意）：この人にだけ動かす'),
          h('div', { class: 'fm', style: 'margin-top:8px' },
            h('label', null, 'タグ（すべて持っている人）', h('input', { value: listToText(conds.tags_all), 'data-f': 'tags_all', placeholder: '例：特典受取、参加済み', oninput: (e) => setCond('tags_all', textToList(e.target.value)) })),
            h('label', null, 'タグ（どれか持っている人）', h('input', { value: listToText(conds.tags_any), 'data-f': 'tags_any', oninput: (e) => setCond('tags_any', textToList(e.target.value)) })),
            h('label', null, 'タグ（持っていない人だけ）', h('input', { value: listToText(conds.tags_none), 'data-f': 'tags_none', oninput: (e) => setCond('tags_none', textToList(e.target.value)) })),
            this.meta.adapter === 'genie' ? h('label', null, '会員サイト', h('select', { 'data-f': 'member', onchange: (e) => setCond('member', e.target.value) }, opt('', '指定なし', conds.member ?? ''), opt('linked', '連携済みの人だけ', conds.member), opt('unlinked', '未連携の人だけ', conds.member))) : null,
            conds.plans || conds.min_rank != null || conds.fields ? h('p', { class: 'muted', style: 'margin:0' }, 'プラン・ランク・友だち情報の条件も入っています（ここでは変えません。「JSON で編集」で変えられます）。') : null)),
        h('h4', null, 'やること（上から順に）'),
        rule.actions.map((a, i) => h('div', { class: 'box', 'data-action': String(i) },
          h('div', { class: 'hd' }, h('b', null, `${i + 1}.`),
            h('select', { 'data-f': 'action-type', onchange: (e) => { rule.actions[i] = defaultAction(e.target.value, { scenarios, events, surveys, offers }); show(); } },
              Object.entries(ACTION_LABEL).map(([k, v]) => opt(k, v, a.type)), ACTION_LABEL[a.type] ? null : opt(a.type, a.type, a.type)),
            h('span', { class: 'grow' }), this.moveButtons(rule.actions, i, show)),
          actionFields(a, i))),
        h('div', { class: 'row' }, h('select', { 'data-add-action': '', onchange: (e) => { if (!e.target.value) return; rule.actions.push(defaultAction(e.target.value, { scenarios, events, surveys, offers })); show(); } },
          h('option', { value: '' }, '＋やることを追加'), Object.entries(ACTION_LABEL).map(([k, v]) => h('option', { value: k }, v)))),
        h('div', { class: 'two', style: 'display:grid;grid-template-columns:1fr 1fr;gap:10px' },
          h('label', null, '優先順', h('span', null, '小さい数字ほど先に調べます'), h('input', { type: 'number', value: String(rule.priority ?? 100), 'data-f': 'priority', oninput: (e) => { rule.priority = Number(e.target.value); } })),
          h('label', { class: 'chk', style: 'align-self:end' }, h('input', { type: 'checkbox', checked: rule.stop_after !== false, 'data-f': 'stop_after', onchange: (e) => { rule.stop_after = e.target.checked; } }), h('span', null, '当てはまったら、このあとのルールは調べない'))),
        err);
    };
    const foot = () => [
      h('button', { class: 'btn', 'data-cancel': '', onclick: () => this.requestClose() }, 'キャンセル'),
      h('button', { class: 'btn', 'data-json': '', title: 'JSON で書く画面に切り替えます（上級）', onclick: () => this.jsonEditor({ title: `${title}（JSON）`, dirty: JSON.stringify(rule) !== initial, value: rule, hint: '書き間違いは保存のときに日本語で知らせます。返信の中では {{display_name}}（名前）・{{brand_name}}・{{site_url}} が使えます。', onSave: (o) => this.write('rules.save', { rule: o }) }) }, 'JSON で編集（上級）'),
      h('button', { class: 'btn pri', 'data-save': '', onclick: async () => {
        err.style.display = 'none';
        try {
          await this.write('rules.save', { rule });
          this.closeDialog();
          this.toast('ルールを保存しました');
          await this.refresh();
        } catch (e) {
          err.textContent = e.message;
          err.style.display = '';
          err.scrollIntoView?.({ block: 'nearest' });
        }
      } }, '保存'),
    ];
    const show = () => {
      const top = this.$dlgBody.scrollTop;
      this.openDialog(title, build(), foot());
      this._guard = () => JSON.stringify(rule) !== initial;
      this.$dlgBody.scrollTop = top;
    };
    show();
  }

  /** 宛先・対象の「属性」を、種類ごとのチップで選ぶ欄。sel＝{ 種類: Set(値) }。変わるたびに onChange() */
  attrChips(groups, sel, onChange) {
    if (!groups.length) return h('div', { class: 'muted' }, '属性がまだありません（「属性・アンケート」で作れます）');
    return h('div', { class: 'fm', 'data-attr-chips': '', style: 'gap:8px' }, groups.map((g) => {
      const set = (sel[g.name] ??= new Set());
      return h('div', { class: 'agrp' }, h('b', null, g.name, h('span', { class: 'muted', style: 'font-weight:400' }, '（どれか）')),
        h('div', { class: 'chips' }, g.choices.map((c) => {
          const chip = h('label', { class: 'chip' + (set.has(c) ? ' on' : ''), 'data-chip': `${g.name}:${c}` }, h('input', { type: 'checkbox', checked: set.has(c), onchange: (e) => { if (e.target.checked) set.add(c); else set.delete(c); chip.classList.toggle('on', e.target.checked); onChange?.(); } }), c);
          return chip;
        })));
    }));
  }

  async scenarioForm(orig) {
    const safe = (pr) => pr.catch(() => []);
    const [groups, scenarios, surveys, offers, tags] = await Promise.all([safe(this.call('attributes.groups')), safe(this.call('scenarios.list')), safe(this.call('surveys.list')), safe(this.call('videos.list')), safe(this.call('tags.list'))]);
    const sc = orig
      ? { name: orig.name, description: orig.description ?? '', enabled: orig.enabled, stopOnTags: [...(orig.stop_on_tags || [])], startOnFollow: !!orig.start_on_follow, startOnTags: [...(orig.start_on_tags || [])], audience: JSON.parse(JSON.stringify(orig.audience || {})), stopOnReply: !!orig.stop_on_reply, replyScenario: orig.reply_scenario ?? '', steps: JSON.parse(JSON.stringify(orig.steps || [])) }
      : { name: '', description: '', enabled: true, stopOnTags: [], startOnFollow: false, startOnTags: [], audience: {}, stopOnReply: false, replyScenario: '', steps: [{ messages: [''] }] };
    const attrSel = Object.fromEntries(Object.entries(sc.audience.attrs || {}).map(([g, v]) => [g, new Set(v)]));
    const title = orig ? `ステップ配信を編集：${orig.name}` : 'ステップ配信を追加';
    const initial = JSON.stringify(sc);
    const err = h('div', { class: 'err', style: 'display:none' });
    const opt = (v, label, cur) => h('option', { value: v, selected: v === cur }, label);
    const calOpen = new Set();
    const syncAudience = () => {
      const attrs = attrsFromSelection(attrSel);
      if (Object.keys(attrs).length) sc.audience.attrs = attrs;
      else delete sc.audience.attrs;
    };
    const special = { surveys: surveys.filter((x) => x.enabled !== undefined), offers };

    const build = () =>
      h('div', { class: 'fm', 'data-form': 'scenario' },
        h('label', null, '名前', orig ? h('span', null, '名前は変えられません（変えると、別のステップ配信になります）') : null, h('input', { value: sc.name, disabled: !!orig, 'data-f': 'name', placeholder: '例：新規登録の案内', oninput: (e) => { sc.name = e.target.value; } })),
        h('label', null, '説明（任意）', h('input', { value: sc.description, 'data-f': 'description', oninput: (e) => { sc.description = e.target.value; } })),
        h('details', { open: sc.startOnFollow || sc.startOnTags.length > 0, 'data-starts': '' }, h('summary', null, '始まるきっかけ（自動）'),
          h('div', { class: 'fm', style: 'margin-top:8px' },
            h('label', { class: 'chk' }, h('input', { type: 'checkbox', checked: sc.startOnFollow, 'data-f': 'startOnFollow', onchange: (e) => { sc.startOnFollow = e.target.checked; } }), h('span', null, '友だち追加されたら、始める')),
            h('label', null, 'このタグが付いたら、始める', h('span', null, '例：校種:中学校（アンケートで「中学校」と答えた人）。読点で区切って複数'),
              h('input', { value: listToText(sc.startOnTags), list: 'lh-sc-tags', 'data-f': 'startOnTags', placeholder: '校種:中学校', oninput: (e) => { sc.startOnTags = textToList(e.target.value); } })),
            h('datalist', { id: 'lh-sc-tags' }, tags.map((t) => h('option', { value: t.name }))),
            h('p', { class: 'muted', style: 'margin:0' }, 'ルールの「ステップ配信に登録する」、イベントの申込、下の「まとめて登録」からも始められます。'))),
        h('details', { open: Object.keys(sc.audience).length > 0, 'data-audience': '' }, h('summary', null, '対象（任意）：この人たちだけ'),
          h('div', { class: 'fm', style: 'margin-top:8px' },
            h('p', { class: 'muted', style: 'margin:0' }, '合わない人は、きっかけがあっても始まりません。属性は、種類の中は「どれか」、種類どうしは「すべて」です。'),
            this.attrChips(groups, attrSel, syncAudience),
            h('label', null, 'このタグを持っていない人だけ（任意）', h('input', { value: listToText(sc.audience.tags_none), 'data-f': 'aud_tags_none', oninput: (e) => { const v = textToList(e.target.value); if (v.length) sc.audience.tags_none = v; else delete sc.audience.tags_none; } })))),
        h('details', { open: sc.stopOnReply, 'data-reply-branch': '' }, h('summary', null, '反応で分かれる（任意）'),
          h('div', { class: 'fm', style: 'margin-top:8px' },
            h('label', { class: 'chk' }, h('input', { type: 'checkbox', checked: sc.stopOnReply, 'data-f': 'stopOnReply', onchange: (e) => { sc.stopOnReply = e.target.checked; show(); } }), h('span', null, '友だちから返事（感想など）が来たら、残りを送らずに止める')),
            sc.stopOnReply ? h('label', null, '返事があった人を移すステップ配信（任意）',
              h('select', { 'data-f': 'replyScenario', onchange: (e) => { sc.replyScenario = e.target.value; } }, h('option', { value: '' }, '（移さない）'), scenarios.filter((x) => x.name !== sc.name).map((x) => opt(x.name, x.name, sc.replyScenario)))) : null,
            h('p', { class: 'muted', style: 'margin:0' }, '例：「感想を送ってくれたら、次のシナリオへ。送ってくれなければ、次のプレゼントへ」。'))),
        h('label', null, '止めるタグ（任意）', h('span', null, 'このタグが付いた人には、残りのステップを送りません（購入済みの人に、セールスを送らない、など）'),
          h('input', { value: listToText(sc.stopOnTags), 'data-f': 'stopOnTags', placeholder: '例：購入済み', oninput: (e) => { sc.stopOnTags = textToList(e.target.value); } })),
        h('h4', null, `配信のスケジュール（上から順に。${sc.steps.length}通／100通まで）`),
        sc.steps.map((s, i) => {
          const t = timingOf(s);
          const when = h('span', { class: 'muted', 'data-when': '' }, `→ ${describeStep(s)}`);
          const upd = () => { sc.steps[i] = withTiming(sc.steps[i], { ...timingOf(sc.steps[i]), ...cur }); when.textContent = `→ ${describeStep(sc.steps[i])}`; };
          const cur = { anchor: t.anchor, dir: t.dir, days: t.days, minutes: t.minutes, atTime: t.atTime };
          const field = (key, el) => { el.addEventListener('input', () => { cur[key] = el.value; upd(); }); return el; };
          s.messages = Array.isArray(s.messages) ? s.messages : [''];
          const isFixed = s.anchor === 'fixed';
          const anchorSel = h('select', { 'data-f': 'anchor', onchange: (e) => {
            const v = e.target.value;
            if (v === 'fixed') { const { offsetDays, offsetMinutes, atTime, ...rest } = sc.steps[i]; sc.steps[i] = { ...rest, anchor: 'fixed', fixedAt: sc.steps[i].fixedAt ?? null }; calOpen.add(i); show(); return; } // eslint-disable-line no-unused-vars
            const { fixedAt, ...rest } = sc.steps[i]; // eslint-disable-line no-unused-vars
            cur.anchor = v; if (v === 'enrolled') cur.dir = 'after'; sc.steps[i] = withTiming(rest, cur); show();
          } }, opt('enrolled', '登録してから', isFixed ? 'fixed' : t.anchor), opt('event', 'イベントの開始から', isFixed ? 'fixed' : t.anchor), opt('fixed', '日時を指定（カレンダー）', isFixed ? 'fixed' : t.anchor));
          return h('div', { class: 'box', 'data-step': String(i) },
            h('div', { class: 'hd' }, h('b', null, `${i + 1}通目`), when, h('span', { class: 'grow' }), this.moveButtons(sc.steps, i, show)),
            isFixed
              ? (() => {
                  const toggle = h('button', { class: 'btn sm', type: 'button', 'data-cal-toggle': '', onclick: () => { if (calOpen.has(i)) calOpen.delete(i); else calOpen.add(i); show(); } }, `📅 ${s.fixedAt ? fmtDay(s.fixedAt) : 'カレンダーで日時を選ぶ'}`);
                  return h('div', { class: 'fm', style: 'gap:6px' }, h('div', { class: 'row' }, anchorSel, toggle, h('span', { class: 'muted' }, 'この日時より後に登録した人には、送りません')),
                    calOpen.has(i) ? this.calendarPicker({ value: s.fixedAt, onChange: (iso) => { sc.steps[i].fixedAt = iso; when.textContent = `→ ${describeStep(sc.steps[i])}`; toggle.textContent = `📅 ${fmtDay(iso)}`; } }) : null);
                })()
              : t.mixed
                ? h('p', { class: 'muted', style: 'margin:0' }, '日数と分の向きが逆の、細かい指定です（ここでは変えません。「JSON で編集」で変えられます）。')
                : h('div', { class: 'row' }, anchorSel,
                    t.anchor === 'event' ? h('select', { 'data-f': 'dir', onchange: (e) => { cur.dir = e.target.value; upd(); } }, opt('after', '後', t.dir), opt('before', '前', t.dir)) : null,
                    field('days', h('input', { type: 'number', min: '0', value: String(t.days), 'data-f': 'days', title: '日数' })), h('span', null, '日'),
                    field('atTime', h('input', { type: 'time', value: t.atTime, 'data-f': 'atTime', title: '時刻（空なら、その時刻のまま）' })), h('span', { class: 'muted' }, 'に'),
                    field('minutes', h('input', { type: 'number', min: '0', value: String(t.minutes), 'data-f': 'minutes', title: '分' })), h('span', null, '分'),
                    h('span', { class: 'muted' }, '（時刻を入れると、その時刻に届きます）')),
            s.conditions && Object.keys(s.conditions).length ? h('p', { class: 'muted', style: 'margin:0' }, 'このステップには、送る条件がついています（ここでは変えません。「JSON で編集」で変えられます）。') : null,
            this.messagesEditor(s.messages, show, { specials: special }));
        }),
        h('div', { class: 'row' }, sc.steps.length < 100 ? h('button', { class: 'btn sm', type: 'button', 'data-add-step': '', onclick: () => { const last = sc.steps[sc.steps.length - 1] ?? {}; sc.steps.push(last.anchor === 'fixed' ? { anchor: 'fixed', fixedAt: null, messages: [''] } : { anchor: last.anchor ?? 'enrolled', offsetDays: Math.abs(last.offsetDays ?? 0) + (last.anchor === 'event' ? 0 : 1), ...(last.atTime ? { atTime: last.atTime } : {}), messages: [''] }); show(); } }, '＋ステップを追加') : h('span', { class: 'muted' }, '1つのステップ配信は100通までです（続きは、別のステップ配信に分けて、反応や最後のタグでつなぎます）')),
        err);
    const payload = () => ({
      name: sc.name.trim(), description: sc.description || null, enabled: sc.enabled, stopOnTags: sc.stopOnTags, startOnFollow: sc.startOnFollow, startOnTags: sc.startOnTags, audience: sc.audience,
      stopOnReply: sc.stopOnReply, replyScenario: sc.stopOnReply ? sc.replyScenario || '' : '', steps: sc.steps.map(({ position, ...st }) => st), // eslint-disable-line no-unused-vars
    });
    const foot = () => [
      h('button', { class: 'btn', 'data-cancel': '', onclick: () => this.requestClose() }, 'キャンセル'),
      h('button', { class: 'btn', 'data-json': '', title: 'JSON で書く画面に切り替えます（上級）', onclick: () => this.jsonEditor({ title: `${title}（JSON）`, dirty: JSON.stringify(sc) !== initial, value: payload(),
        hint: 'anchor は enrolled（登録した時から）・event（イベントの開始から）・fixed（fixedAt の日時）。offsetDays は日数（前なら負）、atTime は「HH:MM」、offsetMinutes は分。メッセージには {"type":"survey","survey":"名前"}・{"type":"video_offer","offer":"キー"}・{"type":"event_picker","keyPrefix":"kyoinkai-"} も入れられます。', onSave: (o) => this.write('scenarios.save', { scenario: o }) }) }, 'JSON で編集（上級）'),
      h('button', { class: 'btn pri', 'data-save': '', onclick: async () => {
        err.style.display = 'none';
        try {
          await this.write('scenarios.save', { scenario: payload() });
          this.closeDialog();
          this.toast('ステップ配信を保存しました');
          await this.refresh();
        } catch (e) {
          err.textContent = e.message;
          err.style.display = '';
          err.scrollIntoView?.({ block: 'nearest' });
        }
      } }, '保存'),
    ];
    const show = () => {
      const top = this.$dlgBody.scrollTop;
      this.openDialog(title, build(), foot());
      this._guard = () => JSON.stringify(sc) !== initial;
      this.$dlgBody.scrollTop = top;
    };
    show();
  }

  /** 条件に合う友だちを、まとめてステップ配信に登録する（人数と通数を見てから） */
  async enrollDialog(s) {
    const groups = await this.call('attributes.groups').catch(() => []);
    const sel = {};
    const f = { tags_any: '', tags_none: '' };
    const audience = () => {
      const a = {};
      const attrs = attrsFromSelection(sel);
      if (Object.keys(attrs).length) a.attrs = attrs;
      if (list(f.tags_any).length) a.tags_any = list(f.tags_any);
      if (list(f.tags_none).length) a.tags_none = list(f.tags_none);
      return a;
    };
    const est = h('div', { class: 'est', 'data-enroll-est': '' }, '…');
    let last = null;
    let seq = 0;
    const update = async () => {
      const my = ++seq;
      try {
        const r = await this.call('scenarios.estimateEnroll', { name: s.name, audience: audience() });
        if (my !== seq) return;
        last = r;
        est.className = 'est ' + (r.recipients > 0 ? 'ok' : 'ng');
        put(est, h('b', null, `${r.recipients}人を登録します。`), ` 1人あたり最大 ${r.perPerson}通（全部で最大 ${r.maxCost}通。条件や「止めるタグ」で減ります）。すでに登録済みの人は数えません。`, r.enabled ? '' : h('b', null, ' いまは止めているので、先に「有効」にしてください。'));
      } catch (e) {
        last = null;
        est.className = 'est ng';
        est.textContent = e.message;
      }
    };
    const body = h('div', { class: 'fm', 'data-form': 'enroll' },
      h('p', { class: 'muted', style: 'margin:0' }, '何も選ばなければ、ブロックしていない友だち全員です。登録した時から数えて、各ステップの時刻に届きます（通数を使います）。'),
      this.attrChips(groups, sel, update),
      h('label', null, 'タグ（どれか持っている人）', h('input', { 'data-f': 'tags_any', oninput: (e) => { f.tags_any = e.target.value; update(); } })),
      h('label', null, 'タグ（持っていない人だけ）', h('input', { 'data-f': 'tags_none', oninput: (e) => { f.tags_none = e.target.value; update(); } })),
      est);
    this.openDialog(`まとめて登録：${s.name}`, body, [
      h('button', { class: 'btn', onclick: () => this.closeDialog() }, 'やめる'),
      h('button', { class: 'btn pri', 'data-enroll-go': '', onclick: () => this.act(async () => {
        await update();
        if (!last || !last.recipients) throw new Error('登録する人がいません。条件を見直してください');
        const r = await this.write('scenarios.enrollAudience', { name: s.name, audience: audience(), expected: last.recipients });
        if (!r.ok) throw new Error(r.message || `登録できませんでした（${r.reason}）`);
        this.closeDialog();
        this.toast(`${r.enrolled}人を登録しました${r.skipped ? `（${r.skipped}人は対象外・登録済みなど）` : ''}`);
        await this.refresh();
      }) }, '登録する')]);
    await update();
  }

  async eventForm(orig, events = []) {
    const scenarios = await this.call('scenarios.list').catch(() => []);
    const d = eventToDraft(orig);
    const initial = JSON.stringify(d);
    const title = orig ? `イベントを編集：${orig.title}` : 'イベントを追加';
    const err = h('div', { class: 'err', style: 'display:none' });
    const field = (key, el) => { el.addEventListener('input', () => { d[key] = el.value; }); return el; };
    const eventBased = (sc) => (sc.steps || []).some((st) => st.anchor === 'event');
    const body = h('div', { class: 'fm', 'data-form': 'event' },
      h('label', null, 'イベント名', field('title', h('input', { value: d.title, 'data-f': 'title', placeholder: '例：在外教育の座談会' }))),
      h('label', null, 'キー（申込のルールで、このイベントを選ぶときの名前）', h('span', null, orig ? 'キーは変えられません（変えると、別のイベントになります）' : '半角の英数字・ハイフン。例：zaigai-1020'),
        field('key', h('input', { value: d.key, disabled: !!orig, 'data-f': 'key', placeholder: 'zaigai-1020' }))),
      h('label', null, '開催日時（日本時間）', orig ? h('span', null, '日時を変えると、申込済みの人のリマインド（まだ送っていない分）も、新しい日時に合わせて計算し直します') : null,
        field('startsAt', h('input', { type: 'datetime-local', value: d.startsAt, 'data-f': 'startsAt' }))),
      h('label', null, '参加用の URL（任意）', h('span', null, 'Zoom など。申込の返信に入ります'), field('url', h('input', { value: d.url, 'data-f': 'url', placeholder: 'https://zoom.us/j/…' }))),
      h('label', null, '場所（任意）', field('location', h('input', { value: d.location, 'data-f': 'location', placeholder: '例：オンライン' }))),
      h('div', { style: 'display:grid;grid-template-columns:1fr 1fr;gap:10px' },
        h('label', null, '定員（任意）', h('span', null, '空なら、制限しません'), field('capacity', h('input', { type: 'number', min: '1', value: d.capacity, 'data-f': 'capacity' }))),
        h('label', null, '申込者に付けるタグ（任意）', h('span', null, '空なら、event:キー が付きます'), field('tag', h('input', { value: d.tag, 'data-f': 'tag', placeholder: 'event:zaigai-1020' })))),
      h('label', null, 'リマインドのステップ配信（任意）', h('span', null, '「イベントの開始から」で数えるステップ配信を選ぶと、申込した人に、前日・1時間前などのリマインドが届きます'),
        field('reminderScenario', h('select', { 'data-f': 'reminderScenario' }, h('option', { value: '' }, '（なし）'),
          scenarios.map((sc) => h('option', { value: sc.name, selected: sc.name === d.reminderScenario }, `${sc.name}${eventBased(sc) ? '（イベント基準）' : ''}`)),
          d.reminderScenario && !scenarios.some((sc) => sc.name === d.reminderScenario) ? h('option', { value: d.reminderScenario, selected: true }, `${d.reminderScenario}（見つかりません）`) : null))),
      h('details', { open: !!(d.zoomMeetingId), 'data-zoom': '' }, h('summary', null, 'Zoom の出欠（任意）'),
        h('div', { class: 'fm', style: 'margin-top:8px' },
          h('label', null, 'ZoomのミーティングID', h('span', null, '数字8〜13桁。入れると、Zoom の入退室から、出欠を自動で記録します。空にすると、いまの番号を消します'), field('zoomMeetingId', h('input', { value: d.zoomMeetingId, 'data-f': 'zoom', placeholder: '812 3456 7890' }))),
          h('label', null, '「参加」とみなす在室の分数', field('attendMinMinutes', h('input', { type: 'number', min: '0', max: '600', value: d.attendMinMinutes, 'data-f': 'attendMin' }))))),
      err);
    const foot = [
      h('button', { class: 'btn', 'data-cancel': '', onclick: () => this.requestClose() }, 'キャンセル'),
      h('button', { class: 'btn', 'data-json': '', title: 'JSON で書く画面に切り替えます（上級）', onclick: () => this.jsonEditor({ title: `${title}（JSON）`, dirty: JSON.stringify(d) !== initial, value: draftToEvent(d, orig),
        hint: '申込のルール（アクション「イベントに申し込む」）で key を指定します。reminderScenario に前日・1時間前のシナリオ名を入れるとリマインドが届きます。', onSave: (o) => this.write('events.save', { event: o }) }) }, 'JSON で編集（上級）'),
      h('button', { class: 'btn pri', 'data-save': '', onclick: async () => {
        err.style.display = 'none';
        try {
          if (!orig && events.some((x) => x.key === d.key.trim())) throw new Error('そのキーのイベントは、すでにあります。「編集」から直すか、別のキーにしてください');
          const payload = draftToEvent(d, orig);
          const moved = orig && fmtLocalInput(orig.starts_at) !== d.startsAt; // 日時を変えたときは、リマインドも計算し直す（日程の変更と同じ）
          if (moved) payload.startsAt = new Date(orig.starts_at).toISOString(); // 日時だけは、あとで「日程の変更」の操作で入れる
          await this.write('events.save', { event: payload });
          let note = '';
          if (moved) {
            if (!d.startsAt) throw new Error('開催日時を入れてください');
            const r = await this.write('events.reschedule', { key: payload.key, startsAt: fromLocalInput(d.startsAt) });
            note = `（日時を変更。リマインド ${r.moved}件を再計算）`;
          }
          this.closeDialog();
          this.toast(`イベントを保存しました${note}`);
          await this.refresh();
        } catch (e) {
          err.textContent = e.message;
          err.style.display = '';
          err.scrollIntoView?.({ block: 'nearest' });
        }
      } }, '保存'),
    ];
    this.openDialog(title, body, foot);
    this._guard = () => JSON.stringify(d) !== initial;
  }


  // ---- タブ：チャット（友だち1人＝1部屋。プロラインの「個別チャット」） ----
  async tChat(p) {
    const st = this._chat;
    const rooms = h('div', { class: 'rooms' });
    const threadBox = h('div', { class: 'thread', 'data-thread': '' });
    const wrap = h('div', { class: 'chat' + (st.userId ? ' open' : ''), 'data-chat': '' }, rooms, threadBox);
    const list = h('div', { class: 'rlist', 'data-rooms': '' });
    this.$chat = { wrap, threadBox, list };
    const opt = (v, l) => h('option', { value: v, selected: st.filter === v }, l);
    let notifyOn = false;
    try { notifyOn = globalThis.localStorage?.getItem('lh-notify') === 'on'; } catch { /* 覚えていない */ }
    const notifyBtn = h('button', { class: 'btn sm', type: 'button', 'data-notify': '', title: '画面を開いているあいだ、友だち追加・メッセージを、このパソコンの通知で知らせます', onclick: () => this.act(async () => {
      const N = globalThis.Notification;
      if (!N) throw new Error('このブラウザは、通知に対応していません');
      if (notifyOn) {
        try { globalThis.localStorage?.setItem('lh-notify', 'off'); } catch { /* 覚えられなくてよい */ }
        notifyOn = false;
        notifyBtn.textContent = '🔔 新着をこのパソコンに知らせる';
        this.toast('このパソコンへの通知を、やめました');
        return;
      }
      const perm = N.permission === 'granted' ? 'granted' : await N.requestPermission();
      if (perm !== 'granted') throw new Error('通知が許可されませんでした（ブラウザの設定で、このページの通知を許可してください）');
      try { globalThis.localStorage?.setItem('lh-notify', 'on'); } catch { /* 覚えられなくてよい */ }
      notifyOn = true;
      notifyBtn.textContent = '🔕 このパソコンへの通知をやめる';
      this.toast('新着を、このパソコンに知らせます（この画面を開いているあいだ）');
    }) }, notifyOn ? '🔕 このパソコンへの通知をやめる' : '🔔 新着をこのパソコンに知らせる');
    rooms.append(
      h('div', { class: 'rtool' },
        h('input', { placeholder: '名前で探す', value: st.q, 'data-chat-q': '', oninput: (e) => { st.q = e.target.value; this.chatLoadRooms().catch((er) => this.toast(er.message, 'err')); } }),
        h('select', { 'data-chat-filter': '', onchange: (e) => { st.filter = e.target.value; this.chatLoadRooms().catch((er) => this.toast(er.message, 'err')); } }, opt('', 'すべての部屋'), opt('unread', '未読のある部屋'), opt('needs_reply', '要対応（返事を待っている）')),
        notifyBtn),
      list);
    put(p, h('p', { class: 'muted', style: 'margin:0 0 8px' }, '友だち追加された人は、メッセージが無くても、ここに部屋が出ます（「友だち追加しました」が未読になります）。自動の返事が無かったメッセージには「要対応」が付きます。'), wrap);
    await this.chatLoadRooms();
    if (st.userId) await this.chatOpen(st.userId);
    else put(threadBox, h('div', { class: 'empty2' }, '左の一覧から、友だちを選んでください'));
  }

  /** 部屋の一覧を読み直す（入力が続いたときは、いちばん新しい結果だけ出す） */
  async chatLoadRooms() {
    const st = this._chat;
    const my = (this._roomSeq = (this._roomSeq ?? 0) + 1);
    const r = await this.call('chat.rooms', { q: st.q || undefined, filter: st.filter || undefined, limit: 200 });
    if (my !== this._roomSeq || !this.$chat?.list?.isConnected) return;
    const room = (x) => {
      const name = x.display_name || x.line_user_id.slice(0, 8);
      const pv = x.last_text ? `${x.last_direction === 'out' ? '→ ' : ''}${x.last_text}` : '（まだ、やり取りはありません）';
      return h('div', { class: 'room' + (st.userId === x.line_user_id ? ' on' : ''), 'data-room': x.line_user_id, role: 'button', tabindex: '0', onclick: () => this.chatOpen(x.line_user_id).catch((e) => this.toast(e.message, 'err')), onkeydown: (e) => { if (e.key === 'Enter') this.chatOpen(x.line_user_id).catch(() => {}); } },
        this.avatar(x),
        h('div', { class: 'mid' },
          h('div', { class: 'rn' }, h('span', { class: 'nm3' }, name), x.status === 'blocked' ? h('span', { class: 'badge red' }, 'ブロック') : null, x.needs_reply ? h('span', { class: 'badge amber', 'data-needs': '' }, '要対応') : null),
          h('div', { class: 'pv' }, short(pv, 40))),
        h('div', { class: 'rgt' }, h('span', null, x.last_at ? fmt(x.last_at) : ''), x.unread ? h('span', { class: 'unread', 'data-room-unread': String(x.unread) }, String(x.unread)) : null));
    };
    put(this.$chat.list, r.rows.length ? r.rows.map(room) : h('div', { class: 'empty', style: 'padding:14px' }, st.q || st.filter ? '該当する部屋はありません' : 'まだ友だちがいません'),
      r.total > r.rows.length ? h('div', { class: 'muted', style: 'padding:8px 10px;font-size:12px' }, `ほか ${r.total - r.rows.length}人（名前で探してください）`) : null);
  }

  /** 友だちのアイコン（写真が読めなければ、名前の1文字目） */
  avatar(f) {
    const name = f.display_name || '？';
    const box = h('div', { class: 'av', 'aria-hidden': 'true' }, name.slice(0, 1));
    if (f.picture_url && /^https:\/\//.test(f.picture_url)) {
      const img = h('img', { alt: '', src: f.picture_url, referrerpolicy: 'no-referrer' });
      img.addEventListener('error', () => box.replaceChildren(name.slice(0, 1))); // 写真が読めなければ、名前の1文字目に戻す
      box.replaceChildren(img);
    }
    return box;
  }

  /** 部屋を開く：やり取りを読み、既読にする（チャットの権限がある人だけ） */
  async chatOpen(userId, { before = null } = {}) {
    const st = this._chat;
    st.userId = userId;
    const t = await this.call('chat.thread', { userId, before: before ?? undefined, limit: 60 });
    if (!this.$chat?.threadBox?.isConnected) return;
    this.$chat.wrap.classList.add('open');
    this.$chat.list.querySelectorAll('.room').forEach((el) => el.classList.toggle('on', el.getAttribute('data-room') === userId));
    this.renderThread(t, { older: !!before });
    if (t.state.unread > 0 && this.can('chat')) {
      await this.call('chat.markRead', { userId }).catch(() => {});
      const badge = this.$chat.list.querySelector(`.room[data-room="${globalThis.CSS?.escape?.(userId) ?? userId}"] .unread`);
      badge?.remove();
      this.pollChat().catch(() => {});
    }
  }

  /** 開いている部屋と一覧を、読み直す（書きかけの文は、そのまま） */
  async chatReload({ keepScroll = false } = {}) {
    if (!this.$chat?.wrap?.isConnected) return;
    const box = this.$chat.threadBox.querySelector('.msgs');
    const atBottom = box ? box.scrollHeight - box.scrollTop - box.clientHeight < 40 : true;
    await this.chatLoadRooms();
    if (this._chat.userId) {
      await this.chatOpen(this._chat.userId);
      const nb = this.$chat.threadBox.querySelector('.msgs');
      if (keepScroll && !atBottom && nb && box) nb.scrollTop = box.scrollTop;
    }
  }

  renderThread(t, { older = false } = {}) {
    const st = this._chat;
    const f = t.friend;
    const userId = f.line_user_id;
    const name = f.display_name || userId.slice(0, 8);
    const SYS = new Set(['follow', 'unfollow', 'video_complete']);
    const bubble = (x) => {
      if (x.direction === 'in' && SYS.has(x.kind)) return h('div', { class: 'bs', 'data-msg-sys': x.kind }, `${x.text}　${fmt(x.created_at)}`);
      if (x.direction === 'in') return h('div', { class: 'bw l', 'data-msg-in': '' }, h('div', { class: 'b' }, x.text), h('div', { class: 'bmeta' }, fmt(x.created_at)));
      const parts = Array.isArray(x.messages) && x.messages.length ? bubbleParts(x.messages) : [{ text: x.text ?? '', choices: [] }];
      const isReply = String(x.kind).startsWith('reply');
      const who = x.source === 'chat' ? `チャット${x.actor ? `（${x.actor}）` : ''}` : sourceLabel(x.source) || x.kind;
      const meta = `${who}${isReply ? '・返信（通数に数えない）' : ''}${String(x.kind).includes('dry-run') ? '・練習モード（送っていません）' : ''}　${fmt(x.created_at)}`;
      return h('div', { class: 'bw r', 'data-msg-out': x.source ?? '' }, parts.map((pt) => h('div', { class: 'b' }, pt.text, pt.choices.length ? h('div', { class: 'qr' }, pt.choices.map((c) => h('span', null, c))) : null)), h('div', { class: 'bmeta' }, meta));
    };
    const pending = (o) => h('div', { class: 'bw r', 'data-msg-pending': o.status }, bubbleParts(o.messages).map((pt) => h('div', { class: 'b', style: 'opacity:.7' }, pt.text)),
      h('div', { class: 'bmeta' }, `チャット・${STATUS_LABEL[o.status] || o.status}${o.last_error ? `（${short(o.last_error, 40)}）` : ''}　${fmt(o.created_at)}`));
    const msgs = h('div', { class: 'msgs', 'data-msgs': '' },
      t.hasMore ? h('button', { class: 'btn sm', style: 'align-self:center', 'data-older': '', onclick: () => this.act(() => this.chatOpen(userId, { before: t.items[0]?.id })) }, '← 前のやり取りを読む') : null,
      t.items.length ? t.items.map(bubble) : h('div', { class: 'empty2' }, 'まだ、やり取りはありません。こちらから話しかけられます。'),
      t.pending.map(pending));

    const needs = h('label', { class: 'chip' + (t.state.needsReply ? ' on' : ''), title: '返事を待っている人の印。運営が送ると、自動で外れます' },
      h('input', { type: 'checkbox', checked: t.state.needsReply, disabled: !this.can('chat'), 'data-needs-toggle': '', onchange: (e) => {
        const v = e.target.checked;
        this.act(async () => { await this.write('chat.setNeedsReply', { userId, value: v }); needs.classList.toggle('on', v); await this.chatLoadRooms(); });
      } }), '要対応');
    const head = h('div', { class: 'th' },
      h('button', { class: 'btn sm back', type: 'button', onclick: () => { st.userId = null; this.$chat.wrap.classList.remove('open'); } }, '← 一覧'),
      this.avatar(f), h('b', { 'data-thread-name': '' }, name), f.status === 'blocked' ? h('span', { class: 'badge red' }, 'ブロック中') : null,
      h('span', { class: 'grow' }), needs,
      h('button', { class: 'btn sm', type: 'button', onclick: () => this.act(() => this.friendDialog(userId)) }, '友だちの詳細'));

    let composer = null;
    if (this.can('chat') && f.status === 'active') {
      const ta = h('textarea', { placeholder: 'メッセージを入力（⌘＋Enter で送る）', 'data-chat-text': '', value: st.drafts.get(userId) ?? '', oninput: (e) => st.drafts.set(userId, e.target.value) });
      const hint = h('span', { class: 'hint', 'data-cost': '' });
      const loadedAt = Date.now();
      const updHint = () => {
        const left = t.replyWindow.free ? Math.max(0, t.replyWindow.secondsLeft - Math.floor((Date.now() - loadedAt) / 1000)) : 0;
        const c = costHint({ free: left > 0, secondsLeft: left }, this.dash?.usage);
        hint.textContent = c.text;
        hint.classList.toggle('free', c.free);
        hint.setAttribute('data-free', String(c.free));
        return left > 0;
      };
      if (this._tickTimer) clearInterval(this._tickTimer);
      this._tickTimer = updHint() ? setInterval(() => { if (!updHint()) { clearInterval(this._tickTimer); this._tickTimer = null; } }, 1000) : null;
      const sendBtn = h('button', { class: 'btn pri', type: 'button', 'data-chat-send': '', onclick: () => send() }, '送る');
      const send = async () => {
        const text = ta.value.trim();
        if (!text) return;
        sendBtn.disabled = true;
        try {
          const r = await this.write('chat.send', { userId, text });
          if (!r.ok) throw new Error(r.message || '送れませんでした');
          st.drafts.delete(userId);
          this.toast(r.via === 'reply' ? (r.dryRun ? '練習モードのため、送らずに記録しました' : '返信しました（通数は使っていません）') : r.status === 'sent' ? '送りました（1通使いました）' : r.status === 'dry_run' ? '練習モードのため、送らずに記録しました' : r.status === 'failed' ? `送れませんでした：${r.error ?? ''}` : '送信待ちに入れました', r.status === 'failed' ? 'err' : undefined);
          await this.chatOpen(userId);
          await this.chatLoadRooms();
          this.refreshTop().catch(() => {});
        } catch (e) {
          this.toast(e.message, 'err');
        } finally {
          sendBtn.disabled = false;
        }
      };
      ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !e.isComposing) { e.preventDefault(); send(); } });
      const special = h('select', { class: 'btn sm', 'data-chat-special': '', title: 'アンケートの質問や、動画特典の動画を送ります（返信の期限内なら無料）', onchange: (e) => {
        const v = e.target.value;
        e.target.value = '';
        if (!v) return;
        const [kind, ...rest] = v.split(':');
        const ref = rest.join(':');
        this.act(async () => {
          const r = await this.write('chat.sendSpecial', { userId, kind, ref });
          if (!r.ok) throw new Error(r.message || '送れませんでした');
          this.toast(r.via === 'reply' ? '返信で送りました（通数は使っていません）' : '送りました（1通使いました）');
          await this.chatOpen(userId);
        });
      } }, h('option', { value: '' }, '＋アンケート・動画を送る'));
      Promise.all([this.call('surveys.list').catch(() => []), this.call('videos.list').catch(() => [])]).then(([svs, vos]) => {
        special.append(...svs.filter((x) => x.enabled).map((x) => h('option', { value: `survey:${x.name}` }, `アンケート「${x.name}」を始める`)), ...vos.filter((x) => x.enabled).map((x) => h('option', { value: `video_offer:${x.key}` }, `動画「${x.name}」を送る`)));
        if (special.options.length === 1) special.remove();
      });
      composer = h('div', { class: 'composer' }, ta, h('div', { class: 'crow' }, hint, special, sendBtn));
    } else if (!this.can('chat')) {
      composer = h('div', { class: 'composer' }, h('span', { class: 'muted' }, 'あなたの役割（閲覧のみ）では、送れません。'));
    } else {
      composer = h('div', { class: 'composer' }, h('span', { class: 'muted' }, 'ブロックされているため、送れません。'));
    }
    put(this.$chat.threadBox, head, msgs, composer);
    if (!older) msgs.scrollTop = msgs.scrollHeight;
  }


  // ---- ひな形（テンプレート）：中身を見てから作る ----
  /** ひな形を選ぶ欄（keys で、出すひな形を絞る。空なら全部） */
  templateSelect(keys = null) {
    if (!this.can('edit')) return null;
    const sel = h('select', { class: 'btn sm', 'data-template': '', onchange: (e) => { const k = e.target.value; e.target.value = ''; if (k) this.act(() => this.templateDialog(k)); } }, h('option', { value: '' }, '＋ひな形から作る（中身を見てから）'));
    this.call('templates.list').then((list) => sel.append(...list.filter((t) => !keys || keys.includes(t.key)).map((t) => h('option', { value: t.key }, t.title)))).catch(() => {});
    return sel;
  }
  async templateDialog(key) {
    const [list, items] = await Promise.all([this.call('templates.list'), this.call('templates.preview', { key })]);
    const t = list.find((x) => x.key === key);
    const off = (x) => (x.enabled === false ? h('span', { class: 'badge amber' }, '止めた状態で作る') : x.enabled === true ? h('span', { class: 'badge green' }, '有効で作る') : null);
    const body = h('div', { class: 'tpl', 'data-template-preview': key },
      h('p', { style: 'margin-top:0' }, t?.summary ?? ''),
      items.map((x) => h('div', { class: 'item' },
        h('h3', null, h('span', { class: 'badge blue' }, KIND_LABEL2[x.kind] ?? x.kind), x.name, off(x)),
        x.detail ? h('div', { class: 'sub' }, x.detail) : null,
        x.lines ? h('ol', { style: 'margin:4px 0 0;padding-left:1.4em' }, x.lines.map((l) => h('li', null, l))) : null,
        x.steps ? h('ul', { class: 'steps' }, x.steps.map((st, i) => h('li', null, h('span', { class: 'when' }, `${i + 1}通目　${st.when}`), h('span', null, st.first, st.extra?.length ? h('span', { class: 'muted' }, ` ${st.extra.join(' ')}`) : null)))) : null)),
      h('p', { class: 'muted' }, '同じ名前のものがあれば、（2）を付けて別に作ります（いまあるものは書き換えません）。作ったあとで、文面を直してから「有効」にしてください。'));
    this.openDialog(`ひな形：${t?.title ?? key}`, body, [
      h('button', { class: 'btn', onclick: () => this.closeDialog() }, 'やめる'),
      h('button', { class: 'btn pri', 'data-template-apply': key, onclick: () => this.act(async () => {
        const r = await this.write('templates.apply', { key });
        this.closeDialog();
        this.toast(`作りました：${r.created.map((x) => `${KIND_LABEL2[x.kind] ?? x.kind}「${x.name}」`).join('、')}`);
        await this.refresh();
      }) }, 'この内容で作る')]);
  }

  // ---- タブ：属性・アンケート ----
  async tAttrs(p) {
    const [stats, surveys] = await Promise.all([this.call('attributes.list'), this.call('surveys.list')]);
    const canEdit = this.can('edit');
    const bars = (g) => h('div', { class: 'bars' }, g.values.map((v) => h('div', { class: 'bar2', 'data-attr-value': `${g.name}:${v.value}` },
        h('span', { class: 'lb', title: v.value }, v.value, v.listed ? '' : '（選択肢にない値）'),
        h('span', { class: 'tr' }, h('i', { style: `width:${g.total ? Math.round((v.n / g.total) * 100) : 0}%` })), h('span', { class: 'n' }, `${v.n}人`))),
      h('div', { class: 'bar2' }, h('span', { class: 'lb muted' }, 'まだ答えていない'), h('span', { class: 'tr' }, h('i', { style: `width:${g.total ? Math.round((g.unanswered / g.total) * 100) : 0}%;background:#b8c2cc` })), h('span', { class: 'n' }, `${g.unanswered}人`)));
    put(p,
      h('div', { class: 'toolbar' }, this.templateSelect(['genie-attributes', 'video-matching']),
        canEdit ? h('button', { class: 'btn sm', 'data-add-attr': '', onclick: () => this.act(() => this.attributeForm(null)) }, '＋属性を追加') : null,
        canEdit ? h('button', { class: 'btn sm', 'data-add-survey': '', onclick: () => this.act(() => this.surveyForm(null)) }, '＋アンケートを追加') : null,
        h('span', { class: 'muted' }, `アンケート ${surveys.length}件（${this.limitText('max_surveys', surveys.length)}）`)),
      h('h4', { style: 'margin-top:4px' }, '属性（タグの種類）'),
      h('p', { class: 'muted', style: 'margin:0 0 8px' }, '「校種:中学校」のような形のタグを、種類ごとにまとめて数えます。1人1つの種類は、新しい値が付くと古い値が外れます。一斉配信・ステップ配信の宛先で、種類ごとに選べます。'),
      stats.length
        ? stats.map((g) => h('div', { class: 'item', 'data-attr-group': g.name },
            h('h3', null, g.name, h('span', { class: 'badge' }, g.single ? '1人1つ' : '複数可'), h('span', { class: 'muted' }, `友だち ${g.total}人`), h('span', { class: 'grow' }),
              canEdit ? h('button', { class: 'btn sm', onclick: () => this.act(() => this.attributeForm(g)) }, '編集') : null,
              canEdit ? h('button', { class: 'btn sm danger', onclick: async () => { if (await this.askConfirm('属性を削除', `「${g.name}」の種類を消しますか？（付いているタグは、ふつうのタグとして残ります）`, '消す', { danger: true })) this.act(async () => { await this.write('attributes.delete', { name: g.name }); await this.refresh(); }); } }, '削除') : null),
            bars(g)))
        : h('div', { class: 'empty' }, 'まだ属性がありません。「ひな形から作る」の「ジーニーの属性アンケート」で、校種・性別・年代・エリア・役職をまとめて作れます。'),
      h('h4', null, 'アンケート'),
      h('p', { class: 'muted', style: 'margin:0 0 8px' }, '友だちがボタンで答えると、属性のタグが付きます。2問目からは返信で送るので、通数を使いません（1問目も、友だち追加の返事に添えれば無料です）。'),
      surveys.length
        ? surveys.map((sv) => h('div', { class: 'item' + (sv.enabled ? '' : ' off'), 'data-survey': sv.name },
            h('h3', null, sv.name, sv.start_on_follow ? h('span', { class: 'badge green' }, '友だち追加の返事で始まる') : null, h('span', { class: 'badge blue' }, `答えた ${sv.completed}人／始めた ${sv.started}人`), h('span', { class: 'grow' }),
              canEdit ? this.enableSwitch(sv.enabled, sv.name, (on) => this.act(async () => { await this.write('surveys.setEnabled', { id: sv.id, enabled: on }); await this.refresh(); })) : statusBadge(sv.enabled ? 'active' : 'stopped')),
            h('div', { class: 'sub' }, `質問：${sv.questions.map((q) => q.attribute).join(' → ')}${sv.done_tag ? `　答えた人のタグ：${sv.done_tag}` : ''}${(sv.done_extra || []).some((m) => m?.type === 'event_picker') ? '　お礼のあとに日程のボタン' : ''}`),
            h('div', { class: 'acts' },
              h('button', { class: 'btn sm', onclick: () => this.act(() => this.surveyResultsDialog(sv)) }, '結果を見る'),
              canEdit ? h('button', { class: 'btn sm', onclick: () => this.act(() => this.surveyForm(sv)) }, '編集') : null,
              canEdit ? h('button', { class: 'btn sm danger', onclick: async () => { if (await this.askConfirm('アンケートを削除', `「${sv.name}」を消しますか？（答えの記録も消えます。付いたタグは残ります）`, '消す', { danger: true })) this.act(async () => { await this.write('surveys.delete', { id: sv.id }); await this.refresh(); }); } }, '削除') : null)))
        : h('div', { class: 'empty' }, 'まだアンケートがありません'));
  }

  /** 上限の文字（いまは上限なし。商品にするときに設定 plan_limits で入れる） */
  limitText(key, n) {
    const max = this.meta?.limits?.limits?.[key];
    return max == null ? '上限なし' : `上限 ${max}`;
  }

  async attributeForm(orig) {
    const a = { name: orig?.name ?? '', choices: [...(orig?.choices ?? [])], single: orig?.single ?? true, position: orig?.position ?? 100 };
    const initial = JSON.stringify(a);
    const err = h('div', { class: 'err', style: 'display:none' });
    const body = h('div', { class: 'fm', 'data-form': 'attribute' },
      h('label', null, '属性の名前', orig ? h('span', null, '名前は変えられません') : h('span', null, '例：校種・性別・年代・エリア・役職（「:」は使えません）'), h('input', { value: a.name, disabled: !!orig, 'data-f': 'name', oninput: (e) => { a.name = e.target.value; } })),
      h('label', null, '選択肢（1行に1つ・20文字まで）', h('span', null, 'アンケートのボタンと、宛先を選ぶときの並びになります'), h('textarea', { rows: '7', 'data-f': 'choices', value: a.choices.join('\n'), oninput: (e) => { a.choices = e.target.value.split('\n').map((x) => x.trim()).filter(Boolean); } })),
      h('label', { class: 'chk' }, h('input', { type: 'checkbox', checked: a.single, 'data-f': 'single', onchange: (e) => { a.single = e.target.checked; } }), h('span', null, '1人1つ（新しい値が付くと、古い値を外す）')),
      h('label', null, '並び順', h('span', null, '小さいほど先'), h('input', { type: 'number', value: String(a.position), 'data-f': 'position', oninput: (e) => { a.position = Number(e.target.value); } })),
      err);
    this.openDialog(orig ? `属性を編集：${orig.name}` : '属性を追加', body, [
      h('button', { class: 'btn', onclick: () => this.requestClose() }, 'キャンセル'),
      h('button', { class: 'btn pri', 'data-save': '', onclick: async () => {
        err.style.display = 'none';
        try {
          await this.write('attributes.save', { attribute: a });
          this.closeDialog();
          this.toast('属性を保存しました');
          await this.refresh();
        } catch (e) {
          err.textContent = e.message;
          err.style.display = '';
        }
      } }, '保存')]);
    this._guard = () => JSON.stringify(a) !== initial;
  }

  async surveyForm(orig) {
    const groups = await this.call('attributes.groups').catch(() => []);
    const picker0 = (orig?.done_extra || []).find((m) => m?.type === 'event_picker');
    const sv = orig
      ? { name: orig.name, enabled: orig.enabled, startOnFollow: orig.start_on_follow, questions: JSON.parse(JSON.stringify(orig.questions)), doneMessage: orig.done_message ?? '', doneTag: orig.done_tag ?? '', picker: !!picker0, keyPrefix: picker0?.keyPrefix ?? 'kyoinkai-' }
      : { name: '', enabled: true, startOnFollow: false, questions: [{ attribute: '', text: '', choices: [] }], doneMessage: '', doneTag: '', picker: false, keyPrefix: 'kyoinkai-' };
    const initial = JSON.stringify(sv);
    const title = orig ? `アンケートを編集：${orig.name}` : 'アンケートを追加';
    const err = h('div', { class: 'err', style: 'display:none' });
    const build = () => h('div', { class: 'fm', 'data-form': 'survey' },
      h('label', null, 'アンケートの名前', orig ? h('span', null, '名前は変えられません（変えると、別のアンケートになります）') : null, h('input', { value: sv.name, disabled: !!orig, 'data-f': 'name', placeholder: '例：属性アンケート', oninput: (e) => { sv.name = e.target.value; } })),
      h('label', { class: 'chk' }, h('input', { type: 'checkbox', checked: sv.startOnFollow, 'data-f': 'startOnFollow', onchange: (e) => { sv.startOnFollow = e.target.checked; } }), h('span', null, '友だち追加の返事に、1問目を添える（返信なので、通数を使いません）')),
      h('datalist', { id: 'lh-attr-groups' }, groups.map((g) => h('option', { value: g.name }))),
      h('h4', null, '質問（上から順に。10問まで）'),
      sv.questions.map((q, i) => {
        const g = groups.find((x) => x.name === q.attribute);
        const cnt = h('span', { class: 'muted' }, `${q.choices.length}/13`);
        return h('div', { class: 'box', 'data-question': String(i) },
          h('div', { class: 'hd' }, h('b', null, `${i + 1}問目`), h('span', { class: 'grow' }), this.moveButtons(sv.questions, i, show)),
          h('div', { class: 'row' }, h('span', null, '聞く属性'), h('input', { value: q.attribute, list: 'lh-attr-groups', 'data-f': 'attribute', placeholder: '例：校種', oninput: (e) => { q.attribute = e.target.value; } }),
            g && g.choices.length ? h('button', { class: 'btn sm', type: 'button', onclick: () => { q.choices = [...g.choices].slice(0, 13); show(); } }, `「${g.name}」の選択肢を入れる`) : null),
          h('label', null, '質問の文', h('textarea', { rows: '2', 'data-f': 'text', value: q.text, placeholder: '例：お勤めの学校の種類を教えてください。', oninput: (e) => { q.text = e.target.value; } })),
          h('label', null, h('span', null, '選択肢（1行に1つ。ボタンは13個まで・20文字まで＝LINE の決まり） ', cnt), h('textarea', { rows: '4', 'data-f': 'choices', value: q.choices.join('\n'), oninput: (e) => { q.choices = e.target.value.split('\n').map((x) => x.trim()).filter(Boolean); cnt.textContent = `${q.choices.length}/13`; } })));
      }),
      sv.questions.length < 10 ? h('div', null, h('button', { class: 'btn sm', type: 'button', 'data-add-question': '', onclick: () => { sv.questions.push({ attribute: '', text: '', choices: [] }); show(); } }, '＋質問を追加')) : null,
      h('label', null, '全部に答えた人への返事（任意）', h('span', null, '{{display_name}} で名前が入ります。空なら「ご回答ありがとうございました！」'), h('textarea', { rows: '3', 'data-f': 'doneMessage', value: sv.doneMessage, oninput: (e) => { sv.doneMessage = e.target.value; } })),
      h('label', null, '全部に答えた人に付けるタグ（任意）', h('span', null, 'このタグで、ステップ配信を始められます（例：アンケート回答済み）'), h('input', { value: sv.doneTag, 'data-f': 'doneTag', oninput: (e) => { sv.doneTag = e.target.value; } })),
      h('label', { class: 'chk' }, h('input', { type: 'checkbox', checked: sv.picker, 'data-f': 'picker', onchange: (e) => { sv.picker = e.target.checked; show(); } }), h('span', null, 'お礼のあとに、日程を選ぶボタンを添える（ZOOM教員会など。返信なので無料）')),
      sv.picker ? h('label', null, '並べる日程（イベントのキーの頭）', h('span', null, '例：kyoinkai-（空なら、すべてのイベント）'), h('input', { value: sv.keyPrefix, 'data-f': 'keyPrefix', oninput: (e) => { sv.keyPrefix = e.target.value.trim(); } })) : null,
      err);
    const payload = () => ({
      name: sv.name.trim(), enabled: sv.enabled, startOnFollow: sv.startOnFollow, questions: sv.questions, doneMessage: sv.doneMessage || null, doneTag: sv.doneTag || null,
      doneExtra: sv.picker ? [{ type: 'event_picker', keyPrefix: sv.keyPrefix || '', quietIfNone: true }] : [],
    });
    const foot = () => [
      h('button', { class: 'btn', 'data-cancel': '', onclick: () => this.requestClose() }, 'キャンセル'),
      h('button', { class: 'btn', 'data-json': '', onclick: () => this.jsonEditor({ title: `${title}（JSON）`, dirty: JSON.stringify(sv) !== initial, value: payload(), hint: 'questions は [{ attribute, text, choices }]。doneExtra には、日程を選ぶボタン（{"type":"event_picker","keyPrefix":"kyoinkai-"}）などを入れられます。', onSave: (o) => this.write('surveys.save', { survey: o }) }) }, 'JSON で編集（上級）'),
      h('button', { class: 'btn pri', 'data-save': '', onclick: async () => {
        err.style.display = 'none';
        try {
          await this.write('surveys.save', { survey: payload() });
          this.closeDialog();
          this.toast('アンケートを保存しました');
          await this.refresh();
        } catch (e) {
          err.textContent = e.message;
          err.style.display = '';
          err.scrollIntoView?.({ block: 'nearest' });
        }
      } }, '保存')];
    const show = () => {
      const top = this.$dlgBody.scrollTop;
      this.openDialog(title, build(), foot());
      this._guard = () => JSON.stringify(sv) !== initial;
      this.$dlgBody.scrollTop = top;
    };
    show();
  }

  async surveyResultsDialog(sv) {
    const r = await this.call('surveys.results', { name: sv.name });
    this.openDialog(`アンケートの結果：${sv.name}`, h('div', { 'data-survey-results': '' },
      h('p', { class: 'muted', style: 'margin-top:0' }, `答え始めた ${r.started}人／全部答えた ${r.completed}人（人数は、ブロックしていない友だち）`),
      r.questions.map((q, i) => h('div', { class: 'item' }, h('h3', null, `${i + 1}問目：${q.attribute}`, h('span', { class: 'muted' }, `答えた ${q.answered}人`)), h('div', { class: 'sub' }, q.text),
        h('div', { class: 'bars' }, q.counts.map((c) => h('div', { class: 'bar2' }, h('span', { class: 'lb' }, c.choice), h('span', { class: 'tr' }, h('i', { style: `width:${q.answered ? Math.round((c.n / q.answered) * 100) : 0}%` })), h('span', { class: 'n' }, `${c.n}人`)))))),
      h('h4', null, '最近答えた人'),
      r.respondents.length
        ? h('table', null, h('thead', null, h('tr', null, ['名前', '答え', '状態', '日時'].map((x) => h('th', null, x)))),
            h('tbody', null, r.respondents.map((x) => h('tr', { class: 'click', onclick: () => this.act(() => this.friendDialog(x.line_user_id)) },
              h('td', { class: 'nm' }, x.display_name || x.line_user_id.slice(0, 8)),
              h('td', null, r.survey.questions.map((q, i) => (x.answers?.[String(i)] ? `${q.attribute}：${x.answers[String(i)]}` : null)).filter(Boolean).join('・') || '—'),
              h('td', null, x.completed_at ? h('span', { class: 'badge green' }, '全部答えた') : h('span', { class: 'badge' }, '途中')),
              h('td', { class: 'muted' }, fmt(x.updated_at))))))
        : h('div', { class: 'empty' }, 'まだ答えた人はいません')),
      [h('button', { class: 'btn pri', onclick: () => this.closeDialog() }, '閉じる')]);
  }

  // ---- タブ：友だち ----
  async tFriends(p) {
    const tags = await this.call('tags.list');
    let q = '';
    let tag = '';
    let status = '';
    const box = h('div');
    let seq = 0;
    const load = async () => {
      const my = ++seq;
      const rows = await this.call('friends.list', { q, tag, status, limit: 200 });
      if (my !== seq) return; // 入力が続いたときは、いちばん新しい結果だけ出す
      put(box, rows.length
        ? h('table', null, h('thead', null, h('tr', null, ['名前', '状態', '会員', 'タグ', '追加日'].map((x) => h('th', null, x)))),
            h('tbody', null, rows.map((f) => h('tr', { class: 'click', onclick: () => this.friendDialog(f.line_user_id) },
              h('td', { class: 'nm' }, f.display_name || f.line_user_id.slice(0, 8)),
              h('td', null, statusBadge(f.status)),
              h('td', null, f.member_ref ? h('span', { class: 'badge blue' }, this.planName(f.member_plan) || '登録のみ') : h('span', { class: 'muted' }, '—')),
              h('td', null, f.tags.map((t) => h('span', { class: 'tagx' }, t))),
              h('td', { class: 'muted' }, fmt(f.followed_at))))))
        : h('div', { class: 'empty' }, '該当する友だちはいません'));
    };
    const f = this.dash.friends;
    put(p, h('div', { class: 'toolbar' },
      h('input', { placeholder: '名前で探す', oninput: (e) => { q = e.target.value; load().catch((er) => this.toast(er.message, 'err')); } }),
      h('select', { onchange: (e) => { tag = e.target.value; load(); } }, h('option', { value: '' }, 'タグ：すべて'), tags.map((t) => h('option', { value: t.name }, `${t.name}（${t.friends}）`))),
      h('select', { onchange: (e) => { status = e.target.value; load(); } }, h('option', { value: '' }, '状態：すべて'), h('option', { value: 'active' }, '友だち'), h('option', { value: 'blocked' }, 'ブロック')),
      h('span', { class: 'muted' }, `友だち ${f.active}人／ブロック ${f.blocked}人／会員連携 ${f.members}人`)), box);
    await load();
  }
  async friendDialog(userId) {
    const [d, st, groups] = await Promise.all([this.call('friends.get', { userId }), this.call('settings.get'), this.call('attributes.groups').catch(() => [])]);
    const f = d.friend;
    const isTarget = (st.admin_user_ids || []).includes(userId);
    const reload = async () => { await this.refresh(); await this.friendDialog(userId); };
    // 運営の通知先（テスト送信などが届く先）に、入れる／外す。自分の LINE を友だち一覧から開いて、ここで入れる
    const targetBtn = h('button', { class: 'btn sm', title: '「運営にテスト送信」や、運営への通知が届く先に、入れる／外す', onclick: () => this.act(async () => {
      const s2 = await this.call('settings.get');
      const cur = new Set(s2.admin_user_ids || []);
      if (cur.has(userId)) cur.delete(userId);
      else cur.add(userId);
      await this.write('settings.update', { patch: { admin_user_ids: [...cur] } });
      this.toast(cur.has(userId) ? '運営の通知先に入れました（「運営にテスト送信」の宛先になります）' : '運営の通知先から外しました');
      await reload();
    }) }, isTarget ? '運営の通知先から外す' : '運営の通知先にする');
    const tagInput = h('input', { class: 'inp', placeholder: 'タグを追加（Enter）', style: 'padding:3px 8px', onkeydown: (e) => {
      if (e.key === 'Enter' && !e.isComposing && e.target.value.trim()) this.act(async () => { await this.write('tags.add', { userId, tag: e.target.value.trim() }); await reload(); });
    } });
    const body = h('div', null,
      h('dl', { class: 'kv' },
        h('dt', null, '状態'), h('dd', null, statusBadge(f.status)),
        h('dt', null, '追加日'), h('dd', null, fmt(f.followed_at)),
        h('dt', null, '会員サイト'), h('dd', null, f.member_ref ? `連携済み（プラン：${this.planName(f.member_plan) || '登録のみ'}・ランク${f.member_rank}）` : '未連携'),
        h('dt', null, 'LINE の ID'), h('dd', null, h('code', { class: 'mono', 'data-userid': userId, style: 'word-break:break-all' }, userId), ' ', isTarget ? h('span', { class: 'badge green', 'data-target': '' }, '運営の通知先') : null, ' ', this.can('settings') ? targetBtn : null)),
      groups.length ? [h('h4', null, '属性'),
        h('div', { class: 'fm', 'data-attrs': '', style: 'grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px' }, groups.map((g) => {
          const cur = d.attributes?.[g.name]?.[0] ?? '';
          const opts = [...g.choices, ...(cur && !g.choices.includes(cur) ? [cur] : [])];
          return h('label', null, g.name, h('select', { 'data-attr': g.name, disabled: !this.can('friends'), onchange: (e) => {
            const v = e.target.value;
            this.act(async () => { await this.write('attributes.set', { userId, group: g.name, value: v }); this.toast(v ? `${g.name}を「${v}」にしました` : `${g.name}を外しました`); await reload(); });
          } }, h('option', { value: '' }, '（未回答）'), opts.map((c) => h('option', { value: c, selected: c === cur }, c))));
        }))] : null,
      h('h4', null, 'タグ'),
      h('div', null, d.tags.map((t) => h('span', { class: 'tagx' }, t, this.can('friends') ? h('button', { title: '外す', onclick: () => this.act(async () => { await this.write('tags.remove', { userId, tag: t }); await reload(); }) }, '×') : null)), this.can('friends') ? tagInput : null),
      h('h4', null, '友だち情報'),
      Object.keys(d.fields).length ? h('dl', { class: 'kv' }, Object.entries(d.fields).flatMap(([k, v]) => [h('dt', null, k), h('dd', null, v)])) : h('div', { class: 'muted' }, 'なし'),
      h('h4', null, 'ステップ配信'),
      d.enrollments.length
        ? d.enrollments.map((e) => h('div', { class: 'item' }, h('b', null, e.scenario), e.event ? ` （${e.event}）` : '', ' ', statusBadge(e.status), e.stop_reason ? h('span', { class: 'muted' }, `（${STOP_REASON[e.stop_reason] || e.stop_reason}）`) : null,
            h('ul', { class: 'steps' }, (e.steps || []).map((s) => h('li', null, h('span', { class: 'when' }, `${s.position}通目：${fmt(s.due_at)}`), statusBadge(s.status), s.skip_reason ? h('span', { class: 'muted' }, SKIP_REASON[s.skip_reason] || s.skip_reason) : null)))))
        : h('div', { class: 'muted' }, '登録なし'),
      h('h4', null, 'イベント'),
      d.events.length ? d.events.map((e) => h('div', null, `${e.title}（${fmt(e.starts_at)}）`, ' ', statusBadge(e.status))) : h('div', { class: 'muted' }, 'なし'),
      h('h4', null, '直近のやり取り'),
      d.messages.length
        ? h('table', null, h('tbody', null, d.messages.map((m) => h('tr', null, h('td', { class: 'muted', style: 'white-space:nowrap' }, fmt(m.created_at)), h('td', { style: 'white-space:nowrap' }, m.direction === 'in' ? '友だち→' : '→友だち'), h('td', { class: 'muted', style: 'white-space:nowrap' }, sourceLabel(m.source) || m.kind), h('td', null, short(m.text_preview, 60))))))
        : h('div', { class: 'muted' }, 'なし'));
    this.openDialog(f.display_name || userId.slice(0, 8), body, [
      h('button', { class: 'btn', 'data-open-chat': '', onclick: async () => { this.closeDialog(); this._chat.userId = userId; this.tab = 'chat'; this.renderTabs(); await this.renderTab(); } }, 'チャットを開く'),
      this.onOpenFriend ? h('button', { class: 'btn', onclick: () => { this.closeDialog(); this.onOpenFriend(userId); } }, 'この人のスマホを開く') : null]);
  }

  // ---- タブ：ルール ----
  async tRules(p) {
    const rules = await this.call('rules.list');
    const canEdit = this.can('edit');
    const tpl = canEdit ? h('select', { class: 'btn sm', onchange: (e) => { const t = RULE_TPL[e.target.value]; e.target.value = ''; if (t) this.act(() => this.ruleForm(JSON.parse(JSON.stringify(t)))); } },
      h('option', { value: '' }, '＋ルールを追加（ひな形を選ぶ）'), Object.keys(RULE_TPL).map((k) => h('option', { value: k }, k))) : null;
    put(p, h('div', { class: 'toolbar' }, tpl, h('span', { class: 'muted' }, '上にあるルールから順に調べ、最初に当てはまったもので止まります（「止めない」設定を除く）')),
      rules.map((r) => h('div', { class: 'item' + (r.enabled ? '' : ' off') },
        h('h3', null, h('span', { class: 'badge' }, `優先 ${r.priority}`), r.name, h('span', { class: 'grow' }),
          canEdit ? this.enableSwitch(r.enabled, r.name, (on) => this.act(async () => { await this.write('rules.setEnabled', { id: r.id, enabled: on }); await this.refresh(); })) : statusBadge(r.enabled ? 'active' : 'stopped')),
        h('div', null, h('b', null, 'きっかけ：'), describeTrigger(r)),
        Object.keys(r.conditions || {}).length ? h('div', null, h('b', null, '条件：'), describeConditions(r.conditions)) : null,
        h('div', null, h('b', null, 'やること：'), r.actions.map(describeAction).join(' → ')),
        canEdit ? h('div', { class: 'acts' },
          h('button', { class: 'btn sm', onclick: () => this.act(() => this.ruleForm(r)) }, '編集'),
          h('button', { class: 'btn sm danger', onclick: async () => {
            if (await this.askConfirm('ルールを削除', `「${r.name}」を削除しますか？`, '削除する', { danger: true })) this.act(async () => { await this.write('rules.delete', { id: r.id }); await this.refresh(); });
          } }, '削除')) : null)));
  }
  // ---- タブ：ステップ配信 ----
  async tScenarios(p) {
    const sc = await this.call('scenarios.list');
    const canEdit = this.can('edit');
    const span = (steps) => {
      const days = Math.max(0, ...(steps || []).filter((x) => x.anchor === 'enrolled').map((x) => x.offsetDays || 0));
      return days ? `登録から${days}日間` : '';
    };
    const starts = (s) => [s.start_on_follow ? '友だち追加で始まる' : null, (s.start_on_tags || []).length ? `タグ「${s.start_on_tags.join('・')}」で始まる` : null, (s.steps || []).some((x) => x.anchor === 'event') ? 'イベントの申込で始まる' : null].filter(Boolean);
    put(p, h('div', { class: 'toolbar' },
        canEdit ? h('button', { class: 'btn sm', 'data-add-scenario': '', onclick: () => this.act(() => this.scenarioForm(null)) }, '＋ステップ配信を追加') : null,
        this.templateSelect(),
        h('span', { class: 'muted', 'data-scenario-count': '' }, `ステップ配信 ${sc.length}件（${this.limitText('max_scenarios', sc.length)}・1つ100通まで）`)),
      h('p', { class: 'muted', style: 'margin:0 0 8px' }, '登録した時（またはイベントの開始・指定した日時）から数えて、決めた日時に、自動でメッセージを送ります。属性のタグで始めれば、校種・年代ごとに、別のステップ配信を流せます。'),
      sc.length ? null : h('div', { class: 'empty' }, 'まだステップ配信がありません。「ひな形から作る」で、中身を見てから作れます。'),
      sc.map((s) => h('div', { class: 'item' + (s.enabled ? '' : ' off'), 'data-scenario': s.name },
        h('h3', null, s.name, h('span', { class: 'badge blue' }, `配信中 ${s.active_enrollments}人`), h('span', { class: 'muted' }, `（完了 ${s.completed_enrollments ?? 0}・止まった ${s.stopped_enrollments ?? 0}・これまで ${s.total_enrollments}人）`), h('span', { class: 'grow' }),
          canEdit ? this.enableSwitch(s.enabled, s.name, (on) => this.act(async () => { await this.write('scenarios.setEnabled', { id: s.id, enabled: on }); await this.refresh(); })) : statusBadge(s.enabled ? 'active' : 'stopped')),
        s.description ? h('div', { class: 'sub' }, s.description) : null,
        h('div', { class: 'sub' }, [`ステップ ${(s.steps || []).length}通（1人あたり最大 ${(s.steps || []).length}通）`, span(s.steps), ...starts(s)].filter(Boolean).join('　')),
        Object.keys(s.audience || {}).length ? h('div', { class: 'sub' }, `対象：${describeConditions(s.audience)}`) : null,
        s.stop_on_reply ? h('div', { class: 'sub' }, `反応で分かれる：返事があったら止める${s.reply_scenario ? `→「${s.reply_scenario}」へ` : ''}`) : null,
        s.stop_on_tags.length ? h('div', { class: 'sub' }, `止めるタグ：${s.stop_on_tags.join('・')}`) : null,
        h('ul', { class: 'steps' }, (s.steps || []).map((st) => h('li', null, h('span', { class: 'when' }, `${st.position}通目　${describeStep(st)}`),
          h('span', null, short(messageText(st.messages.find((m) => messageText(m) != null)) ?? '', 46), st.messages.map((m) => specialLabel(m)).filter(Boolean).map((l) => h('span', { class: 'muted' }, ` ［${l}］`)))))),
        h('div', { class: 'acts' },
          canEdit ? h('button', { class: 'btn sm', onclick: () => this.act(() => this.scenarioForm(s)) }, '編集') : null,
          this.can('send') && !(s.steps || []).some((x) => x.anchor === 'event') ? h('button', { class: 'btn sm', 'data-enroll': s.name, title: '条件に合う友だちを、いま、まとめて登録します', onclick: () => this.act(() => this.enrollDialog(s)) }, 'まとめて登録') : null))));
  }


  // ---- タブ：動画特典（動画を最後まで見た人に、期限つきの特典） ----
  async tVideos(p) {
    const list = await this.call('videos.list');
    const canEdit = this.can('edit');
    put(p,
      h('div', { class: 'toolbar' },
        canEdit ? h('button', { class: 'btn sm', 'data-add-video': '', onclick: () => this.act(() => this.videoForm(null)) }, '＋動画特典を追加') : null,
        this.templateSelect(['video-matching']),
        h('span', { class: 'muted' }, `動画特典 ${list.length}件（${this.limitText('max_video_offers', list.length)}）`)),
      h('p', { class: 'muted', style: 'margin:0 0 8px' }, 'LINE の動画として送り、最後まで見た人にだけ「○日○時まで」の特典を案内します（見たかどうかは LINE が知らせてくれます。案内と特典は返信なので、通数を使いません）。動画は、ステップ配信・ルール・チャットの「＋動画特典」で入れます。'),
      list.length
        ? list.map((v) => h('div', { class: 'item' + (v.enabled ? '' : ' off'), 'data-video': v.key },
            h('h3', null, v.name, h('span', { class: 'badge' }, v.key), h('span', { class: 'badge blue' }, `見た ${v.watched}人・受け取った ${v.claimed}人・期限切れ ${v.expired}人`), h('span', { class: 'grow' }),
              canEdit ? this.enableSwitch(v.enabled, v.name, (on) => this.act(async () => { await this.write('videos.setEnabled', { id: v.id, enabled: on }); await this.refresh(); })) : statusBadge(v.enabled ? 'active' : 'stopped')),
            h('div', { class: 'sub' }, `見てから ${v.deadline_hours}時間以内に受け取れる${v.watched_tag ? `　見た人のタグ：${v.watched_tag}` : ''}${v.claimed_tag ? `　受け取った人のタグ：${v.claimed_tag}` : ''}`),
            h('div', { class: 'sub mono' }, short(v.video_url, 70)),
            h('div', { class: 'acts' },
              h('button', { class: 'btn sm', onclick: () => this.act(() => this.videoViewersDialog(v)) }, '見た人'),
              canEdit ? h('button', { class: 'btn sm', onclick: () => this.act(() => this.videoForm(v)) }, '編集') : null)))
        : h('div', { class: 'empty' }, 'まだ動画特典がありません'));
  }

  async videoForm(orig) {
    const surveys = await this.call('surveys.list').catch(() => []);
    const v = orig
      ? { key: orig.key, name: orig.name, enabled: orig.enabled, videoUrl: orig.video_url, previewUrl: orig.preview_url, deadlineHours: orig.deadline_hours, watchedMessage: orig.watched_message ?? '', bonusMessages: JSON.parse(JSON.stringify(orig.bonus_messages || [''])), expiredMessage: orig.expired_message ?? '', watchedTag: orig.watched_tag ?? '', claimedTag: orig.claimed_tag ?? '' }
      : { key: '', name: '', enabled: true, videoUrl: '', previewUrl: '', deadlineHours: 48, watchedMessage: '', bonusMessages: [''], expiredMessage: '', watchedTag: '', claimedTag: '' };
    const initial = JSON.stringify(v);
    const title = orig ? `動画特典を編集：${orig.name}` : '動画特典を追加';
    const err = h('div', { class: 'err', style: 'display:none' });
    const inp = (key, attrs = {}) => h('input', { value: v[key] ?? '', 'data-f': key, oninput: (e) => { v[key] = attrs.type === 'number' ? Number(e.target.value) : e.target.value; }, ...attrs });
    const build = () => h('div', { class: 'fm', 'data-form': 'video' },
      h('div', { style: 'display:grid;grid-template-columns:1fr 1fr;gap:10px' },
        h('label', null, '名前', inp('name', { placeholder: '例：ジーニー紹介動画' })),
        h('label', null, 'キー', h('span', null, orig ? '変えられません' : '半角の英数字とハイフン（例：genie-intro）'), inp('key', { disabled: !!orig, placeholder: 'genie-intro' }))),
      h('label', null, '動画の URL（https の mp4・200MB まで）', h('span', null, 'LINE の決まりです。動画は、https で見られる場所に置いてください'), inp('videoUrl', { placeholder: 'https://…/intro.mp4' })),
      h('label', null, 'プレビュー画像の URL（https の JPEG／PNG・1MB まで）', inp('previewUrl', { placeholder: 'https://…/intro.jpg' })),
      h('label', null, '見てから、何時間まで受け取れるか', h('input', { type: 'number', min: '1', max: '8760', value: String(v.deadlineHours), 'data-f': 'deadlineHours', oninput: (e) => { v.deadlineHours = Number(e.target.value); } })),
      h('label', null, '最後まで見た人への返事（任意）', h('span', null, '{{deadline}} に期限（例：10月8日(木) 21:00）が入ります。空なら標準の文。［特典を受け取る］のボタンが付きます'), h('textarea', { rows: '3', 'data-f': 'watchedMessage', value: v.watchedMessage, oninput: (e) => { v.watchedMessage = e.target.value; } })),
      h('h4', null, '特典（受け取った人に返すもの。4件まで）'),
      this.messagesEditor(v.bonusMessages, show, { specials: { surveys, offers: [] } }),
      h('label', null, '期限を過ぎて押した人への返事（任意）', h('textarea', { rows: '2', 'data-f': 'expiredMessage', value: v.expiredMessage, oninput: (e) => { v.expiredMessage = e.target.value; } })),
      h('div', { style: 'display:grid;grid-template-columns:1fr 1fr;gap:10px' },
        h('label', null, '見た人に付けるタグ（任意）', h('span', null, 'このタグで、ステップ配信を始められます'), inp('watchedTag', { placeholder: '動画視聴:紹介動画' })),
        h('label', null, '受け取った人に付けるタグ（任意）', inp('claimedTag', { placeholder: '特典受取:マッチング権利' }))),
      h('p', { class: 'muted', style: 'margin:0' }, 'キーワードで受け取れるようにするときは、ルールの「動画特典を渡す」を使います（例：リッチメニューの「#特典希望」）。'),
      err);
    const foot = () => [
      h('button', { class: 'btn', onclick: () => this.requestClose() }, 'キャンセル'),
      h('button', { class: 'btn pri', 'data-save': '', onclick: async () => {
        err.style.display = 'none';
        try {
          await this.write('videos.save', { offer: { ...v, key: v.key.trim(), watchedMessage: v.watchedMessage || null, expiredMessage: v.expiredMessage || null, watchedTag: v.watchedTag || null, claimedTag: v.claimedTag || null } });
          this.closeDialog();
          this.toast('動画特典を保存しました');
          await this.refresh();
        } catch (e) {
          err.textContent = e.message;
          err.style.display = '';
          err.scrollIntoView?.({ block: 'nearest' });
        }
      } }, '保存')];
    const show = () => {
      const top = this.$dlgBody.scrollTop;
      this.openDialog(title, build(), foot());
      this._guard = () => JSON.stringify(v) !== initial;
      this.$dlgBody.scrollTop = top;
    };
    show();
  }

  async videoViewersDialog(v) {
    const r = await this.call('videos.viewers', { key: v.key });
    this.openDialog(`見た人：${v.name}`, r.rows.length
      ? h('table', null, h('thead', null, h('tr', null, ['名前', '見た日時', '期限', '特典', '見た回数'].map((x) => h('th', null, x)))),
          h('tbody', null, r.rows.map((x) => h('tr', { class: 'click', onclick: () => this.act(() => this.friendDialog(x.line_user_id)) },
            h('td', { class: 'nm' }, x.display_name || x.line_user_id.slice(0, 8)), h('td', null, fmt(x.watched_at)), h('td', null, fmt(x.deadline_at)),
            h('td', null, x.claimed_at ? h('span', { class: 'badge green' }, `受け取った（${fmt(x.claimed_at)}）`) : new Date(x.deadline_at) < new Date() ? h('span', { class: 'badge' }, '期限切れ') : h('span', { class: 'badge amber' }, 'まだ')),
            h('td', null, String(x.watch_count))))))
      : h('div', { class: 'empty' }, 'まだ、最後まで見た人はいません'), [h('button', { class: 'btn pri', onclick: () => this.closeDialog() }, '閉じる')]);
  }

  // ---- タブ：イベント ----
  async tEvents(p) {
    const ev = await this.call('events.list');
    const canEdit = this.can('edit');
    put(p, h('div', { class: 'toolbar' },
        canEdit ? h('button', { class: 'btn sm', 'data-add-event': '', onclick: () => this.act(() => this.eventForm(null, ev)) }, '＋イベントを追加') : null,
        canEdit ? h('button', { class: 'btn sm', 'data-add-series': '', title: '毎週の決まった曜日・時刻のイベント（ZOOM教員会など）を、まとめて作ります', onclick: () => this.act(() => this.seriesDialog()) }, '＋毎週の日程をまとめて作る') : null,
        h('span', { class: 'muted' }, '申込は、ルールの「イベントに申し込む」か、「日程を選ぶボタン」（ステップ配信・ルール・アンケートのお礼に入れられる）で受けます')),
      ev.map((e) => h('div', { class: 'item' },
        h('h3', null, e.title, h('span', { class: 'badge blue' }, `申込 ${e.participants}${e.capacity ? ' / ' + e.capacity : ''}人`)),
        h('div', { class: 'sub' }, `開催：${fmt(e.starts_at)}　キー：${e.key}　リマインド：${e.reminder_scenario || 'なし'}`,
          e.zoom_meeting_id ? `　Zoom：${e.zoom_meeting_id}${e.finalized_at ? '（出欠 確定済み）' : e.zoom_ended_at ? '（終了・確定待ち）' : ''}${e.recording_ready_at ? '　録画あり' : ''}` : ''),
        h('div', { class: 'acts' },
          h('button', { class: 'btn sm', 'data-edit-event': e.key, onclick: () => this.act(() => this.eventForm(e, ev)) }, '編集'),
          e.zoom_meeting_id ? h('button', { class: 'btn sm', 'data-attendance': e.key, onclick: () => this.act(() => this.attendanceDialog(e)) }, '出欠を見る') : null,
          h('button', { class: 'btn sm', onclick: () => this.act(async () => {
            const r = await this.call('events.participants', { key: e.key });
            this.openDialog(`${e.title}：参加者`, r.length
              ? h('table', null, h('thead', null, h('tr', null, ['名前', '申込日時', '状態'].map((x) => h('th', null, x)))), h('tbody', null, r.map((x) => h('tr', null, h('td', null, x.display_name), h('td', null, fmt(x.applied_at)), h('td', null, statusBadge(x.status))))))
              : h('div', { class: 'empty' }, 'まだ申込はありません'));
          }) }, '参加者を見る'),
          h('button', { class: 'btn sm', onclick: () => {
            const inp = h('input', { class: 'inp', type: 'datetime-local', value: fmtLocalInput(e.starts_at) });
            this.openDialog('日程を変更', h('div', null, h('p', { class: 'muted', style: 'margin-top:0' }, '申込済みの人のリマインド（まだ送っていない分）も、新しい日時に合わせて計算し直します。'), inp),
              [h('button', { class: 'btn pri', onclick: () => this.act(async () => {
                const r = await this.write('events.reschedule', { key: e.key, startsAt: fromLocalInput(inp.value) });
                this.closeDialog();
                this.toast(`日程を変更しました（リマインド ${r.moved}件を再計算）`);
                await this.refresh();
              }) }, '変更する')]);
          } }, '日程を変更')))));
  }


  /** 毎週の決まった曜日・時刻のイベントを、まとめて作る（キー＝頭＋日付。例：kyoinkai-20261015） */
  async seriesDialog() {
    const scenarios = await this.call('scenarios.list').catch(() => []);
    const today = fmtLocalInput(new Date().toISOString()).slice(0, 10);
    const in8w = fmtLocalInput(new Date(Date.now() + 56 * 86400e3).toISOString()).slice(0, 10);
    const d = { title: 'ZOOM教員会', keyPrefix: 'kyoinkai-', weekdays: new Set([3, 4]), time: '21:00', from: today, to: in8w, url: '', capacity: '', reminderScenario: '' };
    const err = h('div', { class: 'err', style: 'display:none' });
    const inp = (key, attrs = {}) => h('input', { value: d[key], 'data-f': key, oninput: (e) => { d[key] = e.target.value; }, ...attrs });
    const body = h('div', { class: 'fm', 'data-form': 'series' },
      h('label', null, 'イベント名', inp('title')),
      h('label', null, 'キーの頭', h('span', null, '日程を選ぶボタンで、この頭のイベントだけを並べられます（例：kyoinkai-）'), inp('keyPrefix')),
      h('div', null, h('b', { style: 'font-size:12.5px' }, '曜日'), h('div', { class: 'chips', style: 'margin-top:4px' }, WD.map((w, i) => {
        const chip = h('label', { class: 'chip' + (d.weekdays.has(i) ? ' on' : ''), 'data-wd': String(i) }, h('input', { type: 'checkbox', checked: d.weekdays.has(i), onchange: (e) => { if (e.target.checked) d.weekdays.add(i); else d.weekdays.delete(i); chip.classList.toggle('on', e.target.checked); } }), w);
        return chip;
      }))),
      h('div', { style: 'display:grid;grid-template-columns:repeat(3,1fr);gap:10px' },
        h('label', null, '時刻', inp('time', { type: 'time' })),
        h('label', null, 'いつから', inp('from', { type: 'date' })),
        h('label', null, 'いつまで', h('span', null, '180日・60件まで'), inp('to', { type: 'date' }))),
      h('label', null, '参加用の URL（任意）', inp('url', { placeholder: 'https://zoom.us/j/…' })),
      h('div', { style: 'display:grid;grid-template-columns:1fr 1fr;gap:10px' },
        h('label', null, '定員（任意）', inp('capacity', { type: 'number', min: '1' })),
        h('label', null, 'リマインドのステップ配信（任意）', h('select', { 'data-f': 'reminderScenario', onchange: (e) => { d.reminderScenario = e.target.value; } }, h('option', { value: '' }, '（なし）'), scenarios.filter((x) => (x.steps || []).some((st) => st.anchor === 'event')).map((x) => h('option', { value: x.name }, x.name))))),
      err);
    this.openDialog('毎週の日程をまとめて作る', body, [
      h('button', { class: 'btn', onclick: () => this.closeDialog() }, 'やめる'),
      h('button', { class: 'btn pri', 'data-save': '', onclick: async () => {
        err.style.display = 'none';
        try {
          const r = await this.write('events.createSeries', { series: { title: d.title.trim(), keyPrefix: d.keyPrefix.trim(), weekdays: [...d.weekdays], time: d.time, from: d.from, to: d.to, url: d.url || null, capacity: d.capacity === '' ? null : Number(d.capacity), reminderScenario: d.reminderScenario || null } });
          this.closeDialog();
          this.toast(`${r.created.length}件の日程を作りました${r.skipped.length ? `（${r.skipped.length}件は、すでにあるので飛ばしました）` : ''}`);
          await this.refresh();
        } catch (e) {
          err.textContent = e.message;
          err.style.display = '';
        }
      } }, '作る')]);
  }

  // Zoom の出欠：誰が何分いたか。LINE の友だちに結びつかなかった人は、ここで友だちを選んで結ぶ
  async attendanceDialog(e) {
    const rows = await this.call('events.attendance', { key: e.key });
    const need = e.attend_min_minutes ?? 10;
    const unmatched = rows.filter((r) => !r.line_user_id).length;
    const finalize = h('button', { class: 'btn pri', 'data-finalize': '', onclick: async () => {
      const ok = await this.askConfirm('出欠を確定します', `いまの記録で、参加した人（${need}分以上）に「attended:${e.key}」、申込済みで来ていない人に「absent:${e.key}」のタグを付けます。\nタグが付くと、設定済みのお礼・フォローの配信が動きます。`, '確定する');
      if (!ok) return;
      await this.act(async () => {
        const r = await this.write('events.finalizeAttendance', { key: e.key });
        this.toast(`確定しました（参加 ${r.attended}人／欠席 ${r.absent}人／結びつかなかった方 ${r.unmatched.length}人）`);
        await this.refresh();
      });
    } }, '出欠を確定する');
    this.openDialog(`${e.title}：出欠`, rows.length
      ? h('div', null,
          h('p', { class: 'muted', style: 'margin-top:0' }, `${need}分以上いた人を「参加」にしています。${unmatched ? `LINE の友だちに結びつかなかった方が ${unmatched} 人います。「友だちに結ぶ」から選んでください。` : ''}`),
          h('table', null, h('thead', null, h('tr', null, ['Zoom の名前', 'メール', '在室', 'LINE の友だち', ''].map((x) => h('th', null, x)))),
            h('tbody', null, rows.map((r) => h('tr', { 'data-pkey': r.participant_key },
              h('td', null, r.user_name || '—'),
              h('td', { class: 'muted' }, r.email || '—'),
              h('td', null, `${r.minutes}分 `, r.attended ? h('span', { class: 'badge green' }, '参加') : h('span', { class: 'badge' }, '基準未満')),
              h('td', null, r.line_user_id ? (r.display_name || r.line_user_id.slice(0, 8)) : h('span', { class: 'badge red' }, '未連携')),
              h('td', null, r.line_user_id ? null : h('button', { class: 'btn sm', onclick: () => this.act(() => this.linkDialog(e, r)) }, '友だちに結ぶ')))))))
      : h('div', { class: 'empty' }, 'まだ Zoom からの出欠の記録がありません（会議が始まると、入退室が自動で記録されます）'),
      [finalize]);
  }
  async linkDialog(e, r) {
    const box = h('div');
    let q = r.user_name || '';
    let seq = 0;
    const load = async () => {
      const my = ++seq;
      const fr = await this.call('friends.list', { q, limit: 20 });
      if (my !== seq) return;
      put(box, fr.length
        ? h('table', null, h('tbody', null, fr.map((f) => h('tr', { class: 'click', 'data-friend': f.line_user_id, onclick: () => this.act(async () => {
            const res = await this.write('events.linkZoomParticipant', { key: e.key, participantKey: r.participant_key, userId: f.line_user_id });
            this.toast(`結びつけました（参加 ${res.attended}人／欠席 ${res.absent}人）`);
            await this.attendanceDialog(e);
          }) }, h('td', null, f.display_name || f.line_user_id.slice(0, 8)), h('td', null, statusBadge(f.status))))))
        : h('div', { class: 'empty' }, '該当する友だちはいません。名前の一部で探してみてください'));
    };
    const inp = h('input', { class: 'inp', value: q, placeholder: 'LINE の名前で探す', style: 'width:100%', oninput: (ev) => { q = ev.target.value; load().catch(() => {}); } });
    this.openDialog(`「${r.user_name || r.email || r.participant_key}」は誰ですか`, h('div', null, h('p', { class: 'muted', style: 'margin-top:0' }, '選ぶと、この参加者を、その友だちとして記録します（次回からも、同じ名前・メールなら自動で結びつきます）。'), inp, box),
      [h('button', { class: 'btn', onclick: () => this.act(() => this.attendanceDialog(e)) }, '戻る')]);
    await load();
  }

  // ---- タブ：一斉配信 ----
  async tBroadcasts(p) {
    const safe = (pr) => pr.catch(() => []);
    const [bs, allTags, groups, surveys, offers] = await Promise.all([this.call('broadcasts.list'), safe(this.call('tags.list')), safe(this.call('attributes.groups')), safe(this.call('surveys.list')), safe(this.call('videos.list'))]);
    const canSend = this.can('send');
    const plans = this.meta.plans.filter((x) => x.rank > 0);
    const tomorrow9 = fmtLocalInput(new Date(Date.now() + 24 * 3600e3).toISOString()).slice(0, 10) + 'T09:00'; // 予約の初期値：あすの朝9時（日本時間）
    const f = { tags_all: '', tags_any: '', tags_none: '', member: '', min_rank: '', name: '', at: tomorrow9 };
    const attrSel = {};
    const messages = [''];
    const audience = () => {
      const a = {};
      if (list(f.tags_all).length) a.tags_all = list(f.tags_all);
      if (list(f.tags_any).length) a.tags_any = list(f.tags_any);
      if (list(f.tags_none).length) a.tags_none = list(f.tags_none);
      const attrs = attrsFromSelection(attrSel);
      if (Object.keys(attrs).length) a.attrs = attrs;
      if (f.member) a.member = f.member;
      if (f.min_rank) a.min_rank = Number(f.min_rank);
      return a;
    };
    const filled = () => messages.filter((m) => (typeof m === 'string' ? m.trim() : true));
    const firstText = () => messageText(messages.find((m) => messageText(m)?.trim())) ?? '';
    const est = h('div', { class: 'est', 'data-est': '' }, '…');
    let lastEst = null;
    let seq = 0;
    const update = async () => {
      const my = ++seq;
      try {
        const e = await this.call('broadcasts.estimate', { audience: audience() });
        if (my !== seq) return;
        lastEst = e;
        est.className = 'est ' + (e.ok && e.recipients > 0 ? 'ok' : 'ng');
        put(est, h('b', null, `宛先 ${e.recipients}人 → ${e.cost}通を使います。`), ` 今月の販促で使える残りは ${e.available}通（上限${e.cap}通・使用済み${e.used}通・送信待ち${e.pending}通）。`,
          h('b', null, e.recipients === 0 ? ' 宛先が0人なので、送れません。タグなどの条件を見直してください。' : e.ok ? ' 送れます。' : ' 上限を超えるため送れません。宛先を絞るか、LINEのプランを上げてください。'));
      } catch (er) {
        lastEst = null;
        est.className = 'est ng';
        est.textContent = er.message;
      }
    };
    const inp = (key, ph) => h('input', { placeholder: ph, oninput: (e) => { f[key] = e.target.value; update(); } });
    const testSend = () => this.act(async () => {
      if (!filled().length) throw new Error('メッセージを入力してください');
      const r = await this.write('testSend', { to: 'admins', messages: filled() });
      if (!r.ok) throw new Error(r.message || 'テスト送信できませんでした');
      const msg = { sent: `運営のLINE（${r.recipients}人）に送りました。スマホで見た目を確かめてください`, queued: '送信待ちに入れました（送信を止めている間は届きません）', dry_run: 'dry-run のため、送らずに数えただけです', failed: `送れませんでした：${r.error || ''}` };
      this.toast(msg[r.status] || `状態：${r.status}`, r.status === 'failed' ? 'err' : undefined);
      await this.refreshTop(); // 入力中の本文を消さないよう、上の通数だけ読み直す（フォームは作り直さない）
    });
    const send = (scheduled) => this.act(async () => {
      if (!filled().length) throw new Error('メッセージを入力してください');
      if (scheduled && !f.at) throw new Error('予約する日時を選んでください');
      await update();
      if (!lastEst) throw new Error('宛先の人数を確かめられませんでした。もう一度お試しください');
      if (lastEst.recipients === 0) throw new Error('宛先が0人です。タグなどの条件を見直してください');
      if (!scheduled && !lastEst.ok) throw new Error('今月の上限を超えるため送れません。宛先を絞ってください');
      if (!scheduled) {
        // 取り返しがつかないので、人数と本文をもう一度見せてから送る。送る時点の人数が違えば、送らない
        const body = h('div', null, h('p', { style: 'margin-top:0' }, h('b', null, `${lastEst.recipients}人に、${lastEst.cost}通`), 'を使って、次の内容を今すぐ送ります（吹き出し ' + filled().length + ' つ）。'),
          filled().map((m) => h('div', { class: 'est', style: 'white-space:pre-wrap;margin-bottom:6px' }, messageText(m) ?? `［${specialLabel(m) ?? m.type}］`)), h('p', { class: 'muted' }, '送ったあとは取り消せません（送信待ちの間だけ、「送信状況」のタブで止められます）。'));
        if (!(await this.askConfirm('一斉配信を送る', body, '送る', { danger: true }))) return;
      }
      const b = await this.write('broadcasts.create', { name: f.name.trim() || short(firstText(), 20) || '無題の配信', audience: audience(), messages: filled(), scheduledAt: scheduled ? fromLocalInput(f.at) : null });
      if (!scheduled) {
        const r = await this.write('broadcasts.send', { id: b.id, expectedRecipients: lastEst.recipients });
        if (!r.ok) throw new Error((r.message || '送れませんでした（' + r.reason + '）') + '\n（下書きとして残してあります）');
        this.toast(`${r.recipients}人に向けて送信を始めました`);
      } else {
        this.toast('予約しました');
      }
      await this.refresh();
    });
    const msgBox = h('div', { 'data-bc-messages': '' });
    const drawMsgs = () => put(msgBox, this.messagesEditor(messages, drawMsgs, { vars: false, specials: { surveys: surveys.filter((x) => x.enabled), offers: offers.filter((x) => x.enabled) } }));
    drawMsgs();
    put(p,
      canSend ? h('div', { class: 'f' },
        h('label', null, '配信名', h('input', { placeholder: '例：10月のお知らせ（空なら、本文の最初）', oninput: (e) => (f.name = e.target.value) })),
        groups.length ? h('div', { class: 'f' }, h('b', { style: 'font-size:12.5px' }, '属性で絞る（任意）'), this.attrChips(groups, attrSel, update)) : null,
        h('div', { class: 'two' }, h('label', null, 'タグ（すべて持っている）', inp('tags_all', '例：特典受取')), h('label', null, 'タグ（どれか持っている）', inp('tags_any', '例：診断希望、特典受取'))),
        h('div', { class: 'two' },
          h('label', null, 'タグ（持っていない人だけ）', inp('tags_none', '例：event:zaigai')),
          this.meta.adapter === 'genie'
            ? h('label', null, '会員サイト', h('div', { class: 'two', style: 'gap:6px' },
                h('select', { onchange: (e) => { f.member = e.target.value; update(); } }, h('option', { value: '' }, '指定なし'), h('option', { value: 'linked' }, '連携済みの人だけ'), h('option', { value: 'unlinked' }, '未連携の人だけ')),
                h('select', { onchange: (e) => { f.min_rank = e.target.value; update(); } }, h('option', { value: '' }, 'プラン指定なし'), plans.map((x) => h('option', { value: String(x.rank) }, `${x.name}以上`)))))
            : null),
        h('div', { class: 'f' }, h('b', { style: 'font-size:12.5px' }, 'メッセージ（全員に同じ文面。吹き出しは5つまで・1人1通のまま）'), msgBox),
        allTags.length ? h('div', { class: 'muted', 'data-taglist': '' }, 'いまあるタグ：', allTags.map((t) => `${t.name}（${t.friends}人）`).join('・')) : null,
        est,
        h('p', { class: 'muted', style: 'margin:0' }, 'はじめに［運営にテスト送信］で、自分のスマホでの見え方を確かめてから、［今すぐ送る］を押してください（送ったあとは取り消せません）。通数を減らすには、属性やタグで宛先を絞る・お知らせをまとめて1回にする（吹き出しを分けても1通）・キーワードやボタンへの返事（返信は無料）で届ける、が効きます。'),
        h('div', { class: 'toolbar' },
          h('button', { class: 'btn', title: '宛先の条件に関係なく、運営のLINE（設定の「運営の通知先」）だけに送ります。通数に数えられます', onclick: testSend }, '運営にテスト送信'),
          h('button', { class: 'btn pri', onclick: () => send(false) }, '今すぐ送る'),
          h('span', { class: 'muted' }, 'または'),
          h('input', { type: 'datetime-local', value: tomorrow9, 'data-at': '', title: '予約して送る日時（日本時間）', onchange: (e) => (f.at = e.target.value) }),
          h('button', { class: 'btn', onclick: () => send(true) }, '予約して送る'))) : h('p', { class: 'muted' }, 'あなたの役割では、一斉配信は送れません（配信の履歴は見られます）。'),
      h('h4', null, '配信の履歴'),
      bs.length
        ? h('table', null, h('thead', null, h('tr', null, ['配信名', '状態', '宛先', '送信済み', '予約', ''].map((x) => h('th', null, x)))),
            h('tbody', null, bs.map((b) => h('tr', null,
              h('td', null, b.name, b.last_error ? h('div', { class: 'muted' }, b.last_error) : null), h('td', null, statusBadge(b.status)), h('td', null, b.recipient_count ?? '—'), h('td', null, b.delivered),
              h('td', { class: 'muted' }, b.scheduled_at ? fmt(b.scheduled_at) : '—'),
              h('td', null, canSend && ['draft', 'scheduled', 'sending'].includes(b.status) ? h('button', { class: 'btn sm danger', onclick: () => this.act(async () => { await this.write('broadcasts.cancel', { id: b.id }); await this.refresh(); }) }, '取り消す') : null)))))
        : h('div', { class: 'empty' }, 'まだ配信はありません'));
    if (canSend) await update();
  }

  // ---- タブ：送信状況（送信キュー） ----
  async tOutbox(p) {
    const q = this.outbox;
    const SIZE = 50;
    // 期間は、日本時間の「今日の0時」から数える
    const today = fmtLocalInput(new Date().toISOString()).slice(0, 10);
    const startOf = (daysBack) => new Date(new Date(`${today}T00:00:00+09:00`).getTime() - daysBack * 86400e3).toISOString();
    const from = { today: startOf(0), '7d': startOf(6), '30d': startOf(29) }[q.period] ?? null;
    const r = await this.call('outbox.search', { status: q.status, source: q.source, from, limit: SIZE, offset: q.page * SIZE });
    if (q.page > 0 && !r.rows.length && r.total > 0) { // 絞り込みで件数が減って、いまのページが無くなったら、最後のページへ
      q.page = Math.ceil(r.total / SIZE) - 1;
      return this.tOutbox(p);
    }
    const rows = r.rows;
    const rowAct = (r) => {
      if (r.status === 'queued') return h('button', { class: 'btn sm danger', title: 'まだ送っていないものだけ取り消せます', onclick: () => this.act(async () => { const x = await this.write('outbox.cancel', { id: r.id }); this.toast(x.ok ? '取り消しました' : 'すでに送信中か、送信済みです'); await this.refresh(); }) }, '取り消す');
      if (r.status === 'failed') return h('button', { class: 'btn sm', title: '同じ送信として積み直します（LINE 側で二重にはなりません）', onclick: () => this.act(async () => { const x = await this.write('outbox.requeue', { id: r.id }); this.toast(x.ok ? '積み直しました。次の送信処理で送ります' : '積み直せませんでした'); await this.refresh(); }) }, 'もう一度送る');
      return null;
    };
    const sel = (key, options) => h('select', { 'data-filter': key, onchange: (e) => { q[key] = e.target.value; q.page = 0; this.renderTab(); } },
      options.map(([v, l]) => h('option', { value: v, selected: v === q[key] }, l)));
    const filtered = !!(q.status || q.source || q.period);
    const first = r.total ? q.page * SIZE + 1 : 0;
    const last = q.page * SIZE + rows.length;
    const pager = () => h('div', { class: 'pager', 'data-pager': '' },
      h('button', { class: 'btn sm', 'data-prev': '', disabled: q.page === 0, onclick: () => { q.page -= 1; this.renderTab(); } }, '← 前の50件'),
      h('button', { class: 'btn sm', 'data-next': '', disabled: last >= r.total, onclick: () => { q.page += 1; this.renderTab(); } }, '次の50件 →'),
      h('span', { class: 'muted', 'data-range': '' }, r.total ? `${first}〜${last}件目（${filtered ? '絞り込んだ' : ''}全${r.total}件）` : ''));
    put(p,
      h('div', { class: 'toolbar' },
        sel('status', [['', '状態：すべて'], ['queued', '待ち'], ['sent', '送信済み'], ['failed', '失敗'], ['skipped', '見送り'], ['dry_run', '練習（送らない）']]),
        sel('source', [['', '種類：すべて'], ...Object.entries(SOURCE_LABEL)]),
        sel('period', [['', '期間：すべて'], ['today', '今日'], ['7d', '直近7日'], ['30d', '直近30日']]),
        filtered ? h('button', { class: 'btn sm', 'data-clear': '', onclick: () => { this.outbox = { status: '', source: '', period: '', page: 0 }; this.renderTab(); } }, '絞り込みをやめる') : null,
        h('span', { class: 'muted' }, 'LINEへの送信の一覧です（待ち・送信済み・失敗）。送信を止めるスイッチ・月の上限・二重送信の防止は、すべてここで効きます'),
        this.onTick ? h('button', { class: 'btn sm', onclick: () => this.act(async () => { await this.onTick(); await this.refresh(); }) }, '今すぐ送信処理を回す') : null),
      rows.length
        ? [h('table', null, h('thead', null, h('tr', null, ['作成', '種類', '宛先', '通数', '状態', '試行', '内容', ''].map((x) => h('th', null, x)))),
            h('tbody', null, rows.map((r) => h('tr', null,
              h('td', { class: 'muted', style: 'white-space:nowrap' }, fmt(r.created_at)), h('td', null, SOURCE_LABEL[r.source] || r.source), h('td', null, r.recipients + '人'), h('td', null, r.cost),
              h('td', null, statusBadge(r.status), r.last_error ? h('div', { class: 'muted', style: 'max-width:220px' }, r.last_error) : null, r.status === 'queued' && r.not_before ? h('div', { class: 'muted' }, `再送予定 ${fmt(r.not_before)}`) : null),
              h('td', null, r.attempts), h('td', null, short(r.preview, 36)), h('td', null, rowAct(r)))))), pager()]
        : h('div', { class: 'empty' }, filtered ? '該当するものはありません（絞り込みを変えるか、「絞り込みをやめる」を押してください）' : 'まだ送信の記録はありません'));
  }

  // ---- タブ：設定 ----
  async tSettings(p) {
    const s = await this.call('settings.get');
    const v = { ...s };
    v.admin_user_ids = [...(s.admin_user_ids || [])];
    const names = await Promise.all(v.admin_user_ids.map((id) => this.call('friends.get', { userId: id }).then((d) => d.friend.display_name || id.slice(0, 8)).catch(() => `（友だちではありません：${id.slice(0, 8)}…）`)));
    const adminBox = h('div', { 'data-admins': '' });
    const drawAdmins = () => put(adminBox, v.admin_user_ids.length
      ? v.admin_user_ids.map((id, i) => h('span', { class: 'tagx', 'data-admin': id }, names[i] ?? id.slice(0, 8), h('button', { type: 'button', title: '外す', onclick: () => { v.admin_user_ids.splice(i, 1); names.splice(i, 1); drawAdmins(); } }, '×')))
      : h('span', { class: 'muted' }, 'まだ誰も入っていません'));
    drawAdmins();
    const num = (k, label, hint) => h('label', null, label, hint ? h('span', null, hint) : null, h('input', { type: 'number', value: v[k], min: 0, oninput: (e) => (v[k] = Number(e.target.value)) }));
    put(p, h('div', { class: 'f', style: 'max-width:520px' },
      num('monthly_cap', '月間の通数の上限', 'LINEのプランに合わせます（無料200・ライト5,000・スタンダード30,000）'),
      num('notification_reserve', '会員通知のための取り置き', '販促の配信がこの分は使えないようにします（会員通知はこの分も使えます）'),
      h('label', null, '団体名', h('span', null, 'メッセージの {{brand_name}} になります'), h('input', { value: v.brand_name, oninput: (e) => (v.brand_name = e.target.value) })),
      h('label', null, '会員サイトのURL', h('span', null, '会員通知のリンクに使います（https:// から。空でもよい）'), h('input', { value: v.site_url, oninput: (e) => (v.site_url = e.target.value) })),
      h('div', { class: 'f' }, h('b', { style: 'font-size:12.5px' }, '運営の通知先'), h('span', { class: 'muted' }, 'テスト送信などが届く友だちです。入れるときは、［友だち］で自分を開いて「運営の通知先にする」を押します。外すときは、× を押して、下の［保存］を押します'), adminBox),
      num('reminder_max_late_minutes', 'リマインドの許す遅れ（分）', 'これ以上遅れたリマインドは送りません'),
      h('div', { class: 'f', 'data-notify-settings': '' }, h('b', { style: 'font-size:12.5px' }, '運営への知らせ（運営の通知先の LINE に届きます）'),
        h('label', { class: 'sw' }, h('input', { type: 'checkbox', checked: v.notify_admins_on_follow, 'data-f': 'notify_admins_on_follow', onchange: (e) => (v.notify_admins_on_follow = e.target.checked) }), h('span', null, '友だち追加されたら知らせる（1人の追加につき、運営の人数ぶん通数を使います）')),
        h('label', { class: 'sw' }, h('input', { type: 'checkbox', checked: v.notify_admins_on_message, 'data-f': 'notify_admins_on_message', onchange: (e) => (v.notify_admins_on_message = e.target.checked) }), h('span', null, '友だちからメッセージが来たら知らせる（同じ人からは10分に1回まで。通数を使います）')),
        h('span', { class: 'muted' }, '通数を使わずに気づくには、チャットのタブの「🔔 新着をこのパソコンに知らせる」が使えます（画面を開いているあいだ）。')),
      num('chat_retention_days', 'チャット（やり取り）を残す日数', '7〜3650日。過ぎたものは消えます'),
      this.meta.adapter === 'genie'
        ? h('label', null, h('span', null, '会員サイトの通知→LINE'), h('div', null, h('label', { class: 'sw' }, h('input', { type: 'checkbox', checked: v.genie_notify_enabled, onchange: (e) => (v.genie_notify_enabled = e.target.checked) }), h('span', null, '会員サイトのお知らせ（プランの付与など）を、LINE にも送る。切り替えの手順が済むまでは、オフにしておきます（既存の通知と、二重になるため。担当者に確認してください）'))))
        : null,
      h('div', { class: 'muted', 'data-limits': '' }, `使える数の上限：${Object.entries(this.meta?.limits?.limits || {}).filter(([, n]) => n != null).map(([k, n]) => `${k}=${n}`).join('・') || 'なし（いまは自由に使えます）'}`),
      !this.can('settings') ? h('p', { class: 'muted' }, 'あなたの役割では、設定は変えられません（見るだけ）。') : h('div', null, h('button', { class: 'btn pri', 'data-save-settings': '', onclick: () => this.act(async () => {
        const patch = { monthly_cap: v.monthly_cap, notification_reserve: v.notification_reserve, brand_name: v.brand_name, site_url: v.site_url, admin_user_ids: v.admin_user_ids || [], reminder_max_late_minutes: v.reminder_max_late_minutes,
          notify_admins_on_follow: !!v.notify_admins_on_follow, notify_admins_on_message: !!v.notify_admins_on_message, chat_retention_days: v.chat_retention_days };
        if (this.meta.adapter === 'genie') patch.genie_notify_enabled = !!v.genie_notify_enabled;
        await this.write('settings.update', { patch });
        this.toast('保存しました');
        await this.refresh();
      }) }, '保存'))));
  }


  // ---- タブ：運営メンバー（オーナーだけ） ----
  async tMembers(p) {
    const rows = await this.call('members.list');
    const err = h('div', { class: 'err', style: 'display:none' });
    const f = { email: '', displayName: '', role: 'operator' };
    const roleSel = (cur, onChange, attrs = {}) => h('select', { ...attrs, onchange: (e) => onChange(e.target.value) }, Object.entries(ROLE_LABEL).map(([k, l]) => h('option', { value: k, selected: k === cur }, l)));
    const add = () => this.act(async () => {
      err.style.display = 'none';
      try {
        const r = await this.write('members.add', { email: f.email.trim(), role: f.role, displayName: f.displayName.trim() || undefined });
        if (r.created) this.passwordDialog('運営メンバーを追加しました', f.email.trim(), r.tempPassword);
        else this.toast('すでにアカウントのある方なので、役割だけ付けました（パスワードは、その方のままです）');
        await this.tMembers(p);
      } catch (e) {
        err.textContent = e.message;
        err.style.display = '';
      }
    });
    const perms = this.meta?.roles || [];
    put(p,
      h('p', { class: 'muted', style: 'margin-top:0' }, '管理画面を使う人と、その人ができることです。追加すると、1回だけ見える仮パスワードを作ります。本人は、最初のログインで自分のパスワードに変えるまで、ほかの操作はできません。'),
      h('div', { class: 'f', style: 'max-width:640px', 'data-member-add': '' },
        h('div', { style: 'display:grid;grid-template-columns:2fr 1fr 1.3fr;gap:8px' },
          h('label', null, 'メールアドレス', h('input', { type: 'email', 'data-f': 'email', placeholder: 'name@example.com', oninput: (e) => (f.email = e.target.value) })),
          h('label', null, '名前（任意）', h('input', { 'data-f': 'displayName', placeholder: '例：須崎', oninput: (e) => (f.displayName = e.target.value) })),
          h('label', null, '役割', roleSel(f.role, (v) => (f.role = v), { 'data-f': 'role' }))),
        h('div', null, h('button', { class: 'btn pri', 'data-add-member': '', onclick: add }, '追加する')),
        err),
      h('h4', null, `運営メンバー（${rows.length}人・${this.limitText('max_members', rows.length)}）`),
      h('table', null, h('thead', null, h('tr', null, ['名前', 'メールアドレス', '役割', '状態', ''].map((x) => h('th', null, x)))),
        h('tbody', null, rows.map((m) => h('tr', { 'data-member': m.email ?? m.user_id },
          h('td', { class: 'nm' }, m.display_name || '—', m.user_id === this.me?.user?.id ? h('span', { class: 'badge green' }, 'あなた') : null),
          h('td', null, m.email || h('span', { class: 'muted' }, m.user_id.slice(0, 8))),
          h('td', null, roleSel(m.role, (v) => this.act(async () => { await this.write('members.setRole', { userId: m.user_id, role: v }); this.toast(`役割を「${ROLE_LABEL[v]}」にしました（20秒ほどで効きます）`); }).then(() => this.tMembers(p)), { 'data-role-select': '' })),
          h('td', null, m.must_change_password ? h('span', { class: 'badge amber' }, '仮パスワードのまま') : h('span', { class: 'badge green' }, '使用中'), m.last_sign_in_at ? h('div', { class: 'muted' }, `最後のログイン ${fmt(m.last_sign_in_at)}`) : null),
          h('td', null,
            h('button', { class: 'btn sm', onclick: async () => {
              if (!(await this.askConfirm('仮パスワードを作り直す', `${m.email || 'この方'} の仮パスワードを作り直しますか？（いまのパスワードは使えなくなります）`, '作り直す'))) return;
              this.act(async () => { const r = await this.write('members.resetPassword', { userId: m.user_id }); this.passwordDialog('仮パスワードを作り直しました', m.email, r.tempPassword); });
            } }, '仮パスワード'),
            h('button', { class: 'btn sm danger', onclick: async () => {
              if (!(await this.askConfirm('運営メンバーから外す', `${m.email || 'この方'} を外しますか？（管理画面が使えなくなります。20秒ほどで効きます）`, '外す', { danger: true }))) return;
              this.act(async () => { await this.write('members.remove', { userId: m.user_id }); await this.tMembers(p); });
            } }, '外す')))))),
      h('h4', null, '役割ごとにできること'),
      h('table', null, h('thead', null, h('tr', null, ['役割', 'できること'].map((x) => h('th', null, x)))),
        h('tbody', null, perms.map((r) => h('tr', null, h('td', { class: 'nm' }, r.label), h('td', null, r.perms.map((x) => this.meta?.permLabels?.[x] ?? x).join('・')))))));
  }
  /** 仮パスワードを、1回だけ見せる（閉じたら、もう見られない） */
  passwordDialog(title, email, pw) {
    const box = h('div', { class: 'pw', 'data-temp-password': '' }, pw);
    this.openDialog(title, h('div', null,
      h('p', { style: 'margin-top:0' }, h('b', null, email), ' の仮パスワードです。', h('b', null, 'この画面を閉じると、もう見られません。')),
      box,
      h('ul', { class: 'muted' },
        h('li', null, '本人だけに伝えてください（LINE の個別のトークなど）。グループや、残るメールの本文には書かないでください。'),
        h('li', null, '本人は、ログインのあとすぐに、自分のパスワード（12文字以上）に変えます。変えるまで、ほかの操作はできません。'))),
      [h('button', { class: 'btn', 'data-copy-password': '', onclick: () => this.act(async () => { await navigator.clipboard.writeText(pw); this.toast('コピーしました'); }) }, 'コピー'), h('button', { class: 'btn pri', onclick: () => this.closeDialog() }, '閉じる')]);
  }

  // ---- タブ：操作の記録 ----
  async tAudit(p) {
    const rows = await this.call('audit.list', { limit: 200 });
    put(p, h('div', { class: 'toolbar' }, h('span', { class: 'muted' }, '管理画面から行った書き込みの記録です（閲覧は残しません）。本文は先頭だけ、個人情報は残しません')),
      rows.length
        ? h('table', null, h('thead', null, h('tr', null, ['日時', '誰が', '操作', '結果', '内容（くわしい記録）'].map((x) => h('th', null, x)))),
            h('tbody', null, rows.map((r) => h('tr', null,
              h('td', { class: 'muted', style: 'white-space:nowrap' }, fmt(r.at)), h('td', null, r.actor_email || '—'), h('td', { title: r.action }, AUDIT_LABEL[r.action] || r.action),
              h('td', null, r.ok ? h('span', { class: 'badge green' }, '成功') : h('span', { class: 'badge red' }, '失敗'), r.error ? h('div', { class: 'muted' }, short(r.error, 40)) : null),
              h('td', { class: 'mono muted' }, short(JSON.stringify(r.summary), 70))))))
        : h('div', { class: 'empty' }, 'まだ記録はありません'));
  }
}

if (globalThis.customElements && !customElements.get('line-hub-admin')) customElements.define('line-hub-admin', LineHubAdmin);
