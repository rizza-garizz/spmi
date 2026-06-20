DO $$ BEGIN
  CREATE TYPE "AccreditationStatus" AS ENUM ('draft', 'berjalan', 'review', 'final', 'selesai');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "AccreditationScopeType" AS ENUM ('APT', 'APS');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "AccreditationInstrument" (
  "id" TEXT NOT NULL,
  "institutionId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "agency" TEXT NOT NULL,
  "level" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'aktif',
  "criteriaCount" INTEGER NOT NULL DEFAULT 0,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "AccreditationInstrument_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AccreditationCriterion" (
  "id" TEXT NOT NULL,
  "instrumentId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "weight" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "evidenceRequired" INTEGER NOT NULL DEFAULT 0,
  "standardCodes" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "AccreditationCriterion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AccreditationPeriod" (
  "id" TEXT NOT NULL,
  "institutionId" TEXT NOT NULL,
  "instrumentId" TEXT NOT NULL,
  "orgUnitId" TEXT,
  "createdById" TEXT,
  "name" TEXT NOT NULL,
  "scopeType" "AccreditationScopeType" NOT NULL,
  "agency" TEXT NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL,
  "dueDate" TIMESTAMP(3),
  "status" "AccreditationStatus" NOT NULL DEFAULT 'draft',
  "progress" INTEGER NOT NULL DEFAULT 0,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "AccreditationPeriod_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AccreditationAssessment" (
  "id" TEXT NOT NULL,
  "periodId" TEXT NOT NULL,
  "orgUnitId" TEXT,
  "lkpsProgress" INTEGER NOT NULL DEFAULT 0,
  "ledProgress" INTEGER NOT NULL DEFAULT 0,
  "evidenceProgress" INTEGER NOT NULL DEFAULT 0,
  "reviewProgress" INTEGER NOT NULL DEFAULT 0,
  "readinessStatus" TEXT NOT NULL DEFAULT 'risk',
  "scoreProjection" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "predicateProjection" TEXT,
  "riskLevel" TEXT NOT NULL DEFAULT 'merah',
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "AccreditationAssessment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AccreditationTeamMember" (
  "id" TEXT NOT NULL,
  "periodId" TEXT NOT NULL,
  "userId" TEXT,
  "name" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "responsibility" TEXT,
  "email" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "AccreditationTeamMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AccreditationTask" (
  "id" TEXT NOT NULL,
  "periodId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'UMUM',
  "assignee" TEXT,
  "priority" TEXT NOT NULL DEFAULT 'medium',
  "status" TEXT NOT NULL DEFAULT 'todo',
  "dueDate" TIMESTAMP(3),
  "progress" INTEGER NOT NULL DEFAULT 0,
  "notes" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "AccreditationTask_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AccreditationMilestone" (
  "id" TEXT NOT NULL,
  "periodId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "phase" TEXT NOT NULL DEFAULT 'persiapan',
  "owner" TEXT,
  "startDate" TIMESTAMP(3),
  "dueDate" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'planned',
  "progress" INTEGER NOT NULL DEFAULT 0,
  "notes" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "AccreditationMilestone_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AccreditationRisk" (
  "id" TEXT NOT NULL,
  "periodId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'umum',
  "owner" TEXT,
  "probability" INTEGER NOT NULL DEFAULT 1,
  "impact" INTEGER NOT NULL DEFAULT 1,
  "level" TEXT NOT NULL DEFAULT 'low',
  "status" TEXT NOT NULL DEFAULT 'open',
  "mitigation" TEXT,
  "dueDate" TIMESTAMP(3),
  "notes" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "AccreditationRisk_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AccreditationEvidence" (
  "id" TEXT NOT NULL,
  "periodId" TEXT NOT NULL,
  "criterionId" TEXT,
  "lkpsEntryId" TEXT,
  "ledContentId" TEXT,
  "title" TEXT NOT NULL,
  "sourceModule" TEXT,
  "documentId" TEXT,
  "fileName" TEXT,
  "fileUrl" TEXT,
  "notes" TEXT,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "AccreditationEvidence_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AccreditationLkpsSection" (
  "id" TEXT NOT NULL,
  "criterionId" TEXT,
  "code" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "sourceModule" TEXT,
  "requiredFields" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "AccreditationLkpsSection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AccreditationLkpsEntry" (
  "id" TEXT NOT NULL,
  "periodId" TEXT NOT NULL,
  "sectionId" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "value" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "unit" TEXT,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "sourceModule" TEXT,
  "notes" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "AccreditationLkpsEntry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AccreditationLedSection" (
  "id" TEXT NOT NULL,
  "criterionId" TEXT,
  "title" TEXT NOT NULL,
  "guidance" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "AccreditationLedSection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AccreditationLedContent" (
  "id" TEXT NOT NULL,
  "periodId" TEXT NOT NULL,
  "sectionId" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "content" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "reviewerNote" TEXT,
  "updatedBy" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "AccreditationLedContent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AccreditationSelfScore" (
  "id" TEXT NOT NULL,
  "periodId" TEXT NOT NULL,
  "criterionId" TEXT NOT NULL,
  "score" DOUBLE PRECISION NOT NULL,
  "targetScore" DOUBLE PRECISION NOT NULL DEFAULT 4,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "gapNote" TEXT,
  "recommendation" TEXT,
  "reviewer" TEXT,
  "note" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "AccreditationSelfScore_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AccreditationActionPlan" (
  "id" TEXT NOT NULL,
  "periodId" TEXT NOT NULL,
  "criteriaCode" TEXT,
  "title" TEXT NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'self_score',
  "owner" TEXT,
  "priority" TEXT NOT NULL DEFAULT 'medium',
  "status" TEXT NOT NULL DEFAULT 'todo',
  "targetDate" TIMESTAMP(3),
  "progress" INTEGER NOT NULL DEFAULT 0,
  "action" TEXT,
  "expectedOutput" TEXT,
  "notes" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "AccreditationActionPlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AccreditationReview" (
  "id" TEXT NOT NULL,
  "periodId" TEXT NOT NULL,
  "entityType" TEXT,
  "entityId" TEXT,
  "reviewer" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "decision" TEXT,
  "note" TEXT,
  "dueDate" TIMESTAMP(3),
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "AccreditationReview_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AccreditationSubmissionCheck" (
  "id" TEXT NOT NULL,
  "periodId" TEXT NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'UMUM',
  "title" TEXT NOT NULL,
  "owner" TEXT,
  "verifier" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "dueDate" TIMESTAMP(3),
  "evidenceId" TEXT,
  "notes" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "AccreditationSubmissionCheck_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AccreditationExport" (
  "id" TEXT NOT NULL,
  "periodId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'generated',
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "AccreditationExport_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AccreditationInstrument_institutionId_code_key" ON "AccreditationInstrument"("institutionId", "code");
CREATE INDEX IF NOT EXISTS "AccreditationInstrument_institutionId_agency_status_idx" ON "AccreditationInstrument"("institutionId", "agency", "status");
CREATE UNIQUE INDEX IF NOT EXISTS "AccreditationCriterion_instrumentId_code_key" ON "AccreditationCriterion"("instrumentId", "code");
CREATE INDEX IF NOT EXISTS "AccreditationCriterion_instrumentId_idx" ON "AccreditationCriterion"("instrumentId");
CREATE INDEX IF NOT EXISTS "AccreditationPeriod_institutionId_status_dueDate_idx" ON "AccreditationPeriod"("institutionId", "status", "dueDate");
CREATE INDEX IF NOT EXISTS "AccreditationPeriod_orgUnitId_status_idx" ON "AccreditationPeriod"("orgUnitId", "status");
CREATE INDEX IF NOT EXISTS "AccreditationAssessment_periodId_idx" ON "AccreditationAssessment"("periodId");
CREATE INDEX IF NOT EXISTS "AccreditationAssessment_orgUnitId_readinessStatus_idx" ON "AccreditationAssessment"("orgUnitId", "readinessStatus");
CREATE UNIQUE INDEX IF NOT EXISTS "AccreditationTeamMember_periodId_email_key" ON "AccreditationTeamMember"("periodId", "email");
CREATE INDEX IF NOT EXISTS "AccreditationTeamMember_periodId_role_idx" ON "AccreditationTeamMember"("periodId", "role");
CREATE INDEX IF NOT EXISTS "AccreditationTask_periodId_status_idx" ON "AccreditationTask"("periodId", "status");
CREATE INDEX IF NOT EXISTS "AccreditationTask_assignee_dueDate_idx" ON "AccreditationTask"("assignee", "dueDate");
CREATE INDEX IF NOT EXISTS "AccreditationTask_category_priority_idx" ON "AccreditationTask"("category", "priority");
CREATE INDEX IF NOT EXISTS "AccreditationMilestone_periodId_status_idx" ON "AccreditationMilestone"("periodId", "status");
CREATE INDEX IF NOT EXISTS "AccreditationMilestone_phase_dueDate_idx" ON "AccreditationMilestone"("phase", "dueDate");
CREATE INDEX IF NOT EXISTS "AccreditationMilestone_owner_dueDate_idx" ON "AccreditationMilestone"("owner", "dueDate");
CREATE INDEX IF NOT EXISTS "AccreditationRisk_periodId_status_idx" ON "AccreditationRisk"("periodId", "status");
CREATE INDEX IF NOT EXISTS "AccreditationRisk_level_dueDate_idx" ON "AccreditationRisk"("level", "dueDate");
CREATE INDEX IF NOT EXISTS "AccreditationRisk_owner_dueDate_idx" ON "AccreditationRisk"("owner", "dueDate");
CREATE INDEX IF NOT EXISTS "AccreditationRisk_category_level_idx" ON "AccreditationRisk"("category", "level");
CREATE INDEX IF NOT EXISTS "AccreditationEvidence_periodId_status_idx" ON "AccreditationEvidence"("periodId", "status");
CREATE INDEX IF NOT EXISTS "AccreditationEvidence_criterionId_idx" ON "AccreditationEvidence"("criterionId");
CREATE INDEX IF NOT EXISTS "AccreditationEvidence_lkpsEntryId_idx" ON "AccreditationEvidence"("lkpsEntryId");
CREATE INDEX IF NOT EXISTS "AccreditationEvidence_ledContentId_idx" ON "AccreditationEvidence"("ledContentId");
CREATE UNIQUE INDEX IF NOT EXISTS "AccreditationLkpsSection_code_key" ON "AccreditationLkpsSection"("code");
CREATE INDEX IF NOT EXISTS "AccreditationLkpsSection_criterionId_idx" ON "AccreditationLkpsSection"("criterionId");
CREATE UNIQUE INDEX IF NOT EXISTS "AccreditationLkpsEntry_periodId_sectionId_label_key" ON "AccreditationLkpsEntry"("periodId", "sectionId", "label");
CREATE INDEX IF NOT EXISTS "AccreditationLkpsEntry_periodId_status_idx" ON "AccreditationLkpsEntry"("periodId", "status");
CREATE INDEX IF NOT EXISTS "AccreditationLkpsEntry_sectionId_idx" ON "AccreditationLkpsEntry"("sectionId");
CREATE INDEX IF NOT EXISTS "AccreditationLedSection_criterionId_idx" ON "AccreditationLedSection"("criterionId");
CREATE INDEX IF NOT EXISTS "AccreditationLedContent_periodId_sectionId_version_idx" ON "AccreditationLedContent"("periodId", "sectionId", "version");
CREATE INDEX IF NOT EXISTS "AccreditationLedContent_status_idx" ON "AccreditationLedContent"("status");
CREATE UNIQUE INDEX IF NOT EXISTS "AccreditationSelfScore_periodId_criterionId_key" ON "AccreditationSelfScore"("periodId", "criterionId");
CREATE INDEX IF NOT EXISTS "AccreditationSelfScore_criterionId_idx" ON "AccreditationSelfScore"("criterionId");
CREATE INDEX IF NOT EXISTS "AccreditationSelfScore_status_idx" ON "AccreditationSelfScore"("status");
CREATE INDEX IF NOT EXISTS "AccreditationActionPlan_periodId_status_idx" ON "AccreditationActionPlan"("periodId", "status");
CREATE INDEX IF NOT EXISTS "AccreditationActionPlan_criteriaCode_status_idx" ON "AccreditationActionPlan"("criteriaCode", "status");
CREATE INDEX IF NOT EXISTS "AccreditationActionPlan_owner_targetDate_idx" ON "AccreditationActionPlan"("owner", "targetDate");
CREATE INDEX IF NOT EXISTS "AccreditationActionPlan_priority_targetDate_idx" ON "AccreditationActionPlan"("priority", "targetDate");
CREATE INDEX IF NOT EXISTS "AccreditationReview_periodId_status_idx" ON "AccreditationReview"("periodId", "status");
CREATE INDEX IF NOT EXISTS "AccreditationReview_entityType_entityId_idx" ON "AccreditationReview"("entityType", "entityId");
CREATE INDEX IF NOT EXISTS "AccreditationSubmissionCheck_periodId_status_idx" ON "AccreditationSubmissionCheck"("periodId", "status");
CREATE INDEX IF NOT EXISTS "AccreditationSubmissionCheck_category_status_idx" ON "AccreditationSubmissionCheck"("category", "status");
CREATE INDEX IF NOT EXISTS "AccreditationSubmissionCheck_owner_dueDate_idx" ON "AccreditationSubmissionCheck"("owner", "dueDate");
CREATE INDEX IF NOT EXISTS "AccreditationSubmissionCheck_verifier_status_idx" ON "AccreditationSubmissionCheck"("verifier", "status");
CREATE INDEX IF NOT EXISTS "AccreditationExport_periodId_type_createdAt_idx" ON "AccreditationExport"("periodId", "type", "createdAt");

DO $$ BEGIN
  ALTER TABLE "AccreditationInstrument" ADD CONSTRAINT "AccreditationInstrument_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "AccreditationCriterion" ADD CONSTRAINT "AccreditationCriterion_instrumentId_fkey" FOREIGN KEY ("instrumentId") REFERENCES "AccreditationInstrument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "AccreditationPeriod" ADD CONSTRAINT "AccreditationPeriod_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "AccreditationPeriod" ADD CONSTRAINT "AccreditationPeriod_instrumentId_fkey" FOREIGN KEY ("instrumentId") REFERENCES "AccreditationInstrument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "AccreditationPeriod" ADD CONSTRAINT "AccreditationPeriod_orgUnitId_fkey" FOREIGN KEY ("orgUnitId") REFERENCES "OrgUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "AccreditationPeriod" ADD CONSTRAINT "AccreditationPeriod_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN ALTER TABLE "AccreditationAssessment" ADD CONSTRAINT "AccreditationAssessment_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "AccreditationPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "AccreditationAssessment" ADD CONSTRAINT "AccreditationAssessment_orgUnitId_fkey" FOREIGN KEY ("orgUnitId") REFERENCES "OrgUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "AccreditationTeamMember" ADD CONSTRAINT "AccreditationTeamMember_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "AccreditationPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "AccreditationTeamMember" ADD CONSTRAINT "AccreditationTeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "AccreditationTask" ADD CONSTRAINT "AccreditationTask_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "AccreditationPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "AccreditationMilestone" ADD CONSTRAINT "AccreditationMilestone_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "AccreditationPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "AccreditationRisk" ADD CONSTRAINT "AccreditationRisk_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "AccreditationPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "AccreditationEvidence" ADD CONSTRAINT "AccreditationEvidence_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "AccreditationPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "AccreditationEvidence" ADD CONSTRAINT "AccreditationEvidence_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "AccreditationCriterion"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "AccreditationLkpsSection" ADD CONSTRAINT "AccreditationLkpsSection_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "AccreditationCriterion"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "AccreditationLkpsEntry" ADD CONSTRAINT "AccreditationLkpsEntry_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "AccreditationPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "AccreditationLkpsEntry" ADD CONSTRAINT "AccreditationLkpsEntry_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "AccreditationLkpsSection"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "AccreditationLedSection" ADD CONSTRAINT "AccreditationLedSection_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "AccreditationCriterion"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "AccreditationLedContent" ADD CONSTRAINT "AccreditationLedContent_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "AccreditationPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "AccreditationLedContent" ADD CONSTRAINT "AccreditationLedContent_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "AccreditationLedSection"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "AccreditationSelfScore" ADD CONSTRAINT "AccreditationSelfScore_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "AccreditationPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "AccreditationSelfScore" ADD CONSTRAINT "AccreditationSelfScore_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "AccreditationCriterion"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "AccreditationActionPlan" ADD CONSTRAINT "AccreditationActionPlan_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "AccreditationPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "AccreditationReview" ADD CONSTRAINT "AccreditationReview_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "AccreditationPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "AccreditationSubmissionCheck" ADD CONSTRAINT "AccreditationSubmissionCheck_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "AccreditationPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "AccreditationExport" ADD CONSTRAINT "AccreditationExport_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "AccreditationPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
