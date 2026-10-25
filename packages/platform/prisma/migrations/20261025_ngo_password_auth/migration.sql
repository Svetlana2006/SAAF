ALTER TABLE "ngo_memberships"
    ALTER COLUMN "supabase_user_id" DROP NOT NULL,
    ADD COLUMN IF NOT EXISTS "login_email" TEXT,
    ADD COLUMN IF NOT EXISTS "password_hash" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "ngo_memberships_login_email_key"
    ON "ngo_memberships"("login_email");

CREATE UNIQUE INDEX IF NOT EXISTS "ngo_memberships_supabase_user_id_ngo_id_key"
    ON "ngo_memberships"("supabase_user_id", "ngo_id");
