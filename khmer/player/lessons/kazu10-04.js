/* 1年「10までの かず」第4回：なんばんめ
   でんしゃに どうぶつが 5ひき（まえは ひだり・うしろは みぎ）→「3びき」と「3ばんめ」の ちがい →
   まえから 3ばんめを タップ → ピヨが うしろから かぞえて まちがえる → うしろから 2ばんめを タップ →
   おなじ どうぶつでも かぞえる むきで ばんごうが かわる。
   1年なので：ひらがなと 分かち書き・みじかい 文・ゆっくり・2たくが 中心。 */
(function () {
  const { T, P, Q, N, TAP, ACT, ST, BREAK, END } = HS;
  const C = FL.COL, NX = 700, INK = '#3b2a1e';
  const meate = { id: 'meate', kind: 'title', tag: 'គោលដៅ', text: 'ចូរនិយាយថាវាជាទីប៉ុន្មាន', x: NX, y: 22 };
  const NAMES = ['ឆ្មា', 'ឆ្កែ', 'ទន្សាយ', 'ខ្លាឃ្មុំ', 'ជ្រូក'], KINDS = ['cat', 'dog', 'rabbit', 'bear', 'pig'];

  /* えらんで さわる（タップ）：cards＝[{ g（さわる ところ）, rect（わく）, cx, cy }]。 ok番号を さわると おわり。 ちがう ときは ぶるっと する */
  function pickTap(F, cards, ok) {
    let wrong = 0, hit = false;
    const good = c => { c.rect.setAttribute('fill', '#d3f9d8'); c.rect.setAttribute('stroke', C.green); c.rect.setAttribute('stroke-width', 6); };
    const it = F.interact(() => good(cards[ok]));
    cards.forEach((c, i) => {
      c.g.classList.add('tapme');
      c.g.addEventListener('pointerdown', ev => {
        ev.preventDefault(); if (it.over || hit) return;
        if (i === ok) { hit = true; good(c); cards.forEach(d => d.g.classList.remove('tapme')); F.sfx('ok'); F.confetti(c.cx, c.cy, 30); F.wait(0.7).then(() => it.done()); return; }
        wrong++; F.sfx('ng');
        const old = c.rect.getAttribute('stroke'); c.rect.setAttribute('stroke', C.red);
        F.wait(0.5).then(() => c.rect.setAttribute('stroke', old));
        if (wrong >= 2) cards[ok].rect.setAttribute('stroke', C.ye);   // 2かい まちがえたら、 ただしい ほうに ヒント
      });
    });
    return it.promise;
  }

  /* どうぶつの かお（中心 cx,cy・大きさ s） */
  function animal(F, kind, cx, cy, s, parent) {
    const g = F.g({ transform: `translate(${cx} ${cy}) scale(${s / 60})` }, parent);
    const eyes = () => { F.circle(-10, -2, 3.8, { fill: '#2b2b2b' }, g); F.circle(10, -2, 3.8, { fill: '#2b2b2b' }, g); F.circle(-9, -3.4, 1.2, { fill: '#fff' }, g); F.circle(11, -3.4, 1.2, { fill: '#fff' }, g); };
    const mouth = () => F.path('M-6 12q6 6 12 0', { fill: 'none', stroke: '#5a3a22', 'stroke-width': 2.2 }, g);
    if (kind === 'cat') {
      F.path('M-27 -8L-24 -36L-6 -24Z', { fill: '#ffb35c', stroke: '#c26a14', 'stroke-width': 2.5 }, g); F.path('M27 -8L24 -36L6 -24Z', { fill: '#ffb35c', stroke: '#c26a14', 'stroke-width': 2.5 }, g);
      F.path('M-23 -14L-21 -29L-11 -22Z', { fill: '#ffc9d6' }, g); F.path('M23 -14L21 -29L11 -22Z', { fill: '#ffc9d6' }, g);
      F.circle(0, 0, 28, { fill: '#ffb35c', stroke: '#c26a14', 'stroke-width': 2.5 }, g); eyes();
      F.path('M-3 6h6l-3 4z', { fill: '#ff6b8b' }, g); mouth();
      F.path('M-16 8L-30 5M-16 12L-30 14M16 8L30 5M16 12L30 14', { stroke: '#7a4a1a', 'stroke-width': 1.6, fill: 'none' }, g);
    } else if (kind === 'dog') {
      F.el('ellipse', { cx: -26, cy: -4, rx: 10, ry: 18, fill: '#8a5a2b', transform: 'rotate(18 -26 -4)' }, g); F.el('ellipse', { cx: 26, cy: -4, rx: 10, ry: 18, fill: '#8a5a2b', transform: 'rotate(-18 26 -4)' }, g);
      F.circle(0, 0, 27, { fill: '#e8c39e', stroke: '#8a5a2b', 'stroke-width': 2.5 }, g); F.el('ellipse', { cx: 0, cy: 9, rx: 12, ry: 9, fill: '#f6e3cf' }, g);
      eyes(); F.el('ellipse', { cx: 0, cy: 5, rx: 5.5, ry: 4, fill: '#2b2b2b' }, g); F.path('M0 9v3M0 12q-5 4 -9 1M0 12q5 4 9 1', { fill: 'none', stroke: '#5a3a22', 'stroke-width': 2 }, g);
    } else if (kind === 'rabbit') {
      F.el('ellipse', { cx: -12, cy: -36, rx: 8, ry: 20, fill: '#fff', stroke: '#9aa0a6', 'stroke-width': 2.5 }, g); F.el('ellipse', { cx: 12, cy: -36, rx: 8, ry: 20, fill: '#fff', stroke: '#9aa0a6', 'stroke-width': 2.5 }, g);
      F.el('ellipse', { cx: -12, cy: -35, rx: 3.5, ry: 13, fill: '#ffc9d6' }, g); F.el('ellipse', { cx: 12, cy: -35, rx: 3.5, ry: 13, fill: '#ffc9d6' }, g);
      F.circle(0, 0, 26, { fill: '#fff', stroke: '#9aa0a6', 'stroke-width': 2.5 }, g); eyes(); F.circle(0, 6, 3.2, { fill: '#ff6b8b' }, g); mouth();
    } else if (kind === 'bear') {
      F.circle(-22, -22, 10, { fill: '#b9824a', stroke: '#6b4423', 'stroke-width': 2.5 }, g); F.circle(22, -22, 10, { fill: '#b9824a', stroke: '#6b4423', 'stroke-width': 2.5 }, g);
      F.circle(-22, -22, 5, { fill: '#e0b080' }, g); F.circle(22, -22, 5, { fill: '#e0b080' }, g);
      F.circle(0, 0, 28, { fill: '#b9824a', stroke: '#6b4423', 'stroke-width': 2.5 }, g); F.el('ellipse', { cx: 0, cy: 9, rx: 13, ry: 10, fill: '#f0d4b0' }, g);
      eyes(); F.el('ellipse', { cx: 0, cy: 5, rx: 4.5, ry: 3.4, fill: '#2b2b2b' }, g); F.path('M0 8v3M0 11q-4 3 -7 1M0 11q4 3 7 1', { fill: 'none', stroke: '#5a3a22', 'stroke-width': 2 }, g);
    } else {   // pig
      F.path('M-24 -16L-22 -34L-6 -24Z', { fill: '#ffb3c6', stroke: '#d6336c', 'stroke-width': 2.5 }, g); F.path('M24 -16L22 -34L6 -24Z', { fill: '#ffb3c6', stroke: '#d6336c', 'stroke-width': 2.5 }, g);
      F.circle(0, 0, 28, { fill: '#ffb3c6', stroke: '#d6336c', 'stroke-width': 2.5 }, g); eyes();
      F.el('ellipse', { cx: 0, cy: 8, rx: 12, ry: 9, fill: '#ff8fab', stroke: '#d6336c', 'stroke-width': 2 }, g); F.circle(-4.5, 8, 2.2, { fill: '#a61e4d' }, g); F.circle(4.5, 8, 2.2, { fill: '#a61e4d' }, g);
    }
    return g;
  }

  HS.lesson({
    id: 'kazu10-04', grade: 1, unit: 'លេខរហូតដល់ 10', no: 4, title: 'ទីប៉ុន្មាន', sticker: '🚃',
    goal: 'ចូរនិយាយថាទីប៉ុន្មានពីខាងមុខ ឬទីប៉ុន្មានពីខាងក្រោយ',
    stages: ['3 ក្បាល និងទី 3', 'ទីប៉ុន្មានពីខាងមុខ', 'ទីប៉ុន្មានពីខាងក្រោយ'],
    figs: {
      /* どうぶつの でんしゃ（まえ＝ひだり）。 5ひき： ねこ いぬ うさぎ くま ぶた */
      train(F) {
        const CX = i => 124 + i * 96 + 44;
        F.line(0, 268, 620, 268, { stroke: '#adb5bd', 'stroke-width': 6 });
        const eng = F.g({ opacity: 0 });
        F.rect(24, 154, 20, 30, { rx: 4, fill: '#495057' }, eng); F.rect(70, 150, 46, 40, { rx: 8, fill: '#c92a2a' }, eng);
        F.rect(14, 182, 102, 66, { rx: 14, fill: '#ff8787', stroke: '#c92a2a', 'stroke-width': 4 }, eng); F.circle(94, 168, 10, { fill: '#fff' }, eng); F.circle(18, 214, 8, { fill: '#ffd43b', stroke: '#e67700', 'stroke-width': 2 }, eng);
        F.circle(44, 252, 15, { fill: '#495057' }, eng); F.circle(92, 252, 15, { fill: '#495057' }, eng);
        const cars = [], hits = [];
        for (let i = 0; i < 5; i++) {
          const x = 124 + i * 96, g = F.g({ opacity: 0 });
          F.line(x - 8, 232, x, 232, { stroke: '#495057', 'stroke-width': 6 }, g);
          const rect = F.rect(x, 156, 88, 92, { rx: 12, fill: '#a5d8ff', stroke: '#1971c2', 'stroke-width': 4 }, g);
          F.circle(x + 24, 252, 12, { fill: '#495057' }, g); F.circle(x + 64, 252, 12, { fill: '#495057' }, g);
          F.circle(x + 44, 206, 38, { fill: '#fff', stroke: '#74c0fc', 'stroke-width': 3 }, g);
          const an = animal(F, KINDS[i], x + 44, 208, 66, g);
          cars.push({ g, rect, an });
        }
        const dirL = F.g({ opacity: 0 }), dirR = F.g({ opacity: 0 });
        F.line(138, 120, 40, 120, { stroke: C.red, 'stroke-width': 7 }, dirL); F.path('M26 120l20 -13v26z', { fill: C.red }, dirL);
        F.line(486, 120, 584, 120, { stroke: C.blue, 'stroke-width': 7 }, dirR); F.path('M598 120l-20 -13v26z', { fill: C.blue }, dirR);
        const lM = F.label(78, 84, 'មុខ', { cls: 'l', color: C.red, hide: true }), lU = F.label(548, 84, 'ក្រោយ', { cls: 'l', color: C.blue, hide: true });
        const bg = F.g({}), rows = F.g({});
        const badges = (y, col, fromBack, cap) => {
          const g = F.g({ opacity: 0 }, rows);
          F.text(64, y, cap, { 'font-size': 24, fill: col }, g);
          for (let i = 0; i < 5; i++) { const n = fromBack ? 5 - i : i + 1; F.circle(CX(i), y, 19, { fill: col, stroke: '#fff', 'stroke-width': 3 }, g); F.text(CX(i), y + 1, String(n), { 'font-size': 24, fill: '#fff' }, g); }
          return g;
        };
        const rowF = badges(300, C.red, false, 'ពីខាងមុខ'), rowB = badges(346, C.blue, true, 'ពីខាងក្រោយ');
        let marks = [], lbls = [];
        const clearMarks = () => {   // しるし・ばんごう・えらんだ ときの みどりを ぜんぶ もとに
          marks.forEach(m => m.remove()); lbls.forEach(m => m.remove()); marks = []; lbls = []; rowF.style.opacity = 0; rowB.style.opacity = 0;
          cars.forEach(c => { c.rect.setAttribute('fill', '#a5d8ff'); c.rect.setAttribute('stroke', '#1971c2'); c.rect.setAttribute('stroke-width', 4); });
        };
        const dropLabels = () => { lbls.forEach(m => m.remove()); lbls = []; };
        /* 上に かさねる さわる ところ（いちばん さいごに つくる） */
        const hitg = F.g({});
        for (let i = 0; i < 5; i++) { const x = 124 + i * 96; const h = F.rect(x - 4, 140, 96, 118, { fill: '#fff', 'fill-opacity': 0.01 }, hitg); hits.push({ g: h, rect: cars[i].rect, cx: x + 44, cy: 206 }); }
        const pop = async (el, t) => { el.style.opacity = 1; await F.show(el, 'pop', t || 0.3); };
        return {
          async show() {
            await pop(eng, 0.4);
            for (const c of cars) { c.g.style.opacity = 1; F.sfx('pop'); F.show(c.g, 'pop', 0.3); await F.wait(0.14); }
            await F.wait(0.2);
            dirL.style.opacity = 1; dirR.style.opacity = 1; F.show(lM); F.show(lU); F.show(dirL, 'fade', 0.4); await F.show(dirR, 'fade', 0.4);
          },
          clearMarks() { clearMarks(); },
          /* まえから k ひき（かこむ） */
          async group(k) {
            clearMarks();
            const r = F.rect(124 - 8, 140, k * 96 + 2, 124, { rx: 16, fill: 'rgba(77,171,247,.10)', stroke: C.blue, 'stroke-width': 6, 'stroke-dasharray': '12 9', opacity: 0, 'pointer-events': 'none' }, bg);
            const lb = F.label(124 - 8 + (k * 96 + 2) / 2, 304, k + '', { cls: 'xl', color: C.blue, hide: true }); marks.push(r); lbls.push(lb);
            await F.draw(r, 0.6); await F.show(lb);
          },
          /* k ばんめ（ひとつ だけ かこむ）。 idx は まえから 0,1,2… */
          async one(idx, text) {
            clearMarks();
            const x = 124 + idx * 96;
            const r = F.rect(x - 4, 140, 96, 124, { rx: 16, fill: 'rgba(255,135,135,.12)', stroke: C.red, 'stroke-width': 6, 'stroke-dasharray': '12 9', opacity: 0, 'pointer-events': 'none' }, bg);
            const lb = F.label(x + 44, 304, text, { cls: 'xl', color: C.red, hide: true }); marks.push(r); lbls.push(lb);
            await F.draw(r, 0.6); await F.show(lb);
          },
          /* ばんごう：まえから／うしろから */
          async num() { dropLabels(); rowF.style.opacity = 1; F.sfx('pop'); await F.show(rowF, 'fade', 0.5); },
          async numBack() { dropLabels(); rowB.style.opacity = 1; F.sfx('pop'); await F.show(rowB, 'fade', 0.5); },
          pickFront(k) { return pickTap(F, hits, k - 1); },
          pickBack(k) { return pickTap(F, hits, 5 - k); }
        };
      }
    },
    steps: [
      ST(1),
      T('សួស្តីកូនៗទាំងអស់គ្នា! ថ្ងៃនេះយើងមើលលំដាប់ដែលគេឈរតម្រៀប។', { face: 'happy', act: 'hop', o: { face: 'happy' }, note: meate }),
      P('រថភ្លើងមកហើយ! មានសត្វជិះ!', { face: 'cheer', act: 'jump', mark: 'note', fig: 'train', do: 'show' }),
      T('មុខរថភ្លើងនៅខាងឆ្វេង។ ក្រោយនៅខាងស្តាំ។', { face: 'normal' }),
      N({ text: 'សរុបមានសត្វប៉ុន្មានក្បាល?', ans: 5, unit: 'ក្បាល', tip: 'ចូររាប់សត្វម្តងមួយ។',
        exp: [T('មួយ ពីរ បី បួន ប្រាំ។ មាន 5 ក្បាល។', { face: 'happy' })] }),
      T('ឆ្មា ឆ្កែ ទន្សាយ។ សូមមើលទាំង 3 ដែលគូសព័ទ្ធ។', { face: 'normal', do: ['group', 3] }),
      Q({ text: 'សរុប 3។ តើនេះជាមួយណា?', opts: ['3 ក្បាល', 'ទី 3'], ok: 0, tip: 'ពេលនិយាយចំនួនសរុប គេនិយាយថា «3 ក្បាល»។',
        ng: { 1: [T('«ទី 3» គឺជាទីតាំងតែមួយប៉ុណ្ណោះ។', { face: 'think' })] },
        exp: [T('សរុបទាំង 3 ដែលគូសព័ទ្ធ។ នេះហើយជា «3 ក្បាល»។', { face: 'happy' })] }),
      T('បន្ទាប់ សូមមើលតែទន្សាយ។', { face: 'normal', do: ['one', 2, '？'] }),
      N({ text: 'ទន្សាយនៅទីប៉ុន្មានពីខាងមុខ?', ans: 3, unit: '', tip: 'ឆ្មានៅខាងមុខគេជាទី 1។ បន្ទាប់ទៀតទី?',
        exp: [T('ឆ្មាទី 1 ឆ្កែទី 2 ទន្សាយទី 3។ គឺទី 3។', { face: 'happy', do: 'num' })] }),
      T('«3 ក្បាល» គឺចំនួនសរុប។ «ទី 3» គឺទីតាំងមួយ។', { face: 'proud',
        note: { id: 'chg', kind: 'formula', text: '3 ក្បាល…ចំនួនសរុប\nទី 3…ទីតាំងមួយ', x: NX + 10, y: 110 } }),
      P('ចាស់ហើយ! ខុសគ្នាទាំងស្រុង!', { face: 'surprised', act: 'jump', mark: 'ex' }),

      ST(2),
      T('ចូររាប់ពីខាងមុខ ហើយរកទី 3។', { face: 'happy', clearNotes: true, note: meate, fig: 'train', do: 'show' }),
      ACT({ text: 'ចូរចុចសត្វទី 3 ពីខាងមុខ!', hint: 'ចូរប្រើម្រាមដៃប៉ះសត្វ', run: { do: ['pickFront', 3] }, face: 'normal' }),
      P('ទន្សាយ! ទី 3 ពីខាងមុខ!', { face: 'cheer', act: 'jump', mark: 'sparkle', do: ['one', 2, 'ទី 3'] }),
      Q({ text: 'តើទី 4 ពីខាងមុខជាអ្នកណា?', opts: ['ខ្លាឃ្មុំ', 'ជ្រូក'], ok: 0, tip: 'ចូររាប់ពីខាងមុខ 1, 2, 3, 4…', do: [['clearMarks']],
        ng: { 1: [T('ជ្រូកនៅក្រោយគេ។ ចូររាប់ម្តងទៀត។', { face: 'think' })] },
        exp: [T('ឆ្មា 1 ឆ្កែ 2 ទន្សាយ 3 ខ្លាឃ្មុំ 4។ គឺខ្លាឃ្មុំ។', { face: 'happy', do: 'num' })] }),
      N({ text: 'ឆ្មានៅទីប៉ុន្មានពីខាងមុខ?', ans: 1, unit: '', tip: 'វាជាសត្វនៅខាងមុខគេ។', do: [['clearMarks']],
        exp: [T('ឆ្មានៅខាងមុខគេ។ គឺទី 1។', { face: 'happy', do: 'num' })] }),
      P('ពីយ៉ូដឹងហើយ! ខ្លាឃ្មុំនៅទី 2 ពីខាងមុខ!', { face: 'proud', act: 'hop', do: [['clearMarks']], o: { face: 'think', mark: 'q' } }),
      Q({ text: 'ពីយ៉ូនិយាយថា «ខ្លាឃ្មុំនៅទី 2 ពីខាងមុខ»។ ត្រូវទេ?', opts: ['ត្រូវ', 'ខុស'], ok: 1, tip: 'បើរាប់ពីខាងមុខ ខ្លាឃ្មុំនៅទីប៉ុន្មាន?',
        ng: { 0: [T('ឆ្មា 1 ឆ្កែ 2 ទន្សាយ 3… ចូររាប់ម្តងទៀត។', { face: 'think' })] },
        exp: [T('ខ្លាឃ្មុំនៅទី 4 ពីខាងមុខ។', { face: 'normal', do: 'num' }), T('បើពីខាងក្រោយ គឺទី 2។ ពីយ៉ូបានរាប់ពីខាងក្រោយ។', { face: 'happy', do: 'numBack' })] }),
      P('អ្ហា៎! ពីយ៉ូរាប់ពីខាងក្រោយទៅហើយ! អរគុណ!', { face: 'confused', mark: 'sweat', o: { face: 'happy' } }),
      T('ត្រូវពិនិត្យថាពីខាងមុខ ឬពីខាងក្រោយ មុននឹងនិយាយ។', { face: 'proud', note: { id: 'rule', kind: 'formula', text: 'ពីខាងមុខ?\nពីខាងក្រោយ?', x: NX + 40, y: 110 } }),
      BREAK(),

      ST(3),
      T('ឥឡូវនេះ សាកល្បងរាប់ពីខាងក្រោយ។ ខាងក្រោយនៅខាងស្តាំ!', { face: 'happy', clearNotes: true, note: meate, fig: 'train', do: 'show' }),
      ACT({ text: 'ចូរចុចសត្វទី 2 ពីខាងក្រោយ!', hint: 'ចូរប្រើម្រាមដៃប៉ះសត្វ', run: { do: ['pickBack', 2] }, face: 'normal' }),
      P('ខ្លាឃ្មុំ! ទី 2 ពីខាងក្រោយ!', { face: 'cheer', act: 'jump', mark: 'sparkle', do: [['one', 3, 'ទី 2']] }),
      N({ text: 'ទន្សាយនៅទីប៉ុន្មានពីខាងក្រោយ?', ans: 3, unit: '', tip: 'ជ្រូកនៅក្រោយគេជាទី 1។', do: [['clearMarks']],
        exp: [T('ជ្រូកទី 1 ខ្លាឃ្មុំទី 2 ទន្សាយទី 3។ គឺទី 3។', { face: 'happy', do: 'numBack' })] }),
      Q({ text: 'ឆ្មានៅទី 1 ពីខាងមុខ។ ចុះពីខាងក្រោយ?', opts: ['ទី 1', 'ទី 5'], ok: 1, tip: 'ឆ្មានៅខាងមុខគេ។ បើរាប់ពីខាងក្រោយ?', do: [['clearMarks']],
        ng: { 0: [T('បើរាប់ពីខាងក្រោយ ឆ្មានៅចុងក្រោយគេ។', { face: 'think' })] },
        exp: [T('បើរាប់ពីខាងក្រោយ ឆ្មានៅទី 5។', { face: 'happy', do: [['num'], ['numBack']] })] }),
      T('សត្វដដែល ក៏លេខប្តូរតាមទិសដែលរាប់។', { face: 'proud', do: [['num'], ['numBack']] }),
      Q({ text: 'ជ្រូកនៅទីប៉ុន្មានពីខាងក្រោយ?', opts: ['ទី 1', 'ទី 5'], ok: 0, tip: 'ជ្រូកនៅក្រោយគេ។', do: [['clearMarks']],
        ng: { 1: [T('ទី 5 គឺពេលរាប់ពីខាងមុខ។', { face: 'think' })] },
        exp: [T('ជ្រូកនៅក្រោយគេ។ គឺទី 1 ពីខាងក្រោយ។', { face: 'happy' })] }),
      N({ text: 'ខ្លាឃ្មុំនៅទី 4 ពីខាងមុខ។ ចុះពីខាងក្រោយ?', ans: 2, unit: '', tip: 'ជ្រូកនៅក្រោយជាទី 1។ ចុះខ្លាឃ្មុំ?', do: [['clearMarks']],
        exp: [T('ជ្រូក 1 ខ្លាឃ្មុំ 2។ គឺទី 2 ពីខាងក្រោយ។', { face: 'happy' })] }),
      T('នេះជាការសង្ខេបសម្រាប់ថ្ងៃនេះ។', { face: 'happy', clearNotes: true, note: meate }),
      T('«3 ក្បាល» គឺចំនួនសរុប។ «ទី 3» គឺមួយ។', { face: 'proud', note: { id: 'sum', kind: 'formula', text: '3 ក្បាល…ចំនួនសរុប\nទី 3…ទីតាំងមួយ\nពីខាងមុខ? ពីខាងក្រោយ?', x: NX + 10, y: 100 } }),
      P('ពីខាងមុខ ឬពីខាងក្រោយ សំខាន់ណាស់!', { face: 'cheer', act: 'spin', mark: 'sparkle' }),
      T('លើកក្រោយ យើងនឹងរៀនពីលេខ 0។', { face: 'happy' }),
      END({ text: 'ថ្ងៃនេះក៏ខំប្រឹងណាស់ដែរ! ត្រា «ល្អណាស់» រូបរថភ្លើង!' })
    ]
  });
})();
