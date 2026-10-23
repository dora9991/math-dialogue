/* ikkan：記録ページの画面（rec.js のあとに読む）。
   #/r/<単元のキー>            … 単元の記録の一覧（学習予定表の QR の行き先）
   #/r/<授業のID>/<dr|qz>      … 演習プリント・小テストの記録（QR の行き先）。問題ごとに、自分の答え・答えを見る・○△×で自己採点。結果コードをつくる
   #/rsum                      … 先生用：生徒の結果コードを貼りつけて、集計する／問題一覧をダウンロードする
   生徒の記録は、その端末の localStorage にだけ入る（先生に送るのは、結果コードを自分で送ったときだけ）。 */
(function () {
  'use strict';
  const IK = window.IK, R = IK.render, rec = IK.rec;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const $ = (root, sel) => root.querySelector(sel);

  /* ---------------- この端末への保存（使えないときは、ページを開いているあいだだけ覚える） ---------------- */
  const KEY = 'ikkan.rec.v1';
  let mem = null;
  const load = () => {
    if (mem) return mem;
    try { mem = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { mem = {}; }
    if (!mem.sheets) mem.sheets = {};
    if (!mem.who) mem.who = { g: '', n: '' };
    return mem;
  };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) { /* 保存できなくても、そのまま使える */ } };
  const sheetOf = (id, kind) => { const d = load(), k = id + '.' + kind; return d.sheets[k] || (d.sheets[k] = { marks: {}, ans: {}, refl: '', send: true, open: false }); };
  const hasSheet = (id, kind) => !!load().sheets[id + '.' + kind];

  const nfkc = s => String(s == null ? '' : s).normalize('NFKC').trim();
  // 問題文：空欄 {{答え}} は、答えを出さずに、線だけにする
  const qHTML = t => R.inl(String(t).replace(/\{\{[\s\S]*?\}\}/g, '{{　　}}'));

  const download = (name, text, type) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: type || 'text/plain' }));
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  };
  const copyText = async (text, ta) => {
    try { await navigator.clipboard.writeText(text); return true; } catch (e) { /* 下の方法でためす */ }
    try { ta.focus(); ta.select(); return document.execCommand('copy'); } catch (e) { return false; }
  };

  /* ================= 生徒：演習・小テストの記録 ================= */
  function record(app, id, kind) {
    const l = IK.lessons[id], items = rec.items(id, kind);
    if (!l || !items.length) return false;
    const kname = rec.KINDS[kind], d = load(), S = sheetOf(id, kind), locked = rec.LOCK[kind] && !S.open;
    document.title = `${l.title}　${kname}の記録`;
    const lv = it => it.level ? `<span class="rc-lv lv-${it.challenge ? 'ch' : 'n' + (rec.LEVELS.indexOf(it.level) + 1)}">${esc(it.level)}</span>` : '';
    app.innerHTML = `<div class="rc">
      <header class="rc-top"><a class="rc-back" href="#/r/${esc(l.unit)}">← 単元の記録</a>
        <div class="rc-ttl"><small>${esc([l.unitName, l.no].filter(Boolean).join('　'))}</small><b>${esc(kname)}の記録</b></div></header>
      <main class="rc-main">
        <p class="rc-lead">${esc(l.title)}<br><small>プリントを解いたら、問題ごとに答えあわせをして、○△×をつけよう。問題の図は、プリントを見てね。</small></p>
        <section class="rc-who"><label>組 <input id="rcG" maxlength="6" autocomplete="off" value="${esc(d.who.g)}"></label>
          <label>番号 <input id="rcN" maxlength="3" inputmode="numeric" autocomplete="off" value="${esc(d.who.n)}"></label>
          <small>名前は入れません。組と番号だけ。</small></section>
        <section class="rc-sum" id="rcSum" aria-live="polite"></section>
        ${rec.LOCK[kind] ? `<section class="rc-lock" id="rcLock"></section>` : ''}
        <ol class="rc-items">${items.map(it => `<li class="rc-it${it.challenge ? ' is-ch' : ''}" data-no="${it.no}">
          <div class="rc-h">${lv(it)}<b>${esc(it.label)}</b>${it.pts ? `<span class="rc-pt">${it.pts}点</span>` : ''}${it.challenge ? '<span class="rc-pt">別枠</span>' : ''}</div>
          <div class="rc-q">${qHTML(it.text)}</div>
          <textarea class="rc-a" rows="1" placeholder="自分の答え（書かなくてもよい）" aria-label="${esc(it.label)}の自分の答え"></textarea>
          <div class="rc-ans" hidden><b>答え</b><div>${it.ans ? R.inl(it.ans) : '図や作図の問題です。答えは、教卓の解答で確かめよう。'}</div></div>
          <div class="rc-btns">
            <button type="button" class="rc-m m-o" data-m="o" aria-pressed="false"><b>○</b>できた</button>
            <button type="button" class="rc-m m-t" data-m="t" aria-pressed="false"><b>△</b>あやしい</button>
            <button type="button" class="rc-m m-x" data-m="x" aria-pressed="false"><b>×</b>むずかしい</button>
            <button type="button" class="rc-show" data-show>答えを見る</button>
          </div></li>`).join('')}</ol>
        <section class="rc-reflect"><label for="rcR"><b>ふり返り</b>　できるようになったこと・まだあやしいこと</label><textarea id="rcR" rows="2" maxlength="100"></textarea></section>
        <section class="rc-send"><b>先生に結果を送る</b>
          <label class="rc-chk"><input type="checkbox" id="rcSend"> 自分の答えも、いっしょに送る</label>
          <button type="button" class="rc-go" id="rcMake">結果コードをつくる</button>
          <div id="rcCodeBox" hidden><textarea id="rcCode" readonly rows="4"></textarea>
            <button type="button" class="rc-cp" id="rcCopy">コピーする</button><span id="rcCopied" class="rc-ok"></span>
            <p class="rc-note">このコードを、先生が決めた方法（Classroom など）で送ろう。送ったあとに答えあわせを直したら、もう一度つくって送りなおす。</p></div>
          <p class="rc-note">記録は、この端末の中にだけ残ります。<a href="#" id="rcClear">この記録を消してやり直す</a></p></section>
      </main></div>`;

    const root = app.firstElementChild, mk = it => root.querySelector(`.rc-it[data-no="${it.no}"]`);
    items.forEach(it => { mk(it).querySelector('.rc-a').value = S.ans[it.no] || ''; });
    $(root, '#rcR').value = S.refl || ''; $(root, '#rcSend').checked = S.send !== false;

    // いまの状態を画面に出す
    const refresh = () => {
      const lock = rec.LOCK[kind] && !S.open;
      let o = 0, t = 0, x = 0;
      items.forEach(it => {
        const m = S.marks[it.no], el = mk(it);
        if (m === 'o') o++; else if (m === 't') t++; else if (m === 'x') x++;
        el.querySelectorAll('.rc-m').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.m === m)));
        el.classList.toggle('is-marked', !!m);
        el.querySelector('.rc-show').hidden = lock;
        if (lock) el.querySelector('.rc-ans').hidden = true;
      });
      const left = items.length - o - t - x;
      $(root, '#rcSum').innerHTML = `<span class="s-o">○ ${o}</span><span class="s-t">△ ${t}</span><span class="s-x">× ${x}</span><span class="s-n">まだ ${left}</span>`
        + (kind === 'qz' ? `<span class="s-pt">得点の目安 <b>${rec.score(items, S.marks)}</b>／10<small>（正式な得点は、先生の採点）</small></span>` : '');
      const lk = $(root, '#rcLock');
      if (lk) lk.innerHTML = lock
        ? `<b>答えは、まだ見られません。</b>先生が「ひらく番号」を言ったら、ここに入れよう。<div class="rc-open"><input id="rcOpen" inputmode="numeric" maxlength="4" autocomplete="off" aria-label="ひらく番号"><button type="button" class="rc-go" id="rcOpenGo">ひらく</button><span id="rcOpenMsg" class="rc-ng"></span></div>`
        : '<b>答えをひらきました。</b>「答えを見る」で、答えあわせができます。';
      if (!$(root, '#rcCodeBox').hidden) makeCode();
    };
    const makeCode = () => {
      $(root, '#rcCode').value = rec.encode({ l: id, k: kind, g: d.who.g, n: d.who.n, marks: S.marks, ans: S.ans, refl: S.refl, sendAns: S.send !== false });
    };

    root.addEventListener('click', e => {
      const b = e.target.closest('button'), a = e.target.closest('a#rcClear');
      if (a) {
        e.preventDefault(); e.stopPropagation();
        if (confirm('この授業の、この記録（○△×・答え・ふり返り）を消します。よいですか？')) {
          delete d.sheets[id + '.' + kind]; save(); record(app, id, kind);
        }
        return;
      }
      if (!b) return;
      const li = b.closest('.rc-it');
      if (b.dataset.m && li) {
        const no = +li.dataset.no;
        if (S.marks[no] === b.dataset.m) delete S.marks[no]; else S.marks[no] = b.dataset.m;
        save(); refresh();
      } else if (b.hasAttribute('data-show') && li) {
        const ans = li.querySelector('.rc-ans');
        ans.hidden = !ans.hidden;
        b.textContent = ans.hidden ? '答えを見る' : '答えをかくす';
      } else if (b.id === 'rcOpenGo') {
        if (nfkc($(root, '#rcOpen').value) === rec.openCode(id)) { S.open = true; save(); refresh(); }
        else $(root, '#rcOpenMsg').textContent = '番号がちがいます';
      } else if (b.id === 'rcMake') {
        $(root, '#rcCodeBox').hidden = false; makeCode(); $(root, '#rcCode').select();
      } else if (b.id === 'rcCopy') {
        copyText($(root, '#rcCode').value, $(root, '#rcCode')).then(ok => { $(root, '#rcCopied').textContent = ok ? 'コピーしました' : 'コピーできませんでした。文字を長押しして、コピーしてね'; });
      }
    });
    root.addEventListener('input', e => {
      const t = e.target;
      if (t.classList.contains('rc-a')) { S.ans[t.closest('.rc-it').dataset.no] = t.value; save(); }
      else if (t.id === 'rcR') { S.refl = t.value; save(); }
      else if (t.id === 'rcG' || t.id === 'rcN') { d.who[t.id === 'rcG' ? 'g' : 'n'] = nfkc(t.value); save(); }
      else if (t.id === 'rcSend') { S.send = t.checked; save(); }
      else return;
      if (!$(root, '#rcCodeBox').hidden) makeCode();
    });
    root.addEventListener('change', e => { if (e.target.id === 'rcSend') { S.send = e.target.checked; save(); if (!$(root, '#rcCodeBox').hidden) makeCode(); } });
    refresh();
    return true;
  }

  /* ================= 生徒：単元の記録の一覧 ================= */
  function unit(app, key) {
    const u = IK.units.find(x => x.key === key), ls = u ? rec.lessons(key) : [];
    if (!u || !ls.length) return false;
    document.title = `${u.name}　記録`;
    const stat = (id, kind) => {
      const items = rec.items(id, kind);
      if (!items.length) return '';
      const S = hasSheet(id, kind) ? sheetOf(id, kind) : null, n = S ? items.filter(it => S.marks[it.no]).length : 0, o = S ? items.filter(it => S.marks[it.no] === 'o').length : 0;
      return `<a class="rc-lk${n ? ' is-on' : ''}" href="#/r/${esc(id)}/${kind}"><b>${esc(rec.KINDS[kind])}</b><span>${n ? `○ ${o}／${items.length}問${n < items.length ? `（あと ${items.length - n}問）` : ''}` : 'まだ'}</span></a>`;
    };
    app.innerHTML = `<div class="rc"><header class="rc-top"><div class="rc-ttl"><small>${esc(u.name)}</small><b>自分の記録</b></div></header>
      <main class="rc-main"><p class="rc-lead">演習と小テストの、○△×の記録です。ひらいて、つづきから記録できます。<br><small>記録は、この端末の中にだけ残ります。</small></p>
        <ol class="rc-ls">${ls.map(l => `<li><div class="rc-l"><small>${esc(l.no || '')}</small><b>${esc(l.title)}</b></div><div class="rc-lks">${stat(l.id, 'dr')}${stat(l.id, 'qz')}</div></li>`).join('')}</ol></main></div>`;
    return true;
  }

  /* ================= 先生：結果コードの集計・問題一覧 ================= */
  const SUMKEY = 'ikkan.rsum.v1';
  function sum(app) {
    document.title = '記録の集計（先生用）';
    let text = ''; try { text = localStorage.getItem(SUMKEY) || ''; } catch (e) { /* なし */ }
    const units = IK.qrUnits.filter(k => rec.lessons(k).length);
    const pct = v => (v == null ? '—' : Math.round(v * 100) + '%');
    app.innerHTML = `<header class="top"><a class="brand" href="#/">← 一覧</a><div class="ttl"><small>先生用</small><b>記録の集計</b></div></header>
      <div class="rs">
        <section class="rs-box"><h2>生徒の結果コードを貼りつける</h2>
          <p>生徒が送ってきた「結果コード」（IKR1. で始まる文字）を、ここに貼りつけます。何人ぶんでも、まとめて貼れます（コードのまわりに、ほかの文字があってもかまいません）。</p>
          <textarea id="rsIn" rows="6" placeholder="IKR1.eyJ2IjoxLC…"></textarea>
          <div class="rs-btns"><button type="button" class="btn main2" id="rsGo">集計する</button><button type="button" class="btn" id="rsClr">貼りつけた内容を消す</button>
            <button type="button" class="btn" id="rsCsv" disabled>結果を CSV でダウンロード</button></div>
          <p class="rs-msg" id="rsMsg"></p></section>
        <div id="rsOut"></div>
        <section class="rs-box"><h2>問題一覧（コツコツくんにつなぐとき用）</h2>
          <p>演習プリント・小テストの問題を、問題ID・レベル・配点・問題文・答えつきで書き出します。コツコツくんの問題と、問題IDで対応づけます。（問題文の <code>{{ }}</code> は空欄、<code>[[a/b]]</code> は分数です）</p>
          <div class="rs-btns">${units.map(k => `<button type="button" class="btn" data-cat="${esc(k)}">${esc((IK.units.find(u => u.key === k) || {}).name || k)}の問題一覧（JSON）</button>`).join('')}</div></section>
        <section class="rs-box"><h2>小テストの「ひらく番号」</h2>
          <p>小テストの記録ページでは、答えが隠れています。テストのあとで、この番号を生徒に伝えると、答えあわせができます。（演習の答えは、はじめから見られます）</p>
          ${units.map(k => `<div class="rs-codes">${rec.lessons(k).filter(l => IK.quizzes[l.id]).map(l => `<span><small>${esc(l.no || '')}</small> <b>${esc(rec.openCode(l.id))}</b></span>`).join('')}</div>`).join('')}</section>
      </div>`;
    const $in = $(app, '#rsIn'), $out = $(app, '#rsOut'), $msg = $(app, '#rsMsg'), $csv = $(app, '#rsCsv');
    $in.value = text;
    let parsed = null;

    const run = () => {
      try { localStorage.setItem(SUMKEY, $in.value); } catch (e) { /* なし */ }
      parsed = rec.parse($in.value);
      const groups = rec.summarize(parsed.recs);
      $csv.disabled = !parsed.recs.length;
      $msg.textContent = !$in.value.trim() ? '' : parsed.recs.length
        ? `${parsed.recs.length} 件のコードを読みました。${parsed.dup ? `（同じ人・同じ授業の、古いコード ${parsed.dup} 件は、数えていません）` : ''}${parsed.bad ? `　読めなかったコード：${parsed.bad} 件` : ''}`
        : `結果コードが見つかりませんでした。${parsed.bad ? `（読めなかったコード：${parsed.bad} 件）` : ''}`;
      $out.innerHTML = groups.map(g => {
        const l = IK.lessons[g.l] || { title: g.l }, n = g.rows.length;
        const stuRows = g.rows.slice().sort((a, b) => (a.g + '').localeCompare(b.g + '', 'ja') || (+a.n || 0) - (+b.n || 0));
        return `<section class="rs-box"><h2>${esc([l.no, l.title].filter(Boolean).join('　'))}　<span class="rs-kind">${esc(rec.KINDS[g.k])}</span><small>${n}人</small></h2>
          <div class="rs-tbl">${g.per.map(p => {
            const w = p.done ? p.c.o / n * 100 : 0, wt = p.c.t / n * 100, wx = p.c.x / n * 100;
            return `<details class="rs-q${p.rate != null && p.rate < 0.6 ? ' is-weak' : ''}"><summary>
              <span class="rs-no">${esc(p.it.label)}<i>${esc(p.it.level)}</i></span>
              <span class="rs-txt">${esc(String(p.it.text).replace(/\{\{|\}\}/g, '').replace(/\[\[([^\]\/]*)\/([^\]]*)\]\]/g, '$1分の$2').replace(/\n/g, ' ').slice(0, 44))}</span>
              <span class="rs-bar" title="○ ${p.c.o}　△ ${p.c.t}　× ${p.c.x}　未 ${p.c.none}"><i class="b-o" style="width:${w}%"></i><i class="b-t" style="width:${wt}%"></i><i class="b-x" style="width:${wx}%"></i></span>
              <span class="rs-pct">○ ${pct(p.rate)}</span></summary>
              <div class="rs-det"><p>○ ${p.c.o}人　△ ${p.c.t}人　× ${p.c.x}人　未入力 ${p.c.none}人</p>
                ${p.it.ans ? `<p class="rs-ans"><b>答え</b>　${esc(String(p.it.ans).replace(/\n/g, '　／　'))}</p>` : ''}
                ${p.answers.length ? `<ul>${p.answers.map(a => `<li>${esc(a.a)}<small>　${a.n}人（うち○ ${a.o}人）</small></li>`).join('')}</ul>` : '<p class="rs-none">（自分の答えは、送られていません）</p>'}</div></details>`;
          }).join('')}</div>
          <details class="rs-stu"><summary>生徒ごとの記録（${n}人）</summary>
            <table><thead><tr><th>組・番号</th>${g.per.map(p => `<th>${esc(p.it.label.replace(/[（）]/g, ''))}</th>`).join('')}${g.k === 'qz' ? '<th>得点の目安</th>' : ''}</tr></thead>
            <tbody>${stuRows.map(r => `<tr><th>${esc([r.g, r.n].filter(Boolean).join('－') || '（なし）')}</th>${g.per.map(p => { const m = r.marks[p.it.no]; return `<td class="m-${m || 'n'}">${m ? rec.MARKS[m] : '・'}</td>`; }).join('')}${g.k === 'qz' ? `<td>${rec.score(g.items, r.marks)}</td>` : ''}</tr>`).join('')}</tbody></table>
            ${stuRows.some(r => r.refl) ? `<ul class="rs-refl">${stuRows.filter(r => r.refl).map(r => `<li><b>${esc([r.g, r.n].filter(Boolean).join('－') || '（なし）')}</b>　${esc(r.refl)}</li>`).join('')}</ul>` : ''}</details></section>`;
      }).join('');
    };
    $(app, '#rsGo').onclick = run;
    $in.oninput = () => { try { localStorage.setItem(SUMKEY, $in.value); } catch (e) { /* なし */ } };
    $(app, '#rsClr').onclick = () => { $in.value = ''; run(); };
    $csv.onclick = () => { if (parsed && parsed.recs.length) download('kiroku.csv', rec.csv(parsed.recs), 'text/csv;charset=utf-8'); };
    app.querySelectorAll('[data-cat]').forEach(b => { b.onclick = () => download(`mondai-${b.dataset.cat}.json`, JSON.stringify(rec.catalog(b.dataset.cat), null, 1), 'application/json'); });
    if (text.trim()) run();
    return true;
  }

  IK.recui = { record, unit, sum };
})();
