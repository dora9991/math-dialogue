-- 010：LINE配信ハブ（line-hub の sql/001〜011 を、MariaDB 用に書き直したもの。表の名前・列の名前は、元と同じ）
--
-- 元（Postgres）からの主な読み替え：
--   jsonb → JSON（MariaDB では文字の列＋形の確認）／text[]（配列）→ JSON の配列／timestamptz → DATETIME(3)（UTC）
--   uuid → CHAR(36)（PHP で作る）／serial → AUTO_INCREMENT／部分インデックス → ふつうのインデックス
--   「行レベルセキュリティ」は無い。代わりに、DB のユーザーをこのハブ専用にし、外からの接続を許さない（Xserver の既定）
--
-- 暗号化して入れる列（中身は「e1.」で始まる文字。鍵は config.php）：
--   line_events.payload／line_message_log.text_preview・body・messages／line_outbox.messages／line_friends.note／
--   line_zoom_log.user_name・email／line_event_attendance.user_name・email
-- 検索や絞り込みに使う列（表示名・タグ・友だち情報・属性）は、暗号化しない（ここに、病気など「人に知られたくない情報」を入れない運用にする）

-- ---- 設定 ----
CREATE TABLE IF NOT EXISTS line_settings (
  `key`      VARCHAR(64) NOT NULL PRIMARY KEY,
  value      JSON NOT NULL,
  updated_at DATETIME(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- ---- 友だち台帳 ----
CREATE TABLE IF NOT EXISTS line_friends (
  line_user_id     VARCHAR(64) NOT NULL PRIMARY KEY,
  display_name     VARCHAR(200) NULL,
  picture_url      VARCHAR(1000) NULL,
  language         VARCHAR(20) NULL,
  status           VARCHAR(10) NOT NULL DEFAULT 'active',
  followed_at      DATETIME(3) NULL,
  blocked_at       DATETIME(3) NULL,
  member_ref       VARCHAR(100) NULL,
  member_plan      VARCHAR(50) NULL,
  member_rank      INT NULL,
  member_synced_at DATETIME(3) NULL,
  note             TEXT NULL,
  created_at       DATETIME(3) NOT NULL,
  updated_at       DATETIME(3) NOT NULL,
  KEY line_friends_status_idx (status),
  UNIQUE KEY line_friends_member_ref_uq (member_ref),
  KEY line_friends_followed_idx (followed_at),
  CONSTRAINT line_friends_status_ck CHECK (status IN ('active', 'blocked'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS line_tags (
  id          INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  description TEXT NULL,
  created_at  DATETIME(3) NOT NULL,
  UNIQUE KEY line_tags_name_uq (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS line_friend_tags (
  line_user_id VARCHAR(64) NOT NULL,
  tag_id       INT NOT NULL,
  created_at   DATETIME(3) NOT NULL,
  PRIMARY KEY (line_user_id, tag_id),
  KEY line_friend_tags_tag_idx (tag_id),
  CONSTRAINT line_friend_tags_friend_fk FOREIGN KEY (line_user_id) REFERENCES line_friends (line_user_id) ON DELETE CASCADE,
  CONSTRAINT line_friend_tags_tag_fk FOREIGN KEY (tag_id) REFERENCES line_tags (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- 友だち情報（key/value の文字列。一斉配信の絞り込みに使えるので、暗号化しない）
CREATE TABLE IF NOT EXISTS line_friend_fields (
  line_user_id VARCHAR(64) NOT NULL,
  `key`        VARCHAR(50) NOT NULL,
  value        TEXT NULL,
  updated_at   DATETIME(3) NOT NULL,
  PRIMARY KEY (line_user_id, `key`),
  CONSTRAINT line_friend_fields_friend_fk FOREIGN KEY (line_user_id) REFERENCES line_friends (line_user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Webhook の受信ログ。webhookEventId で重複排除する。processed_at が空＝処理に失敗した（tick が、もう一度処理する）
CREATE TABLE IF NOT EXISTS line_events (
  webhook_event_id VARCHAR(64) NOT NULL PRIMARY KEY,
  type             VARCHAR(40) NOT NULL,
  line_user_id     VARCHAR(64) NULL,
  payload          MEDIUMTEXT NOT NULL,
  received_at      DATETIME(3) NOT NULL,
  processed_at     DATETIME(3) NULL,
  attempts         INT NOT NULL DEFAULT 0,
  error            VARCHAR(500) NULL,
  KEY line_events_unprocessed_idx (processed_at, received_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- やり取りの記録（個別チャット）
CREATE TABLE IF NOT EXISTS line_message_log (
  id           INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  line_user_id VARCHAR(64) NULL,
  direction    VARCHAR(3) NOT NULL,
  kind         VARCHAR(40) NOT NULL,
  source       VARCHAR(120) NULL,
  text_preview TEXT NULL,
  body         MEDIUMTEXT NULL,
  messages     MEDIUMTEXT NULL,
  outbox_id    CHAR(36) NULL,
  actor        VARCHAR(254) NULL,
  event_id     VARCHAR(64) NULL,
  created_at   DATETIME(3) NOT NULL,
  KEY line_message_log_user_idx (line_user_id, id),
  KEY line_message_log_created_idx (created_at),
  KEY line_message_log_dir_idx (direction, id),
  UNIQUE KEY line_message_log_event_uq (event_id),
  CONSTRAINT line_message_log_dir_ck CHECK (direction IN ('in', 'out'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- ---- 自動化（ルール・シナリオ・イベント） ----
CREATE TABLE IF NOT EXISTS line_rules (
  id           INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(200) NOT NULL,
  enabled      TINYINT(1) NOT NULL DEFAULT 1,
  priority     INT NOT NULL DEFAULT 100,
  trigger_type VARCHAR(20) NOT NULL,
  match_mode   VARCHAR(10) NOT NULL DEFAULT 'exact',
  pattern      TEXT NULL,
  conditions   JSON NOT NULL,
  actions      JSON NOT NULL,
  stop_after   TINYINT(1) NOT NULL DEFAULT 1,
  created_at   DATETIME(3) NOT NULL,
  updated_at   DATETIME(3) NOT NULL,
  KEY line_rules_trigger_idx (trigger_type, enabled, priority),
  CONSTRAINT line_rules_trigger_ck CHECK (trigger_type IN ('keyword', 'postback', 'follow', 'unfollow', 'tag_added')),
  CONSTRAINT line_rules_mode_ck CHECK (match_mode IN ('exact', 'contains', 'regex'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS line_scenarios (
  id              INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(100) NOT NULL,
  description     TEXT NULL,
  enabled         TINYINT(1) NOT NULL DEFAULT 1,
  stop_on_tags    JSON NOT NULL,
  start_on_follow TINYINT(1) NOT NULL DEFAULT 0,
  start_on_tags   JSON NOT NULL,
  audience        JSON NOT NULL,
  stop_on_reply   TINYINT(1) NOT NULL DEFAULT 0,
  reply_scenario  VARCHAR(100) NULL,
  created_at      DATETIME(3) NOT NULL,
  updated_at      DATETIME(3) NULL,
  UNIQUE KEY line_scenarios_name_uq (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS line_scenario_steps (
  id             INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  scenario_id    INT NOT NULL,
  position       INT NOT NULL,
  anchor         VARCHAR(10) NOT NULL DEFAULT 'enrolled',
  offset_days    INT NOT NULL DEFAULT 0,
  offset_minutes INT NOT NULL DEFAULT 0,
  at_time        VARCHAR(5) NULL,
  conditions     JSON NOT NULL,
  messages       JSON NOT NULL,
  fixed_at       DATETIME(3) NULL,
  UNIQUE KEY line_scenario_steps_pos_uq (scenario_id, position),
  CONSTRAINT line_scenario_steps_sc_fk FOREIGN KEY (scenario_id) REFERENCES line_scenarios (id) ON DELETE CASCADE,
  CONSTRAINT line_scenario_steps_anchor_ck CHECK (anchor IN ('enrolled', 'event', 'fixed'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS line_calendar_events (
  id                 INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `key`              VARCHAR(80) NOT NULL,
  title              VARCHAR(200) NOT NULL,
  starts_at          DATETIME(3) NOT NULL,
  url                VARCHAR(1000) NULL,
  location           VARCHAR(200) NULL,
  capacity           INT NULL,
  tag                VARCHAR(100) NULL,
  reminder_scenario  VARCHAR(100) NULL,
  zoom_meeting_id    VARCHAR(20) NULL,
  attend_min_minutes INT NOT NULL DEFAULT 10,
  zoom_ended_at      DATETIME(3) NULL,
  finalized_at       DATETIME(3) NULL,
  recording_ready_at DATETIME(3) NULL,
  created_at         DATETIME(3) NOT NULL,
  UNIQUE KEY line_calendar_events_key_uq (`key`),
  KEY line_calendar_events_starts_idx (starts_at),
  KEY line_calendar_events_zoom_idx (zoom_meeting_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS line_event_participants (
  event_id     INT NOT NULL,
  line_user_id VARCHAR(64) NOT NULL,
  applied_at   DATETIME(3) NOT NULL,
  status       VARCHAR(10) NOT NULL DEFAULT 'applied',
  PRIMARY KEY (event_id, line_user_id),
  KEY line_event_participants_user_idx (line_user_id),
  CONSTRAINT line_event_participants_ev_fk FOREIGN KEY (event_id) REFERENCES line_calendar_events (id) ON DELETE CASCADE,
  CONSTRAINT line_event_participants_friend_fk FOREIGN KEY (line_user_id) REFERENCES line_friends (line_user_id) ON DELETE CASCADE,
  CONSTRAINT line_event_participants_status_ck CHECK (status IN ('applied', 'canceled'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- シナリオへの登録（人×シナリオ×イベント）。イベントなしは event_id0 = 0 として、二重登録を防ぐ
CREATE TABLE IF NOT EXISTS line_enrollments (
  id              INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  scenario_id     INT NOT NULL,
  line_user_id    VARCHAR(64) NOT NULL,
  event_id        INT NULL,
  event_id0       INT AS (COALESCE(event_id, 0)) STORED,
  status          VARCHAR(10) NOT NULL DEFAULT 'active',
  stop_reason     VARCHAR(40) NULL,
  enrolled_at     DATETIME(3) NOT NULL,
  anchor_event_at DATETIME(3) NULL,
  created_at      DATETIME(3) NOT NULL,
  UNIQUE KEY line_enrollments_uq (scenario_id, line_user_id, event_id0),
  KEY line_enrollments_user_idx (line_user_id, status),
  CONSTRAINT line_enrollments_sc_fk FOREIGN KEY (scenario_id) REFERENCES line_scenarios (id) ON DELETE CASCADE,
  CONSTRAINT line_enrollments_friend_fk FOREIGN KEY (line_user_id) REFERENCES line_friends (line_user_id) ON DELETE CASCADE,
  CONSTRAINT line_enrollments_ev_fk FOREIGN KEY (event_id) REFERENCES line_calendar_events (id) ON DELETE CASCADE,
  CONSTRAINT line_enrollments_status_ck CHECK (status IN ('active', 'completed', 'stopped'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS line_enrollment_steps (
  enrollment_id INT NOT NULL,
  step_id       INT NOT NULL,
  due_at        DATETIME(3) NOT NULL,
  status        VARCHAR(10) NOT NULL DEFAULT 'pending',
  skip_reason   VARCHAR(40) NULL,
  outbox_id     CHAR(36) NULL,
  processed_at  DATETIME(3) NULL,
  PRIMARY KEY (enrollment_id, step_id),
  KEY line_enrollment_steps_due_idx (status, due_at),
  KEY line_enrollment_steps_step_idx (step_id),
  CONSTRAINT line_enrollment_steps_en_fk FOREIGN KEY (enrollment_id) REFERENCES line_enrollments (id) ON DELETE CASCADE,
  CONSTRAINT line_enrollment_steps_st_fk FOREIGN KEY (step_id) REFERENCES line_scenario_steps (id) ON DELETE CASCADE,
  CONSTRAINT line_enrollment_steps_status_ck CHECK (status IN ('pending', 'queued', 'skipped'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- ---- 配信（送信の関所・月間通数・一斉配信） ----
CREATE TABLE IF NOT EXISTS line_outbox (
  id          CHAR(36) NOT NULL PRIMARY KEY,
  kind        VARCHAR(10) NOT NULL,
  to_user_ids JSON NOT NULL,
  messages    MEDIUMTEXT NOT NULL,
  source      VARCHAR(30) NOT NULL,
  source_ref  VARCHAR(254) NULL,
  priority    INT NOT NULL DEFAULT 100,
  cost        INT NOT NULL,
  status      VARCHAR(10) NOT NULL DEFAULT 'queued',
  attempts    INT NOT NULL DEFAULT 0,
  not_before  DATETIME(3) NULL,
  claimed_at  DATETIME(3) NULL,
  created_at  DATETIME(3) NOT NULL,
  sent_at     DATETIME(3) NULL,
  last_error  TEXT NULL,
  KEY line_outbox_due_idx (status, priority, created_at),
  KEY line_outbox_source_idx (source, source_ref),
  KEY line_outbox_created_idx (created_at),
  CONSTRAINT line_outbox_kind_ck CHECK (kind IN ('push', 'multicast')),
  CONSTRAINT line_outbox_status_ck CHECK (status IN ('queued', 'sending', 'sent', 'failed', 'skipped', 'dry_run'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS line_usage (
  ym          CHAR(7) NOT NULL PRIMARY KEY,
  sent        INT NOT NULL DEFAULT 0,
  dry_run     INT NOT NULL DEFAULT 0,
  skipped_cap INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS line_broadcasts (
  id              INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(100) NOT NULL,
  status          VARCHAR(10) NOT NULL DEFAULT 'draft',
  audience        JSON NOT NULL,
  messages        JSON NOT NULL,
  scheduled_at    DATETIME(3) NULL,
  recipient_count INT NULL,
  last_error      TEXT NULL,
  created_at      DATETIME(3) NOT NULL,
  sent_at         DATETIME(3) NULL,
  KEY line_broadcasts_sched_idx (status, scheduled_at),
  CONSTRAINT line_broadcasts_status_ck CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'canceled'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS line_broadcast_batches (
  broadcast_id INT NOT NULL,
  outbox_id    CHAR(36) NOT NULL,
  PRIMARY KEY (broadcast_id, outbox_id),
  KEY line_broadcast_batches_outbox_idx (outbox_id),
  CONSTRAINT line_broadcast_batches_b_fk FOREIGN KEY (broadcast_id) REFERENCES line_broadcasts (id) ON DELETE CASCADE,
  CONSTRAINT line_broadcast_batches_o_fk FOREIGN KEY (outbox_id) REFERENCES line_outbox (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- ---- Zoom の出欠 ----
CREATE TABLE IF NOT EXISTS line_zoom_log (
  id              BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  event_id        INT NOT NULL,
  kind            VARCHAR(5) NOT NULL,
  participant_key VARCHAR(100) NOT NULL,
  user_name       TEXT NULL,
  email           TEXT NULL,
  at              DATETIME(3) NOT NULL,
  received_at     DATETIME(3) NOT NULL,
  UNIQUE KEY line_zoom_log_uq (event_id, participant_key, kind, at),
  KEY line_zoom_log_event_idx (event_id, received_at),
  CONSTRAINT line_zoom_log_ev_fk FOREIGN KEY (event_id) REFERENCES line_calendar_events (id) ON DELETE CASCADE,
  CONSTRAINT line_zoom_log_kind_ck CHECK (kind IN ('join', 'leave'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS line_event_attendance (
  event_id        INT NOT NULL,
  participant_key VARCHAR(100) NOT NULL,
  line_user_id    VARCHAR(64) NULL,
  user_name       TEXT NULL,
  email           TEXT NULL,
  minutes         INT NOT NULL DEFAULT 0,
  attended        TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (event_id, participant_key),
  KEY line_event_attendance_user_idx (line_user_id),
  CONSTRAINT line_event_attendance_ev_fk FOREIGN KEY (event_id) REFERENCES line_calendar_events (id) ON DELETE CASCADE,
  CONSTRAINT line_event_attendance_friend_fk FOREIGN KEY (line_user_id) REFERENCES line_friends (line_user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS line_zoom_aliases (
  alias_key    VARCHAR(100) NOT NULL PRIMARY KEY,
  line_user_id VARCHAR(64) NOT NULL,
  created_at   DATETIME(3) NOT NULL,
  KEY line_zoom_aliases_user_idx (line_user_id),
  CONSTRAINT line_zoom_aliases_friend_fk FOREIGN KEY (line_user_id) REFERENCES line_friends (line_user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- ---- 個別チャットの部屋の状態 ----
CREATE TABLE IF NOT EXISTS line_chat_state (
  line_user_id   VARCHAR(64) NOT NULL PRIMARY KEY,
  last_read_id   INT NOT NULL DEFAULT 0,
  unread         INT NOT NULL DEFAULT 0,
  read_at        DATETIME(3) NULL,
  read_by        VARCHAR(254) NULL,
  needs_reply    TINYINT(1) NOT NULL DEFAULT 0,
  reply_token    VARCHAR(100) NULL,
  reply_token_at DATETIME(3) NULL,
  quick_reply_at DATETIME(3) NULL,
  updated_at     DATETIME(3) NOT NULL,
  CONSTRAINT line_chat_state_friend_fk FOREIGN KEY (line_user_id) REFERENCES line_friends (line_user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- ---- 属性（タグの種類）・アンケート ----
CREATE TABLE IF NOT EXISTS line_tag_groups (
  name       VARCHAR(20) NOT NULL PRIMARY KEY,
  choices    JSON NOT NULL,
  position   INT NOT NULL DEFAULT 100,
  single     TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS line_surveys (
  id              INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(50) NOT NULL,
  enabled         TINYINT(1) NOT NULL DEFAULT 1,
  start_on_follow TINYINT(1) NOT NULL DEFAULT 0,
  questions       JSON NOT NULL,
  done_message    TEXT NULL,
  done_tag        VARCHAR(100) NULL,
  done_extra      JSON NULL,
  created_at      DATETIME(3) NOT NULL,
  updated_at      DATETIME(3) NOT NULL,
  UNIQUE KEY line_surveys_name_uq (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS line_survey_responses (
  survey_id    INT NOT NULL,
  line_user_id VARCHAR(64) NOT NULL,
  answers      JSON NOT NULL,
  started_at   DATETIME(3) NOT NULL,
  updated_at   DATETIME(3) NOT NULL,
  completed_at DATETIME(3) NULL,
  PRIMARY KEY (survey_id, line_user_id),
  KEY line_survey_responses_user_idx (line_user_id),
  CONSTRAINT line_survey_responses_s_fk FOREIGN KEY (survey_id) REFERENCES line_surveys (id) ON DELETE CASCADE,
  CONSTRAINT line_survey_responses_friend_fk FOREIGN KEY (line_user_id) REFERENCES line_friends (line_user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- ---- 動画特典 ----
CREATE TABLE IF NOT EXISTS line_video_offers (
  id              INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `key`           VARCHAR(40) NOT NULL,
  name            VARCHAR(100) NOT NULL,
  enabled         TINYINT(1) NOT NULL DEFAULT 1,
  video_url       VARCHAR(2000) NOT NULL,
  preview_url     VARCHAR(2000) NOT NULL,
  deadline_hours  INT NOT NULL DEFAULT 48,
  watched_message TEXT NULL,
  bonus_messages  JSON NOT NULL,
  expired_message TEXT NULL,
  watched_tag     VARCHAR(100) NULL,
  claimed_tag     VARCHAR(100) NULL,
  created_at      DATETIME(3) NOT NULL,
  updated_at      DATETIME(3) NOT NULL,
  UNIQUE KEY line_video_offers_key_uq (`key`),
  CONSTRAINT line_video_offers_deadline_ck CHECK (deadline_hours BETWEEN 1 AND 8760)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS line_video_views (
  offer_id     INT NOT NULL,
  line_user_id VARCHAR(64) NOT NULL,
  watched_at   DATETIME(3) NOT NULL,
  deadline_at  DATETIME(3) NOT NULL,
  watch_count  INT NOT NULL DEFAULT 1,
  claimed_at   DATETIME(3) NULL,
  PRIMARY KEY (offer_id, line_user_id),
  KEY line_video_views_user_idx (line_user_id),
  CONSTRAINT line_video_views_o_fk FOREIGN KEY (offer_id) REFERENCES line_video_offers (id) ON DELETE CASCADE,
  CONSTRAINT line_video_views_friend_fk FOREIGN KEY (line_user_id) REFERENCES line_friends (line_user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
