/* 接続先。
   ・本番：math-labo-second（数学ラボ2）の Supabase に相乗り（publishable キー＝公開前提のキー）。
     データの保護はサーバー側（RLS 全面ロック＋トークン必須の RPC）が担当する。
   ・自分のPC（localhost / 127.0.0.1）で開いたときは、検証用のローカルサーバーにつなぐ。
     本番につなぎたいときは URL に ?server=prod をつける。 */
window.LIVE_CONFIG = (function () {
  var PROD = {
    name: "本番",
    url: "https://mtzhbiadzqjhvhzzdsbn.supabase.co/rest/v1",
    key: "sb_publishable_mq8nUqxVfGtnNHp5UCUtCA_9-x1xn7E",
  };
  var LOCAL = {
    name: "ローカル検証",
    url: "http://127.0.0.1:54433",
    key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0",
  };
  var h = location.hostname;
  var isLocal = (h === "localhost" || h === "127.0.0.1") && !/[?&]server=prod\b/.test(location.search);
  return isLocal ? LOCAL : PROD;
})();
