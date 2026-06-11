---
name: tempus
description: Create disposable email addresses on tempus.zauberware.org and read incoming mail via REST. Use this skill for signup-flow tests, account verification, magic-link and OTP workflows, capturing confirmation codes, or whenever a service requires a real email address and you want to grab the contents programmatically. Trigger words - tempus, tempmail, temp mail, disposable email, throwaway email, signup test, confirmation email, magic link test, OTP capture, verification mail.
---

# Tempus

Self-hosted disposable mail with a REST API. Repo: github.com/zauberware/tempus.
Auto-cleanup: messages after 7 days, idle inboxes after 30 days.

## One-time setup

Expects credentials in env vars `TEMPMAIL_USER` and `TEMPMAIL_PASS`. Check:

```bash
[ -n "$TEMPMAIL_USER" ] && [ -n "$TEMPMAIL_PASS" ] && echo "ok" || echo "missing"
```

If missing: ask the user ("Which basic-auth user/password for tempus.zauberware.org?")
and tell them to put it in `~/.zshrc` once:

```bash
export TEMPMAIL_USER='...'
export TEMPMAIL_PASS='...'
```

Base URL: `https://tempus.zauberware.org` (production). If the user runs a
different instance, ask for `TEMPMAIL_URL` and substitute below.

## Listing pool domains

```bash
curl -fsSL -u "$TEMPMAIL_USER:$TEMPMAIL_PASS" \
  https://tempus.zauberware.org/api/pool | jq -r '.domains[]'
```

Returns a list like `nosu.temp.zauberware.org`, `kuno.temp.zauberware.org`, etc.
Which domain you pick usually does not matter — only relevant if a service
blocks a specific domain; then try a different one.

## Creating an inbox

```bash
ADDR=$(curl -fsSL -u "$TEMPMAIL_USER:$TEMPMAIL_PASS" \
  -X POST https://tempus.zauberware.org/api/inboxes \
  -H 'content-type: application/json' \
  -d '{"local":"signup-test-'$(date +%s)'"}' \
  | jq -r .address)
echo "$ADDR"
```

Body fields:

- `local` (optional): desired local part. Must match
  `^[a-z0-9](?:[a-z0-9._+-]{0,62}[a-z0-9])?$`. Omit it → random slug like
  `swift-otter-417`.
- `domain` (optional): one of the pool domains. Omit it → first one from the pool.

Response: `{"address":"...","owner_token":"...","reused":true|false}`.

Tip: for reproducible tests, pass a deterministic local part (e.g.
`myapp-e2e-checkout`). If `reused: true`, the inbox already exists with previous
messages — delete the old ones first (see below) if needed.

## Waiting for a new mail (polling)

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

**Do not loop on a long `sleep N`** — the harness blocks long sleeps. 60–90s is
a reasonable cap, after which fail.

## Reading the latest mail

```bash
# newest message id
ID=$(curl -fsSL -u "$TEMPMAIL_USER:$TEMPMAIL_PASS" \
  "https://tempus.zauberware.org/api/inboxes/$ADDR/messages" \
  | jq -r '.messages[0].id')

# parsed message
curl -fsSL -u "$TEMPMAIL_USER:$TEMPMAIL_PASS" \
  "https://tempus.zauberware.org/api/inboxes/$ADDR/messages/$ID" > /tmp/mail.json
```

Shape of `/tmp/mail.json`:

- `from`, `to`, `cc`: `[{address, name}, ...]` or `null`
- `subject`: string or null
- `text`: plain-text body or null
- `html`: HTML body or null
- `headers`: `[{key, value}, ...]`
- `attachments`: `[{filename, mimeType, size, contentId, disposition}, ...]`

## Extracting confirmation codes / links

**Numeric OTP (4-8 digits):**

```bash
jq -r '.text' /tmp/mail.json | grep -oE '\b[0-9]{4,8}\b' | head -1
```

**Magic link (first HTTPS URL):**

```bash
# from text body:
jq -r '.text' /tmp/mail.json | grep -oE 'https?://[^[:space:]<>"]+' | head -1
# from HTML body (if text is empty):
jq -r '.html // ""' /tmp/mail.json \
  | grep -oE 'href="https?://[^"]+"' | head -1 | sed 's/href="//; s/"$//'
```

**Specific pattern (example: 6-digit code after "Code:"):**

```bash
jq -r '.text' /tmp/mail.json | grep -oE 'Code:[[:space:]]*[0-9]{6}' | grep -oE '[0-9]{6}'
```

## Deleting a mail (after successful processing)

```bash
curl -fsSL -u "$TEMPMAIL_USER:$TEMPMAIL_PASS" \
  -X DELETE "https://tempus.zauberware.org/api/inboxes/$ADDR/messages/$ID"
```

## Downloading the raw .eml

```bash
curl -fsSL -u "$TEMPMAIL_USER:$TEMPMAIL_PASS" \
  "https://tempus.zauberware.org/api/inboxes/$ADDR/messages/$ID/raw" > mail.eml
```

## Downloading an attachment

```bash
curl -fsSL -u "$TEMPMAIL_USER:$TEMPMAIL_PASS" \
  "https://tempus.zauberware.org/api/inboxes/$ADDR/messages/$ID/attachments/invoice.pdf" \
  > invoice.pdf
```

## End-to-end example: test a signup flow

```bash
# 1) grab an inbox
ADDR=$(curl -fsSL -u "$TEMPMAIL_USER:$TEMPMAIL_PASS" \
  -X POST https://tempus.zauberware.org/api/inboxes \
  -H 'content-type: application/json' \
  -d '{"local":"e2e-'$(date +%s)'"}' | jq -r .address)
echo "→ test inbox: $ADDR"

# 2) trigger the actual signup with this address
curl -fsSL -X POST https://app-under-test.example/signup \
  -d "email=$ADDR" -d "password=test1234"

# 3) wait for the confirmation mail
echo "→ waiting for confirmation mail …"
for i in $(seq 1 30); do
  N=$(curl -fsSL -u "$TEMPMAIL_USER:$TEMPMAIL_PASS" \
    "https://tempus.zauberware.org/api/inboxes/$ADDR/messages" | jq '.messages | length')
  [ "$N" -gt 0 ] && break
  sleep 2
done

# 4) extract the magic link and call it
ID=$(curl -fsSL -u "$TEMPMAIL_USER:$TEMPMAIL_PASS" \
  "https://tempus.zauberware.org/api/inboxes/$ADDR/messages" | jq -r '.messages[0].id')
LINK=$(curl -fsSL -u "$TEMPMAIL_USER:$TEMPMAIL_PASS" \
  "https://tempus.zauberware.org/api/inboxes/$ADDR/messages/$ID" \
  | jq -r '.text' | grep -oE 'https?://[^[:space:]<>"]+' | head -1)
echo "→ verify link: $LINK"
curl -fsSL "$LINK"
echo "✓ signup verified"
```

## REST API overview

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/pool` | List of available pool domains |
| POST | `/api/inboxes` | Create / reuse an inbox |
| GET | `/api/inboxes/:address/messages?limit&offset` | Message list |
| GET | `/api/inboxes/:address/messages/:id` | Parsed message detail |
| GET | `/api/inboxes/:address/messages/:id/raw` | Raw `.eml` |
| GET | `/api/inboxes/:address/messages/:id/attachments/:name` | Attachment |
| GET | `/api/inboxes/:address/messages/:id/cid/:cid` | Inline image by Content-ID |
| DELETE | `/api/inboxes/:address/messages/:id` | Delete one message |
| DELETE | `/api/inboxes/:address/messages` | Empty the inbox |

All requests need Basic Auth, otherwise 401.

## Common errors

- **401 Unauthorized** → `TEMPMAIL_USER`/`TEMPMAIL_PASS` not set or wrong.
  Check, ask the user.
- **400 `domain_not_in_pool`** → the domain you sent isn't in `/api/pool`.
  Fetch the pool first.
- **400 `invalid_local_part`** → the local part has special characters, is
  empty, or too long. Regex `^[a-z0-9](?:[a-z0-9._+-]{0,62}[a-z0-9])?$`.
- **Inbox never receives a mail** → check the pool domain (some SaaS providers
  block well-known disposable-mail domains). Try a different domain from the
  pool, or run `wrangler tail --config wrangler.inbound.toml` locally to see
  whether the inbound worker even gets triggered.
