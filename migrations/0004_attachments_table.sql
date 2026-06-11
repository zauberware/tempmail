-- Attachments separat speichern, damit /attachments und /cid nicht mehr
-- raw_eml re-parsen muessen (selbes Symptom wie beim Body: BLOB-Roundtrip
-- in D1 lieferte leere PostalMime-Resultate).
--
-- idx haelt die Reihenfolge der Attachments in der Mail fest und macht
-- gleichnamige Anhaenge unterscheidbar (Outlook macht das mit Inline-Images).

CREATE TABLE attachments (
  message_id    TEXT NOT NULL,
  idx           INTEGER NOT NULL,
  filename      TEXT NOT NULL,
  mime_type     TEXT,
  content_id    TEXT,
  disposition   TEXT,
  size_bytes    INTEGER NOT NULL,
  content       BLOB NOT NULL,
  PRIMARY KEY (message_id, idx),
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
);

CREATE INDEX idx_attachments_filename ON attachments(message_id, filename);
CREATE INDEX idx_attachments_cid ON attachments(message_id, content_id);
