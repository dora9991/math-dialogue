// SNS投稿プランナー：投稿のネタ・下書き・予定・文字数をまとめて
(function () {
  'use strict';
  const { h } = Kit;

  /* ───────── 投稿先・状態 ───────── */
  // tags：end = 本文の最後にタグ / block = タグは別のかたまり / none = タグを使わない
  const PLATFORMS = [
    { id: 'instagram', label: 'Instagram', mark: 'IG', limit: 2200, tags: 'block', maxTags: 30 },
    { id: 'x', label: 'X', mark: 'X', limit: 280, weighted: true, tags: 'end' },
    { id: 'threads', label: 'Threads', mark: 'Th', limit: 500, tags: 'end' },
    { id: 'facebook', label: 'Facebook', mark: 'FB', limit: 63206, tags: 'end' },
    { id: 'line', label: 'LINE公式', mark: 'LINE', limit: 500, tags: 'none' },
    { id: 'youtube', label: 'YouTube', mark: 'YT', limit: 5000, titleLimit: 100, tags: 'end' },
    { id: 'tiktok', label: 'TikTok', mark: 'TT', limit: 2200, tags: 'end' },
    { id: 'note', label: 'note', mark: 'note', limit: 0, titleRec: 40, tags: 'block' },
  ];
  const PF = Object.fromEntries(PLATFORMS.map((p) => [p.id, p]));
  const STATUSES = [
    { id: 'idea', label: 'ネタ', chip: '' },
    { id: 'draft', label: '下書き', chip: 'line' },
    { id: 'scheduled', label: '予約', chip: 'blue' },
    { id: 'posted', label: '投稿済み', chip: 'ok' },
  ];
  const ST = Object.fromEntries(STATUSES.map((s) => [s.id, s]));

  const pad = (n) => String(n).padStart(2, '0');
  const add = (d, n) => Kit.ymd(Kit.addDays(d, n));
  const todayS = () => Kit.ymd(Kit.today());
  const isYmd = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ''));
  const nowHM = () => { const d = new Date(); return pad(d.getHours()) + ':' + pad(d.getMinutes()); };
  const md = (s) => Kit.fmtDate(s, 'M/D(W)');
  const chars = (s) => Array.from(String(s || '')).length;
  const num = (v) => (v === '' || v == null || !Number.isFinite(+v) ? null : +v);

  /* ───────── 文字数 ───────── */
  // X の重みつき文字数：半角（U+0000–10FF など）は1、全角・絵文字は2、URL は1つ23
  const SEG = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter('ja', { granularity: 'grapheme' }) : null;
  const xWeight = (c) => (c <= 0x10ff || (c >= 0x2000 && c <= 0x200d) || (c >= 0x2010 && c <= 0x201f) || (c >= 0x2032 && c <= 0x2037) ? 1 : 2);
  function xLength(text) {
    let n = 0;
    const s = String(text || '').normalize('NFC').replace(/https?:\/\/[\x21-\x7e]+/g, () => { n += 23; return ''; });
    const parts = SEG ? Array.from(SEG.segment(s), (x) => x.segment) : Array.from(s);
    for (const g of parts) {
      const cps = Array.from(g);
      if (cps.length > 1 && /\p{Extended_Pictographic}|⃣|[\u{1f1e6}-\u{1f1ff}]/u.test(g)) { n += 2; continue; } // 組み合わせの絵文字は2
      for (const ch of cps) n += xWeight(ch.codePointAt(0));
    }
    return n;
  }
  const tagLine = (tags) => (tags || []).map((t) => '#' + t).join(' ');
  // 投稿先ごとの本文（タグをどこに置くか）
  function composeText(pfId, post) {
    const p = PF[pfId], text = String(post.text || '').replace(/\s+$/, ''), tl = tagLine(post.tags);
    if (!p || p.tags === 'none' || pfId === 'note' || !tl) return text;
    return text ? text + '\n\n' + tl : tl;
  }
  // 投稿先ごとの数と注意
  function check(pfId, post) {
    const p = PF[pfId], body = composeText(pfId, post), warns = [];
    const n = p.weighted ? xLength(body) : chars(body);
    let level = 'ok', label;
    if (p.weighted) {
      const left = p.limit - n;
      label = left >= 0 ? '残り' + Kit.num(left) : Kit.num(-left) + 'オーバー';
      level = left < 0 ? 'bad' : left <= 20 ? 'warn' : 'ok';
      if (left < 0) warns.push('280をこえています（全角はおよそ140字まで）。');
    } else if (p.limit) {
      label = Kit.num(n) + ' / ' + Kit.num(p.limit);
      level = n > p.limit ? 'bad' : n > p.limit * 0.9 ? 'warn' : 'ok';
      if (n > p.limit) warns.push(pfId === 'line' ? '1通は500字までです。' + Math.ceil(n / 500) + '通に分かれます。' : Kit.num(p.limit) + '字をこえています。');
    } else label = Kit.num(n) + '字';
    if (p.maxTags && (post.tags || []).length > p.maxTags) { level = 'bad'; warns.push('ハッシュタグは' + p.maxTags + '個までです（いま' + post.tags.length + '個）。'); }
    if (p.titleLimit) {
      const tn = chars(post.title);
      if (!tn) { warns.push('タイトルを入れてください（' + p.titleLimit + '字まで）。'); if (level === 'ok') level = 'warn'; }
      else if (tn > p.titleLimit) { warns.push('タイトルが' + p.titleLimit + '字をこえています（いま' + tn + '字）。'); level = 'bad'; }
    }
    if (p.titleRec && chars(post.title) > p.titleRec) { warns.push('タイトルは' + p.titleRec + '字以内がおすすめです（いま' + chars(post.title) + '字）。'); if (level === 'ok') level = 'warn'; }
    return { n, label, level, warns, body };
  }

  /* ───────── 投稿の型 ───────── */
  const TEMPLATES = [
    { name: 'お知らせ', pillar: 'お知らせ', desc: '新しいこと・変わったことを短く', text: '【お知らせ】◯◯を始めます\n\nいつも見てくださって、ありがとうございます。\n◯月◯日から、◯◯をはじめます。\n\n・内容：◯◯\n・日時：◯月◯日（◯）◯時〜\n・場所：オンライン／◯◯\n\nくわしくは、プロフィールのリンクからどうぞ。' },
    { name: '体験会の募集', pillar: 'お知らせ', desc: 'だれ向けか・何をするか・申し込み方', text: '【無料体験会】◯月◯日（◯）◯時〜\n\n「◯◯がわからない」「◯◯が不安」\nそんな方に向けた、◯分の体験会です。\n\nこの日やること\n・◯◯\n・◯◯\n・質問タイム\n\n対象：◯◯の方\n定員：◯名（先着順）\n参加費：無料\n\nお申し込みは、プロフィールのリンクからどうぞ。' },
    { name: 'お客さんの声', pillar: '声・実績', desc: '前と後の変化を、本人の言葉で', text: '【お客さんの声】\n「◯◯◯◯」\n（◯◯の◯◯さん）\n\nはじめは◯◯でしたが、◯◯を続けるうちに、◯◯できるようになりました。\n\nご紹介の許可をいただき、ありがとうございます。\n◯◯で迷っている方は、まず◯◯からどうぞ。' },
    { name: 'ノウハウ・コツ', pillar: '教える', desc: '保存したくなる「なるほど」', text: '【◯◯のコツ】\n◯◯で困っていませんか？\n\nポイントは3つです。\n1. ◯◯\n2. ◯◯\n3. ◯◯\n\nとくに◯◯は、◯◯すると分かりやすくなります。\n保存して、あとで見返してください。' },
    { name: '舞台裏・つくる過程', pillar: '見せる（舞台裏）', desc: '準備中のようす・こだわり', text: '【舞台裏】いま◯◯をつくっています\n\n今日は◯◯の準備。\n◯◯で迷って、◯◯にしてみました。\n\nこだわったのは、◯◯なところ。\nできあがりは◯月ごろの予定です。' },
    { name: 'よくある質問', pillar: '教える', desc: '聞かれることに先に答える', text: '【よくある質問】\nQ. ◯◯ですか？\nA. ◯◯です。\n\n◯◯な場合は、◯◯もできます。\nほかにも気になることがあれば、気軽にメッセージでどうぞ。' },
    { name: 'キャンペーン', pillar: 'お知らせ', desc: '期間・対象・内容をはっきり', text: '【◯月限定】◯◯キャンペーン\n\n◯月◯日までにお申し込みの方に、◯◯をおつけします。\n\n・対象：◯◯の方\n・内容：◯◯\n・期間：◯月◯日〜◯月◯日\n\nこの機会に、◯◯をはじめてみませんか。' },
  ];

  /* ───────── サンプル（ひらめき数学舎）。日付は今日からの相対 ───────── */
  const r = Kit.rel;
  const post = (n, o) => Object.assign({ id: 's-post-' + n, platforms: ['instagram'], title: '', text: '', tags: [], date: '', time: '', status: 'idea', pillar: '', image: '', memo: '', metrics: { likes: null, saves: null, reach: null } }, o);
  const SAMPLE_POSTS = [
    post(1, {
      platforms: ['instagram', 'threads'], status: 'scheduled', date: r(2), time: '20:00', pillar: 'お知らせ', title: '無料体験会のお知らせ',
      tags: ['無料体験会', 'オンライン授業', '数学', '中学数学', '数学が苦手', '佐賀'],
      text: '【無料体験会のお知らせ】\n「数学、どこからわからなくなったのか分からない」\nそんな中高生と保護者の方へ、オンラインの体験会をひらきます。\n\n・日時：' + Kit.fmtDate(r(6), 'M月D日（W）') + '10:00〜11:30\n・内容：図を動かして「なぜ？」を見つける体験\n・定員：6名（先着順）\n・参加費：無料\n\nお申し込みは、プロフィールのリンクからどうぞ。',
    }),
    post(2, {
      status: 'draft', date: r(4), time: '20:00', pillar: '教える', title: '三角形の内角の和はなぜ180°？',
      tags: ['数学', '中学数学', '図形', '三角形', '勉強法', '中学生', '学び直し'],
      text: '三角形の内角の和は、なぜ180°なのでしょう？\n\n公式として覚えている人は多いのですが、\n「なぜ？」と聞かれると、ちょっと困りますよね。\n\n紙の三角形を用意して、3つの角をちぎって並べてみてください。\nぴったり一直線、180°になります。\n\nもうひとつの見方は、平行線。\n頂点を通る平行線を1本引くと、錯角が等しいので、\n3つの角が一直線の上に集まります。\n\n覚えるより、手で確かめる。\nそれだけで、図形はぐっと身近になります。\n保存して、お子さんと一緒にやってみてください。',
    }),
    post(3, {
      platforms: ['instagram', 'threads'], status: 'posted', date: r(-5), time: '21:00', pillar: '声・実績', title: '保護者の方の声',
      tags: ['お客さんの声', 'オンライン個別指導', '中学数学', '数学が苦手'], metrics: { likes: 48, saves: 6, reach: 620 },
      text: '【保護者の方の声】\n「数学の宿題を見ると、ため息ばかりだった娘が、\n最近は『これ、なんでこうなるか分かった』と話してくれます」\n（中学2年生の保護者さま）\n\n最初の3回は、計算よりも「図にかいてみる」ことを続けました。\n自分で気づけた日のうれしそうな顔は、こちらも忘れられません。\n\nご紹介の許可をいただき、ありがとうございます。',
    }),
    post(4, {
      platforms: ['x'], status: 'posted', date: r(-9), time: '12:00', pillar: '見せる（舞台裏）', title: '教材づくりの舞台裏',
      tags: ['教材づくり', '数学'], metrics: { likes: 35, saves: 12, reach: 540 },
      text: '今週は体験会のワークシートづくり。\n三角形を「ちぎって並べる」ページを、切り取り線つきに直しました。\n小さな手でも切りやすいように、線は太めに。',
    }),
    post(5, {
      platforms: ['x', 'threads'], status: 'posted', date: r(-2), time: '07:30', pillar: '教える', title: 'マイナス×マイナスはなぜプラス？',
      tags: ['数学', '中学数学'], metrics: { likes: 120, saves: 40, reach: 3100 },
      text: '「マイナス×マイナスは、なぜプラス？」\n数直線で考えると見えてきます。\n×(−1) は「向きを反対にする」こと。\n反対の反対は、もとの向き。\nだから (−2)×(−3) は +6 になります。',
    }),
    post(6, {
      platforms: ['note', 'instagram'], status: 'idea', date: r(9), pillar: 'お知らせ', title: '大人の学び直し講座（全6回）のご案内',
      text: '次の期の募集。どんな人に向いているか、6回の流れ、受けた方の感想を入れる。',
    }),
    post(7, {
      platforms: ['instagram', 'line'], status: 'draft', date: r(7), time: '19:00', pillar: 'お知らせ', title: 'よくある質問：オンラインでも大丈夫？',
      tags: ['よくある質問', 'オンライン授業'],
      text: '【よくある質問】\nQ. オンラインだと、わからないところが伝わりにくくないですか？\nA. 手元のノートをカメラで映してもらいながら進めます。\n書いている途中の手の動きが見えるので、どこでつまずいたかが、むしろよく分かります。\n\nパソコンがなくても、スマホやタブレットで受けられます。',
    }),
    post(8, {
      platforms: ['note'], status: 'idea', date: r(12), pillar: '教える', title: '公式は、覚えるより発見する',
      text: 'Kindle本『公式は、発見できる』の「はじめに」を、note向けに書き直す。円の面積を例に。',
    }),
    post(9, {
      platforms: ['youtube', 'tiktok'], status: 'idea', pillar: '教える', title: '30秒でわかる 円の面積',
      tags: ['数学', '円の面積', '中学数学'],
      text: '円をピザのように細かく切って並べかえると、ほぼ長方形に。\nたて＝半径、よこ＝円周の半分。だから面積は 半径×半径×3.14。',
    }),
  ];
  const PILLARS = [{ name: '教える', target: 40 }, { name: '見せる（舞台裏）', target: 20 }, { name: '声・実績', target: 20 }, { name: 'お知らせ', target: 20 }];
  const CFG_BLANK = { pillars: PILLARS, tagSets: [], platforms: ['instagram'] };
  const CFG_SAMPLE = {
    pillars: PILLARS,
    tagSets: [
      { name: '数学・教育', tags: ['数学', '中学数学', '高校数学', '勉強法', 'オンライン授業', '数学が苦手'] },
      { name: '佐賀', tags: ['佐賀', '佐賀市', '佐賀県', '佐賀の習い事', '九州'] },
      { name: '学び直し', tags: ['学び直し', '大人の学び直し', '大人の数学', '生涯学習'] },
    ],
    platforms: ['instagram'],
  };
  Kit.store.sample('posts', SAMPLE_POSTS);
  Kit.store.sample('sns', CFG_SAMPLE);
  function normCfg(c) {
    const o = Object.assign(Kit.clone(CFG_BLANK), c || {});
    o.pillars = (Array.isArray(o.pillars) ? o.pillars : []).filter((p) => p && p.name).map((p) => ({ name: String(p.name), target: Math.max(0, +p.target || 0) }));
    o.tagSets = (Array.isArray(o.tagSets) ? o.tagSets : []).filter((t) => t && t.name).map((t) => ({ name: String(t.name), tags: (t.tags || []).map(String) }));
    o.platforms = (Array.isArray(o.platforms) ? o.platforms : ['instagram']).filter((p) => PF[p]);
    return o;
  }
  function normPost(p) {
    const o = Object.assign({ platforms: [], title: '', text: '', tags: [], date: '', time: '', status: 'idea', pillar: '', image: '', memo: '' }, Kit.clone(p || {}));
    o.platforms = (Array.isArray(o.platforms) ? o.platforms : []).filter((x) => PF[x]);
    o.tags = (Array.isArray(o.tags) ? o.tags : []).map(String);
    o.status = ST[o.status] ? o.status : 'idea';
    o.metrics = Object.assign({ likes: null, saves: null, reach: null }, o.metrics || {});
    return o;
  }
  const postTitle = (p) => String(p.title || '').trim() || String(p.text || '').split('\n').map((x) => x.trim()).find(Boolean) || '（まだ中身がありません）';
  const score = (p) => (num(p.metrics && p.metrics.likes) || 0) + (num(p.metrics && p.metrics.saves) || 0) * 2;
  const hasMetrics = (p) => p.metrics && ['likes', 'saves', 'reach'].some((k) => num(p.metrics[k]) != null);
  const metricsText = (p) => [['いいね', 'likes'], ['保存', 'saves'], ['リーチ', 'reach']].filter(([, k]) => num(p.metrics[k]) != null).map(([l, k]) => l + ' ' + Kit.num(p.metrics[k])).join('・');

  /* ───────── 見た目 ───────── */
  Kit.css('sns', `
.sns-bar{gap:8px 12px}
.sns-bar .spacer{flex:1}
.sns-nav{display:flex;align-items:center;gap:4px}
.sns-hint{font-size:13px;color:var(--ink-2);margin:-4px 0 10px}
.sns-month-title{font-family:var(--font-display);font-size:19px;font-weight:800;letter-spacing:.04em;white-space:nowrap;margin-left:8px}
.sns-mark{display:inline-flex;align-items:center;justify-content:center;min-width:22px;height:20px;padding:0 5px;border-radius:5px;border:1px solid var(--line-strong);background:var(--surface);font-size:10.5px;font-weight:700;letter-spacing:.02em;color:var(--ink-2);line-height:1;font-family:var(--font-body)}
.sns-marks{display:inline-flex;flex-wrap:wrap;gap:3px;min-width:0}
/* ボード */
.sns-board-wrap{min-width:0}
.sns-board{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;align-items:start}
.sns-col{display:grid;align-content:start;gap:8px;min-width:0;min-height:180px;padding:8px;border:1px solid var(--line);border-radius:var(--r);background:var(--surface-2)}
.sns-col.is-over{border-color:var(--gosu);background:var(--gosu-wash)}
.sns-col-h{display:flex;align-items:center;gap:6px;padding:2px 2px 2px 6px}
.sns-col-h h3{font-size:14px;font-weight:700}
.sns-col-n{font-size:12px;color:var(--ink-3);font-variant-numeric:tabular-nums}
.sns-col-h .btn{margin-left:auto}
.sns-col-empty{font-size:12.5px;color:var(--ink-3);padding:10px 6px;text-align:center;border:1px dashed var(--line-strong);border-radius:8px}
.sns-card{display:grid;gap:6px;min-width:0;padding:10px;border:1px solid var(--line);border-radius:8px;background:var(--surface);cursor:pointer}
.sns-card:hover{border-color:var(--line-strong)}
.sns-card[draggable="true"]{cursor:grab}
.sns-card.is-drag{opacity:.45}
.sns-card-top{display:flex;flex-wrap:wrap;align-items:center;gap:4px 6px;min-width:0}
.sns-date{margin-left:auto;font-size:12px;color:var(--ink-2);font-variant-numeric:tabular-nums;white-space:nowrap}
.sns-date.is-none{color:var(--ink-3)}
.sns-card-title{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;overflow-wrap:anywhere;width:100%;padding:0;border:0;background:transparent;font:inherit;font-size:14px;font-weight:700;line-height:1.5;color:var(--ink);text-align:left;cursor:pointer}
.sns-card-meta{display:flex;flex-wrap:wrap;align-items:center;gap:4px 6px;font-size:12px;color:var(--ink-3)}
.sns-thumb{display:block;width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:6px;background:var(--surface-2)}
.sns-card-st{display:none;min-height:36px;font-size:14px}
.sns-more{justify-self:center}
@media (hover:none),(pointer:coarse){.sns-card-st{display:block}}
@media (max-width:760px){
  .sns-board-wrap{overflow-x:auto;scroll-snap-type:x mandatory;margin-left:calc(-1 * var(--gutter-l));margin-right:calc(-1 * var(--gutter-r));padding:0 var(--gutter-r) 8px var(--gutter-l);scroll-padding-left:var(--gutter-l)}
  .sns-board{grid-template-columns:repeat(4,min(300px,80vw))}
  .sns-col{scroll-snap-align:start}
}
/* カレンダー */
.sns-month{border:1px solid var(--line);border-radius:var(--r);background:var(--surface);overflow:hidden}
.sns-dow,.sns-week{display:grid;grid-template-columns:repeat(7,minmax(0,1fr))}
.sns-dow{background:var(--surface-2);border-bottom:1px solid var(--line)}
.sns-dow>span{text-align:center;font-size:12px;font-weight:700;color:var(--ink-3);padding:5px 0}
.sns-dow .is-sun{color:var(--shu)}.sns-dow .is-sat{color:var(--gosu)}
.sns-week+.sns-week{border-top:1px solid var(--line)}
.sns-day{display:flex;flex-direction:column;gap:3px;min-width:0;min-height:104px;padding:4px;background:var(--surface);cursor:pointer}
.sns-day+.sns-day{border-left:1px solid var(--line)}
.sns-day.is-out{background:var(--surface-2)}
.sns-dnum{align-self:flex-start;min-width:26px;height:26px;padding:0 5px;border:0;border-radius:99px;background:transparent;font:inherit;font-size:13px;font-weight:700;color:var(--ink);font-variant-numeric:tabular-nums;display:inline-grid;place-items:center;line-height:1;cursor:pointer}
button.sns-dnum:hover{background:var(--surface-3)}
.sns-day.is-sun .sns-dnum,.sns-day.is-hol .sns-dnum{color:var(--shu)}
.sns-day.is-sat .sns-dnum{color:var(--gosu)}
.sns-day.is-out .sns-dnum{opacity:.55}
.sns-day.is-today .sns-dnum{background:var(--gosu);color:var(--on-gosu);opacity:1}
.sns-dhead{display:flex;align-items:center;gap:4px;min-width:0}
.sns-hol{font-size:10.5px;color:var(--shu);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
.sns-cp{display:flex;align-items:center;gap:4px;width:100%;min-width:0;padding:2px 5px;border:1px solid var(--line);border-left:3px solid var(--st);border-radius:4px;background:var(--surface);color:var(--ink);font:inherit;font-size:12px;line-height:1.35;text-align:left;cursor:pointer}
.sns-cp:hover{background:var(--surface-2)}
.sns-cp .t{flex:none;color:var(--ink-2);font-variant-numeric:tabular-nums}
.sns-cp .n{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sns-cp .sns-mark{height:16px;min-width:18px;font-size:9.5px;padding:0 3px}
.sns-s{flex:none;margin-left:auto;font-size:10px;font-weight:700;line-height:1;padding:2px 3px;border-radius:3px;background:var(--shu-wash);color:var(--shu)}
.st-idea{--st:var(--line-strong)}.st-draft{--st:var(--ink-3)}.st-scheduled{--st:var(--gosu)}.st-posted{--st:var(--ok)}
.sns-dayc{min-height:58px;padding:4px 1px;border:0;border-radius:0;font:inherit;color:inherit;align-items:center;text-align:center}
.sns-dots{display:flex;flex-wrap:wrap;justify-content:center;gap:3px}
.sns-dots i{width:6px;height:6px;border-radius:50%;background:var(--st)}
.sns-dayc.is-sel{background:var(--gosu-wash);box-shadow:inset 0 0 0 2px var(--gosu)}
.sns-legend{display:flex;flex-wrap:wrap;gap:4px 14px;margin-top:8px;font-size:12px;color:var(--ink-2)}
.sns-legend i{display:inline-block;width:10px;height:10px;margin-right:5px;border-radius:3px;background:var(--st);vertical-align:-1px}
.sns-daylist{margin-top:12px;padding:12px;border:1px solid var(--line);border-radius:var(--r);background:var(--surface)}
.sns-daylist-h{display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;margin-bottom:10px}
.sns-daylist-h h3{font-size:16px}
.sns-rows{display:grid;gap:6px}
.sns-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:4px 10px;align-items:center;width:100%;min-height:44px;padding:8px 10px;border:1px solid var(--line);border-left:4px solid var(--st);border-radius:8px;background:var(--surface);color:var(--ink);font:inherit;text-align:left;cursor:pointer}
.sns-row:hover{background:var(--surface-2)}
.sns-row-t{font-weight:700;overflow-wrap:anywhere;min-width:0}
.sns-row-m{display:flex;flex-wrap:wrap;align-items:center;gap:4px 8px;font-size:12.5px;color:var(--ink-3);grid-column:1/-1}
.sns-undated{margin-top:14px}
.sns-undated h3{font-size:14px;margin-bottom:8px}
/* 一覧 */
.sns-filters{display:grid;grid-template-columns:repeat(3,minmax(0,1fr)) minmax(0,1.4fr);gap:8px 10px;margin-bottom:12px}
.sns-tbl td{vertical-align:middle}
.sns-tbl .sns-marks{flex-wrap:nowrap}
.sns-tbl .t{font-weight:700;color:var(--ink);background:none;border:0;padding:0;font:inherit;text-align:left;cursor:pointer;overflow-wrap:anywhere}
.sns-tbl .t:hover{color:var(--gosu);text-decoration:underline}
.sns-tbl .sub{font-size:12px;color:var(--ink-3);display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden}
/* 下のカード */
.sns-cards{margin-top:20px}
.sns-pl{display:grid;gap:10px}
.sns-pl-row{display:grid;gap:4px}
.sns-pl-top{display:flex;align-items:baseline;gap:8px;font-size:13px;min-width:0}
.sns-pl-top b{font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
.sns-pl-top span{margin-left:auto;color:var(--ink-2);font-variant-numeric:tabular-nums;white-space:nowrap}
.sns-meter{position:relative;overflow:visible}
.sns-meter>i{max-width:100%}
.sns-meter .goal{position:absolute;top:-3px;bottom:-3px;width:2px;margin-left:-1px;background:var(--ink);border-radius:1px}
.sns-pl-note{font-size:12px;color:var(--ink-3)}
.sns-top-list{display:grid;gap:6px}
.sns-top-it{display:grid;gap:2px;width:100%;padding:8px 10px;border:1px solid var(--line);border-radius:8px;background:var(--surface);font:inherit;color:var(--ink);text-align:left;cursor:pointer}
.sns-top-it:hover{background:var(--surface-2)}
.sns-top-it b{overflow-wrap:anywhere}
.sns-top-it span{font-size:12.5px;color:var(--ink-2);font-variant-numeric:tabular-nums}
.sns-times{margin:0;padding-left:1.2em;display:grid;gap:4px;font-size:14px}
/* つくる画面 */
.sns-comp{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:18px;align-items:start}
.sns-comp-l{display:grid;gap:12px;min-width:0}
.sns-pfs{display:flex;flex-wrap:wrap;gap:6px}
.sns-pfs .chip{min-height:34px;padding:2px 12px;font-size:13px}
.sns-lrow{display:flex;flex-wrap:wrap;align-items:center;gap:6px;min-width:0}
.sns-lrow>label{margin-right:auto}
.sns-text{min-height:220px;font-size:15px;line-height:1.75}
.sns-tags{display:flex;flex-wrap:wrap;align-items:center;gap:6px;min-height:44px;padding:6px;border:1px solid var(--line-strong);border-radius:8px;background:var(--surface)}
.sns-tags:focus-within{outline:2px solid var(--focus);outline-offset:0;border-color:var(--focus)}
.sns-tags input[type="text"]{flex:1 1 150px;width:auto;min-width:0;min-height:30px;padding:2px 4px;border:0;outline:none;background:transparent}
.sns-tags input[type="text"]:focus{outline:none}
.sns-tag{padding-right:2px;gap:2px}
.sns-tag-x{display:inline-grid;place-items:center;width:22px;height:22px;padding:0;border:0;border-radius:50%;background:transparent;color:inherit;cursor:pointer}
.sns-tag-x:hover{background:color-mix(in srgb,currentColor 15%,transparent)}
.sns-tag-x svg{width:12px;height:12px}
.sns-3col{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.sns-2col{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.sns-img{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.sns-img img{width:72px;height:72px;object-fit:cover;border-radius:8px;border:1px solid var(--line)}
.sns-comp-r{display:grid;gap:12px;min-width:0;position:sticky;top:0}
.sns-pv{display:grid;gap:8px;min-width:0;padding:10px 12px;border:1px solid var(--line);border-radius:var(--r);background:var(--surface-2)}
.sns-pv-h{display:flex;flex-wrap:wrap;align-items:center;gap:6px 8px}
.sns-pv-h b{font-size:14px;margin-right:auto}
.sns-pv-body{max-height:230px;overflow:auto;padding:8px 10px;border:1px solid var(--line);border-radius:8px;background:var(--surface);font-size:13.5px;line-height:1.7;white-space:pre-wrap;overflow-wrap:anywhere}
.sns-pv-title{font-weight:700;margin-bottom:4px}
.sns-pv-cut{color:var(--gosu);font-weight:700}
.sns-pv-rest{color:var(--ink-3)}
.sns-pv-tags{color:var(--gosu)}
.sns-pv-warn{margin:0;padding-left:1.2em;font-size:12.5px;color:var(--bad)}
.sns-pv-note{font-size:12px;color:var(--ink-3)}
.sns-empty-pv{font-size:13px;color:var(--ink-3);padding:14px;border:1px dashed var(--line-strong);border-radius:var(--r);text-align:center}
.sns-tpl{display:grid;gap:8px}
.sns-tpl button{display:grid;gap:2px;width:100%;padding:10px 12px;border:1px solid var(--line);border-radius:8px;background:var(--surface);font:inherit;color:var(--ink);text-align:left;cursor:pointer}
.sns-tpl button:hover{background:var(--surface-2);border-color:var(--line-strong)}
.sns-tpl span{font-size:12.5px;color:var(--ink-3)}
.sns-ai-out{display:grid;gap:8px}
.sns-ai-card{display:grid;gap:6px;padding:10px 12px;border:1px solid var(--line);border-radius:8px;background:var(--surface-2)}
.sns-ai-card p{white-space:pre-wrap;font-size:13.5px}
.sns-set-row{display:grid;grid-template-columns:minmax(0,1fr) 110px auto;gap:8px;align-items:center}
.sns-set-tags{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:start;padding:10px;border:1px solid var(--line);border-radius:8px}
.sns-wd{display:flex;flex-wrap:wrap;gap:6px}
.sns-wd .chip,.sns-rh-pf .chip{min-height:34px;min-width:40px;justify-content:center}
.sns-rh-list{max-height:min(40vh,320px);overflow:auto}
@media (max-width:760px){
  .sns-comp{grid-template-columns:1fr}
  .sns-comp-r{position:static}
  .sns-filters{grid-template-columns:repeat(2,minmax(0,1fr))}
  .sns-filters .sns-q{grid-column:1/-1}
}
@media (max-width:640px){
  .sns-3col{grid-template-columns:repeat(2,minmax(0,1fr))}
  .sns-2col.sns-stack-sm{grid-template-columns:1fr}
  .sns-3col>:first-child{grid-column:1/-1}
  .sns-set-row{grid-template-columns:minmax(0,1fr) 84px auto}
  .sns-head-rh span,.sns-head-set span{display:none}
  .sns-head-rh,.sns-head-set{width:38px;min-width:38px;padding:0}
}
`);

  /* ───────── 画面 ───────── */
  Kit.app({
    id: 'sns', title: 'SNS投稿プランナー', group: 'gather', icon: 'megaphone', order: 21,
    desc: '投稿の下書き・文字数・予定をまとめて',
    docs: ['sns'],
    colls: ['posts'],
    async mount(root, params) {
      const S = {
        view: ['board', 'cal', 'list'].includes(Kit.pref.get('sns:view', 'board')) ? Kit.pref.get('sns:view', 'board') : 'board',
        cursor: todayS(), sel: todayS(),
        filter: Object.assign({ pf: '', st: '', pl: '', q: '' }, Kit.pref.get('sns:filter', {})),
        posts: [], cfg: normCfg(null), cfgSample: false, weekStart: 0, showAllPosted: false,
      };
      const mq = window.matchMedia('(max-width: 640px)');
      const compact = () => mq.matches;
      const canDrag = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;
      const imgCache = new Map();

      const rhBtn = Kit.btn('投稿リズムを作る', () => openRhythm(), { icon: 'calendar', class: 'sns-head-rh' });
      rhBtn.setAttribute('aria-label', '投稿リズムを作る');
      const setBtn = Kit.btn('柱とハッシュタグ', () => openSettings(), { icon: 'sliders', class: 'sns-head-set' });
      setBtn.setAttribute('aria-label', '柱とハッシュタグ');
      const sampleSlot = h('div');
      const bar = h('div', { class: 'toolbar sns-bar' });
      const viewBox = h('div', { class: 'sns-view' });
      const cards = h('div', { class: 'grid cols-3 sns-cards' });
      root.append(
        Kit.appHead({ title: 'SNS投稿プランナー', desc: '投稿のネタ・下書き・予定と文字数を、ひとつに', actions: [Kit.btn('投稿をつくる', () => openComposer(null), { kind: 'primary', icon: 'plus' }), rhBtn, setBtn] }),
        sampleSlot, bar, viewBox, cards);

      async function load() {
        const [posts, cfg, cal] = await Promise.all([
          Kit.store.list('posts', { sample: SAMPLE_POSTS }),
          Kit.store.get('sns', { sample: CFG_SAMPLE, blank: CFG_BLANK }),
          Kit.store.get('calendar', { blank: { weekStart: 0 } }),
        ]);
        S.posts = posts.map((p) => Object.assign(normPost(p), { id: p.id, createdAt: p.createdAt, updatedAt: p.updatedAt, sample: !!p.sample }));
        S.cfg = normCfg(cfg);
        S.cfgSample = !!(cfg && cfg._sample);
        S.weekStart = cal && +cal.weekStart === 1 ? 1 : 0;
      }
      const byId = (id) => S.posts.find((p) => p.id === id);
      const marks = (p) => h('span', { class: 'sns-marks', 'aria-label': p.platforms.map((x) => PF[x].label).join('・') || '投稿先なし' }, p.platforms.map((x) => h('span', { class: 'sns-mark', title: PF[x].label }, PF[x].mark)));
      const dateText = (p) => (p.date ? md(p.date) + (p.time ? ' ' + p.time : '') : '日付なし');
      const stChip = (st) => h('span', { class: 'chip ' + ST[st].chip }, ST[st].label);
      const sortPosts = (list, desc) => list.slice().sort((a, b) => {
        if (!a.date !== !b.date) return a.date ? -1 : 1;
        const k = (a.date + (a.time || '')).localeCompare(b.date + (b.time || ''));
        return (desc ? -k : k) || String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''));
      });
      const holiday = (s) => (window.MiseCalendar && window.MiseCalendar.holiday ? window.MiseCalendar.holiday(s) : '');

      /* ── 上の帯 ── */
      function renderSample() {
        Kit.clear(sampleSlot);
        if (!S.posts.some((p) => p.sample) && !S.cfgSample) return;
        sampleSlot.append(Kit.sampleBar('投稿の例（ひらめき数学舎）です。書きかえて使えます。', async () => {
          const ok = await Kit.confirm({ title: 'サンプルを片付けますか？', body: 'すべてのツールのサンプル（ひらめき数学舎の例）を消して、空の状態から始めます。自分で入れた投稿は消えません。', ok: '片付ける' });
          if (!ok) return;
          await Kit.store.samplesOff();
          Kit.toast('サンプルを片付けました');
        }));
      }
      function renderBar() {
        Kit.clear(bar);
        bar.append(Kit.seg([{ value: 'board', label: 'ボード' }, { value: 'cal', label: 'カレンダー' }, { value: 'list', label: '一覧' }], S.view, (v) => { S.view = v; Kit.pref.set('sns:view', v); renderBar(); renderView(); }, { label: '表示のしかた' }));
        if (S.view === 'cal') {
          bar.append(h('span', { class: 'spacer' }), h('div', { class: 'sns-nav' },
            Kit.btn('', () => moveMonth(-1), { icon: 'left', title: '前の月' }),
            Kit.btn('今月', () => { S.cursor = S.sel = todayS(); renderBar(); renderView(); }),
            Kit.btn('', () => moveMonth(1), { icon: 'right', title: '次の月' }),
            h('h2', { class: 'sns-month-title', 'aria-live': 'polite' }, Kit.fmtDate(S.cursor, 'YYYY年M月'))));
        }
      }
      function moveMonth(dir) {
        const c = Kit.parseYmd(S.cursor), d = new Date(c.getFullYear(), c.getMonth() + dir, 1);
        S.cursor = Kit.ymd(d);
        S.sel = Kit.ym(todayS()) === Kit.ym(d) ? todayS() : S.cursor;
        renderBar(); renderView();
      }

      /* ── ボード ── */
      function card(p) {
        const st = h('select', { class: 'sns-card-st', 'aria-label': '状態を変える', onclick: (e) => e.stopPropagation(), onchange: () => setStatus(p.id, st.value) }, STATUSES.map((s) => h('option', { value: s.id }, '状態：' + s.label)));
        st.value = p.status;
        const el = h('article', { class: 'sns-card', 'data-id': p.id, draggable: canDrag() },
          p.image ? h('img', { class: 'sns-thumb', alt: '', 'data-img': p.image }) : null,
          h('div', { class: 'sns-card-top' }, marks(p), h('span', { class: 'sns-date' + (p.date ? '' : ' is-none') }, dateText(p))),
          h('button', { type: 'button', class: 'sns-card-title', 'data-open': p.id }, postTitle(p)),
          h('div', { class: 'sns-card-meta' },
            p.pillar ? h('span', { class: 'chip' }, p.pillar) : null,
            p.status === 'posted' && hasMetrics(p) ? h('span', null, metricsText(p)) : null,
            p.sample ? h('span', { class: 'chip sample' }, 'サンプル') : null),
          st);
        el.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/plain', p.id); e.dataTransfer.effectAllowed = 'move'; el.classList.add('is-drag'); });
        el.addEventListener('dragend', () => el.classList.remove('is-drag'));
        return el;
      }
      function renderBoard() {
        const wrap = h('div', { class: 'sns-board-wrap' }), board = h('div', { class: 'sns-board' });
        for (const s of STATUSES) {
          let list = sortPosts(S.posts.filter((p) => p.status === s.id), s.id === 'posted');
          const total = list.length, cut = s.id === 'posted' && !S.showAllPosted && total > 8;
          if (cut) list = list.slice(0, 8);
          const col = h('section', { class: 'sns-col', 'data-status': s.id, 'aria-label': s.label },
            h('div', { class: 'sns-col-h' }, h('h3', null, s.label), h('span', { class: 'sns-col-n' }, total + '件'),
              Kit.btn('', () => openComposer(null, { status: s.id }), { icon: 'plus', sm: true, kind: 'ghost', title: s.label + 'に投稿を足す' })),
            list.length ? list.map(card) : h('div', { class: 'sns-col-empty' }, s.id === 'idea' ? '思いついたことを、まず1行で' : canDrag() ? 'ここにカードを動かせます' : 'まだありません'),
            cut ? Kit.btn('ほか' + (total - 8) + '件も見る', () => { S.showAllPosted = true; renderView(); }, { sm: true, kind: 'ghost', class: 'sns-more' }) : null);
          col.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; col.classList.add('is-over'); });
          col.addEventListener('dragleave', (e) => { if (!col.contains(e.relatedTarget)) col.classList.remove('is-over'); });
          col.addEventListener('drop', (e) => { e.preventDefault(); col.classList.remove('is-over'); const id = e.dataTransfer.getData('text/plain'); if (id) setStatus(id, s.id); });
          board.append(col);
        }
        wrap.append(board);
        return wrap;
      }
      async function setStatus(id, status) {
        const p = byId(id);
        if (!p || p.status === status) return;
        const it = Object.assign({}, p, { status });
        if (status === 'posted') { const t = todayS(); if (!it.date || it.date > t) it.date = t; if (!it.time) it.time = nowHM(); }
        delete it.sample;
        await Kit.store.put('posts', it);
        Kit.toast('「' + postTitle(it).slice(0, 20) + '」を' + ST[status].label + 'にしました' + (status === 'scheduled' && !it.date ? '（日付も入れておきましょう）' : ''));
      }

      /* ── カレンダー ── */
      function renderCal() {
        const c = Kit.parseYmd(S.cursor), first = new Date(c.getFullYear(), c.getMonth(), 1), last = new Date(c.getFullYear(), c.getMonth() + 1, 0);
        const from = add(first, -((first.getDay() - S.weekStart + 7) % 7));
        const weeks = Math.ceil((Kit.daysBetween(from, last) + 1) / 7), to = add(from, weeks * 7 - 1);
        const by = {};
        for (const p of sortPosts(S.posts.filter((x) => x.date && x.date >= from && x.date <= to))) (by[p.date] = by[p.date] || []).push(p);
        const box = h('div', null), month = h('div', { class: 'sns-month' }), small = compact(), t = todayS(), ym = Kit.ym(S.cursor);
        const dow = h('div', { class: 'sns-dow', 'aria-hidden': 'true' });
        for (let i = 0; i < 7; i++) { const w = (S.weekStart + i) % 7; dow.append(h('span', { class: w === 0 ? 'is-sun' : w === 6 ? 'is-sat' : '' }, Kit.WDAY[w])); }
        month.append(dow);
        for (let wk = from; wk <= to; wk = add(wk, 7)) {
          const row = h('div', { class: 'sns-week' });
          for (let i = 0; i < 7; i++) {
            const s = add(wk, i), d = Kit.parseYmd(s), list = by[s] || [], hol = holiday(s), w = d.getDay();
            const cls = 'sns-day' + (Kit.ym(s) === ym ? '' : ' is-out') + (s === t ? ' is-today' : '') + (w === 0 ? ' is-sun' : w === 6 ? ' is-sat' : '') + (hol ? ' is-hol' : '');
            const n = d.getDate() === 1 ? (d.getMonth() + 1) + '/1' : String(d.getDate());
            if (small) {
              row.append(h('button', { type: 'button', class: cls + ' sns-dayc' + (s === S.sel ? ' is-sel' : ''), 'data-date': s, 'aria-pressed': String(s === S.sel), 'aria-label': Kit.fmtDate(s, 'M月D日(W)') + (list.length ? '　投稿' + list.length + '件' : '') },
                h('span', { class: 'sns-dnum' }, n), list.length ? h('span', { class: 'sns-dots' }, list.slice(0, 4).map((p) => h('i', { class: 'st-' + p.status }))) : null));
            } else {
              const shown = list.length > 4 ? list.slice(0, 3) : list;
              row.append(h('div', { class: cls, 'data-date': s },
                h('div', { class: 'sns-dhead' }, h('button', { type: 'button', class: 'sns-dnum', 'data-new': s, 'aria-label': Kit.fmtDate(s, 'M月D日(W)') + 'に投稿をつくる', title: 'この日に投稿をつくる' }, n), hol ? h('span', { class: 'sns-hol', title: hol }, hol) : null),
                shown.map((p) => h('button', { type: 'button', class: 'sns-cp st-' + p.status, 'data-open': p.id, title: [dateText(p), postTitle(p), ST[p.status].label, p.sample ? 'サンプル' : ''].filter(Boolean).join('\n') },
                  p.time ? h('span', { class: 't' }, p.time) : null, p.platforms.slice(0, 2).map((x) => h('span', { class: 'sns-mark' }, PF[x].mark)), h('span', { class: 'n' }, postTitle(p)), p.sample ? h('span', { class: 'sns-s' }, '例') : null)),
                list.length > shown.length ? h('button', { type: 'button', class: 'btn ghost sm', 'data-sel': s, style: { alignSelf: 'flex-start', minHeight: '22px', padding: '0 6px', fontSize: '11.5px' } }, 'ほか' + (list.length - shown.length) + '件') : null));
            }
          }
          month.append(row);
        }
        box.append(month, h('div', { class: 'sns-legend', 'aria-label': '色の意味' }, STATUSES.map((st) => h('span', null, h('i', { class: 'st-' + st.id }), st.label))));
        // スマホ：押した日の投稿を下に
        if (small) {
          const list = by[S.sel] || [];
          box.append(h('section', { class: 'sns-daylist', 'aria-label': Kit.fmtDate(S.sel, 'M月D日') + 'の投稿' },
            h('div', { class: 'sns-daylist-h' }, h('h3', null, Kit.fmtDate(S.sel, 'M月D日(W)')), holiday(S.sel) ? h('span', { class: 'sns-hol', style: { fontSize: '12.5px' } }, holiday(S.sel)) : null, h('span', { class: 'grow' }),
              Kit.btn('この日に投稿をつくる', () => openComposer(null, { date: S.sel, status: 'draft' }), { sm: true, icon: 'plus' })),
            list.length ? h('div', { class: 'sns-rows' }, list.map(row)) : h('p', { class: 'small muted' }, '投稿の予定はありません。')));
        }
        const undated = sortPosts(S.posts.filter((p) => !p.date && p.status !== 'posted'));
        if (undated.length) box.append(h('section', { class: 'sns-undated' }, h('h3', null, '日付が決まっていない投稿（' + undated.length + '件）'), h('div', { class: 'sns-rows' }, undated.slice(0, 12).map(row))));
        return box;
      }
      function row(p) {
        return h('button', { type: 'button', class: 'sns-row st-' + p.status, 'data-open': p.id },
          h('span', { class: 'sns-row-t' }, postTitle(p)), stChip(p.status),
          h('span', { class: 'sns-row-m' }, marks(p), h('span', null, dateText(p)), p.pillar ? h('span', null, p.pillar) : null, p.sample ? h('span', { class: 'chip sample' }, 'サンプル') : null));
      }

      /* ── 一覧 ── */
      function renderList() {
        const f = S.filter;
        const save = () => { Kit.pref.set('sns:filter', f); drawRows(); };
        const sel = (id, label, opts, k) => { const s = h('select', { id }, h('option', { value: '' }, label + '：すべて'), opts.map(([v, l]) => h('option', { value: v }, l))); s.value = f[k] || ''; s.addEventListener('change', () => { f[k] = s.value; save(); }); return s; };
        const q = h('input', { type: 'search', id: 'sns-q', placeholder: '言葉でさがす（本文・タイトル・タグ）', value: f.q || '' });
        q.addEventListener('input', Kit.debounce(() => { f.q = q.value.trim(); save(); }, 200));
        const pls = [...new Set(S.cfg.pillars.map((p) => p.name).concat(S.posts.map((p) => p.pillar).filter(Boolean)))];
        const filters = h('div', { class: 'sns-filters' },
          Kit.field({ label: '投稿先', input: sel('sns-f-pf', '投稿先', PLATFORMS.map((p) => [p.id, p.label]), 'pf') }),
          Kit.field({ label: '状態', input: sel('sns-f-st', '状態', STATUSES.map((s) => [s.id, s.label]), 'st') }),
          Kit.field({ label: '投稿の柱', input: sel('sns-f-pl', '柱', pls.map((p) => [p, p]), 'pl') }),
          Kit.field({ label: 'さがす', input: q, class: 'sns-q' }));
        const tbody = h('tbody'), count = h('p', { class: 'small muted', style: { margin: '0 0 6px' } });
        const drawRows = () => {
          Kit.clear(tbody);
          const words = (f.q || '').toLowerCase().split(/\s+/).filter(Boolean);
          const list = sortPosts(S.posts.filter((p) => (!f.pf || p.platforms.includes(f.pf)) && (!f.st || p.status === f.st) && (!f.pl || p.pillar === f.pl)
            && words.every((w) => (p.title + '\n' + p.text + '\n' + p.tags.join(' ') + '\n' + p.memo).toLowerCase().includes(w))), true);
          count.textContent = list.length + '件' + (list.length !== S.posts.length ? '（全' + S.posts.length + '件中）' : '');
          if (!list.length) tbody.append(h('tr', null, h('td', { colspan: 6, class: 'muted', style: { textAlign: 'center', padding: '24px' } }, S.posts.length ? '条件に合う投稿はありません。' : 'まだ投稿がありません。「投稿をつくる」から始めましょう。')));
          for (const p of list) {
            tbody.append(h('tr', null,
              h('td', { class: 'nowrap num' }, p.date ? md(p.date) : '—', p.time ? h('div', { class: 'small muted' }, p.time) : null),
              h('td', null, stChip(p.status)),
              h('td', null, marks(p)),
              h('td', { style: { minWidth: '220px' } }, h('button', { type: 'button', class: 't', 'data-open': p.id }, postTitle(p)), p.title && p.text ? h('div', { class: 'sub' }, p.text.split('\n').find((x) => x.trim()) || '') : null, p.sample ? h('span', { class: 'chip sample', style: { marginTop: '4px' } }, 'サンプル') : null),
              h('td', { class: 'nowrap' }, p.pillar || h('span', { class: 'muted' }, '—')),
              h('td', { class: 'nowrap small' }, hasMetrics(p) ? metricsText(p) : h('span', { class: 'muted' }, '—'))));
          }
        };
        drawRows();
        return h('div', null, filters, count, h('div', { class: 'tbl-wrap' }, h('table', { class: 'tbl sns-tbl' }, h('thead', null, h('tr', null, ['日付', '状態', '投稿先', '内容', '柱', '反応'].map((x) => h('th', null, x)))), tbody)));
      }

      /* ── 下のカード：柱のバランス・反応のよかった投稿・時間の目安 ── */
      function renderCards() {
        Kit.clear(cards);
        const t = todayS(), from = add(t, -29);
        const recent = S.posts.filter((p) => p.date && p.date >= from && p.date <= t && p.status !== 'idea');
        const sumT = Kit.sum(S.cfg.pillars, (p) => p.target) || 1;
        const pl = h('div', { class: 'sns-pl' });
        if (!S.cfg.pillars.length) pl.append(h('p', { class: 'small muted' }, '「柱とハッシュタグ」で、投稿の柱を決めてください。'));
        else if (!recent.length) pl.append(h('p', { class: 'small muted' }, 'この30日に日付の入った投稿がまだありません。下書き・予約・投稿済みが入ると、目標とのちがいが見えます。'));
        S.cfg.pillars.forEach((x, i) => {
          if (!recent.length) return;
          const n = recent.filter((p) => p.pillar === x.name).length, pct = n / recent.length, goal = x.target / sumT;
          const diff = Math.round((pct - goal) * 100);
          pl.append(h('div', { class: 'sns-pl-row' },
            h('div', { class: 'sns-pl-top' }, h('b', null, x.name), h('span', null, n + '件・' + Kit.pct(pct) + '（目標 ' + Kit.pct(goal) + '）')),
            h('div', { class: 'meter sns-meter', role: 'img', 'aria-label': x.name + ' ' + Kit.pct(pct) + '、目標 ' + Kit.pct(goal) },
              h('i', { style: { width: Math.round(pct * 100) + '%', background: 'var(--series-' + ((i % 8) + 1) + ')' } }),
              h('span', { class: 'goal', style: { left: Math.round(goal * 100) + '%' } })),
            Math.abs(diff) >= 10 ? h('div', { class: 'sns-pl-note' }, diff < 0 ? '目標より少なめ（' + -diff + 'ポイント）' : '目標より多め（' + diff + 'ポイント）') : null));
        });
        const other = recent.filter((p) => !S.cfg.pillars.some((x) => x.name === p.pillar)).length;
        if (recent.length && other) pl.append(h('p', { class: 'small muted' }, '柱が決まっていない投稿：' + other + '件'));
        const top = S.posts.filter((p) => p.status === 'posted' && hasMetrics(p)).sort((a, b) => score(b) - score(a) || (num(b.metrics.reach) || 0) - (num(a.metrics.reach) || 0)).slice(0, 5);
        cards.append(
          h('section', { class: 'card' }, h('div', { class: 'card-h' }, h('h2', null, '投稿の柱のバランス'), h('span', { class: 'small muted' }, '直近30日')), pl,
            recent.length ? h('p', { class: 'small muted', style: { marginTop: '10px' } }, '縦の線が目標です。少ない柱から次のネタを考えましょう。') : null),
          h('section', { class: 'card' }, h('div', { class: 'card-h' }, h('h2', null, '反応のよかった投稿')),
            top.length ? h('div', { class: 'sns-top-list' }, top.map((p) => h('button', { type: 'button', class: 'sns-top-it', 'data-open': p.id }, h('b', null, postTitle(p)), h('span', null, [md(p.date), p.pillar, metricsText(p)].filter(Boolean).join('　')))))
              : h('p', { class: 'small muted' }, '投稿済みの投稿を開いて、いいね・保存・リーチを入れると、ここに並びます。'),
            top.length ? h('p', { class: 'small muted', style: { marginTop: '8px' } }, '保存は「あとで見返したい」のしるし。いいねより2倍で数えています。') : null),
          h('section', { class: 'card' }, h('div', { class: 'card-h' }, h('h2', null, '投稿の時間の目安'), h('span', { class: 'chip' }, '目安')),
            h('ul', { class: 'sns-times' }, h('li', null, '平日：朝 7〜8時／昼 12時ごろ／夜 20〜22時'), h('li', null, '土日：9〜11時')),
            h('p', { class: 'small muted', style: { marginTop: '8px' } }, '見てくれる人の暮らしによって変わります。インサイト（反応のあった時間）を見ながら調整してください。')));
      }

      function renderView() {
        Kit.clear(viewBox);
        if (!S.posts.length) viewBox.append(h('p', { class: 'sns-hint' }, 'まだ投稿がありません。「投稿をつくる」で1本書くか、「投稿リズムを作る」で、これから数週間のネタ枠を先に置いてみましょう。'));
        viewBox.append(S.view === 'board' ? renderBoard() : S.view === 'cal' ? renderCal() : renderList());
        for (const im of viewBox.querySelectorAll('img[data-img]')) {
          const ref = im.dataset.img;
          if (imgCache.has(ref)) im.src = imgCache.get(ref);
          else Kit.img.resolve(ref).then((u) => { imgCache.set(ref, u); if (u) im.src = u; else im.remove(); });
        }
      }
      function renderAll() { renderSample(); renderBar(); renderView(); renderCards(); }

      root.addEventListener('click', (e) => {
        const o = e.target.closest('[data-open]');
        if (o) { const p = byId(o.dataset.open); if (p) openComposer(p); return; }
        const nw = e.target.closest('[data-new]');
        if (nw) { openComposer(null, { date: nw.dataset.new, status: 'draft' }); return; }
        const sl = e.target.closest('[data-sel]');
        if (sl) { openDay(sl.dataset.sel); return; }
        // スマホのカレンダー：押した日を選ぶ（日のマスはボタン）
        const pick = e.target.closest('.sns-dayc[data-date]');
        if (pick) { S.sel = pick.dataset.date; renderView(); const b = viewBox.querySelector('.sns-dayc[data-date="' + S.sel + '"]'); if (b) b.focus(); return; }
        if (e.target.closest('select, button, a, input')) return;
        const cd = e.target.closest('.sns-card[data-id]');
        if (cd) { const p = byId(cd.dataset.id); if (p) openComposer(p); return; }
        const day = e.target.closest('.sns-day[data-date]');
        if (day && S.view === 'cal') openComposer(null, { date: day.dataset.date, status: 'draft' });
      });
      function openDay(s) {
        const list = sortPosts(S.posts.filter((p) => p.date === s));
        const box = h('div', { class: 'sns-rows' }, list.map(row));
        const m = Kit.modal({ title: Kit.fmtDate(s, 'M月D日(W)') + 'の投稿', body: box, actions: [{ label: '閉じる', kind: 'ghost' }, { label: 'この日に投稿をつくる', kind: 'primary', onClick: () => { setTimeout(() => openComposer(null, { date: s, status: 'draft' }), 0); } }] });
        box.addEventListener('click', (e) => { const b = e.target.closest('[data-open]'); if (!b) return; e.stopPropagation(); const p = byId(b.dataset.open); m.close(); setTimeout(() => p && openComposer(p), 0); });
      }

      /* ── 投稿をつくる・直す ── */
      function openComposer(src, preset) {
        const isNew = !src;
        const d = normPost(isNew ? Object.assign({ platforms: S.cfg.platforms.length ? S.cfg.platforms.slice() : ['instagram'], status: 'draft' }, preset || {}) : src);
        let dirty = false;
        // この画面で入れた画像（保存しなかった・差しかえた分は、あとで消す）
        const added = [];
        const dropImages = (keep) => { for (const ref of added) if (ref !== keep) Kit.store.remove('images', ref.slice(4)); added.length = 0; };
        const touch = () => { dirty = true; prev(); };
        // 投稿先
        const pfBox = h('div', { class: 'sns-pfs', role: 'group', 'aria-label': '投稿先' });
        const drawPf = () => {
          Kit.clear(pfBox);
          for (const p of PLATFORMS) pfBox.append(h('button', { type: 'button', class: 'chip', 'aria-pressed': String(d.platforms.includes(p.id)), onclick: () => { d.platforms = d.platforms.includes(p.id) ? d.platforms.filter((x) => x !== p.id) : PLATFORMS.map((x) => x.id).filter((x) => x === p.id || d.platforms.includes(x)); drawPf(); touch(); syncTitleHint(); } }, p.label));
        };
        drawPf();
        const title = h('input', { type: 'text', id: 'sns-f-title', placeholder: '例：三角形の内角の和はなぜ180°？', maxlength: 200 });
        title.value = d.title;
        const titleHint = h('div', { class: 'hint' });
        const syncTitleHint = () => { titleHint.textContent = d.platforms.some((x) => x === 'note' || x === 'youtube') ? 'note・YouTube ではタイトルとして使います（YouTube は100字まで、note は40字以内がおすすめ）。' : '一覧で見分けるための名前です（投稿の本文には入りません）。'; };
        syncTitleHint();
        title.addEventListener('input', () => { d.title = title.value; touch(); });
        const text = h('textarea', { id: 'sns-f-text', class: 'sns-text', rows: 10, placeholder: '投稿の本文。「型から書く」で、ひな形から始められます。' });
        text.value = d.text;
        text.addEventListener('input', () => { d.text = text.value; touch(); });
        const setText = (v) => { d.text = v; text.value = v; touch(); };
        // ハッシュタグ
        const tagBox = h('div', { class: 'sns-tags' });
        const tagIn = h('input', { type: 'text', id: 'sns-f-tag', placeholder: d.tags.length ? 'タグを足す' : 'タグを入れて Enter（# はなくてOK）', autocomplete: 'off', enterkeyhint: 'enter' });
        const tagCount = h('span', { class: 'small muted' });
        const drawTags = () => {
          Kit.clear(tagBox);
          d.tags.forEach((t, i) => tagBox.append(h('span', { class: 'chip blue sns-tag' }, '#' + t,
            h('button', { type: 'button', class: 'sns-tag-x', title: '#' + t + ' を外す', 'aria-label': '#' + t + ' を外す', onclick: () => { d.tags.splice(i, 1); drawTags(); touch(); tagIn.focus(); } }, Kit.icon('close')))));
          tagBox.append(tagIn);
          tagCount.textContent = d.tags.length + '個' + (d.platforms.includes('instagram') ? '（Instagram は30個まで）' : '');
        };
        const addTags = (str) => {
          const parts = String(str || '').split(/[\s,、，#＃]+/).map((x) => x.trim()).filter(Boolean);
          let n = 0;
          for (const x of parts) if (!d.tags.includes(x)) { d.tags.push(x); n++; }
          if (n) { drawTags(); touch(); }
          return n;
        };
        tagIn.addEventListener('keydown', (e) => {
          if (e.isComposing || e.keyCode === 229) return;
          if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); if (tagIn.value.trim()) { addTags(tagIn.value); tagIn.value = ''; tagIn.focus(); } }
          else if (e.key === 'Backspace' && !tagIn.value && d.tags.length) { d.tags.pop(); drawTags(); touch(); tagIn.focus(); }
        });
        tagIn.addEventListener('input', (e) => { if (!e.isComposing && /[\s,、，]/.test(tagIn.value)) { addTags(tagIn.value); tagIn.value = ''; tagIn.focus(); } });
        tagIn.addEventListener('blur', () => { if (tagIn.value.trim()) { addTags(tagIn.value); tagIn.value = ''; } });
        tagBox.addEventListener('click', (e) => { if (e.target === tagBox) tagIn.focus(); });
        drawTags();
        const setSel = h('select', { id: 'sns-f-tagset', 'aria-label': '保存したセットから入れる' }, h('option', { value: '' }, S.cfg.tagSets.length ? 'セットから入れる' : '（セットはまだありません）'), S.cfg.tagSets.map((t, i) => h('option', { value: String(i) }, t.name + '（' + t.tags.length + '）')));
        setSel.addEventListener('change', () => { const t = S.cfg.tagSets[+setSel.value]; if (t) { const n = addTags(t.tags.join(' ')); Kit.toast(n ? '「' + t.name + '」から' + n + '個入れました' : 'そのタグはもう入っています'); } setSel.value = ''; });
        setSel.style.width = 'auto';
        const aiTagsOut = h('div', { class: 'sns-pfs' });
        const aiTags = Kit.ai.button('ハッシュタグ案', async () => {
          if (!d.text.trim() && !d.title.trim()) { Kit.toast('先に本文かタイトルを書いてください', { type: 'bad' }); return; }
          const res = await Kit.ai.ask((await Kit.ai.context()) + '\n\n次の投稿に合うハッシュタグを12個まで提案してください。日本語中心で、大きなタグと小さめのタグをまぜてください。「#」は付けないでください。\nJSON の配列だけを返してください。例：["数学", "勉強法"]\n---\n' + (d.title ? d.title + '\n' : '') + d.text, { json: true });
          const list = [...new Set((Array.isArray(res) ? res : []).map((x) => String(x).replace(/^[#＃]/, '').trim()).filter((x) => x && !d.tags.includes(x)))];
          Kit.clear(aiTagsOut);
          if (!list.length) { Kit.toast('案がうまく出ませんでした。もう一度どうぞ', { type: 'bad' }); return; }
          Kit.add(aiTagsOut, [h('span', { class: 'small muted' }, '押すと足せます：'), list.map((x) => h('button', { type: 'button', class: 'chip line', onclick: (e) => { addTags(x); e.currentTarget.remove(); } }, '#' + x))]);
        }, { sm: true });
        // 日時・状態・柱・画像・メモ
        const date = h('input', { type: 'date', id: 'sns-f-date' }), time = h('input', { type: 'time', id: 'sns-f-time', step: 300 });
        date.value = d.date; time.value = d.time;
        date.addEventListener('input', () => { d.date = date.value; touch(); });
        time.addEventListener('input', () => { d.time = time.value; touch(); });
        const status = h('select', { id: 'sns-f-status' }, STATUSES.map((s) => h('option', { value: s.id }, s.label)));
        status.value = d.status;
        status.addEventListener('change', () => { d.status = status.value; touch(); metricsBox.open = d.status === 'posted' || metricsBox.open; });
        const pillars = [...new Set(S.cfg.pillars.map((p) => p.name).concat(d.pillar ? [d.pillar] : []))];
        const pillar = h('select', { id: 'sns-f-pillar' }, h('option', { value: '' }, '（決めない）'), pillars.map((p) => h('option', { value: p }, p)));
        pillar.value = d.pillar;
        pillar.addEventListener('change', () => { d.pillar = pillar.value; touch(); });
        const imgBox = h('div', { class: 'sns-img' });
        const drawImg = async () => {
          Kit.clear(imgBox);
          if (d.image) {
            const u = await Kit.img.resolve(d.image);
            if (u) imgBox.append(h('img', { src: u, alt: '添付した画像' }));
            imgBox.append(Kit.btn('外す', () => { d.image = ''; drawImg(); touch(); }, { sm: true, kind: 'ghost', icon: 'trash' }));
          } else {
            imgBox.append(Kit.btn('画像をえらぶ', async () => {
              const fl = await Kit.img.pick();
              if (!fl) return;
              try { const it = await Kit.img.save(fl); d.image = 'img:' + it.id; added.push(d.image); imgCache.set(d.image, it.dataUrl); drawImg(); touch(); }
              catch (e) { Kit.toast((e && e.message) || '画像を読み込めませんでした', { type: 'bad' }); }
            }, { sm: true, icon: 'image' }));
          }
        };
        drawImg();
        const memo = h('textarea', { id: 'sns-f-memo', rows: 2, placeholder: '写真のアイデア・参考にしたいことなど' });
        memo.value = d.memo;
        memo.addEventListener('input', () => { d.memo = memo.value; dirty = true; });
        const mIn = (k, label) => { const i = h('input', { type: 'number', id: 'sns-f-' + k, min: 0, inputmode: 'numeric' }); i.value = d.metrics[k] == null ? '' : d.metrics[k]; i.addEventListener('input', () => { d.metrics[k] = num(i.value); dirty = true; }); return Kit.field({ label, input: i }); };
        const metricsBox = h('details', { class: 'help', open: d.status === 'posted' }, h('summary', null, '反応（投稿したあとで）'),
          h('div', { class: 'sns-3col', style: { marginTop: '10px' } }, mIn('likes', 'いいね'), mIn('saves', '保存'), mIn('reach', 'リーチ')));
        // 本文の道具
        const tplBtn = Kit.btn('型から書く', () => openTemplates(), { sm: true, icon: 'layers' });
        const aiDraft = Kit.ai.button('AIで下書き', async () => openAiDraft(), { sm: true });
        const aiShort = Kit.ai.button('X用に短くする', async () => shortenForX(), { sm: true });
        const left = h('div', { class: 'sns-comp-l' },
          isNew || !src.sample ? null : h('p', { class: 'small', style: { color: 'var(--shu)' } }, h('span', { class: 'chip sample' }, 'サンプル'), '　例の投稿です。書きかえて保存すると、自分の投稿になります。'),
          h('div', { class: 'field' }, h('label', null, '投稿先'), pfBox),
          h('div', { class: 'field' }, h('label', { for: 'sns-f-title' }, 'タイトル'), title, titleHint),
          h('div', { class: 'field' }, h('div', { class: 'sns-lrow' }, h('label', { for: 'sns-f-text' }, '本文'), tplBtn, aiDraft, aiShort), text),
          h('div', { class: 'field' }, h('div', { class: 'sns-lrow' }, h('label', { for: 'sns-f-tag' }, 'ハッシュタグ'), tagCount), tagBox, h('div', { class: 'sns-lrow' }, setSel, aiTags), aiTagsOut),
          h('div', { class: 'sns-3col' }, Kit.field({ label: '日付', input: date }), Kit.field({ label: '時刻', input: time }), Kit.field({ label: '状態', input: status })),
          h('div', { class: 'sns-2col' }, Kit.field({ label: '投稿の柱', input: pillar }), h('div', { class: 'field' }, h('label', null, '画像'), imgBox)),
          Kit.field({ label: 'メモ（投稿には入りません）', input: memo }),
          metricsBox);
        // 投稿先ごとの見え方
        const right = h('div', { class: 'sns-comp-r', 'aria-label': '投稿先ごとの見え方' });
        const prev = Kit.debounce(() => drawPrev(), 120);
        const drawPrev = () => {
          Kit.clear(right);
          right.append(h('div', { class: 'sns-lrow' }, h('b', { style: { fontSize: '14px', marginRight: 'auto' } }, '投稿先ごとの見え方'), h('span', { class: 'sns-pv-note' }, 'コピーして各アプリに貼りつけます')));
          if (!d.platforms.length) { right.append(h('div', { class: 'sns-empty-pv' }, '投稿先をえらぶと、ここに文字数と見え方が出ます。')); }
          for (const id of d.platforms) {
            const p = PF[id], c = check(id, d);
            const body = h('div', { class: 'sns-pv-body', tabindex: 0, 'aria-label': p.label + 'の見え方' });
            if ((id === 'youtube' || id === 'note') && d.title.trim()) body.append(h('div', { class: 'sns-pv-title' }, d.title.trim()));
            const txt = String(d.text || '').replace(/\s+$/, '');
            if (id === 'instagram') {
              const a = Array.from(txt);
              if (a.length > 125) body.append(a.slice(0, 125).join(''), h('span', { class: 'sns-pv-cut' }, '…続きを読む'), h('span', { class: 'sns-pv-rest' }, a.slice(125).join('')));
              else body.append(txt);
              if (d.tags.length) body.append(h('div', { class: 'sns-pv-tags', style: { marginTop: '10px' } }, tagLine(d.tags)));
            } else if (id === 'note') {
              body.append(txt);
              if (d.tags.length) body.append(h('div', { class: 'sns-pv-tags', style: { marginTop: '10px' } }, tagLine(d.tags)));
            } else {
              body.append(txt);
              if (p.tags === 'end' && d.tags.length) body.append(h('span', { class: 'sns-pv-tags' }, (txt ? '\n\n' : '') + tagLine(d.tags)));
            }
            if (!txt && !(d.tags.length && p.tags !== 'none')) body.append(h('span', { class: 'muted' }, '（本文がまだありません）'));
            const copyBtns = [Kit.btn('コピー', () => (c.body ? Kit.copy(c.body, p.label + '用の文をコピーしました') : Kit.toast('コピーする文がありません', { type: 'bad' })), { sm: true, icon: 'copy', title: p.label + '用の文をコピー' })];
            if ((id === 'instagram' || id === 'note') && d.tags.length) copyBtns.push(Kit.btn('タグだけ', () => Kit.copy(tagLine(d.tags), 'タグをコピーしました'), { sm: true, kind: 'ghost' }));
            if ((id === 'youtube' || id === 'note') && d.title.trim()) copyBtns.unshift(Kit.btn('タイトル', () => Kit.copy(d.title.trim(), 'タイトルをコピーしました'), { sm: true, kind: 'ghost' }));
            right.append(h('section', { class: 'sns-pv', 'data-pf': id },
              h('div', { class: 'sns-pv-h' }, h('b', null, p.label), h('span', { class: 'chip ' + c.level, 'data-count': id }, c.label), copyBtns),
              body,
              id === 'x' ? h('div', { class: 'sns-pv-note' }, '全角1字＝2、半角1字＝1、URLは1つ23で数えます（タグもふくむ）。') : null,
              id === 'instagram' ? h('div', { class: 'sns-pv-note' }, 'フィードでは最初の125字くらいまで見えます（目安）。大事なことは前のほうに。タグはキャプションの最後か、最初のコメントに。') : null,
              id === 'line' ? h('div', { class: 'sns-pv-note' }, 'LINE ではハッシュタグを入れていません。') : null,
              id === 'note' ? h('div', { class: 'sns-pv-note' }, '文字数の上限はありません。タグは note の「ハッシュタグ」欄へ。') : null,
              c.warns.length ? h('ul', { class: 'sns-pv-warn' }, c.warns.map((w) => h('li', null, w))) : null));
          }
          if (d.status !== 'posted') right.append(h('div', { class: 'btn-row' }, Kit.btn('投稿済みにする', () => markPosted(), { kind: 'accent', icon: 'check' }), h('span', { class: 'small muted' }, '今日の日付で記録します')));
        };
        drawPrev();
        const body = h('div', { class: 'sns-comp' }, left, right);
        // 保存・消す・閉じる
        const collect = () => {
          const it = Object.assign({}, isNew ? {} : src, Kit.clone(d));
          it.title = String(it.title || '').trim(); it.memo = String(it.memo || '').trim();
          it.text = String(it.text || '').replace(/\s+$/, '');
          delete it.sample;
          return it;
        };
        const save = async () => {
          if (tagIn.value.trim()) { addTags(tagIn.value); tagIn.value = ''; }
          const it = collect();
          if (!it.title && !it.text.trim()) { Kit.toast('タイトルか本文を入れてください', { type: 'bad' }); title.focus(); return false; }
          if (it.status === 'scheduled' && !it.date) { Kit.toast('予約にするには、日付を入れてください', { type: 'bad' }); date.focus(); return false; }
          if (it.status === 'posted' && !it.date) it.date = todayS();
          await Kit.store.put('posts', it);
          // 外した・差しかえた画像を片付ける
          dropImages(it.image);
          if (!isNew && src.image && src.image !== it.image && String(src.image).startsWith('img:')) Kit.store.remove('images', src.image.slice(4));
          dirty = false;
          Kit.toast(isNew ? '投稿を保存しました' : '保存しました');
          return true;
        };
        const markPosted = async () => {
          const t = todayS();
          d.status = 'posted';
          if (!d.date || d.date > t) d.date = t;
          if (!d.time) d.time = nowHM();
          if (await save()) { m.close(); Kit.toast('投稿済みにしました。反応（いいね・保存）は、あとで開いて入れられます'); }
          else d.status = status.value;
        };
        const del = async () => {
          const ok = await Kit.confirm({ title: 'この投稿を消しますか？', body: '「' + postTitle(src).slice(0, 30) + '」を消します。', ok: '消す', danger: true });
          if (!ok) return false;
          dropImages(null);
          const imgId = String(src.image || '').startsWith('img:') ? src.image.slice(4) : '';
          const img = imgId ? await Kit.img.get(imgId) : null;
          await Kit.store.remove('posts', src.id);
          if (img) await Kit.store.remove('images', imgId);
          Kit.toast('投稿を消しました', { action: { label: '元に戻す', onClick: async () => { if (img) await Kit.store.put('images', img); Kit.store.put('posts', src); } } });
          return true;
        };
        const cancel = async () => {
          if (dirty && !(await Kit.confirm({ title: '保存せずに閉じますか？', body: '書きかえた内容は残りません。', ok: '閉じる', cancel: '戻る', danger: true }))) return false;
          dropImages(null);
          return true;
        };
        const actions = (isNew ? [] : [{ label: '消す', kind: 'danger', onClick: del }]).concat([{ label: 'やめる', kind: 'ghost', onClick: cancel }, { label: '保存する', kind: 'primary', onClick: save }]);
        const m = Kit.modal({ title: isNew ? '投稿をつくる' : '投稿を直す', body, actions, wide: true, dismissable: false });
        const delBtn = m.el.querySelector('.modal-f .btn.danger');
        if (delBtn) delBtn.style.marginRight = 'auto';
        m.el.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); cancel().then((ok) => { if (ok) m.close(); }); } });

        // 型から書く
        function openTemplates() {
          const list = h('div', { class: 'sns-tpl' });
          const tm = Kit.modal({ title: '投稿の型をえらぶ', body: h('div', { class: 'stack' }, h('p', { class: 'small ink-2' }, '◯◯ のところを書きかえて使います。'), list), actions: [{ label: 'やめる', kind: 'ghost' }] });
          for (const t of TEMPLATES) {
            list.append(h('button', { type: 'button', onclick: async () => {
              tm.close();
              const apply = (mode) => {
                setText(mode === 'append' && d.text.trim() ? d.text.replace(/\s+$/, '') + '\n\n' + t.text : t.text);
                if (!d.pillar && S.cfg.pillars.some((p) => p.name === t.pillar)) { d.pillar = t.pillar; pillar.value = t.pillar; }
                text.focus();
                const i = text.value.indexOf('◯');
                if (i >= 0 && mode !== 'append') text.setSelectionRange(i, i + 2);
              };
              if (!d.text.trim()) { apply('replace'); return; }
              setTimeout(() => Kit.modal({ title: 'いまの本文はどうしますか？', body: '「' + t.name + '」の型を入れます。', actions: [{ label: 'やめる', kind: 'ghost' }, { label: '後ろに足す', onClick: () => apply('append') }, { label: '置きかえる', kind: 'primary', onClick: () => apply('replace') }] }), 0);
            } }, h('b', null, t.name), h('span', null, t.desc + '（' + t.text.split('\n')[0] + '…）')));
          }
        }
        // AI：下書きを3つ
        function openAiDraft() {
          const topic = h('input', { type: 'text', id: 'sns-ai-topic', placeholder: '例：三角形の内角の和を、紙をちぎって確かめる' });
          topic.value = d.title || '';
          const pfSel = h('select', { id: 'sns-ai-pf' }, PLATFORMS.map((p) => h('option', { value: p.id }, p.label)));
          pfSel.value = d.platforms[0] || 'instagram';
          const tone = h('select', { id: 'sns-ai-tone' }, ['やわらかく親しみやすく', 'ていねいで落ち着いた', '元気で明るい', '短く、要点だけ'].map((x) => h('option', { value: x }, x)));
          const out = h('div', { class: 'sns-ai-out' });
          const go = Kit.ai.button('案を3つつくる', async () => {
            if (!topic.value.trim()) { Kit.toast('テーマを入れてください', { type: 'bad' }); topic.focus(); return; }
            const p = PF[pfSel.value];
            const lim = p.weighted ? '全角で120字以内（タグは別）' : p.limit ? p.limit + '字以内' : '800字くらいまで';
            const res = await Kit.ai.ask((await Kit.ai.context()) + '\n\n次のテーマで、' + p.label + 'に投稿する文章の案を3つ作ってください。\nテーマ：' + topic.value.trim() + '\nトーン：' + tone.value + '\n条件：\n- 長さは' + lim + '\n- 絵文字は使っても2個まで\n- 大げさな表現や、効果の約束はしない\n- ハッシュタグは本文に入れず、tags に「#」なしで3〜8個\n次の形の JSON だけを返してください：[{"text": "本文", "tags": ["タグ1", "タグ2"]}]\n例：[{"text": "三角形の内角の和は、なぜ180°なのでしょう？…", "tags": ["数学", "中学数学"]}]', { json: true });
            const list = (Array.isArray(res) ? res : []).filter((x) => x && x.text).slice(0, 3);
            Kit.clear(out);
            if (!list.length) { Kit.toast('案がうまく出ませんでした。もう一度どうぞ', { type: 'bad' }); return; }
            list.forEach((x, i) => {
              const tags = (Array.isArray(x.tags) ? x.tags : []).map((t) => String(t).replace(/^[#＃]/, '').trim()).filter(Boolean);
              out.append(h('div', { class: 'sns-ai-card' }, h('b', null, '案' + (i + 1)), h('p', null, String(x.text)), tags.length ? h('div', { class: 'small', style: { color: 'var(--gosu)' } }, tagLine(tags)) : null,
                h('div', { class: 'btn-row' }, Kit.btn('この案を使う', () => {
                  setText(String(x.text)); addTags(tags.join(' '));
                  am.close(); Kit.toast('本文に入れました。自分の言葉に直して使ってください');
                }, { sm: true, kind: 'primary' }))));
            });
          });
          const am = Kit.modal({ title: 'AIで下書き', wide: true, body: h('div', { class: 'stack' }, Kit.field({ label: 'テーマ（何について書くか）', input: topic }), h('div', { class: 'sns-2col' }, Kit.field({ label: '投稿先', input: pfSel }), Kit.field({ label: 'トーン', input: tone })), h('div', null, go), out), actions: [{ label: '閉じる', kind: 'ghost' }] });
        }
        // AI：X用に短く
        async function shortenForX() {
          if (!d.text.trim()) { Kit.toast('先に本文を書いてください', { type: 'bad' }); return; }
          const tagW = d.tags.length ? xLength('\n\n' + tagLine(d.tags)) : 0;
          const budget = Math.max(40, Math.floor((280 - tagW) / 2) - 6);
          const ta = h('textarea', { id: 'sns-ai-short', rows: 6, readonly: true });
          const cnt = h('span', { class: 'chip' }, '…');
          const upd = () => { const c = check('x', Object.assign({}, d, { text: ta.value })); cnt.className = 'chip ' + c.level; cnt.textContent = 'X ' + c.label; };
          const xm = Kit.modal({
            title: 'X用に短くする', wide: true,
            body: h('div', { class: 'stack' }, h('p', { class: 'small ink-2' }, '本文はそのままです。短くした文をコピーするか、本文と置きかえられます。'), Kit.field({ label: 'X用の文', input: ta }), h('div', { class: 'btn-row' }, cnt)),
            actions: [{ label: '閉じる', kind: 'ghost' }, { label: 'コピー', onClick: () => { Kit.copy(composeText('x', Object.assign({}, d, { text: ta.value })), 'X用の文をコピーしました'); return false; } }, { label: '本文と置きかえる', kind: 'primary', onClick: () => { if (!ta.value.trim()) return false; setText(ta.value.trim()); Kit.toast('本文を置きかえました'); } }],
          });
          ta.addEventListener('input', upd);
          try {
            const out = await Kit.ai.ask((await Kit.ai.context()) + '\n\n次の文章を、X（旧Twitter）に投稿できる長さに短くしてください。全角で' + budget + '字以内。意味と語り口は残し、ハッシュタグとURLは入れないでください。短くした文章だけを返してください。\n---\n' + d.text, { onText: ({ text: t }) => { ta.value = t; upd(); } });
            ta.value = String(out || ta.value).trim();
          } catch (e) { xm.close(); throw e; }
          ta.readOnly = false;
          upd();
        }
      }

      /* ── 柱とハッシュタグ ── */
      function openSettings() {
        const c = normCfg(S.cfg);
        const orig = c.pillars.map((p) => p.name);
        const rows = c.pillars.map((p, i) => ({ name: p.name, target: p.target, from: orig[i] }));
        const plBox = h('div', { class: 'stack tight' }), sum = h('p', { class: 'small' });
        const drawPl = () => {
          Kit.clear(plBox);
          rows.forEach((x, i) => {
            const n = h('input', { type: 'text', id: 'sns-pl-n-' + i, 'aria-label': '柱の名前', placeholder: '例：教える' }), t = h('input', { type: 'number', id: 'sns-pl-t-' + i, 'aria-label': '目標（％）', min: 0, max: 100, inputmode: 'numeric' });
            n.value = x.name; t.value = x.target;
            n.addEventListener('input', () => { x.name = n.value; });
            t.addEventListener('input', () => { x.target = Math.max(0, +t.value || 0); drawSum(); });
            plBox.append(h('div', { class: 'sns-set-row' }, n, h('div', { class: 'row', style: { gap: '4px', flexWrap: 'nowrap' } }, t, h('span', { class: 'small' }, '%')), Kit.btn('', () => { rows.splice(i, 1); drawPl(); drawSum(); }, { icon: 'trash', kind: 'ghost', title: 'この柱を消す' })));
          });
        };
        const drawSum = () => { const s = Kit.sum(rows, (x) => x.target); sum.textContent = '合計 ' + s + '%' + (s === 100 ? '' : '（100%にすると目標がわかりやすくなります。ちがっても割合で計算します）'); sum.style.color = s === 100 ? 'var(--ink-2)' : 'var(--warn)'; };
        drawPl(); drawSum();
        const sets = c.tagSets.map((t) => ({ name: t.name, tags: t.tags.join(' ') }));
        const setBox = h('div', { class: 'stack tight' });
        const drawSets = () => {
          Kit.clear(setBox);
          if (!sets.length) setBox.append(h('p', { class: 'small muted' }, 'よく使うタグをまとめておくと、投稿をつくるときにまとめて入れられます。'));
          sets.forEach((x, i) => {
            const n = h('input', { type: 'text', id: 'sns-set-n-' + i, 'aria-label': 'セットの名前', placeholder: '例：数学・教育' }), t = h('textarea', { id: 'sns-set-t-' + i, rows: 2, 'aria-label': 'タグ（スペースか改行で区切る）', placeholder: '数学 中学数学 勉強法' });
            n.value = x.name; t.value = x.tags;
            n.addEventListener('input', () => { x.name = n.value; });
            t.addEventListener('input', () => { x.tags = t.value; });
            setBox.append(h('div', { class: 'sns-set-tags' }, h('div', { class: 'stack tight' }, n, t), Kit.btn('', () => { sets.splice(i, 1); drawSets(); }, { icon: 'trash', kind: 'ghost', title: 'このセットを消す' })));
          });
        };
        drawSets();
        const pfBox = h('div', { class: 'sns-pfs', role: 'group', 'aria-label': 'いつもの投稿先' });
        const drawPf = () => { Kit.clear(pfBox); for (const p of PLATFORMS) pfBox.append(h('button', { type: 'button', class: 'chip', 'aria-pressed': String(c.platforms.includes(p.id)), onclick: () => { c.platforms = c.platforms.includes(p.id) ? c.platforms.filter((x) => x !== p.id) : PLATFORMS.map((x) => x.id).filter((x) => x === p.id || c.platforms.includes(x)); drawPf(); } }, p.label)); };
        drawPf();
        const body = h('div', { class: 'stack' },
          S.cfgSample ? h('p', { class: 'small', style: { color: 'var(--shu)' } }, h('span', { class: 'chip sample' }, 'サンプル'), '　ひらめき数学舎の例です。自分の事業に合わせて書きかえてください。') : null,
          h('h3', { style: { fontSize: '15px' } }, '投稿の柱'),
          h('p', { class: 'small ink-2' }, '何を、どのくらいの割合で投稿するか。柱を決めると、ネタに迷いにくくなります。'),
          plBox, h('div', { class: 'row' }, Kit.btn('柱を足す', () => { rows.push({ name: '', target: 0, from: null }); drawPl(); drawSum(); }, { sm: true, icon: 'plus' }), sum),
          h('hr', { class: 'divider' }),
          h('h3', { style: { fontSize: '15px' } }, 'ハッシュタグのセット'),
          setBox, h('div', null, Kit.btn('セットを足す', () => { sets.push({ name: '', tags: '' }); drawSets(); }, { sm: true, icon: 'plus' })),
          h('hr', { class: 'divider' }),
          h('h3', { style: { fontSize: '15px' } }, 'いつもの投稿先'),
          h('p', { class: 'small ink-2' }, '新しい投稿をつくるとき、最初にえらばれている投稿先です。'), pfBox);
        Kit.modal({
          title: '柱とハッシュタグ', wide: true, body,
          actions: [{ label: 'やめる', kind: 'ghost' }, {
            label: '保存する', kind: 'primary', onClick: async () => {
              const pls = rows.map((x) => ({ name: String(x.name || '').trim(), target: Math.max(0, Math.round(+x.target || 0)), from: x.from })).filter((x) => x.name);
              if (new Set(pls.map((x) => x.name)).size !== pls.length) { Kit.toast('同じ名前の柱があります。名前を変えてください', { type: 'bad' }); return false; }
              const tagSets = sets.map((x) => ({ name: String(x.name || '').trim(), tags: [...new Set(String(x.tags || '').split(/[\s,、，#＃]+/).map((t) => t.trim()).filter(Boolean))] })).filter((x) => x.name && x.tags.length);
              await Kit.store.set('sns', { pillars: pls.map(({ name, target }) => ({ name, target })), tagSets, platforms: c.platforms });
              // 柱の名前を変えたら、その柱の投稿も合わせる
              const renamed = pls.filter((x) => x.from && x.from !== x.name);
              let n = 0;
              for (const x of renamed) for (const p of S.posts.filter((q) => q.pillar === x.from)) { await Kit.store.put('posts', Object.assign({}, p, { pillar: x.name })); n++; }
              Kit.toast('保存しました' + (n ? '（' + n + '件の投稿の柱も変えました）' : ''));
              return true;
            },
          }],
        });
      }

      /* ── 投稿リズムを作る ── */
      function openRhythm() {
        const PRESET = { 1: [3], 2: [2, 5], 3: [1, 3, 5], 4: [1, 3, 5, 0], 5: [1, 2, 3, 4, 5], 7: [0, 1, 2, 3, 4, 5, 6] };
        const o = { per: 3, weeks: 4, start: add(todayS(), 1), days: new Set(PRESET[3]), time: '20:00', platforms: S.cfg.platforms.length ? S.cfg.platforms.slice() : ['instagram'], skip: true };
        const wdBox = h('div', { class: 'sns-wd', role: 'group', 'aria-label': '投稿する曜日' });
        const drawWd = () => { Kit.clear(wdBox); for (const w of [1, 2, 3, 4, 5, 6, 0]) wdBox.append(h('button', { type: 'button', class: 'chip', 'aria-pressed': String(o.days.has(w)), onclick: () => { if (o.days.has(w)) o.days.delete(w); else o.days.add(w); drawWd(); plan(); } }, Kit.WDAY[w])); };
        const perSeg = Kit.seg([1, 2, 3, 4, 5, 7].map((v) => ({ value: v, label: v + '回' })), o.per, (v) => { o.per = +v; o.days = new Set(PRESET[v]); drawWd(); plan(); }, { label: '1週間の回数' });
        const wkSeg = Kit.seg([1, 2, 4, 8].map((v) => ({ value: v, label: v + '週' })), o.weeks, (v) => { o.weeks = +v; plan(); }, { label: '何週間ぶん' });
        const start = h('input', { type: 'date', id: 'sns-rh-start', value: o.start });
        start.addEventListener('change', () => { o.start = isYmd(start.value) ? start.value : add(todayS(), 1); plan(); });
        const time = h('input', { type: 'time', id: 'sns-rh-time', value: o.time, step: 300 });
        time.addEventListener('change', () => { o.time = time.value; plan(); });
        const pfBox = h('div', { class: 'sns-pfs sns-rh-pf', role: 'group', 'aria-label': '投稿先' });
        const drawPf = () => { Kit.clear(pfBox); for (const p of PLATFORMS) pfBox.append(h('button', { type: 'button', class: 'chip', 'aria-pressed': String(o.platforms.includes(p.id)), onclick: () => { o.platforms = o.platforms.includes(p.id) ? o.platforms.filter((x) => x !== p.id) : PLATFORMS.map((x) => x.id).filter((x) => x === p.id || o.platforms.includes(x)); drawPf(); } }, p.label)); };
        const skip = h('input', { type: 'checkbox', id: 'sns-rh-skip', checked: true, onchange: () => { o.skip = skip.checked; plan(); } });
        const list = h('div', { class: 'tbl-wrap sns-rh-list' }), info = h('p', { class: 'small ink-2' });
        let slots = [], okBtn = null;
        const plan = () => {
          const pls = S.cfg.pillars.filter((p) => p.target > 0), sumT = Kit.sum(pls, (p) => p.target) || 1, cnt = pls.map(() => 0);
          const busy = new Set(S.posts.filter((p) => p.date).map((p) => p.date));
          slots = [];
          for (let i = 0; i < o.weeks * 7; i++) {
            const s = add(o.start, i);
            if (!o.days.has(Kit.parseYmd(s).getDay()) || (o.skip && busy.has(s))) continue;
            // 目標の割合にいちばん足りていない柱をえらぶ
            let k = -1, best = -Infinity;
            pls.forEach((p, j) => { const v = (p.target / sumT) * (slots.length + 1) - cnt[j]; if (v > best + 1e-9) { best = v; k = j; } });
            if (k >= 0) cnt[k]++;
            slots.push({ date: s, pillar: k >= 0 ? pls[k].name : '' });
          }
          Kit.clear(list);
          if (!slots.length) list.append(h('p', { class: 'small muted', style: { padding: '14px' } }, '曜日をえらぶと、ここに予定が出ます。'));
          else list.append(h('table', { class: 'tbl' }, h('thead', null, h('tr', null, h('th', null, '日付'), h('th', null, '投稿の柱'))), h('tbody', null, slots.map((x) => h('tr', null, h('td', { class: 'nowrap num' }, md(x.date) + (o.time ? ' ' + o.time : '')), h('td', null, x.pillar || '—'))))));
          info.textContent = slots.length ? Kit.fmtDate(o.start, 'M/D') + 'から' + o.weeks + '週間で ' + slots.length + '件のネタ枠をつくります。' + (o.skip ? 'すでに投稿がある日はとばします。' : '') : '';
          if (okBtn) okBtn.textContent = slots.length ? slots.length + '件を追加する' : '追加する';
        };
        drawWd(); drawPf();
        const body = h('div', { class: 'stack' },
          h('p', { class: 'small ink-2' }, '決まった曜日に「ネタ」のカードを先に置いておくと、何を投稿するか迷う時間が減ります。柱は目標の割合になるように順番に入れます。'),
          h('div', { class: 'sns-2col sns-stack-sm' }, Kit.field({ label: '1週間に', input: perSeg }), Kit.field({ label: '何週間ぶん', input: wkSeg })),
          h('div', { class: 'field' }, h('label', null, '投稿する曜日'), wdBox),
          h('div', { class: 'sns-2col' }, Kit.field({ label: '始める日', input: start }), Kit.field({ label: '時刻', input: time })),
          h('div', { class: 'field' }, h('label', null, '投稿先'), pfBox),
          h('label', { class: 'check', for: 'sns-rh-skip' }, skip, 'すでに投稿がある日はとばす'),
          info, list);
        const m = Kit.modal({
          title: '投稿リズムを作る', wide: true, body,
          actions: [{ label: 'やめる', kind: 'ghost' }, {
            label: '追加する', kind: 'primary', onClick: async () => {
              if (!slots.length) { Kit.toast('曜日をえらんでください', { type: 'bad' }); return false; }
              for (const x of slots) await Kit.store.put('posts', { platforms: o.platforms.slice(), title: (x.pillar || '投稿') + 'のネタ', text: '', tags: [], date: x.date, time: o.time || '', status: 'idea', pillar: x.pillar, image: '', memo: '投稿リズムで入れた枠です。中身を考えて書きかえてください。', metrics: { likes: null, saves: null, reach: null } });
              Kit.toast(slots.length + '件のネタ枠を入れました');
              S.view = 'cal'; Kit.pref.set('sns:view', 'cal'); S.cursor = S.sel = slots[0].date;
              return true;
            },
          }],
        });
        okBtn = m.el.querySelector('.modal-f .btn.primary');
        plan();
      }

      /* ── 読み込み・描きなおし・あとかたづけ ── */
      await load();
      renderAll();
      if (params && params.post) {
        const p = byId(params.post);
        if (p) openComposer(p); else Kit.toast('その投稿は見つかりませんでした', { type: 'bad' });
      }
      const reload = Kit.debounce(async () => { await load(); renderAll(); }, 60);
      const offs = ['coll:posts', 'doc:sns', 'doc:calendar'].map((k) => Kit.store.on(k, reload));
      const onMq = () => renderView();
      mq.addEventListener('change', onMq);
      return () => { offs.forEach((f) => f()); reload.cancel(); mq.removeEventListener('change', onMq); };
    },
  });

  // ほかのアプリやテストから使える小物
  window.MiseSns = { PLATFORMS, xLength, composeText, check };
})();
