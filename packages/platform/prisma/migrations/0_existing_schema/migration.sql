-- CreateTable
CREATE TABLE "citizen_confirmations" (
    "confirmation_id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "citizen_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "photo_url" TEXT,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "citizen_confirmations_pkey" PRIMARY KEY ("confirmation_id")
);

-- CreateTable
CREATE TABLE "citizens" (
    "citizen_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT NOT NULL,
    "location" TEXT,
    "is_anonymous" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "citizens_pkey" PRIMARY KEY ("citizen_id")
);

-- CreateTable
CREATE TABLE "evidences" (
    "evidence_id" TEXT NOT NULL,
    "mission_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "photo_url" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "location_lat" DOUBLE PRECISION,
    "location_long" DOUBLE PRECISION,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cloudinary_id" TEXT,
    "description" TEXT,

    CONSTRAINT "evidences_pkey" PRIMARY KEY ("evidence_id")
);

-- CreateTable
CREATE TABLE "fundings" (
    "funding_id" TEXT NOT NULL,
    "mission_id" TEXT NOT NULL,
    "ngo_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "funding_source" TEXT NOT NULL,
    "received_date" TIMESTAMP(3) NOT NULL,
    "utilization_status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fundings_pkey" PRIMARY KEY ("funding_id")
);

-- CreateTable
CREATE TABLE "hotspots" (
    "hotspot_id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "recurrence_count" INTEGER NOT NULL DEFAULT 0,
    "last_cleaned_date" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hotspots_pkey" PRIMARY KEY ("hotspot_id")
);

-- CreateTable
CREATE TABLE "impact_reports" (
    "impact_id" TEXT NOT NULL,
    "mission_id" TEXT NOT NULL,
    "total_cleaned_locations" INTEGER NOT NULL,
    "total_waste_removed" DOUBLE PRECISION NOT NULL,
    "volunteer_hours" DOUBLE PRECISION NOT NULL,
    "recurring_hotspots_resolved" INTEGER NOT NULL,
    "environmental_benefits" TEXT,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "impact_reports_pkey" PRIMARY KEY ("impact_id")
);

-- CreateTable
CREATE TABLE "interventions" (
    "intervention_id" TEXT NOT NULL,
    "hotspot_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interventions_pkey" PRIMARY KEY ("intervention_id")
);

-- CreateTable
CREATE TABLE "locations" (
    "location_id" TEXT NOT NULL,
    "name_area" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "ward_zone" TEXT NOT NULL,
    "area_type" TEXT NOT NULL,
    "is_hotspot" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("location_id")
);

-- CreateTable
CREATE TABLE "mission_activities" (
    "activity_id" TEXT NOT NULL,
    "mission_id" TEXT NOT NULL,
    "activity_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "start_time" TIMESTAMP(3),
    "end_time" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "progress_percent" INTEGER,

    CONSTRAINT "mission_activities_pkey" PRIMARY KEY ("activity_id")
);

-- CreateTable
CREATE TABLE "mission_status_events" (
    "event_id" TEXT NOT NULL,
    "mission_id" TEXT NOT NULL,
    "membership_id" TEXT,
    "from_status" TEXT,
    "to_status" TEXT NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mission_status_events_pkey" PRIMARY KEY ("event_id")
);

-- CreateTable
CREATE TABLE "mission_volunteers" (
    "mission_volunteer_id" TEXT NOT NULL,
    "mission_id" TEXT NOT NULL,
    "volunteer_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "hours_contributed" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'registered',

    CONSTRAINT "mission_volunteers_pkey" PRIMARY KEY ("mission_volunteer_id")
);

-- CreateTable
CREATE TABLE "missions" (
    "mission_id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "ngo_id" TEXT NOT NULL,
    "lead_ngo" TEXT NOT NULL,
    "mission_type" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "assigned_to" TEXT NOT NULL,
    "scheduled_date" TIMESTAMP(3) NOT NULL,
    "estimated_cost" DOUBLE PRECISION,
    "actual_cost" DOUBLE PRECISION,
    "total_slots" INTEGER NOT NULL DEFAULT 20,
    "filled_slots" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "report_id" TEXT,

    CONSTRAINT "missions_pkey" PRIMARY KEY ("mission_id")
);

-- CreateTable
CREATE TABLE "ngo_cost_claim_items" (
    "item_id" TEXT NOT NULL,
    "claim_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "receipt_url" TEXT,
    "cloudinary_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ngo_cost_claim_items_pkey" PRIMARY KEY ("item_id")
);

-- CreateTable
CREATE TABLE "ngo_cost_claims" (
    "claim_id" TEXT NOT NULL,
    "ngo_id" TEXT NOT NULL,
    "mission_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ngo_cost_claims_pkey" PRIMARY KEY ("claim_id")
);

-- CreateTable
CREATE TABLE "ngo_memberships" (
    "membership_id" TEXT NOT NULL,
    "supabase_user_id" TEXT NOT NULL,
    "ngo_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'field_staff',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ngo_memberships_pkey" PRIMARY KEY ("membership_id")
);

-- CreateTable
CREATE TABLE "ngo_report_offers" (
    "offer_id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "ngo_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'offered',
    "offered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responded_at" TIMESTAMP(3),

    CONSTRAINT "ngo_report_offers_pkey" PRIMARY KEY ("offer_id")
);

-- CreateTable
CREATE TABLE "ngos" (
    "ngo_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact_person" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "expertise_areas" TEXT[],
    "address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ngos_pkey" PRIMARY KEY ("ngo_id")
);

-- CreateTable
CREATE TABLE "reports" (
    "report_id" TEXT NOT NULL,
    "citizen_id" TEXT,
    "location_id" TEXT,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "photo_url" TEXT,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("report_id")
);

-- CreateTable
CREATE TABLE "root_causes" (
    "root_cause_id" TEXT NOT NULL,
    "hotspot_id" TEXT NOT NULL,
    "cause_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "recommended_intervention" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "root_causes_pkey" PRIMARY KEY ("root_cause_id")
);

-- CreateTable
CREATE TABLE "volunteers" (
    "volunteer_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "skills" TEXT[],
    "availability" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "volunteers_pkey" PRIMARY KEY ("volunteer_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "citizens_email_key" ON "citizens"("email" ASC);

-- CreateIndex
CREATE INDEX "mission_status_events_mission_id_created_at_idx" ON "mission_status_events"("mission_id" ASC, "created_at" ASC);

-- CreateIndex
CREATE INDEX "ngo_cost_claims_ngo_id_status_submitted_at_idx" ON "ngo_cost_claims"("ngo_id" ASC, "status" ASC, "submitted_at" ASC);

-- CreateIndex
CREATE INDEX "ngo_memberships_supabase_user_id_is_active_idx" ON "ngo_memberships"("supabase_user_id" ASC, "is_active" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ngo_memberships_supabase_user_id_ngo_id_key" ON "ngo_memberships"("supabase_user_id" ASC, "ngo_id" ASC);

-- CreateIndex
CREATE INDEX "ngo_report_offers_ngo_id_status_offered_at_idx" ON "ngo_report_offers"("ngo_id" ASC, "status" ASC, "offered_at" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ngo_report_offers_report_id_ngo_id_key" ON "ngo_report_offers"("report_id" ASC, "ngo_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ngos_email_key" ON "ngos"("email" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "volunteers_email_key" ON "volunteers"("email" ASC);

-- AddForeignKey
ALTER TABLE "citizen_confirmations" ADD CONSTRAINT "citizen_confirmations_citizen_id_fkey" FOREIGN KEY ("citizen_id") REFERENCES "citizens"("citizen_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citizen_confirmations" ADD CONSTRAINT "citizen_confirmations_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports"("report_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidences" ADD CONSTRAINT "evidences_mission_id_fkey" FOREIGN KEY ("mission_id") REFERENCES "missions"("mission_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fundings" ADD CONSTRAINT "fundings_mission_id_fkey" FOREIGN KEY ("mission_id") REFERENCES "missions"("mission_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fundings" ADD CONSTRAINT "fundings_ngo_id_fkey" FOREIGN KEY ("ngo_id") REFERENCES "ngos"("ngo_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotspots" ADD CONSTRAINT "hotspots_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("location_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "impact_reports" ADD CONSTRAINT "impact_reports_mission_id_fkey" FOREIGN KEY ("mission_id") REFERENCES "missions"("mission_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interventions" ADD CONSTRAINT "interventions_hotspot_id_fkey" FOREIGN KEY ("hotspot_id") REFERENCES "hotspots"("hotspot_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mission_activities" ADD CONSTRAINT "mission_activities_mission_id_fkey" FOREIGN KEY ("mission_id") REFERENCES "missions"("mission_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mission_status_events" ADD CONSTRAINT "mission_status_events_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "ngo_memberships"("membership_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mission_status_events" ADD CONSTRAINT "mission_status_events_mission_id_fkey" FOREIGN KEY ("mission_id") REFERENCES "missions"("mission_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mission_volunteers" ADD CONSTRAINT "mission_volunteers_mission_id_fkey" FOREIGN KEY ("mission_id") REFERENCES "missions"("mission_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mission_volunteers" ADD CONSTRAINT "mission_volunteers_volunteer_id_fkey" FOREIGN KEY ("volunteer_id") REFERENCES "volunteers"("volunteer_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "missions" ADD CONSTRAINT "missions_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("location_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "missions" ADD CONSTRAINT "missions_ngo_id_fkey" FOREIGN KEY ("ngo_id") REFERENCES "ngos"("ngo_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "missions" ADD CONSTRAINT "missions_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports"("report_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ngo_cost_claim_items" ADD CONSTRAINT "ngo_cost_claim_items_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "ngo_cost_claims"("claim_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ngo_cost_claims" ADD CONSTRAINT "ngo_cost_claims_mission_id_fkey" FOREIGN KEY ("mission_id") REFERENCES "missions"("mission_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ngo_cost_claims" ADD CONSTRAINT "ngo_cost_claims_ngo_id_fkey" FOREIGN KEY ("ngo_id") REFERENCES "ngos"("ngo_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ngo_memberships" ADD CONSTRAINT "ngo_memberships_ngo_id_fkey" FOREIGN KEY ("ngo_id") REFERENCES "ngos"("ngo_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ngo_report_offers" ADD CONSTRAINT "ngo_report_offers_ngo_id_fkey" FOREIGN KEY ("ngo_id") REFERENCES "ngos"("ngo_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ngo_report_offers" ADD CONSTRAINT "ngo_report_offers_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports"("report_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_citizen_id_fkey" FOREIGN KEY ("citizen_id") REFERENCES "citizens"("citizen_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("location_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "root_causes" ADD CONSTRAINT "root_causes_hotspot_id_fkey" FOREIGN KEY ("hotspot_id") REFERENCES "hotspots"("hotspot_id") ON DELETE RESTRICT ON UPDATE CASCADE;
