# ChunkMaster V1 deployment runbook

V1 ships a privately distributed signed Android APK with its own launcher
icon. Do not create a Play Console app, upload an AAB, or treat store listing
as a launch gate. Web Admin remains on Cloudflare Pages.

## Environments

Use separate Neon databases, Railway services, Cloudflare Pages projects, JWT
secrets, Resend domains and OpenAI project keys for `staging` and `production`.
Never copy production user data into development.

## Provisioning

1. Create Neon PostgreSQL projects with pooled TLS URLs. Enable point-in-time
   restore and retain backups for at least 14 days.
2. Create a Railway service from `Backend/Dockerfile`. Add every variable in
   `Backend/.env.example`; production must use a random `JWT_SECRET` of at least
   32 bytes and `REQUIRE_EMAIL_VERIFICATION=true`.
3. Create a Railway worker from the same image when generation volume requires
   dedicated capacity. V1 currently dispatches jobs in the API process, so keep
   one API replica until the worker uses a durable claim loop.
4. Create a Cloudflare Pages project rooted at `Frontend`, build command
   `npm ci && npm run build`, output `dist`, and set `VITE_API_BASE_URL`.
5. Allow only the exact Pages custom domains in `CORS_ORIGINS`. Configure
   `app.example.com`, `api.example.com`, TLS and HSTS.
6. Configure Sentry release/error tracking before inviting others.

## Release

1. Confirm CI is green and record the image/commit SHA.
2. Take an on-demand Neon backup and note the restore point.
3. Deploy the API image. Its startup command runs `prisma migrate deploy`.
4. Verify `/health` and `/ready`; stop immediately if readiness fails.
5. Deploy the frontend, then run the learner and Admin smoke journeys.
6. Build the Capacitor Android signed release APK against the production API
   URL. Confirm the launcher icon, `applicationId`, and `versionCode`.
7. Install the APK on a real device via unknown sources, then share the same
   file privately. Keep the keystore offline; never commit it.
8. Production content is created through `/admin/generation` and manually
   approved. Never run the development seed in production.

## Rollback

- Application regression: redeploy the previous Railway image and previous
  Cloudflare Pages deployment.
- Migration regression: prefer a forward-fix migration. Do not run destructive
  Prisma reset commands in production.
- Data corruption: disable writes, preserve logs, restore Neon to a new branch,
  validate counts and ownership, then switch `DATABASE_URL`.
- Target recovery objectives for V1: RPO 24 hours, RTO 2 hours. PITR may provide
  a lower RPO depending on the selected Neon plan.
- Broken APK: stop sharing that file, raise `versionCode`, rebuild with the
  same keystore, and send the new APK. Recipients must cover-install; there is
  no store halt-rollout.

## Required smoke tests

- Register, verify email, log in, refresh session and log out.
- Learn one chunk, mark remembered/not remembered, and verify daily progress.
- Confirm only due chunks appear in Review and an empty queue stays empty.
- Create, edit and delete a note; confirm another account cannot access it.
- Reviewer can approve/reject pending content but cannot trigger generation.
- Content admin can generate, approve, retire and restore; every action appears
  in the audit log.
- Anonymous and learner requests to all `/admin/*` endpoints return 401/403.

## Alerts

Alert on readiness failures, API 5xx rate, abnormal login failures, generation
failure rate, OpenAI 429 responses and daily generation budget exhaustion.
Logs must include request IDs and must not contain passwords, cookies, bearer
tokens, reset tokens or raw secrets.

## V1 go/no-go

Private APK distribution to other people requires: no P0/P1 defects, successful
backup restore rehearsal, successful rollback rehearsal, all smoke tests
passing, a signed APK with a unique launcher icon that does not talk to
localhost or include Admin, install/upgrade instructions, in-app export/delete,
a support contact, and manually reviewed chunks on the connected environment.
Self-install of a debug build may use seed data. The repository supplies the
workflow; content quantity and external provider provisioning are operational
launch tasks, not generated automatically by deployment.
