-- 001：土台（小さな置き場・貸出・回数制限・操作の記録・閲覧の記録・知らせ・運営メンバー・ログインの状態）
-- MariaDB 10.5 以上（MySQL 8 でも動く書き方）。文字は utf8mb4、比べ方は「そのまま」（utf8mb4_bin。大文字小文字・全角半角を区別する）。
-- 時刻はすべて UTC の DATETIME(3)（接続の time_zone を +00:00 にしている）。

CREATE TABLE IF NOT EXISTS hub_kv (
  k          VARCHAR(100) NOT NULL PRIMARY KEY,
  v          MEDIUMTEXT NULL,
  expires_at DATETIME(3) NULL,
  updated_at DATETIME(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS hub_locks (
  name         VARCHAR(64) NOT NULL PRIMARY KEY,
  owner        CHAR(32) NULL,
  locked_until DATETIME(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS hub_rate_limits (
  bucket       VARCHAR(190) NOT NULL PRIMARY KEY,
  window_start DATETIME(3) NOT NULL,
  count        INT NOT NULL DEFAULT 0,
  KEY hub_rate_limits_window_idx (window_start)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- 操作の記録（書き込みの操作・ログイン・会員サイトからの呼び出し・コマンド）。1行ごとに、1つ前の行の指紋を含めた指紋を持つ（改ざんの検知）
CREATE TABLE IF NOT EXISTS hub_audit_log (
  id          BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  at          DATETIME(3) NOT NULL,
  actor_id    VARCHAR(64) NULL,
  actor_email VARCHAR(254) NULL,
  action      VARCHAR(80) NOT NULL,
  summary     JSON NOT NULL,
  ok          TINYINT(1) NOT NULL DEFAULT 1,
  error       VARCHAR(300) NULL,
  ip          VARCHAR(45) NULL,
  prev_hash   CHAR(64) NOT NULL,
  hash        CHAR(64) NOT NULL,
  KEY hub_audit_log_at_idx (at),
  KEY hub_audit_log_action_idx (action, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- 鎖の先頭（最後に書いた行の指紋）。書くたびに、この行を押さえて（FOR UPDATE）、順番を1本にする
CREATE TABLE IF NOT EXISTS hub_audit_head (
  id   TINYINT NOT NULL PRIMARY KEY,
  hash CHAR(64) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
INSERT IGNORE INTO hub_audit_head (id, hash) VALUES (1, '0000000000000000000000000000000000000000000000000000000000000000');

-- 個人の情報を「見た」記録（友だちの詳細・トークの中身・本人のデータの書き出し）。中身は残さない。誰が・いつ・誰のものを
CREATE TABLE IF NOT EXISTS hub_access_log (
  id          BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  at          DATETIME(3) NOT NULL,
  actor_id    VARCHAR(64) NULL,
  actor_email VARCHAR(254) NULL,
  action      VARCHAR(80) NOT NULL,
  subject     VARCHAR(100) NULL,
  ip          VARCHAR(45) NULL,
  KEY hub_access_log_at_idx (at),
  KEY hub_access_log_subject_idx (subject, at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- 運営への知らせ（メール）の送りすぎ防止
CREATE TABLE IF NOT EXISTS hub_alerts (
  k            VARCHAR(120) NOT NULL PRIMARY KEY,
  last_sent_at DATETIME(3) NULL,
  suppressed   INT NOT NULL DEFAULT 0,
  last_subject VARCHAR(200) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- 運営メンバー（管理画面を使う人）。ログインは メールアドレス＋パスワード＋二段階認証（必須）
--   role：owner（全部）／admin（メンバー管理以外の全部）／operator（チャット・タグ）／viewer（見るだけ）
CREATE TABLE IF NOT EXISTS hub_admins (
  id                   CHAR(36) NOT NULL PRIMARY KEY,
  email                VARCHAR(254) NOT NULL,
  email_norm           VARCHAR(254) NOT NULL,
  display_name         VARCHAR(40) NULL,
  role                 VARCHAR(10) NOT NULL DEFAULT 'viewer',
  password_hash        VARCHAR(255) NOT NULL,
  must_change_password TINYINT(1) NOT NULL DEFAULT 0,
  password_changed_at  DATETIME(3) NULL,
  totp_secret          TEXT NULL,
  totp_enabled_at      DATETIME(3) NULL,
  totp_last_step       BIGINT NULL,
  failed_logins        INT NOT NULL DEFAULT 0,
  locked_until         DATETIME(3) NULL,
  disabled_at          DATETIME(3) NULL,
  last_login_at        DATETIME(3) NULL,
  last_login_ip        VARCHAR(45) NULL,
  added_by             VARCHAR(254) NULL,
  created_at           DATETIME(3) NOT NULL,
  updated_at           DATETIME(3) NOT NULL,
  UNIQUE KEY hub_admins_email_uq (email_norm),
  CONSTRAINT hub_admins_role_ck CHECK (role IN ('owner', 'admin', 'operator', 'viewer'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- 二段階認証のアプリを無くしたときの、使い捨ての回復コード（指紋だけを持つ）
CREATE TABLE IF NOT EXISTS hub_admin_recovery_codes (
  admin_id  CHAR(36) NOT NULL,
  code_hash CHAR(64) NOT NULL,
  used_at   DATETIME(3) NULL,
  PRIMARY KEY (admin_id, code_hash),
  CONSTRAINT hub_recovery_admin_fk FOREIGN KEY (admin_id) REFERENCES hub_admins (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- ログインの状態（セッション）。ブラウザのクッキーには推測できない文字列だけ。ここには、その指紋（SHA-256）を持つ
--   stage：password（パスワードまで。二段階認証の前）／full（二段階認証まで済んだ）
CREATE TABLE IF NOT EXISTS hub_sessions (
  id_hash      CHAR(64) NOT NULL PRIMARY KEY,
  admin_id     CHAR(36) NOT NULL,
  stage        VARCHAR(10) NOT NULL,
  csrf         VARCHAR(64) NOT NULL,
  ip           VARCHAR(45) NULL,
  user_agent   VARCHAR(200) NULL,
  created_at   DATETIME(3) NOT NULL,
  last_seen_at DATETIME(3) NOT NULL,
  expires_at   DATETIME(3) NOT NULL,
  KEY hub_sessions_admin_idx (admin_id),
  KEY hub_sessions_expires_idx (expires_at),
  CONSTRAINT hub_sessions_admin_fk FOREIGN KEY (admin_id) REFERENCES hub_admins (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
