/* 1年「いくつと いくつ」第3回：8・9は いくつと いくつ
   10の わくに 8こ → あと 2で 10（ブロックを ゆびで うごかして 10に する）→ 9は あと 1 →
   8この ブロックを タップで 赤く ぬって「8は 3と 5」→ 8と 9の わけかた → ピヨの まちがい（8は 3と 4？）を 子どもが なおす。
   1年なので：ひらがなと 分かち書き・みじかい 文・ゆっくり・2たくが 中心。 */
(function () {
  const { T, P, Q, N, TAP, ACT, ST, BREAK, END } = HS;
  const C = FL.COL, NX = 700, INK = '#3b2a1e';
  const meate = { id: 'meate', kind: 'title', tag: 'គោលដៅ', text: 'ចូរបំបែក 8 និង 9', x: NX, y: 22 };
  const GHOST = '<rect x="-14" y="-14" width="28" height="28" rx="5" fill="#fff" stroke="#adb5bd" stroke-width="2.5" stroke-dasharray="5 4"/>';
  const FX = 40, FY = 96, CELL = 80, BSZ = 72;   // 10の わく：左上 (FX, FY)・1ます CELL・ブロックの 大きさ BSZ

  const emptyMark = (F, x, y, on) => F.rect(x - 33, y - 33, 66, 66, { rx: 12, fill: 'rgba(255,135,135,.15)', stroke: C.red, 'stroke-width': 3, 'stroke-dasharray': '7 6', opacity: on ? 1 : 0, 'pointer-events': 'none' });

  /* 10の わくに ブロック n こ（はじめの a こは 青、 のこりは 赤）。 o.ghost＝のこりを「うすい しかく」に（reveal で 赤く して あかす） */
  function split(F, n, a, o) {
    o = o || {};
    const tf = FL.tenFrame(F, FX, FY, CELL), bl = [];
    for (let i = 0; i < n; i++) {
      const [cx, cy] = tf.cells[i], ic = FL.icon(F, i < a ? 'block' : 'blockR', cx, cy, BSZ);
      if (o.ghost && i >= a) ic.innerHTML = GHOST;
      ic.style.opacity = 0; bl.push(ic);
    }
    const marks = []; for (let i = n; i < 10; i++) { const [cx, cy] = tf.cells[i]; marks.push(emptyMark(F, cx, cy, false)); }
    let nn = n;
    const tenL = F.label(FX + 200, 52, 'ដល់ 10 ត្រូវការ ' + (10 - n), { cls: 'l', hide: true });
    const lbA = F.label(140, 314, 'ខៀវ ' + a, { cls: 'l', color: C.blue, hide: true }), lbB = F.label(340, 314, 'ក្រហម ' + (n - a), { cls: 'l', color: C.red, hide: true });
    return {
      async show() { for (const ic of bl) { ic.style.opacity = 1; F.sfx('pop'); F.show(ic, 'pop', 0.25); await F.wait(0.08); } await F.wait(0.2); },
      async ten() { marks.slice(nn - n).forEach(m => { m.style.opacity = 1; }); F.setText(tenL, 'ដល់ 10 ត្រូវការ ' + (10 - nn)); await F.show(tenL); },
      async count() { F.setText(lbB, 'ក្រហម ' + (nn - a)); F.sfx('pop'); F.show(lbA); await F.show(lbB); },
      async reveal() {
        bl.forEach((ic, i) => { if (i >= a) ic.innerHTML = FL.ICON.blockR; });
        F.setText(lbB, 'ក្រហម ' + (nn - a)); F.sfx('pop'); F.show(lbA); await F.show(lbB);
      },
      /* ピヨの まちがいを なおす：赤を 1こ たす */
      async fix() {
        const [cx, cy] = tf.cells[nn], ic = FL.icon(F, 'blockR', cx, cy, BSZ); ic.style.opacity = 0;
        marks[nn - n].style.opacity = 0; nn++; F.sfx('pop'); await F.show(ic, 'pop', 0.45);
        F.setText(tenL, 'ដល់ 10 ត្រូវការ ' + (10 - nn)); F.setText(lbB, 'ក្រហម ' + (nn - a)); lbA.style.opacity = 1; lbB.style.opacity = 1;
      }
    };
  }

  /* 8こを タップして 赤く ぬる（k こ）。 青と 赤の かずを count で 見せる */
  function paint(F, n, k) {
    const tf = FL.tenFrame(F, FX, FY, CELL), bl = [];
    for (let i = 0; i < n; i++) { const [cx, cy] = tf.cells[i]; bl.push({ g: FL.icon(F, 'block', cx, cy, BSZ), red: false }); }
    const set = (r, red) => { r.red = red; r.g.innerHTML = FL.ICON[red ? 'blockR' : 'block']; };
    const nred = () => bl.filter(r => r.red).length;
    const lbA = F.label(140, 314, '', { cls: 'l', color: C.blue, hide: true }), lbB = F.label(340, 314, '', { cls: 'l', color: C.red, hide: true });
    return {
      async paint() {
        const it = F.interact(() => { let c = nred(); for (let i = n - 1; i >= 0 && c < k; i--) if (!bl[i].red) { set(bl[i], true); c++; } });
        bl.forEach(r => {
          r.g.classList.add('tapme');
          r.g.addEventListener('pointerdown', ev => {
            ev.preventDefault(); if (it.over) return;
            set(r, !r.red); F.sfx(r.red ? 'pop' : 'tap');
            if (nred() >= k) { F.sfx('ok'); it.done(); }
          });
        });
        await it.promise;
        bl.forEach(r => r.g.classList.remove('tapme'));
      },
      async count() { const r = nred(); F.setText(lbA, 'ខៀវ ' + (n - r)); F.setText(lbB, 'ក្រហម ' + r); F.sfx('pop'); F.show(lbA); await F.show(lbB); }
    };
  }

  /* 10の わくに 青 n こ。 赤い ブロック（10－n こ）を ゆびで あいている ところへ うごかして 10に する */
  function fill(F, n) {
    const k = 10 - n, tf = FL.tenFrame(F, FX, FY, CELL);
    for (let i = 0; i < n; i++) { const [cx, cy] = tf.cells[i]; FL.icon(F, 'block', cx, cy, BSZ); }
    const targets = [];
    for (let i = n; i < 10; i++) { const [x, y] = tf.cells[i]; targets.push({ x, y, used: false, mark: emptyMark(F, x, y, true) }); }
    const reds = [];
    for (let i = 0; i < k; i++) { const x = 500 + (i % 2) * 72, y = 156 + Math.floor(i / 2) * 72, g = F.g({ transform: `translate(${x} ${y})` }); FL.icon(F, 'blockR', 0, 0, BSZ, g); reds.push({ g, x, y, placed: false }); }
    const box = F.rect(FX - 8, FY - 8, CELL * 5 + 16, CELL * 2 + 16, { rx: 16, fill: 'none', stroke: C.blue, 'stroke-width': 5, 'stroke-dasharray': '12 9', opacity: 0, 'pointer-events': 'none' });
    const ten = F.label(FX + 200, 52, '10', { cls: 'xl', color: C.blue, hide: true });
    const put = (r, tg) => { r.placed = true; tg.used = true; r.x = tg.x; r.y = tg.y; r.g.setAttribute('transform', `translate(${tg.x} ${tg.y})`); tg.mark.style.opacity = 0; };
    const settle = () => { for (const r of reds) if (!r.placed) put(r, targets.find(q => !q.used)); };
    return {
      async drag() {
        const it = F.interact(settle);
        const ds = reds.map((r, i) => F.draggable(r.g, { x: r.x, y: r.y, onDrop: (x, y) => {
          if (it.over || r.placed) return false;
          const tg = targets.filter(q => !q.used).sort((p, q) => Math.hypot(x - p.x, y - p.y) - Math.hypot(x - q.x, y - q.y))[0];
          if (tg && Math.hypot(x - tg.x, y - tg.y) < 56) {
            put(r, tg); ds[i].set(tg.x, tg.y); ds[i].lock(); F.sfx('ok'); F.confetti(tg.x, tg.y, 24);
            if (targets.every(q => q.used)) it.done();
            return true;
          }
          return false;
        } }));
        await it.promise;
        ds.forEach(d => d.lock());
        settle();
      },
      async ten() { box.style.opacity = 1; await F.draw(box, 0.6); await F.show(ten); }
    };
  }

  HS.lesson({
    id: 'ikutsu-03', grade: 1, unit: 'ការបំបែក និងការផ្សំលេខ', no: 3, title: '8 និង 9 បំបែកជាប៉ុន្មាន និងប៉ុន្មាន', sticker: '🧩',
    goal: 'ចូរគិតអំពីវិធីបំបែក 8 និង 9 ដោយប្រអប់ 10',
    stages: ['ដល់ 10 ត្រូវការប៉ុន្មាន', 'លាបពណ៌ដើម្បីបំបែក', 'កែកំហុស'],
    figs: {
      split(F, n, a, o) { return split(F, n, a, o); },
      paint(F, n, k) { return paint(F, n, k); },
      fill(F, n) { return fill(F, n); }
    },
    steps: [
      ST(1),
      T('សួស្តីកូនៗទាំងអស់គ្នា! ថ្ងៃនេះយើងសាកល្បងបំបែក 8 និង 9។', { face: 'happy', act: 'hop', o: { face: 'happy' }, note: meate }),
      P('8 និង 9… ជាចំនួនធំបន្តិចហើយ!', { face: 'confused', mark: 'sweat' }),
      T('កុំបារម្ភ! យើងប្រើប្រអប់ 10។', { face: 'happy', fig: ['split', 8, 8], do: 'show' }),
      Q({ text: 'មានប្លុក 8។ ប្រអប់នៅទំនេរប៉ុន្មានទៀត?', opts: ['2 ដុំ', '3 ដុំ'], ok: 0, tip: 'ចូររាប់កន្លែងទំនេរ។',
        ng: { 1: [T('ចូររាប់កន្លែងទំនេរម្តងមួយ។', { face: 'think' })] },
        exp: [T('8 និង 2 ស្មើ 10។ មានទំនេរ 2។', { face: 'happy', do: 'ten' })] }),
      T('យើងនាំប្លុក 2 មកហើយ។ ចូរដាក់មើល!', { face: 'normal', fig: ['fill', 8] }),
      ACT({ text: 'ចូរដាក់ប្លុកលើកន្លែងទំនេរ!', hint: 'ចូរប្រើម្រាមដៃរំកិលប្លុក', run: { do: 'drag' }, face: 'normal' }),
      P('គ្រប់ 10 ហើយ! 8 និង 2 ស្មើ 10!', { face: 'cheer', act: 'jump', mark: 'sparkle', do: 'ten' }),
      T('ចុះ 9 វិញ? 9 និងប៉ុន្មានទើបបាន 10?', { face: 'normal', fig: ['split', 9, 9], do: 'show' }),
      N({ text: '9 និងប៉ុន្មានទើបបាន 10?', ans: 1, unit: 'ដុំ', tip: 'ចូររាប់កន្លែងទំនេរក្នុងប្រអប់។',
        exp: [T('9 និង 1 ស្មើ 10។ មានទំនេរ 1។', { face: 'happy', do: 'ten' })] }),
      T('8 ត្រូវការ 2 ទៀត 9 ត្រូវការ 1 ទៀត ទើបបាន 10។', { face: 'proud', note: { id: 'tomo', kind: 'memo', text: '8 ត្រូវការ 2 ទៀតបាន 10\n9 ត្រូវការ 1 ទៀតបាន 10', x: NX + 40, y: 110 } }),

      ST(2),
      T('លើកនេះ យើងនឹងបំបែកប្លុក 8 ជា 2 ពណ៌។', { face: 'happy', clearNotes: true, note: meate, fig: ['paint', 8, 3] }),
      ACT({ text: 'ចូរចុចប្លុក 3 ឱ្យទៅជាពណ៌ក្រហម!', hint: 'ចូរចុចប្លុក', run: { do: 'paint' }, face: 'normal' }),
      T('ក្រហម 3។ ខៀវ 5។ 8 បំបែកជា 3 និង 5!', { face: 'proud', do: 'count', note: { id: 'f1', kind: 'formula', text: '8 បំបែកជា 3 និង 5', x: NX + 60, y: 100 } }),
      P('ពេលដូរពណ៌ យើងឃើញវិធីបំបែក!', { face: 'cheer', act: 'hop', mark: 'idea' }),
      Q({ text: '8 បំបែកជា 4 និងប៉ុន្មាន?', opts: ['3', '4'], ok: 1, fig: ['split', 8, 4, { ghost: true }], do: 'show', tip: 'ចូររាប់ការ៉េដែលមានពណ៌ស្រាល។',
        ng: { 0: [T('ចូររាប់ការ៉េស្រាលម្តងមួយ។', { face: 'think' })] },
        exp: [T('4 និង 4 ស្មើ 8។ 8 បំបែកជា 4 និង 4។', { face: 'happy', do: 'reveal' })] }),
      N({ text: '8 បំបែកជា 6 និងប៉ុន្មាន?', ans: 2, fig: ['split', 8, 6, { ghost: true }], do: 'show', tip: 'ចូររាប់ការ៉េដែលមានពណ៌ស្រាល។',
        exp: [T('6 និង 2 ស្មើ 8។ 8 បំបែកជា 6 និង 2។', { face: 'happy', do: 'reveal' })] }),
      Q({ text: '9 បំបែកជា 5 និងប៉ុន្មាន?', opts: ['3', '4', '5'], ok: 1, fig: ['split', 9, 5, { ghost: true }], do: 'show', tip: 'ចូររាប់ការ៉េដែលមានពណ៌ស្រាល។',
        ng: { 0: [T('ចូររាប់ការ៉េស្រាលម្តងមួយ។', { face: 'think' })], 2: [T('5 និង 5 បាន 10។ 9 តិចជាងមួយ។', { face: 'think' })] },
        exp: [T('5 និង 4 ស្មើ 9។ 9 បំបែកជា 5 និង 4។', { face: 'happy', do: 'reveal' })] }),
      N({ text: '9 បំបែកជា 7 និងប៉ុន្មាន?', ans: 2, fig: ['split', 9, 7, { ghost: true }], do: 'show', tip: 'ចូររាប់ការ៉េដែលមានពណ៌ស្រាល។',
        exp: [T('7 និង 2 ស្មើ 9។ 9 បំបែកជា 7 និង 2។', { face: 'happy', do: 'reveal' })] }),
      BREAK(),

      ST(3),
      P('ពីយ៉ូក៏ធ្វើបានដែរ! 8 បំបែកជា 3 និង 4! ត្រូវទេ?', { face: 'cheer', act: 'hop', clearNotes: true, note: meate, fig: ['split', 7, 3], do: 'show', o: { face: 'think', mark: 'q' } }),
      Q({ text: 'ចម្លើយរបស់ពីយ៉ូ ត្រូវទេ?', opts: ['ត្រូវ', 'ខុស'], ok: 1, tip: 'បើ 8 នោះ ត្រូវតែទំនេរ 2។',
        ng: { 0: [T('តើប្លុកមានសរុបប៉ុន្មាន?', { face: 'think' })] },
        exp: [T('ទំនេរ 3។ បើ 8 ត្រូវតែទំនេរ 2។', { face: 'normal', do: 'ten' }), T('បើបន្ថែមក្រហម 1 នោះ 8 បំបែកជា 3 និង 5។', { face: 'happy', do: 'fix' })] }),
      P('អូ! សរុបមានតែ 7! អរគុណ!', { face: 'confused', mark: 'sweat', o: { face: 'happy' } }),
      T('ពេលរាប់ ចូរពិនិត្យចំនួនសរុបផងដែរ។', { face: 'proud', o: { face: 'happy', act: 'nod' } }),
      N({ text: '8 បំបែកជា 3 និងប៉ុន្មាន?', ans: 5, fig: ['split', 8, 3, { ghost: true }], do: 'show', tip: 'ចូររាប់ការ៉េដែលមានពណ៌ស្រាល។',
        exp: [T('3 និង 5 ស្មើ 8។ 8 បំបែកជា 3 និង 5។', { face: 'happy', do: 'reveal' })] }),
      N({ text: '9 បំបែកជា 2 និងប៉ុន្មាន?', ans: 7, fig: ['split', 9, 2, { ghost: true }], do: 'show', tip: 'ចូររាប់ការ៉េដែលមានពណ៌ស្រាល។',
        exp: [T('2 និង 7 ស្មើ 9។ 9 បំបែកជា 2 និង 7។', { face: 'happy', do: 'reveal' })] }),
      N({ who: 'piyo', text: 'ចុងក្រោយ ពីពីយ៉ូ! 9 បំបែកជា 5 និងប៉ុន្មាន?', ans: 4, fig: ['split', 9, 5, { ghost: true }], do: 'show', tip: 'ចូររាប់ការ៉េដែលមានពណ៌ស្រាល។',
        exp: [T('5 និង 4 ស្មើ 9។ 9 បំបែកជា 5 និង 4។', { face: 'happy', do: 'reveal' })] }),
      T('នេះជាការសង្ខេបសម្រាប់ថ្ងៃនេះ។', { face: 'happy', clearNotes: true, note: meate }),
      T('8 បំបែកជា 3 និង 5 ហើយ 9 បំបែកជា 4 និង 5។', { face: 'proud', fig: ['split', 9, 4], do: [['show'], ['count']], note: { id: 'sum', kind: 'formula', text: '8 បំបែកជា 3 និង 5\n9 បំបែកជា 4 និង 5', x: NX + 40, y: 100 } }),
      P('ប្រអប់ 10 ធ្វើឱ្យមើលឃើញងាយ!', { face: 'cheer', act: 'spin', mark: 'sparkle' }),
      T('8 ត្រូវការ 2 ទៀត 9 ត្រូវការ 1 ទៀត ទើបបាន 10។', { face: 'happy', note: { id: 'tomo', kind: 'memo', text: '8 ត្រូវការ 2 ទៀតបាន 10\n9 ត្រូវការ 1 ទៀតបាន 10', x: NX + 40, y: 250 } }),
      T('លើកក្រោយ យើងនឹងមើលមិត្តរបស់ 10។', { face: 'happy' }),
      END({ text: 'ថ្ងៃនេះក៏ខំប្រឹងណាស់ដែរ! ត្រា «ល្អណាស់»!' })
    ]
  });
})();
