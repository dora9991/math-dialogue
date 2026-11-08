/* 1年「10までの かず」第2回：6から 10までの かず
   10の わくに いちご 6こ・7こ・8こ…（うえの 5つは いっぱい。「5と いくつ」に きづく）→ 7こを ゆびで さわって かぞえる →
   ピヨが 9こを「10こ」と まちがえる → いちごを ゆびで わくへ うごかして 8こを つくる → 6〜10の すうじの よみ（ろく・なな・はち・きゅう・じゅう）。
   1年なので：ひらがなと 分かち書き・みじかい 文・ゆっくり・2たくが 中心。 */
(function () {
  const { T, P, Q, N, TAP, ACT, ST, BREAK, END } = HS;
  const C = FL.COL, NX = 700, INK = '#3b2a1e';
  const meate = { id: 'meate', kind: 'title', tag: 'គោលដៅ', text: 'លេខពី 6 ដល់ 10', x: NX, y: 22 };
  const dash = col => ({ rx: 10, fill: 'none', stroke: col, 'stroke-width': 5, 'stroke-dasharray': '12 8', opacity: 0, 'pointer-events': 'none' });

  HS.lesson({
    id: 'kazu10-02', grade: 1, unit: 'លេខរហូតដល់ 10', no: 2, title: 'លេខពី 6 ដល់ 10', sticker: '🍓',
    goal: 'បង្ហាញលេខពី 6 ដល់ 10 នៅក្នុងប្រអប់ 10',
    stages: ['រាប់ក្នុងប្រអប់ 10', 'រំកិលផ្លែស្ត្របឺរី', 'អានលេខ'],
    figs: {
      /* 10の わくに いちご n こ（うえの 5つ ＋ した） */
      frame(F, n) {
        const X = 80, Y = 116, S = 84, tf = FL.tenFrame(F, X, Y, S);
        const items = [];
        for (let i = 0; i < n; i++) { const [cx, cy] = tf.cells[i]; const e = FL.icon(F, 'strawberry', cx, cy, 66); e.style.opacity = 0; items.push(e); }
        const bg = F.g({});
        const box1 = F.rect(X + 5, Y + 5, S * 5 - 10, S - 10, dash(C.blue), bg);
        const box2 = n > 5 ? F.rect(X + 5, Y + S + 5, S * (n - 5) - 10, S - 10, dash(C.red), bg) : null;
        const l5 = F.label(X + S * 5 + 44, Y + S / 2, '5', { cls: 'xl', color: C.blue, hide: true });
        const lk = F.label(X + S * 5 + 44, Y + S * 1.5, String(n - 5), { cls: 'xl', color: C.red, hide: true });
        const marks = [];
        for (let i = n; i < 10; i++) { const [x, y] = tf.cells[i]; marks.push(F.rect(x - 34, y - 34, 68, 68, { rx: 10, fill: 'rgba(255,135,135,.18)', stroke: C.red, 'stroke-width': 3, 'stroke-dasharray': '7 6', opacity: 0, 'pointer-events': 'none' }, bg)); }
        const lgap = F.label(X + S * 2.5, Y + S * 2 + 36, 'ត្រូវការ ' + (10 - n) + ' ទៀតបាន 10', { cls: 'l', color: C.red, hide: true });
        const bdg = F.g({});
        const full = F.rect(X - 8, Y - 8, S * 5 + 16, S * 2 + 16, { rx: 16, fill: 'none', stroke: C.blue, 'stroke-width': 6, 'stroke-dasharray': '12 9', opacity: 0, 'pointer-events': 'none' });
        const l10 = F.label(X + S * 2.5, Y - 34, '10', { cls: 'xl', color: C.blue, hide: true });
        return {
          async show() { for (const e of items) { e.style.opacity = 1; F.sfx('pop'); F.show(e, 'pop', 0.3); await F.wait(0.13); } await F.wait(0.2); },
          count() { return F.countTap(items, { badgeDy: -2 }); },
          /* うえの 5つ（いっぱい）と、 したの いくつ */
          async five() {
            await F.draw(box1, 0.5); await F.show(l5);
            if (box2) { await F.draw(box2, 0.5); await F.show(lk); }
          },
          /* あいている ところ */
          async gap() { marks.forEach(m => { m.style.opacity = 1; }); await F.wait(0.3); await F.show(lgap); },
          async auto() {
            while (bdg.firstChild) bdg.firstChild.remove();
            for (let i = 0; i < n; i++) { const [cx, cy] = tf.cells[i]; const g = F.g({ opacity: 0 }, bdg); F.circle(cx - 24, cy - 28, 15, { fill: C.pink, stroke: '#fff', 'stroke-width': 2.5 }, g); F.text(cx - 24, cy - 27, String(i + 1), { 'font-size': 19, fill: '#fff' }, g); F.sfx('count'); await F.show(g, 'pop', 0.2); await F.wait(0.2); }
          },
          /* 10の わくが いっぱい */
          async ten() { await F.draw(full, 0.6); await F.show(l10); }
        };
      },
      /* いちご 8こ（かご）を ゆびで 10の わくへ うごかす */
      pack(F) {
        const X = 36, Y = 118, S = 64, tf = FL.tenFrame(F, X, Y, S);
        tf.g.style.opacity = 0;
        const kago = F.g({ opacity: 0 });
        F.rect(410, 130, 196, 190, { rx: 22, fill: '#fbe3b8', stroke: '#b07a3c', 'stroke-width': 4 }, kago);
        const slot = k => [450 + (k % 3) * 58, 172 + Math.floor(k / 3) * 58];
        const loose = [];
        for (let k = 0; k < 8; k++) { const [x, y] = slot(k); const g = F.g({ transform: `translate(${x} ${y})`, opacity: 0 }); FL.icon(F, 'strawberry', 0, 0, 50, g); loose.push({ g, x, y, placed: false }); }
        const targets = [];
        for (let i = 0; i < 8; i++) { const [x, y] = tf.cells[i]; targets.push({ x, y, used: false, mark: F.rect(x - 28, y - 28, 56, 56, { rx: 10, fill: 'rgba(255,135,135,.18)', stroke: C.red, 'stroke-width': 3, 'stroke-dasharray': '7 6', opacity: 0, 'pointer-events': 'none' }) }); }
        const lbBox = F.label(X + S * 2.5, Y + S * 2 + 34, 'ប្រអប់ 10', { cls: 's', hide: true }), lbKago = F.label(508, 346, 'កន្ត្រក', { cls: 's', hide: true });
        const box1 = F.rect(X + 5, Y + 5, S * 5 - 10, S - 10, dash(C.blue)), box2 = F.rect(X + 5, Y + S + 5, S * 3 - 10, S - 10, dash(C.red));
        const empty = [8, 9].map(i => { const [x, y] = tf.cells[i]; return F.rect(x - 29, y - 29, 58, 58, { rx: 10, fill: 'rgba(255,135,135,.18)', stroke: C.red, 'stroke-width': 3, 'stroke-dasharray': '7 6', opacity: 0, 'pointer-events': 'none' }); });
        const lgap = F.label(X + S * 2.5, Y - 36, 'ត្រូវការ 2 ទៀតបាន 10', { cls: 'l', color: C.red, hide: true });
        const put = (r, tg) => { r.placed = true; tg.used = true; r.x = tg.x; r.y = tg.y; r.g.setAttribute('transform', `translate(${tg.x} ${tg.y})`); tg.mark.style.opacity = 0; };
        const settle = () => {   // おわりの 形：のこりを あいている ところへ
          for (const tg of targets) if (!tg.used) put(loose.find(r => !r.placed), tg);
          targets.forEach(tg => { tg.mark.style.opacity = 0; });
        };
        return {
          async show() {
            tf.g.style.opacity = 1; await F.show(tf.g, 'fade', 0.3);
            kago.style.opacity = 1; await F.show(kago, 'fade', 0.3);
            for (const r of loose) { r.g.style.opacity = 1; F.sfx('pop'); F.show(r.g, 'pop', 0.3); await F.wait(0.12); }
            F.show(lbBox); await F.show(lbKago);
          },
          async drag() {
            targets.forEach(tg => { tg.mark.style.opacity = 1; });
            const it = F.interact(settle);
            const ds = loose.map((r, i) => F.draggable(r.g, { x: r.x, y: r.y, onDrop: (x, y) => {
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
          async five() { await F.draw(box1, 0.5); await F.draw(box2, 0.5); },
          async gap() { empty.forEach(m => { m.style.opacity = 1; }); await F.wait(0.3); await F.show(lgap); }
        };
      },
      /* 6〜10の 一ぴょう：すうじ・よみ・10の わく・「5と いくつ」 */
      rows(F) {
        const names = ['ប្រាំមួយ', 'ប្រាំពីរ', 'ប្រាំបី', 'ប្រាំបួន', 'ដប់'], rs = [];
        for (let i = 0; i < 5; i++) {
          const n = i + 6, y = 8 + i * 76, g = F.g({ opacity: 0 });
          const rect = F.rect(14, y, 590, 70, { rx: 16, fill: '#fff', stroke: '#f3a0b5', 'stroke-width': 4 }, g);
          const num = F.text(70, y + 36, String(n), { 'font-size': 56, fill: INK }, g);
          const fx = 238, fy = y + 3, S = 32;
          F.rect(fx, fy, S * 5, S * 2, { rx: 6, fill: '#fff', stroke: '#7a5a3a', 'stroke-width': 3 }, g);
          F.line(fx, fy + S, fx + S * 5, fy + S, { stroke: '#b89a78', 'stroke-width': 2 }, g);
          for (let k = 1; k < 5; k++) F.line(fx + k * S, fy, fx + k * S, fy + S * 2, { stroke: '#b89a78', 'stroke-width': 2 }, g);
          for (let k = 0; k < n; k++) FL.icon(F, 'strawberry', fx + (k % 5) * S + S / 2, fy + Math.floor(k / 5) * S + S / 2, 27, g);
          F.text(500, y + 36, '5 និង ' + (n - 5), { 'font-size': 36, fill: '#6b5846' }, g);
          const lb = F.label(160, y + 36, names[i], { cls: 's', hide: true });
          rs.push({ g, rect, num, lb });
        }
        const norm = c => { c.rect.setAttribute('fill', '#fff'); c.rect.setAttribute('stroke', '#f3a0b5'); c.num.setAttribute('fill', INK); };
        return {
          async show() { for (const c of rs) { c.g.style.opacity = 1; F.sfx('pop'); F.show(c.lb); await F.show(c.g, 'pop', 0.3); } },
          async read() { for (const c of rs) { c.rect.setAttribute('fill', '#fff0f5'); c.rect.setAttribute('stroke', C.pink); c.num.setAttribute('fill', C.pink); F.sfx('count'); await F.wait(0.8); norm(c); } }
        };
      }
    },
    steps: [
      ST(1),
      T('សួស្តីកូនៗទាំងអស់គ្នា! ថ្ងៃនេះយើងរៀនលេខពី 6 ដល់ 10។', { face: 'happy', act: 'hop', o: { face: 'happy' }, note: meate }),
      P('ម្រាមដៃមិនគ្រប់ទេ… ហាក់ដូចជាពិបាកណាស់!', { face: 'confused', mark: 'sweat' }),
      T('កុំបារម្ភ។ ប្រើប្រអប់ 10 នឹងងាយស្រួល។', { face: 'proud', o: { face: 'cheer', act: 'hop' } }),
      T('មានផ្លែស្ត្របឺរី។ យើងរៀបវាក្នុងប្រអប់ 10។', { face: 'normal', fig: ['frame', 6], do: 'show' }),
      T('ខាងលើ 5 ពេញ។ ខាងក្រោមមាន 1។', { face: 'happy', do: 'five', note: { id: 'f6', kind: 'formula', text: '5 និង 1\nបានប៉ុន្មាន?', x: NX + 40, y: 110 } }),
      Q({ text: 'តើផ្លែស្ត្របឺរីសរុបមានប៉ុន្មាន?', opts: ['5 ផ្លែ', '6 ផ្លែ'], ok: 1, tip: 'ខាងលើ 5 និងខាងក្រោម 1។ បូកបញ្ចូលគ្នាបានប៉ុន្មាន?',
        ng: { 0: [T('ក្រៅពី 5 ខាងលើ ខាងក្រោមក៏មានដែរ។', { face: 'think' })] },
        exp: [T('5 និង 1 ស្មើ 6។ ផ្លែស្ត្របឺរីមាន 6 ផ្លែ។', { face: 'happy' })] }),
      T('បន្ទាប់ជា 7 ផ្លែ។ ចូរប៉ះម្តងមួយ ហើយរាប់។', { face: 'normal', clearNotes: true, note: meate, fig: ['frame', 7], do: 'show' }),
      ACT({ text: 'ចូរប៉ះផ្លែស្ត្របឺរីម្តងមួយ ហើយរាប់!', hint: 'ប៉ះផ្លែស្ត្របឺរីម្តងមួយ', run: { do: 'count' }, face: 'normal' }),
      P('ប្រាំពីរផ្លែ! 5 និង 2 ស្មើ 7 ផ្លែ!', { face: 'cheer', act: 'jump', mark: 'sparkle', do: 'five' }),
      T('បន្ទាប់ជា 8 ផ្លែ។ ខាងលើ 5 ពេញ។', { face: 'normal', fig: ['frame', 8], do: 'show' }),
      N({ text: 'នៅក្រោម 5 ខាងលើ មានប៉ុន្មាន?', ans: 3, unit: 'ផ្លែ', tip: 'ចូរសាកល្បងរាប់ជួរខាងក្រោមនៃប្រអប់។',
        exp: [T('ខាងក្រោមមាន 3 ផ្លែ។ 5 និង 3 ស្មើ 8 ផ្លែ។', { face: 'happy', do: 'five' })] }),
      P('លើកនេះ ពីយ៉ូធ្វើ! ប្រអប់ពេញ ដូច្នេះ 10 ផ្លែ!', { face: 'proud', act: 'hop', fig: ['frame', 9], do: 'show', o: { face: 'think', mark: 'q' } }),
      Q({ text: 'ពីយ៉ូនិយាយថា 10 ផ្លែ។ ត្រូវទេ?', opts: ['ត្រូវ', 'ខុស'], ok: 1, tip: 'សូមមើលកន្លែងទំនេរក្នុងប្រអប់។',
        ng: { 0: [T('ក្នុងប្រអប់មានកន្លែងទំនេរ។', { face: 'think' })] },
        exp: [T('មានកន្លែងទំនេរមួយ។ ដូច្នេះមិនមែន 10 ផ្លែទេ។', { face: 'normal', do: 'gap' }), T('5 និង 4 ស្មើ 9 ផ្លែ។ ផ្លែស្ត្របឺរីមាន 9 ផ្លែ។', { face: 'happy', do: 'five' })] }),
      P('អ្ហា៎! មានកន្លែងទំនេរ! អរគុណ!', { face: 'confused', mark: 'sweat', o: { face: 'happy' } }),

      ST(2),
      T('យើងនឹងដាក់ផ្លែស្ត្របឺរី 8 ផ្លែក្នុងកន្ត្រកចូលទៅក្នុងប្រអប់។', { face: 'happy', clearNotes: true, note: meate, fig: 'pack', do: 'show' }),
      Q({ text: 'បើដាក់ 8 ផ្លែ តើប្រអប់នៅសល់កន្លែងទំនេរប៉ុន្មាន?', opts: ['2 កន្លែង', '3 កន្លែង'], ok: 0, tip: 'ប្រអប់មានសរុប 10។ ដក 8 ចេញពី 10។',
        ng: { 1: [T('បើ 3 នោះ នឹងដាក់បាន 11 ផ្លែ។', { face: 'think' })] },
        exp: [T('បើដាក់ 8 ផ្លែ នៅសល់កន្លែងទំនេរ 2 កន្លែង។', { face: 'happy' })] }),
      ACT({ text: 'ចូរប្រើម្រាមដៃរំកិលផ្លែស្ត្របឺរីចូលទៅក្នុងប្រអប់!', hint: 'រំកិលផ្លែស្ត្របឺរីដោយម្រាមដៃ', run: { do: 'drag' }, face: 'normal' }),
      P('ធ្វើបានហើយ! ផ្លែស្ត្របឺរី 8 ផ្លែ!', { face: 'cheer', act: 'jump', mark: 'sparkle', do: 'five' }),
      T('ខាងលើ 5 ខាងក្រោម 3។ 5 និង 3 ស្មើ 8។', { face: 'proud', note: { id: 'f8', kind: 'formula', text: '5 និង 3 ស្មើ 8', x: NX + 40, y: 110 } }),
      N({ text: 'ដើម្បីឱ្យបាន 10 តើត្រូវការបន្ថែមប៉ុន្មាន?', ans: 2, unit: 'ផ្លែ', tip: 'ចូររាប់កន្លែងទំនេរក្នុងប្រអប់។', do: 'gap',
        exp: [T('មានកន្លែងទំនេរ 2។ 8 និង 2 ស្មើ 10។', { face: 'happy', do: 'gap' })] }),
      T('10 គឺជាចំនួនដែលប្រអប់ពេញទាំងអស់។', { face: 'normal', clearNotes: true, note: meate, fig: ['frame', 10], do: [['show'], ['ten']] }),
      T('ជាលេខ យើងសរសេរ 1 និង 0 ជាប់គ្នា គឺ 10។', { face: 'proud', note: { id: 'n10', kind: 'formula', text: '10', x: NX + 90, y: 110, size: 80 } }),
      P('1 និង 0 ជា 10! គេអានថា «ដប់»!', { face: 'surprised', act: 'jump', mark: 'ex' }),
      BREAK(),

      ST(3),
      T('ចូរមើលចាប់ពី 6 ដល់ 10 ជាមួយគ្នា។', { face: 'happy', clearNotes: true, note: meate, fig: 'rows', do: 'show' }),
      TAP({ text: 'ចុចប៊ូតុង ហើយអានជាមួយគ្នា!', btn: 'អានជាមួយគ្នា!', run: { do: 'read' }, face: 'normal' }),
      P('ប្រាំមួយ ប្រាំពីរ ប្រាំបី ប្រាំបួន ដប់!', { face: 'cheer', act: 'hop', mark: 'note' }),
      T('ចូរបង្ហាញចំនួនផ្លែស្ត្របឺរីជាលេខ។', { face: 'normal', fig: ['frame', 9], do: 'show' }),
      Q({ text: 'តើចំនួនផ្លែស្ត្របឺរីទាំងនេះជាចំនួនមួយណា?', opts: ['6', '9'], ok: 1, tip: 'មើលកន្លែងទំនេរក្នុងប្រអប់។ មានទំនេរមួយ។',
        ng: { 0: [T('ក្រៅពី 5 ខាងលើ ខាងក្រោមមាន 4 ទៀត។', { face: 'think' })] },
        exp: [T('5 និង 4 ស្មើ 9។ លេខគឺ 9។', { face: 'happy', do: 'five' })] }),
      N({ text: 'មានផ្លែស្ត្របឺរីប៉ុន្មាន? ចូរបញ្ចូលលេខ។', ans: 7, unit: 'ផ្លែ', tip: 'ខាងលើ 5 និងខាងក្រោម 2។ បូកបញ្ចូលគ្នាបានប៉ុន្មាន?', fig: ['frame', 7], do: 'show',
        exp: [T('5 និង 2 ស្មើ 7។ ផ្លែស្ត្របឺរីមាន 7 ផ្លែ។', { face: 'happy', do: 'five' })] }),
      Q({ text: 'បើបន្ថែមផ្លែស្ត្របឺរី 1 ផ្លែ នឹងក្លាយជាប៉ុន្មាន?', opts: ['9', '10'], ok: 1, tip: 'ប្រអប់មាន 2 ជួរ ដាក់បាន 10 ផ្លែ។', fig: ['frame', 9], do: 'show',
        ng: { 0: [T('បើនៅ 9 ដដែល នឹងនៅទំនេរមួយកន្លែង។', { face: 'think' })] },
        exp: [T('9 និង 1 ស្មើ 10។ ចំនួនដែលប្រអប់ពេញគឺ 10។', { face: 'happy' })] }),
      T('នេះជាការសង្ខេបសម្រាប់ថ្ងៃនេះ។', { face: 'happy', clearNotes: true, note: meate }),
      T('6 ដល់ 9 គឺ 5 និងបន្ថែមប៉ុន្មាន។ 10 គឺប្រអប់ពេញ។', { face: 'proud', note: { id: 'sum', kind: 'formula', text: '6 ដល់ 9 គឺ 5 និងប៉ុន្មាន\n10 គឺពេញ', x: NX + 20, y: 110 } }),
      P('បើប្រើប្រអប់ 10 នោះយល់ភ្លាមហើយ!', { face: 'cheer', act: 'spin', mark: 'sparkle' }),
      T('លើកក្រោយ ចូរប្រៀបធៀបទំហំនៃលេខ។', { face: 'happy' }),
      END({ text: 'ថ្ងៃនេះក៏ខំប្រឹងណាស់ដែរ! ត្រា «ល្អណាស់» រូបផ្លែស្ត្របឺរី!' })
    ]
  });
})();
