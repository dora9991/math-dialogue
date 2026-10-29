/* 保存先②：Supabase（事務局の数人でログインして共同編集）。SDK は使わず fetch だけ（quiz/ と同じ流儀）。
   ログイン：メールに届く「リンク」または「6桁のコード」。登録されていないメールアドレスは作成させない。
   守り（誰が読めて・書けるか）は supabase/schema.sql の RLS が担当する。ここはあくまで画面側の窓口。 */
(function (root) {
  "use strict";
  var S = root.ConfSchema || (typeof require === "function" ? require("./schema.js") : null);
  var SESSION_KEY = "conferenceEditor.session";

  function b64urlToText(s) {
    s = s.replace(/-/g, "+").replace(/_/g, "/");
    while (s.length % 4) s += "=";
    var bin = typeof atob === "function" ? atob(s) : Buffer.from(s, "base64").toString("binary");
    try { return decodeURIComponent(bin.split("").map(function (c) { return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2); }).join("")); }
    catch (e) { return bin; }
  }
  function emailFromJwt(token) {
    try { return String(JSON.parse(b64urlToText(String(token).split(".")[1])).email || "").toLowerCase(); }
    catch (e) { return ""; }
  }
  function safeJson(text) { try { return JSON.parse(text); } catch (e) { return null; } }
  function nowSec() { return Math.floor(Date.now() / 1000); }

  // opts: { fetch, storage, location, history }（検査のときに差し替える）
  function ConfStoreSupabase(cfg, opts) {
    opts = opts || {};
    var base = String(cfg.SUPABASE_URL || "").replace(/\/+$/, "");
    var anon = cfg.SUPABASE_ANON_KEY;
    var fetchFn = opts.fetch || function () { return root.fetch.apply(root, arguments); };
    var store = opts.storage || root.localStorage;
    var loc = opts.location || root.location;
    var hist = opts.history || root.history;
    var session = null;

    function saveSession(s) {
      session = s;
      try { if (s) store.setItem(SESSION_KEY, JSON.stringify(s)); else store.removeItem(SESSION_KEY); } catch (e) { /* 保存できなくても、このタブの間は使える */ }
    }
    function toSession(r) {
      return {
        access_token: r.access_token,
        refresh_token: r.refresh_token,
        expires_at: r.expires_at || nowSec() + (r.expires_in || 3600),
        email: emailFromJwt(r.access_token)
      };
    }

    // メールのリンクから戻ってきたとき（URL の # 以降にトークンが付いている）
    function consumeUrl() {
      var hash = String((loc && loc.hash) || "");
      if (hash.length < 2) return null;
      var p = new URLSearchParams(hash.slice(1));
      var out = null;
      if (p.get("access_token")) out = { session: toSession({ access_token: p.get("access_token"), refresh_token: p.get("refresh_token"), expires_in: +p.get("expires_in") || 3600, expires_at: +p.get("expires_at") || 0 }) };
      else if (p.get("error")) out = { error: "ログイン用のリンクが使えませんでした（期限切れ、または一度開いたリンクです）。もう一度メールを送るか、メールの6桁のコードを入力してください。" };
      if (out && hist && hist.replaceState) hist.replaceState(null, "", String(loc.pathname || "") + String(loc.search || ""));
      return out;
    }

    function mapError(status, data, ctx) {
      var code = data && (data.code || data.error_code);
      var msg = (data && (data.message || data.msg || data.error_description || data.error)) || "";
      if (ctx === "login") {
        if (status === 429) return S.ConfError("other", "短い間に何度も送信されました。少し待ってからもう一度お試しください。");
        return S.ConfError("other", "ログイン用のメールを送れませんでした。登録されていないメールアドレスの可能性があります。");
      }
      if (ctx === "password") {
        if (status === 429) return S.ConfError("other", "短い間に何度も試されました。少し待ってからもう一度お試しください。");
        return S.ConfError("auth", "メールアドレスかパスワードが違います。");
      }
      if (ctx === "verify") return S.ConfError("auth", "コードが違うか、期限が切れています。もう一度メールを送ってください。");
      if (status === 401) return S.ConfError("auth", "ログインの期限が切れました。もう一度ログインしてください。");
      if (status === 403 || code === "42501") return S.ConfError("forbidden", "このメールアドレスは編集者として登録されていません。事務局の管理者に連絡してください。");
      if (code === "23514") return S.ConfError("invalid", "内容が大きすぎるか、形が正しくありません。");
      return S.ConfError("other", "保存先でエラーが起きました（" + status + (msg ? "：" + msg : "") + "）。");
    }

    async function refresh() {
      var res;
      try {
        res = await fetchFn(base + "/auth/v1/token?grant_type=refresh_token", {
          method: "POST", headers: { apikey: anon, "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: session.refresh_token })
        });
      } catch (e) { throw S.ConfError("network", "通信できませんでした。ネットワークを確認して、もう一度お試しください。"); }
      if (!res.ok) { saveSession(null); throw S.ConfError("auth", "ログインの期限が切れました。もう一度ログインしてください。"); }
      saveSession(toSession(await res.json()));
    }
    async function token() {
      if (!session) throw S.ConfError("auth", "ログインしてください。");
      if (session.expires_at - nowSec() < 60) await refresh();
      return session.access_token;
    }

    // ctx: "login" | "verify" | undefined。auth=true なら編集者のトークン、そうでなければ anon キー。
    async function http(path, o) {
      o = o || {};
      var headers = Object.assign({ apikey: anon, "Content-Type": "application/json" }, o.headers || {});
      headers.Authorization = "Bearer " + (o.auth ? await token() : anon);
      var res;
      try {
        res = await fetchFn(base + path, { method: o.method || "GET", headers: headers, body: o.body === undefined ? undefined : JSON.stringify(o.body) });
      } catch (e) { throw S.ConfError("network", "通信できませんでした。ネットワークを確認して、もう一度お試しください。"); }
      var text = await res.text();
      var data = text ? safeJson(text) : null;
      if (!res.ok) throw mapError(res.status, data, o.ctx);
      return data;
    }

    var COLS = "key,draft,published,published_at,version,updated_at,updated_by";

    return {
      kind: "supabase",

      init: async function () {
        var fromUrl = consumeUrl();
        if (fromUrl && fromUrl.session) saveSession(fromUrl.session);
        else {
          try { session = safeJson(store.getItem(SESSION_KEY) || "null"); } catch (e) { session = null; }
        }
        return { user: session ? session.email : null, needsLogin: !session, error: fromUrl && fromUrl.error ? fromUrl.error : null };
      },

      requestLogin: function (email) {
        var back = encodeURIComponent(String(loc.origin || "") + String(loc.pathname || ""));
        return http("/auth/v1/otp?redirect_to=" + back, { method: "POST", ctx: "login", body: { email: String(email).trim().toLowerCase(), create_user: false } }).then(function () {});
      },
      verifyCode: async function (email, code) {
        var data = await http("/auth/v1/verify", { method: "POST", ctx: "verify", body: { type: "email", email: String(email).trim().toLowerCase(), token: String(code).replace(/\s+/g, "") } });
        saveSession(toSession(data));
        return { user: session.email };
      },
      // 会員サイトなど、すでにパスワードを持っているアカウントで入る（アカウントは新しく作らない）
      signInWithPassword: async function (email, password) {
        var data = await http("/auth/v1/token?grant_type=password", { method: "POST", ctx: "password", body: { email: String(email).trim().toLowerCase(), password: String(password) } });
        saveSession(toSession(data));
        return { user: session.email };
      },
      signOut: async function () {
        try { if (session) await http("/auth/v1/logout", { method: "POST", auth: true }); } catch (e) { /* 失敗してもこの端末のログイン情報は消す */ }
        saveSession(null);
      },

      loadAll: async function () {
        var rows = await http("/rest/v1/conf_content?select=" + COLS, { auth: true });
        if (!Array.isArray(rows) || rows.length === 0) {
          throw S.ConfError("forbidden", "中身を読み込めませんでした。このメールアドレスが編集者として登録されていないか、保存先の設定（schema.sql）がまだ流れていません。");
        }
        var out = {};
        rows.forEach(function (r) { out[r.key] = r; });
        S.KEYS.forEach(function (key) { if (!out[key]) throw S.ConfError("other", "保存先に「" + S.LABELS[key] + "」の行がありません。schema.sql を流してください。"); });
        return out;
      },

      // 版（version）が expectedVersion と同じときだけ更新する。違えば、他の人が先に更新している（衝突）。
      saveDraft: async function (key, value, expectedVersion) {
        var rows = await http("/rest/v1/conf_content?key=eq." + encodeURIComponent(key) + "&version=eq." + encodeURIComponent(expectedVersion) + "&select=version,updated_at,updated_by", {
          method: "PATCH", auth: true, headers: { Prefer: "return=representation" }, body: { draft: S.normalize(key, value, false) }
        });
        if (!Array.isArray(rows) || rows.length === 0) {
          throw S.ConfError("conflict", "他の人が先に更新しました。最新を読み込み直してください。");
        }
        return { version: rows[0].version, updated_at: rows[0].updated_at, updated_by: rows[0].updated_by };
      },

      publish: async function (key) {
        var rows = await http("/rest/v1/rpc/conf_publish", { method: "POST", auth: true, body: { p_key: key } });
        if (!Array.isArray(rows) || rows.length === 0) throw S.ConfError("other", "公開できませんでした（項目が見つかりません）。");
        return { published_at: rows[0].published_at, version: rows[0].version, updated_by: rows[0].updated_by };
      }
    };
  }

  root.ConfStoreSupabase = ConfStoreSupabase;
  if (typeof module !== "undefined" && module.exports) module.exports = ConfStoreSupabase;
})(typeof window !== "undefined" ? window : globalThis);
