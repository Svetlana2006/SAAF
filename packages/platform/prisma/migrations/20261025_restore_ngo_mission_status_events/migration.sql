-- Restore the mission audit relation required by NGO mission reads and updates.
CREATE TABLE IF NOT EXISTS "mission_status_events" (
    "event_id" TEXT NOT NULL,
    "mission_id" TEXT NOT NULL,
    "membership_id" TEXT,
    "from_status" TEXT,
    "to_status" TEXT NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "mission_status_events_pkey" PRIMARY KEY ("event_id")
);

CREATE INDEX IF NOT EXISTS "mission_status_events_mission_id_created_at_idx"
    ON "mission_status_events"("mission_id", "created_at");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'mission_status_events_mission_id_fkey'
          AND conrelid = 'public.mission_status_events'::regclass
    ) THEN
        ALTER TABLE "mission_status_events"
            ADD CONSTRAINT "mission_status_events_mission_id_fkey"
            FOREIGN KEY ("mission_id") REFERENCES "missions"("mission_id")
            ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'mission_status_events_membership_id_fkey'
          AND conrelid = 'public.mission_status_events'::regclass
    ) THEN
        ALTER TABLE "mission_status_events"
            ADD CONSTRAINT "mission_status_events_membership_id_fkey"
            FOREIGN KEY ("membership_id") REFERENCES "ngo_memberships"("membership_id")
            ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
