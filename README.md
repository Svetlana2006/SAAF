# SAAF â€” Spot Â· Assess Â· Act Â· Follow-up

SAAF is a monorepo of five Next.js portals and a shared API. The API owns persistence through Prisma and PostgreSQL; NGO sign-in uses Supabase Auth; report photos and NGO evidence use Cloudinary.

## Prerequisites and install

- Node.js 20.9 or newer (the Next.js 16 apps require this)
- npm 9 or newer

```bash
npm install
```

## Environment

Copy the relevant `.env.example` to `.env.local` for each app. Do not commit `.env.local` files.

`apps/api/.env.local` is the only place for server credentials:

- `DATABASE_URL` â€” PostgreSQL pooled/runtime connection.
- `DIRECT_URL` â€” direct PostgreSQL connection used by Prisma migrations.
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` â€” server-side image uploads.
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` â€” Supabase project and publishable key used to verify sessions.

The API also needs `SUPABASE_SERVICE_ROLE_KEY` in `apps/api/.env.local` to approve partner applications and provision trusted accounts. Keep it server-only; never put it in a portal `.env` file.

The NGO, CSR, and Admin portals also need `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in their own `.env.local` files for browser sign-in and cookie refresh. These are public project configuration values; never put service-role keys in portal apps. Portal API URLs use `NEXT_PUBLIC_API_URL`. The Citizen and Entry portals can set `NEXT_PUBLIC_MAPTILER_KEY` when map tiles are enabled.

Citizen sign-in uses Clerk email verification codes. Set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` in `apps/citizen-portal/.env`; set `CLERK_SECRET_KEY` and `CITIZEN_PORTAL_URL=http://localhost:3001` in `apps/api/.env`. Keep `CLERK_SECRET_KEY` server-only. Configure Clerk to allow email address and password sign-in, require email verification during sign-up, and use email verification codes. Use Clerk development keys on localhost and the matching live keys on your deployed domain. Verified Citizen identity/profile fields are synced by the API into the existing Supabase-hosted PostgreSQL `citizens` table through Prisma; Supabase Auth is not used for Citizen sign-in. NGO, CSR, and Admin integrations continue to use Supabase Auth.

After pulling the Citizen identity change, apply the additive Prisma migration with `npx prisma migrate deploy --schema packages/platform/prisma/schema.prisma` from the repository root. It adds a nullable Clerk identity column and its unique index to `citizens`; it does not remove existing Supabase identity data or report records.

The example files contain names and placeholders only. Use separate credentials for development and production.

## Database setup

The Prisma schema is `packages/platform/prisma/schema.prisma`. The migration history starts with `0_existing_schema`, a baseline of the pre-existing SAAF tables, followed by additive migrations for report image records, a unique mission-volunteer assignment index, partner applications, and CSR organizations and grants.

For a **fresh, empty database**, set `DATABASE_URL` and `DIRECT_URL`, then deploy all migrations:

```bash
npx prisma migrate deploy --schema packages/platform/prisma/schema.prisma
npm run db:generate --workspace=@saaf/platform
```

For an **existing database** created before Prisma migration history was enabled, first confirm its existing tables match `0_existing_schema`. Then mark that baseline as already present and deploy the additive migrations:

```bash
npx prisma migrate resolve --applied 0_existing_schema --schema packages/platform/prisma/schema.prisma
npx prisma migrate deploy --schema packages/platform/prisma/schema.prisma
npm run db:generate --workspace=@saaf/platform
```

Only run the baseline command against a database that already has the schema represented by `0_existing_schema`. It records existing schema; it does not create those tables. Before applying the assignment-index migration to an existing database, check for duplicate assignment pairs:

```sql
SELECT mission_id, volunteer_id, COUNT(*)
FROM mission_volunteers
GROUP BY mission_id, volunteer_id
HAVING COUNT(*) > 1;
```

Resolve any duplicates through an approved data-maintenance plan before applying the unique index; the migration intentionally does not delete data. Prisma CLI commands must receive `DATABASE_URL` and `DIRECT_URL` for the intended target database. If those values are only in `apps/api/.env` or `apps/api/.env.local`, load them into the CLI process before running migrations.

For a disposable local development database only, you may use the schema push command instead of deploying the migration:

```bash
npm run db:push --workspace=@saaf/platform
```

Do not point `db:push` or `db:seed` at a production or shared database. Review the checked-in baseline against any existing target database before marking it applied; deploy reviewed migrations through your normal database change process. `db:migrate` runs `prisma migrate dev` and is intended for local development. Never run seed scripts against a real database without reviewing their contents and target first.

## Supabase access provisioning

NGOs and CSR organizations can submit applications from their portal sign-in pages. An administrator reviews these under Partner applications in the Admin portal. Approval creates the organization and membership, then Supabase invites the contact. Configure Supabase Auth email delivery and allow `http://localhost:3001/auth/callback`, `http://localhost:3002/auth/callback`, and `http://localhost:3003/auth/callback` (plus deployed equivalents) in Supabase Auth redirect settings. Set `NGO_PORTAL_URL`/`CSR_PORTAL_URL`, and set `SUPABASE_SERVICE_ROLE_KEY` only in `apps/api/.env` for partner approvals. CSR authorization requires trusted `app_metadata.role=csr` and an active organization membership. NGO authorization requires an active `NgoMembership` tied to the invited Supabase user. Citizen account profiles are synchronized into `citizens` after email confirmation. Only a signed-in Citizen's non-anonymous report is linked to that profile; anonymous and guest reports are not linked to a Citizen row.

## Start the apps

Ports: Entry 3000, Citizen 3001, NGO 3002, CSR 3003, Admin 3004, API 3005.

```bash
npm run dev                 # all six processes
npm run dev:entry
npm run dev:citizen
npm run dev:ngo
npm run dev:csr
npm run dev:admin
npm run dev:api
```

CSR dashboard, mission commitments, and impact screens read organization-scoped mission, grant, and impact records from the API. CSR commitments are database records only; payments, escrow, and disbursement are not implemented. Other Admin screens remain demonstration interfaces; partner applications are live.

## Checks

```bash
npm run lint
npm test --workspace=@saaf/api
```

TypeScript and production builds can be run for all workspaces with:

```bash
npx tsc --noEmit -p apps/api/tsconfig.json
npm run build
```

The citizen dashboard shows public community reports because anonymous reports cannot be attached to a personal account. Volunteer registration is public with self-reported contact details; independent volunteer login and identity verification are not implemented. NGO cost claims are stored, but CSR escrow and payment processing are not implemented. See [WORKFLOW_API_MAP.md](WORKFLOW_API_MAP.md) for screen-to-endpoint mapping and limitations.

The API unit tests exercise trusted-role decisions, organization query scoping, input validation, report image data mapping, mission status transitions, and slot capacity. They do not run database-backed routes; a separate integration suite against an isolated test database is needed for end-to-end route authorization coverage. The public report and volunteer write limits are process-local. A multi-instance deployment needs a shared rate-limit store such as Redis/Upstash and appropriate proxy IP configuration.

See [ARCHITECTURE.md](ARCHITECTURE.md) for app ownership and routes.
