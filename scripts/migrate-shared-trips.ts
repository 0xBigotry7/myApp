import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting shared trips migration...");

  try {
    // Step 1: Create TripMember table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "TripMember" (
        "id" TEXT NOT NULL,
        "tripId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "role" TEXT NOT NULL DEFAULT 'member',
        "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "TripMember_pkey" PRIMARY KEY ("id")
      )
    `);
    console.log("✅ Created TripMember table");

    // Step 2: Add ownerId column
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Trip" ADD COLUMN IF NOT EXISTS "ownerId" TEXT
    `);
    console.log("✅ Added ownerId column");

    // Step 3: Copy userId to ownerId
    await prisma.$executeRawUnsafe(`
      UPDATE "Trip" SET "ownerId" = "userId" WHERE "ownerId" IS NULL
    `);
    console.log("✅ Copied userId to ownerId");

    // Step 4: Make ownerId NOT NULL
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Trip" ALTER COLUMN "ownerId" SET NOT NULL
    `);
    console.log("✅ Set ownerId as NOT NULL");

    // Step 5: Create TripMember entries for existing trip owners
    await prisma.$executeRawUnsafe(`
      INSERT INTO "TripMember" ("id", "tripId", "userId", "role")
      SELECT
        gen_random_uuid()::text,
        t."id",
        t."ownerId",
        'owner'
      FROM "Trip" t
      LEFT JOIN "TripMember" tm ON tm."tripId" = t."id" AND tm."userId" = t."ownerId"
      WHERE tm."id" IS NULL
    `);
    console.log("✅ Created owner TripMember entries");

    // Step 6: Add other users as members to all trips
    await prisma.$executeRawUnsafe(`
      INSERT INTO "TripMember" ("id", "tripId", "userId", "role")
      SELECT
        gen_random_uuid()::text,
        t."id",
        u."id",
        'member'
      FROM "Trip" t
      CROSS JOIN "User" u
      WHERE u."id" != t."ownerId"
      AND NOT EXISTS (
        SELECT 1 FROM "TripMember" tm
        WHERE tm."tripId" = t."id" AND tm."userId" = u."id"
      )
    `);
    console.log("✅ Added all users as members to all trips");

    // Step 7: Drop userId column
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Trip" DROP COLUMN IF EXISTS "userId"
    `);
    console.log("✅ Dropped old userId column");

    // Step 8: Add constraints
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "TripMember_tripId_userId_key" ON "TripMember"("tripId", "userId")
    `);
    console.log("✅ Added unique constraint");

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Trip" DROP CONSTRAINT IF EXISTS "Trip_userId_fkey"
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Trip" ADD CONSTRAINT "Trip_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
    `);
    console.log("✅ Added Trip ownerId foreign key");

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "TripMember" ADD CONSTRAINT IF NOT EXISTS "TripMember_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "TripMember" ADD CONSTRAINT IF NOT EXISTS "TripMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
    `);
    console.log("✅ Added TripMember foreign keys");

    console.log("\n🎉 Migration completed successfully!");
    console.log("Both BABER and baber now have access to all trips!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
