# tempmail

Self-hosted Wegwerf-Mail-Service auf Cloudflare. Web-UI wie temp-mail.org, REST-API
für Tests und KI-Agents, Multi-Domain-Pool. Null laufende Service-Kosten (alles im
Cloudflare Free Tier).

## Architektur

- **Inbound Worker** (`src/inbound.ts`) — Email-Trigger, parst eingehende Mails,
  persistiert Metadaten in D1 und rohe `.eml` in R2.
- **Web Worker** (`src/web.ts`) — Hono-App mit REST-API. Bei nicht-API-Routen
  fällt der Worker an die statischen Assets (React-UI) zurück. Basic Auth gilt
  für **alle** Requests (auch HTML/JS). Stündlicher Cron räumt alte Mails
  (>7 Tage) und tote Inboxes (>30 Tage) auf.
- **Web-UI** (`web/`) — Vite + React 19 + Tailwind v4 + shadcn/ui + TanStack Query.
  Wird per `npm run ui:build` nach `web/dist/` gebaut und über Wrangler's
  `[assets]`-Binding (mit `run_worker_first = true`) ausgeliefert.
- **D1** — Metadaten (`inboxes`, `messages`).
- **R2** — rohe RFC822-Nachrichten und Anhänge.

## Voraussetzungen

- Cloudflare-Account
- 1+ Domain in Cloudflare gehostet (NS-Records auf CF). Subdomains gehen auch.
- Node.js ≥ 20, npm

## Setup

```bash
npm install            # Worker-Deps (Hono, postal-mime, ulid)
npm run ui:install     # Web-UI-Deps (React, Vite, Tailwind, shadcn)
npx wrangler login
```

### 1) D1 anlegen

```bash
npx wrangler d1 create tempmail
```

Die ausgegebene `database_id` in **beide** wrangler-Files eintragen:
- `wrangler.toml`
- `wrangler.inbound.toml`

Schema migrieren:

```bash
npx wrangler d1 migrations apply tempmail --remote
```

### 2) R2-Bucket anlegen

```bash
npx wrangler r2 bucket create tempmail-eml
```

### 3) Pool-Domains konfigurieren

In beiden `wrangler*.toml` die `POOL_DOMAINS` Variable setzen, z.B.:

```toml
POOL_DOMAINS = "tmp.zauberware.com,mail.example.dev,kurz.email"
```

### 4) Basic-Auth-Secrets setzen

```bash
npx wrangler secret put BASIC_AUTH_USER
npx wrangler secret put BASIC_AUTH_PASS
```

(Beide Worker brauchen die Secrets — der Inbound-Worker für nichts, der Web-Worker für die UI/API.
Wir setzen sie der Einfachheit halber auf beide.)

```bash
npx wrangler secret put BASIC_AUTH_USER --config wrangler.inbound.toml
npx wrangler secret put BASIC_AUTH_PASS --config wrangler.inbound.toml
```

### 5) Deploy

```bash
npm run deploy
```

→ `tempmail-web` und `tempmail-inbound` werden deployed.

### 6) Email Routing pro Pool-Domain aktivieren

Im Cloudflare-Dashboard pro Domain:

1. **Email → Email Routing → Enable**. MX-Records werden auto-injiziert.
2. **Routing Rules → Catch-all address → Send to a Worker → `tempmail-inbound`**.
3. Speichern.

Für Subdomains (`tmp.zauberware.com`):
- Email Routing aktivieren — CF setzt MX-Records auf der Subdomain. Die Haupt-MX-Records
  (z.B. für O365) auf `zauberware.com` bleiben unberührt.

### 7) (Optional) Custom Domain fürs Frontend

In `wrangler.toml` den `[[routes]]`-Block einkommentieren:

```toml
[[routes]]
pattern = "tempmail.zauberware.com/*"
zone_name = "zauberware.com"
```

Dann nochmal `npm run deploy:web`.

## Auto-Deploy via GitHub Actions

Push auf `main` deployt automatisch beide Worker und wendet D1-Migrations remote an.
Workflow: `.github/workflows/deploy.yml`. Push/PR triggern zusätzlich `ci.yml`
(Lint + Typecheck + Build).

Benötigte GitHub-Secrets (Repo → Settings → Secrets and variables → Actions):

| Secret | Wert |
|---|---|
| `CLOUDFLARE_API_TOKEN` | API-Token mit `Account:Workers Scripts:Edit`, `Account:D1:Edit`, `Account:Account Settings:Read`, `User:User Details:Read` |
| `CLOUDFLARE_ACCOUNT_ID` | aus CF-Dashboard rechts in der Sidebar |

Token-Erstellung: My Profile → API Tokens → Create Token → "Edit Cloudflare Workers"
Template oder Custom Token mit obigen Permissions. Account-Scope auf den
entsprechenden Account einschränken.

> **Hinweis:** Basic-Auth-Secrets (`BASIC_AUTH_USER`/`BASIC_AUTH_PASS`) werden
> **nicht** vom Workflow gesetzt. Einmalig manuell per `wrangler secret put` in beiden
> Worker-Konfigurationen ablegen (siehe Setup-Schritt 4).

## Code-Qualität

```bash
npm run lint        # ESLint + Prettier --check
npm run format      # Prettier --write
npm run typecheck   # tsc (worker + web)
```

Pre-Push lokal: `npm run lint && npm run typecheck`. Im CI laufen die gleichen Checks.

## Lokal entwickeln

```bash
cp .dev.vars.example .dev.vars
npm run db:migrate:local
```

**Zwei Modi:**

1. **Worker + UI gebaut** (Production-ähnlich, statische Assets):
   ```bash
   npm run dev         # baut UI einmal, dann wrangler dev auf :8787
   ```

2. **Hot-Reload-UI** (Vite Dev-Server proxied an Worker):
   ```bash
   # Terminal 1
   npx wrangler dev    # Worker auf :8787 (API)
   # Terminal 2
   npm run ui:dev      # Vite auf :5173, /api/* wird gegen :8787 geproxied
   ```

Für Inbound-Tests:
```bash
npm run dev:inbound  # email worker (für lokale .eml-Tests)
```

Lokal Mail simulieren:

```bash
npx wrangler email send-local --from sender@example.com --to test@tmp.zauberware.com \
  --message-content-file ./sample.eml
```

## REST-API

Alle Endpoints erfordern Basic Auth.

| Methode | Pfad | Body | Zweck |
|---|---|---|---|
| GET | `/api/pool` | — | Pool-Domains |
| POST | `/api/inboxes` | `{ local?, domain? }` | Inbox anlegen (Random wenn leer) |
| GET | `/api/inboxes/:address/messages?limit&offset` | — | Mail-Liste |
| GET | `/api/inboxes/:address/messages/:id` | — | Parsed-Detail (text/html/attachments) |
| GET | `/api/inboxes/:address/messages/:id/raw` | — | rohe `.eml` |
| GET | `/api/inboxes/:address/messages/:id/attachments/:name` | — | Anhang |
| DELETE | `/api/inboxes/:address/messages/:id` | — | Löschen |

### Beispiel: KI-Agent wartet auf Bestätigungsmail

```bash
INBOX=$(curl -s -u $USER:$PASS https://tempmail.example.com/api/inboxes \
  -H 'content-type: application/json' \
  -d '{"local":"signup-test-1","domain":"tmp.zauberware.com"}' | jq -r .address)

# ... bei einem SaaS-Signup $INBOX angeben ...

while :; do
  N=$(curl -s -u $USER:$PASS \
    "https://tempmail.example.com/api/inboxes/$INBOX/messages" | jq '.messages | length')
  [ "$N" -gt 0 ] && break
  sleep 3
done
```

## Aufräumen

Cron läuft stündlich (`0 * * * *`). Defaults in `src/web.ts`:
- Messages > **7 Tage** alt → gelöscht (D1 + R2)
- Inboxes > **30 Tage** inaktiv und leer → gelöscht

## Migration auf VPS (später)

Wenn ihr public werdet oder Cloudflare-AUP-Risiko vermeiden wollt:
1. VPS mit Haraka oder Postal als SMTP-Receiver.
2. Hono-Routes laufen auch in Node (gleiche `src/web.ts`).
3. D1-Dump → Postgres-Import. R2 bleibt (S3-API) oder rsync auf Volume.
4. MX-Records pro Domain von CF Email Routing auf VPS umstellen.
