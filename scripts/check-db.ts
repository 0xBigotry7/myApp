import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Checking database contents...\n");

  // Check users
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
    },
  });
  console.log(`Found ${users.length} users:`);
  users.forEach((u) => {
    console.log(`  - ${u.email} (${u.name}) - ID: ${u.id}`);
  });

  // Check trips
  const trips = await prisma.trip.findMany({
    include: {
      owner: {
        select: { email: true, name: true },
      },
      members: {
        include: {
          user: {
            select: { email: true, name: true },
          },
        },
      },
      _count: {
        select: { transactions: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  console.log(`\nFound ${trips.length} trips:`);
  trips.forEach((trip) => {
    console.log(`  - ${trip.name} (${trip.destination})`);
    console.log(`    Owner: ${trip.owner.email} (${trip.owner.name})`);
    console.log(`    Members: ${trip.members.length}`);
    console.log(`    Transactions: ${trip._count.transactions}`);
    console.log(`    Budget: $${trip.totalBudget}`);
    console.log(`    Dates: ${trip.startDate.toISOString().split("T")[0]} to ${trip.endDate.toISOString().split("T")[0]}`);
  });

  // Check transactions
  const transactions = await prisma.transaction.findMany({
    select: {
      id: true,
      amount: true,
      category: true,
      tripId: true,
      userId: true,
      date: true,
    },
    take: 10,
    orderBy: { date: "desc" },
  });
  console.log(`\nFound ${transactions.length} transactions (showing first 10):`);
  transactions.forEach((tx) => {
    console.log(`  - $${tx.amount} (${tx.category}) - Trip: ${tx.tripId || "none"}`);
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
