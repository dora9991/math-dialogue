/* バックアップを、決めておいたフォルダにボタン一つで上書き保存する。
   ブラウザの「ファイルに直接書きこむ機能」（File System Access API。Edge・Chrome で使える）を使う。
   選んだフォルダは、このブラウザの中（IndexedDB）に覚えておく。フォルダの中身をのぞいたり、ほかのファイルにさわったりはしない。
   使えないブラウザ（Safari・Firefox）では、これまでどおりダウンロードで保存する。 */
(function () {
  const K = window.K;
  const u = K.u;
  const m = K.m;
  const B = (K.backup = {});
  const DB = 'kyomu-backup';
  let mem = null; // IndexedDB にしまえないとき（テストなど）は、開いている間だけ覚える

  B.supported = () => typeof window.showDirectoryPicker === 'function';

  /* ---------- IndexedDB（フォルダの覚え書き） ---------- */
  function db() {
    return new Promise((res, rej) => {
      const r = indexedDB.open(DB, 1);
      r.onupgradeneeded = () => r.result.createObjectStore('h');
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  }
  async function idb(mode, fn) {
    const d = await db();
    return new Promise((res, rej) => {
      const tx = d.transaction('h', mode);
      const req = fn(tx.objectStore('h'));
      tx.oncomplete = () => res(req && req.result);
      tx.onerror = () => rej(tx.error);
      tx.onabort = () => rej(tx.error);
    });
  }
  B.folder = async () => {
    if (mem) return mem;
    try {
      return (await idb('readonly', (s) => s.get('dir'))) || null;
    } catch (e) {
      return null;
    }
  };
  async function remember(h) {
    mem = null;
    try {
      await idb('readwrite', (s) => s.put(h, 'dir'));
    } catch (e) {
      mem = h;
    }
  }
  B.forget = async () => {
    mem = null;
    try {
      await idb('readwrite', (s) => s.delete('dir'));
    } catch (e) {
      /* なにもしない */
    }
  };

  // 書きこんでよいか（2回目からは、ブラウザが「このフォルダへの保存を許可しますか」と聞くことがある）
  async function allowed(h) {
    const o = { mode: 'readwrite' };
    if (h.queryPermission && (await h.queryPermission(o)) === 'granted') return true;
    if (h.requestPermission) return (await h.requestPermission(o)) === 'granted';
    return true;
  }

  /* ---------- フォルダを選ぶ・保存する・戻す ---------- */
  B.pick = async () => {
    const h = await window.showDirectoryPicker({ id: 'kyomu-backup', mode: 'readwrite', startIn: 'documents' });
    await remember(h);
    return h;
  };

  async function writeFile(dir, name, text) {
    const fh = await dir.getFileHandle(name, { create: true });
    const w = await fh.createWritable();
    await w.write(new Blob([text], { type: 'application/json' }));
    await w.close();
  }

  // 保存先フォルダに上書き保存（日付つきも残す設定なら、そちらも）
  B.saveToFolder = async (dir) => {
    if (!(await allowed(dir))) throw new Error('フォルダへの保存が許可されませんでした');
    const json = K.store.backupJson();
    const name = K.store.backupName(false);
    await writeFile(dir, name, json);
    if (m.st.opt.backupDated) await writeFile(dir, K.store.backupName(true), json);
    return name;
  };

  B.restoreFromFolder = async () => {
    const dir = await B.folder();
    if (!dir) return u.toast('保存先フォルダがまだ決まっていません');
    try {
      if (!(await allowed(dir))) return u.toast('フォルダを読むことが許可されませんでした');
      const fh = await dir.getFileHandle(K.store.backupName(false));
      const f = await fh.getFile();
      const when = new Date(f.lastModified).toLocaleString('ja-JP');
      if (!(await u.confirm(`保存先フォルダ「${dir.name}」の\n${f.name}（${when} に保存）\nから戻します。いまの内容は、このファイルの内容に置きかわります。`, '戻す'))) return;
      await K.store.importJson(f);
      u.toast('保存先フォルダのバックアップから戻しました');
    } catch (e) {
      u.toast(e && e.name === 'NotFoundError' ? `保存先フォルダに ${K.store.backupName(false)} がありません` : '読みこめませんでした：' + (e.message || e), 5000);
    }
  };

  /* ---------- 上の「バックアップ」ボタン ---------- */
  B.button = async () => {
    if (K.store.inSandbox && K.store.inSandbox()) return u.toast('デモ中はバックアップしません');
    if (!B.supported()) {
      K.store.exportJson();
      return u.toast('ダウンロードの場所に保存しました（このブラウザでは、フォルダへの上書き保存は使えません。Edge か Chrome なら使えます）', 6000);
    }
    const dir = await B.folder();
    if (!dir) return B.setup();
    try {
      const name = await B.saveToFolder(dir);
      u.toast(`「${dir.name}」フォルダに保存しました（${name}）`, 4000);
    } catch (e) {
      if (e && e.name === 'AbortError') return;
      const md = u.modal(`<h3>保存先フォルダに保存できませんでした</h3>
        <p class="pre">${u.esc(e.message || String(e))}</p>
        <p class="help">フォルダの名前を変えたり、消したり、移したりしたときにおこります。フォルダを選びなおすか、今回はダウンロードで保存してください。</p>
        <div class="btns"><button class="btn" data-dl>今回はダウンロードで保存</button><button class="btn primary" data-pick>フォルダを選びなおす</button></div>`);
      md.el.querySelector('[data-dl]').addEventListener('click', () => {
        md.close();
        K.store.exportJson();
      });
      md.el.querySelector('[data-pick]').addEventListener('click', () => {
        md.close();
        B.choose(true);
      });
    }
  };

  // はじめて押したとき：保存先を決めるか、今回はダウンロードか
  B.setup = () => {
    const md = u.modal(`<h3>バックアップの保存先</h3>
      <p>保存先のフォルダを<b>一度だけ</b>選んでおくと、次からは「バックアップ」を押すだけで、そのフォルダの <code>${u.esc(K.store.backupName(false))}</code> に上書き保存します。</p>
      <p class="help">おすすめは、OneDrive や学校の共有フォルダなど、パソコンが壊れても残る場所です。選んだフォルダは、このブラウザが覚えています（中のほかのファイルにはさわりません）。<br>
      2回目からは、ブラウザが「このフォルダへの保存を許可しますか」と聞くことがあります。そのときは「許可」を押してください。</p>
      <div class="btns"><button class="btn" data-dl>今回はダウンロードで保存</button><button class="btn primary" data-pick>保存先のフォルダを選ぶ</button></div>`);
    md.el.querySelector('[data-dl]').addEventListener('click', () => {
      md.close();
      K.store.exportJson();
    });
    md.el.querySelector('[data-pick]').addEventListener('click', () => {
      md.close();
      B.choose(true);
    });
  };

  // フォルダを選ぶ（save：選んだあと、そのまま保存する）
  B.choose = async (save) => {
    try {
      const dir = await B.pick();
      if (save) {
        const name = await B.saveToFolder(dir);
        u.toast(`「${dir.name}」フォルダに保存しました（${name}）。次からはボタン一つで上書きします`, 5000);
      } else u.toast(`保存先を「${dir.name}」フォルダにしました`);
      if (K.app && K.app.refresh) K.app.refresh();
    } catch (e) {
      if (e && e.name === 'AbortError') return;
      u.toast('フォルダを選べませんでした：' + (e.message || e), 5000);
    }
  };
})();
