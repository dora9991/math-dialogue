// ============================================================
// supabase/functions/passkey — 先生・管理者の パスキー（Face ID・指紋）ログインの 署名を 確かめる
//  画面（solo/teacher・solo/admin）から よばれる。署名を 確かめてから、kotsu.pk_login_finish（service_role だけ）で
//  ログインの トークンを 作って 返す（kotsu.login と 同じ 形）。かぎの 登録は kotsu.pk_reg_*（Postgres）で する。
//  デプロイ: verify_jwt なし（だれでも よべる。中で 署名と 1回かぎりの チャレンジを 確かめる）
// ============================================================
import { handlePasskeyLogin } from "./webauthn.js";

const ALLOW = new Set(["https://dora9991.github.io"]);
const cors = (origin: string | null) => ({
  "Access-Control-Allow-Origin": origin && ALLOW.has(origin) ? origin : "https://dora9991.github.io",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
});

const URL = Deno.env.get("SUPABASE_URL")!;
const KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
async function rpc(name: string, args: Record<string, unknown>) {
  const r = await fetch(`${URL}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Content-Profile": "kotsu", "Accept-Profile": "kotsu", apikey: KEY, Authorization: `Bearer ${KEY}` },
    body: JSON.stringify(args),
  });
  const j = await r.json().catch(() => null);
  if (!r.ok) return { error: String(j?.message || `http_${r.status}`) };
  return j;
}

Deno.serve(async (req: Request) => {
  const h = cors(req.headers.get("Origin"));
  if (req.method === "OPTIONS") return new Response("ok", { headers: h });
  const out = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...h, "Content-Type": "application/json" } });
  if (req.method !== "POST") return out({ error: "method" }, 405);
  const body = await req.json().catch(() => null);
  try {
    return out(await handlePasskeyLogin(body, rpc));
  } catch (_e) {
    return out({ error: "pk_bad" });
  }
});
