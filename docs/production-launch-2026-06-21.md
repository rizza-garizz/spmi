# Production Launch 2026-06-21

Release candidate tag: `launch-candidate-2026-06-21`
Branch: `codex-spmi-ready`

## Scope

- Backend Node production deployment through `docker-compose.prod.yml`.
- Frontend Next.js production deployment through Traefik.
- PostgreSQL migration and seed, including accreditation launch baseline data.
- SIAKAD preview UAT before commit mode is enabled.

## Server Prerequisites

- DNS points to the production server:
  - `SPMI_FRONTEND_DOMAIN`
  - `SPMI_API_DOMAIN`
- Public ports `80` and `443` are open.
- Docker and Docker Compose plugin are installed.
- `.env` exists on the server and is based on `.env.production.example`.

Fresh Ubuntu bootstrap:

```bash
curl -fsSL https://raw.githubusercontent.com/rizza-garizz/spmi/codex-spmi-ready/scripts/bootstrap-ubuntu-production.sh -o bootstrap-ubuntu-production.sh
sudo RELEASE_REF=launch-candidate-2026-06-21-r8 bash bootstrap-ubuntu-production.sh
```

Required `.env` values:

- `TRAEFIK_ACME_EMAIL`
- `SPMI_FRONTEND_DOMAIN`
- `SPMI_API_DOMAIN`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `JWT_SECRET` with at least 32 characters
- `SIAKAD_*` values if real SIAKAD preview UAT will run

## Launch Command

From the repository directory on the server:

```bash
git fetch origin
git checkout codex-spmi-ready
git pull --ff-only origin codex-spmi-ready
HEALTH_URL=https://api.example.ac.id/health ./scripts/launch-production.sh
```

Replace `https://api.example.ac.id/health` with the real API health URL.

GitHub Actions can also run production deploy manually through `Deploy Production`. Required repository or environment secrets:

- `PRODUCTION_HOST`
- `PRODUCTION_PORT` optional, defaults to `22`
- `PRODUCTION_USER`
- `PRODUCTION_SSH_KEY`
- `PRODUCTION_SMOKE_ADMIN_PASSWORD` if `run_smoke` is enabled
- `PRODUCTION_SMOKE_ADMIN_EMAIL` optional, defaults to `admin@spmi.local`

The same smoke admin secret is used when `run_accreditation_uat` is enabled.

Pre-workflow checklist: [production-github-actions-deploy-checklist.md](./production-github-actions-deploy-checklist.md).

For launch with real SIAKAD preview UAT:

```bash
HEALTH_URL=https://api.example.ac.id/health RUN_SIAKAD_UAT=true ./scripts/launch-production.sh
```

The launch script runs:

- production preflight
- backup if a previous production database container is already running
- container build and deploy
- Prisma migration through backend container startup
- `npm run prisma:seed`
- public API health check
- optional SIAKAD preview UAT

## Acceptance Gates

- `./scripts/preflight-production.sh` passes.
- `docker compose -f docker-compose.prod.yml --env-file .env ps` shows core services running.
- `curl https://api.example.ac.id/health` returns healthy status.
- Frontend domain opens the login page.
- Login with the seeded admin account works, then the password is changed.
- Accreditation page loads baseline periods, instruments, LKPS/LED, evidence, checks, and exports.
- SIAKAD preview UAT passes before any commit-mode sync is allowed.

## Post Launch Checks

```bash
HEALTH_URL=https://api.example.ac.id/health ./scripts/status-production.sh
```

Run smoke test:

```bash
BASE_URL=https://api.example.ac.id \
FRONTEND_URL=https://spmi.example.ac.id \
ADMIN_EMAIL=admin@spmi.local \
ADMIN_PASSWORD='Password123!' \
node scripts/smoke-production.js
```

Run accreditation launch UAT:

```bash
cd backend-node
UAT_BASE_URL=https://api.example.ac.id \
UAT_ADMIN_EMAIL=admin@spmi.local \
UAT_ADMIN_PASSWORD='Password123!' \
npm run uat:accreditation
```

Review:

- backend logs
- frontend logs
- Traefik certificate logs
- disk usage
- backup directory presence

## Rollback

If deploy fails before data migration is accepted:

```bash
docker compose -f docker-compose.prod.yml --env-file .env logs --tail 200 backend
docker compose -f docker-compose.prod.yml --env-file .env down
git checkout <previous-good-commit>
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

If data was migrated and rollback requires database restore, restore from the latest directory under `backups/production/` and validate with `./scripts/status-production.sh`.

## Notes

- Do not run `docker compose down -v` in production unless intentionally deleting database and uploads.
- Keep `ENABLE_API_DOCS=false` in production unless temporarily needed for controlled verification.
- Run real SIAKAD sync in preview first. Enable commit mode only after the preview is approved.
