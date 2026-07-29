# Mohammad Alfnish — Course platform + portfolio + agents

Next.js 16 App Router app (frontend **and** backend): courses with manual enrollment, portfolio case studies, admin dashboard, first-party analytics, and agent APIs. Designed to run as a **Docker standalone** image on **Coolify / Hostinger VPS**.

> Source files only in this repo. Install and deploy on your machine/VPS — no packages were installed in the authoring environment.

## Stack

- Next.js `>=16.2.11`, React 19, TypeScript
- Prisma + PostgreSQL
- Auth.js (credentials + Argon2id)
- Tailwind CSS 4
- Resend for email (never SMTP from the VPS)
- Optional: install `@cursor/sdk` separately for the code agent (`npm i @cursor/sdk`)

## Quick start (on your machine or VPS)

```bash
cp .env.example .env
# edit DATABASE_URL, AUTH_SECRET, ADMIN_*, NEXT_PUBLIC_SITE_URL

npm install
npx prisma migrate deploy
npm run db:seed
npm run build
npm run start   # or: npm run dev
```

Admin login uses `ADMIN_EMAIL` / `ADMIN_PASSWORD` from the seed.

## Docker Compose (local full stack)

Requires Docker Desktop / Engine with BuildKit enabled (default on recent Docker).

```bash
# First time — build (downloads pkgs once) + start Postgres + app
DOCKER_BUILDKIT=1 docker compose up --build

# After that, code-only changes: rebuild uses cached npm layer
DOCKER_BUILDKIT=1 docker compose up --build -d

# Seed admin + courses (one-shot)
docker compose --profile seed run --rm seed
```

- App: http://localhost:3000  
- Postgres: `localhost:5432` (`portfolio` / `portfolio` / db `portfolio`)  
- Migrations run automatically on app start  
- npm packages are cached in `.docker-cache/` + the `deps` image layer — editing app code does **not** re-download packages unless `package.json` / lockfile changed

Stop and wipe DB volume:

```bash
docker compose down -v
```


1. Provision Postgres in Coolify (internal network only — do **not** publish the DB port).
2. Build images in **GitHub Actions** (see `.github/workflows/build.yml`) and push to GHCR — do not build on the VPS.
3. Coolify app service pulls `ghcr.io/<you>/portfolio:latest`.
4. Pre-deploy command: `npx prisma migrate deploy` (or run migrations from a one-off).
5. Set runtime env from `.env.example`. Mark only `NEXT_PUBLIC_*` as build-time vars.
6. Healthcheck: `GET /api/health`.
7. Scheduled tasks (Coolify cron inside the container), examples:
   - `npx tsx scripts/tasks/analytics-rollup.ts` — daily
   - `npx tsx scripts/tasks/reconcile-seats.ts` — daily
   - `npx tsx scripts/tasks/stale-registrations.ts` — daily
   - `npx tsx scripts/tasks/cleanup-tokens.ts` — daily
   - `npx tsx scripts/tasks/course-reminders.ts` — daily

## Important routes

| Path | Purpose |
| --- | --- |
| `/` | Home — courses + featured work |
| `/courses/[slug]` | Course page + registration |
| `/work` | Case studies |
| `/admin` | Admin dashboard (ADMIN role) |
| `/admin/enrollments` | Roster + atomic seat confirm |
| `/student` | Student area |
| `/agents` | Public agent feed |
| `/api/register` | Course registration |
| `/api/track` | Cookieless analytics |
| `/api/agent/content` | Content agent (API key + Idempotency-Key) |
| `/api/agent/code` | Cursor SDK code agent |
| `/api/agent/demo` | Public read-only sandbox |

## Seat confirmation

Confirmation uses:

```sql
UPDATE "Course" SET "seatsTaken" = "seatsTaken" + 1
WHERE id = $1 AND "seatsTaken" < capacity
```

If zero rows update, the course is full — the dashboard refuses instead of overselling. A CHECK constraint and nightly reconcile backstop drift.

## Agents

- Content agent: scoped API key (`content`), idempotency keys, deletes → `PendingChange` approval. **No write access** to enrollments/payments/users.
- Code agent: scoped API key (`code`), opens PRs only (`autoCreatePR`), human merges after CI.
- Kill switch: `AGENTS_DISABLED=true` (restart container).

Create an API key hash with:

```bash
node -e "console.log(require('crypto').createHash('sha256').update('YOUR_RAW_KEY').digest('hex'))"
```

Insert into `ApiKey` (`label`, `keyHash`, `scope`).

## Privacy

- Your phone number is **not** published.
- Student phones are collected only for manual contact / WhatsApp.
- CVs live in `private/cv/` (gitignored + dockerignored). Do not copy into the image.

## Resume PDF

Place a phone-free PDF at `public/resume/mohammad-alfnish.pdf` before launch.

## Security notes

- Auth is re-checked inside Server Actions — middleware is not the only gate.
- Markdown is sanitised with `rehype-sanitize`.
- Rate limits are Postgres-backed.
- Pin `next` to `>=16.2.11`; CI fails below that floor.
