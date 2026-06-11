# Contributing

PRs welcome. The project is maintained by Zauberware but external contributions are encouraged — bug reports, feature ideas, and patches.

## Branches & PRs

- `main` is deploy-tracking on the maintainer's instance: every push to `main` auto-deploys to Cloudflare.
- For contributions: open a feature branch → PR → CI green → review → merge.
- For trivial fixes (typos, README), a direct push to `main` is fine if you have commit access; otherwise a PR.

## Lokale Checks vor Push

```bash
npm run lint
npm run typecheck
npm run build
```

CI läuft die gleichen Schritte. Wenn lokal grün, ist CI grün.

## Code-Style

- Prettier-Config in `.prettierrc.json` ist die Source of Truth. Editor-Autoformat
  empfohlen. `npm run format` formatiert das Repo.
- ESLint (`eslint.config.mjs`) — Flat Config, TypeScript-aware.
- TypeScript strict in `tsconfig.json` (Worker) und `web/tsconfig.app.json` (UI).

## Migrations

- D1-Migrations leben in `migrations/`, nummeriert (`0001_…`, `0002_…`).
- Neue Migration: `npx wrangler d1 migrations create tempmail <name>`.
- Lokal anwenden: `npm run db:migrate:local`.
- Remote wird **automatisch** durch den Deploy-Workflow angewendet.

## Secrets

- Niemals echte Secrets in den Code committen. `.dev.vars` ist `.gitignore`d.
- Production-Secrets über `wrangler secret put` (lokal) oder GitHub-Secrets
  (für CI-relevante wie `CLOUDFLARE_API_TOKEN`).

## Sicherheits-relevante Änderungen

Bei Änderungen an `src/lib/auth.ts`, der Inbound-Pipeline oder D1-Schema:
- Im PR explizit Reviewer ziehen.
- Vor Merge gegen lokalen Stack (`npm run dev` + `npm run seed`) verifizieren.
