import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const trips = await prisma.trip.findMany({
    select: {
      id: true,
      name: true,
      destination: true,
      destinationImageUrl: true,
      budgetImageUrl: true,
      itineraryImageUrl: true,
      expensesImageUrl: true,
    },
  });

  console.log("All trips and their image URLs:\n");

  for (const trip of trips) {
    console.log(`Trip: ${trip.name} (${trip.destination})`);
    console.log(`  Destination Image: ${trip.destinationImageUrl || "None"}`);
    console.log(`  Budget Image: ${trip.budgetImageUrl || "None"}`);
    console.log(`  Itinerary Image: ${trip.itineraryImageUrl || "None"}`);
    console.log(`  Expenses Image: ${trip.expensesImageUrl || "None"}`);
    console.log();
  }
}

main()
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
