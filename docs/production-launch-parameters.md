# Production Launch Parameters

Use these parameters for the first production launch of the accreditation module.

## GitHub Actions Input

Workflow: `Deploy Production`

```text
release_ref = launch-candidate-2026-06-21-r9
app_dir = /opt/spmi
health_url = https://api-spmi.CHANGE_ME_DOMAIN/health
frontend_url = https://spmi.CHANGE_ME_DOMAIN
run_backup = auto
run_seed = true
run_siakad_uat = false
run_smoke = true
run_accreditation_uat = true
```

Use `run_siakad_uat = true` only after the real SIAKAD credential is confirmed.

## GitHub Production Secrets

Create these in `Settings > Environments > production`:

```text
PRODUCTION_HOST = CHANGE_ME_SERVER_IP_OR_HOST
PRODUCTION_PORT = 22
PRODUCTION_USER = CHANGE_ME_SSH_USER
PRODUCTION_SSH_KEY = CHANGE_ME_PRIVATE_SSH_KEY
PRODUCTION_SMOKE_ADMIN_EMAIL = admin@spmi.local
PRODUCTION_SMOKE_ADMIN_PASSWORD = Password123!
```

Change `PRODUCTION_SMOKE_ADMIN_PASSWORD` after the first production login if the admin password is rotated.

## Server Env

Copy `.env.launch.example` to the server:

```bash
cd /opt/spmi
sudo cp .env.launch.example .env
sudo nano .env
sudo chmod 600 .env
```

Required replacements:

```text
CHANGE_ME_ADMIN_EMAIL
CHANGE_ME_DOMAIN
CHANGE_ME_STRONG_DATABASE_PASSWORD
CHANGE_ME_RANDOM_SECRET_MIN_32_CHARS
```

Generate strong local values on the server:

```bash
openssl rand -base64 32
openssl rand -hex 32
```

Suggested production domain pattern:

```text
SPMI_FRONTEND_DOMAIN = spmi.your-campus.ac.id
SPMI_API_DOMAIN = api-spmi.your-campus.ac.id
```

## First Server Bootstrap

```bash
curl -fsSL https://raw.githubusercontent.com/rizza-garizz/spmi/codex-spmi-ready/scripts/bootstrap-ubuntu-production.sh -o bootstrap-ubuntu-production.sh
sudo RELEASE_REF=launch-candidate-2026-06-21-r9 bash bootstrap-ubuntu-production.sh
```

## Production Gate

Launch is acceptable when:

```text
Deploy Production = success
Smoke test = success
Accreditation UAT = success
Frontend domain opens
Admin can log in
Accreditation export package downloads
Admin default password is changed
```
