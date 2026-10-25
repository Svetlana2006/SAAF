-- Restore the optional progress field used by the NGO mission activity view.
ALTER TABLE "mission_activities"
    ADD COLUMN IF NOT EXISTS "progress_percent" INTEGER;
