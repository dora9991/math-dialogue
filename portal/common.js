// Supabase RPC 呼び出し（ライブラリ不要・fetch のみ）。window.Portal 名前空間。
window.Portal = (function () {
  function configReady() {
    const c = window.PORTAL_CONFIG || {};
    return c.SUPABASE_URL && !c.SUPABASE_URL.includes("YOUR-PROJECT") &&
           c.SUPABASE_ANON_KEY && !c.SUPABASE_ANON_KEY.includes("YOUR-ANON-KEY");
  }

  async function rpc(fn, args) {
    const { SUPABASE_URL, SUPABASE_ANON_KEY } = window.PORTAL_CONFIG;
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(args || {}),
    });
    if (!res.ok) throw new Error(`通信エラー (${res.status})`);
    return res.json();
  }

  // localStorage / sessionStorage が使えない環境（プライベートモード等）ではメモリにフォールバック
  function makeStore(kind) {
    const mem = {};
    let ok = false;
    try { window[kind].setItem("__t", "1"); window[kind].removeItem("__t"); ok = true; } catch (e) {}
    return {
      get(k) { try { return ok ? window[kind].getItem(k) : (mem[k] ?? null); } catch (e) { return mem[k] ?? null; } },
      set(k, v) { try { ok ? window[kind].setItem(k, v) : (mem[k] = v); } catch (e) { mem[k] = v; } },
      del(k) { try { ok ? window[kind].removeItem(k) : delete mem[k]; } catch (e) { delete mem[k]; } },
    };
  }

  return { configReady, rpc, local: makeStore("localStorage"), session: makeStore("sessionStorage") };
})();
