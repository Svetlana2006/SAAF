ALTER TABLE "citizens"
    ADD COLUMN "supabase_user_id" TEXT;

CREATE UNIQUE INDEX "citizens_supabase_user_id_key"
    ON "citizens"("supabase_user_id");

ALTER TABLE "reports"
    ADD COLUMN "is_anonymous" BOOLEAN NOT NULL DEFAULT true;
