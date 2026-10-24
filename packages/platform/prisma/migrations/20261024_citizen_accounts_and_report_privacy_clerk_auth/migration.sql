ALTER TABLE "citizens"
    ADD COLUMN "clerk_user_id" TEXT;

CREATE UNIQUE INDEX "citizens_clerk_user_id_key"
    ON "citizens"("clerk_user_id");
