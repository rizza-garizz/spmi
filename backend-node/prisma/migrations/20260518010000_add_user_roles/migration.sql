-- CreateTable
CREATE TABLE "UserRole" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "scopeOrgUnitId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

-- Backfill one role assignment for every existing user.
INSERT INTO "UserRole" ("id", "userId", "role", "scopeOrgUnitId", "updatedAt")
SELECT
    'ur-' || "id",
    "id",
    "role",
    "orgUnitId",
    CURRENT_TIMESTAMP
FROM "User";

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_userId_role_scopeOrgUnitId_key" ON "UserRole"("userId", "role", "scopeOrgUnitId");

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_scopeOrgUnitId_fkey" FOREIGN KEY ("scopeOrgUnitId") REFERENCES "OrgUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
