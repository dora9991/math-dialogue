// マネタイズ計画：収入の柱を組み立てて12か月（24か月）を試算する。目標からの逆算と、計画書の例つき
(function () {
  'use strict';
  const { h } = Kit;

  /* ───────── 試算のしくみ（window.MoneyPlan） ─────────
     m は「その商品を始めてからの月数」（始めた月が 0）。始める月（startOffset）より前は 0。
     ・単発販売 once            … 数(m) = 月の数 × (1+伸び)^m
     ・時間を使うサービス session … 単発と同じ。ただし月の上限（capacity）で頭打ち。作業時間 = 数 × 1回の時間
     ・月額 subscription         … 新規(m) = 月の新規 × (1+伸び)^m
                                   会員(m) = 会員(m−1) × (1−解約) + 新規(m)（定員があれば頭打ち）、売上 = 会員 × 月額
     ・案件 project              … 単発と同じ（0.5件なら2か月に1件）。上限があれば頭打ち。作業時間 = 件数 × 1件の時間
     ・印税 royalty              … 売上 = 定価 × 冊数。ストアの取り分（例：30%）は手数料として費用に入れる
     どれも：変動費 = 売上 × 手数料・原価の率。利益 = 売上 − 変動費 − 固定費。
     累積の利益は −初期費用 から始まる。損益分岐 = 累積が 0 以上になる最初の月（なければ −1）。
     シナリオ：慎重（数×0.6・伸び×0.5・解約×1.3）／標準／挑戦（数×1.4・伸び×1.3・解約×0.8）。価格と上限は変えない。
     伸びがマイナスのときは、慎重ほど落ちこみが大きくなるよう割り算にする。 */
  const SCENARIOS = [
    { id: 'low', label: '慎重', volume: 0.6, growth: 0.5, churn: 1.3 },
    { id: 'base', label: '標準', volume: 1, growth: 1, churn: 1 },
    { id: 'high', label: '挑戦', volume: 1.4, growth: 1.3, churn: 0.8 },
  ];
  const SC_ALIAS = { '慎重': 'low', cautious: 'low', '標準': 'base', '挑戦': 'high', bold: 'high' };
  const scenarioOf = (s) => {
    if (s && typeof s === 'object') return Object.assign({ id: 'custom', label: '独自', volume: 1, growth: 1, churn: 1 }, s);
    const id = SC_ALIAS[s] || s;
    return SCENARIOS.find((x) => x.id === id) || SCENARIOS[1];
  };

  // 収入の種類。f = その種類での入力欄の名前、show = 使う欄（使わない欄は計算にも入れない）
  const KINDS = {
    once: {
      label: '単発販売', ex: '教材のダウンロードなど', unit: '件',
      hint: '1つ売れるたびに売上。作るのは1回、売るのは何度でも。',
      f: { price: '価格（円）', volume: '月に売れる数', hoursPerUnit: '1件の作業（時間）' },
      show: ['price', 'volume', 'growth', 'costRate', 'hoursPerUnit', 'startOffset'],
    },
    session: {
      label: '時間を使うサービス', ex: '個別レッスン・講座', unit: '回',
      hint: '自分の時間を売る商品。数がふえるほど時間もふえ、月の上限で止まる。',
      f: { price: '1回の料金（円）', volume: '月の回数', capacity: '月の上限（回）', hoursPerUnit: '1回の作業（時間・準備込み）' },
      show: ['price', 'volume', 'growth', 'capacity', 'costRate', 'hoursPerUnit', 'startOffset'],
    },
    subscription: {
      label: '月額', ex: 'メンバーシップ', unit: '人',
      hint: '毎月の入会と解約で、会員が積み上がる。解約の率がいちばん効く。',
      f: { price: '月額（円）', volume: '月の新規入会（人）', capacity: '定員（人・0は上限なし）', hoursPerUnit: '1人あたりの月の作業（時間）' },
      show: ['price', 'volume', 'growth', 'churn', 'capacity', 'costRate', 'hoursPerUnit', 'startOffset'],
    },
    project: {
      label: '案件', ex: '出張ワークショップ・受託', unit: '件',
      hint: '1件が大きく、時間もかかる。0.5件なら2か月に1件。',
      f: { price: '1件の金額（円）', volume: '月の件数', capacity: '月の上限（件・0は上限なし）', hoursPerUnit: '1件の作業（時間・移動込み）' },
      show: ['price', 'volume', 'growth', 'capacity', 'costRate', 'hoursPerUnit', 'startOffset'],
    },
    royalty: {
      label: '印税・ロイヤリティ', ex: 'Kindle本など', unit: '冊',
      hint: '定価×冊数が売上。ストアの取り分（Kindleの70%プランなら30%）を手数料に入れる。',
      f: { price: '定価（円）', volume: '月に売れる数', costRate: 'ストアの取り分（%）' },
      show: ['price', 'volume', 'growth', 'costRate', 'startOffset'],
    },
  };
  const KIND_IDS = Object.keys(KINDS);
  const uses = (s, key) => KINDS[s.kind].show.includes(key);
  const TIME_FREE = ['once', 'subscription', 'royalty']; // 時間をあまり使わない種類（アドバイス用）

  // 小さな道具（Kit に頼らず動く：Node でも試せるように）
  const pad2 = (n) => String(n).padStart(2, '0');
  const thisYm = () => { const d = new Date(); return d.getFullYear() + '-' + pad2(d.getMonth() + 1); };
  const okYm = (s) => /^\d{4}-(0[1-9]|1[0-2])$/.test(String(s || ''));
  const ymAdd = (ym, n) => { const t = +ym.slice(0, 4) * 12 + (+ym.slice(5, 7) - 1) + n; return Math.floor(t / 12) + '-' + pad2((t % 12) + 1); };
  const ymMonth = (ym) => +ym.slice(5, 7);
  const ymLabel = (ym) => ymMonth(ym) + '月';
  const ymLong = (ym) => ym.slice(0, 4) + '年' + ymMonth(ym) + '月';
  const n0 = (v) => (v !== '' && v != null && Number.isFinite(+v) ? +v : 0);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const r1 = (v) => Math.round(v * 10) / 10;
  const r2 = (v) => Math.round(v * 100) / 100;
  let seq = 0;
  const newId = () => 'st-' + Date.now().toString(36) + (seq++).toString(36) + Math.random().toString(36).slice(2, 5);

  function normStream(s) {
    s = s || {};
    return {
      id: String(s.id || newId()), name: String(s.name || ''),
      kind: KIND_IDS.includes(s.kind) ? s.kind : 'once',
      price: Math.max(0, n0(s.price)), volume: Math.max(0, n0(s.volume)),
      growth: clamp(n0(s.growth), -0.99, 3), churn: clamp(n0(s.churn), 0, 1), costRate: clamp(n0(s.costRate), 0, 1),
      hoursPerUnit: Math.max(0, n0(s.hoursPerUnit)), capacity: Math.max(0, n0(s.capacity)),
      startOffset: Math.max(0, Math.round(n0(s.startOffset))), note: String(s.note || ''),
    };
  }
  // 保存された計画を、欠けた所を補ってそろえる（元の値は書きかえない）
  function normalize(p) {
    p = p && typeof p === 'object' ? p : {};
    const out = {
      title: String(p.title || ''),
      startMonth: okYm(p.startMonth) ? p.startMonth : thisYm(),
      months: +p.months === 24 ? 24 : 12,
      streams: (Array.isArray(p.streams) ? p.streams : []).map(normStream),
      fixedCosts: (Array.isArray(p.fixedCosts) ? p.fixedCosts : []).map((x) => ({ name: String((x && x.name) || ''), monthly: Math.max(0, n0(x && x.monthly)) })),
      initialCosts: (Array.isArray(p.initialCosts) ? p.initialCosts : []).map((x) => ({ name: String((x && x.name) || ''), amount: Math.max(0, n0(x && x.amount)) })),
      targetMonthly: Math.max(0, n0(p.targetMonthly)),
      hoursAvailable: Math.max(0, n0(p.hoursAvailable)),
      notes: String(p.notes || ''),
    };
    if (p._sample) out._sample = true;
    return out;
  }

  // ある月の数（月額は会員数）。members は月額の会員数を月から月へ持ちこす入れ物
  function unitsAt(s, m, sc, members) {
    const k = m - s.startOffset;
    if (k < 0) return 0;
    const gm = sc.growth > 0 ? sc.growth : 1;
    const g = s.growth >= 0 ? s.growth * gm : s.growth / gm;
    const flow = s.volume * sc.volume * Math.pow(1 + Math.max(-0.99, g), k);
    const cap = uses(s, 'capacity') && s.capacity > 0 ? s.capacity : Infinity;
    if (s.kind === 'subscription') {
      const churn = clamp(s.churn * sc.churn, 0, 1);
      const now = Math.min(cap, (members[s.id] || 0) * (1 - churn) + flow);
      members[s.id] = now;
      return now;
    }
    return Math.min(cap, flow);
  }

  function project(plan, scenario = 'base') {
    const p = normalize(plan);
    const sc = scenarioOf(scenario);
    const fixed = p.fixedCosts.reduce((a, x) => a + x.monthly, 0);
    const initial = p.initialCosts.reduce((a, x) => a + x.amount, 0);
    const members = {};
    const months = [];
    let cumulative = -initial;
    for (let m = 0; m < p.months; m++) {
      const ym = ymAdd(p.startMonth, m);
      const byStream = {}, units = {}, hoursBy = {};
      let revenue = 0, variable = 0, hours = 0;
      for (const s of p.streams) {
        const u = unitsAt(s, m, sc, members);
        const rev = Math.round(u * s.price);
        const hh = uses(s, 'hoursPerUnit') ? u * s.hoursPerUnit : 0;
        byStream[s.id] = rev; units[s.id] = r2(u); hoursBy[s.id] = r1(hh);
        revenue += rev; variable += Math.round(rev * s.costRate); hours += hh;
      }
      const cost = variable + fixed, profit = revenue - cost;
      cumulative += profit;
      months.push({ ym, label: ymLabel(ym), revenue, cost, variable, fixed, profit, cumulative, byStream, hours: r1(hours), hoursBy, units });
    }
    const sumOf = (arr, k) => arr.reduce((a, x) => a + x[k], 0);
    const yearOf = (arr) => (arr.length ? { revenue: sumOf(arr, 'revenue'), cost: sumOf(arr, 'cost'), profit: sumOf(arr, 'profit') } : null);
    let peakHours = 0, peakMonth = -1;
    months.forEach((x, i) => { if (x.hours > peakHours) { peakHours = x.hours; peakMonth = i; } });
    const byStream = {};
    for (const s of p.streams) byStream[s.id] = months.reduce((a, x) => a + x.byStream[s.id], 0);
    return {
      scenario: sc.id, plan: p, months,
      totals: {
        revenue: sumOf(months, 'revenue'), cost: sumOf(months, 'cost'), profit: sumOf(months, 'profit'),
        variable: sumOf(months, 'variable'), fixed: fixed * months.length, fixedMonthly: fixed, initial,
        cumulative: months.length ? months[months.length - 1].cumulative : -initial,
        breakEvenMonth: months.findIndex((x) => x.cumulative >= 0),
        profitableMonth: months.findIndex((x) => x.profit > 0),
        peakHours, peakMonth, byStream,
        year1: yearOf(months.slice(0, 12)), year2: yearOf(months.slice(12, 24)),
      },
    };
  }

  /* ───────── ひな形（実在しない、例としての数字） ───────── */
  const S = (id, name, kind, o) => normStream(Object.assign({ id, name, kind }, o));
  const PRESET_DEFS = [
    {
      id: 'hirameki', name: 'ひらめき数学舎（教材・レッスン）', desc: 'オンラインの数学教室。レッスン・講座・教材・月額・Kindle本を組み合わせる',
      make: (start) => ({
        title: 'ひらめき数学舎のマネタイズ計画', startMonth: start, months: 12,
        streams: [
          S('lesson', 'オンライン個別レッスン（60分）', 'session', { price: 4000, volume: 5, growth: 0.06, capacity: 16, hoursPerUnit: 1.5, costRate: 0.036, note: '準備と記録を入れて1回1.5時間。週4回までにする' }),
          S('course', '大人の学び直し講座（全6回）', 'session', { price: 18000, volume: 1, growth: 0.05, capacity: 4, hoursPerUnit: 2.5, costRate: 0.036, startOffset: 2, note: '少人数のオンライン講座。1人あたりの時間は、6回分を参加人数で割った目安' }),
          S('tools', '授業ツール・テンプレート集（ダウンロード）', 'once', { price: 1500, volume: 8, growth: 0.08, costRate: 0.15, note: '販売サイトの手数料と決済で約15%' }),
          S('ws', '出張ワークショップ（学校・公民館・90分）', 'project', { price: 30000, volume: 0.3, growth: 0.05, capacity: 2, hoursPerUnit: 8, costRate: 0.08, startOffset: 1, note: '3か月に1回ほど。準備・移動を入れて8時間。材料と交通費で8%' }),
          S('club', 'メンバーシップ「ひらめき部」', 'subscription', { price: 980, volume: 5, growth: 0.05, churn: 0.06, hoursPerUnit: 0.08, costRate: 0.1, startOffset: 3, note: 'ツール使い放題と月1回のオンライン会。会員サイトの手数料10%' }),
          S('kindle', 'Kindle本『公式は、発見できる』', 'royalty', { price: 500, volume: 20, growth: 0.02, costRate: 0.3, startOffset: 6, note: '70%のロイヤリティを選んだ場合。ストアの取り分は30%' }),
        ],
        fixedCosts: [
          { name: 'Zoom（有料プラン）', monthly: 2200 }, { name: 'ホームページ（ドメイン・サーバー）', monthly: 1500 },
          { name: 'デザインツール', monthly: 1200 }, { name: 'チラシ・広告', monthly: 3000 }, { name: '通信費（事業で使う分）', monthly: 1500 },
        ],
        initialCosts: [
          { name: '機材（マイク・Webカメラ・ペンタブレット）', amount: 35000 }, { name: 'ホームページの準備', amount: 10000 },
          { name: 'チラシの印刷（500枚）', amount: 8000 }, { name: '教材の素材・参考書', amount: 7000 },
        ],
        targetMonthly: 150000, hoursAvailable: 40,
        notes: '3か月ごとに見直す。育児と両立するため、作業は月40時間（週10時間）まで。',
      }),
    },
    {
      id: 'cafe', name: '小さなカフェ', desc: '12席をひとりで。店内・テイクアウト・豆の通販と定期便・貸切',
      make: (start) => ({
        title: '小さなカフェの収支計画', startMonth: start, months: 12,
        streams: [
          S('eatin', '店内のドリンク・食事', 'session', { price: 1100, volume: 380, growth: 0.025, capacity: 750, hoursPerUnit: 0.3, costRate: 0.33, note: '客単価¥1,100。上限は12席×1日2.5回転×25日。原価30%と決済3%' }),
          S('sweets', 'テイクアウトの焼き菓子', 'once', { price: 450, volume: 150, growth: 0.04, costRate: 0.35, hoursPerUnit: 0.05, note: '仕込みは開店前にまとめて' }),
          S('beans', 'コーヒー豆の通販', 'once', { price: 1800, volume: 12, growth: 0.06, costRate: 0.5, hoursPerUnit: 0.2, startOffset: 3, note: '豆・袋・送料・手数料で50%' }),
          S('teiki', 'コーヒー豆の定期便（月額）', 'subscription', { price: 3200, volume: 3, growth: 0.05, churn: 0.07, costRate: 0.5, hoursPerUnit: 0.3, startOffset: 4 }),
          S('kashi', '貸切・ワークショップ', 'project', { price: 25000, volume: 0.5, growth: 0.03, capacity: 2, hoursPerUnit: 5, costRate: 0.3, startOffset: 2, note: '定休日に、2か月に1回ほど' }),
        ],
        fixedCosts: [
          { name: '家賃', monthly: 80000 }, { name: '水道光熱費', monthly: 25000 }, { name: '通信費・レジアプリ', monthly: 5000 },
          { name: '消耗品', monthly: 10000 }, { name: '保険・組合費', monthly: 5000 },
        ],
        initialCosts: [
          { name: '内装・工事（居抜き物件）', amount: 1500000 }, { name: '厨房機器（エスプレッソマシンなど）', amount: 800000 },
          { name: '物件の取得費（保証金・礼金）', amount: 400000 }, { name: '開店前の仕入れ・備品', amount: 200000 },
        ],
        targetMonthly: 700000, hoursAvailable: 220,
        notes: '人を雇わず、ひとりで回す前提。定休日は週1日。',
      }),
    },
    {
      id: 'handmade', name: 'ハンドメイドのネットショップ', desc: 'アクセサリーのネット販売・クラフトフェア・作り方教室・キット',
      make: (start) => ({
        title: 'ハンドメイドのネットショップ計画', startMonth: start, months: 12,
        streams: [
          S('shop', 'アクセサリーのネット販売', 'once', { price: 2800, volume: 12, growth: 0.06, costRate: 0.4, hoursPerUnit: 0.8, note: '材料20%・販売サイトの手数料約11%・梱包など' }),
          S('fair', 'クラフトフェアへの出店', 'project', { price: 50000, volume: 0.4, growth: 0.03, capacity: 2, hoursPerUnit: 12, costRate: 0.5, startOffset: 1, note: '1回の売上の目安。出店料・材料・交通費で50%' }),
          S('class', '作り方教室（少人数）', 'session', { price: 3500, volume: 4, growth: 0.05, capacity: 16, hoursPerUnit: 0.7, costRate: 0.25, startOffset: 2, note: '時間は1人あたり。材料費25%' }),
          S('kit', '作り方キット・型紙のダウンロード', 'once', { price: 900, volume: 8, growth: 0.1, costRate: 0.15, startOffset: 4 }),
        ],
        fixedCosts: [{ name: 'ネットショップの有料プラン', monthly: 1000 }, { name: '撮影・梱包の資材', monthly: 3000 }, { name: '通信費（事業で使う分）', monthly: 2000 }],
        initialCosts: [{ name: '工具・材料の初回仕入れ', amount: 60000 }, { name: '撮影ライト・背景', amount: 15000 }, { name: 'ロゴ・ショップカード', amount: 10000 }],
        targetMonthly: 100000, hoursAvailable: 60,
        notes: '子どもが寝たあとの時間で制作する。在庫は作りすぎない。',
      }),
    },
    {
      id: 'web', name: 'Web制作の受託', desc: 'ホームページ制作・改修・保守の月額・相談・テンプレート販売',
      make: (start) => ({
        title: 'Web制作の受託の計画', startMonth: start, months: 12,
        streams: [
          S('hp', 'ホームページ制作（5ページ）', 'project', { price: 300000, volume: 0.4, growth: 0.05, capacity: 2, hoursPerUnit: 60, costRate: 0.05, note: '打ち合わせと修正を入れて60時間。素材・フォント代5%' }),
          S('lp', 'LP・小さな改修', 'project', { price: 50000, volume: 1, growth: 0.05, capacity: 4, hoursPerUnit: 10, costRate: 0.03 }),
          S('hosyu', '保守・更新プラン（月額）', 'subscription', { price: 10000, volume: 0.5, growth: 0.05, churn: 0.03, hoursPerUnit: 1.5, costRate: 0.03, startOffset: 2, note: '制作したお客さんの半分ほどが入る想定' }),
          S('soudan', 'Webの相談（60分）', 'session', { price: 8000, volume: 2, growth: 0.05, capacity: 10, hoursPerUnit: 1.2, costRate: 0.036 }),
          S('tmpl', 'デザインテンプレートの販売', 'once', { price: 6000, volume: 2, growth: 0.08, costRate: 0.15, startOffset: 4 }),
        ],
        fixedCosts: [{ name: 'ソフト・サーバー', monthly: 12000 }, { name: '通信費', monthly: 5000 }, { name: 'コワーキングスペース', monthly: 12000 }, { name: '会計ソフト', monthly: 1500 }],
        initialCosts: [{ name: 'パソコン・モニター', amount: 250000 }, { name: '素材・フォント', amount: 30000 }, { name: '自分のサイト・名刺', amount: 20000 }],
        targetMonthly: 400000, hoursAvailable: 140,
        notes: '受託だけだと時間で頭打ちになるので、保守とテンプレートを育てる。',
      }),
    },
    {
      id: 'coach', name: 'オンライン講座・コーチング', desc: '1対1のコーチング・体験セッション・録画講座・コミュニティ・研修',
      make: (start) => ({
        title: 'オンライン講座・コーチングの計画', startMonth: start, months: 12,
        streams: [
          S('coach', '1対1コーチング（月2回）', 'subscription', { price: 30000, volume: 1, growth: 0.05, churn: 0.3, capacity: 8, hoursPerUnit: 3, costRate: 0.036, note: '平均3か月ほど続く想定（解約30%/月）。定員8人' }),
          S('taiken', '体験セッション（30分）', 'session', { price: 3000, volume: 6, growth: 0.05, capacity: 12, hoursPerUnit: 0.7, costRate: 0.036 }),
          S('video', '録画講座（買い切り）', 'once', { price: 19800, volume: 1.5, growth: 0.08, costRate: 0.1, hoursPerUnit: 0.2, startOffset: 2, note: '質問への返信で1人12分' }),
          S('comm', 'オンラインコミュニティ（月額）', 'subscription', { price: 2980, volume: 3, growth: 0.05, churn: 0.08, hoursPerUnit: 0.15, costRate: 0.1, startOffset: 3 }),
          S('kensyu', '企業・団体向けの研修', 'project', { price: 100000, volume: 0.2, growth: 0.05, capacity: 1, hoursPerUnit: 12, costRate: 0.05, startOffset: 4 }),
        ],
        fixedCosts: [{ name: 'Zoom（有料プラン）', monthly: 2200 }, { name: '講座の配信サービス', monthly: 5000 }, { name: '広告', monthly: 10000 }, { name: '会計ソフト・通信費', monthly: 3000 }],
        initialCosts: [{ name: '撮影・録音の機材', amount: 60000 }, { name: '編集ソフト', amount: 20000 }, { name: 'ホームページ・デザイン', amount: 30000 }],
        targetMonthly: 250000, hoursAvailable: 60,
        notes: 'コーチングの枠は定員8人まで。あふれたら録画講座に案内する。',
      }),
    },
  ];
  const presetPlan = (id, start = thisYm()) => normalize((PRESET_DEFS.find((p) => p.id === id) || PRESET_DEFS[0]).make(start));
  const blankPlan = () => normalize({ title: '', startMonth: thisYm(), months: 12, hoursAvailable: 40 });
  const SAMPLE_PLAN = presetPlan('hirameki');
  const clonePlan = (p) => JSON.parse(JSON.stringify(p));

  window.MoneyPlan = {
    project, normalize, SCENARIOS, KINDS,
    presets: PRESET_DEFS.map((p) => ({ id: p.id, name: p.name, desc: p.desc, plan: presetPlan(p.id) })),
    sample: () => clonePlan(SAMPLE_PLAN),
    blank: blankPlan,
    // 計画を読む（保存がなければサンプル）。ダッシュボードなどから使える
    load: async () => normalize(await Kit.store.get('plan', { sample: SAMPLE_PLAN, blank: blankPlan() })),
    // その月（既定は今月）の見通し。計画の期間外なら null
    thisMonth: (plan, scenario = 'base', ym = thisYm()) => project(plan, scenario).months.find((x) => x.ym === ym) || null,
  };
  if (Kit.store && Kit.store.sample) Kit.store.sample('plan', SAMPLE_PLAN);

  /* ───────── 見た目 ───────── */
  Kit.css('money', `
.app-money { container-type: inline-size; container-name: mo; }
.mo-tabs { margin-bottom: 18px; }
.mo-bar { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 18px; margin-bottom: 14px; }
.mo-name { display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1 1 260px; }
.mo-name h2 { font-family: var(--font-display); font-size: 19px; font-weight: 800; letter-spacing: .03em; min-width: 0; overflow-wrap: anywhere; }
.mo-filters { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 14px; }
.mo-fgroup { display: inline-flex; align-items: center; gap: 8px; }
.mo-flabel { font-size: 12.5px; color: var(--ink-3); font-weight: 700; }
.mo-kpis { display: grid; gap: 10px; grid-template-columns: repeat(2, minmax(0, 1fr)); margin-bottom: 12px; }
.mo-kpis .mo-kpi-hours { grid-column: 1 / -1; }
@container mo (min-width: 560px) { .mo-kpis { grid-template-columns: repeat(3, minmax(0, 1fr)); } .mo-kpis .mo-kpi-hours { grid-column: auto / span 2; } }
@container mo (min-width: 860px) { .mo-kpis { grid-template-columns: repeat(5, minmax(0, 1fr)); } .mo-kpis .mo-kpi-hours { grid-column: auto; } }
.mo-kpi { align-content: start; }
.mo-kpi .kpi-value { font-size: 24px; overflow-wrap: anywhere; }
.mo-kpi .meter { margin-top: 6px; }
.mo-kpi .chip { margin-top: 6px; justify-self: start; white-space: normal; }
.mo-callout { border: 1px solid var(--line); border-left: 3px solid var(--warn); background: var(--surface); border-radius: var(--r); padding: 12px 14px; margin-bottom: 14px; font-size: 14px; color: var(--ink-2); }
.mo-callout strong { color: var(--ink); display: block; margin-bottom: 2px; }
.mo-callout p + p { margin-top: 4px; }
.mo-layout { display: grid; gap: 16px; grid-template-columns: minmax(0, 1fr); grid-template-areas: "charts" "editor" "details"; }
.mo-editor { grid-area: editor; } .mo-charts { grid-area: charts; } .mo-details { grid-area: details; }
.mo-charts, .mo-details, .mo-editor { align-self: start; }
@container mo (min-width: 900px) {
  .mo-layout { grid-template-columns: minmax(330px, 410px) minmax(0, 1fr); grid-template-areas: "editor charts" "editor details"; grid-template-rows: auto 1fr; }
}
.mo-sec-h { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin: 6px 0 -2px; }
.mo-sec-h h3 { font-size: 16px; font-weight: 700; }
.mo-sec-h .spacer { flex: 1; }
.mo-stream { padding: 12px 14px 14px; display: grid; gap: 10px; }
.mo-stream-h { display: flex; align-items: center; gap: 6px; margin: -2px -6px -4px 0; }
.mo-stream-h .spacer { flex: 1; }
.mo-swatch { flex: none; width: 12px; height: 12px; border-radius: 3px; }
.mo-snum { font-size: 12px; font-weight: 700; color: var(--ink-3); font-variant-numeric: tabular-nums; }
.mo-stream-h .btn.icon { flex: none; }
.mo-stream input.mo-sname { font-weight: 700; }
.mo-keys { display: grid; gap: 8px; grid-template-columns: repeat(3, minmax(0, 1fr)); align-items: end; }
.mo-keys label { font-size: 12px; line-height: 1.4; }
.mo-more > summary { cursor: pointer; list-style: none; display: flex; flex-wrap: wrap; align-items: baseline; gap: 2px 8px; font-size: 13px; font-weight: 700; color: var(--gosu); padding: 4px 0; min-height: 30px; }
.mo-more > summary::-webkit-details-marker { display: none; }
.mo-more > summary::before { content: ""; align-self: center; width: 6px; height: 6px; border-right: 2px solid currentColor; border-bottom: 2px solid currentColor; transform: rotate(-45deg); transition: transform .15s; margin-right: 2px; }
.mo-more[open] > summary::before { transform: rotate(45deg); }
.mo-more-s { font-weight: 400; color: var(--ink-3); font-size: 12px; }
.mo-more > .mo-fields { margin-top: 8px; }
@media (pointer: coarse) {
  .app-money .btn.sm, .app-money .seg > button { min-height: 36px; }
  .app-money .mo-stream-h .btn.icon.sm, .app-money .mo-row .btn.icon.sm { width: 36px; min-width: 36px; min-height: 36px; }
  .mo-more > summary { min-height: 36px; align-items: center; }
}
.mo-fields { display: grid; gap: 10px; grid-template-columns: repeat(2, minmax(0, 1fr)); align-items: start; }
.mo-fields .mo-full { grid-column: 1 / -1; }
.mo-fields label { font-size: 12.5px; }
.mo-ssum { padding-top: 9px; border-top: 1px dashed var(--line); font-size: 12.5px; color: var(--ink-2); display: flex; flex-wrap: wrap; gap: 2px 12px; align-items: center; }
.mo-ssum b { color: var(--ink); font-weight: 700; font-variant-numeric: tabular-nums; }
.mo-ssum .chip { white-space: normal; }
.mo-other { font-size: 12px; color: var(--ink-3); }
.mo-rows { display: grid; gap: 8px; }
.mo-row { display: grid; grid-template-columns: minmax(0, 1fr) minmax(92px, 34%) auto; gap: 6px; align-items: center; }
.mo-total { display: flex; justify-content: space-between; gap: 8px; font-size: 13.5px; color: var(--ink-2); padding-top: 8px; border-top: 1px solid var(--line); margin-top: 4px; }
.mo-total b { color: var(--ink); font-variant-numeric: tabular-nums; }
.mo-addrow { margin-top: 8px; }
.mo-cardnote { font-size: 12.5px; color: var(--ink-3); margin: -6px 0 10px; }
.mo-scsum { display: grid; gap: 8px; grid-template-columns: minmax(0, 1fr); margin-top: 10px; }
.mo-scsum button { text-align: left; font: inherit; color: var(--ink-2); background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-sm); padding: 8px 10px; cursor: pointer; display: grid; grid-template-columns: 4.5em minmax(0, 1fr) auto; align-items: center; gap: 8px; min-height: 44px; min-width: 0; }
@container mo (min-width: 520px) { .mo-scsum { grid-template-columns: repeat(3, minmax(0, 1fr)); } .mo-scsum button { grid-template-columns: minmax(0, 1fr); align-items: start; gap: 1px; } }
.mo-scsum button:hover { background: var(--surface-2); }
.mo-scsum button[aria-pressed="true"] { border-color: var(--gosu); box-shadow: inset 0 0 0 1px var(--gosu); }
.mo-scsum .mo-sc-n { display: flex; align-items: center; gap: 6px; font-weight: 700; color: var(--ink); font-size: 13px; }
.mo-scsum .mo-sc-n i { width: 14px; height: 2px; border-radius: 2px; display: inline-block; }
.mo-scsum .mo-sc-v { font-size: 13.5px; color: var(--ink); font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
.mo-scsum .mo-sc-s { font-size: 11.5px; color: var(--ink-3); }
.mo-note { font-size: 13px; color: var(--ink-2); margin-top: 8px; }
.mo-tblwrap { max-height: none; }
table.mo-proj { font-size: 13px; }
table.mo-proj th, table.mo-proj td { padding: 7px 10px; white-space: nowrap; }
table.mo-proj th.mo-stick, table.mo-proj td.mo-stick { position: sticky; left: 0; z-index: 1; background: var(--surface); border-right: 1px solid var(--line); min-width: 10em; max-width: 13em; white-space: normal; text-align: left; }
table.mo-proj thead th.mo-stick { background: var(--surface-2); }
@container mo (min-width: 700px) { table.mo-proj th.mo-stick, table.mo-proj td.mo-stick { min-width: 12em; max-width: 15em; } }
table.mo-proj td.mo-zero { color: var(--ink-3); }
table.mo-proj tr.mo-sub td { color: var(--ink-2); }
table.mo-proj tr.mo-sub td.mo-stick { padding-left: 20px; font-size: 12.5px; }
table.mo-proj tr.mo-strong td { font-weight: 700; color: var(--ink); }
table.mo-proj td.mo-tot { background: var(--surface-2); }
table.mo-proj .mo-yr { display: block; font-size: 10.5px; color: var(--ink-3); font-weight: 500; letter-spacing: 0; }
.mo-back-t td, .mo-back-t th { white-space: nowrap; }
.mo-back-t td:first-child { white-space: normal; min-width: 8em; }
.mo-advice { font-size: 14px; color: var(--ink); background: var(--gosu-wash); border-radius: var(--r-sm); padding: 10px 12px; }
.mo-kindlist { display: grid; gap: 8px; }
.mo-kindlist button, .mo-presets button { text-align: left; font: inherit; color: var(--ink); background: var(--surface); border: 1px solid var(--line-strong); border-radius: var(--r); padding: 11px 14px; cursor: pointer; display: grid; gap: 2px; min-width: 0; }
.mo-kindlist button:hover, .mo-presets button:hover { background: var(--surface-2); border-color: var(--gosu); }
.mo-kindlist b, .mo-presets b { font-size: 15px; }
.mo-kindlist span, .mo-presets span { font-size: 13px; color: var(--ink-2); }
.mo-presets { display: grid; gap: 8px; }
.mo-presets .mo-pnum { font-size: 12.5px; color: var(--ink-3); font-variant-numeric: tabular-nums; }
.mo-out { white-space: pre-wrap; overflow-wrap: anywhere; font-family: var(--font-body); font-size: 13.5px; line-height: 1.8; background: var(--surface-2); border: 1px solid var(--line); border-radius: var(--r); padding: 14px 16px; margin: 0; max-height: 560px; overflow: auto; color: var(--ink); }
.mo-ai { border: 1px solid color-mix(in srgb, var(--gosu) 35%, var(--line)); border-radius: var(--r); padding: 14px 16px; background: var(--surface); }
.mo-ai-text { white-space: pre-wrap; font-size: 14px; line-height: 1.85; margin-top: 6px; }
/* 計画書の例 */
.mo-docwrap { display: grid; gap: 20px; grid-template-columns: minmax(0, 1fr); }
.mo-toc { display: none; }
@container mo (min-width: 900px) {
  .mo-docwrap { grid-template-columns: 190px minmax(0, 1fr); }
  .mo-toc { display: grid; gap: 2px; position: sticky; top: 16px; align-self: start; font-size: 13px; }
}
.mo-toc .mo-toc-h { font-size: 11.5px; letter-spacing: .14em; color: var(--ink-3); font-weight: 700; padding: 0 8px 6px; }
.mo-toc button { text-align: left; border: 0; background: transparent; font: inherit; color: var(--ink-2); padding: 6px 8px; border-radius: 6px; cursor: pointer; line-height: 1.45; }
.mo-toc button:hover { background: var(--surface-2); color: var(--ink); }
.mo-paper { background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-lg); padding: clamp(20px, 5cqi, 52px); min-width: 0; justify-self: start; width: fit-content; max-width: 100%; }
.mo-doc { max-width: 66ch; font-size: 15.5px; line-height: 1.95; color: var(--ink); line-break: strict; }
.mo-doc p { text-wrap: pretty; }
.mo-doc p + p { margin-top: .85em; }
.mo-doc-head { display: flex; gap: 14px; align-items: flex-start; margin-bottom: 18px; }
.mo-doc h1 { font-family: var(--font-display); font-weight: 800; font-size: clamp(23px, 3.6cqi, 31px); letter-spacing: .04em; line-height: 1.45; word-break: auto-phrase; font-feature-settings: "palt"; }
.mo-seal { flex: none; margin-top: 4px; width: 34px; height: 34px; border-radius: 5px; background: var(--shu); color: var(--on-shu); font-family: var(--font-display); font-weight: 800; font-size: 17px; line-height: 34px; text-align: center; transform: rotate(-4deg); }
.mo-lead { color: var(--ink-2); }
.mo-meta { display: flex; flex-wrap: wrap; gap: 6px; margin: 14px 0 6px; }
.mo-doc h2 { font-family: var(--font-display); font-weight: 800; font-size: 21px; letter-spacing: .03em; line-height: 1.5; margin: 2.4em 0 .7em; padding-top: 1.2em; border-top: 1px solid var(--line); display: flex; gap: .55em; align-items: baseline; word-break: auto-phrase; font-feature-settings: "palt"; scroll-margin-top: 70px; }
.mo-doc h2 .mo-no { color: var(--gosu); font-size: .95em; flex: none; }
.mo-doc h3 { font-size: 16px; font-weight: 700; margin: 1.7em 0 .45em; line-height: 1.55; }
.mo-doc ul, .mo-doc ol { margin: .6em 0; padding-left: 1.3em; }
.mo-doc li + li { margin-top: .35em; }
.mo-doc .tbl-wrap { margin: .9em 0 1.1em; }
.mo-doc table.tbl { font-size: 13.5px; line-height: 1.6; }
.mo-doc table.tbl td, .mo-doc table.tbl th { padding: 7px 10px; }
.mo-doc tr.mo-strong td { font-weight: 700; }
.mo-doc .mo-cap { font-size: 12.5px; color: var(--ink-3); margin-top: -.4em; }
.mo-doc .mo-box { border-left: 3px solid var(--gosu); background: var(--surface-2); padding: 12px 16px; border-radius: 0 var(--r-sm) var(--r-sm) 0; margin: 1em 0; }
.mo-stages { display: grid; gap: 10px; margin: 1em 0; }
.mo-stage { border: 1px solid var(--line); border-radius: var(--r); padding: 12px 16px 14px; }
.mo-stage-h { display: flex; align-items: baseline; gap: 10px; margin-bottom: 6px; }
.mo-stage-h .mo-step { flex: none; font-size: 12px; font-weight: 700; color: var(--on-gosu); background: var(--gosu); border-radius: 999px; padding: 0 9px; line-height: 22px; }
.mo-stage-h b { font-size: 16px; }
.mo-dl { display: grid; grid-template-columns: 4.6em minmax(0, 1fr); gap: 3px 10px; margin: 0; font-size: 14.5px; line-height: 1.75; }
@container mo (min-width: 560px) { .mo-dl { grid-template-columns: 6.5em minmax(0, 1fr); gap: 3px 12px; } }
.mo-dl dt { color: var(--ink-3); font-size: 13px; padding-top: 1px; }
.mo-dl dd { margin: 0; }
.mo-layers { display: grid; gap: 10px; margin: 1em 0; }
.mo-layer { border: 1px solid var(--line); border-radius: var(--r); padding: 12px 16px; }
.mo-layer b { display: block; font-size: 15.5px; margin-bottom: 2px; }
.mo-layer p { font-size: 14.5px; color: var(--ink-2); }
.mo-doc .mo-docbtns { margin-top: 1.4em; }
@media print { .mo-tabs, .mo-toc, .mo-docbtns { display: none !important; } .mo-paper { border: 0; padding: 0; } }
`);

  /* ───────── 書式 ───────── */
  const pctS = (x) => (Math.round(x * 1000) / 10) + '%';
  const fmtU = (n) => (Math.abs(n - Math.round(n)) < 0.05 ? Kit.num(Math.round(n)) : Kit.num(n, 1));
  const fmtH = (x) => { const v = r1(x); return (Number.isInteger(v) ? Kit.num(v) : Kit.num(v, 1)) + '時間'; };
  const inVal = (v, d = 4) => String(Math.round(v * Math.pow(10, d)) / Math.pow(10, d));
  const unitOf = (s) => KINDS[s.kind].unit;
  const sampleChip = () => h('span', { class: 'chip sample' }, 'サンプル');
  const colorOf = (i, n) => (n > 8 && i >= 7 ? 'var(--series-8)' : 'var(--series-' + (i + 1) + ')');
  const SC_COLORS = { low: 'var(--series-1)', base: 'var(--series-2)', high: 'var(--series-3)' };
  // 12か月目（期間が短ければ最後の月）
  const m12 = (res) => res.months[Math.min(11, res.months.length - 1)];
  const beText = (res) => { const i = res.totals.breakEvenMonth; return i < 0 ? '' : ymLong(res.months[i].ym) + '（' + (i + 1) + 'か月目）'; };
  // 1時間あたりに残るお金（時間を使う商品だけ）
  const perHour = (s) => (uses(s, 'hoursPerUnit') && s.hoursPerUnit > 0 ? (s.price * (1 - s.costRate)) / s.hoursPerUnit : null);
  const floorPerHour = (p) => (p.targetMonthly > 0 && p.hoursAvailable > 0 ? p.targetMonthly / p.hoursAvailable : null);

  /* x軸の文字がぶつからない labelWidth を、いまの幅から逆算する。
     Kit.chart は every = ceil(n / floor(plotW / labelWidth)) ごとに描き、折れ線は最後の月も必ず描く。
     折れ線：最初（左寄せ）と最後（右寄せ）は幅の1.5倍の間が要る。最後のひとつ手前とも重ならない every を選ぶ */
  let measureCtx = null;
  function textW(s) {
    if (!measureCtx) measureCtx = document.createElement('canvas').getContext('2d');
    measureCtx.font = '11px ' + (getComputedStyle(document.body).fontFamily || 'sans-serif');
    return measureCtx.measureText(s).width;
  }
  function axisWidth(el, labels, line) {
    const W = Math.max(260, el.clientWidth || 600);
    const plotW = W - 48 - (line ? 14 : 10);
    const n = labels.length, w = Math.max(10, ...labels.map(textW)) + 2;
    if (!line) return w + 8;
    const step = plotW / Math.max(1, n - 1);
    for (let e = 1; e <= n; e++) {
      const kMin = Math.ceil(n / e), kMax = e === 1 ? Infinity : Math.ceil(n / (e - 1)) - 1;
      if (kMin > kMax || e * step < 1.5 * w + 4) continue;
      const d = (n - 1) % e;
      if (d && d * step < 1.5 * w + 4) continue;
      return plotW / (kMin + 0.5);
    }
    return plotW;
  }

  // 凡例・表では、名前の最後の（かっこ書き）を省く
  const shortName = (s) => { const nm = s.name || '（名前なし）'; const t = nm.replace(/\s*[（(][^（()）]*[)）]\s*$/, ''); return t.length >= 2 ? t : nm; };
  // グラフ用：9本以上は8本目以降を「その他」にまとめる（色は商品の並び順で固定）
  function streamGroups(streams) {
    const n = streams.length;
    if (n <= 8) return streams.map((s, i) => ({ name: shortName(s), ids: [s.id], color: colorOf(i, n) }));
    return streams.slice(0, 7).map((s, i) => ({ name: shortName(s), ids: [s.id], color: colorOf(i, n) }))
      .concat([{ name: 'その他（' + (n - 7) + '件）', ids: streams.slice(7).map((s) => s.id), color: 'var(--series-8)' }]);
  }
  const chartLabels = (res) => res.months.map((m) => (res.months.length > 12 ? m.ym.slice(0, 4) + '/' + ymMonth(m.ym) : m.label));

  /* ───────── 文章（あなたの計画を文章にする） ───────── */
  function streamLine(s, p) {
    const k = KINDS[s.kind];
    const parts = [];
    if (s.kind === 'subscription') parts.push('月額 ' + Kit.yen(s.price) + '。毎月 ' + fmtU(s.volume) + '人が入会し、' + pctS(s.churn) + 'がやめる');
    else parts.push((s.kind === 'royalty' ? '定価 ' : s.kind === 'session' ? '1回 ' : s.kind === 'project' ? '1件 ' : '') + Kit.yen(s.price) + '。月 ' + fmtU(s.volume) + k.unit + 'から');
    if (s.growth) parts.push('毎月 ' + pctS(s.growth) + (s.growth > 0 ? 'ずつふやす' : 'ずつへる'));
    if (uses(s, 'capacity') && s.capacity > 0) parts.push((s.kind === 'subscription' ? '定員 ' : '上限 月') + fmtU(s.capacity) + k.unit);
    if (uses(s, 'hoursPerUnit') && s.hoursPerUnit > 0) parts.push((s.kind === 'subscription' ? '1人 月' : '1' + k.unit + ' ') + fmtH(s.hoursPerUnit));
    if (s.costRate) parts.push((s.kind === 'royalty' ? 'ストアの取り分 ' : '手数料・原価 ') + pctS(s.costRate));
    if (s.startOffset) parts.push(ymLong(ymAdd(p.startMonth, s.startOffset)) + 'から');
    return parts.join('、');
  }
  function planText(p, scId) {
    const res = project(p, scId), t = res.totals, sc = scenarioOf(scId), last = res.months[res.months.length - 1];
    const mm = m12(res), y1 = t.year1;
    const L = [];
    L.push('# ' + (p.title || 'マネタイズ計画'), '');
    L.push('- 期間：' + ymLong(p.startMonth) + '〜' + ymLong(last.ym) + '（' + p.months + 'か月）');
    L.push('- 見通し：' + sc.label + 'シナリオ');
    L.push('- 作成：' + Kit.fmtDate(Kit.today(), 'YYYY年M月D日'), '');
    L.push('## まとめ');
    let s1 = '12か月目の月商は ' + Kit.yen(mm.revenue) + ' の見込みです';
    if (p.targetMonthly) s1 += '（目標 ' + Kit.yen(p.targetMonthly) + (mm.revenue >= p.targetMonthly ? ' に届く）' : ' の ' + Math.round((mm.revenue / p.targetMonthly) * 100) + '%）');
    L.push(s1 + '。');
    L.push('1年間の売上は ' + Kit.yen(y1.revenue) + '、利益は ' + Kit.yen(y1.profit) + '（初期費用を引く前）です。');
    if (p.months > 12 && t.year2) L.push('2年目は、売上 ' + Kit.yen(t.year2.revenue) + '、利益 ' + Kit.yen(t.year2.profit) + ' の見込みです。');
    if (t.initial > 0) L.push(t.breakEvenMonth >= 0 ? '初期費用 ' + Kit.yen(t.initial) + ' は、' + beText(res) + 'に取り戻せる見込みです。' : '初期費用 ' + Kit.yen(t.initial) + ' は、この期間では取り戻せない見込みです。');
    if (p.hoursAvailable > 0) {
      const over = t.peakHours - p.hoursAvailable;
      L.push('作業時間がいちばん多い月は ' + fmtH(t.peakHours) + 'で、' + (over > 0 ? '使える時間（' + fmtH(p.hoursAvailable) + '）を ' + fmtH(over) + 'こえます。' : '使える時間（' + fmtH(p.hoursAvailable) + '）の内におさまります。'));
    } else L.push('作業時間がいちばん多い月は ' + fmtH(t.peakHours) + 'です。');
    L.push('', '## 収入の柱');
    p.streams.forEach((s, i) => {
      L.push((i + 1) + '. ' + (s.name || '（名前なし）') + '（' + KINDS[s.kind].label + '）');
      L.push('   ' + streamLine(s, p) + '。');
      L.push('   12か月目：月 ' + Kit.yen(mm.byStream[s.id]) + '（' + fmtU(mm.units[s.id]) + unitOf(s) + '）／1年：' + Kit.yen(res.months.slice(0, 12).reduce((a, x) => a + x.byStream[s.id], 0)));
      if (s.note) L.push('   メモ：' + s.note);
    });
    if (!p.streams.length) L.push('（まだありません）');
    L.push('', '## 費用');
    L.push('- 毎月の固定費：合計 ' + Kit.yen(t.fixedMonthly) + (p.fixedCosts.length ? '（' + p.fixedCosts.map((x) => (x.name || '名前なし') + ' ' + Kit.yen(x.monthly)).join('、') + '）' : ''));
    L.push('- 初期費用：合計 ' + Kit.yen(t.initial) + (p.initialCosts.length ? '（' + p.initialCosts.map((x) => (x.name || '名前なし') + ' ' + Kit.yen(x.amount)).join('、') + '）' : ''));
    L.push('', '## 月ごとの見通し（' + sc.label + '）');
    L.push('| 月 | 売上 | 費用 | 利益 | 累積の利益 | 作業時間 |', '|---|---:|---:|---:|---:|---:|');
    for (const m of res.months) L.push('| ' + ymLong(m.ym) + ' | ' + Kit.yen(m.revenue) + ' | ' + Kit.yen(m.cost) + ' | ' + Kit.yen(m.profit) + ' | ' + Kit.yen(m.cumulative) + ' | ' + fmtH(m.hours) + ' |');
    L.push('', '## シナリオで比べる');
    L.push('| シナリオ | 12か月目の月商 | 1年の売上 | 1年の利益 | 初期費用を取り戻す月 | 作業のピーク |', '|---|---:|---:|---:|---|---:|');
    for (const x of SCENARIOS) {
      const r = project(p, x.id);
      L.push('| ' + x.label + ' | ' + Kit.yen(m12(r).revenue) + ' | ' + Kit.yen(r.totals.year1.revenue) + ' | ' + Kit.yen(r.totals.year1.profit) + ' | ' + (beText(r) || '期間内はまだ') + ' | ' + fmtH(r.totals.peakHours) + ' |');
    }
    if (p.targetMonthly && p.streams.length) {
      const mix = mixFor(p, res);
      if (mix.length) {
        L.push('', '## 目標から逆算（月商 ' + Kit.yen(p.targetMonthly) + '）', 'いまの売上の割合で分けると：');
        for (const x of mix) L.push('- ' + (x.s.name || '（名前なし）') + '：月 ' + fmtU(x.need) + unitOf(x.s) + '（' + Kit.yen(x.rev) + '・' + Math.round(x.share * 100) + '%）' + (x.hours ? '　作業 ' + fmtH(x.hours) : ''));
        L.push('合計の作業時間：' + fmtH(mix.reduce((a, x) => a + x.hours, 0)) + (p.hoursAvailable ? '（使える時間 ' + fmtH(p.hoursAvailable) + '）' : ''));
      }
    }
    if (p.notes) L.push('', '## メモ', p.notes);
    L.push('', '※ 数字は、入力した仮定から計算した見込みです。');
    return L.join('\n');
  }

  // 目標の月商を「いまの割合」で分けたときの、商品ごとの必要数
  function mixFor(p, res) {
    const mm = m12(res);
    const T = p.targetMonthly;
    let list = p.streams.filter((s) => s.price > 0).map((s) => ({ s, cur: mm.byStream[s.id] || 0 }));
    const tot = list.reduce((a, x) => a + x.cur, 0);
    if (!list.length) return [];
    list = list.map((x) => ({ s: x.s, share: tot > 0 ? x.cur / tot : 1 / list.length })).filter((x) => x.share > 0);
    return list.map((x) => {
      const rev = T * x.share, need = rev / x.s.price;
      return { s: x.s, share: x.share, rev, need, cur: mm.units[x.s.id] || 0, hours: uses(x.s, 'hoursPerUnit') ? need * x.s.hoursPerUnit : 0 };
    }).sort((a, b) => b.share - a.share);
  }

  /* ───────── 画面 ───────── */
  Kit.app({
    id: 'money', title: 'マネタイズ計画', group: 'earn', icon: 'yen', order: 30,
    desc: '売上のしくみを組み立てて、12か月を試算する',
    docs: ['plan'],
    async mount(root) {
      let plan = normalize(await Kit.store.get('plan', { sample: SAMPLE_PLAN, blank: blankPlan() }));
      let scenario = Kit.pref.get('money.scenario', 'base');
      if (!SCENARIOS.some((x) => x.id === scenario)) scenario = 'base';
      let tab = Kit.pref.get('money.tab', 'sim');
      if (!['sim', 'text', 'doc'].includes(tab)) tab = 'sim';
      let els = {};
      let selfWrites = 0, busy = false, alive = true, chartW = 0;
      const openSet = new Set(); // 「くわしい設定」を開いている柱
      const offs = [];
      // 幅が変わったらグラフだけ描き直す（x軸の文字の間引きを幅に合わせる）
      const ro = window.ResizeObserver ? new ResizeObserver(Kit.debounce(() => {
        if (!alive || tab !== 'sim' || !els.charts || !els.charts.isConnected) return;
        const w = els.charts.clientWidth;
        if (w && Math.abs(w - chartW) > 8) { const res = project(plan, scenario); renderCharts(res, SCENARIOS.map((x) => ({ sc: x, res: x.id === scenario ? res : project(plan, x.id) }))); }
      }, 150)) : null;

      const sampleSlot = h('div');
      const panel = h('div', { class: 'mo-panel', role: 'tabpanel' });
      const tabsEl = h('div', { class: 'tabs mo-tabs', role: 'tablist', 'aria-label': '表示の切り替え' });
      const TABS = [{ id: 'sim', label: '試算する' }, { id: 'text', label: '文章にする' }, { id: 'doc', label: '計画書の例' }];
      for (const t of TABS) {
        tabsEl.append(h('button', { type: 'button', role: 'tab', id: 'mo-tab-' + t.id, 'aria-selected': String(t.id === tab), tabindex: t.id === tab ? '0' : '-1', onclick: () => setTab(t.id) }, t.label));
      }
      // 矢印キーでタブを移る
      tabsEl.addEventListener('keydown', (e) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
        const ids = TABS.map((t) => t.id);
        let i = ids.indexOf(tab);
        i = e.key === 'Home' ? 0 : e.key === 'End' ? ids.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : -1) + ids.length) % ids.length;
        e.preventDefault();
        setTab(ids[i]);
        document.getElementById('mo-tab-' + ids[i]).focus();
      });
      root.append(
        Kit.appHead({ title: 'マネタイズ計画', desc: '収入の柱を組み立てて、毎月の売上・利益・作業時間を試算します。目標から逆算したり、計画書の例を読んだりもできます。', actions: [Kit.btn('ひな形から始める', openPresets, { icon: 'layers' })] }),
        sampleSlot, tabsEl, panel);

      function setTab(id) {
        tab = id;
        Kit.pref.set('money.tab', id);
        for (const b of tabsEl.children) { b.setAttribute('aria-selected', String(b.id === 'mo-tab-' + id)); b.tabIndex = b.id === 'mo-tab-' + id ? 0 : -1; }
        renderPanel();
      }
      function renderSampleBar() {
        Kit.clear(sampleSlot);
        if (!plan._sample) return;
        sampleSlot.append(Kit.sampleBar('これは例（ひらめき数学舎）です。数字を書きかえると、自分の計画として保存されます。', async () => {
          const ok = await Kit.confirm({ title: 'サンプルを片付けますか', body: 'すべてのツールのサンプル（ひらめき数学舎の例）を消して、空の状態から始めます。自分で入力した内容は残ります。', ok: '片付ける' });
          if (!ok) return;
          busy = true;
          try { await Kit.store.samplesOff(); } finally { busy = false; }
          plan = normalize(await Kit.store.get('plan', { sample: SAMPLE_PLAN, blank: blankPlan() }));
          renderAll();
          Kit.toast('サンプルを片付けました');
        }));
      }
      function renderAll() { renderSampleBar(); renderPanel(); }
      function renderPanel() {
        refresh.cancel();
        els = {};
        Kit.clear(panel);
        panel.setAttribute('aria-labelledby', 'mo-tab-' + tab);
        if (tab === 'sim') renderSim();
        else if (tab === 'text') renderText();
        else renderDoc();
      }

      // 保存（書きこみは Kit.store がまとめてくれる）。グラフは 250ms 待ってから描き直す
      const refresh = Kit.debounce(() => { if (alive && tab === 'sim') refreshResults(); }, 250);
      function save() { selfWrites++; Kit.store.set('plan', plan); }
      function touch(o = {}) {
        if (plan._sample) {
          delete plan._sample;
          renderSampleBar();
          const chip = panel.querySelector('.mo-name .chip.sample');
          if (chip) chip.remove();
        }
        save();
        if (o.now) { refresh.cancel(); refreshResults(); } else refresh();
      }
      offs.push(Kit.store.on('doc:plan', () => {
        if (selfWrites > 0) { selfWrites--; return; }
        if (busy) return;
        Kit.toast('ほかの画面で計画が変わりました', { action: { label: '読み込み直す', onClick: async () => { plan = normalize(await Kit.store.get('plan', { sample: SAMPLE_PLAN, blank: blankPlan() })); renderAll(); } } });
      }));

      /* ── 試算する ── */
      function renderSim() {
        els.title = h('h2', null, plan.title || '名前のない計画');
        const scSeg = Kit.seg(SCENARIOS.map((x) => ({ value: x.id, label: x.label })), scenario, (v) => setScenario(v), { label: 'シナリオ' });
        const mSeg = Kit.seg([{ value: 12, label: '12か月' }, { value: 24, label: '24か月' }], plan.months, (v) => {
          plan.months = v;
          renderStreams();
          touch({ now: true });
        }, { label: '期間' });
        els.scSeg = scSeg;
        panel.append(h('div', { class: 'mo-bar' },
          h('div', { class: 'mo-name' }, els.title, plan._sample ? sampleChip() : null),
          h('div', { class: 'mo-filters' }, h('span', { class: 'mo-fgroup' }, h('span', { class: 'mo-flabel' }, 'シナリオ'), scSeg), h('span', { class: 'mo-fgroup' }, h('span', { class: 'mo-flabel' }, '期間'), mSeg))));
        els.kpis = h('div', { class: 'mo-kpis' });
        els.warn = h('div');
        els.charts = h('div', { class: 'mo-charts stack' });
        els.streams = h('div', { class: 'stack' });
        const editor = h('div', { class: 'mo-editor stack' },
          settingsCard(),
          h('div', { class: 'mo-sec-h' }, h('h3', null, '収入の柱'), h('span', { class: 'spacer' }), Kit.btn('収入の柱を足す', openAddStream, { sm: true, icon: 'plus' })),
          h('p', { class: 'mo-cardnote', style: { margin: '0' } }, '売っているもの・売りたいものを、種類ごとに入れます。上の柱ほどグラフの下に積まれます。'),
          els.streams,
          costCard('fixedCosts'), costCard('initialCosts'));
        els.back = h('div', { class: 'stack' });
        els.table = h('div', { class: 'tbl-wrap mo-tblwrap' });
        const details = h('div', { class: 'mo-details stack' }, backCard(), h('section', { class: 'card' },
          h('div', { class: 'card-h' }, h('h3', null, '月ごとの見通し'), h('span', { class: 'spacer' }), Kit.btn('CSVで保存', exportCsv, { sm: true, icon: 'download' })),
          h('p', { class: 'mo-cardnote' }, '表は横にスクロールできます。CSV には商品ごとの数と作業時間も入ります。'),
          els.table));
        panel.append(els.kpis, els.warn, h('div', { class: 'mo-layout' }, editor, els.charts, details));
        renderStreams();
        refreshResults();
        if (ro) { ro.disconnect(); ro.observe(els.charts); }
      }
      function setScenario(v) {
        scenario = v;
        Kit.pref.set('money.scenario', v);
        if (els.scSeg) els.scSeg.setValue(v);
        refresh.cancel();
        refreshResults();
      }

      // 設定
      function settingsCard() {
        const title = h('input', { type: 'text', id: 'mo-title', value: plan.title, placeholder: '例：ひらめき数学舎のマネタイズ計画' });
        title.addEventListener('input', () => { plan.title = title.value; if (els.title) els.title.textContent = plan.title || '名前のない計画'; touch(); });
        const start = h('input', { type: 'month', id: 'mo-start', value: plan.startMonth });
        start.addEventListener('change', () => {
          if (!okYm(start.value)) { start.value = plan.startMonth; return; }
          plan.startMonth = start.value;
          renderStreams();
          touch({ now: true });
        });
        const hours = numIn('mo-hours', plan.hoursAvailable, { min: 0, max: 744 }, (v) => { plan.hoursAvailable = clamp(v, 0, 744); touch(); });
        const notes = h('textarea', { id: 'mo-notes', rows: 2, placeholder: '前提や、見直す時期など' });
        notes.value = plan.notes;
        notes.addEventListener('input', () => { plan.notes = notes.value; touch(); });
        return h('section', { class: 'card' },
          h('div', { class: 'card-h' }, h('h3', null, '計画の設定')),
          h('div', { class: 'stack' },
            Kit.field({ label: '計画の名前', input: title }),
            h('div', { class: 'mo-fields' },
              Kit.field({ label: '始める月', input: start }),
              Kit.field({ label: '使える時間（1か月）', input: hours, hint: '週10時間なら40時間' })),
            Kit.field({ label: 'メモ', input: notes })));
      }

      // 数の入力欄。打つたびに onval(数)。欄から離れたら範囲内に直して表示
      function numIn(id, value, o, onval) {
        const show = (v) => (o.blankZero && !v ? '' : inVal(v));
        const inp = h('input', { type: 'number', id, inputmode: 'decimal', step: o.step || 'any', min: o.min != null ? String(o.min) : null, max: o.max != null ? String(o.max) : null, value: show(value), placeholder: o.placeholder || null });
        inp.addEventListener('input', () => { const v = inp.value === '' ? 0 : Number(inp.value); if (Number.isFinite(v)) onval(v); });
        inp.addEventListener('change', () => { if (o.reshow) inp.value = show(o.reshow()); });
        return inp;
      }

      // 収入の柱
      function renderStreams() {
        if (!els.streams) return;
        Kit.clear(els.streams);
        if (!plan.streams.length) {
          els.streams.append(Kit.empty({ title: '収入の柱がまだありません', body: '教材・レッスン・月額など、売上になるものを1つずつ足します。', actions: [Kit.btn('収入の柱を足す', openAddStream, { kind: 'primary', icon: 'plus' }), Kit.btn('ひな形から始める', openPresets, { icon: 'layers' })] }));
          return;
        }
        plan.streams.forEach((s, i) => els.streams.append(streamCard(s, i)));
      }
      // 1本の柱：よく触る3つの欄を上に、残りは「くわしい設定」に
      const KEY_FIELDS = { once: ['price', 'volume', 'growth'], session: ['price', 'volume', 'capacity'], subscription: ['price', 'volume', 'churn'], project: ['price', 'volume', 'hoursPerUnit'], royalty: ['price', 'volume', 'costRate'] };
      const SHORT = { growth: '伸び', churn: '解約', capacity: '上限', costRate: '手数料', hoursPerUnit: '作業時間' };
      function streamCard(s, i) {
        const n = plan.streams.length;
        const k = KINDS[s.kind];
        const id = (f) => 'mo-' + s.id + '-' + f;
        const name = h('input', { type: 'text', id: id('name'), class: 'mo-sname', value: s.name, placeholder: '商品・サービスの名前', 'aria-label': '商品・サービスの名前' });
        name.addEventListener('input', () => { s.name = name.value; card.setAttribute('aria-label', s.name || '収入の柱'); touch(); });
        const kind = h('select', { id: id('kind') }, KIND_IDS.map((kk) => h('option', { value: kk, selected: kk === s.kind }, KINDS[kk].label + '（' + KINDS[kk].ex + '）')));
        kind.addEventListener('change', () => {
          s.kind = kind.value;
          openSet.add(s.id);
          const fresh = streamCard(s, plan.streams.indexOf(s));
          card.replaceWith(fresh);
          const f = fresh.querySelector('#' + CSS.escape(id('kind')));
          if (f) f.focus();
          touch({ now: true });
        });
        const pctIn = (key, min, max) => numIn(id(key), s[key] * 100, { min, max, reshow: () => s[key] * 100 }, (v) => { s[key] = clamp(v / 100, min / 100, max / 100); touch(); });
        const valIn = (key, max) => numIn(id(key), s[key], { min: 0, max, reshow: () => s[key] }, (v) => { s[key] = clamp(v, 0, max); touch(); });
        const startSel = h('select', { id: id('startOffset') });
        const total = Math.max(plan.months, s.startOffset + 1);
        for (let m = 0; m < total; m++) startSel.append(h('option', { value: String(m), selected: m === s.startOffset }, (m + 1) + 'か月目（' + ymLong(ymAdd(plan.startMonth, m)) + '）'));
        startSel.addEventListener('change', () => { s.startOffset = +startSel.value; touch({ now: true }); });
        const note = h('input', { type: 'text', id: id('note'), value: s.note, placeholder: '前提・根拠など' });
        note.addEventListener('input', () => { s.note = note.value; touch(); });
        const label = (key, def) => (k.f && k.f[key]) || def;
        // hint は「くわしい設定」の中だけ（上の3つは高さをそろえる）
        const F = {
          price: () => Kit.field({ label: label('price', '価格（円）'), input: valIn('price', 1e9) }),
          volume: (hint) => Kit.field({ label: label('volume', '月の数'), input: valIn('volume', 1e6), hint: hint && s.kind === 'project' ? '0.5なら2か月に1件' : null }),
          growth: (hint) => Kit.field({ label: '毎月の伸び（%）', input: pctIn('growth', -99, 300), hint: hint ? (s.kind === 'subscription' ? '新規入会が前の月より何%ふえるか' : '前の月より何%ふえるか') : null }),
          churn: (hint) => Kit.field({ label: '毎月の解約（%）', input: pctIn('churn', 0, 100), hint: hint ? '会員のうち、毎月やめる人の割合' : null }),
          capacity: (hint) => Kit.field({ label: label('capacity', '月の上限'), input: valIn('capacity', 1e6), hint: hint ? 'ここで頭打ちになります' : null }),
          costRate: (hint) => Kit.field({ label: label('costRate', '手数料・原価（%）'), input: pctIn('costRate', 0, 100), hint: hint ? (s.kind === 'royalty' ? '売上から差し引かれる分' : '決済手数料・材料費など') : null }),
          hoursPerUnit: (hint) => Kit.field({ label: label('hoursPerUnit', '1件の作業（時間）'), input: valIn('hoursPerUnit', 1000), hint: hint ? '準備・連絡・移動も入れて。0.5なら30分' : null }),
        };
        const keys = KEY_FIELDS[s.kind];
        const rest = k.show.filter((key) => !keys.includes(key) && key !== 'startOffset');
        const more = h('details', { class: 'mo-more', open: openSet.has(s.id) },
          h('summary', null, h('span', null, 'くわしい設定'), h('span', { class: 'mo-more-s' }, ['種類'].concat(rest.map((key) => SHORT[key] || key), ['始める月', 'メモ']).join('・'))),
          h('div', { class: 'mo-fields' },
            Kit.field({ label: '種類', input: kind, hint: k.hint, class: 'mo-full' }),
            rest.map((key) => F[key](true)),
            Kit.field({ label: '始める月', input: startSel, class: 'mo-full' }),
            Kit.field({ label: 'メモ', input: note, class: 'mo-full' })));
        more.addEventListener('toggle', () => { if (more.open) openSet.add(s.id); else openSet.delete(s.id); });
        const sum = h('div', { class: 'mo-ssum', dataset: { id: s.id } });
        const up = Kit.btn('', () => moveStream(s, -1), { icon: 'arrowUp', sm: true, kind: 'ghost', title: '上へ', disabled: i === 0 });
        const down = Kit.btn('', () => moveStream(s, 1), { icon: 'arrowDown', sm: true, kind: 'ghost', title: '下へ', disabled: i === n - 1 });
        const del = Kit.btn('', () => removeStream(s), { icon: 'trash', sm: true, kind: 'ghost', title: 'この柱を消す' });
        up.dataset.act = 'up'; down.dataset.act = 'down';
        const card = h('section', { class: 'card mo-stream', dataset: { id: s.id }, 'aria-label': s.name || '収入の柱' },
          h('div', { class: 'mo-stream-h' },
            h('i', { class: 'mo-swatch', style: { background: colorOf(i, n) }, 'aria-hidden': 'true' }),
            h('span', { class: 'mo-snum' }, String(i + 1)),
            h('span', { class: 'chip' }, k.label),
            h('span', { class: 'spacer' }), up, down, del),
          name,
          h('div', { class: 'mo-keys' }, keys.map((key) => F[key](false))),
          more,
          n > 8 && i >= 7 ? h('div', { class: 'mo-other' }, 'グラフでは「その他」にまとめて表示します。') : null,
          sum);
        return card;
      }
      function moveStream(s, d) {
        const i = plan.streams.indexOf(s), j = i + d;
        if (j < 0 || j >= plan.streams.length) return;
        plan.streams.splice(i, 1);
        plan.streams.splice(j, 0, s);
        renderStreams();
        const card = els.streams.querySelector('[data-id="' + CSS.escape(s.id) + '"]');
        const b = card && (card.querySelector('[data-act="' + (d < 0 ? 'up' : 'down') + '"]:not(:disabled)') || card.querySelector('.mo-sname'));
        if (b) b.focus();
        touch({ now: true });
      }
      function removeStream(s) {
        const i = plan.streams.indexOf(s);
        if (i < 0) return;
        plan.streams.splice(i, 1);
        renderStreams();
        touch({ now: true });
        Kit.toast('「' + (s.name || '収入の柱') + '」を消しました', { action: { label: '元に戻す', onClick: () => { if (!alive) return; plan.streams.splice(Math.min(i, plan.streams.length), 0, s); renderStreams(); touch({ now: true }); } } });
      }
      const DEFAULTS = {
        once: { name: '', price: 1500, volume: 10, growth: 0.05, costRate: 0.1 },
        session: { name: '', price: 4000, volume: 4, growth: 0.05, capacity: 16, hoursPerUnit: 1.5, costRate: 0.036 },
        subscription: { name: '', price: 1000, volume: 5, growth: 0.05, churn: 0.06, hoursPerUnit: 0.1, costRate: 0.1 },
        project: { name: '', price: 30000, volume: 0.5, growth: 0.03, capacity: 2, hoursPerUnit: 8, costRate: 0.05 },
        royalty: { name: '', price: 500, volume: 10, growth: 0.02, costRate: 0.3 },
      };
      function openAddStream() {
        const list = h('div', { class: 'mo-kindlist' });
        const m = Kit.modal({ title: 'どんな収入を足しますか', body: h('div', { class: 'stack' }, h('p', { class: 'small ink-2' }, 'あとから種類も数字も変えられます。'), list), actions: [{ label: 'やめる', kind: 'ghost' }] });
        for (const kk of KIND_IDS) {
          list.append(h('button', { type: 'button', onclick: () => {
            m.close();
            const s = normStream(Object.assign({ kind: kk }, DEFAULTS[kk], { id: Kit.uid('st') }));
            plan.streams.push(s);
            openSet.add(s.id);
            if (tab !== 'sim') setTab('sim'); else renderStreams();
            touch({ now: true });
            const inp = document.getElementById('mo-' + s.id + '-name');
            if (inp) { inp.focus(); inp.scrollIntoView({ block: 'center' }); }
          } }, h('b', null, KINDS[kk].label + '（' + KINDS[kk].ex + '）'), h('span', null, KINDS[kk].hint)));
        }
      }

      // 固定費・初期費用
      function costCard(key) {
        const fixed = key === 'fixedCosts';
        const vk = fixed ? 'monthly' : 'amount';
        const rows = h('div', { class: 'mo-rows' });
        const totalB = h('b');
        const showTotal = () => { totalB.textContent = (fixed ? '月 ' : '') + Kit.yen(plan[key].reduce((a, x) => a + x[vk], 0)); };
        const draw = () => {
          Kit.clear(rows);
          if (!plan[key].length) rows.append(h('p', { class: 'small muted' }, fixed ? 'まだありません。家賃・ツールの月額・通信費など。' : 'まだありません。機材・内装・ホームページの準備など。'));
          plan[key].forEach((x, i) => {
            const nm = h('input', { type: 'text', id: 'mo-' + key + '-' + i + '-name', value: x.name, placeholder: fixed ? '例：Zoom（有料プラン）' : '例：パソコン・機材', 'aria-label': '費用の名前' });
            nm.addEventListener('input', () => { x.name = nm.value; touch(); });
            const am = numIn('mo-' + key + '-' + i + '-v', x[vk], { min: 0, reshow: () => x[vk] }, (v) => { x[vk] = Math.max(0, v); showTotal(); touch(); });
            am.setAttribute('aria-label', fixed ? '毎月の金額（円）' : '金額（円）');
            const del = Kit.btn('', () => { plan[key].splice(plan[key].indexOf(x), 1); draw(); showTotal(); touch({ now: true }); }, { icon: 'trash', sm: true, kind: 'ghost', title: 'この費用を消す' });
            rows.append(h('div', { class: 'mo-row' }, nm, am, del));
          });
        };
        draw(); showTotal();
        const add = Kit.btn(fixed ? '固定費を足す' : '初期費用を足す', () => {
          plan[key].push(fixed ? { name: '', monthly: 0 } : { name: '', amount: 0 });
          draw(); showTotal(); touch({ now: true });
          const inp = document.getElementById('mo-' + key + '-' + (plan[key].length - 1) + '-name');
          if (inp) inp.focus();
        }, { sm: true, icon: 'plus', class: 'mo-addrow' });
        return h('section', { class: 'card' },
          h('div', { class: 'card-h' }, h('h3', null, fixed ? '毎月の固定費' : '初期費用')),
          h('p', { class: 'mo-cardnote' }, fixed ? '売れても売れなくても、毎月かかるお金。' : '始めるときに1回だけかかるお金。累積の利益はここから始まります。'),
          rows, add, h('div', { class: 'mo-total' }, h('span', null, '合計'), totalB));
      }

      // 目標から逆算
      function backCard() {
        const inp = numIn('mo-target', plan.targetMonthly, { min: 0, step: 1000, blankZero: true, placeholder: '例：150000', reshow: () => plan.targetMonthly }, (v) => { plan.targetMonthly = Math.max(0, v); touch(); });
        return h('section', { class: 'card' },
          h('div', { class: 'card-h' }, h('h3', null, '目標から逆算')),
          h('div', { class: 'stack' },
            h('p', { class: 'small ink-2' }, '目標の月商から、何をどれだけ売ればよいかを逆に計算します。'),
            Kit.field({ label: '目標の月商（円）', input: inp }),
            els.back));
      }

      /* 結果（KPI・グラフ・逆算・表）をまとめて描き直す */
      function refreshResults() {
        if (!els.kpis) return;
        const res = project(plan, scenario);
        const all = SCENARIOS.map((x) => ({ sc: x, res: x.id === scenario ? res : project(plan, x.id) }));
        renderKpis(res);
        renderCharts(res, all);
        renderBack(res);
        renderTable(res);
        renderStreamSums(res);
      }

      function renderKpis(res) {
        Kit.clear(els.kpis); Kit.clear(els.warn);
        const t = res.totals, mm = m12(res), y1 = t.year1;
        if (!plan.streams.length) { els.kpis.hidden = true; return; }
        els.kpis.hidden = false;
        const kpi = (label, value, sub, extra, cls, full) => h('div', { class: 'kpi mo-kpi' + (cls ? ' ' + cls : '') },
          h('div', { class: 'kpi-label' }, label), h('div', { class: 'kpi-value', title: full || null }, value), sub ? h('div', { class: 'kpi-sub' }, sub) : null, extra);
        // 12か月目の月商
        const T = plan.targetMonthly;
        let tExtra = null, tSub = ymLong(mm.ym) + '・' + Kit.yen(mm.revenue);
        if (T > 0) {
          const r = mm.revenue / T;
          tExtra = h('div', null, h('div', { class: 'meter' + (r >= 1 ? ' ok' : ''), role: 'img', 'aria-label': '目標の' + Math.round(r * 100) + '%' }, h('i', { style: { width: Math.min(100, r * 100) + '%' } })),
            h('div', { class: 'kpi-sub' }, r >= 1 ? '目標 ' + Kit.yenShort(T) + ' に届く見込み' : '目標 ' + Kit.yenShort(T) + ' の ' + Math.round(r * 100) + '%'));
        }
        const label12 = res.months.length >= 12 ? '12か月目の月商' : res.months.length + 'か月目の月商';
        els.kpis.append(kpi(label12, Kit.yenShort(mm.revenue), tSub, tExtra, null, Kit.yen(mm.revenue)));
        // 年間の売上・利益
        const yLabel = plan.months > 12 ? '1年目の' : '年間の';
        els.kpis.append(kpi(yLabel + '売上', Kit.yenShort(y1.revenue), plan.months > 12 && t.year2 ? '2年目 ' + Kit.yenShort(t.year2.revenue) : '月平均 ' + Kit.yenShort(y1.revenue / 12), null, null, Kit.yen(y1.revenue)));
        const cum12 = res.months[Math.min(11, res.months.length - 1)].cumulative;
        els.kpis.append(kpi(yLabel + '利益', Kit.yenShort(y1.profit), t.initial > 0 ? '初期費用を引くと ' + Kit.yenShort(cum12) : '売上から手数料・原価と固定費を引いた額', null, null, Kit.yen(y1.profit)));
        // 損益分岐
        const be = t.breakEvenMonth;
        const pm = t.profitableMonth;
        const beSub = [];
        if (be >= 0) beSub.push((be + 1) + 'か月目。' + (t.initial > 0 ? '初期費用 ' + Kit.yenShort(t.initial) + ' を取り戻す月' : '累積の利益がプラスになる月'));
        else beSub.push(res.months.length + 'か月では、初期費用 ' + Kit.yenShort(t.initial) + ' を取り戻せない見込み');
        if (pm >= 0 && pm !== be) beSub.push('月ごとの黒字は' + (pm + 1) + 'か月目から');
        els.kpis.append(kpi('黒字になる月（損益分岐）', be >= 0 ? ymLong(res.months[be].ym) : '期間内はまだ', beSub.join('。'), be < 0 ? h('span', { class: 'chip warn' }, '期間をのばすか、費用を見直す') : null));
        // 作業時間
        const A = plan.hoursAvailable, P = t.peakHours, over = A > 0 ? r1(P - A) : 0;
        let hExtra;
        if (A > 0) {
          hExtra = h('div', null,
            h('div', { class: 'meter' + (over > 0 ? ' warn' : ''), role: 'img', 'aria-label': '使える時間の' + Math.round((P / A) * 100) + '%' }, h('i', { style: { width: Math.min(100, (P / A) * 100) + '%' } })),
            over > 0 ? h('span', { class: 'chip warn' }, h('span', { class: 'dot' }), '時間が足りません：' + fmtH(over) + 'オーバー') : h('div', { class: 'kpi-sub' }, '使える時間の ' + Math.round((P / A) * 100) + '%'));
        }
        els.kpis.append(kpi('月の作業時間（ピーク）', fmtH(P), A > 0 ? '使える時間 ' + fmtH(A) + (t.peakMonth >= 0 ? '・いちばん多いのは' + ymLabel(res.months[t.peakMonth].ym) : '') : '使える時間を設定すると比べられます', hExtra, 'mo-kpi-hours'));
        if (A > 0 && over > 0) {
          const pk = res.months[t.peakMonth];
          const heavy = plan.streams.filter((s) => pk.hoursBy[s.id] > 0).sort((a, b) => pk.hoursBy[b.id] - pk.hoursBy[a.id]).slice(0, 3);
          els.warn.append(h('div', { class: 'mo-callout', role: 'note' },
            h('strong', null, '時間を売る商品だけだと、売上には上限があります'),
            h('p', null, ymLong(pk.ym) + 'は作業が ' + fmtH(P) + 'になり、使える時間（' + fmtH(A) + '）を ' + fmtH(over) + 'こえます。' +
              (heavy.length ? '多いのは ' + heavy.map((s) => shortName(s) + ' ' + fmtH(pk.hoursBy[s.id])).join('、') + '。' : '')),
            h('p', null, '数をふやすより、値上げや、教材・月額・印税のように時間を使わない商品を育てることを考えましょう。上限（月の回数・定員）を入れておくと、計算もそこで止まります。')));
        }
      }

      function renderCharts(res, all) {
        const box = els.charts;
        Kit.clear(box);
        if (!plan.streams.length) {
          box.append(Kit.empty({ title: 'まだ収入の柱がありません', body: 'ひな形から始めるか、収入の柱を1つ足すと、ここにグラフが出ます。', actions: [Kit.btn('ひな形から始める', openPresets, { kind: 'primary', icon: 'layers' }), Kit.btn('収入の柱を足す', openAddStream, { icon: 'plus' })] }));
          return;
        }
        const sc = scenarioOf(scenario);
        const labels = chartLabels(res);
        const bars = h('div'), cum = h('div'), cmp = h('div');
        const t = res.totals;
        box.append(
          h('section', { class: 'card' }, h('div', { class: 'card-h' }, h('h3', null, '売上の内訳と費用'), h('span', { class: 'chip line' }, sc.label + 'シナリオ')), bars),
          h('section', { class: 'card' }, h('div', { class: 'card-h' }, h('h3', null, '累積の利益'), h('span', { class: 'chip line' }, sc.label + 'シナリオ')), cum,
            h('p', { class: 'mo-note' }, t.initial > 0
              ? (t.breakEvenMonth >= 0 ? '初期費用 ' + Kit.yen(t.initial) + ' から始まり、' + beText(res) + 'にプラスになる見込みです。' : '初期費用 ' + Kit.yen(t.initial) + ' から始まり、この期間ではプラスになりません。')
              : '初期費用はありません。毎月の利益を積み上げた線です。')),
          h('section', { class: 'card' }, h('div', { class: 'card-h' }, h('h3', null, 'シナリオで比べる'), h('span', { class: 'small muted' }, '累積の利益')), cmp, scSummary(all)));
        const groups = streamGroups(plan.streams);
        chartW = box.clientWidth;
        Kit.chart.bars(bars, {
          labels, stacked: true, height: 240, labelWidth: axisWidth(bars, labels, false), format: Kit.yen, tick: Kit.yenShort, title: '売上の内訳と費用',
          series: groups.map((g) => ({ name: g.name, color: g.color, values: res.months.map((m) => g.ids.reduce((a, id) => a + (m.byStream[id] || 0), 0)) })),
          lines: [{ name: '費用', color: 'var(--ink-2)', values: res.months.map((m) => m.cost) }],
        });
        Kit.chart.line(cum, { labels, area: true, height: 200, labelWidth: axisWidth(cum, labels, true), format: Kit.yen, tick: Kit.yenShort, title: '累積の利益', series: [{ name: '累積の利益', color: 'var(--gosu)', values: res.months.map((m) => m.cumulative) }] });
        Kit.chart.line(cmp, { labels, height: 190, labelWidth: axisWidth(cmp, labels, true), format: Kit.yen, tick: Kit.yenShort, title: 'シナリオで比べる', series: all.map((x) => ({ name: x.sc.label, color: SC_COLORS[x.sc.id], values: x.res.months.map((m) => m.cumulative) })) });
      }
      function scSummary(all) {
        const wrap = h('div', { class: 'mo-scsum', role: 'group', 'aria-label': 'シナリオを選ぶ' });
        for (const x of all) {
          const t = x.res.totals;
          wrap.append(h('button', { type: 'button', 'aria-pressed': String(x.sc.id === scenario), onclick: () => setScenario(x.sc.id) },
            h('span', { class: 'mo-sc-n' }, h('i', { style: { background: SC_COLORS[x.sc.id] } }), x.sc.label),
            h('span', { class: 'mo-sc-v' }, Kit.yenShort(t.cumulative)),
            h('span', { class: 'mo-sc-s' }, t.breakEvenMonth >= 0 ? '黒字 ' + ymLong(x.res.months[t.breakEvenMonth].ym) : '期間内は赤字')));
        }
        return wrap;
      }

      function renderBack(res) {
        const box = els.back;
        if (!box) return;
        Kit.clear(box);
        const T = plan.targetMonthly, A = plan.hoursAvailable;
        if (!plan.streams.length) { box.append(h('p', { class: 'small muted' }, '収入の柱を足すと、ここで逆算できます。')); return; }
        if (!(T > 0)) { box.append(h('p', { class: 'small muted' }, '目標の月商を入れると、必要な数が出ます。')); return; }
        const mm = m12(res);
        // ひとつの商品だけで届かせるなら
        const rows = plan.streams.filter((s) => s.price > 0).map((s) => {
          const need = T / s.price, hrs = uses(s, 'hoursPerUnit') ? need * s.hoursPerUnit : 0;
          const notes = [];
          if (uses(s, 'capacity') && s.capacity > 0 && need > s.capacity) notes.push(h('span', { class: 'chip warn' }, (s.kind === 'subscription' ? '定員' : '上限') + fmtU(s.capacity) + unitOf(s) + 'をこえる'));
          if (A > 0 && hrs > A) notes.push(h('span', { class: 'chip warn' }, '時間が足りない'));
          if (s.kind === 'subscription' && s.churn > 0) notes.push(h('span', { class: 'small muted' }, '入会 月' + fmtU(need * s.churn) + '人で保てる'));
          return h('tr', null, h('td', { title: s.name || null }, shortName(s)), h('td', { class: 'r' }, (s.kind === 'subscription' ? '' : '月') + fmtU(need) + unitOf(s)), h('td', { class: 'r' }, hrs ? fmtH(hrs) : '—'), h('td', null, h('div', { class: 'row', style: { gap: '4px' } }, notes.length ? notes : h('span', { class: 'small muted' }, '—'))));
        });
        box.append(h('div', null, h('div', { class: 'small', style: { fontWeight: 700, marginBottom: '6px' } }, 'ひとつの商品だけで ' + Kit.yen(T) + ' にするなら'),
          h('div', { class: 'tbl-wrap' }, h('table', { class: 'tbl mo-back-t' }, h('thead', null, h('tr', null, h('th', null, '商品'), h('th', { class: 'r' }, '必要な数'), h('th', { class: 'r' }, '作業時間'), h('th', null, '気をつけること'))), h('tbody', null, rows)))));
        // いまの割合で分けるなら
        const mix = mixFor(plan, res);
        if (!mix.length) return;
        const mixH = mix.reduce((a, x) => a + x.hours, 0);
        box.append(h('div', null, h('div', { class: 'small', style: { fontWeight: 700, margin: '4px 0 6px' } }, 'いまの割合（' + ymLabel(mm.ym) + 'の売上）で分けるなら'),
          h('div', { class: 'tbl-wrap' }, h('table', { class: 'tbl mo-back-t' },
            h('thead', null, h('tr', null, h('th', null, '商品'), h('th', { class: 'r' }, '割合'), h('th', { class: 'r' }, '売上'), h('th', { class: 'r' }, '必要な数'), h('th', { class: 'r' }, 'いま'), h('th', { class: 'r' }, '作業時間'))),
            h('tbody', null, mix.map((x) => h('tr', null, h('td', { title: x.s.name || null }, shortName(x.s)), h('td', { class: 'r' }, Math.round(x.share * 100) + '%'), h('td', { class: 'r' }, Kit.yen(x.rev)), h('td', { class: 'r' }, fmtU(x.need) + unitOf(x.s)), h('td', { class: 'r' }, fmtU(x.cur) + unitOf(x.s)), h('td', { class: 'r' }, x.hours ? fmtH(x.hours) : '—'))),
              h('tr', null, h('td', { style: { fontWeight: 700 } }, '合計'), h('td', { class: 'r' }, '100%'), h('td', { class: 'r', style: { fontWeight: 700 } }, Kit.yen(T)), h('td'), h('td'), h('td', { class: 'r', style: { fontWeight: 700 } }, fmtH(mixH))))))));
        // ひとことアドバイス
        let advice;
        const top = mix[0];
        if (A > 0 && mixH > A) {
          advice = 'この配分だと月 ' + fmtH(mixH) + 'かかり、使える時間を ' + fmtH(mixH - A) + 'こえます。' + (mix.some((x) => TIME_FREE.includes(x.s.kind)) ? '時間を使わない商品（単発販売・月額・印税）の割合をふやすか、値上げを考えましょう。' : '時間を使わない商品（教材・月額・印税など）を1つ足すことを考えましょう。');
        } else if (mm.revenue >= T) {
          advice = 'いまの計画の' + ymLabel(mm.ym) + '（' + Kit.yen(mm.revenue) + '）で、もう届く見込みです。次は利益と時間のゆとりを見ておきましょう。';
        } else {
          advice = 'いちばん割合の大きい「' + (top.s.name || '名前なし') + '」を、月 ' + fmtU(top.need) + unitOf(top.s) + 'にするところから考えましょう（いまの計画では ' + fmtU(top.cur) + unitOf(top.s) + '）。';
        }
        box.append(h('p', { class: 'mo-advice' }, advice));
      }

      function renderTable(res) {
        const box = els.table;
        Kit.clear(box);
        if (!plan.streams.length) { box.append(h('p', { class: 'small muted', style: { padding: '12px 14px' } }, '収入の柱を足すと、月ごとの表が出ます。')); return; }
        const ms = res.months, t = res.totals;
        const head = h('tr', null, h('th', { class: 'mo-stick' }, '項目'),
          ms.map((m, i) => h('th', { class: 'r' }, i === 0 || ymMonth(m.ym) === 1 ? h('span', { class: 'mo-yr' }, m.ym.slice(0, 4) + '年') : h('span', { class: 'mo-yr' }, ' '), m.label)),
          h('th', { class: 'r mo-tot' }, h('span', { class: 'mo-yr' }, ' '), ms.length > 12 ? '合計（2年）' : '合計'));
        const row = (label, vals, total, cls, fmt = Kit.yen) => h('tr', { class: cls || null }, h('td', { class: 'mo-stick' }, label), vals.map((v) => h('td', { class: 'r' + (v === 0 ? ' mo-zero' : '') }, fmt(v))), h('td', { class: 'r mo-tot' }, total == null ? '' : fmt(total)));
        const body = h('tbody', null,
          row('売上', ms.map((m) => m.revenue), t.revenue, 'mo-strong'),
          plan.streams.map((s) => row(shortName(s), ms.map((m) => m.byStream[s.id]), t.byStream[s.id], 'mo-sub')),
          row('手数料・原価', ms.map((m) => m.variable), t.variable),
          row('固定費', ms.map((m) => m.fixed), t.fixed),
          row('利益', ms.map((m) => m.profit), t.profit, 'mo-strong'),
          row('累積の利益', ms.map((m) => m.cumulative), null),
          row('作業時間', ms.map((m) => m.hours), null, null, fmtH));
        box.append(h('table', { class: 'tbl mo-proj' }, h('thead', null, head), body));
      }

      function renderStreamSums(res) {
        const mm = m12(res), A = plan.hoursAvailable, floor = floorPerHour(plan);
        for (const s of plan.streams) {
          const el = els.streams && els.streams.querySelector('.mo-ssum[data-id="' + CSS.escape(s.id) + '"]');
          if (!el) continue;
          Kit.clear(el);
          if (s.startOffset >= res.months.length) { el.append(h('span', null, 'この期間には始まりません')); continue; }
          const year = res.months.slice(0, 12).reduce((a, x) => a + x.byStream[s.id], 0);
          el.append(h('span', null, ymLabel(mm.ym) + ' ', h('b', null, Kit.yen(mm.byStream[s.id])), '（' + fmtU(mm.units[s.id]) + unitOf(s) + '）'), h('span', null, '1年 ', h('b', null, Kit.yen(year))));
          if (mm.hoursBy[s.id] > 0) el.append(h('span', null, '作業 ', h('b', null, fmtH(mm.hoursBy[s.id]))));
          const ph = perHour(s);
          if (ph != null) {
            el.append(h('span', null, '1時間あたり ', h('b', null, Kit.yen(ph))));
            if (floor && ph < floor) el.append(h('span', { class: 'chip warn' }, '目標から見た時給 ' + Kit.yen(floor) + ' より低い'));
          }
          if (A > 0 && mm.hoursBy[s.id] > A) el.append(h('span', { class: 'chip warn' }, 'この柱だけで時間が足りません'));
        }
      }

      // CSV（表と同じ並び＋商品ごとの数・作業時間）
      async function exportCsv() {
        const res = project(plan, scenario), ms = res.months, t = res.totals;
        const sc = scenarioOf(scenario);
        const rows = [['項目'].concat(ms.map((m) => m.ym), ['合計'])];
        const add = (label, vals, total) => rows.push([label].concat(vals, [total == null ? '' : total]));
        add('売上', ms.map((m) => m.revenue), t.revenue);
        for (const s of plan.streams) add('売上：' + (s.name || '名前なし'), ms.map((m) => m.byStream[s.id]), t.byStream[s.id]);
        add('手数料・原価', ms.map((m) => m.variable), t.variable);
        add('固定費', ms.map((m) => m.fixed), t.fixed);
        add('費用の合計', ms.map((m) => m.cost), t.cost);
        add('利益', ms.map((m) => m.profit), t.profit);
        add('累積の利益', ms.map((m) => m.cumulative), null);
        add('作業時間（時間）', ms.map((m) => m.hours), r1(ms.reduce((a, m) => a + m.hours, 0)));
        for (const s of plan.streams) add('数：' + (s.name || '名前なし') + '（' + unitOf(s) + '）', ms.map((m) => m.units[s.id]), null);
        for (const s of plan.streams) if (uses(s, 'hoursPerUnit')) add('作業時間：' + (s.name || '名前なし'), ms.map((m) => m.hoursBy[s.id]), null);
        const ok = await Kit.download(Kit.safeName((plan.title || 'マネタイズ計画') + '_' + sc.label) + '.csv', Kit.csv(rows));
        if (ok) Kit.toast('CSVを保存しました');
      }

      /* ── 文章にする ── */
      function renderText() {
        const text = planText(plan, scenario);
        const sc = scenarioOf(scenario);
        const out = h('pre', { class: 'mo-out', tabindex: '0', 'aria-label': '計画の文章' }, text);
        const aiText = h('div', { class: 'mo-ai-text', 'aria-live': 'polite' });
        const aiBox = h('div', { class: 'mo-ai ai-only', hidden: true }, h('div', { class: 'row between' }, h('b', null, 'AIの見立て（参考）'), h('span', { class: 'small muted' }, '価格・時間・リスク')), aiText);
        const aiBtn = Kit.ai.button('AIに計画を見てもらう', async () => {
          aiBox.hidden = false;
          aiText.textContent = '読んでいます…';
          const prompt = (await Kit.ai.context()) + '\n\n次は、ひとりで営む小さな事業のマネタイズ計画（試算）です。\n\n' + planText(plan, scenario) +
            '\n\nこの計画を、相談相手として見てください。「価格」「時間」「リスク」の3つの見出しで、それぞれ2〜3点、短く具体的に書いてください。' +
            '\n・数字の仮定が甘いところ、無理がありそうなところを率直に\n・すぐ試せる小さな打ち手をそれぞれ1つ\n・誇張やはげましの言葉は不要。です・ます調。全体で600字以内。見出しは【価格】のように書く';
          await Kit.ai.ask(prompt, { onText: ({ text: tx }) => { aiText.textContent = tx; } });
        });
        panel.append(h('div', { class: 'stack' },
          h('div', { class: 'mo-bar' }, h('div', { class: 'mo-name' }, h('h2', null, plan.title || '名前のない計画'), plan._sample ? sampleChip() : null),
            h('div', { class: 'mo-filters' }, h('span', { class: 'mo-flabel' }, 'シナリオ'), Kit.seg(SCENARIOS.map((x) => ({ value: x.id, label: x.label })), scenario, (v) => { scenario = v; Kit.pref.set('money.scenario', v); renderPanel(); }, { label: 'シナリオ' }))),
          h('p', { class: 'small ink-2', style: { maxWidth: '64ch' } }, 'いまの計画（' + sc.label + 'シナリオ）を、人に見せられる文章にしました。メモや相談、申請書の下書きにどうぞ。数字を直すと、ここも変わります。'),
          h('div', { class: 'btn-row' },
            Kit.btn('文章をコピー', () => Kit.copy(planText(plan, scenario)), { kind: 'primary', icon: 'copy' }),
            Kit.btn('.md で保存', async () => { const ok = await Kit.download(Kit.safeName(plan.title || 'マネタイズ計画') + '.md', planText(plan, scenario)); if (ok) Kit.toast('保存しました'); }, { icon: 'download' }),
            aiBtn),
          aiBox, out));
      }

      /* ── 計画書の例 ── */
      function renderDoc() {
        const ex = presetPlan('hirameki', Kit.ym());
        const res = { low: project(ex, 'low'), base: project(ex, 'base'), high: project(ex, 'high') };
        const B = res.base, t = B.totals, mm = m12(B);
        const st = (id) => ex.streams.find((s) => s.id === id);
        const L = st('lesson'), tools = st('tools'), club = st('club'), kindle = st('kindle'), course = st('course'), ws = st('ws');
        const startOf = (s) => (s.startOffset + 1) + 'か月目（' + ymLong(ymAdd(ex.startMonth, s.startOffset)) + '）';
        const A = ex.hoursAvailable, T = ex.targetMonthly;
        const floor = T / A;
        const lessonNet = L.price * (1 - L.costRate), lessonPH = lessonNet / L.hoursPerUnit;
        const needPrice = Math.ceil((floor * L.hoursPerUnit) / (1 - L.costRate) / 100) * 100;
        const hi = res.high.totals, lo = res.low.totals;
        const firstHit = B.months.findIndex((m) => m.revenue >= T);
        const timeShare = Math.round((ex.streams.filter((x) => !TIME_FREE.includes(x.kind)).reduce((a, x) => a + mm.byStream[x.id], 0) / (mm.revenue || 1)) * 100);
        const tbl = (head, rows, o = {}) => h('div', { class: 'tbl-wrap' }, h('table', { class: 'tbl' + (o.cls ? ' ' + o.cls : '') },
          h('thead', null, h('tr', null, head.map((x, i) => h('th', { class: o.right && o.right.includes(i) ? 'r' : null }, x)))),
          h('tbody', null, rows.map((r) => h('tr', { class: r.cls || null }, (r.cells || r).map((c, i) => h('td', { class: o.right && o.right.includes(i) ? 'r' : null }, c)))))));
        const dl = (pairs) => h('dl', { class: 'mo-dl' }, pairs.map(([k, v]) => [h('dt', null, k), h('dd', null, v)]));
        const sec = [];
        const H2 = (no, text) => { const el = h('h2', { id: 'mo-sec-' + no }, h('span', { class: 'mo-no' }, no), h('span', null, text)); sec.push({ no, text, el }); return el; };
        const openInSim = () => applyPreset('hirameki');

        const doc = h('article', { class: 'mo-doc' },
          h('div', { class: 'mo-doc-head' }, h('h1', null, 'ひらめき数学舎のマネタイズ計画（例）'), h('span', { class: 'mo-seal', 'aria-hidden': 'true' }, '例')),
          h('p', { class: 'mo-lead' }, '架空の小さなオンライン数学教室「ひらめき数学舎」を例にした計画書です。表の数字は、シミュレーターのひな形「ひらめき数学舎（教材・レッスン）」から、いまこの場で計算しています。考え方の順番をまねして、自分の事業に置きかえてみてください。'),
          h('div', { class: 'mo-meta' },
            h('span', { class: 'chip line' }, '期間 ' + ymLong(ex.startMonth) + '〜' + ymLong(B.months[B.months.length - 1].ym)),
            h('span', { class: 'chip line' }, '目標 月' + Kit.yen(T)),
            h('span', { class: 'chip line' }, '使える時間 月' + fmtH(A) + '（週' + fmtH(A / 4) + 'ほど）')),

          H2('1', 'ねらい（だれの、どんな困りごと）'),
          h('p', null, '数学に苦手意識がある人の多くは、公式を覚えても、なぜそうなるのかが分からないまま先に進んでいます。ひらめき数学舎は、図やゲームで手を動かし、公式を自分で見つける体験を届けます。合言葉は「暗記ではなく発見」です。'),
          tbl(['だれの', 'どんな困りごと'], [
            ['数学に苦手意識がある中高生と保護者', '公式を暗記するだけで、なぜが分からない。家で質問されても、親が説明できない'],
            ['学び直したい大人', '苦手なまま大人になった。いまさら人に聞きにくい'],
            ['ICTを授業に取り入れたい先生', '授業で使える教材を、自分で作る時間がない'],
          ]),
          h('p', null, 'この計画のゴールは、1年後に月の売上 ' + Kit.yen(T) + ' を、月 ' + fmtH(A) + '以内の作業で続けられる形にすることです。大きく稼ぐことより、育児や本業と両立しながら、やめずに続けられることを優先します。'),

          H2('2', '収入の入口を4段で考える'),
          h('p', null, '知らない人から、いきなり高い商品は買われません。無料で知ってもらい、小さく試してもらい、続けてもらう。最後に、自分の時間を使わない収入を育てます。下の段ほど、お客さんとの信頼が必要になります。'),
          h('div', { class: 'mo-stages' },
            h('section', { class: 'mo-stage' }, h('div', { class: 'mo-stage-h' }, h('span', { class: 'mo-step' }, '段階1'), h('b', null, '無料で広げる')), dl([
              ['商品の例', '無料の授業ツール（ブラウザで動く図形アプリ）、SNSでの短い解説、noteの記事、無料体験会'],
              ['価格', '¥0'],
              ['目的', '信頼してもらうことと、メール・LINEに登録してもらうこと。ここでは売上を追わない'],
              ['見る数字', 'メール・LINEの登録 月30人、無料体験会の参加 月10人'],
              ['時期', '1か月目から、ずっと続ける'],
            ])),
            h('section', { class: 'mo-stage' }, h('div', { class: 'mo-stage-h' }, h('span', { class: 'mo-step' }, '段階2'), h('b', null, '小さく売る')), dl([
              ['商品の例', tools.name + '、' + L.name + '、' + course.name],
              ['価格', Kit.yen(tools.price) + '（ツール集）、' + Kit.yen(L.price) + '（レッスン1回）、' + Kit.yen(course.price) + '（講座）'],
              ['目的', '「この人から買ってよかった」という最初の体験をつくる'],
              ['見る数字', '登録者からの購入率 3〜5%、レッスンの継続率'],
              ['時期', 'ツール集とレッスンは1か月目から、講座は' + startOf(course) + 'から'],
            ])),
            h('section', { class: 'mo-stage' }, h('div', { class: 'mo-stage-h' }, h('span', { class: 'mo-step' }, '段階3'), h('b', null, '続く収入')), dl([
              ['商品の例', club.name + '（ツール使い放題と、月1回のオンライン会）'],
              ['価格', '月額 ' + Kit.yen(club.price)],
              ['目的', '毎月の売上の土台をつくる。先の見通しが立つと、気持ちにも余裕ができる'],
              ['見る数字', '会員数と、毎月の解約率（' + pctS(club.churn) + '以下が目安）'],
              ['時期', startOf(club) + 'から。売るツールと、来てくれる人がそろってから'],
            ])),
            h('section', { class: 'mo-stage' }, h('div', { class: 'mo-stage-h' }, h('span', { class: 'mo-step' }, '段階4'), h('b', null, '時間を売らない収入')), dl([
              ['商品の例', kindle.name + '。これから、録画講座（¥9,800）と学校向けのライセンス（1校 年¥30,000）'],
              ['価格', Kit.yen(kindle.price) + '（Kindle本。ストアの取り分 ' + pctS(kindle.costRate) + '）'],
              ['目的', '寝ている間も、子どもと遊んでいる間も届く商品をもつ'],
              ['見る数字', '月の販売数と、1時間あたりの利益'],
              ['時期', startOf(kindle) + 'から。教材と実績がたまってから'],
            ]))),
          h('p', { class: 'mo-cap' }, '録画講座と学校向けライセンスは、まだこの計画の数字に入れていません。' + ws.name + 'は、段階2と3の間で、先生や地域とのつながりをつくる役目です。'),

          H2('3', '価格の考え方'),
          h('h3', null, '松竹梅をそろえる'),
          h('p', null, '選択肢が1つだと、お客さんは「買うか、買わないか」で迷います。3つ並べると「どれにするか」に変わり、真ん中が選ばれやすくなります。いちばん選んでほしいものを、真ん中に置きます。'),
          tbl(['', '内容', '価格'], [
            ['梅', '体験レッスン（30分）', '¥1,000'],
            ['竹', L.name, Kit.yen(L.price)],
            ['松', '月4回パック（60分×4）', Kit.yen(L.price * 4 * 0.9) + '（1回 ' + Kit.yen(L.price * 0.9) + '）'],
          ], { right: [2] }),
          h('h3', null, '時間単価の下限を決める'),
          h('p', null, '時間を売る商品は、1時間あたりいくら残るかで考えます。目標の月商 ' + Kit.yen(T) + ' を、使える時間 ' + fmtH(A) + 'で割ると ' + Kit.yen(floor) + '。これが1時間あたりの下限の目安です。'),
          tbl(['', '金額・時間'], [
            [L.name + 'の料金', Kit.yen(L.price)],
            ['手数料 ' + pctS(L.costRate) + ' を引くと', Kit.yen(lessonNet)],
            ['準備と記録を入れた時間', fmtH(L.hoursPerUnit)],
            { cls: 'mo-strong', cells: ['1時間あたりに残るお金', Kit.yen(lessonPH)] },
          ], { right: [1] }),
          h('p', null, lessonPH < floor
            ? 'レッスンだけでは、下限の ' + Kit.yen(floor) + ' に届きません。値上げで届かせるなら、1回 ' + Kit.yen(needPrice) + ' 以上が必要です。いきなりそこまで上げるのではなく、準備の時間を短くする工夫（教材の使い回し）と、時間を使わない商品の組み合わせで補います。'
            : 'レッスンだけでも、下限の ' + Kit.yen(floor) + ' をこえています。上限の回数に近づいたら、値上げか、時間を使わない商品への置きかえを考えます。'),
          h('h3', null, '値上げのタイミング'),
          h('ul', null,
            h('li', null, '予約が上限の8割をこえる月が、3か月続いたとき'),
            h('li', null, '感想や実績がたまり、内容をふやしたとき（教材つき、質問し放題など）'),
            h('li', null, '新しいお客さんから先に。いまのお客さんには1〜2か月前に知らせ、しばらくは前の価格のままにする')),
          h('p', null, '値下げはすぐにできますが、上げるのは大変です。最初から安くしすぎないことが、いちばんの価格戦略です。'),

          H2('4', '数字の目安（12か月）'),
          h('p', null, 'ひな形を標準シナリオで計算した表です。12か月目の月商は ' + Kit.yen(mm.revenue) + '、1年間の売上は ' + Kit.yen(t.year1.revenue) + '、利益は ' + Kit.yen(t.year1.profit) + '（初期費用を引く前）。' +
            (t.breakEvenMonth >= 0 ? '初期費用 ' + Kit.yen(t.initial) + ' は ' + beText(B) + 'に取り戻せる見込みです。' : '') +
            (firstHit >= 0 ? '目標の ' + Kit.yen(T) + ' に届くのは ' + (firstHit + 1) + 'か月目です。' : '')),
          tbl(['月', '売上', '費用', '利益', '累積の利益', '作業'], B.months.map((m) => [ymLong(m.ym), Kit.yen(m.revenue), Kit.yen(m.cost), Kit.yen(m.profit), Kit.yen(m.cumulative), fmtH(m.hours)]), { right: [1, 2, 3, 4, 5] }),
          h('h3', null, '12か月目の内訳'),
          tbl(['商品', '数', '売上', '割合'], ex.streams.map((s) => [s.name, fmtU(mm.units[s.id]) + unitOf(s), Kit.yen(mm.byStream[s.id]), Math.round((mm.byStream[s.id] / (mm.revenue || 1)) * 100) + '%']), { right: [1, 2, 3] }),
          h('p', null, '12か月目は、時間を使う商品（レッスン・講座・ワークショップ）が ' + timeShare + '%、時間を使わない商品（ツール集・メンバーシップ・Kindle本）が ' + (100 - timeShare) + '%。どちらかに偏りすぎないように組んでいます。'),
          h('h3', null, 'シナリオで比べる'),
          tbl(['シナリオ', '12か月目の月商', '1年の利益', '初期費用を取り戻す月', '作業のピーク'], SCENARIOS.map((x) => {
            const r = res[x.id];
            return [x.label, Kit.yen(m12(r).revenue), Kit.yen(r.totals.year1.profit), beText(r) || '期間内はまだ', fmtH(r.totals.peakHours)];
          }), { right: [1, 2, 4] }),
          h('p', null, (lo.breakEvenMonth >= 0 ? '慎重シナリオでも、初期費用は ' + beText(res.low) + 'に取り戻せます。初期費用が小さいことが、この計画のいちばんの強みです。' : '慎重シナリオでは、この期間に初期費用を取り戻せません。') +
            (hi.peakHours > A ? '一方で挑戦シナリオでは、作業が月 ' + fmtH(hi.peakHours) + 'になり、上限の ' + fmtH(A) + 'をこえます。うまくいったときほど、時間が足りなくなります。' : '')),
          h('div', { class: 'btn-row mo-docbtns' }, Kit.btn('この数字をシミュレーターで開く', openInSim, { kind: 'primary', icon: 'chart' })),

          H2('5', '時間と体力の上限'),
          h('p', null, '先に「使える時間」を決めて、そこから商品を選びます。育児と本業があるので、上限は月 ' + fmtH(A) + '（週 ' + fmtH(A / 4) + 'ほど）。この上限をこえる計画は、数字がよく見えても採りません。'),
          h('p', null, '標準シナリオでは、いちばん忙しい月で ' + fmtH(t.peakHours) + '。' + (hi.peakHours > A ? '挑戦シナリオでは ' + fmtH(hi.peakHours) + 'になり、上限を ' + fmtH(hi.peakHours - A) + 'こえます。そうなったら、レッスンの枠をふやすのではなく、値上げか、録画講座への置きかえを考えます。' : '挑戦シナリオでも ' + fmtH(hi.peakHours) + 'で、上限の内です。')),
          h('div', { class: 'mo-box' }, h('b', null, '燃え尽きないための約束'), h('ul', null,
            h('li', null, '予約できる枠を先に決める（例：火・木の夜、土曜の午前）'),
            h('li', null, '問い合わせへの返信は1日1回、まとめて'),
            h('li', null, '上限の2割は空けておく（子どもの発熱や行事の予備）'),
            h('li', null, '月に1週は、新しい仕事を入れない週にする'))),

          H2('6', '3つの層で考える'),
          h('p', null, 'ひとりで事業をしていると、目の前の作業に追われて、いちばん大事な時間から削れていきます。活動を3つの層に分けて、それぞれに時間を先に取っておきます。'),
          h('div', { class: 'mo-layers' },
            h('div', { class: 'mo-layer' }, h('b', null, '掛け算する層（広げる仕組み）'), h('p', null, 'コミュニティ・無料配布・紹介。一度つくると、自分が動かなくても広がっていきます。例：無料ツールを先生どうしで共有してもらう、ひらめき部の会員が友だちを誘える紹介カード。')),
            h('div', { class: 'mo-layer' }, h('b', null, '創る層（いま力を入れる商品を1つに絞る）'), h('p', null, '例：この3か月は、授業ツール集の改訂だけに集中する。ほかの商品は、いまのまま続けます。同時にいくつも新しくしないことが、質を保つこつです。')),
            h('div', { class: 'mo-layer' }, h('b', null, '充電する層（収益で測らない活動）'), h('p', null, '作曲・数学の研究・家族との時間。新しいアイデアは、ここから生まれます。売上が気になる月ほど、ここを削らないようにします。'))),
          h('p', null, '掛け算する層が育つほど、創る層の1つの商品が、多くの人に届きます。充電する層を守ることで、創る層のアイデアが枯れません。売上が伸びない月も、3つの層のどこに時間を使ったかを振り返ると、次の一手が見えてきます。'),
          tbl(['層', '月' + fmtH(A) + 'のうち', '中身'], [
            ['掛け算する層', '約10時間', 'SNS・無料ツールの更新・紹介のしくみ'],
            ['創る層', '残りの時間', 'レッスン・講座・教材づくり'],
            ['充電する層', '別枠（予定表に先に入れる）', '作曲・研究・家族'],
          ]),

          H2('7', 'リスクと確認すること'),
          h('h3', null, '公務員・会社員の副業規定'),
          h('p', null, 'まず、勤め先の規定を確かめます。公立学校の先生は、報酬を得て事業を営むには、任命権者（教育委員会など）の許可が必要です（地方公務員法38条）。教育に関する兼業は、本務に支障がないと認められれば許可される場合があります（教育公務員特例法17条）。兼業許可が必要な場合があるので、始める前に相談しましょう。育児休業中も身分は公務員のままです。休業中の手当金への影響も、あわせて確認します。'),
          h('h3', null, '開業届・青色申告'),
          h('p', null, '事業として始めるなら、開業から1か月以内に開業届を税務署へ出します。青色申告にするなら、開業から2か月以内に承認申請書を出します（帳簿のつけ方によって、最大65万円の控除）。給与をもらいながらの副業は、副業の所得が年20万円をこえると確定申告が必要です。20万円以下でも、住民税の申告は必要です。'),
          h('h3', null, 'インボイス登録の判断'),
          h('p', null, '学校や企業など、事業者との取引が多いなら、登録を求められることがあります。保護者や学び直しの大人など、個人のお客さんが中心なら、急いで登録しなくてもよい場合が多いです。登録すると消費税の申告が必要になります。特例や経過措置は時期によって変わるので、国税庁の案内で確かめます。'),
          h('h3', null, '特定商取引法の表記'),
          h('p', null, 'ネットで教材や講座を売るなら、事業者名・住所・電話番号・価格・支払いと引き渡しの時期・キャンセルの条件をのせた「特定商取引法に基づく表記」が必要です。住所や電話番号を出したくないときは、請求があれば遅滞なく開示すると書く方法もあります。月額のメンバーシップは、申し込みの最終確認の画面に、解約の方法と条件をはっきり書きます。'),
          h('h3', null, 'そのほか'),
          h('ul', null,
            h('li', null, '中高生のお客さんは、保護者の同意を得る'),
            h('li', null, 'レッスンの録画や、個人情報の扱いを決めて、書いておく'),
            h('li', null, '教科書や入試問題を教材に使うときは、著作権に気をつける')),
          h('div', { class: 'mo-box' }, h('p', null, 'この計画は、3か月ごとに見直します。数字は予想なので、外れて当たり前です。外れたら、どの仮定（数・伸び・解約）がずれたのかを確かめて、次の3か月に生かします。')),
          h('div', { class: 'btn-row mo-docbtns' },
            Kit.btn('この数字をシミュレーターで開く', openInSim, { kind: 'primary', icon: 'chart' }),
            h('span', { class: 'local-only' }, Kit.btn('印刷する', () => window.print()))));

        const toc = h('nav', { class: 'mo-toc', 'aria-label': '計画書の目次' }, h('div', { class: 'mo-toc-h' }, 'もくじ'),
          sec.map((x) => h('button', { type: 'button', onclick: () => { x.el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); } }, x.no + '　' + x.text)));
        panel.append(h('div', { class: 'mo-docwrap' }, toc, h('div', { class: 'mo-paper' }, doc)));
      }

      /* ── ひな形 ── */
      function openPresets() {
        const list = h('div', { class: 'mo-presets' });
        const m = Kit.modal({ title: 'ひな形から始める', wide: true, body: h('div', { class: 'stack' }, h('p', { class: 'small ink-2' }, '例の数字が入った計画を読み込みます。いまの計画は置きかわります。'), list), actions: [{ label: 'やめる', kind: 'ghost' }] });
        for (const p of PRESET_DEFS) {
          const r = project(presetPlan(p.id), 'base');
          list.append(h('button', { type: 'button', onclick: () => { m.close(); applyPreset(p.id); } },
            h('b', null, p.name), h('span', null, p.desc),
            h('span', { class: 'mo-pnum' }, '12か月目 ' + Kit.yenShort(m12(r).revenue) + '・1年の売上 ' + Kit.yenShort(r.totals.year1.revenue) + '・初期費用 ' + Kit.yenShort(r.totals.initial))));
        }
      }
      async function applyPreset(id) {
        const def = PRESET_DEFS.find((p) => p.id === id);
        const ok = await Kit.confirm({ title: '「' + def.name + '」を読み込みますか', body: 'いまの計画（' + (plan.title || '名前のない計画') + '）は、この例で置きかわります。', ok: '読み込む' });
        if (!ok || !alive) return;
        const prev = clonePlan(plan);
        plan = presetPlan(id, Kit.ym());
        save();
        renderSampleBar();
        if (tab !== 'sim') setTab('sim'); else renderPanel();
        Kit.toast('「' + def.name + '」を読み込みました', { action: { label: '元に戻す', onClick: async () => {
          if (!alive) return;
          if (prev._sample) { selfWrites++; await Kit.store.del('plan'); plan = normalize(await Kit.store.get('plan', { sample: SAMPLE_PLAN, blank: blankPlan() })); }
          else { plan = normalize(prev); save(); }
          renderAll();
        } } });
      }

      renderAll();
      return () => {
        alive = false;
        refresh.cancel();
        if (ro) ro.disconnect();
        offs.forEach((f) => f());
      };
    },
  });
})();
