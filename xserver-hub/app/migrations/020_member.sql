-- 020：会員サイトとの連携（会員サイトから受け取った会員の情報・LINE とつなぐコード・会員サイトへの知らせ・API の使い回し防止）
--
-- 考え方：LINE の userId（個人を指す情報）は、このハブ（Xserver）の中だけに置く。会員サイトは「会員番号（member_ref）」で話す。
--   会員サイト → ハブ：連携コードを作って（POST /api/v1/link-codes）／プランが変わった（PUT /api/v1/members/{ref}）／
--                     この会員に通知を送って（POST /api/v1/notifications）／連携を外して（DELETE /api/v1/members/{ref}/link）
--   ハブ → 会員サイト：連携できた・外れた（設定 member.webhook_url に、署名つきで知らせる。届かなければ、やり直す）

-- 会員サイトから受け取った会員の情報（会員番号ごと。LINE とつながる前から持てる）
CREATE TABLE IF NOT EXISTS hub_members (
  member_ref VARCHAR(100) NOT NULL PRIMARY KEY,
  plan       VARCHAR(50) NULL,
  `rank`     INT NULL,
  fields     JSON NOT NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- 連携コード（6桁）。コードそのものは持たず、指紋（HMAC）だけを持つ。使い捨て・期限つき
CREATE TABLE IF NOT EXISTS hub_link_codes (
  id         BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  code_hash  CHAR(64) NOT NULL,
  member_ref VARCHAR(100) NOT NULL,
  expires_at DATETIME(3) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  used_at    DATETIME(3) NULL,
  used_by    VARCHAR(64) NULL,
  UNIQUE KEY hub_link_codes_hash_uq (code_hash),
  KEY hub_link_codes_member_idx (member_ref),
  KEY hub_link_codes_expires_idx (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- 会員サイトへの知らせ（連携できた・外れた）。届くまで、間をあけてやり直す
CREATE TABLE IF NOT EXISTS hub_site_events (
  id              BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  event           VARCHAR(40) NOT NULL,
  payload         JSON NOT NULL,
  status          VARCHAR(10) NOT NULL DEFAULT 'queued',
  attempts        INT NOT NULL DEFAULT 0,
  next_attempt_at DATETIME(3) NOT NULL,
  last_error      VARCHAR(500) NULL,
  created_at      DATETIME(3) NOT NULL,
  sent_at         DATETIME(3) NULL,
  KEY hub_site_events_due_idx (status, next_attempt_at),
  CONSTRAINT hub_site_events_status_ck CHECK (status IN ('queued', 'sent', 'failed'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- API の使い回し（リプレイ）防止：一度使った nonce は、期限まで二度と通さない
CREATE TABLE IF NOT EXISTS hub_api_nonces (
  key_id     VARCHAR(40) NOT NULL,
  nonce      VARCHAR(64) NOT NULL,
  expires_at DATETIME(3) NOT NULL,
  PRIMARY KEY (key_id, nonce),
  KEY hub_api_nonces_expires_idx (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
