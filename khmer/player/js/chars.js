/* キャラクター：ホー先生（ふくろう）とピヨ（ひよこ）。
   絵は assets/chars/<id>_<表情>_<c|o>.webp（c＝口とじ／o＝話している口）。manifest.js（window.SPRITES）にない表情は normal で代用。
   動き：呼吸（いつも）・話すと口パク＋小さくゆれる・ときどきまばたき（blink の絵があるとき）・act（はねる／ばんざい…）・mark（きらきら・あせ・？…）。 */
(function () {
  const $ = s => document.querySelector(s);
  const SP = window.SPRITES || {};
  const NAME = { ho: 'គ្រូហូ', piyo: 'ពីយ៉ូ' };
  const ALIAS = { surprise: 'surprised', star: 'surprised', spiral: 'confused', grin: 'normal' };
  /* ---- 絵がないときのピヨ（SVG・予備） ---- */
  function piyoSVG(face, open) {
    const eyes = {
      happy: '<path d="M88 118q14-14 28 0M154 118q14-14 28 0" stroke="#3b2a1e" stroke-width="7" fill="none" stroke-linecap="round"/>',
      blink: '<path d="M88 122q14 9 28 0M154 122q14 9 28 0" stroke="#3b2a1e" stroke-width="7" fill="none" stroke-linecap="round"/>',
      cheer: '<path d="M88 118q14-14 28 0M154 118q14-14 28 0" stroke="#3b2a1e" stroke-width="7" fill="none" stroke-linecap="round"/>',
      confused: '<path d="M102 120m-13 0a13 13 0 1 1 26 0a9 9 0 1 1-18 0a5 5 0 1 1 10 0M168 120m-13 0a13 13 0 1 1 26 0a9 9 0 1 1-18 0a5 5 0 1 1 10 0" stroke="#3b2a1e" stroke-width="4" fill="none"/>',
      sad: '<ellipse cx="102" cy="122" rx="14" ry="16" fill="#3b2a1e"/><ellipse cx="168" cy="122" rx="14" ry="16" fill="#3b2a1e"/><circle cx="106" cy="116" r="5" fill="#fff"/><circle cx="172" cy="116" r="5" fill="#fff"/><path d="M86 100l26-8M184 100l-26-8" stroke="#3b2a1e" stroke-width="5" stroke-linecap="round"/>',
      think: '<ellipse cx="106" cy="114" rx="13" ry="16" fill="#3b2a1e"/><ellipse cx="172" cy="114" rx="13" ry="16" fill="#3b2a1e"/><circle cx="110" cy="108" r="5" fill="#fff"/><circle cx="176" cy="108" r="5" fill="#fff"/>'
    }[face] || `<ellipse cx="102" cy="120" rx="${face === 'surprised' ? 17 : 15}" ry="${face === 'surprised' ? 20 : 18}" fill="#3b2a1e"/><ellipse cx="168" cy="120" rx="${face === 'surprised' ? 17 : 15}" ry="${face === 'surprised' ? 20 : 18}" fill="#3b2a1e"/><circle cx="107" cy="113" r="6" fill="#fff"/><circle cx="173" cy="113" r="6" fill="#fff"/>`;
    const beak = open ? '<path d="M120 142h30l-15 10z" fill="#ff9a1f" stroke="#c96a00" stroke-width="3"/><path d="M122 152h26l-13 14z" fill="#e8780a" stroke="#c96a00" stroke-width="3"/>' : '<path d="M120 142h30l-15 16z" fill="#ff9a1f" stroke="#c96a00" stroke-width="3" stroke-linejoin="round"/>';
    const wings = face === 'cheer' ? '<path d="M44 150q-30-50-6-84q20 30 26 74z" fill="#ffd84d" stroke="#8a5a14" stroke-width="5"/><path d="M226 150q30-50 6-84q-20 30-26 74z" fill="#ffd84d" stroke="#8a5a14" stroke-width="5"/>' : '<path d="M46 160q-22 30 4 58q10-30 14-50z" fill="#ffd84d" stroke="#8a5a14" stroke-width="5"/><path d="M224 160q22 30-4 58q-10-30-14-50z" fill="#ffd84d" stroke="#8a5a14" stroke-width="5"/>';
    return `<svg class="fb" viewBox="0 0 270 290"><rect x="34" y="120" width="202" height="110" rx="30" fill="#e8413c" stroke="#8a2520" stroke-width="5"/>${wings}<ellipse cx="135" cy="160" rx="100" ry="108" fill="#ffe04d" stroke="#8a5a14" stroke-width="6"/><ellipse cx="135" cy="200" rx="62" ry="58" fill="#fff3b0"/><path d="M128 54q-4-26 10-34q-2 18 4 30q6-14 18-16q-12 12-14 24" fill="#ffe04d" stroke="#8a5a14" stroke-width="5" stroke-linejoin="round"/>${eyes}<ellipse cx="78" cy="150" rx="15" ry="9" fill="#ff9aa2" opacity=".7"/><ellipse cx="192" cy="150" rx="15" ry="9" fill="#ff9aa2" opacity=".7"/>${beak}<path d="M58 172q20 6 22 34M212 172q-20 6-22 34" stroke="#c0302b" stroke-width="12" fill="none" stroke-linecap="round"/><path d="M104 262l-10 16h26zM166 262l-10 16h26z" fill="#ff9a1f" stroke="#c96a00" stroke-width="4" stroke-linejoin="round"/></svg>`;
  }
  /* ---- マーク ---- */
  const MARK = {
    sparkle: '<svg viewBox="0 0 60 60"><path d="M30 2l6 22 22 6-22 6-6 22-6-22-22-6 22-6z" fill="#ffd23f" stroke="#e0a400" stroke-width="2"/><path d="M50 4l2 7 7 2-7 2-2 7-2-7-7-2 7-2z" fill="#ffe98a"/></svg>',
    sweat: '<svg viewBox="0 0 60 60"><path d="M30 6q16 24 16 34a16 16 0 0 1-32 0q0-10 16-34z" fill="#8fd3ff" stroke="#3d9df2" stroke-width="3"/><ellipse cx="24" cy="40" rx="4" ry="6" fill="#fff" opacity=".8"/></svg>',
    q: '<svg viewBox="0 0 60 60"><text x="30" y="48" font-size="52" text-anchor="middle" font-weight="900" fill="#3d9df2" stroke="#fff" stroke-width="3" paint-order="stroke" font-family="Arial Rounded MT Bold, Arial">?</text></svg>',
    ex: '<svg viewBox="0 0 60 60"><text x="30" y="50" font-size="54" text-anchor="middle" font-weight="900" fill="#ff5d8f" stroke="#fff" stroke-width="3" paint-order="stroke" font-family="Arial Rounded MT Bold, Arial">!</text></svg>',
    heart: '<svg viewBox="0 0 60 60"><path d="M30 52S6 36 6 20a12 12 0 0 1 24-4 12 12 0 0 1 24 4c0 16-24 32-24 32z" fill="#ff6b8b" stroke="#e03a63" stroke-width="2"/></svg>',
    note: '<svg viewBox="0 0 60 60"><path d="M22 44V12l26-6v32" stroke="#9b6cf2" stroke-width="5" fill="none"/><ellipse cx="16" cy="45" rx="9" ry="7" fill="#9b6cf2"/><ellipse cx="42" cy="39" rx="9" ry="7" fill="#9b6cf2"/></svg>',
    idea: '<svg viewBox="0 0 60 60"><circle cx="30" cy="24" r="16" fill="#fff36b" stroke="#e0a400" stroke-width="3"/><rect x="23" y="40" width="14" height="10" rx="3" fill="#bbb"/><path d="M30 2v-0M8 10l4 4M52 10l-4 4" stroke="#e0a400" stroke-width="3"/></svg>',
    spiral: '<svg viewBox="0 0 60 60"><path d="M30 30m-4 0a4 4 0 1 1 8 0a9 9 0 1 1-17 0a14 14 0 1 1 28 0a19 19 0 1 1-38 0" fill="none" stroke="#9b6cf2" stroke-width="4"/></svg>'
  };
  const MARKPOS = { ho: [[140, 4], [8, 18]], piyo: [[4, 0], [150, 10]] };

  const C = {};
  function cur(who) { return C[who]; }
  function srcOf(who, face, open) {
    const d = SP[who]; if (!d) return null;
    const f = d[face] || d.normal; return (open && f.o) || f.c;
  }
  function render(who) {
    const c = C[who]; if (!c) return;
    const face = c.blink ? 'blink' : c.face, open = c.open && !c.blink;
    if (SP[who] && SP[who].normal) {
      const s = srcOf(who, (c.blink && SP[who].blink) ? 'blink' : c.face, open);
      if (c.img.getAttribute('src') !== s) c.img.setAttribute('src', s);
    } else if (who === 'piyo') {
      const key = face + (open ? 'o' : 'c'); if (c.svgKey !== key) { c.svgKey = key; c.box.innerHTML = piyoSVG(face, open); }
    }
  }
  function init() {
    for (const [who, sel] of [['ho', '#chHo'], ['piyo', '#chPiyo']]) {
      const el = $(sel); if (!el) continue;
      C[who] = { el, box: el.querySelector('.body'), img: el.querySelector('img'), face: 'normal', open: false, blink: false, talking: false, level: null };
      if (!(SP[who] && SP[who].normal)) { C[who].img.remove(); C[who].img = null; }
      render(who); scheduleBlink(who);
    }
    // 絵を先に読みこんでおく（表情を切りかえたときにちらつかない）
    Object.values(SP).forEach(d => Object.values(d).forEach(f => Object.values(f).forEach(u => { const im = new Image(); im.src = u; })));
    requestAnimationFrame(loop);
  }
  function scheduleBlink(who) {
    const c = C[who]; if (!c) return;
    setTimeout(() => {
      const can = c.face === 'normal' && !c.talking && (who === 'piyo' && !(SP.piyo && SP.piyo.normal) ? true : !!(SP[who] && SP[who].blink));
      if (can) { c.blink = true; render(who); setTimeout(() => { c.blink = false; render(who); }, 140); }
      scheduleBlink(who);
    }, 2200 + Math.random() * 3200);
  }
  /* 口パク：話している人の level()（0〜1：声の大きさ。声がないときは時間で作る）で口をあける */
  function loop(t) {
    for (const who in C) {
      const c = C[who]; let open = false;
      if (c.talking) { const lv = c.level ? c.level() : (Math.sin(t / 55) > -0.1 ? 0.6 : 0); open = lv > 0.2; }
      if (open !== c.open) { c.open = open; render(who); }
    }
    requestAnimationFrame(loop);
  }
  function face(who, f) { const c = C[who]; if (!c || !f) return; c.face = ALIAS[f] || f; render(who); }
  function talk(who, on, level) {
    for (const w in C) { const c = C[w]; const me = w === who && on; c.talking = me; c.level = me ? level || null : null; c.el.classList.toggle('talk', me); c.el.classList.toggle('dim', !!on && w !== who); }
  }
  function act(who, a) {
    const c = C[who]; if (!c || !a) return;
    const cls = 'a-' + a; c.el.classList.remove(...[...c.el.classList].filter(k => k.startsWith('a-')));
    void c.el.offsetWidth; c.el.classList.add(cls);
    if (a === 'stretch') return;   // くり返し（止めるときは act(who, 'none')）
    clearTimeout(c.actT); c.actT = setTimeout(() => c.el.classList.remove(cls), 1300);
  }
  function mark(who, m) {
    const c = C[who]; if (!c || !m || !MARK[m]) return;
    const box = c.el.querySelector('.marks'); [...box.children].forEach(x => { x.classList.add('out'); setTimeout(() => x.remove(), 400); });
    const d = document.createElement('div'); d.className = 'mark'; d.innerHTML = MARK[m];
    const [x, y] = MARKPOS[who][m === 'sweat' ? 1 : 0]; d.style.left = x + 'px'; d.style.top = y + 'px'; box.appendChild(d);
    clearTimeout(c.markT); c.markT = setTimeout(() => { d.classList.add('out'); setTimeout(() => d.remove(), 400); }, 2600);
  }
  function clearMarks() { for (const w in C) C[w].el.querySelector('.marks').innerHTML = ''; }
  /* ほかの画面（はじめ・休けい）で使う絵 */
  function imgHTML(who, f, cls) {
    const s = srcOf(who, f || 'normal', false);
    return s ? `<img class="${cls || ''}" src="${s}" alt="${NAME[who]}">` : (who === 'piyo' ? piyoSVG(f || 'normal', false).replace('class="fb"', `class="${cls || ''}"`) : '');
  }
  window.CH = { init, face, talk, act, mark, clearMarks, imgHTML, NAME, cur };
})();
