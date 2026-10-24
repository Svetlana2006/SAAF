# Citizen, NGO, and volunteer workflow map

This map describes the current workflow implementation. NGO endpoints resolve the signed-in Supabase user to an active `NgoMembership` on the server and scope records by that membership's NGO. Public citizen reports are anonymous; public volunteer registrations use self-reported contact information and do not create an authenticated volunteer session.

| Screen | API / model | State |
| --- | --- | --- |
| Citizen report form | `POST /api/reports`, `Report`, `ReportImage`, `Location`, `NgoReportOffer` | Connected. Requires 3–5 validated photos, a category, severity, notes, and a confirmed map/address location. All photos are related to the report. Always anonymous. |
| Citizen community dashboard and public report detail | `GET /api/reports`, `GET /api/reports/:id/public`, `GET /api/volunteers` | Connected to public reports, status filters, sanitized report details, and active missions. This is a public community feed, not a personal report history. |
| Citizen volunteer signup | `GET/POST /api/volunteers`, `Mission`, `Volunteer`, `MissionVolunteer` | Connected. Uses form-entered name, email, phone, skills, shift, and consent. Public identity is not verified; duplicate mission signup and capacity are rejected. |
| NGO dashboard / mission progress | `GET /api/ngo/dashboard`, `GET /api/ngo/missions`, `PATCH /api/ngo/missions/:missionId`, `POST /api/ngo/missions/:missionId/evidence` | Connected. Metrics and mission records are scoped. Status transitions and evidence uploads use authenticated membership. |
| NGO report opportunities | `GET /api/ngo/opportunities`, `POST /api/ngo/opportunities/:offerId/respond` | Connected. Accept creates a mission transactionally; decline records the decision. A report can be accepted by only one NGO. |
| NGO volunteer roster and assignment | `GET /api/ngo/volunteers`, `GET/POST /api/ngo/missions/:missionId/volunteers` | Connected to volunteers already linked to this NGO's missions. Assignment checks mission scope, status, duplicate assignment, and capacity. Volunteers cannot sign in independently. |
| NGO profile / shell | `GET /api/ngo/me` | Connected to the active NGO membership. |
| NGO funding | `GET/POST /api/ngo/funding/claims`, `POST /api/ngo/funding/claims/:claimId/receipts` | Connected for NGO cost claims and receipt images. CSR escrow, reimbursement, payment, claim review, and sponsor ledgers are not implemented and are not represented as live. |
| NGO registration | `POST /api/partners/ngo-applications`, `GET /api/admin/partner-applications`, `POST /api/admin/partner-applications/:id/decision` | Connected. Applications are rate-limited and remain pending until an Admin approves; approval creates the NGO membership and sends an Auth invitation. |
| CSR registration | `POST /api/partners/csr-applications`, Admin partner-application endpoints | Connected. Approval creates a CSR organization, trusted role, membership, and Auth invitation. |
| CSR dashboard | `GET /api/csr/dashboard` | Connected. Counts and impact totals are derived from the authenticated CSR organization’s grant and impact records. |
| CSR missions and commitments | `GET /api/csr/missions`, `GET/POST /api/csr/grants` | Connected. CSR users see active missions and their own commitments. A commitment records funding intent only; it does not initiate payment. |
| CSR impact | `GET /api/csr/impact` | Connected to impact reports for missions supported by the signed-in CSR organization. |

## Remaining limitations

- Citizen report submission is anonymous and has no account-bound report history or citizen detail/status endpoint.
- Volunteer registration is public and rate-limited, but contact details are self-reported. There is no volunteer authentication, identity verification, withdrawal workflow, or self-service assignment update. NGO staff can assign a registered volunteer to their own mission.
- Mission progress/evidence actions are currently performed by an authenticated NGO member. There is no independent assigned-volunteer account.
- Report photos are uploaded to Cloudinary before database persistence. If the subsequent database write fails, those Cloudinary objects may need cleanup.
- Applying the unique assignment index requires checking for existing duplicate `(mission_id, volunteer_id)` rows first. The migration does not delete or modify existing rows.
- Partner approvals require `SUPABASE_SERVICE_ROLE_KEY` in the API environment and working Supabase Auth email delivery. The public application throttle is process-local; use a shared rate-limit store for multi-instance deployment.
- CSR commitment records require the partner/CSR additive migration to be applied. They are not payment transactions and do not update the existing NGO `Funding` ledger.
- Map selection and address search continue to use the existing MapTiler integration and `NEXT_PUBLIC_MAPTILER_KEY`.
