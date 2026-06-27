-- Role enum migration: USER -> VOLUNTEER, MANAGEMENT -> SUPERVISOR
CREATE TYPE "Role_new" AS ENUM ('FAMILY', 'VOLUNTEER', 'SUPERVISOR', 'POLICE');
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING (
  CASE "role"::text
    WHEN 'USER' THEN 'VOLUNTEER'::"Role_new"
    WHEN 'MANAGEMENT' THEN 'SUPERVISOR'::"Role_new"
    ELSE 'VOLUNTEER'::"Role_new"
  END
);
DROP TYPE "Role";
ALTER TYPE "Role_new" RENAME TO "Role";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'VOLUNTEER'::"Role";

-- CreateEnum
CREATE TYPE "CaseType" AS ENUM ('MISSING', 'FOUND');
CREATE TYPE "CaseStatus" AS ENUM ('OPEN', 'MATCH_PENDING', 'RESOLVED', 'TRANSFERRED', 'UNRESOLVED', 'DUPLICATE');
CREATE TYPE "MatchStatus" AS ENUM ('SUGGESTED', 'APPROVED', 'REJECTED');
CREATE TYPE "MediaKind" AS ENUM ('PHOTO', 'VIDEO', 'AUDIO');
CREATE TYPE "MelaLocationCategory" AS ENUM ('TRAFFIC_CHOKE', 'NO_VEHICLE_ZONE', 'TRANSFER_NODE', 'PARKING', 'OUTER_PARKING', 'PARKING_BELT');

-- CreateTable
CREATE TABLE "Zone" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "centroidLat" DOUBLE PRECISION NOT NULL,
    "centroidLng" DOUBLE PRECISION NOT NULL,
    "boundaryPointCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Zone_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CctvLocation" (
    "id" TEXT NOT NULL,
    "cameraId" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "zoneId" TEXT NOT NULL,
    CONSTRAINT "CctvLocation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PoliceStation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    CONSTRAINT "PoliceStation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MelaLocation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "MelaLocationCategory" NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    CONSTRAINT "MelaLocation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Case" (
    "id" TEXT NOT NULL,
    "caseRef" TEXT NOT NULL,
    "type" "CaseType" NOT NULL,
    "status" "CaseStatus" NOT NULL DEFAULT 'OPEN',
    "zoneId" TEXT,
    "personName" TEXT,
    "ageBand" TEXT,
    "gender" TEXT,
    "language" TEXT,
    "state" TEXT,
    "district" TEXT,
    "physicalDescription" TEXT,
    "lastSeenText" TEXT,
    "lastSeenAt" TIMESTAMP(3),
    "reportingCenter" TEXT,
    "reporterPhone" TEXT,
    "isDuplicate" BOOLEAN NOT NULL DEFAULT false,
    "duplicateOfId" TEXT,
    "resolutionHours" DOUBLE PRECISION,
    "remarks" TEXT,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reporterId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Case_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CaseMedia" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "s3Key" TEXT NOT NULL,
    "cdnUrl" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "kind" "MediaKind" NOT NULL DEFAULT 'PHOTO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CaseMedia_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "missingCaseId" TEXT NOT NULL,
    "foundCaseId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "status" "MatchStatus" NOT NULL DEFAULT 'SUGGESTED',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Reunification" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "matchId" TEXT,
    "verifiedById" TEXT NOT NULL,
    "resolvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    CONSTRAINT "Reunification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VolunteerAssignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    CONSTRAINT "VolunteerAssignment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Zone_code_key" ON "Zone"("code");
CREATE UNIQUE INDEX "CctvLocation_cameraId_key" ON "CctvLocation"("cameraId");
CREATE INDEX "CctvLocation_zoneId_idx" ON "CctvLocation"("zoneId");
CREATE UNIQUE INDEX "PoliceStation_name_key" ON "PoliceStation"("name");
CREATE INDEX "MelaLocation_category_idx" ON "MelaLocation"("category");
CREATE UNIQUE INDEX "MelaLocation_name_category_key" ON "MelaLocation"("name", "category");
CREATE UNIQUE INDEX "Case_caseRef_key" ON "Case"("caseRef");
CREATE INDEX "Case_type_status_zoneId_idx" ON "Case"("type", "status", "zoneId");
CREATE INDEX "Case_reportingCenter_idx" ON "Case"("reportingCenter");
CREATE INDEX "Case_status_idx" ON "Case"("status");
CREATE INDEX "Case_personName_idx" ON "Case"("personName");
CREATE INDEX "CaseMedia_caseId_idx" ON "CaseMedia"("caseId");
CREATE INDEX "Match_status_idx" ON "Match"("status");
CREATE UNIQUE INDEX "Match_missingCaseId_foundCaseId_key" ON "Match"("missingCaseId", "foundCaseId");
CREATE UNIQUE INDEX "VolunteerAssignment_userId_key" ON "VolunteerAssignment"("userId");
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "CctvLocation" ADD CONSTRAINT "CctvLocation_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Case" ADD CONSTRAINT "Case_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Case" ADD CONSTRAINT "Case_duplicateOfId_fkey" FOREIGN KEY ("duplicateOfId") REFERENCES "Case"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Case" ADD CONSTRAINT "Case_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CaseMedia" ADD CONSTRAINT "CaseMedia_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Match" ADD CONSTRAINT "Match_missingCaseId_fkey" FOREIGN KEY ("missingCaseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Match" ADD CONSTRAINT "Match_foundCaseId_fkey" FOREIGN KEY ("foundCaseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Match" ADD CONSTRAINT "Match_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Reunification" ADD CONSTRAINT "Reunification_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Reunification" ADD CONSTRAINT "Reunification_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Reunification" ADD CONSTRAINT "Reunification_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VolunteerAssignment" ADD CONSTRAINT "VolunteerAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VolunteerAssignment" ADD CONSTRAINT "VolunteerAssignment_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
