// 開業ロードマップ：開業届から初売上、続けるところまでの手順。いまの一歩をひとつだけ示す
(function () {
  'use strict';
  const { h } = Kit;

  // 手順。how は短く、link は関係するツール。law は「確かめること」として出す
  const STAGES = [
    { id: 's0', title: '確かめる', note: '始める前に。ここを飛ばすと、あとで困ることがあります。' },
    { id: 's1', title: '数字をつくる', note: '売り物・値段・時間の上限を、ざっくり決めます。' },
    { id: 's2', title: '手続き', note: '税務署などへの届出。どれも無料で、オンラインでも出せます。' },
    { id: 's3', title: 'お店の顔をつくる', note: 'お客さんが見て、安心して問い合わせできる状態にします。' },
    { id: 's4', title: '届ける・いただく', note: '最初のお客さんに出会って、お金をいただくまで。' },
    { id: 's5', title: '続ける', note: '無理なく続けるための習慣です。' },
  ];
  const STEPS = [
    { id: 'rule', stage: 's0', must: true, title: '副業・兼業のルールを確かめる',
      why: '勤め先の決まりで、許可が要ったり禁止されていたりします。',
      how: ['会社員は就業規則を読む', '公務員は許可制。公立学校の先生は、教育委員会などの許可が必要な場合があります（地方公務員法38条・教育公務員特例法17条）', '育休中の人は、手当金（給付金）への影響も確認する（働いた日数・時間で減ったり出なくなったりすることがある）'],
      law: true },
    { id: 'family', stage: 's0', must: true, title: '家族と、使える時間を決める',
      why: '時間と体力には上限があります。先に決めておくと、売り物の選び方が変わります。',
      how: ['1か月に使える時間を決める（例：40時間）', '家事・育児の分担と、休む日を話しておく', 'マネタイズ計画の「使える時間」に入れる'], link: 'money' },
    { id: 'canvas', stage: 's0', title: '事業の骨組みを1枚に書く',
      why: 'だれの、どんな困りごとを、どう解決するか。人に説明できる形にします。',
      how: ['リーンキャンバスの「課題」「顧客」「独自の価値」から埋める', '空欄があっても大丈夫。あとで直す前提で'], link: 'canvas' },
    { id: 'persona', stage: 's0', title: 'お客さん像（ペルソナ）を決める',
      why: 'ひとりの人に向けて書くと、文章も投稿もぶれません。',
      how: ['リーンキャンバスで「ペルソナ」を作る', '悩み・情報を得る場所・決め手を書く'], link: 'canvas' },

    { id: 'price', stage: 's1', must: true, title: '売り物と値段を決める',
      why: '「いくらで、月に何件」が見えると、必要なお客さんの数が分かります。',
      how: ['マネタイズ計画で、収入の柱を2〜3本つくる', '時間を使う商品と、使わない商品をまぜる', '目標の月商から逆算して確かめる'], link: 'money' },
    { id: 'cost', stage: 's1', title: '始めるお金と、毎月のお金を見積もる',
      why: '赤字の期間がどれくらいか、先に知っておくと焦りません。',
      how: ['初期費用（機材・制作費など）を書き出す', '毎月の固定費（ツール代・通信費・広告）を書き出す', '黒字になる月を確かめる'], link: 'money' },
    { id: 'name', stage: 's1', title: '屋号（お店の名前）を決める',
      why: '名刺・ホームページ・SNS・請求書に使います。',
      how: ['同じ地域・同じ業種に同じ名前がないか検索する', 'ドメインやSNSのIDが空いているか見る', '事業プロフィールに入れる'], profile: true },

    { id: 'kaigyo', stage: 's2', must: true, title: '開業届を出す',
      why: '税務署に「個人で事業を始めました」と知らせる届出です。',
      how: ['「個人事業の開業・廃業等届出書」を税務署へ', '事業を始めた日から1か月以内', 'e-Tax やスマホからも出せる。費用はかからない'], law: true },
    { id: 'aoiro', stage: 's2', must: true, title: '青色申告承認申請書を出す',
      why: '確定申告で最大65万円の控除が受けられる可能性があります（帳簿などの条件あり）。',
      how: ['開業届と一緒に出すと楽', '期限：開業した日から2か月以内（1月1日〜15日に開業したときは、その年の3月15日まで）'], law: true },
    { id: 'invoice-reg', stage: 's2', title: 'インボイス登録をするか決める',
      why: '取引先が会社や学校などの事業者だと、登録番号を求められることがあります。',
      how: ['登録すると消費税の申告が必要になる（負担を軽くする特例もある）', 'お客さんが個人中心なら、急がなくてよい場合も', '迷ったら税務署か税理士に相談'], law: true, link: 'invoice' },
    { id: 'bank', stage: 's2', title: '事業用の口座とカードを分ける',
      why: '生活のお金と分けておくと、帳簿づけが一気に楽になります。',
      how: ['屋号つきの口座が作れる銀行もある', '経費の支払いは、なるべく事業用カードで'] },
    { id: 'books', stage: 's2', title: '帳簿のつけ方を決める',
      why: '確定申告のとき、レシートの山と格闘しないために。',
      how: ['会計ソフトか表計算か決める', 'レシート・領収書は保存（写真でも可の場合あり）', '月に一度まとめてつける日を決める'] },
    { id: 'pref', stage: 's2', title: '都道府県の届出を確かめる',
      why: '個人事業税のための届出です。期限や様式は都道府県ごとに違います。',
      how: ['県税事務所のページで「事業開始の申告」を探す', '佐賀県なら県税事務所へ'], law: true },

    { id: 'profile', stage: 's3', must: true, title: '事業プロフィールを整える',
      why: '屋号・連絡先・説明文は、すべてのツールで使い回します。',
      how: ['ダッシュボードの「事業プロフィール」から入力'], profile: true },
    { id: 'site', stage: 's3', must: true, title: 'ホームページをつくる',
      why: '「ちゃんとしたお店だ」と思ってもらうための、いちばんの土台です。',
      how: ['エディターでサンプルを書きかえる', 'スマホでの見え方を確かめる', '公開用HTMLを書き出して、無料のサービスに置く'], link: 'editor' },
    { id: 'form', stage: 's3', must: true, title: '問い合わせの受け口をつくる',
      why: '問い合わせがどこに届くか決めておかないと、せっかくの連絡を逃します。',
      how: ['集客窓口の「フォーム設定」で送信先を決める', 'いちばん手軽なのはメール、おすすめはGoogleスプレッドシート'], link: 'inbox', params: { tab: 'form' } },
    { id: 'tokusho', stage: 's3', title: '特定商取引法の表記を用意する（ネットで売る場合）',
      why: 'ネット販売では、事業者の名前・連絡先・返品のルールなどを表示する決まりがあります。',
      how: ['ホームページに「特定商取引法に基づく表記」のページか欄をつくる', '個人の場合、住所・電話は「請求があれば遅滞なく開示」とする方法もある（条件あり）'], law: true },
    { id: 'privacy', stage: 's3', title: 'プライバシーポリシーを書く',
      why: '問い合わせフォームで名前やメールを受け取るなら、使い道を示しておきます。',
      how: ['何を集めて、何に使うか、第三者に渡さないことを書く', 'フォームの下の一文（集客窓口で設定）とそろえる'] },
    { id: 'sns', stage: 's3', title: 'SNSのアカウントを用意する',
      why: 'お客さんがいる場所に、こちらから出かけていく窓口です。',
      how: ['お客さんがよく使うSNSを1〜2つに絞る', 'プロフィール欄にホームページのリンク'], link: 'sns' },
    { id: 'movie', stage: 's3', title: '紹介動画をつくる',
      why: '15秒の縦動画で、雰囲気と人柄が伝わります。',
      how: ['動画エディターの「お知らせ（縦・15秒）」から'], link: 'video' },

    { id: 'first10', stage: 's4', must: true, title: '最初の10人に、直接届ける',
      why: '最初のお客さんは、SNSより知り合いの紹介から来ることが多いです。',
      how: ['知り合いに、何を始めたかを一言で伝える', '感想をもらえる人に、お試しをお願いする'] },
    { id: 'trial', stage: 's4', title: '体験会・説明会を開く',
      why: '「どんな人がやっているか」を見てもらう場です。',
      how: ['カレンダーで日程と予約枠を決める', '予約枠の文章をSNSやメールで送る'], link: 'calendar' },
    { id: 'rhythm', stage: 's4', title: '投稿のリズムを決める',
      why: '毎日でなくて大丈夫。続けられる回数を決めます。',
      how: ['SNS投稿プランナーの「投稿リズムを作る」で週2〜3回から'], link: 'sns' },
    { id: 'docs', stage: 's4', title: '見積書・請求書の準備をする',
      why: '「いくらですか」と聞かれたら、その日のうちに出せるように。',
      how: ['発行者の情報と振込先を入れておく', '見積書を1枚つくってみる'], link: 'invoice' },
    { id: 'firstsale', stage: 's4', must: true, title: '最初の売上を記録する',
      why: '小さくても、ここが本当のスタートです。',
      how: ['請求書（または領収書）をつくって「入金済み」にする'], link: 'invoice' },

    { id: 'monthly', stage: 's5', title: '月に一度、数字を見る日をつくる',
      why: '計画とのずれは、早く気づけば小さく直せます。',
      how: ['ダッシュボードで今月の売上と問い合わせを見る', 'マネタイズ計画を実際の数字に合わせて直す'], link: 'dashboard' },
    { id: 'voices', stage: 's5', title: 'お客さんの声を集める',
      why: '次のお客さんへのいちばんの説明になります。',
      how: ['成約したお客さんに感想をお願いする', 'ホームページの「お客さんの声」に載せる（了承をもらって）'], link: 'editor' },
    { id: 'tax', stage: 's5', must: true, title: '確定申告をする',
      why: '1年分の売上と経費をまとめて申告します。',
      how: ['期間：翌年2月16日〜3月15日', '青色申告なら決算書も', 'e-Tax なら自宅から出せる'], law: true },
    { id: 'rest', stage: 's5', title: '休む日を先に決める',
      why: '一人の事業は、あなたの元気がそのまま資本です。夢中になる時期ほど、充電の時間を守ります。',
      how: ['カレンダーに「休み」を先に入れる', '作曲や読書など、仕事で測らない時間を残す'], link: 'calendar' },
  ];

  const SAMPLE = { done: { rule: Kit.rel(-40), family: Kit.rel(-38), canvas: Kit.rel(-30), price: Kit.rel(-25), name: Kit.rel(-21), kaigyo: Kit.rel(-14), aoiro: Kit.rel(-14), profile: Kit.rel(-10) }, memo: { rule: '教育委員会に相談済み（サンプル）' }, custom: [] };
  const BLANK = { done: {}, memo: {}, custom: [] };
  Kit.store.sample('roadmap', SAMPLE);

  Kit.css('roadmap', `
    .rm-next { display: grid; gap: 10px; padding: 18px 20px; border-radius: var(--r); background: var(--surface); border: 1px solid var(--line); position: relative; overflow: hidden; }
    .rm-next::before { content: ""; position: absolute; inset: 0 auto 0 0; width: 4px; background: var(--shu); }
    .rm-next .rm-next-label { font-size: 12px; font-weight: 700; letter-spacing: .14em; color: var(--shu); }
    .rm-next h2 { font-family: var(--font-display); font-size: 22px; font-weight: 800; }
    .rm-progress { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .rm-progress .meter { flex: 1 1 200px; }
    .rm-stage { border: 1px solid var(--line); border-radius: var(--r); background: var(--surface); }
    .rm-stage + .rm-stage { margin-top: 12px; }
    .rm-stage > summary { list-style: none; cursor: pointer; padding: 14px 16px; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .rm-stage > summary::-webkit-details-marker { display: none; }
    .rm-stage-no { font-family: var(--font-display); font-weight: 800; font-size: 13px; color: var(--gosu); border: 1.5px solid var(--gosu); border-radius: 50%; width: 28px; height: 28px; display: grid; place-items: center; flex: none; }
    .rm-stage-title { font-weight: 700; font-size: 16px; }
    .rm-stage-note { font-size: 13px; color: var(--ink-3); flex: 1 1 260px; }
    .rm-stage-count { font-size: 13px; color: var(--ink-2); }
    .rm-steps { border-top: 1px solid var(--line); }
    .rm-step { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 4px 12px; padding: 12px 16px; border-bottom: 1px solid var(--line); }
    .rm-step:last-child { border-bottom: 0; }
    .rm-step.is-done .rm-step-title { color: var(--ink-3); text-decoration: line-through; text-decoration-color: var(--line-strong); }
    .rm-step.is-next { background: color-mix(in srgb, var(--shu-wash) 40%, var(--surface)); }
    .rm-check { width: 26px; height: 26px; border-radius: 7px; border: 1.5px solid var(--line-strong); background: var(--surface); display: grid; place-items: center; cursor: pointer; color: transparent; margin-top: 1px; padding: 0; }
    .rm-check svg { width: 16px; height: 16px; }
    .rm-step.is-done .rm-check { background: var(--gosu); border-color: var(--gosu); color: var(--on-gosu); }
    .rm-step-head { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 10px; }
    .rm-step-title { font-weight: 700; }
    .rm-step-why { font-size: 13.5px; color: var(--ink-2); grid-column: 2; }
    .rm-step-body { grid-column: 2; display: grid; gap: 8px; }
    .rm-step-body ul { margin: 0; padding-left: 1.2em; font-size: 13.5px; color: var(--ink-2); }
    .rm-step-body li + li { margin-top: 2px; }
    .rm-memo { font-size: 13px; }
    .rm-done-date { font-size: 12px; color: var(--ink-3); }
  `);

  Kit.app({
    id: 'roadmap', title: '開業ロードマップ', group: 'plan', icon: 'flag', order: 42,
    desc: '開業届から初売上、続けるところまでの手順',
    docs: ['roadmap'],
    async mount(root, params) {
      let state = await Kit.store.get('roadmap', { sample: SAMPLE, blank: BLANK });
      state.done = state.done || {}; state.memo = state.memo || {}; state.custom = state.custom || [];
      const open = new Set(Kit.pref.get('roadmap.open', ['s0', 's1', 's2']));
      // 案内などから特定の手順を開くときは、その段階を開いておく
      if (params.step) { const st = STEPS.concat(state.custom || []).find((x) => x.id === params.step); if (st) open.add(st.stage); }

      const save = () => { delete state._sample; Kit.store.set('roadmap', state); };
      const allSteps = () => STEPS.concat(state.custom.map((c) => ({ id: c.id, stage: c.stage, title: c.title, why: c.why || '', how: [], custom: true })));

      function render() {
        Kit.clear(root);
        const steps = allSteps();
        const doneCount = steps.filter((s) => state.done[s.id]).length;
        const next = steps.find((s) => !state.done[s.id] && s.must) || steps.find((s) => !state.done[s.id]);

        root.append(Kit.appHead({
          title: '開業ロードマップ',
          desc: '始める前の確認から、最初の売上、続けるための習慣まで。全部を一度にやる必要はありません。いまの一歩だけ見れば大丈夫です。',
          actions: [Kit.btn('手順を追加', addCustom, { icon: 'plus' })],
        }));
        if (state._sample) root.append(Kit.sampleBar('チェック済みの手順は例です。自分の進み具合に合わせて付け外ししてください。', async () => {
          if (!(await Kit.confirm({ title: 'サンプルを片付けますか', body: 'すべてのツールのサンプルが消えます。自分で入力したものは残ります。', ok: '片付ける' }))) return;
          await Kit.store.samplesOff(); state = await Kit.store.get('roadmap', { blank: BLANK }); render();
        }));

        const pct = steps.length ? doneCount / steps.length : 0;
        if (next) {
          root.append(h('section', { class: 'rm-next', 'aria-label': 'いまの一歩' },
            h('span', { class: 'rm-next-label' }, 'いまの一歩'),
            h('h2', null, next.title),
            next.why ? h('p', { class: 'ink-2' }, next.why) : null,
            h('div', { class: 'btn-row' },
              next.link ? Kit.btn(toolName(next.link) + 'を開く', () => Kit.go(next.link, next.params), { kind: 'primary', icon: 'right' }) : null,
              next.profile ? Kit.btn('事業プロフィールを開く', async () => { await Kit.profile.edit(); }, { kind: 'primary', icon: 'user' }) : null,
              Kit.btn('済みにする', () => toggle(next.id, true), { icon: 'check' })),
            h('div', { class: 'rm-progress' }, h('div', { class: 'meter', role: 'progressbar', 'aria-valuenow': Math.round(pct * 100), 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-label': '進み具合' }, h('i', { style: { width: (pct * 100).toFixed(1) + '%' } })), h('span', { class: 'small ink-2 num' }, `${doneCount} / ${steps.length} 済み`))));
        } else {
          root.append(h('section', { class: 'rm-next' }, h('span', { class: 'rm-next-label' }, 'ぜんぶ済み'), h('h2', null, 'ここまで来ました。'), h('p', { class: 'ink-2' }, 'あとは続けるだけです。月に一度、数字と体調を見直してください。')));
        }

        const wrap = h('div', { style: { marginTop: '18px' } });
        STAGES.forEach((st, si) => {
          const list = steps.filter((s) => s.stage === st.id);
          const d = list.filter((s) => state.done[s.id]).length;
          const det = h('details', { class: 'rm-stage', open: open.has(st.id) || (next && next.stage === st.id) },
            h('summary', null, h('span', { class: 'rm-stage-no' }, si + 1), h('span', { class: 'rm-stage-title' }, st.title), h('span', { class: 'rm-stage-note' }, st.note), h('span', { class: 'rm-stage-count num' }, `${d}/${list.length}`)),
            h('div', { class: 'rm-steps' }, list.map((s) => stepRow(s, next))));
          det.addEventListener('toggle', () => { if (det.open) open.add(st.id); else open.delete(st.id); Kit.pref.set('roadmap.open', [...open]); });
          wrap.append(det);
        });
        root.append(wrap);
        root.append(h('p', { class: 'small muted', style: { marginTop: '14px' } }, '手続きの期限や条件は変わることがあります。「確かめること」の札がついた手順は、税務署・自治体・勤め先の最新の案内で確認してください。'));

        if (params.step) { const el = root.querySelector('[data-step="' + params.step + '"]'); if (el) el.scrollIntoView({ block: 'center' }); params.step = null; }
      }

      function stepRow(s, next) {
        const done = !!state.done[s.id];
        const memo = h('textarea', { class: 'rm-memo', rows: 2, placeholder: 'メモ（相談した相手、期限、決めたことなど）', id: 'rm-memo-' + s.id });
        memo.value = state.memo[s.id] || '';
        memo.addEventListener('input', Kit.debounce(() => { state.memo[s.id] = memo.value; save(); }, 500));
        return h('div', { class: 'rm-step' + (done ? ' is-done' : '') + (next && next.id === s.id ? ' is-next' : ''), 'data-step': s.id },
          h('button', { type: 'button', class: 'rm-check', 'aria-pressed': String(done), title: done ? '未済に戻す' : '済みにする', 'aria-label': (done ? '未済に戻す：' : '済みにする：') + s.title, onclick: () => toggle(s.id, !done) }, Kit.icon('check')),
          h('div', { class: 'rm-step-head' },
            h('span', { class: 'rm-step-title' }, s.title),
            s.must ? h('span', { class: 'chip blue' }, '大事') : null,
            s.law ? h('span', { class: 'chip warn' }, '確かめること') : null,
            s.custom ? h('span', { class: 'chip line' }, '自分で追加') : null,
            done ? h('span', { class: 'rm-done-date' }, Kit.fmtDate(state.done[s.id], 'M/D') + ' 済み') : null),
          s.why ? h('p', { class: 'rm-step-why' }, s.why) : null,
          h('div', { class: 'rm-step-body' },
            s.how && s.how.length ? h('ul', null, s.how.map((x) => h('li', null, x))) : null,
            h('div', { class: 'btn-row' },
              s.link ? Kit.btn(toolName(s.link) + 'を開く', () => Kit.go(s.link, s.params), { sm: true, icon: 'right' }) : null,
              s.profile ? Kit.btn('事業プロフィール', () => Kit.profile.edit(), { sm: true, icon: 'user' }) : null,
              s.custom ? Kit.btn('この手順を消す', () => removeCustom(s.id), { sm: true, kind: 'ghost', icon: 'trash' }) : null),
            memo));
      }

      function toggle(id, on) {
        if (on) state.done[id] = Kit.ymd(); else delete state.done[id];
        save();
        render();
        if (on) Kit.toast('済みにしました');
      }
      async function addCustom() {
        const stageSel = h('select', { id: 'rm-new-stage' }, STAGES.map((s, i) => h('option', { value: s.id }, (i + 1) + '. ' + s.title)));
        const title = h('input', { type: 'text', id: 'rm-new-title', placeholder: '例：商工会の創業相談に行く' });
        const why = h('input', { type: 'text', id: 'rm-new-why', placeholder: '（任意）なぜやるか' });
        Kit.modal({
          title: '手順を追加', body: h('div', { class: 'stack' }, Kit.field({ label: 'やること', input: title }), Kit.field({ label: '段階', input: stageSel }), Kit.field({ label: 'ひとこと', input: why })),
          actions: [{ label: 'やめる', kind: 'ghost' }, { label: '追加する', kind: 'primary', onClick: () => {
            if (!title.value.trim()) { title.focus(); return false; }
            state.custom.push({ id: Kit.uid('c'), stage: stageSel.value, title: title.value.trim(), why: why.value.trim() });
            save(); render(); Kit.toast('手順を追加しました');
          } }],
        });
      }
      async function removeCustom(id) {
        if (!(await Kit.confirm({ title: 'この手順を消しますか', ok: '消す', danger: true }))) return;
        state.custom = state.custom.filter((c) => c.id !== id); delete state.done[id]; delete state.memo[id];
        save(); render();
      }
      render();
    },
  });

  function toolName(id) { const d = Kit.appDef(id); return d ? d.title : id; }

  // ダッシュボードが「いまの一歩」を出すために使う
  window.Roadmap = {
    steps: STEPS,
    async progress() {
      const st = await Kit.store.get('roadmap', { sample: SAMPLE, blank: BLANK });
      const all = STEPS.concat((st.custom || []).map((c) => Object.assign({ how: [] }, c)));
      const done = st.done || {};
      const next = all.find((s) => !done[s.id] && s.must) || all.find((s) => !done[s.id]) || null;
      return { done: all.filter((s) => done[s.id]).length, total: all.length, next };
    },
  };
})();
