/* 1年「いくつと いくつ」第2回：6・7は いくつと いくつ
   さいころ 2つで 6（2と 4・1と ？・3と ？）→ ブロックで 6の わけかたを ならべる → カードを うごかして「6は 2と □」→
   7の ひょうの ぬけた ところを タップで うめる → 左の かずは 1ふえ、 右の かずは 1へる（きまり）→ ピヨの まちがい（7は 3と 5？）を なおす。
   1年なので：ひらがなと 分かち書き・みじかい 文・ゆっくり・2たくが 中心。 */
(function () {
  const { T, P, Q, N, TAP, ACT, ST, BREAK, END } = HS;
  const C = FL.COL, NX = 700, INK = '#3b2a1e';
  const meate = { id: 'meate', kind: 'title', tag: 'គោលដៅ', text: 'ចូរបំបែក 6 និង 7', x: NX, y: 22 };
  const GHOST = '<rect x="-14" y="-14" width="28" height="28" rx="5" fill="#fff" stroke="#adb5bd" stroke-width="2.5" stroke-dasharray="5 4"/>';

  /* さいころ（中心 cx,cy・1へん s・目の かず v。 v＝0 なら「？」） */
  function die(F, cx, cy, s, v, parent) {
    const g = F.g({}, parent);
    F.rect(cx - s / 2, cy - s / 2, s, s, { rx: s * 0.16, fill: '#fff', stroke: '#5a3a22', 'stroke-width': 4 }, g);
    if (!v) { F.text(cx, cy, '？', { 'font-size': s * 0.6, fill: '#adb5bd' }, g); return g; }
    const d = s * 0.25, PS = { tl: [-d, -d], tr: [d, -d], ml: [-d, 0], mr: [d, 0], bl: [-d, d], br: [d, d], c: [0, 0] };
    const MAP = { 1: ['c'], 2: ['tl', 'br'], 3: ['tl', 'c', 'br'], 4: ['tl', 'tr', 'bl', 'br'], 5: ['tl', 'tr', 'c', 'bl', 'br'], 6: ['tl', 'tr', 'ml', 'mr', 'bl', 'br'] };
    MAP[v].forEach(k => F.circle(cx + PS[k][0], cy + PS[k][1], s * 0.085, { fill: v === 1 ? '#ef4f4f' : '#2b2b2b' }, g));
    return g;
  }

  /* さいころ 2つ。 左は a、 右は n－a。 ask＝true なら 右は「？」（reveal で あかす） */
  function dice(F, n, a, ask) {
    const b = n - a, CX = [170, 450], CY = 142, S = 130;
    const gl = die(F, CX[0], CY, S, a); gl.style.opacity = 0;
    let gr = die(F, CX[1], CY, S, ask ? 0 : b); gr.style.opacity = 0;
    const la = F.label(CX[0], 250, String(a), { cls: 'xl', color: C.blue, hide: true });
    const lb = F.label(CX[1], 250, ask ? '？' : String(b), { cls: 'xl', color: C.red, hide: true });
    const so = F.label(310, 336, 'សរុប ' + n, { cls: 'l', color: C.pink, hide: true });
    return {
      async show() {
        F.sfx('pop'); gl.style.opacity = 1; await F.show(gl, 'pop', 0.4); F.show(la);
        F.sfx('pop'); gr.style.opacity = 1; await F.show(gr, 'pop', 0.4); await F.show(lb);
      },
      async reveal() {
        const ng = die(F, CX[1], CY, S, b); ng.style.opacity = 0; gr.remove(); gr = ng;
        F.setText(lb, String(b)); lb.style.color = C.red; F.sfx('pop'); await F.show(ng, 'pop', 0.4);
      },
      async sum() { F.sfx('pop'); await F.show(so); }
    };
  }

  /* ひょう：n の わけかたを ならべる。
     o.hidden＝はじめは かくす（all で 1つずつ）・o.ask＝その行の 右の かずを「？」に（reveal）・o.gaps＝ぬけた 行（fill で タップして うめる）・o.hi＝その行を かこむ */
  function rows(F, n, o) {
    o = o || {};
    const gaps = o.gaps || [];
    const m = n - 1, rs = Math.min(74, Math.floor(300 / m)), y0 = 196 - (m - 1) * rs / 2, s = n <= 5 ? 44 : n === 6 ? 38 : 34, sp = s + 6, bx = 290, fs = Math.min(56, rs * 0.8);
    const R = [];
    for (let i = 0; i < m; i++) {
      const a = i + 1, b = n - a, y = y0 + i * rs, gap = gaps.includes(i), g = F.g(o.hidden || gap ? { opacity: 0 } : {});
      F.rect(58, y - rs / 2 + 3, 532, rs - 6, { rx: 16, fill: i % 2 ? '#fffdf6' : '#fff7e0' }, g);
      F.text(84, y, String(a), { 'font-size': fs, fill: C.blue }, g);
      F.text(140, y, 'និង', { 'font-size': fs * 0.62, fill: INK }, g);
      const tb = F.text(196, y, String(b), { 'font-size': fs, fill: C.red }, g);
      const blocks = [];
      for (let j = 0; j < n; j++) blocks.push(FL.icon(F, j < a ? 'block' : 'blockR', bx + j * sp, y, s, g));
      if (o.ask === i) { tb.textContent = '？'; tb.setAttribute('fill', '#adb5bd'); blocks.slice(a).forEach(bl => { bl.innerHTML = GHOST; }); }
      let ph = null;
      if (gap) {
        ph = F.g(o.hidden ? { opacity: 0 } : {});
        F.rect(58, y - rs / 2 + 3, 532, rs - 6, { rx: 16, fill: '#fff', stroke: '#adb5bd', 'stroke-width': 4, 'stroke-dasharray': '10 8' }, ph);
        F.text(324, y, '？', { 'font-size': fs, fill: '#adb5bd' }, ph);
      }
      R.push({ i, a, b, y, g, ph, tb, blocks, gShown: !o.hidden && !gap, pShown: !o.hidden, done: false });
    }
    const mkHi = i => F.rect(50, R[i].y - rs / 2 + 1, 548, rs - 2, { rx: 18, fill: 'none', stroke: C.pink, 'stroke-width': 5, 'stroke-dasharray': '12 8', 'pointer-events': 'none', opacity: 0 });
    const hiR = o.hi !== undefined ? mkHi(o.hi) : null; if (hiR) hiR.style.opacity = 1;
    const reveal1 = (r, now) => {
      r.done = true; r.ph.style.opacity = 0; r.ph.style.pointerEvents = 'none'; r.ph.classList.remove('tapme'); r.g.style.opacity = 1;
      if (!now) return F.show(r.g, 'pop', 0.4);
    };
    return {
      async all() {
        for (const r of R) {
          if (r.ph && !r.pShown) { r.pShown = true; F.sfx('pop'); await F.show(r.ph, 'pop', 0.35); }
          else if (!r.ph && !r.gShown) { r.gShown = true; F.sfx('pop'); await F.show(r.g, 'pop', 0.35); }
          await F.wait(0.1);
        }
      },
      /* ぬけた 行を タップして うめる */
      async fill() {
        const todo = R.filter(r => r.ph && !r.done);
        const it = F.interact(() => todo.forEach(r => { if (!r.done) reveal1(r, true); }));
        todo.forEach(r => {
          r.ph.classList.add('tapme');
          r.ph.addEventListener('pointerdown', ev => { ev.preventDefault(); if (it.over || r.done) return; reveal1(r); F.sfx('ok'); if (todo.every(q => q.done)) it.done(); });
        });
        await it.promise;
      },
      async reveal() {
        const r = R[o.ask]; r.tb.textContent = String(r.b); r.tb.setAttribute('fill', C.red); r.blocks.slice(r.a).forEach(bl => { bl.innerHTML = FL.ICON.blockR; });
        F.sfx('pop'); await F.show(r.tb, 'pop', 0.4);
      },
      async hi(i) { const h = hiR || mkHi(i); h.style.opacity = 1; await F.draw(h, 0.6); },
      /* きまり：'L'＝左の かずは 1ずつ ふえる（＋1）／'R'＝右の かずは 1ずつ へる（−1） */
      async pat(side) {
        const L = side === 'L', col = L ? C.blue : C.red, x = L ? 32 : 236;
        const fr = F.rect(L ? 62 : 172, y0 - rs / 2 + 3, 48, m * rs - 6, { rx: 12, fill: 'none', stroke: col, 'stroke-width': 4, 'stroke-dasharray': '9 7', 'pointer-events': 'none', opacity: 0 });
        await F.draw(fr, 0.5);
        for (let i = 0; i < m - 1; i++) { const t = F.text(x, y0 + i * rs + rs / 2, L ? '+1' : '−1', { 'font-size': 28, fill: col, opacity: 0 }); F.sfx('count'); await F.show(t, 'pop', 0.3); await F.wait(0.08); }
      }
    };
  }

  /* カード：「n は a と □」。 カード（vals）を □ へ ゆびで うごかす。 まちがった カードは もどる */
  function cards(F, n, a, vals) {
    const c = n - a, BS = 50, sp = 58, bx0 = 310 - (n - 1) * sp / 2, by = 82, EY = 192, SX = 404;
    const blocks = [];
    for (let j = 0; j < n; j++) { const ic = FL.icon(F, j < a ? 'block' : 'blockR', bx0 + j * sp, by, BS); if (j >= a) ic.innerHTML = GHOST; blocks.push(ic); }
    const tx = (x, t, sz, col) => F.text(x, EY, t, { 'font-size': sz, fill: col || INK });
    tx(96, String(n), 76); tx(170, 'ជា', 52); tx(244, String(a), 76, C.blue); tx(318, 'និង', 52);
    F.rect(SX - 44, EY - 44, 88, 88, { rx: 14, fill: 'rgba(255,135,135,.12)', stroke: C.red, 'stroke-width': 4, 'stroke-dasharray': '10 8', 'pointer-events': 'none' });
    const cs = vals.map((v, i) => {
      const x = 170 + i * 140, y = 312, g = F.g({ transform: `translate(${x} ${y})` });
      F.rect(-52, -46, 104, 92, { rx: 16, fill: '#fff0f5', stroke: C.pink, 'stroke-width': 5 }, g); F.text(0, 2, String(v), { 'font-size': 64, fill: C.pink }, g);
      return { g, v, x, y };
    });
    const finish = r => { r.g.setAttribute('transform', `translate(${SX} ${EY})`); r.x = SX; r.y = EY; blocks.slice(a).forEach(ic => { ic.innerHTML = FL.ICON.blockR; }); };
    return {
      async drag() {
        const it = F.interact(() => finish(cs.find(q => q.v === c)));
        const ds = cs.map(r => F.draggable(r.g, { x: r.x, y: r.y, onDrop: (x, y) => {
          if (it.over) return false;
          if (Math.hypot(x - SX, y - EY) < 66) {
            if (r.v === c) { finish(r); ds.forEach(d => d.lock()); F.sfx('ok'); F.confetti(SX, EY, 36); it.done(); return true; }
            F.sfx('ng');
          }
          return false;
        } }));
        await it.promise;
        ds.forEach(d => d.lock());
      }
    };
  }

  HS.lesson({
    id: 'ikutsu-02', grade: 1, unit: 'ការបំបែក និងការផ្សំលេខ', no: 2, title: '6 និង 7 បំបែកជាប៉ុន្មាន និងប៉ុន្មាន', sticker: '🎲',
    goal: 'ចូររៀបវិធីបំបែក 6 និង 7 ហើយរកច្បាប់',
    stages: ['បំបែក 6 ដោយគ្រាប់ឡុកឡាក់', 'រៀបចំ 7', 'រកច្បាប់'],
    figs: {
      dice(F, n, a, ask) { return dice(F, n, a, ask); },
      rows(F, n, o) { return rows(F, n, o); },
      cards(F, n, a, vals) { return cards(F, n, a, vals); }
    },
    steps: [
      ST(1),
      T('សួស្តីកូនៗទាំងអស់គ្នា! ថ្ងៃនេះយើងសាកល្បងបំបែក 6 និង 7។', { face: 'happy', act: 'hop', o: { face: 'happy' }, note: meate }),
      P('ពីយ៉ូចាំវិធីបំបែក 5 ហើយ!', { face: 'cheer', act: 'jump', mark: 'note' }),
      T('មានគ្រាប់ឡុកឡាក់ 2។ សូមមើលចំនួនចំណុចលើមុខ។', { face: 'normal', fig: ['dice', 6, 2], do: 'show' }),
      T('2 និង 4។ បូកបានជា 6។', { face: 'happy', do: 'sum' }),
      P('តើមានមុខផ្សេងទៀតទេ?', { face: 'think', mark: 'q' }),
      Q({ text: 'ចំណុចខាងឆ្វេងគឺ 1។ សរុប 6។ ចុះខាងស្តាំ?', opts: ['4', '5'], ok: 1, fig: ['dice', 6, 1, true], do: 'show', tip: '1 និងប៉ុន្មានទើបបាន 6?',
        ng: { 0: [T('1 និង 4 ស្មើ 5។ ដើម្បីឱ្យបាន 6 តើត្រូវធ្វើយ៉ាងណា?', { face: 'think' })] },
        exp: [T('1 និង 5 ស្មើ 6។ ខាងស្តាំគឺ 5។', { face: 'happy', do: 'reveal' })] }),
      Q({ text: 'ចំណុចខាងឆ្វេងគឺ 3។ សរុប 6។ ចុះខាងស្តាំ?', opts: ['2', '3', '4'], ok: 1, fig: ['dice', 6, 3, true], do: 'show', tip: '3 និងប៉ុន្មានទើបបាន 6?',
        ng: { 0: [T('3 និង 2 ស្មើ 5។ ចូរបន្ថែមមួយទៀត។', { face: 'think' })], 2: [T('3 និង 4 ស្មើ 7។ ធំជាង 6។', { face: 'think' })] },
        exp: [T('3 និង 3 ស្មើ 6។ ខាងស្តាំក៏ 3 ដែរ។', { face: 'happy', do: 'reveal' })] }),
      P('3 និង 3! អាចបំបែកជាចំនួនស្មើគ្នាបាន!', { face: 'surprised', act: 'jump', mark: 'ex' }),
      T('ចូររៀបវិធីបំបែក 6 ទាំងអស់ដោយប្លុក។', { face: 'normal', clearNotes: true, note: meate, fig: ['rows', 6, { hidden: true }] }),
      TAP({ text: 'ចុចប៊ូតុង ហើយរៀបចំ!', btn: 'រៀបចំ!', run: { do: 'all' } }),
      T('1 និង 5, 2 និង 4, 3 និង 3, 4 និង 2, 5 និង 1។', { face: 'happy' }),
      T('លើកនេះ ចូរសាកល្បងរំកិលកាត។', { face: 'normal', fig: ['cards', 6, 2, [5, 3, 4]] }),
      ACT({ text: '6 បំបែកជា 2 និងប៉ុន្មាន? ចូរដាក់កាតដែលត្រូវ!', hint: 'ចូរប្រើម្រាមដៃរំកិលកាត', run: { do: 'drag' }, face: 'normal' }),
      P('6 បំបែកជា 2 និង 4! ត្រូវបេះបិទ!', { face: 'cheer', act: 'jump', mark: 'sparkle' }),
      BREAK(),

      ST(2),
      T('បន្ទាប់ជាវិធីបំបែក 7។ មានកន្លែងខ្វះ!', { face: 'surprised', clearNotes: true, note: meate, fig: ['rows', 7, { hidden: true, gaps: [2, 4] }], do: 'all' }),
      P('មែនហើយ! មានសញ្ញាសួរ 2!', { face: 'surprised', act: 'hop', mark: 'q' }),
      ACT({ text: 'ចូរចុចសញ្ញាសួរ ដើម្បីបំពេញ!', hint: 'ចូរប៉ះសញ្ញាសួរ', run: { do: 'fill' }, face: 'normal' }),
      T('រៀបអស់ហើយ។ វិធីបំបែក 7 មាន 6 យ៉ាង។', { face: 'happy' }),
      N({ text: '7 បំបែកជា 4 និងប៉ុន្មាន?', ans: 3, fig: ['rows', 7, { ask: 3 }], tip: 'ចូររាប់ការ៉េដែលមានពណ៌ស្រាល។',
        exp: [T('4 និង 3 ស្មើ 7។ 7 បំបែកជា 4 និង 3។', { face: 'happy', do: 'reveal' })] }),
      N({ text: '7 បំបែកជា 6 និងប៉ុន្មាន?', ans: 1, fig: ['rows', 7, { ask: 5 }], tip: 'ចូររាប់ការ៉េដែលមានពណ៌ស្រាល។',
        exp: [T('6 និង 1 ស្មើ 7។ 7 បំបែកជា 6 និង 1។', { face: 'happy', do: 'reveal' })] }),

      ST(3),
      T('មើលជួរនៃ 7។ តើលេខខាងឆ្វេងយ៉ាងដូចម្តេច?', { face: 'normal', clearNotes: true, note: meate, fig: ['rows', 7] }),
      Q({ text: 'តើលេខខាងឆ្វេងប្រែប្រួលយ៉ាងដូចម្តេច?', opts: ['កើនម្តង 1', 'ថយម្តង 1'], ok: 0, tip: 'ចូរមើលពីលើចុះក្រោម 1, 2, 3, 4…',
        ng: { 1: [T('1, 2, 3… កាន់តែធំ។', { face: 'think' })] },
        exp: [T('1, 2, 3, 4, 5, 6។ កើនម្តង 1។', { face: 'happy', do: ['pat', 'L'] })] }),
      Q({ text: 'តើលេខខាងស្តាំប្រែប្រួលយ៉ាងដូចម្តេច?', opts: ['កើនម្តង 1', 'ថយម្តង 1'], ok: 1, tip: 'ចូរមើលពីលើចុះក្រោម 6, 5, 4…',
        ng: { 0: [T('6, 5, 4… កាន់តែតូច។', { face: 'think' })] },
        exp: [T('6, 5, 4, 3, 2, 1។ ថយម្តង 1។', { face: 'happy', do: ['pat', 'R'] })] }),
      P('ខាងឆ្វេងកើន 1 ខាងស្តាំថយ 1!', { face: 'surprised', act: 'jump', mark: 'idea' }),
      T('ដូច្នេះ បូកបញ្ចូលគ្នា តែងតែបាន 7។', { face: 'proud', note: { id: 'kimari', kind: 'formula', text: 'ខាងឆ្វេងកើន 1\nខាងស្តាំថយ 1', x: NX + 20, y: 110 } }),
      P('ពីយ៉ូយល់ហើយ! 7 បំបែកជា 3 និង 5!', { face: 'proud', fig: ['rows', 7, { hi: 2 }], o: { face: 'think', mark: 'q' } }),
      Q({ text: 'ចម្លើយរបស់ពីយ៉ូ ត្រូវទេ?', opts: ['ត្រូវ', 'ខុស'], ok: 1, tip: 'សូមមើលនៅក្បែរ 3។',
        ng: { 0: [T('សូមមើលលេខដែលសរសេរនៅក្បែរ 3។', { face: 'think' })] },
        exp: [T('នៅក្បែរ 3 គឺ 4។ 7 បំបែកជា 3 និង 4។', { face: 'happy' })] }),
      P('អ្ហា៎ ពិតមែនហើយ! អរគុណ!', { face: 'confused', mark: 'sweat', o: { face: 'happy' } }),
      N({ text: '6 បំបែកជា 4 និងប៉ុន្មាន?', ans: 2, fig: ['rows', 6, { ask: 3 }], tip: 'ចូររាប់ការ៉េដែលមានពណ៌ស្រាល។',
        exp: [T('4 និង 2 ស្មើ 6។ 6 បំបែកជា 4 និង 2។', { face: 'happy', do: 'reveal' })] }),
      N({ who: 'piyo', text: 'ចុងក្រោយ ពីពីយ៉ូ! 7 បំបែកជា 2 និងប៉ុន្មាន?', ans: 5, fig: ['rows', 7, { ask: 1 }], tip: 'ចូររាប់ការ៉េដែលមានពណ៌ស្រាល។',
        exp: [T('2 និង 5 ស្មើ 7។ 7 បំបែកជា 2 និង 5។', { face: 'happy', do: 'reveal' })] }),
      T('នេះជាការសង្ខេបសម្រាប់ថ្ងៃនេះ។', { face: 'happy', clearNotes: true, note: meate }),
      T('ពេលខាងឆ្វេងកើន ខាងស្តាំថយ។ បូកគ្នាតែងតែដដែល។', { face: 'proud', note: { id: 'sum', kind: 'formula', text: 'ខាងឆ្វេងកើន\nខាងស្តាំថយ', x: NX + 20, y: 100 } }),
      P('6 និង 7 ក៏រួចរាល់ដែរ!', { face: 'cheer', act: 'spin', mark: 'sparkle' }),
      T('លើកក្រោយ យើងនឹងបំបែក 8 និង 9។', { face: 'happy' }),
      END({ text: 'ថ្ងៃនេះក៏ខំប្រឹងណាស់ដែរ! ត្រា «ល្អណាស់»!' })
    ]
  });
})();
