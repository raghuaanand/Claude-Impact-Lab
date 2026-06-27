-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATED', 'UPDATED', 'DELETED', 'STATUS_CHANGED', 'MATCH_SUGGESTED', 'MATCH_CONFIRMED', 'MATCH_REJECTED');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('MISSING_REPORT', 'FOUND_REPORT', 'MATCH_SUGGESTION');

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "postalCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MissingReport" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "personName" TEXT NOT NULL,
    "age" INTEGER,
    "gender" "Gender" NOT NULL DEFAULT 'UNKNOWN',
    "description" TEXT,
    "lastSeenAt" TIMESTAMP(3),
    "locationId" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
    "contactName" TEXT,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MissingReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoundReport" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "age" INTEGER,
    "gender" "Gender" NOT NULL DEFAULT 'UNKNOWN',
    "description" TEXT,
    "foundAt" TIMESTAMP(3),
    "locationId" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
    "contactName" TEXT,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FoundReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportImage" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "missingReportId" TEXT,
    "foundReportId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportAudio" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "durationSeconds" INTEGER,
    "missingReportId" TEXT,
    "foundReportId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportAudio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchSuggestion" (
    "id" TEXT NOT NULL,
    "missingReportId" TEXT NOT NULL,
    "foundReportId" TEXT NOT NULL,
    "score" DOUBLE PRECISION,
    "status" "MatchStatus" NOT NULL DEFAULT 'PENDING',
    "suggestedById" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatchSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" "AuditAction" NOT NULL,
    "entityType" "EntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "missingReportId" TEXT,
    "foundReportId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Location_latitude_longitude_idx" ON "Location"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "Location_city_state_country_idx" ON "Location"("city", "state", "country");

-- CreateIndex
CREATE INDEX "MissingReport_status_idx" ON "MissingReport"("status");

-- CreateIndex
CREATE INDEX "MissingReport_reporterId_idx" ON "MissingReport"("reporterId");

-- CreateIndex
CREATE INDEX "MissingReport_locationId_idx" ON "MissingReport"("locationId");

-- CreateIndex
CREATE INDEX "MissingReport_lastSeenAt_idx" ON "MissingReport"("lastSeenAt");

-- CreateIndex
CREATE INDEX "MissingReport_personName_idx" ON "MissingReport"("personName");

-- CreateIndex
CREATE INDEX "FoundReport_status_idx" ON "FoundReport"("status");

-- CreateIndex
CREATE INDEX "FoundReport_reporterId_idx" ON "FoundReport"("reporterId");

-- CreateIndex
CREATE INDEX "FoundReport_locationId_idx" ON "FoundReport"("locationId");

-- CreateIndex
CREATE INDEX "FoundReport_foundAt_idx" ON "FoundReport"("foundAt");

-- CreateIndex
CREATE INDEX "ReportImage_missingReportId_idx" ON "ReportImage"("missingReportId");

-- CreateIndex
CREATE INDEX "ReportImage_foundReportId_idx" ON "ReportImage"("foundReportId");

-- CreateIndex
CREATE INDEX "ReportAudio_missingReportId_idx" ON "ReportAudio"("missingReportId");

-- CreateIndex
CREATE INDEX "ReportAudio_foundReportId_idx" ON "ReportAudio"("foundReportId");

-- CreateIndex
CREATE UNIQUE INDEX "MatchSuggestion_missingReportId_foundReportId_key" ON "MatchSuggestion"("missingReportId", "foundReportId");

-- CreateIndex
CREATE INDEX "MatchSuggestion_status_idx" ON "MatchSuggestion"("status");

-- CreateIndex
CREATE INDEX "MatchSuggestion_missingReportId_idx" ON "MatchSuggestion"("missingReportId");

-- CreateIndex
CREATE INDEX "MatchSuggestion_foundReportId_idx" ON "MatchSuggestion"("foundReportId");

-- CreateIndex
CREATE INDEX "MatchSuggestion_suggestedById_idx" ON "MatchSuggestion"("suggestedById");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_missingReportId_idx" ON "AuditLog"("missingReportId");

-- CreateIndex
CREATE INDEX "AuditLog_foundReportId_idx" ON "AuditLog"("foundReportId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "MissingReport" ADD CONSTRAINT "MissingReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissingReport" ADD CONSTRAINT "MissingReport_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoundReport" ADD CONSTRAINT "FoundReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoundReport" ADD CONSTRAINT "FoundReport_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportImage" ADD CONSTRAINT "ReportImage_missingReportId_fkey" FOREIGN KEY ("missingReportId") REFERENCES "MissingReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportImage" ADD CONSTRAINT "ReportImage_foundReportId_fkey" FOREIGN KEY ("foundReportId") REFERENCES "FoundReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportAudio" ADD CONSTRAINT "ReportAudio_missingReportId_fkey" FOREIGN KEY ("missingReportId") REFERENCES "MissingReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportAudio" ADD CONSTRAINT "ReportAudio_foundReportId_fkey" FOREIGN KEY ("foundReportId") REFERENCES "FoundReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchSuggestion" ADD CONSTRAINT "MatchSuggestion_missingReportId_fkey" FOREIGN KEY ("missingReportId") REFERENCES "MissingReport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchSuggestion" ADD CONSTRAINT "MatchSuggestion_foundReportId_fkey" FOREIGN KEY ("foundReportId") REFERENCES "FoundReport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchSuggestion" ADD CONSTRAINT "MatchSuggestion_suggestedById_fkey" FOREIGN KEY ("suggestedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchSuggestion" ADD CONSTRAINT "MatchSuggestion_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_missingReportId_fkey" FOREIGN KEY ("missingReportId") REFERENCES "MissingReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_foundReportId_fkey" FOREIGN KEY ("foundReportId") REFERENCES "FoundReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;
