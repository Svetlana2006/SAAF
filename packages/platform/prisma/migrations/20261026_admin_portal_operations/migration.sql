-- Additive Admin audit, announcement, and human evidence review fields.
-- Preserve current verification state when initializing the explicit status.
ALTER TABLE "evidences"
  ADD COLUMN IF NOT EXISTS "verification_status" TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS "reviewed_by" TEXT,
  ADD COLUMN IF NOT EXISTS "reviewed_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "review_reason" TEXT;

UPDATE "evidences"
SET "verification_status" = 'approved'
WHERE "verified" = TRUE AND "verification_status" = 'pending';

CREATE TABLE IF NOT EXISTS "admin_audit_events" (
  "audit_id" TEXT NOT NULL,
  "actor_user_id" TEXT NOT NULL,
  "action_type" TEXT NOT NULL,
  "record_type" TEXT NOT NULL,
  "record_id" TEXT NOT NULL,
  "previous_value" JSONB,
  "new_value" JSONB,
  "note" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "admin_audit_events_pkey" PRIMARY KEY ("audit_id")
);
CREATE INDEX IF NOT EXISTS "admin_audit_events_record_type_record_id_created_at_idx"
  ON "admin_audit_events"("record_type", "record_id", "created_at");
CREATE INDEX IF NOT EXISTS "admin_audit_events_actor_user_id_created_at_idx"
  ON "admin_audit_events"("actor_user_id", "created_at");

CREATE TABLE IF NOT EXISTS "announcements" (
  "announcement_id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "audience" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "created_by" TEXT NOT NULL,
  "updated_by" TEXT NOT NULL,
  "published_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "announcements_pkey" PRIMARY KEY ("announcement_id")
);
CREATE INDEX IF NOT EXISTS "announcements_status_audience_published_at_idx"
  ON "announcements"("status", "audience", "published_at");
