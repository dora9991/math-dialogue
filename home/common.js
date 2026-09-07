// Supabase RPC 呼び出し（ライブラリ不要・fetch のみ）。window.Study 名前空間。
window.Study = (function () {
  function configReady() {
    const c = window.STUDY_CONFIG || {};
    return c.SUPABASE_URL && !c.SUPABASE_URL.includes("YOUR-PROJECT") &&
           c.SUPABASE_ANON_KEY && !c.SUPABASE_ANON_KEY.includes("YOUR-ANON-KEY");
  }
  async function rpc(fn, args) {
    const { SUPABASE_URL, SUPABASE_ANON_KEY } = window.STUDY_CONFIG;
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
  // タブを閉じたときのフォールバック送信（自己申告なしのセッション）
  function beacon(fn, args) {
    try {
      const { SUPABASE_URL, SUPABASE_ANON_KEY } = window.STUDY_CONFIG;
      const blob = new Blob([JSON.stringify(args || {})], { type: "application/json" });
      // sendBeacon はヘッダを付けられないため、apikey をクエリに載せる専用RPC想定
      return navigator.sendBeacon(
        `${SUPABASE_URL}/rest/v1/rpc/${fn}?apikey=${encodeURIComponent(SUPABASE_ANON_KEY)}`,
        blob
      );
    } catch (e) { return false; }
  }
  return { configReady, rpc, beacon };
})();
