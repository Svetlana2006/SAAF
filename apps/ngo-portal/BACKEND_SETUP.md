# NGO portal access

## Sign-in model

NGO sign-in uses the same Supabase Auth system as CSR and Admin. The trusted `app_metadata.role` must be `ngo`, and the account must have an active `NgoMembership` linked by `supabaseUserId`. The NGO organization and membership are created or linked by an administrator; there is no public sign-up. Passwords are managed by Supabase Auth and are not stored in application tables.

## Required environment

Configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for the NGO portal and API, using the existing Supabase project values. Configure `SUPABASE_SERVICE_ROLE_KEY` only in `apps/api/.env` for server-side or owner-run account provisioning. Never expose that key with a `NEXT_PUBLIC_` prefix.

## Provision an NGO from the command line

From the repository root, run:

```powershell
npm run provision:partner
```

Choose `ngo`, enter the organization's login email and details, then enter and confirm a password when prompted. Password input is masked. The command creates or links the NGO row, Supabase Auth account, and active owner membership without sending an email. Open `http://localhost:3002/login` to sign in.

The same command also supports existing Admin and CSR provisioning options. Provisioning refuses to change an existing account's different trusted role or link an account already attached to another NGO.

To revoke NGO access, set that membership's `isActive` to false through an authorized administrative operation. The API checks the active membership on protected requests.

## Database and local startup

Apply the existing Prisma migrations when setting up the database:

```powershell
npx prisma migrate deploy --schema packages/platform/prisma/schema.prisma
```

Start the API and NGO portal with the root development command or:

```powershell
npm run dev:api
npm run dev:ngo
```

Open `http://localhost:3002/login`. There is no NGO self-service account creation; administrators issue and revoke access.
