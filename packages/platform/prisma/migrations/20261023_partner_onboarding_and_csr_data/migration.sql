-- Additive partner onboarding and CSR workspace tables. Existing records are preserved.
CREATE TABLE "ngo_applications" (
    "application_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact_person" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "registration_number" TEXT,
    "expertise_areas" TEXT[] NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by" TEXT,
    CONSTRAINT "ngo_applications_pkey" PRIMARY KEY ("application_id")
);

CREATE INDEX "ngo_applications_status_created_at_idx" ON "ngo_applications"("status", "created_at");
CREATE INDEX "ngo_applications_email_status_idx" ON "ngo_applications"("email", "status");

CREATE TABLE "csr_applications" (
    "application_id" TEXT NOT NULL,
    "organization_name" TEXT NOT NULL,
    "contact_person" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "registration_number" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by" TEXT,
    CONSTRAINT "csr_applications_pkey" PRIMARY KEY ("application_id")
);

CREATE INDEX "csr_applications_status_created_at_idx" ON "csr_applications"("status", "created_at");
CREATE INDEX "csr_applications_email_status_idx" ON "csr_applications"("email", "status");

CREATE TABLE "csr_organizations" (
    "csr_organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact_person" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "registration_number" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "csr_organizations_pkey" PRIMARY KEY ("csr_organization_id")
);

CREATE UNIQUE INDEX "csr_organizations_email_key" ON "csr_organizations"("email");

CREATE TABLE "csr_memberships" (
    "membership_id" TEXT NOT NULL,
    "supabase_user_id" TEXT NOT NULL,
    "csr_organization_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'owner',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "csr_memberships_pkey" PRIMARY KEY ("membership_id")
);

CREATE UNIQUE INDEX "csr_memberships_supabase_user_id_key" ON "csr_memberships"("supabase_user_id");
CREATE INDEX "csr_memberships_csr_organization_id_is_active_idx" ON "csr_memberships"("csr_organization_id", "is_active");
ALTER TABLE "csr_memberships" ADD CONSTRAINT "csr_memberships_csr_organization_id_fkey"
    FOREIGN KEY ("csr_organization_id") REFERENCES "csr_organizations"("csr_organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "csr_grants" (
    "grant_id" TEXT NOT NULL,
    "csr_organization_id" TEXT NOT NULL,
    "mission_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'committed',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "csr_grants_pkey" PRIMARY KEY ("grant_id")
);

CREATE INDEX "csr_grants_csr_organization_id_status_created_at_idx" ON "csr_grants"("csr_organization_id", "status", "created_at");
CREATE INDEX "csr_grants_mission_id_idx" ON "csr_grants"("mission_id");
CREATE UNIQUE INDEX "csr_grants_csr_organization_id_mission_id_key" ON "csr_grants"("csr_organization_id", "mission_id");
ALTER TABLE "csr_grants" ADD CONSTRAINT "csr_grants_csr_organization_id_fkey"
    FOREIGN KEY ("csr_organization_id") REFERENCES "csr_organizations"("csr_organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "csr_grants" ADD CONSTRAINT "csr_grants_mission_id_fkey"
    FOREIGN KEY ("mission_id") REFERENCES "missions"("mission_id") ON DELETE RESTRICT ON UPDATE CASCADE;
