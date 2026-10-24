-- Additive migration: preserve the legacy primary photo URL while storing every
-- uploaded report image as a related row. The FK cascade only applies when a
-- report is intentionally deleted by an authorized database operation.
CREATE TABLE "report_images" (
    "image_id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "photo_url" TEXT NOT NULL,
    "cloudinary_id" TEXT,
    "purpose" TEXT NOT NULL DEFAULT 'report',
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "report_images_pkey" PRIMARY KEY ("image_id")
);

CREATE INDEX "report_images_report_id_uploaded_at_idx"
    ON "report_images"("report_id", "uploaded_at");

ALTER TABLE "report_images"
    ADD CONSTRAINT "report_images_report_id_fkey"
    FOREIGN KEY ("report_id") REFERENCES "reports"("report_id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Prevent duplicate mission signup/assignment for the same volunteer. Check
-- for pre-existing duplicate pairs before applying this index; this migration
-- intentionally does not delete or rewrite existing data.
CREATE UNIQUE INDEX "mission_volunteers_mission_id_volunteer_id_key"
    ON "mission_volunteers"("mission_id", "volunteer_id");
