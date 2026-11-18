/* 授業ライブ — サーバー呼び出し（fetch だけ・ライブラリ不要）
   ・タイムアウトつき
   ・提出もの（小テスト・振り返り）は、通信が切れていたら端末に保管して、つながったら自動で送り直す */
(function (root) {
  "use strict";
  const C = root.LIVE_CONFIG;
  const OUTBOX = "ll:outbox";

  class NetError extends Error {}

  async function rpc(fn, args, opt) {
    opt = opt || {};
    const ctrl = new AbortController();
    const tm = setTimeout(() => ctrl.abort(), opt.timeout || 12000);
    let res;
    try {
      res = await fetch(`${C.url}/rpc/${fn}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: C.key, Authorization: `Bearer ${C.key}` },
        body: JSON.stringify(args || {}),
        signal: ctrl.signal,
        cache: "no-store",
        credentials: "omit",
        referrerPolicy: "no-referrer",
      });
    } catch (e) {
      throw new NetError("通信できませんでした");
    } finally {
      clearTimeout(tm);
    }
    if (!res.ok) {
      const e = new Error(`サーバーエラー (${res.status})`);
      e.status = res.status;
      if (res.status >= 500 || res.status === 404 || res.status === 429) { const ne = new NetError(e.message); ne.status = res.status; throw ne; }
      throw e;
    }
    return res.json();
  }

  function outbox() { return (root.UI && root.UI.Store.get(OUTBOX, [])) || []; }
  function saveOutbox(list) { root.UI.Store.set(OUTBOX, list); }

  // 送れなかったら保管して { queued: true } を返す
  async function send(fn, args, meta) {
    try {
      return await rpc(fn, args);
    } catch (e) {
      if (e instanceof NetError) {
        const list = outbox();
        list.push({ id: Date.now() + "-" + Math.random().toString(36).slice(2, 6), fn, args, meta: meta || {}, at: Date.now() });
        saveOutbox(list.slice(-30));
        return { queued: true };
      }
      throw e;
    }
  }

  let flushing = false;
  async function flush(onDone) {
    if (flushing) return;
    const list = outbox();
    if (!list.length) return;
    flushing = true;
    const keep = [];
    for (const item of list) {
      try {
        const r = await rpc(item.fn, item.args);
        if (onDone) onDone(item, r);
      } catch (e) {
        if (e instanceof NetError) keep.push(item);
        else if (onDone) onDone(item, { error: "server" });
      }
    }
    saveOutbox(keep);
    flushing = false;
  }

  root.API = { rpc, send, flush, outbox, NetError, config: C };
})(window);
