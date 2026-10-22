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

- Put database, Cloudinary, and Supabase server credentials in `apps/api/.env.local`.
- Put `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `apps/ngo-portal/.env.local` for NGO sign-in.
- Each portal may define only public URL configuration. Never duplicate database or Cloudinary secrets into portal apps.
