import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning up unused users...");

  const emailsToDelete = ["you@example.com", "wife@example.com"];

  for (const email of emailsToDelete) {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (user) {
        // Check if user has any data
        const tripCount = await prisma.trip.count({ where: { ownerId: user.id } });
        const expenseCount = await prisma.expense.count({ where: { userId: user.id } });
        const postCount = await prisma.tripPost.count({ where: { userId: user.id } });

        if (tripCount > 0 || expenseCount > 0 || postCount > 0) {
          console.log(`Skipping user ${email} because they have associated data (Trips: ${tripCount}, Expenses: ${expenseCount}, Posts: ${postCount})`);
        } else {
          // Delete poker games first (no cascade on these relations)
          const pokerGames = await prisma.pokerGame.deleteMany({
            where: {
              OR: [
                { player1Id: user.id },
                { player2Id: user.id }
              ]
            }
          });
          if (pokerGames.count > 0) {
            console.log(`Deleted ${pokerGames.count} poker games for ${email}`);
          }

          // Delete associated records first if any (e.g. memberships)
          // Note: Relations with onDelete: Cascade will be handled automatically by Prisma/DB
          await prisma.user.delete({
            where: { id: user.id },
          });
          console.log(`Deleted user: ${email}`);
        }
      } else {
        console.log(`User ${email} not found.`);
      }
    } catch (error) {
      console.error(`Error processing ${email}:`, error);
    }
  }

  console.log("Cleanup complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
