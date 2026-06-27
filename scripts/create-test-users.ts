import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { hashPassword } from "../lib/password";

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log("Creating test users...");
  const passwordHash = await hashPassword("Password123");

  const roles = ["FAMILY", "VOLUNTEER", "SUPERVISOR", "POLICE"] as const;
  for (const role of roles) {
    const email = `${role.toLowerCase()}@example.com`;
    const user = await prisma.user.upsert({
      where: { email },
      update: { role, password: passwordHash },
      create: {
        email,
        name: `${role.charAt(0) + role.slice(1).toLowerCase()} User`,
        role,
        password: passwordHash,
        emailVerified: new Date(),
      },
    });
    console.log(`Created/updated user: ${user.email} with role ${user.role}`);
  }

  await prisma.$disconnect();
  await pool.end();
}

main().catch(console.error);
