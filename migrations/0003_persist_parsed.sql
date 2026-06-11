-- Speichere geparste Felder direkt in D1, damit der Detail-Endpoint nicht
-- mehr raw_eml re-parsen muss. Re-Parse hat bei einigen Mails leere Felder
-- geliefert (vermutete BLOB-Roundtrip-Encoding-Problematik in D1).

ALTER TABLE messages ADD COLUMN text_body TEXT;
ALTER TABLE messages ADD COLUMN html_body TEXT;
ALTER TABLE messages ADD COLUMN to_json TEXT;
ALTER TABLE messages ADD COLUMN cc_json TEXT;
ALTER TABLE messages ADD COLUMN headers_json TEXT;
ALTER TABLE messages ADD COLUMN attachments_meta_json TEXT;
