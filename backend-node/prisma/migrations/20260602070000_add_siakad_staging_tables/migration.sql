CREATE TABLE IF NOT EXISTS "SiakadSyncBatch" (
  "id" TEXT NOT NULL,
  "service" TEXT NOT NULL DEFAULT 'siakad',
  "entity" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'preview',
  "summary" JSONB,
  "conflictCount" INTEGER NOT NULL DEFAULT 0,
  "createdByEmail" TEXT,
  "committedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SiakadSyncBatch_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SiakadOrgUnitStaging" (
  "id" TEXT NOT NULL,
  "batchId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "siakadCode" TEXT,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "parentCode" TEXT,
  "action" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ready',
  "conflictType" TEXT,
  "conflictNote" TEXT,
  "incoming" JSONB NOT NULL,
  "current" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SiakadOrgUnitStaging_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SiakadSyncBatch_service_entity_createdAt_idx" ON "SiakadSyncBatch"("service", "entity", "createdAt");
CREATE INDEX IF NOT EXISTS "SiakadSyncBatch_status_createdAt_idx" ON "SiakadSyncBatch"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "SiakadOrgUnitStaging_batchId_idx" ON "SiakadOrgUnitStaging"("batchId");
CREATE INDEX IF NOT EXISTS "SiakadOrgUnitStaging_code_idx" ON "SiakadOrgUnitStaging"("code");
CREATE INDEX IF NOT EXISTS "SiakadOrgUnitStaging_status_conflictType_idx" ON "SiakadOrgUnitStaging"("status", "conflictType");

DO $$ BEGIN
  ALTER TABLE "SiakadOrgUnitStaging"
  ADD CONSTRAINT "SiakadOrgUnitStaging_batchId_fkey"
  FOREIGN KEY ("batchId") REFERENCES "SiakadSyncBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
