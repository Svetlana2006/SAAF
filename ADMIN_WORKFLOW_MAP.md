# Admin Portal workflow map

## Audit findings

- Admin sign-in and route protection already use Supabase Auth cookies and trusted `app_metadata.role=admin`; this work leaves that flow in place.
- Admin pages previously rendered sample metrics, mission inspections, funding figures, broadcasts, and hotspot indicators. The only pre-existing Admin data APIs were partner application review and CSR budget management.
- Application records are in the existing Prisma schema over the Supabase PostgreSQL database. The repository includes no SRS document; `UI/SAAF - Admin Portal.zip` contains five visual references only.
- The actual report statuses are `open`, `assigned`, and `completed`. Mission statuses include `planned`, `mobilizing`, `in_progress`, `review_pending`, and `completed`. The schema has no report verification status, report SLA/deadline, or nearby-coordinate recurrence model.

## Database-backed screens and endpoints

| Admin screen | API | Data and actions |
| --- | --- | --- |
| Dashboard | `GET /api/admin/dashboard` | Report totals/status/severity/category, mission status, active NGO memberships, registered volunteers, evidence review counts, active hotspots, exact-location recurrence, CSR grant totals, and recent audit/mission activity. Optional `from`/`to` range. |
| Complaints | `GET /api/admin/reports`; `GET /api/reports/:id`; `PATCH /api/reports/:id/status`; `GET /api/admin/hotspots` | Search and filter reports; display locations, photos, missions, NGO offers and citizen confirmation status without citizen PII; admin report status transitions are validated and audited. Hotspot records and exact-location recurrence are shown with category/severity/location filters. |
| Missions | `GET /api/admin/missions`; `PATCH /api/admin/evidence/:evidenceId/review`; `POST /api/admin/missions/:missionId/complete` | Mission/NGO/report/location/volunteer/progress/status history/funding/impact/evidence detail; evidence approval or rejection with a required rejection reason; complete only a `review_pending` mission after every uploaded `after` item is approved. |
| Funding | `GET /api/admin/funding`; existing `GET/PATCH /api/admin/csr-organizations` and `PATCH /api/admin/csr-organizations/:organizationId/budget` | CSR organizations, approved ceilings, internal `CsrGrant` commitments, associated missions/NGOs/impact, and a separate view of legacy NGO `Funding` rows. No payment or correction action is exposed. Budget edits are audited. |
| Updates | `GET/POST /api/admin/announcements`; `PATCH /api/admin/announcements/:announcementId`; `GET /api/announcements?audience=...` | Draft, publish, deactivate, archive, and target announcements to all/Citizen/NGO/CSR. Recipient endpoint limits targeted results to a verified corresponding portal session. Citizen/NGO/CSR layouts display published announcements for their audience. This is in-app display only; email, SMS and push delivery are not implemented. |
| Audit | `GET /api/admin/audit`; `GET /api/admin/audit?format=csv` | Read-only paginated audit history and CSV export of saved Admin events. |

All Admin API operations call `requirePortalRole(["admin"])` on the server. Report status, evidence review, mission completion, partner application decisions, CSR budget changes, and announcement changes create audit rows in the same database transaction as the corresponding Prisma write where possible.

## Safe schema change

Migration `20261026_admin_portal_operations` is additive. It adds explicit evidence review status/reviewer/time/reason fields (backfilling existing `verified=true` rows to `approved`), plus `admin_audit_events` and `announcements`. It does not delete or rewrite existing reports, evidence, missions, funding, or partner data. Admin audit rows have no edit/delete endpoint. No RLS policy is changed; the server-side Prisma pattern remains in use.

Deploy this migration to each target database and regenerate Prisma Client before starting the updated API:

```powershell
npx.cmd prisma migrate deploy --schema packages/platform/prisma/schema.prisma
npm.cmd run db:generate --workspace=@saaf/platform
```

Prisma commands need `DATABASE_URL` and `DIRECT_URL` set in the command process. The API runtime also needs its existing Supabase URL and publishable key. Service-role credentials are not used by these Admin data routes.

## Honest limits

- Reports cannot be called “verified” from their status: verification is recorded on evidence and impact reports. The dashboard describes this distinction.
- Report records have no SLA field, so the UI does not invent a “delayed” rule. Missions show when their scheduled date is in the past. Stalled-work thresholds are not configured.
- Recurrence counts reports attached to the same `locationId`; nearby coordinate matching and a computed hotspot score are unavailable.
- “Active NGOs” means NGOs with at least one active membership. Volunteer records have no active flag, so the dashboard labels the total as registered volunteers.
- The existing `Funding` ledger and CSR `CsrGrant` commitments are different models and are intentionally reported separately. Neither is presented as a bank transfer or escrow balance.
- Announcements are visible in Citizen, NGO, and CSR portal layouts by their selected audience. There is no separate delivery/receipt tracking or email/SMS/push integration.
- Data-backed screens require the new migration. Database-backed routes were not integration-tested against a live Supabase database in this workspace.

## Manual verification

1. Apply the migration and regenerate Prisma Client as above; restart the API and portals.
2. Sign in with an Admin account and open Dashboard, Complaints, Missions, Funding, and Updates. Check loading/error/empty behavior with the database available and unavailable.
3. Filter reports by status/category/severity/ward/date, inspect image and mission links, and try a status change that has no compatible mission; the API should return a conflict and save no status change.
4. Open a `review_pending` mission. Reject pending evidence without a reason (expect 400), then with a reason; approve an after image and confirm completion is blocked until all after images are approved.
5. Verify completing a mission updates its status history and any linked assigned report, and inspect the Admin audit table/CSV.
6. Create a draft announcement, publish it to one audience, deactivate/archive it, then sign in to that target portal and a different portal to check audience visibility.
7. Call `/api/admin/dashboard`, `/api/admin/reports`, and the mutation endpoints without a session and with a Citizen, NGO, or CSR session; expect 401 or 403.

Automated policy and CSV tests run with `npm.cmd test --workspace=@saaf/api`.
