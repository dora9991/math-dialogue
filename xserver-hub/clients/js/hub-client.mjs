// ハブの「会員サイト連携 API」を呼ぶ道具と、ハブからの知らせ（Webhook）を確かめる道具。
//
//   ★ 会員サイトの「サーバーの中」だけで使う（Supabase Edge Functions・Node.js 18 以上・Cloudflare Workers など）。
//     秘密（secret）は、ブラウザやアプリには絶対に入れない。環境変数（Supabase なら Secrets）に置く。
//   ★ fetch と crypto.subtle だけを使う（追加のライブラリは要らない）。
//
// 使い方：
//   import { createHubClient } from './hub-client.mjs';
//   const hub = createHubClient({ baseUrl: 'https://hub.example.com', keyId: 'site', secret: Deno.env.get('HUB_API_SECRET') });
//   const { code, expires_at } = await hub.createLinkCode(user.id, { plan: 'guild', rank: 20 });
//
// 署名の決まり（ハブの app/src/Member/ApiAuth.php と同じ計算）：
//   X-Hub-Signature: v1=HMAC-SHA256(secret, "v1\n{METHOD}\n{PATH}\n{TIMESTAMP}\n{NONCE}\n{本文の SHA-256（16進）}") の16進
//   PATH はハブの URL より後ろ（/api/v1/...）。? 以降は付けない。

const enc = new TextEncoder();
const REF_RE = /^[A-Za-z0-9_.:@-]{1,100}$/;

function hex(buf) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function sha256Hex(text) {
  return hex(await crypto.subtle.digest('SHA-256', enc.encode(text)));
}

async function hmacHex(secret, text) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', key, enc.encode(text)));
}

/** 長さの同じ文字どうしを、かかる時間を変えずに比べる */
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

function newNonce() {
  const b = new Uint8Array(18);
  crypto.getRandomValues(b);
  return hex(b.buffer); // 36文字の英数字
}

/** 署名を作る（テストや、ほかの言語で作るときの見本） */
export async function signRequest({ secret, method, path, timestamp, nonce, body = '' }) {
  const msg = ['v1', method.toUpperCase(), path, timestamp, nonce, await sha256Hex(body)].join('\n');
  return 'v1=' + (await hmacHex(secret, msg));
}

export class HubError extends Error {
  constructor(status, code, message) {
    super(`[hub ${status} ${code}] ${message}`);
    this.name = 'HubError';
    this.status = status;
    this.code = code;
  }
}

/**
 * @param {{ baseUrl: string, keyId: string, secret: string, timeoutMs?: number, fetchImpl?: typeof fetch }} opts
 */
export function createHubClient({ baseUrl, keyId, secret, timeoutMs = 10_000, fetchImpl = globalThis.fetch }) {
  const base = String(baseUrl ?? '').replace(/\/+$/, '');
  if (!/^https:\/\//.test(base) && !/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?(\/|$)/.test(base)) {
    throw new Error('baseUrl は https:// で始めてください（手元の試験だけ http://127.0.0.1 を許します）');
  }
  if (!keyId) throw new Error('keyId（config.php の member.api_keys の名前）がありません');
  if (typeof secret !== 'string' || secret.length < 32) throw new Error('secret がありません（32文字以上）');

  const ref = (memberRef) => {
    const r = String(memberRef ?? '');
    if (!REF_RE.test(r)) throw new Error('memberRef は、半角の英数字と _ . : @ - で100文字までです');
    return r;
  };

  /** 1回呼ぶ。応答の JSON（{ ok, … }）に status を足して返す。ok:false でも例外にはしない */
  async function call(method, path, body) {
    const raw = body === undefined ? '' : JSON.stringify(body);
    const ts = String(Math.floor(Date.now() / 1000));
    const nonce = newNonce();
    const headers = {
      'x-hub-key': keyId,
      'x-hub-timestamp': ts,
      'x-hub-nonce': nonce,
      'x-hub-signature': await signRequest({ secret, method, path, timestamp: ts, nonce, body: raw }),
    };
    if (body !== undefined) headers['content-type'] = 'application/json';
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetchImpl(base + path, { method, headers, body: body === undefined ? undefined : raw, signal: ctrl.signal, redirect: 'manual' });
      let data;
      try {
        data = await res.json();
      } catch {
        data = { ok: false, error: { code: 'bad_response', message: `JSON ではない応答です（HTTP ${res.status}）` } };
      }
      return { status: res.status, ...data };
    } finally {
      clearTimeout(timer);
    }
  }

  /** ok:false なら HubError を投げる版 */
  async function must(method, path, body) {
    const r = await call(method, path, body);
    if (!r.ok) throw new HubError(r.status, r.error?.code ?? 'unknown', r.error?.message ?? '');
    return r;
  }

  return {
    call,

    /** 連携コードを作る（会員がマイページで「LINE と連携」を押したとき）→ { code, expires_at, digits } */
    createLinkCode(memberRef, { plan, rank } = {}) {
      const b = { member_ref: ref(memberRef) };
      if (plan !== undefined) b.plan = plan;
      if (rank !== undefined) b.rank = rank;
      return must('POST', '/api/v1/link-codes', b);
    },

    /** 連携の状態 → { linked, line_status: 'active'|'blocked'|null, plan, rank, … } */
    getMember(memberRef) {
      return must('GET', `/api/v1/members/${ref(memberRef)}`);
    },

    /** プラン・ランク・項目（fields）を入れる／変える（送ったものだけ変わる） */
    upsertMember(memberRef, { plan, rank, fields } = {}) {
      const b = {};
      if (plan !== undefined) b.plan = plan;
      if (rank !== undefined) b.rank = rank;
      if (fields !== undefined) b.fields = fields;
      return must('PUT', `/api/v1/members/${ref(memberRef)}`, b);
    },

    /** LINE との連携を外す（マイページの「連携を解除」） */
    unlink(memberRef) {
      return must('DELETE', `/api/v1/members/${ref(memberRef)}/link`);
    },

    /** 退会：ハブにある会員の情報と連携を消す */
    deleteMember(memberRef) {
      return must('DELETE', `/api/v1/members/${ref(memberRef)}`);
    },

    /**
     * 会員への通知を LINE で送る。idempotencyKey は通知ごとに決まった値（例：'notif-' + 通知の id）にする。
     * つながらない・混んでいる（5xx・429・409 in_progress）ときは、同じ idempotencyKey で数回やり直す（二重には送られない）。
     * → { delivered: true, queued?: true, duplicate?: true } か { delivered: false, reason: 'not_linked'|'blocked' }
     */
    async notify({ memberRef, title, body, link, idempotencyKey }, { retries = 2 } = {}) {
      const b = { member_ref: ref(memberRef), title, idempotency_key: idempotencyKey };
      if (body !== undefined) b.body = body;
      if (link !== undefined) b.link = link;
      for (let i = 0; ; i++) {
        let r;
        try {
          r = await call('POST', '/api/v1/notifications', b);
        } catch (e) {
          if (i >= retries) throw e;
          await new Promise((ok) => setTimeout(ok, 1000 * 3 ** i));
          continue;
        }
        const again = r.status >= 500 || r.status === 429 || (r.status === 409 && r.error?.code === 'in_progress');
        if (again && i < retries) {
          await new Promise((ok) => setTimeout(ok, 1000 * 3 ** i));
          continue;
        }
        if (!r.ok) throw new HubError(r.status, r.error?.code ?? 'unknown', r.error?.message ?? '');
        return r;
      }
    },
  };
}

/**
 * ハブからの知らせ（member.webhook_url に届く POST）を確かめる。
 *   const raw = await req.text();   // ★ JSON にする前の、届いたままの本文で確かめる
 *   if (!(await verifyHubWebhook({ secret, timestamp: req.headers.get('x-hub-timestamp'), signature: req.headers.get('x-hub-signature'), body: raw }))) return new Response('bad signature', { status: 401 });
 *   const ev = JSON.parse(raw);     // { id, event: 'line.linked', payload: { member_ref, linked_at }, created_at }
 * 同じ知らせが2回以上届くことがある（届いたと返す前に切れたとき）。ev.id を覚えて、二重に処理しない。
 */
export async function verifyHubWebhook({ secret, timestamp, signature, body, toleranceSec = 300, nowMs = Date.now() }) {
  if (typeof secret !== 'string' || secret.length < 32) throw new Error('secret がありません（32文字以上）');
  if (typeof timestamp !== 'string' || !/^\d{9,11}$/.test(timestamp)) return false;
  if (Math.abs(Math.floor(nowMs / 1000) - Number(timestamp)) > toleranceSec) return false;
  const expect = 'v1=' + (await hmacHex(secret, `${timestamp}.${body}`));
  return safeEqual(expect, signature ?? '');
}
