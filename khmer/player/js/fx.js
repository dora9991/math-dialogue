/* 効果：効果音（その場で合成。音のファイルは使わない）・紙ふぶき・星が飛ぶ・帯（ステージ）・ひとこと（れんぞく正解） */
(function () {
  const $ = s => document.querySelector(s);
  /* ---------- 効果音 ---------- */
  let ac = null, master = null, on = true;
  function ctx() {
    if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); master = ac.createGain(); master.gain.value = 0.32; master.connect(ac.destination); } catch (e) { ac = null; } }
    if (ac && ac.state === 'suspended') ac.resume();
    return ac;
  }
  function tone(f, t0, dur, type, vol, f2) {
    const a = ctx(); if (!a || !on) return;
    const o = a.createOscillator(), g = a.createGain(), t = a.currentTime + t0;
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.5, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
  }
  const SFX = {
    ok() { tone(1318.5, 0, 0.22, 'sine', 0.55); tone(1046.5, 0.16, 0.5, 'sine', 0.55); tone(2637, 0, 0.12, 'sine', 0.08); },   // ピンポン
    ng() { tone(330, 0, 0.16, 'triangle', 0.45, 300); tone(247, 0.17, 0.34, 'triangle', 0.45, 196); },                           // ぽわん（やさしめ）
    pop() { tone(660, 0, 0.09, 'sine', 0.3, 990); },
    tap() { tone(880, 0, 0.06, 'square', 0.12); },
    key() { tone(1200, 0, 0.04, 'sine', 0.18); },
    star() { [1568, 1976, 2349, 3136].forEach((f, i) => tone(f, i * 0.06, 0.22, 'sine', 0.22)); },
    whoosh() { tone(300, 0, 0.35, 'sawtooth', 0.05, 1200); },
    stage() { [523.3, 659.3, 784, 1046.5].forEach((f, i) => tone(f, i * 0.11, i === 3 ? 0.5 : 0.16, 'triangle', 0.35)); },
    clear() { [523.3, 659.3, 784, 659.3, 784, 1046.5].forEach((f, i) => tone(f, i * 0.13, i === 5 ? 0.9 : 0.18, 'triangle', 0.38)); [1046.5, 1318.5, 1568].forEach(f => tone(f, 0.78, 0.9, 'sine', 0.12)); },
    cut() { tone(2400, 0, 0.05, 'square', 0.06, 900); },
    count() { tone(990, 0, 0.05, 'sine', 0.12); },
    combo() { [880, 1108.7, 1318.5, 1760].forEach((f, i) => tone(f, i * 0.05, 0.15, 'square', 0.1)); }
  };
  function sfx(name) { try { (SFX[name] || (() => {}))(); } catch (e) { /* 音が出せない環境 */ } }

  /* ---------- 紙ふぶき ---------- */
  const COLORS = ['#ff6b6b', '#ffd23f', '#4dabf7', '#51cf66', '#ff8c2e', '#cc5de8', '#ff5d8f'];
  let parts = [], raf = 0;
  function confetti(x, y, n, spread) {
    const cv = $('#fx'); if (!cv) return;
    for (let i = 0; i < (n || 70); i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * (spread || 2.2), v = 7 + Math.random() * 9;
      parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.4, w: 8 + Math.random() * 8, h: 5 + Math.random() * 6, c: COLORS[i % COLORS.length], star: Math.random() < 0.25, life: 1 });
    }
    if (!raf) raf = requestAnimationFrame(tick);
  }
  function starPath(g, r) { g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.closePath(); }
  function tick() {
    const cv = $('#fx'), g = cv.getContext('2d'); g.clearRect(0, 0, cv.width, cv.height);
    parts = parts.filter(p => p.life > 0 && p.y < 760);
    for (const p of parts) {
      p.vy += 0.32; p.vx *= 0.985; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life -= 0.006;
      g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.globalAlpha = Math.min(1, p.life * 2); g.fillStyle = p.c;
      if (p.star) { starPath(g, p.w * 0.8); g.fill(); } else { g.scale(1, Math.cos(p.r * 3)); g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); }
      g.restore();
    }
    raf = parts.length ? requestAnimationFrame(tick) : 0;
  }
  /* ---------- 星が飛んで、右上の数がふえる ---------- */
  const STAR = '<svg viewBox="0 0 24 24"><path d="M12 2.2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17.1l-6.1 3.5 1.5-6.8L2.2 9.2l6.9-.7z"/></svg>';
  function flyStar(fromX, fromY, done) {
    const st = $('#stage'), tgt = $('#stars svg'), s = document.createElement('div'); s.className = 'flystar'; s.innerHTML = STAR; st.appendChild(s);
    const r = tgt.getBoundingClientRect(), sr = st.getBoundingClientRect(), k = sr.width / 1280;
    const tx = (r.left - sr.left) / k + 14 - 23, ty = (r.top - sr.top) / k + 14 - 23, t0 = performance.now(), D = 900;
    const cx = (fromX + tx) / 2 + 80, cy = Math.min(fromY, ty) - 160;
    sfx('star');
    (function step(t) {
      const u = Math.min(1, (t - t0) / D), e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2, a = 1 - e;
      const x = a * a * (fromX - 23) + 2 * a * e * cx + e * e * tx, y = a * a * (fromY - 23) + 2 * a * e * cy + e * e * ty;
      s.style.left = x + 'px'; s.style.top = y + 'px'; s.style.transform = `scale(${1.6 - 0.9 * e}) rotate(${e * 360}deg)`;
      if (u < 1) requestAnimationFrame(step); else { s.remove(); const b = $('#stars'); b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); done && done(); }
    })(t0);
  }
  /* ---------- 帯・ひとこと ---------- */
  function banner(html, cls, ms) {
    const b = $('#banner'); b.innerHTML = `<div class="rib ${cls || ''}">${html}</div>`; b.classList.remove('hidden');
    clearTimeout(banner.t); banner.t = setTimeout(() => b.classList.add('hidden'), ms || 1900);
  }
  function toast(html) {
    const t = $('#toast'); t.innerHTML = html; t.classList.remove('hidden'); t.style.animation = 'none'; void t.offsetWidth; t.style.animation = '';
    clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.add('hidden'), 1400);
  }
  window.FX = { sfx, confetti, flyStar, banner, toast, STAR, set sound(v) { on = !!v; }, get sound() { return on; }, unlock: ctx };
})();
