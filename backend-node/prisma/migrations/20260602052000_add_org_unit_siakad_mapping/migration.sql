ALTER TABLE "OrgUnit"
ADD COLUMN IF NOT EXISTS "siakadCode" TEXT,
ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS "syncStatus" TEXT NOT NULL DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS "lastSyncedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "metadata" JSONB;

CREATE INDEX IF NOT EXISTS "OrgUnit_institutionId_siakadCode_idx" ON "OrgUnit"("institutionId", "siakadCode");
CREATE INDEX IF NOT EXISTS "OrgUnit_institutionId_source_syncStatus_idx" ON "OrgUnit"("institutionId", "source", "syncStatus");
