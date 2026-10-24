# SAAF monorepo

SAAF is organised as independent Next.js applications with a shared API and reusable packages.

```text
apps/
  entry-portal/      Role selection and authentication entry point
  citizen-portal/    Citizen reporting, tracking, and volunteering
  ngo-portal/        NGO field-operations workspace
  csr-portal/        CSR funding and impact workspace
  admin-portal/      Municipal administration workspace
  api/               Shared platform API and Prisma route handlers
packages/
  ui/                Shared institutional UI primitives
  platform/          Shared server utilities, Prisma schema, and Supabase helpers
```

Each portal owns its routes, layouts, and feature components. The API owns all API routes and persistence code. Do not add another portal's pages, components, or API handlers to a portal app.

## Local development ports

| App | Port |
| --- | ---: |
| Entry | 3000 |
| Citizen | 3001 |
| NGO | 3002 |
| CSR | 3003 |
| Admin | 3004 |
| API | 3005 |

Portal URLs are configured with `NEXT_PUBLIC_*_PORTAL_URL`; API calls use `NEXT_PUBLIC_API_URL`.

## Environment ownership

- Put database, Cloudinary, Supabase publishable configuration, and the server-only `SUPABASE_SERVICE_ROLE_KEY` in `apps/api/.env.local`. The service-role key is used only for approved partner provisioning.
- Put `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `apps/ngo-portal/.env.local`, `apps/csr-portal/.env.local`, and `apps/admin-portal/.env.local` for portal sign-in and cookie refresh.
- Each portal may define only public URL configuration. Never duplicate database or Cloudinary secrets into portal apps.

## Authorization boundary

- NGO API requests resolve the Supabase user server-side and require an active `NgoMembership`; data queries use that membership's `ngoId`. NGO report offers, missions, assignments, evidence, and claims are scoped to that organization.
- CSR and Admin portal routes require Supabase `app_metadata.role` values `csr` and `admin`. The report detail and status APIs independently require the trusted Admin role. Client supplied `user_metadata` is not used for authorization.
- Public report submission is anonymous until citizen account sign-in and tracking are implemented. Public feeds return summary data and omit reporter contact, descriptions, and precise coordinates. The public report and volunteer write APIs have process-local rate limits.
- NGO and CSR applications are reviewed in the Admin portal. Approval creates organization memberships and Supabase invitations. CSR API calls require the trusted CSR role plus an active CSR organization membership; grants and impact data are scoped to that organization.
