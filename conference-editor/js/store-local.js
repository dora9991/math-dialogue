/* 保存先①：このブラウザの中（ローカルモード）。ログイン不要。自分ひとりで使う／試すとき用。
   他の端末とは共有されない。ブラウザの保存データを消すと中身も消える。
   保存先の差し替え口：ConfStoreSupabase と同じ関数（init / loadAll / saveDraft / publish / …）をそろえてある。 */
(function (root) {
  "use strict";
  var S = root.ConfSchema || (typeof require === "function" ? require("./schema.js") : null);

  function ConfStoreLocal(opts) {
    var memory = null; // localStorage が使えない環境（プライベートモードなど）の代わり
    var storage = (opts && opts.storage) || null;
    function readAll() {
      var raw = null;
      try { raw = (storage || root.localStorage).getItem(S.LOCAL_KEY); } catch (e) { raw = memory; }
      try { return raw ? JSON.parse(raw) : {}; } catch (e2) { return {}; }
    }
    function writeAll(all) {
      var raw = JSON.stringify(all);
      try { (storage || root.localStorage).setItem(S.LOCAL_KEY, raw); } catch (e) { memory = raw; }
    }
    function fresh() {
      return { draft: [], published: [], published_at: null, version: 1, updated_at: new Date().toISOString(), updated_by: "このブラウザ" };
    }
    function load() {
      var all = readAll();
      S.KEYS.forEach(function (key) { if (!all[key]) all[key] = fresh(); });
      return all;
    }

    return {
      kind: "local",
      init: function () { return Promise.resolve({ user: null, needsLogin: false }); },
      requestLogin: function () { return Promise.reject(S.ConfError("other", "ローカルモードではログインは不要です。")); },
      verifyCode: function () { return Promise.reject(S.ConfError("other", "ローカルモードではログインは不要です。")); },
      signOut: function () { return Promise.resolve(); },

      loadAll: function () { return Promise.resolve(load()); },

      // 下書きを保存。expectedVersion が今の版と違えば、他で更新されている（衝突）。
      saveDraft: function (key, value, expectedVersion) {
        var all = load();
        var row = all[key];
        if (!row) return Promise.reject(S.ConfError("invalid", "不明な項目です。"));
        if (row.version !== expectedVersion) {
          return Promise.reject(S.ConfError("conflict", "別のタブ・別の人が先に更新しました。最新を読み込み直してください。"));
        }
        row.draft = S.normalize(key, value, false);
        row.version += 1;
        row.updated_at = new Date().toISOString();
        writeAll(all);
        return Promise.resolve({ version: row.version, updated_at: row.updated_at, updated_by: row.updated_by });
      },

      // 下書きを公開する（公開中の中身に写す）
      publish: function (key) {
        var all = load();
        var row = all[key];
        if (!row) return Promise.reject(S.ConfError("invalid", "不明な項目です。"));
        row.published = S.normalize(key, row.draft, true);
        row.published_at = new Date().toISOString();
        row.version += 1;
        row.updated_at = row.published_at;
        writeAll(all);
        return Promise.resolve({ published_at: row.published_at, version: row.version, updated_by: row.updated_by });
      }
    };
  }

  root.ConfStoreLocal = ConfStoreLocal;
  if (typeof module !== "undefined" && module.exports) module.exports = ConfStoreLocal;
})(typeof window !== "undefined" ? window : globalThis);
