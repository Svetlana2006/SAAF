-- Restore NGO operational schema objects missing from databases whose
-- baseline migration was recorded as applied without creating these objects.
ALTER TABLE "missions"
    ADD COLUMN IF NOT EXISTS "report_id" TEXT;

ALTER TABLE "mission_volunteers"
    ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'registered';

CREATE TABLE IF NOT EXISTS "ngo_report_offers" (
    "offer_id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "ngo_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'offered',
    "offered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responded_at" TIMESTAMP(3),
    CONSTRAINT "ngo_report_offers_pkey" PRIMARY KEY ("offer_id")
);

CREATE TABLE IF NOT EXISTS "ngo_cost_claims" (
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

CREATE TABLE IF NOT EXISTS "ngo_cost_claim_items" (
    "item_id" TEXT NOT NULL,
    "claim_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "receipt_url" TEXT,
    "cloudinary_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ngo_cost_claim_items_pkey" PRIMARY KEY ("item_id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ngo_report_offers_report_id_ngo_id_key"
    ON "ngo_report_offers"("report_id", "ngo_id");
CREATE INDEX IF NOT EXISTS "ngo_report_offers_ngo_id_status_offered_at_idx"
    ON "ngo_report_offers"("ngo_id", "status", "offered_at");
CREATE INDEX IF NOT EXISTS "ngo_cost_claims_ngo_id_status_submitted_at_idx"
    ON "ngo_cost_claims"("ngo_id", "status", "submitted_at");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'missions_report_id_fkey'
          AND conrelid = 'public.missions'::regclass
    ) THEN
        ALTER TABLE "missions"
            ADD CONSTRAINT "missions_report_id_fkey"
            FOREIGN KEY ("report_id") REFERENCES "reports"("report_id")
            ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'ngo_report_offers_report_id_fkey'
          AND conrelid = 'public.ngo_report_offers'::regclass
    ) THEN
        ALTER TABLE "ngo_report_offers"
            ADD CONSTRAINT "ngo_report_offers_report_id_fkey"
            FOREIGN KEY ("report_id") REFERENCES "reports"("report_id")
            ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'ngo_report_offers_ngo_id_fkey'
          AND conrelid = 'public.ngo_report_offers'::regclass
    ) THEN
        ALTER TABLE "ngo_report_offers"
            ADD CONSTRAINT "ngo_report_offers_ngo_id_fkey"
            FOREIGN KEY ("ngo_id") REFERENCES "ngos"("ngo_id")
            ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'ngo_cost_claims_mission_id_fkey'
          AND conrelid = 'public.ngo_cost_claims'::regclass
    ) THEN
        ALTER TABLE "ngo_cost_claims"
            ADD CONSTRAINT "ngo_cost_claims_mission_id_fkey"
            FOREIGN KEY ("mission_id") REFERENCES "missions"("mission_id")
            ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'ngo_cost_claims_ngo_id_fkey'
          AND conrelid = 'public.ngo_cost_claims'::regclass
    ) THEN
        ALTER TABLE "ngo_cost_claims"
            ADD CONSTRAINT "ngo_cost_claims_ngo_id_fkey"
            FOREIGN KEY ("ngo_id") REFERENCES "ngos"("ngo_id")
            ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'ngo_cost_claim_items_claim_id_fkey'
          AND conrelid = 'public.ngo_cost_claim_items'::regclass
    ) THEN
        ALTER TABLE "ngo_cost_claim_items"
            ADD CONSTRAINT "ngo_cost_claim_items_claim_id_fkey"
            FOREIGN KEY ("claim_id") REFERENCES "ngo_cost_claims"("claim_id")
            ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;
