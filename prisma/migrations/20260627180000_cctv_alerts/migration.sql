-- CreateEnum
CREATE TYPE "CctvAlertStatus" AS ENUM ('PENDING', 'SENT', 'ACKNOWLEDGED', 'REVIEWED', 'CANCELLED');

-- CreateTable
CREATE TABLE "CctvAlert" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "cctvLocationId" TEXT NOT NULL,
    "status" "CctvAlertStatus" NOT NULL DEFAULT 'PENDING',
    "distanceMeters" DOUBLE PRECISION NOT NULL,
    "message" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CctvAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CctvAlert_caseId_cctvLocationId_key" ON "CctvAlert"("caseId", "cctvLocationId");
CREATE INDEX "CctvAlert_caseId_idx" ON "CctvAlert"("caseId");
CREATE INDEX "CctvAlert_cctvLocationId_idx" ON "CctvAlert"("cctvLocationId");
CREATE INDEX "CctvAlert_status_idx" ON "CctvAlert"("status");

-- AddForeignKey
ALTER TABLE "CctvAlert" ADD CONSTRAINT "CctvAlert_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CctvAlert" ADD CONSTRAINT "CctvAlert_cctvLocationId_fkey" FOREIGN KEY ("cctvLocationId") REFERENCES "CctvLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
