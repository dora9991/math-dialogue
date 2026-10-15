// 管理画面の起動。line-hub の管理画面の部品（line-hub-admin.js）に、このハブの管理 API（/admin/rpc）の呼び方を渡す。
//
//   ・ログインはクッキー（HttpOnly。スクリプトからは読めない）。ここでは触らない
//   ・書き換えを防ぐ合言葉（CSRF）は、ページの <meta name="hub-csrf"> から読み、X-CSRF-Token ヘッダーで送る
//   ・ログインが切れたら（401）、ログインの画面へ戻す
//   ・何もしない時間が続くと、サーバー側でログインが切れる（既定30分）。その少し前に知らせる

import './line-hub-admin.js';

const meta = (name) => document.querySelector(`meta[name="${name}"]`)?.getAttribute('content') ?? '';
const RPC = meta('hub-rpc');
const LOGIN = meta('hub-login');
const CSRF = meta('hub-csrf');
const IDLE_MIN = Number(meta('hub-idle-min')) || 30;

let lastCall = Date.now();

async function api(action, params = {}) {
  let res;
  try {
    res = await fetch(RPC, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'x-csrf-token': CSRF },
      body: JSON.stringify({ action, params }),
    });
  } catch {
    throw new Error('サーバーにつながりません。通信の状態を確かめてください');
  }
  lastCall = Date.now();
  let body = null;
  try {
    body = await res.json();
  } catch {
    /* JSON でない応答 */
  }
  if (res.status === 401) {
    location.href = LOGIN;
    throw new Error('ログインが切れました。もう一度ログインしてください');
  }
  if (res.ok && body?.ok) return body.result;
  const err = new Error(body?.error?.message || `エラーが起きました（${res.status}）`);
  err.code = body?.error?.code;
  err.status = res.status;
  throw err;
}

const el = document.getElementById('admin');
el.api = api;

// 何もしない時間が続いたときの知らせ（新着の確認は数に入れない＝本人の操作だけ）
const warnAt = Math.max(1, IDLE_MIN - 2) * 60_000;
let warned = false;
const touch = () => {
  lastCall = Date.now();
  warned = false;
};
for (const ev of ['click', 'keydown']) document.addEventListener(ev, touch, { passive: true });
setInterval(() => {
  if (!warned && Date.now() - lastCall > warnAt) {
    warned = true;
    const bar = document.createElement('div');
    bar.className = 'idle-warn';
    bar.textContent = 'しばらく操作がないため、まもなく自動でログアウトします。続けるときは、画面のどこかを押してください。';
    document.body.append(bar);
    const clear = () => {
      bar.remove();
      document.removeEventListener('click', clear);
    };
    document.addEventListener('click', clear);
  }
}, 30_000);
