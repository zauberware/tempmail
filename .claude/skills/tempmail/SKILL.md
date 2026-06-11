---
name: tempmail
description: Erstellt Wegwerf-E-Mail-Adressen auf tempus.zauberware.org und liest eingehende Mails per REST-API. Nutze diesen Skill für Signup-Flow-Tests, Account-Verifizierung, Magic-Link- und OTP-Workflows, Confirmation-Codes abfangen, oder wann immer ein Service eine echte E-Mail-Adresse braucht und du den Inhalt programmatisch abgreifen willst. Triggerwörter: tempmail, temp mail, wegwerf-mail, disposable email, bestätigungsmail, confirmation email, magic link testen, signup testen, OTP abfangen.
---

# tempmail

REST-API für selbst-gehostete Wegwerf-Mails. Repo: github.com/zauberware/tempmail.
Auto-Cleanup: Mails nach 7 Tagen, leere Inboxes nach 30 Tagen.

## Setup einmalig

Credentials erwartet in env vars `TEMPMAIL_USER` und `TEMPMAIL_PASS`. Prüfen:

```bash
[ -n "$TEMPMAIL_USER" ] && [ -n "$TEMPMAIL_PASS" ] && echo "ok" || echo "missing"
```

Wenn missing: User fragen ("Welcher Basic-Auth-User/Pass für tempus.zauberware.org?")
und ihm sagen, dass er das einmalig in seine `~/.zshrc` setzen soll:

```bash
export TEMPMAIL_USER='...'
export TEMPMAIL_PASS='...'
```

Base-URL: `https://tempus.zauberware.org` (Production). Falls der User eine andere
Instanz nutzt, frag nach `TEMPMAIL_URL` und ersetze unten entsprechend.

## Verfügbare Pool-Domains abfragen

```bash
curl -fsSL -u "$TEMPMAIL_USER:$TEMPMAIL_PASS" \
  https://tempus.zauberware.org/api/pool | jq -r '.domains[]'
```

Gibt eine Liste wie `nosu.temp.zauberware.org`, `kuno.temp.zauberware.org` etc. zurück.
Welche Domain du wählst ist meistens egal — nur falls ein Service eine bestimmte
Domain blockt, eine andere probieren.

## Inbox erstellen

```bash
ADDR=$(curl -fsSL -u "$TEMPMAIL_USER:$TEMPMAIL_PASS" \
  -X POST https://tempus.zauberware.org/api/inboxes \
  -H 'content-type: application/json' \
  -d '{"local":"signup-test-'$(date +%s)'"}' \
  | jq -r .address)
echo "$ADDR"
```

Body-Felder:
- `local` (optional): gewünschter local-part. Muss matchen `^[a-z0-9](?:[a-z0-9._+-]{0,62}[a-z0-9])?$`.
  Weglassen → random slug wie `swift-otter-417`.
- `domain` (optional): eine der Pool-Domains. Weglassen → erste aus dem Pool.

Response: `{"address":"...","owner_token":"...","reused":true|false}`.

Tipp: für reproduzierbare Tests einen deterministischen local-part vergeben
(z.B. `myapp-e2e-checkout`). Bei `reused: true` ist die Inbox samt alten Mails
wiederverwendbar — vorher ggf. alte Messages löschen (siehe unten).

## Auf neue Mail warten (Polling)

```bash
wait_for_mail() {
  local addr="$1"
  local timeout="${2:-60}"
  local elapsed=0
  while [ "$elapsed" -lt "$timeout" ]; do
    local n
    n=$(curl -fsSL -u "$TEMPMAIL_USER:$TEMPMAIL_PASS" \
      "https://tempus.zauberware.org/api/inboxes/$addr/messages" \
      | jq '.messages | length')
    if [ "$n" -gt 0 ]; then return 0; fi
    sleep 2
    elapsed=$((elapsed + 2))
  done
  return 1
}

wait_for_mail "$ADDR" 60 || { echo "timeout"; exit 1; }
```

**Nicht in einem `sleep N`-Loop ohne Timeout warten** — der Harness blockt lange
Sleeps. Maximal 60-90s als sinnvoller Default, danach Fehler werfen.

## Aktuellste Mail abrufen + parsen

```bash
# Neueste Mail-ID
ID=$(curl -fsSL -u "$TEMPMAIL_USER:$TEMPMAIL_PASS" \
  "https://tempus.zauberware.org/api/inboxes/$ADDR/messages" \
  | jq -r '.messages[0].id')

# Komplette geparste Mail
curl -fsSL -u "$TEMPMAIL_USER:$TEMPMAIL_PASS" \
  "https://tempus.zauberware.org/api/inboxes/$ADDR/messages/$ID" > /tmp/mail.json
```

Struktur von `/tmp/mail.json`:
- `from`, `to`, `cc`: `[{address, name}, ...]` oder `null`
- `subject`: string oder null
- `text`: Plain-Text-Body oder null
- `html`: HTML-Body oder null
- `headers`: `[{key, value}, ...]`
- `attachments`: `[{filename, mimeType, size, contentId, disposition}, ...]`

## Confirmation-Codes / Links extrahieren

**Numerischer OTP-Code (4-8 Ziffern):**
```bash
jq -r '.text' /tmp/mail.json | grep -oE '\b[0-9]{4,8}\b' | head -1
```

**Magic-Link (erster HTTPS-Link):**
```bash
# Aus text body:
jq -r '.text' /tmp/mail.json | grep -oE 'https?://[^[:space:]<>"]+' | head -1
# Aus HTML body (falls text leer):
jq -r '.html // ""' /tmp/mail.json \
  | grep -oE 'href="https?://[^"]+"' | head -1 | sed 's/href="//; s/"$//'
```

**Spezifisches Pattern (Beispiel: 6-stelliger Code nach "Code:")**:
```bash
jq -r '.text' /tmp/mail.json | grep -oE 'Code:[[:space:]]*[0-9]{6}' | grep -oE '[0-9]{6}'
```

## Mail löschen (nach erfolgreicher Verarbeitung)

```bash
curl -fsSL -u "$TEMPMAIL_USER:$TEMPMAIL_PASS" \
  -X DELETE "https://tempus.zauberware.org/api/inboxes/$ADDR/messages/$ID"
```

## Rohe .eml herunterladen

```bash
curl -fsSL -u "$TEMPMAIL_USER:$TEMPMAIL_PASS" \
  "https://tempus.zauberware.org/api/inboxes/$ADDR/messages/$ID/raw" > mail.eml
```

## Anhang herunterladen

```bash
curl -fsSL -u "$TEMPMAIL_USER:$TEMPMAIL_PASS" \
  "https://tempus.zauberware.org/api/inboxes/$ADDR/messages/$ID/attachments/invoice.pdf" \
  > invoice.pdf
```

## End-to-End Beispiel: Signup-Flow testen

```bash
# 1) Inbox holen
ADDR=$(curl -fsSL -u "$TEMPMAIL_USER:$TEMPMAIL_PASS" \
  -X POST https://tempus.zauberware.org/api/inboxes \
  -H 'content-type: application/json' \
  -d '{"local":"e2e-'$(date +%s)'"}' | jq -r .address)
echo "→ test inbox: $ADDR"

# 2) Signup mit dieser Adresse triggern (eigentlicher Test)
curl -fsSL -X POST https://app-under-test.example/signup \
  -d "email=$ADDR" -d "password=test1234"

# 3) Auf Confirmation-Mail warten
echo "→ warte auf confirmation mail …"
for i in $(seq 1 30); do
  N=$(curl -fsSL -u "$TEMPMAIL_USER:$TEMPMAIL_PASS" \
    "https://tempus.zauberware.org/api/inboxes/$ADDR/messages" | jq '.messages | length')
  [ "$N" -gt 0 ] && break
  sleep 2
done

# 4) Magic-Link extrahieren und aufrufen
ID=$(curl -fsSL -u "$TEMPMAIL_USER:$TEMPMAIL_PASS" \
  "https://tempus.zauberware.org/api/inboxes/$ADDR/messages" | jq -r '.messages[0].id')
LINK=$(curl -fsSL -u "$TEMPMAIL_USER:$TEMPMAIL_PASS" \
  "https://tempus.zauberware.org/api/inboxes/$ADDR/messages/$ID" \
  | jq -r '.text' | grep -oE 'https?://[^[:space:]<>"]+' | head -1)
echo "→ verify link: $LINK"
curl -fsSL "$LINK"
echo "✓ signup verified"
```

## REST-API Übersicht

| Method | Pfad | Zweck |
|---|---|---|
| GET | `/api/pool` | Verfügbare Pool-Domains |
| POST | `/api/inboxes` | Inbox anlegen / wiederholen |
| GET | `/api/inboxes/:address/messages?limit&offset` | Mail-Liste |
| GET | `/api/inboxes/:address/messages/:id` | Mail-Details (parsed) |
| GET | `/api/inboxes/:address/messages/:id/raw` | Rohe `.eml` |
| GET | `/api/inboxes/:address/messages/:id/attachments/:name` | Anhang |
| DELETE | `/api/inboxes/:address/messages/:id` | Mail löschen |

Alle Requests: Basic Auth Pflicht, sonst 401.

## Häufige Fehler

- **401 Unauthorized** → `TEMPMAIL_USER`/`TEMPMAIL_PASS` nicht gesetzt oder falsch. Prüfen, User fragen.
- **400 `domain_not_in_pool`** → angegebene Domain ist nicht in `/api/pool`. Pool zuerst abfragen.
- **400 `invalid_local_part`** → local-part hat Sonderzeichen oder ist zu lang/leer. Regex `^[a-z0-9](?:[a-z0-9._+-]{0,62}[a-z0-9])?$`.
- **Inbox bekommt keine Mail** → Pool-Domain prüfen (manche SaaS-Anbieter blocken bekannte temp-mail-Domains). Andere Domain aus dem Pool wählen oder `wrangler tail --config wrangler.inbound.toml` lokal checken.
