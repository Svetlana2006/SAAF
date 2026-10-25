CREATE TABLE IF NOT EXISTS "ngo_memberships" (
    "membership_id" TEXT NOT NULL,
    "supabase_user_id" TEXT NOT NULL,
    "ngo_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'field_staff',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ngo_memberships_pkey" PRIMARY KEY ("membership_id")
);

CREATE INDEX IF NOT EXISTS "ngo_memberships_supabase_user_id_is_active_idx"
    ON "ngo_memberships"("supabase_user_id", "is_active");

CREATE UNIQUE INDEX IF NOT EXISTS "ngo_memberships_supabase_user_id_ngo_id_key"
    ON "ngo_memberships"("supabase_user_id", "ngo_id");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'ngo_memberships_ngo_id_fkey'
          AND conrelid = 'public.ngo_memberships'::regclass
    ) THEN
        ALTER TABLE "ngo_memberships"
            ADD CONSTRAINT "ngo_memberships_ngo_id_fkey"
            FOREIGN KEY ("ngo_id") REFERENCES "ngos"("ngo_id")
            ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;
