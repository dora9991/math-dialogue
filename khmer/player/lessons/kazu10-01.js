/* 1年「10までの かず」第1回：かずを かぞえよう（1〜5）
   りんごを 1こずつ さわって かぞえる（ゆびで タップ）→ すうじ 3 → みかん 4こ（ピヨが 2かい かぞえて 5こと まちがえる）→ 1〜5の すうじカード →
   あめと おなじ かずの すうじを えらぶ（タップ）→ ならべかえても かずは おなじ。
   1年なので：ひらがなと 分かち書き・みじかい 文・ゆっくり・2たくが 中心・かぞえる ものは 大きく 少なく。 */
(function () {
  const { T, P, Q, N, TAP, ACT, ST, BREAK, END } = HS;
  const C = FL.COL, NX = 700, INK = '#3b2a1e';
  const meate = { id: 'meate', kind: 'title', tag: 'គោលដៅ', text: 'ចូររាប់ចំនួនរបស់ផ្សេងៗ', x: NX, y: 22 };

  /* 一列に ならべる ばしょ／ばらばらに おく ばしょ（1〜5こ） */
  const rowPos = n => Array.from({ length: n }, (_, i) => [300 + (i - (n - 1) / 2) * 110, 190]);
  const SCAT = {
    1: [[300, 190]], 2: [[200, 180], [420, 180]], 3: [[130, 130], [330, 250], [510, 130]],
    4: [[110, 120], [290, 250], [420, 100], [540, 240]], 5: [[100, 250], [190, 110], [330, 240], [440, 100], [540, 240]]
  };
  /* 左の わくの なかに おく ばしょ（x 20〜340） */
  const SCATL = {
    1: [[180, 200]], 2: [[110, 160], [250, 240]], 3: [[100, 120], [240, 200], [130, 290]],
    4: [[100, 120], [250, 110], [110, 270], [250, 260]], 5: [[90, 110], [250, 100], [170, 200], [90, 290], [250, 280]]
  };

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
        try { c.g.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-9px)' }, { transform: 'translateX(9px)' }, { transform: 'translateX(0)' }], { duration: 320 }); } catch (er) { /* なくてよい */ }
        F.wait(0.5).then(() => c.rect.setAttribute('stroke', old));
        if (wrong >= 2) cards[ok].rect.setAttribute('stroke', C.ye);   // 2かい まちがえたら、 ただしい ほうに ヒント
      });
    });
    return it.promise;
  }

  HS.lesson({
    id: 'kazu10-01', grade: 1, unit: 'លេខរហូតដល់ 10', no: 1, title: 'ចូររាប់លេខ', sticker: '🍎',
    goal: 'រាប់ចំនួនរបស់ រួចសរសេរជាលេខ',
    stages: ['សាកល្បងរាប់', 'ភ្ជាប់ជាមួយលេខ', 'បើតម្រៀបឡើងវិញ?'],
    figs: {
      /* ものを n こ。 layout：'row'（1れつ）か 'mix'（ばらばら） */
      things(F, kind, n, layout) {
        const pos = layout === 'mix' ? SCAT[n] : rowPos(n);
        const els = pos.map(([x, y]) => { const e = FL.icon(F, kind, x, y, 68); e.style.opacity = 0; return e; });
        const bg = F.g({});
        let dup = null;
        const dbadge = (x, y, k, col) => { const g = F.g({ opacity: 0 }, bg); F.circle(x, y, 21, { fill: col || C.pink, stroke: '#fff', 'stroke-width': 3 }, g); F.text(x, y + 1, String(k), { 'font-size': 26, fill: '#fff' }, g); return g; };
        const clear = () => { while (bg.firstChild) bg.firstChild.remove(); dup = null; };
        return {
          async show() { for (const e of els) { e.style.opacity = 1; F.sfx('pop'); F.show(e, 'pop', 0.3); await F.wait(0.15); } await F.wait(0.2); },
          count() { return F.countTap(els, { badgeDy: -8 }); },
          /* ばんごうが じゅんに ついていく（おてほん） */
          async auto() { clear(); for (let i = 0; i < pos.length; i++) { const b = dbadge(pos[i][0], pos[i][1] - 52, i + 1); F.sfx('count'); await F.show(b, 'pop', 0.25); await F.wait(0.3); } },
          /* ピヨの かぞえかた：2ばんめを 2かい かぞえて 5こに */
          async piyo() {
            clear();
            for (let i = 0; i < pos.length; i++) { const b = dbadge(pos[i][0], pos[i][1] - 52, i + 1); F.sfx('count'); await F.show(b, 'pop', 0.25); await F.wait(0.25); }
            dup = dbadge(pos[1][0], pos[1][1] + 62, pos.length + 1, C.red); F.sfx('count'); await F.show(dup, 'pop', 0.3);
          },
          /* まちがいを なおす：2かい かぞえた ばんごうを けして、 わっかを つける */
          async fix() {
            if (!dup) { clear(); for (let i = 0; i < pos.length; i++) dbadge(pos[i][0], pos[i][1] - 52, i + 1).style.opacity = 1; } else { F.sfx('ng'); await F.hide(dup, 0.4); dup.remove(); dup = null; }
            const ring = F.circle(pos[1][0], pos[1][1], 50, { fill: 'none', stroke: C.ye, 'stroke-width': 6, 'stroke-dasharray': '10 7', opacity: 0, 'pointer-events': 'none' }, bg);
            await F.show(ring, 'pop', 0.4);
          }
        };
      },
      /* 1〜5の すうじカード（すうじ・よみ・ものの かず） */
      cards(F) {
        const names = ['មួយ', 'ពីរ', 'បី', 'បួន', 'ប្រាំ'], cards = [];
        for (let i = 0; i < 5; i++) {
          const x = 26 + i * 118, cx = x + 53, g = F.g({ opacity: 0 });
          const rect = F.rect(x, 36, 106, 320, { rx: 18, fill: '#fff', stroke: '#f3a0b5', 'stroke-width': 4 }, g);
          const num = F.text(cx, 84, String(i + 1), { 'font-size': 76, fill: INK }, g);
          for (let k = 0; k <= i; k++) FL.icon(F, 'apple', cx, 188 + k * 35, 34, g);
          const lb = F.label(cx, 142, names[i], { cls: 's', hide: true });
          cards.push({ g, rect, num, lb });
        }
        const norm = c => { c.rect.setAttribute('fill', '#fff'); c.rect.setAttribute('stroke', '#f3a0b5'); c.num.setAttribute('fill', INK); };
        return {
          async show() { for (const c of cards) { c.g.style.opacity = 1; F.sfx('pop'); F.show(c.lb); await F.show(c.g, 'pop', 0.3); } },
          async read() {
            for (const c of cards) { c.rect.setAttribute('fill', '#fff0f5'); c.rect.setAttribute('stroke', C.pink); c.num.setAttribute('fill', C.pink); F.sfx('count'); await F.wait(0.7); norm(c); }
          }
        };
      },
      /* ひだり：ものの わく／みぎ：すうじのカード 3まい。 おなじ かずの すうじを さわる */
      match(F, n, kind, opts) {
        F.rect(20, 40, 320, 316, { rx: 22, fill: 'rgba(255,255,255,.7)', stroke: '#ced4da', 'stroke-width': 3, 'stroke-dasharray': '10 8' });
        const els = SCATL[n].map(([x, y]) => { const e = FL.icon(F, kind, x, y, 64); e.style.opacity = 0; return e; });
        const cards = opts.map((v, i) => {
          const x = 358 + i * 90, y = 130, g = F.g({ opacity: 0 });
          const rect = F.rect(x, y, 80, 120, { rx: 16, fill: '#fff', stroke: '#f3a0b5', 'stroke-width': 4 }, g);
          F.text(x + 40, y + 62, String(v), { 'font-size': 72, fill: INK }, g);
          return { g, rect, cx: x + 40, cy: y + 60 };
        });
        return {
          async show() {
            for (const e of els) { e.style.opacity = 1; F.sfx('pop'); F.show(e, 'pop', 0.3); await F.wait(0.15); }
            for (const c of cards) { c.g.style.opacity = 1; await F.show(c.g, 'pop', 0.3); }
          },
          pick() { return pickTap(F, cards, opts.indexOf(n)); }
        };
      },
      /* ばらばらの ものを、 TAP で 1れつに ならべかえる */
      regroup(F, n, kind) {
        const A = SCAT[n], B = rowPos(n), k = 68 / 34;
        const els = A.map(([x, y]) => { const e = FL.icon(F, kind, x, y, 68); e.style.opacity = 0; return e; });
        const set = (e, x, y) => e.setAttribute('transform', `translate(${x} ${y}) scale(${k})`);
        return {
          async show() { for (const e of els) { e.style.opacity = 1; F.sfx('pop'); F.show(e, 'pop', 0.3); await F.wait(0.15); } await F.wait(0.2); },
          async line() { F.sfx('whoosh'); await F.tween(0.9, u => els.forEach((e, i) => set(e, A[i][0] + (B[i][0] - A[i][0]) * u, A[i][1] + (B[i][1] - A[i][1]) * u))); }
        };
      }
    },
    steps: [
      ST(1),
      T('សួស្តីកូនៗទាំងអស់គ្នា! ថ្ងៃនេះយើងរាប់ចំនួនរបស់ផ្សេងៗ។', { face: 'happy', act: 'hop', o: { face: 'happy' }, note: meate }),
      P('ពីយ៉ូចូលចិត្តរាប់ណាស់! មួយ ពីរ…', { face: 'cheer', act: 'jump', mark: 'note' }),
      T('មានផ្លែប៉ោម។ មានប៉ុន្មានផ្លែ?', { face: 'normal', fig: ['things', 'apple', 3, 'row'], do: 'show' }),
      T('ចូរប្រើម្រាមដៃប៉ះម្តងមួយផ្លែ ហើយរាប់មើល។', { face: 'happy' }),
      ACT({ text: 'ចូរប៉ះផ្លែប៉ោមម្តងមួយ ហើយរាប់!', hint: 'ប៉ះផ្លែប៉ោមម្តងមួយ', run: { do: 'count' }, face: 'normal' }),
      P('មួយ ពីរ បី! សរុបមាន 3 ផ្លែ!', { face: 'cheer', act: 'jump', mark: 'sparkle' }),
      T('ត្រូវហើយ។ មាន 3 ផ្លែ។ ជាលេខ យើងសរសេរ 3។', { face: 'proud', note: { id: 'n3', kind: 'formula', text: '3', x: NX + 130, y: 100, size: 100 } }),
      T('បន្ទាប់ជាផ្លែក្រូច។ សាកល្បងរាប់មើល។', { face: 'normal', unnote: 'n3', fig: ['things', 'orange', 4, 'mix'], do: 'show' }),
      N({ text: 'មានផ្លែក្រូចប៉ុន្មានផ្លែ?', ans: 4, unit: 'ផ្លែ', tip: 'ចូរប្រើម្រាមដៃចង្អុលម្តងមួយ ហើយរាប់។',
        exp: [T('មួយ ពីរ បី បួន។ មាន 4 ផ្លែ។', { face: 'happy', do: 'auto' })] }),
      P('ពីយ៉ូក៏រាប់ហើយដែរ! សរុបមាន 5 ផ្លែ!', { face: 'proud', act: 'hop', do: 'piyo', o: { face: 'think', mark: 'q' } }),
      Q({ text: 'ពីយ៉ូនិយាយថា 5 ផ្លែ។ ត្រូវទេ?', opts: ['ត្រូវ', 'ខុស'], ok: 1, tip: 'មើលលេខឱ្យបានច្បាស់។ តើផ្លែក្រូចមួយណាមានលេខជាប់ពីរ?',
        ng: { 0: [T('មើលលេខ។ មានផ្លែក្រូចមួយដែលមានលេខជាប់ពីរ។', { face: 'think' })] },
        exp: [T('ពីយ៉ូបានរាប់ផ្លែក្រូចដដែលពីរដងហើយ។', { face: 'normal', do: 'fix' }), T('តាមពិតមាន 4 ផ្លែ។ បើយើងធ្វើសញ្ញាសម្គាល់ នឹងល្អ។', { face: 'happy' })] }),
      P('អ្ហា៎! ពីយ៉ូរាប់ពីរដងទៅហើយ! អរគុណ!', { face: 'confused', mark: 'sweat', o: { face: 'happy' } }),

      ST(2),
      T('ចំនួនអាចសរសេរជាលេខបាន។ សូមមើលពី 1 ដល់ 5។', { face: 'happy', clearNotes: true, note: meate, fig: 'cards', do: 'show' }),
      TAP({ text: 'ចុចប៊ូតុង ហើយអានជាមួយគ្នា!', btn: 'អានជាមួយគ្នា!', run: { do: 'read' }, face: 'normal' }),
      P('មួយ ពីរ បី បួន ប្រាំ! អានបានហើយ!', { face: 'cheer', act: 'hop', mark: 'note' }),
      T('ឥឡូវនេះ ចូរភ្ជាប់គ្រាប់ស្ករជាមួយលេខ។', { face: 'normal', fig: ['match', 4, 'candy', [3, 5, 4]], do: 'show' }),
      ACT({ text: 'ចូរចុចលេខដែលស្មើនឹងចំនួនគ្រាប់ស្ករ!', hint: 'ចុចលេខដោយម្រាមដៃ', run: { do: 'pick' }, face: 'normal' }),
      P('គ្រាប់ស្ករមាន 4 គ្រាប់ ដូច្នេះលេខគឺ 4!', { face: 'proud', act: 'hop' }),
      T('បន្ទាប់ជាផ្កា។ សាកល្បងរាប់មើល។', { face: 'normal', fig: ['things', 'flower', 5, 'row'], do: 'show' }),
      Q({ text: 'មានផ្កាប៉ុន្មានទង? ចូរជ្រើសរើសលេខ។', opts: ['4', '5'], ok: 1, tip: 'ចូរប្រើម្រាមដៃចង្អុលម្តងមួយ ហើយរាប់។',
        ng: { 0: [T('ចូរប្រើម្រាមដៃចង្អុលម្តងមួយ ហើយរាប់ម្តងទៀត។', { face: 'think' })] },
        exp: [T('មួយ ពីរ បី បួន ប្រាំ។', { face: 'happy', do: 'auto' }), T('មាន 5 ទង ដូច្នេះលេខគឺ 5។', { face: 'proud' })] }),
      T('សាកល្បងរាប់ផ្កាយមើល។', { face: 'normal', fig: ['things', 'star', 3, 'mix'], do: 'show' }),
      N({ text: 'មានផ្កាយប៉ុន្មាន? ចូរបញ្ចូលលេខ។', ans: 3, unit: 'ផ្កាយ', tip: 'ចូរប្រើម្រាមដៃចង្អុលម្តងមួយ ហើយរាប់។',
        exp: [T('មួយ ពីរ បី។ មាន 3 ផ្កាយ។', { face: 'happy', do: 'auto' })] }),
      BREAK(),

      ST(3),
      T('បើតម្រៀបផ្លែប៉ោមឡើងវិញ តើចំនួននឹងប្តូរឬទេ?', { face: 'normal', clearNotes: true, note: meate, fig: ['regroup', 4, 'apple'], do: 'show' }),
      P('ហ៊ឺម… ពីយ៉ូគិតថាកើនឡើង។ ព្រោះវាខ្ចាត់ខ្ចាយ។', { face: 'think', mark: 'q' }),
      TAP({ text: 'ចូរតម្រៀបឱ្យជាជួរតែមួយ!', btn: 'តម្រៀប!', run: { do: 'line' }, face: 'happy' }),
      Q({ text: 'បន្ទាប់ពីតម្រៀបឡើងវិញ តើផ្លែប៉ោមក្លាយជាយ៉ាងណា?', opts: ['កើនឡើង', 'មិនប្តូរ (4 ផ្លែ)'], ok: 1, tip: 'ចូររាប់ផ្លែប៉ោមម្តងមួយមើល។',
        ng: { 0: [T('យើងមិនបានបូកបន្ថែមផ្លែប៉ោមទេ។ សាកល្បងរាប់មើល។', { face: 'think' })] },
        exp: [T('ទោះតម្រៀបឡើងវិញ ផ្លែប៉ោមនៅតែមាន 4 ផ្លែដដែល។', { face: 'happy' })] }),
      P('មែនហើយ! ទោះតម្រៀបឡើងវិញ ក៏នៅតែ 4 ផ្លែដែរ!', { face: 'surprised', act: 'jump', mark: 'ex' }),
      T('ទោះបីតម្រៀបខុសគ្នា ក៏ចំនួននៅតែស្មើគ្នា។', { face: 'proud', note: { id: 'rule', kind: 'formula', text: 'ទោះតម្រៀបឡើងវិញ\nចំនួនក៏នៅដដែល', x: NX + 40, y: 110 } }),
      T('សំណួរចុងក្រោយ។ ចូររាប់នំគុកគី។', { face: 'normal', fig: ['things', 'cookie', 5, 'mix'], do: 'show' }),
      N({ text: 'មាននំគុកគីប៉ុន្មាន?', ans: 5, unit: 'ដុំ', tip: 'ចូរប្រើម្រាមដៃចង្អុលម្តងមួយ ហើយរាប់។',
        exp: [T('មួយ ពីរ បី បួន ប្រាំ។ 5 ដុំ!', { face: 'happy', do: 'auto' })] }),
      T('នេះជាការសង្ខេបសម្រាប់ថ្ងៃនេះ។', { face: 'happy', clear: true, note: meate, fig: 'cards', do: 'show' }),
      T('ចូររាប់របស់ម្តងមួយ ហើយបង្ហាញជាលេខ។', { face: 'proud', note: { id: 'sum', kind: 'formula', text: 'រាប់ម្តងមួយ\nចំនួនសរសេរជាលេខ', x: NX + 20, y: 110 } }),
      P('ពីយ៉ូកាន់តែចូលចិត្តការរាប់ហើយ!', { face: 'cheer', act: 'spin', mark: 'sparkle' }),
      T('លើកក្រោយ យើងនឹងរៀនលេខពី 6 ដល់ 10។', { face: 'happy' }),
      END({ text: 'ថ្ងៃនេះក៏ខំប្រឹងណាស់ដែរ! ត្រា «ល្អណាស់» រូបផ្លែប៉ោម!' })
    ]
  });
})();
