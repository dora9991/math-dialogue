/* tangocho：計算単語帳の画面。  ホーム → 単元（STEP とセットをえらぶ）→ 1分トレーニング／印刷シート。
   場所は URL の # で決まる（そのまま共有・ブックマークできる）：
     #/                         ホーム
     #/u/<単元>                  単元（STEP・セットをえらぶ）
     #/u/<単元>/<STEP>/<セット>    1分トレーニング
     #/sheet?mode=pair&u=all&step=all&from=1&to=1   印刷シート（mode：q＝問題だけ／qa＝問題と答え／pair＝両面） */
(function () {
  'use strict';
  const TG = window.TG;
  const $app = document.getElementById('app');
  const { esc, html: h } = TG;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const SECONDS = 60;
  const ART = !!window.TG_ARTIFACT;   // Claude のアーティファクトとして開いたとき：印刷ダイアログは開けないので、印刷のボタンは出さない

  /* ---------------- 記録（このブラウザの中だけ。使えないときは、開いているあいだだけ） ---------------- */
  const KEY = 'tangocho.v1';
  let mem = {};
  const store = {
    read() { try { return Object.assign({}, JSON.parse(localStorage.getItem(KEY)) || {}, mem); } catch (e) { return Object.assign({}, mem); } },
    write(k, v) { mem[k] = v; try { localStorage.setItem(KEY, JSON.stringify(store.read())); } catch (e) { /* 使えなくても動く */ } },
  };
  const bestOf = (uid, step) => store.read()['best:' + uid + ':' + step] | 0;
  const saveBest = (uid, step, n) => { if (n > bestOf(uid, step)) store.write('best:' + uid + ':' + step, n); };
  const passed = (u, step) => bestOf(u.id, step) >= TG.goalOf(u, step);
  const soundOn = () => store.read().sound !== 0;

  /* ---------------- 部品 ---------------- */
  // 1問ぶんの「式 ＝ 答え 単位」。showAns が false なら、答えの欄はあけておく
  function qLine(it, showAns) {
    const pre = it.pre ? `<span class="pre">${h(it.pre)}</span>` : '';
    const eq = it.eq ? '<span class="eq">＝</span>' : '';
    // 分数の答えは、下線のかわりに分数の枠（棒だけ）。書く場所になる
    const frac = /^\{\d+\/\d+\}$/.test(it.ans);
    const ans = frac ? `<span class="slot sf"><span class="a">${showAns ? h(it.ans) : '<span class="fr bl"><span></span><span></span></span>'}</span></span>`
      : `<span class="slot"><span class="a">${showAns ? h(it.ans) : ''}</span></span>`;
    const post = it.post ? `<span class="po">${h(it.post)}</span>` : '';
    return pre + eq + ans + post;
  }
  // 字の長さに合わせて、紙の上の字の大きさをかえる（長い式は少し小さく）
  function sizeClass(items) {
    const len = it => (it.pre + it.post + it.ans).replace(/\{\d+\/\d+\}/g, 'xx').length + (it.eq ? 2 : 0);
    const m = Math.max(...items.map(len));
    const size = m <= 11 ? 'fs-l' : m <= 18 ? 'fs-m' : 'fs-s';
    return items.some(it => /\{/.test(it.pre + it.ans)) && size === 'fs-l' ? 'fs-m fr-card' : size + (items.some(it => /\{/.test(it.pre + it.ans)) ? ' fr-card' : '');
  }
  // 答えの欄の幅（em）。いちばん長い答えが入るように、カードの中で同じにする（問題面と答え面で、欄の位置がそろう）
  function ansWidth(items) {
    const m = Math.max(...items.map(it => it.ans.replace(/\{\d+\/\d+\}/g, '88').length));
    return clamp(m * 0.62 + 0.9, 2.4, 9).toFixed(1);
  }
  const dots = u => u.steps.map((_, i) => `<i class="dot${passed(u, i + 1) ? ' on' : ''}" title="STEP${i + 1}"></i>`).join('');

  /* ---------------- ホーム ---------------- */
  function homeView() {
    const cats = TG.cats.map(c => {
      const us = TG.units.filter(u => u.cat === c.id);
      return `<section class="cat c-${c.id}"><h2>${esc(c.name)}<small>${esc(c.sub || '')}</small></h2><div class="grid">${us.map(u =>
        `<a class="ucard" href="#/u/${u.id}"><b>${esc(u.name)}</b><span class="nt">${esc(u.note)}</span><span class="mt">${u.n}問（前半${u.n / 2}＋後半${u.n / 2}）／ 1分　<span class="dots">${dots(u)}</span></span></a>`).join('')}</div></section>`;
    }).join('');
    return `<header class="top"><div><h1>計算単語帳</h1><p>頭の中で計算する力を、1分ずつきたえる。ひとりでも、ペアでも。</p></div>
      <span class="hbtns"><a class="btn" href="#/book">📖 ハンドブック</a>${ART ? '' : '<a class="btn" href="#/sheet">🖨 プリント・配布シート</a>'}</span></header>
    <main class="wrap">
      <section class="howto">
        <div><b>① えらぶ</b><p>単元をえらぶと、STEP1→3 とだんだんむずかしくなる。「語彙カード」は、ハンドブックの暗記ものを前半・後半（往復）で練習できる。</p></div>
        <div><b>② 1分はかる</b><p>紙に書かず、頭の中で計算して声に出す。「スタート」で 1分。早く終わったら、後半の少しむずかしい問題へ。</p></div>
        <div><b>③ ○を数える</b><p>答え合わせで ○ をつけて数える。目標をこえたら合格！ 次の STEP へ。</p></div>
        <details class="pair"><summary>ペア学習のやりかた</summary>
          <p><b>出題者</b>は「答えを見る」にして、問題を読み上げる。<b>回答者</b>は問題だけ見て（または耳で聞いて）、頭の中で計算して答える。出題者が ○ をつけ、1分たったら交代。</p>
          <p>${ART ? '紙で使うなら、リポジトリの <b>pdf/計算単語帳_ペア用_セット1.pdf</b> を両面印刷する。' : '紙で使うなら、「プリント・配布シート」で<b>ペア用（両面）</b>を印刷する。'}おもてが問題（回答者）、うらが問題＋答え（出題者）。</p>
          <p>セット番号は、同じ番号なら同じ問題。「セット3ね」と言い合える。🎲 で新しい問題も出せる。</p></details>
      </section>${cats}
      <p class="foot">記録（最高の○の数）は、このブラウザの中だけに残ります。　<a href="#/book">📖 ハンドブック（読み物）</a></p>
      ${ART ? '<p class="foot">印刷用のシートとPDFは、リポジトリの tangocho フォルダ（tangocho-all-in-one.html と pdf/）にあります。</p>' : ''}
    </main>`;
  }

  /* ---------------- 単元 ---------------- */
  function unitView(u) {
    const steps = u.steps.map((s, i) => {
      const st = i + 1, best = bestOf(u.id, st), goal = TG.goalOf(u, st);
      const chips = [1, 2, 3, 4, 5, 6].map(n => `<a class="chip" href="#/u/${u.id}/${st}/${n}">セット${n}</a>`).join('');
      return `<section class="step${passed(u, st) ? ' ok' : ''}"><div class="sh"><b>STEP${st}</b><span>${esc(s.name)}</span></div>
        <p class="sm">1分で <b>${goal}問</b> が目標　<span class="nm2">後半：${esc(s.name2)}</span>${best ? `　　最高 <b>${best}問</b>${passed(u, st) ? ' ✓合格' : ''}` : ''}</p>
        <div class="chips">${chips}<a class="chip dice" href="#/u/${u.id}/${st}/${Math.floor(100 + Math.random() * 9900)}" title="新しい問題">🎲 べつの問題</a></div>
        ${ART ? '' : `<a class="pl" href="#/sheet?mode=pair&u=${u.id}&step=${st}&from=1&to=1">🖨 印刷する</a>`}</section>`;
    }).join('');
    const book = u.cat === 'vocab' ? `<p class="bk"><a href="#/book/${u.id}">📖 ハンドブックの該当ページを読む</a></p>` : '';
    return `<header class="top"><div><a class="back" href="#/">← 単元いちらん</a><h1>${esc(u.name)}</h1><p>${esc(u.note)}　／　1セット ${u.n}問（前半${u.n / 2}問＋後半${u.n / 2}問）・1分</p></div>
      ${ART ? '' : `<a class="btn" href="#/sheet?mode=pair&u=${u.id}&step=all&from=1&to=1">🖨 この単元を印刷</a>`}</header>
    <main class="wrap narrow">${book}${steps}</main>`;
  }

  /* ---------------- ハンドブック（読み物） ---------------- */
  function bookView(focus) {
    const B = TG.book;
    const memoOn = store.read().memo === 1;
    const seen = new Set();
    const sections = B.sections.map(s => `<section class="bsec" id="${s.id}"><h2>${esc(s.title)}</h2>${s.blocks.map(b => {
      const first = b.deck && !seen.has(b.deck) ? (seen.add(b.deck), ` data-deck="${b.deck}"`) : '';
      const unit = b.deck ? TG.unit(b.deck) : null;
      const go = unit ? `<a class="bgo" href="#/u/${b.deck}/${b.step || 1}/1">▶ カードで練習（${esc(unit.name)}）</a>` : '';
      return `<article class="blk ${b.kind}"${first}><h3><span class="tag">${b.kind === 'vocab' ? '語彙' : '作法'}</span>${esc(b.title)}</h3>${b.html}${b.memo ? `<p class="memo"><b>先生メモ</b>　${esc(b.memo)}</p>` : ''}${go}</article>`;
    }).join('')}</section>`).join('');
    $app.innerHTML = `<div class="noprint"><header class="top slim"><div><a class="back" href="#/">← 単元いちらん</a><h1>📖 ${esc(B.title)} <small>${esc(B.version)}</small></h1></div>
        <span class="hbtns"><label class="memo-tgl"><input type="checkbox" id="memo"${memoOn ? ' checked' : ''}> 先生メモを表示</label>${ART ? '' : '<button class="btn" id="bprint">🖨 印刷</button>'}</span></header></div>
      <main class="wrap narrow book${memoOn ? ' show-memo' : ''}" id="book"><section class="bintro">${B.intro}</section>${sections}
        <section class="bsec"><h2>使い方（授業運用メモ）</h2><article class="blk">${B.usage}</article></section>
        <p class="later">${esc(B.later)}</p></main>`;
    document.getElementById('memo').addEventListener('change', e => {
      store.write('memo', e.target.checked ? 1 : 0);
      document.getElementById('book').classList.toggle('show-memo', e.target.checked);
    });
    const bp = document.getElementById('bprint');
    if (bp) bp.addEventListener('click', () => window.print());
    if (focus) { const el = document.querySelector(`[data-deck="${focus}"]`); if (el) { el.scrollIntoView(); el.classList.add('hit'); } }
  }

  /* ---------------- 1分トレーニング ---------------- */
  let cleanup = null;   // 画面を離れるときに、タイマーを止める

  function playView(u, step, setNo) {
    const set = TG.makeSet(u.id, step, setNo);
    const n = set.items.length;
    const isFig = u.layout === 'fig';
    const base = `#/u/${u.id}/${step}/`;
    const lis = set.items.map((it, i) => (i === set.half ? `<li class="part"><b>ここから後半</b>　少しむずかしい：${esc(set.stepInfo.name2)}</li>` : '')
      + `<li><button class="q" data-i="${i}" data-m=""><span class="no">${i + 1}</span>${it.fig ? `<span class="fg">${it.fig}</span>` : ''}<span class="qt">${qLine(it, true)}</span><span class="mk"></span></button></li>`).join('');
    $app.innerHTML = `<header class="top slim"><div><a class="back" href="#/u/${u.id}">← ${esc(u.name)}</a>
        <h1>STEP${step} <small>${esc(set.stepInfo.name)}</small></h1></div>
      <nav class="setnav"><a class="btn" href="${base}${Math.max(1, setNo - 1)}" aria-label="前のセット">◀</a><span>セット <b>${setNo}</b></span><a class="btn" href="${base}${setNo + 1}" aria-label="次のセット">▶</a>
        <a class="btn" href="${base}${Math.floor(100 + Math.random() * 9900)}" title="新しい問題">🎲</a></nav></header>
      <main class="play wrap">
        <aside class="ctl">
          <div class="timer" id="timer"><svg viewBox="0 0 100 100" aria-hidden="true"><circle class="bg" cx="50" cy="50" r="44"/><circle class="fg" id="ring" cx="50" cy="50" r="44" transform="rotate(-90 50 50)"/></svg><div class="tn" id="tn">${SECONDS}</div><div class="tl" id="tl">びょう</div></div>
          <div class="btns"><button class="btn pri" id="go">▶ スタート</button><button class="btn" id="rs">もどす</button></div>
          <label class="tgl"><input type="checkbox" id="ans"> <span>答えを見る（出題者）</span></label>
          <label class="tgl"><input type="checkbox" id="snd"${soundOn() ? ' checked' : ''}> <span>音</span></label>
          <div class="sizes" id="sizes">文字　<button data-s="s">小</button><button data-s="m" class="on">中</button><button data-s="l">大</button></div>
          <div class="score" id="score"><span class="sc"><b id="sc">0</b><small>／${n}問</small></span><span class="gl">目標 ${set.goal}問</span><span class="ps" id="ps"></span><span class="fb" id="fb">前半 0／${set.half}　後半 0／${n - set.half}</span></div>
          <p class="hint">問題をタップすると ○ → ✗ → なし。○の数が得点。</p>
          ${ART ? '' : `<a class="plink" href="#/sheet?mode=pair&u=${u.id}&step=${step}&from=${setNo}&to=${setNo}">🖨 このセットを印刷</a>`}
        </aside>
        <ol class="qs${isFig ? ' fig' : ''}${set.items.some(it => (it.pre + it.post + it.ans).replace(/\{\d+\/\d+\}/g, 'xx').length > 16) ? ' lg' : ''} z-m" style="--aw:${ansWidth(set.items)}" id="qs">${lis}</ol>
      </main>`;
    bindPlay(u, step, set);
  }

  function beep(freq, ms) {
    if (!soundOn()) return;
    try {
      const A = window.AudioContext || window.webkitAudioContext, c = new A(), o = c.createOscillator(), g = c.createGain();
      o.frequency.value = freq; g.gain.value = 0.12; o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime + ms / 1000);
      setTimeout(() => c.close(), ms + 200);
    } catch (e) { /* 音が出なくても動く */ }
  }

  function bindPlay(u, step, set) {
    const $ = id => document.getElementById(id);
    const qs = $('qs'), go = $('go'), tn = $('tn'), tl = $('tl'), ring = $('ring'), timer = $('timer');
    const C = 2 * Math.PI * 44;
    ring.style.strokeDasharray = C;
    let phase = 'idle', iv = null, readyEnd = 0, runEnd = 0;

    const score = () => qs.querySelectorAll('.q[data-m="o"]').length;
    function refresh() {
      const s = score(), front = qs.querySelectorAll('.q[data-m="o"]').length && [...qs.querySelectorAll('.q[data-m="o"]')].filter(b => +b.dataset.i < set.half).length;
      $('sc').textContent = s;
      $('fb').textContent = `前半 ${front}／${set.half}　後半 ${s - front}／${set.items.length - set.half}`;
      const ok = s >= set.goal;
      $('ps').textContent = ok ? '合格！' : '';
      $('score').classList.toggle('ok', ok);
      if (s) saveBest(u.id, step, s);
    }
    function draw(sec, frac, label) {
      tn.textContent = sec; tl.textContent = label;
      ring.style.strokeDashoffset = C * (1 - frac);
      timer.dataset.phase = phase;
    }
    function reset() {
      clearInterval(iv); iv = null; phase = 'idle';
      draw(SECONDS, 1, 'びょう'); go.textContent = '▶ スタート';
    }
    function finish() {
      clearInterval(iv); iv = null; phase = 'done';
      draw(0, 0, 'おわり！'); go.textContent = '▶ もういちど';
      $('ans').checked = true; qs.classList.add('show-ans');
      beep(660, 700);
    }
    function loop() {
      const now = performance.now();
      if (phase === 'ready') {
        const left = Math.ceil((readyEnd - now) / 1000);
        if (left > 0) { draw(left, 1, 'よーい'); return; }
        phase = 'run'; runEnd = now + SECONDS * 1000; go.textContent = '■ ストップ'; beep(880, 250);
      }
      if (phase === 'run') {
        const left = (runEnd - now) / 1000;
        if (left <= 0) { finish(); return; }
        draw(Math.ceil(left), left / SECONDS, 'びょう');
      }
    }
    go.addEventListener('click', () => {
      if (phase === 'ready' || phase === 'run') { reset(); return; }
      qs.querySelectorAll('.q').forEach(b => { b.dataset.m = ''; });
      refresh();
      phase = 'ready'; readyEnd = performance.now() + 3000; go.textContent = '■ ストップ';
      iv = setInterval(loop, 100); loop();
    });
    $('rs').addEventListener('click', () => { reset(); });
    $('ans').addEventListener('change', e => qs.classList.toggle('show-ans', e.target.checked));
    $('snd').addEventListener('change', e => store.write('sound', e.target.checked ? 1 : 0));
    $('sizes').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      qs.classList.remove('z-s', 'z-m', 'z-l'); qs.classList.add('z-' + b.dataset.s);
      $('sizes').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
    });
    qs.addEventListener('click', e => {
      const b = e.target.closest('.q'); if (!b) return;
      b.dataset.m = { '': 'o', o: 'x', x: '' }[b.dataset.m];
      refresh();
    });
    const key = e => {
      if (e.target.closest('input,select,textarea')) return;
      if (e.key === ' ' && !e.target.closest('button,a')) { e.preventDefault(); go.click(); }
      else if (e.key === 'a') { $('ans').checked = !$('ans').checked; $('ans').dispatchEvent(new Event('change')); }
    };
    document.addEventListener('keydown', key);
    cleanup = () => { clearInterval(iv); document.removeEventListener('keydown', key); };
    reset();
  }

  /* ---------------- 印刷シート ---------------- */
  // 1枚のカード（＝1セット）。kind：'q'＝問題だけ（答えの欄はあけておく）／'qa'＝答えつき（赤字）。mirror：うら面用に、左右の列を入れかえる
  // part：'all'＝20問を1枚に（左の列が前半、右の列が後半）／0＝前半だけ／1＝後半だけ（図つきの単元は、前半カードと後半カードの2枚にする）
  function cardHTML(set, kind, mirror, part) {
    const u = set.unit, n = set.items.length, lo = part === 1 ? set.half : 0, hi = part === 0 ? set.half : n;
    const sub = set.items.slice(lo, hi);
    const items = sub.map((it, i) => `<div class="ci"><span class="no">${lo + i + 1}</span>${it.fig ? `<span class="fg">${it.fig}</span>` : ''}<span class="qt">${qLine(it, kind === 'qa')}</span></div>`).join('');
    const hard = `後半　少しむずかしい：${esc(set.stepInfo.name2)}`;
    const tag = part === 0 ? '<span class="cp">前半</span>' : part === 1 ? `<span class="cp hard">後半</span>` : '';
    const cols = part === 'all' ? `<div class="hh"><span>前半</span><span class="hard">${hard}</span></div>` : part === 1 ? `<div class="hh one"><span class="hard">${hard}</span></div>` : '';
    return `<article class="card ${u.layout === 'fig' ? 'fig ' : ''}${sizeClass(set.items)}${mirror ? ' mir' : ''}" style="--rows:${Math.ceil(sub.length / 2)};--aw:${ansWidth(set.items)}">
      <header class="ch"><b class="cu">${esc(u.name)}</b><span class="cs">STEP${set.step}　${esc(set.stepInfo.name)}</span><span class="cn">セット${set.setNo}</span>${tag}<span class="cg">1分で <b>${set.goal}</b>問</span></header>
      ${cols}<div class="cb">${items}</div>
      <footer class="cf"><span>月　日（　）</span><span>○　<u></u>　／ ${sub.length}問</span><span>名前 <u class="nm"></u></span></footer></article>`;
  }
  // spec＝{ set, part }。null は、あきの枠（図つきの前半・後半を、同じ紙にそろえるため）
  const cardOf = (spec, kind, mirror) => (spec ? cardHTML(spec.set, kind, mirror, spec.part) : '<article class="card empty"></article>');
  const pageHTML = (specs, kind, mirror, label) => `<section class="page"><div class="pl">${label}</div>${specs.map(s => cardOf(s, kind, mirror)).join('<div class="cut"><span>✂</span></div>')}</section>`;

  function sheetView(p) {
    const mode = ['q', 'qa', 'pair'].includes(p.get('mode')) ? p.get('mode') : 'pair';
    const uid = TG.unit(p.get('u')) ? p.get('u') : 'all';
    const stepP = ['1', '2', '3'].includes(p.get('step')) ? p.get('step') : 'all';
    const from = clamp(parseInt(p.get('from'), 10) || 1, 1, 99999);
    const to = clamp(parseInt(p.get('to'), 10) || from, from, from + 9);
    const units = uid === 'all' ? TG.units : [TG.unit(uid)];
    const steps = stepP === 'all' ? [1, 2, 3] : [+stepP];
    const sets = [];
    units.forEach(u => steps.filter(st => st <= u.steps.length).forEach(st => { for (let no = from; no <= to; no++) sets.push(TG.makeSet(u.id, st, no)); }));
    const tooMany = sets.length > 100;
    if (tooMany) sets.length = 100;

    // 1枚の紙＝カード2枚。文字の単元は1セット＝1カード、図つきの単元は1セット＝前半・後半の2カード（同じ紙にそろえる）
    const sheets = [];
    let cur = [];
    const place = group => {
      if (group.length === 2 && cur.length === 1) { sheets.push([cur[0], null]); cur = []; }
      cur.push(...group);
      if (cur.length === 2) { sheets.push(cur); cur = []; }
    };
    sets.forEach(s => place(s.unit.layout === 'fig' ? [{ set: s, part: 0 }, { set: s, part: 1 }] : [{ set: s, part: 'all' }]));
    if (cur.length) sheets.push([cur[0], null]);
    const pages = [];
    sheets.forEach(sp => {
      if (mode === 'q') pages.push(pageHTML(sp, 'q', false, '問題'));
      else if (mode === 'qa') pages.push(pageHTML(sp, 'qa', false, '問題と答え（赤字）'));
      else {
        pages.push(pageHTML(sp, 'q', false, 'おもて：問題（回答者に見せる）'));
        pages.push(pageHTML(sp, 'qa', true, 'うら：問題と答え（出題者が見る）'));
      }
    });
    const opt = (v, cur, label) => `<option value="${v}"${String(v) === String(cur) ? ' selected' : ''}>${esc(label)}</option>`;
    const back = uid === 'all' ? '#/' : `#/u/${uid}`;
    $app.innerHTML = `<div class="noprint"><header class="top slim"><div><a class="back" href="${back}">← もどる</a><h1>プリント・配布シート</h1></div>
        <button class="btn pri" id="print">🖨 印刷する</button></header>
      <form class="opts" id="opts">
        <label>形式<select name="mode">${opt('pair', mode, 'ペア用（おもて＝問題／うら＝問題と答え）')}${opt('q', mode, '問題だけ（答えを書く欄つき）')}${opt('qa', mode, '問題と答え（答えは赤字）')}</select></label>
        <label>単元<select name="u">${opt('all', uid, 'ぜんぶ')}${TG.units.map(u => opt(u.id, uid, u.name)).join('')}</select></label>
        <label>STEP<select name="step">${opt('all', stepP, 'ぜんぶ')}${[1, 2, 3].map(s => opt(s, stepP, 'STEP' + s)).join('')}</select></label>
        <label>セット番号<span class="rng"><input name="from" type="number" min="1" max="99999" value="${from}"> 〜 <input name="to" type="number" min="1" max="99999" value="${to}"></span></label>
      </form>
      <p class="sinfo">セット <b>${sets.length}</b> 組（1セット＝20問・1分）→ A4 <b>${sheets.length}</b> 枚${mode === 'pair' ? '（両面。プリンターの設定は「両面印刷・長辺とじ」）' : '（片面）'}。1枚のA4を半分に切ると、A5のカードになります。${tooMany ? '<br><b>多すぎるので 100 セットまでにしました。</b>' : ''}</p></div>
      <div class="pages" id="pages">${pages.join('')}</div>`;
    const form = document.getElementById('opts');
    form.addEventListener('change', () => {
      const d = new FormData(form), q = new URLSearchParams();
      ['mode', 'u', 'step', 'from', 'to'].forEach(k => q.set(k, d.get(k)));
      location.hash = '#/sheet?' + q.toString();
    });
    document.getElementById('print').addEventListener('click', () => window.print());
    // 画面では紙を幅に合わせて縮めて見せる（印刷は実寸）
    const fitPages = () => {
      const el = document.getElementById('pages'); if (!el) return;
      el.style.zoom = clamp((document.documentElement.clientWidth - 24) / (210 * 3.7795), 0.3, 1);
    };
    fitPages(); window.addEventListener('resize', fitPages);
    cleanup = () => window.removeEventListener('resize', fitPages);
  }

  /* ---------------- ルーター ---------------- */
  function route() {
    if (cleanup) { cleanup(); cleanup = null; }
    const [path, qs] = (location.hash.slice(1) || '/').split('?');
    const seg = path.split('/').filter(Boolean);
    const u = seg[0] === 'u' && TG.unit(seg[1]);
    document.body.className = '';
    window.scrollTo(0, 0);
    if (seg[0] === 'book') { document.body.classList.add('is-book'); bookView(seg[1]); return; }
    if (seg[0] === 'sheet' && !ART) { document.body.classList.add('is-sheet'); sheetView(new URLSearchParams(qs || '')); return; }
    if (u) {
      const step = parseInt(seg[2], 10), no = parseInt(seg[3], 10);
      if (step >= 1 && step <= u.steps.length && no >= 1) { document.body.classList.add('is-play'); playView(u, step, no); return; }
      $app.innerHTML = unitView(u); return;
    }
    $app.innerHTML = homeView();
  }
  window.addEventListener('hashchange', route);
  route();
})();
