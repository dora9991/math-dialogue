/* contents：コンテンツ一覧ブラウザの画面。data/items.js の window.CB を読んで、カードを並べる。
   外部ライブラリ・通信なし（file:// で開いても動く）。絞りこみは URL の # に残す（共有・戻るで同じ見た目になる）。 */
(function () {
  'use strict';
  const CB = window.CB;
  const app = document.getElementById('app');

  // ---- 小さな道具 ----
  const h = (tag, props, ...kids) => {
    const el = document.createElement(tag);
    Object.keys(props || {}).forEach((k) => {
      if (k === 'text') el.textContent = props[k];
      else el.setAttribute(k, props[k]);
    });
    kids.forEach((c) => { if (c) el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return el;
  };
  const norm = (s) => String(s).normalize('NFKC').toLowerCase();
  const labelOf = (list, key) => (list.find((x) => x.key === key) || { label: key }).label;
  const pagesUrl = (p) => CB.pages + p.replace(/^\//, '');
  const treeUrl = (p) => (p ? CB.repo + 'tree/' + CB.branch + '/' + p : CB.repo);
  const blobUrl = (p) => CB.repo + 'blob/' + CB.branch + '/' + p;

  // ---- 絞りこみの状態（# と同期）----
  const state = { q: '', cat: 'all', who: 'all', access: 'all' };
  const FACETS = [
    { key: 'cat', label: '分類', list: CB.cats, test: (it, v) => it.cat === v },
    { key: 'who', label: 'だれが使う', list: CB.who, test: (it, v) => it.who.indexOf(v) >= 0 },
    { key: 'access', label: '配りかた', list: CB.access, test: (it, v) => it.access === v },
  ];
  const readHash = () => {
    const p = new URLSearchParams(location.hash.replace(/^#/, ''));
    state.q = p.get('q') || '';
    FACETS.forEach((f) => {
      const v = p.get(f.key);
      state[f.key] = v && f.list.some((x) => x.key === v) ? v : 'all';
    });
  };
  const writeHash = () => {
    const p = new URLSearchParams();
    if (state.q) p.set('q', state.q);
    FACETS.forEach((f) => { if (state[f.key] !== 'all') p.set(f.key, state[f.key]); });
    const s = p.toString();
    try { history.replaceState(null, '', s ? '#' + s : location.pathname + location.search); } catch (e) { /* file:// で使えない環境は、# なしで動かす */ }
  };

  const haystack = CB.items.map((it) => norm([it.title, it.summary, (it.tags || []).join(' '), labelOf(CB.cats, it.cat), it.who.map((w) => labelOf(CB.who, w)).join(' '), it.id].join(' ')));
  // skip に指定した絞りこみ以外が合うか（チップの件数を「いま絞っている中での件数」にするため）
  const matches = (it, i, skip) => {
    if (!FACETS.every((f) => f.key === skip || state[f.key] === 'all' || f.test(it, state[f.key]))) return false;
    return norm(state.q).split(/\s+/).filter(Boolean).every((w) => haystack[i].indexOf(w) >= 0);
  };

  // ---- 上の帯 ----
  const counts = {};
  CB.items.forEach((it) => { counts[it.status] = (counts[it.status] || 0) + 1; });
  const top = h('header', { class: 'top' },
    h('div', { class: 'wrap' },
      h('h1', { text: 'コンテンツ一覧ブラウザ' }),
      h('p', { class: 'lede', text: 'つくった道具を、探す・開く・配る。' }),
      h('p', { class: 'count' },
        h('span', {}, h('b', { text: String(CB.items.length) }), ' 個の道具'),
        ...CB.status.filter((s) => counts[s.key]).map((s) => h('span', { text: s.label + ' ' + counts[s.key] })))));

  // ---- 絞りこみの部品 ----
  const input = h('input', { type: 'search', id: 'q', placeholder: 'ことばで探す（例：バスケ、QR）', autocomplete: 'off', enterkeyhint: 'search' });
  const chipBtns = {};
  const groups = FACETS.map((f) => {
    const chips = h('div', { class: 'chips' });
    [{ key: 'all', label: 'すべて' }].concat(f.list).forEach((opt) => {
      const n = h('span', { class: 'n' });
      const b = h('button', { type: 'button', class: 'chip', 'aria-pressed': 'false' }, opt.label, n);
      b.addEventListener('click', () => { state[f.key] = opt.key; update(); });
      chipBtns[f.key + ':' + opt.key] = { b, n };
      chips.appendChild(b);
    });
    return h('div', { class: 'group', role: 'group', 'aria-label': f.label }, h('span', { class: 'label', text: f.label }), chips);
  });
  const controls = h('section', { class: 'controls', 'aria-label': '絞りこみ' },
    h('label', { class: 'search', for: 'q' }, h('span', { class: 'sr', text: 'ことばで探す' }), input), ...groups);
  const result = h('p', { class: 'result', 'aria-live': 'polite' });
  const grid = h('ul', { class: 'grid' });
  const empty = h('div', { class: 'empty', hidden: '' });

  // ---- カード ----
  const btn = (text, href, primary, hint) => {
    const a = h('a', { class: 'btn' + (primary ? ' primary' : ''), href, target: '_blank', rel: 'noopener noreferrer' }, text + ' ↗', h('span', { class: 'sr', text: '（新しいタブで開く）' }));
    if (hint) a.setAttribute('title', hint);
    return a;
  };
  const card = (it) => {
    const web = it.access === 'open' && typeof it.live === 'string';
    const acts = [];
    if (web) acts.push(btn('開く', pagesUrl(it.live), true));
    if (it.file) acts.push(btn(web ? '1ファイル版' : '1ファイル版を入手', blobUrl(it.file), !web, 'GitHub で開いて、右上のダウンロードボタンで保存します'));
    acts.push(btn('ソース', treeUrl(it.dir), !acts.length));
    return h('li', { class: 'card', 'data-cat': it.cat },
      h('p', { class: 'cat', text: labelOf(CB.cats, it.cat) }),
      h('h2', { text: it.title }),
      h('div', { class: 'badges' },
        h('span', { class: 'badge s-' + it.status, text: labelOf(CB.status, it.status) }),
        h('span', { class: 'badge a-' + it.access, text: labelOf(CB.access, it.access) }),
        ...it.who.map((w) => h('span', { class: 'badge who', text: labelOf(CB.who, w) }))),
      h('p', { class: 'summary', text: it.summary }),
      it.access === 'limited' ? h('p', { class: 'note', text: '生徒に配る道具なので、公開URLはここに載せていません（ソースだけ見られます）。' }) : null,
      it.access === 'personal' ? h('p', { class: 'note personal', text: '自分用の道具です。公開URLはありません。' }) : null,
      (it.tags || []).length ? h('ul', { class: 'tags', 'aria-label': 'タグ' }, ...it.tags.map((t) => h('li', { text: '#' + t }))) : null,
      h('details', { class: 'how' }, h('summary', { text: '開き方' }), h('p', { text: it.how })),
      h('div', { class: 'actions' }, ...acts));
  };

  // ---- 画面を更新 ----
  const anyFilter = () => !!state.q || FACETS.some((f) => state[f.key] !== 'all');
  const clear = () => { state.q = ''; input.value = ''; FACETS.forEach((f) => { state[f.key] = 'all'; }); update(); };
  const update = () => {
    FACETS.forEach((f) => [{ key: 'all' }].concat(f.list).forEach((opt) => {
      const c = chipBtns[f.key + ':' + opt.key];
      c.b.setAttribute('aria-pressed', String(state[f.key] === opt.key));
      const n = CB.items.filter((it, i) => matches(it, i, f.key) && (opt.key === 'all' || f.test(it, opt.key))).length;
      c.n.textContent = String(n);
    }));
    const shown = CB.items.filter((it, i) => matches(it, i));
    grid.textContent = '';
    shown.forEach((it) => grid.appendChild(card(it)));
    result.textContent = anyFilter() ? shown.length + ' 件が見つかりました（全 ' + CB.items.length + ' 件）' : '全 ' + CB.items.length + ' 件';
    if (anyFilter()) {
      const b = h('button', { type: 'button', class: 'chip', text: '絞りこみを解除' });
      b.addEventListener('click', clear);
      result.appendChild(document.createTextNode(' '));
      result.appendChild(b);
    }
    empty.textContent = '';
    if (!shown.length) {
      empty.removeAttribute('hidden');
      const b = h('button', { type: 'button', class: 'chip', text: '絞りこみを解除する' });
      b.addEventListener('click', clear);
      empty.appendChild(h('p', { text: '合う道具が見つかりませんでした。ことばを短くするか、絞りこみをゆるめてみてください。' }));
      empty.appendChild(b);
    } else empty.setAttribute('hidden', '');
    writeHash();
  };
  input.addEventListener('input', () => { state.q = input.value; update(); });

  // ---- このページについて ----
  const about = h('details', { class: 'about' },
    h('summary', { text: 'このページの見かた・足しかた' }),
    h('ul', {},
      h('li', { text: '「使える形」＝READMEに使い方まで書いてある／「育成中」＝作者の読み直しや授業での試用がこれから／「例・サンプル」＝各校・各自に合わせて直して使う／「旧版」＝あとの版に発展したもの。' }),
      h('li', { text: '「限定配布」は、生徒にQRなどで配る道具です。URLを広げない運用なので、公開URLは載せていません。' }),
      h('li', { text: '「開く」の先は、公開ブランチ（gh-pages）に実際に入っているものだけです。開けないときは「ソース」から。' }),
      h('li', {}, '足すとき：', h('code', { text: 'contents/data/items.js' }), ' に1ブロック足して、', h('code', { text: 'node contents/tools/check.cjs' }), ' → ', h('code', { text: 'node contents/tools/bundle.cjs' }), ' → ', h('code', { text: 'node contents/tools/publish-pages.cjs' }), '。')));

  app.appendChild(top);
  app.appendChild(h('main', { class: 'wrap' }, controls, result, grid, empty, about));
  app.appendChild(h('footer', { class: 'wrap', text: 'データ：contents/data/items.js' }));

  readHash();
  input.value = state.q;
  update();
  window.addEventListener('hashchange', () => { readHash(); input.value = state.q; update(); });
})();
