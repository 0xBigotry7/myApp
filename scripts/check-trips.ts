import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Get BABER user ID
  const baberUser = await prisma.user.findUnique({
    where: { email: "BABER" },
    select: { id: true, email: true, name: true },
  });
  
  console.log("BABER user:", baberUser);

  // Get all trips with owner details
  const trips = await prisma.trip.findMany({
    select: {
      id: true,
      name: true,
      ownerId: true,
      owner: {
        select: { email: true, name: true, id: true },
      },
      members: {
        select: {
          userId: true,
          user: {
            select: { email: true, name: true },
          },
        },
      },
    },
  });

  console.log("\nAll trips:");
  trips.forEach((trip) => {
    console.log(`\nTrip: ${trip.name}`);
    console.log(`  Owner ID: ${trip.ownerId}`);
    console.log(`  Owner: ${trip.owner.email} (${trip.owner.name})`);
    console.log(`  Members: ${trip.members.map((m) => `${m.user.email} (${m.user.userId})`).join(", ")}`);
  });

  // Check if BABER's trips would be found
  if (baberUser) {
    const baberTrips = await prisma.trip.findMany({
      where: {
        OR: [
          { ownerId: baberUser.id },
          { members: { some: { userId: baberUser.id } } }
        ]
      },
      select: {
        id: true,
        name: true,
      },
    });
    console.log(`\nTrips found for BABER (${baberUser.id}): ${baberTrips.length}`);
    baberTrips.forEach((t) => console.log(`  - ${t.name}`));
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

