// クラブ（js/club.js）の接続先。math-labo-second（数学ラボ2）の Supabase プロジェクトに相乗り（テーブル・関数は bg_ / _bg_ の接頭辞）。
// anon（publishable）キーは「公開してよい」キー（quiz / home / lesson-live と同じ）。データは RLS と bg_* の RPC（トークンの確認）で守る。
window.BC = window.BC || {};
window.BC.CLUB_CONFIG = {
  url: 'https://mtzhbiadzqjhvhzzdsbn.supabase.co',
  key: 'sb_publishable_mq8nUqxVfGtnNHp5UCUtCA_9-x1xn7E',
};
