/* 手元の動画フォルダとの紐付け（BCV）。動画はこの端末の中だけで扱い、どこにも送らない。
   ・フォルダを選ぶ：Chrome・Edge（パソコン）は showDirectoryPicker（次からは「前のフォルダにつなぐ」の1回で開ける）。
     それ以外は <input webkitdirectory>（毎回選ぶ）。スマホは「動画ファイルを選ぶ」（複数可）。
   ・自動の紐付け：フォルダ名とファイル名を、項目の名前・別名と照らす（BC.tagVideo）。
   ・手で直した紐付けは、この端末（localStorage）に保存。JSON で書き出し・読み込みでき、
     フォルダの一番上に basket-coach-links.json を置くと、つないだときに読みこむ。
   ・URL の動画（YouTube など）も、題名つきで足せる（題名で自動の紐付け）。 */
(function () {
  const BC = window.BC;
  const BCV = (window.BCV = {
    files: [],        // { key, name, folder, size, ext, file?, fh?, url? , kind: 'file' | 'url' }
    byKey: {},
    links: {},        // key → { add: [id], del: [id] }
    urls: [],         // { key: 'url:…', title, url }
    dirName: '',
    saved: null,      // 前回つないだフォルダ（showDirectoryPicker のとき）
    canPickDir: typeof window.showDirectoryPicker === 'function',
    onchange: null,
  });
  const LINKS_FILE = 'basket-coach-links.json';
  const VIDEO_EXT = /\.(mp4|m4v|mov|webm|ogv|ogg|mkv|avi|wmv|mpg|mpeg|3gp|ts|flv)$/i;
  const PLAYABLE = /\.(mp4|m4v|mov|webm|ogv|ogg|mkv|3gp)$/i;
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* 保存できない環境 */ } },
  };
  const changed = () => { BCV._cache = null; if (BCV.onchange) BCV.onchange(); };

  /* ---------- IndexedDB（フォルダの handle を覚える） ---------- */
  function idb() {
    return new Promise((res, rej) => {
      try {
        const r = indexedDB.open('basket-coach', 1);
        r.onupgradeneeded = () => r.result.createObjectStore('kv');
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
      } catch (e) { rej(e); }
    });
  }
  async function idbGet(k) {
    const db = await idb();
    return new Promise((res) => { const t = db.transaction('kv').objectStore('kv').get(k); t.onsuccess = () => res(t.result); t.onerror = () => res(null); });
  }
  async function idbSet(k, v) {
    const db = await idb();
    return new Promise((res) => { const t = db.transaction('kv', 'readwrite').objectStore('kv').put(v, k); t.onsuccess = () => res(true); t.onerror = () => res(false); });
  }

  BCV.init = async function () {
    BCV.links = store.get('bc.links', {});
    BCV.urls = store.get('bc.urls', []);
    for (const u of BCV.urls) addEntry({ key: u.key, name: u.title, folder: 'URL', kind: 'url', url: u.url, ext: '' });
    if (BCV.canPickDir) {
      try { const h = await idbGet('dir'); if (h) BCV.saved = { handle: h, name: h.name }; } catch (e) { /* なし */ }
    }
    changed();
  };

  function addEntry(v) {
    if (BCV.byKey[v.key]) Object.assign(BCV.byKey[v.key], v);
    else { BCV.byKey[v.key] = v; BCV.files.push(v); }
  }
  function clearFiles() {
    for (const v of BCV.files) if (v.objUrl) URL.revokeObjectURL(v.objUrl);
    BCV.files = BCV.files.filter((v) => v.kind === 'url');
    BCV.byKey = {};
    for (const v of BCV.files) BCV.byKey[v.key] = v;
  }
  const splitPath = (p) => {
    const parts = p.split('/');
    const name = parts.pop();
    return { name, folder: parts.join('/') };
  };

  /* ---------- フォルダを選ぶ ---------- */
  // 返り値：{ ok, count, message }
  BCV.pickFolder = async function () {
    if (BCV.canPickDir) {
      try {
        const h = await window.showDirectoryPicker({ id: 'bc-videos', mode: 'read' });
        await scanHandle(h);
        try { await idbSet('dir', h); BCV.saved = { handle: h, name: h.name }; } catch (e) { /* 覚えられなくても使える */ }
        return { ok: true, count: countFiles() };
      } catch (e) {
        if (e && e.name === 'AbortError') return { ok: false };
        // iframe の中などで使えないときは、ふつうの選び方へ
      }
    }
    return pickInput(true);
  };
  BCV.pickFiles = () => pickInput(false);
  BCV.reconnect = async function () {
    if (!BCV.saved) return { ok: false };
    const h = BCV.saved.handle;
    try {
      let p = await h.queryPermission({ mode: 'read' });
      if (p !== 'granted') p = await h.requestPermission({ mode: 'read' });
      if (p !== 'granted') return { ok: false, message: 'フォルダを読む許可が出ませんでした。' };
      await scanHandle(h);
      return { ok: true, count: countFiles() };
    } catch (e) {
      return { ok: false, message: 'フォルダが見つかりませんでした（動いた・名前が変わった、など）。もう一度選んでください。' };
    }
  };
  const countFiles = () => BCV.files.filter((v) => v.kind === 'file').length;

  function pickInput(dir) {
    return new Promise((resolve) => {
      const inp = document.createElement('input');
      inp.type = 'file';
      inp.multiple = true;
      if (dir) { inp.webkitdirectory = true; inp.setAttribute('webkitdirectory', ''); }
      else inp.accept = 'video/*,.mp4,.mov,.m4v,.webm,.mkv';
      inp.style.display = 'none';
      document.body.appendChild(inp);
      let done = false;
      inp.addEventListener('change', async () => {
        done = true;
        const list = [...(inp.files || [])];
        inp.remove();
        if (!list.length) return resolve({ ok: false });
        clearFiles();
        let root = '';
        let linksFile = null;
        for (const file of list) {
          const rel = file.webkitRelativePath || file.name;
          const parts = rel.split('/');
          if (dir && parts.length > 1) { root = root || parts[0]; parts.shift(); }
          const key = parts.join('/');
          if (key === LINKS_FILE) { linksFile = file; continue; }
          if (!VIDEO_EXT.test(file.name)) continue;
          const sp = splitPath(key);
          addEntry({ key, name: sp.name, folder: sp.folder, size: file.size, ext: (file.name.match(/\.([^.]+)$/) || [, ''])[1].toLowerCase(), kind: 'file', file });
        }
        BCV.dirName = dir ? root : '選んだファイル';
        if (linksFile) await mergeLinksText(await linksFile.text(), true);
        changed();
        resolve({ ok: true, count: countFiles() });
      });
      // 選ばずに閉じたとき（cancel のないブラウザでは、次に選んだときに前の input が残るだけ）
      inp.addEventListener('cancel', () => { if (!done) { done = true; inp.remove(); resolve({ ok: false }); } });
      inp.click();
    });
  }

  async function scanHandle(h) {
    clearFiles();
    BCV.dirName = h.name;
    BCV.dirHandle = h;
    let n = 0;
    async function walk(dh, prefix, depth) {
      for await (const [name, entry] of dh.entries()) {
        if (name.startsWith('.') || n > 5000) continue;
        const key = prefix ? prefix + '/' + name : name;
        if (entry.kind === 'directory') { if (depth < 6) await walk(entry, key, depth + 1); continue; }
        if (!prefix && name === LINKS_FILE) {
          try { await mergeLinksText(await (await entry.getFile()).text(), true); } catch (e) { /* 読めなければ飛ばす */ }
          continue;
        }
        if (!VIDEO_EXT.test(name)) continue;
        n++;
        const sp = splitPath(key);
        addEntry({ key, name: sp.name, folder: sp.folder, ext: (name.match(/\.([^.]+)$/) || [, ''])[1].toLowerCase(), kind: 'file', fh: entry });
      }
    }
    await walk(h, '', 0);
    BCV.files.sort((a, b) => (a.kind === b.kind ? a.key.localeCompare(b.key, 'ja') : a.kind === 'file' ? -1 : 1));
    changed();
  }

  /* ---------- 紐付け ---------- */
  // その動画が指す項目（自動＋手で足したもの−手で外したもの）
  BCV.tags = function (v) {
    const auto = BC.tagVideo((v.folder ? v.folder + '/' : '') + v.name);
    const l = BCV.links[v.key] || {};
    const del = new Set(l.del || []);
    const items = [];
    for (const id of l.add || []) if (BC.get(id) && !items.some((x) => x.id === id)) items.push({ id, manual: true, score: 100 });
    for (const a of auto.items) if (!del.has(a.id) && !items.some((x) => x.id === a.id)) items.push({ id: a.id, manual: false, score: a.score });
    const skills = auto.skills.slice();
    for (const it of items) for (const s of (BC.get(it.id) || {}).skills || []) if (!skills.includes(s)) skills.push(s);
    return { items, skills, removed: [...del] };
  };
  function index() {
    if (BCV._cache) return BCV._cache;
    const byItem = {}, bySkill = {};
    for (const v of BCV.files) {
      const t = BCV.tags(v);
      v.tags = t;
      for (const it of t.items) (byItem[it.id] = byItem[it.id] || []).push({ v, score: it.score, manual: it.manual });
      for (const s of t.skills) (bySkill[s] = bySkill[s] || []).push(v);
    }
    for (const k of Object.keys(byItem)) byItem[k].sort((a, b) => b.score - a.score);
    BCV._cache = { byItem, bySkill };
    return BCV._cache;
  }
  BCV.count = () => ({ all: BCV.files.length, files: countFiles(), linked: BCV.files.filter((v) => (index(), v.tags.items.length)).length });
  // 項目の一覧（大事な順）に合う動画。足りなければ、同じ技能の動画を「同じテーマ」として足す
  BCV.videosFor = function (ids, skills = [], max = 6) {
    const { byItem, bySkill } = index();
    const out = [], seen = new Set();
    ids.forEach((id, rank) => {
      for (const x of byItem[id] || []) {
        if (seen.has(x.v.key)) continue;
        seen.add(x.v.key);
        out.push({ v: x.v, via: id, rank, score: x.score, manual: x.manual });
      }
    });
    out.sort((a, b) => a.rank - b.rank || b.score - a.score);
    const direct = out.slice(0, max);
    const near = [];
    if (direct.length < max) for (const s of skills) for (const v of bySkill[s] || []) {
      if (seen.has(v.key) || near.length >= max - direct.length) continue;
      seen.add(v.key);
      near.push({ v, via: null, skill: s });
    }
    return { direct, near };
  };
  BCV.setLink = function (key, id, on) {
    const l = BCV.links[key] || { add: [], del: [] };
    l.add = (l.add || []).filter((x) => x !== id);
    l.del = (l.del || []).filter((x) => x !== id);
    const v = BCV.byKey[key];
    const autoHas = v && BC.tagVideo((v.folder ? v.folder + '/' : '') + v.name).items.some((a) => a.id === id);
    if (on && !autoHas) l.add.push(id);
    if (!on && autoHas) l.del.push(id);
    if (l.add.length || l.del.length) BCV.links[key] = l; else delete BCV.links[key];
    store.set('bc.links', BCV.links);
    changed();
  };

  /* ---------- URL の動画 ---------- */
  BCV.addUrl = function (title, url) {
    url = String(url || '').trim();
    if (!/^https?:\/\//i.test(url)) return { ok: false, message: 'https:// で始まる URL を入れてください。' };
    title = String(title || '').trim() || url;
    const key = 'url:' + url;
    if (BCV.urls.some((u) => u.key === key)) return { ok: false, message: 'この URL はもう入っています。' };
    BCV.urls.push({ key, title, url });
    store.set('bc.urls', BCV.urls);
    addEntry({ key, name: title, folder: 'URL', kind: 'url', url, ext: '' });
    changed();
    return { ok: true };
  };
  BCV.removeUrl = function (key) {
    BCV.urls = BCV.urls.filter((u) => u.key !== key);
    store.set('bc.urls', BCV.urls);
    BCV.files = BCV.files.filter((v) => v.key !== key);
    delete BCV.byKey[key];
    delete BCV.links[key];
    store.set('bc.links', BCV.links);
    changed();
  };

  /* ---------- 書き出し・読み込み ---------- */
  BCV.exportText = function () {
    return JSON.stringify({ app: 'basket-coach', version: 1, links: BCV.links, urls: BCV.urls }, null, 2);
  };
  async function mergeLinksText(text, quiet) {
    let data;
    try { data = JSON.parse(text); } catch (e) { return { ok: false, message: 'JSON として読めませんでした。' }; }
    if (!data || typeof data !== 'object' || !data.links) return { ok: false, message: '紐付けのデータではないようです。' };
    let n = 0;
    for (const [k, l] of Object.entries(data.links)) {
      if (!l || typeof l !== 'object') continue;
      // この端末で直したもののほうを優先（フォルダの中の json は下じき）
      if (quiet && BCV.links[k]) continue;
      BCV.links[k] = { add: (l.add || []).filter((id) => BC.get(id)), del: (l.del || []).filter((id) => BC.get(id)) };
      n++;
    }
    for (const u of data.urls || []) {
      if (u && u.url && !BCV.urls.some((x) => x.key === u.key)) {
        BCV.urls.push({ key: u.key || 'url:' + u.url, title: u.title || u.url, url: u.url });
        addEntry({ key: u.key || 'url:' + u.url, name: u.title || u.url, folder: 'URL', kind: 'url', url: u.url, ext: '' });
      }
    }
    store.set('bc.links', BCV.links);
    store.set('bc.urls', BCV.urls);
    return { ok: true, count: n };
  }
  BCV.importText = async function (text) { const r = await mergeLinksText(text, false); changed(); return r; };
  // つないだフォルダに json を書く（書く許可が出たときだけ）
  BCV.saveToFolder = async function () {
    const h = BCV.dirHandle;
    if (!h || !h.getFileHandle) return { ok: false, message: 'このブラウザでは、フォルダに直接は書けません。「書き出す」を使ってください。' };
    try {
      let p = await h.queryPermission({ mode: 'readwrite' });
      if (p !== 'granted') p = await h.requestPermission({ mode: 'readwrite' });
      if (p !== 'granted') return { ok: false, message: '書く許可が出ませんでした。' };
      const fh = await h.getFileHandle(LINKS_FILE, { create: true });
      const w = await fh.createWritable();
      await w.write(BCV.exportText());
      await w.close();
      return { ok: true };
    } catch (e) {
      return { ok: false, message: 'フォルダに書けませんでした：' + (e && e.message ? e.message : e) };
    }
  };

  /* ---------- 再生 ---------- */
  BCV.playable = (v) => v.kind === 'url' || PLAYABLE.test(v.name);
  BCV.src = async function (v) {
    if (v.kind === 'url') return v.url;
    if (v.objUrl) return v.objUrl;
    const file = v.file || (v.fh ? await v.fh.getFile() : null);
    if (!file) return null;
    v.objUrl = URL.createObjectURL(file);
    // 開いた動画の URL は、多くなりすぎたら古いものから捨てる
    const open = BCV.files.filter((x) => x.objUrl);
    if (open.length > 12) for (const x of open.slice(0, open.length - 12)) if (x !== v) { URL.revokeObjectURL(x.objUrl); x.objUrl = null; }
    return v.objUrl;
  };
  // 小さな絵（はじめの方の1コマ）。順番に1つずつ作る
  const thumbs = {};
  let queue = Promise.resolve();
  BCV.thumb = function (v) {
    if (v.kind !== 'file' || !BCV.playable(v)) return Promise.resolve(null);
    if (thumbs[v.key]) return thumbs[v.key];
    thumbs[v.key] = queue = queue.then(() => makeThumb(v)).catch(() => null);
    return thumbs[v.key];
  };
  async function makeThumb(v) {
    const src = await BCV.src(v);
    if (!src) return null;
    return new Promise((res) => {
      const el = document.createElement('video');
      el.muted = true; el.preload = 'metadata'; el.playsInline = true;
      let t = setTimeout(() => done(null), 6000);
      const done = (x) => { clearTimeout(t); el.removeAttribute('src'); el.load(); res(x); };
      el.addEventListener('loadedmetadata', () => { v.duration = el.duration; el.currentTime = Math.min(2, (el.duration || 4) / 3); });
      el.addEventListener('seeked', () => {
        try {
          const c = document.createElement('canvas');
          const w = 240, h = Math.round((w * (el.videoHeight || 9)) / (el.videoWidth || 16));
          c.width = w; c.height = h;
          c.getContext('2d').drawImage(el, 0, 0, w, h);
          done(c.toDataURL('image/jpeg', 0.7));
        } catch (e) { done(null); }
      });
      el.addEventListener('error', () => done(null));
      el.src = src;
    });
  }
  BCV.fmtDur = (s) => (s > 0 && isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}` : '');
})();
