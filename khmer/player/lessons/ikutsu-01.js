/* 1年「いくつと いくつ」第1回：5は いくつと いくつ
   手の ゆび 5つ → ゆびを 2つ まげて「まげた 2・のばした 3」（ゆびで わける）→ ブロック 5こを 左右の おさらへ（2と 3）→
   ぜんぶの わけかたを ならべる（ひょう）→ ピヨの まちがい（5は 2と 2？）を 子どもが なおす。
   1年なので：ひらがなと 分かち書き・みじかい 文・ゆっくり・2たくが 中心。 */
(function () {
  const { T, P, Q, N, TAP, ACT, ST, BREAK, END } = HS;
  const C = FL.COL, NX = 700, INK = '#3b2a1e';
  const meate = { id: 'meate', kind: 'title', tag: 'គោលដៅ', text: 'ចូរបំបែក 5 ជា 2 ផ្នែក', x: NX, y: 22 };
  const GHOST = '<rect x="-14" y="-14" width="28" height="28" rx="5" fill="#fff" stroke="#adb5bd" stroke-width="2.5" stroke-dasharray="5 4"/>';

  /* 手：ゆび 5つ。 k0＝はじめから まげてある ゆびの かず（右はしから） */
  function hand(F, k0) {
    const SK = '#ffdcb8', EDGE = '#c98a54', PALE = '#eadbc8', PY = 262, W = 66, STUB = 46;
    const xs = [150, 234, 318, 402, 486], hs = [104, 150, 168, 150, 118];
    F.rect(104, PY - 6, 428, 112, { rx: 48, fill: SK, stroke: EDGE, 'stroke-width': 5 });
    const fd = (cx, h) => { const yt = PY + 14 - h; return `M${cx - W / 2} ${PY + 14}V${yt + W / 2}A${W / 2} ${W / 2} 0 0 1 ${cx + W / 2} ${yt + W / 2}V${PY + 14}`; };
    const fing = xs.map((cx, i) => ({ cx, h: hs[i], folded: false, el: F.path(fd(cx, hs[i]), { fill: SK, stroke: EDGE, 'stroke-width': 5 }) }));
    const nums = xs.map((cx, i) => F.label(cx, PY + 14 - hs[i] - 26, String(i + 1), { cls: 'l', color: C.pink, hide: true }));
    const foldNow = f => { f.folded = true; f.el.setAttribute('fill', PALE); f.el.setAttribute('d', fd(f.cx, STUB)); };
    const foldAnim = f => { f.folded = true; f.el.setAttribute('fill', PALE); return F.tween(0.28, u => f.el.setAttribute('d', fd(f.cx, f.h + (STUB - f.h) * u))); };
    for (let i = 4; i > 4 - (k0 || 0); i--) foldNow(fing[i]);
    let lab = null;
    return {
      async count() { for (let i = 0; i < 5; i++) { F.sfx('count'); await F.show(nums[i]); await F.wait(0.12); } },
      /* ゆびを k こ タップして まげる */
      async fold(k) {
        nums.forEach(n => { n.style.opacity = 0; });
        let cnt = fing.filter(f => f.folded).length;
        const settle = () => { let c = fing.filter(f => f.folded).length; for (let i = 4; i >= 0 && c < k; i--) if (!fing[i].folded) { foldNow(fing[i]); c++; } };
        const it = F.interact(settle);
        fing.forEach(f => {
          f.el.classList.add('tapme');
          f.el.addEventListener('pointerdown', ev => {
            ev.preventDefault(); if (it.over || f.folded) return;
            foldAnim(f); cnt++; f.el.classList.remove('tapme');
            if (cnt >= k) { F.sfx('ok'); it.done(); } else F.sfx('pop');
          });
        });
        await it.promise;
        fing.forEach(f => f.el.classList.remove('tapme'));
      },
      async show23() {
        const kf = fing.filter(f => f.folded).length;
        if (!lab) lab = [F.label(176, 38, 'បត់ ' + kf, { cls: 'l', color: C.blue, hide: true }), F.label(444, 38, 'លាត ' + (5 - kf), { cls: 'l', color: C.red, hide: true })];
        F.sfx('pop'); F.show(lab[0]); await F.show(lab[1]);
      }
    };
  }

  /* おさらが 2まい。 ブロックを 左（L こ）と 右（R こ）の おさらへ ゆびで うごかす */
  function plates(F, L, R) {
    const n = L + R, BS = 50, PY = 292, XL = 165, XR = 455;
    const dish = F.g({ opacity: 0 });
    [XL, XR].forEach(cx => {
      F.el('ellipse', { cx, cy: PY, rx: 140, ry: 52, fill: '#f1f8ff', stroke: '#8fb8de', 'stroke-width': 4 }, dish);
      F.el('ellipse', { cx, cy: PY, rx: 112, ry: 38, fill: 'none', stroke: '#cfe3f5', 'stroke-width': 3 }, dish);
    });
    const lbL = F.label(XL, 364, 'ចានខាងឆ្វេង', { cls: 's', hide: true }), lbR = F.label(XR, 364, 'ចានខាងស្តាំ', { cls: 's', hide: true });
    const slot = (cx, cap, i) => [cx - (cap - 1) * 27 + i * 54, PY - 10];
    const targets = [];
    const addT = (cx, cap, side) => { for (let i = 0; i < cap; i++) { const [x, y] = slot(cx, cap, i); targets.push({ x, y, side, used: false, mark: F.rect(x - 27, y - 27, 54, 54, { rx: 10, fill: 'rgba(255,135,135,.18)', stroke: C.red, 'stroke-width': 3, 'stroke-dasharray': '7 6', opacity: 0, 'pointer-events': 'none' }) }); } };
    addT(XL, L, 'L'); addT(XR, R, 'R');
    const blocks = [];
    for (let i = 0; i < n; i++) {
      const x = 310 - (n - 1) * 50 + i * 100, y = 118, g = F.g({ transform: `translate(${x} ${y})`, opacity: 0 });
      blocks.push({ g, ic: FL.icon(F, 'block', 0, 0, BS, g), x, y, placed: false });
    }
    const cL = F.label(XL, 186, String(L), { cls: 'xl', color: C.blue, hide: true }), cR = F.label(XR, 186, String(R), { cls: 'xl', color: C.red, hide: true });
    const place = (r, tg) => { r.placed = true; tg.used = true; r.x = tg.x; r.y = tg.y; r.g.setAttribute('transform', `translate(${tg.x} ${tg.y})`); r.ic.innerHTML = FL.ICON[tg.side === 'L' ? 'block' : 'blockR']; tg.mark.style.opacity = 0; };
    const glide = (r, tg) => { const fx = r.x, fy = r.y; return F.tween(0.5, u => r.g.setAttribute('transform', `translate(${fx + (tg.x - fx) * u} ${fy + (tg.y - fy) * u})`)).then(() => place(r, tg)); };
    const settle = () => { for (const r of blocks) if (!r.placed) place(r, targets.find(q => !q.used)); targets.forEach(q => { q.mark.style.opacity = 0; }); };
    return {
      async show() {
        dish.style.opacity = 1; await F.show(dish, 'fade', 0.3); F.show(lbL); F.show(lbR);
        for (const r of blocks) { r.g.style.opacity = 1; F.sfx('pop'); F.show(r.g, 'pop', 0.3); await F.wait(0.1); }
      },
      async drag() {
        targets.forEach(q => { q.mark.style.opacity = 1; });
        const it = F.interact(settle);
        const ds = blocks.map((r, i) => F.draggable(r.g, { x: r.x, y: r.y, onDrop: (x, y) => {
          if (it.over || r.placed) return false;
          const tg = targets.filter(q => !q.used).sort((p, q) => Math.hypot(x - p.x, y - p.y) - Math.hypot(x - q.x, y - q.y))[0];
          if (tg && Math.hypot(x - tg.x, y - tg.y) < 56) {
            place(r, tg); ds[i].set(tg.x, tg.y); ds[i].lock(); F.sfx('ok'); F.confetti(tg.x, tg.y, 24);
            if (targets.every(q => q.used)) it.done();
            return true;
          }
          return false;
        } }));
        await it.promise;
        ds.forEach(d => d.lock());
        settle();
      },
      async putLeft() { await Promise.all(blocks.slice(0, L).map((r, i) => glide(r, targets.filter(q => q.side === 'L')[i]))); },
      async putRight() { await Promise.all(blocks.filter(r => !r.placed).map((r, i) => glide(r, targets.filter(q => q.side === 'R')[i]))); },
      async counts() { F.sfx('pop'); F.show(cL); await F.show(cR); }
    };
  }

  /* ひょう：5の わけかたを ならべる。 o.hidden＝はじめは かくす（all で 1つずつ）・o.ask＝その行の 右の かずを「？」に（reveal で あかす） */
  function rows(F, n, o) {
    o = o || {};
    const m = n - 1, rs = Math.min(74, Math.floor(300 / m)), y0 = 196 - (m - 1) * rs / 2, s = n <= 5 ? 44 : 38, sp = s + 6, bx = 290, fs = Math.min(56, rs * 0.8);
    const R = [];
    for (let i = 0; i < m; i++) {
      const a = i + 1, b = n - a, y = y0 + i * rs, g = F.g(o.hidden ? { opacity: 0 } : {});
      F.rect(58, y - rs / 2 + 3, 532, rs - 6, { rx: 16, fill: i % 2 ? '#fffdf6' : '#fff7e0' }, g);
      F.text(84, y, String(a), { 'font-size': fs, fill: C.blue }, g);
      F.text(140, y, 'និង', { 'font-size': fs * 0.62, fill: INK }, g);
      const tb = F.text(196, y, String(b), { 'font-size': fs, fill: C.red }, g);
      const blocks = [];
      for (let j = 0; j < n; j++) blocks.push(FL.icon(F, j < a ? 'block' : 'blockR', bx + j * sp, y, s, g));
      if (o.ask === i) { tb.textContent = '？'; tb.setAttribute('fill', '#adb5bd'); blocks.slice(a).forEach(bl => { bl.innerHTML = GHOST; }); }
      R.push({ i, a, b, y, g, tb, blocks });
    }
    return {
      async all() { for (const r of R) { F.sfx('pop'); await F.show(r.g, 'pop', 0.35); await F.wait(0.12); } },
      async reveal() {
        const r = R[o.ask]; r.tb.textContent = String(r.b); r.tb.setAttribute('fill', C.red); r.blocks.slice(r.a).forEach(bl => { bl.innerHTML = FL.ICON.blockR; });
        F.sfx('pop'); await F.show(r.tb, 'pop', 0.4);
      }
    };
  }

  HS.lesson({
    id: 'ikutsu-01', grade: 1, unit: 'ការបំបែក និងការផ្សំលេខ', no: 1, title: '5 បំបែកជាប៉ុន្មាន និងប៉ុន្មាន', sticker: '🖐️',
    goal: 'ចូររកវិធីបំបែក 5 ជា 2 ផ្នែក',
    stages: ['បំបែកដោយម្រាមដៃ', 'បំបែកដោយប្លុក', 'រៀបចំទាំងអស់'],
    figs: {
      hand(F, k) { return hand(F, k); },
      plates(F, L, R) { return plates(F, L, R); },
      rows(F, n, o) { return rows(F, n, o); }
    },
    steps: [
      ST(1),
      T('សួស្តីកូនៗទាំងអស់គ្នា! ថ្ងៃនេះយើងសាកល្បងបំបែក 5។', { face: 'happy', act: 'hop', o: { face: 'happy' }, note: meate }),
      P('5 គឺចំនួនម្រាមដៃរបស់ដៃមួយ!', { face: 'cheer', act: 'jump', mark: 'note' }),
      T('មើលដៃ។ ចូររាប់ម្រាមដៃ។', { face: 'normal', fig: 'hand', do: 'count' }),
      N({ text: 'សរុបមានម្រាមដៃប៉ុន្មាន?', ans: 5, tip: 'មើលលេខខាងលើម្រាមដៃ។',
        exp: [T('ម្រាមដៃមាន 1, 2, 3, 4, 5។ សរុប 5។', { face: 'happy' })] }),
      T('ចូរបំបែកម្រាមដៃទាំងនេះជា 2 ផ្នែក។', { face: 'normal' }),
      ACT({ text: 'ចូរចុចម្រាមដៃ 2 ដើម្បីបត់!', hint: 'ចូរប៉ះម្រាមដៃ 2', run: { do: ['fold', 2] }, face: 'normal' }),
      Q({ text: 'តើមានម្រាមដៃលាតប៉ុន្មាន?', opts: ['2', '3'], ok: 1, tip: 'ចូររាប់ម្រាមដៃដែលមិនបានបត់។',
        ng: { 0: [T('នោះគឺជាចំនួនម្រាមដៃដែលបានបត់។ សូមមើលចំនួនដែលនៅសល់។', { face: 'think' })] },
        exp: [T('ម្រាមលាតមាន 3។ ម្រាមបត់មាន 2។', { face: 'happy', do: 'show23' })] }),
      P('5 បំបែកជា 2 និង 3!', { face: 'cheer', act: 'jump', mark: 'sparkle' }),
      T('5 បំបែកជា 2 និង 3។ សរសេរដូចនេះ។', { face: 'proud', note: { id: 'f1', kind: 'formula', text: '5 បំបែកជា 2 និង 3', x: NX + 60, y: 100 } }),
      T('លើកនេះ យើងបត់ម្រាមតែ 1 ប៉ុណ្ណោះ។', { face: 'normal', fig: ['hand', 1] }),
      Q({ text: 'បើបត់ 1 តើម្រាមលាតមានប៉ុន្មាន?', opts: ['3', '4'], ok: 1, tip: 'ចូររាប់ម្រាមដៃដែលមិនបានបត់។',
        ng: { 0: [T('ម្រាមសរុប 5។ បានបត់ 1។ នៅសល់ប៉ុន្មាន?', { face: 'think' })] },
        exp: [T('ម្រាមលាតមាន 4។ 5 បំបែកជា 1 និង 4!', { face: 'happy', do: 'show23' })] }),
      N({ text: 'បើបត់ 4 តើម្រាមលាតមានប៉ុន្មាន?', ans: 1, unit: '', fig: ['hand', 4], tip: 'ចូររាប់ម្រាមដៃដែលមិនបានបត់។',
        exp: [T('ម្រាមលាតមាន 1។ 5 បំបែកជា 4 និង 1!', { face: 'happy', do: 'show23' })] }),

      ST(2),
      T('លើកនេះ ចូរសាកល្បងបំបែកដោយប្លុក។', { face: 'happy', clearNotes: true, note: meate, fig: ['plates', 2, 3], do: 'show' }),
      P('មានចាន 2។ មានប្លុក 5!', { face: 'happy', o: { face: 'happy' } }),
      ACT({ text: 'ចូរដាក់ប្លុក 2 លើចានខាងឆ្វេង និង 3 លើចានខាងស្តាំ!', hint: 'ចូរប្រើម្រាមដៃរំកិលប្លុក', run: { do: 'drag' }, face: 'normal' }),
      P('ខាងឆ្វេង 2 ខាងស្តាំ 3! 5 បំបែកជា 2 និង 3!', { face: 'cheer', act: 'jump', mark: 'sparkle', do: 'counts' }),
      T('ដូចម្រាមដៃដែរ។ ទោះប្រើប្លុក 5 ក៏បំបែកជា 2 និង 3។', { face: 'proud', note: { id: 'f1', kind: 'formula', text: '5 បំបែកជា 2 និង 3', x: NX + 60, y: 100 } }),
      T('លើកនេះ យើងដាក់ប្លុក 4 លើចានខាងឆ្វេង។', { face: 'normal', fig: ['plates', 4, 1], do: [['show'], ['putLeft']] }),
      N({ text: 'តើចានខាងស្តាំនឹងមានប៉ុន្មាន?', ans: 1, unit: 'ដុំ', tip: 'ប្លុកមានសរុប 5។ សូមមើលចំនួនដែលនៅសល់។',
        exp: [T('4 និង 1 ស្មើ 5។ នៅខាងស្តាំមាន 1។', { face: 'happy', do: [['putRight'], ['counts']] })] }),
      P('5 បំបែកជា 4 និង 1។ បូកទាំងអស់បានជា 5!', { face: 'surprised', act: 'hop' }),
      BREAK(),

      ST(3),
      T('ចូររៀបវិធីបំបែក 5 ទាំងអស់!', { face: 'happy', clearNotes: true, note: meate, fig: ['rows', 5, { hidden: true }] }),
      TAP({ text: 'ចុចប៊ូតុង ហើយរៀបចំ!', btn: 'រៀបចំ!', run: { do: 'all' } }),
      T('1 និង 4, 2 និង 3, 3 និង 2, 4 និង 1។', { face: 'normal' }),
      P('ទាំងអស់បូកបានជា 5!', { face: 'surprised', act: 'hop' }),
      Q({ text: '5 បំបែកជា 1 និងប៉ុន្មាន?', opts: ['3', '4'], ok: 1, fig: ['rows', 5, { ask: 0 }], tip: 'ចូររាប់ការ៉េដែលមានពណ៌ស្រាល។',
        ng: { 0: [T('ចូររាប់ការ៉េស្រាលម្តងមួយ។', { face: 'think' })] },
        exp: [T('5 បំបែកជា 1 និង 4។', { face: 'happy', do: 'reveal' })] }),
      N({ text: '5 បំបែកជា 3 និងប៉ុន្មាន?', ans: 2, fig: ['rows', 5, { ask: 2 }], tip: 'ចូររាប់ការ៉េដែលមានពណ៌ស្រាល។',
        exp: [T('3 និង 2 ស្មើ 5។ 5 បំបែកជា 3 និង 2។', { face: 'happy', do: 'reveal' })] }),
      P('ពីយ៉ូក៏ធ្វើដែរ! ពីយ៉ូបត់ម្រាម 2!', { face: 'cheer', act: 'hop', fig: ['hand', 2] }),
      P('ម្រាមលាតក៏មាន 2! 5 បំបែកជា 2 និង 2!', { face: 'proud', o: { face: 'think', mark: 'q' } }),
      Q({ text: 'ចម្លើយរបស់ពីយ៉ូ ត្រូវទេ?', opts: ['ត្រូវ', 'ខុស'], ok: 1, tip: 'ចូររាប់ម្រាមដៃដែលលាត។',
        ng: { 0: [T('ចូររាប់ម្រាមដៃដែលលាតម្តងមួយ។', { face: 'think' })] },
        exp: [T('ម្រាមលាតមាន 3។ 5 បំបែកជា 2 និង 3។', { face: 'happy', do: 'show23' })] }),
      P('អ្ហា៎ ពិតមែនហើយ! អរគុណ!', { face: 'confused', mark: 'sweat', o: { face: 'happy' } }),
      N({ who: 'piyo', text: 'ចុងក្រោយ ពីពីយ៉ូ! 5 បំបែកជា 2 និងប៉ុន្មាន?', ans: 3, fig: ['rows', 5, { ask: 1 }], tip: 'ចូររាប់ការ៉េដែលមានពណ៌ស្រាល។',
        exp: [T('2 និង 3 ស្មើ 5។ 5 បំបែកជា 2 និង 3។', { face: 'happy', do: 'reveal' })] }),
      T('នេះជាការសង្ខេបសម្រាប់ថ្ងៃនេះ។', { face: 'happy', clearNotes: true, note: meate }),
      T('5 បំបែកជា 1 និង 4, 2 និង 3, 3 និង 2, 4 និង 1។', { face: 'proud', note: { id: 'sum', kind: 'formula', text: '5 បំបែកជា\n1 និង 4 · 2 និង 3\n3 និង 2 · 4 និង 1', x: NX + 20, y: 100 } }),
      P('5 រួចរាល់ហើយ! យល់ទាំងអស់!', { face: 'cheer', act: 'spin', mark: 'sparkle' }),
      T('លើកក្រោយ យើងនឹងបំបែក 6 និង 7។', { face: 'happy' }),
      END({ text: 'ថ្ងៃនេះក៏ខំប្រឹងណាស់ដែរ! ត្រា «ល្អណាស់»!' })
    ]
  });
})();
