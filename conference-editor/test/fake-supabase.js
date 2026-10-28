/* 検査用の偽の Supabase。実物に接続しなくても、ログイン・保存・衝突・公開の流れを試せるようにする。
   supabase/schema.sql の振る舞い（誰が何を読める／書ける）を、必要な分だけまねている。
   ※ ここは「画面側の呼び方」を確かめるためのもの。権限そのものの検査は test/rls.sql（実際の Postgres）で行う。 */
"use strict";

const ANON = "anon-key-for-tests";

function b64url(obj) {
  return Buffer.from(JSON.stringify(obj)).toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}
function makeJwt(email, exp) {
  return b64url({ alg: "HS256", typ: "JWT" }) + "." + b64url({ email, exp, role: "authenticated" }) + ".sig";
}

function createFake(opts) {
  opts = opts || {};
  const now = () => new Date().toISOString();
  const blank = () => ({ draft: [], published: [], published_at: null, version: 1, updated_at: now(), updated_by: null });
  const state = {
    users: new Set(opts.users || ["editor@example.com", "stranger@example.com"]), // ログインできる人（招待済み）
    editors: new Set(opts.editors || ["editor@example.com"]),                       // conf_editors に載っている人
    code: "123456",
    ttl: opts.ttl || 3600,       // アクセストークンの有効秒数（短くすると更新の検査ができる）
    rows: { news: blank(), overview: blank(), program: blank() },
    access: new Map(),           // アクセストークン → メール
    refresh: new Map(),          // リフレッシュトークン → メール
    log: []                      // 受けたリクエスト（"METHOD /path"）
  };
  let seq = 0;

  function session(email) {
    const exp = Math.floor(Date.now() / 1000) + state.ttl;
    const access = makeJwt(email, exp) + "." + (++seq);
    const refresh = "refresh-" + (++seq);
    state.access.set(access, email);
    state.refresh.set(refresh, email);
    return { access_token: access, refresh_token: refresh, expires_in: state.ttl, expires_at: exp, token_type: "bearer", user: { email } };
  }
  const ok = (json, status) => ({ status: status || 200, json });
  const denied = (who) => (who ? { status: 403, json: { code: "42501", message: "permission denied" } } : { status: 401, json: { code: "42501", message: "permission denied for table conf_content" } });

  // req: { method, url, headers, body(文字列 or undefined) }  →  { status, json }
  function handle(req) {
    const u = new URL(req.url);
    const path = u.pathname;
    const method = (req.method || "GET").toUpperCase();
    const h = {};
    Object.keys(req.headers || {}).forEach((k) => { h[k.toLowerCase()] = req.headers[k]; });
    const body = req.body ? JSON.parse(req.body) : {};
    state.log.push(method + " " + path);

    if (h.apikey !== ANON) return { status: 401, json: { message: "Invalid API key" } };

    // ---- 認証 ----
    if (path === "/auth/v1/otp" && method === "POST") {
      if (!state.users.has(body.email)) return { status: 422, json: { code: 422, error_code: "otp_disabled", msg: "Signups not allowed for otp" } };
      return ok({});
    }
    if (path === "/auth/v1/verify" && method === "POST") {
      if (body.type !== "email" || !state.users.has(body.email) || body.token !== state.code) {
        return { status: 403, json: { code: 403, error_code: "otp_expired", msg: "Token has expired or is invalid" } };
      }
      return ok(session(body.email));
    }
    if (path === "/auth/v1/token" && method === "POST" && u.searchParams.get("grant_type") === "refresh_token") {
      const email = state.refresh.get(body.refresh_token);
      if (!email) return { status: 400, json: { error: "invalid_grant", error_description: "Invalid Refresh Token" } };
      state.refresh.delete(body.refresh_token);
      return ok(session(email));
    }
    if (path === "/auth/v1/logout" && method === "POST") {
      state.access.delete((h.authorization || "").replace(/^Bearer /, ""));
      return { status: 204, json: null };
    }

    // ---- データ（PostgREST の振る舞いを schema.sql に合わせてまねる） ----
    const bearer = (h.authorization || "").replace(/^Bearer /, "");
    const email = state.access.get(bearer) || null;       // null なら anon
    const isEditor = !!email && state.editors.has(email);
    const key = (u.searchParams.get("key") || "").replace(/^eq\./, "");

    if (path === "/rest/v1/conf_content" && method === "GET") {
      const cols = (u.searchParams.get("select") || "*").split(",");
      if (!email) { // 公開側：公開済みの列だけ
        if (cols.some((c) => ["key", "published", "published_at"].indexOf(c) < 0)) return denied(false);
        return ok(Object.keys(state.rows).map((k) => ({ key: k, published: state.rows[k].published, published_at: state.rows[k].published_at })));
      }
      if (!isEditor) return ok([]); // RLS で0行になる
      return ok(Object.keys(state.rows).map((k) => Object.assign({ key: k }, state.rows[k])));
    }
    if (path === "/rest/v1/conf_content" && method === "PATCH") {
      if (!email) return denied(false);
      if (Object.keys(body).some((c) => c !== "draft")) return denied(true); // 書けるのは draft の列だけ
      if (!isEditor) return ok([]);
      const r = state.rows[key];
      if (!r || String(r.version) !== (u.searchParams.get("version") || "").replace(/^eq\./, "")) return ok([]);
      r.draft = body.draft; r.version += 1; r.updated_at = now(); r.updated_by = email;
      return ok([{ version: r.version, updated_at: r.updated_at, updated_by: r.updated_by }]);
    }
    if (path === "/rest/v1/rpc/conf_publish" && method === "POST") {
      if (!isEditor) return denied(!!email);
      const r = state.rows[body.p_key];
      if (!r) return ok([]);
      r.published = r.draft; r.published_at = now(); r.version += 1; r.updated_at = r.published_at; r.updated_by = email;
      return ok([{ published_at: r.published_at, version: r.version, updated_by: r.updated_by }]);
    }
    return { status: 404, json: { message: "not found: " + method + " " + path } };
  }

  // fetch 互換（Node のストア検査用）
  function fetchLike(url, init) {
    init = init || {};
    const res = handle({ method: init.method, url, headers: init.headers, body: init.body });
    const text = res.json === null ? "" : JSON.stringify(res.json);
    return Promise.resolve({ ok: res.status >= 200 && res.status < 300, status: res.status, text: () => Promise.resolve(text), json: () => Promise.resolve(res.json) });
  }

  return { ANON, state, handle, fetch: fetchLike, session };
}

module.exports = { createFake, ANON, makeJwt };
