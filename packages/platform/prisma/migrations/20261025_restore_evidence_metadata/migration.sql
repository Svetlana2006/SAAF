-- Restore metadata columns used by NGO evidence upload and display queries.
ALTER TABLE "evidences"
    ADD COLUMN IF NOT EXISTS "cloudinary_id" TEXT,
    ADD COLUMN IF NOT EXISTS "description" TEXT;
