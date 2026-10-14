// ホームページエディター：文章・写真・色を、見ながら直す（保存先は site。描画は SiteRender）
(function () {
  'use strict';
  const { h } = Kit;
  const SR = () => window.SiteRender;

  Kit.css('editor', `
.ed-bar{display:flex;flex-wrap:wrap;align-items:center;gap:8px 10px;padding:10px var(--gutter-r) 10px var(--gutter-l);background:var(--surface);border-bottom:1px solid var(--line)}
.ed-bar h1{margin-right:auto;font-family:var(--font-display);font-size:18px;font-weight:800;letter-spacing:.04em;line-height:1.3}
.ed-bar .btn-row{gap:6px}
.ed-short{display:none}
@media (max-width:560px){.ed-bar .ed-long{display:none}.ed-bar .ed-short{display:inline}.ed-bar .btn{min-height:36px;padding:5px 11px;font-size:13.5px}}
.ed-note{background:var(--surface-2)}
.ed-note:not(:empty){padding:10px var(--gutter-r) 0 var(--gutter-l)}
.ed-note .sample-bar{margin-bottom:10px}
.ed-tabs{display:none;padding:8px var(--gutter-r) 8px var(--gutter-l);background:var(--surface);border-bottom:1px solid var(--line)}
.app-editor[data-layout="one"] .ed-tabs,.app-editor[data-layout="two"] .ed-tabs{display:block}
.app-editor[data-layout="two"] .ed-tabs [data-v="preview"]{display:none}
.ed-tabs .seg{display:flex;width:100%}
.ed-tabs .seg>button{flex:1 1 0;justify-content:center;min-height:36px}
.ed-body{display:grid;grid-template-columns:minmax(0,1fr);min-height:0;background:var(--surface-2)}
.app-editor[data-layout="three"] .ed-body{grid-template-columns:minmax(208px,232px) minmax(0,1fr) minmax(300px,356px)}
.app-editor[data-layout="two"] .ed-body{grid-template-columns:minmax(300px,360px) minmax(0,1fr)}
.ed-pane{min-width:0;min-height:0;overflow:auto;overscroll-behavior:contain;background:var(--surface)}
.app-editor[data-layout="three"] .ed-list{grid-column:1;grid-row:1;border-right:1px solid var(--line)}
.app-editor[data-layout="three"] .ed-pv{grid-column:2;grid-row:1}
.app-editor[data-layout="three"] .ed-props{grid-column:3;grid-row:1;border-left:1px solid var(--line)}
.app-editor[data-layout="two"] .ed-list,.app-editor[data-layout="two"] .ed-props{grid-column:1;grid-row:1;border-right:1px solid var(--line)}
.app-editor[data-layout="two"] .ed-pv{grid-column:2;grid-row:1}
.app-editor[data-layout="one"] .ed-pane{grid-column:1;grid-row:1}
.ed-pv{display:flex;flex-direction:column;overflow:hidden;background:var(--surface-2)}
.ed-pv .sr-stage{flex:1 1 auto}
.ed-pv-bar{display:flex;flex-wrap:wrap;align-items:center;gap:6px 12px;padding:7px 12px;background:var(--surface);border-bottom:1px solid var(--line)}
.ed-pv-bar .muted{font-size:12.5px}

.ed-list-in{display:grid;gap:6px;padding:12px 10px 28px}
.ed-site{display:flex;align-items:center;gap:10px;width:100%;min-height:48px;padding:8px 10px;border:1px solid var(--line);border-radius:10px;background:var(--surface);color:var(--ink);font:inherit;text-align:left;cursor:pointer}
.ed-site:hover{background:var(--surface-2)}
.ed-site[aria-pressed="true"]{background:var(--gosu-wash);border-color:var(--gosu)}
.ed-site svg{flex:none;width:18px;height:18px;color:var(--gosu)}
.ed-site b{display:block;font-size:13.5px;line-height:1.3}
.ed-site small{display:block;font-size:11.5px;color:var(--ink-3);line-height:1.4}
.ed-list-label{margin:8px 4px 0;font-size:11px;font-weight:700;letter-spacing:.14em;color:var(--ink-3)}
.ed-secs{display:grid;gap:3px;margin:0;padding:0;list-style:none}
.ed-sec{position:relative;border:1px solid transparent;border-radius:10px;background:var(--surface)}
.ed-sec:hover{background:var(--surface-2)}
.ed-sec[aria-current="true"]{background:var(--gosu-wash);border-color:color-mix(in srgb,var(--gosu) 40%,var(--line))}
.ed-sec.is-drag{z-index:5;background:var(--surface);border-color:var(--line-strong);box-shadow:var(--shadow-2)}
.ed-sec.is-shift{transition:transform .15s ease}
.ed-sec-row{display:flex;align-items:center;gap:2px;min-height:44px;padding:2px 4px 2px 2px}
.ed-grip{flex:none;display:grid;place-items:center;width:22px;height:38px;border-radius:6px;color:var(--ink-3);cursor:grab;touch-action:none}
.ed-grip:hover{background:var(--surface-3);color:var(--ink)}
.ed-grip svg{width:16px;height:16px}
.ed-sec.is-drag .ed-grip{cursor:grabbing}
.ed-sec-main{flex:1 1 auto;display:flex;align-items:center;gap:8px;min-width:0;min-height:38px;padding:4px;border:0;border-radius:6px;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer}
.ed-sec-main>svg{flex:none;width:17px;height:17px;color:var(--ink-3)}
.ed-sec[aria-current="true"] .ed-sec-main>svg{color:var(--gosu)}
.ed-sec-txt{display:grid;min-width:0}
.ed-sec-name{overflow:hidden;font-size:13.5px;font-weight:700;line-height:1.35;white-space:nowrap;text-overflow:ellipsis}
.ed-sec-type{overflow:hidden;font-size:11.5px;color:var(--ink-3);line-height:1.35;white-space:nowrap;text-overflow:ellipsis}
.ed-sec.is-hidden .ed-sec-name{color:var(--ink-3)}
.ed-sec .ed-eye{flex:none;color:var(--ink-3)}
.ed-sec.is-hidden .ed-eye{color:var(--warn)}
.ed-sec-acts{display:flex;flex-wrap:wrap;gap:4px;padding:0 6px 8px 24px}
.ed-add{width:100%;margin-top:6px}

.ed-props-in{display:grid;gap:16px;padding:14px 16px 48px}
.ed-props-h{display:flex;flex-wrap:wrap;align-items:center;gap:6px 8px}
.ed-props-h h2{display:flex;flex:1 1 auto;align-items:center;gap:8px;min-width:0;font-size:16px;font-weight:700}
.ed-props-h h2 svg{flex:none;width:19px;height:19px;color:var(--gosu)}
.ed-hidden-note{display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:8px 12px;border-radius:var(--r-sm);background:var(--warn-wash);color:var(--ink)}
.ed-group{display:grid;gap:10px;padding-top:14px;border-top:1px solid var(--line)}
.ed-group>h3{font-size:13px;font-weight:700;letter-spacing:.06em;color:var(--ink-2)}
.ed-lf{display:grid;gap:8px}
.ed-lf-h{display:flex;align-items:baseline;gap:8px;font-size:13px;font-weight:500;color:var(--ink-2)}
.ed-item{display:grid;gap:10px;padding:10px 12px 12px;border:1px solid var(--line);border-radius:var(--r);background:var(--surface-2)}
.ed-item-h{display:flex;align-items:center;gap:2px;min-height:30px}
.ed-item-h b{flex:1 1 auto;min-width:0;overflow:hidden;font-size:13px;white-space:nowrap;text-overflow:ellipsis}
.ed-item .field input,.ed-item .field textarea,.ed-item .field select{background:var(--surface)}
.ed-img{display:flex;flex-wrap:wrap;align-items:center;gap:10px}
.ed-thumb{flex:none;display:grid;place-items:center;width:104px;height:70px;border:1px solid var(--line);border-radius:8px;background:var(--surface-2);color:var(--ink-3);object-fit:cover}
.ed-thumb svg{width:22px;height:22px}
.ed-count{justify-self:end;font-size:12px;color:var(--ink-3);font-variant-numeric:tabular-nums}
.ed-count.over{color:var(--warn);font-weight:700}
.ed-themes{display:grid;grid-template-columns:repeat(auto-fill,minmax(132px,1fr));gap:8px}
.ed-theme{display:grid;gap:2px;padding:0 0 8px;overflow:hidden;border:1px solid var(--line);border-radius:10px;background:var(--surface);color:var(--ink);font:inherit;text-align:left;cursor:pointer}
.ed-theme:hover{border-color:var(--line-strong)}
.ed-theme[aria-pressed="true"]{border-color:var(--gosu);box-shadow:0 0 0 2px var(--gosu)}
.ed-theme-sw{display:grid;align-content:center;gap:5px;height:62px;padding:0 12px;margin-bottom:6px;border-bottom:1px solid var(--line)}
.ed-theme-sw b{display:block;height:6px;border-radius:3px}
.ed-theme-sw i{display:block;width:44px;height:12px;border-radius:6px}
.ed-theme-name{padding:0 10px;font-size:13.5px;font-weight:700}
.ed-theme-desc{padding:0 10px;font-size:11.5px;line-height:1.45;color:var(--ink-3)}
.ed-accent{display:flex;flex-wrap:wrap;align-items:center;gap:8px}
.ed-serp{display:grid;gap:2px;padding:12px 14px;border:1px solid var(--line);border-radius:var(--r);background:var(--surface-2);font-size:13px;line-height:1.5}
.ed-serp-url{color:var(--ink-3);font-size:12px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.ed-serp-title{color:var(--gosu);font-size:16px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.ed-serp-desc{color:var(--ink-2);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.ed-info{display:grid;gap:8px;padding:12px 14px;border-radius:var(--r);background:var(--surface-2);font-size:13.5px;color:var(--ink-2)}
.ed-danger{display:grid;gap:8px;padding:12px 14px;border:1px dashed var(--line-strong);border-radius:var(--r)}

.ed-add-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:8px}
.ed-add-item{display:flex;align-items:flex-start;gap:10px;padding:12px;border:1px solid var(--line);border-radius:var(--r);background:var(--surface);color:var(--ink);font:inherit;text-align:left;cursor:pointer}
.ed-add-item:hover{background:var(--surface-2);border-color:var(--line-strong)}
.ed-add-item svg{flex:none;width:20px;height:20px;margin-top:2px;color:var(--gosu)}
.ed-add-item b{display:block;font-size:14px}
.ed-add-item small{display:block;font-size:12px;color:var(--ink-3);line-height:1.5}
.ed-pick-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(112px,1fr));gap:10px}
.ed-pick-grid>.empty{grid-column:1/-1}
.ed-pick{display:block;padding:0;overflow:hidden;aspect-ratio:4/3;border:2px solid var(--line);border-radius:10px;background:var(--surface-2);cursor:pointer}
.ed-pick:hover{border-color:var(--line-strong)}
.ed-pick[aria-pressed="true"]{border-color:var(--gosu);box-shadow:0 0 0 2px var(--gosu)}
.ed-pick img{display:block;width:100%;height:100%;object-fit:cover}
.ed-ai{display:grid;gap:10px;font-size:14px}
.ed-ai dt{font-size:12px;font-weight:700;color:var(--ink-3)}
.ed-ai dd{margin:0 0 6px;white-space:pre-wrap}
.ed-ai ol{margin:0;padding-left:1.3em;display:grid;gap:6px}
`);

  const SVGNS = 'http://www.w3.org/2000/svg';
  // 目に斜線（非表示）
  const eyeOff = () => { const s = Kit.icon('eye'); const p = document.createElementNS(SVGNS, 'path'); p.setAttribute('d', 'M4 4l16 16'); s.append(p); return s; };
  // 狭い画面では短い文字になるボタン
  const wideBtn = (label, short, fn, o) => { const b = Kit.btn(label, fn, o); const sp = b.querySelector('span'); if (sp) { Kit.clear(sp); sp.append(h('span', { class: 'ed-long' }, label), h('span', { class: 'ed-short' }, short)); } b.title = label; return b; };
  const firstLine = (v) => String(v == null ? '' : v).split('\n')[0].trim();
  const strArr = (v) => (Array.isArray(v) ? v : []);

  // AI に頼む形（セクションごと）
  const cut = (v, n) => String(v == null ? '' : v).trim().slice(0, n);
  const AI_SPEC = {
    hero: {
      keys: ['kicker', 'heading', 'sub', 'ctaLabel'],
      shape: '{"kicker":"見出しの上の一言（何の事業かがわかる。20字以内）","heading":"キャッチコピー（24字以内。改行したい所に \\n）","sub":"説明（80〜120字）","ctaLabel":"ボタンの文字（12字以内）"}',
      ex: '{"kicker":"佐賀のちいさなパン教室","heading":"焼きたてを、\\n自分の台所で。","sub":"少人数で、こねる所から一緒に。はじめての方でも、家で同じように焼けるまでていねいにお伝えします。","ctaLabel":"体験レッスンを予約する"}',
      clean: (r) => (r && (r.heading || r.sub) ? { kicker: cut(r.kicker, 40), heading: cut(r.heading, 60), sub: cut(r.sub, 300), ctaLabel: cut(r.ctaLabel, 30) || '' } : null),
    },
    about: {
      keys: ['heading', 'body'],
      shape: '{"heading":"見出し（24字以内）","body":"本文（200〜320字。段落の区切りは \\n\\n）"}',
      ex: '{"heading":"毎日のパンを、もっと気楽に","body":"パンづくりは、むずかしそうに見えて…\\n\\n教室では…"}',
      clean: (r) => (r && r.body ? { heading: cut(r.heading, 60), body: cut(r.body, 1200) } : null),
    },
    services: {
      keys: ['heading', 'lead', 'items'],
      shape: '{"heading":"見出し","lead":"リード文（40字以内）","items":[{"title":"サービス名","body":"説明（60〜90字）","price":"料金（わかる範囲で。わからなければ空）","note":"ひとこと（任意）"}]}（サービスは2〜6個）',
      ex: '{"heading":"できること","lead":"目的に合わせて選べます。","items":[{"title":"体験レッスン","body":"…","price":"90分 ¥3,000","note":"エプロンをお持ちください"}]}',
      clean: (r) => {
        const items = strArr(r && r.items).filter((x) => x && x.title).slice(0, 8).map((x) => ({ title: cut(x.title, 60), body: cut(x.body, 400), price: cut(x.price, 40), note: cut(x.note, 80) }));
        return items.length ? { heading: cut(r.heading, 60) || 'サービス', lead: cut(r.lead, 200), items } : null;
      },
    },
    faq: {
      keys: ['heading', 'items'],
      shape: '{"heading":"よくある質問","items":[{"q":"質問","a":"答え（40〜100字）"}]}（質問は4〜6個）',
      ex: '{"heading":"よくある質問","items":[{"q":"はじめてでも大丈夫ですか？","a":"はい。…"}]}',
      clean: (r) => {
        const items = strArr(r && r.items).filter((x) => x && x.q && x.a).slice(0, 10).map((x) => ({ q: cut(x.q, 120), a: cut(x.a, 600) }));
        return items.length ? { heading: cut(r.heading, 60) || 'よくある質問', items } : null;
      },
    },
  };

  Kit.app({
    id: 'editor', title: 'ホームページエディター', group: 'make', icon: 'layout', order: 11, wide: true,
    desc: '文章・写真・色を、見ながら直す',
    docs: ['site'],
    async mount(root, params) {
      const T = SR().tools;
      const data = await T.load();
      let site = data.site;
      let isSample = data.isSample;
      const st = { sel: null, device: Kit.pref.get('editor:device', window.innerWidth < 700 ? 'phone' : 'pc'), tab: 'list', layout: '' };
      const offs = [];

      /* ── 履歴（元に戻す・やり直す）と保存 ── */
      let current = JSON.stringify(site);
      const undoStack = [], redoStack = [];
      let lastKey = '', lastAt = 0, dirty = false;
      // 書きかえは必ずここを通す。同じ欄の続けての入力は1つの履歴にまとめる
      function change(fn, key) {
        const now = Date.now();
        if (!(key && key === lastKey && now - lastAt < 1500)) {
          undoStack.push(current);
          if (undoStack.length > 50) undoStack.shift();
          redoStack.length = 0;
        }
        lastKey = key || '';
        lastAt = now;
        fn();
        current = JSON.stringify(site);
        dirty = true;
        saveSoon();
        previewSoon();
        syncHistory();
      }
      async function save() {
        saveSoon.cancel();
        if (!dirty) return;
        dirty = false;
        await Kit.store.set('site', site);
        if (isSample || data.draft) { isSample = false; data.draft = false; renderNote(); }
      }
      const saveSoon = Kit.debounce(save, 600);
      function restore() {
        const ae = document.activeElement;
        const focusId = ae && root.contains(ae) && ae.id ? ae.id : '';
        site = JSON.parse(current);
        lastKey = '';
        if (st.sel !== '__site' && !site.sections.some((s) => s.id === st.sel)) st.sel = site.sections[0] ? site.sections[0].id : '__site';
        dirty = true;
        saveSoon();
        renderList();
        renderProps(true);
        previewSoon();
        syncHistory();
        const el = focusId && document.getElementById(focusId);
        if (el) { el.focus(); try { const n = el.value.length; el.setSelectionRange(n, n); } catch (e) { /* 文字の欄でない */ } }
      }
      function undo() { if (!undoStack.length) return; redoStack.push(current); current = undoStack.pop(); restore(); }
      function redo() { if (!redoStack.length) return; undoStack.push(current); current = redoStack.pop(); restore(); }

      /* ── 画面の骨組み ── */
      const bUndo = Kit.btn('', undo, { icon: 'undo', title: '元に戻す（Ctrl+Z）' });
      const bRedo = Kit.btn('', redo, { icon: 'redo', title: 'やり直す（Ctrl+Shift+Z）' });
      const syncHistory = () => { bUndo.disabled = !undoStack.length; bRedo.disabled = !redoStack.length; };
      const bar = h('div', { class: 'ed-bar' },
        h('h1', null, 'ホームページエディター'),
        h('div', { class: 'btn-row' }, bUndo, bRedo),
        h('div', { class: 'btn-row' },
          wideBtn('プレビューを大きく', '大きく見る', async () => { await save(); Kit.go('site'); }, { icon: 'eye' }),
          wideBtn('公開用HTMLを書き出す', 'HTMLを書き出す', () => T.exportSite({ site, profile: data.profile, form: data.form, images: data.images }), { icon: 'download', kind: 'primary' })));
      const noteBox = h('div', { class: 'ed-note' });
      const tabs = Kit.seg([{ value: 'list', label: 'セクション' }, { value: 'props', label: '編集' }, { value: 'preview', label: 'プレビュー' }], st.tab, (v) => setTab(v), { label: '表示する画面' });
      const tabsWrap = h('div', { class: 'ed-tabs' }, tabs);
      const listPane = h('section', { class: 'ed-pane ed-list', 'aria-label': 'セクションの一覧' });
      const propsPane = h('section', { class: 'ed-pane ed-props', 'aria-label': '編集する内容' });
      const pvPane = h('section', { class: 'ed-pane ed-pv', 'aria-label': 'プレビュー' });
      const body = h('div', { class: 'ed-body' }, listPane, pvPane, propsPane);
      root.append(bar, noteBox, tabsWrap, body);

      // プレビュー（クリックしたセクションを選ぶ・試し送信は受付箱へ）
      const pv = T.preview({
        title: '編集中のホームページ', device: st.device,
        onReady: () => pv.post({ type: 'mise:focus', id: st.sel, scroll: false }),
        onMessage: (m) => {
          if (m.type === 'mise:select') select(String(m.id || ''), 'preview');
          else if (m.type === 'mise:inquiry') T.receiveInquiry(m.data);
        },
      });
      const segDev = Kit.seg([{ value: 'pc', label: 'PC', icon: 'desktop' }, { value: 'phone', label: 'スマホ', icon: 'phone' }], st.device, (v) => { st.device = v; Kit.pref.set('editor:device', v); pv.setDevice(v); }, { label: 'プレビューの幅' });
      pvPane.append(h('div', { class: 'ed-pv-bar' }, segDev, h('span', { class: 'muted' }, 'ページの中をクリックすると、そこを編集できます')), pv.el);
      const htmlNow = () => SR().html(site, { profile: data.profile, form: data.form, images: data.images, mode: 'edit' });
      let scrollAfter = false;
      const previewSoon = Kit.debounce(() => {
        pv.update(htmlNow());
        if (scrollAfter) { scrollAfter = false; pv.post({ type: 'mise:focus', id: st.sel, scroll: true }); }
        else pv.post({ type: 'mise:focus', id: st.sel, scroll: false });
      }, 300);

      // 画面の幅で、3列・2列・1列を切りかえる
      const layoutFor = (w) => (w >= 1000 ? 'three' : w >= 720 ? 'two' : 'one');
      function applyLayout() {
        const L = layoutFor(root.clientWidth || window.innerWidth);
        if (L !== st.layout) {
          const was = st.layout;
          st.layout = L;
          root.dataset.layout = L;
          if (L === 'two' && st.tab === 'preview') st.tab = 'props';
          if (was) renderProps(true);
        }
        showPanes();
        fitHeight();
      }
      function showPanes() {
        const L = st.layout;
        listPane.hidden = L !== 'three' && st.tab !== 'list';
        propsPane.hidden = L !== 'three' && st.tab !== 'props';
        pvPane.hidden = L === 'one' && st.tab !== 'preview';
        tabs.setValue(st.tab);
      }
      function setTab(v) {
        st.tab = st.layout === 'two' && v === 'preview' ? 'props' : v;
        showPanes();
        fitHeight();
      }
      function fitHeight() {
        const top = body.getBoundingClientRect().top + window.scrollY;
        body.style.height = Math.max(440, Math.floor(window.innerHeight - top)) + 'px';
        pv.fit();
      }
      // 幅が変わったときだけ、次の描画で並べ直す（自分の高さを変えても繰り返さない）
      let lastW = 0;
      const ro = window.ResizeObserver ? new ResizeObserver(() => { const w = root.clientWidth; if (w === lastW) return; lastW = w; requestAnimationFrame(applyLayout); }) : null;
      if (ro) ro.observe(root);
      const onResize = () => applyLayout();
      window.addEventListener('resize', onResize);

      /* ── サンプルの帯 ── */
      function renderNote() {
        Kit.clear(noteBox);
        if (isSample) {
          const sb = Kit.sampleBar('これは例（ひらめき数学舎）のページです。書きかえると、自分のページとして保存されます。', async () => {
            const ok = await Kit.confirm({ title: 'サンプルを片付けますか？', body: 'すべての画面のサンプル（例のデータ）が消えます。ホームページは、事業プロフィールから作った下書きから始まります。', ok: '片付ける', danger: true });
            if (!ok) return;
            await Kit.store.samplesOff();
            Kit.remount();
          });
          const row = sb.querySelector('.btn-row');
          if (row) row.prepend(Kit.btn('自分の事業で作り直す', rebuild, { sm: true, kind: 'primary', icon: 'refresh' }));
          noteBox.append(sb);
        }
        if (st.layout) fitHeight();
      }

      /* ── 選ぶ ── */
      function select(id, from) {
        if (id !== '__site' && !site.sections.some((s) => s.id === id)) id = '__site';
        const changed = st.sel !== id;
        st.sel = id;
        renderList();
        if (changed) renderProps(false);
        pv.post({ type: 'mise:focus', id, scroll: from !== 'preview' });
        if (st.layout !== 'three' && (from === 'list' || (from === 'preview' && st.layout === 'one'))) setTab('props');
      }

      /* ── セクションの一覧 ── */
      const secLabel = (s) => { const t = SR().typeOf(s.type); return { name: firstLine(s.heading) || t.name, type: t.name }; };
      function renderList() {
        const keep = listPane.scrollTop;
        Kit.clear(listPane);
        const wrap = h('div', { class: 'ed-list-in' });
        wrap.append(h('button', { type: 'button', class: 'ed-site', 'aria-pressed': String(st.sel === '__site'), onclick: () => select('__site', 'list') },
          Kit.icon('palette'), h('span', null, h('b', null, 'サイト全体'), h('small', null, '色・字体・タイトル・URL'))));
        wrap.append(h('p', { class: 'ed-list-label', id: 'ed-secs-label' }, 'ページの上から順に'));
        const ol = h('ol', { class: 'ed-secs', 'aria-labelledby': 'ed-secs-label' });
        site.sections.forEach((s, i) => ol.append(secRow(s, i)));
        wrap.append(ol);
        if (!site.sections.length) wrap.append(h('p', { class: 'small muted', style: { padding: '8px 4px' } }, 'セクションがありません。下のボタンから追加してください。'));
        wrap.append(Kit.btn('セクションを追加', addMenu, { icon: 'plus', class: 'ed-add' }));
        listPane.append(wrap);
        listPane.scrollTop = keep;
      }
      function secRow(s, i) {
        const t = SR().typeOf(s.type), lb = secLabel(s), on = st.sel === s.id, n = site.sections.length;
        const li = h('li', { class: 'ed-sec' + (s.hidden ? ' is-hidden' : ''), 'data-id': s.id, 'aria-current': on ? 'true' : null });
        const grip = h('span', { class: 'ed-grip', title: 'ドラッグで並べかえ' }, Kit.icon('grip'));
        li.append(h('div', { class: 'ed-sec-row' }, grip,
          h('button', { type: 'button', class: 'ed-sec-main', 'aria-pressed': String(on), onclick: () => select(s.id, 'list') },
            Kit.icon(t.icon), h('span', { class: 'ed-sec-txt' }, h('span', { class: 'ed-sec-name' }, lb.name), h('span', { class: 'ed-sec-type' }, lb.type + (s.hidden ? '・非表示' : '')))),
          h('button', { type: 'button', class: 'btn ghost icon sm ed-eye', title: s.hidden ? '非表示です（押すと表示）' : '表示中です（押すと非表示）', 'aria-label': lb.name + (s.hidden ? 'を表示する' : 'を非表示にする'), onclick: () => toggleHidden(s.id) }, s.hidden ? eyeOff() : Kit.icon('eye'))));
        if (on) {
          li.append(h('div', { class: 'ed-sec-acts' },
            Kit.btn('', () => moveSec(i, i - 1), { sm: true, icon: 'arrowUp', title: '上へ', disabled: i === 0 }),
            Kit.btn('', () => moveSec(i, i + 1), { sm: true, icon: 'arrowDown', title: '下へ', disabled: i === n - 1 }),
            Kit.btn('', () => dupSec(i), { sm: true, icon: 'copy', title: '複製' }),
            Kit.btn('削除', () => delSec(i), { sm: true, icon: 'trash', kind: 'danger' })));
        }
        grip.addEventListener('pointerdown', (e) => startDrag(e, li, i));
        return li;
      }
      // つまみをドラッグして並べかえ（マウスでも指でも）
      function startDrag(e, li, from) {
        if (e.button) return;
        e.preventDefault();
        const grip = e.currentTarget, rows = [...li.parentElement.children];
        const rects = rows.map((r) => r.getBoundingClientRect());
        const centers = rects.map((r) => r.top + r.height / 2);
        const gap = rows.length > 1 ? Math.max(0, rects[1].top - rects[0].bottom) : 0;
        const step = rects[from].height + gap, y0 = e.clientY;
        let to = from;
        li.classList.add('is-drag');
        rows.forEach((r) => { if (r !== li) r.classList.add('is-shift'); });
        try { grip.setPointerCapture(e.pointerId); } catch (err) { /* 古いブラウザ */ }
        const move = (ev) => {
          const dy = ev.clientY - y0;
          li.style.transform = 'translateY(' + dy + 'px)';
          const mid = centers[from] + dy;
          to = rows.filter((r, k) => k !== from && centers[k] < mid).length;
          rows.forEach((r, k) => {
            if (k === from) return;
            const off = from < to && k > from && k <= to ? -step : from > to && k >= to && k < from ? step : 0;
            r.style.transform = off ? 'translateY(' + off + 'px)' : '';
          });
        };
        const end = () => {
          grip.removeEventListener('pointermove', move);
          grip.removeEventListener('pointerup', end);
          grip.removeEventListener('pointercancel', end);
          rows.forEach((r) => { r.style.transform = ''; r.classList.remove('is-shift', 'is-drag'); });
          if (to !== from) moveSec(from, to);
        };
        grip.addEventListener('pointermove', move);
        grip.addEventListener('pointerup', end);
        grip.addEventListener('pointercancel', end);
      }
      function moveSec(from, to) {
        if (to < 0 || to >= site.sections.length || from === to) return;
        const id = site.sections[from].id;
        change(() => { const [x] = site.sections.splice(from, 1); site.sections.splice(to, 0, x); });
        st.sel = id;
        scrollAfter = true;
        renderList();
      }
      function dupSec(i) {
        const s = JSON.parse(JSON.stringify(site.sections[i]));
        s.id = SR().uniqueId(site, s.type);
        change(() => site.sections.splice(i + 1, 0, s));
        scrollAfter = true;
        select(s.id, 'keep');
        Kit.toast('複製しました');
      }
      async function delSec(i) {
        const s = site.sections[i], lb = secLabel(s);
        const ok = await Kit.confirm({ title: 'このセクションを削除しますか？', body: '「' + lb.name + '」（' + lb.type + '）を削除します。あとから「元に戻す」で戻せます。', ok: '削除する', danger: true });
        if (!ok) return;
        change(() => site.sections.splice(i, 1));
        const next = site.sections[Math.min(i, site.sections.length - 1)];
        select(next ? next.id : '__site', 'keep');
        Kit.toast('削除しました', { action: { label: '元に戻す', onClick: undo } });
      }
      function toggleHidden(id) {
        const s = site.sections.find((x) => x.id === id);
        if (!s) return;
        change(() => { s.hidden = !s.hidden; });
        renderList();
        if (st.sel === id) renderProps(true);
        Kit.toast(s.hidden ? '非表示にしました（ページには出ません）' : '表示しました');
      }
      function addMenu() {
        const grid = h('div', { class: 'ed-add-grid' });
        const m = Kit.modal({ title: 'セクションを追加', body: h('div', { class: 'stack' }, h('p', { class: 'small muted' }, '選んだセクションのすぐ下に入ります。あとから並べかえもできます。'), grid), wide: true, actions: [{ label: 'やめる', kind: 'ghost' }] });
        for (const t of SR().sectionTypes) {
          grid.append(h('button', { type: 'button', class: 'ed-add-item', onclick: () => { m.close(); addSection(t.type); } },
            Kit.icon(t.icon), h('span', null, h('b', null, t.name), h('small', null, t.desc))));
        }
      }
      function addSection(type) {
        const s = SR().makeSection(type, data.profile, site);
        if (!s) return;
        let at = site.sections.findIndex((x) => x.id === st.sel) + 1;
        if (type === 'hero') at = 0;
        else if (type === 'contact' || at <= 0) { const ci = site.sections.findIndex((x) => x.type === 'contact'); at = type === 'contact' || ci < 0 ? site.sections.length : ci; }
        change(() => site.sections.splice(at, 0, s));
        scrollAfter = true;
        select(s.id, 'list');
        Kit.toast(SR().typeOf(type).name + 'を追加しました');
      }

      /* ── 編集の欄 ── */
      function renderProps(keepScroll) {
        const top = propsPane.scrollTop;
        Kit.clear(propsPane);
        const wrap = h('div', { class: 'ed-props-in' });
        const s = st.sel && st.sel !== '__site' ? site.sections.find((x) => x.id === st.sel) : null;
        wrap.append(...(s ? sectionProps(s) : siteSettings()));
        propsPane.append(wrap);
        propsPane.scrollTop = keepScroll ? top : 0;
      }
      const backBtn = () => (st.layout !== 'three' ? Kit.btn('', () => setTab('list'), { icon: 'left', title: 'セクションの一覧へ', sm: true, kind: 'ghost' }) : null);
      const group = (title, ...kids) => h('div', { class: 'ed-group' }, h('h3', null, title), ...kids);
      function sectionProps(s) {
        const t = SR().typeOf(s.type);
        const out = [h('div', { class: 'ed-props-h' }, backBtn(), h('h2', null, Kit.icon(t.icon), h('span', null, t.name)),
          AI_SPEC[s.type] ? Kit.ai.button('AIで文章案', () => aiDraft(s.id), { sm: true }) : null)];
        if (s.hidden) out.push(h('p', { class: 'ed-hidden-note small' }, h('span', null, 'このセクションは非表示です（ページには出ません）。'), Kit.btn('表示する', () => toggleHidden(s.id), { sm: true })));
        for (const f of t.fields) out.push(fieldEl(f, s, s.id));
        if (s.type === 'contact') {
          const fs = T.formStatus(data.form);
          out.push(h('div', { class: 'ed-info' },
            h('strong', { style: { color: 'var(--ink)' } }, '問い合わせフォーム'),
            h('span', null, 'ご用件の選択肢・入力する項目・送信先は、集客窓口のフォーム設定で決めます。'),
            h('span', { style: fs.ok ? null : { color: 'var(--warn)' } }, fs.text),
            h('div', null, Kit.btn('フォームを設定する', async () => { await save(); Kit.go('inbox', { tab: 'form' }); }, { sm: true, icon: 'inbox' }))));
        }
        if (t.nav) out.push(navGroup(s, t));
        return out;
      }
      // 小見出し・上のメニュー
      function navGroup(s, t) {
        const kids = [];
        kids.push(fieldEl({ k: 'eyebrow', label: '小見出し（見出しの上の小さな英字など）', type: 'text', ph: t.eyebrow, hint: '空欄にすると出ません' }, s, s.id));
        if (site.nav) {
          const cb = h('input', { type: 'checkbox', id: 'ed-' + s.id + '-innav' });
          cb.checked = s.inNav !== false;
          cb.addEventListener('change', () => change(() => { s.inNav = cb.checked; }));
          kids.push(h('label', { class: 'check' }, cb, '上のメニューに出す'));
          kids.push(fieldEl({ k: 'navLabel', label: 'メニューでの名前', type: 'text', ph: t.nav, hint: '短いほど見やすくなります（6字くらいまで）' }, s, s.id));
        } else kids.push(h('p', { class: 'small muted' }, '上のメニューは「サイト全体」で出さない設定になっています。'));
        return h('details', { class: 'help' }, h('summary', null, '小見出しとメニュー'), h('div', { class: 'stack', style: { marginTop: '10px' } }, kids));
      }
      function fieldEl(f, obj, path, onText) {
        const id = 'ed-' + path + '-' + f.k;
        const key = path + '.' + f.k;
        if (f.type === 'text' || f.type === 'textarea' || f.type === 'date' || f.type === 'url') {
          const input = f.type === 'textarea' ? h('textarea', { id, rows: f.rows || 3 }) : h('input', { id, type: f.type === 'date' ? 'date' : f.type === 'url' ? 'url' : 'text' });
          if (f.ph) input.placeholder = f.ph;
          input.value = obj[f.k] == null ? '' : String(obj[f.k]);
          input.addEventListener('input', () => {
            change(() => { obj[f.k] = input.value; }, key);
            if (f.k === 'heading' || f.k === 'navLabel') refreshRow(obj);
            if (onText) onText(input.value);
          });
          return Kit.field({ label: f.label, input, hint: f.hint });
        }
        if (f.type === 'lines') {
          const input = h('textarea', { id, rows: f.rows || 4 });
          input.value = strArr(obj[f.k]).join('\n');
          input.addEventListener('input', () => change(() => { obj[f.k] = input.value.split('\n'); }, key));
          return Kit.field({ label: f.label, input });
        }
        if (f.type === 'bool') {
          const cb = h('input', { type: 'checkbox', id });
          cb.checked = f.k === 'showInfo' ? obj[f.k] !== false : !!obj[f.k];
          cb.addEventListener('change', () => change(() => { obj[f.k] = cb.checked; }));
          return h('label', { class: 'check' }, cb, f.label);
        }
        if (f.type === 'choice') {
          const seg = Kit.seg(f.options, obj[f.k] || f.options[0].value, (v) => change(() => { obj[f.k] = v; }), { label: f.label });
          return h('div', { class: 'field' }, h('span', { class: 'small', style: { color: 'var(--ink-2)', fontWeight: 500 } }, f.label), seg);
        }
        if (f.type === 'link') return linkField(f, obj, id, key);
        if (f.type === 'image') return imageField(f, obj, id);
        if (f.type === 'list') return listField(f, obj, path);
        return h('span');
      }
      // ボタンの行き先：ページ内のセクションか、ほかのページのURL
      function linkField(f, obj, id, key) {
        const v = String(obj[f.k] || '');
        const sel = h('select', { id });
        for (const s of site.sections) if (s.type !== 'hero') sel.append(h('option', { value: '#' + s.id }, secLabel(s).name + ' へ' + (s.hidden ? '（非表示）' : '')));
        sel.append(h('option', { value: '__url' }, 'ほかのページ（URLを入れる）'));
        const url = h('input', { type: 'url', id: id + '-url', placeholder: 'https://', 'aria-label': f.label + 'のURL' });
        const anchors = [...sel.options].map((o) => o.value);
        const isAnchor = v.charAt(0) === '#' && anchors.includes(v);
        sel.value = isAnchor ? v : v ? '__url' : (anchors.includes('#contact') ? '#contact' : anchors[0]);
        url.value = !isAnchor && v.charAt(0) !== '#' ? v : '';
        url.hidden = sel.value !== '__url';
        const hint = h('div', { class: 'hint' });
        const sync = () => {
          const target = sel.value.charAt(0) === '#' ? site.sections.find((s) => '#' + s.id === sel.value) : null;
          hint.textContent = target && target.hidden ? '行き先のセクションが非表示なので、このボタンは出ません。' : sel.value === '__url' ? 'https:// から入れてください。新しいタブで開きます。' : '';
          hint.hidden = !hint.textContent;
        };
        sel.addEventListener('change', () => {
          url.hidden = sel.value !== '__url';
          change(() => { obj[f.k] = sel.value === '__url' ? url.value.trim() : sel.value; });
          sync();
          if (!url.hidden) url.focus();
        });
        url.addEventListener('input', () => change(() => { obj[f.k] = url.value.trim(); }, key));
        sync();
        return h('div', { class: 'field' }, h('label', { for: id }, f.label), sel, url, hint);
      }
      function imageField(f, obj, id, o = {}) {
        const ref = String(obj[f.k] || '');
        const src = ref ? SR().imageSrc(ref, data.images, site) : '';
        const thumb = src ? h('img', { class: 'ed-thumb', src, alt: '' }) : h('span', { class: 'ed-thumb' }, Kit.icon('image'));
        const pick = Kit.btn(ref ? '変える' : '画像を選ぶ', async () => {
          const r = await pickImage(ref, o);
          if (r == null || r === ref) return;
          change(() => { obj[f.k] = r; });
          renderProps(true);
        }, { sm: true, icon: 'image' });
        pick.id = id;
        const rm = ref ? Kit.btn('外す', () => { change(() => { obj[f.k] = ''; }); renderProps(true); }, { sm: true, kind: 'ghost' }) : null;
        return h('div', { class: 'field' }, h('label', { for: id }, f.label), h('div', { class: 'ed-img' }, thumb, h('div', { class: 'btn-row' }, pick, rm)), f.hint ? h('div', { class: 'hint' }, f.hint) : null);
      }
      // くり返しの項目（サービス・プラン・質問など）：追加・削除・並べかえ
      function listField(f, obj, path) {
        const items = strArr(obj[f.k]);
        const box = h('div', { class: 'ed-lf' }, h('div', { class: 'ed-lf-h' }, h('span', null, f.label), h('span', { class: 'muted' }, items.length + '件')));
        items.forEach((it, i) => {
          if (!it || typeof it !== 'object') return;
          const name = () => firstLine(f.title ? it[f.title] : '') || f.itemName + ' ' + (i + 1);
          const title = h('b', null, name());
          const card = h('div', { class: 'ed-item' },
            h('div', { class: 'ed-item-h' }, title,
              Kit.btn('', () => moveItem(obj, f.k, i, i - 1), { icon: 'arrowUp', sm: true, kind: 'ghost', title: '上へ', disabled: i === 0 }),
              Kit.btn('', () => moveItem(obj, f.k, i, i + 1), { icon: 'arrowDown', sm: true, kind: 'ghost', title: '下へ', disabled: i === items.length - 1 }),
              Kit.btn('', () => removeItem(obj, f.k, i, f.itemName), { icon: 'trash', sm: true, kind: 'ghost', title: 'この' + f.itemName + 'を削除' })));
          for (const sf of f.fields) card.append(fieldEl(sf, it, path + '-' + f.k + i, sf.k === f.title ? () => { title.textContent = name(); } : null));
          box.append(card);
        });
        box.append(Kit.btn(f.itemName + 'を追加', () => {
          change(() => { if (!Array.isArray(obj[f.k])) obj[f.k] = []; obj[f.k].push(f.add()); });
          renderProps(true);
          const n = strArr(obj[f.k]).length - 1;
          const first = document.getElementById('ed-' + path + '-' + f.k + n + '-' + f.fields[0].k);
          if (first) { first.scrollIntoView({ block: 'center' }); first.focus(); }
        }, { icon: 'plus', sm: true }));
        return box;
      }
      function moveItem(obj, k, from, to) {
        const a = strArr(obj[k]);
        if (to < 0 || to >= a.length) return;
        change(() => { const [x] = a.splice(from, 1); a.splice(to, 0, x); });
        renderProps(true);
      }
      function removeItem(obj, k, i, name) {
        change(() => { strArr(obj[k]).splice(i, 1); });
        renderProps(true);
        Kit.toast(name + 'を削除しました', { action: { label: '元に戻す', onClick: undo } });
      }
      // 一覧の名前だけ書きかえる（入力のたびに全体を描き直さない）
      function refreshRow(s) {
        if (!s || !s.id) return;
        const li = listPane.querySelector('.ed-sec[data-id="' + s.id + '"] .ed-sec-name');
        if (li) li.textContent = secLabel(s).name;
      }

      /* ── 画像を選ぶ ── */
      function pickImage(current, o = {}) {
        return new Promise((resolve) => {
          let tab = String(current).startsWith('svg:') && !o.photoOnly ? 'art' : 'mine';
          const grid = h('div', { class: 'ed-pick-grid' });
          const item = (ref, src, name) => h('button', { type: 'button', class: 'ed-pick', 'aria-pressed': String(ref === current), title: name, onclick: () => m.close(ref) }, h('img', { src, alt: name }));
          const draw = () => {
            Kit.clear(grid);
            if (tab === 'mine') {
              const list = data.imagesList.slice().reverse();
              if (!list.length) grid.append(Kit.empty({ title: 'まだ画像がありません', body: '「画像を追加」から、スマホやパソコンの写真を選んでください。大きい写真は自動で小さくして保存します。' }));
              for (const it of list) grid.append(item('img:' + it.id, it.dataUrl, it.name || '画像'));
            } else {
              for (const a of SR().illustrations) grid.append(item(a.ref, SR().imageSrc(a.ref, {}, site), a.name));
            }
          };
          const add = Kit.btn('画像を追加', async () => {
            const file = await Kit.img.pick();
            if (!file) return;
            add.disabled = true;
            try {
              const it = await Kit.img.save(file);
              data.imagesList.push(it);
              data.images[it.id] = { dataUrl: it.dataUrl, w: it.w, h: it.h };
              m.close('img:' + it.id);
            } catch (e) { Kit.toast((e && e.message) || '画像を保存できませんでした', { type: 'bad' }); }
            finally { add.disabled = false; }
          }, { icon: 'upload', kind: 'primary' });
          const head = h('div', { class: 'row between' },
            o.photoOnly ? h('span', { class: 'small muted' }, 'SNSのカードには写真（アップロードした画像）を使います。') : Kit.seg([{ value: 'mine', label: 'アップロードした画像' }, { value: 'art', label: 'イラスト' }], tab, (v) => { tab = v; draw(); }, { label: '画像の種類' }),
            add);
          draw();
          const m = Kit.modal({
            title: '画像を選ぶ', wide: true, body: h('div', { class: 'stack' }, head, grid),
            onClose: (v) => resolve(typeof v === 'string' ? v : null),
            actions: current ? [{ label: '画像を外す', kind: 'danger', value: '' }, { label: 'やめる', kind: 'ghost' }] : [{ label: 'やめる', kind: 'ghost' }],
          });
        });
      }

      /* ── サイト全体の設定 ── */
      function counter(input, max) {
        const c = h('span', { class: 'ed-count', 'aria-live': 'polite' });
        const upd = () => { const n = [...input.value].length; c.textContent = n + ' / ' + max + '字めやす'; c.classList.toggle('over', n > max); };
        input.addEventListener('input', upd);
        upd();
        return c;
      }
      function siteSettings() {
        const p = data.profile;
        const out = [h('div', { class: 'ed-props-h' }, backBtn(), h('h2', null, Kit.icon('palette'), h('span', null, 'サイト全体')))];
        // テーマ
        const themes = h('div', { class: 'ed-themes', role: 'group', 'aria-label': '色の組み合わせ' });
        for (const t of SR().themes) {
          const c = t.colors;
          themes.append(h('button', { type: 'button', class: 'ed-theme', 'aria-pressed': String(site.theme === t.id), onclick: () => { change(() => { site.theme = t.id; site.accent = ''; }); renderProps(true); } },
            h('span', { class: 'ed-theme-sw', style: { background: c.bg } }, h('b', { style: { background: c.ink, width: '70%' } }), h('b', { style: { background: c.muted, width: '48%', opacity: '.6' } }), h('i', { style: { background: c.accent } })),
            h('span', { class: 'ed-theme-name' }, t.name), h('span', { class: 'ed-theme-desc' }, t.desc)));
        }
        out.push(group('色の組み合わせ（テーマ）', themes));
        // 字体
        const fontHint = h('div', { class: 'small muted' }, (SR().fontOf(site.font) || {}).desc || '');
        out.push(group('文字の雰囲気', Kit.seg(SR().fonts.map((f) => ({ value: f.id, label: f.name })), site.font, (v) => { change(() => { site.font = v; }); fontHint.textContent = SR().fontOf(v).desc; }, { label: '文字の雰囲気' }), fontHint));
        // アクセント色
        const base = SR().themeOf(site.theme).c.accent;
        const color = h('input', { type: 'color', id: 'ed-accent', value: site.accent || base, 'aria-label': 'アクセント色' });
        color.addEventListener('input', () => change(() => { site.accent = color.value; }, 'accent'));
        out.push(group('アクセント色（ボタンなど）',
          h('div', { class: 'ed-accent' }, color, h('span', { class: 'small muted' }, site.accent ? '自分で選んだ色' : 'テーマの色'),
            site.accent ? Kit.btn('テーマの色に戻す', () => { change(() => { site.accent = ''; }); renderProps(true); }, { sm: true, kind: 'ghost' }) : null),
          h('div', { class: 'small muted' }, '文字が読みにくくならないよう、明るさは自動で調整します。')));
        // メニュー
        const navCb = h('input', { type: 'checkbox', id: 'ed-site-nav' });
        navCb.checked = site.nav !== false;
        navCb.addEventListener('change', () => change(() => { site.nav = navCb.checked; }));
        out.push(group('ページ上部のメニュー', h('label', { class: 'check' }, navCb, 'メニューを出す（スマホでは≡ボタン）'), h('div', { class: 'small muted' }, 'どのセクションを出すかは、各セクションの「小見出しとメニュー」で選べます。')));
        // 検索・SNS
        const defTitle = [p.name, p.tagline].filter(Boolean).join('｜');
        const title = h('input', { type: 'text', id: 'ed-meta-title', placeholder: defTitle || '屋号｜キャッチコピー' });
        title.value = site.meta.title || '';
        const desc = h('textarea', { id: 'ed-meta-desc', rows: 4, placeholder: p.about || '' });
        desc.value = site.meta.description || '';
        const serpT = h('div', { class: 'ed-serp-title' }), serpU = h('div', { class: 'ed-serp-url' }), serpD = h('div', { class: 'ed-serp-desc' });
        const serp = () => {
          serpT.textContent = title.value.trim() || defTitle || '（タイトル）';
          serpU.textContent = site.publishedUrl || 'https://（公開したURL）';
          serpD.textContent = (desc.value.trim() || p.about || '（説明文）').replace(/\s+/g, ' ');
        };
        title.addEventListener('input', () => { change(() => { site.meta.title = title.value; }, 'meta.title'); serp(); });
        desc.addEventListener('input', () => { change(() => { site.meta.description = desc.value; }, 'meta.desc'); serp(); });
        serp();
        out.push(group('検索とSNSでの見え方',
          h('div', { class: 'field' }, h('label', { for: 'ed-meta-title' }, 'ページのタイトル'), title, counter(title, 30), h('div', { class: 'hint' }, '検索結果やブラウザのタブに出ます。空欄なら「屋号｜キャッチコピー」。')),
          h('div', { class: 'field' }, h('label', { for: 'ed-meta-desc' }, '説明文'), desc, counter(desc, 120), h('div', { class: 'hint' }, '検索結果の説明に使われます。空欄なら事業プロフィールの説明。')),
          h('div', { class: 'ed-serp', 'aria-label': '検索結果での見え方（例）' }, serpU, serpT, serpD),
          imageField({ k: 'ogImage', label: 'SNSで共有したときの画像（任意）', hint: '横長（1200×630くらい）の写真がおすすめ。公開したURLを入れると使われます。' }, site.meta, 'ed-meta-og', { photoOnly: true })));
        // 公開したURL・フッター
        const url = h('input', { type: 'url', id: 'ed-published', placeholder: 'https://', inputmode: 'url' });
        url.value = site.publishedUrl || '';
        url.addEventListener('input', () => { change(() => { site.publishedUrl = url.value.trim(); }, 'published'); serp(); });
        const foot = h('textarea', { id: 'ed-footer', rows: 2, placeholder: '例：営業時間・特定商取引法の表記へのご案内など' });
        foot.value = site.footer.note || '';
        foot.addEventListener('input', () => change(() => { site.footer.note = foot.value; }, 'footer'));
        out.push(group('公開とフッター',
          Kit.field({ label: '公開したURL', input: url, hint: '公開したあとで入れてください。QRコードや、検索・SNS用の正式なURLに使われます。' }),
          Kit.field({ label: 'フッターのひとこと（任意）', input: foot })));
        // プロフィール・フォーム
        out.push(group('屋号・連絡先・フォーム',
          h('div', { class: 'ed-info' },
            h('span', null, '屋号・キャッチコピー・メール・電話・SNSは、事業プロフィールから入ります。'),
            h('div', null, Kit.btn('事業プロフィールを編集', async () => { const np = await Kit.profile.edit(); if (np) { data.profile = await Kit.profile.get(); previewSoon(); renderProps(true); } }, { sm: true, icon: 'user' }))),
          h('div', { class: 'ed-info' },
            h('span', null, T.formStatus(data.form).text),
            h('div', null, Kit.btn('フォームを設定する', async () => { await save(); Kit.go('inbox', { tab: 'form' }); }, { sm: true, icon: 'inbox' })))));
        out.push(h('div', { class: 'ed-danger' }, h('strong', { class: 'small' }, '最初から作り直す'), h('span', { class: 'small muted' }, '事業プロフィールをもとに、新しいページを作ります。色と字体はそのままです。'), h('div', null, Kit.btn('自分の事業で作り直す', rebuild, { sm: true, kind: 'danger', icon: 'refresh' }))));
        return out;
      }

      /* ── 作り直す ── */
      async function rebuild() {
        let p = data.profile;
        if (p._sample) {
          const go = await Kit.confirm({ title: '先に事業プロフィールを書きますか？', body: 'ホームページは、事業プロフィール（屋号・説明・サービスなど）をもとに作ります。いまはサンプルのままです。', ok: 'プロフィールを書く', cancel: 'このまま作る' });
          if (go) {
            const np = await Kit.profile.edit();
            if (!np) return;
            p = data.profile = await Kit.profile.get();
          }
        }
        const ok = await Kit.confirm({ title: '自分の事業で作り直しますか？', body: 'いまのページの文章や画像を、事業プロフィールから作った新しいページに置きかえます。あとから「元に戻す」で戻せます。', ok: '作り直す', danger: true });
        if (!ok) return;
        const fresh = SR().normalize(SR().blank(p));
        change(() => { fresh.theme = site.theme; fresh.font = site.font; fresh.accent = site.accent; fresh.publishedUrl = site.publishedUrl; site = fresh; });
        st.sel = null;
        select(site.sections[0] ? site.sections[0].id : '__site', 'keep');
        await save();
        Kit.toast('事業プロフィールから作り直しました。文章を書きかえていきましょう');
      }

      /* ── AI の文章案 ── */
      async function aiDraft(id) {
        const s0 = site.sections.find((x) => x.id === id);
        if (!s0) return;
        const spec = AI_SPEC[s0.type], t = SR().typeOf(s0.type);
        const cur = {};
        for (const k of spec.keys) cur[k] = s0[k];
        const prompt = [await Kit.ai.context(), '',
          'この事業のホームページの「' + t.name + '」の部分の文章案を作ってください。',
          '・やさしく具体的な日本語で、お客さんの立場で書く',
          '・誇張や、根拠のない数字・実績・「No.1」などは書かない',
          '・今の内容を活かして、もっと伝わるように',
          '今の内容：' + JSON.stringify(cur), '',
          '次の形の JSON だけで答えてください：', spec.shape, '例：' + spec.ex].join('\n');
        const res = await Kit.ai.ask(prompt, { json: true });
        const draft = spec.clean(res);
        if (!draft) { Kit.toast('うまく形にできませんでした。もう一度お試しください', { type: 'bad' }); return; }
        const view = h('dl', { class: 'ed-ai' });
        const label = { kicker: '見出しの上の一言', heading: '見出し', sub: '説明', ctaLabel: 'ボタン', body: '本文', lead: 'リード文' };
        for (const k of Object.keys(draft)) {
          if (k === 'items') {
            view.append(h('dt', null, s0.type === 'faq' ? '質問と答え' : 'サービス'),
              h('dd', null, h('ol', null, draft.items.map((x) => h('li', null, s0.type === 'faq' ? [h('b', null, x.q), h('br'), x.a] : [h('b', null, x.title), x.price ? '（' + x.price + '）' : '', h('br'), x.body])))));
          } else if (draft[k]) view.append(h('dt', null, label[k] || k), h('dd', null, draft[k]));
        }
        Kit.modal({
          title: 'AIの文章案（' + t.name + '）', wide: true,
          body: h('div', { class: 'stack' }, h('p', { class: 'small muted' }, '使うまで、今の内容は変わりません。使ったあとも「元に戻す」で戻せます。'), view),
          actions: [{ label: 'やめる', kind: 'ghost' }, { label: 'この案を使う', kind: 'primary', onClick: () => {
            const s = site.sections.find((x) => x.id === id);
            if (!s) return;
            change(() => Object.assign(s, draft));
            renderList();
            renderProps(true);
            Kit.toast('文章案を入れました');
          } }],
        });
      }

      /* ── キーボード：Ctrl/Cmd+Z で元に戻す、Shift つきでやり直す ── */
      const onKey = (e) => {
        if (!(e.ctrlKey || e.metaKey) || e.altKey || document.querySelector('.modal-back')) return;
        const k = String(e.key).toLowerCase();
        if (k === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
        else if ((k === 'z' && e.shiftKey) || k === 'y') { e.preventDefault(); redo(); }
      };
      document.addEventListener('keydown', onKey);

      // ほかの画面で変わったもの（プロフィール・フォーム・画像）をプレビューに反映
      offs.push(Kit.store.on('doc:profile', async () => { data.profile = await Kit.profile.get(); previewSoon(); }));
      offs.push(Kit.store.on('doc:form', async () => { const f = await Kit.store.get('form'); if (f) data.form = f; previewSoon(); }));
      offs.push(Kit.store.on('coll:images', async () => { data.imagesList = await Kit.store.list('images'); data.images = T.imagesMap(data.imagesList); previewSoon(); }));

      /* ── はじめの表示 ── */
      let first = null;
      if (params && params.section) {
        const want = String(params.section);
        const s = site.sections.find((x) => x.id === want) || site.sections.find((x) => x.type === want);
        if (s) first = s.id;
        else if (SR().typeOf(want)) setTimeout(() => Kit.toast(SR().typeOf(want).name + 'のセクションがありません', { action: { label: '追加する', onClick: () => addSection(want) } }), 200);
      }
      st.sel = first || (site.sections[0] ? site.sections[0].id : '__site');
      st.tab = first ? 'props' : 'list';
      renderNote();
      renderList();
      applyLayout();
      renderProps(false);
      syncHistory();
      pv.load(htmlNow());
      setTimeout(fitHeight, 0);

      return () => {
        if (dirty) save();
        previewSoon.cancel();
        pv.destroy();
        offs.forEach((f) => f());
        document.removeEventListener('keydown', onKey);
        window.removeEventListener('resize', onResize);
        if (ro) ro.disconnect();
      };
    },
  });
})();
