# NGO portal backend setup

## 1. Configure local authentication

Edit `apps/ngo-portal/.env.local` and add the Supabase Auth values from **Supabase Dashboard → Project Settings → API**:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_REPLACE_WITH_YOUR_PROJECT_KEY
```

The app already has its database URL and Cloudinary credentials. Keep `DATABASE_URL`, `DIRECT_URL`, and `CLOUDINARY_API_SECRET` private. The Supabase publishable key is designed to be public, but it is still project-specific. Never put a Supabase `service_role` or secret key in a `NEXT_PUBLIC_` variable.

## 2. Apply the new database schema

From the repository root, run:

```powershell
npm run db:generate --workspace=@saaf/platform
npm run db:push --workspace=@saaf/platform
```

`db:push` updates the connected Supabase database schema. These NGO tables/columns are additive. For ongoing team work, use a Prisma migration instead of repeatedly pushing schema changes.

## 3. Create an NGO staff login

In **Supabase Dashboard → Authentication → Users**, invite/create a user with email and password. Self-signup is intentionally disabled. Copy that user's Auth UUID.

Find an existing NGO ID without exposing credentials:

```powershell
npm run db:studio --workspace=@saaf/platform
```

In Prisma Studio, open `Ngo` and copy `ngoId`. Then add a row in `NgoMembership` with:

- `supabaseUserId`: Auth UUID copied above
- `ngoId`: the selected NGO ID
- `role`: `owner` (or `manager` / `field_staff`)
- `isActive`: `true`

Membership rows are an explicit approval gate. Do not make a user an owner unless the team approves it.

## 4. Start and sign in

```powershell
npm run dev:api
npm run dev:ngo
```

Open `http://localhost:3002`. Signed-out users are sent to `/login`; unlinked users receive a clear API authorization error until an administrator creates their membership. Sign in with the invited account.

## NGO API

All routes below require an active Supabase Auth session and NGO membership. Data is scoped to that membership's NGO.

- `GET /api/ngo/me`, `/dashboard`, `/opportunities`, `/missions`, `/volunteers`, `/funding/claims`
- `POST /api/ngo/opportunities/:offerId/respond` with `{ "decision": "accept" | "decline" }`
- `GET/PATCH /api/ngo/missions/:missionId`; status transitions are validated
- `POST /api/ngo/missions/:missionId/updates` with activity and 0–100 progress
- `GET/POST /api/ngo/missions/:missionId/volunteers`
- `POST /api/ngo/missions/:missionId/evidence` multipart fields `file`, `type`, optional `lat`, `lng`, `description`
- `POST /api/ngo/funding/claims` with mission, title, notes, and itemized amounts
- `POST /api/ngo/funding/claims/:claimId/receipts` multipart fields `itemId`, `file`

Cloudinary uploads accept images up to 8 MB. Uploaded evidence and receipt URLs are stored with their Cloudinary IDs. Mission completion remains a municipal review decision: NGO updates can submit a mission for review but cannot self-certify it as completed.
