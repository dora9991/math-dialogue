// Supabase の接続情報。math-labo-second（数学ラボ2）の既存プロジェクトに相乗りしている。
// anon(publishable) キーは「公開してよい」キー（数学ラボ2フロントに載っているものと同一）。
// データ保護はサーバー側のRLS＋quiz_* のsecurity definer RPCが担当する。
window.QUIZ_CONFIG = {
  SUPABASE_URL: "https://mtzhbiadzqjhvhzzdsbn.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_mq8nUqxVfGtnNHp5UCUtCA_9-x1xn7E",
};
