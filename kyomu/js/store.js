/* 保存（このブラウザの中だけ）と、元に戻す／やり直す。
   データはどこにも送らない。ブラウザのデータを消すと消えるので、ときどきバックアップ（JSON）を書き出す。 */
(function () {
  const K = window.K;
  const u = K.u;
  const m = K.m;
  const s = (K.store = {});
  const KEY = 'kyomu-jikanwari-v1';
  const undo = [];
  const redo = [];
  const subs = [];
  let lastJson = '';

  s.load = () => {
    let data = null;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) data = JSON.parse(raw);
    } catch (e) {
      console.warn('読みこめませんでした', e);
    }
    m.st = m.normalize(data);
    m.touch();
    lastJson = JSON.stringify(m.st);
    return !!data;
  };

  let sandbox = false;
  // 試し箱（デモ）：この間は保存しない。終わったら元のデータ・元に戻すの履歴をそのまま戻す
  s.sandbox = (on) => {
    if (on) {
      if (sandbox) return;
      // まだ書きこんでいない変更があれば、先に保存しておく
      try {
        if (m.st.savedAt || undo.length) localStorage.setItem(KEY, JSON.stringify(m.st));
      } catch (e) {
        /* 保存できなくてもデモは続ける */
      }
      sandbox = { st: JSON.stringify(m.st), undo: undo.slice(), redo: redo.slice(), lastJson };
      return;
    }
    if (!sandbox) return;
    const x = sandbox;
    sandbox = false;
    m.st = m.normalize(JSON.parse(x.st));
    undo.length = 0;
    undo.push(...x.undo);
    redo.length = 0;
    redo.push(...x.redo);
    lastJson = x.lastJson;
    s.emit('sandbox-end');
  };
  s.inSandbox = () => !!sandbox;
  s.load2 = (data) => {
    // 試し箱の中で、見本のデータに入れかえる（保存しない）
    m.st = m.normalize(data);
    lastJson = JSON.stringify(m.st);
    undo.length = 0;
    redo.length = 0;
    s.emit('sandbox-load');
  };

  const write = u.debounce(() => {
    if (sandbox) return s.status('デモ中（保存しません）');
    try {
      m.st.savedAt = new Date().toISOString();
      lastJson = JSON.stringify(m.st);
      localStorage.setItem(KEY, lastJson);
      s.status('保存しました');
    } catch (e) {
      s.status('保存できませんでした（容量がいっぱい？バックアップを書き出してください）', true);
    }
  }, 250);

  s.status = (msg, bad) => {
    const el = u.$('#save-state');
    if (el) {
      el.textContent = msg;
      el.classList.toggle('bad', !!bad);
    }
  };

  s.on = (fn) => subs.push(fn);
  s.emit = (why) => {
    m.touch();
    subs.forEach((fn) => fn(why));
  };

  // データを変えるときは必ずここを通す（元に戻せるように）
  s.commit = (label, fn) => {
    const before = lastJson || JSON.stringify(m.st);
    const r = fn(m.st);
    const after = JSON.stringify(m.st);
    if (after === before) return r;
    undo.push({ label, json: before });
    if (undo.length > 80) undo.shift();
    redo.length = 0;
    lastJson = after;
    write();
    s.emit(label);
    return r;
  };

  s.undo = () => {
    const x = undo.pop();
    if (!x) return u.toast('戻せる操作はありません');
    redo.push({ label: x.label, json: JSON.stringify(m.st) });
    m.st = m.normalize(JSON.parse(x.json));
    lastJson = x.json;
    write();
    s.emit('undo');
    u.toast(`元に戻しました：${x.label}`);
  };
  s.redo = () => {
    const x = redo.pop();
    if (!x) return u.toast('やり直せる操作はありません');
    undo.push({ label: x.label, json: JSON.stringify(m.st) });
    m.st = m.normalize(JSON.parse(x.json));
    lastJson = x.json;
    write();
    s.emit('redo');
    u.toast(`やり直しました：${x.label}`);
  };
  s.canUndo = () => undo.length > 0;

  // まるごと入れかえ（バックアップから戻す・取り込み）
  s.replace = (data, label) => {
    undo.push({ label: label || '入れかえ', json: JSON.stringify(m.st) });
    redo.length = 0;
    m.st = m.normalize(data);
    lastJson = JSON.stringify(m.st);
    write();
    s.emit('replace');
  };

  // バックアップの中身（書き出した日時も記録する）
  s.backupJson = () => {
    m.st.backupAt = new Date().toISOString();
    const json = JSON.stringify(m.st, null, 1);
    lastJson = JSON.stringify(m.st);
    write();
    return json;
  };
  s.backupName = (dated) => {
    const r = `R${m.st.school.year - 2018}`;
    if (!dated) return `教務時間割_${r}_バックアップ.json`;
    const d = new Date();
    return `教務時間割_${r}_${d.getFullYear()}${u.pad(d.getMonth() + 1)}${u.pad(d.getDate())}.json`;
  };
  s.exportJson = () => u.download(s.backupName(true), s.backupJson());

  s.importJson = (file) =>
    new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => {
        try {
          const data = JSON.parse(fr.result);
          if (!data || !data.classes || !data.terms) throw new Error('この形式のファイルではありません');
          s.replace(data, 'バックアップから戻す');
          res();
        } catch (e) {
          rej(e);
        }
      };
      fr.onerror = rej;
      fr.readAsText(file);
    });

  s.daysSinceBackup = () => {
    if (!m.st.backupAt) return null;
    return Math.floor((Date.now() - new Date(m.st.backupAt).getTime()) / 86400000);
  };
})();
