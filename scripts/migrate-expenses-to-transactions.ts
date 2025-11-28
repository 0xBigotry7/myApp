/**
 * Migration Script: Migrate Expense records to Transaction records
 * 
 * This script migrates existing Expense records (from the legacy trip expense system)
 * to the unified Transaction model. It preserves all the rich trip-specific fields.
 * 
 * Run with: npx ts-node scripts/migrate-expenses-to-transactions.ts
 * Or: npx tsx scripts/migrate-expenses-to-transactions.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function migrateExpensesToTransactions() {
  console.log("Starting migration of Expenses to Transactions...\n");

  try {
    // Get all expenses that need to be migrated
    const expenses = await prisma.expense.findMany({
      include: {
        user: true,
        trip: true,
      },
    });

    console.log(`Found ${expenses.length} expenses to migrate.\n`);

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const expense of expenses) {
      try {
        // Check if a transaction already exists for this expense
        // (to avoid duplicate migrations)
        const existingTransaction = await prisma.transaction.findFirst({
          where: {
            userId: expense.userId,
            tripId: expense.tripId,
            amount: -expense.amount, // Expenses are negative in Transaction
            date: expense.date,
            category: expense.category,
          },
        });

        if (existingTransaction) {
          console.log(`Skipping expense ${expense.id} - already migrated`);
          skipped++;
          continue;
        }

        // Get user's default account
        const account = await prisma.account.findFirst({
          where: {
            userId: expense.userId,
            isActive: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        });

        if (!account) {
          console.log(`Skipping expense ${expense.id} - user has no active account`);
          skipped++;
          continue;
        }

        // Create the transaction
        await prisma.transaction.create({
          data: {
            userId: expense.userId,
            accountId: account.id,
            amount: -expense.amount, // Expenses are negative
            category: expense.category,
            description: expense.note || `Trip expense: ${expense.trip.name}`,
            date: expense.date,
            isTripRelated: true,
            tripId: expense.tripId,
            receiptUrl: expense.receiptUrl,
            location: expense.location,
            latitude: expense.latitude,
            longitude: expense.longitude,
            currency: expense.currency,
            // Transportation fields
            transportationMethod: expense.transportationMethod,
            fromLocation: expense.fromLocation,
            toLocation: expense.toLocation,
            transportationDistance: expense.transportationDistance,
            transportationDuration: expense.transportationDuration,
            ticketReference: expense.ticketReference,
            numberOfPassengers: expense.numberOfPassengers,
            // Accommodation fields
            accommodationName: expense.accommodationName,
            accommodationType: expense.accommodationType,
            checkInDate: expense.checkInDate,
            checkOutDate: expense.checkOutDate,
            numberOfNights: expense.numberOfNights,
            googlePlaceId: expense.googlePlaceId,
            hotelAddress: expense.hotelAddress,
            hotelPhone: expense.hotelPhone,
            hotelWebsite: expense.hotelWebsite,
            hotelRating: expense.hotelRating,
            hotelPhotos: expense.hotelPhotos || [],
            confirmationNumber: expense.confirmationNumber,
            // Food & Dining fields
            partySize: expense.partySize,
            mealType: expense.mealType,
            cuisineType: expense.cuisineType,
            restaurantName: expense.restaurantName,
            hasReservation: expense.hasReservation,
            // Activities fields
            activityType: expense.activityType,
            activityName: expense.activityName,
            activityDuration: expense.activityDuration,
            numberOfTickets: expense.numberOfTickets,
            activityReference: expense.activityReference,
            hasGuide: expense.hasGuide,
            // Shopping fields
            storeName: expense.storeName,
            shoppingCategory: expense.shoppingCategory,
            numberOfItems: expense.numberOfItems,
            hasReturnPolicy: expense.hasReturnPolicy,
            isGift: expense.isGift,
            giftRecipient: expense.giftRecipient,
            // Other fields
            otherSubcategory: expense.otherSubcategory,
            expenseRating: expense.expenseRating,
          },
        });

        console.log(`Migrated expense ${expense.id} (${expense.category}: ${expense.currency} ${expense.amount})`);
        migrated++;
      } catch (error) {
        console.error(`Error migrating expense ${expense.id}:`, error);
        errors++;
      }
    }

    console.log("\n=== Migration Summary ===");
    console.log(`Total expenses: ${expenses.length}`);
    console.log(`Successfully migrated: ${migrated}`);
    console.log(`Skipped (already migrated): ${skipped}`);
    console.log(`Errors: ${errors}`);

    if (migrated > 0) {
      console.log("\n⚠️  Note: The original Expense records have NOT been deleted.");
      console.log("Once you verify the migration is successful, you can optionally");
      console.log("delete the Expense records and remove the Expense model from schema.");
    }

  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateExpensesToTransactions()
  .then(() => {
    console.log("\nMigration completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });


