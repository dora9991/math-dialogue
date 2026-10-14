// ホームページ：お客さんが見るページを、そのままの見た目で確かめて、公開用に書き出す
(function () {
  'use strict';
  const { h } = Kit;
  const SR = () => window.SiteRender;

  Kit.css('site', `
.site-bar{display:flex;flex-wrap:wrap;align-items:center;gap:8px 10px;padding:10px var(--gutter-r) 10px var(--gutter-l);background:var(--surface);border-bottom:1px solid var(--line)}
.site-bar h1{margin-right:auto;font-family:var(--font-display);font-size:19px;font-weight:800;letter-spacing:.04em}
.site-bar .btn-row{gap:6px}
.site-short{display:none}
@media (max-width:560px){.site-bar .site-long{display:none}.site-bar .site-short{display:inline}.site-bar .btn-row .btn{min-height:36px;padding:5px 11px;font-size:13.5px}.site-status{font-size:12.5px}}
.site-status{display:flex;flex-wrap:wrap;align-items:center;gap:6px 12px;padding:7px var(--gutter-r) 7px var(--gutter-l);background:var(--surface);border-bottom:1px solid var(--line);font-size:13px;color:var(--ink-2)}
.site-status .site-msg{display:flex;align-items:center;gap:8px;min-width:0;flex:1 1 260px}
.site-status .site-msg::before{content:"";flex:none;width:8px;height:8px;border-radius:50%;background:var(--ok)}
.site-status.warn .site-msg::before{background:var(--warn)}
.site-note{padding:10px var(--gutter-r) 0 var(--gutter-l);background:var(--surface-2)}
.site-note:empty{display:none}
.site-note .sample-bar{margin-bottom:10px}
.site-qr-box{display:grid;justify-items:center;gap:8px;padding:8px 0}
.site-qr-box canvas{width:220px;height:220px;image-rendering:pixelated;border:1px solid var(--line);border-radius:8px}
.site-guide ol{margin:6px 0 0;padding-left:1.4em;display:grid;gap:6px;color:var(--ink)}
.site-guide .site-when{margin-top:10px;font-size:13px;color:var(--ink-2)}
.site-step{display:flex;gap:10px;align-items:flex-start}
.site-step b{flex:none;display:grid;place-items:center;width:24px;height:24px;border-radius:50%;background:var(--gosu-wash);color:var(--gosu);font-size:13px}
.site-extra{display:grid;gap:8px;padding:12px 14px;border:1px solid var(--line);border-radius:var(--r);background:var(--surface-2)}
`);

  // data: URL → Blob（Artifact では fetch が通らないことがあるので自分で読む）
  const dataUrlBlob = (u) => {
    const m = /^data:([^;,]+)(;base64)?,(.*)$/s.exec(u);
    if (!m) return new Blob([]);
    const raw = m[2] ? atob(m[3]) : decodeURIComponent(m[3]);
    const a = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) a[i] = raw.charCodeAt(i);
    return new Blob([a], { type: m[1] });
  };
  // 狭い画面では短い文字になるボタン
  const wideBtn = (label, short, fn, o) => { const b = Kit.btn(label, fn, o); const sp = b.querySelector('span'); if (sp) { Kit.clear(sp); sp.append(h('span', { class: 'site-long' }, label), h('span', { class: 'site-short' }, short)); } b.title = label; return b; };

  // 公開のしかた（無料のサービスに index.html を置く）
  const GUIDES = [
    { value: 'netlify', label: 'Netlify Drop', note: 'いちばん簡単。ドラッグするだけ', link: 'https://app.netlify.com/drop',
      steps: ['パソコンで新しいフォルダを作り、書き出した index.html を入れます（フォルダ名は自由）。', '下のリンクから Netlify Drop を開きます。', 'フォルダを、画面の枠にドラッグ＆ドロップします。', '数秒で「〜.netlify.app」のURLができ、公開されます。', 'ログインせずに置いたページは、しばらくすると消えます。無料のアカウントを作って保存してください（URLの名前も変えられます）。'],
      update: '更新するとき：サイトの「Deploys」の画面に、新しいフォルダをドロップします。' },
    { value: 'cloudflare', label: 'Cloudflare Pages', note: '速くて、アクセスが増えても無料', link: 'https://dash.cloudflare.com/',
      steps: ['下のリンクから Cloudflare に無料で登録して、ログインします。', '「Workers & Pages」→「作成」→「Pages」→「アセットをアップロード」へ進みます。', 'プロジェクト名を決めます（URLが「名前.pages.dev」になります）。', 'index.html を入れたフォルダをアップロードして、デプロイします。'],
      update: '更新するとき：プロジェクトの「新しいデプロイを作成」から、同じようにアップロードします。' },
    { value: 'github', label: 'GitHub Pages', note: '更新の記録が残る', link: 'https://github.com/new',
      steps: ['GitHub に無料で登録し、下のリンクから新しいリポジトリ（Public）を作ります。', '「Add file」→「Upload files」で index.html を入れて、「Commit changes」を押します。', '「Settings」→「Pages」で、Branch を「main」と「/(root)」にして「Save」を押します。', '数分で「https://ユーザー名.github.io/リポジトリ名/」に公開されます。'],
      update: '更新するとき：同じ名前の index.html を、もう一度アップロードします。' },
  ];

  Kit.app({
    id: 'site', title: 'ホームページ', group: 'make', icon: 'globe', order: 10, wide: true,
    desc: 'お客さんが見るページ。スマホでの見え方も確かめて、公開用に書き出す',
    docs: ['site'],
    async mount(root) {
      const T = SR().tools;
      let data = await T.load();
      let device = Kit.pref.get('site:device', window.innerWidth < 700 ? 'phone' : 'pc');
      const offs = [];

      const pv = T.preview({ title: 'ホームページのプレビュー', device, onMessage: (m) => { if (m.type === 'mise:inquiry') T.receiveInquiry(m.data); } });
      const segDev = Kit.seg([{ value: 'pc', label: 'PC', icon: 'desktop' }, { value: 'phone', label: 'スマホ', icon: 'phone' }], device, (v) => { device = v; Kit.pref.set('site:device', v); pv.setDevice(v); }, { label: '表示する幅' });
      const bar = h('div', { class: 'site-bar' },
        h('h1', null, 'ホームページ'), segDev,
        h('div', { class: 'btn-row' },
          Kit.btn('編集する', () => Kit.go('editor'), { kind: 'primary', icon: 'edit' }),
          wideBtn('公開用HTMLを書き出す', '書き出す', () => T.exportSite(data), { icon: 'download' }),
          Kit.btn('公開のしかた', () => guide(), { icon: 'info' }),
          Kit.btn('QRコード', () => qrModal(), { icon: 'qr' })));
      const status = h('div', { class: 'site-status' });
      const note = h('div', { class: 'site-note' });
      root.append(bar, status, note, pv.el);

      // iframe を画面の下まで広げる（ページはその中でスクロール）
      const fitHeight = () => {
        const top = pv.el.getBoundingClientRect().top + window.scrollY;
        pv.el.style.height = Math.max(380, Math.floor(window.innerHeight - top)) + 'px';
        pv.fit();
      };
      window.addEventListener('resize', fitHeight);
      offs.push(() => window.removeEventListener('resize', fitHeight));

      function renderStatus() {
        Kit.clear(status);
        const contact = data.site.sections.find((s) => s.type === 'contact' && !s.hidden);
        const st = T.formStatus(data.form);
        status.classList.toggle('warn', !st.ok || !contact);
        if (!contact) {
          status.append(h('span', { class: 'site-msg' }, 'お問い合わせのセクションが出ていません。フォームのないページになります。'),
            Kit.btn('エディターで追加する', () => Kit.go('editor', { section: 'contact' }), { sm: true }));
          return;
        }
        status.append(h('span', { class: 'site-msg' }, st.text),
          Kit.btn(st.ok ? 'フォームの設定' : '送信先を設定する', () => Kit.go('inbox', { tab: 'form' }), { sm: true, kind: st.ok ? 'ghost' : '' }));
      }
      function renderNote() {
        Kit.clear(note);
        if (data.isSample) {
          note.append(Kit.sampleBar('これは例（ひらめき数学舎）のページです。エディターで書きかえると、自分のページになります。', async () => {
            const ok = await Kit.confirm({ title: 'サンプルを片付けますか？', body: 'すべての画面のサンプル（例のデータ）が消えます。ホームページは、事業プロフィールから作った下書きになります。', ok: '片付ける', danger: true });
            if (!ok) return;
            await Kit.store.samplesOff();
            await reload();
          }));
        } else if (data.draft) {
          note.append(h('div', { class: 'sample-bar', role: 'note' },
            h('span', null, h('strong', null, 'まだ作っていません'), '　事業プロフィールから作った下書きを表示しています。'),
            h('div', { class: 'btn-row' }, Kit.btn('エディターで作る', () => Kit.go('editor'), { sm: true, kind: 'primary' }))));
        }
      }
      const render = () => {
        renderStatus();
        renderNote();
        pv.load(SR().html(data.site, { profile: data.profile, form: data.form, images: data.images, mode: 'preview' }));
        fitHeight();
      };
      async function reload() { data = await T.load(); render(); }
      const later = Kit.debounce(reload, 250);
      for (const k of ['doc:site', 'doc:form', 'doc:profile', 'coll:images']) offs.push(Kit.store.on(k, later));

      // 公開のしかた
      function guide() {
        let which = Kit.pref.get('site:guide', 'netlify');
        const body = h('div', { class: 'stack site-guide' });
        const st = T.formStatus(data.form);
        const pane = h('div', { class: 'stack' });
        const drawPane = () => {
          Kit.clear(pane);
          const g = GUIDES.find((x) => x.value === which) || GUIDES[0];
          pane.append(h('p', { class: 'small muted' }, g.note),
            h('ol', null, g.steps.map((t) => h('li', null, t))),
            h('div', { class: 'btn-row' }, h('a', { class: 'btn sm', href: g.link, target: '_blank', rel: 'noopener' }, Kit.icon('external'), h('span', null, g.label + ' を開く'))),
            h('p', { class: 'site-when' }, g.update));
        };
        const extras = [];
        extras.push(h('div', { class: 'site-extra' },
          h('strong', { class: 'small' }, '問い合わせだけのページ（form.html）'),
          h('p', { class: 'small ink-2' }, 'Instagram のプロフィール欄などにのせる、フォームだけのページです。index.html と同じ場所に置くと「…/form.html」で開けます。URLの最後に ?' + SR().normForm(data.form).sourceParam + '=instagram をつけると、「どこで知りましたか」に自動で入ります。'),
          h('div', { class: 'btn-row' }, Kit.btn('form.html を書き出す', async () => {
            const page = SR().formPage(data.form, data.profile, data.site, { images: data.images });
            if (await Kit.download('form.html', page)) Kit.toast('form.html を書き出しました');
          }, { sm: true, icon: 'download' }))));
        const og = data.site.meta && data.site.meta.ogImage;
        const ogSrc = og ? SR().imageSrc(og, data.images, data.site) : '';
        if (ogSrc && og.startsWith('img:')) {
          const ext = SR().ogExt(ogSrc);
          extras.push(h('div', { class: 'site-extra' },
            h('strong', { class: 'small' }, 'SNSで共有したときの画像（ogp.' + ext + '）'),
            h('p', { class: 'small ink-2' }, 'index.html と同じ場所に置いてください。公開したURLを「QRコード」の画面で保存してから書き出すと、SNSのカードに出ます。'),
            h('div', { class: 'btn-row' }, Kit.btn('ogp.' + ext + ' を書き出す', async () => {
              const blob = dataUrlBlob(ogSrc);
              if (await Kit.download('ogp.' + ext, blob)) Kit.toast('ogp.' + ext + ' を書き出しました');
            }, { sm: true, icon: 'download' }))));
        }
        body.append(
          h('p', null, '書き出した index.html を無料のサービスに置くと、だれでも見られるホームページになります。どれか1つを選んでください。'),
          h('div', { class: 'stack tight' },
            h('div', { class: 'site-step' }, h('b', null, '1'), h('div', null, h('div', null, '問い合わせフォームの送信先を決める'), h('div', { class: 'small ' + (st.ok ? 'muted' : '') , style: st.ok ? null : { color: 'var(--warn)' } }, st.ok ? '設定済みです。' : 'まだ未設定です。集客窓口のフォーム設定で決めてください。'))),
            h('div', { class: 'site-step' }, h('b', null, '2'), h('div', { class: 'stack tight' }, h('div', null, '公開用HTML（index.html）を書き出す'), h('div', null, Kit.btn('公開用HTMLを書き出す', () => T.exportSite(data), { sm: true, icon: 'download' })))),
            h('div', { class: 'site-step' }, h('b', null, '3'), h('div', null, '次のどれかに置く'))),
          Kit.seg(GUIDES.map((g) => ({ value: g.value, label: g.label })), which, (v) => { which = v; Kit.pref.set('site:guide', v); drawPane(); }, { label: '公開先' }),
          pane,
          h('div', { class: 'site-step' }, h('b', null, '4'), h('div', { class: 'stack tight' }, h('div', null, '公開できたら、そのURLを保存する'), h('div', { class: 'small muted' }, 'QRコードやSNS用の情報に使われます。'), h('div', null, Kit.btn('URLとQRコード', () => { m.close(); qrModal(); }, { sm: true, icon: 'qr' })))),
          h('details', { class: 'help' }, h('summary', null, 'あると便利なもの'), h('div', { class: 'stack', style: { marginTop: '10px' } }, extras)),
        );
        drawPane();
        const m = Kit.modal({ title: '公開のしかた', body, wide: true, actions: [{ label: '閉じる', kind: 'primary' }] });
      }

      // QRコード（公開したURLを保存して、チラシや名刺に）
      function qrModal() {
        const form = SR().normForm(data.form);
        const input = h('input', { type: 'url', id: 'site-qr-url', placeholder: 'https://', inputmode: 'url', autocomplete: 'url' });
        input.value = data.site.publishedUrl || data.profile.url || '';
        const from = h('select', { id: 'site-qr-from' }, h('option', { value: '' }, 'つけない'), form.sources.map((s) => h('option', { value: s }, s)));
        const box = h('div', { class: 'site-qr-box', 'aria-live': 'polite' });
        let canvas = null;
        const full = () => {
          const u = input.value.trim();
          if (!/^https?:\/\/\S+$/i.test(u)) return '';
          if (!from.value) return u;
          try { const x = new URL(u); x.searchParams.set(form.sourceParam, from.value); return x.href; } catch (e) { return u; }
        };
        const draw = () => {
          Kit.clear(box);
          canvas = null;
          const u = full();
          if (!u) { box.append(h('p', { class: 'small muted' }, '公開したURL（https:// から）を入れると、QRコードができます。')); return; }
          try { canvas = Kit.qr(u, { cell: 8, margin: 4 }); } catch (e) { box.append(h('p', { class: 'small' }, 'QRコードを作れませんでした。URLを短くしてみてください。')); return; }
          canvas.setAttribute('role', 'img');
          canvas.setAttribute('aria-label', 'QRコード：' + u);
          box.append(canvas, h('p', { class: 'small mono', style: { wordBreak: 'break-all', textAlign: 'center' } }, u),
            h('div', { class: 'btn-row' }, Kit.btn('URLをコピー', () => Kit.copy(u), { sm: true, icon: 'copy' }), h('a', { class: 'btn sm', href: u, target: '_blank', rel: 'noopener' }, Kit.icon('external'), h('span', null, '開いて確かめる'))));
        };
        const redraw = Kit.debounce(draw, 250);
        input.addEventListener('input', redraw);
        from.addEventListener('change', draw);
        draw();
        Kit.modal({
          title: 'URLとQRコード', wide: false,
          body: h('div', { class: 'stack' },
            Kit.field({ label: '公開したホームページのURL', input, hint: '保存すると、検索やSNS用の情報（正式なURL）にも使われます。' }),
            Kit.field({ label: 'どこに置くQRか（任意）', input: from, hint: '選ぶと URL の最後に ?' + form.sourceParam + '=… がつき、問い合わせフォームの「どこで知りましたか」に自動で入ります。' }),
            box),
          actions: [
            { label: '閉じる', kind: 'ghost' },
            { label: 'PNGで保存', onClick: async () => {
              if (!canvas) { Kit.toast('先にURLを入れてください', { type: 'bad' }); return false; }
              const blob = await Kit.img.toBlob(canvas, 'image/png');
              if (await Kit.download('homepage-qr.png', blob)) Kit.toast('QRコードを保存しました（homepage-qr.png）');
              return false;
            } },
            { label: 'URLを保存', kind: 'primary', onClick: async () => {
              const u = input.value.trim();
              if (u && !/^https?:\/\/\S+$/i.test(u)) { Kit.toast('URLは https:// から入れてください', { type: 'bad' }); input.focus(); return false; }
              const site = Object.assign({}, data.site, { publishedUrl: u });
              await Kit.store.set('site', site);
              Kit.toast(u ? '公開したURLを保存しました' : 'URLを消しました');
              return true;
            } },
          ],
        });
      }

      render();
      return () => { pv.destroy(); offs.forEach((f) => f()); later.cancel(); };
    },
  });
})();
