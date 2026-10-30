// 練習用サンプルの設定。保存先はこのブラウザの中だけ（Supabase には繋がらない。このページは store-supabase.js も読み込まない）。
// SITE_URL の ?local は、サンプルサイト（conference-demo）に「このブラウザの中の公開内容」を表示させる合図。
window.CONF_EDITOR_CONFIG = {
  BACKEND: "local",
  SITE_URL: "../../conference-demo/?local"
};
