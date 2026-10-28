// 編集ツールの設定。
//   BACKEND: "local"    … このブラウザの中だけに保存（ログイン不要。自分ひとりで使う／試す）
//   BACKEND: "supabase" … Supabase に保存（事務局の数人でログインして共同編集）。下の2つを設定する。
// anon（publishable）キーは「公開してよい」キー。データの守りは supabase/schema.sql の RLS が担当する。
// ★ 大会ごとに新しい Supabase プロジェクトを作り、その URL とキーをここに書く（README の手順）。
window.CONF_EDITOR_CONFIG = {
  BACKEND: "local",
  SUPABASE_URL: "",
  SUPABASE_ANON_KEY: ""
};
