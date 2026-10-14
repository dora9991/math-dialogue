// まずはここから：はじめての人の入口。3分デモ、いまの段階に合わせた最初の3歩、はじめの5つ、ツールのつながり
(function () {
  'use strict';
  const { h } = Kit;
  const G = window.Guide;

  // 入口から案内する「やりたいこと」。ほかは各ツールの項目（js/guide/help-*.js）を使う
  G.tasks([
    { id: 'start-demo', app: 'start', title: '3分デモを見る', words: 'デモ 見本 使い方 全体 体験 ためす お試し チュートリアル', tip: '問い合わせが売上になるまでを、実際の画面で追いかけます。保存はされません。', run: () => G.demo() },
    { id: 'start-profile', app: 'dashboard', title: '事業プロフィールを入れる', words: '屋号 名前 会社名 連絡先 メール 住所 プロフィール 設定 はじめる', tip: '屋号や連絡先は、ホームページ・請求書などすべてのツールで使い回されます。', run: async () => { await Kit.profile.edit(); Kit.remount(); } },
  ]);
  // 検索の「よく使うこと」
  G.pinned(['start-demo', 'start-profile', 'inbox-delivery', 'site-publish', 'inbox-reply', 'invoice-pdf', 'calendar-booking', 'dash-backup']);

  // いまの段階ごとの、最初の3歩
  const STAGES = [
    { id: 'idea', icon: 'canvas', name: '考え中', sub: 'アイデアを形にしたい', steps: [
      ['canvas-write', '事業の骨組みを1枚に書く', 'だれの、どんな困りごとを解決するかを、短い言葉で並べます。'],
      ['money-profit', '数字で確かめる', '値段と件数を入れると、無理のない計画かどうかが見えます。'],
      ['roadmap-rule', '兼業のルールを確かめる', '勤め先によっては許可が要ります。先に確かめておくと安心です。'],
    ] },
    { id: 'prep', icon: 'store', name: '準備中', sub: '届出や、お店の顔をつくる', steps: [
      ['start-profile', '事業プロフィールを入れる', '屋号や連絡先を一度入れると、全部のツールで使われます。'],
      ['editor-text', 'ホームページを書きかえる', 'サンプルの文章を自分の言葉に直すところから。'],
      ['inbox-delivery', '問い合わせの送信先を決める', 'これを決めないと、公開したページの問い合わせが届きません。'],
    ] },
    { id: 'run', icon: 'chart', name: '始めている', sub: 'お客さんを増やしたい・お金を整えたい', steps: [
      ['inbox-status', '問い合わせを受付箱で見守る', '返信・商談・成約を、状態ごとに追いかけます。'],
      ['sns-rhythm', '投稿のリズムを作る', '続けられる回数を決めて、ネタの枠を先に用意します。'],
      ['invoice-new', '見積書・請求書を出す', 'インボイス制度に合わせた書類を、PDFで送れます。'],
    ] },
  ];

  // はじめの5つ（保存されている内容から、できたかどうかを自動で判断する）
  async function checklist() {
    const [p, site, form, events, posts] = await Promise.all([Kit.profile.get(), Kit.store.get('site'), Kit.store.get('form'), Kit.store.list('events'), Kit.store.list('posts')]);
    const d = (form && form.delivery) || {};
    const ready = d.type === 'mailto' ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.to || '') : d.type && d.type !== 'demo' ? /^https:\/\/\S+$/i.test(d.url || '') : false;
    return [
      { done: !p._sample && !!p.name, task: 'start-profile', title: '事業プロフィールを自分のものにする', why: '屋号・連絡先が、ホームページや請求書に入ります。' },
      { done: !!site && !site._sample, task: 'editor-text', title: 'ホームページを自分の内容に書きかえる', why: 'サンプルの文章を1か所直すだけでも、自分のページになります。' },
      { done: ready, task: 'inbox-delivery', title: '問い合わせの送信先を決める', why: '決めるまでは、公開したページの問い合わせがどこにも届きません。' },
      { done: !!(site && site.publishedUrl), task: 'site-publish', title: 'ホームページを公開して、URLを入れる', why: 'URLを入れると、チラシ用のQRコードが作れます。' },
      { done: events.some((e) => !e.sample) || posts.some((x) => !x.sample && x.status !== 'idea'), task: 'calendar-quick', title: '最初の予定か投稿を入れる', why: '体験会や投稿の日を決めると、動き出せます。' },
    ];
  }
  window.StartGuide = { checklist };

  // ツールのつながり（左から右へ）
  const FLOW = [
    { name: '骨組み', tools: ['canvas'] },
    { name: '数字', tools: ['money'] },
    { name: 'お店の顔', tools: ['editor', 'video'] },
    { name: '発信', tools: ['sns'] },
    { name: '受付', tools: ['inbox', 'calendar'] },
    { name: 'いただく', tools: ['invoice'] },
  ];

  const FAQ = [
    ['データはどこに保存されますか？', 'Claude のページとして開いているときは、あなたのアカウントに保存されます（スマホとパソコンで同じ内容）。ウェブのURLやダウンロードしたファイルで開いたときは、そのブラウザの中だけに保存され、どこにも送られません。どちらも、ダッシュボードの「バックアップを書き出す」で控えをとれます。'],
    ['スマホでも使えますか？', '使えます。メニューは左上のボタン、やりたいことの検索と使い方は右上のボタンです。動画の書き出しなど重い作業は、パソコンのほうが快適です。'],
    ['サンプルを消したい／もう一度見たい', 'ダッシュボードの「サンプルを片付ける」で消せます。自分で入力したものは残ります。もう一度見たいときは、この画面の「3分デモを見る」で、いつでもサンプルの世界を見られます（保存はされません）。'],
    ['ホームページを公開するには？', 'エディターで「公開用HTMLを書き出す」を押すと、1つのファイルができます。Netlify Drop などの無料サービスに置けば公開できます。手順はホームページの画面の「公開のしかた」にあります。'],
    ['人にすすめたいときは？', 'このページを共有すると、受け取った人はそれぞれ自分のブラウザで、自分のデータで使えます。あなたのデータは見えません。'],
    ['AIのボタンが出てきません', 'AIの提案ボタンは、Claude のページとして開いたときだけ出ます。ウェブのURLやダウンロードしたファイルで開いたときは出ませんが、ほかの機能はすべて使えます。'],
  ];

  Kit.css('start', `
    .st-hero { display: grid; gap: 24px; grid-template-columns: 1fr; align-items: center; padding: 8px 0 26px; border-bottom: 1px solid var(--line); }
    @media (min-width: 900px) { .st-hero { grid-template-columns: minmax(0, 1fr) 260px; } }
    .st-eyebrow { font-size: 12.5px; font-weight: 700; letter-spacing: .2em; color: var(--shu); }
    .st-title { font-family: var(--font-display); font-weight: 800; font-size: clamp(34px, 6vw, 54px); letter-spacing: .04em; line-height: 1.2; margin: 8px 0 14px; }
    .st-lead { font-size: 16px; color: var(--ink-2); max-width: 36em; line-height: 1.85; }
    .st-hero .btn-row { margin-top: 20px; }
    .st-hero .btn.primary { min-height: 46px; padding: 10px 20px; font-size: 15.5px; }
    .st-hero .btn.big { min-height: 46px; padding: 10px 18px; font-size: 15px; }
    .st-note { font-size: 12.5px; color: var(--ink-3); margin-top: 10px; }
    /* のれん（飾り） */
    .st-noren { position: relative; height: 220px; display: none; }
    @media (min-width: 900px) { .st-noren { display: block; } }
    .st-noren .rod { position: absolute; left: 6px; right: 6px; top: 12px; height: 8px; border-radius: 4px; background: var(--ink-2); }
    .st-noren .panels { position: absolute; left: 22px; right: 22px; top: 18px; bottom: 10px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px; }
    .st-noren .panels i { background: var(--noren); border-radius: 0 0 6px 6px; position: relative; }
    .st-noren .mon { position: absolute; left: 50%; top: 42%; width: 64px; height: 64px; margin: -32px 0 0 -32px; border-radius: 50%; border: 3px solid var(--on-noren); display: grid; place-items: center; color: var(--on-noren); font-family: var(--font-display); font-weight: 800; font-size: 26px; }
    .st-noren .seal { position: absolute; right: 8px; bottom: 0; width: 38px; height: 38px; border-radius: 6px; background: var(--shu); color: var(--on-shu); display: grid; place-items: center; font-family: var(--font-display); font-weight: 800; font-size: 19px; transform: rotate(-5deg); box-shadow: var(--shadow-1); }

    .st-sec { padding: 26px 0; border-bottom: 1px solid var(--line); }
    .st-sec:last-child { border-bottom: 0; }
    .st-h2 { font-family: var(--font-display); font-weight: 800; font-size: 22px; letter-spacing: .03em; margin-bottom: 6px; }
    .st-sub { color: var(--ink-2); font-size: 14px; margin-bottom: 14px; }
    .st-stages { display: grid; gap: 10px; grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr)); }
    .st-stage { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 2px 12px; align-items: center; text-align: left; padding: 14px; border-radius: var(--r); border: 1.5px solid var(--line); background: var(--surface); color: var(--ink); font: inherit; cursor: pointer; }
    .st-stage:hover { border-color: var(--gosu); }
    .st-stage[aria-checked="true"] { border-color: var(--gosu); background: var(--gosu-wash); }
    .st-stage .ic { grid-row: span 2; width: 38px; height: 38px; border-radius: 10px; display: grid; place-items: center; background: var(--surface-2); color: var(--gosu); }
    .st-stage[aria-checked="true"] .ic { background: var(--gosu); color: var(--on-gosu); }
    .st-stage .ic svg { width: 20px; height: 20px; }
    .st-stage .nm { font-weight: 700; font-size: 16px; }
    .st-stage .sb { font-size: 13px; color: var(--ink-2); }
    .st-steps { display: grid; gap: 10px; margin-top: 16px; grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr)); }
    .st-step { display: grid; grid-template-rows: auto auto 1fr auto; gap: 6px; padding: 16px; border-radius: var(--r); background: var(--surface); border: 1px solid var(--line); }
    .st-step .no { font-family: var(--font-display); font-weight: 800; font-size: 28px; line-height: 1; color: var(--gosu); }
    .st-step .tt { font-weight: 700; font-size: 16px; }
    .st-step .wy { font-size: 13.5px; color: var(--ink-2); }
    .st-step .btn { justify-self: start; margin-top: 4px; }
    .st-check-head { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
    .st-check-head .meter { flex: 1 1 160px; max-width: 280px; }
    .st-checks { list-style: none; margin: 14px 0 0; padding: 0; display: grid; border: 1px solid var(--line); border-radius: var(--r); background: var(--surface); overflow: hidden; }
    .st-checks li { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 2px 12px; align-items: center; padding: 12px 14px; border-bottom: 1px solid var(--line); }
    .st-checks li:last-child { border-bottom: 0; }
    .st-checks .mk { grid-row: span 2; width: 26px; height: 26px; border-radius: 50%; border: 1.5px solid var(--line-strong); display: grid; place-items: center; color: transparent; }
    .st-checks .mk svg { width: 15px; height: 15px; }
    .st-checks li.is-done .mk { background: var(--ok); border-color: var(--ok); color: var(--surface); }
    .st-checks .tt { font-weight: 700; font-size: 14.5px; }
    .st-checks li.is-done .tt { color: var(--ink-3); }
    .st-checks .wy { grid-column: 2; font-size: 12.5px; color: var(--ink-3); }
    .st-checks .btn { grid-row: span 2; }
    .st-done-line { margin-top: 12px; font-size: 14px; color: var(--ok); font-weight: 700; }
    .st-flow { display: grid; gap: 8px; grid-template-columns: 1fr; counter-reset: st; }
    @media (min-width: 900px) { .st-flow { grid-template-columns: repeat(6, minmax(0, 1fr)); } }
    .st-node { position: relative; padding: 12px; border-radius: var(--r); background: var(--surface-2); display: grid; gap: 6px; align-content: start; }
    .st-node .lb { font-weight: 700; font-size: 15px; display: flex; align-items: baseline; gap: 6px; }
    .st-node .lb::before { counter-increment: st; content: counter(st); font-family: var(--font-display); font-weight: 800; color: var(--gosu); font-size: 14px; }
    .st-node .tl { display: flex; flex-wrap: wrap; gap: 4px; }
    .st-node .tl .chip { cursor: pointer; }
    @media (min-width: 900px) { .st-node:not(:last-child)::after { content: ""; position: absolute; right: -7px; top: 50%; width: 8px; height: 8px; border-top: 2px solid var(--ink-3); border-right: 2px solid var(--ink-3); transform: translateY(-50%) rotate(45deg); } }
    @media (max-width: 899px) { .st-node:not(:last-child)::after { content: ""; position: absolute; left: 22px; bottom: -7px; width: 8px; height: 8px; border-right: 2px solid var(--ink-3); border-bottom: 2px solid var(--ink-3); transform: rotate(45deg); } }
    .st-tips { display: grid; gap: 10px; grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr)); }
    .st-tip { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 4px 12px; padding: 14px; border-radius: var(--r); border: 1px solid var(--line); background: var(--surface); text-align: left; font: inherit; color: inherit; cursor: pointer; }
    .st-tip:hover { border-color: var(--gosu); }
    .st-tip .ic { grid-row: span 2; width: 34px; height: 34px; border-radius: 9px; display: grid; place-items: center; background: var(--gosu-wash); color: var(--gosu); }
    .st-tip .ic svg { width: 18px; height: 18px; }
    .st-tip .tt { font-weight: 700; }
    .st-tip .wy { font-size: 13px; color: var(--ink-2); }
    .st-faq details { border-bottom: 1px solid var(--line); padding: 12px 0; }
    .st-faq summary { cursor: pointer; font-weight: 700; list-style: none; display: flex; gap: 10px; }
    .st-faq summary::-webkit-details-marker { display: none; }
    .st-faq summary::before { content: "Q"; font-family: var(--font-display); font-weight: 800; color: var(--gosu); }
    .st-faq details p { margin-top: 8px; padding-left: 1.4em; color: var(--ink-2); font-size: 14px; max-width: 46em; }
  `);

  G.help('start', {
    lead: 'はじめての人のための入口です。デモで全体を見て、いまの段階に合う最初の3歩から始めます。',
    can: ['3分デモで、ツールのつながりを見る（保存されません）', 'いまの段階に合う、最初の3歩を知る', 'はじめの5つの進み具合を見る', 'やりたいことから、その画面へ行く'],
    first: [{ text: '3分デモを見る', task: 'start-demo' }, { text: '事業プロフィールを入れる', task: 'start-profile' }, { text: '問い合わせの送信先を決める', task: 'inbox-delivery' }],
    faq: FAQ.slice(0, 4).map(([q, a]) => ({ q, a })),
    tour: [
      { target: '.app-start .st-hero .btn.primary', title: 'まずはデモから', body: '「3分デモを見る」で、問い合わせが売上になるまでを実際の画面で追いかけます。触っても保存されません。' },
      { target: '.app-start .st-stages', title: 'いまの段階を選ぶ', body: '考え中・準備中・始めているから選ぶと、下に最初の3歩が出ます。' },
      { target: '.app-start .st-checks', title: 'はじめの5つ', body: 'できたものには自動で印がつきます。全部できたら、あとは一つずつで大丈夫です。' },
      { target: '.app-start .st-tips', title: '迷ったときは', body: 'やりたいことを言葉で探すか、そのページの使い方を開けます。メニューの上と下、スマホでは右上にあります。' },
    ],
    related: ['dashboard', 'roadmap'],
  });

  Kit.app({
    id: 'start', title: 'まずはここから', group: 'home', icon: 'star', order: 0,
    desc: 'はじめての人の入口。3分デモと、最初の3歩',
    async mount(root) {
      Kit.pref.set('guide.seen', true);
      let alive = true;
      let stage = Kit.pref.get('guide.stage', 'prep');

      const hero = h('section', { class: 'st-hero' },
        h('div', null,
          h('p', { class: 'st-eyebrow' }, 'はじめての方へ'),
          h('h1', { class: 'st-title' }, 'まずは、ここから。'),
          h('p', { class: 'st-lead' }, '11のツールがありますが、全部を使う必要はありません。いまのあなたに合う最初の3歩と、迷ったときの探し方を案内します。'),
          h('div', { class: 'btn-row' },
            Kit.btn('3分デモを見る', () => G.demo(), { kind: 'primary', icon: 'play' }),
            Kit.btn('やりたいことから探す', () => G.openSearch(), { icon: 'search', class: 'big' })),
          h('p', { class: 'st-note' }, 'デモの中で触ったものは保存されません。何度でも見られます。')),
        h('div', { class: 'st-noren', 'aria-hidden': 'true' }, h('span', { class: 'rod' }), h('span', { class: 'panels' }, h('i'), h('i'), h('i')), h('span', { class: 'mon' }, '店'), h('span', { class: 'seal' }, '開')));

      const stageBox = h('div', { class: 'st-stages', role: 'radiogroup', 'aria-label': 'いまの段階' });
      const stepsBox = h('div', { class: 'st-steps' });
      const renderStages = () => {
        Kit.clear(stageBox);
        for (const s of STAGES) {
          stageBox.append(h('button', { type: 'button', class: 'st-stage', role: 'radio', 'aria-checked': String(s.id === stage), onclick: () => { stage = s.id; Kit.pref.set('guide.stage', stage); renderStages(); } },
            h('span', { class: 'ic' }, Kit.icon(s.icon)), h('span', { class: 'nm' }, s.name), h('span', { class: 'sb' }, s.sub)));
        }
        Kit.clear(stepsBox);
        const cur = STAGES.find((s) => s.id === stage) || STAGES[1];
        cur.steps.forEach(([task, title, why], i) => stepsBox.append(h('div', { class: 'st-step' },
          h('span', { class: 'no' }, String(i + 1)), h('span', { class: 'tt' }, title), h('span', { class: 'wy' }, why),
          Kit.btn('ここを開く', () => G.runTask(task), { sm: true, kind: i === 0 ? 'primary' : '', icon: 'right' }))));
      };
      renderStages();

      const checkBox = h('section', { class: 'st-sec', 'aria-label': 'はじめの5つ' });
      const renderChecks = async () => {
        const items = await checklist();
        if (!alive) return;
        const n = items.filter((x) => x.done).length;
        Kit.clear(checkBox);
        checkBox.append(
          h('div', { class: 'st-check-head' }, h('h2', { class: 'st-h2' }, 'はじめの5つ'), h('span', { class: 'num ink-2' }, n + ' / 5'),
            h('div', { class: 'meter' + (n === 5 ? ' ok' : ''), role: 'progressbar', 'aria-valuenow': n * 20, 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-label': 'はじめの5つの進み具合' }, h('i', { style: { width: n * 20 + '%' } }))),
          h('p', { class: 'st-sub' }, 'お店として動き出すための、最初の5つです。できたものには自動で印がつきます。'),
          h('ol', { class: 'st-checks' }, items.map((x) => h('li', { class: x.done ? 'is-done' : null },
            h('span', { class: 'mk', 'aria-label': x.done ? 'できています' : 'まだです' }, Kit.icon('check')),
            h('span', { class: 'tt' }, x.title), h('span', { class: 'wy' }, x.why),
            x.done ? h('span', { class: 'chip ok' }, 'できました') : Kit.btn('やる', () => G.runTask(x.task), { sm: true, icon: 'right' })))),
          n === 5 ? h('p', { class: 'st-done-line' }, '5つ全部できました。ここから先は、いまの波で一つずつで大丈夫です。') : null);
      };

      const flow = h('section', { class: 'st-sec', 'aria-label': 'ツールのつながり' },
        h('h2', { class: 'st-h2' }, 'ツールのつながり'),
        h('p', { class: 'st-sub' }, '左から右へ、お店ができて、お客さんが来て、お金をいただくまで。名前を押すと、その画面のツアーが始まります。'),
        h('div', { class: 'st-flow' }, FLOW.map((f) => h('div', { class: 'st-node' }, h('span', { class: 'lb' }, f.name),
          h('span', { class: 'tl' }, f.tools.filter((id) => Kit.appDef(id)).map((id) => h('button', { type: 'button', class: 'chip line', onclick: () => G.tourApp(id) }, Kit.appDef(id).title)))))));

      const tips = h('section', { class: 'st-sec', 'aria-label': '迷ったときは' },
        h('h2', { class: 'st-h2' }, '迷ったときは'),
        h('div', { class: 'st-tips' },
          h('button', { type: 'button', class: 'st-tip', onclick: () => G.openSearch() }, h('span', { class: 'ic' }, Kit.icon('search')), h('span', { class: 'tt' }, 'やりたいことを探す'), h('span', { class: 'wy' }, '「請求書」「予約」のように言葉で探すと、その画面へ行って押す場所を光らせます。キーボードの / でも開けます。')),
          h('button', { type: 'button', class: 'st-tip', onclick: () => G.openHelp('start') }, h('span', { class: 'ic' }, Kit.icon('info')), h('span', { class: 'tt' }, 'このページの使い方'), h('span', { class: 'wy' }, 'どの画面でも、メニューの下（スマホは右上の i）から、その画面の使い方とツアーを開けます。')),
          h('button', { type: 'button', class: 'st-tip', onclick: () => Kit.go('dashboard') }, h('span', { class: 'ic' }, Kit.icon('home')), h('span', { class: 'tt' }, '今日やることを見る'), h('span', { class: 'wy' }, 'ダッシュボードに、返信待ちや予定、入金期限が並びます。毎日ここから始めれば大丈夫です。'))));

      const faq = h('section', { class: 'st-sec st-faq', 'aria-label': 'よくある質問' }, h('h2', { class: 'st-h2' }, 'よくある質問'), FAQ.map(([q, a]) => h('details', null, h('summary', null, q), h('p', null, a))));

      root.append(hero,
        h('section', { class: 'st-sec', 'aria-label': 'いまの段階' }, h('h2', { class: 'st-h2' }, 'いまは、どの段階ですか？'), h('p', { class: 'st-sub' }, '選ぶと、最初の3歩が出ます。あとから選びなおせます。'), stageBox, stepsBox),
        checkBox, flow, tips, faq,
        h('div', { class: 'btn-row', style: { paddingTop: '8px' } }, Kit.btn('ダッシュボードへ', () => Kit.go('dashboard'), { icon: 'home' }), Kit.btn('3分デモをもう一度', () => G.demo(), { kind: 'ghost', icon: 'play' })));
      await renderChecks();
      const off = Kit.store.on('*', Kit.debounce(() => { if (alive) renderChecks(); }, 200));
      return () => { alive = false; off(); };
    },
  });
})();
