/* 生徒指導 対応ナビ：画面。データ（SN.scenarios・SN.guides など）を見て描く。
   画面の場所（# のあと）：
     #top                     一覧（ホーム）
     #ijime                   場面のはじめの分かれ道
     #ijime~honnin~jijitsu    場面の中の道すじ（はじめから ~ でつなぐ）
     #ijime.all               場面の分かれ道を、すべて1ページで
     #kihon #kotoba #kiroku #renkei   基本のページ
   Artifact（SN.ARTIFACT が true）では # を書きかえず、ページの中だけで画面を切りかえる（開くときの # は読む）。 */
(function () {
  'use strict';
  const SN = window.SN;
  const app = document.getElementById('app');
  const ARTIFACT = !!SN.ARTIFACT;
  const WIDE = window.matchMedia ? window.matchMedia('(min-width: 1000px)') : { matches: true };
  const state = { route: { view: 'home' }, from: null, checks: {}, q: '' };
  const problems = SN.validate();
  if (problems.errors.length) console.warn('[生徒指導 対応ナビ] データのまちがい：\n' + problems.errors.join('\n'));

  // ---------- 小さな道具 ----------
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const rich = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
  const plain = (s) => String(s).replace(/\*\*/g, '');
  // 検索用：全角半角・大文字小文字・カタカナとひらがなの違いをならす。1文字ずつ置きかえて、文字の位置を変えない（見つかった所に印をつけるため）
  const fold = (s) => String(s)
    .replace(/[^\x00-\x7f]/g, (c) => { const n = c.normalize('NFKC'); return n.length === 1 ? n : c; })
    .replace(/[A-Z]/g, (c) => c.toLowerCase())
    .replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
  const titleOf = (sid) => (SN.scenarios[sid] ? SN.scenarios[sid].title : sid);
  // 問いが「次は」だけのときは、見出しを「次にすること」にする
  const qText = (q) => (/^次(は|に)?[。？?]?$/.test(String(q).trim()) ? '次にすること' : q);
  const FORK = '<svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="7" fill="var(--chalk)"/><path d="M16 27V17M16 17 9.5 8.5M16 17l6.5-8.5" stroke="var(--sheet)" stroke-width="2.6" stroke-linecap="round" fill="none"/><circle cx="16" cy="17" r="2.8" fill="var(--sheet)"/></svg>';

  // ---------- 場所（route）と # ----------
  const GUIDES = Object.fromEntries(SN.guides.map((g) => [g.id, g]));
  function parse(hash) {
    let h = String(hash || '').replace(/^#/, '');
    try { h = decodeURIComponent(h); } catch (e) { /* そのまま */ }
    if (!h || h === 'top') return { view: 'home' };
    if (GUIDES[h]) return { view: 'guide', id: h };
    const all = h.match(/^([a-z][a-z0-9_]*)\.all$/);
    if (all && SN.scenarios[all[1]]) return { view: 'all', sid: all[1] };
    const parts = h.split('~');
    const s = SN.scenarios[parts[0]];
    if (!s) return { view: 'home' };
    let path = [s.start].concat(parts.slice(1));
    if (!SN.validPath(s.id, path)) path = SN.pathTo(s.id, parts[parts.length - 1]) || [s.start];
    return { view: 'node', sid: s.id, path };
  }
  function encode(r) {
    if (r.view === 'guide') return '#' + r.id;
    if (r.view === 'all') return '#' + r.sid + '.all';
    if (r.view === 'node') return '#' + [r.sid].concat(r.path.slice(1)).join('~');
    return '#top';
  }
  const nodeRoute = (sid, nid) => ({ view: 'node', sid, path: SN.pathTo(sid, nid) || [SN.scenarios[sid].start] });
  const startRoute = (sid) => ({ view: 'node', sid, path: [SN.scenarios[sid].start] });
  function go(r) {
    if (ARTIFACT) return render(r);
    const h = encode(r);
    if (location.hash === h) render(r);
    else location.hash = h;
  }

  // ---------- 場面の木（はじめから幅優先でたどった順・親・入ってくる選択肢） ----------
  const trees = {};
  function tree(sid) {
    if (trees[sid]) return trees[sid];
    const s = SN.scenarios[sid];
    const parent = { [s.start]: null }, order = [s.start], incoming = {};
    for (let i = 0; i < order.length; i++) {
      const nid = order[i];
      for (const o of s.nodes[nid].options || []) {
        if (!o.to || !s.nodes[o.to]) continue;
        (incoming[o.to] = incoming[o.to] || []).push({ from: nid, label: o.label });
        if (!(o.to in parent)) { parent[o.to] = nid; order.push(o.to); }
      }
    }
    return (trees[sid] = { parent, order, incoming });
  }

  // ---------- 部品 ----------
  function bar(mid, right) {
    return `<header class="bar"><div class="wrap bar-in">
      <a class="brand" href="#top" data-go aria-label="生徒指導 対応ナビ（一覧へ）">${FORK}<span><span class="brand-s">生徒指導 </span>対応ナビ</span></a>
      ${mid ? `<span class="bar-sep" aria-hidden="true">/</span>${mid}` : '<span class="bar-sp"></span>'}
      ${right || ''}
    </div></header>`;
  }
  function footer() {
    return `<footer class="foot"><div class="wrap">
      <p><strong>このナビは、生徒指導の対応の「例」です。</strong>実際の対応は、各校の生徒指導規程・いじめ防止基本方針・管理職の判断に従ってください。命にかかわるときは、迷わず119番・110番へ。</p>
      <p>文部科学省「生徒指導提要」（2022年改訂）と、各分かれ道の「根拠・参考」に示した法律・通知・手引きをもとに作成しました（2026年10月）。</p>
    </div></footer>`;
  }
  const sec = (title, mark, cls, body) => `<section class="sec ${cls || ''}"><h2><span class="mk" aria-hidden="true">${mark}</span>${title}</h2>${body}</section>`;

  function teamBlock(key, ids) {
    const groups = [['in', '校内'], ['home', '家庭'], ['out', '校外']];
    const rows = groups.map(([w, label]) => {
      const chips = ids.filter((id) => SN.team[id] && SN.team[id].where === w)
        .map((id) => `<button type="button" class="chip${w === 'out' ? ' out' : ''}" data-team="${id}" data-key="${key}" aria-expanded="false">${esc(SN.team[id].name)}</button>`);
      return chips.length ? `<div class="team-row"><span class="where">${label}</span>${chips.join('')}</div>` : '';
    }).join('');
    return `<div class="team">${rows}<p class="team-note" data-note="${key}" aria-live="polite" hidden></p></div>`;
  }

  // 分かれ道の中身（はじめの画面・一覧のどちらでも使う）
  function nodeBody(s, n) {
    const key = s.id + ':' + n.id;
    const out = [];
    if (n.alert) out.push(`<div class="alert" role="note"><span class="alert-label">緊急</span><p>${rich(n.alert)}</p></div>`);
    if (n.text) out.push(`<p class="lede">${rich(n.text)}</p>`);
    if (n.id === s.start && s.example) out.push(`<div class="example"><span class="label">たとえば</span><p>${rich(s.example)}</p></div>`);
    if (n.steps) {
      const items = n.steps.map((t, i) => {
        const ck = `${key}:${i}`;
        return `<li><label class="step"><input type="checkbox" data-check="${ck}"${state.checks[ck] ? ' checked' : ''}><span class="num" data-n="${i + 1}" aria-hidden="true"></span><span class="t">${rich(t)}</span></label></li>`;
      }).join('');
      out.push(sec('対応の手順', '→', '', `<ol class="steps">${items}</ol><p class="steps-note">終わったものは押して印をつけられます（このページを閉じると消えます）。</p>`));
    }
    if (n.say) out.push(sec('声かけの例', '○', 'ok', `<ul class="say">${n.say.map((t) => `<li>${rich(t)}</li>`).join('')}</ul>`));
    if (n.avoid) out.push(sec('避けたい言葉・対応', '×', 'ng', `<ul class="avoid">${n.avoid.map(([t, why]) => `<li><span class="ng-text">${rich(t)}</span><span class="why">${rich(why)}</span></li>`).join('')}</ul>`));
    if (n.team) out.push(sec('連携・報告先', '⇄', '', teamBlock(key, n.team)));
    if (n.record) out.push(sec('記録すること', '✎', '', `<ul class="plain">${n.record.map((t) => `<li>${rich(t)}</li>`).join('')}</ul>`));
    if (n.points) out.push(sec('ポイント', '！', 'pt', `<ul class="plain">${n.points.map((t) => `<li>${rich(t)}</li>`).join('')}</ul>`));
    if (n.basis) out.push(sec('根拠・参考', '§', '', `<ul class="basis-list">${n.basis.map((t) => `<li>${rich(t)}</li>`).join('')}</ul>`));
    return out.join('');
  }

  // 選択肢のリンク
  function optLink(s, path, o) {
    if (o.to) {
      const r = { view: 'node', sid: s.id, path: path.concat(o.to) };
      return `<a class="opt" href="${encode(r)}" data-go><span>${esc(o.label)}</span>${o.sub ? `<span class="sub">${esc(o.sub)}</span>` : ''}<span class="arrow" aria-hidden="true">→</span></a>`;
    }
    const js = o.jump.split('~')[0];
    const here = encode({ view: 'node', sid: s.id, path });
    return `<a class="opt jump" href="#${esc(o.jump)}" data-go data-from="${esc(here)}"><span>${esc(o.label)}</span><span class="sub">別の場面へ：${esc(titleOf(js))}${o.sub ? '　' + esc(o.sub) : ''}</span><span class="arrow" aria-hidden="true">↗</span></a>`;
  }

  // 分岐マップ（路線図）
  function mapTree(s, path) {
    const t = tree(s.id), on = new Set(path), cur = path[path.length - 1];
    const item = (nid) => {
      const n = s.nodes[nid];
      const subs = [], seen = new Set();
      for (const o of n.options || []) {
        if (o.to && s.nodes[o.to]) {
          if (seen.has(o.to)) continue;
          seen.add(o.to);
          if (t.parent[o.to] === nid) subs.push(item(o.to));
          else subs.push(`<li class="m-ref"><a href="${encode(nodeRoute(s.id, o.to))}" data-go title="${esc(o.label)}"><span class="m-ic" aria-hidden="true">↪</span><span>${esc(s.nodes[o.to].title)}</span></a></li>`);
        } else if (o.jump) {
          const here = encode(nodeRoute(s.id, nid));
          subs.push(`<li class="m-ext"><a href="#${esc(o.jump)}" data-go data-from="${esc(here)}" title="${esc(o.label)}"><span class="m-ic" aria-hidden="true">↗</span><span>${esc(titleOf(o.jump.split('~')[0]))}</span></a></li>`);
        }
      }
      const cls = 'm-node' + (on.has(nid) ? ' on' : '') + (nid === cur ? ' cur' : '');
      return `<li><a class="${cls}" href="${encode(nodeRoute(s.id, nid))}" data-go${nid === cur ? ' aria-current="step"' : ''}><span class="dot" aria-hidden="true"></span><span>${esc(n.title)}</span></a>${subs.length ? `<ul>${subs.join('')}</ul>` : ''}</li>`;
    };
    return `<ul class="map">${item(s.start)}</ul>`;
  }
  function mapBox(s, path, open) {
    const count = Object.keys(s.nodes).length;
    return `<details class="map-box" id="map"${open ? ' open' : ''}>
      <summary>分岐マップ <span class="cnt">分かれ道 ${count}</span></summary>
      <p class="map-legend"><span>● いまの道すじ</span><span>↪ ほかの枝と合流</span><span>↗ 別の場面へ</span></p>
      ${mapTree(s, path)}
    </details>`;
  }

  // ---------- 画面：ホーム ----------
  function viewHome() {
    const errs = problems.errors.length
      ? `<div class="data-errors" role="alert"><strong>データにまちがいがあります（${problems.errors.length}件）。</strong>tools/check.cjs で確かめてください。<ul>${problems.errors.slice(0, 8).map((e) => `<li>${esc(e)}</li>`).join('')}</ul></div>`
      : '';
    const cats = SN.cats.map((c) => {
      const list = c.ids.filter((id) => SN.scenarios[id]).map((id) => {
        const s = SN.scenarios[id];
        return `<li><a class="card" href="${encode(startRoute(id))}" data-go>
          <h3>${esc(s.title)}</h3><p>${esc(s.lead)}</p>
          <span class="meta"><span>分かれ道 ${Object.keys(s.nodes).length}</span><span class="go" aria-hidden="true">開く →</span></span></a></li>`;
      }).join('');
      if (!list) return '';
      return `<section class="cat cat-${c.id}" aria-labelledby="cat-${c.id}">
        <div class="cat-head"><h2 id="cat-${c.id}">${esc(c.name)}</h2><p>${esc(c.note)}</p></div>
        <ul class="cards">${list}</ul></section>`;
    }).join('');
    const guides = SN.guides.map((g) => `<li><a class="card" href="#${g.id}" data-go><h3>${esc(g.title)}</h3><p>${esc(g.lead)}</p></a></li>`).join('');
    return bar('', `<a class="bar-btn" href="#kihon" data-go>初期対応の基本</a>`) + `
      <main class="wrap" id="home">
        ${errs}
        <section class="hero">
          <h1 tabindex="-1">生徒指導 対応ナビ</h1>
          <p class="tag">迷ったときに開く、分かれ道の地図</p>
          <p class="how">場面を選び、問いに答えて進むと、その状況での<strong>対応の手順・声かけの例・避けたい言葉・連携先・記録すること</strong>が出ます。右の分岐マップ（スマホでは下）から、ほかの分かれ道へも移れます。</p>
        </section>
        <section class="sos" aria-labelledby="sos-h">
          <h2 id="sos-h">命や体の安全にかかわるときは、まずこの3つ</h2>
          <ol>
            <li><span class="n">1</span><span><b>安全を確保する</b><span class="tel">119</span> 救急　<span class="tel">110</span> 警察<br>生徒を一人にしない。</span></li>
            <li><span class="n">2</span><span><b>応援を呼ぶ</b>一人で対応しない。近くの先生・職員室へ。</span></li>
            <li><span class="n">3</span><span><b>管理職に報告する</b>そのあと、ここで場面を選んで対応を確かめる。</span></li>
          </ol>
        </section>
        <div class="search" role="search">
          <label for="q">場面やことばで探す</label>
          <input id="q" type="search" autocomplete="off" enterkeyhint="search" placeholder="例：LINE、リストカット、保護者" value="${esc(state.q)}">
          <button type="button" class="clear" data-clear aria-label="検索をけす"${state.q ? '' : ' hidden'}>×</button>
          <p class="hint">キーボードの <kbd>/</kbd> でここへ移れます。</p>
        </div>
        <div class="results" id="results" aria-live="polite"></div>
        <div id="browse">
          ${cats}
          <section class="cat guides" aria-labelledby="cat-kihon">
            <div class="cat-head"><h2 id="cat-kihon">基本</h2><p>どの場面にも共通すること。</p></div>
            <ul class="cards">${guides}</ul>
          </section>
        </div>
      </main>` + footer();
  }

  // ---------- 検索 ----------
  let INDEX = null;
  function buildIndex() {
    INDEX = [];
    for (const s of SN.ordered()) {
      INDEX.push({ sid: s.id, nid: s.start, title: s.title, scene: true, texts: [s.title, s.lead, s.example || '', (s.words || []).join('、')].filter(Boolean) });
      for (const nid of tree(s.id).order) {
        const n = s.nodes[nid];
        const texts = [n.title, n.alert, n.text, ...(n.steps || []), ...(n.say || []), ...(n.avoid || []).flat(), ...(n.record || []), ...(n.points || []), n.question, ...(n.options || []).map((o) => o.label)].filter(Boolean).map(plain);
        INDEX.push({ sid: s.id, nid, title: n.title, texts });
      }
    }
    for (const g of SN.guides) {
      const texts = [g.title, g.lead];
      for (const b of g.blocks) {
        if (b.h) texts.push(b.h);
        if (b.p) texts.push(b.p);
        if (b.template) texts.push(b.template);
        texts.push(...(b.ol || []), ...(b.ul || []), ...(b.pairs || []).flat());
        if (b.team) texts.push(...Object.values(SN.team).map((t) => `${t.name}：${t.role}`));
        if (b.hotlines) texts.push(...SN.hotlines.map((h) => `${h.tel} ${h.name}（${h.note}）`));
      }
      INDEX.push({ guide: g.id, title: g.title, texts: texts.map(plain) });
    }
    for (const e of INDEX) e.hay = fold(e.texts.join('\n'));
  }
  function snippet(texts, term) {
    for (const t of texts) {
      const i = fold(t).indexOf(term);
      if (i < 0) continue;
      const a = Math.max(0, i - 24), b = Math.min(t.length, i + term.length + 36);
      return (a > 0 ? '…' : '') + esc(t.slice(a, i)) + '<mark>' + esc(t.slice(i, i + term.length)) + '</mark>' + esc(t.slice(i + term.length, b)) + (b < t.length ? '…' : '');
    }
    return esc(texts[1] || texts[0] || '');
  }
  function runSearch() {
    const box = document.getElementById('results'), browse = document.getElementById('browse'), clear = app.querySelector('[data-clear]');
    if (!box) return;
    const q = state.q.trim();
    if (clear) clear.hidden = !q;
    if (!q) { box.innerHTML = ''; browse.hidden = false; return; }
    if (!INDEX) buildIndex();
    const terms = fold(q).split(/\s+/).filter(Boolean);
    const seen = new Set();
    const hits = INDEX.filter((e) => terms.every((t) => e.hay.includes(t)))
      .map((e) => ({ e, score: (e.scene ? 2 : 0) + (terms.some((t) => fold(e.title).includes(t)) ? 3 : 0) }))
      .sort((x, y) => y.score - x.score)
      .filter(({ e }) => { const k = e.guide ? 'g:' + e.guide : e.sid + ':' + e.nid; if (seen.has(k)) return false; seen.add(k); return true; })
      .slice(0, 40);
    browse.hidden = true;
    const line = (e) => e.guide
      ? `<a href="#${e.guide}" data-go><span class="r-path">基本 › ${esc(e.title)}</span><span class="r-snip">${snippet(e.texts, terms[0])}</span></a>`
      : `<a href="${encode(nodeRoute(e.sid, e.nid))}" data-go><span class="r-path">${esc(titleOf(e.sid))}${e.scene ? '' : ' › ' + esc(e.title)}</span><span class="r-snip">${snippet(e.texts, terms[0])}</span></a>`;
    box.innerHTML = `<p class="count">「${esc(q)}」が見つかったところ：${hits.length}件${hits.length === 40 ? '（上から40件）' : ''}</p>` +
      (hits.length
        ? hits.map(({ e }) => line(e)).join('')
        : `<p>見つかりませんでした。ほかの言い方（例：「スマホ」→「携帯」）でも探せます。下の一覧から選ぶこともできます。</p><p><button type="button" class="btn" data-clear>検索をけして一覧を見る</button></p>`);
  }

  // ---------- 画面：分かれ道 ----------
  function viewNode(r) {
    const s = SN.scenarios[r.sid], path = r.path, nid = path[path.length - 1], n = s.nodes[nid];
    const crumbs = path.map((id, i) => i < path.length - 1
      ? `<a href="${encode({ view: 'node', sid: s.id, path: path.slice(0, i + 1) })}" data-go>${esc(s.nodes[id].title)}</a>`
      : `<span aria-current="page">${esc(s.nodes[id].title)}</span>`).join('<span class="sep" aria-hidden="true">›</span>');
    const from = state.from && state.from.view === 'node' && state.from.sid !== s.id
      ? `<a class="from" href="${encode(state.from)}" data-go>← もどる：${esc(titleOf(state.from.sid))} › ${esc(SN.scenarios[state.from.sid].nodes[state.from.path[state.from.path.length - 1]].title)}</a>`
      : '';
    const opts = n.options || [];
    const branch = opts.length
      ? `<section class="branch" id="branch" aria-labelledby="branch-q"><p class="kicker">次の分かれ道</p><h2 id="branch-q">${esc(qText(n.question))}</h2><ul class="opts">${opts.map((o) => `<li>${optLink(s, path, o)}</li>`).join('')}</ul></section>`
      : `<section class="leaf"><h2>この道すじの対応は、ここまでです</h2><p>ほかの分かれ道は、分岐マップから確かめられます。場面全体を1ページで読むこともできます。</p>
          <div class="leaf-actions"><a class="btn" href="${encode(startRoute(s.id))}" data-go>はじめの分かれ道へ</a><a class="btn" href="${encode({ view: 'all', sid: s.id })}" data-go>この場面をすべて読む</a></div>
          ${(s.related || []).filter((id) => SN.scenarios[id]).length ? `<div class="related"><h3>関連する場面</h3><ul>${s.related.filter((id) => SN.scenarios[id]).map((id) => `<li><a href="${encode(startRoute(id))}" data-go>${esc(titleOf(id))}</a></li>`).join('')}</ul></div>` : ''}
        </section>`;
    const backR = path.length > 1 ? { view: 'node', sid: s.id, path: path.slice(0, -1) } : { view: 'home' };
    const depth = path.length === 1 ? 'はじめの分かれ道' : `${path.length}つめの分かれ道`;
    return bar(`<a class="bar-scene" href="${encode(startRoute(s.id))}" data-go>${esc(s.title)}</a>`, `<button type="button" class="bar-btn map-toggle" data-scroll="map">分岐マップ</button>`) + `
      <div class="wrap layout">
        <main class="main">
          ${from}
          <nav class="crumbs" aria-label="ここまでの道すじ">${crumbs}</nav>
          <header class="node-head">
            <p class="eyebrow">${esc(s.title)}・${depth}</p>
            <h1 tabindex="-1">${esc(n.title)}</h1>
            ${opts.length && (n.steps || n.text) ? `<a class="to-branch" href="#branch" data-scroll="branch">↓ 次の分かれ道：${esc(qText(n.question))}</a>` : ''}
          </header>
          ${nodeBody(s, n)}
          ${branch}
          <a class="back" href="${encode(backR)}" data-go>← ${path.length > 1 ? '前の分かれ道に戻る' : '一覧に戻る'}</a>
        </main>
        <aside class="map-aside" aria-label="この場面の分岐マップ">${mapBox(s, path, WIDE.matches)}
          <p class="small-note" style="margin-top:10px"><a href="${encode({ view: 'all', sid: s.id })}" data-go>この場面の分かれ道を、すべて1ページで読む</a></p>
        </aside>
      </div>` + footer();
  }

  // ---------- 画面：場面の全体 ----------
  function viewAll(r) {
    const s = SN.scenarios[r.sid], t = tree(s.id);
    const blocks = t.order.map((nid) => {
      const n = s.nodes[nid];
      const came = (t.incoming[nid] || []).map((x) => `「${esc(s.nodes[x.from].title)}」で「${esc(x.label)}」`).join('、');
      const opts = (n.options || []).map((o) => o.to
        ? `<li><button type="button" data-scroll="n-${o.to}">${esc(o.label)}</button>（→ ${esc(s.nodes[o.to].title)}）</li>`
        : `<li><a href="#${esc(o.jump)}" data-go data-from="${esc(encode(nodeRoute(s.id, nid)))}">${esc(o.label)}</a>（→ 別の場面：${esc(titleOf(o.jump.split('~')[0]))}）</li>`).join('');
      return `<article class="all-node" id="n-${nid}">
        <header>${nid === s.start ? '<p class="came">はじめの分かれ道</p>' : came ? `<p class="came">${came}を選んだとき</p>` : ''}<h2 class="node-t">${esc(n.title)}</h2></header>
        ${nodeBody(s, n)}
        ${opts ? `<div class="all-opts"><h3>${esc(qText(n.question))}</h3><ul>${opts}</ul></div>` : ''}
        <p class="no-print"><a href="${encode(nodeRoute(s.id, nid))}" data-go>この分かれ道を、ナビの画面で開く →</a></p>
      </article>`;
    }).join('');
    return bar(`<a class="bar-scene" href="${encode(startRoute(s.id))}" data-go>${esc(s.title)}</a>`, '') + `
      <div class="wrap layout">
        <main class="main">
          <header class="all-head">
            <h1 tabindex="-1">${esc(s.title)}（すべての分かれ道）</h1>
            <p>${esc(s.lead)} 分かれ道 ${t.order.length} をすべて、はじめから順に並べています。</p>
            <div class="all-tools">
              <a class="btn" href="${encode(startRoute(s.id))}" data-go>← ナビの画面に戻る</a>
              ${ARTIFACT ? '' : '<button type="button" class="btn solid" data-print>この場面を印刷する</button>'}
            </div>
          </header>
          ${blocks}
        </main>
        <aside class="map-aside" aria-label="この場面の分岐マップ">${mapBox(s, [s.start], WIDE.matches)}</aside>
      </div>` + footer();
  }

  // ---------- 画面：基本のページ ----------
  function viewGuide(r) {
    const g = GUIDES[r.id];
    const blocks = g.blocks.map((b, bi) => {
      if (b.h) return `<h2>${esc(b.h)}</h2>`;
      if (b.p) return `<p>${rich(b.p)}</p>`;
      if (b.ol) return `<ol class="g-ol">${b.ol.map((t) => `<li><span>${rich(t)}</span></li>`).join('')}</ol>`;
      if (b.ul) return `<ul class="g-ul">${b.ul.map((t) => `<li>${rich(t)}</li>`).join('')}</ul>`;
      if (b.pairs) return `<dl class="pairs">${b.pairs.map(([dt, dd]) => `<div><dt>${rich(dt)}</dt><dd>${rich(dd)}</dd></div>`).join('')}</dl>`;
      if (b.template) return `<div class="tpl"><pre id="tpl-${bi}">${esc(b.template)}</pre><div><button type="button" class="btn solid" data-copy="tpl-${bi}">枠をコピーする</button> <span class="copied" aria-live="polite"></span></div></div>`;
      if (b.team) {
        return `<div class="team-list">${[['in', '校内'], ['home', '家庭'], ['out', '校外']].map(([w, label]) => {
          const items = Object.values(SN.team).filter((t) => t.where === w);
          return items.length ? `<h3>${label}</h3><dl>${items.map((t) => `<div><dt>${esc(t.name)}</dt><dd>${esc(t.role)}</dd></div>`).join('')}</dl>` : '';
        }).join('')}</div>`;
      }
      if (b.hotlines) {
        return `<ul class="hotlines">${SN.hotlines.map((h) => `<li><span class="num">${esc(h.tel)}</span><span class="nm">${esc(h.name)}</span><span class="nt">${esc(h.note)}</span></li>`).join('')}</ul><p class="small-note">${esc(SN.hotlineNote)}</p>`;
      }
      return '';
    }).join('');
    const others = SN.guides.filter((x) => x.id !== g.id).map((x) => `<a class="btn" href="#${x.id}" data-go>${esc(x.title)}</a>`).join('');
    return bar(`<span class="bar-scene">${esc(g.title)}</span>`, '') + `
      <main class="wrap"><article class="guide">
        <h1 tabindex="-1">${esc(g.title)}</h1>
        <p class="lead">${esc(g.lead)}</p>
        ${blocks}
        <div class="leaf-actions no-print" style="margin-top:12px">${others}${ARTIFACT ? '' : '<button type="button" class="btn" data-print>印刷する</button>'}</div>
        <p class="no-print"><a href="#top" data-go>← 一覧に戻る</a></p>
      </article></main>` + footer();
  }

  // ---------- 描く ----------
  function render(r) {
    // 別の場面から来たときの「もどる」は、その場面の中にいるあいだだけ出す
    if (r.view !== 'node' || (state.from && state.from.sid === r.sid)) state.from = null;
    state.route = r;
    let html, title = '生徒指導 対応ナビ';
    if (r.view === 'node') { html = viewNode(r); const n = SN.scenarios[r.sid].nodes[r.path[r.path.length - 1]]; title = `${n.title}｜${titleOf(r.sid)}｜生徒指導 対応ナビ`; }
    else if (r.view === 'all') { html = viewAll(r); title = `${titleOf(r.sid)}（すべて）｜生徒指導 対応ナビ`; }
    else if (r.view === 'guide') { html = viewGuide(r); title = `${GUIDES[r.id].title}｜生徒指導 対応ナビ`; }
    else html = viewHome();
    app.innerHTML = html;
    if (!ARTIFACT) document.title = title;
    if (r.view === 'home') {
      runSearch();
      window.scrollTo(0, 0);
      return;
    }
    window.scrollTo(0, 0);
    const h1 = app.querySelector('h1');
    if (h1) try { h1.focus({ preventScroll: true }); } catch (e) { h1.focus(); }
  }

  // ---------- 操作 ----------
  app.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-go]');
    if (a) {
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.button > 0) return;
      const from = a.getAttribute('data-from');
      if (from) state.from = parse(from);
      const r = parse(a.getAttribute('href'));
      e.preventDefault();
      go(r);
      return;
    }
    const scr = e.target.closest('[data-scroll]');
    if (scr) {
      e.preventDefault();
      const el = document.getElementById(scr.getAttribute('data-scroll'));
      if (el) {
        if (el.tagName === 'DETAILS') el.open = true;
        el.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
      }
      return;
    }
    const chip = e.target.closest('[data-team]');
    if (chip) {
      const key = chip.getAttribute('data-key'), id = chip.getAttribute('data-team');
      const note = app.querySelector(`[data-note="${key}"]`);
      const open = chip.getAttribute('aria-expanded') === 'true';
      app.querySelectorAll(`[data-key="${key}"]`).forEach((c) => c.setAttribute('aria-expanded', 'false'));
      if (open) { note.hidden = true; return; }
      chip.setAttribute('aria-expanded', 'true');
      note.innerHTML = `<strong>${esc(SN.team[id].name)}</strong>：${esc(SN.team[id].role)}`;
      note.hidden = false;
      return;
    }
    const cp = e.target.closest('[data-copy]');
    if (cp) {
      const pre = document.getElementById(cp.getAttribute('data-copy'));
      const msg = cp.parentElement.querySelector('.copied');
      const done = (t) => { if (msg) msg.textContent = t; };
      const selectIt = () => { const sel = window.getSelection(), rg = document.createRange(); rg.selectNodeContents(pre); sel.removeAllRanges(); sel.addRange(rg); done('選びました。コピーしてください（Ctrl+C／長押し）'); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(pre.textContent).then(() => done('コピーしました'), selectIt);
      else selectIt();
      return;
    }
    if (e.target.closest('[data-print]')) { window.print(); return; }
    if (e.target.closest('[data-clear]')) {
      state.q = '';
      const q = document.getElementById('q');
      if (q) { q.value = ''; q.focus(); }
      runSearch();
    }
  });
  app.addEventListener('change', (e) => {
    const c = e.target.closest('input[data-check]');
    if (c) state.checks[c.getAttribute('data-check')] = c.checked;
  });
  app.addEventListener('input', (e) => {
    if (e.target.id === 'q') { state.q = e.target.value; runSearch(); }
  });
  document.addEventListener('keydown', (e) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target && e.target.tagName) || '');
    if (e.key === '/' && !typing && state.route.view === 'home') {
      const q = document.getElementById('q');
      if (q) { e.preventDefault(); q.focus(); }
    } else if (e.key === 'Escape' && e.target && e.target.id === 'q' && state.q) {
      state.q = ''; e.target.value = ''; runSearch();
    }
  });
  if (!ARTIFACT) window.addEventListener('hashchange', () => render(parse(location.hash)));
  if (WIDE.addEventListener) WIDE.addEventListener('change', () => { const m = document.getElementById('map'); if (m) m.open = WIDE.matches; });

  // 開くときの # を読む（Artifact でも、共有リンクの #ijime などは届く）
  render(parse(location.hash));
})();
