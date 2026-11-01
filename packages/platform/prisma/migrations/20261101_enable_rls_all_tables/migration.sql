-- Enable Row Level Security (RLS) on all public tables
-- Prisma connects via the postgres superuser/owner role which bypasses RLS.
-- Enabling RLS prevents the public Supabase PostgREST client (holding the anon key)
-- from directly querying, altering, or dumping backend tables without authorization.

ALTER TABLE "citizens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "reports" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "report_images" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "locations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ngos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "volunteers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "missions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "mission_volunteers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "citizen_confirmations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "hotspots" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "root_causes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "interventions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "fundings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "impact_reports" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "evidences" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "admin_audit_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "announcements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "mission_activities" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ngo_memberships" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ngo_report_offers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "mission_status_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ngo_cost_claims" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ngo_cost_claim_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ngo_applications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "csr_applications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "csr_organizations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "csr_memberships" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "csr_grants" ENABLE ROW LEVEL SECURITY;
