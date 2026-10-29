// 編集ツールの設定。
//   BACKEND: "local"    … このブラウザの中だけに保存（ログイン不要。自分ひとりで使う／試す）
//   BACKEND: "supabase" … Supabase に保存（編集者としてログインして共同編集）
// 接続先は、math-dialogue の quiz/ などと同じ Supabase プロジェクト（数学ラボ2）。
// anon（publishable）キーは「公開してよい」キー（quiz/config.js と同じもの）。
// データの守りは supabase/schema.sql の RLS が担当する（公開側は公開済みの列だけ読める。編集は編集者だけ）。
// 先に supabase/schema.sql を、そのプロジェクトの SQL Editor で実行しておくこと（README の手順）。
window.CONF_EDITOR_CONFIG = {
  BACKEND: "supabase",
  SUPABASE_URL: "https://mtzhbiadzqjhvhzzdsbn.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_mq8nUqxVfGtnNHp5UCUtCA_9-x1xn7E"
};
