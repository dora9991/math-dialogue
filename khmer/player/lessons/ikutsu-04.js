/* 1年「いくつと いくつ」第4回：10は いくつと いくつ（10の ともだち）
   ブロック 10この うち 4こを 10の わくへ ゆびで うごかす → のこりを タップで かぞえる（4と 6）→ 10の ともだちを ならべる（1と 9…5と 5）→
   ピヨの まちがい（10は 6と 5？）を 子どもが なおす → チャレンジ：ブロックの かくれんぼ（ぬのの 下の かずを あてる）。 たしざんの もとに なる 回。
   1年なので：ひらがなと 分かち書き・みじかい 文・ゆっくり・2たくが 中心。 */
(function () {
  const { T, P, Q, N, TAP, ACT, ST, BREAK, END } = HS;
  const C = FL.COL, NX = 700, INK = '#3b2a1e';
  const meate = { id: 'meate', kind: 'title', tag: 'គោលដៅ', text: 'មិត្តរបស់ 10', x: NX, y: 22 };
  const GHOST = '<rect x="-14" y="-14" width="28" height="28" rx="5" fill="#fff" stroke="#adb5bd" stroke-width="2.5" stroke-dasharray="5 4"/>';
  const FX = 40, FY = 96, CELL = 80, BSZ = 72;   // 10の わく（大）：左上 (FX, FY)・1ます CELL・ブロックの 大きさ BSZ
  const TY = 56, TC = 76, TB = 64;               // ブロックを うごかす 図の わく

  const emptyMark = (F, x, y, on, r) => F.rect(x - (r || 33), y - (r || 33), (r || 33) * 2, (r || 33) * 2, { rx: 12, fill: 'rgba(255,135,135,.15)', stroke: C.red, 'stroke-width': 3, 'stroke-dasharray': '7 6', opacity: on ? 1 : 0, 'pointer-events': 'none' });

  /* 10の わく（からっぽ）と、 下の おぼんに ブロック 10こ。 drag(k)＝k こを わくへ ゆびで うごかす／countRest＝のこりを タップで かぞえる */
  function tray(F) {
    const tf = FL.tenFrame(F, FX, TY, TC);
    F.rect(18, 270, 584, 72, { rx: 20, fill: '#f6efe2', stroke: '#e0d2b8', 'stroke-width': 3 });
    const bl = [], used = Array(10).fill(false);
    for (let i = 0; i < 10; i++) { const x = 62 + i * 58, y = 306, g = F.g({ transform: `translate(${x} ${y})`, opacity: 0 }); bl.push({ g, ic: FL.icon(F, 'block', 0, 0, TB, g), x, y, cell: -1 }); }
    const marks = tf.cells.map(([x, y]) => emptyMark(F, x, y, false, 30));
    const lbIn = F.label(520, 96, '', { cls: 'l', color: C.blue, hide: true }), lbOut = F.label(520, 160, '', { cls: 'l', color: C.red, hide: true });
    const lbGap = F.label(FX + 190, 232, '', { cls: 's', hide: true });
    let K = 0;
    return {
      async show() { for (const r of bl) { r.g.style.opacity = 1; F.sfx('pop'); F.show(r.g, 'pop', 0.25); await F.wait(0.07); } await F.wait(0.2); },
      async drag(k) {
        K = k;
        const nplaced = () => bl.filter(r => r.cell >= 0).length;
        const put = (r, ci) => { used[ci] = true; r.cell = ci; const [x, y] = tf.cells[ci]; r.x = x; r.y = y; r.g.setAttribute('transform', `translate(${x} ${y})`); };
        const it = F.interact(() => { for (const r of bl) { if (nplaced() >= k) break; if (r.cell < 0) put(r, used.indexOf(false)); } });
        const ds = bl.map((r, i) => F.draggable(r.g, { x: r.x, y: r.y, onDrop: (x, y) => {
          if (it.over || r.cell >= 0) return false;
          const free = tf.cells.map((c, ci) => ({ ci, d: Math.hypot(x - c[0], y - c[1]) })).filter(q => !used[q.ci]).sort((p, q) => p.d - q.d)[0];
          if (free && free.d < 50) {
            put(r, free.ci); ds[i].set(r.x, r.y); ds[i].lock(); F.sfx('ok');
            if (nplaced() >= k) { F.confetti(r.x, r.y, 30); it.done(); }
            return true;
          }
          return false;
        } }));
        await it.promise;
        ds.forEach(d => d.lock());
      },
      async countRest() { F.clearBadges(); await F.countTap(bl.filter(r => r.cell < 0).map(r => r.g), { badgeDy: -12 }); },
      /* わくに 入れた かずと、 のこりの かず（のこりは 赤に する） */
      async sums() {
        bl.forEach(r => { if (r.cell < 0) r.ic.innerHTML = FL.ICON.blockR; });
        F.setText(lbIn, 'ក្នុងប្រអប់ ' + K); F.setText(lbOut, 'នៅសល់ ' + (10 - K)); F.sfx('pop'); F.show(lbIn); await F.show(lbOut);
      },
      /* わくの あいて いる ところ */
      async gap() { used.forEach((u, ci) => { if (!u) marks[ci].style.opacity = 1; }); F.setText(lbGap, 'កន្លែងទំនេរ ' + (10 - K)); await F.show(lbGap); }
    };
  }

  /* 10の ともだち：1と 9 … 5と 5 を 小さな 10の わくの カードで ならべる（3れつ×2だん・6まいめは「あわせて 10」）。
     o.hidden＝はじめは かくす（all で 1まいずつ）・o.ask＝その カードの 右の かずを「？」に（reveal） */
  function friends(F, o) {
    o = o || {};
    const R = [];
    for (let i = 0; i < 6; i++) {
      const cx = 105 + (i % 3) * 205, top = i < 3 ? 26 : 206, g = F.g(o.hidden ? { opacity: 0 } : {});
      F.rect(cx - 98, top, 196, 168, { rx: 18, fill: i === 5 ? '#fff0f5' : '#fff7e0', stroke: i === 5 ? '#f7b3c9' : '#f0dcae', 'stroke-width': 3 }, g);
      if (i === 5) { F.text(cx, top + 62, 'សរុប', { 'font-size': 34, fill: INK }, g); F.text(cx, top + 118, '10', { 'font-size': 64, fill: C.pink }, g); R.push({ g }); continue; }
      const a = i + 1, b = 10 - a;
      const tf = FL.tenFrame(F, cx - 90, top + 14, 36); g.appendChild(tf.g);
      const ics = tf.cells.map(([x, y], j) => FL.icon(F, j < a ? 'block' : 'blockR', x, y, 30, g));
      F.text(cx - 56, top + 128, String(a), { 'font-size': 54, fill: C.blue }, g);
      F.text(cx, top + 130, 'និង', { 'font-size': 34, fill: INK }, g);
      const tb = F.text(cx + 56, top + 128, String(b), { 'font-size': 54, fill: C.red }, g);
      if (o.ask === i) { tb.textContent = '？'; tb.setAttribute('fill', '#adb5bd'); ics.forEach((ic, j) => { if (j >= a) ic.innerHTML = GHOST; }); }
      R.push({ a, b, g, tb, ics });
    }
    return {
      async all() { for (const r of R) { F.sfx('pop'); await F.show(r.g, 'pop', 0.35); await F.wait(0.12); } },
      async reveal() {
        const r = R[o.ask]; r.tb.textContent = String(r.b); r.tb.setAttribute('fill', C.red); r.ics.forEach((ic, j) => { if (j >= r.a) ic.innerHTML = FL.ICON.blockR; });
        F.sfx('pop'); await F.show(r.tb, 'pop', 0.4);
      }
    };
  }

  /* 10の わくに ブロック 10こ（はじめの a こは 青、 のこりは 赤）。 o.ghost＝のこりを「うすい しかく」に（reveal で 赤く して あかす） */
  function frame10(F, a, o) {
    o = o || {};
    const tf = FL.tenFrame(F, FX, FY, CELL), bl = [];
    for (let i = 0; i < 10; i++) {
      const [cx, cy] = tf.cells[i], ic = FL.icon(F, i < a ? 'block' : 'blockR', cx, cy, BSZ);
      if (o.ghost && i >= a) ic.innerHTML = GHOST;
      ic.style.opacity = 0; bl.push(ic);
    }
    const lbA = F.label(140, 314, 'ខៀវ ' + a, { cls: 'l', color: C.blue, hide: true }), lbB = F.label(340, 314, 'ក្រហម ' + (10 - a), { cls: 'l', color: C.red, hide: true });
    return {
      async show() { for (const ic of bl) { ic.style.opacity = 1; F.sfx('pop'); F.show(ic, 'pop', 0.25); await F.wait(0.07); } await F.wait(0.2); },
      async count() { F.sfx('pop'); F.show(lbA); await F.show(lbB); },
      async reveal() { bl.forEach((ic, i) => { if (i >= a) ic.innerHTML = FL.ICON.blockR; }); F.sfx('pop'); F.show(lbA); await F.show(lbB); }
    };
  }

  /* かくれんぼ：10の わくに 青 a こ・赤 10－a こ。 赤の ところに ぬのを かける（cover）／とる（open）。 o.covered＝はじめから ぬのが かかっている */
  function hide(F, a, o) {
    o = o || {};
    const tf = FL.tenFrame(F, FX, FY, CELL), bl = [], pieces = [];
    for (let i = 0; i < 10; i++) { const [cx, cy] = tf.cells[i], ic = FL.icon(F, i < a ? 'block' : 'blockR', cx, cy, BSZ); ic.style.opacity = o.covered ? 1 : 0; bl.push(ic); }
    const seg = (r, c0, c1) => {
      if (c1 < c0) return;
      const p = F.g({ opacity: o.covered ? 1 : 0 });
      F.rect(FX + c0 * CELL + 5, FY + r * CELL + 5, (c1 - c0 + 1) * CELL - 10, CELL - 10, { rx: 16, fill: '#ffd23f', stroke: '#e0a400', 'stroke-width': 4 }, p);
      F.text(FX + (c0 + c1 + 1) * CELL / 2, FY + r * CELL + CELL / 2, '？', { 'font-size': 56, fill: '#b8860b' }, p);
      pieces.push(p);
    };
    seg(0, a, 4); seg(1, Math.max(a, 5) - 5, 4);   // 上の だん＝a〜4 れつ・下の だん＝（a と 5 の おおきい ほう）－5〜4 れつ
    F.label(FX + 200, 52, 'សរុប 10 ដុំ', { cls: 'l' });
    const lbA = F.label(140, 314, 'ខៀវ ' + a, { cls: 'l', color: C.blue, hide: true }), lbB = F.label(340, 314, 'ក្រហម ' + (10 - a), { cls: 'l', color: C.red, hide: true });
    return {
      async show() { for (const ic of bl) { ic.style.opacity = 1; F.sfx('pop'); F.show(ic, 'pop', 0.25); await F.wait(0.07); } await F.wait(0.2); },
      async cover() { F.sfx('whoosh'); await Promise.all(pieces.map(p => F.show(p, 'pop', 0.5))); },
      async open() { await Promise.all(pieces.map(p => F.hide(p, 0.5))); F.sfx('pop'); F.show(lbA); await F.show(lbB); }
    };
  }

  HS.lesson({
    id: 'ikutsu-04', grade: 1, unit: 'ការបំបែក និងការផ្សំលេខ', no: 4, title: '10 បំបែកជាប៉ុន្មាន និងប៉ុន្មាន', sticker: '🔟',
    goal: 'ចូររក «មិត្តរបស់ 10» (ចំនួនពីរដែលបូកគ្នាបាន 10)',
    stages: ['បំបែក 10 ហើយរាប់', 'រៀបមិត្តរបស់ 10', 'ការប្រកួត! ប្លុកលាក់ខ្លួន'],
    figs: {
      tray(F) { return tray(F); },
      friends(F, o) { return friends(F, o); },
      frame10(F, a, o) { return frame10(F, a, o); },
      hide(F, a, o) { return hide(F, a, o); }
    },
    steps: [
      ST(1),
      T('សួស្តីកូនៗទាំងអស់គ្នា! ថ្ងៃនេះយើងសាកល្បងបំបែក 10។', { face: 'happy', act: 'hop', o: { face: 'happy' }, note: meate }),
      P('10 គឺចំនួននៅពេលលាតម្រាមដៃទាំងអស់!', { face: 'cheer', act: 'jump', mark: 'note' }),
      T('មានប្លុក 10 និងប្រអប់ 10។', { face: 'normal', fig: 'tray', do: 'show' }),
      ACT({ text: 'ចូរដាក់ប្លុក 4 ក្នុងប្រអប់!', hint: 'ចូរប្រើម្រាមដៃរំកិលប្លុក', run: { do: ['drag', 4] }, face: 'normal' }),
      T('តើប្លុកនៅខាងក្រៅប្រអប់មានប៉ុន្មាន?', { face: 'normal', o: { face: 'think' } }),
      ACT({ text: 'ចូរចុចប្លុកដែលនៅសល់ ហើយរាប់!', hint: 'ចូរចុចប្លុក', run: { do: 'countRest' }, face: 'happy' }),
      P('នៅសល់ 6! 4 និង 6!', { face: 'cheer', act: 'jump', mark: 'sparkle', do: 'sums', note: { id: 'f1', kind: 'formula', text: '10 បំបែកជា 4 និង 6', x: NX + 60, y: 100 } }),
      Q({ text: 'តើប្រអប់នៅទំនេរប៉ុន្មាន?', opts: ['4', '6'], ok: 1, tip: 'ចូររាប់កន្លែងទំនេរក្នុងប្រអប់។',
        ng: { 0: [T('4 គឺកន្លែងដែលមានប្លុក។', { face: 'think' })] },
        exp: [T('កន្លែងទំនេរក៏ 6 ដែរ។ ដូចចំនួនដែលនៅសល់!', { face: 'happy', do: 'gap' })] }),
      P('ក្នុងប្រអប់ និងក្រៅប្រអប់ បូកគ្នាបាន 10!', { face: 'surprised', act: 'hop' }),

      ST(2),
      T('ចូររៀបវិធីបំបែក 10។', { face: 'happy', clearNotes: true, note: meate, fig: ['friends', { hidden: true }] }),
      TAP({ text: 'ចុចប៊ូតុង ហើយរៀបចំ!', btn: 'រៀបចំ!', run: { do: 'all' } }),
      T('1 និង 9, 2 និង 8, 3 និង 7, 4 និង 6, 5 និង 5។', { face: 'normal' }),
      T('នេះហើយជា «មិត្តរបស់ 10»!', { face: 'proud', note: { id: 'tomo', kind: 'formula', text: 'មិត្តរបស់ 10\nបូកគ្នាបាន 10', x: NX + 20, y: 110 } }),
      P('បូកគ្នាទាំងអស់បាន 10! អស្ចារ្យណាស់!', { face: 'surprised', act: 'hop', mark: 'ex' }),
      T('ដែលបញ្ច្រាសគ្នា 9 និង 1, 6 និង 4 ក៏ដូចគ្នាដែរ។', { face: 'normal', o: { face: 'happy', act: 'nod' } }),
      Q({ text: '10 បំបែកជា 3 និងប៉ុន្មាន?', opts: ['6', '7'], ok: 1, fig: ['friends', { ask: 2 }], tip: 'ចូររាប់ការ៉េដែលមានពណ៌ស្រាល។',
        ng: { 0: [T('3 និង 6 បាន 9។ ចូរបន្ថែមមួយទៀត។', { face: 'think' })] },
        exp: [T('3 និង 7 ស្មើ 10។ 10 បំបែកជា 3 និង 7។', { face: 'happy', do: 'reveal' })] }),
      N({ text: '10 បំបែកជា 8 និងប៉ុន្មាន?', ans: 2, fig: ['frame10', 8, { ghost: true }], do: 'show', tip: 'ចូររាប់ការ៉េដែលមានពណ៌ស្រាល។',
        exp: [T('8 និង 2 ស្មើ 10។ 10 បំបែកជា 8 និង 2។', { face: 'happy', do: 'reveal' })] }),
      P('ពីយ៉ូយល់ហើយ! 10 បំបែកជា 6 និង 5!', { face: 'proud', fig: ['frame10', 6], do: 'show', o: { face: 'think', mark: 'q' } }),
      Q({ text: 'ចម្លើយរបស់ពីយ៉ូ ត្រូវទេ?', opts: ['ត្រូវ', 'ខុស'], ok: 1, tip: 'ចូររាប់ប្លុកពណ៌ក្រហម។',
        ng: { 0: [T('ចូររាប់ប្លុកក្រហមម្តងមួយ។', { face: 'think' })] },
        exp: [T('ក្រហម 4។ 10 បំបែកជា 6 និង 4។', { face: 'happy', do: 'count' })] }),
      P('អ្ហា៎ ពីយ៉ូច្រឡំ 5 និង 4! អរគុណ!', { face: 'confused', mark: 'sweat', o: { face: 'happy' } }),
      BREAK(),

      ST(3),
      T('ការប្រកួត! ប្លុកលាក់ខ្លួន!', { face: 'cheer', act: 'hop', clearNotes: true, note: { id: 'kb', kind: 'title', tag: 'ការប្រកួត', text: 'លាក់ខ្លួន', x: NX, y: 22 }, fig: ['hide', 7], do: 'show' }),
      TAP({ text: 'ចូរគ្របក្រណាត់ ដើម្បីលាក់ប្លុក!', btn: 'លាក់!', run: { do: 'cover' } }),
      N({ text: 'ខៀវ 7។ តើក្រហមដែលលាក់មានប៉ុន្មាន?', ans: 3, unit: 'ដុំ', tip: 'ប្រអប់ 10 មានសរុប 10។',
        exp: [T('7 និង 3 ស្មើ 10។ ក្រោមក្រណាត់មាន 3!', { face: 'happy', do: 'open' })] }),
      P('អស្ចារ្យ! ជាមិត្តរបស់ 10!', { face: 'cheer', act: 'jump', mark: 'sparkle' }),
      Q({ text: 'ខៀវ 4។ តើក្រហមដែលលាក់មានប៉ុន្មាន?', opts: ['5', '6', '7'], ok: 1, fig: ['hide', 4, { covered: true }], tip: 'តើមិត្តរបស់ 4 ជាប៉ុន្មាន?',
        ng: { 0: [T('4 និង 5 បាន 9។ ដើម្បីឱ្យបាន 10 តើជាប៉ុន្មាន?', { face: 'think' })], 2: [T('4 និង 7 ស្មើ 11។ លើស 10 ហើយ។', { face: 'think' })] },
        exp: [T('4 និង 6 ស្មើ 10។ ក្រោមក្រណាត់មាន 6!', { face: 'happy', do: 'open' })] }),
      N({ text: 'ខៀវ 9។ តើក្រហមដែលលាក់មានប៉ុន្មាន?', ans: 1, unit: 'ដុំ', fig: ['hide', 9, { covered: true }], tip: '9 និងប៉ុន្មានទើបបាន 10?',
        exp: [T('9 និង 1 ស្មើ 10។ ក្រោមក្រណាត់មាន 1!', { face: 'happy', do: 'open' })] }),
      N({ who: 'piyo', text: 'ពីពីយ៉ូ! ខៀវ 2។ តើក្រហមដែលលាក់មានប៉ុន្មាន?', ans: 8, unit: 'ដុំ', fig: ['hide', 2, { covered: true }], tip: '2 និងប៉ុន្មានទើបបាន 10?',
        exp: [T('2 និង 8 ស្មើ 10។ ក្រោមក្រណាត់មាន 8!', { face: 'happy', do: 'open' })] }),
      T('អស្ចារ្យ! ការលាក់ខ្លួនត្រូវទាំងអស់!', { face: 'cheer', act: 'jump', mark: 'sparkle' }),
      T('នេះជាការសង្ខេបសម្រាប់ថ្ងៃនេះ។', { face: 'happy', clearNotes: true, note: meate }),
      T('10 បំបែកជា 1 និង 9, 2 និង 8, 3 និង 7, 4 និង 6, 5 និង 5។', { face: 'proud', fig: ['friends'] }),
      P('មិត្តរបស់ 10 ពីយ៉ូនិយាយបានទាំងអស់!', { face: 'cheer', act: 'spin', mark: 'sparkle' }),
      T('នេះគឺជាមូលដ្ឋាននៃការបូក។ លើកក្រោយនឹងសប្បាយទៀត!', { face: 'happy' }),
      END({ text: 'ថ្ងៃនេះក៏ខំប្រឹងណាស់ដែរ! ត្រា «ល្អណាស់»!' })
    ]
  });
})();
