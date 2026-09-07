// Supabase RPC 呼び出し（ライブラリ不要・fetchのみ）。window.Quiz 名前空間の下にまとめて
// quiz.html / teacher.html 側の同名関数（esc など）と衝突しないようにする。
window.Quiz = (function () {
  function configReady() {
    const c = window.QUIZ_CONFIG || {};
    return c.SUPABASE_URL && !c.SUPABASE_URL.includes("YOUR-PROJECT") &&
           c.SUPABASE_ANON_KEY && !c.SUPABASE_ANON_KEY.includes("YOUR-ANON-KEY");
  }

  async function rpc(fn, args) {
    const { SUPABASE_URL, SUPABASE_ANON_KEY } = window.QUIZ_CONFIG;
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(args || {}),
    });
    if (!res.ok) {
      throw new Error(`通信エラー (${res.status})`);
    }
    return res.json();
  }

  return { configReady, rpc };
})();
