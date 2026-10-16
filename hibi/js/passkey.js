/* hibi/js/passkey.js
   パスキー（Face ID・Touch ID・パスコード）で、裏側につなぐ。
   ・作る：つながっている端末で。秘密の鍵は端末（iCloud キーチェーン）から出ず、同じ Apple ID の iPhone・iPad・Mac に届く。
           裏側には公開鍵だけを送る。パスキーの「ユーザー ID」には、つなぎ先の URL をつめて入れておく（HB.packUrl）
   ・ログイン：URL も合言葉もない端末で。パスキーで署名して、裏側が確かめたら合言葉が返る
   どちらも、ボタンを押したその場で呼ぶこと（Safari は、押した直後でないと Face ID を出さない。前に await をはさまない）。 */
(function (root) {
  'use strict';
  const HB = root.HB = root.HB || {};

  const MESSAGES = {
    url_too_long: 'この裏側の URL は長くて、パスキーに入れられません（URL と合言葉でつないでください）',
    bad_key: 'パスキーの鍵が読めませんでした（この端末・ブラウザでは作れないようです）',
    no_url: 'このパスキーからは、つなぎ先がわかりませんでした。URL と合言葉でつないでから、設定でパスキーを作りなおしてください'
  };
  class PasskeyError extends Error { constructor(code) { super(MESSAGES[code] || code); this.code = code; } }

  const b64u = buf => {
    const b = new Uint8Array(buf);
    let s = '';
    for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };
  const rand = n => crypto.getRandomValues(new Uint8Array(n));
  const hex = b => Array.from(b, x => x.toString(16).padStart(2, '0')).join('');

  function supported() {
    return !!(root.PublicKeyCredential && navigator.credentials && navigator.credentials.create && navigator.credentials.get && root.isSecureContext !== false);
  }
  /** この端末で、顔・指紋・パスコードで確かめられるか（作るのをすすめてよいか） */
  async function platformReady() {
    try { return supported() && await root.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable(); } catch (e) { return false; }
  }
  /** 作った端末の呼び名（設定の一覧に出す） */
  function deviceName() {
    const ua = navigator.userAgent || '';
    if (/iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'iPad';
    if (/iPhone|iPod/.test(ua)) return 'iPhone';
    if (/Macintosh|Mac OS X/.test(ua)) return 'Mac';
    if (/Android/.test(ua)) return 'Android';
    if (/Windows/.test(ua)) return 'Windows';
    return 'この端末';
  }

  /** CBOR を読む（作ったパスキーの公開鍵を取りだすのに、使うぶんだけ）。最初の1つを返す */
  function cbor(u8) {
    let i = 0;
    const len = ai => {
      if (ai < 24) return ai;
      if (ai === 24) return u8[i++];
      if (ai === 25) { const v = (u8[i] << 8) | u8[i + 1]; i += 2; return v; }
      if (ai === 26) { const v = u8[i] * 16777216 + ((u8[i + 1] << 16) | (u8[i + 2] << 8) | u8[i + 3]); i += 4; return v; }
      throw new PasskeyError('bad_key');
    };
    const item = () => {
      if (i >= u8.length) throw new PasskeyError('bad_key');
      const b = u8[i++], mt = b >> 5, ai = b & 31;
      if (mt === 7) { if (ai === 20) return false; if (ai === 21) return true; if (ai === 22) return null; throw new PasskeyError('bad_key'); }
      const n = len(ai);
      if (mt === 0) return n;
      if (mt === 1) return -1 - n;
      if (mt === 2 || mt === 3) {
        if (i + n > u8.length) throw new PasskeyError('bad_key');
        const v = u8.slice(i, i + n); i += n;
        return mt === 2 ? v : new TextDecoder().decode(v);
      }
      if (mt === 4) { const a = []; for (let k = 0; k < n; k++) a.push(item()); return a; }
      if (mt === 5) { const m = new Map(); for (let k = 0; k < n; k++) { const key = item(); m.set(key, item()); } return m; }
      if (mt === 6) return item();
      throw new PasskeyError('bad_key');
    };
    return item();
  }

  /** 作ったときの返事から、公開鍵（P-256 の x・y）を取りだす */
  function publicKeyOf(res) {
    try {
      const ad = cbor(new Uint8Array(res.attestationObject)).get('authData');
      if (ad instanceof Uint8Array && ad.length > 55 && (ad[32] & 0x40)) {
        const cose = cbor(ad.subarray(55 + ((ad[53] << 8) | ad[54])));
        const x = cose.get(-2), y = cose.get(-3);
        if (cose.get(1) === 2 && cose.get(3) === -7 && cose.get(-1) === 1 && x && x.length === 32 && y && y.length === 32) return { x, y };
      }
    } catch (e) { /* 下の読み方をためす */ }
    // 読めなければ、ブラウザが出してくれる形（SPKI）から
    if (res.getPublicKey && res.getPublicKeyAlgorithm && res.getPublicKeyAlgorithm() === -7) {
      const k = new Uint8Array(res.getPublicKey());
      if (k.length === 91 && k[26] === 4) return { x: k.slice(27, 59), y: k.slice(59, 91) };
    }
    throw new PasskeyError('bad_key');
  }

  /** つながっている端末で、パスキーを作る。返すのは、裏側に送るもの（公開鍵・ID・この端末の名前） */
  async function create(url) {
    const userId = HB.packUrl(url);
    if (!userId) throw new PasskeyError('url_too_long');
    const cred = await navigator.credentials.create({ publicKey: {
      rp: { id: location.hostname, name: 'ひびの手帳' },
      user: { id: userId, name: 'ひびの手帳', displayName: 'ひびの手帳' },
      challenge: rand(32),
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
      authenticatorSelection: { authenticatorAttachment: 'platform', residentKey: 'required', requireResidentKey: true, userVerification: 'required' },
      attestation: 'none',
      timeout: 120000
    } });
    const key = publicKeyOf(cred.response);
    return { id: b64u(cred.rawId), x: b64u(key.x), y: b64u(key.y), rpId: location.hostname, origin: location.origin, name: deviceName() };
  }

  /** パスキーでログイン：裏側に見せる署名と、パスキーに入れておいた、つなぎ先の URL */
  async function get() {
    // 合図（challenge）は「hb1.いまの時刻.使い捨ての番号」。裏側が、古いもの・一度使ったものを止める
    const challenge = new TextEncoder().encode(`hb1.${Date.now()}.${hex(rand(16))}`);
    const a = await navigator.credentials.get({ publicKey: { challenge, rpId: location.hostname, userVerification: 'required', timeout: 120000 } });
    const r = a.response;
    return {
      url: r.userHandle ? HB.unpackUrl(new Uint8Array(r.userHandle)) : '',
      assertion: { id: b64u(a.rawId), clientDataJSON: b64u(r.clientDataJSON), authenticatorData: b64u(r.authenticatorData), signature: b64u(r.signature) }
    };
  }

  /** やめた・使えない、などを、ことばに */
  function explain(e, when) {
    const n = e && e.name;
    if (n === 'NotAllowedError' || n === 'AbortError') {
      return when === 'login' ? 'ログインをやめました（この端末にパスキーがないときは、つながっている端末の「設定」で作れます）' : 'パスキーを作るのをやめました';
    }
    if (n === 'InvalidStateError') return 'この端末には、もうこのパスキーがあります';
    if (n === 'SecurityError') return 'この URL では、パスキーが使えません（公開した https の URL で開いてください）';
    if (n === 'NotSupportedError') return 'この端末・ブラウザは、パスキーに対応していません';
    return e && e.message ? e.message : String(e);
  }
  const cancelled = e => !!e && (e.name === 'NotAllowedError' || e.name === 'AbortError');

  HB.passkey = { supported, platformReady, deviceName, create, get, explain, cancelled, MESSAGES, _cbor: cbor };
})(typeof globalThis !== 'undefined' ? globalThis : this);
