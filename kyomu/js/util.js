/* 共通の小道具：日付・祝日・文字・画面部品。
   どのファイルからも K.u で使う。 */
(function () {
  const K = (window.K = window.K || {});
  const u = (K.u = {});

  /* ---------- 日付（文字列 'YYYY-MM-DD' で扱う） ---------- */
  u.pad = (n) => String(n).padStart(2, '0');
  u.ymd = (d) => `${d.getFullYear()}-${u.pad(d.getMonth() + 1)}-${u.pad(d.getDate())}`;
  u.parse = (s) => {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d, 12);
  };
  u.add = (s, n) => {
    const d = u.parse(s);
    d.setDate(d.getDate() + n);
    return u.ymd(d);
  };
  u.dow = (s) => u.parse(s).getDay(); // 0=日 … 6=土
  u.monday = (s) => u.add(s, -((u.dow(s) + 6) % 7));
  u.today = () => u.ymd(new Date());
  u.WD = ['日', '月', '火', '水', '木', '金', '土'];
  u.md = (s) => {
    const d = u.parse(s);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };
  u.mdw = (s) => `${u.md(s)}(${u.WD[u.dow(s)]})`;
  u.month = (s) => u.parse(s).getMonth() + 1;
  u.day = (s) => u.parse(s).getDate();
  u.range = (a, b) => {
    const out = [];
    for (let s = a; s <= b; s = u.add(s, 1)) out.push(s);
    return out;
  };
  // 年度（4月はじまり）
  u.fy = (s) => {
    const d = u.parse(s);
    return d.getMonth() < 3 ? d.getFullYear() - 1 : d.getFullYear();
  };

  /* ---------- 祝日（内閣府の決まりを計算で出す。2000〜2099年） ---------- */
  const hcache = {};
  function nthMonday(y, m, n) {
    const first = new Date(y, m - 1, 1, 12).getDay();
    const day = 1 + ((8 - first) % 7) + (n - 1) * 7;
    return `${y}-${u.pad(m)}-${u.pad(day)}`;
  }
  function holidaysOf(y) {
    if (hcache[y]) return hcache[y];
    const h = {};
    const put = (m, d, name) => (h[`${y}-${u.pad(m)}-${u.pad(d)}`] = name);
    put(1, 1, '元日');
    h[nthMonday(y, 1, 2)] = '成人の日';
    put(2, 11, '建国記念の日');
    if (y >= 2020) put(2, 23, '天皇誕生日');
    const spring = Math.floor(20.8431 + 0.242194 * (y - 1980) - Math.floor((y - 1980) / 4));
    put(3, spring, '春分の日');
    put(4, 29, '昭和の日');
    put(5, 3, '憲法記念日');
    put(5, 4, 'みどりの日');
    put(5, 5, 'こどもの日');
    if (y === 2020) put(7, 23, '海の日');
    else if (y === 2021) put(7, 22, '海の日');
    else h[nthMonday(y, 7, 3)] = '海の日';
    if (y === 2020) put(8, 10, '山の日');
    else if (y === 2021) put(8, 8, '山の日');
    else put(8, 11, '山の日');
    h[nthMonday(y, 9, 3)] = '敬老の日';
    const autumn = Math.floor(23.2488 + 0.242194 * (y - 1980) - Math.floor((y - 1980) / 4));
    put(9, autumn, '秋分の日');
    if (y === 2020) put(7, 24, 'スポーツの日');
    else if (y === 2021) put(7, 23, 'スポーツの日');
    else h[nthMonday(y, 10, 2)] = 'スポーツの日';
    put(11, 3, '文化の日');
    put(11, 23, '勤労感謝の日');
    // 振替休日（日曜の祝日 → 次の祝日でない日）
    Object.keys(h).sort().forEach((s) => {
      if (u.dow(s) === 0) {
        let n = u.add(s, 1);
        while (h[n]) n = u.add(n, 1);
        h[n] = '振替休日';
      }
    });
    // 国民の休日（祝日にはさまれた平日）
    Object.keys(h).sort().forEach((s) => {
      const n2 = u.add(s, 2);
      const mid = u.add(s, 1);
      if (h[n2] && !h[mid] && u.dow(mid) !== 0) h[mid] = '国民の休日';
    });
    return (hcache[y] = h);
  }
  u.holiday = (s) => holidaysOf(Number(s.slice(0, 4)))[s] || '';

  /* ---------- 文字 ---------- */
  u.esc = (s) =>
    String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  u.norm = (s) => String(s == null ? '' : s).normalize('NFKC').replace(/\s+/g, ' ').trim();
  u.key = (s) => u.norm(s).replace(/\s/g, '').toUpperCase(); // 突き合わせ用（全角半角・空白を無視）
  u.uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);
  u.clone = (o) => JSON.parse(JSON.stringify(o));
  u.toZen = (s) => String(s).replace(/[0-9]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0xfee0));
  u.circled = (n) => ('①②③④⑤⑥⑦⑧⑨⑩'[Number(n) - 1] || String(n));

  /* ---------- 画面部品 ---------- */
  u.$ = (sel, root) => (root || document).querySelector(sel);
  u.$$ = (sel, root) => [...(root || document).querySelectorAll(sel)];
  u.h = (html) => {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  };
  u.debounce = (fn, ms) => {
    let t;
    return (...a) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...a), ms);
    };
  };
  u.download = (name, text, type) => {
    const blob = new Blob([text], { type: type || 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 500);
  };
  u.toast = (msg, ms) => {
    let box = u.$('#toast');
    if (!box) {
      box = u.h('<div id="toast" role="status"></div>');
      document.body.appendChild(box);
    }
    box.textContent = msg;
    box.classList.add('show');
    clearTimeout(box._t);
    box._t = setTimeout(() => box.classList.remove('show'), ms || 2600);
  };

  /* モーダル（中身の HTML と、閉じるときの処理） */
  u.modal = (html, opts) => {
    const o = opts || {};
    const back = u.h(`<div class="modal-back"><div class="modal ${o.wide ? 'wide' : ''}" role="dialog" aria-modal="true">${html}</div></div>`);
    document.body.appendChild(back);
    const close = () => {
      back.remove();
      document.removeEventListener('keydown', onKey);
      if (o.onClose) o.onClose();
    };
    const onKey = (e) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    back.addEventListener('mousedown', (e) => {
      if (e.target === back) close();
    });
    back.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', close));
    const first = back.querySelector('input,select,textarea,button');
    if (first && !o.noFocus) setTimeout(() => first.focus(), 30);
    return { el: back.firstElementChild, close };
  };
  u.confirm = (msg, okLabel) =>
    new Promise((res) => {
      let done = false;
      const m = u.modal(
        `<h3>確認</h3><p class="pre">${u.esc(msg)}</p><div class="btns"><button class="btn" data-close>やめる</button><button class="btn primary" data-ok>${u.esc(okLabel || 'OK')}</button></div>`,
        { onClose: () => !done && res(false) }
      );
      m.el.querySelector('[data-ok]').addEventListener('click', () => {
        done = true;
        m.close();
        res(true);
      });
    });

  /* 文字をセルの幅に収める（Excel の「縮小して全体を表示」と同じ考え方） */
  u.fit = (root) => {
    u.$$('.fit', root).forEach((el) => {
      el.style.fontSize = '';
      const box = el.parentElement;
      const w = box.clientWidth - 2;
      if (w <= 0) return;
      let size = parseFloat(getComputedStyle(el).fontSize);
      let guard = 0;
      while (el.scrollWidth > w && size > 4 && guard++ < 30) {
        size *= 0.92;
        el.style.fontSize = size + 'px';
      }
    });
  };
})();
