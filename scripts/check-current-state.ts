import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Checking Current Database State ===\n");

  // Check users
  const users = await prisma.user.findMany({ select: { id: true, email: true, name: true } });
  console.log("Users:");
  users.forEach(u => console.log(`  - ${u.name} (${u.email}) - ID: ${u.id}`));

  // Check trips
  const trips = await prisma.trip.findMany({
    include: {
      owner: { select: { name: true } },
      members: { include: { user: { select: { name: true } } } }
    }
  });

  console.log("\nTrips:");
  trips.forEach(t => {
    console.log(`\n  Trip: ${t.name} (${t.destination})`);
    console.log(`    Owner: ${t.owner.name}`);
    console.log(`    Members: ${t.members.map(m => m.user.name).join(", ")}`);
  });

  // Check what each user can see
  console.log("\n=== Access Test ===");

  for (const user of users) {
    const userTrips = await prisma.trip.findMany({
      where: {
        OR: [
          { ownerId: user.id },
          { members: { some: { userId: user.id } } }
        ]
      },
      select: { name: true, destination: true }
    });

    console.log(`\n${user.name} can see ${userTrips.length} trips:`);
    userTrips.forEach(t => console.log(`  - ${t.name} (${t.destination})`));
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
