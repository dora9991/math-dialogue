/* 操作デモ：「やりたいこと」のタグを押すと、見本の学校で、実際の画面の上でカーソルが動いて操作を見せる。
   デモの間は保存しない（試し箱）。終わったら、元のデータ・元の画面に戻る。 */
(function () {
  const K = window.K;
  const u = K.u;
  const m = K.m;
  const D = (K.demo = {});
  D.speed = Number(localStorage.getItem('kyomu-demo-speed') || 1); // 1＝ふつう、1.6＝ゆっくり、0.55＝はやく
  let R = null; // いま流れているデモ

  class Stop extends Error {}

  /* ---------- 画面の部品 ---------- */
  function layer() {
    let el = u.$('#demo-layer');
    if (el) return el;
    el = u.h(`<div id="demo-layer">
      <div class="dm-block"></div>
      <div class="dm-ring"></div>
      <div class="dm-ghost"></div>
      <div class="dm-cursor"><svg viewBox="0 0 24 24" width="26" height="26"><path d="M3 2l7.5 19 2.6-7.9L21 10.5z" fill="#fff" stroke="#111" stroke-width="1.6" stroke-linejoin="round"/></svg><span class="dm-click"></span></div>
      <div class="dm-card" role="status" aria-live="polite">
        <div class="dm-tag"></div>
        <div class="dm-text"></div>
        <div class="dm-foot">
          <span class="dm-prog"></span>
          <span style="flex:1"></span>
          <button data-dm="pause">一時停止</button>
          <select data-dm="speed" title="速さ"><option value="1.6">ゆっくり</option><option value="1">ふつう</option><option value="0.55">はやく</option></select>
          <button data-dm="stop">やめる</button>
        </div>
      </div>
    </div>`);
    document.body.appendChild(el);
    el.querySelector('[data-dm="speed"]').value = String(D.speed);
    el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-dm]');
      if (!b || !R) return;
      if (b.dataset.dm === 'pause') {
        R.paused = !R.paused;
        b.textContent = R.paused ? '再生' : '一時停止';
      }
      if (b.dataset.dm === 'stop') D.stop();
      if (b.dataset.dm === 'again') D.play(R.id);
      if (b.dataset.dm === 'others') {
        D.stop();
        D.panel();
      }
      if (b.dataset.dm === 'next' && R.next) D.play(R.next);
    });
    el.querySelector('[data-dm="speed"]').addEventListener('change', (e) => {
      D.speed = Number(e.target.value);
      localStorage.setItem('kyomu-demo-speed', D.speed);
    });
    return el;
  }

  /* ---------- 動かす道具 ---------- */
  const H = {};
  H.sleep = async (ms) => {
    const end = Date.now() + ms * D.speed;
    while (Date.now() < end || (R && R.paused)) {
      if (!R || R.stopped) throw new Stop();
      await new Promise((r) => setTimeout(r, 40));
    }
    if (!R || R.stopped) throw new Stop();
  };
  H.read = (text) => H.sleep(1400 + String(text).length * 55);

  // 要素を待って探す（セレクタか、要素を返す関数）
  H.find = async (target, ms) => {
    const end = Date.now() + (ms || 5000);
    for (;;) {
      if (!R || R.stopped) throw new Stop();
      const el = typeof target === 'function' ? target() : u.$(target);
      if (el && el.getClientRects().length) return el;
      if (Date.now() > end) throw new Error('デモの相手が見つかりませんでした：' + (typeof target === 'string' ? target : '（コマ）'));
      await new Promise((r) => setTimeout(r, 60));
    }
  };

  function inView(el) {
    const r = el.getBoundingClientRect();
    return r.top >= 60 && r.bottom <= window.innerHeight - 150 && r.left >= 0 && r.right <= window.innerWidth;
  }
  H.show = async (el) => {
    if (!inView(el)) {
      el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: D.speed < 0.2 ? 'auto' : 'smooth' });
      await H.sleep(450);
    }
  };

  let cx = window.innerWidth / 2;
  let cy = window.innerHeight / 2;
  function placeCursor(x, y, dur) {
    const c = u.$('#demo-layer .dm-cursor');
    c.style.transitionDuration = `${Math.max(0, dur)}ms`;
    c.style.transform = `translate(${x - 4}px, ${y - 3}px)`;
    cx = x;
    cy = y;
  }
  function ring(el) {
    const rg = u.$('#demo-layer .dm-ring');
    if (!el) {
      rg.style.opacity = 0;
      return;
    }
    const r = el.getBoundingClientRect();
    rg.style.opacity = 1;
    rg.style.left = `${r.left - 4}px`;
    rg.style.top = `${r.top - 4}px`;
    rg.style.width = `${r.width + 8}px`;
    rg.style.height = `${r.height + 8}px`;
    // 説明の札が、光らせたところに重ならないように
    const card = u.$('#demo-layer .dm-card');
    card.classList.toggle('top', r.top + r.height / 2 > window.innerHeight * 0.55);
  }
  H.move = async (el) => {
    await H.show(el);
    const r = el.getBoundingClientRect();
    const x = r.left + Math.min(r.width / 2, r.width - 6);
    const y = r.top + Math.min(r.height / 2, 14);
    const dist = Math.hypot(x - cx, y - cy);
    const dur = Math.min(900, 250 + dist * 0.7) * D.speed;
    placeCursor(x, y, dur);
    ring(el);
    await H.sleep(Math.min(900, 250 + dist * 0.7) + 120);
    return el;
  };
  const pulse = async () => {
    const c = u.$('#demo-layer .dm-click');
    c.classList.remove('go');
    void c.offsetWidth;
    c.classList.add('go');
    await H.sleep(260);
  };
  H.click = async (target, opts) => {
    const el = await H.move(await H.find(target));
    await pulse();
    const o = opts || {};
    if (el.matches('input[type=checkbox],input[type=radio],button,a,label') && !o.shift && !o.ctrl) el.click();
    else el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window, shiftKey: !!o.shift, ctrlKey: !!o.ctrl }));
    await H.sleep(o.wait != null ? o.wait : 380);
    return el;
  };
  H.select = async (target, value) => {
    const el = await H.move(await H.find(target));
    await pulse();
    el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    await H.sleep(380);
    return el;
  };
  H.type = async (target, text, opts) => {
    const el = await H.move(await H.find(target));
    await pulse();
    el.focus();
    if (!opts || opts.clear !== false) el.value = '';
    for (const ch of String(text)) {
      el.value += ch;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      await H.sleep(ch === '\n' ? 160 : 55);
    }
    el.dispatchEvent(new Event('change', { bubbles: true }));
    await H.sleep(250);
    return el;
  };
  H.setDate = async (target, value) => H.select(target, value);
  // ドラッグ（つかんで運んで、落とす）
  H.drag = async (from, to) => {
    const a = await H.move(await H.find(from));
    const ghost = u.$('#demo-layer .dm-ghost');
    ghost.textContent = (a.textContent || '').trim() || '空き';
    const ra = a.getBoundingClientRect();
    ghost.style.transitionDuration = '0ms';
    ghost.style.transform = `translate(${ra.left + ra.width / 2 - 14}px, ${ra.top + ra.height / 2 - 12}px)`;
    ghost.style.opacity = 1;
    u.$('#demo-layer .dm-cursor').classList.add('grab');
    const dt = typeof DataTransfer === 'function' ? new DataTransfer() : null;
    a.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer: dt }));
    await H.sleep(250);
    const b = await H.find(to);
    await H.show(b);
    const rb = b.getBoundingClientRect();
    const dur = 900 * D.speed;
    ghost.style.transitionDuration = `${dur}ms`;
    ghost.style.transform = `translate(${rb.left + rb.width / 2 - 14}px, ${rb.top + rb.height / 2 - 12}px)`;
    placeCursor(rb.left + rb.width / 2, rb.top + rb.height / 2, dur);
    ring(b);
    await H.sleep(950);
    b.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: dt }));
    await H.sleep(150);
    b.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }));
    a.dispatchEvent(new DragEvent('dragend', { bubbles: true, dataTransfer: dt }));
    ghost.style.opacity = 0;
    u.$('#demo-layer .dm-cursor').classList.remove('grab');
    await H.sleep(450);
  };
  // 説明を出して、読む時間だけ待つ
  H.say = async (text, opts) => {
    const t = u.$('#demo-layer .dm-text');
    t.innerHTML = u.esc(text).replace(/「([^」]+)」/g, '「<b>$1</b>」');
    R.n++;
    u.$('#demo-layer .dm-prog').textContent = `${Math.min(R.n, R.total)} / ${R.total}`;
    if (!opts || !opts.nowait) await H.read(text);
  };
  H.point = async (target, text) => {
    const el = await H.move(await H.find(target));
    if (text) await H.say(text);
    return el;
  };
  H.go = async (view, ...p) => {
    ring(null);
    K.app.go(view, ...p);
    await H.sleep(500);
    window.scrollTo(0, 0);
  };
  H.okModal = async () => {
    const btns = u.$$('.modal-back .modal [data-ok]');
    if (btns.length) await H.click(() => btns[btns.length - 1]);
  };
  H.closeModals = () => u.$$('.modal-back').forEach((x) => x.remove());
  H.text = async (target) => ((await H.find(target)).textContent || '').trim();

  /* ---------- 見本の週のコマを指す ---------- */
  const W = {};
  W.day = (i) => u.add(W.mon, i);
  // 週のシートのコマ（i：月=0…金=4、s：校時、c：クラス）
  W.cell = (i, s, c) => () => u.$$(`#main .xs td.c[data-d="${W.day(i)}"][data-s="${s}"]`).find((td) => td.dataset.c.split(',').includes(c));
  W.stLine = (i, s) => () => {
    const lay = m.day(W.day(i)).layout;
    return u.$(`#main .xs td.st[data-d="${W.day(i)}"][data-r="${lay.indexOf(s) + 1}"]`);
  };
  W.evLine = (i, r) => () => u.$(`#main .xs td.ev[data-d="${W.day(i)}"][data-r="${r}"]`);
  W.baseCell = (wd, s, c) => () => u.$$(`#main .xs td.c[data-wd="${wd}"][data-s="${s}"]`).find((td) => td.dataset.c.split(',').includes(c));
  W.subj = (i, s, c) => m.cell(W.day(i), s, c).t;
  // 入れ替えの相手：同じクラスで、ちがう教科・ふつうの授業のコマ（道・総・学などはさける）
  W.partner = (i0, s0, c, fromDay) => {
    const t0 = W.subj(i0, s0, c);
    const fixed = ['道', '総', '学', 'C', '読書', ''];
    for (let i = fromDay == null ? i0 + 1 : fromDay; i < 5; i++)
      for (const s of ['4', '2', '5', '3', '1', '6']) {
        const t = W.subj(i, s, c);
        if (t !== t0 && !fixed.includes(t) && !(i === i0 && s === s0)) return { i, s };
      }
    return { i: Math.min(4, i0 + 1), s: '4' };
  };
  const WDN = (i) => u.WD[u.dow(W.day(i))];

  /* ---------- デモの台本（やりたいこと） ---------- */
  const S = [];
  // 説明の数（進み具合の表示用）は、台本の中の say と、文つきの point を数える
  const countSteps = (fn) => {
    const src = fn.toString();
    return (src.match(/h\.say\(/g) || []).length + (src.match(/h\.point\([^;]*?,\s*[`'"]/g) || []).length;
  };
  const add = (group, id, title, desc, steps) => S.push({ group, id, title, desc, steps, total: countSteps(steps) });

  add('週の時間割を変える', 'swap', '授業を入れ替えたい', 'コマをドラッグして入れ替え。記録が残る', async (h) => {
    await h.go('week', W.mon);
    await h.say('週行事の画面です。今の Excel の週案と同じ形で、そのまま印刷できます。');
    const p = W.partner(1, '2', '1-1', 3);
    const a = W.subj(1, '2', '1-1');
    const b = W.subj(p.i, p.s, '1-1');
    await h.point(W.cell(1, '2', '1-1'), `1-1 の${WDN(1)}曜2限「${a}」を…`);
    await h.say(`${WDN(p.i)}曜${p.s}限の「${b}」と入れ替えます。コマをつかんで、相手のコマまでドラッグします。`, { nowait: true });
    await h.drag(W.cell(1, '2', '1-1'), W.cell(p.i, p.s, '1-1'));
    await h.point(W.cell(p.i, p.s, '1-1'), '入れ替わりました。変えたコマは黄色になります（印刷にも出ます。消すこともできます）。');
    await h.point('.side .logs li', '右の「この週の変更の記録」に、何と何を入れ替えたかが残ります。');
    await h.point(W.stLine(1, '2'), '「出張等」の欄にも「1-1○は△日分」と、今の Excel と同じ書き方で自動で入ります。');
    await h.point('[data-act="copy"]', '「お知らせ文をコピー」で、変更の一覧をメールや日報に貼りつけられます。');
  });

  add('週の時間割を変える', 'cand', '入れ替えられるコマを探したい', '先生が空いているコマが緑に光る', async (h) => {
    await h.go('week', W.mon);
    await h.say('入れ替えたいコマをクリックで選びます。');
    await h.click(W.cell(2, '3', '2-1'));
    await h.point('#main .xs td.cand-ok', '担当表が入っていると、入れ替えても先生がぶつからないコマが緑に光ります（ぶつかるコマは斜線）。');
    await h.click('.side [data-act="swap"]');
    await h.say('「⇄ 入れ替え」を押して（キーの S でも）、緑のコマをクリックします。', { nowait: true });
    await h.click('#main .xs td.cand-ok');
    await h.point('.side .logs li', '入れ替わって、記録が残りました。');
  });

  add('週の時間割を変える', 'set', '1コマだけ別の教科にしたい', '時間数調整・○日分の補充・自習', async (h) => {
    await h.go('week', W.mon);
    const cur = W.subj(0, '5', '1-2');
    const to = ['国', '数', '英'].find((x) => x !== cur);
    await h.click(W.cell(0, '5', '1-2'));
    await h.say(`${WDN(0)}曜5限の 1-2「${cur}」を選びました。右に、教科のボタンが出ます。`);
    await h.select('.side [data-ui="why"]', 'adjust');
    await h.say('「出張等」の欄に残す文の書き方を選べます（○→○／時間数調整／○日分の補充／自由に書く）。');
    await h.click(`.side .grid-btn [data-set="${to}"]`);
    await h.point(W.cell(0, '5', '1-2'), `「${to}」になりました。手で変えたコマは橙色。`);
    await h.point(W.stLine(0, '5'), `出張等の欄に「1-2${to}は時間数調整」と入りました。`);
    await h.say('ダブルクリックすると、教科以外の文字（学年集会など）も直接書けます。');
  });

  add('週の時間割を変える', 'undo', '変更を取り消したい', '記録から1つずつ戻す・Ctrl+Z', async (h) => {
    await h.go('week', W.mon);
    await h.say('まず、試しに入れ替えをしてみます。', { nowait: true });
    const p = W.partner(4, '1', '3-1', 4);
    await h.drag(W.cell(4, '1', '3-1'), W.cell(p.i, p.s, '3-1'));
    await h.point('.side .logs li', '記録が残っています。');
    await h.click('.side .logs li [data-logact="revert"]');
    await h.point(W.cell(4, '1', '3-1'), '「取り消す」で、その入れ替えだけ元に戻りました（記録も消えます）。');
    await h.point('[data-top="undo"]', '直前の操作は「戻す」（Ctrl+Z）でも戻せます。「記録だけ消す」と、変更はそのままで記録の文だけ消えます。');
  });

  add('週の時間割を変える', 'merge', '学年で1くくりにしたい', '学年集会・学年取扱などを1つの枠に', async (h) => {
    await h.go('week', W.mon);
    await h.click(W.cell(2, '6', '3-1'));
    await h.say('3-1 のコマを選んで、右の「3年でまとめる」を押します。');
    await h.click('.side [data-merge="grade"]');
    await h.type('.modal [data-ask]', '学年集会');
    await h.okModal();
    await h.point(W.cell(2, '6', '3-2'), '3年の3クラスが、1つの枠になりました（Excel のセルの結合と同じ見た目）。');
    await h.say('「全校でまとめる」や、Shift で横に選んでから「選んだクラスで」もできます。まとめを解除するボタンもあります。');
  });

  add('行事', 'event', '行事を入れて、時間割を自動で埋めたい', '学年と校時を入れると、その時間が行事に', async (h) => {
    await h.go('week', W.mon);
    await h.click('[data-act="addev"]');
    await h.type('.modal [data-f="title"]', '職場体験事前指導');
    await h.setDate('.modal [data-f="date"]', W.day(3));
    await h.click('.modal [data-tg="g2"]');
    await h.say('だれが：2年。時間：5〜6校時。', { nowait: true });
    await h.select('.modal [data-f="from"]', '5');
    await h.select('.modal [data-f="to"]', '6');
    await h.select('.modal [data-f="countAs"]', '総');
    await h.point('.modal [data-pv]', '「総合として数える」にしました。ここに、この行事で何コマ埋まり、どの授業が減るかが出ます。');
    await h.okModal();
    await h.sleep(300);
    if (u.$$('.modal-back').length) await h.okModal();
    await h.point(W.cell(3, '5', '2-1'), '2年の5・6校時が、学年ひとくくりで自動で埋まりました。時数も「総」として数えなおされます。');
    await h.point(W.evLine(3, 6), '行事欄にも出ます。年間行事・月行事にも同じ行事が出ます（1つのデータなので、どこで直しても全部にそろう）。');
    await h.go('month', W.day(3).slice(0, 7));
    await h.point(() => u.$(`#main tr[data-d="${W.day(3)}"] td.evs`), '月行事に出ています。■ がついているのは、時間割を埋める行事です。');
  });

  add('行事', 'bulk', '行事をまとめて入れたい', '1行に1つ。Excel から貼りつけても', async (h) => {
    await h.go('year');
    await h.say('年間行事の画面です。日が縦、月が横の 1 枚の表です。');
    await h.click('[data-act="bulk"]');
    const y = m.st.school.year;
    const d1 = u.md(W.day(1));
    const d3 = u.md(W.day(3));
    const lines = [`${d1} 全校 6校時 生徒総会`, `${d3} 1年 5-6校時 校外学習事前指導 #総`, `${u.md(u.add(W.mon, 7))} 休 開校記念日`, `職員: ${d1} ④ 教務会議 山田、鈴木`];
    await h.type('.modal textarea[data-b]', lines.join('\n'));
    await h.point('.modal [data-pv]', '日付 → 対象 → 校時 → 名前 の順に読み取って、下にならべて見せます（#総 は「総合として数える」）。');
    await h.okModal();
    await h.point(() => u.$(`#main td.cell[data-d="${W.day(1)}"]`), `年間行事に入りました。週行事の時間割も、その時間が自動で埋まります（${y}年度）。`);
  });

  add('行事', 'swapday', '曜日を振りかえたい（○曜校時）', '「木曜を火曜の時間割で」など', async (h) => {
    await h.go('week', W.mon);
    await h.click('[data-act="addev"]');
    await h.select('.modal [data-f="kind"]', 'swap');
    await h.setDate('.modal [data-f="date"]', W.day(4));
    await h.select('.modal [data-f="swapWd"]', '1');
    await h.point('.modal [data-pv]', `${WDN(4)}曜日を「月曜校時」にします。`);
    await h.okModal();
    await h.point(W.cell(4, '1', '1-1'), `${WDN(4)}曜日が、月曜日の時間割に変わりました。行事欄には「月曜校時」と出ます。`);
  });

  add('行事', 'short', '短縮日課にしたい（○校時まで）', '三者面談など。後ろの校時は数えない', async (h) => {
    await h.go('week', W.mon);
    await h.click('[data-act="addev"]');
    await h.select('.modal [data-f="kind"]', 'short');
    await h.type('.modal [data-f="title"]', '三者面談');
    await h.setDate('.modal [data-f="date"]', W.day(1));
    await h.setDate('.modal [data-f="end"]', W.day(2));
    await h.select('.modal [data-f="upTo"]', '4');
    await h.okModal();
    await h.point(W.cell(1, '5', '1-1'), '2日間、5校時からあとが空になりました。時数にも数えません。');
    await h.say('1日だけなら、週行事の校時の数字をクリックして「この校時は授業なし」でもできます。');
  });

  add('行事', 'staff', '出張・会議を入れたい', '先生の名前を書くと、その先生の授業に注意', async (h) => {
    await h.go('week', W.mon);
    const who = m.teachersOf('1-1', W.subj(0, '1', '1-1'))[0] || '山田';
    await h.click('[data-act="addstaff"]');
    await h.type('.modal [data-f="title"]', '出張');
    await h.setDate('.modal [data-f="date"]', W.day(0));
    await h.type('.modal [data-f="who"]', who);
    await h.select('.modal [data-f="from"]', 'all');
    await h.okModal();
    await h.point(W.stLine(0, '1'), `出張等の欄に「出張 ${who}」と出ました。`);
    await h.point('#main .xs td.issue', `${who}先生の授業に赤い枠がつきます。コマを選ぶと、右に「不在」と出ます。自習や入れ替えを考える目印に。`);
  });

  add('行事', 'calendar', '月行事・年間行事を見たい', '同じ行事が月・年・週にそろって出る', async (h) => {
    await h.go('month', W.mon.slice(0, 7));
    await h.say('月行事：1日1行。行事・職員の予定・授業日。下に授業日数。');
    await h.click(() => u.$(`#main tr[data-d="${W.day(2)}"] td.evs[data-add="event"]`));
    await h.say('あいているところをクリックすると、その日に行事を追加できます。', { nowait: true });
    await h.click('.modal [data-close]');
    await h.go('year');
    await h.point('#main table.yr', '年間行事：4月〜3月を1枚に。A4横（A3にも）で印刷できます。');
    await h.point('#main table.yr tr.tot', 'いちばん下に、月ごとの授業日数。年間・期間ごとの合計も出ます。');
  });

  add('時数', 'hours', '時数を確かめたい', '累計・見込み・計画との差・学年内の差', async (h) => {
    await h.go('week', W.mon);
    await h.point('#main [data-cnt="week"]', '週行事の下に、その週のクラスごと・教科ごとの時数が自動で出ます。');
    await h.click('#main [data-cnt="cum"]');
    await h.say('「累計」で、年度のはじめからこの週までの合計に。');
    await h.go('hours');
    await h.click('#main [data-mode="gap"]');
    await h.point('#main table.cnt td.gap1, #main table.cnt td.gap2', '「学年内の差」：同じ学年でいちばん多いクラスとの差。橙のクラスは時間数の調整が必要かもしれません。');
    await h.click('#main [data-mode="diff"]');
    await h.say('「見込み − 計画」：これからの週は基本時間割と行事から計算した見込み。赤は計画より少ない、青は多い。');
  });

  add('準備', 'base', '基本時間割をつくりたい・直したい', '期間ごと（1学期・2学期前期…）', async (h) => {
    await h.go('base', 't1');
    await h.say('基本時間割：1学期・2学期前期・2学期後期・3学期後期ごとにつくります（上のボタンで切りかえ）。');
    await h.click(W.baseCell(2, '3', '1-1'));
    await h.click('.side .grid-btn [data-set="数"]');
    await h.say('コマを選んで、右の教科のボタンを押すと入ります。', { nowait: true });
    const bc = (wd, s) => (m.base('t1').cells[`${wd}|${s}|1-1`] || {}).t;
    const s2 = ['2', '1', '5', '4', '6'].find((s) => bc(3, s) !== bc(2, '4') && !['道', '総', '学'].includes(bc(3, s))) || '2';
    await h.drag(W.baseCell(2, '4', '1-1'), W.baseCell(3, s2, '1-1'));
    await h.say('ドラッグで入れ替えもできます。');
    await h.point('#main table.cnt', '下に、この基本時間割の週の時数（クラス×教科）。');
    await h.point('#main [data-copy]', 'ほかの期間からコピーして、ちがうところだけ直せます。');
  });

  add('準備', 'teachers', '空いている先生を探したい', '担当表・全員の空き時間・先生ごと', async (h) => {
    await h.go('teachers');
    await h.say('「全員の週」：先生×時間の一覧。空いているマスは授業なし。自習監督や代わりの先生を探すときに。');
    await h.click('#main a[data-who]');
    await h.say('先生の名前を押すと、その先生の週の時間割。');
    await h.click('#main [data-tab2="assign"]');
    await h.point('#main [data-t]', '担当表：クラス×教科ごとに先生の名前。Excel の表をコピーして貼りつけることもできます。');
  });

  add('準備', 'import', '今の Excel から取り込みたい', '週行事の .xlsx をそのまま', async (h) => {
    await h.go('settings', 'import');
    await h.point('#main label.btn:has([data-files])', 'ここで、今の週行事の Excel を選びます（1学期・2学期のファイルをまとめて選べます）。');
    await h.say('基本時間割（R8の前期・後期）、週のシート（時間割・行事欄・出張等・結合・色・吹き出し）を読み取ります。');
    await h.say('ファイルはこのパソコンのブラウザの中で読むだけで、どこにも送りません。');
  });

  add('印刷・保存', 'print', '印刷・PDFにしたい', 'Excel と同じ形で A4 縦1枚', async (h) => {
    await h.go('week', W.mon);
    await h.click('[data-act="print"]');
    await h.click('.modal input[name="rng"][value="many"]');
    await h.say('この週だけ／第○週〜第○週をまとめて。出張等の欄・変更の色を入れるかも選べます。', { nowait: true });
    await h.click('.modal [data-go]');
    await h.point('.dm-preview .page', 'Excel と同じ形で、1週＝A4縦1枚になります。');
    await h.say('PDF にするときは、印刷の画面の送信先で「PDF に保存」を選びます（デモでは印刷の画面のかわりに見本を出しています）。');
    H.closeModals();
  });

  add('印刷・保存', 'backup', 'バックアップしたい・別のパソコンに移したい', 'JSON に書き出す・戻す', async (h) => {
    await h.point('[data-top="backup"]', '入力した内容は、このブラウザに自動で保存されています。もしものために「バックアップ」でファイルにも残しておきます（週に1回くらい）。');
    await h.say('はじめて押したときに保存先のフォルダ（OneDrive など）を選んでおくと、次からはボタン一つで、そのフォルダのファイルに上書き保存されます。');
    await h.go('settings');
    if (u.$('#main [data-act="bk-choose"]')) await h.point('#main [data-act="bk-choose"]', '保存先のフォルダは、ここで変えたり、そのフォルダのバックアップから戻したりできます。日付つきのファイルも残す設定もあります。');
    await h.point('#main label.btn:has([data-restore])', '別のパソコンでは「バックアップから戻す」でそのファイルを読みこめば、同じ状態になります。');
  });

  // 通しで見る
  const TOUR = ['swap', 'event', 'set', 'hours', 'print'];

  /* ---------- 印刷はデモの中では見本を見せる ---------- */
  function preview(pages, land) {
    const md = u.modal(`<h3>印刷の見本</h3><div class="dm-preview ${land ? 'land' : ''}">${pages.join('')}</div><div class="btns"><button class="btn" data-close>閉じる</button></div>`, { wide: true, noFocus: true });
    K.sheet.fitPages(md.el);
  }

  /* ---------- 流す・止める ---------- */
  D.active = () => !!R;
  D.play = async (id, chain) => {
    const sc = S.find((x) => x.id === id);
    if (!sc) return;
    if (R) {
      R.stopped = true;
      await new Promise((r) => setTimeout(r, 80));
    }
    const first = !K.store.inSandbox();
    if (first) D.origHash = location.hash;
    H.closeModals();
    K.store.sandbox(true);
    K.store.load2(K.demoData.make(m.st.school.year || u.fy(u.today())));
    W.mon = K.demoData.week();
    const el = layer();
    el.classList.add('on');
    document.body.classList.add('demo-on');
    el.querySelector('.dm-tag').textContent = `▶ ${sc.title}`;
    el.querySelector('.dm-foot').classList.remove('done');
    el.querySelector('[data-dm="pause"]').textContent = '一時停止';
    if (K.views.week.resetUi) K.views.week.resetUi();
    const me = (R = { id, n: 0, total: sc.total, paused: false, stopped: false, chain: chain || null });
    try {
      await sc.steps(H);
      if (me !== R) return;
      const next = chain && chain.length ? chain[0] : null;
      R.next = next;
      ring(null);
      el.querySelector('.dm-text').innerHTML = next ? 'つづきを流します…' : 'デモはここまでです。このまま見本の学校を<b>さわってみてもOK</b>（保存されません）。「閉じる」で元のデータに戻ります。';
      R.n = R.total;
      el.querySelector('.dm-prog').textContent = '';
      if (next) {
        await H.sleep(1200);
        return D.play(next, chain.slice(1));
      }
      done(el);
    } catch (e) {
      if (me !== R) return;
      if (!(e instanceof Stop)) {
        console.warn(e);
        el.querySelector('.dm-text').textContent = 'デモをうまく進められませんでした。画面の大きさを変えて、もう一度ためしてください。';
        done(el);
      }
    }
  };
  function done(el) {
    if (R) R.done = true;
    const foot = el.querySelector('.dm-foot');
    foot.classList.add('done');
    foot.innerHTML = `<span class="dm-prog"></span><span style="flex:1"></span><button data-dm="again">もう一度</button><button data-dm="others">ほかのデモ</button><button data-dm="stop" class="pri">閉じる</button>`;
    u.$('#demo-layer .dm-block').classList.add('off');
  }
  D.stop = () => {
    if (!R) return;
    R.stopped = true;
    R = null;
    const el = u.$('#demo-layer');
    if (el) el.remove();
    document.body.classList.remove('demo-on');
    H.closeModals();
    K.store.sandbox(false);
    if (K.views.week.resetUi) K.views.week.resetUi(true);
    if (D.origHash != null && location.hash !== D.origHash) location.hash = D.origHash;
    else K.app.refresh();
    D.origHash = null;
    u.toast('デモを終わりました。データは元のままです');
    if (K.app.needsWelcome && K.app.needsWelcome()) setTimeout(() => K.app.welcome(), 300);
  };

  // デモ中は、人のキー操作を止める（Esc でデモを終わる）
  window.addEventListener(
    'keydown',
    (e) => {
      if (!R || !e.isTrusted || R.done) return;
      if (e.target.closest && e.target.closest('#demo-layer')) return;
      e.stopPropagation();
      e.preventDefault();
      if (e.key === 'Escape') D.stop();
      if (e.key === ' ') {
        R.paused = !R.paused;
        const b = u.$('#demo-layer [data-dm="pause"]');
        if (b) b.textContent = R.paused ? '再生' : '一時停止';
      }
    },
    true
  );

  /* ---------- やりたいことのタグ ---------- */
  D.list = () => S.map(({ id, group, title, desc }) => ({ id, group, title, desc }));
  D.panel = () => {
    const groups = [...new Set(S.map((x) => x.group))];
    const md = u.modal(
      `<h2>やりたいことから選ぶ</h2>
      <p class="help">タグを押すと、見本の学校（見本中学校）で、実際の画面の上で操作のデモが流れます。<b>あなたのデータは変わりません</b>。とちゅうで「一時停止」「やめる」（Esc）、速さも変えられます。</p>
      <div class="row" style="margin:6px 0 12px"><button class="btn primary" data-demo-tour>▶ 通しで見る（約2〜3分：入れ替え → 行事 → 1コマ変更 → 時数 → 印刷）</button></div>
      ${groups
        .map(
          (g) => `<h3 style="margin-top:10px">${u.esc(g)}</h3><div class="tags">${S.filter((x) => x.group === g)
            .map((x) => `<button class="tag" data-demo="${x.id}" title="${u.esc(x.desc)}"><span class="pl">▶</span>${u.esc(x.title)}<small>${u.esc(x.desc)}</small></button>`)
            .join('')}</div>`
        )
        .join('')}
      <div class="btns"><button class="btn" data-close>閉じる</button></div>`,
      { wide: true, noFocus: true }
    );
    md.el.addEventListener('click', (e) => {
      const t = e.target.closest('[data-demo]');
      if (t) {
        md.close();
        D.play(t.dataset.demo);
      }
      if (e.target.closest('[data-demo-tour]')) {
        md.close();
        D.play(TOUR[0], TOUR.slice(1));
      }
    });
  };

  // 印刷：デモの中では印刷の画面のかわりに見本を出す
  const run0 = K.print.run;
  K.print.run = (pages, land) => (R ? preview(pages, land) : run0(pages, land));
})();
