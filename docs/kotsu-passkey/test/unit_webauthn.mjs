// verifyAssertion の 単体テスト（RSA・ECDSA の DER・ちがう オリジン・UV なし）
import { verifyAssertion, derToRaw } from "./fn/passkey/webauthn.js";
import { webcrypto as C } from "node:crypto";
const b64u = (u8) => Buffer.from(u8).toString("base64url");
const O = { "https://dora9991.github.io": "dora9991.github.io" };
let fail = 0; const ok = (n, c, i) => { console.log((c ? "PASS" : "FAIL") + "  " + n + (i !== undefined ? "  " + JSON.stringify(i) : "")); if (!c) fail++; };
const sha = async (b) => new Uint8Array(await C.subtle.digest("SHA-256", b));
async function make(alg, { origin = "https://dora9991.github.io", rp = "dora9991.github.io", flags = 0x05, count = 7 } = {}) {
  const kp = alg === -7 ? await C.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"])
    : await C.subtle.generateKey({ name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, ["sign", "verify"]);
  const spki = new Uint8Array(await C.subtle.exportKey("spki", kp.publicKey));
  const cd = new TextEncoder().encode(JSON.stringify({ type: "webauthn.get", challenge: "abcDEF123", origin }));
  const ad = new Uint8Array(37); ad.set(await sha(new TextEncoder().encode(rp)), 0); ad[32] = flags; ad[36] = count;
  const data = new Uint8Array([...ad, ...(await sha(cd))]);
  let sig = new Uint8Array(await C.subtle.sign(alg === -7 ? { name: "ECDSA", hash: "SHA-256" } : { name: "RSASSA-PKCS1-v1_5" }, kp.privateKey, data));
  if (alg === -7) { // r||s → DER
    const int = (x) => { let i = 0; while (i < x.length - 1 && x[i] === 0) i++; x = x.subarray(i); return x[0] & 0x80 ? [0x02, x.length + 1, 0, ...x] : [0x02, x.length, ...x]; };
    const body = [...int(sig.subarray(0, 32)), ...int(sig.subarray(32))]; sig = new Uint8Array([0x30, body.length, ...body]);
  }
  return { p: { client_data: b64u(cd), auth_data: b64u(ad), signature: b64u(sig) }, key: { public_key: b64u(spki), alg } };
}
const tryv = async (x, o = O) => { try { return await verifyAssertion(x.p, x.key, o); } catch (e) { return { err: e }; } };
for (const alg of [-7, -257]) {
  const x = await make(alg); const r = await tryv(x);
  ok(`alg ${alg}：正しい 署名は 通る（チャレンジ・回数を 返す）`, r.challenge === "abcDEF123" && r.count === 7, r);
  const bad = { ...x, p: { ...x.p, client_data: b64u(new TextEncoder().encode(JSON.stringify({ type: "webauthn.get", challenge: "abcDEF124", origin: "https://dora9991.github.io" }))) } };
  ok(`alg ${alg}：チャレンジを 書きかえると 通らない`, (await tryv(bad)).err === "pk_sig");
}
ok("ちがう オリジンは 通らない", (await tryv(await make(-7, { origin: "https://evil.example" }))).err === "pk_origin");
ok("rpId が ちがうと 通らない", (await tryv(await make(-7, { rp: "evil.example" }))).err === "pk_rp");
ok("本人確認（UV）なしは 通らない", (await tryv(await make(-7, { flags: 0x01 }))).err === "pk_uv");
const x = await make(-7); const y = await make(-7);
ok("ほかの 人の かぎでは 通らない", (await tryv({ p: x.p, key: y.key })).err === "pk_sig");
ok("DER→r||s：先頭の 0 を はずし、短い 値は 0 で うめる", Buffer.from(derToRaw(new Uint8Array([0x30, 8, 0x02, 2, 0x00, 0x81, 0x02, 2, 0x01, 0x02]), 2)).toString("hex") === "00810102");
console.log("FAILS", fail); process.exit(fail ? 1 : 0);
