// コツコツくん 先生・管理者の画面：パスキー（Face ID・Touch ID・指紋・端末の PIN）での ログイン
//  PkLogin：ログイン画面の「Face ID・指紋でログイン」ボタン
//  PkManage：ログイン後、右上の「🔑 Face ID」ボタン（この端末の 登録・一覧・消す）
import { a as React, j as J } from "./client-BsKaA_AS.js";
import { r as rpc, S as SERVER, e as errText } from "./api-CcqOTfNE.js";
import { s as saveSession, k as keepSession, u as curSession, M as Modal } from "./kanri-ScwLHlVJ.js";

const enc = (buf) => {
  const b = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < b.length; i += 32768) s += String.fromCharCode.apply(null, b.subarray(i, i + 32768));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const dec = (s) => {
  const t = String(s).replace(/-/g, "+").replace(/_/g, "/");
  const r = atob(t + "===".slice((t.length + 3) % 4));
  const a = new Uint8Array(r.length);
  for (let i = 0; i < r.length; i++) a[i] = r.charCodeAt(i);
  return a;
};
export const pkSupported = () => {
  try {
    return typeof window !== "undefined" && !!window.PublicKeyCredential && !!navigator.credentials && window.isSecureContext;
  } catch {
    return false;
  }
};
const fnUrl = () => {
  const u = String((SERVER && SERVER.url) || "");
  return (u.endsWith("/rest/v1") ? u.slice(0, -8) : u) + "/functions/v1/passkey";
};
const MSG = {
  pk_pass: "パスワードがちがいます。",
  pk_many: "登録できる端末は10台までです。使わない端末を消してから、もう一度どうぞ。",
  pk_expired: "時間がたちすぎました。もう一度どうぞ。",
  pk_bad: "うまく確かめられませんでした。もう一度どうぞ。",
  pk_sig: "うまく確かめられませんでした。もう一度どうぞ。",
  pk_rp: "うまく確かめられませんでした。もう一度どうぞ。",
  pk_origin: "このページからは使えません。",
  pk_uv: "Face ID・指紋・端末のパスコードで確かめてから、もう一度どうぞ。",
  pk_unknown: "この端末のかぎが見つかりません（登録していない・消された など）。パスワードでログインしてから、右上の「🔑 Face ID」で登録してください。",
  pk_counter: "このかぎは使えなくなっています。パスワードでログインして、登録し直してください。",
  pk_dup: "この端末は、もう登録されています。",
  pk_alg: "この端末のかぎの種類には、対応していません。",
  pk_nokey: "このブラウザは対応していません（iPhone・iPad は iOS 16 以上、Mac は Safari 16 以上、または新しい Chrome・Edge で開いてください）。",
  cancel: "とりやめました（または、この端末には まだ登録がありません）。",
  offline: "サーバーとつながりませんでした。電波（ネット）を確かめて、もう一度どうぞ。",
};
const say = (e) => {
  const dom = typeof DOMException !== "undefined" && e instanceof DOMException;
  const c = String((e && (dom ? e.name : e.code || e.name)) || e || "");
  if (MSG[c]) return MSG[c];
  if (c === "NotAllowedError" || c === "AbortError") return MSG.cancel;
  if (c === "InvalidStateError") return MSG.pk_dup;
  if (c === "SecurityError") return MSG.pk_origin;
  return errText(e);
};
const fail = (code) => Object.assign(new Error(code), { code });
const guessLabel = () => {
  const ua = navigator.userAgent || "";
  if (/iPhone/.test(ua)) return "iPhone";
  if (/iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return "iPad";
  if (/Macintosh/.test(ua)) return "Mac";
  if (/Android/.test(ua)) return "Android";
  if (/Windows/.test(ua)) return "Windows";
  return "この端末";
};
const fmtDay = (t) => {
  if (!t) return "—";
  const d = new Date(t);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
};

// パスキーで ログインして、login と 同じ 形の セッション（{token, user, org, keep}）を 返す
export async function pkLogin({ keep = !0 } = {}) {
  if (!pkSupported()) throw fail("pk_nokey");
  const b = await rpc("pk_login_begin", {});
  const cred = await navigator.credentials.get({
    publicKey: { challenge: dec(b.challenge), rpId: location.hostname, userVerification: "required", timeout: 120000 },
  });
  if (!cred) throw fail("cancel");
  const res = cred.response;
  let r = null;
  try {
    const h = await fetch(fnUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: SERVER.key, Authorization: `Bearer ${SERVER.key}` },
      body: JSON.stringify({
        cred_id: enc(cred.rawId),
        client_data: enc(res.clientDataJSON),
        auth_data: enc(res.authenticatorData),
        signature: enc(res.signature),
      }),
      cache: "no-store",
      credentials: "omit",
      referrerPolicy: "no-referrer",
    });
    r = await h.json().catch(() => null);
  } catch {
    throw fail("offline");
  }
  if (!r) throw fail("pk_bad");
  if (r.error) throw fail(r.error);
  if (!r.token || !r.user || r.user.role === "student") throw fail("pk_unknown");
  const c = { token: r.token, user: r.user, org: r.org, keep: !!keep };
  saveSession(c);
  try {
    localStorage.setItem("kotsu-staff-last-v1", JSON.stringify({ org: String(r.org.code || "").toUpperCase(), id: r.user.login }));
  } catch {}
  if (keep) keepSession(c, { force: !0 });
  return c;
}

// ログイン画面の ボタン（ログインの form の 中に 置く。type=button）
export function PkLogin({ onSession }) {
  const [busy, setBusy] = React.useState(!1);
  const [err, setErr] = React.useState("");
  if (!pkSupported()) return null;
  const go = async () => {
    setBusy(!0);
    setErr("");
    try {
      const box = document.querySelector('form[name="kotsu-login"] input[name="keep"]');
      const c = await pkLogin({ keep: box ? !!box.checked : !0 });
      await onSession(c);
    } catch (e) {
      setErr(say(e));
      setBusy(!1);
    }
  };
  return J.jsxs("div", {
    className: "k-pk-login",
    style: { marginTop: 14, paddingTop: 12, borderTop: "1px dashed rgba(0,0,0,.15)" },
    children: [
      J.jsx("button", {
        type: "button",
        className: "k-btn block ghost",
        onClick: go,
        disabled: busy,
        "data-pk": "login",
        children: busy ? "確かめています…" : "🔑 Face ID・指紋でログイン",
      }),
      err && J.jsx("div", { className: "k-err", style: { marginTop: 8 }, children: err }),
      J.jsx("div", {
        className: "k-tiny k-muted",
        style: { marginTop: 6 },
        children: "登録した端末で使えます。はじめての端末は、パスワードでログインしてから、右上の「🔑 Face ID」で登録します。",
      }),
    ],
  });
}

// ログイン後の「🔑 Face ID」ボタンと、登録・一覧の 画面
export function PkManage() {
  const [open, setOpen] = React.useState(!1);
  if (!pkSupported()) return null;
  return J.jsxs(J.Fragment, {
    children: [
      J.jsx("button", {
        type: "button",
        className: "k-btn sm ghost no-print",
        onClick: () => setOpen(!0),
        "data-pk": "manage",
        title: "Face ID・指紋でのログインの設定",
        children: "🔑 Face ID",
      }),
      open && J.jsx(PkPanel, { onClose: () => setOpen(!1) }),
    ],
  });
}

function PkPanel({ onClose }) {
  const [keys, setKeys] = React.useState(null);
  const [label, setLabel] = React.useState(guessLabel);
  const [pass, setPass] = React.useState("");
  const [busy, setBusy] = React.useState(!1);
  const [err, setErr] = React.useState("");
  const [done, setDone] = React.useState("");
  const tok = () => (curSession() || {}).token;
  const load = async () => {
    try {
      setKeys((await rpc("pk_list", { p_token: tok() })).keys || []);
    } catch (e) {
      setErr(say(e));
      setKeys([]);
    }
  };
  React.useEffect(() => {
    load();
  }, []);
  const add = async (ev) => {
    ev.preventDefault();
    if (!pass) {
      setErr("確認のため、パスワードを入れてください。");
      return;
    }
    setBusy(!0);
    setErr("");
    setDone("");
    try {
      const b = await rpc("pk_reg_begin", { p_token: tok(), p_pass: pass });
      const cred = await navigator.credentials.create({
        publicKey: {
          challenge: dec(b.challenge),
          rp: { id: location.hostname, name: "コツコツくん" },
          user: { id: dec(b.user_handle), name: b.name, displayName: b.display },
          pubKeyCredParams: [
            { type: "public-key", alg: -7 },
            { type: "public-key", alg: -257 },
          ],
          authenticatorSelection: { residentKey: "required", requireResidentKey: !0, userVerification: "required" },
          attestation: "none",
          excludeCredentials: (b.exclude || []).map((id) => ({ type: "public-key", id: dec(id) })),
          timeout: 120000,
        },
      });
      if (!cred) throw fail("cancel");
      const res = cred.response;
      const spki = typeof res.getPublicKey === "function" ? res.getPublicKey() : null;
      const alg = typeof res.getPublicKeyAlgorithm === "function" ? res.getPublicKeyAlgorithm() : null;
      if (!spki || alg == null) throw fail("pk_nokey");
      await rpc("pk_reg_finish", {
        p_token: tok(),
        p_challenge: b.challenge,
        p_cred_id: enc(cred.rawId),
        p_client: enc(res.clientDataJSON),
        p_public_key: enc(spki),
        p_alg: alg,
        p_label: label,
      });
      setPass("");
      setDone("登録しました。次から、ログイン画面の「🔑 Face ID・指紋でログイン」で入れます。");
      await load();
    } catch (e) {
      setErr(say(e));
    }
    setBusy(!1);
  };
  const del = async (k) => {
    if (!window.confirm(`「${k.label}」のかぎを消します。この端末では、Face ID・指紋でログインできなくなります（パスワードでは入れます）。よろしいですか？`)) return;
    setErr("");
    setDone("");
    try {
      await rpc("pk_delete", { p_token: tok(), p_id: k.id });
      await load();
    } catch (e) {
      setErr(say(e));
    }
  };
  return J.jsx(Modal, {
    title: "🔑 Face ID・指紋でログイン",
    onClose,
    children: J.jsxs("div", {
      className: "k-pk-panel",
      children: [
        J.jsx("p", {
          className: "k-muted",
          style: { marginTop: 0 },
          children:
            "この端末を登録すると、次から パスワードなしで、Face ID・Touch ID・指紋・端末のパスコードでログインできます。みんなで使う端末には登録しないでください。",
        }),
        J.jsx("h3", { style: { margin: "12px 0 6px", fontSize: 15 }, children: "登録した端末" }),
        keys === null
          ? J.jsx("div", { className: "k-muted", children: "読みこんでいます…" })
          : keys.length === 0
            ? J.jsx("div", { className: "k-muted", "data-pk": "none", children: "まだありません。" })
            : J.jsx("ul", {
                style: { listStyle: "none", padding: 0, margin: 0 },
                "data-pk": "list",
                children: keys.map((k) =>
                  J.jsxs(
                    "li",
                    {
                      style: { display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid rgba(0,0,0,.08)" },
                      children: [
                        J.jsxs("div", {
                          style: { flex: 1 },
                          children: [
                            J.jsx("b", { children: k.label }),
                            J.jsxs("div", {
                              className: "k-tiny k-muted",
                              children: ["登録 ", fmtDay(k.created_at), "・最後に使った日 ", fmtDay(k.last_used_at)],
                            }),
                          ],
                        }),
                        J.jsx("button", { type: "button", className: "k-btn sm ghost", onClick: () => del(k), children: "消す" }),
                      ],
                    },
                    k.id,
                  ),
                ),
              }),
        J.jsxs("form", {
          onSubmit: add,
          style: { marginTop: 16 },
          autoComplete: "on",
          children: [
            J.jsx("h3", { style: { margin: "0 0 6px", fontSize: 15 }, children: "この端末を登録する" }),
            J.jsxs("label", {
              className: "k-f",
              children: [
                J.jsx("span", { children: "端末の名前（あとで見分けるため）" }),
                J.jsx("input", { name: "pk-label", value: label, maxLength: 40, onChange: (e) => setLabel(e.target.value) }),
              ],
            }),
            J.jsxs("label", {
              className: "k-f",
              children: [
                J.jsx("span", { children: "パスワード（確認のため）" }),
                J.jsx("input", {
                  type: "password",
                  name: "password",
                  autoComplete: "current-password",
                  value: pass,
                  maxLength: 64,
                  onChange: (e) => setPass(e.target.value),
                }),
              ],
            }),
            err && J.jsx("div", { className: "k-err", "data-pk": "err", children: err }),
            done && J.jsx("div", { className: "k-ok", "data-pk": "done", style: { color: "#1a7f37", margin: "8px 0" }, children: done }),
            J.jsx("button", {
              className: "k-btn block",
              type: "submit",
              disabled: busy,
              "data-pk": "add",
              children: busy ? "確かめています…" : "この端末を登録する（Face ID・指紋）",
            }),
          ],
        }),
      ],
    }),
  });
}
