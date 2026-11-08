/* 1年「10までの かず」第5回：0という かず
   たまごを 1こずつ とって いく（ゆびで タップ）→ なにも ない ときが 0 →「0は かずじゃない」と いう ピヨを なおす →
   かずの せん 0〜10（0は いちばん ひだり・つぎの かず／ひとつ まえの かず）→ チャレンジ：バラバラの カード 0〜10 を じゅんに タップして ならべる →
   たまごモンスター（HP 3）を 3もんで やっつけると ひよこが うまれる。
   1年なので：ひらがなと 分かち書き・みじかい 文・ゆっくり・2たくが 中心。 */
(function () {
  const { T, P, Q, N, TAP, ACT, ST, BREAK, END } = HS;
  const C = FL.COL, NX = 700, INK = '#3b2a1e';
  const meate = { id: 'meate', kind: 'title', tag: 'គោលដៅ', text: 'ចូររៀនអំពីលេខ 0', x: NX, y: 22 };

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
        if (wrong >= 2) cards[ok].rect.setAttribute('stroke', C.ye);
      });
    });
    return it.promise;
  }

  HS.lesson({
    id: 'kazu10-05', grade: 1, unit: 'លេខរហូតដល់ 10', no: 5, title: 'លេខ 0', sticker: '🥚',
    goal: 'ចូររៀនអំពីលេខ 0 និងលំដាប់ពី 0 ដល់ 10',
    stages: ['ពេលគ្មានអ្វីសោះ គឺ 0', 'លំដាប់លេខ', 'ការប្រកួត!'],
    figs: {
      /* おさら・すに ものが n こ。 take（ゆびで 1こずつ とる）・auto（おてほん）で 0こに なる */
      tray(F, kind, n, showNum) {
        showNum = showNum !== false;
        const cx = 250, nest = kind === 'egg', k = 66 / 34;
        if (nest) { F.el('ellipse', { cx, cy: 276, rx: 205, ry: 48, fill: '#d9a066', stroke: '#8a5a2b', 'stroke-width': 5 }); F.el('ellipse', { cx, cy: 268, rx: 160, ry: 30, fill: '#f0c78f' }); }
        else { F.el('ellipse', { cx, cy: 276, rx: 205, ry: 48, fill: '#fff', stroke: '#adb5bd', 'stroke-width': 5 }); F.el('ellipse', { cx, cy: 270, rx: 160, ry: 30, fill: '#f1f3f5' }); }
        const els = [];
        for (let i = 0; i < n; i++) {
          const x = cx + (i - (n - 1) / 2) * 100, y = 226, e = FL.icon(F, kind, x, y, 66);
          e.style.opacity = 0; els.push({ e, x, y, gone: false });
        }
        const num = F.text(535, 190, String(n), { 'font-size': 140, fill: C.pink, opacity: 0 });
        const none = F.label(535, 292, 'គ្មានអ្វីសោះ', { cls: 'l', color: C.red, hide: true });
        let left = n;
        const setNum = v => { num.textContent = String(v); };
        const fly = async o => {   // 1こ とる：上へ ふわっと きえる
          o.gone = true; o.e.classList.remove('tapme');
          await F.tween(0.5, u => { o.e.style.opacity = 1 - u; o.e.setAttribute('transform', `translate(${o.x} ${o.y - 70 * u}) scale(${k})`); });
          o.e.style.opacity = 0;
        };
        return {
          async show() {
            for (const o of els) { o.e.style.opacity = 1; F.sfx('pop'); F.show(o.e, 'pop', 0.3); await F.wait(0.15); }
            if (showNum) { num.style.opacity = 1; await F.show(num, 'pop', 0.4); if (n === 0) { none.style.opacity = 1; await F.show(none); } }
          },
          /* かずの すうじを あとから 出す（こたえあわせ） */
          async reveal() { setNum(left); num.style.opacity = 1; await F.show(num, 'pop', 0.4); if (left === 0) { none.style.opacity = 1; await F.show(none); } },
          /* ゆびで 1こずつ とる */
          async take() {
            const it = F.interact(() => { els.forEach(o => { o.gone = true; o.e.style.opacity = 0; }); left = 0; setNum(0); });
            els.forEach(o => {
              o.e.classList.add('tapme');
              o.e.addEventListener('pointerdown', ev => {
                ev.preventDefault(); if (it.over || o.gone) return;
                left--; setNum(left); F.sfx('pop'); fly(o);
                if (left === 0) { F.sfx('ok'); F.wait(0.7).then(() => it.done()); }
              });
            });
            await it.promise;
            none.style.opacity = 1; await F.show(none);
          },
          /* おてほん：1こずつ とって いく */
          async auto() {
            for (const o of els) { if (o.gone) continue; left--; setNum(left); F.sfx('pop'); await fly(o); await F.wait(0.25); }
            if (showNum) { none.style.opacity = 1; await F.show(none); }
          }
        };
      },
      /* かずの せん（0〜10） */
      nline(F) {
        const nl = FL.numberLine(F, { x0: 44, x1: 584, y: 214, min: 0, max: 10, step: 1, labelEvery: 1, fs: 38 });
        const bg = F.g({});
        const dotAt = async (v, col) => { const g = F.g({ opacity: 0 }, bg); F.circle(nl.X(v), 214, 15, { fill: col, stroke: '#fff', 'stroke-width': 3 }, g); F.text(nl.X(v), 168, String(v), { 'font-size': 40, fill: col }, g); await F.show(g, 'pop', 0.4); };
        const hopper = F.circle(nl.X(0), 214, 17, { fill: C.pink, stroke: '#fff', 'stroke-width': 3, opacity: 0 });
        const arrow = F.g({ opacity: 0 });
        F.line(170, 112, 430, 112, { stroke: C.green, 'stroke-width': 7 }, arrow); F.path('M442 112l-20 -14v28z', { fill: C.green }, arrow); F.path('M158 112l20 -14v28z', { fill: C.green }, arrow);
        const lS = F.label(70, 112, 'តូចជាង', { color: C.blue, hide: true }), lB = F.label(534, 112, 'ធំជាង', { color: C.red, hide: true });
        return {
          async arrow() { arrow.style.opacity = 1; F.show(lS); F.show(lB); await F.show(arrow, 'fade', 0.5); },
          /* 0から 10まで ぴょんぴょん */
          async hop() {
            hopper.style.opacity = 1;
            for (let i = 0; i <= 10; i++) { hopper.setAttribute('cx', nl.X(i)); F.sfx('count'); await F.wait(0.32); }
          },
          async dot(v, col) { await dotAt(v, col || C.blue); },
          async jump(a, b) { const j = F.g({ opacity: 0 }, bg), d = b > a ? 1 : -1; F.line(nl.X(a), 134, nl.X(b) - d * 18, 134, { stroke: C.green, 'stroke-width': 7 }, j); F.path(`M${nl.X(b) - d * 4} 134l${-d * 18} -12v24z`, { fill: C.green }, j); await F.show(j, 'fade', 0.5); },
          async ans(v) { F.sfx('ok'); await dotAt(v, C.pink); }
        };
      },
      /* バラバラの カード 0〜10。 0から じゅんに タップすると、 下の わくに ならぶ */
      cards(F) {
        const perm = [6, 2, 9, 0, 4, 10, 7, 3, 8, 1, 5];
        const slot = v => [38 + v * 54, 326];
        for (let v = 0; v <= 10; v++) { const [sx, sy] = slot(v); F.rect(sx - 25, sy - 31, 50, 62, { rx: 9, fill: 'rgba(255,255,255,.6)', stroke: '#ced4da', 'stroke-width': 3, 'stroke-dasharray': '6 5' }); }
        const cs = perm.map((v, i) => {
          const [x, y] = i < 6 ? [70 + i * 100, 76] : [120 + (i - 6) * 100, 184];
          const g = F.g({ transform: `translate(${x} ${y})`, opacity: 0 });
          const rect = F.rect(-38, -42, 76, 84, { rx: 14, fill: '#fff', stroke: '#f3a0b5', 'stroke-width': 4 }, g);
          F.text(0, 3, String(v), { 'font-size': 54, fill: INK }, g);
          return { v, g, rect, x, y, done: false };
        });
        const put = c => { const [sx, sy] = slot(c.v); c.g.setAttribute('transform', `translate(${sx} ${sy}) scale(0.6)`); c.done = true; c.g.classList.remove('tapme'); c.rect.setAttribute('stroke', C.green); c.rect.setAttribute('fill', '#ebfbee'); };
        return {
          async show() { for (const c of cs) { c.g.style.opacity = 1; F.sfx('pop'); F.show(c.g, 'pop', 0.25); await F.wait(0.08); } await F.wait(0.2); },
          async order() {
            let next = 0, wrong = 0;
            const it = F.interact(() => { cs.filter(c => !c.done).sort((a, b) => a.v - b.v).forEach(put); });
            cs.forEach(c => {
              c.g.classList.add('tapme');
              c.g.addEventListener('pointerdown', ev => {
                ev.preventDefault(); if (it.over || c.done) return;
                if (c.v === next) {
                  next++; wrong = 0; F.sfx('pop'); c.done = true; c.g.classList.remove('tapme'); c.rect.setAttribute('stroke', C.green); c.rect.setAttribute('fill', '#ebfbee');
                  const [sx, sy] = slot(c.v), fx = c.x, fy = c.y;
                  F.tween(0.4, u => c.g.setAttribute('transform', `translate(${fx + (sx - fx) * u} ${fy + (sy - fy) * u}) scale(${1 - 0.4 * u})`));
                  cs.forEach(d => { if (!d.done) d.rect.setAttribute('stroke', '#f3a0b5'); });
                  if (next > 10) { F.sfx('ok'); F.confetti(320, 300, 50); F.wait(0.9).then(() => it.done()); }
                } else {
                  wrong++; F.sfx('ng'); const old = c.rect.getAttribute('stroke'); c.rect.setAttribute('stroke', C.red); F.wait(0.5).then(() => c.rect.setAttribute('stroke', old));
                  if (wrong >= 2) { const n = cs.find(d => d.v === next); if (n) n.rect.setAttribute('stroke', C.ye); }   // 2かい まちがえたら ヒント
                }
              });
            });
            await it.promise;
          }
        };
      },
      /* たまごモンスター（HP 3）。 こたえると ヒビ → さいごは ひよこが うまれる */
      boss(F) {
        const EX = 170, EY = 226;
        const egg = F.g({ opacity: 0 });
        FL.icon(F, 'egg', EX, EY, 200, egg);
        F.circle(EX - 32, EY - 22, 17, { fill: '#fff', stroke: '#5a3a22', 'stroke-width': 3 }, egg); F.circle(EX + 32, EY - 22, 17, { fill: '#fff', stroke: '#5a3a22', 'stroke-width': 3 }, egg);
        F.circle(EX - 28, EY - 18, 8, { fill: '#212529' }, egg); F.circle(EX + 28, EY - 18, 8, { fill: '#212529' }, egg);
        F.path(`M${EX - 54} ${EY - 52}L${EX - 16} ${EY - 40}M${EX + 54} ${EY - 52}L${EX + 16} ${EY - 40}`, { stroke: '#5a3a22', 'stroke-width': 6 }, egg);
        F.path(`M${EX - 30} ${EY + 34}l15 -14l15 14l15 -14l15 14`, { fill: 'none', stroke: '#c92a2a', 'stroke-width': 5 }, egg);
        const crackD = [
          `M${EX - 62} ${EY - 12}l22 18l-10 22l26 16`,
          `M${EX + 66} ${EY - 40}l-24 24l18 16l-26 22`,
          `M${EX} ${EY - 98}l-14 28l24 22l-20 30l26 26`
        ];
        const cracks = crackD.map(d => F.path(d, { fill: 'none', stroke: '#5a3a22', 'stroke-width': 6, opacity: 0 }));
        const hpG = F.g({ opacity: 0 }), hearts = [];
        F.text(40, 38, 'HP', { 'font-size': 26, fill: '#e03131' }, hpG);
        for (let i = 0; i < 3; i++) hearts.push(F.path('M0 14C-26 -4 -16 -24 0 -10C16 -24 26 -4 0 14Z', { fill: '#ff6b6b', stroke: '#c92a2a', 'stroke-width': 3, transform: `translate(${96 + i * 52} 36)` }, hpG));
        const picG = F.g({});
        F.rect(344, 40, 262, 290, { rx: 22, fill: 'rgba(255,255,255,.75)', stroke: '#ced4da', 'stroke-width': 3, 'stroke-dasharray': '10 8' });
        const chick = F.g({ opacity: 0 });
        F.circle(EX, EY + 12, 78, { fill: '#ffd43b', stroke: '#e67700', 'stroke-width': 5 }, chick);
        F.path(`M${EX - 10} ${EY - 64}q-6 -22 6 -28M${EX + 4} ${EY - 66}q2 -22 16 -24`, { fill: 'none', stroke: '#e67700', 'stroke-width': 5 }, chick);
        F.circle(EX - 28, EY - 2, 10, { fill: '#212529' }, chick); F.circle(EX + 28, EY - 2, 10, { fill: '#212529' }, chick);
        F.circle(EX - 25, EY - 5, 3, { fill: '#fff' }, chick); F.circle(EX + 31, EY - 5, 3, { fill: '#fff' }, chick);
        F.path(`M${EX - 14} ${EY + 14}L${EX + 14} ${EY + 14}L${EX} ${EY + 34}Z`, { fill: '#ff922b', stroke: '#e8590c', 'stroke-width': 3 }, chick);
        F.circle(EX - 50, EY + 18, 12, { fill: '#ffa8a8', opacity: 0.8 }, chick); F.circle(EX + 50, EY + 18, 12, { fill: '#ffa8a8', opacity: 0.8 }, chick);
        F.path(`M${EX - 30} ${EY + 90}v18M${EX + 30} ${EY + 90}v18`, { stroke: '#ff922b', 'stroke-width': 6 }, chick);
        const win = F.label(330, 360, 'កូនមាន់បានញាស់ហើយ!', { cls: 'l', color: C.pink, hide: true });
        let hp = 3;
        return {
          async show() { egg.style.opacity = 1; F.sfx('whoosh'); await F.show(egg, 'pop', 0.6); hpG.style.opacity = 1; await F.show(hpG, 'fade', 0.3); },
          /* もんだいの 絵：ことば（text） */
          async pic(text, size) {
            while (picG.firstChild) picG.firstChild.remove();
            const t = F.text(475, 185, text, { 'font-size': size || 60, fill: INK }, picG); F.sfx('pop'); await F.show(t, 'pop', 0.4);
          },
          async hit() {
            if (hp <= 0) return; hp--;
            const h = hearts[hp]; F.sfx('cut'); await F.hide(h, 0.3);
            cracks[2 - hp].style.opacity = 1; await F.draw(cracks[2 - hp], 0.4);
            await F.tween(0.35, u => egg.setAttribute('transform', `translate(${Math.sin(u * 30) * 8 * (1 - u)} 0)`)); egg.removeAttribute('transform');
          },
          async hatch() {
            F.sfx('clear'); await Promise.all([F.hide(egg, 0.4), ...cracks.map(c => F.hide(c, 0.3))]);
            chick.style.opacity = 1; await F.show(chick, 'pop', 0.7); F.confetti(EX, EY, 60); await F.show(win);
          }
        };
      }
    },
    steps: [
      ST(1),
      T('សួស្តីកូនៗទាំងអស់គ្នា! ថ្ងៃនេះយើងរៀនលេខ «0»។', { face: 'happy', act: 'hop', o: { face: 'happy' }, note: meate, say: 'សួស្តីកូនៗទាំងអស់គ្នា! ថ្ងៃនេះយើងរៀនលេខសូន្យ។' }),
      P('សូន្យ? សូន្យជាអ្វី?', { face: 'think', mark: 'q' }),
      T('មានស៊ុត 3 គ្រាប់។ យើងនឹងយកចេញម្តងមួយ។', { face: 'normal', fig: ['tray', 'egg', 3], do: 'show' }),
      ACT({ text: 'ចូរប៉ះស៊ុតម្តងមួយ ហើយយកចេញ!', hint: 'ចូរប្រើម្រាមដៃប៉ះស៊ុត', run: { do: 'take' }, face: 'normal' }),
      P('ស៊ុតអស់ហើយ មិនសល់មួយសោះ!', { face: 'surprised', act: 'jump', mark: 'ex' }),
      T('ពេលគ្មានអ្វីសោះ ចំនួនគឺ «0»។ អានថា «សូន្យ»។', { face: 'proud', note: { id: 'n0', kind: 'formula', text: '0', x: NX + 130, y: 100, size: 100 }, say: 'ពេលគ្មានអ្វីសោះ ចំនួនគឺសូន្យ។' }),
      Q({ text: 'តើនំគុកគីក្នុងចានមានប៉ុន្មាន?', opts: ['0 ដុំ', '1 ដុំ'], ok: 0, unnote: 'n0', fig: ['tray', 'cookie', 0, false], do: 'show', tip: 'មិនមាននំគុកគីសោះ។ ពេលគ្មានអ្វីសោះ តើជាប៉ុន្មាន?',
        ng: { 1: [T('សូមមើលចានឱ្យច្បាស់។ តើមាននំគុកគីទេ?', { face: 'think' })] },
        exp: [T('ព្រោះមិនមានសោះ ដូច្នេះ 0 ដុំ។', { face: 'happy', do: 'reveal', say: 'ព្រោះមិនមានសោះ ដូច្នេះសូន្យដុំ។' })] }),
      T('មានផ្លែប៉ោម 2 ផ្លែ។ ចូរសាកល្បងញ៉ាំអស់។', { face: 'happy', fig: ['tray', 'apple', 2, false], do: 'show' }),
      N({ text: 'ញ៉ាំផ្លែប៉ោមអស់ហើយ។ នៅសល់ប៉ុន្មាន?', ans: 0, unit: 'ផ្លែ', tip: 'ចូរបញ្ចូលចំនួនពេលគ្មានអ្វីសោះ។', do: 'auto',
        exp: [T('មិនសល់មួយសោះ។ 0 ផ្លែ។', { face: 'happy', do: [['auto'], ['reveal']], say: 'មិនសល់មួយសោះ។ សូន្យផ្លែ។' })] }),
      P('សូន្យ! ពេលអស់ហើយ គឺសូន្យ!', { face: 'cheer', act: 'jump', mark: 'sparkle' }),
      P('ប៉ុន្តែពីយ៉ូគិតថា ព្រោះគ្មានអ្វីសោះ 0 មិនមែនជាលេខទេ!', { face: 'proud', act: 'hop', o: { face: 'think', mark: 'q' }, say: 'ប៉ុន្តែពីយ៉ូគិតថា ព្រោះគ្មានអ្វីសោះ សូន្យមិនមែនជាលេខទេ!' }),
      Q({ text: 'ពីយ៉ូនិយាយថា «0 មិនមែនជាលេខទេ»។ ត្រូវទេ?', opts: ['ត្រូវ', 'ខុស'], ok: 1, tip: '0 ក៏ជាចំនួនមួយ ដែលមានន័យថា «គ្មានអ្វីសោះ»។', say: 'ពីយ៉ូនិយាយថា «សូន្យមិនមែនជាលេខទេ»។ ត្រូវទេ?',
        ng: { 0: [T('0 ក៏ជាចំនួនពិតប្រាកដដែរ។ ចូរគិតមើល។', { face: 'think', say: 'សូន្យក៏ជាចំនួនពិតប្រាកដដែរ។ ចូរគិតមើល។' })] },
        exp: [T('0 ក៏ជាចំនួនដែរ។ វាបង្ហាញថាគ្មានអ្វីសោះ។', { face: 'happy', say: 'សូន្យក៏ជាចំនួនដែរ។ វាបង្ហាញថាគ្មានអ្វីសោះ។' })] }),
      P('អ្ហា៎ 0 ក៏ជាចំនួនដែរ! សុំទោស!', { face: 'confused', mark: 'sweat', o: { face: 'happy' }, say: 'អ្ហា៎ សូន្យក៏ជាចំនួនដែរ! សុំទោស!' }),

      ST(2),
      T('ចូររៀបពី 0 ដល់ 10 លើបន្ទាត់លេខ។', { face: 'happy', clearNotes: true, note: meate, fig: 'nline', say: 'ចូររៀបពីសូន្យដល់ 10 លើបន្ទាត់លេខ។' }),
      TAP({ text: 'លោតៗ ពី 0 ដល់ 10!', btn: 'លោតៗ!', run: { do: 'hop' }, face: 'normal', say: 'លោតៗ ពីសូន្យដល់ 10!' }),
      P('0, 1, 2, 3…10! 0 នៅខាងឆ្វេងបំផុត!', { face: 'cheer', act: 'hop', mark: 'note', say: 'សូន្យ, 1, 2, 3…10! សូន្យនៅខាងឆ្វេងបំផុត!' }),
      T('0 ជាលេខតូចបំផុត។ ទៅខាងស្តាំ កាន់តែធំ។', { face: 'proud', do: 'arrow', note: { id: 'ml', kind: 'formula', text: '0 ជាលេខ\nតូចបំផុត', x: NX + 40, y: 110 }, say: 'សូន្យជាលេខតូចបំផុត។ ទៅខាងស្តាំ កាន់តែធំ។' }),
      Q({ text: 'តើលេខខាងឆ្វេងបំផុតលើបន្ទាត់ជាអ្វី?', opts: ['0', '1'], ok: 0, tip: 'មើលចុងខាងឆ្វេងនៃបន្ទាត់។', fig: 'nline', do: 'arrow',
        ng: { 1: [T('នៅខាងឆ្វេងជាងលេខ 1 មាន 0។', { face: 'think', say: 'នៅខាងឆ្វេងជាងលេខមួយ មានសូន្យ។' })] },
        exp: [T('ខាងឆ្វេងបំផុតគឺ 0។', { face: 'happy', do: ['dot', 0], say: 'ខាងឆ្វេងបំផុតគឺសូន្យ។' })] }),
      N({ text: 'លេខបន្ទាប់ពី 3 គឺប៉ុន្មាន?', ans: 4, tip: 'មើលភ្លាមខាងស្តាំនៃ 3 លើបន្ទាត់។', fig: 'nline', do: [['dot', 3]],
        exp: [T('បន្ទាប់ពី 3 គឺ 4។', { face: 'happy', do: [['jump', 3, 4], ['ans', 4]] })] }),
      N({ text: 'លេខដែលនៅមុន 5 មួយ គឺប៉ុន្មាន?', ans: 4, tip: 'មើលភ្លាមខាងឆ្វេងនៃ 5 លើបន្ទាត់។', fig: 'nline', do: [['dot', 5]],
        exp: [T('មុន 5 មួយ គឺ 4។', { face: 'happy', do: [['jump', 5, 4], ['ans', 4]] })] }),
      N({ text: 'លេខបន្ទាប់ពី 9 គឺប៉ុន្មាន?', ans: 10, tip: 'វាជាលេខខាងស្តាំបំផុតលើបន្ទាត់។', fig: 'nline', do: [['dot', 9]],
        exp: [T('បន្ទាប់ពី 9 គឺ 10។', { face: 'happy', do: [['jump', 9, 10], ['ans', 10]] })] }),
      Q({ text: 'លេខបន្ទាប់ពី 0 គឺមួយណា?', opts: ['1', '10'], ok: 0, tip: 'មើលភ្លាមខាងស្តាំនៃ 0 លើបន្ទាត់។', fig: 'nline', do: [['dot', 0]], say: 'លេខបន្ទាប់ពីសូន្យ គឺមួយណា?',
        ng: { 1: [T('10 នៅខាងស្តាំបំផុត។ ភ្លាមខាងស្តាំនៃ 0 គឺអ្វី?', { face: 'think', say: 'ដប់នៅខាងស្តាំបំផុត។ ភ្លាមខាងស្តាំនៃសូន្យ គឺអ្វី?' })] },
        exp: [T('បន្ទាប់ពី 0 គឺ 1។', { face: 'happy', do: [['jump', 0, 1], ['ans', 1]], say: 'បន្ទាប់ពីសូន្យ គឺ 1។' })] }),
      BREAK(),

      ST(3),
      T('ការប្រកួត! ចូររៀបកាតដែលរាយប៉ាយ។', { face: 'cheer', act: 'jump', sfx: 'stage', clearNotes: true, note: meate, fig: 'cards', do: 'show', o: { face: 'cheer', act: 'jump' } }),
      ACT({ text: 'ចូរចុចកាតតាមលំដាប់ចាប់ពី 0!', hint: 'ចូរប្រើម្រាមដៃប៉ះចំនួនតូចមុន', run: { do: 'order' }, face: 'normal', say: 'ចូរចុចកាតតាមលំដាប់ចាប់ពីសូន្យ!' }),
      P('រៀបអស់ហើយ! ពី 0 ដល់ 10!', { face: 'cheer', act: 'jump', mark: 'sparkle', say: 'រៀបអស់ហើយ! ពីសូន្យដល់ 10!' }),
      T('ប្រយ័ត្ន! ស៊ុតសត្វចម្លែកបានលេចមក!', { face: 'surprised', act: 'jump', sfx: 'stage', clear: true, note: meate, fig: 'boss', do: 'show', o: { face: 'surprised', act: 'jump', mark: 'ex' } }),
      P('ខ… ខ្លាច… ប៉ុន្តែ ឆ្លើយឱ្យត្រូវ ដើម្បីកម្ចាត់វា!', { face: 'proud', act: 'hop', mark: 'sweat' }),
      Q({ text: 'វាយប្រហារទី 1! ពេលគ្មានអ្វីសោះ ចំនួនគឺប៉ុន្មាន?', opts: ['0', '1'], ok: 0, tip: 'វាជាចំនួនពេលមិនមានមួយសោះ។', do: ['pic', '？', 80], say: 'វាយប្រហារទី 1! ពេលគ្មានអ្វីសោះ ចំនួនគឺប៉ុន្មាន?',
        ng: { 1: [T('ពេលគ្មានអ្វីសោះ មិនមែន 1 ទេ។', { face: 'think' })] },
        exp: [T('0! មានស្នាមប្រេះហើយ!', { face: 'happy', do: 'hit', say: 'សូន្យ! មានស្នាមប្រេះហើយ!' })] }),
      N({ text: 'វាយប្រហារទី 2! លេខនៅចន្លោះ 7 និង 9 គឺប៉ុន្មាន?', ans: 8, tip: 'ចូរនឹកដល់លំដាប់នៃលេខលើបន្ទាត់។', do: ['pic', '7  ？  9', 56],
        exp: [T('7, 8, 9។ ចំកណ្តាលគឺ 8! ជិតហើយ!', { face: 'happy', do: 'hit' })] }),
      N({ text: 'វាយចុងក្រោយ! លេខដែលនៅមុន 10 មួយ គឺប៉ុន្មាន?', ans: 9, tip: 'វាជាលេខភ្លាមខាងឆ្វេងនៃ 10។', do: ['pic', '？  10', 56],
        exp: [T('មុន 10 មួយ គឺ 9។ ជោគជ័យ!', { face: 'happy', do: [['hit'], ['hatch']], sfx: 'clear' }), P('ហ៊ូរ៉ា! កូនមាន់បានញាស់ហើយ! ជាមិត្តរបស់ពីយ៉ូ!', { face: 'cheer', act: 'jump', mark: 'sparkle', o: { face: 'cheer', act: 'hop' } })] }),
      T('នេះជាការសង្ខេបសម្រាប់ថ្ងៃនេះ។', { face: 'happy', clearNotes: true, note: meate }),
      T('ពេលគ្មានអ្វីសោះ គឺ 0។ បន្ទាត់លេខរៀបតាមលំដាប់ចាប់ពី 0។', { face: 'proud', note: { id: 'sum', kind: 'formula', text: '0…ចំនួនគ្មានអ្វីសោះ\n0 1 2 … 10', x: NX + 10, y: 110 }, say: 'ពេលគ្មានអ្វីសោះ គឺសូន្យ។ បន្ទាត់លេខរៀបតាមលំដាប់ចាប់ពីសូន្យ។' }),
      P('ពី 0 ដល់ 10 ពីយ៉ូនិយាយបានទាំងអស់!', { face: 'cheer', act: 'spin', mark: 'sparkle', say: 'ពីសូន្យដល់ 10 ពីយ៉ូនិយាយបានទាំងអស់!' }),
      END({ text: 'ថ្ងៃនេះក៏ខំប្រឹងណាស់ដែរ! ត្រា «ល្អណាស់» រូបស៊ុត!' })
    ]
  });
})();
