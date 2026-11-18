// api.js — サーバーのえらび方・先生のログインの読みかた・RPC の呼びかた・エラーの文
// すべて、先生の画面（solo/teacher）と同じ決まりごと。トークンは localStorage（または sessionStorage）から読むだけで、
// 画面に出さない・URL に入れない・書きかえない。

const PROD = { name: "本番", url: "https://mtzhbiadzqjhvhzzdsbn.supabase.co/rest/v1", key: "sb_publishable_mq8nUqxVfGtnNHp5UCUtCA_9-x1xn7E" };
// 手元の検証用（先生の画面と同じ。localhost で開いたときの既定）
const LOCAL = { name: "手元の検証用", url: "http://127.0.0.1:54473", key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0", local: true };

// ?server=prod / ?server=local は先生の画面と同じ。?server=mock（または mock:ポート）は、tools/mock-server.mjs（模擬のサーバー）用。
// 模擬は 127.0.0.1 の上だけ。保存された先生のログインは「server が同じときだけ」使うので、本番のトークンが模擬に送られることはない。
export function pickServer(search = typeof location !== "undefined" ? location.search : "", host = typeof location !== "undefined" ? location.hostname : "") {
  const q = new URLSearchParams(search).get("server") || "";
  if (q === "local") return LOCAL;
  if (q === "prod") return PROD;
  const m = /^mock(?::(\d{2,5}))?$/.exec(q);
  if (m) return { name: "模擬のサーバー", url: `http://127.0.0.1:${m[1] || 54474}`, key: "mock-publishable-key", local: true, mock: true };
  if (host === "localhost" || host === "127.0.0.1" || host === "[::1]" || host === "::1") return LOCAL;
  return PROD;
}
export const SERVER = pickServer();

export class ApiError extends Error {
  constructor(code, extra = {}) { super(code); this.code = code; Object.assign(this, extra); }
}

const KEY = "kotsu-staff-v1";
// 先生の画面の「W()」と同じ：localStorage → sessionStorage（「この端末でログインしたままにする」を外したとき）。
// server が、いまのサーバーのURLと同じものだけを使う。
export function readStaff(server = SERVER) {
  for (const get of [() => localStorage, () => sessionStorage]) {
    try {
      const a = JSON.parse(get().getItem(KEY) || "null");
      if (a && a.server === server.url && typeof a.token === "string" && a.token) return a;
    } catch { /* 読めないときは、ログインなしとして扱う */ }
  }
  return null;
}
// 先生・管理者だけ（生徒のトークンでは入れない）
export const isStaff = (s) => !!(s && s.user && (s.user.role === "teacher" || s.user.role === "admin"));

export async function rpc(name, args = {}, { timeout = 15000, server = SERVER } = {}) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeout);
  let res;
  try {
    res = await fetch(`${server.url}/rpc/${name}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Profile": "kotsu", apikey: server.key, Authorization: `Bearer ${server.key}` },
      body: JSON.stringify(args),
      signal: ctl.signal,
      cache: "no-store",
      credentials: "omit",
      referrerPolicy: "no-referrer",
    });
  } catch { throw new ApiError("offline"); } finally { clearTimeout(timer); }
  let body = null;
  try { body = await res.json(); } catch { /* 本文なし */ }
  if (!res.ok) throw new ApiError(String((body && (body.message || body.code)) || `http_${res.status}`), { status: res.status, pgrst: body && body.code });
  if (body && typeof body === "object" && body.error) throw new ApiError(String(body.error));
  return body;
}

// ログインが無効になったエラー（この画面では「先生の画面でログインしなおして」と案内する）
export const isAuthError = (e) => !!e && (e.code === "auth" || e.code === "role" || e.code === "org_off");

const TEXT = {
  auth: "ログインの期限が切れました。先生の画面でもう一度ログインしてください。",
  role: "この画面は、このアカウントでは使えません。",
  org_off: "この塾・学校は、いま使えないようになっています（運営に連絡してください）。",
  offline: "サーバーとつながりませんでした。電波（ネット）を確かめて、もう一度どうぞ。",
  forbidden: "それは、できません（担当のクラスではない、またはほかの学校のクラスです）。",
  bad_args: "入力のしかたにまちがいがあります。内容をたしかめて、もう一度どうぞ。",
  not_found: "見つかりません（消された・担当でない など）。",
  not_deletable: "この宿題は、もう消せません（出してから日がたち、取り組んだ生徒がいます）。「締める」を使ってください。",
  bad_class: "クラスが見つかりません。",
  bad_user: "ほかの塾・学校の人は選べません。",
};
export function errText(e) {
  const code = String((e && (e.code || e.message)) || e || "");
  if (TEXT[code]) return TEXT[code];
  // 宿題の関数が、まだサーバーに入っていない（PostgREST：PGRST202 / 404）
  if (e && (e.pgrst === "PGRST202" || e.status === 404 || /function|schema cache/i.test(code))) return "宿題の機能が、サーバーにまだ入っていません（運営の設定待ちです）。";
  return `うまくいきませんでした（${code}）`;
}
