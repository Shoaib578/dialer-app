-- Schema for dialer-app. Tables are prefixed `app_` to avoid any collision
-- with the pre-existing `dialer_*` tables owned by a separate application
-- on this shared tenant database.

DROP TABLE IF EXISTS app_messages;
DROP TABLE IF EXISTS app_chats;
DROP TABLE IF EXISTS app_call_history;
DROP TABLE IF EXISTS app_contacts;

CREATE TABLE app_contacts (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(191) NOT NULL,
  phone_e164 VARCHAR(20) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY app_contacts_phone_e164_unique (phone_e164)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- One row per dialed call, kept as a history log (not tied to SignalWire's
-- own call log retention).
CREATE TABLE app_call_history (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  call_sid VARCHAR(64) DEFAULT NULL,
  contact_id INT UNSIGNED DEFAULT NULL,
  to_number_e164 VARCHAR(20) NOT NULL,
  from_number_e164 VARCHAR(20) DEFAULT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'queued',
  duration_seconds INT UNSIGNED DEFAULT NULL,
  started_at TIMESTAMP NULL DEFAULT NULL,
  ended_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY app_call_history_call_sid_unique (call_sid),
  KEY app_call_history_contact_id_index (contact_id),
  KEY app_call_history_created_at_index (created_at),
  CONSTRAINT app_call_history_contact_id_foreign FOREIGN KEY (contact_id)
    REFERENCES app_contacts (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- A chat is the conversation thread with one phone number. Name is
-- denormalized from app_contacts (if linked) so a chat still shows a name
-- even if the contact is later deleted, and so unknown numbers can still
-- have a chat.
CREATE TABLE app_chats (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  contact_id INT UNSIGNED DEFAULT NULL,
  name VARCHAR(191) DEFAULT NULL,
  phone_e164 VARCHAR(20) NOT NULL,
  last_message_at TIMESTAMP NULL DEFAULT NULL,
  last_message_preview VARCHAR(320) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY app_chats_phone_e164_unique (phone_e164),
  KEY app_chats_contact_id_index (contact_id),
  CONSTRAINT app_chats_contact_id_foreign FOREIGN KEY (contact_id)
    REFERENCES app_contacts (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE app_messages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  chat_id BIGINT UNSIGNED NOT NULL,
  message_sid VARCHAR(64) DEFAULT NULL,
  direction ENUM('inbound','outbound') NOT NULL,
  body TEXT NOT NULL,
  status VARCHAR(24) DEFAULT NULL,
  error_message VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY app_messages_message_sid_unique (message_sid),
  KEY app_messages_chat_id_created_at_index (chat_id, created_at),
  CONSTRAINT app_messages_chat_id_foreign FOREIGN KEY (chat_id)
    REFERENCES app_chats (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
