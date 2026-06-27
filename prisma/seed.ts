import { PrismaClient, Role, ReportStatus, Gender, MatchStatus, AuditAction, EntityType } from "../app/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  // Volunteer user
  const volunteer = await prisma.user.upsert({
    where: { email: "volunteer@khummela.org" },
    update: {},
    create: {
      name: "Priya Sharma",
      email: "volunteer@khummela.org",
      role: Role.USER,
    },
  });

  // Management user
  const coordinator = await prisma.user.upsert({
    where: { email: "coord@khummela.org" },
    update: {},
    create: {
      name: "Ravi Coordinator",
      email: "coord@khummela.org",
      role: Role.MANAGEMENT,
    },
  });

  // Locations
  const locationMissing = await prisma.location.create({
    data: {
      address: "Lal Chowk, Srinagar",
      city: "Srinagar",
      state: "Jammu & Kashmir",
      country: "India",
      latitude: 34.0837,
      longitude: 74.7973,
    },
  });

  const locationFound = await prisma.location.create({
    data: {
      address: "Hazratbal, Srinagar",
      city: "Srinagar",
      state: "Jammu & Kashmir",
      country: "India",
      latitude: 34.1203,
      longitude: 74.8375,
    },
  });

  // Missing report
  const missingReport = await prisma.missingReport.create({
    data: {
      reporterId: volunteer.id,
      personName: "Amir Khan",
      age: 14,
      gender: Gender.MALE,
      description: "Last seen wearing a blue school uniform, carrying a red backpack.",
      lastSeenAt: new Date("2026-06-20T08:30:00Z"),
      locationId: locationMissing.id,
      status: ReportStatus.OPEN,
      contactName: "Fatima Khan",
      contactPhone: "+919876543210",
    },
  });

  // Report image for missing report
  await prisma.reportImage.create({
    data: {
      url: "https://example.com/images/amir-khan-school.jpg",
      missingReportId: missingReport.id,
    },
  });

  // Found report
  const foundReport = await prisma.foundReport.create({
    data: {
      reporterId: volunteer.id,
      age: 13,
      gender: Gender.MALE,
      description: "Young boy found near Hazratbal mosque, confused and distressed. Wearing a blue uniform.",
      foundAt: new Date("2026-06-21T14:00:00Z"),
      locationId: locationFound.id,
      status: ReportStatus.OPEN,
      contactName: "Priya Sharma",
      contactPhone: "+919812345678",
    },
  });

  // Report image for found report
  await prisma.reportImage.create({
    data: {
      url: "https://example.com/images/found-boy-hazratbal.jpg",
      foundReportId: foundReport.id,
    },
  });

  // Report audio for found report
  await prisma.reportAudio.create({
    data: {
      url: "https://example.com/audio/found-boy-description.mp3",
      durationSeconds: 42,
      foundReportId: foundReport.id,
    },
  });

  // Match suggestion
  const match = await prisma.matchSuggestion.create({
    data: {
      missingReportId: missingReport.id,
      foundReportId: foundReport.id,
      score: 0.87,
      status: MatchStatus.PENDING,
      suggestedById: coordinator.id,
      notes: "Same age, gender, and uniform description. Found location is 4 km from last seen location.",
    },
  });

  // Audit logs
  await prisma.auditLog.createMany({
    data: [
      {
        userId: volunteer.id,
        action: AuditAction.CREATED,
        entityType: EntityType.MISSING_REPORT,
        entityId: missingReport.id,
        missingReportId: missingReport.id,
      },
      {
        userId: volunteer.id,
        action: AuditAction.CREATED,
        entityType: EntityType.FOUND_REPORT,
        entityId: foundReport.id,
        foundReportId: foundReport.id,
      },
      {
        userId: coordinator.id,
        action: AuditAction.MATCH_SUGGESTED,
        entityType: EntityType.MATCH_SUGGESTION,
        entityId: match.id,
        missingReportId: missingReport.id,
        foundReportId: foundReport.id,
        metadata: { score: 0.87 },
      },
    ],
  });

  console.log("Seed complete.");
  console.log(`  Users:            volunteer (${volunteer.id}), coordinator (${coordinator.id})`);
  console.log(`  Locations:        ${locationMissing.id}, ${locationFound.id}`);
  console.log(`  MissingReport:    ${missingReport.id}`);
  console.log(`  FoundReport:      ${foundReport.id}`);
  console.log(`  MatchSuggestion:  ${match.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
