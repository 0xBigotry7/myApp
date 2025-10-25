import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Adding final foreign key constraints...");

  try {
    // Try to add the foreign keys (might already exist)
    try {
      await prisma.$executeRawUnsafe(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'TripMember_tripId_fkey'
          ) THEN
            ALTER TABLE "TripMember" ADD CONSTRAINT "TripMember_tripId_fkey"
            FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
          END IF;
        END$$;
      `);
      console.log("✅ Added TripMember tripId foreign key");
    } catch (e) {
      console.log("   TripMember tripId foreign key might already exist");
    }

    try {
      await prisma.$executeRawUnsafe(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'TripMember_userId_fkey'
          ) THEN
            ALTER TABLE "TripMember" ADD CONSTRAINT "TripMember_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
          END IF;
        END$$;
      `);
      console.log("✅ Added TripMember userId foreign key");
    } catch (e) {
      console.log("   TripMember userId foreign key might already exist");
    }

    console.log("\n🎉 Migration completed!");
  } catch (error) {
    console.error("❌ Error:", error);
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
