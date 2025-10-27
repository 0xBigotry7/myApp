import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function backfillExpenseTransactions() {
  console.log("🔍 Checking for expenses without corresponding transactions...\n");

  // Get all expenses
  const expenses = await prisma.expense.findMany({
    include: {
      user: true,
      trip: true,
    },
    orderBy: { date: "asc" },
  });

  console.log(`Found ${expenses.length} total expenses\n`);

  // Get all trip-related transactions
  const tripTransactions = await prisma.transaction.findMany({
    where: { isTripRelated: true },
  });

  console.log(`Found ${tripTransactions.length} trip-related transactions\n`);

  // Group transactions by tripId and date for matching
  const transactionMap = new Map<string, Set<string>>();
  tripTransactions.forEach((txn) => {
    if (txn.tripId) {
      const key = `${txn.tripId}-${new Date(txn.date).toISOString()}-${txn.amount}`;
      if (!transactionMap.has(txn.tripId)) {
        transactionMap.set(txn.tripId, new Set());
      }
      transactionMap.get(txn.tripId)?.add(key);
    }
  });

  let created = 0;
  let skipped = 0;
  let noAccount = 0;

  for (const expense of expenses) {
    // Check if a transaction already exists for this expense
    const expenseKey = `${expense.tripId}-${new Date(expense.date).toISOString()}-${-expense.amount}`;
    const tripTxns = transactionMap.get(expense.tripId);

    if (tripTxns && tripTxns.has(expenseKey)) {
      console.log(`⏭️  Skipping expense ${expense.id} - transaction already exists`);
      skipped++;
      continue;
    }

    // Get user's account
    const account = await prisma.account.findFirst({
      where: { userId: expense.userId, isActive: true },
      orderBy: { createdAt: "asc" },
    });

    if (!account) {
      console.log(`⚠️  No account found for user ${expense.user.name} - creating default account`);

      // Create a default account for the user
      const newAccount = await prisma.account.create({
        data: {
          userId: expense.userId,
          name: "Main Account",
          type: "checking",
          balance: 0, // Will be adjusted by transactions
          currency: expense.currency || "USD",
          icon: "💳",
          color: "#3b82f6",
        },
      });

      // Create the transaction
      console.log(`✅ Creating transaction for expense ${expense.id} (${expense.trip.name} - ${expense.category} - $${expense.amount})`);

      await prisma.transaction.create({
        data: {
          userId: expense.userId,
          accountId: newAccount.id,
          amount: -Math.abs(expense.amount),
          category: expense.category || "Travel",
          description: expense.note || `Trip expense: ${expense.trip.name}`,
          date: expense.date,
          isTripRelated: true,
          tripId: expense.tripId,
          location: expense.trip.destination,
        },
      });

      // Update account balance
      await prisma.account.update({
        where: { id: newAccount.id },
        data: { balance: -Math.abs(expense.amount) },
      });

      created++;
      continue;
    }

    // Create the transaction
    console.log(`✅ Creating transaction for expense ${expense.id} (${expense.trip.name} - ${expense.category} - $${expense.amount})`);

    await prisma.transaction.create({
      data: {
        userId: expense.userId,
        accountId: account.id,
        amount: -Math.abs(expense.amount),
        category: expense.category || "Travel",
        description: expense.note || `Trip expense: ${expense.trip.name}`,
        date: expense.date,
        isTripRelated: true,
        tripId: expense.tripId,
        location: expense.trip.destination,
      },
    });

    // Update account balance
    await prisma.account.update({
      where: { id: account.id },
      data: { balance: account.balance - Math.abs(expense.amount) },
    });

    created++;
  }

  console.log("\n📊 Summary:");
  console.log(`✅ Created: ${created} transactions`);
  console.log(`⏭️  Skipped: ${skipped} (already exist)`);
  console.log(`⚠️  No account: ${noAccount} users without accounts`);
}

backfillExpenseTransactions()
  .then(() => {
    console.log("\n✅ Backfill complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
