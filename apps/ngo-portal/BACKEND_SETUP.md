# NGO portal access

## Sign-in model

The NGO portal uses an administrator-issued work email and password. NGO sign-in does not use Supabase Auth or require invitation email delivery. The API stores a salted scrypt password hash on an active `NgoMembership`; the password is never stored in plaintext. Sessions are signed, HTTP-only, and expire after eight hours. The API rechecks the active membership on protected requests, so disabling the membership revokes access.

## Configure the session secret

Set `NGO_SESSION_SECRET` to the same randomly generated value in:

- `apps/api/.env.local`
- `apps/ngo-portal/.env.local`

Use at least 32 random characters and keep the value server-side. Do not add a `NEXT_PUBLIC_` prefix or commit either local environment file.

## Grant or revoke NGO access

Create an NGO and an active `NgoMembership` through a trusted administrator workflow or reviewed database operation. `supabaseUserId` may be null. Set the membership's `loginEmail` to the granted work login and `passwordHash` to a hash produced with the shared `hashNgoPassword` utility. Keep `isActive` true to grant access; set it false to revoke access. Do not store plaintext passwords or grant an account by editing client-side data.

The account is linked to exactly one NGO membership by the login email. Every NGO API request is scoped to that membership's `ngoId`.

## Database and local startup

Apply reviewed Prisma migrations to create the membership table and password-auth columns:

```powershell
npx prisma migrate deploy --schema packages/platform/prisma/schema.prisma
```

Start the API and NGO portal with the root development command or:

```powershell
npm run dev:api
npm run dev:ngo
```

Open `http://localhost:3002/login`. There is no NGO self-service account creation; administrators issue and revoke access.
