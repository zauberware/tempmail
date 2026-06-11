# Contributing

PRs welcome. The project is maintained by Zauberware Technologies GmbH & Co. KG
but external contributions are encouraged — bug reports, feature ideas, and
patches.

## Branches & PRs

- `main` is deploy-tracking on the maintainer's instance: every push to `main`
  auto-deploys to Cloudflare.
- For contributions: open a feature branch → PR → CI green → review → merge.
- For trivial fixes (typos, README), a direct push to `main` is fine if you have
  commit access; otherwise a PR.

## Local checks before pushing

```bash
npm run lint
npm run typecheck
npm run build
```

CI runs the same steps. Green locally = green in CI.

## Code style

- The Prettier config in `.prettierrc.json` is the source of truth. Editor
  autoformat is encouraged; `npm run format` reformats the whole repo.
- ESLint (`eslint.config.mjs`) — Flat Config, TypeScript-aware.
- TypeScript strict in `tsconfig.json` (worker) and `web/tsconfig.app.json` (UI).

## Migrations

- D1 migrations live in `migrations/`, numbered (`0001_…`, `0002_…`).
- New migration: `npx wrangler d1 migrations create tempmail <name>`. The
  database binding name is still `tempmail` — that's the unchanged infra name,
  not the product name.
- Apply locally: `npm run db:migrate:local`.
- Remote migrations are applied **automatically** by the deploy workflow.

## Secrets

- Never commit real secrets. `.dev.vars` is `.gitignore`d.
- Production secrets via `wrangler secret put` (locally) or GitHub secrets (for
  CI-relevant ones like `CLOUDFLARE_API_TOKEN`).

## Security-sensitive changes

For changes to `src/lib/auth.ts`, the inbound pipeline, or the D1 schema:

- Explicitly request a reviewer on the PR.
- Verify against the local stack (`npm run dev` + `npm run seed`) before merging.
