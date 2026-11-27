// WebAuthn の ログイン（assertion）の 署名を 確かめる。Deno（Edge Function）でも Node でも うごく（WebCrypto だけ 使う）
export const ORIGINS = { "https://dora9991.github.io": "dora9991.github.io" };

export const b64uDec = (s) => {
  const t = String(s).replace(/-/g, "+").replace(/_/g, "/");
  const r = atob(t + "===".slice((t.length + 3) % 4));
  const a = new Uint8Array(r.length);
  for (let i = 0; i < r.length; i++) a[i] = r.charCodeAt(i);
  return a;
};
const eq = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
const sha256 = async (u8) => new Uint8Array(await crypto.subtle.digest("SHA-256", u8));

// DER の ECDSA 署名（SEQUENCE{INTEGER r, INTEGER s}）を、WebCrypto の r||s（64バイト）に なおす
export function derToRaw(der, n = 32) {
  let i = 0;
  if (der[i++] !== 0x30) throw "pk_sig";
  let len = der[i++];
  if (len & 0x80) i += len & 0x7f;
  const out = new Uint8Array(2 * n);
  for (let k = 0; k < 2; k++) {
    if (der[i++] !== 0x02) throw "pk_sig";
    let l = der[i++];
    let v = der.subarray(i, i + l);
    i += l;
    while (v.length > n && v[0] === 0) v = v.subarray(1);
    if (v.length > n) throw "pk_sig";
    out.set(v, k * n + (n - v.length));
  }
  return out;
}

// p: { client_data, auth_data, signature }（base64url）、key: { public_key（SPKI, base64url）, alg }
// 合えば { challenge, count } を 返す。ちがえば 文字列の コード を throw
export async function verifyAssertion(p, key, origins = ORIGINS) {
  const cd = b64uDec(p.client_data);
  let c;
  try {
    c = JSON.parse(new TextDecoder().decode(cd));
  } catch {
    throw "pk_bad";
  }
  if (c.type !== "webauthn.get" || typeof c.challenge !== "string") throw "pk_bad";
  const rpId = Object.prototype.hasOwnProperty.call(origins, c.origin) ? origins[c.origin] : null;
  if (!rpId) throw "pk_origin";
  const ad = b64uDec(p.auth_data);
  if (ad.length < 37) throw "pk_bad";
  if (!eq(ad.subarray(0, 32), await sha256(new TextEncoder().encode(rpId)))) throw "pk_rp";
  const flags = ad[32];
  if (!(flags & 0x01) || !(flags & 0x04)) throw "pk_uv"; // UP（ふれた）と UV（本人を 確かめた）
  const count = ((ad[33] << 24) | (ad[34] << 16) | (ad[35] << 8) | ad[36]) >>> 0;
  const data = new Uint8Array(ad.length + 32);
  data.set(ad, 0);
  data.set(await sha256(cd), ad.length);
  const spki = b64uDec(key.public_key);
  const sig = b64uDec(p.signature);
  let ok = false;
  try {
    if (key.alg === -7) {
      const k = await crypto.subtle.importKey("spki", spki, { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]);
      ok = await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, k, derToRaw(sig, 32), data);
    } else if (key.alg === -257) {
      const k = await crypto.subtle.importKey("spki", spki, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
      ok = await crypto.subtle.verify({ name: "RSASSA-PKCS1-v1_5" }, k, sig, data);
    } else throw "pk_alg";
  } catch (e) {
    if (typeof e === "string") throw e;
    throw "pk_sig";
  }
  if (!ok) throw "pk_sig";
  return { challenge: c.challenge, count };
}

// Edge Function の 中身（rpc を 外から わたす。Deno では PostgREST、テストでは 手元の DB）
const S = (v, n) => typeof v === "string" && v.length > 0 && v.length <= n && /^[A-Za-z0-9_-]+$/.test(v);
export async function handlePasskeyLogin(body, rpc, origins = ORIGINS) {
  if (!body || !S(body.cred_id, 1400) || !S(body.client_data, 4000) || !S(body.auth_data, 4000) || !S(body.signature, 2000)) return { error: "pk_bad" };
  const k = await rpc("pk_get", { p_cred_id: body.cred_id });
  if (!k || !k.ok) return { error: "pk_unknown" };
  let v;
  try {
    v = await verifyAssertion(body, k, origins);
  } catch (e) {
    return { error: typeof e === "string" ? e : "pk_bad" };
  }
  return await rpc("pk_login_finish", { p_cred_id: body.cred_id, p_challenge: v.challenge, p_client: body.client_data, p_sign_count: v.count });
}
