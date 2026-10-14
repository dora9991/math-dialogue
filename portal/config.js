// Supabase の接続情報。math-labo-second（数学ラボ2）の既存プロジェクトに相乗り。
// anon(publishable) キーは公開してよいキー（quiz / applied / home ツールと同一）。
// データ保護はサーバー側の RLS ＋ portal_* の security definer RPC が担当する。
window.PORTAL_CONFIG = {
  SUPABASE_URL: "https://mtzhbiadzqjhvhzzdsbn.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_mq8nUqxVfGtnNHp5UCUtCA_9-x1xn7E",
};
