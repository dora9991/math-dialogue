// 手元テスト用の サーバー（127.0.0.1:54473）。アプリの「手元の検証用サーバー」と 同じ 場所で、
//  POST /rpc/<name>           → 手元の Postgres の kotsu.<name>(...) を anon で よぶ（PostgREST の まね）
//  POST /functions/v1/passkey → Edge Function と 同じ handlePasskeyLogin（rpc は service_role で よぶ）
import http from "node:http";
import pg from "pg";
import { handlePasskeyLogin } from "./fn/passkey/webauthn.js";

const pool = new pg.Pool({ host: "/tmp", port: 55432, user: "postgres", database: "kt" });
const ORIGINS = { "http://localhost:8870": "localhost" };
const log = [];

async function call(name, args, role) {
  if (!/^[a-z_][a-z0-9_]*$/.test(name)) throw Object.assign(new Error("bad name"), { status: 404 });
  const c = await pool.connect();
  try {
    await c.query("begin");
    await c.query(`set local role ${role}`);
    const keys = Object.keys(args || {});
    if (!keys.every((k) => /^p_[a-z_]+$/.test(k))) throw new Error("bad arg");
    const sql = `select kotsu.${name}(${keys.map((k, i) => `${k} => $${i + 1}`).join(", ")}) as r`;
    const r = await c.query(sql, keys.map((k) => (args[k] === null || typeof args[k] !== "object" ? args[k] : JSON.stringify(args[k]))));
    await c.query("commit");
    return r.rows[0].r;
  } catch (e) {
    await c.query("rollback").catch(() => {});
    throw e;
  } finally {
    c.release();
  }
}
const send = (res, status, body) => {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, content-profile, accept-profile",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  });
  res.end(JSON.stringify(body));
};
http
  .createServer(async (req, res) => {
    if (req.method === "OPTIONS") return send(res, 200, {});
    let raw = "";
    for await (const ch of req) raw += ch;
    let body = {};
    try {
      body = raw ? JSON.parse(raw) : {};
    } catch {}
    const m = req.url.match(/^\/rpc\/([a-z_0-9]+)/);
    try {
      if (m) {
        const r = await call(m[1], body, "anon");
        log.push({ rpc: m[1] });
        return send(res, 200, r);
      }
      if (req.url.startsWith("/functions/v1/passkey")) {
        const r = await handlePasskeyLogin(body, async (n, a) => {
          try {
            return await call(n, a, "service_role");
          } catch (e) {
            return { error: e.message };
          }
        }, ORIGINS);
        log.push({ fn: "passkey", r: r && (r.error || "ok") });
        return send(res, 200, r);
      }
      if (req.url === "/_log") return send(res, 200, log);
      return send(res, 404, { message: "not_found" });
    } catch (e) {
      const msg = String(e.message || e);
      // 関数が ない（ログイン後の 画面が よぶ ほかの rpc）は 404 に する
      return send(res, /does not exist/.test(msg) ? 404 : 400, { message: /does not exist/.test(msg) ? "not_found" : msg });
    }
  })
  .listen(54473, "127.0.0.1", () => console.log("api on 54473"));
