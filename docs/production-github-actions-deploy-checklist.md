# Production GitHub Actions Deploy Checklist

Use this checklist before running the `Deploy Production` workflow.

Default launch parameters are listed in [production-launch-parameters.md](./production-launch-parameters.md).

## 1. GitHub Environment

Create or verify the `production` environment in GitHub:

- Settings > Environments > `production`
- Add required reviewers if approval is needed before deploy.
- Store production secrets in the environment, not in plain workflow inputs.

Required secrets:

- `PRODUCTION_HOST`
- `PRODUCTION_USER`
- `PRODUCTION_SSH_KEY`
- `PRODUCTION_SMOKE_ADMIN_PASSWORD`

Optional secrets:

- `PRODUCTION_PORT`, defaults to `22`
- `PRODUCTION_SMOKE_ADMIN_EMAIL`, defaults to `admin@spmi.local`

## 2. Production Server

On the production server:

```bash
cd /opt/spmi
git fetch origin --tags
git checkout launch-candidate-2026-06-21-r10
test -f .env
./scripts/preflight-production.sh
```

For a fresh Ubuntu server, bootstrap Docker and the repository first:

```bash
curl -fsSL https://raw.githubusercontent.com/rizza-garizz/spmi/codex-spmi-ready/scripts/bootstrap-ubuntu-production.sh -o bootstrap-ubuntu-production.sh
sudo RELEASE_REF=launch-candidate-2026-06-21-r10 bash bootstrap-ubuntu-production.sh
```

Confirm `.env` has real values for:

- `TRAEFIK_ACME_EMAIL`
- `SPMI_FRONTEND_DOMAIN`
- `SPMI_API_DOMAIN`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `JWT_SECRET`
- `SIAKAD_*` values if real SIAKAD preview UAT will run

## 3. DNS and Network

Confirm:

- Frontend domain points to the production server.
- API domain points to the production server.
- Ports `80` and `443` are open.
- No other service is binding public `80` or `443`.

## 4. Run Workflow

GitHub > Actions > `Deploy Production` > Run workflow:

- `release_ref`: `launch-candidate-2026-06-21-r10`
- `app_dir`: `/opt/spmi` or the real server path
- `health_url`: `https://api.example.ac.id/health`
- `frontend_url`: `https://spmi.example.ac.id`
- `run_backup`: `auto` for first launch, `true` for redeploy
- `run_seed`: `true`
- `run_siakad_uat`: `false` until SIAKAD credentials are verified
- `run_smoke`: `true`
- `run_accreditation_uat`: `true` for launch sign-off

## 5. Acceptance

The launch is acceptable when:

- Workflow deploy job succeeds.
- Public smoke test succeeds.
- `./scripts/status-production.sh` shows healthy services.
- Frontend login works.
- Accreditation module loads baseline data.
- Admin default password is changed after first login.

## 6. If Workflow Fails

Check:

- Missing GitHub secrets.
- SSH host, user, port, or key mismatch.
- Server `.env` missing or still using placeholders.
- Docker not installed or user not allowed to run Docker.
- DNS or Traefik certificate challenge failure.
- Smoke test password does not match the seeded or changed admin password.

Run status manually on the server:

```bash
cd /opt/spmi
HEALTH_URL=https://api.example.ac.id/health ./scripts/status-production.sh
```
