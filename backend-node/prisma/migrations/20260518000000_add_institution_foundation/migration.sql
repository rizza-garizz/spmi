-- CreateTable
CREATE TABLE "Institution" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "systemName" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "configuration" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Institution_pkey" PRIMARY KEY ("id")
);

-- Seed a default institution for existing single-campus data.
INSERT INTO "Institution" ("id", "code", "name", "systemName", "academicYear", "configuration", "updatedAt")
VALUES (
    'inst-default',
    'DEFAULT',
    'Universitas Junrejo Nusantara',
    'SPMI Command Center',
    '2026/2027',
    '{"locale":"id-ID","timezone":"Asia/Jakarta"}',
    CURRENT_TIMESTAMP
);

-- AlterTable
ALTER TABLE "User" ADD COLUMN "institutionId" TEXT;
ALTER TABLE "OrgUnit" ADD COLUMN "institutionId" TEXT;
ALTER TABLE "OrgUnit" ADD COLUMN "parentId" TEXT;
ALTER TABLE "MutuStandard" ADD COLUMN "institutionId" TEXT;
ALTER TABLE "SystemSetting" ADD COLUMN "institutionId" TEXT;

-- Backfill existing rows.
UPDATE "User" SET "institutionId" = 'inst-default' WHERE "institutionId" IS NULL;
UPDATE "OrgUnit" SET "institutionId" = 'inst-default' WHERE "institutionId" IS NULL;
UPDATE "MutuStandard" SET "institutionId" = 'inst-default' WHERE "institutionId" IS NULL;
UPDATE "SystemSetting" SET "institutionId" = 'inst-default' WHERE "institutionId" IS NULL;

-- Make new columns required after backfill.
ALTER TABLE "User" ALTER COLUMN "institutionId" SET NOT NULL;
ALTER TABLE "OrgUnit" ALTER COLUMN "institutionId" SET NOT NULL;
ALTER TABLE "MutuStandard" ALTER COLUMN "institutionId" SET NOT NULL;
ALTER TABLE "SystemSetting" ALTER COLUMN "institutionId" SET NOT NULL;

-- Replace global uniqueness with per-institution uniqueness.
DROP INDEX "OrgUnit_code_key";
CREATE UNIQUE INDEX "Institution_code_key" ON "Institution"("code");
CREATE UNIQUE INDEX "OrgUnit_institutionId_code_key" ON "OrgUnit"("institutionId", "code");
CREATE UNIQUE INDEX "SystemSetting_institutionId_key" ON "SystemSetting"("institutionId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrgUnit" ADD CONSTRAINT "OrgUnit_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrgUnit" ADD CONSTRAINT "OrgUnit_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "OrgUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MutuStandard" ADD CONSTRAINT "MutuStandard_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SystemSetting" ADD CONSTRAINT "SystemSetting_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
