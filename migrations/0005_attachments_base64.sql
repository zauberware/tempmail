-- D1's .bind() koerziert BLOB-Binds (sowohl ArrayBuffer als auch Uint8Array)
-- in eine String-Repraesentation der Bytes (CSV of decimal). Praktisch heisst
-- das: BLOB-Spalten lassen sich von Workers aus nicht zuverlaessig binaer
-- befuellen. Workaround: Bytes als base64-TEXT speichern. 33% groesser,
-- dafuer ueberlebt's den Roundtrip.

ALTER TABLE attachments ADD COLUMN content_b64 TEXT;

-- Alte content-BLOB-Daten sind eh CSV-Strings (broken), kein Backfill noetig.
-- Spalte 'content' bleibt vorerst, wird im naechsten Pass entfernt sobald
-- bestaetigt ist dass content_b64 funktioniert.
