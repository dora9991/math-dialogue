/* 1年「10までの かず」第3回：かずの おおきさ くらべ
   りんごと みかんを せんで ひとつずつ むすぶ（ゆびで ひく）→ あまった ほうが おおい →
   ピヨが「ひろがって いる ほうが おおい」と まちがえる → かずを ブロックで むすんで くらべる（3と 5・7と 4）→
   かずの せん（0〜10）：みぎに いくほど おおきい。 せんの 7を タップ。
   1年なので：ひらがなと 分かち書き・みじかい 文・ゆっくり・2たくが 中心。 */
(function () {
  const { T, P, Q, N, TAP, ACT, ST, BREAK, END } = HS;
  const C = FL.COL, NX = 700, INK = '#3b2a1e';
  const meate = { id: 'meate', kind: 'title', tag: 'គោលដៅ', text: 'ចូរប្រៀបធៀបទំហំនៃលេខ', x: NX, y: 22 };

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

  HS.lesson({
    id: 'kazu10-03', grade: 1, unit: 'លេខរហូតដល់ 10', no: 3, title: 'ប្រៀបធៀបទំហំនៃលេខ', sticker: '⚖️',
    goal: 'ចូរប្រៀបធៀបទំហំនៃលេខ',
    stages: ['ភ្ជាប់ម្តងមួយ ហើយប្រៀបធៀប', 'ប្រៀបធៀបដោយលេខ', 'ប្រៀបធៀបលើបន្ទាត់លេខ'],
    figs: {
      /* 上の ならび（nA こ）と 下の ならび（nB こ）。 link で ゆびで むすぶ */
      pair(F, nA, kindA, nB, kindB, o) {
        o = o || {};
        const mk = (n, kind, y, x0, dx) => Array.from({ length: n }, (_, i) => {
          const x = x0 + i * dx, g = F.g({ opacity: 0 });
          FL.icon(F, kind, x, y, 58, g); F.circle(x, y, 44, { fill: '#fff', 'fill-opacity': 0.01 }, g);
          return { g, x, y };
        });
        const A = mk(nA, kindA, 102, o.x0A || 140, o.dxA || 90), B = mk(nB, kindB, 270, o.x0B || 140, o.dxB || 90);
        const lines = F.g({}), bg = F.g({});
        const lbA = F.label(52, 102, o.nameA || '', { cls: 's', hide: true }), lbB = F.label(52, 270, o.nameB || '', { cls: 's', hide: true });
        const need = Math.min(nA, nB), linked = [];
        const seg = (a, b, col) => F.line(A[a].x, A[a].y + 34, B[b].x, B[b].y - 34, { stroke: col || C.green, 'stroke-width': 6, opacity: 1 }, lines);
        const addLink = (a, b) => { linked.push([a, b]); seg(a, b); };
        const usedA = () => new Set(linked.map(l => l[0])), usedB = () => new Set(linked.map(l => l[1]));
        return {
          async show() {
            F.show(lbA); F.show(lbB);
            for (const r of [A, B]) { for (const it of r) { it.g.style.opacity = 1; F.sfx('pop'); F.show(it.g, 'pop', 0.3); await F.wait(0.12); } }
            await F.wait(0.2);
          },
          /* ゆびで むすぶ：上の ものを おして、 下の ものまで ひく（ひだり・みぎ どちらから でも）。 ちょんと さわって、 つぎに 下を さわっても よい */
          async link() {
            let sel = null, drag = null, moved = false, sx = 0, sy = 0;
            const ring = F.circle(0, 0, 46, { fill: 'none', stroke: C.ye, 'stroke-width': 6, opacity: 0, 'pointer-events': 'none' }, bg);
            const settle = () => {   // おわりの 形：まだ むすんで いない ものを じゅんに むすぶ
              const ua = usedA(), ub = usedB(); const fa = A.map((_, i) => i).filter(i => !ua.has(i)), fb = B.map((_, i) => i).filter(i => !ub.has(i));
              while (linked.length < need && fa.length && fb.length) addLink(fa.shift(), fb.shift());
              ring.style.opacity = 0; if (drag) { drag.remove(); drag = null; }
            };
            const it = F.interact(settle);
            const nearestB = (x, y) => { const ub = usedB(); let best = -1, bd = 62; B.forEach((b, j) => { const d = Math.hypot(x - b.x, y - b.y); if (!ub.has(j) && d < bd) { bd = d; best = j; } }); return best; };
            const link = (a, b) => { addLink(a, b); sel = null; ring.style.opacity = 0; F.sfx('ok'); if (linked.length >= need) { F.confetti((A[a].x + B[b].x) / 2, 186, 30); F.wait(0.6).then(() => it.done()); } };
            A.forEach((a, i) => {
              a.g.classList.add('tapme'); a.g.style.touchAction = 'none';
              a.g.addEventListener('pointerdown', ev => {
                ev.preventDefault(); if (it.over || linked.length >= need || usedA().has(i)) return;
                sel = i; moved = false; [sx, sy] = F.pt(ev); F.sfx('tap');
                ring.setAttribute('cx', a.x); ring.setAttribute('cy', a.y); ring.style.opacity = 1;
                if (drag) drag.remove(); drag = F.line(a.x, a.y + 34, a.x, a.y + 34, { stroke: C.green, 'stroke-width': 6, opacity: 0.8, 'pointer-events': 'none' }, bg);
                try { a.g.setPointerCapture(ev.pointerId); } catch (er) { /* なくてよい */ }
              });
              a.g.addEventListener('pointermove', ev => {
                if (sel !== i || !drag) return; const [px, py] = F.pt(ev);
                if (Math.hypot(px - sx, py - sy) > 12) moved = true;
                drag.setAttribute('x2', px); drag.setAttribute('y2', py);
              });
              a.g.addEventListener('pointerup', ev => {
                if (sel !== i || it.over) return; const [px, py] = F.pt(ev);
                if (drag) { drag.remove(); drag = null; }
                const j = nearestB(px, py);
                if (j >= 0 && moved) link(i, j);
                else if (moved) { sel = null; ring.style.opacity = 0; F.sfx('ng'); }   // どこにも むすべなかった
              });
            });
            B.forEach((b, j) => {
              b.g.classList.add('tapme');
              b.g.addEventListener('pointerdown', ev => {
                ev.preventDefault(); if (it.over || sel === null || usedB().has(j)) return;
                link(sel, j);
              });
            });
            await it.promise;
            A.concat(B).forEach(e => e.g.classList.remove('tapme'));
          },
          /* じどうで むすぶ（おてほん） */
          async pairs() {
            while (lines.firstChild) lines.firstChild.remove(); linked.length = 0;
            for (let i = 0; i < need; i++) { addLink(i, i); F.sfx('count'); await F.wait(0.35); }
          },
          /* あまった ものに わっかを つける */
          async more() {
            const ex = nA > nB ? A.slice(nB).map(e => [e, -1]) : B.slice(nA).map(e => [e, 1]);
            for (const [e, d] of ex) F.circle(e.x, e.y, 48, { fill: 'rgba(255,210,63,.25)', stroke: C.or, 'stroke-width': 5, 'stroke-dasharray': '10 7', 'pointer-events': 'none' }, bg);
            const lb = F.label(ex[0][0].x + (ex.length - 1) * (o[nA > nB ? 'dxA' : 'dxB'] || 90) / 2, ex[0][0].y + (nA > nB ? -64 : 64), 'សល់', { cls: 's', color: C.or, hide: true });
            F.sfx('pop'); await F.wait(0.3); await F.show(lb);
          }
        };
      },
      /* かずの ブロック：上＝a こ（青）、 下＝b こ（赤）。 ならべて くらべる */
      bars(F, a, b) {
        const x0 = 118, dx = 50, ya = 110, yb = 250;
        const mk = (n, name, y) => Array.from({ length: n }, (_, i) => { const e = FL.icon(F, name, x0 + i * dx, y, 48); e.style.opacity = 0; return e; });
        const A = mk(a, 'block', ya), B = mk(b, 'blockR', yb);
        const hiA = F.circle(52, ya, 40, { fill: '#fff3bf', stroke: C.or, 'stroke-width': 4, opacity: 0 }), hiB = F.circle(52, yb, 40, { fill: '#fff3bf', stroke: C.or, 'stroke-width': 4, opacity: 0 });
        const na = F.text(52, ya + 2, String(a), { 'font-size': 60, fill: C.blue }), nb = F.text(52, yb + 2, String(b), { 'font-size': 60, fill: C.red });
        na.style.opacity = 0; nb.style.opacity = 0;
        const bg = F.g({}), need = Math.min(a, b);
        return {
          async show() {
            na.style.opacity = 1; F.show(na, 'pop', 0.3);
            for (const e of A) { e.style.opacity = 1; F.sfx('pop'); F.show(e, 'pop', 0.25); await F.wait(0.1); }
            nb.style.opacity = 1; F.show(nb, 'pop', 0.3);
            for (const e of B) { e.style.opacity = 1; F.sfx('pop'); F.show(e, 'pop', 0.25); await F.wait(0.1); }
            await F.wait(0.2);
          },
          async pairs() { for (let i = 0; i < need; i++) { const l = F.line(x0 + i * dx, ya + 26, x0 + i * dx, yb - 26, { stroke: '#868e96', 'stroke-width': 4, 'stroke-dasharray': '8 6', opacity: 0 }, bg); F.sfx('count'); await F.show(l, 'fade', 0.2); await F.wait(0.12); } },
          /* あまりの ブロックに わっか。 おおきい ほうの すうじを かこむ */
          async big() {
            const bigA = a > b, n0 = Math.min(a, b), n1 = Math.max(a, b), y = bigA ? ya : yb;
            const r = F.rect(x0 + n0 * dx - 25, y - 28, (n1 - n0) * dx + 2, 56, { rx: 12, fill: 'rgba(255,210,63,.25)', stroke: C.or, 'stroke-width': 5, 'stroke-dasharray': '10 7', opacity: 0 }, bg);
            await F.show(r, 'pop', 0.4);
            const hi = bigA ? hiA : hiB;
            await F.show(hi, 'pop', 0.4);
          }
        };
      },
      /* かずの せん（0〜10）。 みぎに いくほど おおきい。 pick(v) で せんの かずを タップ */
      nline(F) {
        const hl = F.g({});
        const nl = FL.numberLine(F, { x0: 44, x1: 584, y: 214, min: 0, max: 10, step: 1, labelEvery: 1, fs: 38 });
        const hit = F.g({}), bg = F.g({}), cards = [];
        for (let i = 0; i <= 10; i++) {
          const x = nl.X(i), rect = F.circle(x, 238, 28, { fill: 'rgba(255,255,255,0.01)', stroke: 'none', 'stroke-width': 4 }, hl);
          const g = F.circle(x, 234, 27, { fill: '#fff', 'fill-opacity': 0.01 }, hit);
          cards.push({ g, rect, cx: x, cy: 234 });
        }
        const dotAt = async (v, col) => { const g = F.g({ opacity: 0 }, bg); F.circle(nl.X(v), 214, 15, { fill: col, stroke: '#fff', 'stroke-width': 3 }, g); F.text(nl.X(v), 168, String(v), { 'font-size': 40, fill: col }, g); await F.show(g, 'pop', 0.4); };
        const arrow = F.g({ opacity: 0 });
        F.line(170, 112, 430, 112, { stroke: C.green, 'stroke-width': 7 }, arrow); F.path('M442 112l-20 -14v28z', { fill: C.green }, arrow); F.path('M158 112l20 -14v28z', { fill: C.green }, arrow);
        const lS = F.label(70, 112, 'តូចជាង', { color: C.blue, hide: true }), lB = F.label(534, 112, 'ធំជាង', { color: C.red, hide: true });
        return {
          async arrow() { arrow.style.opacity = 1; F.show(lS); F.show(lB); await F.show(arrow, 'fade', 0.5); },
          pick(v) { return pickTap(F, cards, v); },
          /* 2つの かずに しるし */
          async dots(a, b) { await dotAt(a, C.blue); await dotAt(b, C.red); },
          async dot(v, col) { await dotAt(v, col || C.blue); },
          async jump(a, b) { const j = F.g({ opacity: 0 }, bg), d = b > a ? 1 : -1; F.line(nl.X(a), 134, nl.X(b) - d * 18, 134, { stroke: C.green, 'stroke-width': 7 }, j); F.path(`M${nl.X(b) - d * 4} 134l${-d * 18} -12v24z`, { fill: C.green }, j); await F.show(j, 'fade', 0.5); },
          async ans(v) { F.sfx('ok'); await dotAt(v, C.pink); }
        };
      }
    },
    steps: [
      ST(1),
      T('សួស្តីកូនៗទាំងអស់គ្នា! ថ្ងៃនេះយើងប្រៀបធៀបចំនួន។', { face: 'happy', act: 'hop', o: { face: 'happy' }, note: meate }),
      P('ពីយ៉ូដឹងភ្លាមថាអ្វីច្រើនជាង!', { face: 'proud', act: 'hop', mark: 'idea' }),
      T('មានផ្លែប៉ោម និងផ្លែក្រូច។ តើអ្វីច្រើនជាង?', { face: 'normal', fig: ['pair', 5, 'apple', 3, 'orange', { nameA: 'ផ្លែប៉ោម', nameB: 'ផ្លែក្រូច' }], do: 'show' }),
      T('មិនចាំបាច់រាប់ក៏អាចប្រៀបធៀបបានដែរ។ ភ្ជាប់ម្តងមួយៗ។', { face: 'happy' }),
      ACT({ text: 'ចូរភ្ជាប់ផ្លែប៉ោម និងផ្លែក្រូចដោយបន្ទាត់ម្តងមួយ!', hint: 'ចូរប្រើម្រាមដៃគូសបន្ទាត់ពីផ្លែប៉ោមទៅផ្លែក្រូច', run: { do: 'link' }, face: 'normal' }),
      P('ផ្លែក្រូចភ្ជាប់អស់ហើយ!', { face: 'happy', act: 'hop', mark: 'sparkle' }),
      T('ផ្លែប៉ោមនៅសល់ 2 ផ្លែ។', { face: 'normal', do: 'more' }),
      Q({ text: 'ផ្លែប៉ោម និងផ្លែក្រូច តើអ្វីច្រើនជាង?', opts: ['ផ្លែប៉ោម', 'ផ្លែក្រូច'], ok: 0, tip: 'ខាងណាដែលសល់ ខាងនោះច្រើនជាង។',
        ng: { 1: [T('តើអ្វីដែលសល់? ខាងណាសល់ ខាងនោះច្រើនជាង។', { face: 'think' })] },
        exp: [T('ផ្លែប៉ោមសល់ ដូច្នេះផ្លែប៉ោមច្រើនជាង។', { face: 'happy' })] }),
      T('យើងដឹងហើយថាខាងណាច្រើន ខាងណាតិច។', { face: 'proud', note: { id: 'ms', kind: 'formula', text: 'ផ្លែប៉ោមច្រើនជាង\nផ្លែក្រូចតិចជាង', x: NX + 20, y: 110 } }),
      P('ពីយ៉ូក៏ចង់ប្រៀបធៀបដែរ! លើកនេះពីយ៉ូធ្វើ!', { face: 'cheer', act: 'jump', clearNotes: true, note: meate, fig: ['pair', 4, 'cookie', 5, 'cookie', { dxA: 130, x0A: 120, dxB: 62, x0B: 170, nameA: 'ខាងលើ', nameB: 'ខាងក្រោម' }], do: 'show' }),
      P('ខាងលើរាយបែកជាងគេ ដូច្នេះច្រើនជាង!', { face: 'proud', act: 'hop', o: { face: 'think', mark: 'q' } }),
      Q({ text: 'ខាងលើ និងខាងក្រោម តើខាងណាច្រើនជាង?', opts: ['ខាងលើ', 'ខាងក្រោម'], ok: 1, tip: 'ភ្ជាប់ម្តងមួយ ហើយប្រៀបធៀប។',
        ng: { 0: [T('ទោះបីរាយបែក ក៏ចំនួនមិនប្តូរដែរ។', { face: 'think' }), T('ចូរភ្ជាប់ម្តងមួយ ហើយប្រៀបធៀប។', { face: 'normal' })] },
        exp: [T('ពេលភ្ជាប់ម្តងមួយ ខាងលើមិនគ្រប់ទេ។', { face: 'normal', do: 'pairs' }), T('ខាងក្រោមដែលសល់ ច្រើនជាង។', { face: 'happy', do: 'more' })] }),
      P('មែនហើយ! ពេលរាយបែក មើលទៅដូចជាធំជាង!', { face: 'confused', mark: 'sweat', o: { face: 'happy' } }),
      T('កុំមើលតាមការរាយបែក ចូរភ្ជាប់ហើយប្រៀបធៀប។', { face: 'proud', o: { face: 'happy', act: 'nod' } }),

      ST(2),
      T('លើកនេះ ចូរប្រៀបធៀបដោយលេខ។ មើល 3 និង 5។', { face: 'happy', clearNotes: true, note: meate, fig: ['bars', 3, 5], do: 'show' }),
      T('បើភ្ជាប់ប្លុកម្តងមួយ…។', { face: 'normal', do: 'pairs' }),
      Q({ text: '3 និង 5 តើលេខមួយណាធំជាង?', opts: ['3', '5'], ok: 1, tip: 'ខាងណាដែលប្លុកសល់ ខាងនោះធំជាង។',
        ng: { 0: [T('ប្លុក 3 មិនសល់ទេ។', { face: 'think' })] },
        exp: [T('ខាង 5 សល់ប្លុក 2។', { face: 'happy', do: 'big' })] }),
      T('5 ធំជាង 3។ 3 តូចជាង 5។', { face: 'proud', note: { id: 'k35', kind: 'formula', text: '5 ធំជាង 3\n3 តូចជាង 5', x: NX + 20, y: 110 } }),
      P('បើ 7 និង 4 វិញ? ពីយ៉ូសាកល្បង!', { face: 'cheer', act: 'hop', fig: ['bars', 7, 4], do: ['show'] }),
      Q({ text: '7 និង 4 តើលេខមួយណាធំជាង?', opts: ['7', '4'], ok: 0, tip: 'ចូរភ្ជាប់ប្លុកម្តងមួយ។', do: 'pairs',
        ng: { 1: [T('ប្លុក 4 នឹងខ្វះឆាប់។', { face: 'think' })] },
        exp: [T('ខាង 7 សល់ 3។ 7 ធំជាង។', { face: 'happy', do: 'big' })] }),
      N({ text: 'ប្លុក 5 និង 2។ លេខដែលធំជាងគឺប៉ុន្មាន?', ans: 5, tip: 'វាជាលេខដែលប្លុកសល់។', fig: ['bars', 5, 2], do: 'show',
        exp: [T('5 ច្រើនជាង។ លេខធំជាងគឺ 5។', { face: 'happy', do: [['pairs'], ['big']] })] }),
      Q({ text: '9 និង 8 តើលេខមួយណាតូចជាង?', opts: ['9', '8'], ok: 1, tip: 'វាជាខាងដែលប្លុកខ្វះ។', fig: ['bars', 9, 8], do: 'show',
        ng: { 0: [T('ខាង 9 ប្លុកសល់។', { face: 'think' })] },
        exp: [T('8 ខ្វះមួយ។ ដូច្នេះ 8 តូចជាង។', { face: 'happy', do: 'pairs' })] }),
      BREAK(),

      ST(3),
      T('មើលបន្ទាត់លេខ។ មានពី 0 ដល់ 10។', { face: 'happy', clearNotes: true, note: meate, fig: 'nline' }),
      T('ទៅខាងស្តាំ លេខកាន់តែធំ។', { face: 'proud', do: 'arrow', note: { id: 'ml', kind: 'formula', text: 'ខាងស្តាំ\nធំជាង', x: NX + 40, y: 110 } }),
      ACT({ text: 'ចូរចុចលេខ 7 លើបន្ទាត់លេខ!', hint: 'ចូរប្រើម្រាមដៃប៉ះលេខ 7 លើបន្ទាត់', run: { do: ['pick', 7] }, face: 'normal' }),
      P('7 នៅខាងស្តាំនៃបន្ទាត់!', { face: 'surprised', act: 'jump', mark: 'ex' }),
      Q({ text: 'លើបន្ទាត់ 4 និង 9 តើលេខមួយណាធំជាង?', opts: ['4', '9'], ok: 1, tip: 'ខាងណានៅខាងស្តាំលើបន្ទាត់ ខាងនោះធំជាង។', fig: 'nline', do: 'arrow',
        ng: { 0: [T('4 នៅខាងឆ្វេងនៃ 9។', { face: 'think' })] },
        exp: [T('9 នៅខាងស្តាំ។ ដូច្នេះ 9 ធំជាង។', { face: 'happy', do: ['dots', 4, 9] })] }),
      N({ text: 'លេខដែលធំជាង 6 ចំនួន 1 គឺប៉ុន្មាន?', ans: 7, tip: 'មើលភ្លាមខាងស្តាំនៃ 6 លើបន្ទាត់។', fig: 'nline', do: [['dot', 6]],
        exp: [T('ភ្លាមខាងស្តាំនៃ 6 គឺ 7។ លេខធំជាងមួយគឺ 7។', { face: 'happy', do: [['jump', 6, 7], ['ans', 7]] })] }),
      N({ text: 'លេខដែលតូចជាង 9 ចំនួន 1 គឺប៉ុន្មាន?', ans: 8, tip: 'មើលភ្លាមខាងឆ្វេងនៃ 9 លើបន្ទាត់។', fig: 'nline', do: [['dot', 9]],
        exp: [T('ភ្លាមខាងឆ្វេងនៃ 9 គឺ 8។ លេខតូចជាងមួយគឺ 8។', { face: 'happy', do: [['jump', 9, 8], ['ans', 8]] })] }),
      T('នេះជាការសង្ខេបសម្រាប់ថ្ងៃនេះ។', { face: 'happy', clearNotes: true, note: meate }),
      T('ខាងណាសល់ពេលភ្ជាប់ ខាងនោះធំជាង។ ខាងស្តាំលើបន្ទាត់ធំជាង។', { face: 'proud', note: { id: 'sum', kind: 'formula', text: 'ខាងណាសល់ធំជាង\nខាងស្តាំលើបន្ទាត់ធំជាង', x: NX + 10, y: 110 } }),
      P('ប្រៀបធៀបងាយស្រួលណាស់!', { face: 'cheer', act: 'spin', mark: 'sparkle' }),
      T('លើកក្រោយ យើងនឹងរៀនពី «ទីប៉ុន្មាន» ពីខាងមុខ។', { face: 'happy' }),
      END({ text: 'ថ្ងៃនេះក៏ខំប្រឹងណាស់ដែរ! ត្រា «ល្អណាស់» រូបជញ្ជីង!' })
    ]
  });
})();
