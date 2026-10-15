/* 指導案メーカー：はじめての人むけの案内（画面の場所を順に光らせて、ひとことずつ説明する） */
(function () {
  const SD = window.SD;
  const UI = SD.ui;
  const { h } = UI;

  // 見つからない場所はとばす（せまい画面では文例が隠れている など）
  const STEPS = [
    { sel: '#edOutline', title: '指導案の項目', text: 'チェックを外すと指導案から外れます。⋮⋮ をドラッグで順番を変えられます。下の「使っていない項目」をクリックすると足せます。●は書けた項目、○はまだ空の項目です。' },
    { sel: '#setBar', title: '授業', text: '学年・単元・本時です。‹ › で前後の時間に移ると、その時間の下書きに入れかえることもできます。' },
    { sel: '#edCards .card:not(.k-header)', title: 'カード', text: '欄をクリックして書きます。見出しの言葉も書きかえられます。∨ でたたむと短くなります。' },
    { sel: '#edSide', alt: '.tb-side', title: '文例', text: '欄をクリックすると、その欄に合う文例がここに出ます。クリックで入ります。書いている途中にも候補が出るので、Tab で入れられます。「〇」は選んだ状態で入るので、そのまま打てば書きかわります。' },
    { sel: '.tb-mode', title: '仕上がりを見る', text: '「並べて」で、書きながら右に印刷の形を出せます。「印刷イメージ」では A4 で何ページになるかもわかります。' },
    { sel: '#tbCheck', alt: '.tb-more', title: '点検', text: '書き忘れ・「〇〇」の残り・時間の合計などを点検します。左上の「次へ」でも、まだ書けていない項目に順にとべます（⌘J）。' },
    { sel: '#topbar .btn.primary', title: '出力', text: 'Word・PDF・書式つきコピーで出せます。書いたものは自動で保存されます。' },
  ];

  const visible = (el) => { if (!el) return false; const r = el.getBoundingClientRect(); return r.width > 4 && r.height > 4 && r.right > 0 && r.left < window.innerWidth && getComputedStyle(el).visibility !== 'hidden'; };

  SD.tour = (attempt = 0) => {
    if (SD.S.view !== 'edit' || document.querySelector('.tour')) return;
    const steps = STEPS.map((st) => {
      let el = document.querySelector(st.sel);
      if (!visible(el) && st.alt) el = document.querySelector(st.alt);
      return visible(el) ? Object.assign({ el }, st) : null;
    }).filter(Boolean);
    // 画面がまだ描けていないときは、少し待ってからもう一度（6回まで）
    if (steps.length < 3) { if (attempt < 6) setTimeout(() => SD.tour(attempt + 1), 500); return; }
    let i = 0;
    const hole = h('div', { class: 'tour-hole' });
    const tip = h('div', { class: 'tour-tip', role: 'dialog', 'aria-live': 'polite' });
    const wrap = h('div', { class: 'tour' }, hole, tip);
    document.body.append(wrap);
    const end = () => { wrap.remove(); document.removeEventListener('keydown', onKey, true); window.removeEventListener('resize', place); SD.setPrefs({ tourDone: true }); };
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); end(); }
      if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); next(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); if (i > 0) { i -= 1; place(); } }
    };
    const next = () => { if (i < steps.length - 1) { i += 1; place(); } else end(); };
    function place() {
      const st = steps[i];
      const r = st.el.getBoundingClientRect();
      const pad = 6;
      const top = Math.max(4, r.top - pad); const left = Math.max(4, r.left - pad);
      const w = Math.min(window.innerWidth - left - 4, r.width + pad * 2); const hh = Math.min(window.innerHeight - top - 4, r.height + pad * 2);
      Object.assign(hole.style, { top: `${top}px`, left: `${left}px`, width: `${w}px`, height: `${hh}px` });
      tip.innerHTML = '';
      tip.append(
        h('div', { class: 'tour-n' }, `${i + 1}／${steps.length}`),
        h('h3', null, st.title),
        h('p', null, st.text),
        h('div', { class: 'tour-acts' },
          h('button', { type: 'button', class: 'btn sm ghost', onClick: end }, 'スキップ'),
          h('span', { class: 'grow' }),
          i > 0 ? h('button', { type: 'button', class: 'btn sm', onClick: () => { i -= 1; place(); } }, 'もどる') : null,
          h('button', { type: 'button', class: 'btn sm primary', onClick: next }, i === steps.length - 1 ? 'はじめる' : '次へ')));
      // 説明の箱は、光らせた場所の右か下か左に置く
      const tw = Math.min(340, window.innerWidth - 24);
      tip.style.width = `${tw}px`;
      const th = tip.offsetHeight;
      let tx; let ty;
      if (left + w + 14 + tw < window.innerWidth) { tx = left + w + 14; ty = Math.min(Math.max(12, top), window.innerHeight - th - 12); }
      else if (top + hh + 14 + th < window.innerHeight) { tx = Math.min(Math.max(12, left), window.innerWidth - tw - 12); ty = top + hh + 14; }
      else if (left - tw - 14 > 0) { tx = left - tw - 14; ty = Math.min(Math.max(12, top), window.innerHeight - th - 12); }
      else { tx = (window.innerWidth - tw) / 2; ty = Math.max(12, top - th - 14); }
      Object.assign(tip.style, { left: `${tx}px`, top: `${ty}px` });
      const b = tip.querySelector('.btn.primary'); if (b) b.focus({ preventScroll: true });
    }
    document.addEventListener('keydown', onKey, true);
    window.addEventListener('resize', place);
    place();
  };
})();
