-- R2 wird durch D1-BLOB ersetzt (kein Payment-Method-Zwang nötig).
-- Da noch keine Produktiv-Daten existieren, droppen wir messages und legen neu an.
DROP TABLE IF EXISTS messages;

CREATE TABLE messages (
  id              TEXT PRIMARY KEY,
  inbox_address   TEXT NOT NULL,
  from_addr       TEXT,
  from_name       TEXT,
  subject         TEXT,
  received_at     INTEGER NOT NULL,
  size_bytes      INTEGER,
  has_attachments INTEGER NOT NULL DEFAULT 0,
  raw_eml         BLOB NOT NULL,
  text_preview    TEXT,
  FOREIGN KEY (inbox_address) REFERENCES inboxes(address) ON DELETE CASCADE
);

CREATE INDEX idx_messages_inbox_received ON messages(inbox_address, received_at DESC);
CREATE INDEX idx_messages_received ON messages(received_at);
