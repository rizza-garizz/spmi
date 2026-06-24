# Accreditation Launch Sign-Off Pack

Use this pack to approve the accreditation module launch after production deploy.

## 1. Go-Live Sign-Off Checklist

Technical gates:

- Release tag deployed: `launch-candidate-2026-06-21-r13`
- Production deploy workflow succeeded.
- Production smoke test succeeded.
- Production accreditation UAT succeeded.
- Frontend domain opens over HTTPS.
- API health returns healthy status over HTTPS.
- Admin login works.
- Accreditation dashboard loads.
- LKPS, LED, evidence, action plan, review, checklist, and export package pages load.
- Export manifest downloads successfully.
- Default admin password changed.
- Backup exists before go-live announcement.

Business gates:

- LPM owner approves launch.
- Accreditation operator approves launch.
- SIAKAD integration owner confirms preview-only mode or real credential status.
- First production users are identified.
- Support contact is published.

## 2. UAT Approval Template

```text
Module: Accreditation
Release tag: launch-candidate-2026-06-21-r13
Environment: Production
Date:

UAT result:
[ ] Pass
[ ] Pass with notes
[ ] Fail

Validated scope:
[ ] Login and role access
[ ] Accreditation summary
[ ] Period setup
[ ] Instrument and criteria
[ ] Team, task, milestone
[ ] Risk lifecycle
[ ] LKPS entry
[ ] LED content
[ ] Evidence
[ ] Self score
[ ] Action plan
[ ] Internal review
[ ] Submission checklist
[ ] Export package and manifest download

Notes:

Approver name:
Approver role:
Signature/approval channel:
```

## 3. Rollback Decision Sheet

Rollback if one of these happens:

- Production API health fails after retry window.
- Frontend cannot load login page.
- Login fails for all admin users.
- Migration fails and backend cannot start.
- Accreditation export cannot be generated or downloaded.
- Data integrity issue appears in production accreditation records.

Do not rollback automatically if:

- Only a non-critical UI label is wrong.
- One user account has wrong role but admin can fix access.
- SIAKAD real sync is not ready while preview/manual mode still works.

Rollback command outline:

```bash
cd /opt/spmi
docker compose -f docker-compose.prod.yml --env-file .env logs --tail 200 backend
docker compose -f docker-compose.prod.yml --env-file .env down
git checkout <previous-good-tag>
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
HEALTH_URL=https://api-spmi.CHANGE_ME_DOMAIN/health ./scripts/status-production.sh
```

If database restore is required, restore from the latest `backups/production/` directory.

## 4. Hypercare 24 Hours

Monitor every 2 hours on launch day:

- API health
- frontend availability
- backend logs
- frontend logs
- Traefik certificate logs
- disk usage
- login success
- accreditation export package
- support tickets or user reports

Status command:

```bash
cd /opt/spmi
HEALTH_URL=https://api-spmi.CHANGE_ME_DOMAIN/health ./scripts/status-production.sh
```

Escalation:

- Severity 1: system unavailable, login unavailable, data corruption.
- Severity 2: accreditation workflow blocked for launch users.
- Severity 3: UI copy/layout issue, non-blocking warning, documentation gap.

## 5. Launch Announcement Template

```text
Subject: Modul Akreditasi SPMI Resmi Diluncurkan

Yth. Bapak/Ibu,

Modul Akreditasi SPMI telah tersedia dan dapat diakses melalui:

Frontend: https://spmi.CHANGE_ME_DOMAIN

Fitur utama:
- Periode akreditasi
- Instrumen dan kriteria
- LKPS dan LED
- Bukti fisik
- Penilaian mandiri
- Rencana tindak lanjut
- Review internal
- Checklist submit
- Export paket akreditasi

Kontak bantuan:
Nama:
Email/WhatsApp:

Terima kasih.
```
