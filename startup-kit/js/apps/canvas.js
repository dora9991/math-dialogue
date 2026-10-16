// リーンキャンバス：事業の骨組み（リーンキャンバス）と、お客さんの姿（ペルソナ）を1枚にまとめる
(function () {
  'use strict';
  const { h } = Kit;
  const MAX = 8; // 1つの欄に書ける数

  /* 欄の定義。no = 書く順番（スマホではこの順に並ぶ）、area = 大きい枠、sub = 枠の下のほうの小さい欄。
     soft = これより多いとやんわり知らせる数 */
  const LEAN = [
    { key: 'problem', no: 1, label: '課題', area: 'prob', q: 'お客さんが困っていることは？ 大きい順に', ex: '公式を暗記するだけで、なぜが分からない', soft: 3, softMsg: '3つまでに絞ると伝わります' },
    { key: 'alternatives', label: '既存の代替品', area: 'prob', sub: true, q: 'いまは、どうやってしのいでいる？', ex: '集団塾・解説動画', soft: 4 },
    { key: 'segments', no: 2, label: '顧客セグメント', area: 'seg', q: 'だれの課題？', ex: '数学に苦手意識がある中高生と保護者', soft: 3, softMsg: 'お客さんを絞るほど、言葉が届きます' },
    { key: 'earlyAdopters', label: 'アーリーアダプター', area: 'seg', sub: true, q: '最初に飛びついてくれるのは、どんな人？', ex: 'テスト前に、家で教えられず困っている保護者', soft: 3 },
    { key: 'uvp', no: 3, label: '独自の価値提案', area: 'uvp', q: '選ばれる理由を、ひと目でわかる1文で', ex: '公式を、自分の手で発見できる数学教室', soft: 1, softMsg: '1文にまとめると、ひと目で伝わります' },
    { key: 'concept', label: 'ハイレベルコンセプト', area: 'uvp', sub: true, q: '身近なものにたとえると？（〇〇の△△版）', ex: '数学の、手を動かす実験室', soft: 1, softMsg: 'たとえは1つに絞りましょう' },
    { key: 'solution', no: 4, label: 'ソリューション', area: 'sol', q: '課題ごとの解決策は？', ex: '図を動かして、公式を見つける教材', soft: 3 },
    { key: 'channels', no: 5, label: 'チャネル', area: 'chn', q: 'お客さんに、どうやって届く？', ex: 'Instagram・無料体験会', soft: 5 },
    { key: 'revenue', no: 6, label: '収益の流れ', area: 'rev', q: '何に、いくら払ってもらう？', ex: '個別レッスン 60分 ¥4,000', soft: 5 },
    { key: 'costs', no: 7, label: 'コスト構造', area: 'cost', q: '続けるのにかかるお金は？', ex: 'Zoom・サーバー 月¥4,000', soft: 5 },
    { key: 'metrics', no: 8, label: '主要指標', area: 'met', q: 'うまくいっているかを、何の数で見る？', ex: '体験会の申込み 月10件', soft: 3, softMsg: '見る数は3つまでが続けやすいです' },
    { key: 'advantage', no: 9, label: '圧倒的な優位性', area: 'adv', q: '簡単にはまねできないものは？', ex: '現役教員としての授業経験', soft: 3 },
  ];
  const PERSONA = [
    { key: 'name', no: 1, label: '名前と一言', area: 'name', q: 'どんな人？ 仮の名前と、ひとこと', ex: '山田 さくら（仮）', soft: 2 },
    { key: 'profile', no: 2, label: '年齢・家族・仕事', area: 'prof', q: '年齢・家族・仕事・住まい', ex: '44歳・会社員・中2の娘と小5の息子', soft: 5 },
    { key: 'pains', no: 3, label: '悩み・困りごと', area: 'pain', q: 'いちばん困っていることは？', ex: '娘に数学を聞かれても、説明できない', soft: 5 },
    { key: 'current', no: 4, label: 'いまの解決策', area: 'cur', q: 'いまはどうしている？ 何が不満？', ex: '集団塾に通わせているが、質問できていない', soft: 5 },
    { key: 'media', no: 5, label: '情報を得る場所', area: 'media', q: 'ふだん、どこで情報を見ている？', ex: 'Instagram・学校のお便り・ママ友のLINE', soft: 5 },
    { key: 'decision', no: 6, label: '決め手になること', area: 'dec', q: '何があれば申し込む？', ex: '体験で娘が「わかった」と言うこと', soft: 5 },
    { key: 'quotes', no: 7, label: 'よく言う言葉', area: 'quote', q: 'この人が口にしそうな言葉', ex: '「私も数学は苦手だったから」', soft: 5 },
  ];
  const DEFS = { lean: LEAN, persona: PERSONA };
  const TYPE_LABEL = { lean: 'リーンキャンバス', persona: 'ペルソナ' };
  const TYPE_DESC = {
    lean: '事業の骨組みを、課題・お客さん・価値・売り方など9つの欄で1枚にまとめます。',
    persona: 'お客さん1人の姿を、悩み・情報源・決め手などから具体的に描きます。',
  };
  const defOf = (type, key) => DEFS[type].find((d) => d.key === key);
  // 大きい枠ごとにまとめる（主の欄の番号順）
  const areasOf = (type) => {
    const out = [];
    for (const d of DEFS[type]) {
      let a = out.find((x) => x.area === d.area);
      if (!a) { a = { area: d.area, no: 99, keys: [] }; out.push(a); }
      a.keys.push(d.key);
      if (!d.sub) a.no = d.no;
    }
    return out.sort((a, b) => a.no - b.no);
  };
  // 文章・画像での並び（主の欄 → その枠の小さい欄）
  const ordered = (type) => areasOf(type).flatMap((a) => a.keys.map((k) => defOf(type, k)));

  /* ───────── サンプル（ひらめき数学舎） ───────── */
  const SAMPLES = [
    {
      type: 'lean', title: 'ひらめき数学舎',
      blocks: {
        problem: ['公式を暗記するだけで、なぜが分からない', '家で質問されても、親が説明できない', '授業で使える教材を作る時間がない（先生）'],
        alternatives: ['集団塾・家庭教師', 'YouTubeの解説動画', '問題集をくり返す'],
        segments: ['数学に苦手意識がある中高生と保護者', '学び直したい大人', 'ICTを授業に取り入れたい先生'],
        earlyAdopters: ['テスト前に家で教えられず困っている、中学生の保護者', 'SNSで数学の話題に反応する先生'],
        uvp: ['公式を暗記せず、自分の手で発見できる数学教室'],
        concept: ['数学の、手を動かす実験室'],
        solution: ['図やゲームで、公式の成り立ちを見つける個別レッスン', '保護者向けの解説シートつきの教材', 'そのまま授業で使えるツール集'],
        channels: ['Instagram・Xの短い解説', 'noteの記事', '無料体験会・地域のチラシ', '先生どうしの紹介'],
        revenue: ['個別レッスン 60分 ¥4,000', 'メンバーシップ 月額 ¥980', '教材ダウンロード ¥1,500', '出張ワークショップ ¥30,000〜'],
        costs: ['Zoom・サーバー 月¥4,000', 'チラシ・広告 月¥3,000', '教材づくりの時間'],
        metrics: ['無料体験会の申込み 月10件', '体験からの継続 30%', 'メンバー 50人'],
        advantage: ['現役教員としての授業経験', '自作の教材と、先生どうしのつながり'],
      },
    },
    {
      type: 'persona', title: '中2の娘をもつ保護者・40代',
      blocks: {
        name: ['山田 さくら（仮）', 'テスト前になると、親子でけんかになる'],
        profile: ['44歳・会社員（時短勤務）', '中2の娘と小5の息子', '佐賀市に住んでいる'],
        pains: ['娘に数学を聞かれても、説明できない', '塾の成績表を見ても、どこが分からないのか分からない', '平日の夜は時間がない'],
        current: ['集団塾に週2回（質問はできていない様子）', 'YouTubeの解説動画をすすめている'],
        media: ['Instagram', '学校のお便り・PTAのLINE', 'ママ友の口コミ'],
        decision: ['体験で、娘が「わかった」と言うこと', '送り迎えがいらないオンライン', '月の費用がはっきりしていること'],
        quotes: ['「私も数学は苦手だったから…」', '「点数より、嫌いにならないでほしい」'],
      },
    },
  ];
  if (Kit.store && Kit.store.sample) Kit.store.sample('canvases', SAMPLES);

  /* ───────── 見た目 ───────── */
  Kit.css('canvas', `
.app-canvas { container-type: inline-size; container-name: cv; }
.cv-bar { display: flex; flex-wrap: wrap; gap: 8px; align-items: flex-end; margin-bottom: 14px; }
.cv-bar .cv-pick { flex: 1 1 260px; max-width: 460px; }
.cv-acts { display: flex; flex-wrap: wrap; gap: 8px; }
@container cv (max-width: 560px) { .cv-acts .cv-mini > span { display: none; } .cv-acts .cv-mini { width: 38px; min-width: 38px; padding: 0; } }
.cv-title { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 10px; margin-bottom: 12px; }
.cv-title .spacer { flex: 1; }
.cv-export { display: flex; flex-wrap: wrap; gap: 6px; }
.cv-title h2 { font-family: var(--font-display); font-weight: 800; font-size: 21px; letter-spacing: .03em; overflow-wrap: anywhere; min-width: 0; }
.cv-title .cv-when { font-size: 12.5px; color: var(--ink-3); }
.cv-board { display: grid; gap: 1px; background: var(--line-strong); border: 1px solid var(--line-strong); border-radius: var(--r); overflow: hidden; grid-template-columns: minmax(0, 1fr); }
.cv-area { background: var(--surface); padding: 12px 12px 14px; display: flex; flex-direction: column; gap: 12px; min-width: 0; }
@container cv (min-width: 640px) { .cv-board { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@container cv (min-width: 960px) {
  .cv-board.cv-lean { grid-template-columns: repeat(10, minmax(0, 1fr)); grid-template-rows: minmax(190px, auto) minmax(190px, auto) minmax(150px, auto);
    grid-template-areas: "prob prob sol sol uvp uvp adv adv seg seg" "prob prob met met uvp uvp chn chn seg seg" "cost cost cost cost cost rev rev rev rev rev"; }
  .cv-board.cv-persona { grid-template-columns: repeat(3, minmax(0, 1fr)); grid-template-areas: "name pain cur" "prof pain dec" "media quote quote"; }
  .cv-area[data-area="prob"] { grid-area: prob; } .cv-area[data-area="sol"] { grid-area: sol; } .cv-area[data-area="met"] { grid-area: met; }
  .cv-area[data-area="uvp"] { grid-area: uvp; } .cv-area[data-area="adv"] { grid-area: adv; } .cv-area[data-area="chn"] { grid-area: chn; }
  .cv-area[data-area="seg"] { grid-area: seg; } .cv-area[data-area="cost"] { grid-area: cost; } .cv-area[data-area="rev"] { grid-area: rev; }
  .cv-area[data-area="name"] { grid-area: name; } .cv-area[data-area="prof"] { grid-area: prof; } .cv-area[data-area="pain"] { grid-area: pain; }
  .cv-area[data-area="cur"] { grid-area: cur; } .cv-area[data-area="media"] { grid-area: media; } .cv-area[data-area="dec"] { grid-area: dec; }
  .cv-area[data-area="quote"] { grid-area: quote; }
  .cv-board.cv-lean .cv-area[data-area="uvp"] { background: color-mix(in srgb, var(--gosu-wash) 35%, var(--surface)); }
  .cv-board.cv-lean .cv-bh .btn.ai > span { display: none; }
  .cv-board.cv-lean .cv-bh .btn.ai { width: 30px; min-width: 30px; padding: 0; }
}
.cv-block { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.cv-block.cv-sub { margin-top: auto; padding-top: 10px; border-top: 1px dashed var(--line-strong); }
.cv-bh { display: flex; align-items: center; gap: 7px; min-width: 0; }
.cv-bh h3 { font-size: 14.5px; font-weight: 700; line-height: 1.35; min-width: 0; }
.cv-block.cv-sub .cv-bh h3 { font-size: 13px; color: var(--ink-2); }
.cv-no { flex: none; width: 22px; height: 22px; border-radius: 50%; background: var(--gosu); color: var(--on-gosu); font-size: 12px; font-weight: 700; display: grid; place-items: center; font-variant-numeric: tabular-nums; }
.cv-bh .spacer { flex: 1; }
.cv-bh .btn.ai { flex: none; }
.cv-q { font-size: 12px; color: var(--ink-3); line-height: 1.5; }
.cv-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 5px; min-height: 4px; }
.cv-item { position: relative; display: flex; align-items: flex-start; gap: 4px; background: var(--surface-2); border: 1px solid var(--line); border-radius: 6px; min-width: 0; }
.cv-item:hover { border-color: var(--line-strong); }
.cv-item.cv-dragging { opacity: .45; }
.cv-item.cv-drop-before::before { content: ""; position: absolute; left: 0; right: 0; top: -4px; height: 2px; border-radius: 2px; background: var(--gosu); }
.cv-list.cv-drop-end { box-shadow: 0 2px 0 var(--gosu); }
.cv-text { flex: 1 1 auto; min-width: 0; padding: 5px 8px; font-size: 13.5px; line-height: 1.55; cursor: text; overflow-wrap: anywhere; border-radius: 5px; min-height: 30px; }
.cv-text:focus-visible { outline-offset: -2px; }
.cv-edit, .cv-add { width: 100%; min-height: 34px; resize: none; overflow: hidden; font-size: 14px; line-height: 1.5; padding: 5px 8px; }
.cv-item.cv-editing { background: var(--surface); border-color: var(--focus); }
.cv-item.cv-editing .cv-edit { border: 0; outline: 0; background: transparent; }
.cv-tools { display: flex; gap: 2px; flex: none; }
.cv-tools .btn.icon.sm { width: 28px; min-width: 28px; min-height: 28px; }
@media (pointer: fine) {
  .cv-item[draggable="true"] { cursor: grab; }
  .cv-tools { position: absolute; top: -9px; right: -7px; padding: 1px; background: var(--surface); border: 1px solid var(--line); border-radius: 8px; box-shadow: var(--shadow-1); opacity: 0; pointer-events: none; transition: opacity .12s; z-index: 2; }
  .cv-tools .btn.icon.sm { width: 24px; min-width: 24px; min-height: 24px; }
  .cv-tools .cv-move { display: none; }
  .cv-item:hover .cv-tools, .cv-item:has(:focus-visible) .cv-tools { opacity: 1; pointer-events: auto; }
  .cv-item:has(:focus-visible) .cv-tools .cv-move { display: inline-flex; }
  .cv-item.cv-editing .cv-tools { display: none; }
}
@media (pointer: coarse) {
  .app-canvas .btn.sm, .cv-suggs .chip { min-height: 36px; }
  .cv-tools .btn.icon.sm { width: 36px; min-width: 36px; min-height: 36px; }
  .cv-text { min-height: 36px; padding-top: 7px; }
  .cv-addrow .btn.icon { width: 40px; min-width: 40px; }
}
.cv-hint { font-size: 12px; color: var(--warn); display: flex; gap: 5px; align-items: flex-start; line-height: 1.5; }
.cv-hint svg { flex: none; width: 14px; height: 14px; margin-top: 2px; }
.cv-addrow { display: flex; gap: 4px; align-items: flex-start; }
.cv-add { border-style: dashed; background: transparent; }
.cv-add:focus { border-style: solid; background: var(--surface); }
.cv-add::placeholder { color: var(--ink-3); opacity: .75; }
.cv-addrow .btn.icon { flex: none; min-height: 34px; height: 34px; }
.cv-suggs { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.cv-suggs .chip { white-space: normal; text-align: left; border-color: color-mix(in srgb, var(--gosu) 40%, var(--line)); background: var(--surface); color: var(--ink); min-height: 30px; padding: 3px 10px; line-height: 1.5; border-radius: 12px; }
.cv-suggs .chip:hover { background: var(--gosu-wash); }
.cv-side { display: grid; gap: 14px; margin-top: 16px; grid-template-columns: minmax(0, 1fr); }
@container cv (min-width: 960px) { .cv-side { grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); align-items: start; } }
.cv-checks { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
.cv-checks li { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 10px; align-items: start; font-size: 13.5px; line-height: 1.6; }
.cv-checks .chip { margin-top: 1px; }
.cv-ai-out { white-space: pre-wrap; font-size: 14px; line-height: 1.85; margin-top: 8px; }
.cv-howto ol { margin: 6px 0 0; padding-left: 1.3em; font-size: 13.5px; color: var(--ink-2); }
.cv-howto li + li { margin-top: 3px; }
.cv-new-types { display: grid; gap: 8px; }
.cv-new-types button { text-align: left; font: inherit; color: var(--ink); background: var(--surface); border: 1px solid var(--line-strong); border-radius: var(--r); padding: 10px 14px; cursor: pointer; display: grid; gap: 2px; }
.cv-new-types button[aria-pressed="true"] { border-color: var(--gosu); box-shadow: inset 0 0 0 1px var(--gosu); background: color-mix(in srgb, var(--gosu-wash) 45%, var(--surface)); }
.cv-new-types b { font-size: 15px; }
.cv-new-types span { font-size: 13px; color: var(--ink-2); }
`);

  /* ───────── 文章（Markdown） ───────── */
  function toMd(cv) {
    const L = ['# ' + (cv.title || '無題') + '（' + TYPE_LABEL[cv.type] + '）', '', Kit.fmtDate(Kit.today(), 'YYYY年M月D日'), ''];
    for (const d of ordered(cv.type)) {
      const items = (cv.blocks && cv.blocks[d.key]) || [];
      L.push(d.sub ? '### ' + d.label : '## ' + d.no + '. ' + d.label);
      L.push(...(items.length ? items.map((t) => '- ' + t) : ['- （まだ書いていません）']), '');
    }
    return L.join('\n').trim() + '\n';
  }

  /* ───────── 見直しのヒント ───────── */
  const len = (s) => [...String(s || '')].length;
  const hasNum = (s) => /[0-9０-９]/.test(s) || /[一二三四五六七八九十百千万]+\s*(人|件|回|円|%|％|割|か月|ヶ月|社|校|冊|時間)/.test(s);
  function checks(cv) {
    const b = cv.blocks || {};
    const n = (k) => (b[k] || []).length;
    const out = [];
    const ok = (text) => out.push({ ok: true, text });
    const ng = (text) => out.push({ ok: false, text });
    if (cv.type === 'persona') {
      n('name') ? ok('名前と一言があります。仮の名前でも、呼べると考えやすくなります。') : ng('名前と一言がまだです。仮の名前をつけると、ひとりの人として考えやすくなります。');
      n('pains') ? ok('悩みが ' + n('pains') + 'つ書けています。') : ng('悩み・困りごとがまだです。いちばん困っていることから1つ。');
      const q = b.quotes || [];
      if (!q.length) ng('よく言う言葉がまだです。本人が口にしそうな言葉を書くと、広告やページの言葉に使えます。');
      else if (!q.some((t) => /[「」『』"“”]/.test(t))) ng('よく言う言葉は、本人の言葉のまま（「」つきで）書くと、生の声になります。');
      else ok('本人の言葉で書けています。そのまま、ページの見出しの候補になります。');
      n('media') ? ok('情報を得る場所があります。チャネル選びの手がかりになります。') : ng('情報を得る場所がまだです。ここがわかると、どこで知らせればよいかが決まります。');
      n('decision') ? ok('決め手が書けています。申し込みページで、いちばん先に見せましょう。') : ng('決め手になることがまだです。何があれば申し込むかを1つ。');
      return out;
    }
    const uvp = b.uvp || [];
    if (!uvp.length) ng('独自の価値提案がまだです。だれに・何が・どう良いかを1文で。');
    else if (uvp.length > 1) ng('独自の価値提案は1文にまとめましょう（いま' + uvp.length + 'つ）。');
    else if (len(uvp[0]) > 40) ng('独自の価値提案は40字以内がおすすめです（いま' + len(uvp[0]) + '字）。');
    else ok('独自の価値提案は1文・' + len(uvp[0]) + '字。ひと目で伝わる長さです。');
    const p = n('problem'), s = n('solution');
    if (!p) ng('課題がまだです。お客さんの困りごとを、大きい順に書きます。');
    else if (p !== s) ng('課題が' + p + 'つ、ソリューションが' + s + 'つ。課題ごとに1つずつ対応させると、筋が通ります。');
    else ok('課題' + p + 'つに、ソリューションが' + s + 'つ対応しています。');
    if (p > 3) ng('課題が' + p + 'つあります。3つまでに絞ると伝わります。');
    n('channels') ? ok('チャネルが書けています。') : ng('チャネル（お客さんに届く道）がまだ空です。');
    if (!n('metrics')) ng('主要指標がまだです。うまくいっているかを、何の数で見るか決めましょう。');
    else if (!(b.metrics || []).some(hasNum)) ng('主要指標に、数で測れるもの（例：体験会の申込み 月10件）を入れましょう。');
    else ok('主要指標に、数で測れるものがあります。');
    if (n('segments') && !n('earlyAdopters')) ng('アーリーアダプター（最初に買ってくれる人）を、もっと具体的に1人思い浮かべましょう。');
    if (n('revenue') && !(b.revenue || []).some(hasNum)) ng('収益の流れに、値段を書きましょう。');
    return out;
  }

  /* ───────── 画像で保存（1600×1000・白磁の地に呉須の線） ───────── */
  const NO_START = '、。，．,.)）]］｝」』】〕〉》！？!?ー〜ぁぃぅぇぉっゃゅょゎァィゥェォッャュョヮヵヶ々・：；:;';
  const NO_END = '(（[［｛「『【〔〈《';
  // 日本語は1字ずつ、英数字は語ごとに折り返す（行頭・行末の禁則つき）
  function wrapText(g, text, maxW) {
    const tokens = String(text).match(/[A-Za-z0-9¥$%.,:\-+/'@#&]+|\s+|./gu) || [];
    const lines = [];
    let line = '';
    const push = () => { lines.push(line.replace(/\s+$/, '')); line = ''; };
    for (let t of tokens) {
      if (!line && /^\s+$/.test(t)) continue;
      if (g.measureText(line + t).width <= maxW) { line += t; continue; }
      if (NO_START.includes(t[0]) && line) { line += t; continue; } // ぶら下げ
      if (g.measureText(t).width > maxW) { // 長い英数字は字で切る
        for (const ch of t) { if (g.measureText(line + ch).width > maxW && line) push(); line += ch; }
        continue;
      }
      let carry = '';
      while (line.length > 1 && NO_END.includes(line[line.length - 1])) { carry = line[line.length - 1] + carry; line = line.slice(0, -1); }
      push();
      line = carry + (/^\s+$/.test(t) ? '' : t);
    }
    if (line) push();
    return lines;
  }
  function fitLines(g, items, w, h, family) {
    for (let fs = 17; fs >= 11; fs--) {
      g.font = '400 ' + fs + 'px ' + family;
      const lh = Math.round(fs * 1.5), gap = Math.round(fs * 0.45), bw = g.measureText('・').width;
      const blocks = items.map((t) => wrapText(g, t, w - bw));
      const total = blocks.reduce((a, l) => a + l.length * lh, 0) + Math.max(0, blocks.length - 1) * gap;
      if (total <= h || fs === 11) {
        if (total > h) { // 入りきらない分は省く
          let used = 0;
          const keep = [];
          for (const l of blocks) {
            const room = Math.floor((h - used) / lh);
            if (room <= 0) break;
            if (l.length > room) { const cut = l.slice(0, room); cut[cut.length - 1] = cut[cut.length - 1].replace(/.$/u, '…'); keep.push(cut); break; }
            keep.push(l); used += l.length * lh + gap;
          }
          return { fs, lh, gap, bw, blocks: keep };
        }
        return { fs, lh, gap, bw, blocks };
      }
    }
    return null;
  }
  async function drawPng(cv) {
    try { if (document.fonts && document.fonts.ready) await document.fonts.ready; } catch (e) { /* 字体を待てなくても描く */ }
    const W = 1600, H = 1000;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d');
    const C = { bg: '#fbfcfe', line: '#1f4a8f', thin: '#a9bcdc', ink: '#142139', ink2: '#44546d', ink3: '#7a889d', seal: '#c93c24', wash: '#f0f4fb' };
    const body = getComputedStyle(document.body).fontFamily || 'sans-serif';
    const disp = getComputedStyle(document.documentElement).getPropertyValue('--font-display').trim() || 'serif';
    g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
    // 見出し：題名・種類・日付
    g.textBaseline = 'alphabetic';
    g.fillStyle = C.seal; g.fillRect(48, 44, 10, 40);
    g.fillStyle = C.ink; g.font = '800 34px ' + disp;
    let title = cv.title || '無題';
    while (g.measureText(title).width > 1000 && title.length > 1) title = title.slice(0, -2) + '…';
    g.fillText(title, 72, 78);
    g.textAlign = 'right'; g.fillStyle = C.ink2; g.font = '500 17px ' + body;
    g.fillText(TYPE_LABEL[cv.type] + '　' + Kit.fmtDate(Kit.today(), 'YYYY年M月D日'), W - 48, 76);
    g.textAlign = 'left';
    const x0 = 48, y0 = 108, bw = W - 96, bh = H - y0 - 56;
    const R = {};
    if (cv.type === 'lean') {
      const cw = bw / 5, th = Math.round(bh * 0.68), half = Math.round(th / 2);
      Object.assign(R, {
        prob: [x0, y0, cw, th], sol: [x0 + cw, y0, cw, half], met: [x0 + cw, y0 + half, cw, th - half], uvp: [x0 + 2 * cw, y0, cw, th],
        adv: [x0 + 3 * cw, y0, cw, half], chn: [x0 + 3 * cw, y0 + half, cw, th - half], seg: [x0 + 4 * cw, y0, cw, th],
        cost: [x0, y0 + th, bw / 2, bh - th], rev: [x0 + bw / 2, y0 + th, bw / 2, bh - th],
      });
    } else {
      const cw = bw / 3, r1 = Math.round(bh * 0.34), r2 = Math.round(bh * 0.34), r3 = bh - r1 - r2;
      Object.assign(R, {
        name: [x0, y0, cw, r1], pain: [x0 + cw, y0, cw, r1 + r2], cur: [x0 + 2 * cw, y0, cw, r1],
        prof: [x0, y0 + r1, cw, r2], dec: [x0 + 2 * cw, y0 + r1, cw, r2],
        media: [x0, y0 + r1 + r2, cw, r3], quote: [x0 + cw, y0 + r1 + r2, 2 * cw, r3],
      });
    }
    // 価値提案の枠だけ、うすい藍
    if (R.uvp) { g.fillStyle = C.wash; g.fillRect(...R.uvp); }
    const blockAt = (d, x, y, w, hh) => {
      const pad = 16;
      let ty = y + 30;
      if (d.sub) {
        g.fillStyle = C.ink2; g.font = '700 15px ' + body; g.fillText(d.label, x + pad, ty - 4);
        ty += 8;
      } else {
        g.fillStyle = C.line; g.beginPath(); g.arc(x + pad + 12, ty - 8, 12, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#ffffff'; g.font = '700 14px ' + body; g.textAlign = 'center'; g.fillText(String(d.no), x + pad + 12, ty - 3); g.textAlign = 'left';
        g.fillStyle = C.ink; g.font = '700 19px ' + body; g.fillText(d.label, x + pad + 32, ty - 1);
        ty += 18;
      }
      const items = (cv.blocks && cv.blocks[d.key]) || [];
      const areaH = y + hh - ty - 12;
      if (!items.length) { g.fillStyle = C.ink3; g.font = '400 14px ' + body; g.fillText('（まだ書いていません）', x + pad, ty + 12); return; }
      const fit = fitLines(g, items, w - pad * 2, areaH, body);
      if (!fit) return;
      g.font = '400 ' + fit.fs + 'px ' + body;
      let yy = ty + fit.fs;
      for (const lines of fit.blocks) {
        g.fillStyle = C.line; g.fillText('・', x + pad, yy);
        g.fillStyle = C.ink;
        lines.forEach((ln, i) => { g.fillText(ln, x + pad + fit.bw, yy + i * fit.lh); });
        yy += lines.length * fit.lh + fit.gap;
      }
    };
    for (const a of areasOf(cv.type)) {
      const r = R[a.area];
      if (!r) continue;
      const [x, y, w, hh] = r;
      const main = a.keys.map((k) => defOf(cv.type, k)).filter((d) => !d.sub);
      const subs = a.keys.map((k) => defOf(cv.type, k)).filter((d) => d.sub);
      if (subs.length) {
        const split = Math.round(hh * 0.6);
        main.forEach((d) => blockAt(d, x, y, w, split));
        g.strokeStyle = C.thin; g.lineWidth = 1.2; g.setLineDash([6, 5]);
        g.beginPath(); g.moveTo(x + 14, y + split); g.lineTo(x + w - 14, y + split); g.stroke(); g.setLineDash([]);
        subs.forEach((d) => blockAt(d, x, y + split, w, hh - split));
      } else main.forEach((d) => blockAt(d, x, y, w, hh));
      g.strokeStyle = C.line; g.lineWidth = 1.5; g.strokeRect(x, y, w, hh);
    }
    g.strokeStyle = C.line; g.lineWidth = 3; g.strokeRect(x0, y0, bw, bh);
    g.fillStyle = C.ink3; g.font = '400 14px ' + body;
    g.fillText('みせびらき・' + TYPE_LABEL[cv.type], x0, H - 22);
    return c;
  }

  /* ───────── 画面 ───────── */
  Kit.app({
    id: 'canvas', title: 'リーンキャンバス', group: 'plan', icon: 'canvas', order: 41,
    desc: '事業の骨組みを1枚にまとめる',
    colls: ['canvases'],
    async mount(root, params) {
      // 作った順。サンプルは同じ時刻なので、リーンキャンバスを先に
      const sorted = (arr) => arr.sort((a, b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')) || (a.type === b.type ? 0 : a.type === 'lean' ? -1 : 1));
      let items = sorted(await Kit.store.list('canvases', { sample: SAMPLES }));
      let curId = (params && params.id) || Kit.pref.get('canvas.current', null);
      let alive = true;
      let drag = null; // { key, i }
      const fine = window.matchMedia ? window.matchMedia('(pointer: fine)') : { matches: true };
      const els = {};
      const suggs = {}; // 欄ごとの AI の案

      const sampleSlot = h('div');
      const barSlot = h('div');
      const main = h('div');
      root.append(
        Kit.appHead({ title: 'リーンキャンバス', desc: '事業の骨組みを1枚に。課題からお客さん、売り方、数字まで。ペルソナ（お客さん像）も作れます。' }),
        sampleSlot, barSlot, main);

      const cur = () => items.find((x) => x.id === curId) || null;
      function select(id) { curId = id; Kit.pref.set('canvas.current', id); }
      if (!cur() && items.length) select(items[0].id);

      async function reload() { items = sorted(await Kit.store.list('canvases', { sample: SAMPLES })); if (!cur()) curId = items[0] ? items[0].id : null; }
      // 保存。サンプルを書きかえたら、それは自分のものになる（片付けても消えない）
      async function commit(cv) {
        delete cv.sample;
        cv.blocks = cv.blocks || {};
        const saved = await Kit.store.put('canvases', cv);
        cv.updatedAt = saved.updatedAt; cv.createdAt = saved.createdAt;
        renderSampleBar();
        renderTitle();
        renderChecks();
      }

      function renderSampleBar() {
        Kit.clear(sampleSlot);
        if (!items.some((x) => x.sample)) return;
        sampleSlot.append(Kit.sampleBar('これは例（ひらめき数学舎）です。書きかえると、自分のキャンバスとして保存されます。', async () => {
          const ok = await Kit.confirm({ title: 'サンプルを片付けますか', body: 'すべてのツールのサンプル（ひらめき数学舎の例）を消します。書きかえたキャンバスは残ります。', ok: '片付ける' });
          if (!ok) return;
          await Kit.store.samplesOff();
          await reload();
          renderAll();
          Kit.toast('サンプルを片付けました');
        }));
      }

      function renderAll() { renderSampleBar(); renderBar(); renderMain(); }

      // 切り替え・作る・名前・複製・削除・書き出し
      function renderBar() {
        Kit.clear(barSlot);
        const cv = cur();
        if (!items.length) return; // 空のときは、下の「作る」ボタンだけ
        const pick = h('select', { id: 'cv-pick', 'aria-label': 'キャンバスを選ぶ' }, items.map((x) => h('option', { value: x.id, selected: x.id === curId }, '【' + (x.type === 'persona' ? 'ペルソナ' : 'リーン') + '】' + (x.title || '無題') + (x.sample ? '（サンプル）' : ''))));
        pick.addEventListener('change', () => { select(pick.value); renderAll(); });
        // 幅がせまいと、名前・複製・削除は絵だけのボタンになる（title と aria-label で名前を残す）
        const named = (label, fn, o) => { const b = Kit.btn(label, fn, Object.assign({ title: label, class: 'cv-mini' }, o)); b.setAttribute('aria-label', label); return b; };
        barSlot.append(h('div', { class: 'cv-bar' },
          items.length ? h('div', { class: 'cv-pick' }, Kit.field({ label: 'キャンバス', input: pick })) : null,
          h('div', { class: 'cv-acts' },
            Kit.btn('新しく作る', () => openNew(), { icon: 'plus' }),
            cv ? named('名前を変える', rename, { icon: 'edit' }) : null,
            cv ? named('複製', duplicate, { icon: 'copy' }) : null,
            cv ? named('削除', removeCanvas, { icon: 'trash', kind: 'danger' }) : null)));
      }

      function openNew(first) {
        let type = first === 'persona' ? 'persona' : 'lean';
        const title = h('input', { type: 'text', id: 'cv-new-title', placeholder: '例：ひらめき数学舎' });
        const types = h('div', { class: 'cv-new-types', role: 'group', 'aria-label': '種類' });
        const setType = (t) => {
          type = t;
          for (const b of types.children) b.setAttribute('aria-pressed', String(b.dataset.t === t));
          title.placeholder = t === 'lean' ? '例：ひらめき数学舎' : '例：中2の娘をもつ保護者・40代';
        };
        for (const t of ['lean', 'persona']) types.append(h('button', { type: 'button', 'data-t': t, onclick: () => setType(t) }, h('b', null, TYPE_LABEL[t]), h('span', null, TYPE_DESC[t])));
        setType(type);
        const create = async () => {
          const t = title.value.trim() || (type === 'lean' ? '新しいリーンキャンバス' : '新しいペルソナ');
          const it = await Kit.store.put('canvases', { type, title: t, blocks: {} });
          await reload();
          select(it.id);
          renderAll();
          const first = main.querySelector('.cv-add');
          if (first) first.focus();
          Kit.toast('「' + t + '」を作りました');
        };
        const m = Kit.modal({ title: '新しく作る', body: h('div', { class: 'stack' }, types, Kit.field({ label: '名前', input: title })), actions: [{ label: 'やめる', kind: 'ghost' }, { label: '作る', kind: 'primary', onClick: create }] });
        title.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); m.close(); create(); } });
      }
      async function rename() {
        const cv = cur(); if (!cv) return;
        const v = await Kit.ask({ title: '名前を変える', label: '名前', value: cv.title || '' });
        if (v == null || !alive) return;
        cv.title = v.trim() || '無題';
        await commit(cv);
        renderBar();
      }
      async function duplicate() {
        const cv = cur(); if (!cv) return;
        const it = await Kit.store.put('canvases', { type: cv.type, title: (cv.title || '無題') + 'のコピー', blocks: Kit.clone(cv.blocks || {}) });
        await reload();
        select(it.id);
        renderAll();
        Kit.toast('複製しました');
      }
      async function removeCanvas() {
        const cv = cur(); if (!cv) return;
        const ok = await Kit.confirm({ title: 'このキャンバスを削除しますか', body: '「' + (cv.title || '無題') + '」を削除します。元に戻せません。', ok: '削除する', danger: true });
        if (!ok || !alive) return;
        const i = items.indexOf(cv);
        await Kit.store.remove('canvases', cv.id);
        await reload();
        select(items[Math.min(i, items.length - 1)] ? items[Math.min(i, items.length - 1)].id : null);
        renderAll();
        Kit.toast('削除しました');
      }
      async function savePng() {
        const cv = cur(); if (!cv) return;
        const c = await drawPng(cv);
        const blob = await Kit.img.toBlob(c, 'image/png');
        if (!blob) { Kit.toast('画像を作れませんでした', { type: 'bad' }); return; }
        const ok = await Kit.download(Kit.safeName(cv.title || TYPE_LABEL[cv.type]) + '.png', blob);
        if (ok) Kit.toast('画像を保存しました');
      }

      /* ── 本体 ── */
      function renderMain() {
        Kit.clear(main);
        for (const k in els) delete els[k];
        const cv = cur();
        if (!cv) {
          main.append(Kit.empty({
            title: 'まだキャンバスがありません', body: '事業の骨組みを1枚にまとめるリーンキャンバスか、お客さん1人を描くペルソナから始めましょう。',
            actions: [Kit.btn('リーンキャンバスを作る', () => openNew('lean'), { kind: 'primary', icon: 'plus' }), Kit.btn('ペルソナを作る', () => openNew('persona'), { icon: 'user' })],
          }));
          return;
        }
        els.title = h('div', { class: 'cv-title' });
        main.append(els.title);
        renderTitle();
        const board = h('div', { class: 'cv-board cv-' + cv.type, role: 'region', 'aria-label': TYPE_LABEL[cv.type] });
        for (const a of areasOf(cv.type)) {
          const area = h('div', { class: 'cv-area', 'data-area': a.area, style: { order: String(a.no) } });
          for (const key of a.keys) area.append(blockEl(cv, defOf(cv.type, key)));
          board.append(area);
        }
        main.append(board);
        boardW = main.clientWidth;
        growAll();
        els.checks = h('ul', { class: 'cv-checks' });
        const aiOut = h('div', { class: 'cv-ai-out', 'aria-live': 'polite', hidden: true });
        const aiAll = Kit.ai.button('全体を見てもらう', async () => {
          const c = cur(); if (!c) return;
          aiOut.hidden = false; aiOut.textContent = '読んでいます…';
          const ask = c.type === 'persona'
            ? '・この人の姿が、ひとりの人として具体的に浮かぶか\n・悩み・いまの解決策・決め手のつながりに無理がないか\n・このお客さんに届けるとき、次に確かめるべきことを1つ'
            : '・課題 → ソリューション → 独自の価値提案のつながりに筋が通っているか\n・お客さんが十分に絞れているか\n・チャネルと主要指標が具体的か\n・次に確かめるべき仮説を1つ';
          const prompt = (await Kit.ai.context()) + '\n\n次の' + TYPE_LABEL[c.type] + 'を見て、短く講評してください。\n\n' + toMd(c) + '\n\n見てほしいこと：\n' + ask + '\n\n全体で400字以内、です・ます調、箇条書きで。誇張やはげましの言葉は不要です。';
          await Kit.ai.ask(prompt, { onText: ({ text }) => { aiOut.textContent = text; } });
        }, { sm: true });
        main.append(h('div', { class: 'cv-side' },
          h('section', { class: 'card' }, h('div', { class: 'card-h' }, h('h3', null, '見直しのヒント'), h('span', { class: 'spacer' }), aiAll), els.checks, aiOut),
          h('details', { class: 'help cv-howto' }, h('summary', null, cv.type === 'persona' ? 'ペルソナの使い方' : 'リーンキャンバスの書き方'),
            cv.type === 'persona'
              ? h('ol', null, h('li', null, '実在の1人を思い浮かべて書きます（名前は仮でかまいません）'), h('li', null, '悩みと「よく言う言葉」は、本人の言葉のままで'), h('li', null, '情報を得る場所は、リーンキャンバスのチャネルに使います'), h('li', null, '決め手は、ホームページや申し込みページの最初に置きます'))
              : h('ol', null, h('li', null, '番号の順に、1枚を20分ほどで埋めます。迷ったら空けておきます'), h('li', null, '1つの欄に書くのは3つほど。短い言葉で'), h('li', null, '書いたことは「仮説」です。お客さんに会って確かめ、書きかえます'), h('li', null, '項目はドラッグで並べかえられます（スマホは矢印のボタン）')))));
        renderChecks();
      }

      function renderTitle() {
        const cv = cur();
        if (!cv || !els.title) return;
        Kit.clear(els.title);
        Kit.add(els.title, [h('h2', null, cv.title || '無題'), h('span', { class: 'chip blue' }, TYPE_LABEL[cv.type]), cv.sample ? h('span', { class: 'chip sample' }, 'サンプル') : null,
          !cv.sample && cv.updatedAt ? h('span', { class: 'cv-when' }, '更新 ' + Kit.ago(cv.updatedAt)) : null,
          h('span', { class: 'spacer' }),
          h('span', { class: 'cv-export' }, Kit.btn('画像で保存', savePng, { icon: 'image', sm: true }), Kit.btn('文章でコピー', () => Kit.copy(toMd(cur()), '文章（Markdown）をコピーしました'), { icon: 'copy', sm: true }))]);
      }
      function renderChecks() {
        const cv = cur();
        if (!cv || !els.checks) return;
        Kit.clear(els.checks);
        for (const c of checks(cv)) {
          els.checks.append(h('li', null, h('span', { class: 'chip ' + (c.ok ? 'ok' : 'warn') }, h('span', { class: 'dot' }), c.ok ? 'できています' : '見直す'), h('span', null, c.text)));
        }
      }

      // 1つの欄（見出し・項目の列・書きこむ欄・AIの案）
      function blockEl(cv, d) {
        const block = h('section', { class: 'cv-block' + (d.sub ? ' cv-sub' : ''), dataset: { key: d.key }, 'aria-label': d.label });
        const list = h('ul', { class: 'cv-list', 'aria-label': d.label + 'の項目' });
        const hint = h('p', { class: 'cv-hint', hidden: true });
        const add = h('textarea', { class: 'cv-add', id: 'cv-add-' + d.key, rows: 1, placeholder: '例：' + d.ex, 'aria-label': d.label + 'に書きこむ（Enterで追加）' });
        const addBtn = Kit.btn('', () => addItem(), { icon: 'plus', sm: true, kind: 'ghost', title: d.label + 'に追加' });
        const sg = h('div', { class: 'cv-suggs', hidden: true });
        const addItem = async (text) => {
          const v = String(text != null ? text : add.value).replace(/\s+/g, ' ').trim();
          if (!v) { add.focus(); return false; }
          const arr = (cv.blocks[d.key] = cv.blocks[d.key] || []);
          if (arr.length >= MAX) { Kit.toast(d.label + 'は' + MAX + 'つまでです', { type: 'bad' }); return false; }
          arr.push(v);
          if (text == null) { add.value = ''; grow(add); }
          renderList(cv, d);
          await commit(cv);
          return true;
        };
        add.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && e.keyCode !== 229) { e.preventDefault(); addItem(); }
        });
        add.addEventListener('input', () => grow(add));
        const aiBtn = Kit.ai.button('AIと考える', async () => {
          const c = cur(); if (!c) return;
          const have = (c.blocks[d.key] || []).join(' / ') || 'なし';
          const prompt = (await Kit.ai.context()) + '\n\nいま' + TYPE_LABEL[c.type] + 'を書いています（名前：' + (c.title || '無題') + '）。\nいまの内容：\n' + toMd(c) +
            '\n\n「' + d.label + '」の欄（' + d.q + '）に入れる案を、3〜5個考えてください。\n・すでに書いてあるもの（' + have + '）と重ならないように\n・1つ30字以内、短い言い切りで、具体的に\n答えは JSON の文字列の配列だけにしてください。例：["案1", "案2", "案3"]';
          Kit.clear(sg); sg.hidden = false;
          sg.append(h('span', { class: 'small muted' }, 'AIが考えています…'));
          try {
            const r = await Kit.ai.ask(prompt, { json: true });
            const arr = Array.isArray(r) ? r : (r && typeof r === 'object' ? Object.values(r).find(Array.isArray) || [] : []);
            suggs[d.key] = arr.filter((x) => typeof x === 'string' && x.trim()).map((x) => x.trim().slice(0, 60)).slice(0, 5);
            if (!suggs[d.key].length) Kit.toast('案が出ませんでした。もう一度お試しください', { type: 'bad' });
          } finally { renderSuggs(); }
        }, { sm: true });
        // 5列の画面では絵だけのボタンになるので、名前を残す
        aiBtn.title = d.label + 'をAIと考える';
        aiBtn.setAttribute('aria-label', d.label + 'をAIと考える');
        const renderSuggs = () => {
          Kit.clear(sg);
          const arr = suggs[d.key] || [];
          sg.hidden = !arr.length;
          if (!arr.length) return;
          sg.append(h('span', { class: 'small muted' }, '押すと追加：'));
          arr.forEach((t, i) => sg.append(h('button', { type: 'button', class: 'chip', onclick: async () => { if (await addItem(t)) { arr.splice(i, 1); renderSuggs(); } } }, Kit.icon('plus', 12), t)));
          sg.append(Kit.btn('閉じる', () => { suggs[d.key] = []; renderSuggs(); }, { sm: true, kind: 'ghost' }));
        };
        block.append(
          h('div', { class: 'cv-bh' }, d.sub ? null : h('span', { class: 'cv-no', 'aria-hidden': 'true' }, String(d.no)), h('h3', null, d.label), h('span', { class: 'spacer' }), aiBtn),
          h('p', { class: 'cv-q' }, d.q),
          list, hint, h('div', { class: 'cv-addrow' }, add, addBtn), sg);
        // ドラッグで並べかえ（欄をまたいでも動かせる）
        block.addEventListener('dragover', (e) => {
          if (!drag) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          markDrop(list, dropIndex(list, e.clientY));
        });
        block.addEventListener('dragleave', (e) => { if (!block.contains(e.relatedTarget)) clearDrop(); });
        block.addEventListener('drop', (e) => {
          if (!drag) return;
          e.preventDefault();
          const to = dropIndex(list, e.clientY);
          const from = drag;
          drag = null;
          clearDrop();
          moveItem(cv, from.key, from.i, d.key, to);
        });
        els['list:' + d.key] = { list, hint, add, addBtn, d };
        renderList(cv, d);
        renderSuggs();
        return block;
      }
      // 高さを中身に合わせる。空のときは、例（placeholder）が全部見える高さにする
      const grow = (ta) => {
        if (!ta.isConnected) return;
        const v = ta.value, ph = !v && ta.placeholder;
        if (ph) ta.value = ta.placeholder;
        ta.style.height = 'auto';
        const hh = ta.scrollHeight + 2;
        if (ph) ta.value = v;
        ta.style.height = hh + 'px';
      };
      const growAll = () => { for (const ta of main.querySelectorAll('.cv-add')) grow(ta); };
      let boardW = 0;
      const ro = window.ResizeObserver ? new ResizeObserver(Kit.debounce(() => { const w = main.clientWidth; if (alive && Math.abs(w - boardW) > 4) { boardW = w; growAll(); } }, 120)) : null;
      if (ro) ro.observe(main);
      function dropIndex(list, y) {
        const lis = [...list.children].filter((li) => !li.classList.contains('cv-dragging'));
        for (let i = 0; i < lis.length; i++) { const r = lis[i].getBoundingClientRect(); if (y < r.top + r.height / 2) return +lis[i].dataset.i; }
        return lis.length ? +lis[lis.length - 1].dataset.i + 1 : 0;
      }
      function markDrop(list, idx) {
        clearDrop();
        const li = [...list.children].find((x) => +x.dataset.i === idx && !x.classList.contains('cv-dragging'));
        if (li) li.classList.add('cv-drop-before'); else list.classList.add('cv-drop-end');
      }
      function clearDrop() { for (const el of main.querySelectorAll('.cv-drop-before, .cv-drop-end')) el.classList.remove('cv-drop-before', 'cv-drop-end'); }

      // 項目の列だけを描き直す（書きこむ欄はそのまま）
      function renderList(cv, d) {
        const ref = els['list:' + d.key];
        if (!ref) return;
        const { list, hint, add, addBtn } = ref;
        const arr = cv.blocks[d.key] || [];
        Kit.clear(list);
        arr.forEach((text, i) => list.append(itemEl(cv, d, text, i, arr.length)));
        const msg = arr.length >= MAX ? MAX + 'つまでです。大事なものから残しましょう。' : d.soft && arr.length > d.soft ? (d.softMsg || d.soft + 'つまでにすると、1枚で見渡せます。') : '';
        Kit.clear(hint);
        hint.hidden = !msg;
        if (msg) hint.append(Kit.icon('info'), h('span', null, msg));
        const full = arr.length >= MAX;
        add.disabled = full; addBtn.disabled = full;
        add.placeholder = full ? MAX + 'つまで書けます' : arr.length ? 'ほかにも書く' : '例：' + d.ex;
        grow(add);
      }
      function itemEl(cv, d, text, i, n) {
        const li = h('li', { class: 'cv-item', dataset: { i: String(i) } });
        const t = h('div', { class: 'cv-text', tabindex: '0', role: 'button', title: 'クリックで書きかえ', 'aria-label': text + '（書きかえる）' }, text);
        t.addEventListener('click', () => startEdit(cv, d, i, li));
        t.addEventListener('keydown', (e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !e.altKey) { e.preventDefault(); startEdit(cv, d, i, li); }
          else if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) { e.preventDefault(); moveBy(cv, d, i, e.key === 'ArrowUp' ? -1 : 1); }
          else if (e.key === 'Delete') { e.preventDefault(); removeItem(cv, d, i); }
        });
        // マウス：のせると × だけ（並べかえはドラッグ）。キーボード・タッチ：上へ・下へ・×
        const tools = h('span', { class: 'cv-tools' },
          Kit.btn('', () => moveBy(cv, d, i, -1), { icon: 'arrowUp', sm: true, kind: 'ghost', title: '上へ', disabled: i === 0, class: 'cv-move' }),
          Kit.btn('', () => moveBy(cv, d, i, 1), { icon: 'arrowDown', sm: true, kind: 'ghost', title: '下へ', disabled: i === n - 1, class: 'cv-move' }),
          Kit.btn('', () => removeItem(cv, d, i), { icon: 'close', sm: true, kind: 'ghost', title: '消す' }));
        li.append(t, tools);
        if (fine.matches) {
          li.draggable = true;
          li.addEventListener('dragstart', (e) => {
            drag = { key: d.key, i };
            e.dataTransfer.effectAllowed = 'move';
            try { e.dataTransfer.setData('text/plain', text); } catch (err) { /* 古いブラウザ */ }
            requestAnimationFrame(() => li.classList.add('cv-dragging'));
          });
          li.addEventListener('dragend', () => { drag = null; li.classList.remove('cv-dragging'); clearDrop(); });
        }
        return li;
      }
      function startEdit(cv, d, i, li) {
        const orig = (cv.blocks[d.key] || [])[i];
        if (orig == null) return;
        const ta = h('textarea', { class: 'cv-edit', rows: 1, 'aria-label': d.label + 'の項目を書きかえる（Enterで決定）' });
        ta.value = orig;
        li.classList.add('cv-editing');
        li.draggable = false;
        li.querySelector('.cv-text').replaceWith(ta);
        grow(ta);
        ta.focus();
        ta.setSelectionRange(ta.value.length, ta.value.length);
        let done = false;
        // 書き終えたら、その項目だけを文字に戻す（ほかの項目はそのままなので、続けてクリックできる）
        const finish = async (save, refocus) => {
          if (done) return;
          done = true;
          const v = ta.value.replace(/\s+/g, ' ').trim();
          const changed = save && v !== orig;
          if (changed && !v) { removeItem(cv, d, i); return; }
          if (changed) cv.blocks[d.key][i] = v;
          const arr = cv.blocks[d.key] || [];
          const fresh = itemEl(cv, d, arr[i], i, arr.length);
          if (li.isConnected) li.replaceWith(fresh);
          if (refocus) { const t = fresh.querySelector('.cv-text'); if (t) t.focus(); }
          if (changed) await commit(cv);
        };
        ta.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && e.keyCode !== 229) { e.preventDefault(); finish(true, true); }
          else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); finish(false, true); }
        });
        ta.addEventListener('input', () => grow(ta));
        ta.addEventListener('blur', () => finish(true, false));
      }
      function focusItem(key, i) {
        const ref = els['list:' + key];
        if (!ref) return;
        const li = ref.list.children[i];
        const t = li && li.querySelector('.cv-text');
        if (t) t.focus(); else ref.add.focus();
      }
      async function moveBy(cv, d, i, delta) {
        const arr = cv.blocks[d.key] || [];
        const j = i + delta;
        if (j < 0 || j >= arr.length) return;
        [arr[i], arr[j]] = [arr[j], arr[i]];
        renderList(cv, d);
        const li = els['list:' + d.key].list.children[j];
        const b = li && (li.querySelector('[title="' + (delta < 0 ? '上へ' : '下へ') + '"]:not(:disabled)') || li.querySelector('.cv-text'));
        if (b) b.focus();
        await commit(cv);
      }
      async function moveItem(cv, fromKey, fromI, toKey, toI) {
        const src = cv.blocks[fromKey] || [];
        if (fromI < 0 || fromI >= src.length) return;
        if (fromKey === toKey) {
          if (toI === fromI || toI === fromI + 1) return;
          const [it] = src.splice(fromI, 1);
          src.splice(toI > fromI ? toI - 1 : toI, 0, it);
          renderList(cv, defOf(cv.type, fromKey));
        } else {
          const dst = (cv.blocks[toKey] = cv.blocks[toKey] || []);
          if (dst.length >= MAX) { Kit.toast(defOf(cv.type, toKey).label + 'は' + MAX + 'つまでです', { type: 'bad' }); return; }
          const [it] = src.splice(fromI, 1);
          dst.splice(Math.min(toI, dst.length), 0, it);
          renderList(cv, defOf(cv.type, fromKey));
          renderList(cv, defOf(cv.type, toKey));
        }
        await commit(cv);
      }
      async function removeItem(cv, d, i) {
        const arr = cv.blocks[d.key] || [];
        const [gone] = arr.splice(i, 1);
        if (gone == null) return;
        renderList(cv, d);
        focusItem(d.key, Math.min(i, arr.length - 1));
        await commit(cv);
        Kit.toast('消しました', { action: { label: '元に戻す', onClick: async () => {
          if (!alive || cur() !== cv) return;
          const a = (cv.blocks[d.key] = cv.blocks[d.key] || []);
          a.splice(Math.min(i, a.length), 0, gone);
          renderList(cv, d);
          await commit(cv);
        } } });
      }

      renderAll();
      return () => { alive = false; if (ro) ro.disconnect(); };
    },
  });
})();
