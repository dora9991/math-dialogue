// 見積書・請求書：インボイス制度に合わせた見積書・請求書・領収書をつくり、A4 の PDF・画像で保存する
(function () {
  'use strict';
  const { h } = Kit;

  Kit.css('invoice', `
.inv-sr{position:absolute!important;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
.inv-kpis{margin-bottom:16px;grid-template-columns:repeat(3,minmax(0,1fr))}
.inv-kpis .kpi-value{font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
@media (max-width:640px){
  .inv-kpis{gap:8px}
  .inv-kpis .kpi{padding:10px 10px 11px}
  .inv-kpis .kpi-label{font-size:11.5px;line-height:1.4}
  .inv-kpis .kpi-value{font-size:18px}
  .inv-kpis .kpi-sub{font-size:11.5px;line-height:1.45}
}
.inv-filters{display:flex;flex-wrap:wrap;gap:8px 10px;align-items:center;margin-bottom:12px}
.inv-filters select{width:auto;min-width:132px}
.inv-search{position:relative;flex:1 1 200px;min-width:0;max-width:340px}
.inv-search input{padding-left:34px}
.inv-search svg{position:absolute;left:10px;top:50%;transform:translateY(-50%);width:17px;height:17px;color:var(--ink-3);pointer-events:none}
.inv-count{font-size:13px;color:var(--ink-3);margin-left:auto}
.inv-list{container:invlist/inline-size}
.inv-table{display:none}
.inv-cards{display:grid;gap:10px}
@container invlist (min-width:700px){.inv-table{display:block}.inv-cards{display:none}}
.inv-table td{vertical-align:middle}
.inv-table tbody tr{cursor:pointer}
.inv-table .inv-c-subj{max-width:260px}
.inv-link{background:none;border:0;padding:0;font:inherit;color:var(--gosu);font-weight:700;cursor:pointer;text-align:left;font-variant-numeric:tabular-nums}
.inv-link:hover{text-decoration:underline}
.inv-kind{display:block;font-size:11.5px;color:var(--ink-3);line-height:1.3}
.inv-soon{display:block;font-size:11.5px;color:var(--ink-3)}
.inv-acts{display:flex;gap:4px;justify-content:flex-end;white-space:nowrap}
.inv-card{border:1px solid var(--line);border-radius:var(--r);background:var(--surface);padding:12px 14px;display:grid;gap:3px;cursor:pointer;min-width:0}
.inv-card:hover{border-color:var(--line-strong)}
.inv-card-top{display:flex;flex-wrap:wrap;align-items:center;gap:6px 8px}
.inv-card-client{font-weight:700;color:var(--ink);overflow-wrap:anywhere}
.inv-card-subj{font-size:13.5px;color:var(--ink-2);overflow-wrap:anywhere}
.inv-card-foot{display:flex;flex-wrap:wrap;align-items:center;gap:4px 12px;margin-top:4px}
.inv-card-amt{font-size:18px;font-weight:700;font-variant-numeric:tabular-nums}
.inv-card-dates{font-size:12.5px;color:var(--ink-3)}
.inv-card-foot .inv-acts{margin-left:auto}
.inv-menu{position:fixed;z-index:95;min-width:210px;max-width:calc(100vw - 24px);padding:6px;display:grid;background:var(--surface);color:var(--ink);border:1px solid var(--line);border-radius:10px;box-shadow:var(--shadow-2)}
.inv-menu button{display:flex;align-items:center;gap:10px;width:100%;min-height:40px;padding:8px 12px;border:0;border-radius:7px;background:transparent;color:var(--ink);font:inherit;font-size:14px;text-align:left;cursor:pointer;white-space:nowrap}
.inv-menu button:hover,.inv-menu button:focus-visible{background:var(--surface-2)}
.inv-menu button svg{width:18px;height:18px;flex:none;color:var(--ink-3)}
.inv-menu button.danger,.inv-menu button.danger svg{color:var(--bad)}
.inv-menu hr{border:0;height:1px;background:var(--line);margin:4px 6px}
.inv-top{display:flex;align-items:center;gap:4px;margin:-8px 0 4px -8px}
.inv-top .spacer{flex:1}
.inv-note{font-size:12.5px;color:var(--ink-3);margin:-10px 0 14px}
.inv-ed{container:inved/inline-size}
.inv-ed-switch{position:sticky;top:calc(var(--top-h) + env(safe-area-inset-top,0px));z-index:6;background:var(--bg);padding:6px 0 10px;display:flex;align-items:center;gap:10px;flex-wrap:wrap}
@media (min-width:1000px){.inv-ed-switch{top:0}}
.inv-ed-grid{display:grid;gap:20px;grid-template-columns:minmax(0,1fr)}
.inv-form{display:grid;gap:14px;min-width:0}
.inv-side{display:grid;gap:10px;min-width:0;align-content:start}
@container inved (min-width:860px){
  .inv-ed-switch{display:none}
  .inv-ed-grid{grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);align-items:start}
  .inv-side{position:sticky;top:16px}
  .inv-paper canvas{max-width:calc((100dvh - 170px) * .7072)}
}
@container inved (max-width:859.98px){
  .inv-ed[data-pane="form"] .inv-side{display:none}
  .inv-ed[data-pane="preview"] .inv-form{display:none}
}
.inv-sec{background:var(--surface);border:1px solid var(--line);border-radius:var(--r);padding:14px 16px 16px;display:grid;gap:12px;min-width:0}
.inv-sec>h2{font-size:15px;font-weight:700;display:flex;align-items:center;gap:8px;flex-wrap:wrap;min-height:30px}
.inv-sec>h2 .spacer{flex:1}
.inv-g{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(min(100%,140px),1fr))}
.inv-g.client{grid-template-columns:minmax(0,1fr) 108px;align-items:start}
.inv-hint{font-size:12.5px;color:var(--ink-2);background:var(--surface-2);border-radius:8px;padding:8px 10px;line-height:1.6;display:flex;gap:8px;align-items:flex-start}
.inv-hint svg{width:16px;height:16px;flex:none;margin-top:2px;color:var(--ink-3)}
.inv-hint.warn{background:var(--warn-wash);color:var(--ink)}
.inv-hint.warn svg{color:var(--warn)}
.inv-hint .btn{margin-left:auto}
.inv-links{display:flex;flex-wrap:wrap;gap:6px 8px;align-items:center;font-size:13px;color:var(--ink-2)}
.inv-status{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center}
.inv-status .field{max-width:190px}
.inv-items{container:invitems/inline-size;display:grid;gap:8px}
.inv-ihead{display:none}
.inv-item{display:grid;gap:6px 8px;align-items:end;padding:10px;border:1px solid var(--line);border-radius:var(--r-sm);background:var(--surface-2);min-width:0;
  grid-template-columns:24px minmax(0,1fr) minmax(0,1fr) minmax(0,1.3fr) auto;
  grid-template-areas:"no name name name act" "no qty unit price price" "no rate rate amt amt"}
.inv-item:focus-within{border-color:var(--gosu)}
.inv-i-no{grid-area:no;align-self:start;margin-top:9px;width:22px;height:22px;border-radius:50%;background:var(--surface);border:1px solid var(--line-strong);color:var(--ink-2);font-size:12px;display:grid;place-items:center;font-variant-numeric:tabular-nums}
.inv-i-name{grid-area:name}.inv-i-qty{grid-area:qty}.inv-i-unit{grid-area:unit}.inv-i-price{grid-area:price}.inv-i-rate{grid-area:rate}
.inv-i-amt{grid-area:amt;display:grid;gap:2px;text-align:right;min-width:0}
.inv-i-act{grid-area:act;display:flex;gap:2px;align-self:start}
.inv-i-act .inv-mv{display:none}
.inv-cell{display:grid;gap:2px;min-width:0}
.inv-cell>span,.inv-i-amt>span{font-size:11.5px;color:var(--ink-3);line-height:1.3}
.inv-i-name>span{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.inv-cell input.r{text-align:right;font-variant-numeric:tabular-nums}
.inv-i-amt output{font-weight:700;font-variant-numeric:tabular-nums;min-height:38px;display:flex;align-items:center;justify-content:flex-end;white-space:nowrap}
.inv-mark{color:var(--shu);font-weight:700;margin-left:2px}
@media (pointer:coarse){.inv-keyhint{display:none}}
@container invitems (min-width:470px){
  .inv-i-act .inv-mv{display:inline-flex}
  .inv-i-act .inv-i-menu{display:none}
  .inv-item{grid-template-columns:24px minmax(0,.8fr) minmax(0,.7fr) minmax(0,1.1fr) minmax(0,1.2fr) minmax(122px,1fr);
    grid-template-areas:"no name name name name act" "no qty unit price rate amt"}
  .inv-i-act{justify-content:flex-end}
}
@container invitems (min-width:880px){
  .inv-ihead{display:grid;gap:8px;padding:0 10px;font-size:12px;font-weight:700;color:var(--ink-3);grid-template-columns:24px minmax(0,1fr) 72px 64px 108px 122px 104px 126px}
  .inv-ihead span.r{text-align:right}
  .inv-item{grid-template-columns:24px minmax(0,1fr) 72px 64px 108px 122px 104px 126px;grid-template-areas:"no name qty unit price rate amt act";align-items:center;padding:6px 10px}
  .inv-i-no{margin-top:0;align-self:center}
  .inv-i-act{align-self:center}
  .inv-cell>span,.inv-i-amt>span{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
}
.inv-sum{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:4px 16px;margin:0;font-size:14px;font-variant-numeric:tabular-nums}
.inv-sum dt{color:var(--ink-2)}
.inv-sum dd{margin:0;text-align:right;white-space:nowrap}
.inv-sum .tot{font-weight:700;font-size:16px;color:var(--ink);border-top:1px solid var(--line);padding-top:6px;margin-top:2px}
.inv-sum .sub{font-size:12.5px;color:var(--ink-3)}
.inv-rates{display:flex;flex-wrap:wrap;gap:6px}
.inv-issuer{display:grid;gap:1px;font-size:13.5px;color:var(--ink-2);overflow-wrap:anywhere}
.inv-issuer b{color:var(--ink);font-size:15px}
.inv-paper{background:var(--surface-2);border:1px solid var(--line);border-radius:var(--r);padding:14px;overflow:auto;min-width:0}
.inv-paper canvas{display:block;width:100%;height:auto;margin:0 auto;box-shadow:var(--shadow-2);border-radius:2px}
.inv-paper.is-zoom{max-height:calc(100dvh - 130px)}
.inv-paper.is-zoom canvas{width:920px;max-width:none}
.inv-ptools{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.inv-ptools .inv-pinfo{font-size:12.5px;color:var(--ink-3)}
.inv-seal-prev{display:flex;gap:14px;align-items:center;flex-wrap:wrap}
.inv-seal-prev canvas{width:72px;height:72px;border:1px solid var(--line);border-radius:6px;background:var(--surface)}
.inv-prefix{display:grid;gap:10px;grid-template-columns:repeat(auto-fit,minmax(min(100%,150px),1fr))}
.inv-print{display:none}
@media print{
  body.inv-printing>*:not(.inv-print){display:none!important}
  body.inv-printing>.inv-print{display:block!important}
  .inv-print img{display:block;width:100%;height:auto}
}
`);

  /* ───────── 決まりごと ───────── */
  const TYPES = {
    estimate: { label: '見積書', title: '御見積書', amount: 'お見積金額（税込）', greet: '下記のとおりお見積り申し上げます。', due: '有効期限', net: '差引お見積額' },
    invoice: { label: '請求書', title: '請求書', amount: 'ご請求金額（税込）', greet: '下記のとおりご請求申し上げます。', due: 'お支払期限', net: '差引ご請求額' },
    receipt: { label: '領収書', title: '領収書', amount: '領収金額（税込）', greet: '上記正に領収いたしました。', due: '', net: '差引領収額' },
  };
  const TYPE_KEYS = ['estimate', 'invoice', 'receipt'];
  const RATES = [10, 8, 0];
  const RATE_LABEL = { 10: '10%', 8: '8%軽減', 0: '対象外' };
  const RATE_DOC = { 10: '10%対象', 8: '8%対象（軽減）', 0: '非課税・対象外' };
  const ROUND = { floor: '切り捨て', round: '四捨五入', ceil: '切り上げ' };
  const DUE_RULES = { eom1: '翌月末', eom0: '発行した月の末日', d30: '発行日から30日後', d14: '発行日から14日後' };
  const UNITS = ['回', '時間', '式', '点', '個', '部', '冊', '枚', '人', '名', 'か月', '日', '件'];
  const NOTES = {
    estimate: 'ご不明な点がございましたら、お気軽にお問い合わせください。',
    invoice: '恐れ入りますが、お振込手数料はご負担くださいますようお願いいたします。',
    receipt: '',
  };
  const SETTINGS_BLANK = {
    rounding: 'floor', taxMode: 'exclusive', dueRule: 'eom1',
    notes: Kit.clone(NOTES), seal: false,
    prefix: { estimate: 'Q', invoice: 'INV', receipt: 'R' },
  };
  const SETTINGS_SAMPLE = Object.assign(Kit.clone(SETTINGS_BLANK), { seal: true });
  const LS_FILTER = 'invoice:filter';

  // 設定の足りない所を既定で埋める
  function normSettings(s) {
    const b = Kit.clone(SETTINGS_BLANK);
    s = s || {};
    const out = Object.assign(b, s, {
      notes: Object.assign({}, b.notes, s.notes),
      prefix: Object.assign({}, b.prefix, s.prefix),
    });
    if (!ROUND[out.rounding]) out.rounding = 'floor';
    if (out.taxMode !== 'inclusive') out.taxMode = 'exclusive';
    if (!DUE_RULES[out.dueRule]) out.dueRule = 'eom1';
    for (const t of TYPE_KEYS) if (!String(out.prefix[t] || '').trim()) out.prefix[t] = SETTINGS_BLANK.prefix[t];
    out.seal = !!out.seal;
    return out;
  }

  /* ───────── 数の読み取り ───────── */
  // 全角の数字・カンマ・円記号などをゆるく受け付ける
  function parseNum(v) {
    if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
    let s = String(v == null ? '' : v).replace(/[０-９．，－]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0));
    s = s.replace(/[−ー‐―]/g, '-').replace(/[,\s¥￥円]/g, '');
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : 0;
  }
  const nf2 = new Intl.NumberFormat('ja-JP', { maximumFractionDigits: 2 });
  const fmtN = (n) => nf2.format(+n || 0);
  const decs = (x) => { const s = String(Math.abs(x)); if (/e/i.test(s)) return 6; const i = s.indexOf('.'); return i < 0 ? 0 : Math.min(6, s.length - i - 1); };

  /* ───────── 税の計算 ─────────
     ・明細の金額 = 数量 × 単価（1円未満は端数処理）
     ・消費税は税率ごとに合計してから1回だけ端数処理（インボイスのきまり。行ごとには丸めない）
     ・源泉所得税 = 税抜金額 × 10.21%（100万円を超える部分は 20.42%）、1円未満切り捨て */
  // 整数 n ÷ 整数 d を、決めた端数処理で整数にする（誤差なし）
  function divRound(n, d, mode) {
    const s = n < 0 ? -1 : 1;
    n = Math.abs(n);
    let q = Math.floor(n / d), rem = n - q * d;
    if (rem < 0) { q -= 1; rem += d; } else if (rem >= d) { q += 1; rem -= d; }
    if (mode === 'ceil' ? rem > 0 : mode === 'round' ? rem * 2 >= d : false) q += 1;
    return s * q || 0;
  }
  function lineAmount(qty, price, mode) {
    qty = parseNum(qty); price = parseNum(price);
    const qd = decs(qty), pd = decs(price);
    const qi = Math.round(Math.abs(qty) * Math.pow(10, qd)), pi = Math.round(Math.abs(price) * Math.pow(10, pd));
    const sign = (qty < 0) !== (price < 0) ? -1 : 1;
    return sign * divRound(qi * pi, Math.pow(10, qd + pd), mode) || 0;
  }
  function withholdingTax(base) {
    base = Math.floor(parseNum(base));
    if (base <= 0) return 0;
    if (base <= 1000000) return divRound(base * 1021, 10000, 'floor');
    return divRound(1021000000 + (base - 1000000) * 2042, 10000, 'floor');
  }
  function calc(doc) {
    const mode = ROUND[doc.rounding] ? doc.rounding : 'floor';
    const incl = doc.taxMode === 'inclusive';
    const by = {};
    for (const r of RATES) by[r] = { rate: r, base: 0, excl: 0, tax: 0, incl: 0, count: 0 };
    const lines = (doc.items || []).map((it) => {
      const r = RATES.includes(+it.taxRate) ? +it.taxRate : 10;
      const amt = lineAmount(it.qty, it.price, mode);
      by[r].base += amt;
      if (amt || String(it.name || '').trim()) by[r].count++;
      return amt;
    });
    for (const r of RATES) {
      const b = by[r];
      if (incl) { b.tax = r ? divRound(b.base * r, 100 + r, mode) : 0; b.incl = b.base; b.excl = b.base - b.tax; }
      else { b.tax = r ? divRound(b.base * r, 100, mode) : 0; b.excl = b.base; b.incl = b.base + b.tax; }
    }
    const excl = Kit.sum(RATES, (r) => by[r].excl), tax = Kit.sum(RATES, (r) => by[r].tax), total = Kit.sum(RATES, (r) => by[r].incl);
    const wh = doc.withholding ? withholdingTax(excl) : 0;
    return { lines, by, rates: RATES.filter((r) => by[r].count > 0), excl, tax, total, withholding: wh, net: total - wh, has8: by[8].count > 0, mode, incl };
  }
  const isBlankItem = (it) => !String(it.name || '').trim() && !parseNum(it.price);
  const docTotal = (d) => (Number.isFinite(+d.total) && d.total !== '' && d.total != null ? +d.total : calc(d).total);

  /* ───────── 日付・番号 ───────── */
  const today = () => Kit.ymd();
  const yearOf = (ymd) => { const d = Kit.parseYmd(ymd); return isNaN(d) ? new Date().getFullYear() : d.getFullYear(); };
  function defaultDue(type, issue, rule) {
    const d = Kit.parseYmd(issue || today());
    if (isNaN(d) || type === 'receipt') return '';
    if (type === 'estimate') return Kit.ymd(Kit.addDays(d, 30));
    if (rule === 'd30') return Kit.ymd(Kit.addDays(d, 30));
    if (rule === 'd14') return Kit.ymd(Kit.addDays(d, 14));
    const add = rule === 'eom0' ? 1 : 2;
    return Kit.ymd(new Date(d.getFullYear(), d.getMonth() + add, 0));
  }
  const escRe = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pad3 = (n) => String(n).padStart(3, '0');
  // 種類ごと・年ごとの次の番号（例：INV-2026-004）
  function nextNumber(type, issue, docs, settings, exceptId) {
    const pre = (settings.prefix[type] || SETTINGS_BLANK.prefix[type]).trim();
    const y = yearOf(issue);
    const re = new RegExp('^' + escRe(pre) + '-' + y + '-(\\d+)$');
    let max = 0;
    for (const d of docs) {
      if (d.type !== type || (exceptId && d.id === exceptId)) continue;
      const m = re.exec(String(d.number || '').trim());
      if (m) max = Math.max(max, +m[1]);
    }
    return pre + '-' + y + '-' + pad3(max + 1);
  }
  const autoNumberRe = (type, settings) => new RegExp('^' + escRe((settings.prefix[type] || '').trim()) + '-\\d{4}-\\d+$');

  /* ───────── サンプル（ひらめき数学舎） ───────── */
  function buildSamples() {
    const dom = Kit.today().getDate();
    const invIssue = Kit.rel(-Math.min(4, dom - 1)); // いつも今月の日付
    const month = Kit.parseYmd(invIssue).getMonth() + 1;
    const base = { taxMode: 'exclusive', rounding: 'floor', withholding: false, bank: '', paidAt: '', fromLead: '', fromEstimate: '', fromInvoice: '' };
    const list = [
      Object.assign({}, base, {
        id: 's-inv-1', type: 'estimate', number: 'Q-' + yearOf(Kit.rel(-12)) + '-001', issueDate: Kit.rel(-12), dueDate: Kit.rel(18),
        client: { name: 'さくら台中学校 PTA', honorific: '御中', address: '佐賀県佐賀市〇〇町1-2-3', contact: '佐藤 健' },
        subject: '出張ワークショップ（90分×2回）',
        items: [
          { name: '出張ワークショップ「図形の性質を発見しよう」（90分）', qty: 2, unit: '回', price: 30000, taxRate: 10 },
          { name: 'ワークシート・教材一式（参加者40名分）', qty: 1, unit: '式', price: 6000, taxRate: 10 },
          { name: '交通費（佐賀市内）', qty: 2, unit: '回', price: 1000, taxRate: 10 },
        ],
        notes: NOTES.estimate, status: 'sent',
      }),
      Object.assign({}, base, {
        id: 's-inv-2', type: 'invoice', number: 'INV-' + yearOf(invIssue) + '-001', issueDate: invIssue, dueDate: Kit.rel(6),
        client: { name: '山田 さくら', honorific: '様', address: '', contact: '' },
        subject: '個別レッスン ' + month + '月分（8回）',
        items: [{ name: 'オンライン個別レッスン（60分）', qty: 8, unit: '回', price: 4000, taxRate: 10 }],
        notes: NOTES.invoice, bank: 'サンプル銀行 さが支店　普通 1234567　カズノ ヒカル', status: 'sent',
      }),
      Object.assign({}, base, {
        id: 's-inv-3', type: 'receipt', number: 'R-' + yearOf(Kit.rel(-20)) + '-001', issueDate: Kit.rel(-20), dueDate: '',
        client: { name: '田中 みのり', honorific: '様', address: '', contact: '' },
        subject: '授業ツール・テンプレート集',
        items: [
          { name: '授業ツール・テンプレート集（中学数学）', qty: 1, unit: '点', price: 1500, taxRate: 10 },
          { name: '授業ツール・テンプレート集（高校数学）', qty: 1, unit: '点', price: 1500, taxRate: 10 },
        ],
        taxMode: 'inclusive', notes: '', status: 'paid', paidAt: Kit.rel(-20),
      }),
    ];
    for (const d of list) d.total = calc(d).total;
    return list;
  }
  const SAMPLES = buildSamples();
  // ほかのアプリ（ダッシュボード・カレンダー）から読んでも同じサンプルが見えるように
  if (Kit.store.sample) { Kit.store.sample('invoices', SAMPLES); Kit.store.sample('invoiceSettings', SETTINGS_SAMPLE); }

  // 外からも使えるように（テスト・ほかのアプリ）
  window.Invoices = { calc, withholdingTax, lineAmount, nextNumber: (type, issue, docs, s) => nextNumber(type, issue, docs || [], normSettings(s)) };

  /* ───────── 文字の折り返し（日本語は1字ずつ。句読点は行頭に来ないよう前の行へ） ───────── */
  function wrapLines(g, s, maxW, maxLines) {
    const out = [];
    for (const para of String(s == null ? '' : s).split(/\r?\n/)) {
      const chars = Array.from(para);
      let cur = '';
      for (const ch of chars) {
        const t = cur + ch;
        if (cur && g.measureText(t).width > maxW) {
          if (/[、。，．,.)）」』】〕！？!?・ー]/.test(ch)) { out.push(t); cur = ''; continue; }
          const sp = cur.lastIndexOf(' ');
          if (/[A-Za-z0-9@._-]/.test(ch) && sp > 0 && cur.length - sp < 24) { out.push(cur.slice(0, sp)); cur = cur.slice(sp + 1) + ch; continue; }
          out.push(cur);
          cur = ch;
        } else cur = t;
      }
      out.push(cur);
    }
    if (maxLines && out.length > maxLines) {
      const cut = out.slice(0, maxLines);
      let last = cut[maxLines - 1];
      while (last && g.measureText(last + '…').width > maxW) last = Array.from(last).slice(0, -1).join('');
      cut[maxLines - 1] = last + '…';
      return { lines: cut, cut: true };
    }
    return { lines: out, cut: false };
  }

  const jpDate = (s) => (s ? Kit.fmtDate(s, 'YYYY年M月D日') : '');
  // 登録番号を「T＋13桁」にそろえる（形が違うときは入力のまま）
  function normReg(no) {
    const raw = String(no || '').trim();
    const s = raw.replace(/[０-９Ｔｔ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0)).replace(/[\s\-‐－]/g, '');
    if (/^\d{13}$/.test(s)) return 'T' + s;
    if (/^[Tt]\d{13}$/.test(s)) return 'T' + s.slice(1);
    return raw;
  }
  const regOk = (no) => /^T\d{13}$/.test(normReg(no));

  /* ───────── 印影（角印）。屋号の字を縦書きで升目に並べ、朱で少しかすれさせる ───────── */
  const hashStr = (s) => { let x = 2166136261; for (const ch of String(s)) { x ^= ch.codePointAt(0); x = Math.imul(x, 16777619); } return x >>> 0; };
  const rng = (seed) => () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  function sealLayout(name) {
    let s = Array.from(String(name || '').replace(/[\s　、。・,.()（）「」『』【】［］[\]〈〉《》"'“”‘’!！?？:：;；/／\\|｜~〜_＿&＆+＋*＊#＃@＠%％-]/g, ''))
      .map((ch) => (/[ーｰ－—―]/.test(ch) ? '｜' : ch));
    if (!s.length) return null;
    if (s.length > 15) s = s.slice(0, 15);
    const cands = [s.concat(['之', '印']), s.concat(['印']), s];
    let t = cands.find((x) => [4, 9, 16].includes(x.length));
    if (!t) t = s.length + 2 <= 9 ? cands[0] : cands[1];
    const cols = Math.ceil(Math.sqrt(t.length));
    const per = [];
    let rest = t.length;
    for (let i = 0; i < cols; i++) { const k = Math.ceil(rest / (cols - i)); per.push(k); rest -= k; }
    return { chars: t, cols, per };
  }
  const sealCache = new Map();
  function sealImage(name, S, disp) {
    const key = name + '|' + S + '|' + disp;
    if (sealCache.has(key)) return sealCache.get(key);
    const L = sealLayout(name);
    if (!L) return null;
    const c = document.createElement('canvas');
    c.width = c.height = S;
    const g = c.getContext('2d');
    const rnd = rng(hashStr(name));
    const amp = S * 0.012;
    const rough = (x, y, w, hh, a) => {
      const pts = [];
      const step = Math.max(4, w / 30);
      const edge = (x0, y0, x1, y1) => { const n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / step)); for (let i = 0; i < n; i++) { const k = i / n; pts.push([x0 + (x1 - x0) * k + (rnd() - 0.5) * a, y0 + (y1 - y0) * k + (rnd() - 0.5) * a]); } };
      edge(x, y, x + w, y); edge(x + w, y, x + w, y + hh); edge(x + w, y + hh, x, y + hh); edge(x, y + hh, x, y);
      g.moveTo(pts[0][0], pts[0][1]);
      for (const p of pts.slice(1)) g.lineTo(p[0], p[1]);
      g.closePath();
    };
    const m = S * 0.035, b = S * 0.068;
    g.fillStyle = PAL.shu;
    g.beginPath();
    rough(m, m, S - 2 * m, S - 2 * m, amp);
    rough(m + b, m + b, S - 2 * (m + b), S - 2 * (m + b), amp * 0.6);
    g.fill('evenodd');
    // 字（右の列から、上から下へ）
    const inner = m + b + S * 0.03, box = S - inner * 2, colW = box / L.cols;
    let idx = 0;
    for (let ci = 0; ci < L.cols; ci++) {
      const k = L.per[ci], cellH = box / k, cx = S - inner - colW * (ci + 0.5);
      for (let r = 0; r < k; r++) {
        const ch = L.chars[idx++];
        const cy = inner + cellH * (r + 0.5);
        g.save();
        g.font = '800 ' + Math.round(colW) + 'px ' + disp;
        g.textAlign = 'center';
        g.textBaseline = 'alphabetic';
        const mt = g.measureText(ch);
        const bl = mt.actualBoundingBoxLeft || 0, br = mt.actualBoundingBoxRight || 0, ba = mt.actualBoundingBoxAscent || 0, bd = mt.actualBoundingBoxDescent || 0;
        const gw = bl + br || colW * 0.8, gh = ba + bd || colW * 0.8;
        g.translate(cx, cy);
        g.scale(Math.min(2.4, (colW * 0.9) / gw), Math.min(2.6, (cellH * 0.88) / gh));
        g.fillText(ch, (bl - br) / 2, (ba - bd) / 2);
        g.restore();
      }
    }
    // かすれとムラ
    g.globalCompositeOperation = 'destination-out';
    g.fillStyle = '#000';
    const dots = Math.round((S * S) / 240);
    for (let i = 0; i < dots; i++) { g.globalAlpha = 0.2 + rnd() * 0.65; g.beginPath(); g.arc(rnd() * S, rnd() * S, (0.35 + rnd() * 1.25) * (S / 170), 0, Math.PI * 2); g.fill(); }
    for (let i = 0; i < 7; i++) { g.globalAlpha = 0.07 + rnd() * 0.11; g.beginPath(); g.arc(rnd() * S, rnd() * S, S * (0.05 + rnd() * 0.09), 0, Math.PI * 2); g.fill(); }
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';
    sealCache.set(key, c);
    return c;
  }

  /* ───────── A4 の書類を描く（プレビュー・PNG・PDF はすべてこの1つの関数で） ───────── */
  const A4W = 1654, A4H = 2339, MX = 118; // A4 を約200dpiで
  // 書き出す書類は紙の色で固定（画面のダーク表示とは別）
  const PAL = { paper: '#ffffff', ink: '#1b1d22', ink2: '#3f444d', ink3: '#737985', rule: '#7d838e', soft: '#c9ced6', wash: '#edf1f8', accent: '#23437f', shu: '#c8352a' };
  function fontStacks() {
    let body = '', disp = '';
    try { body = getComputedStyle(document.body).fontFamily; disp = getComputedStyle(document.documentElement).getPropertyValue('--font-display').trim(); } catch (e) { /* 既定の字体で描く */ }
    return { body: body || 'sans-serif', disp: disp || body || 'serif' };
  }
  const itemName = (it) => String(it.name || '') + (+it.taxRate === 8 ? ' ※' : '');
  const numS = (n) => (n < 0 ? '−' : '') + fmtN(Math.abs(n));
  function summaryRows(c, T) {
    const out = c.incl
      ? [['合計（税込）', c.total, true], ['うち消費税', c.tax]]
      : [['小計（税抜）', c.excl], ['消費税', c.tax], ['合計（税込）', c.total, true]];
    if (c.withholding) out.push(['源泉所得税', -c.withholding], [T.net, c.net, true]);
    return out;
  }

  function drawDoc(canvas, doc, prof, settings) {
    const W = A4W, H = A4H, CW = W - MX * 2;
    if (canvas.width !== W) canvas.width = W;
    if (canvas.height !== H) canvas.height = H;
    const g = canvas.getContext('2d');
    const FS = fontStacks();
    const F = (px, w, disp) => (w || 400) + ' ' + px + 'px ' + (disp ? FS.disp : FS.body);
    const T = TYPES[doc.type] || TYPES.invoice;
    const c = calc(doc);
    const cl = doc.client || {};
    const info = { truncated: 0 };
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = PAL.paper;
    g.fillRect(0, 0, W, H);
    const text = (s, x, y, f, color, align, mid) => { g.font = f; g.fillStyle = color || PAL.ink; g.textAlign = align || 'left'; g.textBaseline = mid ? 'middle' : 'alphabetic'; g.fillText(String(s), x, y); };
    const width = (s, f) => { g.font = f; return g.measureText(String(s)).width; };
    const fill = (x, y, w, hh, color) => { g.fillStyle = color; g.fillRect(x, y, w, hh); };
    const hline = (x1, x2, y, w, color) => fill(x1, y - w / 2, x2 - x1, w, color || PAL.rule);
    const vline = (x, y1, y2, w, color) => fill(x - w / 2, y1, w, y2 - y1, color || PAL.rule);
    const rect = (x, y, w, hh, lw, color) => { g.lineWidth = lw; g.strokeStyle = color; g.strokeRect(x, y, w, hh); };
    const fit = (s, maxW, px, min, w, disp) => { let p = px; while (p > min && width(s, F(p, w, disp)) > maxW) p -= 1; return p; };
    const wrapT = (s, maxW, f, maxLines) => { g.font = f; return wrapLines(g, s, maxW, maxLines); };

    // 右上：番号と発行日
    let y = 128;
    for (const [k, v] of [['番号', doc.number || ''], ['発行日', jpDate(doc.issueDate)]]) {
      text(k, W - MX - 430, y, F(24), PAL.ink3);
      text(v, W - MX, y, F(26, 500), PAL.ink2, 'right');
      y += 40;
    }
    // 表題（字の間をあけて中央に）
    const tf = F(80, 800, true), chars = Array.from(T.title), gap = 44;
    const cws = chars.map((ch) => width(ch, tf));
    const tW = Kit.sum(cws) + gap * (chars.length - 1);
    let tx = W / 2 - tW / 2;
    chars.forEach((ch, i) => { text(ch, tx, 300, tf, PAL.ink); tx += cws[i] + gap; });
    hline(W / 2 - tW / 2 - 70, W / 2 + tW / 2 + 70, 334, 4, PAL.accent);
    hline(W / 2 - tW / 2 - 70, W / 2 + tW / 2 + 70, 344, 1.5, PAL.accent);

    // 左：宛先
    const LW = 780;
    let ly = 448;
    const hon = cl.honorific || '';
    const honW = hon ? width(hon, F(40, 700, true)) + 24 : 0;
    const nameMax = LW - honW - 10, nm = String(cl.name || '').trim();
    const np = fit(nm, nameMax, 50, 32, 700, true);
    if (nm && width(nm, F(np, 700, true)) > nameMax) {
      const two = wrapT(nm, nameMax, F(32, 700, true), 2).lines;
      text(two[0], MX, ly - 42, F(32, 700, true));
      text(two[1] || '', MX, ly, F(32, 700, true));
    } else if (nm) text(nm, MX, ly, F(np, 700, true));
    if (hon) text(hon, MX + LW, ly, F(40, 700, true), PAL.ink, 'right');
    hline(MX, MX + LW, ly + 20, 3, PAL.ink);
    ly += 20;
    const sub = [];
    if (cl.address) sub.push(...wrapT(cl.address, LW, F(24), 2).lines);
    if (String(cl.contact || '').trim()) { const ct = String(cl.contact).trim(); sub.push('ご担当　' + ct + (/(様|殿|御中)$/.test(ct) ? '' : ' 様')); }
    for (const s of sub) { ly += 38; text(s, MX, ly, F(24), PAL.ink2); }
    if (doc.type !== 'receipt') {
      ly += 70;
      text('件名', MX, ly, F(24, 700), PAL.accent);
      const sl = wrapT(doc.subject || '', LW - 96, F(28, 500), 2).lines;
      sl.forEach((s, i) => text(s, MX + 96, ly + i * 40, F(28, 500)));
      ly += (sl.length - 1) * 40;
      hline(MX, MX + LW, ly + 16, 1.5, PAL.soft);
      ly += 62;
      text(T.greet, MX, ly, F(25), PAL.ink2);
    }

    // 右：発行者（＋印影）
    const IX = W - MX - 560, IW = 560;
    let iy = 440, nameW = 0;
    const pn = String(prof.name || '').trim();
    if (pn) { const p = fit(pn, IW, 38, 26, 700); text(pn, IX, iy, F(p, 700)); nameW = width(pn, F(p, 700)); }
    const rows = [];
    if (prof.owner) rows.push([prof.owner, F(26, 500), PAL.ink2]);
    if (prof.address) for (const s of wrapT(prof.address, IW, F(22), 3).lines) rows.push([s, F(22), PAL.ink2]);
    if (prof.phone) rows.push(['TEL　' + prof.phone, F(22), PAL.ink2]);
    if (prof.email) rows.push(['E-mail　' + prof.email, F(22), PAL.ink2]);
    const reg = normReg(prof.invoiceNo);
    if (reg) rows.push(['登録番号　' + reg, F(23, 700), PAL.ink]);
    for (const [s, f, col] of rows) { iy += 38; text(s, IX, iy, f, col); }
    if (settings.seal && pn) {
      const S = 172, seal = sealImage(pn, S, FS.disp);
      if (seal) {
        const sx = Math.min(W - MX - S + 10, IX + nameW - S * 0.32), sy = 440 - S * 0.74;
        g.save();
        g.globalCompositeOperation = 'multiply';
        g.globalAlpha = 0.9;
        g.translate(sx + S / 2, sy + S / 2);
        g.rotate(-0.04);
        g.drawImage(seal, -S / 2, -S / 2, S, S);
        g.restore();
      }
    }

    // 金額の箱
    let by = Math.max(ly, iy) + 52;
    const BW = 900, BH = 116, LBW = 340;
    fill(MX, by, LBW, BH, PAL.wash);
    rect(MX, by, BW, BH, 3, PAL.accent);
    vline(MX + LBW, by, by + BH, 2, PAL.accent);
    if (c.withholding) {
      text(T.net, MX + LBW / 2, by + BH / 2 - 14, F(28, 700), PAL.accent, 'center', true);
      text('（税込・源泉徴収後）', MX + LBW / 2, by + BH / 2 + 24, F(19), PAL.accent, 'center', true);
    } else text(T.amount, MX + LBW / 2, by + BH / 2, F(fit(T.amount, LBW - 30, 28, 20, 700), 700), PAL.accent, 'center', true);
    const amtS = Kit.yen(c.withholding ? c.net : c.total) + (doc.type === 'receipt' ? '-' : '');
    text(amtS, MX + BW - 30, by + BH / 2 + 2, F(fit(amtS, BW - LBW - 60, 62, 34, 700), 700), PAL.ink, 'right', true);
    const DX = MX + BW + 44;
    if (doc.type !== 'receipt' && doc.dueDate) {
      text(T.due, DX, by + 42, F(23), PAL.ink3);
      text(jpDate(doc.dueDate), DX, by + 92, F(fit(jpDate(doc.dueDate), W - MX - DX, 32, 22, 700), 700));
    } else if (doc.type === 'receipt') {
      text('うち消費税', DX, by + 42, F(23), PAL.ink3);
      text(Kit.yen(c.tax), DX, by + 92, F(32, 700));
    }
    by += BH;
    if (doc.type === 'receipt') {
      by += 62;
      const sj = String(doc.subject || '').trim();
      const tl = '但し　' + (sj ? sj + (/として$/.test(sj) ? '' : /代$/.test(sj) ? 'として' : '代として') : '');
      text(tl, MX, by, F(fit(tl, BW, 27, 20, 500), 500));
      hline(MX, MX + BW, by + 16, 1.5, PAL.soft);
      by += 56;
      text(T.greet, MX, by, F(25), PAL.ink2);
    }

    // 明細の表
    const tTop = by + 46, headH = 54;
    const cols = [
      { label: 'No.', w: 64 }, { label: '品目', w: 0 }, { label: '数量', w: 118 }, { label: '単位', w: 96 },
      { label: c.incl ? '単価（税込）' : '単価', w: 196 }, { label: '税率', w: 112 }, { label: c.incl ? '金額（税込）' : '金額', w: 214 },
    ];
    cols[1].w = CW - Kit.sum(cols, (x) => x.w);
    let cx = MX;
    for (const col of cols) { col.x = cx; cx += col.w; }
    // 下の欄の高さを先に見積もって、明細に使える高さを決める
    const sumR = summaryRows(c, T);
    const brRates = c.rates.length ? c.rates : [10];
    const leftH = (c.has8 ? 44 : 0) + 46 + brRates.length * 46;
    const bandH = Math.max(sumR.length * 50, leftH);
    const bankL = doc.type === 'invoice' && String(doc.bank || '').trim() ? wrapT(String(doc.bank).trim(), CW - 240, F(24), 3).lines : [];
    const notesL = String(doc.notes || '').trim() ? wrapT(String(doc.notes).trim(), CW - 240, F(23), 6).lines : [];
    const bankH = bankL.length ? Math.max(84, bankL.length * 38 + 34) : 0;
    const notesH = notesL.length ? Math.max(84, notesL.length * 36 + 34) : 0;
    const footY = H - 112;
    const avail = footY - 30 - (notesH ? notesH + 20 : 0) - (bankH ? bankH + 30 : 0) - bandH - 34 - (tTop + headH);
    const items = doc.items || [];
    const shown = items.map((it, i) => i).filter((i) => !isBlankItem(items[i]));
    const nameMaxW = cols[1].w - 36;
    let fs = 27, padY = 24, list = [];
    for (const [f, p] of [[27, 24], [25, 18], [23, 14], [21, 10], [19, 8]]) {
      fs = f; padY = p;
      const lh = Math.round(f * 1.3);
      list = shown.map((i, k) => { const ls = wrapT(itemName(items[i]), nameMaxW, F(f), 2).lines; return { i, no: k + 1, lines: ls, h: ls.length * lh + padY }; });
      if (Kit.sum(list, (r) => r.h) <= avail) break;
    }
    const lh = Math.round(fs * 1.3), rh = lh + padY;
    if (Kit.sum(list, (r) => r.h) > avail) {
      // それでも入らないときは1行ずつにして、入る分だけ描く
      list = shown.map((i, k) => ({ i, no: k + 1, lines: wrapT(itemName(items[i]), nameMaxW, F(fs), 1).lines, h: rh }));
      const n = Math.max(1, Math.floor(avail / rh));
      if (n < list.length) { info.truncated = list.length - (n - 1); list = list.slice(0, n - 1).concat([{ more: info.truncated, h: rh }]); }
    }
    let used = Kit.sum(list, (r) => r.h);
    let blanks = 0;
    while (list.length < 10 && used + rh <= avail) { list.push({ blank: true, label: blanks++ === 0 && shown.length ? '以下余白' : '', h: rh }); used += rh; }
    const tBot = tTop + headH + used;
    fill(MX, tTop, CW, headH, PAL.wash);
    for (const col of cols) text(col.label, col.x + col.w / 2, tTop + headH / 2 + 1, F(22, 700), PAL.ink2, 'center', true);
    let ry = tTop + headH;
    const fRow = F(fs), fNum = F(fs, 500);
    list.forEach((r, k) => {
      const mid = ry + r.h / 2;
      if (r.lines) {
        const it = items[r.i];
        text(String(r.no), cols[0].x + cols[0].w / 2, mid, F(fs - 3), PAL.ink3, 'center', true);
        const top = mid - (r.lines.length * lh) / 2;
        r.lines.forEach((s, j) => text(s, cols[1].x + 18, top + lh * (j + 0.5), fRow, PAL.ink, 'left', true));
        text(fmtN(parseNum(it.qty)), cols[2].x + cols[2].w - 16, mid, fNum, PAL.ink, 'right', true);
        if (it.unit) text(it.unit, cols[3].x + cols[3].w / 2, mid, F(fit(it.unit, cols[3].w - 12, fs - 2, 14)), PAL.ink, 'center', true);
        text(numS(parseNum(it.price)), cols[4].x + cols[4].w - 16, mid, fNum, PAL.ink, 'right', true);
        const rate = +it.taxRate;
        text(rate === 0 ? '対象外' : rate + '%', cols[5].x + cols[5].w / 2, mid, F(rate === 0 ? fs - 5 : fs - 2), PAL.ink2, 'center', true);
        text(numS(c.lines[r.i]), cols[6].x + cols[6].w - 16, mid, F(fs, 700), PAL.ink, 'right', true);
      } else if (r.more) text('ほか ' + r.more + ' 行は入りきりませんでした', cols[1].x + 18, mid, F(fs - 3), PAL.ink3, 'left', true);
      else if (r.label) text(r.label, cols[1].x + 18, mid, F(fs - 3), PAL.ink3, 'left', true);
      ry += r.h;
      if (k < list.length - 1) hline(MX, MX + CW, ry, 1.2, PAL.soft);
    });
    for (let i = 1; i < cols.length; i++) vline(cols[i].x, tTop, tBot, 1.2, PAL.soft);
    hline(MX, MX + CW, tTop + headH, 2, PAL.rule);
    rect(MX, tTop, CW, tBot - tTop, 2.5, PAL.ink2);

    // 左：※の注記と、税率ごとの内訳（インボイスに必要）
    const y2 = tBot + 34;
    let ly2 = y2;
    if (c.has8) { text('※は軽減税率(8%)対象', MX, ly2 + 14, F(22), PAL.ink2, 'left', true); ly2 += 44; }
    const bc = [{ label: '税率の区分', w: 250 }, { label: '税抜金額', w: 196 }, { label: '消費税額', w: 178 }, { label: '税込金額', w: 196 }];
    let bx = MX;
    for (const col of bc) { col.x = bx; bx += col.w; }
    const BRW = bx - MX;
    fill(MX, ly2, BRW, 46, PAL.wash);
    for (const col of bc) text(col.label, col.x + col.w / 2, ly2 + 23, F(20, 700), PAL.ink2, 'center', true);
    brRates.forEach((r, k) => {
      const b = c.by[r], yy = ly2 + 46 + k * 46 + 23;
      text(RATE_DOC[r], bc[0].x + 16, yy, F(21), PAL.ink, 'left', true);
      text(Kit.yen(b.excl), bc[1].x + bc[1].w - 14, yy, F(22, 500), PAL.ink, 'right', true);
      text(r ? Kit.yen(b.tax) : '—', bc[2].x + bc[2].w - 14, yy, F(22, 500), PAL.ink, 'right', true);
      text(Kit.yen(b.incl), bc[3].x + bc[3].w - 14, yy, F(22, 500), PAL.ink, 'right', true);
      hline(MX, MX + BRW, ly2 + 46 + k * 46, 1.2, PAL.soft);
    });
    const brBot = ly2 + 46 + brRates.length * 46;
    for (let i = 1; i < bc.length; i++) vline(bc[i].x, ly2, brBot, 1.2, PAL.soft);
    rect(MX, ly2, BRW, brBot - ly2, 2, PAL.rule);

    // 右：合計
    const SW = 500, SX = W - MX - SW;
    let sy = y2;
    sumR.forEach(([label, v, strong], k) => {
      if (strong) hline(SX, SX + SW, sy, 2.5, PAL.ink2);
      else if (k) hline(SX, SX + SW, sy, 1.2, PAL.soft);
      text(label, SX + 12, sy + 25, F(strong ? 25 : 23, strong ? 700 : 400), strong ? PAL.ink : PAL.ink2, 'left', true);
      text(Kit.yen(v), SX + SW - 12, sy + 25, F(strong ? 31 : 25, strong ? 700 : 500), PAL.ink, 'right', true);
      sy += 50;
    });
    hline(SX, SX + SW, sy, 1.2, PAL.soft);

    // 振込先・備考
    let y3 = y2 + bandH + 30;
    const box = (label, lines, top, hh, f, lineH) => {
      fill(MX, top, 200, hh, PAL.wash);
      rect(MX, top, CW, hh, 1.6, PAL.rule);
      vline(MX + 200, top, top + hh, 1.2, PAL.soft);
      text(label, MX + 100, top + hh / 2, F(22, 700), PAL.ink2, 'center', true);
      const t0 = top + (hh - lines.length * lineH) / 2;
      lines.forEach((s, i) => text(s, MX + 224, t0 + lineH * (i + 0.5), f, PAL.ink, 'left', true));
    };
    if (bankH) { box('お振込先', bankL, y3, bankH, F(24), 38); y3 += bankH + 20; }
    if (notesH) box('備考', notesL, y3, notesH, F(23), 36);

    // ページの下
    hline(MX, W - MX, footY, 1.5, PAL.soft);
    text(pn, MX, footY + 34, F(20), PAL.ink3, 'left', true);
    text(T.label + '　' + (doc.number || ''), W - MX, footY + 34, F(20), PAL.ink3, 'right', true);
    g.textBaseline = 'alphabetic';
    return info;
  }
  // 書類に使う字（フォントを先に読み込むため）
  function docText(doc, prof) {
    const parts = [Object.values(TYPES).map((t) => Object.values(t).join('')).join(''), '番号発行日件名ご担当様御中品目数量単位単価金額税率対象外非課税軽減内訳区分税抜税込消費税額小計合計源泉所得差引振込先備考以下余白ほか行は入りきりませんでした但し代として之印登録番号TEL E-mail うち0123456789,-¥%※（）年月日・…'];
    const cl = doc.client || {};
    parts.push(doc.number, cl.name, cl.address, cl.contact, doc.subject, doc.bank, doc.notes, prof.name, prof.owner, prof.address, prof.phone, prof.email, prof.invoiceNo);
    for (const it of doc.items || []) parts.push(it.name, it.unit);
    return Array.from(new Set(Array.from(parts.filter(Boolean).join('')))).join('');
  }
  // 字体の読み込み（Google Fonts は使う字の分だけ届くので、書く前に読み込む）
  async function ensureFonts(textSample) {
    if (!document.fonts || !document.fonts.load) return false;
    const FS = fontStacks();
    const specs = ['400 30px ' + FS.body, '500 30px ' + FS.body, '700 30px ' + FS.body, '800 30px ' + FS.disp, '700 30px ' + FS.disp];
    const need = specs.filter((s) => { try { return !document.fonts.check(s, textSample); } catch (e) { return false; } });
    if (!need.length) return false;
    await Promise.race([Promise.all(need.map((s) => document.fonts.load(s, textSample).catch(() => null))), new Promise((r) => setTimeout(r, 2500))]);
    sealCache.clear();
    return true;
  }

  /* ───────── PDF（A4 1ページ。キャンバスを JPEG のまま貼る最小の PDF を自分で組み立てる） ───────── */
  const ascii = (s) => { const b = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i) & 0xff; return b; };
  // PDF の文字列（日本語は UTF-16BE の16進）
  const pdfStr = (s) => {
    let hex = 'FEFF';
    for (const ch of String(s)) {
      const cp = ch.codePointAt(0);
      if (cp > 0xffff) { const v = cp - 0x10000; hex += (0xd800 + (v >> 10)).toString(16).padStart(4, '0') + (0xdc00 + (v & 0x3ff)).toString(16).padStart(4, '0'); }
      else hex += cp.toString(16).padStart(4, '0');
    }
    return '<' + hex.toUpperCase() + '>';
  };
  async function canvasToPdf(canvas, title) {
    const blob = await Kit.img.toBlob(canvas, 'image/jpeg', 0.92);
    if (!blob) throw new Error('画像にできませんでした');
    const jpg = new Uint8Array(await blob.arrayBuffer());
    const parts = [], offs = [];
    let pos = 0;
    const push = (x) => { const b = typeof x === 'string' ? ascii(x) : x; parts.push(b); pos += b.length; };
    const obj = (n, body) => { offs[n] = pos; push(n + ' 0 obj\n' + body + '\nendobj\n'); };
    push('%PDF-1.4\n');
    push(new Uint8Array([0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]));
    obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
    obj(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
    obj(3, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im0 4 0 R >> /ProcSet [/PDF /ImageC] >> /Contents 5 0 R >>');
    offs[4] = pos;
    push('4 0 obj\n<< /Type /XObject /Subtype /Image /Width ' + canvas.width + ' /Height ' + canvas.height + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + jpg.length + ' >>\nstream\n');
    push(jpg);
    push('\nendstream\nendobj\n');
    const content = 'q\n595.28 0 0 841.89 0 0 cm\n/Im0 Do\nQ';
    obj(5, '<< /Length ' + content.length + ' >>\nstream\n' + content + '\nendstream');
    const d = new Date(), p2 = (n) => String(n).padStart(2, '0'), tz = -d.getTimezoneOffset();
    const stamp = 'D:' + d.getFullYear() + p2(d.getMonth() + 1) + p2(d.getDate()) + p2(d.getHours()) + p2(d.getMinutes()) + p2(d.getSeconds()) +
      (tz >= 0 ? '+' : '-') + p2(Math.floor(Math.abs(tz) / 60)) + "'" + p2(Math.abs(tz) % 60) + "'";
    obj(6, '<< /Title ' + pdfStr(title) + ' /Producer (misebiraki) /Creator (misebiraki) /CreationDate (' + stamp + ') >>');
    const xref = pos;
    let x = 'xref\n0 7\n0000000000 65535 f\r\n';
    for (let n = 1; n <= 6; n++) x += String(offs[n]).padStart(10, '0') + ' 00000 n\r\n';
    x += 'trailer\n<< /Size 7 /Root 1 0 R /Info 6 0 R >>\nstartxref\n' + xref + '\n%%EOF\n';
    push(x);
    return new Blob(parts, { type: 'application/pdf' });
  }
  const fileBase = (doc) => Kit.safeName((TYPES[doc.type] || TYPES.invoice).label + '_' + (doc.number || '番号なし') + '_' + ((doc.client && doc.client.name) || '宛先なし'));

  // 印刷：書類の画像だけを紙に出す（手元のブラウザだけ）
  async function printCanvas(canvas) {
    const img = h('img', { src: canvas.toDataURL('image/png'), alt: '' });
    const wrap = h('div', { class: 'inv-print' }, img);
    document.body.append(wrap);
    document.body.classList.add('inv-printing');
    let done = false;
    const finish = () => { if (done) return; done = true; wrap.remove(); document.body.classList.remove('inv-printing'); window.removeEventListener('afterprint', finish); };
    window.addEventListener('afterprint', finish);
    try { await img.decode(); } catch (e) { /* そのまま印刷 */ }
    window.print();
    setTimeout(finish, 60000);
  }

  /* ───────── 小さなメニュー（「新しく作る」「…」） ───────── */
  let openMenu = null;
  function closeMenu(focusAnchor) {
    if (!openMenu) return;
    const m = openMenu;
    openMenu = null;
    m.off();
    m.menu.remove();
    m.anchor.setAttribute('aria-expanded', 'false');
    if (focusAnchor) try { m.anchor.focus(); } catch (e) { /* noop */ }
  }
  function toggleMenu(anchor, items) {
    if (openMenu && openMenu.anchor === anchor) { closeMenu(); return; }
    closeMenu();
    const menu = h('div', { class: 'inv-menu', role: 'menu' });
    for (const it of items) {
      if (!it) continue;
      if (it === '-') { menu.append(h('hr')); continue; }
      menu.append(h('button', { type: 'button', role: 'menuitem', class: it.danger ? 'danger' : null, onclick: () => { closeMenu(); it.onClick(); } }, it.icon ? Kit.icon(it.icon) : null, h('span', null, it.label)));
    }
    document.body.append(menu);
    const r = anchor.getBoundingClientRect(), mw = menu.offsetWidth, mh = menu.offsetHeight;
    const left = Math.max(8, Math.min(r.right - mw, window.innerWidth - mw - 8));
    let top = r.bottom + 4;
    if (top + mh > window.innerHeight - 8) top = Math.max(8, r.top - mh - 4);
    menu.style.left = left + 'px';
    menu.style.top = top + 'px';
    anchor.setAttribute('aria-expanded', 'true');
    const btns = [...menu.querySelectorAll('button')];
    if (btns[0]) btns[0].focus();
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeMenu(true); }
      else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); const i = btns.indexOf(document.activeElement); btns[(i + (e.key === 'ArrowDown' ? 1 : -1) + btns.length) % btns.length].focus(); }
      else if (e.key === 'Tab') closeMenu();
    };
    const onDown = (e) => { if (!menu.contains(e.target) && !anchor.contains(e.target)) closeMenu(); };
    const onMove = () => closeMenu();
    document.addEventListener('keydown', onKey, true);
    document.addEventListener('pointerdown', onDown, true);
    window.addEventListener('resize', onMove);
    window.addEventListener('scroll', onMove, true);
    openMenu = { menu, anchor, off: () => { document.removeEventListener('keydown', onKey, true); document.removeEventListener('pointerdown', onDown, true); window.removeEventListener('resize', onMove); window.removeEventListener('scroll', onMove, true); } };
  }
  const menuBtn = (label, items, o) => {
    const b = Kit.btn(label, () => toggleMenu(b, typeof items === 'function' ? items() : items), o);
    b.setAttribute('aria-haspopup', 'menu');
    b.setAttribute('aria-expanded', 'false');
    return b;
  };

  /* ───────── 状態・数字 ───────── */
  const S_DRAFT = { key: 'draft', label: '下書き', cls: '' }, S_SENT = { key: 'sent', label: '送付済み', cls: 'blue' }, S_PAID = { key: 'paid', label: '入金済み', cls: 'ok' };
  function stateOf(d, docs) {
    const t = today();
    if (d.type === 'receipt') return S_PAID;
    if (d.type === 'estimate') {
      if (docs && docs.some((x) => x.type === 'invoice' && x.fromEstimate === d.id)) return { key: 'sent', label: '請求書にした', cls: 'line' };
      if (d.dueDate && d.dueDate < t) return { key: 'overdue', label: '期限切れ', cls: 'warn' };
      return d.status === 'draft' ? S_DRAFT : S_SENT;
    }
    if (d.status === 'paid') return S_PAID;
    if (d.dueDate && d.dueDate < t) return { key: 'overdue', label: '期限切れ', cls: 'bad' };
    return d.status === 'sent' ? S_SENT : S_DRAFT;
  }
  const chipOf = (s) => h('span', { class: 'chip' + (s.cls ? ' ' + s.cls : '') }, s.label);
  const sampleChip = () => h('span', { class: 'chip sample' }, 'サンプル');
  const clientLabel = (d) => { const c = d.client || {}; return (c.name || '（宛先なし）') + (c.name && c.honorific ? ' ' + c.honorific : ''); };
  const shortDate = (s) => { const d = Kit.parseYmd(s); if (!s || isNaN(d)) return '—'; return d.getFullYear() === new Date().getFullYear() ? Kit.fmtDate(d, 'M/D(W)') : Kit.fmtDate(d, 'YYYY/M/D'); };
  function dueNote(d, s) {
    if (d.type !== 'invoice' || !d.dueDate || s.key === 'paid' || d.status === 'draft') return null;
    const n = Kit.daysBetween(today(), d.dueDate);
    if (n < 0) return h('span', { class: 'inv-soon' }, -n + '日過ぎ');
    if (n <= 7) return h('span', { class: 'inv-soon' }, n === 0 ? '今日まで' : 'あと' + n + '日');
    return null;
  }
  function kpis(docs) {
    const now = Kit.today(), ym = Kit.ym(now), yy = String(now.getFullYear()), t = today();
    const inv = docs.filter((d) => d.type === 'invoice');
    const month = inv.filter((d) => d.status !== 'draft' && String(d.issueDate || '').startsWith(ym));
    const unpaid = inv.filter((d) => d.status === 'sent');
    const overdue = unpaid.filter((d) => d.dueDate && d.dueDate < t);
    // 入金済み＝入金済みの請求書（入金日）＋請求書から作っていない領収書（発行日）。二重に数えない
    const paid = inv.filter((d) => d.status === 'paid' && String(d.paidAt || d.issueDate || '').startsWith(yy));
    const rc = docs.filter((d) => d.type === 'receipt' && !d.fromInvoice && String(d.issueDate || '').startsWith(yy));
    return {
      month: Kit.sum(month, docTotal), monthN: month.length,
      unpaid: Kit.sum(unpaid, docTotal), unpaidN: unpaid.length, overdueN: overdue.length,
      paid: Kit.sum(paid, docTotal) + Kit.sum(rc, docTotal), paidN: paid.length + rc.length, year: yy,
    };
  }
  const kpi = (label, value, sub) => h('div', { class: 'kpi' }, h('div', { class: 'kpi-label' }, label), h('div', { class: 'kpi-value' }, value), h('div', { class: 'kpi-sub' }, sub));
  const blankItem = (rate) => ({ name: '', qty: 1, unit: '', price: 0, taxRate: rate == null ? 10 : rate });

  /* ───────── アプリ ───────── */
  Kit.app({
    id: 'invoice', title: '見積書・請求書', group: 'earn', icon: 'receipt', order: 31,
    desc: 'インボイス対応の見積・請求・領収をつくる',
    docs: ['invoiceSettings'],
    colls: ['invoices'],
    async mount(root, params) {
      const st = { docs: [], settings: normSettings(null), profile: null };
      let viewSeq = 0, disposeView = null;
      const loadDocs = async () => { st.docs = await Kit.store.list('invoices', { sample: SAMPLES }); return st.docs; };
      const loadSettings = async () => { st.settings = normSettings(await Kit.store.get('invoiceSettings', { sample: SETTINGS_SAMPLE, blank: SETTINGS_BLANK })); };
      const loadProfile = async () => { st.profile = await Kit.profile.get(); };
      await Promise.all([loadDocs(), loadSettings(), loadProfile()]);
      const leaveView = () => { viewSeq++; closeMenu(); if (disposeView) { const f = disposeView; disposeView = null; try { f(); } catch (e) { console.error(e); } } };
      const switchView = () => { leaveView(); Kit.clear(root); window.scrollTo(0, 0); return viewSeq; };
      const saveSettings = async (s) => { await Kit.store.set('invoiceSettings', s); st.settings = normSettings(s); };

      /* 書類をつくる・写す */
      function newDoc(type, extra) {
        const issue = today(), s = st.settings;
        return Object.assign({
          id: Kit.uid('inv'), type, number: nextNumber(type, issue, st.docs, s), issueDate: issue, dueDate: defaultDue(type, issue, s.dueRule),
          client: { name: '', honorific: '様', address: '', contact: '' }, subject: '', items: [blankItem()],
          taxMode: s.taxMode, rounding: s.rounding, withholding: false,
          notes: s.notes[type] || '', bank: type === 'invoice' ? st.profile.bank || '' : '',
          status: type === 'receipt' ? 'paid' : 'draft', paidAt: type === 'receipt' ? issue : '',
          fromLead: '', fromEstimate: '', fromInvoice: '', total: 0,
        }, extra || {});
      }
      function derive(src, type, extra) {
        const d = newDoc(type);
        Object.assign(d, {
          client: Object.assign({ name: '', honorific: '様', address: '', contact: '' }, Kit.clone(src.client || {})),
          subject: src.subject || '', items: Kit.clone(src.items && src.items.length ? src.items : [blankItem()]),
          taxMode: src.taxMode === 'inclusive' ? 'inclusive' : 'exclusive', rounding: ROUND[src.rounding] ? src.rounding : st.settings.rounding,
          withholding: !!src.withholding,
        }, extra || {});
        if (extra && extra.issueDate) { d.number = nextNumber(type, d.issueDate, st.docs, st.settings); if (type !== 'receipt') d.dueDate = defaultDue(type, d.issueDate, st.settings.dueRule); }
        if (type === 'receipt') { d.status = 'paid'; d.paidAt = d.issueDate; d.dueDate = ''; }
        d.total = calc(d).total;
        return d;
      }
      async function putDoc(d) {
        d.total = calc(d).total;
        const it = await Kit.store.put('invoices', d);
        await loadDocs();
        return it;
      }
      async function duplicate(src) {
        const d = await putDoc(derive(src, src.type, { notes: src.notes || '', bank: src.type === 'invoice' ? src.bank || '' : '' }));
        Kit.toast('複製しました（' + d.number + '）');
        showEditor(d);
      }
      // すでに作ってあるときは、もう1枚作るか確かめる
      const again = async (made, what) => !made || Kit.confirm({ title: 'もう1枚作りますか', body: 'この書類からは、すでに' + what + ' ' + (made.number || '') + ' を作っています。', ok: 'もう1枚作る' });
      async function toInvoice(est) {
        if (!(await again(st.docs.find((x) => x.type === 'invoice' && x.fromEstimate === est.id), '請求書'))) return;
        const d = await putDoc(derive(est, 'invoice', { fromEstimate: est.id, fromLead: est.fromLead || '' }));
        Kit.toast('見積書 ' + (est.number || '') + ' から請求書をつくりました');
        showEditor(d);
      }
      async function toReceipt(inv) {
        if (!(await again(st.docs.find((x) => x.type === 'receipt' && x.fromInvoice === inv.id), '領収書'))) return;
        const d = await putDoc(derive(inv, 'receipt', { fromInvoice: inv.id, fromLead: inv.fromLead || '', issueDate: inv.paidAt || today(), notes: st.settings.notes.receipt || '' }));
        Kit.toast('請求書 ' + (inv.number || '') + ' の領収書をつくりました');
        showEditor(d);
      }
      async function markPaid(inv) {
        await putDoc(Object.assign(Kit.clone(inv), { status: 'paid', paidAt: inv.paidAt || today() }));
        Kit.toast((inv.number || '請求書') + ' を入金済みにしました', { action: { label: '領収書を作る', onClick: () => { const d = st.docs.find((x) => x.id === inv.id); if (d && root.isConnected) toReceipt(d); } } });
      }
      async function removeDoc(d, after) {
        const ok = await Kit.confirm({
          title: (TYPES[d.type] || TYPES.invoice).label + 'を削除しますか',
          body: h('div', { class: 'stack tight' }, h('p', null, (d.number || '') + '　' + clientLabel(d)), h('p', { class: 'small muted' }, '削除すると元に戻せません。')),
          ok: '削除する', danger: true,
        });
        if (!ok) return false;
        await Kit.store.remove('invoices', d.id);
        await loadDocs();
        Kit.toast('削除しました');
        if (after) after();
        return true;
      }
      // 書類ごとの操作（inList：一覧の「…」。編集画面では状態の切り替えがあるので入金は出さない）
      const docMenu = (d, inList) => [
        inList ? { label: '開く', icon: 'edit', onClick: () => showEditor(d) } : null,
        { label: '複製', icon: 'copy', onClick: () => duplicate(d) },
        d.type === 'estimate' ? { label: '請求書に変える', icon: 'right', onClick: () => toInvoice(d) } : null,
        inList && d.type === 'invoice' && d.status === 'sent' ? { label: '入金済みにする', icon: 'check', onClick: () => markPaid(d) } : null,
        d.type === 'invoice' && d.status === 'paid' ? { label: '領収書を作る', icon: 'receipt', onClick: () => toReceipt(d) } : null,
        '-',
        { label: '削除', icon: 'trash', danger: true, onClick: () => removeDoc(d, inList ? null : showList) },
      ];
      const clearSamples = async () => {
        const ok = await Kit.confirm({ title: 'サンプルを片付けますか', body: 'すべての画面のサンプル（ひらめき数学舎の例）を消します。自分で作ったものは消えません。', ok: '片付ける', danger: true });
        if (!ok) return;
        await Kit.store.samplesOff();
        await Promise.all([loadDocs(), loadSettings(), loadProfile()]);
        showList();
      };

      /* ───── 一覧 ───── */
      function showList() {
        const seq = switchView();
        const filt = Object.assign({ type: 'all', status: 'all', q: '' }, Kit.pref.get(LS_FILTER, {}));
        const savePref = () => Kit.pref.set(LS_FILTER, filt);
        const newBtn = menuBtn('新しく作る', TYPE_KEYS.map((t) => ({ label: TYPES[t].label, icon: t === 'estimate' ? 'edit' : t === 'invoice' ? 'yen' : 'check', onClick: () => showEditor(newDoc(t), { isNew: true }) })), { kind: 'primary', icon: 'plus' });
        root.append(Kit.appHead({
          title: '見積書・請求書',
          desc: 'インボイス制度に合わせた見積書・請求書・領収書をつくり、A4 の PDF で保存します。',
          actions: [newBtn, Kit.btn('', () => openSettings(() => showList()), { icon: 'sliders', title: '設定', kind: 'ghost' })],
        }));
        const topSlot = h('div');
        const typeSeg = Kit.seg([{ value: 'all', label: 'すべて' }].concat(TYPE_KEYS.map((t) => ({ value: t, label: TYPES[t].label }))), filt.type, (v) => { filt.type = v; savePref(); renderRows(); }, { label: '種類で絞りこむ' });
        const stSel = h('select', { id: 'inv-f-status' }, [['all', 'すべての状態'], ['draft', '下書き'], ['sent', '送付済み'], ['paid', '入金済み'], ['overdue', '期限切れ']].map(([v, l]) => h('option', { value: v }, l)));
        stSel.value = filt.status;
        stSel.addEventListener('change', () => { filt.status = stSel.value; savePref(); renderRows(); });
        const q = h('input', { type: 'search', id: 'inv-f-q', placeholder: '番号・宛先・件名で探す', autocomplete: 'off' });
        q.value = filt.q || '';
        q.addEventListener('input', Kit.debounce(() => { filt.q = q.value; savePref(); renderRows(); }, 160));
        const count = h('span', { class: 'inv-count', 'aria-live': 'polite' });
        const listBox = h('div', { class: 'inv-list' });
        root.append(topSlot,
          h('div', { class: 'inv-filters' }, typeSeg, h('label', { class: 'inv-sr', for: 'inv-f-status' }, '状態で絞りこむ'), stSel,
            h('div', { class: 'inv-search' }, h('label', { class: 'inv-sr', for: 'inv-f-q' }, '書類を探す'), Kit.icon('search'), q), count),
          listBox);

        function renderTop() {
          Kit.clear(topSlot);
          if (st.docs.some((d) => d.sample)) topSlot.append(Kit.sampleBar('これは例（ひらめき数学舎）の書類です。開いて書きかえるか、新しく作ってください。', clearSamples));
          const k = kpis(st.docs);
          topSlot.append(h('div', { class: 'grid cols-3 inv-kpis' },
            kpi('今月の請求額', Kit.yen(k.month), k.monthN + '件（下書きは除く）'),
            kpi('未入金の合計', Kit.yen(k.unpaid), [k.unpaidN + '件', k.overdueN ? ['　', h('span', { class: 'chip bad' }, 'うち期限切れ ' + k.overdueN + '件')] : null]),
            kpi('今年の入金済み', Kit.yen(k.paid), k.year + '年・' + k.paidN + '件')));
        }
        function rows() {
          const qq = String(filt.q || '').trim().toLowerCase();
          return st.docs.filter((d) => {
            if (filt.type !== 'all' && d.type !== filt.type) return false;
            if (filt.status !== 'all' && stateOf(d, st.docs).key !== filt.status) return false;
            if (qq) {
              const hay = [d.number, d.client && d.client.name, d.subject].concat((d.items || []).map((i) => i.name)).join(' ').toLowerCase();
              if (!hay.includes(qq)) return false;
            }
            return true;
          }).sort((a, b) => String(b.issueDate || '').localeCompare(String(a.issueDate || '')) || String(b.number || '').localeCompare(String(a.number || '')));
        }
        const more = (d) => menuBtn('', () => docMenu(d, true), { icon: 'more', title: (d.number || '書類') + ' のほかの操作', kind: 'ghost' });
        const openBtn = (d) => Kit.btn('開く', () => showEditor(d));
        function renderRows() {
          Kit.clear(listBox);
          const list = rows();
          count.textContent = list.length + '件';
          if (!st.docs.length) {
            listBox.append(Kit.empty({
              title: 'まだ書類がありません',
              body: '見積書・請求書・領収書を、ここでつくれます。宛先と明細を入れるだけで、A4 の PDF になります。',
              actions: [Kit.btn('見積書をつくる', () => showEditor(newDoc('estimate'), { isNew: true })), Kit.btn('請求書をつくる', () => showEditor(newDoc('invoice'), { isNew: true }), { kind: 'primary' })],
            }));
            return;
          }
          if (!list.length) {
            listBox.append(Kit.empty({ title: '条件に合う書類がありません', body: '種類・状態・検索の文字を見直してください。', actions: [Kit.btn('条件をはずす', () => { filt.type = 'all'; filt.status = 'all'; filt.q = ''; q.value = ''; stSel.value = 'all'; typeSeg.setValue('all'); savePref(); renderRows(); })] }));
            return;
          }
          const tbody = h('tbody');
          const cards = h('div', { class: 'inv-cards' });
          for (const d of list) {
            const s = stateOf(d, st.docs), T = TYPES[d.type] || TYPES.invoice;
            const open = (e) => { if (e.target.closest('button, a, input, select')) return; showEditor(d); };
            tbody.append(h('tr', { onclick: open },
              h('td', { class: 'nowrap' }, h('span', { class: 'inv-kind' }, T.label), h('button', { type: 'button', class: 'inv-link', onclick: () => showEditor(d) }, d.number || '（番号なし）')),
              h('td', null, clientLabel(d), d.sample ? [' ', sampleChip()] : null),
              h('td', { class: 'inv-c-subj' }, d.subject || h('span', { class: 'muted' }, '—')),
              h('td', { class: 'r num nowrap' }, Kit.yen(docTotal(d))),
              h('td', { class: 'num nowrap' }, shortDate(d.issueDate)),
              h('td', { class: 'num nowrap' }, d.dueDate ? [shortDate(d.dueDate), dueNote(d, s)] : h('span', { class: 'muted' }, '—')),
              h('td', null, chipOf(s)),
              h('td', null, h('div', { class: 'inv-acts' }, openBtn(d), more(d)))));
            cards.append(h('div', { class: 'inv-card', onclick: open },
              h('div', { class: 'inv-card-top' }, h('span', { class: 'chip line' }, T.label), h('button', { type: 'button', class: 'inv-link', onclick: () => showEditor(d) }, d.number || '（番号なし）'), chipOf(s), d.sample ? sampleChip() : null),
              h('div', { class: 'inv-card-client' }, clientLabel(d)),
              d.subject ? h('div', { class: 'inv-card-subj' }, d.subject) : null,
              h('div', { class: 'inv-card-foot' },
                h('span', { class: 'inv-card-amt' }, Kit.yen(docTotal(d))),
                h('span', { class: 'inv-card-dates' }, '発行 ' + shortDate(d.issueDate) + (d.dueDate ? '・' + ((TYPES[d.type] || {}).due || '期限') + ' ' + shortDate(d.dueDate) : '')),
                h('div', { class: 'inv-acts' }, openBtn(d), more(d)))));
          }
          listBox.append(
            h('div', { class: 'tbl-wrap inv-table' }, h('table', { class: 'tbl' },
              h('thead', null, h('tr', null, ['番号', '宛先', '件名', '金額（税込）', '発行日', '期限', '状態'].map((t, i) => h('th', { scope: 'col', class: i === 3 ? 'r' : null }, t)), h('th', { scope: 'col' }, h('span', { class: 'inv-sr' }, '操作')))),
              tbody)),
            cards);
        }
        renderTop();
        renderRows();
        const off = Kit.store.on('coll:invoices', async () => { await loadDocs(); if (seq !== viewSeq) return; renderTop(); renderRows(); });
        disposeView = () => off();
      }

      /* ───── 問い合わせから見積書 ───── */
      async function openFromLead(id) {
        let lead = null;
        try { lead = (await Kit.store.list('leads')).find((l) => l.id === id) || null; } catch (e) { console.error(e); }
        if (!lead) { Kit.toast('問い合わせが見つかりませんでした。空の見積書を開きます', { type: 'bad' }); showEditor(newDoc('estimate'), { isNew: true }); return; }
        const kind = String(lead.kind || '').trim(), value = Math.round(+lead.value || 0);
        showEditor(newDoc('estimate', {
          client: { name: String(lead.name || '').trim(), honorific: '様', address: '', contact: '' },
          subject: kind,
          items: [{ name: kind, qty: 1, unit: '式', price: value > 0 ? value : 0, taxRate: 10 }],
          fromLead: lead.id,
        }), { isNew: true, lead });
      }

      /* ───── 編集 ───── */
      const ORG_RE = /(株式会社|有限会社|合同会社|（株）|\(株\)|法人|学校|学園|大学|幼稚園|保育園|PTA|ＰＴＡ|公民館|協会|組合|機構|財団|委員会|事務所|センター|研究会|役所|役場|クラブ|サークル|教室|塾|御中)/;
      const hint = (icon, text, warn, btn) => h('div', { class: 'inv-hint' + (warn ? ' warn' : ''), role: warn ? 'note' : null }, Kit.icon(icon), h('span', null, text), btn || null);

      function showEditor(src, o = {}) {
        const seq = switchView();
        const doc = Kit.clone(src);
        // 足りない所をそろえる
        doc.client = Object.assign({ name: '', honorific: '様', address: '', contact: '' }, doc.client || {});
        if (!Array.isArray(doc.items) || !doc.items.length) doc.items = [blankItem()];
        if (!TYPES[doc.type]) doc.type = 'invoice';
        if (!ROUND[doc.rounding]) doc.rounding = st.settings.rounding;
        if (doc.taxMode !== 'inclusive') doc.taxMode = 'exclusive';
        for (const k of ['fromLead', 'fromEstimate', 'fromInvoice', 'notes', 'bank', 'paidAt', 'dueDate', 'subject', 'number', 'issueDate']) if (doc[k] == null) doc[k] = '';
        if (!doc.id) doc.id = Kit.uid('inv');
        let isNew = !!o.isNew; // まだ保存していない（書きかえた時点で保存）
        let numberAuto = isNew, dueAuto = isNew, honAuto = isNew && !doc.client.name;
        let pending = false, busy = false, lastInfo = { truncated: 0 };
        let pane = Kit.pref.get('invoice:pane', 'form') === 'preview' ? 'preview' : 'form';
        const offs = [];

        /* 保存（打つたびに少し待ってから） */
        const saveMsg = h('span', { class: 'small muted', 'aria-live': 'polite' }, isNew ? 'まだ保存していません。書きかえると自動で保存します。' : '書きかえると自動で保存します。');
        async function persist() {
          save.cancel();
          pending = false;
          doc.total = calc(doc).total;
          const it = await Kit.store.put('invoices', doc);
          doc.createdAt = it.createdAt;
          doc.updatedAt = it.updatedAt;
          isNew = false;
          await loadDocs();
          if (seq === viewSeq) { saveMsg.textContent = '保存しました'; updateHead(); }
        }
        const save = Kit.debounce(() => { persist().catch((e) => console.error(e)); }, 500);
        const flush = async () => { if (pending) await persist(); };
        function changed(what) {
          if (seq !== viewSeq) return;
          pending = true;
          saveMsg.textContent = '保存中…';
          save();
          refresh(what);
        }

        /* 見出しと書き出しボタン */
        const pdfBtn = Kit.btn('PDFで保存', () => exportPdf(), { kind: 'primary', icon: 'download' });
        const pngBtn = Kit.btn('画像で保存', () => exportPng(), { icon: 'image' });
        const printBtn = Kit.btn('印刷', () => exportPrint(), { icon: 'receipt', class: 'local-only' });
        const discard = async () => {
          if (pending && !(await Kit.confirm({ title: 'この書類を破棄しますか', body: 'まだ保存していない書類です。入れた内容は消えます。', ok: '破棄する', danger: true }))) return;
          save.cancel();
          pending = false;
          showList();
        };
        const moreB = menuBtn('', () => {
          // まだ保存していない新しい書類は「破棄」だけ
          if (isNew && !pending) return [{ label: '破棄して一覧へ', icon: 'trash', danger: true, onClick: discard }];
          return docMenu(doc, false).map((x) => (x && x !== '-' ? Object.assign({}, x, { onClick: async () => { await flush(); x.onClick(); } }) : x));
        }, { icon: 'more', title: 'ほかの操作', kind: 'ghost' });
        const setB = Kit.btn('', () => openSettings(() => { if (seq !== viewSeq) return; renderIssuer(); renderBankNotes(); schedulePreview(); }), { icon: 'sliders', title: '設定', kind: 'ghost' });
        const head = Kit.appHead({ title: TYPES[doc.type].label, actions: [pdfBtn, pngBtn, printBtn] });
        const headDesc = h('p', { class: 'app-desc' });
        head.querySelector('.app-title').append(headDesc);
        function updateHead() {
          head.querySelector('h1').textContent = (isNew ? '新しい' : '') + TYPES[doc.type].label;
          Kit.clear(headDesc);
          Kit.add(headDesc, [h('span', { class: 'num' }, doc.number || '（番号なし）'), '　' + clientLabel(doc) + '　', chipOf(stateOf(doc, st.docs)), doc.sample ? [' ', sampleChip()] : null]);
        }
        const back = async () => { await flush(); showList(); };

        /* 書類（種類・番号・日付・状態） */
        const typeSeg = Kit.seg(TYPE_KEYS.map((t) => ({ value: t, label: TYPES[t].label })), doc.type, (v) => setType(v), { label: '書類の種類' });
        const basicsBody = h('div', { class: 'stack' });
        const statusSlot = h('div');
        const basicWarn = h('div', { class: 'stack tight' });
        let numInput = null, dueInput = null;
        function renderBasics() {
          Kit.clear(basicsBody);
          const T = TYPES[doc.type];
          numInput = h('input', { type: 'text', autocomplete: 'off', spellcheck: 'false' });
          numInput.value = doc.number || '';
          numInput.addEventListener('input', () => { numberAuto = false; doc.number = numInput.value.trim(); changed('number'); });
          const issue = h('input', { type: 'date' });
          issue.value = doc.issueDate || '';
          issue.addEventListener('change', () => {
            const v = issue.value;
            if (!v) return;
            const oldY = yearOf(doc.issueDate);
            const sameYearAuto = new RegExp('^' + escRe(st.settings.prefix[doc.type]) + '-' + oldY + '-\\d+$').test(String(doc.number || '').trim());
            doc.issueDate = v;
            if (numberAuto || (yearOf(v) !== oldY && sameYearAuto)) { doc.number = nextNumber(doc.type, v, st.docs, st.settings, doc.id); numInput.value = doc.number; }
            if (doc.type === 'receipt') doc.paidAt = v;
            else if (dueAuto && dueInput) { doc.dueDate = defaultDue(doc.type, v, st.settings.dueRule); dueInput.value = doc.dueDate; }
            changed('dates');
          });
          dueInput = null;
          if (doc.type !== 'receipt') {
            dueInput = h('input', { type: 'date' });
            dueInput.value = doc.dueDate || '';
            dueInput.addEventListener('change', () => { dueAuto = false; doc.dueDate = dueInput.value; changed('dates'); });
          }
          Kit.add(basicsBody, [
            h('div', { class: 'row' }, h('span', { class: 'small ink-2' }, '種類'), typeSeg),
            h('div', { class: 'inv-g' },
              Kit.field({ label: '番号', input: numInput, id: 'inv-f-number', hint: numberAuto ? '自動で付けた番号です。書きかえられます。' : null }),
              Kit.field({ label: doc.type === 'receipt' ? '発行日（受け取った日）' : '発行日', input: issue, id: 'inv-f-issue' }),
              dueInput ? Kit.field({ label: T.due, input: dueInput, id: 'inv-f-due', hint: doc.type === 'estimate' ? '既定は発行日から30日' : '既定：' + DUE_RULES[st.settings.dueRule] + '（設定で変更）' }) : null),
            statusSlot, basicWarn, linksRow()]);
          renderStatus();
        }
        function setType(t) {
          if (t === doc.type) return;
          const prev = doc.type;
          const wasAuto = numberAuto || autoNumberRe(prev, st.settings).test(String(doc.number || '').trim());
          doc.type = t;
          if (wasAuto) doc.number = nextNumber(t, doc.issueDate, st.docs, st.settings, doc.id);
          if (t === 'receipt') { doc.status = 'paid'; doc.paidAt = doc.issueDate; doc.dueDate = ''; }
          else {
            if (prev === 'receipt' || (t === 'estimate' && doc.status === 'paid')) { doc.status = t === 'estimate' && prev !== 'receipt' ? 'sent' : 'draft'; doc.paidAt = ''; }
            doc.dueDate = defaultDue(t, doc.issueDate, st.settings.dueRule);
            dueAuto = true;
          }
          if ((doc.notes || '') === (st.settings.notes[prev] || '')) doc.notes = st.settings.notes[t] || '';
          if (t === 'invoice' && !String(doc.bank || '').trim()) doc.bank = st.profile.bank || '';
          renderBasics();
          renderClient();
          renderBankNotes();
          renderItems();
          changed('type');
        }
        function renderStatus() {
          Kit.clear(statusSlot);
          const wrap = h('div', { class: 'inv-status' });
          statusSlot.append(wrap);
          if (doc.type === 'receipt') { wrap.append(h('span', { class: 'small muted' }, '領収書は受け取ったお金の記録なので、入金済みとして数えます。')); return; }
          const opts = doc.type === 'estimate' ? [['draft', '下書き'], ['sent', '送付済み']] : [['draft', '下書き'], ['sent', '送付済み'], ['paid', '入金済み']];
          const cur = doc.type === 'estimate' && doc.status === 'paid' ? 'sent' : doc.status || 'draft';
          const seg = Kit.seg(opts.map(([v, l]) => ({ value: v, label: l })), cur, (v) => {
            doc.status = v;
            doc.paidAt = v === 'paid' ? doc.paidAt || today() : '';
            renderStatus();
            changed('status');
          }, { label: '状態' });
          wrap.append(h('span', { class: 'small ink-2' }, '状態'), seg);
          if (doc.type === 'invoice' && doc.status === 'paid') {
            const pd = h('input', { type: 'date' });
            pd.value = doc.paidAt || '';
            pd.addEventListener('change', () => { doc.paidAt = pd.value; changed('status'); });
            wrap.append(Kit.field({ label: '入金日', input: pd, id: 'inv-f-paid' }));
          }
          const s = stateOf(doc, st.docs);
          if (s.key === 'overdue') wrap.append(chipOf(s));
        }
        function linksRow() {
          const wrap = h('div', { class: 'inv-links' });
          const link = (label, d) => wrap.append(Kit.btn(label, async () => { await flush(); showEditor(st.docs.find((x) => x.id === d.id) || d); }, { kind: 'ghost', icon: 'link' }));
          const srcE = doc.fromEstimate && st.docs.find((x) => x.id === doc.fromEstimate);
          if (srcE) link('元の見積書 ' + (srcE.number || ''), srcE);
          const srcI = doc.fromInvoice && st.docs.find((x) => x.id === doc.fromInvoice);
          if (srcI) link('元の請求書 ' + (srcI.number || ''), srcI);
          for (const x of st.docs.filter((x) => x.id !== doc.id && (x.fromEstimate === doc.id || x.fromInvoice === doc.id))) link('作った' + TYPES[x.type].label + ' ' + (x.number || ''), x);
          if (doc.fromLead) wrap.append(Kit.btn('もとの問い合わせを開く', async () => { await flush(); Kit.go('inbox', { lead: doc.fromLead }); }, { kind: 'ghost', icon: 'inbox' }));
          return wrap.childNodes.length ? wrap : null;
        }
        function renderBasicWarn() {
          Kit.clear(basicWarn);
          const num = String(doc.number || '').trim();
          if (!num) basicWarn.append(hint('warn', '番号が空です。書類を見分けるために番号を入れてください。', true));
          else if (st.docs.some((x) => x.id !== doc.id && x.type === doc.type && String(x.number || '').trim() === num)) basicWarn.append(hint('warn', '同じ番号の' + TYPES[doc.type].label + 'がほかにもあります。番号を変えてください。', true));
          if (doc.type !== 'receipt' && doc.dueDate && doc.issueDate && doc.dueDate < doc.issueDate) basicWarn.append(hint('warn', TYPES[doc.type].due + 'が発行日より前になっています。', true));
        }

        /* 宛先と件名 */
        const clientBody = h('div', { class: 'stack' });
        const knownClients = new Map();
        const clientList = h('datalist', { id: 'inv-clients' });
        const addKnown = (name, c) => { const n = String(name || '').trim(); if (!n || knownClients.has(n)) return; knownClients.set(n, c); clientList.append(h('option', { value: n })); };
        [...st.docs].filter((d) => d.id !== doc.id).sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''))).forEach((d) => addKnown(d.client && d.client.name, d.client));
        Kit.store.list('leads').then((leads) => { if (seq !== viewSeq) return; for (const l of leads || []) addKnown(l.name, { name: l.name, honorific: '様', address: '', contact: '' }); }).catch(() => { /* 問い合わせがなくても使える */ });
        function renderClient() {
          Kit.clear(clientBody);
          const c = doc.client;
          const name = h('input', { type: 'text', list: 'inv-clients', autocomplete: 'off', placeholder: '例：さくら台中学校 PTA／山田 さくら' });
          name.value = c.name || '';
          const hon = h('select', null, h('option', { value: '様' }, '様'), h('option', { value: '御中' }, '御中'), h('option', { value: '' }, 'なし'));
          hon.value = c.honorific || '';
          const addr = h('input', { type: 'text', autocomplete: 'off', placeholder: '例：佐賀県佐賀市〇〇町1-2-3（なくてもよい）' });
          addr.value = c.address || '';
          const contact = h('input', { type: 'text', autocomplete: 'off', placeholder: '例：佐藤 健（会社・学校あてのとき）' });
          contact.value = c.contact || '';
          const subj = h('input', { type: 'text', autocomplete: 'off', placeholder: doc.type === 'receipt' ? '例：授業ツール・テンプレート集' : '例：個別レッスン 10月分（8回）' });
          subj.value = doc.subject || '';
          name.addEventListener('input', () => {
            c.name = name.value;
            const k = knownClients.get(name.value.trim());
            if (k) {
              // 前に使った宛先なら、残りも埋める
              if (k.honorific != null) { c.honorific = k.honorific; hon.value = k.honorific; }
              if (!c.address && k.address) { c.address = k.address; addr.value = k.address; }
              if (!c.contact && k.contact) { c.contact = k.contact; contact.value = k.contact; }
              honAuto = false;
            } else if (honAuto) { c.honorific = ORG_RE.test(name.value) ? '御中' : '様'; hon.value = c.honorific; }
            changed('client');
          });
          hon.addEventListener('change', () => { honAuto = false; c.honorific = hon.value; changed('client'); });
          addr.addEventListener('input', () => { c.address = addr.value; changed('client'); });
          contact.addEventListener('input', () => { c.contact = contact.value; changed('client'); });
          subj.addEventListener('input', () => { doc.subject = subj.value; changed('subject'); });
          clientBody.append(
            h('div', { class: 'inv-g client' },
              Kit.field({ label: '宛先（会社・学校・お名前）', input: name, id: 'inv-f-client', hint: '前に使った宛先や問い合わせの名前から選べます。' }),
              Kit.field({ label: '敬称', input: hon, id: 'inv-f-hon' })),
            h('div', { class: 'inv-g' },
              Kit.field({ label: '住所', input: addr, id: 'inv-f-addr' }),
              Kit.field({ label: '担当者', input: contact, id: 'inv-f-contact' })),
            Kit.field({ label: doc.type === 'receipt' ? '但し書き（〇〇代として）' : '件名', input: subj, id: 'inv-f-subject' }));
        }

        /* 明細 */
        const itemsBox = h('div', { class: 'inv-items' });
        const itemsWarn = h('div', { class: 'stack tight' });
        const unitList = h('datalist', { id: 'inv-units' }, UNITS.map((u) => h('option', { value: u })));
        const cellId = (i, k) => 'inv-it-' + i + '-' + k;
        function renderItems(focus) {
          Kit.clear(itemsBox);
          const c = calc(doc), incl = doc.taxMode === 'inclusive', n = doc.items.length;
          itemsBox.append(h('div', { class: 'inv-ihead', 'aria-hidden': 'true' }, h('span'), h('span', null, '品目'), h('span', { class: 'r' }, '数量'), h('span', null, '単位'), h('span', { class: 'r' }, incl ? '単価(税込)' : '単価'), h('span', null, '税率'), h('span', { class: 'r' }, '金額'), h('span')));
          doc.items.forEach((it, i) => {
            const name = h('input', { type: 'text', id: cellId(i, 'name'), autocomplete: 'off', placeholder: '品目（例：オンライン個別レッスン 60分）', 'data-k': 'name' });
            name.value = it.name || '';
            const qty = h('input', { type: 'text', inputmode: 'decimal', id: cellId(i, 'qty'), class: 'r', autocomplete: 'off', 'data-k': 'qty' });
            qty.value = fmtN(parseNum(it.qty));
            const unit = h('input', { type: 'text', id: cellId(i, 'unit'), list: 'inv-units', autocomplete: 'off', placeholder: '回', 'data-k': 'unit' });
            unit.value = it.unit || '';
            const price = h('input', { type: 'text', inputmode: 'decimal', id: cellId(i, 'price'), class: 'r', autocomplete: 'off', placeholder: '0', 'data-k': 'price' });
            price.value = parseNum(it.price) ? fmtN(parseNum(it.price)) : '';
            const rate = h('select', { id: cellId(i, 'rate'), 'data-k': 'rate' }, RATES.map((r) => h('option', { value: String(r) }, RATE_LABEL[r])));
            rate.value = String(RATES.includes(+it.taxRate) ? +it.taxRate : 10);
            const cell = (cls, label, input) => h('label', { class: 'inv-cell ' + cls }, h('span', null, label), input);
            itemsBox.append(h('div', { class: 'inv-item', 'data-i': String(i) },
              h('span', { class: 'inv-i-no', 'aria-hidden': 'true' }, String(i + 1)),
              cell('inv-i-name', (i + 1) + '行目の品目', name),
              cell('inv-i-qty', '数量', qty),
              cell('inv-i-unit', '単位', unit),
              cell('inv-i-price', incl ? '単価（税込）' : '単価', price),
              cell('inv-i-rate', '税率', rate),
              h('div', { class: 'inv-i-amt' }, h('span', null, '金額'), h('output', { id: cellId(i, 'amt'), 'aria-label': (i + 1) + '行目の金額' }, Kit.yen(c.lines[i]), +it.taxRate === 8 ? h('span', { class: 'inv-mark', title: '軽減税率(8%)対象' }, '※') : null)),
              h('div', { class: 'inv-i-act' },
                Kit.btn('', () => moveItem(i, -1), { icon: 'up', title: (i + 1) + '行目を上へ（Alt＋↑）', kind: 'ghost', disabled: i === 0, class: 'inv-mv' }),
                Kit.btn('', () => moveItem(i, 1), { icon: 'down', title: (i + 1) + '行目を下へ（Alt＋↓）', kind: 'ghost', disabled: i === n - 1, class: 'inv-mv' }),
                Kit.btn('', () => removeItem(i), { icon: 'trash', title: (i + 1) + '行目を消す', kind: 'ghost', class: 'inv-mv' }),
                menuBtn('', () => [
                  i > 0 ? { label: '上へ移動', icon: 'up', onClick: () => moveItem(i, -1) } : null,
                  i < n - 1 ? { label: '下へ移動', icon: 'down', onClick: () => moveItem(i, 1) } : null,
                  { label: 'この行を複製', icon: 'copy', onClick: () => dupItem(i) },
                  '-',
                  { label: 'この行を消す', icon: 'trash', danger: true, onClick: () => removeItem(i) },
                ], { icon: 'more', title: (i + 1) + '行目の操作', kind: 'ghost', class: 'inv-i-menu' }))));
          });
          if (focus) {
            const el = document.getElementById(cellId(focus.i, focus.k || 'name'));
            if (el) { el.focus(); if (focus.select && el.select) el.select(); }
          }
          renderItemsWarn();
        }
        // 行の操作ボタンにフォーカスを戻す（見えていて押せるもの）
        function focusRowBtn(j, order) {
          const btns = [...itemsBox.querySelectorAll('.inv-item[data-i="' + j + '"] .inv-i-act button')];
          const b = order.map((k) => btns[k]).find((x) => x && !x.disabled && x.offsetParent !== null) || btns.find((x) => !x.disabled && x.offsetParent !== null);
          if (b) b.focus();
        }
        function moveItem(i, d, k) {
          const j = i + d;
          if (j < 0 || j >= doc.items.length) return;
          const [it] = doc.items.splice(i, 1);
          doc.items.splice(j, 0, it);
          renderItems(k ? { i: j, k } : null);
          if (!k) focusRowBtn(j, d < 0 ? [0, 1] : [1, 0]);
          changed('items');
        }
        function dupItem(i) {
          doc.items.splice(i + 1, 0, Kit.clone(doc.items[i]));
          renderItems({ i: i + 1, k: 'name' });
          changed('items');
        }
        function addItem() {
          const last = doc.items[doc.items.length - 1];
          doc.items.push(blankItem(last ? last.taxRate : 10));
          renderItems({ i: doc.items.length - 1, k: 'name' });
          changed('items');
        }
        function removeItem(i) {
          const before = Kit.clone(doc.items), removed = doc.items[i];
          if (doc.items.length === 1) doc.items = [blankItem(removed.taxRate)];
          else doc.items.splice(i, 1);
          renderItems();
          focusRowBtn(Math.min(i, doc.items.length - 1), [2, 3]);
          changed('items');
          if (removed && (String(removed.name || '').trim() || parseNum(removed.price))) {
            Kit.toast((String(removed.name || '').trim() || (i + 1) + '行目') + ' を消しました', { action: { label: '元に戻す', onClick: () => { if (seq !== viewSeq) return; doc.items = before; renderItems(); changed('items'); } } });
          }
        }
        itemsBox.addEventListener('input', (e) => {
          const row = e.target.closest('.inv-item'), k = e.target.dataset && e.target.dataset.k;
          if (!row || !k) return;
          const it = doc.items[+row.dataset.i];
          if (!it) return;
          if (k === 'name') it.name = e.target.value;
          else if (k === 'unit') it.unit = e.target.value;
          else if (k === 'qty') it.qty = parseNum(e.target.value);
          else if (k === 'price') it.price = parseNum(e.target.value);
          else return;
          changed('items');
        });
        itemsBox.addEventListener('change', (e) => {
          if (!e.target.dataset || e.target.dataset.k !== 'rate') return;
          const i = +e.target.closest('.inv-item').dataset.i;
          doc.items[i].taxRate = +e.target.value;
          const out = document.getElementById(cellId(i, 'amt'));
          if (out) { Kit.clear(out); out.append(Kit.yen(calc(doc).lines[i]), doc.items[i].taxRate === 8 ? h('span', { class: 'inv-mark', title: '軽減税率(8%)対象' }, '※') : ''); }
          changed('items');
        });
        itemsBox.addEventListener('focusout', (e) => {
          const k = e.target.dataset && e.target.dataset.k;
          if (k === 'qty') e.target.value = fmtN(parseNum(e.target.value));
          if (k === 'price') e.target.value = parseNum(e.target.value) ? fmtN(parseNum(e.target.value)) : '';
        });
        // Enter で次の行（最後の行なら行を足す）、Alt＋↑↓ で並べかえ
        itemsBox.addEventListener('keydown', (e) => {
          const k = e.target.dataset && e.target.dataset.k;
          if (!k || e.isComposing || e.keyCode === 229) return;
          const i = +e.target.closest('.inv-item').dataset.i;
          if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) { e.preventDefault(); moveItem(i, e.key === 'ArrowUp' ? -1 : 1, k); return; }
          if (e.key === 'Enter' && e.target.tagName === 'INPUT' && !e.altKey && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            if (i === doc.items.length - 1) addItem();
            else { const el = document.getElementById(cellId(i + 1, k)); if (el) { el.focus(); if (el.select) el.select(); } }
          }
        });
        function renderItemsWarn() {
          Kit.clear(itemsWarn);
          if (doc.items.filter((it) => !isBlankItem(it)).length > 15) itemsWarn.append(hint('warn', '明細が15行を超えています。1枚に収めるため、書類の字が小さくなります。まとめられる行はまとめてください。', true));
          if (lastInfo.truncated) itemsWarn.append(hint('warn', '入りきらない明細が ' + lastInfo.truncated + ' 行あります。行をまとめるか、備考を短くしてください。', true));
        }

        /* 税と合計 */
        const modeSeg = Kit.seg([{ value: 'exclusive', label: '税抜で入力' }, { value: 'inclusive', label: '税込で入力' }], doc.taxMode, (v) => setTaxMode(v), { label: '単価の入れ方' });
        const roundSel = h('select', null, Object.entries(ROUND).map(([v, l]) => h('option', { value: v }, l)));
        roundSel.value = doc.rounding;
        roundSel.addEventListener('change', () => { doc.rounding = roundSel.value; changed('tax'); });
        const whBox = h('input', { type: 'checkbox', id: 'inv-f-wh' });
        whBox.checked = !!doc.withholding;
        whBox.addEventListener('change', () => { doc.withholding = whBox.checked; changed('tax'); });
        const sumBox = h('dl', { class: 'inv-sum' });
        const rateChips = h('div', { class: 'inv-rates' });
        const taxNotes = h('div', { class: 'stack tight' });
        function setTaxMode(v) {
          if (v === doc.taxMode) return;
          const before = Kit.clone(doc.items);
          doc.taxMode = v;
          // 単価を直して、合計がほぼ変わらないように
          const conv = doc.items.some((it) => parseNum(it.price) && +it.taxRate);
          if (conv) for (const it of doc.items) { const r = +it.taxRate || 0, p = parseNum(it.price); if (p && r) it.price = v === 'inclusive' ? Math.round((p * (100 + r)) / 100) : Math.round((p * 100) / (100 + r)); }
          renderItems();
          changed('tax');
          if (conv) Kit.toast(v === 'inclusive' ? '単価を税込の金額に直しました' : '単価を税抜の金額に直しました', { action: { label: '単価はそのまま', onClick: () => { if (seq !== viewSeq) return; doc.items = before; renderItems(); changed('tax'); } } });
        }
        function renderSummary(c) {
          Kit.clear(sumBox);
          for (const [label, v, strong] of summaryRows(c, TYPES[doc.type])) sumBox.append(h('dt', { class: strong ? 'tot' : null }, label), h('dd', { class: strong ? 'tot' : null }, Kit.yen(v)));
          Kit.clear(rateChips);
          for (const r of c.rates.length ? c.rates : [10]) { const b = c.by[r]; rateChips.append(h('span', { class: 'chip line num' }, RATE_DOC[r] + ' ' + Kit.yen(c.incl ? b.incl : b.excl) + (r ? '（消費税 ' + Kit.yen(b.tax) + '）' : ''))); }
          Kit.clear(taxNotes);
          if (c.withholding) taxNotes.append(hint('info', '源泉所得税は、税抜金額 ' + Kit.yen(c.excl) + ' に 10.21%（100万円を超える部分は 20.42%）をかけて、1円未満を切り捨てています。'));
          if (doc.type === 'receipt' && c.excl >= 50000) taxNotes.append(hint('info', '5万円以上（税抜）の領収書を紙で渡すときは、収入印紙が必要です。PDF をメールなどで送るなら印紙はいりません。'));
        }

        /* 発行者（プロフィール） */
        const issuerBox = h('div', { class: 'stack tight' });
        function renderIssuer() {
          Kit.clear(issuerBox);
          const p = st.profile;
          issuerBox.append(h('div', { class: 'inv-issuer' },
            h('b', null, p.name || '（屋号が入っていません）', p._sample ? [' ', sampleChip()] : null),
            p.owner ? h('span', null, p.owner) : null,
            p.address ? h('span', null, p.address) : h('span', { class: 'muted' }, '住所：未記入'),
            p.phone ? h('span', null, 'TEL ' + p.phone) : null,
            p.email ? h('span', null, p.email) : null,
            p.invoiceNo ? h('span', null, '登録番号 ' + normReg(p.invoiceNo)) : null));
          if (!String(p.invoiceNo || '').trim()) issuerBox.append(hint('info', '登録番号がない請求書でも出せます。登録しているなら、プロフィールに入れると載ります。'));
          else if (!regOk(p.invoiceNo)) issuerBox.append(hint('warn', '登録番号は「T」と13桁の数字です。いまの入力：' + p.invoiceNo, true));
          const seal = h('input', { type: 'checkbox', id: 'inv-f-seal' });
          seal.checked = !!st.settings.seal;
          seal.addEventListener('change', async () => { const s = Kit.clone(st.settings); s.seal = seal.checked; await saveSettings(s); if (seq === viewSeq) schedulePreview(); });
          issuerBox.append(h('label', { class: 'check' }, seal, '印影（屋号の角印）を載せる'));
        }
        const issuerBtn = Kit.btn('発行者の情報を直す', async () => {
          const np = await Kit.profile.edit();
          if (!np || seq !== viewSeq) return;
          await loadProfile();
          renderIssuer();
          renderBankNotes();
          schedulePreview();
        }, { icon: 'user', sm: true });

        /* 振込先・備考 */
        const bankNotesBox = h('div', { class: 'stack' });
        function renderBankNotes() {
          Kit.clear(bankNotesBox);
          if (doc.type === 'invoice') {
            const bank = h('textarea', { rows: 2, placeholder: '例：〇〇銀行 △△支店 普通 1234567 カズノ ヒカル' });
            bank.value = doc.bank || '';
            bank.addEventListener('input', () => { doc.bank = bank.value; changed('bank'); });
            const pb = String(st.profile.bank || '').trim();
            bankNotesBox.append(Kit.field({ label: '振込先', input: bank, id: 'inv-f-bank', hint: pb ? 'この書類だけ変えることもできます。' : '振込先をプロフィール（発行者の情報）に入れておくと、次から自動で入ります。' }));
            if (pb && pb !== String(doc.bank || '').trim()) bankNotesBox.append(h('div', null, Kit.btn('プロフィールの振込先を入れる', () => { doc.bank = pb; renderBankNotes(); changed('bank'); }, { kind: 'ghost', icon: 'user' })));
          }
          const notes = h('textarea', { rows: 3 });
          notes.value = doc.notes || '';
          notes.addEventListener('input', () => { doc.notes = notes.value; changed('notes'); });
          bankNotesBox.append(Kit.field({ label: '備考', input: notes, id: 'inv-f-notes', hint: 'いつもの文は設定で変えられます。' }));
          const def = st.settings.notes[doc.type] || '';
          if (def && def !== doc.notes) bankNotesBox.append(h('div', null, Kit.btn('いつもの文に戻す', () => { doc.notes = def; renderBankNotes(); changed('notes'); }, { kind: 'ghost', icon: 'undo' })));
        }

        /* プレビュー（A4 をそのまま縮めて見せる） */
        const cv = h('canvas', { width: A4W, height: A4H, role: 'img', 'aria-label': '書類のプレビュー（A4）' });
        const paper = h('div', { class: 'inv-paper' }, cv);
        const zoomBtn = Kit.btn('拡大して見る', () => { const z = paper.classList.toggle('is-zoom'); zoomBtn.querySelector('span').textContent = z ? '全体を見る' : '拡大して見る'; }, { icon: 'search', kind: 'ghost' });
        let timer = 0, raf = 0;
        function drawPreview() {
          if (seq !== viewSeq) return;
          lastInfo = drawDoc(cv, doc, st.profile, st.settings);
          renderItemsWarn();
        }
        function schedulePreview() { clearTimeout(timer); timer = setTimeout(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(drawPreview); }, 90); }
        offs.push(() => { clearTimeout(timer); cancelAnimationFrame(raf); });

        /* 書き出し（プレビューと同じ関数で描きなおしてから） */
        async function freshCanvas() {
          await ensureFonts(docText(doc, st.profile));
          const c = document.createElement('canvas');
          lastInfo = drawDoc(c, doc, st.profile, st.settings);
          drawPreview();
          return c;
        }
        async function afterExport(msg) {
          if (isNew || pending) await persist();
          if (doc.type !== 'receipt' && doc.status === 'draft') {
            Kit.toast(msg + '。送ったら状態を送付済みに', { action: { label: '送付済みにする', onClick: () => { if (seq !== viewSeq) return; doc.status = 'sent'; renderStatus(); changed('status'); } } });
          } else Kit.toast(msg);
        }
        async function run(btn, fn) {
          if (busy) return;
          busy = true;
          btn.disabled = true;
          try { await fn(); } catch (e) { console.error(e); Kit.toast('書き出せませんでした。もう一度お試しください', { type: 'bad' }); }
          finally { busy = false; btn.disabled = false; }
        }
        const exportPdf = () => run(pdfBtn, async () => {
          const c = await freshCanvas();
          const blob = await canvasToPdf(c, TYPES[doc.type].label + ' ' + (doc.number || '') + ' ' + clientLabel(doc));
          if (await Kit.download(fileBase(doc) + '.pdf', blob)) await afterExport('PDFを保存しました');
        });
        const exportPng = () => run(pngBtn, async () => {
          const c = await freshCanvas();
          const blob = await Kit.img.toBlob(c, 'image/png');
          if (!blob) throw new Error('png');
          if (await Kit.download(fileBase(doc) + '.png', blob)) await afterExport('画像を保存しました');
        });
        const exportPrint = () => run(printBtn, async () => { await printCanvas(await freshCanvas()); });

        /* 全体の組み立て */
        function refresh(what) {
          const c = calc(doc);
          c.lines.forEach((v, i) => { const out = document.getElementById(cellId(i, 'amt')); if (out && out.firstChild) out.firstChild.textContent = Kit.yen(v); });
          renderSummary(c);
          renderBasicWarn();
          if (what === 'dates' || what === 'status' || what === 'type') renderStatus();
          updateHead();
          schedulePreview();
        }
        const sec = (title, extra, ...kids) => h('section', { class: 'inv-sec' }, h('h2', null, title, extra ? [h('span', { class: 'spacer' }), extra] : null), ...kids);
        const notices = [];
        if (doc.sample) notices.push(hint('info', 'これはサンプルです。サンプルを片付けると消えます。自分の書類にするなら複製してください。', false, Kit.btn('複製する', async () => { await flush(); duplicate(st.docs.find((x) => x.id === doc.id) || doc); }, { sm: true, icon: 'copy' })));
        if (o.lead) notices.push(hint('info', '問い合わせ（' + (o.lead.name || '') + (o.lead.kind ? '・' + o.lead.kind : '') + '）から作りました。' + (+o.lead.value > 0 ? '見込み金額 ' + Kit.yen(o.lead.value) + ' を単価に入れています。見直してください。' : '')));
        const form = h('div', { class: 'inv-form' },
          notices,
          sec('書類', null, basicsBody),
          sec('宛先と件名', null, clientBody),
          sec('明細', null, itemsWarn, itemsBox,
            h('div', { class: 'row' }, Kit.btn('行を追加', addItem, { icon: 'plus' }), h('span', { class: 'small muted inv-keyhint' }, 'Enter で次の行／Alt＋↑↓ で並べかえ')),
            h('details', { class: 'help' }, h('summary', null, '税率の選び方'),
              h('ul', null,
                h('li', null, '10%：ふつうの商品・サービス（レッスン、講座、教材、出張講師料、交通費など）'),
                h('li', null, '8%（軽減）：飲食料品（お酒・外食を除く）と定期購読の新聞。8%の行には書類で ※ が付き、「※は軽減税率(8%)対象」と書かれます。'),
                h('li', null, '対象外：消費税がかからないもの（非課税・不課税、立て替えた実費など）')))),
          sec('税と合計', null,
            h('div', { class: 'row' }, h('span', { class: 'small ink-2' }, '単価の入れ方'), modeSeg),
            Kit.field({ label: '消費税の端数処理', input: roundSel, id: 'inv-f-round', hint: '消費税の1円未満は、税率ごとに合計してから1回だけ処理します（行ごとには丸めません）。' }),
            h('div', { class: 'stack tight' },
              h('label', { class: 'check' }, whBox, '源泉徴収をする（講師料・原稿料など）'),
              h('span', { class: 'small muted' }, '会社や学校に講師料・原稿料を請求して、源泉所得税を差し引くよう言われたときに使います。')),
            sumBox, rateChips, taxNotes),
          sec('発行者', issuerBtn, issuerBox),
          sec(doc.type === 'invoice' ? '振込先と備考' : '備考', null, bankNotesBox),
          h('div', { class: 'row' }, saveMsg));
        const side = h('div', { class: 'inv-side' }, h('div', { class: 'inv-ptools' }, zoomBtn, h('span', { class: 'inv-pinfo' }, 'A4・1枚')), paper);
        const edRoot = h('div', { class: 'inv-ed', 'data-pane': pane });
        const paneSeg = Kit.seg([{ value: 'form', label: '入力', icon: 'edit' }, { value: 'preview', label: 'プレビュー', icon: 'eye' }], pane, (v) => {
          pane = v;
          edRoot.dataset.pane = v;
          Kit.pref.set('invoice:pane', v);
          if (v === 'preview') drawPreview();
          const y = edRoot.getBoundingClientRect().top + window.scrollY - 60;
          if (window.scrollY > y) window.scrollTo(0, Math.max(0, y));
        }, { label: '入力とプレビューの切り替え' });
        edRoot.append(h('div', { class: 'inv-ed-switch' }, paneSeg), h('div', { class: 'inv-ed-grid' }, form, side));
        root.append(
          h('div', { class: 'inv-top' }, Kit.btn('一覧へ戻る', back, { kind: 'ghost', icon: 'left' }), h('span', { class: 'spacer' }), moreB, setB),
          head,
          h('p', { class: 'inv-note' }, 'PDFは画像として保存されます（文字の検索はできません）。'),
          edRoot, clientList, unitList);
        renderBasics();
        renderClient();
        renderItems();
        renderIssuer();
        renderBankNotes();
        renderSummary(calc(doc));
        renderBasicWarn();
        updateHead();
        drawPreview();
        ensureFonts(docText(doc, st.profile)).then((loaded) => { if (loaded) drawPreview(); }).catch(() => { /* 既定の字体のまま */ });
        const offP = Kit.store.on('doc:profile', async () => { await loadProfile(); if (seq !== viewSeq) return; renderIssuer(); schedulePreview(); });
        disposeView = () => {
          for (const f of offs) f();
          offP();
          if (pending) persist().catch((e) => console.error(e));
        };
      }

      /* ───── 設定 ───── */
      function openSettings(onSaved) {
        const s = st.settings;
        const sel = (id, pairs, v) => { const el = h('select', { id }, pairs.map(([k, l]) => h('option', { value: k }, l))); el.value = v; return el; };
        const round = sel('inv-s-round', Object.entries(ROUND), s.rounding);
        const mode = sel('inv-s-mode', [['exclusive', '税抜で入力'], ['inclusive', '税込で入力']], s.taxMode);
        const due = sel('inv-s-due', Object.entries(DUE_RULES), s.dueRule);
        const notes = {}, pre = {};
        for (const t of TYPE_KEYS) {
          notes[t] = h('textarea', { rows: 2 });
          notes[t].value = s.notes[t] || '';
          pre[t] = h('input', { type: 'text', autocomplete: 'off', spellcheck: 'false', maxlength: '12' });
          pre[t].value = s.prefix[t];
        }
        const seal = h('input', { type: 'checkbox', id: 'inv-s-seal' });
        seal.checked = !!s.seal;
        const example = h('span', { class: 'small muted' });
        const cleanPre = (t) => pre[t].value.trim().replace(/[\s\\/:*?"<>|]+/g, '') || SETTINGS_BLANK.prefix[t];
        const updEx = () => { example.textContent = '例：' + TYPE_KEYS.map((t) => cleanPre(t) + '-' + new Date().getFullYear() + '-001').join('　'); };
        for (const t of TYPE_KEYS) pre[t].addEventListener('input', updEx);
        updEx();
        const sealPrev = h('canvas', { width: 144, height: 144, 'aria-hidden': 'true' });
        const im = st.profile.name ? sealImage(String(st.profile.name).trim(), 144, fontStacks().disp) : null;
        if (im) sealPrev.getContext('2d').drawImage(im, 0, 0);
        const body = h('div', { class: 'stack' },
          h('div', { class: 'grid cols-3' },
            Kit.field({ label: '消費税の端数処理', input: round, id: 'inv-s-round', hint: '1円未満を、税率ごとに1回だけ処理します。' }),
            Kit.field({ label: '単価の入れ方（新しい書類）', input: mode, id: 'inv-s-mode' }),
            Kit.field({ label: '請求書の支払期限', input: due, id: 'inv-s-due', hint: '見積書の有効期限は、発行日から30日です。' })),
          h('div', { class: 'stack tight' }, h('strong', { class: 'small' }, '備考のいつもの文'),
            h('div', { class: 'grid cols-3' }, TYPE_KEYS.map((t) => Kit.field({ label: TYPES[t].label, input: notes[t], id: 'inv-s-notes-' + t })))),
          h('div', { class: 'inv-seal-prev' }, im ? sealPrev : null,
            h('div', { class: 'stack tight' },
              h('label', { class: 'check' }, seal, '印影（屋号の角印）を書類に載せる'),
              h('span', { class: 'small muted' }, '屋号の字から自動でつくった印です。登録した印鑑の代わりにはなりません。'))),
          h('div', { class: 'stack tight' }, h('strong', { class: 'small' }, '番号の書式'),
            h('div', { class: 'inv-prefix' }, TYPE_KEYS.map((t) => Kit.field({ label: TYPES[t].label + 'の頭', input: pre[t], id: 'inv-s-pre-' + t }))),
            example));
        Kit.modal({
          title: '見積書・請求書の設定', wide: true, body,
          actions: [{ label: 'やめる', kind: 'ghost' }, {
            label: '保存する', kind: 'primary', onClick: async () => {
              const ns = normSettings({
                rounding: round.value, taxMode: mode.value, dueRule: due.value, seal: seal.checked,
                notes: Object.fromEntries(TYPE_KEYS.map((t) => [t, notes[t].value.trim()])),
                prefix: Object.fromEntries(TYPE_KEYS.map((t) => [t, cleanPre(t)])),
              });
              await saveSettings(ns);
              Kit.toast('設定を保存しました');
              if (onSaved) onSaved();
            },
          }],
        });
      }

      /* 最初の画面 */
      if (params.doc) {
        const d = st.docs.find((x) => x.id === params.doc);
        if (d) showEditor(d);
        else { Kit.toast('書類が見つかりませんでした', { type: 'bad' }); showList(); }
      } else if (params.fromLead) await openFromLead(params.fromLead);
      else showList();
      return () => leaveView();
    },
  });
})();
