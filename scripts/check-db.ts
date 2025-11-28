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
        select: { expenses: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  console.log(`\nFound ${trips.length} trips:`);
  trips.forEach((trip) => {
    console.log(`  - ${trip.name} (${trip.destination})`);
    console.log(`    Owner: ${trip.owner.email} (${trip.owner.name})`);
    console.log(`    Members: ${trip.members.length}`);
    console.log(`    Expenses: ${trip._count.expenses}`);
    console.log(`    Budget: $${trip.totalBudget}`);
    console.log(`    Dates: ${trip.startDate.toISOString().split("T")[0]} to ${trip.endDate.toISOString().split("T")[0]}`);
  });

  // Check expenses
  const expenses = await prisma.expense.findMany({
    select: {
      id: true,
      amount: true,
      category: true,
      tripId: true,
      userId: true,
      date: true,
    },
    take: 10,
  });
  console.log(`\nFound ${expenses.length} expenses (showing first 10):`);
  expenses.forEach((exp) => {
    console.log(`  - $${exp.amount} (${exp.category}) - Trip: ${exp.tripId}`);
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

