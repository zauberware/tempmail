CREATE TABLE inboxes (
  address       TEXT PRIMARY KEY,
  created_at    INTEGER NOT NULL,
  last_seen_at  INTEGER NOT NULL,
  owner_token   TEXT NOT NULL
);

CREATE TABLE messages (
  id              TEXT PRIMARY KEY,
  inbox_address   TEXT NOT NULL,
  from_addr       TEXT,
  from_name       TEXT,
  subject         TEXT,
  received_at     INTEGER NOT NULL,
  size_bytes      INTEGER,
  has_attachments INTEGER NOT NULL DEFAULT 0,
  r2_key          TEXT NOT NULL,
  text_preview    TEXT,
  FOREIGN KEY (inbox_address) REFERENCES inboxes(address) ON DELETE CASCADE
);

CREATE INDEX idx_messages_inbox_received ON messages(inbox_address, received_at DESC);
CREATE INDEX idx_messages_received ON messages(received_at);
CREATE INDEX idx_inboxes_last_seen ON inboxes(last_seen_at);
