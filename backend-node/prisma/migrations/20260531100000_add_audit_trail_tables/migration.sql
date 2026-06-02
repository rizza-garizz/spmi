CREATE TYPE "ApprovalAction" AS ENUM ('submit', 'approve', 'reject', 'revise');

CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "actorEmail" TEXT,
    "role" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT,
    "entityId" TEXT,
    "method" TEXT,
    "path" TEXT,
    "statusCode" INTEGER,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "before" JSONB,
    "after" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ApprovalWorkflow" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "step" TEXT NOT NULL,
    "ownerRoles" JSONB NOT NULL,
    "nextStep" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApprovalWorkflow_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ApprovalHistory" (
    "id" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "step" TEXT NOT NULL,
    "action" "ApprovalAction" NOT NULL,
    "actorId" TEXT,
    "actorEmail" TEXT,
    "note" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApprovalHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");

CREATE UNIQUE INDEX "ApprovalWorkflow_institutionId_entity_step_key" ON "ApprovalWorkflow"("institutionId", "entity", "step");
CREATE INDEX "ApprovalHistory_entity_entityId_createdAt_idx" ON "ApprovalHistory"("entity", "entityId", "createdAt");
